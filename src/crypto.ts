// Cryptography utilities for client-side encryption of files uploaded to GitHub.
// Implementation notes:
// - Uses PBKDF2 (WebCrypto) to derive an AES-GCM key from a password and a per-repo random salt.
// - The encrypted blob format: ["GSE1" (4 bytes)] [version (1 byte)] [12 bytes IV] [ciphertext...]
// - IV is randomly generated per-encryption to ensure IND-CPA/nonce uniqueness for AES-GCM.
// - PBKDF2 parameters are reasonably high for a browser-based plugin; Argon2id would be preferred in a follow-up.
import * as argon2 from "argon2-wasm";
import * as scryptModule from "scrypt-js";

function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const u = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
	return u;
}

function bytesToBase64(bytes: Uint8Array): string {
	let s = "";
	const chunk = 8192;
	for (let i = 0; i < bytes.length; i += chunk) {
		s += String.fromCharCode(
			...(bytes.subarray(i, i + chunk) as unknown as number[]),
		);
	}
	return btoa(s);
}

// Helper to log key fingerprints for debugging
async function logKeyFingerprint(key: CryptoKey, name: string) {
	try {
		const raw = await crypto.subtle.exportKey("raw", key);
		const hex = Array.from(new Uint8Array(raw))
			.slice(0, 4)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		console.debug(`[GitHub Sync] Key Fingerprint [${name}]: ${hex}`);
	} catch (e) {
		console.debug(`[GitHub Sync] Could not export fingerprint for ${name}`);
	}
}

export async function deriveKeys(
	password: string,
	saltBase64: string,
): Promise<CryptoKey[]> {
	const enc = new TextEncoder();
	const saltBytes = base64ToBytes(saltBase64);
	const keys: CryptoKey[] = [];

	console.debug(
		`[GitHub Sync] Deriving keys. Password length: ${password.length}. Salt Bytes: ${Array.from(saltBytes).slice(0, 4).join(",")}...`,
	);

	// 1. Try Argon2id (WASM)
	try {
		const ares: any = await argon2.hash({
			pass: password,
			salt: Array.from(saltBytes),
			time: 3,
			mem: 65536,
			hashLen: 32,
			parallelism: 1,
			type: argon2.types ? argon2.types.Argon2id : 2,
		});
		const derived = new Uint8Array(ares.hash);
		const key = await crypto.subtle.importKey(
			"raw",
			derived,
			{ name: "AES-GCM" },
			true,
			["encrypt", "decrypt"],
		);
		await logKeyFingerprint(key, "Argon2id");
		keys.push(key);
	} catch (e) {
		console.warn("[GitHub Sync] argon2-wasm not available or failed:", e);
	}

	// 2. Try scrypt-js
	try {
		const scrypt = (scryptModule as any).scrypt || (scryptModule as any);
		const pwBytes = enc.encode(password);
		const derived = await scrypt(pwBytes, saltBytes, 16384, 8, 1, 32);
		const key = await crypto.subtle.importKey(
			"raw",
			new Uint8Array(derived),
			{ name: "AES-GCM" },
			true,
			["encrypt", "decrypt"],
		);
		await logKeyFingerprint(key, "scrypt");
		keys.push(key);
	} catch (e) {
		console.warn("[GitHub Sync] scrypt not available or failed:", e);
	}

	// 3. Try PBKDF2 (Native WebCrypto - guaranteed fallback)
	try {
		const keyMaterial = await crypto.subtle.importKey(
			"raw",
			enc.encode(password),
			{ name: "PBKDF2" },
			false,
			["deriveBits", "deriveKey"],
		);
		const key = await crypto.subtle.deriveKey(
			{ name: "PBKDF2", salt: saltBytes, iterations: 200_000, hash: "SHA-256" },
			keyMaterial,
			{ name: "AES-GCM", length: 256 },
			true,
			["encrypt", "decrypt"],
		);
		await logKeyFingerprint(key, "PBKDF2");
		keys.push(key);
	} catch (e) {
		console.warn("[GitHub Sync] PBKDF2 failed:", e);
	}

	return keys;
}

const MAGIC = new TextEncoder().encode("GSE1");
const VERSION = 1;

export function isEncryptedBuffer(content: ArrayBuffer | Uint8Array): boolean {
	const data =
		content instanceof Uint8Array ? content : new Uint8Array(content);
	if (data.length < MAGIC.length + 1) return false;
	for (let i = 0; i < MAGIC.length; i++) {
		if (data[i] !== MAGIC[i]) return false;
	}
	return true;
}

// Generate a deterministic salt based on the username and repo name.
// This ensures that the same salt is used for the same user/repo combination, allowing for consistent key derivation across sessions without storing the salt.
// static salt is worse than random, but we have to use it to allow remote devices to connect with only password as the salt would be deterministic
export async function getDeterministicSalt(username: string, repo: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`siyuan-github-sync:${username}/${repo}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    // Take the first 16 bytes for a standard salt length and convert to base64
    const saltBytes = new Uint8Array(hashBuffer).slice(0, 16);
    return bytesToBase64(saltBytes);
}

export async function encryptFile(
	content: ArrayBuffer,
	key: CryptoKey,
): Promise<ArrayBuffer> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		content,
	);
	const cBytes = new Uint8Array(ciphertext);
	const out = new Uint8Array(MAGIC.length + 1 + iv.length + cBytes.length);
	out.set(MAGIC, 0);
	out[MAGIC.length] = VERSION;
	out.set(iv, MAGIC.length + 1);
	out.set(cBytes, MAGIC.length + 1 + iv.length);
	return out.buffer;
}

export async function decryptFile(
	encryptedContent: ArrayBuffer,
	keys: CryptoKey[],
): Promise<ArrayBuffer> {
	const data = new Uint8Array(encryptedContent);
	const snippet = Array.from(data.slice(0, Math.min(24, data.length)))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join(" ");

	if (data.length < MAGIC.length + 1 + 12) {
		throw new Error(
			`Invalid encrypted data (too short). First bytes: ${snippet}`,
		);
	}

	for (let i = 0; i < MAGIC.length; i++) {
		if (data[i] !== MAGIC[i])
			throw new Error(`Invalid magic header. First bytes: ${snippet}`);
	}

	const version = data[MAGIC.length];
	if (version !== VERSION) {
		throw new Error(
			`Unsupported crypto version: ${version}. Expected ${VERSION}. First bytes: ${snippet}`,
		);
	}

	const ivStart = MAGIC.length + 1;
	const iv = data.slice(ivStart, ivStart + 12);
	const ciphertext = data.slice(ivStart + 12);

	console.debug(
		`[GitHub Sync] Decrypting payload. Total size: ${data.length} bytes, IV size: ${iv.length} bytes, Ciphertext size: ${ciphertext.length} bytes`,
	);

	let lastError = "";

	// Try decrypting with all available derived keys until one succeeds
	for (let k = 0; k < keys.length; k++) {
		try {
			return await crypto.subtle.decrypt(
				{ name: "AES-GCM", iv },
				keys[k],
				ciphertext,
			);
		} catch (e: any) {
			const errName = e?.name || "UnknownError";
			const errMsg = e?.message || "";
			lastError = `${errName}${errMsg ? ": " + errMsg : " (Authentication tag mismatch)"}`;
			console.debug(
				`[GitHub Sync] Decryption fallback attempt #${k + 1} failed: ${lastError}`,
			);
		}
	}

	throw new Error(
		`Decryption failed across all generated keys. Last error: ${lastError}. Header snippet: ${snippet}`,
	);
}

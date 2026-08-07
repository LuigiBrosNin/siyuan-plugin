import {
	SiYuanDirEntry,
	NotebookManifestEntry,
	FileToSync,
	SKIP_ROOT_DIRS,
	SKIP_PATH_FRAGMENTS,
} from "./types";

export async function siYuanReadDir(path: string): Promise<SiYuanDirEntry[]> {
	try {
		const res = await fetch("/api/file/readDir", {
			method: "POST",
			body: JSON.stringify({ path }),
		});
		const json = await res.json();
		return json.code === 0 && json.data ? json.data : [];
	} catch {
		return [];
	}
}

export async function siYuanGetFile(path: string): Promise<ArrayBuffer | null> {
	try {
		const res = await fetch("/api/file/getFile", {
			method: "POST",
			body: JSON.stringify({ path }),
		});
		return res.ok ? res.arrayBuffer() : null;
	} catch {
		return null;
	}
}

export async function siYuanPutFile(
	path: string,
	content: ArrayBuffer,
): Promise<boolean> {
	try {
		const fd = new FormData();
		fd.append("path", path);
		fd.append("file", new Blob([content]));
		const res = await fetch("/api/file/putFile", { method: "POST", body: fd });
		const json = await res.json();
		return json.code === 0;
	} catch {
		return false;
	}
}

export async function siYuanRefreshFiletree(): Promise<boolean> {
	try {
		const res = await fetch("/api/filetree/refreshFiletree", {
			method: "POST",
			body: "{}",
		});
		const json = await res.json();
		return json.code === 0;
	} catch {
		return false;
	}
}

export async function siYuanRemoveFile(path: string): Promise<boolean> {
	try {
		const res = await fetch("/api/file/removeFile", {
			method: "POST",
			body: JSON.stringify({ path }),
		});
		const json = await res.json();
		return json.code === 0;
	} catch {
		return false;
	}
}

export async function siYuanListNotebooks(): Promise<NotebookManifestEntry[]> {
	try {
		const res = await fetch("/api/notebook/lsNotebooks", {
			method: "POST",
			body: "{}",
		});
		const json = await res.json();
		if (json.code !== 0 || !json.data?.notebooks) return [];
		return json.data.notebooks.map((nb: any) => ({
			id: nb.id,
			name: nb.name || "",
		}));
	} catch {
		return [];
	}
}

export async function siYuanOpenNotebook(notebookId: string): Promise<boolean> {
	try {
		const res = await fetch("/api/notebook/openNotebook", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ notebook: notebookId }),
		});
		const json = await res.json();
		return json.code === 0;
	} catch {
		return false;
	}
}

export async function siYuanGetNotebookConf(notebookId: string): Promise<any> {
	try {
		const res = await fetch("/api/notebook/getNotebookConf", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ notebook: notebookId }),
		});
		const json = await res.json();
		return json.code === 0 ? json.data : null;
	} catch {
		return null;
	}
}

export async function siYuanSetNotebookConf(
	notebookId: string,
	conf: any,
): Promise<boolean> {
	try {
		const res = await fetch("/api/notebook/setNotebookConf", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ notebook: notebookId, conf }),
		});
		const json = await res.json();
		return json.code === 0;
	} catch {
		return false;
	}
}

export async function getCurrentAppearance(): Promise<{
	mode: number;
	themeLight: string;
	themeDark: string;
} | null> {
	try {
		const res = await fetch("/api/system/getConf", {
			method: "POST",
			body: "{}",
		});
		const json = await res.json();
		if (json.code !== 0 || !json.data?.appearance) return null;
		const a = json.data.appearance;
		return {
			mode: a.mode ?? 0,
			themeLight: a.themeLight ?? "",
			themeDark: a.themeDark ?? "",
		};
	} catch {
		return null;
	}
}

export async function setActiveTheme(
	themeDir: string,
	mode: number,
): Promise<boolean> {
	try {
		const confRes = await fetch("/api/system/getConf", {
			method: "POST",
			body: "{}",
		});
		const confJson = await confRes.json();
		if (confJson.code !== 0 || !confJson.data?.appearance) return false;
		const app = { ...confJson.data.appearance };
		if (mode === 0) app.themeLight = themeDir;
		else app.themeDark = themeDir;
		app.mode = mode;
		const res = await fetch("/api/setting/setAppearance", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ appearance: app }),
		});
		const json = await res.json();
		return json.code === 0;
	} catch {
		return false;
	}
}

export async function installSinglePlugin(
	pluginName: string,
): Promise<boolean> {
	try {
		const listRes = await fetch("/api/bazaar/getBazaarPlugin", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ frontend: "all", keyword: pluginName }),
		});
		const listJson = await listRes.json();
		if (listJson.code !== 0 || !listJson.data?.packages) return false;
		const pkg = listJson.data.packages.find((p: any) => p.name === pluginName);
		if (!pkg) return false;
		const installRes = await fetch("/api/bazaar/installBazaarPlugin", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				repoURL: pkg.repoURL,
				repoHash: pkg.repoHash,
				packageName: pkg.name,
				frontend: "all",
			}),
		});
		const installJson = await installRes.json();
		return installJson.code === 0;
	} catch {
		return false;
	}
}

export async function installSingleWidget(
	widgetName: string,
): Promise<boolean> {
	try {
		const listRes = await fetch("/api/bazaar/getBazaarWidget", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ keyword: widgetName }),
		});
		const listJson = await listRes.json();
		if (listJson.code !== 0 || !listJson.data?.packages) return false;
		const pkg = listJson.data.packages.find((p: any) => p.name === widgetName);
		if (!pkg) return false;
		const installRes = await fetch("/api/bazaar/installBazaarWidget", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				repoURL: pkg.repoURL,
				repoHash: pkg.repoHash,
				packageName: pkg.name,
			}),
		});
		const installJson = await installRes.json();
		return installJson.code === 0;
	} catch {
		return false;
	}
}

export async function installSingleTheme(
	themeName: string,
	mode = 0,
): Promise<boolean> {
	try {
		const listRes = await fetch("/api/bazaar/getBazaarTheme", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ keyword: themeName }),
		});
		const listJson = await listRes.json();
		if (listJson.code !== 0 || !listJson.data?.packages) return false;
		const pkg = listJson.data.packages.find((p: any) => p.name === themeName);
		if (!pkg) return false;
		const installRes = await fetch("/api/bazaar/installBazaarTheme", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				repoURL: pkg.repoURL,
				repoHash: pkg.repoHash,
				packageName: pkg.name,
				mode,
			}),
		});
		const installJson = await installRes.json();
		return installJson.code === 0;
	} catch {
		return false;
	}
}

export async function collectDir(
	siBase: string,
	ghBase: string,
): Promise<FileToSync[]> {
	const entries = await siYuanReadDir(siBase);
	const files: FileToSync[] = [];
	for (const e of entries) {
		const sp = siBase === "/" ? `/${e.name}` : `${siBase}/${e.name}`;
		const gp = ghBase ? `${ghBase}/${e.name}` : e.name;
		if (SKIP_ROOT_DIRS.includes(e.name)) continue;
		if (SKIP_PATH_FRAGMENTS.some((f) => sp.includes(f))) continue;
		if (e.isDir) files.push(...(await collectDir(sp, gp)));
		else files.push({ siYuanPath: sp, githubPath: gp });
	}
	return files;
}

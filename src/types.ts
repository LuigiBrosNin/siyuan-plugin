export const STORAGE_KEY = "github-sync-config.json";
export const GITHUB_API = "https://api.github.com";
export const SYNC_ROOT = "data";
export const MAX_FILE_BYTES = 25_000_000;

export const SKIP_ROOT_DIRS = [
	"plugins",
	"conf",
	".siyuan",
	"!storage/av",
	"storage/*",
	"emojis",
	"public",
	"templates",
	"widgets",
	"siyuan-github-sync",
	"history",
];

export const SKIP_PATH_FRAGMENTS = [".git/", "/temp/"];
export const LOCKED_EXTENSIONS = [".db", ".db-shm", ".db-wal", ".log", ".lock"];

export const SYNCED_STATE_KEY = "github-sync-state.json";
export const PLUGIN_MANIFEST_PATH = `${SYNC_ROOT}/plugin-manifest.json`;
export const WIDGET_MANIFEST_PATH = `${SYNC_ROOT}/widget-manifest.json`;
export const THEME_MANIFEST_PATH = `${SYNC_ROOT}/theme-manifest.json`;
export const NOTEBOOK_MANIFEST_FILE = "notebook.json";
export const PLUGIN_SELF_NAME = "siyuan-github-sync";

export interface GitHubConfig {
	username: string;
	repo: string;
	token: string;
	groqKey: string;
	showDiff: boolean;
	language?: string;
	lastSync?: number;
	encryptionPassword?: string;
}

export const DEFAULT_CONFIG: GitHubConfig = {
	username: "",
	repo: "",
	token: "",
	groqKey: "",
	showDiff: true,
	language: "en",
};

export interface SiYuanDirEntry {
	name: string;
	isDir: boolean;
	updated: number;
}
export interface GitHubTreeItem {
	path: string;
	mode: string;
	type: "blob" | "tree";
	sha: string;
	size?: number;
}
export interface FileToSync {
	siYuanPath: string;
	githubPath: string;
}
export interface SyncedState {
	commitSha: string;
	files: Record<string, string>;
}
export interface MergePlan {
	toUpload: { githubPath: string; siYuanPath: string }[];
	toReuse: { githubPath: string; sha: string }[];
	toDelete: { githubPath: string }[];
	toPull: { githubPath: string; siYuanPath: string }[];
	conflicted: { githubPath: string; siYuanPath: string }[];
	skippedLarge: number;
}
export interface PluginManifestEntry {
	name: string;
	version: string;
}
export interface PluginManifest {
	plugins: PluginManifestEntry[];
}
export interface NotebookManifestEntry {
	id: string;
	name: string;
}
export interface ManifestFile {
	githubPath: string;
	content: ArrayBuffer;
}

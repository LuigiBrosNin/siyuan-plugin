import {
    PluginManifest, PluginManifestEntry, NotebookManifestEntry, GitHubTreeItem, ManifestFile,
    SYNC_ROOT, NOTEBOOK_MANIFEST_FILE, PLUGIN_MANIFEST_PATH, WIDGET_MANIFEST_PATH, PLUGIN_SELF_NAME,
} from "./types";
import { siYuanReadDir, siYuanGetFile, siYuanListNotebooks, siYuanGetNotebookConf, siYuanOpenNotebook, siYuanSetNotebookConf, installSinglePlugin, installSingleWidget } from "./siyuan-api";
import { GitHubAPI } from "./github-api";
import { sleep } from "./utils";

export async function collectInstalledPlugins(): Promise<PluginManifest> {
    const entries = await siYuanReadDir(`${SYNC_ROOT}/plugins`);
    const plugins: PluginManifestEntry[] = [];
    for (const e of entries) {
        if (!e.isDir || e.name === PLUGIN_SELF_NAME) continue;
        try {
            const raw = await siYuanGetFile(`${SYNC_ROOT}/plugins/${e.name}/plugin.json`);
            if (!raw) continue;
            const text = new TextDecoder().decode(raw);
            const json = JSON.parse(text);
            if (json.name && json.version) {
                plugins.push({ name: json.name, version: json.version });
            }
        } catch { continue; }
    }
    return { plugins };
}

export async function generatePluginManifest(): Promise<ManifestFile> {
    const manifest = await collectInstalledPlugins();
    const json = JSON.stringify(manifest, null, 2);
    const content = new TextEncoder().encode(json).buffer;
    return { githubPath: PLUGIN_MANIFEST_PATH, content };
}

export async function installMissingPlugins(
    remoteManifest: PluginManifest,
    onProgress?: (pct: number, status: string, details: string) => void,
): Promise<number> {
    const local = await collectInstalledPlugins();
    const localMap = new Map(local.plugins.map(p => [p.name, p.version]));
    const toInstall = remoteManifest.plugins.filter(p =>
        p.name !== PLUGIN_SELF_NAME && !localMap.has(p.name)
    );
    if (toInstall.length === 0) return 0;

    let installed = 0;
    for (let i = 0; i < toInstall.length; i++) {
        const p = toInstall[i];
        if (onProgress) onProgress(
            90 + Math.round((i / toInstall.length) * 10),
            `Installation plugin : ${i + 1}/${toInstall.length}`,
            p.name
        );
        const ok = await installSinglePlugin(p.name);
        if (ok) installed++;
        await sleep(200);
    }
    return installed;
}

export async function collectInstalledWidgets(): Promise<PluginManifest> {
    const entries = await siYuanReadDir(`${SYNC_ROOT}/widgets`);
    const plugins: PluginManifestEntry[] = [];
    for (const e of entries) {
        if (!e.isDir) continue;
        try {
            const raw = await siYuanGetFile(`${SYNC_ROOT}/widgets/${e.name}/widget.json`);
            if (!raw) continue;
            const text = new TextDecoder().decode(raw);
            const json = JSON.parse(text);
            if (json.name && json.version) {
                plugins.push({ name: json.name, version: json.version });
            }
        } catch { continue; }
    }
    return { plugins };
}

export async function generateWidgetManifest(): Promise<ManifestFile> {
    const manifest = await collectInstalledWidgets();
    const json = JSON.stringify(manifest, null, 2);
    const content = new TextEncoder().encode(json).buffer;
    return { githubPath: WIDGET_MANIFEST_PATH, content };
}

export async function installMissingWidgets(
    remoteManifest: PluginManifest,
    onProgress?: (pct: number, status: string, details: string) => void,
): Promise<number> {
    const local = await collectInstalledWidgets();
    const localMap = new Map(local.plugins.map(p => [p.name, p.version]));
    const toInstall = remoteManifest.plugins.filter(p => !localMap.has(p.name));
    if (toInstall.length === 0) return 0;

    let installed = 0;
    for (let i = 0; i < toInstall.length; i++) {
        const p = toInstall[i];
        if (onProgress) onProgress(
            90 + Math.round((i / toInstall.length) * 10),
            `Installation widget : ${i + 1}/${toInstall.length}`,
            p.name
        );
        const ok = await installSingleWidget(p.name);
        if (ok) installed++;
        await sleep(200);
    }
    return installed;
}

export async function collectNotebookManifests(): Promise<NotebookManifestEntry[]> {
    const notebooks = await siYuanListNotebooks();
    const entries: NotebookManifestEntry[] = [];
    for (const nb of notebooks) {
        const conf = await siYuanGetNotebookConf(nb.id);
        const name = conf?.conf?.name || conf?.name || nb.name;
        if (name) entries.push({ id: nb.id, name });
    }
    return entries;
}

export async function generateNotebookManifests(): Promise<ManifestFile[]> {
    const notebooks = await collectNotebookManifests();
    return notebooks.map(nb => {
        const json = JSON.stringify({ id: nb.id, name: nb.name }, null, 2);
        const content = new TextEncoder().encode(json).buffer;
        return { githubPath: `${SYNC_ROOT}/${nb.id}/${NOTEBOOK_MANIFEST_FILE}`, content };
    });
}

export async function processNotebookManifests(
    remoteItems: GitHubTreeItem[],
    github: GitHubAPI,
    onProgress?: (pct: number, status: string, details: string) => void,
): Promise<number> {
    const manifestItems = remoteItems.filter(i =>
        i.type === "blob" &&
        i.path.startsWith(`${SYNC_ROOT}/`) &&
        i.path.endsWith(`/${NOTEBOOK_MANIFEST_FILE}`)
    );
    if (manifestItems.length === 0) return 0;

    let processed = 0;
    for (let i = 0; i < manifestItems.length; i++) {
        const item = manifestItems[i];
        const notebookId = item.path.split("/")[1];
        if (!notebookId) continue;

        if (onProgress) onProgress(
            90 + Math.round((i / manifestItems.length) * 10),
            `Carnet : ${i + 1}/${manifestItems.length}`,
            notebookId
        );

        const content = await github.downloadFile(item.path);
        if (!content) continue;

        try {
            const manifest: NotebookManifestEntry = JSON.parse(new TextDecoder().decode(content));
            if (!manifest.name) continue;

            await siYuanOpenNotebook(notebookId);
            const confData = await siYuanGetNotebookConf(notebookId);
            if (confData?.conf) {
                confData.conf.name = manifest.name;
                await siYuanSetNotebookConf(notebookId, confData.conf);
            }
            processed++;
            await sleep(50);
        } catch { continue; }
    }
    return processed;
}

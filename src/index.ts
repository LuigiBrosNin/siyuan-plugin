import {
    Plugin,
    Setting,
    showMessage,
} from "siyuan";
import "./index.scss";
import {
    GitHubConfig, DEFAULT_CONFIG, STORAGE_KEY,
    SYNC_ROOT, SYNCED_STATE_KEY, MergePlan, FileToSync, ManifestFile,
    MAX_FILE_BYTES, SKIP_ROOT_DIRS, SKIP_PATH_FRAGMENTS, LOCKED_EXTENSIONS,
    PLUGIN_MANIFEST_PATH, WIDGET_MANIFEST_PATH, THEME_MANIFEST_PATH,
} from "./types";
import {
    calculateGitSha, sleep, arrayBufferToBase64, encodePath,
    friendlyError, extractTextFromSyFile, generateCommitMessage,
} from "./utils";
import { GitHubAPI } from "./github-api";
import {
    siYuanGetFile, siYuanPutFile, siYuanRefreshFiletree,
    siYuanRemoveFile, collectDir,
} from "./siyuan-api";
import {
    generatePluginManifest, generateWidgetManifest, generateThemeManifest, generateNotebookManifests,
    installMissingPlugins, installMissingWidgets, installMissingThemes, processNotebookManifests,
} from "./manifests";
import { SyncProgressUI, showDiffDialog } from "./ui";
import { HistoryDialog } from "./history";
import { t, setLocale, availableLocales, getLocale, langs } from "./i18n";

export default class GitHubSyncPlugin extends Plugin {
    private config: GitHubConfig = { ...DEFAULT_CONFIG };
    private activeTask: "push" | "pull" | null = null;
    private currentUI: SyncProgressUI | null = null;
    private lastProgress = { percent: 0, status: t('status.initializing'), details: "", finished: false, error: false, message: "" };
    private statusBarEl: HTMLElement | null = null;

    async onload() {
        this.addIcons(`<symbol id="iconGitHubUpload" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 13v-4H8l4-4 4 4h-3v4h-2z"/></symbol><symbol id="iconGitHubDownload" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 7v4h3l-4 4-4-4h3V9h2z"/></symbol><symbol id="iconGitHistory" viewBox="0 0 24 24"><path fill="currentColor" d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></symbol>`);
        const saved = await this.loadData(STORAGE_KEY);
        if (saved) this.config = { ...DEFAULT_CONFIG, ...saved };
        // apply saved locale
        try { setLocale(this.config.language ?? "fr"); (window as any).__github_sync_locale = getLocale(); } catch {}
        this.registerSettings();
        this.addTopBar({ icon: "iconGitHubUpload", title: t('top.push_title'), position: "right", callback: () => this.handlePushClick() });
        this.addTopBar({ icon: "iconGitHubDownload", title: t('top.pull_title'), position: "right", callback: () => this.handlePullClick() });
        this.addTopBar({ icon: "iconGitHistory", title: t('top.history_title'), position: "right", callback: () => this.handleHistoryClick() });
        setTimeout(() => this.attachToStatusBar(), 1000);
    }

    private attachToStatusBar() {
        const old = document.getElementById("siyuan-github-sync-status");
        if (old) old.remove();

        const tryAttach = (parent: Element) => {
            this.statusBarEl = document.createElement("span");
            this.statusBarEl.id = "siyuan-github-sync-status";
            this.statusBarEl.style.cssText = "font-size:11px;opacity:.65;margin:0 8px;color:var(--b3-theme-on-background);";
            this.updateStatusBar();
            parent.appendChild(this.statusBarEl);
            return true;
        };

        const target = document.querySelector("#statusBar #status") || document.querySelector("#statusBar");
        if (target && tryAttach(target)) return;

        this.statusBarEl = document.createElement("div");
        this.statusBarEl.id = "siyuan-github-sync-status";
        this.statusBarEl.style.cssText = "position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:9999;font-size:11px;opacity:.65;pointer-events:none;color:var(--b3-theme-on-background);line-height:24px;";
        this.updateStatusBar();
        document.body.appendChild(this.statusBarEl);
    }

    private updateStatusBar() {
        if (!this.statusBarEl) return;
        const loaded = this.config.lastSync;
        if (loaded) {
            const d = new Date(loaded);
            const hh = String(d.getHours()).padStart(2, "0");
            const mm = String(d.getMinutes()).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            const mo = String(d.getMonth()+1).padStart(2, "0");
            this.statusBarEl.textContent = `☁️ ${dd}/${mo} ${hh}:${mm}`;
        } else {
            this.statusBarEl.textContent = "☁️ Sync";
        }
    }

    private async saveSyncTimestamp() {
        this.config.lastSync = Date.now();
        this.updateStatusBar();
        await this.saveData(STORAGE_KEY, this.config);
    }

    private registerSettings() {
        const uIn = this.mkInput(t('setting.github_user'), this.config.username);
        const rIn = this.mkInput(t('setting.github_repo'), this.config.repo);
        const tIn = this.mkInput(t('setting.github_token'), this.config.token, "password");
        const gIn = this.mkInput(t('setting.groq_key'), this.config.groqKey, "password");
        const dIn = document.createElement("input");
        dIn.type = "checkbox";
        dIn.checked = this.config.showDiff;
        dIn.style.cssText = "width:16px;height:16px;cursor:pointer;margin:0;";
        const tBtn = document.createElement("button");
        tBtn.className = "b3-button b3-button--outline fn__block";
        tBtn.textContent = t('button.test_github');
        tBtn.onclick = async () => {
            tBtn.disabled = true;
            const api = new GitHubAPI(tIn.value.trim(), uIn.value, rIn.value);
            if (await api.testConnection()) showMessage(t('status.ok')); else showMessage(t('status.error'), 6000, "error");
            tBtn.disabled = false;
        };

        const eBtn = document.createElement("button");
        eBtn.className = "b3-button b3-button--outline fn__block";
        eBtn.textContent = t('button.export');
        eBtn.onclick = () => {
            const hasToken = !!tIn.value.trim();
            const hasGroq = !!gIn.value.trim();
            const warnParts: string[] = [];
            if (hasToken) warnParts.push(t('part.the') + "GitHub token");
            if (hasGroq) warnParts.push(t('part.the') + "the Groq API key");
            if (warnParts.length > 0) {
                const ok = confirm(`${t('msg.export_warning_prefix')} ${warnParts.join(t('part.and'))}{t('part.export_warning_suffix')}`);
                if (!ok) return;
            }
            const cfg = { username: uIn.value.trim(), repo: rIn.value.trim(), token: tIn.value.trim(), groqKey: gIn.value.trim(), showDiff: dIn.checked, language: (this.config && this.config.language) || 'fr' };
            const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "siyuan-github-sync-config.json";
            a.click();
            URL.revokeObjectURL(a.href);
            showMessage(t('msg.config_exported'));
        };

        const iBtn = document.createElement("button");
        iBtn.className = "b3-button b3-button--outline fn__block";
        iBtn.textContent = t('button.import');
        iBtn.onclick = () => {
            const fi = document.createElement("input");
            fi.type = "file";
            fi.accept = ".json";
            fi.onchange = async () => {
                const file = fi.files?.[0];
                if (!file) return;
                try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    if (!data.username || !data.repo || !data.token) { showMessage("❌ Invalid file", 6000, "error"); return; }
                    uIn.value = data.username; rIn.value = data.repo; tIn.value = data.token;
                    gIn.value = data.groqKey || ""; dIn.checked = !!data.showDiff;
                    if (data.language) { try { setLocale(data.language); } catch {} }
                    showMessage(t('msg.config_loaded'));
                } catch { showMessage(t('error.invalid_file'), 6000, "error"); }
            };
            fi.click();
        };

        const btnRow = document.createElement("div");
        btnRow.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;";
        btnRow.appendChild(tBtn); btnRow.appendChild(eBtn); btnRow.appendChild(iBtn);
        this.setting = new Setting({
            confirmCallback: async () => {
                this.config = { username: uIn.value.trim(), repo: rIn.value.trim(), token: tIn.value.trim(), groqKey: gIn.value.trim(), showDiff: dIn.checked, language: this.config.language || 'fr' };
                await this.saveData(STORAGE_KEY, this.config);
                showMessage(t('msg.saved'));
            }
        });
        // language selector
        const langSelect = document.createElement("select");
        langSelect.className = "b3-select fn__block";
        const _langLabels: Record<string, string> = langs;
        for (const loc of availableLocales()) {
            const opt = document.createElement("option");
            opt.value = loc; opt.textContent = _langLabels[loc] || loc;
            langSelect.appendChild(opt);
        }
        langSelect.value = this.config.language || getLocale();
        langSelect.onchange = () => { this.config.language = langSelect.value; try { setLocale(langSelect.value); (window as any).__github_sync_locale = getLocale(); } catch {} };

        this.setting.addItem({ title: t('setting.github_user'), createActionElement: () => uIn });
        this.setting.addItem({ title: t('setting.github_repo'), createActionElement: () => rIn });
        this.setting.addItem({ title: t('setting.github_token'), createActionElement: () => tIn });
        this.setting.addItem({ title: t('setting.groq_key'), createActionElement: () => gIn });
        this.setting.addItem({ title: t('setting.show_diff'), createActionElement: () => dIn });
        this.setting.addItem({ title: t('setting.language'), createActionElement: () => langSelect });
        this.setting.addItem({ title: t('setting.actions'), createActionElement: () => btnRow });
    }

    private mkInput(ph: string, val: string, type = "text") {
        const el = document.createElement("input");
        el.className = "b3-text-field fn__block";
        el.placeholder = ph; el.value = val; el.type = type;
        return el;
    }

    // ── Actions UI ───────────────────────────────────────────────────────────

    private handlePushClick() {
        if (this.activeTask === "pull") { showMessage(t('action.push')); return; }
        if (this.activeTask === "push") { this.showProgressUI("push"); return; }
        this.pushToGitHub();
    }

    private handlePullClick() {
        if (this.activeTask === "push") { showMessage(t('action.pull')); return; }
        if (this.activeTask === "pull") { this.showProgressUI("pull"); return; }
        this.pullFromGitHub();
    }

    private showProgressUI(type: "push" | "pull") {
        if (this.currentUI && !this.currentUI.isDestroyed) return;
        this.currentUI = new SyncProgressUI(type === "push" ? t('top.push_title') : t('top.pull_title'), () => { this.currentUI = null; });
        if (this.lastProgress.finished) {
            if (this.lastProgress.error) this.currentUI.error(this.lastProgress.message);
            else this.currentUI.finish(this.lastProgress.message);
        } else {
            this.currentUI.update(this.lastProgress.percent, this.lastProgress.status, this.lastProgress.details);
        }
    }

    private updateProgress(percent: number, status: string, details: string) {
        this.lastProgress = { ...this.lastProgress, percent, status, details };
        if (this.currentUI) this.currentUI.update(percent, status, details);
    }

    private async loadSyncedState(): Promise<{ commitSha: string; files: Record<string, string> } | null> {
        try {
            const data = await this.loadData(SYNCED_STATE_KEY);
            return data || null;
        } catch { return null; }
    }

    private async saveSyncedState(commitSha: string, files: Record<string, string>) {
        await this.saveData(SYNCED_STATE_KEY, { commitSha, files });
    }

    // ── Smart Delta Sync ─────────────────────────────────────────────────────

    private async mergeBeforePush(
        localFiles: FileToSync[],
        remoteMap: Map<string, string>,
        lastCommitSha: string,
    ): Promise<MergePlan> {
        const synced = await this.loadSyncedState();
        const syncedFiles = synced?.files || {};
        const plan: MergePlan = { toUpload: [], toReuse: [], toDelete: [], toPull: [], conflicted: [], skippedLarge: 0 };

        const localPathSet = new Set(localFiles.map(f => f.githubPath));
        let processed = 0;
        let skippedLarge = 0;

        for (const f of localFiles) {
            const content = await siYuanGetFile(f.siYuanPath);
            if (!content) { processed++; continue; }
            if (content.byteLength > MAX_FILE_BYTES) { processed++; skippedLarge++; continue; }

            const localSha = await calculateGitSha(content);
            const remoteSha = remoteMap.get(f.githubPath);
            const syncedSha = syncedFiles[f.githubPath];

            if (localSha === remoteSha) {
                plan.toReuse.push({ githubPath: f.githubPath, sha: remoteSha });
            } else if (!remoteSha) {
                // Store path reference only
                plan.toUpload.push({ githubPath: f.githubPath, siYuanPath: f.siYuanPath });
            } else if (!syncedSha || localSha !== syncedSha) {
                if (remoteSha !== syncedSha) {
                    plan.conflicted.push({ githubPath: f.githubPath, siYuanPath: f.siYuanPath });
                } else {
                    // Store path reference only
                    plan.toUpload.push({ githubPath: f.githubPath, siYuanPath: f.siYuanPath });
                }
            } else {
                plan.toPull.push({ githubPath: f.githubPath, siYuanPath: f.siYuanPath });
            }

            processed++;
            this.updateProgress(
                5 + Math.round((processed / localFiles.length) * 70),
                `${t('progress.analysis')} : ${processed}/${localFiles.length}`,
                f.siYuanPath
            );
            if (processed % 5 === 0) await sleep(20);
        }

        for (const [path] of remoteMap) {
            if (path.startsWith(SYNC_ROOT) && !localPathSet.has(path)) {
                plan.toDelete.push({ githubPath: path });
            }
        }

        plan.skippedLarge = skippedLarge;
        return plan;
    }

    // ── Push ─────────────────────────────────────────────────────────────────

    private async pushToGitHub() {
        if (!this.config.token) return showMessage(t('msg.configure_plugin'));
        this.activeTask = "push";
        this.lastProgress = { percent: 0, status: t('progress.analysis'), details: "Checking SHAs...", finished: false, error: false, message: "" };
        this.showProgressUI("push");

        try {
            const api = new GitHubAPI(this.config.token, this.config.username, this.config.repo);
            const localFiles = await collectDir("/", SYNC_ROOT);
            const pluginManifest = await generatePluginManifest();
            const manifestSha = await calculateGitSha(pluginManifest.content);
            const widgetManifest = await generateWidgetManifest();
            const widgetManifestSha = await calculateGitSha(widgetManifest.content);
            const themeManifest = await generateThemeManifest();
            const themeManifestSha = await calculateGitSha(themeManifest.content);
            const notebookManifests = await generateNotebookManifests();
            const repoInfo = await (await api.getRepoInfo()).json();
            const branch = repoInfo.default_branch || "main";

            let lastCommitSha: string | null = null;
            let remoteMap = new Map<string, string>();

            const refRes = await api.getRef(branch);
            if (refRes.ok) {
                const refData = await refRes.json();
                lastCommitSha = refData.object.sha;
                const lastCommit = await (await api.getCommit(lastCommitSha)).json();
                const remoteTree = await api.getRemoteTree(lastCommit.tree.sha);
                remoteTree.forEach(item => { if (item.type === "blob") remoteMap.set(item.path, item.sha); });
            }

            this.updateProgress(5, t('merge.status'), t('merge.compare'));
            const plan = await this.mergeBeforePush(localFiles, remoteMap, lastCommitSha || "");

            const remoteManifestSha = remoteMap.get(PLUGIN_MANIFEST_PATH);
            const manifestChanged = remoteManifestSha !== manifestSha;

            const remoteWidgetManifestSha = remoteMap.get(WIDGET_MANIFEST_PATH);
            const widgetManifestChanged = remoteWidgetManifestSha !== widgetManifestSha;

            const remoteThemeManifestSha = remoteMap.get(THEME_MANIFEST_PATH);
            const themeManifestChanged = remoteThemeManifestSha !== themeManifestSha;

            let notebookManifestsChanged = false;
            for (const nm of notebookManifests) {
                const remoteNMSha = remoteMap.get(nm.githubPath);
                const localNMSha = await calculateGitSha(nm.content);
                if (remoteNMSha !== localNMSha) { notebookManifestsChanged = true; break; }
            }

            for (const pull of plan.toPull) {
                const remoteContent = await api.downloadFile(pull.githubPath, lastCommitSha || undefined);
                if (remoteContent) await siYuanPutFile(pull.siYuanPath, remoteContent);
                plan.toReuse.push({ githubPath: pull.githubPath, sha: remoteMap.get(pull.githubPath) });
            }

            const totalChanges = plan.toUpload.length + plan.toDelete.length;
            if (totalChanges === 0 && plan.conflicted.length === 0 && !manifestChanged && !widgetManifestChanged && !themeManifestChanged && !notebookManifestsChanged) {
                const newFilesState: Record<string, string> = {};
                for (const r of plan.toReuse) newFilesState[r.githubPath] = r.sha;
                await this.saveSyncedState(lastCommitSha || "", newFilesState);
                const msg = plan.conflicted.length
                    ? t('msg.no_changes_conflicts').replace('{n}', String(plan.conflicted.length))
                    : t('msg.no_changes_none');
                this.lastProgress = { ...this.lastProgress, finished: true, message: msg };
                if (this.currentUI) this.currentUI.finish(msg);
                return;
            }

            if (!lastCommitSha) {
                if (this.config.showDiff) { const ok = await showDiffDialog(plan); if (!ok) { if (this.currentUI) this.currentUI.destroy(); this.activeTask = null; return; } }
                await this.pushInitialCommit(plan, branch, pluginManifest, widgetManifest, themeManifest, notebookManifests, api);
                return;
            }

            if (this.config.showDiff) { const ok = await showDiffDialog(plan); if (!ok) { if (this.currentUI) this.currentUI.destroy(); this.activeTask = null; return; } }

            const treeItems: any[] = [];
            for (const r of plan.toReuse) treeItems.push({ path: r.githubPath, mode: "100644", type: "blob", sha: r.sha });

            const uploadedSummaries: { path: string; content: string }[] = [];
            for (let i = 0; i < plan.toUpload.length; i++) {
                const u = plan.toUpload[i];
                this.updateProgress(10 + Math.round((i / plan.toUpload.length) * 75), `Upload : ${i + 1}/${plan.toUpload.length}`, u.githubPath);

                // LAZY LOAD: Fetch file from SiYuan only at the exact moment of upload
                // avoid keeping potentially large files in RAM
                const content = await siYuanGetFile(u.siYuanPath);
                if (!content) continue;

                const blobRes = await api.createBlob(arrayBufferToBase64(content));
                if (!blobRes.ok) {
                    console.error(`[GitHub Sync] Blob failed for ${u.githubPath}:`, await blobRes.text());
                    continue;
                }
                await sleep(1000);
                const blobData = await blobRes.json();
                treeItems.push({ path: u.githubPath, mode: "100644", type: "blob", sha: blobData.sha });
                uploadedSummaries.push({ path: u.githubPath, content: extractTextFromSyFile(content) });
                // 'content' variable falls out of scope here, freeing RAM.
            }

            for (const d of plan.toDelete) {
                treeItems.push({ path: d.githubPath, mode: "100644", sha: null });
                uploadedSummaries.push({ path: d.githubPath, content: t('msg.file_deleted') });
            }

            this.updateProgress(85, t('progress.upload_plugin_manifest'), PLUGIN_MANIFEST_PATH);
            const manifestBlobRes = await api.createBlob(arrayBufferToBase64(pluginManifest.content));
            if (manifestBlobRes.ok) {
                const manifestBlobData = await manifestBlobRes.json();
                treeItems.push({ path: PLUGIN_MANIFEST_PATH, mode: "100644", type: "blob", sha: manifestBlobData.sha });
            }

            this.updateProgress(87, t('progress.upload_widget_manifest'), WIDGET_MANIFEST_PATH);
            const widgetManifestBlobRes = await api.createBlob(arrayBufferToBase64(widgetManifest.content));
            if (widgetManifestBlobRes.ok) {
                const widgetManifestBlobData = await widgetManifestBlobRes.json();
                treeItems.push({ path: WIDGET_MANIFEST_PATH, mode: "100644", type: "blob", sha: widgetManifestBlobData.sha });
            }

            this.updateProgress(88, t('progress.upload_theme_manifest'), THEME_MANIFEST_PATH);
            const themeManifestBlobRes = await api.createBlob(arrayBufferToBase64(themeManifest.content));
            if (themeManifestBlobRes.ok) {
                const themeManifestBlobData = await themeManifestBlobRes.json();
                treeItems.push({ path: THEME_MANIFEST_PATH, mode: "100644", type: "blob", sha: themeManifestBlobData.sha });
            }

            let notebooksUploaded = 0;
            for (const nm of notebookManifests) {
                this.updateProgress(88, `Upload manifeste carnet (${++notebooksUploaded}/${notebookManifests.length})...`, nm.githubPath);
                const nmBlobRes = await api.createBlob(arrayBufferToBase64(nm.content));
                if (nmBlobRes.ok) {
                    const nmBlobData = await nmBlobRes.json();
                    treeItems.push({ path: nm.githubPath, mode: "100644", type: "blob", sha: nmBlobData.sha });
                }
            }

            this.updateProgress(90, t('progress.finalizing'), t('progress.creating_tree'));
            const baseTreeRes = await api.getCommit(lastCommitSha);
            const baseTreeData = await baseTreeRes.json();
            const treeRes = await api.createTree(baseTreeData.tree.sha, treeItems);
            const treeData = await treeRes.json();

            const aiMsg = await generateCommitMessage(this.config.groqKey, uploadedSummaries);
            const commitMsg = aiMsg || `Sync : +${plan.toUpload.length}, ~${plan.toReuse.length}, -${plan.toDelete.length}, ↕${plan.toPull.length} pull(s)`;
            const commitRes = await api.createCommit(commitMsg, treeData.sha, [lastCommitSha]);
            const commitData = await commitRes.json();

            await api.updateRef(branch, commitData.sha);

            const newFilesState: Record<string, string> = {};
            for (const r of plan.toReuse) newFilesState[r.githubPath] = r.sha;
            for (const u of plan.toUpload) {
                const uploadedSha = treeItems.find(t => t.path === u.githubPath)?.sha;
                if (uploadedSha) newFilesState[u.githubPath] = uploadedSha;
            }
            await this.saveSyncedState(commitData.sha, newFilesState);

            const parts: string[] = [];
            if (plan.toUpload.length) parts.push(`${plan.toUpload.length} ${t('stat.sent')}`);
            if (plan.toPull.length) parts.push(`${plan.toPull.length} ${t('stat.pulled')}`);
            if (plan.toDelete.length) parts.push(`${plan.toDelete.length} ${t('stat.deleted')}`);
            if (plan.toReuse.length) parts.push(`${plan.toReuse.length} ${t('stat.unchanged')}`);
            let msg = `${t('msg.push_done_prefix')} ${parts.join(", ")}.`;
            if (plan.skippedLarge) msg += ` ⚠️ ${plan.skippedLarge} ${t('msg.skipped_files')}`;
          if (plan.conflicted.length) {
                const conflictNote = t('msg.conflicts_unresolved').replace('{n}', String(plan.conflicted.length));
                msg += conflictNote;
            }
            this.lastProgress = { ...this.lastProgress, finished: true, message: msg };
            if (this.currentUI) this.currentUI.finish(msg);
            await this.saveSyncTimestamp();
        } catch (e) {
            this.lastProgress = { ...this.lastProgress, finished: true, error: true, message: friendlyError(e) };
            if (this.currentUI) this.currentUI.error(friendlyError(e));
        } finally { this.activeTask = null; }
    }

    private async pushInitialCommit(
        plan: MergePlan, branch: string,
        pluginManifest: ManifestFile, widgetManifest: ManifestFile,
        themeManifest: ManifestFile,
        notebookManifests: ManifestFile[], api: GitHubAPI,
    ) {
        let uploaded = 0;
        const total = plan.toUpload.length;
        let errors = 0;
        const treeItems: any[] = [];

        // 1. Upload Blobs lazily
        for (const u of plan.toUpload) {
            this.updateProgress(10 + Math.round((uploaded / Math.max(total, 1)) * 80), `Upload : ${uploaded + 1}/${total}`, u.githubPath);

            const content = await siYuanGetFile(u.siYuanPath);
            if (!content) continue;

            const blobRes = await api.createBlob(arrayBufferToBase64(content));
            if (blobRes.ok) {
                const blobData = await blobRes.json();
                treeItems.push({ path: u.githubPath, mode: "100644", type: "blob", sha: blobData.sha });
                uploaded++;
            } else {
                errors++;
            }
            await sleep(1000);
        }

        // 2. Upload Manifest Blobs
        const manifests = [pluginManifest, widgetManifest, themeManifest, ...notebookManifests];
        for (const m of manifests) {
            const mRes = await api.createBlob(arrayBufferToBase64(m.content));
            if (mRes.ok) {
                const mData = await mRes.json();
                treeItems.push({ path: m.githubPath, mode: "100644", type: "blob", sha: mData.sha });
            } else {
                errors++;
            }
        }

        // 3. Create a single Tree and Commit
        if (treeItems.length > 0) {
            this.updateProgress(90, t('progress.finalizing'), t('progress.creating_tree'));
            const treeRes = await api.createTree("", treeItems); // Base tree empty for initial
            const treeData = await treeRes.json();

            const commitRes = await api.createCommit("Sync init", treeData.sha, []); // No parents for initial commit
            const commitData = await commitRes.json();

            await api.updateRef(branch, commitData.sha);

            const newFilesState: Record<string, string> = {};
            treeItems.forEach(item => { newFilesState[item.path] = item.sha; });
            await this.saveSyncedState(commitData.sha, newFilesState);
        }

        let msg = t('msg.push_initial_done').replace('{n}', String(uploaded));
        if (errors > 0) msg += t('msg.errors_occurred').replace('{n}', String(errors));

        this.lastProgress = { ...this.lastProgress, finished: true, message: msg };
        if (this.currentUI) this.currentUI.finish(msg);
    }

    // ── Pull ─────────────────────────────────────────────────────────────────

    private async pullFromGitHub() {
        if (!this.config.token) return showMessage(t('msg.configure_plugin'));
        this.activeTask = "pull";
        this.lastProgress = { percent: 0, status: t('progress.analysis'), details: t('progress.reading_remote'), finished: false, error: false, message: "" };
        this.showProgressUI("pull");

        try {
            const api = new GitHubAPI(this.config.token, this.config.username, this.config.repo);
            const repoInfo = await (await api.getRepoInfo()).json();
            const branch = repoInfo.default_branch || "main";

            const refRes = await api.getRef(branch);
            if (!refRes.ok) {
                const msg = t('msg.repo_empty');
                this.lastProgress = { ...this.lastProgress, finished: true, message: msg };
                if (this.currentUI) this.currentUI.finish(msg);
                return;
            }
            const refData = await refRes.json();
            const lastCommit = await (await api.getCommit(refData.object.sha)).json();
            const remoteItems = (await api.getRemoteTree(lastCommit.tree.sha)).filter(i => {
                if (i.type !== "blob") return false;
                const p = i.path;
                if (p.startsWith("data/")) {
                    const rest = p.slice(5);
                    const firstSegment = rest.split("/")[0];
                    if (SKIP_ROOT_DIRS.includes(firstSegment)) return false;
                }
                return p.startsWith(SYNC_ROOT);
            });

            let updated = 0, skipped = 0, errors = 0;
            for (let i = 0; i < remoteItems.length; i++) {
                const item = remoteItems[i];
                const siPath = item.path.slice(SYNC_ROOT.length).replace(/^\//, "");
                this.updateProgress(Math.round((i / remoteItems.length) * 100), `Pull : ${i + 1}/${remoteItems.length}`, siPath);

                if (LOCKED_EXTENSIONS.some(ext => siPath.toLowerCase().endsWith(ext)) || siPath.includes("/temp/") || SKIP_PATH_FRAGMENTS.some(f => siPath.includes(f))) {
                    skipped++; continue;
                }

                if (siPath.endsWith(".siyuan.sy")) { skipped++; continue; }

                const localContent = await siYuanGetFile(siPath);
                const localSha = localContent ? await calculateGitSha(localContent) : "";

                if (localSha === item.sha) {
                    skipped++;
                } else {
                    const content = await api.downloadFile(item.path);
                    if (content && content.byteLength > 0) {
                        const ok = await siYuanPutFile(siPath, content);
                        if (ok) { updated++; }
                        else { errors++; console.error(`[GitHub Sync] Write Failed: ${siPath}`); }
                    } else {
                        errors++;
                        console.error(`[GitHub Sync] Load Failed: ${item.path}`);
                    }
                }
                await sleep(30);
            }

            await siYuanRefreshFiletree();

            const onProgress = (pct: number, status: string, details: string) => this.updateProgress(pct, status, details);

            let pluginsInstalled = 0;
            const manifestItem = remoteItems.find(i => i.path === PLUGIN_MANIFEST_PATH);
            if (manifestItem) {
                const manifestContent = await api.downloadFile(manifestItem.path);
                if (manifestContent) {
                    try {
                        const manifest = JSON.parse(new TextDecoder().decode(manifestContent));
                        pluginsInstalled = await installMissingPlugins(manifest, onProgress);
                    } catch { /* ignore */ }
                }
            }

            let widgetsInstalled = 0;
            const widgetManifestItem = remoteItems.find(i => i.path === WIDGET_MANIFEST_PATH);
            if (widgetManifestItem) {
                const widgetManifestContent = await api.downloadFile(widgetManifestItem.path);
                if (widgetManifestContent) {
                    try {
                        const wManifest = JSON.parse(new TextDecoder().decode(widgetManifestContent));
                        widgetsInstalled = await installMissingWidgets(wManifest, onProgress);
                    } catch { /* ignore */ }
                }
            }

            let themesInstalled = 0;
            const themeManifestItem = remoteItems.find(i => i.path === THEME_MANIFEST_PATH);
            if (themeManifestItem) {
                const themeManifestContent = await api.downloadFile(themeManifestItem.path);
                if (themeManifestContent) {
                    try {
                        const tManifest = JSON.parse(new TextDecoder().decode(themeManifestContent));
                        themesInstalled = await installMissingThemes(tManifest, onProgress);
                    } catch { /* ignore */ }
                }
            }

            let notebooksProcessed = 0;
            try {
                notebooksProcessed = await processNotebookManifests(remoteItems, api, onProgress);
                await siYuanRefreshFiletree();
            } catch { /* ignore */ }

            const localFilesForDelete = await collectDir("/", SYNC_ROOT);
            const remotePathSet = new Set(remoteItems.map(i => i.path));
            let deleted = 0;
            for (const lf of localFilesForDelete) {
                if (LOCKED_EXTENSIONS.some(ext => lf.githubPath.toLowerCase().endsWith(ext)) ||
                    lf.githubPath.endsWith(".siyuan.sy")) continue;
                if (!remotePathSet.has(lf.githubPath) && !remotePathSet.has(lf.githubPath.replace(/^\//, ""))) {
                    const ok = await siYuanRemoveFile(lf.siYuanPath);
                    if (ok) deleted++;
                }
            }

            const newFilesState: Record<string, string> = {};
            remoteItems.forEach(item => { newFilesState[item.path] = item.sha; });
            await this.saveSyncedState(refData.object.sha, newFilesState);

            let msg = t('msg.pull_done').replace('{updated}', String(updated)).replace('{skipped}', String(skipped)).replace('{deleted}', String(deleted));
            if (pluginsInstalled > 0) msg += ` ${t('msg.plugins_installed').replace('{n}', String(pluginsInstalled))}`;
            if (widgetsInstalled > 0) msg += ` ${t('msg.widgets_installed').replace('{n}', String(widgetsInstalled))}`;
            if (themesInstalled > 0) msg += ` ${t('msg.themes_installed').replace('{n}', String(themesInstalled))}`;
            if (notebooksProcessed > 0) msg += ` ${t('msg.notebooks_processed').replace('{n}', String(notebooksProcessed))}`;
            if (errors > 0) msg += ` ${t('msg.errors').replace('{n}', String(errors))}`;
            this.lastProgress = { ...this.lastProgress, finished: true, message: msg };
            if (this.currentUI) this.currentUI.finish(msg, false);
            await this.saveSyncTimestamp();
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            this.lastProgress = { ...this.lastProgress, finished: true, error: true, message: friendlyError(e) };
            if (this.currentUI) this.currentUI.error(friendlyError(e));
        } finally { this.activeTask = null; }
    }

    // ── Historique & Restauration ──────────────────────────────────────────

    private async handleHistoryClick() {
        if (!this.config.token) return showMessage(t('msg.configure_plugin'));
        new HistoryDialog(
            () => this.getHistory(),
            (sha: string, msg: string) => this.restoreCommit(sha, msg),
        );
    }

    async getHistory(): Promise<any[]> {
        const api = new GitHubAPI(this.config.token, this.config.username, this.config.repo);
        return api.getCommits();
    }

    async restoreCommit(sha: string, message: string) {
        const api = new GitHubAPI(this.config.token, this.config.username, this.config.repo);
        const commitRes = await api.getCommit(sha);
        if (!commitRes.ok) throw new Error(t('error.cannot_fetch_commit') || "Cannot fetch commit");
        const commitData = await commitRes.json();
        const treeItems = await api.getRemoteTree(commitData.tree.sha);
        const blobs = treeItems.filter(i =>
            i.type === "blob" && i.path.startsWith(SYNC_ROOT) &&
            !i.path.startsWith("data/plugins/siyuan-github-sync/")
        );

        let updated = 0;
        for (const item of blobs) {
            const siPath = item.path.slice(SYNC_ROOT.length).replace(/^\//, "");
            if (LOCKED_EXTENSIONS.some(ext => siPath.toLowerCase().endsWith(ext)) ||
                siPath.includes("/temp/") || SKIP_PATH_FRAGMENTS.some(f => siPath.includes(f)) ||
                siPath.endsWith(".siyuan.sy")) continue;

            let writePath = siPath;
            if (isThemePath(item.path)) {
                writePath = themeGithubToLocal(item.path);
            }

            const content = await api.downloadFile(item.path, sha);
            if (content && content.byteLength > 0) {
                await siYuanPutFile(writePath, content);
                updated++;
            }
            await sleep(30);
        }

        await siYuanRefreshFiletree();

        try {
            const notebooksProcessed = await processNotebookManifests(treeItems, api);
            if (notebooksProcessed > 0) await siYuanRefreshFiletree();
        } catch { /* ignore */ }

        const newFilesState: Record<string, string> = {};
        treeItems.forEach(item => { if (item.type === "blob") newFilesState[item.path] = item.sha; });
        await this.saveSyncedState(sha, newFilesState);

        showMessage(t('msg.restored').replace('{n}', String(updated)).replace('{sha}', sha.slice(0,7)).replace('{message}', message));
        setTimeout(() => window.location.reload(), 1500);
    }
}

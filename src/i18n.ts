type LocaleMap = { [key: string]: string };

export const langs: Record<string, string> = {
  fr: 'Français',
  en: 'English',
  zh: '中文',
};

const locales: Record<string, LocaleMap> = {
  fr: {
    'status.initializing': 'Initialisation...',
    'status.ok': '✅ OK',
    'status.error': '❌ Erreur',

    'top.push_title': '⏫ Smart Push (Incrémental)',
    'top.pull_title': '⏬ Smart Pull (Incrémental)',
    'top.history_title': '📜 Historique des commits',

    'setting.github_user': 'GitHub Utilisateur',
    'setting.github_repo': 'GitHub Dépôt',
    'setting.github_token': 'GitHub Token PAT',
    'setting.groq_key': 'Clé API Groq (optionnel)',
    'setting.show_diff': 'Afficher le diff avant push',
    'setting.actions': 'Actions',
    'setting.language': 'Langue (requiert un redémarrage)',

    'button.test_github': '🔍 Tester GitHub',
    'button.export': '📤 Exporter',
    'button.import': '📥 Importer',
    'button.close': 'Fermer',
    'button.refresh': '🔄 Rafraîchir',
    'button.restore': 'Restaurer',

    'msg.export_warning_prefix': '⚠️ Attention : le fichier exporté contiendra',
    'msg.config_exported': '✅ Config exportée',
    'msg.config_loaded': '✅ Config chargée. Appuie sur Enregistrer.',
    'msg.saved': '✅ Enregistré',
    'msg.configure_plugin': '⚠️ Configurez le plugin.',

    'part.the': 'le ',
    'part.and': ' et ',
    'part.export_warning_suffix': ' en clair.\nNe partagez pas ce fichier.',

    'progress.analysis': 'Analyse...',
    'progress.reading_remote': 'Lecture du dépôt distant...',

    'diff.title': '📋 Résumé avant envoi',
    'diff.send': '✅ Envoyer',
    'diff.cancel': '❌ Annuler',
    'diff.no_changes': 'Aucun changement détecté',

    'ui.done': '✅ Terminé',
    'ui.error': '❌ Error',

    'history.no_commits': 'Aucun commit trouvé.',
    'history.loading': 'Chargement...',
    'history.restore_failed': '❌ Restauration échouée :',

    'error.token_invalid': '❌ Token GitHub invalide ou expiré. Va dans Paramètres → génère un nouveau token.',
    'error.repo_not_found': '❌ Dépôt GitHub introuvable. Vérifie le nom du dépôt dans Paramètres.',
    'error.no_internet': '❌ Pas de connexion internet. Vérifie ta connexion.',
    'error.rate_limit': '❌ Limite d\'appels API GitHub atteinte. Réessaie dans 1 minute.',
    'error.request_aborted': '❌ Requête annulée (timeout). Réessaie.',
    'error.file_too_large': '❌ Fichier trop volumineux (>25 Mo). Ignoré.',
    'error.invalid_file': '❌ Fichier invalide.',


    'merge.status': 'Merge...',
    'merge.compare': 'Comparaison local / distant / dernière sync...',
    'msg.no_changes_conflicts': 'Aucun changement à envoyer. ⚠️ {n} conflit(s) ignoré(s).',
    'msg.no_changes_none': "Tout est déjà à jour ! Aucun envoi nécessaire.",
    'msg.file_deleted': '(fichier supprimé)',
    'progress.upload_plugin_manifest': 'Upload manifeste plugins...',
    'progress.upload_widget_manifest': 'Upload manifeste widgets...',
    'progress.upload_theme_manifest': 'Upload manifeste thèmes...',
    'progress.finalizing': 'Finalisation...',
    'progress.creating_tree': 'Création de l\'arbre...',
    'stat.sent': 'envoyé(s)',
    'stat.pulled': 'récupéré(s)',
    'stat.deleted': 'supprimé(s)',
    'stat.unchanged': 'inchangé(s)',
    'msg.push_done_prefix': 'Push terminé —',
    'msg.push_initial_done': 'Push initial terminé — {n} fichiers envoyés.',
    'msg.repo_empty': 'Le dépôt est vide. Faites un Push d\'abord.',
    'msg.skipped_files': 'fichier(s) ignoré(s) (>25 Mo)',
    'msg.conflicts_unresolved': 'conflit(s) non résolu(s) (modifié des 2 côtés)',

    'install.plugin_prefix': 'Installation plugin :',
    'install.widget_prefix': 'Installation widget :',
    'install.theme_prefix': 'Installation thème :',
    'notebook.prefix': 'Carnet :',
    'msg.pull_done': 'Pull terminé : {updated} fichiers mis à jour, {skipped} déjà à jour ou protégés, {deleted} supprimé(s).',
    'msg.plugins_installed': '🔌 {n} plugin(s) installé(s).',
    'msg.widgets_installed': '🧩 {n} widget(s) installé(s).',
    'msg.themes_installed': '🎨 {n} thème(s) installé(s).',
    'msg.notebooks_processed': '📓 {n} carnet(s) ouvert(s).',
    'msg.errors': '⚠️ {n} erreur(s): Ouvrez les outils de développement pour afficher les détails (ctrl+shift+i) .',
    'msg.restored': '✅ Restauré : {n} fichiers (commit: {sha} — {message})',

    'action.push': '⚠️ Push en cours...',
    'action.pull': '⚠️ Pull en cours...',
  },
  en: {
    'status.initializing': 'Initializing...',
    'status.ok': '✅ OK',
    'status.error': '❌ Error',

    'top.push_title': '⏫ Smart Push (Incremental)',
    'top.pull_title': '⏬ Smart Pull (Incremental)',
    'top.history_title': '📜 Commit history',

    'setting.github_user': 'GitHub User',
    'setting.github_repo': 'GitHub Repo',
    'setting.github_token': 'GitHub Token PAT',
    'setting.groq_key': 'Groq API Key (optional)',
    'setting.show_diff': 'Show diff before push',
    'setting.actions': 'Actions',
    'setting.language': 'Language (requires restart)',

    'button.test_github': '🔍 Test GitHub',
    'button.export': '📤 Export',
    'button.import': '📥 Import',
    'button.close': 'Close',
    'button.refresh': '🔄 Refresh',
    'button.restore': 'Restore',

    'msg.export_warning_prefix': '⚠️ Warning: exported file will contain',
    'msg.config_exported': '✅ Config exported',
    'msg.config_loaded': '✅ Config loaded. Press Save.',
    'msg.saved': '✅ Saved',
    'msg.configure_plugin': '⚠️ Configure the plugin.',

    'part.the': 'the ',
    'part.and': ' and ',
    'part.export_warning_suffix': ' in cleartext.\nDo not share this file.',

    'progress.analysis': 'Analysis...',
    'progress.reading_remote': 'Reading remote repository...',

    'diff.title': '📋 Summary before push',
    'diff.send': '✅ Send',
    'diff.cancel': '❌ Cancel',
    'diff.no_changes': 'No changes detected',

    'ui.done': '✅ Done',
    'ui.error': '❌ Error',

    'history.no_commits': 'No commits found.',
    'history.loading': 'Loading...',
    'history.restore_failed': '❌ Restore failed:',

    'error.token_invalid': '❌ GitHub token invalid or expired. Go to Settings → generate a new token.',
    'error.repo_not_found': '❌ GitHub repository not found. Check the repository name in Settings.',
    'error.no_internet': '❌ No internet connection. Check your network.',
    'error.rate_limit': '❌ GitHub API rate limit reached. Try again in 1 minute.',
    'error.request_aborted': '❌ Request aborted (timeout). Try again.',
    'error.file_too_large': '❌ File too large (>25 MB). Ignored.',
    'error.invalid_file': '❌ Invalid file.',

    'merge.status': 'Merge...',
    'merge.compare': 'Compare local / remote / last sync...',
    'msg.no_changes_conflicts': 'No changes to send. ⚠️ {n} conflict(s) ignored.',
    'msg.no_changes_none': 'Everything is already up to date! Nothing to send.',
    'msg.file_deleted': '(file deleted)',
    'progress.upload_plugin_manifest': 'Upload plugin manifest...',
    'progress.upload_widget_manifest': 'Upload widget manifest...',
    'progress.upload_theme_manifest': 'Upload theme manifest...',
    'progress.finalizing': 'Finalizing...',
    'progress.creating_tree': 'Creating tree...',
    'stat.sent': 'sent',
    'stat.pulled': 'pulled',
    'stat.deleted': 'deleted',
    'stat.unchanged': 'unchanged',
    'msg.push_done_prefix': 'Push completed —',
    'msg.push_initial_done': 'Initial push completed — {n} files sent.',
    'msg.repo_empty': 'Repository is empty. Do a Push first.',
    'msg.skipped_files': 'file(s) skipped (>25 MB)',
    'msg.conflicts_unresolved': 'conflict(s) unresolved (modified on both sides)',

    'install.plugin_prefix': 'Installing plugin :',
    'install.widget_prefix': 'Installing widget :',
    'install.theme_prefix': 'Installing theme :',
    'notebook.prefix': 'Notebook :',

    'msg.pull_done': 'Pull completed : {updated} files updated, {skipped} skipped, {deleted} deleted.',
    'msg.plugins_installed': '🔌 {n} plugin(s) installed.',
    'msg.widgets_installed': '🧩 {n} widget(s) installed.',
    'msg.themes_installed': '🎨 {n} theme(s) installed.',
    'msg.notebooks_processed': '📓 {n} notebook(s) opened.',
    'msg.errors': '⚠️ {n} error(s): Open dev tools to see details (ctrl+shift+i).',
    'msg.restored': '✅ Restored: {n} files (commit: {sha} — {message})',

    'action.push': '⚠️ Push in progress...',
    'action.pull': '⚠️ Pull in progress...',

  },
  zh: {
    'status.initializing': '初始化中...',
    'status.ok': '✅ 正常',
    'status.error': '❌ 错误',

    'top.push_title': '⏫ 智能推送 (增量)',
    'top.pull_title': '⏬ 智能拉取 (增量)',
    'top.history_title': '📜 提交历史',

    'setting.github_user': 'GitHub 用户名',
    'setting.github_repo': 'GitHub 仓库',
    'setting.github_token': 'GitHub Token PAT',
    'setting.groq_key': 'Groq API 密钥 (可选)',
    'setting.show_diff': '推送前显示差异',
    'setting.actions': '操作',
    'setting.language': '语言 (需要重启)',

    'button.test_github': '🔍 测试 GitHub',
    'button.export': '📤 导出',
    'button.import': '📥 导入',
    'button.close': '关闭',
    'button.refresh': '🔄 刷新',
    'button.restore': '恢复',

    'msg.export_warning_prefix': '⚠️ 警告：导出的文件将包含',
    'msg.config_exported': '✅ 配置已导出',
    'msg.config_loaded': '✅ 配置已加载。请点击保存。',
    'msg.saved': '✅ 已保存',
    'msg.configure_plugin': '⚠️ 请配置插件。',

    'part.the': '',
    'part.and': ' 和 ',
    'part.export_warning_suffix': ' 的明文。\n请勿分享此文件。',

    'progress.analysis': '分析中...',
    'progress.reading_remote': '读取远程仓库...',

    'diff.title': '📋 推送前摘要',
    'diff.send': '✅ 发送',
    'diff.cancel': '❌ 取消',
    'diff.no_changes': '未检测到更改',

    'ui.done': '✅ 完成',
    'ui.error': '❌ 错误',

    'history.no_commits': '未找到提交。',
    'history.loading': '加载中...',
    'history.restore_failed': '❌ 恢复失败：',

    'error.token_invalid': '❌ GitHub token 无效或已过期。请前往设置 → 生成新 token。',
    'error.repo_not_found': '❌ 未找到 GitHub 仓库。请检查设置中的仓库名称。',
    'error.no_internet': '❌ 无网络连接。请检查您的网络。',
    'error.rate_limit': '❌ 达到 GitHub API 速率限制。请在 1 分钟后重试。',
    'error.request_aborted': '❌ 请求已中止 (超时)。请重试。',
    'error.file_too_large': '❌ 文件过大 (>25 MB)。已忽略。',
    'error.invalid_file': '❌ 无效文件。',

    'merge.status': '合并中...',
    'merge.compare': '比较本地 / 远程 / 上次同步...',
    'msg.no_changes_conflicts': '没有要发送的更改。⚠️ 已忽略 {n} 个冲突。',
    'msg.no_changes_none': '一切都已是最新！无需发送。',
    'msg.file_deleted': '(文件已删除)',
    'progress.upload_plugin_manifest': '上传插件清单...',
    'progress.upload_widget_manifest': '上传小组件清单...',
    'progress.upload_theme_manifest': '上传主题清单...',
    'progress.finalizing': '正在完成...',
    'progress.creating_tree': '创建树中...',
    'stat.sent': '已发送',
    'stat.pulled': '已拉取',
    'stat.deleted': '已删除',
    'stat.unchanged': '未更改',
    'msg.push_done_prefix': '推送完成 —',
    'msg.push_initial_done': '初始推送完成 — 已发送 {n} 个文件。',
    'msg.repo_empty': '仓库为空。请先执行推送。',
    'msg.skipped_files': '个文件已跳过 (>25 MB)',
    'msg.conflicts_unresolved': '个冲突未解决 (双方都作了修改)',

    'install.plugin_prefix': '正在安装插件：',
    'install.widget_prefix': '正在安装小组件：',
    'install.theme_prefix': '正在安装主题：',
    'notebook.prefix': '笔记本：',

    'msg.pull_done': '拉取完成：已更新 {updated} 个文件，跳过 {skipped} 个文件，删除 {deleted} 个文件。',
    'msg.plugins_installed': '🔌 已安装 {n} 个插件。',
    'msg.widgets_installed': '🧩 已安装 {n} 个小组件。',
    'msg.themes_installed': '🎨 已安装 {n} 个主题。',
    'msg.notebooks_processed': '📓 已打开 {n} 个笔记本。',
    'msg.errors': '⚠️ {n} 个错误：打开开发者工具以查看详细信息 (Ctrl+Shift+I)。',
    'msg.restored': '✅ 已恢复：{n} 个文件 (提交：{sha} — {message})',

    'action.push': '⚠️ 推送中...',
    'action.pull': '⚠️ 拉取中...',
  }
};

let current = 'fr';

export function t(key: string): string {
  const map = locales[current] || {};
  return map[key] ?? key;
}

export function getLocale(): string { return current; }
export function setLocale(l: string) { if (locales[l]) current = l; }

export function availableLocales(): string[] { return Object.keys(locales); }

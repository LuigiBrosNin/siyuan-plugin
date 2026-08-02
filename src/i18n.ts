type LocaleMap = { [key: string]: string };

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
    'setting.language': 'Langue',

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
    'msg.errors': '⚠️ {n} erreur(s).',
    'msg.restored': '✅ Restauré : {n} fichiers (commit: {sha} — {message})',
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
    'setting.language': 'Language',

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
    'msg.errors': '⚠️ {n} error(s).',
    'msg.restored': '✅ Restored: {n} files (commit: {sha} — {message})',

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

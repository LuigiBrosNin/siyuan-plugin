# SiYuan GitHub Sync Plugin

Synchronisez vos notes SiYuan avec un dépôt GitHub privé via l'API REST GitHub. Compatible **Windows, Linux, macOS et Android**.

## Fonctionnalites

### Synchronisation des donnees
- **Push incrémental** — Envoie uniquement les fichiers modifies
- **Pull incrémental** — Recupere les fichiers distants modifies
- **Merge automatique** — Fusion 3-way avant push (local / distant / dernier etat connu)
- **Gestion des conflits** — Priorite locale en cas de conflit

### Synchronisation des plugins et widgets
- **Sync des plugins** — Un manifeste (`plugin-manifest.json`) est push avec les donnees contenant la liste de tous les plugins installes (nom + version)
- **Sync des widgets** — Un manifeste (`widget-manifest.json`) est push avec les donnees contenant la tous les widgets installes
- **Installation automatique** — Au pull, les plugins/widgets manquants sont installes automatiquement depuis le marketplace officiel SiYuan
- **Exclusion du plugin de sync** — `siyuan-github-sync` n'est jamais inclus dans les manifestes ni installe/supprime

### Historique et restauration
- **Historique** — Consulte les 30 derniers commits
- **Restauration** — Restaure un commit depuis l'historique
- **Diff avant push** — Affiche les fichiers ajoutes/modifies/supprimes avant d'envoyer

### Autres
- **Sécurise** — Token stocke localement via `saveData()`
- **Groq AI** — Messages de commit generes automatiquement (optionnel)
- **Export/Import** — Sauvegarde et restaure la configuration

## Installation

### Depuis le dossier compile

Copie le dossier `dist/` ou le dossier compile dans :
```
{siyuan-workspace}/data/plugins/siyuan-github-sync/
```

Puis redemarre SiYuan et active le plugin dans **Parametres → Marketplace → Installe**.

### Build depuis les sources

```bash
npm install
npm run build
```

Le dossier `dist/` sera cree. Copie-le dans le dossier `data/plugins/` de SiYuan.

### Sur mobile Android

Utilise un gestionnaire de fichiers pour copier le dossier `siyuan-github-sync` dans `Android/data/com.example.siyuan/files/data/plugins/` (ou le chemin equivalent selon votre version).

## Configuration

1. Ouvre **Parametres** → clique sur ⚙️ a cote de "GitHub Sync"
2. Renseigne **Nom d'utilisateur GitHub**, **Nom du depot**, **Token PAT** (scope `repo`)
3. Clique sur **Tester GitHub** pour verifier la connexion
4. Appuie sur **Enregistrer**

## Comment fonctionne la sync des plugins/widgets

### Push
Le plugin scanne les dossiers `data/plugins/` et `data/widgets/`, lit chaque `plugin.json`/`widget.json`, et genere deux fichiers manifestes :
- `data/plugin-manifest.json` — Liste des plugins installes (nom + version)
- `data/widget-manifest.json` — Liste des widgets installes (nom + version)

Ces manifestes sont push alongside les autres fichiers de donnees.

### Pull
Apres le pull des donnees, le plugin :
1. Telecharge les deux manifestes depuis le depot distant
2. Compare la liste des plugins/widgets distants avec ceux installes localement
3. Installe automatiquement les plugins/widgets manquants depuis le marketplace SiYuan
4. Affiche le resultat dans le message de fin du pull

> **Note** : Seuls les plugins/widgets presents sur le marketplace officiel sont installes automatiquement. Les plugins custom ne sont pas geres.

## Developpement

```bash
npm run dev    # Mode watch
./compile.sh   # Build + deploiement automatique vers SiYuan (Linux)
```

## Licence

MIT

#!/usr/bin/env bash
set -euo pipefail

PLUGIN_NAME="siyuan-github-sync"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

VERSION=$(grep -o '"version": *"[^"]*"' "$SCRIPT_DIR/plugin.json" | head -1 | sed 's/.*"\([0-9][0-9.]*\)".*/\1/')
ZIP_NAME="${PLUGIN_NAME}-${VERSION}.zip"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

MODE="${1:-}"

if [ -z "$MODE" ]; then
    echo ""
    echo -e "${CYAN}┌──────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│        SiYuan GitHub Sync — Menu                │${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────┘${NC}"
    echo ""
    echo "  1) Test       — Compiler + déployer dans SiYuan"
    echo "  2) Publier    — Compiler + créer package.zip"
    echo ""
    read -rp "  Choix [1/2] : " choix
    echo ""
    case "$choix" in
        2) MODE="publish" ;;
        *) MODE="test" ;;
    esac
fi

echo ""
echo -e "${CYAN}┌──────────────────────────────────────────────────┐${NC}"
if [ "$MODE" = "publish" ]; then
    echo -e "${CYAN}│   SiYuan GitHub Sync  -  Publication (release)  │${NC}"
else
    echo -e "${CYAN}│     SiYuan GitHub Sync  -  Build & Deploy       │${NC}"
fi
echo -e "${CYAN}└──────────────────────────────────────────────────┘${NC}"
echo ""

echo -e "[1/3]  Vérification des dépendances npm..."
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "       Installation des modules..."
    cd "$SCRIPT_DIR" && npm install
fi
echo -e "       ${GREEN}OK${NC} - Dépendances prêtes."
echo ""

echo -e "[2/3]  Compilation..."
echo ""
cd "$SCRIPT_DIR" && npm run build
echo -e "       ${GREEN}OK${NC} - Compilation réussie."
echo ""

if [ "$MODE" = "publish" ]; then
    cd "$SCRIPT_DIR"
    rm -f "dist/${ZIP_NAME}" "dist/siyuan-github-sync.zip"
    cp dist/package.zip "dist/${ZIP_NAME}"
    echo -e "       ${GREEN}OK${NC} - ${ZIP_NAME} créé dans dist/"
    echo ""
    echo -e "${CYAN}┌──────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│   PRÊT POUR LA RELEASE                          │${NC}"
    echo -e "${CYAN}│                                                  │${NC}"
    echo -e "${CYAN}│   Upload dist/${ZIP_NAME} sur GitHub Release  │${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "  Fichier : ${YELLOW}$SCRIPT_DIR/dist/${ZIP_NAME}${NC}"
    echo ""
else
    if [ -n "${SIYUAN_WORKSPACE:-}" ]; then
        SIYUAN_DATA="$SIYUAN_WORKSPACE/data"
    elif [ -f "$HOME/.config/siyuan/workspace.json" ]; then
        SIYUAN_DATA="$(grep -o '"[^"]*"' "$HOME/.config/siyuan/workspace.json" | head -1 | tr -d '"')/data"
    else
        SIYUAN_DATA="$HOME/.config/siyuan/data"
    fi
    DEPLOY_DIR="$SIYUAN_DATA/plugins/$PLUGIN_NAME"

    echo -e "[3/3]  Déploiement vers : ${YELLOW}$DEPLOY_DIR${NC}"
    echo ""
    mkdir -p "$DEPLOY_DIR"
    rm -rf "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR"
    cp -r "$SCRIPT_DIR/dist/"* "$DEPLOY_DIR/"
    echo -e "       ${GREEN}OK${NC} - Plugin déployé."
    echo ""
    if [ -d "$SCRIPT_DIR/dist" ]; then
        rm -rf "$SCRIPT_DIR/dist"
    fi
    echo -e "${CYAN}┌──────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│   TERMINÉ ! Plugin installé dans SiYuan.         │${NC}"
    echo -e "${CYAN}│                                                  │${NC}"
    echo -e "${CYAN}│   Redémarre SiYuan pour charger le plugin.       │${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "  Chemin : ${YELLOW}$DEPLOY_DIR${NC}"
    echo ""
fi

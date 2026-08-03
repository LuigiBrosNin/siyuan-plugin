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
    echo -e "${CYAN}│        SiYuan GitHub Sync — Menu                 │${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────┘${NC}"
    echo ""
    echo "  1) Test      — Compile + deploy to SiYuan"
    echo "  2) Publish   — Compile + create package.zip"
    echo ""
    read -rp "  Choice [1/2]: " choix
    echo ""
    case "$choix" in
        2) MODE="publish" ;;
        *) MODE="test" ;;
    esac
fi

echo ""
echo -e "${CYAN}┌──────────────────────────────────────────────────┐${NC}"
if [ "$MODE" = "publish" ]; then
    echo -e "${CYAN}│   SiYuan GitHub Sync  -  Publication (release)   │${NC}"
else
    echo -e "${CYAN}│      SiYuan GitHub Sync  -  Build & Deploy       │${NC}"
fi
echo -e "${CYAN}└──────────────────────────────────────────────────┘${NC}"
echo ""

echo -e "[1/3]  Checking npm dependencies..."
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "       Installing modules..."
    cd "$SCRIPT_DIR" && npm install
fi
echo -e "       ${GREEN}OK${NC} - Dependencies ready."
echo ""

echo -e "[2/3]  Compiling..."
echo ""
cd "$SCRIPT_DIR" && npm run build
echo -e "       ${GREEN}OK${NC} - Compilation successful."
echo ""

if [ "$MODE" = "publish" ]; then
    cd "$SCRIPT_DIR"
    rm -f "dist/${ZIP_NAME}" "dist/siyuan-github-sync.zip"
    cp dist/package.zip "dist/${ZIP_NAME}"
    echo -e "       ${GREEN}OK${NC} - ${ZIP_NAME} created in dist/"
    echo ""
    echo -e "${CYAN}┌──────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│   READY FOR RELEASE                              │${NC}"
    echo -e "${CYAN}│                                                  │${NC}"
    echo -e "${CYAN}│   Upload dist/${ZIP_NAME} to GitHub Releases  │${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "  File: ${YELLOW}$SCRIPT_DIR/dist/${ZIP_NAME}${NC}"
    echo ""
else
    # Gather potential workspaces
    WORKSPACES=()

    # 1. Check environment variable
    if [ -n "${SIYUAN_WORKSPACE:-}" ] && [ -d "$SIYUAN_WORKSPACE" ]; then
        WORKSPACES+=("$SIYUAN_WORKSPACE")
    fi

    # 2. Extract potential paths from workspace.json
    if [ -f "$HOME/.config/siyuan/workspace.json" ]; then
        while IFS= read -r extracted_path; do
            if [ -d "$extracted_path" ]; then
                WORKSPACES+=("$extracted_path")
            fi
        done < <(grep -o '"[^"]*"' "$HOME/.config/siyuan/workspace.json" | tr -d '"')
    fi

    # 3. Add default config path as a fallback
    if [ -d "$HOME/.config/siyuan" ]; then
        WORKSPACES+=("$HOME/.config/siyuan")
    fi

    # Deduplicate the list of workspaces
    IFS=$'\n' read -r -d '' -a UNIQUE_WORKSPACES < <(printf '%s\n' "${WORKSPACES[@]}" | awk 'NF' | sort -u && printf '\0') || true

    # Ensure at least one workspace was found
    if [ ${#UNIQUE_WORKSPACES[@]} -eq 0 ]; then
        echo -e "${RED}Error: No valid SiYuan workspaces found.${NC}"
        exit 1
    fi

    # Auto-select if only one exists, otherwise prompt
    if [ ${#UNIQUE_WORKSPACES[@]} -eq 1 ]; then
        SELECTED_WORKSPACE="${UNIQUE_WORKSPACES[0]}"
    else
        echo -e "[3/3]  Select Workspace"
        echo "Available SiYuan Workspaces:"
        for i in "${!UNIQUE_WORKSPACES[@]}"; do
            echo "  $((i+1))) ${UNIQUE_WORKSPACES[$i]}"
        done

        while true; do
            read -p "Select a workspace to deploy the plugin (1-${#UNIQUE_WORKSPACES[@]}): " selection
            if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "${#UNIQUE_WORKSPACES[@]}" ]; then
                SELECTED_WORKSPACE="${UNIQUE_WORKSPACES[$((selection-1))]}"
                break
            else
                echo -e "${RED}Invalid selection. Please enter a number between 1 and ${#UNIQUE_WORKSPACES[@]}.${NC}"
            fi
        done
        echo ""
    fi

    SIYUAN_DATA="$SELECTED_WORKSPACE/data"
    DEPLOY_DIR="$SIYUAN_DATA/plugins/$PLUGIN_NAME"

    echo -e "[3/3]  Deploying to: ${YELLOW}$DEPLOY_DIR${NC}"
    echo ""
    mkdir -p "$DEPLOY_DIR"
    rm -rf "$DEPLOY_DIR"
    mkdir -p "$DEPLOY_DIR"
    cp -r "$SCRIPT_DIR/dist/"* "$DEPLOY_DIR/"
    echo -e "       ${GREEN}OK${NC} - Plugin deployed."
    echo ""
    if [ -d "$SCRIPT_DIR/dist" ]; then
        rm -rf "$SCRIPT_DIR/dist"
    fi
    echo -e "${CYAN}┌──────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│   DONE! Plugin installed in SiYuan.              │${NC}"
    echo -e "${CYAN}│                                                  │${NC}"
    echo -e "${CYAN}│   Restart SiYuan to load the plugin.             │${NC}"
    echo -e "${CYAN}└──────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "  Path: ${YELLOW}$DEPLOY_DIR${NC}"
    echo ""
fi

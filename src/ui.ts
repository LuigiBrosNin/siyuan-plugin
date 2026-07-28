import { Dialog } from "siyuan";
import { MergePlan } from "./types";
import { sanitizeForDisplay } from "./utils";

export class SyncProgressUI {
    private dialog: Dialog;
    private barElement: HTMLElement;
    private statusElement: HTMLElement;
    private detailsElement: HTMLElement;
    public isDestroyed = false;

    constructor(title: string, onClosed: () => void) {
        this.dialog = new Dialog({
            title,
            content: `
                <div class="b3-dialog__content" style="padding: 24px;">
                    <div id="sync-status" style="font-weight: bold; margin-bottom: 12px; color: var(--b3-theme-on-background);">Initialisation...</div>
                    <div style="height: 12px; background: var(--b3-border-color); border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
                        <div id="sync-bar" style="width: 0%; height: 100%; background: var(--b3-theme-primary); transition: width 0.3s ease;"></div>
                    </div>
                    <div id="sync-details" style="font-size: 11px; opacity: 0.7; line-height: 1.4; word-break: break-all; min-height: 32px; font-family: monospace;">
                        Vérification des fichiers...
                    </div>
                </div>
            `,
            width: window.innerWidth < 600 ? `${window.innerWidth - 32}px` : "500px",
            destroyCallback: () => {
                this.isDestroyed = true;
                onClosed();
            }
        });
        this.statusElement  = this.dialog.element.querySelector("#sync-status");
        this.barElement     = this.dialog.element.querySelector("#sync-bar");
        this.detailsElement = this.dialog.element.querySelector("#sync-details");
    }

    update(percent: number, status: string, details: string) {
        if (this.isDestroyed) return;
        if (this.statusElement)  this.statusElement.textContent  = status;
        if (this.barElement)     this.barElement.style.width    = `${percent}%`;
        if (this.detailsElement) this.detailsElement.textContent = details;
    }

    finish(message: string, showButton = true) {
        if (this.isDestroyed) return;
        this.update(100, "✅ Terminé", message);
        if (!showButton) return;
        const content = this.dialog.element.querySelector(".b3-dialog__content");
        if (content && !content.querySelector(".b3-dialog__action")) {
            const footer = document.createElement("div");
            footer.className = "b3-dialog__action";
            footer.style.marginTop = "16px";
            footer.innerHTML = `<button class="b3-button b3-button--outline">Fermer</button>`;
            (footer.querySelector(".b3-button--outline") as HTMLElement).onclick = () => this.dialog.destroy();
            content.appendChild(footer);
        }
    }

    destroy() {
        if (!this.isDestroyed) this.dialog.destroy();
    }

    error(message: string) {
        if (this.isDestroyed) return;
        this.update(100, "❌ Erreur", message);
        if (this.barElement) this.barElement.style.background = "var(--b3-theme-error)";
    }
}

export function showDiffDialog(plan: MergePlan): Promise<boolean> {
    return new Promise(resolve => {
        const lines: string[] = [];
        if (plan.toUpload.length > 0) {
            lines.push(`<div style="margin:6px 0;font-weight:bold;color:var(--b3-theme-primary);">🆕 ${plan.toUpload.length} fichier(s) à envoyer</div>`);
            for (const u of plan.toUpload.slice(0, 20)) {
                lines.push(`<div style="padding:2px 8px;font-size:12px;font-family:monospace;">+ ${u.githubPath}</div>`);
            }
            if (plan.toUpload.length > 20) lines.push(`<div style="padding:2px 8px;font-size:11px;opacity:.6;">… et ${plan.toUpload.length - 20} autre(s)</div>`);
        }
        if (plan.toDelete.length > 0) {
            lines.push(`<div style="margin:6px 0;font-weight:bold;color:#f44336;">🗑️ ${plan.toDelete.length} fichier(s) à supprimer</div>`);
            for (const d of plan.toDelete.slice(0, 20)) {
                lines.push(`<div style="padding:2px 8px;font-size:12px;font-family:monospace;">- ${d.githubPath}</div>`);
            }
            if (plan.toDelete.length > 20) lines.push(`<div style="padding:2px 8px;font-size:11px;opacity:.6;">… et ${plan.toDelete.length - 20} autre(s)</div>`);
        }
        if (plan.toReuse.length > 0) {
            lines.push(`<div style="margin:6px 0;font-weight:bold;color:#4caf50;">✅ ${plan.toReuse.length} fichier(s) inchangé(s)</div>`);
        }
        if (plan.conflicted.length > 0) {
            lines.push(`<div style="margin:6px 0;font-weight:bold;color:#ff9800;">⚠️ ${plan.conflicted.length} conflit(s) — modifié des 2 côtés, ignoré</div>`);
            for (const c of plan.conflicted.slice(0, 10)) {
                lines.push(`<div style="padding:2px 8px;font-size:12px;font-family:monospace;">⚠ ${c.githubPath}</div>`);
            }
            if (plan.conflicted.length > 10) lines.push(`<div style="padding:2px 8px;font-size:11px;opacity:.6;">… et ${plan.conflicted.length - 10} autre(s)</div>`);
        }
        if (plan.skippedLarge > 0) {
            lines.push(`<div style="margin:6px 0;font-weight:bold;color:#9e9e9e;">📦 ${plan.skippedLarge} fichier(s) ignoré(s) (>25 Mo)</div>`);
        }
        const dialog = new Dialog({
            title: "📋 Résumé avant envoi",
            content: `
                <div class="b3-dialog__content" style="padding:16px;max-height:360px;overflow-y:auto;">
                    ${lines.join("") || "<div style='opacity:.6;'>Aucun changement détecté</div>"}
                </div>
                <div class="b3-dialog__action" style="padding:8px 16px;border-top:1px solid var(--b3-border-color);">
                    <button id="diff-confirm" class="b3-button b3-button--info">✅ Envoyer</button>
                    <button id="diff-cancel" class="b3-button b3-button--outline" style="margin-left:8px;">❌ Annuler</button>
                </div>
            `,
            width: window.innerWidth < 600 ? `${window.innerWidth - 32}px` : "520px",
            destroyCallback: () => resolve(false),
        });
        dialog.element.querySelector("#diff-confirm")?.addEventListener("click", () => { dialog.destroy(); resolve(true); });
        dialog.element.querySelector("#diff-cancel")?.addEventListener("click", () => { dialog.destroy(); resolve(false); });
    });
}

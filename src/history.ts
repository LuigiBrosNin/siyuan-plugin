import { Dialog, showMessage } from "siyuan";

export class HistoryDialog {
    private dialog: Dialog;
    private listEl: HTMLElement;

    constructor(
        private getHistory: () => Promise<any[]>,
        private restoreCommit: (sha: string, msg: string) => Promise<void>,
    ) {
        this.dialog = new Dialog({
            title: "📜 Historique des commits",
            content: `
                <div class="b3-dialog__content" style="padding: 16px; max-height: 480px; overflow-y: auto;">
                    <div id="history-list" style="min-height: 80px;">
                        <div style="text-align:center;padding:32px;color:var(--b3-theme-on-background);">Chargement...</div>
                    </div>
                </div>
                <div class="b3-dialog__action" style="padding: 8px 16px; border-top: 1px solid var(--b3-border-color);">
                    <button id="history-refresh" class="b3-button b3-button--outline">🔄 Rafraîchir</button>
                    <button id="history-close" class="b3-button b3-button--outline" style="margin-left: 8px;">Fermer</button>
                </div>
            `,
            width: window.innerWidth < 600 ? `${window.innerWidth - 32}px` : "600px",
        });
        this.listEl = this.dialog.element.querySelector("#history-list");
        this.dialog.element.querySelector("#history-refresh").addEventListener("click", () => this.load());
        this.dialog.element.querySelector("#history-close").addEventListener("click", () => this.dialog.destroy());
        this.load();
    }

    private async load() {
        this.listEl.innerHTML = `<div style="text-align:center;padding:32px;color:var(--b3-theme-on-background);">Chargement...</div>`;
        try {
            const commits = await this.getHistory();
            if (commits.length === 0) {
                this.listEl.innerHTML = `<div style="text-align:center;padding:32px;color:var(--b3-theme-on-background);">Aucun commit trouvé.</div>`;
                return;
            }
            let html = "";
            for (const c of commits) {
                const sha = c.sha.slice(0, 7);
                const date = new Date(c.commit.author.date).toLocaleString("fr-FR");
                const author = c.commit.author.name;
                const msg = c.commit.message.split("\n")[0];
                html += `
                    <div style="display:flex;align-items:center;padding:10px 8px;border-bottom:1px solid var(--b3-border-color);gap:8px;">
                        <span style="font-family:monospace;font-size:11px;color:var(--b3-theme-primary);min-width:64px;">${sha}</span>
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this.escapeHtml(msg)}</div>
                            <div style="font-size:11px;opacity:0.6;">${date} par ${this.escapeHtml(author)}</div>
                        </div>
                        <button class="b3-button b3-button--outline restore-btn" data-sha="${c.sha}" data-msg="${this.escapeHtml(msg)}" style="flex-shrink:0;">Restaurer</button>
                    </div>
                `;
            }
            this.listEl.innerHTML = html;
            this.listEl.querySelectorAll(".restore-btn").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.disabled = true;
                    el.textContent = "⏳...";
                    try {
                        await this.restoreCommit(el.dataset.sha, el.dataset.msg);
                        this.dialog.destroy();
                    } catch (err) {
                        showMessage(`❌ Restauration échouée : ${err.message}`, 6000, "error");
                        el.disabled = false;
                        el.textContent = "Restaurer";
                    }
                });
            });
        } catch (err) {
            this.listEl.innerHTML = `<div style="text-align:center;padding:32px;color:var(--b3-theme-error);">❌ ${this.escapeHtml(err.message)}</div>`;
        }
    }

    private escapeHtml(s: string): string {
        return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
    }
}

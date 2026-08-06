import { GITHUB_API, GitHubTreeItem } from "./types";
import { encodePath, base64ToArrayBuffer, sleep } from "./utils";
import { t } from "./i18n";

export class GitHubAPI {
    constructor(
        private token: string,
        private username: string,
        private repo: string,
    ) {}

    async gh(path: string, method = "GET", body?: object, retries = 3): Promise<Response> {
      const url = `${GITHUB_API}${path}`;
      let attempt = 0;

      // comply with GitHub's rate limits
      while (attempt < retries) {
        console.debug(`[GitHub Sync] API Request: ${method} ${url} (Attempt ${attempt + 1})`);

        // request GitHub info
        const res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github+json"
          },
          body: body ? JSON.stringify(body) : undefined
        });

        // check rate limit headers
        const remaining = res.headers.get("x-ratelimit-remaining");
        if (remaining) {
          console.debug(`[GitHub Sync] Rate limit remaining: ${remaining}`);
        }

        // handle rate limiting
        if (res.status === 403 || res.status === 429) {
          const retryAfter = res.headers.get("retry-after");
          const resetTime = res.headers.get("x-ratelimit-reset");
          let waitTime = 1000;

          if (retryAfter) {
            waitTime = parseInt(retryAfter, 10) * 1000;
            console.warn(`[GitHub Sync] Secondary rate limit hit. Server requested backoff via Retry-After. Waiting ${waitTime}ms.`);
          } else if (resetTime) {
            const resetMs = parseInt(resetTime, 10) * 1000;
            waitTime = Math.max(1000, resetMs - Date.now() + 1000);
            console.warn(`[GitHub Sync] Primary rate limit hit. Reset at ${new Date(resetMs).toLocaleTimeString()}. Waiting ${waitTime}ms.`);
          } else {
            waitTime = Math.pow(2, attempt) * 2000;
            console.warn(`[GitHub Sync] Rate limit hit with no headers. Using exponential backoff. Waiting ${waitTime}ms.`);
          }

          await sleep(waitTime);
          attempt++;
          continue;
        }

        if (!res.ok) {
          console.error(`[GitHub Sync] API Error: ${res.status} ${res.statusText} on ${path}`);
        }

        return res;
      }

      throw new Error(`[GitHub Sync] Failed after ${retries} retries due to rate limiting.`);
    }

    async getRemoteTree(treeSha: string): Promise<GitHubTreeItem[]> {
        const res = await this.gh(`/repos/${this.username}/${this.repo}/git/trees/${treeSha}?recursive=1`);
        const data = await res.json();
        return (data.tree || []) as GitHubTreeItem[];
    }

    async downloadFile(path: string, ref?: string): Promise<ArrayBuffer | null> {
        try {
            const url = `/repos/${this.username}/${this.repo}/contents/${encodePath(path)}` + (ref ? `?ref=${ref}` : "");
            const res = await this.gh(url);
            if (!res.ok) return null;
            const data = await res.json();
            if (!data.content) return null;
            return base64ToArrayBuffer(data.content);
        } catch { return null; }
    }

    async testConnection(): Promise<boolean> {
        try {
            const res = await this.gh(`/repos/${this.username}/${this.repo}`);
            return res.status === 200;
        } catch { return false; }
    }

    async getCommits(): Promise<any[]> {
        const res = await this.gh(`/repos/${this.username}/${this.repo}/commits?per_page=30`);
        if (!res.ok) throw new Error(t('msg.repo_empty'));
        return res.json();
    }

    getRepoInfo() {
        return this.gh(`/repos/${this.username}/${this.repo}`);
    }

    getRef(branch: string) {
        return this.gh(`/repos/${this.username}/${this.repo}/git/refs/heads/${branch}`);
    }

    getCommit(sha: string) {
        return this.gh(`/repos/${this.username}/${this.repo}/git/commits/${sha}`);
    }

    createBlob(content: string) {
        return this.gh(`/repos/${this.username}/${this.repo}/git/blobs`, "POST", {
            content, encoding: "base64"
        });
    }

    createTree(baseTree: string, treeItems: any[]) {
        return this.gh(`/repos/${this.username}/${this.repo}/git/trees`, "POST", {
            base_tree: baseTree, tree: treeItems
        });
    }

    createCommit(message: string, tree: string, parents: string[]) {
        return this.gh(`/repos/${this.username}/${this.repo}/git/commits`, "POST", {
            message, tree, parents
        });
    }

    updateRef(branch: string, sha: string) {
        return this.gh(`/repos/${this.username}/${this.repo}/git/refs/heads/${branch}`, "PATCH", { sha });
    }

    putContent(path: string, message: string, content: string, branch: string) {
        return this.gh(`/repos/${this.username}/${this.repo}/contents/${encodePath(path)}`, "PUT", {
            message, content, branch
        });
    }
}

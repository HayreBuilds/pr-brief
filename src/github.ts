const GITHUB_API = "https://api.github.com";

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  base: { ref: string; sha: string };
  head: { ref: string; sha: string };
  additions: number;
  deletions: number;
  changed_files: number;
  user: { login: string };
  labels: Array<{ name: string }>;
  draft: boolean;
}

export interface PullRequestFile {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed" | "copied";
  additions: number;
  deletions: number;
  patch?: string;
}

export interface IssueComment {
  id: number;
  body: string;
  user: { login: string };
}

async function ghFetch(path: string, token: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "pr-brief-action/1.0",
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

export async function getPullRequest(owner: string, repo: string, prNumber: number, token: string): Promise<PullRequest> {
  const resp = await ghFetch(`/repos/${owner}/${repo}/pulls/${prNumber}`, token);
  if (!resp.ok) throw new Error(`Failed to get PR ${prNumber}: ${resp.status}`);
  return resp.json() as Promise<PullRequest>;
}

export async function getPullRequestFiles(owner: string, repo: string, prNumber: number, token: string): Promise<PullRequestFile[]> {
  const resp = await ghFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`, token);
  if (!resp.ok) throw new Error(`Failed to get PR files: ${resp.status}`);
  return resp.json() as Promise<PullRequestFile[]>;
}

export async function getPRComments(owner: string, repo: string, prNumber: number, token: string): Promise<IssueComment[]> {
  const resp = await ghFetch(`/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=100`, token);
  if (!resp.ok) return [];
  return resp.json() as Promise<IssueComment[]>;
}

export async function createComment(owner: string, repo: string, prNumber: number, body: string, token: string): Promise<number> {
  const resp = await ghFetch(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, token, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  if (!resp.ok) throw new Error(`Failed to create comment: ${resp.status}`);
  const data = await resp.json() as { id: number };
  return data.id;
}

export async function updateComment(owner: string, repo: string, commentId: number, body: string, token: string): Promise<void> {
  const resp = await ghFetch(`/repos/${owner}/${repo}/issues/comments/${commentId}`, token, {
    method: "PATCH",
    body: JSON.stringify({ body }),
  });
  if (!resp.ok) throw new Error(`Failed to update comment: ${resp.status}`);
}

export function buildDiffSummary(files: PullRequestFile[], maxLines = 400): string {
  let out = "";
  let linesUsed = 0;

  for (const file of files) {
    if (linesUsed >= maxLines) break;
    out += `\n### ${file.status.toUpperCase()}: ${file.filename} (+${file.additions}/-${file.deletions})\n`;
    if (file.patch) {
      const patchLines = file.patch.split("\n");
      const take = Math.min(patchLines.length, maxLines - linesUsed);
      out += "```diff\n" + patchLines.slice(0, take).join("\n") + "\n```\n";
      linesUsed += take;
    }
  }

  return out;
}

export const PR_BRIEF_MARKER = "<!-- pr-brief-comment -->";

export function filterSignificantFiles(files: PullRequestFile[]): PullRequestFile[] {
  const SKIP = [".lock", ".sum", ".mod", "package-lock", "yarn.lock", "pnpm-lock", ".min.js", ".map"];
  return files.filter(f => !SKIP.some(s => f.filename.includes(s)));
}

export function categorizeFiles(files: PullRequestFile[]): Record<string, PullRequestFile[]> {
  const cats: Record<string, PullRequestFile[]> = { source: [], tests: [], docs: [], config: [], other: [] };
  for (const f of files) {
    if (/test|spec|__tests__/.test(f.filename)) cats["tests"]!.push(f);
    else if (/\.(md|txt|rst)$/.test(f.filename)) cats["docs"]!.push(f);
    else if (/\.(json|yaml|yml|toml|env)$/.test(f.filename)) cats["config"]!.push(f);
    else if (/\.(ts|js|py|go|rs|rb|java)$/.test(f.filename)) cats["source"]!.push(f);
    else cats["other"]!.push(f);
  }
  return cats;
}

export function filterSignificantFiles(files: PullRequestFile[]): PullRequestFile[] {
  const SKIP = [".lock", ".sum", ".mod", "package-lock", "yarn.lock", "pnpm-lock", ".min.js", ".map"];
  return files.filter(f => !SKIP.some(s => f.filename.includes(s)));
}

export function categorizeFiles(files: PullRequestFile[]): Record<string, PullRequestFile[]> {
  const cats: Record<string, PullRequestFile[]> = { source: [], tests: [], docs: [], config: [], other: [] };
  for (const f of files) {
    if (/test|spec|__tests__/.test(f.filename)) cats["tests"]!.push(f);
    else if (/\.(md|txt|rst)$/.test(f.filename)) cats["docs"]!.push(f);
    else if (/\.(json|yaml|yml|toml|env)$/.test(f.filename)) cats["config"]!.push(f);
    else if (/\.(ts|js|py|go|rs|rb|java)$/.test(f.filename)) cats["source"]!.push(f);
    else cats["other"]!.push(f);
  }
  return cats;
}

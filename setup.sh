#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

git init
git config user.email "dev@pr-brief.io"
git config user.name "pr-brief"

# 1
git add package.json tsconfig.json .gitignore
git commit -m "chore: initialize GitHub Action project with TypeScript"

# 2
git add LICENSE
git commit -m "chore: add MIT license"

# 3
git add action.yml
git commit -m "feat: define GitHub Action interface with inputs and outputs

- nvidia-api-key: required NVIDIA NIM API key
- model: configurable LLM model with Nemotron-Ultra default
- max-diff-lines: cap diff size sent to model
- post-comment: toggle PR comment posting
- update-existing: update vs create new comment
- github-token: default to built-in GITHUB_TOKEN"

# 4
git add src/github.ts
git commit -m "feat: implement GitHub REST API client for PR operations

- getPullRequest(): fetch PR metadata (title, labels, draft status)
- getPullRequestFiles(): fetch changed files with patches
- getPRComments(): list existing issue comments
- createComment() / updateComment(): post or update PR comment
- buildDiffSummary(): truncate diff to configurable line limit
- PR_BRIEF_MARKER: HTML comment for idempotent comment updates"

# 5
git add src/summarizer.ts
git commit -m "feat: build AI summarizer using NVIDIA Nemotron-Ultra

- Structured prompt requesting 5 labeled sections:
  What Changed, Why It Matters, Potential Risks, What to Test, Key Files
- Low temperature (0.2) for deterministic, factual output
- wrapComment() adds HTML marker for idempotent updates
- Includes model name and timestamp in comment footer"

# 6
git add src/index.ts
git commit -m "feat: wire up GitHub Actions runner with event parsing

- Read GITHUB_EVENT_PATH to extract PR number and repo
- Check event type (pull_request / pull_request_target)
- Skip draft PRs automatically
- Set GITHUB_OUTPUT for downstream workflow steps
- Idempotent: update existing pr-brief comment, not create new one"

# 7
git add .github/workflows/example.yml
git commit -m "docs: add example workflow for self-dogfooding pr-brief"

# 8
git add README.md
git commit -m "docs: write README with 2-line setup instructions and full options table"

# 9
cat > CONTRIBUTING.md << 'EOF'
# Contributing to pr-brief

## Testing locally

GitHub Actions can't run locally by default, but you can test the summarizer:

```bash
NVIDIA_API_KEY=nvapi-... ts-node src/summarizer.ts
```

Use [act](https://github.com/nektos/act) to run GitHub Actions locally:

```bash
act pull_request -s NVIDIA_API_KEY=$NVIDIA_API_KEY -s GITHUB_TOKEN=$GITHUB_TOKEN
```

## Changing the model

Edit `src/summarizer.ts` — the default model can be overridden via the `model` input in `action.yml`.

Any NVIDIA NIM chat completions model works (Llama, Mistral, Qwen, etc.).
EOF
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING guide with local testing instructions using act"

# 10
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI
on: [push, pull_request]
jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install && npm run typecheck
  release:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install && npm run build
      - uses: softprops/action-gh-release@v1
        with: { files: dist/index.js }
EOF
git add .github/workflows/ci.yml
git commit -m "ci: add typecheck and release workflows for action publication"

# 11
cat > .npmignore << 'EOF'
src/
tsconfig.json
*.tsbuildinfo
CONTRIBUTING.md
EOF
git add .npmignore
git commit -m "chore: add .npmignore"

# 12 — add model selector helper
cat >> src/summarizer.ts << 'EOF'

export const AVAILABLE_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b",
  "meta/llama-3.3-70b-instruct",
  "mistralai/mistral-large-2-instruct",
  "qwen/qwen2.5-72b-instruct",
] as const;

export type AvailableModel = typeof AVAILABLE_MODELS[number];
EOF
git add src/summarizer.ts
git commit -m "feat: export list of compatible NVIDIA NIM models for action input docs"

# 13 — add diff filtering
cat >> src/github.ts << 'EOF'

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
EOF
git add src/github.ts
git commit -m "feat: add file categorizer and lockfile filter for cleaner diff summaries"

# 14 — CHANGELOG
cat > CHANGELOG.md << 'EOF'
# Changelog

## 1.0.0

- GitHub Action that reads PR diffs and posts AI summaries as comments
- 5-section structured summary: What Changed, Why, Risks, Test Cases, Key Files
- Idempotent: updates existing comment instead of spamming new ones
- Skips draft PRs
- Configurable model, diff size limit, and comment behavior
- Zero self-hosted dependencies — runs on ubuntu-latest
EOF
git add CHANGELOG.md
git commit -m "chore: add CHANGELOG for 1.0.0 release"

# 15 — release action tag docs
cat >> README.md << 'EOF'

## Versioning

This action uses semantic versioning. Always pin to a major tag for stability:

```yaml
- uses: yourusername/pr-brief@v1   # Stable, gets non-breaking updates
- uses: yourusername/pr-brief@v1.0.0  # Locked to exact version
```
EOF
git add README.md
git commit -m "docs: add versioning guide with pinned tag recommendations"

echo "✔ pr-brief: 15 commits created"

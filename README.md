# 🤖 pr-brief

[![Build Status](https://img.shields.io/github/actions/workflow/status/HayreBuilds/pr-brief/ci.yml?branch=main)](https://github.com/HayreBuilds/pr-brief/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA-NIM-76B900?logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/HayreBuilds/pr-brief/pulls)

**GitHub Action that auto-summarizes Pull Requests with AI. Get high-level context on every diff instantly.**

> Spend less time reading code and more time reviewing logic. **pr-brief** analyzes your PR diffs and posts a clean, AI-generated summary as a comment—covering what changed, why it matters, and potential risks.

---

## 🚀 Quick Setup

Add this to your `.github/workflows/pr-brief.yml`:

```yaml
name: PR Brief
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  summarize:
    runs-on: ubuntu-latest
    steps:
      - uses: HayreBuilds/pr-brief@v1
        with:
          nvidia-api-key: ${{ secrets.NVIDIA_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## ✨ Key Features

- **📝 Intelligent Summaries**: Understands the *intent* of changes, not just the lines.
- **⚠️ Risk Detection**: Automatically flags potential breaking changes or security risks.
- **📁 File Categorization**: Groups changes by impact (e.g., Logic, UI, Docs, Tests).
- **🧠 Powered by NVIDIA NIM**: Uses `Nemotron-Ultra` (550B) for deep reasoning.
- **⚡ Fast & Lean**: Minimal overhead. Runs in seconds on every push.

---

## 💻 How it Works

1. **Diff Extraction**: Reads the PR's git diff and metadata from the GitHub API.
2. **Context Cleaning**: Strips out noise like lockfiles and large assets to focus on logic.
3. **AI Analysis**: Sends the cleaned diff to `nvidia/nemotron-4-340b-instruct`.
4. **Feedback Loop**: Posts a structured summary directly to the PR comment thread.

---

## 🛠️ Configuration Options

| Input | Required | Description |
|:---|:---|:---|
| `nvidia-api-key` | **Yes** | Your free API key from [build.nvidia.com](https://build.nvidia.com) |
| `github-token` | **Yes** | Usually `${{ secrets.GITHUB_TOKEN }}` |
| `model` | No | NVIDIA model ID (Default: `nemotron-ultra`) |
| `max-diff-length`| No | Max characters to analyze (Default: `10000`) |
| `ignore-files` | No | Glob patterns to ignore (e.g., `*.lock, dist/*`) |

---

## 🤝 Contributing

We love contributions! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 💖 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=HayreBuilds/pr-brief&type=Date)](https://star-history.com/#HayreBuilds/pr-brief&Date)

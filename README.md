# pr-brief

> GitHub Action that auto-summarizes every pull request with AI. What changed, why it matters, potential risks, and what to test — posted as a PR comment automatically.

```markdown
## 📋 What Changed
This PR refactors the authentication middleware to use JWT refresh tokens
instead of session cookies, reducing server-side state requirements and
enabling stateless horizontal scaling.

## 🎯 Why It Matters
The current session-based auth requires sticky sessions in production,
blocking the planned multi-region deployment. This change makes auth
stateless and cloud-native.

## ⚠️ Potential Risks
- Existing sessions will be invalidated on deploy — coordinate with
  support team for user communication
- JWT secret rotation requires coordinated deployment
- Token expiry handling not yet tested on mobile clients

## ✅ What to Test
- [ ] Login flow creates valid JWT pair (access + refresh)
- [ ] Refresh token renews access token correctly
- [ ] Expired access token returns 401, not 500
- [ ] Logout invalidates refresh token
- [ ] Rate limiting still applies after auth change

## 📁 Key Files
- `middleware/auth.ts` — Core auth logic, verify before merging
- `routes/session.ts` — New refresh token endpoint
- `tests/auth.test.ts` — Coverage added for edge cases
```

---

## Setup (2 lines)

**Step 1:** Add your NVIDIA API key to GitHub Secrets as `NVIDIA_API_KEY`  
(Free at [build.nvidia.com](https://build.nvidia.com))

**Step 2:** Create `.github/workflows/pr-brief.yml`:

```yaml
name: PR Brief
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  pull-requests: write
  contents: read

jobs:
  pr-brief:
    runs-on: ubuntu-latest
    steps:
      - uses: yourusername/pr-brief@v1
        with:
          nvidia-api-key: ${{ secrets.NVIDIA_API_KEY }}
```

That's it. Every new PR gets an AI summary as a comment.

## Configuration

```yaml
- uses: yourusername/pr-brief@v1
  with:
    nvidia-api-key: ${{ secrets.NVIDIA_API_KEY }}
    
    # Optional: change the model
    model: meta/llama-3.3-70b-instruct
    
    # Optional: limit diff size (for large PRs)
    max-diff-lines: 300
    
    # Optional: update existing comment instead of creating new ones
    update-existing: true
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `nvidia-api-key` | ✅ | — | NVIDIA NIM API key |
| `model` | ❌ | `nvidia/nemotron-3-ultra-550b-a55b` | LLM model |
| `max-diff-lines` | ❌ | `400` | Max diff lines to analyze |
| `post-comment` | ❌ | `true` | Whether to post PR comment |
| `update-existing` | ❌ | `true` | Update existing comment |
| `github-token` | ❌ | `${{ github.token }}` | GitHub token |

## Outputs

| Output | Description |
|--------|-------------|
| `summary` | The generated PR summary in markdown |

## Features

- ✅ Posts summary as PR comment automatically
- ✅ Updates existing comment on re-runs (no duplicate comments)
- ✅ Skips draft PRs
- ✅ Works with any programming language
- ✅ Cites specific files and what changed in each
- ✅ Identifies risks and edge cases to test
- ✅ Uses NVIDIA's free Nemotron-Ultra 550B model

## Powered By

- **`nvidia/nemotron-3-ultra-550b-a55b`** — 550B parameter reasoning model (free tier)

## License

MIT

## Versioning

This action uses semantic versioning. Always pin to a major tag for stability:

```yaml
- uses: yourusername/pr-brief@v1   # Stable, gets non-breaking updates
- uses: yourusername/pr-brief@v1.0.0  # Locked to exact version
```

## Versioning

This action uses semantic versioning. Always pin to a major tag for stability:

```yaml
- uses: yourusername/pr-brief@v1   # Stable, gets non-breaking updates
- uses: yourusername/pr-brief@v1.0.0  # Locked to exact version
```

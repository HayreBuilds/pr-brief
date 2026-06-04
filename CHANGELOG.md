# Changelog

## 1.0.0

- GitHub Action that reads PR diffs and posts AI summaries as comments
- 5-section structured summary: What Changed, Why, Risks, Test Cases, Key Files
- Idempotent: updates existing comment instead of spamming new ones
- Skips draft PRs
- Configurable model, diff size limit, and comment behavior
- Zero self-hosted dependencies — runs on ubuntu-latest

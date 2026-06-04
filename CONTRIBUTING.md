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

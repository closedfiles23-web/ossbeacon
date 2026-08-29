# Architecture

OSSBeacon separates data retrieval, deterministic analysis, optional AI enrichment, and rendering.

```text
GitHub API
   |
   v
metadata adapters -> deterministic heuristics -> Markdown / JSON
                                  |
                                  +-> optional OpenAI enrichment
```

## Modules

- `github.mjs`: minimal GitHub REST client.
- `risk.mjs`: explainable PR risk scoring.
- `triage.mjs`: issue classification rules.
- `release.mjs`: release grouping from compare metadata.
- `openai.mjs`: opt-in Responses API adapter.
- `commands.mjs`: orchestration.
- `format.mjs`: human-readable Markdown output.
- `action.mjs`: GitHub Actions entry point.

## Trust boundary

GitHub and OpenAI are network boundaries. The local heuristic layer does not require an AI provider. The project avoids hidden telemetry.

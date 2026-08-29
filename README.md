# 🛰️ OSSBeacon

**A lightweight open-source maintainer cockpit for pull-request risk, issue triage, and release notes.**

OSSBeacon helps maintainers answer three repetitive questions quickly:

1. **Where should I focus my PR review?**
2. **What kind of issue is this, and how urgent might it be?**
3. **What changed between two release refs?**

It works with deterministic local heuristics by default. OpenAI summaries are optional and explicitly opt-in.

> **Status:** early public beta, v0.1.0. The project is intentionally small, dependency-free, auditable, and contributor-friendly.

## Why OSSBeacon?

Maintainers spend a surprising amount of time routing attention rather than writing code. OSSBeacon is designed as a transparent first-pass signal, not an autonomous gatekeeper.

- 🟢 **Free baseline:** no AI key required.
- 🔍 **Transparent:** risk factors are shown, not hidden behind a score.
- 🤖 **Optional AI:** use the OpenAI Responses API only when you request it.
- 🔐 **Privacy-conscious:** AI mode sends compact metadata, not arbitrary repository source files.
- 🧩 **Zero runtime dependencies:** Node.js 20+ is enough.
- ⚙️ **GitHub Action ready:** put the report in your workflow summary, optionally comment on PRs.

## Quick start

```bash
git clone https://github.com/closedfiles23-web/ossbeacon.git
cd ossbeacon
npm test
node src/cli.mjs demo
```

Analyze a public PR:

```bash
node src/cli.mjs analyze-pr --repo owner/project --pr 123
```

For private repositories or higher GitHub API limits:

```bash
export GITHUB_TOKEN="..."
node src/cli.mjs analyze-pr --repo owner/private-project --pr 123
```

Enable the optional AI maintainer summary:

```bash
export OPENAI_API_KEY="..."
node src/cli.mjs analyze-pr --repo owner/project --pr 123 --ai
```

The OpenAI integration uses the Responses API. The default model can be changed through `OSSBEACON_MODEL` or `.ossbeacon.json`.

## Commands

### PR review signal

```bash
ossbeacon analyze-pr --repo owner/project --pr 123
ossbeacon analyze-pr --repo owner/project --pr 123 --json
ossbeacon analyze-pr --repo owner/project --pr 123 --ai
```

The report considers change size, number of files, sensitive paths, obvious test changes, and configurable thresholds.

### Issue triage

```bash
ossbeacon triage-issue --repo owner/project --issue 42
```

It proposes a type, labels, priority, and evidence. The heuristic is deliberately conservative.

### Release notes

```bash
ossbeacon release-notes --repo owner/project --from v1.0.0 --to v1.1.0
```

Conventional Commit prefixes are grouped into features, fixes, docs, maintenance, and other changes.

## GitHub Action

After this project has a stable tag, repositories can use the action like this:

```yaml
name: OSSBeacon
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read
  pull-requests: write

jobs:
  review-signal:
    runs-on: ubuntu-latest
    steps:
      - uses: closedfiles23-web/ossbeacon@v0.1.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          use-ai: 'false'
          comment: 'false'
```

To enable AI, store an OpenAI API key as a repository secret and pass it to `openai-api-key`. Do not place API keys in workflow files.

## Configuration

Copy `.ossbeacon.example.json` to `.ossbeacon.json` and adjust thresholds, sensitive path patterns, or GitHub retrieval limits.

```json
{
  "github": {
    "maxPrFiles": 1000
  },
  "risk": {
    "highThreshold": 70,
    "mediumThreshold": 35,
    "largeChangeLines": 600
  }
}
```

`github.maxPrFiles` is a safety cap. OSSBeacon paginates changed files up to that limit and clearly warns when a larger PR is intentionally truncated.

## Design principles

- **Assist, do not replace maintainers.** Scores never merge or reject code automatically.
- **Explain signals.** Every risk score comes with human-readable factors.
- **Minimal data.** AI mode gets compact PR or issue metadata rather than complete source files.
- **Safe defaults.** Commenting and AI are disabled by default.
- **Portable core.** No framework or runtime dependency beyond modern Node.js.

## Roadmap

See [ROADMAP.md](ROADMAP.md). Near-term work includes duplicate-issue hints, repository-specific policies, SARIF output, richer release notes, and adapter interfaces for additional model providers.

## Contributing

Contributions are welcome, including docs, tests, rules, provider adapters, UX ideas, and accessibility improvements. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and look for `good first issue` once issues are published.

## Security

Please do not file public exploit details for a vulnerability in OSSBeacon. Follow [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).

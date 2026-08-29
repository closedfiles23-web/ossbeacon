# Contributing to OSSBeacon

Thanks for helping make maintenance work less repetitive.

## Ground rules

- Be respectful and specific.
- Prefer small PRs with a clear reason.
- Add or update tests for behavior changes.
- Do not commit secrets, access tokens, private repository data, or generated credentials.
- Security reports belong in the private channel described in `SECURITY.md`.

## Development

Requirements: Node.js 20 or newer.

```bash
npm test
npm run check
node src/cli.mjs demo
```

There are currently no runtime dependencies. Please justify new dependencies in the PR description, including maintenance and security tradeoffs.

## Pull requests

A useful PR description explains:

1. The maintainer problem being solved.
2. What behavior changes.
3. How it was tested.
4. Any compatibility, privacy, security, or cost implications.

Commit messages should preferably follow Conventional Commits, for example `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, or `chore:`.

## Adding a heuristic

Heuristics should be explainable and conservative. Avoid rules that claim certainty from weak signals. New rules should include positive and negative tests.

## AI features

AI features must remain optional. A contribution that sends additional repository data to an external model must document exactly what leaves the runner and why it is necessary.

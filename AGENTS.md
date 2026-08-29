# AGENTS.md

## Project goal
OSSBeacon reduces repetitive open-source maintainer work while keeping humans in control.

## Engineering constraints
- Node.js 20+.
- Keep the core dependency-free unless a dependency has a strong justification.
- AI behavior must remain opt-in.
- Never send source-file contents to an external service without an explicit, documented feature and user consent.
- Heuristics must explain why they fired.
- Add tests for behavior changes.
- Avoid automated merge or rejection decisions based only on OSSBeacon scores.

## Validation
Run `npm run check` before proposing a change.

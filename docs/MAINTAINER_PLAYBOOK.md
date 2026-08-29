# Maintainer Playbook

## Review signals are prompts, not verdicts
A high score means "spend attention here," not "reject this PR." A low score does not prove safety or correctness.

## Suggested workflow
1. Read the author's intent.
2. Use OSSBeacon to identify obvious review hotspots.
3. Inspect the actual diff.
4. Run or verify tests.
5. Ask for missing context.
6. Apply project-specific judgment.

## Triage workflow
Use suggested labels as a starting point. Security reports should be moved to a private channel before discussing exploit details.

## Release workflow
Generate a draft, then edit it for user impact, breaking changes, migrations, and acknowledgements. Commit messages are imperfect source material.

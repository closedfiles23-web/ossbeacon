# Stable JSON report contract

OSSBeacon's `--json` mode emits a versioned machine-readable report instead of exposing internal GitHub API payloads.

Current contract: `schemaVersion: "1.0"`.

The formal JSON Schema lives at [`schemas/report-v1.schema.json`](../schemas/report-v1.schema.json).

## Report types

Every report has the same envelope:

```json
{
  "schemaVersion": "1.0",
  "reportType": "pull-request",
  "repository": "owner/project",
  "subject": {},
  "result": {},
  "ai": {
    "generated": false,
    "summary": null
  }
}
```

`reportType` is one of:

- `pull-request`
- `issue-triage`
- `release-notes`

The `subject` and `result` objects are specific to that report type and are defined by the JSON Schema.

## Compatibility policy

The report schema follows a versioned compatibility contract:

- Breaking changes to existing required fields, field meaning, or field types require a new major schema version.
- New optional capabilities may be added without changing the major version when existing v1 consumers can safely ignore them.
- Existing required fields will not be silently renamed or repurposed within schema v1.
- Consumers should branch on `schemaVersion` and `reportType`, and should ignore unknown fields unless they intentionally validate with a strict schema snapshot.
- Human-readable Markdown output is independent from this contract and may improve without changing the JSON schema version.

## Privacy and stability

Stable reports intentionally contain the maintainer signal, not complete GitHub API responses. This keeps the contract smaller, reduces accidental coupling to GitHub response shapes, and avoids placing issue bodies or arbitrary source-file contents into the machine-readable report.

AI output, when explicitly enabled, is represented as a stable object:

```json
{
  "generated": true,
  "summary": "..."
}
```

When AI is disabled, `generated` is `false` and `summary` is `null`.

## Examples

PR analysis:

```bash
ossbeacon analyze-pr --repo owner/project --pr 123 --json
```

Issue triage:

```bash
ossbeacon triage-issue --repo owner/project --issue 42 --json
```

Release notes:

```bash
ossbeacon release-notes --repo owner/project --from v1.0.0 --to v1.1.0 --json
```

Downstream automations should validate or inspect `schemaVersion` before consuming `result`.

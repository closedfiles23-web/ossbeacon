# Privacy

OSSBeacon has no project-owned telemetry in v0.1.0.

By default, data is fetched from GitHub and analyzed in the local process. If `--ai` or the Action's `use-ai: true` option is enabled, compact metadata is sent to the OpenAI API to generate a maintainer-oriented summary.

The v0.1.0 AI path intentionally sends file names and change statistics for PR analysis, not arbitrary source-file contents. Issue AI mode sends the issue title and body because those are the subject being triaged.

Operators remain responsible for checking their repository's confidentiality requirements and the terms of any configured external service.

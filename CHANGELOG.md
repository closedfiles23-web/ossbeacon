# Changelog

All notable changes to OSSBeacon will be documented here.

## [0.2.0] - 2026-08-29

### Added
- Versioned stable JSON report contract for pull request analysis, issue triage, and release notes.
- Formal JSON Schema plus compatibility and privacy documentation for machine-readable reports.
- Repository self-review workflow and a first-adoption guide with fork-safety and least-privilege guidance.

### Changed
- `--json` now emits the stable OSSBeacon report contract instead of internal GitHub API payloads.
- GitHub Action comments use an OSSBeacon marker and update the existing report instead of posting duplicates.
- The external workflow example now defaults to read-only pull-request permissions and `${{ github.token }}` when comments are disabled.

### Fixed
- OSSBeacon comment refreshes no longer edit unrelated human or bot comments.

## [0.1.0] - 2026-08-29

### Added
- Dependency-free Node.js CLI.
- Pull request risk scoring with explainable signals.
- Review checklist generation.
- Heuristic issue triage.
- Conventional-commit release note grouping.
- Optional OpenAI Responses API summaries.
- Composite GitHub Action.
- CI, CodeQL, contributor docs, security policy, and community templates.

# Security Policy

## Supported versions

Until v1.0, only the latest release receives security fixes.

## Reporting a vulnerability

Please do not publish exploit details in a public issue. Use GitHub's private vulnerability reporting feature when enabled for this repository. If that feature is unavailable, contact the repository owner through the GitHub profile and request a private reporting channel before sending sensitive details.

A useful report includes the affected version, impact, reproduction conditions, and a minimal proof of concept that does not target systems you do not own or have permission to test.

## Security model

OSSBeacon reads GitHub metadata using the permissions supplied by the user or GitHub Actions. AI mode is disabled by default. When enabled, OSSBeacon sends compact metadata to the configured OpenAI API endpoint. It does not intentionally send arbitrary source file contents in v0.1.0.

Never place `GITHUB_TOKEN`, `OPENAI_API_KEY`, or other secrets in committed files.

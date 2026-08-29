# Adopting OSSBeacon

This guide is the shortest safe path from discovering OSSBeacon to getting a useful pull-request signal in a real repository.

## Start with the stable release

External repositories should pin the published release:

```yaml
uses: closedfiles23-web/ossbeacon@v0.1.0
```

The OSSBeacon repository itself intentionally dogfoods `@main` so maintainers can exercise the current development version before the next release. That is a project-maintenance choice, not the recommended default for downstream users.

## 1. Read-only baseline

Start with AI and PR comments disabled. This gives you an OSSBeacon report in the GitHub Actions job summary without asking for an OpenAI key or write access to pull requests.

Create `.github/workflows/ossbeacon.yml`:

```yaml
name: OSSBeacon

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read
  pull-requests: read

jobs:
  review-signal:
    runs-on: ubuntu-latest
    steps:
      - uses: closedfiles23-web/ossbeacon@v0.1.0
        with:
          github-token: ${{ github.token }}
          use-ai: 'false'
          comment: 'false'
```

Open or update a pull request, then inspect the workflow summary. OSSBeacon should show its risk score, evidence, changed-file signal, and review checklist.

## 2. Evaluate before automating more

Use the read-only mode on several representative pull requests before turning on comments or AI. Check whether the factors help a maintainer decide where to focus review attention.

Good first-adoption questions:

- Does the report call attention to changes you would already review carefully?
- Are your repository's sensitive paths represented in `.ossbeacon.json`?
- Are the default risk thresholds useful for the size of your normal pull requests?
- Does the report reduce review setup time without pretending to replace human judgment?

OSSBeacon is designed as a review signal, not as an autonomous merge or rejection gate.

## 3. Optional PR comment

If you want the report in the pull-request conversation, change the permission and input:

```yaml
permissions:
  contents: read
  pull-requests: write

# ...
      - uses: closedfiles23-web/ossbeacon@v0.1.0
        with:
          github-token: ${{ github.token }}
          use-ai: 'false'
          comment: 'true'
```

OSSBeacon marks its own report and updates that marked comment on later runs instead of editing unrelated human or bot comments.

### Fork safety

GitHub commonly restricts write permissions for workflows triggered by pull requests from forks. If your project accepts fork-based contributions, the simplest safe baseline is `comment: 'false'` with `pull-requests: read`.

Do not switch to `pull_request_target` and then check out or execute untrusted contributor code just to obtain a write token. If you design a separate privileged commenting workflow, keep untrusted code out of that privileged execution path.

The OSSBeacon repository's self-review workflow demonstrates a middle ground: it never checks out PR code, always runs the trusted Action from the repository's `main` branch, and only attempts to post a comment for same-repository branches. Fork PRs still get the workflow summary.

## 4. Optional AI summary

AI is opt-in. Store the OpenAI API key as a GitHub Actions secret, then pass it to the Action:

```yaml
      - uses: closedfiles23-web/ossbeacon@v0.1.0
        with:
          github-token: ${{ github.token }}
          use-ai: 'true'
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          comment: 'false'
```

Do not place API keys directly in workflow files.

With AI disabled, OSSBeacon does not call OpenAI. With AI enabled for PR analysis, OSSBeacon sends compact PR metadata and heuristic results, not arbitrary repository source-file contents. See [PRIVACY.md](PRIVACY.md) for the data model and boundaries.

## 5. Tune repository-specific policy

Copy `.ossbeacon.example.json` to `.ossbeacon.json` if the defaults are not enough for your repository. Useful early customizations include:

- risk thresholds that match your normal PR size;
- sensitive path patterns for authentication, workflows, dependencies, migrations, or other high-attention areas;
- the maximum number of changed files OSSBeacon should retrieve for one PR.

Keep the first configuration small. A transparent rule you understand is more useful than a giant policy file nobody trusts.

## What successful first adoption looks like

A healthy first trial does not need stars, AI, or automation everywhere. A useful milestone is simpler:

1. OSSBeacon runs reliably on normal pull requests.
2. A maintainer can explain why a report received its score.
3. The report changes or confirms review focus at least occasionally.
4. The project keeps human review authority.
5. The workflow does not require unnecessary permissions or secrets.

If OSSBeacon is useful on a real project, feedback is welcome through GitHub Issues. Public examples are especially helpful, but never post private repository data, tokens, or vulnerability details just to provide feedback.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  REPORT_SCHEMA_VERSION,
  buildPullRequestReport,
  buildIssueReport,
  buildReleaseReport
} from '../src/report.mjs';

test('pull request report exposes a stable minimal contract', () => {
  const report = buildPullRequestReport({
    repo: 'owner/project',
    number: '12',
    pr: { title: 'Add cache', html_url: 'https://github.com/owner/project/pull/12', draft: false },
    files: [{ filename: 'src/cache.mjs' }, { filename: 'tests/cache.test.mjs' }],
    analysis: {
      score: 35,
      level: 'medium',
      changedLines: 320,
      filesChanged: 2,
      truncated: false,
      sensitiveFiles: [],
      testFiles: ['tests/cache.test.mjs'],
      factors: ['Moderate change size: 320 lines'],
      checklist: ['Run the normal test suite and verify the stated behavior.']
    }
  });

  assert.equal(report.schemaVersion, '1.0');
  assert.equal(report.reportType, 'pull-request');
  assert.equal(report.subject.number, 12);
  assert.deepEqual(report.result.changes, { lines: 320, files: 2, analyzedFiles: 2, truncated: false });
  assert.deepEqual(report.ai, { generated: false, summary: null });
  assert.equal('pr' in report, false);
  assert.equal('files' in report, false);
});

test('issue report keeps classification evidence without issue body', () => {
  const report = buildIssueReport({
    repo: 'owner/project',
    number: 42,
    issue: { title: 'Crash on startup', body: 'private-ish diagnostic text', html_url: 'https://github.com/owner/project/issues/42' },
    triage: {
      primary: 'bug',
      labels: ['bug'],
      priority: 'normal',
      confidence: 0.75,
      evidence: [{ label: 'bug', hits: ['crash', 'error'] }]
    }
  });

  assert.equal(report.reportType, 'issue-triage');
  assert.equal(report.subject.title, 'Crash on startup');
  assert.deepEqual(report.result.evidence, [{ label: 'bug', hits: ['crash', 'error'] }]);
  assert.equal(JSON.stringify(report).includes('private-ish diagnostic text'), false);
});

test('release report preserves versioned grouped commit summaries', () => {
  const report = buildReleaseReport({
    repo: 'owner/project',
    from: 'v1.0.0',
    to: 'v1.1.0',
    notes: {
      totalCommits: 1,
      filesChanged: 3,
      additions: 40,
      deletions: 4,
      groups: {
        features: [{ sha: 'abcdef0', message: 'feat: add cache', author: 'octocat' }],
        fixes: [], docs: [], maintenance: [], other: []
      }
    },
    aiText: 'Cache support is the main user-visible change.'
  });

  assert.equal(report.reportType, 'release-notes');
  assert.deepEqual(report.subject, { from: 'v1.0.0', to: 'v1.1.0' });
  assert.equal(report.result.groups.features[0].sha, 'abcdef0');
  assert.deepEqual(report.ai, { generated: true, summary: 'Cache support is the main user-visible change.' });
});

test('published JSON Schema matches the report builder version', async () => {
  const text = await readFile(new URL('../schemas/report-v1.schema.json', import.meta.url), 'utf8');
  const schema = JSON.parse(text);

  assert.equal(REPORT_SCHEMA_VERSION, '1.0');
  assert.equal(schema.$defs.pullRequestReport.properties.schemaVersion.const, REPORT_SCHEMA_VERSION);
  assert.equal(schema.$defs.issueReport.properties.schemaVersion.const, REPORT_SCHEMA_VERSION);
  assert.equal(schema.$defs.releaseReport.properties.schemaVersion.const, REPORT_SCHEMA_VERSION);
});

export const REPORT_SCHEMA_VERSION = '1.0';

function aiSection(aiText = '') {
  const summary = String(aiText || '').trim();
  return { generated: Boolean(summary), summary: summary || null };
}

function subjectUrl(value) {
  return value ? String(value) : null;
}

export function buildPullRequestReport({ repo, number, pr = {}, files = [], analysis = {}, aiText = '' }) {
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    reportType: 'pull-request',
    repository: String(repo),
    subject: {
      number: Number(number),
      title: String(pr.title || ''),
      url: subjectUrl(pr.html_url),
      draft: Boolean(pr.draft)
    },
    result: {
      risk: {
        score: Number(analysis.score || 0),
        level: String(analysis.level || 'low')
      },
      changes: {
        lines: Number(analysis.changedLines || 0),
        files: Number(analysis.filesChanged || 0),
        analyzedFiles: files.length,
        truncated: Boolean(analysis.truncated)
      },
      sensitiveFiles: [...(analysis.sensitiveFiles || [])],
      testFiles: [...(analysis.testFiles || [])],
      factors: [...(analysis.factors || [])],
      checklist: [...(analysis.checklist || [])]
    },
    ai: aiSection(aiText)
  };
}

export function buildIssueReport({ repo, number, issue = {}, triage = {}, aiText = '' }) {
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    reportType: 'issue-triage',
    repository: String(repo),
    subject: {
      number: Number(number),
      title: String(issue.title || ''),
      url: subjectUrl(issue.html_url)
    },
    result: {
      primary: String(triage.primary || 'needs-triage'),
      labels: [...(triage.labels || [])],
      priority: String(triage.priority || 'normal'),
      confidence: Number(triage.confidence || 0),
      evidence: (triage.evidence || []).map(item => ({
        label: String(item.label || ''),
        hits: [...(item.hits || [])]
      }))
    },
    ai: aiSection(aiText)
  };
}

export function buildReleaseReport({ repo, from, to, notes = {}, aiText = '' }) {
  const groups = notes.groups || {};
  const copyGroup = name => (groups[name] || []).map(item => ({
    sha: String(item.sha || ''),
    message: String(item.message || ''),
    author: String(item.author || 'unknown')
  }));

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    reportType: 'release-notes',
    repository: String(repo),
    subject: {
      from: String(from),
      to: String(to)
    },
    result: {
      totalCommits: Number(notes.totalCommits || 0),
      filesChanged: Number(notes.filesChanged || 0),
      additions: Number(notes.additions || 0),
      deletions: Number(notes.deletions || 0),
      groups: {
        features: copyGroup('features'),
        fixes: copyGroup('fixes'),
        docs: copyGroup('docs'),
        maintenance: copyGroup('maintenance'),
        other: copyGroup('other')
      }
    },
    ai: aiSection(aiText)
  };
}

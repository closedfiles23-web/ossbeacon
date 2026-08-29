const RULES = [
  ['security', ['security', 'vulnerability', 'cve', 'exploit', 'xss', 'csrf', 'injection']],
  ['bug', ['bug', 'broken', 'error', 'crash', 'fails', 'failure', 'regression', 'unexpected']],
  ['performance', ['performance', 'slow', 'latency', 'memory', 'cpu', 'speed']],
  ['documentation', ['docs', 'documentation', 'readme', 'typo', 'guide']],
  ['feature', ['feature', 'request', 'proposal', 'support for', 'would be nice', 'enhancement']],
  ['question', ['question', 'how do i', 'how to', 'help me', 'clarify']]
];

export function triageIssue(issue) {
  const text = `${issue?.title || ''}\n${issue?.body || ''}`.toLowerCase();
  const matches = RULES.map(([label, words]) => ({ label, hits: words.filter(word => text.includes(word)) }))
    .filter(item => item.hits.length)
    .sort((a, b) => b.hits.length - a.hits.length);
  const primary = matches[0]?.label || 'needs-triage';
  const labels = [...new Set(matches.slice(0, 3).map(x => x.label))];
  if (!labels.length) labels.push('needs-triage');
  const priority = primary === 'security' ? 'urgent' : /blocker|critical|data loss|production/i.test(text) ? 'high' : 'normal';
  return {
    primary,
    labels,
    priority,
    confidence: matches.length ? Math.min(0.95, 0.55 + matches[0].hits.length * 0.1) : 0.3,
    evidence: matches.slice(0, 3)
  };
}

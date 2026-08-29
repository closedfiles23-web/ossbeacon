function normalized(path) { return String(path || '').toLowerCase(); }

export function scorePullRequest(pr, files = [], config) {
  const changedLines = Number(pr?.additions || 0) + Number(pr?.deletions || 0);
  const factors = [];
  let score = 0;

  if (changedLines >= config.risk.veryLargeChangeLines) {
    score += 35; factors.push(`Very large change: ${changedLines} lines`);
  } else if (changedLines >= config.risk.largeChangeLines) {
    score += 20; factors.push(`Large change: ${changedLines} lines`);
  } else if (changedLines >= 250) {
    score += 10; factors.push(`Moderate change size: ${changedLines} lines`);
  }

  if (files.length >= 40) { score += 20; factors.push(`${files.length} files changed`); }
  else if (files.length >= 15) { score += 10; factors.push(`${files.length} files changed`); }

  const sensitive = [];
  for (const file of files) {
    const path = normalized(file.filename);
    if (config.risk.sensitivePatterns.some(pattern => path.includes(String(pattern).toLowerCase()))) sensitive.push(file.filename);
  }
  if (sensitive.length) {
    score += Math.min(30, 8 + sensitive.length * 4);
    factors.push(`Sensitive areas touched: ${sensitive.slice(0, 5).join(', ')}${sensitive.length > 5 ? '…' : ''}`);
  }

  const testFiles = files.filter(f => /(^|\/)(test|tests|spec|specs)(\/|\.)|\.(test|spec)\.[cm]?[jt]sx?$/i.test(f.filename));
  const codeFiles = files.filter(f => /\.(js|jsx|ts|tsx|py|go|rs|java|kt|rb|php|cs|cpp|c|h)$/i.test(f.filename));
  if (codeFiles.length >= 3 && testFiles.length === 0) {
    score += 15; factors.push('Code changed without obvious test changes');
  }

  if (pr?.draft) { score = Math.max(0, score - 5); factors.push('Draft PR: review urgency reduced'); }
  score = Math.max(0, Math.min(100, score));

  let level = 'low';
  if (score >= config.risk.highThreshold) level = 'high';
  else if (score >= config.risk.mediumThreshold) level = 'medium';

  return {
    score, level, changedLines, filesChanged: files.length,
    sensitiveFiles: sensitive, testFiles: testFiles.map(f => f.filename), factors
  };
}

export function reviewChecklist(analysis) {
  const items = [];
  if (analysis.truncated) items.push('Review changed files beyond the configured OSSBeacon analysis cap manually.');
  if (analysis.sensitiveFiles.length) items.push('Verify permission, security, workflow, dependency, or data-model changes carefully.');
  if (analysis.factors.some(x => x.includes('without obvious test'))) items.push('Ask whether regression tests should cover the changed behavior.');
  if (analysis.changedLines >= 600) items.push('Consider splitting the PR if independent changes can be reviewed separately.');
  if (!items.length) items.push('Run the normal test suite and verify the stated behavior.');
  return items;
}

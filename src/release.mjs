function subject(message = '') { return String(message).split('\n')[0].trim(); }

export function buildReleaseNotes(compare) {
  const commits = compare?.commits || [];
  const groups = { features: [], fixes: [], docs: [], maintenance: [], other: [] };
  for (const commit of commits) {
    const msg = subject(commit?.commit?.message || '');
    const item = { sha: String(commit.sha || '').slice(0, 7), message: msg, author: commit?.author?.login || commit?.commit?.author?.name || 'unknown' };
    if (/^(feat|feature)(\(.+\))?:/i.test(msg)) groups.features.push(item);
    else if (/^(fix|bugfix)(\(.+\))?:/i.test(msg)) groups.fixes.push(item);
    else if (/^(docs)(\(.+\))?:/i.test(msg)) groups.docs.push(item);
    else if (/^(chore|build|ci|test|refactor|perf)(\(.+\))?:/i.test(msg)) groups.maintenance.push(item);
    else groups.other.push(item);
  }
  return {
    totalCommits: commits.length,
    filesChanged: compare?.files?.length || 0,
    additions: compare?.files?.reduce((n, f) => n + Number(f.additions || 0), 0) || 0,
    deletions: compare?.files?.reduce((n, f) => n + Number(f.deletions || 0), 0) || 0,
    groups
  };
}

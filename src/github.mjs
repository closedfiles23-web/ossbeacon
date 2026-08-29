const API = 'https://api.github.com';

function repoParts(repo) {
  const match = /^([^/]+)\/([^/]+)$/.exec(repo ?? '');
  if (!match) throw new Error('Repository must use owner/name format.');
  return match.slice(1).map(encodeURIComponent);
}

function headers(token) {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ossbeacon/0.1.0',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...headers(token), ...(options.headers || {}) }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub API ${response.status}: ${detail.slice(0, 500)}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function getPullRequest(repo, number, token = process.env.GITHUB_TOKEN) {
  const [owner, name] = repoParts(repo);
  const pr = await request(`/repos/${owner}/${name}/pulls/${Number(number)}`, token);
  const files = await request(`/repos/${owner}/${name}/pulls/${Number(number)}/files?per_page=100`, token);
  return { pr, files };
}

export async function getIssue(repo, number, token = process.env.GITHUB_TOKEN) {
  const [owner, name] = repoParts(repo);
  return request(`/repos/${owner}/${name}/issues/${Number(number)}`, token);
}

export async function compareRefs(repo, from, to, token = process.env.GITHUB_TOKEN) {
  const [owner, name] = repoParts(repo);
  return request(`/repos/${owner}/${name}/compare/${encodeURIComponent(from)}...${encodeURIComponent(to)}`, token);
}

export async function postIssueComment(repo, number, body, token = process.env.GITHUB_TOKEN) {
  if (!token) throw new Error('GITHUB_TOKEN is required to post comments.');
  const [owner, name] = repoParts(repo);
  return request(`/repos/${owner}/${name}/issues/${Number(number)}/comments`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body })
  });
}

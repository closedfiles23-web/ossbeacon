const API = 'https://api.github.com';

export const OSSBEACON_COMMENT_MARKER = '<!-- ossbeacon:pr-report:v1 -->';

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

async function requestArrayPages(path, token, { perPage = 100, maxItems = 1000 } = {}) {
  const limit = Math.max(1, Math.floor(Number(maxItems) || 1000));
  const pageSize = Math.max(1, Math.min(100, Math.floor(Number(perPage) || 100)));
  const items = [];
  let page = 1;
  let truncated = false;

  while (true) {
    const separator = path.includes('?') ? '&' : '?';
    const batch = await request(`${path}${separator}per_page=${pageSize}&page=${page}`, token);
    if (!Array.isArray(batch)) throw new Error('Expected a paginated GitHub API array response.');

    if (items.length >= limit) {
      truncated = batch.length > 0;
      break;
    }

    const remaining = limit - items.length;
    if (batch.length > remaining) {
      items.push(...batch.slice(0, remaining));
      truncated = true;
      break;
    }

    items.push(...batch);
    if (batch.length < pageSize) break;
    page += 1;
  }

  return { items, truncated };
}

export function formatOssBeaconComment(body) {
  return `${OSSBEACON_COMMENT_MARKER}\n${String(body || '').trim()}\n`;
}

export function findOssBeaconComment(comments = []) {
  for (let index = comments.length - 1; index >= 0; index -= 1) {
    const comment = comments[index];
    const body = String(comment?.body || '');
    if (body === OSSBEACON_COMMENT_MARKER || body.startsWith(`${OSSBEACON_COMMENT_MARKER}\n`)) return comment;
  }
  return null;
}

export async function getPullRequest(repo, number, token = process.env.GITHUB_TOKEN, maxFiles = 1000) {
  const [owner, name] = repoParts(repo);
  const pr = await request(`/repos/${owner}/${name}/pulls/${Number(number)}`, token);
  const { items: files, truncated: filesTruncated } = await requestArrayPages(
    `/repos/${owner}/${name}/pulls/${Number(number)}/files`,
    token,
    { maxItems: maxFiles }
  );
  return { pr, files, filesTruncated };
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

export async function upsertOssBeaconComment(repo, number, body, token = process.env.GITHUB_TOKEN) {
  if (!token) throw new Error('GITHUB_TOKEN is required to manage comments.');
  const [owner, name] = repoParts(repo);
  const issueNumber = Number(number);
  const { items: comments } = await requestArrayPages(
    `/repos/${owner}/${name}/issues/${issueNumber}/comments`,
    token,
    { maxItems: 5000 }
  );
  const markedBody = formatOssBeaconComment(body);
  const existing = findOssBeaconComment(comments);

  if (existing?.id) {
    const comment = await request(`/repos/${owner}/${name}/issues/comments/${Number(existing.id)}`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: markedBody })
    });
    return { action: 'updated', comment };
  }

  const comment = await request(`/repos/${owner}/${name}/issues/${issueNumber}/comments`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: markedBody })
  });
  return { action: 'created', comment };
}

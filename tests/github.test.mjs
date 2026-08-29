import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPullRequest,
  OSSBEACON_COMMENT_MARKER,
  upsertOssBeaconComment
} from '../src/github.mjs';

function jsonResponse(value, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return value; },
    async text() { return JSON.stringify(value); }
  };
}

test('paginates pull request files beyond 100', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const pages = [];

  globalThis.fetch = async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/pulls/1')) {
      return jsonResponse({ title: 'Large PR', additions: 10, deletions: 2 });
    }
    if (parsed.pathname.endsWith('/pulls/1/files')) {
      const page = Number(parsed.searchParams.get('page'));
      pages.push(page);
      const count = page === 1 ? 100 : page === 2 ? 2 : 0;
      return jsonResponse(Array.from({ length: count }, (_, index) => ({ filename: `src/file-${page}-${index}.js` })));
    }
    return jsonResponse({ message: 'not found' }, 404);
  };

  const result = await getPullRequest('owner/repo', 1, 'token', 500);
  assert.equal(result.files.length, 102);
  assert.equal(result.filesTruncated, false);
  assert.deepEqual(pages, [1, 2]);
});

test('marks analysis truncated when configured file cap is exceeded', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const pages = [];

  globalThis.fetch = async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/pulls/2')) {
      return jsonResponse({ title: 'Huge PR', additions: 10, deletions: 2 });
    }
    if (parsed.pathname.endsWith('/pulls/2/files')) {
      const page = Number(parsed.searchParams.get('page'));
      pages.push(page);
      return jsonResponse(Array.from({ length: 100 }, (_, index) => ({ filename: `src/file-${page}-${index}.js` })));
    }
    return jsonResponse({ message: 'not found' }, 404);
  };

  const result = await getPullRequest('owner/repo', 2, 'token', 100);
  assert.equal(result.files.length, 100);
  assert.equal(result.filesTruncated, true);
  assert.deepEqual(pages, [1, 2]);
});

test('creates a marked comment when OSSBeacon has not commented yet', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    const method = options.method || 'GET';
    calls.push({ path: parsed.pathname, method, body: options.body });
    if (method === 'GET' && parsed.pathname.endsWith('/issues/7/comments')) return jsonResponse([]);
    if (method === 'POST' && parsed.pathname.endsWith('/issues/7/comments')) {
      return jsonResponse({ id: 71, body: JSON.parse(options.body).body }, 201);
    }
    return jsonResponse({ message: 'not found' }, 404);
  };

  const result = await upsertOssBeaconComment('owner/repo', 7, 'fresh report', 'token');
  const write = calls.find(call => call.method === 'POST');
  assert.equal(result.action, 'created');
  assert.ok(write);
  assert.ok(JSON.parse(write.body).body.startsWith(`${OSSBEACON_COMMENT_MARKER}\n`));
  assert.deepEqual(calls.map(call => call.method), ['GET', 'POST']);
});

test('updates the existing marked OSSBeacon comment', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    const method = options.method || 'GET';
    calls.push({ path: parsed.pathname, method, body: options.body });
    if (method === 'GET' && parsed.pathname.endsWith('/issues/8/comments')) {
      return jsonResponse([
        { id: 80, body: 'human review note' },
        { id: 81, body: `${OSSBEACON_COMMENT_MARKER}\nold report\n` }
      ]);
    }
    if (method === 'PATCH' && parsed.pathname.endsWith('/issues/comments/81')) {
      return jsonResponse({ id: 81, body: JSON.parse(options.body).body });
    }
    return jsonResponse({ message: 'not found' }, 404);
  };

  const result = await upsertOssBeaconComment('owner/repo', 8, 'new report', 'token');
  assert.equal(result.action, 'updated');
  assert.equal(calls.filter(call => call.method === 'PATCH').length, 1);
  assert.equal(calls.filter(call => call.method === 'POST').length, 0);
  assert.ok(calls.some(call => call.path.endsWith('/issues/comments/81')));
});

test('never edits unrelated human or bot comments', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    const parsed = new URL(url);
    const method = options.method || 'GET';
    calls.push({ path: parsed.pathname, method, body: options.body });
    if (method === 'GET' && parsed.pathname.endsWith('/issues/9/comments')) {
      return jsonResponse([
        { id: 90, body: 'looks good to me', user: { login: 'maintainer' } },
        { id: 91, body: '<!-- another-tool -->\na bot report', user: { login: 'other-bot[bot]' } },
        { id: 92, body: `quoted marker later: ${OSSBEACON_COMMENT_MARKER}`, user: { login: 'reviewer' } }
      ]);
    }
    if (method === 'POST' && parsed.pathname.endsWith('/issues/9/comments')) {
      return jsonResponse({ id: 93, body: JSON.parse(options.body).body }, 201);
    }
    return jsonResponse({ message: 'not found' }, 404);
  };

  const result = await upsertOssBeaconComment('owner/repo', 9, 'new report', 'token');
  assert.equal(result.action, 'created');
  assert.equal(calls.filter(call => call.method === 'PATCH').length, 0);
  assert.equal(calls.filter(call => call.method === 'POST').length, 1);
});

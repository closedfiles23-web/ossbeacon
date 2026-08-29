import test from 'node:test';
import assert from 'node:assert/strict';
import { getPullRequest } from '../src/github.mjs';

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

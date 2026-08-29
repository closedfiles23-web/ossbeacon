import test from 'node:test';
import assert from 'node:assert/strict';
import { scorePullRequest, reviewChecklist } from '../src/risk.mjs';
import { DEFAULT_CONFIG } from '../src/config.mjs';

const c = DEFAULT_CONFIG;
test('tiny PR is low risk', () => { assert.equal(scorePullRequest({additions:10,deletions:2}, [{filename:'src/a.js'},{filename:'tests/a.test.js'}], c).level, 'low'); });
test('large PR raises score', () => { assert.ok(scorePullRequest({additions:700,deletions:0}, [{filename:'src/a.js'}], c).score >= 20); });
test('very large PR adds stronger signal', () => { assert.ok(scorePullRequest({additions:1600,deletions:0}, [{filename:'src/a.js'}], c).score >= 35); });
test('workflow is sensitive', () => { assert.equal(scorePullRequest({additions:1,deletions:1}, [{filename:'.github/workflows/ci.yml'}], c).sensitiveFiles.length, 1); });
test('auth path is sensitive', () => { assert.equal(scorePullRequest({additions:1,deletions:1}, [{filename:'src/auth/login.js'}], c).sensitiveFiles.length, 1); });
test('code without tests is signaled', () => { const a=scorePullRequest({additions:20,deletions:2}, [{filename:'src/a.js'},{filename:'src/b.js'},{filename:'src/c.js'}], c); assert.ok(a.factors.some(x=>x.includes('without obvious test'))); });
test('test changes suppress missing-test signal', () => { const a=scorePullRequest({additions:20,deletions:2}, [{filename:'src/a.js'},{filename:'src/b.js'},{filename:'src/c.js'},{filename:'tests/a.test.js'}], c); assert.ok(!a.factors.some(x=>x.includes('without obvious test'))); });
test('score capped at 100', () => { const files=Array.from({length:80},(_,i)=>({filename:`security/auth/${i}.js`})); assert.equal(scorePullRequest({additions:5000,deletions:5000}, files, c).score, 100); });
test('draft lowers urgency score', () => { const base={additions:700,deletions:0}; const files=[{filename:'src/a.js'}]; assert.ok(scorePullRequest({...base,draft:true},files,c).score < scorePullRequest(base,files,c).score); });
test('checklist mentions tests when absent', () => { const a=scorePullRequest({additions:20,deletions:2}, [{filename:'a.js'},{filename:'b.js'},{filename:'c.js'}], c); assert.ok(reviewChecklist(a).some(x=>/regression tests/i.test(x))); });

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReleaseNotes } from '../src/release.mjs';

test('groups conventional commits', () => {
 const out=buildReleaseNotes({commits:[
  {sha:'abcdef123',commit:{message:'feat: add beacon'},author:{login:'a'}},
  {sha:'123456789',commit:{message:'fix: stop crash'},author:{login:'b'}},
  {sha:'999999999',commit:{message:'docs: update readme'},author:{login:'c'}}
 ],files:[]});
 assert.equal(out.groups.features.length,1); assert.equal(out.groups.fixes.length,1); assert.equal(out.groups.docs.length,1);
});
test('counts file statistics', () => { const out=buildReleaseNotes({commits:[],files:[{additions:4,deletions:1},{additions:2,deletions:3}]}); assert.equal(out.additions,6); assert.equal(out.deletions,4); });

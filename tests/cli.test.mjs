import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/cli.mjs';

test('parses command and values', () => { const x=parseArgs(['analyze-pr','--repo','a/b','--pr','5']); assert.equal(x.command,'analyze-pr'); assert.equal(x.flags.repo,'a/b'); assert.equal(x.flags.pr,'5'); });
test('parses booleans', () => { const x=parseArgs(['analyze-pr','--ai','--json']); assert.equal(x.flags.ai,true); assert.equal(x.flags.json,true); });

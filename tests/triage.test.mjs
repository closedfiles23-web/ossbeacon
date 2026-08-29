import test from 'node:test';
import assert from 'node:assert/strict';
import { triageIssue } from '../src/triage.mjs';

test('detects bug', () => assert.equal(triageIssue({title:'Bug: app crashes',body:'unexpected error'}).primary,'bug'));
test('detects feature', () => assert.equal(triageIssue({title:'Feature request',body:'support for TOML'}).primary,'feature'));
test('detects docs', () => assert.equal(triageIssue({title:'README typo',body:'documentation'}).primary,'documentation'));
test('detects security and urgent priority', () => { const x=triageIssue({title:'Security vulnerability',body:'possible injection'}); assert.equal(x.primary,'security'); assert.equal(x.priority,'urgent'); });
test('unknown issue needs triage', () => assert.equal(triageIssue({title:'Something',body:'details'}).primary,'needs-triage'));
test('critical text raises priority', () => assert.equal(triageIssue({title:'Bug',body:'critical production blocker'}).priority,'high'));

#!/usr/bin/env node
import { loadConfig } from './config.mjs';
import { analyzePr, triage, releaseNotes } from './commands.mjs';
import { scorePullRequest, reviewChecklist } from './risk.mjs';
import { triageIssue } from './triage.mjs';

export function parseArgs(argv) {
  const [command = 'help', ...rest] = argv;
  const flags = {};
  for (let i = 0; i < rest.length; i++) {
    const part = rest[i];
    if (!part.startsWith('--')) continue;
    const key = part.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith('--')) flags[key] = true;
    else { flags[key] = next; i++; }
  }
  return { command, flags };
}

function required(flags, name) {
  if (flags[name] === undefined) throw new Error(`Missing required flag --${name}`);
  return flags[name];
}

function printHelp() {
  console.log(`OSSBeacon 0.1.0\n\nCommands:\n  analyze-pr    --repo owner/name --pr 123 [--ai] [--json]\n  triage-issue  --repo owner/name --issue 42 [--ai] [--json]\n  release-notes --repo owner/name --from v1.0.0 --to v1.1.0 [--ai] [--json]\n  doctor\n  demo\n\nEnvironment:\n  GITHUB_TOKEN       Recommended for private repos and higher GitHub API limits\n  OPENAI_API_KEY     Required only with --ai\n  OSSBEACON_MODEL    Optional model override\n`);
}

async function doctor() {
  console.log(JSON.stringify({
    node: process.version,
    githubToken: Boolean(process.env.GITHUB_TOKEN),
    openaiKey: Boolean(process.env.OPENAI_API_KEY),
    status: 'ok'
  }, null, 2));
}

async function demo(config) {
  const pr = { additions: 880, deletions: 120, draft: false };
  const files = [
    { filename: 'src/auth/session.mjs' }, { filename: '.github/workflows/release.yml' },
    { filename: 'src/api.mjs' }, { filename: 'README.md' }
  ];
  const analysis = scorePullRequest(pr, files, config);
  analysis.checklist = reviewChecklist(analysis);
  const issue = triageIssue({ title: 'Crash when token expires', body: 'The app throws an unexpected error in production.' });
  console.log(JSON.stringify({ samplePrAnalysis: analysis, sampleIssueTriage: issue }, null, 2));
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  const config = await loadConfig(flags.config || '.ossbeacon.json');
  let result;
  if (command === 'analyze-pr') {
    result = await analyzePr({ repo: required(flags, 'repo'), number: required(flags, 'pr'), config, ai: Boolean(flags.ai) });
  } else if (command === 'triage-issue') {
    result = await triage({ repo: required(flags, 'repo'), number: required(flags, 'issue'), config, ai: Boolean(flags.ai) });
  } else if (command === 'release-notes') {
    result = await releaseNotes({ repo: required(flags, 'repo'), from: required(flags, 'from'), to: required(flags, 'to'), config, ai: Boolean(flags.ai) });
  } else if (command === 'doctor') return doctor();
  else if (command === 'demo') return demo(config);
  else return printHelp();

  if (flags.json) console.log(JSON.stringify(result, null, 2));
  else console.log(result.markdown);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => { console.error(`OSSBeacon error: ${error.message}`); process.exitCode = 1; });
}

import { readFile, appendFile } from 'node:fs/promises';
import { loadConfig } from './config.mjs';
import { analyzePr } from './commands.mjs';
import { postIssueComment } from './github.mjs';

async function main() {
  if (!process.env.GITHUB_EVENT_PATH) throw new Error('GITHUB_EVENT_PATH is unavailable.');
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const repo = event?.repository?.full_name;
  const number = event?.pull_request?.number;
  if (!repo || !number) {
    console.log('OSSBeacon: event is not a pull request; nothing to analyze.');
    return;
  }
  const config = await loadConfig(process.env.OSSBEACON_CONFIG || '.ossbeacon.json');
  const useAi = /^true$/i.test(process.env.OSSBEACON_USE_AI || 'false');
  const result = await analyzePr({ repo, number, config, ai: useAi });
  console.log(result.markdown);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${result.markdown}\n`, 'utf8');
  if (/^true$/i.test(process.env.OSSBEACON_COMMENT || 'false')) await postIssueComment(repo, number, result.markdown);
}

main().catch(error => { console.error(`OSSBeacon action failed: ${error.message}`); process.exitCode = 1; });

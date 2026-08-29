import { getPullRequest, getIssue, compareRefs } from './github.mjs';
import { scorePullRequest, reviewChecklist } from './risk.mjs';
import { triageIssue } from './triage.mjs';
import { buildReleaseNotes } from './release.mjs';
import { askOpenAI } from './openai.mjs';
import { prMarkdown, issueMarkdown, releaseMarkdown } from './format.mjs';

export async function analyzePr({ repo, number, config, ai = false }) {
  const { pr, files } = await getPullRequest(repo, number);
  const analysis = scorePullRequest(pr, files, config);
  analysis.checklist = reviewChecklist(analysis);
  let aiText = '';
  if (ai) {
    const compactFiles = files.slice(0, config.ai.maxFiles).map(f => ({ filename: f.filename, status: f.status, additions: f.additions, deletions: f.deletions }));
    aiText = await askOpenAI({
      model: process.env.OSSBEACON_MODEL || config.ai.model,
      instructions: 'You assist open-source maintainers. Be concise, evidence-based, and avoid claiming you inspected code content that was not provided. Identify review focus, likely regression areas, and missing validation. Do not provide exploit instructions.',
      input: JSON.stringify({ title: pr.title, body: pr.body, additions: pr.additions, deletions: pr.deletions, files: compactFiles, heuristic: analysis })
    });
  }
  return { pr, files, analysis, markdown: prMarkdown(repo, number, pr, analysis, aiText), aiText };
}

export async function triage({ repo, number, config, ai = false }) {
  const issue = await getIssue(repo, number);
  const result = triageIssue(issue);
  let aiText = '';
  if (ai) {
    aiText = await askOpenAI({
      model: process.env.OSSBEACON_MODEL || config.ai.model,
      instructions: 'You assist open-source maintainers triaging issues. Give a short classification rationale, one clarifying question if needed, and next maintainer action. Do not fabricate project facts.',
      input: JSON.stringify({ title: issue.title, body: issue.body, heuristic: result })
    });
  }
  return { issue, triage: result, markdown: issueMarkdown(repo, number, issue, result, aiText), aiText };
}

export async function releaseNotes({ repo, from, to, config, ai = false }) {
  const compare = await compareRefs(repo, from, to);
  const notes = buildReleaseNotes(compare);
  let aiText = '';
  if (ai) {
    aiText = await askOpenAI({
      model: process.env.OSSBEACON_MODEL || config.ai.model,
      instructions: 'Write concise open-source release highlights from commit metadata only. Group user-visible changes and mention possible upgrade attention. Never invent breaking changes.',
      input: JSON.stringify(notes)
    });
  }
  return { compare, notes, markdown: releaseMarkdown(repo, from, to, notes, aiText), aiText };
}

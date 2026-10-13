// Checks installed contracts and preserved pure APIs without launching stock jobs or metrics.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { plan, modelSelection, links, blockerLinks, PR_STATUSES } from '../../.agents/skills/dispatch/dispatch-plan.mjs';
import { codexCost, summarize } from '../../.agents/skills/dispatch/usage.mjs';
import { inferJob, mapWork, mechanicalItem, upsert } from '../../.agents/skills/dispatch/metrics.mjs';
const config = JSON.parse(await readFile(new URL('../../factory.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('../../docs/factory/upstream-contracts.json', import.meta.url), 'utf8'));
const skills = new URL('../../.agents/skills/', import.meta.url);
async function installed(directory, prefix = '') {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) paths.push(...await installed(new URL(`${entry.name}/`, directory), `${relative}/`));
    else paths.push(relative);
  }
  return paths.sort();
}

test('the installed skill inventory is pinned and contains no obsolete contracts', async () => {
  assert.equal(config.upstream.commit, '7d756086b9938635e0cd11064a4d337eae747326');
  assert.equal(manifest.commit, config.upstream.commit);
  assert.deepEqual(await installed(skills), Object.keys(manifest.skills).sort());
  for (const [path, proof] of Object.entries(manifest.skills)) {
    const digest = createHash('sha256').update(await readFile(new URL(path, skills))).digest('hex');
    assert.equal(digest, proof.installedSha256, path);
    assert.equal(proof.upstreamBlob.length, 40);
  }
  for (const obsolete of ['code-review', 'error-handling', 'review-boundaries', 'review-frontend', 'review-regressions', 'verifier']) {
    assert.equal(Object.keys(manifest.skills).some(path => path.startsWith(`${obsolete}/`)), false);
  }
});

test('the v3 review mapping stays Sol and replaces legacy review/verifier jobs', () => {
  assert.equal(config.jobs['review-*'], undefined);
  assert.equal(config.jobs.verifier, undefined);
  for (const role of Object.keys(config.jobs)) {
    const selection = modelSelection(config, role);
    assert.equal(selection.instanceId, 'codex');
    assert.equal(selection.model, 'gpt-6.1-sol');
  }
  assert.ok(PR_STATUSES.includes('reviewer-ready'));
  assert.equal(PR_STATUSES.includes('verifier-ready'), false);
});

test('the pure planner can suggest a Sol worker without applying external actions', () => {
  const result = plan({ repo: 'test/repo', root: '/fixture', config, issues: [{ number: 1, title: 'Fix campaign',
    labels: ['agent-ready', 'p2'], body: '', createdAt: '2026-10-13T19:00:00Z' }], prs: [], closedPrs: [], refs: {},
    threads: [], worktrees: [{ path: '/fixture', branch: 'main' }], remoteBranches: ['main'], localBranches: [],
    nudged: [], now: Date.parse('2026-10-13T19:30:00Z'), spend: { usd: 0 } });
  const launch = result.t3.find(action => action.do === 'launch');
  assert.equal(launch.modelSelection.model, 'gpt-6.1-sol');
  assert.equal(launch.issue, 1);
  assert.deepEqual(links('Depends on #1\nDepends on #2', 'Depends on'), [1, 2]);
  assert.deepEqual(blockerLinks('Blocked by #3', []), [3]);
});

test('pure usage and metrics transforms remain available while live collection is held', () => {
  assert.equal(codexCost({ input: 1000, cached: 0, cacheWrite: 0, output: 100 }, { input: 2, output: 10 }), 0.003);
  assert.equal(summarize([], {}).usd, 0);
  assert.deepEqual(inferJob('Factory · review round 2'), { job: 'review', round: 2 });
  assert.equal(mapWork({ repo: 'test/repo', cwds: [] }).id, null);
  const item = mechanicalItem('test/repo', { number: 1, title: 'Fix', state: 'open', labels: [] }, null);
  assert.equal(item.id, 'test/repo:issue:1');
  assert.ok(upsert('projects', { id: 'test/repo', name: 'repo' }).sql.startsWith('INSERT'));
});

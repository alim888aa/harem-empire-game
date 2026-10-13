// Tests command admission before upstream dispatch or log-meter side effects.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dispatch = fileURLToPath(new URL('../../.agents/skills/dispatch/dispatch-plan.mjs', import.meta.url));
const usage = fileURLToPath(new URL('../../.agents/skills/dispatch/usage.mjs', import.meta.url));

test('upstream dispatch apply and acknowledgement are held before external actions', () => {
  for (const args of [['--apply', '--repo', 'alim888aa/harem-empire-game'], ['--ack', 'example']]) {
    const result = spawnSync(process.execPath, [dispatch, ...args], { encoding: 'utf8', input: '[]' });
    assert.equal(result.status, 1);
    const outcome = JSON.parse(result.stdout);
    assert.deepEqual(outcome.t3, []);
    assert.match(outcome.stop, /Stock T3 CLI dispatch is unsupported/);
    assert.equal(result.stderr, '');
  }
});

test('upstream local usage CLI stops without inspecting a session directory', () => {
  const result = spawnSync(process.execPath, [usage, '--root', '/nonexistent-project'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Accounting unavailable/);
  assert.equal(result.stderr, '');
});

test('imported usage admission rejects before local-log accounting', async () => {
  const { spentToday } = await import('../../.agents/skills/dispatch/usage.mjs');
  await assert.rejects(spentToday(), /Local session accounting is unavailable/);
});

test('imported stock mutation paths stop before filesystem or GitHub callbacks', async () => {
  const { apply, recordSettleResult, readSettleFailures } = await import('../../.agents/skills/dispatch/dispatch-plan.mjs');
  let externalCalls = 0;
  assert.throws(() => apply({}, { github: [{ do: 'comment', number: 1, body: 'unsafe' }] }, () => externalCalls++), /unsupported/);
  assert.throws(() => recordSettleResult('/nonexistent-project', 't1', { ok: true }), /unsupported/);
  assert.throws(() => readSettleFailures('/nonexistent-project', []), /unsupported/);
  assert.equal(externalCalls, 0);
});

test('live metrics entrypoints stop before session, credential or D1 access', async () => {
  const { readT3, collectCharges, d1Client, sync } = await import('../../.agents/skills/dispatch/metrics.mjs');
  let externalCalls = 0;
  await assert.rejects(readT3('/nonexistent-project'), /project-metrics-disabled/);
  await assert.rejects(collectCharges({ home: '/nonexistent-project', since: 0 }), /project-metrics-disabled/);
  await assert.rejects(d1Client({ home: '/nonexistent-project', config: {}, fetcher: async () => externalCalls++ }), /project-metrics-disabled/);
  await assert.rejects(sync({ repo: 'test/repo', root: '/nonexistent-project', query: async () => externalCalls++ }), /project-metrics-disabled/);
  assert.equal(externalCalls, 0);
  const path = fileURLToPath(new URL('../../.agents/skills/dispatch/metrics.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [path, '--repo', 'test/repo', '--root', '/nonexistent-project'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(JSON.parse(result.stdout).notes[0], /project-metrics-disabled/);
  assert.equal(result.stderr, '');
});

test('imported local-log collectors and readers reject before opening supplied paths', async () => {
  const { claudeCharges, codexCharges, readLines, recentLogs } = await import('../../.agents/skills/dispatch/usage.mjs');
  const fixture = '/nonexistent-factory-session-fixture';
  await assert.rejects(claudeCharges([fixture], {}), /Local session accounting is unavailable/);
  await assert.rejects(codexCharges(fixture, {}), /Local session accounting is unavailable/);
  await assert.rejects(readLines(fixture).next(), /Local session accounting is unavailable/);
  await assert.rejects(recentLogs(fixture, 0), /Local session accounting is unavailable/);
});

test('stock CLIs remain held through installed skill-folder symlinks', async () => {
  const { mkdtemp, symlink, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const directory = await mkdtemp(join(tmpdir(), 'factory-symlink-'));
  try {
    await symlink(fileURLToPath(new URL('../../.agents/skills/dispatch/', import.meta.url)), join(directory, 'dispatch'), 'dir');
    for (const file of ['dispatch-plan.mjs', 'usage.mjs', 'metrics.mjs']) {
      const result = spawnSync(process.execPath, [join(directory, 'dispatch', file)], { encoding: 'utf8', input: '[]' });
      assert.equal(result.status, 1);
      assert.equal(result.stderr, '');
      assert.match(result.stdout, /unsupported|Accounting unavailable|project-metrics-disabled/);
    }
  } finally {
    await rm(directory, { recursive: true });
  }
});

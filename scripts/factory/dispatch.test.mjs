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
    assert.match(outcome.stop, /actual accounting are unavailable/);
    assert.equal(result.stderr, '');
  }
});

test('upstream local usage CLI stops without inspecting a session directory', () => {
  const result = spawnSync(process.execPath, [usage, '--root', '/nonexistent-project'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Accounting unavailable/);
  assert.equal(result.stderr, '');
});

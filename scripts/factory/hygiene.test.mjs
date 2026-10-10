// Tests the hygiene command through its filesystem/CLI boundary.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = fileURLToPath(new URL('./hygiene.mjs', import.meta.url));
const empty = { explicitAny: 0, alerts: 0, consoleLogs: 0, unseededRandom: 0, longLines: 0, oversizedFiles: 0 };
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'factory-hygiene-'));
  await mkdir(join(root, 'src'));
  await mkdir(join(root, 'docs/factory'), { recursive: true });
  const execute = () => spawnSync(process.execPath, [command], {
    env: { ...process.env, FACTORY_HYGIENE_ROOT: root }, encoding: 'utf8'
  });
  try { await run(root, execute); } finally { await rm(root, { recursive: true, force: true }); }
}

test('hygiene passes an unchanged baseline and rejects increased source debt', async () => {
  await fixture(async (root, execute) => {
    await writeFile(join(root, 'docs/factory/hygiene-baseline.json'), JSON.stringify(empty));
    await writeFile(join(root, 'src/example.ts'), 'export const count = 1;');
    assert.equal(execute().status, 0);
    await writeFile(join(root, 'src/example.ts'), 'export const count: any = 1;');
    assert.equal(execute().status, 1);
  });
});

test('hygiene rejects absent and nonnumeric baseline rules', async () => {
  await fixture(async (root, execute) => {
    for (const baseline of [{}, { ...empty, explicitAny: 'zero' }, { ...empty, alerts: -1 }]) {
      await writeFile(join(root, 'docs/factory/hygiene-baseline.json'), JSON.stringify(baseline));
      const result = execute();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /baseline requires/);
    }
  });
});

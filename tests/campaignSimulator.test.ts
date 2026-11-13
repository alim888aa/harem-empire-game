// The simulator CLI owns report paths and must preserve computed output on write failure.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/simulate-campaign.ts', import.meta.url));
const loader = import.meta.resolve('tsx');

function simulate(cwd: string, seed = 1, reportPath?: string) {
  const env: NodeJS.ProcessEnv = { ...process.env, ROLE_FILTER: 'prince', POLICY_FILTER: 'bad' };
  delete env.SIM_REPORT_PATH;
  if (reportPath !== undefined) env.SIM_REPORT_PATH = reportPath;
  const result = spawnSync(process.execPath, ['--import', loader, script, '1', String(seed), '2'], {
    cwd, env, encoding: 'utf8', timeout: 30_000,
  });
  assert.ifError(result.error);
  return result;
}

function readSummaries(stdout: string) {
  const summaries = JSON.parse(stdout);
  assert.equal(summaries.length, 1);
  assert.equal(summaries[0].role, 'prince');
  assert.equal(summaries[0].policy, 'bad');
  assert.equal(summaries[0].runs, 1);
  assert.equal(summaries[0].errors, 0);
  return summaries;
}

for (const seed of [1, 7]) {
  test(`simulator creates absent default report directory for seed ${seed}`, t => {
    const cwd = mkdtempSync(join(tmpdir(), 'campaign-simulator-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    assert.equal(existsSync(join(cwd, 'validation')), false);
    const result = simulate(cwd, seed);
    assert.equal(result.status, 0, result.stderr);
    const filename = `campaign-simulation${seed === 1 ? '' : `-from-${seed}`}.json`;
    const report = JSON.parse(readFileSync(join(cwd, 'validation', filename), 'utf8'));
    assert.equal(report.seedStart, seed);
    assert.equal(report.seeds, 1);
    assert.equal(report.maxSeasons, 2);
    assert.equal(report.runs.length, 1);
    assert.equal(report.runs[0].seed, seed);
    assert.deepEqual(report.summaries, readSummaries(result.stdout));
  });
}

for (const absolute of [false, true]) {
  test(`simulator creates nested ${absolute ? 'absolute' : 'relative'} override parents`, t => {
    const cwd = mkdtempSync(join(tmpdir(), 'campaign-simulator-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const relative = join('reports', 'nested', 'custom.json');
    const result = simulate(cwd, 1, absolute ? join(cwd, relative) : relative);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(readFileSync(join(cwd, relative), 'utf8'));
    assert.deepEqual(report.summaries, readSummaries(result.stdout));
    assert.equal(existsSync(join(cwd, 'validation')), false);
  });
}

for (const blockedParent of [false, true]) {
  test(`simulator prints actual summaries when report ${blockedParent ? 'parent' : 'file'} cannot be written`, t => {
    const cwd = mkdtempSync(join(tmpdir(), 'campaign-simulator-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const successful = simulate(cwd, 1, 'reference.json');
    assert.equal(successful.status, 0, successful.stderr);
    const expected = JSON.parse(readFileSync(join(cwd, 'reference.json'), 'utf8')).summaries;
    const target = join(cwd, 'blocked');
    if (blockedParent) writeFileSync(target, 'owned fixture');
    else mkdirSync(target);
    const failed = simulate(cwd, 1, blockedParent ? join(target, 'report.json') : target);
    assert.notEqual(failed.status, 0);
    assert.equal(failed.signal, null);
    assert.match(failed.stderr, blockedParent ? /EEXIST|ENOTDIR/ : /EISDIR/);
    assert.deepEqual(readSummaries(failed.stdout), expected);
    if (blockedParent) assert.equal(readFileSync(target, 'utf8'), 'owned fixture');
  });
}

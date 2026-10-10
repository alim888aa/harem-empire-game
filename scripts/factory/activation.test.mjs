import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assessActivation } from './activation.mjs';

const config = JSON.parse(await readFile(new URL('../../factory.json', import.meta.url), 'utf8'));

test('manual configuration is valid while stock T3 CLI remains held', () => {
  const result = assessActivation(config);
  assert.equal(result.configurationValid, true);
  assert.equal(result.allowed, false);
});

test('automatic T3 configuration is rejected without blocking manual dispatch', () => {
  const changed = structuredClone(config);
  changed.execution.automatic = true;
  changed.budgetPolicy.accounting = 'exact-meter-required';
  const result = assessActivation(changed);
  assert.equal(result.configurationValid, false);
  assert.equal(result.allowed, false);
});

test('priority bypass, changed budgets and non-Sol jobs are rejected', () => {
  const changed = structuredClone(config);
  changed.budgetPolicy.priorityBypass = true;
  changed.budgetPolicy.refactorDayLimitUsd = 200;
  changed.jobs.owner.model = 'claude-opus-5-5';
  const result = assessActivation(changed);
  assert.equal(result.configurationValid, false);
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.some(reason => reason.includes('owner')));
});

test('absent configuration holds dispatch', () => {
  assert.equal(assessActivation(null).allowed, false);
});

test('missing role maps, role masking and unsupported accounting are invalid', () => {
  for (const missing of [null, {}, []]) {
    const changed = structuredClone(config);
    changed.jobs = missing;
    assert.equal(assessActivation(changed).configurationValid, false);
  }
  const changed = structuredClone(config);
  changed.jobs.owner.model = 'another-model';
  changed.council.owner = structuredClone(config.jobs.owner);
  assert.equal(assessActivation(changed).configurationValid, false);
  changed.jobs.owner.model = 'gpt-6.1-sol';
  changed.budgetPolicy.accounting = 'unknown';
  assert.equal(assessActivation(changed).configurationValid, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assessActivation } from './activation.mjs';

const config = JSON.parse(await readFile(new URL('../../factory.json', import.meta.url), 'utf8'));

test('committed setup configuration is valid but never admits an autonomous job', () => {
  const result = assessActivation(config);
  assert.equal(result.configurationValid, true);
  assert.equal(result.allowed, false);
});

test('declared accounting or enabled flags cannot bypass absent adapters', () => {
  const changed = structuredClone(config);
  changed.execution.enabled = true;
  changed.budgetPolicy.accounting = 'verified';
  const result = assessActivation(changed);
  assert.equal(result.configurationValid, false);
  assert.equal(result.allowed, false);
});

test('priority bypass, changed budgets and non-Sol jobs are rejected', () => {
  const changed = structuredClone(config);
  changed.budgetPolicy.priorityBypass = true;
  changed.budgetPolicy.refactor.period = 'day';
  changed.jobs.owner.model = 'claude-opus-5-5';
  const result = assessActivation(changed);
  assert.equal(result.configurationValid, false);
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.some(reason => reason.includes('owner')));
});

test('absent configuration holds dispatch', () => {
  assert.equal(assessActivation(null).allowed, false);
});

test('missing role maps, role masking and unknown phase are invalid', () => {
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
  changed.budgetPolicy.activePhase = 'unknown';
  assert.equal(assessActivation(changed).configurationValid, false);
});

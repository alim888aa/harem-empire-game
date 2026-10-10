// Tests local-day estimated reservations independently of unavailable token metering.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { projectDay, assessEstimatedJob } from './estimated-budget.mjs';
const config = JSON.parse(await readFile(new URL('../../factory.json', import.meta.url), 'utf8'));
const ledger = JSON.parse(await readFile(new URL('../../docs/factory/estimated-usage.json', import.meta.url), 'utf8'));
const today = new Date('2026-10-10T05:30:00Z');

test('today is the Ulaanbaatar calendar day, not a UTC day or cumulative pot', () => {
  assert.equal(projectDay(new Date('2026-10-09T16:00:00Z')), '2026-10-10');
  assert.equal(projectDay(new Date('2026-10-10T16:00:00Z')), '2026-10-11');
});

test('existing reservations are not double charged and leave stated headroom', () => {
  const result = assessEstimatedJob(config, ledger, { id: 'career-build', estimateUsd: 25 }, today);
  assert.equal(result.allowed, true);
  assert.equal(result.plannedUsd, 80);
  assert.equal(result.headroomUsd, 20);
  assert.equal(result.estimateOnly, true);
});

test('estimated ceiling stops new work regardless of priority; active reservations can finish', () => {
  assert.equal(assessEstimatedJob(config, ledger, { id: 'fix', estimateUsd: 20 }, today).allowed, true);
  assert.equal(assessEstimatedJob(config, ledger, { id: 'urgent', estimateUsd: 21, priority: 'p0' }, today).allowed, false);
});

test('maintenance uses a fresh $30 local-day ledger only when needed', () => {
  const next = new Date('2026-10-10T16:00:00Z');
  assert.equal(assessEstimatedJob(config, ledger, { id: 'maintain', estimateUsd: 5 }, next).allowed, false);
  const daily = { date: '2026-10-11', timezone: 'Asia/Ulaanbaatar', limitUsd: 30, entries: [] };
  assert.equal(assessEstimatedJob(config, daily, { id: 'maintain', estimateUsd: 30 }, next).allowed, true);
  assert.equal(assessEstimatedJob(config, daily, { id: 'maintain', estimateUsd: 31 }, next).allowed, false);
});

test('missing estimates and duplicate ledger jobs stop only their new admission', () => {
  assert.equal(assessEstimatedJob(config, ledger, { id: 'unpriced' }, today).allowed, false);
  const duplicate = { ...ledger, entries: [...ledger.entries, ledger.entries[0]] };
  assert.equal(assessEstimatedJob(config, duplicate, { id: 'new', estimateUsd: 1 }, today).allowed, false);
});

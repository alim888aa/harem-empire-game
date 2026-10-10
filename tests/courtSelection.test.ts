import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCourtier} from '../src/lib/courtSelection';
const maid = {name: 'Maid Ling'}, prince = {name: 'Crown Prince'};
test('conversation identity wins over a reordered or stale classic selection index', () => {
  assert.equal(selectCourtier([maid, prince], 1, 'Maid Ling'), maid);
  assert.equal(selectCourtier([prince, maid], 0, 'Maid Ling'), maid);
});
test('a vanished conversation never silently redirects gifts or romance to another courtier', () => {
  assert.equal(selectCourtier([prince], 0, 'Maid Ling'), undefined);
});
test('classic court selection remains clamped and empty rosters remain safe', () => {
  assert.equal(selectCourtier([maid, prince], 20, null), prince);
  assert.equal(selectCourtier([maid, prince], -1, null), maid);
  assert.equal(selectCourtier([], 0, null), undefined);
});

import assert from 'node:assert/strict';
import { createPalaceWorld } from '../src/palace/world.ts';

// Check the actual roaming implementation under both GPU-like and slow QA frames.
// This supports, but does not replace, rendered browser motion verification.
const cast = [
  { name: 'Maid Ling', type: 'minor' as const },
  { name: 'Maid Su', type: 'minor' as const },
  { name: 'Minister Chen', type: 'side' as const },
  { name: 'Prince Feng', type: 'side' as const },
  { name: 'Crown Prince', type: 'major' as const },
  { name: 'Empress Consort', type: 'major' as const },
];
for (const dt of [1 / 60, .1, .35]) {
  const world = createPalaceWorld(cast, 'prince', true);
  let time = 0;
  let distance = 0;
  for (; time < 60; time += dt) {
    const before = world.npcs.map(n => [n.x, n.z]);
    world.animate(time, dt, false);
    world.npcs.forEach((npc, index) => {
      const step = Math.hypot(npc.x - before[index][0], npc.z - before[index][1]);
      assert.ok(step <= .65 * dt + 1e-8, `${npc.name}: abrupt movement at dt ${dt}`);
      assert.ok(!world.colliders.some(c => Math.abs(npc.x - c.x) < c.w / 2 + .4 && Math.abs(npc.z - c.z) < c.d / 2 + .4), `${npc.name}: architectural overlap`);
      assert.ok(world.npcs.every(other => other === npc || Math.hypot(npc.x - other.x, npc.z - other.z) >= .8), `${npc.name}: courtier overlap`);
      distance += step;
    });
  }
  assert.ok(distance > 1, 'At least one courtier must actually roam');
  const frozen = world.npcs.map(n => [n.x, n.z]);
  for (let i = 0; i < 20; i++) world.animate(time + i * dt, dt, false, true);
  assert.deepEqual(world.npcs.map(n => [n.x, n.z]), frozen, 'Menus/conversations freeze spatial roaming');
  const ling = world.npcs[0];
  const start = [ling.x, ling.z];
  for (let i = 0; i < 20; i++) world.animate(time + i * dt, dt, false, false, new Set(['Maid Ling']));
  assert.deepEqual([ling.x, ling.z], start, 'Receiving a gift freezes the recipient');
  world.dispose();
}
const touring = createPalaceWorld([{ name: 'Maid Ling', type: 'minor' }], 'concubine', true);
const visited = new Set<string>();
for (let time = 0; time < 240; time += .1) {
  touring.animate(time, .1, false);
  const npc = touring.npcs[0];
  visited.add(npc.x < -11 ? (npc.z > 10 ? 'Western Gallery' : 'Pavilion of Strings') : npc.z > 10 ? 'Hall of Arrivals' : 'Hall of Harmony');
}
assert.equal(visited.size, 4, 'The actual route must visit both halls and connected western rooms');
touring.dispose();
console.log('PASS: bounded collision-aware roaming; paused/reaction freeze at 60fps, 10fps and 350ms frames; four-room route traversed.');

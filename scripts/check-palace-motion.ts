import assert from 'node:assert/strict';
import { createPalaceWorld } from '../src/palace/world.ts';
import { PLAYABLE_ZONES } from '../src/palace/zones.ts';

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
  const ling = world.npcs.find(npc => npc.name === 'Maid Ling');
  assert.ok(ling, 'The gift recipient must be present');
  const start = [ling.x, ling.z];
  for (let i = 0; i < 20; i++) world.animate(time + i * dt, dt, false, false, new Set(['Maid Ling']));
  assert.deepEqual([ling.x, ling.z], start, 'Receiving a gift freezes the recipient');
  world.dispose();
}
// Worlds now own one zone each. Exercise their actual local destinations rather
// than classifying coordinates using rooms from the former connected palace.
for (const zone of PLAYABLE_ZONES) {
  for (const dt of [1 / 60, .1, .35]) {
    const touring = createPalaceWorld([{ name: 'Maid Ling', type: 'minor' }], 'concubine', true, zone);
    try {
      const npc = touring.npcs[0];
      const destinations = npc.route.stops.filter((stop, index, stops) =>
        stops.findIndex(other => other.x === stop.x && other.z === stop.z) === index);
      const visited = new Set<number>();
      assert.equal(destinations.length, 4, `${zone}: the local patrol must retain four distinct destinations`);
      for (let time = 0; time < 240; time += dt) {
        const before = { x: npc.x, z: npc.z };
        touring.animate(time, dt, false);
        assert.ok(Math.hypot(npc.x - before.x, npc.z - before.z) <= .65 * dt + 1e-8,
          `${zone}: abrupt tour movement at dt ${dt}`);
        assert.ok(!touring.colliders.some(c =>
          Math.abs(npc.x - c.x) < c.w / 2 + .4 && Math.abs(npc.z - c.z) < c.d / 2 + .4),
        `${zone}: architectural overlap at dt ${dt}`);
        destinations.forEach((stop, index) => {
          if (Math.hypot(npc.x - stop.x, npc.z - stop.z) < .1) visited.add(index);
        });
      }
      assert.equal(visited.size, destinations.length,
        `${zone}: the actual route must reach every distinct local destination at dt ${dt}`);
    } finally {
      touring.dispose();
    }
  }
}
console.log('PASS: bounded collision-aware roaming; paused/reaction freeze; every local route traversed in all five zones at 60fps, 10fps and 350ms frames.');

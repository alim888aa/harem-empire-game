// Verifies player-body clearance against actual room geometry and live courtier positions.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlayerNavigation } from '../../src/palace/navigation';
import { createPalaceWorld } from '../../src/palace/world';
import { playerMovementSpeeds } from '../../src/palace/characterModels';
import { PLAYABLE_ZONES } from '../../src/palace/zones';

for (const role of ['prince', 'minister', 'concubine']) {
  test(`${role} player navigation preserves room collision and bounds in all five palaces`, () => {
    const radius = playerMovementSpeeds(role).radius;
    for (const zone of PLAYABLE_ZONES) {
      const world = createPalaceWorld([], role, false, zone);
      try {
        const navigation = createPlayerNavigation(world.colliders, world.bounds, radius, world.npcs);
        assert.equal(navigation.canStand(world.spawn), true, `${zone} spawn`);
        for (const point of [
          { x: world.bounds.minX, z: 0 }, { x: world.bounds.maxX, z: 0 },
          { x: 0, z: world.bounds.minZ }, { x: 0, z: world.bounds.maxZ },
          { x: 100, z: 100 },
          ...world.colliders.map(c => ({ x: c.x, z: c.z })),
        ]) {
          assert.equal(navigation.canStand(point), false, `${zone} rejects ${JSON.stringify(point)}`);
          assert.equal(navigation.canMove(world.spawn, point), false, `${zone} blocks movement to unsafe pose`);
        }
      } finally { world.dispose(); }
    }
  });
}

test('courtier overlap remains blocked except for movement away from an existing overlap', () => {
  const world = createPalaceWorld([{ name: 'Scholar Jia', type: 'minor' }], 'prince', false, 'library');
  try {
    const npc = world.npcs[0];
    const navigation = createPlayerNavigation(world.colliders, world.bounds, playerMovementSpeeds('prince').radius, world.npcs);
    const near = { x: npc.x + .78, z: npc.z }, overlapping = { x: npc.x + .7, z: npc.z };
    assert.equal(navigation.canStand(near), true);
    assert.equal(navigation.canMove({ x: npc.x + .9, z: npc.z }, near), true);
    assert.equal(navigation.canStand(overlapping), false);
    assert.equal(navigation.canMove(near, overlapping), false);
    assert.equal(navigation.canMove(overlapping, overlapping), false);
    assert.equal(navigation.canMove(overlapping, { x: npc.x + .71, z: npc.z }), true);
    assert.equal(navigation.canMove(overlapping, { x: npc.x + .69, z: npc.z }), false);
    npc.x += 2;
    assert.equal(navigation.canStand(overlapping), true, 'clearance reads live NPC positions, not a captured copy');
  } finally { world.dispose(); }
});

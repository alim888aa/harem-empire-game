// Regression coverage for navigating the library's tight furniture corners.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createPalaceWorld } from '../src/palace/world.ts';

for (const dt of [1 / 60, .1, .35]) {
  test(`library courtier clears furniture corners without cutting or stalling at dt ${dt}`, () => {
    const world = createPalaceWorld([{ name: 'Maid Ling', type: 'minor' }], 'concubine', true, 'library');
    try {
      const npc = world.npcs[0];
      let furthestZ = npc.z;
      for (let time = 0; time < 120; time += dt) {
        const before = { x: npc.x, z: npc.z };
        world.animate(time, dt, false);
        assert.ok(Math.hypot(npc.x - before.x, npc.z - before.z) <= .65 * dt + 1e-8,
          'Movement stays bounded, including at corners');
        assert.ok(!world.colliders.some(c =>
          Math.abs(npc.x - c.x) < c.w / 2 + .4 && Math.abs(npc.z - c.z) < c.d / 2 + .4),
        'The courtier must never cut through furniture');
        furthestZ = Math.max(furthestZ, npc.z);
      }
      assert.ok(furthestZ > 0, `The courtier must cross the library, but reached only z=${furthestZ}`);
    } finally {
      world.dispose();
    }
  });
}

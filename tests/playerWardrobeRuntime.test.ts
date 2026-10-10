// Owns the shared player wardrobe loading, rank-transition and authored-motion contract.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ModelAssetPool } from '../src/palace/assetPool';
import { characterAssetUrls, loadCourtCharacterModels, playerMovementSpeeds } from '../src/palace/characterModels';
import type { PalaceWorld } from '../src/palace/world';

Object.defineProperty(globalThis, 'self', { configurable: true, value: globalThis });
Object.defineProperty(globalThis, 'createImageBitmap', {
  configurable: true,
  value: async (blob: Blob) => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.deepEqual([...bytes.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(bytes.buffer);
    return { width: view.getUint32(16), height: view.getUint32(20), close() {} };
  },
});

const careers = [
  { role: 'prince', ranks: ['prince', 'grand_prince', 'crown_prince'], joints: 57, height: 2.0 },
  { role: 'minister', ranks: ['scholar', 'minister', 'prime_minister'], joints: 57, height: 2.05 },
  { role: 'concubine', ranks: ['concubine', 'consort', 'empress'], joints: 63, height: 2.05 },
] as const;
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 5));
async function bytesFor(url: string) {
  const bytes = await readFile(new URL(`../public${url.split('?')[0]}`, import.meta.url));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
function world() {
  return { player: { group: new THREE.Group(), moveSpeed: 0, airborne: false }, npcs: [] } as unknown as PalaceWorld;
}
async function ready(models: ReturnType<typeof loadCourtCharacterModels>) {
  for (let i = 0; i < 100 && models.status().pending; i++) await tick();
  assert.equal(models.status().pending, 0);
}

for (const career of careers) {
  test(`${career.role}: all rank files render as articulated models and preserve physical controls`, async () => {
    for (const rank of career.ranks) {
      const [url] = characterAssetUrls([], career.role, rank);
      const asset = await new GLTFLoader().parseAsync(await bytesFor(url), '');
      assert.deepEqual(new Set(asset.animations.map(clip => clip.name)),
        new Set(['Idle', 'Walk', 'Run', 'Gift_Present', 'Jump_Start', 'Jump_Air', 'Land']));
      let count = 0;
      asset.scene.traverse(object => {
        if (!(object instanceof THREE.SkinnedMesh)) return;
        assert.equal(object.skeleton.bones.length, career.joints);
        assert.ok(object.geometry.getAttribute('position').count > 0);
        count++;
      });
      assert.ok(count >= 1, 'the runtime retains an articulated mesh after compatible material batching');
      const mixer = new THREE.AnimationMixer(asset.scene);
      for (const clip of asset.animations) {
        mixer.stopAllAction();
        mixer.clipAction(clip).play();
        mixer.setTime(clip.duration * .25);
        asset.scene.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(asset.scene);
        assert.ok([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite));
        assert.ok(bounds.max.y - bounds.min.y > 1.4);
      }
      mixer.stopAllAction();
      mixer.uncacheRoot(asset.scene);
    }
    assert.deepEqual(playerMovementSpeeds(career.role), { walk: 1.35, run: 3.8, radius: .36, height: career.height });
  });

  test(`${career.role}: loading failure retries and hot promotions keep one model and the active jump phase`, async () => {
    let failing = true;
    const pool = new ModelAssetPool(18_000_000, async url => {
      if (failing) throw new Error('Controlled first-load failure');
      return bytesFor(url);
    });
    const scene = world();
    scene.player.group.position.set(4, 0, 6);
    const models = loadCourtCharacterModels(scene, career.role, pool, career.ranks[0]);
    await ready(models);
    assert.equal(models.status().playerReady, false);
    assert.equal(scene.player.group.children.length, 0, 'failed loading never flashes the old primitive');
    failing = false;
    models.retryFailed();
    await ready(models);
    assert.equal(models.status().playerReady, true);
    scene.player.airborne = true;
    models.update(.08, false);
    const spatialParent = scene.player.group;
    for (const rank of [...career.ranks.slice(1), career.ranks[0]]) {
      models.setPlayerRank(rank);
      await ready(models);
      assert.equal(scene.player.group, spatialParent);
      assert.equal(scene.player.group.children.length, 1);
      assert.equal(models.animationState()?.phase, 'start');
      assert.equal(models.animationState()?.clip, 'Jump_Start');
      assert.equal(pool.stats().liveLeases, 1);
    }
    models.update(.13, false);
    assert.equal(models.animationState()?.clip, 'Jump_Air');
    models.reactPlayer();
    scene.player.airborne = false;
    models.update(.31, true);
    assert.equal(models.animationState()?.clip, 'Gift_Present');
    assert.deepEqual(scene.player.group.position.toArray(), [4, 0, 6]);
    assert.ok(pool.stats().cacheHits >= 1);
    models.dispose();
    assert.equal(pool.stats().liveLeases, 0);
    assert.equal(pool.stats().decodedAssets, 0);
  });
}

// Owns the shared player wardrobe loading, rank-transition and authored-motion contract.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
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

const gaitCareers = [
  { role: 'prince', midpoint: (1.2 + 3.8) / 2, promoted: 'grand_prince' },
  { role: 'scholar', midpoint: (1.278 + 4.047) / 2, promoted: 'minister' },
  { role: 'concubine', midpoint: (1.340782123 + 4.245810056) / 2, promoted: 'consort' },
] as const;
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const close = (actual: number, expected: number) => {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);
};

function animatedAsset(): GLTF {
  const scene = new THREE.Group();
  const bone = new THREE.Bone();
  bone.name = 'GaitPose';
  const mesh = new THREE.SkinnedMesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  mesh.add(bone);
  mesh.bind(new THREE.Skeleton([bone]));
  scene.add(mesh);
  const definitions: Array<[string, number, number]> = [
    ['Idle', 1, 0], ['Walk', 1, 1], ['Run', 1, 2], ['Jump_Start', .2, 3],
    ['Jump_Air', 1, 4], ['Land', .3, 5], ['Gift_Present', .4, 6],
  ];
  const animations = definitions.map(([name, duration, pose]) => new THREE.AnimationClip(name, duration, [
    new THREE.NumberKeyframeTrack('GaitPose.position[x]', [0, duration], [pose, pose]),
    new THREE.NumberKeyframeTrack('GaitPose.position[y]', [0, duration / 2, duration], [0, 1, 0]),
  ]));
  return { scene, animations } as GLTF;
}

async function fixture(role: string) {
  const world = {
    player: { group: new THREE.Group(), moveSpeed: 0, airborne: false }, npcs: [],
  } as unknown as PalaceWorld;
  world.player.group.position.set(2, 3, 4);
  world.player.group.rotation.y = .7;
  const pool = new ModelAssetPool(100, async () => new ArrayBuffer(20), async () => animatedAsset());
  const models = loadCourtCharacterModels(world, role, pool);
  await flush();
  assert.equal(models.isReady(), true);
  const pose = () => world.player.group.getObjectByName('GaitPose')!.position;
  const step = (speed: number, delta = 1 / 60, paused = false) => {
    world.player.moveSpeed = speed;
    models.update(delta, paused);
    return models.animationState()?.clip;
  };
  const dispose = () => {
    assert.deepEqual(world.player.group.position.toArray(), [2, 3, 4]);
    close(world.player.group.rotation.y, .7);
    assert.deepEqual(world.player.group.scale.toArray(), [1, 1, 1]);
    models.dispose();
    assert.equal(pool.stats().liveLeases, 0);
  };
  return { world, models, pose, step, dispose };
}

for (const career of gaitCareers) {
  test(`${career.role}: tiny analog noise holds the selected walk/run clip and lets its pose advance`, async t => {
    const f = await fixture(career.role);
    try {
      for (const [speed, expected] of [[1.35, 'Walk'], [3.8, 'Run']] as const) {
        f.step(speed, .3);
        const clips: Array<string | undefined> = [];
        const heights: number[] = [];
        const cadence = [1 / 120, 1 / 60, 1 / 30, .1, .05];
        for (let frame = 0; frame < 90; frame++) {
          clips.push(f.step(career.midpoint + (frame % 2 ? -.01 : .01), cadence[frame % cadence.length]));
          heights.push(f.pose().y);
        }
        const switches = clips.filter((clip, index) => clip !== (index ? clips[index - 1] : expected)).length;
        t.diagnostic(`${expected}: ${switches} switches over 90 frames at midpoint ±0.01`);
        t.diagnostic(`${expected}: pose range ${Math.max(...heights) - Math.min(...heights)}`);
        assert.equal(switches, 0, 'tiny speed changes must not alternate and reset gait clips');
        assert.ok(Math.max(...heights) - Math.min(...heights) > .7, 'the loop advances instead of restarting each frame');
      }
    } finally {
      f.dispose();
    }
  });

  test(`${career.role}: steady speed, deliberate transitions and repeated stop/start stay immediate`, async () => {
    const f = await fixture(career.role);
    try {
      const speeds = playerMovementSpeeds(career.role);
      assert.equal(speeds.walk, 1.35);
      assert.equal(speeds.run, 3.8);
      for (let cycle = 0; cycle < 3; cycle++) {
        const transitions = [[speeds.walk, 'Walk'], [speeds.run, 'Run'], [speeds.walk, 'Walk'], [0, 'Idle']] as const;
        for (const [speed, clip] of transitions) {
          assert.equal(f.step(speed), clip);
          const heights: number[] = [];
          for (const delta of [.017, .043, .1, .02, .07, .08, .12]) {
            assert.equal(f.step(speed, delta), clip);
            heights.push(f.pose().y);
          }
          assert.ok(Math.max(...heights) - Math.min(...heights) > .2, 'steady clips continue under variable cadence');
        }
      }
      assert.equal(f.step(career.midpoint + .01), 'Run', 'after a full stop, a fresh speed uses the midpoint');
      assert.equal(f.step(0), 'Idle');
      assert.equal(f.step(career.midpoint - .01), 'Walk');
      assert.equal(f.step(career.midpoint + .2), 'Run', 'a clear analog increase switches immediately');
      assert.equal(f.step(career.midpoint - .2), 'Walk', 'a clear analog decrease switches immediately');
    } finally {
      f.dispose();
    }
  });

  test(`${career.role}: pause freezes gait/pose and resume retains the selected gait through threshold noise`, async () => {
    const f = await fixture(career.role);
    try {
      f.step(3.8, .3);
      const before = f.pose().clone();
      for (let frame = 0; frame < 12; frame++) {
        assert.equal(f.step(frame % 2 ? 0 : 1.35, .1, true), 'Run');
        assert.deepEqual(f.pose().toArray(), before.toArray());
      }
      assert.equal(f.step(career.midpoint - .01), 'Run');
      assert.equal(f.step(1.35), 'Walk');
    } finally {
      f.dispose();
    }
  });

  test(`${career.role}: moving landing and reactions resume the prior gait without noisy-threshold switching`, async () => {
    const f = await fixture(career.role);
    try {
      f.step(3.8, .3);
      f.world.player.airborne = true;
      assert.equal(f.step(3.8, .3), 'Jump_Air');
      f.world.player.airborne = false;
      assert.equal(f.step(career.midpoint - .01), 'Run');
      assert.equal(f.models.animationState()?.phase, 'grounded');
      f.models.reactPlayer();
      assert.equal(f.models.animationState()?.clip, 'Gift_Present');
      assert.equal(f.step(career.midpoint - .01, .41), 'Run');
      assert.equal(f.step(0), 'Idle');
      f.world.player.airborne = true;
      f.step(0, .3);
      f.models.reactPlayer();
      f.world.player.airborne = false;
      assert.equal(f.step(0, .31, true), 'Gift_Present');
      assert.equal(f.step(0, .41, true), 'Idle');
      assert.equal(f.step(1.35), 'Walk');
    } finally {
      f.dispose();
    }
  });

  test(`${career.role}: an outfit swap retains the gait decision and private actor root`, async () => {
    const f = await fixture(career.role);
    try {
      f.step(3.8, .3);
      const parent = f.world.player.group;
      const previousArt = parent.children[0];
      f.models.setPlayerRank(career.promoted);
      await flush();
      assert.equal(f.models.isReady(), true);
      assert.notEqual(parent.children[0], previousArt);
      assert.equal(parent.children.length, 1);
      assert.equal(f.world.player.group, parent);
      assert.equal(f.step(career.midpoint - .01), 'Run');
    } finally {
      f.dispose();
    }
  });
}

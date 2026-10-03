import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { acquireModelInstance, ModelAssetPool } from '../src/palace/assetPool.ts';
import { characterAssetUrls, loadCourtCharacterModels } from '../src/palace/characterModels.ts';
import { acquireEmperorModel, EMPEROR_ASSET_URL, loadPalaceAssets, THRONE_ASSET_URL } from '../src/palace/palaceAssets.ts';
import type { PalaceWorld } from '../src/palace/world.ts';

const flush = async () => { await new Promise<void>(resolve => setTimeout(resolve, 0)); };
function asset() {
  const scene = new THREE.Group();
  const mesh = new THREE.SkinnedMesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  const bone = new THREE.Bone();
  mesh.add(bone); mesh.bind(new THREE.Skeleton([bone])); scene.add(mesh);
  return { scene, animations: [] } as unknown as GLTF;
}
function world(names: string[] = [], zone = 'courtyard') {
  return {
    zone, scene: new THREE.Scene(), throneFallback: new THREE.Group(),
    player: { group: new THREE.Group(), moveSpeed: 0, airborne: false },
    npcs: names.map(name => ({ name, group: new THREE.Group(), moveSpeed: 0, labelHeight: 1, activity: 'Waiting' })),
  } as unknown as PalaceWorld;
}

test('instances own skeletons but share template art until the final actor releases', async () => {
  const template = asset();
  const pool = new ModelAssetPool(100, async () => new ArrayBuffer(20), async () => template);
  const [a, b] = await Promise.all([acquireModelInstance('/actor', pool), acquireModelInstance('/actor', pool)]);
  const meshA = a.root.children[0] as THREE.SkinnedMesh;
  const meshB = b.root.children[0] as THREE.SkinnedMesh;
  assert.notEqual(a.root, b.root);
  assert.notEqual(meshA.skeleton, meshB.skeleton);
  assert.notEqual(meshA.skeleton, (template.scene.children[0] as THREE.SkinnedMesh).skeleton);
  assert.equal(meshA.geometry, meshB.geometry);
  assert.equal(meshA.material, meshB.material);
  const events: string[] = [];
  meshA.skeleton.dispose = () => { events.push('actor skeleton'); };
  meshA.geometry.addEventListener('dispose', () => { events.push('geometry'); });
  const mixer = new THREE.AnimationMixer(a.root);
  const stop = mixer.stopAllAction.bind(mixer), uncache = mixer.uncacheRoot.bind(mixer);
  mixer.stopAllAction = () => { events.push('stop'); return stop(); };
  mixer.uncacheRoot = root => { events.push('uncache'); uncache(root); };
  const parent = new THREE.Group(); parent.add(a.root, b.root);
  a.dispose(mixer); a.dispose(mixer);
  assert.deepEqual(events, ['stop', 'uncache', 'actor skeleton']);
  assert.equal(parent.children.length, 1);
  assert.equal(pool.stats().liveLeases, 1);
  b.dispose();
  assert.equal(events.at(-1), 'geometry');
  assert.equal(pool.stats().decodedAssets, 0);
  assert.equal(pool.stats().disposals, 1);
});

test('character URLs include only present NPCs and player, with shared art deduplicated', () => {
  const playerOnly = characterAssetUrls([], 'prince');
  assert.equal(playerOnly.length, 1);
  assert.match(playerOnly[0], /player-prince-anime/);
  const split=characterAssetUrls([{name:'Prince Feng'},{name:'Unregistered'}],'prince');
  assert.equal(split.length,2);assert.match(split[0],/prince-runtime/);assert.equal(split[1],playerOnly[0]);
  assert.equal(characterAssetUrls([{ name: 'Maid Ling' }], 'prince').length, 2);
  assert.deepEqual(characterAssetUrls([], 'unregistered'), []);
});

test('characters share active templates across worlds and release every repeated scene lease', async () => {
  const urls: string[] = [];
  const pool = new ModelAssetPool(100, async url => { urls.push(url); return new ArrayBuffer(20); }, async () => asset());
  const first = world(['Prince Feng']);
  const second = world([]);
  const a = loadCourtCharacterModels(first, 'prince', pool);
  const b = loadCourtCharacterModels(second, 'prince', pool);
  await flush();
  assert.equal(urls.length, 2, 'only separate player/Feng models load; absent Maid Ling never preloads');
  assert.equal(pool.stats().liveLeases, 3);
  assert.equal(pool.stats().decodedAssets, 2);
  assert.equal(first.player.group.children.length, 1);
  assert.equal(first.npcs[0].group.children.length, 1);
  a.dispose(); a.dispose();
  assert.equal(pool.stats().liveLeases, 1);
  assert.equal(pool.stats().disposals, 1, 'Feng is released while the player is shared with the second world');
  b.dispose();
  for (let index = 0; index < 8; index++) {
    const next = world(['Prince Feng']);
    const models = loadCourtCharacterModels(next, 'prince', pool);
    await flush();
    models.update(1 / 60, false);
    models.dispose(); models.dispose();
    assert.equal(pool.stats().liveLeases, 0);
    assert.equal(pool.stats().decodedAssets, 0);
    assert.equal(next.player.group.children.length, 0);
    assert.equal(next.npcs[0].group.children.length, 0);
  }
  assert.equal(urls.length, 2, 'repeat scenes reuse both independent source-byte entries');
  assert.equal(pool.stats().cachedBytes, 40);
});

test('disposing characters during download prevents late scene attachment and decoding', async () => {
  const finish:Array<(bytes:ArrayBuffer)=>void>=[];
  const pool = new ModelAssetPool(100, () => new Promise(resolve => { finish.push(resolve); }), async () => asset());
  const next = world(['Prince Feng']);
  const models = loadCourtCharacterModels(next, 'prince', pool);
  models.dispose(); models.dispose();
  assert.equal(pool.stats().liveLeases, 0);
  finish.forEach(resolve=>resolve(new ArrayBuffer(20)));
  await flush();
  assert.equal(next.player.group.children.length, 0);
  assert.equal(next.npcs[0].group.children.length, 0);
  assert.equal(pool.stats().decodedAssets, 0);
  assert.equal(pool.stats().decodes, 0);
});

test('throne is emperor-zone-only, cloned, and idempotently released with its fallback restored', async () => {
  const urls: string[] = [];
  const pool = new ModelAssetPool(100, async url => { urls.push(url); return new ArrayBuffer(20); }, async () => asset());
  const reception = world([], 'reception');
  loadPalaceAssets(reception, undefined, pool)();
  assert.equal(urls.length, 0);
  const emperor = world([], 'emperor');
  const dispose = loadPalaceAssets(emperor, undefined, pool);
  await flush();
  assert.deepEqual(urls, [THRONE_ASSET_URL]);
  assert.equal(emperor.throneFallback.visible, false);
  assert.equal(emperor.scene.getObjectByName('ImperialThrone')?.position.y, .56);
  dispose(); dispose();
  assert.equal(emperor.throneFallback.visible, true);
  assert.equal(emperor.scene.getObjectByName('ImperialThrone'), undefined);
  assert.equal(pool.stats().liveLeases, 0);
  assert.equal(pool.stats().disposals, 1);
});

test('throne cancellation discards late decode and emperor helper is lazy until called', async () => {
  let finish!: (value: GLTF) => void;
  const urls: string[] = [];
  const pool = new ModelAssetPool(100, async url => { urls.push(url); return new ArrayBuffer(20); }, () => new Promise(resolve => { finish = resolve; }));
  const next = world([], 'emperor');
  const dispose = loadPalaceAssets(next, undefined, pool);
  await flush();
  assert.deepEqual(urls, [THRONE_ASSET_URL]);
  dispose(); dispose();
  finish(asset());
  await flush();
  assert.equal(next.scene.children.length, 0);
  assert.equal(next.throneFallback.visible, true);
  assert.equal(pool.stats().decodedAssets, 0);
  assert.equal(pool.stats().disposals, 1);
  const pendingEmperor = acquireEmperorModel(pool);
  await flush();
  assert.deepEqual(urls, [THRONE_ASSET_URL, EMPEROR_ASSET_URL]);
  finish(asset());
  const emperor = await pendingEmperor;
  emperor.dispose();
  assert.equal(pool.stats().liveLeases, 0);
});

test('pooled characters keep independent walk, run, jump and gift animation state', async () => {
  const template = asset();
  const mesh = template.scene.children[0] as THREE.SkinnedMesh;
  mesh.skeleton.bones[0].name = 'ActorBone';
  template.animations = [['Idle', 0], ['Walk', 1], ['Run', 2], ['Jump', 3], ['Gift', 4]].map(([name, height]) =>
    new THREE.AnimationClip(String(name), 1, [new THREE.NumberKeyframeTrack('ActorBone.position[y]', [0, 1], [Number(height), Number(height)])]));
  const pool = new ModelAssetPool(100, async () => new ArrayBuffer(20), async () => template);
  const next = world(['Prince Feng']);
  const models = loadCourtCharacterModels(next, 'prince', pool);
  await flush();
  const boneHeight = (group: THREE.Group) => Math.round(group.getObjectByName('ActorBone')!.position.y * 1e6) / 1e6;
  next.player.moveSpeed = 1.2;
  models.update(.3, false);
  assert.equal(boneHeight(next.player.group), 1);
  assert.equal(boneHeight(next.npcs[0].group), 0);
  next.player.moveSpeed = 3.8;
  models.update(.3, false);
  assert.equal(boneHeight(next.player.group), 2);
  next.player.airborne = true;
  models.update(.3, false);
  assert.equal(boneHeight(next.player.group), 3);
  next.player.airborne = false;
  models.update(.3, true);
  assert.equal(boneHeight(next.player.group), 3, 'paused locomotion freezes its pose');
  models.update(.3,false);assert.equal(boneHeight(next.player.group),2);
  next.player.moveSpeed=0;models.update(.3,false);
  models.react('Prince Feng');
  models.update(.3, true);
  assert.equal(boneHeight(next.npcs[0].group), 4);
  assert.equal(boneHeight(next.player.group), 0);
  assert.deepEqual([...models.reactingNames()], ['Prince Feng']);
  models.update(.8, true);
  assert.equal(boneHeight(next.npcs[0].group), 0);
  assert.equal(models.reactingNames().size, 0);
  models.dispose();
  assert.equal(pool.stats().liveLeases, 0);
});

test('canopy bed loads only in Ladies, restores its fallback and reuses bounded warm source bytes',async()=>{
 const {BED_ASSET_URL}=await import('../src/palace/palaceAssets');
 const urls:string[]=[];const pool=new ModelAssetPool(100,async url=>{urls.push(url);return new ArrayBuffer(20);},async()=>asset());
 for(let i=0;i<5;i++){
  const room=world([],'ladies');room.bedFallback=new THREE.Group();
  const stop=loadPalaceAssets(room,undefined,pool);await flush();assert.equal(room.bedFallback.visible,false);
  assert.deepEqual(room.scene.getObjectByName('LadiesCanopyBed')?.position.toArray(),[-14,0,-25]);stop();stop();assert.equal(room.bedFallback.visible,true);assert.equal(pool.stats().liveLeases,0);assert.equal(pool.stats().decodedAssets,0);
 }
 assert.deepEqual(urls,[BED_ASSET_URL]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { ModelAssetPool } from '../src/palace/assetPool.ts';
const asset=()=>({scene:new THREE.Group(),animations:[]} as unknown as GLTF);
test('shared model leases deduplicate download/decode and dispose only after final release',async()=>{
  let downloads=0,decodes=0;
  const pool=new ModelAssetPool(100,async()=>{downloads++;return new ArrayBuffer(20);},async()=>{decodes++;return asset();});
  const [a,b]=await Promise.all([pool.acquire('/model'),pool.acquire('/model')]);
  assert.equal(downloads,1);assert.equal(decodes,1);assert.equal(a.asset,b.asset);
  a.release();a.release();assert.equal(pool.stats().liveLeases,1);assert.equal(pool.stats().disposals,0);
  b.release();assert.equal(pool.stats().decodedAssets,0);assert.equal(pool.stats().disposals,1);
  for(let i=0;i<8;i++){const lease=await pool.acquire('/model');lease.release();}
  assert.equal(downloads,1,'warm repeated transitions must not download again');
  assert.equal(pool.stats().liveLeases,0);assert.equal(pool.stats().decodedAssets,0);
});
test('source prefetch is bounded and holds no decoded scene',async()=>{
  const pool=new ModelAssetPool(30,async()=>new ArrayBuffer(20),async()=>asset());
  await pool.prefetch('/one');await pool.prefetch('/two');
  assert.equal(pool.stats().cachedBytes,20);assert.equal(pool.stats().cachedFiles,1);assert.equal(pool.stats().decodedAssets,0);
  const lease=await pool.acquire('/two');assert.equal(pool.stats().downloads,2);lease.release();
  assert.equal(pool.stats().cachedBytes,20);assert.equal(pool.stats().liveLeases,0);
});
test('failed shared downloads release reference bookkeeping and allow a later normal retry',async()=>{
  let calls=0;
  const pool=new ModelAssetPool(100,async()=>{if(calls++===0)throw Error('offline');return new ArrayBuffer(10);},async()=>asset());
  await Promise.allSettled([pool.acquire('/one'),pool.acquire('/one')]);
  assert.equal(pool.stats().liveLeases,0);assert.equal(pool.stats().pendingAssets,0);
  const lease=await pool.acquire('/one');lease.release();assert.equal(pool.stats().liveLeases,0);
});

const flush = async () => { await new Promise<void>(resolve => setTimeout(resolve, 0)); };

test('cancelled pending leases retain only warm bytes and skip abandoned decoding', async () => {
  let finish!: (bytes: ArrayBuffer) => void;
  const pool = new ModelAssetPool(100, () => new Promise(resolve => { finish = resolve; }), async () => asset());
  const abort = new AbortController();
  const pending = pool.acquire('/abandoned', abort.signal);
  abort.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(pool.stats().liveLeases, 0);
  finish(new ArrayBuffer(20));
  await flush();
  assert.equal(pool.stats().decodes, 0);
  assert.equal(pool.stats().pendingAssets, 0);
  assert.equal(pool.stats().cachedBytes, 20);
  const retry = await pool.acquire('/abandoned');
  retry.release();
  assert.equal(pool.stats().downloads, 1);
  assert.equal(pool.stats().decodedAssets, 0);
});

test('cancellation during decode disposes its late template exactly once', async () => {
  let finish!: (value: GLTF) => void;
  const pool = new ModelAssetPool(100, async () => new ArrayBuffer(20), () => new Promise(resolve => { finish = resolve; }));
  const abort = new AbortController();
  const pending = pool.acquire('/late', abort.signal);
  await flush();
  abort.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  finish(asset());
  await flush();
  assert.equal(pool.stats().liveLeases, 0);
  assert.equal(pool.stats().decodedAssets, 0);
  assert.equal(pool.stats().pendingAssets, 0);
  assert.equal(pool.stats().disposals, 1);
});

test('a new zone can acquire a pending decode after the previous zone cancels', async () => {
  let finish!: (value: GLTF) => void;
  const pool = new ModelAssetPool(100, async () => new ArrayBuffer(20), () => new Promise(resolve => { finish = resolve; }));
  const abort = new AbortController();
  const departing = pool.acquire('/shared', abort.signal);
  await flush();
  abort.abort();
  await assert.rejects(departing, { name: 'AbortError' });
  const arriving = pool.acquire('/shared');
  finish(asset());
  const lease = await arriving;
  assert.equal(pool.stats().liveLeases, 1);
  assert.equal(pool.stats().decodes, 1);
  assert.equal(pool.stats().disposals, 0);
  lease.release();
  assert.equal(pool.stats().disposals, 1);
});

test('failed decodes release all bookkeeping and retry warm bytes', async () => {
  let decodes = 0;
  const pool = new ModelAssetPool(100, async () => new ArrayBuffer(20), async () => {
    if (decodes++ === 0) throw new Error('bad decode');
    return asset();
  });
  await Promise.allSettled([pool.acquire('/one'), pool.acquire('/one')]);
  assert.equal(pool.stats().liveLeases, 0);
  assert.equal(pool.stats().pendingAssets, 0);
  const lease = await pool.acquire('/one');
  lease.release();
  assert.equal(pool.stats().downloads, 1);
  assert.equal(pool.stats().decodedAssets, 0);
});

test('final template release disposes shared GPU resources and image bitmaps once', async () => {
  const scene = new THREE.Group();
  let closed = 0, textures = 0, materials = 0, geometries = 0, skeletons = 0;
  const bitmap = { close: () => { closed++; } };
  const texture = new THREE.Texture(bitmap);
  const material = new THREE.MeshStandardMaterial({ map: texture, roughnessMap: texture });
  const geometry = new THREE.BoxGeometry();
  const mesh = new THREE.SkinnedMesh(geometry, material);
  const bone = new THREE.Bone(); mesh.add(bone); mesh.bind(new THREE.Skeleton([bone]));
  mesh.skeleton.dispose = () => { skeletons++; };
  scene.add(mesh, new THREE.Mesh(geometry, material));
  texture.addEventListener('dispose', () => { textures++; });
  material.addEventListener('dispose', () => { materials++; });
  geometry.addEventListener('dispose', () => { geometries++; });
  const template = { scene, animations: [] } as unknown as GLTF;
  const pool = new ModelAssetPool(100, async () => new ArrayBuffer(20), async () => template);
  const [first, last] = await Promise.all([pool.acquire('/shared-art'), pool.acquire('/shared-art')]);
  first.release();
  assert.deepEqual([closed, textures, materials, geometries, skeletons], [0, 0, 0, 0, 0]);
  last.release(); last.release();
  assert.deepEqual([closed, textures, materials, geometries, skeletons], [1, 1, 1, 1, 1]);
});

test('shared archetype palette variants own only their color materials and cannot recolor another actor',async()=>{
 const {acquireModelInstance}=await import('../src/palace/assetPool');
 const template=asset(),geometry=new THREE.BoxGeometry(),robe=new THREE.MeshStandardMaterial({color:'#ffffff'});robe.name='Robe_Primary';template.scene.add(new THREE.Mesh(geometry,robe));
 const pool=new ModelAssetPool(100,async()=>new ArrayBuffer(20),async()=>template);
 const a=await acquireModelInstance('/shared-archetype',pool),b=await acquireModelInstance('/shared-archetype',pool);
 a.applyPalette({Robe_Primary:'#aa0000'});b.applyPalette({Robe_Primary:'#0000aa'});
 const ma=(a.root.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial,mb=(b.root.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
 assert.notEqual(ma,mb);assert.notEqual(ma,robe);assert.equal(robe.color.getHexString(),'ffffff');assert.equal(ma.color.getHexString(),'aa0000');assert.equal(mb.color.getHexString(),'0000aa');assert.equal((a.root.children[0] as THREE.Mesh).geometry,(b.root.children[0] as THREE.Mesh).geometry);
 let ownDisposals=0;ma.addEventListener('dispose',()=>ownDisposals++);a.applyPalette({Robe_Primary:'#00aa00'});assert.equal((a.root.children[0] as THREE.Mesh).material,ma);
 a.dispose();a.dispose();assert.equal(ownDisposals,1);assert.equal(pool.stats().liveLeases,1);assert.equal(mb.color.getHexString(),'0000aa');b.dispose();assert.equal(pool.stats().decodedAssets,0);assert.equal(pool.stats().downloads,1);
});

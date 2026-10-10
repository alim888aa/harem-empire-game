import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { ModelAssetPool } from '../src/palace/assetPool.ts';
import { loadCourtCharacterModels, characterAssetUrls, PLAYER_PRINCE_ASSET_URL, PLAYER_PRINCE_OUTFIT_URLS, playerMovementSpeeds } from '../src/palace/characterModels.ts';
import type { PalaceWorld } from '../src/palace/world.ts';
// Node has no browser image decoder. These animation-contract tests retain an
// image placeholder after validating the embedded PNG signature and dimensions;
// actual face appearance is separately checked in exported-GLB render proofs.
Object.defineProperty(globalThis,'self',{configurable:true,value:globalThis});
Object.defineProperty(globalThis,'createImageBitmap',{configurable:true,value:async(blob:Blob)=>{
 const bytes=new Uint8Array(await blob.arrayBuffer());assert.deepEqual([...bytes.slice(0,8)],[137,80,78,71,13,10,26,10]);
 const view=new DataView(bytes.buffer);const width=view.getUint32(16),height=view.getUint32(20);assert.ok(width>0&&height>0);return{width,height,close(){}};
}});
const flush=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
const close=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-6,`${actual} != ${expected}`);
function template(player:boolean):GLTF{
  const scene=new THREE.Group();scene.name=player?'DistinctAnimePlayer':'ExistingFeng';
  const mesh=new THREE.SkinnedMesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());
  const bone=new THREE.Bone();bone.name='PoseBone';mesh.add(bone);mesh.bind(new THREE.Skeleton([bone]));scene.add(mesh);
  const definitions:Array<[string,number,number]>=player?[['Idle',4,0],['Walk',.933333,1],['Run',.7,2],['Jump_Start',.2,3],['Jump_Air',.6,4],['Land',.3,5],['Gift_Present',2.5,6]]:[['Idle',1,10],['Walk',1,11],['Gift',1,12]];
  const offset=player?1/30:0;
  const animations=definitions.map(([name,duration,pose])=>new THREE.AnimationClip(name,duration+offset,[new THREE.NumberKeyframeTrack('PoseBone.position[y]',[offset,duration+offset],[pose,pose])]));
  return{scene,animations} as GLTF;
}
function fakeWorld(){return{player:{group:new THREE.Group(),moveSpeed:0,airborne:false,jumpVelocity:0},npcs:[{name:'Prince Feng',group:new THREE.Group(),moveSpeed:0,labelHeight:2,activity:'Waiting'}]} as unknown as PalaceWorld;}
async function fixture(){
  const raw=new Map<string,GLTF>(),urls:string[]=[];
  const pool=new ModelAssetPool(100,async url=>{urls.push(url);return new ArrayBuffer(20);},async(_bytes,url)=>{const asset=template(url.includes('/player-'));raw.set(url,asset);return asset;});
  const world=fakeWorld();world.player.group.position.set(2,3,4);
  const models=loadCourtCharacterModels(world,'prince',pool);await flush();
  return{world,models,pool,raw,urls};
}

test('distinct player asset and reviewed Feng keep private models and animation clips separate',async()=>{
  const {world,models,pool,raw,urls}=await fixture();
  assert.equal(urls.length,2);assert.ok(urls.includes(PLAYER_PRINCE_ASSET_URL));assert.ok(urls.includes('/models/scoped-t3/anime-prince-feng-90440f404f28f764.glb?v=90440f404f28f764'));
  assert.ok(world.player.group.getObjectByName('DistinctAnimePlayer'));assert.ok(!world.player.group.getObjectByName('ExistingFeng'));
  assert.ok(world.npcs[0].group.getObjectByName('ExistingFeng'));assert.ok(!world.npcs[0].group.getObjectByName('DistinctAnimePlayer'));
  close(raw.get(PLAYER_PRINCE_ASSET_URL)!.animations.find(clip=>clip.name==='Jump_Start')!.tracks[0].times[0],1/30);
  assert.deepEqual(playerMovementSpeeds('prince'),{walk:1.35,run:3.8,radius:.36,height:2.0});
  assert.equal(characterAssetUrls([{name:'Prince Feng'}],'prince').length,2);
  models.dispose();assert.equal(pool.stats().liveLeases,0);assert.equal(pool.stats().decodedAssets,0);
});

test('Start .20 -> looping Air .60 -> Land .30 uses controller time, freezes in menus and never moves the spatial root',async()=>{
  const {world,models,pool}=await fixture();
  world.player.airborne=true;models.update(.1,false);
  assert.equal(models.animationState()?.clip,'Jump_Start');close(models.animationState()!.remaining,.1);
  const pose=world.player.group.getObjectByName('PoseBone')!.position.y;
  models.update(2,true);close(models.animationState()!.remaining,.1);assert.equal(world.player.group.getObjectByName('PoseBone')!.position.y,pose);
  models.update(.099,false);assert.equal(models.animationState()?.phase,'start');
  models.update(.002,false);assert.equal(models.animationState()?.phase,'air');assert.equal(models.animationState()?.clip,'Jump_Air');
  models.update(1.21,false);assert.equal(models.animationState()?.phase,'air');assert.equal(models.animationState()?.clip,'Jump_Air');
  assert.equal(models.animationState('Prince Feng')?.clip,'Idle');
  world.player.airborne=false;models.update(.1,false);assert.equal(models.animationState()?.clip,'Land');close(models.animationState()!.remaining,.2);
  models.update(.199,false);assert.equal(models.animationState()?.phase,'land');
  models.update(.002,false);assert.equal(models.animationState()?.phase,'grounded');
  assert.deepEqual(world.player.group.position.toArray(),[2,3,4]);
  models.dispose();assert.equal(pool.stats().liveLeases,0);
});

test('landing can finish into queued gift dialogue while paused; takeoff interrupts an older gesture',async()=>{
  const {world,models}=await fixture();
  world.player.airborne=true;models.update(.21,false);models.reactPlayer();
  assert.equal(models.animationState()?.pendingReaction,true);
  models.update(.4,true);assert.equal(models.animationState()?.clip,'Jump_Air');
  world.player.airborne=false;models.update(.1,true);assert.equal(models.animationState()?.clip,'Land');
  models.update(.21,true);assert.equal(models.animationState()?.clip,'Gift_Present');assert.equal(models.animationState()?.pendingReaction,false);
  models.update(3,true);assert.equal(models.animationState()?.reactionRemaining,0);assert.equal(models.animationState()?.clip,'Idle');
  models.reactPlayer();assert.equal(models.animationState()?.clip,'Gift_Present');
  world.player.airborne=true;models.update(.05,false);assert.equal(models.animationState()?.clip,'Jump_Start');assert.equal(models.animationState()?.reactionRemaining,0);
  world.player.airborne=false;models.update(.05,false);assert.equal(models.animationState()?.clip,'Land','early landing does not wait for takeoff clip');
  assert.equal(models.animationState('Prince Feng')?.clip,'Idle');models.dispose();
});

test('copied actual GLB matches checkpoint hash and loads exact normalized jump phases without network',async()=>{
  const bytes=await readFile(new URL('../public/models/player-prince-anime.glb',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'823bceeae64f751951d36fefecd5b9718c6111832cfa8d8334db19a253215861');
  const data=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
  const asset=await new GLTFLoader().parseAsync(data,'');
  assert.deepEqual(asset.animations.map(clip=>clip.name),['Idle','Walk','Run','Gift_Present','Jump_Start','Jump_Air','Land']);
  const world=fakeWorld();world.npcs=[];
  const pool=new ModelAssetPool(6_000_000,async()=>data,async()=>asset);
  const models=loadCourtCharacterModels(world,'prince',pool);await flush();
  assert.ok(world.player.group.children.length);
  world.player.airborne=true;models.update(.05,false);assert.equal(models.animationState()?.clip,'Jump_Start');close(models.animationState()!.remaining,.15);
  models.update(.16,false);assert.equal(models.animationState()?.clip,'Jump_Air');
  world.player.airborne=false;models.update(.05,false);assert.equal(models.animationState()?.clip,'Land');close(models.animationState()!.remaining,.25);
  models.dispose();assert.equal(pool.stats().liveLeases,0);assert.equal(pool.stats().decodedAssets,0);assert.equal(pool.stats().cachedBytes,bytes.byteLength);
});

test('a moving landing blends immediately to run instead of holding the planted recovery',async()=>{
  const {world,models}=await fixture();
  world.player.moveSpeed=3.8;world.player.airborne=true;models.update(.3,false);
  assert.equal(models.animationState()?.clip,'Jump_Air');
  world.player.airborne=false;models.update(.02,false);
  assert.equal(models.animationState()?.phase,'grounded');assert.equal(models.animationState()?.clip,'Run');
  models.update(.08,false);close(world.player.group.getObjectByName('PoseBone')!.position.y,2);
  assert.deepEqual(world.player.group.position.toArray(),[2,3,4]);
  world.player.moveSpeed=0;world.player.airborne=true;models.update(.3,false);world.player.airborne=false;models.update(.1,false);
  assert.equal(models.animationState()?.phase,'land');
  world.player.moveSpeed=1.35;models.update(.02,false);assert.equal(models.animationState()?.clip,'Walk');assert.equal(models.animationState()?.phase,'grounded');
  models.dispose();
});

test('unregistered rank outfits preserve base art, spatial parent and NPC identities without extra leases',async()=>{
  const {world,models,pool,urls}=await fixture();
  const playerRoot=world.player.group.children[0],fengRoot=world.npcs[0].group.children[0],before=[...world.player.group.position.toArray()];
  for(const rank of ['unregistered_rank','unknown',null])models.setPlayerRank(rank);
  await flush();
  assert.equal(urls.length,2);assert.equal(pool.stats().liveLeases,2);
  assert.equal(world.player.group.children[0],playerRoot);assert.equal(world.npcs[0].group.children[0],fengRoot);
  assert.deepEqual(world.player.group.position.toArray(),before);models.dispose();
});

test('promotion and demotion hot-swap only player art and preserve jump phase, spatial parent, NPC and warm cache',async()=>{
  const {world,models,pool,urls}=await fixture();
  const group=world.player.group,feng=world.npcs[0].group.children[0];
  world.player.airborne=true;models.update(.1,false);const oldRoot=group.children[0];
  models.setPlayerRank('grand_prince');await flush();
  assert.equal(models.animationState()?.assetUrl,PLAYER_PRINCE_OUTFIT_URLS.grand_prince);assert.equal(models.animationState()?.phase,'start');close(models.animationState()!.remaining,.1);
  assert.equal(world.player.group,group);assert.notEqual(group.children[0],oldRoot);assert.equal(group.children.length,1);assert.equal(world.npcs[0].group.children[0],feng);assert.equal(pool.stats().liveLeases,2);
  models.update(.11,false);models.setPlayerRank('crown_prince');await flush();
  assert.equal(models.animationState()?.assetUrl,PLAYER_PRINCE_OUTFIT_URLS.crown_prince);assert.equal(models.animationState()?.phase,'air');assert.equal(models.animationState()?.clip,'Jump_Air');
  assert.equal(world.npcs[0].group.children[0],feng);assert.equal(pool.stats().liveLeases,2);
  models.setPlayerRank(null);await flush();
  assert.equal(models.animationState()?.assetUrl,PLAYER_PRINCE_ASSET_URL);assert.equal(models.animationState()?.phase,'air');
  assert.deepEqual(group.position.toArray(),[2,3,4]);assert.equal(world.npcs[0].group.children[0],feng);
  assert.equal(urls.length,4,'Feng plus three player files downloaded once each');assert.ok(pool.stats().cacheHits>=1);
  models.dispose();assert.equal(pool.stats().liveLeases,0);assert.equal(pool.stats().decodedAssets,0);
});

test('superseded late outfit cannot replace the current rank; load failure leaves old art visible',async()=>{
  let finishGrand!:(bytes:ArrayBuffer)=>void,failCrown=false;
  const pool=new ModelAssetPool(100,async url=>{
    if(url===PLAYER_PRINCE_OUTFIT_URLS.grand_prince)return new Promise<ArrayBuffer>(resolve=>{finishGrand=resolve;});
    if(url===PLAYER_PRINCE_OUTFIT_URLS.crown_prince&&failCrown)throw new Error('Controlled download failure');
    return new ArrayBuffer(20);
  },async(_bytes,url)=>template(url.includes('/player-')));
  const world=fakeWorld(),models=loadCourtCharacterModels(world,'prince',pool);await flush();
  models.setPlayerRank('grand_prince');models.setPlayerRank('crown_prince');await flush();
  assert.equal(models.animationState()?.assetUrl,PLAYER_PRINCE_OUTFIT_URLS.crown_prince);
  finishGrand(new ArrayBuffer(20));await flush();assert.equal(models.animationState()?.assetUrl,PLAYER_PRINCE_OUTFIT_URLS.crown_prince);assert.equal(world.player.group.children.length,1);
  models.setPlayerRank(null);await flush();models.dispose();assert.equal(pool.stats().liveLeases,0);
  // Use a fresh pool so the deliberate failure cannot be hidden by warm bytes.
  failCrown=true;
  const failing=new ModelAssetPool(100,async url=>{if(url===PLAYER_PRINCE_OUTFIT_URLS.crown_prince)throw Error('offline');return new ArrayBuffer(20);},async(_bytes,url)=>template(url.includes('/player-')));
  const next=fakeWorld(),loader=loadCourtCharacterModels(next,'prince',failing);await flush();const retained=next.player.group.children[0];
  loader.setPlayerRank('crown_prince');await flush();assert.equal(next.player.group.children[0],retained);assert.equal(retained.visible,true);assert.equal(loader.animationState()?.assetUrl,PLAYER_PRINCE_ASSET_URL);loader.dispose();
});

for(const [rank,file,hash] of [
  ['grand_prince','player-grand-prince-anime.glb','6bb9d31e35c9a057fa138f683295603e1e9377e233cd5e681c2bcf9434c313df'],
  ['crown_prince','player-crown-prince-anime.glb','a44eee13f591c0e1ce2d453a8b5cbe450ab0072f230e857954ff61ecd735a9e9'],
] as const){
  test(`${rank}: inspected checkpoint hash and seven clips parse and initialize at the correct outfit`,async()=>{
    const bytes=await readFile(new URL(`../public/models/${file}`,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
    const data=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
    const asset=await new GLTFLoader().parseAsync(data,'');assert.equal(asset.animations.length,7);
    const world=fakeWorld();world.npcs=[];const pool=new ModelAssetPool(6_000_000,async()=>data,async()=>asset);
    const models=loadCourtCharacterModels(world,'prince',pool,rank);await flush();assert.equal(models.animationState()?.assetUrl,PLAYER_PRINCE_OUTFIT_URLS[rank]);
    world.player.airborne=true;models.update(.05,false);close(models.animationState()!.remaining,.15);
    models.dispose();assert.equal(pool.stats().liveLeases,0);
  });
}

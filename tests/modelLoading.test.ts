import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import type {GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {ModelAssetPool,acquireModelInstance} from '../src/palace/assetPool.ts';
import {loadCourtCharacterModels,characterAssetUrls,PLAYER_PRINCE_ASSET_URL,PLAYER_PRINCE_OUTFIT_URLS,type CharacterModelStatus} from '../src/palace/characterModels.ts';
import {createPalaceWorld,type PalaceWorld} from '../src/palace/world.ts';

const flush=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
function deferred<T>(){let resolve!:(value:T)=>void,reject!:(reason:unknown)=>void;const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};}
function asset():GLTF {
 const scene=new THREE.Group(),mesh=new THREE.SkinnedMesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());
 const bone=new THREE.Bone();mesh.add(bone);mesh.bind(new THREE.Skeleton([bone]));scene.add(mesh);
 return{scene,animations:[]} as unknown as GLTF;
}
function fixture(names:string[]=[]):PalaceWorld{return{player:{group:new THREE.Group(),moveSpeed:0,airborne:false,jumpVelocity:0},npcs:names.map(name=>({name,group:new THREE.Group(),moveSpeed:0,labelHeight:2,activity:'Waiting'}))} as unknown as PalaceWorld;}
const meshCount=(root:THREE.Object3D)=>{let count=0;root.traverse(node=>{if(node instanceof THREE.Mesh)count++;});return count;};
const noArt=(world:PalaceWorld)=>{assert.equal(meshCount(world.player.group),0);world.npcs.forEach(npc=>assert.equal(meshCount(npc.group),0,npc.name));};
const assertReleased=(pool:ModelAssetPool)=>{assert.equal(pool.stats().liveLeases,0);assert.equal(pool.stats().decodedAssets,0);assert.equal(pool.stats().pendingAssets,0);};

for(const software of [false,true])for(const role of ['prince','scholar','minister','concubine']){
 test(`${role}/${software?'software':'WebGL'} real world has no primitive character meshes before, during or after failed cold loading`,async()=>{
  const world=createPalaceWorld([{name:'Prince Feng',type:'side'},{name:'Empress Dowager',type:'major'}],role,software,'library');
  noArt(world);const requests:Array<ReturnType<typeof deferred<ArrayBuffer>>>=[];
  const pool=new ModelAssetPool(100,()=>{const next=deferred<ArrayBuffer>();requests.push(next);return next.promise;},async()=>asset());
  const models=loadCourtCharacterModels(world,role,pool);
  try{
   noArt(world);assert.equal(models.status().playerReady,false);assert.equal(models.status().pending,3);
   // Reproduce the camera assigning visibility every frame: empty anchors stay body-free.
   world.player.group.visible=false;world.player.group.visible=true;world.animate(.1,.1,false,false);noArt(world);
   requests.forEach(request=>request.reject(Error('Controlled offline')));await flush();noArt(world);
   assert.equal(models.status().pending,0);assert.equal(models.status().failures.length,3);
  }finally{models.dispose();world.dispose();}
  assertReleased(pool);
 });
}

test('player readiness can open the scene while delayed NPCs remain body-free and not interactable',async()=>{
 const downloads=new Map<string,ReturnType<typeof deferred<ArrayBuffer>>>(),states:CharacterModelStatus[]=[];
 const pool=new ModelAssetPool(100, url=>{const pending=deferred<ArrayBuffer>();downloads.set(url,pending);return pending.promise;},async()=>asset());
 const world=fixture(['Prince Feng']),models=loadCourtCharacterModels(world,'prince',pool,null,state=>states.push(state));
 const fengUrl=characterAssetUrls([{name:'Prince Feng'}],'unregistered')[0];
 assert.deepEqual(states.at(-1),{playerReady:false,pending:2,failures:[]});noArt(world);
 downloads.get(PLAYER_PRINCE_ASSET_URL)!.resolve(new ArrayBuffer(20));await flush();
 assert.deepEqual(states.at(-1),{playerReady:true,pending:1,failures:[]});assert.equal(models.isReady(),true);assert.equal(models.isReady('Prince Feng'),false);
 assert.equal(meshCount(world.player.group),1);assert.equal(meshCount(world.npcs[0].group),0);
 downloads.get(fengUrl)!.resolve(new ArrayBuffer(20));await flush();
 assert.equal(models.isReady('Prince Feng'),true);assert.deepEqual(states.at(-1),{playerReady:true,pending:0,failures:[]});
 models.dispose();assertReleased(pool);
});

test('failed initial player and NPC requests stay body-free and retry only failures successfully',async()=>{
 const calls=new Map<string,number>(),states:CharacterModelStatus[]=[];
 const pool=new ModelAssetPool(100,async url=>{const count=(calls.get(url)??0)+1;calls.set(url,count);if(count===1)throw Error('offline');return new ArrayBuffer(20);},async()=>asset());
 const world=fixture(['Prince Feng']),models=loadCourtCharacterModels(world,'prince',pool,null,state=>states.push(state));
 await flush();noArt(world);assert.deepEqual([...models.status().failures].sort(),['@player','Prince Feng']);assert.equal(models.status().pending,0);
 models.retryFailed();assert.equal(models.status().pending,2);assert.deepEqual(models.status().failures,[]);await flush();
 assert.deepEqual(states.at(-1),{playerReady:true,pending:0,failures:[]});assert.equal(models.isReady('Prince Feng'),true);
 const before=pool.stats().downloads;models.retryFailed();await flush();assert.equal(pool.stats().downloads,before,'healthy actors never reload on retry');
 assert.deepEqual([...calls.values()],[2,2]);models.dispose();assertReleased(pool);
});

test('an NPC-only failure never removes ready player art and retries without another player lease',async()=>{
 let failNpc=true;const counts=new Map<string,number>();
 const pool=new ModelAssetPool(100,async url=>{counts.set(url,(counts.get(url)??0)+1);if(url!==PLAYER_PRINCE_ASSET_URL&&failNpc)throw Error('offline');return new ArrayBuffer(20);},async()=>asset());
 const world=fixture(['Prince Feng']),models=loadCourtCharacterModels(world,'prince',pool);await flush();
 const playerRoot=world.player.group.children[0];assert.equal(models.status().playerReady,true);assert.deepEqual(models.status().failures,['Prince Feng']);assert.equal(models.isReady('Prince Feng'),false);
 failNpc=false;models.retryFailed();await flush();assert.equal(world.player.group.children[0],playerRoot);assert.equal(counts.get(PLAYER_PRINCE_ASSET_URL),1);assert.equal(models.isReady('Prince Feng'),true);
 models.dispose();assertReleased(pool);
});

test('immediate zone backtracking during fetch revives shared work without old callbacks or late NPC resurrection',async()=>{
 const downloads=new Map<string,ReturnType<typeof deferred<ArrayBuffer>>>(),oldStates:CharacterModelStatus[]=[],newStates:CharacterModelStatus[]=[];
 const pool=new ModelAssetPool(100,url=>{const pending=deferred<ArrayBuffer>();downloads.set(url,pending);return pending.promise;},async()=>asset());
 const previous=fixture(['Prince Feng']),a=loadCourtCharacterModels(previous,'prince',pool,null,state=>oldStates.push(state));
 a.dispose();a.dispose();const oldCount=oldStates.length;
 const next=fixture(['Prince Feng']),b=loadCourtCharacterModels(next,'prince',pool,null,state=>newStates.push(state));
 downloads.forEach(pending=>pending.resolve(new ArrayBuffer(20)));await flush();
 noArt(previous);assert.equal(oldStates.length,oldCount);assert.equal(b.isReady(),true);assert.equal(b.isReady('Prince Feng'),true);assert.deepEqual(newStates.at(-1),{playerReady:true,pending:0,failures:[]});
 assert.equal(pool.stats().downloads,2,'one download per distinct player/NPC URL');assert.equal(pool.stats().decodes,2);assert.equal(pool.stats().liveLeases,2);
 b.dispose();assertReleased(pool);
});

test('zone disposal at decode settlement prevents every late callback and scene attachment',async()=>{
 const decoding=deferred<GLTF>(),states:CharacterModelStatus[]=[];
 const pool=new ModelAssetPool(100,async()=>new ArrayBuffer(20),()=>decoding.promise);
 const world=fixture(),models=loadCourtCharacterModels(world,'prince',pool,null,state=>states.push(state));await flush();
 const count=states.length;decoding.resolve(asset());queueMicrotask(()=>models.dispose());await flush();
 noArt(world);assert.equal(states.length,count);assertReleased(pool);assert.equal(pool.stats().disposals,1);
});

test('aborting between pool resolution and instance clone never returns a disposed template',async()=>{
 const pool=new ModelAssetPool(100,async()=>new ArrayBuffer(20),async()=>asset());
 const pin=await pool.acquire('/player'),abort=new AbortController();
 const pending=acquireModelInstance('/player',pool,abort.signal);queueMicrotask(()=>abort.abort());
 await assert.rejects(pending,{name:'AbortError'});assert.equal(pool.stats().liveLeases,1);
 pin.release();assertReleased(pool);
});

test('a new zone may acquire the same in-flight decode after departing zone cancellation',async()=>{
 const decoding=deferred<GLTF>(),pool=new ModelAssetPool(100,async()=>new ArrayBuffer(20),()=>decoding.promise);
 const abort=new AbortController(),old=pool.acquire('/player',abort.signal);await flush();
 abort.abort();const rejected=assert.rejects(old,{name:'AbortError'}),next=pool.acquire('/player');
 decoding.resolve(asset());const lease=await next;await rejected;
 assert.equal(pool.stats().downloads,1);assert.equal(pool.stats().decodes,1);assert.equal(pool.stats().disposals,0);
 lease.release();assertReleased(pool);assert.equal(pool.stats().disposals,1);
});

test('failed rank outfit retains authored body and retry uses the desired rank without moving the actor',async()=>{
 let failCrown=true;const calls:string[]=[];
 const pool=new ModelAssetPool(100,async url=>{calls.push(url);if(url===PLAYER_PRINCE_OUTFIT_URLS.crown_prince&&failCrown)throw Error('offline');return new ArrayBuffer(20);},async()=>asset());
 const world=fixture(['Prince Feng']);world.player.group.position.set(2,3,4);world.player.group.rotation.y=.6;
 const models=loadCourtCharacterModels(world,'prince',pool);await flush();const original=world.player.group.children[0],npc=world.npcs[0].group.children[0],group=world.player.group;
 models.setPlayerRank('crown_prince');await flush();assert.equal(models.status().playerReady,true);assert.deepEqual(models.status().failures,['@player']);assert.equal(group.children[0],original);assert.equal(original.visible,true);
 failCrown=false;models.retryFailed();await flush();
 assert.equal(models.animationState()!.assetUrl,PLAYER_PRINCE_OUTFIT_URLS.crown_prince);assert.notEqual(group.children[0],original);assert.equal(group.children.length,1);assert.equal(world.player.group,group);assert.equal(world.npcs[0].group.children[0],npc);
 assert.deepEqual(group.position.toArray(),[2,3,4]);assert.equal(group.rotation.y,.6);assert.deepEqual(models.status().failures,[]);assert.equal(calls.filter(url=>url===PLAYER_PRINCE_OUTFIT_URLS.crown_prince).length,2);
 models.dispose();assertReleased(pool);
});

test('returning to the displayed rank clears obsolete outfit failure and reports readiness immediately',async()=>{
 const states:CharacterModelStatus[]=[];
 const pool=new ModelAssetPool(100,async url=>{if(url===PLAYER_PRINCE_OUTFIT_URLS.crown_prince)throw Error('offline');return new ArrayBuffer(20);},async()=>asset());
 const world=fixture(),models=loadCourtCharacterModels(world,'prince',pool,null,state=>states.push(state));await flush();const original=world.player.group.children[0];
 models.setPlayerRank('crown_prince');await flush();assert.deepEqual(models.status().failures,['@player']);
 models.setPlayerRank(null);assert.deepEqual(models.status(),{playerReady:true,pending:0,failures:[]});assert.deepEqual(states.at(-1),models.status());assert.equal(world.player.group.children[0],original);
 models.dispose();assertReleased(pool);
});

test('returning to displayed rank cancels pending outfit and notifies UI rather than leaving a stale spinner',async()=>{
 const crown=deferred<ArrayBuffer>(),states:CharacterModelStatus[]=[];
 const pool=new ModelAssetPool(100,async url=>url===PLAYER_PRINCE_OUTFIT_URLS.crown_prince?crown.promise:new ArrayBuffer(20),async()=>asset());
 const world=fixture(),models=loadCourtCharacterModels(world,'prince',pool,null,state=>states.push(state));await flush();const original=world.player.group.children[0];
 models.setPlayerRank('crown_prince');assert.equal(states.at(-1)!.pending,1);models.setPlayerRank(null);
 assert.deepEqual(states.at(-1),{playerReady:true,pending:0,failures:[]});const stateCount=states.length;
 crown.resolve(new ArrayBuffer(20));await flush();assert.equal(states.length,stateCount);assert.equal(world.player.group.children[0],original);assert.equal(models.animationState()!.assetUrl,PLAYER_PRINCE_ASSET_URL);
 models.dispose();assertReleased(pool);
});

test('superseded outfit failure cannot replace newer rank status or become a retry target',async()=>{
 const grand=deferred<ArrayBuffer>();let failCrown=true;const calls:string[]=[];
 const pool=new ModelAssetPool(100,async url=>{calls.push(url);if(url===PLAYER_PRINCE_OUTFIT_URLS.grand_prince)return grand.promise;if(url===PLAYER_PRINCE_OUTFIT_URLS.crown_prince&&failCrown)throw Error('offline');return new ArrayBuffer(20);},async()=>asset());
 const world=fixture(),models=loadCourtCharacterModels(world,'prince',pool);await flush();
 models.setPlayerRank('grand_prince');models.setPlayerRank('crown_prince');await flush();assert.deepEqual(models.status().failures,['@player']);
 grand.reject(Error('late obsolete failure'));await flush();failCrown=false;models.retryFailed();await flush();
 assert.equal(models.animationState()!.assetUrl,PLAYER_PRINCE_OUTFIT_URLS.crown_prince);assert.equal(calls.filter(url=>url===PLAYER_PRINCE_OUTFIT_URLS.grand_prince).length,1);assert.equal(calls.filter(url=>url===PLAYER_PRINCE_OUTFIT_URLS.crown_prince).length,2);assert.deepEqual(models.status().failures,[]);
 models.dispose();assertReleased(pool);
});

test('one player template pin preserves cross-zone decoding while off-zone NPC templates release',async()=>{
 const decodes=new Map<string,number>(),pool=new ModelAssetPool(1000,async()=>new ArrayBuffer(20),async(_bytes,url)=>{decodes.set(url,(decodes.get(url)??0)+1);return asset();});
 const first=fixture(['Prince Feng']),a=loadCourtCharacterModels(first,'prince',pool);await flush();
 const firstRoot=first.player.group.children[0],pin=await pool.acquire(PLAYER_PRINCE_ASSET_URL);a.dispose();
 assert.equal(pool.stats().liveLeases,1);assert.equal(pool.stats().decodedAssets,1,'only pinned player template remains');
 const next=fixture(['Maid Ling']),b=loadCourtCharacterModels(next,'prince',pool);await flush();
 assert.equal(decodes.get(PLAYER_PRINCE_ASSET_URL),1);assert.notEqual(next.player.group.children[0],firstRoot,'new world receives its own private actor instance');
 b.dispose();assert.equal(pool.stats().liveLeases,1);assert.equal(pool.stats().decodedAssets,1);pin.release();assertReleased(pool);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {createPalaceWorld} from '../src/palace/world.ts';
import {createPalaceNavigator, type Waypoint} from '../src/palace/navigation.ts';
import {ZONES, zoneGates, type NpcVisitPose} from '../src/palace/zones.ts';

const blocked=(world:ReturnType<typeof createPalaceWorld>,point:Waypoint,radius=.4)=>world.colliders.some(c=>Math.abs(point.x-c.x)<c.w/2+radius&&Math.abs(point.z-c.z)<c.d/2+radius);
const landmarks=[{x:-14,z:-22},{x:-17,z:-25},{x:-10,z:-27},{x:-6,z:-24},{x:-1,z:-24},{x:7,z:-22},{x:14,z:-24},{x:16,z:-21}];
function verifyPath(world:ReturnType<typeof createPalaceWorld>,path:Waypoint[]){
  assert.ok(path.length);
  for(let i=0;i<path.length;i++){
    assert.ok(!blocked(world,path[i]),`path node ${JSON.stringify(path[i])} is clear`);
    if(!i)continue;const a=path[i-1],b=path[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.1));
    for(let step=0;step<=steps;step++)assert.ok(!blocked(world,{x:a.x+(b.x-a.x)*step/steps,z:a.z+(b.z-a.z)*step/steps}),'entire route segment is clear');
  }
}

test('Ladies north wing adds exactly two chambers and 320 square metres without changing other zone bounds',()=>{
  const w=createPalaceWorld([],'concubine',true,'ladies');
  assert.deepEqual(w.bounds,{minX:-20,maxX:20,minZ:-28,maxZ:20});
  assert.equal((w.bounds.maxX-w.bounds.minX)*(w.bounds.maxZ-w.bounds.minZ)-40*40,320);
  assert.equal(w.scene.userData.residentialExpansion.rooms,2);
  assert.equal(w.scene.userData.residentialExpansion.addedFootprintM2,320);
  assert.equal(ZONES.library.bounds.minZ,-20);assert.equal(ZONES.emperor.bounds.minZ,-28);assert.equal(ZONES.empress.bounds.minZ,-22);assert.equal(ZONES.dowager.bounds.minZ,-23);
  w.dispose();
});

test('both chambers and the Library gate connect inside the north wing without returning through the court',()=>{
  for(const software of [true,false]){
    const w=createPalaceWorld([],'concubine',software,'ladies');
    const nav=createPalaceNavigator(w.colliders,{...w.bounds,maxZ:-20});
    const start={x:-14,z:-22};
    for(const point of [...landmarks,{x:-6,z:-27}]){
      assert.ok(!blocked(w,point),`landmark ${JSON.stringify(point)} is genuinely walkable`);
      const path=nav.find(start,point);verifyPath(w,path);
      assert.ok(path.every(p=>p.z< -20.45),'the interior connection stays in the new wing');
      assert.ok(Math.hypot(path.at(-1)!.x-point.x,path.at(-1)!.z-point.z)<.51);
    }
    w.dispose();
  }
});

test('all gate destinations remain reachable, with the north portal anchored to its new outer wall',()=>{
  const w=createPalaceWorld([],'concubine',true,'ladies'),nav=createPalaceNavigator(w.colliders,w.bounds);
  assert.deepEqual(w.gates,zoneGates('ladies'));
  assert.deepEqual(w.gates.map(({to,x,z})=>({to,x,z})),[
    {to:'library',x:-6,z:-27},{to:'emperor',x:19,z:0},{to:'empress',x:6,z:19},{to:'dowager',x:-19,z:0},
  ]);
  for(const gate of w.gates)verifyPath(w,nav.find(w.spawn,gate));
  for(const x of [-8.5,-3.5])assert.ok(blocked(w,{x,z:-27.8}),'solid walls flank the north portal');
  assert.ok(!blocked(w,{x:-6,z:-27}),'door interaction point remains physically clear');
  assert.ok(blocked(w,{x:-6,z:-27.8}),'opaque exterior door stops walking into the skybox');
  w.dispose();
});

test('enclosing ceilings and doorway lintels have matching camera blockers while the central court stays open',()=>{
  const w=createPalaceWorld([],'concubine',true,'ladies');
  const covers=(c:{x:number;z:number;w:number;d:number},x:number,z:number)=>Math.abs(x-c.x)<=c.w/2&&Math.abs(z-c.z)<=c.d/2;
  for(const p of [{x:-14,z:-25},{x:-6,z:-24},{x:10,z:-24}])assert.ok(w.viewBlockers.some(c=>c.minY===6.4&&covers(c,p.x,p.z)),'every room/gallery is roofed and camera blocked');
  assert.ok(!w.viewBlockers.some(c=>c.minY===6.4&&covers(c,0,0)),'central garden is not roofed over');
  for(const p of [{x:-14,z:-20},{x:-6,z:-20},{x:10,z:-20},{x:-8.2,z:-24.5},{x:-3.8,z:-24.5},{x:-6,z:-28}])assert.ok(w.viewBlockers.some(c=>c.minY===3.5&&covers(c,p.x,p.z)),'every new doorway has an overhead blocker');
  w.dispose();
});

test('bed proxy is independently replaceable and all nearby lantern stems avoid its footprint',()=>{
  const w=createPalaceWorld([],'concubine',true,'ladies');
  assert.equal(w.bedFallback?.name,'LadiesCanopyBedPlaceholder');
  assert.deepEqual(w.bedFallback?.position.toArray(),[-14,0,-25]);
  assert.equal(w.bedFallback?.rotation.y,0);assert.equal(w.bedFallback?.parent,w.scene);
  assert.ok(w.bedFallback!.children.length>=10);
  assert.ok(w.colliders.some(c=>c.x===-14&&c.z===-25&&c.w===3.6&&c.d===2.6&&c.height===3.55));
  w.scene.traverse(o=>{if(o instanceof THREE.PointLight)assert.ok(Math.abs(o.position.x+14)>1.8+.41||Math.abs(o.position.z+25)>1.3+.41,'lamp is outside the bed canopy');});
  const resources=new Set<THREE.BufferGeometry>();w.bedFallback!.traverse(o=>{if(o instanceof THREE.Mesh)resources.add(o.geometry);});
  let disposed=0;resources.forEach(g=>g.addEventListener('dispose',()=>disposed++));w.dispose();assert.equal(disposed,resources.size);
});

test('existing flower/music landmarks and old-court saved NPC visits survive the expansion',()=>{
  for(const pose of [{x:0,z:15},{x:-6,z:-19},{x:19,z:0},{x:-19,z:0},{x:6,z:19},{x:4,z:13}]){
    const saved:Record<string,NpcVisitPose>={'Maid Ling':{zone:'ladies',...pose,rotationY:.7}};
    const w=createPalaceWorld([{name:'Maid Ling',type:'minor'}],'concubine',true,'ladies',saved);
    assert.equal(w.npcs[0].x,pose.x);assert.equal(w.npcs[0].z,pose.z);assert.equal(w.npcs[0].group.rotation.y,.7);
    for(const x of [-9,9])for(const z of [-7,7])assert.ok(w.colliders.some(c=>c.x===x&&c.z===z&&c.w===3.2&&c.d===3.2));
    for(const x of [-15,15])assert.ok(w.colliders.some(c=>c.x===x&&c.z===-12&&c.w===3.2&&c.d===1.3));
    assert.ok(w.colliders.some(c=>c.x===0&&c.z===-9&&c.w===3&&c.d===3));w.dispose();
  }
});

test('a full Ladies roster retains reachable initial stations and all roaming destinations',()=>{
  const people=['Maid Ling','Maid Su','Maid Bai','Maid Lan','Consort Yin','Consort Yue','Consort Han','Consort Shu','Concubine Mei','Concubine Lin','Concubine Hua','Concubine Yun','Prince Feng','Empress Consort','Empress Dowager'].map(name=>({name,type:'side' as const}));
  const w=createPalaceWorld(people,'concubine',true,'ladies'),nav=createPalaceNavigator(w.colliders,w.bounds);
  for(const npc of w.npcs){assert.ok(!blocked(w,npc));verifyPath(w,nav.find(w.spawn,npc));for(const stop of npc.route.stops)verifyPath(w,nav.find(npc,stop));}
  w.dispose();
});

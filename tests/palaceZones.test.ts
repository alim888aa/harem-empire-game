import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createPalaceWorld } from '../src/palace/world.ts';
import { createPalaceNavigator } from '../src/palace/navigation.ts';
import { createPalaceVisitState, PLAYABLE_ZONES, scheduledNpcZone, zoneRoster, ZONES, type NpcVisitPose } from '../src/palace/zones.ts';
import { careerZoneAccess } from '../src/lib/careerAccess.ts';
const people=[{name:'Maid Ling',type:'minor' as const},{name:'Prince Feng',type:'side' as const},{name:'Empress Dowager',type:'major' as const}];

test('all five worlds have different architecture and reachable valid spawns, gates and NPC paths',()=>{
  const signatures=new Set<string>();
  for(const zone of PLAYABLE_ZONES){
    const world=createPalaceWorld(people,'prince',true,zone),nav=createPalaceNavigator(world.colliders,world.bounds);
    assert.equal(world.zone,zone);assert.equal(world.gates.length,4);
    const blocked=(x:number,z:number)=>world.colliders.some(c=>Math.abs(x-c.x)<c.w/2+.36&&Math.abs(z-c.z)<c.d/2+.36);
    assert.ok(!blocked(world.spawn.x,world.spawn.z));
    assert.equal(new Set(world.gates.map(g=>g.to)).size,4);
    for(const gate of world.gates){assert.notEqual(gate.to,zone);assert.ok(!blocked(gate.x,gate.z),`${zone}/${gate.to} gate is open`);assert.ok(nav.find(world.spawn,gate).length,`${zone}/${gate.to} reachable`);}
    for(const npc of world.npcs){assert.ok(!blocked(npc.x,npc.z));assert.ok(nav.find(world.spawn,npc).length);for(const stop of npc.route.stops)assert.ok(nav.find(npc,stop).length,`${zone}/${npc.name} roam stop reachable`);}
    signatures.add(JSON.stringify(world.colliders));world.dispose();assert.equal(world.scene.children.length,0);
  }
  assert.equal(signatures.size,5,'zones are distinct builds, not the same retained world under five labels');
});

test('world cleanup actually disposes resources and is safe to repeat',()=>{
  for(let pass=0;pass<3;pass++)for(const zone of PLAYABLE_ZONES){
    const world=createPalaceWorld(people,'prince',true,zone);
    const geometry=new Set<THREE.BufferGeometry>(),material=new Set<THREE.Material>();
    world.scene.traverse(object=>{if(object instanceof THREE.Mesh){geometry.add(object.geometry);for(const m of Array.isArray(object.material)?object.material:[object.material])material.add(m);}});
    let geometries=0,materials=0;
    geometry.forEach(g=>g.addEventListener('dispose',()=>geometries++));material.forEach(m=>m.addEventListener('dispose',()=>materials++));
    world.dispose();assert.equal(geometries,geometry.size);assert.equal(materials,material.size);world.dispose();assert.equal(geometries,geometry.size);assert.equal(materials,material.size);
  }
});

test('saved NPC position and facing survive a zone rebuild without an initial walking jump',()=>{
  const first=createPalaceWorld(people,'prince',true,'ladies');
  const npc=first.npcs[0];const saved:Record<string,NpcVisitPose>={[npc.name]:{zone:'ladies',x:npc.x+.1,z:npc.z+.1,rotationY:1.2}};
  first.dispose();const next=createPalaceWorld(people,'prince',true,'ladies',saved),restored=next.npcs.find(n=>n.name===npc.name)!;
  assert.equal(restored.x,saved[npc.name].x);assert.equal(restored.z,saved[npc.name].z);assert.equal(restored.group.rotation.y,1.2);
  for(let i=0;i<500;i++){const before=next.npcs.map(n=>({x:n.x,z:n.z}));next.animate(i/10,.1,false,false);next.npcs.forEach((n,index)=>assert.ok(Math.hypot(n.x-before[index].x,n.z-before[index].z)<=.06501,'walking bounded to .65m/s'));}
  const before=next.npcs.map(n=>({x:n.x,z:n.z}));next.animate(51,.5,false,true);assert.deepEqual(next.npcs.map(n=>({x:n.x,z:n.z})),before);
  next.dispose();
});

test('invalid or other-zone saved positions do not spawn inside a wall or outside the current zone',()=>{
  const saved:Record<string,NpcVisitPose>={'Maid Ling':{zone:'library',x:999,z:999,rotationY:0},'Prince Feng':{zone:'emperor',x:0,z:-25,rotationY:0}};
  const world=createPalaceWorld(people,'prince',true,'library',saved);
  for(const npc of world.npcs){assert.ok(npc.x>world.bounds.minX&&npc.x<world.bounds.maxX);assert.ok(npc.z>world.bounds.minZ&&npc.z<world.bounds.maxZ);}
  world.dispose();
});

test('career starts are allowed, with no clock/campaign data or actors recreated by visit-state creation',()=>{
  for(const role of ['prince','minister','scholar','concubine']){
    const visits=createPalaceVisitState(role);assert.ok(careerZoneAccess(role,null,visits.zone).allowed);
    assert.equal(visits.zone,role==='concubine'?'ladies':'library');assert.deepEqual(Object.keys(visits).sort(),['npcByName','playerByZone','zone']);
  }
  assert.equal(careerZoneAccess('concubine',null,'emperor').allowed,false);
  assert.match(careerZoneAccess('concubine',null,'empress').reason??'',/Consort/);
});

test('deterministic visits retain identities without a guaranteed Ladies headcount',()=>{
  const maids=['Maid Ling','Maid Su','Maid Bai','Maid Lan'].map(name=>({name,identity:{name}}));
  const ministers=['Minister Chen','Minister Wang','Minister Liu','Minister Zhang'];
  const princes=['Prince Feng','Prince Han','Prince Jun','Prince Lei'];
  const ministerVisits=new Set<string>();
  for(let season=1;season<=8;season++){
    for(const progress of [0,.25,.5,.75]){
      const roster=zoneRoster(maids,'ladies',season,progress,'concubine');
      for(const person of roster)assert.equal(person,maids.find(original=>original.name===person.name));
      assert.deepEqual(zoneRoster(maids,'ladies',season,progress),roster);
      assert.equal(scheduledNpcZone('Empress Dowager',season,progress),progress===.5?'ladies':'dowager');
      assert.ok(PLAYABLE_ZONES.includes(scheduledNpcZone('Empress Consort',season,progress)));
    }
    const attendingMinisters=ministers.filter(name=>scheduledNpcZone(name,season,.5)==='empress');
    const attendingPrinces=princes.filter(name=>scheduledNpcZone(name,season,.25)==='ladies');
    assert.equal(attendingMinisters.length,1);assert.equal(attendingPrinces.length,0);
    ministerVisits.add(attendingMinisters[0]);
  }
  assert.equal(ministerVisits.size,4);
  assert.equal(ZONES.library.title,'Academy Library');
});

test('seasonal mood changes lighting and particles in-place without replacing actors or geometry',()=>{
  const world=createPalaceWorld(people,'prince',true,'library');
  const nodes=[...world.scene.children],player=world.player,npcs=[...world.npcs];
  const sun=world.scene.children.find(node=>node instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
  world.setSeason(1);const spring=sun.color.getHex();world.setSeason(4);assert.notEqual(sun.color.getHex(),spring);
  assert.equal(world.scene.userData.season,4);assert.deepEqual(world.scene.children,nodes);assert.equal(world.player,player);assert.deepEqual(world.npcs,npcs);
  world.setSeason(4);assert.deepEqual(world.scene.children,nodes);world.dispose();
});

test('Emperor authored joinery has supporting walls/columns and front/rear roof blockers',()=>{
  const world=createPalaceWorld([],'prince',false,'emperor');
  for(const x of [-11,11])for(const z of [-24,-10,8,21])assert.ok(world.colliders.some(c=>c.x===x&&c.z===z),'relief wall has physical support');
  for(const x of [-8,8])for(const z of [-24,-16,-8,0,8,16])assert.ok(world.colliders.some(c=>c.x===x&&c.z===z),'brackets have a column');
  assert.ok(world.viewBlockers.some(c=>c.z===8&&c.minY===7.2));
  assert.ok(world.viewBlockers.some(c=>c.z===-18&&c.minY===9));
  const materials=new Set<THREE.Material>(),geometry=new Set<THREE.BufferGeometry>();let freedMaterials=0,freedGeometry=0;
  world.scene.traverse(node=>{if(node instanceof THREE.Mesh){geometry.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])materials.add(material);}});
  geometry.forEach(g=>g.addEventListener('dispose',()=>freedGeometry++));materials.forEach(m=>m.addEventListener('dispose',()=>freedMaterials++));
  world.dispose();assert.equal(freedGeometry,geometry.size);assert.equal(freedMaterials,materials.size);
});

test('office presentation does not replace persistent courtier identity or navigation keys',()=>{
  const person={name:'Crown Prince',displayName:'Former Crown Prince',type:'major' as const};
  const world=createPalaceWorld([person],'prince',true,'library');
  assert.equal(world.npcs[0].name,'Crown Prince');assert.equal(world.npcs[0].displayName,'Former Crown Prince');
  assert.equal(world.npcs[0].group.name,'Courtier:Crown Prince');world.dispose();
});

test('Prince and Grand Prince never visit Ladies; Crown Prince and Emperor are authorized visitors',()=>{
 for(let season=1;season<=24;season++)for(const phase of [0,.25,.5,.75])for(const name of ['Prince Feng','Prince Han','Prince Jun','Prince Lei','Grand Prince Han'])assert.notEqual(scheduledNpcZone(name,season,phase),'ladies',name);
 assert.equal(scheduledNpcZone('Crown Prince',1,.5),'ladies');assert.equal(scheduledNpcZone('Emperor',1,.5),'ladies');
});
test('all maids visit both royal women’s palaces and Ladies, while eunuchs span all five zones',()=>{
 for(const name of ['Maid Ling','Maid Su','Maid Bai','Maid Lan','Maid Xing','Maid Tao']){const visits=new Set();for(let season=1;season<=16;season++)for(const p of [0,.25,.5,.75])visits.add(scheduledNpcZone(name,season,p));assert.deepEqual([...visits].sort(),['dowager','empress','ladies'],name);}
 const visits=new Set();for(let season=1;season<=5;season++)for(const p of [0,.25,.5,.75])visits.add(scheduledNpcZone('Eunuch Gao',season,p));assert.equal(visits.size,5);
});
test('all four external door sets have opaque depth-writing leaves, camera blockers and reachable interaction thresholds',()=>{
 for(const zone of PLAYABLE_ZONES){const world=createPalaceWorld([],'prince',false,zone);const doors=world.scene.children.filter(n=>n.name.startsWith('PalaceDoor:'));assert.equal(doors.length,4);for(const door of doors){door.traverse(n=>{if(n instanceof THREE.Mesh)for(const m of Array.isArray(n.material)?n.material:[n.material]){assert.equal(m.transparent,false);assert.equal(m.opacity,1);assert.equal(m.depthWrite,true);}});}
 const nav=createPalaceNavigator(world.colliders,world.bounds);for(const g of world.gates)assert.ok(nav.find(world.spawn,g).length);world.dispose();}
});

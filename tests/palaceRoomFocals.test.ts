import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {addPalaceRoomFocals} from '../src/palace/palaceRoomFocals';
import {createPalaceWorld} from '../src/palace/world';import {createPalaceNavigator} from '../src/palace/navigation';
for(const zone of ['empress','dowager','ladies'] as const)test(`${zone} integrated focal geometry preserves gates, NPC paths, physical floors and cleanup`,()=>{
 const world=createPalaceWorld([{name:'Maid Ling',type:'minor'},{name:'Eunuch Gao',type:'minor'}],'concubine',false,zone),nav=createPalaceNavigator(world.colliders,world.bounds);
 const root=world.scene.getObjectByName(`PalaceRoomFocals:${zone}`)!;assert.ok(root);assert.ok(root.children.length<=15);
 for(const gate of world.gates){const path=nav.find(world.spawn,gate);assert.ok(path.length,`gate ${gate.to}`);assert.ok(Math.hypot(path.at(-1)!.x-gate.x,path.at(-1)!.z-gate.z)<.4);}
 for(const npc of world.npcs){assert.ok(nav.find(world.spawn,npc).length);for(const stop of npc.route.stops)assert.ok(nav.find(npc,stop).length);}
 const geos=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){geos.add(o.geometry);mats.add(o.material);assert.equal(o.material.emissive.getHex(),0,'room art is lit by runtime light, not baked glow');}});let disposed=0;for(const g of geos)g.addEventListener('dispose',()=>disposed++);for(const m of mats)m.addEventListener('dispose',()=>disposed++);
 if(zone==='empress')assert.ok(world.groundHeight(2,-16)>=.35);if(zone==='ladies'){assert.ok(world.groundHeight(0,5)>.1);assert.ok(nav.find(world.spawn,{x:0,z:-5}).length,'central pond is routable around');}
 world.dispose();world.dispose();assert.equal(disposed,geos.size+mats.size);
});
test('focal kit is a no-op for untouched rooms and software fallback',()=>{for(const zone of ['empress','dowager','ladies','emperor','library'] as const){const scene=new THREE.Scene(),kit=addPalaceRoomFocals(scene,zone,{software:true});assert.equal(scene.children.length,0);assert.equal(kit.floorHeight(0,0),0);kit.dispose();}});

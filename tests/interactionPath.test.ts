import test from 'node:test';import assert from 'node:assert/strict';
import {createPalaceWorld}from'../src/palace/world';
import {clearInteractionPath}from'../src/palace/interactionPath';
test('Ladies Library gate cannot be used through the new chamber partition despite close distance',()=>{
 const w=createPalaceWorld([],'minister',true,'ladies');try{
  const gate=w.gates.find(g=>g.to==='library')!;assert.ok(Math.hypot(-8.699-gate.x,-27-gate.z)<2.8);
  assert.equal(clearInteractionPath({x:-8.699,z:-27},gate,w.colliders,w.bounds),false);
  assert.equal(clearInteractionPath({x:gate.x,z:gate.z+2},gate,w.colliders,w.bounds),true);
 }finally{w.dispose();}
});

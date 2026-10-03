import test from 'node:test';
import assert from 'node:assert/strict';
import {requestJump,stepJump,type JumpState} from '../src/palace/jumpPhysics.ts';
test('jump rises, cannot double-jump, and lands without residual vertical speed',()=>{
 const state:JumpState={y:0,velocity:0,airborne:false};assert.equal(requestJump(state,0),true);
 assert.equal(requestJump(state,0),false);let top=0;
 for(let i=0;i<90;i++){stepJump(state,1/60,0);top=Math.max(top,state.y);}
 assert.ok(top>.8&&top<1);assert.deepEqual(state,{y:0,velocity:0,airborne:false});
});
test('overhead clearance blocks or shortens jumps without passing through it',()=>{
 const low:JumpState={y:0,velocity:0,airborne:false};assert.equal(requestJump(low,0,.04),false);
 assert.equal(requestJump(low,0,.25),true);let top=0;
 for(let i=0;i<20;i++){stepJump(low,.1,0,.25);top=Math.max(top,low.y);}
 assert.ok(top<=.25);assert.equal(low.airborne,false);assert.equal(low.y,0);
});
test('raised-floor landing and a paused frame preserve correct physical state',()=>{
 const state:JumpState={y:.56,velocity:0,airborne:false};requestJump(state,.56);
 const before={...state};stepJump(state,0,.56);assert.deepEqual(state,before);
 for(let i=0;i<10;i++)stepJump(state,.2,.56);assert.equal(state.y,.56);assert.equal(state.airborne,false);
});

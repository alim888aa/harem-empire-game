import test from 'node:test';import assert from 'node:assert/strict';import{createActor}from'xstate';
import {campaignRandom,nextCampaignRandom}from'../src/lib/campaignRandom';
import {gameMachine}from'../src/state-machines/game-machine';
test('serialized PRNG continuation has the exact next draws and stays within uint32 bounds',()=>{
 const a=campaignRandom(987654321);for(let i=0;i<40;i++)a.next();const b=campaignRandom(a.state);
 for(let i=0;i<100;i++){assert.equal(a.next(),b.next());assert.ok(a.state>0&&a.state<=0xffffffff);}
 assert.notEqual(nextCampaignRandom(1).state,nextCampaignRandom(2).state);
});
test('restored real campaign keeps the same future casts, encounter and tribute rolls despite unrelated randomness',t=>{
 t.mock.method(console,'log',()=>{});Object.defineProperty(globalThis,'alert',{configurable:true,value:()=>{}});
 const first=createActor(gameMachine);first.start();first.send({type:'CHOOSE_CHARACTER',payload:{type:'prince'}});first.send({type:'INITIALIZE_GAME'});
 const saved=JSON.parse(JSON.stringify(first.getPersistedSnapshot()));const second=createActor(gameMachine,{snapshot:saved});second.start();
 t.after(()=>{first.stop();second.stop();});
 const view=(a:typeof first)=>{const c=a.getSnapshot().context;return{value:a.getSnapshot().value,season:c.season,gifts:c.giftsRemaining,cast:c.activeCharacterNames,rng:c.rngState,influence:c.playerPersonality.influence};};
 assert.deepEqual(view(first),view(second));assert.equal(Object.keys(second.getSnapshot().context.characters).length,48);
 for(let i=0;i<8;i++){
  first.send({type:'NEXT_SEASON'});for(let j=0;j<17;j++)Math.random();second.send({type:'NEXT_SEASON'});assert.deepEqual(view(first),view(second));
  if(first.getSnapshot().matches({playing:'emperor_encounter'})){
   first.send({type:'GIVE_EMPEROR_GIFT',giftsRemaining:9999});for(let j=0;j<31;j++)Math.random();second.send({type:'GIVE_EMPEROR_GIFT',giftsRemaining:9999});assert.deepEqual(view(first),view(second));
  }
 }
});

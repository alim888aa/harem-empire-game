import test from 'node:test';
import assert from 'node:assert/strict';
import {createActor} from 'xstate';
import {earnedInfluence} from '../src/lib/campaignBalance';
import {determineVictoryPath} from '../src/lib/emperorAudience';
import {gameMachine} from '../src/state-machines/game-machine';

test('influence earnings split exactly at70%, retain existing power, and remain bounded',()=>{
 const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9);
 near(earnedInfluence(.6,.05),.65);near(earnedInfluence(.69,.06),.71);near(earnedInfluence(.8,.1),.82);
 assert.ok(earnedInfluence(.95,.1)>=.95);assert.equal(earnedInfluence(1,.1),1);
 near(earnedInfluence(.69,.06),earnedInfluence(earnedInfluence(.69,.03),.03));
});
test('all top offices require three completed seasons; renewed entry resets consolidation',()=>{
 for(const [characterType,rank] of [['prince','crown_prince'],['minister','prime_minister'],['concubine','empress']]){
  const c:any={characterType,rank,rankEnteredSeason:4,season:4,factionSystem:{playerFaction:'Imperial'}};
  for(c.season=4;c.season<7;c.season++)assert.equal(determineVictoryPath(c),null);
  assert.equal(determineVictoryPath(c),'traditional');c.rankEnteredSeason=7;assert.equal(determineVictoryPath(c),null);
 }
});
test('rival hate uses ten points of actual attenuated influence, not raw awards',t=>{
 t.mock.method(console,'log',()=>{});Object.defineProperty(globalThis,'alert',{configurable:true,value:()=>{}});
 const machine=gameMachine.provide({guards:{emperor_encountered:()=>false,shouldOfferEmperorAudience:()=>false}});
 const base=createActor(machine).start();base.send({type:'CHOOSE_CHARACTER',payload:{type:'prince'}});base.send({type:'INITIALIZE_GAME'});
 const snapshot:any=JSON.parse(JSON.stringify(base.getPersistedSnapshot()));base.stop();
 Object.assign(snapshot.context,{rank:'grand_prince',supportPoints:80,rewardedRanks:['grand_prince'],rivalInfluenceHighWater:.72,rivalInfluenceGain:0,promotionRivals:['Prime Minister']});snapshot.context.playerPersonality.influence=.72;
 const game=createActor(machine,{snapshot}).start();t.after(()=>game.stop());
 const target=game.getSnapshot().context.characters['Prime Minister'];const hate=target.getSnapshot().context.hate;
 for(let i=1;i<=5;i++){
  game.getSnapshot().context.playerPersonality.influence=earnedInfluence(game.getSnapshot().context.playerPersonality.influence,.1);
  game.send({type:'UPDATE_PALACE_PRESENCE',zone:'library',names:[]});
  assert.equal(target.getSnapshot().context.hate,hate+(i===5?5:0));
 }
});

test('v3 already offered audience is grandfathered without shortening its deadline or changing influence',async t=>{
 const {parseCampaignSave,createCampaignPresentation,campaignActorOptions}=await import('../src/persistence/campaignSave');
 t.mock.method(console,'log',()=>{});Object.defineProperty(globalThis,'alert',{configurable:true,value:()=>{}});
 const g=createActor(gameMachine).start();g.send({type:'CHOOSE_CHARACTER',payload:{type:'prince'}});g.send({type:'INITIALIZE_GAME'});t.after(()=>g.stop());
 const snapshot:any=JSON.parse(JSON.stringify(g.getPersistedSnapshot()));Object.assign(snapshot.context,{rank:'crown_prince',rankEnteredSeason:5,season:5});snapshot.context.factionSystem.playerFaction='Loyalist';snapshot.context.playerPersonality.influence=.97;snapshot.value='emperor_audience_offer';for(const ref of Object.values(snapshot.context.characters) as any[]){snapshot.children[ref.id].snapshot.context.currentSeason=5;}
 const presentation=createCampaignPresentation('prince');presentation.clock.season=5;const save=parseCampaignSave(JSON.stringify({format:'harem-empire',version:3,savedAt:new Date().toISOString(),snapshot,presentation})).save;
 assert.equal(save.snapshot.context.rankEnteredSeason,5);assert.equal(save.snapshot.context.playerPersonality.influence,.97);assert.equal(save.snapshot.context.consolidationWaived,true);assert.equal(determineVictoryPath(save.snapshot.context as any),'shadow-ruler');
 const restored=createActor(gameMachine,campaignActorOptions(save)).start();t.after(()=>restored.stop());assert.ok(restored.getSnapshot().matches('emperor_audience_offer'));
});

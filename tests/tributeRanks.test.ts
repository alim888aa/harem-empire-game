import test,{beforeEach,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {createActor} from 'xstate';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {gameMachine} from '../src/state-machines/game-machine';
import {tributeCost,seasonalGiftGrant,promotionHate} from '../src/lib/campaignBalance';
import {captureCampaign,createCampaignPresentation,campaignActorOptions,parseCampaignSave} from '../src/persistence/campaignSave';
import {PLAYER_NODE,updateCourtNode} from '../src/lib/courtGraph';
import {CAREER_LADDERS,resolveCareer} from '../src/lib/careerAccess';
import EmperorEncounter from '../src/components/EmperorEncounter';
import GameHeader from '../src/components/GameHeader';
import {nextCampaignRandom} from '../src/lib/campaignRandom';
import {canBypassEmperorExecution} from '../src/lib/playerVector';
const machine=gameMachine.provide({guards:{emperor_encountered:()=>true,shouldOfferEmperorAudience:()=>false}});
beforeEach(t=>{t.mock.method(console,'log',()=>{});Object.defineProperty(globalThis,'alert',{configurable:true,value:()=>{}});});
function start(t:TestContext,role:'prince'|'minister'|'concubine',rank:string|null,gifts=100,rngState=1){
 const a=createActor(machine).start();t.after(()=>a.stop());a.send({type:'CHOOSE_CHARACTER',payload:{type:role}});a.send({type:'INITIALIZE_GAME'});
 const s:any=captureCampaign(a,createCampaignPresentation(role));Object.assign(s.snapshot.context,{rank,rngState,giftsRemaining:gifts,supportPoints:0,playerPersonality:{...s.snapshot.context.playerPersonality,influence:.2}});s.snapshot.context.relationshipGraph=updateCourtNode(s.snapshot.context.relationshipGraph,PLAYER_NODE,{office:rank??resolveCareer(role)!});
 const game=createActor(machine,campaignActorOptions(parseCampaignSave(JSON.stringify(s)).save)).start();t.after(()=>game.stop());return game;
}
for(const role of ['prince','minister','concubine'] as const)for(const [index,rank]of CAREER_LADDERS[resolveCareer(role)!].entries())test(`${role}/${rank}: rank tribute ${[10,20,40][index]} survives pending reload, charges once and matches UI`,t=>{
 const cost=[10,20,40][index];assert.equal(tributeCost(role,rank),cost);
 const game=start(t,role,rank);game.send({type:'NEXT_SEASON'});assert.ok(game.getSnapshot().matches({playing:'emperor_encounter'}));
 const save=captureCampaign(game,createCampaignPresentation(role));assert.ok(save);const restored=createActor(machine,campaignActorOptions(save)).start();t.after(()=>restored.stop());
 const html=renderToStaticMarkup(createElement(EmperorEncounter,{role,rank,giftsRemaining:cost,onGiveGift:()=>{},onRefuse:()=>{}}));assert.match(html,new RegExp(`Give Tribute \\(${cost} gifts\\)`));assert.doesNotMatch(html,/disabled=""/);
 const poor=renderToStaticMarkup(createElement(EmperorEncounter,{role,rank,giftsRemaining:cost-1,onGiveGift:()=>{},onRefuse:()=>{}}));assert.match(poor,/disabled=""/);assert.match(poor,/cannot afford tribute/);
 restored.send({type:'GIVE_EMPEROR_GIFT',giftsRemaining:999});assert.equal(restored.getSnapshot().context.giftsRemaining,100-cost+seasonalGiftGrant(role,rank));assert.equal(restored.getSnapshot().context.season,2);
 const done=JSON.stringify(restored.getPersistedSnapshot());restored.send({type:'GIVE_EMPEROR_GIFT',giftsRemaining:999});assert.equal(JSON.stringify(restored.getPersistedSnapshot()),done);
});
test('base aliases, legacy empress and demotions resolve the appropriate rate',()=>{for(const role of ['prince','minister','concubine'])assert.equal(tributeCost(role,null),10);assert.equal(tributeCost('scholar','minister'),20);assert.equal(tributeCost('concubine','empress_consort'),40);assert.deepEqual(['crown_prince','grand_prince','prince'].map(rank=>tributeCost('prince',rank)),[40,20,10]);assert.deepEqual(['prince','minister','scholar','concubine'].map(promotionHate),[20,30,30,40]);});
test('pardon uses current tribute affordability; forged amounts never pay a high-rank tribute',t=>{const rep={perceivedLoyalty:.9,perceivedThreat:0,trustworthiness:0,politicalSkill:0};assert.ok(canBypassEmperorExecution(25,rep,40));assert.equal(canBypassEmperorExecution(40,rep,40),false);const game=start(t,'prince','crown_prince',39);game.send({type:'NEXT_SEASON'});const before=game.getSnapshot().context.giftsRemaining;game.send({type:'GIVE_EMPEROR_GIFT',giftsRemaining:999});assert.equal(game.getSnapshot().value,'game_over');assert.equal(game.getSnapshot().context.giftsRemaining,before);});

for (const [seed, favored] of [[1, true], [123456789, false]] as const) {
  test(`tribute ${favored ? 'favor' : 'neutral'} receipt survives reload without another payment`, t => {
    const game = start(t, 'prince', 'prince', 100, seed);
    game.send({type: 'NEXT_SEASON'});
    const before = game.getSnapshot().context;
    const draw = nextCampaignRandom(before.rngState);
    assert.equal(draw.value < 0.3, favored);
    game.send({type: 'GIVE_EMPEROR_GIFT', giftsRemaining: 999});
    const paid = game.getSnapshot().context;
    assert.match(paid.tributeResult, favored ? /favors your tribute/ : /without comment/);
    assert.equal(paid.playerPersonality.influence, before.playerPersonality.influence + (favored ? 0.04 : 0));
    const save = captureCampaign(game, createCampaignPresentation('prince'));
    assert.ok(save);
    const restored = createActor(machine, campaignActorOptions(save)).start();
    t.after(() => restored.stop());
    assert.equal(restored.getSnapshot().context.tributeResult, paid.tributeResult);
    restored.send({type: 'GIVE_EMPEROR_GIFT', giftsRemaining: 999});
    assert.equal(restored.getSnapshot().context.giftsRemaining, paid.giftsRemaining);
    assert.equal(restored.getSnapshot().context.tributeResult, paid.tributeResult);
    restored.send({type: 'GIVE_GIFT_WITH_MESSAGE', characterId: 'unknown', messageType: 'neutral', requestId: 'invalid-target'});
    assert.equal(restored.getSnapshot().context.tributeResult, paid.tributeResult);
    restored.send({type: 'NEXT_SEASON'});
    assert.equal(restored.getSnapshot().context.tributeResult, '');
  });
}
test('tribute receipt is readable in the normal game header without another dialog or action', () => {
  const gameState = {season: 2, gifts: 110, systemSupport: 0, currentCharacterIndex: 0, rank: 'prince', isGameStarted: true, characterSupport: {}};
  const props = {gameState, onCourtClick: () => {}, onProfileClick: () => {}, tributeResult: 'The Emperor receives your tribute without comment.'};
  const html = renderToStaticMarkup(createElement(GameHeader, props));
  assert.match(html, /role="status"/);
  assert.match(html, /The Emperor receives your tribute without comment\./);
  assert.doesNotMatch(renderToStaticMarkup(createElement(GameHeader, {...props, tributeResult: ''})), /role="status"/);
});

test('a valid subsequent gift clears tribute feedback while rejected actions preserve it', t => {
  const game = start(t, 'prince', 'prince', 100, 1);
  game.send({type: 'NEXT_SEASON'});
  game.send({type: 'GIVE_EMPEROR_GIFT', giftsRemaining: 100});
  const receipt = game.getSnapshot().context.tributeResult;
  assert.ok(receipt);
  game.send({type: 'SPIT_IN_FACE', characterId: 'unknown'});
  assert.equal(game.getSnapshot().context.tributeResult, receipt);
  const target = game.getSnapshot().context.activeCharacterNames.find(name =>
    game.getSnapshot().context.characters[name].getSnapshot().context.type === 'minor');
  assert.ok(target);
  game.send({type: 'GIVE_GIFT_WITH_MESSAGE', characterId: target, messageType: 'neutral', requestId: 'after-tribute'});
  assert.ok(game.getSnapshot().context.pendingGift);
  assert.equal(game.getSnapshot().context.tributeResult, '');
});

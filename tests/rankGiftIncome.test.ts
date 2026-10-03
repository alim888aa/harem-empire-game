import test,{beforeEach,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {createActor} from 'xstate';
import {gameMachine} from '../src/state-machines/game-machine';
import {seasonalGiftGrant} from '../src/lib/campaignBalance';
import {parseCampaignSave,createCampaignPresentation,campaignActorOptions} from '../src/persistence/campaignSave';
import GameHeader from '../src/components/GameHeader';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const machine=gameMachine.provide({guards:{emperor_encountered:()=>false}});
beforeEach(t=>{t.mock.method(console,'log',()=>{});Object.defineProperty(globalThis,'alert',{configurable:true,value:()=>{}});});
const cases=[['concubine',null,20],['concubine','consort',25],['concubine','empress',30],['minister',null,20],['minister','minister',30],['minister','prime_minister',45],['prince',null,25],['prince','grand_prince',45],['prince','crown_prince',65]] as const;
function start(t:TestContext,role:'prince'|'minister'|'concubine') {const g=createActor(machine).start();g.send({type:'CHOOSE_CHARACTER',payload:{type:role}});g.send({type:'INITIALIZE_GAME'});t.after(()=>g.stop());return g;}
for(const [role,rank,grant] of cases)test(`${role}/${rank??'base'} exact rank grant, retained leftovers, reload and no double payment`,t=>{
 const g=start(t,role);assert.equal(g.getSnapshot().context.giftsRemaining,role==='prince'?25:20);
 const snapshot:any=JSON.parse(JSON.stringify(g.getPersistedSnapshot()));snapshot.context.rank=rank;snapshot.context.giftsRemaining=137;snapshot.context.supportPoints=0;
 const restored=createActor(machine,{snapshot}).start();t.after(()=>restored.stop());assert.equal(restored.getSnapshot().context.giftsRemaining,137);
 restored.send({type:'NEXT_SEASON'});assert.equal(restored.getSnapshot().context.giftsRemaining,137+grant);assert.equal(restored.getSnapshot().context.lastSeasonGiftGrant,grant);
 const data:any={format:'harem-empire',version:3,savedAt:new Date().toISOString(),snapshot:restored.getPersistedSnapshot(),presentation:createCampaignPresentation(role)};data.presentation.clock.season=2;
 const save=parseCampaignSave(JSON.stringify(data)).save;const loaded=createActor(machine,campaignActorOptions(save)).start();t.after(()=>loaded.stop());assert.equal(loaded.getSnapshot().context.giftsRemaining,137+grant);
 loaded.send({type:'NEXT_SEASON'});assert.equal(loaded.getSnapshot().context.giftsRemaining,137+2*grant);
});
for(const [role,rank,deadline,grant,destination] of [['concubine','consort',12,20,null],['concubine','empress',12,25,'consort'],['minister','minister',16,20,null],['minister','prime_minister',16,30,'minister'],['prince','grand_prince',20,25,null],['prince','crown_prince',20,45,'grand_prince']] as const)test(`${rank} deadline grants destination allowance and never takes earned stock`,t=>{
 const g=start(t,role),snapshot:any=JSON.parse(JSON.stringify(g.getPersistedSnapshot()));Object.assign(snapshot.context,{rank,season:deadline,rankEnteredSeason:1,giftsRemaining:121,supportPoints:0});
 const restored=createActor(machine,{snapshot}).start();t.after(()=>restored.stop());restored.send({type:'NEXT_SEASON'});
 assert.equal(restored.getSnapshot().context.rank,destination);assert.equal(restored.getSnapshot().context.giftsRemaining,121+grant);assert.equal(restored.getSnapshot().context.lastSeasonGiftGrant,grant);
});
test('legacy final rank mapping and invalid careers are explicit',()=>{assert.equal(seasonalGiftGrant('concubine','empress_consort'),30);assert.equal(seasonalGiftGrant('scholar','scholar'),20);assert.equal(seasonalGiftGrant('prince','consort'),0);assert.equal(seasonalGiftGrant(null,null),0);});
test('profile is a semantic button with its own action, including mobile control',()=>{const html=renderToStaticMarkup(createElement(GameHeader,{gameState:{rank:'consort',season:1,systemSupport:80,gifts:20} as any,onCourtClick:()=>{},onProfileClick:()=>{}}));assert.match(html,/button[^>]*aria-label="Open your player profile"/);assert.match(html,/profile-menu-button/);assert.match(html,/>Profile<\/button>/);});

import {reduceCourtRelation,setPlayerGraphFaction,updateCourtNode,PLAYER_NODE} from '../src/lib/courtGraph';
import test,{beforeEach,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {createActor} from 'xstate';
import {gameMachine} from '../src/state-machines/game-machine';
import {processGiftWithMessage} from '../src/lib/checkMessage';
import {promotionHate} from '../src/lib/campaignBalance';
import {isPromotionRival,opposingFactions} from '../src/lib/courtIntrigue';
import {parseCampaignSave,createCampaignPresentation,campaignActorOptions} from '../src/persistence/campaignSave';
const machine=gameMachine.provide({guards:{emperor_encountered:()=>false,shouldOfferEmperorAudience:()=>false}});
beforeEach(t=>{t.mock.method(console,'log',()=>{});Object.defineProperty(globalThis,'alert',{configurable:true,value:()=>{}});});
function start(t:TestContext,role:'prince'|'minister'|'concubine'='prince'){const g=createActor(machine).start();g.send({type:'CHOOSE_CHARACTER',payload:{type:role}});g.send({type:'INITIALIZE_GAME'});t.after(()=>g.stop());return g;}
function loaded(t:TestContext,role:'prince'|'minister'|'concubine',edit:(s:any)=>void){const g=start(t,role),s:any=JSON.parse(JSON.stringify(g.getPersistedSnapshot()));edit(s);const raw:any={format:'harem-empire',version:3,savedAt:new Date().toISOString(),snapshot:s,presentation:createCampaignPresentation(role)};raw.presentation.clock.season=s.context.season;const r=createActor(machine,campaignActorOptions(parseCampaignSave(JSON.stringify(raw)).save)).start();t.after(()=>r.stop());r.send({type:'UPDATE_PALACE_PRESENCE',zone:role==='concubine'?'ladies':'library',names:[]});return r;}
function child(s:any,name:string){return s.children[s.context.characters[name].id].snapshot.context;}
const rebel={ambition:.8,loyalty:.2,fear:.2};
const imperial={ambition:.3,loyalty:.8,fear:.4};
test('office rivalry scope is precise at middle rank; top rank includes all four offices',()=>{
 assert.ok(isPromotionRival('Empress Consort','consort'));assert.ok(isPromotionRival('Consort Hua','consort'));assert.ok(!isPromotionRival('Empress Dowager','consort'));assert.ok(!isPromotionRival('Concubine Mei','consort'));
 assert.ok(isPromotionRival('Prime Minister','minister'));assert.ok(isPromotionRival('Minister Chen','minister'));assert.ok(isPromotionRival('Crown Prince','grand_prince'));assert.ok(!isPromotionRival('Prince Feng','grand_prince'));
 for(const rank of ['empress','prime_minister','crown_prince'])for(const name of ['Empress Consort','Empress Dowager','Prime Minister','Crown Prince'])assert.ok(isPromotionRival(name,rank));
 assert.ok(opposingFactions('Rebel','Imperial'));assert.ok(opposingFactions('Loyalist','Rebel'));assert.ok(!opposingFactions('Independent','Rebel'));assert.ok(!opposingFactions('Loyalist','Imperial'));
});
for(const [role,middle,top,removed] of [['concubine','consort','empress','Empress Consort'],['minister','minister','prime_minister','Prime Minister'],['prince','grand_prince','crown_prince','Crown Prince']] as const)test(`${top}: role-specific rival hate exactly once, same formal faction and pledged exempt, predecessor expelled`,t=>{
 const survivors=['Empress Consort','Empress Dowager','Prime Minister','Crown Prince'].filter(n=>n!==removed),[same,pledged,enemy]=survivors;
 const g=loaded(t,role,s=>{
  Object.assign(s.context,{rank:middle,supportPoints:200,playerPersonality:{...s.context.playerPersonality,influence:.9},factionSystem:{...s.context.factionSystem,playerFaction:'Rebel'},rewardedRanks:[middle]});
  for(const name of Object.keys(s.context.characters)){const c=child(s,name);c.playerFaction='Rebel';}
  Object.assign(child(s,same),{hate:11,personalityVectors:{...child(s,same).personalityVectors,...rebel}});
  Object.assign(child(s,pledged),{hate:0,hasGivenAllegiance:true,hasGivenSupport:true,hasGivenGifts:true,supportLevel:100,factionOverride:'Rebel'});
  Object.assign(child(s,enemy),{hate:11,personalityVectors:{...child(s,enemy).personalityVectors,...imperial,influence:.8}});
 });
 const c=g.getSnapshot().context;assert.equal(c.rank,top);assert.equal(c.characters[removed],undefined);assert.ok(c.expelledCourtiers[removed]);assert.equal(c.characters[same].getSnapshot().context.hate,11);assert.equal(c.characters[pledged].getSnapshot().context.hate,0);assert.equal(c.characters[enemy].getSnapshot().context.hate,11+promotionHate(role));
 g.send({type:'UPDATE_PALACE_PRESENCE',zone:'library',names:[]});assert.equal(c.characters[enemy].getSnapshot().context.hate,11+promotionHate(role));
});
test('negative gift adds intended loss to hate even at support0; spit reaches100; allies block all gains without erasing old hate',t=>{
 const g=start(t),c=g.getSnapshot().context,a=c.characters['Minister Chen'];a.send({type:'ACTIVATE'});
 Object.assign(a.getSnapshot().context.personalityVectors,{...imperial,influence:.6,suspicion:0});
 const result=processGiftWithMessage('ambitious',a.getSnapshot().context.personalityVectors,a.getSnapshot().context.relationshipVectors,'prince',c.playerPersonality,0);
 a.send({type:'APPLY_EVALUATED_GIFT',requestId:'bad-at-zero',sessionId:c.giftSessionId,messageType:'ambitious',result});assert.equal(a.getSnapshot().context.supportLevel,0);assert.equal(a.getSnapshot().context.hate,12);
 a.send({type:'SPIT_IN_FACE'});assert.equal(a.getSnapshot().context.hate,100);
 a.send({type:'SET_PLAYER_FACTION',faction:'Imperial'});a.send({type:'GAIN_HATE',amount:30});assert.equal(a.getSnapshot().context.hate,100);
 const b=c.characters['Prime Minister'];b.send({type:'ACTIVATE'});Object.assign(b.getSnapshot().context,{hate:17});Object.assign(b.getSnapshot().context.personalityVectors,{...imperial,influence:.8});g.getSnapshot().context.relationshipGraph=reduceCourtRelation(updateCourtNode(setPlayerGraphFaction(g.getSnapshot().context.relationshipGraph!,'Imperial'),'Prime Minister',{faction:'Imperial'}),'Prime Minister',PLAYER_NODE,{kind:'hate',amount:17},1).graph;g.getSnapshot().context.relationshipGraph!.edges['Prime Minister'][PLAYER_NODE].hate=17;b.send({type:'SET_PLAYER_FACTION',faction:'Imperial'});b.send({type:'SPIT_IN_FACE'});b.send({type:'GAIN_HATE',amount:30});assert.equal(b.getSnapshot().context.hate,17,'formal faction immunity prevents gains but is not a hate reset');
 g.getSnapshot().context.relationshipGraph=setPlayerGraphFaction(g.getSnapshot().context.relationshipGraph!,null);b.send({type:'SET_PLAYER_FACTION',faction:null});b.send({type:'GAIN_HATE',amount:30});assert.equal(b.getSnapshot().context.hate,47);
});
test('post-promotion influence hate uses lifetime high water, excludes promotion bonus, and survives save reload',t=>{
 const g=loaded(t,'concubine',s=>{Object.assign(s.context,{supportPoints:80,playerPersonality:{...s.context.playerPersonality,influence:.3}});});
 const c=g.getSnapshot().context,empress=c.characters['Empress Consort'],dowager=c.characters['Empress Dowager'];assert.equal(c.rank,'consort');assert.ok(Math.abs(c.rivalInfluenceHighWater!-.33)<1e-9);assert.equal(empress.getSnapshot().context.hate,40);assert.equal(dowager.getSnapshot().context.hate,0);
 const advance=(influence:number)=>{g.getSnapshot().context.playerPersonality.influence=influence;g.send({type:'UPDATE_PALACE_PRESENCE',zone:'ladies',names:[]});};
 advance(.429);assert.equal(dowager.getSnapshot().context.hate,0);advance(.43);assert.equal(dowager.getSnapshot().context.hate,5);advance(.4);advance(.43);assert.equal(dowager.getSnapshot().context.hate,5);advance(.53);assert.equal(dowager.getSnapshot().context.hate,10);
 const raw={format:'harem-empire',version:3,savedAt:new Date().toISOString(),snapshot:g.getPersistedSnapshot(),presentation:createCampaignPresentation('concubine')};const save=parseCampaignSave(JSON.stringify(raw)).save;const restored=createActor(machine,campaignActorOptions(save)).start();t.after(()=>restored.stop());restored.send({type:'UPDATE_PALACE_PRESENCE',zone:'ladies',names:[]});assert.equal(restored.getSnapshot().context.characters['Empress Dowager'].getSnapshot().context.hate,10);
});

test('a completed top-rank season adds5 outside-faction hate once, while reload and pending tribute do not',t=>{
 const base=start(t,'prince'),snapshot:any=JSON.parse(JSON.stringify(base.getPersistedSnapshot()));Object.assign(snapshot.context,{rank:'crown_prince',giftsRemaining:100,supportPoints:0,season:2,rankEnteredSeason:1});
 const encounterMachine=machine.provide({guards:{emperor_encountered:()=>true}}),g=createActor(encounterMachine,{snapshot}).start();t.after(()=>g.stop());const enemy=g.getSnapshot().context.characters['Minister Chen'];const before=enemy.getSnapshot().context.hate;
 g.send({type:'NEXT_SEASON'});assert.ok(g.getSnapshot().matches({playing:'emperor_encounter'}));assert.equal(enemy.getSnapshot().context.hate,before);
 g.send({type:'GIVE_EMPEROR_GIFT',giftsRemaining:999});assert.equal(g.getSnapshot().context.season,3);assert.equal(enemy.getSnapshot().context.hate,before+5);
 g.send({type:'GIVE_EMPEROR_GIFT',giftsRemaining:999});assert.equal(enemy.getSnapshot().context.hate,before+5);
 const raw:any={format:'harem-empire',version:3,savedAt:new Date().toISOString(),snapshot:g.getPersistedSnapshot(),presentation:createCampaignPresentation('prince')};raw.presentation.clock.season=3;
 const save=parseCampaignSave(JSON.stringify(raw)).save,r=createActor(machine,campaignActorOptions(save)).start();t.after(()=>r.stop());assert.equal(r.getSnapshot().context.characters['Minister Chen'].getSnapshot().context.hate,before+5);
});

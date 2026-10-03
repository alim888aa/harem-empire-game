import test,{beforeEach,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {createActor,waitFor} from 'xstate';
import {createCourtGraph,courtRelation,reduceCourtRelation,setPlayerGraphFaction,updateCourtNode,assertCourtGraph,mayPledge,graphPledgedTo,graphTies,PLAYER_NODE,EMPEROR_NODE} from '../src/lib/courtGraph';
import {createInitialCharacters} from '../src/data/characters';
import {gameMachine} from '../src/state-machines/game-machine';
import {parseCampaignSave,captureCampaign,createCampaignPresentation,campaignActorOptions,SAVE_VERSION} from '../src/persistence/campaignSave';
beforeEach(t=>{t.mock.method(console,'log',()=>{});t.mock.method(Math,'random',()=>.42);Object.defineProperty(globalThis,'alert',{configurable:true,value:()=>{}});});
const people=()=>createInitialCharacters(()=>.42);
const seedGraph=()=>createCourtGraph(people(),0x123456);
function start(t:TestContext){const g=createActor(gameMachine.provide({guards:{emperor_encountered:()=>false}})).start();g.send({type:'CHOOSE_CHARACTER',payload:{type:'prince'}});g.send({type:'INITIALIZE_GAME'});t.after(()=>g.stop());return g;}
function assertProjection(g:ReturnType<typeof start>){const c=g.getSnapshot().context;for(const [name,a] of Object.entries(c.characters)){const p=a.getSnapshot().context,e=courtRelation(c.relationshipGraph!,name,PLAYER_NODE);assert.equal(p.supportLevel,e.support,name);assert.equal(p.hate,e.hate,name);assert.equal(p.hasGivenAllegiance,!!e.pledge,name);assert.equal(p.graphCommandSerial,p.graphProjectionSerial,name);assert.equal(p.graphCommandSerial,c.graphAppliedCommands?.[name]??0,name);}}
test('50 stable nodes include player and special Emperor; seeded NPC ties are sparse, directional, reproducible and never player feelings',()=>{
 const a=seedGraph(),b=seedGraph();assert.deepEqual(a,b);assert.equal(Object.keys(a.nodes).length,50);assert.equal(a.nodes[EMPEROR_NODE].kind,'emperor');assert.equal(graphTies(a,PLAYER_NODE).length,0);
 assertCourtGraph(a,Object.keys(a.nodes),1);let asymmetry=false,strongFriends=0,strongRivals=0;
 for(const id of Object.keys(a.nodes)){const ties=graphTies(a,id).filter(e=>e.to!==PLAYER_NODE);assert.ok(ties.length<=4);for(const tie of ties){if(JSON.stringify(courtRelation(a,tie.to,id))!==JSON.stringify(courtRelation(a,id,tie.to)))asymmetry=true;if(tie.support>=60)strongFriends++;if(tie.hate>=40)strongRivals++;if(a.nodes[id].faction===a.nodes[tie.to].faction&&a.nodes[id].faction!=='Independent')assert.equal(tie.hate,0);}}
 assert.ok(asymmetry);assert.ok(strongFriends>0);assert.ok(strongRivals>0);assert.deepEqual(courtRelation(a,PLAYER_NODE,'Maid Ling'),{support:0,hate:0,pledge:null,affection:0,romance:null});
});
test('typed reducer separates support from hate and keeps a durable one-beneficiary pledge without self edges or cycles',()=>{
 let g=seedGraph();g=reduceCourtRelation(g,'Maid Ling',PLAYER_NODE,{kind:'support',amount:100,formPledge:true},2).graph;assert.equal(courtRelation(g,'Maid Ling',PLAYER_NODE).pledge?.formedSeason,2);
 g=reduceCourtRelation(g,'Maid Ling',PLAYER_NODE,{kind:'support',amount:-100,formPledge:false},2).graph;assert.equal(courtRelation(g,'Maid Ling',PLAYER_NODE).support,0);assert.ok(courtRelation(g,'Maid Ling',PLAYER_NODE).pledge);assert.equal(mayPledge(g,'Maid Ling','Maid Su'),false);assert.equal(mayPledge(g,PLAYER_NODE,'Maid Ling'),false);
 assert.throws(()=>reduceCourtRelation(g,'Maid Ling','Maid Ling',{kind:'pledge'},2));assert.throws(()=>reduceCourtRelation(g,'Maid Ling','Maid Su',{kind:'pledge'},2));assert.throws(()=>reduceCourtRelation(g,PLAYER_NODE,'Maid Ling',{kind:'pledge'},2));
 assert.deepEqual(graphPledgedTo(g,PLAYER_NODE),['Maid Ling']);assertCourtGraph(g,Object.keys(g.nodes),2);
});
test('same formal faction and pledged immunity block all hate commands, not existing hate history',()=>{
 let g=updateCourtNode(seedGraph(),'Maid Ling',{faction:'Loyalist'});g=reduceCourtRelation(g,'Maid Ling',PLAYER_NODE,{kind:'hate',amount:17},1).graph;g=setPlayerGraphFaction(g,'Loyalist');
 for(const command of [{kind:'hate',amount:30},{kind:'spit'},{kind:'gift',support:0,negativeDelta:-12,formPledge:true}] as const)g=reduceCourtRelation(g,'Maid Ling',PLAYER_NODE,command,1).graph;
 assert.equal(courtRelation(g,'Maid Ling',PLAYER_NODE).hate,17);g=setPlayerGraphFaction(g,null);g=reduceCourtRelation(g,'Maid Ling',PLAYER_NODE,{kind:'gift',support:0,negativeDelta:-12,formPledge:true},1).graph;assert.equal(courtRelation(g,'Maid Ling',PLAYER_NODE).hate,29);
});
test('all actor relationship commands project canonical graph immediately and do not alter NPC-pair ties or replay rewards',async t=>{
 const g=start(t),c=g.getSnapshot().context,name=c.activeCharacterNames.find(n=>n.startsWith('Maid')||n.startsWith('Eunuch'))!,a=c.characters[name];assert.ok(a);assertProjection(g);
 const beforeNpcTies=JSON.stringify(graphTies(c.relationshipGraph!,name).filter(e=>e.to!==PLAYER_NODE));
 g.send({type:'GIVE_GIFT_WITH_MESSAGE',characterId:name,messageType:'neutral',requestId:'graph-live-gift'});await waitFor(g,s=>!s.context.pendingGift);assertProjection(g);
 for(const event of [{type:'GAIN_HATE',amount:7},{type:'APPLY_FACTION_BONUS',supportBonus:30},{type:'WITHDRAW_BACKING'},{type:'SPIT_IN_FACE'},{type:'APPLY_FACTION_PENALTY',supportPenalty:3,suspicionPenalty:.01}] as const){a.send(event);assertProjection(g);}
 assert.equal(JSON.stringify(graphTies(g.getSnapshot().context.relationshipGraph!,name).filter(e=>e.to!==PLAYER_NODE)),beforeNpcTies);
 a.send({type:'APPLY_FACTION_BONUS',supportBonus:100});assertProjection(g);assert.ok(courtRelation(g.getSnapshot().context.relationshipGraph!,name,PLAYER_NODE).pledge);const points=g.getSnapshot().context.supportPoints;
 a.send({type:'APPLY_FACTION_BONUS',supportBonus:1});assertProjection(g);assert.equal(g.getSnapshot().context.supportPoints,points);
 const save=captureCampaign(g,createCampaignPresentation('prince'))!;assert.ok(save);const restored=createActor(gameMachine,campaignActorOptions(save)).start();t.after(()=>restored.stop());assertProjection(restored);assert.equal(restored.getSnapshot().context.supportPoints,points);
});
test('schema3 migration preserves exact incoming values/RNG/ledgers, while schema4 is canonical and rejects drift',t=>{
 const g=start(t),s:any=JSON.parse(JSON.stringify(g.getPersistedSnapshot()));delete s.context.relationshipGraph;delete s.context.graphAppliedCommands;
 for(const ref of Object.values(s.context.characters) as any[]){const c=s.children[ref.id].snapshot.context;delete c.graphCommandSerial;delete c.graphProjectionSerial;}
 const id=s.context.characters['Maid Ling'].id,p=s.children[id].snapshot.context;p.supportLevel=42.73;p.hate=18.5;
 const raw={format:'harem-empire',version:3,savedAt:new Date().toISOString(),snapshot:s,presentation:createCampaignPresentation('prince')};const first=parseCampaignSave(JSON.stringify(raw));assert.equal(first.save.version,SAVE_VERSION);assert.equal(SAVE_VERSION,7);
 const c:any=first.save.snapshot.context;assert.equal(c.rngState,s.context.rngState);assert.deepEqual(c.standingAwards,s.context.standingAwards);assert.equal(c.supportPoints,s.context.supportPoints);assert.equal(courtRelation(c.relationshipGraph,'Maid Ling',PLAYER_NODE).support,42.73);assert.equal(courtRelation(c.relationshipGraph,'Maid Ling',PLAYER_NODE).hate,18.5);
 const again=parseCampaignSave(JSON.stringify(first.save));assert.equal(again.migrated,false);assert.deepEqual(again.save,first.save);
 const bad:any=structuredClone(first.save);bad.snapshot.children[id].snapshot.context.hate=19;assert.throws(()=>parseCampaignSave(JSON.stringify(bad)),/projection mismatch/);delete bad.snapshot.context.relationshipGraph;assert.throws(()=>parseCampaignSave(JSON.stringify(bad)),/court graph/);
 const graphBefore=JSON.stringify(c.relationshipGraph);graphTies(c.relationshipGraph,'Maid Ling');graphPledgedTo(c.relationshipGraph,PLAYER_NODE);assert.equal(JSON.stringify(c.relationshipGraph),graphBefore);
});

test('legacy inactive100 support remains unpledged during migration, then activation commits pledge before suspicion/report/rewards',t=>{
 const g=start(t),s:any=JSON.parse(JSON.stringify(g.getPersistedSnapshot())),name='Empress Dowager',id=s.context.characters[name].id,p=s.children[id].snapshot.context;
 Object.assign(p,{supportLevel:100,hasGivenAllegiance:false,hasGivenSupport:false,hasGivenGifts:false,suspicion:1});s.children[id].snapshot.value='inactive';s.context.activeCharacterNames=s.context.activeCharacterNames.filter((n:string)=>n!==name);s.context.presentCharacterNames=[];
 const raw={format:'harem-empire',version:3,savedAt:new Date().toISOString(),snapshot:s,presentation:createCampaignPresentation('prince')};const save=parseCampaignSave(JSON.stringify(raw)).save;assert.equal(courtRelation(save.snapshot.context.relationshipGraph!,name,PLAYER_NODE).pledge,null);assert.equal(save.snapshot.context.supportPoints,s.context.supportPoints);
 const r=createActor(gameMachine,campaignActorOptions(save)).start();t.after(()=>r.stop());r.getSnapshot().context.characters[name].send({type:'ACTIVATE'});assertProjection(r);
 assert.ok(courtRelation(r.getSnapshot().context.relationshipGraph!,name,PLAYER_NODE).pledge);assert.equal(r.getSnapshot().context.characters[name].getSnapshot().context.suspicion,0);assert.ok(!r.getSnapshot().context.suspiciousCharacters.includes(name));assert.equal(r.getSnapshot().context.supportPoints,s.context.supportPoints+100);
});
test('inactive faction support defers pledge until activation as before, without dual actor writers',t=>{
 const g=start(t),a=g.getSnapshot().context.characters['Maid Ling'];a.send({type:'DEACTIVATE'});a.send({type:'APPLY_FACTION_BONUS',supportBonus:100});assertProjection(g);assert.equal(a.getSnapshot().context.hasGivenAllegiance,false);a.send({type:'ACTIVATE'});assertProjection(g);assert.equal(a.getSnapshot().context.hasGivenAllegiance,true);
});
test('v4 rejects actor/graph faction drift and invalid special nodes',t=>{
 const g=start(t),save:any=captureCampaign(g,createCampaignPresentation('prince'));assert.ok(save);const before=structuredClone(save);
 save.snapshot.context.relationshipGraph.nodes['Maid Ling'].faction='Rebel';assert.throws(()=>parseCampaignSave(JSON.stringify(save)),/courtier faction mismatch/);
 const bad=structuredClone(before);bad.snapshot.context.relationshipGraph.nodes[EMPEROR_NODE].status='expelled';assert.throws(()=>parseCampaignSave(JSON.stringify(bad)),/special graph node/);
});

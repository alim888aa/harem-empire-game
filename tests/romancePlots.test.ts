import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {createActor} from 'xstate';
import {gameMachine} from '../src/state-machines/game-machine';
import {captureCampaign,campaignActorOptions,createCampaignPresentation,parseCampaignSave,type CampaignActor} from '../src/persistence/campaignSave';
import {assignCharacterFaction,type FactionType} from '../src/lib/factionSystem';
import {campaignRandom} from '../src/lib/campaignRandom';
import {ROMANCE_PROFILES} from '../src/data/romanceProfiles';
import {createCourtGraph,courtRelation,graphPledgedTo,PLAYER_NODE,reduceCourtRelation,setRomancePair,updateCourtNode,type CourtGraph} from '../src/lib/courtGraph';
import {canPlot,canContinuePlot,cancelDefusedPlots,courtPlotKey,defusedPlotNames,emptyCourtPlots,resolveCourtSeason,weightedVictim,type PlotSituation} from '../src/lib/courtPlots';

const ATTACKER='Concubine Mei',SECOND_ATTACKER='Eunuch Gao',TARGET='Scholar Qin',SECOND_TARGET='Maid Lan',LOVER='Maid Ling';
const PROTECTORS=['Maid Su','Maid Bai'] as const;
const NAMES=[ATTACKER,SECOND_ATTACKER,TARGET,SECOND_TARGET,LOVER,...PROTECTORS,'Empress Dowager'];
const key=courtPlotKey(ATTACKER,TARGET);
function pair(graph:CourtGraph,a:string,b:string){return setRomancePair(graph,a,b,true,1);}
function jealous(graph:CourtGraph,a:string,b:string){return reduceCourtRelation(graph,a,b,{kind:'jealousy',amount:100},1).graph;}
function setup(protectors=0):PlotSituation {
 let graph=createCourtGraph(NAMES.map(name=>({name,formalFaction:'Independent' as const})),543);
 graph=pair(pair(graph,ATTACKER,LOVER),TARGET,LOVER);
 for(const name of PROTECTORS.slice(0,protectors))graph=reduceCourtRelation(graph,name,TARGET,{kind:'pledge'},1).graph;
 graph=jealous(graph,ATTACKER,TARGET);
 return{graph,role:null,rank:null,playerInfluence:.5,influenceByName:{[ATTACKER]:.6,[SECOND_ATTACKER]:.6,[TARGET]:.3,[SECOND_TARGET]:.2,[LOVER]:.1,[PROTECTORS[0]]:.1,[PROTECTORS[1]]:.1,'Empress Dowager':.9}};
}
function warning(s:PlotSituation,seed=71){return resolveCourtSeason(s,emptyCourtPlots(),2,seed);}

test('NPC plots need a mutual shared-lover triangle, 80 hate and strict influence, without a player rank gate',()=>{
 const s=setup();assert.equal(canPlot(s,ATTACKER,TARGET),true);assert.equal(canPlot(s,ATTACKER),false);
 assert.equal(canPlot({...s,influenceByName:{...s.influenceByName,[TARGET]:.6}},ATTACKER,TARGET),false);
 assert.equal(canContinuePlot({...s,influenceByName:{...s.influenceByName,[TARGET]:.6}},ATTACKER,TARGET),true);
 assert.equal(canPlot({...s,influenceByName:{...s.influenceByName,[ATTACKER]:NaN}},ATTACKER,TARGET),false);
 assert.equal(canPlot({...s,influenceByName:{...s.influenceByName,[TARGET]:Infinity}},ATTACKER,TARGET),false);
 let graph=structuredClone(s.graph);graph.edges[ATTACKER][TARGET].hate=79.99;assert.equal(canPlot({...s,graph},ATTACKER,TARGET),false);
 graph.edges[ATTACKER][TARGET].hate=80;assert.equal(canPlot({...s,graph},ATTACKER,TARGET),true);
 graph=setRomancePair(graph,ATTACKER,LOVER,false,1);assert.equal(canPlot({...s,graph},ATTACKER,TARGET),false);
 graph.edges[ATTACKER][LOVER].affection=100;graph.edges[LOVER][ATTACKER].affection=100;assert.equal(canPlot({...s,graph},ATTACKER,TARGET),false);
 graph.edges[ATTACKER][LOVER].romance={formedSeason:1,source:'accepted'};assert.equal(canPlot({...s,graph},ATTACKER,TARGET),false,'One-sided romance metadata is insufficient');
});

test('NPC romantic rivalry bypasses same-faction and player-pledge exemptions but player plots keep them',()=>{
 let s=setup();let graph=updateCourtNode(s.graph,PLAYER_NODE,{faction:'Imperial'});
 for(const id of [ATTACKER,TARGET]){graph=updateCourtNode(graph,id,{faction:'Imperial'});graph=reduceCourtRelation(graph,id,PLAYER_NODE,{kind:'pledge'},1).graph;}
 graph=jealous(graph,ATTACKER,TARGET);s={...s,graph,role:'prince',rank:'grand_prince',playerInfluence:.2};
 assert.equal(courtRelation(graph,ATTACKER,TARGET).hate,100);assert.equal(canPlot(s,ATTACKER,TARGET),true);assert.equal(canPlot(s,ATTACKER),false);
 const out=warning(s);assert.ok(out.plots.pending[key]);assert.equal(out.plots.pending[ATTACKER],undefined);
});

test('either gender-free NPC rival can plot around the player as a shared lover',()=>{
 const s=setup();let graph=setRomancePair(s.graph,ATTACKER,LOVER,false,1);graph=setRomancePair(graph,TARGET,LOVER,false,1);
 graph=pair(pair(graph,ATTACKER,PLAYER_NODE),TARGET,PLAYER_NODE);graph=jealous(graph,TARGET,ATTACKER);
 assert.equal(canPlot({...s,graph},ATTACKER,TARGET),true);
 assert.equal(canPlot({...s,graph,influenceByName:{...s.influenceByName,[TARGET]:.7}},TARGET,ATTACKER),true);
});

test('authored adulthood, non-family and living routes gate both rivals and the shared lover',t=>{
 const s=setup();const original=ROMANCE_PROFILES[ATTACKER];t.after(()=>{ROMANCE_PROFILES[ATTACKER]=original;});
 ROMANCE_PROFILES[ATTACKER]={...original,adult:false};assert.equal(canPlot(s,ATTACKER,TARGET),false);
 ROMANCE_PROFILES[ATTACKER]={...original,familyId:ROMANCE_PROFILES[TARGET].familyId};assert.equal(canPlot(s,ATTACKER,TARGET),false);
 ROMANCE_PROFILES[ATTACKER]=original;
 for(const id of [ATTACKER,TARGET,LOVER])for(const status of ['expelled','deceased'] as const)assert.equal(canPlot({...s,graph:updateCourtNode(s.graph,id,{status})},ATTACKER,TARGET),false);
 const unknown=createCourtGraph([{name:'Unprofiled Adult',formalFaction:'Independent'},{name:TARGET,formalFaction:'Independent'},{name:LOVER,formalFaction:'Independent'}],543);
 let graph=pair(pair(unknown,'Unprofiled Adult',LOVER),TARGET,LOVER);graph=jealous(graph,'Unprofiled Adult',TARGET);
 assert.equal(canPlot({...s,graph,influenceByName:{...s.influenceByName,'Unprofiled Adult':.7}},'Unprofiled Adult',TARGET),false);
 graph=pair(pair(s.graph,ATTACKER,'Empress Dowager'),TARGET,'Empress Dowager');graph=setRomancePair(graph,TARGET,LOVER,false,1);
 assert.equal(canPlot({...s,graph},ATTACKER,TARGET),false,'Deferred senior routes cannot supply motive');
 assert.equal(canPlot(s,'Emperor',TARGET),false);assert.equal(canPlot(s,ATTACKER,'Emperor'),false);
});

test('player and multiple NPC plots retain separate keys and player output keeps the legacy shape',()=>{
 let s=setup();let graph=pair(s.graph,SECOND_TARGET,LOVER);graph=jealous(graph,ATTACKER,SECOND_TARGET);graph=reduceCourtRelation(graph,ATTACKER,PLAYER_NODE,{kind:'hate',amount:100},1).graph;
 s={...s,graph,role:'prince',rank:'grand_prince',playerInfluence:.2};const out=warning(s);
 assert.equal(courtPlotKey(ATTACKER),ATTACKER);assert.equal(courtPlotKey(ATTACKER,PLAYER_NODE),ATTACKER);
 assert.deepEqual(Object.keys(out.plots.pending).sort(),[ATTACKER,key,courtPlotKey(ATTACKER,SECOND_TARGET)].sort());
 assert.deepEqual(out.plots.pending[ATTACKER],{attacker:ATTACKER,warnedSeason:2,dueSeason:3});
 assert.deepEqual(out.plots.pending[key],{attacker:ATTACKER,target:TARGET,warnedSeason:2,dueSeason:3});
 const event=out.plots.events.find(event=>event.attacker===ATTACKER&&event.target===undefined);assert.ok(event);assert.equal('target' in event,false);
 assert.equal(out.casualties.length,0);assert.equal(out.rngState,71);
});

test('an NPC warning grants a full season, burns living direct protectors continuously, then kills the target permanently',()=>{
 const s=setup(2);let out=warning(s);assert.equal(out.casualties.length,0);assert.equal(out.plots.pending[key].dueSeason,3);
 for(const season of [3,4]){
  out=resolveCourtSeason({...s,graph:out.graph},out.plots,season,out.rngState);assert.equal(out.casualties.length,1);assert.ok(PROTECTORS.includes(out.casualties[0].name as any));assert.equal(out.graph.nodes[TARGET].status,'living');assert.equal(out.playerDeath,null);assert.equal(out.plots.pending[key].warnedSeason,2);assert.equal(out.plots.pending[key].dueSeason,season+1);
  assert.equal(out.plots.events.filter(event=>event.kind==='warning'&&event.target===TARGET).length,1);
 }
 assert.equal(graphPledgedTo(out.graph,TARGET).length,0);const beforeRng=out.rngState;
 out=resolveCourtSeason({...s,graph:out.graph},out.plots,5,out.rngState);assert.equal(out.casualties[0].name,TARGET);assert.ok(out.casualties[0].deathMethod);assert.equal(out.rngState,beforeRng);assert.equal(out.playerDeath,null);assert.equal(out.graph.nodes[TARGET].status,'deceased');assert.equal(out.graph.nodes[PLAYER_NODE].status,'living');assert.equal(out.plots.pending[key],undefined);
 const future=resolveCourtSeason({...s,graph:out.graph},out.plots,6,out.rngState);assert.equal(future.casualties.length,0);assert.equal(future.graph.nodes[TARGET].status,'deceased');
});

test('direct shields exclude attacker, player and Emperor; transitive pledges do not protect the target',()=>{
 const s=setup();let graph=s.graph;for(const id of [ATTACKER,PLAYER_NODE,'Emperor'])graph=reduceCourtRelation(graph,id,TARGET,{kind:'pledge'},1).graph;graph=jealous(graph,ATTACKER,TARGET);
 let out=warning({...s,graph});out=resolveCourtSeason({...s,graph},out.plots,3,out.rngState);assert.deepEqual(out.casualties.map(c=>c.name),[TARGET]);for(const id of [ATTACKER,PLAYER_NODE,'Emperor'])assert.equal(out.graph.nodes[id].status,'living');
 graph=reduceCourtRelation(s.graph,PROTECTORS[0],TARGET,{kind:'pledge'},1).graph;graph=reduceCourtRelation(graph,PROTECTORS[1],PROTECTORS[0],{kind:'pledge'},1).graph;
 out=warning({...s,graph});out=resolveCourtSeason({...s,graph},out.plots,3,out.rngState);assert.deepEqual(out.casualties.map(c=>c.name),[PROTECTORS[0]]);
 out=resolveCourtSeason({...s,graph:out.graph},out.plots,4,out.rngState);assert.deepEqual(out.casualties.map(c=>c.name),[TARGET]);assert.equal(out.graph.nodes[PROTECTORS[1]].status,'living');
});

test('protector sacrifice retains existing deterministic outgoing relationship weighting',()=>{
 const s=setup(2);const warn=warning(s,905),random=campaignRandom(warn.rngState),expected=weightedVictim(s.graph,ATTACKER,PROTECTORS,2,random.next());
 const out=resolveCourtSeason(s,warn.plots,3,warn.rngState);
 assert.equal(out.casualties[0].name,expected);assert.equal(out.rngState,random.state);
 assert.notEqual(out.rngState,warn.rngState);assert.equal(out.plots.events.find(event=>event.kind==='casualty')?.target,TARGET);
 const saved=JSON.parse(JSON.stringify(warn));assert.deepEqual(out,resolveCourtSeason({...s,graph:saved.graph},saved.plots,3,saved.rngState));
});

test('same-target attempts revalidate sequentially and can never kill a target or protector twice',()=>{
 let s=setup(1);let graph=pair(s.graph,SECOND_ATTACKER,LOVER);graph=jealous(graph,SECOND_ATTACKER,TARGET);s={...s,graph};let out=warning(s);
 assert.equal(Object.keys(out.plots.pending).length,2);out=resolveCourtSeason(s,out.plots,3,out.rngState);
 assert.deepEqual(out.casualties.map(c=>c.name),[PROTECTORS[0],TARGET]);assert.equal(new Set(out.casualties.map(c=>c.name)).size,2);assert.deepEqual(out.plots.pending,{});
 s=setup();graph=pair(s.graph,SECOND_ATTACKER,LOVER);graph=jealous(graph,SECOND_ATTACKER,TARGET);s={...s,graph};out=warning(s);out=resolveCourtSeason(s,out.plots,3,out.rngState);
 assert.deepEqual(out.casualties.map(c=>c.name),[TARGET]);assert.ok(out.plots.events.some(event=>event.kind==='defused'&&event.attacker===SECOND_ATTACKER&&event.target===TARGET));assert.equal(out.playerDeath,null);
});

test('a killed attacker or shared lover immediately defuses pending NPC threats',()=>{
 let s=setup(1);let graph=pair(pair(s.graph,SECOND_ATTACKER,SECOND_TARGET),ATTACKER,SECOND_TARGET);graph=jealous(graph,SECOND_ATTACKER,ATTACKER);
 // Attacker sorts before Eunuch Gao and first kills its target's shield, then
 // dies in the second plot. Its already-rescheduled threat must be removed.
 s={...s,graph,influenceByName:{...s.influenceByName,[SECOND_ATTACKER]:.7}};let out=warning(s);out=resolveCourtSeason(s,out.plots,3,out.rngState);
 assert.deepEqual(out.casualties.map(c=>c.name),[PROTECTORS[0],ATTACKER]);assert.equal(out.plots.pending[key],undefined);assert.ok(out.plots.events.some(event=>event.kind==='defused'&&event.attacker===ATTACKER&&event.target===TARGET));
 s=setup();graph=reduceCourtRelation(s.graph,LOVER,TARGET,{kind:'pledge'},1).graph;out=warning({...s,graph});out=resolveCourtSeason({...s,graph},out.plots,3,out.rngState);
 assert.deepEqual(out.casualties.map(c=>c.name),[LOVER]);assert.equal(out.graph.nodes[TARGET].status,'living');assert.equal(out.plots.pending[key],undefined);assert.equal(out.rngState!==71,true);
});

test('breakup or strictly out-influencing defuses by pending key without RNG; equality remains unsafe',()=>{
 const s=setup(),warn=warning(s),equal={...s,influenceByName:{...s.influenceByName,[TARGET]:.6}};
 assert.deepEqual(defusedPlotNames(equal,warn.plots),[]);assert.equal(cancelDefusedPlots(equal,warn.plots,2),warn.plots);
 for(const safe of [{...s,influenceByName:{...s.influenceByName,[TARGET]:.60000001}},{...s,graph:setRomancePair(s.graph,TARGET,LOVER,false,2)}]){
  assert.deepEqual(defusedPlotNames(safe,warn.plots),[key]);const canceled=cancelDefusedPlots(safe,warn.plots,2);assert.deepEqual(canceled.pending,{});assert.equal(canceled.events.at(-1)?.attacker,ATTACKER);assert.equal(canceled.events.at(-1)?.target,TARGET);
  const out=resolveCourtSeason(safe,canceled,3,warn.rngState);assert.equal(out.casualties.length,0);assert.equal(out.rngState,warn.rngState);
  const fresh=resolveCourtSeason(s,out.plots,4,out.rngState);assert.equal(fresh.casualties.length,0);assert.equal(fresh.plots.pending[key].dueSeason,5);
 }
});

test('legacy target-less player plots and explicit @player remain compatible and idempotent',()=>{
 const s=setup();let graph=reduceCourtRelation(s.graph,ATTACKER,PLAYER_NODE,{kind:'hate',amount:100},1).graph;
 graph=reduceCourtRelation(graph,PROTECTORS[0],PLAYER_NODE,{kind:'pledge'},1).graph;
 const situation={...s,graph,role:'prince',rank:'grand_prince'},plots=emptyCourtPlots(2);plots.pending[ATTACKER]={attacker:ATTACKER,warnedSeason:2,dueSeason:3};
 const legacy=resolveCourtSeason(situation,plots,3,903);const explicit=structuredClone(plots);explicit.pending[ATTACKER].target=PLAYER_NODE;
 const out=resolveCourtSeason(situation,explicit,3,903);assert.deepEqual(out.casualties,legacy.casualties);assert.equal(out.rngState,legacy.rngState);
 for(const event of out.plots.events)if(event.target===undefined)assert.equal('target' in event,false);
 const repeated=resolveCourtSeason({...situation,graph:out.graph},out.plots,3,out.rngState);assert.deepEqual(repeated.casualties,[]);assert.equal(repeated.plots,out.plots);assert.equal(repeated.rngState,out.rngState);
});


const liveMachine=gameMachine.provide({guards:{emperor_encountered:()=>false,shouldOfferEmperorAudience:()=>false}});
function liveActor(t:TestContext,save?:any){
 const actor:CampaignActor=createActor(liveMachine,save?campaignActorOptions(save):undefined);const errors:unknown[]=[];
 actor.subscribe({error:error=>errors.push(error)});actor.start();t.after(()=>{actor.stop();assert.deepEqual(errors,[],'No live actor errors');});return actor;
}
function liveSave(actor:CampaignActor){const save=captureCampaign(actor,createCampaignPresentation('prince'));assert.ok(save,'NPC intrigue must remain a valid save checkpoint');return save;}
function liveSeason(actor:CampaignActor,season:number){actor.send({type:'NEXT_SEASON'});assert.equal(actor.getSnapshot().context.season,season);assert.equal(actor.getSnapshot().context.seasonSettlementPending,false);}

test('the real season pipeline permanently stops NPC protectors and rivals, preserves player survival, and reloads exactly',t=>{
 t.mock.method(console,'log',()=>{});t.mock.method(console,'warn',()=>{});t.mock.method(Math,'random',()=>.424242);
 Object.defineProperty(globalThis,'alert',{configurable:true,value:()=>{}});
 const fresh=liveActor(t);fresh.send({type:'CHOOSE_CHARACTER',payload:{type:'prince'}});fresh.send({type:'INITIALIZE_GAME'});
 const save:any=JSON.parse(JSON.stringify(liveSave(fresh))),c=save.snapshot.context;
 Object.assign(c,{rank:'grand_prince',supportPoints:0,rivalInfluenceHighWater:.5,rivalInfluenceGain:0,promotionRivals:[],currentZone:'library',presentCharacterNames:[],presenceReady:true});c.playerPersonality.influence=.5;
 c.relationshipGraph=updateCourtNode(c.relationshipGraph,PLAYER_NODE,{office:'grand_prince'});
 c.relationshipGraph=jealous(pair(pair(c.relationshipGraph,ATTACKER,LOVER),TARGET,LOVER),ATTACKER,TARGET);
 c.relationshipGraph=reduceCourtRelation(c.relationshipGraph,PROTECTORS[0],TARGET,{kind:'pledge'},1).graph;
 const factions:Record<FactionType,string[]>={Rebel:[],Imperial:[],Loyalist:[],Independent:[]};
 for(const name of Object.keys(c.characters)){
  const person=save.snapshot.children[c.characters[name].id].snapshot.context;
  if(name===ATTACKER)person.personalityVectors.influence=.4;if(name===TARGET)person.personalityVectors.influence=.2;
  const faction=assignCharacterFaction(person);c.relationshipGraph=updateCourtNode(c.relationshipGraph,name,{faction});factions[faction].push(name);
 }
 c.factionSystem.factions=factions;const game=liveActor(t,parseCampaignSave(JSON.stringify(save)).save),shield=game.getSnapshot().context.characters[PROTECTORS[0]];
 liveSeason(game,2);assert.deepEqual(game.getSnapshot().context.courtPlots?.pending[key],{attacker:ATTACKER,target:TARGET,warnedSeason:2,dueSeason:3});assert.equal(Object.keys(game.getSnapshot().context.deceasedCourtiers??{}).length,0);
 const warned=liveSave(game),resumed=liveActor(t,parseCampaignSave(JSON.stringify(warned)).save);
 liveSeason(game,3);liveSeason(resumed,3);assert.deepEqual(resumed.getPersistedSnapshot(),game.getPersistedSnapshot());
 let current=game.getSnapshot().context;assert.equal(current.deceasedCourtiers?.[PROTECTORS[0]].attacker,ATTACKER);assert.equal(current.relationshipGraph?.nodes[PROTECTORS[0]].status,'deceased');assert.equal(current.characters[PROTECTORS[0]],undefined);assert.equal(shield.getSnapshot().status,'stopped');assert.equal(current.assassinationDeath,null);
 for(const names of [current.activeCharacterNames,current.presentCharacterNames,current.suspiciousCharacters,...Object.values(current.factionSystem.factions)])assert.equal(names.includes(PROTECTORS[0]),false);
 const targetActor=current.characters[TARGET],before=JSON.stringify(game.getPersistedSnapshot());shield.send({type:'ACTIVATE'});game.send({type:'CHARACTER_GAVE_GIFTS',name:PROTECTORS[0],characterType:'minor'});assert.equal(JSON.stringify(game.getPersistedSnapshot()),before);
 liveSeason(game,4);current=game.getSnapshot().context;assert.equal(current.relationshipGraph?.nodes[TARGET].status,'deceased');assert.equal(current.characters[TARGET],undefined);assert.equal(targetActor.getSnapshot().status,'stopped');assert.equal(current.assassinationDeath,null);assert.equal(current.relationshipGraph?.nodes[PLAYER_NODE].status,'living');assert.equal(current.courtPlots?.pending[key],undefined);
 const deadSave=liveSave(game),restored=liveActor(t,parseCampaignSave(JSON.stringify(deadSave)).save);assert.deepEqual(restored.getPersistedSnapshot(),game.getPersistedSnapshot());liveSeason(restored,5);assert.equal(restored.getSnapshot().context.characters[TARGET],undefined);assert.equal(restored.getSnapshot().context.characters[PROTECTORS[0]],undefined);
});

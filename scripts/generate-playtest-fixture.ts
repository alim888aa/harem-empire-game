/** Fictional QA save, generated offline and loaded only by an explicit opt-in UI. */
import {writeFileSync,mkdirSync} from 'node:fs';import {createActor} from 'xstate';import {gameMachine} from '../src/state-machines/game-machine';import {captureCampaign,createCampaignPresentation,parseCampaignSave} from '../src/persistence/campaignSave';import {courtRelation,PLAYER_NODE,reduceCourtRelation,updateCourtNode} from '../src/lib/courtGraph';import {assignCharacterFaction} from '../src/lib/factionSystem';
Math.random=()=>.424242;const game=createActor(gameMachine).start();game.send({type:'CHOOSE_CHARACTER',payload:{type:'prince'}});game.send({type:'INITIALIZE_GAME'});
const save:any=JSON.parse(JSON.stringify(captureCampaign(game,createCampaignPresentation('prince'))));game.stop();save.savedAt='2026-10-01T00:00:00.000Z';const c=save.snapshot.context;c.rank='grand_prince';c.playerPersonality.influence=.5;c.rivalInfluenceHighWater=.5;c.rivalInfluenceGain=0;c.promotionRivals=[];c.supportPoints=0;c.giftsRemaining=100;c.playerReputation.perceivedLoyalty=.95;c.currentZone='library';c.presentCharacterNames=[];c.presenceReady=true;c.relationshipGraph=updateCourtNode(c.relationshipGraph,PLAYER_NODE,{office:'grand_prince'});
const person=(name:string)=>save.snapshot.children[c.characters[name].id].snapshot.context;
const enemy=person('General Zhao');enemy.personalityVectors={...enemy.personalityVectors,influence:.7,ambition:.4,loyalty:.4,fear:.2};c.relationshipGraph=reduceCourtRelation(c.relationshipGraph,'General Zhao',PLAYER_NODE,{kind:'hate',amount:100},1).graph;
c.relationshipGraph=reduceCourtRelation(c.relationshipGraph,'Maid Ling',PLAYER_NODE,{kind:'pledge'},1).graph;Object.assign(person('Maid Ling'),{hasGivenSupport:true,hasGivenGifts:true});save.snapshot.children[c.characters['Maid Ling'].id].snapshot.value='inactive';c.activeCharacterNames=c.activeCharacterNames.filter((n:string)=>n!=='Maid Ling');
c.factionSystem.factions={Rebel:[],Imperial:[],Loyalist:[],Independent:[]};for(const name of Object.keys(c.characters)){const p=person(name),e=courtRelation(c.relationshipGraph,name,PLAYER_NODE);Object.assign(p,{supportLevel:e.support,hate:e.hate,hasGivenAllegiance:!!e.pledge});const faction=assignCharacterFaction(p);c.relationshipGraph=updateCourtNode(c.relationshipGraph,name,{faction});c.factionSystem.factions[faction].push(name);}
save.presentation.exploring=false;const validated=parseCampaignSave(JSON.stringify(save)).save;mkdirSync('public/qa',{recursive:true});writeFileSync('public/qa/intrigue.json',JSON.stringify(validated));
// Separate fictional deadline setup for visible recap/reload QA; normal saves remain isolated.
const demotion:any=JSON.parse(JSON.stringify(validated));const d=demotion.snapshot.context;
d.season=20;d.rankEnteredSeason=1;d.courtPlots={version:1,lastProcessedSeason:20,pending:{},nextWarningSeason:{},events:[]};d.demotionNotice=null;demotion.presentation.clock.season=20;
for(const ref of Object.values(d.characters) as any[])demotion.snapshot.children[ref.id].snapshot.context.currentSeason=20;
writeFileSync('public/qa/demotion.json',JSON.stringify(parseCampaignSave(JSON.stringify(demotion)).save));
// Romance fixtures are fictional and isolated behind the same explicit QA mode.
import {giveRomanticGift,proposeRomance} from '../src/lib/courtRomance';
const romance:any=JSON.parse(JSON.stringify(validated)),r=romance.snapshot.context;
r.courtPlots={version:1,lastProcessedSeason:1,pending:{},nextWarningSeason:{},events:[]};r.rank='grand_prince';r.currentZone='library';r.playerPersonality.influence=.6;r.rivalInfluenceHighWater=.6;r.activeCharacterNames=['Scholar Qin','Scholar Tao','General Zhao'];r.presentCharacterNames=[...r.activeCharacterNames];r.giftsRemaining=100;r.firstEmperorVisitDone=true;r.firstEmperorVisitElapsed=75;r.relationshipGraph.edges['General Zhao'][PLAYER_NODE].hate=0;romance.snapshot.children[r.characters['General Zhao'].id].snapshot.context.hate=0;
romance.presentation.clock.remainingSeconds=450;
for(const ref of Object.values(r.characters) as any[])romance.snapshot.children[ref.id].snapshot.value='inactive';
for(const name of r.activeCharacterNames)romance.snapshot.children[r.characters[name].id].snapshot.value='alive';
for(const name of ['Scholar Qin','Scholar Tao']){r.relationshipGraph=reduceCourtRelation(r.relationshipGraph,name,PLAYER_NODE,{kind:'affection',amount:45},1).graph;romance.snapshot.children[r.characters[name].id].snapshot.context.relationshipVectors.loveForPlayer=.45;}
writeFileSync('public/qa/romance.json',JSON.stringify(parseCampaignSave(JSON.stringify(romance)).save));
const jealousy:any=JSON.parse(JSON.stringify(romance)),j=jealousy.snapshot.context;
for(const name of ['Scholar Qin','General Zhao']){for(let i=0;i<4;i++)j.relationshipGraph=giveRomanticGift(j.relationshipGraph,PLAYER_NODE,name,1).graph;j.relationshipGraph=proposeRomance(j.relationshipGraph,PLAYER_NODE,name,1,'prince').graph;const p=jealousy.snapshot.children[j.characters[name].id].snapshot.context;p.relationshipVectors.loveForPlayer=courtRelation(j.relationshipGraph,name,PLAYER_NODE).affection/100;p.isLover=true;}
j.relationshipGraph.edges['General Zhao']['Scholar Qin'].hate=70;j.relationshipGraph.edges['Scholar Qin']['General Zhao'].hate=70;
// This is an NPC direct pledge, so it confers no player allegiance or income.
j.relationshipGraph.edges['Maid Ling'][PLAYER_NODE].pledge=null;jealousy.snapshot.children[j.characters['Maid Ling'].id].snapshot.context.hasGivenAllegiance=false;
j.relationshipGraph=reduceCourtRelation(j.relationshipGraph,'Maid Ling','Scholar Qin',{kind:'pledge'},1).graph;
writeFileSync('public/qa/jealousy.json',JSON.stringify(parseCampaignSave(JSON.stringify(jealousy)).save));

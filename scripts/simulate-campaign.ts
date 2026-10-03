import {PLAYER_NODE,graphPledgedTo,courtRelation} from '../src/lib/courtGraph';
import {endorsementRenewal} from '../src/lib/campaignStanding';
import {processGiftWithMessage} from '../src/lib/checkMessage';
import {giftPositiveScale,tributeCost} from '../src/lib/campaignBalance';
import { createActor, fromPromise } from 'xstate';
import { writeFileSync } from 'node:fs';
import { gameMachine } from '../src/state-machines/game-machine';
import { emperorAudienceMachine } from '../src/state-machines/emperor-audience-machine';
import { FALLBACK_QUESTIONS } from '../src/data/fallbackQuestions';
import { getFallbackOutcome } from '../src/lib/aiServices';
import { giftCost, previewMessage, supportReward } from '../src/lib/courtStrategy';
import { GIFT_MESSAGES, type MessageChoice } from '../src/lib/giftMessages';
import { getInfluenceGating } from '../src/lib/influenceGating';
import { assignCharacterFaction } from '../src/lib/factionSystem';
import { careerZoneAccess } from '../src/lib/careerAccess';
import { rankIndex } from '../src/lib/campaignBalance';
import { PLAYABLE_ZONES, scheduledNpcZone } from '../src/palace/zones';
import type { PlayerType } from '../src/types/game';
const log=console.log.bind(console); console.log=()=>{};console.warn=()=>{};console.error=()=>{};
Object.defineProperty(globalThis,'alert',{configurable:true,value:()=>{}});
const random=(seed:number)=>()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};
const drain=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const simMachine=gameMachine.provide({actors:{emperorAudienceMachine:emperorAudienceMachine.provide({actors:{
 generateQuestionsActor:fromPromise(async({input}:any)=>({questions:FALLBACK_QUESTIONS[input.path as keyof typeof FALLBACK_QUESTIONS]})),
 judgeOutcomeActor:fromPromise(async({input}:any)=>getFallbackOutcome(input))
}})}});
type Policy='strategic'|'casual'|'focused'|'bad';
async function simulate(seed:number,role:PlayerType,policy:Policy){
 Math.random=random(seed);const choose=random(seed^0xC0FFEE);const game=createActor(simMachine);let error='';
 const plotEvents:any[]=[];const seenPlotEvents=new Set<string>();let previousContext:any=null;
 game.subscribe({error:e=>{error=String(e);},next:s=>{
  const c=s.context;
  const fresh=(c.courtPlots?.events??[]).filter(e=>!seenPlotEvents.has(JSON.stringify(e)));
  // Season resolution can emit multiple attempts in one snapshot. Reconstruct
  // the sequential pre-attempt ally pool from the preceding stable snapshot.
  let livingAllies=previousContext?.relationshipGraph?graphPledgedTo(previousContext.relationshipGraph,PLAYER_NODE).length:0;
  for(const e of fresh){
   seenPlotEvents.add(JSON.stringify(e));
   const attacker=c.characters[e.attacker]?.getSnapshot().context;
   plotEvents.push({...e,rank:c.rank,rankIndex:rankIndex(role,c.rank),influence:c.playerPersonality.influence,
     alliesBeforeEvent:livingAllies,alliesAtSnapshot:c.relationshipGraph?graphPledgedTo(c.relationshipGraph,PLAYER_NODE).length:0,
     attackerInfluence:attacker?.personalityVectors.influence,attackerHate:c.relationshipGraph?courtRelation(c.relationshipGraph,e.attacker,PLAYER_NODE).hate:null,
     pendingAttackers:Object.keys(c.courtPlots?.pending??{}),giftsRemaining:c.giftsRemaining});
   if(e.kind==='casualty')livingAllies--;
  }
  previousContext=c;
 }});game.start();game.send({type:'CHOOSE_CHARACTER',payload:{type:role}});game.send({type:'INITIALIZE_GAME'});
 let firstPromotion:number|null=null,topPromotion:number|null=null,gifts=0,demotions=0,lastIndex=0,tribute=0,witnessReports=0,hostileGifts=0;const trace:any[]=[];
 let actions=0;const giftLog:any[]=[];
 while(game.getSnapshot().value!=='game_over'&&game.getSnapshot().context.season<=maxSeasons&&actions++<4000&&!error){
  let snap=game.getSnapshot(),c=snap.context;const index=rankIndex(role,c.rank);
  if(index>0&&!firstPromotion)firstPromotion=c.season;if(index===2&&!topPromotion)topPromotion=c.season;if(index<lastIndex)demotions++;lastIndex=index;
  if(snap.matches('emperor_audience_offer')){game.send({type:'ENTER_AUDIENCE'});await drain();continue;}
  if(snap.matches('emperor_audience')){
   const actor=game.getSnapshot().children.emperorAudienceMachine as any;await drain();const a=actor?.getSnapshot();
   if(a?.value==='asking_questions'){
    const q=a.context.questions[a.context.currentQuestionIndex];const correct=choose()<(policy==='strategic'?.80:policy!=='bad'?.55:.2);
    const answer=correct?q.correctAnswer:['a','b','c'].find(v=>v!==q.correctAnswer)!;actor.send({type:'ANSWER_QUESTION',answer});
   }await drain();continue;
  }
  if(snap.matches({playing:'emperor_encounter'})){tribute++;game.send({type:'GIVE_EMPEROR_GIFT',giftsRemaining:c.giftsRemaining});await drain();continue;}
  if(!snap.matches({playing:'in_season'})){await drain();continue;}
  trace.push({season:c.season,rank:c.rank,support:c.supportPoints,influence:Number(c.playerPersonality.influence.toFixed(3)),gifts:c.giftsRemaining,allies:c.relationshipGraph?graphPledgedTo(c.relationshipGraph,PLAYER_NODE).length:0,pendingAttackers:Object.keys(c.courtPlots?.pending??{})});
  const season=c.season;let seconds=0;let approachedRecipient="";
  for(const progress of [0,.26,.51,.76]){
   if(game.getSnapshot().context.season!==season||!game.getSnapshot().matches({playing:'in_season'}))break;
   const zones=PLAYABLE_ZONES.filter(z=>careerZoneAccess(role,game.getSnapshot().context.rank,z).allowed);
   const rankedZones=zones.map(zone=>{
    const state=game.getSnapshot().context;
    const scores=state.activeCharacterNames.filter(name=>scheduledNpcZone(name,season,progress)===zone).map(name=>{
      const data=state.characters[name].getSnapshot().context;if(!data.type)return 0;if(data.supportLevel>=100)return state.standingRecovery&&state.standingRenewals[name]!==season?supportReward(data)*.25/giftCost(data):0;
      const char={...data,type:data.type};const best=Math.max(...GIFT_MESSAGES.map(m=>previewMessage(char,m.type,role,state.playerPersonality).support));
      const remaining=(data.hasGivenSupport?100:data.supportThreshold)-data.supportLevel;
      return supportReward(data)/Math.max(1,Math.ceil(remaining/Math.max(.01,best))*giftCost(data));
    });return{zone,score:Math.max(0,...scores)};
   }).sort((a,b)=>b.score-a.score);
   const visit=policy==='strategic'?rankedZones.map(z=>z.zone):[zones[Math.floor(choose()*zones.length)]];
   const phaseEnd=([0,.26,.51,.76].indexOf(progress)+1)*150;seconds=Math.max(seconds,phaseEnd-150);
   for(const zone of visit){
    c=game.getSnapshot().context;if(!game.getSnapshot().matches({playing:'in_season'}))break;
    seconds+=25;if(seconds>phaseEnd)break;
    const names=c.activeCharacterNames.filter(name=>scheduledNpcZone(name,season,progress)===zone);
    game.send({type:'UPDATE_PALACE_PRESENCE',zone,names});
    let conversationTarget='';
    for(let n=0;n<(policy==='strategic'?500:policy==='focused'?3:2)&&seconds<=phaseEnd;n++){
     c=game.getSnapshot().context;if(!game.getSnapshot().matches({playing:'in_season'}))break;
     const reserve=policy==='strategic'?(c.season===1||c.playerReputation.perceivedLoyalty>.8?0:tributeCost(role,c.rank)):policy!=='bad'?(choose()<.8?tributeCost(role,c.rank):0):0;
     const candidates=names.flatMap(name=>{
      const data=c.characters[name]?.getSnapshot().context;if(name!==approachedRecipient&&seconds+15>phaseEnd)return[];if(!data?.type||(!c.standingRecovery&&data.supportLevel>=100)||giftCost(data)>c.giftsRemaining-reserve)return[];
      const char={...data,type:data.type};const access=getInfluenceGating(char,c.playerPersonality,c.rank);
      const choices=GIFT_MESSAGES.filter(m=>({ambitious:access.canUseAmbitiousMessage,loyal:access.canUseLoyalMessage,cautious:access.canUseCautiousMessage,neutral:access.canUseNeutralMessage}[m.type].allowed));
      const previews=choices.map(m=>({message:m.type,preview:previewMessage(char,m.type,role,c.playerPersonality),renewal:endorsementRenewal(char,processGiftWithMessage(m.type,{...char.personalityVectors,suspicion:char.suspicion},char.relationshipVectors,role,c.playerPersonality,char.supportLevel,{positiveEffectScale:giftPositiveScale(char,c.playerPersonality.influence)}).supportDelta,role,{recovery:c.standingRecovery,season,support:c.supportPoints,renewals:c.standingRenewals})}));
      const safe=previews.filter(p=>(p.preview.support>0||p.renewal>0)&&!p.preview.dangerous).sort((a,b)=>b.preview.support-a.preview.support);
      let pick=policy==='bad'?previews[Math.floor(choose()*previews.length)]:policy!=='strategic'&&choose()<.30?previews.find(p=>p.message==='neutral'):safe[0];
      if(!pick)return[];
      // A strategic player reads displayed personality and commits to nearly won
      // backers/pledges. Penalize witnessed Rebel moves rather than using omniscience.
      const faction=assignCharacterFaction(char);const witnesses=c.presentCharacterNames.filter(other=>other!==name&&c.characters[other]).map(other=>c.characters[other].getSnapshot().context).filter(o=>o.type&&!o.hasGivenAllegiance&&['Imperial','Loyalist'].includes(assignCharacterFaction({...o,type:o.type!})));
      if(policy==='strategic'&&pick.message==='ambitious'&&faction==='Rebel'&&witnesses.length)pick=safe.find(p=>p.message!=='ambitious')??pick;
      const next=data.hasGivenSupport?100:data.supportThreshold;
      const costToReward=Math.max(1,Math.ceil((next-data.supportLevel)/Math.max(.01,pick.preview.support)))*giftCost(data);
      const pledgeCost=Math.max(1,Math.ceil((100-data.supportLevel)/Math.max(.01,pick.preview.support)))*giftCost(data)-(data.hasGivenGifts?0:data.type==='major'?10:data.type==='minor'?1:5);
      const pledgeScore=(data.hasGivenSupport?1:2)*supportReward(data)/Math.max(1,pledgeCost);
      let score=(data.supportLevel<100?Math.max(supportReward(data)/costToReward,pledgeScore):0)+pick.renewal/giftCost(data)+(data.supportLevel>0?.025:0);
      if(policy!=='strategic')score=choose();
      if(policy==='focused'&&name===conversationTarget)score+=2;
      return[{name,pick,score,hate:data.hate}];
     }).sort((a,b)=>b.score-a.score);
     if(!candidates.length)break;
     const item=candidates[0];if(giftCost(c.characters[item.name].getSnapshot().context)>c.giftsRemaining-reserve)break;conversationTarget=item.name;const beforeReceipt=c.lastGiftReceipt?.sequence??0;
     game.send({type:'GIVE_GIFT_WITH_MESSAGE',characterId:item.name,messageType:item.pick.message as MessageChoice,requestId:`sim-${seed}-${actions}-${progress}-${zone}-${n}`});await drain();
     if((game.getSnapshot().context.lastGiftReceipt?.sequence??0)>beforeReceipt){giftLog.push({season,rank:c.rank,name:item.name,message:item.pick.message,preview:item.pick.preview.support,score:item.score,cost:giftCost(c.characters[item.name].getSnapshot().context),standingBefore:c.supportPoints,standingAfter:game.getSnapshot().context.supportPoints});gifts++;if(item.name!==approachedRecipient){seconds+=15;approachedRecipient=item.name;}if(item.hate>=60)hostileGifts++;}
     c=game.getSnapshot().context;
     const r=rankIndex(role,c.rank);if(r>0&&!firstPromotion)firstPromotion=c.season;if(r===2&&!topPromotion)topPromotion=c.season;
     if(!c.factionSystem.playerFaction&&c.factionSystem.membershipOffers.length){game.send({type:'JOIN_FACTION',faction:c.factionSystem.membershipOffers[0].faction});await drain();}
    }
   }
  }
  snap=game.getSnapshot();c=snap.context;witnessReports=Math.max(witnessReports,c.suspiciousCharacters.length);
  if(snap.matches({playing:'in_season'}))game.send({type:'NEXT_SEASON'});await drain();
 }
 const finalSnapshot=game.getSnapshot(),final=finalSnapshot.context,unresolved=finalSnapshot.value!=='game_over';game.stop();return{seed,role,policy,plotEvents,actions,finalState:finalSnapshot.value,unresolved,lastAudienceOutcome:final.emperorAudienceOutcome,gameEndReason:final.gameEndReason,finalPending:final.courtPlots?.pending??{},finalAllyCount:final.relationshipGraph?graphPledgedTo(final.relationshipGraph,PLAYER_NODE).length:0,firstPromotion,topPromotion,win:final.gameEndReason==='victory',ending:unresolved?'horizon':final.careerEnding?.title??final.emperorAudienceOutcome??final.gameEndReason??'horizon',season:final.season,globalSupport:final.supportPoints,gifts,tribute,demotions,witnessReports,hostileGifts,error,trace,giftLog,finalGifts:final.giftsRemaining,finalContacts:Object.values(final.characters).map((actor:any)=>actor.getSnapshot().context).filter((c:any)=>c.supportLevel>0).map((c:any)=>({name:c.name,support:c.supportLevel,back:c.hasGivenSupport,pledge:c.hasGivenAllegiance,faction:assignCharacterFaction(c),hate:c.hate}))};
}
const roles:PlayerType[]=(process.env.ROLE_FILTER?.split(',')??['prince','minister','concubine']) as PlayerType[];
const policies:Policy[]=(process.env.POLICY_FILTER?.split(',')??['strategic','casual','focused','bad']) as Policy[];
if(roles.some(r=>!['prince','minister','concubine'].includes(r))||policies.some(p=>!['strategic','casual','focused','bad'].includes(p)))throw Error('Invalid campaign role or policy filter');
const count=Number(process.argv[2]??100);const seedStart=Number(process.argv[3]??1);const maxSeasons=Number(process.argv[4]??60);const runs:any[]=[];
for(const role of roles)for(const policy of policies)for(let seed=seedStart;seed<seedStart+count;seed++)runs.push(await simulate(seed,role,policy));
const median=(values:number[])=>values.length?[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)]:null;
const summaries=roles.flatMap(role=>policies.map(policy=>{const list=runs.filter(r=>r.role===role&&r.policy===policy);return{role,policy,runs:list.length,firstPromotionRate:list.filter(r=>r.firstPromotion!==null).length/list.length,topPromotionRate:list.filter(r=>r.topPromotion!==null).length/list.length,winRate:list.filter(r=>r.win).length/list.length,medianFirst:median(list.flatMap(r=>r.firstPromotion?[r.firstPromotion]:[])),medianTop:median(list.flatMap(r=>r.topPromotion?[r.topPromotion]:[])),medianEnd:median(list.map(r=>r.season)),horizon:list.filter(r=>r.unresolved&&r.season>maxSeasons).length,actionBudget:list.filter(r=>r.unresolved&&r.actions>=4000).length,errors:list.filter(r=>r.error).length,demotions:list.reduce((n,r)=>n+r.demotions,0),hostileGifts:list.reduce((n,r)=>n+r.hostileGifts,0),
 warnings:list.flatMap(r=>r.plotEvents).filter(e=>e.kind==='warning').length,
 warningRuns:list.filter(r=>r.plotEvents.some((e:any)=>e.kind==='warning')).length,
 defusals:list.flatMap(r=>r.plotEvents).filter(e=>e.kind==='defused').length,
 casualties:list.flatMap(r=>r.plotEvents).filter(e=>e.kind==='casualty').length,
 playerDeaths:list.filter(r=>r.plotEvents.some((e:any)=>e.kind==='player_death')).length,
 threatsByRank:Object.fromEntries([...new Set(list.flatMap(r=>r.plotEvents).filter(e=>e.kind==='warning').map(e=>String(e.rank)))].map(rank=>[rank,list.flatMap(r=>r.plotEvents).filter(e=>e.kind==='warning'&&String(e.rank)===rank).length])),
 resolutionAllies:list.flatMap(r=>r.plotEvents).filter(e=>['casualty','player_death'].includes(e.kind)).map(e=>e.alliesBeforeEvent)};}));
const report={version:6,seeds:count,seedStart,maxSeasons,roles,policies,assumptions:{plots:'Observer-only production event telemetry; rank is from first emitted snapshot; pre-attempt allies reconstructed from preceding stable snapshot and sequential casualties',movement:'25 seconds per area visit plus15 seconds when approaching a different recipient; repeat gifts/dialogue use0 active seconds because production pauses the clock;150-second quarter-phase budgets;600 seconds total;no navigation collision modeled',strategic:'Visible direct-effect preview, best backing or pledge efficiency including immediate pledge rebate, repeat gifts until real approach-time or money budget is exhausted, rank-based10/20/40 tribute reserve except season1 or guaranteed loyalty bypass, all allowed zones, avoids witnessed ambitious Rebel gifts;80% audience question accuracy',casual:'Random visits/recipients, mostly safe or neutral messages, tribute reserve80% of decisions;55% answer accuracy',focused:'Random area and first recipient, three gifts per visit to that same person when possible, reads safe message previews or30% neutral;same55% audience accuracy and80% tribute reserve as scattered casual',bad:'Random available messages, no tribute reserve;20% answer accuracy',audience:'Real production fallback questions/judgment with no paid API; no fabricated direct victory event'},summaries,runs};
writeFileSync(process.env.SIM_REPORT_PATH??`validation/campaign-simulation${seedStart===1?'':`-from-${seedStart}`}.json`,JSON.stringify(report,null,2));log(JSON.stringify(summaries,null,2));

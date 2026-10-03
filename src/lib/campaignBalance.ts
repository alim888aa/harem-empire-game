import {courtArchetype,type CourtIdentity} from './courtHierarchy';
import { CAREER_LADDERS, resolveCareer, type Career, type CareerRank } from './careerAccess';
import type { Character } from '../types/character';
/** All campaign tuning is explicit here. Personal backing and global standing are
 * separate: each courtier can award standing once for backing and once for a pledge. */
export const CAMPAIGN_BALANCE = {
  version: 7,
  topConsolidationSeasons:3,
  roles: {
    prince: { globalTargets: [80, 160], influenceTargets: [0.70, 0.78], window: 20 },
    scholar: { globalTargets: [90, 180], influenceTargets: [0.55, 0.72], window: 16 },
    concubine: { globalTargets: [80, 200], influenceTargets: [0.30, 0.60], window: 12 },
  },
  activeCastMin:12,
  activeCastMax:16,
  returningContacts:3,
  startingGifts: 0, // No inventory before choosing a career.
  seasonalGiftsByRank: {concubine:20,consort:25,empress:30,scholar:20,minister:30,prime_minister:45,prince:25,grand_prince:45,crown_prince:65},
  tributeCosts: [10,20,40],
  globalRewards: { maid:2,eunuch:2,concubine:5,scholar:8,general:20,prince:20,consort:20,minister:20,prime_minister:50,crown_prince:50,empress_consort:50,empress_dowager:50 },
  influencePerStanding: 0.002,
  promotionInfluence: 0.03,
  demotionInfluenceLoss: 0.12,
  demotionProbationSeasons: 2,
  endorsementRenewalFraction: 0.25,
  successfulDiplomacyInfluence: 0.004, // once per recipient per season; no cap-farming
  relativeInfluencePenalty: 0.50, // Each10-point influence advantage/disadvantage changes positive effects by5%.
  messageSupport:{prince:{match:20,cautious:14,neutral:10},minister:{match:20,cautious:14,neutral:10},concubine:{match:18,cautious:12,neutral:9}},
  badMessageSupport:{suspicious:-12,dismissive:-6},
  enemyPositiveScale: 0.10,
  promotionHateByRole: { prince:20, scholar:30, concubine:40 },
  hateOnOpposingFaction: 30,
  hatePerInfluenceMilestone: 5,
  hostileThreshold: 60,
  witnessSuspicion: 0.10,
  hostileWitnessMultiplier: 1.5,
  emperorEncounterBase: 0.20,
  emperorEncounterInfluence: 0.20,
  tributeFavorChance: 0.30,
  tributeInfluenceReward: 0.04,
} as const;
export const courtierGiftAmount=(type:string|null)=>type==='major'?10:type==='side'?5:type==='minor'?1:0;
export function tributeCost(role:string|null,rank:string|null):number {
  return CAMPAIGN_BALANCE.tributeCosts[Math.max(0,Math.min(2,rankIndex(role,rank)))];
}
export function promotionHate(role:string|null):number {
  const career=resolveCareer(role);return career?CAMPAIGN_BALANCE.promotionHateByRole[career]:0;
}
export function rankIndex(role:string|null, rank:string|null): number {
  const career=resolveCareer(role); if(!career)return -1;
  const legacy=rank==='empress_consort'?'empress':rank;
  return legacy===null?0:CAREER_LADDERS[career].indexOf(legacy as CareerRank);
}
/** Grant for the rank held when a new season starts; earned inventory is never capped. */
export function seasonalGiftGrant(role:string|null,rank:string|null):number {
  const career=resolveCareer(role);if(!career)return 0;
  const resolved=rank==='empress_consort'?'empress':rank??CAREER_LADDERS[career][0];
  return CAREER_LADDERS[career].includes(resolved as CareerRank)?CAMPAIGN_BALANCE.seasonalGiftsByRank[resolved as CareerRank]:0;
}
export function promotionRequirement(role:string|null, rank:string|null) {
  const career=resolveCareer(role),index=rankIndex(role,rank);
  if(!career || index<0 || index>=2)return null;
  const cfg=CAMPAIGN_BALANCE.roles[career];
  return {rank:CAREER_LADDERS[career][index+1],globalSupport:cfg.globalTargets[index],influence:cfg.influenceTargets[index]};
}
export function mayPromote(input:{role:string|null;rank:string|null;support:number;influence:number;season:number;eligibleAfterSeason?:number}){
  const next=promotionRequirement(input.role,input.rank);
  return !!next && input.support>=next.globalSupport && input.influence+1e-9>=next.influence && input.season>=(input.eligibleAfterSeason??1);
}
export function demotedRank(role:string|null,rank:string|null):CareerRank|null {
  const career=resolveCareer(role),index=rankIndex(role,rank);
  return career&&index>1?CAREER_LADDERS[career][index-1]:null;
}
export const globalSupportReward=(person:CourtIdentity)=>{const key=courtArchetype(person.name??'');return key?CAMPAIGN_BALANCE.globalRewards[key]:(person.type==='major'?50:person.type==='minor'?2:20);};
export const isEnemy=(character:Pick<Character,'hasGivenAllegiance'> & {hate?:number})=>!character.hasGivenAllegiance&&(character.hate??0)>=CAMPAIGN_BALANCE.hostileThreshold;
export const relativeInfluenceScale=(player:number,npc:number)=>1+CAMPAIGN_BALANCE.relativeInfluencePenalty*(Math.max(0,Math.min(1,player))-Math.max(0,Math.min(1,npc)));
export const giftPositiveScale=(character:Pick<Character,'hasGivenAllegiance'> & {hate?:number;personalityVectors?:Pick<Character['personalityVectors'],'influence'>},influence:number)=>
  relativeInfluenceScale(influence,character.personalityVectors?.influence??0)*(isEnemy(character)?CAMPAIGN_BALANCE.enemyPositiveScale:1);
export const emperorEncounterChance=(influence:number)=>CAMPAIGN_BALANCE.emperorEncounterBase+Math.max(0,Math.min(1,influence))*CAMPAIGN_BALANCE.emperorEncounterInfluence;
export const careerWindow=(role:Career)=>CAMPAIGN_BALANCE.roles[role].window;

/** Apply full gains up to70%, then20% of further positive gains. Existing influence is never reduced. */
export function earnedInfluence(current:number,amount:number){const low=Math.min(Math.max(0,.70-current),Math.max(0,amount));return Math.min(1,current+low+Math.max(0,amount-low)*.20);}

export function consolidationProgress(role:string|null,rank:string|null,enteredSeason:number,season:number,waived=false){
 if(rankIndex(role,rank)!==2)return null;
 const total=CAMPAIGN_BALANCE.topConsolidationSeasons,completed=waived?total:Math.min(total,Math.max(0,season-enteredSeason));
 return{completed,total,remaining:total-completed};
}

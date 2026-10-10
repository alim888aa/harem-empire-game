import {courtArchetype,type CourtIdentity} from './courtHierarchy';
import { CAREER_RULES, type Career } from './career';
// Stable public imports remain available while runtime consumers use Career directly.
export {
  tributeCost, promotionHate, rankIndex, seasonalGiftGrant, promotionRequirement,
  mayPromote, demotedRank, consolidationProgress
} from './career';
import type { Character } from '../types/character';
/** All campaign tuning is explicit here. Personal backing and global standing are
 * separate: each courtier can award standing once for backing and once for a pledge. */
export const CAMPAIGN_BALANCE = {
  version: 7,
  topConsolidationSeasons: CAREER_RULES.topConsolidationSeasons,
  roles: CAREER_RULES.roles,
  activeCastMin:12,
  activeCastMax:16,
  returningContacts:3,
  startingGifts: 0, // No inventory before choosing a career.
  seasonalGiftsByRank: CAREER_RULES.seasonalGiftsByRank,
  tributeCosts: CAREER_RULES.tributeCosts,
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
  promotionHateByRole: CAREER_RULES.promotionHateByRole,
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
export const globalSupportReward=(person:CourtIdentity)=>{const key=courtArchetype(person.name??'');return key?CAMPAIGN_BALANCE.globalRewards[key]:(person.type==='major'?50:person.type==='minor'?2:20);};
export const isEnemy=(character:Pick<Character,'hasGivenAllegiance'> & {hate?:number})=>!character.hasGivenAllegiance&&(character.hate??0)>=CAMPAIGN_BALANCE.hostileThreshold;
export const relativeInfluenceScale=(player:number,npc:number)=>1+CAMPAIGN_BALANCE.relativeInfluencePenalty*(Math.max(0,Math.min(1,player))-Math.max(0,Math.min(1,npc)));
export const giftPositiveScale=(character:Pick<Character,'hasGivenAllegiance'> & {hate?:number;personalityVectors?:Pick<Character['personalityVectors'],'influence'>},influence:number)=>
  relativeInfluenceScale(influence,character.personalityVectors?.influence??0)*(isEnemy(character)?CAMPAIGN_BALANCE.enemyPositiveScale:1);
export const emperorEncounterChance=(influence:number)=>CAMPAIGN_BALANCE.emperorEncounterBase+Math.max(0,Math.min(1,influence))*CAMPAIGN_BALANCE.emperorEncounterInfluence;
export const careerWindow=(role:Career)=>CAMPAIGN_BALANCE.roles[role].window;

/** Apply full gains up to70%, then20% of further positive gains. Existing influence is never reduced. */
export function earnedInfluence(current:number,amount:number){const low=Math.min(Math.max(0,.70-current),Math.max(0,amount));return Math.min(1,current+low+Math.max(0,amount-low)*.20);}

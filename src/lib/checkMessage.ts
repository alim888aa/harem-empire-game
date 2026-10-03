import type {CharacterPersonalityVectors,CharacterRelationshipVectors} from '../types/character';
import type {PlayerStats,PlayerType} from '../types/game';
import {giftMessage,type MessageChoice} from './giftMessages';
import {CAMPAIGN_BALANCE as B} from './campaignBalance';
export interface MessageAnalysisResult {
 vectorChanges:Partial<CharacterPersonalityVectors>;
 relationshipChanges:Partial<CharacterRelationshipVectors>;
 responseType:string;
 supportDelta:number;
}
function assertMessage(value:unknown):asserts value is MessageChoice {if(!giftMessage(value))throw new TypeError('Message type must be ambitious, loyal, cautious, or neutral');}
/** Retired personal meters are discarded, including when legacy actor data is loaded. */
export function withoutRetiredRelationships(value:CharacterRelationshipVectors):CharacterRelationshipVectors{return{fearOfPlayer:value.fearOfPlayer,loveForPlayer:value.loveForPlayer};}
export function analyzeMessageChoice(messageType:MessageChoice,personality:CharacterPersonalityVectors,_relationships:CharacterRelationshipVectors,role:PlayerType,_charisma:number):MessageAnalysisResult {
 assertMessage(messageType);const scores=B.messageSupport[role],vectorChanges:Partial<CharacterPersonalityVectors>={},relationshipChanges:Partial<CharacterRelationshipVectors>={};
 let responseType='neutral',supportDelta:number=scores.neutral;
 if(messageType==='ambitious'){
  if(personality.ambition>=.6&&personality.loyalty<=.5){responseType='ambitious_positive';supportDelta=scores.match;vectorChanges.ambition=.05;}
  else if(personality.loyalty>=.5||personality.ambition<=.5){responseType='loyal_suspicious';supportDelta=B.badMessageSupport.suspicious;vectorChanges.suspicion=.3;relationshipChanges.fearOfPlayer=.15;}
 }else if(messageType==='loyal'){
  if(personality.loyalty>=.7){responseType='loyal_positive';supportDelta=scores.match;}
  else if(personality.ambition>=.7&&personality.loyalty<=.5){responseType='ambitious_dismissive';supportDelta=B.badMessageSupport.dismissive;}
 }else if(messageType==='cautious'&&personality.fear>=.5){responseType='fearful_appreciative';supportDelta=scores.cautious;vectorChanges.fear=.1;}
 return{responseType,supportDelta,vectorChanges,relationshipChanges};
}
export function updatePersonalityVectors(current:CharacterPersonalityVectors,changes:Partial<CharacterPersonalityVectors>):CharacterPersonalityVectors {
 const next={...current};for(const key of Object.keys(changes) as (keyof CharacterPersonalityVectors)[])if(next[key]!==undefined&&changes[key]!==undefined)next[key]=Math.max(0,Math.min(1,next[key]+changes[key]!));return next;
}
export function updateRelationshipVectors(current:CharacterRelationshipVectors,changes:Partial<CharacterRelationshipVectors>):CharacterRelationshipVectors {
 const next=withoutRetiredRelationships(current);for(const key of ['fearOfPlayer','loveForPlayer']as const)if(changes[key]!==undefined)next[key]=Math.max(0,Math.min(1,next[key]+changes[key]!));return next;
}
export interface GiftWithMessageResult {newPersonalityVectors:CharacterPersonalityVectors;newRelationshipVectors:CharacterRelationshipVectors;newSupportLevel:number;responseType:string;supportDelta:number;}
export interface MessageEffectOptions {positiveEffectScale?:number;}
/** Whole gift points, with half points rounded away from zero on either side. */
export function roundGiftSupport(amount:number):number {
 const magnitude=Math.round(Math.abs(amount));return magnitude===0?0:Math.sign(amount)*magnitude;
}
/** Direct support is based on message fit and role. The production caller supplies
 * one combined influence-gap/hostility factor; negative outcomes keep full weight.
 * Round that final effect once. Preserve existing fractional support from older
 * saves, and report the exact credited amount when the 0/100 cap trims a gift. */
export function processGiftWithMessage(messageType:MessageChoice,personality:CharacterPersonalityVectors,relationships:CharacterRelationshipVectors,role:PlayerType,stats:PlayerStats,support:number,options:MessageEffectOptions={}):GiftWithMessageResult {
 const scale=options.positiveEffectScale??1;if(!Number.isFinite(scale)||scale<0)throw new RangeError('positiveEffectScale must be a finite non-negative number');
 const analysis=analyzeMessageChoice(messageType,personality,relationships,role,stats.charisma);
 const supportDelta=roundGiftSupport(analysis.supportDelta*(analysis.supportDelta>0?scale:1));
 const changes={...analysis.vectorChanges};if((changes.ambition??0)>0)changes.ambition!*=scale;
 return{newPersonalityVectors:updatePersonalityVectors(personality,changes),newRelationshipVectors:updateRelationshipVectors(relationships,analysis.relationshipChanges),newSupportLevel:Math.max(0,Math.min(100,Math.round((support+supportDelta)*100)/100)),responseType:analysis.responseType,supportDelta};
}

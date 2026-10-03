import type { FactionType } from './factionSystem';
import type { PalaceZone } from './careerAccess';
import { CAMPAIGN_BALANCE as B, promotionHate } from './campaignBalance';
export type CourtWitness={name:string;faction:FactionType;pledged:boolean;hate:number;zone:PalaceZone};
/** Capture on submission. No later movement, conversion or off-zone actor can be
 * retroactively added to a completed interaction. */
export function witnessedRebelGift(message:string,recipientFaction:FactionType,recipientName:string,zone:PalaceZone,witnesses:readonly CourtWitness[]){
 if(message!=='ambitious'||recipientFaction!=='Rebel')return[];
 return witnesses.filter(w=>w.name!==recipientName&&w.zone===zone&&!w.pledged&&['Imperial','Loyalist'].includes(w.faction)).map(w=>({characterName:w.name,suspicionChange:B.witnessSuspicion*(w.hate>=B.hostileThreshold?B.hostileWitnessMultiplier:1),effectType:'ambitious_faction' as const}));
}
export function consortHostility(support:number,threshold:number,pledged:boolean){
 return pledged?{support,hate:0}:{support:support>=threshold?Math.min(support,threshold-1):support,hate:promotionHate('concubine')};
}

/** Rivalry follows an actual office, never every member of its faction. */
export function isPromotionRival(name:string,rank:string):boolean {
 if(rank==='consort')return name==='Empress Consort'||name.startsWith('Consort ');
 if(rank==='minister')return name==='Prime Minister'||name.startsWith('Minister ');
 if(rank==='grand_prince')return name==='Crown Prince'||name.startsWith('Grand Prince ');
 if(['empress','prime_minister','crown_prince'].includes(rank))return ['Empress Consort','Empress Dowager','Prime Minister','Crown Prince'].includes(name);
 return false;
}
export function opposingFactions(a:FactionType,b:FactionType):boolean {
 return (a==='Rebel'&&(b==='Imperial'||b==='Loyalist'))||(b==='Rebel'&&(a==='Imperial'||a==='Loyalist'));
}

export function careerSeniorRival(role:string|null){return role==='concubine'?'Empress Dowager':role==='prince'?'Crown Prince':role==='minister'||role==='scholar'?'Prime Minister':null;}

import {CAREER_LADDERS,resolveCareer,type CareerRank} from './careerAccess';
export type DemotionNotice={id:string;season:number;fromRank:CareerRank;toRank:CareerRank;reason:'deadline'|'audience';acknowledged:boolean};
export function createDemotionNotice(role:string|null,rank:string|null,season:number,reason:DemotionNotice['reason']):DemotionNotice|null{
 const career=resolveCareer(role);if(!career)return null;const ladder=CAREER_LADDERS[career],fromRank=(rank==='empress_consort'?'empress':rank??ladder[0]) as CareerRank,index=ladder.indexOf(fromRank);if(index<1)return null;
 const toRank=ladder[index-1];return{id:`${season}:${fromRank}:${toRank}:${reason}`,season,fromRank,toRank,reason,acknowledged:false};
}
export const demotionReason=(notice:DemotionNotice)=>notice.reason==='audience'?'The Emperor dismissed your audience.':'Your rank deadline passed.';

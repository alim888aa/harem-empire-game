/** Confirmed cumulative career/zone access. Promotion costs are configured separately. */
export type Career = 'prince' | 'scholar' | 'concubine';
export type CareerRank = 'prince' | 'grand_prince' | 'crown_prince' | 'scholar' | 'minister' | 'prime_minister' | 'concubine' | 'consort' | 'empress';
export type PalaceZone = 'common' | 'emperor' | 'empress' | 'ladies' | 'dowager' | 'library';
export const CAREER_LADDERS:Record<Career,readonly CareerRank[]> = {
  prince:['prince','grand_prince','crown_prince'],
  scholar:['scholar','minister','prime_minister'],
  concubine:['concubine','consort','empress'],
};
export const PALACE_ZONE_TITLES:Record<PalaceZone,string> = {
  common:'Palace corridors',emperor:"Emperor's palace",empress:"Empress's palace",ladies:"Ladies' Court",dowager:"Dowager's palace",library:'Academy Library',
};
// Legacy minister is retained as the engine/save identity until the full ladder
// migration lands. Resolving a display/access career never recreates actors or stats.
export function resolveCareer(role:string|null|undefined):Career|null {
  return role==='minister'||role==='scholar'?'scholar':role==='prince'||role==='concubine'?role:null;
}
export const startingCareerTitle=(role:string|null|undefined)=>{
  const career=resolveCareer(role);return career?career[0].toUpperCase()+career.slice(1):'Courtier';
};
export const RANK_ACCESS:Record<CareerRank,readonly PalaceZone[]>={
  prince:['common','empress','dowager','library'],
  grand_prince:['common','empress','dowager','library','emperor'],
  crown_prince:['common','emperor','empress','ladies','dowager','library'],
  scholar:['common','emperor','library'],
  minister:['common','emperor','library','empress','dowager'],
  prime_minister:['common','emperor','empress','ladies','dowager','library'],
  concubine:['common','ladies'],
  consort:['common','ladies','empress','dowager'],
  empress:['common','emperor','empress','ladies','dowager','library'],
};
const title=(rank:string)=>rank.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
export function careerZoneAccess(role:string|null, rank:string|null, zone:PalaceZone):{allowed:boolean;reason?:string;requiredRank?:CareerRank} {
  const career=resolveCareer(role);
  if(!career)return{allowed:false,reason:'Choose a career first.'};
  // Existing final Empress Consort saves represent the old final office.
  const resolvedRank=rank==='empress_consort'?'empress':rank??CAREER_LADDERS[career][0];
  const ladder=CAREER_LADDERS[career],index=ladder.indexOf(resolvedRank as CareerRank);
  if(index<0)return{allowed:false,reason:'This rank does not belong to your career.'};
  if(RANK_ACCESS[resolvedRank as CareerRank].includes(zone))return{allowed:true};
  const requiredRank=ladder.slice(index+1).find(next=>RANK_ACCESS[next].includes(zone));
  return{allowed:false,requiredRank,reason:requiredRank?`Requires ${title(requiredRank)} rank.`:'This career does not grant entry.'};
}
export function careerEntryZone(role:string|null):PalaceZone {
  return resolveCareer(role)==='concubine'?'ladies':'library';
}

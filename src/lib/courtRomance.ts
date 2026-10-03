import {authoredRomancePairEligibility} from '../data/romanceProfiles';
import {courtRelation,graphLovers,reduceCourtRelation,setRomancePair,PLAYER_NODE,type CourtGraph} from './courtGraph';
export const ROMANCE_BALANCE={giftAffection:15,acceptance:60,concubineAcceptance:85,jealousyOnAcceptance:20,jealousyPerSeason:10,witnessSuspicion:.1,refusalHate:60} as const;
export type RomanceAction='gift'|'propose'|'end';
export type RomanceReceipt={requestId:string;characterId:string;action:RomanceAction;season:number;cost:number;affectionDelta:number;accepted:boolean;response:string;witnesses:string[];reportingWitnesses:string[]};
export function romancePairEligibility(graph:CourtGraph,from:string,to:string){
 if(from===to||!graph.nodes[from]||!graph.nodes[to]||graph.nodes[from].status!=='living'||graph.nodes[to].status!=='living')return{allowed:false,reason:'Both people must be living, distinct members of court.'};
 return authoredRomancePairEligibility(from,to,graph.nodes[PLAYER_NODE]?.office);
}
export function romanceAcceptanceThreshold(initiatorRole:string|null){return initiatorRole==='concubine'?ROMANCE_BALANCE.concubineAcceptance:ROMANCE_BALANCE.acceptance;}
/** A gift expresses interest, never buys consent or grants political rewards. */
export function giveRomanticGift(graph:CourtGraph,from:string,to:string,season:number){
 if(!romancePairEligibility(graph,from,to).allowed)throw Error('Ineligible romance pair');
 const before=courtRelation(graph,to,from).affection;
 const next=reduceCourtRelation(graph,to,from,{kind:'affection',amount:ROMANCE_BALANCE.giftAffection},season).graph;
 return{graph:next,affectionDelta:courtRelation(next,to,from).affection-before};
}
/** Proposal is the initiator's explicit consent; recipient accepts/refuses under
 * authored, visible rules. No reciprocal emotion, pledge or immunity is inferred. */
export function proposeRomance(graph:CourtGraph,from:string,to:string,season:number,initiatorRole:string|null){
 const gate=romancePairEligibility(graph,from,to);if(!gate.allowed)return{graph,accepted:false,reason:gate.reason};
 if(courtRelation(graph,from,to).romance&&courtRelation(graph,to,from).romance)return{graph,accepted:true,reason:'We are already lovers.'};
 const feelings=courtRelation(graph,to,from),threshold=romanceAcceptanceThreshold(initiatorRole);
 if(feelings.hate>=ROMANCE_BALANCE.refusalHate)return{graph,accepted:false,reason:'I won’t enter a romance while I feel this much hostility toward you.'};
 if(feelings.affection<threshold)return{graph,accepted:false,reason:`I’m not ready for a romance. I need ${threshold} affection; I feel ${feelings.affection}.`};
 let next=setRomancePair(graph,from,to,true,season);
 // Only actual shared-lover triangles create jealousy, even inside one faction
 // or when both rivals are pledged to the player.
 for(const lover of graphLovers(next,from).filter(id=>id!==to))for(const [a,b]of [[lover,to],[to,lover]])next=reduceCourtRelation(next,a,b,{kind:'jealousy',amount:ROMANCE_BALANCE.jealousyOnAcceptance},season).graph;
 for(const lover of graphLovers(next,to).filter(id=>id!==from))for(const [a,b]of [[lover,from],[from,lover]])next=reduceCourtRelation(next,a,b,{kind:'jealousy',amount:ROMANCE_BALANCE.jealousyOnAcceptance},season).graph;
 return{graph:next,accepted:true,reason:'Yes. I want us to be lovers. Our politics remain our own.'};
}
export function endRomance(graph:CourtGraph,from:string,to:string,season:number){return setRomancePair(graph,from,to,false,season);}
export function seasonalRomanceJealousy(graph:CourtGraph,season:number){
 let next=graph;const pairs=new Set<string>();
 for(const shared of Object.keys(graph.nodes)){const lovers=graphLovers(graph,shared);for(const a of lovers)for(const b of lovers)if(a!==b&&graph.nodes[a].kind==='courtier'&&graph.nodes[b].kind==='courtier')pairs.add(JSON.stringify([a,b]));}
 for(const pair of [...pairs].sort()){const [a,b]=JSON.parse(pair);next=reduceCourtRelation(next,a,b,{kind:'jealousy',amount:ROMANCE_BALANCE.jealousyPerSeason},season).graph;}
 return next;
}
export type RomanceWitness={name:string;pledged:boolean;suspicion:number;suspicionThreshold:number;zone:string};
export function romanceWitnessRisk(role:string|null,zone:string,witnesses:readonly RomanceWitness[]){
 return role==='concubine'?witnesses.filter(w=>w.zone===zone&&!w.pledged).map(w=>({...w,delta:ROMANCE_BALANCE.witnessSuspicion,reports:Math.round((w.suspicion+ROMANCE_BALANCE.witnessSuspicion)*1e12)/1e12>=w.suspicionThreshold})):[];
}

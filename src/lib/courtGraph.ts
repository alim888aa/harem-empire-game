import {authoredRomancePairEligibility} from '../data/romanceProfiles';
import { campaignRandom } from './campaignRandom';
import { scheduledNpcZone } from '../palace/zones';
import { courtArchetype } from './courtHierarchy';
import { assignCharacterFaction, type FactionType } from './factionSystem';

export const PLAYER_NODE='@player';
export const EMPEROR_NODE='Emperor';
export type CourtNode={id:string;kind:'player'|'courtier'|'emperor';office:string;faction:FactionType|null;status:'living'|'expelled'|'deceased'};
export type Pledge={formedSeason:number|null;source:'earned'|'legacy'|'explicit'};
export type Romance={formedSeason:number;source:'accepted'|'legacy'};
export type CourtRelation={support:number;hate:number;pledge:Pledge|null;affection:number;romance:Romance|null};
export type CourtGraph={version:2;seed:number;revision:number;nodes:Record<string,CourtNode>;edges:Record<string,Record<string,CourtRelation>>};
export type GraphPerson={name:string;type?:string|null;personalityVectors?:any;vectors?:any;supportLevel?:number;hate?:number;hasGivenAllegiance?:boolean;factionOverride?:FactionType|null;formalFaction?:FactionType|null;relationshipVectors?:{loveForPlayer?:number}};
export type RelationshipCommand=
 |{kind:'gift';support:number;negativeDelta:number;formPledge:boolean}
 |{kind:'support';amount:number;formPledge:boolean}
 |{kind:'withdraw';threshold:number}
 |{kind:'hate';amount:number}
 |{kind:'spit'}
 |{kind:'rivalry';amount:number;threshold:number}
 |{kind:'pledge';source?:Pledge['source']}
 |{kind:'affection';amount:number}
 |{kind:'romance';accepted:boolean}
 |{kind:'jealousy';amount:number};
const neutral=():CourtRelation=>({support:0,hate:0,pledge:null,affection:0,romance:null});
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n*100)/100));
export function graphSeed(seed:number){return ((seed>>>0)^0x47524150)>>>0;}
export function courtRelation(graph:CourtGraph,from:string,to:string):CourtRelation {return graph.edges[from]?.[to]??neutral();}
export function sameFormalFaction(a:FactionType|null|undefined,b:FactionType|null|undefined){return !!a&&a!=='Independent'&&a===b;}
export function hateIsBlocked(graph:CourtGraph,from:string,to:string){const edge=courtRelation(graph,from,to);return !!edge.pledge||sameFormalFaction(graph.nodes[from]?.faction,graph.nodes[to]?.faction);}
export function hasOutgoingPledge(graph:CourtGraph,from:string){return Object.entries(graph.edges[from]??{}).find(([,edge])=>edge.pledge)?.[0]??null;}
export function mayPledge(graph:CourtGraph,from:string,to:string){
 if(from===to||!graph.nodes[from]||!graph.nodes[to])return false;
 const current=hasOutgoingPledge(graph,from);if(current&&current!==to)return false;
 const seen=new Set([from]);let cursor:string|null=to;
 while(cursor){if(seen.has(cursor))return false;seen.add(cursor);cursor=hasOutgoingPledge(graph,cursor);}
 return true;
}
export function updateCourtNode(graph:CourtGraph,id:string,patch:Partial<Omit<CourtNode,'id'>>):CourtGraph {
 const node=graph.nodes[id];if(!node)throw Error(`Unknown court node: ${id}`);
 const next={...node,...patch,id};if(JSON.stringify(next)===JSON.stringify(node))return graph;
 return{...graph,revision:graph.revision+1,nodes:{...graph.nodes,[id]:next}};
}
/** One authoritative relationship reducer. No rewards, RNG, actor calls, or UI effects. */
export function reduceCourtRelation(graph:CourtGraph,from:string,to:string,command:RelationshipCommand,season:number):{graph:CourtGraph;relation:CourtRelation;newlyPledged:boolean} {
 if(from===to||!graph.nodes[from]||!graph.nodes[to])throw Error('Relationship endpoints must be distinct existing nodes');
 if(!Number.isSafeInteger(season)||season<1)throw Error('Invalid relationship season');
 const before=courtRelation(graph,from,to),next={...before};const immune=hateIsBlocked(graph,from,to);
 const finite=(n:number)=>{if(!Number.isFinite(n))throw Error('Non-finite relationship mutation');return n;};
 let requestedPledge=false;
 switch(command.kind){
 case 'gift':next.support=clamp(finite(command.support));if(!immune)next.hate=clamp(next.hate+Math.max(0,-finite(command.negativeDelta)));requestedPledge=command.formPledge&&next.support>=100;break;
 case 'support':next.support=clamp(next.support+finite(command.amount));requestedPledge=command.formPledge&&next.support>=100;break;
 case 'withdraw':if(!next.pledge&&next.support>=finite(command.threshold))next.support=clamp(command.threshold-1);break;
 case 'hate':if(!immune)next.hate=clamp(next.hate+Math.max(0,finite(command.amount)));break;
 case 'spit':next.support=clamp(next.support-20);if(!immune)next.hate=100;break;
 case 'rivalry':if(!next.pledge&&next.support>=finite(command.threshold))next.support=clamp(command.threshold-1);if(!immune)next.hate=clamp(next.hate+Math.max(0,finite(command.amount)));break;
 case 'pledge':requestedPledge=true;break;
 case 'affection':next.affection=clamp(next.affection+finite(command.amount));break;
 case 'romance':next.romance=command.accepted?{formedSeason:season,source:'accepted'}:null;break;
 case 'jealousy':if(graph.nodes[from].kind==='courtier'&&graph.nodes[to].kind==='courtier'&&graphLovers(graph,from).some(id=>graphLovers(graph,to).includes(id)))next.hate=clamp(next.hate+Math.max(0,finite(command.amount)));break;
 }
 if(requestedPledge&&!next.pledge){if(!mayPledge(graph,from,to))throw Error('Pledge would create a self-edge, cycle, or second patron');next.pledge={formedSeason:season,source:command.kind==='pledge'?(command.source??'explicit'):'earned'};next.hate=0;}
 const newlyPledged=!before.pledge&&!!next.pledge;
 let updated:CourtGraph={...graph,revision:graph.revision+1,edges:{...graph.edges,[from]:{...graph.edges[from],[to]:next}}};
 // A binding pledge to the player follows their formal faction. Other pledges
 // never recurse or grant transitive allegiance.
 if(newlyPledged&&to===PLAYER_NODE&&graph.nodes[PLAYER_NODE].faction)updated=updateCourtNode(updated,from,{faction:graph.nodes[PLAYER_NODE].faction});
 return{graph:updated,relation:next,newlyPledged};
}
export function setPlayerGraphFaction(graph:CourtGraph,faction:FactionType|null):CourtGraph {
 let result=updateCourtNode(graph,PLAYER_NODE,{faction});
 for(const name of Object.keys(graph.nodes))if(name!==PLAYER_NODE&&courtRelation(graph,name,PLAYER_NODE).pledge&&faction)result=updateCourtNode(result,name,{faction});
 return result;
}
export function graphTies(graph:CourtGraph,id:string){return Object.entries(graph.edges[id]??{}).map(([to,relation])=>({from:id,to,...relation}));}
export function graphBackers(graph:CourtGraph,to:string,threshold:number){return Object.keys(graph.nodes).filter(from=>from!==to&&graph.nodes[from].status==='living'&&courtRelation(graph,from,to).support>=threshold);}
export function graphPledgedTo(graph:CourtGraph,to:string){return Object.keys(graph.nodes).filter(from=>from!==to&&graph.nodes[from].status==='living'&&!!courtRelation(graph,from,to).pledge);}
export function scheduledOverlap(a:string,b:string,season:number){return [0,.25,.5,.75].filter(p=>scheduledNpcZone(a,season,p)===scheduledNpcZone(b,season,p)).length/4;}
/** A separate seeded stream creates bounded beta exceptions, never live AI calls.
 * Missing pairs are neutral. Each NPC retains at most four strong outgoing ties;
 * player incoming edges are always explicit, and player feelings are never inferred. */
export function createCourtGraph(people:readonly GraphPerson[],seed:number,playerFaction:FactionType|null=null,expelled:Record<string,unknown>={}):CourtGraph {
 const graph:CourtGraph={version:2,seed:graphSeed(seed),revision:0,nodes:{[PLAYER_NODE]:{id:PLAYER_NODE,kind:'player',office:'player',faction:playerFaction,status:'living'},[EMPEROR_NODE]:{id:EMPEROR_NODE,kind:'emperor',office:'emperor',faction:'Imperial',status:'living'}},edges:{}};
 const random=campaignRandom(graph.seed);const ordered=[...people].sort((a,b)=>a.name.localeCompare(b.name));
 const personByName=new Map(ordered.map(p=>[p.name,p]));
 for(const p of ordered){const vectors=p.personalityVectors??p.vectors;const faction=p.formalFaction??(vectors?assignCharacterFaction({...p,type:p.type??'side',personalityVectors:vectors} as any):null);graph.nodes[p.name]={id:p.name,kind:'courtier',office:courtArchetype(p.name)??'courtier',faction,status:expelled[p.name]?'expelled':'living'};graph.edges[p.name]={[PLAYER_NODE]:{affection:Math.max(0,Math.min(100,(p.relationshipVectors?.loveForPlayer??0)*100)),romance:null,support:p.supportLevel??0,hate:p.hate??0,pledge:p.hasGivenAllegiance?{formedSeason:null,source:'legacy'}:null}};}
 for(const from of Object.keys(graph.nodes).filter(id=>id!==PLAYER_NODE).sort()){
  const candidates:Array<{to:string;relation:CourtRelation}>=[];
  for(const to of Object.keys(graph.nodes).filter(id=>id!==PLAYER_NODE&&id!==from).sort()){
   const a=graph.nodes[from],b=graph.nodes[to],av=personByName.get(from)?.personalityVectors??personByName.get(from)?.vectors,bv=personByName.get(to)?.personalityVectors??personByName.get(to)?.vectors;
   const same=sameFormalFaction(a.faction,b.faction),competition=a.office===b.office,overlap=scheduledOverlap(from,to,1);
   const compatibility=av&&bv?1-Math.abs(av.ambition-bv.ambition):.5;
   let support=12+(same?15:0)+overlap*12+compatibility*10-(competition?8:0)+(random.next()-.5)*30;
   let hate=same?0:Math.max(0,(competition?14:0)+(a.faction==='Rebel'&&b.faction==='Imperial'?14:0)+(random.next()-.5)*28);
   const exception=random.next();if(exception<.06)support+=35+random.next()*20;else if(exception>.96&&!same)hate+=35+random.next()*20;
   support=clamp(support);hate=clamp(hate);if(support>=38||hate>=30)candidates.push({to,relation:{support,hate,pledge:null,affection:0,romance:null}});
  }
  candidates.sort((a,b)=>Math.max(b.relation.support,b.relation.hate)-Math.max(a.relation.support,a.relation.hate)||a.to.localeCompare(b.to));
  for(const c of candidates.slice(0,4))(graph.edges[from]??={})[c.to]=c.relation;
 }
 // Migrated pledges follow the existing actual faction without replaying events.
 return setPlayerGraphFaction(graph,playerFaction);
}

export function assertCourtGraph(value:unknown,expectedIds:readonly string[],season:number,legacyRomance=false):asserts value is CourtGraph {
 const object=(x:any)=>!!x&&typeof x==='object'&&!Array.isArray(x),valid=(ok:unknown,why:string)=>{if(!ok)throw Error(`Invalid court graph: ${why}`);};
 const g=value as CourtGraph;valid(object(g)&&(g.version===2||legacyRomance&&g.version===1)&&Number.isSafeInteger(g.seed)&&g.seed>=0&&g.seed<=0xffffffff&&Number.isSafeInteger(g.revision)&&g.revision>=0,'header');
 valid(object(g.nodes)&&object(g.edges),'containers');const ids=new Set(expectedIds);valid(Object.keys(g.nodes).length===ids.size&&Object.keys(g.nodes).every(id=>ids.has(id)),'node identities');
 for(const [id,n] of Object.entries(g.nodes)){valid(object(n)&&n.id===id&&n.kind===(id===PLAYER_NODE?'player':id===EMPEROR_NODE?'emperor':'courtier')&&typeof n.office==='string'&&['living','expelled','deceased'].includes(n.status)&&(n.faction===null||['Rebel','Imperial','Loyalist','Independent'].includes(n.faction)),'node attributes');}
 for(const [from,edges] of Object.entries(g.edges)){
  valid(ids.has(from)&&object(edges),'edge source');let pledged=0;
  for(const [to,r] of Object.entries(edges)){
   valid(from!==to&&ids.has(to)&&object(r)&&Number.isFinite(r.support)&&r.support>=0&&r.support<=100&&Number.isFinite(r.hate)&&r.hate>=0&&r.hate<=100,'edge endpoints or weights');
   valid(r.pledge===null||object(r.pledge)&&['earned','legacy','explicit'].includes(r.pledge.source)&&((r.pledge.formedSeason===null&&r.pledge.source==='legacy')||(Number.isSafeInteger(r.pledge.formedSeason)&&r.pledge.formedSeason!>=1&&r.pledge.formedSeason!<=season)),'pledge metadata');
   if(!legacyRomance){valid(Number.isFinite(r.affection)&&r.affection>=0&&r.affection<=100,'affection');valid(r.romance===null||object(r.romance)&&['accepted','legacy'].includes(r.romance.source)&&Number.isSafeInteger(r.romance.formedSeason)&&r.romance.formedSeason>=1&&r.romance.formedSeason<=season,'romance metadata');if(r.romance){valid(authoredRomancePairEligibility(from,to,g.nodes[PLAYER_NODE]?.office).allowed,'authored adult nonfamily romance');valid(!!g.edges[to]?.[from]?.romance&&g.edges[to][from].romance!.formedSeason===r.romance.formedSeason&&g.edges[to][from].romance!.source===r.romance.source,'mutual accepted romance');}}
   if(r.pledge)pledged++;
  }
  valid(pledged<=1,'multiple pledge beneficiaries');
 }
 for(const id of ids){const seen=new Set<string>();let cursor:string|null=id;while(cursor){valid(!seen.has(cursor),'pledge cycle');seen.add(cursor);cursor=hasOutgoingPledge(g,cursor);}}
}

/** Accepted romance is mutual; affection remains directed and politics independent. */
export function graphLovers(graph:CourtGraph,id:string):string[]{return Object.keys(graph.nodes).filter(to=>to!==id&&graph.nodes[to].status==='living'&&graph.nodes[id]?.status==='living'&&!!courtRelation(graph,id,to).romance&&!!courtRelation(graph,to,id).romance).sort();}
export function setRomancePair(graph:CourtGraph,a:string,b:string,accepted:boolean,season:number):CourtGraph {
 let next=reduceCourtRelation(graph,a,b,{kind:'romance',accepted},season).graph;return reduceCourtRelation(next,b,a,{kind:'romance',accepted},season).graph;
}
/** Upgrade only new metadata; preserve every old edge and no random/reward draws. */
export function migrateGraphRomance(graph:CourtGraph,legacyLove:Record<string,number>):CourtGraph {
 const edges: CourtGraph['edges']={};for(const [from,ties]of Object.entries(graph.edges)){edges[from]={};for(const [to,edge]of Object.entries(ties))edges[from][to]={...edge,affection:edge.affection??(to===PLAYER_NODE?(legacyLove[from]??0)*100:0),romance:edge.romance??null};}
 return{...graph,version:2,edges};
}

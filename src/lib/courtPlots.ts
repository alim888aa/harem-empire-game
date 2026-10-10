import {campaignRandom} from './campaignRandom';
import { rankIndex } from './career';
import {PLAYER_NODE,courtRelation,graphLovers,graphPledgedTo,hateIsBlocked,scheduledOverlap,updateCourtNode,type CourtGraph} from './courtGraph';
import {romancePairEligibility} from './courtRomance';
/** Missing target is the legacy player-directed plot. Player plots retain their old shape. */
export type CourtPlot={attacker:string;target?:string;warnedSeason:number;dueSeason:number};
export type PlotEvent={kind:'warning'|'defused'|'casualty'|'player_death';season:number;attacker:string;target?:string;victim?:string;reason:string;deathMethod?:string};
export type CourtPlots={version:1;lastProcessedSeason:number;pending:Record<string,CourtPlot>;nextWarningSeason:Record<string,number>;events:PlotEvent[]};
export type DeceasedCourtier={name:string;season:number;attacker:string;reason:string;deathMethod?:string};
export const DEATH_METHODS=[
 'Poisoned tea at a very polite meeting.',
 'A suspiciously loose balcony railing.',
 'A chandelier that fell right on cue.',
 'A poisoned mooncake, with compliments.',
 'A staircase with one step too few.',
 'An assassin disguised as the entertainment.',
] as const;
/** Cosmetic deterministic draw: never advances the gameplay random stream. */
export function deathMethodFor(seed:number,season:number,attacker:string,victim:string):string {
 let hash=(seed^0x811c9dc5)>>>0;for(const c of `${season}:${attacker}:${victim}`)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 return DEATH_METHODS[hash%DEATH_METHODS.length];
}
export type PlotSituation={graph:CourtGraph;role:string|null;rank:string|null;playerInfluence:number;influenceByName:Record<string,number>};
export const emptyCourtPlots=(season=1):CourtPlots=>({version:1,lastProcessedSeason:season,pending:{},nextWarningSeason:{},events:[]});
/** An attacker can threaten the player and multiple romantic rivals independently. */
export function courtPlotKey(attacker:string,target=PLAYER_NODE):string {return target===PLAYER_NODE?attacker:`${attacker}->${target}`;}
const targetFields=(target:string)=>target===PLAYER_NODE?{}:{target};
function eligiblePlotter(s:PlotSituation,name:string,target:string):boolean {
 const n=s.graph.nodes[name],influence=s.influenceByName[name];
 if(!n||n.kind!=='courtier'||n.status!=='living'||!Number.isFinite(influence))return false;
 if(target===PLAYER_NODE)return s.graph.nodes[PLAYER_NODE].status==='living'&&rankIndex(s.role,s.rank)>=1&&courtRelation(s.graph,name,PLAYER_NODE).hate>=80&&!hateIsBlocked(s.graph,name,PLAYER_NODE);
 const rival=s.graph.nodes[target];
 if(!rival||rival.kind!=='courtier'||!Number.isFinite(s.influenceByName[target])||!romancePairEligibility(s.graph,name,target).allowed||courtRelation(s.graph,name,target).hate<80)return false;
 // Jealousy is personal. Same-faction membership and pledges to the player do
 // not erase it; player-directed plots retain their existing political immunity.
 const rivalsLovers=new Set(graphLovers(s.graph,target));
 return graphLovers(s.graph,name).some(lover=>rivalsLovers.has(lover)&&romancePairEligibility(s.graph,name,lover).allowed&&romancePairEligibility(s.graph,target,lover).allowed);
}
const targetInfluence=(s:PlotSituation,target:string)=>target===PLAYER_NODE?s.playerInfluence:s.influenceByName[target];
/** A new plot requires an advantage; an active plot stops only after that advantage is beaten. */
export function canPlot(s:PlotSituation,name:string,target=PLAYER_NODE):boolean {return eligiblePlotter(s,name,target)&&s.influenceByName[name]>targetInfluence(s,target);}
export function canContinuePlot(s:PlotSituation,name:string,target=PLAYER_NODE):boolean {return eligiblePlotter(s,name,target)&&s.influenceByName[name]>=targetInfluence(s,target);}
/** Legacy name retained for callers: values are pending record keys, not attacker IDs. */
export function defusedPlotNames(s:PlotSituation,plots:CourtPlots){return Object.keys(plots.pending).filter(key=>{const plot=plots.pending[key];return !canContinuePlot(s,plot.attacker,plot.target??PLAYER_NODE);}).sort();}
/** Smallest one-decimal target which strictly exceeds the attacker's exact influence. */
export function safePlotInfluencePercent(influence:number):string {return ((Math.floor(influence*1000)+1)/10).toFixed(1);}
export function cancelDefusedPlots(s:PlotSituation,plots:CourtPlots,season:number):CourtPlots {
 const canceled=defusedPlotNames(s,plots);if(!canceled.length)return plots;
 const pending={...plots.pending};const events=[...plots.events];
 for(const key of canceled){const plot=pending[key];delete pending[key];events.push({kind:'defused',season,attacker:plot.attacker,...targetFields(plot.target??PLAYER_NODE),reason:'The attacker no longer has both the motive and the power to act.'});}
 return{...plots,pending,events:events.slice(-40)};
}
export function victimWeight(graph:CourtGraph,attacker:string,victim:string,season:number){
 const edge=courtRelation(graph,attacker,victim),overlap=scheduledOverlap(attacker,victim,season);
 const weight=(1+edge.hate/50-edge.support*.0065+overlap*.5)*(edge.pledge? .25:1);
 return Math.max(.2,Math.min(4,weight));
}
export function weightedVictim(graph:CourtGraph,attacker:string,candidates:readonly string[],season:number,draw:number):string {
 if(!candidates.length||!Number.isFinite(draw)||draw<0||draw>=1)throw Error('Invalid weighted victim draw');
 const ordered=[...candidates].sort(),weights=ordered.map(name=>victimWeight(graph,attacker,name,season)),total=weights.reduce((a,b)=>a+b,0);let cursor=draw*total;
 for(let i=0;i<ordered.length;i++){cursor-=weights[i];if(cursor<0)return ordered[i];}return ordered[ordered.length-1];
}
function reasonForVictim(graph:CourtGraph,attacker:string,victim:string,season:number,target:string){
 const edge=courtRelation(graph,attacker,victim);
 if(edge.hate>=30)return 'An existing personal rivalry made this ally a likelier target.';
 if(scheduledOverlap(attacker,victim,season)>=.5)return 'Their frequent contact in the palace made this ally a likelier target.';
 if(edge.support>=60||edge.pledge)return 'An existing friendship reduced the risk, but did not eliminate it.';
 return target===PLAYER_NODE?'The attacker targeted one of your pledged allies.':`The attacker targeted one of ${target}'s pledged protectors.`;
}
/** One committed season boundary. No rendering/presence dependency, no chance-to-kill roll.
 * Due attempts are resolved before new warnings, and every attempt rechecks the
 * living graph so neither a target nor a protector can be killed twice. */
export function resolveCourtSeason(s:PlotSituation,plots:CourtPlots,season:number,rngState:number){
 if(!Number.isSafeInteger(season)||season<1)throw Error('Invalid plot season');
 if(season<=plots.lastProcessedSeason)return{graph:s.graph,plots,rngState,casualties:[] as DeceasedCourtier[],playerDeath:null as PlotEvent|null};
 let graph=s.graph;const cleared=cancelDefusedPlots(s,plots,season),pending={...cleared.pending},nextWarningSeason={...cleared.nextWarningSeason},events=[...cleared.events],casualties:DeceasedCourtier[]=[];
 const random=campaignRandom(rngState);let playerDeath:PlotEvent|null=null;
 const due=Object.entries(pending).filter(([,p])=>p.dueSeason<=season).sort(([,a],[,b])=>a.dueSeason-b.dueSeason||a.attacker.localeCompare(b.attacker)||(a.target??PLAYER_NODE).localeCompare(b.target??PLAYER_NODE));
 for(const [key,plot] of due){
  const target=plot.target??PLAYER_NODE;delete pending[key];
  if(!canContinuePlot({...s,graph},plot.attacker,target)){events.push({kind:'defused',season,attacker:plot.attacker,...targetFields(target),reason:target===PLAYER_NODE?'The plot lost its eligible attacker.':'The plot lost its eligible attacker or target.'});continue;}
  delete nextWarningSeason[key];
  const allies=graphPledgedTo(graph,target).filter(name=>graph.nodes[name].kind==='courtier'&&name!==plot.attacker);
  if(!allies.length&&target===PLAYER_NODE){playerDeath={kind:'player_death',season,attacker:plot.attacker,reason:'No living pledged ally remained to shield you.'};events.push(playerDeath);graph=updateCourtNode(graph,PLAYER_NODE,{status:'deceased'});break;}
  const victim=allies.length?weightedVictim(graph,plot.attacker,allies,season-1,random.next()):target;
  const reason=allies.length?reasonForVictim(graph,plot.attacker,victim,season-1,target):'No living pledged protector remained to shield this romantic rival.';
  const deathMethod=deathMethodFor(rngState,season,plot.attacker,victim);
  casualties.push({name:victim,season,attacker:plot.attacker,reason,deathMethod});events.push({kind:'casualty',season,attacker:plot.attacker,...targetFields(target),victim,reason,deathMethod});graph=updateCourtNode(graph,victim,{status:'deceased'});
  if(victim!==target)pending[key]={...plot,dueSeason:season+1};
 }
 if(playerDeath)for(const key of Object.keys(pending))delete pending[key];
 if(!playerDeath){
  // A later death can remove an earlier attacker's motive (or the attacker).
  // Clear those continuing warnings before persisting the new season.
  for(const key of defusedPlotNames({...s,graph},{...cleared,pending})){
   const plot=pending[key];delete pending[key];events.push({kind:'defused',season,attacker:plot.attacker,...targetFields(plot.target??PLAYER_NODE),reason:'The attacker no longer has both the motive and the power to act.'});
  }
  const names=Object.keys(s.influenceByName).sort();
  for(const attacker of names)for(const target of [PLAYER_NODE,...names]){
   const key=courtPlotKey(attacker,target);
   if(!pending[key]&&canPlot({...s,graph},attacker,target)){
    pending[key]={attacker,...targetFields(target),warnedSeason:season,dueSeason:season+1};events.push({kind:'warning',season,attacker,...targetFields(target),reason:target===PLAYER_NODE?'A more influential enemy is preparing an attempt for next season.':`A more influential romantic rival is preparing an attempt on ${target} for next season.`});
   }
  }
 }
 return{graph,plots:{version:1 as const,lastProcessedSeason:season,pending,nextWarningSeason,events:events.slice(-40)},rngState:random.state,casualties,playerDeath};
}

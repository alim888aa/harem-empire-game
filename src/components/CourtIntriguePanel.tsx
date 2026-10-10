import CourtPlotWarning from './CourtPlotWarning';
import {type CourtPlots,type DeceasedCourtier} from '../lib/courtPlots';
import {graphPledgedTo,PLAYER_NODE,type CourtGraph} from '../lib/courtGraph';
export default function CourtIntriguePanel({plots,graph,influence,influences,deceased,joinableFactions=[]}:{plots?:CourtPlots;graph?:CourtGraph;influence:number;influences:Record<string,number>;deceased?:Record<string,DeceasedCourtier>;joinableFactions?:string[]}){
 const pending=Object.values(plots?.pending??{}).sort((a,b)=>a.dueSeason-b.dueSeason||a.attacker.localeCompare(b.attacker));
 const allies=graph?graphPledgedTo(graph,PLAYER_NODE).filter(name=>graph.nodes[name].kind==='courtier'):[];
 const recent=(plots?.events??[]).filter(e=>e.kind!=='warning').slice(-5).reverse();
 return <section className="court-intrigue" aria-label="Court intrigue">
  <h3>Court intrigue</h3><p>{allies.length} living pledged {allies.length===1?'ally':'allies'} can shield you.</p>
  {pending.length > 0 ? <div>{pending.map(plot =>
    <article key={`${plot.attacker}->${plot.target ?? PLAYER_NODE}`}>
      <CourtPlotWarning plot={plot} graph={graph} influence={influence} influences={influences}
        joinableFactions={joinableFactions}/>
    </article>)}
  </div> : <p>No active assassination warnings.</p>}
  <details className="court-guide"><summary>Plot rules</summary><p>From middle rank onward, outside-faction enemies at 80 hate can start a plot while more influential than you. The first attempt has a full season of warning. An unresolved plot then strikes every season, once per attacker. Pledges, shared faction, loss of hate or rank eligibility, and a departed attacker can end it. Every living pledged ally, including those in other palaces, can be targeted; relationships and shared schedules affect the choice.</p></details>
  {recent.length>0&&<ul>{recent.map((e,i)=><li key={`${e.season}-${e.attacker}-${i}`}><strong>Season {e.season}: </strong>{e.kind==='casualty'?e.target&&e.target!==PLAYER_NODE?`${e.victim===e.target?`${e.victim} was killed`:`${e.victim} died shielding ${e.target}`} by ${e.attacker}’s romantic-rival plot. `:`${e.victim} died shielding you from ${e.attacker}. `:e.kind==='defused'?`${e.attacker}'s plot was defused. `:`${e.attacker}'s attempt succeeded. `}{e.deathMethod&&<span>{e.deathMethod}</span>}</li>)}</ul>}
  {!!Object.keys(deceased??{}).length&&<details><summary>Remember the fallen ({Object.keys(deceased!).length})</summary><ul>{Object.values(deceased!).map(d=><li key={d.name}>{d.name} · season {d.season} · killed by {d.attacker}{d.deathMethod&&<> · {d.deathMethod}</>}</li>)}</ul></details>}
 </section>;
}

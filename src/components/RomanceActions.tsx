import {courtRelation,PLAYER_NODE,type CourtGraph} from '../lib/courtGraph';
import {romanceAcceptanceThreshold,romancePairEligibility,romanceWitnessRisk,type RomanceAction,type RomanceWitness} from '../lib/courtRomance';
import type {Character} from '../types/character';
export default function RomanceActions({character,graph,role,zone,witnesses,pending,onAction}:{character:Character;graph:CourtGraph;role:string|null;zone:string;witnesses:RomanceWitness[];pending:boolean;onAction:(action:RomanceAction)=>void}){
 const gate=romancePairEligibility(graph,PLAYER_NODE,character.name),feelings=courtRelation(graph,character.name,PLAYER_NODE),threshold=romanceAcceptanceThreshold(role);
 const isLover=!!feelings.romance;
 return <details className="romance-actions" open={isLover||feelings.affection>0||undefined}>
  <summary>Romance · {isLover?'Lovers':`${feelings.affection}/100 affection`}</summary>
  {!gate.allowed?<p>{gate.reason}</p>:<>
   <p>Romantic gifts add 15 affection and use your gift budget. A relationship needs their acceptance at {threshold} affection and less than 60 hate. Politics stay separate.</p>
   <RomanceRisk role={role} zone={zone} witnesses={witnesses}/>
   <div className="romance-buttons">
    {isLover?<button type="button" disabled={pending} onClick={()=>onAction('end')}>End romance</button>:<button type="button" disabled={pending} onClick={()=>onAction('propose')}>Ask to be lovers</button>}
   </div>
   {!isLover&&feelings.affection<threshold&&<small>They’ll refuse at the current {feelings.affection} affection. A proposal still attracts witnesses.</small>}
   <small>Multiple lovers are allowed. Partners who share a lover gain 20 mutual hate when romance starts, then 10 per season. At 80 hate, a stronger rival can plot murder after a full season of warning.</small>
  </>}
 </details>;
}

export function RomanceRisk({role,zone,witnesses}:{role:string|null;zone:string;witnesses:RomanceWitness[]}){
 const risk=romanceWitnessRisk(role,zone,witnesses),reports=risk.filter(w=>w.reports);
 return <>   {role==='concubine'&&<div className={`romance-risk ${reports.length?'danger-text':''}`} role="status">
    {risk.length?<>Each romantic gift or proposal adds 10% suspicion to: {risk.map(w=>`${w.name} (${Math.round(w.suspicion*100)}% → ${Math.min(100,Math.round((w.suspicion+w.delta)*100))}%)`).join(', ')}. {reports.length?<strong>{reports.map(w=>w.name).join(', ')} will report you. One report ends your Concubine campaign.</strong>:'Pledged allies are exempt; every other faction can witness it.'}</>:<>No unpledged witnesses here. Pledged allies are exempt.</>}
   </div>}</>;
}

import { promotionRequirement } from '../lib/career';
import type { FactionSystem } from "../lib/factionSystem";
interface CourtBriefingProps {
  role:string|null; influence:number; remaining?:number; support: number;
  deferred: boolean;
  consolidation?:{completed:number;total:number;remaining:number}|null;
  rank: string | null;
  factionSystem: FactionSystem;
  onFactionsClick: () => void;
}
export default function CourtBriefing({ role,influence,remaining,support, deferred, consolidation, rank, factionSystem, onFactionsClick }: CourtBriefingProps) {
  const invited = !factionSystem.playerFaction && factionSystem.membershipOffers.length > 0;
  const next=promotionRequirement(role,rank);
  const goal = deferred ? "Return to the Emperor next season" : invited ? "A faction invitation awaits" : next
    ? `Promotion · ${support}/${next.globalSupport} global · ${Math.round(influence*100)}/${Math.round(next.influence*100)} influence · ${remaining??"—"} seasons left`
    : consolidation&&consolidation.remaining>0 ? `Consolidate your rule: ${consolidation.completed}/${consolidation.total} seasons · ${remaining??"—"} before your deadline`
    : !factionSystem.playerFaction ? "Join a faction to shape your ending"
    : `${factionSystem.playerFaction} · Seek an imperial audience`;
  return <div className="court-goal" aria-label="Current goal">
    <span>{goal}</span>
    {invited && <button onClick={onFactionsClick}>View invitation →</button>}
  </div>;
}

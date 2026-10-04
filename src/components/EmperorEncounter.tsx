import {tributeCost} from '../lib/campaignBalance';

interface EmperorEncounterProps {
  onGiveGift: () => void;
  onRefuse: () => void;
  giftsRemaining: number;
  role?:string|null;
  rank?:string|null;
  arrived?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onContinueIn2D?: () => void;
}

function EmperorEncounter({ onGiveGift, onRefuse, giftsRemaining, role=null, rank=null, arrived = true, loading = false, error = false, onRetry, onContinueIn2D }: EmperorEncounterProps) {
  const cost=tributeCost(role,rank);
  const affordable = giftsRemaining >= cost;
  return (
    <div className="emperor-encounter">
      <p className="emperor-eyebrow">An imperial summons</p>
      <h1>{arrived ? "The Emperor awaits your answer" : error ? "The Emperor’s character couldn’t load" : loading ? "Preparing the Emperor’s arrival" : "The Emperor approaches"}</h1>
      <p>The Emperor has noticed your growing influence. He demands tribute.</p>
      <div className="emperor-tribute-ledger" aria-label={`You have ${giftsRemaining} gifts remaining. The Emperor requires ${cost} gifts as tribute.`}>
        <div><span>Your gifts</span><strong>{giftsRemaining}</strong></div>
        <div><span>Tribute</span><strong>{cost}</strong></div>
      </div>
      {!arrived && <p className="emperor-silence" role="status">{error ? "Your encounter is safe and your season clock is paused." : loading ? "Loading the Emperor’s character. Your season clock is paused." : "The palace falls silent. Footsteps draw closer."}</p>}
      {!arrived && error && <div className="emperor-recovery"><button onClick={onRetry}>Retry Emperor</button><button onClick={onContinueIn2D}>Continue in 2D</button></div>}
      <div className="ui-btn-row">
        <button className="ui-btn ui-btn-gold" onClick={onGiveGift} disabled={!arrived || !affordable}>Give Tribute ({cost} gifts)</button>
        <button className="ui-btn ui-btn-primary" onClick={onRefuse} disabled={!arrived}>Refuse</button>
      </div>
      {!affordable && <p className="emperor-warning">You cannot afford tribute. Refusal is fatal unless the Emperor grants a loyalty-based pardon.</p>}
    </div>
  );
}

export default EmperorEncounter;

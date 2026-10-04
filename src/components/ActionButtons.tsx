import {RomanceRisk} from './RomanceActions';
import {courtRelation,PLAYER_NODE,type CourtGraph} from '../lib/courtGraph';
import {ROMANCE_BALANCE,romancePairEligibility,type RomanceWitness} from '../lib/courtRomance';
import {endorsementRenewal,type StandingRecovery} from '../lib/campaignStanding';
import {processGiftWithMessage} from '../lib/checkMessage';
import {giftPositiveScale} from '../lib/campaignBalance';
import { useState } from "react";
import type { Character } from "../types/character";
import type { PlayerStats, PlayerType } from "../types/game";
import { getInfluenceGating } from "../lib/influenceGating";
import { giftCost, previewMessage, signed, type MessageChoice } from "../lib/courtStrategy";
import { GIFT_MESSAGES, giftMessage } from "../lib/giftMessages";
interface ActionButtonsProps {
  graph:CourtGraph; zone:string; witnesses:RomanceWitness[]; onRomanticGift:()=>void;
  character: Character;
  gifts: number;
  playerStats: PlayerStats;
  playerType: PlayerType;
  rank?: string|null;
  pending?: boolean;
  giftError?: string;
  standing?:StandingRecovery;
  onAction: (action: "message" | "spit", messageType?: MessageChoice) => void;
}
export default function ActionButtons({graph,zone,witnesses,onRomanticGift,standing, character, gifts, playerStats, playerType, rank, pending = false, giftError = "", onAction }: ActionButtonsProps) {
  // Presentation-only choice. Selecting a tone never spends a gift; only Send does.
  const [choice, setChoice] = useState<"" | MessageChoice | "romantic">("");
  const gating = getInfluenceGating(character, playerStats, rank);
  const cost = giftCost(character);
  const canAfford = gifts >= cost;
  const availability = {
    ambitious: gating.canUseAmbitiousMessage,
    loyal: gating.canUseLoyalMessage,
    cautious: gating.canUseCautiousMessage,
    neutral: gating.canUseNeutralMessage,
  };
  const romantic=choice==="romantic";
  const romanceGate=romancePairEligibility(graph,PLAYER_NODE,character.name);
  const affectionGain=Math.round(Math.min(ROMANCE_BALANCE.giftAffection,100-courtRelation(graph,character.name,PLAYER_NODE).affection)*100)/100;
  const message = giftMessage(choice);
  const preview = message ? previewMessage(character, message.type, playerType, playerStats) : null;
  const renewal=message&&standing?endorsementRenewal(character,processGiftWithMessage(message.type,{...character.personalityVectors,suspicion:character.suspicion},character.relationshipVectors,playerType,playerStats,character.supportLevel,{positiveEffectScale:giftPositiveScale(character,playerStats.influence)}).supportDelta,playerType,standing):0;
  const allowed = romantic ? romanceGate.allowed : !!message && availability[message.type].allowed;
  if (!gating.canInteract.allowed) {
    const required = Math.max(0, character.personalityVectors.influence - 0.3);
    return <section className="action-panel locked-audience">
      <h3>They won’t receive you yet</h3>
      <p>Requires {Math.ceil(required * 100)}% influence. Yours is {Math.round(playerStats.influence * 100)}%.</p>
      <p>Choose a less influential courtier under People.</p>
    </section>;
  }
  return <section className="action-panel" aria-label={`Actions for ${character.name}`}>
    <form onSubmit={(event) => {
      event.preventDefault();
      if (canAfford && allowed && !pending) {
        if(romantic) onRomanticGift();
        else if(message) onAction("message", message.type);
      }
    }}>
      <label className="action-label" htmlFor="gift-tone">Choose your message</label>
      <select id="gift-tone" value={choice} disabled={pending} onChange={(event) => setChoice(event.target.value as typeof choice)}>
        <option value="" disabled>Choose a message…</option>
        <option value="romantic" disabled={!romanceGate.allowed}>Romantic message{!romanceGate.allowed ? " · unavailable" : ""}</option>
        {GIFT_MESSAGES.map((item) => <option key={item.type} value={item.type} disabled={!availability[item.type].allowed}>
          {item.title}{!availability[item.type].allowed ? " · locked" : ""}
        </option>)}
      </select>
      {romantic && <p className="selected-message">“I chose this just for you. You’ve been on my mind.”</p>}
      {romantic && <RomanceRisk role={playerType} zone={zone} witnesses={witnesses}/>}
      {message && <p className="selected-message">“{message.text}”</p>}
      <p className={`selected-effect ${preview?.dangerous ? "danger-text" : ""}`} aria-live="polite">
        {preview?.dangerous ? "High risk · " : ""}
        {romantic ? `+${affectionGain} affection · no political support` : preview ? `Next gift: ${signed(preview.support)} personal support${renewal>0?` · +${renewal} global renewal`:""}` : "Every gift includes one of these authored messages."}
        {preview && preview.suspicion !== 0 ? ` · ${signed(preview.suspicion)} suspicion` : ""}
      </p>
      <button className="send-gift" type="submit" disabled={pending || !canAfford || !allowed}>
        <span>{pending ? "Evaluating message…" : romantic ? "Send romantic gift" : "Send gift"}</span><span>{cost} ◇</span>
      </button>
      {!canAfford && <p className="action-notice" role="status">Not enough gifts. {gifts ? "Choose a cheaper courtier or start the next season." : "Start the next season to replenish them."}</p>}
      {message && !allowed && <p className="action-notice">{availability[message.type].reason}</p>}
      {giftError && <p className="action-notice" role="status">{giftError}</p>}
    </form>
    <details className="move-details">
      <summary>Effects & other actions</summary>
      <p>{preview ? "The response adds to or subtracts from existing support." : "Choose a message to preview its evaluated response."} Message fit, your role, relative influence and hostility determine support. A more influential recipient gains less from a positive gift; bad messages keep their full penalty. Previews show direct effects; nearby courtiers may react.</p>
      <div className="hostile-choice">
        <p>Insult: lose up to 20 support, gain {character.supportLevel === 0 ? "50" : "30"} suspicion. Costs no gifts.</p>
        <button type="button" disabled={pending || !gating.canSpitInFace.allowed} onClick={() => { if (!pending && gating.canSpitInFace.allowed) onAction("spit"); }}>Spit in Face</button>
        {!gating.canSpitInFace.allowed && <p>{gating.canSpitInFace.reason}</p>}
      </div>
    </details>
  </section>;
}

import {courtierGiftAmount} from '../lib/campaignBalance';
import {displayCharacterName} from '../lib/courtIdentity';
import type { Character } from "../types/character";
import FactionBadge from "./FactionBadge";
import { supportReward } from "../lib/courtStrategy";
interface CharacterInfoProps {
  character: Character;
  personality: string;
  canShowStats?: boolean;
  currentSeason?: number;
}
export default function CharacterInfo({ character, personality, canShowStats = false, currentSeason = 1 }: CharacterInfoProps) {
  const suspicionPercent = Math.round(character.suspicion * 100);
  const threshold = Math.round(character.suspicionThreshold * 100);
  const danger = character.suspicion >= character.suspicionThreshold * 0.75;
  return <section className="character-dossier" aria-label={`${displayCharacterName(character)} dossier`}>
    <div className="section-heading"><h1>{displayCharacterName(character)}</h1><FactionBadge character={character} size="small" /></div>
    <div className="relationship-meter">
      <div><span>Support</span><strong>{Math.round(character.supportLevel*10)/10}<small> / 100</small></strong></div>
      <small>{character.hasGivenAllegiance ? "Pledged ally" : character.supportLevel >= (character.supportThreshold ?? 80) ? "Supports your cause" : `Backing at ${character.supportThreshold ?? 80} · Allegiance at 100`}</small>
      <progress aria-label={`${displayCharacterName(character)} support`} value={character.supportLevel} max={100} />
    </div>
    <div className="relationship-meter affection-meter"><div><span>Affection</span><strong>{Math.round(character.relationshipVectors.loveForPlayer*100)}<small> / 100</small></strong></div><small>{character.isLover?'Accepted romance · Lover':'No accepted romance'}</small><progress aria-label={`${displayCharacterName(character)} affection`} value={character.relationshipVectors.loveForPlayer*100} max={100}/></div>
    <p className={`suspicion-line ${danger ? "danger-text" : ""}`}>
      {character.hasGivenAllegiance ? "Allegiance pledged · No suspicion" : <>Suspicion {suspicionPercent}%{danger ? ` · Near the ${threshold}% reporting limit` : ""}</>}
    </p>
    {!character.hasGivenAllegiance && (character.hate??0)>0 && <p className="danger-text">Hate {character.hate}/100 · {character.hate!>=60?"Enemy gifts earn only 10% of positive gains.":"Rivalry is growing; hostility begins at 60."} Bad messages add hate equal to their support loss.</p>}
    {canShowStats && <details className="dossier-details">
      <summary>About {displayCharacterName(character)}</summary>
      <p className="personality-hint">{personality}</p>
      <p>At {character.supportThreshold ?? 80} support, their backing grants +{supportReward(character)} global support. At 100, their allegiance grants it once more. Pledged allies do not gain suspicion and follow your faction.</p>
      {character.hasGivenAllegiance && <p>Binding allegiance: pledged to you. Personal fear is separate from that commitment.</p>}
      <dl>{[
        ["Fear of you", character.relationshipVectors.fearOfPlayer],
        ["Ambition", character.personalityVectors.ambition],
        ["Empire loyalty", character.personalityVectors.loyalty],
        ["Influence", character.personalityVectors.influence],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{Math.round(Number(value) * 100)}%</dd></div>)}</dl>
      {character.hasGivenAllegiance?<p className="gift-status">Sends {courtierGiftAmount(character.type)} gifts each season, even in another palace.</p>:character.hasGivenGifts && <p className="gift-status">{character.giftCooldownUntil > currentSeason ? `Their next gift can arrive in ${character.giftCooldownUntil - currentSeason} seasons.` : "Their gift cooldown has ended."}</p>}
    </details>}
  </section>;
}

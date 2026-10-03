import { getFactionInfo, getFactionComposition, type FactionType, type FactionSystem } from '../lib/factionSystem';
interface FactionPanelProps {
  displayNames?:Record<string,string>;
  factionSystem: FactionSystem;
  allCharacters: Record<string, any>;
  onJoinFaction?: (faction: FactionType) => void;
}
export default function FactionPanel({ displayNames={},factionSystem, allCharacters, onJoinFaction }: FactionPanelProps) {
  const composition = getFactionComposition(allCharacters);
  const factions: FactionType[] = ['Rebel', 'Imperial', 'Loyalist', 'Independent'];
  const threshold = Object.values(allCharacters)[0]?.getSnapshot()?.context?.supportThreshold ?? 80;
  const support = (name: string): number => allCharacters[name]?.getSnapshot()?.context?.supportLevel ?? 0;
  return <section aria-label="Political factions">
    <p className="faction-status">Your faction: <strong>{factionSystem.playerFaction || 'Unaffiliated'}</strong></p>
    {!factionSystem.playerFaction && factionSystem.membershipOffers.length > 0 && <div className="faction-offers">
      <p>An invitation awaits</p>
      {factionSystem.membershipOffers.map(({ faction }) => <div key={faction}><span>{faction}</span>
        <button onClick={() => onJoinFaction?.(faction)}>Join {faction}</button>
      </div>)}
    </div>}
    {factions.map((faction) => {
      const info = getFactionInfo(faction);
      const members = composition[faction] || [];
      const supporters = members.filter((name) => allCharacters[name]?.getSnapshot()?.context?.hasGivenAllegiance || support(name) >= threshold).length;
      return <details className="faction-card" key={faction}>
        <summary><span>{info.badge} {faction}</span><small>{faction === 'Independent' ? 'No ending' : `${supporters}/3 supporters`} · Details</small></summary>
        <p>{info.description}</p>
        {faction !== 'Independent' && <p>Three members at {threshold} support earn an invitation next season.</p>}
        <ul>{members.map((name) => <li key={name}><span>{displayNames[name]??name}</span><span>{support(name)} support</span></li>)}</ul>
      </details>;
    })}
  </section>;
}

import type { PlayerStats, PlayerReputation } from '../types/game';
import CourtDialog from './CourtDialog';
interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerStats: PlayerStats;
  playerReputation: PlayerReputation;
}
export default function StatsModal({ isOpen, onClose, playerStats, playerReputation }: StatsModalProps) {
  if (!isOpen) return null;
  const groups = [
    { title: 'Your character', values: [
      ['Influence', playerStats.influence], ['Ambition', playerStats.ambition],
      ['Empire loyalty', playerStats.loyalty], ['Fear', playerStats.fear], ['Charisma', playerStats.charisma],
    ] },
    { title: 'Court reputation', values: [
      ['Perceived loyalty', playerReputation.perceivedLoyalty],
      ['Perceived threat', playerReputation.perceivedThreat],
      ['Trustworthiness', playerReputation.trustworthiness], ['Political skill', playerReputation.politicalSkill],
    ] },
  ];
  return <CourtDialog title="Your stats" onClose={onClose}>
    {groups.map(({ title, values }) => <section key={title} className="stats-group">
      <h3>{title}</h3>
      <dl>{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{Math.round(Number(value) * 100)}%</dd></div>)}</dl>
    </section>)}
  </CourtDialog>;
}

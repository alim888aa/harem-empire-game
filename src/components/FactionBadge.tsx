import { getFactionInfo, assignCharacterFaction } from '../lib/factionSystem';
import type { Character } from '../types/character';

interface FactionBadgeProps {
  character: Character;
  size?: 'small' | 'medium' | 'large';
}

function FactionBadge({ character, size = 'medium' }: FactionBadgeProps) {
  const faction = assignCharacterFaction(character);
  const factionInfo = getFactionInfo(faction);

  const sizeClasses = {
    small: 'text-xs px-1 py-0.5',
    medium: 'text-sm px-2 py-1',
    large: 'text-base px-3 py-1.5'
  };

  const badgeSize = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-medium text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: factionInfo.color }}
      title={factionInfo.description}
    >
      <span className={badgeSize[size]}>{factionInfo.badge}</span>
      <span>{factionInfo.name}</span>
    </div>
  );
}

export default FactionBadge;

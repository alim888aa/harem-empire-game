import type { Character } from '../types/character';
import type { PlayerStats } from '../types/game';

export type FactionType = 'Rebel' | 'Imperial' | 'Loyalist' | 'Independent';

export interface FactionInfo {
  name: FactionType;
  memberCount: number;
  description: string;
  color: string;
  badge: string;
}

export interface FactionSystem {
  factions: Record<FactionType, string[]>; // character names
  playerFaction: FactionType | null;
  membershipOffers: {
    faction: FactionType;
    requiredMembers: number;
    supportThreshold: number;
  }[];
}

/**
 * Determines a character's faction based on their personality vectors
 */
export function assignCharacterFaction(character: Character): FactionType {
  const { ambition, loyalty, fear, influence } = character.personalityVectors;

  // Rebel faction: high ambition, low loyalty
  if (ambition >= 0.7 && loyalty <= 0.5) {
    console.log(`${character.name} assigned to Rebel faction (ambition: ${ambition}, loyalty: ${loyalty})`);
    return 'Rebel';
  }

  // Imperial faction: high loyalty, high influence
  if (loyalty >= 0.7 && influence >= 0.5) {
    console.log(`${character.name} assigned to Imperial faction (loyalty: ${loyalty}, influence: ${influence})`);
    return 'Imperial';
  }

  // Loyalist faction: high fear, high loyalty
  if (fear >= 0.5 && loyalty >= 0.5) {
    console.log(`${character.name} assigned to Loyalist faction (fear: ${fear}, loyalty: ${loyalty})`);
    return 'Loyalist';
  }

  // Default to Independent
  console.log(`${character.name} assigned to Independent faction (ambition: ${ambition}, loyalty: ${loyalty}, fear: ${fear}, influence: ${influence})`);
  return 'Independent';
}

/**
 * Gets faction information for UI display
 */
export function getFactionInfo(faction: FactionType): FactionInfo {
  const factionData: Record<FactionType, Omit<FactionInfo, 'memberCount'>> = {
    Rebel: {
      name: 'Rebel',
      description: 'Ambitious characters seeking change',
      color: '#dc2626', // red-600
      badge: '⚔️'
    },
    Imperial: {
      name: 'Imperial',
      description: 'Loyal and influential court members',
      color: '#7c3aed', // violet-600
      badge: '👑'
    },
    Loyalist: {
      name: 'Loyalist',
      description: 'Fearful but loyal supporters',
      color: '#059669', // emerald-600
      badge: '🛡️'
    },
    Independent: {
      name: 'Independent',
      description: 'Neutral characters',
      color: '#6b7280', // gray-500
      badge: '⚪'
    }
  };

  return {
    ...factionData[faction],
    memberCount: 0 // Will be filled by calling code
  };
}

/**
 * Calculates faction effects when player gains support with a character
 */
export function calculateFactionEffects(
  targetCharacter: Character,
  targetFaction: FactionType,
  allCharacters: Record<string, any>, // Character actors
  playerFaction: FactionType | null,
  supportGain: number
): {
  bonuses: Array<{ characterName: string; supportBonus: number; trustBonus: number }>;
  penalties: Array<{ characterName: string; supportPenalty: number; suspicionPenalty: number }>;
} {
  const bonuses: Array<{ characterName: string; supportBonus: number; trustBonus: number }> = [];
  const penalties: Array<{ characterName: string; supportPenalty: number; suspicionPenalty: number }> = [];

  // Only apply faction effects if player is in a faction
  if (!playerFaction || playerFaction === 'Independent') {
    return { bonuses, penalties };
  }

  // Get opposing factions
  const opposingFactions: Record<FactionType, FactionType[]> = {
    Rebel: ['Imperial', 'Loyalist'],
    Imperial: ['Rebel'],
    Loyalist: ['Rebel'],
    Independent: []
  };

  for (const [characterName, characterActor] of Object.entries(allCharacters)) {
    if (characterName === targetCharacter.name) continue;

    try {
      const characterSnapshot = characterActor.getSnapshot();
      if (!characterSnapshot?.context) continue;

      const character = characterSnapshot.context;
      const characterFaction = assignCharacterFaction({
        name: character.name,
        type: character.type,
        supportLevel: character.supportLevel,
        suspicion: character.suspicion,
        personalityVectors: character.personalityVectors,
        relationshipVectors: character.relationshipVectors,
        lastResponse: character.lastResponse,
        imgPath: character.imgPath,
        suspicionThreshold: character.suspicionThreshold,
        hasGivenGifts: character.hasGivenGifts || false,
        giftCooldownUntil: character.giftCooldownUntil || 0
      });

      // Faction member bonus - when you support someone from your faction, other faction members gain support
      if (playerFaction && characterFaction === playerFaction && targetFaction === playerFaction) {
        bonuses.push({
          characterName,
          supportBonus: 10,
          trustBonus: 0.2 // 20% increase
        });
      }

      // Opposition penalty - when you support anyone, opposing faction members lose support and gain suspicion
      if (playerFaction && opposingFactions[playerFaction]?.includes(characterFaction)) {
        penalties.push({
          characterName,
          supportPenalty: 10,
          suspicionPenalty: 0.2 // 20% increase
        });
      }
    } catch (error) {
      console.warn(`Failed to process faction effects for ${characterName}:`, error);
    }
  }

  return { bonuses, penalties };
}

/**
 * Checks if player should receive faction membership offers
 */
export function checkFactionMembershipOffers(
  factionSystem: FactionSystem,
  allCharacters: Record<string, any>
): FactionType[] {
  console.log('Checking faction membership offers...');
  const offers: FactionType[] = [];

  if (factionSystem.playerFaction) {
    console.log(`Player already in ${factionSystem.playerFaction} faction, no offers`);
    return offers; // Already in a faction
  }

  const factionSupport: Record<FactionType, { count: number; totalSupport: number }> = {
    Rebel: { count: 0, totalSupport: 0 },
    Imperial: { count: 0, totalSupport: 0 },
    Loyalist: { count: 0, totalSupport: 0 },
    Independent: { count: 0, totalSupport: 0 }
  };

  // Calculate support with each faction
  for (const [characterName, characterActor] of Object.entries(allCharacters)) {
    try {
      const characterSnapshot = characterActor.getSnapshot();
      if (!characterSnapshot?.context) continue;

      const character = characterSnapshot.context;
      const characterFaction = assignCharacterFaction({
        name: character.name,
        type: character.type,
        supportLevel: character.supportLevel,
        suspicion: character.suspicion,
        personalityVectors: character.personalityVectors,
        relationshipVectors: character.relationshipVectors,
        lastResponse: character.lastResponse,
        imgPath: character.imgPath,
        suspicionThreshold: character.suspicionThreshold,
        hasGivenGifts: character.hasGivenGifts || false,
        giftCooldownUntil: character.giftCooldownUntil || 0
      });

      if (character.supportLevel >= 80) {
        console.log(`${characterName} (${characterFaction}) has ${character.supportLevel} support - counts for faction offer`);
        factionSupport[characterFaction].count++;
        factionSupport[characterFaction].totalSupport += character.supportLevel;
      } else {
        console.log(`${characterName} (${characterFaction}) has ${character.supportLevel} support - not enough for faction offer`);
      }
    } catch (error) {
      console.warn(`Failed to check faction membership for ${characterName}:`, error);
    }
  }

  // Check for membership offers (3+ members at 80+ support)
  console.log('Faction support summary:', factionSupport);
  for (const [faction, data] of Object.entries(factionSupport)) {
    if (faction !== 'Independent' && data.count >= 3) {
      console.log(`${faction} faction qualifies for membership offer (${data.count} members with 80+ support)`);
      offers.push(faction as FactionType);
    } else if (faction !== 'Independent') {
      console.log(`${faction} faction does not qualify (${data.count} members with 80+ support, need 3)`);
    }
  }

  console.log(`Generated ${offers.length} faction offers:`, offers);
  return offers;
}

/**
 * Applies faction membership effects when player joins a faction
 */
export function applyFactionMembershipEffects(
  playerFaction: FactionType,
  allCharacters: Record<string, any>
): {
  bonuses: Array<{ characterName: string; supportBonus: number; trustBonus: number }>;
  penalties: Array<{ characterName: string; supportPenalty: number; suspicionPenalty: number }>;
} {
  console.log(`Applying faction membership effects for player joining ${playerFaction}`);

  const bonuses: Array<{ characterName: string; supportBonus: number; trustBonus: number }> = [];
  const penalties: Array<{ characterName: string; supportPenalty: number; suspicionPenalty: number }> = [];

  if (playerFaction === 'Independent') {
    console.log('Player joined Independent faction, no effects applied');
    return { bonuses, penalties };
  }

  // Get opposing factions
  const opposingFactions: Record<FactionType, FactionType[]> = {
    Rebel: ['Imperial', 'Loyalist'],
    Imperial: ['Rebel'],
    Loyalist: ['Rebel'],
    Independent: []
  };

  for (const [characterName, characterActor] of Object.entries(allCharacters)) {
    try {
      const characterSnapshot = characterActor.getSnapshot();
      if (!characterSnapshot?.context) continue;

      const character = characterSnapshot.context;
      const characterFaction = assignCharacterFaction({
        name: character.name,
        type: character.type,
        supportLevel: character.supportLevel,
        suspicion: character.suspicion,
        personalityVectors: character.personalityVectors,
        relationshipVectors: character.relationshipVectors,
        lastResponse: character.lastResponse,
        imgPath: character.imgPath,
        suspicionThreshold: character.suspicionThreshold,
        hasGivenGifts: character.hasGivenGifts || false,
        giftCooldownUntil: character.giftCooldownUntil || 0
      });

      // Faction member bonus - immediate trust boost with faction members
      if (characterFaction === playerFaction) {
        console.log(`${characterName} (${characterFaction}) gets faction bonus for joining same faction as player`);
        bonuses.push({
          characterName,
          supportBonus: 5, // Smaller immediate bonus
          trustBonus: 0.2 // 20% trust increase (0.2 = 20 percentage points)
        });
      }

      // Opposition penalty - immediate suspicion increase with opposing factions
      if (opposingFactions[playerFaction]?.includes(characterFaction)) {
        console.log(`${characterName} (${characterFaction}) gets faction penalty for opposing player's ${playerFaction} faction`);
        penalties.push({
          characterName,
          supportPenalty: 5, // Smaller immediate penalty
          suspicionPenalty: 0.2 // 20% suspicion increase (0.2 = 20 percentage points)
        });
      }
    } catch (error) {
      console.warn(`Failed to apply faction membership effects for ${characterName}:`, error);
    }
  }

  console.log(`Faction membership effects calculated: ${bonuses.length} bonuses, ${penalties.length} penalties`);
  console.log('Bonuses:', bonuses.map(b => `${b.characterName}: +${b.supportBonus} support, +${Math.round(b.trustBonus * 100)}% trust`));
  console.log('Penalties:', penalties.map(p => `${p.characterName}: -${p.supportPenalty} support, +${Math.round(p.suspicionPenalty * 100)}% suspicion`));

  return { bonuses, penalties };
}

/**
 * Gets current faction composition for UI display
 */
export function getFactionComposition(allCharacters: Record<string, any>): Record<FactionType, string[]> {
  const composition: Record<FactionType, string[]> = {
    Rebel: [],
    Imperial: [],
    Loyalist: [],
    Independent: []
  };

  for (const [characterName, characterActor] of Object.entries(allCharacters)) {
    try {
      const characterSnapshot = characterActor.getSnapshot();
      if (!characterSnapshot?.context) continue;

      const character = characterSnapshot.context;
      const characterFaction = assignCharacterFaction({
        name: character.name,
        type: character.type,
        supportLevel: character.supportLevel,
        suspicion: character.suspicion,
        personalityVectors: character.personalityVectors,
        relationshipVectors: character.relationshipVectors,
        lastResponse: character.lastResponse,
        imgPath: character.imgPath,
        suspicionThreshold: character.suspicionThreshold,
        hasGivenGifts: character.hasGivenGifts || false,
        giftCooldownUntil: character.giftCooldownUntil || 0
      });

      composition[characterFaction].push(characterName);
    } catch (error) {
      console.warn(`Failed to get faction for ${characterName}:`, error);
    }
  }

  return composition;
}
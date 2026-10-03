import type { Character } from '../types/character';
import { assignCharacterFaction, type FactionType } from './factionSystem';

export interface CrossCharacterEffect {
  characterName: string;
  suspicionChange: number;
  effectType: 'ambitious_faction' | 'spit_faction' | 'loyal_benefit';
}

/**
 * Calculates cross-character suspicion effects for ambitious messages
 * When player gives ambitious message to character with ambition >= 0.7,
 * all characters in opposing factions gain 0.1 suspicion
 */
export function calculateAmbitiousMessageEffects(
  targetCharacter: Character,
  allCharacters: Record<string, any>,
  _playerFaction: FactionType | null
): CrossCharacterEffect[] {
  const effects: CrossCharacterEffect[] = [];

  // Only apply if target has high ambition
  if (targetCharacter.personalityVectors.ambition < 0.7) {
    return effects;
  }

  const targetFaction = assignCharacterFaction(targetCharacter);
  
  // Get opposing factions based on target's faction
  const opposingFactions: Record<FactionType, FactionType[]> = {
    Rebel: ['Imperial', 'Loyalist'],
    Imperial: ['Rebel'],
    Loyalist: ['Rebel'],
    Independent: []
  };

  const targetOpposingFactions = opposingFactions[targetFaction] || [];

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

      // Characters in opposing factions to the target gain suspicion
      if (targetOpposingFactions.includes(characterFaction)) {
        effects.push({
          characterName,
          suspicionChange: 0.1,
          effectType: 'ambitious_faction'
        });
      }
    } catch (error) {
      console.warn(`Failed to calculate ambitious message effects for ${characterName}:`, error);
    }
  }

  return effects;
}

/**
 * Calculates cross-character suspicion effects for "spit in face" action
 * When player spits in face of character, all characters in that character's faction gain 0.1 suspicion
 */
export function calculateSpitInFaceEffects(
  targetCharacter: Character,
  allCharacters: Record<string, any>
): CrossCharacterEffect[] {
  const effects: CrossCharacterEffect[] = [];

  const targetFaction = assignCharacterFaction(targetCharacter);

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

      // Characters in same faction as target gain suspicion
      if (characterFaction === targetFaction && targetFaction !== 'Independent') {
        effects.push({
          characterName,
          suspicionChange: 0.1,
          effectType: 'spit_faction'
        });
      }
    } catch (error) {
      console.warn(`Failed to calculate spit in face effects for ${characterName}:`, error);
    }
  }

  return effects;
}

/**
 * Calculates cross-character suspicion benefits for loyal actions
 * When player performs loyal action, characters with loyalty >= 0.1 lose 0.05 suspicion
 */
export function calculateLoyalActionBenefits(
  allCharacters: Record<string, any>
): CrossCharacterEffect[] {
  const effects: CrossCharacterEffect[] = [];

  for (const [characterName, characterActor] of Object.entries(allCharacters)) {
    try {
      const characterSnapshot = characterActor.getSnapshot();
      if (!characterSnapshot?.context) continue;

      const character = characterSnapshot.context;

      // Characters with loyalty >= 0.1 lose suspicion
      if (character.personalityVectors.loyalty >= 0.1) {
        effects.push({
          characterName,
          suspicionChange: -0.05,
          effectType: 'loyal_benefit'
        });
      }
    } catch (error) {
      console.warn(`Failed to calculate loyal action benefits for ${characterName}:`, error);
    }
  }

  return effects;
}

/**
 * Applies cross-character effects to character actors
 */
export function applyCrossCharacterEffects(
  effects: CrossCharacterEffect[],
  allCharacters: Record<string, any>
): void {
  for (const effect of effects) {
    const characterActor = allCharacters[effect.characterName];
    if (characterActor) {
      characterActor.send({
        type: 'APPLY_SUSPICION_CHANGE',
        suspicionChange: effect.suspicionChange
      });
    }
  }
}

/**
 * Generates notification message for cross-character effects
 */
export function generateCrossCharacterNotification(effects: CrossCharacterEffect[]): string | null {
  if (effects.length === 0) return null;

  const ambitiousEffects = effects.filter(e => e.effectType === 'ambitious_faction');
  const spitEffects = effects.filter(e => e.effectType === 'spit_faction');
  const loyalEffects = effects.filter(e => e.effectType === 'loyal_benefit');

  const messages: string[] = [];

  if (ambitiousEffects.length > 0) {
    messages.push(`Your ambitious words have made ${ambitiousEffects.length} opposing faction members suspicious`);
  }

  if (spitEffects.length > 0) {
    messages.push(`Your insult has disturbed ${spitEffects.length} faction members`);
  }

  if (loyalEffects.length > 0) {
    messages.push(`Your loyal behavior has reduced suspicion among ${loyalEffects.length} characters`);
  }

  return messages.join('. ');
}

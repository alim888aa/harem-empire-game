import type { Character } from '../types/character';
import type { PlayerStats } from '../types/game';

export interface ActionAvailability {
  allowed: boolean;
  reason?: string;
}

export interface InfluenceGatingResult {
  canSpitInFace: ActionAvailability;
  canUseAmbitiousMessage: ActionAvailability;
  canUseLoyalMessage: ActionAvailability;
  canUseCautiousMessage: ActionAvailability;
  canUseNeutralMessage: ActionAvailability;
  canInteract: ActionAvailability;
}

/**
 * Checks if an action is allowed based on character and player influence levels
 */
export function checkActionAvailability(
  action: 'spit_in_face' | 'ambitious_message' | 'loyal_message' | 'cautious_message' | 'neutral_message' | 'interaction',
  character: Character,
  playerStats: PlayerStats
): ActionAvailability {
  const characterInfluence = character.personalityVectors.influence;
  const playerInfluence = playerStats.influence;

  switch (action) {
    case 'spit_in_face':
      if (characterInfluence > 0.6) {
        return {
          allowed: false,
          reason: "They are too powerful to insult directly"
        };
      }
      return { allowed: true };

    case 'ambitious_message':
      if (characterInfluence > 0.8) {
        return {
          allowed: false,
          reason: "They are too influential for threatening messages"
        };
      }
      return { allowed: true };

    case 'loyal_message':
    case 'cautious_message':
    case 'neutral_message':
      // These messages are generally always allowed unless character refuses interaction
      return { allowed: true };

    case 'interaction':
      if (playerInfluence < characterInfluence - 0.3) {
        return {
          allowed: false,
          reason: "They consider you beneath their notice"
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

/**
 * Gets all action availabilities for a character
 */
export function getInfluenceGating(character: Character, playerStats: PlayerStats): InfluenceGatingResult {
  const canInteract = checkActionAvailability('interaction', character, playerStats);
  
  // If character refuses interaction entirely, all actions are blocked
  if (!canInteract.allowed) {
    return {
      canSpitInFace: canInteract,
      canUseAmbitiousMessage: canInteract,
      canUseLoyalMessage: canInteract,
      canUseCautiousMessage: canInteract,
      canUseNeutralMessage: canInteract,
      canInteract
    };
  }

  return {
    canSpitInFace: checkActionAvailability('spit_in_face', character, playerStats),
    canUseAmbitiousMessage: checkActionAvailability('ambitious_message', character, playerStats),
    canUseLoyalMessage: checkActionAvailability('loyal_message', character, playerStats),
    canUseCautiousMessage: checkActionAvailability('cautious_message', character, playerStats),
    canUseNeutralMessage: checkActionAvailability('neutral_message', character, playerStats),
    canInteract
  };
}

/**
 * Gets disabled actions for UI display
 */
export function getDisabledActions(character: Character, playerStats: PlayerStats): string[] {
  const gating = getInfluenceGating(character, playerStats);
  const disabled: string[] = [];

  if (!gating.canSpitInFace.allowed) disabled.push('spit');
  if (!gating.canUseAmbitiousMessage.allowed) disabled.push('ambitious');
  if (!gating.canUseLoyalMessage.allowed) disabled.push('loyal');
  if (!gating.canUseCautiousMessage.allowed) disabled.push('cautious');
  if (!gating.canUseNeutralMessage.allowed) disabled.push('neutral');

  return disabled;
}
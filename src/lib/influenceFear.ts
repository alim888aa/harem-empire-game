import type { PlayerStats } from '../types/game';

/**
 * Applies initial fear to all characters based on player's starting influence
 */
export function applyInitialInfluenceFear(
  characters: Record<string, any>,
  playerInfluence: number
): void {
  if (playerInfluence <= 0) return;

  const fearIncrease = 0.1 * (playerInfluence / 1.0);

  Object.values(characters).forEach((characterRef) => {
    const snapshot = characterRef.getSnapshot();
    if (snapshot?.context?.name && snapshot.context.name !== 'Emperor') {
      // Send fear increase to character machine
      characterRef.send({
        type: 'APPLY_FEAR',
        fearAmount: fearIncrease
      });
    }
  });
}

/**
 * Applies ongoing fear increases when player influence > 0.6
 */
export function applyInfluenceFear(
  characters: Record<string, any>,
  playerInfluence: number
): void {
  if (playerInfluence <= 0.6) return;

  const fearIncrease = 0.5 * ((playerInfluence - 0.6) / 0.4);

  Object.values(characters).forEach((characterRef) => {
    const snapshot = characterRef.getSnapshot();
    if (snapshot?.context?.name && snapshot.context.name !== 'Emperor') {
      // Send fear increase to character machine
      characterRef.send({
        type: 'APPLY_FEAR',
        fearAmount: fearIncrease
      });
    }
  });
}

/**
 * Handles promotion effects: influence increase, side character penalties, fear increases
 */
export function handlePromotion(
  characters: Record<string, any>,
  playerStats: PlayerStats
): { updatedPlayerStats: PlayerStats; shouldShowInfluenceNotification: boolean } {
  // Increase player influence by 0.4 (capped at 1.0)
  const updatedPlayerStats = {
    ...playerStats,
    influence: Math.min(1.0, playerStats.influence + 0.4)
  };

  // Apply effects to all characters
  Object.values(characters).forEach((characterRef) => {
    const snapshot = characterRef.getSnapshot();
    if (snapshot?.context?.name && snapshot.context.name !== 'Emperor') {
      const characterType = snapshot.context.type;
      
      // Side character penalties: -0.2 trust, -0.1 loyalty to player
      if (characterType === 'side') {
        characterRef.send({
          type: 'APPLY_PROMOTION_PENALTY',
          trustPenalty: 0.2,
          loyaltyPenalty: 0.1
        });
      }

      // Fear increase (+0.3) for all living non-emperor characters
      characterRef.send({
        type: 'APPLY_FEAR',
        fearAmount: 0.3
      });
    }
  });

  // Check if we should show high influence notification
  const shouldShowInfluenceNotification = updatedPlayerStats.influence > 0.8;

  return {
    updatedPlayerStats,
    shouldShowInfluenceNotification
  };
}

/**
 * Gets the high influence notification message
 */
export function getHighInfluenceNotification(): string {
  return "Your growing influence strikes fear into the hearts of courtiers...";
}

/**
 * Checks if high influence notification should be shown
 */
export function shouldShowHighInfluenceNotification(playerInfluence: number): boolean {
  return playerInfluence > 0.8;
}
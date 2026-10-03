import type { PlayerStats, PlayerReputation } from '../types/game';
import type { Character } from '../types/character';

/**
 * Updates player personality vectors and reputation based on action type
 */
export function updatePlayerVector(
  actionType: 'ambitious' | 'loyal' | 'cautious' | 'neutral',
  _character: Character,
  playerStats: PlayerStats,
  playerReputation: PlayerReputation
): { updatedStats: PlayerStats; updatedReputation: PlayerReputation } {
  const newStats = { ...playerStats };
  const newReputation = { ...playerReputation };

  switch (actionType) {
    case 'ambitious':
      newStats.ambition = Math.min(1.0, newStats.ambition + 0.03);
      newReputation.perceivedThreat = Math.min(1.0, newReputation.perceivedThreat + 0.05);
      break;
    
    case 'loyal':
      newStats.loyalty = Math.min(1.0, newStats.loyalty + 0.03);
      newReputation.perceivedLoyalty = Math.min(1.0, newReputation.perceivedLoyalty + 0.02);
      break;
    
    case 'cautious':
      newStats.fear = Math.min(1.0, newStats.fear + 0.02);
      newReputation.trustworthiness = Math.min(1.0, newReputation.trustworthiness + 0.01);
      break;
    
    case 'neutral':
      // Neutral actions don't change player vectors or reputation
      break;
  }

  return {
    updatedStats: newStats,
    updatedReputation: newReputation
  };
}

/**
 * Checks if emperor execution can be bypassed due to high perceived loyalty
 */
export function canBypassEmperorExecution(
  giftsRemaining: number,
  playerReputation: PlayerReputation,
  requiredTribute = 10
): boolean {
  return giftsRemaining < requiredTribute && playerReputation.perceivedLoyalty > 0.8;
}
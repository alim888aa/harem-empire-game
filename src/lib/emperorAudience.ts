import { rankIndex } from './career';
import type { 
  VictoryPath, 
  GameContextData, 
  RevolutionaryContext, 
  TraditionalContext, 
  ShadowRulerContext, 
  SurvivorContext 
} from '../types/emperorAudience';
import type { FactionSystem } from './factionSystem';
import { assignCharacterFaction } from './factionSystem';
import type { PlayerStats, PlayerReputation } from '../types/game';

/**
 * Game context interface matching the game machine structure
 */
interface GameContext {
  characterType: 'prince' | 'minister' | 'concubine' | null;
  season: number;
  rank: string | null;
  rankEnteredSeason?: number;
  consolidationWaived?:boolean;
  playerPersonality: PlayerStats;
  playerReputation: PlayerReputation;
  suspiciousCharacters: string[];
  factionSystem: FactionSystem;
  characters: Record<string, any>;
  emperorAudienceCompleted: boolean;
  emperorAudienceDeferredUntilSeason?: number;
}

/**
 * Checks if the player should be offered an emperor audience event
 * Victory requires promotion and membership in one of the three court factions.
 */
export function shouldOfferEmperorAudience(context: GameContext): boolean {
  // A declined invitation must leave the player free to finish this season.
  if (context.emperorAudienceCompleted || context.season < (context.emperorAudienceDeferredUntilSeason ?? 0)) {
    return false;
  }

  return determineVictoryPath(context) !== null;
}

/**
 * Determines which victory path the player qualifies for
 * Based on faction membership and game conditions from requirements 11.1 and 13.1
 */
export function determineVictoryPath(context: GameContext): VictoryPath | null {
  if (!context.characterType) {
    return null;
  }

  // Check faction-based paths (requires promotion and faction membership)
  if (rankIndex(context.characterType,context.rank)===2 && (context.consolidationWaived||context.season >= (context.rankEnteredSeason ?? context.season) + 3) && context.factionSystem.playerFaction) {
    switch (context.factionSystem.playerFaction) {
      case 'Imperial':
        return 'traditional';
      case 'Loyalist':
        return 'shadow-ruler';
      case 'Rebel':
        return 'revolutionary';
      default:
        return null;
    }
  }

  return null;
}

/**
 * Extracts game context data for the specified victory path
 * Creates path-specific context data from requirements 13.2
 */
export function extractGameContext(context: GameContext, victoryPath: VictoryPath): GameContextData {
  const factionMemberCounts = getFactionMemberCounts(context.characters);
  
  switch (victoryPath) {
    case 'revolutionary':
      const revolutionaryData: RevolutionaryContext = {
        influence: context.playerPersonality.influence,
        ambition: context.playerPersonality.ambition,
        loyalty: context.playerPersonality.loyalty,
        fear: context.playerPersonality.fear,
        politicalSkill: context.playerReputation.politicalSkill,
        factionMemberCounts,
        suspiciousCharacters: context.suspiciousCharacters.length,
        characterType: context.characterType || 'minister'
      };
      return { path: 'revolutionary', data: revolutionaryData };

    case 'traditional':
      const traditionalData: TraditionalContext = {
        influence: context.playerPersonality.influence,
        loyalty: context.playerPersonality.loyalty,
        perceivedLoyalty: context.playerReputation.perceivedLoyalty,
        perceivedThreat: context.playerReputation.perceivedThreat,
        suspiciousCharacters: context.suspiciousCharacters.length,
        factionMemberCounts,
        characterType: context.characterType || 'prince'
      };
      return { path: 'traditional', data: traditionalData };

    case 'shadow-ruler':
      const shadowRulerData: ShadowRulerContext = {
        influence: context.playerPersonality.influence,
        perceivedLoyalty: context.playerReputation.perceivedLoyalty,
        politicalSkill: context.playerReputation.politicalSkill,
        factionMemberCounts,
        characterType: context.characterType || 'concubine'
      };
      return { path: 'shadow-ruler', data: shadowRulerData };

    case 'survivor':
      const survivorData: SurvivorContext = {
        perceivedLoyalty: context.playerReputation.perceivedLoyalty,
        perceivedThreat: context.playerReputation.perceivedThreat
      };
      return { path: 'survivor', data: survivorData };

    default:
      throw new Error(`Unknown victory path: ${victoryPath}`);
  }
}

/**
 * Normalizes context data for AI consumption
 * Ensures all numeric values are between 0-1 as specified in requirements 13.2
 */
export function normalizeContextData(gameContext: GameContextData): GameContextData {
  switch (gameContext.path) {
    case 'revolutionary':
      return {
        path: 'revolutionary',
        data: {
          ...gameContext.data,
          influence: Math.max(0, Math.min(1, gameContext.data.influence)),
          ambition: Math.max(0, Math.min(1, gameContext.data.ambition)),
          loyalty: Math.max(0, Math.min(1, gameContext.data.loyalty)),
          fear: Math.max(0, Math.min(1, gameContext.data.fear)),
          politicalSkill: Math.max(0, Math.min(1, gameContext.data.politicalSkill)),
          // suspiciousCharacters and factionMemberCounts are already normalized counts
        }
      };

    case 'traditional':
      return {
        path: 'traditional',
        data: {
          ...gameContext.data,
          influence: Math.max(0, Math.min(1, gameContext.data.influence)),
          loyalty: Math.max(0, Math.min(1, gameContext.data.loyalty)),
          perceivedLoyalty: Math.max(0, Math.min(1, gameContext.data.perceivedLoyalty)),
          perceivedThreat: Math.max(0, Math.min(1, gameContext.data.perceivedThreat)),
          // suspiciousCharacters and factionMemberCounts are already normalized counts
        }
      };

    case 'shadow-ruler':
      return {
        path: 'shadow-ruler',
        data: {
          ...gameContext.data,
          influence: Math.max(0, Math.min(1, gameContext.data.influence)),
          perceivedLoyalty: Math.max(0, Math.min(1, gameContext.data.perceivedLoyalty)),
          politicalSkill: Math.max(0, Math.min(1, gameContext.data.politicalSkill)),
          // factionMemberCounts are already normalized counts
        }
      };

    case 'survivor':
      return {
        path: 'survivor',
        data: {
          ...gameContext.data,
          perceivedLoyalty: Math.max(0, Math.min(1, gameContext.data.perceivedLoyalty)),
          perceivedThreat: Math.max(0, Math.min(1, gameContext.data.perceivedThreat)),
        }
      };

    default:
      return gameContext;
  }
}

/**
 * Helper function to count faction members from character actors
 * Used to populate factionMemberCounts in context data
 */
function getFactionMemberCounts(characters: Record<string, any>): Record<string, number> {
  const counts: Record<string, number> = {
    Rebel: 0,
    Imperial: 0,
    Loyalist: 0,
    Independent: 0
  };

  for (const characterName in characters) {
    const characterActor = characters[characterName];
    try {
      const characterSnapshot = characterActor.getSnapshot();
      if (!characterSnapshot?.context) continue;

      const character = characterSnapshot.context;
      const characterFaction = assignCharacterFaction({
        name: character.name,
        type: character.type,
        hasGivenAllegiance: character.hasGivenAllegiance,
        factionOverride: character.factionOverride,
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

      counts[characterFaction]++;
    } catch (error) {
      console.warn(`Failed to get faction for ${characterName}:`, error);
    }
  }

  return counts;
}

/**
 * Checks if a player is at maximum suspicion threshold for their character type
 * Used to determine execution risk when refusing audience
 */
export function isAtMaxSuspicion(context: GameContext): boolean {
  if (!context.characterType) {
    return false;
  }

  const executionThresholds = { 
    concubine: 1, 
    minister: 3, 
    prince: 5 
  };
  const threshold = executionThresholds[context.characterType];
  return context.suspiciousCharacters.length >= threshold;
}

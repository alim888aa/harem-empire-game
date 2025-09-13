import type { CharacterPersonalityVectors, CharacterRelationshipVectors } from '../types/character.js';
import type { PlayerStats, PlayerType } from '../types/game.js';

export interface MessageAnalysisResult {
    vectorChanges: Partial<CharacterPersonalityVectors>;
    relationshipChanges: Partial<CharacterRelationshipVectors>;
    responseType: string;
}

export interface PlayerRelationshipBonus {
    trustMultiplier: number;
    loyaltyMultiplier: number;
    dependenceMultiplier: number;
    loveMultiplier?: number;
    description: string;
}

/**
 * Get player relationship bonuses based on character type
 */
export function getPlayerRelationshipBonus(playerType: PlayerType): PlayerRelationshipBonus {
    const bonuses = {
        prince: {
            trustMultiplier: 1.5,    // Princes build trust 50% faster
            loyaltyMultiplier: 1.3,  // Natural authority
            dependenceMultiplier: 1.0, // Nerfed from 1.2
            description: "Royal blood commands respect"
        },
        minister: {
            trustMultiplier: 1.2,    // Ministers are skilled politicians
            loyaltyMultiplier: 1.0,  // Standard loyalty building
            dependenceMultiplier: 1.0, // Nerfed from 1.4
            description: "Political experience helps"
        },
        concubine: {
            trustMultiplier: 0.8,    // Harder to build trust (vulnerable position)
            loyaltyMultiplier: 0.9,  // Harder to inspire loyalty
            dependenceMultiplier: 1.0, // Nerfed from 1.1
            description: "Must work harder for respect"
        }
    };

    return bonuses[playerType] || bonuses.minister;
}

/**
 * Calculate compound growth bonus based on existing trust
 */
export function getTrustCompoundBonus(relationshipVectors: CharacterRelationshipVectors): number {
    const currentTrust = relationshipVectors.trustInPlayer;

    if (currentTrust >= 0.8) {
        return 1.8; // 80% bonus for high trust relationships
    } else if (currentTrust >= 0.6) {
        return 1.4; // 40% bonus for medium trust relationships
    } else if (currentTrust >= 0.4) {
        return 1.2; // 20% bonus for developing relationships
    } else {
        return 1.0; // No bonus for low trust
    }
}

/**
 * Analyze message choice and character compatibility
 */
export function analyzeMessageChoice(
    messageType: 'ambitious' | 'loyal' | 'cautious' | 'neutral' | 'romantic',
    personalityVectors: CharacterPersonalityVectors,
    relationshipVectors: CharacterRelationshipVectors,
    playerType: PlayerType,
    playerCharisma: number
): MessageAnalysisResult {
    const playerBonus = getPlayerRelationshipBonus(playerType);

    let vectorChanges: Partial<CharacterPersonalityVectors> = {};
    let relationshipChanges: Partial<CharacterRelationshipVectors> = {};
    let responseType = 'neutral';

    // Base relationship changes (before bonuses)
    let baseTrust = 0;
    let baseLoyalty = 0;
    let baseDependence = 0;
    let baseFear = 0;
    let baseLove = 0;

    if (messageType === "ambitious") {
        if (personalityVectors.ambition > 0.8 && personalityVectors.loyalty < 0.6) {
            // Perfect match - big relationship boost
            baseTrust = 0.25;
            baseLoyalty = 0.20;
            baseDependence = 0.15;
            vectorChanges.ambition = 0.05;
            responseType = 'ambitious_positive';
        } else if (personalityVectors.loyalty > 0.6) {
            // Bad match - relationship damage
            baseTrust = -0.15;
            baseFear = 0.15;
            vectorChanges.suspicion = 0.3;
            responseType = 'loyal_suspicious';
        } else {
            // Neutral reaction
            baseTrust = 0.08;
            baseDependence = 0.05;
            responseType = 'neutral';
        }
    } else if (messageType === "loyal") {
        if (personalityVectors.loyalty > 0.7) {
            // Perfect match
            baseTrust = 0.20;
            baseLoyalty = 0.25;
            baseDependence = 0.10;
            responseType = 'loyal_positive';
            
            // NEW: Loyal messages reduce suspicion
            vectorChanges.suspicion = -0.1;
        } else if (personalityVectors.ambition > 0.7 && personalityVectors.loyalty < 0.5) {
            // They see you as naive
            baseTrust = -0.1;
            responseType = 'ambitious_dismissive';
        } else {
            baseTrust = 0.10;
            baseLoyalty = 0.08;
            responseType = 'neutral';
        }
    } else if (messageType === "cautious") {
        if (personalityVectors.fear > 0.6) {
            baseTrust = 0.15;
            baseDependence = 0.1;
            vectorChanges.fear = 0.1; // Talking about dangers makes them more afraid
            responseType = 'fearful_appreciative';
        } else {
            baseTrust = 0.08;
            baseDependence = 0.05;
            responseType = 'neutral';
        }
    } else if (messageType === "romantic") {
        // Romance mechanics - effectiveness based on character's romantic personality and player charisma
        const romanticCompatibility = personalityVectors.romantic;
        const charismaBonus = playerCharisma; // 0-1 scale

        if (romanticCompatibility > 0.7) {
            // High romantic personality - very receptive
            baseLove = 0.3 * (1 + charismaBonus);
            baseTrust = 0.15 * (1 + charismaBonus * 0.5);
            baseDependence = 0.1;
            vectorChanges.romantic = 0.05; // Increases their romantic nature
            responseType = 'romantic_positive';
        } else if (romanticCompatibility > 0.4) {
            // Medium romantic personality - moderately receptive
            baseLove = 0.2 * (1 + charismaBonus * 0.7);
            baseTrust = 0.1 * (1 + charismaBonus * 0.3);
            responseType = 'romantic_neutral';
        } else {
            // Low romantic personality - may be uncomfortable
            baseLove = 0.05;
            baseTrust = -0.2; // Slight trust loss if they're not romantic
            baseFear = 0.1; // May make them uncomfortable
            responseType = 'romantic_uncomfortable';
        }
    } else if (messageType === "neutral") {
        baseTrust = 0.12;
        baseDependence = 0.05;
        responseType = 'neutral';
    }

    // Apply player type bonuses
    relationshipChanges.trustInPlayer = baseTrust * playerBonus.trustMultiplier;
    relationshipChanges.loyaltyToPlayer = baseLoyalty * playerBonus.loyaltyMultiplier;
    relationshipChanges.dependenceOnPlayer = baseDependence * playerBonus.dependenceMultiplier;
    relationshipChanges.loveForPlayer = baseLove; // Love not affected by player type bonuses initially
    if (baseFear !== 0) {
        relationshipChanges.fearOfPlayer = baseFear; // Fear not affected by player bonuses
    }

    // Apply compound growth bonus based on existing trust
    const trustBonus = getTrustCompoundBonus(relationshipVectors);
    if (trustBonus > 1 && playerType === 'prince') {
        relationshipChanges.trustInPlayer! *= trustBonus;
        relationshipChanges.loyaltyToPlayer! *= trustBonus;
        relationshipChanges.dependenceOnPlayer! *= trustBonus;
        // Love gets a smaller bonus for princes (they're more about authority than romance)
        if (relationshipChanges.loveForPlayer) {
            relationshipChanges.loveForPlayer *= trustBonus * 0.7;
        }
    } else if (trustBonus > 1 && playerType === 'minister') {
        relationshipChanges.trustInPlayer! *= trustBonus / 2;
        relationshipChanges.loyaltyToPlayer! *= trustBonus / 2;
        relationshipChanges.dependenceOnPlayer! *= trustBonus / 2;
        // Ministers get moderate love bonuses
        if (relationshipChanges.loveForPlayer) {
            relationshipChanges.loveForPlayer *= trustBonus * 0.5;
        }
    } else if (trustBonus > 1 && playerType === 'concubine') {
        relationshipChanges.trustInPlayer! *= trustBonus / 4;
        relationshipChanges.loyaltyToPlayer! *= trustBonus / 4;
        relationshipChanges.dependenceOnPlayer! *= trustBonus / 4;
        // Concubines get the highest love bonuses (romance is more their domain)
        if (relationshipChanges.loveForPlayer) {
            relationshipChanges.loveForPlayer *= trustBonus;
        }
    }

    return { vectorChanges, relationshipChanges, responseType };
}

/**
 * Calculate support level from relationship vectors (trust-weighted)
 */
export function calculateSupportLevel(relationshipVectors: CharacterRelationshipVectors): number {
    return Math.min(100, Math.round(
        (relationshipVectors.trustInPlayer * 40) +      // Keep your original value
        (relationshipVectors.loyaltyToPlayer * 25) +    // Keep your original value
        (relationshipVectors.dependenceOnPlayer * 25) + // Keep your original value
        (relationshipVectors.loveForPlayer * 15) +      // New: love contributes to support
        ((1 - relationshipVectors.fearOfPlayer) * 10)   // Keep your original value
    ));
}

/**
 * Update personality vectors while keeping them within bounds (0-1)
 */
export function updatePersonalityVectors(
    currentVectors: CharacterPersonalityVectors,
    changes: Partial<CharacterPersonalityVectors>
): CharacterPersonalityVectors {
    const updated = { ...currentVectors };

    Object.keys(changes).forEach(key => {
        const typedKey = key as keyof CharacterPersonalityVectors;
        if (updated[typedKey] !== undefined && changes[typedKey] !== undefined) {
            updated[typedKey] = Math.max(0, Math.min(1, updated[typedKey] + changes[typedKey]!));
        }
    });

    return updated;
}

/**
 * Update relationship vectors while keeping them within bounds (0-1)
 */
export function updateRelationshipVectors(
    currentVectors: CharacterRelationshipVectors,
    changes: Partial<CharacterRelationshipVectors>
): CharacterRelationshipVectors {
    const updated = { ...currentVectors };

    Object.keys(changes).forEach(key => {
        const typedKey = key as keyof CharacterRelationshipVectors;
        if (updated[typedKey] !== undefined && changes[typedKey] !== undefined) {
            updated[typedKey] = Math.max(0, Math.min(1, updated[typedKey] + changes[typedKey]!));
        }
    });

    return updated;
}

export interface GiftWithMessageResult {
    newPersonalityVectors: CharacterPersonalityVectors;
    newRelationshipVectors: CharacterRelationshipVectors;
    newSupportLevel: number;
    responseType: string;
}



/**
 * Main wrapper function that processes a gift with message interaction
 * Combines all helper functions to calculate the complete result
 */
export function processGiftWithMessage(
    messageType: 'ambitious' | 'loyal' | 'cautious' | 'neutral' | 'romantic',
    currentPersonalityVectors: CharacterPersonalityVectors,
    currentRelationshipVectors: CharacterRelationshipVectors,
    playerType: PlayerType,
    playerStats: PlayerStats
): GiftWithMessageResult {
    // Analyze the message choice and get changes
    const analysis = analyzeMessageChoice(
        messageType,
        currentPersonalityVectors,
        currentRelationshipVectors,
        playerType,
        playerStats.charisma
    );

    // Apply personality vector changes
    const newPersonalityVectors = updatePersonalityVectors(
        currentPersonalityVectors,
        analysis.vectorChanges
    );

    // Apply relationship vector changes
    const newRelationshipVectors = updateRelationshipVectors(
        currentRelationshipVectors,
        analysis.relationshipChanges
    );

    // Calculate new support level based on updated relationship vectors
    const newSupportLevel = calculateSupportLevel(newRelationshipVectors);

    return {
        newPersonalityVectors,
        newRelationshipVectors,
        newSupportLevel,
        responseType: analysis.responseType
    };
}
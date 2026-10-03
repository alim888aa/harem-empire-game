export interface CharacterPersonalityVectors {
      trust: number;
      fear: number;
      ambition: number;
      loyalty: number;
      influence: number;
      romantic: number;
      suspicion: number;
}

export interface CharacterRelationshipVectors {
      fearOfPlayer: number;
      loveForPlayer: number;
}

export interface InitialCharacterType {
      displayName?: string;
      supportThreshold?: number;
      name: string;
      type: 'major' | 'side' | 'minor';
      vectors: CharacterPersonalityVectors;
      imgPath: string;
      suspicionThreshold: number;
      paths?: ('prince' | 'minister' | 'concubine')[];
}

export interface Character {
      displayName?: string;
      hate?: number;
      isLover?: boolean;
      legacyCourtshipGiftEligible?: boolean;
      supportThreshold?: number;
      hasGivenSupport?: boolean;
      hasGivenAllegiance?: boolean;
      factionOverride?: 'Rebel' | 'Imperial' | 'Loyalist' | 'Independent' | null;
      name: string;
      type: 'major' | 'side' | 'minor';
      supportLevel: number;
      suspicion: number;
      personalityVectors: CharacterPersonalityVectors;
      relationshipVectors: CharacterRelationshipVectors;
      lastResponse: string;
      imgPath: string;
      suspicionThreshold: number;
      hasGivenGifts: boolean;
      giftCooldownUntil: number;
}
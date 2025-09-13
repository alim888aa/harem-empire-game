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
      trustInPlayer: number;
      loyaltyToPlayer: number;
      fearOfPlayer: number;
      dependenceOnPlayer: number;
      loveForPlayer: number;
}

export interface InitialCharacterType {
      name: string;
      type: 'major' | 'side' | 'minor';
      vectors: CharacterPersonalityVectors;
      imgPath: string;
}

export interface Character {
      name: string;
      type: 'major' | 'side' | 'minor';
      supportLevel: number;
      suspicion: number;
      personalityVectors: CharacterPersonalityVectors;
      relationshipVectors: CharacterRelationshipVectors;
      lastResponse: string;
      imgPath: string;
}
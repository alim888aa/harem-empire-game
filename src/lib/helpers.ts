export function getRank(characterType: 'prince' | 'minister' | 'concubine' | null ) {

    switch (characterType) {
      case 'prince':
        return 'crown_prince';
      case 'minister':
        return 'prime_minister';
      case 'concubine':
        return 'empress_consort';
      default:
        return null;
    }

}

export function getPersonality(characterType: 'prince' | 'minister' | 'concubine' | null) {
  
  const playerVectors = {
        prince: {
          loyalty: 0.8,
          ambition: 0.6,
          influence: 0.5,
          fear: 0.2,
          charisma: 0.4
        },
        minister: {
          loyalty: 0.5,
          ambition: 0.8,
          influence: 0.3,
          fear: 0.3,
          charisma: 0.3
        },
        concubine: {
          loyalty: 0.3,
          ambition: 0.7,
          influence: 0.0,
          fear: 0.5,
          charisma: 0.6
        }
      };

      const playerPersonality = playerVectors[characterType as keyof typeof playerVectors];

      return playerPersonality
}


// Helper function to generate initial stats based on your old logic
function generateInitialVectors(type: 'major' | 'side' | 'minor', name: string) {
  let baseVector;

  // Map new types to old vector generation presets
  if (type === 'major') {
    // old 'side' preset for high-influence figures
    baseVector = {
      trust: 0.2 + Math.random() * 0.3,
      fear: 0.2 + Math.random() * 0.3,
      ambition: 0.6 + Math.random() * 0.3,
      loyalty: 0.4 + Math.random() * 0.4,
      influence: 0.7 + Math.random() * 0.3,
      suspicion: 0,
      romantic: 0.1 + Math.random() * 0.2
    };
  } else if (type === 'side') {
    // old 'minor' preset
    baseVector = {
      trust: 0.3 + Math.random() * 0.4,
      fear: 0.3 + Math.random() * 0.4,
      ambition: 0.3 + Math.random() * 0.5,
      loyalty: 0.3 + Math.random() * 0.5,
      influence: 0.1 + Math.random() * 0.3,
      suspicion: 0,
      romantic: 0.3 + Math.random() * 0.3
    };
  } else { // 'minor'
    // old 'guide' preset for maids
    baseVector = {
      trust: 0.6 + Math.random() * 0.3,
      fear: 0.4 + Math.random() * 0.3,
      ambition: 0.1 + Math.random() * 0.3,
      loyalty: 0.5 + Math.random() * 0.3,
      influence: 0.2 + Math.random() * 0.2,
      suspicion: 0,
      romantic: 0.1 + Math.random() * 0.2
    };
  }

  // Apply specific tweaks from your old logic
  if (name.includes('Prince')) {
    baseVector.loyalty = Math.max(0.6, baseVector.loyalty);
    baseVector.influence = Math.max(0.4, baseVector.influence);
    baseVector.romantic = Math.max(0.2, baseVector.romantic);
  }
  if (name.includes('Minister')) {
    baseVector.ambition = Math.max(0.5, baseVector.ambition);
    baseVector.loyalty = 0.3 + Math.random() * 0.5;
  }
  if (name.includes('Concubine')) {
    baseVector.fear = Math.max(0.4, baseVector.fear);
    baseVector.trust = Math.min(0.4, baseVector.trust);
    baseVector.romantic = Math.max(0.3, baseVector.romantic);
  }
  if (name === 'Crown Prince') {
    baseVector.loyalty = Math.max(0.7, baseVector.loyalty);
    baseVector.ambition = Math.max(0.6, baseVector.ambition);
  }
  if (name === 'Empress Dowager') {
    baseVector.influence = Math.max(0.8, baseVector.influence);
    baseVector.ambition = Math.max(0.7, baseVector.ambition);
    baseVector.romantic = Math.max(0.01, baseVector.romantic);
  }
  if (name === 'Prime Minister') {
    baseVector.ambition = Math.max(0.8, baseVector.ambition);
    baseVector.influence = Math.max(0.7, baseVector.influence);
  }

  return baseVector;
}

type CharacterBlueprint = {
  name: string;
  type: 'major' | 'side' | 'minor';
  imgPath: string;
};

const characterBlueprints: CharacterBlueprint[] = [
  { name: 'Empress Dowager', type: 'major', imgPath: '/empress-dowager.png' },
  { name: 'Empress Consort', type: 'major', imgPath: '/empress-consort.png' },
  { name: 'Crown Prince', type: 'major', imgPath: '/crown-prince.png' },
  { name: 'Prime Minister', type: 'major', imgPath: '/prime-minister.png' },
  { name: 'Prince Feng', type: 'side', imgPath: '/prince.png' },
  { name: 'Prince Han', type: 'side', imgPath: '/prince.png' },
  { name: 'Prince Jun', type: 'side', imgPath: '/prince.png' },
  { name: 'Prince Lei', type: 'side', imgPath: '/prince.png' },
  { name: 'Minister Chen', type: 'side', imgPath: '/minister.png' },
  { name: 'Minister Wang', type: 'side', imgPath: '/minister.png' },
  { name: 'Minister Liu', type: 'side', imgPath: '/minister.png' },
  { name: 'Minister Zhang', type: 'side', imgPath: '/minister.png' },
  { name: 'Concubine Mei', type: 'side', imgPath: '/minister.png' },
  { name: 'Concubine Lin', type: 'side', imgPath: '/minister.png' },
  { name: 'Concubine Xia', type: 'side', imgPath: '/minister.png' },
  { name: 'Concubine Yun', type: 'side', imgPath: '/minister.png' },
  { name: 'Maid Ling', type: 'minor', imgPath: '/maid.png' },
  { name: 'Maid Su', type: 'minor', imgPath: '/maid.png' },
  { name: 'Maid Bai', type: 'minor', imgPath: '/maid.png' },
  { name: 'Maid Lan', type: 'minor', imgPath: '/maid.png' },
];

export const initialCharacters = characterBlueprints.map(char => ({
  name: char.name,
  type: char.type,
  imgPath: char.imgPath,
  vectors: generateInitialVectors(char.type, char.name),
}));
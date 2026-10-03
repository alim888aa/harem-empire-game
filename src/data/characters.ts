import {courtOffice,courtInfluenceCap} from '../lib/courtHierarchy';
import {COURT_EXPANSION,type CourtGroup} from './courtExpansion';

// Helper function to generate initial stats based on your old logic
function generateInitialVectors(type: 'major' | 'side' | 'minor', name: string, random:()=>number = Math.random, group?:CourtGroup) {
  let baseVector;

  // Map new types to old vector generation presets
  if (type === 'major') {
    // old 'side' preset for high-influence figures
    baseVector = {
      trust: 0.2 + random() * 0.3,
      fear: 0.2 + random() * 0.3,
      ambition: 0.6 + random() * 0.3,
      loyalty: 0.4 + random() * 0.4,
      influence: 0.7 + random() * 0.3,
      suspicion: 0,
      romantic: 0.1 + random() * 0.2
    };
  } else if (type === 'side') {
    // old 'minor' preset
    baseVector = {
      trust: 0.3 + random() * 0.4,
      fear: 0.3 + random() * 0.4,
      ambition: 0.3 + random() * 0.5,
      loyalty: 0.3 + random() * 0.5,
      influence: 0.2 + random() * 0.3,
      suspicion: 0,
      romantic: 0.3 + random() * 0.3
    };
  } else { // 'minor'
    // old 'guide' preset for maids
    baseVector = {
      trust: 0.5 + random() * 0.3,
      fear: 0.5 + random() * 0.3,
      ambition: 0.1 + random() * 0.3,
      loyalty: 0.5 + random() * 0.3,
      influence: 0.2 + random() * 0.2,
      suspicion: 0,
      romantic: 0.1 + random() * 0.2
    };
  }

  // Eunuchs share an office, not a fixed allegiance. The unbiased slice can
  // still be Independent or Imperial before the80% political inclination.
  if(group==='eunuch')Object.assign(baseVector,{ambition:.2+random()*.65,loyalty:.2+random()*.7,fear:.2+random()*.6,influence:.2+random()*.45});

  // Apply specific tweaks from your old logic
  if (name.includes('Prince')) {
    baseVector.loyalty = Math.max(0.6, baseVector.loyalty);
    baseVector.ambition = Math.max(0.6, baseVector.ambition);
    baseVector.influence = Math.max(0.6, baseVector.influence);
    baseVector.romantic = Math.max(0.2, baseVector.romantic);
  }
  if (name.includes('Minister')) {
    baseVector.ambition = Math.max(0.7, baseVector.ambition);
    baseVector.loyalty = 0.2 + random() * 0.5;
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
    baseVector.loyalty = Math.max(0.6, baseVector.loyalty);
    baseVector.romantic = Math.max(0.01, baseVector.romantic);
  }
  if (name === 'Prime Minister') {
    baseVector.ambition = Math.max(0.8, baseVector.ambition);
    baseVector.influence = Math.max(0.7, baseVector.influence);
  }

  //80% group inclination,20% unchanged mixed court personality. Faction remains
  //derived from these vectors, not an immutable tag.
  if(group && random()<.8){
    if(group==='scholar')Object.assign(baseVector,{ambition:.35+random()*.3,loyalty:.3+random()*.3,fear:.15+random()*.3,influence:.2+random()*.25});
    if(group==='consort'){
      const imperial=random()<(name==='Consort Hua'?.7:name==='Consort Zhen'?.2:.5);
      Object.assign(baseVector,imperial?{ambition:.3+random()*.3,loyalty:.72+random()*.2,fear:.3+random()*.3,influence:.55+random()*.25}:{ambition:.3+random()*.35,loyalty:.5+random()*.19,fear:.55+random()*.25,influence:.3+random()*.35});
    }
    if(group==='eunuch'){
      const rebel=random()<.5;
      Object.assign(baseVector,rebel?{ambition:.7+random()*.25,loyalty:.2+random()*.25,fear:.2+random()*.3}:{ambition:.25+random()*.35,loyalty:.5+random()*.19,fear:.55+random()*.25});
    }
    if(group==='general'){
      const rebel=random()<(name==='General Shen'?.8:name==='General Zhao'?.2:.5);
      Object.assign(baseVector,rebel?{ambition:.72+random()*.23,loyalty:.2+random()*.25,fear:.2+random()*.3,influence:.5+random()*.3}:{ambition:.35+random()*.3,loyalty:.5+random()*.19,fear:.55+random()*.25,influence:.5+random()*.3});
    }
  }
  const tier=courtOffice({name,type})?.tier,cap=courtInfluenceCap({name,type});
  const low=tier===1?.03:tier===2?.15:tier===3?(baseVector.loyalty>=.7&&baseVector.influence>=.5?.5:.4):name==='Empress Dowager'?.8:.7;
  baseVector.influence=low+(cap-low)*random();
  return baseVector;
}

type CharacterBlueprint = {
  name: string;
  group?:CourtGroup;
  type: 'major' | 'side' | 'minor';
  imgPath: string;
  paths?: ('prince' | 'minister' | 'concubine')[];
};

const characterBlueprints: CharacterBlueprint[] = [
  { name: 'Empress Dowager', type: 'major', imgPath: '/empress-dowager.png', paths: ['concubine'] },
  { name: 'Empress Consort', type: 'major', imgPath: '/empress-consort.png', paths: ['concubine'] }, // Always included, no path restriction
  { name: 'Crown Prince', type: 'major', imgPath: '/crown-prince.png',paths: ['prince'] }, // Always included, no path restriction
  { name: 'Prime Minister', type: 'major', imgPath: '/prime-minister.png', paths: ['minister'] }, // Always included, no path restriction
  { name: 'Prince Feng', type: 'side', imgPath: '/prince.png', paths: ['prince'] },
  { name: 'Prince Han', type: 'side', imgPath: '/prince-2.png', paths: ['prince'] },
  { name: 'Prince Jun', type: 'side', imgPath: '/prince-1.png', paths: ['prince'] },
  { name: 'Prince Lei', type: 'side', imgPath: '/prince-4.png', paths: ['prince'] },
  { name: 'Minister Chen', type: 'side', imgPath: '/minister.png', paths: ['minister'] },
  { name: 'Minister Wang', type: 'side', imgPath: '/minister-2.png', paths: ['minister'] },
  { name: 'Minister Liu', type: 'side', imgPath: '/minister-3.png', paths: ['minister'] },
  { name: 'Minister Zhang', type: 'side', imgPath: '/minister-4.png', paths: ['minister'] },
  { name: 'Concubine Mei', type: 'side', imgPath: '/concubine.png', paths: ['concubine'] },
  { name: 'Concubine Lin', type: 'side', imgPath: '/concubine-2.png', paths: ['concubine'] },
  { name: 'Concubine Xia', type: 'side', imgPath: '/concubine-3.png', paths: ['concubine'] },
  { name: 'Concubine Yun', type: 'side', imgPath: '/concubine-4.png', paths: ['concubine'] },
  { name: 'Maid Ling', type: 'minor', imgPath: '/maid.png', paths: ['concubine'] },
  { name: 'Maid Su', type: 'minor', imgPath: '/maid-2.png', paths: ['concubine'] },
  { name: 'Maid Bai', type: 'minor', imgPath: '/maid-3.png', paths: ['concubine'] },
  { name: 'Maid Lan', type: 'minor', imgPath: '/maid-4.png', paths: ['concubine'] },
  ...COURT_EXPANSION.map(person=>({name:person.name,group:person.group,type:(person.group==='maid'||person.group==='eunuch'?'minor':'side') as 'minor'|'side',imgPath:'/portrait-pending.svg',paths:[...person.paths]})),
];

export const createInitialCharacters = (random:()=>number = Math.random) => characterBlueprints.map(char => ({
  name: char.name,
  type: char.type,
  imgPath: char.imgPath,
  vectors: generateInitialVectors(char.type, char.name, random, char.group),
  suspicionThreshold: char.type === 'major' ? 0.5 : char.type === 'side' ? 0.7 : 0.9,
  paths: char.paths,
}));
export const initialCharacters = createInitialCharacters();

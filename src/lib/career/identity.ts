// Owns career vocabulary and legacy role/rank normalization at the module boundary.
export type Career = 'prince' | 'scholar' | 'concubine';
export type CareerRank =
  | 'prince' | 'grand_prince' | 'crown_prince'
  | 'scholar' | 'minister' | 'prime_minister'
  | 'concubine' | 'consort' | 'empress';
export type PalaceZone = 'common' | 'emperor' | 'empress' | 'ladies' | 'dowager' | 'library';

export const CAREER_LADDERS: Record<Career, readonly CareerRank[]> = {
  prince: ['prince', 'grand_prince', 'crown_prince'],
  scholar: ['scholar', 'minister', 'prime_minister'],
  concubine: ['concubine', 'consort', 'empress']
};

/** Resolves the persisted minister identity to the Scholar career without changing saved fields. */
export function resolveCareer(role: string | null | undefined): Career | null {
  if (role === 'minister' || role === 'scholar') return 'scholar';
  return role === 'prince' || role === 'concubine' ? role : null;
}

export interface CareerPosition {
  career: Career;
  rank: CareerRank;
  index: number;
  ladder: readonly CareerRank[];
}

// A null rank means the starting office; cross-career and unknown ranks remain invalid.
export function careerPosition(role: string | null, rank: string | null): CareerPosition | null {
  const career = resolveCareer(role);
  if (!career) return null;
  const ladder = CAREER_LADDERS[career];
  const normalized = rank === 'empress_consort' ? 'empress' : rank ?? ladder[0];
  const index = ladder.indexOf(normalized as CareerRank);
  return index < 0 ? null : { career, rank: ladder[index], index, ladder };
}

/** Names a newly chosen career while preserving the Courtier fallback. */
export function startingCareerTitle(role: string | null | undefined): string {
  const career = resolveCareer(role);
  return career ? career[0].toUpperCase() + career.slice(1) : 'Courtier';
}

// Owns cumulative palace entry rules and their player-facing rejection reasons.
import { careerPosition, resolveCareer, type CareerRank, type PalaceZone } from './identity';

export const PALACE_ZONE_TITLES: Record<PalaceZone, string> = {
  common: 'Palace corridors', emperor: "Emperor's palace", empress: "Empress's palace",
  ladies: "Ladies' Court", dowager: "Dowager's palace", library: 'Academy Library'
};
export const RANK_ACCESS: Record<CareerRank, readonly PalaceZone[]> = {
  prince: ['common', 'empress', 'dowager', 'library'],
  grand_prince: ['common', 'empress', 'dowager', 'library', 'emperor'],
  crown_prince: ['common', 'emperor', 'empress', 'ladies', 'dowager', 'library'],
  scholar: ['common', 'emperor', 'library'],
  minister: ['common', 'emperor', 'library', 'empress', 'dowager'],
  prime_minister: ['common', 'emperor', 'empress', 'ladies', 'dowager', 'library'],
  concubine: ['common', 'ladies'],
  consort: ['common', 'ladies', 'empress', 'dowager'],
  empress: ['common', 'emperor', 'empress', 'ladies', 'dowager', 'library']
};
export interface CareerAccess {
  allowed: boolean;
  reason?: string;
  requiredRank?: CareerRank;
}
const rankTitle = (rank: string) => rank.replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase());

/** Checks entry and names the next office required; does not mutate actors or rank. */
export function careerZoneAccess(role: string | null, rank: string | null, zone: PalaceZone): CareerAccess {
  if (!resolveCareer(role)) return { allowed: false, reason: 'Choose a career first.' };
  const position = careerPosition(role, rank);
  if (!position) return { allowed: false, reason: 'This rank does not belong to your career.' };
  if (RANK_ACCESS[position.rank].includes(zone)) return { allowed: true };
  const requiredRank = position.ladder.slice(position.index + 1).find(next => RANK_ACCESS[next].includes(zone));
  return {
    allowed: false, requiredRank,
    reason: requiredRank ? `Requires ${rankTitle(requiredRank)} rank.` : 'This career does not grant entry.'
  };
}

/** Returns the existing starting room, including the Library fallback before selection. */
export function careerEntryZone(role: string | null): PalaceZone {
  return resolveCareer(role) === 'concubine' ? 'ladies' : 'library';
}

// Owns rank progression, career income/tribute and destination standing without side effects.
import { careerPosition, resolveCareer, type CareerRank } from './identity';
import { CAREER_RULES } from './policy';

/** Returns the existing ladder index, or -1 when the role/rank does not belong to a career. */
export function rankIndex(role: string | null, rank: string | null | undefined): number {
  // Historical callers distinguish undefined from the explicitly unpromoted null rank.
  if (rank === undefined) return -1;
  return careerPosition(role, rank)?.index ?? -1;
}

/** Returns the unchanged rank tribute; invalid identities retain the bottom-rank fallback. */
export function tributeCost(role: string | null, rank: string | null): number {
  return CAREER_RULES.tributeCosts[Math.max(0, Math.min(2, rankIndex(role, rank)))];
}

/** Returns the career-specific hate added to unpledged rivals on promotion. */
export function promotionHate(role: string | null): number {
  const career = resolveCareer(role);
  return career ? CAREER_RULES.promotionHateByRole[career] : 0;
}

/** Grants the held office's allowance; unknown or cross-career offices receive none. */
export function seasonalGiftGrant(role: string | null, rank: string | null): number {
  const position = careerPosition(role, rank);
  return position ? CAREER_RULES.seasonalGiftsByRank[position.rank] : 0;
}

/** Names the next office and exact standing/influence thresholds, or null at an invalid/top office. */
export function promotionRequirement(role: string | null, rank: string | null) {
  const position = careerPosition(role, rank);
  if (!position || position.index >= 2) return null;
  const rules = CAREER_RULES.roles[position.career];
  return {
    rank: position.ladder[position.index + 1],
    globalSupport: rules.globalTargets[position.index],
    influence: rules.influenceTargets[position.index]
  };
}

export interface PromotionEligibility {
  role: string | null;
  rank: string | null;
  support: number;
  influence: number;
  season: number;
  eligibleAfterSeason?: number;
}

/** Checks the existing threshold epsilon and probation season without applying a promotion. */
export function mayPromote(input: PromotionEligibility): boolean {
  const next = promotionRequirement(input.role, input.rank);
  return !!next && input.support >= next.globalSupport && input.influence + 1e-9 >= next.influence &&
    input.season >= (input.eligibleAfterSeason ?? 1);
}

/** Returns an audience demotion only from top office; deadline notices separately support middle office. */
export function demotedRank(role: string | null, rank: string | null): CareerRank | null {
  const position = careerPosition(role, rank);
  return position && position.index > 1 ? position.ladder[position.index - 1] : null;
}

/** Returns top-office consolidation, preserving the explicit waived completion path. */
export function consolidationProgress(
  role: string | null, rank: string | null, enteredSeason: number, season: number, waived = false
) {
  if (rankIndex(role, rank) !== 2) return null;
  const total = CAREER_RULES.topConsolidationSeasons;
  const completed = waived ? total : Math.min(total, Math.max(0, season - enteredSeason));
  return { completed, total, remaining: total - completed };
}

/** Resets only global standing; retained personal relationships are owned by the court graph. */
export function standingAfterDemotion(role: string | null, destinationRank: string | null): number {
  const career = resolveCareer(role);
  if (!career) return 0;
  return rankIndex(role, destinationRank) === 0
    ? (career === 'concubine' ? 10 : 0)
    : CAREER_RULES.roles[career].globalTargets[0];
}

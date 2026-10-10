// Owns career deadlines, their existing endings, and persistent demotion receipts.
import { careerPosition, type Career, type CareerRank } from './identity';
import { CAREER_RULES } from './policy';

export const PROMOTION_WINDOWS: Record<Career, number> = {
  concubine: CAREER_RULES.roles.concubine.window,
  scholar: CAREER_RULES.roles.scholar.window,
  prince: CAREER_RULES.roles.prince.window
};
export const DEADLINE_ENDINGS: Record<Career, { title: string; description: string }> = {
  concubine: {
    title: 'Sent to the servants’ quarters',
    description: 'Your chance to rise has passed. You lose your place at court and are sent to serve as a maid.'
  },
  scholar: {
    title: 'Returned to common life',
    description: 'The court closes its doors to you. Your official career ends, and you return to life as a peasant.'
  },
  prince: {
    title: 'A lord beyond the palace',
    description: 'You are sent out of the palace to become a lord. Your struggle for power in this court is over.'
  }
};

/** Counts the entry season first and starts a fresh window at each office, including top-office victory. */
export function promotionDeadline(role: string | null, rank: string | null, enteredSeason: number, currentSeason: number) {
  const position = careerPosition(role, rank);
  if (!position) return null;
  const window = PROMOTION_WINDOWS[position.career];
  const elapsed = Math.max(0, currentSeason - enteredSeason);
  return {
    career: position.career, window,
    seasonsRemaining: Math.max(0, window - elapsed), expiresAtSeason: enteredSeason + window, expired: elapsed >= window,
    goal: position.index === 2 ? 'faction_victory' : 'promotion',
    outcome: position.index === 0
      ? { kind: 'career_ending' as const, ...DEADLINE_ENDINGS[position.career] }
      : { kind: 'demotion' as const, rank: position.ladder[position.index - 1] }
  };
}

export interface DemotionNotice {
  id: string;
  season: number;
  fromRank: CareerRank;
  toRank: CareerRank;
  reason: 'deadline' | 'audience';
  acknowledged: boolean;
}

/** Creates the stable saved notice for either middle/top office; returns null at starting/invalid office. */
export function createDemotionNotice(
  role: string | null, rank: string | null, season: number, reason: DemotionNotice['reason']
): DemotionNotice | null {
  const position = careerPosition(role, rank);
  if (!position || position.index < 1) return null;
  const fromRank = position.rank;
  const toRank = position.ladder[position.index - 1];
  return { id: `${season}:${fromRank}:${toRank}:${reason}`, season, fromRank, toRank, reason, acknowledged: false };
}

/** Returns the existing player-facing reason without interpreting campaign state. */
export function demotionReason(notice: DemotionNotice): string {
  return notice.reason === 'audience' ? 'The Emperor dismissed your audience.' : 'Your rank deadline passed.';
}

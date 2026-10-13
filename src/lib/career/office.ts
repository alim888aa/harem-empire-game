// Owns career-specific office identities; actor names and historical expulsions remain stable.
import { resolveCareer } from './identity';

/** Names the displaced historical office holder, including the old final Empress alias. */
export function displacedOfficeForRank(rank: string | null): string | null {
  const office: Record<string, string> = {
    crown_prince: 'Crown Prince', prime_minister: 'Prime Minister',
    empress: 'Empress Consort', empress_consort: 'Empress Consort'
  };
  return office[rank ?? ''] ?? null;
}

/** Names the career's existing senior rival without changing their actor identity. */
export function careerSeniorRival(role: string | null): string | null {
  const career = resolveCareer(role);
  return career === 'concubine' ? 'Empress Dowager'
    : career === 'prince' ? 'Crown Prince'
    : career === 'scholar' ? 'Prime Minister' : null;
}

// Owns the existing career tuning, also exposed through the campaign balance compatibility contract.
export const CAREER_RULES = {
  roles: {
    prince: { globalTargets: [80, 160], influenceTargets: [0.70, 0.78], window: 20 },
    scholar: { globalTargets: [90, 180], influenceTargets: [0.55, 0.72], window: 16 },
    concubine: { globalTargets: [80, 200], influenceTargets: [0.30, 0.60], window: 12 }
  },
  topConsolidationSeasons: 3,
  seasonalGiftsByRank: {
    concubine: 20, consort: 25, empress: 30,
    scholar: 20, minister: 30, prime_minister: 45,
    prince: 25, grand_prince: 45, crown_prince: 65
  },
  tributeCosts: [10, 20, 40],
  promotionHateByRole: { prince: 20, scholar: 30, concubine: 40 }
} as const;

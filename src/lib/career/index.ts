// The Career front door: legacy inputs in, complete deterministic career rules out.
export {
  resolveCareer, startingCareerTitle, CAREER_LADDERS,
  type Career, type CareerRank, type PalaceZone
} from './identity';
export { careerZoneAccess, careerEntryZone, RANK_ACCESS, PALACE_ZONE_TITLES, type CareerAccess } from './access';
export {
  rankIndex, tributeCost, promotionHate, seasonalGiftGrant, promotionRequirement,
  mayPromote, demotedRank, consolidationProgress, standingAfterDemotion, type PromotionEligibility
} from './progression';
export {
  promotionDeadline, PROMOTION_WINDOWS, DEADLINE_ENDINGS,
  createDemotionNotice, demotionReason, type DemotionNotice
} from './deadline';
export { displacedOfficeForRank, careerSeniorRival } from './office';
// Existing campaign tuning consumers retain a single shared owning table.
export { CAREER_RULES } from './policy';

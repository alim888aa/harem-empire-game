// Compatibility entrypoint for existing consumers; all career rules have one owning implementation.
export {
  CAREER_LADDERS, PALACE_ZONE_TITLES, RANK_ACCESS,
  resolveCareer, startingCareerTitle, careerZoneAccess, careerEntryZone,
  type Career, type CareerRank, type PalaceZone
} from './career';

/** Presentation-only pacing. Campaign seasons, RNG and tribute are unchanged. */
export type EmperorAppearanceStatus={loading:boolean;retry:(()=>void)|null};
export function emperorEntrancePlan(regularEncounter:boolean) {
  return regularEncounter
    ? {seconds:5,searchLengths:[6.5,5,4,3,2,1]}
    : {seconds:1.5,searchLengths:[4,3,2,1]};
}

import type { Character } from '../types/character';
import { CAMPAIGN_BALANCE as B,globalSupportReward,isEnemy } from './campaignBalance';
import { resolveCareer } from './career';
// Preserve the existing standing import contract without another career-rule implementation.
export { standingAfterDemotion } from './career';
export type StandingRecovery={recovery:boolean;season:number;support:number;renewals:Record<string,number>};
/** Positive message evaluation, current backing and a new season are all needed.
 * This is a small paid renewal, not an automatic regrant of historical milestones. */
export function endorsementRenewal(character:Character,evaluatedSupportDelta:number,role:string|null,state:StandingRecovery){
 const career=resolveCareer(role);if(!career||!state.recovery||evaluatedSupportDelta<=0||state.renewals[character.name]===state.season)return 0;
 if(!character.hasGivenAllegiance&&!(character.hasGivenSupport&&character.supportLevel>=(character.supportThreshold??80)))return 0;
 const room=Math.max(0,B.roles[career].globalTargets[1]-state.support);
 return Math.round(Math.min(room,globalSupportReward(character)*B.endorsementRenewalFraction*(isEnemy(character)?B.enemyPositiveScale:1))*100)/100;
}

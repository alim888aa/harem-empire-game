import { CAMPAIGN_BALANCE } from './campaignBalance';
import { CAREER_LADDERS, resolveCareer, type Career } from './careerAccess';
export const PROMOTION_WINDOWS:Record<Career,number>={concubine:CAMPAIGN_BALANCE.roles.concubine.window,scholar:CAMPAIGN_BALANCE.roles.scholar.window,prince:CAMPAIGN_BALANCE.roles.prince.window};
export const DEADLINE_ENDINGS:Record<Career,{title:string;description:string}>={
  concubine:{title:'Sent to the servants’ quarters',description:'Your chance to rise has passed. You lose your place at court and are sent to serve as a maid.'},
  scholar:{title:'Returned to common life',description:'The court closes its doors to you. Your official career ends, and you return to life as a peasant.'},
  prince:{title:'A lord beyond the palace',description:'You are sent out of the palace to become a lord. Your struggle for power in this court is over.'},
};
/** Counts the rank-entry season as the first available season. Each rank gets a fresh window; top office seeks a faction ending. */
export function promotionDeadline(role:string|null,rank:string|null,enteredSeason:number,currentSeason:number){
  const career=resolveCareer(role);if(!career)return null;
  const ladder=CAREER_LADDERS[career];
  const resolved=rank==='empress_consort'?'empress':rank??ladder[0];
  const rankIndex=ladder.indexOf(resolved as typeof ladder[number]);
  if(rankIndex<0)return null;
  const window=PROMOTION_WINDOWS[career],elapsed=Math.max(0,currentSeason-enteredSeason);
  return{career,window,seasonsRemaining:Math.max(0,window-elapsed),expiresAtSeason:enteredSeason+window,expired:elapsed>=window,goal:rankIndex===2?'faction_victory':'promotion',outcome:rankIndex===0?{kind:'career_ending' as const,...DEADLINE_ENDINGS[career]}:{kind:'demotion' as const,rank:ladder[rankIndex-1]}};
}

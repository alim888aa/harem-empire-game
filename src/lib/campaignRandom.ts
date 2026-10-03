/** Serializable xorshift32 state. Keep gameplay draws inside the campaign actor;
 * restoring a snapshot resumes the same next outcome instead of rerolling it. */
export function nextCampaignRandom(state:number){
 let next=(state>>>0)||0x9e3779b9;next^=next<<13;next^=next>>>17;next^=next<<5;
 return{state:next>>>0,value:(next>>>0)/4294967296};
}
export function campaignRandom(seed:number){
 let state=(seed>>>0)||0x9e3779b9;
 return{next(){const draw=nextCampaignRandom(state);state=draw.state;return draw.value;},get state(){return state;}};
}
export function freshCampaignSeed(){return(Math.floor(Math.random()*4294967296)>>>0)||0x9e3779b9;}

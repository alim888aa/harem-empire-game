/** Court office is independent of the player's career and the legacy story type.
 * Every evaluated gift charges this office's tier cost exactly once. */
export const COURT_ARCHETYPES = {
 maid:{label:'Maid',tier:1,count:8,giftCost:1},
 eunuch:{label:'Eunuch',tier:1,count:8,giftCost:1},
 concubine:{label:'Concubine',tier:2,count:6,giftCost:5},
 scholar:{label:'Scholar',tier:2,count:6,giftCost:5},
 general:{label:'General',tier:3,count:4,giftCost:10},
 prince:{label:'Prince',tier:3,count:4,giftCost:10},
 consort:{label:'Consort',tier:3,count:4,giftCost:10},
 minister:{label:'Minister',tier:3,count:4,giftCost:10},
 prime_minister:{label:'Prime Minister',tier:4,count:1,giftCost:20},
 crown_prince:{label:'Crown Prince',tier:4,count:1,giftCost:20},
 empress_consort:{label:'Empress Consort',tier:4,count:1,giftCost:20},
 empress_dowager:{label:'Empress Dowager',tier:4,count:1,giftCost:20},
} as const;
export type CourtArchetype=keyof typeof COURT_ARCHETYPES;
export type CourtIdentity={name?:string;type?:'major'|'side'|'minor'|null};
const offices:Record<string,CourtArchetype>={'Prime Minister':'prime_minister','Crown Prince':'crown_prince','Empress Consort':'empress_consort','Empress Dowager':'empress_dowager'};
export function courtArchetype(name:string):CourtArchetype|undefined {
 if(offices[name])return offices[name];
 const prefix=name.split(' ')[0].toLowerCase();
 return prefix in COURT_ARCHETYPES?prefix as CourtArchetype:undefined;
}
export function courtOffice(person:CourtIdentity){const key=courtArchetype(person.name??'');return key?COURT_ARCHETYPES[key]:undefined;}
export function courtGiftCost(person:CourtIdentity){return courtOffice(person)?.giftCost??(person.type==='major'?20:person.type==='minor'?1:10);}

export const NPC_INFLUENCE_CAPS={1:.10,2:.40,3:.70,4:.90} as const;
export function courtInfluenceCap(person:CourtIdentity){
 const tier=courtOffice(person)?.tier??(person.type==='major'?4:person.type==='side'?3:person.type==='minor'?1:null);
 return tier?NPC_INFLUENCE_CAPS[tier]:1; // Emperor/unknown actors are outside the four court tiers.
}
export function clampCourtInfluence(person:CourtIdentity,influence:number){return Math.max(0,Math.min(courtInfluenceCap(person),influence));}

export type RomanceProfile={adult:boolean;familyId:string;nonFamilyPlayerRoles:readonly string[];available:boolean};
/** Authored fictional cast: every listed person is an adult and explicitly unrelated
 * to the player in all three careers, including the royal Prince. Offices/titles
 * alone never establish kinship. Unknown future cast has no implicit eligibility. */
const ADULT_NONFAMILY_CAST=[
 'Empress Consort','Crown Prince','Prime Minister','Prince Feng','Prince Han','Prince Jun','Prince Lei',
 'Minister Chen','Minister Wang','Minister Liu','Minister Zhang','Concubine Mei','Concubine Lin','Concubine Xia','Concubine Yun',
 'Maid Ling','Maid Su','Maid Bai','Maid Lan','Maid Ting','Maid He','Maid Rou','Maid Zhu',
 'Eunuch Gao','Eunuch Lu','Eunuch Ren','Eunuch Min','Eunuch Jin','Eunuch Bo','Eunuch Tian','Eunuch Shu',
 'Concubine An','Concubine Qiao','Scholar Qin','Scholar Tao','Scholar Jia','Scholar Ren','Scholar Song','Scholar Yu',
 'Consort Hua','Consort Zhen','Consort Rong','Consort Yue','General Zhao','General Shen','General Wei','General Luo',
] as const;
const ROLES=['prince','minister','concubine'] as const;
export const ROMANCE_PROFILES:Record<string,RomanceProfile>={
 ...Object.fromEntries(ADULT_NONFAMILY_CAST.map(name=>[name,{adult:true,familyId:`authored-family:${name}`,nonFamilyPlayerRoles:ROLES,available:true}])),
 '@player':{adult:true,familyId:'player-royal-or-appointed-family',nonFamilyPlayerRoles:ROLES,available:true},
 'Emperor':{adult:true,familyId:'imperial-senior-family',nonFamilyPlayerRoles:[],available:false},
 'Empress Dowager':{adult:true,familyId:'imperial-senior-family',nonFamilyPlayerRoles:[],available:false},
};
/** Historical eligibility ignores liveness: deaths retain accepted romance history. */
export function authoredRomancePairEligibility(from:string,to:string,playerOffice='player'){
 const a=ROMANCE_PROFILES[from],b=ROMANCE_PROFILES[to];
 if(from===to||!a?.adult||!b?.adult)return{allowed:false,reason:'Romance requires distinct authored adult profiles.'};
 if(!a.available||!b.available)return{allowed:false,reason:'This romance route is not available yet.'};
 if(a.familyId===b.familyId)return{allowed:false,reason:'Relatives cannot enter a romance.'};
 if(from==='@player'||to==='@player'){
  const npc=from==='@player'?b:a,career=playerOffice.includes('prince')?'prince':playerOffice.includes('minister')||playerOffice==='scholar'?'minister':'concubine';
  if(!npc.nonFamilyPlayerRoles.includes(career))return{allowed:false,reason:'This character has no authored non-family relationship with your career.'};
 }
 return{allowed:true,reason:''};
}

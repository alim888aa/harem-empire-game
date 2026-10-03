import {courtArchetype,COURT_ARCHETYPES} from '../lib/courtHierarchy';
/** Stable identity palettes never depend on seasonal ordering, faction or support.
 * Tier1–2 keep restrained variation; tier3 uses four distinct office palettes. */
const seniorNames:Record<string,readonly string[]>={prince:['Prince Feng','Prince Han','Prince Jun','Prince Lei'],minister:['Minister Chen','Minister Wang','Minister Liu','Minister Zhang'],general:['General Zhao','General Shen','General Wei','General Luo'],consort:['Consort Hua','Consort Zhen','Consort Rong','Consort Yue']};
const seniorColors:Record<string,readonly string[]>={prince:['#30353d','#516778','#64546f','#85513e'],minister:['#38475f','#645047','#41605a','#665679'],general:['#34495f','#354f42','#665044','#743d40'],consort:['#397d86','#d5cec2','#a66878','#655076']};
const lowColors:Record<string,readonly string[]>={maid:['#678779','#7f9388'],eunuch:['#4f616e','#5c6573'],concubine:['#8aa396','#b897a8'],scholar:['#939792','#858e95']};
const uniqueColors:Record<string,string>={prime_minister:'#632f3b',crown_prince:'#444d75',empress_consort:'#a71f28',empress_dowager:'#675171'};
const hairColors=['#20242f','#3d2d27','#30283c','#423730'];
const hash=(name:string)=>[...name].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,0);
export function courtAppearance(name:string){
 const archetype=courtArchetype(name);if(!archetype)return{archetype:undefined,assetKey:`unique:${name}`,primary:'#69768c',secondary:'#333740',hair:hairColors[0],unique:true};
 const office=COURT_ARCHETYPES[archetype],index=Math.max(0,seniorNames[archetype]?.indexOf(name)??hash(name)%2);
 return{archetype,assetKey:office.tier===4?`unique:${archetype}`:`archetype:${archetype}`,primary:uniqueColors[archetype]??seniorColors[archetype]?.[index]??lowColors[archetype]?.[index%2]??'#69768c',secondary:['#252a34','#3e4653','#393143','#493630'][index%4],hair:hairColors[office.tier===3?index%4:0],unique:office.tier===4};
}

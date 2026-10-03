import { careerEntryZone, PALACE_ZONE_TITLES, type PalaceZone } from '../lib/careerAccess';

export type PlayableZone = Exclude<PalaceZone, 'common'>;
export type ZoneBounds = { minX:number; maxX:number; minZ:number; maxZ:number };
export type PlayerVisitPose = { x:number; z:number; yaw:number; pitch:number; distance:number; y?:number; velocity?:number; airborne?:boolean };
export type NpcVisitPose = { zone:PlayableZone; x:number; z:number; rotationY:number };
export interface PalaceVisitState {
  zone:PlayableZone;
  playerByZone:Partial<Record<PlayableZone,PlayerVisitPose>>;
  npcByName:Record<string,NpcVisitPose>;
}
export const PLAYABLE_ZONES:readonly PlayableZone[] = ['library','emperor','empress','ladies','dowager'];
export const ZONES:Record<PlayableZone,{title:string;subtitle:string;bounds:ZoneBounds;ceilingHeight:number;wall:string;floor:string}>={
  library:{title:PALACE_ZONE_TITLES.library,subtitle:'Archive aisles · reading chamber',bounds:{minX:-17,maxX:17,minZ:-20,maxZ:20},ceilingHeight:6.8,wall:'#48615e',floor:'#9e987e'},
  emperor:{title:PALACE_ZONE_TITLES.emperor,subtitle:'Ceremonial hall · imperial dais',bounds:{minX:-23.8,maxX:23.8,minZ:-28,maxZ:24},ceilingHeight:8.8,wall:'#813c32',floor:'#9b9280'},
  empress:{title:PALACE_ZONE_TITLES.empress,subtitle:'Phoenix audience hall · silk salon',bounds:{minX:-18,maxX:18,minZ:-22,maxZ:20},ceilingHeight:7.4,wall:'#824853',floor:'#b1a090'},
  ladies:{title:PALACE_ZONE_TITLES.ladies,subtitle:'Flower court · music pavilion · residential chambers',bounds:{minX:-20,maxX:20,minZ:-28,maxZ:20},ceilingHeight:6.4,wall:'#55766a',floor:'#aea18b'},
  dowager:{title:PALACE_ZONE_TITLES.dowager,subtitle:'Quiet audience · ancestral shrine',bounds:{minX:-17,maxX:17,minZ:-23,maxZ:20},ceilingHeight:7.2,wall:'#544a65',floor:'#969683'},
};
export const isPlayableZone=(zone:unknown):zone is PlayableZone=>PLAYABLE_ZONES.includes(zone as PlayableZone);
export function createPalaceVisitState(role:string|null):PalaceVisitState {
  const entry=careerEntryZone(role);
  return{zone:isPlayableZone(entry)?entry:'library',playerByZone:{},npcByName:{}};
}
export function zoneSpawn(zone:PlayableZone){return{x:0,z:ZONES[zone].bounds.maxZ-5};}
export function zoneGates(zone:PlayableZone){
  const b=ZONES[zone].bounds;
  const positions=[{x:-6,z:b.minZ+1},{x:b.maxX-1,z:0},{x:6,z:b.maxZ-1},{x:b.minX+1,z:0}];
  return PLAYABLE_ZONES.filter(to=>to!==zone).map((to,i)=>({id:`${zone}:${to}`,to,...positions[i],label:ZONES[to].title}));
}
const hash=(name:string)=>[...name].reduce((value,char)=>((value*31+char.charCodeAt(0))>>>0),0);
// One slot per eligible destination is one placement weight. A name-offset route
// gives each courtier equal time in its listed zones across seasons, without
// forcing equal headcounts or drawing from the saved campaign RNG.
const routeZone=(name:string,season:number,phase:number,route:readonly PlayableZone[]):PlayableZone=>
  route[(hash(name)+phase+Math.max(1,Math.floor(season)))%route.length];
/** Pure, deterministic and independent of renderer state. Each quarter-season is
 * a visit period. Campaign actors keep their identity while their spatial home changes. */
export function scheduledNpcZone(name:string,season:number,progress:number):PlayableZone {
  const phase=Math.min(3,Math.max(0,Math.floor((Number.isFinite(progress)?progress:0)*4)));
  if(name==='Empress Dowager')return phase===2?'ladies':'dowager';
  if(name==='Empress Consort')return phase===3?'ladies':'empress';
  if(name==='Emperor')return ['emperor','empress','ladies','dowager'][phase] as PlayableZone;
  if(name==='Crown Prince')return phase===1?(Math.floor(season)%2?'dowager':'empress'):phase===2?'ladies':phase===3?'library':'emperor';
  if(name==='Prime Minister')return phase===1?'library':phase===3?'empress':'emperor';
  if(name.startsWith('Scholar'))return phase===1&&hash(name)%3===Math.abs(season)%3?'empress':'library';
  if(name.startsWith('Consort'))return phase===1?'empress':phase===3&&hash(name)%2===0?'dowager':'ladies';
  if(name.startsWith('General'))return phase===0?'emperor':phase===1?'library':phase===2?'dowager':'empress';
  if(name.startsWith('Eunuch')){
    const route:PlayableZone[]=['emperor','library','ladies','dowager','empress'];
    return routeZone(name,season,phase,route);
  }
  if(name.startsWith('Maid')){
    // Every maid, including the original four, has equal placement weight in
    // Ladies, Empress and Dowager. The active seasonal cast can still be uneven.
    return routeZone(name,season,phase,['ladies','empress','dowager']);
  }
  const visiting=(phase+hash(name)+Math.max(1,Math.floor(season)))%4===3;
  if(name.startsWith('Concubine'))return visiting?'empress':'ladies';
  if(name.startsWith('Minister')){
    const attendee=['Minister Chen','Minister Wang','Minister Liu','Minister Zhang'][Math.abs(Math.floor(season)-1)%4];
    if(phase===2&&name===attendee)return 'empress';
    return visiting?'emperor':'library';
  }
  if(name.startsWith('Prince')){
    // Retain the usual Empress audience; alternate the visiting slot so no
    // prince is permanently excluded from either Dowager or Library by name.
    return routeZone(name,season,phase,['empress','empress','empress','library','empress','empress','empress','dowager']);
  }
  if(name.startsWith('Grand Prince'))return routeZone(name,season,phase,['library','emperor','empress','dowager']);
  return 'library';
}
export function zoneRoster<T extends{name:string}>(people:readonly T[],zone:PlayableZone,season:number,progress:number,_role?:string|null):T[]{
  return people.filter(person=>scheduledNpcZone(person.name,season,progress)===zone);
}

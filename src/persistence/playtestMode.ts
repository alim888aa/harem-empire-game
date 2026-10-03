import type {SaveStorage} from './campaignSave';
export const isIntriguePlaytest=(search:string)=>new URLSearchParams(search).get('playtest')==='intrigue';
/** Every key is isolated; ordinary campaigns are never read or changed. */
export function playtestSaveStorage(storage:SaveStorage|null):SaveStorage|null{return storage?{getItem:key=>storage.getItem(`qa-intrigue:${key}`),setItem:(key,value)=>storage.setItem(`qa-intrigue:${key}`,value),removeItem:key=>storage.removeItem(`qa-intrigue:${key}`)}:null;}

/** Labelled responsive QA harness only; never changes normal campaign routing. */
export const isTouchViewportPlaytest=(search:string)=>{
  const query=new URLSearchParams(search);
  return isIntriguePlaytest(search)&&query.get('controls')==='touch'&&query.get('renderer')==='software'&&query.get('frame')==='touch-viewport';
};

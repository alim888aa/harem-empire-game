export interface ScreenRect {left:number;top:number;right:number;bottom:number}
const overlaps=(a:ScreenRect,b:ScreenRect)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
/** Never clamp a reply onto a face: choose free space, otherwise use the dialog copy. */
export function placeSpeech(bounds:ScreenRect,actor:ScreenRect,width:number,height:number,obstacles:ScreenRect[]=[]){
 const gap=20, center=(actor.left+actor.right)/2;
 const clampX=(x:number)=>Math.max(bounds.left,Math.min(bounds.right-width,x));
 const clampY=(y:number)=>Math.max(bounds.top,Math.min(bounds.bottom-height,y));
 const candidates=[
  {left:actor.right+gap,top:clampY(actor.top)},
  {left:actor.left-gap-width,top:clampY(actor.top)},
  {left:clampX(center-width/2),top:actor.top-gap-height},
 ];
 for(const c of candidates){
  const rect={...c,right:c.left+width,bottom:c.top+height};
  if(rect.left>=bounds.left&&rect.right<=bounds.right&&rect.top>=bounds.top&&rect.bottom<=bounds.bottom&&!overlaps(rect,actor)&&!obstacles.some(o=>overlaps(rect,o)))return rect;
 }
 return null;
}

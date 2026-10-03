export interface JumpState { y:number; velocity:number; airborne:boolean }
export const JUMP_SPEED=4.7;
export const JUMP_GRAVITY=12;
export function requestJump(state:JumpState,floor:number,ceiling=Infinity){
  if(state.airborne || ceiling-floor<.08)return false;
  state.y=Math.max(state.y,floor);state.velocity=JUMP_SPEED;state.airborne=true;return true;
}
/** The same bounded vertical step is used by keyboard, touch and playtest controls. */
export function stepJump(state:JumpState,delta:number,floor:number,ceiling=Infinity){
  if(!state.airborne || delta<=0)return;
  const count=Math.max(1,Math.ceil(delta/.016)),step=delta/count;
  for(let i=0;i<count;i++){
    state.velocity-=JUMP_GRAVITY*step;
    let next=state.y+state.velocity*step;
    if(state.velocity>0&&next>ceiling){next=Math.max(floor,Math.min(state.y,ceiling));state.velocity=0;}
    state.y=next;
    if(state.y<=floor){state.y=floor;state.velocity=0;state.airborne=false;break;}
  }
}

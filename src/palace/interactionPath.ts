import type {Collider} from './world';
import type {ZoneBounds} from './zones';
/** A nearby name or gate must be reachable along a clear local corridor.
 * Distance alone would permit interaction through a thin room partition. */
export function clearInteractionPath(from:{x:number;z:number},to:{x:number;z:number},colliders:readonly Collider[],bounds:ZoneBounds,radius=.32){
 const length=Math.hypot(to.x-from.x,to.z-from.z),steps=Math.max(1,Math.ceil(length/.15));
 for(let i=1;i<=steps;i++){
  const t=i/steps,x=from.x+(to.x-from.x)*t,z=from.z+(to.z-from.z)*t;
  if(x<=bounds.minX+.45||x>=bounds.maxX-.45||z<=bounds.minZ+.45||z>=bounds.maxZ-.45||colliders.some(c=>Math.abs(x-c.x)<c.w/2+radius&&Math.abs(z-c.z)<c.d/2+radius))return false;
 }
 return true;
}

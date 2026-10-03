/** Free-roam presentation time only. Never substitutes for a campaign season. */
export const FIRST_EMPEROR_VISIT_SECONDS=75;
export function validFirstVisitTick(seconds:number){return Number.isFinite(seconds)&&seconds>0&&seconds<=2;}
export function countsFreeRoamTime(delta:number,paused:boolean,hidden:boolean,expired:boolean){return !paused&&!hidden&&!expired&&validFirstVisitTick(delta);}

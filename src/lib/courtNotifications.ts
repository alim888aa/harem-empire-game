export type GiftNotification={id:string;name:string;amount:number;season:number;read:boolean};
export const MAX_GIFT_NOTIFICATIONS=50;
export function recordGiftNotification(previous:readonly GiftNotification[],name:string,amount:number,season:number):GiftNotification[]{
 const id=`${season}:${name}`;
 if(previous.some(n=>n.id===id))return [...previous];
 return [...previous,{id,name,amount,season,read:false}].slice(-MAX_GIFT_NOTIFICATIONS);
}

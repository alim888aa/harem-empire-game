import {getResponseByType} from '../lib/getResponse';
import {promotionHate} from '../lib/campaignBalance';
import {assign,sendParent,setup,enqueueActions} from 'xstate';
import {clampCourtInfluence} from '../lib/courtHierarchy';
import {withoutRetiredRelationships,type GiftWithMessageResult} from '../lib/checkMessage';
import type {CharacterPersonalityVectors,CharacterRelationshipVectors,InitialCharacterType} from '../types/character';
import type {FactionType} from '../lib/factionSystem';
import {giftMessage,validGiftRequestId,validGiftResult,type MessageChoice} from '../lib/giftMessages';
import type {CourtRelation,RelationshipCommand} from '../lib/courtGraph';
export type RelationshipOrigin={kind:'plain'}|{kind:'spit'}|{kind:'penalty';suspicionPenalty:number}|{kind:'gift';requestId:string;sessionId:number;messageType:MessageChoice;result:GiftWithMessageResult};
export type CharacterContext={
 name:string;type:'major'|'side'|'minor'|null;supportLevel:number;supportThreshold:number;suspicion:number;hate:number;
 factionOverride:FactionType|null;playerFaction?:FactionType|null;personalityVectors:CharacterPersonalityVectors;relationshipVectors:CharacterRelationshipVectors;
 lastResponse:string;imgPath:string;suspicionThreshold:number;hasGivenSupport:boolean;hasGivenAllegiance:boolean;hasGivenGifts:boolean;giftCooldownUntil:number;currentSeason:number;giftSessionId:number;processedGiftRequests:string[];
 graphCommandSerial:number;graphProjectionSerial:number;isLover:boolean;legacyCourtshipGiftEligible:boolean;
};
type CharacterEvent=
 |{type:'APPLY_ROMANCE_SUSPICION'}
 |{type:'SYNC_ROMANCE_PROJECTION';relation:CourtRelation;response?:string}
 |{type:'CONSORT_HOSTILITY'}|{type:'WITHDRAW_BACKING'}|{type:'GAIN_HATE';amount:number}
 |{type:'FOLLOW_PLAYER_FACTION';faction:FactionType}|{type:'SET_PLAYER_FACTION';faction:FactionType|null}
 |{type:'ACTIVATE'}|{type:'DEACTIVATE'}|{type:'SPIT_IN_FACE'}|{type:'APPLY_FEAR';fearAmount:number}
 |{type:'UPDATE_SEASON';currentSeason:number}|{type:'APPLY_FACTION_BONUS';supportBonus:number}
 |{type:'APPLY_FACTION_PENALTY';supportPenalty:number;suspicionPenalty:number}|{type:'APPLY_SUSPICION_CHANGE';suspicionChange:number}
 |{type:'APPLY_EVALUATED_GIFT';requestId:string;sessionId:number;messageType:MessageChoice;result:GiftWithMessageResult}
 |{type:'APPLY_RELATIONSHIP_PROJECTION';serial:number;relation:CourtRelation;origin:RelationshipOrigin;newlyPledged:boolean};
function requestedChange(c:CharacterContext,e:CharacterEvent,active:boolean):{command:RelationshipCommand;origin:RelationshipOrigin}|null {
 switch(e.type){
 case 'ACTIVATE':return{command:{kind:'support',amount:0,formPledge:true},origin:{kind:'plain'}};
 case 'APPLY_EVALUATED_GIFT':return{command:{kind:'gift',support:e.result.newSupportLevel,negativeDelta:e.result.supportDelta,formPledge:true},origin:{kind:'gift',requestId:e.requestId,sessionId:e.sessionId,messageType:e.messageType,result:e.result}};
 case 'APPLY_FACTION_BONUS':return{command:{kind:'support',amount:e.supportBonus,formPledge:active},origin:{kind:'plain'}};
 case 'APPLY_FACTION_PENALTY':return{command:{kind:'support',amount:-e.supportPenalty,formPledge:false},origin:{kind:'penalty',suspicionPenalty:e.suspicionPenalty}};
 case 'WITHDRAW_BACKING':return{command:{kind:'withdraw',threshold:c.supportThreshold},origin:{kind:'plain'}};
 case 'CONSORT_HOSTILITY':return{command:{kind:'rivalry',amount:promotionHate('concubine'),threshold:c.supportThreshold},origin:{kind:'plain'}};
 case 'GAIN_HATE':return{command:{kind:'hate',amount:e.amount},origin:{kind:'plain'}};
 case 'SPIT_IN_FACE':return{command:{kind:'spit'},origin:{kind:'spit'}};
 default:return null;
 }
}
/** Character actors own personality, suspicion, animation receipts and historical
 * reward flags. Support/hate/pledge are projections of the parent-owned court graph. */
export const characterMachine=setup({
 types:{input:{} as InitialCharacterType&{giftSessionId?:number},context:{} as CharacterContext,events:{} as CharacterEvent},
 actions:{requestRelationship:enqueueActions(({context,event,enqueue,self})=>{
  const request=requestedChange(context,event,self.getSnapshot().value==='alive');if(!request)return;
  const serial=(context.graphCommandSerial??0)+1;enqueue.assign({graphCommandSerial:serial});
  enqueue.sendParent({type:'RELATIONSHIP_COMMAND',name:context.name,actorId:self.id,serial,...request});
 })},
 guards:{
  characterSuspicious:({context})=>!context.hasGivenAllegiance&&context.suspicion>=context.suspicionThreshold,
  giveSupport:({context})=>context.supportLevel>=context.supportThreshold&&!context.hasGivenSupport,
  giveGifts:({context})=>(context.supportLevel>=100||context.legacyCourtshipGiftEligible)&&!context.hasGivenGifts,
 }
}).createMachine({
 context:({input})=>({name:input.name,type:input.type,supportLevel:0,supportThreshold:input.supportThreshold??80,factionOverride:null,playerFaction:null,suspicion:0,hate:0,
  personalityVectors:{...input.vectors,influence:clampCourtInfluence(input,input.vectors.influence)},relationshipVectors:{fearOfPlayer:0,loveForPlayer:0},lastResponse:'',imgPath:input.imgPath,suspicionThreshold:input.suspicionThreshold,
  hasGivenSupport:false,hasGivenAllegiance:false,hasGivenGifts:false,giftCooldownUntil:0,currentSeason:1,giftSessionId:input.giftSessionId??0,processedGiftRequests:[],graphCommandSerial:0,graphProjectionSerial:0,isLover:false,legacyCourtshipGiftEligible:false}),
 initial:'inactive',
 on:{
  SYNC_ROMANCE_PROJECTION:{actions:assign(({context,event})=>({relationshipVectors:{...context.relationshipVectors,loveForPlayer:event.relation.affection/100},isLover:!!event.relation.romance,lastResponse:event.response??context.lastResponse}))},
  CONSORT_HOSTILITY:{actions:'requestRelationship'},WITHDRAW_BACKING:{actions:'requestRelationship'},GAIN_HATE:{guard:({event})=>Number.isFinite(event.amount)&&event.amount>0,actions:'requestRelationship'},
  APPLY_FACTION_BONUS:{actions:'requestRelationship'},APPLY_FACTION_PENALTY:{actions:'requestRelationship'},
  SET_PLAYER_FACTION:{actions:assign({playerFaction:({event})=>event.faction})},
  FOLLOW_PLAYER_FACTION:{guard:({context})=>context.hasGivenAllegiance,actions:assign({factionOverride:({event})=>event.faction,suspicion:0,personalityVectors:({context})=>({...context.personalityVectors,suspicion:0})})},
  APPLY_FEAR:{actions:assign({relationshipVectors:({context,event})=>({...context.relationshipVectors,fearOfPlayer:Math.min(1,context.relationshipVectors.fearOfPlayer+event.fearAmount)})})},
  APPLY_ROMANCE_SUSPICION:{actions:assign({suspicion:({context})=>context.hasGivenAllegiance?0:Math.min(1,Math.round((context.suspicion+.1)*1e12)/1e12)})},
  APPLY_SUSPICION_CHANGE:{actions:assign({suspicion:({context,event})=>context.hasGivenAllegiance?0:Math.max(0,Math.min(1,context.suspicion+event.suspicionChange))})},
  UPDATE_SEASON:{actions:assign(({context,event})=>({currentSeason:event.currentSeason,hasGivenGifts:context.giftCooldownUntil>0&&event.currentSeason>=context.giftCooldownUntil?false:context.hasGivenGifts,giftCooldownUntil:context.giftCooldownUntil>0&&event.currentSeason>=context.giftCooldownUntil?0:context.giftCooldownUntil}))},
  APPLY_RELATIONSHIP_PROJECTION:{
   guard:({context,event})=>event.serial>(context.graphProjectionSerial??0)&&event.serial<=(context.graphCommandSerial??0),
   actions:[
    assign(({context,event})=>{
     const pledged=!!event.relation.pledge,origin=event.origin;
     let suspicion=context.suspicion,personalityVectors=context.personalityVectors,relationshipVectors=context.relationshipVectors,processedGiftRequests=context.processedGiftRequests;
     if(origin.kind==='gift'){
      personalityVectors={...origin.result.newPersonalityVectors,influence:clampCourtInfluence(context,origin.result.newPersonalityVectors.influence)};
      relationshipVectors=withoutRetiredRelationships(origin.result.newRelationshipVectors);suspicion=personalityVectors.suspicion;processedGiftRequests=[...processedGiftRequests,origin.requestId];
     }else if(origin.kind==='spit')suspicion=Math.min(1,suspicion+(context.supportLevel===0?.5:.3));
     else if(origin.kind==='penalty')suspicion=Math.min(1,suspicion+origin.suspicionPenalty);
     if(pledged){suspicion=0;personalityVectors={...personalityVectors,suspicion:0};}
     relationshipVectors={...relationshipVectors,loveForPlayer:event.relation.affection/100};
     const lastResponse=origin.kind==='gift'?getResponseByType(context.name,origin.result.responseType as Parameters<typeof getResponseByType>[1]):origin.kind==='spit'?`${context.name}: I will remember this insult.`:context.lastResponse;
     return{isLover:!!event.relation.romance,lastResponse,supportLevel:event.relation.support,hate:event.relation.hate,hasGivenAllegiance:pledged,factionOverride:pledged&&context.playerFaction?context.playerFaction:context.factionOverride,suspicion,personalityVectors,relationshipVectors,processedGiftRequests,graphProjectionSerial:event.serial};
    }),
    enqueueActions(({context,event,self,enqueue})=>{
     if(event.origin.kind==='gift')enqueue.sendParent({type:'GIFT_APPLIED',requestId:event.origin.requestId,sessionId:event.origin.sessionId,characterId:context.name,actorId:self.id,response:event.origin.result.responseType});
     if(event.newlyPledged)enqueue.sendParent({type:'CHARACTER_GAVE_ALLEGIANCE',characterType:context.type,name:context.name});
    })
   ]
  }
 },
 states:{
  inactive:{on:{ACTIVATE:[{guard:({context})=>context.supportLevel>=100&&!context.hasGivenAllegiance,target:'activating',actions:'requestRelationship'},{target:'alive'}]}},
  activating:{always:{guard:({context})=>context.graphProjectionSerial===context.graphCommandSerial,target:'alive'}},
  alive:{
   always:[
    {guard:'giveSupport',actions:[assign({hasGivenSupport:true}),sendParent(({context})=>({type:'CHARACTER_GAVE_SUPPORT',characterType:context.type,name:context.name}))]},
    {guard:'giveGifts',actions:[assign({hasGivenGifts:true,giftCooldownUntil:({context})=>context.currentSeason+3}),sendParent(({context})=>({type:'CHARACTER_GAVE_GIFTS',characterType:context.type,name:context.name}))]},
    {guard:'characterSuspicious',actions:sendParent(({context})=>({type:'CHARACTER_IS_SUSPICIOUS',characterType:context.type,name:context.name}))}
   ],
   on:{
    DEACTIVATE:'inactive',SPIT_IN_FACE:{actions:'requestRelationship'},
    APPLY_EVALUATED_GIFT:{guard:({context,event})=>validGiftRequestId(event.requestId)&&event.sessionId===context.giftSessionId&&!!giftMessage(event.messageType)&&!context.processedGiftRequests.includes(event.requestId)&&validGiftResult(event.result),actions:'requestRelationship'}
   }
  }
 }
});

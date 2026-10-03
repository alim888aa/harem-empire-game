import assert from 'node:assert/strict';
import test from 'node:test';
import {analyzeMessageChoice,processGiftWithMessage,roundGiftSupport} from '../src/lib/checkMessage';
import {giftPositiveScale,relativeInfluenceScale,CAMPAIGN_BALANCE as B} from '../src/lib/campaignBalance';
const stats={influence:.6,ambition:.6,loyalty:.8,fear:.2,charisma:.4};
const personality={trust:.5,fear:.6,ambition:.4,loyalty:.8,influence:.5,romantic:.2,suspicion:0};
const relationships={fearOfPlayer:.1,loveForPlayer:0};
for(const role of ['prince','minister','concubine'] as const){
 test(`${role}: authored scores have no retired personal-meter or charisma multipliers`,()=>{
  for(const choice of ['ambitious','loyal','cautious','neutral'] as const)for(const legacy of [0,.4,.6,.8,1]){
   const old={...relationships,trustInPlayer:legacy,loyaltyToPlayer:legacy,dependenceOnPlayer:legacy};
   const baseline=processGiftWithMessage(choice,personality,relationships,role,stats,25);
   assert.deepEqual(processGiftWithMessage(choice,personality,old,role,{...stats,charisma:legacy},25),baseline);
   for(const key of ['trustInPlayer','loyaltyToPlayer','dependenceOnPlayer'])assert.ok(!(key in baseline.newRelationshipVectors));
  }
  assert.equal(analyzeMessageChoice('loyal',personality,relationships,role,.4).supportDelta,B.messageSupport[role].match);
  assert.equal(analyzeMessageChoice('neutral',personality,relationships,role,.4).supportDelta,B.messageSupport[role].neutral);
 });
 test(`${role}: positive scaling never softens bad-message penalties or turns capped support into a loss`,()=>{
  for(const scale of [0,.1,.6,1,1.5]){
   const bad=processGiftWithMessage('ambitious',personality,relationships,role,stats,60,{positiveEffectScale:scale});
   assert.equal(bad.supportDelta,-12);assert.equal(bad.newSupportLevel,48);assert.equal(bad.newPersonalityVectors.suspicion,.3);
   const good=processGiftWithMessage('loyal',personality,relationships,role,stats,99,{positiveEffectScale:scale});
   assert.ok(good.newSupportLevel>=99&&good.newSupportLevel<=100);
  }
 });
}
test('relative influence is strictly monotonic on BOTH sides of player power, bounded and hostility is explicit',()=>{
 for(const player of [0,.1,.4,.7,.9,1]){
  const scales=[.1,.4,.7,.9].map(influence=>giftPositiveScale({personalityVectors:{influence}},player));
  assert.ok(scales.every((v,i)=>i===0||v<scales[i-1]));
 }
 assert.equal(relativeInfluenceScale(.4,.4),1);assert.equal(relativeInfluenceScale(1,0),1.5);assert.equal(relativeInfluenceScale(0,1),.5);
 assert.equal(giftPositiveScale({hate:80,personalityVectors:{influence:.4}},.4),.1);
 assert.equal(giftPositiveScale({hate:80,hasGivenAllegiance:true,personalityVectors:{influence:.4}},.4),1);
});
test('unknown message and nonfinite multipliers fail validation',()=>{
 for(const choice of ['',null,'romantic','custom'])assert.throws(()=>processGiftWithMessage(choice as any,personality,relationships,'prince',stats,25),TypeError);
 for(const positiveEffectScale of [-1,NaN,Infinity])assert.throws(()=>processGiftWithMessage('loyal',personality,relationships,'prince',stats,25,{positiveEffectScale}),RangeError);
});

test('gift effects round once to whole points, symmetrically, without negative zero',()=>{
 for(const [raw,expected] of [[19.62,20],[12.31,12],[1.499,1],[1.5,2],[.49,0],[.5,1],[0,0]]){
  assert.equal(roundGiftSupport(raw),expected);
  assert.equal(roundGiftSupport(-raw),expected===0?0:-expected);
 }
});
test('rounding follows combined positive scaling and leaves personality and influence precision alone',()=>{
 for(const [raw,expected] of [[19.62,20],[12.31,12],[1.499,1],[.49,0],[.5,1]]){
  const scale=raw/20;
  const result=processGiftWithMessage('ambitious',{...personality,ambition:.7,loyalty:.3},relationships,'prince',stats,0,{positiveEffectScale:scale});
  assert.equal(result.supportDelta,expected);assert.equal(result.newSupportLevel,expected);
  assert.equal(result.newPersonalityVectors.ambition,.7+.05*scale);
  assert.equal(result.newPersonalityVectors.influence,personality.influence);
 }
 assert.equal(stats.influence,.6);
});
test('whole gift effects preserve legacy fractions and clamp only actual support, not negative hate intent',()=>{
 const good=(support:number)=>processGiftWithMessage('loyal',personality,relationships,'prince',stats,support,{positiveEffectScale:.981});
 assert.equal(good(10.31).newSupportLevel,30.31);
 for(const support of [99,99.62,100]){assert.equal(good(support).newSupportLevel,100);assert.equal(good(support).supportDelta,20);}
 for(const support of [0,.38,3,12.31]){
  const bad=processGiftWithMessage('ambitious',personality,relationships,'prince',stats,support,{positiveEffectScale:.001});
  assert.equal(bad.supportDelta,-12);assert.equal(bad.newSupportLevel,support>12?.31:0);
 }
});

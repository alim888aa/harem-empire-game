import test from 'node:test';
import assert from 'node:assert/strict';
import { mayPromote, promotionRequirement, demotedRank, giftPositiveScale, CAMPAIGN_BALANCE as B } from '../src/lib/campaignBalance';
import { createInitialCharacters } from '../src/data/characters';
test('three ladders use global targets, influence and probation independently',()=>{
 for(const [role,mid,top] of [['prince','grand_prince','crown_prince'],['minister','minister','prime_minister'],['concubine','consort','empress']]){
  const next=promotionRequirement(role,null)!;assert.equal(next.rank,mid);
  assert.equal(mayPromote({role,rank:null,support:next.globalSupport,influence:next.influence,season:1}),true);
  assert.equal(mayPromote({role,rank:null,support:next.globalSupport,influence:next.influence,season:1,eligibleAfterSeason:3}),false);
  assert.equal(promotionRequirement(role,mid)!.rank,top);assert.equal(promotionRequirement(role,top),null);
  assert.equal(demotedRank(role,top),mid);assert.equal(demotedRank(role,mid),null);
 }
});
test('enemy positive multiplier is small, pledged allies exempt; roster is reproducible',()=>{
 assert.equal(giftPositiveScale({hate:80},0),B.enemyPositiveScale);
 assert.equal(giftPositiveScale({hate:80,hasGivenAllegiance:true},0),1);
 assert.deepEqual(createInitialCharacters(()=>0.5),createInitialCharacters(()=>0.5));
 assert.equal(createInitialCharacters(()=>0.5).length,48);
});

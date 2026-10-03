import test from 'node:test';
import assert from 'node:assert/strict';
import { promotionDeadline, PROMOTION_WINDOWS } from '../src/lib/careerDeadline.ts';
for(const [role,middle,top] of [['prince','grand_prince','crown_prince'],['scholar','minister','prime_minister'],['concubine','consort','empress']] as const){
 test(`${role}: each rank has a fresh advancement or faction-victory window`,()=>{
   const window=PROMOTION_WINDOWS[role];
   assert.equal(promotionDeadline(role,null,1,1)?.seasonsRemaining,window);
   assert.equal(promotionDeadline(role,null,1,window)?.seasonsRemaining,1);
   assert.equal(promotionDeadline(role,null,1,window+1)?.expired,true);
   assert.equal(promotionDeadline(role,middle,7,7)?.seasonsRemaining,window);
   assert.equal(promotionDeadline(role,middle,7,7+window-1)?.expired,false);
   assert.equal(promotionDeadline(role,middle,7,7+window)?.expired,true);
   assert.equal(promotionDeadline(role,top,7,7)?.seasonsRemaining,window);
   assert.equal(promotionDeadline(role,top,7,7+window)?.goal,'faction_victory');
   assert.deepEqual(promotionDeadline(role,top,7,7+window)?.outcome,{kind:'demotion',rank:middle});
   assert.deepEqual(promotionDeadline(role,middle,7,7+window)?.outcome,{kind:'demotion',rank:role});
 });
}
test('legacy Scholar identity and old final Empress title retain their meaning',()=>{
 assert.equal(promotionDeadline('minister',null,1,1)?.window,16);
 assert.equal(promotionDeadline('concubine','empress_consort',1,99)?.goal,'faction_victory');
 assert.equal(promotionDeadline('concubine',null,1,13)!.outcome.kind,'career_ending');
 assert.equal(promotionDeadline('scholar',null,1,17)!.outcome.kind,'career_ending');
 assert.equal(promotionDeadline('prince',null,1,21)!.outcome.kind,'career_ending');
});

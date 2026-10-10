import test from 'node:test';
import assert from 'node:assert/strict';
import {placeSpeech} from '../src/palace/speechPlacement';
test('landscape reply uses space beside the full character',()=>{
 const p=placeSpeech({left:16,right:1264,top:110,bottom:490},{left:700,right:850,top:180,bottom:480},300,100);
 assert.ok(p);assert.ok(p.left>=870||p.right<=680||p.bottom<=160);
});
test('narrow portrait falls back instead of clamping onto the face',()=>{
 assert.equal(placeSpeech({left:16,right:374,top:100,bottom:350},{left:80,right:300,top:110,bottom:450},320,130),null);
});
test('warning overlays exclude otherwise valid placement',()=>{
 const p=placeSpeech({left:16,right:1264,top:110,bottom:490},{left:700,right:850,top:180,bottom:480},300,100,[{left:870,right:1200,top:100,bottom:400}]);
 assert.ok(p);assert.ok(p.right<=680);
});
test('oversized messages retain dialog fallback',()=>{
 assert.equal(placeSpeech({left:16,right:900,top:100,bottom:300},{left:300,right:500,top:150,bottom:500},400,500),null);
});
test('the player is protected as well as the speaking NPC', () => {
 const npc={left:420,right:540,top:130,bottom:420};
 const player={left:560,right:740,top:100,bottom:490};
 const placement=placeSpeech({left:16,right:1000,top:90,bottom:500},npc,310,110,[player]);
 assert.ok(placement);
 assert.ok(placement.right<=player.left||placement.left>=player.right||placement.bottom<=player.top||placement.top>=player.bottom);
});

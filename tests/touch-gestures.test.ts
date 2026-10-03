import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CameraGesture, JoystickGesture, combineMovement, joystickVector } from '../src/palace/touchGestures';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('joystick deadzone prevents thumb noise and invalid radii never move',()=>{
  assert.deepEqual(joystickVector(5,0,50),{right:0,forward:0});
  assert.deepEqual(joystickVector(7,0,50),{right:0,forward:0});
  assert.deepEqual(joystickVector(20,0,0),{right:0,forward:0});
  assert.deepEqual(joystickVector(NaN,1,50),{right:0,forward:0});
});
test('joystick preserves analog strength, axes and bounded diagonals',()=>{
  const slow=joystickVector(25,0,50);assert.ok(slow.right>0&&slow.right<1);near(slow.forward,0);
  near(joystickVector(0,-100,50).forward,1);near(joystickVector(-100,0,50).right,-1);
  near(Math.hypot(...Object.values(joystickVector(200,200,50))),1);
});
test('floating joystick has exclusive ownership and ignores unrelated releases',()=>{
  const stick=new JoystickGesture();assert.equal(stick.begin(1,{x:50,y:50},50),true);
  assert.equal(stick.begin(2,{x:150,y:50},50),false);
  assert.equal(stick.move(2,{x:0,y:0}),null);assert.equal(stick.end(2),false);
  near(stick.move(1,{x:50,y:0})!.forward,1);assert.equal(stick.pointerId,1);
  assert.equal(stick.end(1),true);assert.deepEqual(stick.vector,{right:0,forward:0});
  assert.equal(stick.move(1,{x:0,y:0}),null);assert.equal(stick.begin(3,{x:100,y:100},50),true);
  assert.deepEqual(stick.vector,{right:0,forward:0});
});
test('camera ignores unrelated pointer motion/cancel and limits pinch ownership',()=>{
  const camera=new CameraGesture();assert.equal(camera.begin(10,{x:400,y:200}),true);
  assert.equal(camera.move(1,{x:600,y:500}),null);assert.equal(camera.end(1),false);
  assert.deepEqual(camera.move(10,{x:420,y:210}),{dx:20,dy:10,zoom:0});
  assert.equal(camera.begin(11,{x:500,y:210}),true);assert.equal(camera.begin(12,{x:550,y:210}),false);
  assert.deepEqual(camera.pointerIds,[10,11]);
});
test('pinch only zooms, never pans; returning to one-finger drag has no jump',()=>{
  const camera=new CameraGesture();camera.begin(10,{x:400,y:200});camera.begin(11,{x:500,y:200});
  const zoom=camera.move(11,{x:600,y:200})!;assert.equal(zoom.dx,0);assert.equal(zoom.dy,0);near(zoom.zoom,Math.log(.5));
  camera.end(11);assert.deepEqual(camera.move(10,{x:405,y:202}),{dx:5,dy:2,zoom:0});
  camera.reset();assert.deepEqual(camera.pointerIds,[]);assert.equal(camera.move(10,{x:999,y:999}),null);
});
test('movement, right-camera drag and independent action pointer coexist',()=>{
  const stick=new JoystickGesture(),camera=new CameraGesture();stick.begin(1,{x:100,y:500},50);stick.move(1,{x:100,y:450});
  camera.begin(2,{x:700,y:500});assert.deepEqual(camera.move(2,{x:720,y:480}),{dx:20,dy:-20,zoom:0});
  camera.end(3);stick.end(3);assert.equal(stick.pointerId,1);near(stick.vector.forward,1);
  camera.end(2);near(stick.vector.forward,1);stick.end(1);assert.deepEqual(stick.vector,{right:0,forward:0});
});
test('reset covers lost capture, blur, pause and orientation without inherited input',()=>{
  const stick=new JoystickGesture(),camera=new CameraGesture();stick.begin(1,{x:100,y:100},50);stick.move(1,{x:100,y:0});camera.begin(2,{x:500,y:100});
  stick.reset();camera.reset();assert.equal(stick.pointerId,null);assert.deepEqual(stick.vector,{right:0,forward:0});
  assert.equal(stick.move(1,{x:100,y:0}),null);assert.equal(camera.move(2,{x:900,y:100}),null);
});
test('keyboard full-speed and analog walking remain bounded together',()=>{
  assert.deepEqual(combineMovement({right:0,forward:0},{right:.25,forward:0}),{right:.25,forward:0});
  near(Math.hypot(...Object.values(combineMovement({right:1,forward:1},{right:0,forward:0}))),1);
  near(Math.hypot(...Object.values(combineMovement({right:1,forward:0},{right:1,forward:1}))),1);
  assert.deepEqual(combineMovement({right:-1,forward:0},{right:1,forward:0}),{right:0,forward:0});
});

test('action pointer fires independently while joystick/camera fingers are held; compatibility click is deduplicated',async()=>{
  const {ActionGesture}=await import('../src/palace/touchGestures');
  const action=new ActionGesture(),stick=new JoystickGesture(),camera=new CameraGesture();
  stick.begin(1,{x:100,y:500},50);stick.move(1,{x:100,y:450});camera.begin(2,{x:700,y:500});
  assert.equal(action.begin(3,1000),true);assert.equal(action.begin(4,1010),false);
  assert.equal(action.keyboardClick(0,1100),false);assert.equal(action.end(4),false);assert.equal(action.end(3),true);
  assert.equal(action.keyboardClick(1,1100),false);assert.equal(action.keyboardClick(0,1100),false);
  assert.equal(action.keyboardClick(0,1700),true);assert.equal(stick.pointerId,1);assert.deepEqual(camera.pointerIds,[2]);
  assert.equal(action.begin(4,1200),true);assert.equal(action.end(4),true);
});
test('interrupted action capture clears and does not block the next press',async()=>{
  const {ActionGesture}=await import('../src/palace/touchGestures');const action=new ActionGesture();
  assert.equal(action.begin(3,1000),true);action.reset();assert.equal(action.pointerId,null);
  assert.equal(action.begin(4,1100),true);assert.equal(action.end(3),false);assert.equal(action.end(4),true);
});
test('responsive harness frame suppression only applies to explicit isolated software touch QA',async()=>{
  const {isTouchViewportPlaytest}=await import('../src/persistence/playtestMode');
  assert.equal(isTouchViewportPlaytest('?playtest=intrigue&controls=touch&renderer=software&frame=touch-viewport'),true);
  for(const query of ['?frame=touch-viewport','?controls=touch&renderer=software&frame=touch-viewport','?playtest=1&controls=touch&renderer=software&frame=touch-viewport','?playtest=intrigue&controls=touch&frame=touch-viewport','?playtest=intrigue&controls=touch&renderer=software','?playtest=intrigue&controls=touch&renderer=software&frame=other']) assert.equal(isTouchViewportPlaytest(query),false);
});

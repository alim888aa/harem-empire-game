import test from 'node:test';
import assert from 'node:assert/strict';
import {PalaceRenderBudget} from '../src/palace/renderBudget';
const active = {hidden: false, paused: false, animated: false, view: 'roam'};

test('120 Hz devices do not render or update shadows/DOM at 120 Hz', () => {
  const budget = new PalaceRenderBudget(true);
  let renders = 0, overlays = 0, shadows = 0;
  for (let i = 0; i < 120; i++) {
    const frame = budget.frame(i * 1000 / 120, active);
    if (frame) {renders++; overlays += Number(frame.overlay); shadows += Number(frame.shadow);}
  }
  assert.equal(renders, 60);
  assert.equal(overlays, 20);
  assert.equal(shadows, 30);
});
test('settled menu backdrops render 10 Hz, but gifts and camera transitions remain smooth', () => {
  const budget = new PalaceRenderBudget(true);
  const paused = {...active, paused: true, view: 'Notifications'};
  let lateFrames = 0;
  for (let i = 0; i < 120; i++) {
    const frame = budget.frame(i * 1000 / 60, paused);
    if (i >= 60 && frame) lateFrames++;
  }
  assert.equal(lateFrames, 10);
  const gift = {...paused, animated: true};
  let giftFrames = 0;
  for (let i = 120; i < 180; i++) if (budget.frame(i * 1000 / 60, gift)) giftFrames++;
  assert.equal(giftFrames, 60);
  assert.ok(budget.frame(3100, {...paused, view: 'Maid Ling'}));
  assert.ok(budget.frame(3117, {...paused, view: 'Maid Ling'}));
});
test('hidden tabs do no scene work and resume without accumulated quality samples', () => {
  const budget = new PalaceRenderBudget(false);
  assert.equal(budget.frame(0, {...active, hidden: true}), null);
  assert.equal(budget.frame(60_000, {...active, hidden: true}), null);
  assert.ok(budget.frame(60_001, active));
  assert.equal(budget.pixelRatio(800, 600, 2), 1.5);
});
test('framebuffer respects touch and large viewport budgets without increasing low-DPI displays', () => {
  const touch = new PalaceRenderBudget(true), desktop = new PalaceRenderBudget(false);
  assert.equal(touch.pixelRatio(1024, 768, 2), 1);
  assert.equal(desktop.pixelRatio(1024, 768, 2), 1.5);
  assert.equal(desktop.pixelRatio(800, 600, 1), 1);
  const ratio = touch.pixelRatio(2732, 2048, 2);
  assert.ok(2732 * 2048 * ratio * ratio <= 1_600_001);
});
test('sustained slow frames reduce pixels with a bounded floor and recovery is gradual', () => {
  const budget = new PalaceRenderBudget(true);
  for (let i = 0; i < 250; i++) budget.frame(i * 50, active);
  assert.equal(budget.pixelRatio(800, 600, 2), .75);
  for (let i = 0; i < 500; i++) budget.frame(12_500 + i * 1000 / 60, active);
  const recovered = budget.pixelRatio(800, 600, 2);
  assert.ok(recovered > .75 && recovered < 1);
});
test('90 and 144 Hz screens retain a 60 Hz average rather than falling to half refresh', () => {
  for(const hz of [90, 144]) {
    const budget = new PalaceRenderBudget(false);
    let frames=0;
    for(let i=0;i<hz;i++)if(budget.frame(i*1000/hz,active))frames++;
    assert.equal(frames,60);
  }
});

test('4K viewports never exceed their framebuffer budget', () => {
  for(const touch of [true,false]) {
    const ratio=new PalaceRenderBudget(touch).pixelRatio(3840,2160,2);
    assert.ok(3840*2160*ratio*ratio <= (touch?1_600_001:3_000_001));
  }
});

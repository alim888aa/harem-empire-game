// Diagnostic experiment using only the live PalaceScene component and ordinary DOM input.
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import PalaceScene from '../../src/palace/PalaceScene';
import type { CourtPerson } from '../../src/palace/world';
import { createPalaceVisitState, type PalaceVisitState } from '../../src/palace/zones';
const people: CourtPerson[] = [
  {name:'Consort Hua', type:'side'}, {name:'Empress Dowager',type:'side'},
  {name:'Empress Consort',type:'side'}, {name:'Crown Prince',type:'side'},
];
async function withScene(run: (scene: Awaited<ReturnType<typeof sceneHarness>>) => Promise<void>) {
  const scene = await sceneHarness();
  try { await run(scene); } finally { await scene.close(); }
}

async function sceneHarness() {
  const dom = new JSDOM('<!doctype html><main></main>', {
    url: 'https://example.test/?playtest=1&renderer=software', pretendToBeVisual: true,
  });
  let now = 0;
  const clock = mock.method(performance, 'now', () => now);
  let nextFrame = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const globals = {
    window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id: number) => { frames.delete(id); },
    ResizeObserver: class { observe() {} disconnect() {} },
  };
  const previous = Object.keys(globals).map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  Object.entries(globals).forEach(([key, value]) => Object.defineProperty(globalThis, key, { configurable: true, value }));
  Object.defineProperties(dom.window.HTMLElement.prototype, {
    clientWidth: { configurable: true, get: () => 1180 }, clientHeight: { configurable: true, get: () => 680 },
  });
  dom.window.matchMedia = query => ({
    matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, dispatchEvent: () => true,
  });
  const host = dom.window.document.querySelector('main')!;
  const root = createRoot(host);
  let key = 0;
  return {
    readout: () => host.querySelector('[aria-label="Live palace telemetry"]')!.textContent!,
    hide(hidden: boolean) {
      Object.defineProperty(dom.window.document, 'hidden', { configurable: true, value: hidden });
      dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));
    },
    async help() {
      const show = host.querySelector<HTMLButtonElement>('[aria-label="Show controls"]')!;
      await act(async () => show.click());
      const dismiss = [...host.querySelectorAll('button')].find(button => button.textContent === 'Got it')!;
      await act(async () => dismiss.click());
    },
    async command() {
      await act(async () => host.querySelector('form')!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })));
      return host.querySelector('.palace-playtest [role="status"]')!.textContent!;
    },
    async mount(role: string, visits: PalaceVisitState, paused = false, progress = 0, remount = false) {
      await act(async () => root.render(createElement(PalaceScene, {
        key: remount ? ++key : key, seasonProgress: progress, people, playerType: role, rank: role === 'concubine' ? 'empress' : null,
        visitState: visits, paused, emperorEncounter: false,
        giftReaction: { name: '', sequence: 0 }, conversationName: null,
        onEmperorArrived() {}, onEmperorStatus() {}, onInteract() {}, onUnavailable() {},
        onAdvanceSeason() {}, onExpireSeason() {}, onRenderReady() {},
      })));
    },
    async step(ms: number) {
      now += ms;
      const callbacks = [...frames.values()]; frames.clear();
      assert.equal(callbacks.length, 1, 'exactly one live scene frame');
      await act(async () => callbacks.forEach(callback => callback(now)));
    },
    async key(type: 'keydown' | 'keyup', key: string) {
      const canvas = host.querySelector('[role="application"]')!;
      await act(async () => canvas.dispatchEvent(new dom.window.KeyboardEvent(type, { key, bubbles: true })));
    },
    async close() {
      await act(async () => root.unmount());
      Object.keys(globals).forEach((key, index) => {
        const descriptor = previous[index];
        if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
      });
      clock.mock.restore();
      dom.window.close();
    },
  };
}

test('trace repeated reconstruction, help, visibility, delayed frames and live control completion', async () => {
  await withScene(async scene => {
    const visits = createPalaceVisitState('concubine');
    await scene.mount('concubine', visits);
    await scene.step(300);
    const first = scene.readout();
    assert.match(first, /Consort Hua/);
    console.log('INITIAL', first);
    await scene.mount('concubine', visits, false, .3);
    assert.equal(scene.readout(), first, 'old readout remains until replacement scene publishes');
    await scene.step(90);
    assert.equal(scene.readout(), first, 'first sub-threshold replacement frame retains old readout');
    await scene.step(90);
    assert.doesNotMatch(scene.readout(), /Consort Hua/);
    assert.notEqual(scene.readout(), first);
    console.log('RECONSTRUCTED', scene.readout());
    for (const progress of [.6, .9, 0, .3, .6]) {
      await scene.mount('concubine', visits, false, progress);
      await scene.step(300);
      const before = scene.readout();
      await scene.help();
      await scene.key('keydown', 'd');
      await scene.step(300);
      await scene.key('keyup', 'd');
      assert.notEqual(scene.readout(), before, 'help does not detach telemetry');
      await scene.mount('concubine', visits, true, progress);
      await scene.step(300);
      assert.match(scene.readout(), /paused true/);
      await scene.mount('concubine', visits, false, progress);
      scene.hide(true);
      const hidden = scene.readout();
      await scene.step(60_000);
      assert.equal(scene.readout(), hidden, 'hidden tab intentionally publishes nothing');
      scene.hide(false);
      await scene.step(300);
      assert.match(scene.readout(), /paused false/);
      const resumed = scene.readout();
      await scene.step(40_000);
      assert.notEqual(scene.readout(), resumed, 'a delayed callback still publishes a new frame');
      assert.match(await scene.command(), /normal collision checks/);
      await scene.step(300);
      await scene.step(300);
      const moving = scene.readout();
      await scene.step(3000);
      assert.notEqual(scene.readout(), moving, 'command expiration does not freeze telemetry');
      console.log('RECOVERED', progress, scene.readout());
    }
    // Interrupt a scene before it has published; only one RAF survives cleanup.
    await scene.mount('concubine', visits, false, .9);
    await scene.mount('concubine', visits, false, .3);
    await scene.step(300);
    assert.doesNotMatch(scene.readout(), /Consort Hua/);
    // Full mount/reload identity has its own initial Waiting state and frame counter.
    await scene.mount('concubine', structuredClone(visits), false, 0, true);
    assert.equal(scene.readout(), 'Waiting for renderer');
    await scene.step(300);
    assert.match(scene.readout(), /Frame 0 /);
    assert.match(scene.readout(), /Consort Hua/);
    console.log('REMOUNT', scene.readout());
  });
});

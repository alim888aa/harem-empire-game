// Exercises live movement, campaign bytes and scene restoration through their public interfaces.
import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { createActor } from 'xstate';
import PalaceScene from '../../src/palace/PalaceScene';
import { createPalaceWorld, type CourtPerson } from '../../src/palace/world';
import { playerMovementSpeeds } from '../../src/palace/characterModels';
import { createPalaceVisitState, type PalaceVisitState, type PlayerVisitPose } from '../../src/palace/zones';
import { gameMachine } from '../../src/state-machines/game-machine';
import {
  captureCampaign, parseCampaignSave, createCampaignPresentation, campaignActorOptions, CampaignSaveStore, attachCampaignAutosave,
} from '../../src/persistence/campaignSave';

const people: CourtPerson[] = [
  { name: 'Minister Chen', type: 'side' }, { name: 'Scholar Jia', type: 'minor' },
];
const pose: PlayerVisitPose = { x: -6.88, z: 9.3, yaw: 0, pitch: .22, distance: 5.7 };

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
    async mount(role: string, visits: PalaceVisitState, paused = false) {
      await act(async () => root.render(createElement(PalaceScene, {
        key: ++key, people, playerType: role, rank: role === 'concubine' ? 'empress' : null,
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

for (const role of ['prince', 'minister', 'concubine'] as const) {
  test(`${role}: a legally walked Library shelf-end pose survives campaign bytes and scene reconstruction`, async t => {
    t.mock.method(console, 'log', () => {});
    await withScene(async scene => {
      const visits = createPalaceVisitState(role); visits.zone = 'library';
      visits.playerByZone.library = { ...pose };
      await scene.mount(role, visits);
      await scene.key('keydown', 'w');
      await scene.step(90);
      await scene.key('keyup', 'w');
      await scene.step(250);
      const walked = { ...visits.playerByZone.library! };
      assert.equal(walked.x, pose.x);
      assert.ok(Math.abs(walked.z - 9.1785) < 1e-10, `actual legal near-end pose: ${walked.z}`);
      assert.equal(walked.airborne, false);
      const world = createPalaceWorld(people, role, false, 'library', visits.npcByName);
      t.after(() => world.dispose());
      const radius = playerMovementSpeeds(role).radius;
      assert.ok(world.colliders.every(c =>
        Math.abs(walked.x - c.x) >= c.w / 2 + radius || Math.abs(walked.z - c.z) >= c.d / 2 + radius));
      const actor = createActor(gameMachine).start(); t.after(() => actor.stop());
      actor.send({ type: 'CHOOSE_CHARACTER', payload: { type: role } }); actor.send({ type: 'INITIALIZE_GAME' });
      let campaign = actor;
      if (role === 'concubine') {
        const fixture = captureCampaign(actor, createCampaignPresentation(role)); assert.ok(fixture);
        assert.ok('context' in fixture.snapshot && typeof fixture.snapshot.context === 'object' && fixture.snapshot.context);
        Object.assign(fixture.snapshot.context, { rank: 'empress', rivalInfluenceHighWater: actor.getSnapshot().context.playerPersonality.influence });
        campaign = createActor(gameMachine, campaignActorOptions(parseCampaignSave(JSON.stringify(fixture)).save)).start();
        t.after(() => campaign.stop());
      }
      const presentation = createCampaignPresentation(role); presentation.visits = visits;
      for (let second = 0; second < 75; second++) campaign.send({ type: 'FIRST_EMPEROR_VISIT_TICK', seconds: 1 });
      assert.ok(campaign.getSnapshot().matches({ playing: 'emperor_intro' }));
      const data = new Map<string, string>();
      const storage = {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => { data.set(key, value); },
        removeItem: (key: string) => { data.delete(key); },
      };
      const store = new CampaignSaveStore(storage); store.load();
      const autosave = attachCampaignAutosave(campaign, store, () => presentation); t.after(() => autosave.stop());
      autosave.flush();
      const saved = new CampaignSaveStore(storage).load().save; assert.ok(saved);
      assert.deepEqual(saved.presentation.visits.playerByZone.library, walked, 'serialization retains the exact live pose');
      const restoredActor = createActor(gameMachine, campaignActorOptions(saved)).start(); t.after(() => restoredActor.stop());
      assert.deepEqual(JSON.parse(JSON.stringify(restoredActor.getPersistedSnapshot())),
        JSON.parse(JSON.stringify(campaign.getPersistedSnapshot())), 'campaign rules are unchanged');
      await scene.mount(role, saved.presentation.visits, true);
      await scene.step(300);
      assert.deepEqual(saved.presentation.visits.playerByZone.library, walked, 'scene must retain the legal saved pose');
      for (const exact of [{ ...walked, z: 9.18 }, { ...walked, x: -6.08, z: 14 }]) {
        const exactVisits = { ...saved.presentation.visits,
          playerByZone: { ...saved.presentation.visits.playerByZone, library: exact } };
        await scene.mount(role, exactVisits, true);
        await scene.step(300);
        assert.deepEqual(exactVisits.playerByZone.library, exact, 'exact shelf-end/side pose stays legal');
      }
    });
  });
}


test('scene restoration preserves camera and jump state, but rejects body, wall and NPC overlaps', async () => {
  await withScene(async scene => {
    const world = createPalaceWorld(people, 'prince', false, 'library');
    const npc = world.npcs[0];
    const savedNpcs = Object.fromEntries(world.npcs.map(n =>
      [n.name, { zone: 'library' as const, x: n.x, z: n.z, rotationY: n.group.rotation.y }]));
    const cases = [
      { x: 6, z: 19.51, valid: true },
      { x: npc.x + .78, z: npc.z, valid: true },
      { x: -6.09, z: 14, valid: true },
      { x: -6.10, z: 14, valid: false },
      { x: -6.88, z: 9.15, valid: false },
      { x: -7, z: 7, valid: false },
      { x: 100, z: 100, valid: false },
      { x: npc.x + .75, z: npc.z, valid: false },
    ];
    world.dispose();
    for (const candidate of cases) {
      const visits = createPalaceVisitState('prince'); visits.npcByName = savedNpcs;
      const stored = { ...pose, x: candidate.x, z: candidate.z, yaw: .6, pitch: .4, distance: 6.8,
        y: .5, velocity: 1.2, airborne: true };
      visits.playerByZone.library = { ...stored };
      await scene.mount('prince', visits, true);
      await scene.step(300);
      const expected = candidate.valid ? stored : { ...stored, x: 0, z: 15, y: 0, velocity: 0, airborne: false };
      assert.deepEqual(visits.playerByZone.library, expected, JSON.stringify(candidate));
    }
  });
});


test('ordinary movement beside a real Library courtier retains its legal standing pose on reconstruction', async () => {
  await withScene(async scene => {
    const world = createPalaceWorld(people, 'prince', false, 'library');
    const npc = world.npcs[0];
    const visits = createPalaceVisitState('prince');
    visits.npcByName = Object.fromEntries(world.npcs.map(n =>
      [n.name, { zone: 'library' as const, x: n.x, z: n.z, rotationY: n.group.rotation.y }]));
    visits.playerByZone.library = { ...pose, x: npc.x + .9, z: npc.z };
    world.dispose();
    await scene.mount('prince', visits);
    await scene.key('keydown', 'a');
    await scene.step(90);
    await scene.key('keyup', 'a');
    await scene.step(250);
    const walked = { ...visits.playerByZone.library! };
    assert.ok(Math.abs(walked.x - npc.x - .7785) < 1e-10, 'normal walking accepts .76–.8m standing clearance');
    await scene.key('keydown', 'a');
    await scene.step(90);
    await scene.key('keyup', 'a');
    await scene.step(250);
    assert.deepEqual(visits.playerByZone.library, walked, 'walking cannot enter the .76m body clearance');
    const restored = structuredClone(visits);
    await scene.mount('prince', restored, true);
    await scene.step(300);
    assert.deepEqual(restored.playerByZone.library, walked, 'the same legal courtier clearance applies on restoration');
  });
});

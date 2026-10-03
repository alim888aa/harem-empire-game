import {tributeCost} from '../src/lib/campaignBalance';
// Copy into the game's tests/ directory after integrating the first-visit feature.
// Run: node --import tsx --test tests/emperor-intro-regressions.test.ts
// Contract: ticks represent verified active free-roam time supplied by GameLayout.
// Browser checks must separately prove that menus/loading/hidden tabs do not emit ticks.
import test, { beforeEach, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createActor } from 'xstate';
import { gameMachine } from '../src/state-machines/game-machine';
import { CAMPAIGN_BALANCE as B, seasonalGiftGrant } from '../src/lib/campaignBalance';
import {
  captureCampaign, parseCampaignSave, createCampaignPresentation, campaignActorOptions,
  type CampaignActor, type CampaignSave,
} from '../src/persistence/campaignSave';

const noRandomTribute = gameMachine.provide({ guards: { emperor_encountered: () => false } });
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const intro = (game: CampaignActor) => game.getSnapshot().matches({ playing: 'emperor_intro' } as any);
const context = (game: CampaignActor): any => game.getSnapshot().context;
const persisted = (game: CampaignActor): any => clone(game.getPersistedSnapshot());

beforeEach(t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'warn', () => {});
  t.mock.method(Math, 'random', () => .424242);
  Object.defineProperty(globalThis, 'alert', { configurable: true, value: () => {} });
  t.mock.method(globalThis, 'fetch', async () => { throw Error('Intro regressions must not call external services'); });
});

function register(t: TestContext, game: CampaignActor) {
  const errors: unknown[] = [];
  game.subscribe({ error: error => errors.push(error) });
  t.after(() => { game.stop(); assert.deepEqual(errors, [], 'actor errors'); });
  game.start();
  return game;
}
function start(t: TestContext, machine = noRandomTribute) {
  const game = register(t, createActor(machine));
  game.send({ type: 'CHOOSE_CHARACTER', payload: { type: 'prince' } });
  game.send({ type: 'INITIALIZE_GAME' });
  assert.ok(game.getSnapshot().matches({ playing: 'in_season' }));
  return game;
}
function saved(game: CampaignActor): CampaignSave {
  const save = captureCampaign(game, createCampaignPresentation(context(game).characterType));
  assert.ok(save, 'intro progress and an active intro must be valid save checkpoints');
  return save;
}
function restore(t: TestContext, save: CampaignSave, machine = noRandomTribute) {
  // Exercise the real parser and actor-construction route rather than hand-patching context.
  const parsed = parseCampaignSave(JSON.stringify(save)).save;
  return register(t, createActor(machine, campaignActorOptions(parsed)));
}
function tick(game: CampaignActor, seconds: unknown) {
  game.send({ type: 'FIRST_EMPEROR_VISIT_TICK', seconds } as any);
}
function activeSeconds(game: CampaignActor, seconds: number) {
  // Match the proposed small-delta UI contract; do not bypass safety by sending 75 at once.
  while (seconds > 0) { const step = Math.min(seconds, 1); tick(game, step); seconds -= step; }
}
function finish(game: CampaignActor) {
  game.send({ type: 'EMPEROR_INTRO_FINISHED' } as any);
}
function mechanics(game: CampaignActor) {
  const snapshot = persisted(game);
  delete snapshot.value;
  delete snapshot.context.firstEmperorVisitElapsed;
  delete snapshot.context.firstEmperorVisitDone;
  // Includes RNG, gifts, season settlement, plots, factions, relationships,
  // reputation, allowances, receipts and every persisted child actor.
  return snapshot;
}

test('fresh campaign introduces the Emperor once at exactly 75 accumulated active seconds, with no mechanical side effects', t => {
  const game = start(t), before = mechanics(game);
  assert.equal(context(game).firstEmperorVisitElapsed, 0);
  assert.equal(context(game).firstEmperorVisitDone, false);
  activeSeconds(game, 74.5);
  assert.equal(context(game).firstEmperorVisitElapsed, 74.5);
  assert.equal(context(game).firstEmperorVisitDone, false);
  assert.equal(intro(game), false);
  tick(game, .5);
  assert.ok(intro(game));
  assert.equal(context(game).firstEmperorVisitElapsed, 75);
  assert.equal(context(game).firstEmperorVisitDone, true);
  assert.deepEqual(mechanics(game), before, 'the introduction must not consume RNG or alter campaign mechanics');
  finish(game);
  assert.ok(game.getSnapshot().matches({ playing: 'in_season' }));
  assert.deepEqual(mechanics(game), before);
  activeSeconds(game, 150);
  assert.equal(intro(game), false, 'a completed intro never triggers twice');
  assert.deepEqual(mechanics(game), before);
});

test('intro progress survives save and reload without counting time while the app was absent', t => {
  const game = start(t);
  activeSeconds(game, 28.25);
  const save = saved(game), restored = restore(t, save);
  assert.equal(context(restored).firstEmperorVisitElapsed, 28.25);
  assert.equal(context(restored).firstEmperorVisitDone, false);
  assert.deepEqual(persisted(restored), persisted(game));
  activeSeconds(restored, 46.5);
  assert.equal(context(restored).firstEmperorVisitElapsed, 74.75);
  assert.equal(intro(restored), false);
  tick(restored, .25);
  assert.ok(intro(restored));
  assert.equal(context(restored).season, 1);
});

test('seen state survives reload and cannot replay the introductory visit', t => {
  const game = start(t);
  activeSeconds(game, 75); finish(game);
  const restored = restore(t, saved(game)), before = mechanics(restored);
  assert.equal(context(restored).firstEmperorVisitDone, true);
  activeSeconds(restored, 150); finish(restored); finish(restored);
  assert.ok(restored.getSnapshot().matches({ playing: 'in_season' }));
  assert.equal(intro(restored), false);
  assert.deepEqual(mechanics(restored), before);
});

test('reload during the intro restores a finishable non-transactional checkpoint and persists done=true', t => {
  const game = start(t), before = mechanics(game);
  activeSeconds(game, 75);
  assert.ok(intro(game));
  const save = saved(game), original = JSON.stringify(save);
  assert.equal((save.snapshot.context as any).firstEmperorVisitDone, true);
  const restored = restore(t, save);
  assert.equal(JSON.stringify(save), original, 'revival must not mutate the reusable save');
  assert.ok(intro(restored), 'resume the saved introductory scene rather than entering tribute');
  assert.equal(context(restored).firstEmperorVisitDone, true);
  assert.deepEqual(mechanics(restored), before);
  finish(restored);
  assert.ok(restored.getSnapshot().matches({ playing: 'in_season' }));
  const again = restore(t, saved(restored));
  activeSeconds(again, 100);
  assert.equal(intro(again), false);
  assert.deepEqual(mechanics(again), before);
});

test('legacy saves without introductory fields are already introduced, preserving their existing campaign', t => {
  const game = start(t), legacy = clone(saved(game));
  delete (legacy.snapshot.context as any).firstEmperorVisitElapsed;
  delete (legacy.snapshot.context as any).firstEmperorVisitDone;
  const parsed = parseCampaignSave(JSON.stringify(legacy)).save;
  // Either explicit true or the untouched legacy undefined marker is valid.
  // Only explicit false may opt a campaign into the new introductory clock.
  assert.notEqual((parsed.snapshot.context as any).firstEmperorVisitDone, false);
  const restored = restore(t, parsed), before = mechanics(restored);
  activeSeconds(restored, 150);
  assert.equal(intro(restored), false);
  assert.ok(restored.getSnapshot().matches({ playing: 'in_season' }));
  assert.deepEqual(mechanics(restored), before);
  assert.deepEqual(mechanics(restored), mechanics(game));
});

test('tick and finish events are state-scoped; the intro rejects tribute/refusal and season advancement', t => {
  const game = start(t);
  activeSeconds(game, 20);
  const early = persisted(game);
  finish(game);
  assert.deepEqual(persisted(game), early, 'a stale finish cannot skip the waiting interval');
  activeSeconds(game, 55);
  const during = persisted(game);
  for (const event of [
    { type: 'FIRST_EMPEROR_VISIT_TICK', seconds: 1 },
    { type: 'NEXT_SEASON' }, { type: 'SEASON_EXPIRED' },
    { type: 'GIVE_EMPEROR_GIFT', giftsRemaining: 999 }, { type: 'REFUSE' },
  ]) {
    game.send(event as any);
    assert.deepEqual(persisted(game), during, `${event.type} must not mutate or leave a non-transactional intro`);
  }
  finish(game);
  const after = persisted(game);
  finish(game); finish(game); activeSeconds(game, 20);
  assert.deepEqual(persisted(game), after, 'duplicate completion and later ticks are idempotent');
});

for (const event of ['NEXT_SEASON', 'SEASON_EXPIRED'] as const) {
  test(`a real tribute encounter before the intro suppresses it; ${event} keeps its existing tribute/advance contract`, t => {
    const forceTribute = gameMachine.provide({ guards: { emperor_encountered: ({ context }) => context.season >= 2 } });
    const game = start(t, forceTribute);
    activeSeconds(game, 12);
    game.send({ type: event });
    assert.equal(context(game).season, 2);
    assert.equal(context(game).firstEmperorVisitDone, false);
    game.send({ type: event });
    assert.ok(game.getSnapshot().matches({ playing: 'emperor_encounter' }));
    assert.equal(context(game).firstEmperorVisitDone, true);
    const during = persisted(game);
    finish(game); activeSeconds(game, 100);
    assert.deepEqual(persisted(game), during, 'intro messages must not finish real tribute');
    const pendingSave = saved(game), resumed = restore(t, pendingSave, forceTribute);
    assert.equal(context(resumed).firstEmperorVisitDone, true);
    assert.ok(resumed.getSnapshot().matches({ playing: 'emperor_encounter' }));
    const gifts = context(resumed).giftsRemaining;
    resumed.send({ type: 'GIVE_EMPEROR_GIFT', giftsRemaining: 999 });
    assert.equal(context(resumed).season, 3);
    assert.equal(context(resumed).giftsRemaining, gifts - tributeCost('prince',null) + seasonalGiftGrant('prince', null));
    const paid = persisted(resumed);
    resumed.send({ type: 'GIVE_EMPEROR_GIFT', giftsRemaining: 999 });
    finish(resumed); activeSeconds(resumed, 100);
    assert.deepEqual(persisted(resumed), paid, 'the paid tribute and once-only intro cannot settle twice');
  });
}

test('invalid tick deltas cannot poison progress, trigger the scene or consume campaign RNG', t => {
  const game = start(t); activeSeconds(game, 9);
  const before = persisted(game);
  for (const seconds of [0, -1, 2.01, 3, 75, NaN, Infinity, -Infinity, null, undefined, '1']) {
    tick(game, seconds);
    assert.deepEqual(persisted(game), before, `invalid elapsed delta ${String(seconds)}`);
  }
});

test('crossing the threshold clamps elapsed to 75 and malformed introductory snapshots cannot replay entry side effects', t => {
  const game = start(t); activeSeconds(game, 74.5); tick(game, 1);
  assert.ok(intro(game));
  assert.equal(context(game).firstEmperorVisitElapsed, 75);
  const save = saved(game);
  for (const updates of [
    { firstEmperorVisitDone: false },
    { firstEmperorVisitDone: undefined },
    { firstEmperorVisitElapsed: 74.5 },
    { firstEmperorVisitElapsed: undefined },
    { seasonAdvancePending: true },
  ]) {
    const malformed = clone(save);
    Object.assign(malformed.snapshot.context, updates);
    assert.throws(() => parseCampaignSave(JSON.stringify(malformed)), `invalid intro state ${JSON.stringify(updates)}`);
  }
});

test('save validation rejects malformed introductory counters while permitting fractional elapsed seconds', t => {
  const game = start(t); activeSeconds(game, 3.5);
  const save = saved(game);
  assert.equal((parseCampaignSave(JSON.stringify(save)).save.snapshot.context as any).firstEmperorVisitElapsed, 3.5);
  for (const elapsed of [-.01, 75.01, null, '3.5']) {
    const malformed = clone(save);
    (malformed.snapshot.context as any).firstEmperorVisitElapsed = elapsed;
    assert.throws(() => parseCampaignSave(JSON.stringify(malformed)), `invalid saved elapsed ${String(elapsed)}`);
  }
  for (const done of [null, 0, 1, 'false']) {
    const malformed = clone(save);
    (malformed.snapshot.context as any).firstEmperorVisitDone = done;
    assert.throws(() => parseCampaignSave(JSON.stringify(malformed)), `invalid saved seen flag ${String(done)}`);
  }
});

test('New Game resets a previously completed introductory visit without inheriting the previous campaign timer', t => {
  const game = start(t); activeSeconds(game, 75); finish(game);
  const ended = clone(saved(game));
  ended.snapshot.value = 'game_over';
  ended.snapshot.context.gameEndReason = 'defeat';
  const restarted = restore(t, ended);
  restarted.send({ type: 'RESTART_GAME' });
  restarted.send({ type: 'CHOOSE_CHARACTER', payload: { type: 'prince' } });
  restarted.send({ type: 'INITIALIZE_GAME' });
  assert.equal(context(restarted).firstEmperorVisitElapsed, 0);
  assert.equal(context(restarted).firstEmperorVisitDone, false);
  activeSeconds(restarted, 75);
  assert.ok(intro(restarted));
});

test('an existing parent promotion transition may interrupt the intro without replaying it or making a stale finish consequential', t => {
  const game = start(t); activeSeconds(game, 75);
  assert.ok(intro(game));
  // Exercise a real child-to-parent backing/allegiance report, not a fabricated
  // promotion event or mutated context. Parent priority behavior stays unchanged.
  const courtier = context(game).characters['Crown Prince'];
  courtier.send({ type: 'ACTIVATE' });
  courtier.send({ type: 'APPLY_FACTION_BONUS', supportBonus: 100, trustBonus: 0 });
  assert.equal(context(game).rank, 'grand_prince');
  assert.equal(context(game).firstEmperorVisitDone, true);
  assert.equal(intro(game), false);
  const afterPromotion = persisted(game);
  finish(game); activeSeconds(game, 100);
  assert.deepEqual(persisted(game), afterPromotion);
  const restored = restore(t, saved(game));
  activeSeconds(restored, 100);
  assert.equal(intro(restored), false);
  assert.equal(context(restored).firstEmperorVisitDone, true);
});

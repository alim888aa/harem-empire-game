import test, { beforeEach, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createActor, fromPromise } from 'xstate';
import { gameMachine } from '../src/state-machines/game-machine';
import { emperorAudienceMachine } from '../src/state-machines/emperor-audience-machine';
import { FALLBACK_QUESTIONS } from '../src/data/fallbackQuestions';
import { CAMPAIGN_BALANCE as B, tributeCost } from '../src/lib/campaignBalance';
import { getInfluenceGating } from '../src/lib/influenceGating';
import { processGiftWithMessage } from '../src/lib/checkMessage';
import {
  SAVE_VERSION, SAVE_KEY, PREVIOUS_SAVE_KEY, RECOVERY_SAVE_KEY, CampaignSaveStore, captureCampaign, parseCampaignSave,
  createCampaignPresentation, campaignActorOptions, attachCampaignAutosave, presentationForSeason,
  type CampaignSave, type SaveStorage,
} from '../src/persistence/campaignSave';

class MemoryStorage implements SaveStorage {
  data = new Map<string, string>();
  failRead = false; failWrite = false; failRemove = false;
  getItem(key: string) { if (this.failRead) throw Error('Blocked'); return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.failWrite) throw Error('Quota exceeded'); this.data.set(key, value); }
  removeItem(key: string) { if (this.failRemove) throw Error('Blocked'); this.data.delete(key); }
}
const drain = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
beforeEach(t => {
  t.mock.method(console, 'log', () => {}); t.mock.method(console, 'warn', () => {}); t.mock.method(console, 'error', () => {});
  t.mock.method(Math, 'random', () => .424242);
  Object.defineProperty(globalThis, 'alert', { configurable: true, value: () => {} });
  t.mock.method(globalThis, 'fetch', async () => { throw Error('No external calls during save tests'); });
});
function start(t: TestContext, role: 'prince' | 'minister' | 'concubine' = 'prince', machine = gameMachine) {
  const game = createActor(machine); const errors: unknown[] = [];
  game.subscribe({ error: error => errors.push(error) }); game.start();
  game.send({ type: 'CHOOSE_CHARACTER', payload: { type: role } }); game.send({ type: 'INITIALIZE_GAME' });
  t.after(() => { game.stop(); assert.deepEqual(errors, []); }); return game;
}
function restore(t: TestContext, save: CampaignSave, machine = gameMachine) {
  const game = createActor(machine, campaignActorOptions(save)); const errors: unknown[] = [];
  game.subscribe({ error: error => errors.push(error) }); game.start();
  t.after(() => { game.stop(); assert.deepEqual(errors, []); }); return game;
}
function saved(game: ReturnType<typeof start>, presentation = createCampaignPresentation(game.getSnapshot().context.characterType)) {
  const save = captureCampaign(game, presentation); assert.ok(save); return save;
}
function award(game: ReturnType<typeof start>, name: string) {
  const actor = game.getSnapshot().context.characters[name];
  actor.send({ type: 'ACTIVATE' }); actor.send({ type: 'APPLY_FACTION_BONUS', supportBonus: 100, trustBonus: 0 }); return actor;
}
function lowCourtier(game: ReturnType<typeof start>) {
  const context = game.getSnapshot().context;
  return context.activeCharacterNames.find(name => {
    const person = context.characters[name].getSnapshot().context;
    return person.type === 'minor' && getInfluenceGating({ ...person, type: person.type }, context.playerPersonality, context.rank).canUseNeutralMessage.allowed;
  })!;
}
const sendGift = (game: ReturnType<typeof start>, name: string, id: string) => game.send({ type: 'GIVE_GIFT_WITH_MESSAGE', characterId: name, messageType: 'neutral', requestId: id });
const snapshotJSON = (game: ReturnType<typeof start>) => JSON.parse(JSON.stringify(game.getPersistedSnapshot()));

test('all 48 registered actors, seeded personalities, season clock, 2D mode and per-zone poses survive fresh actor construction', t => {
  const game = start(t), presentation = createCampaignPresentation('prince');
  presentation.exploring = false; presentation.clock.remainingSeconds = 217.35;
  presentation.visits.zone = 'dowager';
  presentation.visits.playerByZone = { library: { x: 2, z: 3, yaw: 1, pitch: .22, distance: 5.7 }, dowager: { x: 3, z: 4, yaw: 2, pitch: .4, distance: 6, y: .3, velocity: -1, airborne: true } };
  presentation.visits.npcByName['Empress Dowager'] = { zone: 'dowager', x: 4, z: -6, rotationY: 1.2 };
  const save = saved(game, presentation), before = JSON.stringify(save);
  const restored = restore(t, save);
  assert.deepEqual(snapshotJSON(restored), snapshotJSON(game));
  assert.deepEqual(save.presentation, presentation);
  assert.equal(Object.keys(restored.getSnapshot().context.characters).length, 48);
  assert.equal(JSON.stringify(save), before, 'XState revival must not mutate the reusable save');
  const again = restore(t, save);
  assert.notEqual(again.getSnapshot().context.characters['Crown Prince'], restored.getSnapshot().context.characters['Crown Prince']);
  assert.deepEqual(snapshotJSON(again), snapshotJSON(restored));
});

test('completed message-gift restores cost, relationships, receipt and deduplication without paying or applying again', async t => {
  const game = start(t), name = lowCourtier(game); assert.ok(name);
  sendGift(game, name, 'restore-gift'); await drain();
  const save = saved(game), restored = restore(t, save), before = snapshotJSON(restored);
  assert.equal(restored.getSnapshot().context.lastGiftReceipt?.requestId, 'restore-gift');
  assert.deepEqual(before, snapshotJSON(game));
  sendGift(restored, name, 'restore-gift'); await drain();
  assert.deepEqual(snapshotJSON(restored), before, 'replayed request ID has no effects after reload');
  const receipt = restored.getSnapshot().context.lastGiftReceipt!;
  restored.getSnapshot().context.characters[name].send({type:'APPLY_EVALUATED_GIFT',requestId:'restore-gift',sessionId:receipt.sessionId,messageType:'neutral',result:processGiftWithMessage('neutral', restored.getSnapshot().context.characters[name].getSnapshot().context.personalityVectors, restored.getSnapshot().context.characters[name].getSnapshot().context.relationshipVectors, 'prince', restored.getSnapshot().context.playerPersonality, 0)});
  assert.deepEqual(snapshotJSON(restored), before, 'child also deduplicates the already committed gift');
});

test('reload during an uncommitted gift uses the previous complete save with no reserved charge', async t => {
  let release!: () => void;
  const machine = gameMachine.provide({ actors: { evaluateGift: fromPromise(async ({ input }: any) => {
    await new Promise<void>(resolve => { release = resolve; });
    return processGiftWithMessage(input.messageType, input.character.personalityVectors, input.character.relationshipVectors, input.playerType, input.playerStats, input.character.supportLevel);
  }) } });
  const game = start(t, 'prince', machine), storage = new MemoryStorage(), store = new CampaignSaveStore(storage), presentation = createCampaignPresentation('prince');
  store.load(); const autosave = attachCampaignAutosave(game, store, () => presentation); t.after(() => autosave.stop()); await drain();
  const before = storage.getItem(SAVE_KEY), name = lowCourtier(game), gifts = game.getSnapshot().context.giftsRemaining;
  sendGift(game, name, 'interrupted'); await drain();
  assert.ok(game.getSnapshot().context.pendingGift);
  autosave.flush(); assert.equal(storage.getItem(SAVE_KEY), before);
  const restored = restore(t, new CampaignSaveStore(storage).load().save!);
  assert.equal(restored.getSnapshot().context.giftsRemaining, gifts);
  assert.equal(restored.getSnapshot().context.pendingGift, null);
  assert.equal(restored.getSnapshot().context.lastGiftReceipt, null);
  release(); await drain();
  const committed = new CampaignSaveStore(storage).load().save!;
  assert.equal((committed.snapshot as any).context.lastGiftReceipt.requestId, 'interrupted');
  assert.equal((committed.snapshot as any).context.pendingGift, null);
  assert.equal(restore(t, committed).getSnapshot().context.giftsRemaining, game.getSnapshot().context.giftsRemaining);
});

test('failed gift evaluation refunds once and preserves request deduplication on restore', async t => {
  const machine = gameMachine.provide({actors:{evaluateGift:fromPromise(async () => { throw Error('Controlled evaluation failure'); })}});
  const game = start(t, 'prince', machine), name = lowCourtier(game);
  sendGift(game, name, 'failed'); await drain();
  const restored = restore(t, saved(game)); const before = snapshotJSON(restored);
  assert.equal(restored.getSnapshot().context.giftsRemaining, 25);
  assert.match(restored.getSnapshot().context.giftError, /returned/);
  sendGift(restored, name, 'failed'); await drain(); assert.deepEqual(snapshotJSON(restored), before);
});

test('pledges, faction membership, both promotion rewards and permanent expulsion remain committed after restore', t => {
  const game = start(t);
  for (const name of ['Maid Ling', 'Maid Su', 'Maid Bai']) award(game, name);
  game.send({ type: 'JOIN_FACTION', faction: 'Loyalist' });
  for (const name of ['Empress Dowager','Empress Consort','Crown Prince','Prime Minister']) if (game.getSnapshot().context.characters[name]) award(game, name);
  const before = saved(game), restored = restore(t, before), context = restored.getSnapshot().context;
  assert.equal(context.rank, 'crown_prince'); assert.equal(context.rewardedRanks.length, 2);
  assert.equal(context.factionSystem.playerFaction, 'Loyalist');
  assert.equal(context.characters['Crown Prince'], undefined); assert.ok(context.expelledCourtiers['Crown Prince']);
  assert.equal(context.characters['Maid Ling'].getSnapshot().context.hasGivenAllegiance, true);
  assert.equal(context.characters['Maid Ling'].getSnapshot().context.factionOverride, 'Loyalist');
  assert.deepEqual(snapshotJSON(restored), snapshotJSON(game));
  restored.send({ type: 'CHARACTER_GAVE_ALLEGIANCE', name: 'Maid Ling', characterType: 'minor' });
  assert.equal(restored.getSnapshot().context.supportPoints, context.supportPoints);
});

test('tribute checkpoint preserves the same next favor roll, one charge and exactly one season transition', t => {
  const game = start(t);
  let encounter = false;
  for (let i = 0; i < 12; i++) { game.send({ type: 'NEXT_SEASON' }); if (game.getSnapshot().matches({ playing: 'emperor_encounter' })) { encounter = true; break; } }
  assert.ok(encounter, 'fixed seed reaches a real Emperor encounter');
  const pending = saved(game), restored = restore(t, pending), before = game.getSnapshot().context;
  game.send({ type: 'GIVE_EMPEROR_GIFT', giftsRemaining: 999 }); restored.send({ type: 'GIVE_EMPEROR_GIFT', giftsRemaining: 999 });
  assert.deepEqual(snapshotJSON(restored), snapshotJSON(game));
  assert.equal(restored.getSnapshot().context.season, before.season + 1);
  assert.equal(restored.getSnapshot().context.giftsRemaining, before.giftsRemaining - tributeCost(before.characterType,before.rank) + 25);
  const afterTribute = restore(t, saved(restored)), after = snapshotJSON(afterTribute);
  afterTribute.send({ type: 'GIVE_EMPEROR_GIFT', giftsRemaining: 999 });
  assert.deepEqual(snapshotJSON(afterTribute), after);
});

test('zero timer and stale React presentation cannot advance the just-committed season again on refresh', t => {
  const game = start(t), presentation = createCampaignPresentation('prince');
  presentation.clock.remainingSeconds = 0; presentation.clock.expired = true;
  game.send({ type: 'SEASON_EXPIRED' }); assert.equal(game.getSnapshot().context.season, 2);
  const save = saved(game, presentation), restored = restore(t, save);
  assert.deepEqual(save.presentation.clock, { season: 2, seasonMinutes: 10, remainingSeconds: 600, expired: false });
  assert.equal(restored.getSnapshot().context.season, 2);
  assert.equal(restored.getSnapshot().context.giftsRemaining, 25 + 25);
  const sameSeason = presentationForSeason(save.presentation, 2);
  sameSeason.clock.remainingSeconds = 42;
  assert.equal(presentationForSeason(sameSeason, 2).clock.remainingSeconds, 42, 'same-season save does not refill the clock');
});

test('zero timer during an unresolved tribute retains the encounter until tribute resolves', t => {
  const game = start(t);
  for (let i = 0; i < 12 && !game.getSnapshot().matches({ playing: 'emperor_encounter' }); i++) game.send({ type: 'SEASON_EXPIRED' });
  assert.ok(game.getSnapshot().matches({ playing: 'emperor_encounter' }));
  const presentation = createCampaignPresentation('prince');
  presentation.clock = { season: game.getSnapshot().context.season, seasonMinutes: 5, remainingSeconds: 0, expired: true };
  const restored = restore(t, saved(game, presentation));
  assert.ok(restored.getSnapshot().matches({ playing: 'emperor_encounter' }));
  assert.equal(restored.getSnapshot().context.seasonAdvancePending, true);
  restored.send({ type: 'GIVE_EMPEROR_GIFT', giftsRemaining: 999 });
  const after = saved(restored, presentation);
  assert.equal(after.presentation.clock.remainingSeconds, 300); assert.equal(after.presentation.clock.expired, false);
});

test('rank deadline loss is restored as terminal without replaying seasonal allowance', t => {
  const machine = gameMachine.provide({ guards: { emperor_encountered: () => false } }), game = start(t, 'concubine', machine);
  for (let season = 0; season < 12; season++) game.send({ type: 'NEXT_SEASON' });
  assert.equal(game.getSnapshot().value, 'game_over');
  const restored = restore(t, saved(game));
  assert.equal(restored.getSnapshot().value, 'game_over');
  assert.deepEqual(snapshotJSON(restored), snapshotJSON(game));
  restored.send({ type: 'NEXT_SEASON' }); assert.equal(restored.getSnapshot().context.season, 13);
});

test('audience question and answered progress restore without invoking question generation again', async t => {
  let calls = 0;
  const audience = emperorAudienceMachine.provide({actors:{generateQuestionsActor:fromPromise(async({input}:any) => { calls++; return {questions:FALLBACK_QUESTIONS[input.path as keyof typeof FALLBACK_QUESTIONS]}; })}});
  const machine = gameMachine.provide({guards:{emperor_encountered:()=>false},actors:{emperorAudienceMachine:audience}}), game = start(t, 'prince', machine);
  for (const name of ['Maid Ling','Maid Su','Maid Bai']) award(game, name);
  game.send({type:'JOIN_FACTION',faction:'Loyalist'});
  for (const name of ['Empress Dowager','Empress Consort','Crown Prince','Prime Minister']) if (game.getSnapshot().context.characters[name]) award(game,name);
  for(let i=0;i<3;i++)game.send({type:'NEXT_SEASON'});game.send({type:'ENTER_AUDIENCE'}); await drain();
  const child = game.getSnapshot().children.emperorAudienceMachine as any;
  child.send({type:'ANSWER_QUESTION',answer:'a'});
  const save = saved(game), restored = restore(t, save, machine); await drain();
  assert.equal(calls, 1); assert.deepEqual(snapshotJSON(restored), snapshotJSON(game));
  assert.equal((restored.getSnapshot().children.emperorAudienceMachine as any).getSnapshot().context.currentQuestionIndex, 1);
});

test('documented version-one migration preserves progress/RNG and upgrades presentation and derived factions', t => {
  const original = saved(start(t)); const legacy: any = JSON.parse(JSON.stringify(original)); legacy.version = 1;
  delete legacy.presentation.exploring; delete legacy.presentation.clock.expired;
  const result = parseCampaignSave(JSON.stringify(legacy));
  assert.equal(result.migrated, true); assert.equal(result.save.version, SAVE_VERSION);
  const normalized = JSON.parse(JSON.stringify(result.save.snapshot)), expected = JSON.parse(JSON.stringify(original.snapshot));
  delete normalized.context.factionSystem; delete expected.context.factionSystem;
  assert.deepEqual(normalized, expected);
  assert.equal(result.save.presentation.exploring, true); assert.equal(result.save.presentation.clock.expired, false);
  const missingRng = JSON.parse(JSON.stringify(legacy)); delete missingRng.snapshot.context.rngState;
  assert.throws(() => parseCampaignSave(JSON.stringify(missingRng)), /counters/);
});

test('malformed, future, incomplete and dangling-actor saves are rejected before machine construction', t => {
  const original = saved(start(t));
  assert.throws(() => parseCampaignSave('{oops'));
  for (const corrupt of [
    (data: any) => { data.version = 99; },
    (data: any) => { data.snapshot.context.giftsRemaining = -1; },
    (data: any) => { data.snapshot.context.pendingGift = { phase:'evaluating' }; },
    (data: any) => { data.snapshot.context.rngState = 1.2; },
    (data: any) => { delete data.snapshot.children[Object.keys(data.snapshot.children)[0]]; },
    (data: any) => { data.snapshot.children[Object.keys(data.snapshot.children)[0]].src = { id:'inline' }; },
    (data: any) => { data.presentation.clock.season = 99; },
    (data: any) => { data.presentation.visits.playerByZone.library = {x:'bad'}; },
  ]) { const data = JSON.parse(JSON.stringify(original)); corrupt(data); assert.throws(() => parseCampaignSave(JSON.stringify(data))); }
  assert.throws(() => parseCampaignSave('{"__proto__":{},"format":"harem-empire"}'), /Unsafe/);
});

test('valid legacy zone without current career access relocates home and retains relationships and saved poses', t => {
  const original = saved(start(t, 'concubine')); original.presentation.visits.zone = 'emperor';
  original.presentation.visits.playerByZone.emperor = { x:1,z:2,yaw:0,pitch:.2,distance:6 };
  const loaded = parseCampaignSave(JSON.stringify(original)).save;
  assert.equal(loaded.presentation.visits.zone, 'ladies'); assert.deepEqual(loaded.snapshot, original.snapshot);
  assert.deepEqual(loaded.presentation.visits.playerByZone, original.presentation.visits.playerByZone);
});

test('invalid primary remains untouched until safely quarantined; valid previous campaign remains recoverable', t => {
  const game = start(t), storage = new MemoryStorage(), old = JSON.stringify(saved(game));
  storage.setItem(SAVE_KEY, '{broken'); storage.setItem(PREVIOUS_SAVE_KEY, old);
  const store = new CampaignSaveStore(storage), loaded = store.load();
  assert.equal(loaded.save, null); assert.equal(loaded.problem, true); assert.equal(store.getStatus().hasPrevious, true);
  assert.equal(storage.getItem(SAVE_KEY), '{broken');
  assert.ok(store.recoverPrevious());
  assert.equal(storage.getItem(RECOVERY_SAVE_KEY), '{broken');
  assert.equal(parseCampaignSave(storage.getItem(SAVE_KEY)!).save.version, SAVE_VERSION);
});

test('confirmed New Game archives the completed campaign; recovery swaps it with the new saved campaign', t => {
  const game = start(t), storage = new MemoryStorage(), store = new CampaignSaveStore(storage); store.load();
  store.save(game, createCampaignPresentation('prince')); const original = storage.getItem(SAVE_KEY);
  assert.equal(store.startNewCampaign(), true); assert.equal(storage.getItem(SAVE_KEY), null); assert.equal(storage.getItem(PREVIOUS_SAVE_KEY), original);
  const next = start(t, 'concubine'); store.save(next, createCampaignPresentation('concubine'));
  const restored = store.recoverPrevious()!;
  assert.equal((restored.snapshot as any).context.characterType, 'prince');
  assert.equal((parseCampaignSave(storage.getItem(PREVIOUS_SAVE_KEY)!).save.snapshot as any).context.characterType, 'concubine');
  assert.equal((new CampaignSaveStore(storage).load().save!.snapshot as any).context.characterType, 'prince');
});

test('backup failure aborts New Game without erasing the current saved campaign', t => {
  const game = start(t), storage = new MemoryStorage(), store = new CampaignSaveStore(storage); store.load(); store.save(game, createCampaignPresentation('prince'));
  const current = storage.getItem(SAVE_KEY); storage.failWrite = true;
  assert.equal(store.startNewCampaign(), false); assert.equal(storage.getItem(SAVE_KEY), current); assert.match(store.getStatus().message, /unchanged/);
});

test('blocked reads and quota failures explain session-only progress and keep the running actor usable', t => {
  const blocked = new MemoryStorage(); blocked.failRead = true;
  const blockedStore = new CampaignSaveStore(blocked); assert.equal(blockedStore.load().save, null); assert.equal(blockedStore.getStatus().available, false);
  const storage = new MemoryStorage(), store = new CampaignSaveStore(storage), game = start(t); store.load(); store.save(game, createCampaignPresentation('prince'));
  const old = storage.getItem(SAVE_KEY); storage.failWrite = true;
  game.send({type:'NEXT_SEASON'}); assert.equal(store.save(game, createCampaignPresentation('prince')), true);
  assert.equal(storage.getItem(SAVE_KEY), old); assert.equal(store.getStatus().available, false); assert.match(store.getStatus().message, /page closes/);
  assert.equal(store.startNewCampaign(), true, 'in-memory backup remains available when storage is unavailable');
  assert.equal((store.recoverPrevious()!.snapshot as any).context.season, 2);
});

test('recovery backup failure never replaces the primary save or the running campaign', t => {
  const storage = new MemoryStorage(), store = new CampaignSaveStore(storage), game = start(t); store.load();
  store.save(game, createCampaignPresentation('prince')); store.startNewCampaign();
  const currentGame = start(t, 'concubine'); store.save(currentGame, createCampaignPresentation('concubine'));
  const current = storage.getItem(SAVE_KEY), previous = storage.getItem(PREVIOUS_SAVE_KEY); storage.failWrite = true;
  assert.equal(store.recoverPrevious(), null); assert.equal(storage.getItem(SAVE_KEY), current); assert.equal(storage.getItem(PREVIOUS_SAVE_KEY), previous);
  assert.equal(currentGame.getSnapshot().context.characterType, 'concubine');
});

test('recovery primary failure rolls back its backup and preserves both saved campaigns', t => {
  const storage = new MemoryStorage(), store = new CampaignSaveStore(storage), game = start(t); store.load();
  store.save(game, createCampaignPresentation('prince')); store.startNewCampaign();
  store.save(start(t, 'concubine'), createCampaignPresentation('concubine'));
  const current = storage.getItem(SAVE_KEY), previous = storage.getItem(PREVIOUS_SAVE_KEY), write = storage.setItem.bind(storage);
  storage.setItem = (key, value) => { if (key === SAVE_KEY) throw Error('Controlled primary-write failure'); write(key, value); };
  assert.equal(store.recoverPrevious(), null); assert.equal(storage.getItem(SAVE_KEY), current); assert.equal(storage.getItem(PREVIOUS_SAVE_KEY), previous);
});

test('refusing tribute persists the resulting defeat even when its abandoned season flag remains set', t => {
  const game = start(t);
  for (let i = 0; i < 12 && !game.getSnapshot().matches({playing:'emperor_encounter'}); i++) game.send({type:'NEXT_SEASON'});
  assert.ok(game.getSnapshot().matches({playing:'emperor_encounter'}));
  game.send({type:'REFUSE'});
  assert.equal(game.getSnapshot().value, 'game_over');
  const restored = restore(t, saved(game));
  assert.equal(restored.getSnapshot().value, 'game_over');
  assert.deepEqual(snapshotJSON(restored), snapshotJSON(game));
});

test('one reusable restore options object remains safe across Strict Mode double construction', t => {
  const game = start(t), save = saved(game), options = campaignActorOptions(save);
  const one = createActor(gameMachine, options).start(), two = createActor(gameMachine, options).start();
  t.after(() => {one.stop(); two.stop();});
  assert.notEqual(one.getSnapshot().context.characters['Crown Prince'], two.getSnapshot().context.characters['Crown Prince']);
  assert.deepEqual(snapshotJSON(one), snapshotJSON(two));
  one.send({type:'NEXT_SEASON'}); assert.equal(two.getSnapshot().context.season, 1);
  assert.equal((save.snapshot as any).context.season, 1);
});

test('two open stores cannot silently overwrite a newer campaign; stale New Game and recovery are blocked', t => {
  const storage = new MemoryStorage(), first = new CampaignSaveStore(storage), game = start(t); first.load();
  first.save(game, createCampaignPresentation('prince')); first.startNewCampaign();
  const secondGame = start(t, 'concubine'); first.save(secondGame, createCampaignPresentation('concubine'));
  const otherTab = new CampaignSaveStore(storage), loaded = otherTab.load().save!, otherGame = restore(t, loaded);
  game.send({type:'NEXT_SEASON'}); first.save(game, createCampaignPresentation('prince'));
  const latest = storage.getItem(SAVE_KEY), backup = storage.getItem(PREVIOUS_SAVE_KEY);
  otherGame.send({type:'NEXT_SEASON'});
  assert.equal(otherTab.save(otherGame, loaded.presentation), false);
  assert.match(otherTab.getStatus().message, /Another tab changed/);
  assert.equal(otherTab.startNewCampaign(), false); assert.equal(otherTab.recoverPrevious(), null);
  assert.equal(storage.getItem(SAVE_KEY), latest); assert.equal(storage.getItem(PREVIOUS_SAVE_KEY), backup);
  const reloaded = new CampaignSaveStore(storage).load().save!;
  assert.equal((reloaded.snapshot as any).context.characterType, 'prince'); assert.equal((reloaded.snapshot as any).context.season, 2);
});

test('a second empty tab detects the first campaign save and keeps it intact', t => {
  const storage = new MemoryStorage(), first = new CampaignSaveStore(storage), second = new CampaignSaveStore(storage);
  first.load(); second.load(); const game = start(t);
  first.save(game, createCampaignPresentation('prince')); const latest = storage.getItem(SAVE_KEY);
  assert.equal(second.save(start(t, 'concubine'), createCampaignPresentation('concubine')), false);
  assert.equal(storage.getItem(SAVE_KEY), latest); assert.equal(second.getStatus().problem, true);
});

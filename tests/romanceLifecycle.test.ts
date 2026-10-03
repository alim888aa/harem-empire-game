import test, { beforeEach, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createActor, fromPromise } from 'xstate';
import { gameMachine } from '../src/state-machines/game-machine';
import { campaignActorOptions, captureCampaign, createCampaignPresentation, parseCampaignSave, SAVE_VERSION } from '../src/persistence/campaignSave';
import { courtRelation, graphLovers, PLAYER_NODE, type CourtGraph } from '../src/lib/courtGraph';
import { seasonalGiftGrant } from '../src/lib/campaignBalance';
import { assignCharacterFaction } from '../src/lib/factionSystem';
import { romanceWitnessRisk } from '../src/lib/courtRomance';
import type { PlayerType } from '../src/types/game';

const machine = gameMachine.provide({ guards: { emperor_encountered: () => false, shouldOfferEmperorAudience: () => false } });
beforeEach(t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(Math, 'random', () => .424242);
  Object.defineProperty(globalThis, 'alert', { configurable: true, value: () => {} });
  t.mock.method(globalThis, 'fetch', async () => { throw Error('No external calls in romance lifecycle tests'); });
});
function start(t: TestContext, role: PlayerType = 'prince', implementation = machine) {
  const errors: unknown[] = [], g = createActor(implementation);
  g.subscribe({ error: error => errors.push(error) }); g.start();
  g.send({ type: 'CHOOSE_CHARACTER', payload: { type: role } }); g.send({ type: 'INITIALIZE_GAME' });
  t.after(() => { g.stop(); assert.deepEqual(errors, []); });
  g.getSnapshot().context.giftsRemaining = 500;
  return g;
}
type Game = ReturnType<typeof start>;
function present(g: Game, names: string[], role: PlayerType = g.getSnapshot().context.characterType!) {
  const c = g.getSnapshot().context;
  c.activeCharacterNames = [...new Set([...c.activeCharacterNames, ...names])];
  for (const name of names) c.characters[name]?.send({ type: 'ACTIVATE' });
  g.send({ type: 'UPDATE_PALACE_PRESENCE', zone: role === 'concubine' ? 'ladies' : 'library', names });
}
function send(g: Game, name: string, action: 'gift' | 'propose' | 'end', requestId: string) {
  g.send({ type: 'ROMANCE_ACTION', characterId: name, action, requestId });
}
function giftTimes(g: Game, name: string, count: number, prefix = name) {
  for (let n = 1; n <= count; n++) send(g, name, 'gift', `${prefix}-gift-${n}`);
}
function capture(g: Game) {
  const saved = captureCampaign(g, createCampaignPresentation(g.getSnapshot().context.characterType));
  assert.ok(saved, 'romance action leaves a valid save checkpoint');
  return saved;
}
function restore(t: TestContext, save: any) {
  const parsed = parseCampaignSave(JSON.stringify(save)), g = createActor(machine, campaignActorOptions(parsed.save)).start();
  t.after(() => g.stop()); return g;
}
function child(save: any, name: string) { return save.snapshot.children[save.snapshot.context.characters[name].id].snapshot.context; }
function political(g: Game) {
  const c = g.getSnapshot().context;
  return structuredClone({
    supportPoints: c.supportPoints, rank: c.rank, playerPersonality: c.playerPersonality, playerReputation: c.playerReputation,
    standingAwards: c.standingAwards, allegianceAwards: c.allegianceAwards, standingRenewals: c.standingRenewals,
    successfulDiplomacy: c.successfulDiplomacyThisSeason, factionSystem: c.factionSystem,
    courtGiftSeasons: c.courtGiftSeasons, giftNotifications: c.giftNotifications, pendingCourtGifts: c.pendingCourtGifts,
    rngState: c.rngState, courtPlots: c.courtPlots,
    people: Object.fromEntries(Object.entries(c.characters).map(([name, a]) => {
      const p = a.getSnapshot().context;
      return [name, { support: p.supportLevel, hate: p.hate, pledge: p.hasGivenAllegiance, faction: p.factionOverride,
        influence: p.personalityVectors.influence, personality: p.personalityVectors, fear: p.relationshipVectors.fearOfPlayer,
        hasGivenSupport: p.hasGivenSupport, hasGivenGifts: p.hasGivenGifts, cooldown: p.giftCooldownUntil,
        politicalGiftRequests: p.processedGiftRequests }];
    })),
  });
}

for (const [name, cost] of [['Maid Ling', 1], ['Scholar Qin', 5], ['General Zhao', 10], ['Empress Consort', 20]] as const) {
  test(`romantic gift to ${name} costs existing tier${cost}, rejects unaffordable actions and never grants political rewards`, t => {
    const g = start(t); present(g, [name]); const before = political(g);
    g.getSnapshot().context.giftsRemaining = cost - 1;
    const graphBefore = structuredClone(g.getSnapshot().context.relationshipGraph);
    send(g, name, 'gift', 'unaffordable');
    assert.equal(g.getSnapshot().context.giftsRemaining, cost - 1);
    assert.deepEqual(g.getSnapshot().context.relationshipGraph, graphBefore);
    assert.deepEqual(g.getSnapshot().context.processedRomanceRequests, []);
    assert.equal(g.getSnapshot().context.lastRomanceReceipt, null);
    g.getSnapshot().context.giftsRemaining = cost;
    send(g, name, 'gift', 'exact-budget');
    const c = g.getSnapshot().context;
    assert.equal(c.giftsRemaining, 0);
    assert.equal(c.lastRomanceReceipt?.cost, cost);
    assert.equal(c.lastRomanceReceipt?.affectionDelta, 15);
    assert.equal(c.lastRomanceReceipt?.accepted, false);
    assert.equal(courtRelation(c.relationshipGraph!, name, PLAYER_NODE).affection, 15);
    assert.equal(c.characters[name].getSnapshot().context.relationshipVectors.loveForPlayer, .15);
    assert.equal(c.characters[name].getSnapshot().context.isLover, false);
    assert.deepEqual(political(g), before);
  });
}

for (const role of ['prince', 'minister'] as const) test(`${role}: four romantic gifts reach60 but acceptance still needs a separate free proposal; end preserves political state`, t => {
  const g = start(t, role), name = 'Maid Ling'; present(g, [name]); const before = political(g), gifts = g.getSnapshot().context.giftsRemaining;
  giftTimes(g, name, 4);
  assert.equal(courtRelation(g.getSnapshot().context.relationshipGraph!, name, PLAYER_NODE).affection, 60);
  assert.equal(g.getSnapshot().context.characters[name].getSnapshot().context.isLover, false);
  assert.deepEqual(graphLovers(g.getSnapshot().context.relationshipGraph!, PLAYER_NODE), []);
  send(g, name, 'propose', 'accept');
  let c = g.getSnapshot().context;
  assert.equal(c.lastRomanceReceipt?.cost, 0); assert.equal(c.lastRomanceReceipt?.accepted, true);
  assert.equal(c.giftsRemaining, gifts - 4); assert.equal(c.characters[name].getSnapshot().context.isLover, true);
  assert.deepEqual(graphLovers(c.relationshipGraph!, PLAYER_NODE), [name]);
  assert.deepEqual(political(g), before);
  send(g, name, 'end', 'breakup'); c = g.getSnapshot().context;
  assert.equal(c.lastRomanceReceipt?.cost, 0); assert.equal(c.giftsRemaining, gifts - 4);
  assert.equal(c.characters[name].getSnapshot().context.isLover, false);
  assert.equal(courtRelation(c.relationshipGraph!, name, PLAYER_NODE).affection, 60);
  assert.equal(courtRelation(c.relationshipGraph!, PLAYER_NODE, name).romance, null);
  assert.deepEqual(political(g), before);
});

test('repeated romantic gifts have no extra cooldown or max-affection income and requests are idempotent', t => {
  const g = start(t), name = 'Maid Ling'; present(g, [name]); const before = political(g);
  giftTimes(g, name, 8, 'repeat');
  const c = g.getSnapshot().context;
  assert.equal(c.giftsRemaining, 492); assert.equal(c.lastRomanceReceipt?.affectionDelta, 0);
  assert.equal(courtRelation(c.relationshipGraph!, name, PLAYER_NODE).affection, 100);
  assert.equal(c.characters[name].getSnapshot().context.hasGivenGifts, false);
  assert.equal(c.characters[name].getSnapshot().context.giftCooldownUntil, 0);
  assert.equal(c.characters[name].getSnapshot().context.legacyCourtshipGiftEligible, false);
  assert.equal(c.courtGiftSeasons?.[name], undefined);
  assert.deepEqual(political(g), before);
  const saved = JSON.stringify(g.getPersistedSnapshot());
  send(g, name, 'gift', 'repeat-gift-8'); send(g, name, 'propose', 'repeat-gift-8');
  assert.equal(JSON.stringify(g.getPersistedSnapshot()), saved, 'same request cannot pay twice or change its action');
});

test('explicit low-affection and high-hate refusals cost0, remain unaccepted and survive reload', t => {
  const g = start(t), name = 'Maid Ling'; present(g, [name]);
  send(g, name, 'propose', 'too-soon');
  assert.equal(g.getSnapshot().context.lastRomanceReceipt?.accepted, false);
  assert.match(g.getSnapshot().context.lastRomanceReceipt!.response, /60/);
  assert.equal(g.getSnapshot().context.giftsRemaining, 500);
  giftTimes(g, name, 4);
  g.getSnapshot().context.characters[name].send({ type: 'GAIN_HATE', amount: 60 });
  const before = political(g); send(g, name, 'propose', 'hostile-refusal');
  assert.equal(g.getSnapshot().context.lastRomanceReceipt?.accepted, false);
  assert.match(g.getSnapshot().context.lastRomanceReceipt!.response, /hostility/);
  assert.deepEqual(political(g), before);
  const r = restore(t, capture(g));
  assert.equal(r.getSnapshot().context.characters[name].getSnapshot().context.isLover, false);
  assert.equal(r.getSnapshot().context.lastRomanceReceipt?.requestId, 'hostile-refusal');
  const snapshot = JSON.stringify(r.getPersistedSnapshot());
  send(r, name, 'propose', 'hostile-refusal'); assert.equal(JSON.stringify(r.getPersistedSnapshot()), snapshot);
});

test('accepted romance creates no immunity against ordinary political hate or later hostility', t => {
  const g = start(t), name = 'Maid Ling'; present(g, [name]); giftTimes(g, name, 4); send(g, name, 'propose', 'accepted');
  const actor = g.getSnapshot().context.characters[name]; actor.send({ type: 'GAIN_HATE', amount: 25 });
  assert.equal(actor.getSnapshot().context.hate, 25);
  assert.equal(courtRelation(g.getSnapshot().context.relationshipGraph!, name, PLAYER_NODE).hate, 25);
  assert.equal(actor.getSnapshot().context.hasGivenAllegiance, false);
  assert.equal(actor.getSnapshot().context.supportLevel, 0);
  assert.equal(actor.getSnapshot().context.isLover, true, 'hostility does not silently rewrite mutual romance');
});

test('romance cannot race an in-flight political gift transaction or create a second pending payment', t => {
  const held = machine.provide({ actors: { evaluateGift: fromPromise(async () => new Promise<any>(() => {})) } });
  const g = start(t, 'prince', held), name = 'Maid Ling'; present(g, [name]);
  g.send({ type: 'GIVE_GIFT_WITH_MESSAGE', characterId: name, messageType: 'neutral', requestId: 'pending-political-gift' });
  assert.ok(g.getSnapshot().context.pendingGift);
  const before = JSON.stringify(g.getPersistedSnapshot());
  for (const action of ['gift', 'propose', 'end'] as const) send(g, name, action, `romance-during-pending-${action}`);
  assert.equal(JSON.stringify(g.getPersistedSnapshot()), before);
  assert.deepEqual(g.getSnapshot().context.processedRomanceRequests, []);
  assert.equal(g.getSnapshot().context.lastRomanceReceipt, null);
});

test('unknown, deferred, absent, inactive, invalid-id and unsupported-action romance events leave no receipt or mutation', t => {
  const g = start(t), name = 'Maid Ling'; present(g, [name, 'Empress Dowager']);
  const absent = 'Scholar Qin'; g.getSnapshot().context.characters[absent].send({ type: 'DEACTIVATE' });
  g.getSnapshot().context.activeCharacterNames = g.getSnapshot().context.activeCharacterNames.filter(n => n !== absent);
  const before = JSON.stringify(g.getPersistedSnapshot());
  for (const id of ['Unknown', 'Emperor', 'Empress Dowager', absent]) send(g, id, 'gift', `invalid-${id}`);
  send(g, name, 'gift', '');
  g.send({ type: 'ROMANCE_ACTION', characterId: name, action: 'marry', requestId: 'unsupported' } as any);
  assert.equal(JSON.stringify(g.getPersistedSnapshot()), before);
  present(g, []); const offArea = JSON.stringify(g.getPersistedSnapshot());
  send(g, name, 'gift', 'off-area-target'); assert.equal(JSON.stringify(g.getPersistedSnapshot()), offArea);
});

test('Concubine recipient witnesses six gifts to90; the free seventh-action proposal reaches side threshold and preserves one-report defeat', t => {
  const g = start(t, 'concubine'), name = 'Concubine Mei'; present(g, [name]);
  const actor = g.getSnapshot().context.characters[name];
  assert.equal(actor.getSnapshot().context.suspicionThreshold, .7);
  giftTimes(g, name, 6);
  let c = g.getSnapshot().context;
  assert.deepEqual(g.getSnapshot().value, { playing: 'in_season' });
  assert.equal(courtRelation(c.relationshipGraph!, name, PLAYER_NODE).affection, 90);
  assert.ok(Math.abs(actor.getSnapshot().context.suspicion - .6) < 1e-9);
  assert.equal(actor.getSnapshot().context.isLover, false);
  assert.deepEqual(c.lastRomanceReceipt?.witnesses, [name]); assert.deepEqual(c.lastRomanceReceipt?.reportingWitnesses, []);
  const gifts = c.giftsRemaining; send(g, name, 'propose', 'fatal-proposal'); c = g.getSnapshot().context;
  assert.equal(c.lastRomanceReceipt?.accepted, true);
  assert.deepEqual(c.lastRomanceReceipt?.reportingWitnesses, [name]);
  assert.equal(c.giftsRemaining, gifts); assert.equal(c.lastRomanceReceipt?.cost, 0);
  assert.equal(g.getSnapshot().value, 'game_over'); assert.equal(c.gameEndReason, 'defeat');
  assert.deepEqual(c.suspiciousCharacters, [name]); assert.equal(actor.getSnapshot().context.isLover, true);
  assert.ok(courtRelation(c.relationshipGraph!, name, PLAYER_NODE).romance);
  assert.ok(capture(g), 'fatal proposal still has a consistent persisted graph and projection');
});

test('the exact ninth romantic action reports an unpledged minor at0.9 as previewed despite repeated decimal increments', t => {
  const g = start(t, 'concubine'), name = 'Maid Ling'; present(g, [name]);
  const actor = g.getSnapshot().context.characters[name];
  assert.equal(actor.getSnapshot().context.suspicionThreshold, .9);
  giftTimes(g, name, 8, 'minor-threshold');
  assert.deepEqual(g.getSnapshot().value, { playing: 'in_season' });
  assert.equal(actor.getSnapshot().context.suspicion, .8);
  assert.deepEqual(g.getSnapshot().context.suspiciousCharacters, []);
  assert.deepEqual(g.getSnapshot().context.lastRomanceReceipt?.reportingWitnesses, []);
  const p = actor.getSnapshot().context;
  const preview = romanceWitnessRisk('concubine', 'ladies', [{ name, pledged: p.hasGivenAllegiance, suspicion: p.suspicion, suspicionThreshold: p.suspicionThreshold, zone: 'ladies' }]);
  assert.equal(preview[0].reports, true, 'the next action preview warns about the report');
  send(g, name, 'gift', 'minor-threshold-ninth');
  const c = g.getSnapshot().context;
  assert.equal(actor.getSnapshot().context.suspicion, .9, 'normalization avoids0.8999999999999999');
  assert.deepEqual(c.lastRomanceReceipt?.reportingWitnesses, preview.filter(w => w.reports).map(w => w.name));
  assert.deepEqual(c.suspiciousCharacters, [name]);
  assert.equal(g.getSnapshot().value, 'game_over'); assert.equal(c.gameEndReason, 'defeat');
  assert.equal(c.lastRomanceReceipt?.requestId, 'minor-threshold-ninth');
  assert.equal(c.lastRomanceReceipt?.cost, 1); assert.equal(c.lastRomanceReceipt?.affectionDelta, 0);
  assert.ok(capture(g));
});

test('a pledged minor remains immune through the ninth romantic action and the same preview excludes them', t => {
  const g = start(t, 'concubine'), name = 'Maid Ling'; present(g, [name]);
  const actor = g.getSnapshot().context.characters[name]; actor.send({ type: 'APPLY_FACTION_BONUS', supportBonus: 100 });
  const before = political(g), gifts = g.getSnapshot().context.giftsRemaining;
  giftTimes(g, name, 8, 'pledged-minor-threshold');
  const p = actor.getSnapshot().context;
  assert.equal(p.hasGivenAllegiance, true); assert.equal(p.suspicion, 0); assert.equal(p.suspicionThreshold, .9);
  assert.deepEqual(romanceWitnessRisk('concubine', 'ladies', [{ name, pledged: p.hasGivenAllegiance, suspicion: p.suspicion, suspicionThreshold: p.suspicionThreshold, zone: 'ladies' }]), []);
  send(g, name, 'gift', 'pledged-minor-threshold-ninth');
  const c = g.getSnapshot().context;
  assert.equal(actor.getSnapshot().context.suspicion, 0);
  assert.deepEqual(c.lastRomanceReceipt?.witnesses, []); assert.deepEqual(c.lastRomanceReceipt?.reportingWitnesses, []);
  assert.deepEqual(c.suspiciousCharacters, []); assert.deepEqual(g.getSnapshot().value, { playing: 'in_season' });
  assert.equal(c.giftsRemaining, gifts - 9); assert.equal(c.lastRomanceReceipt?.requestId, 'pledged-minor-threshold-ninth');
  assert.deepEqual(political(g), before);
});

test('pledged-target private Concubine route is viable at85; romantic gifts and end add no new income or suspicion', t => {
  const g = start(t, 'concubine'), name = 'Maid Ling'; present(g, [name]);
  const actor = g.getSnapshot().context.characters[name]; actor.send({ type: 'APPLY_FACTION_BONUS', supportBonus: 100 });
  assert.ok(actor.getSnapshot().context.hasGivenAllegiance);
  const before = political(g), gifts = g.getSnapshot().context.giftsRemaining;
  giftTimes(g, name, 5); send(g, name, 'propose', 'below85');
  assert.equal(g.getSnapshot().context.lastRomanceReceipt?.accepted, false);
  assert.match(g.getSnapshot().context.lastRomanceReceipt!.response, /85/);
  send(g, name, 'gift', 'sixth'); send(g, name, 'propose', 'private-accept');
  assert.equal(g.getSnapshot().context.lastRomanceReceipt?.accepted, true);
  assert.deepEqual(g.getSnapshot().context.lastRomanceReceipt?.witnesses, []);
  assert.equal(actor.getSnapshot().context.suspicion, 0);
  assert.equal(g.getSnapshot().context.giftsRemaining, gifts - 6);
  assert.deepEqual(political(g), before);
  send(g, name, 'end', 'quiet-end');
  assert.deepEqual(g.getSnapshot().context.lastRomanceReceipt?.witnesses, []);
  assert.equal(actor.getSnapshot().context.suspicion, 0);
  assert.deepEqual(political(g), before);
});

test('Concubine witnesses include different factions but exclude pledged, off-area and off-season courtiers', t => {
  const g = start(t, 'concubine'), target = 'Concubine Mei', local = 'Eunuch Gao', pledged = 'Maid Ling', distant = 'Maid Su', offseason = 'Maid Bai';
  present(g, [target, local, pledged, distant]);
  const c = g.getSnapshot().context;
  c.characters[pledged].send({ type: 'APPLY_FACTION_BONUS', supportBonus: 100 });
  assert.notEqual(assignCharacterFaction(c.characters[target].getSnapshot().context as any), assignCharacterFaction(c.characters[local].getSnapshot().context as any), 'fixture has different factions');
  c.characters[offseason].send({ type: 'DEACTIVATE' }); c.activeCharacterNames = c.activeCharacterNames.filter(n => n !== offseason);
  g.send({ type: 'UPDATE_PALACE_PRESENCE', zone: 'ladies', names: [target, local, pledged, offseason] });
  assert.deepEqual(g.getSnapshot().context.presentCharacterNames, [target, local, pledged]);
  send(g, target, 'gift', 'witnessed');
  assert.deepEqual(g.getSnapshot().context.lastRomanceReceipt?.witnesses, [target, local]);
  assert.equal(c.characters[target].getSnapshot().context.suspicion, .1);
  assert.equal(c.characters[local].getSnapshot().context.suspicion, .1);
  for (const id of [pledged, distant, offseason]) assert.equal(c.characters[id].getSnapshot().context.suspicion, 0, id);
  send(g, target, 'propose', 'witnessed-refusal');
  assert.equal(g.getSnapshot().context.lastRomanceReceipt?.accepted, false);
  assert.equal(c.characters[local].getSnapshot().context.suspicion, .2, 'refused proposals still have witnesses');
});

test('end romance does not generate Concubine witness suspicion even with an unpledged spectator present', t => {
  const g = start(t, 'concubine'), target = 'Maid Ling', spectator = 'Concubine Mei'; present(g, [target]);
  g.getSnapshot().context.characters[target].send({ type: 'APPLY_FACTION_BONUS', supportBonus: 100 });
  giftTimes(g, target, 6); send(g, target, 'propose', 'accepted'); present(g, [target, spectator]);
  send(g, target, 'end', 'public-breakup');
  assert.equal(g.getSnapshot().context.characters[spectator].getSnapshot().context.suspicion, 0);
  assert.deepEqual(g.getSnapshot().context.lastRomanceReceipt?.witnesses, []);
  assert.deepEqual(g.getSnapshot().context.lastRomanceReceipt?.reportingWitnesses, []);
});

test('accepted multi-lover jealousy settles once per real season and survives save/reload without political allegiance or lover income', t => {
  const g = start(t), names = ['Maid Ling', 'Maid Su']; present(g, names);
  for (const name of names) { giftTimes(g, name, 4); send(g, name, 'propose', `${name}-accepted`); }
  let c = g.getSnapshot().context;
  const beforeA = courtRelation(c.relationshipGraph!, names[0], names[1]).hate;
  const beforeB = courtRelation(c.relationshipGraph!, names[1], names[0]).hate;
  assert.equal(beforeA, 20); assert.equal(beforeB, 20);
  for (const name of names) { assert.equal(courtRelation(c.relationshipGraph!, name, PLAYER_NODE).pledge, null); assert.equal(c.characters[name].getSnapshot().context.supportLevel, 0); }
  const gifts = c.giftsRemaining; g.send({ type: 'NEXT_SEASON' }); c = g.getSnapshot().context;
  assert.equal(c.season, 2);
  assert.equal(c.giftsRemaining, gifts + seasonalGiftGrant('prince', null), 'accepted romance contributes no pledged income');
  assert.equal(courtRelation(c.relationshipGraph!, names[0], names[1]).hate, beforeA + 10);
  assert.equal(courtRelation(c.relationshipGraph!, names[1], names[0]).hate, beforeB + 10);
  const saved = capture(g), r = restore(t, saved), snapshot = JSON.stringify(r.getPersistedSnapshot());
  assert.deepEqual(r.getSnapshot().context.relationshipGraph, c.relationshipGraph);
  r.send({ type: 'RESOLVE_COURT_SEASON', season: 2, stage: 1 }); r.send({ type: 'RESOLVE_COURT_SEASON', season: 2, stage: 2 });
  assert.equal(JSON.stringify(r.getPersistedSnapshot()), snapshot, 'duplicate settlement and load do not replay jealousy');
  r.send({ type: 'NEXT_SEASON' });
  assert.equal(courtRelation(r.getSnapshot().context.relationshipGraph!, names[0], names[1]).hate, beforeA + 20);
  for (const name of names) assert.equal(r.getSnapshot().context.characters[name].getSnapshot().context.isLover, true);
});

test('schema7 graph2 saves mutual accepted romance, directed affection, response and request ledger without replay', t => {
  const g = start(t), name = 'Maid Ling'; present(g, [name]); giftTimes(g, name, 4); send(g, name, 'propose', 'persisted-accept');
  const saved = capture(g); assert.equal(SAVE_VERSION, 7); assert.equal(saved.version, 7); assert.equal(saved.snapshot.context.relationshipGraph?.version, 2);
  const parsed = parseCampaignSave(JSON.stringify(saved)); assert.equal(parsed.migrated, false);
  const r = restore(t, saved), c = r.getSnapshot().context;
  assert.deepEqual(c.processedRomanceRequests, g.getSnapshot().context.processedRomanceRequests);
  assert.deepEqual(c.lastRomanceReceipt, g.getSnapshot().context.lastRomanceReceipt);
  assert.equal(c.characters[name].getSnapshot().context.lastResponse, g.getSnapshot().context.characters[name].getSnapshot().context.lastResponse);
  assert.equal(c.characters[name].getSnapshot().context.isLover, true);
  assert.equal(courtRelation(c.relationshipGraph!, name, PLAYER_NODE).affection, 60);
  assert.equal(courtRelation(c.relationshipGraph!, PLAYER_NODE, name).affection, 0);
  const before = JSON.stringify(r.getPersistedSnapshot()); send(r, name, 'propose', 'persisted-accept');
  assert.equal(JSON.stringify(r.getPersistedSnapshot()), before);
});

test('true schema6 graph1 migration preserves politics/RNG/inventory, maps old love to affection and retains old love1 gift eligibility separately', t => {
  const g = start(t), save: any = capture(g), c = save.snapshot.context;
  save.version = 6; c.relationshipGraph.version = 1; delete c.processedRomanceRequests; delete c.lastRomanceReceipt;
  for (const ties of Object.values(c.relationshipGraph.edges) as any[]) for (const edge of Object.values(ties) as any[]) { delete edge.affection; delete edge.romance; }
  for (const name of Object.keys(c.characters)) { const p = child(save, name); delete p.isLover; delete p.legacyCourtshipGiftEligible; p.relationshipVectors.loveForPlayer = name === 'Maid Ling' ? 1 : name === 'Scholar Qin' ? .57 : 0; }
  // Keep the former love1 actor inactive to verify migration itself pays nothing.
  save.snapshot.children[c.characters['Maid Ling'].id].snapshot.value = 'inactive';
  c.activeCharacterNames = c.activeCharacterNames.filter((n: string) => n !== 'Maid Ling'); c.presentCharacterNames = [];
  const old = structuredClone(save), result = parseCampaignSave(JSON.stringify(save));
  assert.equal(result.migrated, true); assert.equal(result.save.version, 7);
  const upgraded: any = result.save.snapshot.context, graph: CourtGraph = upgraded.relationshipGraph;
  assert.equal(graph.version, 2); assert.equal(graph.revision, c.relationshipGraph.revision); assert.equal(graph.seed, c.relationshipGraph.seed);
  assert.equal(upgraded.rngState, c.rngState); assert.equal(upgraded.giftsRemaining, c.giftsRemaining);
  for (const key of ['supportPoints', 'playerPersonality', 'playerReputation', 'factionSystem', 'standingAwards', 'courtGiftSeasons', 'courtPlots']) assert.deepEqual(upgraded[key], c[key], key);
  for (const [from, ties] of Object.entries(c.relationshipGraph.edges) as [string, any][]) for (const [to, edge] of Object.entries(ties) as [string, any][]) {
    const migrated = courtRelation(graph, from, to); assert.equal(migrated.support, edge.support); assert.equal(migrated.hate, edge.hate); assert.deepEqual(migrated.pledge, edge.pledge); assert.equal(migrated.romance, null);
  }
  assert.equal(courtRelation(graph, 'Maid Ling', PLAYER_NODE).affection, 100); assert.ok(Math.abs(courtRelation(graph, 'Scholar Qin', PLAYER_NODE).affection - 57) < 1e-9);
  assert.equal(child(result.save, 'Maid Ling').legacyCourtshipGiftEligible, true);
  assert.equal(child(result.save, 'Scholar Qin').legacyCourtshipGiftEligible, false);
  for (const name of Object.keys(c.characters)) assert.equal(child(result.save, name).isLover, false);
  assert.deepEqual(upgraded.processedRomanceRequests, []); assert.equal(upgraded.lastRomanceReceipt, null);
  assert.deepEqual(save, old, 'migration does not mutate input');
  const second = parseCampaignSave(JSON.stringify(result.save)); assert.equal(second.migrated, false); assert.deepEqual(second.save, result.save);
  const restored = restore(t, result.save), gifts = restored.getSnapshot().context.giftsRemaining;
  restored.getSnapshot().context.characters['Maid Ling'].send({ type: 'ACTIVATE' });
  assert.equal(restored.getSnapshot().context.giftsRemaining, gifts + 1, 'the old love1 gift remains eligible');
  assert.equal(restored.getSnapshot().context.characters['Maid Ling'].getSnapshot().context.isLover, false);
  assert.equal(courtRelation(restored.getSnapshot().context.relationshipGraph!, 'Maid Ling', PLAYER_NODE).pledge, null);
});

test('schema7 rejects asymmetric lovers, graph/projection drift, duplicate requests and malformed romance receipts', t => {
  const g = start(t), name = 'Maid Ling'; present(g, [name]); giftTimes(g, name, 4); send(g, name, 'propose', 'accepted');
  const saved = capture(g);
  for (const corrupt of [
    (s: any) => { s.snapshot.context.relationshipGraph.edges[PLAYER_NODE][name].romance = null; },
    (s: any) => { child(s, name).isLover = false; },
    (s: any) => { child(s, name).relationshipVectors.loveForPlayer = .61; },
    (s: any) => { s.snapshot.context.processedRomanceRequests.push('accepted'); },
    (s: any) => { s.snapshot.context.lastRomanceReceipt.cost = -1; },
    (s: any) => { s.snapshot.context.lastRomanceReceipt.reportingWitnesses = ['Scholar Qin']; },
  ]) {
    const bad = structuredClone(saved); corrupt(bad);
    assert.throws(() => parseCampaignSave(JSON.stringify(bad)), /romance|affection/i);
  }
});

test('restart clears all romance ledgers, accepted pairs and affection from the previous campaign', t => {
  const g = start(t, 'concubine'); present(g, ['Concubine Mei']); giftTimes(g, 'Concubine Mei', 6); send(g, 'Concubine Mei', 'propose', 'fatal');
  assert.equal(g.getSnapshot().value, 'game_over'); g.send({ type: 'RESTART_GAME' });
  assert.equal(g.getSnapshot().value, 'choosing_character');
  assert.deepEqual(g.getSnapshot().context.processedRomanceRequests, []); assert.equal(g.getSnapshot().context.lastRomanceReceipt, null);
  g.send({ type: 'CHOOSE_CHARACTER', payload: { type: 'prince' } }); g.send({ type: 'INITIALIZE_GAME' });
  const c = g.getSnapshot().context; assert.deepEqual(graphLovers(c.relationshipGraph!, PLAYER_NODE), []);
  assert.equal(courtRelation(c.relationshipGraph!, 'Concubine Mei', PLAYER_NODE).affection, 0);
  assert.equal(c.characters['Concubine Mei'].getSnapshot().context.isLover, false);
});

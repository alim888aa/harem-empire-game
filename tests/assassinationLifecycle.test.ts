import test, { beforeEach, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createActor } from 'xstate';
import { gameMachine } from '../src/state-machines/game-machine';
import {
  captureCampaign, campaignActorOptions, createCampaignPresentation, parseCampaignSave, SAVE_VERSION,
  type CampaignActor, type CampaignSave,
} from '../src/persistence/campaignSave';
import {
  courtRelation, graphPledgedTo, PLAYER_NODE, reduceCourtRelation, scheduledOverlap, updateCourtNode,
  type CourtGraph,
} from '../src/lib/courtGraph';
import { emptyCourtPlots } from '../src/lib/courtPlots';
import { campaignRandom } from '../src/lib/campaignRandom';
import { assignCharacterFaction, type FactionType } from '../src/lib/factionSystem';
import { scheduledNpcZone } from '../src/palace/zones';

// Only suppress the unrelated random Emperor interruption. Every assertion below
// advances the real parent/child season-settlement path through NEXT_SEASON.
const machine = gameMachine.provide({ guards: { emperor_encountered: () => false } });
const ATTACKERS = ['General Zhao', 'Minister Chen', 'Prince Feng'];
const ALLIES = ['Maid Ling', 'Maid Su', 'Maid Bai'];
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

beforeEach(t => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'warn', () => {});
  t.mock.method(Math, 'random', () => .424242);
  Object.defineProperty(globalThis, 'alert', { configurable: true, value: () => {} });
  t.mock.method(globalThis, 'fetch', async () => { throw Error('Lifecycle tests must not call external services'); });
});

function register(t: TestContext, game: CampaignActor) {
  const errors: unknown[] = [];
  game.subscribe({ error: error => errors.push(error) });
  t.after(() => { game.stop(); assert.deepEqual(errors, [], 'actor errors'); });
  game.start();
  return game;
}

function persisted(game: CampaignActor): any { return clone(game.getPersistedSnapshot()); }

function saved(game: CampaignActor) {
  const save = captureCampaign(game, createCampaignPresentation('prince'));
  assert.ok(save, 'the completed season is a valid save checkpoint');
  return save;
}

function restore(t: TestContext, save: CampaignSave) {
  return register(t, createActor(machine, campaignActorOptions(save)));
}

function person(save: any, name: string): any {
  return save.snapshot.children[save.snapshot.context.characters[name].id].snapshot.context;
}

function projectFixture(save: any) {
  const c = save.snapshot.context;
  const factions: Record<FactionType, string[]> = { Rebel: [], Imperial: [], Loyalist: [], Independent: [] };
  for (const name of Object.keys(c.characters)) {
    const p = person(save, name), edge = courtRelation(c.relationshipGraph, name, PLAYER_NODE);
    Object.assign(p, { supportLevel: edge.support, hate: edge.hate, hasGivenAllegiance: !!edge.pledge });
    const faction = assignCharacterFaction(p);
    c.relationshipGraph = updateCourtNode(c.relationshipGraph, name, { faction });
    factions[faction].push(name);
  }
  c.factionSystem.factions = factions;
}

/** A Node persisted-snapshot fixture, never a runtime/browser mutation. Keep all
 * 48 real actors, canonical graph projections, and save validation in the loop. */
function fixture(t: TestContext, options: { attackers?: string[]; allies?: string[]; rank?: string | null; influence?: number } = {}) {
  const fresh = register(t, createActor(machine));
  fresh.send({ type: 'CHOOSE_CHARACTER', payload: { type: 'prince' } });
  fresh.send({ type: 'INITIALIZE_GAME' });
  const save: any = clone(saved(fresh)), c = save.snapshot.context;
  c.rank = options.rank === undefined ? 'grand_prince' : options.rank;
  c.playerPersonality.influence = options.influence ?? .5;
  c.rivalInfluenceHighWater = c.playerPersonality.influence;
  c.rivalInfluenceGain = 0;
  c.promotionRivals = [];
  c.supportPoints = 0;
  c.courtPlots = emptyCourtPlots(c.season);
  c.currentZone = 'library';
  c.presentCharacterNames = [];
  c.presenceReady = true;
  let graph: CourtGraph = c.relationshipGraph;
  for (const name of options.attackers ?? [ATTACKERS[0]]) {
    const p = person(save, name);
    p.personalityVectors = { ...p.personalityVectors, influence: .7, ambition: .4, loyalty: .4, fear: .2 };
    graph = reduceCourtRelation(graph, name, PLAYER_NODE, { kind: 'hate', amount: 100 }, c.season).graph;
  }
  for (const name of options.allies ?? [ALLIES[0]]) {
    graph = reduceCourtRelation(graph, name, PLAYER_NODE, { kind: 'pledge' }, c.season).graph;
    // Durable pledges may outlive support. Zero support avoids incidental reward
    // or returning-contact effects obscuring the plot lifecycle being tested.
    const p = person(save, name);
    p.hasGivenSupport = true;
    save.snapshot.children[c.characters[name].id].snapshot.value = 'inactive';
    c.activeCharacterNames = c.activeCharacterNames.filter((n: string) => n !== name);
  }
  c.relationshipGraph = graph;
  projectFixture(save);
  return parseCampaignSave(JSON.stringify(save)).save;
}

function advance(game: CampaignActor, season: number) {
  game.send({ type: 'NEXT_SEASON' });
  const c = game.getSnapshot().context;
  assert.equal(c.season, season);
  assert.equal(c.seasonSettlementPending, false);
  assert.equal(c.pendingIntrigueSeason, null);
  assert.equal(c.pendingPlotResolution, null);
  assert.equal(c.courtPlots?.lastProcessedSeason, season);
}

function deaths(game: CampaignActor) { return Object.values(game.getSnapshot().context.deceasedCourtiers ?? {}); }

test('a real season boundary warns for one full season, then an off-zone pledged ally shields and is permanently stopped', t => {
  const game = restore(t, fixture(t));
  const ally = game.getSnapshot().context.characters[ALLIES[0]], allyId = ally.id;
  assert.equal(ally.getSnapshot().value, 'inactive');
  assert.notEqual(scheduledNpcZone(ALLIES[0], 2, 0), 'library');
  assert.deepEqual(game.getSnapshot().context.presentCharacterNames, []);
  advance(game, 2);
  const warned = game.getSnapshot().context;
  assert.deepEqual(warned.courtPlots?.pending[ATTACKERS[0]], { attacker: ATTACKERS[0], warnedSeason: 2, dueSeason: 3 });
  assert.equal(deaths(game).length, 0);
  assert.equal(warned.assassinationDeath, null);
  game.send({ type: 'UPDATE_PALACE_PRESENCE', zone: 'library', names: [] });
  assert.equal(deaths(game).length, 0, 'presence/render events cannot consume a warning');

  advance(game, 3);
  const c = game.getSnapshot().context;
  assert.ok(game.getSnapshot().matches({ playing: 'in_season' }));
  assert.equal(c.assassinationDeath, null);
  assert.equal(c.deceasedCourtiers?.[ALLIES[0]].attacker, ATTACKERS[0]);
  assert.equal(c.relationshipGraph?.nodes[ALLIES[0]].status, 'deceased');
  assert.ok(courtRelation(c.relationshipGraph!, ALLIES[0], PLAYER_NODE).pledge, 'historical allegiance remains on the tombstone');
  assert.equal(ally.getSnapshot().status, 'stopped');
  assert.equal(c.characters[ALLIES[0]], undefined);
  assert.equal(game.getSnapshot().children[allyId], undefined);
  for (const names of [c.activeCharacterNames, c.presentCharacterNames, c.suspiciousCharacters, ...Object.values(c.factionSystem.factions)]) {
    assert.ok(!names.includes(ALLIES[0]), 'death removes all live roster projections');
  }
  const before = persisted(game);
  ally.send({ type: 'ACTIVATE' });
  ally.send({ type: 'APPLY_FACTION_BONUS', supportBonus: 100 });
  game.send({ type: 'CHARACTER_GAVE_GIFTS', name: ALLIES[0], characterType: 'minor' });
  game.send({ type: 'RESOLVE_COURT_SEASON', season: 3, stage: 2 });
  assert.deepEqual(persisted(game), before, 'stopped actors and a repeated settlement cannot replay rewards or kills');
  const restored = restore(t, saved(game));
  assert.deepEqual(persisted(restored), before);
  advance(restored, 4);
  assert.equal(restored.getSnapshot().context.characters[ALLIES[0]], undefined, 'later cast selection never resurrects a victim');
  assert.equal(restored.getSnapshot().children[allyId], undefined);
  assert.deepEqual(restored.getSnapshot().context.deceasedCourtiers, c.deceasedCourtiers);
});

test('three due attacks consume exactly three distinct living pledges, with no roll that spares an attack', t => {
  const game = restore(t, fixture(t, { attackers: ATTACKERS, allies: ALLIES }));
  const refs = ALLIES.map(name => game.getSnapshot().context.characters[name]);
  advance(game, 2);
  assert.equal(Object.keys(game.getSnapshot().context.courtPlots!.pending).length, 3);
  advance(game, 3);
  assert.equal(deaths(game).length, 3);
  assert.deepEqual(deaths(game).map(death => death.name).sort(), [...ALLIES].sort());
  assert.deepEqual(deaths(game).map(death => death.attacker).sort(), [...ATTACKERS].sort());
  assert.equal(game.getSnapshot().context.assassinationDeath, null, 'N allies shield N attacks');
  assert.equal(graphPledgedTo(game.getSnapshot().context.relationshipGraph!, PLAYER_NODE).length, 0);
  for (const ref of refs) assert.equal(ref.getSnapshot().status, 'stopped');
  assert.equal(Object.keys(saved(game).snapshot.children!).length, 45);
});

test('the third due attack kills the player after two shields, and terminal death reloads exactly', t => {
  const game = restore(t, fixture(t, { attackers: ATTACKERS, allies: ALLIES.slice(0, 2) }));
  advance(game, 2);
  advance(game, 3);
  const c = game.getSnapshot().context;
  assert.equal(deaths(game).length, 2);
  assert.equal(game.getSnapshot().value, 'game_over');
  assert.equal(c.gameEndReason, 'defeat');
  assert.equal(c.assassinationDeath?.attacker, 'Prince Feng');
  assert.equal(c.assassinationDeath?.season, 3);
  assert.equal(c.relationshipGraph?.nodes[PLAYER_NODE].status, 'deceased');
  assert.deepEqual(c.courtPlots?.pending, {});
  assert.match(c.careerEnding!.description, /No living pledged ally/);
  const save = saved(game), restored = restore(t, save), before = persisted(game);
  assert.deepEqual(persisted(restored), before);
  restored.send({ type: 'NEXT_SEASON' });
  restored.send({ type: 'SEASON_EXPIRED' });
  assert.deepEqual(persisted(restored), before, 'game over cannot advance, reroll, or replay allowance');
});

test('an unshielded attack kills only after its warning season, including across a reload', t => {
  const game = restore(t, fixture(t, { allies: [] }));
  advance(game, 2);
  assert.equal(game.getSnapshot().context.assassinationDeath, null);
  const restored = restore(t, saved(game));
  assert.deepEqual(persisted(restored), persisted(game));
  advance(restored, 3);
  assert.equal(deaths(restored).length, 0);
  assert.equal(restored.getSnapshot().value, 'game_over');
  assert.equal(restored.getSnapshot().context.assassinationDeath?.attacker, ATTACKERS[0]);
});

test('warning and casualty saves resume the exact RNG, graph, selected victims, and consecutive-season continuation', t => {
  const game = restore(t, fixture(t, { attackers: ATTACKERS.slice(0, 2), allies: ALLIES }));
  advance(game, 2);
  const warning = saved(game), restored = restore(t, warning);
  assert.deepEqual(persisted(restored), persisted(game));
  assert.deepEqual(saved(restored).snapshot, warning.snapshot, 'mere capture/reload never consumes randomness');
  advance(game, 3);
  advance(restored, 3);
  assert.deepEqual(persisted(restored), persisted(game), 'the same graph and RNG choose the same weighted victims');
  const afterDeath = restore(t, saved(restored));
  for (const season of [4]) {
    advance(game, season);
    advance(afterDeath, season);
    assert.deepEqual(persisted(afterDeath), persisted(game));
  }
  assert.equal(game.getSnapshot().value, 'game_over');
});

test('the live resolver consumes one seeded draw weighted by the attacker’s outgoing ties and prior-season contact', t => {
  const input: any = clone(fixture(t, { allies: ALLIES })), attacker = ATTACKERS[0];
  const graph: CourtGraph = input.snapshot.context.relationshipGraph;
  graph.edges[attacker][ALLIES[0]] = { support: 100, hate: 0, pledge: null, affection: 0, romance: null };
  graph.edges[attacker][ALLIES[1]] = { support: 0, hate: 100, pledge: null, affection: 0, romance: null };
  graph.edges[attacker][ALLIES[2]] = { support: 40, hate: 0, pledge: null, affection: 0, romance: null };
  const game = restore(t, parseCampaignSave(JSON.stringify(input)).save);
  advance(game, 2);
  let beforeResolution: { graph: CourtGraph; rngState: number } | undefined;
  const subscription = game.subscribe(snapshot => {
    const c = snapshot.context;
    if (c.season === 3 && c.pendingIntrigueSeason === 3 && c.courtPlots?.lastProcessedSeason === 2) {
      beforeResolution = { graph: clone(c.relationshipGraph!), rngState: c.rngState };
    }
  });
  t.after(() => subscription.unsubscribe());
  advance(game, 3);
  assert.ok(beforeResolution, 'observe the real settled-season checkpoint before plot resolution');
  const random = campaignRandom(beforeResolution.rngState), draw = random.next();
  const names = [...ALLIES].sort();
  const weights = names.map(name => {
    const edge = courtRelation(beforeResolution!.graph, attacker, name);
    return Math.max(.2, Math.min(4, (1 + edge.hate / 50 - edge.support * .0065 + scheduledOverlap(attacker, name, 2) * .5) * (edge.pledge ? .25 : 1)));
  });
  let cursor = draw * weights.reduce((total, weight) => total + weight, 0);
  const expected = names.find((_, index) => (cursor -= weights[index]) < 0) ?? names.at(-1);
  assert.equal(deaths(game)[0].name, expected);
  assert.equal(game.getSnapshot().context.rngState, random.state, 'exactly one victim draw and no chance-to-kill draw');

  const reverse: any = clone(input);
  for (const name of ALLIES) reverse.snapshot.context.relationshipGraph.edges[name][attacker] = { support: 0, hate: 100, pledge: null, affection: 0, romance: null };
  const reverseGame = restore(t, parseCampaignSave(JSON.stringify(reverse)).save);
  advance(reverseGame, 2);
  advance(reverseGame, 3);
  assert.deepEqual(deaths(reverseGame), deaths(game), 'reverse feelings do not affect the attacker’s target selection');
  assert.equal(reverseGame.getSnapshot().context.rngState, game.getSnapshot().context.rngState);
});

test('an unresolved plot strikes once every season, including across reload, until there are no allies', t => {
  const game = restore(t, fixture(t, { allies: ALLIES.slice(0, 2) }));
  advance(game, 2); advance(game, 3);
  assert.equal(deaths(game).length, 1);
  assert.deepEqual(game.getSnapshot().context.courtPlots?.pending[ATTACKERS[0]], {attacker:ATTACKERS[0],warnedSeason:2,dueSeason:4});
  const resumed=restore(t,saved(game));
  const before=persisted(resumed);
  resumed.send({type:'RESOLVE_COURT_SEASON',season:3,stage:2});
  assert.deepEqual(persisted(resumed),before);
  advance(resumed,4);assert.equal(deaths(resumed).length,2);
  assert.equal(resumed.getSnapshot().context.assassinationDeath,null);
  assert.deepEqual(resumed.getSnapshot().context.courtPlots!.events.filter(e=>e.kind==='warning').map(e=>e.season),[2]);
  assert.deepEqual(resumed.getSnapshot().context.courtPlots!.events.filter(e=>e.kind==='casualty').map(e=>e.season),[3,4]);
  const afterSecond=restore(t,saved(resumed));advance(afterSecond,5);
  assert.equal(afterSecond.getSnapshot().value,'game_over');assert.ok(afterSecond.getSnapshot().context.assassinationDeath);
});

test('base rank and equal influence never create a warning through the live season path', t => {
  for (const options of [{ rank: null }, { rank: 'prince' }, { influence: .7 }]) {
    const game = restore(t, fixture(t, { ...options, allies: [] }));
    advance(game, 2);
    advance(game, 3);
    assert.deepEqual(game.getSnapshot().context.courtPlots?.pending, {});
    assert.deepEqual(game.getSnapshot().context.courtPlots?.events, []);
    assert.equal(game.getSnapshot().context.assassinationDeath, null);
  }
});

test('strictly exceeding attacker influence cancels the old warning; losing that advantage needs a fresh warning', t => {
  const game = restore(t, fixture(t));
  advance(game, 2);
  const equal: any = clone(saved(game));
  equal.snapshot.context.playerPersonality.influence = .70001;
  equal.snapshot.context.rivalInfluenceHighWater = .70001;
  const safe = restore(t, parseCampaignSave(JSON.stringify(equal)).save);
  const rng = safe.getSnapshot().context.rngState;
  safe.send({ type: 'UPDATE_PALACE_PRESENCE', zone: 'library', names: [] });
  assert.deepEqual(safe.getSnapshot().context.courtPlots?.pending, {});
  assert.equal(safe.getSnapshot().context.courtPlots?.events.at(-1)?.kind, 'defused');
  assert.equal(safe.getSnapshot().context.rngState, rng);
  const vulnerable: any = clone(saved(safe));
  vulnerable.snapshot.context.playerPersonality.influence = .5;
  const again = restore(t, parseCampaignSave(JSON.stringify(vulnerable)).save);
  advance(again, 3);
  assert.equal(deaths(again).length, 0);
  assert.deepEqual(again.getSnapshot().context.courtPlots?.pending[ATTACKERS[0]], { attacker: ATTACKERS[0], warnedSeason: 3, dueSeason: 4 });
  advance(again, 4);
  assert.equal(deaths(again).length, 1);
});

test('an attacker who pledges during the warning is immediately defused and cannot attack next season', t => {
  const game = restore(t, fixture(t, { allies: [] }));
  advance(game, 2);
  const attacker = game.getSnapshot().context.characters[ATTACKERS[0]], rng = game.getSnapshot().context.rngState;
  attacker.send({ type: 'ACTIVATE' });
  attacker.send({ type: 'APPLY_FACTION_BONUS', supportBonus: 100 });
  assert.ok(courtRelation(game.getSnapshot().context.relationshipGraph!, ATTACKERS[0], PLAYER_NODE).pledge);
  assert.deepEqual(game.getSnapshot().context.courtPlots?.pending, {});
  assert.equal(game.getSnapshot().context.courtPlots?.events.at(-1)?.kind, 'defused');
  assert.equal(game.getSnapshot().context.rngState, rng);
  advance(game, 3);
  assert.equal(deaths(game).length, 0);
  assert.equal(game.getSnapshot().context.assassinationDeath, null);
  assert.deepEqual(game.getSnapshot().context.courtPlots?.pending, {});
});

test('joining the warned attacker’s formal faction cancels the plot while preserving its hate history', t => {
  const input: any = clone(fixture(t, { allies: [] }));
  for (const name of [ATTACKERS[0], 'Prime Minister', 'Empress Dowager']) {
    const p = person(input, name);
    p.personalityVectors = { ...p.personalityVectors, ambition: .2, loyalty: .9, fear: .2 };
    p.hasGivenSupport = true;
    input.snapshot.context.relationshipGraph = reduceCourtRelation(input.snapshot.context.relationshipGraph, name, PLAYER_NODE, { kind: 'support', amount: 65, formPledge: false }, 1).graph;
  }
  projectFixture(input);
  const game = restore(t, parseCampaignSave(JSON.stringify(input)).save);
  advance(game, 2);
  assert.ok(game.getSnapshot().context.courtPlots?.pending[ATTACKERS[0]]);
  const rng = game.getSnapshot().context.rngState;
  game.send({ type: 'JOIN_FACTION', faction: 'Imperial' });
  assert.equal(game.getSnapshot().context.factionSystem.playerFaction, 'Imperial');
  assert.equal(courtRelation(game.getSnapshot().context.relationshipGraph!, ATTACKERS[0], PLAYER_NODE).hate, 100);
  assert.deepEqual(game.getSnapshot().context.courtPlots?.pending, {});
  assert.equal(game.getSnapshot().context.rngState, rng);
  advance(game, 3);
  assert.equal(deaths(game).length, 0);
  assert.equal(game.getSnapshot().context.assassinationDeath, null);
});

test('v4 migration adds empty intrigue without rerolling graph/RNG or attacking; first new boundary only warns', t => {
  const legacy: any = clone(fixture(t, { attackers: ATTACKERS, allies: ALLIES }));
  legacy.version = 4;
  const plotKeys = ['courtPlots', 'deceasedCourtiers', 'assassinationDeath', 'seasonSettlementPending', 'pendingIntrigueSeason', 'pendingPlotResolution'];
  for (const key of plotKeys) delete legacy.snapshot.context[key];
  const before = clone(legacy), result = parseCampaignSave(JSON.stringify(legacy));
  assert.equal(result.migrated, true);
  assert.equal(result.save.version, SAVE_VERSION);
  const c = result.save.snapshot.context;
  assert.deepEqual(c.relationshipGraph, before.snapshot.context.relationshipGraph);
  assert.equal(c.rngState, before.snapshot.context.rngState);
  assert.deepEqual(c.graphAppliedCommands, before.snapshot.context.graphAppliedCommands);
  assert.deepEqual(c.courtPlots, emptyCourtPlots(c.season));
  assert.deepEqual(c.deceasedCourtiers, {});
  assert.equal(c.assassinationDeath, null);
  const withoutAdded: any = clone(result.save.snapshot);
  for (const key of plotKeys) delete withoutAdded.context[key];
  assert.deepEqual(withoutAdded, before.snapshot, 'actors, histories, pledges, and all preexisting state are preserved');
  assert.deepEqual(legacy, before, 'migration does not mutate the input fixture');
  const second = parseCampaignSave(JSON.stringify(result.save));
  assert.equal(second.migrated, false);
  assert.deepEqual(second.save, result.save);
  const game = restore(t, second.save);
  assert.deepEqual(persisted(game), result.save.snapshot);
  assert.equal(game.getSnapshot().context.rngState, before.snapshot.context.rngState);
  advance(game, 2);
  assert.equal(deaths(game).length, 0);
  assert.equal(game.getSnapshot().context.assassinationDeath, null);
  assert.equal(Object.keys(game.getSnapshot().context.courtPlots!.pending).length, 3);
  advance(game, 3);
  assert.equal(deaths(game).length, 3);
});

test('review: top-rank due unshielded attack resolves before freshly eligible audience',t=>{
 const input:any=clone(fixture(t,{rank:'crown_prince',allies:[]})),c=input.snapshot.context;
 c.season=3;c.rankEnteredSeason=1;c.courtPlots=emptyCourtPlots(3);c.courtPlots.pending[ATTACKERS[0]]={attacker:ATTACKERS[0],warnedSeason:3,dueSeason:4};
 c.factionSystem.playerFaction='Loyalist';c.relationshipGraph=updateCourtNode(c.relationshipGraph,PLAYER_NODE,{faction:'Loyalist',office:'crown_prince'});
 for(const name of Object.keys(c.characters))person(input,name).currentSeason=3;input.presentation.clock.season=3;
 const game=restore(t,parseCampaignSave(JSON.stringify(input)).save);advance(game,4);assert.equal(game.getSnapshot().value,'game_over');assert.ok(game.getSnapshot().context.assassinationDeath);
});
test('review: late hate threshold only warns on next boundary, then grants full season',t=>{
 const input:any=clone(fixture(t,{allies:[]})),c=input.snapshot.context;person(input,ATTACKERS[0]).hate=79;c.relationshipGraph.edges[ATTACKERS[0]][PLAYER_NODE].hate=79;
 const game=restore(t,parseCampaignSave(JSON.stringify(input)).save);game.getSnapshot().context.characters[ATTACKERS[0]].send({type:'GAIN_HATE',amount:1});assert.deepEqual(game.getSnapshot().context.courtPlots!.pending,{});advance(game,2);assert.equal(game.getSnapshot().context.assassinationDeath,null);assert.equal(game.getSnapshot().context.courtPlots!.pending[ATTACKERS[0]].dueSeason,3);advance(game,3);assert.ok(game.getSnapshot().context.assassinationDeath);
});
test('review: all stale dead actor messages leave canonical game unchanged',t=>{
 const game=restore(t,fixture(t));const ref=game.getSnapshot().context.characters[ALLIES[0]],actorId=ref.id;advance(game,2);advance(game,3);const before=persisted(game);
 for(const type of ['CHARACTER_GAVE_SUPPORT','CHARACTER_GAVE_ALLEGIANCE','CHARACTER_GAVE_GIFTS','CHARACTER_IS_SUSPICIOUS'])game.send({type,name:ALLIES[0],characterType:'minor'} as any);
 game.send({type:'RELATIONSHIP_COMMAND',name:ALLIES[0],actorId,serial:999,command:{kind:'hate',amount:1},origin:{kind:'plain'}});assert.deepEqual(persisted(game),before);
});
test('review: due plot pauses at tribute, reload preserves exact continuation and one kill',t=>{
 const seed=restore(t,fixture(t));advance(seed,2);const warning=saved(seed),forced=gameMachine.provide({guards:{emperor_encountered:()=>true}});
 const g=register(t,createActor(forced,campaignActorOptions(warning)));g.send({type:'NEXT_SEASON'});assert.ok(g.getSnapshot().matches({playing:'emperor_encounter'}));assert.equal(g.getSnapshot().context.season,2);assert.equal(deaths(g).length,0);
 const held=saved(g),r=register(t,createActor(forced,campaignActorOptions(held)));assert.deepEqual(persisted(g),persisted(r));
 for(const actor of [g,r]){actor.send({type:'GIVE_EMPEROR_GIFT'} as any);assert.equal(actor.getSnapshot().context.season,3);assert.equal(deaths(actor).length,1);assert.equal(actor.getSnapshot().context.courtPlots!.lastProcessedSeason,3);assert.ok(saved(actor));}
 assert.deepEqual(persisted(g),persisted(r));
});

test('equal influence after warning and after a casualty never defuses an ongoing plot',t=>{
 const g=restore(t,fixture(t,{allies:ALLIES}));advance(g,2);const input:any=clone(saved(g));input.snapshot.context.playerPersonality.influence=.7;input.snapshot.context.rivalInfluenceHighWater=.7;
 const r=restore(t,parseCampaignSave(JSON.stringify(input)).save);r.send({type:'UPDATE_PALACE_PRESENCE',zone:'library',names:[]});assert.ok(r.getSnapshot().context.courtPlots!.pending[ATTACKERS[0]]);advance(r,3);assert.equal(deaths(r).length,1);
 const twice=restore(t,saved(r));advance(twice,4);assert.equal(deaths(twice).length,2);
});
test('v5 cooldown migration resumes next-season threat without replaying casualties, hate or RNG',t=>{
 const game=restore(t,fixture(t,{allies:ALLIES}));advance(game,2);advance(game,3);const legacy:any=clone(saved(game));legacy.version=5;legacy.snapshot.context.courtPlots.pending={};legacy.snapshot.context.courtPlots.nextWarningSeason={[ATTACKERS[0]]:4};
 const before=clone(legacy);const migrated=parseCampaignSave(JSON.stringify(legacy));assert.equal(migrated.migrated,true);const c=migrated.save.snapshot.context;assert.deepEqual(c.deceasedCourtiers,before.snapshot.context.deceasedCourtiers);assert.deepEqual(c.relationshipGraph,before.snapshot.context.relationshipGraph);assert.equal(c.rngState,before.snapshot.context.rngState);assert.deepEqual(c.courtPlots!.pending[ATTACKERS[0]],{attacker:ATTACKERS[0],warnedSeason:2,dueSeason:4});
 const second=parseCampaignSave(JSON.stringify(migrated.save));assert.equal(second.migrated,false);assert.deepEqual(second.save,migrated.save);const restored=restore(t,second.save);advance(restored,4);assert.equal(deaths(restored).length,2);
});

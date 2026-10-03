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

test('intro cannot settle a pending assassination, refill gifts, change rank, award relationships, or consume RNG across reload', t => {
  const game = restore(t, fixture(t));
  advance(game, 2);
  assert.deepEqual(game.getSnapshot().context.courtPlots?.pending[ATTACKERS[0]], { attacker: ATTACKERS[0], warnedSeason: 2, dueSeason: 3 });
  const mechanics=(actor:CampaignActor)=>{
    const value=persisted(actor);delete value.value;
    delete value.context.firstEmperorVisitDone;delete value.context.firstEmperorVisitElapsed;
    return value;
  };
  const before=mechanics(game);
  const presentation=createCampaignPresentation('prince');
  presentation.clock={season:2,seasonMinutes:10,remainingSeconds:412.25,expired:false};
  for(let i=0;i<75;i++)game.send({type:'FIRST_EMPEROR_VISIT_TICK',seconds:1});
  assert.ok(game.getSnapshot().matches({playing:'emperor_intro'}));
  assert.deepEqual(mechanics(game),before);
  const checkpoint=captureCampaign(game,presentation);assert.ok(checkpoint);
  assert.equal(checkpoint.presentation.clock.remainingSeconds,412.25);
  const resumed=restore(t,checkpoint);
  assert.ok(resumed.getSnapshot().matches({playing:'emperor_intro'}));
  assert.deepEqual(mechanics(resumed),before);
  for(const type of ['NEXT_SEASON','SEASON_EXPIRED','REFUSE'])resumed.send({type} as any);
  resumed.send({type:'GIVE_EMPEROR_GIFT',giftsRemaining:999});
  assert.deepEqual(mechanics(resumed),before);
  resumed.send({type:'EMPEROR_INTRO_FINISHED'});
  assert.ok(resumed.getSnapshot().matches({playing:'in_season'}));
  assert.deepEqual(mechanics(resumed),before);
  assert.equal(deaths(resumed).length,0);
  advance(resumed,3);
  assert.equal(deaths(resumed).length,1,'only the actual season advance may resolve the pending assassination');
  assert.equal(resumed.getSnapshot().context.deceasedCourtiers?.[ALLIES[0]].attacker,ATTACKERS[0]);
});

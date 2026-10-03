import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialCharacters } from '../src/data/characters';
import { ROMANCE_PROFILES } from '../src/data/romanceProfiles';
import { assertCourtGraph, courtRelation, createCourtGraph, graphLovers, hateIsBlocked, migrateGraphRomance, PLAYER_NODE, reduceCourtRelation, setRomancePair, updateCourtNode, type CourtGraph } from '../src/lib/courtGraph';
import { endRomance, giveRomanticGift, proposeRomance, romanceAcceptanceThreshold, romancePairEligibility, romanceWitnessRisk, seasonalRomanceJealousy } from '../src/lib/courtRomance';

const A = 'Maid Ling', B = 'Scholar Qin', C = 'Concubine Mei', D = 'Eunuch Gao';
beforeEach(t => { t.mock.method(console, 'log', () => {}); });
function graph(): CourtGraph {
  let result = createCourtGraph([A, B, C, D, 'Empress Dowager'].map(name => ({ name, formalFaction: 'Imperial' as const })), 331, 'Imperial');
  result = updateCourtNode(result, PLAYER_NODE, { office: 'prince' });
  // Isolate romance from the sparse seeded political relationships.
  result.edges = {};
  return result;
}
function affection(g: CourtGraph, from: string, to: string, amount: number) {
  return reduceCourtRelation(g, from, to, { kind: 'affection', amount }, 1).graph;
}
function politics(g: CourtGraph) {
  return { nodes: g.nodes, edges: Object.fromEntries(Object.entries(g.edges).map(([from, edges]) => [from, Object.fromEntries(Object.entries(edges).filter(([, e]) => e.support || e.hate || e.pledge).map(([to, e]) => [to, { support: e.support, hate: e.hate, pledge: e.pledge }]))]).filter(([, edges]) => Object.keys(edges).length)) };
}

test('every authored courtier is an adult and explicitly non-family in all three careers; senior routes remain deferred', () => {
  const cast = createInitialCharacters(() => .42);
  assert.equal(cast.length, 48);
  const g = createCourtGraph(cast, 81);
  for (const person of cast) {
    const profile = ROMANCE_PROFILES[person.name];
    assert.ok(profile?.adult, person.name);
    assert.notEqual(profile.familyId, ROMANCE_PROFILES[PLAYER_NODE].familyId, person.name);
    if (person.name === 'Empress Dowager') {
      assert.equal(profile.available, false);
      continue;
    }
    assert.deepEqual([...profile.nonFamilyPlayerRoles], ['prince', 'minister', 'concubine'], person.name);
    for (const office of ['prince', 'grand_prince', 'crown_prince', 'scholar', 'minister', 'prime_minister', 'concubine', 'consort', 'empress']) {
      assert.equal(romancePairEligibility(updateCourtNode(g, PLAYER_NODE, { office }), PLAYER_NODE, person.name).allowed, true, `${office}: ${person.name}`);
    }
  }
  for (const id of ['Emperor', 'Empress Dowager']) assert.equal(romancePairEligibility(g, PLAYER_NODE, id).allowed, false, id);
});

test('eligibility rejects unknown profiles, self, family, minors, unavailable routes and nonliving endpoints', t => {
  const g = graph();
  assert.equal(romancePairEligibility(g, A, A).allowed, false);
  assert.equal(romancePairEligibility(g, A, 'Unknown').allowed, false);
  const unknown = createCourtGraph([{ name: 'Unknown', formalFaction: 'Independent' }, { name: A, formalFaction: 'Independent' }], 7);
  assert.equal(romancePairEligibility(unknown, A, 'Unknown').allowed, false);
  for (const id of [A, B]) for (const status of ['expelled', 'deceased'] as const) assert.equal(romancePairEligibility(updateCourtNode(g, id, { status }), A, B).allowed, false);
  const original = ROMANCE_PROFILES[A];
  t.after(() => { ROMANCE_PROFILES[A] = original; });
  for (const patch of [{ adult: false }, { available: false }, { familyId: ROMANCE_PROFILES[B].familyId }]) {
    ROMANCE_PROFILES[A] = { ...original, ...patch };
    assert.equal(romancePairEligibility(g, A, B).allowed, false);
  }
  ROMANCE_PROFILES[A] = { ...original, nonFamilyPlayerRoles: ['minister'] };
  assert.equal(romancePairEligibility(g, PLAYER_NODE, A).allowed, false);
  assert.equal(romancePairEligibility(updateCourtNode(g, PLAYER_NODE, { office: 'scholar' }), PLAYER_NODE, A).allowed, true);
});

test('romantic gifts add exactly15 directed affection, cap at100 and preserve all politics without inferring player feelings', () => {
  let g = graph();
  g = reduceCourtRelation(g, A, PLAYER_NODE, { kind: 'support', amount: 42.5, formPledge: false }, 1).graph;
  g = reduceCourtRelation(g, A, B, { kind: 'pledge' }, 1).graph;
  const before = structuredClone(g), political = politics(g);
  for (let n = 1; n <= 8; n++) {
    const result = giveRomanticGift(g, PLAYER_NODE, A, 1);
    assert.equal(result.affectionDelta, n <= 6 ? 15 : n === 7 ? 10 : 0);
    g = result.graph;
    assert.equal(courtRelation(g, A, PLAYER_NODE).affection, Math.min(100, n * 15));
    assert.equal(courtRelation(g, PLAYER_NODE, A).affection, 0);
    assert.equal(courtRelation(g, A, PLAYER_NODE).romance, null);
    assert.deepEqual(graphLovers(g, A), []);
    assert.deepEqual(politics(g), political);
  }
  assert.equal(courtRelation(before, A, PLAYER_NODE).affection, 0, 'gift is immutable');
});

test('romance is an explicit proposal at60 for Prince and Scholar and85 for Concubine, including exact boundaries', () => {
  assert.equal(romanceAcceptanceThreshold('prince'), 60);
  assert.equal(romanceAcceptanceThreshold('minister'), 60);
  assert.equal(romanceAcceptanceThreshold('concubine'), 85);
  for (const [role, threshold] of [['prince', 60], ['minister', 60], ['concubine', 85]] as const) {
    const justBelow = affection(graph(), A, PLAYER_NODE, threshold - .01);
    const refusal = proposeRomance(justBelow, PLAYER_NODE, A, 1, role);
    assert.equal(refusal.accepted, false);
    assert.equal(refusal.graph, justBelow);
    assert.match(refusal.reason, new RegExp(String(threshold)));
    const ready = affection(justBelow, A, PLAYER_NODE, .01), before = structuredClone(ready);
    assert.deepEqual(graphLovers(ready, PLAYER_NODE), []);
    const accepted = proposeRomance(ready, PLAYER_NODE, A, 1, role);
    assert.equal(accepted.accepted, true);
    for (const [from, to] of [[A, PLAYER_NODE], [PLAYER_NODE, A]]) assert.deepEqual(courtRelation(accepted.graph, from, to).romance, { formedSeason: 1, source: 'accepted' });
    assert.deepEqual(graphLovers(accepted.graph, PLAYER_NODE), [A]);
    assert.equal(courtRelation(accepted.graph, A, PLAYER_NODE).affection, threshold);
    assert.equal(courtRelation(accepted.graph, PLAYER_NODE, A).affection, 0);
    assert.deepEqual(politics(accepted.graph), politics(before));
    assert.deepEqual(ready, before);
  }
});

test('recipient hostility independently refuses consent even at100 affection and political support', () => {
  let g = affection(graph(), A, PLAYER_NODE, 100);
  g = reduceCourtRelation(g, A, PLAYER_NODE, { kind: 'support', amount: 100, formPledge: false }, 1).graph;
  g.edges[A][PLAYER_NODE].hate = 60;
  const refusal = proposeRomance(g, PLAYER_NODE, A, 1, 'prince');
  assert.equal(refusal.accepted, false);
  assert.equal(refusal.graph, g);
  assert.match(refusal.reason, /hostility/);
  const below = structuredClone(g); below.edges[A][PLAYER_NODE].hate = 59.99;
  assert.equal(proposeRomance(below, PLAYER_NODE, A, 1, 'prince').accepted, true);
});

test('same generic gift, consent and breakup functions support authored NPC pairs without player inference', () => {
  let g = graph();
  for (let n = 0; n < 4; n++) g = giveRomanticGift(g, A, B, 1).graph;
  assert.equal(courtRelation(g, B, A).affection, 60);
  assert.equal(courtRelation(g, A, B).affection, 0);
  const political = politics(g), accepted = proposeRomance(g, A, B, 2, null);
  assert.equal(accepted.accepted, true);
  assert.deepEqual(graphLovers(accepted.graph, A), [B]);
  assert.deepEqual(graphLovers(accepted.graph, B), [A]);
  assert.deepEqual(graphLovers(accepted.graph, PLAYER_NODE), []);
  assert.deepEqual(politics(accepted.graph), political);
  const ended = endRomance(accepted.graph, B, A, 3);
  assert.deepEqual(graphLovers(ended, A), []);
  assert.deepEqual(graphLovers(ended, B), []);
  assert.equal(courtRelation(ended, B, A).affection, 60);
  assert.equal(courtRelation(ended, A, B).romance, null);
  assert.equal(courtRelation(ended, B, A).romance, null);
  assert.deepEqual(politics(ended), political);
});

test('second accepted lover adds20 mutual jealousy despite same faction and player pledge, then10 per season', () => {
  let g = graph();
  for (const id of [A, B]) {
    g = reduceCourtRelation(g, id, PLAYER_NODE, { kind: 'pledge' }, 1).graph;
    g = affection(g, id, PLAYER_NODE, 60);
  }
  g = proposeRomance(g, PLAYER_NODE, A, 1, 'prince').graph;
  assert.equal(courtRelation(g, A, B).hate, 0);
  g = proposeRomance(g, PLAYER_NODE, B, 1, 'prince').graph;
  for (const [from, to] of [[A, B], [B, A]]) {
    assert.equal(hateIsBlocked(g, from, to), true, 'political immunity is still present');
    assert.equal(courtRelation(g, from, to).hate, 20, 'actual shared lovers have separate jealousy rules');
  }
  assert.equal(courtRelation(g, A, PLAYER_NODE).hate, 0);
  assert.equal(courtRelation(g, B, PLAYER_NODE).hate, 0);
  assert.ok(courtRelation(g, A, PLAYER_NODE).pledge);
  const repeated = proposeRomance(g, PLAYER_NODE, B, 1, 'prince');
  assert.equal(repeated.graph, g, 're-proposal cannot farm jealousy');
  const next = seasonalRomanceJealousy(g, 2);
  assert.equal(courtRelation(next, A, B).hate, 30);
  assert.equal(courtRelation(next, B, A).hate, 30);
  assert.equal(courtRelation(next, A, PLAYER_NODE).hate, 0);
  const ended = endRomance(next, PLAYER_NODE, B, 2);
  const future = seasonalRomanceJealousy(ended, 3);
  assert.equal(courtRelation(future, A, B).hate, 30, 'breakup stops future jealousy without erasing earned hate');
});

test('NPC shared-lover triangles use the same mutual20 acceptance and10 seasonal jealousy', () => {
  let g = graph();
  g = affection(g, B, A, 60); g = affection(g, C, A, 60);
  g = proposeRomance(g, A, B, 1, null).graph;
  g = proposeRomance(g, A, C, 1, null).graph;
  assert.equal(courtRelation(g, B, C).hate, 20);
  assert.equal(courtRelation(g, C, B).hate, 20);
  const next = seasonalRomanceJealousy(g, 2);
  assert.equal(courtRelation(next, B, C).hate, 30);
  assert.equal(courtRelation(next, C, B).hate, 30);
  assert.equal(courtRelation(next, A, PLAYER_NODE).hate, 0);
});

test('high affection, one-sided metadata and unrelated lovers cannot manufacture jealousy', () => {
  let g = graph();
  for (const id of [A, B]) g = affection(g, id, PLAYER_NODE, 100);
  g = reduceCourtRelation(g, A, PLAYER_NODE, { kind: 'romance', accepted: true }, 1).graph;
  assert.deepEqual(graphLovers(g, PLAYER_NODE), []);
  const noTriangle = reduceCourtRelation(g, A, B, { kind: 'jealousy', amount: 50 }, 1).graph;
  assert.equal(courtRelation(noTriangle, A, B).hate, 0);
  g = setRomancePair(setRomancePair(graph(), A, C, true, 1), B, D, true, 1);
  assert.equal(courtRelation(seasonalRomanceJealousy(g, 2), A, B).hate, 0);
});

test('seasonal jealousy deduplicates rivals with multiple shared lovers and ignores nonliving lovers', () => {
  let g = graph();
  for (const shared of [C, D]) for (const rival of [A, B]) g = setRomancePair(g, rival, shared, true, 1);
  const next = seasonalRomanceJealousy(g, 2);
  assert.equal(courtRelation(next, A, B).hate, 10, 'one rivalry gains10 per season rather than per shared lover');
  assert.equal(courtRelation(next, B, A).hate, 10);
  g = updateCourtNode(updateCourtNode(g, C, { status: 'deceased' }), D, { status: 'expelled' });
  assert.equal(courtRelation(seasonalRomanceJealousy(g, 2), A, B).hate, 0);
});

test('Concubine witness risk is local, unpledged and faction-independent with exact threshold reporting', () => {
  const witnesses = [
    { name: A, pledged: false, suspicion: .6, suspicionThreshold: .7, zone: 'ladies' },
    { name: B, pledged: false, suspicion: 0, suspicionThreshold: .7, zone: 'ladies' },
    { name: C, pledged: true, suspicion: .6, suspicionThreshold: .7, zone: 'ladies' },
    { name: D, pledged: false, suspicion: .6, suspicionThreshold: .7, zone: 'library' },
  ];
  const before = structuredClone(witnesses), result = romanceWitnessRisk('concubine', 'ladies', witnesses);
  assert.deepEqual(result.map(w => w.name), [A, B]);
  assert.deepEqual(result.map(w => w.delta), [.1, .1]);
  assert.deepEqual(result.map(w => w.reports), [true, false]);
  for (const role of ['prince', 'minister', null]) assert.deepEqual(romanceWitnessRisk(role, 'ladies', witnesses), []);
  assert.deepEqual(witnesses, before);
});

test('graph1 migration preserves political values and revision, maps directed legacy love to affection and creates no romance', () => {
  const old: any = graph(); old.version = 1; old.revision = 74;
  old.edges = { [A]: { [PLAYER_NODE]: { support: 36.25, hate: 48, pledge: null } }, [B]: { [A]: { support: 0, hate: 22, pledge: { formedSeason: 1, source: 'explicit' } } } };
  const before = structuredClone(old), result = migrateGraphRomance(old, { [A]: .57, [B]: 1 });
  assert.equal(result.version, 2); assert.equal(result.revision, 74); assert.equal(result.seed, old.seed);
  assert.deepEqual(result.nodes, old.nodes);
  assert.ok(Math.abs(courtRelation(result, A, PLAYER_NODE).affection - 57) < 1e-9);
  assert.equal(courtRelation(result, B, A).affection, 0);
  assert.equal(courtRelation(result, A, PLAYER_NODE).romance, null);
  assert.equal(courtRelation(result, B, A).romance, null);
  assert.deepEqual(politics(result), politics(old));
  assert.deepEqual(old, before);
  assertCourtGraph(result, Object.keys(result.nodes), 1);
});

test('graph2 validation rejects malformed affection and asymmetric or future accepted romances', () => {
  const g = setRomancePair(affection(graph(), A, B, 60), A, B, true, 1);
  assertCourtGraph(g, Object.keys(g.nodes), 1);
  for (const badValue of [-.01, 100.01, NaN, Infinity, '60', null, undefined]) {
    const bad: any = structuredClone(g); bad.edges[A][B].affection = badValue;
    assert.throws(() => assertCourtGraph(bad, Object.keys(g.nodes), 1), /affection/);
  }
  for (const mutate of [
    (bad: CourtGraph) => { bad.edges[B][A].romance = null; },
    (bad: CourtGraph) => { bad.edges[B][A].romance!.formedSeason = 2; },
    (bad: CourtGraph) => { bad.edges[A][B].romance!.formedSeason = 0; },
  ]) {
    const bad = structuredClone(g); mutate(bad);
    assert.throws(() => assertCourtGraph(bad, Object.keys(g.nodes), 1), /romance/);
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createActor } from 'xstate';
import { initialCharacters } from '../src/data/characters';
import { campaignRandom } from '../src/lib/campaignRandom';
import { careerZoneAccess } from '../src/lib/careerAccess';
import { gameMachine } from '../src/state-machines/game-machine';
import { createPalaceWorld } from '../src/palace/world';
import { createPalaceNavigator } from '../src/palace/navigation';
import { PLAYABLE_ZONES, scheduledNpcZone, zoneRoster, type PlayableZone } from '../src/palace/zones';

const phases = [0, .25, .5, .75];
const maids = initialCharacters.filter(person => person.name.startsWith('Maid'));
const eunuchs = initialCharacters.filter(person => person.name.startsWith('Eunuch'));
const innerPalaces: PlayableZone[] = ['ladies', 'empress', 'dowager'];
const counts = () => Object.fromEntries(PLAYABLE_ZONES.map(zone => [zone, 0])) as Record<PlayableZone, number>;

test('every maid has equal Ladies, Empress and Dowager weight, including the original four', () => {
  assert.equal(maids.length, 8);
  for (const person of maids) {
    const visits = counts();
    for (let season = 1; season <= 3; season++) for (const phase of phases) visits[scheduledNpcZone(person.name, season, phase)]++;
    assert.deepEqual(visits, {library: 0, emperor: 0, empress: 4, ladies: 4, dowager: 4}, person.name);
  }
});

test('every eunuch keeps equal inner-palace weight and still visits Library and Emperor', () => {
  assert.equal(eunuchs.length, 8);
  for (const person of eunuchs) {
    const visits = counts();
    for (let season = 1; season <= 5; season++) for (const phase of phases) visits[scheduledNpcZone(person.name, season, phase)]++;
    assert.deepEqual(visits, {library: 4, emperor: 4, empress: 4, ladies: 4, dowager: 4}, person.name);
  }
});

test('all ordinary, legacy Grand and Crown Princes can visit both royal women’s palaces', () => {
  for (const name of ['Prince Feng', 'Prince Han', 'Prince Jun', 'Prince Lei', 'Grand Prince Han', 'Crown Prince']) {
    const visited = new Set<PlayableZone>();
    for (let season = 1; season <= 12; season++) for (const phase of phases) {
      const zone = scheduledNpcZone(name, season, phase);
      visited.add(zone);
      const rank = name === 'Crown Prince' ? 'crown_prince' : name.startsWith('Grand') ? 'grand_prince' : null;
      assert.ok(careerZoneAccess('prince', rank, zone).allowed, `${name}: ${zone}`);
      if (name !== 'Crown Prince') assert.notEqual(zone, 'ladies');
    }
    assert.ok(visited.has('empress'), name);
    assert.ok(visited.has('dowager'), name);
    assert.ok(visited.has('library'), name);
  }
  assert.equal(scheduledNpcZone('Crown Prince', 1, .5), 'ladies');
  assert.equal(scheduledNpcZone('Emperor', 1, .5), 'ladies');
});

test('ordinary princes retain their usual Empress audience while sharing both other destinations', () => {
  for (const name of ['Prince Feng', 'Prince Han', 'Prince Jun', 'Prince Lei']) {
    const visits = counts();
    for (let season = 1; season <= 8; season++) for (const phase of phases) visits[scheduledNpcZone(name, season, phase)]++;
    assert.deepEqual(visits, {library: 4, emperor: 0, empress: 24, ladies: 0, dowager: 4}, name);
  }
});

test('seeded placement sampling is balanced without enforcing room headcounts or using global RNG', t => {
  const random = campaignRandom(0x51ced123);
  t.mock.method(Math, 'random', () => { throw new Error('Schedules must not reroll campaign or global randomness'); });
  for (const group of [maids, eunuchs]) {
    const visits = counts();
    for (let i = 0; i < 48000; i++) {
      const person = group[Math.floor(random.next() * group.length)];
      const season = 1 + Math.floor(random.next() * 300);
      const progress = random.next();
      const zone = scheduledNpcZone(person.name, season, progress);
      assert.equal(scheduledNpcZone(person.name, season, progress), zone);
      visits[zone]++;
    }
    const expected = 48000 / (group === maids ? 3 : 5);
    for (const zone of innerPalaces) assert.ok(Math.abs(visits[zone] - expected) < expected * .035, `${group === maids ? 'maid' : 'eunuch'} ${zone}: ${visits[zone]}`);
  }
  const sameDestination = maids.filter(person => scheduledNpcZone(person.name, 1, 0) === 'empress');
  assert.ok(sameDestination.length > 1);
  assert.equal(zoneRoster(sameDestination, 'empress', 1, 0).length, sameDestination.length);
  assert.equal(zoneRoster(sameDestination, 'ladies', 1, 0).length, 0, 'No quota duplicates or relocates selected people to fill a room');
});

test('real seeded seasonal rosters partition without losing actors, with empty and uneven rooms still possible', t => {
  t.mock.method(console, 'log', () => {});
  let seed = 1;
  t.mock.method(Math, 'random', () => seed / 4294967296);
  const machine = gameMachine.provide({guards: {emperor_encountered: () => false}});
  let emptyInnerRooms = 0, unequalInnerRooms = 0, periods = 0;
  for (const role of ['prince', 'minister', 'concubine'] as const) for (seed = 1; seed <= 24; seed++) {
    const game = createActor(machine).start();
    try {
      game.send({type: 'CHOOSE_CHARACTER', payload: {type: role}});
      game.send({type: 'INITIALIZE_GAME'});
      for (let season = 1; season <= 6; season++) {
        const context = game.getSnapshot().context;
        assert.equal(context.season, season);
        const people = initialCharacters.filter(person => context.activeCharacterNames.includes(person.name) && context.characters[person.name]);
        assert.ok(people.length >= 12 && people.length <= 16);
        for (const progress of phases) {
          const rosters = PLAYABLE_ZONES.map(zone => zoneRoster(people, zone, season, progress, role));
          const all = rosters.flat();
          assert.equal(all.length, people.length);
          assert.equal(new Set(all.map(person => person.name)).size, people.length);
          for (const person of all) assert.ok(people.includes(person), 'Preserve object identity');
          for (const zone of innerPalaces) if (!zoneRoster(people, zone, season, progress).length) emptyInnerRooms++;
          if (new Set(innerPalaces.map(zone => zoneRoster(people, zone, season, progress).length)).size > 1) unequalInnerRooms++;
          periods++;
        }
        game.send({type: 'NEXT_SEASON'});
      }
    } finally { game.stop(); }
  }
  assert.ok(emptyInnerRooms > 0, 'Equal placement weight does not guarantee occupancy for a sampled cast');
  assert.ok(unequalInnerRooms > periods / 2, 'Do not force equal headcounts');
});

test('world creation instantiates every scheduled royal-palace visitor at a reachable position', () => {
  for (const season of [1, 2]) for (const zone of ['empress', 'dowager'] as const) {
    const people = zoneRoster(initialCharacters, zone, season, .25);
    const world = createPalaceWorld(people, 'prince', true, zone);
    try {
      assert.deepEqual(world.npcs.map(person => person.name).sort(), people.map(person => person.name).sort());
      const navigator = createPalaceNavigator(world.colliders, world.bounds);
      for (const person of world.npcs) {
        assert.ok(navigator.find(world.spawn, person).length, `${zone}/${person.name} reachable`);
        assert.ok(!world.colliders.some(c => Math.abs(person.x - c.x) < c.w / 2 + .36 && Math.abs(person.z - c.z) < c.d / 2 + .36), `${zone}/${person.name} outside obstacles`);
      }
    } finally { world.dispose(); }
  }
  const empty = createPalaceWorld([], 'prince', true, 'empress');
  assert.equal(empty.npcs.length, 0);
  empty.dispose();
});

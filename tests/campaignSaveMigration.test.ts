import test, { beforeEach, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createActor } from 'xstate';
import { gameMachine } from '../src/state-machines/game-machine';
import { courtInfluenceCap, courtOffice } from '../src/lib/courtHierarchy';
import { assignCharacterFaction } from '../src/lib/factionSystem';
import { CampaignSaveStore, SAVE_KEY, PREVIOUS_SAVE_KEY, SAVE_VERSION, createCampaignPresentation, parseCampaignSave, campaignActorOptions } from '../src/persistence/campaignSave';

beforeEach(t => { t.mock.method(console, 'log', () => {}); t.mock.method(Math, 'random', () => .424242); Object.defineProperty(globalThis, 'alert', { configurable: true, value: () => {} }); });
function legacy(t: TestContext, version: 1 | 2 = 2) {
  const game = createActor(gameMachine).start();
  game.send({type:'CHOOSE_CHARACTER',payload:{type:'prince'}}); game.send({type:'INITIALIZE_GAME'}); t.after(() => game.stop());
  const save: any = { format:'harem-empire', version, savedAt:'2026-10-01T18:00:00.000Z', snapshot: JSON.parse(JSON.stringify(game.getPersistedSnapshot())), presentation:createCampaignPresentation('prince') };
  if (version === 1) { delete save.presentation.exploring; delete save.presentation.clock.expired; }
  return {game,save};
}
function person(save: any, name: string) { return save.snapshot.children[save.snapshot.context.characters[name].id].snapshot.context; }
function exceptApprovedMechanics(snapshot: any) {
  const copy = JSON.parse(JSON.stringify(snapshot)); delete copy.context.factionSystem; delete copy.context.relationshipGraph; delete copy.context.graphAppliedCommands;
  for (const ref of Object.values(copy.context.characters) as any[]) {
    const c = copy.children[ref.id].snapshot.context; delete c.personalityVectors.influence;
    for (const key of ['trustInPlayer','loyaltyToPlayer','dependenceOnPlayer']) delete c.relationshipVectors[key];
  }
  return copy;
}

for (const version of [1,2] as const) test(`v${version} normalizes all 48 NPCs to four office caps without changing player influence, earned state or RNG`, t => {
  const {save} = legacy(t, version);
  for (const name of Object.keys(save.snapshot.context.characters)) person(save,name).personalityVectors.influence = .99;
  save.snapshot.context.playerPersonality.influence = .98;
  const before = JSON.parse(JSON.stringify(save)), result = parseCampaignSave(JSON.stringify(save));
  assert.equal(result.migrated, true); assert.equal(result.save.version, SAVE_VERSION);
  const actual: any = result.save;
  const covered = new Set<number>();
  for (const name of Object.keys(actual.snapshot.context.characters)) {
    const after = person(actual,name), tier = courtOffice(after)!.tier; covered.add(tier);
    assert.equal(after.personalityVectors.influence, [.1,.4,.7,.9][tier-1], name);
    assert.ok(actual.snapshot.context.factionSystem.factions[assignCharacterFaction(after)].includes(name));
  }
  assert.deepEqual([...covered].sort(), [1,2,3,4]);
  assert.deepEqual(exceptApprovedMechanics(actual.snapshot), exceptApprovedMechanics(before.snapshot));
  assert.equal(actual.snapshot.context.playerPersonality.influence, .98, 'player is not a courtier and is not capped');
  assert.equal(actual.snapshot.context.rngState, before.snapshot.context.rngState);
  assert.equal(save.version, version, 'input fixture is not mutated');
  const restored = createActor(gameMachine,campaignActorOptions(result.save)).start(); t.after(() => restored.stop());
  assert.equal(Object.keys(restored.getSnapshot().context.characters).length,48);
  assert.equal(restored.getSnapshot().context.playerPersonality.influence,.98);
});

test('below-cap influence remains exact; schema3 round trips without a second migration', t => {
  const {save} = legacy(t);
  for (const name of Object.keys(save.snapshot.context.characters)) person(save,name).personalityVectors.influence = courtInfluenceCap(person(save,name))/2;
  const upgraded = parseCampaignSave(JSON.stringify(save));
  for (const name of Object.keys(save.snapshot.context.characters)) assert.equal(person(upgraded.save,name).personalityVectors.influence,person(save,name).personalityVectors.influence);
  const second = parseCampaignSave(JSON.stringify(upgraded.save));
  assert.equal(second.migrated,false); assert.deepEqual(second.save,upgraded.save);
});

test('pledged inactive low-tier allies keep binding Imperial overrides and continue to qualify for an offer', t => {
  const {save} = legacy(t), names = ['Maid Ling','Maid Su','Maid Bai'];
  for (const name of names) {
    const c = person(save,name), child = save.snapshot.children[save.snapshot.context.characters[name].id];
    c.personalityVectors = {...c.personalityVectors,influence:.95,ambition:.8,loyalty:.2};
    c.supportLevel = 100; c.hasGivenSupport = true; c.hasGivenAllegiance = true; c.factionOverride = 'Imperial';
    c.relationshipVectors = {trustInPlayer:.73,loyaltyToPlayer:.65,dependenceOnPlayer:.83,fearOfPlayer:.33,loveForPlayer:.54}; child.snapshot.value = 'inactive';
  }
  save.snapshot.context.activeCharacterNames = save.snapshot.context.activeCharacterNames.filter((name:string) => !names.includes(name));
  save.snapshot.context.presentCharacterNames = [];
  save.snapshot.context.factionSystem.factions.Rebel = [...names];
  save.snapshot.context.factionSystem.membershipOffers = [{faction:'Rebel',requiredMembers:3,supportThreshold:55}];
  const upgraded: any = parseCampaignSave(JSON.stringify(save)).save;
  for (const name of names) {
    const after = person(upgraded,name);
    assert.equal(after.personalityVectors.influence,.1); assert.equal(after.factionOverride,'Imperial');
    assert.equal(after.hasGivenAllegiance,true); assert.equal(after.supportLevel,100);
    assert.deepEqual(after.relationshipVectors,{fearOfPlayer:.33,loveForPlayer:.54});
    assert.equal(upgraded.snapshot.children[upgraded.snapshot.context.characters[name].id].snapshot.value,'inactive');
    assert.ok(upgraded.snapshot.context.factionSystem.factions.Imperial.includes(name));
    assert.ok(!upgraded.snapshot.context.factionSystem.factions.Rebel.includes(name));
  }
  assert.deepEqual(upgraded.snapshot.context.factionSystem.membershipOffers,[{faction:'Imperial',requiredMembers:3,supportThreshold:60}]);
});

test('formerly Imperial unpledged tier2 backers lose obsolete offers after their actual influence falls below .5', t => {
  const {save} = legacy(t);
  const names = Object.keys(save.snapshot.context.characters).filter(name => courtOffice(person(save,name))!.tier === 2).slice(0,3);
  for (const name of names) {
    const c = person(save,name); c.supportLevel = 70; c.hasGivenSupport = true; c.factionOverride = 'Imperial';
    c.personalityVectors = {...c.personalityVectors,influence:.8,loyalty:.8,fear:.2,ambition:.2};
  }
  save.snapshot.context.factionSystem.factions.Imperial = names;
  save.snapshot.context.factionSystem.membershipOffers = [{faction:'Imperial',requiredMembers:3,supportThreshold:55}];
  const upgraded: any = parseCampaignSave(JSON.stringify(save)).save;
  for (const name of names) {
    assert.equal(person(upgraded,name).personalityVectors.influence,.4);
    assert.ok(upgraded.snapshot.context.factionSystem.factions.Independent.includes(name));
  }
  assert.deepEqual(upgraded.snapshot.context.factionSystem.membershipOffers,[]);
  assert.deepEqual(exceptApprovedMechanics(upgraded.snapshot),exceptApprovedMechanics(save.snapshot));
});

test('joined faction membership and displaced-courtier history stay intact while expelled actors never rejoin derived lists', t => {
  const {save} = legacy(t), name = 'Crown Prince', ref = save.snapshot.context.characters[name];
  delete save.snapshot.children[ref.id]; delete save.snapshot.context.characters[name];
  save.snapshot.context.activeCharacterNames = save.snapshot.context.activeCharacterNames.filter((n:string) => n !== name);
  save.snapshot.context.presentCharacterNames = [];
  save.snapshot.context.expelledCourtiers[name] = {name,season:1,byRank:'crown_prince',faction:'Imperial',pledged:true};
  save.snapshot.context.displacedOffices = [name]; save.snapshot.context.rank = 'crown_prince';
  save.snapshot.context.factionSystem.playerFaction = 'Loyalist';
  save.snapshot.context.factionSystem.factions.Imperial = [name];
  save.snapshot.context.factionSystem.membershipOffers = [{faction:'Imperial',requiredMembers:3,supportThreshold:55}];
  const upgraded: any = parseCampaignSave(JSON.stringify(save)).save;
  assert.equal(upgraded.snapshot.context.factionSystem.playerFaction,'Loyalist');
  assert.deepEqual(upgraded.snapshot.context.factionSystem.membershipOffers,[]);
  assert.deepEqual(upgraded.snapshot.context.expelledCourtiers,save.snapshot.context.expelledCourtiers);
  assert.deepEqual(upgraded.snapshot.context.displacedOffices,[name]);
  assert.equal(upgraded.snapshot.context.characters[name],undefined);
  assert.ok(Object.values(upgraded.snapshot.context.factionSystem.factions).every((list:any) => !list.includes(name)));
});

test('negative, greater-than-one, missing, string, null and nonfinite legacy influence is rejected before clamping', t => {
  const {save} = legacy(t);
  for (const value of [-.01,1.01,'0.8',null,undefined,NaN,Infinity]) {
    const bad = JSON.parse(JSON.stringify(save)); person(bad,'Maid Ling').personalityVectors.influence = value;
    assert.throws(() => parseCampaignSave(JSON.stringify(bad)), /relationship values/);
  }
  const invalidSupport = JSON.parse(JSON.stringify(save)); person(invalidSupport,'Maid Ling').supportLevel = -1;
  assert.throws(() => parseCampaignSave(JSON.stringify(invalidSupport)), /courtier data/);
});

test('schema3 above-cap NPC values are rejected instead of being silently normalized', t => {
  const {save} = legacy(t), current: any = parseCampaignSave(JSON.stringify(save)).save;
  for (const name of ['Maid Ling','Scholar Qin','Prince Feng','Crown Prince']) {
    const bad = JSON.parse(JSON.stringify(current)); person(bad,name).personalityVectors.influence = courtInfluenceCap(person(bad,name)) + .01;
    assert.throws(() => parseCampaignSave(JSON.stringify(bad)), /office limit/);
  }
});

test('stored v2 current and backup campaigns migrate without tripping exact-value stale-writer protection', t => {
  const {save,game} = legacy(t), data = new Map([[SAVE_KEY,JSON.stringify(save)],[PREVIOUS_SAVE_KEY,JSON.stringify(save)]]);
  person(save,'Maid Ling').personalityVectors.influence = .8; data.set(SAVE_KEY,JSON.stringify(save));
  const store = new CampaignSaveStore({getItem:key=>data.get(key)??null,setItem:(key,value)=>{data.set(key,value);},removeItem:key=>{data.delete(key);}});
  const loaded = store.load(); assert.ok(loaded.save); assert.equal(loaded.save.version,SAVE_VERSION);
  assert.match(loaded.message,/current court rules/);
  assert.equal(person(loaded.save,'Maid Ling').personalityVectors.influence,.1);
  const restored = createActor(gameMachine,campaignActorOptions(loaded.save)).start(); t.after(() => restored.stop());
  assert.equal(store.save(restored,loaded.save.presentation),true); assert.equal(JSON.parse(data.get(SAVE_KEY)!).version,SAVE_VERSION);
  assert.equal(store.getStatus().problem,false);
  assert.equal(store.recoverPrevious()!.version,SAVE_VERSION); assert.equal(game.getSnapshot().context.season,1);
});

test('v1 defaults apply only to absent fields; malformed presentation and faction data are rejected before migration', t => {
  const {save} = legacy(t,1);
  for (const corrupt of [
    (data:any) => { data.presentation.exploring = null; },
    (data:any) => { data.presentation.clock.expired = null; },
    (data:any) => { data.snapshot.context.factionSystem.playerFaction = 'Unknown'; },
    (data:any) => { data.snapshot.context.factionSystem.factions.Imperial = ['Unknown courtier']; },
  ]) { const bad = JSON.parse(JSON.stringify(save)); corrupt(bad); assert.throws(() => parseCampaignSave(JSON.stringify(bad))); }
});

test('user-approved mechanics migration removes retired personal meters in v1, v2 and current schema3 while retaining meaningful values', t => {
  const {save} = legacy(t);
  const base: any = parseCampaignSave(JSON.stringify(save)).save;
  for (const version of [1,2,3]) {
    const input = JSON.parse(JSON.stringify(base)); input.version = version;
    for (const name of Object.keys(input.snapshot.context.characters)) {
      const c = person(input,name);
      c.relationshipVectors = {trustInPlayer:.93,loyaltyToPlayer:.78,dependenceOnPlayer:.64,fearOfPlayer:.42,loveForPlayer:.57};
    }
    const result: any = parseCampaignSave(JSON.stringify(input)).save;
    for (const name of Object.keys(input.snapshot.context.characters)) {
      assert.deepEqual(person(result,name).relationshipVectors,{fearOfPlayer:.42,loveForPlayer:.57});
    }
    assert.deepEqual(exceptApprovedMechanics(result.snapshot),exceptApprovedMechanics(input.snapshot));
    assert.equal(result.snapshot.context.rngState,input.snapshot.context.rngState);
    assert.deepEqual(result.snapshot.context.playerPersonality,input.snapshot.context.playerPersonality);
    assert.deepEqual(result.snapshot.context.playerReputation,input.snapshot.context.playerReputation);
  }
});

test('current schema may omit retired compatibility fields, but still rejects malformed meaningful meters', t => {
  const {save} = legacy(t), current: any = parseCampaignSave(JSON.stringify(save)).save;
  const c = person(current,'Maid Ling');
  for (const key of ['trustInPlayer','loyaltyToPlayer','dependenceOnPlayer']) delete c.relationshipVectors[key];
  const loaded: any = parseCampaignSave(JSON.stringify(current)).save;
  assert.equal(person(loaded,'Maid Ling').relationshipVectors.trustInPlayer,undefined);
  c.relationshipVectors.fearOfPlayer = -1;
  assert.throws(() => parseCampaignSave(JSON.stringify(current)),/relationship values/);
});

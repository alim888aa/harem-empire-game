import {CAMPAIGN_BALANCE as B,giftPositiveScale} from '../src/lib/campaignBalance';
import assert from 'node:assert/strict';
import test, { beforeEach, type TestContext } from 'node:test';
import { createActor, fromPromise, waitFor } from 'xstate';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ActionButtons from '../src/components/ActionButtons.tsx';
import { processGiftWithMessage } from '../src/lib/checkMessage.ts';
import { giftMessage, GIFT_MESSAGES } from '../src/lib/giftMessages.ts';
import { previewMessage } from '../src/lib/courtStrategy.ts';
import { courtRelation, PLAYER_NODE } from '../src/lib/courtGraph.ts';
import { captureCampaign, createCampaignPresentation, parseCampaignSave, campaignActorOptions } from '../src/persistence/campaignSave.ts';

const previousRandom = Math.random;
Math.random = () => .5;
const { gameMachine } = await import('../src/state-machines/game-machine.ts');
Math.random = previousRandom;

beforeEach(t => {
  t.mock.method(Math, 'random', () => .99);
  t.mock.method(console, 'log', () => {});
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'alert');
  Object.defineProperty(globalThis, 'alert', { configurable: true, value: () => {} });
  t.after(() => prior ? Object.defineProperty(globalThis, 'alert', prior) : Reflect.deleteProperty(globalThis, 'alert'));
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('No network in gift tests'); });
  t.after(() => assert.equal(network.mock.callCount(), 0));
});

function start(t: TestContext, machine = gameMachine, origin: 'prince' | 'minister' | 'concubine' = 'concubine') {
  const errors: unknown[] = [];
  const game = createActor(machine);
  game.subscribe({ error: error => errors.push(error) });
  game.start();
  game.send({ type: 'CHOOSE_CHARACTER', payload: { type: origin } });
  game.send({ type: 'INITIALIZE_GAME' });
  t.after(() => { game.stop(); assert.deepEqual(errors, []); });
  const context = game.getSnapshot().context;
  const name = context.activeCharacterNames.find(name => context.characters[name].getSnapshot().context.type === 'minor')
    ?? context.activeCharacterNames.find(name => context.characters[name].getSnapshot().context.type === 'side')!;
  return { game, name, target: context.characters[name] };
}

function delayedEvaluation() {
  let release!: () => void, calls = 0;
  const held = new Promise<void>(resolve => { release = resolve; });
  const machine = gameMachine.provide({ actors: {
    evaluateGift: fromPromise(async ({ input }) => {
      calls++;
      await held;
      return processGiftWithMessage(input.messageType, input.character.personalityVectors, input.character.relationshipVectors,
        input.playerType, input.playerStats, input.character.supportLevel,{positiveEffectScale:giftPositiveScale(input.character,input.playerStats.influence)});
    }),
  } });
  return { machine, release, calls: () => calls };
}

const submit = (game: ReturnType<typeof start>['game'], name: string, requestId: string, messageType = 'neutral') =>
  game.send({ type: 'GIVE_GIFT_WITH_MESSAGE', characterId: name, requestId, messageType } as any);
const settle = (game: ReturnType<typeof start>['game']) => waitFor(game, state => !state.context.pendingGift, { timeout: 2000 });

test('catalog exposes exactly four nonblank authored messages; blank/unknown choices cannot resolve', () => {
  assert.deepEqual(GIFT_MESSAGES.map(message => message.type), ['ambitious', 'loyal', 'cautious', 'neutral']);
  for (const message of GIFT_MESSAGES) assert.ok(giftMessage(message.type)?.text.trim());
  for (const choice of ['', ' ', 'romantic', '__proto__', undefined, null, {}]) assert.equal(giftMessage(choice), undefined);
});


test('malformed and removed gift events do not spend, evaluate, animate or change either actor', t => {
  const held = delayedEvaluation();
  const { game, name, target } = start(t, held.machine);
  const before = structuredClone(target.getSnapshot().context);
  for (const event of [
    { type: 'GIVE_GIFT_SIMPLE', characterId: name, characterType: 'minor' },
    { type: 'APPLY_SIMPLE_GIFT_EFFECTS', characterId: name },
    { type: 'APPLY_GIFT_MESSAGE_EFFECTS', characterId: name, messageType: 'neutral' },
    ...['', ' ', 'unknown', 'romantic', undefined].map(messageType => ({ type: 'GIVE_GIFT_WITH_MESSAGE', characterId: name, requestId: 'bad-choice', messageType })),
    ...['', ' ', undefined].map(requestId => ({ type: 'GIVE_GIFT_WITH_MESSAGE', characterId: name, requestId, messageType: 'neutral' })),
    { type: 'GIVE_GIFT_WITH_MESSAGE', characterId: 'Missing courtier', requestId: 'missing', messageType: 'neutral' },
  ]) game.send(event as any);
  for (const event of [
    { type: 'GIVE_GIFT_SIMPLE' },
    { type: 'GIVE_GIFT_WITH_MESSAGE', messageType: 'neutral' },
    { type: 'APPLY_EVALUATED_GIFT', requestId: 'raw-blank', sessionId: 1, messageType: '', result: {} },
    { type: 'APPLY_EVALUATED_GIFT', requestId: 'raw-unknown', sessionId: 1, messageType: 'unknown', result: {} },
    { type: 'APPLY_EVALUATED_GIFT', requestId: 'raw-invalid-result', sessionId: 1, messageType: 'neutral', result: { newSupportLevel: 100 } },
  ]) target.send(event as any);
  assert.equal(held.calls(), 0);
  assert.equal(game.getSnapshot().context.giftsRemaining, 20);
  assert.equal(game.getSnapshot().context.pendingGift, null);
  assert.equal(game.getSnapshot().context.lastGiftReceipt, null);
  assert.deepEqual(target.getSnapshot().context, before);
});

test('one pending transaction rejects duplicate/new submissions and stale acknowledgments; repeat later is intentional', async t => {
  const held = delayedEvaluation();
  const { game, name, target } = start(t, held.machine);
  const before = structuredClone(target.getSnapshot().context);
  submit(game, name, 'first');
  const pending = game.getSnapshot().context.pendingGift!;
  const reservedFunds = game.getSnapshot().context.giftsRemaining;
  assert.ok(pending);
  assert.equal(held.calls(), 1);
  assert.equal(game.getSnapshot().context.lastGiftReceipt, null);
  submit(game, name, 'first');
  submit(game, name, 'pending-new-id');
  const ack = { type: 'GIFT_APPLIED', requestId: 'first', sessionId: pending.sessionId, actorId: pending.actor.id, characterId: name, response: 'neutral' } as const;
  game.send(ack); // Matching IDs alone cannot complete an unevaluated gift.
  game.send({ type: 'FINALIZE_GIFT', requestId: 'first', sessionId: pending.sessionId });
  game.send({ type: 'NEXT_SEASON' });
  game.send({ type: 'SEASON_EXPIRED' });
  assert.equal(game.getSnapshot().context.season, 1);
  assert.equal(game.getSnapshot().context.giftsRemaining, reservedFunds);
  assert.equal(held.calls(), 1);
  assert.deepEqual(target.getSnapshot().context, before);
  held.release();
  await settle(game);
  assert.equal(game.getSnapshot().context.lastGiftReceipt?.sequence, 1);
  assert.equal(game.getSnapshot().context.lastGiftReceipt?.requestId, 'first');
  assert.equal(game.getSnapshot().context.giftsRemaining, reservedFunds);
  assert.equal(target.getSnapshot().context.processedGiftRequests.length, 1);
  const after = structuredClone(target.getSnapshot().context);
  game.send(ack);
  submit(game, name, 'first');
  assert.deepEqual(target.getSnapshot().context, after);
  assert.equal(game.getSnapshot().context.giftsRemaining, reservedFunds);
  assert.equal(game.getSnapshot().context.lastGiftReceipt?.sequence, 1);
  submit(game, name, 'second');
  await settle(game);
  assert.equal(held.calls(), 2);
  assert.equal(game.getSnapshot().context.lastGiftReceipt?.sequence, 2);
  assert.equal(game.getSnapshot().context.giftsRemaining, reservedFunds - pending.cost);
});

test('parent derives cost from the actor, validates access, and rejects inactive targets', async t => {
  const { game } = start(t, gameMachine, 'prince');
  const context = game.getSnapshot().context;
  const name = context.activeCharacterNames.find(name => context.characters[name].getSnapshot().context.type === 'major')!;
  assert.ok(name);
  game.send({ type: 'GIVE_GIFT_WITH_MESSAGE', characterId: name, characterType: 'minor', messageType: 'neutral', requestId: 'spoof-cost' } as any);
  await settle(game);
  assert.equal(game.getSnapshot().context.giftsRemaining, 25-20, 'caller cannot disguise a major as a1-cost maid');
  const before = context.characters[name].getSnapshot().context.supportLevel;
  submit(game, name, 'forbidden-tone', 'ambitious');
  assert.equal(game.getSnapshot().context.pendingGift, null, 'high-influence ambitious gate is enforced by parent');
  assert.equal(context.characters[name].getSnapshot().context.supportLevel, before);
  context.characters[name].send({ type: 'DEACTIVATE' });
  submit(game, name, 'inactive');
  assert.equal(game.getSnapshot().context.pendingGift, null);
  assert.equal(game.getSnapshot().context.giftsRemaining, 25-20);
  const low = start(t);
  const major = low.game.getSnapshot().context.activeCharacterNames.find(name => low.game.getSnapshot().context.characters[name].getSnapshot().context.type === 'major')!;
  low.game.send({type:'UPDATE_PALACE_PRESENCE',zone:'ladies',names:[]});
  submit(low.game, major, 'absent-from-allowed-zone');
  assert.equal(low.game.getSnapshot().context.pendingGift, null);
  assert.equal(low.game.getSnapshot().context.giftsRemaining, 20);
});

test('preview equals accepted receipt mutation; duplicate child commit is ignored', async t => {
  const { game, name, target } = start(t);
  const context = game.getSnapshot().context, before = target.getSnapshot().context;
  const preview = previewMessage({ ...before, type: before.type! }, 'neutral', 'concubine', context.playerPersonality);
  const result = processGiftWithMessage('neutral', before.personalityVectors, before.relationshipVectors, 'concubine', context.playerPersonality, before.supportLevel);
  submit(game, name, 'preview');
  await settle(game);
  const after = structuredClone(target.getSnapshot().context);
  assert.equal(after.supportLevel - before.supportLevel, preview.support);
  assert.equal('trustInPlayer' in after.relationshipVectors,false);
  target.send({ type: 'APPLY_EVALUATED_GIFT', requestId: 'preview', sessionId: context.giftSessionId, messageType: 'neutral', result });
  target.send({ type: 'APPLY_EVALUATED_GIFT', requestId: 'other-session', sessionId: context.giftSessionId + 1, messageType: 'neutral', result });
  assert.deepEqual(target.getSnapshot().context, after);
  assert.equal(game.getSnapshot().context.lastGiftReceipt?.sequence, 1);
});

for(const [support,message,expected] of [[0,'neutral',11],[10.31,'neutral',11],[99,'neutral',1],[99.62,'neutral',.38],[3,'ambitious',-3],[.38,'ambitious',-.38],[0,'ambitious',0]] as const){
 test(`rounded gift preview, receipt and graph agree from ${support} support for ${message}`,async t=>{
  const {game,name,target}=start(t,gameMachine,'prince');
  Object.assign(target.getSnapshot().context.personalityVectors,{influence:.05,loyalty:.8,ambition:.3,suspicion:0});
  // The graph reducer owns setup too, including pre-existing fractional support.
  target.send({type:'APPLY_FACTION_BONUS',supportBonus:support});
  game.getSnapshot().context.playerPersonality.influence=.15;
  const saved=captureCampaign(game,createCampaignPresentation('prince'))!;
  const restored=createActor(gameMachine,campaignActorOptions(parseCampaignSave(JSON.stringify(saved)).save)).start();t.after(()=>restored.stop());
  const before=restored.getSnapshot().context.characters[name].getSnapshot().context;
  const context=restored.getSnapshot().context;
  assert.equal(before.supportLevel,support,'loading keeps fractional legacy support');
  const otherEdges=Object.fromEntries(Object.entries(context.relationshipGraph!.edges).map(([from,edges])=>[from,Object.fromEntries(Object.entries(edges).filter(([to])=>from!==name||to!==PLAYER_NODE))]));
  const preview=previewMessage({...before,type:before.type!},message,'prince',context.playerPersonality);
  assert.equal(preview.support,expected);
  submit(restored,name,`round-${support}-${message}`,message);await settle(restored);
  const after=restored.getSnapshot().context,relation=courtRelation(after.relationshipGraph!,name,PLAYER_NODE);
  const actual=Math.round((relation.support-support)*100)/100;
  assert.equal(actual,expected);assert.equal(after.lastGiftReceipt?.supportDelta,preview.support);
  assert.equal(after.characters[name].getSnapshot().context.supportLevel,relation.support);
  assert.equal(relation.hate,message==='ambitious'?12:0,'full negative intent becomes hate even when support clips at zero');
  assert.deepEqual(Object.fromEntries(Object.entries(after.relationshipGraph!.edges).map(([from,edges])=>[from,Object.fromEntries(Object.entries(edges).filter(([to])=>from!==name||to!==PLAYER_NODE))])),otherEdges,'unrelated saved relationships are unchanged');
 });
}

test('a hostile positive gift rounded to zero grants no hidden support, hate, renewal or diplomacy influence',async t=>{
 const {game}=start(t);
 const context=game.getSnapshot().context;
 const name=context.activeCharacterNames.find(name=>context.characters[name].getSnapshot().context.type==='major')!;
 const target=context.characters[name];
 Object.assign(target.getSnapshot().context.personalityVectors,{influence:.9,suspicion:0});
 target.send({type:'APPLY_FACTION_BONUS',supportBonus:80});target.send({type:'GAIN_HATE',amount:80});
 Object.assign(game.getSnapshot().context,{standingRecovery:true,giftsRemaining:60});
 game.getSnapshot().context.playerPersonality.influence=0;
 const before=game.getSnapshot().context,supportPoints=before.supportPoints;
 const person=target.getSnapshot().context;
 assert.equal(giftPositiveScale(person,0)*B.messageSupport.concubine.neutral,.49500000000000005);
 assert.equal(previewMessage({...person,type:person.type!},'neutral','concubine',before.playerPersonality).support,0);
 for(const id of ['zero-first','zero-repeat']){
  submit(game,name,id);await settle(game);
  const after=game.getSnapshot().context,relation=courtRelation(after.relationshipGraph!,name,PLAYER_NODE);
  assert.equal(after.lastGiftReceipt?.supportDelta,0);assert.equal(after.lastGiftReceipt?.globalRenewal,0);
  assert.equal(relation.support,80);assert.equal(relation.hate,80);
  assert.equal(after.supportPoints,supportPoints);assert.equal(after.playerPersonality.influence,0);
  assert.equal(after.standingRenewals[name],undefined);
  assert.ok(!after.successfulDiplomacyThisSeason.includes(name),'zero is not successful diplomacy and cannot consume its later reward');
 }
 assert.equal(game.getSnapshot().context.giftsRemaining,20,'zero remains an honest paid gift, without a new minimum-gain rule');
 // A later genuinely positive gift to the same recipient keeps its normal chance.
 game.getSnapshot().context.playerPersonality.influence=.1;
 game.getSnapshot().context.standingRecovery=false;
 submit(game,name,'later-positive');await settle(game);
 const positive=game.getSnapshot().context;
 assert.equal(positive.lastGiftReceipt?.supportDelta,1);
 assert.ok(Math.abs(positive.playerPersonality.influence-.104)<1e-9);
 assert.ok(positive.successfulDiplomacyThisSeason.includes(name));
});

test('promotion waits until a pending gift transaction settles', async t => {
  const held=delayedEvaluation(); const {game,name,target}=start(t,held.machine,'prince');
  const c=game.getSnapshot().context; const major=c.characters['Crown Prince'];major.send({type:'ACTIVATE'});
  submit(game,name,'promotion-race');
  major.send({type:'APPLY_FACTION_BONUS',supportBonus:100,trustBonus:0});
  assert.equal(game.getSnapshot().context.rank,null);
  held.release();await settle(game);
  assert.equal(game.getSnapshot().context.rank,'grand_prince');
  assert.equal(game.getSnapshot().context.lastGiftReceipt?.requestId,'promotion-race');
  assert.equal(game.getSnapshot().context.characters['Crown Prince'],major);
  assert.equal(target.getSnapshot().context.processedGiftRequests.length,1);
});

test('evaluation failure and a target leaving before commit refund once without animation or reputation changes', async t => {
  const failing = gameMachine.provide({ actors: { evaluateGift: fromPromise(async () => { throw new Error('Controlled evaluator failure'); }) } });
  const first = start(t, failing);
  const reputation = structuredClone(first.game.getSnapshot().context.playerReputation);
  submit(first.game, first.name, 'failure');
  await settle(first.game);
  assert.equal(first.game.getSnapshot().context.giftsRemaining, 20);
  assert.equal(first.game.getSnapshot().context.lastGiftReceipt, null);
  assert.deepEqual(first.game.getSnapshot().context.playerReputation, reputation);
  assert.match(first.game.getSnapshot().context.giftError, /returned/);
  submit(first.game, first.name, 'failure');
  assert.equal(first.game.getSnapshot().context.pendingGift, null);
  const held = delayedEvaluation(), second = start(t, held.machine);
  submit(second.game, second.name, 'departed');
  second.target.send({ type: 'DEACTIVATE' });
  held.release();
  await settle(second.game);
  assert.equal(second.game.getSnapshot().context.giftsRemaining, 20);
  assert.equal(second.game.getSnapshot().context.lastGiftReceipt, null);
  assert.equal(second.target.getSnapshot().context.supportLevel, 0);
});

test('stale completion after restart cannot spend or animate in a new session', async t => {
  const held = delayedEvaluation();
  const { game, name } = start(t, held.machine);
  submit(game, name, 'old-request');
  const old = game.getSnapshot().context.pendingGift!;
  game.getSnapshot().context.characters[name].send({type:'APPLY_SUSPICION_CHANGE',suspicionChange:1});
  assert.equal(game.getSnapshot().value, 'game_over');
  game.send({ type: 'RESTART_GAME' });
  game.send({ type: 'CHOOSE_CHARACTER', payload: { type: 'concubine' } });
  game.send({ type: 'INITIALIZE_GAME' });
  assert.equal(game.getSnapshot().context.giftSessionId, old.sessionId + 1);
  game.send({ type: 'GIFT_APPLIED', requestId: old.requestId, sessionId: old.sessionId, actorId: old.actor.id, characterId: old.characterId, response: 'neutral' });
  game.send({ type: 'FINALIZE_GIFT', requestId: old.requestId, sessionId: old.sessionId });
  held.release();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(game.getSnapshot().context.giftsRemaining, 20);
  assert.equal(game.getSnapshot().context.pendingGift, null);
  assert.equal(game.getSnapshot().context.lastGiftReceipt, null);
  assert.deepEqual(game.getSnapshot().value, { playing: 'in_season' });
});


test('shared2D/3D gift form starts blank and disabled, exposes only authored messages, and disables pending controls', t => {
  const {game,target}=start(t);
  const data=target.getSnapshot().context;
  const props={graph:game.getSnapshot().context.relationshipGraph,zone:"ladies",witnesses:[],onRomanticGift:()=>{},character:{...data,type:data.type!},gifts:15,playerStats:game.getSnapshot().context.playerPersonality,playerType:'concubine' as const,onAction:()=>{}};
  const markup=renderToStaticMarkup(createElement(ActionButtons,props));
  assert.match(markup,/Choose your message/);
  assert.match(markup,/value="romantic"/);
  assert.match(markup,/Choose a message/);
  assert.doesNotMatch(markup,/A gift, no words|value="simple"/);
  for(const message of GIFT_MESSAGES)assert.ok(markup.includes(message.title));
  assert.match(markup,/<button[^>]+class="send-gift"[^>]+disabled=""/);
  const pending=renderToStaticMarkup(createElement(ActionButtons,{...props,pending:true}));
  assert.match(pending,/<select[^>]+disabled=""/);
  assert.match(pending,/Evaluating message/);
});

test('malformed evaluation result is refunded rather than leaving a stuck pending transaction', async t => {
  const malformed=gameMachine.provide({actors:{evaluateGift:fromPromise(async()=>({newSupportLevel:100} as any))}});
  const {game,name,target}=start(t,malformed);
  submit(game,name,'malformed-evaluation');
  await settle(game);
  assert.equal(game.getSnapshot().context.giftsRemaining,20);
  assert.equal(target.getSnapshot().context.supportLevel,0);
  assert.equal(game.getSnapshot().context.lastGiftReceipt,null);
  assert.match(game.getSnapshot().context.giftError,/returned/);
});

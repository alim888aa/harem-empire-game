import {giftPositiveScale} from '../src/lib/campaignBalance';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatRank,
  giftCost,
  previewMessage,
  signed,
  supportReward,
} from '../src/lib/courtStrategy.ts';
import type { MessageChoice } from '../src/lib/courtStrategy.ts';
import { careerZoneAccess, resolveCareer, careerEntryZone } from '../src/lib/careerAccess.ts';
import { getInfluenceGating } from '../src/lib/influenceGating.ts';
import { processGiftWithMessage } from '../src/lib/checkMessage.ts';
import type { Character } from '../src/types/character.ts';
import type { PlayerStats, PlayerType } from '../src/types/game.ts';

// Uses Node's built-in test runner. With tsx installed, run:
// node --import tsx --test tests/courtStrategy.test.ts
// Checks shared preview/production rules, cumulative support and existing suspicion behavior.

const origins: PlayerType[] = ['prince', 'minister', 'concubine'];
const choices: MessageChoice[] = ['ambitious', 'loyal', 'cautious', 'neutral'];
const playerStats: PlayerStats = {
  influence: 0.6,
  ambition: 0.6,
  loyalty: 0.8,
  fear: 0.2,
  charisma: 0.4,
};

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    name: 'Test Courtier',
    type: 'side',
    supportLevel: 20,
    suspicion: 0.2,
    personalityVectors: {
      trust: 0.5,
      fear: 0.3,
      ambition: 0.4,
      loyalty: 0.8,
      influence: 0.5,
      romantic: 0.2,
      suspicion: 0.2,
    },
    relationshipVectors: {
      trustInPlayer: 0.3,
      loyaltyToPlayer: 0.2,
      fearOfPlayer: 0.1,
      dependenceOnPlayer: 0.1,
      loveForPlayer: 0,
    },
    lastResponse: '',
    imgPath: '/test-courtier.png',
    suspicionThreshold: 0.7,
    hasGivenGifts: false,
    giftCooldownUntil: 0,
    ...overrides,
  };
}

test('gift costs match the state-machine guard and deductions', () => {
  assert.equal(giftCost({name:'Crown Prince',type:'major'}), 20);
  assert.equal(giftCost({name:'Prince Feng',type:'side'}), 10);
  assert.equal(giftCost({name:'Maid Ling',type:'minor'}), 1);
});

test('support rewards match each support and allegiance milestone', () => {
  assert.equal(supportReward({name:'Crown Prince',type:'major'}), 50);
  assert.equal(supportReward({name:'Prince Feng',type:'side'}), 20);
  assert.equal(supportReward({name:'Maid Ling',type:'minor'}), 2);
});

test('rank labels expand and capitalize all three promotion ranks', () => {
  assert.equal(formatRank('crown_prince'), 'Crown Prince');
  assert.equal(formatRank('prime_minister'), 'Prime Minister');
  assert.equal(formatRank('empress_consort'), 'Empress Consort');
  assert.equal(formatRank('prince'), 'Prince');
  assert.equal(formatRank(''), '');
});

test('signed labels distinguish gains, losses, and zero', () => {
  assert.equal(signed(15), '+15');
  assert.equal(signed(-15), '-15');
  assert.equal(signed(0), '0');
  assert.equal(signed(-0), '0');
});

const personalities = [
  { label: 'ambitious ally', ambition: 0.8, loyalty: 0.2, fear: 0.2 },
  { label: 'loyal courtier', ambition: 0.4, loyalty: 0.8, fear: 0.2 },
  { label: 'fearful neutral', ambition: 0.55, loyalty: 0.45, fear: 0.8 },
  { label: 'ambitious boundary', ambition: 0.6, loyalty: 0.5, fear: 0.5 },
  { label: 'loyal boundary', ambition: 0.7, loyalty: 0.7, fear: 0.49 },
];
const trustLevels = [0, 0.3999, 0.4, 0.5999, 0.6, 0.7999, 0.8, 1];

for (const origin of origins) {
  for (const choice of choices) {
    test(`${origin}/${choice}: preview matches direct game effects across reaction and trust boundaries`, () => {
      for (const { label, ...personality } of personalities) {
        for (const trustInPlayer of trustLevels) {
          const character = makeCharacter();
          character.personalityVectors = {
            ...character.personalityVectors,
            ...personality,
          };
          character.relationshipVectors = {
            ...character.relationshipVectors,
            trustInPlayer,
          };
          const beforeCharacter = structuredClone(character);
          const beforePlayerStats = structuredClone(playerStats);
          const result = processGiftWithMessage(
            choice,
            character.personalityVectors,
            character.relationshipVectors,
            origin,
            playerStats,
            character.supportLevel,
            {positiveEffectScale:giftPositiveScale(character,playerStats.influence)},
          );
          // This is the same fallback used by character-machine.ts, rather than
          // an invented additive suspicion model for the UI.
          const nextSuspicion = result.newPersonalityVectors.suspicion || character.suspicion;
          assert.deepEqual(previewMessage(character, choice, origin, playerStats), {
            support: Math.min(100, result.newSupportLevel) - character.supportLevel,

            suspicion: Math.round((nextSuspicion - character.suspicion) * 100),
            dangerous: nextSuspicion >= character.suspicionThreshold,
          }, `${label}, trust=${trustInPlayer}`);
          assert.deepEqual(character, beforeCharacter, 'previews must not mutate characters');
          assert.deepEqual(playerStats, beforePlayerStats, 'previews must not mutate player stats');
        }
      }
    });
  }
}

test('preview reports a concrete neutral gift outcome in percentage points', () => {
  // The final 10.5-point effect rounds once to 11 and adds to the ledger.
  assert.deepEqual(previewMessage(makeCharacter(), 'neutral', 'prince', playerStats), {
    support: 11,

    suspicion: 0,
    dangerous: false,
  });
});

test('message previews preserve historical support without overwriting the ledger', () => {
  const character = makeCharacter({
    supportLevel: 80,
    relationshipVectors: {
      trustInPlayer: 0,
      loyaltyToPlayer: 0,
      fearOfPlayer: 0,
      dependenceOnPlayer: 0,
      loveForPlayer: 0,
    },
  });
  assert.deepEqual(previewMessage(character, 'neutral', 'prince', playerStats), {
    support: 11,

    suspicion: 0,
    dangerous: false,
  });
});

test('support and relationship caps limit displayed gains', () => {
  const character = makeCharacter({
    supportLevel: 99,
    relationshipVectors: {
      trustInPlayer: 0.99,
      loyaltyToPlayer: 0.99,
      fearOfPlayer: 0,
      dependenceOnPlayer: 0.99,
      loveForPlayer: 0.99,
    },
  });
  assert.deepEqual(previewMessage(character, 'loyal', 'prince', playerStats), {
    support: 1,

    suspicion: 0,
    dangerous: false,
  });
  character.supportLevel = 100;
  assert.equal(previewMessage(character, 'loyal', 'prince', playerStats).support, 0);
});

test('negative trust stops at zero and suspicion is capped at one', () => {
  const character = makeCharacter({ suspicion: 0.9, suspicionThreshold: 1 });
  character.personalityVectors.suspicion = 0.9;
  character.relationshipVectors.trustInPlayer = 0.05;
  const preview = previewMessage(character, 'ambitious', 'prince', playerStats);
  assert.equal(preview.support, -12);
  assert.equal(preview.suspicion, 10);
  assert.equal(preview.dangerous, true, 'reaching the threshold exactly is dangerous');
});

test('zero personality suspicion falls back to current suspicion', () => {
  const character = makeCharacter({ suspicion: 0.8, suspicionThreshold: 0.7 });
  character.personalityVectors.suspicion = 0;
  const preview = previewMessage(character, 'neutral', 'prince', playerStats);
  assert.equal(preview.suspicion, 0);
  assert.equal(preview.dangerous, true, 'existing risk is still shown with no new suspicion');
});

test('stale personality suspicion cannot erase witnessed suspicion', () => {
  const character = makeCharacter({ suspicion: 0.8, suspicionThreshold: 0.7 });
  character.personalityVectors.suspicion = 0.2;
  const preview = previewMessage(character, 'neutral', 'prince', playerStats);
  assert.equal(preview.suspicion, 0);
  assert.equal(preview.dangerous, true);
});

test('preview uses the character-specific suspicion threshold', () => {
  for (const [type, threshold] of [['major', 0.5], ['side', 0.7], ['minor', 0.9]] as const) {
    const character = makeCharacter({ type, suspicion: threshold, suspicionThreshold: threshold });
    character.personalityVectors.suspicion = threshold;
    assert.equal(previewMessage(character, 'neutral', 'minister', playerStats).dangerous, true);
    character.suspicion = threshold - 0.01;
    character.personalityVectors.suspicion = threshold - 0.01;
    assert.equal(previewMessage(character, 'neutral', 'minister', playerStats).dangerous, false);
  }
});


test('message deltas preserve direct support while retaining negative effects and bounds', () => {
  const character = makeCharacter();
  const loyal = { ...character.personalityVectors, ambition: 0, loyalty: 1 };
  const relationship = { ...character.relationshipVectors, trustInPlayer: .5, loyaltyToPlayer: 0, dependenceOnPlayer: 0, loveForPlayer: 0, fearOfPlayer: 0 };
  const result = processGiftWithMessage('ambitious', loyal, relationship, 'prince', playerStats, 40);
  assert.ok(result.newSupportLevel < 40, 'a bad message must still damage existing support');
  assert.equal(processGiftWithMessage('ambitious', loyal, relationship, 'prince', playerStats, 1).newSupportLevel, 0);
  assert.equal(processGiftWithMessage('neutral', loyal, relationship, 'prince', playerStats, 99).newSupportLevel, 100);
});


for (const rank of ['crown_prince', 'prime_minister', 'empress_consort']) {
  test(`${rank}: formal office opens ordinary high-influence audiences, not hostile actions`, () => {
    const character = makeCharacter();
    character.personalityVectors.influence = .99;
    const stats = { ...playerStats, influence: .5 };
    assert.equal(getInfluenceGating(character, stats).canInteract.allowed, true);
    const access = getInfluenceGating(character, stats, rank);
    assert.equal(access.canInteract.allowed, true);
    assert.equal(access.canUseNeutralMessage.allowed, true);
    assert.equal(access.canUseLoyalMessage.allowed, true);
    assert.equal(access.canUseCautiousMessage.allowed, true);
    assert.equal(access.canSpitInFace.allowed, false);
    assert.equal(access.canUseAmbitiousMessage.allowed, false);
    assert.equal(stats.influence, .5, 'access must not fake an influence increase');
    assert.equal(getInfluenceGating(character, stats, null).canInteract.allowed, true, 'zone access owns ordinary audience permission');
  });
}


test('career access foundation preserves the Scholar alias and explicit start/top zone rules', () => {
  assert.equal(resolveCareer('minister'),'scholar');
  assert.equal(resolveCareer('scholar'),'scholar');
  const zones=['common','emperor','empress','ladies','dowager','library'] as const;
  const starts={prince:[true,false,true,false,true,true],minister:[true,true,false,false,false,true],concubine:[true,false,false,true,false,false]};
  const tops={prince:'crown_prince',minister:'prime_minister',concubine:'empress'};
  for(const role of ['prince','minister','concubine'] as const){
    zones.forEach((zone,index)=>{
      assert.equal(careerZoneAccess(role,null,zone).allowed,starts[role][index]);
      assert.equal(careerZoneAccess(role,tops[role],zone).allowed,true);
    });
  }
  assert.equal(careerZoneAccess('prince','grand_prince','emperor').allowed,true);
  assert.equal(careerZoneAccess('prince','grand_prince','ladies').allowed,false);
  assert.equal(careerZoneAccess('prince','grand_prince','ladies').requiredRank,'crown_prince');
  assert.equal(careerZoneAccess('minister','minister','empress').allowed,true);
  assert.equal(careerZoneAccess('minister','minister','dowager').allowed,true);
  assert.equal(careerZoneAccess('minister','minister','ladies').allowed,false);
  assert.equal(careerZoneAccess('concubine','consort','ladies').allowed,true);
  assert.equal(careerZoneAccess('concubine','consort','empress').allowed,true);
  assert.equal(careerZoneAccess('concubine','consort','dowager').allowed,true);
  assert.equal(careerZoneAccess('concubine','consort','emperor').allowed,false);
  assert.equal(careerZoneAccess('concubine','consort','library').allowed,false);
  for(const role of ['prince','minister','concubine'])assert.equal(careerZoneAccess(role,null,careerEntryZone(role)).allowed,true);
});

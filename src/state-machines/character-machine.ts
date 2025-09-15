import type { CharacterPersonalityVectors, CharacterRelationshipVectors, InitialCharacterType } from '../types/character.js';
import { assign, sendParent, setup, } from 'xstate';
import type { PlayerStats } from '../types/game.js';
import { processGiftWithMessage } from '../lib/checkMessage.js';

export const characterMachine = setup({
  types: {
    input: {} as InitialCharacterType,
    context: {
      name: "",
      type: null,
      supportLevel: 0,
      suspicion: 0,
      personalityVectors: {
        trust: 0.0,
        fear: 0.0,
        ambition: 0.0,
        loyalty: 0.0,
        influence: 0.0,
        romantic: 0.0,
        suspicion: 0.0
      },
      relationshipVectors: {
        trustInPlayer: 0.0,
        loyaltyToPlayer: 0.0,
        fearOfPlayer: 0,
        dependenceOnPlayer: 0,
        loveForPlayer: 0
      },
      lastResponse: "",
      imgPath: "",
      suspicionThreshold: 0.0,
      hasGivenSupport: false,
      hasGivenAllegiance: false,
      hasGivenGifts: false,
      giftCooldownUntil: 0,
      currentSeason: 1
    } as {
      name: string;
      suspicion: number;
      type: "major" | "side" | "minor" | null;
      supportLevel: number;
      personalityVectors: CharacterPersonalityVectors;
      relationshipVectors: CharacterRelationshipVectors;
      lastResponse: string;
      imgPath: string;
      suspicionThreshold: number;
      hasGivenSupport: boolean;
      hasGivenAllegiance: boolean;
      hasGivenGifts: boolean;
      giftCooldownUntil: number;
      currentSeason: number;
    },
    events: {} as
      { type: 'ACTIVATE' } |
      { type: 'GIVE_GIFT_SIMPLE' } |
      { type: 'GIVE_GIFT_WITH_MESSAGE', messageType: 'ambitious' | 'loyal' | 'cautious' | 'neutral', playerVectors: PlayerStats, playerType: 'prince' | 'minister' | 'concubine' } |
      { type: 'SPIT_IN_FACE' } |
      { type: 'APPLY_FEAR', fearAmount: number } |
      { type: 'APPLY_PROMOTION_PENALTY', trustPenalty: number, loyaltyPenalty: number } |
      { type: 'UPDATE_SEASON', currentSeason: number } |
      { type: 'DEACTIVATE' } |
      { type: 'APPLY_FACTION_BONUS', supportBonus: number, trustBonus: number } |
      { type: 'APPLY_FACTION_PENALTY', supportPenalty: number, suspicionPenalty: number } |
      { type: 'APPLY_SUSPICION_CHANGE', suspicionChange: number }
  },
  guards: {
    characterSuspicious: function ({ context }) {
      return context.suspicion >= context.suspicionThreshold;
    },
    giveSupport: function ({ context }) {
      return context.supportLevel >= 80 && !context.hasGivenSupport;
    },
    giveAllegiance: function ({ context }) {
      return context.supportLevel >= 100 && !context.hasGivenAllegiance;
    },
    giveGifts: function ({ context }) {
      // Character gives gifts when reaching 100 support or 100 loveForPlayer, and hasn't given gifts yet
      const canGive = (context.supportLevel >= 100 || context.relationshipVectors.loveForPlayer >= 1.0) && 
                      !context.hasGivenGifts;
      if (context.supportLevel >= 90 || context.relationshipVectors.loveForPlayer >= 0.9) {
        console.log(`${context.name} gift check: support=${context.supportLevel}, love=${context.relationshipVectors.loveForPlayer}, hasGiven=${context.hasGivenGifts}, canGive=${canGive}`);
      }
      return canGive;
    },
    zeroSupport: function ({ context }) {
      return context.supportLevel === 0;
    }
  }
}).createMachine({
  context: ({ input }) => ({
    name: input.name,
    type: input.type,
    supportLevel: 0,
    suspicion: 0,
    personalityVectors: input.vectors,
    relationshipVectors: {
      trustInPlayer: 0.0,
      loyaltyToPlayer: 0.0,
      fearOfPlayer: 0,
      dependenceOnPlayer: 0,
      loveForPlayer: 0
    },
    lastResponse: "",
    imgPath: input.imgPath,
    suspicionThreshold: input.suspicionThreshold,
    hasGivenSupport: false,
    hasGivenAllegiance: false,
    hasGivenGifts: false,
    giftCooldownUntil: 0,
    currentSeason: 1
  }),
  initial: "inactive",
  states: {
    inactive: {
      on: {
        ACTIVATE: 'alive' // Transition to active when the parent says so
      }
    },
    alive: {
      always: [
        {
          guard: 'giveAllegiance',
          actions: [
            assign({
              hasGivenAllegiance: true
            }),
            sendParent(({ context }) => ({
              type: 'CHARACTER_GAVE_ALLEGIANCE',
              characterType: context.type,
              name: context.name
            }))
          ]
        },
        {
          guard: 'giveSupport',
          actions: [
            assign({
              hasGivenSupport: true
            }),
            sendParent(({ context }) => ({
              type: 'CHARACTER_GAVE_SUPPORT',
              characterType: context.type,
              name: context.name
            }))
          ]
        },
        {
          guard: 'giveGifts',
          actions: [
            ({ context }) => {
              console.log(`${context.name} is giving gifts! Support: ${context.supportLevel}, Love: ${context.relationshipVectors.loveForPlayer}`);
            },
            assign({
              hasGivenGifts: true,
              giftCooldownUntil: ({ context }) => {
                const cooldownUntil = context.currentSeason + 3;
                console.log(`${context.name}: Setting gift cooldown until season ${cooldownUntil} (current: ${context.currentSeason})`);
                return cooldownUntil;
              },
              relationshipVectors: ({ context }) => ({
                ...context.relationshipVectors
              })
            }),
            sendParent(({ context }) => ({
              type: 'CHARACTER_GAVE_GIFTS',
              characterType: context.type,
              name: context.name
            }))
          ]
        },
        {
          guard: 'characterSuspicious',
          actions: sendParent(({ context }) => ({
            type: 'CHARACTER_IS_SUSPICIOUS',
            characterType: context.type,
            name: context.name
          }))
        }
      ],
      on: {
        DEACTIVATE: 'inactive',
        GIVE_GIFT_SIMPLE: {
          actions: assign({
            supportLevel: ({ context }) => Math.min(100, context.supportLevel + 5)
          })
        },
        GIVE_GIFT_WITH_MESSAGE: {
          actions: [
            // 1. Update context and store the response type
            assign(({ context, event }) => {
              const result = processGiftWithMessage(
                event.messageType,
                context.personalityVectors,
                context.relationshipVectors,
                event.playerType,
                event.playerVectors
              );

              // Update suspicion based on personality vectors
              const newSuspicion = result.newPersonalityVectors.suspicion || context.suspicion;

              return {
                supportLevel: Math.min(100, result.newSupportLevel),
                personalityVectors: result.newPersonalityVectors,
                relationshipVectors: result.newRelationshipVectors,
                suspicion: newSuspicion,
                lastResponse: result.responseType
              };
            }),

            sendParent(({ context }) => ({
              type: 'CHARACTER_RESPONDED',
              name: context.name,
              response: context.lastResponse
            })),
            assign({
              lastResponse: ""
            })
          ]
        },
        SPIT_IN_FACE: [{
          guard: 'zeroSupport',
          actions: assign({
            suspicion: ({ context }) => Math.min(1, context.suspicion + 0.5)
          })
        },
        {
          actions: assign({
            supportLevel: ({ context }) => Math.max(0, context.supportLevel - 20),
            suspicion: ({ context }) => Math.min(1, context.suspicion + 0.3)
          })
        }
        ],
        APPLY_FEAR: {
          actions: assign({
            relationshipVectors: ({ context, event }) => ({
              ...context.relationshipVectors,
              fearOfPlayer: Math.min(1.0, context.relationshipVectors.fearOfPlayer + event.fearAmount)
            })
          })
        },
        APPLY_PROMOTION_PENALTY: {
          actions: assign({
            relationshipVectors: ({ context, event }) => ({
              ...context.relationshipVectors,
              trustInPlayer: Math.max(0.0, context.relationshipVectors.trustInPlayer - event.trustPenalty),
              loyaltyToPlayer: Math.max(0.0, context.relationshipVectors.loyaltyToPlayer - event.loyaltyPenalty)
            })
          })
        },
        UPDATE_SEASON: {
          actions: assign({
            currentSeason: ({ event }) => event.currentSeason,
            hasGivenGifts: ({ context, event }) => {
              // Reset gift giving ability if cooldown period has passed
              if (context.hasGivenGifts && context.giftCooldownUntil > 0 && event.currentSeason >= context.giftCooldownUntil) {
                console.log(`${context.name}: Resetting gift ability. Season ${event.currentSeason} >= cooldown ${context.giftCooldownUntil}`);
                return false;
              }
              return context.hasGivenGifts;
            },
            giftCooldownUntil: ({ context, event }) => {
              // Reset cooldown if period has passed
              if (context.giftCooldownUntil > 0 && event.currentSeason >= context.giftCooldownUntil) {
                console.log(`${context.name}: Clearing gift cooldown`);
                return 0;
              }
              return context.giftCooldownUntil;
            }
          })
        },
        APPLY_FACTION_BONUS: {
          actions: [
            ({ context, event }) => {
              console.log(`${context.name}: Applying faction bonus - Support +${event.supportBonus}, Trust +${Math.round(event.trustBonus * 100)}%`);
            },
            assign({
              supportLevel: ({ context, event }) => {
                const newSupport = Math.min(100, context.supportLevel + event.supportBonus);
                console.log(`${context.name}: Support ${context.supportLevel} -> ${newSupport}`);
                return newSupport;
              },
              relationshipVectors: ({ context, event }) => {
                const oldTrust = context.relationshipVectors.trustInPlayer;
                const newTrust = Math.min(1.0, oldTrust + event.trustBonus);
                console.log(`${context.name}: Trust ${Math.round(oldTrust * 100)}% -> ${Math.round(newTrust * 100)}%`);
                return {
                  ...context.relationshipVectors,
                  trustInPlayer: newTrust
                };
              }
            })
          ]
        },
        APPLY_FACTION_PENALTY: {
          actions: [
            ({ context, event }) => {
              console.log(`${context.name}: Applying faction penalty - Support -${event.supportPenalty}, Suspicion +${Math.round(event.suspicionPenalty * 100)}%`);
            },
            assign({
              supportLevel: ({ context, event }) => {
                const newSupport = Math.max(0, context.supportLevel - event.supportPenalty);
                console.log(`${context.name}: Support ${context.supportLevel} -> ${newSupport}`);
                return newSupport;
              },
              suspicion: ({ context, event }) => {
                const oldSuspicion = context.suspicion;
                const newSuspicion = Math.min(1.0, oldSuspicion + event.suspicionPenalty);
                console.log(`${context.name}: Suspicion ${Math.round(oldSuspicion * 100)}% -> ${Math.round(newSuspicion * 100)}%`);
                return newSuspicion;
              }
            })
          ]
        },
        APPLY_SUSPICION_CHANGE: {
          actions: [
            ({ context, event }) => {
              const changeType = event.suspicionChange > 0 ? 'increase' : 'decrease';
              console.log(`${context.name}: Cross-character suspicion ${changeType} by ${Math.abs(event.suspicionChange)}`);
            },
            assign({
              suspicion: ({ context, event }) => {
                const oldSuspicion = context.suspicion;
                const newSuspicion = Math.max(0, Math.min(1.0, oldSuspicion + event.suspicionChange));
                console.log(`${context.name}: Suspicion ${Math.round(oldSuspicion * 100)}% -> ${Math.round(newSuspicion * 100)}%`);
                return newSuspicion;
              }
            })
          ]
        },

      }
    }
  },
})

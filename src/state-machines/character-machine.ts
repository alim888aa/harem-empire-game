import type { CharacterPersonalityVectors, CharacterRelationshipVectors, InitialCharacterType } from '../types/character.js';
import { assign, sendParent, setup,} from 'xstate';
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
        romantic: 0.0
      },
      relationshipVectors: {
        trustInPlayer: 0.0,
        loyaltyToPlayer: 0.0,
        fearOfPlayer: 0,
        dependenceOnPlayer: 0,
        loveForPlayer: 0
      },
      lastResponse: "",
      imgPath: ""
    } as {
      name: string;
      suspicion: number;
      type: "major" | "side" | "minor" | null;
      supportLevel: number;
      personalityVectors: CharacterPersonalityVectors;
      relationshipVectors: CharacterRelationshipVectors;
      lastResponse: string;
      imgPath: string;
    },
    events: {} as 
        { type: 'GIVE_GIFT_SIMPLE' } |
        { type: 'GIVE_GIFT_WITH_MESSAGE', messageType: 'ambitious' | 'loyal' | 'cautious' | 'neutral', playerVectors: PlayerStats, playerType: 'prince' | 'minister' | 'concubine' } |
        { type: 'SPIT_IN_FACE'  }
  },
  guards: {
    characterSuspicious: function ({ context }) {
      return context.suspicion > 0.7;
    },
    giveSupport: function ({ context }) {
      return context.supportLevel >= 80;
    },
    giveAllegiance: function ({ context }) {
      return context.supportLevel >= 100;
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
    imgPath: input.imgPath
    }),
    initial: "alive",
    states: {
      alive: {
        always: [
        {
          guard: 'giveAllegiance',
          actions: sendParent(({ context }) => ({
            type: 'CHARACTER_GAVE_ALLEGIANCE',
            characterType: context.type,
            name: context.name
          }))
        },
        {
          guard: 'giveSupport',
          actions: sendParent(({ context }) => ({
            type: 'CHARACTER_GAVE_SUPPORT',
            characterType: context.type,
            name: context.name
          }))
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
                suspicion: ({ context }) => Math.max(0, context.suspicion - 0.3)
            })
        }
      ],
    }}
},
})

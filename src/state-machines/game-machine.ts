import { setup, sendTo, stopChild } from "xstate";
import type { ActorRefFrom } from "xstate";
import { assign } from "xstate";
import { initialCharacters } from '../data/characters.ts'
import { characterMachine } from './character-machine.ts'
import type { PlayerStats } from "../types/game.ts";
import { getResponseByType } from "../lib/getResponse.ts";
import { getRank } from "../lib/helpers.ts";
import { getPersonality } from "../lib/helpers.ts";


type CharRef = ActorRefFrom<typeof characterMachine>;

export const gameMachine = setup({
  types: {
    context: {
      characterType: null,
      season: 1,
      giftsRemaining: 15,
      supportPoints: 0,
      rank: null,
      characters: {},
      playerPersonality: {
        influence: 0.0,
        ambition: 0.0,
        loyalty: 0.0,
        fear: 0.0,
        charisma: 0.0
      },
      suspiciousCharacters: [],
      lastCharacterResponse: "",
      gameEndReason: null
    } as
      {
        characterType: 'prince' | 'minister' | 'concubine' | null;
        season: number;
        giftsRemaining: number;
        supportPoints: number;
        rank: 'crown_prince' | 'prime_minister' | 'empress_consort' | null;
        characters: Record<string, CharRef>,
        playerPersonality: PlayerStats,
        suspiciousCharacters: string[],
        lastCharacterResponse: string,
        gameEndReason: 'victory' | 'defeat' | null
      },
    events: {} as
      | { type: "INITIALIZE_GAME" }
      | { type: "NEXT_SEASON" }
      | { type: "GIVE_GIFT_SIMPLE", characterId: string, characterType: 'major' | 'side' | 'minor' }
      | { type: "GIVE_GIFT_WITH_MESSAGE", characterId: string, messageType: 'ambitious' | 'loyal' | 'cautious' | 'neutral', characterType: 'major' | 'side' | 'minor', }
      | { type: "SPIT_IN_FACE", characterId: string }
      | { type: "CHOOSE_CHARACTER", payload: { type: 'prince' | 'minister' | 'concubine' } }
      | { type: "GIVE_EMPEROR_GIFT", giftsRemaining: number }
      | { type: "REFUSE" }
      | { type: "PROMOTED" }
      | { type: "CHARACTER_GAVE_SUPPORT", name: string, characterType: 'major' | 'side' | 'minor' }
      | { type: "CHARACTER_GAVE_ALLEGIANCE", name: string, characterType: 'major' | 'side' | 'minor' }
      | { type: "CHARACTER_IS_SUSPICIOUS", name: string, characterType: 'major' | 'side' | 'minor' }
      | { type: "CHARACTER_RESPONDED", name: string, response: "ambitious_positive" | "loyal_suspicious" | "neutral" | "fearful_appreciative" | "ambitious_dismissive" | "loyal_positive" | "neutral" }
      | { type: "GAME_COMPLETED" }
      | { type: "RESTART_GAME" }
  },
  actors: {
    characterMachine: characterMachine
  },
  guards: {
    emperor_encountered: function ({ context }) {
      return context.season >= 2 && Math.random() < 0.3;
    },
    emperor_gifting: function ({ context }) {
      return context.giftsRemaining >= 10;
    },
    canAffordGift: function ({ context, event }) {
      // Check if the event is one of the gift-giving events
      if (event.type !== 'GIVE_GIFT_SIMPLE' && event.type !== 'GIVE_GIFT_WITH_MESSAGE') {
        return false;
      }

      const cost = (event.characterType === 'major' || event.characterType === 'side') ? 5 : 1;
      return context.giftsRemaining >= cost;
    },
    canBePromoted: function ({ context }) {
      return context.supportPoints >= 80 && context.rank === null;
    },
    canBeEmperor: function ({ context }) {
      return context.supportPoints >= 100;
    }
  },
}).createMachine({
  context: {
    characterType: null,
    season: 1,
    giftsRemaining: 15,
    supportPoints: 0,
    rank: null,
    characters: {},
    playerPersonality: {
      influence: 0.0,
      ambition: 0.0,
      loyalty: 0.0,
      fear: 0.0,
      charisma: 0.0
    },
    suspiciousCharacters: [],
    lastCharacterResponse: "",
    gameEndReason: null
  },
  on: {
  },
  id: "gameMachine",
  initial: "choosing_character",
  states: {
    choosing_character: {
      on: {
        CHOOSE_CHARACTER: {
          target: "initialize_game",
          actions: assign({
            characterType: ({ event }) => event.payload.type,
          })
        },
      },
    },
    initialize_game: {
      on: {
        INITIALIZE_GAME: {
          target: "playing",
          actions: assign({
            playerPersonality: ({ context }) => getPersonality(context.characterType),
            characters: ({ spawn }) => {
              const characterActors: Record<string, CharRef> = {};
              for (const charData of initialCharacters) {
                characterActors[charData.name] = spawn('characterMachine', {
                  id: charData.name,
                  input: charData
                });
              }
              return characterActors;
            }
          }),
        }
      }
    },
    playing: {
      initial: "in_season",
      on: {
        CHARACTER_GAVE_SUPPORT: {
          actions: assign({
            supportPoints: ({ context, event }) => {
              let points = 0;
              if (event.characterType === 'major') points = 30;
              else if (event.characterType === 'side') points = 15;
              else if (event.characterType === 'minor') points = 5;
              return Math.min(100, context.supportPoints + points);
            }
          })
        },
        CHARACTER_GAVE_ALLEGIANCE: {
          actions: assign({
            supportPoints: ({ context, event }) => {
              let points = 0;
              if (event.characterType === 'major') points = 30;
              else if (event.characterType === 'side') points = 15;
              else if (event.characterType === 'minor') points = 5;
              return Math.min(100, context.supportPoints + points);
            },
          })
        },
        CHARACTER_IS_SUSPICIOUS: {
          // This can be used to show a UI warning
          // For now, we'll just log it
          actions: ({ event }) => {
            alert(`${event.name} is becoming suspicious!`);
          }
        },

        CHARACTER_RESPONDED: {
          actions: assign({
            // Use the helper function to get the full text
            lastCharacterResponse: ({ event }) => getResponseByType(event.name, event.response)
          })
        }
      },
      always: [
        {
          guard: {
            type: "canBeEmperor",
          },
          target: '#gameMachine.game_over',
          actions: assign({
            gameEndReason: 'victory'
          })
        },
        {
          guard: {
            type: "canBePromoted",
          },
          actions: assign({
            rank: ({ context }) => getRank(context.characterType),
          })
        }
      ],
      states: {
        in_season: {
          on: {
            NEXT_SEASON: [
            {
              target: "advancing_season",
            }],
            GIVE_GIFT_SIMPLE: {
              guard: 'canAffordGift',
              actions: [
                assign({
                  giftsRemaining: ({ context, event }) => {
                    const cost = (event.characterType === 'major' || event.characterType === 'side') ? 5 : 1;
                    return context.giftsRemaining - cost;
                  }
                }),
                sendTo(
                  ({ event }) => event.characterId,
                  { type: 'GIVE_GIFT_SIMPLE' }
                )
              ]
            },
            GIVE_GIFT_WITH_MESSAGE: {
              guard: 'canAffordGift',
              actions: [
                assign({
                  giftsRemaining: ({ context, event }) => {
                    const cost = (event.characterType === 'major' || event.characterType === 'side') ? 5 : 1;
                    return context.giftsRemaining - cost;
                  }
                }),
                sendTo(
                  ({ event }) => event.characterId,
                  // Forward all necessary info to the character machine
                  ({ event, context }) => ({
                    type: 'GIVE_GIFT_WITH_MESSAGE',
                    messageType: event.messageType,
                    playerVectors: context.playerPersonality,
                    playerType: context.characterType
                  })
                )
              ]
            },
            SPIT_IN_FACE: {
              actions: sendTo(
                ({ event }) => event.characterId,
                { type: 'SPIT_IN_FACE' }
              )
            }
          },

        },
        advancing_season: {
          entry: assign({
            season: ({ context }) => context.season + 1,
            giftsRemaining: ({ context }) => context.giftsRemaining + 15,
          }),
          always: [
            {
              guard: "emperor_encountered",
              target: "emperor_encounter",
            },
            {
              target: "in_season"
            },
          ]
        },
        emperor_encounter: {
          on: {
            GIVE_EMPEROR_GIFT: [
              {
                guard: {
                  type: "emperor_gifting",
                },
                target: 'in_season',
                actions: assign({
                  giftsRemaining: ({ context }) => context.giftsRemaining - 10,
                }),
              },
              {
                target: '#gameMachine.game_over',
                actions: assign({
                  gameEndReason: 'defeat'
                })
              }
            ],
            REFUSE: {
              target: '#gameMachine.game_over',
              actions: assign({
                gameEndReason: 'defeat'
              })
            }
          }
        },
      },
    },
    game_over: {
      on: {
        RESTART_GAME: {
          target: 'choosing_character',
          actions: assign({
            characterType: null,
            season: 1,
            giftsRemaining: 15,
            supportPoints: 0,
            rank: null,
            characters: {},
            playerPersonality: {
              influence: 0.0,
              ambition: 0.0,
              loyalty: 0.0,
              fear: 0.0,
              charisma: 0.0
            },
            suspiciousCharacters: [],
            lastCharacterResponse: ""
          })
        }
      },
    },
  }
});


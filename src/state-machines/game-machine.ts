import { setup, sendTo, stopChild, enqueueActions, spawnChild } from "xstate";
import type { ActorRefFrom } from "xstate";
import { assign } from "xstate";
import { initialCharacters } from '../data/characters.ts'
import { characterMachine } from './character-machine.ts'
import type { PlayerStats, PlayerReputation } from "../types/game.ts";
import type { InitialCharacterType } from "../types/character.ts";
import { getResponseByType } from "../lib/getResponse.ts";
import { getRank } from "../lib/helpers.ts";
import { getPersonality } from "../lib/helpers.ts";
import { updatePlayerVector, canBypassEmperorExecution } from "../lib/playerVector.ts";
import { applyInitialInfluenceFear, applyInfluenceFear, handlePromotion } from "../lib/influenceFear.ts";
import { calculateFactionEffects, checkFactionMembershipOffers, assignCharacterFaction, applyFactionMembershipEffects, type FactionSystem, type FactionType } from "../lib/factionSystem.ts";
import { calculateAmbitiousMessageEffects, calculateSpitInFaceEffects, calculateLoyalActionBenefits, applyCrossCharacterEffects, generateCrossCharacterNotification } from "../lib/crossCharacterEffects.ts";

// Helper functions for character pool selection
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function selectCharacterPool(
  allCharacters: InitialCharacterType[],
  playerPath: 'prince' | 'minister' | 'concubine' | null,
  excludedMajorName?: string | null,
  playerRank?: 'crown_prince' | 'prime_minister' | 'empress_consort' | null
): InitialCharacterType[] {
  const majorNames = ['Crown Prince', 'Prime Minister', 'Empress Consort', 'Empress Dowager'];

  // Available majors (respecting any excluded major)
  const availableMajors = allCharacters
    .filter((c) => majorNames.includes(c.name))
    .filter((c) => c.name !== excludedMajorName);

  // THIS IS THE KEY CHANGE: 3 majors if ranked, 2 if not.
  const desiredMajorCount = playerRank ? 3 : 2;

  // Prefer majors that match the player's path, but pick randomly
  const preferredMajors = availableMajors.filter((c) => playerPath && c.paths?.includes(playerPath));
  const otherMajors = availableMajors.filter((c) => !preferredMajors.includes(c));

  // Build the list of chosen majors up to the desired count
  const chosenMajors: InitialCharacterType[] = [];
  const fillFrom = (source: InitialCharacterType[]) => {
    for (const major of source) {
      if (chosenMajors.length < desiredMajorCount) {
        if (!chosenMajors.find(c => c.name === major.name)) { // ensure uniqueness
          chosenMajors.push(major);
        }
      }
    }
  };

  fillFrom(shuffle(preferredMajors));
  fillFrom(shuffle(otherMajors));

  // --- The rest of the logic remains the same ---

  const remainingCharacters = allCharacters.filter((c) => !majorNames.includes(c.name));
  const totalSlots = randInt(6, 8);
  const additionalSlots = Math.max(0, totalSlots - chosenMajors.length);

  if (!playerPath) {
    return [...chosenMajors, ...shuffle(remainingCharacters).slice(0, additionalSlots)];
  }

  const thematicCandidates = remainingCharacters.filter((c) => c.paths?.includes(playerPath));
  const varietyCandidates = remainingCharacters.filter((c) => !c.paths?.includes(playerPath));
  const thematicSlots = Math.round(additionalSlots * 0.6);
  const selectedThematic = shuffle(thematicCandidates).slice(0, Math.min(thematicSlots, thematicCandidates.length));
  const remainingSlots = additionalSlots - selectedThematic.length;
  const selectedVariety = shuffle(varietyCandidates).slice(0, remainingSlots);

  return [...chosenMajors, ...selectedThematic, ...selectedVariety];
}

function rankToMajorName(rank: string | null) {
  const map: Record<string, string> = {
    crown_prince: 'Crown Prince',
    prime_minister: 'Prime Minister',
    empress_consort: 'Empress Consort'
  };
  return rank ? map[rank] : null;
}

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
      activeCharacterNames: [],
      playerPersonality: {
        influence: 0.0,
        ambition: 0.0,
        loyalty: 0.0,
        fear: 0.0,
        charisma: 0.0
      },
      playerReputation: {
        perceivedThreat: 0.3,
        perceivedLoyalty: 0.5,
        trustworthiness: 0.6,
        politicalSkill: 0.4
      },
      suspiciousCharacters: [],
      lastCharacterResponse: "",
      gameEndReason: null,
      factionSystem: {
        factions: {
          Rebel: [],
          Imperial: [],
          Loyalist: [],
          Independent: []
        },
        playerFaction: null,
        membershipOffers: []
      }
    } as
      {
        characterType: 'prince' | 'minister' | 'concubine' | null;
        season: number;
        giftsRemaining: number;
        supportPoints: number;
        rank: 'crown_prince' | 'prime_minister' | 'empress_consort' | null;
        characters: Record<string, CharRef>,
        activeCharacterNames: string[],
        playerPersonality: PlayerStats,
        playerReputation: PlayerReputation,
        suspiciousCharacters: string[],
        lastCharacterResponse: string,
        gameEndReason: 'victory' | 'defeat' | null,
        factionSystem: FactionSystem
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
      | { type: "CHARACTER_GAVE_GIFTS", name: string, characterType: 'major' | 'side' | 'minor' }
      | { type: "CHARACTER_IS_SUSPICIOUS", name: string, characterType: 'major' | 'side' | 'minor' }
      | { type: "CHARACTER_RESPONDED", name: string, response: "ambitious_positive" | "loyal_suspicious" | "neutral" | "fearful_appreciative" | "ambitious_dismissive" | "loyal_positive" | "neutral" }
      | { type: "GAME_COMPLETED" }
      | { type: "RESTART_GAME" }
      | { type: "JOIN_FACTION", faction: FactionType }
      | { type: "FACTION_MEMBERSHIP_OFFERED", faction: FactionType }
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
    emperor_loyalty_bypass: function ({ context }) {
      return canBypassEmperorExecution(context.giftsRemaining, context.playerReputation);
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
    activeCharacterNames: [],
    playerPersonality: {
      influence: 0.0,
      ambition: 0.0,
      loyalty: 0.0,
      fear: 0.0,
      charisma: 0.0
    },
    playerReputation: {
      perceivedThreat: 0.3,
      perceivedLoyalty: 0.5,
      trustworthiness: 0.6,
      politicalSkill: 0.4
    },
    suspiciousCharacters: [],
    lastCharacterResponse: "",
    gameEndReason: null,
    factionSystem: {
      factions: {
        Rebel: [],
        Imperial: [],
        Loyalist: [],
        Independent: []
      },
      playerFaction: null,
      membershipOffers: []
    }
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
          actions: [
            // 1) spawn all character actors and compute initial active pool
            assign({
              playerPersonality: ({ context }) => getPersonality(context.characterType),
              characters: ({ spawn }) => {
                const characterActors: Record<string, CharRef> = {};
                for (const charData of initialCharacters) {
                  characterActors[charData.name] = spawn(characterMachine, {
                    input: charData,
                    syncSnapshot: true
                  }) as CharRef;
                }
                return characterActors;
              },
              activeCharacterNames: ({ context }) => {
                const selected = selectCharacterPool(
                  initialCharacters,
                  context.characterType,
                  null,
                  null
                );
                return selected.map(c => c.name);
              }
            }),

            // 2) Enqueue an ACTIVATE sendTo for each selected actor (guarded)
            enqueueActions(({ enqueue, context }) => {
              for (const name of context.activeCharacterNames) {
                const actorRef = context.characters[name];
                if (actorRef) {
                  enqueue(sendTo(() => actorRef, { type: 'ACTIVATE' }));
                }
              }
            }),

            // 3) Apply initial influence fear (safe to run after actors spawned)
            ({ context }) => {
              const playerStats = getPersonality(context.characterType);
              if (playerStats && playerStats.influence > 0) {
                applyInitialInfluenceFear(context.characters, playerStats.influence);
              }
            }
          ]
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
        CHARACTER_GAVE_GIFTS: {
          actions: [

            assign({
              giftsRemaining: ({ context, event }) => {
                let giftAmount = 0;
                if (event.characterType === 'major') giftAmount = 10;
                else if (event.characterType === 'side') giftAmount = 5;
                else if (event.characterType === 'minor') giftAmount = 1;
                console.log(`Adding ${giftAmount} gifts from ${event.name}. Total will be: ${context.giftsRemaining + giftAmount}`);
                return context.giftsRemaining + giftAmount;
              }
            }),

            ({ event }) => {
              let giftAmount = 0;
              if (event.characterType === 'major') giftAmount = 10;
              else if (event.characterType === 'side') giftAmount = 5;
              else if (event.characterType === 'minor') giftAmount = 1;

              alert(`${event.name} has given you ${giftAmount} gifts!`);
            }
          ]
        },
        CHARACTER_IS_SUSPICIOUS: [
          {
            // Check if this would trigger game over after adding to suspicious list
            guard: ({ context, event }) => {
              // Add to suspicious characters if not already present
              const updatedSuspiciousCharacters = context.suspiciousCharacters.includes(event.name)
                ? context.suspiciousCharacters
                : [...context.suspiciousCharacters, event.name];

              // Check execution thresholds
              const executionThresholds = { concubine: 1, minister: 3, prince: 5 };
              const threshold = executionThresholds[context.characterType as keyof typeof executionThresholds];

              return updatedSuspiciousCharacters.length >= threshold;
            },
            target: '#gameMachine.game_over',
            actions: [
              assign({
                suspiciousCharacters: ({ context, event }) =>
                  context.suspiciousCharacters.includes(event.name)
                    ? context.suspiciousCharacters
                    : [...context.suspiciousCharacters, event.name],
                gameEndReason: 'defeat'
              })
            ]
          },
          {
            // Add to suspicious characters list without triggering game over
            actions: [
              assign({
                suspiciousCharacters: ({ context, event }) =>
                  context.suspiciousCharacters.includes(event.name)
                    ? context.suspiciousCharacters
                    : [...context.suspiciousCharacters, event.name]
              }),
            ]
          }
        ],

        CHARACTER_RESPONDED: {
          actions: assign({
            // Use the helper function to get the full text
            lastCharacterResponse: ({ event }) => getResponseByType(event.name, event.response)
          })
        },
        FACTION_MEMBERSHIP_OFFERED: {
          actions: [
            assign({
              factionSystem: ({ context, event }) => ({
                ...context.factionSystem,
                membershipOffers: [
                  ...context.factionSystem.membershipOffers.filter(offer => offer.faction !== event.faction),
                  {
                    faction: event.faction,
                    requiredMembers: 3,
                    supportThreshold: 80
                  }
                ]
              })
            }),
            ({ event }) => {
              alert(`The ${event.faction} faction has offered you membership! You can join them to gain faction bonuses.`);
            }
          ]
        },
        JOIN_FACTION: {
          actions: [
            assign({
              factionSystem: ({ context, event }) => ({
                ...context.factionSystem,
                playerFaction: event.faction,
                membershipOffers: [] // Clear all offers once joined
              })
            }),
            // Apply immediate faction membership effects
            ({ context, event }) => {
              console.log(`Player joining ${event.faction} faction - applying immediate effects`);
              const { bonuses, penalties } = applyFactionMembershipEffects(event.faction, context.characters);
              
              // Apply bonuses
              console.log(`Applying ${bonuses.length} faction bonuses`);
              for (const bonus of bonuses) {
                const bonusActor = context.characters[bonus.characterName];
                if (bonusActor) {
                  console.log(`Sending faction bonus to ${bonus.characterName}`);
                  bonusActor.send({ 
                    type: 'APPLY_FACTION_BONUS', 
                    supportBonus: bonus.supportBonus,
                    trustBonus: bonus.trustBonus
                  });
                } else {
                  console.warn(`No actor found for ${bonus.characterName}`);
                }
              }

              // Apply penalties
              console.log(`Applying ${penalties.length} faction penalties`);
              for (const penalty of penalties) {
                const penaltyActor = context.characters[penalty.characterName];
                if (penaltyActor) {
                  console.log(`Sending faction penalty to ${penalty.characterName}`);
                  penaltyActor.send({ 
                    type: 'APPLY_FACTION_PENALTY', 
                    supportPenalty: penalty.supportPenalty,
                    suspicionPenalty: penalty.suspicionPenalty
                  });
                } else {
                  console.warn(`No actor found for ${penalty.characterName}`);
                }
              }

              // Show notification
              let message = `You have joined the ${event.faction} faction!`;
              if (bonuses.length > 0) {
                const bonusNames = bonuses.map(b => b.characterName).join(', ');
                message += ` Gained trust with: ${bonusNames}.`;
              }
              if (penalties.length > 0) {
                const penaltyNames = penalties.map(p => p.characterName).join(', ');
                message += ` Increased suspicion with: ${penaltyNames}.`;
              }
              alert(message);
            }
          ]
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
          guard: { type: "canBePromoted" },
          actions: [
            // Handle promotion effects first (influence increase, character penalties, fear)
            assign(({ context }) => {
              const { updatedPlayerStats } = handlePromotion(
                context.characters,
                context.playerPersonality
              );

              return {
                playerPersonality: updatedPlayerStats
              };
            }),

            // stop the replaced actor by its spawn id (we spawned with id = charData.name)
            stopChild(({ context }) => {
              const replacedNameMap = { prince: 'Crown Prince', minister: 'Prime Minister', concubine: 'Empress Consort' };
              const nameToRemove = replacedNameMap[context.characterType as 'prince' | 'minister' | 'concubine'];
              return context.characters[nameToRemove]; // return the ActorRef (or undefined -> stopChild will no-op)
            }),

            // remove the actor ref from context.characters and set the new rank
            assign(({ context }) => {
              const replacedNameMap: Record<'prince' | 'minister' | 'concubine', string> = {
                prince: 'Crown Prince',
                minister: 'Prime Minister',
                concubine: 'Empress Consort'
              };
              const nameToRemove = replacedNameMap[
                context.characterType as 'prince' | 'minister' | 'concubine'
              ];
              const newChars = { ...context.characters };
              if (nameToRemove in newChars) {
                delete newChars[nameToRemove];
              }
              return {
                characters: newChars,
                rank: getRank(context.characterType)
              };
            })
          ]
        }
      ],
      states: {
        in_season: {
          on: {
            NEXT_SEASON: [
              {
                target: "checking_encounters",
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
                  ({ context, event }) => context.characters[event.characterId],
                  { type: 'GIVE_GIFT_SIMPLE' }
                ),
                // Apply faction effects using enqueueActions - delayed to ensure gift processing completes
                ({ context, event, self }) => {
                  // Only apply faction effects if player is in a faction
                  if (!context.factionSystem.playerFaction || context.factionSystem.playerFaction === 'Independent') {
                    return;
                  }

                  // Use setTimeout to ensure gift processing completes first, then send faction effects
                  setTimeout(() => {
                    try {
                      const targetActor = context.characters[event.characterId];
                      if (!targetActor) return;

                      const targetSnapshot = targetActor.getSnapshot();
                      if (!targetSnapshot?.context) return;

                      const targetCharacter = {
                        name: targetSnapshot.context.name,
                        type: targetSnapshot.context.type,
                        supportLevel: targetSnapshot.context.supportLevel,
                        suspicion: targetSnapshot.context.suspicion,
                        personalityVectors: targetSnapshot.context.personalityVectors,
                        relationshipVectors: targetSnapshot.context.relationshipVectors,
                        lastResponse: targetSnapshot.context.lastResponse,
                        imgPath: targetSnapshot.context.imgPath,
                        suspicionThreshold: targetSnapshot.context.suspicionThreshold,
                        hasGivenGifts: targetSnapshot.context.hasGivenGifts || false,
                        giftCooldownUntil: targetSnapshot.context.giftCooldownUntil || 0
                      };

                      // Calculate faction effects
                      const targetFaction = assignCharacterFaction(targetCharacter);
                      console.log(`Calculating faction effects for simple gift to ${targetCharacter.name} (${targetFaction}), player faction: ${context.factionSystem.playerFaction}`);
                      
                      const { bonuses, penalties } = calculateFactionEffects(
                        targetCharacter,
                        targetFaction,
                        context.characters,
                        context.factionSystem.playerFaction,
                        5 // support gain from simple gift
                      );

                      // Apply bonuses directly
                      for (const bonus of bonuses) {
                        const bonusActor = context.characters[bonus.characterName];
                        if (bonusActor) {
                          console.log(`Sending faction bonus to ${bonus.characterName}`);
                          bonusActor.send({
                            type: 'APPLY_FACTION_BONUS',
                            supportBonus: bonus.supportBonus,
                            trustBonus: bonus.trustBonus
                          });
                        }
                      }

                      // Apply penalties directly
                      for (const penalty of penalties) {
                        const penaltyActor = context.characters[penalty.characterName];
                        if (penaltyActor) {
                          console.log(`Sending faction penalty to ${penalty.characterName}`);
                          penaltyActor.send({
                            type: 'APPLY_FACTION_PENALTY',
                            supportPenalty: penalty.supportPenalty,
                            suspicionPenalty: penalty.suspicionPenalty
                          });
                        }
                      }

                      // Show faction effect notification
                      if (bonuses.length > 0 || penalties.length > 0) {
                        const bonusNames = bonuses.map(b => b.characterName).join(', ');
                        const penaltyNames = penalties.map(p => p.characterName).join(', ');
                        let message = `Faction effects: `;
                        if (bonuses.length > 0) message += `+10 support with ${bonusNames}`;
                        if (penalties.length > 0) message += `${bonuses.length > 0 ? ', ' : ''}-10 support with ${penaltyNames}`;
                        console.log(message);
                      }
                    } catch (error) {
                      console.warn('Failed to apply faction effects for simple gift:', error);
                    }
                  }, 100);
                }
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
                // Update player vector and reputation based on message type
                assign(({ context, event }) => {
                  // Get the character to check trust level for political skill bonus
                  const characterSnapshot = context.characters[event.characterId]?.getSnapshot()?.context;
                  if (!characterSnapshot || !characterSnapshot.type) return {};

                  // Create a Character object from the snapshot
                  const character = {
                    name: characterSnapshot.name,
                    type: characterSnapshot.type,
                    supportLevel: characterSnapshot.supportLevel,
                    suspicion: characterSnapshot.suspicion,
                    personalityVectors: characterSnapshot.personalityVectors,
                    relationshipVectors: characterSnapshot.relationshipVectors,
                    lastResponse: characterSnapshot.lastResponse,
                    imgPath: characterSnapshot.imgPath,
                    suspicionThreshold: characterSnapshot.suspicionThreshold,
                    hasGivenGifts: characterSnapshot.hasGivenGifts || false,
                    giftCooldownUntil: characterSnapshot.giftCooldownUntil || 0
                  };

                  const { updatedStats, updatedReputation } = updatePlayerVector(
                    event.messageType,
                    character,
                    context.playerPersonality,
                    context.playerReputation
                  );

                  return {
                    playerPersonality: updatedStats,
                    playerReputation: updatedReputation
                  };
                }),
                enqueueActions(({ enqueue, context, event }) => {
                  // Narrow the parent event shape
                  if (event.type !== 'GIVE_GIFT_WITH_MESSAGE') return;

                  // Guard context.characterType so TS knows it's present
                  if (!context.characterType) {
                    console.warn('Skipping GIVE_GIFT_WITH_MESSAGE: characterType is not set');
                    return;
                  }

                  const target = context.characters[event.characterId];
                  if (!target) return;

                  // Narrow once for TS (safe because of the guard above)
                  const playerType = context.characterType as 'prince' | 'minister' | 'concubine';

                  // Enqueue a single sendTo with a concrete event object (no nullable fields)
                  enqueue(
                    sendTo(
                      () => target,
                      {
                        type: 'GIVE_GIFT_WITH_MESSAGE',
                        messageType: event.messageType,
                        playerVectors: context.playerPersonality,
                        playerType
                      }
                    )
                  );

                  // Apply faction effects and cross-character suspicion effects after message is processed
                  setTimeout(() => {
                    try {
                      const targetSnapshot = target.getSnapshot();
                      if (!targetSnapshot?.context) return;

                      const targetCharacter = {
                        name: targetSnapshot.context.name,
                        type: targetSnapshot.context.type,
                        supportLevel: targetSnapshot.context.supportLevel,
                        suspicion: targetSnapshot.context.suspicion,
                        personalityVectors: targetSnapshot.context.personalityVectors,
                        relationshipVectors: targetSnapshot.context.relationshipVectors,
                        lastResponse: targetSnapshot.context.lastResponse,
                        imgPath: targetSnapshot.context.imgPath,
                        suspicionThreshold: targetSnapshot.context.suspicionThreshold,
                        hasGivenGifts: targetSnapshot.context.hasGivenGifts || false,
                        giftCooldownUntil: targetSnapshot.context.giftCooldownUntil || 0
                      };

                      // Calculate cross-character suspicion effects
                      let crossCharacterEffects = [];
                      
                      if (event.messageType === 'ambitious') {
                        crossCharacterEffects = calculateAmbitiousMessageEffects(
                          targetCharacter,
                          context.characters,
                          context.factionSystem.playerFaction
                        );
                      } else if (event.messageType === 'loyal') {
                        crossCharacterEffects = calculateLoyalActionBenefits(context.characters);
                      }

                      // Apply cross-character suspicion effects
                      if (crossCharacterEffects.length > 0) {
                        applyCrossCharacterEffects(crossCharacterEffects, context.characters);
                        
                        // Show cross-character notification
                        const crossCharacterNotification = generateCrossCharacterNotification(crossCharacterEffects);
                        if (crossCharacterNotification) {
                          console.log('Cross-character effects:', crossCharacterNotification);
                          alert(crossCharacterNotification);
                        }
                      }

                      // Apply faction effects only if player is in a faction
                      if (context.factionSystem.playerFaction && context.factionSystem.playerFaction !== 'Independent') {
                        const targetFaction = assignCharacterFaction(targetCharacter);
                        console.log(`Calculating faction effects for gift with message to ${targetCharacter.name} (${targetFaction}), player faction: ${context.factionSystem.playerFaction}`);
                        
                        const { bonuses, penalties } = calculateFactionEffects(
                          targetCharacter,
                          targetFaction,
                          context.characters,
                          context.factionSystem.playerFaction,
                          5 // approximate support gain from gift with message
                        );

                        // Apply bonuses directly
                        for (const bonus of bonuses) {
                          const bonusActor = context.characters[bonus.characterName];
                          if (bonusActor) {
                            console.log(`Sending faction bonus to ${bonus.characterName}`);
                            bonusActor.send({
                              type: 'APPLY_FACTION_BONUS',
                              supportBonus: bonus.supportBonus,
                              trustBonus: bonus.trustBonus
                            });
                          }
                        }

                        // Apply penalties directly
                        for (const penalty of penalties) {
                          const penaltyActor = context.characters[penalty.characterName];
                          if (penaltyActor) {
                            console.log(`Sending faction penalty to ${penalty.characterName}`);
                            penaltyActor.send({
                              type: 'APPLY_FACTION_PENALTY',
                              supportPenalty: penalty.supportPenalty,
                              suspicionPenalty: penalty.suspicionPenalty
                            });
                          }
                        }

                        // Show faction effect notification
                        if (bonuses.length > 0 || penalties.length > 0) {
                          const bonusNames = bonuses.map(b => b.characterName).join(', ');
                          const penaltyNames = penalties.map(p => p.characterName).join(', ');
                          let message = `Faction effects: `;
                          if (bonuses.length > 0) message += `+10 support with ${bonusNames}`;
                          if (penalties.length > 0) message += `${bonuses.length > 0 ? ', ' : ''}-10 support with ${penaltyNames}`;
                          console.log(message);
                        }
                      }
                    } catch (error) {
                      console.warn('Failed to apply effects for gift with message:', error);
                    }
                  }, 200); // Longer delay to ensure message processing is complete
                })
              ]
            },
            SPIT_IN_FACE: {
              actions: [
                sendTo(
                  ({ context, event }) => context.characters[event.characterId],
                  { type: 'SPIT_IN_FACE' }
                ),
                // Apply cross-character suspicion effects for spit in face
                ({ context, event }) => {
                  setTimeout(() => {
                    try {
                      const targetActor = context.characters[event.characterId];
                      if (!targetActor) return;

                      const targetSnapshot = targetActor.getSnapshot();
                      if (!targetSnapshot?.context) return;

                      const targetCharacter = {
                        name: targetSnapshot.context.name,
                        type: targetSnapshot.context.type,
                        supportLevel: targetSnapshot.context.supportLevel,
                        suspicion: targetSnapshot.context.suspicion,
                        personalityVectors: targetSnapshot.context.personalityVectors,
                        relationshipVectors: targetSnapshot.context.relationshipVectors,
                        lastResponse: targetSnapshot.context.lastResponse,
                        imgPath: targetSnapshot.context.imgPath,
                        suspicionThreshold: targetSnapshot.context.suspicionThreshold,
                        hasGivenGifts: targetSnapshot.context.hasGivenGifts || false,
                        giftCooldownUntil: targetSnapshot.context.giftCooldownUntil || 0
                      };

                      // Calculate cross-character suspicion effects for spit in face
                      const crossCharacterEffects = calculateSpitInFaceEffects(
                        targetCharacter,
                        context.characters
                      );

                      // Apply cross-character suspicion effects
                      if (crossCharacterEffects.length > 0) {
                        applyCrossCharacterEffects(crossCharacterEffects, context.characters);
                        
                        // Show cross-character notification
                        const crossCharacterNotification = generateCrossCharacterNotification(crossCharacterEffects);
                        if (crossCharacterNotification) {
                          console.log('Cross-character effects:', crossCharacterNotification);
                          alert(crossCharacterNotification);
                        }
                      }
                    } catch (error) {
                      console.warn('Failed to apply cross-character effects for spit in face:', error);
                    }
                  }, 100); // Short delay to ensure spit processing is complete
                }
              ]
            }
          },

        },
        checking_encounters: {
          always: [
            {
              guard: "emperor_encountered",
              target: "emperor_encounter",
            },
            {
              target: "advancing_season"
            },
          ]
        },
        advancing_season: {
          entry: [
            assign({
              season: ({ context }) => context.season + 1,
              giftsRemaining: ({ context }) => context.giftsRemaining + 15,
              activeCharacterNames: ({ context }) => {
                const excludedMajor = rankToMajorName(context.rank);
                const selectedCharacters = selectCharacterPool(
                  initialCharacters,
                  context.characterType,
                  excludedMajor,
                  context.rank
                );
                return selectedCharacters.map(c => c.name);
              }
            }),

            // Deactivate actors that are currently active but not in the new pool
            enqueueActions(({ enqueue, context }) => {
              const newActive = new Set(context.activeCharacterNames);
              for (const [name, actorRef] of Object.entries(context.characters)) {
                try {
                  const isActive = actorRef.getSnapshot().value === 'alive';
                  if (isActive && !newActive.has(name)) {
                    enqueue(sendTo(() => actorRef, { type: 'DEACTIVATE' }));
                  }
                } catch {
                  // actor snapshot may not be ready; safe to ignore
                }
              }
            }),

            // Activate actors that should be active but currently are inactive
            enqueueActions(({ enqueue, context }) => {
              const newActive = new Set(context.activeCharacterNames);
              for (const [name, actorRef] of Object.entries(context.characters)) {
                try {
                  const isInactive = actorRef.getSnapshot().value === 'inactive';
                  if (isInactive && newActive.has(name)) {
                    enqueue(sendTo(() => actorRef, { type: 'ACTIVATE' }));
                  }
                } catch {
                  // ignore snapshot errors
                }
              }
            }),

            // Send UPDATE_SEASON to all actors (use updated season from context)
            enqueueActions(({ enqueue, context }) => {
              for (const actorRef of Object.values(context.characters)) {
                enqueue(sendTo(() => actorRef, { type: 'UPDATE_SEASON', currentSeason: context.season }));
              }
            }),

            // Apply influence fear if applicable
            ({ context }) => {
              if (context.playerPersonality.influence > 0.6) {
                applyInfluenceFear(context.characters, context.playerPersonality.influence);
              }
            },

            // Check for faction membership offers
            ({ context, self }) => {
              console.log('Season advancement: Checking for faction membership offers');
              const offers = checkFactionMembershipOffers(context.factionSystem, context.characters);
              console.log(`Found ${offers.length} potential offers, existing offers:`, context.factionSystem.membershipOffers.map(o => o.faction));
              
              for (const faction of offers) {
                if (!context.factionSystem.membershipOffers.some(offer => offer.faction === faction)) {
                  console.log(`Sending faction membership offer for ${faction}`);
                  self.send({ type: 'FACTION_MEMBERSHIP_OFFERED', faction });
                } else {
                  console.log(`${faction} offer already exists, skipping`);
                }
              }
            }
          ],
          always: {
            target: "in_season"
          }
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
                guard: {
                  type: "emperor_loyalty_bypass",
                },
                target: 'in_season',
                actions: () => {
                  alert("Your perceived loyalty saves you from execution.");
                }
              },
              {
                target: '#gameMachine.game_over',
                actions: assign({
                  gameEndReason: 'defeat'
                })
              }
            ],
            REFUSE: [
              {
                guard: {
                  type: "emperor_loyalty_bypass",
                },
                target: 'in_season',
                actions: () => {
                  alert("Your perceived loyalty saves you from execution.");
                }
              },
              {
                target: '#gameMachine.game_over',
                actions: assign({
                  gameEndReason: 'defeat'
                })
              }
            ]
          }
        },
      },
    },
    game_over: {
      on: {
        RESTART_GAME: {
          target: 'choosing_character',
          actions: [
            // Stop all character actors before resetting
            ({ context, self }) => {
              Object.keys(context.characters).forEach(characterName => {
                self.system.get(characterName)?.stop();
              });
            },
            assign({
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
              playerReputation: {
                perceivedThreat: 0.3,
                perceivedLoyalty: 0.5,
                trustworthiness: 0.6,
                politicalSkill: 0.4
              },
              suspiciousCharacters: [],
              lastCharacterResponse: "",
              gameEndReason: null,
              factionSystem: {
                factions: {
                  Rebel: [],
                  Imperial: [],
                  Loyalist: [],
                  Independent: []
                },
                playerFaction: null,
                membershipOffers: []
              }
            })
          ]
        }
      },
    },
  }
});


import {giveRomanticGift,proposeRomance,endRomance,seasonalRomanceJealousy,romancePairEligibility,romanceWitnessRisk,type RomanceAction,type RomanceReceipt} from '../lib/courtRomance';
import {createDemotionNotice,type DemotionNotice} from '../lib/demotionNotice';
import {recordGiftNotification,readCourtNotificationIds,type GiftNotification} from '../lib/courtNotifications';
import {FIRST_EMPEROR_VISIT_SECONDS,validFirstVisitTick} from '../lib/firstEmperorVisit';
import {emptyCourtPlots,defusedPlotNames,cancelDefusedPlots,resolveCourtSeason,type CourtPlots,type DeceasedCourtier,type PlotSituation,type PlotEvent} from '../lib/courtPlots';
import {clampCourtInfluence} from '../lib/courtHierarchy';
import {createCourtGraph,reduceCourtRelation,courtRelation,setPlayerGraphFaction,updateCourtNode,PLAYER_NODE,type CourtGraph,type RelationshipCommand} from '../lib/courtGraph';
import type {RelationshipOrigin} from './character-machine';
import {campaignRandom,nextCampaignRandom,freshCampaignSeed} from '../lib/campaignRandom';
import {standingAfterDemotion,endorsementRenewal} from '../lib/campaignStanding';
import {displacedOfficeForRank} from '../lib/courtIdentity';
import { setup, sendTo, stopChild, enqueueActions, fromPromise } from "xstate";
import type { ActorRefFrom } from "xstate";
import { assign } from "xstate";
import { initialCharacters, createInitialCharacters } from '../data/characters.ts'
import { characterMachine } from './character-machine.ts'
import type { PlayerStats, PlayerReputation } from "../types/game.ts";
import type { Character, InitialCharacterType } from "../types/character.ts";
import { getResponseByType } from "../lib/getResponse.ts";
import { getSupportThreshold } from "../lib/helpers.ts";
import { getPersonality } from "../lib/helpers.ts";
import { updatePlayerVector, canBypassEmperorExecution } from "../lib/playerVector.ts";
import { applyInitialInfluenceFear, applyInfluenceFear } from "../lib/influenceFear.ts";
import { checkFactionMembershipOffers, assignCharacterFaction, applyFactionMembershipEffects, type FactionSystem, type FactionType } from "../lib/factionSystem.ts";
import { calculateSpitInFaceEffects, calculateLoyalActionBenefits, applyCrossCharacterEffects, generateCrossCharacterNotification } from "../lib/crossCharacterEffects.ts";
import { shouldOfferEmperorAudience, determineVictoryPath, extractGameContext, isAtMaxSuspicion } from "../lib/emperorAudience.ts";
import type { VictoryPath } from "../types/emperorAudience.ts";
import { emperorAudienceMachine } from "./emperor-audience-machine.ts";
import { giftMessage, validGiftRequestId, validGiftResult, type MessageChoice } from '../lib/giftMessages.ts';
import { processGiftWithMessage, type GiftWithMessageResult } from '../lib/checkMessage.ts';
import { getInfluenceGating } from '../lib/influenceGating.ts';
import { giftCost } from '../lib/courtStrategy.ts';
import { CAMPAIGN_BALANCE as B, earnedInfluence, mayPromote, promotionRequirement, globalSupportReward, giftPositiveScale, emperorEncounterChance, demotedRank, seasonalGiftGrant, rankIndex, promotionHate, tributeCost, courtierGiftAmount } from '../lib/campaignBalance';
import { promotionDeadline } from '../lib/careerDeadline';
import { careerEntryZone, careerZoneAccess, resolveCareer, type CareerRank, type PalaceZone } from '../lib/careerAccess';
import { witnessedRebelGift, isPromotionRival, careerSeniorRival, opposingFactions, type CourtWitness } from '../lib/courtIntrigue';


// Helper functions for character pool selection
function randInt(min: number, max: number, random:()=>number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[],random:()=>number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function selectCharacterPool(
  allCharacters: InitialCharacterType[],
  playerPath: 'prince' | 'minister' | 'concubine' | null,
  excludedMajorName?: string | null,
  playerRank?: CareerRank | 'empress_consort' | null,
  returningContacts:readonly string[]=[],
  random:()=>number=Math.random
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

  fillFrom(shuffle(preferredMajors,random));
  fillFrom(shuffle(otherMajors,random));

  // --- The rest of the logic remains the same ---

  const returning=shuffle(allCharacters.filter(c=>!majorNames.includes(c.name)&&returningContacts.includes(c.name)),random).slice(0,B.returningContacts);
  chosenMajors.push(...returning);
  const remainingCharacters = allCharacters.filter((c) => !majorNames.includes(c.name)&&!returning.some(r=>r.name===c.name));
  const totalSlots = randInt(B.activeCastMin, B.activeCastMax,random);
  const additionalSlots = Math.max(0, totalSlots - chosenMajors.length);

  if (!playerPath) {
    return [...chosenMajors, ...shuffle(remainingCharacters,random).slice(0, additionalSlots)];
  }

  const thematicCandidates = remainingCharacters.filter((c) => c.paths?.includes(playerPath));
  const varietyCandidates = remainingCharacters.filter((c) => !c.paths?.includes(playerPath));
  const thematicSlots = Math.round(additionalSlots * 0.6);
  const selectedThematic = shuffle(thematicCandidates,random).slice(0, Math.min(thematicSlots, thematicCandidates.length));
  const remainingSlots = additionalSlots - selectedThematic.length;
  const selectedVariety = shuffle(varietyCandidates,random).slice(0, remainingSlots);

  return [...chosenMajors, ...selectedThematic, ...selectedVariety];
}


type CharRef = ActorRefFrom<typeof characterMachine>;
function plotSituation(c:{relationshipGraph?:CourtGraph;characterType:string|null;rank:string|null;playerPersonality:PlayerStats;characters:Record<string,CharRef>}):PlotSituation {
 return{graph:c.relationshipGraph!,role:c.characterType,rank:c.rank,playerInfluence:c.playerPersonality.influence,influenceByName:Object.fromEntries(Object.entries(c.characters).map(([name,a])=>[name,a.getSnapshot().context.personalityVectors.influence]))};
}

type GiftResponse = Parameters<typeof getResponseByType>[1];
type PendingGift = {
  requestId: string; sessionId: number; characterId: string; actor: CharRef;
  messageType: MessageChoice; cost: number; character: Character;
  playerType: 'prince' | 'minister' | 'concubine'; playerStats: PlayerStats;
  zone: PalaceZone; witnesses: CourtWitness[]; recipientFaction: FactionType;
  phase: 'evaluating' | 'applying' | 'settling'; result: GiftWithMessageResult | null;
};
type GiftReceipt = { requestId: string; sessionId: number; characterId: string; sequence: number; message: string; cost:number; supportDelta:number; globalRenewal:number };

export const gameMachine = setup({
  types: {
    context: {
      characterType: null,
      season: 1,
      seasonAdvancePending: false,
      giftsRemaining: B.startingGifts,
      courtGiftSeasons:{},giftNotifications:[],readCourtNotificationIds:[],pendingCourtGifts:[],demotionNotice:null,processedRomanceRequests:[],lastRomanceReceipt:null,
      giftSessionId: 1,
      firstEmperorVisitDone:false,firstEmperorVisitElapsed:0,
      rngState: 0,
      pendingGift: null,
      processedGiftRequests: [],
      lastGiftReceipt: null,
      giftError: '',
      supportPoints: 0,
      rank: null,
      rankEnteredSeason: 1,
      promotionEligibleAfterSeason: 1,
      rewardedRanks: [],
      standingAwards: [],
      standingRecovery: false,
      standingRenewals: {},
      displacedOffices: [],
      expelledCourtiers: {},
      consortBacklashApplied: false,
      successfulDiplomacyThisSeason: [],
      currentZone: 'library',
      presentCharacterNames: [],
      presenceReady: false,
      careerNotice: '',
      careerEnding: null,
      tributeResult: '', 
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
      },
      emperorAudienceCompleted: false,
      emperorAudienceDeferredUntilSeason: 0,
      emperorAudienceVictoryPath: null,
      emperorAudienceOutcome: null,
      emperorMessage: ''
    } as
      {
        characterType: 'prince' | 'minister' | 'concubine' | null;
        season: number;
        seasonAdvancePending: boolean;
        giftsRemaining: number;
        lastSeasonGiftGrant?: number;
        relationshipGraph?:CourtGraph;
        courtPlots?:CourtPlots;
        deceasedCourtiers?:Record<string,DeceasedCourtier>;
        assassinationDeath?:PlotEvent|null;
        seasonSettlementPending?:boolean;
        courtGiftSeasons?:Record<string,number>;
        giftNotifications?:GiftNotification[];
        readCourtNotificationIds?:string[];
        processedRomanceRequests?:string[];
        lastRomanceReceipt?:RomanceReceipt|null;
        pendingCourtGifts?:string[];
        demotionNotice?:DemotionNotice|null;
        pendingIntrigueSeason?:number|null;
        pendingPlotResolution?:ReturnType<typeof resolveCourtSeason>|null;
        graphAppliedCommands?:Record<string,number>;
        rivalInfluenceHighWater?: number;
        rivalInfluenceGain?: number;
        promotionRivals?: string[];
        firstEmperorVisitDone?: boolean;
        firstEmperorVisitElapsed?: number;
        giftSessionId: number;
        rngState: number;
        pendingGift: PendingGift | null;
        processedGiftRequests: string[];
        lastGiftReceipt: GiftReceipt | null;
        giftError: string;
        supportPoints: number;
        rank: CareerRank | 'empress_consort' | null;
        rankEnteredSeason: number;
        consolidationWaived?:boolean;
        promotionEligibleAfterSeason: number;
        rewardedRanks: string[];
        standingAwards: string[];
        standingRecovery: boolean;
        standingRenewals: Record<string,number>;
        displacedOffices: string[];
        expelledCourtiers: Record<string,{name:string;season:number;byRank:string;faction:FactionType;pledged:boolean}>;
        consortBacklashApplied: boolean;
        successfulDiplomacyThisSeason: string[];
        currentZone: PalaceZone;
        presentCharacterNames: string[];
        presenceReady: boolean;
        careerNotice: string;
        careerEnding: {title:string;description:string}|null;
        tributeResult: string;
        characters: Record<string, CharRef>,
        activeCharacterNames: string[],
        playerPersonality: PlayerStats,
        playerReputation: PlayerReputation,
        suspiciousCharacters: string[],
        lastCharacterResponse: string,
        gameEndReason: 'victory' | 'defeat' | null,
        factionSystem: FactionSystem,
        emperorAudienceCompleted: boolean,
        emperorAudienceDeferredUntilSeason: number,
        emperorAudienceVictoryPath: VictoryPath | null,
        emperorAudienceOutcome: 'victory' | 'execution' | 'failure' | null,
        emperorMessage: string
      },
    events: {} as
      {type:"FIRST_EMPEROR_VISIT_TICK";seconds:number}|{type:"EMPEROR_INTRO_FINISHED"}|
      {type:"SETTLE_SEASON";season:number;stage:1|2} | {type:"RESOLVE_COURT_SEASON";season:number;stage:1|2} |
      {type:"RELATIONSHIP_COMMAND";name:string;actorId:string;serial:number;command:RelationshipCommand;origin:RelationshipOrigin}
      | { type: "INITIALIZE_GAME" }
      | { type: "UPDATE_PALACE_PRESENCE", zone:PalaceZone, names:string[] }
      | { type: "NEXT_SEASON" }
      | { type: "SEASON_EXPIRED" }
      | {type:'ROMANCE_ACTION';characterId:string;action:RomanceAction;requestId:string}
      | { type: "GIVE_GIFT_WITH_MESSAGE", characterId: string, messageType: MessageChoice, requestId: string }
      | { type: 'GIFT_APPLIED', characterId: string, requestId: string, sessionId: number, actorId: string, response: GiftResponse }
      | { type: 'FINALIZE_GIFT', requestId: string, sessionId: number }
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
      | { type: "READ_GIFT_NOTIFICATIONS" }
      | { type: "READ_COURT_NOTIFICATIONS" }
      | { type: "ACKNOWLEDGE_DEMOTION"; id:string }
      | { type: "JOIN_FACTION", faction: FactionType }
      | { type: "FACTION_MEMBERSHIP_OFFERED", faction: FactionType }
      | { type: "ENTER_AUDIENCE" }
      | { type: "REFUSE_AUDIENCE" }
      | { type: "EMPEROR_AUDIENCE_COMPLETE", outcome: 'victory' | 'execution' | 'failure' | null, message: string }
  },
  actors: {
    characterMachine: characterMachine,
    emperorAudienceMachine: emperorAudienceMachine,
    evaluateGift: fromPromise<GiftWithMessageResult, PendingGift>(async ({ input }) => processGiftWithMessage(
      input.messageType, input.character.personalityVectors, input.character.relationshipVectors,
      input.playerType, input.playerStats, input.character.supportLevel,
      {positiveEffectScale:giftPositiveScale(input.character,input.playerStats.influence)},
    ))
  },
  guards: {
    emperor_encountered: function ({ context }) {
      return context.season >= 2 && context.rngState/4294967296 < emperorEncounterChance(context.playerPersonality.influence);
    },
    emperor_gifting: function ({ context }) {
      return context.giftsRemaining >= tributeCost(context.characterType,context.rank);
    },
    emperor_loyalty_bypass: function ({ context }) {
      return canBypassEmperorExecution(context.giftsRemaining, context.playerReputation, tributeCost(context.characterType,context.rank));
    },
    canSubmitGift: function ({ context, event }) {
      if (event.type !== 'GIVE_GIFT_WITH_MESSAGE' || context.pendingGift || !context.characterType ||
          !validGiftRequestId(event.requestId) || !giftMessage(event.messageType) ||
          context.processedGiftRequests.includes(event.requestId) || !context.activeCharacterNames.includes(event.characterId)) return false;
      if(context.presenceReady && (!context.presentCharacterNames.includes(event.characterId)||!careerZoneAccess(context.characterType,context.rank,context.currentZone).allowed))return false;
      const actor = context.characters[event.characterId];
      const snapshot = actor?.getSnapshot();
      if (!snapshot || snapshot.status !== 'active' || snapshot.value !== 'alive' || !snapshot.context.type) return false;
      const character = { ...snapshot.context, type: snapshot.context.type };
      const access = getInfluenceGating(character, context.playerPersonality, context.rank);
      const messageAllowed = {
        ambitious: access.canUseAmbitiousMessage, loyal: access.canUseLoyalMessage,
        cautious: access.canUseCautiousMessage, neutral: access.canUseNeutralMessage,
      }[event.messageType];
      return access.canInteract.allowed && messageAllowed.allowed && context.giftsRemaining >= giftCost(character);
    },
    canBePromoted: function ({ context }) {
      // A failed audience's demotion lasts until the next advancing season.
      return !context.pendingGift && !context.seasonSettlementPending && mayPromote({role:context.characterType,rank:context.rank,support:context.supportPoints,influence:context.playerPersonality.influence,season:context.season,eligibleAfterSeason:context.promotionEligibleAfterSeason}) && !context.emperorAudienceCompleted;
    },
    careerDeadlineExpired: ({context}) => !context.pendingGift && !context.seasonSettlementPending && !!promotionDeadline(context.characterType,context.rank,context.rankEnteredSeason,context.season)?.expired,
    shouldOfferEmperorAudience: function ({ context }) {
      return !context.pendingGift && !context.seasonSettlementPending && !context.pendingIntrigueSeason && shouldOfferEmperorAudience(context);
    }
  },
}).createMachine({
  context: {
    characterType: null,
    season: 1,
    seasonAdvancePending: false,
    giftsRemaining: B.startingGifts,
      courtGiftSeasons:{},giftNotifications:[],readCourtNotificationIds:[],pendingCourtGifts:[],demotionNotice:null,processedRomanceRequests:[],lastRomanceReceipt:null,
    giftSessionId: 1,
      firstEmperorVisitDone:false,firstEmperorVisitElapsed:0,
    rngState: 0,
    pendingGift: null,
    processedGiftRequests: [],
    lastGiftReceipt: null,
    giftError: '',
    supportPoints: 0,
    rank: null,
      rankEnteredSeason: 1,
      promotionEligibleAfterSeason: 1,
      rewardedRanks: [],
      standingAwards: [],
      standingRecovery: false,
      standingRenewals: {},
      displacedOffices: [],
      expelledCourtiers: {},
      consortBacklashApplied: false,
      successfulDiplomacyThisSeason: [],
      currentZone: 'library',
      presentCharacterNames: [],
      presenceReady: false,
      careerNotice: '',
      careerEnding: null,
      tributeResult: '', 
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
    },
    emperorAudienceCompleted: false,
    emperorAudienceDeferredUntilSeason: 0,
    emperorAudienceVictoryPath: null,
    emperorAudienceOutcome: null,
    emperorMessage: ''
  },
  on: {
    ACKNOWLEDGE_DEMOTION:{guard:({context,event})=>context.demotionNotice?.id===event.id,actions:assign(({context})=>({demotionNotice:{...context.demotionNotice!,acknowledged:true}}))},
    READ_GIFT_NOTIFICATIONS:{actions:assign(({context})=>({giftNotifications:(context.giftNotifications??[]).map(n=>({...n,read:true}))}))},
    READ_COURT_NOTIFICATIONS: {actions: assign(({context}) => ({
      giftNotifications: (context.giftNotifications ?? []).map(notification => ({...notification, read: true})),
      readCourtNotificationIds: readCourtNotificationIds(context.courtPlots),
    }))},
    RESOLVE_COURT_SEASON:[
      {guard:({context,event})=>event.stage===1&&context.pendingIntrigueSeason===event.season&&context.gameEndReason===null,actions:sendTo(({self})=>self,({event})=>({...event,stage:2 as const}))},
      {guard:({context,event})=>event.stage===2&&context.pendingIntrigueSeason===event.season&&context.gameEndReason===null,target:'.resolving_court_season'}
    ],
    RELATIONSHIP_COMMAND:{
      guard:({context,event})=>context.gameEndReason===null&&!!context.relationshipGraph&&context.characters[event.name]?.id===event.actorId&&event.serial===(context.graphAppliedCommands?.[event.name]??0)+1,
      actions:[
        assign(({context,event})=>{
          const changed=reduceCourtRelation(context.relationshipGraph!,event.name,PLAYER_NODE,event.command,context.season);
          let graph=changed.graph;
          if(event.origin.kind==='gift'){
            const person=context.characters[event.name].getSnapshot().context;
            const faction=changed.relation.pledge&&context.factionSystem.playerFaction?context.factionSystem.playerFaction:assignCharacterFaction({...person,type:person.type!,personalityVectors:{...event.origin.result.newPersonalityVectors,influence:clampCourtInfluence(person,event.origin.result.newPersonalityVectors.influence)}});
            graph=updateCourtNode(graph,event.name,{faction});
          }
          return{relationshipGraph:graph,graphAppliedCommands:{...context.graphAppliedCommands,[event.name]:event.serial}};
        }),
        ({context,event})=>{
          const actor=context.characters[event.name],relation=courtRelation(context.relationshipGraph!,event.name,PLAYER_NODE);
          actor.send({type:'APPLY_RELATIONSHIP_PROJECTION',serial:event.serial,relation,origin:event.origin,newlyPledged:!!relation.pledge&&!actor.getSnapshot().context.hasGivenAllegiance});
        }
      ]
    }
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
            currentZone: ({event}) => careerEntryZone(event.payload.type),
            giftsRemaining: ({event}) => seasonalGiftGrant(event.payload.type,null),
            consolidationWaived:false, rivalInfluenceHighWater: undefined, rivalInfluenceGain:0, promotionRivals:[], relationshipGraph:undefined,graphAppliedCommands:{},courtPlots:emptyCourtPlots(),deceasedCourtiers:{},assassinationDeath:null,seasonSettlementPending:false,pendingIntrigueSeason:null,pendingPlotResolution:null,
            lastSeasonGiftGrant: ({event}) => seasonalGiftGrant(event.payload.type,null),
          })
        },
      },
    },
    initialize_game: {
      on: {
        INITIALIZE_GAME: {
          target: "playing",
          actions: [
            // One seeded stream creates all personalities and the first cast.
            assign(({spawn,context})=>{
              const random=campaignRandom(context.rngState||freshCampaignSeed());
              const roster=createInitialCharacters(()=>random.next());
              const characters:Record<string,CharRef>={};
              for(const charData of roster)characters[charData.name]=spawn('characterMachine',{
                input:{...charData,supportThreshold:getSupportThreshold(context.characterType),giftSessionId:context.giftSessionId},syncSnapshot:true
              }) as CharRef;
              const selected=selectCharacterPool(roster,context.characterType,null,null,[],()=>random.next());
              return{playerPersonality:getPersonality(context.characterType),characters,activeCharacterNames:selected.map(c=>c.name),rngState:random.state,relationshipGraph:updateCourtNode(createCourtGraph(roster,random.state),PLAYER_NODE,{office:resolveCareer(context.characterType)??'player'}),graphAppliedCommands:{}};
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
        UPDATE_PALACE_PRESENCE: {
          guard: ({context,event}) => careerZoneAccess(context.characterType,context.rank,event.zone).allowed,
          actions: assign(({context,event}) => ({currentZone:event.zone,presentCharacterNames:[...new Set(event.names)].filter(name=>context.activeCharacterNames.includes(name)),presenceReady:true})),
        },
        GIFT_APPLIED: {
          guard: ({ context, event }) => {
            const gift = context.pendingGift;
            return !!gift && gift.phase === 'applying' && event.requestId === gift.requestId &&
              event.sessionId === gift.sessionId && event.sessionId === context.giftSessionId &&
              event.characterId === gift.characterId && event.actorId === gift.actor.id &&
              context.characters[gift.characterId] === gift.actor && event.response === gift.result?.responseType &&
              gift.actor.getSnapshot().context.processedGiftRequests.includes(gift.requestId);
          },
          actions: [
            assign(({ context, event }) => {
              const gift = context.pendingGift!;
              const renewal=endorsementRenewal(gift.character,gift.result!.supportDelta,context.characterType,{recovery:context.standingRecovery,season:context.season,support:context.supportPoints,renewals:context.standingRenewals});
              const { updatedStats, updatedReputation } = updatePlayerVector(
                gift.messageType, gift.character, context.playerPersonality, context.playerReputation,
              );
              return {
                pendingGift: { ...gift, phase: 'settling' as const },
                supportPoints:Math.round((context.supportPoints+renewal)*100)/100,
                standingRenewals:renewal>0?{...context.standingRenewals,[gift.characterId]:context.season}:context.standingRenewals,
                playerPersonality: {...updatedStats,influence:earnedInfluence(updatedStats.influence,(
                  gift.result!.supportDelta>0 && !context.successfulDiplomacyThisSeason.includes(gift.characterId) ? B.successfulDiplomacyInfluence : 0)+renewal*B.influencePerStanding)},
                successfulDiplomacyThisSeason: gift.result!.supportDelta>0?[...new Set([...context.successfulDiplomacyThisSeason,gift.characterId])]:context.successfulDiplomacyThisSeason,
                playerReputation: updatedReputation,
                lastCharacterResponse: getResponseByType(gift.characterId, event.response),
                lastGiftReceipt: {
                  requestId: gift.requestId, sessionId: gift.sessionId, characterId: gift.characterId,
                  sequence: (context.lastGiftReceipt?.sequence ?? 0) + 1,
                  message: giftMessage(gift.messageType)!.text,cost:gift.cost,supportDelta:Math.round((gift.result!.newSupportLevel-gift.character.supportLevel)*100)/100,globalRenewal:renewal,
                },
              };
            }),
            ({ context }) => {
                const pending = context.pendingGift!;
                const target = context.characters[pending.characterId];
                if (!target) return;

                const snap = target.getSnapshot()?.context;
                if (!snap || !snap.type) return;

                // Cross-character effects
                type CrossEffects = ReturnType<typeof calculateLoyalActionBenefits>;
                const crossCharacterEffects: CrossEffects =
                  pending.messageType === "ambitious"
                    ? witnessedRebelGift(pending.messageType,pending.recipientFaction,pending.characterId,pending.zone,pending.witnesses)
                    : pending.messageType === "loyal"
                      ? calculateLoyalActionBenefits(Object.fromEntries(pending.witnesses.map(w=>[w.name,context.characters[w.name]])))
                      : ([] as CrossEffects);

                if (crossCharacterEffects.length > 0) {
                  applyCrossCharacterEffects(crossCharacterEffects, context.characters);
                  const note = generateCrossCharacterNotification(
                    crossCharacterEffects
                  );
                  if (note) {
                    // optional UI surface
                    console.log(note);
                  }
                }

                // Gifts change their recipient. Faction membership is not a free
                // global gift cascade; rebellious suspicion uses witnesses above.

            },
            // Queue after child/collateral reports. Automatic promotion cannot run
            // until this transaction has settled, so no delayed effects are lost.
            sendTo(({ self }) => self, ({ context }) => ({
              type: 'FINALIZE_GIFT', requestId: context.pendingGift!.requestId, sessionId: context.pendingGift!.sessionId,
            })),
          ],
        },
        FINALIZE_GIFT: {
          guard: ({ context, event }) => context.pendingGift?.phase === 'settling' &&
            context.pendingGift.requestId === event.requestId && context.pendingGift.sessionId === event.sessionId,
          target: '.in_season',
          actions: assign(({context})=>({pendingGift:null,factionSystem:{...context.factionSystem,membershipOffers:checkFactionMembershipOffers(context.factionSystem,context.characters).map(faction=>({faction,requiredMembers:3,supportThreshold:getSupportThreshold(context.characterType)}))}})),
        },
        CHARACTER_GAVE_SUPPORT: {
          guard: ({context,event}) => !context.standingAwards.includes(`backing:${event.name}`) && context.characters[event.name]?.getSnapshot().context.hasGivenSupport===true,
          actions: assign({
            standingAwards: ({context,event}) => [...context.standingAwards,`backing:${event.name}`],
            supportPoints: ({ context, event }) => {
              return context.supportPoints + globalSupportReward(context.characters[event.name].getSnapshot().context);
            },
            playerPersonality: ({context,event}) => ({...context.playerPersonality,influence:earnedInfluence(context.playerPersonality.influence,globalSupportReward(context.characters[event.name].getSnapshot().context)*B.influencePerStanding)})
          })
        },
        CHARACTER_GAVE_ALLEGIANCE: {
          guard: ({context,event}) => !context.standingAwards.includes(`pledge:${event.name}`) && context.characters[event.name]?.getSnapshot().context.hasGivenAllegiance===true,
          actions: [
            assign({
              supportPoints: ({ context, event }) => context.supportPoints + globalSupportReward(context.characters[event.name].getSnapshot().context),
              standingAwards: ({context,event}) => [...context.standingAwards,`pledge:${event.name}`],
              suspiciousCharacters: ({context,event}) => context.suspiciousCharacters.filter(name=>name!==event.name),
              playerPersonality: ({context,event}) => ({...context.playerPersonality,influence:earnedInfluence(context.playerPersonality.influence,globalSupportReward(context.characters[event.name].getSnapshot().context)*B.influencePerStanding)})
            }),
            ({context,event}) => {
              const faction=context.factionSystem.playerFaction;
              if(faction)context.characters[event.name]?.send({type:'FOLLOW_PLAYER_FACTION',faction});
            }
          ]
        },
        CHARACTER_GAVE_GIFTS: {
          guard:({context,event})=>!!context.characters[event.name]&&context.characters[event.name].getSnapshot().status==='active'&&
            context.characters[event.name].getSnapshot().context.hasGivenGifts&&
            (context.characters[event.name].getSnapshot().context.supportLevel>=100||context.characters[event.name].getSnapshot().context.legacyCourtshipGiftEligible)&&
            (context.courtGiftSeasons?.[event.name]??0)<context.season,
          actions:assign(({context,event})=>{
            if(context.seasonSettlementPending||context.pendingIntrigueSeason)return{pendingCourtGifts:[...new Set([...(context.pendingCourtGifts??[]),event.name])]};
            const amount=courtierGiftAmount(context.characters[event.name].getSnapshot().context.type);
            return{giftsRemaining:context.giftsRemaining+amount,
              courtGiftSeasons:{...context.courtGiftSeasons,[event.name]:context.season},
              giftNotifications:recordGiftNotification(context.giftNotifications??[],event.name,amount,context.season)};
          })
        },
        CHARACTER_IS_SUSPICIOUS: [
          { guard: ({context,event}) => !context.characters[event.name]||context.characters[event.name].getSnapshot().status!=='active'||Boolean(context.characters[event.name].getSnapshot().context.hasGivenAllegiance) },
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
                    supportThreshold: getSupportThreshold(context.characterType)
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
          guard: ({ context, event }) =>
            !context.pendingGift && !context.factionSystem.playerFaction &&
            event.faction !== 'Independent' &&
            checkFactionMembershipOffers(context.factionSystem,context.characters).includes(event.faction),
          actions: [
            assign({
              factionSystem: ({ context, event }) => ({
                ...context.factionSystem,
                playerFaction: event.faction,
                membershipOffers: [] // Clear all offers once joined
              })
            }),
            assign({relationshipGraph:({context,event})=>setPlayerGraphFaction(context.relationshipGraph!,event.faction)}),
            // A pledge is a durable personal alliance. Align it before faction bonuses/penalties.
            ({context,event}) => {
              for(const actor of Object.values(context.characters)){actor.send({type:'SET_PLAYER_FACTION',faction:event.faction});actor.send({type:'FOLLOW_PLAYER_FACTION',faction:event.faction});}
            },
            // Apply immediate faction membership effects
            ({ context, event }) => {
              console.log(`Player joining ${event.faction} faction - applying immediate effects`);
              const { bonuses, penalties } = applyFactionMembershipEffects(event.faction, context.characters);
              for(const actor of Object.values(context.characters)){const c=actor.getSnapshot().context;if(c.type&&!c.hasGivenAllegiance&&opposingFactions(event.faction,assignCharacterFaction({...c,type:c.type})))actor.send({type:'GAIN_HATE',amount:B.hateOnOpposingFaction});}

              // Apply bonuses
              console.log(`Applying ${bonuses.length} faction bonuses`);
              for (const bonus of bonuses) {
                const bonusActor = context.characters[bonus.characterName];
                if (bonusActor) {
                  console.log(`Sending faction bonus to ${bonus.characterName}`);
                  bonusActor.send({
                    type: 'APPLY_FACTION_BONUS',
                    supportBonus: bonus.supportBonus
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
                message += ` Gained support with: ${bonusNames}.`;
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
        { guard:({context})=>!context.pendingGift&&!context.seasonSettlementPending&&context.rivalInfluenceHighWater!==undefined&&context.playerPersonality.influence>context.rivalInfluenceHighWater+1e-9,target:'applying_influence_rivalry' },
        {guard:({context})=>!context.pendingGift&&!context.seasonSettlementPending&&!!context.courtPlots&&defusedPlotNames(plotSituation(context),context.courtPlots).length>0,target:'clearing_court_plots'},
        { guard: 'careerDeadlineExpired', target: 'career_deadline' },
        {
          guard: { type: "canBePromoted" },
          target: 'promotion_processing'
        },
        {
          guard: { type: "shouldOfferEmperorAudience" },
          target: 'emperor_audience_offer'
        }
      ],
      states: {
        in_season: {
          on: {
            FIRST_EMPEROR_VISIT_TICK:[
              {guard:({context,event})=>context.firstEmperorVisitDone===false&&validFirstVisitTick(event.seconds)&&(context.firstEmperorVisitElapsed??0)+event.seconds>=FIRST_EMPEROR_VISIT_SECONDS,
                target:'emperor_intro',actions:assign({firstEmperorVisitElapsed:FIRST_EMPEROR_VISIT_SECONDS})},
              {guard:({context,event})=>context.firstEmperorVisitDone===false&&validFirstVisitTick(event.seconds),
                actions:assign({firstEmperorVisitElapsed:({context,event})=>(context.firstEmperorVisitElapsed??0)+event.seconds})},
            ],
            SEASON_EXPIRED: { target: "checking_encounters", actions: assign({ seasonAdvancePending: true }) },
            NEXT_SEASON: [
              {
                target: "checking_encounters",
                actions: assign({ seasonAdvancePending: true }),
              }],
            ROMANCE_ACTION:{
              guard:({context,event})=>{
                const actor=context.characters[event.characterId],snap=actor?.getSnapshot(),graph=context.relationshipGraph;
                if(context.pendingGift||!graph||!snap?.context.type||snap.value!=='alive'||!context.activeCharacterNames.includes(event.characterId)||!validGiftRequestId(event.requestId)||(context.processedRomanceRequests??[]).includes(event.requestId)||!['gift','propose','end'].includes(event.action))return false;
                if(!romancePairEligibility(graph,PLAYER_NODE,event.characterId).allowed)return false;
                if(context.presenceReady&&(!context.presentCharacterNames.includes(event.characterId)||!careerZoneAccess(context.characterType,context.rank,context.currentZone).allowed))return false;
                if(!getInfluenceGating({...snap.context,type:snap.context.type},context.playerPersonality,context.rank).canInteract.allowed)return false;
                return event.action==='gift'?context.giftsRemaining>=giftCost({...snap.context,type:snap.context.type}):event.action==='end'?!!courtRelation(graph,event.characterId,PLAYER_NODE).romance:!courtRelation(graph,event.characterId,PLAYER_NODE).romance;
              },
              actions:[
                assign(({context,event})=>{
                  let graph=context.relationshipGraph!;let cost=0,affectionDelta=0,accepted=false,response='';
                  if(event.action==='gift'){
                    const p=context.characters[event.characterId].getSnapshot().context;cost=giftCost({...p,type:p.type!});
                    const result=giveRomanticGift(graph,PLAYER_NODE,event.characterId,context.season);graph=result.graph;affectionDelta=result.affectionDelta;
                    response=affectionDelta>0?'Thank you. This feels personal. I’m glad you thought of me.':'Your kindness is appreciated. My affection is already at its highest.';
                  }else if(event.action==='propose'){
                    const result=proposeRomance(graph,PLAYER_NODE,event.characterId,context.season,context.characterType);graph=result.graph;accepted=result.accepted;response=result.reason;
                  }else{graph=endRomance(graph,PLAYER_NODE,event.characterId,context.season);response='I understand. We are no longer lovers.';}
                  const witnesses=event.action==='end'?[]:romanceWitnessRisk(context.characterType,context.currentZone,context.presentCharacterNames.flatMap(name=>{
                    const p=context.characters[name]?.getSnapshot().context;return p?[{name,pledged:p.hasGivenAllegiance,suspicion:p.suspicion,suspicionThreshold:p.suspicionThreshold,zone:context.currentZone}]:[];
                  }));
                  const receipt:RomanceReceipt={requestId:event.requestId,characterId:event.characterId,action:event.action,season:context.season,cost,affectionDelta,accepted,response,witnesses:witnesses.map(w=>w.name),reportingWitnesses:witnesses.filter(w=>w.reports).map(w=>w.name)};
                  return{relationshipGraph:graph,giftsRemaining:context.giftsRemaining-cost,processedRomanceRequests:[...(context.processedRomanceRequests??[]),event.requestId],lastRomanceReceipt:receipt,lastCharacterResponse:`${event.characterId}: ${response}`};
                }),
                ({context,event})=>{
                  context.characters[event.characterId]?.send({type:'SYNC_ROMANCE_PROJECTION',relation:courtRelation(context.relationshipGraph!,event.characterId,PLAYER_NODE),response:`${event.characterId}: ${context.lastRomanceReceipt!.response}`});
                  for(const name of context.lastRomanceReceipt!.witnesses)context.characters[name]?.send({type:'APPLY_ROMANCE_SUSPICION'});
                }
              ]
            },
            GIVE_GIFT_WITH_MESSAGE: {
              guard: 'canSubmitGift',
              target: 'gift_processing',
              actions: assign(({ context, event }) => {
                const actor = context.characters[event.characterId];
                const snapshot = actor.getSnapshot().context;
                const character = { ...snapshot, type: snapshot.type!,personalityVectors:{...snapshot.personalityVectors,suspicion:snapshot.suspicion} };
                const cost = giftCost(character);
                return {
                  pendingGift: {
                    requestId: event.requestId, sessionId: context.giftSessionId, characterId: event.characterId,
                    actor, messageType: event.messageType, cost, character,
                    zone:context.currentZone,recipientFaction:assignCharacterFaction(character),
                    witnesses:context.presentCharacterNames.flatMap(name=>{const data=context.characters[name]?.getSnapshot().context;return data?.type?[{name,faction:assignCharacterFaction({...data,type:data.type}),pledged:data.hasGivenAllegiance,hate:data.hate,zone:context.currentZone}]:[]}),
                    playerType: context.characterType!, playerStats: { ...context.playerPersonality },
                    phase: 'evaluating' as const, result: null,
                  },
                  giftsRemaining: context.giftsRemaining - cost,
                  processedGiftRequests: [...context.processedGiftRequests, event.requestId],
                  giftError: '',
                };
              }),
            },
            SPIT_IN_FACE: {
              guard: ({context,event})=>{
                const actor=context.characters[event.characterId],snap=actor?.getSnapshot();
                if(!snap?.context.type||snap.value!=='alive'||!context.activeCharacterNames.includes(event.characterId))return false;
                if(context.presenceReady&&(!context.presentCharacterNames.includes(event.characterId)||!careerZoneAccess(context.characterType,context.rank,context.currentZone).allowed))return false;
                return getInfluenceGating({...snap.context,type:snap.context.type},context.playerPersonality,context.rank).canSpitInFace.allowed;
              },
              actions: [
                assign({ lastCharacterResponse: "" }),
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
                      if (!targetSnapshot?.context?.type) return;

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
        gift_processing: {
          invoke: {
            src: 'evaluateGift',
            input: ({ context }) => context.pendingGift!,
            onDone: [
              {
                guard: ({ context, event }) => {
                  const gift = context.pendingGift;
                  return validGiftResult(event.output) && !!gift && gift.phase === 'evaluating' && context.characters[gift.characterId] === gift.actor &&
                    context.activeCharacterNames.includes(gift.characterId) && gift.actor.getSnapshot().status === 'active' &&
                    gift.actor.getSnapshot().value === 'alive';
                },
                actions: [
                  assign({ pendingGift: ({ context, event }) => ({ ...context.pendingGift!, phase: 'applying', result: event.output }) }),
                  sendTo(({ context }) => context.pendingGift!.actor, ({ context }) => ({
                    type: 'APPLY_EVALUATED_GIFT', requestId: context.pendingGift!.requestId,
                    sessionId: context.pendingGift!.sessionId, messageType: context.pendingGift!.messageType,
                    result: context.pendingGift!.result!,
                  })),
                ],
              },
              {
                target: 'in_season',
                actions: assign(({ context }) => ({
                  giftsRemaining: context.giftsRemaining + (context.pendingGift?.cost ?? 0),
                  pendingGift: null, giftError: 'The gift could not be completed. Your gift was returned.',
                })),
              },
            ],
            onError: {
              target: 'in_season',
              actions: assign(({ context }) => ({
                giftsRemaining: context.giftsRemaining + (context.pendingGift?.cost ?? 0),
                pendingGift: null, giftError: 'The message could not be evaluated. Your gift was returned.',
              })),
            },
          },
        },
        checking_encounters: {
          entry:assign({rngState:({context})=>nextCampaignRandom(context.rngState).state}),
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
            // This state is reached once only after an actual completed season,
            // including payment of any pending tribute. Reload does not reenter it.
            ({context})=>{if(rankIndex(context.characterType,context.rank)===2)for(const actor of Object.values(context.characters))actor.send({type:'GAIN_HATE',amount:5});},
            assign(({context})=>{
              const random=campaignRandom(context.rngState);
              const contacts=Object.entries(context.characters).filter(([,actor])=>{const p=actor.getSnapshot().context;return p.supportLevel>0&&(p.supportLevel<100||context.standingRecovery);}).map(([name])=>name);
              const selected=selectCharacterPool(initialCharacters.filter(c=>context.characters[c.name]),context.characterType,null,context.rank,contacts,()=>random.next());
              const deadline=promotionDeadline(context.characterType,context.rank,context.rankEnteredSeason,context.season+1);
              const grantRank=deadline?.expired && deadline.outcome.kind==='demotion'?demotedRank(context.characterType,context.rank):context.rank;
              const giftGrant=seasonalGiftGrant(context.characterType,grantRank);
              return{season:context.season+1,seasonAdvancePending:false,seasonSettlementPending:true,giftsRemaining:context.giftsRemaining+giftGrant,lastSeasonGiftGrant:giftGrant,
                successfulDiplomacyThisSeason:[],presenceReady:false,presentCharacterNames:[],
                emperorAudienceCompleted:context.emperorAudienceOutcome==='failure'?false:context.emperorAudienceCompleted,
                activeCharacterNames:selected.map(c=>c.name),rngState:random.state};
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
            },
            sendTo(({self})=>self,({context})=>({type:'SETTLE_SEASON',season:context.season,stage:1 as const}))
          ],
          always: {target:'settling_season'}
        },
        settling_season:{on:{SETTLE_SEASON:[
          {guard:({context,event})=>event.stage===1&&!!context.seasonSettlementPending&&context.season===event.season,actions:sendTo(({self})=>self,({event})=>({...event,stage:2 as const}))},
          {guard:({context,event})=>event.stage===2&&!!context.seasonSettlementPending&&context.season===event.season,target:'in_season',actions:[assign({seasonSettlementPending:false,pendingIntrigueSeason:({context})=>context.season}),sendTo(({self})=>self,({context})=>({type:'RESOLVE_COURT_SEASON',season:context.season,stage:1 as const}))]}
        ]}},
        after_emperor: {
          always: [
            { guard: ({ context }) => context.seasonAdvancePending, target: 'advancing_season' },
            { target: 'in_season' }
          ]
        },
        emperor_intro:{
          entry:assign({firstEmperorVisitDone:true}),
          on:{EMPEROR_INTRO_FINISHED:{target:'in_season'}},
        },
        emperor_encounter: {
          entry:assign({firstEmperorVisitDone:true,firstEmperorVisitElapsed:({context})=>context.firstEmperorVisitElapsed??FIRST_EMPEROR_VISIT_SECONDS}),
          on: {
            GIVE_EMPEROR_GIFT: [
              {
                guard: {
                  type: "emperor_gifting",
                },
                target: 'after_emperor',
                actions: assign(({context})=>{
                  const draw=nextCampaignRandom(context.rngState),favored=draw.value<B.tributeFavorChance;
                  const influence=earnedInfluence(context.playerPersonality.influence,favored?B.tributeInfluenceReward:0),gain=Math.round((influence-context.playerPersonality.influence)*10000)/100;
                  return {rngState:draw.state,giftsRemaining:context.giftsRemaining-tributeCost(context.characterType,context.rank),
                    playerPersonality:{...context.playerPersonality,influence},
                    tributeResult:favored?`The Emperor favors your tribute. Influence +${gain}.`:'The Emperor receives your tribute without comment.'};
                }),
              },
              {
                guard: {
                  type: "emperor_loyalty_bypass",
                },
                target: 'after_emperor',
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
                target: 'after_emperor',
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
      entry: assign({ pendingGift:null,seasonSettlementPending:false,pendingIntrigueSeason:null,pendingPlotResolution:null,pendingCourtGifts:[] }),
      on: {
        RESTART_GAME: {
          target: 'choosing_character',
          actions: [
            // Stop all character actors before resetting
            enqueueActions(({ enqueue, context }) => {
              for (const actorRef of Object.values(context.characters)) {
                enqueue(stopChild(actorRef));
              }
            }),
            assign({
              characterType: null,
              season: 1,
              seasonAdvancePending: false,
              giftsRemaining: B.startingGifts,
      courtGiftSeasons:{},giftNotifications:[],readCourtNotificationIds:[],pendingCourtGifts:[],demotionNotice:null,processedRomanceRequests:[],lastRomanceReceipt:null,
              giftSessionId: ({ context }) => context.giftSessionId + 1,
              firstEmperorVisitDone:false,firstEmperorVisitElapsed:0,
              rngState: 0,
              pendingGift: null,
              processedGiftRequests: [],
              lastGiftReceipt: null,
              giftError: '',
              supportPoints: 0,
              rank: null,
      rankEnteredSeason: 1,
      promotionEligibleAfterSeason: 1,
      rewardedRanks: [],
      standingAwards: [],
      standingRecovery: false,
      standingRenewals: {},
      displacedOffices: [],
      expelledCourtiers: {},
      consortBacklashApplied: false,
      successfulDiplomacyThisSeason: [],
      currentZone: 'library',
      presentCharacterNames: [],
      presenceReady: false,
      careerNotice: '',
      careerEnding: null,
      tributeResult: '', 
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
              },
              emperorAudienceCompleted: false,
              emperorAudienceDeferredUntilSeason: 0,
              emperorAudienceVictoryPath: null,
              emperorAudienceOutcome: null,
              emperorMessage: ''
            })
          ]
        }
      },
    },
    clearing_court_plots:{entry:assign(({context})=>({courtPlots:cancelDefusedPlots(plotSituation(context),context.courtPlots!,context.season)})),always:{target:'playing'}},
    resolving_court_season:{
      entry:[
        assign(({context})=>({relationshipGraph:context.season>(context.courtPlots?.lastProcessedSeason??context.season-1)?seasonalRomanceJealousy(context.relationshipGraph!,context.season):context.relationshipGraph})),
        assign(({context})=>({pendingPlotResolution:resolveCourtSeason(plotSituation(context),context.courtPlots??emptyCourtPlots(context.season-1),context.season,context.rngState)})),
        enqueueActions(({context,enqueue})=>{for(const victim of context.pendingPlotResolution!.casualties){const actor=context.characters[victim.name];if(actor)enqueue(stopChild(actor));}}),
        assign(({context})=>{
          const result=context.pendingPlotResolution!,characters={...context.characters},deceasedCourtiers={...context.deceasedCourtiers};
          for(const victim of result.casualties){delete characters[victim.name];deceasedCourtiers[victim.name]=victim;}
          const factions:FactionSystem['factions']={Rebel:[],Imperial:[],Loyalist:[],Independent:[]};
          for(const [name,actor]of Object.entries(characters)){const p=actor.getSnapshot().context;if(p.type)factions[assignCharacterFaction({...p,type:p.type})].push(name);}
          const factionSystem={...context.factionSystem,factions};
          factionSystem.membershipOffers=checkFactionMembershipOffers(factionSystem,characters).map(faction=>({faction,requiredMembers:3,supportThreshold:getSupportThreshold(context.characterType)}));
          // Settle pledged income only after casualties. Every living pledge counts,
          // regardless of zone, support or actor visibility. One ledger also covers
          // the original courtship gift so it cannot be paid twice this season.
          const courtGiftSeasons={...context.courtGiftSeasons};let allyIncome=0,giftNotifications=context.giftNotifications??[];
          if(!result.playerDeath)for(const [name,actor]of Object.entries(characters)){
            if((courtRelation(result.graph,name,PLAYER_NODE).pledge||context.pendingCourtGifts?.includes(name))&&(courtGiftSeasons[name]??0)<context.season){
              const amount=courtierGiftAmount(actor.getSnapshot().context.type);allyIncome+=amount;courtGiftSeasons[name]=context.season;
              giftNotifications=recordGiftNotification(giftNotifications,name,amount,context.season);
            }
          }
          return{courtGiftSeasons,giftNotifications,pendingCourtGifts:[],giftsRemaining:context.giftsRemaining+allyIncome,characters,deceasedCourtiers,relationshipGraph:result.graph,courtPlots:result.plots,rngState:result.rngState,pendingPlotResolution:null,pendingIntrigueSeason:null,seasonSettlementPending:false,
            activeCharacterNames:context.activeCharacterNames.filter(name=>characters[name]),presentCharacterNames:context.presentCharacterNames.filter(name=>characters[name]),suspiciousCharacters:context.suspiciousCharacters.filter(name=>characters[name]),factionSystem,
            assassinationDeath:result.playerDeath,
            ...(result.playerDeath?{gameEndReason:'defeat' as const,careerEnding:{title:'Assassinated at court',description:`${result.playerDeath.attacker}'s plot succeeded. No living pledged ally remained to shield you.`}}:{})};
        })
      ],always:[{guard:({context})=>!!context.assassinationDeath,target:'game_over'},{target:'playing'}]
    },
    applying_influence_rivalry: {
      entry:[
        ({context})=>{
          const gain=context.rivalInfluenceGain??0,newGain=gain+Math.max(0,context.playerPersonality.influence-(context.rivalInfluenceHighWater??context.playerPersonality.influence));
          const milestones=Math.floor((newGain+1e-9)*10)-Math.floor((gain+1e-9)*10);
          if(milestones>0)for(const name of context.promotionRivals??[])context.characters[name]?.send({type:'GAIN_HATE',amount:milestones*B.hatePerInfluenceMilestone});
        },
        assign(({context})=>({rivalInfluenceGain:(context.rivalInfluenceGain??0)+Math.max(0,context.playerPersonality.influence-(context.rivalInfluenceHighWater??context.playerPersonality.influence)),rivalInfluenceHighWater:context.playerPersonality.influence}))
      ],always:{target:'playing'}
    },
    career_deadline: {
      entry: assign(({context})=>{
        const deadline=promotionDeadline(context.characterType,context.rank,context.rankEnteredSeason,context.season)!;
        if(deadline.outcome.kind==='career_ending')return {careerEnding:deadline.outcome,gameEndReason:'defeat' as const};
        const rank=demotedRank(context.characterType,context.rank);
        return {rank,demotionNotice:createDemotionNotice(context.characterType,context.rank,context.season,'deadline'),consolidationWaived:false,relationshipGraph:updateCourtNode(context.relationshipGraph!,PLAYER_NODE,{office:rank??resolveCareer(context.characterType)!}),rankEnteredSeason:context.season,supportPoints:standingAfterDemotion(context.characterType,rank),standingRecovery:true,standingRenewals:{},promotionEligibleAfterSeason:context.season+B.demotionProbationSeasons,
          currentZone:careerZoneAccess(context.characterType,rank,context.currentZone).allowed?context.currentZone:careerEntryZone(context.characterType),
          presenceReady:false,presentCharacterNames:[],emperorAudienceCompleted:false,
          playerPersonality:{...context.playerPersonality,influence:Math.max(0,context.playerPersonality.influence-B.demotionInfluenceLoss)},
          careerNotice:`Your deadline passed. You have been demoted one rank. Re-promotion is unavailable for ${B.demotionProbationSeasons} seasons; your personal relationships remain. Positive message-gifts can renew global backing once per supporter each season.`};
      }),
      always:[{guard:({context})=>!!context.careerEnding,target:'game_over'},{target:'playing'}]
    },
    promotion_processing: {
      entry: [
        ({context})=>{
          const next=promotionRequirement(context.characterType,context.rank)!;
          if(next.rank==='consort'){
            const empress=context.characters['Empress Consort']?.getSnapshot().context;
            const faction=empress?.type?assignCharacterFaction({...empress,type:empress.type}):null;
            for(const actor of Object.values(context.characters)){
              const c=actor.getSnapshot().context;
              if(c.type&&c.name!=='Empress Dowager'&&!c.hasGivenAllegiance&&(c.name==='Empress Consort'||(faction&&assignCharacterFaction({...c,type:c.type})===faction)))actor.send({type:'WITHDRAW_BACKING'});
            }
          }
          for(const actor of Object.values(context.characters)){const c=actor.getSnapshot().context;if(isPromotionRival(c.name,next.rank))actor.send({type:'GAIN_HATE',amount:promotionHate(context.characterType)});}
        },
        enqueueActions(({enqueue,context})=>{
          const next=promotionRequirement(context.characterType,context.rank)!;
          const removed=displacedOfficeForRank(next.rank),actor=removed?context.characters[removed]:null;
          if(actor)enqueue(stopChild(actor));
        }),
        assign(({context})=>{
          const next=promotionRequirement(context.characterType,context.rank)!;
          const firstPromotion=!context.rewardedRanks.includes(next.rank);
          const removed=displacedOfficeForRank(next.rank),characters={...context.characters};
          const former=removed?characters[removed]?.getSnapshot().context:null;
          const expelledCourtiers={...context.expelledCourtiers};
          if(removed){
            if(former?.type)expelledCourtiers[removed]={name:removed,season:context.season,byRank:next.rank,faction:assignCharacterFaction({...former,type:former.type}),pledged:former.hasGivenAllegiance};
            delete characters[removed];
          }
          const afterInfluence=earnedInfluence(context.playerPersonality.influence,(firstPromotion?B.promotionInfluence:0));
          return {rank:next.rank,consolidationWaived:false,rankEnteredSeason:context.season,characters,expelledCourtiers,
            relationshipGraph:updateCourtNode(removed&&former?updateCourtNode(context.relationshipGraph!,removed,{status:'expelled'}):context.relationshipGraph!,PLAYER_NODE,{office:next.rank}),
            rivalInfluenceHighWater:Math.max(context.rivalInfluenceHighWater??0,afterInfluence),rivalInfluenceGain:context.rivalInfluenceGain??0,
            promotionRivals:[...new Set([...(context.promotionRivals??[]),...Object.keys(characters).filter(name=>name===careerSeniorRival(context.characterType)),...Object.keys(characters).filter(name=>isPromotionRival(name,next.rank))])],
            activeCharacterNames:context.activeCharacterNames.filter(name=>name!==removed),presentCharacterNames:context.presentCharacterNames.filter(name=>name!==removed),
            rewardedRanks:[...new Set([...context.rewardedRanks,next.rank])],
            displacedOffices:[...new Set([...context.displacedOffices,...(displacedOfficeForRank(next.rank)?[displacedOfficeForRank(next.rank)!]:[])])],
            consortBacklashApplied:context.consortBacklashApplied||next.rank==='consort',
            playerPersonality:{...context.playerPersonality,influence:earnedInfluence(context.playerPersonality.influence,(firstPromotion?B.promotionInfluence:0))},
            factionSystem:{...context.factionSystem,membershipOffers:checkFactionMembershipOffers(context.factionSystem,characters).map(faction=>({faction,requiredMembers:3,supportThreshold:getSupportThreshold(context.characterType)}))},
            careerNotice:next.rank==='consort'?'The Empress Consort and other unpledged Consorts gain 40 hate. The Empress faction withdraws backing; the Dowager is exempt. Rival hate rises by 5 for each later 10-point influence gain.':`Promoted to ${next.rank.replaceAll('_',' ')}. Your rank deadline starts afresh.`};
        })
      ],
      always:[{guard:'shouldOfferEmperorAudience',target:'emperor_audience_offer'},{target:'playing'}]
    },
    emperor_audience_offer: {
      on: {
        ENTER_AUDIENCE: {
          target: 'emperor_audience'
        },
        REFUSE_AUDIENCE: [
          {
            guard: ({ context }) => isAtMaxSuspicion(context),
            target: 'game_over',
            actions: assign({ gameEndReason: 'defeat' })
          },
          {
            target: 'playing',
            actions: assign({ emperorAudienceDeferredUntilSeason: ({ context }) => context.season + 1 })
          }
        ]
      }
    },
    emperor_audience: {
      entry:assign({firstEmperorVisitDone:true,firstEmperorVisitElapsed:({context})=>context.firstEmperorVisitElapsed??FIRST_EMPEROR_VISIT_SECONDS}),
      invoke: {
        id: 'emperorAudienceMachine',
        src: 'emperorAudienceMachine',
        input: ({ context }) => {
          const victoryPath = determineVictoryPath(context);
          if (!victoryPath) {
            throw new Error('No victory path available for emperor audience');
          }
          return {
            victoryPath,
            gameContext: extractGameContext(context, victoryPath)
          };
        },
        onDone: [
          {
            guard: ({ event }) => {
              console.log('Game machine received emperor audience completion event:', event);
              console.log('Event output:', event.output);
              const outcome = event.output?.outcome;
              console.log('Resolved outcome:', outcome);
              return outcome === 'victory' || outcome === 'execution';
            },
            target: 'game_over',
            actions: assign({
              gameEndReason: ({ event }) => {
                const outcome = event.output?.outcome;
                return outcome === 'victory' ? 'victory' : 'defeat';
              },
              emperorAudienceCompleted: true,
              emperorAudienceVictoryPath: ({ context }) => determineVictoryPath(context),
              emperorAudienceOutcome: ({ event }) => event.output?.outcome || null,
              emperorMessage: ({ event }) => event.output?.message || ''
            })
          },
          {
            target: 'playing',
            actions: assign({
              rank: ({context}) => demotedRank(context.characterType,context.rank),
              demotionNotice:({context})=>createDemotionNotice(context.characterType,context.rank,context.season,'audience'),
              consolidationWaived:false,
              relationshipGraph:({context})=>updateCourtNode(context.relationshipGraph!,PLAYER_NODE,{office:demotedRank(context.characterType,context.rank)??resolveCareer(context.characterType)!}),
              supportPoints: ({context})=>standingAfterDemotion(context.characterType,demotedRank(context.characterType,context.rank)),
              standingRecovery:true,standingRenewals:{},
              rankEnteredSeason: ({context})=>context.season,
              promotionEligibleAfterSeason: ({context})=>context.season+B.demotionProbationSeasons,
              presenceReady:false,presentCharacterNames:[],
              careerNotice:'The Emperor dismisses you and demotes you one rank. Rebuild your influence during a two-season probation.', 
              playerPersonality: ({ context }) => ({
                ...context.playerPersonality,
                influence: Math.max(0, context.playerPersonality.influence - B.demotionInfluenceLoss)
              }),
              emperorAudienceCompleted: true,
              emperorAudienceDeferredUntilSeason: ({ context }) => context.season + 1,
              emperorAudienceVictoryPath: ({ context }) => determineVictoryPath(context),
              emperorAudienceOutcome: 'failure',
              emperorMessage: ({ event }) => event.output?.message || 'The Emperor dismisses you.'
            })
          }
        ]
      },
      on: {
        EMPEROR_AUDIENCE_COMPLETE: [
          {
            guard: ({ event }) => {
              console.log('Game machine received EMPEROR_AUDIENCE_COMPLETE event:', event);
              const outcome = event.outcome;
              console.log('Event outcome:', outcome);
              return outcome === 'victory' || outcome === 'execution';
            },
            target: 'game_over',
            actions: assign({
              gameEndReason: ({ event }) => {
                const outcome = event.outcome;
                return outcome === 'victory' ? 'victory' : 'defeat';
              },
              emperorAudienceCompleted: true,
              emperorAudienceVictoryPath: ({ context }) => determineVictoryPath(context),
              emperorAudienceOutcome: ({ event }) => event.outcome,
              emperorMessage: ({ event }) => event.message
            })
          },
          {
            target: 'playing',
            actions: assign({
              rank: ({context}) => demotedRank(context.characterType,context.rank),
              demotionNotice:({context})=>createDemotionNotice(context.characterType,context.rank,context.season,'audience'),
              consolidationWaived:false,
              relationshipGraph:({context})=>updateCourtNode(context.relationshipGraph!,PLAYER_NODE,{office:demotedRank(context.characterType,context.rank)??resolveCareer(context.characterType)!}),
              supportPoints: ({context})=>standingAfterDemotion(context.characterType,demotedRank(context.characterType,context.rank)),
              standingRecovery:true,standingRenewals:{},
              rankEnteredSeason: ({context})=>context.season,
              promotionEligibleAfterSeason: ({context})=>context.season+B.demotionProbationSeasons,
              presenceReady:false,presentCharacterNames:[],
              careerNotice:'The Emperor dismisses you and demotes you one rank. Rebuild your influence during a two-season probation.', 
              playerPersonality: ({ context }) => ({
                ...context.playerPersonality,
                influence: Math.max(0, context.playerPersonality.influence - B.demotionInfluenceLoss)
              }),
              emperorAudienceCompleted: true,
              emperorAudienceDeferredUntilSeason: ({ context }) => context.season + 1,
              emperorAudienceVictoryPath: ({ context }) => determineVictoryPath(context),
              emperorAudienceOutcome: 'failure',
              emperorMessage: ({ event }) => event.message
            })
          }
        ]
      }
    }
  }
});

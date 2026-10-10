import { createDemotionNotice, careerSeniorRival, CAREER_LADDERS, careerZoneAccess, resolveCareer } from '../lib/career';
import {MAX_GIFT_NOTIFICATIONS,MAX_COURT_READ_RECEIPTS} from '../lib/courtNotifications';
import {FIRST_EMPEROR_VISIT_SECONDS} from '../lib/firstEmperorVisit';
import {emptyCourtPlots,canContinuePlot,DEATH_METHODS,courtPlotKey} from '../lib/courtPlots';
import {createCourtGraph,migrateGraphRomance,assertCourtGraph,courtRelation,updateCourtNode,PLAYER_NODE,EMPEROR_NODE,type GraphPerson} from '../lib/courtGraph';
import type { ActorRefFrom, SnapshotFrom, AnyActorRef } from 'xstate';
import { gameMachine } from '../state-machines/game-machine';
import { initialCharacters } from '../data/characters';
import { courtInfluenceCap, clampCourtInfluence } from '../lib/courtHierarchy';
import { assignCharacterFaction, checkFactionMembershipOffers, type FactionSystem } from '../lib/factionSystem';
import { isPromotionRival } from '../lib/courtIntrigue';
import { getSupportThreshold } from '../lib/helpers';
import { createPalaceVisitState, isPlayableZone, type PalaceVisitState } from '../palace/zones';

export const SAVE_VERSION = 7;
export const SAVE_KEY = 'harem-empire.campaign';
export const PREVIOUS_SAVE_KEY = 'harem-empire.previous-campaign';
export const RECOVERY_SAVE_KEY = 'harem-empire.unreadable-campaign';
const MAX_SAVE_BYTES = 2_000_000;
const FACTIONS = ['Rebel', 'Imperial', 'Loyalist', 'Independent'];
const NAMES = new Set(initialCharacters.map(person => person.name));
export type CampaignActor = ActorRefFrom<typeof gameMachine>;
export interface SeasonClock { season: number; seasonMinutes: number; remainingSeconds: number; expired: boolean }
export interface CampaignPresentation { clock: SeasonClock; visits: PalaceVisitState; exploring: boolean }
export interface CampaignSave {
  format: 'harem-empire'; version: typeof SAVE_VERSION; savedAt: string;
  snapshot: ReturnType<CampaignActor['getPersistedSnapshot']>;
  presentation: CampaignPresentation;
}
export interface SaveStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface SaveStatus { message: string; available: boolean; hasPrevious: boolean; problem: boolean }
export interface LoadedCampaign { save: CampaignSave | null; message: string; problem: boolean }

type RecordValue = Record<string, any>;
const record = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const integer = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number => finite(value, min, max) && Number.isSafeInteger(value);
const stringList = (value: unknown): value is string[] => Array.isArray(value) && value.length <= 10_000 && value.every(item => typeof item === 'string' && item.length <= 500);
const names = (value: unknown): value is string[] => stringList(value) && new Set(value).size === value.length && value.every(name => NAMES.has(name));
const vectors = (value: unknown, keys: string[]) => record(value) && keys.every(key => finite(value[key], 0, 1));
const emptyObject = (value: unknown) => record(value) && Object.keys(value).length === 0;
function assertSave(condition: unknown, reason: string): asserts condition { if (!condition) throw new Error(reason); }
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export function createCampaignPresentation(role: string | null = null): CampaignPresentation {
  return { clock: { season: 1, seasonMinutes: 10, remainingSeconds: 600, expired: false }, visits: createPalaceVisitState(role), exploring: true };
}

/** A new committed season resets once, including when a refresh beats React's effect. */
export function presentationForSeason(presentation: CampaignPresentation, season: number): CampaignPresentation {
  return { ...presentation, clock: presentation.clock.season === season ? { ...presentation.clock } : {
    season, seasonMinutes: presentation.clock.seasonMinutes, remainingSeconds: presentation.clock.seasonMinutes * 60, expired: false,
  } };
}

function validatePresentation(value: unknown, season: number): asserts value is CampaignPresentation {
  assertSave(record(value) && typeof value.exploring === 'boolean', 'Missing display settings');
  const clock = value.clock;
  assertSave(record(clock) && clock.season === season && [5, 10, 15, 20].includes(clock.seasonMinutes) &&
    finite(clock.remainingSeconds, 0, clock.seasonMinutes * 60) && typeof clock.expired === 'boolean' && (!clock.expired || clock.remainingSeconds === 0), 'Invalid season clock');
  const visits = value.visits;
  assertSave(record(visits) && isPlayableZone(visits.zone) && record(visits.playerByZone) && record(visits.npcByName), 'Invalid palace location');
  for (const [zone, pose] of Object.entries(visits.playerByZone)) {
    assertSave(isPlayableZone(zone) && record(pose) && finite(pose.x, -1000, 1000) && finite(pose.z, -1000, 1000) &&
      finite(pose.yaw, -1e8, 1e8) && finite(pose.pitch, -10, 10) && finite(pose.distance, .1, 100) &&
      (pose.y === undefined || finite(pose.y, -100, 100)) && (pose.velocity === undefined || finite(pose.velocity, -100, 100)) &&
      (pose.airborne === undefined || typeof pose.airborne === 'boolean'), 'Invalid saved player position');
  }
  for (const [name, pose] of Object.entries(visits.npcByName)) {
    assertSave(NAMES.has(name) && record(pose) && isPlayableZone(pose.zone) && finite(pose.x, -1000, 1000) && finite(pose.z, -1000, 1000) && finite(pose.rotationY, -1e8, 1e8), 'Invalid saved courtier position');
  }
}

function validateCharacter(child: RecordValue, name: string, season: number, sessionId: number, legacyInfluence: boolean) {
  assertSave(child.src === 'characterMachine' && child.syncSnapshot === true && record(child.snapshot), 'Unrecognized courtier actor');
  const snapshot = child.snapshot, c = snapshot.context;
  assertSave(snapshot.status === 'active' && ['alive', 'inactive'].includes(snapshot.value) && emptyObject(snapshot.children) && emptyObject(snapshot.historyValue), 'Invalid courtier state');
  assertSave(record(c) && c.name === name && ['major', 'side', 'minor'].includes(c.type) && finite(c.supportLevel, 0, 100) && finite(c.supportThreshold, 0, 100) &&
    finite(c.suspicion, 0, 1) && finite(c.hate, 0, 100) && finite(c.suspicionThreshold, 0, 1) &&
    c.currentSeason === season && c.giftSessionId === sessionId && integer(c.giftCooldownUntil) && stringList(c.processedGiftRequests) &&
    ['hasGivenSupport', 'hasGivenAllegiance', 'hasGivenGifts'].every(key => typeof c[key] === 'boolean') &&
    (c.factionOverride === null || FACTIONS.includes(c.factionOverride)) && typeof c.lastResponse === 'string' && typeof c.imgPath === 'string', 'Invalid courtier data');
  const retired = ['trustInPlayer', 'loyaltyToPlayer', 'dependenceOnPlayer'];
  assertSave(vectors(c.personalityVectors, ['trust', 'fear', 'ambition', 'loyalty', 'influence', 'romantic', 'suspicion']) &&
    vectors(c.relationshipVectors, ['fearOfPlayer', 'loveForPlayer']) &&
    retired.every(key => c.relationshipVectors[key] === undefined || finite(c.relationshipVectors[key], 0, 1)), 'Invalid relationship values');
  assertSave(legacyInfluence || c.personalityVectors.influence <= courtInfluenceCap(c), 'Courtier influence exceeds its office limit');
}

function validateAudience(child: RecordValue) {
  assertSave(child.src === 'emperorAudienceMachine' && record(child.snapshot), 'Invalid audience actor');
  const s = child.snapshot, c = s.context;
  assertSave(s.status === 'active' && s.value === 'asking_questions' && emptyObject(s.children) && emptyObject(s.historyValue) && record(c), 'Audience has not reached a save checkpoint');
  assertSave(['traditional', 'shadow-ruler', 'revolutionary', 'survivor'].includes(c.victoryPath) && record(c.gameContext) &&
    Array.isArray(c.questions) && c.questions.length === 3 && Array.isArray(c.answers) && c.answers.length < 3 && c.answers.every((answer: unknown) => ['a','b','c'].includes(answer as string)) &&
    c.currentQuestionIndex === c.answers.length && c.outcome === null && typeof c.emperorMessage === 'string', 'Invalid audience progress');
  for (const question of c.questions) assertSave(record(question) && typeof question.id === 'string' && typeof question.text === 'string' && record(question.options) &&
    ['a','b','c'].every(key => typeof question.options[key] === 'string') && ['a','b','c'].includes(question.correctAnswer), 'Invalid audience question');
}

/** Validate the whole graph before XState is allowed to resolve actor references. */
export function validateCampaignSnapshot(value: unknown, legacyInfluence = false, legacyGraph = false, legacyPlots = false, legacyGifts = false, legacyRomance = false): asserts value is CampaignSave['snapshot'] {
  assertSave(record(value) && value.status === 'active' && emptyObject(value.historyValue) && record(value.context) && record(value.children), 'Invalid campaign snapshot');
  const c = value.context, state = value.value;
  assertSave(c.readCourtNotificationIds === undefined || (
    stringList(c.readCourtNotificationIds) && c.readCourtNotificationIds.length <= MAX_COURT_READ_RECEIPTS &&
    new Set(c.readCourtNotificationIds).size === c.readCourtNotificationIds.length &&
    c.readCourtNotificationIds.every((id: string) => id.length <= 512)
  ), 'Invalid court notification read receipts');
  if(!legacyRomance){
    assertSave(stringList(c.processedRomanceRequests)&&new Set(c.processedRomanceRequests).size===c.processedRomanceRequests.length,'Invalid romance request ledger');
    const r=c.lastRomanceReceipt;assertSave(r===null||record(r)&&c.processedRomanceRequests.includes(r.requestId)&&NAMES.has(r.characterId)&&['gift','propose','end'].includes(r.action)&&integer(r.season,1,c.season)&&integer(r.cost,0,20)&&finite(r.affectionDelta,0,100)&&typeof r.accepted==='boolean'&&typeof r.response==='string'&&names(r.witnesses)&&names(r.reportingWitnesses)&&r.reportingWitnesses.every((name:string)=>r.witnesses.includes(name)),'Invalid romance receipt');
  }
  if(!legacyGifts){
    assertSave(Array.isArray(c.pendingCourtGifts)&&c.pendingCourtGifts.length===0,'Uncommitted court gifts');
    assertSave(Array.isArray(c.giftNotifications)&&c.giftNotifications.length<=MAX_GIFT_NOTIFICATIONS&&new Set(c.giftNotifications.map((n:any)=>n.id)).size===c.giftNotifications.length&&c.giftNotifications.every((n:any)=>record(n)&&NAMES.has(n.name)&&integer(n.season,1,c.season)&&n.id===`${n.season}:${n.name}`&&[1,5,10].includes(n.amount)&&typeof n.read==='boolean'),'Invalid gift notifications');
    assertSave(record(c.courtGiftSeasons)&&Object.entries(c.courtGiftSeasons).every(([name,season])=>NAMES.has(name)&&integer(season,1,c.season)),'Invalid court gift ledger');
  }
  if(c.demotionNotice!==undefined&&c.demotionNotice!==null){
    const d=c.demotionNotice;
    assertSave(record(d)&&integer(d.season,1,c.season)&&['deadline','audience'].includes(d.reason)&&typeof d.acknowledged==='boolean','Invalid demotion notice');
    const expected=createDemotionNotice(c.characterType,d.fromRank,d.season,d.reason);
    assertSave(expected&&expected.id===d.id&&expected.toRank===d.toRank,'Invalid demotion ranks');
  }
  // Older saves have no introduction marker: leave their history untouched and
  // treat them as already introduced rather than springing a duplicate visit.
  assertSave(c.firstEmperorVisitDone===undefined||typeof c.firstEmperorVisitDone==='boolean','Invalid first Emperor visit marker');
  assertSave(c.firstEmperorVisitElapsed===undefined||finite(c.firstEmperorVisitElapsed,0,FIRST_EMPEROR_VISIT_SECONDS),'Invalid first Emperor visit clock');
  assertSave((c.firstEmperorVisitDone===undefined)===(c.firstEmperorVisitElapsed===undefined),'Missing first Emperor visit clock');
  assertSave(c.consolidationWaived===undefined||typeof c.consolidationWaived==='boolean','Invalid consolidation grant');
  assertSave(c.lastSeasonGiftGrant===undefined||integer(c.lastSeasonGiftGrant,0,1000),'Invalid seasonal grant');
  assertSave(c.rivalInfluenceHighWater===undefined||finite(c.rivalInfluenceHighWater,0,1),'Invalid influence high-water mark');
  assertSave(c.rivalInfluenceGain===undefined||finite(c.rivalInfluenceGain,0,1),'Invalid earned influence milestones');
  assertSave(c.promotionRivals===undefined||names(c.promotionRivals),'Invalid office rivals');
  const stateName = typeof state === 'string' ? state : record(state) && Object.keys(state).length === 1 ? state.playing : '';
  assertSave(typeof state === 'string' ? ['emperor_audience_offer', 'emperor_audience', 'game_over'].includes(stateName) : ['in_season', 'emperor_encounter', 'emperor_intro'].includes(stateName), 'Campaign has not reached a save checkpoint');
  assertSave(['prince', 'minister', 'concubine'].includes(c.characterType) && integer(c.season, 1) && integer(c.giftSessionId, 1) && integer(c.rngState, 0, 0xffffffff) &&
    finite(c.giftsRemaining) && finite(c.supportPoints) && integer(c.rankEnteredSeason, 1, c.season) && integer(c.promotionEligibleAfterSeason, 1) &&
    c.pendingGift === null && typeof c.seasonAdvancePending === 'boolean', 'Invalid campaign counters or incomplete gift');
  assertSave(stateName === 'emperor_encounter' || stateName === 'game_over' || !c.seasonAdvancePending, 'Uncommitted season transition');
  assertSave(stateName!=='emperor_intro'||(c.firstEmperorVisitDone===true&&c.firstEmperorVisitElapsed===FIRST_EMPEROR_VISIT_SECONDS&&!c.seasonAdvancePending),'Invalid introductory visit checkpoint');
  const career = resolveCareer(c.characterType)!;
  assertSave(c.rank === null || CAREER_LADDERS[career].includes(c.rank) || (career === 'concubine' && c.rank === 'empress_consort'), 'Invalid career rank');
  assertSave(vectors(c.playerPersonality, ['influence', 'ambition', 'loyalty', 'fear', 'charisma']) && vectors(c.playerReputation, ['perceivedThreat','perceivedLoyalty','trustworthiness','politicalSkill']), 'Invalid player values');
  for (const key of ['processedGiftRequests','rewardedRanks','standingAwards','displacedOffices']) assertSave(stringList(c[key]), `Invalid ${key}`);
  for (const key of ['activeCharacterNames','presentCharacterNames','successfulDiplomacyThisSeason','suspiciousCharacters']) assertSave(names(c[key]), `Invalid ${key}`);
  for (const key of ['standingRecovery','consortBacklashApplied','presenceReady','emperorAudienceCompleted']) assertSave(typeof c[key] === 'boolean', `Invalid ${key}`);
  for (const key of ['giftError','careerNotice','tributeResult','lastCharacterResponse','emperorMessage']) assertSave(typeof c[key] === 'string', `Invalid ${key}`);
  assertSave((isPlayableZone(c.currentZone) || c.currentZone === 'common') && record(c.standingRenewals) && Object.entries(c.standingRenewals).every(([name, season]) => NAMES.has(name) && integer(season, 1, c.season)), 'Invalid current season progress');
  assertSave(integer(c.emperorAudienceDeferredUntilSeason) && [null,'victory','defeat'].includes(c.gameEndReason) &&
    [null,'victory','execution','failure'].includes(c.emperorAudienceOutcome) && [null,'traditional','shadow-ruler','revolutionary','survivor'].includes(c.emperorAudienceVictoryPath) &&
    (c.careerEnding === null || (record(c.careerEnding) && typeof c.careerEnding.title === 'string' && typeof c.careerEnding.description === 'string')), 'Invalid campaign outcome');
  assertSave(record(c.characters) && record(c.expelledCourtiers), 'Missing court roster');
  for (const [name, expelled] of Object.entries(c.expelledCourtiers)) assertSave(NAMES.has(name) && record(expelled) && expelled.name === name && integer(expelled.season, 1, c.season) && typeof expelled.byRank === 'string' && FACTIONS.includes(expelled.faction) && typeof expelled.pledged === 'boolean' && !c.characters[name], 'Invalid expulsion');
  const deceased=legacyPlots?{}:c.deceasedCourtiers;
  assertSave(record(deceased),'Missing deceased roster');
  for(const [name,death]of Object.entries(deceased))assertSave(NAMES.has(name)&&record(death)&&death.name===name&&integer(death.season,1,c.season)&&NAMES.has(death.attacker)&&death.attacker!==name&&typeof death.reason==='string'&&(death.deathMethod===undefined||DEATH_METHODS.includes(death.deathMethod))&&!c.characters[name]&&!c.expelledCourtiers[name],'Invalid deceased courtier');
  assertSave(Object.keys(c.characters).length+Object.keys(c.expelledCourtiers).length+Object.keys(deceased).length===NAMES.size,'Incomplete persistent roster');
  const ids = new Set<string>();
  for (const [name, ref] of Object.entries(c.characters)) {
    assertSave(NAMES.has(name) && record(ref) && ref['xstate$$type'] === 1 && typeof ref.id === 'string' && !ids.has(ref.id) && record(value.children[ref.id]), 'Invalid actor reference');
    ids.add(ref.id); validateCharacter(value.children[ref.id], name, c.season, c.giftSessionId, legacyInfluence);
  }
  assertSave(c.activeCharacterNames.every((name: string) => c.characters[name]) && c.presentCharacterNames.every((name: string) => c.activeCharacterNames.includes(name)), 'Invalid active roster');
  if (stateName === 'emperor_audience') { assertSave(record(value.children.emperorAudienceMachine), 'Missing audience'); validateAudience(value.children.emperorAudienceMachine); ids.add('emperorAudienceMachine'); }
  assertSave(Object.keys(value.children).every(id => ids.has(id)), 'Unknown or unfinished child actor');
  const faction = c.factionSystem;
  assertSave(record(faction) && record(faction.factions) && FACTIONS.every(key => names(faction.factions[key])) &&
    (faction.playerFaction === null || FACTIONS.includes(faction.playerFaction)) && Array.isArray(faction.membershipOffers) &&
    faction.membershipOffers.every((offer: unknown) => record(offer) && FACTIONS.includes(offer.faction) && integer(offer.requiredMembers, 1, NAMES.size) && finite(offer.supportThreshold, 0, 100)), 'Invalid faction progress');
  if(!legacyGraph){
    assertCourtGraph(c.relationshipGraph,[PLAYER_NODE,EMPEROR_NODE,...NAMES],c.season,legacyRomance);
    assertSave(record(c.graphAppliedCommands),'Missing graph command ledger');
    assertSave(c.relationshipGraph.nodes[PLAYER_NODE].faction===c.factionSystem.playerFaction,'Graph player faction mismatch');
    assertSave(c.relationshipGraph.nodes[PLAYER_NODE].status===(!legacyPlots&&c.assassinationDeath?'deceased':'living')&&c.relationshipGraph.nodes[EMPEROR_NODE].status==='living'&&c.relationshipGraph.nodes[EMPEROR_NODE].faction==='Imperial','Invalid special graph node');
    for(const name of NAMES){
      const ref=c.characters[name],node=c.relationshipGraph.nodes[name];
      assertSave(node.status===(ref?'living':deceased[name]?'deceased':'expelled'),'Graph living/expelled status mismatch');
      if(ref){const person=value.children[ref.id].snapshot.context,edge=courtRelation(c.relationshipGraph,name,PLAYER_NODE);
        assertSave(node.faction===assignCharacterFaction(person),'Graph courtier faction mismatch');
        assertSave(person.supportLevel===edge.support&&person.hate===edge.hate&&person.hasGivenAllegiance===!!edge.pledge,'Graph relationship projection mismatch');
        if(!legacyRomance)assertSave(typeof person.isLover==='boolean'&&typeof person.legacyCourtshipGiftEligible==='boolean'&&person.isLover===!!edge.romance&&person.relationshipVectors.loveForPlayer===edge.affection/100,'Graph romance projection mismatch');
        const committed=c.graphAppliedCommands[name]??0;
        assertSave(integer(committed)&&person.graphCommandSerial===committed&&person.graphProjectionSerial===committed,'Uncommitted graph relationship command');
      }
    }
    assertSave(Object.keys(c.graphAppliedCommands).every(name=>NAMES.has(name)&&integer(c.graphAppliedCommands[name])),'Invalid graph command ledger');
  }
  if(!legacyPlots){
    const plots=c.courtPlots;
    assertSave(record(plots)&&plots.version===1&&integer(plots.lastProcessedSeason,1,c.season)&&record(plots.pending)&&record(plots.nextWarningSeason)&&Array.isArray(plots.events)&&plots.events.length<=40,'Invalid court plot state');
    assertSave(c.seasonSettlementPending===false&&c.pendingIntrigueSeason===null&&c.pendingPlotResolution===null,'Uncommitted season intrigue');
    assertSave(stateName==='game_over'||plots.lastProcessedSeason===c.season,'Unresolved court season');
    for(const [key,plot]of Object.entries(plots.pending))assertSave(record(plot)&&NAMES.has(plot.attacker)&&!!c.characters[plot.attacker]&&(plot.target===undefined||plot.target===PLAYER_NODE||NAMES.has(plot.target)&&!!c.characters[plot.target]&&plot.target!==plot.attacker)&&key===courtPlotKey(plot.attacker,plot.target)&&integer(plot.warnedSeason,1,c.season)&&integer(plot.dueSeason,plot.warnedSeason+1)&&plot.dueSeason===c.season+1,'Invalid pending court plot');
    for(const [name,season]of Object.entries(plots.nextWarningSeason))assertSave(NAMES.has(name)&&integer(season,1,c.season+1),'Invalid plot cooldown');
    for(const event of plots.events)assertSave(record(event)&&['warning','defused','casualty','player_death'].includes(event.kind)&&integer(event.season,1,c.season)&&NAMES.has(event.attacker)&&typeof event.reason==='string'&&(event.deathMethod===undefined||DEATH_METHODS.includes(event.deathMethod))&&(event.victim===undefined||NAMES.has(event.victim))&&(event.target===undefined||event.target===PLAYER_NODE||NAMES.has(event.target)&&event.target!==event.attacker),'Invalid plot history');
    assertSave(c.assassinationDeath===null||(record(c.assassinationDeath)&&c.assassinationDeath.kind==='player_death'&&NAMES.has(c.assassinationDeath.attacker)&&integer(c.assassinationDeath.season,1,c.season)&&stateName==='game_over'&&c.gameEndReason==='defeat'),'Invalid assassination outcome');
  }
  if (c.lastGiftReceipt !== null) {
    const receipt = c.lastGiftReceipt;
    assertSave(record(receipt) && typeof receipt.requestId === 'string' && c.processedGiftRequests.includes(receipt.requestId) && receipt.sessionId === c.giftSessionId && NAMES.has(receipt.characterId) &&
      integer(receipt.sequence, 1) && typeof receipt.message === 'string' && integer(receipt.cost, 1) && finite(receipt.supportDelta, -100, 100) && finite(receipt.globalRenewal, 0, 100), 'Invalid gift receipt');
  }
}

/** Migrate only live actor data. Expelled courtiers are a historical record, not faction contributors. */
function migrateCourtInfluence(snapshot: RecordValue) {
  const c = snapshot.context;
  const actors: Record<string, { getSnapshot: () => { context: any } }> = {};
  const factions: FactionSystem['factions'] = { Rebel: [], Imperial: [], Loyalist: [], Independent: [] };
  for (const [name, reference] of Object.entries(c.characters) as [string, RecordValue][]) {
    const person = snapshot.children[reference.id].snapshot.context;
    person.personalityVectors.influence = clampCourtInfluence(person, person.personalityVectors.influence);
    // assignCharacterFaction honors a pledged courtier's binding factionOverride first.
    factions[assignCharacterFaction(person)].push(name);
    actors[name] = { getSnapshot: () => ({ context: person }) };
  }
  const factionSystem: FactionSystem = { ...c.factionSystem, factions, membershipOffers: [] };
  factionSystem.membershipOffers = checkFactionMembershipOffers(factionSystem, actors).map(faction => ({
    faction, requiredMembers: 3, supportThreshold: getSupportThreshold(c.characterType),
  }));
  c.factionSystem = factionSystem;
}

/** User-approved mechanics migration: these retired personal meters no longer participate in scoring.
 * Remove their old actor fields; fear and love remain meaningful. */
function normalizeRetiredRelationships(snapshot: RecordValue) {
  for (const reference of Object.values(snapshot.context.characters) as RecordValue[]) {
    const relationships = snapshot.children[reference.id].snapshot.context.relationshipVectors;
    delete relationships.trustInPlayer;
    delete relationships.loyaltyToPlayer;
    delete relationships.dependenceOnPlayer;
  }
}

export function parseCampaignSave(raw: string): { save: CampaignSave; migrated: boolean } {
  assertSave(raw.length <= MAX_SAVE_BYTES, 'Save is too large');
  const data: unknown = JSON.parse(raw, (key, value) => { if (['__proto__','constructor','prototype'].includes(key)) throw new Error('Unsafe save key'); return value; });
  assertSave(record(data) && data.format === 'harem-empire', 'Unrecognized save format');
  assertSave([1, 2, 3, 4, 5, 6, SAVE_VERSION].includes(data.version), 'This save uses an unsupported version');
  const migrated = data.version !== SAVE_VERSION;
  // V1 shares the complete deterministic machine graph, but predates display mode and clock-expiration fields.
  if (data.version === 1) {
    assertSave(record(data.presentation) && record(data.presentation.clock), 'Missing legacy clock');
    if (data.presentation.exploring === undefined) data.presentation.exploring = true;
    if (data.presentation.clock.expired === undefined) data.presentation.clock.expired = data.presentation.clock.remainingSeconds === 0;
  }
  assertSave(typeof data.savedAt === 'string' && Number.isFinite(Date.parse(data.savedAt)), 'Invalid save time');
  // Old saves legitimately contain influence above the new office caps, but malformed
  // numbers and actor graphs must fail validation before any normalization is attempted.
  validateCampaignSnapshot(data.snapshot, data.version<3, data.version<4, data.version<5, data.version<6, data.version<7);
  validatePresentation(data.presentation, (data.snapshot as RecordValue).context.season);
  if (data.version<3) {
    migrateCourtInfluence(data.snapshot as RecordValue);
  }
  normalizeRetiredRelationships(data.snapshot as RecordValue);
  for(const ref of Object.values((data.snapshot as RecordValue).context.characters) as RecordValue[]){(data.snapshot as RecordValue).children[ref.id].snapshot.context.playerFaction=(data.snapshot as RecordValue).context.factionSystem.playerFaction;}
  // Old saves acquire rivalry tracking at their current influence; no retroactive
  // hate is invented and already-earned inventory is left unchanged.
  const migratedContext=(data.snapshot as RecordValue).context;
  if(migratedContext.rank && migratedContext.rivalInfluenceHighWater===undefined){
    migratedContext.rivalInfluenceHighWater=migratedContext.playerPersonality.influence;
    migratedContext.rivalInfluenceGain=0;
    migratedContext.promotionRivals=Object.keys(migratedContext.characters).filter(name=>name===careerSeniorRival(migratedContext.characterType)||isPromotionRival(name,migratedContext.rank));
  }

  if(data.version<4){
    const snap=data.snapshot as RecordValue,c=snap.context;
    c.consolidationWaived=['emperor_audience','emperor_audience_offer'].includes(snap.value);
    const people:GraphPerson[]=initialCharacters.map(initial=>{
      const ref=c.characters[initial.name];if(ref){const person=snap.children[ref.id].snapshot.context;person.graphCommandSerial=0;person.graphProjectionSerial=0;return person;}
      return{name:initial.name,type:initial.type,formalFaction:c.expelledCourtiers[initial.name]?.faction??null};
    });
    c.relationshipGraph=updateCourtNode(createCourtGraph(people,c.rngState,c.factionSystem.playerFaction,c.expelledCourtiers),PLAYER_NODE,{office:c.rank??resolveCareer(c.characterType)!});c.graphAppliedCommands={};
  }
  if(data.version<5){const c=(data.snapshot as RecordValue).context;c.courtPlots=emptyCourtPlots(c.season);c.deceasedCourtiers={};c.assassinationDeath=null;c.seasonSettlementPending=false;c.pendingIntrigueSeason=null;c.pendingPlotResolution=null;}
  if(data.version===5){
    // Resume only a just-completed, still-valid attack from the old cooldown.
    // Loading never executes an attack, consumes RNG, changes hate or invents history.
    const c=(data.snapshot as RecordValue).context;
    const situation={graph:c.relationshipGraph,role:c.characterType,rank:c.rank,playerInfluence:c.playerPersonality.influence,
      influenceByName:Object.fromEntries(Object.entries(c.characters).map(([name,ref])=>[name,(data.snapshot as RecordValue).children[(ref as RecordValue).id].snapshot.context.personalityVectors.influence]))};
    for(const [name,next] of Object.entries(c.courtPlots.nextWarningSeason)){
      const last=[...c.courtPlots.events].reverse().find((e:any)=>e.attacker===name);
      if(!c.courtPlots.pending[name]&&next===c.season+1&&last?.kind==='casualty'&&last.season===c.season&&canContinuePlot(situation,name))
        c.courtPlots.pending[name]={attacker:name,warnedSeason:Math.max(1,c.season-1),dueSeason:c.season+1};
    }
    c.courtPlots.nextWarningSeason={};
  }
  if(data.version<6){
    const c=(data.snapshot as RecordValue).context;
    c.giftNotifications??=[];c.pendingCourtGifts??=[];
    c.courtGiftSeasons??=Object.fromEntries(Object.entries(c.characters).filter(([,ref])=>{
      const p=(data.snapshot as RecordValue).children[(ref as RecordValue).id].snapshot.context;
      return p.hasGivenGifts||p.hasGivenAllegiance;
    }).map(([name])=>[name,c.season]));
  }
  if(data.version<7){
    const snap=data.snapshot as RecordValue,c=snap.context,legacyLove:Record<string,number>={};
    c.processedRomanceRequests=[];c.lastRomanceReceipt=null;
    for(const [name,ref]of Object.entries(c.characters) as [string,RecordValue][]){const p=snap.children[ref.id].snapshot.context;legacyLove[name]=p.relationshipVectors.loveForPlayer;p.legacyCourtshipGiftEligible=p.legacyCourtshipGiftEligible??p.relationshipVectors.loveForPlayer>=1;}
    c.relationshipGraph=migrateGraphRomance(c.relationshipGraph,legacyLove);
    for(const [name,ref]of Object.entries(c.characters) as [string,RecordValue][]){const p=snap.children[ref.id].snapshot.context,edge=courtRelation(c.relationshipGraph,name,PLAYER_NODE);p.isLover=!!edge.romance;p.relationshipVectors.loveForPlayer=edge.affection/100;if(!p.lastResponse&&c.lastCharacterResponse.startsWith(`${name}:`))p.lastResponse=c.lastCharacterResponse;}
  }
  if(migrated)data.version=SAVE_VERSION;
  validateCampaignSnapshot(data.snapshot);
  const c = (data.snapshot as RecordValue).context;
  if (!careerZoneAccess(c.characterType, c.rank, data.presentation.visits.zone).allowed) data.presentation.visits.zone = createPalaceVisitState(c.characterType).zone;
  return { save: data as CampaignSave, migrated };
}

export function isCampaignCheckpoint(snapshot: SnapshotFrom<typeof gameMachine>): boolean {
  if (!snapshot.context.characterType || snapshot.context.pendingGift || snapshot.status !== 'active') return false;
  if(snapshot.context.seasonSettlementPending||snapshot.context.pendingIntrigueSeason||snapshot.context.pendingPlotResolution||snapshot.context.pendingCourtGifts?.length)return false;
  if(!snapshot.context.relationshipGraph||Object.entries(snapshot.context.characters).some(([name,actor])=>{const c=actor.getSnapshot().context,serial=snapshot.context.graphAppliedCommands?.[name]??0;return c.graphCommandSerial!==serial||c.graphProjectionSerial!==serial;}))return false;
  if (snapshot.matches('emperor_audience')) {
    const audience = snapshot.children.emperorAudienceMachine?.getSnapshot();
    return !!audience && 'value' in audience && audience.value === 'asking_questions';
  }
  return snapshot.matches({ playing: 'in_season' }) || snapshot.matches({ playing: 'emperor_encounter' }) || snapshot.matches({playing:'emperor_intro'}) || snapshot.matches('emperor_audience_offer') || snapshot.matches('game_over');
}

export function captureCampaign(actor: CampaignActor, presentation: CampaignPresentation): CampaignSave | null {
  const snapshot = actor.getSnapshot();
  if (!isCampaignCheckpoint(snapshot)) return null;
  const saved: CampaignSave = { format: 'harem-empire', version: SAVE_VERSION, savedAt: new Date().toISOString(),
    snapshot: actor.getPersistedSnapshot(), presentation: presentationForSeason(presentation, snapshot.context.season) };
  // JSON conversion detaches mutable pose objects and converts actor references to their stored form.
  return parseCampaignSave(JSON.stringify(saved)).save;
}

/** XState revives references in place. A getter gives each actor construction its own graph,
 * including React Strict Mode's double initializer, without touching the recovery record. */
export function campaignActorOptions(save: CampaignSave | null) {
  return save ? { get snapshot() { return clone(save.snapshot); } } : {};
}

export function browserSaveStorage(): SaveStorage | null {
  try { return window.localStorage; } catch { return null; }
}

export class CampaignSaveStore {
  private storage: SaveStorage | null;
  private current: string | null = null;
  private previous: string | null = null;
  private unreadable: string | null = null;
  private diskValue: string | null = null;
  private staleWriter = false;
  private listeners = new Set<() => void>();
  private state: SaveStatus;
  constructor(storage: SaveStorage | null) {
    this.storage = storage;
    this.state = { message: storage ? 'Autosave ready · this browser' : 'Storage unavailable. Progress lasts only while this page is open.', available: !!storage, hasPrevious: false, problem: !storage };
  }
  getStatus = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private status(message: string, problem = false) {
    const next = { message, problem, available: !!this.storage, hasPrevious: !!this.previous };
    if (JSON.stringify(next) !== JSON.stringify(this.state)) { this.state = next; this.listeners.forEach(listener => listener()); }
  }
  private storageFailed() {
    this.storage = null;
    this.status('Autosave unavailable. Progress and the previous campaign are kept only until this page closes.', true);
  }
  private mayWrite(): boolean {
    if (this.staleWriter) return false;
    if (!this.storage) return true;
    try {
      if (this.storage.getItem(SAVE_KEY) !== this.diskValue) {
        this.staleWriter = true;
        this.status('Another tab changed this campaign. Saving, New Game and recovery are paused in this tab. Reload to use the latest save, or continue here without saving.', true);
        return false;
      }
    } catch { this.storageFailed(); }
    return true;
  }
  load(): LoadedCampaign {
    let message = this.state.message, problem = this.state.problem;
    try {
      this.current = this.storage?.getItem(SAVE_KEY) ?? null;
      this.diskValue = this.current;
      const previous = this.storage?.getItem(PREVIOUS_SAVE_KEY) ?? null;
      if (previous) { try { this.previous = JSON.stringify(parseCampaignSave(previous).save); } catch { /* Keep the unreadable backup untouched. */ } }
    } catch { this.storageFailed(); return { save: null, message: this.state.message, problem: true }; }
    if (!this.current) { this.status(message, problem); return { save: null, message, problem }; }
    try {
      const result = parseCampaignSave(this.current);
      this.current = JSON.stringify(result.save);
      message = result.migrated ? 'Saved campaign upgraded to current court rules. Your support, pledges and progress are preserved.' : 'Campaign resumed · autosaved in this browser';
      this.status(message);
      return { save: clone(result.save), message, problem: false };
    } catch {
      this.unreadable = this.current; this.current = null;
      message = 'This save is damaged or from an unsupported version. It has been preserved. Start a new campaign or recover the previous one.';
      this.status(message, true);
      return { save: null, message, problem: true };
    }
  }
  save(actor: CampaignActor, presentation: CampaignPresentation): boolean {
    if (!this.mayWrite()) return false;
    let checkpoint: CampaignSave | null;
    try { checkpoint = captureCampaign(actor, presentation); } catch { this.status('Autosave paused: this campaign has not reached a valid save checkpoint. Your last save is intact.', true); return false; }
    if (!checkpoint) return false;
    const raw = JSON.stringify(checkpoint);
    // Preserve bad/unknown data before replacing it, including when a new career was selected.
    try {
      if (this.unreadable && this.storage) { this.storage.setItem(RECOVERY_SAVE_KEY, this.unreadable); this.unreadable = null; }
      this.storage?.setItem(SAVE_KEY, raw);
      if (this.storage) this.diskValue = raw;
    } catch { this.storageFailed(); }
    this.current = raw;
    if (this.storage) this.status('Autosaved · this browser');
    return true;
  }
  /** Called only after a visible New Game confirmation. Backup first; replacement is recoverable. */
  startNewCampaign(): boolean {
    if (!this.mayWrite()) return false;
    try {
      if (this.unreadable && this.storage) { this.storage.setItem(RECOVERY_SAVE_KEY, this.unreadable); this.unreadable = null; }
      if (this.current) { this.storage?.setItem(PREVIOUS_SAVE_KEY, this.current); this.previous = this.current; }
      this.storage?.removeItem(SAVE_KEY);
      if (this.storage) this.diskValue = null;
    } catch { this.status('A backup could not be saved. Your current campaign is unchanged. Free some browser storage and try again.', true); return false; }
    this.current = null;
    this.status(this.storage ? 'New campaign ready. Recover the previous campaign from Save & game.' : 'New campaign ready. Previous campaign is recoverable until this page closes.', !this.storage);
    return true;
  }
  recoverPrevious(): CampaignSave | null {
    if (!this.mayWrite()) return null;
    if (!this.previous) return null;
    const restored = parseCampaignSave(this.previous).save;
    const previousCurrent = this.current, previousBackup = this.previous;
    try {
      if (this.unreadable && this.storage) { this.storage.setItem(RECOVERY_SAVE_KEY, this.unreadable); this.unreadable = null; }
      // Save the outgoing campaign first. Never change the primary record until
      // the backup write succeeds; if the primary write fails, restore the old backup.
      if (previousCurrent) this.storage?.setItem(PREVIOUS_SAVE_KEY, previousCurrent);
      this.storage?.setItem(SAVE_KEY, previousBackup);
      if (this.storage) this.diskValue = previousBackup;
    } catch {
      try { this.storage?.setItem(PREVIOUS_SAVE_KEY, previousBackup); } catch { /* The in-memory backup remains recoverable. */ }
      this.status('Recovery could not be saved. Your open campaign is unchanged; its previous campaign remains available in this page.', true); return null;
    }
    this.current = previousBackup; this.previous = previousCurrent ?? previousBackup;
    this.status(this.storage ? 'Previous campaign restored. Your replaced campaign is recoverable.' : 'Previous campaign restored for this page only.', !this.storage);
    return clone(restored);
  }
}

/** Checkpoint after the entire actor mailbox settles, not inside child-to-parent gift reports. */
export function attachCampaignAutosave(actor: CampaignActor, store: CampaignSaveStore, readPresentation: () => CampaignPresentation) {
  let queued = false, closed = false;
  const children = new Map<string, { unsubscribe(): void }>();
  const save = () => { if (!closed) store.save(actor, readPresentation()); };
  const schedule = () => { if (queued || closed) return; queued = true; queueMicrotask(() => { queued = false; save(); }); };
  const syncChildren = () => {
    const actors = actor.getSnapshot().children;
    for (const [id, subscription] of children) if (!actors[id]) { subscription.unsubscribe(); children.delete(id); }
    for (const [id, child] of Object.entries(actors)) if (child && !children.has(id)) children.set(id, (child as AnyActorRef).subscribe({ next: schedule }));
    schedule();
  };
  const subscription = actor.subscribe({ next: syncChildren }); syncChildren();
  return { flush: save, stop: () => { closed = true; subscription.unsubscribe(); for (const child of children.values()) child.unsubscribe(); children.clear(); } };
}

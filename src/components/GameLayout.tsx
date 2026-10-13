import {selectCourtier} from '../lib/courtSelection';
import CourtSpeechBubble from './CourtSpeechBubble';
import RomanceActions from './RomanceActions';
import type {CourtGraph} from '../lib/courtGraph';
import type {RomanceAction,RomanceReceipt,RomanceWitness} from '../lib/courtRomance';
import DemotionSummary from './DemotionSummary';
import CourtNotifications from './CourtNotifications';
import {courtPlotNotifications, type GiftNotification} from '../lib/courtNotifications';
import {FIRST_EMPEROR_VISIT_SECONDS,countsFreeRoamTime} from '../lib/firstEmperorVisit';
import EmperorIntro from './EmperorIntro';
import type {EmperorAppearanceStatus} from '../palace/emperorEntrance';
import CourtIntriguePanel from './CourtIntriguePanel';
import type {CampaignPresentation} from '../persistence/campaignSave';
import {signed} from '../lib/courtStrategy';
import type {StandingRecovery} from '../lib/campaignStanding';
import {displayCharacterName} from '../lib/courtIdentity';
import {createPalaceVisitState,zoneRoster,PLAYABLE_ZONES,ZONES} from '../palace/zones';
import {
  careerZoneAccess, tributeCost, seasonalGiftGrant, promotionRequirement, consolidationProgress, promotionDeadline
} from '../lib/career';
import SeasonTransition from '../palace/SeasonTransition';
import { CAMPAIGN_BALANCE as B } from '../lib/campaignBalance';
import { useEffect, useState, useRef } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { useSelector } from "@xstate/react";
import type { ActorRefFrom } from "xstate";
import type { characterMachine } from "../state-machines/character-machine";
import type { Character, InitialCharacterType } from "../types/character";
import type { PlayerStats, PlayerType } from "../types/game";
import PalaceScene from "../palace/PalaceScene";
import CharacterDisplay from "./CharacterDisplay";
import CharacterInfo from "./CharacterInfo";
import GameHeader from "./GameHeader";
import ActionButtons from "./ActionButtons";
import StatsModal from "./StatsModal";
import PromotionNotification from "./PromotionNotification";
import FactionPanel from "./FactionPanel";
import CourtBriefing from "./CourtBriefing";
import CourtRoster from "./CourtRoster";
import CourtDialog from "./CourtDialog";
import { giftMessage, type MessageChoice } from "../lib/giftMessages";
import { getInfluenceGating } from "../lib/influenceGating";
import EmperorEncounter from "./EmperorEncounter";
import EmperorAudienceOffer from "./EmperorAudienceOffer";
import EmperorAudienceScreen from "./EmperorAudienceScreen";
import { initialCharacters } from "../data/characters";
import { getPersonalityHint, getSupportThreshold } from "../lib/helpers";
import { determineVictoryPath, isAtMaxSuspicion } from "../lib/emperorAudience";

// Separate component to handle emperor audience state with proper hook usage
function EmperorAudienceHandler({ machineState }: { machineState: any }) {
  const audienceActor = machineState.children?.emperorAudienceMachine;

  if (!audienceActor) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="text-white text-xl">Loading emperor audience...</div>
      </div>
    );
  }

  return <ActiveEmperorAudience audienceActor={audienceActor} />;
}

function ActiveEmperorAudience({ audienceActor }: { audienceActor: any }) {
  const audienceState = useSelector(audienceActor, (state: any) => state);
  const victoryPath = audienceState.context?.victoryPath;
  const questions = audienceState.context?.questions || [];
  const currentQuestionIndex = audienceState.context?.currentQuestionIndex || 0;
  const emperorMessage = audienceState.context?.emperorMessage || "";
  const outcome = audienceState.context?.outcome;
  const isComplete = !!outcome; // Simple: if there's an outcome, show the result screen

  if (!victoryPath) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="text-white text-xl">
          Error: No victory path available
        </div>
      </div>
    );
  }

  return (
    <EmperorAudienceScreen
      victoryPath={victoryPath}
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      isComplete={isComplete}
      emperorMessage={emperorMessage}
      outcome={outcome}
      onAnswerQuestion={(answer) => {
        audienceActor.send({ type: "ANSWER_QUESTION", answer });
      }}
    />
  );
}

interface UIState {
  currentCharacterIndex: number;
  showStatsModal: boolean;
  showFactionPanel: boolean;
  showRosterPanel: boolean;
}
interface GameLayoutProps {
  machineState: any;
  send: any;
  uiState: UIState;
  setUiState: Dispatch<SetStateAction<UIState>>;
  promotionKey: string | null;
  onPromotionDismiss: () => void;
  presentation: CampaignPresentation;
  saveMenuOpen: boolean;
}
export function CourtAudience({
  actor,
  character,
  playerStats,
  playerType,
  rank,
  gifts,
  season,
  onPrevious,
  onNext,
  onPeople,
  response,
  onAction,
  giftPending,
  giftError,
  standing,
  receipt,
  graph,romanceReceipt,witnesses,zone,onRomance,speechAnchored=false,
  palaceConversation = false,
}: {
  palaceConversation?: boolean;
  graph:CourtGraph;romanceReceipt?:RomanceReceipt|null;witnesses:RomanceWitness[];zone:string;onRomance:(action:RomanceAction)=>void;speechAnchored?:boolean;
  actor: ActorRefFrom<typeof characterMachine>;
  character: InitialCharacterType;
  playerStats: PlayerStats;
  playerType: PlayerType;
  rank: string|null;
  gifts: number;
  season: number;
  onPrevious: () => void;
  onNext: () => void;
  onPeople: () => void;
  response: string;
  onAction: (action: "message" | "spit", messageType?: MessageChoice) => void;
  giftPending: boolean;
  giftError: string;
  standing?:StandingRecovery;
  receipt?:{characterId:string;cost:number;supportDelta:number;globalRenewal:number}|null;
}) {
  const data = useSelector(actor, (snapshot) => snapshot.context);
  const currentCharacter: Character = { ...data, type: character.type,displayName:character.displayName };
  const dossier = <CharacterInfo character={currentCharacter} personality={getPersonalityHint(data.personalityVectors)}
    canShowStats currentSeason={season} />;
  return (
    <article className="court-audience">
      {!palaceConversation && <CharacterDisplay character={currentCharacter}
        onPrevious={onPrevious} onNext={onNext} onPeople={onPeople} />}
      <div className="audience-conversation">
        {!palaceConversation && dossier}
        <CourtSpeechBubble name={displayCharacterName(currentCharacter)} response={(data.lastResponse||response.startsWith(`${character.name}:`)&&response||'').replace(`${character.name}:`,`${displayCharacterName(currentCharacter)}:`)} anchored={speechAnchored}>
          {romanceReceipt?.characterId===character.name&&data.lastResponse===`${character.name}: ${romanceReceipt.response}`?<small>{romanceReceipt.action==='gift'?`Romantic gift: +${romanceReceipt.affectionDelta} affection · ${romanceReceipt.cost} gifts`:romanceReceipt.action==='propose'?(romanceReceipt.accepted?'Romance accepted':'Proposal refused'):'Romance ended'}</small>:receipt?.characterId===character.name&&<small>Last political gift: {signed(receipt.supportDelta)} personal support · {receipt.cost} {receipt.cost===1?"gift":"gifts"}{receipt.globalRenewal>0?` · +${receipt.globalRenewal} global support`:""}</small>}
        </CourtSpeechBubble>
        <div className="audience-choices"><ActionButtons graph={graph} zone={zone} witnesses={witnesses} onRomanticGift={()=>onRomance("gift")} standing={standing} pending={giftPending} giftError={giftError} key={character.name} character={currentCharacter} onAction={onAction} gifts={gifts} playerStats={playerStats} playerType={playerType} rank={rank} />
        <RomanceActions character={currentCharacter} graph={graph} role={playerType} zone={zone} witnesses={witnesses} pending={giftPending} onAction={onRomance}/></div>
        {palaceConversation && <details className="conversation-dossier">
          <summary>About {displayCharacterName(currentCharacter)} · {Math.round(data.supportLevel)} support</summary>
          {dossier}
        </details>}
      </div>
    </article>
  );
}
export default function GameLayout({
  machineState,
  send,
  uiState,
  setUiState,
  promotionKey,
  onPromotionDismiss,
  presentation,
  saveMenuOpen,
}: GameLayoutProps) {
  // Presentation state only; the campaign continues to use the single existing XState actor.
  const [exploring, setExploring] = useState(presentation.exploring);
  presentation.exploring = exploring;
  const [renderReady, setRenderReady] = useState(false);
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [speechAnchored,setSpeechAnchored]=useState(false);
  const [conversation, setConversation] = useState<string | null>(null);
  const [emperorArrived, setEmperorArrived] = useState(false);
  const [emperorAppearance,setEmperorAppearance]=useState<EmperorAppearanceStatus>({loading:false,retry:null});
  const [seasonMinutes, setSeasonMinutes] = useState(presentation.clock.seasonMinutes);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(presentation.clock.remainingSeconds));
  const introActiveTime=useRef(0);
  const clockState = useRef({ remaining: presentation.clock.remainingSeconds, sent: presentation.clock.expired, last: 0 });
  const context = machineState.context;
  const plotNotifications = courtPlotNotifications(context.courtPlots, context.readCourtNotificationIds);
  const unreadNotifications = plotNotifications.filter(note => !note.read).length +
    (context.giftNotifications ?? []).filter((note: GiftNotification) => !note.read).length;
  const demotion=context.demotionNotice&&!context.demotionNotice.acknowledged?context.demotionNotice:null;
  const lastCommittedSeason = useRef(context.season);
  const [transitionSeason,setTransitionSeason] = useState<number|null>(null);
  useEffect(()=>{if(context.season>lastCommittedSeason.current){setTransitionSeason(context.season);setConversation(null);}lastCommittedSeason.current=context.season;},[context.season]);
  const recapSeason=transitionSeason??(demotion?.reason==='deadline'?demotion.season:null);
  const acknowledgeDemotion=()=>{if(demotion)send({type:'ACKNOWLEDGE_DEMOTION',id:demotion.id});};
  const requirement=promotionRequirement(context.characterType,context.rank);
  const deadline=promotionDeadline(context.characterType,context.rank,context.rankEnteredSeason,context.season);
  const visits=useRef(presentation.visits);
  const standing:StandingRecovery={recovery:context.standingRecovery,season:context.season,support:context.supportPoints,renewals:context.standingRenewals};
  const giftPending = !!context.pendingGift;
  const giftReaction = { name: context.lastGiftReceipt?.characterId ?? "", sequence: context.lastGiftReceipt?.sequence ?? 0 };
  const {
    season,
    giftsRemaining,
    supportPoints,
    characterType,
    rank,
    characters: characterActors,
    lastCharacterResponse,
    suspiciousCharacters,
    factionSystem,
  } = context;
  // The promoted courtier can be removed before a new seasonal pool is drawn.
  const seasonalCharacters = initialCharacters.filter(
    (character) =>
      context.activeCharacterNames.includes(character.name) &&
      characterActors[character.name],
  ).map(character=>({...character,displayName:character.name}));
  const availableCharacters = exploring?seasonalCharacters:zoneRoster(seasonalCharacters,visits.current.zone,season,1-secondsLeft/(seasonMinutes*60),characterType);
  if(!careerZoneAccess(characterType,rank,visits.current.zone).allowed)visits.current.zone=createPalaceVisitState(characterType).zone;
  const classicRosterKey=availableCharacters.map(person=>person.name).join('|');
  useEffect(()=>{if(!exploring)send({type:'UPDATE_PALACE_PRESENCE',zone:visits.current.zone,names:availableCharacters.map(person=>person.name)});},[exploring,season,classicRosterKey,context.currentZone]);
  const safeIndex = Math.max(
    0,
    Math.min(uiState.currentCharacterIndex, availableCharacters.length - 1),
  );
  const currentCharacter = selectCourtier(availableCharacters, safeIndex, exploring ? conversation : null);
  const playing = machineState.matches({ playing: "in_season" }) || machineState.matches({ playing: "gift_processing" });
  const emperorEncounter = machineState.matches({ playing: "emperor_encounter" });
  const emperorIntro=machineState.matches({playing:"emperor_intro"});
  const firstVisitRemaining=Math.max(0,Math.ceil(FIRST_EMPEROR_VISIT_SECONDS-(context.firstEmperorVisitElapsed??0)));
  useEffect(() => { setEmperorArrived(false); }, [emperorEncounter,emperorIntro]);
  const clockPaused = saveMenuOpen || notificationsOpen || !!demotion || transitionSeason!==null || !renderReady || !playing || giftPending || !!conversation || uiState.showStatsModal || uiState.showFactionPanel || uiState.showRosterPanel || !!promotionKey || !exploring;
  const clockLive = useRef({ paused: clockPaused, send,firstVisitPending:context.firstEmperorVisitDone===false });
  clockLive.current = { paused: clockPaused, send,firstVisitPending:context.firstEmperorVisitDone===false };
  useEffect(() => {
    const savedClock = presentation.clock;
    const keepClock = savedClock.season === season && savedClock.seasonMinutes === seasonMinutes;
    const remaining = keepClock ? savedClock.remainingSeconds : seasonMinutes * 60;
    clockState.current = { remaining, sent: keepClock && savedClock.expired, last: performance.now() };
    presentation.clock = { season, seasonMinutes, remainingSeconds: remaining, expired: keepClock && savedClock.expired };
    setSecondsLeft(Math.ceil(remaining));
  }, [season, seasonMinutes]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = performance.now(), clock = clockState.current;
      const delta = (now - clock.last) / 1000; clock.last = now;
      if (!countsFreeRoamTime(delta,clockLive.current.paused,document.hidden,clock.sent)) return;
      clock.remaining = Math.max(0, clock.remaining - delta);
      presentation.clock.remainingSeconds = clock.remaining;
      setSecondsLeft(Math.ceil(clock.remaining));
      if (clock.remaining <= 0) { clock.sent = true; presentation.clock.expired = true; setConversation(null); clockLive.current.send({ type: 'SEASON_EXPIRED' }); return; }
      // Intro progress emits at most once per second: each emission checkpoints
      // the campaign, so never serialize the complete court graph every frame.
      if(clockLive.current.firstVisitPending){
        introActiveTime.current+=delta;
        if(introActiveTime.current>=1){const seconds=Math.min(2,introActiveTime.current);introActiveTime.current-=seconds;clockLive.current.send({type:'FIRST_EMPEROR_VISIT_TICK',seconds});}
      }else introActiveTime.current=0;
    }, 200);
    return () => window.clearInterval(timer);
  }, []);
  const navigate = (direction: number) => {
    if (!availableCharacters.length) return;
    setUiState((previous) => ({
      ...previous,
      currentCharacterIndex:
        (safeIndex + direction + availableCharacters.length) %
        availableCharacters.length,
    }));
  };
  // Presentation-only listener; unconditional across loading and audience states.
  useEffect(() => {
    if (exploring || !playing || !!demotion || notificationsOpen || saveMenuOpen || uiState.showStatsModal || uiState.showFactionPanel || uiState.showRosterPanel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        target?.closest(
          'input, textarea, select, summary, [contenteditable="true"], [role="dialog"]',
        )
      )
        return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        navigate(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    exploring,
    playing,
    demotion?.id,
    notificationsOpen,
    saveMenuOpen,
    uiState.showStatsModal,
    uiState.showFactionPanel,
    uiState.showRosterPanel,
    safeIndex,
    availableCharacters.length,
  ]);
  useEffect(() => {
    if (!playing) return;
    const approachable = availableCharacters.findIndex((character) => {
      const data = characterActors[character.name]?.getSnapshot().context;
      return data && getInfluenceGating({ ...data, type: character.type }, context.playerPersonality, context.rank).canInteract.allowed;
    });
    setUiState((previous) => ({ ...previous, currentCharacterIndex: Math.max(0, approachable) }));
    // A new season starts with someone the player can actually approach.
    // Deliberate choices and actor updates during that season remain untouched.
  }, [season]);
  useEffect(() => {
    if (!playing || (conversation && !availableCharacters.some(person => person.name === conversation))) setConversation(null);
  }, [playing, season, conversation, availableCharacters.map(person => person.name).join("|")]);
  const romanceWitnesses:RomanceWitness[]=context.presentCharacterNames.flatMap((name:string)=>{const p=characterActors[name]?.getSnapshot().context;return p?[{name,pledged:p.hasGivenAllegiance,suspicion:p.suspicion,suspicionThreshold:p.suspicionThreshold,zone:context.currentZone}]:[];});
  const handleRomance=(action:RomanceAction)=>{if(currentCharacter&&!giftPending)send({type:'ROMANCE_ACTION',characterId:currentCharacter.name,action,requestId:`romance-${context.giftSessionId}-${crypto.randomUUID()}`});};
  const openConversation = (name: string) => {
    const index = availableCharacters.findIndex(person => person.name === name);
    if (index < 0 || !playing) return;
    setUiState(previous => ({ ...previous, currentCharacterIndex: index }));
    setConversation(name);
  };
  const closeConversation = () => { setSpeechAnchored(false);setConversation(null); requestAnimationFrame(() => document.querySelector<HTMLElement>('.palace-canvas [role=application]')?.focus()); };
  const toggleFactions = () =>
    setUiState((previous) => ({
      ...previous,
      showFactionPanel: !previous.showFactionPanel,
    }));
  const gameState = {
    playerType: characterType,
    rank: rank || "",
    season,
    systemSupport: supportPoints,
    gifts: giftsRemaining,
    currentCharacterIndex: safeIndex,
    showStatsModal: uiState.showStatsModal,
    isGameStarted: true,
    characterSupport: {},
  };
  const handleAction = (action: "message" | "spit", messageType?: MessageChoice) => {
    if (!currentCharacter || !playing || giftPending) return;
    if (action === "message" && giftMessage(messageType))
      send({
        type: "GIVE_GIFT_WITH_MESSAGE",
        characterId: currentCharacter.name,
        messageType,
        requestId: crypto.randomUUID(),
      });
    if (action === "spit")
      send({ type: "SPIT_IN_FACE", characterId: currentCharacter.name });
  };
  if (machineState.matches("emperor_audience_offer")) {
    const victoryPath = determineVictoryPath(context);
    return victoryPath ? (
      <EmperorAudienceOffer
        victoryPath={victoryPath}
        isAtMaxSuspicion={isAtMaxSuspicion(context)}
        onEnterAudience={() => send({ type: "ENTER_AUDIENCE" })}
        onRefuse={() => send({ type: "REFUSE_AUDIENCE" })}
      />
    ) : (
      <p role="status">Preparing your imperial audience…</p>
    );
  }
  if (machineState.matches("emperor_audience"))
    return <EmperorAudienceHandler machineState={machineState} />;
  const threshold =
    characterType === "concubine" ? 1 : characterType === "minister" ? 3 : 5;
  return (
    <div className={exploring ? "palace-shell" : "court-shell"}>
      {exploring && <PalaceScene key={context.giftSessionId} rank={rank} season={season} seasonProgress={1-secondsLeft/(seasonMinutes*60)} visitState={visits.current}
        onPresenceChange={({zone,names})=>send({type:'UPDATE_PALACE_PRESENCE',zone,names})} conversationName={conversation} conversationReply={conversation?characterActors[conversation]?.getSnapshot().context.lastResponse||'What would you like to talk about?':''} onSpeechProjectionChange={setSpeechAnchored} onRenderReady={setRenderReady} people={seasonalCharacters} playerType={characterType || "prince"}
        onAdvanceSeason={() => { if(playing&&!clockPaused)send({ type: 'NEXT_SEASON' }); }}
        onExpireSeason={() => { if(playing&&!clockPaused)clockState.current.remaining=0; }}
        giftReaction={giftReaction} emperorEncounter={emperorEncounter||emperorIntro} emperorIntro={emperorIntro} onEmperorArrived={() => setEmperorArrived(true)} onEmperorStatus={setEmperorAppearance}
        paused={saveMenuOpen || notificationsOpen || !!demotion || transitionSeason!==null || !renderReady || !playing || giftPending || !!conversation || uiState.showStatsModal || uiState.showFactionPanel || uiState.showRosterPanel || !!promotionKey}
        onInteract={openConversation} onUnavailable={() => setExploring(false)} />}
      {recapSeason!==null && demotion?.reason!=='audience' && <SeasonTransition key={recapSeason} season={recapSeason} demotion={demotion?.reason==='deadline'?demotion:null} giftGrant={context.lastSeasonGiftGrant??seasonalGiftGrant(characterType,rank)} castCount={seasonalCharacters.length} faction={factionSystem.playerFaction} onComplete={()=>{if(demotion?.reason==='deadline')acknowledgeDemotion();setTransitionSeason(null);}} />}
      {demotion?.reason==='audience'&&<CourtDialog title="Demoted" onClose={acknowledgeDemotion}><DemotionSummary notice={demotion}/><button className="court-stats-button" onClick={acknowledgeDemotion}>Return to the court</button></CourtDialog>}
      <GameHeader
        unreadNotifications={unreadNotifications}
        urgentNotifications={plotNotifications.filter(note => note.activePlot).length}
        onNotificationsClick={()=>{setConversation(null);setUiState(previous=>({...previous,showStatsModal:false,showFactionPanel:false,showRosterPanel:false}));setNotificationsOpen(true);send({type:'READ_COURT_NOTIFICATIONS'});}}
        gameState={gameState}
        onNextSeason={playing && !giftPending && transitionSeason===null ? () => { setConversation(null); send({ type: "NEXT_SEASON" }); } : undefined}
        onCourtClick={toggleFactions}
        onProfileClick={() => { setConversation(null); setUiState(previous => ({ ...previous, showFactionPanel:false, showRosterPanel:false, showStatsModal:true })); }}
        characterType={characterType}
      />
      <button className={exploring ? "palace-mode" : "classic-mode"} onClick={() => { setConversation(null); setExploring(value => !value); }}>{exploring ? "2D court" : "Explore palace 3D"}</button>
      {exploring && <div className={`palace-clock ${secondsLeft < 60 ? 'clock-low' : ''}`} title="The timer pauses during conversations, menus, and when you leave this tab"><span>{clockPaused ? "TIME PAUSED" : "SEASON ENDS IN"}</span><strong>{Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:{(secondsLeft % 60).toString().padStart(2, '0')}</strong><i className="ui-incense" aria-hidden="true" style={{'--left':Math.max(0,Math.min(1,secondsLeft/(seasonMinutes*60)))} as CSSProperties}/>{context.firstEmperorVisitDone===false&&<small className="first-emperor-countdown">First imperial visit in {Math.floor(firstVisitRemaining/60)}:{String(firstVisitRemaining%60).padStart(2,'0')}</small>}</div>}
      {emperorIntro&&<CourtDialog title="A first imperial visit" onClose={()=>send({type:'EMPEROR_INTRO_FINISHED'})}><div className="imperial-encounter"><EmperorIntro arrived={!exploring||emperorArrived} loading={exploring&&emperorAppearance.loading} error={exploring&&!!emperorAppearance.retry} onRetry={emperorAppearance.retry??undefined} onContinue={()=>send({type:'EMPEROR_INTRO_FINISHED'})}/></div></CourtDialog>}
      {emperorEncounter && <CourtDialog title="An imperial summons" onClose={() => {}}>
        <div className="imperial-encounter"><EmperorEncounter role={characterType} rank={rank} loading={exploring && emperorAppearance.loading} error={exploring && !!emperorAppearance.retry} onRetry={emperorAppearance.retry??undefined} onContinueIn2D={()=>setExploring(false)} arrived={!exploring || emperorArrived} giftsRemaining={giftsRemaining} onGiveGift={() => send({type: 'GIVE_EMPEROR_GIFT', giftsRemaining})} onRefuse={() => send({type: 'REFUSE'})} /></div>
      </CourtDialog>}

      {exploring && suspiciousCharacters.length > 0 && <p className="palace-warning" role="status">The court is watching · {suspiciousCharacters.length}/{threshold} reports</p>}
      {!exploring && <main className="court-main">
        <label className="classic-zone-picker">Palace area <select value={visits.current.zone} onChange={event=>{const zone=event.target.value as typeof visits.current.zone;if(careerZoneAccess(characterType,rank,zone).allowed){visits.current.zone=zone;send({type:'UPDATE_PALACE_PRESENCE',zone,names:zoneRoster(seasonalCharacters,zone,season,1-secondsLeft/(seasonMinutes*60)).map(p=>p.name)});}}}>{PLAYABLE_ZONES.map(zone=><option key={zone} value={zone} disabled={!careerZoneAccess(characterType,rank,zone).allowed}>{ZONES[zone].title}{careerZoneAccess(characterType,rank,zone).allowed?'':` · ${careerZoneAccess(characterType,rank,zone).reason}`}</option>)}</select></label>
        <CourtBriefing consolidation={consolidationProgress(characterType,rank,context.rankEnteredSeason,season,context.consolidationWaived)} role={characterType} influence={context.playerPersonality.influence} remaining={deadline?.seasonsRemaining} deferred={season < context.emperorAudienceDeferredUntilSeason} support={supportPoints} rank={rank} factionSystem={factionSystem} onFactionsClick={toggleFactions} />
        {suspiciousCharacters.length > 0 && (
          <div className="court-warning" role="status">
            <strong>The court is watching.</strong>{" "}
            {suspiciousCharacters.length} of {threshold} reports before defeat.
            Reported by: {suspiciousCharacters.join(", ")}.
          </div>
        )}
        <div className="court-workspace">
          {currentCharacter ? (
            <CourtAudience
              graph={context.relationshipGraph} romanceReceipt={context.lastRomanceReceipt} witnesses={romanceWitnesses} zone={context.currentZone} onRomance={handleRomance}
              actor={characterActors[currentCharacter.name]}
              character={currentCharacter}
              playerStats={context.playerPersonality}
              playerType={characterType}
              rank={context.rank}
              gifts={giftsRemaining}
              season={season}
              onPrevious={() => navigate(-1)}
              onNext={() => navigate(1)}
              onPeople={() => setUiState((previous) => ({ ...previous, showRosterPanel: true }))}
              response={lastCharacterResponse}
              standing={standing} receipt={context.lastGiftReceipt} giftPending={giftPending} giftError={context.giftError}
              onAction={handleAction}
            />
          ) : (
            <p className="empty-court">
              No courtiers are in this area right now. Choose another permitted palace area above, or return later this season. Your relationships and deadline remain unchanged when you travel.
            </p>
          )}
        </div>
        <footer className="court-footer"><span>Save & game for campaign storage and recovery</span></footer>
      </main>}
      {exploring && conversation && currentCharacter && characterActors[conversation] && (
        <CourtDialog title="A moment at court" onClose={closeConversation}>
          <div className="palace-conversation"><CourtAudience
            palaceConversation
            graph={context.relationshipGraph} romanceReceipt={context.lastRomanceReceipt} witnesses={romanceWitnesses} zone={context.currentZone} onRomance={handleRomance} speechAnchored={speechAnchored}
            actor={characterActors[conversation]} character={currentCharacter}
            playerStats={context.playerPersonality} playerType={characterType} rank={context.rank} gifts={giftsRemaining} season={season}
            onPrevious={() => {}} onNext={() => {}} onPeople={() => {}}
            response={lastCharacterResponse} standing={standing} receipt={context.lastGiftReceipt} giftPending={giftPending} giftError={context.giftError} onAction={handleAction} />
            <button className="palace-leave" onClick={closeConversation}>Return to the palace <span>Esc ↗</span></button>
          </div>
        </CourtDialog>
      )}
      {promotionKey && rank && (
        <PromotionNotification
          key={promotionKey}
          rank={rank}
          playerInfluence={context.playerPersonality.influence}
          onDismiss={onPromotionDismiss}
        />
      )}
      {notificationsOpen && <CourtNotifications notifications={context.giftNotifications ?? []} plots={plotNotifications}
        plotContext={{graph: context.relationshipGraph, influence: context.playerPersonality.influence,
          influences: Object.fromEntries(Object.keys(characterActors).map(name =>
            [name, characterActors[name].getSnapshot().context.personalityVectors.influence])),
          joinableFactions: factionSystem.membershipOffers.map((offer: {faction: string}) => offer.faction)}}
        onReviewCourt={() => {setNotificationsOpen(false); setUiState(previous => ({...previous, showFactionPanel: true}));}}
        onClose={() => setNotificationsOpen(false)}/>}
      {uiState.showRosterPanel && (
        <CourtDialog title="People at court" onClose={() => setUiState((previous) => ({ ...previous, showRosterPanel: false }))}>
          <CourtRoster characters={availableCharacters} actors={characterActors} selectedIndex={safeIndex}
            onSelect={(index) => setUiState((previous) => ({ ...previous, currentCharacterIndex: index, showRosterPanel: false }))}
            stats={context.playerPersonality} rank={context.rank} />
        </CourtDialog>
      )}
      {uiState.showFactionPanel && (
        <CourtDialog title="Your court" onClose={toggleFactions}>
          <p className="court-guide">{requirement ? `Next: ${requirement.rank.replaceAll('_',' ')} · Global support ${supportPoints}/${requirement.globalSupport} · Influence ${Math.round(context.playerPersonality.influence*100)}/${Math.round(requirement.influence*100)}%` : `Consolidate your rule: ${consolidationProgress(characterType,rank,context.rankEnteredSeason,season,context.consolidationWaived)?.completed??0}/3 seasons, then seek your faction ending.`}</p>
          {deadline && <p>{deadline.seasonsRemaining} seasons remain in this rank. {deadline.goal==='faction_victory'?'Achieve your faction ending.':'Meet both promotion bars.'}</p>}
          {requirement && <div className="promotion-progress"><label>Global support <progress value={supportPoints} max={requirement.globalSupport} /></label><label>Influence <progress value={context.playerPersonality.influence} max={requirement.influence} /></label></div>}
          {context.careerNotice && <p role="status">{context.careerNotice}</p>}
          <FactionPanel displayNames={Object.fromEntries(Object.keys(characterActors).map(name=>[name,name]))} factionSystem={factionSystem} allCharacters={characterActors}
            onJoinFaction={(faction) => {
              setUiState((previous) => ({ ...previous, showFactionPanel: false }));
              send({ type: "JOIN_FACTION", faction });
            }} />
          <CourtIntriguePanel plots={context.courtPlots} graph={context.relationshipGraph} influence={context.playerPersonality.influence} influences={Object.fromEntries(Object.keys(characterActors).map(name=>[name,characterActors[name].getSnapshot().context.personalityVectors.influence]))} deceased={context.deceasedCourtiers} joinableFactions={factionSystem.membershipOffers.map((offer:any)=>offer.faction)}/>
          <details className="court-rules"><summary>How the court works</summary>
            <p>Win 3 members of the same Rebel, Imperial, or Loyalist faction to {getSupportThreshold(characterType)} support. Invitations update after completed gifts and seasons. Pledges at 100 are binding personal alliances.</p>
            <p>{context.standingRecovery?"Rebuilding: a positive message-gift to a current backer renews one quarter of their global endorsement, once per season. Personal relationships and pledges were retained.":""}</p>
            <p>Concentrate gifts on a few backers, then secure pledges at 100. Lower-influence courtiers are easier to sway. Keep {tributeCost(characterType,rank)} gifts for possible tribute from season 2 unless your perceived loyalty earns a pardon.</p>
            <p>Global support is your earned career total; faction invitations require current personal backing. Each courtier awards global support only once for backing and once for a pledge.</p>
            <p>Influence gains are full up to 70%, then one-fifth as fast. Promotion awards up to 3 influence points, or 0.6 above 70%. Your existing influence is never reduced by this rule.</p>
            <p>Rank opens palace areas. Influence strengthens positive gift effects and increases the chance of an Emperor encounter. Hostile actions still have restrictions.</p>
            <p>Up to {B.returningContacts} contacts with developing relationships return each season; the remaining cast reshuffles. Gift costs follow court tier: 1, 5, 10 or 20 per message.</p>
            <p>Each advancing season adds {seasonalGiftGrant(characterType,rank)} rank-allowance gifts. From season 2, the Emperor may demand {tributeCost(characterType,rank)} first. Every living pledged ally sends 1, 5 or 10 gifts each season, including allies in other palaces. A new pledge’s first gift counts for that season. A paid tribute has a {B.tributeFavorChance*100}% chance to earn up to {B.tributeInfluenceReward*100} influence points, reduced above 70%.</p>
            <p>Each promotion adds rival hate by your path: Prince 20, Scholar/Minister 30, Concubine 40. Opposing-faction membership adds 30 hate. Spitting adds full hate; bad gifts add their negative support amount. Each later 10-point influence high-water gain adds 5 hate to office rivals. At top rank, each completed season adds 5 hate outside your faction. Same-faction courtiers and pledged allies are immune to hate gains.</p>
            <p>{suspiciousCharacters.length}/{threshold} reports before defeat. In 3D, walk near a courtier and press E.</p>
            <label>Season length <select value={seasonMinutes} onChange={event => setSeasonMinutes(Number(event.target.value))}><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={20}>20 minutes</option></select></label>
            <p>Changing the length restarts this season’s timer. Conversations, menus and inactive tabs pause it. 2D mode is untimed.</p>
          </details>
          <button className="court-stats-button" onClick={() => setUiState((previous) => ({ ...previous, showFactionPanel: false, showStatsModal: true }))}>Your stats & reputation</button>
        </CourtDialog>
      )}
      <StatsModal
        isOpen={uiState.showStatsModal}
        onClose={() =>
          setUiState((previous) => ({ ...previous, showStatsModal: false }))
        }
        playerStats={context.playerPersonality}
        playerReputation={context.playerReputation}
      />
    </div>
  );
}

import {isIntriguePlaytest,isTouchViewportPlaytest,playtestSaveStorage} from './persistence/playtestMode';
import { rankIndex } from './lib/campaignBalance';
import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/700.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/alegreya-sans/400.css'
import '@fontsource/alegreya-sans/500.css'
import '@fontsource/alegreya-sans/700.css'
import './ui/styles.css'
import { installUiSounds } from './ui'
import GameLayout from './components/GameLayout'
import CharacterSelection, { type PlayerType } from './components/CharacterSelection'
import GameOverScreen from './components/GameOverScreen'
import { useMachine } from '@xstate/react'
import { gameMachine } from './state-machines/game-machine'
import CampaignSaveControls from './components/CampaignSaveControls'
import { CampaignSaveStore, parseCampaignSave, campaignActorOptions, attachCampaignAutosave, browserSaveStorage, createCampaignPresentation, type CampaignSave, type CampaignPresentation } from './persistence/campaignSave'

function App({ store, initialSave, onReplace }: { store: CampaignSaveStore; initialSave: CampaignSave | null; onReplace: (save: CampaignSave | null) => void }) {
  const [state, send, actor] = useMachine(gameMachine, campaignActorOptions(initialSave));
  const presentation = useRef<CampaignPresentation>(initialSave?.presentation ?? createCampaignPresentation());
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const autosave = useRef<ReturnType<typeof attachCampaignAutosave> | null>(null);
  useEffect(() => {
    const saving = attachCampaignAutosave(actor, store, () => presentation.current);
    autosave.current = saving;
    const flush = () => saving.flush();
    const interval = window.setInterval(flush, 1000);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => { window.clearInterval(interval); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', flush); saving.stop(); };
  }, [actor, store]);
  
  // Keep UI state separate from game logic state
  const [uiState, setUiState] = useState({
    currentCharacterIndex: 0,
    showStatsModal: false,
    showFactionPanel: false,
    showRosterPanel: false,
  });

  // Promotion tracking - stays persistent across state transitions
  const [promotionKey, setPromotionKey] = useState<string | null>(null);
  const lastRankRef = useRef<string | null>(initialSave ? state.context.rank : null);

  // Check for promotion - this persists across all state transitions
  const currentRank = state.context.rank;
  useEffect(() => {
    if (rankIndex(state.context.characterType,currentRank)>rankIndex(state.context.characterType,lastRankRef.current)) setPromotionKey(`promotion-${currentRank}`);
    lastRankRef.current = currentRank;
  }, [currentRank]);

  // Handle initialize game in useEffect to avoid render-time side effects
  useEffect(() => {
    if (state.matches('initialize_game')) {
      send({ type: 'INITIALIZE_GAME' });
    }
  }, [state, send]);

  const handleCharacterSelect = (type: PlayerType) => {
    presentation.current = createCampaignPresentation(type);
    send({ type: 'CHOOSE_CHARACTER', payload: { type } });
  };

  const handleNewGame = () => {
    autosave.current?.flush();
    if (store.startNewCampaign()) { autosave.current?.stop(); onReplace(null); }
  };
  const handleRecover = () => {
    autosave.current?.flush();
    const restored = store.recoverPrevious();
    if (restored) { autosave.current?.stop(); onReplace(restored); }
  };
  const controls = <CampaignSaveControls store={store} onNewGame={handleNewGame} onRecover={handleRecover}
    paused={saveMenuOpen} onPauseChange={setSaveMenuOpen} role={state.context.characterType} rank={state.context.rank} season={state.context.season} />;

  const handlePromotionDismiss = () => {
    setPromotionKey(null);
  };

  if (state.matches('choosing_character')) {
    return <><CharacterSelection onCharacterSelect={handleCharacterSelect} />{controls}</>;
  }

  if (state.matches('initialize_game')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Initializing Game...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Handle game over
  if (state.matches('game_over')) {
    return (
      <><GameOverScreen
        careerEnding={state.context.careerEnding}
        gameEndReason={state.context.gameEndReason}
        finalStats={{
          supportPoints: state.context.supportPoints,
          rank: state.context.rank,
          season: state.context.season
        }}
        emperorAudienceCompleted={state.context.emperorAudienceCompleted}
        emperorAudienceVictoryPath={state.context.emperorAudienceVictoryPath}
        emperorAudienceOutcome={state.context.emperorAudienceOutcome}
        emperorMessage={state.context.emperorMessage}
        onRestart={() => setSaveMenuOpen(true)}
      />{controls}</>
    );
  }

  return (
    <><GameLayout 
      machineState={state}
      send={send}
      uiState={uiState}
      setUiState={setUiState}
      promotionKey={promotionKey}
      onPromotionDismiss={handlePromotionDismiss}
      presentation={presentation.current}
      saveMenuOpen={saveMenuOpen}
    />{controls}</>
  );
}

function CampaignHost() {
  const [testing] = useState(()=>isIntriguePlaytest(window.location.search));
  const [touchViewport] = useState(()=>isTouchViewportPlaytest(window.location.search));
  const [testError,setTestError]=useState('');
  const [store] = useState(() => new CampaignSaveStore(testing?playtestSaveStorage(browserSaveStorage()):browserSaveStorage()));
  const [campaign, setCampaign] = useState(() => ({ generation: 0, save: store.load().save }));
  const loadFixture=async(kind:'intrigue'|'demotion'|'romance'|'jealousy'='intrigue')=>{try{const response=await fetch(`/qa/${kind}.json`);if(!response.ok)throw Error('Fixture unavailable');const save=parseCampaignSave(await response.text()).save;setCampaign(previous=>({generation:previous.generation+1,save}));setTestError('');}catch(error){setTestError(String(error));}};
  return <>{testing&&!touchViewport&&<aside className="qa-fixture-bar"><strong>Fictional intrigue QA · separate save slot</strong><span>Normal campaign untouched. Scenarios are fictional. Romance: gift, proposal and multiple lovers. Jealousy: advance seasons for warning, protector sacrifice and rival death.</span><button onClick={()=>loadFixture()}>Load intrigue scenario</button><button onClick={()=>loadFixture('demotion')}>Load demotion scenario</button><button onClick={()=>loadFixture('romance')}>Load romance scenario</button><button onClick={()=>loadFixture('jealousy')}>Load jealousy scenario</button><a href="?renderer=software">Leave test mode</a>{testError&&<span role="alert">{testError}</span>}</aside>}<App key={campaign.generation} store={store} initialSave={campaign.save}
    onReplace={save => setCampaign(previous => ({ generation: previous.generation + 1, save }))} /></>;
}

installUiSounds();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CampaignHost />
  </React.StrictMode>,
)
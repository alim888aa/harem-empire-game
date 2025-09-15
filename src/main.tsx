import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import GameLayout from './components/GameLayout'
import CharacterSelection, { type PlayerType } from './components/CharacterSelection'
import EmperorEncounter from './components/EmperorEncounter'
import GameOverScreen from './components/GameOverScreen'
import { useMachine } from '@xstate/react'
import { gameMachine } from './state-machines/game-machine'

function App() {
  const [state, send] = useMachine(gameMachine);
  
  // Keep UI state separate from game logic state
  const [uiState, setUiState] = useState({
    currentCharacterIndex: 0,
    showStatsModal: false,
    showFactionPanel: false,
  });

  // Promotion tracking - stays persistent across state transitions
  const [promotionKey, setPromotionKey] = useState<string | null>(null);
  const lastRankRef = useRef<string | null>(null);

  // Check for promotion - this persists across all state transitions
  const currentRank = state.context.rank;
  console.log('App promotion check:', { lastRank: lastRankRef.current, currentRank, promotionKey });
  if (lastRankRef.current === null && currentRank !== null) {
    const newPromotionKey = `promotion-${currentRank}-${Date.now()}`;
    console.log('App: Promotion detected! Creating key:', newPromotionKey);
    setPromotionKey(newPromotionKey);
    lastRankRef.current = currentRank;
  }

  // Handle initialize game in useEffect to avoid render-time side effects
  useEffect(() => {
    if (state.matches('initialize_game')) {
      send({ type: 'INITIALIZE_GAME' });
    }
  }, [state, send]);

  const handleCharacterSelect = (type: PlayerType) => {
    send({ type: 'CHOOSE_CHARACTER', payload: { type } });
  };

  const handleGiveEmperorGift = () => {
    send({ type: 'GIVE_EMPEROR_GIFT', giftsRemaining: state.context.giftsRemaining });
  };

  const handleRefuseEmperor = () => {
    send({ type: 'REFUSE' });
  };

  const handleRestart = () => {
    send({ type: 'RESTART_GAME' });
  };

  const handlePromotionDismiss = () => {
    setPromotionKey(null);
  };

  if (state.matches('choosing_character')) {
    return <CharacterSelection onCharacterSelect={handleCharacterSelect} />;
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

  // Handle emperor encounter
  if (state.matches({ playing: 'emperor_encounter' })) {
    return (
      <EmperorEncounter
        onGiveGift={handleGiveEmperorGift}
        onRefuse={handleRefuseEmperor}
        giftsRemaining={state.context.giftsRemaining}
      />
    );
  }

  // Handle game over
  if (state.matches('game_over')) {
    return (
      <GameOverScreen
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
        onRestart={handleRestart}
      />
    );
  }

  return (
    <GameLayout 
      machineState={state}
      send={send}
      uiState={uiState}
      setUiState={setUiState}
      promotionKey={promotionKey}
      onPromotionDismiss={handlePromotionDismiss}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
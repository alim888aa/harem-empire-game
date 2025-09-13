import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import GameLayout from './components/GameLayout'
import CharacterSelection, { type PlayerType } from './components/CharacterSelection'
import { useMachine } from '@xstate/react'
import { gameMachine } from './state-machines/game-machine'

function App() {
  const [state, send] = useMachine(gameMachine);
  
  // Keep UI state separate from game logic state
  const [uiState, setUiState] = useState({
    currentCharacterIndex: 0,
    showStatsModal: false,
  });

  const handleCharacterSelect = (type: PlayerType) => {
    send({ type: 'CHOOSE_CHARACTER', payload: { type } });
  };

  if (state.matches('choosing_character')) {
    return <CharacterSelection onCharacterSelect={handleCharacterSelect} />;
  }

  if (state.matches('initialize_game')) {
    send({ type: 'INITIALIZE_GAME' });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Initializing Game...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <GameLayout 
      machineState={state}
      send={send}
      uiState={uiState}
      setUiState={setUiState}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
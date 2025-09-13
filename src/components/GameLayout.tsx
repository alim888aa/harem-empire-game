import React from 'react';
import CharacterDisplay from './CharacterDisplay';
import CharacterInfo from './CharacterInfo';
import GameHeader from './GameHeader';
import ActionButtons from './ActionButtons';
import StatsModal from './StatsModal';
import PromotionNotification from './PromotionNotification';
import CharacterResponse from './CharacterResponse';
import { initialCharacters } from '../data/characters';
import type { PlayerStats } from '../types/game';
import { useSelector } from '@xstate/react';
import type { ActorRefFrom } from 'xstate';
import type { gameMachine } from '../state-machines/game-machine';
import { getPersonalityHint } from '../lib/helpers'

interface GameLayoutProps {
  machineState: any; // XState state
  send: any; // XState send function
  uiState: {
    currentCharacterIndex: number;
    showStatsModal: boolean;
  };
  setUiState: React.Dispatch<React.SetStateAction<{
    currentCharacterIndex: number;
    showStatsModal: boolean;
  }>>;
  promotionKey: string | null;
  onPromotionDismiss: () => void;
}

function GameLayout({ machineState, send, uiState, setUiState, promotionKey, onPromotionDismiss }: GameLayoutProps) {
  // Use initialCharacters for navigation (matches state machine)
  const availableCharacters = initialCharacters;
  const currentCharacterData = availableCharacters[uiState.currentCharacterIndex];
  
  // Get data from state machine context
  const { season, giftsRemaining, supportPoints, characterType, rank, characters: characterActors, lastCharacterResponse } = machineState.context;
  
  // Get current character's support level from character actor
  const characterActor = characterActors[currentCharacterData.name];
  const currentCharacterSupport = useSelector(characterActor, (state) => state.context.supportLevel);
  const currentCharacterPersonality = getPersonalityHint(currentCharacterData.vectors);
  
  // Create a UI-compatible character object
  const currentCharacter = {
    name: currentCharacterData.name,
    type: currentCharacterData.type,
    supportLevel: currentCharacterSupport,
    suspicion: 0,
    personalityVectors: currentCharacterData.vectors,
    relationshipVectors: {
      trustInPlayer: currentCharacterData.vectors.trust,
      loyaltyToPlayer: currentCharacterData.vectors.loyalty,
      fearOfPlayer: currentCharacterData.vectors.fear,
      dependenceOnPlayer: currentCharacterData.vectors.influence,
      loveForPlayer: currentCharacterData.vectors.romantic
    },
    lastResponse: "",
    imgPath: currentCharacterData.imgPath
  };

  // Get player stats from machine context
  const playerStats: PlayerStats = machineState.context.playerPersonality;

  const handlePrevious = () => {
    setUiState(prev => {
      const newIndex = prev.currentCharacterIndex === 0 ? availableCharacters.length - 1 : prev.currentCharacterIndex - 1;
      console.log(`Navigating to previous character: ${availableCharacters[newIndex].name}`);
      return { ...prev, currentCharacterIndex: newIndex };
    });
  };

  const handleNext = () => {
    setUiState(prev => {
      const newIndex = prev.currentCharacterIndex === availableCharacters.length - 1 ? 0 : prev.currentCharacterIndex + 1;
      console.log(`Navigating to next character: ${availableCharacters[newIndex].name}`);
      return { ...prev, currentCharacterIndex: newIndex };
    });
  };

  const handleAction = (action: string, messageType?: string) => {
    console.log(`Action performed: ${action} on ${currentCharacterData.name}`);
    
    if (action === 'gift') {
      send({
        type: 'GIVE_GIFT_SIMPLE',
        characterId: currentCharacterData.name,
        characterType: currentCharacterData.type
      });
    } else if (action === 'message' && messageType) {
      send({
        type: 'GIVE_GIFT_WITH_MESSAGE',
        characterId: currentCharacterData.name,
        messageType: messageType as 'ambitious' | 'loyal' | 'cautious' | 'neutral',
        characterType: currentCharacterData.type
      });
    } else if (action === 'spit') {
      send({
        type: 'SPIT_IN_FACE',
        characterId: currentCharacterData.name
      });
    }
  };

  const handleNextSeason = () => {
    send({ type: 'NEXT_SEASON' });
  };

  const handleStatsClick = () => {
    console.log('Opening stats modal');
    setUiState(prev => ({ ...prev, showStatsModal: true }));
  };

  const handleCloseModal = () => {
    console.log('Closing stats modal');
    setUiState(prev => ({ ...prev, showStatsModal: false }));
  };



  // Create gameState object for components that still expect it
  const gameState = {
    playerType: characterType,
    rank: rank || '',
    season,
    systemSupport: supportPoints,
    gifts: giftsRemaining,
    currentCharacterIndex: uiState.currentCharacterIndex,
    showStatsModal: uiState.showStatsModal,
    isGameStarted: true,
    characterSupport: {}
  };

  return (
    <div className="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr]">
      {/* Character Response */}
      <CharacterResponse response={lastCharacterResponse} />

      {/* Promotion Notification */}
      {(() => {
        console.log('Render check:', { promotionKey, rank, shouldShow: promotionKey && rank });
        return promotionKey && rank && (
          <PromotionNotification 
            key={promotionKey}
            rank={rank}
            onDismiss={onPromotionDismiss}
          />
        );
      })()}

      {/* Header area */}
      <GameHeader
        gameState={gameState}
        onStatsClick={handleStatsClick}
        onNextSeason={handleNextSeason}
      />

      {/* Main content area */}
      <div className="flex items-center justify-center gap-8 p-8">
        <CharacterDisplay
          character={currentCharacter}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
        <div className="flex flex-col gap-6">
          <CharacterInfo character={currentCharacter} personality={currentCharacterPersonality} />
          <ActionButtons
            character={currentCharacter}
            onAction={handleAction}
            gifts={giftsRemaining}
          />
        </div>
      </div>

      {/* Stats Modal */}
      <StatsModal
        isOpen={uiState.showStatsModal}
        onClose={handleCloseModal}
        playerStats={playerStats}
      />
    </div>
  );
}

export default GameLayout;
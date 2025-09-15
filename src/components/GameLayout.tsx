import React, { useEffect } from 'react';
import CharacterDisplay from './CharacterDisplay';
import CharacterInfo from './CharacterInfo';
import GameHeader from './GameHeader';
import ActionButtons from './ActionButtons';
import StatsModal from './StatsModal';
import PromotionNotification from './PromotionNotification';
import CharacterResponse from './CharacterResponse';
import FactionPanel from './FactionPanel';
import EmperorAudienceOffer from './EmperorAudienceOffer';
import EmperorAudienceScreen from './EmperorAudienceScreen';
import { initialCharacters } from '../data/characters';
import type { PlayerStats, PlayerReputation } from '../types/game';
import { useSelector } from '@xstate/react';
import { getPersonalityHint } from '../lib/helpers';
import type { FactionType } from '../lib/factionSystem';
import { determineVictoryPath, isAtMaxSuspicion } from '../lib/emperorAudience';

// Separate component to handle character data with proper hook usage
function CharacterDataHandler({
  characterActor,
  characterData,
  children
}: {
  characterActor: any;
  characterData: any;
  children: (data: any) => React.ReactNode;
}) {
  // Only call useSelector hooks when we have a valid actor
  if (!characterActor) {
    // Return default values when no actor
    const defaultData = {
      supportLevel: 0,
      suspicion: 0,
      personalityVectors: {},
      relationshipVectors: {},
      suspicionThreshold: 1,
      hasGivenGifts: false,
      giftCooldownUntil: null
    };
    return <>{children(defaultData)}</>;
  }

  // Now we can safely use useSelector since this component only renders when we have an actor
  const supportLevel = useSelector(characterActor, (state: any) => state.context.supportLevel);
  const suspicion = useSelector(characterActor, (state: any) => state.context.suspicion);
  const personalityVectors = useSelector(characterActor, (state: any) => state.context.personalityVectors);
  const relationshipVectors = useSelector(characterActor, (state: any) => state.context.relationshipVectors);
  const suspicionThreshold = useSelector(characterActor, (state: any) => state.context.suspicionThreshold);
  const hasGivenGifts = useSelector(characterActor, (state: any) => state.context.hasGivenGifts);
  const giftCooldownUntil = useSelector(characterActor, (state: any) => state.context.giftCooldownUntil);

  return <>{children({
    supportLevel,
    suspicion,
    personalityVectors,
    relationshipVectors,
    suspicionThreshold,
    hasGivenGifts,
    giftCooldownUntil
  })}</>;
}

// Separate component to handle emperor audience state with proper hook usage
function EmperorAudienceHandler({ machineState, send }: { machineState: any; send: any }) {
  console.log('Machine state children:', machineState.children);
  console.log('Available child keys:', Object.keys(machineState.children || {}));

  const audienceActor = machineState.children?.emperorAudienceMachine;

  if (!audienceActor) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="text-white text-xl">Loading emperor audience...</div>
      </div>
    );
  }

  // Now we can safely use useSelector since this component only renders when we have an actor
  const audienceState = useSelector(audienceActor, (state: any) => state);

  const victoryPath = audienceState.context?.victoryPath;
  const questions = audienceState.context?.questions || [];
  const currentQuestionIndex = audienceState.context?.currentQuestionIndex || 0;
  const emperorMessage = audienceState.context?.emperorMessage || '';
  const outcome = audienceState.context?.outcome;
  const isComplete = !!outcome; // Simple: if there's an outcome, show the result screen

  // Debug logging
  console.log('Audience machine state:', {
    state: audienceState.value,
    questionsLength: questions.length,
    currentQuestionIndex,
    isComplete,
    victoryPath,
    context: audienceState.context
  });

  // Additional debugging for completion state
  console.log('Audience state debug:', {
    isComplete,
    outcome,
    emperorMessage,
    machineState: audienceState.value,
    context: audienceState.context
  });

  if (isComplete) {
    console.log('Audience machine is complete, context:', audienceState.context);
    console.log('Machine state matches audience_complete:', audienceState.matches('audience_complete'));
    console.log('Outcome from audience machine:', outcome);
  }

  if (!victoryPath) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="text-white text-xl">Error: No victory path available</div>
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
        audienceActor.send({ type: 'ANSWER_QUESTION', answer });
      }}
    />
  );
}

interface GameLayoutProps {
  machineState: any; // XState state
  send: any; // XState send function
  uiState: {
    currentCharacterIndex: number;
    showStatsModal: boolean;
    showFactionPanel: boolean;
  };
  setUiState: React.Dispatch<
    React.SetStateAction<{
      currentCharacterIndex: number;
      showStatsModal: boolean;
      showFactionPanel: boolean;
    }>
  >;
  promotionKey: string | null;
  onPromotionDismiss: () => void;
}

function GameLayout({
  machineState,
  send,
  uiState,
  setUiState,
  promotionKey,
  onPromotionDismiss
}: GameLayoutProps) {
  // Pull useful context values early
  const {
    season,
    giftsRemaining,
    supportPoints,
    characterType,
    rank,
    characters: characterActors,
    lastCharacterResponse,
    suspiciousCharacters,
    factionSystem
  } = machineState.context;

  // Use activeCharacterNames (seasonal pool) instead of all spawned actors
  const activeNames: string[] = machineState.context.activeCharacterNames ?? [];
  const availableCharacters = initialCharacters.filter((char) =>
    activeNames.includes(char.name)
  );

  // Calculate safe character data
  const safeCharacterIndex = availableCharacters.length > 0
    ? Math.min(uiState.currentCharacterIndex, Math.max(0, availableCharacters.length - 1))
    : 0;
  const currentCharacterData = availableCharacters[safeCharacterIndex];
  const characterActor = characterActors && currentCharacterData ? characterActors[currentCharacterData.name] : undefined;

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Synchronize character index when available characters change
  useEffect(() => {
    if (availableCharacters.length > 0) {
      const maxIndex = availableCharacters.length - 1;
      if (uiState.currentCharacterIndex > maxIndex || uiState.currentCharacterIndex < 0) {
        console.log(`Resetting character index from ${uiState.currentCharacterIndex} to 0 (max: ${maxIndex})`);
        setUiState(prev => ({ ...prev, currentCharacterIndex: 0 }));
      }
    }
  }, [availableCharacters.length, uiState.currentCharacterIndex, setUiState]);

  // Debug logging for character navigation issues
  if (uiState.currentCharacterIndex !== safeCharacterIndex) {
    console.log(`Character index mismatch: UI=${uiState.currentCharacterIndex}, Safe=${safeCharacterIndex}, Available=${availableCharacters.length}`);
  }

  // NOW we can do conditional returns after all hooks are called
  // If no active characters this season, render a placeholder UI
  if (availableCharacters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr]">
        <CharacterResponse response={lastCharacterResponse} />

        {promotionKey && rank && (
          <PromotionNotification
            key={promotionKey}
            rank={rank}
            playerInfluence={(machineState.context.playerPersonality as PlayerStats).influence}
            onDismiss={onPromotionDismiss}
          />
        )}

        <GameHeader
          gameState={{
            playerType: characterType,
            rank: rank || '',
            season,
            systemSupport: supportPoints,
            gifts: giftsRemaining,
            currentCharacterIndex: uiState.currentCharacterIndex,
            showStatsModal: uiState.showStatsModal,
            isGameStarted: true,
            characterSupport: {}
          }}
          onStatsClick={() => setUiState((prev) => ({ ...prev, showStatsModal: true }))}
          onNextSeason={() => send({ type: 'NEXT_SEASON' })}
          suspiciousCharacters={suspiciousCharacters}
          characterType={characterType}
        />

        <div className="flex items-center justify-center p-8">
          <div>No characters are active this season.</div>
        </div>
      </div>
    );
  }

  // extra guard: if still undefined, render a placeholder to avoid crash
  if (!currentCharacterData) {
    console.error('No currentCharacterData — activeNames/availableCharacters:', {
      activeNames: machineState.context.activeCharacterNames,
      availableCharacters
    });

    return (
      <div className="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr]">
        <GameHeader
          gameState={{
            playerType: characterType,
            rank: rank || '',
            season,
            systemSupport: supportPoints,
            gifts: giftsRemaining,
            currentCharacterIndex: uiState.currentCharacterIndex,
            showStatsModal: uiState.showStatsModal,
            isGameStarted: true,
            characterSupport: {}
          }}
          onStatsClick={() => setUiState(prev => ({ ...prev, showStatsModal: true }))}
          onNextSeason={() => send({ type: 'NEXT_SEASON' })}
          suspiciousCharacters={suspiciousCharacters}
          characterType={characterType}
        />
        <div className="flex items-center justify-center p-8">
          <div>Loading characters...</div>
        </div>
      </div>
    );
  }

  // If actor ref isn't present (spawn issue), show a placeholder
  if (!characterActor) {
    return (
      <div className="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr]">
        <GameHeader
          gameState={{
            playerType: characterType,
            rank: rank || '',
            season,
            systemSupport: supportPoints,
            gifts: giftsRemaining,
            currentCharacterIndex: uiState.currentCharacterIndex,
            showStatsModal: uiState.showStatsModal,
            isGameStarted: true,
            characterSupport: {}
          }}
          onStatsClick={() => setUiState((prev) => ({ ...prev, showStatsModal: true }))}
          onNextSeason={() => send({ type: 'NEXT_SEASON' })}
          suspiciousCharacters={suspiciousCharacters}
          characterType={characterType}
        />
        <div className="flex items-center justify-center p-8">
          <div>Loading character...</div>
        </div>
      </div>
    );
  }

  // Get player stats from machine context
  const playerStats: PlayerStats = machineState.context.playerPersonality;
  const playerReputation: PlayerReputation = machineState.context.playerReputation;

  const handlePrevious = () => {
    console.log(`Previous clicked - Available: ${availableCharacters.length}, Current: ${uiState.currentCharacterIndex}`);

    if (availableCharacters.length === 0) {
      console.warn('No available characters for navigation');
      return;
    }

    setUiState((prev) => {
      const maxIndex = availableCharacters.length - 1;
      const currentIndex = Math.min(prev.currentCharacterIndex, maxIndex);
      const newIndex = currentIndex === 0 ? maxIndex : currentIndex - 1;
      const prevCharacter = availableCharacters[newIndex];

      console.log(`Previous navigation: ${currentIndex} -> ${newIndex}, Character: ${prevCharacter?.name || 'undefined'}`);

      if (!prevCharacter) {
        console.error('Previous character is undefined!', { newIndex, availableCharacters });
        return prev; // Don't change state if character is undefined
      }

      return { ...prev, currentCharacterIndex: newIndex };
    });
  };

  const handleNext = () => {
    console.log(`Next clicked - Available: ${availableCharacters.length}, Current: ${uiState.currentCharacterIndex}`);

    if (availableCharacters.length === 0) {
      console.warn('No available characters for navigation');
      return;
    }

    setUiState((prev) => {
      const maxIndex = availableCharacters.length - 1;
      const currentIndex = Math.min(prev.currentCharacterIndex, maxIndex);
      const newIndex = currentIndex === maxIndex ? 0 : currentIndex + 1;
      const nextCharacter = availableCharacters[newIndex];

      console.log(`Next navigation: ${currentIndex} -> ${newIndex}, Character: ${nextCharacter?.name || 'undefined'}`);

      if (!nextCharacter) {
        console.error('Next character is undefined!', { newIndex, availableCharacters });
        return prev; // Don't change state if character is undefined
      }

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
    setUiState((prev) => ({ ...prev, showStatsModal: true }));
  };

  const handleCloseModal = () => {
    console.log('Closing stats modal');
    setUiState((prev) => ({ ...prev, showStatsModal: false }));
  };

  const handleJoinFaction = (faction: FactionType) => {
    console.log(`Joining faction: ${faction}`);
    send({ type: 'JOIN_FACTION', faction });
  };

  const handleToggleFactionPanel = () => {
    setUiState((prev) => ({ ...prev, showFactionPanel: !prev.showFactionPanel }));
  };

  // Add keyboard navigation for debugging
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      } else if (event.key === 'r' && event.ctrlKey) {
        // Ctrl+R to reset character index
        event.preventDefault();
        console.log('Resetting character index to 0');
        setUiState(prev => ({ ...prev, currentCharacterIndex: 0 }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePrevious, handleNext, setUiState]);

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

  // Handle emperor audience offer state
  if (machineState.matches('emperor_audience_offer')) {
    const victoryPath = determineVictoryPath(machineState.context);
    const atMaxSuspicion = isAtMaxSuspicion(machineState.context);

    if (!victoryPath) {
      console.error('Emperor audience offer state reached without valid victory path');
      return <div>Error: Invalid emperor audience state</div>;
    }

    return (
      <EmperorAudienceOffer
        victoryPath={victoryPath}
        isAtMaxSuspicion={atMaxSuspicion}
        onEnterAudience={() => send({ type: 'ENTER_AUDIENCE' })}
        onRefuse={() => send({ type: 'REFUSE_AUDIENCE' })}
      />
    );
  }

  // Handle emperor audience state
  if (machineState.matches('emperor_audience')) {
    return <EmperorAudienceHandler machineState={machineState} send={send} />;
  }

  return (
    <CharacterDataHandler
      characterActor={characterActor}
      characterData={currentCharacterData}
    >
      {(characterData) => {
        // Create a UI-compatible character object with the data from the handler
        const currentCharacter = {
          name: currentCharacterData.name,
          type: currentCharacterData.type,
          supportLevel: characterData.supportLevel,
          suspicion: characterData.suspicion,
          personalityVectors: characterData.personalityVectors,
          relationshipVectors: characterData.relationshipVectors,
          lastResponse: '',
          imgPath: currentCharacterData.imgPath,
          suspicionThreshold: characterData.suspicionThreshold,
          hasGivenGifts: characterData.hasGivenGifts,
          giftCooldownUntil: characterData.giftCooldownUntil
        };

        const currentCharacterPersonality = getPersonalityHint(characterData.personalityVectors);

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
                  playerInfluence={playerStats.influence}
                  onDismiss={onPromotionDismiss}
                />
              );
            })()}

            {/* Suspicion Warning */}
            {(() => {
              if (!characterType || suspiciousCharacters.length === 0) return null;

              const executionThresholds = { concubine: 1, minister: 3, prince: 5 };
              const threshold = executionThresholds[characterType as keyof typeof executionThresholds];
              const isNearThreshold = suspiciousCharacters.length >= threshold - 1;

              if (isNearThreshold) {
                return (
                  <>
                    <input id="warning-close" type="checkbox" className="sr-only peer" />
                    <div className="fixed top-16 right-4 bg-red-100 border border-red-400
                                text-red-700 px-4 py-3 rounded shadow-lg z-50 max-w-sm
                                peer-checked:hidden">
                      <div className="flex items-start justify-between">
                        <div>
                          <strong>Warning!</strong> You have {suspiciousCharacters.length} suspicious
                          character(s).
                          {suspiciousCharacters.length >= threshold
                            ? ' Game over imminent!'
                            : ` Execution at ${threshold}.`}
                          <div className="text-sm mt-1">Suspicious: {suspiciousCharacters.join(', ')}</div>
                        </div>

                        <label
                          htmlFor="warning-close"
                          className="ml-3 text-red-700 hover:text-red-900 cursor-pointer
                                text-2xl leading-none select-none"
                          aria-label="Close warning"
                          title="Close"
                        >
                          ×
                        </label>
                      </div>
                    </div>
                  </>
                );
              }
              return null;
            })()}

            {/* Header area */}
            <GameHeader
              gameState={gameState}
              onStatsClick={handleStatsClick}
              onNextSeason={handleNextSeason}
              onFactionsClick={handleToggleFactionPanel}
              suspiciousCharacters={suspiciousCharacters}
              characterType={characterType}
            />

            {/* Main content area */}
            <div className="flex items-center justify-center gap-8 p-8">
              <CharacterDisplay character={currentCharacter} onPrevious={handlePrevious} onNext={handleNext} />
              <div className="flex flex-col gap-6">
                {/* Character navigation indicator */}
                <div className="text-center text-sm text-gray-600">
                  Character {safeCharacterIndex + 1} of {availableCharacters.length}
                  {uiState.currentCharacterIndex !== safeCharacterIndex && (
                    <span className="text-red-600 ml-2">
                      (Index mismatch: UI={uiState.currentCharacterIndex}, Safe={safeCharacterIndex})
                    </span>
                  )}
                </div>

                <CharacterInfo
                  character={currentCharacter}
                  personality={currentCharacterPersonality}
                  canShowStats={true}
                  currentSeason={season}
                />
                <ActionButtons character={currentCharacter} onAction={handleAction} gifts={giftsRemaining} playerStats={playerStats} />
              </div>

              {/* Faction Panel */}
              {uiState.showFactionPanel && (
                <div className="fixed right-4 top-20 z-40">
                  <FactionPanel
                    factionSystem={factionSystem}
                    allCharacters={characterActors}
                    onJoinFaction={handleJoinFaction}
                  />
                </div>
              )}
            </div>

            {/* Stats Modal */}
            <StatsModal isOpen={uiState.showStatsModal} onClose={handleCloseModal} playerStats={playerStats} playerReputation={playerReputation} />
          </div>
        );
      }}
    </CharacterDataHandler>
  );
}

export default GameLayout;
import { useEffect } from 'react';
import type { VictoryPath, AIQuestion } from '../types/emperorAudience';

interface EmperorAudienceScreenProps {
  victoryPath: VictoryPath;
  questions: AIQuestion[];
  currentQuestionIndex: number;
  isComplete: boolean;
  emperorMessage: string;
  outcome: 'victory' | 'execution' | 'failure' | null;
  onAnswerQuestion: (answer: 'a' | 'b' | 'c') => void;
}

function EmperorAudienceScreen({
  victoryPath,
  questions,
  currentQuestionIndex,
  isComplete,
  emperorMessage,
  outcome,
  onAnswerQuestion
}: EmperorAudienceScreenProps) {
  // Debug logging
  console.log('EmperorAudienceScreen props:', {
    isComplete,
    outcome,
    emperorMessage: emperorMessage ? 'has message' : 'no message',
    questionsLength: questions.length
  });

  // Get background image based on victory path
  // TODO: Replace with actual victory path images when available
  const getBackgroundImage = (path: VictoryPath): string => {
    // For now, use the existing harem background for all paths
    // Future images should be:
    // - traditional: '/traditional-path.png' - grand imperial throne room
    // - shadow-ruler: '/shadow-ruler-path.png' - dimly lit private chamber  
    // - revolutionary: '/revolutionary-path.png' - tense court with overturned furniture
    // - survivor: '/survivor-path.png' - foreboding judgment hall
    if (path === 'traditional') {
      return '/traditional-path.png';
    } else if (path === 'shadow-ruler') {
      return '/shadow-ruler-path.png';
    } else if (path === 'revolutionary') {
      return '/revolutionary-path.png';
    } else if (path === 'survivor') {
      return '/survivor-path.png';
    } else {
      return '/harem-empire-background.png';
    }
  };

  const backgroundImage = getBackgroundImage(victoryPath);
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;



  // Add keyboard navigation for answer selection
  useEffect(() => {
    if (isComplete || !currentQuestion) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'a' || key === 'b' || key === 'c') {
        event.preventDefault();
        onAnswerQuestion(key as 'a' | 'b' | 'c');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isComplete, currentQuestion, onAnswerQuestion]);

  return (
    <div
      className="fixed inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Dark gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      {/* Content Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg shadow-2xl max-w-4xl w-full mx-4 p-8">

          {/* Show questions if not complete */}
          {!isComplete && currentQuestion && (
            <>
              {/* Progress Indicator */}
              <div className="text-center mb-8">
                <div className="text-yellow-300 text-lg font-semibold">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Text */}
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  The Emperor Speaks:
                </h2>
                <p className="text-xl md:text-2xl text-yellow-100 leading-relaxed">
                  "{currentQuestion.text}"
                </p>
              </div>

              {/* Keyboard hint */}
              <div className="text-center mb-4">
                <p className="text-yellow-300/70 text-sm">
                  Click an option or press A, B, or C on your keyboard
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-4" role="radiogroup" aria-label="Answer options">
                {Object.entries(currentQuestion.options).map(([key, text]) => (
                  <button
                    key={key}
                    onClick={() => onAnswerQuestion(key as 'a' | 'b' | 'c')}
                    className="w-full text-left p-6 bg-white/10 hover:bg-white/20 
                               border border-white/20 hover:border-yellow-400/50
                               rounded-lg transition-all duration-200 
                               hover:shadow-lg hover:scale-[1.02]
                               text-white hover:text-yellow-100
                               focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    aria-label={`Option ${key.toUpperCase()}: ${text}`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-yellow-400 font-bold text-xl min-w-[2rem]">
                        {key.toUpperCase()}.
                      </span>
                      <span className="text-lg leading-relaxed">
                        {text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Show emperor message when complete */}
          {isComplete && (
            <div className="text-center">
              <h2 className={`text-3xl md:text-4xl font-bold mb-8 ${
                outcome === 'victory' 
                  ? 'text-yellow-400' 
                  : outcome === 'execution'
                  ? 'text-red-400'
                  : 'text-gray-400'
              }`}>
                The Emperor's Judgment
              </h2>
              {emperorMessage && (
                <div className={`border rounded-lg p-8 mb-8 ${
                  outcome === 'victory' 
                    ? 'bg-yellow-50/10 border-yellow-400/30' 
                    : outcome === 'execution'
                    ? 'bg-red-50/10 border-red-400/30'
                    : 'bg-white/10 border-gray-400/30'
                }`}>
                  <p className="text-xl md:text-2xl text-white leading-relaxed italic">
                    "{emperorMessage}"
                  </p>
                </div>
              )}
              
              {/* Outcome indicator */}
              <div className={`mb-6 p-4 rounded-lg ${
                outcome === 'victory' 
                  ? 'bg-yellow-500/20 text-yellow-300' 
                  : outcome === 'execution'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-gray-500/20 text-gray-300'
              }`}>
                <p className="text-lg font-semibold">
                  {outcome === 'victory' && '🎉 Victory! You have succeeded in your audience with the Emperor!'}
                  {outcome === 'execution' && '⚔️ Execution! The Emperor has ordered your death!'}
                  {outcome === 'failure' && '💔 Failure! You have been demoted and lost influence!'}
                </p>
              </div>

              {/* Final Result */}
              <div className="text-center mb-8">
                {outcome === 'victory' && (
                  <div>
                    <h3 className="text-3xl font-bold text-yellow-400 mb-4">🎉 VICTORY! 🎉</h3>
                    <p className="text-xl text-yellow-200 mb-4">
                      You have successfully won over the Emperor!
                    </p>
                    <p className="text-lg text-white">
                      Your political maneuvering has paid off. You now have the Emperor's favor and can claim your rightful place in the empire!
                    </p>
                  </div>
                )}
                
                {outcome === 'execution' && (
                  <div>
                    <h3 className="text-3xl font-bold text-red-400 mb-4">⚔️ EXECUTION ⚔️</h3>
                    <p className="text-xl text-red-200 mb-4">
                      The Emperor has ordered your death!
                    </p>
                    <p className="text-lg text-white">
                      Your political ambitions have been discovered and the Emperor has decided you are too dangerous to live. Your story ends here.
                    </p>
                  </div>
                )}
                
                {outcome === 'failure' && (
                  <div>
                    <h3 className="text-3xl font-bold text-gray-400 mb-4">💔 FAILURE 💔</h3>
                    <p className="text-xl text-gray-200 mb-4">
                      You have failed to impress the Emperor.
                    </p>
                    <p className="text-lg text-white">
                      You have been demoted and lost influence, but you live to scheme another day. Return to the game and rebuild your power.
                    </p>
                  </div>
                )}
              </div>

              {/* Game Over - Play Again button */}
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-2xl font-bold text-white mb-2">Game Over</h4>
                  <p className="text-gray-300">
                    {outcome === 'victory' 
                      ? 'You have achieved ultimate power!' 
                      : outcome === 'execution'
                      ? 'Your political career has ended permanently.'
                      : 'Your ambitions have been set back, but the game continues elsewhere.'}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    // Reload the page to restart the game completely
                    window.location.reload();
                  }}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {!isComplete && !currentQuestion && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-yellow-400 mb-4">
                Preparing Audience...
              </h2>
              <div className="text-white">
                <p>The Emperor is considering his questions...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmperorAudienceScreen;
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

  const verdicts = {
    victory: { line: 'You have successfully won over the Emperor!', detail: "Your political maneuvering has paid off. You now have the Emperor's favor and can claim your rightful place in the empire!", closing: 'You have achieved ultimate power!' },
    execution: { line: 'The Emperor has ordered your death!', detail: 'Your political ambitions have been discovered and the Emperor has decided you are too dangerous to live. Your story ends here.', closing: 'Your political career has ended permanently.' },
    failure: { line: 'You have failed to impress the Emperor.', detail: 'You have been demoted and lost influence, but you live to scheme another day. Return to the game and rebuild your power.', closing: 'Your ambitions have been set back, but the game continues elsewhere.' },
  } as const;
  const verdict = outcome ? verdicts[outcome] : null;

  return (
    <div className="audience-screen" style={{ ['--scene' as string]: `url(${backgroundImage})` }}>
      <div className="audience-scroll">
        {!isComplete && currentQuestion && <>
          <div className="audience-progress">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <progress value={currentQuestionIndex + 1} max={totalQuestions} />
          </div>
          <p className="emperor-eyebrow">The Emperor Speaks</p>
          <p className="audience-question">“{currentQuestion.text}”</p>
          <p className="audience-hint">Click an option or press A, B, or C on your keyboard</p>
          <div className="audience-options" role="radiogroup" aria-label="Answer options">
            {Object.entries(currentQuestion.options).map(([key, text]) => (
              <button key={key} onClick={() => onAnswerQuestion(key as 'a' | 'b' | 'c')} aria-label={`Option ${key.toUpperCase()}: ${text}`}>
                <b>{key.toUpperCase()}</b><span>{text}</span>
              </button>
            ))}
          </div>
        </>}

        {isComplete && <>
          <p className="emperor-eyebrow">The audience is over</p>
          <h1>The Emperor's Judgment</h1>
          <span className="ui-divider" />
          {emperorMessage && <p className="audience-verdict">“{emperorMessage}”</p>}
          {outcome && verdict && <>
            <p className={`audience-outcome is-${outcome}`}>{outcome === 'victory' ? 'Victory' : outcome === 'execution' ? 'Execution' : 'Failure'}</p>
            <p><strong>{verdict.line}</strong></p>
            <p>{verdict.detail}</p>
            <p style={{ marginTop: 14 }}><em>{verdict.closing}</em></p>
          </>}
          {/* Reload the page to restart the game completely */}
          <button className="ui-btn ui-btn-primary ui-btn-block" style={{ marginTop: 26 }} onClick={() => window.location.reload()}>Play Again</button>
        </>}

        {!isComplete && !currentQuestion && <>
          <h1>Preparing Audience…</h1>
          <p>The Emperor is considering his questions...</p>
        </>}
      </div>
    </div>
  );
}

export default EmperorAudienceScreen;
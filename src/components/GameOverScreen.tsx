import {formatRank} from "../lib/courtStrategy";
import type { VictoryPath } from '../types/emperorAudience';

interface GameOverScreenProps {
  careerEnding?:{title:string;description:string}|null;
  gameEndReason: 'victory' | 'defeat' | null;
  finalStats: {
    supportPoints: number;
    rank: string | null;
    season: number;
  };
  emperorAudienceCompleted?: boolean;
  emperorAudienceVictoryPath?: VictoryPath | null;
  emperorAudienceOutcome?: 'victory' | 'execution' | 'failure' | null;
  emperorMessage?: string;
  onRestart: () => void;
}

function GameOverScreen({ 
  careerEnding,
  gameEndReason, 
  finalStats, 
  emperorAudienceCompleted = false,
  emperorAudienceVictoryPath = null,
  emperorAudienceOutcome = null,
  emperorMessage = '',
  onRestart 
}: GameOverScreenProps) {
  const isEmperorAudienceExecution = emperorAudienceCompleted && emperorAudienceOutcome === 'execution';

  // Victory path specific messages
  const getVictoryPathMessage = (path: VictoryPath | null) => {
    switch (path) {
      case 'traditional':
        return {
          title: '👑 Imperial Succession!',
          message: 'The Emperor recognizes your legitimate claim to succession!',
          description: 'Your loyalty and political acumen have earned you the right to inherit the throne. The empire will transition peacefully under your rule.'
        };
      case 'shadow-ruler':
        return {
          title: '🎭 Shadow Ruler!',
          message: 'You now control the empire from behind the scenes!',
          description: 'While the Emperor remains on the throne, your influence shapes every decision. You are the true power in the empire.'
        };
      case 'revolutionary':
        return {
          title: '⚔️ Revolutionary Victory!',
          message: 'You have successfully overthrown the old order!',
          description: 'The Emperor has been deposed and you now lead a new government. Your revolution has transformed the empire forever.'
        };
      default:
        return null;
    }
  };

  const victoryMessage = getVictoryPathMessage(emperorAudienceVictoryPath);
  const isVictory = gameEndReason === 'victory' && emperorAudienceCompleted && emperorAudienceOutcome === 'victory' && victoryMessage !== null;

  const getDefeatMessage = () => {
    if(careerEnding)return{title:careerEnding.title,message:careerEnding.description,description:"Your court career ends here. Begin again with a new strategy."};
    if (isEmperorAudienceExecution) {
      return {
        title: '⚔️ Executed by Imperial Decree!',
        message: 'The Emperor has ordered your execution!',
        description: 'Your political ambitions have been discovered and the Emperor has decided you are too dangerous to live. Your story ends here.'
      };
    }
    return {
      title: '💀 Game Over',
      message: 'Your ambitions have been crushed!',
      description: 'The emperor\'s wrath has ended your political career permanently.'
    };
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
        {/* Game Over Title */}
        <h1 className={`text-4xl font-bold mb-6 ${
          isVictory ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {isVictory 
            ? victoryMessage.title
            : getDefeatMessage().title
          }
        </h1>
        
        {/* End Game Message */}
        <div className="mb-8">
          {isVictory ? (
            <div>
              <p className="text-lg text-gray-700 mb-2">
                {victoryMessage.message}
              </p>
              <p className="text-gray-600">
                {victoryMessage.description}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-700 mb-2">
                {getDefeatMessage().message}
              </p>
              <p className="text-gray-600">
                {getDefeatMessage().description}
              </p>
            </div>
          )}
        </div>

        {/* Emperor Audience Results */}
        {emperorAudienceCompleted && (
          <div className={`rounded-lg p-4 mb-6 ${
            emperorAudienceOutcome === 'victory' 
              ? 'bg-yellow-50 border border-yellow-200' 
              : emperorAudienceOutcome === 'execution'
              ? 'bg-red-50 border border-red-200'
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              emperorAudienceOutcome === 'victory' 
                ? 'text-yellow-800' 
                : emperorAudienceOutcome === 'execution'
                ? 'text-red-800'
                : 'text-gray-800'
            }`}>
              👑 Emperor Audience Result
            </h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Victory Path:</span>
                <span className="font-medium capitalize">
                  {emperorAudienceVictoryPath?.replace('-', ' ') || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Outcome:</span>
                <span className={`font-medium capitalize ${
                  emperorAudienceOutcome === 'victory' 
                    ? 'text-yellow-700' 
                    : emperorAudienceOutcome === 'execution'
                    ? 'text-red-700'
                    : 'text-gray-700'
                }`}>
                  {emperorAudienceOutcome === 'failure' ? 'Failed (Demoted)' : emperorAudienceOutcome}
                </span>
              </div>
              {emperorAudienceOutcome === 'failure' && (
                <p className="text-xs text-gray-500 mt-2">
                  You were demoted and lost influence, but continued playing until this final outcome.
                </p>
              )}
              {emperorMessage && (
                <div className="mt-3 p-2 bg-white rounded border">
                  <p className="text-xs font-medium text-gray-700 mb-1">Emperor's Words:</p>
                  <p className="text-xs text-gray-600 italic">"{emperorMessage}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Final Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Final Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Support Points:</span>
              <span className="font-medium">{finalStats.supportPoints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rank Achieved:</span>
              <span className="font-medium">{finalStats.rank ? formatRank(finalStats.rank) : 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Seasons Survived:</span>
              <span className="font-medium">{finalStats.season}</span>
            </div>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={onRestart}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

export default GameOverScreen;

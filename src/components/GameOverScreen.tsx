import React from 'react';

interface GameOverScreenProps {
  gameEndReason: 'victory' | 'defeat' | null;
  finalStats: {
    supportPoints: number;
    rank: string | null;
    season: number;
  };
  onRestart: () => void;
}

function GameOverScreen({ gameEndReason, finalStats, onRestart }: GameOverScreenProps) {
  const isVictory = gameEndReason === 'victory';
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
        {/* Game Over Title */}
        <h1 className={`text-4xl font-bold mb-6 ${
          isVictory ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {isVictory ? '🎉 Victory!' : '💀 Game Over'}
        </h1>
        
        {/* End Game Message */}
        <div className="mb-8">
          {isVictory ? (
            <div>
              <p className="text-lg text-gray-700 mb-2">
                Congratulations! You have successfully seized power!
              </p>
              <p className="text-gray-600">
                Your political maneuvering has paid off and you now rule the empire.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-700 mb-2">
                Your ambitions have been crushed!
              </p>
              <p className="text-gray-600">
                The emperor's wrath has ended your political career permanently.
              </p>
            </div>
          )}
        </div>

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
              <span className="font-medium">{finalStats.rank || 'None'}</span>
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
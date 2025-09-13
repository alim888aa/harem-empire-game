
import type { GameState } from '../types/game';

interface GameHeaderProps {
  gameState: GameState;
  onStatsClick: () => void;
  onNextSeason?: () => void;
}

function GameHeader({ gameState, onStatsClick, onNextSeason }: GameHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Stats section */}
        <div className="flex items-center space-x-6">
          <div className="text-sm font-medium text-gray-700">
            Season: <span className="text-gray-900">{gameState.season}</span>
          </div>
          <div className="text-sm font-medium text-gray-700">
            Support: <span className="text-gray-900">{gameState.systemSupport}</span>
          </div>
          <div className="text-sm font-medium text-gray-700">
            Gifts: <span className="text-gray-900">{gameState.gifts}</span>
          </div>
          <div className="text-sm font-medium text-gray-700">
            Rank: <span className="text-purple-600 font-semibold">{gameState.rank}</span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          {onNextSeason && (
            <button 
              onClick={onNextSeason}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Next Season
            </button>
          )}
          <button 
            onClick={onStatsClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Stats
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameHeader;
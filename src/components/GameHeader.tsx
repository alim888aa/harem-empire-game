
import type { GameState } from '../types/game';

interface GameHeaderProps {
  gameState: GameState;
  onStatsClick: () => void;
  onNextSeason?: () => void;
  onFactionsClick?: () => void;
  suspiciousCharacters?: string[];
  characterType?: 'prince' | 'minister' | 'concubine' | null;
}

function GameHeader({ gameState, onStatsClick, onNextSeason, onFactionsClick, suspiciousCharacters = [], characterType }: GameHeaderProps) {
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
          <div className="text-sm font-medium text-gray-700">
            Suspicious: <span className="text-red-600 font-semibold">{suspiciousCharacters.length}</span>
            {characterType && (
              <span className="text-gray-500 ml-1">
                /{characterType === 'concubine' ? 1 : characterType === 'minister' ? 3 : 5}
              </span>
            )}
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
          {onFactionsClick && (
            <button 
              onClick={onFactionsClick}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              Factions
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
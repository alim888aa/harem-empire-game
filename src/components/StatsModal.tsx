import { useEffect } from 'react';
import type { PlayerStats, PlayerReputation } from '../types/game';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerStats: PlayerStats;
  playerReputation: PlayerReputation;
}

function StatsModal({ isOpen, onClose, playerStats, playerReputation }: StatsModalProps) {
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4 transform transition-all duration-300 scale-100">
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Player Stats</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-2xl font-bold rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            ×
          </button>
        </div>
        
        {/* Stats content */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Influence:</span>
            <span className="text-gray-900 font-semibold">{playerStats.influence.toFixed(1)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Ambition:</span>
            <span className="text-gray-900 font-semibold">{playerStats.ambition.toFixed(1)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Loyalty:</span>
            <span className="text-gray-900 font-semibold">{playerStats.loyalty.toFixed(1)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Fear:</span>
            <span className="text-gray-900 font-semibold">{playerStats.fear.toFixed(1)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Charisma:</span>
            <span className="text-gray-900 font-semibold">{playerStats.charisma.toFixed(1)}</span>
          </div>
        </div>
        
        {/* Court Reputation Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Court Reputation
          </h3>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Perceived Loyalty:</span>
            <span className="text-gray-900 font-semibold">{Math.round(playerReputation.perceivedLoyalty * 100)}%</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Perceived Threat:</span>
            <span className="text-gray-900 font-semibold">{Math.round(playerReputation.perceivedThreat * 100)}%</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Trustworthiness:</span>
            <span className="text-gray-900 font-semibold">{Math.round(playerReputation.trustworthiness * 100)}%</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Political Skill:</span>
            <span className="text-gray-900 font-semibold">{Math.round(playerReputation.politicalSkill * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsModal;
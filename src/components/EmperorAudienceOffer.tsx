import React from 'react';
import type { VictoryPath } from '../types/emperorAudience';

interface EmperorAudienceOfferProps {
  victoryPath: VictoryPath;
  isAtMaxSuspicion: boolean;
  onEnterAudience: () => void;
  onRefuse: () => void;
}

function EmperorAudienceOffer({ 
  victoryPath, 
  isAtMaxSuspicion, 
  onEnterAudience, 
  onRefuse 
}: EmperorAudienceOfferProps) {
  // Victory path descriptions based on design document
  const getPathDescription = (path: VictoryPath): string => {
    switch (path) {
      case 'traditional':
        return 'The Emperor recognizes your legitimate claim and wishes to discuss succession. This is your chance to secure the throne through proper channels.';
      case 'shadow-ruler':
        return 'The Emperor seeks your counsel in private. Your influence behind the scenes has not gone unnoticed. Control the empire from the shadows.';
      case 'revolutionary':
        return 'The Emperor demands an explanation for your faction activities. This confrontation could lead to your rise to power or your downfall.';
      case 'survivor':
        return 'The Emperor has summoned you for judgment. Your suspicious activities have reached his attention. This may be your only chance to escape execution.';
      default:
        return 'The Emperor requests your presence for an important matter.';
    }
  };

  const getPathTitle = (path: VictoryPath): string => {
    switch (path) {
      case 'traditional':
        return 'Path of Legitimacy';
      case 'shadow-ruler':
        return 'Path of Influence';
      case 'revolutionary':
        return 'Path of Revolution';
      case 'survivor':
        return 'Path of Survival';
      default:
        return 'Imperial Summons';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Modal Container */}
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Imperial Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white p-6">
          <h1 className="text-3xl font-bold text-center mb-2">
            🏛️ The Emperor Requests an Audience
          </h1>
          <h2 className="text-xl text-center text-yellow-100">
            {getPathTitle(victoryPath)}
          </h2>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Victory Path Description */}
          <div className="mb-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              {getPathDescription(victoryPath)}
            </p>
          </div>

          {/* Warning for Survivor Path */}
          {isAtMaxSuspicion && victoryPath === 'survivor' && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 font-semibold">
                    Warning: Refusing this audience may result in immediate execution!
                  </p>
                  <p className="text-red-600 text-sm mt-1">
                    Your suspicious activities have reached the execution threshold. 
                    This audience may be your only chance to survive.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={onEnterAudience}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-8 rounded-lg 
                         transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="text-lg">👑 Enter Audience</span>
            </button>
            
            <button
              onClick={onRefuse}
              className={`font-bold py-4 px-8 rounded-lg transition-colors duration-200 shadow-lg 
                         ${isAtMaxSuspicion && victoryPath === 'survivor'
                           ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-xl transform hover:scale-105'
                           : 'bg-gray-500 hover:bg-gray-600 text-white hover:shadow-xl transform hover:scale-105'
                         }`}
            >
              <span className="text-lg">
                {isAtMaxSuspicion && victoryPath === 'survivor' ? '💀 Refuse (Risk Execution)' : '🚪 Refuse'}
              </span>
            </button>
          </div>

          {/* Additional Context */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              This is a pivotal moment in your political career. Choose wisely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmperorAudienceOffer;
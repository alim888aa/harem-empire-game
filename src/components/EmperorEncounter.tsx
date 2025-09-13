import React from 'react';

interface EmperorEncounterProps {
  onGiveGift: () => void;
  onRefuse: () => void;
  giftsRemaining: number;
}

function EmperorEncounter({ onGiveGift, onRefuse, giftsRemaining }: EmperorEncounterProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8 bg-gray-900 rounded-lg border-2 border-gold">
        <h1 className="text-4xl font-bold text-gold mb-6">The Emperor Approaches</h1>
        <p className="text-xl text-gray-300 mb-8">
          The Emperor has noticed your growing influence. He demands tribute.
        </p>
        <p className="text-lg text-gray-400 mb-8">
          You have {giftsRemaining} gifts remaining. The Emperor requires 10 gifts as tribute.
        </p>
        
        <div className="flex gap-6 justify-center">
          <button
            onClick={onGiveGift}
            disabled={giftsRemaining < 10}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-colors ${
              giftsRemaining >= 10
                ? 'bg-gold hover:bg-yellow-600 text-black'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Give Tribute (10 gifts)
          </button>
          
          <button
            onClick={onRefuse}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-colors"
          >
            Refuse
          </button>
        </div>
        
        {giftsRemaining < 10 && (
          <p className="text-red-400 mt-4">
            You don't have enough gifts to pay tribute. Refusing will end the game.
          </p>
        )}
      </div>
    </div>
  );
}

export default EmperorEncounter;
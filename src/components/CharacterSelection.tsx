import React from 'react';

export type PlayerType = 'prince' | 'minister' | 'concubine';

interface CharacterSelectionProps {
  onCharacterSelect: (type: PlayerType) => void;
}

const CharacterSelection: React.FC<CharacterSelectionProps> = ({ onCharacterSelect }) => {
  const characterOptions = [
    {
      type: 'prince' as PlayerType,
      title: 'Prince',
      description: 'Start with royal blood and natural authority',
      startingRank: 'Prince'
    },
    {
      type: 'minister' as PlayerType,
      title: 'Minister',
      description: 'Begin as a skilled political advisor',
      startingRank: 'Minister'
    },
    {
      type: 'concubine' as PlayerType,
      title: 'Concubine',
      description: 'Rise from the lowest position in the court',
      startingRank: 'Concubine'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-yellow-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-800 mb-4">Harem Empire</h1>
          <p className="text-lg text-gray-700">Choose your path to power</p>
        </div>

        <div className="grid gap-6">
          {characterOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => onCharacterSelect(option.type)}
              className="p-6 border-2 border-yellow-400 rounded-lg hover:bg-yellow-50 hover:border-yellow-600 transition-all duration-200 text-left group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-yellow-800 mb-2 group-hover:text-yellow-900">
                    {option.title}
                  </h3>
                  <p className="text-gray-600 mb-2">{option.description}</p>
                  <p className="text-sm text-yellow-700 font-medium">
                    Starting Rank: {option.startingRank}
                  </p>
                </div>
                <div className="text-yellow-600 group-hover:text-yellow-800 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Navigate the treacherous court politics to become Emperor</p>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelection;
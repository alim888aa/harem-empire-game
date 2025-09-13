import type { Character } from '../types/character';

interface CharacterInfoProps {
  character: Character;
  personality: string;
}

function CharacterInfo({ character, personality }: CharacterInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-80">
      {/* Character name */}
      <h2 className="text-2xl font-semibold text-center mb-4">
        {character.name}
      </h2>
      
      {/* Character details */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Type:</span>
          <span className="text-gray-900">{character.type}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Support:</span>
          <span className="text-gray-900">{character.supportLevel}/100</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Personality:</span>
          <span className="text-gray-900">{personality}</span>
        </div>
      </div>
    </div>
  );
}

export default CharacterInfo;
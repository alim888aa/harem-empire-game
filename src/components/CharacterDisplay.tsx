import type { Character } from '../types/character';

interface CharacterDisplayProps {
  character: Character;
  onPrevious: () => void;
  onNext: () => void;
}

function CharacterDisplay({ character, onPrevious, onNext }: CharacterDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Left arrow button */}
      <button
        onClick={() => {
          console.log('Previous character clicked');
          onPrevious();
        }}
        className="text-3xl hover:bg-gray-200 hover:scale-110 rounded-full p-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        aria-label="Previous character"
      >
        ←
      </button>

      {/* Character image */}
      <div className="flex-shrink-0">
        <img
          src={character.imgPath}
          alt={character.name}
          width="300"
          className="block transition-opacity duration-300 hover:scale-105 transform transition-transform"
          onError={() => {
            console.log('Image failed to load:', character.imgPath);
            // Fallback to a default image if needed
          }}
        />
      </div>

      {/* Right arrow button */}
      <button
        onClick={() => {
          console.log('Next character clicked');
          onNext();
        }}
        className="text-3xl hover:bg-gray-200 hover:scale-110 rounded-full p-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        aria-label="Next character"
      >
        →
      </button>
    </div>
  );
}

export default CharacterDisplay;
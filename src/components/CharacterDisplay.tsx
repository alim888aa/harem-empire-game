import {runtimePortrait} from '../data/runtimePortraits';
import {displayCharacterName} from '../lib/courtIdentity';
import type { Character } from "../types/character";

interface CharacterDisplayProps {
  character: Character;
  onPrevious: () => void;
  onNext: () => void;
  onPeople: () => void;
}

function CharacterDisplay({
  character,
  onPrevious,
  onNext,
  onPeople,
}: CharacterDisplayProps) {
  return (
    <figure className="portrait-stage">
      <img
        src={runtimePortrait(character.name,character.imgPath)}
        alt={displayCharacterName(character)}
        width="928"
        height="1120"
        className="court-portrait"
      />
      <div className="portrait-navigation">
        <button
          type="button"
          onClick={onPrevious}
          aria-label="Previous character"
          title="Previous courtier (←)"
        >
          <span aria-hidden="true">←</span>
        </button>
        <button className="people-button" onClick={onPeople}>People</button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next character"
          title="Next courtier (→)"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </figure>
  );
}

export default CharacterDisplay;

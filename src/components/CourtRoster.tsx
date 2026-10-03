import {runtimePortrait} from '../data/runtimePortraits';
import {displayCharacterName} from '../lib/courtIdentity';
import { useSelector } from "@xstate/react";
import type { ActorRefFrom } from "xstate";
import type { characterMachine } from "../state-machines/character-machine";
import type { InitialCharacterType } from "../types/character";
import type { PlayerStats } from "../types/game";
import { assignCharacterFaction } from "../lib/factionSystem";
import { getInfluenceGating } from "../lib/influenceGating";
import { giftCost } from "../lib/courtStrategy";
type CharacterActor = ActorRefFrom<typeof characterMachine>;
function CourtRosterEntry({
  actor,
  character,
  selected,
  onSelect,
  stats,
  rank,
}: {
  actor: CharacterActor;
  character: InitialCharacterType;
  selected: boolean;
  onSelect: () => void;
  stats: PlayerStats;
  rank?:string|null;
}) {
  const data = useSelector(actor, (snapshot) => snapshot.context);
  const locked = !getInfluenceGating({...data,type:character.type},stats,rank).canInteract.allowed;
  const danger = data.suspicion >= data.suspicionThreshold * 0.75;
  return (
    <button
      className={`roster-entry ${selected ? "is-selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <img src={runtimePortrait(character.name,character.imgPath)} alt="" loading="lazy" />
      <span className="roster-details">
        <strong>{displayCharacterName(character)}</strong>
        <small>{assignCharacterFaction({ ...data, type: character.type })}</small>
        <span className={danger ? "danger-text" : ""}>
          {danger
            ? "Suspicion rising"
            : locked
              ? "Influence required"
              : data.hasGivenAllegiance
                ? "Allegiance pledged"
                : data.supportLevel >= data.supportThreshold
                  ? "Supports your cause"
                  : `${giftCost(character)} gift${giftCost(character) === 1 ? "" : "s"} per action`}
        </span>
        <span className="roster-progress">
          <span
            style={{
              width: `${Math.max(0, Math.min(100, data.supportLevel))}%`,
            }}
          />
        </span>
      </span>
      <span className="roster-score">
        {data.supportLevel}
        <small>support</small>
      </span>
    </button>
  );
}
export default function CourtRoster({
  characters,
  actors,
  selectedIndex,
  onSelect,
  stats,
  rank,
}: {
  characters: InitialCharacterType[];
  actors: Record<string, CharacterActor>;
  selectedIndex: number;
  onSelect: (index: number) => void;
  stats: PlayerStats;
  rank?:string|null;
}) {
  return (
    <nav className="court-roster" aria-label="Characters at court">
      <div className="section-heading">
        <div>
          <p className="eyebrow">THIS SEASON</p>
          <h2>At court</h2>
        </div>
        <span className="count-badge">{characters.length}</span>
      </div>
      <div className="roster-list">
        {characters.map(
          (character, index) =>
            actors[character.name] && (
              <CourtRosterEntry
                key={character.name}
                actor={actors[character.name]}
                character={character}
                selected={index === selectedIndex}
                onSelect={() => onSelect(index)}
                stats={stats}
                rank={rank}
              />
            ),
        )}
      </div>
      <p className="roster-note">
        Relationships persist when courtiers leave this season’s roster.
      </p>
    </nav>
  );
}

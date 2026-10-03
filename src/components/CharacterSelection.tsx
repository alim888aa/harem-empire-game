import {runtimePortrait} from '../data/runtimePortraits';
import type { FC } from "react";

export type PlayerType = "prince" | "minister" | "concubine";

interface CharacterSelectionProps {
  onCharacterSelect: (type: PlayerType) => void;
}

const characterOptions: {
  type: PlayerType;
  title: string;
  subtitle: string;
  description: string;
  influence: number;
  tolerance: number;
  numeral: string;
}[] = [
  {
    type: "prince",
    title: "The Prince",
    subtitle: "Born to power",
    description:
      "Royal blood opens doors. Turn your head start into a court that stands behind you.",
    influence: 60,
    tolerance: 5,
    numeral: "I",
  },
  {
    type: "minister",
    title: "The Scholar",
    subtitle: "Power through persuasion",
    description:
      "Enter court with knowledge, read the room, and make yourself indispensable to the throne.",
    influence: 30,
    tolerance: 3,
    numeral: "II",
  },
  {
    type: "concubine",
    title: "The Concubine",
    subtitle: "A delicate ascent",
    description:
      "Begin with little influence. Earn quiet allies, and let no suspicion become certainty.",
    influence: 10,
    tolerance: 1,
    numeral: "III",
  },
];

const CharacterSelection: FC<CharacterSelectionProps> = ({
  onCharacterSelect,
}) => (
  <main className="path-selection">
    <div className="selection-palace" aria-hidden="true" />
    <div className="selection-content">
      <header className="selection-heading">
        <div className="selection-ornament" aria-hidden="true">
          <span />◆<span />
        </div>
        <p className="eyebrow">A game of favors, ambition & consequence</p>
        <h1>Harem Empire</h1>
        <p className="selection-intro">The throne is never won alone.</p>
        <p className="selection-description">
          Choose your place in the palace. Every gift builds a connection. Every
          word can change your fate.
        </p>
      </header>

      <div className="selection-section-heading">
        <h2>Choose your path</h2>
        <span>Three beginnings. Choose your allegiance.</span>
      </div>

      <div className="path-grid">
        {characterOptions.map((option) => (
          <button
            type="button"
            key={option.type}
            onClick={() => onCharacterSelect(option.type)}
            className={`path-card path-card-${option.type}`}
            aria-label={`Play as ${option.title}. ${option.influence}% starting influence. Defeat at ${option.tolerance} suspicious ${option.tolerance === 1 ? "courtier" : "courtiers"}.`}
          >
            <div className="path-portrait">
              <span className="path-numeral" aria-hidden="true">
                {option.numeral}
              </span>
              <img
                src={runtimePortrait(`@player:${option.type}`,`/${option.type}.png`)}
                alt=""
                width="928"
                height="1120"
              />
              <span className="path-subtitle">{option.subtitle}</span>
            </div>
            <div className="path-card-content">
              <h3>{option.title}</h3>
              <p className="path-description">{option.description}</p>
              <div className="path-metrics">
                <div>
                  <span>Starting influence</span>
                  <strong>
                    {option.influence}
                    <small>%</small>
                  </strong>
                </div>
                <div>
                  <span>Defeat threshold</span>
                  <strong>
                    {option.tolerance}
                    <small> suspicious</small>
                  </strong>
                </div>
              </div>
              <div className="path-enter">
                <span>Enter the court</span>
                <span aria-hidden="true">↗</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="selection-guide">
        <span className="selection-guide-label">Your path to power</span>
        <p>
          Build <strong>global support and influence</strong> to rise through three ranks. Join a faction,
          then face the Emperor to decide your ending.
        </p>
      </div>
      <p className="session-note">
        Saved stories resume on refresh · Save & game shows local storage status
      </p>
    </div>
  </main>
);

export default CharacterSelection;

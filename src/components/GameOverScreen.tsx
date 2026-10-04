import {formatRank} from "../lib/courtStrategy";
import type { VictoryPath } from '../types/emperorAudience';

interface GameOverScreenProps {
  careerEnding?:{title:string;description:string}|null;
  gameEndReason: 'victory' | 'defeat' | null;
  finalStats: {
    supportPoints: number;
    rank: string | null;
    season: number;
  };
  emperorAudienceCompleted?: boolean;
  emperorAudienceVictoryPath?: VictoryPath | null;
  emperorAudienceOutcome?: 'victory' | 'execution' | 'failure' | null;
  emperorMessage?: string;
  onRestart: () => void;
}

function GameOverScreen({ 
  careerEnding,
  gameEndReason, 
  finalStats, 
  emperorAudienceCompleted = false,
  emperorAudienceVictoryPath = null,
  emperorAudienceOutcome = null,
  emperorMessage = '',
  onRestart 
}: GameOverScreenProps) {
  const isEmperorAudienceExecution = emperorAudienceCompleted && emperorAudienceOutcome === 'execution';

  // Victory path specific messages
  const getVictoryPathMessage = (path: VictoryPath | null) => {
    switch (path) {
      case 'traditional':
        return {
          title: 'Imperial Succession',
          message: 'The Emperor recognizes your legitimate claim to succession!',
          description: 'Your loyalty and political acumen have earned you the right to inherit the throne. The empire will transition peacefully under your rule.'
        };
      case 'shadow-ruler':
        return {
          title: 'Shadow Ruler',
          message: 'You now control the empire from behind the scenes!',
          description: 'While the Emperor remains on the throne, your influence shapes every decision. You are the true power in the empire.'
        };
      case 'revolutionary':
        return {
          title: 'Revolutionary Victory',
          message: 'You have successfully overthrown the old order!',
          description: 'The Emperor has been deposed and you now lead a new government. Your revolution has transformed the empire forever.'
        };
      default:
        return null;
    }
  };

  const victoryMessage = getVictoryPathMessage(emperorAudienceVictoryPath);
  const isVictory = gameEndReason === 'victory' && emperorAudienceCompleted && emperorAudienceOutcome === 'victory' && victoryMessage !== null;

  const getDefeatMessage = () => {
    if(careerEnding)return{title:careerEnding.title,message:careerEnding.description,description:"Your court career ends here. Begin again with a new strategy."};
    if (isEmperorAudienceExecution) {
      return {
        title: 'Executed by Imperial Decree',
        message: 'The Emperor has ordered your execution!',
        description: 'Your political ambitions have been discovered and the Emperor has decided you are too dangerous to live. Your story ends here.'
      };
    }
    return {
      title: 'Your Story Ends',
      message: 'Your ambitions have been crushed!',
      description: 'The emperor\'s wrath has ended your political career permanently.'
    };
  };
  
  const ending = isVictory ? victoryMessage! : getDefeatMessage();
  return (
    <div className="ending-screen">
      <div className={`ending-scroll ${isVictory ? 'is-victory' : 'is-defeat'}`}>
        <p className="ui-eyebrow">{isVictory ? 'The court bows' : 'The court remembers'}</p>
        <h1>{ending.title}</h1>
        <span className="ui-divider" />
        <p className="ending-lead">{ending.message}</p>
        <p>{ending.description}</p>

        {emperorAudienceCompleted && (
          <section className="ending-ledger">
            <h3>Emperor Audience Result</h3>
            <dl>
              <div><dt>Victory Path</dt><dd>{emperorAudienceVictoryPath?.replace('-', ' ') || 'Unknown'}</dd></div>
              <div><dt>Outcome</dt><dd>{emperorAudienceOutcome === 'failure' ? 'Failed (Demoted)' : emperorAudienceOutcome}</dd></div>
            </dl>
            {emperorAudienceOutcome === 'failure' && <p>You were demoted and lost influence, but continued playing until this final outcome.</p>}
            {emperorMessage && <p className="ending-quote">“{emperorMessage}”</p>}
          </section>
        )}

        <section className="ending-ledger">
          <h3>Final Stats</h3>
          <dl>
            <div><dt>Support Points</dt><dd>{finalStats.supportPoints}</dd></div>
            <div><dt>Rank Achieved</dt><dd>{finalStats.rank ? formatRank(finalStats.rank) : 'None'}</dd></div>
            <div><dt>Seasons Survived</dt><dd>{finalStats.season}</dd></div>
          </dl>
        </section>

        <button className="ui-btn ui-btn-primary ui-btn-block" onClick={onRestart}>Play Again</button>
      </div>
    </div>
  );
}

export default GameOverScreen;

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

  const fatalRefusal = isAtMaxSuspicion && victoryPath === 'survivor';
  return (
    <div className="audience-screen">
      <div className="audience-scroll" role="dialog" aria-label="The Emperor requests an audience">
        <p className="emperor-eyebrow">{getPathTitle(victoryPath)}</p>
        <h1>The Emperor Requests an Audience</h1>
        <span className="ui-divider" />
        <p>{getPathDescription(victoryPath)}</p>
        {fatalRefusal && (
          <div className="audience-offer-warning" role="alert">
            <strong>Warning: Refusing this audience may result in immediate execution!</strong>
            Your suspicious activities have reached the execution threshold. This audience may be your only chance to survive.
          </div>
        )}
        <div className="ui-btn-row" style={{ marginTop: 26 }}>
          <button className="ui-btn ui-btn-gold" onClick={onEnterAudience}>Enter Audience</button>
          <button className={`ui-btn ${fatalRefusal ? 'ui-btn-primary' : 'ui-btn-lacquer'}`} onClick={onRefuse}>{fatalRefusal ? 'Refuse (Risk Execution)' : 'Refuse'}</button>
        </div>
        <p style={{ marginTop: 20, fontSize: 14 }}>This is a pivotal moment in your political career. Choose wisely.</p>
      </div>
    </div>
  );
}

export default EmperorAudienceOffer;

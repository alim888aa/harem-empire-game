import {tributeCost} from '../lib/campaignBalance';

interface EmperorEncounterProps {
  onGiveGift: () => void;
  onRefuse: () => void;
  giftsRemaining: number;
  role?:string|null;
  rank?:string|null;
  arrived?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onContinueIn2D?: () => void;
}

function EmperorEncounter({ onGiveGift, onRefuse, giftsRemaining, role=null, rank=null, arrived = true, loading = false, error = false, onRetry, onContinueIn2D }: EmperorEncounterProps) {
  const cost=tributeCost(role,rank);
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8 bg-gray-900 rounded-lg border-2 border-gold">
        <h1 className="text-4xl font-bold text-gold mb-6">{arrived ? "The Emperor awaits your answer" : error ? "The Emperor’s character couldn’t load" : loading ? "Preparing the Emperor’s arrival" : "The Emperor approaches"}</h1>
        <p className="text-xl text-gray-300 mb-8">
          The Emperor has noticed your growing influence. He demands tribute.
        </p>
        <p className="text-lg text-gray-400 mb-8">
          You have {giftsRemaining} gifts remaining. The Emperor requires {cost} gifts as tribute.
        </p>
        
        {!arrived && <p className="emperor-silence" role="status">{error ? "Your encounter is safe and your season clock is paused." : loading ? "Loading the Emperor’s character. Your season clock is paused." : "The palace falls silent. Footsteps draw closer."}</p>}
        {!arrived&&error&&<div className="emperor-recovery"><button onClick={onRetry}>Retry Emperor</button><button onClick={onContinueIn2D}>Continue in 2D</button></div>}
        <div className="flex gap-6 justify-center">
          <button
            onClick={onGiveGift}
            disabled={!arrived || giftsRemaining < cost}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-colors ${
              giftsRemaining >= cost
                ? 'bg-gold hover:bg-yellow-600 text-black'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Give Tribute ({cost} gifts)
          </button>
          
          <button
            onClick={onRefuse}
            disabled={!arrived}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-colors"
          >
            Refuse
          </button>
        </div>
        
        {giftsRemaining < cost && (
          <p className="text-red-400 mt-4">
            You cannot afford tribute. Refusal is fatal unless the Emperor grants a loyalty-based pardon.
          </p>
        )}
      </div>
    </div>
  );
}

export default EmperorEncounter;

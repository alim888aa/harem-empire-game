import type { Character } from '../types/character';
import type { PlayerStats } from '../types/game';
import { getInfluenceGating } from '../lib/influenceGating';

interface ActionButtonsProps {
  character: Character;
  gifts: number;
  playerStats: PlayerStats;
  onAction: (action: string, messageType?: string) => void;
}

function ActionButtons({ character, gifts, playerStats, onAction }: ActionButtonsProps) {
  // Get influence gating information
  const influenceGating = getInfluenceGating(character, playerStats);

  const handleGiveSimpleGift = () => {
    if (!influenceGating.canInteract.allowed) {
      alert(influenceGating.canInteract.reason);
      return;
    }
    onAction('gift');
  };

  const handleGiveGiftWithMessage = (messageType: string) => {
    if (!influenceGating.canInteract.allowed) {
      alert(influenceGating.canInteract.reason);
      return;
    }
    
    // Check specific message type availability
    let messageAllowed = true;
    let reason = '';
    
    switch (messageType) {
      case 'ambitious':
        messageAllowed = influenceGating.canUseAmbitiousMessage.allowed;
        reason = influenceGating.canUseAmbitiousMessage.reason || '';
        break;
      case 'loyal':
        messageAllowed = influenceGating.canUseLoyalMessage.allowed;
        reason = influenceGating.canUseLoyalMessage.reason || '';
        break;
      case 'cautious':
        messageAllowed = influenceGating.canUseCautiousMessage.allowed;
        reason = influenceGating.canUseCautiousMessage.reason || '';
        break;
      case 'neutral':
        messageAllowed = influenceGating.canUseNeutralMessage.allowed;
        reason = influenceGating.canUseNeutralMessage.reason || '';
        break;
    }
    
    if (!messageAllowed) {
      alert(reason);
      return;
    }
    
    onAction('message', messageType);
  };

  const handleSpitInFace = () => {
    if (!influenceGating.canInteract.allowed) {
      alert(influenceGating.canInteract.reason);
      return;
    }
    
    if (!influenceGating.canSpitInFace.allowed) {
      alert(influenceGating.canSpitInFace.reason);
      return;
    }
    
    onAction('spit');
  };

  // Show interaction refusal message if character won't interact
  if (!influenceGating.canInteract.allowed) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
          <p className="text-gray-600 font-medium">{influenceGating.canInteract.reason}</p>
          <p className="text-sm text-gray-500 mt-1">Build your influence to interact with this character.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      <button
        onClick={handleGiveSimpleGift}
        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500`}
      >
        Give Simple Gift
      </button>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Give Gift with Message:</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleGiveGiftWithMessage('ambitious')}
            disabled={!influenceGating.canUseAmbitiousMessage.allowed}
            title={!influenceGating.canUseAmbitiousMessage.allowed ? influenceGating.canUseAmbitiousMessage.reason : ''}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              influenceGating.canUseAmbitiousMessage.allowed
                ? 'bg-purple-500 hover:bg-purple-600 text-white focus:ring-purple-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Ambitious
          </button>
          <button
            onClick={() => handleGiveGiftWithMessage('loyal')}
            disabled={!influenceGating.canUseLoyalMessage.allowed}
            title={!influenceGating.canUseLoyalMessage.allowed ? influenceGating.canUseLoyalMessage.reason : ''}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              influenceGating.canUseLoyalMessage.allowed
                ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Loyal
          </button>
          <button
            onClick={() => handleGiveGiftWithMessage('cautious')}
            disabled={!influenceGating.canUseCautiousMessage.allowed}
            title={!influenceGating.canUseCautiousMessage.allowed ? influenceGating.canUseCautiousMessage.reason : ''}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              influenceGating.canUseCautiousMessage.allowed
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Cautious
          </button>
          <button
            onClick={() => handleGiveGiftWithMessage('neutral')}
            disabled={!influenceGating.canUseNeutralMessage.allowed}
            title={!influenceGating.canUseNeutralMessage.allowed ? influenceGating.canUseNeutralMessage.reason : ''}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              influenceGating.canUseNeutralMessage.allowed
                ? 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Neutral
          </button>
        </div>
        {(!influenceGating.canUseAmbitiousMessage.allowed || 
          !influenceGating.canUseLoyalMessage.allowed || 
          !influenceGating.canUseCautiousMessage.allowed || 
          !influenceGating.canUseNeutralMessage.allowed) && (
          <div className="text-xs text-gray-500 italic space-y-1">
            {!influenceGating.canUseAmbitiousMessage.allowed && (
              <p>• Ambitious: {influenceGating.canUseAmbitiousMessage.reason}</p>
            )}
            {!influenceGating.canUseLoyalMessage.allowed && (
              <p>• Loyal: {influenceGating.canUseLoyalMessage.reason}</p>
            )}
            {!influenceGating.canUseCautiousMessage.allowed && (
              <p>• Cautious: {influenceGating.canUseCautiousMessage.reason}</p>
            )}
            {!influenceGating.canUseNeutralMessage.allowed && (
              <p>• Neutral: {influenceGating.canUseNeutralMessage.reason}</p>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <button
          onClick={handleSpitInFace}
          disabled={!influenceGating.canSpitInFace.allowed}
          title={!influenceGating.canSpitInFace.allowed ? influenceGating.canSpitInFace.reason : ''}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            influenceGating.canSpitInFace.allowed
              ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Spit in Face
        </button>
        {!influenceGating.canSpitInFace.allowed && (
          <p className="text-xs text-gray-500 italic">{influenceGating.canSpitInFace.reason}</p>
        )}
      </div>
    </div>
  );
}

export default ActionButtons;
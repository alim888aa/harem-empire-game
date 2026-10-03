import { useEffect } from 'react';
import { shouldShowHighInfluenceNotification, getHighInfluenceNotification } from '../lib/influenceFear';

interface PromotionNotificationProps {
  rank: string;
  playerInfluence: number;
  onDismiss: () => void;
}

function PromotionNotification({ rank, playerInfluence, onDismiss }: PromotionNotificationProps) {
  console.log('PromotionNotification mounted with rank:', rank);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    console.log('PromotionNotification useEffect - setting timer');
    const timer = setTimeout(onDismiss, 4000);
    return () => {
      console.log('PromotionNotification useEffect - clearing timer');
      clearTimeout(timer);
    };
  }, [onDismiss]);

  // Format rank for display
  const formatRank = (rank: string) => {
    return rank.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const showInfluenceMessage = shouldShowHighInfluenceNotification(playerInfluence);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-yellow-600 text-white px-6 py-4 rounded-lg shadow-lg border-2 border-yellow-500 animate-bounce">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🎉</span>
            <div>
              <div className="font-bold text-lg">Promotion!</div>
              <div className="text-yellow-100">
                You are now {formatRank(rank)}!
              </div>
              <div className="text-yellow-100 text-sm">Your office now grants ordinary audiences with the court.</div>
              {showInfluenceMessage && (
                <div className="text-yellow-200 text-sm mt-1 italic">
                  {getHighInfluenceNotification()}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="ml-4 text-yellow-200 hover:text-white text-xl font-bold"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromotionNotification;

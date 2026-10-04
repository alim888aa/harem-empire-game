import { shouldShowHighInfluenceNotification, getHighInfluenceNotification } from '../lib/influenceFear';
import { formatRank } from '../lib/courtStrategy';
import { SealStamp } from '../ui';

interface PromotionNotificationProps {
  rank: string;
  playerInfluence: number;
  onDismiss: () => void;
}

export default function PromotionNotification({ rank, playerInfluence, onDismiss }: PromotionNotificationProps) {
  return <SealStamp eyebrow="By imperial decree" title={formatRank(rank)} onDismiss={onDismiss}>
    <p>You have been promoted. Your office now grants ordinary audiences with the court.</p>
    {shouldShowHighInfluenceNotification(playerInfluence) && <em>{getHighInfluenceNotification()}</em>}
  </SealStamp>;
}

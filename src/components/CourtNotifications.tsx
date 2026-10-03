import CourtDialog from './CourtDialog';
import type {GiftNotification} from '../lib/courtNotifications';
export default function CourtNotifications({notifications,onClose}:{notifications:readonly GiftNotification[];onClose:()=>void}){
 return <CourtDialog title="Notifications" onClose={onClose}>
  <p className="court-guide">Gifts are already in your inventory.</p>
  {notifications.length?<ol className="gift-notifications">{[...notifications].reverse().map(n=><li key={n.id}><strong>{n.name}</strong><span>+{n.amount} {n.amount===1?'gift':'gifts'}</span><small>Season {n.season}</small></li>)}</ol>:<p>No gifts received yet.</p>}
 </CourtDialog>;
}

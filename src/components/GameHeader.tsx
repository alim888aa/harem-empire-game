import { startingCareerTitle } from "../lib/careerAccess";
import type { GameState } from "../types/game";
import { formatRank } from "../lib/courtStrategy";
interface GameHeaderProps {
  gameState: GameState;
  onNextSeason?: () => void;
  onCourtClick: () => void;
  onProfileClick: () => void;
  onNotificationsClick?:()=>void;
  unreadNotifications?:number;
  characterType?: "prince" | "minister" | "concubine" | null;
}
export default function GameHeader({ gameState, onNextSeason, onCourtClick, onProfileClick, characterType, onNotificationsClick, unreadNotifications=0 }: GameHeaderProps) {
  return <header className="court-header"><div className="court-header-inner">
    <button type="button" className="game-brand" onClick={onProfileClick} aria-label="Open your player profile"><span aria-hidden="true">♜</span><div>
      <strong>Harem Empire</strong>
      <small>{gameState.rank ? formatRank(gameState.rank) : startingCareerTitle(characterType)}</small>
    </div></button>
    <div className="header-resources" aria-label="Empire resources">
      <div aria-label={`Season ${gameState.season}`}><span>SEASON</span><strong>{gameState.season.toString().padStart(2, "0")}</strong></div>
      <div aria-label={`Global support ${gameState.systemSupport}`}><span>GLOBAL SUPPORT</span><strong>{gameState.systemSupport}</strong></div>
      <div aria-label={`Gifts ${gameState.gifts}`}><span>GIFTS</span><strong>{gameState.gifts} <small>◇</small></strong></div>
    </div>
    <nav className="header-actions" aria-label="Game controls">
      {onNotificationsClick&&<button onClick={onNotificationsClick} aria-label={`Notifications${unreadNotifications?`, ${unreadNotifications} unread`:""}`}><span className="header-action-label">Notifications</span><span className="header-action-compact">Alerts</span>{unreadNotifications>0&&<span className="notification-badge">{unreadNotifications}</span>}</button>}
      <button className="profile-menu-button" onClick={onProfileClick}>Profile</button>
      <button onClick={onCourtClick}>Court</button>
      {onNextSeason && <button className="season-button" onClick={onNextSeason}><span className="header-action-label">Next season <span aria-hidden="true">→</span></span><span className="header-action-compact">Next</span></button>}
    </nav>
  </div></header>;
}

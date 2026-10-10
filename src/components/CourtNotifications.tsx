/** One court inbox for gifts, active assassination warnings, and committed outcomes. */
import CourtDialog from './CourtDialog';
import CourtPlotWarning, {type CourtPlotWarningContext} from './CourtPlotWarning';
import type {GiftNotification, PlotNotification} from '../lib/courtNotifications';
import {PLAYER_NODE} from '../lib/courtGraph';

export default function CourtNotifications({
  notifications, plots = [], plotContext, onReviewCourt, onClose,
}: {
  notifications: readonly GiftNotification[];
  plots?: readonly PlotNotification[];
  plotContext?: CourtPlotWarningContext;
  onReviewCourt?: () => void;
  onClose: () => void;
}) {
  const active = plots.filter(note => note.activePlot);
  const history = plots.filter(note => !note.activePlot);
  return <CourtDialog title="Notifications" onClose={onClose}>
    {active.length > 0 && <section className="court-notification-section" aria-label="Active assassination warnings">
      <h3>Urgent · {active.length} active {active.length === 1 ? 'plot' : 'plots'}</h3>
      <ol className="plot-notifications">{active.map(note => <li key={note.id} className="is-urgent">
        <span className="ui-eyebrow">Action needed · attempt in season {note.activePlot!.dueSeason}</span>
        <CourtPlotWarning plot={note.activePlot!} {...(plotContext ?? {influence: 0, influences: {}})}/>
      </li>)}</ol>
      {onReviewCourt && <button className="ui-btn ui-btn-primary" onClick={onReviewCourt}>Review your court</button>}
    </section>}
    {history.length > 0 && <section className="court-notification-section" aria-label="Court reports">
      <h3>Court reports</h3>
      <ol className="plot-notifications">{history.map(({id, event}) => {
        const target = event.target && event.target !== PLAYER_NODE ? event.target : 'you';
        const title = event.kind === 'casualty' ? event.victim === event.target ?
          `${event.victim} was killed by ${event.attacker}` : `${event.victim} died shielding ${target} from ${event.attacker}` :
          event.kind === 'defused' ? `${event.attacker}’s plot against ${target} was defused` :
          event.kind === 'player_death' ? `${event.attacker}’s assassination attempt succeeded` :
          `${event.attacker} plotted against ${target}`;
        return <li key={id}>
          <small>Season {event.season}{event.kind === 'warning' ? ' · earlier warning' : ''}</small>
          <strong>{title}</strong>
          <p>{event.reason}</p>
          {event.deathMethod && <p>{event.deathMethod}</p>}
        </li>;
      })}</ol>
    </section>}
    <section className="court-notification-section" aria-label="Gift receipts">
      <h3>Gifts</h3>
      <p className="court-guide">Gifts are already in your inventory.</p>
      {notifications.length ? <ol className="gift-notifications">{[...notifications].reverse().map(note =>
        <li key={note.id}><strong>{note.name}</strong><span>+{note.amount} {note.amount === 1 ? 'gift' : 'gifts'}</span>
          <small>Season {note.season}</small></li>)}</ol> : <p>No gifts received yet.</p>}
    </section>
    {!active.length && !history.length && <p>No assassination warnings or court reports.</p>}
  </CourtDialog>;
}

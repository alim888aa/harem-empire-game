/** Builds the court inbox from committed campaign events, with stable read receipts. */
import {PLAYER_NODE} from './courtGraph';
import {courtPlotKey, type CourtPlot, type CourtPlots, type PlotEvent} from './courtPlots';

export type GiftNotification = {id: string; name: string; amount: number; season: number; read: boolean};
export type PlotNotification = {
  id: string;
  event: PlotEvent;
  activePlot?: CourtPlot;
  read: boolean;
};
export const MAX_GIFT_NOTIFICATIONS = 50;
export const MAX_COURT_READ_RECEIPTS = 2500;

export function recordGiftNotification(
  previous: readonly GiftNotification[], name: string, amount: number, season: number,
): GiftNotification[] {
  const id = `${season}:${name}`;
  if (previous.some(notification => notification.id === id)) return [...previous];
  return [...previous, {id, name, amount, season, read: false}].slice(-MAX_GIFT_NOTIFICATIONS);
}

function warningId(plot: CourtPlot): string {
  return JSON.stringify(['plot', 'warning', plot.attacker, plot.target ?? PLAYER_NODE, plot.dueSeason]);
}
function eventId(event: PlotEvent): string {
  if (event.kind === 'warning') return warningId({...event, warnedSeason: event.season, dueSeason: event.season + 1});
  return JSON.stringify(['plot', event.kind, event.attacker, event.target ?? PLAYER_NODE, event.season, event.victim ?? '']);
}

/** Pending warnings survive event-buffer rollover. A continuing attempt gets a new receipt each season. */
export function courtPlotNotifications(
  plots?: CourtPlots, readIds: readonly string[] = [],
): PlotNotification[] {
  if (!plots) return [];
  const read = new Set(readIds);
  const notes = new Map<string, PlotNotification>();
  for (const event of plots.events) {
    const id = eventId(event);
    notes.set(id, {id, event, read: read.has(id)});
  }
  for (const plot of Object.values(plots.pending)) {
    const id = warningId(plot);
    const original = plots.events.find(event => event.kind === 'warning' &&
      courtPlotKey(event.attacker, event.target) === courtPlotKey(plot.attacker, plot.target));
    const event: PlotEvent = {
      kind: 'warning', season: plot.dueSeason - 1, attacker: plot.attacker, target: plot.target,
      reason: original?.reason ?? 'An assassination attempt is due at the next season boundary.',
    };
    notes.set(id, {id, event, activePlot: plot, read: read.has(id)});
  }
  return [...notes.values()].sort((a, b) => Number(!!b.activePlot) - Number(!!a.activePlot) ||
    b.event.season - a.event.season || a.event.attacker.localeCompare(b.event.attacker));
}

/** Saving these IDs acknowledges the inbox without touching plots, gifts, RNG, or season progression. */
export function readCourtNotificationIds(plots?: CourtPlots): string[] {
  return courtPlotNotifications(plots).map(notification => notification.id).slice(-MAX_COURT_READ_RECEIPTS);
}

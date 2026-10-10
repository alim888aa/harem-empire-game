import test, {beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createActor} from 'xstate';
import {courtPlotNotifications, readCourtNotificationIds} from '../src/lib/courtNotifications';
import {emptyCourtPlots, type CourtPlots} from '../src/lib/courtPlots';
import CourtNotifications from '../src/components/CourtNotifications';
import {gameMachine} from '../src/state-machines/game-machine';
import {captureCampaign, createCampaignPresentation, campaignActorOptions, parseCampaignSave} from '../src/persistence/campaignSave';

beforeEach(t => {t.mock.method(console, 'log', () => {});});
function warning(season = 1): CourtPlots {
  const plots = emptyCourtPlots(season);
  plots.pending['Prince Feng'] = {attacker: 'Prince Feng', warnedSeason: season, dueSeason: season + 1};
  plots.events.push({kind: 'warning', season, attacker: 'Prince Feng', reason: 'An enemy prepares an attempt.'});
  return plots;
}
test('new warning is one urgent unread note, stable on rerender and read acknowledgement', () => {
  const plots = warning();
  const before = structuredClone(plots);
  const notes = courtPlotNotifications(plots);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].read, false);
  assert.equal(notes[0].activePlot?.dueSeason, 2);
  assert.deepEqual(courtPlotNotifications(plots), notes);
  const read = courtPlotNotifications(plots, readCourtNotificationIds(plots));
  assert.equal(read[0].read, true);
  assert.equal(read[0].activePlot?.dueSeason, 2, 'read does not dismiss an active threat');
  assert.deepEqual(plots, before);
});
test('new casualty and next-season attempt become unread without duplicating older warnings', () => {
  const plots = warning();
  const reads = readCourtNotificationIds(plots);
  plots.lastProcessedSeason = 2;
  plots.pending['Prince Feng'].dueSeason = 3;
  plots.events.push({kind: 'casualty', season: 2, attacker: 'Prince Feng', victim: 'Maid Ling', reason: 'Shielded you.'});
  const notes = courtPlotNotifications(plots, reads);
  assert.equal(notes.length, 3);
  assert.equal(notes.filter(note => !note.read).length, 2);
  assert.equal(notes[0].activePlot?.dueSeason, 3);
  assert.equal(notes.find(note => note.event.kind === 'casualty')?.event.victim, 'Maid Ling');
  assert.deepEqual(courtPlotNotifications(structuredClone(plots), reads), notes);
});
test('defused and romantic-rival outcomes retain target, reason, victim, and method', () => {
  const plots = warning();
  delete plots.pending['Prince Feng'];
  plots.events.push({kind: 'defused', season: 1, attacker: 'Prince Feng', reason: 'Lost the advantage.'});
  plots.pending['Minister Chen->Prince Wei'] = {attacker: 'Minister Chen', target: 'Prince Wei', warnedSeason: 1, dueSeason: 2};
  plots.events.push({kind: 'casualty', season: 1, attacker: 'Minister Chen', target: 'Prince Wei', victim: 'Maid Ling',
    reason: 'Shielded the rival.', deathMethod: 'Poisoned tea at a very polite meeting.'});
  const notes = courtPlotNotifications(plots);
  const html = renderToStaticMarkup(createElement(CourtNotifications, {
    notifications: [], plots: notes, plotContext: {influence: .6, influences: {'Minister Chen': .8}}, onClose: () => {},
  }));
  for (const expected of ['Minister Chen is plotting against Prince Wei', 'start of season 2',
    'Ending the shared romance removes the motive', 'Maid Ling died shielding Prince Wei', 'Lost the advantage',
    'Poisoned tea at a very polite meeting', 'Prince Feng’s plot against you was defused']) {
    assert.ok(html.includes(expected), expected);
  }
  assert.equal(notes.filter(note => note.activePlot).length, 1);
});
test('pending plot survives a full history rollover and remains a single actionable warning', () => {
  const plots = warning();
  plots.events = [];
  const notes = courtPlotNotifications(plots);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].activePlot?.dueSeason, 2);
  const html = renderToStaticMarkup(createElement(CourtNotifications, {
    notifications: [], plots: notes, plotContext: {influence: .6, influences: {'Prince Feng': .8}}, onClose: () => {},
  }));
  for (const expected of ['80.1%', '60.0%', 'A tie is not safe', 'With no allies left, you die', 'Review before ending']) {
    assert.ok(html.includes(expected), expected);
  }
});
test('read and unread court receipts survive campaign save/reload without changing plot state', t => {
  const game = createActor(gameMachine).start(); t.after(() => game.stop());
  game.send({type: 'CHOOSE_CHARACTER', payload: {type: 'prince'}});
  game.send({type: 'INITIALIZE_GAME'});
  const save = captureCampaign(game, createCampaignPresentation('prince'))!;
  assert.ok(save);
  save.snapshot.context.courtPlots = warning();
  const parsed = parseCampaignSave(JSON.stringify(save)).save;
  const restored = createActor(gameMachine, campaignActorOptions(parsed)).start(); t.after(() => restored.stop());
  const before = restored.getSnapshot().context;
  assert.equal(courtPlotNotifications(before.courtPlots, before.readCourtNotificationIds)[0].read, false);
  restored.send({type: 'READ_COURT_NOTIFICATIONS'});
  const after = restored.getSnapshot().context;
  assert.deepEqual(after.courtPlots, before.courtPlots);
  assert.equal(after.rngState, before.rngState);
  assert.equal(after.season, before.season);
  const readSave = captureCampaign(restored, createCampaignPresentation('prince'))!;
  const reloaded = createActor(gameMachine, campaignActorOptions(parseCampaignSave(JSON.stringify(readSave)).save)).start();
  t.after(() => reloaded.stop());
  const again = reloaded.getSnapshot().context;
  assert.equal(courtPlotNotifications(again.courtPlots, again.readCourtNotificationIds)[0].read, true);
  reloaded.send({type: 'READ_COURT_NOTIFICATIONS'});
  assert.deepEqual(reloaded.getSnapshot().context.readCourtNotificationIds, again.readCourtNotificationIds);
});
test('old saves without court read receipts remain readable and malformed ledgers are rejected', t => {
  const game = createActor(gameMachine).start(); t.after(() => game.stop());
  game.send({type: 'CHOOSE_CHARACTER', payload: {type: 'prince'}});
  game.send({type: 'INITIALIZE_GAME'});
  const save = captureCampaign(game, createCampaignPresentation('prince'))!;
  delete save.snapshot.context.readCourtNotificationIds;
  assert.ok(parseCampaignSave(JSON.stringify(save)).save);
  save.snapshot.context.readCourtNotificationIds = ['duplicate', 'duplicate'];
  assert.throws(() => parseCampaignSave(JSON.stringify(save)), /Invalid court notification read receipts/);
});

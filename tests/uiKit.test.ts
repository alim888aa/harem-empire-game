import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Emblem, PopNumber, SealStamp, SoundToggle, isEmblemName, playCue, isSoundOn } from '../src/ui';
import PromotionNotification from '../src/components/PromotionNotification';
import FactionPanel from '../src/components/FactionPanel';
import type { FactionSystem } from '../src/lib/factionSystem';

test('emblems are decorative SVG by default and labelled images when titled', () => {
  const decorative = renderToStaticMarkup(createElement(Emblem, { name: 'rebel' }));
  assert.match(decorative, /^<svg/);
  assert.match(decorative, /aria-hidden="true"/);
  const labelled = renderToStaticMarkup(createElement(Emblem, { name: 'ingot', title: 'Gifts' }));
  assert.match(labelled, /role="img"/);
  assert.match(labelled, /aria-label="Gifts"/);
  assert.ok(isEmblemName('loyalist'));
  assert.ok(!isEmblemName('dragon'));
});

test('PopNumber renders the formatted value without a delta on first render', () => {
  const html = renderToStaticMarkup(createElement(PopNumber, { value: 1250, format: (n: number) => n.toLocaleString('en-US') }));
  assert.match(html, /1,250/);
  assert.doesNotMatch(html, /ui-pop-delta/);
});

test('promotion is announced as an imperial decree with the readable rank name', () => {
  const html = renderToStaticMarkup(createElement(PromotionNotification, { rank: 'grand_prince', playerInfluence: 0.2, onDismiss: () => {} }));
  assert.match(html, /By imperial decree/);
  assert.match(html, /Grand Prince/);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /grand_prince/);
});

test('seal stamp shows its body content', () => {
  const html = renderToStaticMarkup(createElement(SealStamp, { eyebrow: 'Decree', title: 'Hear ye', onDismiss: () => {} }, 'The court bows.'));
  assert.match(html, /Hear ye/);
  assert.match(html, /The court bows\./);
});

test('sound is safe without a browser and the toggle describes its action', () => {
  assert.doesNotThrow(() => playCue('gong'));
  assert.equal(typeof isSoundOn(), 'boolean');
  const html = renderToStaticMarkup(createElement(SoundToggle));
  assert.match(html, /aria-label="Mute sound"/);
  assert.match(html, /data-cue="none"/);
});

test('faction panel uses emblems instead of emoji and tags each banner with its faction', () => {
  const html = renderToStaticMarkup(createElement(FactionPanel, { factionSystem: { playerFaction: null, membershipOffers: [] } as unknown as FactionSystem, allCharacters: {} }));
  for (const faction of ['Rebel', 'Imperial', 'Loyalist', 'Independent']) assert.match(html, new RegExp(`data-faction="${faction}"`));
  assert.doesNotMatch(html, /[\u{1F300}-\u{1FAFF}☀-➿]/u);
});

// Exercises the conversation's public composition, without inspecting source or CSS.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createActor } from 'xstate';
import { CourtAudience } from '../src/components/GameLayout';
import CourtDialog from '../src/components/CourtDialog';
import { characterMachine } from '../src/state-machines/character-machine';
import { createCourtGraph } from '../src/lib/courtGraph';
import type { InitialCharacterType } from '../src/types/character';

const character: InitialCharacterType = {
  name: 'Maid Ling', type: 'minor', imgPath: '/portraits/maid-ling.png', suspicionThreshold: 0.9,
  vectors: { trust: 0.5, fear: 0.1, ambition: 0.2, loyalty: 0.5, influence: 0.1, romantic: 0.5, suspicion: 0 },
};

function audience(palaceConversation: boolean, speechAnchored = false) {
  const actor = createActor(characterMachine, { input: character });
  const before = actor.getSnapshot().context;
  let actions = 0;
  const element = createElement(CourtAudience, {
    actor, character, palaceConversation, speechAnchored,
    playerStats: { influence: 0.5, ambition: 0.5, loyalty: 0.5, fear: 0, charisma: 0.5 },
    playerType: 'concubine', rank: null, gifts: 20, season: 1,
    onPrevious: () => {}, onNext: () => {}, onPeople: () => {},
    response: 'Maid Ling: Your kindness will not be forgotten.',
    onAction: () => { actions += 1; }, onRomance: () => { actions += 1; },
    giftPending: false, giftError: '', graph: createCourtGraph([character], 1),
    witnesses: [], zone: 'ladies',
  });
  return { element, actor, before, actionCount: () => actions };
}

test('palace conversation presents speech and actions before a collapsed courtier dossier', () => {
  const { element, actor, before, actionCount } = audience(true);
  const html = renderToStaticMarkup(element);
  assert.doesNotMatch(html, /class="portrait-stage"/);
  assert.match(html, /<details class="conversation-dossier"><summary>About Maid Ling · 0 support<\/summary>/);
  assert.ok(html.indexOf('Your kindness will not be forgotten.') < html.indexOf('Choose your message'));
  assert.ok(html.indexOf('Choose your message') < html.indexOf('Send gift'));
  assert.ok(html.indexOf('Send gift') < html.indexOf('Ask to be lovers'));
  assert.ok(html.indexOf('Ask to be lovers') < html.indexOf('class="conversation-dossier"'));
  for (const action of ['Romantic message', 'Effects &amp; other actions', 'Spit in Face', 'Romance ·']) {
    assert.ok(html.includes(action), action);
  }
  assert.match(html, /aria-label="Maid Ling dossier"/);
  assert.match(html, /aria-label="Maid Ling support"/);
  assert.match(html, /aria-label="Maid Ling affection"/);
  assert.equal(actor.getSnapshot().context, before);
  assert.equal(actionCount(), 0);
});

test('classic court retains its portrait and visible dossier before message actions', () => {
  const { element } = audience(false);
  const html = renderToStaticMarkup(element);
  assert.match(html, /class="portrait-stage"/);
  assert.doesNotMatch(html, /class="conversation-dossier"/);
  assert.ok(html.indexOf('aria-label="Maid Ling dossier"') < html.indexOf('Choose your message'));
  assert.match(html, /Send gift/);
  assert.match(html, /Ask to be lovers/);
});

test('projected and fallback conversations retain every control inside the shared dialog body', () => {
  for (const anchored of [false, true]) {
    const { element } = audience(true, anchored);
    const html = renderToStaticMarkup(createElement(CourtDialog, {
      title: 'A moment at court', onClose: () => {},
      children: createElement('div', { className: 'palace-conversation' },
        element,
        createElement('button', { className: 'palace-leave', type: 'button' }, 'Return to the palace'),
      ),
    }));
    const bodyStart = html.indexOf('class="dialog-body"');
    assert.ok(html.indexOf('aria-label="Close A moment at court"') < bodyStart);
    const body = html.slice(bodyStart);
    for (const text of ['Your kindness will not be forgotten.', 'Send gift', 'Ask to be lovers', 'Return to the palace']) {
      assert.ok(body.includes(text), `${text}: anchored=${anchored}`);
    }
    assert.equal(body.includes('speech-accessible-copy'), anchored);
    assert.match(body, /aria-live="polite"/);
    assert.match(body, /tabindex="0"/);
  }
});

// Exercises the shared dialog's rendered accessibility and content boundary.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CourtDialog from '../src/components/CourtDialog';

function renderDialog(title: string) {
  return renderToStaticMarkup(createElement(CourtDialog, {
    title,
    onClose: () => {},
    children: createElement(Fragment, null,
      createElement('p', null, 'The court is waiting.'),
      createElement('button', { type: 'button' }, 'Continue'),
    ),
  }));
}

test('native dialog is named by its visible title and has a labelled close control', () => {
  const html = renderDialog('Your court');
  const labelledBy = html.match(/<dialog[^>]*aria-labelledby="([^"]+)"/);
  assert.ok(labelledBy);
  assert.ok(html.includes(`<h2 id="${labelledBy[1]}">Your court</h2>`));
  assert.match(html, /<button type="button" autofocus="" aria-label="Close Your court">×<\/button>/);
});

test('heading and close remain outside the keyboard-accessible content region', () => {
  const html = renderDialog('Your court');
  const headingEnd = html.indexOf('</h2>');
  const closeEnd = html.indexOf('</button>');
  const bodyStart = html.indexOf('<div class="dialog-body"');
  assert.ok(headingEnd >= 0 && headingEnd < bodyStart);
  assert.ok(closeEnd >= 0 && closeEnd < bodyStart);
  assert.match(html, /role="region" aria-label="Your court content" tabindex="0"/);
  const body = html.slice(bodyStart);
  assert.match(body, /The court is waiting\./);
  assert.match(body, /<button type="button">Continue<\/button>/);
  assert.doesNotMatch(body, /Close Your court/);
});

test('all shared dialog purposes preserve their content and accessible body name', () => {
  for (const title of ['Notifications', 'Save and game', 'Help', 'A moment at court', 'An imperial summons']) {
    const html = renderDialog(title);
    assert.ok(html.includes(`aria-label="${title} content"`));
    assert.ok(html.includes(`>${title}</h2>`));
    assert.match(html, /The court is waiting\./);
  }
});

test('multiple dialogs have distinct title references', () => {
  const html = renderToStaticMarkup(createElement(Fragment, null,
    createElement(CourtDialog, { title: 'Your court', onClose: () => {}, children: 'First' }),
    createElement(CourtDialog, { title: 'Your stats', onClose: () => {}, children: 'Second' }),
  ));
  const references = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map(match => match[1]);
  assert.equal(references.length, 2);
  assert.equal(new Set(references).size, 2);
});

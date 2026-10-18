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


// DOM events exercise React's handlers; native dialog rendering/focus and WebGL need browser proof.
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { createActor } from 'xstate';
import { gameMachine } from '../src/state-machines/game-machine';
import EmperorIntro from '../src/components/EmperorIntro';

async function withDialogDom(run: (host: HTMLElement, dom: JSDOM) => Promise<void>) {
  const dom = new JSDOM('<!doctype html><button id="trigger">Explore</button><main></main>', { url: 'https://example.test' });
  const globals = ['window', 'document', 'HTMLElement', 'IS_REACT_ACT_ENVIRONMENT'] as const;
  const previous = globals.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: dom.window },
    document: { configurable: true, value: dom.window.document },
    HTMLElement: { configurable: true, value: dom.window.HTMLElement },
    IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true },
  });
  // jsdom does not implement the native top layer. Only supply the lifecycle API React calls.
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  const host = dom.window.document.querySelector('main');
  assert.ok(host);
  try { await run(host, dom); } finally {
    globals.forEach((key, index) => {
      const descriptor = previous[index];
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    });
    dom.window.close();
  }
}

function dialogElement(host: HTMLElement) {
  const dialog = host.querySelector('dialog');
  assert.ok(dialog);
  return dialog;
}

for (const role of ['concubine', 'minister', 'prince'] as const) {
  for (const phase of ['loading', 'approaching', 'arrived', 'error'] as const) {
    test(`imperial ${role} ${phase}: backdrop/content clicks preserve the visit; labelled close completes once`, async t => {
      t.mock.method(console, 'log', () => {});
      const actor = createActor(gameMachine.provide({ guards: { emperor_encountered: () => false } })).start();
      t.after(() => actor.stop());
      actor.send({ type: 'CHOOSE_CHARACTER', payload: { type: role } });
      actor.send({ type: 'INITIALIZE_GAME' });
      for (let second = 0; second < 75; second++) actor.send({ type: 'FIRST_EMPEROR_VISIT_TICK', seconds: 1 });
      assert.ok(actor.getSnapshot().matches({ playing: 'emperor_intro' }));
      const before = JSON.parse(JSON.stringify(actor.getPersistedSnapshot()));
      let completions = 0;
      let retries = 0;
      await withDialogDom(async (host, dom) => {
        const root = createRoot(host);
        try {
          await act(async () => root.render(createElement(EmperorIntro, {
            arrived: phase === 'arrived', loading: phase === 'loading', error: phase === 'error',
            onRetry: () => { retries++; },
            onContinue: () => { completions++; actor.send({ type: 'EMPEROR_INTRO_FINISHED' }); },
          })));
          const dialog = dialogElement(host);
          await act(async () => {
            dialog.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
            dialog.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
            host.querySelector('.emperor-intro h1')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
          });
          assert.equal(completions, 0);
          assert.equal(dialog.open, true);
          assert.deepEqual(JSON.parse(JSON.stringify(actor.getPersistedSnapshot())), before, 'backdrop must not finish or mutate the campaign');
          if (phase === 'error') {
            const retry = [...host.querySelectorAll('button')].find(button => button.textContent === 'Retry Emperor');
            assert.ok(retry);
            await act(async () => retry.click());
            assert.equal(retries, 1);
            assert.equal(completions, 0);
            assert.deepEqual(JSON.parse(JSON.stringify(actor.getPersistedSnapshot())), before);
          }
          const close = host.querySelector<HTMLButtonElement>('[aria-label="Close A first imperial visit"]');
          assert.ok(close);
          await act(async () => close.click());
          assert.equal(completions, 1);
          assert.ok(actor.getSnapshot().matches({ playing: 'in_season' }));
          assert.deepEqual(JSON.parse(JSON.stringify(actor.getPersistedSnapshot())).context, before.context, 'completion leaves schedules, tribute, saves and RNG unchanged');
          const finished = actor.getPersistedSnapshot();
          actor.send({ type: 'EMPEROR_INTRO_FINISHED' });
          assert.deepEqual(actor.getPersistedSnapshot(), finished, 'stale completion is harmless');
        } finally { await act(async () => root.unmount()); }
      });
    });
  }
}

for (const exit of ['acknowledge', 'escape'] as const) {
  for (const phase of ['loading', 'approaching', 'arrived', 'error'] as const) {
    if (exit === 'acknowledge' && phase !== 'arrived' && phase !== 'error') continue;
    test(`imperial ${phase}: deliberate ${exit} remains available`, async () => {
      await withDialogDom(async (host, dom) => {
        const root = createRoot(host);
        let completions = 0;
        try {
          await act(async () => root.render(createElement(EmperorIntro, {
            arrived: phase === 'arrived', loading: phase === 'loading', error: phase === 'error',
            onContinue: () => { completions++; },
          })));
          if (exit === 'escape') {
            // Browser Escape emits a cancel event. We test that event, not a fabricated keydown implementation.
            const cancel = new dom.window.Event('cancel', { bubbles: false, cancelable: true });
            await act(async () => { dialogElement(host).dispatchEvent(cancel); });
            assert.equal(cancel.defaultPrevented, true);
          } else {
            const button = [...host.querySelectorAll('button')].find(item => item.textContent === 'Return to the court');
            assert.ok(button);
            await act(async () => button.click());
          }
          assert.equal(completions, 1);
        } finally { await act(async () => root.unmount()); }
      });
    });
  }
}

test('ordinary shared dialogs retain backdrop dismissal and ignore content clicks', async () => {
  await withDialogDom(async (host, dom) => {
    const root = createRoot(host);
    let closes = 0;
    try {
      await act(async () => root.render(createElement(CourtDialog, {
        title: 'Your court', onClose: () => { closes++; }, children: createElement('p', null, 'Court content'),
      })));
      await act(async () => host.querySelector('p')?.click());
      assert.equal(closes, 0);
      await act(async () => { dialogElement(host).dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
      assert.equal(closes, 1);
    } finally { await act(async () => root.unmount()); }
  });
});

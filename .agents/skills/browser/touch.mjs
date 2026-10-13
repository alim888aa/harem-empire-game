#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

export const MEDIA_CHECK = "matchMedia('(prefers-reduced-motion: reduce)').matches";
export const HELP = `Usage: node touch.mjs <command> (Node 22+, run in the PR worktree)
  start --url <fixture URL> [--viewport WIDTHxHEIGHT] [--reduced-motion]
  tap <x> <y>
  swipe <x1> <y1> <x2> <y2> [--ms N] [--steps N]
  screenshot <path>
  reduced-motion on|off|status
  stop
All commands after start use .scratch/browser/cdp/state.json only.`;
export const MAX_LIFETIME_MS = 2 * 60 * 60 * 1000;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCRIPT = fileURLToPath(import.meta.url);
const ALLOWED = new Set(['Input.dispatchTouchEvent', 'Emulation.setEmulatedMedia',
  'Emulation.setDeviceMetricsOverride', 'Emulation.setTouchEmulationEnabled', 'Page.captureScreenshot']);

export function assertAllowed(method, params) {
  if (ALLOWED.has(method)) return;
  if (method === 'Runtime.evaluate' && params?.expression === MEDIA_CHECK && params.returnByValue === true
      && Object.keys(params).length === 2) return;
  throw new Error(`Forbidden CDP method or evaluation: ${method}`);
}

function number(value, name, min, max, integer = false) {
  const n = Number(value);
  if (value === '' || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
  return n;
}

export function parseArgs(args) {
  const options = {}, positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--')) { positional.push(arg); continue; }
    if (!['--url', '--viewport', '--ms', '--steps', '--reduced-motion'].includes(arg) || arg in options) {
      throw new Error(`Unknown or repeated option: ${arg}`);
    }
    if (arg === '--reduced-motion') { options[arg] = true; continue; }
    if (args[i + 1] === undefined || args[i + 1].startsWith('--')) throw new Error(`Missing option: ${arg}`);
    options[arg] = args[++i];
  }
  const [command, ...values] = positional;
  const counts = { start: 0, stop: 0, tap: 2, swipe: 4, 'reduced-motion': 1, screenshot: 1 };
  if (counts[command] === undefined || values.length !== counts[command]) throw new Error(HELP);
  for (const flag of Object.keys(options)) {
    if (!((command === 'start' && ['--url', '--viewport', '--reduced-motion'].includes(flag))
      || (command === 'swipe' && ['--ms', '--steps'].includes(flag)))) throw new Error(`${flag} is not for ${command}`);
  }
  let url, viewport;
  if (command === 'start') {
    try { url = new URL(options['--url']); } catch { throw new Error('start requires --url <fixture URL>'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Fixture URL must be HTTP(S) without credentials');
    if (options['--viewport'] !== undefined) {
      const match = /^(\d+)x(\d+)$/.exec(options['--viewport']);
      if (!match) throw new Error('Viewport must be WIDTHxHEIGHT');
      viewport = { width: number(match[1], 'width', 1, 10000, true), height: number(match[2], 'height', 1, 10000, true) };
    }
  }
  if (command === 'tap' || command === 'swipe') values.forEach((v, i) => number(v, `coordinate ${i + 1}`, 0, 100000));
  if (command === 'reduced-motion' && !['on', 'off', 'status'].includes(values[0])) throw new Error('reduced-motion expects on, off or status');
  if (command === 'screenshot' && !values[0].trim()) throw new Error('Screenshot path is required');
  return { command, values, url: url?.href, viewport, reducedMotion: options['--reduced-motion'] === true,
    ms: number(options['--ms'] ?? '300', 'duration', 1, 60000, true),
    steps: number(options['--steps'] ?? '12', 'steps', 1, 1000, true) };
}

export async function findTarget(options, fetchImpl = fetch) {
  let targets;
  try {
    const response = await fetchImpl(`http://127.0.0.1:${options.port}/json/list`, {
      signal: AbortSignal.timeout(5000), redirect: 'error',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    targets = await response.json();
    if (!Array.isArray(targets)) throw new Error('Invalid target list');
  } catch (error) {
    throw new Error(`No debuggable Chrome at 127.0.0.1:${options.port}: ${error.message}`);
  }
  const matches = targets.filter(t => t.type === 'page' && (options.targetId ? t.id === options.targetId : options.isolated || t.url === options.url));
  if (!matches.length) throw new Error(`No Chrome tab matches: ${options.url}`);
  if (matches.length !== 1) throw new Error(`Multiple Chrome tabs match ${options.url}`);
  let ws;
  try { ws = new URL(matches[0].webSocketDebuggerUrl); } catch { throw new Error('Matching tab has no debugger WebSocket'); }
  if (ws.protocol !== 'ws:' || ws.hostname !== '127.0.0.1' || ws.port !== String(options.port) || ws.username || ws.password) {
    throw new Error('Debugger WebSocket must be on the same 127.0.0.1 port');
  }
  return { targetId: matches[0].id, websocket: ws.href };
}

export async function connect(url, WebSocketImpl = WebSocket, timeoutMs = 5000) {
  const ws = new WebSocketImpl(url);
  let nextId = 0;
  const pending = new Map();
  const fail = error => {
    for (const { reject, timer } of pending.values()) { clearTimeout(timer); reject(error); }
    pending.clear();
  };
  ws.addEventListener('message', event => {
    let message;
    try { message = JSON.parse(event.data); } catch { fail(new Error('Invalid CDP response')); return; }
    const request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(message.id);
    if (message.error) request.reject(new Error(`CDP: ${message.error.message}`));
    else request.resolve(message.result);
  });
  ws.addEventListener('close', () => fail(new Error('Chrome debugger disconnected')));
  ws.addEventListener('error', () => fail(new Error('Chrome debugger WebSocket error')));
  try {
    await new Promise((resolveOpen, reject) => {
      const timer = setTimeout(() => done(new Error('Chrome debugger connection timed out')), timeoutMs);
      const open = () => done();
      const error = () => done(new Error('Cannot connect to Chrome debugger'));
      function done(err) {
        clearTimeout(timer);
        ws.removeEventListener('open', open);
        ws.removeEventListener('error', error);
        ws.removeEventListener('close', error);
        if (err) reject(err); else resolveOpen();
      }
      ws.addEventListener('open', open);
      ws.addEventListener('error', error);
      ws.addEventListener('close', error);
    });
  } catch (error) { ws.close(); throw error; }
  return {
    send(method, params = {}) {
      assertAllowed(method, params);
      return new Promise((resolveResult, reject) => {
        const id = ++nextId;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP ${method} timed out`)); }, timeoutMs);
        pending.set(id, { resolve: resolveResult, reject, timer });
        try { ws.send(JSON.stringify({ id, method, params })); }
        catch (error) { clearTimeout(timer); pending.delete(id); reject(error); }
      });
    },
    close() { fail(new Error('CDP connection closed')); ws.close(); },
    // The holder owns this connection until shutdown, Chrome loss or expiry.
    hold({ events = process, lifetimeMs = MAX_LIFETIME_MS, alive = async () => true, pollMs = 1000 } = {}) {
      return new Promise(resolveHold => {
        const stop = () => finish('signal');
        const lost = () => finish('disconnected');
        const expiry = setTimeout(() => finish('expired'), lifetimeMs);
        let checking = false, finished = false;
        const poll = setInterval(async () => {
          if (checking) return;
          checking = true;
          try { if (!await alive()) finish('chrome-exited'); } catch { finish('chrome-exited'); }
          finally { checking = false; }
        }, pollMs);
        function finish(reason) {
          if (finished) return;
          finished = true;
          clearTimeout(expiry); clearInterval(poll);
          events.removeListener('SIGINT', stop); events.removeListener('SIGTERM', stop);
          ws.removeEventListener('close', lost); ws.removeEventListener('error', lost);
          resolveHold(reason);
        }
        events.once('SIGINT', stop); events.once('SIGTERM', stop);
        ws.addEventListener('close', lost); ws.addEventListener('error', lost);
        if (ws.readyState === 3) lost();
      });
    },
  };
}

export async function execute(options, client, { wait = sleep, save = writeFile } = {}) {
  const send = (method, params) => client.send(method, params);
  const point = (x, y) => [{ x, y, id: 0, radiusX: 1, radiusY: 1, force: 1 }];
  if (options.command === 'tap' || options.command === 'swipe') {
    const [x1, y1, x2, y2] = options.values.map(Number);
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(x1, y1) });
    try {
      if (options.command === 'tap') await wait(50);
      else for (let i = 1; i <= options.steps; i++) {
        await wait(options.ms / options.steps);
        await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(
          x1 + (x2 - x1) * i / options.steps, y1 + (y2 - y1) * i / options.steps) });
      }
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } catch (error) {
      await send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }).catch(() => {});
      throw error;
    }
    return options.command;
  }
  if (options.command === 'screenshot') {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    await save(options.values[0], Buffer.from(data, 'base64'));
    return `Screenshot: ${options.values[0]}`;
  }
  return `prefers-reduced-motion: ${await readMedia(client) ? 'on' : 'off'}`;
}

export async function readMedia(client) {
  const result = await client.send('Runtime.evaluate', { expression: MEDIA_CHECK, returnByValue: true });
  if (result.exceptionDetails || result.result?.type !== 'boolean' || typeof result.result.value !== 'boolean') {
    throw new Error('Cannot confirm reduced-motion media query');
  }
  return result.result.value;
}

export async function emulate(state, client) {
  if (state.viewport) await client.send('Emulation.setDeviceMetricsOverride', { ...state.viewport, deviceScaleFactor: 1, mobile: true });
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await client.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: state.reducedMotion ? 'reduce' : 'no-preference' }] });
  if (await readMedia(client) !== state.reducedMotion) throw new Error('Reduced-motion read-back disagrees with requested setting');
}

const execFileAsync = promisify(execFile);
export async function processStartTime(pid, run = execFileAsync) {
  try {
    const { stdout } = await run('ps', ['-p', String(pid), '-o', 'lstart=', '-o', 'stat=']);
    const match = /^(.*?)\s+(\S+)\s*$/.exec(stdout.trim());
    return match && !match[2].startsWith('Z') ? match[1].trim() : null;
  } catch (error) {
    if (error.code === 1) return null;
    throw error;
  }
}

export function paths(cwd = process.cwd()) {
  const root = resolve(cwd, '.scratch/browser');
  return { chrome: join(root, 'chrome'), cdp: join(root, 'cdp'), state: join(root, 'cdp/state.json') };
}
const defaults = {
  read: readFile, write: writeFile, rename, remove: rm, mkdir, mkdtemp,
  identify: processStartTime, kill: (pid, signal) => process.kill(pid, signal),
  wait: sleep, now: Date.now, find: findTarget, connect, events: process,
  spawn: (command, args, options) => new Promise((resolveSpawn, reject) => {
    const child = spawn(command, args, options);
    child.once('error', reject);
    child.once('spawn', () => resolveSpawn(child));
  }),
};
const runtime = overrides => ({ ...defaults, ...overrides });

export function validateState(state, locations) {
  if (!state || state.version !== 1) throw new Error('Invalid fallback state version');
  const starting = state.phase === 'starting';
  if (state.phase !== undefined && !starting) throw new Error('Invalid fallback phase');
  for (const key of starting ? ['chromePid'] : ['chromePid', 'holderPid', 'port']) {
    if (typeof state[key] !== 'number') throw new Error(`Invalid fallback ${key}`);
    number(state[key], key, 1, key === 'port' ? 65535 : 2147483647, true);
  }
  if (!starting && state.chromePid === state.holderPid) throw new Error('Invalid fallback process identities');
  for (const key of starting ? ['chromeStartTime', 'url'] : ['chromeStartTime', 'holderStartTime', 'targetId', 'url']) {
    if (typeof state[key] !== 'string' || !state[key].trim()) throw new Error(`Invalid fallback ${key}`);
  }
  const url = new URL(state.url);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid fallback URL');
  if (typeof state.profile !== 'string' || dirname(state.profile) !== locations.chrome || !/^run-[\w-]+$/.test(state.profile.split('/').at(-1))) {
    throw new Error('Fallback profile is outside this worktree');
  }
  if (starting) return state;
  const ws = new URL(state.websocket);
  if (ws.protocol !== 'ws:' || ws.hostname !== '127.0.0.1' || ws.port !== String(state.port)
      || ws.username || ws.password || ws.pathname !== `/devtools/page/${state.targetId}` || ws.search || ws.hash) {
    throw new Error('Invalid fallback target WebSocket');
  }
  if (typeof state.reducedMotion !== 'boolean' || !Number.isFinite(state.expiresAt)) throw new Error('Invalid fallback emulation state');
  if (state.viewport !== undefined) {
    number(state.viewport.width, 'width', 1, 10000, true); number(state.viewport.height, 'height', 1, 10000, true);
  }
  return state;
}

async function readState(locations, io) {
  try { return validateState(JSON.parse(await io.read(locations.state, 'utf8')), locations); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error('No fallback state; run touch.mjs start first');
    throw error;
  }
}
export async function loadState(locations = paths(), overrides = {}) {
  const io = runtime(overrides), state = await readState(locations, io);
  if (state.phase === 'starting') throw new Error('Fallback startup incomplete; run touch.mjs stop, then start');
  for (const name of ['chrome', 'holder']) {
    if (await io.identify(state[`${name}Pid`]) !== state[`${name}StartTime`]) {
      throw new Error(`Stale fallback ${name} PID or start time; run touch.mjs stop, then start`);
    }
  }
  if (state.expiresAt <= io.now()) throw new Error('Fallback lifetime expired; run touch.mjs stop, then start');
  return state;
}
async function saveState(state, locations, io) {
  const temp = `${locations.state}.${process.pid}.tmp`;
  await io.write(temp, JSON.stringify(state, null, 2), { mode: 0o600 });
  await io.rename(temp, locations.state);
}

export function parseActivePort(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length !== 2 || !/^\d+$/.test(lines[0]) || !/^\/devtools\/browser\/[\w-]+$/.test(lines[1])) {
    throw new Error('Invalid DevToolsActivePort');
  }
  return number(lines[0], 'DevTools port', 1, 65535, true);
}
export async function discoverPort(profile, chrome, overrides = {}, attempts = 100) {
  const io = runtime(overrides);
  for (let i = 0; i < attempts; i++) {
    if (await io.identify(chrome.chromePid) !== chrome.chromeStartTime) throw new Error('Fallback Chrome exited during startup');
    try { return parseActivePort(await io.read(join(profile, 'DevToolsActivePort'), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await io.wait(100);
  }
  throw new Error('Timed out waiting for Chrome DevToolsActivePort');
}

// Check birth time again before every signal; a stale PID is never a kill target.
export async function terminate(pid, startTime, overrides = {}) {
  const io = runtime(overrides);
  if (!pid || !startTime || await io.identify(pid) !== startTime) return;
  try { await io.kill(pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  for (let i = 0; i < 50; i++) {
    if (await io.identify(pid) !== startTime) return;
    await io.wait(100);
  }
  if (await io.identify(pid) === startTime) {
    try { await io.kill(pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
  for (let i = 0; i < 50; i++) {
    if (await io.identify(pid) !== startTime) return;
    await io.wait(100);
  }
  throw new Error(`Fallback process ${pid} did not exit`);
}
export async function stopBrowser(locations = paths(), overrides = {}) {
  const io = runtime(overrides);
  let state;
  try { state = validateState(JSON.parse(await io.read(locations.state, 'utf8')), locations); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  if (state.phase !== 'starting') await terminate(state.holderPid, state.holderStartTime, io);
  await terminate(state.chromePid, state.chromeStartTime, io);
  await io.remove(locations.state, { force: true });
}

function nextMessage(child, expected, timeoutMs = 10000, signal) {
  return new Promise((resolveMessage, reject) => {
    const timer = setTimeout(() => finish(new Error(`Holder ${expected} timed out`)), timeoutMs);
    const message = value => {
      if (value?.type === 'error') finish(new Error(`Holder: ${value.error}`));
      else if (value?.type === expected) finish(null, value);
    };
    const exit = () => finish(new Error(`Holder exited before ${expected}`));
    const error = err => finish(err);
    const aborted = () => finish(signal.reason);
    function finish(err, value) {
      clearTimeout(timer);
      signal?.removeEventListener('abort', aborted);
      child.removeListener('message', message); child.removeListener('exit', exit);
      child.removeListener('disconnect', exit); child.removeListener('error', error);
      if (err) reject(err); else resolveMessage(value);
    }
    child.on('message', message); child.once('exit', exit); child.once('disconnect', exit); child.once('error', error);
    signal?.addEventListener('abort', aborted, { once: true });
    if (signal?.aborted) aborted();
  });
}

export async function launchHolder(state, locations, overrides = {}) {
  const io = runtime(overrides);
  const child = await io.spawn(process.execPath, [SCRIPT, '--holder'], {
    detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });
  state.holderPid = child.pid;
  try {
    state.holderStartTime = await io.identify(child.pid);
    if (!state.holderStartTime) throw new Error('Holder exited during startup');
    io.signal?.throwIfAborted();
    const ready = nextMessage(child, 'ready', 10000, io.signal);
    ready.catch(() => {});
    delete state.phase;
    child.send({ type: 'init', state, locations });
    await ready;
    // Persist before committing: a dying startup parent cannot orphan an unrecorded holder.
    io.signal?.throwIfAborted();
    await saveState(state, locations, io);
    io.signal?.throwIfAborted();
    const committed = nextMessage(child, 'committed', 10000, io.signal);
    committed.catch(() => {});
    child.send({ type: 'commit' });
    await committed;
    child.disconnect(); child.unref();
    return state;
  } catch (error) {
    await terminate(state.holderPid, state.holderStartTime, io);
    if (child.connected) child.disconnect();
    child.unref();
    throw error;
  }
}

export async function startBrowser(options, locations = paths(), overrides = {}) {
  const io = runtime(overrides);
  const controller = new AbortController();
  const signals = ['SIGTERM', 'SIGINT', 'SIGHUP'];
  const handlers = signals.map(signal => () => controller.abort(new Error(`Fallback startup interrupted by ${signal}`)));
  signals.forEach((signal, i) => io.events.on(signal, handlers[i]));
  const check = () => controller.signal.throwIfAborted();
  // Discovery has no side effects and can be abandoned promptly on a signal.
  const interruptible = operation => new Promise((resolveResult, reject) => {
    const abort = () => reject(controller.signal.reason);
    controller.signal.addEventListener('abort', abort, { once: true });
    Promise.resolve(operation).then(resolveResult, reject).finally(() => controller.signal.removeEventListener('abort', abort));
    if (controller.signal.aborted) abort();
  });
  let state;
  try {
    let existing;
    try { existing = await readState(locations, io); }
    catch (error) { if (!/No fallback state/.test(error.message)) throw error; }
    check();
    if (existing) {
      if (existing.phase !== 'starting') throw new Error('Fallback state already exists; run touch.mjs stop first');
      await stopBrowser(locations, io);
      check();
    }
    await io.mkdir(locations.chrome, { recursive: true }); await io.mkdir(locations.cdp, { recursive: true });
    const profile = await io.mkdtemp(join(locations.chrome, 'run-'));
    check();
    state = { version: 1, phase: 'starting', profile, url: options.url, viewport: options.viewport,
      reducedMotion: options.reducedMotion, expiresAt: io.now() + MAX_LIFETIME_MS };
    const chrome = await io.spawn(CHROME, [`--user-data-dir=${profile}`, '--remote-debugging-address=127.0.0.1',
      '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check', options.url], { detached: true, stdio: 'ignore' });
    state.chromePid = chrome.pid;
    state.chromeStartTime = await io.identify(chrome.pid);
    if (!state.chromeStartTime) throw new Error('Fallback Chrome exited during startup');
    // Record ownership before unref/discovery, so even a dead parent leaves stop a verified kill target.
    await saveState(state, locations, io);
    chrome.unref();
    check();
    const startupIO = { ...io, signal: controller.signal, wait: ms => interruptible(io.wait(ms)) };
    state.port = await discoverPort(profile, state, startupIO);
    check();
    let target;
    const deadline = io.now() + 15000;
    for (let i = 0; i < 100; i++) {
      check();
      if (await io.identify(state.chromePid) !== state.chromeStartTime) throw new Error('Fallback Chrome exited during tab discovery');
      // This fresh profile has one page; select it even if the fixture redirects.
      try { target = await interruptible(io.find({ ...state, isolated: true })); break; }
      catch (error) { check(); if (i === 99 || io.now() >= deadline) throw error; await startupIO.wait(100); }
    }
    check();
    Object.assign(state, target);
    await launchHolder(state, locations, startupIO);
    check();
    await loadState(locations, io);
    check();
    return state;
  } catch (error) {
    if (state) {
      await terminate(state.holderPid, state.holderStartTime, io);
      await terminate(state.chromePid, state.chromeStartTime, io);
      await io.remove(locations.state, { force: true });
    }
    throw error;
  } finally {
    signals.forEach((signal, i) => io.events.removeListener(signal, handlers[i]));
  }
}
export async function changeMedia(enabled, locations = paths(), overrides = {}) {
  const io = runtime(overrides), state = await loadState(locations, io);
  await terminate(state.holderPid, state.holderStartTime, io);
  state.reducedMotion = enabled;
  try { return await launchHolder(state, locations, io); }
  catch (error) {
    await terminate(state.chromePid, state.chromeStartTime, io);
    await io.remove(locations.state, { force: true });
    throw error;
  }
}

export async function runHolder(state, locations, { ready, commit, events = process, ...overrides }) {
  const io = runtime(overrides);
  validateState(state, locations);
  let client, reason;
  try {
    if (await io.identify(state.chromePid) !== state.chromeStartTime) throw new Error('Fallback Chrome is stale');
    client = await io.connect(state.websocket);
    // Install shutdown handlers before readiness/commit, so no disconnect is lost.
    const holding = client.hold({ events, lifetimeMs: Math.max(1, state.expiresAt - io.now()),
      alive: async () => await io.identify(state.chromePid) === state.chromeStartTime });
    await emulate(state, client);
    await ready();
    const committed = await Promise.race([commit().then(() => true), holding.then(() => false)]);
    if (!committed) throw new Error('Holder stopped before commit');
    reason = await holding;
    return reason;
  } finally {
    client?.close();
    // SIGTERM is a controlled stop/replacement; the parent owns further cleanup.
    if (reason !== 'signal') {
      await terminate(state.chromePid, state.chromeStartTime, io);
      try {
        const current = await readState(locations, io);
        if (current.holderPid === state.holderPid && current.holderStartTime === state.holderStartTime) {
          await io.remove(locations.state, { force: true });
        }
      } catch (error) { if (!/No fallback state/.test(error.message)) throw error; }
    }
  }
}

async function sendIPC(message) {
  await new Promise((resolveSend, reject) => process.send(message, error => error ? reject(error) : resolveSend()));
}
async function holderMain() {
  if (!process.send) throw new Error('Holder requires the startup IPC channel');
  try {
    const init = await nextMessage(process, 'init');
    // Listen immediately: an interrupted parent before commit triggers cleanup.
    const commit = nextMessage(process, 'commit');
    commit.catch(() => {});
    await runHolder(init.state, init.locations, {
      ready: async () => sendIPC({ type: 'ready' }),
      commit: async () => { await commit; await sendIPC({ type: 'committed' }); },
    });
  } catch (error) {
    if (process.connected) await sendIPC({ type: 'error', error: error.message }).catch(() => {});
    throw error;
  } finally {
    if (process.connected) process.disconnect();
  }
}

export async function main(args = process.argv.slice(2)) {
  if (args.length === 1 && args[0] === '--help') { console.log(HELP); return; }
  if (args.length === 1 && args[0] === '--holder') { await holderMain(); return; }
  const options = parseArgs(args), locations = paths();
  if (options.command === 'start') {
    const state = await startBrowser(options, locations);
    console.log(`Fallback ready: 127.0.0.1:${state.port}; expires ${new Date(state.expiresAt).toISOString()}`);
  } else if (options.command === 'stop') {
    await stopBrowser(locations); console.log('Fallback stopped');
  } else if (options.command === 'reduced-motion' && options.values[0] !== 'status') {
    await changeMedia(options.values[0] === 'on', locations); console.log(`prefers-reduced-motion: ${options.values[0]}`);
  } else {
    const state = await loadState(locations);
    if (state.viewport && ['tap', 'swipe'].includes(options.command)
      && options.values.some((v, i) => Number(v) >= (i % 2 ? state.viewport.height : state.viewport.width))) {
      throw new Error('Coordinates must be inside the viewport');
    }
    // Rediscover the saved tab ID, never select another tab by URL after navigation.
    const target = await findTarget(state);
    if (target.websocket !== state.websocket) throw new Error('Fallback target changed; stop and start again');
    const client = await connect(state.websocket);
    try { console.log(await execute(options, client)); } finally { client.close(); }
  }
}

let entryPath;
try {
  entryPath = process.argv[1] && realpathSync(process.argv[1]);
} catch {
  // A non-file entry argument means this module is being imported.
}
if (entryPath === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch(error => {
    if (process.send && process.connected) process.send({ type: 'error', error: error.message });
    console.error(`touch: ${error.message}`); process.exitCode = 1;
  });
}

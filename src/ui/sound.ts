/**
 * Interface sound for the whole game.
 *
 * Every cue is synthesized on the fly with Web Audio, so there are no audio
 * files to load. Callers only ever say *what happened* (`playCue('gong')`);
 * this module owns the synthesis, the shared AudioContext, the browser
 * autoplay rules and the player's mute preference.
 *
 * Failure is always silent: sound must never block or crash gameplay.
 */
import { useSyncExternalStore } from 'react';

/** pluck: a guqin string (confirming an action). gong: something momentous.
 * chime: a reward or a new note. scroll: a panel unrolls. tick: any button. */
export type Cue = 'pluck' | 'gong' | 'chime' | 'scroll' | 'tick';

const STORAGE_KEY = 'harem-empire:sound';
const MASTER_VOLUME = 0.5;
// Gong-shang-jue-zhi-yu: a pentatonic scale so random plucks always sound pleasant.
const PENTATONIC = [293.66, 329.63, 369.99, 440, 493.88, 587.33];

let context: AudioContext | null = null;
let master: GainNode | null = null;
const plucks = new Map<number, AudioBuffer>();
const listeners = new Set<() => void>();
let enabled = readPreference();

function readPreference(): boolean {
  try { return globalThis.localStorage?.getItem(STORAGE_KEY) !== 'off'; } catch { return true; }
}

export function isSoundOn(): boolean { return enabled; }

export function setSoundOn(on: boolean): void {
  enabled = on;
  try { globalThis.localStorage?.setItem(STORAGE_KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
  listeners.forEach(listener => listener());
  if (on) playCue('pluck');
}

function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

/** React binding for a sound toggle. */
export function useSoundOn(): [boolean, (on: boolean) => void] {
  return [useSyncExternalStore(subscribe, isSoundOn, () => true), setSoundOn];
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  try {
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(context.destination);
    }
    if (context.state === 'suspended') void context.resume().catch(() => {});
    return { ctx: context, out: master! };
  } catch { return null; }
}

/** Karplus-Strong plucked string, rendered once per pitch and cached. */
function pluckBuffer(ctx: AudioContext, frequency: number): AudioBuffer {
  const cached = plucks.get(frequency);
  if (cached) return cached;
  const rate = ctx.sampleRate, length = Math.floor(rate * 1.6), period = Math.round(rate / frequency);
  const buffer = ctx.createBuffer(1, length, rate), data = buffer.getChannelData(0), ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
  for (let i = 0, p = 0; i < length; i++, p = (p + 1) % period) {
    const next = (p + 1) % period;
    data[i] = ring[p];
    ring[p] = 0.4985 * (ring[p] + ring[next]);
  }
  plucks.set(frequency, buffer);
  return buffer;
}

function envelope(ctx: AudioContext, out: AudioNode, peak: number, attack: number, decay: number, at = ctx.currentTime) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  gain.connect(out);
  return gain;
}

function tone(ctx: AudioContext, out: AudioNode, frequency: number, peak: number, decay: number, delay = 0, type: OscillatorType = 'sine') {
  const at = ctx.currentTime + delay, osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  osc.connect(envelope(ctx, out, peak, 0.008, decay, at));
  osc.start(at);
  osc.stop(at + decay + 0.05);
  return osc;
}

function noise(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate), data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
}

const CUES: Record<Cue, (ctx: AudioContext, out: AudioNode) => void> = {
  pluck(ctx, out) {
    const frequency = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
    source.buffer = pluckBuffer(ctx, frequency);
    filter.type = 'lowpass'; filter.frequency.value = 2600;
    source.connect(filter);
    filter.connect(envelope(ctx, out, 0.55, 0.004, 1.4));
    source.start();
  },
  gong(ctx, out) {
    // Inharmonic partials with a slow bloom and a slight downward bend read as bronze.
    for (const [ratio, peak, decay] of [[1, 0.5, 3.6], [1.48, 0.22, 2.6], [2.13, 0.14, 2], [2.94, 0.08, 1.4], [0.5, 0.25, 3.2]] as const) {
      const osc = tone(ctx, out, 98 * ratio, peak, decay);
      osc.frequency.exponentialRampToValueAtTime(98 * ratio * 0.985, ctx.currentTime + decay);
    }
    const hit = noise(ctx, 0.12), filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 420;
    hit.connect(filter); filter.connect(envelope(ctx, out, 0.18, 0.002, 0.12)); hit.start();
  },
  chime(ctx, out) {
    tone(ctx, out, 1174.66, 0.12, 1.1);
    tone(ctx, out, 1760, 0.07, 0.9, 0.09);
    tone(ctx, out, 2349.32, 0.03, 0.6, 0.09);
  },
  scroll(ctx, out) {
    const swish = noise(ctx, 0.35), filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(900, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.3);
    swish.connect(filter); filter.connect(envelope(ctx, out, 0.09, 0.06, 0.26)); swish.start();
  },
  tick(ctx, out) {
    const osc = tone(ctx, out, 1250, 0.06, 0.05, 0, 'triangle');
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.05);
  },
};

export function playCue(cue: Cue): void {
  if (!enabled) return;
  const target = audio();
  if (!target || target.ctx.state !== 'running') return;
  try { CUES[cue](target.ctx, target.out); } catch { /* never block gameplay */ }
}

/** Which cue a clicked control should make. `data-cue` always wins. */
const CLICK_CUES: Array<[selector: string, cue: Cue]> = [
  ['.season-button, .path-card, .send-gift, .ui-primary', 'pluck'],
  ['button, summary, [role="button"], select', 'tick'],
];

/**
 * One delegated listener gives every control in the app a sound, so components
 * never need to remember to call `playCue` for ordinary clicks.
 */
export function installUiSounds(root: Document = document): () => void {
  const onClick = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    // The first gesture is what unlocks audio in every browser.
    audio();
    const tagged = target.closest<HTMLElement>('[data-cue]');
    if (tagged) { if (tagged.dataset.cue !== 'none') playCue(tagged.dataset.cue as Cue); return; }
    for (const [selector, cue] of CLICK_CUES) {
      const control = target.closest<HTMLElement>(selector);
      if (control && !(control as HTMLButtonElement).disabled) { playCue(cue); return; }
    }
  };
  root.addEventListener('click', onClick, true);
  return () => root.removeEventListener('click', onClick, true);
}

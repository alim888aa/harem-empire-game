import { useEffect, useRef, useState, type RefObject, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { ActionGesture, JoystickGesture, STOPPED_TOUCH, type TouchVector } from './touchGestures';

export const hasTouchControls = () => navigator.maxTouchPoints > 0 || window.matchMedia('(any-pointer: coarse), (max-width: 780px)').matches || (new URLSearchParams(window.location.search).get('playtest') === 'intrigue' && new URLSearchParams(window.location.search).get('controls') === 'touch');
export function useTouchControls() {
  const [touch, setTouch] = useState(hasTouchControls);
  useEffect(() => {
    const query = window.matchMedia('(any-pointer: coarse), (max-width: 780px)');
    const update = () => setTouch(hasTouchControls());
    query.addEventListener('change', update); return () => query.removeEventListener('change', update);
  }, []);
  return touch;
}

interface Props {
  onMove: (vector: TouchVector) => void;
  onSprint: (running: boolean) => void;
  onJump: () => void;
  onInteract: () => void;
  interaction: string | null;
  resetRef: RefObject<() => void>;
}

function ActionIcon({ action }: { action: 'jump' | 'sprint' | 'interact' }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {action === 'jump' ? <><path d="M16 26V6m-7 7 7-7 7 7M7 26h18"/><path d="M11 21h10"/></> : action === 'sprint' ? <><circle cx="21" cy="6" r="2"/><path d="m11 14 6-4 5 5 5 1M17 10l-3 10-6 6m6-6 7 3 2 5M4 10h7M2 16h6"/></> : <><path d="M6 7h20v14H16l-6 5v-5H6z"/><path d="M11 12h10m-10 4h7"/></>}
  </svg>;
}

/** Pointer activation works even when browsers suppress compatibility clicks
 * during a held joystick/camera touch. Keyboard/assistive clicks remain usable. */
function TouchAction({ className, label, pressed, disabled, onActivate, children }: {
  className: string; label: string; pressed?: boolean; disabled?: boolean;
  onActivate: () => void; children: ReactNode;
}) {
  const action = useRef(new ActionGesture());
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const resetAction = () => {
      const id = action.current.pointerId; action.current.reset();
      if (id !== null && button.current?.hasPointerCapture(id)) button.current.releasePointerCapture(id);
    };
    const hidden = () => { if (document.hidden) resetAction(); };
    window.addEventListener('blur', resetAction); window.addEventListener('resize', resetAction);
    window.addEventListener('orientationchange', resetAction); document.addEventListener('visibilitychange', hidden);
    return () => {
      resetAction(); window.removeEventListener('blur', resetAction); window.removeEventListener('resize', resetAction);
      window.removeEventListener('orientationchange', resetAction); document.removeEventListener('visibilitychange', hidden);
    };
  }, []);
  const end = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!action.current.end(event.pointerId)) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <button ref={button} className={className} aria-label={label} aria-pressed={pressed} disabled={disabled}
    onPointerDown={event => {
      if (disabled || (event.pointerType === 'mouse' && event.button !== 0) || !action.current.begin(event.pointerId, Date.now())) return;
      event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); onActivate();
    }}
    onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
    onClick={event => { if (action.current.keyboardClick(event.detail, Date.now())) onActivate(); }}>
    {children}
  </button>;
}

export default function PalaceTouchControls({ onMove, onSprint, onJump, onInteract, interaction, resetRef }: Props) {
  const zone = useRef<HTMLDivElement>(null);
  const stick = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const gesture = useRef(new JoystickGesture());
  const [running, setRunning] = useState(false);
  const runState = useRef(false);
  const callbacks = useRef({ onMove, onSprint }); callbacks.current = { onMove, onSprint };
  const reset = () => {
    const id = gesture.current.pointerId; gesture.current.reset();
    if (id !== null && zone.current?.hasPointerCapture(id)) zone.current.releasePointerCapture(id);
    stick.current?.classList.remove('is-active');
    if (stick.current) { stick.current.style.removeProperty('left'); stick.current.style.removeProperty('top'); }
    if (knob.current) knob.current.style.transform = 'translate(-50%, -50%)';
    callbacks.current.onMove({ ...STOPPED_TOUCH }); callbacks.current.onSprint(false); runState.current=false; setRunning(false);
  };
  useEffect(() => {
    resetRef.current = reset;
    const hidden = () => { if (document.hidden) reset(); };
    window.addEventListener('blur', reset); window.addEventListener('resize', reset);
    window.addEventListener('orientationchange', reset); document.addEventListener('visibilitychange', hidden);
    return () => {
      reset(); resetRef.current = () => {};
      window.removeEventListener('blur', reset); window.removeEventListener('resize', reset);
      window.removeEventListener('orientationchange', reset); document.removeEventListener('visibilitychange', hidden);
    };
  }, [resetRef]);
  const update = (event: ReactPointerEvent<HTMLDivElement>) => {
    const vector = gesture.current.move(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!vector) return;
    event.preventDefault(); callbacks.current.onMove(vector);
    const dx = event.clientX - gesture.current.origin.x, dy = event.clientY - gesture.current.origin.y;
    const scale = Math.min(1, gesture.current.radius / Math.max(1, Math.hypot(dx, dy)));
    if (knob.current) knob.current.style.transform = `translate(-50%, -50%) translate(${dx * scale}px, ${dy * scale}px)`;
  };
  const begin = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const element = stick.current; if (!element) return;
    const rect = event.currentTarget.getBoundingClientRect(), diameter = element.offsetWidth;
    const x = Math.max(diameter / 2, Math.min(rect.width - diameter / 2, event.clientX - rect.left));
    const y = Math.max(diameter / 2, Math.min(rect.height - diameter / 2, event.clientY - rect.top));
    if (!gesture.current.begin(event.pointerId, { x: rect.left + x, y: rect.top + y }, diameter * .32)) return;
    event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
    // Float within the safe zone; rendered center and movement origin always agree.
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.classList.add('is-active'); update(event);
  };
  const end = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (gesture.current.pointerId !== event.pointerId) return;
    // Ending movement doesn't switch off a deliberately toggled Sprint.
    const id = event.pointerId; gesture.current.reset(); callbacks.current.onMove({ ...STOPPED_TOUCH });
    if (event.currentTarget.hasPointerCapture(id)) event.currentTarget.releasePointerCapture(id);
    stick.current?.classList.remove('is-active');
    if (stick.current) { stick.current.style.removeProperty('left'); stick.current.style.removeProperty('top'); }
    if (knob.current) knob.current.style.transform = 'translate(-50%, -50%)';
  };
  return <div className="palace-touch" aria-label="Touch movement and action controls">
    <div className="palace-joystick-zone" ref={zone} role="group" aria-label="Movement joystick. Drag with your left thumb."
      onPointerDown={begin} onPointerMove={update} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <div className="palace-joystick" ref={stick} aria-hidden="true"><span className="joystick-axis"/><span className="joystick-knob" ref={knob}/><span className="joystick-label">Move</span></div>
    </div>
    <span className="palace-look-hint" aria-hidden="true">Drag right side to look · Pinch to zoom</span>
    <div className="palace-touch-actions">
      <TouchAction className="palace-touch-interact" label={interaction ?? 'Approach a courtier or gate to interact'} disabled={!interaction} onActivate={onInteract}><ActionIcon action="interact"/><span>{interaction ? 'Interact' : 'Approach'}</span></TouchAction>
      <TouchAction className="palace-touch-jump" label="Jump" onActivate={onJump}><ActionIcon action="jump"/><span>Jump</span></TouchAction>
      <TouchAction className="palace-touch-sprint" label="Toggle sprint" pressed={running} onActivate={() => { const next = !runState.current; runState.current=next; setRunning(next); onSprint(next); }}><ActionIcon action="sprint"/><span>{running ? 'Sprinting' : 'Sprint'}</span></TouchAction>
    </div>
  </div>;
}

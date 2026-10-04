/**
 * A moment of ceremony: a cinnabar imperial seal thuds onto the screen with a
 * gong, followed by the announcement. Used for promotions and other decrees.
 * Dismisses itself after `durationMs`, or on click / Escape.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { playCue } from './sound';

/** Abstract seal-script strokes: reads as a carved seal without relying on CJK fonts. */
function SealGlyph() {
  return <svg className="ui-seal-glyph" viewBox="0 0 100 100" aria-hidden="true">
    <rect x="5" y="5" width="90" height="90" rx="6" />
    <rect x="12" y="12" width="76" height="76" rx="3" className="ui-seal-inner" />
    <path d="M22 26h22M33 26v20M22 46h22M24 36h18M56 24v24M56 24h20v24H56M56 36h20M24 58h20v18H24zM34 58v18M24 67h20M56 58h20M66 58v20M56 68l20 8M56 78l8-8" />
  </svg>;
}

export default function SealStamp({ eyebrow, title, children, onDismiss, durationMs = 4200 }: {
  eyebrow: string; title: string; children?: ReactNode; onDismiss: () => void; durationMs?: number;
}) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    // Let the seal land before the gong rings.
    const gong = setTimeout(() => playCue('gong'), 260);
    const timer = setTimeout(() => dismiss.current(), durationMs);
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss.current(); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(gong); clearTimeout(timer); window.removeEventListener('keydown', onKey); };
  }, [durationMs]);
  return <div className="ui-seal-stamp" role="status" aria-live="polite" onClick={() => dismiss.current()} data-cue="none">
    <div className="ui-seal-stamp-card">
      <SealGlyph />
      <p className="ui-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children && <div className="ui-seal-stamp-body">{children}</div>}
      <small>Click anywhere to continue</small>
    </div>
  </div>;
}

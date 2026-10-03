import DemotionSummary from '../components/DemotionSummary';
import type {DemotionNotice} from '../lib/demotionNotice';
import { useEffect, useRef, useState } from 'react';

export const SEASON_MOODS = [
  { name: 'Spring', line: 'Fresh blossoms. Familiar ambitions.' },
  { name: 'Summer', line: 'The halls grow warm with whispered plans.' },
  { name: 'Autumn', line: 'Favors ripen. Alliances are tested.' },
  { name: 'Winter', line: 'Quiet corridors keep their secrets.' },
] as const;

// A soft original two-note cue only follows an explicit Continue click. Timed
// transitions stay silent; autoplay failure must never hold the game hostage.
function playContinueCue() {
  try {
    const context = new AudioContext();
    void context.resume().then(() => {
      if (context.state !== 'running') { void context.close(); return; }
      for (const [delay, frequency] of [[0, 523.25], [.12, 659.25]]) {
        const oscillator = context.createOscillator(), gain = context.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(.035, context.currentTime + delay + .02);
        gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + delay + .32);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(context.currentTime + delay); oscillator.stop(context.currentTime + delay + .34);
      }
      setTimeout(() => { void context.close(); }, 650);
    }).catch(() => { void context.close(); });
  } catch { /* Silent fallback: a browser audio policy is never a gameplay blocker. */ }
}

export default function SeasonTransition({ season, castCount, faction, giftGrant, onComplete, demotion=null }: {
  season:number; demotion?:DemotionNotice|null; giftGrant:number; castCount:number; faction:string|null; onComplete:()=>void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), complete = useRef(onComplete), done = useRef(false);
  const [leaving, setLeaving] = useState(false);
  complete.current = onComplete;
  const finish = () => { if (!done.current) { done.current = true; complete.current(); } };
  useEffect(() => {
    const element = dialog.current; if (element && !element.open) element.showModal();
    if(demotion)return()=>{element?.close();};
    const fade = setTimeout(() => setLeaving(true), 2600);
    const end = setTimeout(() => { if (!done.current) { done.current = true; complete.current(); } }, 3100);
    return () => { clearTimeout(fade); clearTimeout(end); element?.close(); };
  }, [season,demotion?.id]);
  const mood = SEASON_MOODS[(season - 1) % SEASON_MOODS.length];
  return <dialog ref={dialog} className={`season-transition${leaving ? ' is-leaving' : ''}`} aria-label={`Season ${season}: ${demotion?"Demoted":mood.name}`}
    onCancel={event => { event.preventDefault(); finish(); }}>
    <div className="season-transition-content">
      <p className="season-transition-eyebrow">A NEW SEASON AT COURT</p>
      <p className="season-transition-number">{String(season).padStart(2, '0')}</p>
      <h2>{demotion?"Demoted":mood.name}</h2>{demotion?<DemotionSummary notice={demotion}/>:<p className="season-transition-line">{mood.line}</p>}
      <div className="season-transition-recap">
        <span>+{giftGrant} rank allowance · leftover gifts retained</span>
        <span>{castCount} courtiers in residence</span>
        <span>{faction ? `Your ${faction} allegiance continues` : 'Your alliances are still yours to choose'}</span>
      </div>
      <button autoFocus onClick={() => { playContinueCue(); finish(); }}>Continue <span aria-hidden="true">→</span></button>
      <small>{demotion?"Continue when you’re ready":"Esc or Continue skips the transition"}</small>
    </div>
  </dialog>;
}

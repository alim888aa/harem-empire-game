import DemotionSummary from '../components/DemotionSummary';
import type {DemotionNotice} from '../lib/career';
import { useEffect, useRef, useState } from 'react';
import { playCue } from '../ui';

export const SEASON_MOODS = [
  { name: 'Spring', line: 'Fresh blossoms. Familiar ambitions.' },
  { name: 'Summer', line: 'The halls grow warm with whispered plans.' },
  { name: 'Autumn', line: 'Favors ripen. Alliances are tested.' },
  { name: 'Winter', line: 'Quiet corridors keep their secrets.' },
] as const;

export default function SeasonTransition({ season, castCount, faction, giftGrant, onComplete, demotion=null }: {
  season:number; demotion?:DemotionNotice|null; giftGrant:number; castCount:number; faction:string|null; onComplete:()=>void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), complete = useRef(onComplete), done = useRef(false);
  const [leaving, setLeaving] = useState(false);
  complete.current = onComplete;
  const finish = () => { if (!done.current) { done.current = true; complete.current(); } };
  useEffect(() => {
    const element = dialog.current; if (element && !element.open) element.showModal();
    playCue('gong');
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
      <button autoFocus onClick={() => { playCue('chime'); finish(); }}>Continue <span aria-hidden="true">→</span></button>
      <small>{demotion?"Continue when you’re ready":"Esc or Continue skips the transition"}</small>
    </div>
  </dialog>;
}

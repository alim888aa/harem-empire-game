import Emblem from './Emblem';
import { useSoundOn } from './sound';

export default function SoundToggle({ className = '' }: { className?: string }) {
  const [on, setOn] = useSoundOn();
  return <button type="button" className={`ui-sound-toggle ${className}`} onClick={() => setOn(!on)} data-cue="none"
    aria-pressed={on} aria-label={on ? 'Mute sound' : 'Turn sound on'} title={on ? 'Mute sound' : 'Turn sound on'}>
    <Emblem name={on ? 'sound-on' : 'sound-off'} size={18} />
  </button>;
}

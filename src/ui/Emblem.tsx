/**
 * The game's icon set: thin gold-line emblems drawn as inline SVG, so they
 * inherit `currentColor`, scale with text, and look the same on every device
 * (emoji do not). Add new glyphs to GLYPHS; callers only pass a name.
 */
import type { ReactNode } from 'react';

const GLYPHS = {
  // Factions
  rebel: <><path d="M5 19 19 5M19 19 5 5" /><path d="M3.5 17.5l3 3M17.5 20.5l3-3" /><path d="M16 5h3v3M8 5H5v3" /></>,
  imperial: <><path d="M4 18h16M5 18 4 8l4.5 4L12 5l3.5 7L20 8l-1 10" /><circle cx="12" cy="14.5" r="1.4" /></>,
  loyalist: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6z" /><path d="M9 11.5h6M12 8.5v6" /></>,
  independent: <><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="2" /></>,
  // Palace
  lattice: <><rect x="4" y="4" width="16" height="16" /><path d="M4 12h4V8h8v8h-4v-4" /><path d="M20 12h-4M12 4v4M12 20v-4" /></>,
  ingot: <><path d="M3.5 12.5c2 4 15 4 17 0" /><path d="M5 12.5c.5-2 2-2.5 3.5-2.2C9 7 15 7 15.5 10.3c1.5-.3 3 .2 3.5 2.2" /><path d="M3.5 12.5c0 2.5 2 5 8.5 5s8.5-2.5 8.5-5" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  arrow: <path d="M5 12h13M13 7l5 5-5 5" />,
  bell: <><path d="M7 16V11a5 5 0 0 1 10 0v5l1.5 2h-13z" /><path d="M10 20.5h4M12 4v2" /></>,
  'sound-on': <><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  'sound-off': <><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></>,
  warning: <><path d="M12 4 21 19H3z" /><path d="M12 10v4M12 16.5v.5" /></>,
  scroll: <><path d="M6 4h12M6 20h12" /><path d="M7 4v16M17 4v16" /><path d="M10 9h4M10 12h4M10 15h3" /></>,
} satisfies Record<string, ReactNode>;

export type EmblemName = keyof typeof GLYPHS;

export function isEmblemName(name: string): name is EmblemName { return name in GLYPHS; }

export default function Emblem({ name, size = '1em', title, className = '' }: { name: EmblemName; size?: string | number; title?: string; className?: string }) {
  return <svg className={`ui-emblem ${className}`} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
    strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
    {GLYPHS[name]}
  </svg>;
}

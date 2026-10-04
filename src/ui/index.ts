/**
 * The game's visual language. Import UI building blocks from here, never from
 * the individual files, so this module can change its insides freely.
 *
 * Styling lives in ./theme (tokens + skin). See docs/architecture/ui.md.
 */
export { default as Emblem, isEmblemName, type EmblemName } from './Emblem';
export { default as PopNumber } from './PopNumber';
export { default as SealStamp } from './SealStamp';
export { default as SoundToggle } from './SoundToggle';
export { playCue, installUiSounds, useSoundOn, isSoundOn, setSoundOn, type Cue } from './sound';

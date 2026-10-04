# UI module (`src/ui/`)

The game's visual language lives in one deep module. Components import only from `src/ui` (the `index.ts` barrel), never from individual files inside it.

## Interface

| Export | What callers get |
|---|---|
| `<Emblem name="rebel" />` | A thin gold-line SVG icon. It inherits `currentColor` and scales with the text. Names: `rebel`, `imperial`, `loyalist`, `independent`, `lattice`, `ingot`, `close`, `arrow`, `bell`, `sound-on`, `sound-off`, `warning`, `scroll`. |
| `<PopNumber value={n} cueOnGain="chime" />` | A number that glows when it changes and floats the difference (`+5`) upward. On an increase it can also play a sound. |
| `<SealStamp eyebrow title onDismiss>` | A ceremony overlay: a cinnabar seal stamps down, a gong sounds, then the announcement shows. It dismisses itself, or on a click or Escape. |
| `<SoundToggle />` | A mute button. The preference is saved in `localStorage`. |
| `playCue(cue)` | Plays one of five synthesized sounds: `pluck` (a guqin string), `gong`, `chime`, `scroll` and `tick`. It is silent when muted, when audio is still locked, or when anything fails. |
| `installUiSounds()` | Called once in `main.tsx`. One delegated click listener makes every button sound. Primary buttons pluck, other controls tick, `data-cue="x"` overrides the default and `data-cue="none"` silences it. |
| `useSoundOn()` | React binding for the mute state. |

There are no audio or image files. Every sound is synthesized with Web Audio, and every ornament is an inline SVG.

## Theme

`src/ui/styles.css` is the only CSS entry point:

```
@import "tailwindcss";                 → Tailwind's layers
@import "../style.css" layer(legacy);  → all old feature CSS, frozen
@import "./theme/tokens.css";          → unlayered: always wins
@import "./theme/skin.css";
```

Unlayered styles beat layered ones whatever their specificity. That means the skin can restyle legacy class names with simple selectors, and nobody needs a specificity war. The legacy layer should only shrink. When you rework a component, move its visual rules into the skin and delete them from the legacy file.

### Tokens (`theme/tokens.css`)

| Group | Names |
|---|---|
| Lacquer | `--lacquer-950` to `--lacquer-700`, `--lacquer-glass` |
| Cinnabar | `--cinnabar-800` to `--cinnabar-300` |
| Gold | `--gold-200` to `--gold-700` |
| Jade | `--jade-300` to `--jade-900` |
| Silk and ink | `--silk-50` to `--silk-300`, `--ink-900` to `--ink-300` |
| Type | `--font-display`, `--font-body`, `--tracking-caps` |
| Motion | `--ease-out`, `--ease-ceremony` |
| Frames | `--frame-lacquer`, `--frame-cinnabar`, `--frame-gold`, `--frame-hairline`, `--frame-silk` |
| Ornament | `--ornament-corners`, `--paper-grain`, `--divider`, `--surface-silk` |

Frames are 9-slice SVGs. Any element becomes a chamfered, gold-edged plaque without extra markup:

```css
.thing { border: 1px solid transparent; border-image: var(--frame-lacquer) 12 fill / 12px stretch; background: none; }
```

### Surfaces

- **Lacquer plaque** (`--frame-lacquer`): HUD plaques and buttons over the 3D world, name labels, notices.
- **Cinnabar plaque** (`--frame-cinnabar`): the primary action, alarms, and the "Next season" button.
- **Silk scroll** (`--surface-silk` plus gold rings): every `CourtDialog`. Dialogs unroll between two lacquer rods and play the `scroll` cue.
- **Visual-novel panel**: the 3D conversation. A silk page sits in a lacquer rim, with the courtier's name on a cinnabar plate.
- **Seal or diamond** (`clip-path` diamond in cinnabar): numerals, faction emblems, badges and the close button.

### Motion

`ui-unroll` (scrolls), `ui-rise` (panels and speech), `ui-stamp` (seal), `ui-note-in` (notifications), `ui-pop-*` (numbers), `ui-ember`/`ui-smoke` (the incense clock). Everything is turned off under `prefers-reduced-motion`.

## Fonts

Fonts are self-hosted through `@fontsource/cormorant-garamond` and `@fontsource/alegreya-sans`, and imported in `main.tsx`. Both default to old-style figures. The skin forces `lining-nums tabular-nums` everywhere, so numbers stay full height and don't jitter.

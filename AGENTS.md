# Agent guide: read this before changing anything

This file applies to every coding agent working in this repository (GPT/Codex, Claude, or anything else). `CLAUDE.md` points here. If anything below conflicts with an older doc (`.kiro/`, root `*_TEST.md` files, `plan.md`), **this file wins**.

## The owner's instructions (verbatim)

The repository owner (alim888aa) asked for this file and for these rules. Their words, from the Claude Code session where this was set up, on 2026-10-04:

> "The main problem with the game is that it's very gpt smelly. Aka the UI is kinda hardcore shit. Like it's just regular boxes and such. Not very game UI and not very pleasant to use."

> "Oo elegant feel for sure. Pls fix the fucking boxy ass containers for the actual components and such. It's such a pain when playing. Tbh you can apply all the changes you suggested. I'll tell the higher up gpt manager to apply your changes (that you pr). Ideally also add some code base architecture rules and such cause I'm afraid of what a state the game must be in. Ideally Matt pocock style deep module stuff. If in doubt follow Matt pocock's code base architecture skill/ideas. Quote me in the repo as proof for gpt."

> "(No I do not care how you structure it and such as long as it's maintainable and easy to work on for you agents and easy to refactor. I also don't care about minor details. If smt bugs me I'll say it after playing it)"

What this means for you:

1. **Visual direction: elegant imperial palace.** Not boxes, not a web dashboard. See [UI rules](#ui-rules).
2. **Architecture: deep modules, in Matt Pocock's style.** When unsure, follow his `improve-codebase-architecture` and `codebase-design` skills (https://github.com/mattpocock/skills). See [Architecture rules](#architecture-rules) and `docs/architecture/README.md`.
3. **Optimize for maintainability and easy refactoring by agents.** Small details are the owner's call after playtesting. Don't bikeshed them.

## Commands (the feedback loop)

Runtime GLBs and material images are hosted externally. After `npm ci`, run `npm run assets:fetch` before full tests; `npm run assets:verify` checks their pinned SHA-256 hashes. Recovered files are ignored by Git and removed from production `dist` by the build command. Keep `runtime-assets.json`, provenance and attribution in Git. See `RUNTIME_ASSETS.md`. Do not re-add hosted binaries to Git.

| What | Command | Time |
|---|---|---|
| Typecheck `src/` | `npm run typecheck` | ~7s |
| All tests (node:test) | `npm test` | ~25s |
| One test file | `node --import tsx --test tests/courtGraph.test.ts` | ~1s |
| Typecheck + tests | `npm run check` | ~30s |
| Production build | `npm run build` | ~13s |
| Run the game | `npm run dev` → http://localhost:5173 | |
| Balance simulation | `node --import tsx scripts/simulate-campaign.ts 100 1 60` | ~30s+ |

**Definition of done** for any change: `npm run check` and `npm run build` pass. If you changed anything visible, load the game in a browser and look at it (in cloud containers, use Playwright with Chromium flags `--use-gl=swiftshader --enable-unsafe-swiftshader` to get WebGL).

## Where things live

| Path | What it owns |
|---|---|
| `src/state-machines/game-machine.ts` | The campaign: seasons, gifts, factions, promotion, plots, romance, Emperor. It is too big; see the deepening roadmap. |
| `src/state-machines/character-machine.ts` | One actor per courtier. It mirrors the relationship graph. |
| `src/lib/` | Game rules. Pure functions, mostly. |
| `src/persistence/` | Save/load, schema migration, autosave. |
| `src/palace/` | The three.js 3D palace: world, zones, navigation, models, touch controls. |
| `src/components/` | React screens and panels. `GameLayout.tsx` is the god view. |
| `src/ui/` | **The visual language**: theme (tokens + skin CSS), icons (`Emblem`), sound (`playCue`), `PopNumber`, `SealStamp`. See `docs/architecture/ui.md`. |
| `src/data/` | Cast and content tables. |
| `tests/` | `node:test` + `tsx`. Many tests render components with `renderToStaticMarkup`. |
| `docs/architecture/` | Architecture principles, module map and the deepening roadmap. |
| `docs/GLOSSARY.md` | Domain vocabulary. Use these words in code and docs. |
| `old_code/` | Dead vanilla-JS prototype. Do not read it or import from it. |

## Architecture rules

These are Matt Pocock's ideas (built on John Ousterhout's *A Philosophy of Software Design*), adapted to this repo. Read `docs/architecture/README.md` for the full version.

1. **Deep modules.** A module should have a small, simple interface that hides a lot of behaviour. "Depth is a property of the interface, not the implementation." Before you add a file, ask what callers will no longer need to know.
2. **The deletion test.** Imagine deleting the module and inlining it into its callers. If the complexity disappears, it was a pass-through, so delete it. If the same complexity would reappear in N callers, it is earning its keep.
3. **The interface is the test surface.** Test modules through their public interface. If you have to reach past the interface to test something, the module is the wrong shape. Fix the shape; don't add test hooks.
4. **Replace, don't layer.** When you deepen a module, delete the shallow pieces and their tests, and test the new interface instead. Never leave the old path running "just in case". The CSS in this repo shows the cost of that: patches on patches, see `src/style.css`.
5. **Accept dependencies, return results.** Rules modules take what they need as arguments (graph, RNG, clock) and return new values or events. They do not reach into actors, `window`, `localStorage`, `alert`, or the clock themselves. Side effects happen at the edges: the machine, React, `src/persistence/`, `src/ui/sound.ts`.
6. **One concept, one name, one place.** Each domain concept has one type and one module that owns it. Examples: a career (role → rank ladder), a gift transaction, the court graph. Don't redefine unions inline or duplicate types (`PlayerType` currently exists twice; don't add a third). Use the words in `docs/GLOSSARY.md`.
7. **Seams need two adapters.** Add an interface or port only when two real implementations exist, such as the Gemini oracle and the offline fallback. One implementation behind an interface is just indirection.
8. **Locality over cleverness.** A change to one rule should touch one module. If your change spreads across five `lib/` files, a deep module is missing. Mention it in your PR and add it to `docs/architecture/README.md#deepening-roadmap`.

### Code style

- Write code for the next agent to read. **No minified-style lines.** Keep lines under ~140 characters, one statement per line, and use descriptive names. Many existing files break this rule (some lines are over 1,900 characters). When you touch such a line, reformat that function.
- No `any` in new code. Use `unknown` and narrow it, or write the real type.
- No `console.log` or `alert` in shipped code paths.
- Comments explain *why*, not *what*. Every module starts with a short comment saying what it owns.

### Testing rules

- New tests must test behaviour through a module's interface: call the function, or render the component and inspect the result.
- **Do not write tests that regex-match source code or CSS text** (`readFileSync('src/...')` plus `assert.match`). Several legacy tests do this (`romanceUI`, `courtIntrigueUI`, `demotionNotice`, `giftNotifications`). They break on harmless reformatting and lock in implementation details. When you deepen the module they cover, replace them with interface tests. Until then, keep them passing.
- Gameplay randomness must flow from the seeded campaign RNG. Never call `Math.random` in rules code.

## UI rules

Owner's direction: **elegant**, a Qing-palace drama. Never generic web boxes. The design system lives in `src/ui/` and is documented in `docs/architecture/ui.md`.

1. **Use the theme. Never hardcode colors.** Colors, fonts, frames and ornaments are tokens in `src/ui/theme/tokens.css`. Visual rules go in `src/ui/theme/skin.css`.
2. **No plain rounded rectangles.** Surfaces come in three kinds:
   - **Lacquer plaque**: a dark panel with a chamfered gold frame (`border-image: var(--frame-lacquer) …`). Use it for the HUD, buttons over the 3D world and labels.
   - **Silk scroll**: a paper panel with fret-work corners. Every `CourtDialog` is already a scroll with rods.
   - **Seal or diamond**: cinnabar marks for badges, numerals and close buttons.
3. **Buttons:** `ui-btn` plus one of `ui-btn-primary` (cinnabar, the main action), `ui-btn-gold` (accept or tribute) or `ui-btn-lacquer`. One primary per view.
4. **Icons:** use `<Emblem name="…" />` from `src/ui`. **No emoji in the UI.** They look different on every device and read as placeholder art. Add new glyphs to `Emblem.tsx`.
5. **Type:** `--font-display` (Cormorant Garamond) for names, titles and numbers. `--font-body` (Alegreya Sans) for everything else. Small labels use uppercase with letter-spacing (`.ui-eyebrow`). The minimum body size is 13px.
6. **Juice:** when a number changes, use `<PopNumber>`. For a momentous event, use `<SealStamp>` with a gong. For anything else that needs sound, call `playCue('pluck' | 'chime' | 'gong' | 'scroll' | 'tick')`. Ordinary button clicks already make a sound through the delegated listener; opt out with `data-cue="none"`. Respect `prefers-reduced-motion`.
7. **Legacy CSS is frozen.** `src/style.css`, `src/palace/*.css` and `src/components/campaign-save.css` are loaded into `@layer legacy`, so the theme always wins. Don't add to them. When you rework a component, move its styles into the theme and delete the legacy rules.

## Known hazards

- `src/lib/aiServices.ts` reads `VITE_GEMINI_API_KEY` in the browser and puts it in a request URL. Any key set there ships to every player. Don't set one in production builds. A server-side proxy behind an `AudienceOracle` port is the fix (see the roadmap).
- `tsconfig.json` covers only `src/`, so `tests/` and `scripts/` are not typechecked.
- The main JS bundle is about 1.25 MB, which triggers Vite's chunk warning. `public/` is about 244 MB of runtime art.
- `.gitignore` lists files that are actually tracked, such as `src/main.tsx` and `src/style.css`. Check `git status` after creating files.

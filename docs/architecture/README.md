# Architecture

Start with `AGENTS.md`, which has the short version and the owner's instructions. This document covers the principles in more depth, describes the current module map, and lists the deepening roadmap.

## Principles (Matt Pocock style)

The owner asked for "Matt Pocock style deep module stuff", and said: "If in doubt follow Matt pocock's code base architecture skill/ideas." The ideas below summarize his `improve-codebase-architecture` and `codebase-design` skills (https://github.com/mattpocock/skills). Those skills build on John Ousterhout's *A Philosophy of Software Design*. When this document and those skills disagree, the skills win.

### Vocabulary

Use these words precisely in docs, PRs and reviews.

- **Module**: anything with an interface, at any scale. A function, a file, a folder or a state machine can each be a module.
- **Interface**: everything a caller must know to use the module. That means types, and also invariants, ordering, error modes and configuration.
- **Depth**: leverage at the interface. A module is deep when the interface is small and the module does a lot behind it. It is shallow when the interface is about as complex as what the module does.
- **Seam**: a place where behaviour can be swapped without editing the callers.
- **Adapter**: one concrete implementation behind a seam.
- **Leverage**: what callers gain from the module.
- **Locality**: what maintainers gain from it. Related change happens in one place.

### Rules of thumb

- **Depth is a property of the interface, not the implementation.** A deep module can have internal seams and helper files. Callers shouldn't see them.
- **Deletion test.** If you deleted the module, would the complexity vanish? Then it was a pass-through, so delete it. Would the same complexity reappear across N callers? Then it is earning its keep.
- **The interface is the test surface.** If you need to test past the interface, the module is probably the wrong shape.
- **One adapter means a hypothetical seam; two adapters means a real one.** Don't add ports or interfaces for a single implementation.
- **Testability:** accept dependencies, don't create them. Return results, don't produce side effects. Keep the surface area small.
- **Replace, don't layer.** Once the deep module has boundary tests, delete the shallow modules and their unit tests. Tests should survive internal refactors.
- **Dependency categories decide test strategy:**
  - In-process: merge it in and test it directly.
  - Local and substitutable, such as storage: pass in a fake.
  - Remote and owned by us: a port with an in-memory adapter.
  - True external: mock it.

### Process for architecture work

Follow `improve-codebase-architecture`:

1. **Explore.** Look at hot spots in `git log`. Find where understanding a feature means bouncing between many small modules. Find shallow modules, functions extracted "just for testability" whose bugs live in their callers, seams that leak, and code nobody tests.
2. **Report candidates.** For each one, write Files / Problem / Solution / Benefits (in terms of locality and leverage) / Strength (Strong, Worth exploring, or Speculative). Pick one; don't refactor everything at once.
3. **Design it twice.** Before committing to an interface, sketch two or three very different ones, then compare them: minimal, flexible, shaped around the common caller, or ports-and-adapters.
4. **Ship it in one change.** That change deepens the module, moves the tests to its interface, deletes the shallow pieces, and updates `docs/GLOSSARY.md` and this file.

## Current module map

| Module | Interface today | Depth |
|---|---|---|
| `state-machines/game-machine.ts` (~1,400 lines) | XState machine; ~80 event types | **Shallow and tangled.** It owns everything: seasons, gifts, factions, promotion, plots, romance and the Emperor. It reads child actor snapshots 36 times. |
| `state-machines/character-machine.ts` | One actor per courtier, ~25 events | Mirrors the canonical court graph. Kept in sync with serials and projection events. |
| `lib/career/` | One public entrypoint for career identity, access, progression, deadline, money and office rules | **Deep.** Legacy inputs normalize at the boundary; original import paths are tested compatibility exports only. |
| `lib/*` | Pure-ish functions | Many fail the deletion test. They are 4–40-line fragments that take `role: string \| null, rank: string \| null` and re-resolve the career themselves. |
| `components/GameLayout.tsx` | `machineState: any; send: any` | A god component. It owns the season clock, presence, rule derivations and every dialog. |
| `palace/PalaceScene.tsx` | React props plus ref callbacks | One very large `useEffect` closure. `palace/world.ts` is already deep and node-testable. |
| `persistence/campaignSave.ts` | save, parse, migrate | Validates **raw XState snapshot internals**, so renaming a machine state can break saves. |
| `ui/` | `Emblem`, `PopNumber`, `SealStamp`, `SoundToggle`, `playCue`, `installUiSounds`, plus the theme CSS | **Deep.** One delegated listener gives every button sound. The theme restyles the whole app without editing components. See `ui.md`. |

## Deepening roadmap

The Career candidate is implemented on this refactor branch (see docs/factory/career-refactor.md); the remaining candidates come from an audit done on 2026-10-04. They are ordered by value against effort. Each one should land as its own PR. Remove an entry when it is done, and add new ones as you find them.

2. **Gift transaction module** (Strong, medium effort). One gift currently touches about 10 modules plus three machine handlers. Preview and commit each patch `suspicion` by hand. Proposed: `giftOptions(court, player, target, zone)` returns each choice with its allowed flag, cost and preview. `resolveGift(court, player, request)` returns the new court, the outcome and a receipt. Then "preview equals receipt" holds by construction and needs just one test.
3. **Side effects out of the machine** (Strong, very low effort). `game-machine.ts` calls `alert()` and `console.log`. Emit notices into context instead, and let the UI render them.
4. **Campaign view-model** (Strong, medium effort). Add `selectCourtView(snapshot, ui): CourtView` and a typed `CampaignCommands` object. Then `GameLayout` stops reading actors and recomputing rules. UI tests render `CourtView` fixtures, which replaces the source-grep tests.
5. **Season clock and presence** (Worth exploring, low effort). Move the free-roam clock out of `GameLayout`. Proposed: `createSeasonClock({ now, onExpire, onIntroTick })` with `tick(dt, paused)` and `snapshot()`. Test it with a fake clock.
6. **Court model as the single source of truth** (Strong, high effort). Make the court a pure `Court` value with `applyCourt(court, command, rng)` returning `{ court, events }`. The machine keeps only the flow states, and `character-machine` goes away.
7. **Save schema owned by persistence** (Worth exploring, high effort; do it after 6). Add `toSave(campaign)` and `fromSave(raw)` over a versioned domain DTO instead of XState internals.
8. **Palace runtime** (Worth exploring, medium effort). Add `createPalaceRuntime(canvas, deps)` returning `{ update(props), on(event, cb), dispose() }`. React becomes a thin wrapper.
9. **Audience oracle port** (Speculative, small effort). Put an `AudienceOracle` port in front of the Gemini and offline-fallback adapters. Those are two real adapters, so this is a real seam. It also lets the API key move server-side.

### Hygiene backlog

- Delete `old_code/`, `src/typescript.svg`, and the obsolete manual test guides in the root: `*_TEST.md`, `test-*.md`, `plan.md`. Also delete `.kiro/steering/rules.md`, which forbids automated tests and contradicts the 415 that exist.
- Dead exports to remove: `handlePromotion`, `calculateAmbitiousMessageEffects`, `calculateFactionEffects`, `consortHostility`, `careerWindow`, `graphBackers`, `getRank`, `hasPromotedOffice`, `getDisabledActions`, `PALACE_CRAFT_LIGHTING`.
- Typecheck `tests/` and `scripts/`. This needs `@types/node` and a `tsconfig` that includes them; about 380 errors are waiting.
- Fix `.gitignore` so it stops listing tracked files.
- Move `Math.random` defaults in `data/characters.ts` and `lib/getResponse.ts` onto the seeded RNG.
- Code-split the 3D palace so the first screen loads fast.

## Career module

`src/lib/career/index.ts` is the sole runtime entrypoint for career rules. It owns legacy minister/Scholar and final Empress aliases, cumulative zone access, rank progression, allowances/tribute, deadlines, demotion receipts/standing and office identity. Pure complete operations preserve the existing actor/event/save shapes; internal files are grouped by owned behavior.

The public `CAREER_RULES` table owns career-specific tuning. `CAMPAIGN_BALANCE` keeps its supported configuration shape by referencing those same objects, not duplicating them. Relationship endorsement renewal, gift effects and faction rivalry remain with their existing owners. Existing careerAccess/careerDeadline/demotionNotice and exported career operations on balance/standing/identity/intrigue remain import-only compatibility contracts, with identity and behavior tests; no second rule implementation runs.

Do not merge the distinct audience and deadline demotion semantics during cleanup. Golden v7 public-operation tables and the unchanged seeded simulator capture these distinctions.

# Harem Empire beta

A browser court-politics game with three careers, persistent relationships, five connected 3D palaces, and a 2D fallback. This repository contains reproducible source and runtime assets. Large validation archives and editable Blender workbenches are preserved separately. The current checkpoint is the published v40 runtime, including 23 rebuilt lower-court models: eight Maids, eight Eunuchs with authored temple/nape hair, six Scholars with raised natural-waist sashes and attached tails, and Concubine Mei. Version39 speech placement and romantic messages remain intact. The remaining cast and higher-rank outfits are still in progress. See `SCOPED_CHARACTER_UPDATE.md` for the precise art and verification limits.

## Run
- Node 22+; `npm ci`
- `npm run dev`
- `npm run build`
- `node --import tsx --test tests/*.test.ts`
- `node --import tsx scripts/simulate-campaign.ts 100 1 60`

## Beta contracts
- Start/season gifts: Concubine20, Consort25, Empress30; Scholar20, Minister30, PrimeMinister45; Prince25, GrandPrince45, CrownPrince65. Leftovers and ally gifts remain.
- Tier gift costs1/5/10/20; NPC influence caps10/40/70/90%. Positive gifts depend on relative influence; low-tier influence contributes less global standing.
- Player relationships are canonical directed graph SUPPORT, HATE and explicit PLEDGE edges. All named courtiers, player and Emperor are nodes; NPC relationships are seeded once with bounded exceptions, separate from campaign RNG. No runtime LLM dependency.
- Promotions add rival hate by player path: Prince20, Scholar/Minister30, Concubine40.
- Tribute costs10/20/40 gifts by current career rank; displayed cost, affordability, payment and pardon agree.
- Each surviving living pledge contributes1/5/10 gifts by existing minor/side/major type every season, regardless of support or palace presence. The initial courtship gift counts toward that person’s current-season payment. Casualties settle before new-season pledge income.
- Same formal faction and pledged allies are immune to personal hate gains. Independent is unaffiliated. Empire loyalty, fear and court reputation remain; former personal trust/loyalty/dependence meters are removed.
- Each role retains its per-rank deadline and promotion standing targets, including200 for Empress. Beta balance choices: full influence earnings through70%, one-fifth thereafter; promotion awards up to3 points; three completed top-office seasons before faction victory audience.
- Middle+ enemies at80 hate who strictly out-influence the player can warn of an assassination for the next season. After the first full warning season, each unresolved attacker kills one living pledged ally every season until player influence strictly exceeds theirs. Equality is unsafe for an active plot. Pledge, shared faction, lost motive/rank eligibility or a departed attacker can also end it. Victims are weighted by directed relationships and shared schedules; no ally means player death. Cosmetic death methods persist without extra gameplay RNG draws. Off-zone allies count; casualties never resurrect.
- Save schema7 accepts legacy1–6 with deterministic migration. Migration never awards rewards, rerolls an existing graph, reduces saved influence, or applies historical assassinations.

## Visual implementation
48 courtiers use eight shared tier1–3 archetypes and four unique tier4 models; nine player rank outfits and the Emperor are distinct. Face texture/emission and skeletal contracts are preserved. Portraits are rendered from actual runtime models. Zones stream their owned assets. Focal room geometry exposes explicit navigation colliders, camera blockers and raised-floor heights.

## Verification limits
Automated gameplay/state/save tests and seeded policy simulations are regression evidence, not proof of human difficulty. Exported asset animation/room render proofs are offline geometry renders. The dedicated cloud browser could exercise the public UI and software fallback, but did not provide working WebGL; GPU frame rate, live GPU cloth/camera appearance and device-specific performance remain unverified. Main JavaScript bundle currently triggers Vite's >500KB chunk warning.

## Explicit QA mode
`?playtest=intrigue&renderer=software` shows a labeled fictional-scenario loader. Only clicking Load initializes it. It uses `qa-intrigue:`-prefixed save keys and production save validation; ordinary campaigns are never read or modified. Leave test mode returns to the normal campaign. Scenario events use production season/plot mechanics; it is not a claimed organically progressed campaign. Normal routes have no fixture loader/fetch. Generated from `scripts/generate-playtest-fixture.ts`.

## Current loading and gift-point corrections
Gift effects round once to whole personal-support points after combined influence/hostility scaling. Preview and receipt show the same actually credited delta; a legacy fractional balance can still receive a fractional remainder at 0/100. Existing saves and influence precision are preserved.

Only authored GLB character art is rendered. Initial/zone loading waits for the player model, with retry/2D recovery if unavailable; missing NPC art remains invisible until ready. The player's decoded template is retained across zone changes, while NPCs, private skeletons and off-zone art still release. The software navigation test deliberately has no character bodies.

A new campaign gets one guaranteed introductory Emperor visit after 75 seconds of active free-roam, with a visible countdown. Menus, loading and hidden tabs pause it; accumulated time and the seen marker survive reload. The Emperor surveys the court, and Return to the court resumes the same season. This introduction has no tribute, reward, refill or plot/deadline advancement. Older saves without the marker are treated as already introduced to avoid a duplicate surprise.

The Emperor’s source bytes prewarm after the first playable frame. The introduction uses a 1.5-second walking entrance; regular tribute encounters retain 5 seconds and their existing seasonal probability/consequences. Cold loading and in-modal retry/2D recovery are explicit.

## v26 campaign usability and art
Refresh still resumes the current saved role and progress. Save & game names the current rank and season, explains refresh in one sentence, and offers Choose another path with the existing backup confirmation; all three roles remain available. Detailed storage and plot rules are collapsed.

The Empress player's sash now follows the bodice instead of forming an open rear rim. Only448 sash vertices change; face/hair/crown/materials/rig/skin weights and seven clips are preserved. Offline side/rear/front and motion proofs are included under validation/v26-belt.

Gift receipts now arrive silently in Notifications with a saved unread count. The latest50 receipts retain sender, amount and season; opening the panel marks them read without changing gift balances or advancing time. Consequential plot warnings and Emperor choices remain separate.

## Palace distribution
All maids now have equal Ladies/Empress/Dowager placement weights. Eunuchs keep equal weights across all five palaces. Ordinary, Grand and Crown Princes can visit both royal women’s palaces while their existing access restrictions remain. Equal chances do not force equal occupancy: the12–16 selected seasonal courtiers still spread across changing quarter-season schedules.

## Demotion recap
A deadline demotion remains on the season screen until acknowledged, naming the previous/new rank and reason. An Emperor-audience demotion appears immediately. Both notices survive reload without replaying the demotion, payment or season transition. The isolated QA route also exposes a fictional upcoming-demotion scenario.

## Romance update
Affection and accepted lovers now live in the canonical directed graph alongside existing support/hate/pledges. Romantic gifts use the same budget; political rewards and Emperor endings are unchanged. Multiple lovers can become jealous rivals and assassinate each other under the existing warning cadence. Concubine romance has explicit named-witness risk before each action. See `ROMANCE_RULES.md` for beta tuning, eligibility, safeguards and verification.


## Mobile/tablet movement update
Touch-capable devices (including tablets with trackpads) and narrow windows normally show a 140–176px constrained floating joystick with a 14% deadzone and analog walking speed. Right-side one-finger drag controls the camera; two camera-owned fingers pinch zoom without adding camera rotation. A movement finger is never a pinch partner. The separate 60–72px Jump, Sprint toggle and context Interact buttons use owned pointer presses, so they remain usable while movement/camera touches are held. WASD/arrows, Shift, Space, E, drag, scroll and R remain available on desktop.

Pause/dialogs, zone changes, loading, blur, hidden tabs, resize/orientation changes and lost/cancelled capture reset active input. Top and bottom touch HUD offsets honor display safe areas. Short landscape uses a compact upper HUD and separate lower-corner thumb controls. Extreme desktop-like small windows below360px wide use a96px stick while retaining60px action targets; portrait phone and ordinary tablet targets stay larger. No Genshin assets or code are included; the general left-joystick/right-camera/action layout was referenced from public Genshin mobile UI examples on HoYoLAB: https://www.hoyolab.com/article/38409517.

Automated gesture/state tests are not physical iPad testing. Device-specific touch event behavior, Safari, live GPU graphics and performance still require hardware QA. Browser evidence, where available, is recorded under validation/mobile-controls.

## Repository sync checkpoint

The 2026-10-03 sync preserves the published v37 runtime without deploying the Site again. Existing repository history and legacy files are retained. Generated `dist`, dependencies, machine-specific hosting configuration, large proof archives, and unpublished art work are excluded. Provenance stays beside runtime assets; only obsolete local filesystem paths were removed from material provenance.

Run the build and tests listed above for this current version. Historical `.kiro/steering/rules.md` describes an earlier manual-only workflow; these current commands reflect the approved build/test workflow. Create `validation/` before running optional simulation/export scripts (`mkdir -p validation/palace`). References above to archived validation evidence describe separately retained release evidence, not files checked into this repository.

### v38 sync

The subsequent v38 update changes the named cast registry and its tests, adds 15 corrected/new runtime models with their provenance, and updates the release notes. The prior v37 models remain preserved for history/recovery; only the new content-addressed filenames are selected. No Site deployment is performed by this repository sync.

## Portable Mei asset metadata

The Git repository removes one obsolete machine-local authoring path from Mei’s node extras. Geometry, materials, textures, skeleton and animation data are unchanged; all binary chunks are byte-identical to the published v38 model. The registry selects the sanitized content-addressed file. Its new SHA-256 is d0c39967a8b1b807efdc63c9c24b1559eba6c75649f401b1fccfdf9eb1cd46ab; the published v38 SHA-256 remains ae97df765eb066db61dcb273ae678d89eaa6a9e8cc6728d4c7a464e4ae71ab16. This is a metadata-sanitized equivalent, not a byte-identical copy of that one published GLB. The public Site is unchanged by this sync.


### v40 sync

The v40 update adds exactly 14 content-addressed runtime GLBs and their matching license/provenance: eight corrected Eunuch hairstyles and six corrected Scholar sashes/tails. The selected registry and golden tests match the published source snapshot. All eight Maids, clean Mei, 25 fallback courtiers, and v39 UI behavior remain unchanged. Older checked-in assets are retained for history and recovery. Private workbenches, validation archives, source ZIPs, generated output, dependencies, and machine-specific hosting configuration are excluded. Existing material-source path sanitation is preserved. This sync does not deploy the public Site.

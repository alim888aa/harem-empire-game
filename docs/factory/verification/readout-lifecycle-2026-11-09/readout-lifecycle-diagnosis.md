# Playtest readout lifecycle diagnosis, November 9, 2026

## Finding and decision

No persistent stale-readout defect was established through the public PalaceScene interface. No runtime repair, committed regression test or source commit was made. The exact November 8 persistent-looking observation is not deterministically reproduced. A smaller, bounded behavior is reproduced: ordinary roster reconstruction leaves the previous readout displayed until the new scene accumulates more than 0.1 simulation seconds and publishes its first readout. This is insufficient to attribute stills 42–44 or justify a speculative repair.

Product remains the clean staged source HEAD `98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b`, tree `c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b`. There is no candidate diff beyond that head. The November 6 legal-pose restoration repair is untouched. No source, CSS, factory/platform, dependencies, hooks, saves, gameplay timing, actor placement, RNG, public refs, Site or publication changed.

## Evidence inspected

Read project AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md including Realism, docs/factory/READINESS.md, worker SKILL.md and PARENT.md, plus current software-engineering guidance. The project uses manual cloud v3 pin `7d756086b9938635e0cd11064a4d337eae747326`; no stock dispatch or metrics was used.

Read November 8 native receipt and independent review under accounting `docs/factory/verification/concubine-pose-recovery-2026-11-08/`. Opened the actual original local JPEGs with view_image:

- `.scratch/harem-nov8/native/42-concubine-controls-second-recovery-state.jpg`
- `.scratch/harem-nov8/native/43-concubine-final-movement-state.jpg`
- `.scratch/harem-nov8/native/44-concubine-final-ordinary.jpg`

They display the same frame 42/player (-1.24, .14, 12.15)/camera (-1.24, 3.33, 17.85)/old roster while clock and facing differ. This corroborates the supplied observation, not temporal continuity, actual displacement, a failed movement simulation, or source attribution. Stills are not temporal proof. The prior native run reports 0–1 fps and delayed queued actions; this experiment does not measure or explain that environment's React scheduling or GPU throughput.

## Real owner and lifecycle trace

- `GameLayout.tsx:386–394` supplies stable visit state, season/progress, seasonal people and paused state to PalaceScene. Campaign clock progress determines quarter-season roster. The component key is giftSessionId; ordinary roster changes need not remount React state.
- `zones.ts` owns deterministic quarter-season `scheduledNpcZone`/`zoneRoster`, entry zones, gate geometry and visit poses. No seeded campaign RNG is consumed by this scheduling.
- `PalaceScene.tsx:107–116` owns readout React state, the command ref, current roster and its name key. PlaytestConsole has no subscription or polling and owns only command/result state. It renders the passed readout string unchanged.
- Existing scene effect `PalaceScene.tsx:117–495` owns the actual world, navigation, camera, input, renderer and RAF closure. Dependencies are rosterKey, playerType, zone and visits. Rank/season updates have their existing in-place owners. Dialog/help/ordinary parent rerenders alone do not replace that effect.
- Each scene starts new local renderedFrames, telemetry accumulator, camera and frame budget. `requestAnimationFrame` drives the current closure. Cleanup sets disposed, cancels its scheduled RAF, removes listeners, saves the current pose, disposes the world and resets command/travel callbacks. The disposed guard prevents a saved old callback doing work if invoked after teardown.
- `PalaceScene.tsx:301–314`: disposed/rendererFailed returns; hidden tabs and render-budget skips do not publish telemetry. Hidden callbacks set last time to avoid accumulated simulation catch-up. `renderBudget.ts` independently caps software rendering at 12 Hz, active native rendering at 60 Hz, settled paused native menus at 10 Hz and suppresses hidden-tab work. A changed view/pause restarts settling.
- `PalaceScene.tsx:329`: simulation dt is bounded at .35 seconds for software or .15 for native. This bounds movement and telemetry accumulation, rather than substituting wall-clock values. Scripted commands expire against performance time through the existing normal input reset path.
- `PalaceScene.tsx:471–488`: pose storage and telemetry are separate. Once telemetry exceeds .1 simulation seconds, the scene writes nearby/gate/area/map and, only when testing is enabled, the actual current world/player/camera/roster readout. The readout's frame count is sampled before that iteration calls renderer.render and increments it. Frame 0 in a replacement scene is therefore legitimate.
- Reconstruction does not clear readout React state, so the previous scene's text can remain until that first new publication. A full React remount creates Waiting for renderer instead. There is no second instrumentation stream, stale external subscription or copied command closure in PlaytestConsole: form submission calls execute.current at submission time.
- Context loss explicitly stops the scene and exposes the existing fallback; old readout text is not itself a new success. No context-loss event was established in the native evidence and no repair is inferred from it.

## Deterministic public-interface experiment

Artifact `readoutDiagnostic.test.ts` is 153 lines, derived from the existing public-component scene harness. It was temporarily materialized as `tests/palace/readoutDiagnostic.test.ts`, run using `node --import tsx --test tests/palace/readoutDiagnostic.test.ts`, copied into this evidence directory and removed from product before focused/aggregate checks. To replay, copy it back to that same relative path, run that command, then remove the temporary file. It imports production interfaces, renders PalaceScene in jsdom with the existing software renderer query and uses public DOM input. There is no headless browser, hidden scene access, test hook or renderer stub.

The harness controls external RAF/time/visibility through ordinary environment boundaries, without sampling private Three.js or React state. It checks exactly one live scheduled callback at each step. Scene movement uses the same production navigation/collision and input code; software mode has intentionally different character visuals and is not native WebGL proof. It creates four ordinary named courtiers as component input and a fresh Concubine visit state, with the inherited harness empress-rank prop (this is not ordinary-rank career-access proof); it does not import or alter the actual native campaign/save.

Fresh result: 1 experiment passed, 0 failed, duration about 51 seconds. Full output is `readout-diagnostic.log`.

1. Start Concubine Ladies' Court with Consort Hua. At 300ms readout shows frame 0 and one courtier.
2. Change only public seasonProgress to .3. The old readout remains immediately and after the first 90ms callback. After the next 90ms callback, new readout is frame 1 and zero courtiers. This is a bounded stale window, not the persistent native observation.
3. Repeat natural roster phases .6, .9, 0, .3, .6. In every cycle open/dismiss actual help buttons, dispatch ordinary D down/up and frames, pause/resume through props, hide and resume the document, deliver a 40-second delayed RAF, submit the default walk command through the public form and allow it to expire. The test asserts refreshed readouts and correct pause state. Logs record actual numeric player/camera results, not invented successful values.
4. The five logged recovered player poses progress from (0.41, 0, 14.19) to (0.81, 0, 13.38), (1.21, 0, 12.57), (1.62, 0, 11.76), (2.02, 0, 10.95), with current phase-specific rosters and frame 7 each. Equal frame 7 is legitimate per-scene reset, not freeze.
5. Interrupt a rebuilt scene before any new frame by immediately rendering a different roster, then step once. Only one scheduled frame remains and current roster publishes.
6. Full keyed remount with cloned visit state resets text to Waiting for renderer. First frame publishes frame 0/current roster while retaining the actual walked pose.

This experiment passes on unchanged source. There is no red-before/green-after repair claim, no fresh negative-test claim and no assertion that stale native behavior is disproved. React scheduler starvation, very slow actual GPU frames, visibility and delayed native captures remain possible distinctions that this deterministic software test does not settle.

## Scope and remaining gates

Cloud-only local reads, diagnosis and checks used the already admitted USD10 conservative source reservation. No additional worker, admission, changed estimate or substantive parallel job was launched. No network fetch was needed: assets verify reports all 131 pinned runtime files present and matching, zero downloads. No purchase, paid service, new account, credential/security change, telemetry export, session log read, unsafe renderer flag, server, tunnel, browser or production action occurred.

Independent native proof and exact-head review remain parent-owned. No browser campaign was run in this role. The public V57/source `abbf403ef771569533b802a88691696db4f0ce94` at the existing Harem Empire Site is supplied parent context, not freshly reverified here. This diagnosis cannot waive P0 #41/#42, historical H2, comprehensive careers/reduced motion, actual CSS 1440x900/390x844, physical touch, temporal gait/full controls/targeted Speak/chained encounters, hosted delivery or parent release approval.

No action was denied, remains pending with uncertain outcome, or needs user permission. The diagnostic question remains unresolved at the native-runtime level; do not release a speculative change to make telemetry appear successful.

## Fresh final verification

- `npm run assets:verify`: passed, all 131 pinned files, zero downloads; `assets-verify.log`.
- Public-interface diagnostic: passed 1/1, unchanged runtime; `readout-diagnostic.log` and exact 153-line `readoutDiagnostic.test.ts`.
- `node --import tsx --test tests/renderBudget.test.ts tests/palace/poseRestore.test.ts tests/palace/navigation.test.ts`: exit 0, 16/16 passed; `focused-regressions.log`.
- `npm run factory:check`: exit 0, selected hygiene ratchet passed, factory 25/25, application typecheck passed, product 567/567, runtime assets 131 verified, production build passed in 7.85 seconds and pruned 129 hosted binaries; `factory-check.log`.
- Build warns about large chunks; npm reports its existing http-proxy configuration warning/update notices. No dependency/install or suppression change was made. The selected hygiene ratchet is not full ESLint/dead-code/folder-limit certification. There is no standalone lint script, so full ESLint was never run.
- Final git status is clean, git diff empty, exact head/tree unchanged. `identity-and-diff.log` preserves the checks and a zero-byte `candidate.diff` preserves the complete empty diff.
- Never run in this role: native WebGL/browser campaign, actual CSS/touch/temporal proof, independent code review, hosted-delivery test, CI lookup, remote preservation/integration, or publication. No failing check was rewritten as passing; historical negative-test evidence remains historical.

Artifact integrity is listed in `source-artifact-sha256.txt`; it covers report, experiment, focused/aggregate/assets logs, identity receipt and empty complete diff. Hashes establish artifact identity, not missing native attribution or release clearance.

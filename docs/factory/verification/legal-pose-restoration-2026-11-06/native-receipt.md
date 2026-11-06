# Independent native legal-pose restoration hunt, November 6, 2026

Author: edge-case-hunter, independent cloud Sol browser worker.
Hunt: 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b, round 1.
Verdict: narrow native restoration pass; wider acceptance and publication remain pending.

## Useful result

One fresh actual Prince campaign reached the legal Academy Library shelf-side position **(-6.09, 0.00, 15.00)** through the existing playtest console's ordinary movement/collision path. A natural first imperial visit displayed an identifiable dark-robed, gold-crowned Emperor in approaches and settled surveys. Return was completed and retained **before reload**, restoring ordinary play at the same rounded coordinates.

Save & Game visibly reported **“Autosaved · this browser”**, Prince, Season 1, with the normal statement that refresh resumes this campaign. After closing that menu, final ordinary pre-reload frame243 read player **(-6.09,0,15)**, camera **(-6.09,2.82,19.53)**, yaw0, grounded, pausedfalse, Season01/support0/gifts25. One native Ctrl+R visibly reloaded the application: a character-loading curtain was observed, then the reset console reported Ready/Waiting for renderer. New-renderer frame29 read **the same rounded player position, ordinary camera, yaw and grounded state**, pausedfalse and the same campaign counters. Subsequent `walk right 2` visibly moved to **(-5.48,0,15)**, frame57, confirming ordinary movement after reload.

This is actual same-two-decimal-position native save/reload evidence at an affected legal shelf-side pose, not another nearby-only still or an inferred timed displacement. It is not unrounded serialization identity, complete same-scene composition or full historical H2 identity. Player facing differs after reconstruction, courtiers move, and time advances; those are visible differences, not concealed evidence of identical screenshots. The historical November5 reset remains unattributed because its actual saved bytes were not inspected.

## Why this pose exercises the repair

Before selecting the case, read the actual source trace, candidate diff/report, independent source review and affected world/navigation/restoration interfaces. The real Library shelf centered at(-7,14) has width1.1 and depth3.6, so its right edge is x=-6.45 and its depth includes z15. Ordinary movement uses the .36m Prince body radius. Old restoration independently used .4m padding, rejecting x values between -6.09 and -6.05 beside this shelf even though ordinary movement can legally stand in that clearance band. The observed rounded x=-6.09 is within the old rejection band; the fact it was reached by the normal collision path, rather than an assumed exact unrounded value, establishes ordinary legality here. No teleport, actor/pose/save/clock injection or renderer-state inspection was used.

The repair's source/interface tests independently demonstrate the exact saved-byte mechanism, including other roles and cases. This native hunt does not inspect browser storage or claim those source checks are native proof. Source checks and native observations are separate evidence.

Broken would have been a reload replacing this settled, visibly autosaved legal pose with Library spawn(0,0,15), or loss of ordinary movement after reconstruction. Neither occurred in this one bounded campaign. It is one successful native case, not three independent clean repetitions or comprehensive collision certification.

## Actual native sequence

1. Opened a fresh isolated QA profile and visibly selected Prince. Academy Library started at(0,0,15), frame18, yaw0, camera(0,2.82,19.53), Season01/support0/gifts25, time09:52. Telemetry listed two spatial courtiers and Minister Liu. No fixture save was loaded.
2. Fresh screenshot located the Command field. Native click, Ctrl+A, App.typeCharacters and Return submitted `run left 5`. Immediate screenshots could still show the previous field/state. Later visible result explicitly read “run left for 5s through normal collision checks”; actual movement was(-4.37,15) atframe57 and settled(-4.94,15) atframe72. Duration was not used to infer displacement.
3. Submitted `walk left 3` through the same native sequence. Actual frame101 read(-6.09,0,15), grounded, pausedfalse. Retained settled stills: frame118/time08:58 and frame129/time08:52, camera(-6.09,2.82,19.53), yaw0, same campaign counters. The shelf is immediately to the player's left. No further movement was commanded before the visit or save/reload.
4. The existing first-visit clock progressed naturally. Atframe145, time paused08:45, “The Emperor approaches” was visible with the dark-robed, gold-crowned Emperor fully in the scene, player(-6.09,0,15), camera(-2.33,3.10,17.08), yaw0. A later approach still is frame152. No timing/RNG/encounter change was made.
5. “The Emperor surveys the court” and Return were observed atframe161; retained settled surveys are frame171. Player/camera/yaw/time/counters stayed as above. Crowned head and robed upper body were readable above the panel. This is not a claim about every intermediate camera frame or the historical endcap scene.
6. Clicked the visible “Return to the court” at its observed location. Immediate screenshot still showed the modal, so the click alone was not success. A later retained frame186 confirmed ordinary play, player(-6.09,0,15), camera(-6.09,2.82,19.53), yaw0, grounded, pausedfalse, time08:38, Season01/support0/gifts25.
7. Clicked visible Save & Game. Immediate scene frame202/time08:30 still preceded menu processing. The subsequently retained menu visibly read “Autosaved · this browser,” Prince · Season1, with no storage warning. This is visible save confirmation, not inspection of stored bytes. The pose had been settled sinceframe101 and had not been moved since. Native click on Continue closed the menu; a later actual ordinary frame243/time08:24 retained the same pose/camera/yaw/grounded/counters.
8. Issued one native Ctrl+R. Immediate frame244/time08:23 still showed the old scene. A later native observation visibly showed “Loading your character… Your season clock is paused.” The next retained still already showed the reconstructed scene at08:20 with reset console default “walk forward 2,” Ready and Waiting for renderer. It is named accordingly, not falsely labeled a loading-curtain file.
9. Retained new-renderer frame29/time08:08 read player(-6.09,0,15), camera(-6.09,2.82,19.53), yaw0, grounded, pausedfalse, two spatial courtiers, Season01/support0/gifts25. Minister Liu read(-5.0,-6.5), walking the gallery. The player now faces along the room rather than the pre-reload side-facing animation. Same rounded pose restoration passed despite the nonidentical animation/composition.
10. Fresh screenshot located Command; native click/Ctrl+A/typeCharacters/Return submitted `walk right 2`. Immediate old state was not counted as execution. Retained frame57/time07:53 read “walk right for 2s through normal collision checks,” actual player(-5.48,0,15), camera(-5.48,2.82,19.53), yaw0, grounded, pausedfalse, same campaign counters. The player visibly moved away from the shelf.

All state/coordinates above are visible native telemetry, not DOM geometry, storage, game state, camera branch instrumentation or command-duration arithmetic. Tool actions occasionally returned an unchanged screen until queued native processing completed. No malformed command, interrupted-command/modal focus error or duplicate reload was required in this run.

## Provenance, supported route and checks

- Exact checkout: /workspace/scratch/5e0e15dcbbf8/harem-oct23.
- Exact head: 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b.
- Exact tree: c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b.
- Clean before/after, no source/config/test change, no fetch/ref move/integration/deployment. The already-completed independent source review was read, not substituted for this native result. No new full test/typecheck/build result is claimed by this worker.
- Independently verified131 pinned runtime assets, zero downloads, before fixture launch; retained assets-verify.log. Created only the initially absent, documented ignored .env.local with exact bytes VITE_RUNTIME_ASSET_BASE_URL=local plus newline for offline QA. Local asset delivery does not prove hosted delivery.
- Read AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md Realism, docs/factory/READINESS.md, adopted edge-case-hunter and browser contracts, current c16/sites skill and managed-preview reference, source-trace/worker/review and relevant November4/5 receipts.
- Managed sites-preview returned exact http://127.0.0.1:4173/. Opened exactly that origin with only ?playtest=1. No separate server, proxy or tunnel.
- First CUA invocation was exactly await cua.getState(); then current Sky app/window inventory and native owned terminal were used. Initial desktop had no game, terminal or Chromium window.
- Owned terminal29360131 launched: chromium --user-data-dir=/tmp/harem-nov06-native-pose-0935 --no-first-run --use-gl=angle --use-angle=swiftshader --app=http://127.0.0.1:4173/?playtest=1 . Owned native game31457283 was outer1180x812 at(92,120). This is not a measured CSS viewport.
- Only documented CUA native pixels/AX, App keyboard/coordinate clicks and Sky desktop closure were used. x11 game AX was observation-only. No denied CDP/DevTools/headless/geometry/comment/PR route was retried or replaced with hidden browser storage/state inspection. No unsafe SwiftShader flag, install, renderer security change, account/credential/security permission, paid service, external quota/telemetry, extra agent or publication occurred.
- This was the already-admitted November6 nativeUSD8 reservation inside the coordinator-confirmed combinedUSD30/day estimate, not a new admission or estimate increase. One substantive worker ran at a time. Stopped after the narrow same-pose/reload/movement result was established.

## Pass, failure and pending boundaries

PASS: one natural ordinary Prince Library legal side-shelf saved-pose reload at the same two-decimal player/camera readout; natural readable Emperor approach/survey and same-pose Return before reload; visible successful autosave status; ordinary movement after reload; cleanup and exact clean source identity.

FAILURE: no new failure of this candidate was reproduced in the bounded sample. No historical reset cause is assigned. This does not turn untested cases into passes.

PENDING: full historical H2 endcap(-6.88,9.18) scene identity; repeated independent exact/native save and non-entry-room replay; actual native reduced motion/other roles; actual CSS1440x900/390x844 and physical touch; temporal video and intermediate-frame safety; full controls/menu/focus/Speak/chained-encounter acceptance; hosted assets/delivery/release gates. No publication clearance or H2/#41/#42 closure follows from this sample.

Unlikely/untried under project Realism: multi-user/browser-writer races, account-backed gameplay and cross-account transactions do not apply to this single-player, local-save game. No artificial outage or new fault injection was added.

## Evidence and cleanup

Thirteen native JPEGs are retained in this folder. still-sha256.txt lists their exact hashes. These are local stills and integrity records, not temporal video or durable hosted replay. Observed loading curtain and final native cleanup inventory were tool observations; no separate still file falsely claims to capture either. Game still filenames are chronological and literal; terminal files separate closure initiation from the later actual shell prompt.

The useful pass was reported to the coordinator before cleanup. Closed owned game by native Alt+F4, then observed terminal return to its shell prompt. Terminal Alt+F4 did not close it; a fresh desktop screenshot located its window-manager close button, and a native Sky click closed it. Final native inventory and desktop showed only preexisting Orbit desktop/dock, Xfwm4 and border windows, matching initial state. No unowned profile/save/window was changed. Isolated owned temporary profile was left in /tmp and was not reused as a user save. CUA completion summary sent exactly once after final native outcome.

Managed preview stopped; start and stop exited0, status reported stopped and TCP4173 refused with connect_ex111. Removed only exact matching owned env bytes. Final head/tree unchanged, tracked status empty, git diff --check passed and env absent. cleanup.log and preview-stop.log retain shell checks. No broad release was attempted.

# Independent native Library endcap continuation, November 5, 2026

Author: edge-case-hunter, independent cloud Sol browser worker.
Hunt: staged 0f565c4d33e05ea2d169a19394c1d51ea30e25ea, November 5 continuation.
Verdict: **partial native evidence; H2 complete acceptance remains open**. No product source change and no publication.

## Useful result

A fresh actual Prince campaign reached the visible two-decimal endcap position **(-6.88, 0.00, 9.18)** through the existing playtest console's normal movement/collision path. A natural first imperial visit then showed an identifiable crowned, dark-robed Emperor during approaches and in two separated settled surveys. Retained surveys are frames194 and208, with unchanged player coordinates, camera **(-5.52,3.34,15.18)**, yaw0, paused08:44, Season01, global support0 and gifts25. The player is grounded. This is actual native rendered evidence at the rounded target position, rather than another nearby still or a numeric source test.

This does **not** establish identity with the complete historical failing H2 scene. This fresh run has two spatial courtiers (Minister Chen shown in telemetry and another visible courtier), paused08:44 rather than the prior08:45, and different player facing/composition. The native telemetry is rounded, not an unrounded pose serialization. The pre-encounter ordinary camera **(-6.88,2.23,11.91)** was observed on the live tool image at the target, but the next saved still had already entered approaches. No runtime planner-branch claim follows from these coordinates, and the high encounter camera does not prove the lower-pass candidate was used.

The exact-position run was reloaded before Return was captured. A later fresh run supplied Return/movement evidence at a **nearby** pose, not at the exact target. Exact-pose Return, repeated exact independent campaigns and full H2 scene-identity proof are missing. Do not mark H2 fully fixed from this receipt.

## Reload qualification

In the third run, one native Ctrl+R during exact-position surveys first left the previous scene visible, then visibly re-entered approaches in a changed Library composition with console Ready/Waiting for renderer. The subsequent surveys read player **(0,0,15)** and camera **(4.16,3.10,16.04)**, yaw0, paused08:44, Season01/gifts25. The Emperor remained identifiable there. This is **changed-pose reload evidence, not same-pose persistence**. The cause was not diagnosed and no new-source regression is inferred. No second saved-pose reload was attempted.

Clicking Return then restored ordinary play at(0,0,15), camera(0,2.82,19.53), unpaused08:41. Subsequent native movement was observed at(0.61,0,15.61), ordinary camera(0.61,2.62,19.53), time08:15. These are valid changed-pose return/movement samples, not exact-endcap exit proof.

## Final near-pose exit sample

The fourth fresh Prince run stopped at **(-6.70,0,9.39)**, yaw26, one spatial courtier Scholar Jia. The natural approach was observed live; retained stills had already settled into surveys, so the earlier saved file was renamed `fourth-near-endcap-surveys-earlier.jpg`. Surveys show a readable crowned Emperor and camera **(-5.39,1.94,13.84)**, paused08:44, Season01/support0/gifts25. A foreground shelf/console obscures much of the player; this is not the exact-target proof.

The visible Return button was clicked. The immediate screenshot still showed the modal, so completion was not inferred from the click. A later observation confirmed unpaused ordinary play at the same near pose(-6.70,0,9.39), camera(-4.21,3.19,14.51), yaw26. The retained return still is at08:33, with counters unchanged. A native canvas click and S key input then produced actual **(-6.65,0,9.49)**, camera(-4.16,3.19,14.61), time08:18 and changed player facing. The S invocation used the unsupported option name `duration` instead of documented `durationMs`; therefore it is only a confirmed short key-input/movement observation, **not a verified 1000ms held-key test**. No further movement or reload was requested after this observation.

## Supported console/focus sequence and earlier attempts

All four campaigns started from visible fresh selection in separate owned QA profiles. No save, pose, clock, RNG, encounter state or DOM state was injected. Source was read only to understand the existing console. `walk`/`run` set the usual directional input for a bounded wall-clock interval and feed ordinary collision; `turn` adds yaw. At1–3FPS, capped frame dt and native queued input made actual displacement vary. Coordinates were checked visually instead of inferred from command duration.

Working native console technique: observe the actual field on a fresh screenshot (its Y position changes as the card/telemetry wraps), click that field, press Ctrl+A, use App.typeCharacters for the complete command, press Return, then re-observe. Example fresh field locations included(164,439), then y421/419/457 in other compositions. They are observations, not stable selectors. The x11 AX fallback exposed only an observation-only window, so no unsupported AX action was used. Retained focus generally allowed the next Ctrl+A/type/Return. A natural encounter could steal focus: Return could dismiss the visit rather than submit the intended command. Immediate old field text or an unchanged screenshot was not execution proof.

1. First profile0146: successful run left4, run forward5 and walk left2 produced(-5.70,15),(-5.70,9.30), then(-6.51,9.30). The natural first visit showed a readable Emperor near the shelf, camera(-8.54,1.94,12.70), yaw0. A pending walk left1 crossed the modal boundary; Enter dismissed the visit, and the field ultimately read `walk left 2left 1` with Too many arguments. That final movement was not treated as successful. Later calibration moved to(-7.93,9.30),(-7.32,9.30), then(-6.92,9.30). A turn80 and attempted small correction were confounded by later roster/scene changes and focus; no exact or settled-survey pass is claimed.
2. Second profile0153: an initial white launch recovered after one ordinary Ctrl+R before selection, while preview status remained running. This was launch recovery, not saved-pose proof. A fresh Scholar Song campaign executed run left5, run forward5, turn8, walk left2 and turn-8, reaching actual **(-6.88,0,9.41)**, yaw0. The intended walk forward2 crossed the natural modal boundary; pending Enter dismissed it and text became `turn -8forward 2`, with Supply one finite number. The retained still is ordinary08:15 at(-6.88,0,9.41), camera(-6.88,2.16,11.91), Season01/gifts25. No successful final forward movement or exact encounter is claimed.
3. Third profile0156: run left5 ->(-6.08,15); run forward5 ->(-6.08,9.30); turn8; walk left2 ->(-6.68,9.38); turn-8; walk left0.6 ->(-6.88,9.38); walk forward2 ->**(-6.88,9.18)**. The last command visibly reported normal collision checks. The natural approaches and surveys described above followed without timing changes. Exact stills are frames171/194/208. Reload, Return and movement then followed as qualified above.
4. Fourth profile0200: same initial route but actual walk left2 ended(-6.70,9.39), a partial displacement; turn-8 restored yaw0. A planned correction began with turn26, but the natural first visit paused before any further movement. No correction or exact pose is claimed. Near-pose survey/Return/movement is described above. No fifth attempt was launched.

## Provenance and scope

- Checkout: `/workspace/scratch/5e0e15dcbbf8/harem-oct23`.
- Exact source head: `0f565c4d33e05ea2d169a19394c1d51ea30e25ea`; tree `1515248272c43b3735f007a236876c5d41cd6f0f`, clean before, during and after. No stale transport ref was fetched or checked out.
- Read repository guide, standards, errors, design, Realism, readiness, adopted edge-case-hunter/browser contracts, current Sites skill and managed-preview references. Prior receipts were read from `harem-nov1-accounting/docs/factory/verification/`: `library-lantern-fallback-2026-11-04.md`, `library-lantern-fallback-native-2026-11-04.md`, `library-lantern-fallback-review-2026-11-04.md`, `shelf-camera-clearance-2026-11-03.md` and `staged-native-preview-2026-10-31.md`.
- Previously completed source review/factory tests are provenance, not new native proof. No new build/full test result is claimed. This worker independently ran assets:verify:131 pinned files, zero downloads (`assets-verify.log`), and final git diff --check.
- Native CUA began with cua.getState, then Sky app/window inventory. Only native pixels/AX and owned terminal/headed Chromium were used. Chromium app window was outer1180x812 at(92,120), not a measured CSS viewport. All retained game stills are1180x812 rendered app captures.
- Managed preview: `sites-preview start /workspace/scratch/5e0e15dcbbf8/harem-oct23` returned exact `http://127.0.0.1:4173/`. Owned ignored `.env.local` was initially absent and contained only exact `VITE_RUNTIME_ASSET_BASE_URL=local\n` for documented offline QA after asset verification. Local assets do not prove hosted delivery.
- Owned terminal launch: `chromium --user-data-dir=/tmp/harem-nov05-independent-0146 --no-first-run --use-gl=angle --use-angle=swiftshader --app=http://127.0.0.1:4173/?playtest=1`, then equivalent0153/0156/0200 isolated profiles. Prior profile closed before each subsequent launch. No unsafe SwiftShader flag was used, despite Chromium log suggestions.
- This was the already-reserved USD12 independent job, not an added admission or estimate. No additional substantive worker was launched. No public comment, PR, publish, integration, install, credential/account/security permission, tunnel, telemetry/quota service or denied CDP/DevTools/headless/geometry route was used.

## Still limits and open acceptance

These are local still images plus native tool observations, not temporal video or durable hosted replay. Frame separation demonstrates separate rendered observations, not intermediate-frame safety. A single actual rounded target campaign is not three independent exact-state tries. The lower camera in near samples is not branch instrumentation. No CSS1440x900/390x844, physical touch, native reduced motion/other-role, full controls/menu/focus/activation, Speak/chained-encounter, repeated exact saved-pose/non-entry-room or hosted-delivery pass is claimed. The existing wider release gates remain open. No new head endcap visibility failure was reproduced, but absence of a break in these bounded samples does not waive incomplete acceptance.

## Cleanup

Useful findings were reported to the parent before cleanup notes. All four owned game windows were closed. The terminal returned to its prompt and its retained screenshot records the owned launch. App Alt+F4 did not close the terminal; one native click on its observed window-manager close button did. Final Sky inventory/desktop showed only the preexisting Orbit desktop/dock, Xfwm4 and border windows, with no game or terminal. Initial inventory had no default Chromium window; no unowned Chromium/save/profile was opened or changed. Isolated owned temporary profiles were left in /tmp, not reused as user saves.

Managed preview stopped, status stopped, original start session exited0, and127.0.0.1:4173 refused with connect_ex111. Only the exact matching owned env bytes were removed. Final head/tree unchanged, status empty, git diff --check clean and env absent. `cleanup.log` preserves final shell checks. The final desktop closure was observed through native tools but no separate desktop file was retained. CUA completion summary sent once after final native outcome.

`SHA256SUMS` lists every retained JPG. `evidence-sha256.txt` lists all deliverable/log/manifest hashes except itself. These are integrity records, not independent acceptance review.

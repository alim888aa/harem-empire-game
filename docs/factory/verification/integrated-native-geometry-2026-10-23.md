# Native geometry feasibility, 2026-10-23

Exact isolated candidate 409e62959e4b155f17b6c31ccd766aa2b486e7f7, tree 487f7ad0dc804321ff4365945b0d745567d4c4b8; no source changes. No game release.

Coordinator inspection of native Xfce Display UI found no resolution above the original 1364x1024, scale 1.00, DUMMY0, 60.01 Hz. The coordinator selected scale 0.75 and clicked Apply; subsequent native desktop inventory remained 1364x1024. The retained field screenshot does not independently prove successful application. Scale was restored to 1.00 and Apply disabled, screenshot retained locally. No claim that scaling enlarges CSS viewport.

Native terminal launched same existing QA launcher/profile and offline assets with ordinary Chromium --window-size=390,868. The launched native window instead remained 1180x812 at (92,120). Coordinator performed a physical native Alt+F8, Left held one second, Return attempt did not change inventory dimensions. Refreshed launcher explicitly rendered {"width":1180,"height":812,"dpr":1,"reduced":true}. This is launcher-only CSS measurement, NOT actual game viewport evidence. Neither required 390x844 nor 1440x900 established. No gameplay entered in this geometry slice. No touch, exact-width, video, or release acceptance claimed.

Stopped feasibility exploration early instead of rerouting through denied DevTools, CDP, emulation or shell window automation. Coordinator observed native browser and terminal closed. Server cleanup logged connect_ex111 for4187; fault absent. Retained original and restored Display screenshots both show1364x1024 and scale1.00; operational inventory is coordinator observation. Local images only; text archive excludes images.

Pending exact CSS widths, actual-game verification, touch, video, full controls/focus/reload/repeated/interrupted scenarios, saved nonempty poses/nonentry rooms and hosted delivery remain blocking. Previous narrow reduced-motion evidence is unchanged.

## Independent review

# Independent artifact review, 2026-10-23

Disposition: geometry feasibility only. Neither required 390x844 nor 1440x900 actual-game CSS viewport is established. No release acceptance or publication is supported by this slice.

## Independently corroborated

- Read-only Git inspection of `harem-oct23` returned candidate `409e62959e4b155f17b6c31ccd766aa2b486e7f7`, tree `487f7ad0dc804321ff4365945b0d745567d4c4b8`, and a clean tracked/untracked working status. This corroborates the source records at audit time, not every past operation.
- `display-original.jpg` and `display-restored.jpg` visibly show DUMMY0, resolution 1364x1024, scale 1.00, refresh 60.01 Hz, and disabled Apply. `display-scale075.jpg` visibly shows scale 0.75 with disabled controls; it is not independent evidence that the application succeeded or that desktop geometry stayed unchanged afterward.
- `launcher-after-resize.jpg` is 1180x812 pixels and visibly renders `{ "width": 1180, "height": 812, "dpr": 1, "reduced": true }` (spacing normalized here). The inspected `offline/fixture.html` derives these fields from `innerWidth`, `innerHeight`, `devicePixelRatio`, and the reduced-motion media query. This corroborates launcher CSS geometry only. The image contains the QA launcher, not gameplay, and the measurement does not follow navigation into the game.
- `launch.sh` contains ordinary Chromium `--window-size=390,868`, the existing synthetic profile, and `--force-prefers-reduced-motion`; the saved image shows the requested launch size was not the resulting launcher CSS size.
- The offline bundle SHA-256 matches `offline-bundle.txt`: `9d25114be3c62af7a8d1934f73e06b169d530ea5e773232e6b62bcb758dea579`. No rebuild was run, so this checks recorded-file consistency, not source-to-bundle equivalence anew.
- Server logs record launcher requests, not gameplay requests, during this slice. Cleanup text records localhost port 4187 refusal (`connect_ex 111`) at the cleanup check; the controlled-fault marker is absent at audit time.

## Coordinator observations, not independently proved here

The available resolution dropdown choices; applying 0.75 and subsequent native desktop inventory; window position (92,120); the physical Alt+F8 sequence and unchanged before/after inventory; browser and terminal closure; absence of every alternative automation route; and budget accounting rely on coordinator observations or other evidence. Retained images/scripts/logs do not independently reconstruct those events. Port refusal does not prove browser/terminal closure or perpetual server shutdown.

## Corrections and acceptance boundary

The coordinator updated `RESULT.md` during review. Its final text correctly rejects exact-width and actual-game acceptance, explicitly attributes dropdown inspection, native manipulation, and closure to the coordinator, and qualifies the 0.75 screenshot. These corrections resolve the artifact-versus-observation concern. The restored display image supports the visible restored values, but not an independently remeasured desktop inventory. Budget accounting was not audited; `PROVENANCE.md` describes the initial reservation, not the subsequently reported final charge.

No artifact here supplies actual-game width, touch, video, full controls/focus/reload/repeated/interrupted coverage, nonempty saved poses/nonentry rooms, or hosted delivery. Existing blockers remain. No browser interaction, test execution, code edits, new route, upload, or publication was performed in this review; only this review file was written.

## Preservation and accounting

Text/log/scripts/review archive libfile_fcf0a30027d88191ab269a4fc18aaa41 (4433 bytes), SHA-256 4654d23dea67c717e13f5910f8822e2f1ca07a10ef61e74da694585c094b290f. All four JPEGs remain local-only and are not durable Library evidence. Budget: second slice USD8 conservative estimate recorded, released USD2 unused reservation; October23 totalUSD20 recorded, USD10 unallocated, zeroreserved. Historical days unchanged. No further geometry retries under unchanged capabilities; no source merge, PR or publication. Public V57 remains unchanged. Resume exact isolated409e629 only with supported acceptance route; do not waive existing release gates.

# Bounded gait stop/restart repair — 2026-10-27

## Result
A new reproducible source-level #41 case was found on the already-reviewed gait-hysteresis continuation, not on live V57. After a full-speed Run then a real grounded stop (speed 0, visible clip Idle), an analog/collision-measured walking restart within the Walk/Run deadband wrongly resumed the old Run clip. The predecessor branch `8646b34dee194bd692ccae86314bf8ae1f3e03b8` failed the initial public `animationState()` regression with `'Run' !== 'Walk'`. This is a deterministic animation-state defect; it is not a claim that the human's observed WebGL vibration is fully diagnosed or fixed.

The isolated continuation branch `fix/gait-stop-reset-2026-10-27` now points to remote `a0d52299575d926e76af9690832bd2e4de19ee02`, parent `8646b34dee194bd692ccae86314bf8ae1f3e03b8`, tree `3c4495a48cb4270d451138324ccb4c304145f8f4`. That exact tree matches the tested/reviewed local `f0f0ea0360a85c4d728b588d90890390cf148fac` tree. The commit IDs differ because remote was created through the supported GitHub API; the branch, tree and both changed blobs were read back.

## Scope
`characterModels` now clears remembered Run state at the existing grounded-rest boundary (`speed <= .03`), not while paused or airborne. A noisy near-threshold restart therefore begins in Walk; while moving, existing distinct entry/exit thresholds still prevent frame-to-frame clip thrash. No controller speed, position, collision, camera, asset, campaign RNG, save schema or UI was changed.

Public-interface tests now cover Run → grounded Idle → noisy walking restart for Prince, Scholar and Concubine. Before repair, the initial Prince case failed; after repair, all three career cases pass. The regression uses the existing model loader and `animationState()`, with no private hook. The player model source remains 299 lines, under its 300-line guard.

## Verification
- Coordinator exact local tree: `npm run factory:check` passed (25 factory tests, 550 product tests, zero failures/skips, typecheck, 131 pinned runtime files verified with zero downloads, production build). Existing Vite bundle-size warning remains. `git diff --check` passed.
- Independent sequential GPT-6.1 Sol review: **clear** on the same tree. Reviewer separately ran `tests/princePlayerModel.test.ts` (14/14), `tests/jumpPhysics.test.ts` (3/3) and diff check, and inspected stop, pause, jump, hysteresis and measured-speed caller behavior. No blocking findings. Reviewer did not rerun the aggregate.
- No actual-game browser/WebGL, temporal video, touch or hosted verification was run for this branch. The managed cloud browser route exposes CDP, previously denied by organizational DevTools policy; the failed native route had no new evidence to justify retry. See `cloud-browser-feasibility-2026-10-27.md`.
- No public PR route retry, runtime merge to main or Site publication. The existing public Site remains active/public V57 at https://harem-empire-3d-development.alimar55555.chatgpt.site .

## Pending release state
Main's game source, the original integration candidate `409e62959e4b155f17b6c31ccd766aa2b486e7f7` and live V57 remain unchanged. Do not infer #41 full acceptance. Before integration/publication, an approved exact-head cloud fixture must provide real temporal desktop/mobile WebGL/video and touch controls, 390×844 and 1440×900, focus/reload/pose, walk/run/turn/stop/jump/menu and coordinated Speak/Emperor return paths. Preserve the independent reviewed source chain and recheck the final integrated head rather than deploying to test it.

## Estimate
Oct27 admitted this sequential work as USD12 coordinator/fix/checks, USD3 independent Sol review and USD2 preservation, after USD10 earlier browser-fixture feasibility. USD27 estimated allocated in the Asia/Ulaanbaatar day, not actual metered billing; USD3 remains unallocated. No more work is required or admitted merely to consume that headroom.

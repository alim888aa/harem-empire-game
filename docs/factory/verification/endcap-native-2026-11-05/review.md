Author: review · harem-nov05-native-endcap-evidence
Review: 0f565c4d33e05ea2d169a19394c1d51ea30e25ea · round 1
Verdict: clear
Scope: bounded evidence/accounting record and fresh unchanged-source checks only; H2 acceptance and release remain blocked.

## Useful result

No blocking evidence/claim, arithmetic, archive-integrity or source-check finding. The new draft accurately distinguishes one successful rounded-position native sample from full historical H2 scene identity, exact-position Return, repeated persistence and release clearance. Replace README.md line 24's pending paragraph with the actual review/check text below before finalizing it. No product source change was present to re-review.

## Exact scope and provenance

- Product checkout: /workspace/scratch/5e0e15dcbbf8/harem-oct23.
- Source head: 0f565c4d33e05ea2d169a19394c1d51ea30e25ea.
- Source tree: 1515248272c43b3735f007a236876c5d41cd6f0f.
- Tracked worktree/index clean before and after the fresh aggregate; ignored .env.local absent before and after. No source, dependency or test change, install, browser work, fetch, checkout, integration, publication, PR action or external comment was performed.
- Accounting checkout HEAD: f7cd028358dac2ed247d5f768c04d91b9e210a79; tree ddd4e81be7a3a060dabde72471a98912e9961bdd. Reviewed its actual draft README.md, byte-identical native-receipt.md and still-sha256.txt in docs/factory/verification/endcap-native-2026-11-05/, plus estimated-usage.json and unchanged November4 archive.
- Prior exact-head source review: docs/factory/verification/library-lantern-fallback-review-2026-11-04.md. Read it and the prior summary for context, not as a substitute for today's fresh aggregate.
- Read AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md including Realism, docs/factory/READINESS.md and .agents/skills/review/SKILL.md. Reviewed only affected interfaces needed to assess the new evidence boundaries: PlaytestConsole.tsx and PalaceScene.tsx command, motion and telemetry paths.
- This is the existing admitted USD 5 cloud Sol review under the supplied November5 USD 26 reservation, not an additional admission. Remote admission/main/publication identities in the draft are supplied coordinator provenance, not independently re-read remote state in this local review.

## Independently executed source and integrity checks

- npm run factory:check: exit 0. Selected hygiene passed with unchanged baseline counts {explicitAny:31,alerts:5,consoleLogs:49,unseededRandom:6,longLines:698,oversizedFiles:7}; all 25 factory tests passed,0 failed / 0 cancelled / 0 skipped; application typecheck passed; pretest verified 131 pinned runtime files,0 downloads; all 558 product tests passed,0 failed / 0 cancelled / 0 skipped; production tsc/Vite build and runtime pruning passed.
- Vite transformed 159 modules, built in 3.39s and pruned 129 hosted runtime binaries. Known greater-than-500 kB chunk warning remains: JS 1266.89 kB, gzip 364.24 kB. npm also warned about the existing http-proxy environment option and offered update notices; no upgrade was made. No failure was hidden or treated as a pre-existing pass.
- Full 775-line aggregate log: .scratch/harem-nov5/independent-factory-check.log, SHA256 60a72d4a7e1f4aff4ba1391329f457f7529d0ab2ad4380b091166063aa103b4b.
- git rev-parse HEAD HEAD^{tree}, git status --porcelain=v1, git diff --exit-code, git diff --cached --exit-code and git diff --check: exact product identity above, clean and successful after aggregate. Accounting git diff --check also passed.
- sha256sum -c SHA256SUMS: all 21 retained JPG entries passed; manifest exactly covers all 21 JPG files, 19 unique byte sequences. Three static fresh-selection files share bytes; count is retained files, not21 independent scenes or campaigns.
- sha256sum -c evidence-sha256.txt: receipt.md, assets-verify.log, cleanup.log and SHA256SUMS all passed. This is the native worker's manifest, created before this review's new log/receipt.
- cmp of scratch receipt.md against draft native-receipt.md: byte-identical, SHA256 d37c5b06aeab50d6b1824f1ac9c4f2fe67647a16f7fe09b5e9b87c3d66af12f8. cmp of scratch SHA256SUMS against draft still-sha256.txt: byte-identical.
- Node JSON/arithmetic assertions: unique job IDs, finite nonnegative estimates, recognized statuses and total plus headroom equals limit. Current November5 ledger is 12 recorded + 14 reserved = USD 26, with USD 4 headroom at USD 30. November4 archive is 28 recorded + 0 reserved = USD 28, with USD 2 headroom. No carry-forward or extra job is represented.
- Archive bytes equal git show 183628aaf109b54932768d1e402b7d735f70b7f4:docs/factory/estimated-usage.json and its tracked admission archive. All three SHA256 values equal 64ccaf4574a7120136d5256d3457ec875debeb9ccda801bc9ecd91e2496607ae. No remote fetch or stale-ref checkout was needed.

## Pixel and interface review

Independently viewed actual pixels, not filenames alone:

- third-exact-endcap-entry.jpg: natural approaches panel; rounded player (-6.88,0.00,9.18), grounded, camera (-5.52,3.34,15.18), yaw 0, paused 08:44, Season 01 / support 0 / gifts 25, two spatial courtiers; crowned dark-robed Emperor is readable above the panel.
- third-exact-surveys.jpg and third-exact-surveys-repeated.jpg: surveys panel and visible Return, frames 194/208; same rounded position/camera/counters; Emperor remains identifiable in both separated rendered observations. These do not depict completion of Return or the intervening frames.
- third-reload-changed-pose-surveys.jpg: visibly different composition, Ready console result and player (0,0,15), camera (4.16,3.10,16.04), paused 08:44. This supports changed-pose reload observation only, not a cause, same-pose persistence pass or new-source regression diagnosis.
- fourth-near-endcap-return.jpg: ordinary unpaused play at (-6.70,0,9.39), camera (-4.21,3.19,14.51), yaw 26, 08:33 with counters unchanged. fourth-return-native-movement.jpg: ordinary play at (-6.65,0,9.49), camera (-4.16,3.19,14.61), 08:18 and changed player facing. They support only near-pose Return and observed short movement, not exact-position exit or a verified 1000 ms hold.
- Also viewed fourth-near-endcap-surveys.jpg: readable Emperor, one spatial courtier, near pose and camera (-5.39,1.94,13.84). Foreground shelf/console obscure much of the player, as receipt states.
- Compared actual Nov4 baseline-endcap-failure.jpg: same rounded target but zero spatial courtiers,08:45, different player facing/composition, ordinary camera (-6.88,2.23,11.91) and only a fragment at the right edge. Nov5 does not recreate its complete scene identity.
- Image metadata confirms all 20 retained game JPGs are 1180x812; the separate cleanup-terminal-returned.jpg is 1177x808. Image dimensions/window dimensions are not CSS viewport measurement.
- PalaceScene.tsx:229–234 sets ordinary movement keys and a wall-clock expiry; lines 335–345 uses the same input through capped frame dt and collision steps. Movement distance therefore cannot be inferred from command duration at 1–3 FPS. Telemetry at line 480 explicitly rounds position/camera to two decimals. Neither rounded coordinates nor the high camera reveal the planner pass or unrounded actor state.
- Native sequence, exact action option names, separate profile setup, managed preview lifecycle and native cleanup are the hunter's reported actions, not replayed here. The receipt expressly qualifies the unsupported duration option and unretained observations; no screenshot contradiction was found.

## Outstanding acceptance limits

README.md:18–20,30–32 and native-receipt.md:9–25,49–51 correctly leave these open:

- Full historical H2 scene/actor-transform identity and runtime lower-pass branch evidence; one rounded target encounter is not repeated exact-case independent campaigns.
- Exact-position Return before reload; today's retained exit/movement is nearby or changed-pose only.
- Cause of the changed-pose reload, repeated exact saved-pose and non-entry-room persistence. No source-padding hypothesis was promoted to diagnosis.
- Native reduced motion/other roles; actual CSS 1440x900/390x844; physical touch; temporal video/intermediate-frame safety; full controls/menu/focus/activation; repeated/interrupted Speak and chained encounters; hosted runtime delivery.
- Stills, local asset hashes and source tests establish distinct facts. This review neither reproduces browser actions nor grants browser acceptance. Local artifacts are not durable hosted replay.
- Independent exact-head behavior/browser gates and parent release approval remain required. Do not integrate/publish staged runtime, close H2/#41/#42 or claim same-pose reload passed from these results.

## Replacement for README.md line 24

Independent evidence review is clear for this bounded record at unchanged source head `0f565c4d33e05ea2d169a19394c1d51ea30e25ea`, tree `1515248272c43b3735f007a236876c5d41cd6f0f`. A fresh independent `npm run factory:check` passed selected hygiene, 25 factory tests, typecheck, 131 pinned asset hashes with 0 downloads, 558 product tests and production build/pruning; the known bundle-size warning remains. The reviewer verified all 21 still hashes, the unchanged native receipt, ledger arithmetic and byte-for-byte November4 archive, and inspected the required actual image pixels. This confirms the bounded evidence/claim alignment and fresh source checks, not full historical H2 scene identity, exact-position Return, same-pose persistence, runtime branch or release clearance. Source tests, native stills and integrity hashes remain separate evidence.

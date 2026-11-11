# November 11 independent hosted/native evidence review

Author: independent review, assigned gpt-6.1-sol / medium, existing USD 5 reservation.
Review: product 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b, tree c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b.
Verdict: evidence report is accurate within its expressly attributed limits; hosted/native release gates remain BLOCKED. No new product defect, regression or repair is established. This is not full-code or release approval.

## Scope and identity

Cloud-only independent configuration/source/evidence review and one fresh non-browser aggregate check, after native work finished. No source edit, hosted/native/browser retry, headless run, new job/agent/estimate, ref write, upload or publication. No platform dispatcher, live metrics, local-session/credential inspection, account/security grant, unsafe flag or paid service used. Existing native artifacts were read, not changed.

Initial product HEAD/tree exactly match the assigned candidate; tracked working tree was clean. Accounting checkout starts at admission main 840557643d9c6973ebd4ab4f3850c88a77396bbb / tree e86e3c7bf74f2102bd83108febed267635e21c0b. Product factory.json pins manual cloud v3 7d756086b9938635e0cd11064a4d337eae747326, maxParallel 1, metrics disabled. Its default job effort high is not evidence that either expressly assigned medium role ran high. Role settings are parent-supplied assignment evidence, not independently measured model/billing telemetry.

Read AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md including Realism, RUNTIME_ASSETS.md, .agents/skills/review/SKILL.md, docs/factory/READINESS.md and current orbit:software-engineering guidance. Bounded single-player, fresh profiles, local saves, hosted asset failure and desktop/touch input are realistic cases. No multi-user/server-scale finding or usage/traffic claim is made. Existing unchanged standards debt is not newly certified or repaired.

## Integrity and cleanup checks

All eight entries in native/source-hashes.txt verified against current source. All six original JPG entries in native/native-still-sha256.txt verified. All five entries in native/local-artifact-sha256.txt verified, including the receipt, configuration, source manifest, empty candidate.diff and still manifest. The receipt SHA-256 matches e0f1e41ede19a1c83d16243344b0526fde5895ce1a18793d6d5e380a0f5d0d60. Hash success proves retained bytes match the declared manifests, not every chronology claim or execution configuration.

configuration.json exact hosted bytes hash e54be3d363ee23bdabcbaf7c3d867588b30e4a186eacfcaf543f6817488ac22b and offline bytes hash 93a7bacde3fa301fa2e7064c99b705b10c7daa72b835a366a87048ccbc5eb69b were independently recomputed and match. Hosted setting is the existing public R2 base plus newline; offline setting is local plus newline. The process-setting absence, initially absent env, exact-match replacement/removal procedure and managed-preview lifecycle are native-worker-reported history. Independently checked now: product .env.local is absent and TCP 127.0.0.1:4173 connect_ex returns 111 (refused). No preview/browser was started by this reviewer, and profile contents were not inspected.

Native receipt's initial inventory and exactly-once completion_summary remain hunter-reported; no hash or final desktop alone proves them. Final still supports no owned visible windows at capture, not a complete process audit. No04 artifact exists or is required by a completed-action claim.

## Original pixels actually inspected

Used view_image directly on all six original local JPGs, not thumbnails/contact sheets or text descriptions:

- 01-hosted-landing.jpg: Harem Empire Prince, Scholar and Concubine career cards and portrait art. This is not proof of hosted GLB or material success.
- 02-hosted-character-failed.jpg: “Your character couldn’t load”; “Your season clock is paused”; Retry character and Continue in 2D controls. No HTTP status, denial, browser security warning or transport reason is displayed. It establishes visible character-load failure, not its cause.
- 03-offline-loading.jpg: detailed Scholar avatar, Academy Library furnishings/bookshelves/floor, season 01, support 0, gifts 20, season countdown 09:57. Playtest readout still explicitly says “Waiting for renderer”; default field says walk forward 2. Detailed local rendered art is established, not hosted success, material delivery completeness, measured movement or a named Speak cycle.
- 05-after-control-timeout.jpg: “The 3D palace couldn’t render here”; classic court offer and paused clock, plus Continue in 2D and Open software playtest. It proves the visible render-failure UI, not which error callback ran or why.
- 06-owned-terminal-diagnostics.jpg: visible offline-owned Chromium launch with --use-gl=angle --use-angle=swiftshader and URL http://127.0.0.1:4173/?playtest=1; DBus, software-WebGL deprecation and crashpad scaling-file messages; explicit “GPU process exited unexpectedly: exit_code=512”. This is browser GPU-process failure evidence during the offline run. It does not prove GPU failure caused the earlier hosted character-load failure, or isolate an application regression.
- 07-clean-desktop-0.jpg: desktop/dock, no visible owned browser or terminal window. No game action claim follows from it.

The later offline pool 4 leases / 3 decoded / 8.2 MiB warm bytes, frame 14 / 1 fps, player (0,0,15), paused false and named roster values were reported from a tool-returned image not retained before the CUA reset. This reviewer did NOT inspect those missing pixels or a raw native tool transcript and does NOT independently certify these values. They remain hunter-observed transcript evidence as labeled. They must not be attributed to retained still03. Zero actual named Speak/close/movement cycles and zero certified displacement endpoint remain the correct result. No temporal/intermediate gait proof is supplied by still images.

## Configuration and source findings

- src/palace/runtimeAssetUrl.ts: default R2 base matches native configuration and RUNTIME_ASSETS.md. Model GLB and material paths are resolved at delivery boundaries; other URLs stay unchanged; explicit local leaves paths local. Trailing base slash removal preserves logical path/query identity. Invalid non-HTTP(S), non-local bases throw.
- src/palace/assetPool.ts:46-52: default fetch uses runtimeAssetUrl(url), force-cache and timeout, rejects non-ok responses, then decodes with a base derived from resolved delivery URL. Pool maps/cache keys retain logical IDs. Shared pending downloads, bounded source cache, decoded ownership/cancellation and disposal are distinct from observed hosted success. An HTTP error could be thrown here but no actual HTTP result was captured in the native run.
- src/palace/characterModels.ts:190-199: initial load failures become failed target keys; error detail is not shown by the generic UI. Consequently a visible player failure cannot distinguish fetch, decode or setup causes. No new failure experiment was performed.
- src/palace/world.ts:38-49: texture loading is skipped only without document or with the application's software boolean. Otherwise TextureLoader uses anonymous cross-origin loading and runtimeAssetUrl('/materials/' + path). Source describes intended requests, not evidence all material requests delivered/decoded.
- src/palace/PalaceScene.tsx:94,123-143: software boolean requires renderer=software query. That branch uses SVGRenderer, software materials, and bypasses authored character loading. Actual recorded launch URL had playtest=1 alone. Chromium SwiftShader WebGL is not this application SVG/software branch. The receipt correctly corrects the earlier conflation; material skipping is NOT diagnosed.
- PalaceScene.tsx:124,292,524-526: renderer creation failure and context-loss handler can set render error; a failed @player selects character-load message while !ready and !error. Source possibilities are not runtime attribution. Neither screenshot establishes that a context-loss event occurred. Paused-clock messages preserve failure visibility.
- vite.config.ts has React/Tailwind plugins with no custom delivery override. RUNTIME_ASSETS.md documents 127.0.0.1:4173 as an allowed CORS origin, but source documentation is not an independent current server-side CORS test. No CORS/header/endpoint change was made or requested.
- scripts/runtime-assets.mjs separates checksum verification from downloads; npm pretest uses verify with download false. Production prune removes hosted binaries while retaining metadata, so successful local/offline render and local file hashes do not prove a self-contained production build or hosted load.

Existing tests runtimeAssetUrl.test.ts and runtimeAssetFiles.test.ts exercise public interfaces using mocked/injected transports and disposable files, not live hosted retrieval. Existing aggregate also includes assetPool/lifecycle and render-budget coverage. No separate focused rerun is necessary if the aggregate succeeds; no new test, original-source negative experiment, check suppression or source patch was made.

## Fresh non-browser checks

One npm run factory:check was launched on this exact unchanged candidate; full output and stage outcomes are in independent-checks.log. Final results are appended below after completion. This command is independent shell proof only and cannot override native failures. It runs selected source-debt hygiene, factory tests, TypeScript, local asset preverification, application tests and production build. It is not comprehensive ESLint, dead-code, CSS measurement, interaction or visual certification.

Read-only exact-head GitHub connector responses: get_commit_combined_status returned statuses=[]; fetch_commit_workflow_runs returned workflow_runs=[]. The latter wrapper is first-page, pull-request-triggered runs only. These mean none reported by those endpoints, NOT CI green, all checks passed, complete check-run discovery, branch-protection clearance or remote branch-tip verification. No workflow was triggered/retried and no public comment was posted.

## Failure and coverage boundaries

Passed: retained integrity manifests/config byte hashes, current candidate/admission identity, present env absence/port refusal, direct six-image review, source/configuration accuracy assessment subject to attributed history. Separate offline detailed art was visible.

Failed/blocked observed: primary hosted native campaign never reached detailed character readiness; later separate offline native run displayed render failure; CUA command outcome was uncertain after timeout/reset. Stop was appropriate. No explicit access denial or browser security warning was observed in supplied history; no denied route was retried. Historical Python Cloudflare 1010 was not retried and is not this run's diagnosis.

Unobserved: exact hosted HTTP/access cause; comprehensive hosted GLB/material delivery; hosted pool stats; 131 remote checksums; actual movement endpoint; named Speak/close/unpaused cycles; renderer failure's root cause; unseen tool image's independent pixel proof; initial inventory and completion-summary count independently.

Never run by this role: browser/native/CUA/network campaign or hosted retry, downloads, alternative renderer/unsafe flags, original-source negative experiment, new product tests, full lint, new CI run, CSS target measurement, video capture, physical touch, production deployment or ref/source change. A loopback connect check and authorized GitHub read are not a hosted runtime retry.

Release gates stay open: P0 #41/#42, historical H2 identity/reset attribution, comprehensive careers/reduced motion, actual CSS target sizes, physical touch, temporal/intermediate gait, full controls/focus/chained encounters and comprehensive hosted delivery. Existing public V57 source abbf403ef771569533b802a88691696db4f0ce94/site identity is parent-supplied context, not a new live-site verification. No publication/access/identity change occurred. Durable docs and ledger closeout remain with parent, then documentation-only review under this SAME USD 5 role without another aggregate/native run or admission.

## Completed aggregate result and final identity

PASS, exit 0: selected factory:hygiene ratchet; factory:test 25/25 (zero failed/cancelled/skipped/todo); TypeScript; local runtime verification 131 files, zero downloads; application tests 567/567 (zero failed/cancelled/skipped/todo); production build and prune of 129 hosted binaries. Existing large-chunk warning, npm http-proxy configuration warning and npm update notices were visible. No update/install or warning suppression was performed. These shell successes do not change the hosted/native blocked verdict.

Final product HEAD/tree remain 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b / c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b, with empty tracked working-tree status. No new source/configuration defect requiring a patch was established. Review clears the precision of the blocked report, not any unmet acceptance gate.

## 2026-11-11 documentation-only closeout addendum

Same admitted USD 5 medium role; no second aggregate, browser, hosted/native run or new job/admission. Reviewed the eight prepared text artifacts in accounting docs/factory/verification/hosted-native-blockers-2026-11-11 and current ledger. Documentation accuracy is CLEAR, while all unmet hosted/native release gates remain BLOCKED.

Independently verified four unique ledger IDs, all recorded: USD 12+5+4+3=24, zero reserved, USD 6 unallocated under USD 30, with no carry-forward. November 10 archived bytes hash exactly cd1d5f4c719c9b201d1d93189bb5fa41379008d83412e6b23e13e8cef29c4670. Original receipt/configuration/source/still records match their durable copies byte-for-byte. The original five-entry native local-artifact manifest is correctly retained as native-artifact-sha256.txt; the durable local-artifact-sha256.txt is an expanded eight-entry reference manifest. Every referenced source/still/native/local artifact hash matched before this addendum. Initial review copy matched. A same-name manifest-copy assumption in the first read-only check was corrected to this actual naming contract; no artifact content defect resulted.

All eight evidence files are below 300 lines, directory count is eight, current ledger is 48 lines, and nine closeout files plus the prior admission archive total ten dated changed paths, all under docs/factory. git diff --check passes. Exact product head/tree remain unchanged and clean; no product/runtime delta. README/ledger preserve unknown hosted cause, separate offline GPU-process failure, zero cycles and certified movement endpoints, unretained pool image and initial-inventory/completion-summary attribution, local-versus-hosted distinction, limited CI endpoint results, and all broader gates. Six budget-test passes are parent-reported in this closeout; this reviewer did not rerun them.

Parent must recopy this final review and refresh final review/log hash references in README and expanded local manifest before preserving; do not alter the original native manifest. No new source defect, repair, release clearance or live-public-site verification is implied.

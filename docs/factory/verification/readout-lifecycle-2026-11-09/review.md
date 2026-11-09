# Independent review: readout lifecycle diagnosis, November 9, 2026

Author: independent review, first source/evidence round

## Verdict

Clear for the bounded diagnosis and decision to leave runtime unchanged. This is not native root-cause attribution, an approved repair, or release approval. No source defect demanding a speculative patch was established. The November 8 persistent-looking readout remains unresolved in its native environment. Independent November 9 native evidence and final preservation documentation will be reviewed in a later continuation of this same admitted review role.

Exact product HEAD: `98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b`; tree `c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b`. Accounting admission HEAD: `39b114e5be05515ee85ae073c4adaf17dc4b8ba4`; tree `c5778c56cd963db2076de33bd5239a0888792c5a`. Product has no candidate diff. Existing legal-pose repair remains unchanged. No new hooks, dependencies, schemas, timing, roster, RNG, access, source, refs, production or Site changes were made by this review.

## Independent assessment

Read AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md including Realism, relevant review SKILL.md, factory configuration/readiness and current software-engineering guidance. The adopted manual cloud v3 pin is `7d756086b9938635e0cd11064a4d337eae747326`; static dispatcher settings were not invoked or changed. Work stayed in the existing cloud task, with no new agent, estimate or job.

Directly viewed original November 8 JPEG pixels 42, 43 and 44, not just a report or OCR. All show frame 42, 0 fps, player (-1.24,.14,12.15), camera (-1.24,3.33,17.85) and old five-person roster text; visible countdown changes from 02:25 to 01:39 to 01:15, while character facing changes between 42 and 43. This corroborates retained telemetry and differing scene appearances, not continuous movement, exact action execution time, native GPU throughput, or movement failure. No baseline comparison attributes this observation to the earlier pose repair.

Independent source trace agrees with the diagnosis:

- GameLayout passes changing seasonal progress and people to PalaceScene while its gift-session key and visit state can remain stable.
- `zones.ts` derives deterministic quarter-season rosters without campaign RNG; PalaceScene's roster key changes its existing scene effect.
- Readout is React state outside that effect (`PalaceScene.tsx:107`), so reconstruction retains its previous text. The actual scene owns its frame counters, accumulator, position, camera and roster. `PlaytestConsole` displays the prop without another subscription and calls the current command ref at submit time.
- The effect's disposed guard and cleanup cancel scheduled work, remove inputs, save pose and release scene resources. There is no identified independent obsolete subscription continuing to publish.
- Hidden or budget-skipped callbacks do not publish; eligible callbacks clamp simulation delta and publish after accumulated delta exceeds .1 seconds (`PalaceScene.tsx:303–329,471–488`). Frame text samples the count before the current render increments it. Frame 0 on a new scene and equal counters across different reconstructed scenes are legitimate.
- Native context loss stops the scene with its existing failure UI. No context-loss event is established by the native stills.

There is no new source diff to judge against UI or module-boundary standards. No unnecessary repair/test infrastructure was added to the product.

## Independent scratch experiment

Verified all eight source manifest entries before replay. Exact diagnostic SHA256: `7efbb04c58cc5a3621f5cbae764584e7c93aeeebdafe57d571d927fb7493f929`; 153 lines. Temporarily copied only this artifact to `tests/palace/readoutDiagnostic.test.ts`, executed `node --import tsx --test tests/palace/readoutDiagnostic.test.ts`, checked the materialized bytes still matched, and removed that matching temporary file before aggregate checks. Exit 0, 1/1 passed, no skips, total 55.703 seconds. Full independent output is in `independent-checks.log`.

Reproduced old text immediately after progress .3 reconstruction and after its first 90ms callback, followed by new roster/frame 1 after the next 90ms callback. Repeated reconstruction/help/key input/pause/visibility/delayed callback/command sequences updated readouts. Recovered poses independently match the source report: (.41,0,14.19), (.81,0,13.38), (1.21,0,12.57), (1.62,0,11.76), (2.02,0,10.95), with phase-specific rosters. Keyed remount resets Waiting for renderer then publishes frame 0 with retained final pose.

Claims must stay narrow:

1. More than .1 **simulation** seconds is not a bounded wall-clock freshness guarantee. Native RAF/rendering/React scheduling starvation, rapid replacement or renderer failure could prevent a new publication; this replay does not attribute the November 8 duration.
2. This is JSDOM plus the real software PalaceScene interface with controlled environmental RAF/time/visibility. It is not native browser/WebGL, actual rendering performance, CSS viewport, physical touch, temporal gait or hosted delivery proof.
3. The fresh visit state is Concubine but the inherited component rank is empress. It is not an ordinary-rank campaign or career-access acceptance test.
4. String inequality can reflect changed frame or fps alone. The numeric sequence shows aggregate displacement across these combined scripted sequences, not a separate numeric movement assertion for every key/help/command action. The test does not directly invoke a saved disposed callback, so disposed-callback behavior is source assessment rather than that direct experiment.
5. The passing unchanged-source replay is not red-before/green-after regression coverage and does not disprove a native-only problem.

## Checks, provenance and accounting

The report SHA256 `f42f8c82308288f0e53b7c023a136c39205f40a862b5f0b4f242639512826ad1` and all eight `source-artifact-sha256.txt` entries matched. Empty candidate.diff has standard empty-file SHA256. Original November 8 image SHA256 values independently measured:

- 42: `1f096a86e4aa3b71ac3cde267c1e873336b2765006d5e6b601f5b71b844ceb0f`
- 43: `8ddcb6cd7e80ca26ffea1711d08c6913cd9964392639a6cebbde3810475185cc`
- 44: `aa06f231467ec511a6a0dfb9c1bb7aeeea04b781b8b1dac2efff5a8281744b58`

Ledger checked at admission snapshot: November 9/Asia-Ulaanbaatar, USD30 limit; five reservations 10+5+8+4+3=30; zero unallocated, no duplicate IDs. The existing USD5 review reservation covers this review and its later native/documentation continuation. November 8 archive matches previous current ledger bytes exactly and SHA256 `16d47f534202fe10309d3ae2aea448a4d7733fb6ed0e660e02e32111d0b53d97`; USD28 recorded, zero reserved, USD2 unused with no carry-forward. Parent will record completed status during preservation; this review did not edit the ledger.

Authenticated GitHub read-only lookup on exact product head returned `statuses: []` and `workflow_runs: []`. The workflow wrapper is PR-triggered and first-page only. These mean none reported by those endpoints, not CI green, comprehensive workflow discovery or branch-protection clearance.

Historical source-role focused tests, assets verification and aggregate log remain historical to that role; their hashes were verified, not presented as independent reruns. Historical November 6 negative-source tests were not newly rerun. No native campaign, browser, server/tunnel, unsafe flag, headless/CDP/DevTools/DOM/state/storage injection, telemetry export, installation, purchase, paid service, new account/security grant, public communication, remote ref write or Site action was used. No operation was denied or has uncertain external outcome.

## Fresh aggregate and cleanup

Executed exactly one fresh `npm run factory:check` after removing the diagnostic and confirming a clean product candidate. Exit 0: selected hygiene ratchet passed, factory tests 25/25, application typecheck passed, product tests 567/567, local runtime assets 131 verified without downloads, production build passed (6.17 seconds), and 129 hosted binaries pruned from dist. Existing large-chunk warning and npm http-proxy/update notices were disclosed; no suppression or dependency change was made. The selected hygiene check is not full ESLint/dead-code/folder-limit certification; full ESLint was never run.

Final product and accounting status remain clean, product HEAD/tree unchanged, temporary diagnostic absent, and complete product diff empty. No aggregate rerun is needed for later documentation-only closeout unless product changes. Artifact digests are preserved in `independent-artifact-sha256.txt`; hashes establish evidence identity, not missing native proof.

## Release boundary

Actual public V57/source `abbf403ef771569533b802a88691696db4f0ce94` at the existing game Site is parent-supplied fresh preflight, not independently rechecked in this role. Source diagnostics cannot clear P0 #41/#42, historical H2 identity/reset attribution, comprehensive careers/reduced motion, actual CSS 1440x900/390x844, physical touch, temporal gait/full controls/targeted Speak/chained encounters, hosted delivery or parent release approval. No release or publication is recommended from this bounded source review alone.

## Native-evidence and documentation closeout addendum

Verdict: clear for accurate bounded evidence/documentation preservation, not runtime release. This continuation uses the original USD5 review reservation; no new job, native campaign, aggregate, diagnostic or negative-source test was run.

Directly viewed 14 original November 9 images: 04, 06, 07, 17, 18, 19, 20, 22, 23, 25, 26, 27, 29 and 33. Cross-checked native receipt, full action chronology, capability/cleanup descriptions and original manifests. The actual pixels support natural loading followed by expanded visible cast while telemetry remains old frame217/three courtiers/player(4.46,0,6), then fresh frame52/seven courtiers/player(4.46,0,4.58), continuing frames67 and93. The first sampled replacement frame52 is not the first publication time. Sampled season-clock endpoints do not establish continuous wall-clock duration or temporal motion.

Trial1 has live same-scene before/after positions (0,0,15) → (1.21,0,15) after actual help1 opening/dismissal/input. Trial3 has live replacement-scene positions (4.46,0,4.58) → (3.04,0,4.58) after actual help3 opening/dismissal/input. Trial2 bridges the retained old-scene z6.00 baseline into current replacement-scene z4.58; there is no independently refreshed same-new-scene pre-help numeric baseline. Thus three observed help/input sequences with displacement endpoints are supported, but only two have live same-scene numeric before/after samples. First help is partially occluded; full second/third panels are unobscured. The receipt and prepared README preserve these limits accurately.

One fresh ordinary Scholar campaign and one observed natural quarter-season reconstruction, zero manual reloads, zero targeted Speak. Natural imperial introduction/Return is not targeted Speak or a second roster reconstruction. This native recovery narrows the evidence but does not prove the source mechanism explains November8, establish pose-repair regression, disprove native-only scheduling failure, or justify a runtime patch. Existing broader release gates remain open.

All 33 still hashes, all 42 native evidence entries and the evidence-manifest digest verified. Native receipt identity verified as SHA256 `0191fc2698dbd9407444b98ddcc3ec88d494249a1aa71e8470b68b71b098a2fe`. Repeated byte-identical loading/desktop images are literal repeated captures, not extra motion/cleanup proof; final image33 independently shows desktop without owned game or terminal. Cleanup log reports stopped preview and refused TCP4173. This review independently confirms product remains exact clean HEAD/tree, absent temporary diagnostic and .env.local; it does not rerun a browser or port probe.

Reviewed all eight prepared durable text artifacts under accounting `docs/factory/verification/readout-lifecycle-2026-11-09/`, including README, copied experiment, diagnosis, review, native receipt and three manifests. Six copied artifacts matched local originals byte-for-byte at the prepared snapshot. The local-artifact manifest matched every entry except independent-checks.log after this continuation intentionally appended to it; this is an expected closeout hash change, not corruption. Parent must recopy final review and refresh the independent log/manifest references and README log hash before final preservation. The source and native immutable manifests remain unchanged.

Final ledger independently verified: November9/Asia-Ulaanbaatar USD30 recorded, zero reserved, zero unallocated, unchanged five estimates10+5+8+4+3. November8 archive is still byte-identical to its original current ledger, with unchanged SHA256. Current closeout is one ledger plus eight dated text artifacts (nine files), with the prior admission's yesterday-ledger archive making ten dated changed files overall. No source/runtime delta, new dependency/hook, remote ref or Site action was introduced. Parent's six budget-test result remains parent-executed evidence, not a new run by this reviewer. Accounting diff whitespace check passed.

No claim correction is required in the prepared README/native receipt. Refresh the review-role ledger note from pending continuation wording to completed evidence/documentation review once this addendum is copied. Final hash/reference refresh and remote preservation remain parent-owned. Clear for that documentation-only closeout; overall release remains pending.

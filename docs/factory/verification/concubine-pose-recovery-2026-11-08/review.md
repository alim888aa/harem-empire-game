# Independent unchanged-source and native-evidence review, November 8, 2026

Author: review, existing admitted cloud v3 maintenance role (USD 5).
Review: 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b, November 8 continuation.
Verdict: **clear for the unchanged source repair and the bounded native evidence claims. Overall acceptance/release remains pending behind missing mandatory proof.**
Open source findings: none. No R finding IDs assigned or reused. No source correction or further admission is requested.

## Useful result

The single fresh independent `npm run factory:check` passed on the exact unchanged candidate: 25 factory tests, source typecheck, 131 local pinned runtime hashes with zero downloads, 567 product tests and production build/pruning. No tests failed, skipped or were cancelled.

Original native pixels and the hunter's action chronology support three completed manual Ctrl+R reloads of one ordinary-movement nonspawn pose in one fresh Concubine campaign in legitimately accessible Ladies' Court. All three reconstructed numeric readouts retain the same rounded player/camera/yaw/grounded/paused state and campaign counters. Natural identifiable crowned Emperor approach, settled survey, actual Return and visible Autosaved status preceded the reload series. Still 39 proves ordinary movement after the third reload and the first help dismissal.

The second help opened and was dismissed, but its subsequent movement telemetry remains stale at frame 42. It is not a completed second controls-to-movement recovery. Two untargeted E attempts do not certify Speak. Today's pose does not demonstrate an old-restoration rejection band. These limits are retained, not promoted to successful broader acceptance or speculative source defects.

## Exact identity and scope

- Product checkout: `/workspace/scratch/5e0e15dcbbf8/harem-oct23`.
- HEAD: `98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b`.
- Tree: `c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b`.
- Original comparison source: `0f565c4d33e05ea2d169a19394c1d51ea30e25ea`.
- Accounting admission HEAD: `0f10f2babff35c579c6dc5dc8cc7a8032e306b90`, tree `0cbb5bd3a31ad3e6a5305b1f42be13a5d4a30d17`.
- Adopted factory pin: `alim888aa/agent-org` at `7d756086b9938635e0cd11064a4d337eae747326`.

Both checkouts were clean when independently inspected. Product HEAD/tree and tracked/untracked cleanliness stayed unchanged before and after the aggregate and artifact checks. There is no new product delta from the November 6 reviewed candidate. Scope is its existing five-file repair, affected callers, today's supplied native evidence and admission arithmetic. No product/source/test edit was made.

Read AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md including Realism, `.agents/skills/review/SKILL.md`, factory.json, READINESS.md and current software-engineering guidance. Read the dated November 6 source review/trace and November 7 independent review. Earlier original-source experiment and native cases are historical evidence, not fresh work by this reviewer. Local reporting replaces the review skill's public PR comment under the explicit no-public-write assignment.

## Source assessment

Inspected the repair's complete diff against the original source, both complete new test files, shared navigation, changed scene callers, actual room geometry, role body definitions, career access, scene pose capture and save/autosave paths.

- `src/palace/navigation.ts:7–28` now owns shared player body/bounds safety. It preserves the original ordinary movement's strict .45m room margin and actual career body radius (.36m for Prince, Scholar/minister and Concubine). Standing NPC separation is .76m. `canMove` retains the original distance comparison and escape from an existing moving-courtier overlap. NPC coordinates are read live, not copied.
- `src/palace/PalaceScene.tsx:159–164` restores through `canStand`, replacing restoration-only .50/.40/.80 thresholds that discarded some ordinary-movement-legal poses. Existing floor, orbit and jump restoration/fallback remain. `canMove` is called in the original axis/substep order using the updated live player position. This does not loosen ordinary movement.
- No new hook, dependency, save field/version/schema, RNG/clock rule, actor placement, camera rule or career-access bypass was added. The type-only world import introduces no runtime cycle. Navigation owns shared behavior rather than forwarding it through an unnecessary adapter.
- Tests exercise public navigation and real scene/save interfaces. They cover three body roles, all five room bounds/colliders, shelf-end/side and doorway clearances, live NPC movement, overlap escape, unsafe poses, campaign snapshot equality and camera/jump preservation. The scene tests use JSDOM/SVG, keyboard events, visit output, real autosave/store/parser and reconstructed actors/scenes, not a real native renderer. Concubine's Library fixture is a validated promoted Empress, not a fresh career access claim.
- The aggregate actually includes `tests/palace/*.test.ts`. The scene shrinks from 532 to 528 lines; navigation is 75 lines, new navigation tests 47 and scene tests 205. No new oversized-file violation, check suppression or baseline change was introduced.
- `world.ts`, `zones.ts` and `characterModels.ts` are byte-unchanged from the original source. Whitespace checks pass.

No new source defect is demonstrated in this bounded continuation. The existing repair remains source-clear. Historical H2 native reset attribution still cannot be inferred solely from the source mechanism.

## Fresh executed checks, historical results and never-run stages

Fresh independent execution on the exact candidate:

1. `npm run factory:check`: exit 0, run once from 2026-11-08T01:53:49Z to 01:55:29Z.
   - Selected hygiene passed: explicitAny 31, alerts 5, consoleLogs 49, unseededRandom 6, longLines 695, oversizedFiles 7.
   - Factory tests: 25 passed, 0 failed/skipped/cancelled/todo.
   - `tsc --noEmit -p .`: passed.
   - Pretest asset verification: 131 pinned runtime files verified, 0 downloaded.
   - Product tests: 567 passed, 0 failed/skipped/cancelled/todo.
   - `tsc && vite build && node scripts/runtime-assets.mjs prune-build`: passed; 129 hosted binaries excluded from dist, metadata/attribution retained.
   - Non-failing npm proxy/update notices and Vite large-chunk warning remain visible and unsuppressed.
2. Candidate whitespace check against original source, unchanged geometry/model/zone comparison and product cleanliness: exit 0.
3. Native manifests/digest, file coverage, ledger arithmetic/archive and local cleanup checks: passed as detailed below.
4. Corrected exact-head read-only GitHub calls returned successfully with empty status/workflow lists.

Historical, not rerun: November 6 independent source review and its byte-verified original-source experiment with all five expected-red scene restoration assertions. Those are dated regression evidence, not a fresh failing stage. The prior 118-test focused check and earlier native work were not rerun here. Today's full candidate aggregate includes the complete 567-test suite.

Never run by this reviewer: a new native/browser campaign or base comparison, original-source negative experiment, temporal video, CSS viewport measurement/setter, physical touch, native save-byte inspection, hosted-delivery verification, full lint/dead-code certification, production deployment or public Site audit. No failed product check is relabeled green.

Inspection-only errors: initial GitHub queries used `sha` rather than required `commit_sha` and failed schema validation before execution; corrected read-only calls succeeded. Two preliminary floor-file probes used nonexistent paths and were corrected through the actual world import. These are not aggregate failures or uncertain external actions.

Repository coverage limits: no configured ESLint gate; selected hygiene does not certify full lint/format/folder/dead-code coverage. Committed tsconfig covers source, not tests/scripts. No tooling or suppression was added to hide these limits.

## GitHub reporting is separate from the manual aggregate

Authenticated read-only connector queries for `alim888aa/harem-empire-game`, exact SHA `98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b`, returned:

- `github_get_commit_combined_status`: `{"statuses":[]}`.
- `github_fetch_commit_workflow_runs`: `{"workflow_runs":[]}`.

Interpretation: **none reported by these queries, not CI green**. The workflow wrapper covers pull-request-triggered runs and its first page only. This is not an exhaustive all-event/check-run/branch-protection audit. The exact candidate tracks no `.github` paths and has no local `.github` directory. The independently passed manual aggregate must not be described as reported GitHub CI success.

## Native evidence: original pixels and action provenance

This reviewer issued no browser/CUA actions. The hashed hunter receipt supplies native input/ownership chronology; the original stills were independently opened with local `view_image`. Pixel observations support the bounded outcome, not exact native save bytes or video.

### Entry, natural Emperor encounter, Return and autosave

- Still 02 shows a fresh Concubine in Ladies' Court, frame 3/time 09:59, player `(0,.14,15)`, camera `(0,2.95,19.53)`, yaw 0, grounded, paused false and Season 01/support 0/gifts 20. Fresh-profile/new-campaign provenance is the hunter's chronology, not recoverable from a still alone.
- Still 07 shows an identifiable crowned black-robed Emperor during approaches at frame 27/time 08:45, player `(0,.14,12.15)`, camera `(4.16,3.25,13.19)`, yaw 0, grounded, paused true. Still 10/frame 40 shows the settled survey with actual Return button. Stills establish these endpoints, not all intermediate gait frames.
- Still 12/frame 50/time 08:19 shows actual ordinary returned state at player `(0,.14,12.15)`, camera `(0,3.33,17.85)`, yaw 0, grounded, paused false, with unchanged counters. Return completion is not inferred from the earlier immediate click frame.
- Still 15 visibly states Concubine · Season 1, Autosaved · this browser and Refresh resumes this campaign. It is save-status UI, not saved-payload inspection.
- Still 17/frame 75/time 07:30 is the retained pre-reload result of ordinary collision-based movement: player `(-1.65,.14,12.15)`, camera `(-1.65,3.33,17.85)`, yaw 0, grounded, paused false, counters 01/0/20.

The route uses normal commands/keyboard collision checks, not pose injection. Initial Concubine access legitimately includes Ladies' Court; no Empress promotion or Library fixture is used here. Source `palaceRoomFocals.ts:226` places the central stone walk at top .138m, so y .14 is the normal rounded floor at this pose. This is nonspawn fresh-career persistence, not an obstacle-contact claim, old-rejection-band proof or historical H2 endcap identity.

### Three actual reload completions

The chronology records exactly three native Ctrl+R inputs with no movement/camera commands between still 17 and completion of all three. A single natural encounter/Return and visible autosave precede the series; no new encounter or autosave-menu observation is claimed for each individual reload.

1. Trial 1: original 19 is a blank reconstruction screen; 20 is the literal Loading your character / clock paused curtain. Completed new numeric readout 23/frame 16/time 06:38 shows Zone ladies/0 spatial courtiers and the same rounded player `(-1.65,.14,12.15)`, camera `(-1.65,3.33,17.85)`, yaw 0, grounded, paused false and 01/0/20 counters.
2. Trial 2: 26 is a literal loading curtain. Completed new numeric readout 30/frame 26/time 05:33 has that same rounded pose/camera/yaw/grounded/paused/counters and 0 spatial courtiers. The immediate old-renderer captures are not counted as successful completion.
3. Trial 3: 32 is a literal loading curtain. Still 36/time 04:55 has newly visible roster actors but Waiting for renderer, so it is not completed telemetry. Actual readout 37/frame 18/time 04:11 confirms the same rounded pose/camera/yaw/grounded/paused/counters, now 5 spatial courtiers after ordinary quarter-season reconstruction.

All three completed readouts differ from spawn `(0,15)`. Roster, clock, petals and idle facing change; composition identity is not claimed. The ordinary roster rebuild is not a fourth manual reload. Repeated identical curtain hashes can be separate captures of a static curtain; action provenance and newly reconstructed numeric results, not image uniqueness alone, support the count.

Today's result is **one new Concubine campaign and three manual reloads**. Dated November 6 Prince/one reload plus November 7 Scholar/six reloads make **three independent career campaigns and ten manual reloads across November 6–8**, not three campaigns today or comprehensive career acceptance.

### Help/control recovery, E attempts and native limits

- Still 38/frame 24/time 03:44 shows the first Your first move help opening, partly covered by the expanded playtest console. Still 39/frame 33/time 03:09 proves help dismissed and actual ordinary D movement to player `(-1.44,.14,12.15)`, camera `(-1.50,3.33,17.85)`, yaw 0, grounded, paused false and unchanged counters. This proves movement after the third reload and the first help dismissal.
- The later settled x -1.24 is supported by the hunter's subsequent observation and visible later telemetry; it is not a further persistence trial. Still 41/time 02:34 directly shows the second actual help opening, collapsed console and Got it button. Still 42/time 02:25 shows it dismissed and console reopened, with no conversation.
- Stills 42, 43/time 01:39 and 44/time 01:15 keep the same frame 42, player `(-1.24,.14,12.15)` and camera `(-1.24,3.33,17.85)` telemetry while clock, visible roster and facing change. Thus second post-help numerical displacement remains unconfirmed. Changed facing is not proof of the required movement recovery. Three complete control-recovery trials are not certified.
- The chronology records two untargeted E inputs, with no visible nearby Speak target and no observed conversation. The stills also show Nearby none/no conversation. These are unsuccessful interaction attempts, not successful targeted Speak cases or proof of a Speak defect.
- Native readouts repeatedly show 0–1 fps. Queued actions and telemetry lag are observed in this cloud SwiftShader run. No original-source/base comparison exists. Do not assign lag, stale telemetry or the prior Emperor-doorway player-visibility observation to this repair or call them proven pre-existing defects.

No controls/Speak completion was forced through actor placement, timing, career access, saved state, flags or hidden instrumentation. These remain exact pending limitations. No source change is warranted within this admission solely from these observations.

## Integrity, local cleanup and admission arithmetic

Native directory: `/workspace/scratch/5e0e15dcbbf8/.scratch/harem-nov8/native/`.

- `still-sha256.txt`: all 46 entries pass and cover every literal JPEG exactly.
- `evidence-sha256.txt`: all 56 entries pass and cover every native file except itself and the digest file.
- `manifest-digest.txt`: its one evidence-manifest hash passes.
- Native receipt SHA-256: `2ddb0ba6355669697ff1c7dc8a8156e24035b4186d422cb057f0150df4dab343`.
- Still manifest SHA-256: `40ecf97848ebf6f91b4f2bbc8dc9fdab846145884979bc7b770fc37f994e88f2`.
- Evidence manifest SHA-256: `3ae573f6b37883062e0111b1e719ce2654b4848a0df63cf2157e436ab31b7585`.
- Manifest digest file SHA-256: `3d3c3b06861628e9d6dd2e62c1ce8bfdd8d6151b68d4f731848345bb6fb8b6b7`.

Hash integrity does not itself prove live inputs, exact serialization or missing temporal footage. No image was altered, composed, uploaded or published by this reviewer.

Cleanup logs report owned game/terminal closure, managed preview stopped and exact owned ignored env removed. Original 45 shows the terminal back at its shell; 46 shows desktop/dock without game or terminal. The terminal's software-WebGL deprecation/driver diagnostics remain visible; no unsafe flag is inferred necessary or introduced. The hunter reports its final native inventory and exactly one CUA completion summary; this reviewer did not reissue native inventory or independently inspect tool-call history. Fresh independent checks do confirm `.env.local` absent, TCP 4173 refused (`connect_ex 111`) and exact clean product identity. No existing resource was stopped or modified by this reviewer.

November 8 admission ledger SHA-256: `77991685176fdf69d9745a5b071fd734c768954d7ca704b81dc16d1b126679c1`. It has four existing reservations: native 16 + review 5 + all root/coordinator 4 + preservation 3 = **USD 28 reserved**, 0 recorded, 2 unallocated under the USD 30 ceiling, including P0. This entire review/check/evidence/documentation-closeout role stays within its existing USD 5 conservative reservation. No extra role, agent, job, launch, changed estimate or admission occurred.

The November 7 archive remains byte-identical at SHA-256 `f10df0e9a2df025e2623790d756f27fcff345cde8b644112053b131a2b0ea8da`, with USD 28 recorded and zero reserved; unused headroom does not carry forward. Parent owns the reserved-to-recorded closeout. Recording the four existing estimates would yield 28 recorded/0 reserved/2 unallocated, not permission for more work. These are planning estimates, not actual fees, tokens or metering. Factory pin/maxParallel 1/cloud/metrics-disabled checks pass. No live metrics or local-session/credential collection occurred.

## Mandatory remaining gates and use of this verdict

This narrow source/evidence clearance does not waive:

- Historical H2 exact endcap scene identity and actual historical saved-pose/reset attribution.
- Comprehensive career/reduced-motion behavior; three career samples narrow one gap, not full acceptance.
- Actual CSS 1440x900/390x844; native outer 1180x812 is not CSS measurement.
- Physical touch, temporal video and intermediate-frame movement/gait/control safety.
- Full focus, targeted Speak, repeated control recovery and chained encounters, including the unconfirmed second recovery here.
- Hosted runtime asset delivery/recovery; local hashes and local managed-preview images do not prove hosted delivery.
- Broader P0 #41/#42 acceptance and parent release approval after required relevant gates.

Current supported native documentation/capability receipt exposes stills and `durationMs` keys, but no supported temporal recording or CSS viewport measurement/setter; no installed video-capture skill was reported. This review does not retry denied CDP/DevTools/headless/DOM/browser-state/storage/save/pose-injection routes or invent a capture route. No improvised server, tunnel, global preference, installation or security setup was used.

Existing live Site active/public V57, source `abbf403ef771569533b802a88691696db4f0ce94`, at `https://harem-empire-3d-development.alimar55555.chatgpt.site`, is the parent's verified preflight context, not a fresh Site/public audit by this reviewer. This role did not change source refs, public identity/access, Site content or publication. No purchases, paid services, accounts, credentials/security grants, public comments/PRs or external communications occurred. No action is currently denied, pending or of uncertain outcome. Wider release remains blocked by missing proof, not by a newly demonstrated source defect.

## Original images directly viewed

The following 22 actual original files under the native directory were opened through local `view_image`, not synthetic contact sheets:

- `02-concubine-entry.jpg`
- `07-concubine-crowned-approaches.jpg`
- `10-concubine-settled-surveys.jpg`
- `12-concubine-returned-ordinary.jpg`
- `15-concubine-autosave-status.jpg`
- `17-concubine-pre-reload-readout.jpg`
- `19-concubine-reload1-reconstruction.jpg`
- `20-concubine-reload1-loading-state.jpg`
- `23-concubine-reload1-settled.jpg`
- `26-concubine-reload2-reconstructing.jpg`
- `30-concubine-reload2-actual-readout.jpg`
- `32-concubine-reload3-reconstructing.jpg`
- `36-concubine-third-reload-roster-state.jpg`
- `37-concubine-third-reload-readout.jpg`
- `38-concubine-controls-first-state.jpg`
- `39-concubine-controls-first-recovery-state.jpg`
- `41-concubine-controls-second-observed.jpg`
- `42-concubine-controls-second-recovery-state.jpg`
- `43-concubine-final-movement-state.jpg`
- `44-concubine-final-ordinary.jpg`
- `45-owned-terminal-after-game-close.jpg`
- `46-final-native-desktop-0.jpg`

## Deliverables

- This report: `/workspace/scratch/5e0e15dcbbf8/.scratch/harem-nov8/independent-review.md`.
- Fresh complete aggregate output plus source/artifact/ledger/cleanup checks and exact returned GitHub results: `/workspace/scratch/5e0e15dcbbf8/.scratch/harem-nov8/independent-checks.log`, SHA-256 `5931b26b114f1a1a32a6a43e588e0b23a60428a55ab83b5380de2d1598124b58`.

The parent may prepare durable preservation and ledger closeout, then return it to this same admitted review role. No aggregate/native rerun or new admission is implied by that documentation review. No artifact was publicly posted or uploaded here.

## Documentation closeout addendum, November 8, 2026

Verdict: clear for the prepared documentation/accounting closeout within this same admitted USD 5 review role. No factual correction or new source finding. No additional agent, job, reservation, aggregate rerun, native campaign or external write occurred.

Inspected the prepared `concubine-pose-recovery-2026-11-08` README and eight-file evidence directory. Claims align with the reviewed one Concubine campaign/three reloads, combined three dated career campaigns/ten reloads, ordinary raised-walk nonspawn pose, first completed help recovery, unconfirmed second recovery and targeted Speak, absent reported CI and mandatory remaining release gates. Public Site statements retain the parent's preflight provenance, not a fresh Site audit by this reviewer.

Copied native receipt, capability inspection, still/evidence/digest manifests and initial review byte-match their reviewed originals. All 11 local-artifact entries pass from the execution workspace root; all 46 still, 56 evidence and one digest entries pass. The fresh aggregate log remains unchanged at SHA-256 `5931b26b114f1a1a32a6a43e588e0b23a60428a55ab83b5380de2d1598124b58`. These checks do not add missing browser or temporal proof.

The four ledger entries preserve their admitted IDs, roles and estimates, changing reserved to recorded: 16 + 5 + 4 + 3 = USD 28 recorded, zero reserved and USD 2 unallocated under USD 30. Final inspected ledger SHA-256: `16d47f534202fe10309d3ae2aea448a4d7733fb6ed0e660e02e32111d0b53d97`. November 7 and November 6 archives remain byte-identical at `f10df0e9a2df025e2623790d756f27fcff345cde8b644112053b131a2b0ea8da` and `2820d3bcead58a566ce61d4d377a4ca7759d14505da513ccbb7e9b3debc468fd`. No carry-forward or extra admission. The parent's six budget-test pass is reported, not independently rerun here.

The documentation/ledger delta is nine files, within small-change maximum ten. The new directory has eight direct files, each below 300 lines, with normal EOF/no trailing whitespace. Accounting diff checks pass; no runtime/source paths change. Product remains clean at HEAD `98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b`, tree `c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b`. Before preservation, parent must recopy this amended review and refresh README/local-artifact references as planned. This closes documentation review only, not mandatory release proof or parent approval.

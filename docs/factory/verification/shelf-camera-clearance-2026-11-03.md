# Library shelf camera repair — November 3, 2026

## Result and retained state

**H2 / #42 remains open. No release clearance, runtime main integration or publication.** Two narrow source counterexamples were repaired and independently reviewed, but actual fresh Prince Library shelf visibility still fails. Keep the exact candidate rather than treating source checks as a game acceptance pass.

- Preflight current main: `65550726403c123107cb1ca9fa852ca2e2897eb5`. No open PRs; existing P0 #41/#42 and unfinished staged work were resumed, not duplicated.
- Original staged branch `fix/palace-pending-integrated-2026-10-29`: `5fd4c6431d1f550587371c2c7004da11d856f15b`, tree `695de809cd36a82bf9d420c33251368737232a58`.
- Round 1 remote source: `79abee4e4a4bbf27cdd4bba45a8b51d12d314bc0`, tree `63e392a07651f88f443ec89c803468eeb7803bb8`.
- Final remote staged source: **`ec7e63c253407e54f22f5a35ba081dbe324f557f`**, tree **`0d4d936c4bcf3c7ee5f15492bc9d3d789172f1dc`**. Remote ref readback and final clean checkout verified.
- Existing Site `appgprj_6abddaa19b848191b6c0fa773aa8f0b5` remains active/public **V57**, source `abbf403ef771569533b802a88691696db4f0ce94`. Existing deployment `appgdep_6ad032c454448191ba166663b39693ee` freshly reconfirmed **succeeded** at https://harem-empire-3d-development.alimar55555.chatgpt.site . No new Site version or deployment was attempted.

## Bounded source corrections and checks

1. Real Library shelf at x=-7,z=14 has eastern edge x=-6.45. Legal player x=-6.08 with body radius .36 leaves a .01 gap, but former .04 sightline padding placed its already-expanded body points inside an artificial blocker. Removed that extra sightline padding, retaining camera .22 clearance, bounds/ceiling/actor-distance and real sightline checks. Actual-room public-interface regressions cover all three career bodies and three numeric layouts. All three tests failed before the repair; independent review compared all nine role/layout cases and confirmed false-to-true framing.
2. A separately established actual-Library source case at x=-6.08,z=7 begins beneath a lantern's transition-clearance buffer. A readable endpoint exists, but the prior blocked easing gate held the ordinary pose indefinitely. Existing transition now cuts directly to an already-verified framed endpoint if easing is obstructed; unframed blocked requests still hold. Clear-path easing, cached keys and exit restoration remain. No new API, camera system, hook, state, save, gameplay rule or RNG change.

The second change intentionally permits a discontinuous camera cut, not an interpolated path through architecture. Tests now require every moved endpoint outside expanded .22 blocker boxes and permit blocked travel only as an exact separately framed endpoint cut; ordinary easing and reduced-motion behavior remain tested. The new lantern regression fails the round-1 baseline. An initial incomplete test-update run failed six old absolute-continuity assertions; these were corrected for the explicit cut contract, not declared pre-existing or ignored.

Final `npm run factory:check` passed on local `bd2b6296469ecdb15d598b68b00cdf8c689399e9`, with the **identical final tree**: hygiene, **25 factory tests, 555 product tests, source typecheck, 131 runtime hashes and production build**. Existing large-bundle warning remains. `git diff --check` passed. Independent exact-head round-2 review passed **48 camera tests**, typecheck, hygiene and whitespace; inspected no-framed-result hold and unchanged clear easing in both motion modes. No full ESLint certification exists. No remote CI or PR approval is claimed.

## Native outcomes, not source inference

Both hunts used supported managed `sites-preview` and native Sky headed Chromium with ANGLE SwiftShader, isolated fresh QA profiles, ordinary native input and documented temporary local assets. Each freshly verified all 131 hashes. No denied CDP/DevTools/headless/PR or geometry route was retried. No unsafe flag, install, tunnel, account/security grant, telemetry, paid service or alternate publication was used.

- **Round 1 / 79abee4e:** fresh actual Prince ordinary movement to foreground left Library shelf reached approaches then surveys at paused08:45/Season1/gifts25, no identifiable Emperor. Native Control+R was followed by command-driven intro re-entry and the same unreadable composition; no explicit loading frame was captured in this round. Return and S/D worked narrowly.
- **Round 2 / ec7e63c2:** fresh actual Prince movement plus short ordinary shelf-edge adjustments again reached approaches then surveys at08:45/Season1/gifts25. No identifiable Emperor in approaches; a dark lower actor/robe fragment clipped at the extreme right in surveys is not readable identity. H2 stays blocking.
- Round-2 Control+R explicitly showed loading, then a **different carpet-side composition** with readable player and dark-robed/crowned Emperor in approaches/surveys. **Same-pose failure repetition and precise persisted-pose preservation on this head are unproved.** Return and S/D worked narrowly. No further campaign/reload was run.

The source cases do not establish the historical or current native runtime branch. Do not infer model absence, culling, exact occlusion mechanism, exact world coordinates, regression classification or universal failure. The changed-pose reload success does not cancel the fresh shelf failure. Next diagnosis must distinguish actual Emperor transform/framing and chosen fallback at the real shelf case without inventing saved-pose or runtime-branch evidence.

## Remaining gates and cleanup

H2/#42, exact actual-game CSS1440×900/390×844, temporal WebGL/video, physical touch, complete walk/run/turn/stop/jump/menu and focus/native activation, repeated/interrupted Speak, full Emperor/camera controls, exact nonempty saved-pose/non-entry-room reload matrices, browser reduced motion and hosted delivery remain pending. Numeric endpoint tests are not browser dimensions; native stills do not prove smoothness, temporal cut safety or intermediate frames. No #40–#42 closure or staged runtime release.

Both hunts verified owned game/terminal absent, default Chromium untouched, managed preview stopped with start/stop exit0 and TCP4173 refusal111, matching temporary local-asset env removed, and final exact staged source clean. No durable exact saved-pose snapshot, storage internals, video or hosted screenshots were obtained. Native outer1180×812 is not CSS viewport evidence.

## Admission and durable evidence

Admission `a420e8158b48f6e9efd4d910ea1accb01c790727` reserved **USD27** for Nov3 Asia/Ulaanbaatar: source/coordinator12, same independent reviewer5, same native hunter7, parent/preservation3. The same admitted jobs covered their bounded second rounds, with no added worker, admission or estimate increase. Final **USD27 recorded, USD0 reserved, USD3 unused**, not measured billing. No new admission merely to spend headroom.

Nov2 ledger archived byte-for-byte as `docs/factory/estimated-usage-2026-11-02.json`, SHA256 `5a12782ce238df36e16fa9d3df4ff09ec77f69e79aa7b17283b8e2298ff7d37b`; it retains22 recorded/0 reserved/8 unused. No day reset or carry-forward.

Local evidence is retained in `.scratch/harem-nov3/` outside source, including both review receipts, both native reports/receipts, source before/after/check logs, 13 original round-1 and 17 original round-2 JPEGs and their verified manifests. These hashes establish local integrity, not durable replayable pixels. Full final independent source and native receipts are retained below. Original Nov2 evidence and both round-1 reports remain unchanged.

## Final independent source review receipt

# Independent source review — blocked camera travel

Author: review · independent cloud Sol · 2026-11-03
Review: `ec7e63c253407e54f22f5a35ba081dbe324f557f` · round 2
Tree: `0d4d936c4bcf3c7ee5f15492bc9d3d789172f1dc`
Round-2 baseline: `79abee4e4a4bbf27cdd4bba45a8b51d12d314bc0`
Verdict: **clear for the four-file source continuation; no release clearance**

## Scope and retained history

Reviewed the four-file round-2 delta: `src/palace/camera/conversation.ts` and the clearance, conversation and entry camera tests, together with their existing PalaceCamera/PalaceScene consumers. Repository instructions and the adopted review contract read in round 1 continue to apply. Read the completed native round-1 report `native-hunt.md`: it reproduced H2 fresh and after command-driven reload on 79abee4. Thus the earlier margin repair remains a valid bounded source fix but did not clear the actual-game acceptance failure. The original `independent-source-review.md` receipt remains unchanged beside this report.

The exact requested HEAD/tree and clean tracked/untracked source state were independently confirmed before and after review. No source, configuration, browser, preview, ledger, campaign, PR or external service was changed. Only this separate review report was written.

## Verdict and transition contract

No blocking source finding. The policy change is explicit and internally consistent: when the travel segment is obstructed and the existing planner has independently produced `framed=true`, transition origin and destination are both set to that complete planned pose. Position and target therefore cut directly to the endpoint even at dt=0, rather than interpolating any intermediate camera frame through architecture. When the planned result is unframed, the obstructed path still retains the current pose. Clear paths retain the prior easing and reduced-motion behavior.

The planner is unchanged in round 2, including its .22 endpoint clearance, room bounds, ceiling, minimum actor distance, projected upper-body bounds and sightline checks. Transition obstruction still uses .22 clearance. No API, stored shape, hooks, gameplay timing, movement, campaign RNG, new dependencies or error interfaces change. Cached subject/viewport keys and exit behavior remain unchanged.

This is an intentional relaxation of temporal continuity for a blocked route, not a relaxation of endpoint clearance. The cut can visibly change composition, including on an obstructed layout replan. Source tests cannot establish the subjective smoothness or actual rendering of that cut. A clear endpoint does not prove a safe interpolated route; this implementation avoids displaying that route altogether rather than claiming it is clear.

## Test-contract review

The previous absolute segment-continuity assertions were incompatible with the newly intended cut behavior. The revised tests do not merely remove those assertions: moved endpoints must remain outside expanded blocker boxes, and an intersecting segment is accepted only when the returned position exactly equals the separately planned framed endpoint. Existing clear-entry midpoint interpolation and reduced-motion tests still pass. The new actual-Library lantern regression checks complete planned position/target at the first dt=0 frame in both motion modes, all three numeric layouts, repeated cached frames with a single input read, readable upper-body sightlines/endpoint clearance and restoration of ordinary follow on exit.

The helper skips zero-length movements; static repeated frames therefore rely on the already checked first endpoint rather than independently rechecking the same coordinates each time. This does not permit an intermediate obstructed movement in the exercised cases. Both touched production/test files and the other two modified tests remain below 300 lines. No added wrapper, new module boundary or unnecessary state was found.

## Independently executed evidence

- `node --import tsx --test tests/camera/*.test.ts`: **48 passed, 0 failed**, including the new lantern regression and all saved-entry/layout-change, normal/reduced-motion, caching, fallback and ordinary-camera coverage.
- `npm run typecheck`: **passed**.
- `npm run factory:hygiene`: **passed** with unchanged selected debt counts (31 explicitAny, 5 alerts, 49 consoleLogs, 6 unseededRandom, 698 longLines, 7 oversizedFiles).
- `git diff --check 79abee4e HEAD`: **passed**.
- Independent non-mutating baseline/current comparison loaded the prior conversation module through `git show` and in-memory transpilation. For each of the three Library lantern numeric layouts, in normal and reduced motion, both planners returned the identical clear framed result; the old transition held ordinary while the repaired transition returned the exact complete planned pose at dt=0. **Six comparisons passed.**
- Supplementary no-framed-result check used a collapsed viewport, a current pose and a distinct fallback with a blocker between them. In both normal and reduced motion, the repaired transition retained the current complete pose at dt=0, .225 and settled/repeated frames, with only one input read. Thus the preserved unframed/blocked hold was independently exercised rather than inferred from updated success assertions.
- Supplementary clear-framed comparison confirmed old and current transitions are identical at dt=0, .225 and 1 in both motion modes. **Six comparisons passed.**

Inspected coordinator log `h2-cut-factory-exact.log`: it records 25 factory tests, 555 product tests, typecheck, 131 verified asset hashes and a successful production build. The coordinator attributes that run to local bd2b629 with the identical reviewed tree. I did not independently rerun the full aggregate suite, assets verification or build. The initially incomplete updated path tests were reported by the coordinator as failing six assertions; they are not classified as pre-existing failures or green results. There is no full ESLint script in this repository; selected hygiene is not complete lint/dead-code certification.

## Remaining acceptance and release gates

H2/#42 remains unclosed by this source verdict. This review did not operate a browser or establish the November 2/round-1 exact serialized pose or runtime branch. The new source regression clears the **source-level lantern hold** case only. The native fresh/saved shelf-adjacent failure must be checked again on ec7e63c2, including readable actual player/Emperor presentation and exit/control behavior. Numeric viewports are not measured CSS viewports; no actual 1440x900/390x844, temporal video, touch, complete reload/control/reduced-motion matrix or hosted delivery acceptance is claimed. Other staged release gates remain binding. No main integration, PR approval or publication clearance is granted.

Continued within the original admitted USD5 sequential independent-review job and coordinator-supplied USD27 daily reservation; no new worker/admission or external action. No denied route was retried.

## Final independent native hunt receipt

# Native H2 recheck, round 2 — blocked camera travel

Author: edge-case-hunter · sequential cloud Sol · November 3, 2026
Head: `ec7e63c253407e54f22f5a35ba081dbe324f557f`
Tree: `0d4d936c4bcf3c7ee5f15492bc9d3d789172f1dc`
Verdict: **findings; no release clearance**
Open: **H2 — fresh Library shelf visit still lacks a readable Emperor.**

## Result first

One fresh actual Prince campaign reached the foreground left Library bookcase through ordinary native movement before the natural first visit. At **08:45**, Season **01**, gifts **25**, it progressed from **The Emperor approaches** to **The Emperor surveys the court** while retaining the close shelf/player composition. No Emperor was identifiable in the approaches still. In settled surveys, a dark lower actor/robe fragment was clipped at the extreme right edge, but there was **no readable, identifiable Emperor**. Thus the repaired exact head still fails the fresh shelf-adjacent #42 visibility acceptance case. The partial fragment is not evidence that the actor is absent, nor does it identify the failure mechanism.

The required repeat was attempted once using native Control+R. This time an explicit loading frame appeared, followed by **a different Library composition** with the player near the carpet, no large shelf immediately beside him, and a visible dark-robed/crowned Emperor. Both reloaded approaches and surveys showed the player and Emperor at08:45/Season1/gifts25. **Same-pose failure repetition was not established.** The different framing and subsequent ordinary center-carpet view cannot by themselves establish precise world coordinates, serialization contents, why the pose/composition changed, or a complete saved-pose pass. No further campaign or reload was run.

The earlier fresh failure is still a blocking acceptance finding even though this reload view was readable. The two source fixes may correctly address their tested geometric cases; this report neither proves their actual native branch nor claims they caused the remaining failure. It does not claim November 2 causality, exact historical-pose identity, or H2 cured.

## Exact scope and source

Continued the same original **USD7** native reservation within coordinator-supplied Nov3 Asia/Ulaanbaatar **USD27** total reservation and **USD3** headroom. No new worker/admission or allowance. Original round-1 report and screenshots were not edited. Read the round-2 four-file source delta and `independent-source-review-round2.md`, after the repository/role/Sites instructions and prior authoritative reports read in round1.

This round changes transition policy: an obstructed easing segment cuts to an existing `framed=true` plan; unframed/blocked plans still hold the ordinary pose. The source review and aggregate source-check receipts are attributed to their workers. This hunt freshly checked exact clean HEAD/tree, assets and whitespace; it did not rerun factory tests/typecheck/build or claim browser proof from source-only numeric layouts.

## Supported native fixture and actions

- Fresh `npm run assets:verify`: **131 hashes, 0 downloads**. No existing `.env.local`; temporary ignored exact `VITE_RUNTIME_ASSET_BASE_URL=local` selected documented local development assets. Hosted delivery remains unproved.
- Managed `sites-preview start /workspace/scratch/5e0e15dcbbf8/harem-oct23` returned exact `http://127.0.0.1:4173/`, used verbatim.
- Refreshed CUA documentation for continuation. Documented Sky app inventory/launch opened owned native terminal35651587. Bound App.typeCharacters sent all **138** launch characters, screenshot verified before Return: `chromium --user-data-dir=/tmp/harem-nov03-native-round2 --no-first-run --use-gl=angle --use-angle=swiftshader --app=http://127.0.0.1:4173/`.
- Fresh selection captured, visible Prince card clicked. Immediate observation still selection; subsequent actual Prince Academy Library at09:58, Season1/gifts25. Owned game37748739. Default Chromium25165827 untouched. Native outer1180×812 is not CSS viewport proof.
- Ordinary W4000ms, A1700ms, W6000ms, Shift+A5000ms, Shift+W7000ms reached foreground shelf, but player was centered against its end. Timing differed from round1. Ordinary D650ms/W2000ms, then D300ms/W2500ms adjusted to the right shelf edge. Last previsit still08:56/12s. The broad shelf/player geometry is comparable to H2, not evidence of exact historical coordinates.
- Allowed natural visit and captured approaches, then settled surveys failure as above. No camera drag, injected position, synthetic save, storage introspection or browser geometry change.
- Native Control+R once during surveys. Immediate observation still surveys; later explicit preparing/loading frame; then readable player/Emperor approaches/surveys in a different composition. No same-pose replay claim.
- Clicked visible Return to the court at window-relative589,744. Immediate observation still surveys; later ordinary center-carpet Library08:42 confirmed exit. Ordinary S1200ms/D1200ms changed player facing/position; final ordinary view08:28. This is a bounded return/movement-control sample, not full controls, focus, collision, no-clipping or gait/smoothness evidence.

## Evidence and qualifications

All **17** original native JPEGs are retained beside this report, prefixed `round2-`; `round2-native-SHA256SUMS` passed every entry. The existing 13-file round1 `native-SHA256SUMS` also passed unchanged.

Key screenshots:
- `round2-fresh-selection.jpg` and `round2-native-launch-command.jpg`: fixture provenance.
- `round2-prince-start.jpg`: fresh actual Prince Library.
- `round2-prince-shelf-before-visit.jpg`: initial shelf pose,09:25/41s.
- `round2-prince-shelf-adjusted.jpg`: first ordinary adjustment,09:08/23s.
- `round2-prince-shelf-final-before-visit.jpg`: right shelf edge,08:56/12s.
- `round2-prince-first-visit.jpg`: approaches,08:45, no identifiable Emperor. Filename does not mean loading or surveys.
- `round2-prince-surveys.jpg`: initial blocking surveys view, extreme-right dark fragment.
- `round2-prince-reload-command-observation.jpg`: immediate command still surveys, not loading evidence.
- `round2-prince-reload-reentry.jpg`: explicit preparing/loading frame in changed composition.
- `round2-prince-visit-after-reload.jpg`: approaches with visible player/Emperor.
- `round2-prince-surveys-after-reload.jpg`: readable Emperor/player in changed composition, not same-pose failure repetition.
- `round2-prince-return-observation.jpg`: immediate Return click still surveys, not exit proof.
- `round2-prince-returned-court.jpg`, `round2-prince-controls-observation.jpg`, `round2-prince-final-ordinary-controls.jpg`: ordinary return and changed facing/position.
- `round2-native-terminal-returned.jpg`: command returned to owned terminal prompt.

These are local stills and integrity hashes, not hosted replay, video or continuous motion. No Library upload, durable exact saved-pose snapshot or browser-storage data was produced. No subjective cut smoothness or intermediate-frame safety is proved. No baseline classification or runtime-branch attribution follows from the pixels.

## Remaining gates

H2/#42 stays open. The round-2 source-level lantern cut regression is not general actual-game native clearance. Exact actual-game CSS1440×900/390×844, temporal WebGL/animation/video, physical touch, comprehensive movement/menu/focus/activation, repeated/interrupted Speak and Emperor/camera matrix, exact nonempty persisted pose/non-entry-room reload matrix, browser reduced motion and hosted delivery all remain pending. No #40–#42 closure, runtime integration or release clearance.

## Cleanup

Owned game closed through native Alt+F4; inventory confirmed absence. Native terminal AX/screenshot showed returned shell prompt. Fresh desktop screenshot supported ordinary titlebar close1253,103; terminal closed. Final inventory/screenshot confirmed both owned windows absent and preexisting default Chromium preserved. CUA completion summary sent once after final observed cleanup.

Managed preview stopped; start/stop exited0; status stopped; TCP4173 refused111. Temporary env removed only after exact-content verification. Final exact HEAD/tree unchanged, git status clean, git diff --check passed. No product source/tracked docs changed. No denied route retries, CDP/DevTools/headless, geometry workaround, unsafe flags, browser install, tunnels, quotas, new permissions/accounts/credentials, telemetry, upload, alternate publishing or publication. Terminal suggested unsafe SwiftShader; it was not used.

## Native still integrity manifests

```text
2908b8773dda827bd92dbfa6277b79e0caab8ebf2de6910c875f9d96023a4181  prince-after-reload.jpg
ca4471ff10a8e9f0541f5d214a0ff8ad54f5a2430a1c2e3cd42a21faef0294c0  prince-after-return-controls.jpg
32a4ea00a488a0a246d9188a3fc9578202b9bf662fe20051574424d92f16582a  prince-final-ordinary-controls.jpg
47d324e59bcddbb6786b8d036b26de793ddc0825c06a1fdeead430442aeae3dc  prince-first-visit-observation.jpg
8585efbf63829ee6b71a19768e72a6108c2781b80cab5c388bad59c7bb4bdf91  prince-library-shelf-before-visit.jpg
534f971317e5d2603c4a5ff3421fa73fef22d91f3849d2f7adcea8f2fc9cca25  prince-native-reload-observation.jpg
3309a09fbe0b2bcdd24870aca498c744c39442c7f24cca1a7f35a097609f3d3a  prince-return-observation.jpg
13e40c1101e4c4f7c7f01aaee83fb14a5f92e5b49e21461c82e885f5563b018a  prince-returned-court.jpg
2241385c0c76acf0f632c200a78225d05fe627dcc1d6edb278ab0319603f6f00  prince-start.jpg
f49df708d0dc0bc2fbf775252d4496d68f0f51fb6d61a665bdc81088a238c87a  prince-surveys-after-reload.jpg
101052371914519934d771c2f48e67493b17b07ff2addce2d42373dcd9232d18  prince-surveys.jpg
dbc38178a7681c88551eb5e11f0cfa9d44b7ed0abfd5806c2dc0aa520b6535d3  prince-visit-approach.jpg
99cd2bb80e9dd35d45b98f726617e8e464991813be4f9b45161f797bf2167739  native-terminal-returned.jpg
03a7cb4b7a5e0fc5eb69966137916d4b26c8bcdc1aac76fed527f6282d0873a4  round2-fresh-selection.jpg
b8998c3bfff01a3e89018aab9b7db0d7ad22f0b09c2632621d4c693f905d8cb3  round2-native-launch-command.jpg
b193e9353b3b3a2b47d165820c285c701a43b49e62cf66cacc952b6786a919b4  round2-native-terminal-returned.jpg
3c82b686b356c68bc07499d8d4dd6641b310268d1a1b27baef53ea895c44d1ab  round2-prince-controls-observation.jpg
ecbc87cb8c88befb121558e5b3d9a489bf33385084b0cf6abdebd7c50cdc1302  round2-prince-final-ordinary-controls.jpg
c0094e13057e1331d293a9e6b9e2c387cf0df97054f973cf73a5f79d714cfbd9  round2-prince-first-visit.jpg
b61403698d1184c2e6420cb44a53f0a65edbeaf67eaa0aac970e8e7c1b8d242e  round2-prince-reload-command-observation.jpg
82aa956f7a91b19650c8abad7e73f4d89dfce292dac1b534e30567ecbc3d2fdf  round2-prince-reload-reentry.jpg
bc359b975a4dc9410da0d27b1ca5679298c44f6fc10d9312be3127479fafc3db  round2-prince-return-observation.jpg
1606fb720f110a784996a7ffa18a112b2215bd516a2359f6719b7b4e11dd8d00  round2-prince-returned-court.jpg
15353ebf203d74ca8e9af771e3d0ea74de7f2b194217f99b1351e9de5b2be486  round2-prince-shelf-adjusted.jpg
232d60d324ccd5a5fc9329cd16eaca1c4eae483732fe53b651ac123fb33d70e8  round2-prince-shelf-before-visit.jpg
f54eafa09e61562900bff6c8862345232f86a72941044c2dca1a0f5b62387ef0  round2-prince-shelf-final-before-visit.jpg
a56f34d2fe15a440a67cb26cc835a0b4a8640be32c4512d1561d9f4c496634d1  round2-prince-start.jpg
3bbabedda1050d04eb958420117173232fdf78f44ed427daff5628bc945fb95b  round2-prince-surveys-after-reload.jpg
d58fb54ca14001b27b38c1358934946cf8e1d8bc9f7c26061025ea96b3a21152  round2-prince-surveys.jpg
d9bdee4eb89e542f165fdfd9f59ec0d3bd06ad686a7cd8b67e93638b18436e1e  round2-prince-visit-after-reload.jpg
```

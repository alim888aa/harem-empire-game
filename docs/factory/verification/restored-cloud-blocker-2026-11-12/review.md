# Independent review: November 12 restored-cloud continuation

Author: review, existing USD5 role; cloud only.
Review: 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b
Tree: c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b
Verdict: BLOCKED for runtime/release; source/configuration integrity and fresh aggregate checks pass.

## Scope and identity

Reviewed the unchanged exact candidate, native receipt/configuration and artifact/source hashes, delivery boundaries, explicit local/hosted mode, renderer selection, manifest verification and production pruning. Read AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md including Realism, RUNTIME_ASSETS.md, the pinned review skill and current software-engineering/Cloudflare guidance. No source patch or original-version negative experiment was requested or performed. No PR comment, source/ref/accounting/publication or production change was made.

Independent read-only Git showed clean status and the exact head/tree before and after the aggregate. Factory configuration retains cloud parent-manual execution, maxParallel1, Sol roles, upstream pin7d756086b9938635e0cd11064a4d337eae747326, disabled live metrics and verification.ready=false. No dispatcher, live metrics, session, credential or unrelated project content was read or executed. No new worker/job/estimate was created.

Authoritative accounting main663abb7ac708efe63ccad094ec9a4500f3f26957/treea6a6f0def2ce0de488104bfc2cadec6d7ad4b73d is parent-supplied context, not independently refreshed here. The stale local accounting checkout was not changed or checked out. Existing daily accounting remains parent-owned: USD10 earlier recorded, USD18 reserved (8 native/5 review/3 coordination/2 preservation), USD28 combined, USD2 headroom, USD30 Asia/Ulaanbaatar cap. This report does not create or reset accounting.

## Passed: independent observations

- All three native artifact-sha256 entries match actual files. Native receipt SHA256: 26b85d00052e94f6e48b7c64b664d479cc35668502a9b0ba8a2805747a070680. Configuration SHA256: 863a88a85c6b376240f42a416329ccaed2e026c149051591255ac812872d0d5e. Source-hashes SHA256: d045303aefbc9533aa7f7f240fcb70b0cb7a785d59edc41882016678bec2b004. All eight recorded source hashes match the present candidate.
- Configuration's literal hosted setting is exactly80 bytes and SHA256 e54be3d363ee23bdabcbaf7c3d867588b30e4a186eacfcaf543f6817488ac22b. Current .env.local is absent. An independent local socket probe returned connect_ex111 for127.0.0.1:4173 (refused).
- Exactly one fresh npm run factory:check executed through supported require_escalated permission review. Its necessary generated test/build writes and ignored log were allowed. Exit0. No required check write was denied or retried.
- Hygiene ratchet passed with explicitAny31, alerts5, consoleLogs49, unseededRandom6, longLines695, oversizedFiles7. These are measured source-debt counts, not a full lint/dead-code certification.
- Factory tests25/25; typecheck passed; pretest verified131 local runtime files with0 downloads; repository tests567/567. Both suites report0 failed/cancelled/skipped/todo.
- Production tsc/Vite build passed,159 modules transformed. The build reported129 hosted binary exclusions. Independent manifest inspection confirmed all129 absent from dist, both metadata files present. Local production output still requires hosted delivery.
- Warnings retained: npm unknown http-proxy environment configuration; Vite chunk above500kB, JS1266.79kB/gzip364.24kB. Neither was suppressed or treated as a failed stage. No historical/base attribution was inferred through a negative experiment.

Full aggregate output: independent-checks.log
SHA256: 7d67c27d36add58e0eb286a4551eea771c0a71e8fe4bd29e964a2f472967359c

## Source/configuration conclusions

src/palace/runtimeAssetUrl.ts selects the public R2 base by default, applies the VITE_RUNTIME_ASSET_BASE_URL build-time override, rewrites model GLB/material paths, preserves logical identities/query suffixes and leaves explicit base=local paths local. src/palace/assetPool.ts uses that resolver at fetch and GLTF parse-base boundaries; src/palace/world.ts uses it for anonymous cross-origin material textures. These are source conditions, not observed server responses.

src/palace/PalaceScene.tsx chooses SVG only for the renderer=software query. The native receipt's ?playtest=1 target contains no such query; SwiftShader is a WebGL implementation, not this SVG/software path. No renderer actually initialized in today's native run, so no material-skipping or visual correctness conclusion follows.

scripts/runtime-assets.mjs verify checks manifest byte counts/SHA256 against local copies without downloading; prune-build removes the129 binary copies while preserving metadata. Fresh tests and the local asset verification demonstrate candidate/local readiness, not actual remote-object hashes, CORS, HTTP delivery, native decoding or offline game operation.

## Failed/blocked: exact native evidence and attribution

R1: Required actual game/browser proof remains unmet. Native hunter's receipt records one permission-reviewed Chromium launch executed and exited133 before game loading:
chromium --user-data-dir=/tmp/harem-nov12-restored-hosted-20261112a --no-first-run --use-gl=angle --use-angle=swiftshader --app='http://127.0.0.1:4173/?playtest=1'

Recorded fatal: process_singleton_posix.cc:297 socket() failed: Operation not permitted(1); crashpad scoped_ptrace_attach.cc:27 ptrace: Operation not permitted(1). The script also printed an unexpected-operator warning. This is a process/socket environment failure before browser/game proof, not an established HTTP/CORS/asset/material cause. The tool executed the scoped launch; an OS operation denial inside that process is distinct from a denied tool admission.

Hunter reports inventory with Chromium available/no prior windows, managed-preview start success, the no-window result after failed launch, exactly one CUA completion_summary, preview stop and exact-owned-env removal. I verified receipt/configuration hashes and the present absent-env/refused-port/clean-source state; I did not independently observe that native inventory, launch, no-window state or summary invocation. Textual receipts are not screenshots. Hunter retained0 screenshots because no native game window existed. Completed named Speak/close/movement cycles:0/3.

No browser launch retry, alternate tool/directory launcher, unsafe flag, CUA terminal, headless/CDP/DevTools/DOM/state/storage route, tunnel, improvised server/capture, security change, install, hosted object request or asset download occurred in this review. No permission denial was bypassed.

## Blocked optional existing-service observation

Supported Cloudflare whoami returned: This app connection requires reauthentication. Reconnect the app and try again. Spec search also returned the same UNAUTHORIZED/reauthentication error. No Cloudflare execute/API call, public object request, account/credential discovery, setup/reconnect, grant or configuration change followed. No account ID/auth fields are included here. This optional observation stopped; current target-bucket identity, managed public hostname and CORS allowance for127.0.0.1:4173/the Harem origin remain unverified. RUNTIME_ASSETS.md records intended CORS, not a current server test. Even valid CORS would not prove actual hosted delivery.

## Unobserved, historical and release gates

Today's run did not observe hosted detailed GLB/material scene, decoded/warm pool bytes, renderer output, named dialog, close/unpaused baseline, movement, offline browser operation, desktop/touch pixels, or intermediate temporal gait. No fresh remote-main/PR/status/Actions/Site query was made by this reviewer. Parent's existing active/public V57 at https://harem-empire-3d-development.alimar55555.chatgpt.site/sourceabbf403ef771569533b802a88691696db4f0ce94 remains parent-supplied and was not changed. No exact-head remote CI green claim is made; repository checks above are actual fresh local aggregate checks, not prior remote pure admission checks.

November11 hosted character-loading failure (HTTP/access cause unknown), separate offline GPU exit512 and earlier historical scripted Cloudflare1010 remain historical, distinct evidence. Today's pre-browser socket denial neither reproduces nor diagnoses them. H2 identity/reset attribution is unresolved historical work.

Open gates remain P0#41/#42, historical H2 attribution, comprehensive careers/reduced motion, CSS1440x900/390x844, physical touch, temporal/intermediate gait, full controls/focus/chained encounters, comprehensive hosted delivery, and parent release approval. The fresh green aggregate and integrity review do not waive these gates. No release approval.

## Closeout boundary

This existing USD5 review role may return for documentation-only closeout of parent's final ledger/docs. No second aggregate/native run or new admission is implied. Final documentation/main/ledger verification remains to be supplied for that separate closeout step.

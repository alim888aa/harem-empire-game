# November 19 pending palace recovery: frozen source, execution blocked

## Outcome and exact identity

Recovered candidate local commit `cb49521ebfa18c4a0c4aa9b116169190b3edad3b`, tree `ed0ff329927427597596b32502ffb5dd70e65435`.
Real ordered parents: admitted current main `0c00332c6e1e580abf86080bfb3bac7bb9462892`, then existing pending `725a0fa51f58af28dadf216ea696216f286cda41`.
Authenticated merge base: `d58563c748d1b703f8766bb1626d130d0a82daa8`, tree `df336eec55c8f83da6f0e7fe598658ca7bf9e749`.

Source reconciliation is complete and frozen. Final aggregate verification is incomplete after an automated unsafe-action denial. This candidate is not approved for main integration or release. Nothing was pushed or published. No browser was launched.

## Authenticated inputs and genuine merge

Read current AGENTS, CODING_STANDARDS, ERRORS, DESIGN, CONTEXT including Realism, worker contract and factory READINESS. Read authenticated pending reconciliation implementation/review/receipt, simulator receipt context and relevant original issues #35/#40/#41/#42 plus available #40/#42 comments. Historical 573/25/119 results were not reused as fresh results.

Authenticated GitHub Git-data full recursive trees supplied every path/mode/type/blob identity for main, pending and base. Every recursive tree object, every materialized blob size and Git SHA1, each working-file mode and all three raw commit identities were independently reconstructed and verified. Blob bytes were reused from existing original Git or previously authenticated inputs where matching, and nine missing blobs fetched via the authenticated connector. No direct GitHub transport or credentials were used.

Main admission has 721 entries/644 blobs, pending 691 entries/617 blobs, base 683 entries/612 blobs. Admission includes one new ledger blob beyond its pre-admission parent. `input/*Tree.json`, exact `input/blobs/*`, three raw commit files and source snapshots are preserved.

GitHub compare authenticated the actual merge-base result, not a guessed old base. Its complete 17-commit main-side parent graph back to base was separately reconstructed and raw-SHA verified (`proof/ancestry.txt`, `input/ancestry-commits/`). Pending directly lists base as first parent and original98 as second. Older ancestry below base/original98 remains incomplete and is not fabricated. The isolated Git repository declares shallow boundaries explicitly.

Actual operation: `git merge-tree --write-tree --merge-base=d58563c748d1b703f8766bb1626d130d0a82daa8 0c00332c6e1e580abf86080bfb3bac7bb9462892 725a0fa51f58af28dadf216ea696216f286cda41`.
Exit0, tree `ed0ff329927427597596b32502ffb5dd70e65435`, no conflict or warning. Zero handwritten product conflict resolutions, no product behavior decision or new source implementation.

## Precise preservation

`proof/merge-path-ownership.json` records all 652 union blob paths with complete base/main/pending/candidate identities and ownership. Candidate has 649 blobs. Main changed 46 raw paths, pending 24 raw paths (22 rename-aware paths), with only architecture README shared.

Every pending-only changed path equals pending bytes/mode/type/blob exactly. Every path not changed by pending equals current main exactly, including deletions. The single shared README is precisely pending README minus the completed ten-export backlog bullet removed on current main. The pending camera-owner row survives; no stale backlog resurrection.

Main-to-candidate delta is exactly the prior pending 22 rename-aware source/test/package/doc paths: GLOSSARY; architecture README; package and lock; CourtDialog, EmperorIntro, GameLayout; PalaceScene; old conversationCamera relocated to camera/conversation plus camera/index; characterModels, navigation, touchGestures, theme skin; camera clearance/conversation/entry tests; CourtDialog, palace navigation/poseRestore, player model and touch tests. Raw add/delete representation is 24 paths. See exact raw and binary-safe Git patches in `proof/`.

All current main docs/factory accounting, evidence archives and receipts survive unchanged. November18 archive remains Git blob `193e608af5a28e01482036c6d1140633bbff8653`, SHA256 `3d31fa82508ca56c2199ddd97cec463da7d6b9a6e6f1def0af1276fbda07de00`.

All eight current-main lib cleanup modules survive exactly: campaignBalance, courtGraph, courtIntrigue, crossCharacterEffects, factionSystem, helpers, influenceFear, influenceGating. CharacterResponse stays deleted. palace.css and palaceCraft cleanup bytes are exact current main. No save/schema, balance, RNG, actor or feature change is introduced by reconciliation.

Fresh AST caller analysis parses 192 tracked executable files, excluding prohibited old_code inspection. All ten deleted-export names and CharacterResponse have zero identifier references and zero actual target-string references. The preserved `lastCharacterResponse` save-schema string is one benign substring, not a component reference. Namespace imports36, wildcard exports0, dynamic call/import sites15 and global accesses56 are explicitly inventoried in `proof/caller-inventory.json`; named imports/callers are retained and logged. Pending camera namespace consumers do not make removed exports live. No target globals or computed target lookup exists.

The first dedicated AST helper stopped on the benign `lastCharacterResponse` substring because its initial target-string check was too broad. The helper was corrected to distinguish that exact unchanged schema field, then completed its source-only audit. It did not reveal a product caller or require a schema/source edit; initial helper failure is not represented as an execution-suite pass.

No new hooks, any, wrappers, dependencies, test hooks, source-regex tests, baseline adjustments or unrelated cleanup. Existing pending jsdom/lock and tests are unchanged reviewed inputs. No existing oversized source file grows beyond the exact already-reviewed pending body; new handwritten proof helpers are below300 lines. Selected hygiene is not full ESLint or global dead-code certification.

## Fresh execution actually observed

Environment: Node24.22.3, npm11.9.0. Both pending and candidate lockfiles match144 installed dependency versions;88 optional packages absent, zero mandatory missing/wrong. All131 runtime assets independently checked for length/SHA256. Installed dependencies and assets copied from existing original inputs; no install, asset fetch or download requested or needed.

1. Own old-pending725 production `npm run build`: PASS, exit0 (`proof/pending-build.log`, `.exit`). TypeScript, Vite and prune129 completed. Baseline production inventory:285files,10directories,23,851,003file bytes. Exact paths/types/modes/lengths/SHA256 and HTML refs are retained in `pending-payload.tsv` and `pending-html-refs.txt`. Existing >500kB main-chunk warning remains.
2. One frozen candidate `npm run factory:check` launched. Partial raw log confirms selected hygiene counters explicitAny28/alerts5/consoleLogs49/unseededRandom6/longLines692/oversizedFiles7,25factory tests passed/0failed, source typecheck passed and131runtime pins verified/0downloaded. Application tests began but have no terminal count/exit. **No complete aggregate PASS.**
3. Polling that running session was denied by automated unsafe-action review for alleged npm-registry download/execution risk. Exact action/target/full reason and read-only uncertain outcome are retained in `proof/denial.txt`. Parent was notified promptly. No poll/retry, alternative flags/path/runner or indirect execution workaround was attempted.
4. Subsequent read-only inspection found no matching aggregate/npm/Vite process, absent `factory-check.exit`, partial45226byte log and no candidate `dist`. The process completion is uncertain/incomplete, not a reproduced product failure or a successful aggregate.
5. Independently required existing camera/navigation/pose/dialog/model/touch/simulator interface subset was not run after denial, to avoid an overlapping alternate execution route. No fresh subset count is claimed.
6. Candidate production build did not complete. Full old-pending versus recovered inventory/direct-byte/HTML comparison and attribution of every generated difference are **incomplete**. No byte identity or whitelist/normalization is claimed. Current preserved dead UI/CSS may legitimately affect generated CSS, but no unobserved final difference is asserted.
7. Source-only preservation/caller/ancestry proofs and `git diff --check 0c00332c HEAD` PASS. Candidate tracked working tree clean. Exact source bytes/modes were checked after runtime asset overlay and source remains frozen. Original harem-oct23 and prior Nov18 snapshots were not mutated.

Parent subsequently explicitly ordered all aggregate/build/test/subset/npm/npx execution and session42454 polling stopped. No such execution followed. The denial is an unresolved execution/authorization blocker. Its statement does not imply that the source proof requested a download. Existing dependency verification shows compatible input reuse, but is not treated as permission to retry the denied aggregate. Any resumed aggregate or potentially overlapping execution requires parent resolution/materially relevant authorization. This job did not ask the user or consume another admission.

## Gates, scope and artifacts

Independent exact-head source/execution/payload review remains pending. Actual browser/hosted delivery, repeated/reloaded replay, controls/focus/chained encounters, intermediate gait, CSS390x844/1440x900, physical touch, roles/reduced-motion, H2 attribution, P0#41/#42 and parent release approval remain OPEN. Node/jsdom numerical tests never substitute for WebGL/native focus/layout/temporal proof. No browser route, flags, CDP/DevTools/CUA/headless/native launcher, DOM/storage/tunnel or Cloudflare reauthentication attempted.

Public Site remains outside this worker's mutation scope; last supplied identity is active/publicV57/sourceabbf403ef771569533b802a88691696db4f0ce94. This worker did not independently browse its runtime or change it. Original pending98/latest pending725/main refs remain unmodified by this worker. No issues/PRs/comments/closures, purchases, paid services, accounts, credential/security grants, telemetry/live metrics/session reads or alternate publication.

Source work used its existing USD8 planning reservation only, manual v3 pin7d756086b9938635e0cd11064a4d337eae747326/maxParallel1. No agents spawned, no new admission or ledger mutation. Estimates are not measured billing.

The Nov17 optional `manifest-and-counters.json` remains absent/incomplete. It was not retried, relocated or reconstructed; no combined results JSON was created. These dedicated merge/caller/payload records, raw logs and human source report have distinct authorized purposes. Vanished historical raw artifacts were not recreated as originals.

Owned artifacts: `.scratch/harem-nov19-pending-recovery/`.
- `repo/`: isolated frozen Git repository and candidate working source, reused dependencies/assets.
- `main/`, `base/`, `pending/`: exact complete authenticated source snapshots; pending additionally holds own baseline build and reused inputs.
- `input/`: authenticated connector responses, full trees, exact blob/raw commit bytes, bounded ancestry.
- `proof/`: dedicated merge/path ownership, retained caller, source SHA manifests, raw source deltas, baseline payload/HTML, partial aggregate log, exact denial and observed exits.
- `candidate-source.tar`: exact Git archive of frozen candidate tree, no installed dependencies or ignored hosted assets.
- `EVIDENCE-SHA256SUMS.txt`: hashes existing input/proof/report/tar files only; source snapshot hashes have their own four manifests. No missing artifact is represented as present.

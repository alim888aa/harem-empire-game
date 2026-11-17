# November 17: bounded unused-selector hygiene, issue #28 partial only

## Frozen source

- Local head: `ec75226f0c754fdec14407048cf7168f1438e645`.
- Tree: `f71d404346b0569b2752c53c883996b419f4597a`.
- Sole parent: exact admitted main `b55ef2e899460e96a3de2d155693cacc9613266f`.
- Parent tree: `7bcb90e803696cb2d30d573b7896a0eaa8b23af7`.
- Clean tracked/untracked source status after freezing and after frozen-head checks. No source edits after freeze.
- Full four-file patch: `candidate.patch`, SHA-256 `2900a7035aa47ab3b1beb4deb817e237d6430e780bd96311a4e2e57f637293eb`.
- Four files, 3 insertions and 8 deletions. Three selectors removed; only their names removed from the existing backlog bullet.
- No ledger/archive, test, CSS, JSX, configuration, baseline, save/schema, event, actor, RNG, dependency or feature edits.

## Actual materialization and preserved inputs

Authenticated GitHub connector GETs read the actual Git-data commit, complete recursive tree, issue #28 and its sole comment. The issue/specification is retained in `input/issue.json`, not inferred from old source.
The recursive tree is untruncated: 626 blobs and 74 subtrees. Missing 39 blobs were fetched individually through the connector. Blob endpoint wrappers contained decoded UTF-8, not JSON/base64; every size and Git blob hash was verified before checkout. All subtree/root modes and hashes were rebuilt with `git mktree`; raw commit reconstruction using the actual metadata, +0800 timestamps and no terminal message newline reproduces the exact admitted commit hash. `materialization.json` rechecks all object content. An early console label incorrectly said 79 subtrees; actual generated inventory and report correctly say 74.

Only an isolated copy of the old checkout Git DB was modified. The exact base is an explicit shallow boundary. Its raw commit names parent `a32625e7632e724e8482c799e2be21fb4cd713f5`; the full ancestry was not materialized or claimed. The local bundle contains the candidate/base snapshot and objects sufficient for this work, not certified complete historical ancestry. `git bundle verify` succeeds; its stock wording about complete history must not override this explicit boundary.

Original `harem-oct23` remains clean at `98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b`; it was never used as current main. All original 131 runtime asset hashes were reverified after work. Existing earlier inputs and proofs were not written. Restored cloud has no Nov13–16 raw local proof logs; none were invented or claimed accessed. Current repository verification documents are source files, not those absent raw logs.

Current package/lock are not byte-identical to old checkout: the old test glob adds pending camera/palace suites and old install includes jsdom. Every current locked package entry was compared exactly with its corresponding old lock entry; 107 installed package versions match, and 88 absent platform-optional entries are disclosed. Compatible packages were copied to the isolated checkout, with no install/download. Current runtime asset manifest is byte-identical; 131 old asset files were size/SHA-256 verified before copying. `input/reuse.json` records versions, platform absences and asset pins. No credentials, local sessions, forbidden session paths, metrics or telemetry were read.

Current AGENTS, CODING_STANDARDS, ERRORS, DESIGN, CONTEXT Realism, worker skill, factory.json/READINESS and relevant source/contracts were read. Factory pin/maxParallel and the existing manual cloud scope remain unchanged.

## Caller and deletion proof

`ast-proof.json` and `analyze.cjs` are one-off ignored audit evidence, not product tests. TypeScript AST/checker traversed 187 tracked JS/TS-family files outside prohibited dead prototype `old_code/`. Each target identifier appears only at its declaration; no target string literals, named imports, reexports, direct calls or property names exist. All 62 import/reexport statements referencing the three owning modules were inventoried.

There are two namespace imports in `tests/career/careerModule.test.ts`. They were explicitly inspected rather than ignored: `balanceContract` asserts only eight named career compatibility operations and shared tuning-object identity. `intrigueContract` is enumerated, but values are compared only when the name belongs to the separate career entrypoint. `consortHostility` is not in that set and is neither invoked nor asserted. The retained `careerSeniorRival` compatibility operation still is. No application namespace import exposes these owners as an SDK/global object. The package is private browser ESM, with index.html entering src/main.tsx.

AST dynamic-call inventory was inspected. Runtime app source has no dynamic module import, eval, Function constructor, require or import.meta.glob; test dynamic imports target unrelated existing owners, and factory dynamic imports target held policy modules/Node builtins. Source/tests/scripts searches found no computed global `window[...]`/`globalThis[...]`, and no target-name string lookup. The QA HTML embeds the app and resizes its iframe, not a module/global export lookup. Normal Object.keys/entries operations in app source enumerate domain state, never these module namespaces. No live external consumer contract is claimed beyond this actual private app repository.

- `consortHostility`: function declaration/body only; declaration performs no call/registration. The removed `promotionHate` import binding was used solely in that dead body. `PalaceZone` remains a type import; the existing careerSeniorRival reexport retains the career module dependency/evaluation.
- `careerWindow`: an unused arrow function value; initialization does not execute its body. Its solely used `Career` type import is removed; live CAREER_RULES and compatibility reexports remain exact.
- `graphBackers`: function declaration/body only; no eager filtering, state mutation, random draw or registration occurs at declaration time. All graph creation/reduction/faction/pledge/romance/validation operations remain untouched.

`delete.cjs` selected only the intended top-level AST declarations and exact import-specifier replacements. `deletion-proof.json` captures original offsets, deleted text, import replacements and before/after digests. The freeze helper independently reconstructs each resulting source from exact base retained-byte concatenation plus only the recorded import replacement. No semantic whitespace or string content was stripped. All live functions, types, bodies, JSDoc and caller contracts retain exact bytes. No removed target had attached JSDoc. Source line counts shrink 26→23, 53→52 and 134→133; no oversized file grows. New handwritten audit helpers/report are all below 300 lines and ignored.

## Fresh executed checks

Baseline and final used Node 24.22.1, compatible existing locked tools/assets, and no downloads.

| Actual command | Result |
|---|---|
| Exact-base `npm run assets:verify` | PASS, exit 0; 131 verified, 0 downloaded |
| Exact-base `npm run build` | PASS, exit 0; production pruned 129 hosted binaries |
| Final-source `npm run factory:check` before freeze | PASS, exit 0; retained separately as pre-freeze log |
| Frozen-head `npm run factory:check` | PASS, exit 0; raw log and explicit exit file retained |
| Selected source hygiene within frozen aggregate | PASS; no baseline weakening |
| Factory policy/contracts suite | PASS: 25 tests, 0 failures/skips |
| `tsc --noEmit -p .` | PASS; src-only coverage |
| Actual MAIN app/CLI suites | PASS: 497 tests, 0 failures/skips |
| Pretest pinned assets | PASS: 131 verified, 0 downloaded |
| Frozen-head production build/prune | PASS; pruned 129 binaries |
| `git diff --check` and local bundle verification | PASS |

Relevant existing career/graph/intrigue/campaign/actor/save interfaces are exercised by the unchanged aggregate suites. No new source-grep/Markdown-regex product tests, baseline changes, suppressions or 100-seed study were added. Actual MAIN has 497 tests here, not old pending 567/573 counts. Full baseline aggregate was not run because no baseline failure attribution was needed after setup.

Warnings remain: npm reports unknown environment config `http-proxy`; Vite reports the known >500 kB minified chunk. Neither was suppressed. Hygiene is selected debt coverage, not complete lint/dead-code certification; TypeScript configuration covers src only, not tests/scripts. No standalone full ESLint gate is configured or claimed.

## Honest setup failures

The first evidence-persistence command exceeded OS argument-list size before a process was created; split writes succeeded. This was not a policy denial. Initial reuse precheck incorrectly required package.json byte identity and stopped at AssertionError; the same shell then attempted asset verification/build before copies existed: assets exit 1 (missing local pinned file), build exit 127 (`tsc: not found`). These setup-attempt logs are retained and are not presented as base product failures. A later copy collided with already-copied nested `tar/node_modules/yallist`; the isolated copy was completed using existing-directory merge after exact lock/version/pin verification. The fresh baseline above ran only after successful materialization. No denied operation was retried through an alternate route; no policy denial occurred.

## Complete production equivalence and remaining gates

After the frozen-head aggregate completed, baseline/final inventories compare every one of 285 production paths, modes, byte lengths and SHA-256s, totaling 23,847,739 bytes each. Entire bytes match, including JS/CSS, HTML, fonts, metadata, names and embedded references. No generated filename/HTML-only exception is needed. JS remains `assets/index-Cpi_IKoM.js`; CSS remains `assets/index-ogLC6n1w.css`. Inventory and comparison JSON retain all paths and checksums, and baseline-dist is preserved locally.

This is partial issue #28 hygiene only. `getRank`, `hasPromotedOffice`, `getDisabledActions`, locked-audience/pending-label and all other acceptance remain OPEN. No issue closure, public comment/PR, remote commit/ref change, pending integration, main update or Site publication occurred. Pending branch/source, original branch and public V57/source `abbf403ef771569533b802a88691696db4f0ce94` remain unchanged.

No browser/CDP/CUA/headless/launcher/DevTools/storage/tunnel or Cloudflare reauth operation was attempted. All actual browser/hosted/replay/controls/gait/CSS/touch/roles/reduced-motion, H2/P0 #41/#42 and parent release gates remain OPEN. Source/static proof and byte-identical output are not browser proof. Parent must arrange independent exact-candidate review and preserve release boundaries. This worker used only the existing admitted source role, created no jobs/subagents and did not alter accounting. Admission remains the parent's estimated USD8 source scope; no actual token-cost measurement is claimed.

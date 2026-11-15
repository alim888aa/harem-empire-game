# November 15 unused UI hygiene source report

## Frozen source
- Repository: alim888aa/harem-empire-game; issue #28, **partial scope only**.
- Base/admission: `8dc2a6f2e6e2f54cd32abb47f73e104c422a3121`, tree `00cbece11945f1e809471b6cfde6d9563788489a`.
- Local candidate: `5b66f2a02b46e9c2d31e633cadd07982d1222676`, tree `6754c4ca5906a053eb7dddd32b6db12b84583689`.
- Sole parent is the admitted base. Detached local commit only; no remote ref, PR, issue, main, Site or ledger change.
- Four tracked files changed: CharacterResponse.tsx deleted; palace.css orphan rules deleted; palaceCraft.ts dead lighting export deleted; architecture README removes only that export name from its backlog.
- Diff: 4 insertions, 60 deletions. No new tracked files, dependencies, hooks, wrappers, tests, suppression or `any`.
- Existing oversized/overfull source areas were not expanded. The minified legacy CSS keeps all live source bytes and order rather than reformatting unrelated rules.

## Contract and provenance
Read AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md including Realism, worker contract and factory READINESS. Their exact Git blobs match the admitted source. Read issue #28 and its sole migration comment through the authenticated connector; issue28-snapshot.json retains the complete body, original detailed requirements and acceptance text. No acceptance was silently weakened: locked audience branches, pending label/actor work and nine other dead exports remain out of scope. Original issue stays open.

Authenticated Git-data recursive tree was complete (`truncated:false`): 689 entries, 617 blobs. A copy of the existing local shallow Git database supplied matching objects. Only 23 missing blobs were fetched through the connector. Every blob was independently rehashed from actual bytes; every tree was rebuilt and matched its advertised SHA/mode. Actual Git-data commit metadata reconstructed with +0800 timezone and no trailing message newline matches the exact admitted SHA. The raw metadata is preserved. Existing history is shallow; the imported tip is explicitly a shallow boundary, not a claim that absent ancestors were imported or verified. source-provenance.json inventories all blob hashes and candidate byte/mode verification.

The Nov14 archived ledger blob remains `3decb411810176b1770ffd1e31582f301e30a972`, SHA256 `b1d82bf3580c5477de9505a1b491f663408b89f40578e72ce6c836aa0c406a97`, untouched. No ledger/archive changes or carry-forward. No stock dispatcher, live metrics, session/credential reading, installation, downloading or account/security change.

Original harem-oct23 remains at `98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b`, tree `c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b`, clean. harem-nov1-accounting was not edited. Existing dependencies and pinned runtime bytes were reused. No old absent logs were accessed or claimed rehashed.

## Unreachable-code and CSS proof
- Static TypeScript AST inventory: 186 tracked code files across src/tests/scripts/vendored agent scripts, 917 import/re-export edges, 101 source modules reachable from src/main.tsx using configured module resolution. No import or caller of the deleted component; its identifiers occur only in its own definition/export. PALACE_CRAFT_LIGHTING occurs only at its declaration, with world.ts importing only addPalaceCraft. Manual current-source reference checks agree.
- lastCharacterResponse state and its live CourtAudience uses are not component imports and remain untouched. No save/schema/state/RNG/gift behavior changed.
- Removed exactly ten orphan quest rules: four base rules, three under max-width:780px, three under max-width:540px. All descendants/media variants are covered.
- PostCSS AST comparison proves every remaining palace.css selector, declaration, order and media context is identical. Exact source-span deletion preserves every other source byte. All four `.palace-warning` rules are verbatim, including the base rule sharing the original minified line.
- Existing public-render and gift-interface tests pass, separately from this static proof. There is **no actual browser/layout evidence** in this job.

## Baseline/final production artifact comparison
Baseline production build and final aggregate production build both pass, transforming 158 modules.

The entire emitted JavaScript is byte-identical: 1265737 bytes, SHA256 `27c03106e2abd497e262b4fa250052aaac01911924277db0800fff3ddbb506cd`. Rollup filenames change from index-VT4pN6cq.js to index-Cpi_IKoM.js despite identical contents. There are no JS code or asset-reference byte changes.

Generated CSS changes from index-DGTUv82o.css to index-ogLC6n1w.css, 137480 to 135621 bytes. This is **not merely ten rule removals**: deletion of the unused JSX also makes Tailwind omit 14 utility rules, four @property registrations and nine custom-property initializers/tokens used solely to generate the unused toast utilities. build-comparison.json preserves the exact removed AST nodes. After that explicit dead-only pruning, the full remaining production CSS AST is identical, including selector/declaration order and nested contexts.

The 14 omitted utility tokens have zero literal uses in the 101 live reachable source modules. There are no live source mentions or final CSS setters for the removed custom properties. Six unchanged text-size rules still reference `var(--tw-leading,var(--text-*--line-height))`; these are explicitly retained fallback consumers, not zero references. The omitted --tw-leading registration had syntax:* / inherits:false / no initial-value and its initializer was initial. With no source assignment or CSS setter, both initial and absent values are guaranteed-invalid and select the same existing explicit fallback. Other removed variables have no remaining CSS consumers. This is static CSS reasoning, not a browser test.

All 285 baseline/final distribution files are inventoried and hashed. Apart from the JS/CSS hashed filenames, only index.html changes, exactly to reference those two new filenames. All other distribution bytes are identical. The JS rename is not a functional JS change.

## Executed checks on the frozen candidate
- `npm run factory:check`: exit 0.
- Selected source hygiene: explicitAny31, alerts5, consoleLogs49, unseededRandom6, longLines707, oversizedFiles7, within unchanged baseline.
- Factory policy/contract tests: 25 passed, 0 failed.
- `src/` TypeScript check: passed; production `tsc` also passed.
- Pinned runtime verification: 131 files, 0 downloaded.
- Main application/CLI tests: 497 passed, 0 failed/cancelled/skipped.
- Production build: passed; 129 hosted runtime binaries pruned, attribution/metadata retained.
- Existing focused conversationLayout, giftTransactions and uiKit tests: 27 passed, 0 failed/cancelled/skipped.
- Source AST, generated CSS AST, JS equality, HTML-reference-only delta, exact source byte/mode verification and `git diff --check`: passed.
- Final tracked working tree clean. Full candidate patch, raw commit, logs, provenance and hash inventories retained here.

Limits: TypeScript covers src only, not tests/scripts. Selected hygiene is not full ESLint, complete dead-code coverage or full folder/per-file enforcement. Existing Vite >500kB chunk warning and npm unknown http-proxy config warning remain; no configuration was weakened.

## Non-release and never-run gates
No browser job was admitted. No browser, server, CUA/CDP/headless/DevTools/DOM/storage/tunnel or alternate launch/flags were started or retried. Previously recorded Chromium sandbox/ptrace failure is not new evidence here. No desktop/touch layout, hosted behavior, controls/gait/roles/reduced motion/replay, H2 or P0 #41/#42 proof was run. No new 100-seed study or baseline full aggregate. Independent source review and all parent release gates remain open. No Site publication: existing public V57/source abbf403ef771569533b802a88691696db4f0ce94 is unchanged. This is not issue #28 completion or a production release.

## Evidence-tool corrections, not hidden green results
- First oversized metadata-transfer command failed at process creation with OS Argument list too long; no write happened. Smaller transfers succeeded. This was not an authorization denial.
- Copying a Git index required explicit checkout-index materialization in the isolated workspace; temporary dependency/asset placement was corrected there before baseline validation. Original checkouts were never edited.
- Initial CSS source-offset proof assertion failed before any source write. PostCSS end.offset is exclusive in the installed version; correction passed before deletion.
- An exploratory Python character-diff command was interrupted (exit130) because it was unnecessarily slow. Direct byte equality and SHA256 then established the complete JS result.
- An overstrong exploratory assertion that every removed generated variable had zero references failed on the six --tw-leading fallback consumers. The retained consumers and unchanged fallback semantics are disclosed above; corrected evidence checks zero setters and the exact six fallback references. No source change followed these checks.
- No required aggregate, build, application or focused interface check failed. No permission denial occurred. No extra job or monitoring was started.

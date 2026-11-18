# Issue 28 final dead-export source slice, November 18

## Frozen identity and scope

Local candidate `5e9952bd23aee14bf5be9866d421bf12be0013b8`, tree `33e645a97655e4d2025ecd0429f8adf083520e03`, sole parent `15113e1cab646a13798002bb5b00668c65ac132e` (tree `0579ae4cf70253bcf3c49b754a10f7744bf4bbae`). Clean frozen worktree; no source edits after freeze. Exactly three files and 34 deleted lines; full patch in `proof/source.patch`.

- `src/lib/helpers.ts`: delete only unused `getRank` and adjacent separator whitespace. Preserve `getPersonality`, `getPersonalityHint`, `getSupportThreshold` and import/type/body bytes.
- `src/lib/influenceGating.ts`: delete only unused `hasPromotedOffice`, `getDisabledActions`, its now-orphan JSDoc and adjacent separator whitespace. Preserve `ActionAvailability`, `InfluenceGatingResult`, `checkActionAvailability`, `getInfluenceGating`, `canInteract` and all current live branches and exact strings/bodies.
- `docs/architecture/README.md`: remove only the remaining completed ten-export backlog bullet. All other bytes retained.

This completes only the ten-export backlog's remaining declarations, not all issue 28. Locked audience/pending label and other issue acceptance remain OPEN. No game/save/schema/RNG/event/actor rules, JSX/CSS/tests/config/baselines/dependencies/hooks/new features changed.

## Authenticated source and preservation

Read authenticated issue 28 detailed specification and its one migration comment. Read current AGENTS, CODING_STANDARDS, ERRORS, DESIGN, CONTEXT including Realism, worker skill, factory config and READINESS. Pinned cloud factory contract remains `7d756086b9938635e0cd11064a4d337eae747326`; manual one-job scope only.

Authenticated GitHub git-data metadata and decoded UTF-8 blobs are preserved under `input/`. Recursive tree is complete/not truncated: 706 entries, including 631 blobs. Every blob content was freshly hashed to its recorded object SHA; all modes, subtrees and root matched. Six blobs absent from the existing database were decoded exactly as returned and hash/length verified. Raw commit reproduced exact SHA with +0800 author/committer offsets and no final message newline. Its sole parent is `505d22a2eb91d56166b6ab6e8ba8227c68fae318`; older ancestry remains shallow/incomplete. No complete-history claim. Authenticated main-ref recheck still named the admitted base.

Original Nov17 input and old98 worktrees remain clean and unmodified. The Nov18 candidate uses a copied isolated Git database and exact admitted source, not a stale replacement. Ledger/archive untouched. Nov17 archive blob `7e192e9472a8180b2e0874253b618ccda4b8d895`, SHA256 `fe834424b9ca83e2c40e1ab8bc091081f898e498aa451d1757542ec13d58abcf` verified. Pending725/original98 refs were not integrated, moved or mutated. All earlier main maintenance retained byte-for-byte outside the three specified files.

Existing Nov17 lock bytes equal current lock. Copied existing installed dependencies after checking 107 installed package versions against current lock; 88 optional platform packages absent. Old98 lock itself differs by older optional tooling, so it was not claimed byte-identical. All 131 existing runtime pins were freshly SHA256/length checked before copying; no install/download occurred.

## Caller, deletion and retained-byte proof

`proof/caller-audit.json` and raw log cover TypeScript AST traversal of 187 tracked executable files, including app/tests/scripts/config and vendored agent source, without executing stock dispatcher/live metrics. Dead `old_code/` was not read, per AGENTS. Only three target identifier occurrences exist, each its own declaration; zero target string literals. All static import/export edges inventoried. Neither target module has namespace consumers or wildcard reexports; actual consumers import only retained named operations. All observed dynamic imports are literal and unrelated to the two modules; no eval/Function/glob path exposes these exports. Observed global/property accesses do not register or look up targets. Entry HTML loads `src/main.tsx` as ESM; package is private browser application, not external SDK. Manual inspection of these edges/dynamic/global inventories confirms no runtime target lookup or product decision.

`proof/final-deletion-proof.json` is authoritative: exact AST-bounded deleted ranges, original removed bytes/hashes and every retained top-level AST node's exact-byte hash. `proof/final-ast.log` independently checks actual frozen retained imports/types/functions/comments/literals against those hashes. `proof/source-validation.txt` reconstructs final source from baseline bytes plus only enumerated deletions, without normalization, checks every unchanged tracked file and every tracked mode. No source-grep or Markdown-regex product tests added.

Initial diff check exposed a newly blank final line after deleting the trailing declaration. Before freeze, removed only that adjacent separator newline and extended its recorded deletion bound by one byte. Initial proof/log retained; `diff-check-correction.txt` explains it. Final diff check exits 0. Touched files shrink (helpers 48 lines, gating 91, README 84); already-overfull lib folder remains 27 direct files with no additions. New handwritten proof helpers are below 300 lines and ignored/task-owned.

## Executed verification

All following exits are 0, with raw `.log` and `.exit` files under `proof/`:

- Own fresh exact-base `npm run build`, saved before any source edit; production build and prune 129 passed.
- AST caller audit, AST-bounded deletion and final diff check.
- ONE fresh `npm run factory:check` after the final local commit froze: selected hygiene, 25/25 factory tests, src-only TypeScript, 131 runtime pins / 0 downloads, 497/497 actual main app/CLI tests, production build and prune 129. Zero failures/cancellations/skips/todos. Existing helper/gating/campaign public interfaces included through existing gameMachine, courtStrategy, campaignSave and broader campaign/gift/career tests. No separate focused subset or extra aggregate was run.
- Postfreeze all-blob/source/mode/deletion proof, retained-AST check and complete own baseline/final production comparison.

Production payload: exactly 285 regular files / 23,847,739 bytes, plus 10 directories. Complete path sets, types, modes, lengths, SHA256 and direct bytes are identical. No renamed bundles; HTML references identical, including `index-Cpi_IKoM.js`, `index-ogLC6n1w.css` and the touch-layout iframe. Complete inventories in `baseline-payload.tsv` / `final-payload.tsv`; result in `payload-comparison.txt`.

Existing npm unknown `http-proxy` environment-config warning and Vite >500kB chunk warning appeared in both baseline/final logs and were not suppressed. Hygiene is selected ratchet coverage, not comprehensive ESLint/format/dead-export certification. tsconfig covers src only, not tests/scripts. No baseline aggregate/100-seed study was needed or run. No baseline raised or failure hidden.

## Limits and delivery

No browser/CDP/headless/native/DevTools/socket/ptrace/tunnel/Cloudflare retry, browser job or new launch authorization. Browser, hosted/replay/controls/gait/CSS/touch/roles/reduced-motion/H2/P0#41/#42/parent release gates remain OPEN. Site public V57/source `abbf403ef771569533b802a88691696db4f0ce94` unchanged; no publication or full issue completion implied. No remote/ref writes, issue/PR communication or closure. Independent exact-source review and parent decision remain required. No user outreach.

All ordinary task writes used scoped `require_escalated` review. One initial oversized new-tree metadata write failed before process creation with exec-server `Argument list too long (os error 7)`; completed using the task's explicitly authorized bounded chunks. No permission-review denial occurred. The prior Nov17 optional `manifest-and-counters.json` remains absent and incomplete, never retried/relocated/reconstructed. No replacement combined manifest/counters summary was made. Missing older Nov13-16 raw workspaces/logs were not claimed freshly read or rehashed.

`candidate-source.tar.gz` contains only frozen tracked source; `proof/source.patch` is full delta. `proof/source-files-SHA256SUMS.txt` covers all 631 final tracked files; `EVIDENCE-SHA256SUMS.txt` hashes existing inputs/proof/report/source archive, excluding itself. These task-specific proofs and human report are separate from the forbidden optional combined summary. No giant runtime/evidence archive or upload was required. Budget unchanged: admitted source $8/review $5/coordination $4/preservation $3 = $20; $10 unused/unadmitted, no new jobs.

# Saved palace pose worker result

## Result

A reproducible existing restoration defect is repaired locally. Ordinary PalaceScene walking reached a collision-clear Library shelf-end pose (-6.88,9.1785), saved it exactly through the real autosave/store/parse interfaces at the introductory Emperor checkpoint, and reconstructed the campaign unchanged. The old scene then replaced the legal pose with (0,15). The same mismatch is demonstrated for Prince, Scholar/minister and a valid promoted Concubine body. Separate real-scene reproduction shows ordinary walking permits .7785m standing separation from a real Library courtier, blocks further approach inside .76m, but old .8m restoration discarded that legal pose.

The candidate shares existing ordinary standing/movement safety rules: .45m bounds margin, actual career body radius, .76m NPC standing separation. Movement-away escape from an existing overlap is preserved. Actual shelf/wall/NPC overlaps and out-of-bounds poses still fall back safely. Existing camera orbit, valid paused jump state, rejected-pose jump reset, campaign rules, timing, RNG, NPC placement, save fields and version are unchanged.

## Exact local candidate

- Base: 0f565c4d33e05ea2d169a19394c1d51ea30e25ea, tree 1515248272c43b3735f007a236876c5d41cd6f0f.
- Local branch: fix/palace-saved-pose-2026-11-06.
- Local commit: 1b9969c48db7e102c685846f712478ae15739b6e.
- Candidate tree: c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b.
- Tracked worktree is clean. No remote write, fetch, integration, PR, comment or deployment occurred. Initial pending source was checked out by its exact SHA, not an existing local branch ref. A later local branch-name read failed because that local ref was absent; no transport retry was made.

Complete changed-file list:

1. package.json: includes the new tests/palace test folder in the existing test command.
2. src/palace/PalaceScene.tsx: uses shared player standing/movement policy, removing the divergent restoration guard and inline movement policy. The oversized scene shrinks from 532 to 528 lines.
3. src/palace/navigation.ts: owns the shared player body/bounds/NPC policy alongside the existing courtier navigation grid, 75 lines total.
4. tests/palace/navigation.test.ts: four public navigation tests, 47 lines.
5. tests/palace/poseRestore.test.ts: five scene/save behavioral tests, 205 lines.

No new hooks, dependencies, assets, source/CSS regex tests, test hooks or pass-through adapters. The new test folder avoids growing the existing oversized root tests folder; both new files are below 300 lines. No installed tooling or schema changes.

## Verification

- Original-source regression: final five scene tests on byte-for-byte base source all fail specifically at legal-pose restoration, including the three role shelf-end cases, legal gate margin and real nearby-NPC case. Exit 1 is expected proof, not a passing check. `pose-regression-before.log` and `pose-before-status.txt` retain full output.
- Candidate focused command: `node --import tsx --test tests/palace/*.test.ts tests/camera/*.test.ts tests/campaignSave.test.ts tests/campaignSaveMigration.test.ts tests/campaignRandom.test.ts tests/jumpPhysics.test.ts`: 100 passed, 0 failed, exit 0. Includes nine new tests plus camera, save/migration, seeded campaign replay and jump interfaces. See `focused-after.log`.
- Independent local asset verification: `npm run assets:verify`: all 131 pinned runtime hashes verified, 0 downloads.
- Final-content `npm run factory:check`: passed selected hygiene, 25 factory tests, source typecheck, all 131 asset hashes, 567 product tests, production build and pruning of 129 hosted binaries. Exit 0. See `factory-check.log` and `factory-status.txt`. No check weakened or baseline raised. The existing large JS chunk warning and npm environment/update notices remain. This does not certify full ESLint/dead-code coverage.
- `git diff --check` passed; local candidate bundle verified against the base commit.
- The first harness attempts failed for setup reasons and were corrected before the final before/after proof. See `notes.md` and `harness-first-attempt.log`; no product behavior was changed for those setup failures.

Tests were run against the final committed file contents. The commit operation changed metadata only. No native/browser or hosted test was performed in this source job.

## User impact and limits

If reviewed and eventually released, legal exploration poses close to shelves, doors and courtiers will resume at that pose instead of unnecessarily returning to the room entrance. Current public V57 has not changed.

The November 5 native rounded (-6.88,9.18) target lies .38m beyond the actual shelf end at z8.8, safe for the .36m body but rejected by old .4m restoration. This source mechanism would explain the recorded reset IF that target was actually saved and loaded. No original saved payload was inspected. Therefore the historical native reset remains unattributed, and no new-source regression is inferred. Capture/serialization passed in the interface reproduction; real frame-to-save sampling lag in the historical run has not been ruled out.

Independent exact-content/head review is still required. Native verification must establish actual same-pose persistence on this candidate through ordinary movement, settled save time, reload, resumed encounter/Return and subsequent motion, including repeat attempts and non-entry-room coverage. Numeric source tests are not native pixels, historical H2 scene identity, temporal video, hosted asset delivery, CSS viewport or physical-touch proof. Existing wider H2/#41/#42 and release gates remain open. Parent owns preservation, remote leases and any later publication.

## Artifacts

All retained files are under `/workspace/scratch/5e0e15dcbbf8/.scratch/harem-nov6/`:

- `source-trace.md`: capture/serialization/restoration ownership, mismatch geometry and attribution limits.
- `candidate.diff`, `candidate.patch`: complete five-file candidate changes.
- `candidate.bundle`: verified local one-commit bundle, requiring base 0f565c4.
- `pose-regression-before.log`, `pose-before-status.txt`, `pose-regression-after.log`, `navigation-after.log`, `focused-after.log`, `focused-status.txt`, `factory-check.log`, `factory-status.txt`, `assets-verify.log`: exact test/check outputs.
- `notes.md`, `harness-first-attempt.log`: setup failures and corrections.
- `PalaceScene.candidate.tsx`, `navigation.candidate.ts`: exact source copies used by the base-source test restoration trap.
- `SHA256SUMS`: artifact integrity manifest, excluding itself.

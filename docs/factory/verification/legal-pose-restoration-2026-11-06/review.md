# Independent saved-pose source review

Author: independent review · admitted Nov 6 source-review role (USD 5 already reserved)
Review: 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b · round 1
Verdict: clear
Open findings: none. No R finding IDs assigned or reused.

## Exact scope and identity

- Reviewed checkout: `/workspace/scratch/5e0e15dcbbf8/harem-oct23`.
- Reviewed head: `98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b`.
- Reviewed tree: `c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b`.
- Comparison head: `0f565c4d33e05ea2d169a19394c1d51ea30e25ea`, tree `1515248272c43b3735f007a236876c5d41cd6f0f`.
- Only the five-file new delta was reviewed: `package.json`, `src/palace/PalaceScene.tsx`, `src/palace/navigation.ts`, `tests/palace/navigation.test.ts`, `tests/palace/poseRestore.test.ts`, plus affected movement/world/visit/save callers. Earlier staged camera/gait/input work was context, not a repeated new review scope.
- Read AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md including Realism, factory.json, docs/factory/READINESS.md and the pinned review contract, plus the worker's report, source trace, final original-red log and harness-correction notes.

## Source assessment

- `src/palace/navigation.ts:9–27` gives the existing navigation owner the shared player policy. Static legality retains the old ordinary movement's strict .45m room margin and actual career radius. NPC standing clearance is .76m. `canMove` preserves the exact prior distance comparison and movement-away escape behavior; the captured NPC collection contains live mutable coordinates, not a frozen position copy.
- `src/palace/PalaceScene.tsx:159–164` now restores with that shared standing policy. The pre-existing floor, orbit and jump restoration/reset paths are retained. The replaced .5m/.4m/.8m restoration-only thresholds caused the demonstrated mismatch; ordinary movement is not loosened by the repair.
- `src/palace/PalaceScene.tsx:339–340` calls the same policy for both movement axes in the original order, using the updated live player position for each axis/substep. Existing speed, stepping, input, jump and campaign behavior is unchanged.
- Tests use navigation and real scene/persistence public interfaces, not source/CSS matching or a new test hook. Scene tests use keyboard events, mutable visit output, the real autosave/store/parser and newly constructed actors/scenes. Concubine's Library fixture is a valid promoted Empress campaign rather than bypassed career access. No real browser/native renderer is claimed by these JSDOM/SVG tests.
- Candidate tests cover all three body roles, exact shelf-end/side poses, the doorway margin, legal nearby-NPC separation, all-five-room collision/bounds safety, unsafe body/wall/NPC positions, dynamic NPC coordinates, overlap escape, camera/jump preservation and campaign snapshot equivalence.
- No hook, stored shape, save version, schema, dependency, asset, gate suppression or baseline change was added. The type-only world import introduces no runtime dependency cycle. The navigation module owns this policy rather than adding a pass-through adapter.
- The touched oversized scene shrinks from 532 to 528 lines; navigation is 75 lines and new test files are 47 and 205 lines. The oversized-file ratchet is preserved. The new test subfolder is wired into the aggregate test command.

User impact: a legal explored pose close to a shelf, doorway or courtier can resume at that same pose rather than being needlessly replaced by the room spawn. Actual unsafe horizontal placements still fall back. No source correction is required from this review.

## Independent executed checks

All full command output and counts are retained in `independent-review-checks.log` alongside this receipt.

1. `git diff --check 0f565c4d33e05ea2d169a19394c1d51ea30e25ea HEAD`: exit 0.
2. `node --import tsx --test tests/palace/*.test.ts tests/camera/*.test.ts tests/campaignSave.test.ts tests/campaignSaveMigration.test.ts tests/campaignRandom.test.ts tests/jumpPhysics.test.ts tests/palaceSchedules.test.ts tests/palaceRoomFocals.test.ts tests/ladiesResidences.test.ts`: 118 passed, 0 failed/skipped/cancelled; exit 0. Includes the nine new tests and affected camera, save/migration, seeded replay, jump, schedules and room geometry interfaces.
3. `npm run factory:check`: exit 0, independently run against this exact candidate.
   - Selected source hygiene passed: explicitAny 31, alerts 5, consoleLogs 49, unseededRandom 6, longLines 695, oversizedFiles 7. No baseline was changed.
   - Factory tests: 25 passed, 0 failed/skipped/cancelled.
   - `tsc --noEmit -p .`: passed.
   - Pretest asset verification: 131 pinned runtime files verified, 0 downloaded.
   - Product tests: 567 passed, 0 failed/skipped/cancelled.
   - `tsc && vite build && node scripts/runtime-assets.mjs prune-build`: passed; 129 hosted binaries excluded from dist.
   - Observed non-failing npm environment/update notices and Vite large-chunk warning. They were not suppressed or treated as failed checks.
4. Independently reproduced the original-source red result in `independent-original-snapshot`, created by `git archive 0f565c4...`. Both original source files were byte-compared to the original Git blobs; the final scene test file was copied unchanged and byte-compared to the candidate's test. Existing installed dependencies were linked, not installed.
   - `node --import tsx --test tests/palace/poseRestore.test.ts` in that isolated original snapshot: 0 passed, 5 failed; process exit 1, explicitly expected regression evidence.
   - All three role cases fail at `tests/palace/poseRestore.test.ts:135`: actual `(0,15)`, expected `(-6.88,9.178500000000003)` after exact save-byte equality and campaign reconstruction already passed.
   - Doorway case fails at line 173: actual spawn/grounded state, expected legal `(6,19.51)` with preserved paused jump/orbit state.
   - Real-NPC movement case fails at line 203: actual `(0,15)`, expected `(-3.2214999999999994,-14)`, a legally walked .7785m separation.
   - These are concrete old-restoration assertion failures, not setup/import/asset failures. The candidate's corresponding cases pass.
5. Before and after checks: target worktree clean, exact head/tree unchanged. No `.env.local` is present. Final delta whitespace check passed again.

Repository coverage limitation: there is no configured ESLint gate here. Factory hygiene is selected source-debt coverage, not complete lint, formatting, folder-limit or dead-code certification. The committed tsconfig typechecks src, not tests/scripts. No tooling or suppressions were added to conceal that limitation.

## Mutation, authorization and release boundaries

No product source/test edits, ref moves, network writes, PR creation/comment/approval, merge or publication were performed. Only local ignored build output, review artifacts/logs and a separate unmodified original-source snapshot were generated. No additional agent or admission was created, no service/tool was installed, and no credentials, account/security grants, live metrics or quota service was used. No browser route, denied or otherwise, was attempted.

This is independent exact-content source clearance only. No native/browser or hosted run was performed by this reviewer. The historical native reset is explained by this mechanism only IF that legal pose was actually saved and loaded: historical actual saved bytes were never inspected, so causation remains unattributed.

Before release, independent native proof must still demonstrate ordinary movement to an actually saved pose, settled save, exit/reload, same-pose restoration, resumed encounter/Return and subsequent movement, including repeats and non-entry-room coverage. This review cannot waive complete historical H2 scene identity or the wider role, reduced-motion, viewport, physical-touch, temporal-video, controls, Speak, chained-encounter, save and hosted-asset/release gates. Parent retains release approval, existing public destination only, and preservation/rollback obligations. Current public behavior was not changed by this review.

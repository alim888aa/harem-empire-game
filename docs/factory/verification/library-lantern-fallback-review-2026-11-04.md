Author: review · harem-nov04-lower-camera-fallback
Review: 0f565c4d33e05ea2d169a19394c1d51ea30e25ea · round 1
Verdict: clear

## Exact scope

- Reviewed head: `0f565c4d33e05ea2d169a19394c1d51ea30e25ea`.
- Reviewed tree: `1515248272c43b3735f007a236876c5d41cd6f0f`.
- Diff base: `ec7e63c253407e54f22f5a35ba081dbe324f557f`.
- Only the new two-file delta was reviewed: `src/palace/camera/conversation.ts` and `tests/camera/clearance.test.ts`, plus affected camera/scene callers. Earlier reviewed camera fixes were context, not a second review scope.
- Read AGENTS.md, CODING_STANDARDS.md, ERRORS.md, DESIGN.md, CONTEXT.md Realism, factory.json, docs/factory/READINESS.md and the adopted v3 review contract.
- Source-only cloud review. No product edits, browser work, public comments, release, extra worker or added budget admission.
- The Nov4 Asia/Ulaanbaatar ledger at main `e066e2dcc2a6500b14e4665921622354b7d3656a` reserves USD28 of USD30, including this already-admitted USD5 independent review.

## Findings

No blocking findings.

- The first pass preserves the former 24-yaw/distance enumeration, camera height expression, validity guards, projection fit, scoring and tie ordering. Returning its best shot before the second pass preserves deterministic preference for every existing valid high shot.
- Only complete high-pass failure enables shoulder-height candidates. These retain the minimum-height guard, ceiling clamp, room bounds, 2.1m actor separation, expanded endpoint clearance, unpadded upper-body sightlines, near/far clipping and usable viewport checks. If neither pass succeeds, the same copied ordinary fallback is returned.
- Search is bounded at two passes of at most 120 candidates each. The unchanged subject/viewport transition cache calls the planner once per new shot key, not per rendered frame. The new role regressions explicitly verify the retained result across 60 frames.
- New regressions use actual Library collision/view blockers, legal shelf-end player position, each role's movement/body dimensions and the Emperor's actual input dimensions. All three viewport layouts, normal/reduced motion, clear projected upper-body corners, architectural rays, camera endpoint clearance and return to ordinary follow are checked through public camera interfaces. This is representative source-level coverage for the diagnosed endcap and does not replace native visual proof of the natural encounter.
- No persistence/RNG, encounter timing, actor placement, hooks, dependencies or publication target changed. Both edited files remain below the handwritten 300-line limit.

## Independently executed

- `node --import tsx --test tests/camera/*.test.ts`: 51 passed, 0 failed; includes the three new shelf-end role regressions and existing saved-entry/layout/ordinary-camera checks.
- `npm run factory:hygiene`: passed with the existing selected-coverage counts; no lint/dead-code completeness claimed.
- `npm run typecheck`: passed.
- `git diff --check ec7e63c253407e54f22f5a35ba081dbe324f557f HEAD`: passed.
- Confirmed clean worktree, reviewed head and tree before receipt creation outside the repository.

## Supplied evidence inspected

- `.scratch/harem-nov4/endcap-before.log`: the three added role regressions fail at the framed-result assertion on the high-only implementation; four earlier clearance tests pass.
- `.scratch/harem-nov4/factory-check.log`: reported hygiene, 25 factory tests, typecheck, 558 product tests and production build passed. This reviewer inspected that completed aggregate log rather than claiming a separate full aggregate execution.
- Build log retains the known bundle-size warning; it is not a new failure or silently waived gate.

## Remaining release gates

This is a clear exact-head source/regression review only. No exact-head native screenshot/playtest or full issue42 acceptance claim is made. The earlier baseline screenshots are not new-head proof. Required independent native hunt, applicable interface/replay checks and parent release approval remain binding before publication.

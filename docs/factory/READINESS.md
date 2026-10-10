# Factory readiness

Status: parent manual cloud dispatch is supported. Stock T3/laptop CLI dispatch and local session-log accounting remain unsupported; no launcher platform is being built. No schedules, webhook secrets or new persistent credentials were installed. Public deployment is unchanged.

## Daily estimated budget
The user's latest decision: “$100 for today for the refactor then $30 a day for maintainance if necessary. use estimates if you don't have exact token count.” Today is October 10, 2026 in Asia/Ulaanbaatar. This replaces the previous cumulative-refactor-pot/exact-meter assumptions.

The parent records conservative flat job estimates in estimated-usage.json for owner/dispatch, build/fix, every review lens, verification, hunt, research and retries. Estimates are planning allowances, not fees or actual billing. Initial recorded/reserved estimates total $80, leaving $20 headroom. Stop new work when recorded plus reserved estimates reach $100 today (then $30 on a maintenance day); let active work finish and record revised estimates. No overrun authority is assumed. Maintenance happens only when useful; it is not an automatic daily charge.

## Manual parent dispatch
The parent follows factory labels/dependencies and job contracts, launches cloud-native Sol workers itself, tracks estimates, deduplicates jobs, and records exact-head checks/reviews. Reviewers and verifier remain independent from the writer. Parent owns product decisions and release approval. Exact token measurement is not required.

Upstream parked coordination issue: https://github.com/alim888aa/agent-org/issues/17 and https://github.com/alim888aa/agent-org/issues/17#issuecomment-6094157627 . The upstream comment's p0 bypass does not itself grant this project permission to exceed the user's estimate allowance.

## Available checks
Existing npm typecheck/tests/build, SHA-256 asset recovery and selected source hygiene ratchet. The ratchet is not full ESLint, formatting or dead-export coverage: aggregate removals can offset additions; scripts/tests, folder limits, per-file debt and oversized-file growth remain unmeasured. These limitations are recorded technical debt, not a requirement to build a dispatch platform before refactoring.

`npm run factory:check` runs implemented hygiene, factory policy tests, application check and build. `npm run factory:guard` stops unsupported stock T3 entrypoints. Parent manual dispatch remains supported.

## Verification and publication
Use an exact-head independent verifier and public-interface/replay tests for behavior-preserving changes. Visible changes require browser screenshots. Exact-head cloud browser-to-executor reachability is currently limited; disclose a missing browser run rather than claiming it passed. No publication until the required review/verifier gates are complete. Publish only to the existing game site and keep rollback assets/source available.

## Base fixture
`npm ci`, `npm run assets:fetch`, `npm run dev -- --host 0.0.0.0`. Fresh browser profile, offline audience behavior, no account or secret. public/qa v7 saves provide romance, jealousy, intrigue and demotion states. Hosted art recovery remains mandatory.

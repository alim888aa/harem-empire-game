# Factory readiness

Status: parent manual cloud-native Sol dispatch is supported. This is a source-only v3 contract update pinned to `alim888aa/agent-org` at `7d756086b9938635e0cd11064a4d337eae747326`. No game behavior or public destination changes. No schedules, webhooks, credentials, new permissions, paid services or deployment were added.

## Supported execution

The parent follows labels/dependencies, deduplicates jobs and admits every native cloud job with `assessEstimatedJob`. All jobs and council angles use GPT-6.1 Sol. There is one `review` job instead of legacy review lenses/verifier jobs. It checks correctness, boundaries, regressions and touched frontend rules together. The independent `hunt` follows `edge-case-hunter` and `browser`; the worker follows `worker` plus `PARENT.md` for parent plans.

The v3 workflow uses `reviewer-ready`, with reviewers chosen in the PR body. Legacy `verifier-ready` is recognized by the pure planner for migration; it does not restore a verifier job. This PR changes source contracts only, not existing GitHub labels, issue bodies or active work ownership. Manual parent coordination remains authoritative.

Project gates override optional upstream shortcuts: required exact-head code review, behavior/interface/replay checks and browser proof for visible changes must all be complete before parent release approval. A base failure is disclosed and never rewritten as a green result. `pnpm check` in upstream contracts maps to `npm run factory:check` here.

## Daily estimated budget

October 10's $100 refactor ledger is preserved in `estimated-usage-2026-10-10.json`. Current admission uses `estimated-usage.json`, dated October 14, 2026 in Asia/Ulaanbaatar (October 13 at 19:30 UTC). The confirmed four-role reservation totals $20: integration $6, coordination $4, game browser verification $5 and independent source review $5. This leaves $10 of the $30 maintenance-day allowance.

These are conservative planning estimates, not fees or actual billing. Existing reservations are admitted once. A changed estimate needs a separate explicit reservation; every retry and new role is counted. Stop new reservations above the daily ceiling, including p0; admitted work finishes and records its revised estimate. Maintenance runs only when useful, with a fresh local-day ledger. No recurring charge or automatic schedule is created. `budgetUsd: 30` is the stock maintenance default, while the dated estimated policy/ledger owns admission.

## Held runtime edges

- Stock T3 dispatch CLI and imported `apply`, `recordSettleResult` and mutating `readSettleFailures` stop before GitHub, T3, worktree actions or acknowledgements, including through skill symlinks. Pure planning/export functions are retained; their output is advisory and does not authorize execution or a p0 budget bypass
- Local usage CLI and imported `spentToday`, `claudeCharges`, `codexCharges`, `readLines` and `recentLogs` stop before session-log reads. Pure price/token transformations remain available
- Metrics CLI plus imported `readT3`, `collectCharges`, `d1Client` and `sync` stop before local metadata/session/credential access or D1 writes. `metrics.enabled` is false. Pure metric transformations and vendored configuration/migrations remain source only; do not apply migrations or activate the inherited D1 destination

No launcher platform is being built. Audits use authorized read-only GitHub evidence and the estimated ledger; real session metering is unavailable, never zero.

## Checks and source provenance

`npm run factory:check` runs selected source hygiene, factory policy/contracts tests, application checks and production build. `npm run factory:guard` intentionally exits nonzero for unsupported stock execution; it does not block parent manual dispatch. `upstream-contracts.json` inventories every installed skill file, upstream blob SHA, installed digest and the three documented runtime overrides. Obsolete code-review, error-handling, review-boundaries, review-frontend, review-regressions and verifier skills are removed.

The existing hygiene ratchet remains selected coverage, not full ESLint, formatting, dead exports, per-file debt or folder limits. No check was weakened, no source baseline raised, and no game code edited. Actual command results and any environment limits belong in this PR's proof rather than an unsupported readiness claim.

## Browser proof and base fixture

The v3 browser contract supports available cloud browser tools or headless Playwright directly. The vendored `touch.mjs` launcher uses a macOS Chrome path and is not a Linux cloud adapter. For WebGL, use Chromium flags `--use-gl=swiftshader --enable-unsafe-swiftshader`; check 390x844 and 1440x900, including interrupted/repeated flows. Cloud browser-to-executor routing is now available through a verified same-source fixture bundle. Each product head still needs its own independent proof; this source-only update does not certify either pending product PR.

Base fixture: `npm ci`, `npm run assets:fetch`, `npm run dev -- --host 0.0.0.0`. Fresh profile, offline audience behavior, no account or secret. Public v7 QA saves cover romance, jealousy, intrigue and demotion. Hosted art recovery/hash verification remains mandatory. Publish only to the existing game site after required gates, with rollback source/assets available.

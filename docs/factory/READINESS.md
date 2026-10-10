# Factory readiness

Status: setup only; autonomous dispatch disabled. No scheduled or paid jobs were launched, webhook secrets installed, or public deployment changed.

## Available
- Existing npm typecheck/tests/build and pinned asset recovery.
- All-Sol roles, parent assistant ownership, factory issue/PR contracts and preserved game rules.
- Pure activation guard and behavior tests, which hold dispatch even if enabled is accidentally toggled. Vendored dispatcher --apply/--ack and usage-meter CLI/imported entrypoints stop before any upstream action/session-log read.
- Source hygiene ratchet for selected measurable debt; it is not full ESLint, formatting or dead-export coverage. Counts are aggregate: removals can offset additions, and oversized-file growth, scripts/tests, folder limits and per-file debt are not measured.

Upstream cloud coordination issue: https://github.com/alim888aa/agent-org/issues/17 .

## Activation blockers
1. Cloud launcher supporting lifecycle, deduplication and cancellation, without laptop/T3 assumptions. Existing native-agent tools have no verified USD usage or max-cost control.
2. Supported per-request cost accounting and reservations across owner, workers, lenses, verifier, research, retries and tool charges. Preserve $100 total refactor phase separately from $30 UTC-day ongoing phase. Unknown usage holds every job; no p0 exception. Do not read denied local session logs. A JSON limit is not enforcement.
3. Exact-head cloud browser fixture accessible to the independent verifier. Local Chrome socket access and cloud-to-executor reachability are currently blocked.
4. Full formatter, ESLint, dead-code and expanded test/script typechecks with honest committed debt baselines. No new dependency installation was necessary for this draft.
5. A supported publishing command for the existing site, verified rollback and live asset CORS/GLTF proof. Existing public URL is fixed; no preview site elsewhere is authorized.

## Manual parent dispatch

The parent assistant can coordinate already-authorized issue writing and draft PR preparation using GitHub connectors and this cloud workspace. Manual coordination preserves owner/manager/worker separation and reports exact-head checks. It does not create a real USD meter, waive the ceilings, or authorize unmetered ongoing autonomous execution. No scheduler is installed.

## Minimal adapter
Keep upstream GitHub labels, machine-readable links, exact-head factory/check status, review lenses and product owner decisions. Adapt only launch/list/resume/settle, fixture startup/browser reachability, and cost admission. Do not port the entire T3 runtime or install stock webhook secrets. No persistent scheduler starts while any blocker remains.

## Check command
`npm run factory:check` runs hygiene, factory guard tests, existing application check and production build. It reports implemented checks only. A green result does not enable dispatch.

## Base fixture
`npm ci`, `npm run assets:fetch`, `npm run dev -- --host 0.0.0.0`. The base is a fresh browser profile with no campaign and offline audience behavior. Existing public/qa v7 saves provide romance, jealousy, intrigue and demotion states. No accounts or secrets are required. Fixture browser readiness remains false until the verifier can actually reach this process on its exact commit.

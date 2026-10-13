# Audit metrics

## Data

- The `factory-metrics` D1 database, filled each tick by the dispatch
  skill's `metrics.mjs`: `work_items` (outcome, review rounds, pings),
  `agent_runs` and `run_days` (cost per run and day, by job) and
  `daily_stats` (spend, merges, cost per merge). Query it through the
  HTTP API, never with cost queries on Wrangler's command line.
- Project totals: `node <dispatch skill folder>/usage.mjs --root <main
  checkout> --date YYYY-MM-DD`.
- Costs are estimates. Spend you can't attribute is unknown, not zero.

## Trust

- **Proof held up**: of the PRs merged in the window and the 14 days
  before, which later had a bug (a `Regression of #<PR>` line or other
  clear cause). Split each into proof was wrong or a gap, and count the
  bugged PRs whose worker skipped review or the hunt.
- First-pass acceptance, and the real bugs each job caught.

## Throughput

Non-p0 merged PRs and done issues against spend and `budgetUsd`.

## Value

Issues closed as not planned, duplicate, reverted or superseded, and
PRs closed unmerged, are **Thrown away**. Grade up to 30 of the rest at
random:

- **High**: fixes something major, or makes the code easier for agents
  to work in.
- **Medium**: useful, not urgent.
- **Low**: nobody would notice either way.

Name the sources that keep making Low and Thrown away work.

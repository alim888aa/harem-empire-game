# Factory metrics v1

One remote D1 database, `factory-metrics`, holds mechanical factory facts for
all projects. `skills/dispatch/wrangler.jsonc` records the account and database IDs, not secrets,
and travels with installed dispatch skills.
The dispatcher runs `skills/dispatch/metrics.mjs` after normal work:

```
node /path/to/agent-org/skills/dispatch/metrics.mjs --repo owner/repo --root /path/to/main-checkout
```

The script needs Node 24+, `gh` authenticated for the repository, and `sqlite3`
for optional read-only T3 metadata. It uses the laptop's existing Wrangler OAuth
login at `~/Library/Preferences/.wrangler/config/default.toml`. For an expired
login it reuses Control Center's installed Wrangler 4.149.0 to refresh. Set
`FACTORY_METRICS_WRANGLER` for another installed `wrangler.js` path; if neither
is available, it tries `npx --no-install wrangler whoami`. No install, Worker, cron, API subscription or paid service is added.
Cloudflare's D1 free allocation is sufficient for this metadata workload; the
writer batches GitHub reads, uses indexed incremental windows and never enables
a paid plan. D1 free limits: https://developers.cloudflare.com/d1/platform/pricing/.

Apply schema migrations using an installed Wrangler:

```
npx --no-install wrangler d1 migrations apply factory-metrics --remote --config /path/to/agent-org/skills/dispatch/wrangler.jsonc
```

## What is written

- Projects: `factory.json` supplies `owner` and `budgetUsd`; absent metadata
  leaves the budget null. The repo slug is a stable ID across different machines.
- Runs: the existing `usage.mjs` parsers and `prices.json` supply token counts
  and pricing, including caches, counter resets, streamed Claude blocks, and
  conservative rates for unknown models. These are API list-price equivalents
  for flat-fee local plans, so `estimated=1`, not cash invoices. Tool fees and
  provider charges absent from the logs cannot be measured here.
- Codex completion/abort events carry native turn IDs. Each session/turn/model/
  project has one stable source key; resuming a session records a new attempt.
  Continuation files are merged before pricing to share cumulative baselines.
  Claude human/dispatch prompt UUIDs split turns (tool results do not); T3 run
  timestamps establish completed versus active turns. Missing prompt boundaries
  use T3 run intervals when available, otherwise session/model/project/day rows.
  Replays retire alternate cumulative/day/T3 keys for the parsed session/model
  in both directions, including when metadata becomes unavailable again. Each message is priced on its own
  usage timestamp, so long-lived sessions never dump lifetime spend on one day.
  Old cumulative Claude rows are retired on replay. Nested Claude subagent logs
  have distinct source keys and can recover their own native subagent identity.
- The laptop adapter opens `~/.t3/userdata/statev2.sqlite` with `sqlite3
  -readonly`. It reads `orchestration_v2_projection_threads`, provider threads,
  runs, subagents, `projection_projects` and `projection_thread_pull_requests`.
  Thread JSON supplies `linkedPullRequest`, `branch`, `worktreePath`, and
  `lineage.parentThreadId` / `lineage.relationshipToParent`. This is a verified
  local projection schema, not a versioned public script API; schema changes
  produce a sanitized metadata-unavailable note and cwd-only fallback.
  `nativeThreadRef.nativeId` joins the provider log ID to the app thread.
  Native subagent IDs also recover parent thread ownership. The shared Codex
  **provider session** is never used as a mapping: it serves many threads.
- Work-item attribution prefers the selected `linkedPullRequest` (otherwise
  one direct PR link), then the thread branch's PR or `type/123-slug` issue,
  then the exact `Factory · #123` / `Factory · parent #123` worker title.
  Review/hunt titles can name `PR123`, `PR #123`, or a leading `#123`;
  otherwise a `subagent` inherits its parent's work item, recursively with a
  cycle guard. Forks do not inherit. Cwd/worktree evidence is the last fallback.
  Manager, owner, dispatch, triage, audit and research are overhead with job set
  and work item null, even under a worker parent. The current roles are
  `review` and `hunt`. Old review-lens titles are read as `review`; old
  verifier titles become `unknown`, and their spend is kept.
  Explicit project cwd overrides an inherited T3 project; its branch is not
  borrowed. Worker/fix round is one plus earlier distinct worker/fix attempts
  on that item, including previously imported attempts and ignoring model
  splits/replays. Reviews retain explicit rounds or use the prior worker count.
  Ambiguous links/branches and missing evidence stay null. Reused threads with
  multiple PRs consider the completed turn's full start/end interval: one PR
  linked during the turn takes precedence over an earlier link; several new
  links or missing timing evidence stay null. Otherwise the latest link before
  the turn applies. Branch/title projections are current, so older
  unrelated work without a preserved PR link remains a recovery gap.
- A native terminal event supplies the outcome. A session without terminal
  evidence is imported only after 30 minutes without usage, with outcome
  `unknown`, and is replaced if it later resumes. Active attempts are deferred.
- GitHub REST lists issues/PRs updated since the checkpoint and pages all label
  events and comments. It reads PR additions/deletions and merge facts, issue
  close reasons, explicit duplicate/reverted/superseded labels, and closing
  references. Each refreshed PR's closing references are atomically replaced,
  including clearing them when its body no longer closes any issues.
  Uncached thread branches also look up all-state PR heads, so
  unchanged older PRs remain attributable. Source comes from a `source:` body marker, earliest source label,
  or current source label; otherwise unknown. Priority uses `p0`–`p3` labels.
- `review_rounds` counts completed `fixing` → `reviewer-ready` bounces, excluding
  the initial review. Ping counts sum label additions and explicit request
  comments (`needs-human`, `needs-manager`, `needs-owner`, `@owner`, or
  `Owner request:` at the beginning of a line). A label plus its request comment
  is two recorded signals; ordinary mentions and quoted decisions do not count.
  Requests sent only inside T3 are unavailable to the GitHub writer.
- Audit judgment (`value_grade`, `value_why`, `audit_id`) is never in a writer
  update. Audits/findings tables are provided for the follow-up audit writer.

## Dates, totals and retries

All v1 projects use Asia/Ulaanbaatar (UTC+8). `run_days` records costs on the
local day tokens were used, so midnight-spanning runs don't move yesterday's
spend into today. `daily_stats` reports spend/P0/thrown-away dollars on usage
days, merged PRs and completed issues on completion days, and median/average
**lifetime attributable** cost of changes merged that day. Issue cost is added
to a merged PR only when a closing reference links that issue to exactly one PR.
Unknown attribution stays in spend and is excluded from per-change/P0 costs.
A PR with no priority inherits P0 only from exactly one closing issue.
Thrown-away work is a closed unmerged PR or an item explicitly not planned,
duplicate, reverted or superseded. A normal completed issue is not thrown away.
A reverted merge contributes only to thrown-away totals, not merged changes.
A completion-only day appears even if there was no spend on that day.

The first sync considers logs modified since local midnight and GitHub items
updated since midnight. Candidate logs are read in full to reconstruct lifetime
costs and daily slices. `--since <ISO timestamp>` seeds/backfills an earlier
window. D1 `sync_state` holds separate log/GitHub watermarks; a one-hour log
lookback catches quiet sessions whose final event preceded the previous wake.
Recent T3 terminal runs also pull in their native logs even if the last usage
was older than that lookback.
No watermark advances on partial failure. Upserts replace values, so replaying
or retrying a partially written batch does not add spend. Stable IDs also
survive T3 metadata becoming available on a later wake. Concurrent dispatch
writers on the same project should be avoided (one dispatcher per project).

The CLI has a 55-second deadline, aborts child commands and HTTP calls, emits a
sanitized note and exits zero on every error. Its output contains counts only.
Costs and SQL parameters stay in memory en route to D1; no local receipt,
metrics cache, SQL file, PR/issue/comment or repository contains them. Never
include D1 cost queries in Wrangler's command line/logs. Query D1 through the
HTTP API in memory when inspecting costs. Tokens are read from Wrangler's local
credential store; HTTP errors, log contents and credentials are never printed.


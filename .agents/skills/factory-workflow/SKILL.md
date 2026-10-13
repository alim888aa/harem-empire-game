---
name: factory-workflow
description: "The factory's shared rules: labels, statuses, who acts next and who decides. Read before running any factory job."
---

# Factory workflow

The dispatcher reads labels and starts whatever each issue or PR needs
next. In a dark project (`"owner": "agent"` in `factory.json`), also
read [DARK.md](DARK.md).

## Labels

Every issue and PR has one of each:

- `feature:*`
- `type:*`: `bug`, `feature`, `refactor`, `maintenance`, `plan`, `docs`,
  `idea`
- `source:*`: `plan`, `human`, `review`, `worker`, the project's
  monitors, and in dark projects `feedback`, `research`, `upkeep`
- priority: `p0` on fire, `p1` next, `p2` default, `p3` real but low
- a status from the tables below. New issues and the `Triage log` and
  `audit` issues have none.

Extras: `ui` for UI work, `human-comment` (the manager answers it and
removes it) and `possible-plan` (triage suggests it; the manager removes
it once the human decides).

## Statuses

| Issue | Next |
| --- | --- |
| `needs-human` | the manager brings it to the human |
| `needs-manager` | the manager decides |
| `blocked` | blocker done: `agent-ready`; not planned: `needs-manager` |
| `backlog` | nothing until the human reprioritises |
| `agent-ready` | the dispatcher starts a worker |
| `building` | a worker owns it through its PR |

| PR | Next |
| --- | --- |
| `reviewer-ready` | checks, then the reviewers the worker picked |
| `fixing` | the worker fixes, sets `reviewer-ready` |
| `blocked` | blocker done: the worker resumes |
| `approved` | the manager reads the proof, then merges, `human-ready` or `fixing` |
| `human-ready` | the human tries it and says merge |
| `needs-manager` | the manager decides |
| `needs-human` | the manager brings it to the human |
| `deployed:<env>` | a `watch` job checks it |

Checks green means the `factory/check` status is green on the head.

A plan is one `type:plan` issue per feature with a `Feature branch:`
line. Its PRs merge into that branch, and the parent PR takes it into
`main`. That's the only PR the human reviews.

## Bodies

Links go at the top, one per line: `Depends on #<n>`, `Part of #<plan>`,
`Blocked by #<n>`, `Closes #<n>`, `Base: <branch>`. Then
`## In plain words`: two or three sentences on what changes for the
app's users.

A bug a merged PR caused gets a new issue with `Regression of #<PR>`, at
least `p1`.

## Findings

Judge each one against **Realism** in `CONTEXT.md`:

- Real, caused by the PR: fix it in the PR.
- Real, outside the PR: a follow-up issue.
- Unlikely: one `backlog` issue per report listing them.

## Stuck

- Environment hiccup (healthguard hold, flaky tool, service down):
  comment the step to retry and stop. No issue, no workaround.
- A shared tool lacks a feature: request it with the tool's feedback
  command and carry on.

## Who decides

The human makes product and architecture calls and okays deploys and
production writes. Only the manager merges. When the human says "bundle
it" on their own work, open a PR, run review and the hunt, and merge on
their word.

## On GitHub

Start every post with `Author: <job> · <run id>`. Say "the human", never
"CEO". Quote the human as `> Human decision, verbatim: "..."`.

Stop every session, server and browser you started before you end a
turn.

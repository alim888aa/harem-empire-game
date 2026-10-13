---
name: factory-audit
description: Daily audit of one project's factory that finds what wastes money, stalls work or lets bugs through, and opens fixes to agent-org. Use when started as a project's audit job.
---

# Factory audit

Audit how the project's jobs work together, not its product code. What
to measure is in [METRICS.md](METRICS.md).

## 1. Gather

The window starts at the `Audit through:` time on the last
`<project> audit · <date>` issue in `alim888aa/agent-org`, or 24 hours
ago if there's none, and ends now.

Read everything from the window: the project's factory threads in your
harness, its PRs, issues, label changes and reports, and the metrics
data. Nothing new: post nothing and stop.

## 2. Find what's wrong

Look for what wasted money, stalled work or let a bug through. Drop
anything seen once unless it cost a lot. Check `mattpocock/skills` and
`cursor/plugins/pstack` for a known fix. Then sort:

- **Fix**: makes the factory better at what it already does.
- **Call**: changes what the factory does. The human decides.

## 3. Fix

Up to three PRs to `alim888aa/agent-org`, biggest cost first, branch
`audit/<date>-<slug>`, label `audit`. Make the smallest change that
removes the problem, following `skill-maker` for skill edits. The human
merges.

## 4. Report

One issue in `alim888aa/agent-org`, titled `<project> audit · <date>`,
label `audit`:

```
Audit through: <now, UTC>

Summary
<the biggest cost and what to change first>

Trust
<proof held up, and bugs that got through with who caught them>

Throughput
<per day: merged PRs and done issues, spend vs budgetUsd>

Value
<High, Medium, Low and Thrown away counts>

Fixes ready
1. <problem> — seen <n>× (<links>). PR #<n>.

Calls
1. <problem> — seen <n>× (<links>). <the choice>.
```

Send calls about the project itself to its manager too.

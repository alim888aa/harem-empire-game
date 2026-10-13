---
name: watch
description: Checks a deploy is healthy and files issues for what's wrong. Use when started on a deployed:<env> parent PR.
---

# Watch

Prove the deploy in `<env>` works and read what the monitors say. Only
observe and report. Redeploys and rollbacks are the human's call.

You're told the pass: **now**, just after the deploy, or **window**, at
the end of the env's `watchWindow`.

## 1. Read

Read the parent PR, its plan's flows and the GitHub Deployment record.
From the config, read `deploy.<env>` and `monitors`. With no test
account, walk flows read-only.

## 2. Check

1. **Version:** every piece the Deployment names runs the deployed SHA.
2. **Flows:** walk each plan flow on `<env>`, screenshot the end state,
   and prove each write's side effect.
3. **Monitors:** compare each one against its baseline since the deploy.
   Recheck anything that looks transient.
4. **Rollback criteria:** if any fired, set `needs-human` and `p0` right
   away, before the report.

## 3. Report

One comment on the parent PR per pass:

```
Watch: <env> · <sha> · <now | window>
Verdict: clear | findings | blocked | needs-human

Version
- <piece> · ok | STALE <sha seen>

Flows
- <flow> · ok | W<n> · <screenshot> · <side effect checked>

Monitors
- <monitor> · ok | W<n> · <number vs baseline>

Not covered
- <what you couldn't check, and why>
```

`blocked` means `<env>` is unreachable, a monitor is silent, or the
Deployment doesn't match what's live. `needs-human` means a rollback
criterion fired, or a flow needs more than the test account allows.

Each finding `W<n>` becomes an issue, unless an open one covers it. Then
comment there instead. The issue gets `type:bug`, `source:<monitor>` or
`source:watch`, a priority (`p0` when users hit it), no status, the
evidence, and `Found by deploy <sha> to <env>`.

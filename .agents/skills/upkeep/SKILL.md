---
name: upkeep
description: Weekly cleanup of a dark project that deletes leftovers and files bloat as issues. Use when the manager's weekly schedule started you.
---

# Upkeep

Clean up the mess and slow bloat that jobs left behind. `factory-workflow`'s
`DARK.md` says what never gets deleted.

## 1. Remove directly

Check GitHub, the laptop, the project's threads and schedules in your
harness, and the cloud services the factory uses. Delete without a PR or
issue, and count what you delete.

- Delete anything git or a rerun can bring back.
- Delete anything else only if the factory made it and it's past
  `upkeep.keepDays` in `factory.json` (default 14) or nothing open links
  to it.
- Keep a cloud object's live version and the one before it.
- Not sure it's the factory's? Leave it and report it.
- Never delete the default branch, a plan's `Feature branch:`, or a
  branch an open PR merges into.
- Leave anything a busy thread's worktree uses.

## 2. File as issues

One issue per job-sized bundle, with `source:upkeep` and no status:

- Dead code, unused dependencies and duplicate helpers (run knip):
  `type:refactor`.
- Stale comments, workaround notes and placeholders get fixed or
  deleted, all in one `type:refactor` issue per run. Real unfinished
  work gets its own issue.
- Security fixes (`p1`) and major versions with a clear upgrade path:
  `type:maintenance`.
- Flaky tests and checks that got much slower: `type:maintenance`.
- Docs that no longer match the code, and rules nobody follows:
  `type:docs`.

## 3. Propose removals

A feature no client uses gets one issue: no caller, no feedback in 90
days, and nothing in the monitors. Label it `type:refactor`,
`source:upkeep`, status `needs-human`. Give the evidence and what
deleting it removes.

## Report

One comment on the `Triage log` issue:

```
Author: upkeep · <run id>
Removed: <n> branches, <n> worktrees (<size>), <n> threads, <n> cloud objects, ...
Filed: #<n>, #<n>
Proposed: #<n>
Left alone: <what you weren't sure about, one line each, or none>
```

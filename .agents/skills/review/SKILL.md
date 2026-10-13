---
name: review
description: The one code review of a PR, for real-user bugs, broken standards and code that doesn't earn its keep. Use when a worker starts it on a reviewer-ready PR, or on a human-led PR.
---

# Review

Read the code and run its tests. The hunt runs the app. Post one report
and return its verdict. Default to approve.

## Check

Read the PR body, its issue and plan, every quoted human decision,
**Realism** in `CONTEXT.md`, the diff, and the `CODING_STANDARDS.md`
and `ERRORS.md` sections it touches.

Scope is the lines this head adds or edits, plus callers whose behaviour
changes. On a human-led PR, **Behaviour the human approved** is the
scope. On a parent run, review only the commits and child PRs you're
named.

Block only on what you can show:

- a bug a real user would hit
- an acceptance item not met or not proven on real cases
- a broken `CODING_STANDARDS.md` rule, a crossed module boundary, or a
  structure that makes a named next change harder
- code you could delete without breaking anything

Everything else is a Note.

- A stored shape the plan didn't approve: return `needs-human`.
- A wrong approach: one blocking finding with `Needed: re-plan`, and
  return `needs-human`.

## Report

One comment on the PR. Leave out empty sections.

- After your first report, post only the change. Rule on each open
  finding, and add new ones only if the fix caused them.
- IDs never change or get reused.
- At most five Notes. The worker may ignore them.
- Follow-ups are issues you opened: `source:review`, no status.

```
Author: review · <run id>
Review: <head sha> · round <n>
Verdict: clear | findings | blocked | needs-human
Fixed: <IDs, "withdrawn" after any you dropped>
Open: R<n> — <what's still wrong>

Blocking
R1 <path:line> — <what goes wrong, for whom>. Evidence: <repro or proof>. Realism: <who hits it, how often>. Needed: <outcome>.
R2 <path:line> — <what's wrong with the structure>. Rule: <section: rule> | Boundary: <internals reached, entry to use> | Next change: <what gets harder>. Needed: <outcome>.

Notes
- <path:line> — <one line>

Follow-ups
- #<n> — <one line>

Unlikely
- #<n> — <the cases, one line>
```

---
name: issue-maker
description: Turn one agreed piece of work or one investigated bug into an issue. Use when cutting issues from a plan or writing up a bug.
---

# Issue maker

One agreed piece of work = one issue. The body template is in
[TEMPLATE.md](TEMPLATE.md).

## 1. Confirm the work

Create an issue only when you can confirm why it's necessary and you
can provide evidence or approved decision for the issue.

- Planned work: read the approved spec or ADR and link the exact
  sections.
- A bug: check the original evidence and include it as proof.
- Do not create issues for small annoyances and tooling or environment
  problems.
- A human decision goes in as `> Human decision, verbatim: "..."` with
  its source. Say so if it conflicts with the spec.

## 2. Write it

- Search open issues first. If one already covers it, update that one.
- Title: `<Feature> · <Type> · <what it does or what's broken>`
- Labels: `feature:*`, `type:*`, `source:plan` or `source:human`, and
  `p2` unless a priority was agreed. Add `ui` for UI work. Triage sets
  the status.
- Every Acceptance item says how it's proven: a video, screenshots, a
  test, or a command and its output.

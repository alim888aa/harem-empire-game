---
name: triage
description: "Sorts new issues into one-line cards the human decides on and keeps the backlog honest. Use when started on issues with no status, or for the Daily pass."
---

# Triage

Get new issues ready for a one-line human call. `factory-workflow` has
the labels and **Realism**.

You're told which run: **New issues** (below) or **Daily pass**
([DAILY.md](DAILY.md)). Read every comment and linked PR before changing
an item. A later decision may already settle it.

## New issues

For each issue with no status, highest priority first:

1. Unlikely by **Realism**: `backlog`, with one line why.
2. Tooling or environment problem: request it with the shared tool's
   feedback command, then close the issue linking the request. If only
   the human can fix it, post the exact steps, then set `needs-human`.
3. Small annoyance like a typo or a stray log: close it with one line.
4. An "investigate X" that only serves another issue: fold it into that
   issue and close it.
5. Same root cause: keep the clearest, fold in the others' evidence and
   close them as duplicates.
6. Shape the body: acceptance items, `Base:`, `Depends on`, `Part of`,
   **In plain words**, and settled comments written in. A refactor needs
   an item proving behaviour didn't change.
7. Label it `feature:*`, `type:*`, `source:*` and a priority. `p0` is
   only for live breakage, data loss or a blocked client. Add `ui` only
   when it has UI work.
8. Regression of a PR that's still open: post the bug on the PR, set
   `fixing` and close the issue. Of a merged PR: add `Regression of
   #<PR>`, at least `p1`, or `p0` if it's been deployed since the merge.
9. Plan children, and issues quoting a human decision for exactly this
   work, go `agent-ready`, or `blocked` if their links say so. Everything
   else gets a card.

## Cards

Post one comment, then set `needs-human`:

```
Card: <plain name> · <type> · <p0–p3> · <build now | backlog | close> — <one line why, and anything the human must answer>
```

Log one line per action in a single comment on the `Triage log` issue.

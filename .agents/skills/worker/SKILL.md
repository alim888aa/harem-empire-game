---
name: worker
description: Turns one agent-ready issue into one PR and carries it through its reviewers to approved. Use when started as `Factory · #<issue>`, told to resume a PR, or on a parent run.
---

# Worker

One issue, one PR. On a parent run (`Factory · parent #<plan>`), follow
[PARENT.md](PARENT.md) instead.

When told to resume, read the labels and your last comments and pick up
where you left off.

## Build

1. Read the issue, its plan, `CONTEXT.md`, `CODING_STANDARDS.md`,
   `ERRORS.md`, and the nearest `DESIGN.md` for UI.
2. If an acceptance item needs a product call, or a bug won't
   reproduce, comment why, set `needs-manager` and stop.
3. Build it. Prove every acceptance item on real repo cases. For UI,
   walk it with the `browser` skill and screenshot at 390 and 1440.
4. Run `pnpm check` and post the result as the `factory/check` status.
   A check that fails the same way on the base is a base failure: file a
   `type:bug` issue, list it under **Base failures**, and post
   `factory/check` green.
5. Open the PR with [PR-BODY.md](PR-BODY.md).

## Review loop

1. Pick this head's reviewers under `## Reviewers` (review, hunt, both or
   neither) with a one-line why.
2. Set `reviewer-ready` and start the picked `review` and
   `edge-case-hunter` subagents on the `factory.json` `review` and `hunt`
   models. Give them only the repo, PR, head SHA and round. Wait for all
   of them.
3. Answer each blocking finding under its ID: fix it, or decline it with
   a one-line reason. If you changed anything, set `fixing`, push, and go
   back to 1.
4. When every picked reviewer has reported, every blocking finding is
   fixed or declined, and checks are green, set `approved` and stop. The
   manager merges.

If a reviewer returns `blocked`, set `blocked` with its `Blocked by`
line. If one returns `needs-human`, or a finding rightly says the
approach is wrong, comment why, set `needs-manager` and stop.

For conflicts, merge the base in. Never rebase or force-push.

## Stopping

Cancel your subagents, commit and push, and send `Factory · dispatch`
`finished #<issue>`. Push even without a PR.

On an environment hiccup (healthguard hold, flaky tool, service down),
comment the step to retry, leave the labels and stop. Dispatch resumes
you. The same hiccup twice in a row: `needs-manager`.

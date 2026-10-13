---
name: dispatch
description: Starts the factory's jobs from what the dispatch-plan script prints. Use when woken in a project's dispatch thread.
---

# Dispatch

You are `Factory · dispatch`. `dispatch-plan.mjs`, next to this file,
decides everything. You run it and make the T3 calls it prints.

## Every wake

1. **List threads.** Call `t3_thread_list` twice, every page,
   `includeSubagents: true`. Once with `titleContains: "Factory ·"`, once
   with `statuses: ["preparing", "queued", "starting", "running",
   "waiting"]`. Merge by `threadId`, keeping `threadId`, `title`,
   `status`, `settled`, `parentThreadId` and `createdAt`.
2. **Plan.** From the main checkout, pipe that list as JSON to:
   ```
   node <this skill's folder>/dispatch-plan.mjs --repo <owner>/<repo> --apply [--finished <n>] [--tick]
   ```
   Add `--finished <n>` when a worker sent `finished #<n>`, and `--tick`
   when the 10-minute schedule woke you.
3. **Make the calls.** On `stop`, skip to step 4. Leave `held` entries
   alone. Make each `t3` entry's call, in order:
   - `launch`: `t3_thread_launch` with this project and the entry's
     `title`, `workspaceStrategy`, `modelSelection`, `runtimeMode` and
     `message`.
   - `resume`, `tell-manager`: `t3_thread_send` to `threadId` with
     `message`.
   - `settle`: `t3_thread_organize` with action `settle` on `threadId`.
     Then run `dispatch-plan.mjs --settle-result <threadId>` with
     `{"ok":true}` or `{"error":"<exact T3 error message>"}` on stdin.
   - `triage`, `research`: `delegate_task`, async, with `title`, `task`,
     the entry's model as `target` (`providerInstanceId` is
     `instanceId`) and `runtimeMode: full-access`.
   - An entry with an `ack`: after its call succeeds, run
     `dispatch-plan.mjs --ack <ack>`.
4. **Metrics.** Run `node <this skill's folder>/metrics.mjs --repo
   <owner>/<repo> --root <main checkout>`, even after `stop`. Carry on if
   it fails.

Make exactly the calls the script printed, with its arguments. If an
entry looks wrong, skip it, tell the manager which entry and why, and
make the other calls.

## Budget

- `budgetUsd` in `factory.json` caps daily spend. Once it's reached,
  only `p0` starts.
- Run the planner on the live `factory.json`, never a copy.
- The usage guard never overrides `budgetUsd`. Only the human changes
  it.
- Keep costs out of repos, PRs, issues and comments.

## Gotchas

- If a `launch` errors or loses its answer, look for its title in
  `t3_thread_list` before retrying. Two workers on one issue is the
  costly mistake.
- A lost `settle` answer counts as an error.

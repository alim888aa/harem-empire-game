# Parent runs, parent PRs and deploys

## Parent run due

On `Parent run due for plan #<n>`, launch a thread titled
`Factory · parent #<plan>`:

- a new worktree from the plan's feature branch, started from origin
- the `build` model from `factory.json`, full access
- message `Follow the worker skill's parent run on <owner>/<repo>#<plan>.`

A plan with one child skips the run. Open the parent PR yourself and set
`human-ready`.

## Human-ready parent PR

Read every child's proof, the parent's **Proof** and **Assumptions**,
and the newest review and hunt on its head. Tell the human what's proven
and every open gap with the merge question.

On "merge": merge into `main`, close the plan issue, settle the
`Factory · parent` thread, remove its worktree and delete the feature
branch.

## Deploy

On "deploy <env>", for merged work only:

1. An open `Regression of #<PR>` issue for a PR going out holds the
   deploy. Tell the human which.
2. Run the project's deploy, record a GitHub Deployment, and set
   `deployed:<env>` on the parent PR.
3. Start a `watch` subagent for its **now** pass. Start another for the
   **window** pass once the env's `watchWindow` has passed.

A live `p0` regression goes to the human right away, with "revert now"
first.

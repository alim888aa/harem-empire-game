# Dark projects

With `"owner": "agent"` in `factory.json`:

- **The owner stands in for the human** on product calls, triage cards,
  parent PRs, unproven acceptance, steps no agent can do, and **Worth a
  plan?** suggestions. Send them to `Factory · owner` in batches, each
  with the call and your recommendation. Comment `Asked the owner.` on
  each item.
- The owner replies `decided #<n>`. Set the status its decision implies.
  `merge #<n>` and `deploy <env>` from it count as the human's word.
- Send `human-comment` items to the owner as `human-comment #<n>`.
- **Merge more yourself.** When an auto-merge check fails, merge anyway
  if nothing a client sees changes, or an owner decision accepted every
  behaviour change. Otherwise send it to the owner. Any change to **Must
  never break** in `CONTEXT.md` goes to the owner.
- **Upkeep:** a weekly schedule in your thread starts the `upkeep` skill
  as a subagent. Its removal proposals are product calls.

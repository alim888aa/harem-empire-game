# Clients

You decide what gets built. A blocked client is `p0`.

## The human

- Before planning a broad ask, ask at most three product questions the
  code, `CONTEXT.md` and your decisions can't answer. Give your suggested
  answer to each. Ask one round only.
- Their answers go on the plan as `> Human decision, verbatim`.

## `human-comment #<n>`

Answer on the item as the manager's `COMMENTS.md` says.

- A decision goes on as `> Human decision, verbatim` linking their
  comment. Send the manager `decided #<n>`.
- A merge or deploy goes to the manager as `merge #<n>` or
  `deploy <env>`.
- Remove the `human-comment` label last.

## Agents

Agents file `source:feedback` issues. Their feature requests reach you
as `needs-human`.

- Decide on the need behind the request, not its exact fix.
- Weigh every client of the tool.
- A request that pulls against `CONTEXT.md` is a no, or a council call
  if many want it.

## Worth a plan?

Decide as **Deciding** says. On yes, plan it as **Asks into work** says.
Quote the decision on the issues and send the manager `decided #<n>` for
each, with the plan link on yes.

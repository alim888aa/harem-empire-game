# Issue body

```markdown
Part of #<plan>
Depends on #<n>
Base: <branch>

## In plain words
Two or three sentences for the human.

## What
What happens today and what should happen.

## Why
The spec or ADR sections, the bug evidence, or the human decision.

## Acceptance
- [ ] <what works> — proof: <video | screenshots | test | command → output>
```

Leave out lines that don't apply. Dispatch reads `Base`, `Part of` and
`Depends on`, so keep them exact. A plan child's Base is the plan's
feature branch.

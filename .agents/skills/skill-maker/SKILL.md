---
name: skill-maker
description: Writes, edits and reviews agent skills so they stay short and readable. Use when creating or changing a skill, or reviewing a skill change.
---

# Skill maker

Agents are smart. A skill holds only what they'd get wrong without it.

## Keep

- Anything a script or another tool reads, word for word.
- Decisions an agent couldn't guess.
- Fixes for real mistakes. Add one when an agent trips, never in
  advance.

## Cut

- Anything an agent would do anyway.
- Edge cases nobody has hit yet.
- Explanations, examples, hedges and parentheticals.
- Anything said twice.
- Tool, model and vendor names. Let the agent pick its own tools.
- The user's personal preferences. Those belong in their own agent
  instructions.

## Write

- Short steps and plain bullets, one idea each, in full sentences.
- No preamble.
- Say each rule once. Rules that disagree make some models stall.

## Reviewing a skill

Only flag what would break something. A rule an agent would work out on
its own isn't a finding.

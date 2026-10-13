---
name: council
description: Weighs a dark project's big call from several angles before the owner decides. Use when you're the owner with a big call, or one of its angles.
---

# Council

Each angle is one fresh subagent that argues its side once. The owner
decides.

## Angles

Set in `factory.json` under `council`, each on its own model.

- **client**: every client, not just the one asking. Reads the human's
  words, `source:feedback` issues, and the skills and scripts that call
  the tool. What's the need, who else has it, who would this hurt?
- **maintainer**: what it costs to build and keep forever, the simplest
  version, and what could be deleted instead.
- **Extra angles** carry their own one-line `brief` in the config.

## Running one (owner)

1. Ask every angle at once with the call, the options and evidence
   links. Leave out your own pick.
2. Plans only: send each angle the others' answers for a short rebuttal.
3. Decide and post:

```
Author: owner · <thread id>
> Owner decision: "<the call>"
Council: client — <its pick and why>; maintainer — <same>; <extra> — <same>
```

## Answering (angle)

Read the linked evidence and `CONTEXT.md`. Your whole output, under 120
words:

```
Angle: <name>
Take: <one or two sentences from your angle>
Recommend: <one of the options, a new one, or no>
Cost: <what your recommendation costs or risks, one line>
Would change my mind: <one line>
```

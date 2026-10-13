# Dark factory setup

## Starting it

Setup runs in the project's `Factory · owner` thread.

- It exists: send it `Follow setup-factory for a dark project on
  <owner>/<repo>.` and stop.
- It doesn't: launch it on the project root, full-access, on the owner
  model the human picks, with that message. Tell the human it started
  and stop.

## What changes

- **Nobody to ask.** Make each call yourself and list it under
  **Assumptions**. Product facts come from the clients.
- **`CONTEXT.md`** gets three more sections, and the owner corrects
  **Realism** itself:
  - **Clients**: who asks for things, and which agents call the tool
    from which skills and commands.
  - **Must never break**: the commands and flows clients depend on, and
    where each is called from.
  - **Direction**: at most ten lines on what the tool is becoming and
    what it won't do.
- **Feedback command**: if the tool has one, it files issues here with
  `source:feedback`. If not, file an issue for it.
- **No UI**: the `base` fixture is a scratch folder set up the way
  clients use it.
- **`factory.json`** adds:

  ```json
  {
    "owner": "agent",
    "budgetUsd": 50,
    "jobs": {
      "owner":    { "provider": "claudeAgent", "model": "claude-opus-5-5",   "effort": "high" },
      "watch":    { "provider": "codex",       "model": "gpt-6.1-sol",       "effort": "high" },
      "research": { "provider": "claudeAgent", "model": "claude-opus-5-5",   "effort": "high" },
      "scout":    { "provider": "codex",       "model": "gpt-6.1-sol",       "effort": "high" }
    },
    "council": {
      "client":     { "provider": "codex",       "model": "gpt-6.1-sol",       "effort": "high" },
      "maintainer": { "provider": "claudeAgent", "model": "claude-sonnet-5-5", "effort": "high" }
    },
    "upkeep": { "keepDays": 14 }
  }
  ```

  Only the human changes `budgetUsd`. Extra council angles carry a
  one-line `brief`.
- **The owner merges the setup PR** once `pnpm check` is green.
- **Wire it up** as usual, skipping the owner thread. Then add two
  schedules, each bound to its own thread:
  - manager, Wednesdays at 08:00: `Follow the manager skill's Dark
    projects: upkeep.`
  - owner, Fridays at 08:00: `Follow the owner skill's Research.`
- **Done** is the owner's return line. The human hears nothing.

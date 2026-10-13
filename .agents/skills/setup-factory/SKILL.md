---
name: setup-factory
description: Gets a project ready for the factory in one setup PR, then starts the factory threads and schedules. Use when the human asks to set up a factory or dark factory on a project, or an owner is told to.
---

# Setup factory

Run once per project, in chat with the human. Everything goes on branch
`chore/factory-setup` as one PR the human merges.

- Dark factory: read [DARK.md](DARK.md) first.
- Setup ran before: read [RERUN.md](RERUN.md) first.

## 1. Look and ask

Read the repo, including every agent instructions file the jobs will
see, parent folders too. Ask the human about models, the file limit,
strict-check folders, protected features and the base fixture.

## 2. Build

- **Docs**: [DOCS.md](DOCS.md).
- **Fixture**: `localdev` with `local.adapter.mjs` and a `base` fixture
  that boots with known accounts and data. App code stays as is.
- **Checks**: one `pnpm check` running format, typecheck, lint, tests,
  import boundaries, dead code and the `ERRORS.md` rules. It's strict on
  the folders the human picks. Elsewhere a committed ratchet file holds
  one count per rule, and a PR may only lower it.

A project that can't boot a fixture can't join the factory yet.

## 3. Labels

Create every label in `factory-workflow`, a `source:*` per monitor, and
a `feature:*` per area the human names.

## 4. factory.json

At the repo root. The human picks the model for each job. These values
are examples:

```json
{
  "jobs": {
    "build":    { "provider": "codex",        "model": "gpt-6.1-sol",       "effort": "high" },
    "buildUi":  { "provider": "claudeAgent",  "model": "claude-opus-5-5",   "effort": "high" },
    "review":   { "provider": "claudeAgent",  "model": "claude-opus-5-5",   "effort": "high" },
    "hunt":     { "provider": "codex",        "model": "gpt-6.1-sol",       "effort": "high" },
    "manager":  { "provider": "claudeAgent",  "model": "claude-opus-5-5",   "effort": "high" },
    "audit":    { "provider": "claudeAgent",  "model": "claude-opus-5-5",   "effort": "high" },
    "dispatch": { "provider": "codex",        "model": "gpt-6-luna",        "effort": "high" },
    "triage":   { "provider": "claudeAgent",  "model": "claude-sonnet-5-5", "effort": "high" }
  },
  "smallChangeMaxFiles": 10,
  "protected": ["feature:payments"],
  "paths": { "schema": ["src/**/schema/**"], "ui": ["src/**/components/**", "src/app/**"] },
  "maxParallel": 2,
  "deploy": {
    "preview": {
      "run": "pnpm deploy:preview",
      "url": "https://...",
      "testAccount": "<name of the fixture account allowed there, or null>",
      "watchWindow": "24h",
      "rollback": ["error rate over 2% for 10 min", "checkout flow fails"]
    }
  },
  "monitors": { "posthog": { "project": "...", "baseline": "7d" } }
}
```

- `ui` issues build on `buildUi` and the rest on `build`. An all-UI
  project sets only `build`.
- Use the provider and model ids your harness lists.
- Propose `paths` from the folder layout.
- Leave out `deploy` and `monitors` unless the factory deploys the
  project.

## 5. Housekeeping

- Edit agent instruction lines that fight the factory, like one that
  forbids commits when checks fail. Lines outside the repo go to the
  human.
- Add `.scratch/` to `.gitignore`.
- Pin one issue titled `Triage log`, labelled `type:maintenance`.
- Install skills with `npx skills@latest add alim888aa/agent-org` and
  update them with `npx skills update --project`.

## 6. Wire it up

This thread must be full-access, because launched threads can't have
more. Launch each thread on the project root, full-access, on its job's
model.

1. `Factory · dispatch`. Its first message asks it only to create two
   schedules bound to itself:
   - every 10 minutes: `Follow the dispatch skill with --tick.`
   - daily at 09:00: `Start a triage subagent with delegate_task, async,
     title "Factory · triage", the triage model from factory.json,
     full-access, task "Follow the triage skill, Daily pass."`
2. `Factory · manager`, with no schedule.
3. `Factory · audit registration`, on the `audit` model. Its only job is
   to create the `Factory · audit` schedule for this project, bound to no
   thread, daily at 08:00, with the prompt `Follow the factory-audit
   skill.` It reports the schedule's id and next run, then stops.

## Done

Tell the human what you wrote, what you couldn't do and the PR link.
Work starts once they merge it. From then on they talk to the factory in
the manager thread.

## Gotchas

- A schedule takes its model from the thread that creates it, so the
  audit schedule needs its own thread. Switching this thread's model
  instead interrupts your turn.

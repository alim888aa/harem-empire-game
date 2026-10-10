# Coding standards

Read this before changing or reviewing code. It explains how the code should
be written; the factory skills explain how agents work. Some existing code
still needs cleanup to meet these rules; reviewers judge the lines a change
adds or edits, not the whole repo.

Use the words from [CONTEXT.md](CONTEXT.md) in names, comments and copy. The
**Project** section at the end holds what's specific to this repo and wins
over the general rules above it.

## Where code belongs

- `src/app` holds routes, layouts, metadata and thin wiring files.
- Feature-owned code lives under `src/features/<feature>/`. Use `components/`,
  `server/`, `schema/` and `types.ts` as the feature needs them, without empty
  folders.
- `src/components/ui` holds low-level shadcn primitives.
- `src/components/shared` holds the app's own UI reused by three or more
  features. It may take feature data through props, but it never imports a
  feature or owns feature data or backend rules.
- `src/lib` holds general helpers that don't belong to a feature.

Imports flow from `app` into features, then into shared UI, `ui` or `lib`. Shared
folders never import features. When two features reuse the same UI, keep it with
the clearest owner and move it to shared when a third feature needs it.

## Front doors

Give each feature a small public interface through explicit entry points: a
browser-safe `index.ts` and a separate `server/index.ts` when it has server code.
Export the supported operations and their input, result and error types. Keep
database queries, providers and workflow helpers internal.

Other code imports a feature only through those entry points, never its internal
files. Callers request a complete action, such as `createListing(input)` or
`follow(uid)`. The owning module handles variants, permissions, validation,
duplicate requests, saved-data changes, cleanup and recoverable failures. Keep
HTTP parsing and response formatting in thin handlers.

Keep distinct actions explicit, such as `follow` and `unfollow`, so a retry can't
toggle state. Public input shapes don't need to mirror database columns. When
handing off a refactor, explain each module's responsibility and its exports.

## Deep modules and reuse

Keep the complicated work behind the front door. A caller should be able to use
a feature without learning how its queries, queues, validation and follow-up work
fit together. For example, a search feature saves a result to a collection by
calling the collection's public operation, without knowing its database rows.

Build each module like a well-designed library: one clear responsibility, a
small public API, and each call doing one complete action. Don't add wrappers
that only pass calls along, or abstractions with only one implementation. Avoid
modules that import each other; move the shared piece to the module that owns
it. Test through the public API, not private files.

Keep the rules for each behaviour in one module. Before adding a function or
component, check whether one already does the job and extend it when that makes
sense. Group internal files by what they do, in meaningfully named subfolders.

## Keep complexity down

Start with the simplest change that does what we need. When cleaning up, look
for things to remove or combine before adding another layer.

- Give every wrapper a clear job. Remove functions that only forward the same
  arguments and return the same result.
- Keep each decision in one place. Callers reuse the result instead of repeating
  the same approval, validation or retry rule.
- Keep call chains short. If one operation means opening several files that only
  hand work to the next, collapse those steps.
- Before passing another yes/no option through several functions, find the module
  that owns the decision and let it decide.
- Keep state close to its owner. Derive values from existing state instead of
  storing a copy that must be kept in sync.
- Add options and settings only when real code needs them.
- Handle the failures the issue names, the ones your change breaks and the ones
  a real user can hit through normal use. Don't add code, tests, test helpers or
  fixtures for combinations beyond those.
- Use early returns to reduce nesting. Write steps out when squeezing them into
  one expression makes them hard to follow.
- No unused code. Delete files, exports, functions, components, types, styles,
  scripts and dependencies that nothing uses, including code your change leaves
  unused. Don't keep old code "just in case" or behind a flag nobody sets; Git
  history keeps it. Before deleting, check every caller, including tests,
  scripts, workers and dynamic imports.

## Files and folders

- Keep each new handwritten file under 300 lines, tests and scripts
  included. An existing file over the limit may not grow; when you edit
  one, clean up the part you're changing.
- Keep at most ten handwritten files directly inside a folder. Subfolders have
  their own limit. Installed shadcn folders and generated code are exempt.
- Split by what the code does. Don't dodge the limits with pass-through helpers,
  numbered chunks or folders with no clear purpose.
- Name files and folders after their purpose, never a milestone number.
- Each module concerns one thing. Keep generated files out of Git when the
  normal development setup can recreate them.
- When you edit a file or folder over a limit, say so and clean up the part you
  are changing.

## React

Build public SEO pages as Server Components by default. Add client code only
where the browser interaction needs it.

Do not add `useEffect`, `useMemo` or `useCallback` without explicit human
approval; approval for one use doesn't cover others. Generated shadcn components
may use them internally. The approved ones are listed under **Project**, each
with a link to the approval.

Keep feature rules in the owning module and have components call it.

## UI and styling

Follow [DESIGN.md](DESIGN.md). It describes the tokens, page patterns,
components, loading and feedback the app already uses.

Build only the UI the task asks for. Never add buttons, banners, badges, helper
text or sections nobody requested. Reuse existing components and patterns before
building anything new, and turn a piece into one shared component when several
places need it.

## Comments and names

Name things after what they do, in the project's words. Good names should carry
most of the meaning, so comments stay few and short.

- Exported operations and types at a module's front door get a short JSDoc
  (`/** ... */`) saying what the caller gets, what it expects and what it
  guarantees. Internal helpers usually need none.
- Use `//` only for a reason the code can't show: a limit, a workaround or a
  surprising choice.
- Never restate the code, narrate history ("changed from X") or leave
  commented-out code.
- When you change code, update or delete every comment it makes wrong. A stale
  comment is a bug, and reviewers treat it as one.

## Errors

Follow [ERRORS.md](ERRORS.md): every failure is an error type that names a
pattern, and the pattern decides what happens. The error style (Effect tagged
errors, or error classes with one entry wrapper) is named there. Don't convert
untouched code just to switch styles.

Handle a failure where the code can do something useful about it. Keep enough
detail to debug it without exposing private data. Never turn an error into
success or an empty result.

A failure stops only the smallest piece it breaks: one bad item skips that item
and the rest keep going. Make sure the human hears about anything skipped or
stopped. Follow the `error-handling` skill for which response fits.

Every fallback, retry or compatibility path needs a stated reason. Check
untrusted input where it enters the system, then stop re-checking cases that can
no longer happen; keep checks that protect security, stored data or concurrent
work.

## Checks

Run the feature's relevant tests, TypeScript and ESLint, and confirm lint covers
the changed files. Never weaken a check or add a suppression to pass.

Pick checks that would catch what this change could break, including failures.
When you change a shared module or front door, check the features that use it.

Before finishing, reread your diff for unnecessary complexity: comments that
repeat code, redundant checks, catches that hide errors, casts that hide type
errors, extra nesting, and wrappers or options without a job.

Say what you checked, what failed and what you couldn't check. Before calling a
failure pre-existing, reproduce it on the original version.

## Project

<!-- Filled by setup-factory. What the general rules can't know about this repo. -->

- **Layers:** what `app`, features, shared and `lib` are called here, if not
  the defaults above.
- **Approved effects:** each existing `useEffect`, `useMemo` or `useCallback`
  the human approved, with the file and a link to the approval.
- **Exempt folders:** generated code and installed components the limits skip.
- **Anything else** the human decided that differs from the rules above.

## Sources

The complexity and cleanup rules borrow from
[Poteto's Laziness Protocol](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-laziness-protocol/SKILL.md),
[Poteto's Minimize Reader Load](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-minimize-reader-load/SKILL.md)
and [Cursor's deslop](https://github.com/cursor/plugins/blob/main/cursor-team-kit/skills/deslop/SKILL.md),
by way of kpop-city-connect's standards.


### Harem Empire project rules

- This is a browser-only Vite game, not a Next.js app. `src/components` owns screens; `src/lib` owns game rules; `src/state-machines` owns orchestration; `src/persistence` owns saves; `src/palace` owns three.js runtime; `src/ui` owns themed primitives and sound. Existing names remain until a cohesive deep-module refactor earns a move. No Server Components or shadcn migration is implied.
- AGENTS.md's specific rules and the latest product decisions in CONTEXT.md apply. New code has no `any`; seeded campaign randomness stays deterministic.
- Existing hooks are grandfathered for unchanged behavior, not retroactively represented as human-approved. New hooks need a recorded Owner decision with the concrete purpose and hook-free alternative. No blanket approval is created by this setup.
- Pinned upstream `.agents/skills` files are vendored contracts, exempt from handwritten size/style limits. Only trailing whitespace/EOF blank lines are normalized; runtime instructions remain subordinate to this project’s cloud/permission/budget rules.
- Existing large files/folders are ratcheted, not split into pass-through helpers. A touched area must become clearer without increasing its violations.
- Check command: `npm run factory:check`. `pnpm check` is the upstream factory name; this project deliberately retains npm and its committed lockfile.
- This setup does not certify lint/dead-code completeness. See docs/factory/READINESS.md for activation blockers.

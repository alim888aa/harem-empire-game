# September 30 revision: a quieter court, faction-only endings

This revision supersedes the earlier generic 100-support victory and dashboard layout described below.

- The main screen now has one courtier, one chosen gift/message, and one Send gift button. Choosing a tone is a preview, not an action.
- People opens the live roster. Court contains factions, invitations, progress toward three supporters, rules, and player stats. Native dialogs (including stats) make the background inert, focus their close control, and return focus to the trigger on dismissal.
- Character details and secondary/hostile actions are disclosed on demand. The current courtier’s response stays beside the action; plain gifts and insults clear stale dialogue.
- Each new season selects an approachable courtier. Deliberate navigation stays unchanged during the season.
- Promotion is still 80 empire support. At 100, unaffiliated players keep playing. Only Imperial, Loyalist, or Rebel membership plus promotion can lead to an audience ending. Existing faction endings and their questions remain unchanged.
- A refused audience waits until the next advancing season. Failure keeps its existing demotion but makes it real for that season; support totals remain unchanged and promotion/retry becomes available next season.

State-machine changes:
```ts
canBePromoted: ({ context }) =>
  context.supportPoints >= 80 && context.rank === null && !context.emperorAudienceCompleted
// The old canBeEmperor transition at 100 support is removed.
// REFUSE_AUDIENCE and unsuccessful audience set:
emperorAudienceDeferredUntilSeason: ({ context }) => context.season + 1
// On season advance, failure becomes retryable:
emperorAudienceCompleted: ({ context }) =>
  context.emperorAudienceOutcome === 'failure' ? false : context.emperorAudienceCompleted
```
The former dormant unaffiliated survivor eligibility is removed. Ordinary suspicion defeat is unchanged. Joining a faction is accepted only for an outstanding invitation. Re-promotion checks the actor exists before stopping it; seasonal pools exclude already removed actors.

Presentation-only hooks: ActionButtons keeps the unsubmitted tone selection; CourtDialog uses a ref/effect for native modal lifecycle; the existing GameLayout/UI state holds which overlay is visible and selects an approachable actor once per season. Politics and relationships remain in XState.

Validation: `npm run build` passed; all 57 Node tests passed (the previous generic-victory assertion was replaced, 15 net cases added); `git diff --check` passed. Regression coverage includes each origin at 100 support without a faction, promotion on threshold overshoot, all three faction victories, invitations, no-rank eligibility, refusal, demotion/retry, execution, stale response clearing, and restart cleanup. See BROWSER_QA.md for actual desktop/narrow interactions and remaining limits.

---

# Court Intelligence

A strategy-focused update to Harem Empire, preserving its existing economy, characters, portraits, and victory conditions.

## Player-facing improvements

- Live court roster: select any active courtier directly and track support, influence requirements, and suspicion
- Clear objectives: promotion at 80 empire support, victory at 100, eligible faction guidance, and a tribute-reserve reminder
- Decision support: visible gift costs, disabled unaffordable actions, and message previews calculated by the real relationship engine
- Safer controls: hostile actions have a separate expandable area; keyboard navigation no longer captures browser shortcuts
- Palace presentation: forest, parchment, and brass styling; portrait-led origin selection; responsive court layout using original art
- Court responses remain readable on screen rather than disappearing after a few seconds

Previews show **direct** support, trust, and suspicion changes. They explicitly exclude delayed faction and cross-character reactions. Existing message behavior can reduce support previously earned through simple gifts; the preview shows that reduction honestly.

## State and correctness

Game state stays in the existing XState actors. New roster and audience components subscribe through `useSelector`; there is no parallel game-state store or new persistence layer.

The keyboard effect is presentation-only and remains unconditional across component render paths. Promotion notification tracking now runs in an effect instead of updating React state during render. Restart clears the presentation state.

Two lifecycle bugs found during integration testing were fixed:

1. Restart previously looked up child actors by unregistered system names, leaving old actors alive. It now stops each actual stored ActorRef before clearing context:

```ts
enqueueActions(({ enqueue, context }) => {
  for (const actorRef of Object.values(context.characters)) {
    enqueue(stopChild(actorRef));
  }
}),
```

2. Promotion now removes the replaced courtier from the active roster; restart clears the roster:

```ts
activeCharacterNames: context.activeCharacterNames.filter(
  name => name !== nameToRemove
)
// During restart:
activeCharacterNames: []
```

The only other machine edits are nullable-type guards in delayed cross-character handlers and removal of an unused import. No reward values, costs, suspicion thresholds, or victory rules were changed.

## Verification

- Production build (`npm run build`): passed, including TypeScript
- 42 tests: passed (23 helper tests and 19 state-machine tests)
- 480 message-preview comparisons across all three origins, all four choices, multiple personality branches, and trust boundaries
- Selection, active-roster initialization, gift costs/exhaustion, direct message effects, seasonal rotation, promotion, victory, restart, and suspicion reporting exercised through production actors
- Both lifecycle regression tests failed before their fixes and passed afterward
- No AI or other external network calls during tests
- Diff whitespace check: passed
- Runtime dependencies and lockfile unchanged

### Browser verification

The playtest is public at https://harem-empire-court-playtest.alimar55555.chatgpt.site.

Actual cloud-browser checks passed for all three role starts, simple gifts, message-preview outcomes, repeated gifting to an empty treasury, keyboard navigation, stats dismissal/Escape, faction panel open/close, next-season refill/roster rotation, suspicion defeat, and Play Again into a clean new origin.

Desktop layout was inspected at 1180 CSS pixels. Responsive layout was inspected at 472 and 393 CSS pixels using browser zoom, with no page-level horizontal overflow; a message action also worked at 393 pixels. Device emulation was unavailable, so this does not claim physical touch-device testing. No game-origin warnings/errors appeared in the captured browser logs (browser-extension errors were excluded).

See `BROWSER_QA.md` for observed results and remaining coverage limits.

### Run locally

```sh
npm ci
npm run dev
npm run build
```

The tests use Node's built-in runner with the TypeScript loader `tsx` (tested with 4.20.6). With that loader installed in your development environment:

```sh
node --import tsx --test tests/courtStrategy.test.ts tests/gameMachine.test.ts
```

The test tooling was run from a temporary npm cache during this task; it is not added to the project's dependencies.

## Remaining coverage

- Physical phone/touch input and exact 320-pixel rendering
- Browser playthrough to promotion, victory, faction membership, and the AI audience (the core promotion/victory lifecycle is covered by deterministic state-machine tests)
- Long-session balance and session persistence remain outside this update

## Existing gameplay behavior left unchanged

- Messages recalculate total court support from relationships
- Suspicion is stored in two fields; previews mirror current calculation behavior
- Reported-character counts remain cumulative
- An emperor tribute encounter can return to the same season
- Refusing an eligible faction audience can immediately offer it again
- The ordinary suspicion limit ends the game before the Survivor audience path is offered
- Progress is session-only

# Romance alongside court politics

## Tunable beta defaults
- Personal affection is a directed graph value, 0–100. Political support is independent
- Romantic gifts cost the recipient’s existing office-tier 1/5/10/20 gift price and add 15 affection, capped at100
- Ask to be lovers is a separate, free proposal. The recipient accepts at60 affection for the Prince and Scholar careers,85 for the Concubine career, and refuses while their hate toward the initiator is60 or more
- Acceptance is mutual recorded consent. High affection alone is not a relationship. A breakup is free
- Multiple lovers are allowed. Two NPCs who share an accepted lover gain20 hate toward each other when the new relationship forms and10 per committed season. One directed rivalry gains once per season even if multiple shared lovers exist
- NPC jealousy can occur inside a faction and between two allies pledged to the player. Existing NPC-to-player pledge/faction hate protection is unchanged
- Adult/non-family eligibility is authored explicitly, independent of office titles. The player’s Prince career remains royal. Emperor and Dowager romance routes are deferred

## Concubine risk is visible before acting
Every unique romantic gift or proposal immediately adds10% suspicion to every unpledged character in the current seasonal cast who shares the current area, including the recipient and every faction. Rejected proposals count. Pledged witnesses are exempt; breakups do not add suspicion. A repeated request ID never fires twice

The action panel names each witness, their projected suspicion, and any imminent report. The existing one-report Concubine defeat rule remains

Example from zero affection/suspicion: six gifts reach90 affection and60% suspicion. An unpledged side recipient at the70% reporting threshold reports on the seventh action, the proposal. A minor recipient has a90% threshold and reports exactly on the ninth action. A recipient pledged politically beforehand and no other unpledged witnesses provides a viable private courtship route. Romance itself never grants that pledge or immunity

## Murderous rivalry
At80 directed hate, a living stronger romantic rival can issue an assassination warning. Both must share a living, accepted lover and have eligible adult/non-family profiles. The first attempt follows a full warning season; an unresolved plot attempts every following season. Equality remains unsafe for an active plot

Only living direct courtier pledges to the NPC target can shield them. An attacker cannot sacrifice itself; the player and Emperor are never incidental NPC shields. The selected protector dies permanently. With no protector, the rival dies permanently. All attempts recheck the updated living graph, so nobody dies twice. Loss of the shared relationship, eligibility, motive or influence advantage defuses the plot

NPC deaths remove their actor, seasonal presence, report/faction counts and future income. The court report identifies the romantic target and casualties. The existing player assassination contract is preserved

## Persistence and old saves
Save schema7 and graph version2 add directed affection plus mutual accepted-romance metadata. Versions1–6 migrate without rewards, campaign RNG draws, graph rerolls or historical killings. Saved old love maps to affection without inventing accepted romance

Old love-triggered gift eligibility is retained separately as a legacy flag. New affection, even100, cannot activate that reward. Political pledge income continues to use the existing shared per-courtier/season ledger after casualties

Replies are stored per courtier and survive switching conversations and reload. Replies appear above the choices. In3D, the actual courtier’s head is projected into a viewport-safe bubble while time is paused. When the whole bubble cannot fit above the open conversation panel, the readable panel fallback stays visible. The accessible reply remains available in either presentation

## Verification
Run npm run build and node --import tsx --test tests/*.test.ts

New pure-rule, lifecycle, NPC-plot, UI markup and metadata validation tests cover costs, consent, political independence, multiple lovers, exact suspicion thresholds, permanent deaths, migration, idempotency and save/reload. Browser QA uses only explicit fictional fixtures through ?playtest=intrigue&renderer=software; normal campaigns use separate storage. Romance and jealousy fixture loaders are available there

The environment has no established local cloud-browser preview route. Actual post-deployment UI QA remains a publication gate owned by the coordinating task. GPU appearance/performance and iPad device testing are not established by Node tests or software-mode QA

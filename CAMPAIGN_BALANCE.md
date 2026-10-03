# Campaign balance checkpoint, court hierarchy v3

This is a development calibration using the production XState campaign, message evaluator and fallback faction audience. It is not a measured human win-rate study. All numbers are tunable in `src/lib/campaignBalance.ts`; court offices and per-interaction costs are centralized in `src/lib/courtHierarchy.ts`.

## Personal relationships and global standing

Personal backing is Prince60 / Scholar70 / Concubine80. A100-point pledge is binding, blocks suspicion and follows the player's faction. Personal gain remains slower for the Concubine career. Global support is a separate career ledger, with no100-point cap. A courtier grants their office's global award once on first backing and once on pledge. Duplicate or spoofed reports cannot farm it.

The court has48 persistent identities plus the Emperor:

| Office | Count | Gifts per evaluated interaction | Global award at each milestone |
| --- | ---: | ---: | ---: |
| Maid | 8 | 1 | 2 |
| Eunuch | 8 | 1 | 2 |
| Concubine | 6 | 5 | 5 |
| Scholar | 6 | 5 | 8 |
| General | 4 | 10 | 20 |
| Prince | 4 | 10 | 20 |
| Consort | 4 | 10 | 20 |
| Minister | 4 | 10 | 20 |
| Prime Minister | 1 | 20 | 50 |
| Crown Prince | 1 | 20 | 50 |
| Empress Consort | 1 | 20 | 50 |
| Empress Dowager | 1 | 20 | 50 |

Full one-time capacity is1260 before an office holder is expelled. That capacity is not granted automatically or equally accessible to every starting career. Concubine NPCs contribute less global standing than Scholars and the senior court. New courtier portraits remain explicitly marked pending. Their eventual art uses eight shared lower-tier archetypes, with stable individual material colors, and unique top-tier office holders.

## Progression and setbacks

Cumulative global targets: Prince80/160, Scholar90/180, Concubine80/200. Influence gates: Prince70/85%, Scholar55/80%, Concubine30/65%. The final Empress target200 is preserved. Each distinct promotion grants12 influence points once; earned global standing adds0.2 influence points per point. Successful evaluated diplomacy adds0.4 points once per recipient per season. Influence scales positive gift benefits up to25%; bad-message penalties are not reduced.

Each rank has a fresh12/16/20-season window for Concubine/Scholar/Prince. Entry season counts. Missing the bottom deadline ends the career as maid/peasant/outside lord. Higher-rank failure demotes one office, resets the clock and removes zone access. Global standing resets to10 for Concubine at the bottom,0 for the other careers, or the first promotion target when falling from top to middle. Relationships and pledges stay. A two-season probation prevents immediate promotion bounce. Promotion influence rewards cannot be farmed.

After demotion, one paid positive evaluated gift to a current backer can renew one quarter of their normal global award, once per courtier per season, until the final promotion target. Hostile positive renewal is reduced to10%; negative/blank/duplicate submissions award none. Maxed pledged allies can legitimately help rebuild without replaying their old milestones. The UI explains this recovery rule.

Top promotion expels the previous holder of the same office. The actor is stopped and removed from active pools, presence and current faction backing; only minimal historical records remain. Demotion does not revive them. Existing faction membership is retained. Past earned standing is historical, while future faction eligibility uses only current actors.

## Gifts, cast and intrigue

Start50 gifts; each committed season adds50. Costs1/5/10/20 are per interaction and derived from the actual recipient office. Tribute remains10: a reserved budget can buy two top-tier interactions and still pay it. There is no real money. Every gift requires one of four authored messages; free-form interpretation remains unfinished scope.

Each season has12–16 active courtiers. Up to3 developing contacts return, then remaining slots reshuffle with career themes. This avoids losing all relationship continuity as the roster grows. Schedules retain home/visitor logic and all five zones; actors and relationships persist separately from loaded geometry.

From season2, Emperor encounter chance is20% +20%×influence. Paying tribute has30% chance of +4 influence points. Manual and timed advancement share one completion path and cannot charge repeatedly without progressing. Emperor item/message preference scoring is still absent.

Consort promotion makes the unpledged Empress Consort and her current unpledged faction hostile. The Dowager is explicitly exempt, even when in that faction. Affected current backers fall below their career-specific backing threshold; stale faction invitations are recomputed. Pledged allies are exempt. Enemies still accept gifts, with10% positive gains and full negative penalties. Ambitious gifts to Rebel recipients add suspicion only among anti-Rebel witnesses in the same area at submission; enemy witnesses receive1.5×. No global off-zone suspicion.

## Reproducible campaign simulations

Run `node --import tsx scripts/simulate-campaign.ts 100`. The latest report uses a persisted xorshift32 gameplay stream and contains1200 runs:100 seeds ×3 careers ×4 policies. Every policy uses production gifts, costs, actor state, random seasons, access, intrigue, tribute, promotion, demotion, expulsion and real fallback audience questions/judgment.

Movement is approximated as25 seconds per area visit and15 seconds per new recipient, within four150-second phases. Dialogue/repeat gifts do not consume the active clock, matching the browser. Collision and human reading/decision time are not modeled.

- Strategic: reads visible previews, prioritizes milestone efficiency, avoids witnessed Rebel provocation, reserves tribute, four gifts per visit;80% audience accuracy.
- Scattered casual: random area/recipient, safe or30% neutral choice, two gifts per visit, reserves tribute80% of decisions;55% audience accuracy.
- Focused casual: same information and reserve assumptions, three gifts per visit while returning to the same recipient;55% audience accuracy.
- Bad play: random messages and no tribute reserve;20% audience accuracy.

Observed faction victory rates (Prince / Scholar / Concubine): strategic100/100/100%; scattered64/47/3%; focused48/32/19%; bad10/1/0%. No engine errors or unresolved60-season horizons occurred. Strategic median first/top promotion seasons: Prince4/6, Scholar5/7, Concubine6/14. Setbacks and recoveries occur in all strategic career samples. These are policy outcomes, not predicted player success rates. The Concubine route deliberately demands sustained relationships, and scattered casual play remains very punishing. Browser UX testing and user feedback must guide further tuning.

Gameplay random state is saved with the campaign. Restoring a committed snapshot preserves future cast selection, Emperor encounters and tribute favor rolls; cosmetic response wording is independent. A new campaign alone receives a new seed.

## Verification boundary

Unit/integration tests cover exact roster counts, all tier prices, cost spoofing, nine rank-access combinations, deadline boundaries, permanent office expulsion, Dowager exemption, pledged immunity, localized witnesses, duplicate gift handling, paid renewal idempotence, and actual recovery at100 personal support. The cloud browser verifies movement and game state using the explicit software test renderer because its WebGL2 is unavailable. That view does not verify GPU skinning, materials, lighting, frame rate or GPU memory. Actual exported model proofs are separate Blender evidence. Most cast geometry and the two non-Prince player careers still need the approved anime art pipeline.

## v26 requested tuning
- Per-promotion rival hate: Prince20, Scholar/Minister30, Concubine40; existing rivalry target scopes and ally/faction immunity remain.
- Tribute:10/20/40 by current rank; a demotion lowers the next demand. Introduction remains free.
- Every living pledge sends minor1/side5/major10 gifts each season, including off-zone/inactive actors and low-support pledges. Initial courtship gift counts for that season; a per-courtier ledger prevents duplicate renewal and reload payment. Casualties at a boundary are excluded from the new-season income. Existing earned balances are untouched.
- New assassination threats retain one full warning season. Every unresolved attacker then kills one ally per season until strictly out-influenced or otherwise invalidated. Ties sustain active plots but do not initiate them. No allies means player death.
- Death-method presets are cosmetic deterministic draws persisted on the event and death record, independent of the gameplay random stream.
- Schema6 migration preserves current balance, hate, graph and RNG; a just-completed v5 cooldown threat can resume next season without a retroactive casualty or payment.
The earlier simulation summaries predate this tuning and are not a fresh human-difficulty claim.

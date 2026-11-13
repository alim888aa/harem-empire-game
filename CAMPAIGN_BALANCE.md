# Campaign balance checkpoint, court hierarchy v3

This is a development calibration using the production XState campaign, message evaluator and fallback faction audience. It is not a measured human win-rate study. All numbers are tunable in `src/lib/campaignBalance.ts`; court offices and per-interaction costs are centralized in `src/lib/courtHierarchy.ts`.

## Rule ownership and vocabulary

Use [CAMPAIGN_BALANCE](src/lib/campaignBalance.ts) for current campaign tuning and gift-effect calculations. Its career fields and re-exported operations delegate to the [Career module](src/lib/career/index.ts), which owns starting-career grants, rank allowances, promotion requirements, deadlines and rank-based tribute. [courtHierarchy.ts](src/lib/courtHierarchy.ts) owns court offices, cast counts, interaction costs and NPC influence caps. Do not copy those tuning tables here.

- **Rank allowance** is the seasonal gift budget for the player's current office. Pledged-ally gifts are separate income; gifts are not real money.
- **Influence** is the player's standing. It gates promotion, changes positive gift effects relative to the recipient's influence and affects Emperor encounters. Promotion gains, demotion losses and earned-influence scaling belong to the rule owners above; bad-message penalties are not softened by positive-gift scaling.
- **Global support** is the career ledger, distinct from personal relationship support. A courtier awards it at backing and pledge milestones, not on every repeat gift. Duplicate or spoofed reports cannot farm it.
- **Tribute** is the Emperor's rank-based gift demand during an encounter, not a fixed interaction cost. Introduction is free. A reserved budget must account for the current rank as well as recipient costs.

See [the glossary](docs/GLOSSARY.md) for domain vocabulary. These ownership links describe the current source, not a fresh balance study.

## Progression and setbacks

A rank has a fresh deadline window; entry season counts. Missing the bottom deadline ends the career. Higher-rank failure demotes one office, resets the clock and removes zone access. Relationships and pledges stay. Probation prevents immediate promotion bounce, and distinct promotion rewards cannot be farmed. Exact targets, windows, reset standing and influence changes belong to the rule owners, not this document.

After demotion, a paid positive evaluated gift to a current backer can renew part of their normal global award once per courtier per season, until the final promotion target. Hostile renewal is reduced; negative, blank and duplicate submissions award none. Maxed pledged allies can help rebuild without replaying old milestones.

Top promotion expels the previous holder of the same office. The actor leaves active pools, presence and current faction backing; historical records remain. Demotion does not revive them. Existing faction membership is retained. Past earned standing is historical, while future faction eligibility uses current actors.

## Gifts, cast and intrigue

Every gift uses an authored message and the actual recipient office's interaction cost. Free-form interpretation remains unfinished scope. Returning contacts preserve relationship continuity while the active seasonal cast reshuffles. Schedules retain home/visitor logic; actors and relationships persist separately from loaded geometry.

Manual and timed advancement share one season-completion path and cannot charge repeatedly without progressing. Emperor item/message preference scoring is still absent.

Consort promotion makes the unpledged Empress Consort and her current unpledged faction hostile. The Dowager and pledged allies are exempt. Affected current backers fall below their career-specific backing threshold; stale faction invitations are recomputed. Enemies still accept gifts, with reduced positive gains and full negative penalties. Ambitious gifts to Rebel recipients add suspicion only among anti-Rebel witnesses in the same area at submission, with stronger hostile witnesses. There is no global off-zone suspicion.

Assassination threats retain a warning season. Unresolved attackers then kill allies until strictly out-influenced or otherwise invalidated; without allies, the player dies. Death-method presets are cosmetic deterministic draws, separate from gameplay randomness. Save migration preserves existing earned balances, relationships and RNG rather than retroactively charging earlier seasons.

## Reproducible campaign simulations

Run `node --import tsx scripts/simulate-campaign.ts 100 1 60`. The CLI uses production campaign rules and real fallback audience questions/judgment, without a paid API. It prints computed summaries before writing JSON and creates missing report parents. The default is `validation/campaign-simulation.json`, or `validation/campaign-simulation-from-<seed>.json` when the starting seed is not 1. `SIM_REPORT_PATH` overrides the report path, including nested relative or absolute paths. A report-write failure still exits nonzero even though summaries are available on stdout. Generated default reports are ignored by Git; keep custom report paths outside tracked source.

### Historical pre-v26 calibration, retained 2026-11-13

The original run date was not recorded here. The following assumptions and results predate v26 tuning and are not current-head verification. That historical report contained 1200 runs: 100 seeds × 3 careers × 4 policies. It used a persisted xorshift32 gameplay stream and production gifts, costs, actor state, random seasons, access, intrigue, tribute, promotion, demotion and expulsion as they existed then.

Movement is approximated as25 seconds per area visit and15 seconds per new recipient, within four150-second phases. Dialogue/repeat gifts do not consume the active clock, matching the browser. Collision and human reading/decision time are not modeled.

- Strategic: reads visible previews, prioritizes milestone efficiency, avoids witnessed Rebel provocation, reserves tribute, four gifts per visit;80% audience accuracy.
- Scattered casual: random area/recipient, safe or30% neutral choice, two gifts per visit, reserves tribute80% of decisions;55% audience accuracy.
- Focused casual: same information and reserve assumptions, three gifts per visit while returning to the same recipient;55% audience accuracy.
- Bad play: random messages and no tribute reserve;20% audience accuracy.

Historically observed faction victory rates (Prince / Scholar / Concubine): strategic100/100/100%; scattered64/47/3%; focused48/32/19%; bad10/1/0%. No engine errors or unresolved60-season horizons occurred. Strategic median first/top promotion seasons: Prince4/6, Scholar5/7, Concubine6/14. Setbacks and recoveries occur in all strategic career samples. These are policy outcomes, not predicted player success rates. The Concubine route deliberately demands sustained relationships, and scattered casual play remains very punishing. Browser UX testing and user feedback must guide further tuning.

Gameplay random state is saved with the campaign. Restoring a committed snapshot preserves future cast selection, Emperor encounters and tribute favor rolls; cosmetic response wording is independent. A new campaign alone receives a new seed.

## Verification boundary

As of 2026-11-13, the CLI report-output maintenance checks are tiny filtered runs, not a rerun of the historical 100-seed study or proof of present difficulty. Use current test/check logs for exact-head coverage; this document does not certify their results.

Historical court-hierarchy-v3 unit/integration claims covered roster counts, tier prices, spoofed costs, rank access, deadlines, expulsion, exemptions, witnesses, duplicates and recovery. Historical cloud browser checks used a software test renderer because WebGL2 was unavailable; they did not verify GPU skinning, materials, lighting, frame rate or GPU memory. Exported-model Blender evidence was separate. Those browser and art-status claims are not current proof, and no browser verification accompanies this CLI/docs repair.

# Glossary

These are the domain words of Harem Empire. Use them in code, tests, docs and PRs. When a word in the code disagrees with this page, the page describes the intent, and the code is a candidate for cleanup.

## Careers

- **Role**: the path the player picked at the start: `prince`, `concubine` or `scholar`. *Legacy:* the engine and saves still call the scholar role `minister`, and `resolveCareer()` maps it to `scholar`. New code should normalize once at the edge.
- **Career**: a role together with its ladder of ranks (`CAREER_LADDERS` in `lib/careerAccess.ts`):
  - Prince: `prince` → `grand_prince` → `crown_prince`
  - Scholar: `scholar` → `minister` → `prime_minister`
  - Concubine: `concubine` → `consort` → `empress` (*legacy:* `empress_consort` in old saves and some code)
- **Rank**: the player's current step on their ladder.
- **Promotion**: moving up a rank. It needs **global support** and **influence** to both meet the targets before the **deadline**.
- **Deadline**: the number of seasons allowed at a rank. Missing it means **demotion**, or losing at the bottom rank.
- **Consolidation**: at top rank, three completed seasons before the faction victory audience.

## Court

- **Courtier**: any named non-player character (NPC). There are 48 of them, in tiers 1–4. Each season about 12–16 of them are in residence.
- **Court graph**: the canonical directed graph of relationships between the player, the courtiers and the Emperor (`lib/courtGraph.ts`). Edge kinds:
  - **Support**: a courtier's backing for someone, from 0 to 100. At the threshold (usually 80) the courtier is a **backer**.
  - **Hate**: hostility. It drives plots.
  - **Pledge**: a binding alliance, made at support 100. A pledged ally sends gifts every season and can **shield** you.
  - **Affection / lover**: romance edges.
- **Global support**: the player's career total of endorsements. It is earned once per courtier for backing and once for a pledge.
- **Influence**: the player's standing, from 0 to 100%. It scales gift effects and Emperor encounters, and is one of the promotion bars.
- **Suspicion** and **reports**: a courtier's suspicion of the player. Too many **reports** means defeat.
- **Faction**: Rebel, Imperial, Loyalist or Independent. Independent has no ending. Three members of one faction backing you earns an **invitation**.

## Actions

- **Gift**: a message-gift to a courtier. It costs gifts by court tier (1, 5, 10 or 20). It has a **preview** before it is sent and a **receipt** after.
- **Gifts** (the currency): the player's budget. It is refilled each season by the **rank allowance** and by pledged allies.
- **Tribute**: the gifts the Emperor demands during an **imperial encounter**. Refusing is fatal unless he grants a **pardon**.
- **Audience**: the Emperor's question-and-answer judgment at the end of a career path.

## Time and space

- **Season**: one turn of the campaign. In 3D it runs on a timer (5–20 minutes, paused while menus are open). 2D mode is untimed.
- **Zone** (palace area): `library`, `emperor`, `empress`, `ladies`, `dowager` and `common`. A player's rank decides which zones they may enter.
- **Presence**: which courtiers are in which zone at the current point in the season.

## Intrigue

- **Plot**: an enemy's assassination plan. A plot starts with a full season of **warning**. After that it kills one pledged ally every season until the player out-influences the attacker. If no ally is left, the player dies.
- **Casualty**: a courtier killed by a plot. Casualties are permanent.

## Career rule ownership

The Career module at `src/lib/career/index.ts` resolves existing legacy role/rank identities without renaming saved fields. A Career is still the Prince, Scholar or Concubine route; a CareerRank is a held office. A missing/null rank uses the route's starting office for its public rules. Cross-career or unknown ranks remain invalid. Deadline demotion notices may describe middle-to-starting office, while the audience `demotedRank` operation preserves its existing top-office-only contract.

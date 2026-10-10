# Harem Empire context

## Product
A single-player browser palace drama. Players choose a Concubine, Scholar or Prince career, navigate a three-dimensional court, build relationships, manage gifts and tribute, and survive promotion, plots and imperial judgement. Current save version is 7; terms are defined in docs/GLOSSARY.md.

## Clients
The player uses the existing public game site. The parent assistant is the Factory owner for product calls; factory workers use GitHub issues and PRs. Agents are collaborators, not additional product customers requiring new runtime APIs.

## Must never break
- Loading existing v3–v7 campaigns, recovery backups and deterministic campaigns: src/persistence/campaignSave.ts and public/qa fixtures.
- Career progression, tribute and campaign endings: game-machine and interface tests.
- Hosted runtime assets: runtime-assets.json SHA-256 recovery, RUNTIME_ASSETS.md, assets:fetch/verify, and production pruning. Do not commit hosted binaries again.
- Existing public destination: https://harem-empire-3d-development.alimar55555.chatgpt.site . Publish nowhere else.
- No production Gemini key, paid art commissioning, purchases, new accounts or security permissions through factory autonomy.

## Direction
An elegant imperial palace drama with a calm, intuitive, touch-friendly interface.
Use deep modules and delete redundant layers while preserving gameplay and saves.
Walking shows the minimap with people/time ring, small purse and menu seal.
Exact numbers and rules stay reachable in the menu; no Scholar's View toggle.
Concubine remains deadly, with earned warning and horror-level court danger.
Full scheming follows the S6 playtest; playable 2D is removed before the item economy.
Refactor work must not silently implement the reimagining's product features.

## Recorded decisions
- Deadly court, full scheming and 2D removal: https://github.com/alim888aa/harem-empire-game/issues/2#issuecomment-6093158163
- Latest visibility decision supersedes hidden-number toggle: https://github.com/alim888aa/harem-empire-game/issues/2#issuecomment-6093840216 and issue #31.
- Cloud only. All factory jobs and council angles use GPT-6.1 Sol. Parent assistant remains owner.
- Budget: $100 total for refactor, then $30 per UTC day ongoing. These are separate phases; no priority bypass. Actual accounting/launcher support is missing, so autonomous dispatch is held.

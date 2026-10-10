# Design

## Tokens and components
The current visual language is documented in AGENTS.md and docs/architecture/ui.md. Reuse src/ui/theme/tokens.css, skin.css, Emblem, PopNumber, SealStamp and playCue. Lacquer plaques, silk scrolls and cinnabar seals replace generic web boxes. Display font is Cormorant Garamond; body font is Alegreya Sans. No emoji or raw colors outside the token owner.

## Screen patterns
One primary action per view. Existing dialogs are silk scrolls. Frozen legacy CSS remains in its cascade layer and may be deleted when its owning screen is replaced; never patch new visual rules into it. Respect reduced motion, sound choice and touch accessibility.

## Information priority
Issue #31 is the future UI specification, not a claim this setup implemented it. Walking has minimap/time ring/people, small purse and menu seal. Conversations have dialogue, choices, bond/suspicion marks and named witnesses. Exact numbers and all rules stay one tap away in the menu. Avoid permanent instructions, stacked banners and paragraphs in conversation.

## Loading and feedback
Preserve existing model-loading curtain and paused clock, save recovery messages and accessible dialogue until their owning slice changes them. Momentous events use ceremony; ordinary notices become short-lived toasts under the approved notices slice. Do not hide information before its menu replacement exists.

## Verification
Visible changes need browser proof on the exact head at desktop and touch widths. Factory verifier follows upstream browser-use instructions; scripted Playwright smoke tests may supplement existing repo tests but do not replace its independent browser proof. Current cloud browser reachability remains an activation blocker.

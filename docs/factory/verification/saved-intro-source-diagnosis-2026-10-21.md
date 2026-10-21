# Saved-intro camera: source-only diagnosis — October 21, 2026

The unsafe camera-entry candidate is deterministically reproduced and predates H1. This does not establish identical black pixels on the base, fix the game, or clear the previously observed R1 presentation finding.

## Likely cause

A restored active introduction reaches cinematic framing before the scene has retained a safe ordinary camera. The initial camera `(0, 4.3, 23)` is outside the exercised rooms' `maxZ = 20`. A valid cinematic endpoint exists, but the transition crosses a front wall and retains the unsafe current pose. Repeated frames keep using that cached pose.

The ordinary first-frame branch instead places the camera at `z = 19.5325`, inside the room. Starting there reaches the cinematic plan in every tested control. This supports repairing scene bootstrap ordering rather than weakening architectural collision checks. No fix was implemented.

## What actually ran

The diagnostic used the three authoritative archived synthetic v7 intro fixtures with empty saved player/NPC pose maps. It imported production public world, roster, movement, entrance, interaction-path, save-parse and conversation-camera interfaces. TypeScript AST-selected production statements supplied the exact restore, initial camera, approach search and ordinary first-frame operations; no guessed approach endpoints or product test hook was added.

Production entry selection yields player `z = 15`, Emperor start `z = 11` and destination `z = 12.3` for all three careers. The Concubine ground height is `.138`; Scholar/Prince use `0`.

Both exact H1 and main executed these deterministic source-interface cases:

- Three careers × three synthetic layout-input bands × normal/reduced-motion/replanning variants: 27 unsafe-origin trials per checkout, each retaining the initial pose for 180 frames.
- All nine safe ordinary-origin controls per checkout reached their exact cinematic plans.
- Nine blocker-free counterfactual controls also escaped the unsafe origin. This was diagnostic input, not a proposed game fallback.
- A real Three.js scene-mesh ray toward the actor hits opaque front-wall geometry about 2.92–2.94 metres away, before the actor about 8.27–8.32 metres away.
- H1/main result arrays are exactly equal. Normal diagnostic and comparison commands exit 0. An explicit desired-invariant assertion exits 1 as expected: restored intro must not retain an out-of-room camera after settling. That expected failure is preserved, not counted as a passing product test.

The synthetic bands include 390/1440-width numbers, but are not measured CSS viewports, browser resizing or visual proof. No DOM, renderer, native browser, HTTP fault, full suite or build ran in this diagnostic slice.

## Exact pre-H1 comparison

- Pre-backdrop base: `9a8a208d5ae01ad9cf40adbfa01220dc5a4f1998`.
- H1: `2ce02b988d8ea3cd681d8124f8844b536ec470da`.
- Main source comparison: `b93f521bdc809a62e4a2b696e8619d47386ce675`.

All three have the same complete `src/palace` subtree: `c2ed64146384a6adf2115cf7eda96a5bd3f21371`. Shared core blobs include PalaceScene `766e654ae63352519a7f0b25329981d1efbadcca`, conversationCamera `5dc5b8c0fd15feeb43c152bb430f636d5dec5895`, and world `9f5245a5f6758b0ece4375c5dfaeb0806b89fea6`.

The entire base/main `src` trees are also identical: `df85643dff47650772bc2dd1057873078a96d7cb`. Main's executable source-interface reproduction therefore uses the exact base source bytes, not an approximate baseline. H1's changed dialog/layout/dismissal files do not change the relevant PalaceScene predicate or camera implementation. Browser timing/layout equivalence remains untested.

## Boundaries and next step

The evidence establishes a pre-H1 source defect consistent with the retained native images. It does not prove the exact camera values or rendered pixels in those images, nor classify the native black-background symptom as an H1 regression or as visibly pre-existing. Arbitrary real-play saves, non-entry rooms and nonempty saved poses were not covered.

R1 remains unresolved for release. A future separately admitted repair should establish a safe ordinary baseline before cinematic framing, add an appropriately owned permanent behavioral regression, receive independent review, and recheck affected native reload behavior. Exact CSS sizes, touch/video, remaining exits/controls and hosted-delivery gates are unchanged. No denied route was retried.

## Retained evidence and budget

Privately retained archive: `harem-saved-intro-diagnosis-2026-10-21.tar.gz`, 66,119 bytes, 19 files. SHA256: `5155b90792fde67649761504355f9732213b06271f04d621d287114516f27406`. It contains the full report, runnable diagnostics, exact fixture copies, AST-slice audits, all output/result files, source comparison and expected-failure log. All 18 pre-archive evidence hashes were verified.

No runtime source, permanent test, dependency, asset or public game change. The USD5 reservation includes source diagnosis and parent preservation; October 21 total is USD17 recorded, with USD13 unallocated. Earlier usage/history remains preserved. Consult the actual current ledger before another admission.

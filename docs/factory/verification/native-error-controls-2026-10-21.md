# H1 native error and controls verification — October 21, 2026

Status: qualified partial evidence accepted by independent Sol review, with findings. No runtime integration or publication. Existing public game remains V57.

## Provenance and checks

- Exact H1: `2ce02b988d8ea3cd681d8124f8844b536ec470da`, tree `08d7bd30b6b7de5e49a30d199da06e578afafed0`. Tracked source remained clean.
- Author: 37 focused, 25 factory and 511 product tests passed, plus typecheck/build; 131 pinned runtime files verified.
- Independent review: 49 focused dialog/intro/camera tests passed; all 131 runtime files verified; all 414 offline files reproduced byte-for-byte. 285 production hashes also unchanged. These are fresh exact-source builds, not byte-identity claims about older artifacts or hosted delivery.
- Main bookkeeping environment: 25 factory and 491 product tests, typecheck/build passed after installing its committed lockfile. A premature test attempt lacked TypeScript; that setup failure was resolved, not classified as a product regression.
- Dedicated native cloud Chromium used ANGLE SwiftShader, no unsafe/debug/headless flags. Outer window 1188×848 is not certification of required CSS viewports. The local server replaced only the original Emperor GLB response with 503; all 131 pinned files stayed unchanged on disk.
- Six served v7 fixtures were generated through public actor events and validated capture/parse/restore interfaces. They are synthetic checkpoints with empty saved player/NPC pose maps, not comprehensive real-play reload coverage. Authoritative archived inputs are `offline/__qa__/*.json`, not subsequently regenerated worktree previsit files.

## Accepted observations

- Automatic genuine 503 error → physical Escape passed for Concubine, Scholar and Prince. Settled images show normal palace rendering, restored Save & game focus, Season 1 and gifts 20/20/25 and resumed clocks. Post-exit native drag / W changed the view for all three.
- Scholar/Prince error backdrop drag, held W and wheel left the visible scene/dialog and paused clocks stable. This is sampled input evidence, not exhaustive controls or animation proof.
- Scholar Retry/Return focus stops are visible. Advancing past Return reaches Chromium chrome, not a background game control. No dialog-only focus cycle is claimed.
- Synthetic saved-intro Concubine X restores normal 3D and resumes time without changing Season 1 / gifts 20. Scholar X eventually exited, but the immediate retained image is stale and later play advanced; immediate Scholar invariants are not proven.

## Open findings and gates

R1: Two validated synthetic saved-intro checkpoints, Concubine and Scholar, show a persistent black 3D background behind a usable error dialog. Automatic introduction does not. Classify and resolve this presentation finding, then rerun the affected native path. No baseline browser comparison was run, so neither H1-regression nor pre-existing classification is established.

Source-only hypothesis: the initial camera at z=23 is outside the exercised room bounds; restored intro enters the cinematic branch before a safe ordinary frame, and a blocked transition can retain that initial pose. A diagnostic supports plausibility, not exact native root cause. Do not label it fixed.

Prince X, all Return-button error exits, exhaustive focus/controls, exact CSS 390×844 / 1440×900, physical touch, required motion video and hosted-delivery acceptance remain unproven. Prior DevTools denial remains binding; no bypass was attempted. Earlier branches and proof remain preserved.

## Cleanup and retained evidence

Owned native browser/server/terminal are stopped; native localhost:4185 returned connect_ex 111. Default browser newtab was untouched. An execution interruption was reconciled before completion; no duplicate launch or pending write was assumed successful.

Evidence archive: `harem-native-control-2026-10-21.tar.gz`, 3,367,048 bytes, 27 raw screenshots and 60 retained evidence files. SHA256: `a07a5f354821aa38c7538aa28f94048402f060c8dce4326cadd41367f837f18e`. The archive is privately retained with the exact served fixtures, reports, logs and hash manifests; duplicated art/build directories are excluded.

October 21 estimated work is USD12 total: native / parent USD9 and independent review USD3; USD18 unallocated. October 20 USD23 ledger was preserved byte-for-byte, as were older dates. Consult the actual current ledger before any further admission.

# Focused palace keyboard ownership — 2026-10-28

## Scope and result

On the isolated reviewed #41 continuation `a0d52299575d926e76af9690832bd2e4de19ee02`, the global `PalaceScene` keydown handler excluded only text fields. When an unpaused keyboard player tabbed to **Show controls** and pressed Space, that handler prevented the button's native activation and queued Jump instead. A GPT-6.1 Sol source hunt executed the exact handler in JSDOM twice: each attempt set `defaultPrevented=true` and requested Jump. This is a concrete source-level keyboard usability defect, not a WebGL playtest claim.

The bounded continuation adds `isPalaceControlTarget` to the existing input policy module and calls it before the scene consumes shortcuts. Buttons, links, summary, editable regions and listed ARIA controls retain their keyboard gestures, including nested SVG descendants. The game canvas and plain scene surfaces still accept normal movement, Jump and interaction shortcuts; keyup cleanup remains global. No movement physics, animation, camera, assets, campaign, save schema or UI styling changed.

The isolated remote branch is `fix/palace-keyboard-focus-2026-10-28`, head `98ce8127f757e5262298f133eb409df763332af6`, parent `a0d52299575d926e76af9690832bd2e4de19ee02`, tree `0286605dbc59fadea3e99f05ba9b27d4ba1e9a0b`. The remote tree equals tested/reviewed local `cdfcc296605b896d3ecc1aaf1d09e0e4acff0c63`; GitHub API commit identity differs from the cloud checkout commit. Direct `git push` lacked credentials, so the authorized GitHub tree/commit/branch API preserved the same exact tree. The branch head and tree were read back.

## Verification and limits

- Exact local tree: `npm run factory:check` passed: hygiene, 25 factory tests, 551 product tests, source typecheck, all 131 pinned runtime assets, and production build. No failures or skips. Existing Vite large-chunk warning remains. `git diff --check` passed.
- Focused public input test: 12/12 passed, including focused controls and canvas target classification.
- Independent GPT-6.1 Sol exact-tree source review: **clear** with no findings. Reviewer independently ran the focused tests (12/12), typecheck, JSDOM boundary matrix and diff check. The test proves target classification, not native activation in a running game.
- No actual-game browser, temporal WebGL/video, mobile touch, hosted verification or full #41 control walkthrough was run. Prior organizational DevTools/CDP/headless denial was not retried. The native CUA no-window path has no new supported evidence. No PR route retry, main runtime integration, Site save or publication occurred.

## Pending release state

The original integrated candidate `409e62959e4b155f17b6c31ccd766aa2b486e7f7` and the reviewed gait chain remain preserved; the #41 continuation is not a full issue fix. Main gameplay and the existing active/public V57 Site remain unchanged. Before integration/publication, obtain approved exact-integrated-head desktop 1440×900 and mobile 390×844 temporal WebGL/video and touch proof across walk/run/turn/stop/jump/menu, focus/activation/reload and coordinated Speak/Emperor return paths; repeat aggregate checks and independent exact-head review. Do not deploy an unverified build merely to test it.

## Estimate

October 27 USD27 recorded, zero reserved, USD3 unused was archived verbatim before admission. October 28 reserved USD18 for coordinator/source repair/checks, USD4 for sequential independent Sol review and USD2 for preservation, total USD24 within the Asia/Ulaanbaatar USD30 estimated allowance. This is planning, not metered billing; USD6 remains unallocated. No further work is admitted merely to consume headroom.

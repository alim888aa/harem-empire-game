# Pending palace repairs staged on current main — October 29, 2026

## Source state

Current remote main at admission was `3cf1c6e0183b687c922924ae83f1db5897dd8017`, with only documentation and accounting changes since the pending integrated candidate. The original candidate `409e62959e4b155f17b6c31ccd766aa2b486e7f7` and the gait/keyboard chain ending at `98ce8127f757e5262298f133eb409df763332af6` were not changed.

A fresh isolated staging branch, `fix/palace-pending-integrated-2026-10-29`, now holds the same non-factory source and tests as the pending keyboard head, atop current main and the October 29 reservation. Remote head `5fd4c6431d1f550587371c2c7004da11d856f15b` has tree `695de809cd36a82bf9d420c33251368737232a58`; the exact tested local commit was `556820dc6d976ffaaf036d94ec9ab0c35b43c506` with the same tree. The remote branch and main heads were independently read back. No gameplay source was put on main and no PR was created.

The staging operation added no new runtime fix. Its non-factory files exactly match the previously reviewed keyboard branch. No save, state-machine, campaign rule, asset-manifest or public-file differences from main were introduced. This staging joins previously isolated repairs for intro recovery/camera bootstrap, gait switching and full-stop reset, and focused keyboard control ownership; it does not prove the reported on-screen vibration or Emperor camera behavior is cured.

## Checks and independent review

- Coordinator ran `npm run factory:check` on the exact local tree: hygiene, 25 factory tests, 551 product tests, source typecheck, 131 pinned runtime asset hashes and production build all passed. `git diff --check` passed. Existing Vite large-chunk warning remained.
- Independent GPT-6.1 Sol reviewed the exact staged tree, confirmed file equivalence and source boundaries, ran 97 focused tests, source typecheck and diff whitespace checks, and found no source-staging defect. The reviewer did not rerun the aggregate check.
- No actual browser, WebGL temporal/video, touch, hosted or Site verification was run on this staged head. Unit and JSDOM tests are not native-control or visual proof.

## Cloud route investigation and pending gate

A fresh cloud environment catalog had no saved Harem repository environment. The managed computer inventory exposed only a CDP browser, which is the previously denied route, and an unlaunched native Chromium application. The prior native Chromium attempt yielded no window; there was no materially new launch evidence, so that unchanged path was not retried. The Sites tool catalog supplies saved versions and **production** deployments, but no runnable immutable preview for the reviewed source. No denied DevTools/CDP/headless or PR route was retried or bypassed. No alternate Site was created or published.

Release remains blocked pending supported exact-integrated-head WebGL/video proof at 1440×900 and 390×844; physical touch; walk/run/turn/stop/jump/menu and keyboard focus/native activation; interrupted/repeated Speak and Emperor entry/return; saved-pose and non-entry-room reload; reduced motion and hosted delivery. Prior qualified native samples are partial and do not substitute. No runtime main merge or publication to the existing public V57 Site occurred. Do not call the staging branch a full #41/#42 fix or a release-ready build.

## Estimate and next step

The October 28 ledger was archived byte-for-byte. October 29 reserved USD26 across coordinator (USD18), independent reviewer (USD5) and preservation (USD3), all conservative planning estimates rather than metered billing. This slice is recorded and USD4 remains unallocated under the Asia/Ulaanbaatar USD30 cap. Resume from the exact staged remote branch when a supported non-denied immutable browser route is available; complete the outstanding gates before integrating runtime source to main or publishing. Do not retry unchanged denied routes merely because they are visible in another tool.

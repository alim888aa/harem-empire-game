# Campaign simulator output maintenance, November 13, 2026

## Result and scope

Existing issue #29's clean-checkout report failure is repaired in the reviewed CLI/docs candidate. The simulator creates missing report parents, preserves default and seed-suffixed paths plus nested relative/absolute `SIM_REPORT_PATH`, and prints actual computed summaries before filesystem work. Write failures still exit nonzero. Six public subprocess regressions exercise these cases. Generated default reports have a narrow Git ignore rule.

`CAMPAIGN_BALANCE.md` now points to current tuning owners instead of duplicating stale tables and clearly labels old balance/browser observations historical. The documented command is `node --import tsx scripts/simulate-campaign.ts 100 1 60`. No new 100-seed study, tuning values, gameplay/UI/save/schema/RNG changes, dependencies or wrappers were introduced. Issue #29 is not auto-closed.

## Exact reviewed source and checks

- Admission: `18b91a25cc6c2b125dd621558dc015471c9e085a`, tree `d7d9e87f9320b4bdc037101552388dbebcbd71ab`.
- Immutable remote source candidate: `b6481dd0812b9c3205e339e6ae5edf182275f88c`, tree `fd390faf3c75f27db7d102fc17eb5496309b1e8a`.
- Tested local source commit: `4b0113ce7294bcd73ba0b3342f71fef668fbc09e`, identical complete tree. The reviewer independently reconstructed and SHA-verified the remote commit object.
- Source and independent review each passed six CLI regressions and `npm run factory:check`: 25 factory tests, 497 application/CLI tests, src typecheck, production build, 131 pinned asset hashes, zero downloads. The reviewer ran all six new tests on original admission in a temporary overlay: all six failed as expected. Original tiny CLI independently exited 1 with missing-directory ENOENT and zero stdout bytes.
- Known Vite chunk warning remains. No configured full lint command; hygiene is selected coverage, and src-only TypeScript does not typecheck scripts/tests. These limits are not hidden by successful subprocess tests.

[Implementation report](implementation.md) and [independent source review](review.md) are byte-identical source-handoff snapshots, including their then-outstanding closeout steps. [Integrity record](integrity.json) identifies original evidence, hashes, check counts and source provenance. Complete raw local test logs are not embedded in this curated record. This accounting/evidence-only snapshot does not change the reviewed source and must independently clear documentation closeout before the main ref advances. No extra aggregate/browser run is claimed for documentation-only changes.

## Budget and preservation

The current Asia/Ulaanbaatar ledger records USD 22 conservative flat estimates: source 10, independent review and final closeout 5, all coordination 4, preservation 3. Zero reserved; USD 8 unallocated under the USD 30 daily cap. No further admission from the remainder. These are planning estimates, not actual billing/tokens. Implementation and review jobs were explicitly GPT-6.1 Sol / Medium. Manual cloud v3 pin `7d756086b9938635e0cd11064a4d337eae747326`, one substantive job at a time; no stock dispatcher, Opus or live metrics.

The November 12 archive remains byte-identical: Git blob `e2ee7cacc1e7da93736662e107f054ee6aeb3439`, SHA256 `7a51f328ad614c200551302af3388199faabee201ee32d2667a5f87de3421209`, USD 28 recorded and USD 2 unused. The current ledger's corrupted archive-digest prose was corrected without changing entry IDs, estimates or the archived bytes.

Separate pending runtime remains clean at `98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b`, tree `c0c13d3e72e5eaa9c45f9533d65279b2c73ad15b`. No wholesale integration onto main. Future integration must preserve this CLI maintenance.

## Publication and remaining gates

No Site publication or browser launch. The existing Site remains active/public V57, source `abbf403ef771569533b802a88691696db4f0ce94`, at https://harem-empire-3d-development.alimar55555.chatgpt.site. Metadata is not runtime-health proof. No user-facing improvement is claimed live.

November 12's Chromium launch executed, then OS singleton socket/ptrace operations were denied before a game window. A filesystem write-mode change is not new evidence that this process restriction lifted; no retry or alternate launcher evaded it. Cloudflare reauthentication remains outside scope. Today's unaffected CLI slice does not waive pending actual browser/game, hosted delivery, controls/replay, temporal gait, CSS/touch, role/reduced-motion, P0 #41/#42, historical H2 attribution or parent release gates. There was no purchase, paid service, install, account/security grant, credential handling, telemetry export, external quota service, issue/PR communication, alternate publication or audience/identity change.

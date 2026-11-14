# Independent November 14 pending reconciliation review

Author: independent review
Review: 725a0fa51f58af28dadf216ea696216f286cda41 · round 1
Verdict: clear for source reconciliation only
Open blocking source findings: none

## Exact identity
Remote Git-data commit metadata was independently fetched through the read-only authenticated GitHub connector. Reconstructed Git commit bytes using the returned author/committer, original +0800 timezone, ordered parents, and no trailing message newline hash exactly to remote head 725a0fa51f58af28dadf216ea696216f286cda41. This is not an assumed metadata equivalence.
Tree: 6821c99cc7cdd1ed7a56574a9972ccf50f185c34.
Real ordered parents: current-main admission d58563c748d1b703f8766bb1626d130d0a82daa8, original pending 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b.
Frozen local tested head bcd78bc799135afab963cc329008360c100400df has exactly that full tree and ordered parents. The remote metadata differs from local metadata; the tested source bytes do not.

## Independently calculated complete preservation
Read all four trees directly from Git, not the worker's manifests. Explicit common base f509c699af09d1a8ee00b9dc32dade8bd65ae6e4.
All 619 union paths have per-input mode/type/blob identity in independent-preservation.json; candidate has 617 tracked paths. Pending has 24 raw delta entries, corresponding to 22 rename-aware paths. Main has 91 raw changed paths since base. Changed-path overlap is zero.
Every pending-changed path equals pending exactly, including both removed old rename paths. Every other candidate path equals current main exactly. Raw base-to-pending and main-to-candidate identity deltas are byte-identical, SHA256 11ebf3d6a1e45b77d5a840647903d43cec12b845537fa099aeeba7a4bbb3b85e.
Separately asserted all 127 protected paths: 123 docs/factory paths plus .gitignore, CAMPAIGN_BALANCE.md, scripts/simulate-campaign.ts, tests/campaignSimulator.test.ts. Exact main modes/types/blobs survive. Current main is a real first parent, not replaced wholesale by the pending tree. Local incomplete older ancestry was not claimed repaired or fabricated.
Archived November 13 ledger remains Git blob f93cb95c131647206bdf661b7328cae0bea34164, SHA256 d3b870ea97e0043486c74ac982b3d20e56b5b246f6ef8446fe1991fe8a8a2d64, USD22 recorded/USD8 unused. Candidate current November 14 ledger remains USD20 reserved/USD10 unallocated, not admitted. Review plus later accounting documentation review remains the same USD5 reservation.

## Actual fresh independent checks
- npm run factory:check: exit 0. Selected hygiene; 25 factory tests passed; src TypeScript check passed; 131 pinned runtime files verified, 0 downloaded; 573 application/CLI tests passed; production build passed; 129 hosted binaries pruned, attribution/metadata retained.
- Direct node/tsx camera suite, palace navigation and mounted scene restoration, CourtDialog/EmperorIntro, player gait/model, touch gestures and campaign simulator CLI: exit 0, 119 tests passed, zero failures/skips. These are additional execution of relevant interface tests, not 119 unique tests beyond aggregate.
- git diff --check d58563c HEAD: exit 0.
- All tracked working-file blob bytes independently matched frozen tree before aggregate and were rechecked after tests. Tracked candidate remained clean; local head/tree unchanged.
- Both original source directories remain clean at original heads/trees: maintenance f46fe8d8112c358738822ef2a9d488cefb27c35e/tree25de6ca71e2438354a6d058056329fcbb8494e61; oct23 98af5b1c5d0a07ecda6e9c9d08d00fccfab6bb8b/treec0c13d3e72e5eaa9c45f9533d65279b2c73ad15b.

Reviewed AGENTS, CODING_STANDARDS, ERRORS, DESIGN, CONTEXT including Realism, review contract and READINESS. Read runtime delta and affected scene/camera/navigation/dialog/model/touch callers plus direct tests. Camera front door owns bootstrap/fallback/entry/exit; removed camera path has no retained second implementation. No newly synthesized runtime bytes, dependencies, hooks, any, wrappers or source-text assertions were introduced by reconciliation. Existing pending jsdom/lock, camera package and tests are preserved input bytes. Existing large-file debt and selected-only hygiene/lint coverage are not represented as fully fixed.

## Limits and unchanged gates
This is NOT release-ready, runtime-main integration approval, browser proof or publication. No browser launch, CUA, headless/CDP alternate path, UI playthrough, or broad 100-seed balance study was performed. Existing Nov12 Chromium singleton-socket/ptrace Operation not permitted exit133 remains unresolved; no new materially relevant browser-launch evidence was asserted. jsdom and numerical scene/interface tests do not establish actual native top-layer focus/layout, WebGL, screenshots, hosted behavior, temporal/gait/CSS/touch controls, roles/reduced-motion or replay acceptance.
Historical H2, P0 #41/#42, parent release approval and all actual browser/hosted/replay/controls gates remain OPEN. Cloudflare reauthentication remains outside scope. Existing active/public Site V57 source abbf403ef771569533b802a88691696db4f0ce94 remains unchanged.
No remote writes, branch/main/runtime advancement, Site publication, issue/PR messages or closure, installation/download, paid service, purchase, account/credential/security permission change, live metrics/session or quota export occurred. Only ordinary scoped review artifact/test/build writes were requested through supported permission review; none were denied. Existing production bundle-size warning remains nonblocking and disclosed. Test scripts are not globally typechecked by existing src-only tsconfig; no full lint/dead-code certification is claimed.

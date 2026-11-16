# Unused legacy rule cleanup, November 16, 2026

## Partial issue #28, source only

Reviewed source `3a3bf17d6fdb56bc97d43e6cf5bea67a626bdecd`, tree `06dc6e0323671c8bac3624e2ba6b37e4225846ae`, removes only handlePromotion, calculateAmbitiousMessageEffects and calculateFactionEffects, their JSDoc, two exclusively dead type imports, and those three names from the architecture backlog. Exactly four files, 2 insertions/168 deletions; sole parent is admission/main `9d17a41cc47af78b93210dfb0899d53c0e015ea8`. Tested local head `c322779a03db0fa62b16095aa45bb178fdad0263` has identical complete tree/parent, different commit metadata.

Independent source review is clear. Every live statement, type, body, JSDoc and caller contract is preserved by an exact deletion-transform proof, not whitespace normalization. The ambitious_faction union member intentionally remains. No game/save/schema/RNG/event/actor rule, CSS/JSX, test, dependency, hook, wrapper, configuration or baseline changed.

Issue #28 remains open. Six exports remain: consortHostility, careerWindow, graphBackers, getRank, hasPromotedOffice, getDisabledActions. Locked-audience/pending-label work and other original acceptance are not completed. Earlier Nov15 cleanup remains intact.

## Fresh checks and unchanged production

Implementation and independent review each separately passed `npm run factory:check`: selected hygiene, 25 factory tests, 497 main application/CLI tests, src typecheck, 131 pinned assets/zero downloads, production build and pruning of 129 hosted binaries. Each separately passed 83 existing gameMachine/hateRules/influenceTuning/campaignStanding/courtStrategy/campaignSaveMigration tests, a subset of 497 rather than extra unique tests.

The reviewer ran its own fresh exact-base production build. All **285 production paths and 23,847,739 bytes are identical**, including JS, CSS, HTML, fonts, metadata, filenames and HTML references. No normalization, allowed differences or removal whitelist was needed.

Independent AST/import/caller review covers 187 code files: only three target identifiers, at declarations; 27 explicit named target-module consumers; no production dynamic import/eval/global registration or target string lookup. The 15 dynamic/evaluation inventory entries are nonproduction test/factory code. This is a private browser ESM application, not an external module SDK.

Existing Vite chunk/npm configuration warnings remain. Selected hygiene is not full lint/dead-export certification; src typecheck does not cover scripts/tests. No baseline full aggregate or new 100-seed study. Static/build/interface proof is not actual browser/replay proof.

## Evidence and preservation

[Implementation](implementation.md) and [independent source review](review.md) are byte-identical historical handoff reports, including then-outstanding closeout steps and then-current refs. [Integrity record](integrity.json) identifies exact source inputs/results, checks, complete payload equality and top-level artifact hashes. Raw files, complete provenance, source inventories and all manifest entries are hash-identified, not embedded.

Materialization verified all 694 recursive entries/621 blobs, modes/subtrees/root and reconstructed raw admission commit SHA. Six missing blobs were imported through the authenticated connector, 107 installed lock versions matched, and 131 pinned assets were verified before reuse. Shallow/incomplete older history is disclosed, not fabricated.

Original Nov15 checkout and old98 remain clean/unchanged; previous source proofs were not edited. Latest pending runtime remains `725a0fa51f58af28dadf216ea696216f286cda41` on `fix/palace-pending-reconciled-2026-11-14`, not integrated. Future integration must preserve then-current main and all maintenance. Missing older Nov13/14 raw logs were not claimed refreshed.

This five-document accounting/evidence-only closeout must clear exact independent review before main advancement. Source bytes stay identical to the approved candidate; no additional aggregate/browser run is claimed for documentation-only edits.

## Budget and release boundary

November 16 Asia/Ulaanbaatar conservative flat estimates: USD 20 recorded, zero reserved, USD 10 unallocated under USD 30. Source 8, independent review including closeout 5, all coordination 4, preservation 3. No further admission. Estimates are not billing/tokens. Both new jobs explicitly GPT-6.1 Sol / Medium under manual cloud v3 pin `7d756086b9938635e0cd11064a4d337eae747326`, one substantive job at a time.

November 15 archive stays byte-identical: blob `4cbda44ce17f6b4af834d7199af3cece33f67612`, SHA256 `6c197a17f579d9eb5df1e97400961492524afd9e0be2fea0004551631eff0628`, USD 20 recorded/USD 10 unused, no carry-forward.

No browser/server launch or Site publication. Existing Site remains active/public V57, source `abbf403ef771569533b802a88691696db4f0ce94`, at https://harem-empire-3d-development.alimar55555.chatgpt.site. Metadata is not runtime-health proof; no improvement is claimed live.

Nov12 Chromium socket/ptrace denial remains unresolved, with no materially new launch evidence. No CUA/CDP/headless/alternate launcher/flags/DOM/storage/tunnel retry. Cloudflare reauthentication remains outside scope. All actual browser/hosted/replay/controls/gait/CSS/touch/roles/reduced-motion, historical H2, P0 #41/#42 and parent release gates remain open. No purchase, paid service, install/download, account/credential/security grant, telemetry/quota export, issue/PR communication/closure, audience change or alternate publication.

# Unused UI hygiene, November 15, 2026

## Partial issue #28, not a release

Four-file source candidate `592b7f752eb54f68c83d1d21e0cd52b46adab188`, tree `6754c4ca5906a053eb7dddd32b6db12b84583689`, removes the unused CharacterResponse component, ten orphan quest CSS rules, the unused PALACE_CRAFT_LIGHTING export, and only that name from the architecture backlog. Sole parent is admission/main `8dc2a6f2e6e2f54cd32abb47f73e104c422a3121`. Tested local commit `5b66f2a02b46e9c2d31e633cadd07982d1222676` has identical full tree and parent; only metadata differs.

Independent review is clear for this source-only slice. Issue #28 remains open: interaction gates, pending-label work and nine other exports were not changed. No game rules, saves, schema, RNG, dependencies, hooks, wrappers or new tests. No new tracked source files; 4 insertions/60 deletions. This does not integrate pending runtime or publish a game update.

## Actual verification

Both implementation and independent review separately passed `npm run factory:check`: selected hygiene, 25 factory tests, 497 main application/CLI tests, src typecheck, 131 pinned assets/zero downloads, build and pruning of 129 hosted binaries. Each also passed 27 existing public gift/render/UI tests, a subset of aggregate rather than extra unique tests.

Independent import/dynamic-class ownership and AST review confirmed deleted targets are unused. All four live warning rules remain verbatim, including the base rule sharing a minified line. Every remaining authored palace.css selector/declaration/order/media context is unchanged.

Complete emitted JavaScript is byte-identical, 1,265,737 bytes, SHA256 `27c03106e2abd497e262b4fa250052aaac01911924277db0800fff3ddbb506cd`, despite Rollup filename changes. All 285 distribution files were inventoried; apart from JS/CSS hashed names, only HTML changes to reference those names.

Generated CSS shrinks from 137,480 to 135,621 bytes. This is not only ten quest rules: removing unused JSX also removes 14 Tailwind utility rules, four property registrations and nine variable declarations. Six unchanged `--tw-leading` fallback consumers remain. With no remaining source assignment/CSS setter, the former initial/absent states select the same explicit line-height fallbacks. Other removed variables have no remaining CSS consumers. Independent review checked this reasoning, not merely a removal whitelist. **This is static/build proof, not native browser/computed-style or layout evidence.**

Existing chunk-size and npm configuration notices remain. Selected hygiene is not full lint/dead-code certification; tests/scripts are outside src-only TypeScript checking. No baseline full aggregate or fresh balance study is claimed.

## Evidence and source identity

[Implementation](implementation.md) and [independent review](review.md) are byte-identical historical handoff snapshots, including their then-outstanding closeout steps and then-current refs. [Integrity record](integrity.json) identifies exact inputs/results, fresh checks, bundle differences and top-level artifact hashes. Raw logs, scripts, full source provenance and all distribution inventory entries are hash-identified, not embedded.

The exact admitted source was reconstructed through authenticated GitHub metadata/blobs and SHA-identical existing Git objects: 689 recursive entries/617 blobs, 23 missing blobs imported, every mode/blob/subtree and raw commit hash verified. Older local history remains shallow, not fabricated. Frozen source contains 616 tracked paths. Original checkouts remain clean and unchanged.

Older Nov13/14 scratch checkouts/raw logs are absent today; no fresh access/rehash of those missing logs is claimed. Their committed historical receipts and remote candidates remain available. Latest pending runtime stays `725a0fa51f58af28dadf216ea696216f286cda41` on `fix/palace-pending-reconciled-2026-11-14`; original 98 stays unchanged. Future runtime integration must preserve then-current main, including this cleanup.

This accounting/evidence-only snapshot must clear exact-documentation review before main advancement. It leaves the reviewed source bytes unchanged and does not claim another aggregate/browser run.

## Budget and release boundary

November 15 Asia/Ulaanbaatar estimates: USD 20 recorded, zero reserved, USD 10 unallocated under USD 30. Source 8, independent review including closeout 5, all coordination 4, preservation 3. No further admission. These are conservative flat planning estimates, not billing/tokens. Both new jobs explicitly GPT-6.1 Sol / Medium under manual cloud v3 pin `7d756086b9938635e0cd11064a4d337eae747326`, one substantive job at a time.

November 14 ledger archive remains byte-identical: blob `3decb411810176b1770ffd1e31582f301e30a972`, SHA256 `b1d82bf3580c5477de9505a1b491f663408b89f40578e72ce6c836aa0c406a97`, USD 20 recorded/USD 10 unused, no carry-forward.

No Site publication or browser/server launch. Existing Site remains active/public V57, source `abbf403ef771569533b802a88691696db4f0ce94`, at https://harem-empire-3d-development.alimar55555.chatgpt.site. Metadata is not runtime-health proof; no improvement is claimed live.

November 12 Chromium socket/ptrace denial remains unresolved; filesystem write permission or reconnection is not new launch evidence. No retry or alternate CUA/CDP/headless/launcher/DOM/storage/tunnel route. Cloudflare reauthentication remains outside scope. Actual browser/hosted/replay/controls/gait/CSS/touch/roles/reduced-motion, historical H2, P0 #41/#42 and parent release gates remain open. No purchase, paid service, install/download, account/credential/security grant, telemetry/quota export, issue/PR communication/closure, audience change or alternate publication.

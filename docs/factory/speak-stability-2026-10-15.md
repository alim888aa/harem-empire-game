# Speak stability maintenance receipt — October 15, 2026

Related issue: #40. Reviewed and browser-tested product head: `8dd570ce2773b3f34edb403ef0abaef1fe22b60e`.
Base: `2567fd9b3260523d558731b39adcd71217070b48`. This receipt and ledger update do not change runtime bytes.

## Implemented
- Fixed outer conversation frame with vertical internal scrolling and no disclosure drawers
- Expanded identity, faction, Support, Affection and Suspicion on the left; illustrated authored message-gifts on the right
- Deliberate selection, preview and compact illustrated submission retain existing costs, warnings, pending locks and receipts
- One cached shot per subject/viewport with 450 ms entry easing; content and scrolling cannot recut it
- Emperor subject priority, reduced motion, obstruction hold, focus and Escape behavior preserved

## Independent verification
Independent source review cleared product head 8dd570c, including the compact-action followup.
Independent checks: 491 application tests, TypeScript, production build and 131 runtime-asset hashes; 21 gift/layout tests rerun on final head.
Worker aggregate `npm run factory:check`: 25 factory tests and 491 application tests pass, TypeScript and production build pass. Existing bundle-size warning remains.

Supported cloud browser software-rendered walkthrough on exact runtime bytes:
- 390×844: dialog 338×540.15625; document width/scrollWidth both390, body width/scrollWidth both328
- 1440×900: dialog880×520; document width/scrollWidth both1440, body width/scrollWidth both870
- Zero details elements; dossier left, illustrated choices right
- Political/romantic gift selection and successful receipts, proposal refusal, insufficient-gift warning, internal scrolling, repeated reopen, rapid close and Escape preserve bounds
- Content changes/scrolling retain the projected camera; genuine viewport resizing reframes
- Normal seasonal Emperor summons owns the modal and retains the approach-to-arrival disabled/enabled gate

Runtime bytes:
- `assets/index-D1qF229b.js`: SHA-256 `27c03106e2abd497e262b4fa250052aaac01911924277db0800fff3ddbb506cd`
- `assets/index-BB9obGFd.css`: SHA-256 `0853e8ea53af879c7c6245f17c02444d82dc562199124a97cf62cbcf66de0ab5`

## Explicit limitations
Cloud browser WebGL was disabled. Software screenshots/projected-camera telemetry are not WebGL material, model-motion, fidelity or performance proof.
Animation frame-by-frame/video, physical mobile gestures and an exact simultaneous Emperor/social-event overlap were not run.
This is a bounded #40 improvement, not full visual certification or a fix for #41/#42. Publication is recorded below without expanding those verification claims.

## Estimated allowance
October 15 Asia/Ulaanbaatar: USD22 recorded across build6, owner/release4, review5 and browser7; USD8 remains.
These are conservative flat planning estimates, not actual billing or token counts. All four estimates are recorded after publication; the total remains USD22 and headroom remains USD8.

## Publication
Published V57 to the existing public game site on 2026-10-15T01:56:30.264162Z:
https://harem-empire-3d-development.alimar55555.chatgpt.site

- Source main: `b78c6a9eb1ea12b68bf5cd19171b7119b3537736` (PR #43)
- Sites source: `abbf403ef771569533b802a88691696db4f0ce94`
- Version: `appgprj_6abddaa19b848191b6c0fa773aa8f0b5~appgver_927be9fb96ec81919acd875a5f310f0e`
- Deployment: `appgdep_6ad032c454448191ba166663b39693ee`
- Environment revision: 0
- Published runtime hashes match the reviewed and browser-tested product head 8dd570c above
- Owner/release USD4 is now recorded complete; all October 15 entries total USD22 with USD8 headroom
- No new engineering admissions are started by this documentation-only closure

The verification limitations above remain; publication does not claim WebGL certification or completion of #41/#42.

# Player wardrobe release, V53

## Scope
This release replaces the nine player rank outfits across the Prince, Scholar/Minister and Concubine careers, plus the three character-selection portraits rendered from the actual new models. It retains the V52 performance, camera, dialog and Crown Prince NPC material fixes without modification.

Only the player runtime files, their cache-key/hash registrations, player provenance and player-specific tests changed. The portraits depict the registered starting outfits. No NPC art, palace geometry, gameplay balance, saved campaign fields or physical movement settings changed.

## Runtime contract
- All nine final assets retain the original 57- or 63-joint order, inverse bind matrices and seven bone-animation payloads: Idle, Walk, Run, Gift_Present, Jump_Start, Jump_Air and Land.
- Each outfit has one 1024×1024 RGBA atlas and 3–5 color-pass draw primitives. Cloth uses nine run-corrective targets; character skeleton and control behavior remain compatible with V52.
- All nine GLBs total 26,972,432 bytes, down from 35,464,880 bytes. These are asset metrics, not measured iPad performance.
- The native rig/motion sources and editable authoring checkpoint are preserved separately; this integration uses the reviewed final runtime derivatives only.

## Verification
- Canonical typecheck, all 471 tests and production build passed after integration.
- Tests exercise actual GLB loading, original motion phases, controlled loading failure/retry, hot promotion/demotion swaps, preservation of the spatial parent, and disposal/cache accounting.
- Independent audit evidence is recorded under validation/player-v53, including exact final file hashes, rig/motion checks and shared-rig compatibility.
- Final exported-model appearance and motion proof images were reviewed before integration. Browser/graphics-device QA and actual iPad FPS remain unverified because the supported preview environment is blocked.
- All 288 unrelated deployed non-bundle assets remain byte-identical. The existing public Site and its access mode are retained.

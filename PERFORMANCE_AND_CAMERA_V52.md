# Performance and conversation repair, V52

## Runtime changes
- Fixed duplicated skeletons produced by SkeletonUtils cloning: one private skeleton now serves each actor's meshes when the source asset shared that rig. The player's 9 rigs become 1; Consort's 112 become 1; Dowager's 103 become 1. Real-GLB checks at Walk t=0.4 found identical bind and animated bone matrices. Geometry, textures and animation source bytes are unchanged.
- Render at no more than 60 Hz across 60/90/120/144 Hz screens. Settled paused backdrops render at 10 Hz, while camera transitions, gifts and imperial encounters retain active cadence. Hidden tabs do no scene work. Campaign time remains separate.
- Bound touch framebuffer resolution to DPR 1 and 1.6 million pixels, desktop to DPR 1.5 and 3 million pixels. Sustained slow frames reduce framebuffer scale gradually to 75% and recover gradually when frame delivery improves. This changes rendered pixels, never model or texture detail.
- Refresh shadows at most 30 Hz and projected DOM labels at most 20 Hz. Avoid repeated viewport layout reads and unchanged gate-label text writes.
- Decode at most two distinct models concurrently. Start the player request first, skip cancelled queued models, and defer/sequence speculative adjacent-room and Emperor warmups until current characters are ready.

## Screenshot repairs
- Conversations and their actions resolve by courtier name rather than a potentially stale selected index. This closes a credible path to a paused scene without its dialogue and prevents gifts/romance from targeting another courtier after roster reorder.
- Conversation panels use a compact full-width flow. Speech and actions precede collapsed courtier details; all controls stay in the one shared scroll region. Classic 2D composition remains unchanged.
- Camera planning fits both upper bodies into the visible area above the dialogue. It validates actual candidate positions against walls, ceiling and palace bounds, and preserves the ordinary view when no readable composition exists. It never applies the old 1.5%-length ray shrink to a dialogue pose.
- Speech-bubble placement protects both the NPC and the player, with the existing dialogue-copy fallback when there is insufficient room.
- Crown Prince face/hair depth repair is restricted to ten explicitly verified opaque materials on one exact asset URL. Their texture alpha pixels are all 255 despite exported BLEND flags. Restoring opaque depth writing is supported by the source evidence and likely addresses rear hair drawing over the face. Other genuinely transparent materials remain unchanged; final rendered visual confirmation is still required.

## Verification and limitations
- Typecheck passed; all 465 automated tests passed; production build passed.
- New coverage includes cadence/pixel budgets, stable conversation identity, camera projection/collision/bounds, dialogue structure, shared rigs, independent actor animation/disposal, decode queue cancellation, and scoped material behavior.
- The supported portable preview was retried. Its readiness command fails at sandbox initialization; browser navigation and actual iPad/Safari FPS or after-change visual QA were not completed. No device-speed claim is made.
- Audit JSON under validation/performance-v52 records rig equality, active asset costs, static-world costs and Crown Prince face/texture evidence.
- A pre-existing casualty fixture was made internally coherent when it changes a plotter's influence-derived faction. Gameplay rules and assertions remain unchanged.
- The release preserves all deployed non-bundle asset bytes and changes only the HTML entry and application JS/CSS.

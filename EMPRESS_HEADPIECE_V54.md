# Player Empress phoenix headpiece, V54

This is a scoped update to the player Empress only. It replaces the tiny flower with a fitted gold phoenix comb seated on the bun, joined garnet side pins, and hanging pearl strands. The other eight player outfits, selection portraits, NPC art, palace art, gameplay, and V52 performance/camera/UI fixes are unchanged.

The final Empress GLB is 4,217,784 bytes, SHA-256 c4351ca3937016092c65d5cf21dae96b4b3b61bf065a205ce301ae231257246e. Runtime draw primitives remain five, the atlas remains 1024×1024 RGBA, the rig remains 63 joints, and cloth retains nine corrective targets. Triangles increase from 69,656 to 73,012 for the ornament.

Independent binary comparison against V53 verifies identical joint transforms/order, inverse binds and all seven bone-animation payloads. Current runtime cloning tests verify private skeletons and morph weights, finite skin/morph animation and proper disposal. Source preservation evidence records forty existing non-headpiece meshes/UV/weights/cloth shapes preserved. Final exported-model front/side/back and motion proofs were reviewed.

Canonical typecheck, all 471 automated tests and production build pass. Browser/graphics-device QA and actual iPad FPS remain unverified because the supported preview environment is blocked. The existing public Site and access mode are preserved.

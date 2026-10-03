# Shadow Emperor: anatomical cloth checkpoint

This checkpoint replaces the rejected procedural-body construction with real male MPFB anatomy and sewn, simulated garment panels. It is an actual textured, skinned Blender/GLB model. The pictures and movement clip are renders of geometry, not concept images. Appearance has not been approved by the user as final quality.

## What changed

The earlier boxiness came from near-planar front panels, rigid shoulder construction, detached sleeve shapes and regular folds. That was a structural problem. This version starts with MPFB male head/neck/shoulder/chest/waist anatomy. Front, back and side-gusset cloth panels were sewn and settled around that body using Blender cloth simulation, then fitted into a relaxed crossed front. Shoulders slope continuously into the robe, without separate arm caps or exposed hands. A soft waist gather controls volume without a rigid horizontal belt ledge. Excess ground pooling and dangling collar ends were removed.

The source retains the anatomical body as a hidden collision/reference object. The runtime excludes its torso, arms and hands altogether, so those cannot emerge through the cloth. Visible skin is limited to the real head and neck. The arms-down reference pose creates the continuous concealed-arm silhouette.

The bare face is obscured by the physical crown and lighting. There is no veil, hood, opaque mask, black face paint or face-covering plane. Bright diagnostic illumination naturally reveals the real face. The existing crown and ornament geometry was refitted to the anatomical skull. Black/charcoal, gold, crimson and jade materials are restored in the runtime.

## Delivered files

- emperor-quality-checkpoint.blend: packed editable high-detail source, rig, hidden anatomy/reference and lighting
- emperor-quality-checkpoint.glb: runtime review model with embedded textures and two in-place animations
- emperor-full-body.png: actual high-detail source three-quarter render, shadowed face
- emperor-closeup.png: actual high-detail source closeup, shadowed face
- emperor-approach.mp4: animation rendered after independently importing the delivered GLB; this proves the runtime geometry rather than only the higher-detail source

Previous Library versions retain the earlier geometry and its corresponding pictures/video. Do not label an old video as evidence of this mesh. The new neutral diagnostic front/profile/three-quarter renders and neutral animated-hem stills are also preserved in the project checkpoint.

## Runtime facts and validation

- GLB SHA256: 1c86ef5afaec145896d747ebc3c82e9489eb63205168947ebea82188ad1392e1
- GLB size: 16,629,868 bytes
- Runtime triangles: 212,846; source triangles: 452,536
- 18 mesh objects, 15 materials, 57 joints, one skin; all runtime meshes are skinned
- Embedded texture dimensions capped at 1024 pixels
- Units: meters; GLB +Y up and +Z forward
- Clips: Imperial_Idle and Imperial_Approach, each approximately 4.0417 seconds
- Both clips are in place; independently verified root translation range is zero on all axes. The game must handle world translation

An independent GLB import was sampled over both animation clips. Only actual GLB mesh nodes were measured; Blender importer bone-display helper meshes were excluded.

Rest bounds, in GLB/Three coordinates:
- Min XYZ: (-0.413829, 0.004315, -0.307660) m
- Max XYZ: (0.447330, 2.177166, 0.309060) m
- Width x depth x height: 0.861159 x 0.616720 x 2.172851 m

Full animated envelope:
- Min XYZ: (-0.426013, -0.000506, -0.311861) m
- Max XYZ: (0.460443, 2.177330, 0.310935) m
- Width x depth x height: 0.886456 x 0.622796 x 2.177837 m
- Maximum root-centered horizontal radius: 0.464364 m
- Robe alone: maximum width 0.886456 m, depth 0.606195 m
- Suggested conservative game clearance: radius 0.60 m, overhead 2.30 m

The actual GLB walk renders and diffuse hem checks show alternating feet without exposed hands, arm lobes or anatomical skin emerging. The robe stays at least about 3.4 cm above the ground. The minimum shoe point is approximately 0.5 mm below ground at one sampled pose, within a small foot-contact tolerance.

## Reproducible shadow direction

Coordinates below are relative to the character origin in Three.js (+Y up, +Z forward). They use ordinary lights and physical crown shadow; no special renderer-only face trick is used. Blender watts do not map directly to Three intensity, so match direction and low fill first.

- Key: (-0.1, 5.5, 0.4), aimed at (0, 1.1, 0); warm, compact 0.28 m area in Blender, 500 W
- Rear rim: (0, 3.2, -2.2), aimed at (0, 1.4, 0); warm, 0.65 m area, 620 W
- Cool garment spot: (-1.3, 1.7, 2.5), aimed at (0, 0.9, 0); half-angle 0.33 rad, 260 W in Blender
- Warm garment spot: (1.2, 1.5, 2.1), aimed at (0, 0.85, 0); half-angle 0.315 rad, 170 W in Blender
- Source world strength: 0.018; world color linear RGB (0.13, 0.15, 0.18)
- Source floor linear RGB (0.012, 0.014, 0.017), roughness 0.8, limiting bounced face fill
- Source exposure -0.25, AgX Medium High Contrast

The prior key position (0, 5.4, 1.1) was too far forward for this anatomical face and revealed the nose. Keep the key more overhead, enable crown castShadow and face receiveShadow, and use low ambient fill. A bright palace environment may reveal the face unless the local lighting is calibrated. Stage, camera and preview lights are excluded from the GLB.

## Honest remaining limits

This is a materially improved character checkpoint, not final photorealistic or concept-exact art. The cloth was physically draped for its rest shape, but runtime motion is bone-driven, not realtime cloth simulation. The lower hem and side drape still move somewhat stiffly. The seam/border treatment, collar finish, embroidery scale, UV placement and fabric maps remain early; source image detail exceeds the reduced runtime in close inspection. Further tailored folds, sculpting, retopology, UV refinement and animation would improve it. LODs and material consolidation are needed before using similarly expensive models for crowds.

## Provenance

Male anatomy was created with installed MPFB 2.0.17 in Blender 4.3.2 using the official MakeHuman/MPFB assets (CC0 asset material). Garment panels, fit, rig adaptation, procedural animation and materials were authored for this project. Crown/ornaments and embroidery direction reuse the earlier authored emperor checkpoint. No paid assets, purchases or commercial generation services were used.

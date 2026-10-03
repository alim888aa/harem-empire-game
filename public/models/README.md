# Palace runtime assets

These are actual textured, rigged/meshed GLB assets. Offline proof renders are not browser screenshots. The software QA route uses explicit low-detail stand-ins; it does not reproduce these materials, geometry, skinning or shadows.

- emperor-runtime.glb: MPFB anatomical head/neck with project-authored simulated draped cloth, 212,846 triangles, 57 joints, two in-place clips, 16.63 MB. No exported arms/hands. See emperor-manifest.json, emperor-bounds.json, emperor-notes.md and emperor-lighting-reference.json. Game scale is 1.1, with 0.66 m radius and 2.53 m overhead clearance. Face visibility depends on crown shadow and calibrated low ambient fill; cloud WebGL calibration remains unverified.
- maid-ling-runtime.glb: portrait-fitted MPFB model with original costume/hair, 171,650 triangles, 57 joints, Idle/Walk/Gift_Reaction clips, 10.68 MB. See maid-ling-manifest.json and maid-ling-provenance.json. Hair, cloth and likeness remain approximate.
- imperial-throne.glb: original lacquer/teal/gold chair and five-panel screen, 46,090 triangles, 5.5 MB. See imperial-throne-manifest.json and imperial-throne-provenance.txt. Place at (0, 0.56, -25) in the current palace; no preview stage or lights are embedded.

All three use meters, +Y up and +Z forward. Exact hashes and asset-specific measurements are in their manifests. Original editable Blender sources, scripts and imported-GLB proof videos are preserved separately from the browser runtime. No asset is claimed as user-approved final appearance.

Prince runtime: prince-runtime.glb,165,632triangles,59joints,10.12MB; shared portrait for Prince player and Prince Feng. Real Idle/Walk/Run/Gift_Present clips. See prince-player-manifest.json and prince-player-provenance.json for imported bounds/contact measurements. Simplified hair, skinned cloth and sparse ornament remain work-in-progress limitations.


## Distinct anime player and rank outfits (next publication)
The player now uses player-prince-anime.glb; NPC Prince Feng retains the separate prior prince-runtime.glb until his own anime model is authored. The player GLB has a custom anime face/hair, plain ivory/teal wardrobe, zero embedded textures and seven inspected clips. Grand/Crown variants preserve non-outfit geometry and clips, adding rank insignia and a skinned teal over-robe. Promotions and demotions replace only the player's leased art, not campaign actors or the player/camera position.

These are inspected technical checkpoints, not user-approved final model appearances. Runtime hashes and materials/provenance are in the anime-player and prince-rank JSON manifests. Editable Prince source is Library [source archive]; self-contained rank source is [source archive].

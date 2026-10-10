/** Repairs only alpha-mode errors verified against the exact immutable source asset. */
import * as THREE from 'three';
export const VERIFIED_CROWN_ASSET = '/models/scoped-t4/anime-crown-prince-00197e287f3a8520.glb?v=00197e287f3a8520';
const crownHair = 'CrownPrince_npc-prince-han-adult-identity-v1__hair__';
const opaqueCrownMaterials = new Set([
  'CrownPrince_M00_000_00_Face_00_SKIN', crownHair,
  ...Array.from({length: 8}, (_, index) => `${crownHair}.${String(index + 1).padStart(3, '0')}`),
]);

/** These face/hair maps contain only alpha=255. Preserve genuine lashes and other transparent materials. */
export function repairVerifiedMaterialDepth(url: string, root: THREE.Object3D): number {
  if (url !== VERIFIED_CROWN_ASSET) return 0;
  const repaired = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!opaqueCrownMaterials.has(material.name) || material.opacity !== 1 || repaired.has(material)) continue;
      material.transparent = false;
      material.depthWrite = true;
      material.needsUpdate = true;
      repaired.add(material);
    }
  });
  return repaired.size;
}

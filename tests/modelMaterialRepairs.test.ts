import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {repairVerifiedMaterialDepth, VERIFIED_CROWN_ASSET} from '../src/palace/modelMaterialRepairs';
import {scopedCourtModelSpec} from '../src/palace/scopedCourtRegistry';
function fixture() {
  const root = new THREE.Group();
  const names = ['CrownPrince_M00_000_00_Face_00_SKIN',
    'CrownPrince_npc-prince-han-adult-identity-v1__hair__',
    'CrownPrince_npc-prince-han-adult-identity-v1__hair__.008',
    'CrownPrince_eyelashes', 'Glass'];
  const map = new THREE.Texture();
  const materials = names.map(name => {
    const material = new THREE.MeshStandardMaterial({map, transparent: true, depthWrite: false, side: THREE.DoubleSide});
    material.name = name;
    root.add(new THREE.Mesh(new THREE.BoxGeometry(), material));
    return material;
  });
  return {root, materials, map};
}
test('verified opaque Crown face/hair write depth without changing texture, geometry or color', () => {
  assert.equal(scopedCourtModelSpec('Crown Prince')?.file, VERIFIED_CROWN_ASSET);
  const {root, materials, map} = fixture();
  const geometries = root.children.map(mesh => (mesh as THREE.Mesh).geometry);
  assert.equal(repairVerifiedMaterialDepth(VERIFIED_CROWN_ASSET, root), 3);
  for(const material of materials.slice(0, 3)) {
    assert.equal(material.transparent, false);
    assert.equal(material.depthWrite, true);
    assert.equal(material.side, THREE.DoubleSide);
    assert.equal(material.map, map);
    assert.equal(material.color.getHex(), 0xffffff);
  }
  assert.deepEqual(root.children.map(mesh => (mesh as THREE.Mesh).geometry), geometries);
});
test('genuine transparent materials and an updated/unverified model are left untouched', () => {
  const {root, materials} = fixture();
  assert.equal(repairVerifiedMaterialDepth('/models/new-crown.glb', root), 0);
  assert.ok(materials.every(material => material.transparent && !material.depthWrite));
  materials[0].opacity = .8;
  repairVerifiedMaterialDepth(VERIFIED_CROWN_ASSET, root);
  assert.ok(materials[0].transparent && !materials[0].depthWrite);
  assert.ok(materials.slice(3).every(material => material.transparent && !material.depthWrite));
});

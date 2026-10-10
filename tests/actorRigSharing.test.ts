// Verifies rig ownership through the public model-instance leasing interface.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { acquireModelInstance, ModelAssetPool } from '../src/palace/assetPool.ts';

function outfitTemplate(meshCount = 3) {
  const scene = new THREE.Group();
  const bone = new THREE.Bone();
  bone.name = 'CourtierBone';
  scene.add(bone);
  scene.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton([bone]);
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial();
  for (let index = 0; index < meshCount; index++) {
    const mesh = new THREE.SkinnedMesh(geometry, material);
    mesh.name = `OutfitPart${index}`;
    mesh.bind(skeleton, new THREE.Matrix4().makeTranslation(index, 0, 0));
    scene.add(mesh);
  }
  const animations = [new THREE.AnimationClip('Idle', 1, [
    new THREE.NumberKeyframeTrack('CourtierBone.position[y]', [0, 1], [0, 2]),
  ])];
  return { scene, animations } as unknown as GLTF;
}

function skinnedMeshes(root: THREE.Object3D) {
  const meshes: THREE.SkinnedMesh[] = [];
  root.traverse(object => {
    if (object instanceof THREE.SkinnedMesh) meshes.push(object);
  });
  return meshes;
}

test('one actor shares a private rig across every outfit primitive, preserving bind matrices and art', async () => {
  const template = outfitTemplate(112);
  const originals = skinnedMeshes(template.scene);
  const sourceSkeleton = originals[0].skeleton;
  const sourceMatrices = originals.map(mesh => mesh.bindMatrix.clone());
  const sourceInverses = originals.map(mesh => mesh.bindMatrixInverse.clone());
  const pool = new ModelAssetPool(100, async () => new ArrayBuffer(20), async () => template);
  const actor = await acquireModelInstance('/multi-part-outfit', pool);
  const meshes = skinnedMeshes(actor.root);
  const skeletons = new Set(meshes.map(mesh => mesh.skeleton));
  assert.equal(meshes.length, 112);
  assert.equal(skeletons.size, 1, 'one bone palette per actual rig, not per render primitive');
  assert.notEqual(meshes[0].skeleton, sourceSkeleton);
  assert.notEqual(meshes[0].skeleton.bones[0], sourceSkeleton.bones[0]);
  for (let index = 0; index < meshes.length; index++) {
    assert.equal(meshes[index].geometry, originals[index].geometry);
    assert.equal(meshes[index].material, originals[index].material);
    assert.deepEqual(meshes[index].bindMatrix.elements, sourceMatrices[index].elements);
    assert.deepEqual(meshes[index].bindMatrixInverse.elements, sourceInverses[index].elements);
    assert.equal(originals[index].skeleton, sourceSkeleton, 'the pooled template stays immutable');
  }
  let disposals = 0;
  meshes[0].skeleton.dispose = () => { disposals++; };
  actor.dispose();
  actor.dispose();
  assert.equal(disposals, 1);
  assert.equal(pool.stats().decodedAssets, 0);
});

test('separate actors retain independent animation bones and release their rigs separately', async () => {
  const template = outfitTemplate();
  const sourceSkeleton = skinnedMeshes(template.scene)[0].skeleton;
  const pool = new ModelAssetPool(100, async () => new ArrayBuffer(20), async () => template);
  const [first, second] = await Promise.all([
    acquireModelInstance('/courtier', pool),
    acquireModelInstance('/courtier', pool),
  ]);
  const firstMeshes = skinnedMeshes(first.root);
  const secondMeshes = skinnedMeshes(second.root);
  const firstSkeleton = firstMeshes[0].skeleton;
  const secondSkeleton = secondMeshes[0].skeleton;
  assert.notEqual(firstSkeleton, secondSkeleton);
  assert.notEqual(firstSkeleton.bones[0], secondSkeleton.bones[0]);
  const firstMixer = new THREE.AnimationMixer(first.root);
  const secondMixer = new THREE.AnimationMixer(second.root);
  firstMixer.clipAction(template.animations[0]).play();
  secondMixer.clipAction(template.animations[0]).play();
  firstMixer.update(.25);
  secondMixer.update(.75);
  assert.equal(firstSkeleton.bones[0].position.y, .5);
  assert.equal(secondSkeleton.bones[0].position.y, 1.5);
  assert.equal(sourceSkeleton.bones[0].position.y, 0);
  assert.ok(firstMeshes.every(mesh => mesh.skeleton === firstSkeleton));
  assert.ok(secondMeshes.every(mesh => mesh.skeleton === secondSkeleton));
  let firstDisposals = 0, secondDisposals = 0, sourceDisposals = 0;
  firstSkeleton.dispose = () => { firstDisposals++; };
  secondSkeleton.dispose = () => { secondDisposals++; };
  sourceSkeleton.dispose = () => { sourceDisposals++; };
  first.dispose(firstMixer);
  first.dispose(firstMixer);
  assert.deepEqual([firstDisposals, secondDisposals, sourceDisposals], [1, 0, 0]);
  assert.equal(pool.stats().liveLeases, 1);
  secondMixer.update(.1);
  assert.ok(Math.abs(secondSkeleton.bones[0].position.y - 1.7) < 1e-6);
  second.dispose(secondMixer);
  second.dispose(secondMixer);
  assert.deepEqual([firstDisposals, secondDisposals, sourceDisposals], [1, 1, 1]);
  assert.equal(pool.stats().liveLeases, 0);
});

test('different source rigs remain distinct even when they reference the same bones', async () => {
  const template = outfitTemplate(2);
  const original = skinnedMeshes(template.scene)[0];
  const extra = new THREE.SkinnedMesh(original.geometry, original.material);
  const distinctRig = new THREE.Skeleton(original.skeleton.bones, [new THREE.Matrix4().makeTranslation(0, -2, 0)]);
  extra.bind(distinctRig, new THREE.Matrix4().makeTranslation(0, 2, 0));
  template.scene.add(extra);
  const pool = new ModelAssetPool(100, async () => new ArrayBuffer(20), async () => template);
  const actor = await acquireModelInstance('/multi-rig', pool);
  const meshes = skinnedMeshes(actor.root);
  assert.equal(new Set(meshes.map(mesh => mesh.skeleton)).size, 2);
  assert.equal(meshes[0].skeleton, meshes[1].skeleton);
  assert.notEqual(meshes[0].skeleton, meshes[2].skeleton);
  assert.equal(meshes[0].skeleton.bones[0], meshes[2].skeleton.bones[0]);
  assert.notEqual(meshes[2].skeleton.bones[0], original.skeleton.bones[0]);
  assert.deepEqual(meshes[2].skeleton.boneInverses[0].elements, distinctRig.boneInverses[0].elements);
  assert.deepEqual(meshes[2].bindMatrix.elements, extra.bindMatrix.elements);
  let disposals = 0;
  for (const skeleton of new Set(meshes.map(mesh => mesh.skeleton))) {
    skeleton.dispose = () => { disposals++; };
  }
  actor.dispose();
  actor.dispose();
  assert.equal(disposals, 2);
});

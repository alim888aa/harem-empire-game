import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

// CPU validation of the delivered mesh/rig/animations. Surface texture references
// are removed from an in-memory copy only, so no browser/GPU/image loader is needed.
// This is intentionally not rendered-material or GPU-skinning evidence.
const bytes = readFileSync(process.argv[2] ?? 'public/models/maid-ling-runtime.glb');
assert.equal(bytes.readUInt32LE(0), 0x46546c67);
const jsonLength = bytes.readUInt32LE(12);
const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
const binary = bytes.subarray(20 + jsonLength + 8);
document.materials = (document.materials ?? []).map((m: { name?: string }) => ({ name: m.name, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } }));
delete document.images; delete document.textures; delete document.samplers;
delete document.extensionsUsed; delete document.extensionsRequired;
const json = Buffer.from(JSON.stringify(document));
const padding = (4 - json.length % 4) % 4;
const jsonChunk = Buffer.concat([json, Buffer.alloc(padding, 0x20)]);
const output = Buffer.alloc(12 + 8 + jsonChunk.length + 8 + binary.length);
output.writeUInt32LE(0x46546c67, 0); output.writeUInt32LE(2, 4); output.writeUInt32LE(output.length, 8);
output.writeUInt32LE(jsonChunk.length, 12); output.writeUInt32LE(0x4e4f534a, 16); jsonChunk.copy(output, 20);
const offset = 20 + jsonChunk.length;
output.writeUInt32LE(binary.length, offset); output.writeUInt32LE(0x004e4942, offset + 4); binary.copy(output, offset + 8);
const gltf = await new GLTFLoader().parseAsync(output.buffer, '');
const one = clone(gltf.scene), two = clone(gltf.scene);
const meshes = (root: THREE.Object3D) => { const result: THREE.SkinnedMesh[] = []; root.traverse(o => { if (o instanceof THREE.SkinnedMesh) result.push(o); }); return result; };
const a = meshes(one), b = meshes(two);
assert.ok(a.length > 0); assert.equal(a.length, b.length);
for (let i = 0; i < a.length; i++) {
  assert.equal(a[i].geometry, b[i].geometry, 'Geometry should be shared');
  assert.equal(a[i].material, b[i].material, 'Materials should be shared');
  assert.notEqual(a[i].skeleton, b[i].skeleton, 'Each actor needs its own skeleton');
  assert.notEqual(a[i].skeleton.bones[0], b[i].skeleton.bones[0], 'Bones must not be shared');
}
const pose = (root: THREE.Object3D) => { const values: number[] = []; root.traverse(o => { if (o instanceof THREE.Bone) values.push(...o.quaternion.toArray(), ...o.position.toArray()); }); return values; };
const rest = pose(one), frozen = pose(two);
const clip = gltf.animations.find(c => /walk|approach/i.test(c.name)); assert.ok(clip);
const mixer = new THREE.AnimationMixer(one); mixer.clipAction(clip).play(); mixer.update(.37);
assert.notDeepEqual(pose(one), rest, 'The real exported clip must move the actor');
assert.deepEqual(pose(two), frozen, 'Animating one actor must not move its sibling');
mixer.stopAllAction(); mixer.uncacheRoot(one);
console.log(`PASS: ${a.length} skinned mesh parts share geometry/materials with independent animated bones (${clip.name}). CPU check only; GPU appearance unverified.`);

// Exercises readable imperial framing beside real Library shelves through the camera interface.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createPalaceWorld } from '../../src/palace/world';
import { playerMovementSpeeds } from '../../src/palace/characterModels';
import { PalaceCamera, frameConversationCamera, type CameraPose, type ConversationCameraInput } from '../../src/palace/camera';

const viewports = [
  { width: 1180, height: 812, top: 110, bottom: 540 },
  { width: 1440, height: 900, top: 110, bottom: 430 },
  { width: 390, height: 844, top: 185, bottom: 450 },
];
const pose = ({ position, target }: CameraPose): CameraPose => ({ position, target });

function assertReadable(input: ConversationCameraInput, frame: CameraPose) {
  const camera = new THREE.PerspectiveCamera(55, input.viewport.width / input.viewport.height, .1, 130);
  camera.position.set(frame.position.x, frame.position.y, frame.position.z);
  camera.lookAt(frame.target.x, frame.target.y, frame.target.z);
  camera.updateMatrixWorld(true);
  for (const blocker of input.blockers) {
    const expanded = new THREE.Box3(
      new THREE.Vector3(blocker.x - blocker.w / 2 - .22, blocker.minY - .22, blocker.z - blocker.d / 2 - .22),
      new THREE.Vector3(blocker.x + blocker.w / 2 + .22, blocker.height + .22, blocker.z + blocker.d / 2 + .22),
    );
    assert.equal(expanded.containsPoint(camera.position), false, 'the endpoint retains camera clearance');
  }
  for (const actor of [input.player, input.subject]) {
    for (const height of [actor.height * .42, actor.height + .12]) {
      for (const dx of [-actor.radius!, actor.radius!]) {
        for (const dz of [-actor.radius!, actor.radius!]) {
          const body = new THREE.Vector3(actor.position.x + dx, actor.position.y + height, actor.position.z + dz);
          const projected = body.clone().project(camera);
          const x = (projected.x + 1) * input.viewport.width / 2;
          const y = (1 - projected.y) * input.viewport.height / 2;
          assert.ok(projected.z > -1 && projected.z < 1 && x >= 12 && x <= input.viewport.width - 12);
          assert.ok(y >= input.viewport.top && y <= input.viewport.bottom);
          const distance = camera.position.distanceTo(body);
          const ray = new THREE.Ray(camera.position, body.clone().sub(camera.position).normalize());
          for (const blocker of input.blockers) {
            const box = new THREE.Box3(
              new THREE.Vector3(blocker.x - blocker.w / 2, blocker.minY, blocker.z - blocker.d / 2),
              new THREE.Vector3(blocker.x + blocker.w / 2, blocker.height, blocker.z + blocker.d / 2),
            );
            const hit = ray.intersectBox(box, new THREE.Vector3());
            assert.ok(!hit || camera.position.distanceTo(hit) > distance, 'actual architecture must not obscure an actor');
          }
        }
      }
    }
  }
}

for (const role of ['prince', 'minister', 'concubine'] as const) {
  test(`${role} beside a Library shelf retains a readable imperial entry with a legal small body gap`, t => {
    const world = createPalaceWorld([], role, false, 'library');
    t.after(() => world.dispose());
    const movement = playerMovementSpeeds(role);
    const player = { x: -6.08, y: 0, z: 14 };
    const subject = { x: player.x + Math.sin(Math.PI / 12) * 2.7, y: 0, z: player.z - Math.cos(Math.PI / 12) * 2.7 };
    const blockers = [...world.colliders, ...world.viewBlockers];
    assert.ok(world.colliders.every(blocker =>
      Math.abs(player.x - blocker.x) >= blocker.w / 2 + movement.radius ||
      Math.abs(player.z - blocker.z) >= blocker.d / 2 + movement.radius), 'ordinary collision permits this pose');
    const shelf = world.colliders.find(blocker => blocker.x === -7 && blocker.z === 14)!;
    const gap = player.x - movement.radius - (shelf.x + shelf.w / 2);
    assert.ok(gap > 0 && gap < .04, 'actor bounds are outside the real shelf, inside the old sightline padding');
    const follow = { player, yaw: 0, pitch: .22, distance: 5.7, ceilingHeight: world.ceilingHeight, blockers };
    const ordinary = pose(new PalaceCamera(follow).step(follow, null, 0, false));
    for (const viewport of viewports) {
      const input: ConversationCameraInput = {
        player: { position: player, height: movement.height, radius: movement.radius },
        subject: { position: subject, height: 2.53, radius: .66 }, viewport,
        blockers, bounds: world.bounds, ceilingHeight: world.ceilingHeight,
        preferredYaw: Math.atan2(player.x - subject.x, player.z - subject.z) + 1.05,
        fallback: ordinary,
      };
      const planned = frameConversationCamera(input);
      assert.equal(planned.framed, true, `${viewport.width}: a legal shelf-adjacent actor must not force ordinary fallback`);
      assertReadable(input, planned);
      for (const reducedMotion of [false, true]) {
        const camera = new PalaceCamera(follow);
        let settled = camera.step(follow, null, 0, reducedMotion);
        for (let frame = 0; frame < 60; frame++) {
          settled = camera.step(follow, { key: `@emperor:${viewport.width}`, input: () => input }, 1 / 60, reducedMotion);
        }
        assert.deepEqual(pose(settled), pose(planned), 'clear entry settles at the readable shot');
        assert.equal(settled.playerVisible, true);
        assert.deepEqual(pose(camera.step(follow, null, 1 / 60, reducedMotion)), ordinary, 'exit restores ordinary follow');
      }
    }
  });
}

test('Library lantern blocks easing, not the readable imperial endpoint or return to ordinary follow', t => {
  const world = createPalaceWorld([], 'prince', false, 'library');
  t.after(() => world.dispose());
  const player = { x: -6.08, y: 0, z: 7 };
  const subject = { x: player.x, y: 0, z: 4.3 };
  const blockers = [...world.colliders, ...world.viewBlockers];
  const follow = { player, yaw: 0, pitch: .22, distance: 5.7, ceilingHeight: world.ceilingHeight, blockers };
  const ordinary = pose(new PalaceCamera(follow).step(follow, null, 0, false));
  for (const viewport of viewports) {
    const input: ConversationCameraInput = {
      player: { position: player, height: 2, radius: .36 },
      subject: { position: subject, height: 2.53, radius: .66 }, viewport,
      blockers, bounds: world.bounds, ceilingHeight: world.ceilingHeight,
      preferredYaw: 1.05, fallback: ordinary,
    };
    const planned = frameConversationCamera(input);
    assert.equal(planned.framed, true);
    assertReadable(input, planned);
    const lantern = blockers.find(blocker => blocker.x === -6 && blocker.z === 9)!;
    const expanded = new THREE.Box3(
      new THREE.Vector3(lantern.x - lantern.w / 2 - .22, lantern.minY - .22, lantern.z - lantern.d / 2 - .22),
      new THREE.Vector3(lantern.x + lantern.w / 2 + .22, lantern.height + .22, lantern.z + lantern.d / 2 + .22),
    );
    assert.ok(expanded.containsPoint(new THREE.Vector3(ordinary.position.x, ordinary.position.y, ordinary.position.z)),
      'the valid ordinary camera begins in the lantern transition-clearance buffer');
    for (const reducedMotion of [false, true]) {
      const camera = new PalaceCamera(follow);
      let reads = 0;
      const shot = { key: `@emperor:${viewport.width}`, input: () => { reads++; return input; } };
      assert.deepEqual(pose(camera.step(follow, shot, 0, reducedMotion)), pose(planned),
        'the first frame cuts to the clear endpoint, without an interpolated wall-crossing frame');
      for (let frame = 0; frame < 60; frame++) {
        assert.deepEqual(pose(camera.step(follow, shot, 1 / 60, reducedMotion)), pose(planned));
      }
      assert.equal(reads, 1, 'the cut is retained without content-driven replanning');
      assert.deepEqual(pose(camera.step(follow, null, 1 / 60, reducedMotion)), ordinary);
    }
  }
});

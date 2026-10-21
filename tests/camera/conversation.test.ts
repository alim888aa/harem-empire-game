// Exercises readable composition and architectural safety through the camera planner's public interface.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  frameConversationCamera,
  ConversationCameraTransition,
  type ConversationCameraInput,
  type ConversationCameraFrame,
} from '../../src/palace/camera';

const input = (overrides: Partial<ConversationCameraInput> = {}): ConversationCameraInput => ({
  player: { position: { x: -1.1, y: 0, z: 0 }, height: 2.05 },
  subject: { position: { x: 1.1, y: 0, z: 0 }, height: 2.02 },
  viewport: { width: 1180, height: 680, top: 110, bottom: 335 },
  blockers: [],
  ceilingHeight: 6.4,
  preferredYaw: 0,
  fallback: { position: { x: -1.1, y: 3.2, z: 5.7 }, target: { x: -1.1, y: 1.35, z: 0 } },
  ...overrides,
});

function assertReadable(frame: ConversationCameraFrame, options: ConversationCameraInput) {
  assert.equal(frame.framed, true);
  const camera = new THREE.PerspectiveCamera(
    options.fovDegrees ?? 55, options.viewport.width / options.viewport.height, 0.1, 130,
  );
  camera.position.set(frame.position.x, frame.position.y, frame.position.z);
  camera.lookAt(frame.target.x, frame.target.y, frame.target.z);
  camera.updateMatrixWorld(true);
  for (const actor of [options.player, options.subject]) {
    for (const height of [actor.height * 0.42, actor.height + 0.12]) {
      const projected = new THREE.Vector3(actor.position.x, actor.position.y + height, actor.position.z).project(camera);
      const y = (1 - projected.y) * options.viewport.height / 2;
      const x = (1 + projected.x) * options.viewport.width / 2;
      assert.ok(y >= options.viewport.top && y <= options.viewport.bottom, `body height ${height} projects to y=${y}`);
      assert.ok(x >= (options.viewport.left ?? 12) && x <= (options.viewport.right ?? options.viewport.width - 12));
      assert.ok(projected.z > -1 && projected.z < 1);
    }
    assert.ok(Math.hypot(frame.position.x - actor.position.x, frame.position.z - actor.position.z) >= 2.1);
  }
}

test('landscape conversation keeps both heads and upper bodies between the HUD and bottom dialog', () => {
  const options = input();
  assertReadable(frameConversationCamera(options), options);
});

test('narrow portrait chooses a different safe angle or distance instead of cropping a face', () => {
  const options = input({ viewport: { width: 390, height: 844, top: 185, bottom: 450 } });
  assertReadable(frameConversationCamera(options), options);
});

test('a wall behind the preferred camera selects an actual clear view without shortening the ray', () => {
  const options = input({ blockers: [{ x: 0, z: 2, w: 20, d: 0.3, minY: 0, height: 5 }] });
  const frame = frameConversationCamera(options);
  assertReadable(frame, options);
  assert.ok(frame.position.z < 1.63, 'camera must stay on the characters’ side of the wall');
  assert.ok(Math.hypot(frame.position.x, frame.position.z) >= 3.6, 'no extreme close-up fallback');
});

test('fully blocked compositions preserve the supplied safe ordinary view exactly', () => {
  const options = input({ blockers: [
    { x: 0, z: 1, w: 4, d: 0.2, minY: 0, height: 6 },
    { x: 0, z: -1, w: 4, d: 0.2, minY: 0, height: 6 },
    { x: 2, z: 0, w: 0.2, d: 2, minY: 0, height: 6 },
    { x: -2, z: 0, w: 0.2, d: 2, minY: 0, height: 6 },
  ] });
  assert.deepEqual(frameConversationCamera(options), { ...options.fallback, framed: false });
});

test('an open doorway cannot move the cinematic camera outside the palace bounds', () => {
  const options = input({ bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 2 } });
  const frame = frameConversationCamera(options);
  assertReadable(frame, options);
  assert.ok(frame.position.z <= 2 - 0.22);
});

test('raised ground and a taller Emperor are framed using each actor’s actual height', () => {
  const options = input({
    subject: { position: { x: 1.1, y: 0.56, z: 0 }, height: 2.53, radius: 0.6 },
  });
  assertReadable(frameConversationCamera(options), options);
});

test('camera respects the ceiling even when the default raised composition would exceed it', () => {
  const options = input({ ceilingHeight: 3.05 });
  const frame = frameConversationCamera(options);
  assertReadable(frame, options);
  assert.ok(frame.position.y <= 3.05 - 0.22);
});

test('collapsed or nonfinite layout retains free-roam framing', () => {
  for (const viewport of [
    { width: 1180, height: 680, top: 300, bottom: 320 },
    { width: 0, height: 680, top: 110, bottom: 335 },
    { width: 1180, height: 680, top: Number.NaN, bottom: 335 },
  ]) {
    const options = input({ viewport });
    assert.deepEqual(frameConversationCamera(options), { ...options.fallback, framed: false });
  }
});

test('planning is deterministic and does not mutate the retained ordinary view', () => {
  const options = input();
  const original = structuredClone(options);
  assert.deepEqual(frameConversationCamera(options), frameConversationCamera(options));
  assert.deepEqual(options, original);
});

test('one subject and viewport plan once despite changed dialog content and scrolling', () => {
  const transition = new ConversationCameraTransition();
  const options = input();
  let plans = 0;
  const request = () => { plans++; return options; };
  let camera = options.fallback;
  camera = transition.step('Hua:1440:900', request, camera, 0, false);
  assert.deepEqual(camera, options.fallback);
  for (let frame = 0; frame < 60; frame++) camera = transition.step('Hua:1440:900', request, camera, 1 / 60, false);
  assert.equal(plans, 1);
  const destination = frameConversationCamera(options);
  assert.deepEqual(camera, { position: destination.position, target: destination.target });
  transition.step('Hua:390:844', request, camera, 1 / 60, false);
  transition.step('@emperor:390:844', request, camera, 1 / 60, false);
  assert.equal(plans, 3);
  transition.clear();
  transition.step('@emperor:390:844', request, camera, 1 / 60, false);
  assert.equal(plans, 4);
});

test('entry moves continuously and reduced motion goes straight to the safe planned pose', () => {
  const options = input();
  const transition = new ConversationCameraTransition();
  const initial = options.fallback;
  const midpoint = transition.step('Hua:1440:900', () => options, initial, .225, false);
  const expected = frameConversationCamera(options);
  for (const axis of ['x', 'y', 'z'] as const) {
    assert.ok(Math.abs(midpoint.position[axis] - (initial.position[axis] + expected.position[axis]) / 2) < 1e-8);
  }
  const settled = transition.step('Hua:1440:900', () => options, midpoint, 0, true);
  assert.deepEqual(settled, { position: expected.position, target: expected.target });
});

test('an obstructed transition holds its current pose instead of cutting across a wall', () => {
  const options = input();
  const current = options.fallback;
  const blocked = input({ blockers: [{ x: current.position.x, z: current.position.z,
    w: .1, d: .1, minY: 0, height: 6 }] });
  const result = new ConversationCameraTransition().step('Hua:1440:900', () => blocked, current, 1, false);
  assert.deepEqual(result, current);
});

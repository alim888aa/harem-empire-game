// Exercises saved and ordinary scene entry against actual career rooms, without a DOM or renderer.
import test, { beforeEach, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createActor } from 'xstate';
import { gameMachine } from '../../src/state-machines/game-machine';
import {
  captureCampaign, createCampaignPresentation, parseCampaignSave, campaignActorOptions,
} from '../../src/persistence/campaignSave';
import { initialCharacters } from '../../src/data/characters';
import { createPalaceWorld } from '../../src/palace/world';
import { zoneRoster, type ZoneBounds } from '../../src/palace/zones';
import { playerMovementSpeeds } from '../../src/palace/characterModels';
import { emperorEntrancePlan } from '../../src/palace/emperorEntrance';
import { clearInteractionPath } from '../../src/palace/interactionPath';
import {
  PalaceCamera, frameConversationCamera, type CameraPose, type CameraBlocker, type ConversationShot,
  type ConversationCameraInput, type FollowCameraInput,
} from '../../src/palace/camera';

const viewports = [
  { width: 1180, height: 680, top: 110, bottom: 335 },
  { width: 1440, height: 900, top: 110, bottom: 430 },
  { width: 390, height: 844, top: 185, bottom: 450 },
];
const pose = ({ position, target }: CameraPose): CameraPose => ({ position, target });
const inside = (value: CameraPose['position'], bounds: ZoneBounds) =>
  value.x >= bounds.minX && value.x <= bounds.maxX && value.z >= bounds.minZ && value.z <= bounds.maxZ;

beforeEach(t => {
  t.mock.method(Math, 'random', () => .424242);
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'warn', () => {});
});

function entry(t: TestContext, role: 'concubine' | 'minister' | 'prince') {
  const game = createActor(gameMachine).start();
  t.after(() => game.stop());
  game.send({ type: 'CHOOSE_CHARACTER', payload: { type: role } });
  game.send({ type: 'INITIALIZE_GAME' });
  for (let second = 0; second < 75; second++) game.send({ type: 'FIRST_EMPEROR_VISIT_TICK', seconds: 1 });
  assert.ok(game.getSnapshot().matches({ playing: 'emperor_intro' }));
  const captured = captureCampaign(game, createCampaignPresentation(role));
  assert.ok(captured);
  const save = parseCampaignSave(JSON.stringify(captured)).save;
  const restored = createActor(gameMachine, campaignActorOptions(save)).start();
  t.after(() => restored.stop());
  assert.ok(restored.getSnapshot().matches({ playing: 'emperor_intro' }));
  const { visits, clock } = save.presentation;
  assert.deepEqual(visits.playerByZone, {});
  assert.deepEqual(visits.npcByName, {});
  const context = restored.getSnapshot().context;
  const seasonal = initialCharacters.filter(person =>
    context.activeCharacterNames.includes(person.name) && context.characters[person.name]);
  const people = zoneRoster(seasonal, visits.zone, context.season, 1 - clock.remainingSeconds / (clock.seasonMinutes * 60), role);
  const world = createPalaceWorld(people, role, false, visits.zone, visits.npcByName);
  t.after(() => world.dispose());
  world.setSeason(context.season);
  world.animate(1 / 60, 1 / 60, false, true);
  const player = { x: world.spawn.x, y: world.groundHeight(world.spawn.x, world.spawn.z), z: world.spawn.z };
  const movement = playerMovementSpeeds(role);
  const blockers = [...world.colliders, ...world.viewBlockers];
  // The diagnosed entry uses the first northward approach, verified against the real room below.
  const length = emperorEntrancePlan(false).searchLengths[0];
  const start = { ...player, z: player.z - length };
  const subject = { ...player, z: player.z - Math.min(2.7, length * .7) };
  assert.ok(clearInteractionPath(player, start, world.colliders, world.bounds, movement.radius));
  const bodyBlockers = blockers.filter(blocker => blocker.minY < player.y + 2.53 && blocker.height > player.y);
  assert.equal(world.groundHeight(start.x, start.z), player.y);
  assert.equal(world.groundHeight(subject.x, subject.z), player.y);
  assert.ok(clearInteractionPath(start, subject, bodyBlockers, world.bounds, .66));
  assert.ok(world.npcs.every(npc => Math.hypot(npc.x - subject.x, npc.z - subject.z) >= 1.08));
  const follow: FollowCameraInput = { player, yaw: 0, pitch: .22, distance: 5.7, ceilingHeight: world.ceilingHeight, blockers };
  const input: Omit<ConversationCameraInput, 'fallback' | 'viewport'> = {
    player: { position: player, height: movement.height, radius: movement.radius },
    subject: { position: subject, height: 2.53, radius: .66 },
    blockers, bounds: world.bounds, ceilingHeight: world.ceilingHeight,
    preferredYaw: Math.atan2(player.x - subject.x, player.z - subject.z) + 1.05,
    preferredDistance: 4.8,
  };
  return { world, follow, input };
}

function assertClearSegment(from: CameraPose['position'], to: CameraPose['position'], blockers: readonly CameraBlocker[]) {
  const origin = new THREE.Vector3(from.x, from.y, from.z);
  const destination = new THREE.Vector3(to.x, to.y, to.z);
  const distance = origin.distanceTo(destination);
  if (distance < 1e-10) return;
  const ray = new THREE.Ray(origin, destination.sub(origin).normalize());
  for (const blocker of blockers) {
    const box = new THREE.Box3(
      new THREE.Vector3(blocker.x - blocker.w / 2 - .22, blocker.minY - .22, blocker.z - blocker.d / 2 - .22),
      new THREE.Vector3(blocker.x + blocker.w / 2 + .22, blocker.height + .22, blocker.z + blocker.d / 2 + .22),
    );
    const hit = ray.intersectBox(box, new THREE.Vector3());
    assert.ok(!hit || origin.distanceTo(hit) > distance + 1e-8, 'camera must not cross architecture');
  }
}

for (const role of ['concubine', 'minister', 'prince'] as const) {
  test(`saved ${role} intro starts from a safe ordinary camera`, async t => {
    const { world, follow, input } = entry(t, role);
    for (const viewport of viewports) {
      for (const mode of ['normal', 'reduced-motion', 'layout-change'] as const) {
        await t.test(`${viewport.width} in ${mode}`, () => {
          const ordinary = pose(new PalaceCamera(follow).step(follow, null, 0, false));
          assert.ok(inside(ordinary.position, world.bounds));
          assert.ok(Math.abs(ordinary.position.z - 19.5325) < 1e-10, 'retain the diagnosed ordinary follow control');
          const camera = new PalaceCamera(follow);
          let current = ordinary;
          let activeViewport = viewport;
          let plans = 0;
          for (let frame = 0; frame < 180; frame++) {
            if (mode === 'layout-change' && frame === 90) activeViewport = { ...viewport, width: viewport.width + 1 };
            const shot: ConversationShot = {
              key: `@emperor:${activeViewport.width}:${activeViewport.height}`,
              input: () => { plans++; return { ...input, viewport: activeViewport }; },
            };
            const next = camera.step(follow, shot, 1 / 60, mode === 'reduced-motion');
            assert.ok(inside(next.position, world.bounds), 'restored intro must never retain the out-of-room bootstrap camera');
            assert.equal(next.playerVisible, true);
            assertClearSegment(current.position, next.position, input.blockers);
            current = pose(next);
          }
          assert.equal(plans, mode === 'layout-change' ? 2 : 1);
          const planned = frameConversationCamera({ ...input, viewport: activeViewport, fallback: ordinary });
          assert.equal(planned.framed, true);
          assert.deepEqual(current, pose(planned), 'safe entry must settle at the real planner’s readable shot');
          if (mode === 'layout-change') {
            const resizedViewport = viewport.width === 390 ? viewports[1] : viewports[2];
            for (let frame = 0; frame < 60; frame++) {
              const next = camera.step(follow, {
                key: `@emperor:${resizedViewport.width}:${resizedViewport.height}`,
                input: () => { plans++; return { ...input, viewport: resizedViewport }; },
              }, 1 / 60, false);
              assert.ok(inside(next.position, world.bounds));
              assertClearSegment(current.position, next.position, input.blockers);
              current = pose(next);
            }
            assert.equal(plans, 3, 'portrait/landscape layout change replans once without crossing architecture');
          }
          assert.deepEqual(pose(camera.step(follow, null, 1 / 60, false)), ordinary, 'closing restores the ordinary view');
        });
      }
    }
  });
}

test('ordinary follow preserves orbit, damping, ceiling, ray shortening and proximity visibility', () => {
  const follow: FollowCameraInput = {
    player: { x: 2, y: .138, z: 3 }, yaw: .4, pitch: .22, distance: 5.7, ceilingHeight: 6.4, blockers: [],
  };
  const camera = new PalaceCamera(follow);
  const initial = camera.step(follow, null, 0, false);
  assert.deepEqual(initial.target, { x: 2, y: 1.488, z: 3 });
  assert.equal(initial.position.x, 2 + Math.sin(.4) * 5.7);
  assert.equal(initial.position.z, 3 + Math.cos(.4) * 5.7);
  const changed = { ...follow, yaw: -.7, ceilingHeight: 3 };
  const expected = new PalaceCamera(changed).step(changed, null, 0, false);
  const next = camera.step(changed, null, .1, false);
  for (const axis of ['x', 'y', 'z'] as const) {
    const damped = THREE.MathUtils.lerp(initial.position[axis], expected.position[axis], 1 - Math.exp(-.9));
    assert.ok(Math.abs(next.position[axis] - damped) < 1e-12);
  }
  assert.equal(expected.position.y, 2.75);
  const blocked = { ...follow, yaw: 0, blockers: [{ x: 2, z: 4, w: 10, d: .4, minY: 0, height: 6 }] };
  const close = new PalaceCamera(blocked).step(blocked, null, 0, false);
  assert.ok(close.position.z < 3.65);
  assert.equal(close.playerVisible, false);
});

test('unreadable layout retains safe ordinary entry, while an obstructed cinematic transition still holds its origin', () => {
  const follow: FollowCameraInput = {
    player: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: .22, distance: 5.7, ceilingHeight: 6.4, blockers: [],
  };
  const ordinary = pose(new PalaceCamera(follow).step(follow, null, 0, false));
  const input: Omit<ConversationCameraInput, 'fallback'> = {
    player: { position: follow.player, height: 2 }, subject: { position: { x: 2, y: 0, z: 0 }, height: 2 },
    viewport: { width: 1440, height: 900, top: 110, bottom: 120 },
    ceilingHeight: 6.4, preferredYaw: 0, blockers: [],
  };
  const camera = new PalaceCamera(follow);
  assert.deepEqual(pose(camera.step(follow, { key: 'collapsed', input: () => input }, 1, false)), ordinary);
  const blocked = { ...input, viewport: viewports[0], blockers: [
    { x: ordinary.position.x, z: ordinary.position.z, w: .1, d: .1, minY: 0, height: 6 },
  ] };
  assert.deepEqual(pose(camera.step(follow, { key: 'blocked', input: () => blocked }, 1, true)), ordinary);
});

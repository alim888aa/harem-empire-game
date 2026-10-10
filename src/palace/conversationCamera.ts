// Owns collision-safe two-person framing inside the screen area left above a dialog.
import * as THREE from 'three';

type Point3 = Readonly<{ x: number; y: number; z: number }>;

export interface ConversationActor {
  position: Point3;
  height: number;
  radius?: number;
}

export interface CameraPose {
  position: Point3;
  target: Point3;
}

export interface CameraBlocker {
  x: number;
  z: number;
  w: number;
  d: number;
  minY: number;
  height: number;
}

export interface ConversationCameraInput {
  player: ConversationActor;
  subject: ConversationActor;
  viewport: { width: number; height: number; top: number; bottom: number; left?: number; right?: number };
  blockers: readonly CameraBlocker[];
  ceilingHeight: number;
  bounds?: Readonly<{ minX: number; maxX: number; minZ: number; maxZ: number }>;
  preferredYaw: number;
  preferredDistance?: number;
  fovDegrees?: number;
  // The caller retains the last safe free-roam pose, never an already-clipped dialog view.
  fallback: CameraPose;
}

export interface ConversationCameraFrame extends CameraPose {
  framed: boolean;
}

const CAMERA_CLEARANCE = 0.22;
const MIN_ACTOR_DISTANCE = 2.1;
const point = (value: THREE.Vector3): Point3 => ({ x: value.x, y: value.y, z: value.z });

function intersects(from: THREE.Vector3, to: THREE.Vector3, blocker: CameraBlocker, margin: number) {
  let entry = 0;
  let exit = 1;
  for (const axis of ['x', 'y', 'z'] as const) {
    const minimum = axis === 'x' ? blocker.x - blocker.w / 2 : axis === 'z' ? blocker.z - blocker.d / 2 : blocker.minY;
    const maximum = axis === 'x' ? blocker.x + blocker.w / 2 : axis === 'z' ? blocker.z + blocker.d / 2 : blocker.height;
    const delta = to[axis] - from[axis];
    if (Math.abs(delta) < 1e-8) {
      if (from[axis] < minimum - margin || from[axis] > maximum + margin) return false;
    } else {
      const first = (minimum - margin - from[axis]) / delta;
      const second = (maximum + margin - from[axis]) / delta;
      entry = Math.max(entry, Math.min(first, second));
      exit = Math.min(exit, Math.max(first, second));
      if (entry > exit) return false;
    }
  }
  return exit >= entry && exit >= 0 && entry <= 1;
}

function upperBody(actor: ConversationActor) {
  const radius = actor.radius ?? 0.4;
  const points: THREE.Vector3[] = [];
  for (const y of [actor.position.y + actor.height * 0.42, actor.position.y + actor.height + 0.12]) {
    for (const x of [-radius, radius]) {
      for (const z of [-radius, radius]) {
        points.push(new THREE.Vector3(actor.position.x + x, y, actor.position.z + z));
      }
    }
  }
  return points;
}

/**
 * Plan on conversation entry or layout changes, not every animation frame.
 * Candidates are checked at their final positions, with no post-selection ray shortening.
 * If architecture leaves no readable composition, retain the supplied safe ordinary view.
 */
export function frameConversationCamera(input: ConversationCameraInput): ConversationCameraFrame {
  const fallback = (): ConversationCameraFrame => ({
    position: { ...input.fallback.position },
    target: { ...input.fallback.target },
    framed: false,
  });
  const { viewport, player, subject } = input;
  const left = Math.max(12, viewport.left ?? 12);
  const right = Math.min(viewport.width - 12, viewport.right ?? viewport.width - 12);
  const top = Math.max(12, viewport.top);
  const bottom = Math.min(viewport.height - 12, viewport.bottom);
  const fov = input.fovDegrees ?? 55;
  if (
    ![viewport.width, viewport.height, left, right, top, bottom, fov, input.preferredYaw, input.ceilingHeight,
      player.position.x, player.position.y, player.position.z, player.height,
      subject.position.x, subject.position.y, subject.position.z, subject.height].every(Number.isFinite) ||
    viewport.width <= 0 || viewport.height <= 0 || right - left < 80 || bottom - top < 80 ||
    player.height <= 0 || subject.height <= 0 || fov <= 10 || fov >= 120
  ) return fallback();

  const actors = [player, subject];
  const bodyPoints = actors.flatMap(upperBody);
  const low = Math.min(...bodyPoints.map(value => value.y));
  const high = Math.max(...bodyPoints.map(value => value.y));
  const focus = new THREE.Vector3(
    (player.position.x + subject.position.x) / 2,
    (low + high) / 2,
    (player.position.z + subject.position.z) / 2,
  );
  const camera = new THREE.PerspectiveCamera(fov, viewport.width / viewport.height, 0.1, 130);
  const centerNdcY = 1 - (top + bottom) / viewport.height;
  const frameTilt = Math.atan(centerNdcY * Math.tan(THREE.MathUtils.degToRad(fov) / 2));
  const requestedDistance = input.preferredDistance ?? 4.8;
  const preferredDistance = Number.isFinite(requestedDistance) ? Math.max(3.6, Math.min(8, requestedDistance)) : 4.8;
  const distances = [...new Set([preferredDistance, preferredDistance + 1.2, preferredDistance + 2.4, 3.6, 9])];
  let best: { score: number; frame: ConversationCameraFrame } | undefined;

  for (let step = 0; step < 24; step++) {
    const turn = step === 0 ? 0 : Math.ceil(step / 2) * Math.PI / 12 * (step % 2 ? 1 : -1);
    const yaw = input.preferredYaw + turn;
    for (const distance of distances) {
      const candidate = new THREE.Vector3(
        focus.x + Math.sin(yaw) * distance,
        Math.min(focus.y + distance * 0.2 + 0.4, input.ceilingHeight - CAMERA_CLEARANCE),
        focus.z + Math.cos(yaw) * distance,
      );
      if (candidate.y <= Math.max(player.position.y, subject.position.y) + 1.2) continue;
      if (input.bounds && (
        candidate.x < input.bounds.minX + CAMERA_CLEARANCE || candidate.x > input.bounds.maxX - CAMERA_CLEARANCE ||
        candidate.z < input.bounds.minZ + CAMERA_CLEARANCE || candidate.z > input.bounds.maxZ - CAMERA_CLEARANCE
      )) continue;
      if (actors.some(actor => Math.hypot(candidate.x - actor.position.x, candidate.z - actor.position.z) < MIN_ACTOR_DISTANCE)) {
        continue;
      }
      if (input.blockers.some(blocker => intersects(candidate, candidate, blocker, CAMERA_CLEARANCE))) continue;
      if (bodyPoints.some(body => input.blockers.some(blocker => intersects(candidate, body, blocker, 0.04)))) continue;

      camera.position.copy(candidate);
      camera.lookAt(focus);
      // Aim the upper-body midpoint at the usable band's center rather than the canvas center.
      camera.rotateX(-frameTilt);
      camera.updateMatrixWorld(true);
      const fits = bodyPoints.every(body => {
        const projected = body.clone().project(camera);
        const x = (projected.x + 1) * viewport.width / 2;
        const y = (1 - projected.y) * viewport.height / 2;
        return projected.z > -1 && projected.z < 1 && x >= left && x <= right && y >= top && y <= bottom;
      });
      if (!fits) continue;

      const score = Math.abs(turn) * 0.6 + Math.abs(distance - preferredDistance);
      if (best && best.score <= score) continue;
      const direction = camera.getWorldDirection(new THREE.Vector3());
      best = {
        score,
        frame: {
          position: point(candidate),
          target: point(candidate.clone().addScaledVector(direction, candidate.distanceTo(focus))),
          framed: true,
        },
      };
    }
  }
  return best?.frame ?? fallback();
}

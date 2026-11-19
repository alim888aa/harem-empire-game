// Owns ordinary follow, safe scene entry and retained conversation camera state.
import * as THREE from 'three';
import { ConversationCameraTransition, type CameraPose, type CameraBlocker, type ConversationCameraInput } from './conversation';

export { frameConversationCamera, ConversationCameraTransition } from './conversation';
export type { CameraPose, CameraBlocker, ConversationCameraInput, ConversationCameraFrame } from './conversation';

/** Restored player position, orbit and architecture used by the ordinary camera. */
export interface FollowCameraInput {
  player: Readonly<{ x: number; y: number; z: number }>;
  yaw: number;
  pitch: number;
  distance: number;
  ceilingHeight: number;
  blockers: readonly CameraBlocker[];
}

/** A subject/viewport key and lazily read dialog layout; the camera owns its fallback. */
export interface ConversationShot {
  key: string;
  input: () => Omit<ConversationCameraInput, 'fallback'>;
}

/** Complete camera pose and whether ordinary proximity should hide the player. */
export interface PalaceCameraFrame extends CameraPose {
  playerVisible: boolean;
}

function followPose(input: FollowCameraInput): CameraPose {
  const target = new THREE.Vector3(input.player.x, input.player.y + 1.35, input.player.z);
  const offset = new THREE.Vector3(
    Math.sin(input.yaw) * input.distance,
    Math.sin(input.pitch) * input.distance + .6,
    Math.cos(input.yaw) * input.distance,
  ).add(target);
  offset.y = Math.min(offset.y, input.ceilingHeight - .25);
  const delta = offset.clone().sub(target);
  let safe = 1;
  for (const blocker of input.blockers) {
    let entry = 0;
    let exit = 1;
    for (const axis of ['x', 'y', 'z'] as const) {
      const minimum = (axis === 'y' ? blocker.minY : axis === 'x' ? blocker.x - blocker.w / 2 : blocker.z - blocker.d / 2) - .15;
      const maximum = (axis === 'y' ? blocker.height : axis === 'x' ? blocker.x + blocker.w / 2 : blocker.z + blocker.d / 2) + .15;
      const direction = delta[axis];
      const origin = target[axis];
      if (Math.abs(direction) < .0001) {
        if (origin < minimum || origin > maximum) {
          entry = 2;
          break;
        }
      } else {
        const first = (minimum - origin) / direction;
        const second = (maximum - origin) / direction;
        entry = Math.max(entry, Math.min(first, second));
        exit = Math.min(exit, Math.max(first, second));
      }
    }
    if (entry > 0 && entry < exit && entry < safe) safe = Math.max(.015, entry - .025);
  }
  offset.copy(target).addScaledVector(delta, safe);
  return { position: { x: offset.x, y: offset.y, z: offset.z }, target: { x: target.x, y: target.y, z: target.z } };
}

const separation = (pose: CameraPose) => Math.hypot(
  pose.position.x - pose.target.x, pose.position.y - pose.target.y, pose.position.z - pose.target.z,
);

/** Owns camera entry/exit ordering so an immediately restored dialog starts from ordinary follow. */
export class PalaceCamera {
  private current: CameraPose;
  private ordinary: CameraPose | null = null;
  private dialogue = false;
  private firstFrame = true;
  private transition = new ConversationCameraTransition();

  /** Bootstrap from the same architectural ray shortening as ordinary follow, before any shot can be retained. */
  constructor(follow: FollowCameraInput) {
    this.current = followPose(follow);
    if (separation(this.current) >= 2.25) this.ordinary = this.current;
  }

  /** Advance the ordinary orbit or one cached conversation shot; only new keys read dialog layout. */
  step(follow: FollowCameraInput, shot: ConversationShot | null, dt: number, reducedMotion: boolean): PalaceCameraFrame {
    if (shot) {
      this.current = this.transition.step(shot.key, () => ({
        ...shot.input(), fallback: this.ordinary ?? this.current,
      }), this.current, dt, reducedMotion);
      this.dialogue = true;
      return { ...this.current, playerVisible: true };
    }
    if (this.dialogue && this.ordinary) this.current = { ...this.current, position: this.ordinary.position };
    this.dialogue = false;
    this.transition.clear();
    const desired = followPose(follow);
    const blend = this.firstFrame ? 1 : 1 - Math.exp(-dt * 9);
    const position = new THREE.Vector3(this.current.position.x, this.current.position.y, this.current.position.z)
      .lerp(new THREE.Vector3(desired.position.x, desired.position.y, desired.position.z), blend);
    this.current = { position: { x: position.x, y: position.y, z: position.z }, target: desired.target };
    this.firstFrame = false;
    if (separation(this.current) >= 2.25) this.ordinary = this.current;
    return { ...this.current, playerVisible: separation(this.current) > 2.25 };
  }
}

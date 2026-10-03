/** Device-independent gesture math; pointer IDs never migrate between controls. */
export interface TouchVector { right: number; forward: number }
export interface TouchPoint { x: number; y: number }
export const TOUCH_DEADZONE = .14;
export const STOPPED_TOUCH: TouchVector = { right: 0, forward: 0 };

export function joystickVector(dx: number, dy: number, radius: number, deadzone = TOUCH_DEADZONE): TouchVector {
  if (!Number.isFinite(dx + dy + radius) || radius <= 0) return { ...STOPPED_TOUCH };
  const length = Math.hypot(dx, dy), fraction = Math.min(1, length / radius);
  if (fraction <= deadzone) return { ...STOPPED_TOUCH };
  const strength = (fraction - deadzone) / (1 - deadzone);
  return { right: dx / length * strength, forward: -dy / length * strength };
}

export class JoystickGesture {
  pointerId: number | null = null;
  origin: TouchPoint = { x: 0, y: 0 };
  vector: TouchVector = { ...STOPPED_TOUCH };
  radius = 1;
  begin(id: number, point: TouchPoint, radius: number): boolean {
    if (this.pointerId !== null) return false;
    this.pointerId = id; this.origin = { ...point }; this.radius = radius;
    this.vector = { ...STOPPED_TOUCH }; return true;
  }
  move(id: number, point: TouchPoint): TouchVector | null {
    if (id !== this.pointerId) return null;
    this.vector = joystickVector(point.x - this.origin.x, point.y - this.origin.y, this.radius);
    return this.vector;
  }
  end(id: number): boolean {
    if (id !== this.pointerId) return false;
    this.reset(); return true;
  }
  reset(): void { this.pointerId = null; this.vector = { ...STOPPED_TOUCH }; }
}

export interface CameraGestureDelta { dx: number; dy: number; zoom: number }
/** Two camera-owned fingers pinch; the movement finger is never a pinch partner. */
export class CameraGesture {
  private points = new Map<number, TouchPoint>();
  get pointerIds(): number[] { return [...this.points.keys()]; }
  begin(id: number, point: TouchPoint): boolean {
    if (this.points.has(id) || this.points.size >= 2) return false;
    this.points.set(id, { ...point }); return true;
  }
  move(id: number, point: TouchPoint): CameraGestureDelta | null {
    const previous = this.points.get(id); if (!previous) return null;
    if (this.points.size === 1) {
      this.points.set(id, { ...point }); return { dx: point.x - previous.x, dy: point.y - previous.y, zoom: 0 };
    }
    const other = [...this.points.entries()].find(([key]) => key !== id)![1];
    const before = Math.hypot(previous.x - other.x, previous.y - other.y);
    this.points.set(id, { ...point });
    const after = Math.hypot(point.x - other.x, point.y - other.y);
    return { dx: 0, dy: 0, zoom: before > 1 && after > 1 ? Math.log(before / after) : 0 };
  }
  end(id: number): boolean { return this.points.delete(id); }
  reset(): void { this.points.clear(); }
}

/** Keep analog speed without speeding up diagonals or mixed keyboard/touch input. */
export function combineMovement(keyboard: TouchVector, touch: TouchVector): TouchVector {
  const right = keyboard.right + touch.right, forward = keyboard.forward + touch.forward;
  const divisor = Math.max(1, Math.hypot(right, forward));
  return { right: right / divisor, forward: forward / divisor };
}

/** One physical press produces one action, including under concurrent touch.
 * A brief compatibility-click window deduplicates browsers that also emit click. */
export class ActionGesture {
  pointerId: number | null = null;
  private suppressClickUntil = 0;
  begin(id: number, now: number): boolean {
    if (this.pointerId !== null) return false;
    this.pointerId = id; this.suppressClickUntil = now + 600; return true;
  }
  end(id: number): boolean {
    if (this.pointerId !== id) return false;
    this.pointerId = null; return true;
  }
  reset(): void { this.pointerId = null; this.suppressClickUntil = 0; }
  keyboardClick(detail: number, now: number): boolean {
    return detail === 0 && this.pointerId === null && now >= this.suppressClickUntil;
  }
}

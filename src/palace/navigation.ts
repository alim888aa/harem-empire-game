import type { Collider } from './world';
import type { ZoneBounds } from './zones';

export type Waypoint = { x: number; z: number };

/** Small static walk grid for courtiers. Dynamic bodies are still checked every movement step. */
export function createPalaceNavigator(colliders: readonly Collider[], bounds:ZoneBounds={minX:-23.2,maxX:23.2,minZ:-26.2,maxZ:23.2}) {
  const spacing=.5,minX=Math.floor(bounds.minX/spacing),minZ=Math.floor(bounds.minZ/spacing);
  const width=Math.ceil(bounds.maxX/spacing)-minX+1,height=Math.ceil(bounds.maxZ/spacing)-minZ+1;
  const cells = new Uint8Array(width * height);
  const point = (id: number): Waypoint => ({ x: (id % width + minX) * spacing, z: (Math.floor(id / width) + minZ) * spacing });
  for (let id = 0; id < cells.length; id++) {
    const { x, z } = point(id);
    cells[id] = Number(x > bounds.minX+.45 && x < bounds.maxX-.45 && z > bounds.minZ+.45 && z < bounds.maxZ-.45 && !colliders.some(c => Math.abs(x - c.x) < c.w / 2 + .4 && Math.abs(z - c.z) < c.d / 2 + .4));
  }
  const nearest = (x: number, z: number) => {
    const ix = Math.round(x / spacing) - minX, iz = Math.round(z / spacing) - minZ;
    let best = -1, distance = Infinity;
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
      const a = ix + dx, b = iz + dz;
      if (a < 0 || a >= width || b < 0 || b >= height) continue;
      const id = b * width + a; if (!cells[id]) continue;
      const p = point(id), d = Math.hypot(p.x - x, p.z - z);
      if (d < distance) { best = id; distance = d; }
    }
    return best;
  };
  return {
    closest(destination:Waypoint):Waypoint|null { const id=nearest(destination.x,destination.z);return id<0?null:point(id); },
    find(from: Waypoint, destination: Waypoint): Waypoint[] {
      const start = nearest(from.x, from.z), goal = nearest(destination.x, destination.z);
      if (start < 0 || goal < 0) return [];
      const previous = new Int32Array(cells.length); previous.fill(-1); previous[start] = start;
      const queue = new Int32Array(cells.length); queue[0] = start;
      let head = 0, tail = 1;
      while (head < tail && previous[goal] < 0) {
        const current = queue[head++], x = current % width;
        for (const next of [x > 0 ? current - 1 : -1, x < width - 1 ? current + 1 : -1, current - width, current + width]) {
          if (next < 0 || next >= cells.length || !cells[next] || previous[next] >= 0) continue;
          previous[next] = current; queue[tail++] = next;
        }
      }
      if (previous[goal] < 0) return [];
      const path: number[] = [goal];
      while (path[path.length - 1] !== start) path.push(previous[path[path.length - 1]]);
      path.reverse();
      // Preserve corners exactly, while removing redundant collinear cell centers.
      return path.filter((id, index) => index === 0 || index === path.length - 1 || id - path[index - 1] !== path[index + 1] - id).map(point);
    },
  };
}

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Additive, original palace joinery. No collision, room, door or light changes. */
export interface HallDetailOptions { software?: boolean }
export interface HallDetailStats { drawCalls: number; triangles: number; wallBays: number; columnSets: number }

/**
 * Call after constructing the palace. Materials are borrowed only for their maps;
 * this layer owns its batches/material clones and never disposes shared textures.
 * Its maximum low-level wall projection stays inside the existing player margin.
 * The SVG software renderer deliberately omits this visual-only detail layer.
 */
export function addHallDetails(scene: THREE.Scene, sourceMaterials: readonly THREE.Material[], options: HallDetailOptions = {}) {
  const root = new THREE.Group(); root.name = 'HallArchitecturalDetails';
  const stats: HallDetailStats = { drawCalls: 0, triangles: 0, wallBays: 0, columnSets: 0 };
  const ownedMaterials: THREE.MeshStandardMaterial[] = [];
  const ownedGeometry: THREE.BufferGeometry[] = [];
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true; root.removeFromParent();
    ownedGeometry.forEach(g => g.dispose());
    ownedMaterials.forEach(m => m.dispose());
    root.clear();
  };
  if (options.software) return { root, stats, dispose };

  const source = (name: string) => sourceMaterials.find(m => m.name === name) as THREE.MeshStandardMaterial | undefined;
  const wood = source('Vermilion lacquer') ?? source('Dark hardwood');
  const brass = source('Aged brass');
  const paint = (name: string, color: string, roughness: number, metalness = 0, texture?: THREE.MeshStandardMaterial) => {
    const m = new THREE.MeshStandardMaterial({ name, color, roughness, metalness });
    // Pigmented lacquer should read as red paint, rather than a brown diffuse wood image.
    // Keep the existing licensed normal/roughness maps for shallow timber grain.
    if (texture) { m.normalMap = texture.normalMap; m.roughnessMap = texture.roughnessMap; m.normalScale.set(.075, .075); }
    ownedMaterials.push(m); return m;
  };
  const red = paint('Hall vermilion pigment', '#934034', .44, 0, wood);
  const oxblood = paint('Hall recessed cinnabar', '#632e2b', .61, 0, wood);
  const teal = paint('Hall painted blue-green', '#306169', .68);
  const blue = paint('Hall indigo beam ground', '#243c4c', .71);
  const gold = paint('Hall antique gold linework', '#b99856', .43, .46, brass);
  const shadow = paint('Hall lattice shadow ground', '#232b29', .88);
  const ivory = paint('Hall mineral pale green', '#9ea797', .75);
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const transform = new THREE.Matrix4(); const rotation = new THREE.Quaternion();
  const put = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, ry = 0, rz = 0) => {
    rotation.setFromEuler(new THREE.Euler(0, ry, rz));
    transform.compose(new THREE.Vector3(x, y, z), rotation, new THREE.Vector3(1, 1, 1));
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    g.applyMatrix4(transform);
    const list = buckets.get(material) ?? []; list.push(g); buckets.set(material, list);
  };
  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, ry = 0, rz = 0) => put(new THREE.BoxGeometry(w, h, d), mat, x, y, z, ry, rz);
  const cylinder = (r1: number, r2: number, h: number, mat: THREE.Material, x: number, y: number, z: number) => put(new THREE.CylinderGeometry(r1, r2, h, 20), mat, x, y, z);

  // Applied wall joinery is confined to the four existing solid segments per side.
  // The six metre openings remain completely empty, including the opening heads.
  for (const side of [-1, 1]) for (const [center, length] of [[-24, 8], [-10, 8], [8, 8], [21, 6]]) {
    const height = center < -8 ? 8.8 : 7.1;
    const x = side * 10.79;
    const wallBox = (width: number, h: number, depth: number, mat: THREE.Material, u: number, y: number, projection = 0) => box(depth, h, width, mat, x - side * projection, y, u);
    const start = center - length / 2;
    const count = Math.round(length / 2); const bayWidth = (length - .28) / count;
    wallBox(length - .1, .25, .1, red, center, .64);
    wallBox(length - .1, .13, .11, red, center, 2.1);
    wallBox(length - .1, .21, .12, red, center, 5.65);
    wallBox(length - .1, .42, .075, blue, center, height - .87);
    for (const y of [height - 1.09, height - .65]) wallBox(length - .13, .035, .09, gold, center, y, .016);
    for (let i = 0; i < count; i++) {
      const u = start + .14 + (i + .5) * bayWidth; stats.wallBays++;
      // Recessed lower door panels and framed, blind upper lattice screens.
      wallBox(bayWidth - .16, 1.27, .055, oxblood, u, 1.34, -.018);
      wallBox(bayWidth - .4, .88, .055, red, u, 1.34, .018);
      wallBox(bayWidth - .21, 3.26, .044, shadow, u, 3.86, -.028);
      for (const edge of [-1, 1]) {
        wallBox(.105, 5.09, .115, red, u + edge * (bayWidth - .08) / 2, 3.12, .01);
        wallBox(.032, 1.01, .074, gold, u + edge * (bayWidth - .43) / 2, 1.34, .012);
      }
      for (const y of [.835, 1.845]) wallBox(bayWidth - .43, .026, .074, gold, u, y, .012);
      for (const y of [2.3, 5.4]) wallBox(bayWidth - .17, .09, .1, red, u, y, .012);
      // Alternating square/offset-square motifs, with open dark negative space.
      const cell = .47;
      // Share each grid edge instead of stacking four boxes for every cell.
      for (let col = 0; col <= 3; col++) wallBox(.033, 3, .072, red, u - .735 + col * .49, 3.85, .026);
      for (let row = 0; row <= 6; row++) wallBox(1.5, .033, .072, red, u, 2.35 + row * .5, .026);
      for (let row = 0; row < 6; row++) for (let col = 0; col < 3; col++) {
        const cy = 2.6 + row * .5; const cu = u + (col - 1) * .49;
        if ((row + col) % 2 === 0) {
          const small = cell * .48;
          for (const sign of [-1, 1]) {
            wallBox(.026, small, .075, ivory, cu + sign * small / 2, cy, .034);
            wallBox(small, .026, .075, ivory, cu, cy + sign * small / 2, .034);
          }
        }
      }
      // Upper beam infill in measured alternating color fields, not more wood sheets.
      wallBox(bayWidth - .2, height - 6.72, .045, oxblood, u, (height + 5.8) / 2, -.02);
      wallBox(bayWidth - .4, .27, .085, teal, u, height - .87, .02);
      wallBox(.095, .095, .091, gold, u, height - .87, .029);
    }
  }

  // Each new column skin remains within the existing .7 m collider; the bracket
  // shoulders remain inside its existing 2.2 m overhead camera/view blocker.
  const bracket = (width: number, rise: number, depth: number) => {
    const s = new THREE.Shape(); const w = width / 2;
    s.moveTo(-w, rise); s.lineTo(w, rise); s.lineTo(w, rise * .35);
    s.lineTo(w * .77, rise * .35); s.lineTo(w * .67, 0);
    s.lineTo(w * .36, 0); s.lineTo(w * .27, -rise * .3);
    s.lineTo(-w * .27, -rise * .3); s.lineTo(-w * .36, 0);
    s.lineTo(-w * .67, 0); s.lineTo(-w * .77, rise * .35);
    s.lineTo(-w, rise * .35); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, steps: 1, curveSegments: 1 });
    g.translate(0, 0, -depth / 2); return g;
  };
  for (const x of [-8, 8]) for (const z of [-24, -16, -8, 0, 8, 16]) {
    const h = z < -8 ? 8.4 : 6.5; stats.columnSets++;
    cylinder(.292, .316, h - 1.12, red, x, (h - 1.12) / 2 + .61, z);
    cylinder(.323, .323, .13, oxblood, x, .65, z);
    cylinder(.307, .307, .052, gold, x, 1.01, z);
    cylinder(.325, .325, .12, oxblood, x, h - .5, z);
    box(.64, .22, .64, oxblood, x, h - .31, z);
    for (let tier = 0; tier < 3; tier++) {
      const y = h - .27 + tier * .15; const width = 1.1 + tier * .37;
      for (const ry of [0, Math.PI / 2]) {
        put(bracket(width, .16, .23), tier === 1 ? red : teal, x, y, z, ry);
        box(width - .12, .029, .24, gold, x, y + .143, z, ry);
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(.15, .13, .15, blue, x + sx * width * .31, y + .14, z + sz * width * .31);
      }
    }
    // Small diagonal corner arms give the silhouette depth from an oblique view.
    for (const angle of [Math.PI / 4, -Math.PI / 4]) put(bracket(1.44, .12, .14), red, x, h - .12, z, angle);
  }

  // Decorative facings attach to the existing transverse portal beams. Their
  // bottom is above the old 5.85 m blocking line and spans no new usable opening.
  for (const z of [-8, 10]) for (const face of [-1, 1]) {
    const fz = z + face * .319;
    box(21.85, .59, .035, blue, 0, 6.36, fz);
    for (const y of [6.055, 6.665]) box(21.84, .041, .043, gold, 0, y, fz + face * .027);
    for (let x = -9; x <= 9; x += 3) {
      box(2.24, .33, .046, teal, x, 6.36, fz + face * .035);
      for (const edge of [-1, 1]) {
        box(.28, .2, .055, red, x + edge * 1.15, 6.36, fz + face * .045);
        box(.028, .24, .061, gold, x + edge * .93, 6.36, fz + face * .052);
      }
      box(.18, .18, .065, gold, x, 6.36, fz + face * .049, 0, Math.PI / 4);
      box(.085, .085, .071, blue, x, 6.36, fz + face * .053, 0, Math.PI / 4);
    }
  }
  // Lengthwise painted beam fascias sit overhead on the column lines, never at
  // head height. Their undersides stay above the existing camera-height caps.
  // Keep them short of the change to the taller throne-hall roof.
  for (const x of [-8, 8]) for (const [z, length, y] of [[7, 30, 6.89], [-19, 18, 8.69]]) {
    box(.42, .22, length, blue, x, y, z);
    for (const sx of [-1, 1]) {
      box(.024, .055, length, teal, x + sx * .221, y, z);
      for (const sy of [-1, 1]) box(.03, .025, length, gold, x + sx * .224, y + sy * .108, z);
    }
  }

  // One mesh per material: seven draw calls regardless of the number of bays.
  for (const [material, list] of buckets) {
    const geometry = mergeGeometries(list, false); list.forEach(g => g.dispose());
    if (!geometry) continue;
    geometry.computeBoundingBox(); geometry.computeBoundingSphere(); ownedGeometry.push(geometry);
    const mesh = new THREE.Mesh(geometry, material); mesh.name = material.name;
    mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh);
    stats.drawCalls++; stats.triangles += geometry.getAttribute('position').count / 3;
  }
  root.userData.artNotes = 'Original Forbidden City-inspired joinery; stylized architectural study, not a measured reconstruction.';
  root.userData.stats = stats;
  scene.add(root);
  return { root, stats, dispose };
}

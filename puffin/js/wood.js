// THE MOSSY WOOD — past home, to the left, and the third picture: a dim green
// place under a roof of leaves. Dark trunks stand at every depth; the floor is
// humped with bright moss and sprinkled with little green stars; clumps of
// dark trumpet mushrooms; huge pale leaves far back; long soft shafts of light.
// Five of the mushrooms GLOW when she touches them — the counting here.
//
// It walls itself off: a tall back layer of foliage covers the sky, the hills
// and the sea from the wood's own camera stops, and its ragged right edge is
// what you see of the wood from home.
//
// buildWood(kit, { layer, stage, front }) adds everything and returns handles
// to what moves or can be tapped. Pure construction, like island.js.

import * as THREE from './three.js';
import { blob, ellipse, poly } from './shapes.js';
import { groundY, WOOD_X, WOOD_L, STOPS } from './ground.js';
import * as paint from './paint.js';

export const W = {
  deep: 0x23403a, deep2: 0x2e4d42, leaf: 0x5f8f79, leafPale: 0x86b399,
  trunk: 0x4a3f35, trunkLit: 0x5d4f41, trunkDark: 0x1f2b27,
  moss: 0x86b440, mossLit: 0xa6cc4e, mossDeep: 0x4c7a3a, mossDark: 0x37603a,
  ground: 0x5b8a3c, groundDeep: 0x3f6934,
  trumpet: 0x2f4d4b, trumpetLit: 0x46706a, star: 0xc6ea7c,
  glowOff: 0x7fa39a, glowOn: 0xc9f7e6, halo: 0xb6f2dc, shaft: 0xf2efc4,
};

const L = WOOD_L;                 // the wood's west end, just past the great old tree

export function buildWood(kit, { layer, stage, front }) {
  const r = paint.rng(73);

  // ---- far back: a wall of leaves, the sky shut out ----------------------------
  const wall = layer(-12);
  const edge = (y) => WOOD_X - 5 + Math.sin(y * 0.9) * 1.2 + Math.sin(y * 2.3) * 0.5;
  // Ragged at both ends: the wood seen from outside, either way.
  const edgeL = (y) => L - 1 + Math.sin(y * 1.1 + 2) * 1.1 + Math.sin(y * 2.7) * 0.45;
  const wallPts = [];
  for (let y = -20; y <= 24; y += 0.5) wallPts.push([edge(y), y]);
  for (let y = 24; y >= -20; y -= 0.5) wallPts.push([edgeL(y), y]);
  wall.add(kit.mesh(poly(wallPts), W.deep, { layer: -12 }));
  // Great pale leaves, far back, the way the picture has them.
  for (let i = 0; i < 16; i++) {
    const x = L + 3 + i * 2.5 + r() * 1.5, y = 1 + r() * 9, s = 1.6 + r() * 1.6, a = (r() - 0.5) * 1.2;
    if (x > WOOD_X - 7) continue;
    const pts = [[0, -s], [s * 0.55, -s * 0.2], [s * 0.4, s * 0.6], [0, s], [-s * 0.4, s * 0.6], [-s * 0.55, -s * 0.2]]
      .map(([px, py]) => [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)]);
    wall.add(kit.mesh(blob(pts, 30), r() < 0.5 ? W.leaf : W.leafPale, { z: 0.01 + i * 0.001, layer: -12, haze: 0.1 }));
  }

  // ---- the middle: trunks, a roof of leaves, light coming through --------------
  const mid = layer(-5);
  for (const x of [-31.5, -38, -44.5, -50, -56]) {
    const w = 0.9 + r() * 0.7;
    const lean = (r() - 0.5) * 0.6;
    mid.add(kit.mesh(poly([[x - w, -4], [x + w, -4], [x + w * 0.7 + lean, 16], [x - w * 0.7 + lean, 16]]), r() < 0.5 ? W.trunk : W.trunkLit, { layer: -5, haze: 0.05 }));
    // Moss climbing the foot of each.
    mid.add(kit.mesh(blob([[x - w - 0.4, -1], [x - w, 1.2], [x, 0.6], [x + w, 1.4], [x + w + 0.4, -1]], 24), W.mossDeep, { z: 0.01, layer: -5 }));
  }
  const roof = layer(-3);
  const roofPts = [[L - 2, 30]];
  for (let x = L - 2; x <= WOOD_X - 1; x += 0.8) roofPts.push([x, 5.4 + Math.sin(x * 0.7) * 0.6 + Math.sin(x * 1.9) * 0.35 + (x > WOOD_X - 5 ? (x - WOOD_X + 5) * 1.2 : 0) + (x < L + 2 ? (L + 2 - x) * 1.2 : 0)]);
  roofPts.push([WOOD_X - 1, 30]);
  roof.add(kit.mesh(poly(roofPts), W.deep2, { layer: -3 }));
  // Leaves hanging off the roof's edge.
  for (let x = L + 2; x < WOOD_X - 3; x += 1.3 + r() * 1.2) {
    const y = 5.3 + Math.sin(x * 0.7) * 0.6;
    const d = 0.35 + r() * 0.35;
    roof.add(kit.mesh(blob([[x - 0.3, y + 0.3], [x + 0.3, y + 0.3], [x + 0.22, y - d * 0.6], [x, y - d], [x - 0.22, y - d * 0.6]], 20), W.leaf, { z: 0.01, layer: -3 }));
  }
  // Shafts of light, slanting down through the gaps.
  const shafts = layer(-2);
  for (const x of [-34, -46, -55]) {
    shafts.add(kit.mesh(poly([[x - 0.6, 6], [x + 0.9, 6], [x + 3.4, -1], [x + 1.2, -1]]), W.shaft, { layer: -2, opacity: 0.13, plain: true }));
  }

  // ---- the floor ------------------------------------------------------------------
  // Moss hummocks just behind the path, bright on top.
  for (let x = L + 3.5; x < WOOD_X - 1; x += 1.6 + r() * 1.8) {
    const y = groundY(x), w = 0.8 + r() * 1.1, h = 0.35 + r() * 0.55;
    stage.add(kit.mesh(blob([[x - w, y - 0.2], [x - w * 0.7, y + h * 0.7], [x, y + h], [x + w * 0.7, y + h * 0.75], [x + w, y - 0.2]], 24), r() < 0.5 ? W.moss : W.mossDeep, { z: -0.5, layer: 0 }));
    stage.add(kit.mesh(blob([[x - w * 0.6, y + h * 0.6], [x, y + h * 0.98], [x + w * 0.5, y + h * 0.7], [x, y + h * 0.8]], 16), W.mossLit, { z: -0.49, layer: 0 }));
  }
  // Clumps of dark trumpet mushrooms, scenery only.
  const trumpet = (g, x, y, h, hex, z) => {
    g.add(kit.mesh(poly([[x - 0.035, y], [x + 0.035, y], [x + 0.03, y + h], [x - 0.03, y + h]]), hex, { z, layer: 0 }));
    g.add(kit.mesh(blob([[x - 0.2, y + h + 0.1], [x + 0.2, y + h + 0.1], [x + 0.06, y + h - 0.12], [x - 0.06, y + h - 0.12]], 16), hex, { z: z + 0.001, layer: 0 }));
  };
  for (const cx of [-28.5, -33.5, -39, -44, -49.5, -55, -58.5]) {
    const y = groundY(cx);
    for (let k = 0; k < 3; k++) trumpet(stage, cx + (k - 1) * 0.28, y, 0.4 + r() * 0.35, k % 2 ? W.trumpet : W.trumpetLit, -0.44 + k * 0.002);
  }

  // Little green stars on the moss, pooled for twinkling.
  const stars = [];
  const star = (parent, x, y, z, s) => {
    const g = new THREE.Group();
    g.add(kit.mesh(poly([[0, s], [s * 0.22, s * 0.22], [s, 0], [s * 0.22, -s * 0.22], [0, -s], [-s * 0.22, -s * 0.22], [-s, 0], [-s * 0.22, s * 0.22]]), W.star, { layer: 0, plain: true }));
    g.position.set(x, y, z);
    g.userData.live = true;
    g.userData.ph = r() * 6;
    parent.add(g);
    stars.push(g);
  };
  for (let i = 0; i < 22; i++) {
    const x = L + 3 + r() * (WOOD_X - L - 3), y = groundY(x) + 0.1 + r() * 0.5;
    star(stage, x, y, -0.4, 0.07 + r() * 0.05);
  }

  // The five that glow. A tall stem, a wide trumpet cap, and a halo that
  // shows when lit.
  const off = kit.mat(W.glowOff), on = kit.mat(W.glowOn, { plain: true });
  const mushrooms = STOPS.mushrooms.map(({ x }, i) => {
    const g = new THREE.Group();
    g.userData.pick = `mushroom-${i}`;
    g.userData.stop = x;
    const y = groundY(x);
    const h = 0.75 + (i % 3) * 0.12;
    const halo = kit.mesh(ellipse(0, h + 0.05, 0.7, 0.55), W.halo, { z: -0.02, layer: 0, opacity: 0.3, plain: true });
    halo.visible = false;
    g.add(halo);
    const stem = kit.mesh(poly([[-0.05, 0], [0.05, 0], [0.04, h], [-0.04, h]]), W.glowOff, { layer: 0 });
    const cap = new THREE.Mesh(new THREE.ShapeGeometry(blob([[-0.34, h + 0.16], [0.34, h + 0.16], [0.1, h - 0.14], [-0.1, h - 0.14]], 20), 20), off);
    cap.position.z = 0.002;
    g.add(stem, cap);
    // An invisible pad, a finger's width bigger than the mushroom.
    const pad = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(0, h * 0.6, 0.5, h * 0.75), 16), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    pad.position.z = -0.03;
    g.add(pad);
    g.position.set(x, y, -0.25);
    g.userData.cap = cap; g.userData.halo = halo; g.userData.lit = false;
    g.userData.light = (lit) => { g.userData.lit = lit; cap.material = lit ? on : off; halo.visible = lit; };
    stage.add(g);
    return g;
  });

  // The great old tree, and a way right through it. The front of the trunk
  // is IN FRONT of her, with a wide hollow cut through its foot — nearly the
  // whole trunk — leaving only slim bark pillars at each side, so walking
  // through she is seen inside the tree the whole way and slips behind a
  // pillar for only a step, the way you pass a doorframe. Behind her, the
  // inside of the hollow: dark old wood with rings and grain.
  const tx = STOPS.tree.x, ty = groundY(tx);
  const trunk = poly([[tx - 3.3, ty - 0.7], [tx - 2.3, ty + 0.5], [tx - 2.1, 6], [tx - 2.7, 14], [tx + 2.5, 14], [tx + 1.9, 6], [tx + 2.2, ty + 0.6], [tx + 3.6, ty - 0.7]]);
  const L0 = tx - 1.8, R0 = tx + 1.7, top = ty + 2.7;
  const arch = new THREE.Path();
  arch.moveTo(L0, ty - 0.66);
  arch.lineTo(L0, ty + 1.2);
  arch.quadraticCurveTo(L0 + 0.1, top, tx - 0.05, top + 0.05);
  arch.quadraticCurveTo(R0 - 0.1, top, R0, ty + 1.2);
  arch.lineTo(R0, ty - 0.66);
  arch.lineTo(L0, ty - 0.66);
  trunk.holes.push(arch);
  stage.add(kit.mesh(trunk, W.trunk, { z: 0.3, layer: 0 }));
  // The rim of the hollow, a lighter lip of worn wood just inside the bark.
  const rim = [];
  for (let k = 0; k <= 24; k++) {
    const u = k / 24, a2 = Math.PI * (1 - u);
    rim.push([tx - 0.05 + Math.cos(a2) * ((R0 - L0) / 2 + 0.02), ty + 1.2 + Math.sin(a2) * (top - ty - 1.2 + 0.02)]);
  }
  const rimIn = rim.map(([x, y]) => [tx - 0.05 + (x - tx + 0.05) * 0.93, ty + 1.2 + (y - ty - 1.2) * 0.9]).reverse();
  stage.add(kit.mesh(poly([[L0 - 0.02, ty - 0.66], ...rim, [R0 + 0.02, ty - 0.66], [R0 - 0.12, ty - 0.66], ...rimIn, [L0 + 0.12, ty - 0.66]]), W.trunkLit, { z: 0.301, layer: 0 }));
  // Inside: the far wall of the hollow, dark, with rings and grain.
  stage.add(kit.mesh(blob([[L0 - 0.1, ty - 0.4], [L0, ty + 1.4], [tx, top + 0.2], [R0, ty + 1.4], [R0 + 0.1, ty - 0.4]], 36), W.trunkDark, { z: -0.7, layer: 0 }));
  for (const [rx, ry, rr] of [[tx - 0.6, ty + 1.6, 0.45], [tx + 0.7, ty + 1.1, 0.35]]) {
    stage.add(kit.mesh(ellipse(rx, ry, rr, rr * 0.8), 0x2c3a31, { z: -0.69, layer: 0 }));
    stage.add(kit.mesh(ellipse(rx, ry, rr * 0.55, rr * 0.45), W.trunkDark, { z: -0.689, layer: 0 }));
  }
  for (let k = 0; k < 6; k++) {
    const x = L0 + 0.3 + k * 0.55;
    stage.add(kit.mesh(poly([[x, ty + 0.2], [x + 0.03, ty + 0.2], [x + 0.08, ty + 2.2], [x + 0.05, ty + 2.2]]), 0x2c3a31, { z: -0.688, layer: 0 }));
  }
  // Moss over its roots, low enough never to hide a puffin walking through.
  stage.add(kit.mesh(blob([[tx - 3.4, -0.5], [tx - 2.8, ty + 0.35], [tx - 2.0, ty + 0.1], [tx - 1.8, -0.5]], 20), W.moss, { z: 0.31, layer: 0 }));
  stage.add(kit.mesh(blob([[tx + 1.7, -0.5], [tx + 1.9, ty + 0.15], [tx + 2.8, ty + 0.45], [tx + 4, -0.5]], 20), W.moss, { z: 0.31, layer: 0 }));

  // ---- in front: dark moss and a trunk or two, framing --------------------------
  for (let x = L + 2; x < WOOD_X - 2; x += 2.6 + r() * 2.4) {
    const y = groundY(x) - 1.7 - r() * 0.4, w = 1.2 + r() * 0.8;
    front.add(kit.mesh(blob([[x - w, y - 1.2], [x - w * 0.8, y + 0.5], [x, y + 0.8 + r() * 0.3], [x + w * 0.8, y + 0.5], [x + w, y - 1.2]], 24), r() < 0.5 ? W.mossDark : W.mossDeep, { layer: 3 }));
    if (r() < 0.5) star(front, x + (r() - 0.5) * w, y + 0.4, 0.02, 0.1);
  }
  // One slim trunk close by, between two of the glowing mushrooms, so it
  // frames and never hides.
  front.add(kit.mesh(poly([[-44.6, -8], [-43.9, -8], [-44.0, 16], [-44.5, 16]]), W.trunkDark, { z: 0.05, layer: 3 }));
  for (const cx of [-36.5, -52]) {
    const y = groundY(cx) - 1.4;
    for (let k = 0; k < 3; k++) trumpet(front, cx + (k - 1) * 0.45, y, 0.9 + k * 0.3, W.trunkDark, 0.06 + k * 0.001);
  }

  return { mushrooms, stars };
}

// The wood's floor, as a band of ground like the meadow's — and where it
// meets the meadow, the moss spills out over it in a soft round hump, so the
// two grounds overlap instead of butting together in a wall.
export function woodGround(kit, stage, bandShape) {
  stage.add(kit.mesh(bandShape(L - 1, WOOD_X + 3, 0, 1.8), W.ground, { z: -0.31, layer: 0 }));
  stage.add(kit.mesh(bandShape(L - 0.1, WOOD_X + 3, 1.1, 0.9), W.groundDeep, { z: -0.305, layer: 0 }));
  const edge = [];
  for (let x = WOOD_X - 3; x <= WOOD_X + 1.4; x += 0.2) edge.push([x, groundY(x)]);
  const spill = (drop, hex, z) => stage.add(kit.mesh(blob([[WOOD_X - 3, -12], ...edge.map(([x, y]) => [x, y - drop]), [WOOD_X + 2.4, groundY(WOOD_X + 2.4) - 0.9 - drop], [WOOD_X + 3.2, -5], [WOOD_X + 2, -12]], 60), hex, { z, layer: 0 }));
  spill(0, W.ground, -0.295);
  spill(1.1, W.groundDeep, -0.294);
}


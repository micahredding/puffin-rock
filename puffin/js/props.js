// The THINGS a conversation turns on (talks.js choices): each a few flat
// paper shapes like everything else on the island, drawn standing on the
// ground at the origin (or, for the sky ones, hanging round it). About the
// size of Baba, so a finger finds them.

import * as THREE from './three.js';
import { blob, ellipse, poly, mergeStatic } from './shapes.js';

const make = (kit, items) => {
  const g = new THREE.Group();
  items.forEach(([shape, hex, extra = {}], i) => g.add(kit.mesh(shape, hex, { z: i * 0.002, layer: 0, ...extra })));
  mergeStatic(g);
  return g;
};
const star = (r, k = 0.4) => {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * k : r; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  return poly(pts);
};

export const PROPS = {
  clover: (kit) => make(kit, [
    ...[-0.25, 0.05, 0.3].flatMap((x, i) => [
      [poly([[x - 0.015, 0], [x + 0.015, 0], [x + 0.02, 0.3 + i * 0.06], [x - 0.01, 0.3 + i * 0.06]]), 0x5f8a36],
      ...[0, 2.1, 4.2].map((a) => [ellipse(x + Math.cos(a + 1.6) * 0.07, 0.34 + i * 0.06 + Math.sin(a + 1.6) * 0.07, 0.075, 0.06, a), 0x6fa044]),
    ]),
    [ellipse(0.1, 0.52, 0.09, 0.1), 0xe8a8c8], [ellipse(0.1, 0.55, 0.05), 0xf4d0e0],
  ]),
  hole: (kit) => make(kit, [
    [blob([[-0.8, 0], [-0.55, 0.45], [0, 0.6], [0.55, 0.45], [0.8, 0]], 24), 0x98b452],
    [ellipse(0, 0.22, 0.34, 0.26), 0x3d3228],
  ]),
  stump: (kit) => make(kit, [
    [poly([[-0.34, 0], [0.34, 0], [0.3, 0.5], [-0.3, 0.5]]), 0x7a5a3e],
    [ellipse(0, 0.5, 0.3, 0.08), 0xc8a472], [ellipse(0, 0.5, 0.18, 0.05), 0xa88452], [ellipse(0, 0.5, 0.07, 0.02), 0xc8a472],
    [blob([[-0.45, 0], [-0.34, 0.12], [-0.28, 0]], 10), 0x7a5a3e], [blob([[0.28, 0], [0.34, 0.14], [0.47, 0]], 10), 0x7a5a3e],
  ]),
  moon: (kit) => make(kit, [
    [ellipse(0, 0, 0.42), 0xf6f0d4, { plain: true }], [ellipse(-0.12, 0.1, 0.08), 0xe4dcbc, { plain: true }], [ellipse(0.13, -0.1, 0.06), 0xe4dcbc, { plain: true }],
  ]),
  beetle: (kit) => make(kit, [
    ...[-0.1, 0, 0.1].flatMap((x) => [[poly([[x, 0.06], [x - 0.08, 0.0], [x - 0.07, -0.01], [x + 0.01, 0.05]]), 0x2a2a30], [poly([[x, 0.06], [x + 0.08, 0.0], [x + 0.09, 0.01], [x + 0.01, 0.07]]), 0x2a2a30]]),
    [ellipse(0, 0.12, 0.18, 0.11), 0x2e4a3a], [poly([[0, 0.02], [0.006, 0.02], [0.006, 0.23], [0, 0.23]]), 0x1c2a22], [ellipse(0.19, 0.12, 0.06, 0.05), 0x1e2a24],
    [ellipse(-0.06, 0.17, 0.05, 0.025), 0x5f8a6e],
  ]),
  cloud: (kit) => make(kit, [
    [ellipse(0, -0.12, 0.62, 0.16), 0xb8c4cc, { plain: true }],
    ...[0, 1, 2, 3].map((k) => [ellipse((k - 1.5) * 0.3, Math.sin(k * 1.8) * 0.08, 0.3, 0.22), 0xffffff, { plain: true }]),
  ]),
  feather: (kit) => make(kit, [
    [blob([[0, -0.4], [0.1, -0.1], [0.08, 0.25], [0, 0.42], [-0.08, 0.25], [-0.1, -0.1]], 24), 0xf2f2ee],
    [poly([[-0.006, -0.5], [0.006, -0.5], [0.006, 0.4], [-0.006, 0.4]]), 0xb8b8b0],
  ]),
  burrow: (kit) => make(kit, [
    [blob([[-0.8, 0], [-0.5, 0.5], [0.1, 0.65], [0.7, 0.45], [0.85, 0]], 24), 0x93b04c],
    [ellipse(0, 0.22, 0.26, 0.2), 0x3d3228],
    [ellipse(-0.34, 0.15, 0.08, 0.06), 0xa8a396], [ellipse(0.34, 0.16, 0.08, 0.06), 0xa8a396],
  ]),
  pebbles: (kit) => make(kit, [
    [ellipse(-0.18, 0.08, 0.16, 0.09), 0xa9a194], [ellipse(0.14, 0.07, 0.14, 0.08), 0x8c9aa4], [ellipse(-0.02, 0.18, 0.12, 0.07), 0xd8cfc0],
    [ellipse(-0.06, 0.21, 0.04, 0.02), 0xf2eee6, { plain: true }],
  ]),
  fish: (kit) => {
    const g = make(kit, [
      [blob([[-0.3, 0], [0, 0.09], [0.3, 0], [0, -0.08]], 16), 0x8fa6b2], [poly([[-0.28, 0], [-0.44, 0.1], [-0.44, -0.1]]), 0x7f96a2], [blob([[-0.2, 0.0], [0.2, 0.0], [0, -0.07]], 12), 0xdfe8ec],
      [ellipse(0.18, 0.02, 0.025), 0x2a3440],
      ...[[-0.5, -0.25], [-0.35, -0.4], [0.45, -0.3]].map(([x, y]) => [ellipse(x, y, 0.04, 0.05), 0xdcebf2, { plain: true }]),
    ]);
    g.children.forEach((c) => { c.rotation.z = 0.6; });
    g.userData.lift = 0.5;
    return g;
  },
  whale: (kit) => make(kit, [
    [blob([[-0.1, 0], [0.1, 0], [0.08, 0.5], [0.45, 0.85], [0.1, 0.7], [0, 0.62], [-0.1, 0.7], [-0.45, 0.85], [-0.08, 0.5]], 30), 0x4e6470],
    [ellipse(0, 0.02, 0.4, 0.06), 0xe6f2ee, { plain: true }],
  ]),
  sparkles: (kit) => make(kit, [[-0.3, 0.1, 0.12], [0.05, 0.25, 0.08], [0.3, 0.05, 0.1], [-0.05, -0.05, 0.07]].map(([x, y, r]) => {
    const sh = star(r, 0.3); sh.getPoints().forEach(() => {}); return [sh, 0xbff8ff, { plain: true }];
  })),
  wave: (kit) => make(kit, [
    [blob([[-0.6, 0], [-0.4, 0.3], [0, 0.6], [0.35, 0.55], [0.3, 0.35], [0.1, 0.4], [0.2, 0.15], [0.6, 0]], 30), 0x86b4b0],
    [blob([[-0.1, 0.5], [0.2, 0.58], [0.35, 0.52], [0.22, 0.44]], 14), 0xf2f8f4, { plain: true }],
  ]),
  starfish: (kit) => make(kit, [[star(0.26, 0.42), 0xe8864a], [ellipse(0, 0, 0.06), 0xf2a86a]]),
  shell: (kit) => make(kit, [
    [blob([[-0.24, 0.02], [-0.18, 0.26], [0, 0.34], [0.18, 0.26], [0.24, 0.02], [0, -0.02]], 20), 0xf0a8a0],
    ...[-2, -1, 0, 1, 2].map((k) => [poly([[0, 0.02], [k * 0.08 + 0.012, 0.3], [k * 0.08 - 0.012, 0.3]]), 0xd9887e]),
  ]),
  eggshell: (kit) => {
    const rim = [];
    for (let k = 0; k <= 8; k++) rim.push([-0.3 + k * 0.075, 0.26 + (k % 2 ? -0.06 : 0.04)]);
    return make(kit, [[poly([[-0.32, 0.22], ...rim, [0.32, 0.22], [0.26, 0.05], [0, -0.01], [-0.26, 0.05]]), 0xf6f3ec], [ellipse(-0.08, 0.1, 0.05, 0.035), 0xd8d2c4]]);
  },
  leaf: (kit) => {
    const g = make(kit, [
      [blob([[-0.34, 0.06], [-0.1, 0.22], [0.26, 0.2], [0.4, 0.08], [0.1, 0.0]], 20), 0xc47a3a],
      [poly([[-0.34, 0.06], [0.4, 0.1], [0.4, 0.09], [-0.34, 0.055]]), 0x8a5028],
    ]);
    return g;
  },
};
export const PROP_NAMES = Object.keys(PROPS);

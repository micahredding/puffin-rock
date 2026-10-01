// UNDER PUFFIN ROCK — the burrow goes down, and down there it is not one
// hole but a warren: sandy tunnels winding through dark earth, roots hanging
// from the roof, worms and pebbles in the soil. The drawing is the show's own
// cut-away (the Puffin Rock Habitats grassland picture): light tunnels, dark
// earth, the whole thing seen side-on like a slice through the ground.
//
// It is its own world, far below the island (Y0), with its own floor: in at
// the burrow door, down the shaft into the family's nest chamber; along past
// a hollow where a hedgehog is fast asleep; down a long winding tunnel to the
// foot of a shaft full of roots, which you climb, and POP out of May's warren
// in the meadow.
//
// The floor is one curve again (so Baba can follow), and a roof keeps a flap
// to a hop. `tunnelFloor`, `tunnelRoof`, `UNDER` are pure; `buildUnder` makes
// the picture.
//
// Down the long tunnel it goes, and at the bottom of the far side is a shaft
// hung with ROOTS, straight up to May's warren: walk into them (or tap them)
// and Oona climbs, hand over hand, Baba after her, and out they pop.

import * as THREE from './three.js';
import { blob, ellipse, poly, mergeStatic } from './shapes.js';
import { STOPS } from './ground.js';
import * as paint from './paint.js';

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;
const window_ = (x, a, b, e) => smooth((x - a) / e) * smooth((b - x) / e);

export const Y0 = -30;            // the nest chamber's floor, far under the island
export const UNDER = {
  lo: -19.8, hi: 13.3,            // the fences: the back of the nest, the foot of the way out
  home: STOPS.burrow.x,           // the shaft up to the burrow door
  nest: -17.4,
  hedgehog: -8,
  worm: -4.6,
  roots: 13.0,                    // the foot of the root shaft up to May's warren
  warren: STOPS.may.x + 2.1,      // May's hole, up in the meadow, right above it
};

export function tunnelFloor(x) {
  if (x < -12) return Y0;
  if (x < -3.2) return lerp(Y0, Y0 + 2.8, smooth((x + 12) / 8.8)) - 0.7 * window_(x, -9.6, -6.4, 1);
  if (x < -1.5) return Y0 + 2.8;
  if (x < 7) return lerp(Y0 + 2.8, Y0 - 4.5, smooth((x + 1.5) / 8.5));
  if (x < 12.8) return lerp(Y0 - 4.5, Y0 - 0.6, smooth((x - 7) / 5.8));
  return Y0 - 0.6;
}

// The roof: a tunnel's height over the floor, higher in the nest chamber and
// the hedgehog's room.
export function tunnelRoof(x) {
  return tunnelFloor(x) + 2.5 + 1.1 * window_(x, -20.5, -12, 2) + 0.7 * window_(x, -10, -6, 1);
}

export const TUNNEL_WORLD = {
  ground: tunnelFloor, surf: () => -Infinity, pads: () => -1,
  lo: UNDER.lo, hi: UNDER.hi, slide: null, wind: false,
  roof: tunnelRoof,
};

// ---- the branches: real side tunnels, each its own room ------------------------
// Off the main tunnel, two branches go somewhere. UP, to a little larder where
// a wood mouse keeps its seeds and plays peekaboo from three holes. DOWN,
// deep, to a cave where the fungi's silvery threads run through the earth
// between the mushrooms, and a touch sends light racing along them.
// Each room has its own floor and fences; a LINK is the tunnel between two,
// which Oona walks along (game.js animates it) from a mouth in one room to a
// mouth in the other.

export const PANTRY = { lo: -12.4, hi: -5.2, mouse: [-11.2, -9.1, -6.9], pile: -10.15 };
export function pantryFloor(x) { return -20.2 + 0.1 * Math.sin(x * 1.3); }
export const pantryRoof = (x) => pantryFloor(x) + 2.6;

export const CAVE = { lo: 5.6, hi: 24, mushrooms: [8.2, 11.6, 15, 18.4, 21.8] };
export function caveFloor(x) { return -41.8 + 0.35 * Math.sin((x - 5) * 0.55) * window_(x, 5, 24.5, 2); }
export const caveRoof = (x) => caveFloor(x) + 3.6 + 0.8 * window_(x, 9, 21, 3);

const room = (ground, roof, lo, hi) => ({ ground, surf: () => -Infinity, pads: () => -1, lo, hi, slide: null, wind: false, roof });
export const ROOMS = {
  main: null,                     // filled in below: TUNNEL_WORLD
  pantry: room(pantryFloor, pantryRoof, PANTRY.lo, PANTRY.hi),
  cave: room(caveFloor, caveRoof, CAVE.lo, CAVE.hi),
};

// The tunnels between: where each starts and ends, and the way it winds
// (her feet follow these points).
export const LINKS = [
  { pick: 'to-pantry', from: 'main', at: -2.2, to: 'pantry', arrive: PANTRY.hi - 0.4,
    path: [[-2.2, -27.2], [-1.5, -25.2], [-1.9, -23.2], [-3.1, -21.4], [PANTRY.hi - 0.4, pantryFloor(PANTRY.hi - 0.4)]] },
  { pick: 'to-cave', from: 'main', at: -5.4, to: 'cave', arrive: CAVE.lo + 0.4,
    path: [[-5.4, tunnelFloor(-5.4)], [-4.2, -30.8], [-2.2, -34.4], [0.8, -37.8], [3.6, -40.6], [CAVE.lo + 0.4, caveFloor(CAVE.lo + 0.4)]] },
];
// Each link walked backwards, from the room's own mouth.
for (const l of [...LINKS]) LINKS.push({ pick: `from-${l.to}`, from: l.to, at: l.arrive, to: l.from, arrive: l.at, path: l.path.slice().reverse() });

export const U = {
  soil: 0x5c3b27, soilDark: 0x46301f, pebble: 0x3a281b, stone: 0x8c8177, stoneLit: 0xa89e92,
  tunnel: 0xdcb67f, rim: 0xb08655, hatch: 0xc39a64, root: 0x8a6440,
  light: 0xf6e8b0, straw: 0xd9b55c, strawDark: 0xb8913e, feather: 0xf4f2ec, worm: 0xd08c80,
};

// A thick band along a smooth path: the decorative side tunnels that wind off
// into the dark, the way the picture's do.
function band(points, width) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)));
  const pts = curve.getPoints(60);
  const left = [], right = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d * width / 2, ny = dx / d * width / 2;
    left.push([pts[i].x + nx, pts[i].y + ny]);
    right.push([pts[i].x - nx, pts[i].y - ny]);
  }
  return poly([...left, ...right.reverse()]);
}

export function buildUnder(kit) {
  const g = new THREE.Group();
  const r = paint.rng(141);
  const m = (shape, hex, z) => g.add(kit.mesh(shape, hex, { z, layer: 0 }));

  // The earth, all round: dark, with pebbles and stones in it.
  m(poly([[-48, -54], [44, -54], [44, -9], [-48, -9]]), U.soil, -1.3);
  for (let i = 0; i < 300; i++) {
    const x = -46 + r() * 88, y = -52 + r() * 42;
    const big = r() < 0.25;
    if (big) {
      const w = 0.4 + r() * 0.7;
      m(blob([[x - w, y], [x - w * 0.6, y + w * 0.6], [x + w * 0.5, y + w * 0.55], [x + w, y], [x, y - w * 0.3]], 16), r() < 0.5 ? U.stone : U.stoneLit, -1.29);
    } else m(ellipse(x, y, 0.2 + r() * 0.35, 0.12 + r() * 0.2, r() * 3), r() < 0.6 ? U.pebble : U.soilDark, -1.29);
  }
  // Roots hanging down from the grass far above.
  for (let x = -40; x < 40; x += 2.5 + r() * 3) {
    const len = 2 + r() * 3, lean = (r() - 0.5) * 1.5;
    m(poly([[x - 0.06, -9], [x + 0.06, -9], [x + lean + 0.02, -9 - len], [x + lean - 0.02, -9 - len]]), U.root, -1.28);
    m(poly([[x + lean * 0.4, -9 - len * 0.4], [x + lean * 0.4 + 0.03, -9 - len * 0.4], [x + lean * 0.4 + 0.6, -9 - len * 0.75], [x + lean * 0.4 + 0.57, -9 - len * 0.75]]), U.root, -1.28);
  }

  // Roots coming down through the earth to just above the tunnel's roof,
  // little branching tips, the way they show in the picture.
  for (let x = UNDER.lo - 6; x < UNDER.hi + 8; x += 1.6 + r() * 2.2) {
    const tip = (x < UNDER.lo || x > UNDER.hi ? tunnelRoof(Math.max(UNDER.lo, Math.min(UNDER.hi, x))) : tunnelRoof(x)) + 0.25 + r() * 0.3;
    const top = tip + 2.2 + r() * 1.5, lean = (r() - 0.5) * 0.6;
    m(poly([[x - 0.05, top], [x + 0.05, top], [x + lean + 0.015, tip], [x + lean - 0.015, tip]]), U.root, -1.285);
    for (let k = 0; k < 3; k++) {
      const t = 0.3 + k * 0.22, bx = x + lean * t, by = top + (tip - top) * t, side = k % 2 ? 1 : -1;
      m(poly([[bx, by], [bx + 0.03, by], [bx + side * 0.45, by - 0.4], [bx + side * 0.43, by - 0.42]]), U.root, -1.285);
    }
  }

  // The side tunnels, winding off into the dark: for looking at, not for going.
  const side = [
    [[-19, -27.6], [-23, -24], [-28, -23], [-36, -20]],
    [[-13, -28.6], [-15, -33], [-22, -36], [-32, -35]],
    [[24, -40.5], [30, -43], [38, -41]],
    [[-12.6, -19.4], [-14.2, -16.5], [-22, -14.5], [-30, -13.5]],
    [[10, -32.6], [15, -35], [22, -34], [34, -38]],
    [[5, -30.5], [9, -26], [16, -24], [30, -21]],
  ];
  for (const pts of side) { m(band(pts, 1.9), U.rim, -1.22); m(band(pts, 1.6), U.tunnel, -1.21); }

  // The tunnel she walks in: from the floor to the roof, with a darker rim.
  const main = (pad) => {
    const top = [], bot = [];
    for (let x = UNDER.lo - 1.2; x <= UNDER.hi + 0.8; x += 0.2) { top.push([x, tunnelRoof(x) + pad]); bot.push([x, tunnelFloor(x) - 0.35 - pad]); }
    return poly([...top, ...bot.reverse()]);
  };
  m(main(0.16), U.rim, -1.2);
  m(main(0), U.tunnel, -1.19);
  // The shafts: up to the burrow door (with daylight coming down it), and up
  // from the far end to May's warren.
  const shaft = (x, from, w) => poly([[x - w, from], [x + w, from], [x + w * 0.9, -9], [x - w * 0.9, -9]]);
  m(shaft(UNDER.home, tunnelRoof(UNDER.home) - 0.5, 1.0), U.rim, -1.2);
  m(shaft(UNDER.home, tunnelRoof(UNDER.home) - 0.6, 0.85), U.tunnel, -1.19);
  m(shaft(UNDER.warren - 0.4, tunnelRoof(UNDER.hi) - 1, 0.9), U.rim, -1.2);
  m(shaft(UNDER.warren - 0.4, tunnelRoof(UNDER.hi) - 1.1, 0.75), U.tunnel, -1.19);
  // Scratchy marks on the floor and walls: grass and roots dragged in.
  for (let x = UNDER.lo; x < UNDER.hi; x += 0.5 + r() * 0.8) {
    const y = tunnelFloor(x) + 0.05 + r() * 1.6;
    m(poly([[x, y], [x + 0.25, y + 0.06], [x + 0.25, y + 0.03], [x, y - 0.02]]), U.hatch, -1.185);
  }

  // The roots hanging down the far shaft: a tangle to climb, with daylight
  // at the top. Tap them (or walk into them) to climb.
  const roots = new THREE.Group();
  roots.userData = { pick: 'roots', stop: UNDER.roots, room: 'main' };
  const sx = UNDER.warren - 0.4, sb = tunnelFloor(UNDER.hi) + 0.1;
  for (const [dx, hex] of [[-0.35, U.root], [0.05, 0x7a5636], [0.4, U.root]]) {
    const pts = [];
    for (let y = -9; y >= sb; y -= 0.5) pts.push([sx + dx + Math.sin(y * 1.7 + dx * 5) * 0.12, y]);
    const left = pts.map(([x, y]) => [x - 0.05, y]), right = pts.map(([x, y]) => [x + 0.05, y]).reverse();
    m(poly([...left, ...right]), hex, -1.05);
    for (let y = -9.4; y > sb + 0.4; y -= 0.8 + r() * 0.5) {
      const x = sx + dx + Math.sin(y * 1.7 + dx * 5) * 0.12, side = r() < 0.5 ? -1 : 1;
      m(poly([[x, y], [x, y + 0.04], [x + side * 0.3, y - 0.25], [x + side * 0.28, y - 0.28]]), hex, -1.049);
    }
  }
  g.add(kit.mesh(poly([[sx - 0.7, -9.2], [sx + 0.7, -9.2], [sx + 0.6, -12], [sx - 0.6, -12]]), U.light, { z: -1.052, layer: 0, opacity: 0.35, plain: true }));
  const rPad = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(sx - 0.2, sb + 1.3, 0.8, 1.3), 14), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  rPad.position.z = -0.03;
  roots.add(rPad);
  mergeStatic(roots);
  roots.position.z = -1.05;
  g.add(roots);

  // ---- the branches, drawn ------------------------------------------------------
  // The link tunnels: a band along each path, raised so a puffin walking with
  // her feet on the path is inside it.
  for (const l of LINKS.slice(0, 2)) {
    const lifted = l.path.map(([x, y]) => [x, y + 1.15]);
    // Behind the main tunnel (which it opens off), and its last stretch
    // drawn again over the branch room's wall, so the room opens into it
    // rather than looking sealed off.
    m(band(lifted, 2.9), U.rim, -1.215);
    m(band(lifted, 2.6), U.tunnel, -1.205);
    const n = lifted.length;
    m(band([lifted[n - 3], lifted[n - 2], lifted[n - 1]].map(([x, y], k) => (k === 0 ? [x + (lifted[n - 2][0] - x) * 0.5, y + (lifted[n - 2][1] - y) * 0.5] : [x, y])), 2.6), U.tunnel, -1.186);
  }
  const roomShape = (floor, roof, lo, hi, pad) => {
    const top = [], bot = [];
    for (let x = lo - 0.9; x <= hi + 0.9; x += 0.2) {
      const e = Math.min(1, Math.min(x - (lo - 0.9), hi + 0.9 - x) / 0.9);   // round the ends
      const mid = (floor(x) + roof(x)) / 2, half = (roof(x) - floor(x)) / 2 * Math.sqrt(Math.max(0, e * (2 - e)));
      top.push([x, mid + half + pad]); bot.push([x, Math.min(mid - half, floor(x) - 0.35) - pad]);
    }
    return poly([...top, ...bot.reverse()]);
  };
  m(roomShape(pantryFloor, pantryRoof, PANTRY.lo, PANTRY.hi, 0.16), U.rim, -1.2);
  m(roomShape(pantryFloor, pantryRoof, PANTRY.lo, PANTRY.hi, 0), U.tunnel, -1.19);
  m(roomShape(caveFloor, caveRoof, CAVE.lo, CAVE.hi, 0.16), 0x5f5a66, -1.2);
  m(roomShape(caveFloor, caveRoof, CAVE.lo, CAVE.hi, 0), 0x3e3a4a, -1.19);

  // The larder: three little round holes in the wall, and a heap of food.
  for (const hx of PANTRY.mouse) {
    m(ellipse(hx, pantryFloor(hx) + 0.28, 0.34, 0.28), U.rim, -1.18);
    m(ellipse(hx, pantryFloor(hx) + 0.26, 0.28, 0.23), 0x2a1c12, -1.179);
  }
  const px = PANTRY.pile, py = pantryFloor(px);
  for (let k = 0; k < 18; k++) {
    const x = px - 0.6 + r() * 1.2, y = py + 0.08 + r() * (0.5 - Math.abs(x - px) * 0.6);
    const kind = k % 3;
    if (kind === 0) m(ellipse(x, y, 0.1, 0.09), 0x9a6a3a, -1.17);                    // a hazelnut
    else if (kind === 1) m(ellipse(x, y, 0.07, 0.05, r() * 3), 0xe0c890, -1.169);    // a seed
    else { m(ellipse(x, y, 0.08), 0x4a2a4e, -1.168); m(ellipse(x + 0.03, y + 0.03, 0.025), 0x7a5a7e, -1.167); }  // a blackberry
  }

  // The cave: pale threads through the dark rock between the mushrooms, and
  // off into the earth. Kept as polylines for the light to run along.
  const cm = CAVE.mushrooms;
  const threads = [];
  for (let i = 0; i < cm.length - 1; i++) {
    const a = cm[i], b = cm[i + 1], pts = [];
    for (let k = 0; k <= 16; k++) {
      const u = k / 16, x = a + (b - a) * u;
      pts.push([x, caveFloor(x) + 0.35 + Math.sin(u * Math.PI) * (1.3 + (i % 2) * 0.8) + Math.sin(u * 9 + i) * 0.08]);
    }
    threads.push({ from: i, to: i + 1, pts });
  }
  for (const [i, dx, dy] of [[0, -3, -2.5], [2, 1, -3.4], [4, 3, 1.5], [1, -1.5, 3.4], [3, 1.2, 3.2]]) {
    const a = cm[i], pts = [];
    for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push([a + dx * u + Math.sin(u * 7) * 0.15, caveFloor(a) + 0.35 + dy * u]); }
    threads.push({ from: i, to: -1, pts });
  }
  for (const th of threads) {
    const left = th.pts.map(([x, y]) => [x, y + 0.025]), right = th.pts.map(([x, y]) => [x, y - 0.025]).reverse();
    m(poly([...left, ...right]), 0xb8b4c8, -1.15);
  }
  const caveMush = cm.map((x, i) => {
    const gm = new THREE.Group();
    gm.userData = { pick: `glow-${i}`, stop: x, room: 'cave', lit: 0 };
    const y = caveFloor(x), h = 0.5 + (i % 2) * 0.2;
    const halo = kit.mesh(ellipse(0, h + 0.1, 0.7, 0.55), 0x9ef0d8, { z: -0.02, layer: 0, opacity: 0.3, plain: true });
    halo.visible = false;
    gm.add(halo);
    gm.add(kit.mesh(poly([[-0.05, 0], [0.05, 0], [0.04, h], [-0.04, h]]), 0xd8d2e0, { layer: 0 }));
    const off = kit.mat(0xa9a2ba), on = kit.mat(0xc9ffe9, { plain: true });
    const cap = new THREE.Mesh(new THREE.ShapeGeometry(blob([[-0.32, h + 0.02], [-0.2, h + 0.22], [0.2, h + 0.22], [0.32, h + 0.02], [0, h - 0.06]], 20), 20), off);
    cap.position.z = 0.002;
    gm.add(cap);
    const pd = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(0, h * 0.6, 0.5, 0.6), 12), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    pd.position.z = -0.03;
    gm.add(pd);
    gm.position.set(x, y, -0.3);
    gm.userData.light = (lit) => { cap.material = lit ? on : off; halo.visible = lit; };
    g.add(gm);
    return gm;
  });
  // The light itself: little glowing beads, pooled, that run along a thread.
  const beads = [];
  for (let i = 0; i < 40; i++) {
    const bd = kit.mesh(ellipse(0, 0, 0.07), 0xd8fff0, { layer: 0, plain: true });
    bd.visible = false; bd.position.z = -1.12; bd.userData.live = true;
    g.add(bd); beads.push(bd);
  }

  // The mouths: at each end of a link, a soft glow in the opening (it
  // breathes, game.js, so the ways on are easy to see) and a generous tap
  // target over the first stretch of the tunnel.
  const mouths = LINKS.map((l) => {
    const mo = new THREE.Group();
    mo.userData = { pick: l.pick, stop: l.at, room: l.from };
    const [a, b2, c2] = l.path;
    const cx = a[0] + (b2[0] - a[0]) * 0.55, cy = a[1] + (b2[1] - a[1]) * 0.55 + 1.15;
    const glow = kit.mesh(ellipse(0, 0, 0.75, 0.75), U.light, { layer: 0, opacity: 0.35, plain: true });
    glow.position.set(cx, cy, 0.01);
    mo.add(glow);
    const invisible = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
    for (const [px, py, rr] of [[cx, cy, 1.1], [b2[0], b2[1] + 1.15, 1.1], [(b2[0] + c2[0]) / 2, (b2[1] + c2[1]) / 2 + 1.15, 1.0]]) {
      mo.add(new THREE.Mesh(new THREE.ShapeGeometry(ellipse(px, py, rr, rr), 14), invisible));
    }
    mo.position.z = -1.0;
    mo.userData.glow = glow;
    g.add(mo);
    return mo;
  });

  // Daylight down the home shaft: a soft glow, and the thing to tap to go up.
  const up = new THREE.Group();
  up.userData = { pick: 'up', stop: UNDER.home, room: 'main' };
  const hr = tunnelRoof(UNDER.home);
  const glow = kit.mesh(poly([[UNDER.home - 0.8, hr - 0.4], [UNDER.home + 0.8, hr - 0.4], [UNDER.home + 0.72, hr + 2.6], [UNDER.home - 0.72, hr + 2.6]]), U.light, { layer: 0, opacity: 0.45, plain: true });
  // Fainter higher up, where the light comes from.
  g.add(kit.mesh(poly([[UNDER.home - 0.72, hr + 2.6], [UNDER.home + 0.72, hr + 2.6], [UNDER.home + 0.62, -9], [UNDER.home - 0.62, -9]]), U.light, { z: -1.101, layer: 0, opacity: 0.25, plain: true }));
  up.add(glow);
  up.position.z = -1.1;
  g.add(up);

  // The nest: a bed of dry grass and a few soft feathers.
  const nest = new THREE.Group();
  nest.userData = { pick: 'nest', stop: UNDER.nest, room: 'main' };
  const nx = UNDER.nest, ny = tunnelFloor(nx);
  nest.add(kit.mesh(blob([[nx - 1.2, ny + 0.05], [nx - 1.0, ny + 0.4], [nx, ny + 0.55], [nx + 1.0, ny + 0.4], [nx + 1.2, ny + 0.05], [nx, ny - 0.05]], 30), U.straw, { layer: 0 }));
  for (let k = 0; k < 14; k++) {
    const x = nx - 1 + k * 0.15, a = (r() - 0.5) * 1.2;
    nest.add(kit.mesh(poly([[x, ny + 0.2], [x + 0.02, ny + 0.2], [x + Math.sin(a) * 0.5 + 0.02, ny + 0.2 + Math.cos(a) * 0.4], [x + Math.sin(a) * 0.5, ny + 0.2 + Math.cos(a) * 0.4]]), U.strawDark, { z: 0.002, layer: 0 }));
  }
  for (const [fx, fy, a] of [[-0.6, 0.5, 0.6], [0.4, 0.55, -0.4], [0.9, 0.35, 0.9]]) {
    nest.add(kit.mesh(ellipse(nx + fx, ny + fy, 0.16, 0.06, a), U.feather, { z: 0.004, layer: 0 }));
  }
  const nPad = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(nx, ny + 0.4, 1.4, 0.7), 16), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  nPad.position.z = -0.03;
  nest.add(nPad);
  nest.position.z = -0.2;
  g.add(nest);

  // A worm, poking out of the tunnel wall, wriggling.
  const worm = new THREE.Group();
  worm.userData = { pick: 'worm', stop: UNDER.worm, live: true, room: 'main' };
  const segs = [];
  for (let k = 0; k < 6; k++) {
    const s = kit.mesh(ellipse(0, 0, 0.1, 0.075), U.worm, { layer: 0 });
    s.position.z = k * 0.001;
    worm.add(s);
    segs.push(s);
  }
  const wPad = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(0, -0.2, 0.6, 0.5), 12), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  wPad.position.z = -0.03;
  worm.add(wPad);
  worm.position.set(UNDER.worm, tunnelRoof(UNDER.worm) - 0.1, -1.0);
  worm.userData.segs = segs;
  g.add(worm);

  return { group: g, up, nest, worm, roots, mouths, caveMush, threads, beads };
}

ROOMS.main = TUNNEL_WORLD;

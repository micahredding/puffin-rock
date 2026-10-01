// Puffin Rock, built: layers of cut paper from the far sea to the tufts in
// front of your nose. Every layer is a flat group at one depth; the camera
// slides sideways past them and the far ones move slower, which is all the
// depth the show ever has. Far layers are HAZED — mixed toward the pale air —
// so the eye reads distance the way it does in the pictures.
//
//   z  -70  the sky (carried by the camera)
//      -60  the far sea, the pointed islands on it, clouds
//      -32  far hills
//      -14  near hills: other puffins' burrows
//       -4  the bank behind the stage; the big rocks
//        0  THE STAGE: the ground everyone walks on, and everyone
//       +3  tufts and sea-pinks in front
//
// `buildIsland(kit)` returns the world and handles to everything that moves
// or can be tapped. Pure construction: no clock, no DOM.

import * as THREE from './three.js';
import { blob, ellipse, poly, land, rolling, mergeStatic } from './shapes.js';
import { groundY, X_MIN, X_MAX, WOOD_X, STOPS, SLIDE, SEA_X, SURFACE, TOP, BEACH, CLIFF, PADS, POND } from './ground.js';
import { buildWood, woodGround } from './wood.js';
import { buildWest } from './west.js';
import { buildEast } from './east.js';
import { buildDunes } from './dunes.js';
import { buildUnder, tunnelFloor, pantryFloor, UNDER, PANTRY } from './under.js';
import { settle, makePuffin, makeBaba, makeMay, makeMossy, makeSilky, makeFrog, makeCrab, makeGannet, makeKittiwake, makeHedgehog, makeRabbit, makeOtter, makeBernie, makeSheep, makeJelly, makeMouse } from './cast.js';
import * as paint from './paint.js';

export const C = {
  meadow: 0xcbc45c, meadowDeep: 0xb4ae4c, grass: 0x98ad44, grassDark: 0x7d9638,
  mound: 0x93b04c, moundTop: 0xa9c25a,
  rock: 0xb8b0a2, rockDeep: 0x9c9587, rockDark: 0x857f74,
  sand: 0xdcc89c, sandDeep: 0xcbb485,
  sea: 0x86b4b0, seaDeep: 0x6e9e9c, crest: 0xc6e0d6, farSea: 0x9fc4c4,
  door: 0x3d3228, stone: 0xa8a396,
  dandelion: 0xf2c53c, clock: 0xf3f1e8, stem: 0x7d9a3e,
  thrift: 0xe99ab2, cloud: 0xf4f6ef,
};

const pickable = (obj, name, stop) => { obj.userData.pick = name; obj.userData.stop = stop; return obj; };

// A tap target bigger than the thing: an invisible ellipse behind it. A
// four-year-old's finger is not a mouse pointer, and a friend with a gap
// between her ears and her back should not be missable through the gap.
const PAD = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
function pad(obj, cx, cy, rx, ry) {
  const m = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(cx, cy, rx, ry), 20), PAD);
  m.position.z = -0.03;
  m.userData.pad = true;
  obj.add(m);
  return obj;
}

export function buildIsland(kit) {
  const world = new THREE.Group();
  const layer = (z) => { const g = new THREE.Group(); g.position.z = z; world.add(g); return g; };

  // ---- the sky, carried by the camera (game.js keeps it behind her) --------
  const skyBuf = paint.sky();
  const skyTex = kit.bake(skyBuf);
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, color: 0xffffff, depthWrite: false });
  if (!skyTex) skyMat.color.setRGB(...paint.average(skyBuf).map((v) => v / 255), THREE.SRGBColorSpace);
  skyMat.userData = { paint: skyBuf, repeat: 1, clamp: true };
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(260, 90), skyMat);
  sky.position.z = -70;
  sky.renderOrder = -10;
  world.add(sky);

  // ---- far: the sea to the horizon, the pointed islands, clouds -------------
  const far = layer(-60);
  far.add(kit.mesh(land(-140, 200, () => 0.2, -60), C.farSea, { layer: -60, haze: 0.35 }));
  far.add(kit.mesh(land(-140, 200, () => 0.25 + 0.02, 0.2), 0xb9d5d1, { z: 0.01, layer: -60, haze: 0.4 }));
  // The Skelligs of it: two steep rocks and a low one, far out.
  const isle = (x, w, h, peak = 0.5) => blob([[x - w, 0.1], [x - w * 0.6, h * 0.5], [x - w * (0.5 - peak) * 0.5, h], [x + w * 0.2, h * 0.8], [x + w * 0.7, h * 0.35], [x + w, 0.1]], 40);
  far.add(kit.mesh(isle(55, 7, 8, 0.6), 0x93aaa8, { z: 0.02, layer: -60, haze: 0.5 }));
  far.add(kit.mesh(isle(72, 4.5, 5.2, 0.4), 0x9db2ae, { z: 0.03, layer: -60, haze: 0.55 }));
  far.add(kit.mesh(isle(-30, 9, 3.2, 0.3), 0x9db2ae, { z: 0.03, layer: -60, haze: 0.6 }));
  // A whale, far out, who comes up to breathe: a dark back arching out of
  // the sea at the horizon, and the spout (game.js grows it).
  const whale = new THREE.Group();
  whale.add(kit.mesh(blob([[-3.2, 0.1], [-2.2, 0.9], [0, 1.3], [2.4, 0.9], [3.4, 0.1]], 30), 0x4e6470, { layer: -60, haze: 0.35 }));
  whale.add(kit.mesh(poly([[1.2, 1.0], [1.7, 1.9], [2.0, 0.9]]), 0x4e6470, { z: 0.01, layer: -60, haze: 0.35 }));
  const spout = new THREE.Group();
  spout.add(kit.mesh(blob([[-0.3, 0], [0.3, 0], [0.7, 3.2], [1.4, 4.2], [0, 4.8], [-1.4, 4.2], [-0.7, 3.2]], 30), 0xf2f6f4, { layer: -60, opacity: 0.85, plain: true }));
  spout.position.set(-0.8, 1.1, 0.02);
  spout.scale.set(1, 0.001, 1);
  whale.add(spout);
  whale.position.set(86, -1.5, 0.5);
  whale.userData = { live: true, spout };
  far.add(whale);
  const clouds = [];
  const rc = paint.rng(99);
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    const x = -80 + i * 26 + rc() * 10, y = 13 + rc() * 11, s = 3 + rc() * 3;
    for (let k = 0; k < 4; k++) {
      g.add(kit.mesh(ellipse((k - 1.5) * s * 0.55, Math.sin(k * 1.7) * s * 0.18, s * (0.45 + rc() * 0.2), s * (0.3 + rc() * 0.12)), C.cloud, { z: k * 0.01, layer: -58, opacity: 0.85 }));
    }
    g.position.set(x, y, 2);
    g.userData.live = true;
    g.userData.x0 = x;
    g.userData.speed = 0.25 + rc() * 0.3;
    far.add(g);
    clouds.push(g);
  }

  // ---- far hills, then near hills with the neighbours' burrows --------------
  const farHills = layer(-32);
  const fh = rolling(3, { base: 1.2, amp: 2.2, scale: 1.6 });
  // Down into the sea at both ends of the island.
  const fhTop = (x) => fh(x) - 14 * smooth01((x - 30) / 30) - 14 * smooth01((-75 - x) / 25);
  farHills.add(kit.mesh(land(-170, 180, fhTop, -40), 0xa7bd6f, { layer: -32, haze: 0.52 }));

  const midHills = layer(-14);
  const mh = rolling(5, { base: 0.4, amp: 1.3, scale: 1.1 });
  const mhTop = (x) => mh(x) - 12 * smooth01((x - 24) / 22) - 12 * smooth01((-82 - x) / 14);
  midHills.add(kit.mesh(land(-130, 120, mhTop, -30), 0xa1bb5a, { layer: -14, haze: 0.3 }));
  // Other burrows on the hill, each a little mound with a dark door.
  // Behind each, a neighbour who pops up to wave as Oona passes (fun.js).
  const neighbours = [];
  for (const bx of [-38, -26, -9, 4, 14]) {
    const by = mhTop(bx);
    const nb = makePuffin(kit, neighbours.length % 2 ? 'mama' : 'papa', 0.5);
    nb.root.userData = { live: true, x: bx + 0.2, y0: by - 0.9, y1: by + 0.45 };
    nb.root.position.set(bx + 0.2, by - 0.9, 0.005);
    nb.flip = bx < 0 ? 1 : -1; nb.root.scale.x = nb.flip;
    midHills.add(nb.root);
    neighbours.push(nb);
    midHills.add(kit.mesh(ellipse(bx, by, 2.2, 1.1), 0x95b152, { z: 0.02, layer: -14, haze: 0.3 }));
    midHills.add(kit.mesh(ellipse(bx + 0.2, by + 0.28, 0.42, 0.34), C.door, { z: 0.04, layer: -14, haze: 0.4 }));
  }
  // Cliffs dropping to the sea on the right, on the near hills.
  midHills.add(kit.mesh(blob([[26, -8], [27, 2.5], [33, 3.4], [41, 1.2], [46, -8]], 40), 0xaaa396, { z: 0.03, layer: -14, haze: 0.35 }));

  // ---- just behind the stage ------------------------------------------------
  const back = layer(-4);
  // It rises out of the wood's edge rather than stopping in a wall.
  const bank = (x) => (0.9 + 0.45 * Math.sin(x * 0.31) + 0.25 * Math.sin(x * 0.77 + 1)) * smooth01((x - WOOD_X + 2) / 5) - 1.5 * (1 - smooth01((x - WOOD_X + 2) / 5));
  back.add(kit.mesh(land(WOOD_X - 2, 17, bank, -12), 0xaebd52, { layer: -4, haze: 0.12 }));
  // Tall stalks and dandelion dots in the bank, the second picture's meadow.
  const rs = paint.rng(12);
  for (let i = 0; i < 26; i++) {
    const x = WOOD_X + 2 + i * 1.7 + rs(), y = bank(x) - 0.2;
    const h = 1 + rs() * 1.6;
    const lean = (rs() - 0.4) * 0.5, gold = rs() < 0.5;
    back.add(kit.mesh(poly([[x - 0.025, y], [x + 0.025, y], [x + lean + 0.02, y + h], [x + lean - 0.02, y + h]]), gold ? 0xc9a854 : 0x9fb24a, { z: 0.02, layer: -4, haze: 0.12 }));
    back.add(kit.mesh(ellipse(x + lean, y + h + 0.16, 0.06, 0.2, -lean * 0.4), gold ? 0xd9b25a : 0xb4c060, { z: 0.021, layer: -4, haze: 0.12 }));
    if (rs() < 0.5) back.add(kit.mesh(ellipse(x + 0.1, y + h * 0.6, 0.16), rs() < 0.6 ? C.dandelion : C.clock, { z: 0.03, layer: -4, haze: 0.1 }));
  }
  // The big rounded rocks, like the first picture's, behind the slope.
  const boulder = (x, y, w, h, hex, z) => back.add(kit.mesh(blob([[x - w, y], [x - w * 0.9, y + h * 0.6], [x - w * 0.3, y + h], [x + w * 0.5, y + h * 0.9], [x + w, y + h * 0.3], [x + w * 0.8, y]], 36), hex, { z, layer: -4, haze: 0.1 }));
  boulder(19, -1, 4, 5.2, 0xa89f90, 0.01);
  boulder(24.5, -1, 3.6, 6.8, 0x9e978a, 0.02);
  boulder(30, -2, 4.4, 4.2, 0xb0a898, 0.03);
  boulder(36.5, -2, 3.2, 2.6, 0xa39c8e, 0.04);

  // ---- THE STAGE ------------------------------------------------------------
  const stage = layer(0);
  // A band of ground: its top is the walking curve, and its left edge may
  // slant in underneath (`tuck`), so one kind of ground sits ON the one before
  // it instead of butting against it in a wall.
  const bandShape = (x0, x1, drop, tuck) => {
    const pts = [];
    for (let x = x0; x < x1; x += 0.25) pts.push([x, groundY(x) - drop]);
    pts.push([x1, groundY(x1) - drop], [x1, -12], [x0 + tuck, -12]);
    if (tuck) pts.push([x0 + tuck * 0.35, groundY(x0) - drop - 0.9]);
    return poly(pts);
  };
  const band = (x0, x1, hex, deep, z, tuck = 0) => {
    stage.add(kit.mesh(bandShape(x0, x1, 0, tuck), hex, { z, layer: 0 }));
    stage.add(kit.mesh(bandShape(x0 + tuck * 0.5, x1, 1.1, tuck * 0.5), deep, { z: z + 0.005, layer: 0 }));
  };
  woodGround(kit, stage, bandShape);
  band(WOOD_X + 0.5, 18, C.meadow, C.meadowDeep, -0.3, 1.8);
  band(15.3, SLIDE.x0 + 6.5, C.rock, C.rockDeep, -0.29, 1.6);
  // The sand begins at the lip of the slide, but slants back under it, so the
  // rock the slide is poured over shows as a crag, not a wall.
  const sandShape = (drop) => {
    const pts = [];
    for (let x = SLIDE.x0 + 0.1; x <= X_MAX + 20; x += 0.25) pts.push([x, groundY(x) - drop]);
    pts.push([X_MAX + 20, -12], [SLIDE.x0 + 6, -12], [SLIDE.x0 + 3.2, groundY(SLIDE.x0 + 3.2) - 2.4 - drop * 0.3], [SLIDE.x0 + 1.2, groundY(SLIDE.x0 + 1.2) - 0.9 - drop]);
    return poly(pts);
  };
  stage.add(kit.mesh(sandShape(0), C.sand, { z: -0.28, layer: 0 }));
  stage.add(kit.mesh(sandShape(1.1), C.sandDeep, { z: -0.275, layer: 0 }));
  // Grass along the meadow's edge: little dark blades.
  const rg = paint.rng(21);
  for (let x = WOOD_X; x < 15.8; x += 0.28 + rg() * 0.25) {
    const y = groundY(x), h = 0.12 + rg() * 0.2, lean = (rg() - 0.5) * 0.12;
    stage.add(kit.mesh(poly([[x - 0.05, y - 0.05], [x + 0.05, y - 0.05], [x + lean, y + h]]), rg() < 0.5 ? C.grass : C.grassDark, { z: -0.2, layer: 0 }));
  }
  // Pebbles and specks in the ground, so it is not a blank wall below her.
  // (West of the wood, grass; out east they are under the rock or the sea.)
  for (let i = 0; i < 70; i++) {
    const x = X_MIN - 8 + rg() * (X_MAX - X_MIN + 20), y = groundY(x) - 0.4 - rg() * 1.8;
    stage.add(kit.mesh(ellipse(x, y, 0.08 + rg() * 0.14, 0.06 + rg() * 0.08), x > 116.5 ? 0x4a3a28 : x > 99 && x < 116.5 ? 0xcdb884 : x < -65 ? 0x8a9f40 : x < WOOD_X ? 0x4d7834 : x < 15.5 ? 0xb9b24a : x < SLIDE.x0 ? 0x9e968a : 0xc9b387, { z: -0.26, layer: 0 }));
  }

  // The burrow: home. A great grassy mound with a dark round door and stones.
  // Only the doorway is the thing to tap: the mound is scenery, so a tap on
  // the sky above it is still a flap.
  const burrow = pickable(new THREE.Group(), 'burrow', STOPS.burrow.x);
  const bx = STOPS.burrow.x;
  const mound = new THREE.Group();
  mound.add(kit.mesh(blob([[bx - 4.2, -0.3], [bx - 3.2, 1.6], [bx - 1, 2.8], [bx + 1.6, 2.7], [bx + 3.6, 1.4], [bx + 4.4, -0.3]], 48), C.mound, { z: 0, layer: -1.4 }));
  mound.add(kit.mesh(blob([[bx - 2.6, 2.0], [bx - 0.8, 2.75], [bx + 1.4, 2.66], [bx + 2.6, 2.0], [bx + 0.4, 2.3]], 36), C.moundTop, { z: 0.01, layer: -1.4 }));
  mound.position.z = -1.42;
  stage.add(mound);
  for (const [dx, dy, r] of [[-1.05, 0.2, 0.28], [-0.95, 0.72, 0.24], [-0.55, 1.12, 0.22], [0.1, 1.28, 0.24], [0.7, 1.08, 0.22], [1.05, 0.66, 0.25], [1.1, 0.18, 0.27]]) {
    burrow.add(kit.mesh(ellipse(bx + dx, dy, r, r * 0.8), C.stone, { z: 0.02, layer: -1.4 }));
  }
  // The door on a pivot at its middle, so it can breathe in place.
  const door = new THREE.Group();
  door.position.set(bx, 0.5, 0.03);
  const doorMesh = kit.mesh(blob([[-0.85, -0.5], [-0.8, 0.2], [0, 0.62], [0.8, 0.2], [0.85, -0.5]], 40), C.door, { layer: -1.4 });
  door.add(doorMesh);
  burrow.add(door);
  burrow.position.z = -1.4;
  stage.add(burrow);

  // The dandelion clocks: five, for counting. A stem, a white puff, seeds
  // drawn in it as little dark dots in a ring.
  const dandelions = STOPS.dandelions.map(({ x }, i) => {
    const g = pickable(new THREE.Group(), `dandelion-${i}`, x);
    const h = 1.05 + (i % 3) * 0.17;
    const y = groundY(x);
    g.add(kit.mesh(poly([[-0.025, 0], [0.025, 0], [0.035, h], [-0.015, h]]), C.stem, { layer: 0 }));
    g.add(kit.mesh(blob([[0, 0.25], [0.28, 0.42], [0.1, 0.3]], 12), C.stem, { z: 0.005, layer: 0 }));
    const head = new THREE.Group();
    head.position.set(0.01, h + 0.2, 0.01);
    head.add(kit.mesh(ellipse(0, 0, 0.27), C.clock, { layer: 0 }));
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      head.add(kit.mesh(ellipse(Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0.025), 0xb9b49c, { z: 0.01, layer: 0 }));
    }
    head.add(kit.mesh(ellipse(0, 0, 0.05), 0x9c9a78, { z: 0.02, layer: 0 }));
    mergeStatic(head);
    g.add(head);
    // A bud for after: the green nub the clock leaves behind.
    const nub = kit.mesh(ellipse(0.01, h + 0.04, 0.06, 0.07), C.stem, { z: 0.02, layer: 0 });
    nub.visible = false;
    g.add(nub);
    pad(g, 0, h * 0.6, 0.45, h * 0.75);
    g.position.set(x, y, -0.35);
    g.userData.head = head;
    g.userData.nub = nub;
    stage.add(g);
    return g;
  });
  // Yellow dandelions among them, just for colour.
  for (const x of [-6.3, -2.8, 0.6, 3.6, 7, 10]) {
    const y = groundY(x);
    stage.add(kit.mesh(poly([[x - 0.02, y], [x + 0.02, y], [x + 0.02, y + 0.55], [x - 0.02, y + 0.55]]), C.stem, { z: -0.36, layer: 0 }));
    stage.add(kit.mesh(ellipse(x, y + 0.6, 0.14, 0.11), C.dandelion, { z: -0.35, layer: 0 }));
  }
  // May's burrow in the bank: rabbits dig them too.
  stage.add(kit.mesh(ellipse(STOPS.may.x + 2.1, groundY(STOPS.may.x + 2.1) + 0.3, 0.42, 0.34), C.door, { z: -1.2, layer: -1.2 }));
  stage.add(kit.mesh(blob([[STOPS.may.x + 0.4, -0.3], [STOPS.may.x + 1.6, 1.3], [STOPS.may.x + 3.6, 0.9], [STOPS.may.x + 4.6, -0.3]], 30), C.mound, { z: -1.25, layer: -1.2 }));

  // The eggshell at the top of the slide: half a shell, a zig-zag rim.
  const egg = pickable(new THREE.Group(), 'egg', STOPS.egg.x);
  const rim = [];
  for (let k = 0; k <= 8; k++) rim.push([-0.34 + k * 0.085, 0.3 + (k % 2 ? -0.07 : 0.05)]);
  egg.add(kit.mesh(blob([[-0.36, 0.26], [-0.3, 0.06], [0, -0.02], [0.3, 0.06], [0.36, 0.26], [0, 0.18]], 30), 0xf2efe6, { layer: 0 }));
  egg.add(kit.mesh(poly([[-0.36, 0.26], ...rim, [0.36, 0.26], [0.3, 0.06], [0, -0.02], [-0.3, 0.06]]), 0xf6f3ec, { z: 0.01, layer: 0 }));
  egg.add(kit.mesh(ellipse(-0.08, 0.1, 0.06, 0.04), 0x8e8a80, { z: 0.02, layer: 0 }));
  pad(egg, 0, 0.2, 0.6, 0.45);
  egg.position.set(STOPS.egg.x, TOP, 0.35);
  egg.userData.home = egg.position.clone();
  stage.add(egg);
  // Baba's piece, smaller: he rides it too.
  const babaEgg = new THREE.Group();
  babaEgg.add(kit.mesh(poly([[-0.24, 0.2], ...rim.map(([x, y]) => [x * 0.7, y * 0.7]), [0.24, 0.2], [0.2, 0.04], [0, -0.02], [-0.2, 0.04]]), 0xf6f3ec, { layer: 0 }));
  babaEgg.visible = false;
  babaEgg.userData.live = true;
  babaEgg.position.z = 0.33;
  stage.add(babaEgg);

  // The sea at the foot of the beach, fish under it.
  const sea = new THREE.Group();
  const wave = (x) => SURFACE + 0.05 * Math.sin(x * 2.2);
  // Water is what lies between the waves and the sea floor, so it meets the
  // sand where the sand goes under, the way a beach does.
  // Every stretch between x0 and x1 where the ground is under `top` becomes
  // one shape (the sea is split by Silky's rock; the pond and pools are their
  // own), so water never covers a rock that stands up out of it.
  const water = (top, x0 = SEA_X - 1, x1 = 81) => {
    const shapes = [];
    let run = [];
    const close = () => {
      if (run.length > 1) shapes.push(poly([...run.map((x) => [x, top(x)]), ...run.slice().reverse().map((x) => [x, groundY(x)])]));
      run = [];
    };
    for (let x = x0; x <= x1; x += 0.2) { if (groundY(x) < top(x)) run.push(x); else close(); }
    close();
    return shapes;
  };
  sea.add(kit.mesh(water((x) => wave(x) + 0.06), C.crest, { z: -0.01, layer: 0.8 }));
  sea.add(kit.mesh(water(wave), C.sea, { layer: 0.8 }));
  sea.add(kit.mesh(water((x) => wave(x) - 0.9), C.seaDeep, { z: 0.01, layer: 0.8 }));
  sea.add(kit.mesh(water((x) => wave(x) - 2.1), 0x5f8f90, { z: 0.012, layer: 0.8 }));
  // Rocks and seaweed on the sea floor. The weed sways (game.js), each strand
  // on a pivot at its root.
  const rw = paint.rng(57);
  const deepSea = (x) => x < 80 && groundY(x) < SURFACE - 1.2;
  for (let x = SEA_X + 5; x < 80; x += 2.2 + rw() * 2.5) {
    if (!deepSea(x)) continue;
    const y = groundY(x);
    sea.add(kit.mesh(blob([[x - 0.7, y - 0.06], [x - 0.5, y + 0.3], [x + 0.1, y + 0.45], [x + 0.6, y + 0.2], [x + 0.7, y - 0.06]], 20), rw() < 0.5 ? 0x7f8a86 : 0x8c948c, { z: 0.03, layer: 0.8 }));
  }
  const weed = [];
  for (let x = SEA_X + 3.5; x < 80; x += 0.9 + rw() * 1.6) {
    if (!deepSea(x)) continue;
    const g = new THREE.Group();
    const h = 0.9 + rw() * 1.4, hex = rw() < 0.5 ? 0x5d8a4c : 0x7a9a4a;
    g.add(kit.mesh(blob([[-0.06, 0], [0.06, 0], [0.12, h * 0.35], [0.02, h * 0.7], [0.08, h], [-0.04, h * 0.7], [-0.08, h * 0.35]], 24), hex, { layer: 0.8 }));
    g.position.set(x, groundY(x) - 0.05, 0.05 + rw() * 0.02);
    g.userData.live = true;
    g.userData.ph = rw() * 6;
    sea.add(g);
    weed.push(g);
  }
  // A kelp forest: tall ribbons from the sea floor almost to the top,
  // swaying (game.js), the fish swimming among them.
  const kelp = [];
  for (let x = 51; x < 64.5; x += 0.6 + rw() * 0.7) {
    const g = new THREE.Group();
    const floor = groundY(x), h = SURFACE - floor - 0.2 - rw() * 0.6;
    const hex = rw() < 0.5 ? 0x7d6f33 : 0x8f7f3c;
    g.add(kit.mesh(poly([[-0.03, 0], [0.03, 0], [0.04, h], [-0.02, h]]), hex, { layer: 0.8 }));
    for (let k = 1; k < 6; k++) {
      const y = h * k / 6, side = k % 2 ? 1 : -1;
      g.add(kit.mesh(blob([[0, y], [side * 0.28, y + 0.22], [side * 0.34, y + 0.5], [side * 0.08, y + 0.3]], 14), hex, { z: 0.001, layer: 0.8 }));
    }
    g.position.set(x, floor - 0.05, 0.04);
    mergeStatic(g);                 // one ribbon, one draw
    g.userData = { live: true, ph: rw() * 6 };
    sea.add(g);
    kelp.push(g);
  }
  // Moon jellies, drifting and pulsing, see-through.
  const jellies = [0, 1, 2, 3].map((i) => {
    const j = makeJelly(kit);
    const x = 45 + i * 4.7, y = SURFACE - 1.1 - (i % 2) * 0.9;
    j.root.position.set(x, y, 0.05);
    j.root.userData = { live: true, x0: x, y0: y, ph: i * 1.7 };
    sea.add(j.root);
    return j;
  });

  // Little silver fish, in twos and threes, all the way out.
  const fish = [];
  const rfi = paint.rng(61);
  for (let i = 0; i < 20; i++) {
    const f = kit.mesh(blob([[-0.3, 0], [0, 0.07], [0.3, 0], [0, -0.06]], 16), 0xd3ded8, { z: 0.08, layer: 0.8 });
    f.add(kit.mesh(poly([[-0.28, 0], [-0.42, 0.08], [-0.42, -0.08]]), 0xd3ded8, { layer: 0.8 }));
    const school = Math.floor(i / 3);
    // Five schools out to Silky's rock, and two more past it.
    const x = school < 5 ? SEA_X + 5 + school * 4.6 + rfi() * 1.2 : 74.5 + (school - 5) * 3 + rfi() * 1.2;
    const floor = groundY(x);
    const y = floor + 0.6 + rfi() * (SURFACE - floor - 1.2);
    f.position.set(x, y, 0.08);
    f.userData = { x0: x, y0: y, live: true, ph: rfi() * 6, dx: 0, dy: 0 };
    sea.add(f);
    fish.push(f);
  }
  // Bubbles, pooled: game.js lets them go from her beak as she swims.
  const bubbles = [];
  for (let i = 0; i < 30; i++) {
    const b = kit.mesh(ellipse(0, 0, 0.05), 0xe6f2ee, { layer: 0.8, plain: true, opacity: 0.8 });
    b.position.z = 0.22;
    b.visible = false;
    b.userData.live = true;
    sea.add(b);
    bubbles.push(b);
  }
  // A skin of water IN FRONT, faint: whoever is under the sea is seen
  // through it, tinted the colour of the sea.
  sea.add(kit.mesh(water(wave), C.sea, { z: 0.35, layer: 0.8, opacity: 0.22 }));
  sea.position.z = 0.8;
  world.add(sea);
  // Shells and a starfish on the sand.
  for (const [x, hex] of [[38.2, 0xf1e6da], [39.6, 0xe9b89c], [41.2, 0xf1e6da]]) {
    stage.add(kit.mesh(blob([[x - 0.14, BEACH], [x, BEACH + 0.14], [x + 0.14, BEACH]], 12), hex, { z: 0.1, layer: 0 }));
  }

  // ---- in front ---------------------------------------------------------------
  const front = layer(3);
  const rf = paint.rng(31);
  for (let x = WOOD_X; x < X_MAX + 14; x += 3 + rf() * 4) {
    const y = groundY(x) - 1.9 - rf() * 0.5;
    if (x > SEA_X - 1) break;              // out at sea: nothing stands in front
    const onSand = x > SLIDE.x0;
    if (onSand) {
      // Marram grass on the dunes: pale, thin, leaning in the sea wind.
      for (let k = 0; k < 6; k++) {
        const bxk = x + (k - 2.5) * 0.14, h = 0.7 + rf() * 0.6;
        front.add(kit.mesh(poly([[bxk - 0.05, y - 0.5], [bxk + 0.05, y - 0.5], [bxk + 0.25 + (k - 2.5) * 0.08, y + h]]), k % 2 ? 0xb9b57a : 0xa3a868, { z: k * 0.001, layer: 3 }));
      }
      continue;
    }
    for (let k = 0; k < 7; k++) {
      const bxk = x + (k - 3) * 0.12, h = 0.6 + rf() * 0.7;
      front.add(kit.mesh(poly([[bxk - 0.07, y - 0.5], [bxk + 0.07, y - 0.5], [bxk + (k - 3) * 0.1, y + h]]), k % 2 ? 0x809a3c : 0x6e8a34, { z: k * 0.001, layer: 3 }));
    }
    if (rf() < 0.6) front.add(kit.mesh(ellipse(x + 0.3, y + 0.55, 0.16, 0.14), C.thrift, { z: 0.01, layer: 3 }));
  }

  const wood = buildWood(kit, { layer, stage, front });
  const west = buildWest(kit, { layer, stage, front, bandShape, water });
  const east = buildEast(kit, { stage, front, bandShape, water });
  const dunes = buildDunes(kit, { stage, front, bandShape, water, parent: world });

  // ---- the cast ----------------------------------------------------------------
  const cast = {
    oona: makePuffin(kit, 'oona'),
    baba: makeBaba(kit),
    mama: makePuffin(kit, 'mama', 1.15),
    papa: makePuffin(kit, 'papa', 1.22),
    may: makeMay(kit),
    mossy: makeMossy(kit),
  };
  const place = (c, x, z, facing = 1) => { c.root.userData.live = true; c.root.position.set(x, groundY(x), z); c.flip = facing; c.root.scale.x = facing; stage.add(c.root); };
  place(cast.mama, STOPS.mama.x, -0.6, 1);
  place(cast.papa, STOPS.papa.x, -0.6, -1);
  place(cast.may, STOPS.may.x + 0.5, -0.5, -1);
  place(cast.mossy, STOPS.mossy.x, -0.1, 1);
  place(cast.baba, STOPS.burrow.x - 1.2, 0.05, 1);
  place(cast.oona, STOPS.burrow.x, 0.1, 1);
  // Marvin floats at the foot of his slide; Bernie on the sand; the ewe and
  // her lamb grazing up on the meadow bank.
  cast.marvin = makeOtter(kit);
  cast.bernie = makeBernie(kit);
  cast.sheep = makeSheep(kit);
  cast.lamb = makeSheep(kit, true);
  place(cast.marvin, STOPS.marvin.x, 0.1, -1);
  cast.marvin.root.position.y = POND - 0.25;
  place(cast.bernie, STOPS.bernie.x, -0.05, -1);
  place(cast.sheep, STOPS.sheep.x, -3.2, -1);
  cast.sheep.root.position.y = 0.85 + 0.45 * Math.sin(STOPS.sheep.x * 0.31) + 0.25 * Math.sin(STOPS.sheep.x * 0.77 + 1) - 0.15;
  place(cast.lamb, STOPS.sheep.x - 1.5, -3.0, 1);
  cast.lamb.root.position.y = cast.sheep.root.position.y - 0.05;
  // Out west and east: the frog on his lily pad, Silky on her rock, the crab
  // between the pools; seabirds on the cliff ledges and in the wind.
  cast.frog = makeFrog(kit);
  cast.silky = makeSilky(kit);
  cast.crab = makeCrab(kit);
  place(cast.frog, STOPS.frog.x, 0.9, 1);
  cast.frog.root.position.y = POND + 0.1;
  place(cast.silky, STOPS.silky.x, -0.05, -1);
  place(cast.crab, STOPS.crab.x, -0.05, 1);
  const gannets = [0, 1, 2].map((i) => {
    const g = makeGannet(kit);
    g.root.userData.live = true;
    g.root.position.set(-97 + i, CLIFF + 3 + i, 0.4 - i * 0.3);
    g.root.userData.ph = i * 2.1;
    stage.add(g.root);
    return g;
  });
  const kittiwakes = [[-102.2, CLIFF - 1.3], [-102.9, CLIFF - 2.5], [-102.4, CLIFF - 2.5], [-103.2, CLIFF - 3.7]].map(([x, y], i) => {
    const k = makeKittiwake(kit);
    k.root.userData.live = true;
    k.root.position.set(x, y, -0.25);
    k.flip = i % 2 ? 1 : -1; k.root.scale.x = k.flip;
    stage.add(k.root);
    return k;
  });
  pad(pickable(cast.mama.root, 'mama', STOPS.mama.x), 0.05, 0.95, 0.75, 1.05);
  pad(pickable(cast.papa.root, 'papa', STOPS.papa.x), 0.05, 0.95, 0.75, 1.05);
  pad(pickable(cast.may.root, 'may', STOPS.may.x), 0, 0.7, 0.75, 0.8);
  pad(pickable(cast.mossy.root, 'mossy', STOPS.mossy.x), 0.05, 0.22, 0.6, 0.45);
  pad(pickable(cast.frog.root, 'frog', STOPS.frog.x), 0.05, 0.2, 0.45, 0.4);
  pad(pickable(cast.silky.root, 'silky', STOPS.silky.x), 0, 0.45, 1.5, 0.7);
  pad(pickable(cast.crab.root, 'crab', STOPS.crab.x), 0, 0.2, 0.5, 0.4);
  pad(pickable(cast.marvin.root, 'marvin', STOPS.marvin.x), 0, 0.35, 1.1, 0.55);
  // Oona herself: tap her and she says something (fun.js).
  pad(pickable(cast.oona.root, 'oona', null), 0.08, 0.75, 0.42, 0.75);
  pad(pickable(cast.bernie.root, 'bernie', STOPS.bernie.x), -0.1, 0.25, 0.55, 0.45);
  pad(pickable(cast.sheep.root, 'sheep', STOPS.sheep.x), 0.1, 0.7, 1.0, 0.75);
  // Baba can be tapped too (to be fed), but he goes where Oona goes, so he
  // has no stop of his own and is not in byName.
  pad(pickable(cast.baba.root, 'baba', null), 0, 0.45, 0.5, 0.55);

  // Seeds for the wind to carry: a pool, reused.
  const seeds = [];
  for (let i = 0; i < 50; i++) {
    const s = new THREE.Group();
    s.add(kit.mesh(poly([[-0.006, -0.12], [0.006, -0.12], [0.006, 0], [-0.006, 0]]), 0xa8a48a, { layer: 0, plain: true }));
    s.add(kit.mesh(ellipse(0, 0.03, 0.07, 0.05), 0xfbfaf4, { z: 0.002, layer: 0, plain: true }));
    s.visible = false;
    s.userData.live = true;
    s.position.z = 0.5;
    stage.add(s);
    seeds.push(s);
  }

  const things = [...dunes.digs, burrow, ...dandelions, ...wood.mushrooms, cast.frog.root, cast.silky.root, cast.crab.root, east.anemone, east.blowhole, cast.marvin.root, cast.bernie.root, cast.sheep.root, cast.mama.root, cast.papa.root, cast.may.root, cast.mossy.root, egg];
  // Every layer, the wood's included: whatever is not live is glued.
  for (const g of world.children) if (g.isGroup) mergeStatic(g);
  // May's hole in the bank is a way in too: down into the tunnels at their
  // far end. (Its own tap target, over the dark of the hole.)
  const warren = new THREE.Group();
  warren.userData = { pick: 'warren', stop: UNDER.warren };
  const wy = groundY(UNDER.warren) + 0.3;
  const wm = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(UNDER.warren, wy, 0.6, 0.5), 14), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  warren.add(wm);
  warren.position.z = -1.15;
  stage.add(warren);
  things.push(warren);
  // May's brothers and sisters, down in their holes until someone pops out
  // of the warren; then up they come to say hello.
  const rabbits = [[UNDER.warren - 1.1, 0x9a8f84], [UNDER.warren + 1.1, 0x6f6660], [UNDER.warren + 2.3, 0xa0765a]].map(([x, fur], i) => {
    const c = makeRabbit(kit, fur);
    c.root.userData.live = true;
    c.root.userData.x = x;
    c.rig.scale.setScalar(0.8);
    c.flip = i === 0 ? 1 : -1; c.root.scale.x = c.flip;
    c.root.position.set(x, groundY(x) - 1.4, -1.0);
    c.root.visible = false;
    stage.add(c.root);
    return c;
  });

  // UNDER PUFFIN ROCK: the tunnels, far below; the hedgehog asleep in them.
  const under = buildUnder(kit);
  world.add(under.group);
  const hedgehog = makeHedgehog(kit);
  hedgehog.root.userData.live = true;
  hedgehog.root.position.set(UNDER.hedgehog, tunnelFloor(UNDER.hedgehog), -0.3);
  hedgehog.root.userData.pick = 'hedgehog';
  hedgehog.root.userData.stop = UNDER.hedgehog;
  pad(hedgehog.root, 0.05, 0.25, 0.75, 0.5);
  under.group.add(hedgehog.root);
  cast.hedgehog = hedgehog;
  mergeStatic(under.group);
  hedgehog.root.userData.room = 'main';
  // The wood mouse, in the larder, in the first of its holes.
  const mouse = makeMouse(kit);
  mouse.root.userData = { live: true, pick: 'mouse', stop: PANTRY.mouse[0], room: 'pantry', hole: 0 };
  mouse.root.position.set(PANTRY.mouse[0], pantryFloor(PANTRY.mouse[0]) + 0.05, -1.17);
  pad(mouse.root, 0.05, 0.2, 0.5, 0.4);
  under.group.add(mouse.root);
  cast.mouse = mouse;
  const underThings = [under.up, under.nest, under.worm, under.roots, hedgehog.root, mouse.root, ...under.mouths, ...under.caveMush];
  const underByName = Object.fromEntries(underThings.map((o) => [o.userData.pick, o]));

  // Every friend's still parts glued, too.
  for (const c of [...Object.values(cast), ...rabbits, ...gannets, ...kittiwakes, ...jellies, ...neighbours]) settle(c);
  const byName = Object.fromEntries(things.map((o) => [o.userData.pick, o]));
  things.push(cast.baba.root);
  return { neighbours, dunes, whale, kelp, jellies, byName, underByName, underThings, under, rabbits, warren, world, stage, sky, clouds, fish, weed, bubbles, mushrooms: wood.mushrooms, stars: wood.stars, pads: west.pads, anemone: east.anemone, spout: east.spout, gannets, kittiwakes, burrow, door, dandelions, egg, babaEgg, cast, seeds, things };
}

function smooth01(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }

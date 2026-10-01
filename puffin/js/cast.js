// The friends on Puffin Rock, each a handful of flat shapes stacked front to
// back — the way the show draws them. Everyone is built facing RIGHT with the
// origin at their feet, and turns round by flipping (a paper cut-out turning
// over), so one drawing does both ways.
//
// The show's faces are what make them: a big white face, eyes much too large
// and nearly all pupil, a dark lid along the top of each. A near eye and a
// smaller far eye give the three-quarter look every character in the show
// has. Nothing here has an outline.
//
// Each maker returns a character: { root, rig, wings, eyes, feet, ears, kind }.
// `root` is what is placed and picked; `rig` is what bobs and tilts inside it.
// `animate(c, t, pose)` is the only thing that moves the parts.

import * as THREE from './three.js';
import { blob, ellipse, poly } from './shapes.js';
import { mix as paintMix } from './paint.js';
import { mergeStatic } from './shapes.js';

// The gap between one paper layer and the next. THIN, so that a whole
// character is only a few hundredths deep: anything placed in front of her
// (the great tree's trunk, a pad) is in front of ALL of her, never between
// her body and her beak. Still far wider than the depth buffer can resolve
// at the camera's distance.
const DZ = 0.002;

// Lay shapes into a group front-to-back in the order given.
function stack(kit, group, items, z0 = 0) {
  let z = z0;
  for (const [shape, hex] of items) {
    group.add(kit.mesh(shape, hex, { z, layer: 0 }));
    z += DZ;
  }
  return z;
}

// One eye, the show's way. Not a ring round a dot: a white eye almost filled
// by a huge dark pupil, a sliver of coloured iris showing behind it, a glint,
// and a dark LID along the top — drawn as a dark oval just behind the white
// and nudged up, so only its top edge shows, thick in the middle and thin at
// the corners. Behind it all, for the puffins, the pale grey patch that real
// puffins have round the eye. `look` pushes the pupil toward where they face;
// `squash` narrows the far eye, which is turned a little away.
function eye(kit, x, y, r, { iris = 0x7fbfc4, white = 0xfbfbf6, lid = 0x26303a, lash = false, patch = null, squash = 1, look = 0.22, pupil = 0.66 } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, 0);
  const rx = r * 0.88 * squash, ry = r;
  const items = [];
  if (patch) items.push([blob([[-rx * 1.5, -ry * 0.1], [-rx * 0.6, ry * 1.1], [rx * 1.1, ry * 1.05], [rx * 1.35, -ry * 0.4], [rx * 0.2, -ry * 1.35], [-rx * 1.1, -ry * 1.05]], 30), patch]);
  items.push(
    [ellipse(0, ry * 0.1, rx * 1.1, ry * 1.06), lid],
    [ellipse(0, 0, rx, ry), white],
    [ellipse(rx * (look - 0.1), -ry * 0.02, rx * 0.74, ry * 0.76), iris],
    [ellipse(rx * look, ry * 0.02, rx * pupil, ry * pupil * 1.02), 0x15191e],
    [ellipse(rx * (look + 0.28), ry * 0.3, r * 0.15), 0xffffff],
  );
  if (lash) items.push([poly([[-rx * 0.75, ry * 0.72], [-rx * 1.35, ry * 1.2], [-rx * 1.05, ry * 0.5]]), lid]);
  stack(kit, g, items);
  return g;
}

function pivot(x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  return g;
}

function character(kind, height) {
  const root = new THREE.Group();
  const rig = new THREE.Group();
  root.add(rig);
  root.userData = { kind, height };
  return { root, rig, wings: [], eyes: [], feet: [], ears: [], kind, height, flip: 1, seed: kind.length * 0.37 };
}

// ---- puffins ----------------------------------------------------------------

const PALETTES = {
  oona: { back: 0x55758d, wing: 0x46627a, face: 0xf7f6f0, patch: 0xd3dde0, beak: 0xf2762c, tip: 0xf2762c, band: 0x7d95aa, stripe: 0xf5c84e, feet: 0xf2883a, iris: 0x7fc3c6, lash: true },
  mama: { back: 0x2e3947, wing: 0x252f3b, face: 0xf5f4ee, patch: 0xc9d1d6, beak: 0xf08a34, tip: 0xe0493a, band: 0x8796a6, stripe: 0xf5c84e, feet: 0xf06c2c, iris: 0x8bb8c4, lash: true },
  papa: { back: 0x28323e, wing: 0x202833, face: 0xf5f4ee, patch: 0xc9d1d6, beak: 0xf08a34, tip: 0xdc4234, band: 0x8796a6, stripe: 0xf5c84e, feet: 0xf06c2c, iris: 0x8bb0bc, lash: false },
};

// A puffin, the show's shape: a great wide bean of a head, bigger than the
// body under it, nearly all white face inside a thin cap; both eyes up near
// the top; and the BEAK — tall and narrow, not long: a wedge standing on the
// front of the face, taller than it sticks out, with a grey band and a thin
// yellow stripe down its root and a tiny smile tucked under it.
export function makePuffin(kit, who = 'oona', scale = 1) {
  const p = PALETTES[who];
  const c = character(who, 1.5 * scale);
  c.rig.scale.setScalar(scale);

  // Feet first: they sit behind the body.
  for (const fx of [-0.12, 0.12]) {
    const f = pivot(fx, 0.045, -0.004);
    f.add(kit.mesh(blob([[-0.12, -0.04], [0.16, -0.04], [0.19, 0.02], [0.02, 0.06], [-0.12, 0.03]], 16), p.feet, { layer: 0 }));
    c.rig.add(f);
    c.feet.push(f);
  }
  const body = new THREE.Group();
  c.rig.add(body);
  let z = stack(kit, body, [
    [poly([[-0.34, 0.3], [-0.58, 0.18], [-0.32, 0.12]]), p.wing],                                                   // tail
    [blob([[-0.38, 0.32], [-0.3, 0.09], [-0.05, 0.02], [0.2, 0.05], [0.36, 0.2], [0.4, 0.46], [0.32, 0.74], [0, 0.84], [-0.3, 0.76], [-0.42, 0.52]]), p.back],
    [blob([[-0.02, 0.08], [0.22, 0.11], [0.34, 0.36], [0.3, 0.64], [0.06, 0.72], [-0.12, 0.42]]), p.face],          // belly
    [blob([[-0.46, 1.02], [-0.36, 1.33], [0.04, 1.5], [0.44, 1.42], [0.6, 1.1], [0.48, 0.76], [0.1, 0.66], [-0.32, 0.74]], 56), p.back],  // head: the cap
    [blob([[-0.34, 1.02], [-0.25, 1.28], [0.06, 1.41], [0.4, 1.34], [0.52, 1.08], [0.42, 0.8], [0.1, 0.72], [-0.24, 0.8]], 56), p.face],   // face
  ]);
  // Eyes up near the cap: the near one big, the far one smaller and turned
  // away, and the beak stands in front of the far one's inner corner.
  const near = eye(kit, 0.02, 1.14, 0.16, { iris: p.iris, lash: p.lash, patch: p.patch });
  near.position.z = z;
  const far = eye(kit, 0.3, 1.16, 0.12, { iris: p.iris, lash: false, patch: p.patch, squash: 0.8 });
  far.position.z = z + DZ * 6;
  body.add(near, far);
  c.eyes.push(near, far);
  z += DZ * 12;
  stack(kit, body, [
    // The whole beak in its tip colour, then the root half over it in the
    // beak colour: grown-ups' beaks are red at the front, Oona's is orange.
    [blob([[0.41, 1.3], [0.52, 1.28], [0.68, 1.08], [0.7, 0.98], [0.56, 0.84], [0.43, 0.8], [0.45, 1.05]], 44), p.tip],
    [blob([[0.41, 1.3], [0.52, 1.28], [0.6, 1.1], [0.6, 0.96], [0.52, 0.85], [0.43, 0.8], [0.45, 1.05]], 40), p.beak],
    // Down the root, following its curve: a grey band, a thin yellow line.
    [poly([[0.385, 1.3], [0.43, 1.3], [0.45, 1.16], [0.455, 1.0], [0.445, 0.84], [0.42, 0.8], [0.39, 0.82], [0.405, 1.0], [0.4, 1.16]]), p.band],
    [poly([[0.43, 1.3], [0.45, 1.295], [0.47, 1.16], [0.475, 1.0], [0.465, 0.84], [0.445, 0.84], [0.455, 1.0], [0.45, 1.16]]), p.stripe],
    [blob([[0.3, 0.86], [0.36, 0.83], [0.41, 0.84], [0.36, 0.85]], 12), 0xe0763a],                                 // the smile
  ], z);
  // Fish in the beak, hanging crosswise the way a real puffin carries them —
  // up to ten, the first nearest the tip. `c.carry(n)` shows n of them.
  const catchG = new THREE.Group();
  catchG.position.z = z + DZ * 8;
  catchG.userData.live = true;
  const beakFish = [];
  for (let i = 0; i < 10; i++) {
    const f = new THREE.Group();
    f.add(kit.mesh(blob([[0, 0.2], [0.045, 0], [0, -0.2], [-0.045, 0]], 12), 0xdfe9e4, { layer: 0 }));
    f.add(kit.mesh(poly([[0, -0.18], [0.06, -0.27], [-0.06, -0.27]]), 0xdfe9e4, { layer: 0 }));
    f.position.set(0.68 - i * 0.034, 0.88 - i * 0.014, i * 0.001);
    f.rotation.z = 0.15 - i * 0.03;
    f.visible = false;
    catchG.add(f);
    beakFish.push(f);
  }
  body.add(catchG);
  c.carry = (n) => beakFish.forEach((f, i) => { f.visible = i < n; });
  // The wing, on a shoulder pivot so it can beat.
  const wing = pivot(-0.1, 0.66, z + DZ * 6);
  wing.add(kit.mesh(blob([[0, 0.02], [0.12, -0.08], [0.06, -0.42], [-0.12, -0.52], [-0.22, -0.28], [-0.12, -0.04]]), p.wing, { layer: 0 }));
  body.add(wing);
  c.wings.push(wing);
  return c;
}

// Baba: a white teardrop of fluff on two thin grey legs — round on top, a
// little point at the tail — with enormous dark eyes rimmed gold underneath,
// a spike of down over each, and a small grey-violet beak pointing DOWN
// between them.
export function makeBaba(kit) {
  const c = character('baba', 0.95);
  const leg = 0x5d5f6e;
  for (const fx of [-0.08, 0.1]) {
    const f = pivot(fx, 0, -0.004);
    f.add(kit.mesh(poly([[-0.018, 0.02], [0.018, 0.02], [0.018, 0.16], [-0.018, 0.16]]), leg, { layer: 0 }));
    f.add(kit.mesh(blob([[-0.05, 0], [0.09, 0], [0.1, 0.025], [0.0, 0.035]], 10), leg, { z: 0.001, layer: 0 }));
    c.rig.add(f);
    c.feet.push(f);
  }
  const fluff = 0xf3f2ee;
  let z = stack(kit, c.rig, [
    [blob([[-0.5, 0.34], [-0.28, 0.2], [-0.06, 0.12], [0.2, 0.13], [0.36, 0.3], [0.38, 0.6], [0.24, 0.84], [0, 0.92], [-0.2, 0.84], [-0.3, 0.6], [-0.36, 0.42]], 56), fluff],
    [blob([[-0.22, 0.2], [0.1, 0.13], [0.3, 0.24], [0.1, 0.2]], 20), 0xe2e3e2],       // a shadow of down underneath
  ]);
  const gold = 0xe7a93c;
  const near = eye(kit, 0.02, 0.58, 0.15, { white: gold, iris: 0x15191e, lid: fluff, pupil: 0.8, look: 0.05 });
  near.position.z = z;
  const far = eye(kit, 0.27, 0.59, 0.12, { white: gold, iris: 0x15191e, lid: fluff, pupil: 0.8, look: 0.05, squash: 0.85 });
  far.position.z = z + DZ * 6;
  c.rig.add(near, far);
  c.eyes.push(near, far);
  z += DZ * 12;
  stack(kit, c.rig, [
    [poly([[0.0, 0.73], [0.03, 0.83], [0.05, 0.72]]), 0x2a2d33],                      // tufts of down over the eyes
    [poly([[0.26, 0.72], [0.29, 0.81], [0.3, 0.71]]), 0x2a2d33],
    [blob([[0.12, 0.62], [0.2, 0.6], [0.21, 0.5], [0.16, 0.4], [0.12, 0.5]], 18), 0x857f98],   // beak, pointing down
    [blob([[0.16, 0.6], [0.2, 0.6], [0.205, 0.5], [0.17, 0.44], [0.175, 0.52]], 14), 0x6e6882],
  ], z);
  const wing = pivot(-0.14, 0.5, z + DZ * 2);
  wing.add(kit.mesh(blob([[0, 0.02], [0.08, -0.08], [0.0, -0.24], [-0.12, -0.24], [-0.12, -0.04]]), 0xe4e5e2, { layer: 0 }));
  c.rig.add(wing);
  c.wings.push(wing);
  return c;
}

// May the rabbit: sitting up, long ears, a white puff of tail.
export function makeMay(kit, fur = 0x94897d) {
  const c = character('may', 1.5);
  const cream = 0xede6da, pink = 0xe9a7a0;
  const shade = paintMix(fur, 0x000000, 0.1);
  const earBack = pivot(0.14, 1.0, 0);
  earBack.add(kit.mesh(blob([[-0.07, 0], [0.07, 0], [0.1, 0.34], [0.02, 0.55], [-0.08, 0.4]]), shade, { layer: 0 }));
  earBack.rotation.z = 0.28;
  c.rig.add(earBack);
  let z = stack(kit, c.rig, [
    [ellipse(-0.54, 0.24, 0.13, 0.12), 0xf6f1e8],                                                     // tail
    [blob([[-0.46, 0.05], [0.2, 0.02], [0.42, 0.22], [0.38, 0.56], [0.12, 0.74], [-0.3, 0.72], [-0.56, 0.42]]), fur],
    [ellipse(-0.2, 0.26, 0.3, 0.22), shade],                                                           // haunch
    [ellipse(0.2, 0.36, 0.17, 0.25), cream],                                                           // belly
    [ellipse(0.3, 0.05, 0.12, 0.05), cream], [ellipse(0.12, 0.05, 0.12, 0.05), cream],                 // paws
    [ellipse(0.28, 0.84, 0.3, 0.26), fur],                                                             // head
    [ellipse(0.47, 0.77, 0.13, 0.1), cream],                                                           // muzzle
    [ellipse(0.58, 0.81, 0.04, 0.035), pink],                                                          // nose
  ], 0.004);
  const e = eye(kit, 0.36, 0.89, 0.085, { iris: 0x7a5232, lid: 0x5e412a, look: 0.25, pupil: 0.6 });
  e.position.z = z;
  c.rig.add(e);
  c.eyes.push(e);
  const ear = pivot(0.22, 1.02, z + DZ * 5);
  ear.add(kit.mesh(blob([[-0.07, 0], [0.07, 0], [0.1, 0.34], [0.02, 0.56], [-0.08, 0.4]]), fur, { layer: 0 }));
  const inner = kit.mesh(blob([[-0.03, 0.04], [0.04, 0.04], [0.05, 0.32], [0.01, 0.46], [-0.04, 0.34]]), pink, { layer: 0 });
  inner.position.z = DZ;
  ear.add(inner);
  ear.rotation.z = -0.12;
  c.rig.add(ear);
  c.ears.push(ear, earBack);
  return c;
}

// Mossy the pygmy shrew: tiny, brown, a pointed twitchy nose, one round ear.
export function makeMossy(kit) {
  const c = character('mossy', 0.46);
  const fur = 0xb06b3a;
  for (const fx of [-0.12, 0.12]) {
    const f = pivot(fx, 0.025, -0.004);
    f.add(kit.mesh(ellipse(0.02, 0, 0.06, 0.03), 0xe3a88c, { layer: 0 }));
    c.rig.add(f);
    c.feet.push(f);
  }
  let z = stack(kit, c.rig, [
    [poly([[-0.2, 0.14], [-0.5, 0.1], [-0.52, 0.08], [-0.2, 0.1]]), 0x94572e],                         // tail
    [ellipse(0, 0.18, 0.27, 0.16), fur],
    [ellipse(0.06, 0.12, 0.18, 0.08), 0xefd3aa],
    [blob([[0.1, 0.32], [0.3, 0.32], [0.54, 0.2], [0.32, 0.1], [0.12, 0.12]], 30), fur],
    [ellipse(0.545, 0.2, 0.03), 0x3a2a24],
    [ellipse(0.13, 0.35, 0.08), fur],
    [ellipse(0.13, 0.35, 0.05), 0xe8ae90],
  ], 0.004);
  const e = eye(kit, 0.29, 0.245, 0.065, { iris: 0x7a4a26, lid: 0x6e3f20, look: 0.25, pupil: 0.62 });
  e.position.z = z;
  c.rig.add(e);
  c.eyes.push(e);
  // Whiskers are his nose's job: the nose is an "ear" to animate, a twitch.
  return c;
}

// Silky the seal: a long soft grey body lying along her rock, darker along
// the back and dappled, a round head with big dark eyes, a dark nose and
// whiskers, a front flipper, and the tail flippers behind. Facing right.
export function makeSilky(kit) {
  const c = character('silky', 0.95);
  const back = 0x958d80, side = 0xb3ab9c, belly = 0xe0dbcf, dark = 0x4a443c;
  let z = stack(kit, c.rig, [
    [blob([[-1.25, 0.28], [-1.55, 0.5], [-1.45, 0.2], [-1.6, -0.02], [-1.15, 0.12]], 20), back],                        // tail flippers
    [blob([[-1.2, 0.2], [-0.8, 0.02], [0.2, 0.0], [0.72, 0.14], [0.86, 0.46], [0.6, 0.66], [0.0, 0.62], [-0.7, 0.5], [-1.15, 0.36]], 48), side],
    [blob([[-1.1, 0.34], [-0.6, 0.52], [0.1, 0.6], [0.6, 0.64], [0.2, 0.5], [-0.5, 0.42]], 30), back],                   // the darker back
    [blob([[-0.8, 0.06], [0.2, 0.02], [0.66, 0.16], [0.2, 0.18], [-0.5, 0.14]], 24), belly],
    [ellipse(-0.5, 0.42, 0.06, 0.04), dark], [ellipse(-0.2, 0.5, 0.05, 0.035), dark], [ellipse(0.12, 0.44, 0.05, 0.04), dark], [ellipse(-0.8, 0.36, 0.045, 0.03), dark],
    [ellipse(0.78, 0.66, 0.34, 0.3), side],                                                                                   // head
    [ellipse(0.98, 0.58, 0.16, 0.13), belly],                                                                                 // muzzle
    [ellipse(1.1, 0.63, 0.05, 0.04), dark],                                                                                   // nose
    [poly([[0.98, 0.56], [1.28, 0.6], [1.28, 0.585], [0.98, 0.55]]), dark], [poly([[0.98, 0.53], [1.26, 0.5], [1.26, 0.485], [0.98, 0.52]]), dark],
  ], 0.004);
  for (const [x, y, r, sq] of [[0.72, 0.74, 0.11, 1], [0.93, 0.75, 0.085, 0.8]]) {
    const e = eye(kit, x, y, r, { iris: 0x4a3a30, lid: 0x6e675c, look: 0.25, pupil: 0.72, squash: sq });
    e.position.z = z; z += DZ * 6;
    c.rig.add(e); c.eyes.push(e);
  }
  const flipper = pivot(0.25, 0.22, z);
  flipper.add(kit.mesh(blob([[0, 0.04], [0.1, -0.02], [0.02, -0.26], [-0.16, -0.3], [-0.12, -0.04]], 18), back, { layer: 0 }));
  c.rig.add(flipper);
  c.wings.push(flipper);
  return c;
}

// A little green frog, sitting, with the show's big eyes up on top.
export function makeFrog(kit) {
  const c = character('frog', 0.45);
  const green = 0x7aa844, deep = 0x5f8a36, pale = 0xd9e6a8;
  let z = stack(kit, c.rig, [
    [blob([[-0.3, 0.02], [-0.34, 0.14], [-0.12, 0.1], [-0.1, 0.02]], 14), deep],                  // back foot
    [blob([[-0.28, 0.08], [-0.18, 0.28], [0.1, 0.34], [0.3, 0.24], [0.3, 0.06], [0, 0.02]], 30), green],
    [blob([[-0.02, 0.06], [0.24, 0.08], [0.26, 0.2], [0.04, 0.18]], 16), pale],                   // throat
    [blob([[0.12, 0.02], [0.26, 0.02], [0.24, 0.06], [0.14, 0.06]], 10), deep],                    // front foot
    [ellipse(0.02, 0.33, 0.1, 0.09), green], [ellipse(0.2, 0.33, 0.09, 0.08), green],             // eye bumps
    [poly([[0.14, 0.18], [0.3, 0.16], [0.3, 0.155], [0.14, 0.17]]), 0x3d5a2a],                     // the smile
  ], 0.004);
  for (const [x, r, sq] of [[0.02, 0.07, 1], [0.2, 0.06, 0.85]]) {
    const e = eye(kit, x, 0.34, r, { iris: 0xb89a3a, lid: deep, look: 0.2, pupil: 0.62, squash: sq });
    e.position.z = z; z += DZ * 6;
    c.rig.add(e); c.eyes.push(e);
  }
  return c;
}

// A shore crab: a wide orange-red shell, two claws held up, legs out to the
// sides, and eyes on stalks.
export function makeCrab(kit) {
  const c = character('crab', 0.4);
  const red = 0xdf6a3c, deep = 0xb94f2c;
  const legs = [];
  for (const [x, a] of [[-0.18, -0.5], [-0.26, -0.8], [0.18, 0.5], [0.26, 0.8]]) legs.push([poly([[x, 0.12], [x + Math.sin(a) * 0.22, 0.0], [x + Math.sin(a) * 0.22 + 0.02, 0.0], [x + 0.02, 0.12]]), deep]);
  let z = stack(kit, c.rig, [
    ...legs,
    [poly([[-0.06, 0.24], [-0.07, 0.36], [-0.05, 0.36], [-0.04, 0.24]]), deep], [poly([[0.06, 0.24], [0.07, 0.36], [0.05, 0.36], [0.04, 0.24]]), deep],
    [blob([[-0.3, 0.12], [-0.2, 0.26], [0.2, 0.26], [0.3, 0.12], [0, 0.07]], 26), red],
  ], 0.004);
  for (const x of [-0.06, 0.06]) { const e = eye(kit, x, 0.37, 0.035, { iris: 0x15191e, lid: deep, pupil: 0.7, look: 0 }); e.position.z = z; z += DZ * 6; c.rig.add(e); c.eyes.push(e); }
  for (const side of [-1, 1]) {
    const claw = pivot(side * 0.3, 0.2, z);
    claw.add(kit.mesh(blob([[0, 0], [side * 0.14, 0.12], [side * 0.2, 0.24], [side * 0.08, 0.2], [side * 0.12, 0.3], [side * 0.02, 0.22]], 18), red, { layer: 0 }));
    c.rig.add(claw);
    c.wings.push(claw);
  }
  return c;
}

// Seabirds for the cliffs. A gannet glides: long white wings tipped black, a
// buttery head, a long pale bill. A kittiwake sits on a ledge: white, soft
// grey wings with black tips, a little yellow bill.
export function makeGannet(kit) {
  const c = character('gannet', 0.5);
  stack(kit, c.rig, [
    [blob([[-0.1, 0.02], [-0.5, 0.2], [-1.0, 0.3], [-0.55, 0.1]], 20), 0xf4f4ef],
    [blob([[-0.95, 0.31], [-1.1, 0.33], [-0.8, 0.22]], 12), 0x22262b],
    [blob([[-0.7, -0.02], [-0.3, 0.06], [0.4, 0.06], [0.62, 0.0], [0.3, -0.07], [-0.4, -0.06]], 30), 0xf7f7f2],
    [ellipse(0.5, 0.03, 0.12, 0.09), 0xf1dfa2],
    [poly([[0.58, 0.04], [0.86, -0.01], [0.58, -0.02]]), 0xb9c4c8],
    [blob([[0.1, 0.02], [-0.3, -0.18], [-0.8, -0.3], [-0.4, -0.08]], 20), 0xecece6],
    [blob([[-0.75, -0.29], [-0.9, -0.33], [-0.62, -0.2]], 12), 0x22262b],
  ], 0.004);
  const e = eye(kit, 0.52, 0.05, 0.03, { iris: 0x8aa0b0, pupil: 0.55, look: 0.2 });
  e.position.z = 0.024; c.rig.add(e); c.eyes.push(e);
  return c;
}
export function makeKittiwake(kit) {
  const c = character('kittiwake', 0.4);
  stack(kit, c.rig, [
    [blob([[-0.2, 0.06], [-0.1, 0.02], [0.14, 0.04], [0.2, 0.18], [0.1, 0.3], [-0.12, 0.22]], 24), 0xf7f7f2],
    [blob([[-0.26, 0.12], [-0.08, 0.2], [0.12, 0.2], [-0.02, 0.1]], 16), 0xb4bcc2],
    [poly([[-0.26, 0.12], [-0.36, 0.1], [-0.22, 0.08]]), 0x22262b],
    [ellipse(0.13, 0.3, 0.09, 0.085), 0xf7f7f2],
    [poly([[0.2, 0.3], [0.3, 0.28], [0.2, 0.26]]), 0xe8c43c],
  ], 0.004);
  const e = eye(kit, 0.15, 0.32, 0.025, { pupil: 0.8, look: 0.1 });
  e.position.z = 0.02; c.rig.add(e); c.eyes.push(e);
  return c;
}

// A hedgehog, curled up asleep: a brown dome of prickles, a soft pale face
// with a dark nose, eyes shut. `c.ball` is the tight ball he rolls into when
// woken; `c.face` is the face, hidden when he is a ball.
export function makeHedgehog(kit) {
  const c = character('hedgehog', 0.55);
  const spines = [];
  for (let k = 0; k < 13; k++) {
    const a = Math.PI * (0.08 + k * 0.07);
    const bx = -0.05 + Math.cos(a) * 0.5, by = 0.02 + Math.sin(a) * 0.42;
    spines.push([poly([[bx - 0.06, by], [bx + 0.06, by], [bx + Math.cos(a) * 0.2, by + Math.sin(a) * 0.2]]), k % 2 ? 0x5a4231 : 0x6e5440]);
  }
  const face = new THREE.Group();
  let z = stack(kit, c.rig, [
    ...spines,
    [blob([[-0.56, 0.02], [-0.5, 0.3], [-0.2, 0.46], [0.2, 0.42], [0.46, 0.22], [0.5, 0.02]], 30), 0x7a5d45],
  ], 0.004);
  stack(kit, face, [
    [blob([[0.3, 0.02], [0.34, 0.24], [0.58, 0.2], [0.72, 0.1], [0.6, 0.02]], 20), 0xe6d2b4],
    [ellipse(0.73, 0.1, 0.035), 0x2a2420],
    [poly([[0.46, 0.17], [0.54, 0.16], [0.54, 0.15], [0.46, 0.16]]), 0x3a2e26],     // the shut eye
  ], z);
  c.rig.add(face);
  const ball = new THREE.Group();
  stack(kit, ball, [...spines.map(([sh, hx]) => [sh, hx]), [ellipse(-0.05, 0.3, 0.45, 0.38), 0x7a5d45]], z + DZ * 4);
  ball.visible = false;
  c.rig.add(ball);
  c.face = face; c.ball = ball;
  return c;
}

// A rabbit of May's family: May's shape in their own colour.
export function makeRabbit(kit, fur = 0x8f857a) {
  const c = makeMay(kit, fur);
  c.kind = 'rabbit';
  return c;
}

// Marvin the otter: long and sleek, dark glossy brown with a pale face and
// chest, little round ears, whiskers, a thick tapering tail. Drawn swimming
// along, facing right; he walks and slides like this too.
export function makeOtter(kit) {
  const c = character('marvin', 0.7);
  const fur = 0x6b4a35, dark = 0x55392a, pale = 0xd9c3a2;
  let z = stack(kit, c.rig, [
    [blob([[-0.7, 0.2], [-1.3, 0.12], [-1.35, 0.08], [-0.7, 0.08]], 16), dark],                         // tail
    [blob([[-0.75, 0.14], [-0.5, 0.02], [0.3, 0.02], [0.6, 0.2], [0.55, 0.42], [0.0, 0.46], [-0.6, 0.36]], 36), fur],
    [blob([[0.0, 0.06], [0.45, 0.1], [0.55, 0.3], [0.2, 0.2]], 20), pale],                              // chest
    [ellipse(0.62, 0.46, 0.24, 0.2), fur],                                                                // head
    [ellipse(0.72, 0.4, 0.15, 0.11), pale],                                                               // face
    [ellipse(0.86, 0.44, 0.04, 0.03), 0x2a211b],                                                          // nose
    [ellipse(0.5, 0.63, 0.06), dark],                                                                     // ear
    [poly([[0.8, 0.4], [1.04, 0.44], [1.04, 0.43], [0.8, 0.39]]), 0x3a2c22], [poly([[0.8, 0.38], [1.02, 0.34], [1.02, 0.33], [0.8, 0.37]]), 0x3a2c22],
  ], 0.004);
  const e = eye(kit, 0.66, 0.52, 0.065, { iris: 0x3a2a20, lid: dark, look: 0.25, pupil: 0.7 });
  e.position.z = z; c.rig.add(e); c.eyes.push(e);
  for (const fx of [-0.4, 0.3]) {
    const f = pivot(fx, 0.03, -0.004);
    f.add(kit.mesh(ellipse(0, 0, 0.1, 0.05), dark, { layer: 0 }));
    c.rig.add(f); c.feet.push(f);
  }
  return c;
}

// Bernie the hermit crab: a borrowed shell on his back, his red front poking
// out with eyes on stalks and one big claw. He tries on new shells:
// `c.wear(i)` shows shell i.
export function makeBernie(kit) {
  const c = character('bernie', 0.55);
  const red = 0xd86a44, deep = 0xb04f30;
  const shells = [];
  const shellShape = (i) => {
    const g = new THREE.Group();
    if (i === 0) {        // a whelk: a cream spiral
      stack(kit, g, [[blob([[-0.42, 0.04], [-0.46, 0.3], [-0.2, 0.52], [0.12, 0.44], [0.2, 0.12], [0, 0.02]], 30), 0xeadcc0], [ellipse(-0.18, 0.28, 0.16, 0.14), 0xd8c6a2], [ellipse(-0.2, 0.3, 0.07, 0.06), 0xc4ae86]]);
    } else if (i === 1) { // a periwinkle: small, round, striped brown
      stack(kit, g, [[ellipse(-0.14, 0.24, 0.3, 0.24), 0x8a6a4a], [poly([[-0.4, 0.26], [0.12, 0.3], [0.12, 0.26], [-0.4, 0.22]]), 0x6e523a], [poly([[-0.36, 0.14], [0.1, 0.16], [0.1, 0.12], [-0.36, 0.1]]), 0x6e523a]]);
    } else {              // a grand pink-orange shell, just right
      stack(kit, g, [[blob([[-0.5, 0.04], [-0.56, 0.36], [-0.3, 0.62], [0.06, 0.6], [0.22, 0.3], [0.12, 0.04]], 30), 0xf0a07a], [blob([[-0.44, 0.3], [-0.24, 0.52], [0, 0.46], [-0.2, 0.34]], 20), 0xf7c3a4], [ellipse(-0.22, 0.28, 0.1, 0.09), 0xd98260]]);
    }
    g.visible = i === 0;
    c.rig.add(g);
    shells.push(g);
  };
  let z = stack(kit, c.rig, [
    [poly([[0.04, 0.1], [0.22, 0.0], [0.24, 0.0], [0.08, 0.1]]), deep], [poly([[0.12, 0.12], [0.34, 0.02], [0.36, 0.02], [0.16, 0.12]]), deep],
    [blob([[0.0, 0.06], [0.26, 0.1], [0.3, 0.26], [0.1, 0.3], [-0.02, 0.2]], 20), red],
    [poly([[0.16, 0.28], [0.15, 0.44], [0.17, 0.44], [0.19, 0.28]]), deep], [poly([[0.24, 0.26], [0.26, 0.42], [0.28, 0.42], [0.27, 0.26]]), deep],
  ], 0.004);
  for (const x of [0.16, 0.27]) { const e = eye(kit, x, 0.45, 0.035, { iris: 0x15191e, lid: deep, pupil: 0.72, look: 0.1 }); e.position.z = z; z += DZ * 6; c.rig.add(e); c.eyes.push(e); }
  const claw = pivot(0.28, 0.14, z);
  claw.add(kit.mesh(blob([[0, 0], [0.14, 0.06], [0.22, 0.16], [0.1, 0.14], [0.14, 0.22], [0.02, 0.12]], 16), red, { layer: 0 }));
  c.rig.add(claw); c.wings.push(claw);
  for (let i = 0; i < 3; i++) shellShape(i);
  c.shells = shells;
  c.wear = (i) => shells.forEach((sh, k) => { sh.visible = k === i; });
  return c;
}

// A ewe and her lamb, from the grassland picture: woolly cream bodies, dark
// brown faces and legs. `lamb` makes the little one.
export function makeSheep(kit, lamb = false) {
  const c = character(lamb ? 'lamb' : 'sheep', lamb ? 0.8 : 1.2);
  const wool = 0xf1e9d6, face = lamb ? 0x9a7a62 : 0x5e4838, leg = 0x4e3b2e;
  const k = lamb ? 0.65 : 1;
  const g = c.rig;
  g.scale.setScalar(k);
  let z = stack(kit, g, [
    [poly([[-0.42, 0.45], [-0.36, 0.45], [-0.36, 0], [-0.42, 0]]), leg], [poly([[-0.2, 0.45], [-0.14, 0.45], [-0.14, 0], [-0.2, 0]]), leg],
    [poly([[0.3, 0.45], [0.36, 0.45], [0.36, 0], [0.3, 0]]), leg], [poly([[0.44, 0.45], [0.5, 0.45], [0.5, 0], [0.44, 0]]), leg],
    [blob([[-0.62, 0.55], [-0.55, 0.85], [-0.2, 1.0], [0.25, 0.98], [0.62, 0.86], [0.66, 0.55], [0.3, 0.38], [-0.3, 0.38]], 40), wool],
  ], 0.004);
  const head = pivot(0.62, 0.86, z);
  stack(kit, head, [
    [blob([[-0.08, 0.1], [0.12, 0.14], [0.3, 0.0], [0.28, -0.18], [0.1, -0.2], [-0.06, -0.05]], 24), face],
    [ellipse(0.02, 0.14, 0.1, 0.05, 0.4), face],
    [ellipse(0.14, 0.02, 0.05), 0xf6f1e6], [ellipse(0.155, 0.02, 0.028), 0x1c1a18],
  ]);
  g.add(head);
  c.ears.push(head);
  return c;
}

// A moon jelly: a see-through pale dome with four soft rings in it, and a
// fringe of short tentacles.
export function makeJelly(kit) {
  const c = character('jelly', 0.5);
  stack(kit, c.rig, [
    [blob([[-0.36, 0.12], [-0.3, 0.34], [0, 0.44], [0.3, 0.34], [0.36, 0.12], [0, 0.06]], 30), 0xf2dde6],
    ...[-0.15, -0.05, 0.05, 0.15].map((x) => [ellipse(x, 0.24, 0.05, 0.07), 0xe7b8cc]),
    ...[-0.28, -0.14, 0, 0.14, 0.28].map((x) => [poly([[x - 0.01, 0.1], [x + 0.01, 0.1], [x + 0.04, -0.24], [x + 0.02, -0.24]]), 0xf2dde6]),
  ], 0.004);
  c.root.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.62; o.material.depthWrite = false; } });
  return c;
}

// Glue a character's still paper into one mesh per colour, leaving every
// part that moves (eyes blink, wings beat, feet step, ears twitch, shells and
// faces swap) as it is. A puffin is ~45 shapes; drawn one by one, a dozen
// friends on screen is hundreds of draws a frame.
export function settle(c) {
  for (const part of [...c.eyes, ...c.wings, ...c.feet, ...c.ears, ...(c.shells || []), c.face, c.ball]) if (part) part.userData.live = true;
  mergeStatic(c.rig);
  return c;
}

// A wood mouse: sandy brown, a pale tummy, great round ears, big dark eyes
// and a long thin tail. Small — it fits in a hole in the larder wall.
export function makeMouse(kit) {
  const c = character('mouse', 0.35);
  const fur = 0xa8743f, pale = 0xefdcbf, pink = 0xe8a6a0;
  let z = stack(kit, c.rig, [
    [poly([[-0.14, 0.08], [-0.5, 0.2], [-0.62, 0.34], [-0.6, 0.35], [-0.48, 0.23], [-0.14, 0.11]]), 0xc49a88],   // tail
    [ellipse(-0.02, 0.13, 0.19, 0.13), fur],
    [ellipse(0.03, 0.09, 0.12, 0.07), pale],
    [ellipse(0.02, 0.33, 0.1, 0.1), fur], [ellipse(0.02, 0.33, 0.065), pink],                                   // ear
    [blob([[0.04, 0.3], [0.2, 0.3], [0.33, 0.2], [0.2, 0.12], [0.04, 0.14]], 20), fur],                           // head
    [ellipse(0.33, 0.2, 0.025), 0x3a2622],
    [poly([[0.3, 0.2], [0.46, 0.24], [0.46, 0.235], [0.3, 0.195]]), 0x5a3a2a], [poly([[0.3, 0.19], [0.46, 0.16], [0.46, 0.155], [0.3, 0.185]]), 0x5a3a2a],
  ], 0.004);
  const e = eye(kit, 0.17, 0.25, 0.05, { iris: 0x2a1c14, lid: 0x7a5230, pupil: 0.8, look: 0.25 });
  e.position.z = z; c.rig.add(e); c.eyes.push(e);
  return c;
}

// ---- moving them ------------------------------------------------------------

// pose: { mode: stand|walk|fly|slide|swim|dive|hop, facing, slope, pitch, breathe }
export function animate(c, t, pose, dt = 1 / 60) {
  const facing = pose.facing ?? 1;
  // Turning round is a card flipping over: quick, but seen.
  c.flip += (facing - c.flip) * Math.min(1, dt * 14);
  if (Math.abs(c.flip) < 0.04) c.flip = facing * 0.04;
  c.root.scale.x = c.flip;

  const mode = pose.mode || 'stand';
  const ph = t * 11 + c.seed * 3;
  let bob = 0, tilt = 0, squash = 1, wingA = 0, footSwing = 0, tuck = 1;
  if (mode === 'walk') {
    bob = Math.abs(Math.sin(ph)) * 0.06;
    tilt = Math.sin(ph) * 0.06;
    footSwing = Math.sin(ph) * 0.1;
    wingA = 0.12 + Math.sin(ph) * 0.08;
  } else if (mode === 'fly') {
    wingA = 0.9 + Math.sin(t * 30) * 0.9;
    tilt = -0.14;
    tuck = 0.4;
  } else if (mode === 'slide') {
    tilt = Math.atan(pose.slope || 0) * 0.9;
    wingA = 1.6 + Math.sin(t * 9) * 0.15;
    squash = 0.94;
  } else if (mode === 'swim') {
    // Floating: a slow bob on the swell, wings folded, paddling underneath.
    // Low in the water, the way a real puffin sits: the sea (drawn in front)
    // hides the belly and the feet.
    bob = Math.sin(t * 2.4 + c.seed) * 0.035 - c.height * 0.3;
    tilt = Math.sin(t * 1.7 + c.seed) * 0.05;
    wingA = 0.15 + Math.sin(t * 3) * 0.08;
    tuck = 0.6;
  } else if (mode === 'dive') {
    // Under the sea a puffin flies: body pointing where she swims, the wings
    // doing the work, the feet tucked back.
    tilt = pose.pitch || 0;
    wingA = 1.0 + Math.sin(t * 7) * 0.75;
    tuck = 0.3;
  } else if (mode === 'cannon') {
    // Tucked into a ball: wings clamped, feet up, a little tumble.
    squash = 0.82; wingA = -0.1; tuck = 0.2;
    tilt = Math.sin(t * 8) * 0.25;
  } else if (mode === 'climb') {
    // Hand over hand — wing over wing — up the roots.
    wingA = 1.4 + Math.sin(t * 9) * 0.6;
    tilt = Math.sin(t * 9) * 0.08;
    footSwing = Math.sin(t * 9) * 0.12;
  } else if (mode === 'ride') {
    // Sitting on Silky's back: tilted with her, wings out for balance.
    tilt = pose.pitch || 0;
    wingA = 0.9 + Math.sin(t * 6) * 0.2;
    tuck = 0.4;
  } else if (mode === 'hop') {
    const k = Math.sin(Math.min(1, pose.hop || 0) * Math.PI);
    bob = k * 0.7;
    squash = 1 + k * 0.06;
  } else {
    // Asleep, the breathing is slower and deeper.
    squash = pose.sleep ? 1 + Math.sin(t * 1.2 + c.seed) * 0.03 : 1 + Math.sin(t * 2 + c.seed) * 0.012;
  }
  c.rig.position.set(0, bob, 0);
  c.rig.rotation.z = tilt;
  // Swimming she turns about her middle, not her feet.
  if (mode === 'dive') {
    const mid = c.height * 0.45;
    c.rig.position.x += Math.sin(tilt) * mid;
    c.rig.position.y += mid - Math.cos(tilt) * mid;
  }
  const s = c.rig.userData.base ?? (c.rig.userData.base = c.rig.scale.x);
  squash *= 1 + (pose.breathe || 0);
  c.rig.scale.set(s * (1 + (pose.breathe || 0) * 0.5), s * squash, s);
  for (const w of c.wings) w.rotation.z = wingA;
  c.feet.forEach((f, i) => {
    f.position.x = f.userData.x0 ?? (f.userData.x0 = f.position.x);
    f.position.x = f.userData.x0 + (i ? -footSwing : footSwing);
    f.scale.y = tuck;
  });
  // Blink now and then, never in step with anybody else.
  const blink = pose.sleep || ((t + c.seed * 1.9) % 4.3) < 0.12;
  for (const e of c.eyes) e.scale.y = blink ? 0.12 : 1;
  // A rabbit's ears and a shrew's nose never quite keep still.
  c.ears.forEach((e, i) => {
    e.userData.r0 ??= e.rotation.z;
    e.rotation.z = e.userData.r0 + Math.sin(t * 1.7 + i) * 0.05;
  });
}

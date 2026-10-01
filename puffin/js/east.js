// EAST OF THE BEACH — out across the sea to Silky's rock, and on to the
// rocky shore: two rock pools with a crab and an anemone in them, and the
// blowhole, a crack in the rock the waves push water up through with a WHOOSH
// that throws whoever is standing on it up into the sky.
//
// buildEast(kit, { stage, front, bandShape, water }) adds the scenery; Silky
// and the crab are characters (cast.js) placed by island.js. Returns the
// things that move: the anemone (it closes when touched) and the spout.

import * as THREE from './three.js';
import { blob, ellipse, poly } from './shapes.js';
import { groundY, X_MAX, STOPS, POOLS, POOL_LEVEL, SURFACE } from './ground.js';
import * as paint from './paint.js';

export const EAST = {
  rock: 0xa39c8e, rockDeep: 0x8a8479, rockDark: 0x6f6a61, wrack: 0x6f6f3a, barnacle: 0xd9d4c6,
  pool: 0x8fc2bb, poolCrest: 0xc8e4dc,
  anemone: 0xd4485c, anemoneLit: 0xee7486, star: 0xe8864a,
  spout: 0xeef8f6, crack: 0x3c3a36, grass: 0xa9bf55,
};

export function buildEast(kit, { stage, front, bandShape, water }) {
  const r = paint.rng(117);

  // ---- rock: Silky's, rising out of the sea, and the whole shore -----------------
  // Silky's rock is ground (ground.js), so it only needs its colour: a rock
  // band over the sand where it stands up off the sea floor.
  stage.add(kit.mesh(bandShape(65.4, 73.6, 0, 0), EAST.rock, { z: -0.27, layer: 0 }));
  stage.add(kit.mesh(bandShape(65.8, 73.2, 1.2, 0), EAST.rockDeep, { z: -0.268, layer: 0 }));
  stage.add(kit.mesh(bandShape(74.5, 100.5, 0, 2.4), EAST.rock, { z: -0.27, layer: 0 }));
  stage.add(kit.mesh(bandShape(75.7, 100.5, 1.2, 1.2), EAST.rockDeep, { z: -0.268, layer: 0 }));
  // Barnacles and wrack along the shore's edge, above the tide line.
  for (let x = 76; x < 97.5; x += 0.5 + r() * 0.9) {
    const y = groundY(x);
    if (y < 0.1) continue;
    stage.add(kit.mesh(ellipse(x, y - 0.12 - r() * 0.3, 0.05, 0.035), EAST.barnacle, { z: -0.26, layer: 0 }));
    if (r() < 0.3) stage.add(kit.mesh(blob([[x - 0.25, y - 0.02], [x, y + 0.06], [x + 0.3, y - 0.02], [x, y - 0.1]], 12), EAST.wrack, { z: -0.25, layer: 0 }));
  }
  // ---- the rock pools --------------------------------------------------------------
  // Their water is see-through: the creatures in them sit behind it.
  const pools = new THREE.Group();
  pools.position.z = 0.8;
  for (const p of POOLS) {
    const lvl = (x) => POOL_LEVEL + 0.015 * Math.sin(x * 4);
    pools.add(kit.mesh(water((x) => lvl(x) + 0.04, p.x0 - 0.3, p.x1 + 0.3), EAST.poolCrest, { z: -0.01, layer: 0.8, opacity: 0.8 }));
    pools.add(kit.mesh(water(lvl, p.x0 - 0.3, p.x1 + 0.3), EAST.pool, { layer: 0.8, opacity: 0.55 }));
  }
  stage.parent.add(pools);
  // A starfish on the floor of the first pool, pebbles and weed in both.
  const [p1, p2] = POOLS;
  const sx = (p1.x0 + p1.x1) / 2 - 0.3, sy = groundY(sx) + 0.08;
  const arms = [];
  for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + k * (Math.PI * 2 / 5); arms.push([sx + Math.cos(a) * 0.22, sy + Math.sin(a) * 0.14], [sx + Math.cos(a + 0.63) * 0.08, sy + Math.sin(a + 0.63) * 0.05]); }
  stage.add(kit.mesh(poly(arms), EAST.star, { z: 0.4, layer: 0 }));
  for (const p of POOLS) for (let k = 0; k < 4; k++) {
    const x = p.x0 + 0.3 + r() * (p.x1 - p.x0 - 0.6);
    stage.add(kit.mesh(ellipse(x, groundY(x) + 0.03, 0.07 + r() * 0.06, 0.05), r() < 0.5 ? 0xcfc6b4 : 0x9a8f80, { z: 0.38, layer: 0 }));
  }

  // The anemone: a red column with soft tentacles that fold away when she
  // touches it, leaving a little closed-up ball.
  const ax = STOPS.anemone.x, ay = groundY(ax);
  const anemone = new THREE.Group();
  anemone.userData.pick = 'anemone';
  anemone.userData.stop = ax;
  const open = new THREE.Group();
  open.add(kit.mesh(blob([[-0.12, 0], [0.12, 0], [0.1, 0.2], [-0.1, 0.2]], 12), EAST.anemone, { layer: 0 }));
  for (let k = 0; k < 7; k++) {
    const a = -1.1 + k * (2.2 / 6);
    open.add(kit.mesh(blob([[-0.03, 0.18], [0.03, 0.18], [Math.sin(a) * 0.24 + 0.02, 0.18 + Math.cos(a) * 0.24], [Math.sin(a) * 0.24 - 0.02, 0.18 + Math.cos(a) * 0.22]], 10), EAST.anemoneLit, { z: 0.002 + k * 0.001, layer: 0 }));
  }
  const shut = kit.mesh(ellipse(0, 0.1, 0.13, 0.11), EAST.anemone, { layer: 0 });
  shut.visible = false;
  anemone.add(open, shut);
  const aPad = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(0, 0.2, 0.5, 0.45), 14), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  aPad.position.z = -0.03;
  anemone.add(aPad);
  anemone.position.set(ax, ay, 0.42);
  anemone.userData.close = (c) => { open.visible = !c; shut.visible = c; };
  stage.add(anemone);

  // ---- the blowhole ------------------------------------------------------------------
  const bx = STOPS.blowhole.x, by = groundY(bx);
  const blowhole = new THREE.Group();
  blowhole.userData.pick = 'blowhole';
  blowhole.userData.stop = bx;
  blowhole.add(kit.mesh(blob([[-0.45, 0.02], [-0.2, -0.04], [0, -0.3], [0.22, -0.05], [0.45, 0.02], [0, -0.06]], 18), EAST.crack, { layer: 0 }));
  blowhole.add(kit.mesh(ellipse(0, -0.05, 0.62, 0.1), 0x7d776e, { z: -0.002, layer: 0 }));
  const bPad = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(0, 0.3, 0.7, 0.55), 14), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  bPad.position.z = -0.03;
  blowhole.add(bPad);
  blowhole.position.set(bx, by, 0.2);
  stage.add(blowhole);
  // The spout: a column of spray with drops round its head, grown from the
  // crack by scaling up; hidden between whooshes.
  const spout = new THREE.Group();
  spout.add(kit.mesh(blob([[-0.18, 0], [0.18, 0], [0.3, 2.6], [0.45, 3.2], [0, 3.6], [-0.45, 3.2], [-0.3, 2.6]], 30), EAST.spout, { layer: 0, opacity: 0.85, plain: true }));
  for (let k = 0; k < 9; k++) spout.add(kit.mesh(ellipse(Math.sin(k * 2.1) * 0.6, 3.1 + Math.cos(k * 1.7) * 0.4, 0.07 + (k % 3) * 0.03), EAST.spout, { z: 0.002, layer: 0, opacity: 0.85, plain: true }));
  spout.position.set(bx, by - 0.05, 0.5);
  spout.scale.set(1, 0.001, 1);
  spout.visible = false;
  spout.userData.live = true;
  stage.add(spout);

  // ---- in front: dark rocks and wrack along the shore ----------------------------------
  for (let x = 77; x < 97; x += 2.8 + r() * 2.2) {
    const y = groundY(x) - 1.8 - r() * 0.4, w = 1 + r() * 0.8;
    front.add(kit.mesh(blob([[x - w, y - 1], [x - w * 0.8, y + 0.4], [x, y + 0.65], [x + w * 0.8, y + 0.35], [x + w, y - 1]], 22), EAST.rockDark, { layer: 3 }));
    front.add(kit.mesh(blob([[x - w * 0.6, y + 0.4], [x, y + 0.72], [x + w * 0.5, y + 0.4], [x, y + 0.5]], 16), EAST.wrack, { z: 0.01, layer: 3 }));
  }

  return { anemone, blowhole, spout };
}

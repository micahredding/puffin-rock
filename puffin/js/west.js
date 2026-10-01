// WEST OF THE WOOD — through the great old tree, the pond, and past it the
// long grassy climb to the seabird cliffs at the end of the island.
//
// The pond is still and green, reeds at both ends, five lily pads floating on
// it (the pads BOUNCE — flight.js); a frog lives on the middle one. The cliffs
// are open sky after the wood: sea-pinks on the grass, and at the very edge
// the rock face drops away to the sea far below, kittiwakes nesting on its
// ledges and gannets hanging in the wind that comes up it.
//
// buildWest(kit, { layer, stage, front, bandShape, water }) adds the scenery;
// the frog and the seabirds are characters (cast.js) and island.js places
// them. Returns the pads, which bob and squash.

import * as THREE from './three.js';
import { blob, ellipse, poly, land } from './shapes.js';
import { groundY, X_MIN, POND, CLIFF, PADS, WOOD_L } from './ground.js';
import * as paint from './paint.js';

export const WEST = {
  grass: 0xa9bf55, grassDeep: 0x8fa645, blade: 0x7f9a3c,
  pond: 0x76a49a, pondDeep: 0x5e8c84, pondCrest: 0xb9d8cc,
  pad: 0x6f9c40, padLit: 0x88b650, lily: 0xf2b8c8,
  reed: 0x8a9a48, cattail: 0x7a5534,
  rock: 0x9e978a, rockLit: 0xb3ac9e, ledge: 0xc4bdb0, thrift: 0xe99ab2,
};

export function buildWest(kit, { layer, stage, front, bandShape, water }) {
  const r = paint.rng(91);

  // ---- the ground: grass all the way, the pond scooped out of it ---------------
  stage.add(kit.mesh(bandShape(X_MIN - 0.6, WOOD_L + 2, 0, 0), WEST.grass, { z: -0.315, layer: 0 }));
  stage.add(kit.mesh(bandShape(X_MIN - 0.6, WOOD_L + 2, 1.1, 0), WEST.grassDeep, { z: -0.312, layer: 0 }));
  for (let x = X_MIN; x < WOOD_L; x += 0.3 + r() * 0.25) {
    const y = groundY(x);
    if (y < POND + 0.05) continue;                    // not under the pond
    const h = 0.14 + r() * 0.22, lean = x < -92 ? -0.14 : (r() - 0.5) * 0.12;   // the wind leans them
    stage.add(kit.mesh(poly([[x - 0.05, y - 0.05], [x + 0.05, y - 0.05], [x + lean, y + h]]), WEST.blade, { z: -0.2, layer: 0 }));
  }

  // ---- the cliff face: the island's end ------------------------------------------
  const ex = X_MIN - 0.6;
  stage.add(kit.mesh(blob([[ex + 0.4, CLIFF - 0.05], [ex - 0.2, CLIFF - 1.2], [ex - 0.9, CLIFF - 3], [ex - 1.4, CLIFF - 6.5], [ex - 2.2, -14], [ex + 2, -14], [ex + 1.2, CLIFF - 1]], 36), WEST.rock, { z: -0.3, layer: 0 }));
  const ledges = [[ex - 0.35, CLIFF - 1.3], [ex - 0.8, CLIFF - 2.5], [ex - 1.1, CLIFF - 3.7]];
  for (const [lx, ly] of ledges) stage.add(kit.mesh(poly([[lx - 0.9, ly], [lx + 0.5, ly], [lx + 0.4, ly - 0.12], [lx - 0.8, ly - 0.1]]), WEST.ledge, { z: -0.29, layer: 0 }));
  // Sea-pinks on the clifftop.
  for (let x = -99.5; x < -86; x += 0.8 + r() * 1.4) {
    const y = groundY(x);
    stage.add(kit.mesh(poly([[x - 0.015, y], [x + 0.015, y], [x + 0.02, y + 0.32], [x - 0.01, y + 0.32]]), WEST.blade, { z: -0.36, layer: 0 }));
    stage.add(kit.mesh(ellipse(x + 0.005, y + 0.36, 0.11, 0.09), WEST.thrift, { z: -0.355, layer: 0 }));
  }

  // ---- behind: low green hills behind the pond, open sky past them --------------
  const back = layer(-4.5);
  const hill = (x) => 1.1 + 0.4 * Math.sin(x * 0.4) + 0.25 * Math.sin(x * 1.1);
  back.add(kit.mesh(land(-88, WOOD_L + 1, (x) => hill(x) * Math.min(1, (x + 88) / 4), -12), 0xa2b95a, { layer: -4.5, haze: 0.15 }));
  for (let x = -85; x < WOOD_L - 1; x += 1.8 + r() * 1.5) {
    back.add(kit.mesh(ellipse(x, hill(x) - 0.1, 0.9 + r() * 0.5, 0.6 + r() * 0.3), r() < 0.5 ? 0x8fae4c : 0x9cb858, { z: 0.01, layer: -4.5, haze: 0.15 }));
  }

  // ---- the muddy bank Marvin jumps in from: bare brown earth, worn by otters ----
  const mudPts = [];
  for (let x = -86.6; x <= -80.6; x += 0.2) mudPts.push([x, groundY(x) + 0.02]);
  for (let x = -80.6; x >= -86.6; x -= 0.2) mudPts.push([x, groundY(x) - 0.28]);
  stage.add(kit.mesh(poly(mudPts), 0x7a5a3a, { z: -0.19, layer: 0 }));

  // ---- the old stone bridge over the pond, green with moss (the wetland picture) ---
  const bl = -76.8, br = -69.6, by = POND;
  const bridge = poly([[bl - 0.6, by - 1.2], [bl - 0.4, by + 1.5], [bl + 0.8, by + 2.3], [(bl + br) / 2, by + 2.6], [br - 0.8, by + 2.3], [br + 0.4, by + 1.5], [br + 0.6, by - 1.2]]);
  for (const [a, b] of [[bl + 0.3, bl + 2.5], [bl + 2.9, br - 2.9], [br - 2.5, br - 0.3]]) {
    const h = new THREE.Path();
    const top = by + 1.3;
    h.moveTo(a, by - 1.1); h.lineTo(a, by + 0.6); h.quadraticCurveTo(a, top, (a + b) / 2, top); h.quadraticCurveTo(b, top, b, by + 0.6); h.lineTo(b, by - 1.1); h.lineTo(a, by - 1.1);
    bridge.holes.push(h);
  }
  stage.add(kit.mesh(bridge, 0x6f9258, { z: -1.6, layer: -1.6 }));
  stage.add(kit.mesh(blob([[bl - 0.5, by + 1.6], [bl + 0.8, by + 2.4], [(bl + br) / 2, by + 2.75], [br - 0.8, by + 2.4], [br + 0.5, by + 1.6], [(bl + br) / 2, by + 2.2]], 36), 0x8fb65a, { z: -1.59, layer: -1.6 }));
  // Stones standing in the water under the arches, and more on the bank.
  for (const [x, w, h] of [[bl + 1.4, 0.7, 0.55], [(bl + br) / 2, 0.8, 0.6], [br - 1.4, 0.7, 0.5]]) {
    stage.add(kit.mesh(blob([[x - w, by - 0.5], [x - w * 0.8, by + h * 0.6], [x, by + h], [x + w * 0.8, by + h * 0.6], [x + w, by - 0.5]], 20), 0xb9b3a6, { z: -1.4, layer: -1.4 }));
  }

  // ---- the pond ----------------------------------------------------------------------
  const pond = new THREE.Group();
  pond.position.z = 0.8;
  const wave = (x) => POND + 0.025 * Math.sin(x * 2.6);
  pond.add(kit.mesh(water((x) => wave(x) + 0.05, -83, -63), WEST.pondCrest, { z: -0.01, layer: 0.8 }));
  pond.add(kit.mesh(water(wave, -83, -63), WEST.pond, { layer: 0.8 }));
  pond.add(kit.mesh(water((x) => wave(x) - 0.8, -83, -63), WEST.pondDeep, { z: 0.01, layer: 0.8 }));
  pond.add(kit.mesh(water(wave, -83, -63), WEST.pond, { z: 0.35, layer: 0.8, opacity: 0.25 }));
  stage.parent.add(pond);
  // Reeds at both ends, tall, with brown cattails; some behind, some in front.
  const reeds = (x0, x1, z, parent) => {
    for (let x = x0; x < x1; x += 0.22 + r() * 0.2) {
      const y = Math.max(groundY(x), POND) - 0.1, h = 1.1 + r() * 0.9, lean = (r() - 0.5) * 0.2;
      parent.add(kit.mesh(poly([[x - 0.025, y], [x + 0.025, y], [x + lean + 0.01, y + h], [x + lean - 0.01, y + h]]), WEST.reed, { z, layer: 0 }));
      if (r() < 0.4) parent.add(kit.mesh(ellipse(x + lean * 0.9, y + h * 0.88, 0.045, 0.16), WEST.cattail, { z: z + 0.001, layer: 0 }));
    }
  };
  reeds(-83.2, -80.8, -0.45, stage);
  reeds(-66.6, -64.2, -0.45, stage);
  const nearReeds = new THREE.Group();
  nearReeds.position.z = 1.05;
  reeds(-82.6, -81.2, 0, nearReeds);
  reeds(-65.8, -64.8, 0, nearReeds);
  stage.parent.add(nearReeds);

  // The lily pads: flat round leaves seen almost edge-on, a notch cut in each,
  // floating in front of the water so whoever stands on one stands ON it.
  const pads = PADS.map((p, i) => {
    const g = new THREE.Group();
    g.add(kit.mesh(blob([[-p.r, 0], [-p.r * 0.7, 0.13], [0, 0.18], [p.r * 0.7, 0.13], [p.r, 0], [p.r * 0.5, -0.1], [0.06, -0.04], [-0.06, -0.12], [-p.r * 0.6, -0.1]], 30), WEST.pad, { layer: 0.8 }));
    g.add(kit.mesh(blob([[-p.r * 0.8, 0.06], [0, 0.16], [p.r * 0.7, 0.08], [0, 0.08]], 20), WEST.padLit, { z: 0.002, layer: 0.8 }));
    if (i === 1 || i === 3) {
      for (let k = 0; k < 5; k++) {
        const a = -0.9 + k * 0.45;
        g.add(kit.mesh(blob([[0.2, 0.06], [0.2 + Math.sin(a) * 0.14, 0.06 + Math.cos(a) * 0.2], [0.2 + Math.sin(a) * 0.05, 0.06 + Math.cos(a) * 0.08]], 12), WEST.lily, { z: 0.004 + k * 0.001, layer: 0.8 }));
      }
    }
    g.position.set(p.x, POND + 0.02, 0.05);
    g.userData = { live: true, x: p.x, squash: 0 };
    pond.add(g);
    return g;
  });

  return { pads, pond };
}

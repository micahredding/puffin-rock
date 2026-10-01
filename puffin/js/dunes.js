// PAST THE ROCKY SHORE — the sand dunes and the bog, and the waterfall at the
// island's east end. From the Puffin Rock Habitats pictures: dunes of pale
// sand held together by marram grass, with spiky blue sea holly; then a
// boggy place of dark peat, white tufts of bog cotton and dragonflies; and a
// waterfall tumbling off a mossy crag into a pool, where the spray makes a
// rainbow.
//
// Two new things to do. In the dunes, DIG: three sandy mounds, each with a
// treasure under it. At the falls, a SHOWER: stand on the ledge under the
// water and the rainbow comes out.
//
// buildDunes(kit, { stage, front, bandShape, water, parent }) adds it all and
// returns what moves or can be tapped.

import * as THREE from './three.js';
import { blob, ellipse, poly, mergeStatic } from './shapes.js';
import { groundY, X_MAX, STOPS, FALLS, BOG_LEVEL } from './ground.js';
import * as paint from './paint.js';

export const D = {
  sand: 0xe4d2a6, sandDeep: 0xd2bd8c, ripple: 0xcdb884, marram: 0xb7b56c, marramDark: 0x9a9a52,
  holly: 0x7f9fc0, hollyDark: 0x5f7fa0,
  peat: 0x5e4a33, peatDeep: 0x4a3a28, moss: 0x8faa4c, cotton: 0xf7f5ee, reed: 0x8a9a48,
  pool: 0x6f9fa0, poolDeep: 0x578787, crest: 0xbcdcd6,
  crag: 0x8a8578, cragLit: 0xa29c8e, cragMoss: 0x7e9e4a, fall: 0xe8f4f4,
};

export function buildDunes(kit, { stage, front, bandShape, water, parent }) {
  const r = paint.rng(163);
  const m = (shape, hex, z, opts = {}) => stage.add(kit.mesh(shape, hex, { z, layer: 0, ...opts }));

  // ---- ground: sand over the dunes, peat under the bog --------------------------
  m(bandShape(98.5, 118, 0, 2.2), D.sand, -0.266);
  m(bandShape(99.6, 118, 1.1, 1.1), D.sandDeep, -0.264);
  m(bandShape(115.2, X_MAX + 20, 0, 5), D.peat, -0.262);
  m(bandShape(117.2, X_MAX + 20, 1.2, 3), D.peatDeep, -0.26);
  // A skin of moss over the bog, and ripples blown into the dunes.
  for (let x = 117.5; x < 121; x += 0.25) m(ellipse(x, groundY(x) - 0.04, 0.2, 0.07), D.moss, -0.258);
  for (let x = 99; x < 116; x += 0.6 + r() * 0.5) {
    const y = groundY(x) - 0.25 - r() * 0.8;
    m(poly([[x - 0.35, y], [x + 0.35, y + 0.03], [x + 0.35, y + 0.005], [x - 0.35, y - 0.025]]), D.ripple, -0.259);
  }

  // Marram grass in clumps along the dune tops, and spiky sea holly.
  const clump = (x, parentG, z, tall = 1) => {
    const y = groundY(x);
    for (let k = 0; k < 7; k++) {
      const bx = x + (k - 3) * 0.07, h = (0.55 + r() * 0.6) * tall, lean = (k - 3) * 0.08 + 0.1;
      parentG.add(kit.mesh(poly([[bx - 0.03, y - 0.05], [bx + 0.03, y - 0.05], [bx + lean, y + h]]), k % 2 ? D.marram : D.marramDark, { z: z + k * 0.001, layer: 0 }));
    }
  };
  for (let x = 99.2; x < 116; x += 1.1 + r() * 1.4) clump(x, stage, -0.36);
  for (const x of [100.2, 103.3, 108.6, 113.4]) {
    const y = groundY(x);
    for (let k = 0; k < 5; k++) {
      const a = -0.9 + k * 0.45;
      m(poly([[x, y], [x + Math.sin(a) * 0.3, y + 0.1 + Math.cos(a) * 0.35], [x + Math.sin(a) * 0.12, y + 0.08]]), D.hollyDark, -0.35 + k * 0.001);
    }
    m(ellipse(x, y + 0.42, 0.1, 0.1), D.holly, -0.344);
    m(ellipse(x - 0.18, y + 0.32, 0.07), D.holly, -0.343);
    m(ellipse(x + 0.18, y + 0.34, 0.07), D.holly, -0.343);
  }

  // Bog cotton: white tufts on thin stalks, nodding.
  const cotton = [];
  for (let x = 116.6; x < 121.2; x += 0.35 + r() * 0.4) {
    const g = new THREE.Group();
    const h = 0.5 + r() * 0.4;
    g.add(kit.mesh(poly([[-0.012, 0], [0.012, 0], [0.012, h], [-0.012, h]]), D.reed, { layer: 0 }));
    g.add(kit.mesh(ellipse(0, h + 0.07, 0.09, 0.08), D.cotton, { z: 0.002, layer: 0 }));
    g.position.set(x, groundY(x) - 0.03, -0.4);
    mergeStatic(g);
    g.userData = { live: true, ph: r() * 6 };
    stage.add(g);
    cotton.push(g);
  }

  // ---- the three treasures in the sand --------------------------------------------
  const TREASURES = ['glass', 'scallop', 'purse'];
  const digs = STOPS.digs.map(({ x }, i) => {
    const g = new THREE.Group();
    g.userData = { pick: `dig-${i}`, stop: x, dug: false, kind: TREASURES[i] };
    const y = groundY(x);
    const mound = new THREE.Group();
    mound.add(kit.mesh(blob([[-0.5, 0], [-0.3, 0.2], [0, 0.28], [0.3, 0.2], [0.5, 0]], 20), D.sandDeep, { layer: 0 }));
    for (const dx of [-0.2, 0.05, 0.25]) mound.add(kit.mesh(ellipse(dx, 0.14, 0.05, 0.03), D.ripple, { z: 0.002, layer: 0 }));
    g.add(mound);
    // The treasure itself, hidden until dug up.
    const t = new THREE.Group();
    if (i === 0) {        // sea glass, frosted green-blue, smooth
      t.add(kit.mesh(blob([[-0.14, 0.02], [-0.1, 0.16], [0.08, 0.2], [0.16, 0.06], [0.04, -0.02]], 16), 0x8fd0c4, { layer: 0, opacity: 0.85 }));
      t.add(kit.mesh(ellipse(-0.02, 0.12, 0.05, 0.03), 0xe0f6f2, { z: 0.002, layer: 0, plain: true }));
    } else if (i === 1) { // a scallop, a little pink fan
      t.add(kit.mesh(blob([[-0.2, 0.08], [-0.14, 0.26], [0, 0.32], [0.14, 0.26], [0.2, 0.08], [0, 0.0]], 20), 0xf0a8a0, { layer: 0 }));
      for (let k = -2; k <= 2; k++) t.add(kit.mesh(poly([[0, 0.02], [k * 0.07 + 0.012, 0.28], [k * 0.07 - 0.012, 0.28]]), 0xd9887e, { z: 0.002, layer: 0 }));
      t.add(kit.mesh(poly([[-0.08, 0.0], [0.08, 0.0], [0.05, -0.05], [-0.05, -0.05]]), 0xd9887e, { z: 0.003, layer: 0 }));
    } else {              // a mermaid's purse: a dark pouch with curly corners
      t.add(kit.mesh(blob([[-0.2, 0.06], [-0.16, 0.2], [0.16, 0.2], [0.2, 0.06], [0, 0.02]], 16), 0x4a3a2a, { layer: 0 }));
      for (const [cx, cy, s2] of [[-0.2, 0.2, -1], [0.2, 0.2, 1], [-0.2, 0.05, -1], [0.2, 0.05, 1]]) {
        const pts = [];
        for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI * 1.4; pts.push([cx + s2 * (0.04 + Math.sin(a) * 0.08 * (k / 8)), cy + Math.cos(a) * 0.06 * (k / 8) * (cy > 0.1 ? 1 : -1)]); }
        const l = pts.map(([x2, y2]) => [x2, y2 + 0.01]), rr = pts.map(([x2, y2]) => [x2, y2 - 0.01]).reverse();
        t.add(kit.mesh(poly([...l, ...rr]), 0x3a2c20, { z: 0.002, layer: 0 }));
      }
    }
    t.position.y = 0.06;
    t.scale.setScalar(1.7);
    t.visible = false;
    g.add(t);
    const pd = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(0, 0.25, 0.65, 0.45), 14), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    pd.position.z = -0.03;
    g.add(pd);
    g.position.set(x, y - 0.02, 0.2);
    g.userData.mound = mound; g.userData.treasure = t;
    stage.add(g);
    return g;
  });
  // Sand thrown up by digging, pooled.
  const grains = [];
  for (let i = 0; i < 24; i++) {
    const gr = kit.mesh(ellipse(0, 0, 0.05, 0.04), D.sandDeep, { layer: 0 });
    gr.visible = false; gr.position.z = 0.4; gr.userData.live = true;
    stage.add(gr); grains.push(gr);
  }

  // ---- the waterfall ------------------------------------------------------------------
  // The crag it falls from: a tall mossy rock at the island's end.
  const cx = FALLS.x1 + 0.3;
  m(blob([[cx - 1.5, -3], [cx - 1.2, FALLS.top - 1], [cx - 0.6, FALLS.top + 0.3], [cx + 1.5, FALLS.top + 1.4], [cx + 4.5, FALLS.top + 0.6], [cx + 6, -3]], 40), D.crag, -0.32);
  m(blob([[cx - 0.9, FALLS.top + 0.1], [cx - 0.4, FALLS.top + 0.45], [cx + 1.6, FALLS.top + 1.5], [cx + 4.4, FALLS.top + 0.7], [cx + 1.2, FALLS.top + 0.8]], 30), D.cragMoss, -0.319);
  m(blob([[cx + 0.6, 1.2], [cx + 1.4, 2.6], [cx + 2.4, 2.2], [cx + 2.2, 0.8]], 20), D.cragLit, -0.318);
  // The falling water: a pale ribbon, with streaks that slide down it.
  const falls = new THREE.Group();
  const fx = (FALLS.x0 + FALLS.x1) / 2, fb = BOG_LEVEL + 0.05;
  falls.add(kit.mesh(poly([[fx - 0.5, fb], [fx + 0.5, fb], [fx + 0.42, FALLS.top], [cx - 0.55, FALLS.top + 0.25], [fx - 0.42, FALLS.top]]), D.fall, { layer: 0, opacity: 0.7, plain: true }));
  const streaks = [];
  for (let k = 0; k < 9; k++) {
    const sk = kit.mesh(poly([[-0.03, 0], [0.03, 0], [0.03, 0.9], [-0.03, 0.9]]), 0xffffff, { layer: 0, opacity: 0.8, plain: true });
    sk.position.set(fx - 0.35 + k * 0.09, fb + (k * 0.7) % (FALLS.top - fb), 0.002);
    sk.userData = { live: true, x0: sk.position.x };
    falls.add(sk); streaks.push(sk);
  }
  // Foam where it lands, and the pool.
  for (let k = 0; k < 7; k++) falls.add(kit.mesh(ellipse(fx - 0.9 + k * 0.3, fb + 0.02 + (k % 2) * 0.05, 0.22, 0.12), 0xffffff, { z: 0.003, layer: 0, opacity: 0.85, plain: true }));
  falls.position.z = 0.95;
  falls.userData.live = true;
  falls.userData.streaks = streaks;
  parent.add(falls);
  const pool = new THREE.Group();
  pool.position.z = 0.8;
  const lvl = (x) => BOG_LEVEL + 0.02 * Math.sin(x * 3);
  pool.add(kit.mesh(water((x) => lvl(x) + 0.05, 120, 127.2), D.crest, { z: -0.01, layer: 0.8 }));
  pool.add(kit.mesh(water(lvl, 120, 127.2), D.pool, { layer: 0.8 }));
  pool.add(kit.mesh(water((x) => lvl(x) - 0.7, 120, 127.2), D.poolDeep, { z: 0.01, layer: 0.8 }));
  pool.add(kit.mesh(water(lvl, 120, 127.2), D.pool, { z: 0.35, layer: 0.8, opacity: 0.22 }));
  parent.add(pool);

  // The water running off the ledge into the pool.
  m(poly([[FALLS.x0 - 0.05, groundY(FALLS.x0) + 0.02], [FALLS.x0 + 0.35, groundY(FALLS.x0) + 0.02], [FALLS.x0 - 0.35, BOG_LEVEL], [FALLS.x0 - 0.75, BOG_LEVEL]]), D.fall, 0.9, { opacity: 0.6, plain: true });

  // The rainbow: seven soft bands in an arch over the pool, out only when
  // the spray catches the sun (someone is under the falls).
  const rainbow = new THREE.Group();
  const BANDS = [0xe8645a, 0xf29a4a, 0xf2d05a, 0x8cc46a, 0x5aa6d8, 0x6a78c8, 0x9a6ac0];
  const rcx = 123.4, rcy = BOG_LEVEL, R = 3.6;
  BANDS.forEach((hex, i) => {
    const r1 = R - i * 0.16, r0 = r1 - 0.16, pts = [];
    for (let k = 0; k <= 30; k++) { const a = Math.PI * k / 30; pts.push([rcx + Math.cos(a) * r1, rcy + Math.sin(a) * r1]); }
    for (let k = 30; k >= 0; k--) { const a = Math.PI * k / 30; pts.push([rcx + Math.cos(a) * r0, rcy + Math.sin(a) * r0]); }
    const mat = kit.mat(hex, { plain: true, opacity: 0.99 }).clone();
    mat.opacity = 0; mat.transparent = true; mat.depthWrite = false;
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(poly(pts), 30), mat);
    mesh.position.z = i * 0.001;
    rainbow.add(mesh);
  });
  rainbow.position.z = -0.9;
  rainbow.userData.live = true;
  rainbow.userData.fade = (k) => rainbow.children.forEach((c) => { c.material.opacity = 0.55 * k; c.visible = k > 0.01; });
  rainbow.userData.fade(0);
  stage.add(rainbow);

  // Dragonflies: long thin blue bodies, pale see-through wings.
  const dragonflies = [0, 1, 2].map((i) => {
    const g = new THREE.Group();
    g.add(kit.mesh(poly([[-0.3, -0.015], [0.1, -0.02], [0.14, 0.0], [0.1, 0.02], [-0.3, 0.015]]), i === 1 ? 0xc84a4a : 0x3a7ac0, { layer: 0 }));
    g.add(kit.mesh(ellipse(0.14, 0, 0.04), 0x2a3a4a, { z: 0.001, layer: 0 }));
    const wings = new THREE.Group();
    for (const [dx, a] of [[0.02, 0.5], [0.02, -0.5], [-0.06, 0.4], [-0.06, -0.4]]) wings.add(kit.mesh(ellipse(dx, Math.sign(a) * 0.1, 0.05, 0.13, a * 0.3), 0xeef4f8, { layer: 0, opacity: 0.7, plain: true }));
    wings.position.z = 0.002;
    mergeStatic(wings);
    mergeStatic(g);
    g.add(wings);
    g.position.set(117 + i * 1.8, 1.4 + i * 0.3, 0.6);
    g.userData = { live: true, ph: i * 2.1, wings };
    stage.add(g);
    return g;
  });

  return { digs, grains, cotton, falls, rainbow, dragonflies };
}

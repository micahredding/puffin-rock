// Cut paper, in three.js: every thing on Puffin Rock is a few flat shapes —
// soft blobs, ellipses, a triangle for a beak — laid one in front of another
// at slightly different depths. Flat colour, unlit (MeshBasicMaterial), the
// one shared grain multiplied over it. There is no lighting in the show and
// there is none here; depth comes from layers getting paler as they recede.
//
// `makeKit(bake)` is the only way anything gets a material, so the grain, the
// haze and the lift are applied the same way everywhere. `bake` turns a paint
// buffer into a texture in the browser and is `() => null` in Node; either
// way the buffer rides on material.userData, which is what tools/preview.mjs
// draws from.

import * as THREE from './three.js';
import * as paint from './paint.js';

export const CAM_Z = 16;          // how far the camera stands from the stage
// Grain texels per world unit on the stage: about two screen pixels a speck
// on an iPad. Further layers get a coarser repeat so a speck stays a speck.
export const GRAIN_K = 0.18;
export const HAZE = 0xe4ebdf;

export function makeKit(bake = () => null) {
  const grainBuf = paint.grain();
  const base = bake(grainBuf);
  const textures = new Map();
  const mats = new Map();

  function grainFor(z) {
    const k = +(GRAIN_K * CAM_Z / Math.max(2, CAM_Z - z)).toFixed(3);
    if (!base) return { tex: null, k };
    if (!textures.has(k)) {
      const t = base.clone();
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(k, k);
      t.needsUpdate = true;
      textures.set(k, t);
    }
    return { tex: textures.get(k), k };
  }

  // `z` is the layer's depth (for the grain's scale); `haze` 0..1 fades the
  // colour toward the far-away air. Cached: a hundred dandelion stems are one
  // material.
  function mat(hex, { z = 0, haze = 0, opacity = 1, plain = false } = {}) {
    const key = `${hex}|${z}|${haze}|${opacity}|${plain}`;
    if (mats.has(key)) return mats.get(key);
    const c = haze ? paint.mix(hex, HAZE, haze) : hex;
    const { tex, k } = plain ? { tex: null, k: 0 } : grainFor(z);
    const rgb = plain ? [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255] : paint.lift(c);
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace),
      map: tex, side: THREE.DoubleSide,
      transparent: opacity < 1, opacity, depthWrite: opacity >= 1,
    });
    m.userData = { hex: c, paint: plain ? null : grainBuf, repeat: k };
    mats.set(key, m);
    return m;
  }

  // A shape, filled, at depth z inside whatever it is added to.
  function mesh(shape, hex, { z = 0, layer = z, haze = 0, opacity = 1, segments = 24, plain = false } = {}) {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, segments), mat(hex, { z: layer, haze, opacity, plain }));
    m.position.z = z;
    return m;
  }

  return { mat, mesh, grainBuf, bake };
}

// ---- shapes -----------------------------------------------------------------

// A soft closed blob through the given points: the show's everything.
export function blob(points, n = 48) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal');
  return new THREE.Shape(curve.getPoints(n).slice(0, -1).map((p) => new THREE.Vector2(p.x, p.y)));
}

export function ellipse(cx, cy, rx, ry = rx, rot = 0) {
  const s = new THREE.Shape();
  s.absellipse(cx, cy, rx, ry, 0, Math.PI * 2, false, rot);
  return s;
}

export function poly(points) {
  return new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
}

// A band of land: across from x0 to x1 along the curve `top(x)`, down to
// `bottom`. The ground of the stage and every hill behind it is one of these.
export function land(x0, x1, top, bottom = -14, step = 0.25) {
  const pts = [];
  for (let x = x0; x < x1; x += step) pts.push(new THREE.Vector2(x, top(x)));
  pts.push(new THREE.Vector2(x1, top(x1)));
  pts.push(new THREE.Vector2(x1, bottom), new THREE.Vector2(x0, bottom));
  return new THREE.Shape(pts);
}

// Rolling hills as a sum of a few sines, seeded, so every layer has its own
// skyline without anyone drawing one by hand.
export function rolling(seed, { base, amp, scale = 1 }) {
  const r = paint.rng(seed);
  const waves = [0, 1, 2].map((i) => ({ f: (0.08 + r() * 0.1) * (i + 1) / scale, p: r() * 10, a: amp / (i + 1.4) }));
  return (x) => base + waves.reduce((s, w) => s + w.a * Math.sin(x * w.f + w.p), 0);
}

// Glue every mesh under `group` that never moves into ONE mesh per material.
// A painted island is hundreds of little shapes — blades of grass, pebbles,
// stones round a door — and drawn one by one that is hundreds of draw calls a
// frame, which a small GPU feels. Anything that moves or can be tapped is
// marked (`userData.pick` or `userData.live`) and left alone, with everything
// under it.
export function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert();
  const buckets = new Map();
  const victims = [];
  const walk = (o) => {
    for (const ch of o.children) {
      if (ch.userData.pick || ch.userData.live) continue;
      // Only a mesh with nothing hung on it can go (a fish's tail rides its
      // fish); the rest are walked into.
      if (ch.isMesh && ch.visible && ch.children.length === 0) {
        if (!buckets.has(ch.material)) buckets.set(ch.material, []);
        buckets.get(ch.material).push({ geo: ch.geometry, m: inv.clone().multiply(ch.matrixWorld) });
        victims.push(ch);
      }
      walk(ch);
    }
  };
  walk(group);
  for (const m of victims) m.parent.remove(m);
  const v = new THREE.Vector3();
  for (const [mat, list] of buckets) {
    let nv = 0, ni = 0;
    for (const { geo } of list) { nv += geo.attributes.position.count; ni += geo.index ? geo.index.count : geo.attributes.position.count; }
    const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
    const idx = new (nv > 65535 ? Uint32Array : Uint16Array)(ni);
    let ov = 0, oi = 0;
    for (const { geo, m } of list) {
      const p = geo.attributes.position, u = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m);
        pos[(ov + i) * 3] = v.x; pos[(ov + i) * 3 + 1] = v.y; pos[(ov + i) * 3 + 2] = v.z;
        if (u) { uv[(ov + i) * 2] = u.getX(i); uv[(ov + i) * 2 + 1] = u.getY(i); }
      }
      if (geo.index) for (let i = 0; i < geo.index.count; i++) idx[oi + i] = geo.index.getX(i) + ov;
      else for (let i = 0; i < p.count; i++) idx[oi + i] = ov + i;
      ov += p.count; oi += geo.index ? geo.index.count : p.count;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    group.add(new THREE.Mesh(g, mat));
  }
}

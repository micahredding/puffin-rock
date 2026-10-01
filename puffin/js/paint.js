// The paper Puffin Rock is painted on, made rather than loaded. The show's
// look is flat colour cut into soft round shapes, with a fine grain over all
// of it: pale specks, darker specks, and here and there a tiny ring like a
// bubble in the paint. The SHAPES are geometry (see shapes.js) so their edges
// stay crisp at any size; this file paints the one thing that is texture —
// the grain — into a plain {w, h, px} buffer with a seeded generator, so the
// tests can assert on it and Node never needs a canvas.
//
// ONE grain for everything. It is a near-white sheet that every surface's
// colour multiplies: the paper's base sits a little under white (GRAIN_BASE),
// so darker specks darken, and rings and pale specks — brighter than the base
// — can LIGHTEN a colour, which a plain multiply could never do. `lift()`
// raises each colour by the same factor so the base reads true.

// mulberry32 — the same tiny seeded PRNG the other games use.
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buffer(w, h) {
  return { w, h, px: new Uint8ClampedArray(w * h * 4) };
}

export const GRAIN_BASE = 222;
export const GRAIN_SIZE = 256;

// A colour for a surface, as sRGB 0..1 triples, lifted to sit under the grain.
export function lift(hex) {
  const k = 255 / GRAIN_BASE;
  return [((hex >> 16) & 255) / 255 * k, ((hex >> 8) & 255) / 255 * k, (hex & 255) / 255 * k];
}

// Mix two 0xRRGGBB colours: the haze that makes far layers pale.
export function mix(a, b, t) {
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

// Put one grey into a pixel, wrapping both ways: the grain tiles.
function blend(buf, x, y, v, a) {
  const { w, h, px } = buf;
  const xi = ((Math.round(x) % w) + w) % w, yi = ((Math.round(y) % h) + h) % h;
  const i = (yi * w + xi) * 4;
  for (let c = 0; c < 3; c++) px[i + c] = px[i + c] * (1 - a) + v * a;
}

export function grain(seed = 7) {
  const r = rng(seed);
  const N = GRAIN_SIZE;
  const b = buffer(N, N);
  // The paper: base grey, a whisper of per-pixel wobble.
  for (let i = 0; i < N * N; i++) {
    const v = GRAIN_BASE + (r() * 2 - 1) * 3;
    b.px[i * 4] = b.px[i * 4 + 1] = b.px[i * 4 + 2] = v;
    b.px[i * 4 + 3] = 255;
  }
  // Big soft mottling, so a wide field of one colour is not a flat card.
  for (let d = 0; d < 40; d++) {
    const cx = r() * N, cy = r() * N, rad = 18 + r() * 40;
    const v = GRAIN_BASE + (r() < 0.5 ? -9 : 7);
    for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
      const q = Math.hypot(x, y) / rad;
      if (q < 1) blend(b, cx + x, cy + y, v, 0.18 * (1 - q) * (1 - q));
    }
  }
  // Specks: darker ones and paler ones, one or two pixels each.
  for (let d = 0; d < 1500; d++) {
    const x = r() * N, y = r() * N;
    const dark = r() < 0.55;
    const v = dark ? GRAIN_BASE - 14 - r() * 10 : GRAIN_BASE + 14 + r() * 16;
    blend(b, x, y, v, 0.8);
    if (r() < 0.35) blend(b, x + 1, y, v, 0.5);
  }
  // Bubble rings: a thin pale circle, a few pixels across.
  for (let d = 0; d < 22; d++) {
    const cx = r() * N, cy = r() * N, rad = 1.4 + r() * 2;
    const steps = Math.ceil(rad * 7);
    for (let k = 0; k < steps; k++) {
      const a = (k / steps) * Math.PI * 2;
      blend(b, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 246, 0.45);
    }
  }
  return b;
}

// The sky: a tall strip, top to bottom, that the camera carries behind
// everything. Soft blue overhead to a pale warm haze at the horizon.
export function sky(top = [176, 212, 222], bottom = [234, 238, 226], seed = 44) {
  const r = rng(seed);
  const b = buffer(8, 256);
  for (let y = 0; y < b.h; y++) {
    const t = y / (b.h - 1);
    const e = t * t * (3 - 2 * t);
    for (let x = 0; x < b.w; x++) {
      const i = (y * b.w + x) * 4, j = (r() * 2 - 1) * 0.4;
      for (let c = 0; c < 3; c++) b.px[i + c] = top[c] + (bottom[c] - top[c]) * e + j;
      b.px[i + 3] = 255;
    }
  }
  return b;
}

export function average(buf) {
  let r = 0, g = 0, bl = 0;
  const n = buf.w * buf.h;
  for (let i = 0; i < n; i++) { r += buf.px[i * 4]; g += buf.px[i * 4 + 1]; bl += buf.px[i * 4 + 2]; }
  return [r / n, g / n, bl / n];
}

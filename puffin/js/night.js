// DAY AND NIGHT on the real clock. Puffin Rock's evenings go orange, then
// blue, and the stars come out; at night fireflies blink in the reeds and
// the meadow, the hedgehog comes out for his supper, the burrow door glows
// warm, Mama calls them in to bed, and in the sea the plankton lights up
// wherever Oona swims. Tap the sun to say goodnight to it, and the moon to
// bring the morning, whatever the clock says.
//
// How the dark is made: everything on the island is flat, unlit paper, so
// night is a single sheet of blue glass held just in front of the camera,
// MULTIPLYING every colour behind it (the veil). Things that give their own
// light — stars, the moon, fireflies, plankton, the glowing door — are drawn
// after the veil (GLOW render order), so they shine at full brightness.
//
// `daylight(hour)` and `tint(k, rain)` are pure, for the tests.

import * as THREE from './three.js';
import { ellipse, poly } from './shapes.js';
import { groundY, STOPS, POND } from './ground.js';
import { makeHedgehog, settle } from './cast.js';

export const GLOW = 60;

// 1 in the day, 0 at night; the evening from half past six to eight, the
// morning from six to seven.
export function daylight(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 7 && h < 18.5) return 1;
  if (h >= 18.5 && h < 20) return 1 - (h - 18.5) / 1.5;
  if (h >= 6 && h < 7) return h - 6;
  return 0;
}

// The veil's colour: white by day (no change), a warm orange in between,
// deep blue at night; a grey wash on top when it rains.
export function tint(k, rain = 0) {
  const day = [1, 1, 1], dusk = [1, 0.76, 0.64], night = [0.28, 0.34, 0.6], wet = [0.8, 0.83, 0.88];
  const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
  const c = k < 0.5 ? mix(night, dusk, k * 2) : mix(dusk, day, (k - 0.5) * 2);
  return c.map((v, i) => v * (1 - rain + rain * wet[i]));
}

function glowMesh(kit, shape, hex, opacity = 0.99) {
  const m = kit.mesh(shape, hex, { layer: 0, plain: true, opacity });
  m.renderOrder = GLOW;
  return m;
}

export function installNight(ctx) {
  const { kit, island, cast, camera, stage, oona, sound } = ctx;
  const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const fixedHour = params.has('hour') ? Number(params.get('hour')) : null;
  const clockHour = () => {
    if (fixedHour !== null) return fixedHour;
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  };

  // The veil, carried by the camera.
  if (!camera.parent) stage.scene.add(camera);
  const veilMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, blending: THREE.MultiplyBlending, premultipliedAlpha: true,
    transparent: true, depthTest: false, depthWrite: false,
  });
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), veilMat);
  veil.position.z = -1;
  veil.renderOrder = GLOW - 10;
  veil.visible = false;
  camera.add(veil);

  // The sky's lights, carried along with the sky.
  const skyLights = new THREE.Group();
  stage.scene.add(skyLights);
  const stars = [];
  const starMat = kit.mat(0xfff8d8, { plain: true, opacity: 0.99 }).clone();
  starMat.transparent = true; starMat.depthWrite = false;
  for (let i = 0; i < 46; i++) {
    const s = 0.12 + ((i * 37) % 10) / 40;
    const st = new THREE.Mesh(new THREE.ShapeGeometry(poly([[0, s], [s * 0.25, s * 0.25], [s, 0], [s * 0.25, -s * 0.25], [0, -s], [-s * 0.25, -s * 0.25], [-s, 0], [-s * 0.25, s * 0.25]])), starMat);
    st.position.set(((i * 71) % 100) / 100 * 64 - 32, 4 + ((i * 53) % 100) / 100 * 16, -66);
    st.renderOrder = GLOW;
    st.userData.ph = i * 1.7;
    skyLights.add(st);
    stars.push(st);
  }
  const moon = new THREE.Group();
  moon.add(glowMesh(kit, ellipse(0, 0, 1.6), 0xf6f0d4));
  moon.add(glowMesh(kit, ellipse(-0.5, 0.3, 0.3), 0xe4dcbc));
  moon.add(glowMesh(kit, ellipse(0.45, -0.4, 0.22), 0xe4dcbc));
  moon.children.forEach((c, i) => { c.position.z = i * 0.01; });
  moon.userData = { pick: 'moon' };
  skyLights.add(moon);
  const sun = new THREE.Group();
  sun.add(kit.mesh(ellipse(0, 0, 1.9), 0xf7d77a, { layer: 0, plain: true }));
  sun.add(kit.mesh(ellipse(0, 0, 2.6), 0xf9e8b0, { z: -0.01, layer: 0, plain: true, opacity: 0.5 }));
  sun.userData = { pick: 'sun' };
  skyLights.add(sun);

  // Fireflies: by the pond's reeds and over the meadow.
  const fireflies = [];
  for (let i = 0; i < 18; i++) {
    const g = new THREE.Group();
    g.add(glowMesh(kit, ellipse(0, 0, 0.06), 0xf4ffa0));
    g.add(glowMesh(kit, ellipse(0, 0, 0.2), 0xe0ff80, 0.3));
    const pond = i < 9;
    const x0 = pond ? -82 + (i / 8) * 17 : -8 + ((i - 9) / 8) * 20;
    g.userData = { x0, y0: pond ? POND + 0.6 + (i % 3) * 0.5 : 0.6 + (i % 3) * 0.55, ph: i * 2.3 };
    g.position.set(x0, g.userData.y0, 0.6);
    g.visible = false;
    island.world.add(g);
    fireflies.push(g);
  }
  // The plankton's glow, pooled, left behind her as she swims at night.
  const plankton = [];
  for (let i = 0; i < 60; i++) {
    const p = glowMesh(kit, ellipse(0, 0, 0.05), 0x9ff6ff);
    p.visible = false; p.position.z = 0.95;
    island.world.add(p);
    plankton.push({ p, life: 0 });
  }
  // The burrow door, lit from inside.
  const doorGlow = glowMesh(kit, ellipse(STOPS.burrow.x, 0.45, 0.62, 0.5), 0xf2b85a, 0.55);
  doorGlow.position.z = -1.3;
  doorGlow.visible = false;
  island.world.add(doorGlow);
  // The hedgehog out for his supper, snuffling up and down the meadow.
  const hog = makeHedgehog(kit);
  settle(hog);
  hog.root.userData = { live: true, pick: 'nighthog', stop: 0 };
  hog.root.visible = false;
  island.stage.add(hog.root);
  cast.nighthog = hog;
  island.byName.nighthog = hog.root;
  island.things.push(hog.root, moon, sun);
  const pad = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(0, 0.25, 0.7, 0.45), 12), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  pad.position.z = -0.03; hog.root.add(pad);

  let k = daylight(clockHour());
  let override = null, overrideUntil = 0;
  let wasDark = k < 0.3;
  let hogCurl = 0, plankClock = 0;

  const api = {
    get k() { return k; },
    dark: () => k < 0.35,
    act(name) {
      if (name === 'nighthog') {
        hogCurl = performance.now() + 2500;
        hog.face.visible = false; hog.ball.visible = true;
        sound.squish();
        ctx.once('hedgehog-night');
        return true;
      }
      return false;
    },
    tap(name) {
      if (name === 'sun') { override = 0; overrideUntil = performance.now() + 10 * 60000; ctx.say('sun-down'); sound.dusk?.(); return true; }
      if (name === 'moon') { override = 1; overrideUntil = performance.now() + 10 * 60000; ctx.say('sun-up'); sound.dawn?.(); return true; }
      return false;
    },
    update(t, dt, now) {
      if (override !== null && now > overrideUntil) override = null;
      const target = override !== null ? override : daylight(clockHour());
      k += (target - k) * Math.min(1, dt * 0.35);
      if (Math.abs(target - k) < 0.002) k = target;
      const onIsland = ctx.where === 'island';
      // Coming into the night, and the morning.
      const dark = k < 0.3;
      if (dark && !wasDark) { ctx.say(onIsland ? 'night' : 'goodnight', { kind: 'event', ttl: 15000 }); ctx.award('night'); }
      if (!dark && wasDark && k > 0.7) { ctx.say('morning', { kind: 'event', ttl: 15000 }); wasDark = false; }
      if (dark) wasDark = true;
      if (dark && onIsland && Math.abs(oona.s.x - STOPS.burrow.x) < 5) ctx.once('bedtime', { kind: 'event', ttl: 6000 });
      if (dark && ctx.napping) ctx.once('goodnight', { kind: 'event', ttl: 5000, still: () => ctx.napping });
      if (dark && onIsland && fireflies.some((f) => Math.abs(f.position.x - oona.s.x) < 6)) ctx.once('fireflies', { auto: true });

      const nightK = Math.max(0, 1 - k * 2.5);          // 1 when fully dark
      for (const f of fireflies) {
        const u = f.userData;
        f.visible = onIsland && nightK > 0.05;
        f.position.x = u.x0 + Math.sin(t * 0.3 + u.ph) * 1.2;
        f.position.y = u.y0 + Math.sin(t * 0.7 + u.ph * 1.3) * 0.35;
        const blink = Math.max(0, Math.sin(t * 1.6 + u.ph));
        f.scale.setScalar(0.3 + blink * 0.9 * nightK);
      }
      doorGlow.visible = onIsland && nightK > 0.1;
      // The hedgehog, at night only.
      hog.root.visible = onIsland && nightK > 0.3;
      if (hog.root.visible) {
        if (hogCurl && now > hogCurl) { hogCurl = 0; hog.face.visible = true; hog.ball.visible = false; }
        const x = 1.5 + Math.sin(t * 0.09) * 7.5, face = Math.cos(t * 0.09) >= 0 ? 1 : -1;
        if (!hogCurl) hog.root.position.set(x, groundY(x), -0.2);
        hog.root.userData.stop = hog.root.position.x;
        hog.flip = face; hog.root.scale.x = face;
      }
      // Plankton, where she swims in the dark.
      if (onIsland && nightK > 0.3 && oona.s.mode === 'dive' && (plankClock += dt) > 0.04) {
        plankClock = 0;
        const free = plankton.find((q) => !q.p.visible);
        if (free) { free.p.visible = true; free.life = 0; free.p.position.set(oona.s.x - oona.s.facing * 0.3 + (Math.random() - 0.5) * 0.5, oona.s.y + 0.4 + (Math.random() - 0.5) * 0.6, 0.95); ctx.once('plankton', { auto: true }); }
      }
      for (const q of plankton) {
        if (!q.p.visible) continue;
        q.life += dt;
        q.p.scale.setScalar(Math.max(0.01, 1.4 - q.life * 0.7));
        if (q.life > 2) q.p.visible = false;
      }
    },
    // After the camera has moved: the veil's colour, the sky's lights.
    late(t, dt, rain = 0) {
      const c = tint(k, rain);
      veilMat.color.setRGB(c[0], c[1], c[2]);
      veil.visible = c[0] < 0.999 || c[2] < 0.999;
      skyLights.position.set(camera.position.x, camera.position.y, 0);
      const nightK = Math.max(0, 1 - k * 2.5);
      starMat.opacity = nightK * 0.95;
      for (const st of stars) { st.visible = nightK > 0.02; st.scale.setScalar(0.7 + 0.3 * Math.sin(t * 2 + st.userData.ph)); }
      // The sun sets toward the horizon; the moon rises as it goes.
      sun.position.set(14, -2 + 14 * Math.min(1, k * 1.4), -60);
      sun.visible = k > 0.08;
      moon.position.set(-12, 12 - 14 * Math.min(1, k * 1.6), -61);
      moon.visible = k < 0.8;
    },
    state: () => ({ k: +k.toFixed(3), override }),
  };
  return api;
}

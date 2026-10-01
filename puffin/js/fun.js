// Little things to do and find, all over the island, each its own kind:
//
//   FLY WITH PAPA   tap Papa and he takes off; Oona follows him on a long
//                   swoop out over the meadow and the rocks and home again
//   STAY STILL      stand still in the meadow and a butterfly comes and lands
//                   on Oona's head — and then a bumblebee
//   RAIN            tap the grey cloud (or wait: it rains now and then);
//                   puddles come up on the path, for splashing in
//   HIDE AND SEEK   tap Baba (with no fish to give him) and he hides; follow
//                   his giggles to find him
//
// and, to be found: footprints on the sand that the waves wash away; the
// neighbours popping up from their burrows to wave; Oona calling hello (tap
// her), which echoes in the fungus cave; the frog catching a fly; bunnies in
// holes in the meadow; the larder mouse's snack; Silky's pup.
//
// installFun(ctx) returns hooks the game calls: act(name) and tap(name) to
// claim a tap, update and late each frame, pose(c) to take over a
// character's pose, and holdsOona / holdsBaba while it is moving them.

import * as THREE from './three.js';
import { blob, ellipse, poly, mergeStatic } from './shapes.js';
import { groundY, STOPS, SURFACE } from './ground.js';
import { makeRabbit, makeSilky, settle } from './cast.js';
import { COUNT, cycle } from './lines.js';
import { PANTRY, pantryFloor } from './under.js';

const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

// Papa's flight: out from the burrow, over the meadow and the rocks, a turn
// above the top of the slide, and home. Oona a little way behind him.
export const PAPA_PATH = [[-12.4, 0], [-11, 1.8], [-7, 4.5], [0, 6.2], [8, 5.6], [15, 6.8], [22, 6.4], [27.5, 5.4], [30.5, 4.6], [30.2, 5.4], [25, 5.4], [18, 4.9], [9, 5.4], [0, 5.8], [-7, 4.2], [-10.8, 1.6], [-12.4, 0]];
export const PAPA_SECONDS = 18;

// Where Baba can hide: behind three gorse bushes in the meadow, behind the
// burrow's mound, behind May's.
export const GORSE = [-6.4, 0.9, 7.2];
export const SPOTS = [
  ...GORSE.map((x) => ({ x, z: 0.05, bush: true })),
  { x: -13.6, z: -1.6 },
  { x: 14.6, z: -1.35 },
];
export const PUDDLES = [-9.6, -2.9, 3.8];
export const BUNNY_HOLES = [-3.2, 4.1];
export const PUP_X = 73.6;
export const onSand = (x) => (x > 36.8 && x < 40.3) || (x > 98.4 && x < 116.3);

export function installFun(ctx) {
  const { kit, island, cast, oona, baba, sound, voice } = ctx;
  const stage = island.stage;
  const byName = island.byName;
  const invisible = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
  const padFor = (obj, cx, cy, rx, ry) => {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(cx, cy, rx, ry), 14), invisible);
    m.position.z = -0.03; obj.add(m);
  };
  const addThing = (obj, name, stop) => {
    obj.userData.pick = name; obj.userData.stop = stop;
    byName[name] = obj; island.things.push(obj);
  };

  // ---- scenery for it all -------------------------------------------------------
  // Gorse: dark spiky green, yellow flowers (the grassland pictures').
  const bushes = GORSE.map((x, i) => {
    const g = new THREE.Group();
    const y = groundY(x);
    g.add(kit.mesh(blob([[-0.75, 0], [-0.7, 0.55], [-0.35, 1.05], [0.1, 1.2], [0.55, 1.0], [0.78, 0.5], [0.72, 0]], 30), 0x4e6e34, { layer: 0 }));
    g.add(kit.mesh(blob([[-0.5, 0.5], [-0.2, 0.95], [0.3, 1.0], [0.5, 0.6], [0.1, 0.7]], 20), 0x62843e, { z: 0.002, layer: 0 }));
    for (let k = 0; k < 16; k++) {
      const a = (k * 2.399) % (Math.PI * 2), rr = 0.25 + ((k * 37) % 10) / 20;
      g.add(kit.mesh(ellipse(Math.cos(a) * rr * 0.9, 0.55 + Math.sin(a) * rr * 0.55, 0.06), 0xf2c83a, { z: 0.004, layer: 0 }));
    }
    mergeStatic(g);
    g.position.set(x, y - 0.05, 0.5);
    g.userData = { live: true };
    stage.add(g);
    return g;
  });

  // The rain cloud: low and grey, over the meadow. It breathes; tap it.
  const cloud = new THREE.Group();
  for (let k = 0; k < 5; k++) cloud.add(kit.mesh(ellipse((k - 2) * 0.85, Math.sin(k * 1.7) * 0.3, 1.0 + (k % 2) * 0.3, 0.7 + (k % 3) * 0.12), k % 2 ? 0x9aa4ac : 0xb0b8be, { z: k * 0.01, layer: -6 }));
  mergeStatic(cloud);
  cloud.position.set(2.4, 8.6, -6);
  addThing(cloud, 'raincloud', 2.4);
  island.world.add(cloud);
  // Raindrops, pooled, around wherever the camera is.
  const drops = [];
  for (let i = 0; i < 90; i++) {
    const d = kit.mesh(poly([[-0.012, 0], [0.012, 0], [0.012, 0.34], [-0.012, 0.34]]), 0xdcebf2, { layer: 0, plain: true, opacity: 0.6 });
    d.visible = false; d.position.z = 1.6;
    island.world.add(d);
    drops.push(d);
  }
  const puddles = PUDDLES.map((x) => {
    const p = kit.mesh(ellipse(0, 0, 0.8, 0.09), 0xa6c0ca, { layer: 0, opacity: 0.85 });
    p.position.set(x, groundY(x) + 0.01, 0.14);
    p.scale.set(0.001, 1, 1);
    p.visible = false;
    p.userData = { k: 0, oonaIn: false, babaIn: false };
    stage.add(p);
    return p;
  });

  // The butterfly (a common blue) and the bumblebee.
  const makeWinged = (body, wingHex, wingShape, bodyShape) => {
    const g = new THREE.Group();
    const wings = [-1, 1].map((sd) => {
      const w = new THREE.Group();
      w.add(kit.mesh(wingShape(sd), wingHex, { layer: 0, opacity: wingHex === 0xeef4f8 ? 0.7 : 0.99, plain: wingHex === 0xeef4f8 }));
      g.add(w); return w;
    });
    g.add(kit.mesh(bodyShape, body, { z: 0.004, layer: 0 }));
    g.userData = { wings, live: true };
    g.visible = false;
    g.position.z = 0.35;
    island.world.add(g);
    return g;
  };
  const butterfly = makeWinged(0x3a3450, 0x6f8fe0, (sd) => blob([[0, 0], [sd * 0.2, 0.2], [sd * 0.3, 0.1], [sd * 0.22, -0.08], [sd * 0.08, -0.12]], 16), poly([[-0.02, -0.12], [0.02, -0.12], [0.02, 0.1], [-0.02, 0.1]]));
  const bee = makeWinged(0xf2c030, 0xeef4f8, (sd) => ellipse(sd * 0.08, 0.12, 0.08, 0.12, sd * 0.4), ellipse(0, 0, 0.14, 0.1));
  bee.add(kit.mesh(poly([[-0.05, -0.1], [-0.02, -0.1], [-0.02, 0.1], [-0.05, 0.1]]), 0x2a2420, { z: 0.006, layer: 0 }));
  bee.add(kit.mesh(poly([[0.03, -0.1], [0.06, -0.1], [0.06, 0.1], [0.03, 0.1]]), 0x2a2420, { z: 0.006, layer: 0 }));

  // Footprints, pooled: a little three-toed print.
  const prints = [];
  for (let i = 0; i < 44; i++) {
    const f = kit.mesh(blob([[-0.02, -0.04], [0.1, 0.02], [0.02, 0.0], [0.08, -0.06], [0.0, -0.02], [0.02, -0.1]], 12), 0xa88e5c, { layer: 0 });
    f.visible = false; f.position.z = 0.02;
    stage.add(f);
    prints.push({ f, life: 0, max: 8 });
  }

  // Bunny holes in the meadow, with a bunny in each.
  const bunnies = BUNNY_HOLES.map((x, i) => {
    const g = new THREE.Group();
    const y = groundY(x);
    g.add(kit.mesh(blob([[-1.1, -0.3], [-0.5, 0.55], [0.5, 0.6], [1.1, -0.3]], 24), 0xa0b858, { layer: 0 }));
    g.add(kit.mesh(ellipse(0, 0.2, 0.32, 0.26), 0x3d3228, { z: 0.002, layer: 0 }));
    mergeStatic(g);
    g.position.set(x, y, -1.1);
    stage.add(g);
    const r = makeRabbit(kit, i ? 0xa39584 : 0x8a7f74);
    r.rig.scale.setScalar(0.62);
    settle(r);
    r.root.userData.live = true;
    r.flip = i ? -1 : 1; r.root.scale.x = r.flip;
    r.root.position.set(x, y - 0.95, -1.15);
    r.root.visible = false;
    stage.add(r.root);
    const hole = new THREE.Group();
    padFor(hole, 0, 0.5, 0.8, 0.6);
    hole.position.set(x, y, -1.0);
    stage.add(hole);
    addThing(hole, `bunny-${i}`, x);
    return { r, x, y, t: -1 };
  });

  // Silky's pup, bobbing by her rock.
  const pup = makeSilky(kit);
  pup.rig.scale.setScalar(0.5);
  settle(pup);
  pup.root.userData.live = true;
  pup.flip = -1; pup.root.scale.x = -1;
  pup.root.position.set(PUP_X, SURFACE - 0.12, 0.9);
  padFor(pup.root, 0, 0.3, 0.9, 0.5);
  island.world.add(pup.root);
  addThing(pup.root, 'pup', PUP_X);

  // The frog's fly, and its tongue.
  const fly = kit.mesh(ellipse(0, 0, 0.05, 0.04), 0x2a2a2a, { layer: 0 });
  fly.visible = false; fly.position.z = 0.95;
  island.world.add(fly);
  const tongue = kit.mesh(poly([[0, -0.018], [1, -0.012], [1, 0.012], [0, 0.018]]), 0xe8808a, { layer: 0 });
  tongue.visible = false; tongue.position.z = 0.94;
  island.world.add(tongue);

  // A dark sheet for hide and seek's "eyes shut".
  let dimEl = null;
  if (typeof document !== 'undefined') {
    dimEl = document.createElement('div');
    dimEl.style.cssText = 'position:fixed;inset:0;background:#0e1420;opacity:0;pointer-events:none;transition:opacity 500ms;z-index:14';
    document.body.appendChild(dimEl);
  }
  const dim = (on) => { if (dimEl) dimEl.style.opacity = on ? '0.82' : '0'; };

  // ---- state -----------------------------------------------------------------------
  let flight = null;                 // Papa's flight in progress
  let still = { t: 0, bf: 'away', bee: 'away', bfT: 0, beeT: 0 };
  let rainUntil = 0, rainK = 0, nextRain = performance.now() + 4 * 60000, patter = 0;
  let hide = null;                   // { phase, spot, t, giggle }
  let lastPrint = { x: null, side: 1 }, lastBabaPrint = null;
  const nbState = island.neighbours.map(() => ({ u: 0, t: -1, cool: false }));
  let frogFly = { t: -1, next: performance.now() + 6000 };
  let nibble = { t: -1, next: 0, from: 0 };
  let pupT = -1, pupNext = performance.now() + 7000, pupSpin = -1;
  let echoDone = false, caveEnter = 0;
  let oonaTaps = 0;

  const curve = new THREE.CatmullRomCurve3(PAPA_PATH.map(([x, y]) => new THREE.Vector3(x, y, 0)));

  function startFlight() {
    if (flight || ctx.busy) return;
    ctx.busy = true; oona.stop();
    flight = { t: 0, fact: false, end: false };
    sound.flap();
    ctx.say('papa-fly');
    ctx.hop(cast.papa);
  }
  function endFlight() {
    flight = null;
    ctx.busy = false;
    cast.papa.root.position.set(STOPS.papa.x, groundY(STOPS.papa.x), -0.6);
    cast.papa.flip = -1;
    oona.place(STOPS.papa.x + 1.3);
    oona.s.facing = -1;
    ctx.award('papa');
  }

  function startRain(ms = 26000) {
    if (ctx.where !== 'island') return;
    const was = rainUntil > performance.now();
    rainUntil = performance.now() + ms;
    nextRain = performance.now() + 7 * 60000;
    if (!was) { ctx.say('rain', 'event'); sound.rain(); }
  }

  function startHide() {
    if (hide || ctx.busy) return false;
    const x = oona.s.x;
    const choices = SPOTS.filter((sp) => Math.abs(sp.x - x) > 3.5 && Math.abs(sp.x - x) < 14);
    if (!choices.length) return false;
    const spot = choices[Math.floor(Math.random() * choices.length)];
    hide = { phase: 'count', spot, t: 0, giggle: 2 };
    ctx.busy = true; oona.stop();
    ctx.say('hide-start').then(() => {
      if (!hide) return;
      dim(true);
      baba.place(spot.x);
      return ctx.say([COUNT(1), COUNT(2), COUNT(3), COUNT(4), COUNT(5), 'hide-ready']);
    }).then(() => {
      if (!hide) return;
      dim(false);
      hide.phase = 'seek'; hide.t = 0;
      ctx.busy = false;
    });
    return true;
  }

  function foundBaba() {
    const spot = hide.spot;
    hide = null;
    baba.place(spot.x + (oona.s.x < spot.x ? -0.6 : 0.6));
    ctx.hop(cast.baba);
    sound.happy();
    ctx.award('hide');
    ctx.say('hide-found');
  }

  const api = {
    holdsOona: () => !!flight,
    holdsBaba: () => !!hide,
    act(name) {
      if (name === 'papa') { startFlight(); return true; }
      if (name.startsWith('bunny-')) {
        const b = bunnies[+name.split('-')[1]];
        if (b.t < 0) { b.t = 0; b.r.root.visible = true; sound.hop(); ctx.once('bunny'); }
        return true;
      }
      if (name === 'pup') { pupSpin = 0; ctx.splashUp(PUP_X, SURFACE, 12); ctx.once('pup'); return true; }
      return false;
    },
    tap(name) {
      if (name === 'raincloud') { startRain(); sound.rain(); return true; }
      if (name === 'oona') {
        ctx.hop(cast.oona);
        if (ctx.where === 'under' && ctx.room === 'cave') { ctx.say('hello-echo').then?.(() => {}); voice.echo('hello-echo'); }
        else ctx.say(cycle('oona', oonaTaps++));
        return true;
      }
      if (name === 'baba' && !ctx.carried && ctx.where === 'island' && oona.s.x > -24 && oona.s.x < 16 && !hide) return startHide();
      if (name === 'baba' && hide) return true;
      return false;
    },
    pose(c) {
      if (flight && c === cast.papa) return { mode: 'fly', facing: flight.papaFacing };
      if (hide && c === cast.baba && hide.phase === 'seek' && hide.peek > 0) return { mode: 'stand', facing: oona.s.x < hide.spot.x ? -1 : 1 };
      return null;
    },
    update(t, dt, now) {
      const onIsland = ctx.where === 'island';
      // ---- Papa's flight ----
      if (flight) {
        flight.t += dt;
        const u = Math.min(1, flight.t / PAPA_SECONDS);
        const ease = u < 0.06 ? u * u / 0.12 : u;       // a gentle take-off
        const pu = Math.min(1, ease), ou = Math.max(0, pu - 0.035);
        const pp = curve.getPointAt(pu), pn = curve.getPointAt(Math.min(1, pu + 0.01));
        const op = curve.getPointAt(ou), on = curve.getPointAt(Math.min(1, ou + 0.01));
        flight.papa = pp;
        flight.papaFacing = pn.x >= pp.x ? 1 : -1;
        oona.s.x = op.x; oona.s.y = op.y; oona.s.mode = u < 0.99 ? 'fly' : 'stand';
        oona.s.facing = on.x >= op.x ? 1 : -1; oona.s.vx = on.x - op.x; oona.s.vy = on.y - op.y;
        if (Math.floor(flight.t / 0.3) !== Math.floor((flight.t - dt) / 0.3)) sound.flap();
        if (Math.floor(flight.t / 2.2) !== Math.floor((flight.t - dt) / 2.2)) ctx.hop(cast.baba);
        if (!flight.fact && u > 0.4) { flight.fact = true; ctx.say('papa-fly-fact', { kind: 'event', ttl: 4000, still: () => !!flight }); }
        if (!flight.end && u > 0.88) { flight.end = true; ctx.say('papa-fly-end', { kind: 'event', ttl: 5000 }); }
        if (u >= 1) endFlight();
      }

      // ---- staying still in the meadow ----
      const inMeadow = onIsland && oona.s.x > -9 && oona.s.x < 15;
      const quiet = now - ctx.lastInput > 2000 && oona.s.mode === 'stand' && !ctx.busy && !hide;
      // Stillness needs QUIET, not just no tapping: nobody should be talking
      // (May introducing her family, the narrator) when the butterfly comes.
      const hush = !ctx.speech.busy && !ctx.speech.speaking;
      const canLand = inMeadow && quiet && hush && ctx.daylight > 0.6 && rainK < 0.2;
      const head = { x: oona.s.x + oona.s.facing * 0.1, y: oona.s.y + 1.6 };
      const back = { x: oona.s.x - oona.s.facing * 0.28, y: oona.s.y + 1.05 };
      const moving = !quiet || !inMeadow;
      // The butterfly is always about in the meadow on a fine day, flitting
      // from flower to flower where he can see it (show before you need).
      // Stand still and it comes over and lands on her head. The bee only
      // ever comes to someone already wearing a butterfly.
      const outside = onIsland && ctx.daylight > 0.6 && rainK < 0.2 && oona.s.x > -14 && oona.s.x < 20;
      if (still.bf === 'away' && outside) { still.bf = 'wander'; still.wx = Math.min(13, Math.max(-7, oona.s.x + 4)); butterfly.visible = true; butterfly.position.set(still.wx, groundY(still.wx) + 1.6, 0.35); }
      if (still.bf === 'wander') {
        if (!outside) { still.bf = 'away'; butterfly.visible = false; }
        else {
          // Drifts to a spot a little way from her, never quite on her.
          const want = Math.min(13, Math.max(-7, oona.s.x + (Math.sin(t * 0.21) > 0 ? 3.2 : -3.2)));
          still.wx += (want - still.wx) * Math.min(1, dt * 0.25);
          const x = still.wx + Math.sin(t * 0.9) * 0.9, y = groundY(x) + 1.05 + Math.abs(Math.sin(t * 1.7)) * 0.7;
          butterfly.position.set(x, y, 0.35);
          butterfly.scale.x = Math.cos(t * 0.9) >= 0 ? 1 : -1;
        }
      }
      const fly2 = (who, state, key, target, wait) => {
        const g = who;
        const ready = key === 'bf' ? state.bf === 'wander' || state.bf === 'away' : state.bee === 'away' && state.bf === 'landed';
        if (ready && canLand && still.t > wait) {
          state[key] = 'coming'; state[key + 'T'] = 0;
          g.userData.from = key === 'bf' && g.visible ? { x: g.position.x, y: g.position.y } : { x: oona.s.x - 7, y: oona.s.y + 4 + Math.random() };
          g.scale.x = 1;
          g.visible = true;
          if (key === 'bf') ctx.once('still-shh', { kind: 'event', ttl: 2000, still: () => still.bf === 'coming' });
        }
        if (state[key] !== 'away' && state[key] !== 'wander' && moving && state[key] !== 'leaving') { state[key] = 'leaving'; state[key + 'T'] = 0; g.userData.from = { x: g.position.x, y: g.position.y }; if (key === 'bf') ctx.say('flyaway', { kind: 'event', ttl: 1500 }); }
        state[key + 'T'] += dt;
        const k2 = state[key + 'T'];
        if (state[key] === 'coming') {
          const u = Math.min(1, k2 / 2.4), e = smooth(u);
          g.position.x = g.userData.from.x + (target.x - g.userData.from.x) * e;
          g.position.y = g.userData.from.y + (target.y - g.userData.from.y) * e + Math.sin(u * 9) * 0.25 * (1 - u);
          if (u >= 1) {
            state[key] = 'landed';
            if (key === 'bf') { ctx.say('butterfly', { kind: 'event', ttl: 4000, still: () => still.bf === 'landed' }); ctx.award('still'); } else ctx.say('bee', { kind: 'event', ttl: 4000, still: () => still.bee === 'landed' });
          }
        } else if (state[key] === 'landed') {
          g.position.x = target.x; g.position.y = target.y;
        } else if (state[key] === 'leaving') {
          const u = Math.min(1, k2 / 2);
          g.position.x = g.userData.from.x + u * 6;
          g.position.y = g.userData.from.y + u * 4 + Math.sin(u * 8) * 0.2;
          // The butterfly goes back to its flowers; the bee off home.
          if (u >= 1) { if (key === 'bf') { state.bf = 'wander'; still.wx = g.position.x; } else { state[key] = 'away'; g.visible = false; } }
        }
        if (state[key] === 'wander' || (state[key] === 'away' && key === 'bf')) { g.userData.wings.forEach((w) => { w.scale.x = 0.35 + 0.65 * Math.abs(Math.cos(t * 12)); }); return; }
        const flapSpeed = state[key] === 'landed' ? 2 : key === 'bee' ? 40 : 12;
        g.userData.wings.forEach((w) => { w.scale.x = 0.35 + 0.65 * Math.abs(Math.cos(t * flapSpeed)); });
        g.position.z = oona.s.mode === 'dive' ? 0.95 : 0.35;
      };
      if (canLand) still.t += dt; else if (moving) still.t = 0;
      fly2(butterfly, still, 'bf', head, 1.2);
      fly2(bee, still, 'bee', back, 4.5);

      // ---- rain ----
      if (onIsland && now > nextRain && !ctx.busy) startRain();
      const raining = now < rainUntil && onIsland;
      rainK += ((raining ? 1 : 0) - rainK) * Math.min(1, dt * 0.8);
      const cam = ctx.camera.position, hw = 22;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.visible = onIsland && rainK > 0.05 && i < drops.length * rainK;
        if (!d.visible) continue;
        d.position.y -= dt * 14;
        if (d.position.y < cam.y - 10 || Math.abs(d.position.x - cam.x) > hw) { d.position.x = cam.x - hw + Math.random() * hw * 2; d.position.y = cam.y + 10 + Math.random() * 6; }
      }
      if (raining && (patter += dt) > 1.4) { patter = 0; sound.rain(); }
      if (raining && now > rainUntil - 12000) ctx.once('rain-fact', { kind: 'event', ttl: 8000, still: () => rainK > 0.5 });
      cloud.scale.setScalar(1 + 0.03 * Math.sin(t * 1.5));
      cloud.position.x = 2.4 + Math.sin(t * 0.05) * 3;
      for (const p of puddles) {
        const u = p.userData;
        u.k = raining ? Math.min(1, u.k + dt / 5) : Math.max(0, u.k - dt / 70);
        p.visible = onIsland && u.k > 0.01;
        p.scale.set(Math.max(0.001, u.k), 1, 1);
        const px = p.position.x, near = (b) => Math.abs(b.s.x - px) < 0.7 * u.k && b.s.mode !== 'fly' && u.k > 0.4;
        const oIn = onIsland && near(oona), bIn = onIsland && near(baba);
        if (oIn && !u.oonaIn) {
          const big = u.prevMode === 'fly';
          ctx.splashUp(px, groundY(px) + 0.05, big ? 22 : 10);
          ctx.award('puddle');
          if (!ctx.told.has('puddle')) ctx.once('puddle');
        }
        if (bIn && !u.babaIn) ctx.splashUp(px, groundY(px) + 0.05, 8);
        u.oonaIn = oIn; u.babaIn = bIn;
      }
      // Remember whether she was in the air, for the jump-in splash.
      for (const p of puddles) p.userData.prevMode = oona.s.mode;

      // ---- hide and seek ----
      if (hide && hide.phase === 'seek') {
        hide.t += dt;
        const d = Math.abs(oona.s.x - hide.spot.x);
        if ((hide.giggle -= dt) <= 0) {
          hide.giggle = 3.2;
          sound.giggle(Math.max(0.25, 1 - d / 14));
          hide.wiggle = 0.5;
        }
        if (hide.t > 12) ctx.once('hide-hint', { kind: 'event', still: () => !!hide });
        // After a long while, he peeks, to help.
        hide.peek = hide.t > 20 ? Math.max(0, Math.sin((hide.t - 20) * 1.3)) : 0;
        if (d < 1.3 && ctx.where === 'island') foundBaba();
      }

      // ---- footprints on the sand ----
      const printFor = (b, last, small) => {
        if (!onIsland || b.s.mode !== 'walk' || !onSand(b.s.x)) return last;
        if (last && Math.abs(b.s.x - last.x) < (small ? 0.26 : 0.38)) return last;
        const slot = prints.find((q) => !q.f.visible) || prints.reduce((a, q) => (q.life > a.life ? q : a));
        const side = last ? -last.side : 1;
        slot.f.visible = true; slot.life = 0;
        slot.max = b.s.x > 39.2 && b.s.x < 40.4 ? 3 : 9;       // by the water, the waves take them
        slot.f.position.set(b.s.x, groundY(b.s.x) + 0.005 + side * 0.012, 0.02);
        slot.f.scale.set((b.s.facing || 1) * (small ? 1.2 : 1.8), small ? 1.2 : 1.8, 1);
        ctx.once('footprints', { auto: true });
        return { x: b.s.x, side };
      };
      lastPrint = printFor(oona, lastPrint.x === null ? null : lastPrint, false) || { x: null, side: 1 };
      lastBabaPrint = printFor(baba, lastBabaPrint, true);
      for (const q of prints) {
        if (!q.f.visible) continue;
        q.life += dt;
        if (q.life > q.max) q.f.visible = false;
        else if (q.life > q.max - 1) q.f.scale.y = (q.max - q.life) * (Math.abs(q.f.scale.x) > 1.5 ? 1.8 : 1.2);
      }

      // ---- the neighbours ----
      island.neighbours.forEach((nb, i) => {
        const u = nb.root.userData, s = nbState[i];
        const close = onIsland && Math.abs(oona.s.x - u.x) < 3.5;
        if (close && !s.cool && s.t < 0) { s.t = 0; s.cool = true; ctx.once('neighbours', { auto: true }); }
        if (!onIsland || Math.abs(oona.s.x - u.x) > 7) s.cool = false;
        if (s.t >= 0) {
          s.t += dt;
          s.u = s.t < 0.5 ? s.t / 0.5 : s.t < 3.2 ? 1 : Math.max(0, 1 - (s.t - 3.2) / 0.5);
          if (s.t > 3.8) s.t = -1;
        }
        nb.root.position.y = u.y0 + (u.y1 - u.y0) * smooth(s.u);
        nb.wings[0].rotation.z = s.u > 0.9 ? 1.4 + Math.sin(t * 9) * 0.5 : 0;
      });

      // ---- the frog's fly ----
      if (onIsland && Math.abs(oona.s.x - cast.frog.root.position.x) < 10 && frogFly.t < 0 && now > frogFly.next && ctx.frogIdle()) {
        frogFly = { t: 0, next: 0 };
        fly.visible = true;
        sound.buzz();
      }
      if (frogFly.t >= 0) {
        frogFly.t += dt;
        const fr = cast.frog.root.position, flip = cast.frog.flip >= 0 ? 1 : -1;
        const fx = fr.x + flip * 0.9 + Math.sin(frogFly.t * 5) * 0.25, fy = fr.y + 0.75 + Math.cos(frogFly.t * 7) * 0.12;
        if (frogFly.t < 2) fly.position.set(fx, fy, 0.95);
        const mx = fr.x + flip * 0.28, my = fr.y + 0.17;
        if (frogFly.t >= 2 && frogFly.t < 2.25) {
          const k2 = frogFly.t < 2.12 ? (frogFly.t - 2) / 0.12 : (2.25 - frogFly.t) / 0.13;
          const dx = fly.position.x - mx, dy = fly.position.y - my;
          tongue.visible = true;
          tongue.position.set(mx, my, 0.94);
          tongue.rotation.z = Math.atan2(dy, dx);
          tongue.scale.set(Math.max(0.01, Math.hypot(dx, dy) * k2), 1, 1);
          if (frogFly.t > 2.12) fly.visible = false;
        }
        if (frogFly.t >= 2.25) {
          tongue.visible = false; fly.visible = false;
          frogFly = { t: -1, next: now + 9000 + Math.random() * 5000 };
          sound.gulp();
          ctx.once('frog-fly', { kind: 'event', ttl: 2500 });
        }
      }

      // ---- bunnies ----
      for (const b of bunnies) {
        if (b.t < 0) continue;
        b.t += dt;
        const up = b.t < 0.3 ? b.t / 0.3 : b.t < 2.6 ? 1 : Math.max(0, 1 - (b.t - 2.6) / 0.3);
        b.r.root.position.y = b.y - 0.95 + 1.0 * smooth(up);
        b.r.ears.forEach((e, k) => { e.rotation.z = (e.userData.r0 ?? 0) + Math.sin(t * 8 + k) * 0.12; });
        if (b.t > 3) { b.t = -1; b.r.root.visible = false; }
      }

      // ---- the mouse's snack, if she waits in the larder ----
      const mouse = cast.mouse.root, mu = mouse.userData;
      if (ctx.where === 'under' && ctx.room === 'pantry' && nibble.t < 0 && now - ctx.lastInput > 3000 && now > nibble.next && !ctx.peeking()) {
        nibble = { t: 0, next: 0, from: mouse.position.x };
        mu.nibbling = true;
      }
      if (mu.cancel) { mu.cancel = false; nibble = { t: -1, next: now + 12000, from: 0 }; mouse.scale.x = 1; cast.mouse.flip = 1; }
      if (nibble.t >= 0) {
        nibble.t += dt;
        const px = PANTRY.pile + 0.35, fx = nibble.from;
        const k2 = nibble.t < 1 ? nibble.t : nibble.t < 4 ? 1 : Math.max(0, 1 - (nibble.t - 4));
        mouse.position.x = fx + (px - fx) * smooth(k2);
        mouse.position.y = pantryFloor(mouse.position.x) + 0.05 + (nibble.t > 1 && nibble.t < 4 ? Math.abs(Math.sin(nibble.t * 12)) * 0.03 : 0);
        cast.mouse.flip = nibble.t < 4 ? (px >= fx ? 1 : -1) : (px >= fx ? -1 : 1); mouse.scale.x = cast.mouse.flip;
        if (nibble.t > 1.2) ctx.once('mouse-nibble', { kind: 'event', ttl: 3000, still: () => nibble.t >= 0 });
        if (nibble.t > 5) { nibble = { t: -1, next: now + 12000, from: 0 }; mu.nibbling = false; mouse.scale.x = 1; cast.mouse.flip = 1; }
      }

      // ---- Silky's pup ----
      if (pupSpin >= 0) { pupSpin += dt; pup.rig.rotation.z = -pupSpin / 0.8 * Math.PI * 2; if (pupSpin > 0.8) { pupSpin = -1; pup.rig.rotation.z = 0; } }
      if (pupT < 0 && now > pupNext) pupT = 0;
      let py = SURFACE - 0.12 + Math.sin(t * 1.8) * 0.04;
      if (pupT >= 0) {
        pupT += dt;
        py -= pupT < 0.5 ? pupT / 0.5 * 1.3 : pupT < 2 ? 1.3 : Math.max(0, 1.3 - (pupT - 2) / 0.5 * 1.3);
        if (pupT > 2.5) { pupT = -1; pupNext = now + 7000 + Math.random() * 4000; }
      }
      pup.root.position.set(PUP_X + Math.sin(t * 0.3) * 0.4, py, 0.9);

      // ---- the echo, the first time she is in the cave ----
      if (ctx.where === 'under' && ctx.room === 'cave') {
        if (!caveEnter) caveEnter = now;
        if (!echoDone && now - caveEnter > 7000 && !ctx.busy) { echoDone = true; ctx.hop(cast.oona); ctx.say('hello-echo', { kind: 'event', ttl: 1500 }); voice.echo('hello-echo'); }
      } else caveEnter = 0;
    },
    late(t) {
      if (flight?.papa) {
        cast.papa.root.position.set(flight.papa.x, flight.papa.y, 0.2);
      }
      if (hide) {
        cast.baba.root.position.z = hide.spot.z;
        cast.baba.root.position.y = groundY(hide.spot.x) + (hide.peek || 0) * 0.35;
        if (hide.spot.bush) {
          const b = bushes[GORSE.indexOf(hide.spot.x)];
          hide.wiggle = Math.max(0, (hide.wiggle || 0) - 1 / 60);
          b.rotation.z = Math.sin(t * 30) * 0.05 * hide.wiggle;
        }
      }
    },
    rain: () => rainK,
    state: () => ({ flying: !!flight, still: { ...still }, rainK: +rainK.toFixed(2), hide: hide ? { phase: hide.phase, x: hide.spot.x } : null, puddles: puddles.map((p) => +p.userData.k.toFixed(2)) }),
    startRain,
  };
  return api;
}

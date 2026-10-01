// HOW A PUFFIN MOVES — walking, flapping, gliding, sliding, swimming and
// diving, as plain numbers. No DOM, no renderer: step(dt) is the only clock,
// so the tests can walk Oona the length of the island and out to sea in a loop.
//
// Three things move a bird, and they are the three things a child does:
//
//   drive(dx, dy)  keys held: dx -1 left / 1 right; dy, in the water only,
//                  1 swim up / -1 dive down; 0 let go
//   goTo(x, y)     a tap: walk, fly or swim there and stop. A y is only
//                  heard under the water: tap the sea and she dives to it
//   flap()         a tap on the sky, or up: one beat of the wings
//
// Modes: stand | walk | fly | slide | swim (floating on the surface) | dive.
//
// Three places push back, all for fun: a LILY PAD bounces whoever lands on it
// (big, smaller, smaller, then lets them stand); the WIND at the clifftop lifts
// a flying puffin up and up; and `launch()` throws her up into the sky, which
// is what the blowhole does.
//
// NOTHING FAILS. There is no falling off: the ground is one curve (ground.js)
// and a bird in the air always glides gently back down onto it — or onto the
// sea, where she floats. Under the water she is always buoyant: let go and she
// drifts back up to the surface by herself. No breath to run out of, no
// bottom to get stuck on, and the sky has a soft lid so the camera never
// loses her.

import { groundY, surfaceAt, padAt, PADS, POND, X_MIN, X_MAX, SKY, SLIDE, UPDRAFT_X } from './ground.js';

export const WALK = 3.1;          // world units a second, on foot
export const AIR = 4.2;           // across, while flying
export const GRAVITY = 15;
export const FLAP = 7;            // upward speed one beat of the wings gives
export const GLIDE = 1.8;         // the fastest she sinks with her wings out
export const ARRIVE = 0.08;       // close enough to a tapped spot
export const SLIDE_PULL = 7;      // how hard the slope pulls an eggshell
export const SAND_DRAG = 12;      // how fast the sand stops one
export const PADDLE = 2.5;        // across the surface, paddling
export const DIVE = 3.3;          // under the water, flying with her wings
export const BUOY = 1.1;          // how fast she floats up when let go
export const KEEL = 0.35;         // how close to the sea floor she may swim
export const BOUNCES = [6.5, 4.6, 3.0]; // a lily pad's springs, one after another
export const PAD_TOP = 0.07;      // a pad floats a little above the pond
export const WIND = 24;           // the updraft's push, against gravity's 15
export const WIND_TOP = 5;        // the fastest the wind carries her up

// The world a bird is in: the island, by default. `setWorld` moves her into
// another — the tunnels under Puffin Rock have their own floor, a roof, no
// water, no wind and no eggshell slide.
const ISLAND = { ground: groundY, surf: surfaceAt, pads: padAt, lo: X_MIN, hi: X_MAX, slide: SLIDE, roof: null, wind: true };

export function makeBird({ x = 0, walk = WALK, canFly = true, canDive = canFly, ...world } = {}) {
  const w = { ...ISLAND, ...world };
  const ground = (px) => w.ground(px), surf = (px) => w.surf(px), pads = (px) => w.pads(px);
  // Standing on a lily pad is standing, not swimming.
  const onPad = (px) => pads(px) >= 0;
  const wet = (px) => !onPad(px) && ground(px) < surf(px) - 0.25;
  // Where a bird rests at x: on the ground, on a lily pad, or on the water.
  const rest = (px) => (onPad(px) ? POND + PAD_TOP : wet(px) ? surf(px) : ground(px));
  const s = {
    x, y: rest(x), vx: 0, vy: 0,
    facing: 1,                    // 1 looks right, -1 left
    mode: wet(x) ? 'swim' : 'stand',
    speed: walk,
  };
  let dir = 0, dirY = 0;          // held drive
  let target = null;              // x of a tapped spot
  let targetY = null;             // and how deep, under the water
  let slideV = 0;
  let pad = -1, padBounce = 0;    // which pad she last sprang off, how many times
  // A bounce is not a flight: she falls like a ball, not a glider, and
  // crosses at walking pace — so from one pad she lands on the next.
  let bouncing = false;
  let peak = -Infinity;           // the highest she has been since she left the ground

  const clampX = (v) => Math.min(w.hi, Math.max(w.lo, v));
  const deepest = (px) => ground(px) + KEEL;

  function face(d) { if (d > 0.01) s.facing = 1; else if (d < -0.01) s.facing = -1; }

  const api = {
    s,
    wet,
    drive(d, dy = 0) {
      dir = Math.max(-1, Math.min(1, d || 0));
      dirY = canDive ? Math.max(-1, Math.min(1, dy || 0)) : 0;
      if (dir || dirY) { target = null; targetY = null; }
    },
    goTo(tx, ty = null) {
      if (s.mode === 'slide') return;
      target = clampX(tx);
      targetY = canDive && ty !== null && wet(target) && ty < surf(target) - 0.3
        ? Math.max(deepest(target), Math.min(surf(target), ty)) : null;
    },
    stop() { target = null; targetY = null; dir = 0; dirY = 0; },
    get target() { return target; },
    get targetY() { return targetY; },
    flap() {
      if (!canFly || s.mode === 'slide') return false;
      // Under the water a flap is a stroke up toward the light.
      if (s.mode === 'dive') { s.vy = DIVE; targetY = null; return true; }
      // A beat adds lift rather than setting it, up to the one-beat speed, so
      // tapping fast climbs faster but never shoots her off the top.
      s.vy = Math.min(FLAP, Math.max(s.vy, 0) + FLAP * 0.75);
      s.mode = 'fly';
      bouncing = false;
      return true;
    },
    // From floating, under she goes.
    dive() {
      if (!canDive || s.mode !== 'swim') return false;
      s.mode = 'dive'; s.vy = -DIVE;
      return true;
    },
    // Thrown up into the sky (the blowhole). Works for anyone, wings or not:
    // they come down gently all the same.
    launch(v = 11) {
      if (s.mode === 'slide') return false;
      s.mode = 'fly'; s.vy = v; targetY = null; bouncing = false;
      return true;
    },
    // Sit down on an eggshell at the top of the slope and let go.
    slide() {
      if (!w.slide || s.mode === 'slide' || s.x > w.slide.x0 + 0.8 || s.x < w.slide.x0 - 3) return false;
      s.mode = 'slide'; s.facing = 1; s.vy = 0;
      s.x = Math.max(s.x, w.slide.x0 - 0.2); s.y = ground(s.x);
      slideV = 1.2; target = null; targetY = null; dir = 0; dirY = 0;
      return true;
    },
    // Put her somewhere (out of the burrow, for one), standing or floating.
    // Into another world (or back to the island), standing at x.
    setWorld(world, px) {
      Object.assign(w, ISLAND, world);
      pad = -1; bouncing = false; slideV = 0;
      api.place(px);
    },
    get world() { return w; },
    place(px) { s.x = clampX(px); s.y = rest(s.x); s.vy = 0; s.mode = wet(s.x) ? 'swim' : 'stand'; target = null; targetY = null; },

    // One tick. Returns the things that happened, for sounds and words.
    step(dt) {
      const events = [];
      if (s.mode === 'slide') {
        const slope = (ground(s.x + 0.05) - ground(s.x - 0.05)) / 0.1;
        // Over the flat lip she shuffles forward; the slope does the rest.
        if (s.x < w.slide.x0 + 0.3) slideV = Math.max(slideV, 1.2);
        else if (slope < -0.02) slideV += -slope * SLIDE_PULL * dt;
        else slideV -= SAND_DRAG * dt;
        s.x = clampX(s.x + slideV * dt);
        s.y = ground(s.x);
        s.vx = slideV;
        if (slideV <= 0.15 || s.x >= w.hi) {
          slideV = 0; s.vx = 0; s.mode = 'stand';
          events.push('slid');
        }
        return events;
      }

      if (s.mode === 'dive') return swimUnder(dt, events);

      if (s.mode !== 'fly') { peak = s.y; s.cannon = false; }
      // Which way to go: a held key beats a tapped spot.
      let want = dir;
      if (!want && target !== null) {
        const d = target - s.x;
        if (Math.abs(d) <= ARRIVE && targetY === null) {
          s.x = target; target = null;
          if (s.mode !== 'fly') { s.y = rest(s.x); events.push('arrived'); }
        }
        else want = Math.sign(d) * Math.min(1, Math.abs(d) / 0.3);
      }
      face(want);

      if (s.mode === 'fly') {
        const pace = (bouncing ? s.speed : AIR) * want;
        s.vx = pace;
        s.vy -= GRAVITY * dt;
        peak = Math.max(peak, s.y);
        // CANNONBALL: over the water, high up, and let go of — she tucks her
        // wings in and drops like a stone. Steering, she glides as ever.
        s.cannon = !want && canFly && wet(s.x) && s.vy < 0 && peak - surf(s.x) > 1.8;
        // Up the cliff comes the wind, and it carries a puffin up with it.
        if (w.wind && s.x < UPDRAFT_X) s.vy = Math.min(Math.max(s.vy, 0) + WIND * dt, WIND_TOP);
        if (s.vy < -GLIDE && !bouncing && !s.cannon) s.vy = -GLIDE;
        let nx = s.x + pace * dt;
        if (target !== null && Math.sign(target - s.x) !== Math.sign(target - nx)) nx = target;
        s.x = clampX(nx);
        s.y += s.vy * dt;
        const floor = rest(s.x);
        // Under a roof, a flap is only a hop.
        const lid = w.roof ? Math.max(floor + 0.2, Math.min(floor + SKY, w.roof(s.x) - 1.6)) : floor + SKY;
        if (s.y > lid) { s.y = lid; s.vy = Math.min(s.vy, 0); }
        if (s.y <= floor) {
          s.y = floor; s.vy = 0;
          const p = pads(s.x);
          if (p >= 0) {
            // Down onto a lily pad: boing. The same pad again springs less,
            // and after three she can stand on it.
            padBounce = p === pad ? padBounce + 1 : 0;
            pad = p;
            if (padBounce < BOUNCES.length) { s.vy = BOUNCES[padBounce]; bouncing = true; events.push('boing'); return events; }
            bouncing = false;
            s.mode = want ? 'walk' : 'stand';
            events.push('landed');
          } else if (wet(s.x)) {
            pad = -1; bouncing = false; s.mode = 'swim'; events.push('splash');
            if (s.cannon) events.push('cannonball');
          }
          else { pad = -1; bouncing = false; s.mode = want ? 'walk' : 'stand'; events.push('landed'); }
        }
        return events;
      }

      // Floating, and asked to go under: a tap in the sea, or down held.
      if (s.mode === 'swim' && canDive && (targetY !== null || dirY < 0)) {
        api.dive();
        events.push('dive');
        return events;
      }

      // On foot, or paddling. Up and down the ground as it goes, and onto
      // the top of the sea where the sand goes under.
      const inWater = s.mode === 'swim';
      const pace = (inWater ? PADDLE : s.speed) * want;
      let nx = s.x + pace * dt;
      if (target !== null && Math.sign(target - s.x) !== Math.sign(target - nx)) nx = target;
      const before = pads(s.x);
      s.x = clampX(nx);
      s.y = rest(s.x);
      s.vx = pace;
      // Onto a lily pad from somewhere else: boing.
      const p = pads(s.x);
      if (p >= 0 && p !== before) {
        pad = p; padBounce = 0;
        s.mode = 'fly'; s.vy = BOUNCES[0]; bouncing = true;
        events.push('boing');
        return events;
      }
      // Walking into the wind at the cliff edge, a puffin is simply lifted.
      if (w.wind && canFly && s.x < UPDRAFT_X && s.mode !== 'fly') { s.mode = 'fly'; s.vy = 2; events.push('lifted'); return events; }
      const now = wet(s.x);
      if (now && !inWater) events.push('wade');
      if (!now && inWater) events.push('ashore');
      s.mode = now ? 'swim' : Math.abs(pace) > 0.01 ? 'walk' : 'stand';
      return events;
    },
  };

  // Under the water she flies with her wings, anywhere between the sea floor
  // and the surface. Let go and she floats up; reach the top and she bobs.
  function swimUnder(dt, events) {
    let ax = dir, ay = dirY;
    if (!ax && !ay && target !== null) {
      const ty = targetY ?? s.y;
      const dx = target - s.x, dy = ty - s.y;
      const d = Math.hypot(dx, dy);
      if (d <= ARRIVE * 2) { target = null; targetY = null; }
      else { const k = Math.min(1, d / 0.4) / d; ax = dx * k; ay = targetY === null ? 0 : dy * k; }
    }
    face(ax);
    s.vx = ax * DIVE;
    // A stroke up (from a flap) fades; with no one steering she floats up.
    const wantVy = ay ? ay * DIVE : BUOY;
    s.vy += (wantVy - s.vy) * Math.min(1, dt * (ay ? 8 : 2.5));
    s.x = clampX(s.x + s.vx * dt);
    s.y += s.vy * dt;
    const floor = deepest(s.x);
    if (s.y < floor) { s.y = floor; s.vy = Math.max(0, s.vy); }
    const top = surf(s.x);
    // Swum into the shallows: stand up on the sand.
    if (!wet(s.x)) {
      s.y = ground(s.x); s.vy = 0; s.mode = 'walk';
      events.push('ashore');
      return events;
    }
    if (s.y >= top) {
      s.y = top; s.vy = 0;
      s.mode = 'swim';
      events.push('surfaced');
    }
    return events;
  }

  return api;
}

// Baba: where he wants to be is a step behind his big sister, and he hurries
// when she gets far ahead. He never flies and never dives — pufflings cannot
// — so while she is up in the air he trots along underneath her, and while she
// is under the sea he paddles along on top of it.
export const TAG_GAP = 1.15;
export function follow(baba, oona) {
  const behind = oona.s.x - oona.s.facing * TAG_GAP;
  const d = behind - baba.s.x;
  const far = Math.abs(oona.s.x - baba.s.x);
  baba.s.speed = far > 6 ? WALK * 1.9 : WALK * 1.15;
  if (Math.abs(d) > 0.5 || baba.target !== null) baba.goTo(behind);
  if (Math.abs(d) <= 0.5 && baba.target === null && (baba.s.mode === 'stand' || baba.s.mode === 'swim')) baba.s.facing = oona.s.x >= baba.s.x ? 1 : -1;
}

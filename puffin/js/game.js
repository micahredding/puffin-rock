// PUFFIN ROCK — the game. You are Oona; Baba waddles after you; the island
// runs left to right past home, the meadow and the rocks to the sea.
//
// Two ways to play, both always on, because he plays on the iPad and at the
// keyboard:
//
//   touch / mouse   tap the ground: walk there. Tap the sky: flap (and drift
//                   toward where you tapped). Tap a thing or a friend: walk
//                   to it, and it happens. A finger held down drags her along.
//   keys            ←/→ or A/D walk. ↑, W or space flap (hold to keep
//                   flapping). ↓, S or Enter: do the nearest thing.
//   in the sea      tap under the water: dive and swim there. ↓/S dives,
//                   ↑/W swims up (and, at the top, takes off). Let go and
//                   she floats back up by herself.
//
// The doctrine (docs/diorama-games.md): no words on screen — the narrator
// says everything; the thing to try BREATHES; nothing fails; the badge shelf
// only goes up; everything he needs has been shown first (Mossy slides before
// he is asked to).

import * as THREE from './three.js';
import { createStage, attachPointer, aimFor, placeCamera } from './rig.js';
import { makeKit } from './shapes.js';
import { buildIsland } from './island.js';
import { animate } from './cast.js';
import { makeBird, follow } from './flight.js';
import { groundY, STOPS, SLIDE, TOP, SURFACE, WOOD_X, POND, PADS, UPDRAFT_X, CLIFF, BANK, FALLS, wet, padAt, standFor } from './ground.js';
import { rideAt, RIDE_SECONDS } from './ride.js';
import { TUNNEL_WORLD, UNDER, tunnelFloor, ROOMS, LINKS, PANTRY, pantryFloor } from './under.js';
import { installNight } from './night.js';
import { installFun } from './fun.js';
import { installTalk } from './talk.js';
import { makeSpeech } from './speech.js';
import { CAM_Z } from './shapes.js';
import * as story from './story.js';
import { LINES, COUNT, cycle } from './lines.js';
import { makeVoice } from './voice.js';
import { Sound } from './sound.js';

export function bake(buf) {
  const c = document.createElement('canvas');
  c.width = buf.w; c.height = buf.h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(buf.w, buf.h);
  img.data.set(buf.px);
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function start(canvas, badgesEl, { log = () => {}, moment = () => {}, who = '', fade = (mid) => mid() } = {}) {
  const stage = createStage(canvas);
  const kit = makeKit(bake);
  const island = buildIsland(kit);
  stage.scene.add(island.world);
  const { cast, byName } = island;
  const camera = stage.camera;

  const sound = new Sound();
  const voice = makeVoice(LINES);
  voice.setMuted(sound.muted);

  // ---- the saved state ---------------------------------------------------------
  const KEY = `puffin-state-${who || 'guest'}`;
  let st = story.deserialize(localStorage.getItem(KEY) || '');
  const save = () => { try { localStorage.setItem(KEY, story.serialize(st)); } catch { /* full or private */ } };
  function award(key) {
    const next = story.award(st, key);
    if (next === st) return false;
    st = next; save(); paintBadges(key);
    sound.happy();
    moment('succeeded', { what: key });
    return true;
  }
  function bump(key) { st = story.bump(st, key); save(); }
  function meet(who) { const n = story.meet(st, who); if (n !== st) { st = n; save(); } }
  // Only what has been earned: thirty rings of what has not would fill the
  // top of the screen, and the shelf is for pride, not for a to-do list.
  // A NEW badge lights up right where it lands on the shelf — a warm glow, a
  // ring rippling out, a couple of sparkles, a bounce — and fades back to
  // normal: you can see the shelf growing, without anything covering the game.
  function paintBadges(fresh = null) {
    badgesEl.innerHTML = story.BADGES.filter((b) => story.has(st, b.key))
      .map((b) => `<span data-k="${b.key}"${b.key === fresh ? ' class="fresh"' : ''}>${b.emoji}</span>`).join('');
    if (!fresh) return;
    setTimeout(() => { badgesEl.querySelector(`[data-k="${fresh}"]`)?.classList.remove('fresh'); sound.pop(); }, 2600);
  }
  paintBadges();

  // ---- who moves ---------------------------------------------------------------
  const oona = makeBird({ x: STOPS.burrow.x + 1.2 });
  const baba = makeBird({ x: STOPS.burrow.x - 0.2, canFly: false });
  const mossy = makeBird({ x: STOPS.mossy.x, canFly: false, walk: 2.4 });
  const hops = new Map();            // character → hop progress 0..1
  const hop = (c) => { hops.set(c, 0); sound.hop(); };

  // ---- what is being said --------------------------------------------------------
  // Everything said goes through the speech arbiter (speech.js): talk, then
  // replies to what he did, then things that happened, then the island's
  // own remarks — and nothing talks over anything more important.
  const speech = makeSpeech({ voice, talking: () => !!talk?.active() });
  const told = new Set();            // things said once a session
  const taps = {};                   // how many times each friend has been tapped
  // say(ids, 'event') or say(ids, { kind, ttl, still }); { auto: true } is
  // the island's own remark (ambient). With no kind it is a reply.
  const kindOf = (opts) => (typeof opts === 'string' ? { kind: opts } : opts?.auto ? { ...opts, kind: 'ambient' } : { kind: 'reply', ...opts });
  // For the playtest: every line as it starts and how it ended.
  const speechLog = [];
  function say(ids, opts) {
    const o = kindOf(opts), name = [].concat(ids).join('+');
    return speech.say(ids, { ...o, onStart: () => { o.onStart?.(); speechLog.push(`start ${o.kind} ${name}`); } }).then((ok) => { speechLog.push(`${ok ? 'done' : 'dropped'} ${name}`); return ok; });
  }
  // Said once a session — counted when it STARTS, so a line that had to be
  // dropped (something more important was going on) can come round again.
  const waiting = new Set();          // once-lines in the queue, not yet said
  const once = (id, opts) => {
    if (told.has(id) || waiting.has(id)) return false;
    const o = kindOf(opts);
    if (o.kind === 'reply') told.add(id);
    waiting.add(id);
    say(id, { ...o, onStart: () => { told.add(id); waiting.delete(id); } }).then(() => waiting.delete(id));
    return true;
  };
  const lastSaid = () => speech.lastStart;

  // ---- the stations ----------------------------------------------------------------
  let pending = null;                // the thing she is walking to do
  let busy = false;                  // inside the burrow: nothing to steer
  const used = new Set();            // tried this session: stops breathing
  let blown = [false, false, false, false, false];
  let regrowAt = 0;
  let mossyShow = 'waiting';         // waiting | sliding | home
  let babaSliding = false;
  let eggBackAt = 0;
  let lastInput = performance.now();
  let riding = null;                 // { t0 } while on Silky's back
  const frog = { pad: 2, from: 2, t: -1, next: 0 };   // which pad; a hop in progress
  let crabT = -1, anemoneShutUntil = 0;
  let spoutT = -1, spoutNext = 0, spoutLaunched = false;
  let boings = 0;
  let carried = 0;                   // fish in Oona's beak, 0..10
  let feeding = false;
  let litFadeAt = 0;
  const MAX_FISH = 10;

  // Up on the island, or down in the tunnels: what there is to tap and walk
  // to depends on where she is.
  let where = 'island';
  let room = 'main';                 // under the ground: which room of the tunnels
  const roomThings = () => Object.fromEntries(Object.entries(island.underByName).filter(([, o]) => o.userData.room === room));
  const things = () => (where === 'under' ? roomThings() : byName);

  function approach(name) {
    const map = things();
    if (busy || !map[name]) return;
    pending = name;
    oona.goTo(standFor(name, map[name].userData.stop, oona.s.x));
  }

  function nearest(range = 2.4) {
    let best = null, d = range;
    for (const [name, o] of Object.entries(things())) {
      if (name.startsWith('dandelion') && blown[+name.split('-')[1]]) continue;
      if (name.startsWith('mushroom') && o.userData.lit) continue;
      const dd = Math.abs(o.userData.stop - oona.s.x);
      if (dd < d) { d = dd; best = name; }
    }
    return best;
  }

  async function act(name) {
    used.add(name);
    for (const x of extras) if (x.act?.(name)) return;
    if (name === 'burrow') return goUnder('burrow');
    if (name === 'warren') return goUnder('warren');
    if (name === 'up') return goUp('burrow');
    if (name === 'nest') return nap();
    if (name === 'hedgehog') return curl();
    if (name === 'worm') return wriggle();
    if (name === 'marvin') return marvinJump();
    if (name === 'roots') return climb();
    const link = LINKS.find((l) => l.pick === name);
    if (link) return travel(link);
    if (name === 'mouse') return peekaboo(true);
    if (name.startsWith('glow-')) return glowFrom(+name.split('-')[1]);
    if (name.startsWith('dig-')) return dig(+name.split('-')[1]);
    if (name === 'bernie') return tryShell();
    if (name === 'sheep') return baa();
    if (name === 'egg') return slide();
    if (name.startsWith('dandelion')) return blow(+name.split('-')[1]);
    if (name.startsWith('mushroom')) return glow(+name.split('-')[1]);
    if (name === 'silky') return ride();
    if (name === 'frog') return frogHop(true);
    if (name === 'crab') return scuttle();
    if (name === 'anemone') return shut();
    if (name === 'blowhole') { sound.gurgle(); spoutNext = performance.now() / 1000 + 0.7; return; }
    const c = cast[name];
    if (!c) return;
    hop(c);
    const n = (taps[name] = (taps[name] || 0) + 1) - 1;
    if (name === 'mossy') sound.squeak();
    if (name === 'may' || name === 'mossy') award(name);
    say(cycle(name, n)).then(() => meet(name));
  }

  // DOWN INTO THE BURROW: the burrow door (or May's hole) is a way into the
  // tunnels under Puffin Rock. A quick fade, and they are in another world:
  // the tunnels' own floor, a roof, the chute.
  function goUnder(from) {
    if (busy) return;
    busy = true; pending = null; oona.stop();
    sound.tuck();
    award('home');
    fade(() => {
      where = 'under'; room = 'main';
      const x = from === 'warren' ? UNDER.hi - 0.6 : UNDER.home + 0.6;
      oona.setWorld(TUNNEL_WORLD, x);
      baba.setWorld(TUNNEL_WORLD, from === 'warren' ? x + 0.5 : x - 1.1);
      oona.s.facing = from === 'warren' ? -1 : 1;
      snapCamera();
      busy = false;
      const first = !told.has('burrow-in');
      told.add('burrow-in');
      say(first ? ['burrow-in', 'tunnels'] : [Math.random() < 0.5 ? 'burrow-in-2' : 'burrow-fact']);
    });
  }

  // UP AGAIN: by the shaft to the burrow door, or — out of the chute — POP,
  // up out of May's warren into the meadow, where her family pop up too.
  function goUp(to) {
    if (where !== 'under') return;
    busy = true; pending = null; oona.stop();
    fade(() => {
      where = 'island';
      if (to === 'warren') {
        oona.setWorld({}, UNDER.warren);
        baba.setWorld({}, UNDER.warren - 0.4);
        oona.launch(8); oona.goTo(UNDER.warren + 1.8);
        setTimeout(() => { baba.launch(6); sound.pop(); }, 400);
        sound.pop();
        popRabbits();
        award('climb');
        say(!told.has('warren') ? ['warren', 'rabbits-fact'] : ['warren']);
        told.add('warren');
      } else {
        oona.setWorld({}, STOPS.burrow.x + 0.9);
        baba.setWorld({}, STOPS.burrow.x - 0.3);
        sound.pop();
        say('burrow-out');
      }
      snapCamera();
      busy = false;
    });
  }

  // In the nest: a little nap. Eyes shut, slow breathing, a hush — and then
  // Oona wakes him up to go exploring.
  let napping = false;
  async function nap() {
    if (napping || busy) return;
    napping = true; busy = true; oona.stop();
    oona.place(UNDER.nest + 0.5); baba.place(UNDER.nest - 0.5);
    oona.s.facing = -1; baba.s.facing = 1;
    sound.tuck();
    award('nap');
    await Promise.race([Promise.all([say('nest'), wait(4500)]), wait(9000)]);
    napping = false; busy = false;
    sound.pop();
    say('wake');
  }

  // The hedgehog: tap him and he snuffles and rolls up into a prickly ball,
  // then slowly uncurls and goes back to sleep.
  let curledUntil = 0;
  function curl() {
    const h = cast.hedgehog;
    h.face.visible = false; h.ball.visible = true;
    curledUntil = performance.now() + 3200;
    sound.squish();
    award('hedgehog');
    say(!told.has('hedgehog') ? ['hedgehog', 'hedgehog-2'] : ['hedgehog-2']);
    told.add('hedgehog');
  }
  let wormUntil = 0;
  function wriggle() { wormUntil = performance.now() + 2500; sound.squish(); once('worm'); }

  // MARVIN: shy, but he shows you his big splash — up onto the bank, a
  // leap, tucked into a ball, and SPLASH. Then it is yours: fly up over any
  // water and let go, and Oona tucks in and does a cannonball (flight.js).
  let marvinT = -1;
  function marvinJump() {
    if (marvinT >= 0) return;
    marvinT = 0;
    say(!told.has('marvin-hello') ? ['marvin-hello', 'marvin-fact'] : ['marvin-fact']);
    told.add('marvin-hello');
  }
  // A cannonball's spray: white drops thrown up and out, falling back.
  const spray = [];
  function splashUp(x, y, n = 22) {
    sound.splash(); sound.gulp();
    let k = 0;
    for (const s2 of island.seeds) {
      if (k >= n) break;
      if (s2.visible) continue;
      s2.visible = true; s2.position.set(x + (Math.random() - 0.5) * 0.6, y, 0.95); s2.scale.setScalar(3.2 + Math.random() * 1.5);
      const a = Math.PI * (0.15 + 0.7 * (k / (n - 1)));
      spray.push({ s: s2, vx: Math.cos(a) * (2 + Math.random() * 1.5), vy: Math.sin(a) * (4 + Math.random() * 2.5), floor: y - 0.2 });
      k++;
    }
  }

  // ALONG A LINK: from a mouth in one room, walking the tunnel as it winds, to
  // the mouth in the other. Baba a step behind.
  let travelling = null;
  function travel(link) {
    if (busy || travelling) return;
    busy = true; pending = null; oona.stop();
    const curve = new THREE.CatmullRomCurve3(link.path.map(([x, y]) => new THREE.Vector3(x, y, 0)));
    travelling = { link, curve, u: 0, dur: curve.getLength() / 2.6 };
    sound.rustle();
  }
  function arrive(link) {
    room = link.to;
    const dir = Math.sign(link.path[link.path.length - 1][0] - link.path[link.path.length - 2][0]) || 1;
    oona.setWorld(ROOMS[room], link.arrive);
    oona.s.facing = dir;
    const w = ROOMS[room];
    baba.setWorld(w, Math.min(w.hi, Math.max(w.lo, link.arrive - dir * 1.1)));
    busy = false; travelling = null;
    if (room === 'pantry') { if (!told.has('pantry')) { told.add('pantry'); say('pantry'); } peekTimer = performance.now() + 1500; }
    if (room === 'cave') { if (!told.has('cave')) { told.add('cave'); say(['cave', 'fungi']); } }
  }

  // THE MOUSE: peeking out of one of three holes. Tap it and it ducks — and
  // pops out of another. Peekaboo! Now and then it moves by itself.
  let peekT = -1, peekTimer = 0, peeks = 0;
  function peekaboo(tapped) {
    if (peekT >= 0) return;
    peekT = 0;
    // Mid-snack, only a tap interrupts it (fun.js puts the snack away).
    if (cast.mouse.root.userData.nibbling) { if (!tapped) return; cast.mouse.root.userData.nibbling = false; cast.mouse.root.userData.cancel = true; }
    if (tapped) {
      peeks++;
      sound.squeak();
      award('mouse');
      say(peeks === 1 ? ['peekaboo', 'mouse'] : ['peekaboo']);
    }
  }

  // THE FUNGI'S THREADS: touch a mushroom and it lights, and the light runs
  // out along every thread from it; each mushroom it reaches lights in turn
  // and sends it on. All five lit, the whole web shines.
  const beadsFree = () => island.under.beads.find((b) => !b.visible);
  const running = [];
  let caveLitAt = 0;
  function lightMush(i) {
    const mm = island.under.caveMush[i];
    if (mm.userData.lit) return false;
    mm.userData.lit = 1; mm.userData.light(true);
    sound.chime(i);
    for (const th of island.under.threads) {
      const fwd = th.from === i, back = th.to === i;
      if (!fwd && !back) continue;
      const other = fwd ? th.to : th.from;
      if (other >= 0 && island.under.caveMush[other].userData.lit) continue;
      const pts = fwd ? th.pts : th.pts.slice().reverse();
      for (let k = 0; k < 3; k++) {
        const b = beadsFree(); if (!b) break;
        b.visible = true;
        running.push({ b, pts, t: -k * 0.12, dur: 0.9, to: k === 0 ? other : -1 });
      }
    }
    return true;
  }
  function glowFrom(i) {
    if (!lightMush(i)) { sound.chime(i); return; }
    caveLitAt = 0;
  }
  // DIGGING in the dunes: sand flies, the mound goes down, and there is a
  // treasure. The narrator says what it is; three, and the badge.
  const flyingSand = [];
  let digT = -1, digging = -1;
  function dig(i) {
    const d = island.dunes.digs[i];
    if (d.userData.dug || digT >= 0) return;
    digT = 0; digging = i;
    sound.rustle();
  }
  function dug(i) {
    const d = island.dunes.digs[i];
    d.userData.dug = true;
    d.userData.mound.scale.set(1, 0.3, 1);
    d.userData.treasure.visible = true;
    hop(cast.oona);
    sound.happy();
    say(['dig-glass', 'dig-scallop', 'dig-purse'][i]);
    if (island.dunes.digs.every((q) => q.userData.dug)) { award('dig'); setTimeout(() => say('dig-all', 'event'), 3200); }
  }
  let showerK = 0, showered = false;

  // THE ROOTS: at the far end of the tunnels, up the shaft hand over hand,
  // Baba climbing after, and out of May's warren.
  let climbing = null;
  function climb() {
    if (where !== 'under' || busy || climbing) return;
    busy = true; pending = null; oona.stop();
    climbing = { t: 0, x: UNDER.warren - 0.4, y0: tunnelFloor(UNDER.hi) };
    sound.rustle();
    say('climb');
  }

  // BERNIE: tap him and he tries on the next shell. Big, small, just right.
  let bernieShell = 0, bernieTries = 0;
  function tryShell() {
    bernieShell = (bernieShell + 1) % 3;
    cast.bernie.wear(bernieShell);
    sound.clack();
    hop(cast.bernie);
    bernieTries++;
    say([`bernie-${(bernieTries - 1) % 3 + 1}`]);
    if (bernieShell === 2) { award('bernie'); meet('bernie'); if (!told.has('bernie-fact')) { told.add('bernie-fact'); setTimeout(() => say('bernie-fact', 'event'), 2600); } }
  }
  let baaT = -1;
  function baa() { sound.baa(); baaT = 0; once('sheep'); hop(cast.lamb); }

  // May's brothers and sisters, popping up out of their holes.
  let rabbitsUp = 0;
  function popRabbits() {
    rabbitsUp = performance.now();
    for (const r of island.rabbits) r.root.visible = true;
  }

  function blow(i) {
    const d = island.dandelions[i];
    if (blown[i]) return;
    blown[i] = true;
    d.userData.head.visible = false;
    d.userData.nub.visible = true;
    sound.blow();
    const from = d.userData.head.getWorldPosition(new THREE.Vector3());
    launchSeeds(from, 10);
    const n = blown.filter(Boolean).length;
    bump('blown');
    if (n === 5) {
      award('dandelions');
      say([COUNT(5), 'dandelions-all']);
      regrowAt = performance.now() + 12000;
    } else say(COUNT(n));
  }

  // The glowing mushrooms: touch one and it lights, with a note of its own;
  // the narrator counts them; all five and the wood is lit, for a while.
  function glow(i) {
    const m = island.mushrooms[i];
    sound.chime(i);
    if (m.userData.lit) return;
    m.userData.light(true);
    bump('lit');
    const n = island.mushrooms.filter((q) => q.userData.lit).length;
    if (n === 5) {
      award('mushrooms');
      say([COUNT(5), 'mushrooms-all']);
      litFadeAt = performance.now() + 15000;
    } else say(COUNT(n));
  }

  // SILKY'S RIDE: on her back, off the rock, round under the sea, a great
  // leap, and home again. Nothing to steer; just hold on.
  function ride() {
    if (riding || busy) return;
    busy = true; pending = null; oona.stop();
    riding = { t0: performance.now(), leapt: false, wasUnder: false };
    bump('rides');
    say('silky-hello');
  }
  function endRide() {
    riding = null;
    busy = false;
    oona.place(STOPS.silky.x - 1.3);
    oona.s.facing = 1;
    cast.silky.flip = -1;
    award('silky');
    meet('silky');
    say(!told.has('silky-fact') ? ['silky-fact', 'silky-again'] : ['silky-again']);
    told.add('silky-fact');
  }

  // The frog hops from pad to pad on his own, which is how Oona learns the
  // pads are bouncy; tapped, he hops at once and the narrator says hello.
  function frogHop(tapped = false) {
    if (frog.t >= 0) return;
    const next = frog.pad === 0 ? 1 : frog.pad === PADS.length - 1 ? PADS.length - 2 : frog.pad + (Math.random() < 0.5 ? -1 : 1);
    frog.from = frog.pad; frog.pad = next; frog.t = 0;
    sound.ribbit();
    if (tapped) once('frog');
  }
  function scuttle() {
    crabT = 0;
    sound.scuttle();
    award('pools');
    once('crab');
  }
  function shut() {
    anemoneShutUntil = performance.now() + 2600;
    island.anemone.userData.close(true);
    sound.squish();
    award('pools');
    once('anemone');
  }

  // Fish: swim into one and it is in her beak. Ten is a full beak.
  function catchFish(f) {
    if (carried >= MAX_FISH) return;
    f.visible = false;
    f.userData.back = performance.now() + 20000;
    carried++;
    cast.oona.carry(carried);
    bump('caught');
    sound.catch();
    if (carried === MAX_FISH) say([COUNT(MAX_FISH), 'fish-full']);
    else if (!told.has('fish-first')) { told.add('fish-first'); say([COUNT(carried), 'fish-first']); }
    else say(COUNT(carried));
  }

  // Feed Baba, one fish at a time, counting. With none to give, he says he
  // is hungry, and the narrator says where fish are.
  async function feedBaba() {
    if (feeding || busy) return;
    if (!carried) { say(['baba-hungry', 'fish-hint']); hop(cast.baba); return; }
    // He is never far — he follows her — but if he is, go to him first.
    if (Math.abs(baba.s.x - oona.s.x) > 2.5) { oona.goTo(baba.s.x); pending = 'baba'; return; }
    feeding = true;
    let n = 0;
    while (carried > 0) {
      carried--; n++;
      cast.oona.carry(carried);
      hop(cast.baba);
      sound.gulp();
      bump('fed');
      if (!(await say(COUNT(Math.min(n, 10))))) break;
      await wait(250);
    }
    carried = Math.max(0, carried);
    cast.oona.carry(carried);
    award('fish');
    say(!told.has('fed') ? ['fed', 'baba-thanks'] : ['baba-thanks']);
    told.add('fed');
    feeding = false;
  }

  function regrow() {
    blown = blown.map(() => false);
    for (const d of island.dandelions) { d.userData.head.visible = true; d.userData.nub.visible = false; used.delete(d.userData.pick); }
    sound.pop();
    if (oona.s.x > -9 && oona.s.x < 15) say('dandelions-back', 'event');
  }

  function slide() {
    if (!oona.slide()) return;
    pending = null;
    sound.whee();
    say('whee');
    // Baba, if he is near, climbs onto his own piece and comes too.
    setTimeout(() => {
      if (Math.abs(baba.s.x - oona.s.x) < 4 && baba.s.mode !== 'slide') {
        baba.place(Math.max(SLIDE.x0 - 1.2, Math.min(baba.s.x, SLIDE.x0 - 0.1)));
        if (baba.slide()) { babaSliding = true; island.babaEgg.visible = true; }
      }
    }, 900);
    // And Mossy, if he is at home on the top.
    setTimeout(() => {
      if (mossyShow === 'home' && Math.abs(mossy.s.x - STOPS.mossy.x) < 0.5) {
        mossy.place(SLIDE.x0 - 0.3);
        mossy.slide();
      }
    }, 800);
  }

  function slid() {
    bump('slides');
    award('slide');
    const lines = st.slides === 1 ? ['slide-1'] : [cycle('slide', st.slides)];
    say(lines);
    eggBackAt = performance.now() + 1100;
  }

  // ---- seeds on the wind ----------------------------------------------------------
  const flying = [];
  function launchSeeds(at, n) {
    let k = 0;
    for (const s of island.seeds) {
      if (k >= n) break;
      if (s.visible) continue;
      s.visible = true;
      s.position.set(at.x + (Math.random() - 0.5) * 0.3, at.y + (Math.random() - 0.5) * 0.3, 0.5);
      s.scale.setScalar(1);
      flying.push({ s, vx: 0.6 + Math.random() * 1.2, vy: 0.3 + Math.random() * 0.7, ph: Math.random() * 6, life: 0 });
      k++;
    }
  }

  // ---- input: keys -----------------------------------------------------------------
  const held = { left: false, right: false, up: false, down: false };
  const inSea = () => oona.s.mode === 'swim' || oona.s.mode === 'dive';
  let lastFlap = -1;
  function doFlap(now) {
    if (busy) return;
    if (oona.flap()) {
      lastFlap = now;
      sound.flap();
      bump('flaps');
      if (!told.has('flap')) once('flap', { auto: true });
    }
  }
  const KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ' ': 'up' };
  addEventListener('keydown', (e) => {
    sound.unlock();
    lastInput = performance.now();
    const k = KEYMAP[e.key];
    if (k) {
      e.preventDefault();
      if (k === 'up' && !e.repeat) doFlap(performance.now() / 1000);
      held[k] = true;
      if (k !== 'up') pending = null;
      return;
    }
    // Down: in the sea it dives; on land it does the nearest thing.
    if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && inSea()) {
      e.preventDefault();
      held.down = true; pending = null;
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'Enter') {
      e.preventDefault();
      // Carrying fish with Baba beside her: the nearest thing is Baba.
      if (carried && Math.abs(baba.s.x - oona.s.x) < 2.5) { feedBaba(); return; }
      const n = nearest();
      if (n) approach(n);
    }
  });
  addEventListener('keyup', (e) => {
    const k = KEYMAP[e.key]; if (k) held[k] = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') held.down = false;
  });
  addEventListener('blur', () => { held.left = held.right = held.up = held.down = false; });

  // ---- input: touch and mouse ------------------------------------------------------
  attachPointer(canvas, camera, {
    pickables: () => (talk?.active() ? talk.pickables() : where === 'under' ? island.underThings.filter((o) => o.userData.room === room).concat(cast.baba.root, cast.oona.root) : island.things.concat(cast.oona.root)),
    onTap: (root) => {
      sound.unlock(); lastInput = performance.now();
      const name = root.userData.pick;
      for (const x of extras) if (x.tap?.(name)) return;
      // Baba and the frog go where they like; tap them and they answer.
      if (name === 'baba') feedBaba();
      else if (name === 'frog') act('frog');
      else approach(name);
    },
    onPress: (p) => {
      sound.unlock();
      lastInput = performance.now();
      if (!p || busy) return;
      pending = null;
      // Under the water: swim there (diving, if she is on top).
      if (oona.wet(p.x) && p.y < SURFACE - 0.3) { oona.goTo(p.x, p.y); return; }
      // Above her head is the sky: flap, and drift toward the tap. Under the
      // sea "above her head" is still sea, so the sky starts at the surface.
      const sky = oona.s.mode === 'dive' ? SURFACE + 1.2 : oona.s.y + 1.9;
      if (p.y > sky) {
        doFlap(performance.now() / 1000);
        if (Math.abs(p.x - oona.s.x) > 0.7) oona.goTo(p.x); else oona.stop();
      } else oona.goTo(p.x);
    },
    onDrag: (p) => { if (p && !busy) oona.goTo(p.x, oona.wet(p.x) && p.y < SURFACE - 0.3 ? p.y : null); },
  });

  // ---- the camera -------------------------------------------------------------------
  const UNDER_BOUNDS = [UNDER.lo - 3, UNDER.hi + 3];
  const aimNow = () => aimFor(camera, oona.s.x, oona.s.y, oona.s.facing, oona.s.mode === 'fly' && where === 'island', oona.s.mode === 'dive', where === 'under' ? (travelling ? [-30, 30] : [ROOMS[room].lo - 3, ROOMS[room].hi + 3]) : null);
  // Through a door the camera jumps rather than drifts.
  function snapCamera() {
    const tc = talk?.camera();
    const a = tc || aimNow();
    camZ = tc ? tc.z : CAM_Z;
    placeCamera(camera, a.x, a.y, camZ);
    island.sky.position.set(a.x, a.y + 6, -70);
  }

  // ---- the extras: night, and the little things to do and find -------------------------
  const extraCtx = {
    kit, island, cast, oona, baba, sound, voice, camera, stage, canvas,
    say, once, award, bump, hop, told, splashUp, speech,
    get where() { return where; }, get room() { return room; },
    get busy() { return busy; }, set busy(v) { busy = v; },
    get napping() { return napping; }, get carried() { return carried; },
    get lastInput() { return lastInput; },
    get daylight() { return night.k; },
    set where(v) { where = v; }, set room(v) { room = v; },
    fade, moment, snapCamera: () => snapCamera(), nap: () => nap(),
    met: (who) => st.met.includes(who),
    frogIdle: () => frog.t < 0,
    peeking: () => peekT >= 0,
  };
  const night = installNight(extraCtx);
  const fun = installFun(extraCtx);
  const talk = installTalk(extraCtx);
  const extras = [talk, night, fun];
  const holdsOona = () => extras.some((x) => x.holdsOona?.());
  const holdsBaba = () => extras.some((x) => x.holdsBaba?.());

  // ---- every frame ------------------------------------------------------------------
  const aim0 = aimFor(camera, oona.s.x, oona.s.y, 1);
  placeCamera(camera, aim0.x, aim0.y);
  let stepClock = 0;
  let camZ = CAM_Z;
  let pitch = 0;
  let bubbleClock = 0;
  const bubbling = [];

  stage.onFrame((t, dt) => {
    const now = performance.now();
    // On Silky's back, the ride steers.
    if (riding) {
      const u = (now - riding.t0) / (RIDE_SECONDS * 1000);
      const p = rideAt(u);
      const under = p.y < SURFACE - 0.1;
      if (under !== riding.wasUnder) { sound.splash(); riding.wasUnder = under; }
      if (!riding.leapt && p.y > SURFACE + 0.6 && u > 0.3) { riding.leapt = true; say('whee'); sound.whee(); }
      const heading = p.dx >= 0 ? 1 : -1;
      const pitchNow = Math.max(-0.9, Math.min(0.9, Math.atan2(p.dy, Math.abs(p.dx) + 1e-6)));
      riding.pos = { x: p.x, y: p.y, heading, pitch: pitchNow, under };
      oona.s.x = p.x; oona.s.y = p.y + 0.42; oona.s.facing = heading; oona.s.vx = p.dx; oona.s.vy = p.dy;
      oona.s.mode = under ? 'dive' : 'swim';
      if (u >= 1) endRide();
    }
    // Steering.
    if (!busy) {
      const dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      // In the sea, up and down steer too: under the water held up swims up
      // rather than flapping; on the surface it takes off, as on land.
      const under = oona.s.mode === 'dive';
      const dy = inSea() ? (held.down ? -1 : under && held.up ? 1 : 0) : 0;
      oona.drive(dir, dy);
      if (dir || dy) pending = null;
      if (held.up && !under && t - lastFlap > 0.28) doFlap(t);
    }
    speech.pump();
    for (const x of extras) x.update?.(t, dt, now);
    for (const ev of (riding || holdsOona()) ? [] : oona.step(dt)) {
      if (ev === 'landed') sound.land();
      if (ev === 'slid') slid();
      if (ev === 'splash' || ev === 'wade') { sound.splash(); if (oona.s.x > 30 && oona.s.x < 81) once('swim', { auto: ev === 'wade' }); }
      if (ev === 'boing') {
        sound.boing();
        const i = padAt(oona.s.x);
        if (i >= 0) island.pads[i].userData.squash = 1;
        bump('boings');
        if (++boings === 1) once('boing');
        if (boings >= 3) award('pads');
      }
      if (ev === 'lifted') sound.wind();
      if (ev === 'cannonball') {
        splashUp(oona.s.x, oona.s.y);
        bump('cannonballs'); award('splash');
        say(!told.has('cannonball') ? ['cannonball', 'cannonball-2'] : ['cannonball']);
        told.add('cannonball');
        if (Math.abs(oona.s.x - STOPS.marvin.x) < 10) hop(cast.marvin);
      }
      if (ev === 'dive') {
        sound.dive();
        bump('dives');
        award('sea');
        once('dive');
      }
      if (ev === 'surfaced') { sound.surface(); if (told.has('dive')) once('surface', { kind: 'event', ttl: 2500 }); }
    }
    if (oona.s.mode === 'dive' && oona.s.y < groundY(oona.s.x) + 0.6) once('deep', { auto: true });
    if (pending === 'baba') {
      if (Math.abs(baba.s.x - oona.s.x) < 2) { pending = null; oona.stop(); feedBaba(); }
      else if (oona.target === null) oona.goTo(baba.s.x);
    } else if (pending && oona.target === null && !['fly', 'slide', 'dive'].includes(oona.s.mode)) {
      const name = pending; pending = null;
      act(name);
    }

    // Baba after her; Mossy about his business.
    if (babaSliding) {
      if (baba.step(dt).includes('slid')) { babaSliding = false; island.babaEgg.visible = false; }
    } else if (!busy && !holdsBaba()) {
      follow(baba, oona);
      for (const ev of baba.step(dt)) {
        if (ev === 'wade' && told.has('swim') && baba.s.x > 30) once('baba-float', 'event');
        if (ev === 'boing') { sound.boing(); const i = padAt(baba.s.x); if (i >= 0) island.pads[i].userData.squash = 1; }
      }
    }
    for (const ev of mossy.step(dt)) {
      if (ev === 'slid') {
        mossy.goTo(STOPS.mossy.x);
        if (mossyShow === 'sliding') { say('mossy-2', 'event'); }
        mossyShow = 'home';
      }
    }
    if (mossyShow === 'waiting' && oona.s.x > 20.3 && !busy && where === 'island') {
      // Show before you need: Mossy goes first.
      mossyShow = 'sliding';
      say('mossy-hello', { kind: 'event', ttl: 3000 });
      mossy.place(SLIDE.x0 - 0.3);
      mossy.slide();
      sound.squeak();
    }

    // Things the island says as you arrive (only on the island).
    if (where === 'island') {
    // Every visit, while there are clocks to blow: the first time she is
    // among them, the narrator says so (as an event: it waits its turn
    // rather than giving up behind a hello).
    if (oona.s.x > -7.5 && oona.s.x < 12 && blown.some((b) => !b)) once('dandelion-hint', { kind: 'event', ttl: 12000, still: () => oona.s.x > -9 && oona.s.x < 14 && blown.some((b) => !b) });
    if (Math.abs(oona.s.x - STOPS.egg.x) < 2 && mossyShow === 'home' && !story.has(st, 'slide')) once('egg-hint', { auto: true });
    if (oona.s.x > 38.5) {
      if (!told.has('sea')) once('sea', { auto: true });
      else if (now - lastSaid() > 20000) once('sea-fact', { auto: true });
    }
    if (oona.s.mode === 'fly' && Math.abs(oona.s.x - baba.s.x) > 6 && !told.has('baba-wait')) {
      told.add('baba-wait');
      say(['baba-wait', 'baba-fly'], 'event');
    }
    }
    // West: the pond, the cliffs and their wind.
    if (oona.s.x < -65.5 && oona.s.x > -83) once('pond', { auto: true });
    if (oona.s.x < -86) once('cliffs', { auto: true });
    if (oona.s.mode === 'fly' && oona.s.x < UPDRAFT_X && !told.has('wind')) { told.add('wind'); award('wind'); say('wind'); sound.wind(); }
    if (where === 'island' && oona.s.x < -76 && oona.s.x > -88 && !told.has('marvin-hello') && !busy) marvinJump();
    // In the tunnels, walking on into the roots is climbing them.
    if (where === 'under' && room === 'main' && !busy && oona.s.x >= UNDER.hi - 0.35 && (held.right || oona.target !== null && oona.target >= UNDER.hi - 0.35)) climb();
    if (where === 'under' && room === 'main' && oona.s.x > -6 && oona.s.x < 0) once('branches', { auto: true });
    // In a branch room, walking on into the end the tunnel leaves from takes
    // it: nobody gets stuck at the back of a cave.
    if (where === 'under' && room !== 'main' && !busy) {
      for (const l of LINKS) {
        if (l.from !== room) continue;
        const dir = Math.sign(l.path[1][0] - l.path[0][0]) || 1;
        const w = ROOMS[room], edge = dir < 0 ? w.lo : w.hi;
        const atEdge = Math.abs(oona.s.x - edge) < 0.45 || (dir < 0 ? oona.s.x <= l.at + 0.05 : oona.s.x >= l.at - 0.05);
        const pushing = (dir < 0 ? held.left : held.right) || (oona.target !== null && (dir < 0 ? oona.target <= l.at + 0.1 : oona.target >= l.at - 0.1));
        if (atEdge && pushing) { travel(l); break; }
      }
    }
    // The ways on glow, gently, so they are easy to find.
    if (where === 'under') for (const mo of island.under.mouths) if (mo.userData.room === room) mo.userData.glow.scale.setScalar(1 + 0.18 * Math.sin(t * 3 + mo.userData.stop));
    if (travelling) {
      const tv = travelling;
      tv.u = Math.min(1, tv.u + dt / tv.dur);
      const p = tv.curve.getPointAt(tv.u), q = tv.curve.getPointAt(Math.min(1, tv.u + 0.01));
      oona.s.x = p.x; oona.s.y = p.y; oona.s.mode = 'walk';
      if (Math.abs(q.x - p.x) > 1e-4) oona.s.facing = Math.sign(q.x - p.x);
      const pb = tv.curve.getPointAt(Math.max(0, tv.u - 0.14));
      baba.s.x = pb.x; baba.s.y = pb.y; baba.s.mode = tv.u > 0.14 ? 'walk' : 'stand'; baba.s.facing = oona.s.facing;
      if (tv.u >= 1) arrive(tv.link);
    }
    // The mouse's peekaboo: duck (0-0.25s), gone (-0.9s), up out of another hole.
    if (where === 'under' && room === 'pantry' && peekT < 0 && peekTimer && now > peekTimer) peekaboo(false);
    if (peekT >= 0) {
      peekT += dt;
      const ms = cast.mouse, u = ms.root.userData;
      if (peekT < 0.25) ms.rig.scale.y = 1 - peekT / 0.25;
      else if (peekT < 0.9) {
        ms.rig.scale.y = 0.001;
        if (!u.moved) {
          u.moved = true;
          u.hole = (u.hole + 1 + Math.floor(Math.random() * 2)) % PANTRY.mouse.length;
          const hx = PANTRY.mouse[u.hole];
          ms.root.position.x = hx; ms.root.position.y = pantryFloor(hx) + 0.05; u.stop = hx;
        }
      } else if (peekT < 1.15) ms.rig.scale.y = (peekT - 0.9) / 0.25;
      else { ms.rig.scale.y = 1; peekT = -1; u.moved = false; peekTimer = now + 5000 + Math.random() * 3000; }
      ms.rig.userData.base = 1;
    }
    // Light running along the fungi's threads.
    for (let i = running.length - 1; i >= 0; i--) {
      const r = running[i];
      r.t += dt;
      const k = Math.max(0, Math.min(1, r.t / r.dur)), f = k * (r.pts.length - 1), a = Math.floor(f), bb = Math.min(r.pts.length - 1, a + 1), fr = f - a;
      r.b.position.x = r.pts[a][0] + (r.pts[bb][0] - r.pts[a][0]) * fr;
      r.b.position.y = r.pts[a][1] + (r.pts[bb][1] - r.pts[a][1]) * fr;
      r.b.visible = r.t >= 0;
      if (k >= 1) {
        r.b.visible = false; running.splice(i, 1);
        if (r.to >= 0) lightMush(r.to);
      }
    }
    if (!caveLitAt && island.under.caveMush.every((mm) => mm.userData.lit)) {
      caveLitAt = now;
      award('fungi');
      say('glow');
    }
    if (caveLitAt && now - caveLitAt > 12000) {
      caveLitAt = 0;
      for (const mm of island.under.caveMush) { mm.userData.lit = 0; mm.userData.light(false); used.delete(mm.userData.pick); }
    }
    if (climbing) {
      climbing.t += dt;
      const top = -9.8, dur = 3.2, k = Math.min(1, climbing.t / dur);
      const ease = k * k * (3 - 2 * k);
      oona.s.x = climbing.x; oona.s.y = climbing.y0 + (top - climbing.y0) * ease; oona.s.mode = 'climb';
      const kb = Math.max(0, Math.min(1, (climbing.t - 0.6) / dur)), eb = kb * kb * (3 - 2 * kb);
      baba.s.x = climbing.x - 0.15; baba.s.y = climbing.y0 + (top - 1.2 - climbing.y0) * eb; baba.s.mode = 'climb';
      if (k >= 1) { climbing = null; busy = false; goUp('warren'); }
    }
    // The spray falls back into the water.
    for (let i = spray.length - 1; i >= 0; i--) {
      const d = spray[i];
      d.vy -= 15 * dt; d.s.position.x += d.vx * dt; d.s.position.y += d.vy * dt;
      if (d.s.position.y < d.floor) { d.s.visible = false; d.s.scale.setScalar(1); spray.splice(i, 1); }
    }
    if (where === 'island' && Math.abs(oona.s.x - (-73.2)) < 3) once('bridge', { auto: true });
    // Out at sea: the kelp, the jellies, the whale.
    if (where === 'island' && oona.s.mode === 'dive' && oona.s.x > 51 && oona.s.x < 64) once('kelp', { auto: true });
    if (where === 'island' && oona.s.mode === 'dive' && island.jellies.some((j) => Math.hypot(j.root.position.x - oona.s.x, j.root.position.y - oona.s.y) < 2.5)) once('jelly', { auto: true });
    // East: Silky, the shore.
    if (oona.s.x > 60 && !riding) once('silky-see', { auto: true });
    if (oona.s.x > 77) once('shore', { auto: true });

    // Past the rocky shore: the dunes, the bog, the falls.
    if (where === 'island' && oona.s.x > 98.5) {
      once('dunes', { auto: true });
      if (oona.s.x > 100 && oona.s.x < 113 && told.has('dunes') && !story.has(st, 'dig')) once('dig-hint', { auto: true });
      if (oona.s.x > 116) once('bog', { auto: true });
      if (oona.s.x > 117 && told.has('bog')) once('dragonfly', { auto: true });
      if (oona.s.x > 120.5) once('falls', { auto: true });
    }
    // The dig: 1.1s of flying sand, then the treasure.
    if (digT >= 0) {
      digT += dt;
      const d = island.dunes.digs[digging];
      if (Math.floor((digT - dt) / 0.08) !== Math.floor(digT / 0.08)) {
        const gr = island.dunes.grains.find((q) => !q.visible);
        if (gr) { gr.visible = true; gr.position.set(d.position.x, d.position.y + 0.15, 0.4); flyingSand.push({ gr, vx: (Math.random() - 0.5) * 3, vy: 3 + Math.random() * 2, y0: d.position.y }); }
      }
      d.userData.mound.scale.set(1, 1 - Math.min(0.7, digT * 0.6), 1);
      if (digT > 1.1) { digT = -1; dug(digging); }
    }
    for (let i = flyingSand.length - 1; i >= 0; i--) {
      const f = flyingSand[i];
      f.vy -= 15 * dt; f.gr.position.x += f.vx * dt; f.gr.position.y += f.vy * dt;
      if (f.gr.position.y < f.y0) { f.gr.visible = false; flyingSand.splice(i, 1); }
    }
    // The shower: on the ledge under the falls, the rainbow comes out.
    {
      const under = where === 'island' && oona.s.x > FALLS.x0 - 0.2 && oona.s.x < FALLS.x1 + 0.3 && oona.s.mode !== 'fly';
      showerK += ((under ? 1 : 0) - showerK) * Math.min(1, dt * (under ? 1.5 : 0.4));
      island.dunes.rainbow.userData.fade(showerK);
      if (under && !showered) { showered = true; say('shower'); sound.splash(); }
      if (!under && showerK < 0.05) showered = false;
      if (showerK > 0.85) { if (award('rainbow')) setTimeout(() => say('rainbow', { kind: 'event', ttl: 10000 }), 1800); }
    }
    for (const sk of island.dunes.falls.userData.streaks) {
      sk.position.y -= dt * 3.2;
      if (sk.position.y < -0.2) sk.position.y += 5.8;
    }
    for (const c of island.dunes.cotton) c.rotation.z = Math.sin(t * 1.3 + c.userData.ph) * 0.12;
    island.dunes.dragonflies.forEach((df, i) => {
      const u = df.userData, hover = Math.sin(t * 0.7 + u.ph) > 0.3;
      df.position.x = 118.2 + Math.sin(t * 0.45 + u.ph) * 2.6;
      df.position.y = 1.2 + i * 0.35 + Math.sin(t * 1.3 + u.ph) * (hover ? 0.05 : 0.35);
      df.scale.x = Math.cos(t * 0.45 + u.ph) >= 0 ? 1 : -1;
      u.wings.scale.y = 0.6 + Math.abs(Math.sin(t * 40 + i)) * 0.4;
    });

    // The wood, arriving.
    if (oona.s.x < WOOD_X - 1 && where === 'island') {
      if (!told.has('wood')) once('wood', { auto: true });
      else if (!story.has(st, 'mushrooms') && oona.s.x < STOPS.mushrooms[0].x + 2) once('mushroom-hint', { auto: true });
      else if (now - lastSaid() > 25000) once('wood-fact', { auto: true });
    }
    // Out by the sea, Baba gets hungry: the fishing, shown before it is needed.
    if (where === 'island' && told.has('sea') && oona.s.x > 38 && !story.has(st, 'fish') && !carried && now - lastSaid() > 8000 && !told.has('baba-hungry')) {
      told.add('baba-hungry');
      hop(cast.baba);
      say(['baba-hungry', 'fish-hint'], 'event');
    }
    if (litFadeAt && now > litFadeAt) {
      litFadeAt = 0;
      for (const m of island.mushrooms) { m.userData.light(false); used.delete(m.userData.pick); }
    }
    if (regrowAt && now > regrowAt) { regrowAt = 0; regrow(); }
    if (eggBackAt && now > eggBackAt) {
      eggBackAt = 0;
      island.egg.position.copy(island.egg.userData.home);
      island.egg.rotation.z = 0;
      sound.pop();
    }
    // Nothing for a long while: a nudge, never a push.
    if (now - lastInput > 35000 && now - lastSaid() > 35000 && !busy) {
      lastInput = now;
      say('hint', { auto: true });
      moment('helped', { what: 'hint' });
    }

    // Marvin's demonstration: swim to the bank, climb out, a big leap, and a
    // tucked-up somersault into the pond. SPLASH.
    {
      const m = cast.marvin, home = STOPS.marvin.x, bank = BANK.x;
      if (marvinT >= 0) {
        marvinT += dt;
        let x, y, spin = 0, facing = -1;
        if (marvinT < 1.4) { const k = marvinT / 1.4; x = home + (bank - home) * k; y = Math.max(groundY(x), POND - 0.25); }
        else if (marvinT < 2.6) {
          const k = (marvinT - 1.4) / 1.2; facing = 1;
          x = bank + (home - bank) * k; y = groundY(bank) + (POND - 0.25 - groundY(bank)) * k + Math.sin(k * Math.PI) * 2.6;
          spin = -k * Math.PI * 2;
        } else {
          x = home; y = POND - 0.25; facing = -1;
          if (!m.root.userData.splashed) { m.root.userData.splashed = true; splashUp(home, POND); }
          if (marvinT > 3.0) { marvinT = -1; m.root.userData.splashed = false; meet('marvin'); }
        }
        m.root.position.set(x, y, 0.2);
        m.flip = facing; m.root.scale.x = facing;
        m.rig.rotation.z = spin;
      } else {
        m.root.position.set(home, POND - 0.25 + Math.sin(t * 1.6) * 0.03, 0.9);
        m.rig.rotation.z = Math.sin(t * 1.1) * 0.05;
      }
    }
    // The sheep graze; baa'd at, the ewe lifts her head.
    if (baaT >= 0) { baaT += dt; if (baaT > 1.2) baaT = -1; }
    for (const [i, sh] of [cast.sheep, cast.lamb].entries()) {
      const head = sh.ears[0];
      head.rotation.z = baaT >= 0 ? 0.25 : -0.35 + Math.sin(t * 1.4 + i) * 0.08;
    }
    // The whale breathes now and then while she is out at sea.
    {
      const wh = island.whale, sp = wh.userData.spout;
      wh.userData.t = (wh.userData.t ?? 0) + dt;
      const cyc = wh.userData.t % 14;
      wh.position.y = -1.5 + Math.min(1, Math.max(0, Math.sin((cyc / 14) * Math.PI * 2))) * 1.4;
      const sprayK = cyc > 3 && cyc < 4.6 ? Math.sin(((cyc - 3) / 1.6) * Math.PI) : 0;
      sp.scale.set(1, Math.max(0.001, sprayK), 1);
      if (sprayK > 0.95 && where === 'island' && oona.s.x > 45) once('whale', { kind: 'event', ttl: 3000 });
    }
    for (const k of island.kelp) k.rotation.z = Math.sin(t * 0.6 + k.userData.ph) * 0.08;
    for (const j of island.jellies) {
      const u = j.root.userData;
      j.root.position.x = u.x0 + Math.sin(t * 0.15 + u.ph) * 1.5;
      j.root.position.y = u.y0 + Math.sin(t * 0.7 + u.ph) * 0.3;
      j.rig.scale.set(1 + Math.sin(t * 2.4 + u.ph) * 0.08, 1 - Math.sin(t * 2.4 + u.ph) * 0.08, 1);
    }

    // The frog: every few seconds, while she is near enough to see, a hop.
    if (Math.abs(oona.s.x - STOPS.frog.x) < 14 && frog.t < 0 && t > frog.next) frogHop();
    {
      const a = PADS[frog.from].x, b = PADS[frog.pad].x;
      let fx = b, fy = POND + 0.1;
      if (frog.t >= 0) {
        frog.t += dt / 0.7;
        const k = Math.min(1, frog.t);
        fx = a + (b - a) * k; fy += Math.sin(k * Math.PI) * 1.1;
        cast.frog.flip = b >= a ? 1 : -1;
        if (frog.t >= 1) {
          frog.t = -1; frog.next = t + 3.5 + Math.random() * 2;
          island.pads[frog.pad].userData.squash = 0.6;
          if (Math.abs(oona.s.x - STOPS.frog.x) < 10) sound.boing();
        }
      }
      cast.frog.root.position.set(fx, fy, 0.9);
    }
    for (const pd of island.pads) {
      pd.userData.squash = Math.max(0, pd.userData.squash - dt * 4);
      pd.scale.set(1 + pd.userData.squash * 0.12, 1 - pd.userData.squash * 0.45, 1);
      pd.position.y = POND + 0.02 + Math.sin(t * 1.3 + pd.userData.x) * 0.012 - pd.userData.squash * 0.06;
    }
    // Under the ground: the hedgehog uncurls, the worm wriggles.
    if (curledUntil && now > curledUntil) { curledUntil = 0; cast.hedgehog.face.visible = true; cast.hedgehog.ball.visible = false; }
    if (cast.hedgehog.ball.visible) cast.hedgehog.ball.rotation.z = Math.sin(t * 6) * 0.12;
    {
      const w = island.under.worm, fast = wormUntil > now ? 3 : 1;
      w.userData.segs.forEach((sg, k) => {
        const out = wormUntil > now ? 0.2 : 0;
        sg.position.x = Math.sin(t * 2.5 * fast + k * 0.9) * 0.07 * (k / 5);
        sg.position.y = -k * 0.11 - out * k * 0.2;
      });
    }
    // May's family: up out of their holes, a few seconds of hello, and down.
    if (rabbitsUp) {
      const age = (now - rabbitsUp) / 1000;
      island.rabbits.forEach((rb, i) => {
        const x = rb.root.userData.x, top = groundY(x) + 0.05;
        const up = Math.min(1, Math.max(0, (age - i * 0.25) / 0.35)) * (age < 7 ? 1 : Math.max(0, 1 - (age - 7) / 0.5));
        rb.root.position.y = top - 1.4 * (1 - up);
      });
      if (age > 7.6) { rabbitsUp = 0; for (const rb of island.rabbits) rb.root.visible = false; }
    }
    for (const rb of island.rabbits) if (rb.root.visible) animate(rb, t, { mode: 'stand', facing: rb.flip >= 0 ? 1 : -1 }, dt);

    // The crab's scuttle, the anemone opening again.
    if (crabT >= 0) {
      crabT += dt / 1.2;
      const k = Math.min(1, crabT);
      cast.crab.root.position.x = STOPS.crab.x + Math.sin(k * Math.PI * 3) * 0.3 * (1 - k * 0.3);
      for (const cl of cast.crab.wings) cl.rotation.z = Math.sin(t * 20) * 0.25;
      if (crabT >= 1) { crabT = -1; cast.crab.root.position.x = STOPS.crab.x; for (const cl of cast.crab.wings) cl.rotation.z = 0; }
    }
    if (anemoneShutUntil && now > anemoneShutUntil) { anemoneShutUntil = 0; island.anemone.userData.close(false); }
    // The blowhole: whooshes by itself every few seconds while she is on the
    // shore (so she sees it before she needs it), or soon after it is tapped.
    const bx = STOPS.blowhole.x;
    if (Math.abs(oona.s.x - bx) < 16 && spoutT < 0 && !spoutNext) spoutNext = t + 3;
    if (spoutNext && t > spoutNext && spoutT < 0) { spoutT = 0; spoutNext = 0; spoutLaunched = false; sound.whoosh(); if (Math.abs(oona.s.x - bx) < 12) once('blowhole-hint', 'event'); }
    if (spoutT >= 0) {
      spoutT += dt;
      const grow = Math.min(1, spoutT / 0.25), fall = spoutT > 0.9 ? Math.max(0, 1 - (spoutT - 0.9) / 0.45) : 1;
      island.spout.visible = true;
      island.spout.scale.set(1 + Math.sin(t * 30) * 0.04, Math.max(0.001, grow * fall), 1);
      // Whoever is standing on it goes up with it.
      if (!spoutLaunched && spoutT > 0.08) {
        spoutLaunched = true;
        if (Math.abs(oona.s.x - bx) < 0.9 && oona.s.mode !== 'dive' && !busy) {
          oona.launch(12.5); bump('whooshes'); award('blowhole'); say('blowhole');
        }
        if (Math.abs(baba.s.x - bx) < 0.9) baba.launch(9);
      }
      if (spoutT > 1.4) { spoutT = -1; island.spout.visible = false; if (Math.abs(oona.s.x - bx) < 16) spoutNext = t + 6 + Math.random() * 2; }
    }
    // Seabirds: the gannets hang in the wind, round and round; the kittiwakes
    // shift on their ledges.
    island.gannets.forEach((g, i) => {
      const a = t * 0.35 + g.root.userData.ph;
      g.root.position.x = -97.5 + Math.cos(a) * 3;
      g.root.position.y = CLIFF + 4 + i * 0.9 + Math.sin(a * 2) * 0.6;
      g.flip = Math.sin(a) > 0 ? -1 : 1; g.root.scale.x = g.flip;
      g.rig.rotation.z = Math.sin(a * 2) * 0.12;
    });
    island.kittiwakes.forEach((k, i) => animate(k, t + i, { mode: 'stand', facing: k.flip >= 0 ? 1 : -1 }, dt));

    // Everyone where they are, doing what they do.
    const slope = (b) => (b.world.ground(b.s.x + 0.05) - b.world.ground(b.s.x - 0.05)) / 0.1;
    // Under the sea she is drawn in FRONT of the water (and behind its faint
    // skin); on top of it, behind, so the sea hides her from the belly down.
    cast.oona.root.position.set(oona.s.x, oona.s.y, riding ? 0.93 : oona.s.mode === 'dive' ? 0.9 : 0.1);
    if (riding?.pos) {
      const r = riding.pos;
      cast.silky.root.position.set(r.x, r.y - 0.05, 0.9);
    } else cast.silky.root.position.set(STOPS.silky.x, groundY(STOPS.silky.x), -0.05);
    cast.baba.root.position.set(baba.s.x, baba.s.y, 0.05);
    cast.mossy.root.position.set(mossy.s.x, mossy.s.y, -0.1);
    if (oona.s.mode === 'slide' && where === 'island') {
      island.egg.position.set(oona.s.x, oona.s.y - 0.08, 0.35);
      island.egg.rotation.z = Math.atan(slope(oona));
    }
    if (babaSliding) {
      island.babaEgg.position.set(baba.s.x, baba.s.y - 0.06, 0.33);
      island.babaEgg.rotation.z = Math.atan(slope(baba));
    }
    // What wants tapping breathes: gently if he has not tried it yet, more
    // when she is standing right by it.
    const near = busy ? null : nearest(2.4);
    const breathe = (name) => {
      if (name === near) return 0.07 * (0.5 + 0.5 * Math.sin(t * 5));
      if (!used.has(name)) return 0.035 * (0.5 + 0.5 * Math.sin(t * 3));
      return 0;
    };
    for (const [name, c] of Object.entries(cast)) {
      let pose;
      if (c === cast.silky && riding?.pos) pose = { mode: 'dive', facing: riding.pos.heading, pitch: riding.pos.pitch };
      else if (c === cast.marvin) pose = { mode: marvinT >= 0 ? 'walk' : 'stand', facing: c.flip >= 0 ? 1 : -1, breathe: breathe('marvin') };
      else if (c === cast.frog) pose = { mode: 'stand', facing: c.flip >= 0 ? 1 : -1, breathe: breathe('frog') };
      else if (c === cast.oona && riding?.pos) pose = { mode: 'ride', facing: riding.pos.heading, pitch: riding.pos.pitch };
      else if (c === cast.oona) {
        // Swimming she points where she is going: nose up to rise, down to dive.
        const want = oona.s.mode === 'dive' ? Math.max(-1.1, Math.min(1.1, Math.atan2(oona.s.vy, Math.abs(oona.s.vx) + 0.6))) : 0;
        pitch += (want - pitch) * Math.min(1, dt * 6);
        pose = { mode: oona.s.cannon ? 'cannon' : oona.s.mode, facing: oona.s.facing, slope: slope(oona), pitch, sleep: napping };
      }
      else if (c === cast.baba) pose = { mode: baba.s.mode, facing: baba.s.facing, slope: slope(baba), sleep: napping };
      else if (c === cast.mossy) pose = { mode: mossy.s.mode, facing: mossy.s.facing, slope: slope(mossy), breathe: breathe('mossy') };
      else pose = { mode: 'stand', facing: c.flip >= 0 ? 1 : -1, breathe: breathe(name) };
      for (const x of extras) { const ov = x.pose?.(c); if (ov) { pose = ov; break; } }
      if (hops.has(c)) {
        const h = hops.get(c) + dt * 2.2;
        if (h >= 1) hops.delete(c); else { hops.set(c, h); pose.mode = 'hop'; pose.hop = h; }
      }
      animate(c, t, pose, dt);
    }
    island.door.scale.setScalar(1 + breathe('burrow'));
    for (const m of island.mushrooms) m.userData.cap.scale.setScalar(1 + breathe(m.userData.pick) * 1.6);
    for (const st2 of island.stars) st2.scale.setScalar(0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.2 + st2.userData.ph)));
    for (const d of island.dandelions) d.userData.head.scale.setScalar(1 + breathe(d.userData.pick) * 1.6);
    if (oona.s.mode !== 'slide' && !eggBackAt) island.egg.scale.setScalar(1 + breathe('egg') * 1.6);

    // Footsteps, softly.
    if (oona.s.mode === 'walk') { stepClock += dt; if (stepClock > 0.26) { stepClock = 0; sound.step(); } }

    // Seeds ride the wind; clouds drift; fish swim.
    for (let i = flying.length - 1; i >= 0; i--) {
      const f = flying[i];
      f.life += dt;
      f.s.position.x += (f.vx + 0.6) * dt;
      f.s.position.y += (f.vy * 0.6 + Math.sin(t * 2 + f.ph) * 0.25) * dt;
      f.s.rotation.z = Math.sin(t * 3 + f.ph) * 0.4;
      if (f.life > 5) f.s.scale.setScalar(Math.max(0, 1 - (f.life - 5)));
      if (f.life > 6) { f.s.visible = false; flying.splice(i, 1); }
    }
    for (const c of island.clouds) c.position.x = c.userData.x0 + ((t * c.userData.speed) % 60);
    // The fish go about their own swimming, and dart off when she comes
    // close: a push away from her that fades as they settle again.
    const under = oona.s.mode === 'dive';
    const beak = { x: oona.s.x + oona.s.facing * 0.5, y: oona.s.y + 0.9 };
    island.fish.forEach((f) => {
      const u = f.userData;
      if (!f.visible) {
        if (u.back && now > u.back) { f.visible = true; u.back = 0; u.dx = u.dy = 0; }
        return;
      }
      // Any part of her catches one — beak or body — so a fish by the sea
      // floor, below her beak, is still catchable.
      const touching = Math.hypot(f.position.x - beak.x, f.position.y - beak.y) < 0.5
        || (Math.abs(f.position.x - oona.s.x) < 0.55 && f.position.y > oona.s.y - 0.15 && f.position.y < oona.s.y + 1.3);
      if (under && touching) { catchFish(f); return; }
      if (under) {
        const dx = f.position.x - beak.x, dy = f.position.y - beak.y, d = Math.hypot(dx, dy);
        // They dart, but not so fast a four-year-old cannot catch one.
        if (d < 1.4 && d > 1e-3) { u.dx += (dx / d) * dt * 2.2; u.dy += (dy / d) * dt * 1.5; }
      }
      u.dx *= Math.max(0, 1 - dt * 0.6); u.dy *= Math.max(0, 1 - dt * 0.6);
      const x = u.x0 + Math.sin(t * 0.4 + u.ph) * 1.4 + u.dx;
      const floor = groundY(x) + 0.7;
      const y = Math.max(floor, Math.min(SURFACE - 0.25, u.y0 + Math.sin(t * 0.9 + u.ph) * 0.12 + u.dy));
      const vx = x - f.position.x;
      if (Math.abs(vx) > 1e-4) f.scale.x = vx >= 0 ? 1 : -1;
      f.position.x = x; f.position.y = y;
    });
    for (const w of island.weed) w.rotation.z = Math.sin(t * 0.8 + w.userData.ph) * 0.14;
    // Bubbles from her beak while she is under, up to the surface.
    if (under && (bubbleClock += dt) > 0.22) {
      bubbleClock = 0;
      const b = island.bubbles.find((q) => !q.visible);
      if (b) { b.visible = true; b.position.x = beak.x; b.position.y = beak.y; b.scale.setScalar(0.6 + Math.random() * 0.8); bubbling.push(b); }
    }
    for (let i = bubbling.length - 1; i >= 0; i--) {
      const b = bubbling[i];
      b.position.y += dt * 1.3;
      b.position.x += Math.sin(t * 5 + i) * dt * 0.2;
      if (b.position.y > SURFACE - 0.05) { b.visible = false; bubbling.splice(i, 1); }
    }

    // The camera after her, and the sky after the camera.
    // Sitting down to talk, the camera comes in close to the two of them.
    const tc = talk.camera();
    const aim = tc || aimNow();
    const kx = Math.min(1, dt * (tc ? 1.6 : oona.s.mode === 'slide' ? 5 : 2.6)), ky = Math.min(1, dt * (tc ? 1.6 : 2.2));
    camZ += ((tc ? tc.z : CAM_Z) - camZ) * Math.min(1, dt * 1.4);
    placeCamera(camera, camera.position.x + (aim.x - camera.position.x) * kx, camera.position.y + (aim.y - camera.position.y) * ky, camZ);
    island.sky.position.set(camera.position.x, camera.position.y + 6, -70);
    fun.late(t, dt, now);
    talk.late(t, dt, now);
    night.late(t, dt, fun.rain());
  });

  // ---- the page's handles ---------------------------------------------------------
  const snapshot = () => ({ x: +oona.s.x.toFixed(1), badges: st.badges.length, blown: st.blown, slides: st.slides, flaps: st.flaps });
  moment('started', snapshot());

  return {
    sound, voice, snapshot,
    toggleMute() { sound.toggleMute(); voice.setMuted(sound.muted); },
    begin() {
      sound.unlock();
      bump('visits');
      say(st.visits > 1 ? 'hello-again' : 'hello');
    },
    // For the playtest and for poking at it from the console.
    speechLog: () => speechLog.slice(),
    extras: () => ({ night: night.state(), fun: fun.state(), talk: talk.state() }),
    talk: (name) => talk.start(name),
    pick: (i) => talk.pick(i),
    thingOnPage: (i) => talk.thingOnPage(i),
    rain: () => fun.startRain(),
    state: () => ({ where, room, napping, travelling: !!travelling, oona: { ...oona.s }, baba: { ...baba.s }, mossy: { ...mossy.s }, saved: st, blown: [...blown], busy, pending, mossyShow, carried, feeding, lit: island.mushrooms.map((m) => m.userData.lit), riding: !!riding, boings, frogPad: frog.pad, spouting: spoutT >= 0 }),
    feedBaba,
    goTo: (x, y = null) => oona.goTo(x, y),
    fish: () => island.fish.filter((f) => f.visible).map((f) => ({ x: f.position.x, y: f.position.y })),
    approach,
    // Where on the page a thing is (for the playtest to click it).
    screenOf(name) {
      const o = island.underByName[name] || byName[name] || island.things.find((q) => q.userData.pick === name);
      const r = canvas.getBoundingClientRect();
      const glow = o.userData.glow || o;
      const v = glow.getWorldPosition(new THREE.Vector3()).project(camera);
      return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    },
    screenOfBaba() {
      const r = canvas.getBoundingClientRect();
      const v = cast.baba.root.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.45, 0)).project(camera);
      return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    },
    teleport(x) { oona.place(x); baba.place(x - 1.1); },
    log,
  };
}

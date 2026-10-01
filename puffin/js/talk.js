// SITTING DOWN TO TALK. When Oona is near a friend, a 💬 floats over them;
// tap it and the two of them go and sit somewhere of their own — the hollow
// log in the meadow, the top of the rocks, the stone bridge, Silky's rock, a
// pebble on the beach, the nest — and the pace changes: the camera comes in
// close, the edges of the screen go soft and warm, and they talk (talks.js).
//
// Every line is spoken and shown in a speech bubble over whoever says it (the
// narrator's along the bottom). Where the script offers a choice, two THINGS
// pop up in the nook, glowing and breathing (props.js): tap one (or ←/→ and
// Enter) and Oona says something about it, and the talk goes that way.
// 👋 (or Esc) to leave.
//
// installTalk(ctx) returns the same hooks as the other extras (fun.js), plus
// camera(): where the camera should be while they talk, or null.

import * as THREE from './three.js';
import { blob, ellipse, poly, mergeStatic } from './shapes.js';
import { groundY, STOPS, TOP, POND, BEACH } from './ground.js';
import { TUNNEL_WORLD, UNDER, tunnelFloor } from './under.js';
import { TALKS, lineId } from './talks.js';
import { PROPS } from './props.js';

// Inside May's hollow log: a little room of its own, well away from the
// busy meadow (far off at LOG_X, where nothing else is), stepped into from
// beside her burrow. A floor, a curved wooden roof, a knot-hole window high
// up, the way in on the right — where May comes hopping in to join them.
export const LOG_X = 300;
export const LOG_WORLD = { ground: () => 0, surf: () => -Infinity, pads: () => -1, lo: LOG_X - 2.6, hi: LOG_X + 2.6, slide: null, wind: false, roof: () => 2.35 };

// Where each talk happens: which world, where each of them sits and faces,
// where the camera goes, and where Oona is left standing afterwards.
// `slots`: where the two things of a choice pop up — [x, y] for the first
// and the second, y above the nook's floor there (or `sky`, above the seat);
// `water: true` floats them on the sea instead.
export const NOOKS = {
  log: { world: 'log', oona: [LOG_X - 0.55, 1], friend: [LOG_X + 0.6, -1], enter: 3.2, y: 0, z: 0.1, after: STOPS.may.x - 1.4, cam: [LOG_X, 1.0, 6.4], slots: [[LOG_X - 2.2, 0], [LOG_X + 2.0, 0]], sky: [[LOG_X - 1.55, 1.25], [LOG_X + 1.7, 1.55]] },
  view: { world: 'island', oona: [23.9, 1], friend: [25.0, -1], z: 0.1, after: 23.9, cam: [24.45, TOP + 1.0, 7.5], slots: [[22.2, 0], [26.6, 0]], sky: [[22.4, 2.4], [26.5, 2.4]] },
  bridge: { world: 'island', oona: [-73.9, 1], friend: [-72.5, -1], y: POND + 2.62, z: -1.55, after: -64.6, cam: [-73.2, POND + 2.5, 7.4], slots: [[-75.6, 0], [-70.8, 0]], sky: [[-75.4, 1.8], [-71, 1.8]] },
  rock: { world: 'island', oona: [69.0, 1], friend: [70.6, -1], z: 0.1, after: 69.0, cam: [69.8, 0.3, 7.5], water: true, slots: [[67.7, 0], [72.2, 0]], sky: [[67.6, 1.2], [72.0, 1.2]] },
  pebble: { world: 'island', oona: [37.9, 1], friend: [38.7, -1], z: 0.1, after: 37.9, cam: [38.3, BEACH + 0.95, 6.8], slots: [[36.2, 0], [40.2, 0]], sky: [[36.4, 2.2], [40.1, 2.2]] },
  nest: { world: 'under', oona: [-17.0, -1], friend: [-18.2, 1], baba: -16.2, z: 0.1, after: -17.0, cam: [-17.4, null, 7.5], slots: [[-19.3, 0], [-15.3, 0]], sky: [[-19.2, 2.0], [-15.4, 2.0]] },
};

const HEAD = { oona: 1.75, may: 1.75, mossy: 0.7, marvin: 0.95, silky: 1.2, bernie: 0.75, mama: 1.95, baba: 1.1 };

export function installTalk(ctx) {
  const { kit, island, cast, oona, baba, sound, camera, canvas } = ctx;
  const stage = island.stage;

  // ---- inside May's hollow log -------------------------------------------------------
  {
    const g = new THREE.Group();
    const X = LOG_X;
    const add = (shape, hex, z, o = {}) => g.add(kit.mesh(shape, hex, { z, layer: 0, ...o }));
    // The wood all round, and the hollow cut through it.
    const wood = poly([[X - 9, -6], [X + 9, -6], [X + 9, 8], [X - 9, 8]]);
    const hollow = new THREE.Path();
    hollow.absellipse(X, 1.05, 3.6, 1.75, 0, Math.PI * 2, false, 0);
    wood.holes.push(hollow);
    add(wood, 0x6e4e34, 0.6);
    // Rings of the grain round the opening, and a mossy lip on the floor.
    for (const [rx, ry, hex] of [[3.95, 2.05, 0x7e5c3e], [4.4, 2.4, 0x654630]]) {
      const ring = poly(Array.from({ length: 40 }, (_, k) => { const a2 = k / 40 * Math.PI * 2; return [X + Math.cos(a2) * rx, 1.05 + Math.sin(a2) * ry]; }));
      const inner = new THREE.Path(); inner.absellipse(X, 1.05, rx - 0.12, ry - 0.1, 0, Math.PI * 2, false, 0); ring.holes.push(inner);
      add(ring, hex, 0.601);
    }
    // Inside: the far wall of the hollow, warm dark wood, with grain.
    add(ellipse(X, 1.05, 3.7, 1.85), 0x4e3726, -0.5);
    for (let k = 0; k < 9; k++) add(poly([[X - 3.2 + k * 0.8, -0.2], [X - 3.17 + k * 0.8, -0.2], [X - 3.1 + k * 0.8 + Math.sin(k) * 0.2, 2.6], [X - 3.13 + k * 0.8 + Math.sin(k) * 0.2, 2.6]]), 0x442f20, -0.49);
    // The floor: soft old wood, moss, a bed of dry leaves, little mushrooms.
    add(poly([[X - 4, -0.05], [X + 4, -0.05], [X + 4, -2], [X - 4, -2]]), 0x5a4230, 0.05);
    add(blob([[X - 3.3, 0], [X - 2.6, 0.18], [X - 1.4, 0.1], [X - 0.6, 0.2], [X + 0.4, 0.12], [X + 1.5, 0.2], [X + 3.2, 0], [X, -0.1]], 30), 0x8fb04a, 0.06);
    add(blob([[X - 3.1, 0.02], [X - 2.9, 0.35], [X - 2.3, 0.42], [X - 1.8, 0.2], [X - 2.4, 0.05]], 16), 0xc48a4a, 0.07);
    for (const [mx, h] of [[X + 2.7, 0.35], [X + 2.95, 0.25], [X - 3.3, 0.3]]) { add(poly([[mx - 0.03, 0], [mx + 0.03, 0], [mx + 0.025, h], [mx - 0.025, h]]), 0xe8dcc4, 0.08); add(blob([[mx - 0.14, h], [mx, h + 0.12], [mx + 0.14, h]], 12), 0xd8744a, 0.081); }
    // The knot-hole window high on the left: sky, with light falling in.
    add(ellipse(X - 1.55, 1.9, 0.42, 0.34), 0xbfe0e8, -0.48, { plain: true });
    add(poly([[X - 1.9, 1.7], [X - 1.2, 1.7], [X - 0.2, -0.05], [X - 1.5, -0.05]]), 0xf6e8b0, -0.47, { plain: true, opacity: 0.18 });
    // The way in, on the right: the bright meadow outside.
    add(blob([[X + 3.0, -0.05], [X + 2.95, 0.9], [X + 3.3, 1.5], [X + 3.75, 0.9], [X + 3.8, -0.05]], 20), 0xb7cf62, -0.45);
    add(blob([[X + 3.05, 0.95], [X + 3.3, 1.45], [X + 3.7, 0.95], [X + 3.35, 1.1]], 12), 0xcfe6ee, -0.44, { plain: true });
    mergeStatic(g);
    island.world.add(g);
  }

  // ---- the page: bubbles, choices, the soft edges, the icons --------------------
  const doc = typeof document !== 'undefined' ? document : null;
  const el = (tag, css, parent) => { const e = doc.createElement(tag); if (css) e.style.cssText = css; (parent || doc.body).appendChild(e); return e; };
  let ui = null;
  if (doc) {
    ui = {};
    ui.vignette = el('div', 'position:fixed;inset:0;pointer-events:none;z-index:11;opacity:0;transition:opacity 700ms;background:radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 38%, rgba(60,36,20,0.55) 100%)');
    ui.bubble = el('div', 'position:fixed;z-index:13;max-width:min(360px,60vw);padding:10px 14px;border-radius:18px;background:#fffdf6;color:#3a3226;font:600 17px/1.35 ui-rounded,"SF Pro Rounded",system-ui,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,0.18);opacity:0;transition:opacity 200ms;pointer-events:none;transform:translate(-50%,-100%)');
    ui.tail = el('div', 'position:absolute;left:50%;bottom:-9px;width:18px;height:18px;margin-left:-9px;background:#fffdf6;transform:rotate(45deg);border-radius:3px', ui.bubble);
    ui.text = el('span', 'position:relative', ui.bubble);
    ui.bye = el('button', 'position:fixed;left:max(10px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));z-index:13;font-size:34px;line-height:1;padding:8px 12px;border:0;border-radius:14px;background:rgba(255,253,246,0.85);cursor:pointer;display:none');
    ui.bye.textContent = '👋';
    ui.bye.setAttribute('aria-label', 'goodbye');
    ui.bye.addEventListener('click', (e) => { e.stopPropagation(); leave(); });
    ui.icons = {};
    for (const name of Object.keys(TALKS)) {
      const b = el('button', 'position:fixed;z-index:12;font-size:30px;line-height:1;padding:6px 8px;border:0;border-radius:50%;background:rgba(255,253,246,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:pointer;display:none;transform:translate(-50%,-100%)');
      b.textContent = '💬';
      b.setAttribute('aria-label', `talk to ${name}`);
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => { e.stopPropagation(); ctx.sound.unlock(); start(name); });
      ui.icons[name] = b;
    }
  }

  // Where on the page a point in the world is.
  const screen = (x, y, z) => {
    const r = canvas.getBoundingClientRect();
    const v = new THREE.Vector3(x, y, z).project(camera);
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height, on: Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1, r };
  };

  // ---- the things a choice is made with ---------------------------------------------
  const things = [];                 // on show now: { g, glow, i, t, going }
  const invisible = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
  function showThings(node) {
    clearThings(true);
    const nook = talk.nook;
    const floorAt = (x) => (nook.world === 'under' ? tunnelFloor(x) : nook.y ?? groundY(x));
    node.choices.forEach((c, i) => {
      const g = new THREE.Group();
      const art = PROPS[c.thing](kit);
      g.add(art);
      const [x, dy] = (c.sky ? nook.sky : nook.slots)[i];
      const base = c.sky ? talk.seat.oona.y : nook.water ? -1.15 : floorAt(x);
      // A soft light behind it: this is a thing to tap.
      const glow = kit.mesh(ellipse(0, 0.3, 0.62, 0.55), 0xfff2b0, { layer: 0, plain: true, opacity: 0.45 });
      glow.position.z = -0.05;
      glow.position.y = c.sky ? -0.3 : 0;
      g.add(glow);
      const pad = new THREE.Mesh(new THREE.ShapeGeometry(ellipse(0, c.sky ? 0 : 0.3, 0.8, 0.7), 14), invisible);
      pad.position.z = -0.06;
      g.add(pad);
      g.position.set(x, base + dy + (art.userData.lift || 0), nook.z + 0.3);
      g.userData = { pick: `thing-${i}` };
      g.scale.setScalar(0.001);
      island.world.add(g);
      things.push({ g, glow, i, t: 0, going: false });
    });
  }
  function clearThings(now = false, keep = -1) {
    for (const th of things) { if (th.i === keep) th.chosen = true; else th.going = true; if (now) island.world.remove(th.g); }
    if (now) things.length = 0;
  }

  // ---- a talk ------------------------------------------------------------------------
  let talk = null;         // { name, t: script, nook, speaker, choice, picks }
  let token = 0;

  function friendRoot(name) { return cast[name].root; }

  function place() {
    const { nook, name } = talk;
    const fy = (x) => (nook.world === 'under' ? tunnelFloor(x) : nook.y ?? groundY(x));
    talk.seat = {
      oona: { x: nook.oona[0], y: fy(nook.oona[0]), z: nook.z, f: nook.oona[1] },
      friend: { x: nook.friend[0], y: fy(nook.friend[0]), z: nook.z - 0.05, f: nook.friend[1] },
    };
    // Where the friend comes in from (May, hopping in through the way in).
    if (nook.enter) talk.entering = { from: nook.friend[0] + nook.enter, t: 0 };
    oona.stop();
    oona.s.x = talk.seat.oona.x; oona.s.y = talk.seat.oona.y; oona.s.mode = 'stand'; oona.s.facing = talk.seat.oona.f;
    // Baba: asleep in the nest, or sitting a step behind his sister.
    const bx = nook.baba ?? nook.oona[0] - nook.oona[1] * 1.05;
    baba.s.x = bx; baba.s.y = nook.world === 'under' ? tunnelFloor(bx) : nook.y ?? groundY(bx); baba.s.mode = 'stand'; baba.s.facing = nook.oona[1];
    talk.babaZ = nook.z - 0.08;
    if (name === 'mama') island.under.group.add(friendRoot('mama'));
  }

  function restore() {
    const { name } = talk;
    const r = friendRoot(name);
    if (name === 'mama') { stage.add(r); r.position.set(STOPS.mama.x, groundY(STOPS.mama.x), -0.6); cast.mama.flip = 1; }
    if (name === 'may') { r.position.set(STOPS.may.x + 0.5, groundY(STOPS.may.x + 0.5), -0.5); cast.may.flip = -1; }
    if (name === 'bernie') { r.position.set(STOPS.bernie.x, groundY(STOPS.bernie.x), -0.05); cast.bernie.flip = -1; }
  }

  function show(who, text) {
    talk.speaker = who;
    if (!ui) return;
    ui.text.textContent = text;
    const narr = who === 'narrator';
    ui.bubble.style.fontStyle = narr ? 'italic' : 'normal';
    ui.bubble.style.background = narr ? 'rgba(255,253,246,0.92)' : '#fffdf6';
    ui.tail.style.display = narr ? 'none' : 'block';
    ui.bubble.style.opacity = '1';
  }
  const hideBubble = () => { if (ui) ui.bubble.style.opacity = '0'; };
  const beat = (text) => 900 + text.length * 45;       // at least this long on screen

  async function speak(id, who, text, mine) {
    show(who, text);
    if (who !== 'narrator' && cast[who]) ctx.hop(cast[who]);
    const t0 = performance.now();
    await ctx.say(id, 'talk');
    const left = beat(text) - (performance.now() - t0);
    if (left > 0) await new Promise((r) => setTimeout(r, left));
    await new Promise((r) => setTimeout(r, 300));
    return mine === token && talk;
  }

  // A choice: the two things pop up and glow; the first time in a session
  // the narrator says what to do. Nothing is said for Oona until he taps.
  let hinted = false;
  function choose(node, mine) {
    return new Promise((resolve) => {
      hideBubble();
      talk.speaker = null;
      talk.choice = { node, sel: -1, resolve, mine, t0: performance.now() };
      showThings(node);
      sound.pop();
      if (!hinted) { hinted = true; show('narrator', 'What will Oona talk about? Tap something, and see!'); ctx.say('talk-hint', 'talk').then(() => { if (talk?.choice) hideBubble(); }); }
      if (!ui) resolve(0);
    });
  }
  function pick(i) {
    const c = talk?.choice;
    if (!c) return;
    talk.choice = null;
    hideBubble();
    clearThings(false, i);
    sound.happy();
    // She turns to it as she speaks of it.
    const th = things.find((q) => q.i === i);
    if (th) talk.lookAt = th.g.position.x;
    c.resolve(i);
  }

  async function run(mine) {
    let id = talk.t.start, last = null;
    if (talk.entering) await new Promise((r) => { const w = () => (!talk || talk.entering.t >= 1 ? r() : setTimeout(w, 80)); w(); });
    while (id && mine === token && talk) {
      const node = talk.t.nodes[id];
      last = node;
      if (node.choices) {
        const i = await choose(node, mine);
        if (mine !== token || !talk) return;
        const c = node.choices[i];
        talk.picks.push(`${id}:${i}`);
        if (!(await speak(lineId(talk.name, id, i), 'oona', c.text, mine))) return;
        talk.lookAt = null;
        clearThings();
        id = c.next;
      } else {
        if (!(await speak(lineId(talk.name, id), node.who, node.text, mine))) return;
        id = node.next;
      }
    }
    if (mine === token && talk) finish(last);
  }

  function start(name) {
    if (talk || ctx.busy) return false;
    const t = TALKS[name];
    const nook = NOOKS[t.nook];
    ctx.busy = true;
    const mine = ++token;
    talk = { name, t, nook, speaker: null, choice: null, picks: [], seat: null };
    sound.tuck();
    ctx.fade(() => {
      if (mine !== token) return;
      if (nook.world === 'under') {
        ctx.where = 'under'; ctx.room = 'main';
        oona.setWorld(TUNNEL_WORLD, nook.oona[0]);
        baba.setWorld(TUNNEL_WORLD, nook.baba);
      }
      if (nook.world === 'log') {
        ctx.where = 'log';
        oona.setWorld(LOG_WORLD, nook.oona[0]);
        baba.setWorld(LOG_WORLD, nook.oona[0] - 1.05);
      }
      place();
      ctx.snapCamera();
      if (ui) { ui.vignette.style.opacity = '1'; ui.bye.style.display = 'block'; }
      run(mine);
    });
    return true;
  }

  function close() {
    token++;
    if (ui) { ui.vignette.style.opacity = '0'; ui.bye.style.display = 'none'; hideBubble(); }
    clearThings(true);
    const was = talk;
    restore();
    talk = null;
    ctx.busy = false;
    return was;
  }

  function finish(last) {
    const was = close();
    ctx.award('chat');
    ctx.moment('succeeded', { what: `talk-${was.name}`, picks: was.picks.join(',') });
    const nook = was.nook;
    if (last?.nap) { ctx.nap(); return; }
    if (nook.world === 'log') return outOfLog(nook);
    if (nook.after !== nook.oona[0]) ctx.fade(() => { oona.place(nook.after); baba.place(nook.after - 1.1); ctx.snapCamera(); });
    else { oona.place(nook.after); baba.place(nook.after - 1.1); }
  }

  // Out of the log again, and back beside May's burrow in the meadow.
  function outOfLog(nook) {
    ctx.fade(() => {
      ctx.where = 'island';
      oona.setWorld({}, nook.after);
      baba.setWorld({}, nook.after - 1.1);
      oona.s.facing = 1;
      ctx.snapCamera();
    });
  }

  function leave() {
    if (!talk) return;
    ctx.speech.stopAll();
    const was = close();
    const nook = was.nook;
    if (nook.world === 'under') return;
    if (nook.world === 'log') return outOfLog(nook);
    ctx.fade(() => { oona.place(nook.after); baba.place(nook.after - 1.1); ctx.snapCamera(); });
  }

  // Keys, while talking, are the talk's: ←/→ to choose, Enter to say it, Esc
  // to go. The game's own keys (walking, flapping) are held off.
  if (typeof addEventListener !== 'undefined') {
    addEventListener('keydown', (e) => {
      if (!talk) {
        // Enter by a friend with 💬 up: sit down and talk.
        if ((e.key === 'Enter') && available) { e.preventDefault(); e.stopImmediatePropagation(); start(available); }
        return;
      }
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.key === 'Escape') return leave();
      const c = talk.choice;
      if (!c) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') c.sel = 0;
      if (e.key === 'ArrowRight' || e.key === 'd') c.sel = c.node.choices.length - 1;
      if ((e.key === 'Enter' || e.key === ' ') && c.sel >= 0) pick(c.sel);
    }, true);
  }

  let available = null;

  return {
    active: () => !!talk,
    pickables: () => (talk?.choice ? things.map((th) => th.g) : []),
    tap(name) {
      if (!talk) return false;
      if (name.startsWith('thing-') && talk.choice) pick(+name.split('-')[1]);
      return true;                       // while talking, nothing else answers a tap
    },
    holdsOona: () => !!talk?.seat,
    holdsBaba: () => !!talk?.seat,
    start, leave, pick,
    camera() {
      if (!talk?.seat) return null;
      const [x, y, z] = talk.nook.cam;
      return { x, y: y ?? talk.seat.oona.y + 1.1, z };
    },
    pose(c) {
      if (!talk?.seat) return null;
      const bob = (who) => (talk.speaker === who ? 0.035 * Math.abs(Math.sin(performance.now() / 110)) : 0);
      if (c === cast.oona) return { mode: 'stand', facing: talk.lookAt != null ? Math.sign(talk.lookAt - talk.seat.oona.x) || 1 : talk.seat.oona.f, breathe: bob('oona') };
      if (c === cast[talk.name]) return { mode: 'stand', facing: talk.seat.friend.f, breathe: bob(talk.name) };
      if (c === cast.baba) return talk.nook.baba !== undefined ? { mode: 'stand', facing: -1, sleep: true } : { mode: 'stand', facing: talk.seat.oona.f };
      return null;
    },
    update() {
      if (talk?.seat) {
        oona.s.x = talk.seat.oona.x; oona.s.y = talk.seat.oona.y; oona.s.mode = 'stand';
      }
    },
    late(t, dt) {
      // The things: pop in, breathe (the one picked out by the keys more),
      // and pop away — the chosen one after a little hop.
      for (let k = things.length - 1; k >= 0; k--) {
        const th = things[k];
        th.t += dt || 1 / 60;
        let sc;
        if (th.going) { th.out = (th.out || 0) + (dt || 1 / 60); sc = Math.max(0, 1 - th.out / 0.25); if (sc <= 0) { island.world.remove(th.g); things.splice(k, 1); continue; } }
        else if (th.chosen) sc = 1 + 0.15 * Math.max(0, Math.sin(th.t * 8)) * Math.max(0, 1 - (th.t % 10));
        else {
          const pop = Math.min(1, th.t / 0.35), over = pop < 1 ? 1 + Math.sin(pop * Math.PI) * 0.25 : 1;
          const sel = talk?.choice?.sel === th.i;
          sc = pop * over * (1 + (sel ? 0.12 : 0.05) * Math.sin(t * (sel ? 7 : 3.5) + th.i));
          // Waited a long while: they bounce, to say "me!".
          if (talk?.choice && performance.now() - talk.choice.t0 > 10000) th.g.position.y += Math.sin(t * 9 + th.i * 1.5) * 0.004;
          th.glow.material.opacity = sel ? 0.7 : 0.4 + 0.1 * Math.sin(t * 3 + th.i);
        }
        th.g.scale.setScalar(Math.max(0.001, sc));
      }
      if (talk?.seat) {
        const { oona: so, friend: sf } = talk.seat;
        cast.oona.root.position.set(so.x, so.y, so.z);
        let fx = sf.x, fy2 = sf.y;
        if (talk.entering && talk.entering.t < 1) {
          const e = talk.entering;
          e.t = Math.min(1, e.t + (dt || 1 / 60) / 1.4);
          const u = e.t;
          fx = e.from + (sf.x - e.from) * u;
          fy2 = sf.y + Math.abs(Math.sin(u * Math.PI * 3)) * 0.35 * (1 - u);      // hop, hop, hop
          if (u >= 1) ctx.hop(cast[talk.name]);
        }
        friendRoot(talk.name).position.set(fx, fy2, sf.z);
        cast.baba.root.position.set(baba.s.x, baba.s.y, talk.babaZ ?? so.z - 0.08);
      }
      if (!ui) return;
      // The bubble over whoever is speaking.
      if (talk?.seat && talk.speaker && ui.bubble.style.opacity === '1') {
        const who = talk.speaker;
        if (who === 'narrator') {
          const r = canvas.getBoundingClientRect();
          ui.bubble.style.left = `${r.left + r.width / 2}px`;
          ui.bubble.style.top = `${r.top + r.height - 24}px`;
        } else {
          // Over the speaker, but above the taller of the two, so a short
          // friend's bubble never covers Oona's face.
          const root = who === 'oona' ? cast.oona.root : friendRoot(talk.name);
          const p = root.getWorldPosition(new THREE.Vector3());
          const top = Math.max(talk.seat.oona.y + HEAD.oona, talk.seat.friend.y + (HEAD[talk.name] || 1.4));
          const s = screen(p.x, top + 0.2, p.z);
          const half = ui.bubble.offsetWidth / 2;
          ui.bubble.style.left = `${Math.min(s.r.right - half - 8, Math.max(s.r.left + half + 8, s.x))}px`;
          ui.bubble.style.top = `${Math.max(s.r.top + ui.bubble.offsetHeight + 12, s.y)}px`;
        }
      }
      // The 💬 over a friend Oona is near, when nothing else is going on.
      available = null;
      for (const [name, b] of Object.entries(ui.icons)) {
        const nook = NOOKS[TALKS[name].nook];
        const root = friendRoot(name);
        const p = root.getWorldPosition(new THREE.Vector3());
        const home = name === 'mama' || nook.world === 'log' ? ctx.where === 'island' : ctx.where === nook.world;
        const near = home && Math.abs(oona.s.x - p.x) < 4.5 && Math.abs(oona.s.y - p.y) < 4;
        // Only once they have properly met (her own thing done: Silky's ride,
        // Marvin's splash, May said hello), and never over someone talking.
        const ok = near && ctx.met(name) && !talk && !ctx.busy && ctx.speech.kind !== 'reply' && root.visible && oona.s.mode !== 'dive';
        const s = ok ? screen(p.x, p.y + (HEAD[name] || 1.4) + 0.35 + 0.08 * Math.sin(performance.now() / 300), p.z) : null;
        const shown = ok && s.on;
        b.style.display = shown ? 'block' : 'none';
        if (shown) { b.style.left = `${s.x}px`; b.style.top = `${s.y}px`; if (!available || Math.abs(p.x - oona.s.x) < 2) available = name; }
      }
    },
    state: () => (talk ? { name: talk.name, speaker: talk.speaker, choosing: !!talk.choice, picks: [...talk.picks], things: things.filter((q) => !q.going).length } : null),
    // Where on the page thing i is (the playtest taps it).
    thingOnPage(i) {
      const th = things.find((q) => q.i === i && !q.going);
      if (!th) return null;
      const p = th.g.getWorldPosition(new THREE.Vector3());
      return screen(p.x, p.y + 0.3, p.z);
    },
  };
}

// What should still be true tomorrow: the badges earned and a few counts,
// per child, in localStorage (`puffin-state-<who>`). Pure — every function
// takes a state and returns one, and returns THE SAME state (===) when
// nothing changed, so the game can tell a new thing from an old one.
//
// The badge shelf only ever goes up. There is no score and nothing to lose.

// In the island's own order, west to east.
export const BADGES = [
  { key: 'wind', emoji: '🪁' },        // rode the wind up the seabird cliffs
  { key: 'splash', emoji: '🦦' },      // a cannonball into the water, like Marvin
  { key: 'pads', emoji: '🐸' },        // bounced on the lily pads
  { key: 'mushrooms', emoji: '🍄' },   // lit all five glowing mushrooms in the wood
  { key: 'home', emoji: '🏠' },        // went down into the burrow
  { key: 'nap', emoji: '💤' },         // had a nap in the nest
  { key: 'hedgehog', emoji: '🦔' },    // woke the hedgehog in the tunnels
  { key: 'mouse', emoji: '🐁' },       // played peekaboo with the mouse in its larder
  { key: 'fungi', emoji: '✨' },       // lit up the fungi's web in the deep cave
  { key: 'climb', emoji: '🌱' },       // climbed the roots up and out of May's warren
  { key: 'dandelions', emoji: '🌼' },  // blew all five clocks
  { key: 'may', emoji: '🐰' },         // said hello to May
  { key: 'mossy', emoji: '🐭' },       // said hello to Mossy
  { key: 'slide', emoji: '🥚' },       // rode the eggshell down the slope
  { key: 'bernie', emoji: '🐚' },      // helped Bernie find a shell that fits
  { key: 'sea', emoji: '🌊' },         // dived under the sea
  { key: 'fish', emoji: '🐟' },        // caught fish and fed them to Baba
  { key: 'silky', emoji: '🦭' },       // rode on Silky's back
  { key: 'pools', emoji: '🦀' },       // met the crab or the anemone in the rock pools
  { key: 'blowhole', emoji: '💨' },    // was whooshed up by the blowhole
  { key: 'dig', emoji: '🪣' },         // dug up all three treasures in the dunes
  { key: 'rainbow', emoji: '🌈' },     // stood under the waterfall and made a rainbow
  { key: 'night', emoji: '🌙' },       // was out on Puffin Rock at night
  { key: 'papa', emoji: '🪶' },        // flew with Papa
  { key: 'still', emoji: '🦋' },       // stood so still a butterfly landed on her
  { key: 'puddle', emoji: '☔' },      // splashed in a puddle in the rain
  { key: 'hide', emoji: '🙈' },        // found Baba at hide and seek
  { key: 'chat', emoji: '💬' },        // sat down and had a real talk with a friend
];
const KEYS = new Set(BADGES.map((b) => b.key));
const COUNTS = ['blown', 'slides', 'flaps', 'visits', 'dives', 'caught', 'fed', 'lit', 'boings', 'rides', 'whooshes', 'cannonballs'];

// Friends met properly — their own thing done once (Silky's ride, Marvin's
// splash) — after which they will sit down and talk.
export const FRIENDS = ['may', 'mossy', 'marvin', 'silky', 'bernie', 'mama'];

export function meet(s, who) {
  if (!FRIENDS.includes(who) || s.met.includes(who)) return s;
  return { ...s, met: [...s.met, who] };
}

export function fresh() {
  return { v: 1, badges: [], met: [], blown: 0, slides: 0, flaps: 0, visits: 0, dives: 0, caught: 0, fed: 0, lit: 0, boings: 0, rides: 0, whooshes: 0, cannonballs: 0 };
}

export function award(s, key) {
  if (!KEYS.has(key) || s.badges.includes(key)) return s;
  // Kept in shelf order, whatever order they were earned in.
  const badges = BADGES.map((b) => b.key).filter((k) => k === key || s.badges.includes(k));
  return { ...s, badges };
}

export function bump(s, key, by = 1) {
  if (!COUNTS.includes(key)) return s;
  return { ...s, [key]: Math.min(1e6, s[key] + by) };
}

export const has = (s, key) => s.badges.includes(key);

export function serialize(s) { return JSON.stringify(s); }

// Anything at all in, a sane state out: a hand-edited or half-written save
// must never stop the island from opening.
export function deserialize(text) {
  const s = fresh();
  let raw;
  try { raw = JSON.parse(text); } catch { return s; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return s;
  if (Array.isArray(raw.met)) for (const k of FRIENDS) if (raw.met.includes(k)) s.met.push(k);
  if (Array.isArray(raw.badges)) {
    for (const k of BADGES.map((b) => b.key)) if (raw.badges.includes(k)) s.badges.push(k);
  }
  for (const k of COUNTS) {
    const n = Number(raw[k]);
    if (Number.isFinite(n) && n > 0) s[k] = Math.min(1e6, Math.floor(n));
  }
  return s;
}

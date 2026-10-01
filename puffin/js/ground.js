// THE ISLAND'S SHAPE — where everything is, as numbers, with no three.js in
// it, so the physics, the scenery and the tests all read the same map.
//
// The island is a strip, left to right, walked side-on like the show is
// framed. The ground is ONE curve, `groundY(x)`: a single height at every x,
// no ledges over other ledges. That is deliberate — Baba cannot fly, and a
// single curve means wherever Oona can walk, Baba can follow, and nothing a
// child does can leave anybody stranded. Flying is for the fun of it.
//
//  -101 ....... -84   the seabird cliffs: a grassy climb to the clifftop,
//                     where the wind comes up the cliff and lifts you
//   -84 ....... -64   the pond: lily pads that bounce you, a frog
//   -64 ....... -26   the Mossy Wood: moss mounds, glowing mushrooms, and
//                     the great old tree you walk through to the pond
//   -26 ........ -8   the burrow: home, Mama and Papa
//    -8 ........ 15   the meadow: dandelion clocks, May the rabbit
//    15 ........ 27   the rocks: a walkable ramp up to the top, Mossy
//    27 ........ 37   the slide: a long sandy slope, ridden on an eggshell
//    37 ........ 40   the beach
//    40 ........ 80   the sea: float on it, dive under it, catch fish;
//                     Silky's rock sticks up out of it at 69
//    80 ........ 97   the rocky shore: rock pools, a crab, anemones, and the
//                     blowhole that whooshes you up into the sky
//    97 ....... 116   the sand dunes: marram grass, sea holly, and treasure
//                     buried in the sand to dig up
//   116 ....... 128   the bog, and the waterfall at the island's east end:
//                     a pool to swim in, and a shower under the falls

export const X_MIN = -101;        // the left fence: the edge of the seabird cliffs
export const WOOD_X = -26;        // where the meadow gives way to the wood
export const WOOD_L = -65.5;      // and where the wood ends, past the great old tree
export const X_MAX = 128;         // the right fence: the crag the waterfall falls from
export const SKY = 7.5;           // how high above the ground a puffin may fly

export const TOP = 3.2;           // the top of the rocks
export const SLIDE = { x0: 26.6, x1: 37 };
export const BEACH = -0.7;        // sand height at the bottom of the slide
export const SEA_X = 40.5;        // where the sand starts down under the water
export const SURFACE = BEACH - 0.45; // the sea's level
export const POND = -0.3;         // the pond's level, higher than the sea's
export const CLIFF = 3.6;         // the clifftop
export const UPDRAFT_X = -96;     // west of here the wind comes up the cliff
export const SHORE = 0.3;         // the rocky shore's height
export const POOL_LEVEL = 0.05;   // the rock pools' water
export const BOG_LEVEL = -0.2;    // the waterfall pool's
export const FALLS = { x0: 126.7, x1: 128.1, top: 5.6 };   // where the water comes down: the ledge under it

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;

// A smooth hump 0..1..0 over [a, b], with soft shoulders `e` wide.
const window_ = (x, a, b, e) => smooth((x - a) / e) * smooth((b - x) / e);
const woodY = (x) => 0.3 * Math.sin((x + 24) * 0.55) * smooth((-24 - x) / 3) + 0.15 * Math.sin((x + 24) * 1.3) * smooth((-24 - x) / 5);

export function groundY(x) {
  // West of the wood: level ground, the pond scooped out of it, then the long
  // grassy climb to the clifftop.
  if (x < -61) {
    const level = lerp(woodY(-61), 0, smooth((-61 - x) / 3));
    const pond = -1.9 * window_(x, -81.5, -64.5, 2.5);
    // A muddy bank on the pond's west side, a little higher, sloping in.
    const bank = 0.9 * window_(x, -89, -83.4, 1.6);
    const climb = CLIFF * smooth((-85 - x) / 10);
    return level + pond + climb + bank;
  }
  // The wood floor is soft and humped with moss, never steep.
  if (x < -24) return 0.3 * Math.sin((x + 24) * 0.55) * smooth((-24 - x) / 3) + 0.15 * Math.sin((x + 24) * 1.3) * smooth((-24 - x) / 5);
  if (x < -8) return 0;
  // The meadow rolls, gently: never enough to notice walking, enough that it
  // is not a table top.
  if (x < 15) return 0.22 * Math.sin((x + 8) * 0.55) * smooth((x + 8) / 3) * smooth((15 - x) / 3);
  // Up the rocks: two soft steps, each one an easy walk.
  if (x < 19) return lerp(0, 1.5, smooth((x - 15) / 4));
  if (x < 20.2) return 1.5;
  if (x < 23.2) return lerp(1.5, TOP, smooth((x - 20.2) / 3));
  if (x < SLIDE.x0) return TOP;
  // The slide: steep at the top, easing out onto the sand, like a real one.
  if (x < SLIDE.x1) {
    const t = (x - SLIDE.x0) / (SLIDE.x1 - SLIDE.x0);
    return lerp(TOP, BEACH, slideT(t));
  }
  // Past the beach the sand goes on down, under the water: the sea floor.
  if (x < SEA_X) return BEACH;
  // Down under the water to a sea floor that rolls a little, so the bottom
  // of the sea is somewhere, not a table; Silky's rock standing up out of it;
  // and then up again onto the rocky shore, with its two rock pools.
  const floor = BEACH - 3 * smooth((x - SEA_X) / 7) - 0.45 * Math.sin((x - SEA_X - 7) * 0.5) * smooth((x - SEA_X - 7) / 4);
  const rock = (0.45 - floor) * window_(x, 66.4, 72.6, 2.4);
  const shore = (SHORE - floor) * smooth((x - 76) / 6);
  const pools = -0.6 * (window_(x, 83, 85.4, 0.7) + window_(x, 87.4, 89.8, 0.7));
  if (x > 96) return eastY(x);
  return floor + rock + shore + pools;
}

// Past the rocky shore: two big dunes, down onto the bog, the waterfall's
// pool scooped out of it, and a flat rock ledge under the falls.
function eastY(x) {
  const dunes = 1.5 * window_(x, 99.5, 107.5, 2.6) + 2.3 * window_(x, 106.5, 115.5, 2.9);
  const bog = -0.3 * smooth((x - 115.5) / 3);
  const pool = -1.4 * window_(x, 121, 126.6, 1.3);
  const ledge = 0.35 * smooth((x - 126.3) / 0.7);
  return SHORE + dunes + bog + pool + ledge;
}

// Where the water is, and how high: the sea, the pond, the two rock pools.
// Nowhere else is wet, however low the ground.
export const POOLS = [{ x0: 83, x1: 85.4 }, { x0: 87.4, x1: 89.8 }];
export function surfaceAt(x) {
  if (x > -82 && x < -64) return POND;
  if (x > SEA_X - 1 && x < 81) return SURFACE;
  for (const p of POOLS) if (x > p.x0 - 0.2 && x < p.x1 + 0.2) return POOL_LEVEL;
  if (x > 120.5 && x < 126.8) return BOG_LEVEL;
  return -Infinity;
}

// Deep enough to float in: the water's edge is where the ground goes under by
// a little more than a puffin's feet.
export const wet = (x) => groundY(x) < surfaceAt(x) - 0.25;

// The muddy bank on the pond's west side, where Marvin jumps in from.
export const BANK = { x: -84.4 };

// The lily pads on the pond, which bounce whoever lands on them.
export const PADS = [-68.3, -70.9, -73.5, -76.1, -78.7].map((x) => ({ x, r: 0.85 }));
export function padAt(x) {
  for (let i = 0; i < PADS.length; i++) if (Math.abs(x - PADS[i].x) < PADS[i].r) return i;
  return -1;
}

// 0 at the top of the slide, 1 at the bottom: steepest at the lip and flat
// at the foot, so a slider drops away fast and glides out onto the sand.
function slideT(t) { return 1 - (1 - t) * (1 - t); }

// Where the stops are. `x` is where Oona stands to be at it; the camera stop
// for everything at that station is Oona standing there.
export const STOPS = {
  burrow:  { x: -15.5 },
  mama:    { x: -18.6 },
  papa:    { x: -12.4 },
  dandelions: [-4.5, -1.2, 2.2, 5.4, 8.6].map((x) => ({ x })),
  may:     { x: 12 },
  mossy:   { x: 24.2 },
  egg:     { x: 25.9 },
  sea:     { x: 40.5 },
  mushrooms: [-31, -36, -41.5, -47, -52.5].map((x) => ({ x })),
  tree:    { x: -63 },           // the great old tree, with a way through it
  frog:    { x: -73.5 },         // on the middle lily pad
  cliff:   { x: -97 },
  silky:   { x: 69.5 },          // on top of her rock
  crab:    { x: 86.4 },          // between the rock pools
  anemone: { x: 88.6 },          // in the second pool
  blowhole: { x: 93 },
  digs:    [101.4, 105.4, 111.2].map((x) => ({ x })),
  marvin:  { x: -78.6 },         // floating at the foot of his mud slide
  bernie:  { x: 38.7 },          // on the sand of the beach
  sheep:   { x: 10.2 },          // up on the meadow bank
};

// Where Oona stands to do a thing, coming from `fromX`. Into the burrow and
// onto the eggshell she goes right to it; everyone else she stops a step
// short of, on the side she came from, so she is beside them and not on top.
export function standFor(name, stopX, fromX) {
  if (name === 'burrow' || name === 'egg' || name === 'blowhole' || /^(to|from)-/.test(name)) return stopX;
  const side = fromX <= stopX ? -1 : 1;
  const gap = /^(dandelion|crab|anemone|bernie|dig)/.test(name) ? 0.9 : 1.35;
  return Math.min(X_MAX, Math.max(X_MIN, stopX + side * gap));
}

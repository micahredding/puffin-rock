// SILKY'S RIDE — the path Silky swims with Oona on her back: off her rock and
// down into the sea, a long glide along near the bottom, up and out in a
// great leap, splash, and a loop back round home to her rock. Like the shell
// slide it asks nothing of him but to hold on and enjoy it.
//
// Pure: `rideAt(u)` for u from 0 to 1 is where Silky is, and which way she is
// heading. A Catmull-Rom curve through the waypoints below, so the path is
// smooth everywhere and passes exactly through each one.

import { STOPS, groundY } from './ground.js';

export const RIDE_SECONDS = 10;

const top = groundY(STOPS.silky.x);
export const WAYPOINTS = [
  [STOPS.silky.x, top], [68.8, top + 0.12], [68.0, 0.15], [67.1, -0.9], [65.6, -2.1], [61, -2.7], [56, -2.3], [53, -1.4],
  [51, 1.1],                                   // the leap
  [49, -1.2], [47.2, -2.2], [49.5, -2.8], [56, -2.8], [62.5, -2.5], [65.8, -1.6], [67.2, -0.7], [68.1, 0.1], [68.9, top + 0.12],
  [STOPS.silky.x, top],
];

function cr(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

export function rideAt(u) {
  const P = WAYPOINTS, n = P.length - 1;
  const v = Math.min(1, Math.max(0, u)) * n;
  const i = Math.min(n - 1, Math.floor(v)), t = v - i;
  const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(n, i + 2)];
  const x = cr(a[0], b[0], c[0], d[0], t), y = cr(a[1], b[1], c[1], d[1], t);
  const e = 1e-3;
  const t2 = Math.min(1, t + e);
  const dx = cr(a[0], b[0], c[0], d[0], t2) - x, dy = cr(a[1], b[1], c[1], d[1], t2) - y;
  return { x, y, dx, dy };
}

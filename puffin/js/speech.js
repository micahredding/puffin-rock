// WHO GETS TO SPEAK. Lots of things on Puffin Rock want to say something,
// often at once: May introducing her family as Oona pops out of the warren,
// the butterfly landing because nobody has moved, the narrator noticing the
// dandelions. Left alone they talk over each other, and a four year old
// hears the second half of one sentence and the first half of another.
//
// So every line goes through here, with a KIND:
//
//   talk     a sit-down conversation. While one is on, nothing else speaks.
//   reply    the answer to something he just DID (tapped May, popped out of
//            the warren, landed in a puddle). Cuts off anything but a talk,
//            and the newest reply wins: a child tapping fast hears the thing
//            he just tapped.
//   event    something that HAPPENED (the butterfly landed, the frog caught
//            a fly, it started to rain). Never cuts anyone off: it waits for
//            quiet, and is dropped if it waited too long (ttl) or is no longer
//            true (`still()` — the butterfly has flown off again).
//   ambient  the island noticing things (a hint as she arrives somewhere, a
//            fact). Only into real quiet, and it gives up quickly.
//
// "Quiet" means nothing is being said AND a moment has passed since the last
// line ended, so lines never butt up against each other.
//
// A `once` line is only counted as said once it has STARTED being said — one
// that was dropped can come round again later.
//
// Pure except for the voice and the clock it is given, so the tests can run
// it with a fake voice.

export const RANK = { ambient: 1, event: 2, reply: 3, talk: 4 };
export const TTL = { ambient: 2500, event: 7000, reply: 1000, talk: 60000 };
export const GAP = 450;           // ms of quiet after one line before another

export function makeSpeech({ voice, now = () => performance.now(), talking = () => false }) {
  let current = null;             // { kind, token }
  let token = 0;
  let lastEnd = -1e9;
  const queue = [];               // { ids, kind, until, still, resolve, onStart, t }
  let lastStart = -1e9;

  const quiet = () => !current && now() - lastEnd >= GAP;

  function start(item) {
    const mine = ++token;
    current = { kind: item.kind, token: mine };
    lastStart = now();
    item.onStart?.();
    voice.sayAll(item.ids).then((ok) => {
      if (current && current.token === mine) { current = null; lastEnd = now(); }
      item.resolve(ok);
    });
  }

  // Say ids (one or a list, spoken in order). Resolves true if all of it was
  // said, false if it was dropped or cut off.
  function say(ids, { kind = 'reply', ttl = TTL[kind], still = null, onStart = null } = {}) {
    const list = Array.isArray(ids) ? ids : [ids];
    return new Promise((resolve) => {
      const item = { ids: list, kind, until: now() + ttl, still, resolve, onStart, t: now() };
      const r = RANK[kind];
      // A talk owns the island's voice while it lasts.
      if (talking() && kind !== 'talk') {
        if (kind === 'reply' || kind === 'ambient') return resolve(false);
        queue.push(item); return;
      }
      if (kind === 'reply' || kind === 'talk') {
        if (current && RANK[current.kind] > r) {
          // A reply during someone else's talk line: dropped, not queued.
          return resolve(false);
        }
        if (current) voice.stop();       // cuts it off; its promise resolves false
        current = null;
        // Anything waiting that is less important than this is now stale.
        for (let i = queue.length - 1; i >= 0; i--) if (RANK[queue[i].kind] < r && queue[i].kind === 'ambient') { queue[i].resolve(false); queue.splice(i, 1); }
        start(item);
        return;
      }
      queue.push(item);
      pump();
    });
  }

  // Each frame: if it is quiet, the most important thing still worth saying.
  function pump() {
    const t = now();
    for (let i = queue.length - 1; i >= 0; i--) {
      const q = queue[i];
      const stale = t > q.until || (q.still && !q.still());
      if (stale) { q.resolve(false); queue.splice(i, 1); }
    }
    if (!quiet() || !queue.length) return;
    if (talking() && !queue.some((q) => q.kind === 'talk')) return;
    queue.sort((a, b) => RANK[b.kind] - RANK[a.kind] || a.t - b.t);
    const item = queue.shift();
    start(item);
  }

  return {
    say, pump,
    get busy() { return !!current || queue.some((q) => q.kind !== 'ambient'); },
    get speaking() { return !!current; },
    get kind() { return current?.kind ?? null; },
    get lastStart() { return lastStart; },
    quiet,
    stopAll() { for (const q of queue) q.resolve(false); queue.length = 0; if (current) voice.stop(); current = null; lastEnd = now(); },
    state: () => ({ current: current?.kind ?? null, queued: queue.map((q) => `${q.kind}:${q.ids.join('+')}`) }),
  };
}

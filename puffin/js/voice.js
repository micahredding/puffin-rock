// The voices of Puffin Rock. A recorded clip if there is one, and the
// browser's own voice if there is not — never silence, and never the wrong
// words.
//
// Recordings come from tools/narrate.mjs, which writes voice/<id>.mp3 and a
// line in voice/clips.json recording the exact TEXT each clip says. A clip is
// played only if that text is still the line's text in lines.js; edit a line
// and it falls back to the synthesiser until it is recorded again.
//
// One <audio> element, reused: iOS unlocks an element on the first play inside
// a tap (the begin screen's), and then it may play whenever it likes. Every
// new line cuts off the one before, so a child tapping fast hears the latest
// thing and not a queue of old ones.
//
// The browser fallback gives every speaker the same voice at a different
// pitch. Irish first, because the show's narrator is: on Apple devices that is
// "Moira" (en-IE).

// Per speaker, for the synthesiser: pitch and rate.
export const FALLBACK = {
  narrator: { pitch: 0.95, rate: 0.88 },
  oona:     { pitch: 1.35, rate: 1.0 },
  baba:     { pitch: 1.7,  rate: 1.0 },
  mama:     { pitch: 1.15, rate: 0.92 },
  papa:     { pitch: 0.8,  rate: 0.9 },
  may:      { pitch: 1.45, rate: 1.05 },
  mossy:    { pitch: 1.8,  rate: 1.12 },
  silky:    { pitch: 1.1,  rate: 0.9 },
  marvin:   { pitch: 1.2,  rate: 0.95 },
  bernie:   { pitch: 1.0,  rate: 1.0 },
};

// Higher is better: Irish, then British, then any English; local beats remote;
// the robot joke voices macOS ships lose to anything intelligible.
const NOVELTY = /albert|bahh|bells|boing|bubbles|cellos|good news|bad news|jester|junior|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|princess/i;
export function scoreVoice(v) {
  const lang = String(v?.lang || '').toLowerCase().replace('_', '-');
  const name = String(v?.name || '');
  let s = 0;
  if (lang.startsWith('en')) s += 4;
  if (lang === 'en-ie' || /moira/i.test(name)) s += 3;
  else if (lang === 'en-gb') s += 1;
  if (v?.localService === true) s += 1;
  if (NOVELTY.test(name)) s -= 6;
  return s;
}
export function pickVoice(voices) {
  let best = null, bestS = -Infinity;
  for (const v of Array.isArray(voices) ? voices : []) {
    const s = scoreVoice(v);
    if (s > bestS) { best = v; bestS = s; }
  }
  return best;
}

// The clip to play for a line, or null: only if it says what the line says.
export function clipFor(clips, lines, id) {
  const line = lines[id], clip = clips?.[id];
  if (!line || !clip || typeof clip.file !== 'string') return null;
  return clip.text === line.text ? clip.file : null;
}

export function makeVoice(lines, { base = './voice/' } = {}) {
  const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
  const audio = typeof Audio !== 'undefined' ? new Audio() : null;
  let clips = {};
  let voice = null;
  let muted = false;
  let ticket = 0;                  // which line is current; older ones are dropped
  let doneCb = null;

  const choose = () => { try { voice = pickVoice(synth?.getVoices?.() || []); } catch { voice = null; } };
  if (synth) { choose(); synth.addEventListener?.('voiceschanged', choose); }
  fetch(`${base}clips.json`).then((r) => (r.ok ? r.json() : {})).then((j) => { clips = j || {}; }).catch(() => {});

  function stop() {
    ticket++;
    try { audio?.pause(); } catch { /* nothing */ }
    try { synth?.cancel(); } catch { /* nothing */ }
    const cb = doneCb; doneCb = null; cb?.(false);
  }

  function speakSynth(line, finish) {
    if (!synth) { setTimeout(() => finish(true), 900 + line.text.length * 55); return; }
    try {
      const u = new SpeechSynthesisUtterance(line.text);
      const f = FALLBACK[line.who] || FALLBACK.narrator;
      u.pitch = f.pitch; u.rate = f.rate;
      if (voice) { u.voice = voice; u.lang = voice.lang; }
      u.onend = () => finish(true);
      u.onerror = () => finish(true);
      synth.speak(u);
      // Some engines never fire onend; never wait for ever.
      setTimeout(() => finish(true), 2500 + line.text.length * 110);
    } catch { finish(true); }
  }

  // Say a line. Resolves true when it has been said, false if something newer
  // cut it off (so a caller chaining lines knows to stop).
  function say(id) {
    const line = lines[id];
    stop();
    if (!line || muted) return Promise.resolve(!line ? false : true);
    const mine = ++ticket;
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        if (doneCb === finish) doneCb = null;
        resolve(ok && mine === ticket);
      };
      doneCb = finish;
      const file = clipFor(clips, lines, id);
      if (file && audio) {
        audio.onended = () => finish(true);
        audio.onerror = () => { if (mine === ticket) speakSynth(line, finish); };
        audio.src = base + file;
        audio.play().catch(() => { if (mine === ticket) speakSynth(line, finish); });
        setTimeout(() => finish(true), 15000);
      } else speakSynth(line, finish);
    });
  }

  // Lines one after another, stopping if anything newer is said.
  async function sayAll(ids) {
    for (const id of ids) if (!(await say(id))) return false;
    return true;
  }

  // An echo: the clip again, softer and softer, after the line itself (only
  // with a recording; the synthesiser cannot overlap itself).
  function echo(id, delays = [900, 1700], vols = [0.4, 0.16]) {
    const file = clipFor(clips, lines, id);
    if (!file || muted || typeof Audio === 'undefined') return false;
    delays.forEach((d, i) => setTimeout(() => {
      try { const a = new Audio(base + file); a.volume = vols[i]; a.play().catch(() => {}); } catch { /* nothing */ }
    }, d));
    return true;
  }

  return {
    say, sayAll, stop, echo,
    get muted() { return muted; },
    setMuted(m) { muted = !!m; if (muted) stop(); },
    hasClip: (id) => !!clipFor(clips, lines, id),
  };
}

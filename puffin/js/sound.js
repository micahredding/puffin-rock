// Sound, made rather than loaded: one enveloped oscillator and a few gestures,
// the caterpillar's policy. The context cannot exist before the first touch,
// so everything goes through unlock() and quietly does nothing until then.
// The WORDS are voice.js; this is only the little noises in between.

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('puffin-muted') === '1';
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('puffin-muted', this.muted ? '1' : '0');
  }

  tone(freq, { type = 'sine', dur = 0.15, vol = 0.2, at = 0, glide = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + at;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  flap()   { this.tone(260, { type: 'triangle', dur: 0.07, vol: 0.07, glide: 380 }); this.tone(300, { type: 'triangle', dur: 0.06, vol: 0.05, at: 0.07, glide: 420 }); }
  land()   { this.tone(170, { type: 'sine', dur: 0.1, vol: 0.1, glide: 110 }); }
  step()   { this.tone(420 + Math.random() * 60, { type: 'sine', dur: 0.04, vol: 0.025 }); }
  blow()   { for (let i = 0; i < 7; i++) this.tone(1100 + i * 170, { type: 'sine', dur: 0.2, vol: 0.03, at: i * 0.05, glide: 1500 + i * 150 }); }
  whee()   { this.tone(500, { type: 'sine', dur: 0.5, vol: 0.09, glide: 1200 }); this.tone(1200, { type: 'sine', dur: 1.0, vol: 0.07, at: 0.5, glide: 320 }); }
  pop()    { this.tone(700, { type: 'square', dur: 0.05, vol: 0.06, glide: 1200 }); this.tone(900, { type: 'sine', dur: 0.16, vol: 0.07, at: 0.05, glide: 1500 }); }
  hop()    { this.tone(300, { type: 'sine', dur: 0.2, vol: 0.09, glide: 700 }); }
  squeak() { this.tone(1800, { type: 'sine', dur: 0.08, vol: 0.06, glide: 2400 }); this.tone(2000, { type: 'sine', dur: 0.08, vol: 0.05, at: 0.1, glide: 2600 }); }
  tuck()   { this.tone(420, { type: 'sine', dur: 0.6, vol: 0.1, glide: 160 }); }
  happy()  { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, { type: 'triangle', dur: 0.16, vol: 0.08, at: i * 0.08 })); }
  dive()   { this.tone(600, { type: 'sine', dur: 0.3, vol: 0.09, glide: 180 }); for (let i = 0; i < 4; i++) this.tone(900 + i * 220, { type: 'sine', dur: 0.06, vol: 0.04, at: 0.12 + i * 0.07, glide: 1300 + i * 200 }); }
  surface(){ this.tone(260, { type: 'sine', dur: 0.2, vol: 0.08, glide: 700 }); }
  chime(n = 0) { const f = [523, 587, 659, 784, 880][n % 5]; this.tone(f, { type: 'sine', dur: 0.8, vol: 0.09 }); this.tone(f * 2, { type: 'sine', dur: 0.5, vol: 0.03, at: 0.02 }); }
  gulp()   { this.tone(320, { type: 'sine', dur: 0.1, vol: 0.1, glide: 180 }); this.tone(500, { type: 'triangle', dur: 0.08, vol: 0.05, at: 0.08, glide: 700 }); }
  catch()  { this.tone(880, { type: 'triangle', dur: 0.08, vol: 0.07, glide: 1200 }); this.tone(1320, { type: 'sine', dur: 0.12, vol: 0.05, at: 0.07 }); }
  boing()  { this.tone(180, { type: 'sine', dur: 0.35, vol: 0.12, glide: 520 }); this.tone(360, { type: 'triangle', dur: 0.2, vol: 0.04, at: 0.03, glide: 900 }); }
  ribbit() { this.tone(180, { type: 'sawtooth', dur: 0.12, vol: 0.06, glide: 140 }); this.tone(220, { type: 'sawtooth', dur: 0.14, vol: 0.06, at: 0.15, glide: 170 }); }
  scuttle(){ for (let i = 0; i < 8; i++) this.tone(1500 + (i % 2) * 300, { type: 'square', dur: 0.02, vol: 0.03, at: i * 0.07 }); }
  squish() { this.tone(500, { type: 'sine', dur: 0.2, vol: 0.08, glide: 160 }); }
  gurgle() { for (let i = 0; i < 5; i++) this.tone(140 + i * 30, { type: 'sine', dur: 0.12, vol: 0.07, at: i * 0.09, glide: 90 }); }
  whoosh() { for (let i = 0; i < 10; i++) this.tone(300 + i * 90, { type: 'triangle', dur: 0.1, vol: 0.05, at: i * 0.03, glide: 1400 }); }
  wind()   { this.tone(240, { type: 'sine', dur: 1.2, vol: 0.05, glide: 480 }); this.tone(330, { type: 'sine', dur: 1.0, vol: 0.03, at: 0.2, glide: 620 }); }
  baa()    { this.tone(420, { type: 'sawtooth', dur: 0.5, vol: 0.05, glide: 380 }); this.tone(424, { type: 'sine', dur: 0.5, vol: 0.05, glide: 384 }); }
  clack()  { this.tone(1300, { type: 'square', dur: 0.03, vol: 0.05 }); this.tone(900, { type: 'triangle', dur: 0.06, vol: 0.06, at: 0.05 }); }
  squelch(){ this.tone(260, { type: 'sine', dur: 0.4, vol: 0.09, glide: 90 }); }
  rustle() { for (let i = 0; i < 6; i++) this.tone(700 + (i * 211) % 500, { type: 'triangle', dur: 0.05, vol: 0.03, at: i * 0.11 }); }
  rain()   { for (let i = 0; i < 12; i++) this.tone(900 + (i * 137) % 500, { type: 'sine', dur: 0.05, vol: 0.025, at: i * 0.1 }); }
  giggle(v = 1) { [880, 1046, 932, 1175].forEach((f, i) => this.tone(f, { type: 'triangle', dur: 0.07, vol: 0.06 * v, at: i * 0.09, glide: f * 1.1 })); }
  buzz()   { this.tone(210, { type: 'sawtooth', dur: 0.6, vol: 0.02, glide: 240 }); }
  dusk()   { [523, 440, 349, 262].forEach((f, i) => this.tone(f, { type: 'sine', dur: 0.32, vol: 0.08, at: i * 0.2 })); }
  dawn()   { [262, 330, 392, 523].forEach((f, i) => this.tone(f, { type: 'triangle', dur: 0.28, vol: 0.08, at: i * 0.16 })); }
  splash() { this.tone(420, { type: 'sine', dur: 0.25, vol: 0.1, glide: 120 }); this.tone(1200, { type: 'triangle', dur: 0.12, vol: 0.04, at: 0.05, glide: 300 }); }
}

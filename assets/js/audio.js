/* ===========================================================
   Studioul de sunete — motorul audio (Web Audio API)
   Toate sunetele sunt create în browser, fără fișiere audio.
   =========================================================== */
const SND = (() => {
  let ctx = null, master = null, comp = null, noiseBuf = null;
  let muted = false;

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 6;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(comp); comp.connect(ctx.destination);
    // zgomot alb, refolosit
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  const now = () => (ctx ? ctx.currentTime : 0);
  function out(dest) { return dest || master; }

  function setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.03);
  }

  function env(g, t, a, peak, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
  }

  /* --- paharul lovit cu lingurița: parțiale inarmonice, cad lent --- */
  function glassTap(f, vol = 0.5, dest) {
    if (!init()) return;
    const t = now() + 0.005;
    [[1, 1, 1.9], [2.32, 0.28, 0.9], [4.25, 0.12, 0.45], [6.8, 0.05, 0.25]].forEach(([r, a, dec]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f * r;
      env(g, t, 0.003, vol * a, dec);
      o.connect(g); g.connect(out(dest));
      o.start(t); o.stop(t + dec + 0.05);
    });
    // clinchetul lingurii
    const n = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    n.buffer = noiseBuf; hp.type = "highpass"; hp.frequency.value = 4000;
    env(g, t, 0.001, vol * 0.25, 0.03);
    n.connect(hp); hp.connect(g); g.connect(out(dest));
    n.start(t); n.stop(t + 0.06);
  }

  /* --- suflat peste gura sticlei: zgomot de suflu + tonul coloanei de aer --- */
  function bottleBlow(f, vol = 0.5, dur = 0.9, dest) {
    if (!init()) return;
    const t = now() + 0.005;
    const o = ctx.createOscillator(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
    o.type = "sine"; o.frequency.value = f;
    vib.frequency.value = 5; vg.gain.value = f * 0.004;
    vib.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * 0.55, t + 0.12);
    g.gain.setValueAtTime(vol * 0.55, t + dur - 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out(dest));
    o.start(t); vib.start(t); o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
    const n = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain();
    n.buffer = noiseBuf; bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 12;
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.08);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp); bp.connect(ng); ng.connect(out(dest));
    n.start(t); n.stop(t + dur + 0.05);
  }

  /* --- elasticul ciupit: algoritmul Karplus-Strong --- */
  const ksCache = new Map();
  function pluck(f, vol = 0.6, dest) {
    if (!init()) return;
    const key = Math.round(f * 10);
    let buf = ksCache.get(key);
    if (!buf) {
      const sr = ctx.sampleRate, len = Math.floor(sr * 2.2);
      buf = ctx.createBuffer(1, len, sr);
      const y = buf.getChannelData(0);
      const N = Math.max(2, Math.round(sr / f));
      const damp = 0.996 - Math.min(0.012, f / 120000);
      for (let i = 0; i < N; i++) y[i] = Math.random() * 2 - 1;
      for (let i = N; i < len; i++) y[i] = damp * 0.5 * (y[i - N] + y[i - N + 1 < i ? i - N + 1 : i - N]);
      // netezire a începutului
      for (let i = 0; i < 64; i++) y[i] *= i / 64;
      ksCache.set(key, buf);
      if (ksCache.size > 80) ksCache.delete(ksCache.keys().next().value);
    }
    const s = ctx.createBufferSource(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    s.buffer = buf; lp.type = "lowpass"; lp.frequency.value = Math.min(9000, f * 9);
    g.gain.value = vol;
    s.connect(lp); lp.connect(g); g.connect(out(dest));
    s.start(now() + 0.005);
  }

  /* --- toba: ton care coboară repede + plesnitura pielii --- */
  function drum(f, vol = 0.7, decay = 0.6, dest) {
    if (!init()) return;
    const t = now() + 0.005;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(f * 1.9, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    env(g, t, 0.002, vol, decay);
    o.connect(g); g.connect(out(dest));
    o.start(t); o.stop(t + decay + 0.1);
    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.type = "triangle"; o2.frequency.value = f * 1.59;
    env(g2, t, 0.002, vol * 0.25, decay * 0.5);
    o2.connect(g2); g2.connect(out(dest)); o2.start(t); o2.stop(t + decay);
    const n = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain();
    n.buffer = noiseBuf; bp.type = "bandpass"; bp.frequency.value = Math.min(5000, f * 8); bp.Q.value = 0.8;
    env(ng, t, 0.001, vol * 0.35, 0.07);
    n.connect(bp); bp.connect(ng); ng.connect(out(dest));
    n.start(t); n.stop(t + 0.12);
  }

  /* --- clopoțel --- */
  function bell(f = 1320, vol = 0.45, dest) {
    if (!init()) return;
    const t = now() + 0.005;
    [[1, 1, 1.4], [2.0, 0.5, 0.9], [2.76, 0.35, 0.7], [5.4, 0.15, 0.3]].forEach(([r, a, dec]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f * r;
      env(g, t, 0.002, vol * a, dec);
      o.connect(g); g.connect(out(dest)); o.start(t); o.stop(t + dec + 0.05);
    });
  }

  /* --- notă simplă (jocuri, radio) --- */
  function note(f, dur = 0.4, vol = 0.4, type = "triangle", dest, when = 0) {
    if (!init()) return;
    const t = now() + 0.01 + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.setValueAtTime(vol, t + Math.max(0.03, dur - 0.08));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out(dest)); o.start(t); o.stop(t + dur + 0.05);
  }

  function buzz() {
    if (!init()) return;
    note(140, 0.25, 0.25, "sawtooth"); note(147, 0.25, 0.2, "sawtooth");
  }
  function tada() {
    if (!init()) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, 0.35, 0.3, "triangle", null, i * 0.11));
  }

  /* --- ton continuu (laboratorul undelor) --- */
  function tone() {
    if (!init()) return null;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; g.gain.value = 0.0001;
    o.connect(g); g.connect(master); o.start();
    return {
      set(f, v) {
        o.frequency.setTargetAtTime(f, ctx.currentTime, 0.02);
        g.gain.setTargetAtTime(Math.max(0.0001, v), ctx.currentTime, 0.03);
      },
      stop() { g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03); setTimeout(() => { try { o.stop(); } catch (e) {} }, 200); }
    };
  }

  function gainNode(v = 1) { if (!init()) return null; const g = ctx.createGain(); g.gain.value = v; g.connect(master); return g; }
  function lowpassTo(dest, freq) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq; f.connect(dest); return f; }
  function setGain(g, v, tc = 0.05) { if (g && ctx) g.gain.setTargetAtTime(v, ctx.currentTime, tc); }

  return { init, now, glassTap, bottleBlow, pluck, drum, bell, note, buzz, tada, tone, gainNode, lowpassTo, setGain, setMuted,
           get ctx() { return ctx; }, get muted() { return muted; } };
})();

/* --- note muzicale --- */
const NOTES_RO = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
const NOTES_EN = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function freqToNote(f, lang) {
  const n = Math.round(12 * Math.log2(f / 440)) + 57; // 57 = La4 în numerotarea de la Do0
  const name = (lang === "en" ? NOTES_EN : NOTES_RO)[((n % 12) + 12) % 12];
  return { name, octave: Math.floor(n / 12), cents: Math.round(1200 * Math.log2(f / (440 * Math.pow(2, (n - 57) / 12)))) };
}
const SCALE = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5]; // Do5 … Do6

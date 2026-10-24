/* ===========================================================
   Studioul de sunete — logica aplicației
   =========================================================== */
"use strict";
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- memorie în browser (opțională) ---------- */
const STORE_KEY = "studioul-de-sunete-v1";
function loadStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }
function saveStore() { try { localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); } catch (e) {} }
const STORE = loadStore();
STORE.stars = STORE.stars || {};

/* ---------- limbă ---------- */
let LANG = STORE.lang === "en" ? "en" : "ro";
function t(key, vars) {
  let s = (I18N[LANG] && I18N[LANG][key]);
  if (s === undefined) s = I18N.ro[key];
  if (s === undefined) return key;
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}
const fmt = (n, d = 0) => Number(n).toLocaleString(LANG === "ro" ? "ro-RO" : "en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const langHooks = [];
function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
}
function setLang(l) {
  LANG = l; STORE.lang = l; saveStore();
  document.documentElement.lang = l;
  $("langRo").setAttribute("aria-pressed", l === "ro");
  $("langEn").setAttribute("aria-pressed", l === "en");
  applyI18n();
  document.title = t("app.title").replace(/^\S+\s/, "");
  langHooks.forEach((f) => f());
}
$("langRo").addEventListener("click", () => setLang("ro"));
$("langEn").addEventListener("click", () => setLang("en"));

/* ---------- temă ---------- */
let COL = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  ["--ink", "--ink-soft", "--line", "--panel", "--stage", "--accent", "--accent-soft", "--good", "--bad", "--warm", "--scope", "--scope-line", "--gold"].forEach((v) => {
    COL[v.slice(2)] = cs.getPropertyValue(v).trim();
  });
  const theme = document.documentElement.dataset.theme;
  COL.dark = theme ? theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function setTheme(th) {
  document.documentElement.dataset.theme = th || "";
  STORE.theme = th || ""; saveStore(); readColors();
}
$("themeBtn").addEventListener("click", () => setTheme(COL.dark ? "light" : "dark"));
try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors); } catch (e) {}
document.documentElement.dataset.theme = STORE.theme || "";

/* ---------- sunet pornit / oprit ---------- */
function setMute(m) { SND.setMuted(m); $("soundBtn").textContent = m ? "🔇" : "🔊"; STORE.muted = m; saveStore(); }
$("soundBtn").addEventListener("click", () => { SND.init(); setMute(!SND.muted); });
if (STORE.muted) setMute(true);
document.addEventListener("pointerdown", () => SND.init(), { once: true });

/* ---------- pânze (canvas) ---------- */
function setupCanvas(cv) {
  const W = +cv.getAttribute("width"), H = +cv.getAttribute("height");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext("2d");
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { cv, c, W, H };
}
function ptr(e, k) {
  const r = k.cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * k.W / r.width, y: (e.clientY - r.top) * k.H / r.height };
}
function rr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}
function clear(k) { k.c.clearRect(0, 0, k.W, k.H); }
function emoji(c, ch, x, y, size) {
  c.font = size + "px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
  c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(ch, x, y);
}
function txt(c, s, x, y, size = 15, color = COL.ink, align = "center", weight = "600") {
  c.font = weight + " " + size + "px 'Segoe UI',system-ui,sans-serif";
  c.fillStyle = color; c.textAlign = align; c.textBaseline = "middle"; c.fillText(s, x, y);
}
function sayEl(id, html, cls) {
  const el = $(id); el.innerHTML = html;
  el.classList.remove("good", "warn"); if (cls) el.classList.add(cls);
}

/* desenul unei tobe — vezi art.js */
function drawDrum(c, cx, cy, rx, ry, h, vib, phase, body, opt) { ART.drum(c, cx, cy, rx, ry, h, vib, phase, body, opt); }

/* inele de sunet care pleacă dintr-un punct */
function rings(c, list, dt, color) {
  for (let i = list.length - 1; i >= 0; i--) {
    const r = list[i]; r.r += r.v * dt; r.a -= dt * (r.fade || 0.8);
    if (r.a <= 0) { list.splice(i, 1); continue; }
    c.strokeStyle = color.replace("A", r.a.toFixed(3)); c.lineWidth = r.w || 3;
    c.beginPath(); c.arc(r.x, r.y, r.r, r.a0 !== undefined ? r.a0 : 0, r.a1 !== undefined ? r.a1 : Math.PI * 2); c.stroke();
  }
}

/* =====================================================================
   1. TOBA CU OREZ
   ===================================================================== */
const RICE = (() => {
  const k = setupCanvas($("cvRice"));
  const cx = 440, cy = 150, rx = 230, ry = 58, h = 110;
  let vib = 0, phase = 0, stick = 0;
  const grains = [], waves = [];
  for (let i = 0; i < 34; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.82;
    grains.push({ gx: Math.cos(a) * r * rx, gy: Math.sin(a) * r * ry, z: 0, vz: 0, rot: Math.random() * 3, vr: 0 });
  }
  function hit(s) {
    SND.drum(105, 0.2 + 0.65 * s, 0.9);
    vib = 4 + 12 * s; stick = 1;
    grains.forEach((g) => { g.vz = rnd(0.45, 1) * s * 620; g.vr = rnd(-12, 12) * s; });
    for (let i = 0; i < (s > 0.6 ? 4 : 2); i++)
      waves.push({ x: cx, y: cy + 30, r: rx * 0.9 + i * 30, v: 260, a: 0.25 + 0.5 * s - i * 0.08, w: 2 + 4 * s, a0: Math.PI * 1.08, a1: Math.PI * 1.92, fade: 0.6 });
    sayEl("sayRice", t(s > 0.6 ? "w1.sayHard" : "w1.saySoft"), s > 0.6 ? "good" : "");
  }
  $("riceSoft").addEventListener("click", () => hit(0.35));
  $("riceHard").addEventListener("click", () => hit(1));
  k.cv.addEventListener("pointerdown", (e) => {
    const p = ptr(e, k);
    if (((p.x - cx) / rx) ** 2 + ((p.y - cy) / ry) ** 2 < 1.3 || (Math.abs(p.x - cx) < rx && p.y > cy && p.y < cy + h + ry)) hit(0.7);
  });
  function draw(dt) {
    const c = k.c; clear(k);
    phase += dt * 60; vib *= Math.exp(-dt * 3.2);
    ART.wood(k.c, 0, 292, k.W, 38, COL.dark);
    rings(c, waves, dt, COL.dark ? "rgba(200,180,255,A)" : "rgba(124,58,237,A)");
    drawDrum(c, cx, cy, rx, ry, h, vib, phase, "#9f1239");
    grains.forEach((g) => {
      if (g.z > 0 || g.vz > 0) { g.vz -= 1900 * dt; g.z += g.vz * dt; g.rot += g.vr * dt; if (g.z <= 0) { g.z = 0; g.vz = Math.abs(g.vz) > 120 ? -g.vz * 0.35 : 0; g.vr *= 0.5; } }
      const x = cx + g.gx, y = cy + g.gy + vib * Math.sin(phase) * 0.5;
      ART.rice(c, x, y - g.z, g.rot, g.z);
    });
    stick = Math.max(0, stick - dt * 5);
    ART.stick(c, cx + rx + 150, cy - 70 + stick * 40, Math.PI + 0.55 - stick * 0.35, 200);
    ART.stick(c, cx + rx + 170, cy - 40, Math.PI + 0.35, 200);
  }
  return { draw, panel: "p-what" };
})();

/* =====================================================================
   2. CĂLĂTORIA SUNETULUI
   ===================================================================== */
const TRAVEL = (() => {
  const k = setupCanvas($("cvTravel"));
  const MED = {
    air: { v: 343, cols: 34, rows: 6, color: "#60a5fa", emoji: "🌬️" },
    water: { v: 1480, cols: 48, rows: 8, color: "#3b82f6", emoji: "💧" },
    wood: { v: 3500, cols: 60, rows: 10, color: "#b07a3c", emoji: "🪵" },
    space: { v: 0, cols: 0, rows: 0, color: "#000", emoji: "🌌" }
  };
  let med = "air", pulse = null, cone = 0, earFlash = 0, arrivedTime = null;
  const x0 = 120, x1 = 840, top = 50, bot = 230;
  const stars = Array.from({ length: 70 }, () => ({ x: rnd(0, 960), y: rnd(0, 280), s: rnd(0.5, 2) }));
  function setMed(m) {
    med = m; pulse = null; arrivedTime = null;
    document.querySelectorAll("[data-med]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.med === m));
    $("travelSpeed").textContent = m === "space" ? "0 m/s" : fmt(MED[m].v) + " m/s";
    $("travelTime").textContent = "—";
    sayEl("sayTravel", t("w2.say0"));
  }
  document.querySelectorAll("[data-med]").forEach((b) => b.addEventListener("click", () => setMed(b.dataset.med)));
  $("travelGo").addEventListener("click", () => {
    SND.init(); cone = 1; arrivedTime = null; $("travelTime").textContent = "…";
    pulse = { t: 0, dur: med === "space" ? 3 : 1000 / MED[med].v, done: false };
  });
  langHooks.push(() => { $("travelSpeed").textContent = med === "space" ? "0 m/s" : fmt(MED[med].v) + " m/s"; if (arrivedTime !== null) showResult(); });
  function showResult() {
    if (med === "space") { $("travelTime").textContent = t("w2.never"); sayEl("sayTravel", t("w2.saySpace"), "warn"); }
    else {
      $("travelTime").textContent = t("w2.sec", { s: fmt(1000 / MED[med].v, med === "air" ? 1 : 2) });
      sayEl("sayTravel", t({ air: "w2.sayAir", water: "w2.sayWater", wood: "w2.sayWood" }[med]), "good");
    }
  }
  function draw(dt) {
    const c = k.c; clear(k);
    const M = MED[med];
    if (med === "space") {
      c.fillStyle = "#0b1020"; c.fillRect(0, 0, k.W, k.H);
      stars.forEach((s) => { c.fillStyle = "rgba(255,255,255,.8)"; c.fillRect(s.x, s.y, s.s, s.s); });
    } else if (med === "water") {
      c.fillStyle = COL.dark ? "rgba(30,80,160,.35)" : "rgba(147,197,253,.35)"; c.fillRect(100, 30, 760, 220);
    } else if (med === "wood") {
      c.fillStyle = COL.dark ? "#5a3d1e" : "#e8c89a"; c.fillRect(100, 30, 760, 220);
      c.strokeStyle = "rgba(120,70,20,.35)"; c.lineWidth = 2;
      for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(100, 45 + i * 24); for (let x = 100; x <= 860; x += 40) c.lineTo(x, 45 + i * 24 + Math.sin(x / 60 + i) * 4); c.stroke(); }
    }
    let px = -999;
    if (pulse) {
      pulse.t += dt;
      px = x0 + (pulse.t / pulse.dur) * (x1 - x0);
      if (med !== "space" && px >= x1 && !pulse.done) {
        pulse.done = true; earFlash = 1; arrivedTime = pulse.dur;
        SND.drum(520, 0.5, 0.25); SND.bell(1046, 0.25); showResult();
      }
      if (med === "space" && pulse.t > pulse.dur && !pulse.done) { pulse.done = true; arrivedTime = 0; showResult(); }
      if (pulse.t > pulse.dur + 1.2) pulse = null;
    }
    // particulele
    if (M.cols) {
      const dx = (x1 - x0) / (M.cols - 1), dy = (bot - top) / (M.rows - 1);
      c.fillStyle = M.color;
      for (let i = 0; i < M.cols; i++) for (let j = 0; j < M.rows; j++) {
        const bx = x0 + i * dx, by = top + j * dy;
        const u = (bx - px) / 28;
        const off = (pulse && med !== "space") ? -16 * u * Math.exp(-u * u) : 0;
        const jit = Math.sin(i * 7.3 + j * 3.1 + performance.now() / 300) * 1.2;
        c.beginPath(); c.arc(bx + off + jit, by + Math.cos(i * 2.1 + j + performance.now() / 350) * 1.2, med === "wood" ? 4 : 5, 0, Math.PI * 2); c.fill();
      }
      if (pulse && !pulse.done) { c.fillStyle = "rgba(249,115,22,.18)"; c.fillRect(px - 26, 30, 52, 220); }
    }
    // difuzorul
    cone *= Math.exp(-dt * 2);
    ART.speaker(c, 8, 62, 96, 156, cone * Math.sin(performance.now() / 14));
    // Eva și urechea
    emoji(c, "👧", 905, 140, 64);
    if (earFlash > 0) { earFlash -= dt; c.strokeStyle = "rgba(22,163,74," + clamp(earFlash, 0, 1) + ")"; c.lineWidth = 5; c.beginPath(); c.arc(905, 140, 44 + (1 - earFlash) * 20, 0, Math.PI * 2); c.stroke(); }
    // eticheta 1 km
    const lc = med === "space" ? "#cbd5e1" : COL["ink-soft"];
    c.strokeStyle = lc; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, 262); c.lineTo(x1, 262); c.stroke();
    c.beginPath(); c.moveTo(x0, 256); c.lineTo(x0, 268); c.moveTo(x1, 256); c.lineTo(x1, 268); c.stroke();
    c.fillStyle = med === "space" ? "#0b1020" : COL.stage; c.fillRect(440, 252, 80, 20);
    txt(c, "1 km", 480, 262, 14, lc);
    if (med === "space" && pulse) txt(c, "…", 480, 140, 40, "#cbd5e1");
  }
  setMed("air");
  return { draw, panel: "p-what" };
})();

/* =====================================================================
   3. CLOPOȚELUL DIN BORCAN
   ===================================================================== */
const JAR = (() => {
  const k = setupCanvas($("cvJar"));
  let air = 1, ringing = false, pumping = false, refilling = false, last = 0, hammer = 0, shake = 0, gain = null, pumpAnim = 0, wasLow = false;
  const parts = Array.from({ length: 70 }, () => ({ x: rnd(345, 615), y: rnd(70, 270), vx: rnd(-40, 40), vy: rnd(-40, 40) }));
  const waves = [];
  function ensureGain() { if (!gain) gain = SND.gainNode(1); return gain; }
  function setRingBtn() { $("jarRing").innerHTML = t(ringing ? "w3.stop" : "w3.ring"); }
  $("jarRing").addEventListener("click", () => { SND.init(); ensureGain(); ringing = !ringing; setRingBtn(); if (ringing) { last = 0; sayEl("sayJar", t(air > 0.6 ? "w3.sayFull" : air > 0.1 ? "w3.sayHalf" : "w3.sayEmpty")); } });
  const pb = $("jarPump");
  const startPump = (e) => { e.preventDefault(); pumping = true; refilling = false; };
  const endPump = () => { pumping = false; };
  pb.addEventListener("pointerdown", startPump); pb.addEventListener("pointerup", endPump); pb.addEventListener("pointerleave", endPump); pb.addEventListener("pointercancel", endPump);
  pb.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { pumping = true; e.preventDefault(); } });
  pb.addEventListener("keyup", endPump);
  $("jarAir").addEventListener("click", () => { refilling = true; pumping = false; });
  langHooks.push(setRingBtn);
  function stop() { ringing = false; setRingBtn(); }
  function update(dt) {
    if (pumping) { air = Math.max(0.01, air - dt * 0.2); pumpAnim += dt * 9; }
    if (refilling) { air = Math.min(1, air + dt * 0.8); if (air >= 1) { refilling = false; } }
    if (gain) SND.setGain(gain, Math.pow(Math.max(0, (air - 0.02) / 0.98), 1.7), 0.08);
    $("jarAirV").textContent = Math.round(air * 100) + " %";
    $("jarAirBar").style.width = (air * 100) + "%";
    if (ringing) {
      last -= dt;
      if (last <= 0) { last = 0.55; hammer = 1; shake = 1; SND.bell(1480, 0.55, gain); if (air > 0.05) waves.push({ x: 480, y: 150, r: 150, v: 160, a: 0.7 * air, w: 3, fade: 0.9 }); }
      if (air < 0.08 && !wasLow) { wasLow = true; sayEl("sayJar", t("w3.sayEmpty"), "warn"); }
      else if (air < 0.6 && air >= 0.08 && pumping) sayEl("sayJar", t("w3.sayHalf"));
    }
    if (refilling && wasLow && air > 0.5) { wasLow = false; sayEl("sayJar", t("w3.sayBack"), "good"); }
    hammer = Math.max(0, hammer - dt * 6); shake *= Math.exp(-dt * 5);
  }
  function draw(dt) {
    update(dt);
    const c = k.c; clear(k);
    const JX = 345, JW = 270, JT = 30, JB = 268;
    ART.wood(c, 0, 288, k.W, 32, COL.dark);
    rings(c, waves, dt, COL.dark ? "rgba(200,180,255,A)" : "rgba(124,58,237,A)");
    ART.belljarBack(c, JX, JT, JW, JB, COL.dark);
    // particule de aer
    const n = Math.round(air * parts.length);
    c.fillStyle = COL.dark ? "rgba(147,197,253,.75)" : "rgba(59,130,246,.55)";
    for (let i = 0; i < n; i++) {
      const p = parts[i]; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 360 || p.x > 600) p.vx *= -1; if (p.y < 90 || p.y > 262) p.vy *= -1;
      c.beginPath(); c.arc(p.x, p.y, 3, 0, Math.PI * 2); c.fill();
    }
    const sx = Math.sin(performance.now() / 22) * 4 * shake;
    ART.bell(c, 470, 150, 46, sx, hammer, JB);
    ART.belljarFront(c, JX, JT, JW, JB, COL.dark);
    // furtunul și pompa
    ART.hose(c, [[JX + JW + 30, JB + 8], [JX + JW + 80, JB + 20], [720, JB + 10], [735, 240]]);
    ART.pump(c, 715, 118, 120, 168, air, pumping ? Math.abs(Math.sin(pumpAnim)) * 26 : 0);
    txt(c, t("w3.airK") + ": " + Math.round(air * 100) + "%", 763, 306, 13, COL.dark ? "#fde68a" : "#422006");
    emoji(c, air > 0.1 ? "👂" : "🤷", 150, 160, 60);
  }
  return { draw, stop, panel: "p-what" };
})();

/* =====================================================================
   4. DISTANȚA ȘI IZOLAREA
   ===================================================================== */
const DIST = (() => {
  const k = setupCanvas($("cvDist"));
  const MAT = { none: [1, 14000], foil: [0.9, 9000], card: [0.6, 3500], egg: [0.33, 1600], pillow: [0.1, 600] };
  let d = 2, mat = "none", on = false, gain = null, filt = null, timer = null, next = 0, step = 0;
  const waves = []; let wt = 0;
  const MEL = [72, 76, 79, 76, 81, 79, 76, 74, 72, 76, 79, 84, 81, 79, 76, 79];
  const BASS = [48, 53, 55, 48];
  const m2f = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const bars = $("loudBar"); for (let i = 0; i < 14; i++) bars.appendChild(document.createElement("i"));
  function loud() { return MAT[mat][0] * Math.pow(1 / d, 0.85); }
  function apply() {
    $("distV").textContent = fmt(d, d % 1 ? 1 : 0) + " m";
    const L = loud();
    if (gain) SND.setGain(gain, L, 0.08);
    if (filt) filt.frequency.setTargetAtTime(MAT[mat][1], SND.ctx.currentTime, 0.05);
    const lit = on && L > 0.005 ? Math.max(1, Math.round(L * 14)) : Math.round(L * 14);
    [...bars.children].forEach((b, i) => { b.className = i < lit ? "on" + (i > 9 ? " hi" : i > 5 ? " mid" : "") : ""; b.style.height = (30 + i * 5) + "%"; });
    const base = t(d <= 3 ? "w4.sayNear" : d >= 6 ? "w4.sayFar" : "w4.say0");
    sayEl("sayDist", base + t("w4.mat." + mat), mat === "pillow" ? "good" : "");
  }
  function tick() {
    const ctx = SND.ctx; if (!ctx) return;
    while (next < ctx.currentTime + 0.15) {
      const when = next - ctx.currentTime;
      SND.note(m2f(MEL[step % 16]), 0.24, 0.32, "triangle", filt, Math.max(0, when));
      if (step % 4 === 0) SND.note(m2f(BASS[(step / 4) % 4]), 0.9, 0.35, "sine", filt, Math.max(0, when));
      step++; next += 0.26;
    }
  }
  function setOn(v) {
    on = v; $("radioBtn").innerHTML = t(on ? "w4.off" : "w4.on");
    if (on) {
      SND.init();
      if (!gain) { gain = SND.gainNode(loud()); filt = SND.lowpassTo(gain, MAT[mat][1]); }
      next = SND.ctx.currentTime + 0.05; step = 0; timer = setInterval(tick, 40); apply();
    } else { clearInterval(timer); timer = null; }
  }
  $("radioBtn").addEventListener("click", () => setOn(!on));
  $("distR").addEventListener("input", (e) => { d = +e.target.value; apply(); });
  document.querySelectorAll("[data-mat]").forEach((b) => b.addEventListener("click", () => {
    mat = b.dataset.mat; document.querySelectorAll("[data-mat]").forEach((x) => x.setAttribute("aria-pressed", x === b)); apply();
  }));
  langHooks.push(() => { $("radioBtn").innerHTML = t(on ? "w4.off" : "w4.on"); apply(); });
  function draw(dt) {
    const c = k.c; clear(k);
    const ex = 210 + (d - 1) / 9 * 680, bx = (150 + ex) / 2;
    ART.wood(c, 0, 212, k.W, 38, COL.dark);
    if (on) { wt -= dt; if (wt <= 0) { wt = 0.26; waves.push({ x: 80, y: 140, r: 40, v: 230, a: 0.8, w: 4, fade: 0.55, a0: -0.7, a1: 0.7 }); } }
    // inelele: mai slabe după perete
    for (let i = waves.length - 1; i >= 0; i--) {
      const r = waves[i]; r.r += r.v * dt; r.a -= dt * r.fade;
      if (r.a <= 0 || r.r > 900) { waves.splice(i, 1); continue; }
      const past = mat !== "none" && 80 + r.r > bx;
      const a = r.a * (past ? MAT[mat][0] : 1) * Math.min(1, 140 / r.r);
      c.strokeStyle = (COL.dark ? "rgba(200,180,255," : "rgba(124,58,237,") + a.toFixed(3) + ")"; c.lineWidth = r.w;
      c.beginPath(); c.arc(r.x, r.y, r.r, r.a0, r.a1); c.stroke();
    }
    ART.radio(c, 18, 92, 128, 96, on, performance.now());
    if (mat !== "none") ART.material(c, mat, bx, 46, 212);
    // Eva
    emoji(c, "👧", ex, 140, 62);
    const L = on ? loud() : 0;
    if (on) emoji(c, L > 0.5 ? "😃" : L > 0.2 ? "🙂" : L > 0.08 ? "🤔" : "😴", ex + 42, 95, 28);
    txt(c, fmt(d, d % 1 ? 1 : 0) + " m", (150 + ex) / 2, 232, 14, COL.dark ? "#fde68a" : "#3b2410", "center", "700");
  }
  apply();
  return { draw, stop: () => setOn(false), panel: "p-what" };
})();

/* =====================================================================
   5. PAHARELE CU APĂ
   ===================================================================== */
const GL_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899"];
const tapF = (w) => 1100 * (1 - 0.55 * Math.pow(w, 1.5));
const blowF = (w) => 343 / (4 * (0.30 * (1 - w) + 0.04));
const tapW = (f) => Math.pow((1 - f / 1100) / 0.55, 2 / 3);
const blowW = (f) => 1 - (343 / (4 * f) - 0.04) / 0.30;
function glassFreq(w, mode) { return mode === "blow" ? blowF(w) : tapF(w); }
function playGlass(w, mode, vol = 0.5) { const f = glassFreq(w, mode); if (mode === "blow") SND.bottleBlow(f, vol); else SND.glassTap(f, vol); return f; }

/* desenul unui pahar sau al unei sticle — vezi art.js */
function drawVessel(c, x, yTop, yBot, wTop, wBot, water, color, mode, shake, glow, ripple) {
  return ART.vessel(c, x, yTop, yBot, wTop, wBot, water, color, mode, shake, glow, ripple, COL.dark);
}

const GLASS = (() => {
  const k = setupCanvas($("cvGlass"));
  let mode = "tap";
  const water = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85];
  const target = water.slice();
  const shake = new Array(8).fill(0), ripple = new Array(8).fill(0);
  const X = (i) => 70 + i * 117, TOP = 60, BOT = 315, WT = 92, WB = 70;
  let drag = null;
  function play(i) {
    SND.init();
    const f = playGlass(water[i], mode, 0.5);
    shake[i] = 1; ripple[i] = 1;
    return f;
  }
  function setMode(m) {
    mode = m;
    document.querySelectorAll("[data-gmode]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.gmode === m));
    sayEl("sayGlass", t(m === "tap" ? "g.sayTap" : "g.sayBlow"));
  }
  document.querySelectorAll("[data-gmode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.gmode)));
  function pourTo(arr) { arr.forEach((v, i) => (target[i] = v)); }
  $("gTune").addEventListener("click", () => {
    pourTo(SCALE.map((f) => clamp(mode === "tap" ? tapW(f) : blowW(f), 0, 1)));
    sayEl("sayGlass", t("g.sayTuned"), "good");
  });
  $("gEmpty").addEventListener("click", () => pourTo(new Array(8).fill(0)));
  $("gFull").addEventListener("click", () => pourTo(new Array(8).fill(mode === "blow" ? 0.9 : 0.95)));
  $("gSweep").addEventListener("click", () => { for (let i = 0; i < 8; i++) setTimeout(() => play(i), i * 320); });
  function hitTest(p) {
    for (let i = 0; i < 8; i++) if (Math.abs(p.x - X(i)) < WT / 2 + 8 && p.y > TOP - 20 && p.y < BOT + 10) return i;
    return -1;
  }
  k.cv.addEventListener("pointerdown", (e) => {
    const p = ptr(e, k), i = hitTest(p); if (i < 0) return;
    drag = { i, y0: p.y, moved: false }; k.cv.setPointerCapture(e.pointerId);
  });
  k.cv.addEventListener("pointermove", (e) => {
    if (!drag) return; const p = ptr(e, k);
    if (Math.abs(p.y - drag.y0) > 7) drag.moved = true;
    if (drag.moved) { const w = clamp((BOT - 4 - p.y) / (BOT - TOP - 14), 0, mode === "blow" ? 0.92 : 1); water[drag.i] = target[drag.i] = w; }
  });
  const up = () => { if (!drag) return; play(drag.i); drag = null; };
  k.cv.addEventListener("pointerup", up); k.cv.addEventListener("pointercancel", () => (drag = null));
  document.addEventListener("keydown", (e) => {
    if ($("p-shop").classList.contains("hidden") || $("ins-glass").classList.contains("hidden")) return;
    if (e.target.tagName === "INPUT") return;
    const n = +e.key; if (n >= 1 && n <= 8) play(n - 1);
  });
  langHooks.push(() => {});
  function draw(dt) {
    const c = k.c; clear(k);
    ART.wood(c, 0, BOT, k.W, 16, COL.dark);
    for (let i = 0; i < 8; i++) {
      water[i] = Math.abs(target[i] - water[i]) < 0.003 ? target[i] : lerp(water[i], target[i], 1 - Math.exp(-dt * 5));
      shake[i] *= Math.exp(-dt * 3); ripple[i] *= Math.exp(-dt * 2.5);
      drawVessel(c, X(i), TOP, BOT, WT, WB, water[i], GL_COLORS[i], mode, shake[i], 0, ripple[i]);
      const f = glassFreq(water[i], mode), nn = freqToNote(f, LANG);
      const close = Math.abs(nn.cents) <= 12;
      txt(c, (close ? "" : "~") + nn.name, X(i), BOT + 32, 17, close ? COL.ink : COL["ink-soft"], "center", "700");
      txt(c, t("g.lvl", { p: Math.round(water[i] * 100) }), X(i), BOT + 52, 12, COL["ink-soft"], "center", "400");
      txt(c, String(i + 1), X(i), TOP - 22, 13, COL["ink-soft"]);
      if (shake[i] > 0.05 && mode === "tap") ART.spoon(c, X(i) + 52, TOP + 40 - shake[i] * 6, -0.5 + shake[i] * 0.2);
      if (shake[i] > 0.05 && mode === "blow") ART.breath(c, X(i), TOP - 4, shake[i]);
    }
  }
  return { draw, panel: "p-shop", sub: "ins-glass" };
})();

/* =====================================================================
   6. CHITARA DIN ELASTICE
   ===================================================================== */
const BAND = (() => {
  const k = setupCanvas($("cvBand"));
  const MU = { thin: 0.5, mid: 1, fat: 2 }, LW = { thin: 3, mid: 6, fat: 11 };
  let thick = "mid", T = 3, L = 24, amp = 0, ph = 0, f = 0, lastX = null;
  const XA = 120, XEND = 860, Y = 150;
  const freq = () => 220 * (20 / L) * Math.sqrt(T / 3) / Math.sqrt(MU[thick]);
  const xb = () => XA + (L / 30) * (XEND - XA);
  function updateRead() {
    f = freq();
    $("bHz").textContent = t("b.hz", { n: fmt(Math.round(f)) });
    $("bPitchDot").style.left = clamp((Math.log2(f / 60) / Math.log2(1100 / 60)) * 100, 0, 100) + "%";
    $("bTightV").textContent = T; $("bLenV").textContent = L + " cm";
  }
  function tip() {
    let s = t("b.tip." + thick);
    if (T >= 4) s += t("b.tip.tight"); else if (T <= 2) s += t("b.tip.loose");
    if (L <= 15) s += t("b.tip.short"); else if (L >= 25) s += t("b.tip.long");
    return s;
  }
  function pluck(strength = 1) {
    SND.init(); updateRead(); SND.pluck(f, 0.55 + 0.3 * strength); amp = 26 * strength;
    sayEl("sayBand", tip());
  }
  document.querySelectorAll("[data-thick]").forEach((b) => b.addEventListener("click", () => {
    thick = b.dataset.thick; document.querySelectorAll("[data-thick]").forEach((x) => x.setAttribute("aria-pressed", x === b)); updateRead(); pluck();
  }));
  $("bTight").addEventListener("input", (e) => { T = +e.target.value; updateRead(); });
  $("bTight").addEventListener("change", () => pluck());
  $("bLen").addEventListener("input", (e) => { L = +e.target.value; updateRead(); });
  $("bLen").addEventListener("change", () => pluck());
  $("bPluck").addEventListener("click", () => pluck());
  k.cv.addEventListener("pointerdown", (e) => { const p = ptr(e, k); lastX = p; if (Math.abs(p.y - Y) < 40 && p.x > XA && p.x < xb()) pluck(); });
  k.cv.addEventListener("pointermove", (e) => {
    if (e.buttons === 0 && e.pointerType === "mouse") { lastX = null; return; }
    const p = ptr(e, k);
    if (lastX && (lastX.y - Y) * (p.y - Y) < 0 && p.x > XA && p.x < xb()) pluck(0.8);
    lastX = p;
  });
  langHooks.push(updateRead);
  function draw(dt) {
    const c = k.c; clear(k);
    ART.shoebox(c, 70, 34, 840, 252, 480, 160, 120, 82);
    const B = xb();
    ART.screw(c, XA - 14, Y); ART.screw(c, XEND + 14, Y);
    // partea nemișcată, după creion
    ART.bandPath(c, [[B, Y - 2], [XEND + 14, Y]], LW[thick]);
    // partea care vibrează
    ph += dt * Math.min(60, f / 9) * Math.PI * 2; amp *= Math.exp(-dt * 1.4);
    const A = amp * Math.cos(ph), pts = [[XA - 14, Y]];
    for (let x = XA; x <= B; x += 6) pts.push([x, Y + A * Math.sin(Math.PI * (x - XA) / (B - XA))]);
    pts.push([B, Y - 2]);
    if (amp > 2) { c.globalAlpha = 0.22; const ghost = pts.map(([x, y]) => [x, 2 * Y - y]); ART.bandPath(c, ghost, LW[thick]); c.globalAlpha = 1; }
    ART.bandPath(c, pts, LW[thick]);
    // creionul (călușul)
    ART.pencil(c, B, 50, 272, 18);
    // rigla pentru lungime
    c.fillStyle = "rgba(255,255,255,.85)"; c.fillRect(XA, 292, B - XA, 20);
    c.strokeStyle = "#374151"; c.lineWidth = 1;
    for (let i = 0; i <= L; i++) { const xx = XA + i * (B - XA) / L; c.beginPath(); c.moveTo(xx, 292); c.lineTo(xx, 292 + (i % 5 ? 6 : 11)); c.stroke(); }
    txt(c, L + " cm", (XA + B) / 2, 304, 13, "#111827", "center", "700");
    // cât de întins
    let dots = ""; for (let i = 1; i <= 5; i++) dots += i <= T ? "●" : "○";
    txt(c, dots, XEND - 30, 62, 16, "#422006", "right");
  }
  updateRead();
  return { draw, panel: "p-shop", sub: "ins-band" };
})();

/* =====================================================================
   7. CONSTRUCTORUL DE TOBE
   ===================================================================== */
const DRUMB = (() => {
  const k = setupCanvas($("cvDrum"));
  const SZ = { s: { d: 25, rx: 80, h: 90, col: "#a0612b", wood: true }, m: { d: 40, rx: 140, h: 110, col: "#1e40af" }, l: { d: 60, rx: 210, h: 130, col: "#111827" } };
  let size = "m", T = 3, vib = 0, ph = 0, rx = SZ.m.rx, lastSize = "m";
  const waves = [];
  const freq = () => 200 * (40 / SZ[size].d) * Math.sqrt(T / 3);
  function updateRead() {
    const f = freq();
    $("dHz").textContent = t("b.hz", { n: fmt(Math.round(f)) });
    $("dPitchDot").style.left = clamp((Math.log2(f / 60) / Math.log2(1100 / 60)) * 100, 0, 100) + "%";
    $("dTightV").textContent = t("d.t" + T);
  }
  function hit() {
    SND.init(); const f = freq();
    SND.drum(f, 0.75, 0.35 + SZ[size].d / 60 * 0.9);
    vib = 10; waves.push({ x: 480, y: 120, r: SZ[size].rx, v: 300, a: 0.7, w: 4, a0: Math.PI * 1.1, a1: Math.PI * 1.9, fade: 0.9 });
    sayEl("sayDrum", t("d.say." + size) + (T !== 3 ? t("d.say.t") : ""));
  }
  document.querySelectorAll("[data-dsize]").forEach((b) => b.addEventListener("click", () => {
    size = b.dataset.dsize; document.querySelectorAll("[data-dsize]").forEach((x) => x.setAttribute("aria-pressed", x === b)); updateRead(); setTimeout(hit, 250);
  }));
  $("dTight").addEventListener("input", (e) => { T = +e.target.value; updateRead(); });
  $("dTight").addEventListener("change", hit);
  $("dHit").addEventListener("click", hit);
  k.cv.addEventListener("pointerdown", (e) => { const p = ptr(e, k); if (Math.abs(p.x - 480) < rx + 10 && p.y > 60) hit(); });
  langHooks.push(updateRead);
  function draw(dt) {
    const c = k.c; clear(k);
    rx = lerp(rx, SZ[size].rx, 1 - Math.exp(-dt * 8));
    const s = SZ[size], ry = rx * 0.26, h = lerp(90, 130, (rx - 80) / 130), cy = 286 - h - ry * 0.6;
    ph += dt * 60; vib *= Math.exp(-dt * (size === "l" ? 2.2 : 4));
    rings(c, waves, dt, COL.dark ? "rgba(200,180,255,A)" : "rgba(124,58,237,A)");
    ART.wood(c, 0, 286, k.W, 34, COL.dark);
    drawDrum(c, 480, cy, rx, ry, h, vib * (T / 3), ph * Math.sqrt(T / 3) * (40 / s.d), s.col, { wood: s.wood, lugs: s.wood ? 0 : size === "l" ? 10 : 8 });
    txt(c, "⌀ " + s.d + " cm", 24, 26, 16, COL.ink, "left", "700");
  }
  updateRead();
  return { draw, panel: "p-shop", sub: "ins-drum" };
})();

/* comutatorul de instrumente */
document.querySelectorAll("[data-ins]").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll("[data-ins]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  ["glass", "band", "drum"].forEach((n) => $("ins-" + n).classList.toggle("hidden", n !== b.dataset.ins));
}));

/* =====================================================================
   8. LABORATORUL UNDELOR — osciloscopul
   ===================================================================== */
const SCOPE = (() => {
  const k = setupCanvas($("cvScope"));
  let tone = null, on = false, ph = 0, ghost = null;
  const fOf = () => 110 * Math.pow(2, (+$("oPitch").value / 100) * 3.2);
  const vOf = () => +$("oLoud").value / 100;
  function loudWord(v) { return t(v < 0.25 ? "o.l1" : v < 0.5 ? "o.l2" : v < 0.8 ? "o.l3" : "o.l4"); }
  function update() {
    const f = fOf(), v = vOf();
    if (tone) tone.set(f, on ? v * v * 0.5 : 0.0001);
    const nn = freqToNote(f, LANG);
    sayEl("sayScope", t("o.sayDyn", { hz: fmt(Math.round(f)), note: nn.name, loud: loudWord(v) }) + "<br>" + t("o.say0"));
  }
  function setOn(v) {
    on = v; $("oPlay").innerHTML = t(on ? "o.stop" : "o.play");
    if (on && !tone) tone = SND.tone();
    update();
  }
  $("oPlay").addEventListener("click", () => setOn(!on));
  $("oPitch").addEventListener("input", update); $("oLoud").addEventListener("input", update);
  $("oGhost").addEventListener("change", (e) => { ghost = e.target.checked ? { f: fOf(), v: vOf() } : null; });
  langHooks.push(() => { $("oPlay").innerHTML = t(on ? "o.stop" : "o.play"); update(); });
  function wave(c, f, v, phase, color, width, dash) {
    const cyc = f / 55, A = v * 120, cy = k.H / 2;
    c.strokeStyle = color; c.lineWidth = width; c.setLineDash(dash || []);
    c.beginPath();
    for (let x = 0; x <= k.W; x += 2) { const y = cy - A * Math.sin(2 * Math.PI * cyc * x / k.W - phase); x ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke(); c.setLineDash([]);
  }
  function draw(dt) {
    const c = k.c; c.fillStyle = COL.scope || "#0e1a24"; c.fillRect(0, 0, k.W, k.H);
    c.strokeStyle = "rgba(255,255,255,.07)"; c.lineWidth = 1;
    for (let x = 0; x < k.W; x += 48) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, k.H); c.stroke(); }
    for (let y = 30; y < k.H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(k.W, y); c.stroke(); }
    c.strokeStyle = "rgba(255,255,255,.18)"; c.beginPath(); c.moveTo(0, k.H / 2); c.lineTo(k.W, k.H / 2); c.stroke();
    if (on) ph += dt * 4;
    if (ghost) wave(c, ghost.f, ghost.v, 0, "rgba(255,255,255,.35)", 3, [8, 6]);
    c.save(); c.shadowColor = "#34e7a3"; c.shadowBlur = on ? 14 : 6;
    wave(c, fOf(), vOf(), ph, on ? "#5fffc0" : "rgba(52,231,163,.6)", 3.5); c.restore();
    txt(c, t("o.scopeHint"), k.W - 12, k.H - 16, 13, "rgba(255,255,255,.55)", "right", "500");
  }
  update();
  return { draw, stop: () => setOn(false), panel: "p-wave" };
})();

/* =====================================================================
   9. MICROFONUL
   ===================================================================== */
const MIC = (() => {
  const k = setupCanvas($("cvMic"));
  let stream = null, an = null, src = null, buf = null, on = false, frame = 0, hi = 0, lo = 0, cur = 0;
  function detect(b, sr) {
    const N = b.length; let rms = 0;
    for (let i = 0; i < N; i++) rms += b[i] * b[i];
    rms = Math.sqrt(rms / N);
    if (rms < 0.012) return { f: -1, rms };
    const minL = Math.floor(sr / 1400), maxL = Math.floor(sr / 75), M = N - maxL;
    let best = -1, bestC = 0, prevC = 1, falling = true;
    const cs = new Float32Array(maxL + 2);
    for (let l = minL; l <= maxL; l++) {
      let s = 0, e1 = 0, e2 = 0;
      for (let i = 0; i < M; i++) { const a = b[i], d = b[i + l]; s += a * d; e1 += a * a; e2 += d * d; }
      const cc = s / Math.sqrt(e1 * e2 + 1e-12); cs[l] = cc;
      if (falling && cc > prevC) falling = false;
      if (!falling && cc > bestC) { bestC = cc; best = l; }
      if (!falling && bestC > 0.88 && cc < bestC - 0.1) break;
      prevC = cc;
    }
    if (best < 0 || bestC < 0.75) return { f: -1, rms };
    const y1 = cs[best - 1] || cs[best], y2 = cs[best], y3 = cs[best + 1] || cs[best];
    const sh = (y3 - y1) / (2 * (2 * y2 - y1 - y3) || 1);
    return { f: sr / (best + (isFinite(sh) ? sh : 0)), rms };
  }
  const label = (f) => { const n = freqToNote(f, LANG); return n.name + n.octave + " · " + fmt(Math.round(f)) + " Hz"; };
  async function start() {
    SND.init();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { sayEl("sayMic", t("m.none"), "warn"); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) { sayEl("sayMic", t("m.denied"), "warn"); return; }
    src = SND.ctx.createMediaStreamSource(stream);
    an = SND.ctx.createAnalyser(); an.fftSize = 2048; buf = new Float32Array(an.fftSize);
    src.connect(an);
    on = true; $("micBtn").innerHTML = t("m.off"); sayEl("sayMic", t("m.listen"), "good");
  }
  function stop() {
    if (stream) stream.getTracks().forEach((tr) => tr.stop());
    stream = null; on = false; if (src) src.disconnect(); src = null;
    $("micBtn").innerHTML = t("m.on");
  }
  $("micBtn").addEventListener("click", () => (on ? stop() : start()));
  langHooks.push(() => { $("micBtn").innerHTML = t(on ? "m.off" : "m.on"); if (hi) $("micHigh").textContent = label(hi); if (lo) $("micLow").textContent = label(lo); });
  function draw() {
    const c = k.c; c.fillStyle = COL.scope || "#0e1a24"; c.fillRect(0, 0, k.W, k.H);
    c.strokeStyle = "rgba(255,255,255,.15)"; c.lineWidth = 1; c.beginPath(); c.moveTo(0, k.H / 2); c.lineTo(k.W, k.H / 2); c.stroke();
    if (!on || !an) { txt(c, "🎤", k.W / 2, k.H / 2, 40, "#fff"); return; }
    an.getFloatTimeDomainData(buf);
    // aliniere pe o trecere prin zero, ca valul să stea pe loc
    let s0 = 0; for (let i = 1; i < 800; i++) if (buf[i - 1] < 0 && buf[i] >= 0) { s0 = i; break; }
    c.shadowColor = "#f9a8d4"; c.shadowBlur = 10;
    c.strokeStyle = "#ffc4e1"; c.lineWidth = 3; c.beginPath();
    const span = 1024;
    for (let i = 0; i < span; i++) { const x = i / span * k.W, y = k.H / 2 - clamp(buf[s0 + i] * 4, -1, 1) * (k.H / 2 - 10); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke(); c.shadowBlur = 0;
    if (++frame % 3 === 0) {
      const r = detect(buf, SND.ctx.sampleRate);
      $("micLoud").style.width = clamp(r.rms * 600, 0, 100) + "%";
      if (r.f > 0) {
        cur = r.f; $("micNote").textContent = label(r.f);
        if (!hi || r.f > hi) { hi = r.f; $("micHigh").textContent = label(hi); }
        if (!lo || r.f < lo) { lo = r.f; $("micLow").textContent = label(lo); }
      }
    }
  }
  return { draw, stop, panel: "p-wave" };
})();

/* =====================================================================
   10. AUZUL ANIMALELOR + VOCABULAR
   ===================================================================== */
const ANIMALS = [["elephant", 14, 12000], ["human", 20, 20000], ["dog", 67, 45000], ["cat", 45, 64000], ["bat", 2000, 110000], ["dolphin", 75, 150000]];
function buildHear() {
  const L0 = Math.log10(10), L1 = Math.log10(200000);
  const pos = (f) => ((Math.log10(f) - L0) / (L1 - L0)) * 100;
  const box = $("hearBox"); box.innerHTML = "";
  ANIMALS.forEach(([id, a, b]) => {
    const row = document.createElement("div"); row.className = "row";
    const note = I18N[LANG]["an.note." + id] ? "<span class='rng'>" + t("an.note." + id) + "</span>" : "";
    row.innerHTML = "<div>" + t("an." + id) + "</div><div><div class='track'><b style='left:" + pos(a) + "%;width:" + (pos(b) - pos(a)) + "%'></b><i class='human' style='left:" + pos(20) + "%;width:" + (pos(20000) - pos(20)) + "%'></i></div>" +
      "<span class='rng'>" + t("an.rng", { a: fmt(a), b: fmt(b) }) + "</span>" + note + "</div>";
    box.appendChild(row);
  });
  const ax = document.createElement("div"); ax.className = "axis";
  ax.innerHTML = "<div></div><div><span>🐻 " + t("h.axisL") + "</span><span>" + t("h.axisR") + " 🐦</span></div>";
  box.appendChild(ax);
}
function buildVocab() {
  $("vocabBox").innerHTML = VOCAB.map(([ro, en]) => LANG === "ro" ? "<div><b>" + ro + "</b><span>" + en + "</span></div>" : "<div><b>" + en + "</b><span>" + ro + "</span></div>").join("");
}
langHooks.push(buildHear, buildVocab);

/* =====================================================================
   11. PROVOCĂRILE
   ===================================================================== */
const SONGS = {
  song1: [[1, 1], [1, 1], [5, 1], [5, 1], [6, 1], [6, 1], [5, 2], [4, 1], [4, 1], [3, 1], [3, 1], [2, 1], [2, 1], [1, 2]],
  song2: [[3, 1], [3, 1], [4, 1], [5, 1], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [1, 1], [2, 1], [3, 1], [3, 1.5], [2, 0.5], [2, 2],
          [3, 1], [3, 1], [4, 1], [5, 1], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [1, 1], [2, 1], [3, 1], [2, 1.5], [1, 0.5], [1, 2]],
  song3: [[3, 1], [2, 1], [1, 1], [2, 1], [3, 1], [3, 1], [3, 2], [2, 1], [2, 1], [2, 2], [3, 1], [5, 1], [5, 2],
          [3, 1], [2, 1], [1, 1], [2, 1], [3, 1], [3, 1], [3, 1], [3, 1], [2, 1], [2, 1], [3, 1], [2, 1], [1, 3]]
};
const GAMES = [
  { id: "ear", icon: "👂" }, { id: "tune", icon: "🎯" }, { id: "song1", icon: "⭐" },
  { id: "song2", icon: "🎼" }, { id: "song3", icon: "🐑" }, { id: "mem", icon: "🔔" }
];
let curGame = null, gameObj = null;
function starStr(n) { return "⭐".repeat(n) + "☆".repeat(3 - n); }
function renderMissions() {
  const box = $("missions"); box.innerHTML = "";
  GAMES.forEach((g) => {
    const b = document.createElement("button"); b.className = "mission";
    b.setAttribute("aria-pressed", curGame === g.id);
    b.innerHTML = "<span class='mi'>" + g.icon + "</span><span class='mt'>" + t("gm." + g.id) + "</span><span class='ms'>" + starStr(STORE.stars[g.id] || 0) + "</span>";
    b.addEventListener("click", () => startGame(g.id));
    box.appendChild(b);
  });
  const tot = GAMES.reduce((s, g) => s + (STORE.stars[g.id] || 0), 0);
  $("totalStars").textContent = t("total", { s: tot, n: GAMES.length * 3 });
}
function stopGame() { if (gameObj && gameObj.stop) gameObj.stop(); gameObj = null; }
function startGame(id) {
  stopGame(); $("overlay").classList.add("hidden");
  curGame = id; renderMissions();
  const box = $("gameBox"); box.innerHTML = "";
  gameObj = id === "ear" ? earGame(box) : id === "tune" ? tuneGame(box) : id === "mem" ? memGame(box) : songGame(box, id);
}
function finish(id, stars, text) {
  const prev = STORE.stars[id] || 0;
  if (stars > prev) { STORE.stars[id] = stars; saveStore(); }
  renderMissions();
  if (stars > 0) SND.tada(); else SND.buzz();
  const key = id.startsWith("song") ? "song" : id;
  $("ovTitle").textContent = stars === 3 ? t("ov.great") : stars === 2 ? t("ov.good") : stars === 1 ? t("ov.ok") : t("ov.try");
  $("ovStars").textContent = starStr(stars);
  $("ovText").innerHTML = text;
  $("ovLearnP").innerHTML = t("ov." + key + ".l");
  $("ovReal").innerHTML = t("ov." + key + ".r");
  $("overlay").classList.remove("hidden");
  $("overlay").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
$("ovRetry").addEventListener("click", () => startGame(curGame));
$("overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") $("overlay").classList.add("hidden"); });
$("ovNext").addEventListener("click", () => {
  const i = GAMES.findIndex((g) => g.id === curGame);
  if (i < GAMES.length - 1) startGame(GAMES[i + 1].id); else { $("overlay").classList.add("hidden"); $("tab-quiz").click(); }
});
function el(tag, cls, html, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
function i18nEl(tag, cls, key, parent) { const e = el(tag, cls, t(key), parent); e.dataset.i18n = key; return e; }
function progress(parent, n) { const p = el("div", "progress", "", parent); for (let i = 0; i < n; i++) el("i", "", "", p); return p; }

/* --- Urechea de aur --- */
function earGame(box) {
  i18nEl("div", "brief", "ear.brief", box);
  const prog = progress(box, 8);
  const roundEl = el("h3", "", "", box);
  const qEl = el("p", "", "", box);
  const ctr = el("div", "controls", "", box);
  const playB = el("button", "btn", "", ctr);
  const ans = el("div", "bigbtns", "", box);
  const b1 = el("button", "btn ghost", "", ans), b2 = el("button", "btn ghost", "", ans);
  const fb = el("div", "say", "", box);
  const plan = ["p12", "p7", "L4", "p5", "p3", "L2.5", "p2", "p1"];
  let r = 0, score = 0, cur = null, heard = false, locked = false;
  function makeRound() {
    const s = plan[r], dir = Math.random() < 0.5 ? 1 : -1, base = rnd(380, 620);
    if (s[0] === "p") { const semi = +s.slice(1); cur = { type: "p", dir, f1: base, f2: base * Math.pow(2, dir * semi / 12), v1: 0.32, v2: 0.32 }; }
    else { const fac = +s.slice(1); const v1 = dir > 0 ? 0.1 : 0.42; cur = { type: "L", dir, f1: base, f2: base, v1, v2: dir > 0 ? v1 * fac : v1 / fac }; }
    heard = false; locked = false; texts(); fb.innerHTML = ""; fb.className = "say";
    [...prog.children].forEach((d, i) => d.classList.toggle("now", i === r));
  }
  function texts() {
    if (!cur) return;
    roundEl.textContent = t("ear.round", { n: r + 1, m: 8 });
    qEl.innerHTML = "<b>" + t(cur.type === "p" ? "ear.qPitch" : "ear.qLoud") + "</b>";
    playB.innerHTML = t(heard ? "ear.again" : "ear.play");
    b1.innerHTML = t(cur.type === "p" ? "ear.high" : "ear.loud");
    b2.innerHTML = t(cur.type === "p" ? "ear.low" : "ear.quiet");
  }
  function play() {
    SND.init();
    SND.note(cur.f1, 0.6, cur.v1, "triangle");
    SND.note(cur.f2, 0.6, cur.v2, "triangle", null, 0.85);
    heard = true; texts();
  }
  function answer(up) {
    if (locked) return;
    if (!heard) { fb.innerHTML = t("ear.listenFirst"); fb.className = "say warn"; return; }
    locked = true;
    const ok = (up ? 1 : -1) === cur.dir;
    if (ok) { score++; fb.innerHTML = t("ear.ok"); fb.className = "say good"; SND.note(1046.5, 0.15, 0.2, "sine"); }
    else {
      const w = cur.type === "p" ? (cur.dir > 0 ? "ear.w.high" : "ear.w.low") : (cur.dir > 0 ? "ear.w.loud" : "ear.w.quiet");
      fb.innerHTML = t("ear.no", { a: "<b>" + t(w) + "</b>" }); fb.className = "say warn";
    }
    prog.children[r].className = ok ? "ok" : "no";
    setTimeout(() => {
      if (gameObj !== api) return;
      r++;
      if (r < 8) makeRound();
      else finish("ear", score >= 8 ? 3 : score >= 6 ? 2 : score >= 4 ? 1 : 0, t("ov.ear.t", { a: score, b: 8 }));
    }, 1400);
  }
  playB.addEventListener("click", play);
  b1.addEventListener("click", () => answer(true)); b2.addEventListener("click", () => answer(false));
  const api = { refresh: texts };
  makeRound();
  return api;
}

/* --- Acordorul --- */
function tuneGame(box) {
  i18nEl("div", "brief", "tune.brief", box);
  const prog = progress(box, 5);
  const roundEl = el("h3", "", "", box);
  const modeEl = el("p", "", "", box);
  const stage = el("div", "stage", "", box);
  const cv = el("canvas", "", "", stage); cv.width = 960; cv.height = 300;
  const k = setupCanvas(cv);
  const ws = el("div", "waterslider", "", box);
  const wl = i18nEl("span", "", "tune.water", ws);
  const slider = el("input", "", "", ws); slider.type = "range"; slider.min = 0; slider.max = 100; slider.step = 0.5;
  const ctr = el("div", "bigbtns", "", box);
  const bT = el("button", "btn ghost", "", ctr), bP = el("button", "btn", "", ctr), bC = el("button", "btn warm", "", ctr);
  const tuner = el("div", "tuner hidden", "<div class='zone'></div><div class='needle'></div><span class='tl'></span><span class='tr'></span>", box);
  const fb = el("div", "say", "", box);
  const ROUNDS = [["tap", 4], ["tap", 7], ["blow", 2], ["tap", 1], ["blow", 5]];
  let r = 0, checks = 0, w = 0.5, shake = 0, tShake = 0, locked = false;
  const mode = () => ROUNDS[r][0], target = () => SCALE[ROUNDS[r][1]];
  function makeRound() {
    const tw = mode() === "tap" ? tapW(target()) : blowW(target());
    do { w = rnd(0.05, mode() === "blow" ? 0.9 : 0.95); } while (Math.abs(w - tw) < 0.28);
    slider.max = mode() === "blow" ? 92 : 100; slider.value = (w * 100).toFixed(1);
    locked = false; tuner.classList.add("hidden"); fb.innerHTML = ""; fb.className = "say";
    [...prog.children].forEach((d, i) => d.classList.toggle("now", i === r));
    texts();
  }
  function texts() {
    roundEl.textContent = t("tune.round", { n: r + 1, m: 5 });
    modeEl.innerHTML = t(mode() === "tap" ? "tune.modeTap" : "tune.modeBlow");
    bT.innerHTML = t("tune.target"); bP.innerHTML = t(mode() === "tap" ? "tune.tap" : "tune.blow"); bC.innerHTML = t("tune.check");
    tuner.querySelector(".tl").textContent = t("tune.lowL"); tuner.querySelector(".tr").textContent = t("tune.highL");
  }
  slider.addEventListener("input", () => { w = slider.value / 100; });
  slider.addEventListener("change", () => { playMine(); });
  function playMine() { playGlass(w, mode(), 0.5); shake = 1; }
  bT.addEventListener("click", () => { SND.init(); if (mode() === "blow") SND.bottleBlow(target(), 0.5); else SND.glassTap(target(), 0.5); tShake = 1; });
  bP.addEventListener("click", () => { SND.init(); playMine(); });
  bC.addEventListener("click", () => {
    if (locked) return;
    checks++;
    const f = glassFreq(w, mode()), cents = 1200 * Math.log2(f / target());
    tuner.classList.remove("hidden");
    tuner.querySelector(".needle").style.left = (50 + clamp(cents / 500, -1, 1) * 46) + "%";
    if (Math.abs(cents) <= 35) {
      locked = true; fb.innerHTML = t("tune.ok"); fb.className = "say good";
      SND.init(); playMine(); setTimeout(() => { if (mode() === "blow") SND.bottleBlow(target(), 0.4); else SND.glassTap(target(), 0.4); }, 700);
      prog.children[r].className = "ok";
      setTimeout(() => {
        if (gameObj !== api) return;
        r++; if (r < 5) makeRound(); else finish("tune", checks <= 7 ? 3 : checks <= 11 ? 2 : 1, t("ov.tune.t", { n: checks }));
      }, 1900);
    } else {
      const tooHigh = cents > 0;
      const add = (mode() === "tap") === tooHigh;   // lovit: prea înalt → mai multă apă; suflat: prea înalt → mai puțină apă
      fb.innerHTML = t(tooHigh ? "tune.high" : "tune.low", { hint: t(add ? "tune.hint.add" : "tune.hint.remove") });
      fb.className = "say warn";
    }
  });
  function draw(dt) {
    const c = k.c; clear(k);
    shake *= Math.exp(-dt * 3); tShake *= Math.exp(-dt * 3);
    ART.wood(c, 0, 262, k.W, 38, COL.dark);
    const tw = mode() === "tap" ? tapW(target()) : blowW(target());
    // ținta: un vas învelit într-o hârtie, ca să nu se vadă apa
    if (locked) drawVessel(c, 300, 40, 262, 130, 100, tw, GL_COLORS[ROUNDS[r][1]], mode(), tShake, 0, 0);
    else {
      drawVessel(c, 300, 40, 262, 130, 100, 0, "#999999", mode(), tShake, 0, 0);
      const ox = Math.sin(performance.now() / 16) * 3 * tShake;
      c.fillStyle = lg(c, 230, 0, 370, 0, [[0, "#d8c9a8"], [0.3, "#f5ecd6"], [0.7, "#efe3c6"], [1, "#c9b78f"]]);
      c.beginPath(); c.moveTo(232 + ox, 96); c.lineTo(368 + ox, 96); c.lineTo(362 + ox, 250); c.lineTo(238 + ox, 250); c.closePath(); c.fill();
      c.strokeStyle = "rgba(120,95,50,.35)"; c.lineWidth = 1; c.stroke();
      txt(c, "?", 300 + ox, 172, 70, "#7c3aed", "center", "800");
    }
    txt(c, "🎯", 300, 285, 20);
    drawVessel(c, 640, 40, 262, 130, 100, w, GL_COLORS[ROUNDS[r][1]], mode(), shake, 0, shake);
    txt(c, Math.round(w * 100) + "%", 640, 285, 15, COL.dark ? "#fde68a" : "#3b2410", "center", "700");
    if (shake > 0.05 && mode() === "tap") ART.spoon(c, 720, 90, -0.5 + shake * 0.2);
    if (shake > 0.05 && mode() === "blow") ART.breath(c, 640, 40, shake);
  }
  const api = { draw, refresh: texts };
  makeRound();
  return api;
}

/* --- Cântă melodia --- */
function songGame(box, id) {
  const notes = SONGS[id];
  const brief = el("div", "brief", t("song.brief", { name: t("gm." + id) }), box);
  const ctr = el("div", "controls", "", box);
  const bL = el("button", "btn ghost", "", ctr), bR = el("button", "btn ghost", "", ctr);
  const progEl = el("h3", "", "", box);
  const stage = el("div", "stage", "", box);
  const cv = el("canvas", "", "", stage); cv.width = 960; cv.height = 330;
  const k = setupCanvas(cv);
  const water = SCALE.map((f) => tapW(f));
  const shake = new Array(8).fill(0);
  let pos = 0, errs = 0, demo = false, demoTimers = [], done = false;
  const X = (i) => 70 + i * 117, TOP = 50, BOT = 280, WT = 90, WB = 68;
  function texts() {
    brief.innerHTML = t("song.brief", { name: t("gm." + id) });
    bL.innerHTML = t("song.listen"); bR.innerHTML = t("song.restart");
    progEl.textContent = t("song.prog", { n: Math.min(pos + 1, notes.length), m: notes.length, e: errs });
  }
  function hitGlass(i) {
    SND.glassTap(SCALE[i], 0.5); shake[i] = 1;
  }
  function tap(i) {
    if (demo || done) return;
    SND.init(); hitGlass(i);
    if (i === notes[pos][0] - 1) {
      pos++;
      if (pos >= notes.length) { done = true; texts(); setTimeout(() => { if (gameObj === api) finish(id, errs <= 1 ? 3 : errs <= 4 ? 2 : 1, t("ov.song.t", { e: errs })); }, 900); }
    } else { errs++; setTimeout(() => SND.buzz(), 120); }
    texts();
  }
  function stopDemo() { demoTimers.forEach(clearTimeout); demoTimers = []; demo = false; }
  bL.addEventListener("click", () => {
    SND.init(); stopDemo(); demo = true; let tt = 0; const beat = 380;
    notes.forEach(([d, len]) => { demoTimers.push(setTimeout(() => hitGlass(d - 1), tt)); tt += len * beat; });
    demoTimers.push(setTimeout(() => { demo = false; }, tt));
  });
  bR.addEventListener("click", () => { stopDemo(); pos = 0; errs = 0; done = false; texts(); });
  k.cv.addEventListener("pointerdown", (e) => {
    const p = ptr(e, k);
    for (let i = 0; i < 8; i++) if (Math.abs(p.x - X(i)) < WT / 2 + 10 && p.y > TOP - 20 && p.y < BOT + 30) { tap(i); return; }
  });
  const key = (e) => { if ($("p-game").classList.contains("hidden")) return; const n = +e.key; if (n >= 1 && n <= 8) tap(n - 1); };
  document.addEventListener("keydown", key);
  function draw(dt) {
    const c = k.c; clear(k);
    ART.wood(c, 0, BOT, k.W, 50, COL.dark);
    const next = !demo && !done ? notes[pos][0] - 1 : -1;
    const pulse = 0.55 + 0.45 * Math.sin(performance.now() / 180);
    for (let i = 0; i < 8; i++) {
      shake[i] *= Math.exp(-dt * 3);
      drawVessel(c, X(i), TOP, BOT, WT, WB, water[i], GL_COLORS[i], "tap", shake[i], i === next ? pulse : 0, shake[i]);
      txt(c, freqToNote(SCALE[i], LANG).name + (i === 7 ? "'" : ""), X(i), BOT + 28, 17, COL.dark ? "#fde68a" : "#2a1a0c", "center", "700");
      txt(c, String(i + 1), X(i), TOP - 20, 13, COL["ink-soft"]);
      if (i === next) emoji(c, "👇", X(i), TOP - 4 + Math.sin(performance.now() / 150) * 4, 26);
    }
  }
  const api = { draw, refresh: texts, stop: () => { stopDemo(); document.removeEventListener("keydown", key); } };
  texts();
  return api;
}

/* --- Ecoul memoriei --- */
function memGame(box) {
  i18nEl("div", "brief", "mem.brief", box);
  const status = el("h3", "", "", box);
  const pads = el("div", "pads", "", box);
  const P = [["#ef4444", 0], ["#eab308", 2], ["#22c55e", 4], ["#3b82f6", 7]];
  const btns = P.map(([col, idx]) => {
    const b = el("button", "", freqToNote(SCALE[idx], LANG).name + (idx === 7 ? "'" : ""), pads);
    b.style.backgroundColor = col; b.style.color = "#fff"; b.disabled = true; return b;
  });
  const ctr = el("div", "controls", "", box);
  const bS = el("button", "btn", "", ctr);
  let seq = [], inp = 0, state = "idle", timers = [], best = 0;
  function texts() {
    bS.innerHTML = t("mem.start");
    btns.forEach((b, i) => { b.textContent = freqToNote(SCALE[P[i][1]], LANG).name + (P[i][1] === 7 ? "'" : ""); });
    status.textContent = state === "show" ? t("mem.watch") : state === "input" ? t("mem.your", { n: seq.length }) : best ? t("mem.lvl", { n: best }) : "";
  }
  function flash(i, ms = 320) {
    SND.glassTap(SCALE[P[i][1]], 0.5);
    btns[i].classList.add("lit"); setTimeout(() => btns[i].classList.remove("lit"), ms);
  }
  function show() {
    state = "show"; texts(); btns.forEach((b) => (b.disabled = true));
    const gap = Math.max(380, 650 - seq.length * 30);
    seq.forEach((v, j) => timers.push(setTimeout(() => flash(v, gap * 0.6), 600 + j * gap)));
    timers.push(setTimeout(() => { state = "input"; inp = 0; btns.forEach((b) => (b.disabled = false)); texts(); }, 600 + seq.length * gap));
  }
  function grow() { seq.push(Math.floor(Math.random() * 4)); show(); }
  btns.forEach((b, i) => b.addEventListener("click", () => {
    if (state !== "input") return;
    flash(i, 200);
    if (seq[inp] !== i) {
      state = "over"; btns.forEach((x) => (x.disabled = true)); setTimeout(() => SND.buzz(), 150);
      const n = seq.length - 1; best = n; texts();
      setTimeout(() => { if (gameObj === api) finish("mem", n >= 8 ? 3 : n >= 6 ? 2 : n >= 4 ? 1 : 0, t("ov.mem.t", { n })); }, 900);
      return;
    }
    inp++;
    if (inp === seq.length) { state = "wait"; best = seq.length; texts(); if (seq.length >= 12) { setTimeout(() => finish("mem", 3, t("ov.mem.t", { n: 12 })), 700); return; } timers.push(setTimeout(grow, 800)); }
  }));
  bS.addEventListener("click", () => { SND.init(); timers.forEach(clearTimeout); timers = []; seq = []; best = 0; grow(); });
  const api = { refresh: texts, stop: () => timers.forEach(clearTimeout) };
  texts();
  return api;
}

langHooks.push(() => {
  renderMissions();
  if (gameObj && gameObj.refresh) gameObj.refresh();
  if (!curGame) $("gameBox").innerHTML = "<p class='muted'>" + t("gm.pick") + "</p>";
});

/* =====================================================================
   12. QUIZ
   ===================================================================== */
function buildQuiz() {
  const Q = QUIZ[LANG]; const box = $("quizBox"); box.innerHTML = "";
  const answered = {}; let score = 0;
  $("vScore").textContent = "";
  Q.forEach((q, qi) => {
    const d = el("div", "q", "", box);
    el("p", "qt", (qi + 1) + ". " + q.q, d);
    const opts = el("div", "opts", "", d), fb = el("div", "fb", "", d);
    q.o.forEach((o, oi) => {
      const b = el("button", "", o, opts);
      b.addEventListener("click", () => {
        if (answered[qi] !== undefined) return;
        answered[qi] = oi;
        b.classList.add(oi === q.a ? "ok" : "no");
        if (oi !== q.a) opts.children[q.a].classList.add("ok");
        if (oi === q.a) { score++; SND.note(1046.5, 0.15, 0.2, "sine"); } else SND.buzz();
        fb.textContent = q.f;
        const all = Object.keys(answered).length === Q.length;
        $("vScore").textContent = t("quiz.score", { a: score, b: Q.length }) + (all && score === Q.length ? " — " + t("quiz.perfect") : "");
        if (all && score === Q.length) SND.tada();
      });
    });
  });
}
$("btnQuizReset").addEventListener("click", buildQuiz);
langHooks.push(buildQuiz);

/* =====================================================================
   TABURI + BUCLA DE DESEN
   ===================================================================== */
const TABS = [["tab-what", "p-what"], ["tab-shop", "p-shop"], ["tab-wave", "p-wave"], ["tab-game", "p-game"], ["tab-quiz", "p-quiz"]];
TABS.forEach(([tb, p]) => $(tb).addEventListener("click", () => {
  TABS.forEach(([tb2, p2]) => { $(tb2).setAttribute("aria-selected", tb2 === tb); $(p2).classList.toggle("hidden", p2 !== p); });
  // oprește ce sună în alte taburi
  if (p !== "p-what") { JAR.stop(); DIST.stop(); }
  if (p !== "p-wave") { SCOPE.stop(); MIC.stop(); }
  STORE.tab = tb; saveStore();
}));

const MODS = [RICE, TRAVEL, JAR, DIST, GLASS, BAND, DRUMB, SCOPE, MIC];
let lastT = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  MODS.forEach((m) => {
    if ($(m.panel).classList.contains("hidden")) return;
    if (m.sub && $(m.sub).classList.contains("hidden")) return;
    m.draw(dt);
  });
  if (!$("p-game").classList.contains("hidden") && gameObj && gameObj.draw) gameObj.draw(dt);
  requestAnimationFrame(loop);
}

/* pornire */
readColors();
setLang(LANG);
if (STORE.tab && $(STORE.tab)) $(STORE.tab).click();
requestAnimationFrame(loop);

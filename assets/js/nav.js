/* ===========================================================
   Studioul de sunete — Misiunile de navigare cu sonarul
   5 trasee în întuneric; vezi doar ecourile ping-urilor.
   Limite de timp: 1, 1½, 2, 3 și 4 minute.
   =========================================================== */
"use strict";

const NAV = (() => {
  const k = setupCanvas($("cvNav"));
  const W = k.W, H = k.H;
  const PXM = 2;            // 1 pixel = 2 metri
  const V = 800;            // viteza ping-ului pe ecran (px/s)
  const RANGE = 560;        // raza sonarului (px)
  const LV = [
    { len: 1700, g0: 285, g1: 245, amp: 40,  rocks: 4,  mids: 0, fade: 12,  light: 165, time: 60,  whales: 0, cur: 0 },
    { len: 2800, g0: 250, g1: 205, amp: 70,  rocks: 9,  mids: 0, fade: 10,  light: 115, time: 90,  whales: 0, cur: 0 },
    { len: 3800, g0: 230, g1: 185, amp: 85,  rocks: 12, mids: 2, fade: 8,   light: 80,  time: 120, whales: 2, cur: 0 },
    { len: 5200, g0: 215, g1: 165, amp: 100, rocks: 20, mids: 5, fade: 6.5, light: 50,  time: 180, whales: 2, cur: 0 },
    { len: 7000, g0: 195, g1: 152, amp: 110, rocks: 26, mids: 6, fade: 5.5, light: 0,   time: 240, whales: 3, cur: 1 }
  ];
  STORE.nav = STORE.nav || {};
  let L = 0, cfg = LV[0], tops = [], bots = [], rocks = [], whales = [];
  let sub, state = "ready", elapsed = 0, lives = 3, inv = 0, pings = 0, pingCd = 0, blips = [], pending = [], waves = [], clock = 0, msgKey = null, msgVars = null, msgCls = "";
  const keys = { up: false, down: false, left: false, right: false };
  const snow = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.6 + 0.4 }));

  /* ---------- traseul ---------- */
  const ti = (x) => clamp(Math.floor(x / 10), 0, tops.length - 2);
  function wall(arr, x) { const i = ti(x), f = (x - i * 10) / 10; return lerp(arr[i], arr[i + 1], clamp(f, 0, 1)); }
  const top = (x) => wall(tops, x), bot = (x) => wall(bots, x);
  function build(n) {
    L = n; cfg = LV[n];
    const r = seeded(101 + n * 37), ph1 = r() * 6, ph2 = r() * 6;
    tops = []; bots = [];
    let nt = 0, nb = 0;
    for (let x = 0; x <= cfg.len + 20; x += 10) {
      const ramp = clamp(x / 400, 0, 1) * clamp((cfg.len - x) / 400, 0, 1);
      let gap = lerp(cfg.g0, cfg.g1, x / cfg.len);
      if (x < 220 || x > cfg.len - 280) gap = Math.max(gap, 270);
      let mid = H / 2 + cfg.amp * ramp * (0.65 * Math.sin(x / 260 + ph1) + 0.35 * Math.sin(x / 97 + ph2));
      mid = clamp(mid, 18 + gap / 2, H - 14 - gap / 2);
      nt = nt * 0.7 + (r() - 0.5) * 9; nb = nb * 0.7 + (r() - 0.5) * 9;
      tops.push(mid - gap / 2 + nt); bots.push(mid + gap / 2 + nb);
    }
    rocks = [];
    const span = cfg.len - 800;
    for (let i = 0; i < cfg.rocks; i++) {
      const x = 380 + (i + 0.5) * span / cfg.rocks + (r() - 0.5) * 60;
      const g = bot(x) - top(x), rad = g * (0.22 + r() * 0.12), up = (i + (r() < 0.25 ? 1 : 0)) % 2 === 0;
      rocks.push({ x, y: up ? top(x) + rad * 0.35 : bot(x) - rad * 0.35, r: rad, seed: r() * 1000 });
    }
    for (let i = 0; i < cfg.mids; i++) {
      let x, tries = 0;
      do { x = 500 + r() * (cfg.len - 1000); tries++; } while (tries < 30 && rocks.some((q) => Math.abs(q.x - x) < 170));
      const g = bot(x) - top(x);
      rocks.push({ x, y: (top(x) + bot(x)) / 2 + (r() - 0.5) * g * 0.15, r: g * 0.13, seed: r() * 1000 });
    }
    ensurePassable();
    whales = [];
    for (let i = 0; i < cfg.whales; i++) {
      const x = cfg.len * (0.3 + 0.55 * (i + 0.5) / cfg.whales);
      whales.push({ x, ph: r() * 6, w: 0.5 + r() * 0.3 });
    }
    reset();
  }
  /* garanția: submarinul (cu loc de rezervă în jur) încape de la start până în port */
  const HULL_M = [[50, 0], [-50, 0], [0, -17], [0, 17], [28, -15], [28, 15], [-28, -15], [-28, 15], [6, -25]];
  function fits(x, y) { return !HULL_M.some(([a, b]) => { const X = x + a, Y = y + b; if (X < 0 || X > cfg.len || Y < top(X) || Y > bot(X)) return true; for (const q of rocks) { const dx = X - q.x, dy = Y - q.y; if (dx * dx + dy * dy < q.r * q.r) return true; } return false; }); }
  function frontier() {
    const S = 8, cols = Math.floor(cfg.len / S), rows = Math.floor(H / S), seen = new Uint8Array(cols * rows);
    const sx = Math.round(90 / S); let ys = [];
    for (let r = 0; r < rows; r++) if (fits(sx * S, r * S)) ys.push(r);
    if (!ys.length) return 0;
    const q = [[sx, ys[ys.length >> 1]]]; seen[q[0][1] * cols + sx] = 1; let maxX = 0;
    for (let h = 0; h < q.length; h++) {
      const [x, y] = q[h]; if (x > maxX) maxX = x;
      if (x * S >= cfg.len - 140) return -1;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const id = ny * cols + nx; if (seen[id]) continue; seen[id] = 1; if (fits(nx * S, ny * S)) q.push([nx, ny]);
      }
    }
    return maxX * S;
  }
  function ensurePassable() {
    for (let it = 0; it < 60; it++) {
      const fx = frontier(); if (fx < 0) return;
      const near = rocks.filter((q) => Math.abs(q.x - fx) < q.r + 140);
      if (!near.length) { rocks.forEach((q) => (q.r *= 0.9)); continue; }
      near.forEach((q) => (q.r *= 0.85));
    }
  }
  function whalePos(w, tt) {
    const m = (top(w.x) + bot(w.x)) / 2, a = (bot(w.x) - top(w.x)) / 2 - 34;
    return { x: w.x + Math.sin(tt * 0.3 + w.ph) * 40, y: m + a * Math.sin(tt * w.w + w.ph) };
  }
  function solid(x, y, tt) {
    if (x < 0 || x > cfg.len) return true;
    if (y < top(x) || y > bot(x)) return true;
    for (const q of rocks) { const dx = x - q.x, dy = y - q.y; if (dx * dx + dy * dy < q.r * q.r) return true; }
    for (const w of whales) { const p = whalePos(w, tt), dx = (x - p.x) / 42, dy = (y - p.y) / 14; if (dx * dx + dy * dy < 1) return true; }
    return false;
  }

  /* ---------- stare ---------- */
  function reset() {
    sub = { x: 90, y: (top(90) + bot(90)) / 2, vx: 0, vy: 0, f: 1 };
    state = "ready"; elapsed = 0; lives = 3; inv = 0; pings = 0; pingCd = 0; blips = []; pending = []; waves = [];
    $("nvNext").classList.add("hidden");
    say("nv.start", { name: t("nv.l" + (L + 1)), m: fmtMin(cfg.time), tip: t("nv.tip" + (L + 1)) }, "");
    renderRoutes(); hud(true);
  }
  function say(key, vars, cls) { msgKey = key; msgVars = vars; msgCls = cls; sayEl("sayNav", t(key, vars), cls); }
  const fmtMin = (s) => (s % 60 ? (LANG === "ro" ? fmt(s / 60, 1) : fmt(s / 60, 1)) : String(s / 60)) + " min";
  const mmss = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  let lastHud = "";
  function hud(force) {
    const left = cfg.time - elapsed, dist = Math.max(0, Math.round((cfg.len - 140 - sub.x) * PXM));
    const h = [mmss(left), lives, pings, dist].join("|");
    if (h === lastHud && !force) return; lastHud = h;
    $("nvTime").textContent = mmss(left);
    $("nvTimeBar").style.width = clamp(left / cfg.time * 100, 0, 100) + "%";
    $("nvTimeBar").style.background = left / cfg.time < 0.2 ? "var(--bad)" : left / cfg.time < 0.45 ? "var(--warm)" : "var(--good)";
    $("nvLives").textContent = "♥".repeat(lives) + "♡".repeat(3 - lives);
    $("nvPings").textContent = pings;
    $("nvDist").textContent = fmt(dist) + " m";
  }
  function renderRoutes() {
    const box = $("navRoutes"); box.innerHTML = "";
    LV.forEach((lv, i) => {
      const b = document.createElement("button");
      b.setAttribute("aria-pressed", i === L);
      const st = STORE.nav[i] || 0;
      b.innerHTML = "<span class='rn'>" + t("nv.route", { n: i + 1 }) + "</span><span class='rt'>" + t("nv.l" + (i + 1)) + "</span>" +
        "<span class='rm'><span>⏱ " + fmtMin(lv.time) + "</span><span>" + "⭐".repeat(st) + "☆".repeat(3 - st) + "</span></span>";
      b.addEventListener("click", () => { build(i); k.cv.focus({ preventScroll: true }); });
      box.appendChild(b);
    });
  }

  /* ---------- sonarul ---------- */
  function ping() {
    if (state === "win" || state === "fail" || pingCd > 0) return;
    if (state === "ready") start();
    SND.init(); SNDX.ping(0.3); pings++; pingCd = 0.7;
    const sx = sub.x + sub.f * 40, sy = sub.y;
    waves.push({ x: sx, y: sy, t0: clock });
    const near = rocks.filter((q) => Math.abs(q.x - sx) < RANGE + q.r);
    const saved = rocks; rocks = near;
    for (let a = 0; a < 150; a++) {
      const ang = a / 150 * Math.PI * 2, cx = Math.cos(ang), cy = Math.sin(ang);
      for (let d = 12; d < RANGE; d += 5) {
        const x = sx + cx * d, y = sy + cy * d;
        if (solid(x, y, clock)) { pending.push({ x, y, at: clock + 2 * d / V, d }); break; }
      }
    }
    rocks = saved;
    pending.sort((p, q) => p.at - q.at);
  }
  function start() { state = "run"; say("nv.go", null, ""); }
  function hit() {
    lives--; inv = 1.6; SND.drum(70, 0.7, 0.35); SND.buzz();
    if (lives <= 0) { state = "fail"; say("nv.wreck", null, "warn"); }
    else say(lives === 1 ? "nv.hit1" : "nv.hit", { n: lives }, "warn");
  }
  function win() {
    state = "win";
    const frac = (cfg.time - elapsed) / cfg.time, st = frac > 0.5 ? 3 : frac > 0.25 ? 2 : 1;
    if (st > (STORE.nav[L] || 0)) { STORE.nav[L] = st; saveStore(); }
    SND.tada();
    say(L === 4 ? "nv.winLast" : "nv.win", { t: mmss(elapsed), p: pings }, "good");
    if (L === 4) sayEl("sayNav", t("nv.win", { t: mmss(elapsed), p: pings }) + "<br>" + t("nv.winLast"), "good");
    if (L < 4) $("nvNext").classList.remove("hidden");
    renderRoutes(); lastStars = st;
  }
  let lastStars = 0;

  /* ---------- comenzi ---------- */
  document.querySelectorAll("[data-nv]").forEach((b) => {
    const d = b.dataset.nv;
    const on = (e) => { e.preventDefault(); keys[d] = true; b.classList.add("on"); if (state === "ready") start(); SND.init(); };
    const off = () => { keys[d] = false; b.classList.remove("on"); };
    b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
  });
  $("nvPing").addEventListener("click", ping);
  $("nvRestart").addEventListener("click", () => { reset(); k.cv.focus({ preventScroll: true }); });
  $("nvNext").addEventListener("click", () => { build(Math.min(4, L + 1)); k.cv.focus({ preventScroll: true }); });
  k.cv.addEventListener("pointerdown", () => { k.cv.focus({ preventScroll: true }); ping(); });
  const KMAP = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
  function navInView() {
    if ($("p-work").classList.contains("hidden")) return false;
    const r = k.cv.getBoundingClientRect();
    return r.bottom > 60 && r.top < window.innerHeight - 60;
  }
  document.addEventListener("keydown", (e) => {
    if (!navInView() || e.target.tagName === "INPUT") return;
    if (KMAP[e.key]) { keys[KMAP[e.key]] = true; e.preventDefault(); if (state === "ready") start(); SND.init(); }
    else if (e.key === " ") { e.preventDefault(); if (!e.repeat) ping(); }
  });
  document.addEventListener("keyup", (e) => { if (KMAP[e.key]) keys[KMAP[e.key]] = false; });
  window.addEventListener("blur", () => Object.keys(keys).forEach((q) => (keys[q] = false)));

  /* ---------- simulare ---------- */
  function step(dt) {
    clock += dt; pingCd = Math.max(0, pingCd - dt); inv = Math.max(0, inv - dt);
    while (pending.length && pending[0].at <= clock) { const p = pending.shift(); blips.push({ x: p.x, y: p.y, born: clock }); }
    blips = blips.filter((b) => clock - b.born < cfg.fade);
    if (state !== "run") { sub.vx *= Math.exp(-dt * 3); sub.vy *= Math.exp(-dt * 3); return; }
    elapsed += dt;
    if (elapsed >= cfg.time) { elapsed = cfg.time; state = "fail"; SND.buzz(); say("nv.timeout", null, "warn"); return; }
    const A = 170;
    sub.vx += ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * A * dt;
    sub.vy += ((keys.down ? 1 : 0) - (keys.up ? 1 : 0)) * A * dt;
    if (cfg.cur) sub.vy += 42 * Math.sin(sub.x / 420 + clock * 0.25) * dt;
    const drag = Math.exp(-dt * 1.3); sub.vx *= drag; sub.vy *= drag;
    const sp = Math.hypot(sub.vx, sub.vy); if (sp > 100) { sub.vx *= 100 / sp; sub.vy *= 100 / sp; }
    if (Math.abs(sub.vx) > 6) sub.f = sub.vx > 0 ? 1 : -1;
    const ox = sub.x, oy = sub.y;
    sub.x += sub.vx * dt; sub.y += sub.vy * dt;
    const f = sub.f, pts = [[40 * f, 0], [-40 * f, 0], [0, -8], [0, 8], [22 * f, -7], [22 * f, 7], [-22 * f, -7], [-22 * f, 7], [6 * f, -16]];
    if (pts.some(([px, py]) => solid(sub.x + px, sub.y + py, clock))) {
      sub.x = ox; sub.y = oy; sub.vx *= -0.5; sub.vy *= -0.5;
      if (inv <= 0) hit();
    }
    if (sub.x >= cfg.len - 140) win();
  }

  /* ---------- desen ---------- */
  function rockFill(c, x0, y0, x1, y1) {
    return lg(c, 0, y0, 0, y1, [[0, "#3b342c"], [0.5, "#5a5045"], [1, "#2b2620"]]);
  }
  function drawWorld(c, cam) {
    const x0 = Math.max(0, cam - 20), x1 = Math.min(cfg.len, cam + W + 20);
    c.save(); c.translate(-cam, 0);
    // tavanul și fundul canionului
    c.fillStyle = lg(c, 0, 0, 0, H, [[0, "#4a4034"], [0.5, "#6b5d4c"], [1, "#3a3128"]]);
    c.beginPath(); c.moveTo(x0, 0); for (let x = x0; x <= x1; x += 10) c.lineTo(x, top(x)); c.lineTo(x1, 0); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x0, H); for (let x = x0; x <= x1; x += 10) c.lineTo(x, bot(x)); c.lineTo(x1, H); c.closePath(); c.fill();
    c.strokeStyle = "rgba(255,240,210,.25)"; c.lineWidth = 2;
    c.beginPath(); for (let x = x0; x <= x1; x += 10) x === x0 ? c.moveTo(x, top(x)) : c.lineTo(x, top(x)); c.stroke();
    c.beginPath(); for (let x = x0; x <= x1; x += 10) x === x0 ? c.moveTo(x, bot(x)) : c.lineTo(x, bot(x)); c.stroke();
    // stâncile
    rocks.forEach((q) => {
      if (q.x + q.r < x0 || q.x - q.r > x1) return;
      const rr0 = seeded(Math.floor(q.seed) + 1);
      c.fillStyle = rg(c, q.x - q.r * 0.35, q.y - q.r * 0.4, 2, q.x, q.y, q.r * 1.1, [[0, "#8a7c69"], [0.6, "#56493b"], [1, "#2a231c"]]);
      c.beginPath();
      for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 2, rad = q.r * (0.88 + rr0() * 0.2); i ? c.lineTo(q.x + Math.cos(a) * rad, q.y + Math.sin(a) * rad) : c.moveTo(q.x + Math.cos(a) * rad, q.y + Math.sin(a) * rad); }
      c.closePath(); c.fill();
    });
    whales.forEach((w) => { const p = whalePos(w, clock); if (p.x > x0 - 60 && p.x < x1 + 60) ART.whale(c, p.x, p.y, 92); });
    c.restore();
  }
  function drawPort(c, cam) {
    const px = cfg.len - 110 - cam;
    if (px > W + 80) return;
    const tY = top(cfg.len - 110), bY = bot(cfg.len - 110);
    c.fillStyle = CHROME(c, px - 8, 0, px + 8, 0); c.fillRect(px - 6, tY, 12, bY - tY); c.fillRect(px + 54, tY, 12, bY - tY);
    c.fillStyle = "rgba(100,116,139,.6)"; for (let y = tY + 20; y < bY; y += 36) c.fillRect(px + 6, y, 48, 5);
    const blink = 0.5 + 0.5 * Math.sin(clock * 5);
    [[px, tY + 12], [px + 60, tY + 12], [px, bY - 12], [px + 60, bY - 12]].forEach(([x, y]) => {
      c.fillStyle = rg(c, x, y, 0, x, y, 22, [[0, "rgba(134,239,172," + (0.5 + blink * 0.5) + ")"], [1, "rgba(34,197,94,0)"]]);
      c.beginPath(); c.arc(x, y, 22, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#bbf7d0"; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill();
    });
    txt(c, t("nv.port"), px + 30, (tY + bY) / 2, 15, "#86efac", "center", "800");
  }
  function draw(dt) {
    step(dt);
    hud(false);
    const c = k.c, cam = clamp(sub.x - 320, 0, cfg.len - W);
    // apa întunecată
    c.fillStyle = lg(c, 0, 0, 0, H, [[0, "#04192b"], [1, "#010810"]]); c.fillRect(0, 0, W, H);
    // particule care plutesc (se mișcă și cu curentul)
    c.fillStyle = "rgba(200,220,255,.25)";
    snow.forEach((p) => {
      p.y += (6 + (cfg.cur ? 30 * Math.sin((p.x + cam) / 420 + clock * 0.25) : 0)) * dt * p.s; p.x -= dt * 4;
      if (p.y > H) p.y -= H; if (p.y < 0) p.y += H; if (p.x < 0) p.x += W;
      c.fillRect((p.x - cam * 0.15 % W + W) % W, p.y, p.s * 1.3, p.s * 1.3);
    });
    // ce luminează farul
    const sx = sub.x - cam, sy = sub.y;
    if (cfg.light > 0) {
      c.save();
      c.beginPath();
      const Lr = cfg.light * 1.7, a = 0.5, f = sub.f;
      c.moveTo(sx + 40 * f, sy);
      c.arc(sx + 40 * f, sy, Lr, f > 0 ? -a : Math.PI - a, f > 0 ? a : Math.PI + a);
      c.closePath();
      c.moveTo(sx + cfg.light * 0.45, sy); c.arc(sx, sy, cfg.light * 0.45, 0, Math.PI * 2);
      c.clip();
      drawWorld(c, cam);
      c.fillStyle = rg(c, sx + 40 * f, sy, 5, sx + 40 * f, sy, Lr, [[0, "rgba(255,240,180,.22)"], [1, "rgba(255,240,180,0)"]]);
      c.fillRect(0, 0, W, H);
      c.restore();
    }
    drawPort(c, cam);
    // undele ping-ului
    waves = waves.filter((w) => (clock - w.t0) * V < RANGE * 2.1);
    waves.forEach((w) => {
      const r = (clock - w.t0) * V;
      if (r < RANGE) { c.strokeStyle = "rgba(125,211,252," + (0.7 * (1 - r / RANGE)) + ")"; c.lineWidth = 2.5; c.beginPath(); c.arc(w.x - cam, w.y, r, 0, Math.PI * 2); c.stroke(); }
    });
    // ecourile (punctele verzi)
    c.save(); c.shadowColor = "#4ade80"; c.shadowBlur = 8;
    blips.forEach((b) => {
      const a = 1 - (clock - b.born) / cfg.fade;
      c.fillStyle = "rgba(134,239,172," + Math.max(0, a).toFixed(3) + ")";
      c.fillRect(b.x - cam - 2, b.y - 2, 4.5, 4.5);
    });
    c.restore();
    // submarinul
    c.save(); if (inv > 0 && Math.floor(inv * 10) % 2) c.globalAlpha = 0.35;
    ART.sub(c, sx, sy, 90, sub.f, "#6b7c3a");
    if (cfg.light > 0) { c.fillStyle = "#fde68a"; c.beginPath(); c.arc(sx + 44 * sub.f, sy, 3, 0, Math.PI * 2); c.fill(); }
    c.restore();
    // săgeata spre port, dacă portul nu se vede
    if (cfg.len - 110 - cam > W) {
      const yy = (top(cfg.len - 110) + bot(cfg.len - 110)) / 2, bl = 0.6 + 0.4 * Math.sin(clock * 5);
      c.fillStyle = "rgba(134,239,172," + bl + ")"; c.beginPath(); c.moveTo(W - 10, yy); c.lineTo(W - 28, yy - 12); c.lineTo(W - 28, yy + 12); c.closePath(); c.fill();
      txt(c, t("nv.port"), W - 34, yy, 12, "#86efac", "right", "800");
    }
    // bara de progres
    c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(20, 10, W - 40, 6);
    c.fillStyle = "#86efac"; c.fillRect(20, 10, (W - 40) * clamp(sub.x / (cfg.len - 140), 0, 1), 6);
    txt(c, t("nv.route", { n: L + 1 }) + " · " + t("nv.l" + (L + 1)), 22, 30, 13, "rgba(226,232,240,.8)", "left", "700");
    // mesajele de pe ecran
    if (state === "ready") {
      c.fillStyle = "rgba(2,8,16,.65)"; rr(c, W / 2 - 230, H / 2 - 40, 460, 80, 14); c.fill();
      txt(c, LANG === "ro" ? "← ↑ ↓ → pornește · spațiu = ping" : "← ↑ ↓ → to start · space = ping", W / 2, H / 2, 20, "#e2e8f0", "center", "700");
    } else if (state === "win" || state === "fail") {
      c.fillStyle = "rgba(2,8,16,.7)"; rr(c, W / 2 - 220, H / 2 - 55, 440, 110, 16); c.fill();
      txt(c, state === "win" ? (LANG === "ro" ? "Ai ajuns în port!" : "You made it!") : (LANG === "ro" ? "Mai încearcă!" : "Try again!"), W / 2, H / 2 - 18, 26, state === "win" ? "#86efac" : "#fca5a5", "center", "800");
      if (state === "win") txt(c, "⭐".repeat(lastStars) + "☆".repeat(3 - lastStars), W / 2, H / 2 + 24, 26, "#fde68a");
      else txt(c, "↺", W / 2, H / 2 + 24, 26, "#e2e8f0");
    }
  }
  langHooks.push(() => { renderRoutes(); if (msgKey) { sayEl("sayNav", t(msgKey, msgVars), msgCls); if (state === "win" && L === 4) sayEl("sayNav", t("nv.win", { t: mmss(elapsed), p: pings }) + "<br>" + t("nv.winLast"), "good"); } hud(true); });
  build(0);
  return { draw, panel: "p-work", stop: () => Object.keys(keys).forEach((q) => (keys[q] = false)) };
})();

MODS.push(NAV);
applyI18n($("p-work"));
(() => { const prev = window.WORK_STOP; window.WORK_STOP = () => { if (prev) prev(); NAV.stop(); }; })();

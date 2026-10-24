/* ===========================================================
   Studioul de sunete — „Sunetul la lucru”
   Ecograful, stetoscopul, litotriția, sonarul, LRAD,
   creveta-pistol și rigla decibelilor.
   =========================================================== */
"use strict";

/* ---------- sunete în plus ---------- */
const SNDX = {
  heart(vol = 0.7) { SND.drum(52, vol, 0.22); setTimeout(() => SND.drum(68, vol * 0.7, 0.16), 300); },
  shock() { SND.drum(42, 0.9, 0.5); },
  ping(v = 0.35) { SND.glassTap(1480, v); },
  snap() {
    if (!SND.init()) return;
    const ctx = SND.ctx, t = ctx.currentTime + 0.005;
    const len = Math.floor(ctx.sampleRate * 0.12), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = b; hp.type = "highpass"; hp.frequency.value = 1800; g.gain.value = 0.7;
    s.connect(hp); hp.connect(g); g.connect(SND.gainNode(1)); s.start(t);
    SND.drum(90, 0.4, 0.12);
  },
  warn() { [880, 660, 880, 660].forEach((f, i) => SND.note(f, 0.22, 0.12, "square", null, i * 0.24)); }
};

/* ---------- desene în plus (realiste) ---------- */
ART.probe = function (c, x, y, ang) {
  c.save(); c.translate(x, y); c.rotate(ang);
  // cablul
  c.strokeStyle = "#374151"; c.lineWidth = 5; c.lineCap = "round";
  c.beginPath(); c.moveTo(0, -78); c.bezierCurveTo(0, -120, 40, -130, 60, -170); c.stroke(); c.lineCap = "butt";
  // corpul sondei
  c.fillStyle = lg(c, -18, 0, 18, 0, [[0, "#9aa3ad"], [0.3, "#f8fafc"], [0.6, "#e2e8f0"], [1, "#7b8794"]]);
  c.beginPath(); c.moveTo(-11, -80); c.lineTo(11, -80); c.lineTo(14, -30); c.quadraticCurveTo(22, -14, 20, -4); c.lineTo(-20, -4); c.quadraticCurveTo(-22, -14, -14, -30); c.closePath(); c.fill();
  c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 1; c.stroke();
  c.fillStyle = "#1f2937"; c.fillRect(-20, -6, 40, 7);
  c.fillStyle = "#2563eb"; c.fillRect(-9, -55, 18, 4);
  // gelul
  c.fillStyle = "rgba(150,210,255,.55)"; c.beginPath(); c.ellipse(0, 3, 26, 6, 0, 0, Math.PI * 2); c.fill();
  c.restore();
};

ART.stethoscope = function (c, px, py, beat) {
  const tube = (pts, w) => {
    const draw = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); c.stroke(); };
    c.lineCap = "round"; c.strokeStyle = "#0f172a"; c.lineWidth = w + 3; draw();
    c.strokeStyle = "#1e293b"; c.lineWidth = w; draw();
    c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 2; c.save(); c.translate(-1, -2); draw(); c.restore(); c.lineCap = "butt";
  };
  tube([[px, py - 20], [px + 40, py - 120], [400, 150], [430, 90]], 9);
  // urechile (tuburi metalice)
  c.strokeStyle = CHROME(c, 420, 0, 470, 0); c.lineWidth = 6; c.lineCap = "round";
  c.beginPath(); c.moveTo(430, 90); c.quadraticCurveTo(410, 40, 440, 18); c.stroke();
  c.beginPath(); c.moveTo(430, 90); c.quadraticCurveTo(470, 40, 455, 16); c.stroke(); c.lineCap = "butt";
  c.fillStyle = "#111827"; c.beginPath(); c.arc(440, 16, 7, 0, Math.PI * 2); c.arc(455, 14, 7, 0, Math.PI * 2); c.fill();
  // capsula de pe piept
  const s = 1 + beat * 0.03;
  c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(px + 4, py + 6, 40 * s, 40 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = CHROME(c, px - 40, py - 40, px + 40, py + 40); c.beginPath(); c.arc(px, py, 38 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = rg(c, px - 10, py - 12, 2, px, py, 30, [[0, "#f8fafc"], [0.6, "#cbd5e1"], [1, "#64748b"]]); c.beginPath(); c.arc(px, py, 29 * s, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(0,0,0,.2)"; c.lineWidth = 1; c.beginPath(); c.arc(px, py, 22 * s, 0, Math.PI * 2); c.stroke();
  c.fillStyle = CHROME(c, px - 8, 0, px + 8, 0); c.fillRect(px - 6, py - 52, 12, 20);
};

ART.heart = function (c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // vasele mari
  c.lineCap = "round";
  c.strokeStyle = lg(c, -30, -80, 30, -80, [[0, "#8b1a1a"], [0.5, "#e05656"], [1, "#7a1414"]]); c.lineWidth = 22;
  c.beginPath(); c.moveTo(-6, -40); c.bezierCurveTo(-6, -95, 55, -95, 52, -40); c.stroke();
  c.strokeStyle = lg(c, -50, 0, -20, 0, [[0, "#1e3a8a"], [0.5, "#4f7bd8"], [1, "#1e3a8a"]]); c.lineWidth = 18;
  c.beginPath(); c.moveTo(-34, -30); c.lineTo(-38, -88); c.stroke();
  c.strokeStyle = lg(c, 10, 0, 40, 0, [[0, "#1d4ed8"], [0.5, "#60a5fa"], [1, "#1d4ed8"]]); c.lineWidth = 16;
  c.beginPath(); c.moveTo(18, -30); c.bezierCurveTo(22, -62, 0, -70, -8, -78); c.stroke();
  c.lineCap = "butt";
  // corpul inimii
  c.fillStyle = rg(c, -18, -18, 6, 0, 10, 85, [[0, "#f28b82"], [0.35, "#d63c3c"], [0.8, "#9b1c1c"], [1, "#6b1010"]]);
  c.beginPath(); c.moveTo(-10, -40);
  c.bezierCurveTo(-70, -55, -78, 10, -40, 45); c.bezierCurveTo(-20, 65, 5, 85, 18, 95);
  c.bezierCurveTo(40, 60, 70, 30, 62, -8); c.bezierCurveTo(56, -45, 20, -48, -10, -40); c.closePath(); c.fill();
  // grăsimea și vasele de pe suprafață
  c.strokeStyle = "rgba(250,220,150,.55)"; c.lineWidth = 3;
  c.beginPath(); c.moveTo(8, -36); c.bezierCurveTo(4, 0, 10, 40, 18, 90); c.stroke();
  c.strokeStyle = "rgba(120,20,20,.6)"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(10, -10); c.bezierCurveTo(30, 0, 40, 20, 45, 35); c.stroke();
  c.fillStyle = "rgba(255,255,255,.25)"; c.beginPath(); c.ellipse(-32, -14, 12, 22, -0.5, 0, Math.PI * 2); c.fill();
  c.restore();
};

ART.kidney = function (c, x, y, rx, ry) {
  c.save(); c.translate(x, y);
  c.fillStyle = rg(c, -rx * 0.3, -ry * 0.4, 4, 0, 0, rx, [[0, "#c8705a"], [0.6, "#9a3f2e"], [1, "#6b2318"]]);
  c.beginPath(); c.moveTo(0, -ry);
  c.bezierCurveTo(rx * 1.2, -ry, rx * 1.2, ry, 0, ry);
  c.bezierCurveTo(-rx * 0.9, ry, -rx * 1.1, ry * 0.2, -rx * 0.55, 0);
  c.bezierCurveTo(-rx * 1.1, -ry * 0.2, -rx * 0.9, -ry, 0, -ry); c.closePath(); c.fill();
  // bazinetul (partea din mijloc, mai deschisă)
  c.fillStyle = rg(c, -rx * 0.35, 0, 2, -rx * 0.2, 0, rx * 0.5, [[0, "#f3c6a5"], [1, "rgba(220,150,120,.2)"]]);
  c.beginPath(); c.ellipse(-rx * 0.15, 0, rx * 0.45, ry * 0.35, 0, 0, Math.PI * 2); c.fill();
  // piramidele
  c.fillStyle = "rgba(90,20,15,.45)";
  for (let i = 0; i < 5; i++) { const a = -1.15 + i * 0.58; c.beginPath(); c.moveTo(Math.cos(a) * rx * 0.25, Math.sin(a) * ry * 0.3); c.lineTo(Math.cos(a - 0.2) * rx * 0.62, Math.sin(a - 0.2) * ry * 0.66); c.lineTo(Math.cos(a + 0.2) * rx * 0.62, Math.sin(a + 0.2) * ry * 0.66); c.closePath(); c.fill(); }
  c.fillStyle = "rgba(255,255,255,.18)"; c.beginPath(); c.ellipse(rx * 0.35, -ry * 0.5, rx * 0.25, ry * 0.15, 0.4, 0, Math.PI * 2); c.fill();
  c.restore();
};

ART.sub = function (c, x, y, L, dir, tint) {
  c.save(); c.translate(x, y); c.scale(dir, 1);
  const H = L * 0.17;
  c.fillStyle = lg(c, 0, -H / 2, 0, H / 2, [[0, shade(tint, 0.25)], [0.35, tint], [1, shade(tint, -0.55)]]);
  c.beginPath(); c.moveTo(-L / 2, 0); c.bezierCurveTo(-L / 2, -H * 0.6, -L * 0.35, -H / 2, -L * 0.2, -H / 2);
  c.lineTo(L * 0.3, -H / 2); c.bezierCurveTo(L * 0.5, -H / 2, L * 0.52, -H * 0.1, L * 0.5, 0); c.bezierCurveTo(L * 0.52, H * 0.1, L * 0.5, H / 2, L * 0.3, H / 2);
  c.lineTo(-L * 0.2, H / 2); c.bezierCurveTo(-L * 0.35, H / 2, -L / 2, H * 0.6, -L / 2, 0); c.closePath(); c.fill();
  // turela
  c.fillStyle = lg(c, 0, -H * 1.3, 0, -H / 2, [[0, shade(tint, 0.15)], [1, shade(tint, -0.3)]]);
  c.beginPath(); c.moveTo(L * 0.05, -H / 2); c.lineTo(L * 0.09, -H * 1.35); c.lineTo(L * 0.22, -H * 1.35); c.lineTo(L * 0.25, -H / 2); c.closePath(); c.fill();
  c.strokeStyle = shade(tint, -0.3); c.lineWidth = 2; c.beginPath(); c.moveTo(L * 0.15, -H * 1.35); c.lineTo(L * 0.15, -H * 1.75); c.stroke();
  // cârma și elicea
  c.fillStyle = shade(tint, -0.35);
  c.beginPath(); c.moveTo(-L * 0.42, 0); c.lineTo(-L * 0.52, -H * 0.8); c.lineTo(-L * 0.47, 0); c.lineTo(-L * 0.52, H * 0.8); c.closePath(); c.fill();
  c.fillStyle = "#b08a3a"; c.beginPath(); c.ellipse(-L * 0.53, 0, 3, H * 0.45, 0, 0, Math.PI * 2); c.fill();
  // hublouri și reflexie
  c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(-L * 0.25, -H * 0.38, L * 0.55, 2);
  c.restore();
};

ART.whale = function (c, x, y, L) {
  c.save(); c.translate(x, y);
  c.fillStyle = lg(c, 0, -L * 0.15, 0, L * 0.15, [[0, "#5b7187"], [0.55, "#3c4f63"], [0.7, "#c9d3dc"], [1, "#9fb0bf"]]);
  c.beginPath(); c.moveTo(L * 0.5, 0);
  c.bezierCurveTo(L * 0.48, -L * 0.16, L * 0.1, -L * 0.17, -L * 0.25, -L * 0.07);
  c.bezierCurveTo(-L * 0.38, -L * 0.03, -L * 0.42, -L * 0.02, -L * 0.45, 0);
  c.bezierCurveTo(-L * 0.42, L * 0.03, -L * 0.3, L * 0.06, -L * 0.2, L * 0.08);
  c.bezierCurveTo(L * 0.1, L * 0.15, L * 0.45, L * 0.12, L * 0.5, 0); c.closePath(); c.fill();
  // coada
  c.fillStyle = "#43566a";
  c.beginPath(); c.moveTo(-L * 0.43, 0); c.quadraticCurveTo(-L * 0.55, -L * 0.14, -L * 0.62, -L * 0.12); c.quadraticCurveTo(-L * 0.54, -L * 0.03, -L * 0.5, 0);
  c.quadraticCurveTo(-L * 0.54, L * 0.03, -L * 0.62, L * 0.1); c.quadraticCurveTo(-L * 0.55, L * 0.12, -L * 0.43, 0); c.fill();
  // aripioara, ochiul, dungi
  c.fillStyle = "#3c4f63"; c.beginPath(); c.moveTo(L * 0.18, L * 0.08); c.quadraticCurveTo(L * 0.1, L * 0.25, L * 0.02, L * 0.26); c.quadraticCurveTo(L * 0.08, L * 0.15, L * 0.08, L * 0.09); c.fill();
  c.fillStyle = "#0f172a"; c.beginPath(); c.arc(L * 0.33, L * 0.02, 2.5, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(60,80,100,.5)"; c.lineWidth = 1;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(L * 0.42 - i * 8, L * 0.07); c.lineTo(L * 0.3 - i * 8, L * 0.12); c.stroke(); }
  c.restore();
};

ART.ship = function (c, x, y) {
  // coca
  c.fillStyle = lg(c, 0, y, 0, y + 60, [[0, "#1f2a44"], [0.6, "#16203a"], [0.61, "#9b1c1c"], [1, "#6b1010"]]);
  c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x + 330, y); c.lineTo(x + 300, y + 60); c.lineTo(x - 10, y + 60); c.closePath(); c.fill();
  c.fillStyle = "rgba(255,255,255,.85)"; c.fillRect(x - 10, y + 6, 330, 3);
  // containere
  const cols = ["#b45309", "#1d4ed8", "#15803d", "#b91c1c", "#6b7280"];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
    c.fillStyle = cols[(i * 2 + j) % 5]; c.fillRect(x + 80 + i * 30, y - 22 - j * 22, 28, 20);
    c.strokeStyle = "rgba(0,0,0,.3)"; c.lineWidth = 1; for (let k = 4; k < 28; k += 4) { c.beginPath(); c.moveTo(x + 80 + i * 30 + k, y - 22 - j * 22); c.lineTo(x + 80 + i * 30 + k, y - 2 - j * 22); c.stroke(); }
  }
  // suprastructura
  c.fillStyle = lg(c, x, 0, x + 60, 0, [[0, "#e5e7eb"], [0.5, "#ffffff"], [1, "#cbd5e1"]]); c.fillRect(x + 4, y - 70, 62, 70);
  c.fillStyle = "#1e293b"; for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) c.fillRect(x + 10 + k * 14, y - 62 + r * 18, 9, 8);
  c.fillStyle = "#334155"; c.fillRect(x + 20, y - 90, 8, 20);
};
ART.lrad = function (c, x, y, ang, on) {
  c.fillStyle = "#334155"; c.fillRect(x - 4, y, 8, 22);
  c.save(); c.translate(x, y); c.rotate(ang);
  c.fillStyle = lg(c, 0, -26, 0, 26, [[0, "#4b5563"], [0.5, "#1f2937"], [1, "#111827"]]);
  c.beginPath(); c.ellipse(0, 0, 9, 26, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = on ? "#f59e0b" : "#6b7280"; c.beginPath(); c.ellipse(4, 0, 4, 22, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 0.8; for (let k = -18; k <= 18; k += 6) { c.beginPath(); c.moveTo(1, k); c.lineTo(7, k); c.stroke(); }
  c.restore();
};
ART.skiff = function (c, x, y, dir, cover, rock) {
  c.save(); c.translate(x, y); c.rotate(rock); c.scale(dir, 1);
  c.fillStyle = lg(c, 0, -8, 0, 14, [[0, "#d1d5db"], [1, "#6b7280"]]);
  c.beginPath(); c.moveTo(-50, -6); c.lineTo(46, -6); c.quadraticCurveTo(60, -8, 64, -14); c.lineTo(52, 10); c.lineTo(-44, 10); c.closePath(); c.fill();
  c.fillStyle = "#1e3a8a"; c.fillRect(-50, -6, 100, 4);
  c.fillStyle = "#111827"; c.fillRect(-58, -16, 10, 18);
  // trei siluete
  [-20, 6, 30].forEach((px, i) => {
    c.fillStyle = "#1f2937";
    c.fillRect(px - 5, -26, 10, 20);
    c.beginPath(); c.arc(px, -31, 6, 0, Math.PI * 2); c.fill();
    if (cover) { c.fillRect(px - 9, -36, 4, 8); c.fillRect(px + 5, -36, 4, 8); }
  });
  c.restore();
};

ART.shrimp = function (c, x, y, claw) {
  c.save(); c.translate(x, y);
  // antenele
  c.strokeStyle = "rgba(200,90,40,.7)"; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(28, -10); c.bezierCurveTo(70, -60, 130, -70, 170, -55); c.stroke();
  c.beginPath(); c.moveTo(26, -8); c.bezierCurveTo(60, -30, 110, -35, 150, -20); c.stroke();
  // picioarele
  c.strokeStyle = "rgba(190,90,50,.8)"; c.lineWidth = 2;
  for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-10 + i * 8, 10); c.lineTo(-14 + i * 8, 26); c.lineTo(-18 + i * 8, 30); c.stroke(); }
  // corpul pe segmente
  for (let i = 6; i >= 0; i--) {
    const sx = -95 + i * 17, r = 13 + i * 1.6;
    c.fillStyle = rg(c, sx - 3, -6, 1, sx, 0, r + 4, [[0, "#ffd6b0"], [0.5, "#f08a4b"], [1, "#b8461c"]]);
    c.beginPath(); c.ellipse(sx, i < 2 ? 4 - i * 2 : 0, r * 0.8, r, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(120,40,10,.35)"; c.lineWidth = 1; c.stroke();
  }
  // coada în evantai
  c.fillStyle = "rgba(240,140,80,.85)";
  c.beginPath(); c.moveTo(-105, 6); c.lineTo(-135, -8); c.lineTo(-138, 20); c.closePath(); c.fill();
  // capul și ochiul
  c.fillStyle = rg(c, 20, -8, 2, 22, 0, 26, [[0, "#ffe2c6"], [0.5, "#f39a5d"], [1, "#c2531f"]]);
  c.beginPath(); c.ellipse(20, 0, 26, 17, -0.1, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#111"; c.beginPath(); c.arc(34, -9, 3, 0, Math.PI * 2); c.fill();
  // clește mic
  c.fillStyle = "#e07a3e"; c.beginPath(); c.ellipse(46, 18, 14, 5, 0.3, 0, Math.PI * 2); c.fill();
  // clește mare (pistolul)
  c.save(); c.translate(42, 2);
  c.fillStyle = rg(c, 30, -10, 4, 34, 0, 50, [[0, "#ffcfae"], [0.45, "#e5622a"], [1, "#9a3412"]]);
  c.beginPath(); c.ellipse(34, 0, 44, 22, -0.08, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(28, -10, 20, 6, -0.1, 0, Math.PI * 2); c.fill();
  // degetul mobil
  c.save(); c.translate(70, -8); c.rotate(-0.55 * claw);
  c.fillStyle = lg(c, 0, -8, 0, 8, [[0, "#f6a374"], [1, "#a63c12"]]);
  c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(26, -10, 38, 2); c.quadraticCurveTo(24, 4, 0, 6); c.closePath(); c.fill();
  c.fillStyle = "#fff3e6"; c.beginPath(); c.arc(36, 2, 3.5, 0, Math.PI * 2); c.fill();
  c.restore();
  c.fillStyle = lg(c, 70, 0, 70, 14, [[0, "#f6a374"], [1, "#a63c12"]]);
  c.beginPath(); c.moveTo(66, 4); c.quadraticCurveTo(92, 4, 104, 12); c.quadraticCurveTo(86, 16, 66, 14); c.closePath(); c.fill();
  c.restore();
  c.restore();
};
ART.fish = function (c, x, y, ang, k) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.fillStyle = lg(c, 0, -14, 0, 14, [[0, "#64748b"], [0.45, "#e2e8f0"], [0.55, "#fde68a"], [1, "#f8fafc"]]);
  c.beginPath(); c.ellipse(0, 0, 30, 12, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#94a3b8"; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-44, -12 + Math.sin(k) * 3); c.lineTo(-44, 12 + Math.sin(k) * 3); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-4, -11); c.lineTo(8, -20); c.lineTo(12, -10); c.closePath(); c.fill();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(18, -3, 4.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#111"; c.beginPath(); c.arc(19, -3, 2.2, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(100,116,139,.6)"; c.lineWidth = 1; c.beginPath(); c.moveTo(10, -9); c.quadraticCurveTo(6, 0, 10, 9); c.stroke();
  c.restore();
};

/* fundal subacvatic realist */
function seaBg(c, W, H, top, deep) {
  c.fillStyle = lg(c, 0, 0, 0, H, [[0, top], [1, deep]]); c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = 0.07; c.fillStyle = "#ffffff";
  for (let i = 0; i < 6; i++) { const x = 80 + i * 170 + Math.sin(performance.now() / 3000 + i) * 20; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 40, 0); c.lineTo(x + 140, H); c.lineTo(x + 60, H); c.closePath(); c.fill(); }
  c.restore();
}

/* =====================================================================
   1. ECOGRAFUL
   ===================================================================== */
const ECO = (() => {
  const k = setupCanvas($("cvEco"));
  const CX = 230, CY = 560, R = 380, A0 = -0.5, A1 = 0.5;
  const SX = 492, SY = 44, SW = 420, SH = 280;
  let type = "baby", u = 0.5, active = false, auto = false, autoDir = 1, pulseT = 0, done = false;
  const pulses = [];
  const bins = new Array(42).fill(0);
  const img = document.createElement("canvas"); img.width = SW; img.height = SH;
  const mask = document.createElement("canvas"); mask.width = SW; mask.height = SH;
  const shown = document.createElement("canvas"); shown.width = SW; shown.height = SH;

  function gen() {
    const g = img.getContext("2d"), id = g.createImageData(SW, SH), d = id.data;
    const r = seeded(type === "baby" ? 17 : 29);
    const field = new Float32Array(SW * SH), tissue = new Uint8Array(SW * SH);
    const inE = (x, y, cx, cy, rx, ry, a = 0) => { const ca = Math.cos(a), sa = Math.sin(a), dx = x - cx, dy = y - cy; const X = dx * ca + dy * sa, Y = -dx * sa + dy * ca; return (X * X) / (rx * rx) + (Y * Y) / (ry * ry); };
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      let v = 0, t = 0;
      if (type === "baby") {
        const wallTop = 22 + 0.0006 * (x - 210) ** 2, wallBot = 262 - 0.0005 * (x - 210) ** 2;
        if (y < wallTop - 10) { v = 95; t = 1; }                       // peretele abdomenului
        else if (y < wallTop + 6) { v = 190; t = 2; }                  // peretele uterului
        else if (y > wallBot) { v = 150; t = 3; }
        else {
          v = 12; t = 4;                                               // lichid
          const head = inE(x, y, 292, 128, 62, 58), body = inE(x, y, 175, 150, 98, 56, 0.08);
          const arm = inE(x, y, 230, 186, 42, 11, -0.5), leg = inE(x, y, 102, 196, 48, 17, 0.55), foot = inE(x, y, 66, 220, 15, 9, 0.2);
          const nose = inE(x, y, 352, 142, 10, 8);
          if (head < 1 || nose < 1) { v = head > 0.82 && head < 1 ? 235 : 85; t = 5; }
          else if (body < 1 || arm < 1 || leg < 1 || foot < 1) { v = 125; t = 6; }
          // coloana: un șirag de mărgele albe
          for (let i = 0; i < 11; i++) { const bx = 92 + i * 15, by = 114 - Math.sin(i / 10 * Math.PI) * 8; if ((x - bx) ** 2 + (y - by) ** 2 < 25) { v = 240; t = 7; } }
        }
      } else {
        if (y < 30) { v = 85; t = 1; }
        else {
          v = 80; t = 2;                                               // ficat / țesut
          const kid = inE(x, y, 220, 150, 165, 88);
          const notch = inE(x, y, 228, 248, 60, 50);
          if (kid < 1 && notch > 1) {
            v = kid > 0.9 ? 200 : 105; t = 3;                          // capsula strălucitoare și cortexul
            const sinus = inE(x, y, 222, 150, 85, 28);
            if (sinus < 1) { v = 175; t = 4; }
            for (let i = 0; i < 6; i++) { const a = -2.6 + i * 0.75; if (inE(x, y, 222 + Math.cos(a) * 95, 150 + Math.sin(a) * 52, 20, 13, a) < 1) { v = 55; t = 5; } }
          }
          if ((x - 248) ** 2 + (y - 146) ** 2 < 100) { v = 255; t = 8; } // piatra
          if (x > 238 && x < 258 && y > 156) { v *= 0.12; }               // umbra acustică
        }
      }
      field[y * SW + x] = v; tissue[y * SW + x] = t;
    }
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const i = y * SW + x;
      let v = field[i];
      // margini (ecou puternic acolo unde se schimbă țesutul)
      if (x > 0 && y > 0 && (tissue[i] !== tissue[i - 1] || tissue[i] !== tissue[i - SW])) v = Math.max(v, 210);
      // granulație (speckle) și atenuare cu adâncimea
      v = v * (0.55 + r() * 0.9) * (1 - y / SH * 0.35);
      v = Math.max(0, Math.min(255, v + (r() - 0.5) * 10));
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    g.filter = "blur(0.6px)"; g.drawImage(img, 0, 0); g.filter = "none";
  }
  function reset() {
    mask.getContext("2d").clearRect(0, 0, SW, SH); bins.fill(0); done = false; compose();
    $("ecoPct").textContent = "0 %"; $("ecoBar").style.width = "0%"; sayEl("sayEco", t("e.say0"));
  }
  function compose() {
    const g = shown.getContext("2d"); g.clearRect(0, 0, SW, SH);
    g.drawImage(img, 0, 0); g.globalCompositeOperation = "destination-in"; g.drawImage(mask, 0, 0); g.globalCompositeOperation = "source-over";
  }
  function reveal() {
    const cx = u * SW, m = mask.getContext("2d");
    const gr = m.createLinearGradient(cx - 26, 0, cx + 26, 0);
    gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.3, "rgba(255,255,255,1)"); gr.addColorStop(0.7, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    m.fillStyle = gr; m.fillRect(cx - 26, 0, 52, SH);
    for (let i = 0; i < 42; i++) if (Math.abs((i + 0.5) * 10 - cx) < 18) bins[i] = 1;
    const p = bins.reduce((a, b) => a + b, 0) / 42;
    $("ecoPct").textContent = Math.round(p * 100) + " %"; $("ecoBar").style.width = p * 100 + "%";
    compose();
    if (p > 0.92 && !done) { done = true; sayEl("sayEco", t(type === "baby" ? "e.doneBaby" : "e.doneKidney"), "good"); SND.tada(); }
    else if (!done && p > 0.05 && p < 0.3) sayEl("sayEco", t("e.scan"));
  }
  function setFromPtr(p) {
    const a = Math.atan2(p.x - CX, CY - p.y);
    u = clamp((a - A0) / (A1 - A0), 0, 1);
  }
  k.cv.addEventListener("pointerdown", (e) => { const p = ptr(e, k); if (p.x < 470) { SND.init(); active = true; auto = false; setFromPtr(p); k.cv.setPointerCapture(e.pointerId); } });
  k.cv.addEventListener("pointermove", (e) => { if (active) setFromPtr(ptr(e, k)); });
  k.cv.addEventListener("pointerup", () => (active = false));
  k.cv.addEventListener("pointercancel", () => (active = false));
  $("ecoAuto").addEventListener("click", () => { SND.init(); auto = !auto; if (auto) u = 0; autoDir = 1; });
  $("ecoReset").addEventListener("click", reset);
  document.querySelectorAll("[data-eco]").forEach((b) => b.addEventListener("click", () => {
    type = b.dataset.eco; document.querySelectorAll("[data-eco]").forEach((x) => x.setAttribute("aria-pressed", x === b)); gen(); reset();
  }));
  langHooks.push(() => { if (done) sayEl("sayEco", t(type === "baby" ? "e.doneBaby" : "e.doneKidney"), "good"); });

  function draw(dt) {
    const c = k.c; clear(k);
    if (auto) { u += autoDir * dt * 0.16; if (u >= 1) { u = 1; auto = false; } }
    const scanning = active || auto;
    if (scanning) { reveal(); pulseT -= dt; if (pulseT <= 0) { pulseT = 0.12; pulses.push({ d: 0 }); if (Math.random() < 0.3) SND.note(2600, 0.03, 0.015, "sine"); } }
    // corpul (secțiune): piele, grăsime, mușchi
    const ang = A0 + u * (A1 - A0);
    const layers = [[0, "#e7b49b"], [9, "#f2d79a"], [24, "#c7685a"], [38, "#8a3b38"]];
    layers.forEach(([off, col], i) => {
      c.fillStyle = i === 3 ? lg(c, 0, CY - R, 0, 380, [[0, "#9c4a45"], [1, "#5e2523"]]) : col;
      c.beginPath(); c.arc(CX, CY, R - off, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62); c.lineTo(CX + 300, 400); c.lineTo(CX - 300, 400); c.closePath(); c.fill();
    });
    c.fillStyle = "rgba(255,255,255,.18)"; c.beginPath(); c.arc(CX, CY, R + 1, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62); c.arc(CX, CY, R - 4, -Math.PI / 2 + 0.62, -Math.PI / 2 - 0.62, true); c.fill();
    txt(c, t("e.inside"), CX, 300, 22, "rgba(255,255,255,.55)", "center", "700");
    // pulsurile de ultrasunete
    const px = CX + R * Math.sin(ang), py = CY - R * Math.cos(ang);
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]; p.d += dt * 260; if (p.d > 260) { pulses.splice(i, 1); continue; }
      const back = p.d > 130, dd = back ? 260 - p.d : p.d;
      c.strokeStyle = back ? "rgba(253,224,71," + (0.8 - dd / 200) + ")" : "rgba(147,197,253," + (0.9 - dd / 160) + ")"; c.lineWidth = 2.5;
      c.beginPath(); c.arc(px - Math.sin(ang) * dd, py + Math.cos(ang) * dd, 18, ang + Math.PI * 0.25, ang + Math.PI * 0.75); c.stroke();
    }
    ART.probe(c, px, py, ang);
    // ecranul ecografului
    c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(SX - 14, SY - 14 + 8, SW + 28, SH + 28);
    c.fillStyle = lg(c, 0, SY - 22, 0, SY + SH + 22, [[0, "#3b4250"], [1, "#1c2028"]]); rr(c, SX - 20, SY - 22, SW + 40, SH + 46, 14); c.fill();
    c.fillStyle = "#000"; c.fillRect(SX, SY, SW, SH);
    c.drawImage(shown, SX, SY);
    // marcajele ecranului
    c.strokeStyle = "rgba(160,255,200,.6)"; c.lineWidth = 1;
    for (let i = 0; i <= 5; i++) { const y = SY + 10 + i * (SH - 20) / 5; c.beginPath(); c.moveTo(SX + SW - 10, y); c.lineTo(SX + SW - 3, y); c.stroke(); txt(c, String(i * 3), SX + SW - 16, y, 10, "rgba(160,255,200,.75)", "right", "500"); }
    txt(c, t("e.screen"), SX + 8, SY + 12, 11, "rgba(160,255,200,.85)", "left", "600");
    txt(c, "cm", SX + SW - 16, SY + SH - 4, 9, "rgba(160,255,200,.6)", "right", "500");
    if (scanning) { c.fillStyle = "rgba(160,255,200,.25)"; c.fillRect(SX + u * SW - 1, SY, 2, SH); }
    c.fillStyle = "#16a34a"; c.beginPath(); c.arc(SX + SW + 8, SY + SH + 12, 4, 0, Math.PI * 2); c.fill();
  }
  gen(); reset();
  return { draw, panel: "p-work", stop: () => { auto = false; active = false; } };
})();

/* =====================================================================
   2. STETOSCOPUL
   ===================================================================== */
const STETH = (() => {
  const k = setupCanvas($("cvSteth"));
  let on = false, mode = "rest", timer = null, beat = 0;
  const trace = [];
  const BPM = { rest: 80, run: 130 };
  function setBtn() { $("stPlay").innerHTML = t(on ? "st.off" : "st.on"); }
  function tick() { SNDX.heart(0.75); beat = 1; trace.push({ t: performance.now() }); }
  function start() {
    clearInterval(timer); if (!on) return;
    tick(); timer = setInterval(tick, 60000 / BPM[mode]);
    $("stBpm").textContent = BPM[mode];
    sayEl("saySteth", t(mode === "rest" ? "st.sayRest" : "st.sayRun"), "good");
  }
  $("stPlay").addEventListener("click", () => { SND.init(); on = !on; setBtn(); if (on) start(); else { clearInterval(timer); $("stBpm").textContent = "—"; } });
  document.querySelectorAll("[data-bpm]").forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.bpm; document.querySelectorAll("[data-bpm]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    if (on) start(); else sayEl("saySteth", t(mode === "rest" ? "st.sayRest" : "st.sayRun"));
  }));
  langHooks.push(() => { setBtn(); if (on) sayEl("saySteth", t(mode === "rest" ? "st.sayRest" : "st.sayRun"), "good"); });
  function stop() { on = false; clearInterval(timer); setBtn(); }
  function draw(dt) {
    const c = k.c; clear(k);
    beat = Math.max(0, beat - dt * 3);
    // trunchiul: gât, umeri, piept
    c.fillStyle = lg(c, 20, 0, 400, 0, [[0, "#b9785a"], [0.25, "#eab596"], [0.55, "#f3c8ab"], [0.8, "#e2a888"], [1, "#b06e50"]]);
    c.beginPath(); c.moveTo(170, 0); c.lineTo(250, 0); c.lineTo(252, 34);
    c.bezierCurveTo(300, 50, 380, 52, 405, 92); c.lineTo(395, 300); c.lineTo(25, 300); c.lineTo(15, 92);
    c.bezierCurveTo(40, 52, 120, 50, 168, 34); c.closePath(); c.fill();
    // claviculele, sternul și coastele (umbre fine)
    c.strokeStyle = "rgba(140,80,50,.35)"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(195, 56); c.quadraticCurveTo(130, 48, 70, 70); c.moveTo(225, 56); c.quadraticCurveTo(290, 48, 350, 70); c.stroke();
    c.lineWidth = 2; c.strokeStyle = "rgba(140,80,50,.25)";
    c.beginPath(); c.moveTo(210, 66); c.lineTo(210, 210); c.stroke();
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(90, 120 + i * 34); c.quadraticCurveTo(150, 140 + i * 34, 200, 128 + i * 34); c.moveTo(220, 128 + i * 34); c.quadraticCurveTo(270, 140 + i * 34, 330, 120 + i * 34); c.stroke(); }
    c.fillStyle = "rgba(170,95,75,.45)"; c.beginPath(); c.arc(140, 150, 5, 0, Math.PI * 2); c.arc(280, 150, 5, 0, Math.PI * 2); c.fill();
    // inima, care pulsează
    const s = 0.95 + beat * 0.1;
    ART.heart(c, 610, 150, s);
    // unde de sunet din inimă spre stetoscop
    if (beat > 0.2) { c.strokeStyle = "rgba(220,38,38," + (beat * 0.5) + ")"; c.lineWidth = 3; for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(240, 175, 40 + i * 14 + (1 - beat) * 20, 0, Math.PI * 2); c.stroke(); } }
    ART.stethoscope(c, 240, 175, beat);
    // înregistrarea sunetelor inimii
    const X0 = 730, X1 = 945, Y0 = 70, H = 160;
    c.fillStyle = "#0b1220"; rr(c, X0, Y0, X1 - X0, H, 10); c.fill();
    c.strokeStyle = "rgba(255,255,255,.08)"; c.lineWidth = 1; for (let x = X0 + 10; x < X1; x += 20) { c.beginPath(); c.moveTo(x, Y0); c.lineTo(x, Y0 + H); c.stroke(); }
    const now = performance.now(), span = 3000;
    c.save(); c.shadowColor = "#4ade80"; c.shadowBlur = 8; c.strokeStyle = "#86efac"; c.lineWidth = 2; c.beginPath();
    for (let x = X0; x <= X1; x += 2) {
      const tt = now - span + (x - X0) / (X1 - X0) * span; let y = Y0 + H / 2;
      trace.forEach((b) => {
        const d1 = tt - b.t, d2 = tt - b.t - 300;
        if (d1 > 0 && d1 < 90) y -= Math.sin(d1 / 90 * Math.PI * 6) * 42 * (1 - d1 / 90);
        if (d2 > 0 && d2 < 70) y -= Math.sin(d2 / 70 * Math.PI * 6) * 28 * (1 - d2 / 70);
      });
      x === X0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke(); c.restore();
    while (trace.length && now - trace[0].t > span + 500) trace.shift();
    txt(c, on ? "♥ " + BPM[mode] : "♥ —", X1 - 10, Y0 + 16, 14, "#86efac", "right", "700");
  }
  return { draw, stop, panel: "p-work" };
})();

/* =====================================================================
   3. LITOTRIȚIA
   ===================================================================== */
const LITHO = (() => {
  const k = setupCanvas($("cvLitho"));
  const FX = 520, FY = 112, SKIN = 205, DX = 520, DY = 318;
  let shots = 0, waves = [], flash = 0, sand = [];
  const r0 = seeded(9);
  const cracks = Array.from({ length: 14 }, () => { const a = r0() * Math.PI * 2; return [a, 6 + r0() * 10]; });
  const frags = Array.from({ length: 6 }, (_, i) => ({ a: i / 6 * Math.PI * 2 + 0.3, d: 0 }));
  function reset() {
    shots = 0; waves = []; sand = []; frags.forEach((f) => (f.d = 0)); $("lShots").textContent = "0"; sayEl("sayLitho", t("l.say0"));
  }
  $("lShot").addEventListener("click", () => {
    SND.init(); if (shots >= 12) return;
    waves.push({ r: 240, hit: false }); SNDX.shock();
  });
  $("lReset").addEventListener("click", reset);
  function stonePath(c, x, y, s) {
    c.beginPath();
    const n = 9, rr0 = seeded(4);
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rad = s * (0.8 + rr0() * 0.4); i ? c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad * 0.85) : c.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad * 0.85); }
    c.closePath();
  }
  function draw(dt) {
    const c = k.c; clear(k);
    // țesutul corpului
    c.fillStyle = lg(c, 0, 0, 0, SKIN, [[0, "#7a2f2b"], [1, "#b65a4c"]]); c.fillRect(0, 0, k.W, SKIN);
    c.fillStyle = "#e7b49b"; c.fillRect(0, SKIN - 8, k.W, 8);
    c.fillStyle = "#f2d79a"; c.fillRect(0, SKIN - 20, k.W, 12);
    // ureterul
    c.strokeStyle = "#d98c76"; c.lineWidth = 10; c.lineCap = "round"; c.beginPath(); c.moveTo(420, 120); c.bezierCurveTo(360, 140, 320, 170, 250, 185); c.stroke(); c.lineCap = "butt";
    ART.kidney(c, 500, 108, 120, 78);
    // piatra
    if (shots < 6) {
      const sz = 22;
      c.fillStyle = rg(c, FX - 6, FY - 6, 2, FX, FY, sz, [[0, "#fff1b8"], [0.5, "#d8b45a"], [1, "#8a6a22"]]);
      stonePath(c, FX, FY, sz); c.fill(); c.strokeStyle = "rgba(80,60,20,.6)"; c.lineWidth = 1; c.stroke();
      c.strokeStyle = "rgba(40,30,10,.85)"; c.lineWidth = 1.5;
      cracks.slice(0, shots * 3).forEach(([a, l]) => { c.beginPath(); c.moveTo(FX, FY); c.lineTo(FX + Math.cos(a) * l, FY + Math.sin(a) * l); c.lineTo(FX + Math.cos(a + 0.4) * (l + 6), FY + Math.sin(a + 0.4) * (l + 6)); c.stroke(); });
    } else if (shots < 12) {
      frags.forEach((f, i) => {
        f.d = lerp(f.d, 4 + (shots - 6) * 3, 1 - Math.exp(-dt * 6));
        const x = FX + Math.cos(f.a) * f.d, y = FY + Math.sin(f.a) * f.d * 0.8, s = Math.max(3, 10 - (shots - 6) * 1.3);
        c.fillStyle = rg(c, x - 2, y - 2, 1, x, y, s, [[0, "#fff1b8"], [1, "#8a6a22"]]); stonePath(c, x, y, s); c.fill();
      });
    } else {
      if (!sand.length) for (let i = 0; i < 50; i++) sand.push({ x: FX + rnd(-14, 14), y: FY + rnd(-10, 10), p: rnd(0, 0.3) });
      sand.forEach((g) => {
        g.p += dt * 0.12;
        const tt = clamp(g.p, 0, 1);
        const x = tt < 0.3 ? lerp(g.x, 420, tt / 0.3) : lerp(420, 250, (tt - 0.3) / 0.7), y = tt < 0.3 ? lerp(g.y, 120, tt / 0.3) : lerp(120, 185, (tt - 0.3) / 0.7) + Math.sin(tt * 9) * 2;
        if (g.p < 1) { c.fillStyle = "#e9cf86"; c.fillRect(x, y, 2.2, 2.2); }
      });
    }
    // oglinda (bolul metalic) și perna cu apă
    const BY = SKIN + 70;
    c.fillStyle = lg(c, DX - 160, 0, DX + 160, 0, [[0, "#475569"], [0.3, "#e2e8f0"], [0.55, "#94a3b8"], [1, "#334155"]]);
    c.beginPath(); c.ellipse(DX, BY, 160, 58, 0, 0, Math.PI); c.closePath(); c.fill();
    c.fillStyle = rg(c, DX, BY - 6, 6, DX, BY, 150, [[0, "#64748b"], [0.7, "#cbd5e1"], [1, "#f8fafc"]]);
    c.beginPath(); c.ellipse(DX, BY, 150, 16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(96,165,250,.5)";
    c.beginPath(); c.moveTo(DX - 148, BY); c.bezierCurveTo(DX - 140, SKIN + 12, DX - 100, SKIN, DX - 60, SKIN); c.lineTo(DX + 60, SKIN);
    c.bezierCurveTo(DX + 100, SKIN, DX + 140, SKIN + 12, DX + 148, BY); c.ellipse(DX, BY, 148, 15, 0, 0, Math.PI, false); c.closePath(); c.fill();
    c.strokeStyle = "rgba(30,64,175,.55)"; c.lineWidth = 2; c.stroke();
    c.fillStyle = "rgba(255,255,255,.3)"; c.beginPath(); c.ellipse(DX - 70, SKIN + 28, 30, 8, -0.2, 0, Math.PI * 2); c.fill();
    // undele de șoc care se strâng în piatră
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i]; w.r -= dt * 520;
      if (w.r <= 4 && !w.hit) { w.hit = true; flash = 1; shots++; $("lShots").textContent = shots; SND.drum(160, 0.35, 0.08);
        sayEl("sayLitho", t(shots >= 12 ? "l.say3" : shots >= 6 ? "l.say2" : "l.say1"), shots >= 12 ? "good" : ""); if (shots >= 12) SND.tada(); }
      if (w.r <= 0) { waves.splice(i, 1); continue; }
      c.strokeStyle = "rgba(255,255,255," + (0.35 + (1 - w.r / 240) * 0.6) + ")"; c.lineWidth = 3;
      c.beginPath(); c.arc(FX, FY, w.r, Math.PI * 0.22, Math.PI * 0.78); c.stroke();
    }
    if (flash > 0) { flash -= dt * 3; c.fillStyle = "rgba(255,255,220," + Math.max(0, flash) * 0.8 + ")"; c.beginPath(); c.arc(FX, FY, 30 * (1.2 - flash), 0, Math.PI * 2); c.fill(); }
    // etichete
    const lab = (s, x, y, col = "#fff") => txt(c, s, x, y, 13, col, "left", "600");
    lab(t("l.kidney"), 640, 60); lab(t("l.stone"), 548, 132, "#fff7cc"); lab(t("l.skin"), 20, SKIN - 12, "#3b1d10");
    lab(t("l.water"), 680, SKIN + 32, COL.ink); lab(t("l.mirror"), 690, SKIN + 92, COL.ink);
  }
  reset();
  return { draw, panel: "p-work" };
})();

/* =====================================================================
   4. SONARUL
   ===================================================================== */
const SONAR = (() => {
  const k = setupCanvas($("cvSonar"));
  const PXM = 2;                            // 1 pixel = 2 metri
  const V = 1480 / PXM;                     // viteza în pixeli pe secundă
  let subY = 150, ping = null, echoes = [], found = 0, msg = "";
  const OBJ = [
    { id: "whale", x: 560, y: 90, w: 150, h: 46, found: false, key: "so.whale", lab: "so.lw" },
    { id: "sub", x: 820, y: 210, w: 130, h: 36, found: false, key: "so.sub", lab: "so.ls" },
    { id: "rock", x: 430, y: 285, w: 90, h: 80, found: false, key: "so.rock", lab: "so.lr" }
  ];
  const r = seeded(21), bed = Array.from({ length: 49 }, (_, i) => 315 + Math.sin(i * 0.7) * 6 + r() * 8);
  function move(d) { subY = clamp(subY + d, 50, 270); }
  $("soUp").addEventListener("click", () => move(-40));
  $("soDown").addEventListener("click", () => move(40));
  $("soPing").addEventListener("click", () => {
    if (ping) return; SND.init(); SNDX.ping(0.35);
    ping = { r: 0, y: subY, x: 172, hits: [] };
    $("soEcho").textContent = "…"; $("soDist").textContent = "…";
  });
  function stop() {}
  let last = null;
  function text(o, dt) {
    const d = Math.round(1480 * dt / 2);
    return t("so.calc", { t: fmt(dt, 2), d: fmt(d) }) + t(o.key) + (found === 3 ? t("so.all") : "");
  }
  function result(o, dt) {
    const d = Math.round(1480 * dt / 2); last = [o, dt];
    $("soEcho").textContent = fmt(dt, 2) + " s"; $("soDist").textContent = fmt(d) + " m";
    if (!o.found) { o.found = true; found++; $("soFound").textContent = found + " / 3"; if (found === 3) SND.tada(); }
    msg = "x"; sayEl("saySonar", text(o, dt), "good");
  }
  langHooks.push(() => { if (msg && last) { sayEl("saySonar", text(last[0], last[1]), "good"); $("soEcho").textContent = fmt(last[1], 2) + " s"; $("soDist").textContent = fmt(Math.round(1480 * last[1] / 2)) + " m"; } });
  function draw(dt) {
    const c = k.c;
    seaBg(c, k.W, k.H, "#1d6fa5", "#03162b");
    c.fillStyle = "rgba(255,255,255,.5)"; for (let x = 0; x < k.W; x += 6) c.fillRect(x, 6 + Math.sin(x / 30 + performance.now() / 500) * 2, 4, 2);
    // fundul mării
    c.fillStyle = lg(c, 0, 300, 0, 340, [[0, "#4a4035"], [1, "#1f1a14"]]);
    c.beginPath(); c.moveTo(0, k.H); bed.forEach((y, i) => c.lineTo(i * 20, y)); c.lineTo(k.W, k.H); c.closePath(); c.fill();
    // obiectele găsite
    OBJ.forEach((o) => {
      if (!o.found) return;
      if (o.id === "whale") ART.whale(c, o.x + o.w / 2, o.y + o.h / 2, o.w);
      if (o.id === "sub") ART.sub(c, o.x + o.w / 2, o.y + o.h / 2 + 6, o.w, -1, "#4b5563");
      if (o.id === "rock") { c.fillStyle = lg(c, o.x, 0, o.x + o.w, 0, [[0, "#3f3a33"], [0.4, "#7a6f60"], [1, "#2a2520"]]); c.beginPath(); c.moveTo(o.x, 330); c.lineTo(o.x + 20, o.y + 10); c.lineTo(o.x + 45, o.y - 6); c.lineTo(o.x + 70, o.y + 18); c.lineTo(o.x + o.w, 330); c.closePath(); c.fill(); }
      c.strokeStyle = "rgba(74,222,128,.8)"; c.setLineDash([5, 4]); c.lineWidth = 1.5; c.strokeRect(o.x - 6, o.y - 10, o.w + 12, o.h + 16); c.setLineDash([]);
      txt(c, t(o.lab), o.x + o.w / 2, o.y - 18, 13, "#86efac", "center", "700");
    });
    // pingul
    if (ping) {
      ping.r += V * dt;
      const a = 0.16;
      c.strokeStyle = "rgba(125,211,252," + Math.max(0.15, 1 - ping.r / 900) + ")"; c.lineWidth = 3;
      c.beginPath(); c.arc(ping.x, ping.y, ping.r, -a, a); c.stroke();
      OBJ.forEach((o) => {
        if (ping.hits.includes(o)) return;
        const d = o.x - ping.x, half = Math.tan(a) * d;
        if (ping.r >= d && ping.y + half > o.y && ping.y - half < o.y + o.h) { ping.hits.push(o); echoes.push({ o, x: o.x, y: clamp(ping.y, o.y, o.y + o.h), r: 0, d, t0: ping.r / V }); }
      });
      if (ping.r > 900) { if (!ping.hits.length) { $("soEcho").textContent = "—"; $("soDist").textContent = "—"; sayEl("saySonar", t("so.none"), "warn"); msg = ""; } ping = null; }
    }
    for (let i = echoes.length - 1; i >= 0; i--) {
      const e = echoes[i]; e.r += V * dt;
      c.strokeStyle = "rgba(253,224,71," + Math.max(0.2, 0.9 - e.r / 900) + ")"; c.lineWidth = 2.5;
      c.beginPath(); c.arc(e.x, e.y, e.r, Math.PI - 0.2, Math.PI + 0.2); c.stroke();
      if (e.r >= e.d) { echoes.splice(i, 1); SNDX.ping(0.12); result(e.o, (2 * e.d) / V); }
    }
    // submarinul nostru
    ART.sub(c, 110, subY, 130, 1, "#6b7c3a");
    txt(c, t("so.you"), 110, subY - 38, 12, "#e2e8f0", "center", "700");
    // adâncimea
    c.fillStyle = "rgba(255,255,255,.55)"; c.font = "11px system-ui"; c.textAlign = "left";
    for (let y = 50; y <= 300; y += 50) { c.fillRect(0, y, 8, 1); c.fillText(fmt(y * PXM) + " m", 11, y + 4); }
  }
  return { draw, stop, panel: "p-work" };
})();

/* =====================================================================
   5. LRAD
   ===================================================================== */
const LRAD = (() => {
  const k = setupCanvas($("cvLrad"));
  let mode = "mega", beam = 0, boatX = 760, boatDir = -1, fleeing = false, cover = 0, waves = [];
  function reset() { boatX = 760; boatDir = -1; fleeing = false; cover = 0; beam = 0; waves = []; $("lrDb").textContent = "—"; sayEl("sayLrad", t("lr.say0")); }
  document.querySelectorAll("[data-lr]").forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.lr; document.querySelectorAll("[data-lr]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  }));
  $("lrGo").addEventListener("click", () => {
    SND.init(); SNDX.warn(); beam = 1.6;
    if (mode === "mega") { for (let i = 0; i < 4; i++) waves.push({ r: 20 + i * 30, a: 0.9 }); $("lrDb").textContent = "≈ 70 dB"; sayEl("sayLrad", t("lr.sayMega")); }
    else { $("lrDb").textContent = "≈ 120 dB"; sayEl("sayLrad", t("lr.sayLrad"), "good"); setTimeout(() => { fleeing = true; }, 700); }
  });
  $("lrReset").addEventListener("click", reset);
  langHooks.push(() => { if ($("lrDb").textContent !== "—") sayEl("sayLrad", t(mode === "mega" ? "lr.sayMega" : "lr.sayLrad"), mode === "lrad" ? "good" : ""); });
  function draw(dt) {
    const c = k.c, W = k.W, H = k.H, now = performance.now();
    c.fillStyle = lg(c, 0, 0, 0, 160, [[0, COL.dark ? "#1e3a5f" : "#9cc9ec"], [1, COL.dark ? "#3b5f86" : "#e6f2fb"]]); c.fillRect(0, 0, W, 160);
    c.fillStyle = lg(c, 0, 155, 0, H, [[0, "#2a6f97"], [1, "#0b3954"]]); c.fillRect(0, 155, W, H - 155);
    c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 1.5;
    for (let j = 0; j < 7; j++) { c.beginPath(); for (let x = 0; x <= W; x += 10) c.lineTo(x, 170 + j * 18 + Math.sin(x / 40 + now / 700 + j) * 2.5); c.stroke(); }
    // nava și aparatul
    ART.ship(c, 20, 160);
    const LX = 300, LY = 118;
    // undele
    if (mode === "mega") {
      for (let i = waves.length - 1; i >= 0; i--) { const w = waves[i]; w.r += dt * 260; w.a -= dt * 0.35; if (w.a <= 0) { waves.splice(i, 1); continue; }
        c.strokeStyle = "rgba(255,255,255," + (w.a * Math.min(1, 120 / w.r)) + ")"; c.lineWidth = 3; c.beginPath(); c.arc(LX, LY, w.r, -1.2, 1.2); c.stroke(); }
      if (beam > 0 && !fleeing) boatX -= dt * 10;
    } else if (beam > 0) {
      const a = Math.min(1, beam) * 0.5;
      c.fillStyle = lg(c, LX, 0, W, 0, [[0, "rgba(251,191,36," + a + ")"], [1, "rgba(251,191,36," + (a * 0.6) + ")"]]);
      const ty = 168, ang = Math.atan2(ty - LY, boatX - LX);
      c.save(); c.translate(LX, LY); c.rotate(ang);
      const BL = Math.hypot(boatX - LX, ty - LY) + 40;
      c.beginPath(); c.moveTo(0, -18); c.lineTo(BL, -26); c.lineTo(BL, 26); c.lineTo(0, 18); c.closePath(); c.fill();
      c.strokeStyle = "rgba(255,255,255," + a + ")"; c.lineWidth = 2;
      for (let x = (now / 2) % 40; x < BL; x += 40) { c.beginPath(); c.moveTo(x, -18 - x * 0.012); c.lineTo(x, 18 + x * 0.012); c.stroke(); }
      c.restore();
    }
    beam = Math.max(0, beam - dt * 0.6);
    const ang = Math.atan2(168 - LY, boatX - LX);
    ART.lrad(c, LX, LY - 6, ang, beam > 0);
    // bărcuța piraților
    if (fleeing) { cover = Math.min(1, cover + dt * 3); boatDir = 1; boatX += dt * 120; }
    else if (boatX > 520) boatX -= dt * 14;
    const bx = Math.min(boatX, 1100);
    ART.skiff(c, bx, 175 + Math.sin(now / 400) * 2, boatDir, cover > 0.5, Math.sin(now / 500) * 0.04);
    if (cover > 0.5 && bx < W) txt(c, "!!", bx, 120, 22, "#dc2626", "center", "800");
  }
  reset();
  return { draw, panel: "p-work" };
})();

/* =====================================================================
   6. CREVETA-PISTOL
   ===================================================================== */
const SHRIMP = (() => {
  const k = setupCanvas($("cvShrimp"));
  let fired = false, claw = 0, snapT = -1, bubble = 0, flash = 0, ring = 0, stun = 0, fishX = 560, fishK = 0;
  const r = seeded(33), pebbles = Array.from({ length: 60 }, () => [r() * 960, 238 + r() * 30, 3 + r() * 9, r()]);
  const weeds = Array.from({ length: 7 }, (_, i) => [60 + i * 140 + r() * 40, 50 + r() * 40]);
  function snap() {
    if (snapT >= 0) return;
    SND.init(); snapT = 0; claw = 1; fired = false;
  }
  $("shSnap").addEventListener("click", snap);
  k.cv.addEventListener("pointerdown", snap);
  function draw(dt) {
    const c = k.c, now = performance.now();
    seaBg(c, k.W, k.H, "#2b8cbf", "#0b4466");
    weeds.forEach(([x, h], i) => { c.strokeStyle = "rgba(34,120,70,.8)"; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(x, 260); c.quadraticCurveTo(x + Math.sin(now / 900 + i) * 14, 260 - h / 2, x + Math.sin(now / 700 + i) * 8, 260 - h); c.stroke(); c.lineCap = "butt"; });
    c.fillStyle = lg(c, 0, 230, 0, 270, [[0, "#d8c193"], [1, "#a68b5b"]]); c.fillRect(0, 236, k.W, 40);
    pebbles.forEach(([x, y, s, g]) => { c.fillStyle = "rgb(" + (120 + g * 80 | 0) + "," + (110 + g * 70 | 0) + "," + (95 + g * 60 | 0) + ")"; c.beginPath(); c.ellipse(x, y, s, s * 0.6, 0, 0, Math.PI * 2); c.fill(); });
    // animația pocniturii
    const BX = 440, BY = 186;
    if (snapT >= 0) {
      snapT += dt;
      claw = Math.max(0, 1 - snapT * 30);
      if (snapT < 0.25) bubble = Math.min(18, snapT * 140);
      else if (snapT < 0.32) bubble = Math.max(0, 18 * (1 - (snapT - 0.25) / 0.07));
      if (snapT >= 0.32 && !fired) { fired = true; flash = 1; ring = 1; SNDX.snap(); stun = 1; sayEl("sayShrimp", t("sh.say1"), "good"); }
      if (snapT > 1.4) { snapT = -1; claw = 0; }
    } else claw = Math.min(1, claw + dt * 2);
    // jetul de apă
    if (snapT >= 0 && snapT < 0.32) { c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(BX - 70, BY - 6 + i * 4); c.lineTo(BX - 10, BY - 4 + i * 3); c.stroke(); } }
    if (bubble > 0.5) { c.fillStyle = rg(c, BX - bubble * 0.3, BY - bubble * 0.3, 1, BX, BY, bubble, [[0, "rgba(255,255,255,.9)"], [0.7, "rgba(200,235,255,.35)"], [1, "rgba(255,255,255,.8)"]]); c.beginPath(); c.arc(BX, BY, bubble, 0, Math.PI * 2); c.fill(); }
    if (ring > 0) { ring -= dt * 1.2; c.strokeStyle = "rgba(255,255,255," + Math.max(0, ring) + ")"; c.lineWidth = 3; c.beginPath(); c.arc(BX, BY, (1 - ring) * 260, 0, Math.PI * 2); c.stroke(); }
    if (flash > 0) {
      flash -= dt * 4;
      const f = Math.max(0, flash);
      c.fillStyle = rg(c, BX, BY, 0, BX, BY, 40, [[0, "rgba(255,255,255," + f + ")"], [0.3, "rgba(190,230,255," + f * 0.7 + ")"], [1, "rgba(150,200,255,0)"]]);
      c.beginPath(); c.arc(BX, BY, 40, 0, Math.PI * 2); c.fill();
    }
    ART.shrimp(c, 270, 196, claw);
    // peștișorul
    fishK += dt * 8;
    if (stun > 0) { stun -= dt * 0.3; }
    const st = Math.max(0, stun);
    if (st === 0) fishX = 560 + Math.sin(now / 1500) * 70;
    ART.fish(c, fishX, 150 + Math.sin(now / 600) * 6 * (1 - st) - st * 20, st > 0 ? Math.PI * Math.min(1, st * 2) * 0.9 : 0, fishK * (1 - st));
    if (st > 0.1) txt(c, "💫", fishX, 115 - st * 20, 22);
  }
  return { draw, panel: "p-work" };
})();

/* =====================================================================
   7. RIGLA DECIBELILOR
   ===================================================================== */
function buildDb() {
  const L = [0, 30, 60, 85, 100, 110, 120, 140, 150];
  $("dbRule").innerHTML = L.map((v) => {
    const hue = 140 - Math.min(140, v * 0.95);
    return "<div class='dbrow'><b>" + v + " dB</b><span class='dbbar'><i style='width:" + (8 + v / 150 * 92) + "%;background:hsl(" + hue + ",75%,45%)'></i></span><span class='dbt'>" + t("db." + v) + "</span></div>";
  }).join("");
}
langHooks.push(buildDb);
buildDb();

/* înregistrare în bucla de desen și oprire la schimbarea taburilor */
MODS.push(ECO, STETH, LITHO, SONAR, LRAD, SHRIMP);
window.WORK_STOP = () => { STETH.stop(); ECO.stop(); };
applyI18n($("p-work"));
buildVocab(); buildQuiz();

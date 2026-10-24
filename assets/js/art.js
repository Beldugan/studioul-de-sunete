/* ===========================================================
   Studioul de sunete — grafica realistă (desen pe canvas)
   Lemn, metal cromat, sticlă, alamă, carton, materiale.
   =========================================================== */
"use strict";

const ART = {};

/* --- ajutoare --- */
function lg(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; }
function rg(c, x0, y0, r0, x1, y1, r1, stops) { const g = c.createRadialGradient(x0, y0, r0, x1, y1, r1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; }
function shade(hex, k) { // k<0 mai închis, k>0 mai deschis
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
}
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }
const CHROME = (c, x0, y0, x1, y1) => lg(c, x0, y0, x1, y1, [[0, "#f8fafc"], [0.25, "#9aa5b4"], [0.5, "#eef2f6"], [0.75, "#6b7686"], [1, "#d5dbe3"]]);
function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

/* --- blat de lemn --- */
ART.wood = function (c, x, y, w, h, dark) {
  c.fillStyle = lg(c, 0, y, 0, y + h, dark ? [[0, "#5a3d24"], [0.15, "#4a321d"], [1, "#2e1f12"]] : [[0, "#d9b183"], [0.15, "#c89a68"], [1, "#9c7146"]]);
  c.fillRect(x, y, w, h);
  c.strokeStyle = dark ? "rgba(0,0,0,.25)" : "rgba(110,70,30,.22)"; c.lineWidth = 1;
  const r = seeded(7);
  for (let i = 0; i < 5; i++) {
    const yy = y + 3 + r() * (h - 4);
    c.beginPath(); c.moveTo(x, yy);
    for (let xx = x; xx <= x + w; xx += 30) c.lineTo(xx, yy + Math.sin(xx / 70 + i) * 1.5);
    c.stroke();
  }
  c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(x, y, w, 2);
};

/* --- tobă realistă: carcasă lăcuită, cercuri cromate, tiranți, piele --- */
ART.drum = function (c, cx, cy, rx, ry, h, vib, phase, shell, opt = {}) {
  const wob = vib * Math.sin(phase);
  // umbra pe masă
  c.fillStyle = "rgba(0,0,0,.22)"; c.beginPath(); c.ellipse(cx, cy + h + ry * 0.9, rx * 1.06, ry * 0.55, 0, 0, Math.PI * 2); c.fill();
  // carcasa
  const body = () => { c.beginPath(); c.moveTo(cx - rx, cy); c.lineTo(cx - rx, cy + h); c.ellipse(cx, cy + h, rx, ry, 0, Math.PI, 0, true); c.lineTo(cx + rx, cy); c.closePath(); };
  body();
  c.fillStyle = lg(c, cx - rx, 0, cx + rx, 0, [[0, shade(shell, -0.55)], [0.12, shade(shell, -0.2)], [0.3, shade(shell, 0.25)], [0.36, shade(shell, 0.45)], [0.42, shade(shell, 0.1)], [0.75, shade(shell, -0.15)], [1, shade(shell, -0.6)]]);
  c.fill();
  if (opt.wood) { // fibra lemnului (bongo)
    c.save(); body(); c.clip(); c.strokeStyle = "rgba(60,30,10,.25)"; c.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) { const xx = cx - rx + (i + 0.5) * (2 * rx / 14); c.beginPath(); c.moveTo(xx, cy); c.bezierCurveTo(xx + 6, cy + h * 0.3, xx - 6, cy + h * 0.7, xx + 2, cy + h + ry); c.stroke(); }
    c.restore();
  }
  // reflexie lucioasă
  c.save(); body(); c.clip();
  c.fillStyle = "rgba(255,255,255,.22)"; c.fillRect(cx - rx * 0.42, cy, rx * 0.07, h + ry);
  c.fillStyle = "rgba(255,255,255,.1)"; c.fillRect(cx - rx * 0.3, cy, rx * 0.03, h + ry);
  c.restore();
  // tiranții (tension rods) pe partea din față
  const lugs = opt.lugs !== undefined ? opt.lugs : 8;
  for (let i = 0; i < lugs; i++) {
    const a = Math.PI * (i + 0.5) / lugs, s = Math.sin(a);
    const x = cx - Math.cos(a) * rx * 0.985, y1 = cy + s * ry, y2 = cy + h + s * ry;
    const lw = Math.max(2, 6 * s);
    c.strokeStyle = CHROME(c, x - lw, 0, x + lw, 0); c.lineWidth = Math.max(1.5, 3 * s);
    c.beginPath(); c.moveTo(x, y1 + 2); c.lineTo(x, y2 - 2); c.stroke();
    // carcasa tirantului
    const lh = Math.min(34, h * 0.32), my = (y1 + y2) / 2;
    c.fillStyle = CHROME(c, x - lw * 1.4, 0, x + lw * 1.4, 0);
    c.beginPath(); c.ellipse(x, my, lw * 1.3, lh / 2, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 0.8; c.stroke();
  }
  // cercul de jos
  c.strokeStyle = CHROME(c, 0, cy + h - 8, 0, cy + h + ry + 6); c.lineWidth = 7;
  c.beginPath(); c.ellipse(cx, cy + h, rx + 1, ry, 0, 0, Math.PI); c.stroke();
  // pielea (membrana)
  c.save();
  c.beginPath(); c.ellipse(cx, cy + wob * 0.5, rx - 3, ry - 2 + wob * 0.4, 0, 0, Math.PI * 2);
  c.fillStyle = rg(c, cx - rx * 0.25, cy - ry * 0.3, 4, cx, cy, rx, [[0, "#fffdf8"], [0.55, "#f3ecdc"], [0.9, "#e3d6bb"], [1, "#cdbd9a"]]);
  c.fill(); c.clip();
  // textura fină a pielii
  const r = seeded(Math.round(rx));
  c.fillStyle = "rgba(150,120,80,.07)";
  for (let i = 0; i < 160; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); c.fillRect(cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, 2, 1); }
  // unde pe piele când vibrează
  if (vib > 0.4) {
    c.strokeStyle = "rgba(120,90,40," + Math.min(0.45, vib / 16) + ")"; c.lineWidth = 1.4;
    for (let k = 1; k <= 3; k++) { const s = (phase * 0.15 + k / 3) % 1; c.beginPath(); c.ellipse(cx, cy + wob * 0.5, rx * s, ry * s, 0, 0, Math.PI * 2); c.stroke(); }
  }
  c.restore();
  // cercul de sus, cromat, cu ghearele tiranților
  c.strokeStyle = CHROME(c, 0, cy - ry - 4, 0, cy + ry + 4); c.lineWidth = 8;
  c.beginPath(); c.ellipse(cx, cy, rx + 1, ry + 1, 0, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 1.5;
  c.beginPath(); c.ellipse(cx, cy - 2, rx - 1, ry - 1, 0, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
};

/* --- bețe de tobă din lemn --- */
ART.stick = function (c, x, y, ang, len = 190) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(len / 2 + 6, 14, len / 2, 5, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = lg(c, 0, -6, 0, 6, [[0, "#f3d9a6"], [0.45, "#d9ac6a"], [1, "#9b6a32"]]);
  c.beginPath(); c.moveTo(0, -3); c.lineTo(len * 0.7, -5.5); c.lineTo(len, -6); c.quadraticCurveTo(len + 6, 0, len, 6); c.lineTo(len * 0.7, 5.5); c.lineTo(0, 3); c.closePath(); c.fill();
  c.fillStyle = lg(c, 0, -5, 0, 5, [[0, "#f6e2bb"], [1, "#a8783f"]]);
  c.beginPath(); c.ellipse(-2, 0, 6, 4.2, 0, 0, Math.PI * 2); c.fill();
  c.restore();
};

/* --- bob de orez --- */
ART.rice = function (c, x, y, rot, z) {
  if (z !== undefined) { c.fillStyle = "rgba(90,70,40," + (0.18 / (1 + z / 40)) + ")"; c.beginPath(); c.ellipse(x, y + z + 2, 5, 2, 0, 0, Math.PI * 2); c.fill(); }
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = rg(c, -2, -1, 0.5, 0, 0, 7, [[0, "#ffffff"], [0.6, "#f4efe1"], [1, "#d8cdb2"]]);
  c.beginPath(); c.ellipse(0, 0, 6.5, 2.7, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "rgba(120,100,70,.35)"; c.lineWidth = 0.6; c.stroke();
  c.restore();
};

/* --- boxă (difuzor) cu woofer și tweeter --- */
ART.speaker = function (c, x, y, w, h, cone) {
  c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x + 6, y + h - 2, w, 8);
  c.fillStyle = lg(c, x, 0, x + w, 0, [[0, "#3b2414"], [0.4, "#5c3a20"], [1, "#2a190d"]]);
  if (c.roundRect) { c.beginPath(); c.roundRect(x, y, w, h, 6); c.fill(); } else c.fillRect(x, y, w, h);
  c.fillStyle = "#151515"; c.fillRect(x + 6, y + 6, w - 12, h - 12);
  const cx = x + w / 2, wy = y + h * 0.63, R = w * 0.38, s = 1 + cone * 0.06;
  // woofer
  c.fillStyle = rg(c, cx, wy, R * 0.7, cx, wy, R, [[0, "#2b2b2b"], [0.6, "#4a4a4a"], [1, "#111"]]);
  c.beginPath(); c.arc(cx, wy, R, 0, Math.PI * 2); c.fill();
  c.fillStyle = rg(c, cx - R * 0.2, wy - R * 0.25, 2, cx, wy, R * 0.78 * s, [[0, "#3d3d3d"], [0.7, "#1c1c1c"], [1, "#0a0a0a"]]);
  c.beginPath(); c.arc(cx, wy, R * 0.78 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = rg(c, cx - 4, wy - 5, 1, cx, wy, R * 0.28, [[0, "#9aa1a8"], [0.5, "#3b3f44"], [1, "#16181a"]]);
  c.beginPath(); c.arc(cx, wy, R * 0.28 * s, 0, Math.PI * 2); c.fill();
  c.strokeStyle = CHROME(c, cx - R, wy - R, cx + R, wy + R); c.lineWidth = 2.5; c.beginPath(); c.arc(cx, wy, R + 1, 0, Math.PI * 2); c.stroke();
  // tweeter
  const ty = y + h * 0.2, r2 = w * 0.15;
  c.fillStyle = rg(c, cx - 2, ty - 3, 1, cx, ty, r2, [[0, "#c7ccd2"], [0.4, "#4b5157"], [1, "#0d0d0d"]]);
  c.beginPath(); c.arc(cx, ty, r2, 0, Math.PI * 2); c.fill();
  c.strokeStyle = CHROME(c, cx - r2, ty - r2, cx + r2, ty + r2); c.lineWidth = 2; c.stroke();
};

/* --- radio vechi din lemn --- */
ART.radio = function (c, x, y, w, h, on, t) {
  c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(x + w / 2, y + h + 3, w * 0.55, 6, 0, 0, Math.PI * 2); c.fill();
  // antena telescopică
  c.strokeStyle = CHROME(c, x + w - 20, y - 60, x + w, y); c.lineWidth = 3;
  c.beginPath(); c.moveTo(x + w - 14, y + 4); c.lineTo(x + w + 22, y - 62); c.stroke();
  c.fillStyle = "#cbd5e1"; c.beginPath(); c.arc(x + w + 22, y - 62, 3, 0, Math.PI * 2); c.fill();
  // carcasa
  c.fillStyle = lg(c, 0, y, 0, y + h, [[0, "#8a5a2e"], [0.08, "#a8703a"], [0.5, "#7a4a22"], [1, "#4a2a10"]]);
  c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + 22); c.quadraticCurveTo(x, y, x + 22, y); c.lineTo(x + w - 22, y); c.quadraticCurveTo(x + w, y, x + w, y + 22); c.lineTo(x + w, y + h); c.closePath(); c.fill();
  c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 1.5; c.stroke();
  // grila din pânză
  const gx = x + 10, gy = y + 12, gw = w * 0.58, gh = h - 24;
  c.save(); if (c.roundRect) { c.beginPath(); c.roundRect(gx, gy, gw, gh, 8); } else { c.beginPath(); c.rect(gx, gy, gw, gh); } c.clip();
  c.fillStyle = "#c9b48a"; c.fillRect(gx, gy, gw, gh);
  c.strokeStyle = "rgba(90,65,30,.35)"; c.lineWidth = 1;
  for (let i = -gh; i < gw; i += 4) { c.beginPath(); c.moveTo(gx + i, gy); c.lineTo(gx + i + gh, gy + gh); c.stroke(); c.beginPath(); c.moveTo(gx + i + gh, gy); c.lineTo(gx + i, gy + gh); c.stroke(); }
  const pulse = on ? 0.06 + 0.05 * Math.sin(t / 90) : 0;
  c.fillStyle = rg(c, gx + gw / 2, gy + gh / 2, 2, gx + gw / 2, gy + gh / 2, gw * 0.6, [[0, "rgba(0,0,0," + (0.12 + pulse) + ")"], [1, "rgba(0,0,0,.25)"]]);
  c.fillRect(gx, gy, gw, gh);
  c.restore();
  // cadranul și butoanele
  const dx = gx + gw + 8, dw = x + w - dx - 8;
  c.fillStyle = on ? lg(c, dx, 0, dx + dw, 0, [[0, "#fde68a"], [1, "#f59e0b"]]) : "#e7dcc0";
  c.fillRect(dx, y + 14, dw, 26);
  c.strokeStyle = "#5b3a1a"; c.lineWidth = 1;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(dx + 4 + i * (dw - 8) / 5, y + 18); c.lineTo(dx + 4 + i * (dw - 8) / 5, y + 26); c.stroke(); }
  c.strokeStyle = "#b91c1c"; c.lineWidth = 2; c.beginPath(); c.moveTo(dx + dw * 0.62, y + 15); c.lineTo(dx + dw * 0.62, y + 39); c.stroke();
  [y + h * 0.58, y + h * 0.82].forEach((ky) => {
    c.fillStyle = rg(c, dx + dw / 2 - 3, ky - 3, 1, dx + dw / 2, ky, 11, [[0, "#f1f5f9"], [0.5, "#64748b"], [1, "#1e293b"]]);
    c.beginPath(); c.arc(dx + dw / 2, ky, 10, 0, Math.PI * 2); c.fill();
  });
};

/* --- materialele dintre radio și Eva (văzute din lateral) --- */
ART.material = function (c, mat, x, top, bot) {
  const H = bot - top;
  c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(x + 6, bot + 4, 38, 6, 0, 0, Math.PI * 2); c.fill();
  if (mat === "foil") {
    const r = seeded(11), w = 10;
    for (let y = top; y < bot; y += 14) for (let i = 0; i < 2; i++) {
      const v = 160 + r() * 90 | 0;
      c.fillStyle = "rgb(" + v + "," + (v + 4) + "," + (v + 10) + ")";
      c.beginPath(); c.moveTo(x - w / 2 + i * w / 2, y); c.lineTo(x + i * w / 2 + r() * 3, y + 7 + r() * 4); c.lineTo(x - w / 2 + i * w / 2 + r() * 2, y + 15); c.lineTo(x - w / 2 + i * w / 2 - 1, y + 8); c.closePath(); c.fill();
    }
    c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 4, top); c.lineTo(x - 3, bot); c.stroke();
  } else if (mat === "card") {
    c.fillStyle = lg(c, x - 11, 0, x + 11, 0, [[0, "#8a5a2b"], [0.15, "#c08a52"], [0.5, "#d4a06a"], [0.85, "#b07a44"], [1, "#7a4c22"]]);
    c.fillRect(x - 11, top, 22, H);
    c.strokeStyle = "rgba(90,55,20,.5)"; c.lineWidth = 1.2;  // ondulația cartonului
    c.beginPath(); for (let y = top; y <= bot; y += 2) c.lineTo(x + Math.sin(y / 3) * 6, y); c.stroke();
    c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(x - 9, top, 3, H);
  } else if (mat === "egg") {
    c.fillStyle = lg(c, x - 22, 0, x + 22, 0, [[0, "#9c8b6e"], [0.5, "#d8cbb0"], [1, "#a8977a"]]);
    c.fillRect(x - 14, top, 20, H);
    for (let y = top + 12; y < bot - 6; y += 24) {
      c.fillStyle = rg(c, x + 8, y - 4, 1, x + 8, y, 15, [[0, "#f1e7d2"], [0.6, "#cdbd9c"], [1, "#8f7c5d"]]);
      c.beginPath(); c.ellipse(x + 6, y, 16, 11, 0, -Math.PI / 2, Math.PI / 2); c.fill();
      c.fillStyle = "rgba(60,45,25,.35)"; c.beginPath(); c.ellipse(x + 2, y + 12, 7, 3, 0, 0, Math.PI * 2); c.fill();
    }
  } else if (mat === "pillow") {
    c.fillStyle = rg(c, x - 12, top + H * 0.35, 4, x, top + H / 2, H * 0.6, [[0, "#ffffff"], [0.5, "#e8eef8"], [1, "#a9b8d0"]]);
    c.beginPath(); c.moveTo(x - 30, top + 12);
    c.quadraticCurveTo(x - 4, top - 6, x + 30, top + 12);
    c.quadraticCurveTo(x + 44, top + H / 2, x + 30, bot - 12);
    c.quadraticCurveTo(x - 4, bot + 6, x - 30, bot - 12);
    c.quadraticCurveTo(x - 44, top + H / 2, x - 30, top + 12); c.fill();
    c.strokeStyle = "rgba(100,120,150,.45)"; c.lineWidth = 1.5; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(x - 24, top + 16); c.quadraticCurveTo(x - 36, top + H / 2, x - 24, bot - 16); c.stroke(); c.setLineDash([]);
    c.strokeStyle = "rgba(100,120,150,.25)"; c.lineWidth = 1;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x - 10 + i * 6, top + 20); c.quadraticCurveTo(x + i * 6, top + H / 2, x - 8 + i * 6, bot - 20); c.stroke(); }
  }
};

/* --- lingurița --- */
ART.spoon = function (c, x, y, ang) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.strokeStyle = CHROME(c, 0, -3, 0, 3); c.lineWidth = 4; c.lineCap = "round";
  c.beginPath(); c.moveTo(0, 0); c.lineTo(62, 0); c.stroke(); c.lineCap = "butt";
  c.fillStyle = rg(c, -4, -3, 1, 0, 0, 12, [[0, "#ffffff"], [0.4, "#cfd6de"], [1, "#6b7686"]]);
  c.beginPath(); c.ellipse(-6, 0, 11, 7, 0, 0, Math.PI * 2); c.fill();
  c.restore();
};

/* --- suflul (aerul care trece peste gura sticlei) --- */
ART.breath = function (c, x, y, k) {
  c.strokeStyle = "rgba(160,190,220," + (0.7 * k) + ")"; c.lineWidth = 2; c.lineCap = "round";
  for (let i = 0; i < 3; i++) { const yy = y - 6 + i * 6; c.beginPath(); c.moveTo(x - 46, yy); c.bezierCurveTo(x - 25, yy - 6, x - 10, yy + 6, x + 22, yy - 2 + i); c.stroke(); }
  c.lineCap = "butt";
};

/* --- paharul sau sticla din sticlă, cu apă colorată --- */
ART.vessel = function (c, x, yTop, yBot, wTop, wBot, water, color, mode, shake, glow, ripple, dark) {
  x += Math.sin(performance.now() / 16) * 3 * shake;
  const H = yBot - yTop;
  // umbra
  c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(x + 4, yBot + 3, wBot * 0.62, 7, 0, 0, Math.PI * 2); c.fill();
  if (glow) { c.save(); c.shadowColor = color; c.shadowBlur = 34 * glow; c.fillStyle = rgba(color, 0.25 * glow); c.beginPath(); c.ellipse(x, yBot - H / 2, wTop * 0.6, H * 0.55, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
  let wy;
  if (mode === "blow") {
    const neckW = wTop * 0.3, shoulder = yTop + H * 0.3, neckEnd = yTop + H * 0.13;
    const half = (y) => y >= shoulder ? wBot / 2 : y >= neckEnd ? lerp(neckW / 2, wBot / 2, Math.sin(((y - neckEnd) / (shoulder - neckEnd)) * Math.PI / 2)) : neckW / 2;
    const path = (inset) => {
      c.beginPath(); c.moveTo(x - half(yTop) + inset, yTop);
      for (let y = yTop; y <= yBot - 10; y += 3) c.lineTo(x - half(y) + inset, y);
      c.quadraticCurveTo(x - wBot / 2 + inset, yBot - inset, x - wBot / 2 + 10, yBot - inset);
      c.lineTo(x + wBot / 2 - 10, yBot - inset); c.quadraticCurveTo(x + wBot / 2 - inset, yBot - inset, x + wBot / 2 - inset, yBot - 10);
      for (let y = yBot - 10; y >= yTop; y -= 3) c.lineTo(x + half(y) - inset, y);
      c.closePath();
    };
    // sticla verzuie
    path(0);
    c.fillStyle = lg(c, x - wBot / 2, 0, x + wBot / 2, 0, [[0, "rgba(90,140,110,.55)"], [0.15, "rgba(200,235,215,.25)"], [0.5, "rgba(220,245,230,.12)"], [0.85, "rgba(170,210,190,.3)"], [1, "rgba(70,120,95,.6)"]]);
    c.fill();
    // apa
    wy = yBot - 6 - water * (H - 22);
    if (water > 0.005) {
      c.save(); path(3); c.clip();
      c.fillStyle = lg(c, x - wBot / 2, 0, x + wBot / 2, 0, [[0, shade(color, -0.35)], [0.3, color], [0.55, shade(color, 0.25)], [1, shade(color, -0.4)]]);
      c.globalAlpha = 0.8; c.fillRect(x - wBot, wy, wBot * 2, yBot - wy); c.globalAlpha = 1;
      const hw = half(wy) - 3;
      c.fillStyle = shade(color, 0.45); c.beginPath(); c.ellipse(x, wy, hw, Math.min(5, hw * 0.18) + (ripple ? Math.sin(performance.now() / 40) * ripple : 0), 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    // contur, buza gâtului, reflexii
    path(0); c.strokeStyle = dark ? "rgba(190,230,210,.65)" : "rgba(40,90,65,.7)"; c.lineWidth = 2.2; c.stroke();
    c.fillStyle = lg(c, x - neckW / 2 - 3, 0, x + neckW / 2 + 3, 0, [[0, "rgba(60,110,85,.8)"], [0.4, "rgba(220,245,230,.8)"], [1, "rgba(60,110,85,.8)"]]);
    c.fillRect(x - neckW / 2 - 3, yTop - 2, neckW + 6, 9);
    c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 4; c.lineCap = "round";
    c.beginPath(); c.moveTo(x - wBot / 2 + 9, shoulder + 8); c.lineTo(x - wBot / 2 + 9, yBot - 18); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.moveTo(x - neckW / 2 + 4, yTop + 10); c.lineTo(x - neckW / 2 + 4, neckEnd); c.stroke();
    c.strokeStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.moveTo(x + wBot / 2 - 8, shoulder + 14); c.lineTo(x + wBot / 2 - 8, yBot - 30); c.stroke();
    c.lineCap = "butt";
  } else {
    const half = (y) => lerp(wBot / 2, wTop / 2, (yBot - y) / H);
    const baseH = 12, rimRy = Math.max(4, wTop * 0.09);
    // corpul de sticlă
    c.beginPath(); c.moveTo(x - wTop / 2, yTop); c.lineTo(x - wBot / 2, yBot); c.ellipse(x, yBot, wBot / 2, rimRy * 0.8, 0, Math.PI, 0, true); c.lineTo(x + wTop / 2, yTop); c.closePath();
    c.fillStyle = lg(c, x - wTop / 2, 0, x + wTop / 2, 0, [[0, "rgba(150,180,205,.45)"], [0.12, "rgba(235,245,252,.25)"], [0.5, "rgba(245,250,255,.1)"], [0.88, "rgba(220,235,248,.25)"], [1, "rgba(140,170,200,.5)"]]);
    c.fill();
    // apa
    wy = yBot - baseH - water * (H - baseH - 10);
    if (water > 0.005) {
      const hwT = half(wy) - 3, hwB = wBot / 2 - 3, rp = ripple ? Math.sin(performance.now() / 40) * 2.5 * ripple : 0;
      c.beginPath(); c.moveTo(x - hwT, wy); c.lineTo(x - hwB, yBot - baseH); c.ellipse(x, yBot - baseH, hwB, rimRy * 0.7, 0, Math.PI, 0, true); c.lineTo(x + hwT, wy); c.closePath();
      c.fillStyle = lg(c, x - hwT, 0, x + hwT, 0, [[0, shade(color, -0.35)], [0.25, color], [0.5, shade(color, 0.2)], [1, shade(color, -0.45)]]);
      c.globalAlpha = 0.78; c.fill(); c.globalAlpha = 1;
      // suprafața apei (menisc)
      c.fillStyle = lg(c, 0, wy - 4, 0, wy + 4, [[0, shade(color, 0.6)], [1, shade(color, 0.15)]]);
      c.beginPath(); c.ellipse(x, wy, hwT, rimRy * 0.75 + rp, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1; c.stroke();
    }
    // fundul gros de sticlă
    c.fillStyle = lg(c, 0, yBot - baseH, 0, yBot + 4, [[0, "rgba(200,225,240,.35)"], [1, "rgba(150,185,210,.65)"]]);
    c.beginPath(); c.ellipse(x, yBot - baseH, wBot / 2 - 2, rimRy * 0.7, 0, 0, Math.PI); c.lineTo(x + wBot / 2, yBot); c.ellipse(x, yBot, wBot / 2, rimRy * 0.8, 0, 0, Math.PI); c.closePath(); c.fill();
    // contur
    c.strokeStyle = dark ? "rgba(210,230,250,.7)" : "rgba(70,100,135,.7)"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x - wTop / 2, yTop); c.lineTo(x - wBot / 2, yBot); c.ellipse(x, yBot, wBot / 2, rimRy * 0.8, 0, Math.PI, 0, true); c.lineTo(x + wTop / 2, yTop); c.stroke();
    // buza paharului
    c.strokeStyle = dark ? "rgba(225,240,255,.85)" : "rgba(90,120,150,.8)"; c.lineWidth = 2.5;
    c.beginPath(); c.ellipse(x, yTop, wTop / 2, rimRy, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, yTop + 1, wTop / 2 - 3, rimRy - 1.5, 0, Math.PI * 1.05, Math.PI * 1.7); c.stroke();
    // reflexii verticale
    c.lineCap = "round";
    c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 5;
    c.beginPath(); c.moveTo(x - half(yTop + 20) + 10, yTop + 20); c.lineTo(x - half(yBot - 26) + 9, yBot - 26); c.stroke();
    c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x - half(yTop + 30) + 19, yTop + 30); c.lineTo(x - half(yBot - 40) + 18, yBot - 40); c.stroke();
    c.beginPath(); c.moveTo(x + half(yTop + 40) - 8, yTop + 40); c.lineTo(x + half(yBot - 50) - 8, yBot - 50); c.stroke();
    c.lineCap = "butt";
  }
  return wy;
};

/* --- cutia de pantofi din carton, văzută de sus --- */
ART.shoebox = function (c, x, y, w, h, hx, hy, hrx, hry) {
  c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x + 8, y + 10, w, h);
  // pereții (exterior)
  c.fillStyle = lg(c, 0, y, 0, y + h, [[0, "#d7b07c"], [1, "#b8875a"]]); c.fillRect(x, y, w, h);
  // interiorul cu pereți în perspectivă
  const t = 16;
  c.fillStyle = "#9d7046"; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w - t, y + t); c.lineTo(x + t, y + t); c.closePath(); c.fill();
  c.fillStyle = "#a97a4d"; c.beginPath(); c.moveTo(x, y); c.lineTo(x + t, y + t); c.lineTo(x + t, y + h - t); c.lineTo(x, y + h); c.closePath(); c.fill();
  c.fillStyle = "#c99a68"; c.beginPath(); c.moveTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x + w - t, y + h - t); c.lineTo(x + w - t, y + t); c.closePath(); c.fill();
  c.fillStyle = "#d6aa76"; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w, y + h); c.lineTo(x + w - t, y + h - t); c.lineTo(x + t, y + h - t); c.closePath(); c.fill();
  // fundul cutiei
  c.fillStyle = lg(c, x, y, x + w, y + h, [[0, "#c69564"], [1, "#b98856"]]); c.fillRect(x + t, y + t, w - 2 * t, h - 2 * t);
  // fibra cartonului
  const r = seeded(3); c.fillStyle = "rgba(90,60,30,.08)";
  for (let i = 0; i < 260; i++) c.fillRect(x + t + r() * (w - 2 * t), y + t + r() * (h - 2 * t), 3 + r() * 6, 1);
  // gaura decupată, cu margini neregulate
  c.save();
  c.beginPath();
  const rr2 = seeded(5);
  for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2, j = 1 + (rr2() - 0.5) * 0.03; const px = hx + Math.cos(a) * hrx * j, py = hy + Math.sin(a) * hry * j; i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.closePath();
  c.fillStyle = rg(c, hx, hy - hry * 0.3, 4, hx, hy, hrx, [[0, "#1b120b"], [0.8, "#120b06"], [1, "#3a2615"]]); c.fill();
  c.strokeStyle = "#e7c391"; c.lineWidth = 2; c.stroke();
  c.restore();
  // marginile pereților
  c.strokeStyle = "rgba(70,45,20,.35)"; c.lineWidth = 1.5; c.strokeRect(x, y, w, h); c.strokeRect(x + t, y + t, w - 2 * t, h - 2 * t);
};

/* --- șurub (unde e legat elasticul) --- */
ART.screw = function (c, x, y, r = 9) {
  c.fillStyle = rg(c, x - r * 0.35, y - r * 0.4, 1, x, y, r, [[0, "#ffffff"], [0.45, "#aab3bf"], [1, "#4b5563"]]);
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#374151"; c.lineWidth = 2; c.beginPath(); c.moveTo(x - r * 0.6, y - r * 0.2); c.lineTo(x + r * 0.6, y + r * 0.2); c.stroke();
};

/* --- creion (căluș), vertical: vârful sus, guma jos --- */
ART.pencil = function (c, x, top, bot, w = 18) {
  c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(x - w / 2 + 6, top + 10, w, bot - top);
  const tipL = 34, ferr = 14, eras = 16;
  // corpul hexagonal: trei fețe
  c.fillStyle = "#e0a800"; c.fillRect(x - w / 2, top + tipL, w / 3, bot - top - tipL - ferr - eras);
  c.fillStyle = "#facc15"; c.fillRect(x - w / 6, top + tipL, w / 3, bot - top - tipL - ferr - eras);
  c.fillStyle = "#fde047"; c.fillRect(x + w / 6, top + tipL, w / 3, bot - top - tipL - ferr - eras);
  c.fillStyle = "rgba(255,255,255,.4)"; c.fillRect(x - w / 6 + 1, top + tipL, 2, bot - top - tipL - ferr - eras);
  // lemnul ascuțit și mina
  c.fillStyle = lg(c, x - w / 2, 0, x + w / 2, 0, [[0, "#c9955a"], [0.5, "#f1cf9a"], [1, "#b98446"]]);
  c.beginPath(); c.moveTo(x - w / 2, top + tipL); c.lineTo(x, top + 4); c.lineTo(x + w / 2, top + tipL);
  for (let i = 0; i <= 6; i++) c.lineTo(x + w / 2 - i * w / 6, top + tipL + (i % 2 ? -3 : 0));
  c.closePath(); c.fill();
  c.fillStyle = "#374151"; c.beginPath(); c.moveTo(x - 4, top + 13); c.lineTo(x, top + 2); c.lineTo(x + 4, top + 13); c.closePath(); c.fill();
  // virola metalică și guma
  const fy = bot - ferr - eras;
  c.fillStyle = CHROME(c, x - w / 2, 0, x + w / 2, 0); c.fillRect(x - w / 2 - 1, fy, w + 2, ferr);
  c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 1; for (let i = 3; i < ferr; i += 4) { c.beginPath(); c.moveTo(x - w / 2, fy + i); c.lineTo(x + w / 2, fy + i); c.stroke(); }
  c.fillStyle = lg(c, x - w / 2, 0, x + w / 2, 0, [[0, "#e47a92"], [0.5, "#f8a5b8"], [1, "#d26a83"]]);
  c.beginPath(); c.moveTo(x - w / 2, fy + ferr); c.lineTo(x + w / 2, fy + ferr); c.lineTo(x + w / 2, bot - 4); c.quadraticCurveTo(x + w / 2, bot, x + w / 2 - 4, bot); c.lineTo(x - w / 2 + 4, bot); c.quadraticCurveTo(x - w / 2, bot, x - w / 2, bot - 4); c.closePath(); c.fill();
};

/* --- elasticul (o bandă de cauciuc cu luciu) --- */
ART.bandPath = function (c, pts, lw) {
  const draw = () => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); };
  c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = lw; c.save(); c.translate(3, 5); draw(); c.restore();
  c.strokeStyle = "#b45309"; c.lineWidth = lw; draw();
  c.strokeStyle = "#ea7a22"; c.lineWidth = lw * 0.6; draw();
  c.strokeStyle = "rgba(255,220,180,.7)"; c.lineWidth = Math.max(1, lw * 0.18); c.save(); c.translate(0, -lw * 0.22); draw(); c.restore();
  c.lineCap = "butt"; c.lineJoin = "miter";
};

/* --- clopotul de sticlă (borcanul) cu placa de bază --- */
ART.belljarBack = function (c, x, top, w, bot, dark) {
  // placa de bază metalică
  c.fillStyle = CHROME(c, 0, bot - 8, 0, bot + 22); c.beginPath(); c.ellipse(x + w / 2, bot + 6, w / 2 + 40, 16, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#475569"; c.fillRect(x - 40, bot + 6, w + 80, 12);
  c.fillStyle = CHROME(c, 0, bot - 8, 0, bot + 8); c.beginPath(); c.ellipse(x + w / 2, bot + 4, w / 2 + 40, 14, 0, 0, Math.PI * 2); c.fill();
  // garnitura de cauciuc
  c.strokeStyle = "#1f2937"; c.lineWidth = 5; c.beginPath(); c.ellipse(x + w / 2, bot + 2, w / 2 + 4, 9, 0, 0, Math.PI * 2); c.stroke();
  // fundalul interior, puțin întunecat
  c.fillStyle = dark ? "rgba(150,190,230,.05)" : "rgba(180,210,235,.15)";
  ART._jarPath(c, x, top, w, bot); c.fill();
};
ART._jarPath = function (c, x, top, w, bot) {
  const r = w / 2;
  c.beginPath(); c.moveTo(x, bot); c.lineTo(x, top + r * 0.75);
  c.bezierCurveTo(x, top - r * 0.05, x + w, top - r * 0.05, x + w, top + r * 0.75);
  c.lineTo(x + w, bot); c.closePath();
};
ART.belljarFront = function (c, x, top, w, bot, dark) {
  ART._jarPath(c, x, top, w, bot);
  c.fillStyle = lg(c, x, 0, x + w, 0, [[0, "rgba(160,195,225,.35)"], [0.08, "rgba(230,245,255,.12)"], [0.5, "rgba(255,255,255,.03)"], [0.92, "rgba(230,245,255,.12)"], [1, "rgba(150,185,215,.4)"]]);
  c.fill();
  c.strokeStyle = dark ? "rgba(200,230,255,.6)" : "rgba(80,120,160,.6)"; c.lineWidth = 3; c.stroke();
  // mânerul de sus
  const kx = x + w / 2, ky = top + w * 0.17;
  c.fillStyle = lg(c, kx - 14, 0, kx + 14, 0, [[0, "rgba(140,180,210,.7)"], [0.4, "rgba(240,250,255,.8)"], [1, "rgba(120,160,195,.7)"]]);
  c.beginPath(); c.moveTo(kx - 10, ky + 4); c.lineTo(kx - 7, ky - 14); c.arc(kx, ky - 18, 13, Math.PI * 0.85, Math.PI * 0.15); c.lineTo(kx + 10, ky + 4); c.closePath(); c.fill();
  // reflexii
  c.lineCap = "round";
  c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 8;
  c.beginPath(); c.moveTo(x + 22, top + w * 0.5); c.quadraticCurveTo(x + 18, (top + bot) / 2, x + 22, bot - 30); c.stroke();
  c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 3;
  c.beginPath(); c.moveTo(x + 40, top + w * 0.3); c.quadraticCurveTo(x + 60, top + w * 0.12, x + 95, top + w * 0.08); c.stroke();
  c.beginPath(); c.moveTo(x + w - 18, top + w * 0.6); c.lineTo(x + w - 18, bot - 50); c.stroke();
  c.lineCap = "butt";
};

/* --- soneria electrică: suport, clopot de alamă, ciocănel, electromagnet --- */
ART.bell = function (c, cx, cy, R, sx, hammer, floor) {
  // suportul
  c.fillStyle = CHROME(c, cx - 4, 0, cx + 4, 0); c.fillRect(cx - 4, cy + R * 0.2, 8, (floor || cy + 120) - cy - R * 0.2);
  c.fillStyle = CHROME(c, cx - 30, 0, cx + 30, 0); c.beginPath(); c.ellipse(cx, (floor || cy + 120), 30, 7, 0, 0, Math.PI * 2); c.fill();
  // clopotul (calota de alamă văzută din lateral)
  c.save(); c.translate(sx, 0);
  c.fillStyle = lg(c, cx - R, 0, cx + R, 0, [[0, "#7a4b05"], [0.18, "#c98a12"], [0.38, "#ffe7a3"], [0.5, "#f2b632"], [0.8, "#a86c08"], [1, "#5e3804"]]);
  c.beginPath(); c.moveTo(cx - R, cy + R * 0.25); c.bezierCurveTo(cx - R, cy - R * 0.9, cx + R, cy - R * 0.9, cx + R, cy + R * 0.25); c.closePath(); c.fill();
  c.fillStyle = lg(c, 0, cy + R * 0.18, 0, cy + R * 0.36, [[0, "#f6c453"], [1, "#7a4b05"]]);
  c.beginPath(); c.ellipse(cx, cy + R * 0.25, R, R * 0.13, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = CHROME(c, cx - 6, 0, cx + 6, 0); c.beginPath(); c.arc(cx, cy - R * 0.62, 6, 0, Math.PI * 2); c.fill();
  c.restore();
  // electromagnetul (bobină de cupru)
  const ex = cx + R * 1.45, ey = cy + R * 0.95;
  c.fillStyle = "#334155"; c.fillRect(ex - 22, ey - 4, 44, (floor || ey + 42) - ey + 4);
  for (let i = 0; i < 2; i++) {
    const bx = ex - 16 + i * 20;
    c.fillStyle = lg(c, bx, 0, bx + 12, 0, [[0, "#7c2d12"], [0.4, "#f59e0b"], [0.6, "#fdba74"], [1, "#7c2d12"]]);
    c.fillRect(bx, ey - 30, 12, 28);
    c.strokeStyle = "rgba(90,30,0,.5)"; c.lineWidth = 1; for (let y = ey - 28; y < ey - 2; y += 3) { c.beginPath(); c.moveTo(bx, y); c.lineTo(bx + 12, y); c.stroke(); }
  }
  // brațul ciocănelului
  const ang = -0.45 + hammer * 0.45;
  c.save(); c.translate(ex, ey - 34); c.rotate(ang);
  c.strokeStyle = CHROME(c, 0, -3, 0, 3); c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(-R * 1.05, -R * 0.15); c.stroke();
  c.fillStyle = rg(c, -R * 1.05 - 3, -R * 0.15 - 3, 1, -R * 1.05, -R * 0.15, 9, [[0, "#fff"], [0.4, "#94a3b8"], [1, "#1e293b"]]);
  c.beginPath(); c.arc(-R * 1.05, -R * 0.15, 9, 0, Math.PI * 2); c.fill();
  c.restore();
};

/* --- pompa de vid cu manometru --- */
ART.pump = function (c, x, y, w, h, air, piston) {
  c.fillStyle = "rgba(0,0,0,.22)"; c.fillRect(x + 6, y + h - 2, w, 8);
  // corpul
  c.fillStyle = lg(c, x, 0, x + w, 0, [[0, "#1e3a5f"], [0.25, "#2f5a8f"], [0.5, "#24476f"], [1, "#132841"]]);
  if (c.roundRect) { c.beginPath(); c.roundRect(x, y + 40, w, h - 40, 8); c.fill(); } else c.fillRect(x, y + 40, w, h - 40);
  // aripioare de răcire
  c.strokeStyle = "rgba(255,255,255,.12)"; c.lineWidth = 2; for (let yy = y + 100; yy < y + h - 10; yy += 8) { c.beginPath(); c.moveTo(x + 10, yy); c.lineTo(x + w - 10, yy); c.stroke(); }
  // cilindrul cu piston
  c.fillStyle = CHROME(c, x + w - 34, 0, x + w - 12, 0); c.fillRect(x + w - 34, y + 4 - piston, 22, 40 + piston);
  c.fillStyle = "#0f172a"; c.fillRect(x + w - 38, y - 2 - piston, 30, 8);
  // manometrul
  const gx = x + w / 2 - 12, gy = y + 66, R = 28;
  c.fillStyle = CHROME(c, gx - R, gy - R, gx + R, gy + R); c.beginPath(); c.arc(gx, gy, R + 4, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#fbfaf5"; c.beginPath(); c.arc(gx, gy, R, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#dc2626"; c.lineWidth = 4; c.beginPath(); c.arc(gx, gy, R - 5, Math.PI * 0.75, Math.PI * 0.95); c.stroke();
  c.strokeStyle = "#1f2937"; c.lineWidth = 1.2;
  for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.75 + i / 10 * Math.PI * 1.5; c.beginPath(); c.moveTo(gx + Math.cos(a) * (R - 3), gy + Math.sin(a) * (R - 3)); c.lineTo(gx + Math.cos(a) * (R - (i % 5 ? 8 : 11)), gy + Math.sin(a) * (R - (i % 5 ? 8 : 11))); c.stroke(); }
  const na = Math.PI * 0.75 + air * Math.PI * 1.5;
  c.strokeStyle = "#b91c1c"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + Math.cos(na) * (R - 7), gy + Math.sin(na) * (R - 7)); c.stroke();
  c.fillStyle = "#111"; c.beginPath(); c.arc(gx, gy, 3.5, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(gx - 8, gy - 12, 12, 6, -0.5, 0, Math.PI * 2); c.fill();
  // întrerupătorul
  c.fillStyle = "#16a34a"; c.beginPath(); c.arc(x + w - 20, y + 120, 7, 0, Math.PI * 2); c.fill();
};
ART.hose = function (c, pts) {
  const draw = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); c.stroke(); };
  c.lineCap = "round";
  c.strokeStyle = "#111827"; c.lineWidth = 13; draw();
  c.strokeStyle = "#374151"; c.lineWidth = 8; draw();
  c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 2; c.save(); c.translate(0, -3); draw(); c.restore();
  c.lineCap = "butt";
};

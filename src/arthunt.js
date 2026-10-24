// 그림 속 숨은그림 (10판, 10/23 사용자 메모: "전시된 그림 하나는 2D 숨은그림 찾기" — 그림 누르면 그 안 2D 그림에서 물건 찾기).
// The museum's 별밤 그림 opens big, in its gilt frame: three things are painted into it (a key among the stars, a fish in the swirl,
// 먹물이 in the dark cypress — only its eyes give it away), shown as cards below. Tap one in the picture: a ring, its card ticks.
// In the 흑백 museum the picture starts grey and each find brings a third of its colour back. All three: "다 찾았다!" and it
// closes; the stage colours the painting, pays like 몽글 TV and swings it open. ✕ closes it; the finds so far are kept.
import { paintCanvas } from './gfx/museum-props.js';
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
const TXT = { look: K('그림 속에서 찾아 봐!', 'Find them in the painting!'), fish: K('생선', 'Fish'), zoom: K('두 손가락으로 확대 · 두 번 터치하면 2배', 'Pinch to zoom · touch twice for 2×') };

const W = 640, H = 400;
const ink = '#2a1d33';
// the things: where they are in the picture, how far a tap may miss, and how they are drawn (camouflaged in the picture,
// plain on their card)
const THINGS = [
  { id: 'key', name: '열쇠', x: 512, y: 236, r: 40, draw: (c, x, y, s, card) => {
    c.save(); c.translate(x, y); c.rotate(-.45); c.scale(s, s);
    c.fillStyle = card ? '#ffc93a' : '#ffd84a'; c.strokeStyle = card ? ink : 'rgba(255,240,160,.55)'; c.lineWidth = card ? 3 : 2;
    c.beginPath(); c.arc(-12, 0, 9, 0, 7); c.fill(); c.stroke();
    c.fillRect(-4, -3, 26, 6); c.strokeRect(-4, -3, 26, 6);
    c.fillRect(14, 3, 4, 6); c.fillRect(20, 3, 3, 5);
    c.fillStyle = card ? '#fff6c0' : '#2c4ea6'; c.beginPath(); c.arc(-12, 0, 3.5, 0, 7); c.fill();
    c.restore();
  } },
  { id: 'fish', name: '생선', x: 236, y: 112, r: 40, draw: (c, x, y, s, card) => {
    c.save(); c.translate(x, y); c.rotate(.15); c.scale(s, s);
    c.fillStyle = card ? '#8fb3ee' : '#6f9be0'; c.strokeStyle = card ? ink : '#9fc0f2'; c.lineWidth = card ? 3 : 2.5;
    c.beginPath(); c.ellipse(0, 0, 18, 9, 0, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(15, 0); c.lineTo(27, -9); c.lineTo(27, 9); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = card ? ink : '#cfe0ff'; c.beginPath(); c.arc(-10, -2, 2.2, 0, 7); c.fill();
    c.restore();
  } },
  { id: 'inky', name: '먹물이', x: 64, y: 236, r: 38, draw: (c, x, y, s, card) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = card ? '#5b4a8a' : '#1c2a2a';
    c.beginPath(); c.moveTo(-13, 10); c.bezierCurveTo(-16, -14, 16, -14, 13, 10); c.quadraticCurveTo(8, 6, 4, 11); c.quadraticCurveTo(0, 6, -4, 11); c.quadraticCurveTo(-8, 6, -13, 10); c.fill();
    if (card) { c.strokeStyle = ink; c.lineWidth = 3; c.stroke(); }
    c.fillStyle = '#ffffff'; for (const sx of [-5, 5]) { c.beginPath(); c.ellipse(sx, -1, 3.2, 3.8, 0, 0, 7); c.fill(); }
    c.fillStyle = ink; for (const sx of [-4.4, 5.6]) { c.beginPath(); c.arc(sx, 0, 1.6, 0, 7); c.fill(); }
    c.restore();
  } },
];

// the painting itself, drawn here at 2.5× (user 10/24: "확대도 안 되고 디테일도 떨어지고 그림 퀄이 발퀄이야" — the room's 640×400 sheet
// was blown up): the same 별밤 몽글 마을 as on the wall, in a warm storybook hand — brush-stroke sky, layered swirls, stars with
// halos, a crescent moon, a cypress of flame strokes, rolling hills, a little village with lit windows and chimney smoke, a
// church spire, a canvas weave over all. A seeded random: the same picture every time. Drawn in 640×400 units (the caller scales).
const RES = 2.5;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function starryHD(c) {
  const R = rng(1889), PI = Math.PI;
  // sky: deep blue to a lighter band over the hills
  let g = c.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#16296b'); g.addColorStop(.55, '#2a4ea5'); g.addColorStop(1, '#4f74c4'); c.fillStyle = g; c.fillRect(0, 0, 640, 400);
  c.lineCap = 'round';
  // brush strokes over the whole sky, following a gentle flow (short curved dabs in five blues)
  const SKY = ['#1f3a8a', '#2c4ea6', '#3d63b8', '#5a86d0', '#7ea6e6', '#9fc0f2'];
  for (let i = 0; i < 1400; i++) {
    const x = R() * 640, y = R() * 290, a = Math.sin(x * .012 + y * .02) * 1.1 + Math.cos(y * .03) * .4, L = 6 + R() * 10;
    c.strokeStyle = SKY[(R() * SKY.length) | 0]; c.globalAlpha = .35 + R() * .5; c.lineWidth = 1.6 + R() * 2.2;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * L * .6, y + Math.sin(a) * L * .6 - 2, x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke();
  }
  c.globalAlpha = 1;
  // the great swirls: many thin turns, light inside to dark outside
  const swirl = (cx, cy, r0, turns, cols, sx = 1.6, sy = .7) => {
    cols.forEach((col, k) => {
      c.strokeStyle = col; c.lineWidth = 5 - k * 1.1; c.globalAlpha = .9 - k * .12;
      c.beginPath();
      for (let t = 0; t < turns * PI * 2; t += .05) { const r = (r0 - k * 7) * (1 - t / (turns * PI * 2 + 1)); const x = cx + Math.cos(t) * r * sx, y = cy + Math.sin(t) * r * sy; t ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    });
    c.globalAlpha = 1;
  };
  swirl(300, 150, 92, 1.7, ['#5e86d4', '#8fb3ee', '#cfe0ff', '#f2f7ff']);
  swirl(190, 118, 52, 1.3, ['#4f78c8', '#7ea6e6', '#bcd5f6']);
  swirl(420, 95, 34, 1.2, ['#4f78c8', '#9fc0f2', '#e6f0ff'], 1.4, .8);
  // wind ribbons between the swirls
  for (const [x0, y0, x1, y1] of [[60, 200, 260, 175], [330, 210, 560, 180], [120, 70, 260, 55], [440, 150, 620, 130]]) {
    for (let k = 0; k < 3; k++) { c.strokeStyle = ['#9fc0f2', '#d8e8ff', '#6f9be0'][k]; c.lineWidth = 3 - k * .6; c.beginPath(); c.moveTo(x0, y0 + k * 4); c.bezierCurveTo(x0 + 60, y0 - 30 + k * 4, x1 - 60, y1 + 30 + k * 4, x1, y1 + k * 4); c.stroke(); }
  }
  // stars: a glowing disc, two halo rings of short dabs, a soft light around
  const STARS = [[70, 60, 11], [150, 40, 9], [240, 70, 10], [400, 50, 12], [470, 120, 10], [110, 160, 9], [380, 200, 8], [230, 210, 9], [520, 190, 8], [30, 130, 8], [300, 30, 7], [600, 210, 7]];
  for (const [x, y, r] of STARS) {
    const gl = c.createRadialGradient(x, y, r * .3, x, y, r * 3.2); gl.addColorStop(0, 'rgba(255,240,170,.55)'); gl.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = gl; c.beginPath(); c.arc(x, y, r * 3.2, 0, 7); c.fill();
    for (const [rr, n, col] of [[r * 1.7, 18, '#ffe9a0'], [r * 2.4, 24, '#f6d870']]) for (let k = 0; k < n; k++) { const a = k / n * PI * 2; c.strokeStyle = col; c.lineWidth = 2.2; c.beginPath(); c.arc(x, y, rr, a, a + PI * 2 / n * .6); c.stroke(); }
    c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.fillStyle = '#ffeea0'; c.beginPath(); c.arc(x - r * .2, y - r * .2, r * .62, 0, 7); c.fill();
    c.fillStyle = '#fffbe6'; c.beginPath(); c.arc(x - r * .32, y - r * .32, r * .3, 0, 7); c.fill();
  }
  // the crescent moon in its rings
  { const x = 570, y = 60;
    for (let k = 0; k < 3; k++) { c.strokeStyle = ['rgba(255,200,90,.7)', 'rgba(255,220,120,.5)', 'rgba(255,230,150,.35)'][k]; c.lineWidth = 4 - k; c.beginPath(); c.arc(x, y, 40 + k * 9, 0, 7); c.stroke(); }
    c.fillStyle = '#ffb238'; c.beginPath(); c.arc(x, y, 30, 0, 7); c.fill(); c.fillStyle = '#ffd76a'; c.beginPath(); c.arc(x - 4, y - 3, 24, 0, 7); c.fill();
    c.fillStyle = '#20357f'; c.beginPath(); c.arc(x + 13, y - 7, 26, 0, 7); c.fill(); }
  // far hills with stroke texture, then the near hill
  const hill = (pts, col, col2) => {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, 400); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.lineTo(x, y)); c.lineTo(640, 400); c.fill();
    for (let i = 0; i < 260; i++) { const x = R() * 640, y = 250 + R() * 150; c.strokeStyle = col2; c.globalAlpha = .4; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8 + R() * 6, y - 1 - R() * 2); c.stroke(); }
    c.globalAlpha = 1;
  };
  hill([[0, 292], [80, 270], [170, 262], [260, 278], [360, 266], [470, 256], [560, 262], [640, 252]], '#2b3f7a', '#3d5596');
  // the village: houses of different heights, lit windows, roofs, chimney smoke; a church spire in the middle
  const VIL = [[176, 326, 32, 26, '#3a4f86'], [214, 318, 28, 30, '#455c96'], [248, 330, 30, 22, '#3a4f86'], [284, 322, 26, 30, '#506aa6'], [354, 318, 34, 30, '#ffe8f0', true], [394, 328, 28, 22, '#455c96'], [428, 320, 30, 30, '#3a4f86'], [466, 330, 26, 22, '#506aa6'], [500, 322, 32, 28, '#455c96']];
  // the spire behind
  c.fillStyle = '#2b3f7a'; c.fillRect(320, 286, 18, 44); c.beginPath(); c.moveTo(316, 288); c.lineTo(329, 236); c.lineTo(342, 288); c.fill();
  c.fillStyle = '#ffd84a'; c.fillRect(326, 300, 6, 8);
  for (const [x, y, w, h, col, pink] of VIL) {
    c.fillStyle = col; c.fillRect(x, y - h, w, h);
    c.fillStyle = pink ? '#ff6f9a' : '#26386b'; c.beginPath(); c.moveTo(x - 4, y - h); c.lineTo(x + w / 2, y - h - 16); c.lineTo(x + w + 4, y - h); c.fill();
    c.fillStyle = '#5a3c4a'; c.fillRect(x + w - 9, y - h - 14, 5, 9);
    for (let k = 0; k < 3; k++) { c.fillStyle = `rgba(220,230,255,${.35 - k * .1})`; c.beginPath(); c.arc(x + w - 6 + k * 5, y - h - 20 - k * 7, 3 + k * 1.5, 0, 7); c.fill(); }
    const rows = h > 25 ? 2 : 1;
    for (let r = 0; r < rows; r++) for (let q = 0; q < 2; q++) {
      const lit = R() < .7, wx = x + 5 + q * (w - 16), wy = y - h + 6 + r * 12;
      if (lit) { const gl = c.createRadialGradient(wx + 3, wy + 3, 1, wx + 3, wy + 3, 9); gl.addColorStop(0, 'rgba(255,220,120,.6)'); gl.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = gl; c.fillRect(wx - 6, wy - 6, 18, 18); }
      c.fillStyle = lit ? '#ffd84a' : '#1d2a55'; c.fillRect(wx, wy, 6, 6); c.fillStyle = 'rgba(40,30,60,.6)'; c.fillRect(wx + 2.5, wy, 1, 6);
    }
  }
  hill([[0, 342], [120, 324], [240, 338], [360, 330], [480, 342], [640, 322]], '#1f2f5e', '#2b3f7a');
  // a path of light dots down the near hill, little bushes
  for (let i = 0; i < 26; i++) { const t = i / 25, x = 600 - t * 260, y = 340 + t * 50 + Math.sin(t * 6) * 6; c.fillStyle = 'rgba(255,230,160,.5)'; c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill(); }
  for (const [x, y] of [[210, 360], [460, 352], [540, 372], [300, 378]]) { c.fillStyle = '#16301f'; c.beginPath(); c.ellipse(x, y, 14, 7, 0, 0, 7); c.fill(); c.fillStyle = '#2d5a3a'; c.beginPath(); c.ellipse(x - 3, y - 2, 8, 4, 0, 0, 7); c.fill(); }
  // the cypress: a dark body and tongues of flame-like strokes up it
  c.fillStyle = '#132b1c'; c.beginPath(); c.moveTo(40, 400);
  for (let k = 0; k <= 16; k++) { const t = k / 16; c.lineTo(70 + Math.sin(k * 1.7) * 14 - t * 12 - 28 * (1 - t), 400 - t * 330); }
  for (let k = 16; k >= 0; k--) { const t = k / 16; c.lineTo(70 + Math.cos(k * 1.3) * 14 + t * 6 + 28 * (1 - t), 400 - t * 330); }
  c.fill();
  for (let i = 0; i < 160; i++) {
    const t = R(), y = 400 - t * 320, w = 26 * (1 - t) + 6, x = 70 + (R() - .5) * w * 1.6;
    c.strokeStyle = ['#1f4a2c', '#2d5a3a', '#3f7048', '#16301f'][(R() * 4) | 0]; c.lineWidth = 2 + R() * 2;
    c.beginPath(); c.moveTo(x, y + 12); c.quadraticCurveTo(x + (R() - .5) * 10, y + 4, x + (R() - .5) * 6, y - 8); c.stroke();
  }
  // a canvas weave over everything (a fine cross-hatch of light and dark)
  c.globalAlpha = .022;
  for (let y = 0; y < 400; y += 1.6) { c.fillStyle = (y / 1.6) % 2 < 1 ? '#ffffff' : '#000000'; c.fillRect(0, y, 640, .4); }
  for (let x = 0; x < 640; x += 1.6) { c.fillStyle = (x / 1.6) % 2 < 1 ? '#ffffff' : '#000000'; c.fillRect(x, 0, .4, 400); }
  c.globalAlpha = .06; for (let i = 0; i < 2600; i++) { c.fillStyle = R() < .5 ? '#ffffff' : '#1a1030'; c.fillRect(R() * 640, R() * 400, .5, .5); }
  c.globalAlpha = 1;
  // a soft varnish edge
  g = c.createRadialGradient(320, 200, 200, 320, 200, 420); g.addColorStop(0, 'rgba(40,20,0,0)'); g.addColorStop(1, 'rgba(40,20,0,.32)'); c.fillStyle = g; c.fillRect(0, 0, 640, 400);
}

let css = false;
function style() {
  if (css) return; css = true;
  const s = document.createElement('style');
  s.textContent = `
.ah{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(42,20,60,.66);pointer-events:auto;touch-action:none;animation:fadein .2s}
.ah.out{opacity:0;transition:opacity .25s}
.ah-box{width:min(calc(100vw - 24px),560px);display:flex;flex-direction:column;gap:10px;align-items:stretch}
.ah-title{align-self:center;background:#fffaf2;border:3px solid #2b2030;border-radius:16px;padding:5px 16px;font-size:18px;color:#2b2030}
.ah-frame{position:relative;background:linear-gradient(135deg,#f0c76a,#c9973c 50%,#f0c76a);border:3px solid #2b2030;border-radius:10px;padding:12px;box-shadow:0 8px 0 -2px #8a6526}
.ah-pic{position:relative;border:2px solid #7a5a22;line-height:0}
.ah-pic{overflow:hidden;touch-action:none}
.ah-zoom{position:relative;transform-origin:0 0;line-height:0}
.ah-pic canvas{width:100%;height:auto;display:block;transition:filter .6s}
.ah-tip{align-self:center;font-size:13px;color:#fffaf2;opacity:.9}
.ah-ring{position:absolute;width:15%;aspect-ratio:1;border:4px solid #ff4f7b;border-radius:50%;translate:-50% -50%;box-shadow:0 0 0 3px #fff;animation:ahring .35s cubic-bezier(.2,1.6,.4,1)}
@keyframes ahring{0%{scale:2;opacity:0}100%{scale:1;opacity:1}}
.ah-miss{position:absolute;translate:-50% -50%;color:#fff;font:700 26px/1 sans-serif;text-shadow:0 0 3px #2b2030,0 0 3px #2b2030;pointer-events:none;animation:ahmiss .5s forwards}
@keyframes ahmiss{to{opacity:0;scale:1.4}}
.ah-cards{display:flex;gap:10px;justify-content:center}
.ah-card{position:relative;width:76px;background:#fffaf2;border:3px solid #2b2030;border-radius:14px;padding:4px 4px 2px;text-align:center;font-size:13px;color:#2b2030}
.ah-card canvas{width:64px;height:64px;display:block;margin:0 auto}
.ah-card.got{background:#d9f7c9}
.ah-card.got::after{content:'✔';position:absolute;right:-8px;top:-10px;width:26px;height:26px;border-radius:13px;background:#39b54a;color:#fff;border:3px solid #2b2030;font:700 15px/22px sans-serif}
.ah-x{position:absolute;right:-14px;top:-16px;width:38px;height:38px;border-radius:19px;border:3px solid #2b2030;background:#fffaf2;color:#2b2030;font:700 20px/30px sans-serif;padding:0}
.ah-done{position:absolute;left:50%;top:50%;translate:-50% -50%;background:#ffd23f;border:4px solid #2b2030;border-radius:18px;padding:8px 22px;font-size:26px;color:#2b2030;white-space:nowrap;animation:ahring .4s cubic-bezier(.2,1.6,.4,1)}`;
  document.head.append(s);
}

// open it; resolves true once all three are found (now or before), false when closed first. got: a Set kept by the stage
export function openArtHunt(G, { key = 'stars', got = new Set(), gray = false } = {}) {
  style();
  const c = document.createElement('canvas'); c.width = W * RES; c.height = H * RES;
  const g = c.getContext('2d'); g.scale(RES, RES);
  if (key === 'stars') starryHD(g); else { const src = paintCanvas(key); if (src) g.drawImage(src, 0, 0, W, H); }
  for (const t of THINGS) t.draw(g, t.x, t.y, 1, false);
  const grayNow = () => gray ? `grayscale(${1 - got.size / THINGS.length})` : 'none';
  c.style.filter = grayNow();
  const box = document.createElement('div'); box.className = 'ah-box';
  const title = document.createElement('div'); title.className = 'ah-title ol'; title.textContent = tr(TXT.look);
  const frame = document.createElement('div'); frame.className = 'ah-frame';
  // (a zoomable view: two fingers pinch, one drags, a double touch goes 2× there and back — never off the picture's edges)
  const zoom = document.createElement('div'); zoom.className = 'ah-zoom'; zoom.append(c);
  const inner = document.createElement('div'); inner.className = 'ah-pic'; inner.append(zoom);
  const x = document.createElement('button'); x.className = 'ah-x'; x.textContent = '✕';
  frame.append(inner, x);
  const cards = document.createElement('div'); cards.className = 'ah-cards';
  const cardOf = new Map();
  for (const t of THINGS) {
    const cd = document.createElement('div'); cd.className = 'ah-card' + (got.has(t.id) ? ' got' : '');
    const ic = document.createElement('canvas'); ic.width = ic.height = 128;
    const ig = ic.getContext('2d'); t.draw(ig, 64, 64, 2.6, true);
    const nm = document.createElement('div'); nm.textContent = tr(t.name);
    cd.append(ic, nm); cards.append(cd); cardOf.set(t.id, cd);
  }
  const tip = document.createElement('div'); tip.className = 'ah-tip'; tip.textContent = tr(TXT.zoom);
  box.append(title, frame, cards, tip);
  const bg = document.createElement('div'); bg.className = 'ah'; bg.append(box);
  const ringAt = t => { const r = document.createElement('div'); r.className = 'ah-ring'; r.style.left = (t.x / W * 100) + '%'; r.style.top = (t.y / H * 100) + '%'; zoom.append(r); };
  for (const t of THINGS) if (got.has(t.id)) ringAt(t);
  document.getElementById('overlay').append(bg);
  G.audio.sfx('flip');
  return new Promise(res => {
    let done = false;
    const end = ok => { if (done) return; done = true; bg.classList.add('out'); setTimeout(() => bg.remove(), 260); res(ok); };
    x.addEventListener('pointerdown', e => { e.stopPropagation(); G.audio.sfx('click'); end(got.size >= THINGS.length); });
    bg.addEventListener('pointerdown', e => e.stopPropagation());
    // the view: scale s (1–4) and the shift (tx, ty) in the frame's pixels, kept so the picture always fills the frame
    let s = 1, tx = 0, ty = 0;
    const box0 = () => inner.getBoundingClientRect();
    const apply = (anim = false) => {
      const b = box0(); s = Math.max(1, Math.min(4, s)); tx = Math.min(0, Math.max(b.width * (1 - s), tx)); ty = Math.min(0, Math.max(b.height * (1 - s), ty));
      zoom.style.transition = anim ? 'transform .22s ease-out' : 'none'; zoom.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    };
    const zoomAt = (cx, cy, s1, anim) => { const b = box0(), lx = cx - b.left, ly = cy - b.top; tx = lx - (lx - tx) * s1 / s; ty = ly - (ly - ty) * s1 / s; s = s1; apply(anim); };
    const P = new Map(); let pinch = null, pan = null, lastTap = null, missT = 0;
    inner.addEventListener('pointerdown', e => {
      e.stopPropagation(); if (done) return;
      try { inner.setPointerCapture?.(e.pointerId); } catch {}
      P.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now() });
      if (P.size === 2) { const [a, b] = [...P.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s0: s }; pan = null; }
      else if (P.size === 1) pan = { x: e.clientX, y: e.clientY, tx, ty, moved: false };
    });
    inner.addEventListener('pointermove', e => {
      const q = P.get(e.pointerId); if (!q) return; q.x = e.clientX; q.y = e.clientY;
      if (pinch && P.size >= 2) { const [a, b] = [...P.values()], d = Math.hypot(a.x - b.x, a.y - b.y); zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, pinch.s0 * d / Math.max(10, pinch.d), false); return; }
      if (pan) { const dx = e.clientX - pan.x, dy = e.clientY - pan.y; if (Math.hypot(dx, dy) > 8) pan.moved = true; if (pan.moved && s > 1) { tx = pan.tx + dx; ty = pan.ty + dy; apply(); } }
    });
    const lift = e => {
      const q = P.get(e.pointerId); P.delete(e.pointerId); if (!q) return;
      if (pinch) { if (P.size < 2) { pinch = null; const r = [...P.values()][0]; pan = r ? { x: r.x, y: r.y, tx, ty, moved: true } : null; } return; }
      const tap = pan && !pan.moved && performance.now() - q.t0 < 400; pan = null;
      if (tap && !done) onTap(e.clientX, e.clientY);
    };
    inner.addEventListener('pointerup', lift); inner.addEventListener('pointercancel', e => { P.delete(e.pointerId); pinch = null; pan = null; });
    inner.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, s * Math.exp(-e.deltaY * .002), false); }, { passive: false });
    const onTap = (cx, cy) => {
      const r = c.getBoundingClientRect();
      if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return;
      const px = (cx - r.left) / r.width * W, py = (cy - r.top) / r.height * H;
      // a second touch close by, soon: zoom 2× there (or back) — and the first touch's miss is let go
      if (lastTap && performance.now() - lastTap.t < 320 && Math.hypot(cx - lastTap.x, cy - lastTap.y) < 40) { clearTimeout(missT); lastTap = null; zoomAt(cx, cy, s > 1.3 ? 1 : 2, true); return; }
      lastTap = { t: performance.now(), x: cx, y: cy };
      const t = THINGS.find(q => !got.has(q.id) && Math.hypot(q.x - px, q.y - py) < q.r);
      if (!t) {
        if (THINGS.some(q => got.has(q.id) && Math.hypot(q.x - px, q.y - py) < q.r)) return;
        // (shown a moment later, so a double touch to zoom shows no miss)
        missT = setTimeout(() => { if (done) return; const m = document.createElement('div'); m.className = 'ah-miss'; m.textContent = '✕'; m.style.left = (px / W * 100) + '%'; m.style.top = (py / H * 100) + '%';
          zoom.append(m); setTimeout(() => m.remove(), 520); G.audio.sfx('wobble'); }, 330);
        return;
      }
      lastTap = null;
      got.add(t.id); ringAt(t); cardOf.get(t.id).classList.add('got'); c.style.filter = grayNow();
      G.audio.sfx('pop', 3 + got.size * 2);
      if (got.size >= THINGS.length) {
        G.audio.sfx('win');
        const d = document.createElement('div'); d.className = 'ah-done ol'; d.textContent = tr('다 찾았다!'); frame.append(d);
        setTimeout(() => end(true), 1100);
      }
    };
  });
}
export const ART_HUNT_N = THINGS.length;

// 그림 속 숨은그림 (10판, 10/23 사용자 메모: "전시된 그림 하나는 2D 숨은그림 찾기" — 그림 누르면 그 안 2D 그림에서 물건 찾기).
// The museum's 별밤 그림 opens big, in its gilt frame: three things are hidden in it (a key among the stars, a fish in the swirl,
// 먹물이 in the dark cypress), shown as cards below. Tap one in the picture: a ring, its card ticks. In the 흑백 museum the
// picture starts grey and each find brings a third of its colour back. All three: "다 찾았다!" and it closes; the stage colours
// the painting, pays like 몽글 TV and swings it open. ✕ closes it; the finds so far are kept.
// (10/24, user on 1.0.236: "이 그림이랑 아래 찾는 그림은 png로 만들어서 합성하게끔 gpt로 깔쌈하게") — no picture drawn in code any more:
// a background image (2000 px wide or more, sharp at 2×) and each thing its own see-through PNG laid into it by the numbers below
// (where, how big, turned, how see-through, how it mixes), the same PNG on its card. The images: art/museum/arthunt/ (GPT's, the
// prompts in _handoff/arthunt-gpt/; until they come, the earlier drawing saved as images).
import { paintCanvas } from './gfx/museum-props.js';
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
const TXT = { look: K('그림 속에서 찾아 봐!', 'Find them in the painting!'), fish: K('생선', 'Fish'), zoom: K('두 손가락으로 확대 · 두 번 터치하면 2배', 'Pinch to zoom · touch twice for 2×'), found: K('찾음', 'Got') };

const W = 640, H = 400;
// the things, in the 640×400 picture's units: where (x, y — its middle), how wide (size), turned (rot, radians), how see-through
// (alpha), how it mixes into the paint under it (blend: a canvas composite — 'source-over' plain, 'multiply' / 'overlay' / 'soft-light'
// to sink it in), how far a tap may miss (r)
const ART = 'art/museum/arthunt/', BG = 'bg.jpg';
const THINGS = [
  { id: 'key', name: '열쇠', src: 'key.png', x: 480, y: 80, size: 25, rot: -.9, alpha: .82, blend: 'source-over', r: 34 },
  { id: 'fish', name: '생선', src: 'fish.png', x: 322, y: 110, size: 38, rot: .55, alpha: .72, blend: 'source-over', r: 36 },
  { id: 'inky', name: '먹물이', src: 'inky.png', x: 98, y: 292, size: 24, rot: 0, alpha: .92, blend: 'source-over', r: 32 },
];
const IMG = new Map();
const load = src => IMG.get(src) || IMG.set(src, new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = ART + src; })).get(src);

let css = false;
function style() {
  if (css) return; css = true;
  const s = document.createElement('style');
  s.textContent = `
.ah{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(42,20,60,.66);pointer-events:auto;touch-action:none;animation:fadein .2s}
.ah.out{opacity:0;transition:opacity .25s}
.ah-box{width:min(calc(100vw - 24px),560px);display:flex;flex-direction:column;gap:10px;align-items:stretch}
.ah-title{align-self:center;background:#fffaf2;border:4px solid #2b2030;border-radius:18px;padding:7px 22px 6px;font-size:23px;font-weight:900;letter-spacing:.3px;color:#2b2030;box-shadow:0 4px 0 #2b2030;-webkit-text-stroke:0;text-shadow:none}
.ah-frame{position:relative;background:linear-gradient(135deg,#f0c76a,#c9973c 50%,#f0c76a);border:3px solid #2b2030;border-radius:10px;padding:12px;box-shadow:0 8px 0 -2px #8a6526}
.ah-pic{position:relative;border:2px solid #7a5a22;line-height:0}
.ah-pic{overflow:hidden;touch-action:none}
.ah-zoom{position:relative;transform-origin:0 0;line-height:0}
.ah-pic canvas{width:100%;height:auto;display:block;transition:filter .6s}
.ah-tip{align-self:center;font-size:13px;color:#fffaf2;opacity:.9}
.ah-ring{position:absolute;width:15%;aspect-ratio:1;border-radius:50%;translate:-50% -50%;border:3px dashed #ffe08a;box-shadow:0 0 0 2px rgba(43,32,48,.55),0 0 14px 4px rgba(255,214,106,.75),inset 0 0 12px rgba(255,214,106,.6);animation:ahring .45s cubic-bezier(.2,1.6,.4,1),ahspin 9s linear infinite}
@keyframes ahspin{to{rotate:360deg}}
@keyframes ahring{0%{scale:2;opacity:0}100%{scale:1;opacity:1}}
.ah-miss{position:absolute;translate:-50% -50%;color:#fff;font:700 26px/1 sans-serif;text-shadow:0 0 3px #2b2030,0 0 3px #2b2030;pointer-events:none;animation:ahmiss .5s forwards}
@keyframes ahmiss{to{opacity:0;scale:1.4}}
.ah-cards{display:flex;gap:12px;justify-content:center}
.ah-card{position:relative;width:84px;padding:6px 6px 0;border-radius:10px;background:linear-gradient(135deg,#f6d27a,#c9973c 48%,#f0c76a 70%,#b8862f);border:3px solid #2b2030;box-shadow:0 4px 0 #8a6526;text-align:center}
.ah-card .ah-cpic{position:relative;height:68px;border-radius:5px;border:2px solid #7a5a22;background:radial-gradient(circle at 50% 40%,#2f4f9e,#18296b);overflow:hidden}
.ah-card .ah-cpic::after{content:'';position:absolute;inset:0;background:linear-gradient(160deg,rgba(255,255,255,.18),rgba(255,255,255,0) 45%);pointer-events:none}
.ah-card .ah-name{margin:5px -6px 0;padding:3px 0 4px;background:#3b2440;color:#ffe9b0;font-size:13px;font-weight:900;border-radius:0 0 7px 7px;letter-spacing:.3px}
.ah-card img{width:100%;height:100%;display:block;object-fit:contain;transform:scale(1.18);filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}
.ah-card.got .ah-cpic{background:radial-gradient(circle at 50% 40%,#5a86d0,#2a4ea5)}
.ah-stamp{position:absolute;right:-12px;top:-12px;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#ff7a6b,#c8352d 70%);border:3px solid #7a1f1a;box-shadow:0 2px 0 #5a1612;color:#fff2d6;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;rotate:-14deg;animation:ahstamp .38s cubic-bezier(.2,1.8,.4,1)}
@keyframes ahstamp{0%{scale:2.4;opacity:0}60%{scale:.9;opacity:1}100%{scale:1}}
.ah-spark{position:absolute;width:8px;height:8px;left:50%;top:40%;pointer-events:none;background:#fff3b0;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);animation:ahspark .7s ease-out forwards}
@keyframes ahspark{to{translate:var(--dx) var(--dy);opacity:0;scale:.4}}

.ah-x{position:absolute;right:-14px;top:-16px;width:38px;height:38px;border-radius:19px;border:3px solid #2b2030;background:#fffaf2;color:#2b2030;font:700 20px/30px sans-serif;padding:0}
.ah-done{position:absolute;left:50%;bottom:9%;translate:-50% 0;z-index:3;pointer-events:none;animation:ahbanner .55s cubic-bezier(.2,1.5,.4,1)}
.ah-done .rb{position:relative;padding:8px 34px 9px;background:linear-gradient(180deg,#e5484d,#b8262e);border:3px solid #5a1612;border-radius:4px;box-shadow:0 5px 0 #5a1612;color:#fff6dc;font-size:27px;font-weight:900;letter-spacing:1px;white-space:nowrap;text-shadow:0 2px 0 #7a1f1a}
.ah-done .rb::before,.ah-done .rb::after{content:'';position:absolute;top:10px;width:30px;height:100%;background:#a3232a;border:3px solid #5a1612;z-index:-1}
.ah-done .rb::before{left:-22px;clip-path:polygon(0 0,100% 0,100% 100%,0 100%,28% 50%)}
.ah-done .rb::after{right:-22px;clip-path:polygon(0 0,100% 0,72% 50%,100% 100%,0 100%)}
@keyframes ahbanner{0%{scale:.3 1;opacity:0}100%{scale:1;opacity:1}}
.ah-dust{position:absolute;width:10px;height:10px;pointer-events:none;background:#ffe08a;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);animation:ahdust 1.1s ease-out forwards}
@keyframes ahdust{0%{scale:.2;opacity:1}100%{translate:var(--dx) var(--dy);scale:1.1;opacity:0}}`;
  document.head.append(s);
}

// a found card: the wax seal (and, fresh, a little burst of sparkles out of the frame)
function stampOn(cd, fresh) {
  cd.classList.add('got');
  if (!cd.querySelector('.ah-stamp')) { const st = document.createElement('div'); st.className = 'ah-stamp'; st.textContent = tr(TXT.found); cd.append(st); }
  if (!fresh) return;
  for (let i = 0; i < 9; i++) { const a = Math.PI * 2 * i / 9, p = document.createElement('i'); p.className = 'ah-spark'; p.style.setProperty('--dx', (Math.cos(a) * 44).toFixed(0) + 'px'); p.style.setProperty('--dy', (Math.sin(a) * 44).toFixed(0) + 'px'); cd.append(p); setTimeout(() => p.remove(), 800); }
}
// open it; resolves true once all three are found (now or before), false when closed first. got: a Set kept by the stage
export async function openArtHunt(G, { key = 'stars', got = new Set(), gray = false } = {}) {
  style();
  const [bgIm, ...ims] = await Promise.all([load(BG), ...THINGS.map(t => load(t.src))]);
  // the picture at the background's own size (else the wall painting's sheet), the things laid in by their numbers
  const k = bgIm ? bgIm.naturalWidth / W : 2;
  const c = document.createElement('canvas'); c.width = Math.round(W * k); c.height = Math.round(H * k);
  const g = c.getContext('2d');
  if (bgIm) g.drawImage(bgIm, 0, 0, c.width, c.height); else { const src = paintCanvas(key); if (src) g.drawImage(src, 0, 0, c.width, c.height); }
  THINGS.forEach((t, i) => {
    const im = ims[i]; if (!im) return;
    const w = t.size * k, hh = w * im.naturalHeight / im.naturalWidth;
    g.save(); g.globalAlpha = t.alpha ?? 1; g.globalCompositeOperation = t.blend || 'source-over';
    g.translate(t.x * k, t.y * k); g.rotate(t.rot || 0); g.drawImage(im, -w / 2, -hh / 2, w, hh); g.restore();
  });
  const grayNow = () => gray ? `grayscale(${1 - got.size / THINGS.length})` : 'none';
  c.style.filter = grayNow();
  const box = document.createElement('div'); box.className = 'ah-box';
  const title = document.createElement('div'); title.className = 'ah-title'; title.textContent = tr(TXT.look);
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
    // (user 10/24: "아래 카드 세개도 이상하고") a little gilt frame like the painting's: the thing's own picture filling a night-blue
    // pane, a dark name plate under it; found, a red wax seal and a spray of sparkles
    const ic = document.createElement('img'); ic.src = ART + t.src; ic.alt = '';
    const pic = document.createElement('div'); pic.className = 'ah-cpic'; pic.append(ic);
    const nm = document.createElement('div'); nm.className = 'ah-name'; nm.textContent = tr(t.name);
    cd.append(pic, nm); cards.append(cd); cardOf.set(t.id, cd);
    if (got.has(t.id)) stampOn(cd, false);
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
      got.add(t.id); ringAt(t); stampOn(cardOf.get(t.id), true); c.style.filter = grayNow();
      G.audio.sfx('pop', 3 + got.size * 2);
      if (got.size >= THINGS.length) {
        G.audio.sfx('win');
        // (user 10/24: "다찾았다 글자도 어색") a red ribbon unrolls over the bottom of the painting, star dust bursting out round it
        const d = document.createElement('div'); d.className = 'ah-done'; d.append(Object.assign(document.createElement('div'), { className: 'rb', textContent: tr('다 찾았다!') })); frame.append(d);
        const fr = frame.getBoundingClientRect(), cx = fr.width / 2, cy = fr.height * .82;
        for (let i = 0; i < 26; i++) {
          const a = Math.PI * 2 * i / 26 + Math.random() * .2, r = 80 + Math.random() * 120, p = document.createElement('i'); p.className = 'ah-dust';
          p.style.left = (cx - 5) + 'px'; p.style.top = (cy - 5) + 'px'; p.style.setProperty('--dx', (Math.cos(a) * r).toFixed(0) + 'px'); p.style.setProperty('--dy', (Math.sin(a) * r * .6 - 30).toFixed(0) + 'px');
          p.style.animationDelay = (i % 5) * 40 + 'ms'; frame.append(p); setTimeout(() => p.remove(), 1400);
        }
        setTimeout(() => end(true), 1500);
      }
    };
  });
}
export const ART_HUNT_N = THINGS.length;

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
const TXT = { look: K('그림 속에서 찾아 봐!', 'Find them in the painting!'), fish: K('생선', 'Fish'), zoom: K('두 손가락으로 확대 · 두 번 터치하면 2배', 'Pinch to zoom · touch twice for 2×') };

const W = 640, H = 400;
// the things, in the 640×400 picture's units: where (x, y — its middle), how wide (size), turned (rot, radians), how see-through
// (alpha), how it mixes into the paint under it (blend: a canvas composite — 'source-over' plain, 'multiply' / 'overlay' / 'soft-light'
// to sink it in), how far a tap may miss (r)
const ART = 'art/museum/arthunt/', BG = 'bg.jpg';
const THINGS = [
  { id: 'key', name: '열쇠', src: 'key.png', x: 512, y: 236, size: 48, rot: -.45, alpha: .9, blend: 'source-over', r: 40 },
  { id: 'fish', name: '생선', src: 'fish.png', x: 236, y: 112, size: 52, rot: .15, alpha: .78, blend: 'source-over', r: 40 },
  { id: 'inky', name: '먹물이', src: 'inky.png', x: 64, y: 236, size: 34, rot: 0, alpha: .95, blend: 'source-over', r: 38 },
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
.ah-ring{position:absolute;width:15%;aspect-ratio:1;border:4px solid #ff4f7b;border-radius:50%;translate:-50% -50%;box-shadow:0 0 0 3px #fff;animation:ahring .35s cubic-bezier(.2,1.6,.4,1)}
@keyframes ahring{0%{scale:2;opacity:0}100%{scale:1;opacity:1}}
.ah-miss{position:absolute;translate:-50% -50%;color:#fff;font:700 26px/1 sans-serif;text-shadow:0 0 3px #2b2030,0 0 3px #2b2030;pointer-events:none;animation:ahmiss .5s forwards}
@keyframes ahmiss{to{opacity:0;scale:1.4}}
.ah-cards{display:flex;gap:10px;justify-content:center}
.ah-card{position:relative;width:76px;background:#fffaf2;border:3px solid #2b2030;border-radius:14px;padding:4px 4px 2px;text-align:center;font-size:13px;color:#2b2030}
.ah-card img{width:64px;height:64px;display:block;margin:0 auto;object-fit:contain}
.ah-card.got{background:#d9f7c9}
.ah-card.got::after{content:'✔';position:absolute;right:-8px;top:-10px;width:26px;height:26px;border-radius:13px;background:#39b54a;color:#fff;border:3px solid #2b2030;font:700 15px/22px sans-serif}
.ah-x{position:absolute;right:-14px;top:-16px;width:38px;height:38px;border-radius:19px;border:3px solid #2b2030;background:#fffaf2;color:#2b2030;font:700 20px/30px sans-serif;padding:0}
.ah-done{position:absolute;left:50%;top:50%;translate:-50% -50%;background:#ffd23f;border:4px solid #2b2030;border-radius:18px;padding:8px 22px;font-size:26px;color:#2b2030;white-space:nowrap;animation:ahring .4s cubic-bezier(.2,1.6,.4,1)}`;
  document.head.append(s);
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
    const ic = document.createElement('img'); ic.src = ART + t.src; ic.alt = '';
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

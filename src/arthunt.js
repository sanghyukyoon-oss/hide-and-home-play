// 그림 속 숨은그림 (10판, 10/23 사용자 메모: "전시된 그림 하나는 2D 숨은그림 찾기" — 그림 누르면 그 안 2D 그림에서 물건 찾기).
// The museum's 별밤 그림 opens big, in its gilt frame: three things are painted into it (a key among the stars, a fish in the swirl,
// 먹물이 in the dark cypress — only its eyes give it away), shown as cards below. Tap one in the picture: a ring, its card ticks.
// In the 흑백 museum the picture starts grey and each find brings a third of its colour back. All three: "다 찾았다!" and it
// closes; the stage colours the painting, pays like 몽글 TV and swings it open. ✕ closes it; the finds so far are kept.
import { paintCanvas } from './gfx/museum-props.js';
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
const TXT = { look: K('그림 속에서 찾아 봐!', 'Find them in the painting!'), fish: K('생선', 'Fish') };

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
.ah-pic canvas{width:100%;height:auto;display:block;transition:filter .6s}
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
  const src = paintCanvas(key);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  if (src) g.drawImage(src, 0, 0, W, H);
  for (const t of THINGS) t.draw(g, t.x, t.y, 1, false);
  const grayNow = () => gray ? `grayscale(${1 - got.size / THINGS.length})` : 'none';
  c.style.filter = grayNow();
  const box = document.createElement('div'); box.className = 'ah-box';
  const title = document.createElement('div'); title.className = 'ah-title ol'; title.textContent = tr(TXT.look);
  const frame = document.createElement('div'); frame.className = 'ah-frame';
  const inner = document.createElement('div'); inner.className = 'ah-pic'; inner.append(c);
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
  box.append(title, frame, cards);
  const bg = document.createElement('div'); bg.className = 'ah'; bg.append(box);
  const ringAt = t => { const r = document.createElement('div'); r.className = 'ah-ring'; r.style.left = (t.x / W * 100) + '%'; r.style.top = (t.y / H * 100) + '%'; inner.append(r); };
  for (const t of THINGS) if (got.has(t.id)) ringAt(t);
  document.getElementById('overlay').append(bg);
  G.audio.sfx('flip');
  return new Promise(res => {
    let done = false;
    const end = ok => { if (done) return; done = true; bg.classList.add('out'); setTimeout(() => bg.remove(), 260); res(ok); };
    x.addEventListener('pointerdown', e => { e.stopPropagation(); G.audio.sfx('click'); end(got.size >= THINGS.length); });
    bg.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if (done || e.target === x) return;
      const r = c.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      const px = (e.clientX - r.left) / r.width * W, py = (e.clientY - r.top) / r.height * H;
      const t = THINGS.find(q => !got.has(q.id) && Math.hypot(q.x - px, q.y - py) < q.r);
      if (!t) {
        if (THINGS.some(q => got.has(q.id) && Math.hypot(q.x - px, q.y - py) < q.r)) return;
        const m = document.createElement('div'); m.className = 'ah-miss'; m.textContent = '✕'; m.style.left = (px / W * 100) + '%'; m.style.top = (py / H * 100) + '%';
        inner.append(m); setTimeout(() => m.remove(), 520); G.audio.sfx('wobble'); return;
      }
      got.add(t.id); ringAt(t); cardOf.get(t.id).classList.add('got'); c.style.filter = grayNow();
      G.audio.sfx('pop', 3 + got.size * 2);
      if (got.size >= THINGS.length) {
        G.audio.sfx('win');
        const d = document.createElement('div'); d.className = 'ah-done ol'; d.textContent = tr('다 찾았다!'); frame.append(d);
        setTimeout(() => end(true), 1100);
      }
    });
  });
}
export const ART_HUNT_N = THINGS.length;

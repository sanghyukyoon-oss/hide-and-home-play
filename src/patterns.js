// 벽지·바닥 무늬 더하기 (경제 세션 10/20 — user: "상점에 벽지랑 바닥 이것도 많이 리소스 안 필요하면 많이많이 해 주라"). Plain 2D canvas
// painters, no three.js: room.js wraps them in a texture (512, only the room's own), the shop draws a small swatch with the same
// painter. Each one tiles: it is drawn on a 256 × 256 square (the canvas at scale 2) and every motif near an edge is drawn again
// across it. Calm ground + one accent (디자인 세션 화풍), the accent's darker/lighter tones made here.

const hexRgb = x => { const n = parseInt(x.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
// lighten (+) / darken (−) by mixing toward white / a plum ink (not grey — the lilac shadows)
export function tone(hex, k) {
  const [r, g, b] = hexRgb(hex), t = k >= 0 ? [255, 255, 255] : [74, 52, 84], f = Math.min(1, Math.abs(k));
  return '#' + [r, g, b].map((v, i) => Math.round(v + (t[i] - v) * f).toString(16).padStart(2, '0')).join('');
}
// a motif at (x, y) and its copies across the edges it is near (the tile repeats)
function wrapAt(c, S, x, y, rr, draw) {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
    const X = x + dx, Y = y + dy; if (X < -rr || X > S + rr || Y < -rr || Y > S + rr) continue;
    c.save(); c.translate(X, Y); draw(c); c.restore();
  }
}
// a seeded random (the same pattern every time)
const rnd = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
// staggered grid points: every `step`, odd rows shifted half a step
const grid = (S, step, f) => { for (let r = 0, y = step / 2; y < S; y += step, r++) for (let x = step / 2 + (r % 2) * step / 2; x < S + step / 2; x += step) f(x % S, y, r); };

function puff(c) { for (const [x, y, r] of [[-10, 2, 8], [0, -4, 10], [11, 1, 8], [0, 5, 8]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } }
function drop(c) { c.beginPath(); c.moveTo(0, -9); c.bezierCurveTo(6, -2, 7, 3, 0, 7); c.bezierCurveTo(-7, 3, -6, -2, 0, -9); c.fill(); }
function heart(c, s = 1) { c.beginPath(); c.moveTo(0, 6 * s); c.bezierCurveTo(-12 * s, -4 * s, -6 * s, -12 * s, 0, -5 * s); c.bezierCurveTo(6 * s, -12 * s, 12 * s, -4 * s, 0, 6 * s); c.fill(); }

// ── walls: (c, S, a, b) — a the ground, b the accent
export const WALL_PAINT = {
  cloud(c, S, a, b) { c.fillStyle = b; grid(S, 64, (x, y) => wrapAt(c, S, x, y, 24, puff)); },
  drop(c, S, a, b) { c.fillStyle = b; grid(S, 32, (x, y, r) => wrapAt(c, S, x, y + (r % 2 ? 3 : -3), 10, drop)); },
  fruit(c, S, a, b) {   // cherries: two round ones on a green stalk
    grid(S, 64, (x, y) => wrapAt(c, S, x, y, 20, c => {
      c.strokeStyle = '#7fae6e'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, 4); c.quadraticCurveTo(-2, -10, 3, -12); c.moveTo(7, 5); c.quadraticCurveTo(5, -6, 3, -12); c.stroke();
      c.fillStyle = '#9fcf88'; c.beginPath(); c.ellipse(8, -12, 6, 3, -.4, 0, 7); c.fill();
      c.fillStyle = b; for (const [px, py] of [[-6, 6], [7, 7]]) { c.beginPath(); c.arc(px, py, 6, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.6)'; for (const [px, py] of [[-8, 4], [5, 5]]) { c.beginPath(); c.arc(px, py, 1.6, 0, 7); c.fill(); }
    }));
  },
  mong(c, S, a, b) {   // 몽글이: a round mochi with two eyes and pink cheeks
    grid(S, 64, (x, y) => wrapAt(c, S, x, y, 20, c => {
      c.fillStyle = b; c.strokeStyle = tone(a, -.22); c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 2, 16, 13, 0, 0, 7); c.fill(); c.stroke();
      c.fillStyle = tone(b, -.25); c.beginPath(); c.ellipse(0, 12, 12, 2.4, 0, 0, 7); c.globalAlpha = .35; c.fill(); c.globalAlpha = 1;
      c.fillStyle = '#4a3454'; for (const ex of [-5, 5]) { c.beginPath(); c.arc(ex, 1, 1.8, 0, 7); c.fill(); }
      c.fillStyle = '#ffb3c4'; for (const ex of [-9, 9]) { c.beginPath(); c.ellipse(ex, 5, 2.8, 1.8, 0, 0, 7); c.fill(); }
    }));
  },
  friends(c, S, a, b) {   // the friends' heads as one-colour silhouettes: 토순이 · 곰돌이 · 냥냥이 · 개굴이
    const heads = [
      c => { c.beginPath(); c.ellipse(-5, -15, 3.5, 9, -.15, 0, 7); c.ellipse(5, -15, 3.5, 9, .15, 0, 7); c.fill(); c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill(); },
      c => { for (const ex of [-9, 9]) { c.beginPath(); c.arc(ex, -9, 5, 0, 7); c.fill(); } c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill(); },
      c => { c.beginPath(); c.moveTo(-11, -3); c.lineTo(-9, -15); c.lineTo(-2, -9); c.lineTo(2, -9); c.lineTo(9, -15); c.lineTo(11, -3); c.fill(); c.beginPath(); c.arc(0, 1, 11, 0, 7); c.fill(); },
      c => { for (const ex of [-6, 6]) { c.beginPath(); c.arc(ex, -8, 5, 0, 7); c.fill(); } c.beginPath(); c.ellipse(0, 1, 13, 10, 0, 0, 7); c.fill(); },
    ];
    c.fillStyle = b; grid(S, 64, (x, y, r) => { const k = (Math.round(x / 64) + r * 2) % 4; wrapAt(c, S, x, y, 22, heads[k]); });
  },
  gingham(c, S, a, b) { c.fillStyle = b; c.globalAlpha = .45; for (let x = 0; x < S; x += 32) c.fillRect(x, 0, 16, S); for (let y = 0; y < S; y += 32) c.fillRect(0, y, S, 16); c.globalAlpha = 1; },
  pin(c, S, a, b) { c.fillStyle = b; for (let x = 0; x < S; x += 32) { c.fillRect(x, 0, 3, S); c.fillRect(x + 8, 0, 1.5, S); } },
  diamond(c, S, a, b) {
    c.fillStyle = tone(a, -.05); for (let y = 0; y < S; y += 64) for (let x = 0; x < S; x += 64) { c.beginPath(); c.moveTo(x + 32, y); c.lineTo(x + 64, y + 32); c.lineTo(x + 32, y + 64); c.lineTo(x, y + 32); c.fill(); }
    c.strokeStyle = b; c.lineWidth = 2; c.beginPath(); for (let k = -S; k <= S; k += 64) { c.moveTo(k, 0); c.lineTo(k + S, S); c.moveTo(k + S, 0); c.lineTo(k, S); } c.stroke();
    c.fillStyle = b; for (let y = 0; y <= S; y += 64) for (let x = 0; x <= S; x += 64) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }
  },
  scallop(c, S, a, b) {   // fish scales
    c.strokeStyle = b; c.lineWidth = 2.5;
    for (let r = 0, y = 0; y <= S + 16; y += 16, r++) for (let x = (r % 2) * 16; x <= S + 32; x += 32) { c.beginPath(); c.arc(x, y, 16, 0, Math.PI); c.stroke(); }
  },
  leaf(c, S, a, b) {
    grid(S, 48, (x, y, r) => wrapAt(c, S, x, y, 16, c => {
      c.rotate(r % 2 ? .7 : -.7); c.fillStyle = b; c.beginPath(); c.moveTo(0, -11); c.quadraticCurveTo(9, 0, 0, 11); c.quadraticCurveTo(-9, 0, 0, -11); c.fill();
      c.strokeStyle = tone(b, -.25); c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -9); c.lineTo(0, 10); c.stroke();
    }));
  },
  moon(c, S, a, b) {   // crescent moons and little stars on a night ground
    grid(S, 64, (x, y, r) => wrapAt(c, S, x, y, 14, c => {
      if (r % 2) { c.fillStyle = b; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill(); c.fillStyle = a; c.beginPath(); c.arc(4, -3, 8, 0, 7); c.fill(); }
      else { c.fillStyle = b; c.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, rr = i % 2 ? 1.6 : 5; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.fill(); }
    }));
    const R = rnd(11); c.fillStyle = tone(b, .3); for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(R() * S, R() * S, .9, 0, 7); c.fill(); }
  },
  wave(c, S, a, b) {
    c.strokeStyle = b; c.lineWidth = 3; c.lineCap = 'round';
    for (let y = 16; y < S; y += 32) { c.beginPath(); for (let x = 0; x <= S; x += 4) c.lineTo(x, y + Math.sin(x / S * Math.PI * 8) * 5); c.stroke(); }
  },
  paw(c, S, a, b) {   // 추로의 발자국
    grid(S, 56, (x, y, r) => wrapAt(c, S, x, y, 14, c => {
      c.rotate(r % 2 ? .35 : -.35); c.fillStyle = b; c.beginPath(); c.ellipse(0, 4, 6.5, 5.5, 0, 0, 7); c.fill();
      for (const [tx, ty] of [[-7, -4], [-2.5, -8], [2.5, -8], [7, -4]]) { c.beginPath(); c.ellipse(tx, ty, 2.4, 3, 0, 0, 7); c.fill(); }
    }));
  },
  plaid(c, S, a, b) {
    c.globalAlpha = .28; c.fillStyle = b; for (let x = 0; x < S; x += 64) { c.fillRect(x, 0, 22, S); c.fillRect(0, x, S, 22); }
    c.globalAlpha = .6; c.fillStyle = tone(b, -.2); for (let x = 30; x < S; x += 64) { c.fillRect(x, 0, 2, S); c.fillRect(0, x, S, 2); }
    c.globalAlpha = 1;
  },
};

// ── floors: (c, S, a, b) — S = 256 is 2 grid cells
function board(c, x, y, w, h, fill, seam) { c.fillStyle = fill; c.fillRect(x, y, w, h); c.strokeStyle = seam; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2); }
export const FLOOR_PAINT = {
  herring(c, S, a, b) {   // herringbone, 1 × 2 boards: on cells (x − y) mod 4, a lying board starts at 0 and a standing one at 3
    const W = 16, n = S / W;
    for (let y = -1; y <= n; y++) for (let x = -1; x <= n; x++) {
      const d = ((x - y) % 4 + 4) % 4, f = tone(a, -.05 + (((x * 7 + y * 3) % 5 + 5) % 5) * .025);
      if (d === 0) board(c, x * W, y * W, W * 2, W, f, b); else if (d === 3) board(c, x * W, y * W, W, W * 2, f, b);
    }
  },
  parquet(c, S, a, b) {   // basket weave: 64-square blocks of three boards, turning each block
    for (let by = 0; by < S; by += 64) for (let bx = 0; bx < S; bx += 64) {
      const turn = (bx + by) / 64 % 2;
      for (let k = 0; k < 3; k++) { const f = tone(a, -.04 + k * .03); turn ? board(c, bx + k * 64 / 3, by, 64 / 3, 64, f, b) : board(c, bx, by + k * 64 / 3, 64, 64 / 3, f, b); }
    }
  },
  hex(c, S, a, b) {   // hexagon tiles (pointy-top, 8 across, 10 rows — a hair flatter than true so it tiles on 256)
    const w = 32, R = S / 10 / 1.5;
    c.fillStyle = b; c.fillRect(0, 0, S, S);
    for (let r = -1; r <= 10; r++) for (let q = -1; q <= 8; q++) {
      const x = q * w + (r % 2 ? w / 2 : 0), y = r * R * 1.5;
      c.fillStyle = tone(a, ((q * 5 + r * 3) % 3 + 3) % 3 * .03 - .03);
      c.beginPath(); for (let i = 0; i < 6; i++) { const an = Math.PI / 6 + i * Math.PI / 3; c.lineTo(x + Math.cos(an) * (w / 2 - 1.5) / Math.cos(Math.PI / 6), y + Math.sin(an) * (R - 1.5)); } c.fill();
    }
  },
  terrazzo(c, S, a, b) {
    const R = rnd(23), cols = [b, tone(b, -.2), tone(b, .35), '#ffffff', tone(a, -.18)];
    for (let i = 0; i < 260; i++) {
      const x = R() * S, y = R() * S, r = 1.5 + R() * R() * 6, rot = R() * 6, col = cols[i % cols.length];
      wrapAt(c, S, x, y, r + 2, c => { c.rotate(rot); c.fillStyle = col; c.beginPath(); for (let k = 0; k < 5; k++) { const an = k / 5 * Math.PI * 2; c.lineTo(Math.cos(an) * r * (.7 + (k % 2) * .4), Math.sin(an) * r); } c.fill(); });
    }
  },
  smalltile(c, S, a, b) { for (let y = 0; y < S; y += 32) for (let x = 0; x < S; x += 32) { c.fillStyle = tone(a, ((x + y) / 32 % 3) * .025); c.fillRect(x + 2, y + 2, 28, 28); } c.strokeStyle = b; c.lineWidth = 3; c.beginPath(); for (let k = 0; k <= S; k += 32) { c.moveTo(k, 0); c.lineTo(k, S); c.moveTo(0, k); c.lineTo(S, k); } c.stroke(); },
  tatami(c, S, a, b) {   // mats 1 × 0.5 cell… laid in pairs, a dark band along their long sides
    const mats = [[0, 0, 128, 64], [0, 64, 128, 64], [128, 0, 64, 128], [192, 0, 64, 128], [128, 128, 128, 64], [128, 192, 128, 64], [0, 128, 64, 128], [64, 128, 64, 128]];
    for (const [x, y, w, h] of mats) {
      c.fillStyle = a; c.fillRect(x, y, w, h);
      c.strokeStyle = tone(a, -.08); c.lineWidth = 1; c.beginPath(); if (w > h) for (let k = y + 4; k < y + h; k += 4) { c.moveTo(x, k); c.lineTo(x + w, k); } else for (let k = x + 4; k < x + w; k += 4) { c.moveTo(k, y); c.lineTo(k, y + h); } c.stroke();
      c.fillStyle = b; if (w > h) { c.fillRect(x, y, w, 4); c.fillRect(x, y + h - 4, w, 4); } else { c.fillRect(x, y, 4, h); c.fillRect(x + w - 4, y, 4, h); }
    }
  },
  marble(c, S, a, b) {
    for (let y = 0; y < S; y += 64) for (let x = 0; x < S; x += 64) { c.fillStyle = tone(a, ((x / 64 + y / 32) % 3) * -.015); c.fillRect(x, y, 64, 64); }
    const R = rnd(5); c.strokeStyle = b; c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      let x = R() * S, y = R() * S; c.lineWidth = .8 + R() * 1.6; c.globalAlpha = .35 + R() * .3;
      const pts = [[x, y]]; for (let k = 0; k < 6; k++) { x += 10 + R() * 22; y += (R() - .5) * 26; pts.push([x, y]); }
      for (const ox of [-S, 0]) for (const oy of [-S, 0, S]) { c.beginPath(); pts.forEach(([px, py], k) => k ? c.lineTo(px + ox, py + oy) : c.moveTo(px + ox, py + oy)); c.stroke(); }
    }
    c.globalAlpha = 1; c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); for (let k = 0; k <= S; k += 64) { c.moveTo(k, 0); c.lineTo(k, S); c.moveTo(0, k); c.lineTo(S, k); } c.stroke();
  },
  cstripe(c, S, a, b) {   // a soft striped carpet
    for (let x = 0; x < S; x += 64) { c.fillStyle = b; c.fillRect(x, 0, 28, S); c.fillStyle = tone(b, -.12); c.fillRect(x + 28, 0, 3, S); }
    const R = rnd(3); c.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 500; i++) c.fillRect(R() * S, R() * S, 1.5, 1.5);
  },
  diamondf(c, S, a, b) {   // tiles laid on the diagonal
    c.fillStyle = b; for (let y = 0; y < S; y += 64) for (let x = 0; x < S; x += 64) { const cx = x + 32, cy = y + 32; c.beginPath(); c.moveTo(cx, cy - 32); c.lineTo(cx + 32, cy); c.lineTo(cx, cy + 32); c.lineTo(cx - 32, cy); c.closePath(); c.fill(); }
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.beginPath(); for (let k = -S; k <= S; k += 64) { c.moveTo(k, 0); c.lineTo(k + S, S); c.moveTo(k + S, 0); c.lineTo(k, S); } c.stroke();
  },
};

// the painters a 512 texture is made with (room.js) and the shop's swatch: true when this module knows the kind
export const hasWall = k => !!WALL_PAINT[k];
export const hasFloor = k => !!FLOOR_PAINT[k];
export function paint(c, W, kind, a, b, floor) {
  const S = 256; c.save(); c.scale(W / S, W / S); c.fillStyle = a; c.fillRect(0, 0, S, S);
  (floor ? FLOOR_PAINT : WALL_PAINT)[kind]?.(c, S, a, b); c.restore();
}
// a small picture for the shop (cached: one per kind and colours)
const thumbs = new Map();
export function patternThumb(kind, a, b, floor, px = 112) {
  const key = [kind, a, b, floor, px].join('|'); if (thumbs.has(key)) return thumbs.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = px; paint(cv.getContext('2d'), px, kind, a, b, floor);
  const url = cv.toDataURL('image/png'); thumbs.set(key, url); return url;
}

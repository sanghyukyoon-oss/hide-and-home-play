// ── 판마다 대표 소품 (G3, ⑥ 10/22 — user "G3 대표 소품 ㄱ"; 아트 진단 art-19to70: the same map came back stage after stage with
// the same props). One hero piece per stage on a map that repeats, put in by heroes.js in place of an everyday piece of the
// same size (so the paths and the planner's room stay as they were): big and chunky enough to read at the start view, tied to
// the stage's story, and the one thing that says which stage this is.
//   31 골목 보스     무지개 벽화 계단 (the alley's concrete stairs, painted — and a whale mural on the wall behind)
// (10/22 the user kept this one — "무지개 벽화는 좋다"; the other heroes go to the GPT workshop)
import * as THREE from 'three';
import { put, mat, mesh, canvasTex, texCache } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { OUTDOOR_BUILDERS } from './outdoor.js';

const PI = Math.PI, HP = PI / 2;
const TEX = texCache();
const tex = (key, w, h, draw) => TEX.get(key, () => canvasTex(w, h, draw));
const decal = (w, h, t) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: t }), { cast: false });
const B = {};

// ── 31 무지개 벽화 계단 (2×1, in place of 바깥 계단): the same stairs (their tarp, spots and pot stay), each tread painted a colour
// of the rainbow, sunflowers on the side, and on the alley wall behind them a painted sea — a big smiling whale, waves, a sun
const MURAL = () => tex('hero-mural', 640, 300, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9fd8f7'); g.addColorStop(.66, '#d9f1fb'); g.addColorStop(.67, '#5fb4e8'); g.addColorStop(1, '#3f8fd4');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffd43b'; c.beginPath(); c.arc(588, 56, 30, 0, 7); c.fill();
  c.strokeStyle = '#ffd43b'; c.lineWidth = 6; c.lineCap = 'round';
  for (let k = 0; k < 8; k++) { const a = k * PI / 4; c.beginPath(); c.moveTo(588 + Math.cos(a) * 40, 56 + Math.sin(a) * 40); c.lineTo(588 + Math.cos(a) * 52, 56 + Math.sin(a) * 52); c.stroke(); }
  const cloud = (x, y, s) => { c.fillStyle = '#ffffff'; for (const [dx, dy, r] of [[0, 0, 20], [22, -9, 24], [46, 0, 18], [22, 7, 18]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, 7); c.fill(); } };
  cloud(70, 52, 1); cloud(330, 34, .8); cloud(470, 74, .7);
  const RB = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'];
  RB.forEach((col, k) => { c.strokeStyle = col; c.lineWidth = 9; c.beginPath(); c.arc(170, 205, 130 - k * 9, PI * 1.06, PI * 1.94); c.stroke(); });
  // the whale: a round blue body, a pale belly, a tail, a spout, a happy eye and a pink cheek
  const X = 380, Y = 182;
  c.fillStyle = '#4f7fe0'; c.beginPath(); c.ellipse(X, Y, 112, 58, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(X + 96, Y - 8); c.quadraticCurveTo(X + 146, Y - 52, X + 172, Y - 38); c.quadraticCurveTo(X + 152, Y - 12, X + 162, Y + 16); c.quadraticCurveTo(X + 134, Y + 10, X + 96, Y + 16); c.fill();
  c.fillStyle = '#cfe4ff'; c.beginPath(); c.ellipse(X - 10, Y + 24, 88, 26, 0, 0, PI); c.fill();
  c.fillStyle = '#2a1d33'; c.beginPath(); c.arc(X - 58, Y - 14, 8, 0, 7); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(X - 55, Y - 17, 3, 0, 7); c.fill();
  c.fillStyle = '#ff9fbf'; c.beginPath(); c.ellipse(X - 70, Y + 8, 12, 7, 0, 0, 7); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = 4; c.beginPath(); c.arc(X - 88, Y + 8, 20, .2, 1.2); c.stroke();
  c.strokeStyle = '#ffffff'; c.lineWidth = 6; for (const dx of [-12, 0, 12]) { c.beginPath(); c.moveTo(X - 18, Y - 56); c.quadraticCurveTo(X - 18 + dx, Y - 84, X - 18 + dx * 2, Y - 104); c.stroke(); }
  c.fillStyle = '#ffffff'; for (let x = 0; x < w; x += 44) { c.beginPath(); c.arc(x + 20, 246, 17, PI, 0); c.fill(); }
  for (let x = 0; x < w; x += 44) { c.beginPath(); c.arc(x, 282, 15, PI, 0); c.fill(); }
  for (const [x, y, col] of [[36, 232, '#ff8fb8'], [612, 236, '#ffd43b'], [110, 270, '#ffa94d'], [540, 274, '#ff8fb8']]) { c.fillStyle = col; for (let k = 0; k < 6; k++) { const a = k * PI / 3; c.beginPath(); c.arc(x + Math.cos(a) * 11, y + Math.sin(a) * 11, 8, 0, 7); c.fill(); } c.fillStyle = '#8a5a3c'; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill(); }
});
B.muralstairs = (f, T) => {
  OUTDOOR_BUILDERS.stairs(f, T);
  const D = .58, z0 = -.2, n = 6, run = .27, rise = .2, x0 = -.86, sideZ = z0 + D / 2;
  const RB = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'];
  f.add(mc('hero-muralstairs', ({ add }) => {
    for (let i = 0; i < n; i++) add(G.box(run - .08, .014, D - .1, .005), RB[i], x0 + i * run + run / 2 + .03, (i + 1) * rise + .007, z0);
    // sunflowers painted on the side of the flight, a green vine between them
    for (const [x, y, s] of [[-.42, .26, 1], [.08, .6, 1.15], [.5, .98, .9]]) {
      for (let k = 0; k < 8; k++) { const a = k * PI / 4; add(G.cyl(.032 * s, .032 * s, .01, 10), '#ffd43b', x + Math.cos(a) * .055 * s, y + Math.sin(a) * .055 * s, sideZ + .012, HP, 0, 0); }
      add(G.cyl(.038 * s, .038 * s, .014, 12), '#8a5a3c', x, y, sideZ + .016, HP, 0, 0);
    }
    for (let k = 0; k < 9; k++) { const x = -.62 + k * .14, y = .1 + k * .1; add(G.sph(.035, 8, 6), k % 2 ? '#69c46a' : '#4fae5a', x, y, sideZ + .01, 0, 0, k * .7, [1.4, .7, .35]); }
  }));
  // (the mural runs on past the stairs, 3.2 m along the alley wall behind the aircon and the pole — the alley's own picture)
  f.add(put(decal(3.2, 1.5, MURAL()), -.55, .78, -.493));
};

export const HERO_BUILDERS = B;
export const HERO_INFO = {
  muralstairs: { w: 2, d: 1, name: '무지개 벽화 계단', price: 0, hidden: true },
};

// 25판 모퉁이 행복슈퍼 3안 cornershop3 (⑦ 10/23 — 사용자 "GPT 맵의 큰 골격은 맘에 듦, 디테일이 엉망 → 같은 골격으로 자연스럽고 디테일 있게",
// 허브: 수채화 편의점 레퍼 결 — 과일 좌판·아이스크림 냉동고·평상·박스 더미·문 앞 고양이). GPT 골격(2층 모퉁이 가게집 단면, 1층 슈퍼 + 뒤쪽 2층 방,
// 바깥 철계단 → 옥상 데크, 셔터, 옥상 도르래 바구니)을 정본 방 문법(벽·2층 난간·박공)과 우리 룩 소품으로 다시 지음.
// 땅: 둥근 섬 — 보도(방 바닥)는 걷는 높이, 차도는 화강암 연석 한 단(14 cm) 아래로 앞·옆 두 길이 모퉁이에서 만나 섬 끝까지 흐름(벽 X),
// 건너편 보도 한 줄, 횡단보도 자리는 연석 낮춘 경사로 + 점자 블록. 좌표는 맵 좌표(가게 방 x -4..1, z -4..1 · 옆 마당 x 1..4 · 앞 보도 z 1..3).
// 장치(25판 설계서 — 시계 → 계산대 돈통 → 크랭크 손잡이 → 셔터 → 2층 도르래 바구니가 올라가고 → 옥상 바구니가 내려옴): cs3_shutter · cs3_hoist,
// 둘 다 터치하면 저절로 움직임(드래그 X). 표는 redo7/s25.js.
import * as THREE from 'three';
import { put, grp, rbox, mat, mesh, plane, canvasTex, texCache, roundRect, shade, cutFace, liner, windowFace } from './kit.js';
import { HG as G, hmc as rawMc } from './house-props.js';
import { MAP_BUILDERS } from './map-props.js';
import { FLOOR_H } from './house-props.js';
import { tr } from '../i18n.js';

const PI = Math.PI, HP = PI / 2;
const mc = (key, fn) => rawMc('cs3|' + key, fn);
const TEX = texCache();
const C = {
  cream: '#fff6e8', cream2: '#f3e6cf', ink: '#3b2a3f', red: '#ef6b5b', red2: '#d9544a', blue: '#4f86d9', navy: '#33478f', mint: '#8fcfb8', mint2: '#6ab89d',
  steel: '#9fb4bd', steelD: '#76909c', teal: '#5aa3a0', wood: '#e2b27a', woodD: '#b07a48', kraft: '#d9ab73', kraft2: '#c4935c',
  road: '#8f8c9c', curb: '#ece9e2', pave: '#e2ddd4', earth: '#b08a66', earth2: '#94714f', stone: '#cfc7bb', yel: '#ffcf3a', yel2: '#f0b51f',
  apple: '#f0574a', mandarin: '#ffa23a', cabbage: '#a8d873', leek: '#5fbf5a', egg: '#fff3dc', plastic: '#4fa3e0', green: '#5cbf6a', pink: '#ff9fb6',
};
// 섬: 둥근 네모 x -4.45 ~ 6.95, z -4.45 ~ 5.95, 모서리 1.2. 보도 판(걷는 높이 0) x ~4.3, z ~3.3 (바깥 .2는 연석), 차도 윗면 -.14,
// 옆길 x 4.3 ~ 6.1, 앞길 z 3.3 ~ 5.1, 건너편 보도 그 너머
export const ISLE = { x0: -4.45, x1: 6.95, z0: -4.45, z1: 5.95, r: 1.2, sx: 4.3, sz: 3.3, rx: 6.1, rz: 5.1, road: -.14, bot: -.78 };
const CROSS = [-2.15, -.35];   // 앞길 횡단보도 x 범위 (가게 문 앞 → 건너편)

// ── shapes ───────────────────────────────────────────────────────────────────────────────────────────────────────
// a rounded-corner rectangle polygon (x, z); r per corner [NW, NE, SE, SW]
function rrect(x0, z0, x1, z1, r) {
  const R = Array.isArray(r) ? r : [r, r, r, r], out = [];
  const arc = (cx, cz, a0, rr) => { if (rr <= 0) { out.push([cx, cz]); return; } for (let k = 0; k <= 8; k++) { const a = a0 + HP * k / 8; out.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]); } };
  arc(x0 + R[0], z0 + R[0], PI, R[0]); arc(x1 - R[1], z0 + R[1], -HP, R[1]); arc(x1 - R[2], z1 - R[2], 0, R[2]); arc(x0 + R[3], z1 - R[3], HP, R[3]);
  return out;
}
const shapeOf = pts => { const s = new THREE.Shape(); s.moveTo(pts[0][0], -pts[0][1]); for (const p of pts.slice(1)) s.lineTo(p[0], -p[1]); return s; };
// a prism standing from y0 to y1 over a polygon
function prism(pts, y0, y1) { const g = new THREE.ExtrudeGeometry(shapeOf(pts), { depth: y1 - y0, bevelEnabled: false, curveSegments: 4 }); g.rotateX(-HP); g.translate(0, y0, 0); return g; }
// a flat top face (uv = x, -z in metres)
function flatTop(pts, y) { const g = new THREE.ShapeGeometry(shapeOf(pts)); g.rotateX(-HP); g.translate(0, y, 0); return g; }
// the part of a convex polygon on one side of a line (Sutherland–Hodgman): axis 0 = x, 1 = z; keep >= v (ge) or <= v
function clip(poly, axis, v, ge) {
  const out = [], keep = p => (ge ? p[axis] >= v : p[axis] <= v);
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ia = keep(a), ib = keep(b);
    if (ia) out.push(a); if (ia !== ib) { const t = (v - a[axis]) / (b[axis] - a[axis]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
  return out.filter((p, i, A) => Math.hypot(p[0] - A[(i + 1) % A.length][0], p[1] - A[(i + 1) % A.length][1]) > 1e-4);
}
const texMesh = (g, t, o = {}) => { const m = mesh(g, mat('#ffffff', { map: t, rough: .85, ...o }), { cast: false }); m.receiveShadow = true; return m; };

// ── textures ─────────────────────────────────────────────────────────────────────────────────────────────────────
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// 아스팔트: 보랏빛 회색, 굵은 알갱이, 땜질 자국, 잔금 — 텍스처 하나가 4 m
const roadTex = () => TEX.get('cs3|road', () => canvasTex(1024, 1024, (c, w, h) => {
  c.fillStyle = C.road; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 6000; k++) { const n = hash(k); c.fillStyle = n < .55 ? 'rgba(58,54,78,.16)' : n < .85 ? 'rgba(255,255,255,.1)' : 'rgba(40,36,60,.22)'; c.fillRect(hash(k + 1) * w, hash(k + 2) * h, 1.5 + hash(k + 4) * 3, 1.5 + hash(k + 5) * 2); }
  c.fillStyle = 'rgba(72,68,96,.3)'; roundRect(c, 140, 610, 220, 140, 12); c.fill(); roundRect(c, 690, 170, 150, 250, 12); c.fill();
  c.strokeStyle = 'rgba(52,48,72,.5)'; c.lineWidth = 2.5; c.lineCap = 'round';
  for (const [x, y, s] of [[420, 300, 1], [180, 900, -1], [820, 760, 1]]) { c.beginPath(); c.moveTo(x, y); for (let k = 1; k < 7; k++) c.lineTo(x + k * 22 * s + (k % 2 ? 8 : -6), y + k * 14 + (k % 3) * 6); c.stroke(); }
}, { repeat: [.25, .25] }));
// 보도블록: 20 × 10 cm 엇갈려 깔기, 회색·베이지에 가끔 연분홍 — 2 m
const paverTex = () => TEX.get('cs3|paver', () => canvasTex(1024, 1024, (c, w, h) => {
  const px = w / 2, bw = .2 * px, bh = .1 * px;
  c.fillStyle = '#c4beb6'; c.fillRect(0, 0, w, h);
  const tones = ['#e6e1d9', '#ddd7ce', '#ebe6de', '#e0dad1', '#ecd9d4'];
  for (let r = 0; r < h / bh; r++) for (let k = -1; k < w / bw + 1; k++) {
    const x = k * bw + (r % 2 ? bw / 2 : 0), y = r * bh, n = hash(r * 97 + k * 13);
    c.fillStyle = tones[n < .08 ? 4 : Math.floor(n * 4) % 4]; c.fillRect(x + 1.6, y + 1.6, bw - 3.2, bh - 3.2);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x + 1.6, y + 1.6, bw - 3.2, 2);
  }
  for (let k = 0; k < 500; k++) { c.fillStyle = `rgba(110,104,96,${.05 + hash(k) * .07})`; c.fillRect(hash(k + 3) * w, hash(k + 7) * h, 2 + hash(k + 9) * 3, 2); }
}, { repeat: [.5, .5] }));
// 화강암 연석: 희끗한 점박이 — 길이 1 m에 한 장
const curbTex = () => TEX.get('cs3|curb', () => canvasTex(256, 128, (c, w, h) => {
  c.fillStyle = C.curb; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 700; k++) { const n = hash(k + 50); c.fillStyle = n < .5 ? 'rgba(120,116,130,.26)' : n < .8 ? 'rgba(80,78,95,.2)' : 'rgba(255,255,255,.6)'; c.fillRect(hash(k + 51) * w, hash(k + 52) * h, 2.2, 2.2); }
}));
// 섬 단면 흙: 자갈 박힌 흙과 위쪽 자갈 기층
const earthTex = () => TEX.get('cs3|earth', () => canvasTex(512, 256, (c, w, h) => {
  c.fillStyle = C.earth; c.fillRect(0, 0, w, h);
  c.fillStyle = '#9e9aa6'; c.fillRect(0, 0, w, h * .26);
  for (let k = 0; k < 160; k++) { const y = hash(k + 3) * h * .24; c.fillStyle = hash(k) < .5 ? '#b7b2bd' : '#86818f'; c.beginPath(); c.ellipse(hash(k + 1) * w, y + 3, 4 + hash(k + 2) * 6, 3, 0, 0, PI * 2); c.fill(); }
  for (let k = 0; k < 90; k++) { const y = h * .3 + hash(k + 13) * h * .65; c.fillStyle = hash(k + 11) < .5 ? '#c7a07a' : C.earth2; c.beginPath(); c.ellipse(hash(k + 12) * w, y, 5 + hash(k + 14) * 9, 4 + hash(k + 15) * 5, hash(k) * 3, 0, PI * 2); c.fill(); }
  for (let k = 0; k < 1400; k++) { c.fillStyle = hash(k + 99) < .5 ? 'rgba(255,240,220,.18)' : 'rgba(60,36,20,.16)'; c.fillRect(hash(k + 100) * w, h * .27 + hash(k + 101) * h * .73, 1.6, 1.6); }
}, { repeat: [1, 1] }));
// 칠한 글자 하나 (흰 길바닥 글씨)
const roadWordTex = (text) => TEX.get('cs3|word|' + text, () => canvasTex(512, 160, (c, w, h) => {
  c.fillStyle = 'rgba(255,255,255,.92)'; c.font = `800 118px Ssurround, Jua, "Apple SD Gothic Neo", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tr(text), w / 2, h / 2 + 6);
}));
// a text card: background, border, one or two lines that fit
function cardTex(key, w, h, bg, fg, lines, o = {}) {
  return TEX.get('cs3|card|' + key, () => canvasTex(w, h, (c, W, H) => {
    c.fillStyle = bg; roundRect(c, 1, 1, W - 2, H - 2, o.r ?? Math.min(W, H) * .12); c.fill();
    if (o.line) { c.strokeStyle = o.line; c.lineWidth = o.lw || Math.max(3, H * .05); roundRect(c, o.lw || 6, o.lw || 6, W - 2 * (o.lw || 6), H - 2 * (o.lw || 6), Math.min(W, H) * .1); c.stroke(); }
    if (o.draw) o.draw(c, W, H);
    const L = lines.map(tr), n = L.length;
    L.forEach((s, i) => {
      let size = (o.size || H * .62) / Math.max(1, n * .78);
      c.font = `800 ${size}px Ssurround, Jua, "Apple SD Gothic Neo", sans-serif`;
      const max = W * (o.fit ?? .84); const mw = c.measureText(s).width; if (mw > max) { size *= max / mw; c.font = `800 ${size}px Ssurround, Jua, "Apple SD Gothic Neo", sans-serif`; }
      c.fillStyle = Array.isArray(fg) ? fg[i] : fg; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(s, W / 2 + (o.dx || 0), H * ((i + .5) / n) * (o.span ?? 1) + H * (1 - (o.span ?? 1)) / 2 + 2);
    });
  }));
}
// 행복슈퍼 간판: 크림 바탕에 빨강 글자, 파랑 테두리, 양쪽 별 동그라미
const signTex = () => TEX.get('cs3|sign', () => canvasTex(1024, 192, (c, w, h) => {
  c.fillStyle = '#fffaf0'; c.fillRect(0, 0, w, h);
  c.fillStyle = C.blue; c.fillRect(0, 0, w, 16); c.fillRect(0, h - 16, w, 16);
  c.fillStyle = C.red; c.fillRect(0, 16, w, 6); c.fillRect(0, h - 22, w, 6);
  for (const x of [80, w - 80]) { c.fillStyle = C.blue; c.beginPath(); c.arc(x, h / 2, 44, 0, PI * 2); c.fill(); c.fillStyle = '#fffaf0'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -HP + k * PI / 5, r = k % 2 ? 13 : 32; c.lineTo(x + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } c.fill(); }
  c.fillStyle = C.red; c.font = `800 118px Ssurround, Jua, "Apple SD Gothic Neo", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const s = tr('행복슈퍼'); let size = 118; while (c.measureText(s).width > w - 260 && size > 40) { size -= 4; c.font = `800 ${size}px Ssurround, Jua, "Apple SD Gothic Neo", sans-serif`; }
  c.fillText(s, w / 2, h / 2 + 6);
}));
// 셔터 살: 가로 골, 아래쪽은 조금 바랜 흰색, '잠시 외출중' 종이
const shutterTex = () => TEX.get('cs3|shutter', () => canvasTex(512, 512, (c, w, h) => {
  c.fillStyle = '#dfe5ea'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) { c.fillStyle = '#c3ccd4'; c.fillRect(0, y + 11, w, 5); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, y + 1, w, 3); }
  for (let k = 0; k < 220; k++) { c.fillStyle = `rgba(120,130,150,${.04 + hash(k) * .06})`; c.fillRect(hash(k + 1) * w, hash(k + 2) * h, 3 + hash(k + 3) * 10, 2); }
}, { repeat: [1, 1] }));
// 셔터에 붙은 쪽지
const noteTex = () => TEX.get('cs3|note', () => canvasTex(256, 200, (c, w, h) => {
  c.fillStyle = '#fffdf6'; c.fillRect(6, 6, w - 12, h - 12);
  c.fillStyle = 'rgba(255,214,90,.8)'; c.fillRect(w / 2 - 34, 0, 68, 18);
  c.fillStyle = C.red; c.font = `800 46px Ssurround, Jua, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(tr('잠시'), w / 2, h * .38); c.fillStyle = C.ink; c.font = `800 40px Ssurround, Jua, sans-serif`; c.fillText(tr('외출중'), w / 2, h * .7);
}));
// 창 포스터 셋: 라면 특가 · 택배 접수 · 복권
const posterTex = (k) => TEX.get('cs3|poster|' + k, () => canvasTex(200, 280, (c, w, h) => {
  c.fillStyle = '#fffaf0'; c.fillRect(0, 0, w, h);
  const P = [['라면 특가', C.red, () => { c.fillStyle = '#ffcf5c'; c.beginPath(); c.ellipse(w / 2, 150, 60, 36, 0, 0, PI * 2); c.fill(); c.strokeStyle = '#e8a03a'; c.lineWidth = 5; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(w / 2 - 44, 132 + i * 10); c.bezierCurveTo(w / 2 - 15, 120 + i * 10, w / 2 + 15, 146 + i * 10, w / 2 + 44, 132 + i * 10); c.stroke(); } c.fillStyle = C.red; c.fillRect(w / 2 - 66, 168, 132, 22); }],
    ['택배 접수', C.blue, () => { c.fillStyle = C.kraft; c.fillRect(w / 2 - 50, 110, 100, 76); c.fillStyle = '#c99a5f'; c.fillRect(w / 2 - 50, 140, 100, 10); c.fillStyle = '#fff'; c.fillRect(w / 2 + 6, 160, 34, 20); }],
    ['복권 판매', '#3fa66a', () => { c.fillStyle = '#ffd23f'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(w / 2 - 50 + (i % 3) * 50, 125 + Math.floor(i / 3) * 52, 21, 0, PI * 2); c.fill(); } c.fillStyle = C.ink; c.font = '800 26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; [7, 12, 23, 31, 40, 45].forEach((n, i) => c.fillText(String(n), w / 2 - 50 + (i % 3) * 50, 126 + Math.floor(i / 3) * 52)); }]][k];
  c.fillStyle = P[1]; c.fillRect(0, 0, w, 62);
  c.fillStyle = '#fff'; c.font = `800 38px Ssurround, Jua, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tr(P[0]), w / 2, 33);
  P[2]();
  c.fillStyle = '#d8cfbf'; for (let i = 0; i < 3; i++) c.fillRect(24, 214 + i * 16, w - 48 - i * 20, 7);
}));
const pane = (w, h, t) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: t }), { cast: false });

const B = {};

// ── 바탕 섬: 흙 단면 · 차도 두 길 · 연석 · 보도 판 · 건너편 보도 · 횡단보도 · 맨홀 · 빗물받이 ─────────────────────────────
B.cs3_base = f => {
  f.noSolid = true; f.collideBox = [0, -1, 0, 0, -1, 0];
  const I = ISLE, Y = I.road;
  const O = rrect(I.x0, I.z0, I.x1, I.z1, I.r);
  // 아래 단면: 자갈 기층 + 흙 (옆면에 흙 텍스처, 밑 테두리는 진한 흙)
  const body = prism(O, I.bot, Y - .02);
  const sideT = earthTex().clone(); sideT.needsUpdate = true; sideT.wrapS = sideT.wrapT = THREE.RepeatWrapping;
  // (ExtrudeGeometry side uv: u along the outline in metres, v = depth — one tile per 2 m along, the whole height down)
  sideT.repeat.set(.5, 1 / (Y - .02 - I.bot));
  const bm = mesh(body, mat('#ffffff', { map: sideT, rough: .95 }), { cast: false }); f.add(bm);
  f.add(put(mesh(prism(rrect(I.x0 + .06, I.z0 + .06, I.x1 - .06, I.z1 - .06, I.r - .06), I.bot - .08, I.bot + .01), mat(shade(C.earth2, -.12)), { cast: false })));
  // 차도: 섬 전체 아스팔트 판(윗면 Y) — 보도 판이 그 위에 앉는다
  const rt = roadTex(); rt.wrapS = rt.wrapT = THREE.RepeatWrapping;
  f.add(texMesh(flatTop(O, Y), rt));
  f.add(put(mesh(prism(O, Y - .06, Y - .002), mat('#77748a'), { cast: false })));
  // 보도 판 (우리 쪽): 방 + 0.3 m, 북서 모서리는 섬처럼 둥글게
  const near = rrect(I.x0, I.z0, I.sx, I.sz, [I.r, 0, .28, 0]);
  f.add(put(mesh(prism(near, Y - .01, -.006), mat('#d6d0c6'), { cast: false })));
  const pt = paverTex(); pt.wrapS = pt.wrapT = THREE.RepeatWrapping;
  f.add(texMesh(flatTop(near, -.004), pt));
  // 건너편 보도 (옆길 너머 x 6.3 ~, 앞길 너머 z 5.3 ~) — 한 줄, 둥근 섬 모서리 따라
  const farE = clip(clip(O, 0, I.rx + .2, true), 1, I.rz + .2, false), farS = clip(clip(O, 1, I.rz + .2, true), 0, I.rx + .2, false), farC = clip(clip(O, 0, I.rx + .2, true), 1, I.rz + .2, true);
  for (const P of [farE, farS, farC]) { f.add(put(mesh(prism(P, Y - .01, -.006), mat('#d6d0c6'), { cast: false }))); f.add(texMesh(flatTop(P, -.004), pt)); }
  // 연석: 화강암 블록(길이 .9~1 m, 줄눈), 윗면 +.02 — 우리 쪽 두 변, 건너편 세 변. 횡단보도 자리는 낮춘 경사로
  const ct = curbTex();
  const curbs = [];
  const runX = (x0, x1, z, skip = null) => { for (let x = x0; x < x1 - .05; x += .95) { const a = x, b = Math.min(x + .93, x1); if (skip && b > skip[0] && a < skip[1]) { if (skip[0] - .02 - a > .08) curbs.push([a, z, skip[0] - .02 - a, 'x']); if (b - skip[1] - .02 > .08) curbs.push([skip[1] + .02, z, b - skip[1] - .02, 'x']); continue; } curbs.push([a, z, b - a, 'x']); } };
  const runZ = (z0, z1, x) => { for (let z = z0; z < z1 - .05; z += .95) curbs.push([z, x, Math.min(z + .93, z1) - z, 'z']); };   // ([along, across, length, axis] like runX)
  runX(I.x0 + .3, I.sx - .3, I.sz - .1, [CROSS[0] - .1, CROSS[1] + .1]); runZ(I.z0 + .3, I.sz - .3, I.sx - .1);
  runX(I.x0 + .3, I.rx - .3, I.rz + .3, [CROSS[0] - .1, CROSS[1] + .1]); runZ(I.z0 + .3, I.rz - .3, I.rx + .3);
  f.add(mc('curbs', ({ add }) => {
    for (const [a, b, L, d] of curbs) { if (d === 'x') add(G.box(L - .02, .17, .2, .025), C.curb, a + L / 2, -.065, b); else add(G.box(.2, .17, L - .02, .025), C.curb, b, -.065, a + L / 2); }
    // 모퉁이 둥근 연석 (우리 쪽 SE, 건너편 NW)
    for (let k = 0; k < 4; k++) { const a = k * HP / 4 + HP / 8; add(G.box(.2, .17, .24, .025), C.curb, I.sx - .38 + Math.cos(a) * .28, -.065, I.sz - .38 + Math.sin(a) * .28, 0, -a, 0); }
  }));
  // 화강암 점박이 무늬는 윗면 띠로 (블록마다 텍스처를 씌우면 줄눈이 흐려져서)
  for (const [a, b, L, d] of curbs) { const p = pane(d === 'x' ? L - .06 : .16, d === 'x' ? .16 : L - .06, ct); p.rotation.x = -HP; p.position.set(d === 'x' ? a + L / 2 : b, .022, d === 'x' ? b : a + L / 2); f.add(p); }
  // 횡단보도: 낮춘 경사로(양쪽) + 노란 점자 블록 + 흰 줄 7개
  f.add(mc('ramp', ({ add }) => {
    for (const z of [I.sz - .1, I.rz + .3]) { add(G.box(CROSS[1] - CROSS[0] + .1, .05, .2, .02), C.curb, (CROSS[0] + CROSS[1]) / 2, Y + .025, z); }
    for (const z of [I.sz - .48, I.rz + .62]) add(G.box(CROSS[1] - CROSS[0] - .2, .02, .36, .01), C.yel, (CROSS[0] + CROSS[1]) / 2, z < 4 ? .003 : .003, z);
  }));
  f.add(mc('tactile', ({ add }) => { for (const z of [I.sz - .48, I.rz + .62]) for (let x = CROSS[0] + .18; x < CROSS[1] - .1; x += .09) for (const dz of [-.12, -.04, .04, .12]) add(G.cyl(.018, .022, .012, 6), C.yel2, x, .018, z + dz); }));
  f.add(mc('zebra', ({ add }) => { for (let x = CROSS[0] + .2; x < CROSS[1] - .1; x += .42) add(G.box(.24, .008, I.rz - I.sz - .36, .004), '#fbf8f2', x, Y + .004, (I.sz + I.rz) / 2); }));   // (줄은 걷는 방향 z로 길게, x로 띄엄띄엄)
  // 길 칠: 앞길 '천천히', 옆길 흰 가장자리 줄과 정지선, 모퉁이 흰 점선
  for (const [x, z, ry, w] of [[-3.35, (I.sz + I.rz) / 2 + .02, 0, 1.5], [(I.sx + I.rx) / 2, -1.6, HP, 1.5]]) { const p = mesh(new THREE.PlaneGeometry(w, w * .31), mat('#ffffff', { map: roadWordTex('천천히'), opacity: .97 }), { cast: false }); p.rotation.set(-HP, 0, ry); p.position.set(x, Y + .004, z); f.add(p); }
  f.add(mc('lines', ({ add }) => {
    for (let z = I.z0 + .5; z < I.sz - .2; z += .7) add(G.box(.06, .006, .4, .003), '#fbf8f2', I.sx + .14, Y + .003, z);
    for (let x = I.x0 + .5; x < CROSS[0] - .3; x += .7) add(G.box(.4, .006, .06, .003), '#fbf8f2', x, Y + .003, I.sz + .14);
    add(G.box(1.7, .006, .1, .003), '#fbf8f2', (I.sx + I.rx) / 2, Y + .003, I.sz - .5);
  }));
  // 맨홀(옆길) · 빗물받이(앞 연석 앞 둘)
  f.add(mc('manhole', ({ add }) => {
    add(G.cyl(.34, .34, .02, 22), '#5f5c70', (I.sx + I.rx) / 2 + .1, Y + .01, .6);
    add(G.tor(.28, .018, PI * 2, 4, 22), '#4b4960', (I.sx + I.rx) / 2 + .1, Y + .02, .6, HP, 0, 0);
    for (let k = -2; k <= 2; k++) add(G.box(.42, .006, .03, .003), '#4b4960', (I.sx + I.rx) / 2 + .1, Y + .022, .6 + k * .1);
    for (const x of [.9, 3.0]) { add(G.box(.62, .02, .28, .01), '#55526a', x, Y + .01, I.sz + .2); for (let k = 0; k < 7; k++) add(G.box(.04, .012, .22, .004), '#3f3d52', x - .24 + k * .08, Y + .022, I.sz + .2); }
  }));
};

// ── 가게 앞면 (낮은 것): 모서리 기둥 · 창 아래 낮은 벽 · 문틀 · 접어 둔 유리문 · 창틀·포스터 · 셔터 칸 기둥 · 2층 방 모서리 기둥과 보 · 천장 형광등 ──
// (높은 간판·차양은 cs3_fascia로 따로: 걷기 그래프는 다른 방 가구의 상자를 통째로 보므로(companion.js walkGrid inOther) 앞 보도 줄과 2층 칸을
// 막지 않게 — 이 조각은 가게 방 안(z ≤ 1)·높이 2.9 아래에만)
// placed at the shop room's centre (x -1.5, z -1.5): local = map - (-1.5, -1.5)
const SHOP = { x0: -4, x1: 1, z0: -4, z1: 1, cx: -1.5, cz: -1.5 };
const FH = 2.8;   // 간판 띠 위 높이 (2층 바닥 2.9 밑)
B.cs3_front = f => {
  f.noSolid = true; f.collideBox = [-2.5, 0, 2.3, 2.5, .05, 2.5];
  const L = (x, z) => [x - SHOP.cx, z - SHOP.cz];
  const FZ = SHOP.z1 - SHOP.cz;   // 앞면 z (local 2.5)
  f.add(mc('frame2', ({ add }) => {
    // 모서리 기둥 (크림 타일 기둥에 아래는 민트)
    for (const x of [SHOP.x0 + .1, SHOP.x1 - .12]) { const [lx] = L(x, 0); add(G.box(.2, FH, .2, .03), C.cream2, lx, FH / 2, FZ - .14); add(G.box(.24, .55, .22, .03), C.mint2, lx, .275, FZ - .14); }
    // 문틀 (알루미늄)
    for (const x of [-1.95, -.55]) { const [lx] = L(x, 0); add(G.box(.07, 2.22, .1, .015), '#c9d2dc', lx, 1.11, FZ - .1); }
    add(G.box(1.47, .07, .1, .015), '#c9d2dc', L(-1.25, 0)[0], 2.22, FZ - .1);
    // 접어 둔 유리문 네 짝 (왼쪽 기둥 옆에 겹쳐 세움)
    for (let k = 0; k < 4; k++) { const [lx] = L(SHOP.x0 + .32 + k * .07, 0); add(G.box(.04, 2.1, .62, .012), '#b8c3cf', lx, 1.08, FZ - .5 - k * .015); }
    // 창 아래 낮은 벽 (왼쪽 칸, 민트 타일 받침)
    add(G.box(1.75, .62, .14, .02), C.mint, L(-3.0, 0)[0], .31, FZ - .14);
    add(G.box(1.8, .05, .22, .015), C.cream, L(-3.0, 0)[0], .645, FZ - .13);
    // 셔터 칸 (오른쪽): 문틀과 셔터 사이 기둥
    add(G.box(.12, FH - .4, .14, .02), C.cream2, L(-.45, 0)[0], (FH - .4) / 2, FZ - .14);
    // 2층 방 모서리 기둥 (가게 동쪽 열린 면, z -1) + 그 위 보 (2층 바닥 밑)
    add(G.box(.16, FLOOR_H - .04, .16, .025), C.cream2, L(SHOP.x1 - .14, -1.08)[0], (FLOOR_H - .04) / 2, L(0, -1.08)[1]);
    add(G.box(.14, .2, 3.0, .025), C.cream2, L(SHOP.x1 - .13, 0)[0], 2.42, L(0, -2.5)[1]);
    // 가게 천장 형광등 둘 (2층 바닥 밑에 매달림)
    for (const x of [-3.0, -1.0]) { const [lx, lz] = L(x, -2.4); add(G.box(1.2, .05, .16, .02), '#eef1f4', lx, 2.42, lz); add(G.cap(.03, 1.08, 2, 8), '#fffdf0', lx, 2.37, lz, 0, 0, HP); for (const d of [-.5, .5]) add(G.cyl(.006, .006, .1, 4), '#9aa3ba', lx + d, 2.49, lz); }
  }));
  // 창 위쪽에 붙은 포스터 셋 (안쪽 계산대가 보이게 높이 — 가운데는 비움)
  [[-3.5, 0], [-2.5, 2]].forEach(([x, k], i) => f.add(put(pane(.32, .44, posterTex(k)), L(x, 0)[0], 1.9, FZ - .14, 0, 0, (i - .5) * .06)));
  f.add(put(pane(.3, .42, posterTex(1)), L(-1.6, 0)[0], 1.45, FZ - .02));
  // 창틀 (얇은 세로 살 + 가로대)
  f.add(mc('winframe', ({ add }) => { const cx = L(-3.0, 0)[0]; add(G.box(1.76, .05, .06, .012), '#c9d2dc', cx, 2.2, FZ - .14); for (const dx of [-.86, 0, .86]) add(G.box(.04, 1.52, .06, .012), '#c9d2dc', cx + dx, 1.44, FZ - .14); }));
};

// ── 간판 띠와 차양 (높은 것, 1.75 m 위): 행복슈퍼 간판 · 처마 · 줄무늬 차양 · 문 위 민트 차양 · 담배 둥근 간판 ──
B.cs3_fascia = f => {
  f.noSolid = true; f.collideBox = [-2.5, 2.4, 2.3, 2.5, 2.5, 2.5];
  const L = (x, z) => [x - SHOP.cx, z - SHOP.cz];
  const FZ = SHOP.z1 - SHOP.cz, H = FH;
  f.add(mc('fascia', ({ add }) => {
    add(G.box(5.2, .46, .22, .04), C.cream2, 0, H - .23, FZ - .02);
    add(G.box(5.3, .07, .34, .03), C.woodD, 0, H + .02, FZ - .02);
    add(G.box(5.16, .07, .24, .02), C.blue, 0, H - .49, FZ - .02);
  }));
  f.add(put(pane(4.9, .4, signTex()), 0, H - .23, FZ + .092));
  // 줄무늬 차양 (창 칸 위, 비스듬히, 끝은 물결 단)
  f.add(mc('awning', ({ add }) => {
    const n = 8, x0 = L(SHOP.x0 + .1, 0)[0], w = 2.3 / n;
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + .5) * w, c = i % 2 ? C.cream : C.red;
      add(G.box(w + .004, .06, .84, .02), c, x, H - .68, FZ + .38, .38, 0, 0);
      add(G.cyl(w / 2, w / 2, .06, 12, false), c, x, H - .86, FZ + .8, HP, 0, 0, [1, 1, .55]);
      add(G.box(w + .004, .16, .05, .02), c, x, H - .93, FZ + .78);
    }
    add(G.box(2.32, .05, .06, .015), C.woodD, x0 + 1.15, H - .54, FZ + .04);
  }));
  // 문 위 작은 차양 (민트, 짧게)
  f.add(mc('doorawn', ({ add }) => { const cx = L(-1.25, 0)[0]; add(G.box(1.5, .05, .5, .02), C.mint, cx, H - .62, FZ + .27, .3, 0, 0); add(G.box(1.5, .1, .05, .02), C.mint2, cx, H - .72, FZ + .51); }));
  // 담배 둥근 간판 (오른쪽 모서리 기둥에서 앞으로)
  const tx = L(SHOP.x1 - .12, 0)[0];
  f.add(mc('tobacco', ({ add }) => { add(G.box(.05, .05, .28, .012), C.steelD, tx, 2.0, FZ + .06); add(G.cyl(.17, .17, .05, 22), C.red, tx, 2.0, FZ + .26, 0, 0, HP); add(G.cyl(.13, .13, .055, 22), '#fffaf0', tx, 2.0, FZ + .26, 0, 0, HP); }));
  for (const s of [1, -1]) f.add(put(pane(.2, .1, cardTex('dambae', 200, 100, '#fffaf0', C.red, ['담배'], { size: 70 })), tx + s * .03, 2.0, FZ + .26, 0, s * HP, 0));
};

// ── 옥상 데크 받침 (옆 마당): 데크 앞 모서리 쇠기둥 하나(다른 하나는 도르래 기둥)와 데크 앞 보 ──
// placed in the yard room at map (2.5, -1.5)
B.cs3_deck = f => {
  f.noSolid = true; f.collideBox = [-1.45, 0, -.62, -1.31, 2.5, -.5];
  f.add(mc('deckpost', ({ add }) => {
    add(G.box(.14, FLOOR_H - .02, .14, .02), C.steel, 1.12 - 2.5, (FLOOR_H - .02) / 2, -2.08 + 1.5);
    add(G.box(.26, .05, .26, .015), C.steelD, 1.12 - 2.5, .025, -2.08 + 1.5);
    add(G.box(2.95, .2, .14, .025), C.steel, 2.55 - 2.5, 2.42, -2.06 + 1.5);
  }));
};

// ── 셔터 (장치 1단): 오른쪽 칸 1.3 m, 반쯤 내려온 흰 셔터, 오른 기둥에 크랭크 상자(손잡이 빠짐). 터치 → 손잡이 끼우면 저절로 감겨 올라감 ──
B.cs3_shutter = (f, T) => {
  const W = 1.12, TOP = 2.32, LOW = .95, z = 0, CX = .7, CZ = .17;
  f.add(mc('box', ({ add }) => {
    add(G.box(W + .14, .26, .26, .05), '#d7dde4', 0, TOP + .12, z - .02);   // 감기는 통
    for (const s of [-1, 1]) add(G.box(.07, TOP, .09, .015), '#b9c3cc', s * (W / 2 + .02), TOP / 2, z);   // 가이드 레일
    add(G.box(.03, .03, .3, .008), '#8fa0ab', CX - .05, TOP + .05, CZ / 2);
  }));
  // 안쪽 칸: 음료 상자와 쌀 포대 (셔터 아래로 보임)
  f.add(mc('bay', ({ add }) => {
    for (const [x, y, c] of [[-.38, .14, C.plastic], [-.38, .42, C.green], [.05, .14, C.plastic]]) { add(G.box(.42, .26, .34, .02), c, x, y, z - .45); for (let k = 0; k < 4; k++) add(G.cyl(.035, .035, .1, 8), '#7fbf86', x - .14 + k * .09, y + .17, z - .45); }
    add(G.box(.36, .5, .26, .1), '#f4ead6', .42, .25, z - .5); add(G.box(.3, .1, .02, .01), C.red, .42, .32, z - .365);
  }));
  const pv = new THREE.Group(); put(pv, 0, TOP, z + .03); f.add(pv);
  const slats = put(rbox(W, TOP - LOW, .025, '#ffffff', .008, { map: shutterTex() }), 0, -(TOP - LOW) / 2, 0); pv.add(slats);
  const bar = put(rbox(W + .02, .07, .05, '#b9c3cc', .015), 0, -(TOP - LOW) - .02, .01); pv.add(bar);
  pv.add(put(pane(.32, .25, noteTex()), .22, -(TOP - LOW) + .32, .016, 0, 0, -.06));
  // 크랭크 상자 (모서리 기둥 앞면, 손잡이 꽂는 구멍)가 장치의 손잡이(누르는 곳): 전엔 손잡이가 숨은 크랭크 모형이라 셔터를 눌러도
  // 흔들리기만 하고, 보이지 않는 점 둘레 44 px 안을 눌러야 열렸음 — 25판 봇이 손잡이를 들고 40초씩 못 누르던 것. 상자를 조금 키움 (② 10/24)
  const cbox = new THREE.Group(); f.add(cbox);
  cbox.add(mc('cbox', ({ add }) => {
    add(G.box(.22, .32, .12, .03), '#8fa0ab', CX, 1.05, CZ);
    add(G.cyl(.05, .05, .07, 12), '#4b4f5e', CX, 1.05, CZ + .07, HP, 0, 0);
    add(G.box(.06, .16, .02, .006), C.yel, CX, 1.25, CZ + .061);
  }));
  const hasHandle = new THREE.Group(); put(hasHandle, CX, 1.05, CZ + .1); f.add(hasHandle);
  hasHandle.visible = false;
  hasHandle.add(mc('crank', ({ add }) => { add(G.box(.04, .26, .04, .01), '#c9cfe0', 0, -.12, .02); add(G.cyl(.035, .035, .1, 10), '#ffcf5c', 0, -.24, .07, HP, 0, 0); }));
  const p = f.part('shutter', [cbox, pv, hasHandle], t => {
    const k = Math.min(1, t * 1.05); pv.scale.y = 1 - .93 * k; hasHandle.visible = t > .01; hasHandle.rotation.z = -t * PI * 8;
  }, { label: '셔터 크랭크', sfx: 'drawer', dur: 1.6 });
  p.handle = cbox;
  f.spot('inside', null, -.38, .56, z - .45, { part: p, maxH: .32, label: '셔터 안 음료 상자 위', scale: .8 });
  f.spot('on', null, .42, .5, z - .5, { maxH: .3, label: '쌀 포대 위', scale: .75 });
};

// ── 옥상 도르래 바구니 (장치 끝): 옥상 데크 앞 기둥(데크를 받침)에 팔이 나와 도르래, 바구니가 데크 높이에 매달려 있다가 내려옴 ──
// local: 바구니 (0, y, 0) · 기둥 (.32, -.72) — 맵에서 (3.6, -1.35)에 놓으면 기둥이 데크 앞 모서리(3.92, -2.07)
B.cs3_hoist = (f, T) => {
  f.collideBox = [.18, 0, -.86, .46, 4.3, -.58]; f.noSolid = true; f.walkBoxes = [[.22, 0, -.82, .42, 4.3, -.62]];
  const PX = .32, PZ = -.72, TOP = 4.25, YT = 3.05, YB = .06;
  f.add(mc('post', ({ add, tube }) => {
    add(G.box(.14, TOP, .14, .02), C.steel, PX, TOP / 2, PZ);
    add(G.box(.28, .05, .28, .015), C.steelD, PX, .025, PZ);
    tube([PX, TOP - .1, PZ], [0, TOP - .1, 0], .045, C.steel, 8);   // 팔
    tube([PX, TOP - .7, PZ], [PX * .45, TOP - .12, PZ * .45], .03, C.steel, 8);   // 버팀
    add(G.cyl(.15, .15, .06, 20), C.yel, 0, TOP - .26, 0, 0, HP * .75, HP);   // 도르래 바퀴
    add(G.tor(.15, .02, PI * 2, 6, 20), C.yel2, 0, TOP - .26, 0, 0, HP * .75 + HP, 0);
    add(G.box(.06, .16, .06, .01), C.steelD, 0, TOP - .14, 0);
    // 크랭크 상자 (기둥 1 m 높이, 손잡이 노랑)
    add(G.box(.18, .22, .16, .03), C.steelD, PX - .14, 1.05, PZ + .02);
    add(G.cyl(.03, .03, .16, 8), '#c9cfe0', PX - .14, 1.05, PZ + .14, HP, 0, 0);
    tube([PX - .1, 1.12, PZ], [PX - .06, TOP - .3, PZ], .01, '#e8d8b8', 5);
  }));
  const crank = new THREE.Group(); put(crank, PX - .14, 1.05, PZ + .22); f.add(crank);
  crank.add(mc('hcrank', ({ add }) => { add(G.box(.04, .2, .04, .01), '#c9cfe0', 0, -.08, 0); add(G.cyl(.035, .035, .1, 10), C.red, 0, -.17, .05, HP, 0, 0); }));
  const basket = new THREE.Group(); put(basket, 0, YT, 0); f.add(basket);
  basket.add(mc('basket', ({ add, tube }) => {
    add(G.box(.52, .04, .42, .015), '#b97a45', 0, .02, 0);
    for (const sx of [-1, 1]) add(G.box(.035, .22, .42, .012), '#d9a05b', sx * .2425, .11, 0);
    for (const sz of [-1, 1]) add(G.box(.52, .22, .035, .012), '#d9a05b', 0, .11, sz * .1925);
    for (let y = .06; y < .22; y += .065) for (const sz of [-1, 1]) add(G.box(.53, .02, .03, .008), '#c78a45', 0, y, sz * .2);
    for (const sz of [-1, 1]) add(G.box(.55, .035, .05, .012), '#c78a45', 0, .22, sz * .2);
    for (const sx of [-1, 1]) add(G.box(.05, .035, .44, .012), '#c78a45', sx * .25, .22, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tube([sx * .23, .22, sz * .18], [0, .66, 0], .008, '#e8d8b8', 4);
    add(G.tor(.05, .012, PI * 2, 5, 12), '#c9cfe0', 0, .68, 0);
    // 짚 깔개 (넣은 것이 테두리 위로 보이게)
    add(G.box(.46, .05, .36, .02), '#f2dc9a', 0, .065, 0);
  }));
  const rope = new THREE.Group(); put(rope, 0, TOP - .26, 0); f.add(rope);
  rope.add(mc('rope', ({ add }) => add(G.cyl(.012, .012, 1, 5), '#e8d8b8', 0, -.5, 0)));
  const setRope = by => { rope.scale.y = Math.max(.05, TOP - .26 - (by + .7)); };
  setRope(YT);
  const p = f.part('lift', [basket, crank, rope], (t, bB) => {
    basket.position.y = YT + (YB - YT) * t; basket.rotation.z = Math.sin(t * PI * 3) * .05 * (1 - t);
    crank.rotation.x = -t * PI * 7; setRope(basket.position.y);
  }, { label: '옥상 도르래 바구니', sfx: 'swish', dur: 1.5 });
  p.handle = crank;
  f.spot('inside', basket, 0, .09, 0, { part: p, maxH: .26, label: '옥상 바구니 안', scale: .95 });
  f.spot('behind', null, PX, 0, PZ + .2, { maxH: .3, label: '도르래 기둥 옆', scale: .7 });
};

// ── 가게 앞 과일·채소 좌판 (2×1): 계단식 나무 상자 셋(사과·귤·양배추), 대파 한 단, 달걀 판, 값표, 앞에 빈 상자 하나 ──
B.cs3_stand = (f, T) => {
  f.add(mc('stand', ({ add }) => {
    // 받침대: 나무 다리 둘 + 경사 판
    for (const x of [-.85, .85]) { add(G.box(.06, .62, .5, .015), C.woodD, x, .31, -.05); }
    add(G.box(1.8, .05, .56, .015), C.wood, 0, .44, .02, .18, 0, 0);
    add(G.box(1.8, .05, .36, .015), C.wood, 0, .74, -.24, .18, 0, 0);
    add(G.box(1.76, .04, .04, .01), C.woodD, 0, .2, .2);
    // 상자 (아래 셋, 위 둘)
    for (const [x, y, z] of [[-.58, .5, .05], [0, .5, .05], [.58, .5, .05], [-.3, .8, -.22], [.3, .8, -.22]]) {
      add(G.box(.54, .14, .38, .015), C.kraft, x, y, z, .18, 0, 0);
      add(G.box(.5, .03, .34, .01), C.kraft2, x, y + .05, z, .18, 0, 0);
    }
  }));
  // 과일: 사과(빨강), 귤(주황), 양배추(연두) — 상자마다 소복이
  const pile = (key, color, x, y, z, r, n, leaf) => f.add(mc('pile|' + key, ({ add }) => {
    for (let i = 0; i < n; i++) { const a = i * 2.39, rr = (i % 4) * .045 + .02; add(G.sph(r, 12, 9), color, x + Math.cos(a) * rr * 2.4, y + r * .7 + (i > n * .6 ? r * .8 : 0), z + Math.sin(a) * rr * 1.4); }
    if (leaf) for (let i = 0; i < 4; i++) add(G.sph(r * .32, 6, 5), leaf, x - .16 + i * .1, y + r * 1.8, z + .02, 0, 0, .4, [1.6, .4, .9]);
  }));
  pile('apple', C.apple, -.58, .55, .06, .07, 11, '#4c9a4a'); pile('mand', C.mandarin, 0, .55, .06, .062, 13);
  pile('cab', C.cabbage, .58, .55, .06, .11, 4); pile('peach', '#ffb3a0', .3, .85, -.2, .065, 7);
  f.add(mc('cabvein', ({ add }) => { for (let i = 0; i < 4; i++) add(G.sph(.075, 8, 6), '#d8f0b0', .58 + Math.cos(i * 2.39) * .07, .7, .06 + Math.sin(i * 2.39) * .05, 0, 0, 0, [1, .6, 1]); }));
  // 대파 한 단 (오른 다리에 기대어) · 달걀 판 (왼쪽 위)
  f.add(mc('leek2', ({ add, tube }) => {
    // 대파 한 단: 왼쪽 다리에 비스듬히 기댄 흰 줄기 다섯과 갈라진 초록 잎, 빨간 끈
    for (let i = 0; i < 5; i++) { const dx = (i - 2) * .025, a = [-1.02 + dx, .03, .12 + dx * .5], b = [-1.0 + dx * 1.4, .55, .02 + dx], c1 = [-1.08 + dx * 3, .95, -.08 + dx * 2], c2 = [-.9 + dx * 2, .88, -.12];
      tube(a, b, .024, '#f4f6ee', 8); tube(b, c1, .02, C.leek, 8); tube(b, c2, .017, '#4fae4c', 8); }
    add(G.cyl(.075, .075, .04, 12), C.red, -1.01, .3, .07);
  }));
  f.add(mc('eggs', ({ add }) => { add(G.box(.36, .04, .28, .01), '#e6d6b8', .78, .98, -.32, .18, 0, 0); for (let i = 0; i < 12; i++) add(G.sph(.034, 8, 6), C.egg, .66 + (i % 4) * .08, 1.02 + Math.floor(i / 4) * .015, -.4 + Math.floor(i / 4) * .08, 0, 0, 0, [1, 1.25, 1]); }));
  // 값표 (상자 앞에 꽂은 카드)
  [['사과 5천', -.58], ['귤 3천', 0], ['양배추 2천', .58]].forEach(([s, x]) => f.add(put(pane(.26, .13, cardTex('price|' + s, 260, 130, '#fffaf0', C.ink, [s], { line: C.red, lw: 5 })), x, .5, .25, -.2, 0, 0)));
  // (10/30 사용자 "여기코너 정리": what was hidden here stood in the yellow fruit — the top-left box is left empty for it)
  f.spot('on', null, -.3, .84, -.2, { maxH: .3, label: '좌판 위 상자', scale: .8 });
  f.spot('under', null, .1, .02, -.05, { maxH: .36, label: '좌판 밑', scale: .85 });
  f.spot('behind', null, -.6, .02, -.36, { maxH: .4, label: '좌판 뒤', scale: .8 });
  // 앞에 놓인 스티로폼 상자 (뚜껑이 들림)
  f.add(mc('styro', ({ add }) => { add(cutFace(G.box(.42, .24, .3, .04)), '#f6f6f0', -.3, .12, .32); add(liner(.34, .185, .22), '#d8d8d0', -.3, .1425, .32); add(windowFace(.44, .32, [-.175, .175, -.115, .115]), '#e3e3dc', -.3, .255, .32, -HP, 0, 0); }));
  f.add(put(pane(.3, .08, cardTex('styro', 300, 80, '#f6f6f0', C.blue, ['싱싱 채소'], { size: 56 })), -.3, .13, .471));
  const lid = new THREE.Group(); put(lid, -.3, .25, .17); f.add(lid);
  lid.add(mc('styrolid', ({ add }) => add(G.box(.44, .04, .32, .02), '#fbfbf6', 0, .02, .16)));
  const lp = f.part('lid', lid, t => { lid.rotation.x = -1.4 * t; }, { label: '스티로폼 상자', sfx: 'open', dur: .3 });
  lp.lockable = true; lp.lockKind = 'pad'; f.lockAt = { x: 0, y: .02, z: .33, parent: lid };
  f.spot('inside', null, -.3, .05, .32, { part: lp, maxH: .2, label: '스티로폼 상자 안', scale: .7 });
};

// ── 캡슐 뽑기 둘 (1×1, 보조 장난감): 네모난 뽑기 기계 두 대 — 위 칸 유리창에 캡슐이 가득, 머리판 '뽑기', 아래 손잡이·동전 구멍·꺼내는 곳.
// 터치하면 손잡이가 한 바퀴 돌고 캡슐이 데굴 (동그란 유리공은 캡슐 점이 눈처럼 보여서 네모 창으로)
const gachaWin = (k) => TEX.get('cs3|gwin|' + k, () => canvasTex(160, 160, (c, w, h) => {
  c.fillStyle = '#e4f3fb'; c.fillRect(0, 0, w, h);
  const cols = ['#ffd36b', '#ff9fb6', '#8fdfc0', '#ffb27a', '#b9a6f2', '#ffffff'];
  for (let i = 0; i < 26; i++) { const x = 14 + hash(i * 3 + k * 50) * (w - 28), y = 26 + (i / 26) * (h - 36) + (hash(i + 7 + k) - .5) * 14, r = 11;
    c.fillStyle = cols[i % 6]; c.beginPath(); c.arc(x, y, r, PI, 0); c.fill(); c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(x, y, r, 0, PI); c.fill();
    c.strokeStyle = 'rgba(80,90,120,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(10, 8, 12, h - 16);
}));
B.cs3_gacha = (f, T) => {
  const one = (x, body, key, k) => {
    f.add(mc('gbox|' + key, ({ add }) => {
      add(G.box(.38, .5, .36, .03), body, x, .25, 0);
      add(G.box(.4, .04, .38, .015), shade(body, -.18), x, .52, 0);
      add(G.box(.38, .42, .36, .03), '#f4f6fa', x, .76, 0);
      add(G.box(.4, .12, .38, .03), body, x, 1.02, 0);
      add(G.box(.14, .1, .04, .02), '#3b3a50', x, .12, .17);
      add(G.box(.05, .08, .02, .006), '#c9cfe0', x + .11, .36, .181);
    }));
    f.add(put(pane(.3, .34, gachaWin(k)), x, .77, .182));
    f.add(put(pane(.32, .09, cardTex('gtop' + k, 320, 90, body, '#ffffff', ['뽑기'], { size: 70 })), x, 1.02, .192));
    f.add(put(pane(.15, .08, cardTex('g500', 150, 80, '#ffffff', C.ink, ['500원'], { size: 48 })), x - .07, .37, .181));
  };
  one(-.2, C.red, 'r', 0); one(.2, C.blue, 'b', 1);
  const knob = new THREE.Group(); put(knob, -.2, .26, .19); f.add(knob);
  knob.add(mc('knob', ({ add }) => { add(G.cyl(.07, .07, .04, 14), C.yel, 0, 0, 0, HP, 0, 0); add(G.box(.12, .03, .03, .01), C.yel2, 0, 0, .025); }));
  const cap = new THREE.Group(); put(cap, -.2, .1, .17); f.add(cap); cap.scale.setScalar(.001);
  cap.add(mc('capsule', ({ add }) => { add(G.sph(.05, 10, 8), C.pink, 0, .05, 0, 0, 0, 0, [1, .5, 1]); add(G.sph(.05, 10, 8), '#ffffff', 0, .045, 0, PI, 0, 0, [1, .5, 1]); }));
  const p = f.part('lift', [knob, cap], (t, bk, bc) => {
    knob.rotation.z = -t * PI * 2;
    const u = Math.max(0, (t - .55) / .45); cap.scale.setScalar(u > 0 ? 1 : .001); cap.position.set(bc.p.x + u * .25, bc.p.y - u * .08, bc.p.z + u * .3); cap.rotation.z = -u * 6;
  }, { label: '캡슐 뽑기', sfx: 'click', dur: 1.0 });
  p.handle = knob;
  f.spot('on', null, .2, 1.08, 0, { maxH: .3, label: '뽑기 기계 위', scale: .75 });
  f.spot('behind', null, 0, 0, -.26, { maxH: .36, label: '뽑기 기계 뒤', scale: .8 });
};

// ── 음료 상자 더미 (1×1): 초록·파랑 플라스틱 상자 셋에 병이 꽂혀 있음 (가게 안 창 밑) ──
B.cs3_crates = (f, T) => {
  f.add(mc('crates', ({ add }) => {
    for (const [x, y, z, c, ry] of [[-.15, 0, -.1, C.green, 0], [.17, 0, .08, C.plastic, .12], [-.1, .3, -.05, C.plastic, -.08]]) {
      add(G.box(.42, .28, .32, .02), c, x, y + .14, z, 0, ry, 0);
      add(G.box(.36, .2, .26, .02), shade(c, -.25), x, y + .17, z, 0, ry, 0);
      for (let i = 0; i < 6; i++) { const bx = x - .12 + (i % 3) * .12, bz = z - .06 + Math.floor(i / 3) * .12; add(G.cyl(.032, .036, .2, 10), i % 2 ? '#5fae6a' : '#7fc58a', bx, y + .3, bz); add(G.cyl(.014, .02, .08, 8), '#4f9a5a', bx, y + .44, bz); }
    }
  }));
  f.spot('on', null, -.1, .58, -.05, { maxH: .3, label: '음료 상자 위', scale: .75 });
  f.spot('behind', null, .2, 0, -.3, { maxH: .3, label: '음료 상자 뒤', scale: .75 });
};

// ── 입간판 (1×1, 보조): '오늘의 특가' 칠판 — 터치하면 뒤집혀 뒷면 '라면 1+1' ──
B.cs3_sign = (f, T) => {
  f.add(mc('aframe', ({ add }) => { for (const s of [-1, 1]) for (const x of [-.27, .27]) add(G.box(.04, .9, .04, .01), C.woodD, x, .44, s * .13, s * -.16, 0, 0); }));
  const pv = new THREE.Group(); put(pv, 0, .52, 0); f.add(pv);
  pv.add(mc('board', ({ add }) => { add(G.box(.56, .62, .05, .02), C.wood, 0, 0, 0); add(G.box(.5, .56, .055, .01), '#3e5e52', 0, 0, 0); }));
  const chalk = (k, lines, col) => cardTex('chalk|' + k, 250, 280, '#3e5e52', col, lines, { r: 4, size: 120, fit: .86 });
  pv.add(put(pane(.48, .54, chalk('f', ['오늘의', '특가'], ['#ffffff', '#ffd36b'])), 0, 0, .03));
  pv.add(put(pane(.48, .54, chalk('b', ['라면', '1+1'], ['#ffffff', '#ff9f8a'])), 0, 0, -.03, 0, PI, 0));
  const p = f.part('picture', pv, t => { pv.rotation.y = PI * t; }, { label: '입간판', sfx: 'flip', dur: .5 });
  f.spot('under', null, 0, 0, 0, { maxH: .36, label: '입간판 밑', scale: .8 });
};

// ── 문 앞 고양이 (1×1, 보조): 문턱 옆에 앉은 턱시도 고양이 — 터치하면 꼬리를 흔들고 고개를 갸웃 ──
B.cs3_cat = (f, T) => {
  f.noSolid = true; f.walkBoxes = [[-.22, 0, -.2, .22, .6, .2]];
  f.add(mc('mat', ({ add }) => { add(G.box(.5, .02, .38, .01), '#c76a5a', 0, .01, .05); add(G.box(1.05, .02, .5, .01), '#5d6b8c', .62, .01, .02); add(G.box(.95, .022, .4, .01), '#6f7fa3', .62, .012, .02); }));
  const cat = new THREE.Group(); f.add(cat);
  cat.add(mc('catbody', ({ add }) => {
    add(G.sph(.15, 14, 10), '#3a3445', 0, .16, 0, 0, 0, 0, [1, 1.15, .9]);
    add(G.sph(.1, 12, 8), '#fbf6ee', 0, .15, .1, 0, 0, 0, [.9, 1.2, .5]);
    for (const x of [-.06, .06]) add(G.sph(.045, 8, 6), '#fbf6ee', x, .03, .11, 0, 0, 0, [1, .6, 1.3]);
  }));
  const head = new THREE.Group(); put(head, 0, .36, .03); cat.add(head);
  head.add(mc('cathead', ({ add }) => {
    add(G.sph(.12, 14, 10), '#3a3445', 0, 0, 0, 0, 0, 0, [1.12, .95, 1]);
    for (const s of [-1, 1]) { add(G.cone(.055, .1, 8), '#3a3445', s * .075, .1, -.01, 0, 0, -s * .3); add(G.cone(.03, .05, 6), '#ff9fb6', s * .075, .095, .012, 0, 0, -s * .3); }
    // (10/30 사용자 "가게 문앞 고양이 못생김": small yellow pinpricks for eyes → round ink eyes with a shine, cheeks, a soft muzzle)
    add(G.sph(.07, 12, 8), '#fbf6ee', 0, -.045, .075, 0, 0, 0, [1.25, .75, .65]);
    for (const s of [-1, 1]) { add(G.sph(.026, 10, 8), '#2a1d33', s * .052, .015, .1, 0, 0, 0, [1, 1.15, .6]); add(G.sph(.009, 6, 5), '#ffffff', s * .052 + .008, .027, .115); add(G.sph(.022, 8, 6), '#ffb3c4', s * .085, -.035, .085, 0, 0, 0, [1.2, .7, .5]); }
    add(G.sph(.014, 6, 5), '#ff8fa8', 0, -.025, .125, 0, 0, 0, [1.2, .8, 1]);
  }));
  const tail = new THREE.Group(); put(tail, -.1, .06, -.08); cat.add(tail);
  tail.add(mc('cattail', ({ tube }) => { tube([0, 0, 0], [-.12, .05, .06], .03, '#3a3445', 6); tube([-.12, .05, .06], [-.16, .2, .12], .028, '#3a3445', 6); }));
  put(cat, 0, .02, 0); cat.scale.setScalar(1.25);
  const p = f.part('lift', [head, tail], (t, bh) => { const w = Math.sin(t * PI); head.rotation.z = .35 * w; tail.rotation.y = Math.sin(t * PI * 4) * .6; }, { label: '문 앞 고양이', sfx: 'pop', dur: 1.0 });
  f.spot('behind', null, .16, .02, -.12, { maxH: .26, label: '고양이 옆', scale: .7 });
};

// ── 가게 벽 선반 (2×1, 높은 칸): 라면 묶음·세제·휴지 묶음·통조림·과자 봉지, 맨 위 휴지, 아래 쌀 포대 ──
B.cs3_goods = (f, T) => {
  const W = 1.86, D = .44, H = 2.0, z0 = -.25;
  f.add(mc('goodsframe', ({ add }) => {
    for (const x of [-W / 2, W / 2]) add(G.box(.05, H, D, .01), '#dfe3e8', x, H / 2, z0);
    add(G.box(W, H, .03, .01), '#eef1f4', 0, H / 2, z0 - D / 2 + .015);
    for (const y of [.08, .5, .9, 1.3, 1.7]) add(G.box(W, .04, D, .01), '#dfe3e8', 0, y, z0);
    for (const y of [.5, .9, 1.3, 1.7]) add(G.box(W, .05, .015, .006), '#ffcf5c', 0, y - .02, z0 + D / 2);   // 값표 띠
  }));
  const r = k => hash(k * 7.3 + 1);
  f.add(mc('goods', ({ add }) => {
    // 라면 다섯 개 묶음 (빨강·주황)
    for (let i = 0; i < 4; i++) add(G.box(.4, .28, .22, .04), i % 2 ? C.red : '#ff8f3a', -.7 + i * .46, 1.47, z0 + .02);
    // 과자 봉지 (부푼)
    for (let i = 0; i < 6; i++) add(G.box(.22, .3, .1, .06), [C.yel, C.mint, C.pink, C.blue, '#a8d873', C.red][i], -.75 + i * .3, 1.07, z0 + .05, 0, 0, (r(i) - .5) * .2);
    // 세제·통조림
    for (let i = 0; i < 5; i++) add(G.box(.2, .28, .14, .03), ['#6fb6f0', '#ffffff', '#ff9fb6', '#8fdfc0', '#6fb6f0'][i], -.72 + i * .36, .67, z0 + .04);
    for (let i = 0; i < 6; i++) add(G.cyl(.06, .06, .12, 12), i % 2 ? '#e8e2d2' : '#f2c66b', -.15 + (i % 3) * .14, .58 + Math.floor(i / 3) * .13, z0 + .12);
    // 맨 위 휴지 묶음 둘
    for (const x of [-.45, .4]) { add(G.box(.62, .34, .38, .05), '#f8f8fb', x, 1.9, z0); for (let i = 0; i < 3; i++) add(G.cyl(.085, .085, .32, 12), '#ffffff', x - .19 + i * .19, 1.9, z0 + .1, HP, 0, 0); add(G.box(.62, .06, .02, .01), '#7fc7e8', x, 1.93, z0 + .19); }
    // 바닥 칸 쌀 포대
    for (const x of [-.48, .4]) { add(G.box(.62, .3, .34, .1), '#f4ead6', x, .26, z0 + .02); add(G.box(.3, .12, .02, .01), C.red, x, .3, z0 + .19); }
  }));
  f.spot('on', null, .1, 1.72, z0 + .05, { maxH: .26, label: '선반 맨 위 칸', scale: .75 });
  f.spot('inside', null, .82, .92, z0 + .08, { maxH: .3, label: '과자 칸 끝', scale: .7 });
  f.spot('inside', null, -.05, .1, z0 + .1, { maxH: .3, label: '쌀 포대 사이', scale: .75 });
  f.spot('on', null, .35, .52, z0 + .1, { maxH: .26, label: '통조림 옆', scale: .7 });
};

// ── 건너편 보도 소품 (낮은 것만 — 카메라 쪽이라): 콘크리트 화단 (조각마다 작게 놓아야 걷기 그래프의 다른 방 칸을 안 막음) ──
B.cs3_planter = f => {
  f.add(mc('planter', ({ add }) => {
    add(G.box(1.2, .36, .42, .05), '#d9d3ca', 0, .18, 0); add(G.box(1.24, .05, .46, .02), '#ebe6de', 0, .37, 0);
    add(G.box(1.1, .04, .32, .01), '#8a6448', 0, .36, 0);
    for (let i = 0; i < 6; i++) add(G.sph(.13 + (i % 2) * .03, 10, 8), i % 2 ? '#6fbf62' : '#84cc6c', -.45 + i * .18, .48 + (i % 2) * .05, (i % 3 - 1) * .05, 0, 0, 0, [1, .85, 1]);
    for (let i = 0; i < 9; i++) add(G.sph(.035, 8, 6), ['#ff9fb6', '#ffffff', '#ffd36b'][i % 3], -.48 + i * .12, .6 + (i % 2) * .04, (i % 2 ? .1 : -.08));
  }));
  f.spot('behind', null, 0, .38, .02, { maxH: .26, label: '화단 풀 사이', scale: .7 });
};

// ── 철계단 (stairsup steel: 정본 계단과 같은 길·높이 — 걷기 그래프 그대로): 체크 무늬 디딤판, 채널 옆판, 양쪽 난간, 밑은 트여 있음 ──
const ORIG_STAIRS = MAP_BUILDERS.stairsup;
function steelStairs(f, T) {
  const N = 12, RISE = FLOOR_H / N, RUN = 3 / N, SW = .9, k = FLOOR_H / 3;
  const yr = z => (1.5 - z) * k + RISE + .86;
  f.add(mc('steelstairs', ({ add, tube }) => {
    for (let i = 1; i <= N; i++) {
      const y = i * RISE, zc = 1.5 - (i - .5) * RUN;
      add(G.box(SW, .045, RUN + .03, .01), '#aebfc6', 0, y - .0225, zc - .01);
      add(G.box(SW - .04, .03, .03, .008), C.teal, 0, y - .06, zc + RUN / 2 - .01);   // 노즈
      for (let q = 0; q < 3; q++) add(G.box(SW - .1, .006, .014, .003), '#92a6af', 0, y + .002, zc - RUN / 2 + .06 + q * .07);   // 미끄럼 방지 줄
    }
    // 채널 옆판 (기울어진 판)
    const L = Math.hypot(3, FLOOR_H), ang = Math.atan2(FLOOR_H, 3);
    for (const s of [-1, 1]) add(G.box(.06, .2, L + .1, .015), C.teal, s * (SW / 2 + .03), FLOOR_H / 2 - .04, 0, ang, 0, 0);
    // 난간: 양쪽, 기둥은 두 칸마다
    for (const s of [-1, 1]) {
      const rx = s * (SW / 2 + .04);
      tube([rx, yr(1.42), 1.42], [rx, yr(-1.45), -1.45], .025, C.teal, 8);
      tube([rx, yr(1.42) - .42, 1.42], [rx, yr(-1.45) - .42, -1.45], .014, C.teal, 6);
      for (let i = 0; i <= N; i += 2) { const z = 1.5 - Math.max(.5, i - .5) * RUN; tube([rx, Math.max(i, 1) * RISE, z], [rx, yr(z), z], .016, C.teal, 6); }
    }
    // 바닥 받침 (콘크리트 받침돌)
    add(G.box(SW + .2, .08, .3, .02), C.stone, 0, .04, 1.42);
  }));
  // 계단 밑: 빨간 고무 대야 · 빗자루 · 가스통 (밑은 트여 있어 보임)
  f.add(mc('under', ({ add, tube }) => {
    add(G.cyl(.24, .19, .2, 16), C.red, .05, .1, -.6);
    add(G.cyl(.2, .2, .02, 16), '#d9483e', .05, .19, -.6);
    tube([-.3, .02, -1.0], [-.26, 1.0, -1.25], .014, C.wood, 5); add(G.cone(.08, .22, 8), '#ffcf5c', -.3, .1, -1.0, .1, 0, .05);
    add(G.cyl(.13, .13, .5, 14), '#e8edf2', .22, .25, -1.25); add(G.cyl(.06, .08, .08, 10), '#9aa3ba', .22, .54, -1.25);
  }));
  f.spot('inside', null, .05, .12, -.6, { maxH: .3, label: '계단 밑 빨간 대야', scale: .8 });
  f.spot('under', null, -.1, 0, .2, { maxH: .5, label: '철계단 밑', scale: .9 });
  f.stairs = { from: { x: 0, y: 0, z: 1.5 }, to: { x: 0, y: FLOOR_H, z: -1.5 }, steps: N, rise: RISE, run: RUN, width: SW };
}
// stairsup은 걷기·친구 길찾기가 이름으로 찾음(companion.js walkGrid) — 이 판만 opts.steel로 겉모양만 바꿈
// 계산대(counter2): 이 판에서만 호빵 찜기 안 자리를 닫음 — 찜기 칸이 작아 거기 든 물건이 시작 화면 20 px(#94 28 px 밑)
export const CS3_COUNTER = orig => (f, T, o = {}) => { orig(f, T, o); if (o.cs3) for (const s of f.spots) if (s.label === '호빵 찜기 안') s.maxH = .02; };
export const CS3_STAIRS = (f, T, o = {}) => (o.steel ? steelStairs(f, T, o) : ORIG_STAIRS(f, T, o));

export const CS3_BUILDERS = B;
export const CS3_INFO = {
  cs3_base: { w: 1, d: 1, name: '모퉁이 길', hidden: true },
  cs3_front: { w: 1, d: 1, name: '행복슈퍼 앞면', hidden: true },
  cs3_fascia: { w: 1, d: 1, name: '행복슈퍼 간판', hidden: true },
  cs3_deck: { w: 1, d: 1, name: '옥상 데크 기둥', hidden: true },
  cs3_shutter: { w: 1, d: 1, name: '셔터', hidden: true },
  cs3_hoist: { w: 1, d: 1, name: '옥상 도르래 바구니', hidden: true },
  cs3_stand: { w: 2, d: 1, name: '과일 좌판', hidden: true },
  cs3_gacha: { w: 1, d: 1, name: '캡슐 뽑기', hidden: true },
  cs3_sign: { w: 1, d: 1, name: '입간판', hidden: true },
  cs3_cat: { w: 1, d: 1, name: '문 앞 고양이', hidden: true },
  cs3_goods: { w: 2, d: 1, name: '가게 벽 선반', hidden: true },
  cs3_crates: { w: 1, d: 1, name: '음료 상자 더미', hidden: true },
  cs3_planter: { w: 1, d: 1, name: '길가 화단', hidden: true },
};
export const CS3_EN = {
  '모퉁이 길': 'Street corner', '행복슈퍼 앞면': 'Happy Mart front', '행복슈퍼 간판': 'Happy Mart sign', '옥상 데크 기둥': 'Deck post', '셔터': 'Shutter', '셔터 크랭크': 'Shutter crank', '옥상 도르래 바구니': 'Rooftop pulley basket',
  '옥상 바구니 안': 'In the rooftop basket', '도르래 기둥 옆': 'By the pulley post', '셔터 안 음료 상자 위': 'On the drink crates behind the shutter', '쌀 포대 위': 'On the rice sack',
  '과일 좌판': 'Fruit stand', '좌판 위 상자': 'Top crate of the stand', '좌판 밑': 'Under the stand', '좌판 뒤': 'Behind the stand', '스티로폼 상자': 'Styrofoam box', '스티로폼 상자 안': 'In the styrofoam box',
  '캡슐 뽑기': 'Capsule machine', '뽑기 기계 위': 'On the capsule machine', '뽑기 기계 뒤': 'Behind the capsule machine', '입간판': 'Sandwich board', '입간판 밑': 'Under the sandwich board',
  '문 앞 고양이': 'Cat at the door', '고양이 옆': 'Beside the cat', '가게 벽 선반': 'Shop shelves', '선반 맨 위 칸': 'Top shelf', '과자 칸 끝': 'End of the snack shelf', '쌀 포대 사이': 'Between the rice sacks', '통조림 옆': 'By the cans',
  '계단 밑 빨간 대야': 'Red tub under the stairs', '철계단 밑': 'Under the steel stairs', '행복슈퍼': 'Happy Mart', '잠시': 'Back', '외출중': 'soon',
  '라면 특가': 'Ramen sale', '택배 접수': 'Parcels', '복권 판매': 'Lottery', '천천히': 'SLOW', '담배': 'TOBACCO', '사과 5천': 'Apples 5,000', '귤 3천': 'Tangerines 3,000', '양배추 2천': 'Cabbage 2,000',
  '싱싱 채소': 'Fresh veg', '500원': '500 won', '오늘의': "Today's", '특가': 'Deal', '라면': 'Ramen', '1+1': '1+1', '음료 상자 더미': 'Drink crates', '음료 상자 위': 'On the drink crates', '음료 상자 뒤': 'Behind the drink crates', '뽑기': 'Gacha', '길가 화단': 'Street planter', '화단 풀 사이': 'In the planter',
};

// 23판 삐딱이네 장독대 마당 jangdokyard (⑦ 10/23, 사용자 1~70 검토 시트: "도로에 장독대 있는 느낌 → 바닥 정리, 장독대 디테일하게 다시
// 모델링"): 옛 alley1은 아스팔트 바닥 한가운데 항아리·평상이 놓여 길바닥에 살림을 내놓은 것처럼 보였다. 여기서는 집 마당과 골목길을 나눈다.
//   방(걷는 곳) = 삐딱이네 시멘트 마당 + 대문 밖 보도 한 줄. 보도 앞 화강암 연석 한 단(14 cm) 아래로 골목 차도가 섬 양 끝까지 그대로 흐르고
//   (벽으로 막지 않음), 건너편 보도 한 줄이 섬을 마무리한다. 마당과 보도 사이는 낮은 벽돌 담 + 초록 철 난간(보이게)과 열린 초록 대문.
//   마당 안쪽: 뒤에 집 앞면(미닫이 유리문·방범창·기와 처마·마루·섬돌), 왼쪽 구석에 돌로 쌓은 장독대 — 크기 다른 옹기 여섯
//   (유약 광택·초화문 띠·금줄·소쿠리·면보), 앞 왼쪽 수돗가.
// 좌표는 방 좌표 그대로(바탕·집·담 세 조각은 x 0, z 0에 놓임): 방 6 × 5 (x -3~3, z -2.5~2.5). 담 z 1.25~1.45, 연석 z 2.5.
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, texCache, roundRect, shade } from './kit.js';
import { HG as G, hmc as rawMc } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';
import { boundary } from './outdoor.js';
import { EN } from '../i18n-en-dict.js';

const WORDS = { '삐딱이네': "Grumpy's", '천천히': 'SLOW', '우유': 'Milk', '23-7': '23-7' };
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

const PI = Math.PI, HP = PI / 2;
const mc = (key, fn) => rawMc('jd23|' + key, fn);
const TEX = texCache();
const C = {
  cement: '#ddd6ca', pave: '#e2d9d1', road: '#8b8798', curb: '#ece8e0', curb2: '#d3cdc2',
  stone: '#c9c0b2', stone2: '#b3a999', earth: '#b28d6c', earth2: '#94735a', grass: '#93c968', grass2: '#74b052',
  brick: '#cf7a5c', brick2: '#b9654a', cap: '#ebe3d6', green: '#3aa673', greenD: '#2b8259',
  plaster: '#f6ead6', plaster2: '#e9d8bd', wood: '#d9a066', woodD: '#a8693c', woodL: '#e9bb84', tile: '#6f7aa3', tile2: '#5a6590',
  onggi: '#7d4028', onggiL: '#9a5634', straw: '#e3c27a', red: '#e8473d', ink: '#2a1d33', white: '#fbf8f2', glass: '#cfe6ee',
};
// 섬: 둥근 네모 x ±3.55, z -2.9 ~ 4.75 (모서리 1.2). 마당·보도 z 2.5까지(방 바닥 높이), 차도 z 2.5 ~ 4.25 (14 cm 아래), 건너편 보도 그 앞
export const ISLE = { hx: 3.55, z0: -2.9, z1: 4.75, r: 1.2, curb: 2.5, curb2: 4.25, ry: -.14 };
// 앞 담 z · 대문 틈 x · 오른쪽 담 안쪽 면 x
const WALL = { z0: 1.25, z1: 1.45, gate: [.55, 1.85], ex0: 2.8 };

function isleOutline(grow = 0) {
  const { hx, z0, z1, r } = ISLE, X = hx + grow, A = z0 - grow, Bz = z1 + grow, out = [];
  const arc = (cx, cz, a0) => { for (let k = 0; k <= 10; k++) { const a = a0 + HP * k / 10; out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  arc(X - r, A + r, -HP); arc(X - r, Bz - r, 0); arc(-X + r, Bz - r, HP); arc(-X + r, A + r, PI);
  return out;
}
function clipZ(poly, za, zb) {
  const cut = (P, keep, zc) => { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = keep(a[1]), ib = keep(b[1]);
    if (ia) out.push(a); if (ia !== ib) { const t = (zc - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, zc]); } } return out; };
  return cut(cut(poly, z => z >= za, za), z => z <= zb, zb);
}
function clipX(poly, xa, xb) {
  const cut = (P, keep, xc) => { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = keep(a[0]), ib = keep(b[0]);
    if (ia) out.push(a); if (ia !== ib) { const t = (xc - a[0]) / (b[0] - a[0]); out.push([xc, a[1] + (b[1] - a[1]) * t]); } } return out; };
  return cut(cut(poly, x => x >= xa, xa), x => x <= xb, xb);
}
const halfW = z => { const { hx, z0, z1, r } = ISLE; const cz = z < z0 + r ? z0 + r : z > z1 - r ? z1 - r : null; return cz == null ? hx : hx - r + Math.sqrt(Math.max(0, r * r - (z - cz) ** 2)); };
const shapeOf = pts => { const s = new THREE.Shape(); s.moveTo(pts[0][0], -pts[0][1]); for (const p of pts.slice(1)) s.lineTo(p[0], -p[1]); return s; };
// 계단 우물 자리를 뚫은 모양 (반지하 계단 — 바탕의 판과 돌·흙 켜 모두)
const holed = (pts, grow = 0) => { const s = shapeOf(pts), { x0, x1, z0, z1 } = WELL, h = new THREE.Path(); h.moveTo(x0 - grow, -(z0 - .04)); h.lineTo(x0 - grow, -(z1 + grow)); h.lineTo(x1 + grow, -(z1 + grow)); h.lineTo(x1 + grow, -(z0 - .04)); h.closePath(); s.holes.push(h); return s; };
const flat = (pts, m, y) => { const o = mesh(new THREE.ShapeGeometry(shapeOf(pts)), m, { cast: false }); o.rotation.x = -HP; o.position.y = y; o.receiveShadow = true; return o; };
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

// ── textures (world-mapped where they lie flat: a ShapeGeometry's uv is x, -z in metres) ─────────────────────────────────
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const speck = (c, w, h, n, seed, cols) => { for (let k = 0; k < n; k++) { c.fillStyle = cols[Math.floor(hash(seed + k) * cols.length)]; c.fillRect(hash(seed + k * 3 + 1) * w, hash(seed + k * 7 + 2) * h, 1.5 + hash(k + seed) * 2.5, 1.5 + hash(k + seed + 9) * 2); } };
const cementTex = () => TEX.get('jd|cement', () => canvasTex(1024, 1024, (c, w, h) => {
  // 시멘트 마당: 따뜻한 회색, 흙손 자국 호, 잔 알갱이, 머리카락 같은 금 몇 줄, 줄눈(신축 이음) 한 줄씩 — 한 장이 2 m
  c.fillStyle = C.cement; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 60; k++) { const x = hash(k + 11) * w, y = hash(k + 12) * h, r = 60 + hash(k + 13) * 120; c.strokeStyle = `rgba(${hash(k) < .5 ? '255,255,255' : '150,140,128'},.11)`; c.lineWidth = 5 + hash(k + 14) * 8; c.beginPath(); c.arc(x, y, r, hash(k + 15) * 6, hash(k + 15) * 6 + 1.1); c.stroke(); }
  speck(c, w, h, 2600, 30, ['rgba(120,110,98,.14)', 'rgba(255,255,255,.18)', 'rgba(95,88,80,.12)']);
  c.strokeStyle = 'rgba(120,108,96,.38)'; c.lineWidth = 2; c.lineCap = 'round';
  for (const [x, y, s] of [[300, 220, 1], [760, 640, -1], [180, 820, 1]]) { c.beginPath(); c.moveTo(x, y); for (let k = 1; k < 8; k++) c.lineTo(x + k * 18 * s + (k % 2 ? 7 : -5), y + k * 12 + (k % 3) * 5); c.stroke(); }
  c.fillStyle = 'rgba(140,128,114,.45)'; c.fillRect(0, h / 2 - 2, w, 4); c.fillRect(w / 2 - 2, 0, 4, h);
  c.fillStyle = 'rgba(170,160,140,.12)'; for (const [x, y, r] of [[200, 500, 90], [700, 220, 70]]) { c.beginPath(); c.ellipse(x, y, r * 1.5, r, .3, 0, PI * 2); c.fill(); }
}, { repeat: [.5, .5] }));
const paverTex = () => TEX.get('jd|paver', () => canvasTex(1024, 1024, (c, w, h) => {
  // 보도블록: 20 × 10 cm 엇갈려 깔기, 회색에 연분홍이 섞임 — 한 장이 2 m
  const px = w / 2, bw = .2 * px, bh = .1 * px;
  c.fillStyle = '#bdb3ad'; c.fillRect(0, 0, w, h);
  const tones = ['#e4dcd6', '#ddd4ce', '#e9e2dc', '#d9cfc9', '#e2c4bb', '#d8b8ae'];
  for (let r = 0; r < h / bh; r++) for (let k = -1; k < w / bw + 1; k++) {
    const x = k * bw + (r % 2 ? bw / 2 : 0), y = r * bh, n = hash(r * 97 + k * 13);
    c.fillStyle = tones[n < .14 ? 4 + (n < .07 ? 1 : 0) : Math.floor(n * 4) % 4]; c.fillRect(x + 1.6, y + 1.6, bw - 3.2, bh - 3.2);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x + 1.6, y + 1.6, bw - 3.2, 2);
  }
  speck(c, w, h, 600, 70, ['rgba(110,100,95,.1)', 'rgba(110,100,95,.07)']);
}, { repeat: [.5, .5] }));
const roadTex = () => TEX.get('jd|road', () => canvasTex(1024, 1024, (c, w, h) => {
  // 골목 아스팔트: 보랏빛 회색 결, 굵은 알갱이, 땜질 자국, 잔금 — 한 장이 4 m
  c.fillStyle = C.road; c.fillRect(0, 0, w, h);
  speck(c, w, h, 5200, 200, ['rgba(58,56,78,.16)', 'rgba(255,255,255,.09)', 'rgba(40,38,60,.2)']);
  c.fillStyle = 'rgba(70,68,92,.3)'; roundRect(c, 140, 560, 260, 170, 12); c.fill(); roundRect(c, 690, 150, 150, 230, 12); c.fill();
  c.strokeStyle = 'rgba(52,50,72,.5)'; c.lineWidth = 2.5; c.lineCap = 'round';
  for (const [x, y, s] of [[440, 300, 1], [160, 880, -1], [840, 720, 1]]) { c.beginPath(); c.moveTo(x, y); for (let k = 1; k < 7; k++) c.lineTo(x + k * 22 * s + (k % 2 ? 8 : -6), y + k * 14 + (k % 3) * 6); c.stroke(); }
}, { repeat: [.25, .25] }));
const curbTex = () => TEX.get('jd|curb', () => canvasTex(256, 64, (c, w, h) => {
  c.fillStyle = C.curb; c.fillRect(0, 0, w, h);
  speck(c, w, h, 420, 300, ['rgba(120,118,130,.28)', 'rgba(80,80,95,.2)', 'rgba(255,255,255,.6)']);
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, 0, w, 4); c.fillStyle = 'rgba(90,88,100,.35)'; c.fillRect(w - 3, 0, 3, h);
}));
const fieldTex = () => TEX.get('jd|field', () => canvasTex(512, 256, (c, w, h) => {
  // 장독대 축대: 둥글둥글한 막돌을 쌓고 회반죽으로 메운 면 (한 장 1 m × .5 m)
  c.fillStyle = '#a99d8d'; c.fillRect(0, 0, w, h);
  const cols = ['#d7cdbf', '#cbbfae', '#ddd4c8', '#c2b5a3', '#d3c6b0', '#bdb0a0'];
  let k = 0;
  for (let y = -10; y < h + 20; y += 58) for (let x = -30 + (Math.round(y / 58) % 2) * 34; x < w + 40; x += 66 + hash(k) * 20) {
    k++; const rw = 30 + hash(k + 1) * 12, rh = 22 + hash(k + 2) * 7, cx = x + hash(k + 3) * 8, cy = y + 28 + hash(k + 4) * 8;
    c.fillStyle = cols[k % cols.length]; c.beginPath(); c.ellipse(cx, cy, rw, rh, (hash(k + 5) - .5) * .5, 0, PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(cx - rw * .25, cy - rh * .35, rw * .5, rh * .28, 0, 0, PI * 2); c.fill();
    c.strokeStyle = 'rgba(90,78,66,.45)'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy, rw, rh, (hash(k + 5) - .5) * .5, .2, 2.6); c.stroke();
  }
  c.fillStyle = 'rgba(112,160,80,.5)'; for (let i = 0; i < 26; i++) { c.beginPath(); c.arc(hash(i + 40) * w, hash(i + 41) * h, 3 + hash(i + 42) * 5, 0, PI * 2); c.fill(); }
}, { repeat: [1, 1] }));
const slabTex = () => TEX.get('jd|slab', () => canvasTex(512, 512, (c, w, h) => {
  // 장독대 윗면: 넓적한 판돌 여러 장, 틈에 이끼 — 한 장 1 m
  c.fillStyle = '#9b9183'; c.fillRect(0, 0, w, h);
  const P = [[0, 0, 200, 170], [200, 0, 312, 140], [0, 170, 150, 190], [150, 140, 210, 200], [360, 140, 152, 220], [0, 360, 230, 152], [230, 340, 282, 172]];
  P.forEach(([x, y, ww, hh], i) => { c.fillStyle = ['#d8cfc2', '#cfc5b6', '#e0d8cc', '#c9bead', '#d4cab9', '#ddd3c4', '#cbc0b0'][i]; roundRect(c, x + 5, y + 5, ww - 10, hh - 10, 18); c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)'; roundRect(c, x + 10, y + 9, ww - 30, 10, 5); c.fill(); });
  speck(c, w, h, 900, 500, ['rgba(110,100,88,.15)', 'rgba(255,255,255,.2)']);
  c.fillStyle = 'rgba(110,165,78,.55)'; for (let i = 0; i < 40; i++) { const p = P[i % P.length]; c.beginPath(); c.arc(p[0] + 4 + hash(i) * p[2], p[1] + 3, 3 + hash(i + 7) * 4, 0, PI * 2); c.fill(); }
}, { repeat: [1, 1] }));
const onggiTex = (base, seed) => TEX.get('jd|onggi|' + base + seed, () => canvasTex(512, 256, (c, w, h) => {
  // 옹기 유약: 진한 적갈색, 위에서 흘러내린 유약 자국, 어깨에 손가락으로 그린 초화문(물결 풀잎) 띠, 물레 자국 가로줄
  // (lathe uv: u = 둘레, v = 아래 0 → 위 1; 캔버스 위쪽이 항아리 위)
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, shade(base, .06)); g.addColorStop(.45, base); g.addColorStop(1, shade(base, -.12));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let y = 8; y < h; y += 9 + hash(y) * 5) { c.fillStyle = `rgba(${hash(y + seed) < .5 ? '255,220,190' : '40,18,10'},.07)`; c.fillRect(0, y, w, 2); }
  for (let k = 0; k < 26; k++) { const x = hash(k + seed) * w, L = 30 + hash(k + seed + 3) * 70; c.fillStyle = 'rgba(40,20,10,.22)'; roundRect(c, x, 20, 7 + hash(k) * 6, L, 4); c.fill(); }
  c.strokeStyle = 'rgba(250,222,186,.9)'; c.lineWidth = 6; c.lineCap = 'round';
  const yb = h * .3;
  for (let x = 6; x < w; x += 46) { c.beginPath(); c.moveTo(x, yb + 18); c.quadraticCurveTo(x + 10, yb - 14, x + 22, yb - 20); c.stroke(); c.beginPath(); c.moveTo(x + 6, yb + 18); c.quadraticCurveTo(x + 22, yb, x + 36, yb - 4); c.stroke(); }
  c.lineWidth = 4; c.beginPath(); for (let x = 0; x <= w; x += 8) c.lineTo(x, yb + 26 + Math.sin(x / 18) * 5); c.stroke();
  c.fillStyle = 'rgba(255,236,210,.7)'; c.fillRect(0, yb + 36, w, 4); c.fillRect(0, h * .72, w, 4);
  // 빛 받는 유약 광택: 세로 두 줄 (둘레 한쪽에만)
  for (const [x, a] of [[w * .18, .35], [w * .23, .2]]) { const gg = c.createLinearGradient(x - 12, 0, x + 12, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, `rgba(255,245,230,${a})`); gg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.fillRect(x - 12, h * .2, 24, h * .6); }
}));
const plasterTex = () => TEX.get('jd|plaster', () => canvasTex(512, 512, (c, w, h) => {
  c.fillStyle = C.plaster; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 40; k++) { const x = hash(k + 600) * w, y = hash(k + 601) * h, r = 14 + hash(k + 602) * 36; c.fillStyle = hash(k) < .5 ? 'rgba(200,180,150,.08)' : 'rgba(255,255,255,.14)'; c.beginPath(); c.ellipse(x, y, r * 1.6, r, 0, 0, PI * 2); c.fill(); }
  speck(c, w, h, 900, 650, ['rgba(150,130,100,.1)', 'rgba(255,255,255,.2)']);
}, { repeat: [1, 1] }));
const tileTex = () => TEX.get('jd|tile', () => canvasTex(512, 256, (c, w, h) => {
  // 기와 처마: 둥근 기와 골이 세로로 줄지어, 끝에 막새 — 위(용마루 쪽)가 캔버스 위
  c.fillStyle = C.tile2; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { const g = c.createLinearGradient(x, 0, x + 32, 0); g.addColorStop(0, shade(C.tile, -.12)); g.addColorStop(.45, shade(C.tile, .12)); g.addColorStop(1, shade(C.tile, -.16)); c.fillStyle = g; c.fillRect(x + 2, 0, 28, h); }
  for (let y = 40; y < h; y += 48) { c.fillStyle = 'rgba(30,30,60,.25)'; c.fillRect(0, y, w, 3); }
  speck(c, w, h, 500, 700, ['rgba(255,255,255,.12)', 'rgba(20,20,40,.12)']);
}, { repeat: [1, 1] }));
const doorTex = () => TEX.get('jd|door', () => canvasTex(256, 512, (c, w, h) => {
  // 미닫이 유리문 한 짝: 나무 문틀, 위 네 칸 간유리(꽃무늬), 아래 나무 판 — 집 안이 살짝 비침
  c.fillStyle = C.woodD; c.fillRect(0, 0, w, h);
  const gy = h * .68, mx = 18;
  c.fillStyle = '#d9ecf0'; c.fillRect(mx, mx, w - mx * 2, gy - mx - 6);
  c.fillStyle = 'rgba(255,255,255,.55)'; for (let y = mx + 6; y < gy - 10; y += 16) for (let x = mx + 6 + (y % 32 ? 0 : 8); x < w - mx - 6; x += 16) { c.beginPath(); c.arc(x, y, 3, 0, PI * 2); c.fill(); }
  c.fillStyle = 'rgba(255,190,120,.28)'; c.fillRect(mx, gy - 90, w - mx * 2, 84);
  c.fillStyle = C.woodD; c.fillRect(w / 2 - 5, mx, 10, gy - mx); for (const y of [mx + (gy - mx) / 3, mx + 2 * (gy - mx) / 3]) c.fillRect(mx, y - 5, w - mx * 2, 10);
  c.fillStyle = C.wood; c.fillRect(mx, gy + 6, w - mx * 2, h - gy - mx - 6);
  c.strokeStyle = 'rgba(120,70,30,.35)'; c.lineWidth = 2; for (let y = gy + 18; y < h - mx; y += 14) { c.beginPath(); c.moveTo(mx + 4, y); c.lineTo(w - mx - 4, y + 3); c.stroke(); }
  c.fillStyle = '#e8c070'; roundRect(c, w - mx - 14, gy - 40, 8, 40, 4); c.fill();
}));
const plankTex = () => TEX.get('jd|plank', () => canvasTex(512, 256, (c, w, h) => {
  // 마루: 결 있는 송판, 판 사이 줄 — 판이 x 방향으로 길게 (한 장 2 m × 1 m)
  c.fillStyle = C.woodL; c.fillRect(0, 0, w, h);
  for (let r = 0; r < 6; r++) { const y = r * h / 6; c.fillStyle = r % 2 ? 'rgba(160,100,50,.1)' : 'rgba(255,240,210,.12)'; c.fillRect(0, y, w, h / 6);
    c.strokeStyle = 'rgba(140,85,40,.28)'; c.lineWidth = 1.5; for (let k = 0; k < 4; k++) { c.beginPath(); const yy = y + 6 + k * 9; c.moveTo(0, yy); for (let x = 0; x <= w; x += 32) c.lineTo(x, yy + Math.sin(x / 40 + r + k) * 2); c.stroke(); }
    c.fillStyle = 'rgba(110,60,25,.45)'; c.fillRect(0, y, w, 2); if (r % 2) c.fillRect(w * (.3 + hash(r) * .4), y, 2, h / 6); }
  for (let k = 0; k < 7; k++) { c.fillStyle = 'rgba(120,70,30,.35)'; c.beginPath(); c.ellipse(hash(k + 900) * w, hash(k + 901) * h, 6, 3, 0, 0, PI * 2); c.fill(); }
}, { repeat: [1, 1] }));
const brickTex = () => TEX.get('jd|brick', () => canvasTex(512, 128, (c, w, h) => {
  c.fillStyle = '#efe1cf'; c.fillRect(0, 0, w, h);
  const cols = [C.brick, shade(C.brick, .06), shade(C.brick, -.06), C.brick2, shade(C.brick, .12)];
  for (let j = 0; j * 21 < h; j++) for (let x = -(j % 2) * 28; x < w; x += 56) { c.fillStyle = cols[Math.floor(hash(j * 31 + x) * cols.length)]; roundRect(c, x + 2, j * 21 + 2, 52, 17, 2); c.fill(); }
  speck(c, w, h, 300, 800, ['rgba(90,40,25,.18)', 'rgba(255,240,220,.2)']);
}, { repeat: [1, 1] }));
const clothTex = () => TEX.get('jd|cloth', () => canvasTex(128, 128, (c, w, h) => {
  c.fillStyle = '#f7f3ea'; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(180,160,130,.12)'; for (let k = 0; k < w; k += 4) { c.fillRect(k, 0, 1, h); c.fillRect(0, k, w, 1); }
  c.fillStyle = 'rgba(120,150,200,.35)'; c.fillRect(0, 10, w, 4); c.fillRect(0, h - 14, w, 4);
}, { repeat: [2, 2] }));
const basketTex = () => TEX.get('jd|basket', () => canvasTex(128, 128, (c, w, h) => {
  // 대나무 소쿠리 결
  c.fillStyle = '#d8b46e'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 8) for (let x = (y / 8 % 2) * 8; x < w; x += 16) { c.fillStyle = '#ecd08e'; c.fillRect(x, y + 1, 8, 6); c.fillStyle = 'rgba(120,80,30,.35)'; c.fillRect(x + 8, y, 1, 8); }
}, { repeat: [3, 2] }));
const plateTex = () => TEX.get('jd|plate', () => textTex(320, 128, (c, w, h) => {
  c.fillStyle = '#7a4a2a'; roundRect(c, 1, 1, w - 2, h - 2, 8); c.fill();
  c.fillStyle = '#f4e4c6'; roundRect(c, 5, 5, w - 10, h - 10, 6); c.fill();
  fitText(c, '삐딱이네', w / 2, h / 2 + 1, w * .8, 34, '#5a3520', { weight: '800' });
}));
const paintTex = (key, text, px = 64) => TEX.get('jd|paint|' + key, () => textTex(512, 160, (c, w, h) => {
  fitText(c, text, w / 2, h / 2 + 2, w * .92, px, 'rgba(255,255,255,.92)', { weight: '800' });
}));
const manholeTex = () => TEX.get('jd|manhole', () => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#5f5d73'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 2, 0, PI * 2); c.fill();
  c.strokeStyle = '#4b495e'; c.lineWidth = 10; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 12, 0, PI * 2); c.stroke();
  c.lineWidth = 5; for (const r of [70, 40]) { c.beginPath(); c.arc(w / 2, h / 2, r, 0, PI * 2); c.stroke(); }
  for (let k = 0; k < 12; k++) { const a = k * PI / 6; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * 40, h / 2 + Math.sin(a) * 40); c.lineTo(w / 2 + Math.cos(a) * 104, h / 2 + Math.sin(a) * 104); c.stroke(); }
}));
const decal = (w, h, t, o) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: t, ...o }), { cast: false });
const tmesh = (g, t, o = {}) => mesh(g, mat('#ffffff', { map: t, rough: .8, rim: .1, ...o }));

const B = {};

// ── 바탕: 둥근 섬 — 시멘트 마당 · 보도블록 · 화강암 연석 · 골목 차도 · 건너편 보도 · 섬 가장자리 흙과 풀 ─────────────────────
B.jd_base = f => {
  const { z0, z1, curb, curb2, ry } = ISLE, O = isleOutline();
  const near = clipZ(O, -99, curb), road = clipZ(O, curb, curb2), far = clipZ(O, curb2, 99);
  const mid = (curb + curb2) / 2;
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.8, 0, .01, -.75, .01];
  f.add(mc('base', ({ add }) => {
    // 받침: 차도 높이까지 돌 켜 · 흙 켜, 그 위 보도와 마당 판 (판 옆면 = 섬 테두리)
    add(G.ext(holed(O), .34, 0, 8), C.stone, 0, ry - .34, 0, -HP, 0, 0);
    add(G.ext(holed(isleOutline(-.06)), .32, .04, 8), C.earth, 0, ry - .7, 0, -HP, 0, 0);
    add(G.ext(holed(near), -ry + .004, 0, 8), '#e2dbd2', 0, ry, 0, -HP, 0, 0); add(G.ext(shapeOf(far), -ry + .004, 0, 8), '#e2dbd2', 0, ry, 0, -HP, 0, 0);
    // 돌 켜 줄눈과 흙 속 돌멩이 (카메라 쪽 앞·오른쪽)
    for (let x = -2.4; x <= 2.41; x += .6) add(G.pbox(.02, .28, .02), C.stone2, x, ry - .17, z1 + .006);
    for (let z = -1.6; z <= 3.3; z += .6) add(G.pbox(.02, .28, .02), C.stone2, ISLE.hx + .006, ry - .17, z);
    for (const [x, z] of [[-2.2, z1 - .03], [.4, z1 - .03], [2.0, z1 - .03], [ISLE.hx - .03, 3.0], [ISLE.hx - .03, -.4], [ISLE.hx - .03, -2.2]]) add(G.sph(.07, 8, 6), C.earth2, x, ry - .5, z, 0, 0, 0, [1.4, .8, 1]);
    // 연석 위 모서리 (보도 쪽에 둥근 턱)
    for (const [z, s] of [[curb, 1], [curb2, -1]]) { const L = halfW(z) * 2 - .1; add(G.box(L, .05, .16, .02), C.curb, 0, .012, z - s * .08); }
    // 차선: 길가 흰 줄 두 줄(점선 아님) · 가운데 짧은 점선 (좁은 골목)
    const Y = ry + .012;
    for (const z of [curb + .2, curb2 - .2]) add(G.pbox(halfW(z) * 2 - .3, .006, .06), '#ffffff', 0, Y, z);
    for (let x = -3.4; x < 3.4; x += 1.1) add(G.pbox(.55, .006, .07), '#f2c94c', x + .27, Y, mid);
    // 빗물받이 (연석 아래 차도 쪽)
    for (const [x, z] of [[-2.85, curb + .2], [2.2, curb2 - .2]]) { add(G.box(.62, .012, .24, .008), '#6c6a80', x, ry + .008, z); for (let k = 0; k < 6; k++) add(G.pbox(.035, .014, .18), '#45435a', x - .22 + k * .088, ry + .01, z); }
    // 건너편 보도: 볼라드 셋 · 낮은 화단 상자(꽃) — 카메라 쪽이라 낮은 것만
    for (const x of [-1.9, .3, 2.5]) { add(G.cyl(.06, .07, .42, 12), '#6a6480', x, .21, curb2 + .2); add(G.cyl(.065, .065, .05, 12), '#f2c94c', x, .34, curb2 + .2); add(G.sph(.065, 10, 6), '#6a6480', x, .42, curb2 + .2, 0, 0, 0, [1, .6, 1]); }
    add(G.box(1.1, .24, .34, .03), '#c7b9a6', -.8, .12, curb2 + .27); add(G.box(1.02, .03, .26, .01), '#7a5a3e', -.8, .245, curb2 + .27);
    for (let k = 0; k < 7; k++) { add(G.sph(.08, 8, 6), k % 2 ? C.grass : C.grass2, -1.25 + k * .15, .3, curb2 + .23 + (k % 2) * .06); add(G.sph(.035, 6, 5), ['#ff7aa2', '#ffd23f', '#ffffff'][k % 3], -1.22 + k * .15, .37, curb2 + .29); }
    // 섬 가장자리: 집 뒤 · 왼쪽 · 오른쪽 담 밖 흙 띠에 풀 한 줌씩 (모서리에만 — 한적하게)
    for (const [x, z, s] of [[-3.25, -2.6, 1], [-2.0, -2.72, .8], [3.15, -2.35, 1.1], [3.3, -.6, .8], [3.28, .95, .9], [-3.38, .9, .8], [2.95, 4.5, .7], [-2.95, 4.52, .75]]) {
      add(G.sph(.2 * s, 10, 8), C.grass, x, .08 * s, z, 0, 0, 0, [1.3, .8, 1.1]);
      add(G.sph(.15 * s, 10, 8), C.grass2, x + .16 * s, .07 * s, z + .1, 0, 0, 0, [1.2, .8, 1]);
    }
    // 마당 배수구(쇠살) · 마당에서 대문까지 디딤돌
    add(G.box(.5, .014, .16, .006), '#8a8698', -.4, .016, 1.05); for (let k = 0; k < 6; k++) add(G.pbox(.03, .016, .12), '#5e5a70', -.6 + k * .08, .018, 1.05);
    for (const [x, z, s, a] of [[1.2, .95, 1, .1], [1.05, .3, .9, -.2], [1.25, -.35, 1, .3], [1.1, -.95, .85, 0]]) add(G.cyl(.24 * s, .26 * s, .05, 16), '#cfc6b8', x, .026, z, 0, a, 0, [1.25, 1, .9]);
  }));
  // 겉면: 마당 시멘트 · 보도블록 · 아스팔트 · 연석 옆면 · 담 밖 흙 · 맨홀 · 노면 글자
  const cm = mat('#ffffff', { map: cementTex(), rough: .85, rim: .08 }), pm = mat('#ffffff', { map: paverTex(), rough: .75, rim: .1 });
  const soil = mat('#b8a07e', { rough: .95, rim: .05 });
  { const o = mesh(new THREE.ShapeGeometry(holed(rect(-3, -2.5, WALL.ex0 + .2, WALL.z1))), cm, { cast: false }); o.rotation.x = -HP; o.position.y = .011; o.receiveShadow = true; f.add(o); }
  f.add(flat(clipZ(near, WALL.z1, curb), pm, .012));
  f.add(flat(far, pm, .013));
  // (방 밖 흙: 집 뒤 · 왼쪽 담 밖 · 오른쪽 담 밖)
  f.add(flat(clipZ(near, -99, -2.5), soil, .01));
  f.add(flat(clipX(clipZ(near, -2.5, WALL.z1), -99, -3), soil, .01));
  f.add(flat(clipX(clipZ(near, -2.5, WALL.z1), WALL.ex0 + .2, 99), soil, .01));
  f.add(flat(road, mat('#ffffff', { map: roadTex(), rough: .85, rim: .08 }), ry + .006));
  const ct = curbTex(), cmat = mat('#ffffff', { map: ct, rough: .7, rim: .1 });
  for (const [z, s] of [[curb, 1], [curb2, -1]]) { const a = -halfW(z), b = halfW(z);
    for (let x = a; x < b - .02; x += .8) { const L = Math.min(.8, b - x) - .015; const fm = mesh(new THREE.PlaneGeometry(L, -ry + .03), cmat, { cast: false }); put(fm, x + L / 2, ry / 2 + .015, z + s * .002, 0, s > 0 ? 0 : PI, 0); f.add(fm); } }
  { const m = mesh(new THREE.CircleGeometry(.32, 28), mat('#ffffff', { map: manholeTex(), rough: .6 }), { cast: false }); put(m, 1.75, ry + .014, mid + .2, -HP, 0, 0); f.add(m); }
  f.add(put(decal(1.3, .4, paintTex('slow', '천천히', 70), { opacity: .97 }), -.15, ry + .014, mid + .42, -HP, 0, 0));
  f.group.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  f.spot('behind', null, -2.85, ry + .02, curb + .4, { maxH: .2, label: '빗물받이 옆', scale: .8 });
  f.spot('behind', null, -.25, .27, curb2 + .27, { maxH: .22, label: '꽃 상자 사이', scale: .75 });
};

// ── 집 앞면: 벽돌 다세대 1층(방범창 창 둘 · 꽃 상자 · 가스관 · 계량기)과 반지하 — 땅에 걸친 반지하 창, 반지하 현관으로 내려가는
// 계단 우물(시멘트 벽 · 계단 다섯 · 미끄럼 막이 · 초록 난간 · 바닥 매트 · 우산 · 작은 등). 1층 벽은 방의 N벽처럼 카메라가 뒤로
// 돌면 무릎 높이로 접힌다(계단 우물과 반지하 문은 그대로). 계단 우물 자리는 방 바닥을 뚫음(layout cut i 4~5, j 0).
export const WELL = { x0: 1.05, x1: 2.75, z0: -2.3, z1: -1.5, y: -.78 };
const HOUSE = { x0: 0, x1: 2.8, z0: -2.5, z1: -2.3, H: 2.6 };
const brickWall = (L, H) => { const t = brickTex().clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(L / 1.9, H / .45); return mat('#ffffff', { map: t, rough: .85, rim: .08 }); };
B.jd_house = f => {
  const { x0, x1, z0, z1, H } = HOUSE, W = x1 - x0, cx = (x0 + x1) / 2, { x0: wx0, x1: wx1, z1: wz1, y: wy } = WELL;
  // (접히는 1층 벽: 땅 위 전부)
  const face = grp(); f.add(face); (f.live || (f.live = [])).push(face);
  face.add(put(mesh(new THREE.BoxGeometry(W, H, z1 - z0), brickWall(W, H)), cx, H / 2, (z0 + z1) / 2));
  face.add(mc('face', ({ add }) => {
    // 반지하 창 위 시멘트 띠 · 1층 바닥 선 · 옥상 난간 갓돌 · 모서리 · 빗물 홈통
    add(G.box(W + .02, .1, .05, .01), '#d8d0c3', cx, .5, z1 + .02);
    add(G.box(W + .06, .12, .3, .02), '#e2dbd0', cx, H - .02, (z0 + z1) / 2 + .03);
    add(G.cyl(.035, .035, H - .1, 10), '#c9cfd8', x0 + .1, (H - .1) / 2, z1 + .06); add(G.box(.12, .06, .1, .02), '#c9cfd8', x0 + .1, .05, z1 + .09);
    // 1층 창 둘: 흰 새시 · 하늘 유리 · 흰 방범창 살 · 창 밑 꽃 상자
    for (const wx of [.52, 2.05]) {
      add(G.box(.86, .78, .06, .012), '#f4f1ea', wx, 1.42, z1 + .02); add(G.pbox(.76, .68, .02), C.glass, wx, 1.42, z1 + .05); add(G.pbox(.02, .68, .03), '#f4f1ea', wx, 1.42, z1 + .06);
      for (let k = 0; k < 7; k++) add(G.cyl(.012, .012, .8, 6), C.white, wx - .36 + k * .12, 1.42, z1 + .13);
      for (const y of [1.03, 1.81]) add(G.box(.9, .03, .12, .01), C.white, wx, y, z1 + .1);
      add(G.box(.8, .13, .2, .03), '#c96f45', wx, .96, z1 + .12);
      for (let k = 0; k < 8; k++) { add(G.sph(.06, 8, 6), k % 2 ? C.grass : C.grass2, wx - .33 + k * .095, 1.06, z1 + .12 + (k % 2) * .04); add(G.sph(.03, 6, 5), k % 3 ? '#ff6f91' : '#ffffff', wx - .31 + k * .095, 1.12, z1 + .16); }
    }
    // 반지하 창 (땅에 반쯤 묻힌 낮은 창): 회색 새시 · 간유리 · 방범창 · 앞 시멘트 턱
    add(G.box(.8, .4, .06, .012), '#c9cfd8', .52, .22, z1 + .02); add(G.pbox(.7, .3, .02), '#cfdde6', .52, .22, z1 + .05);
    for (let k = 0; k < 6; k++) add(G.cyl(.011, .011, .38, 6), C.white, .22 + k * .12, .22, z1 + .11);
    add(G.box(.84, .03, .1, .01), C.white, .52, .42, z1 + .09);
    // 노란 가스관 · 계량기 · 전기 계량함 · 주소 판
    add(G.cyl(.022, .022, W - .2, 8), '#f2c94c', cx, 2.18, z1 + .07, 0, 0, HP); add(G.cyl(.022, .022, .5, 8), '#f2c94c', 1.2, 1.93, z1 + .07);
    add(G.box(.2, .16, .1, .02), '#e9e2d4', 1.2, 1.62, z1 + .07); add(G.cyl(.04, .04, .02, 12), '#ffffff', 1.2, 1.63, z1 + .125, HP, 0, 0);
    add(G.box(.3, .12, .02, .01), '#3a5fa8', 1.2, 2.4, z1 + .02);
  }));
  // 계단 우물 (안 접힘): 뒤 벽(1층 벽 아래 이어짐) · 반지하 문 · 등 · 시멘트 옆벽 · 바닥 · 계단 · 갓돌 · 난간
  f.add(put(mesh(new THREE.BoxGeometry(wx1 - wx0 + .1, -wy, z1 - z0), brickWall(wx1 - wx0, -wy)), (wx0 + wx1) / 2, wy / 2, (z0 + z1) / 2));
  const dx0 = 2.12, dx1 = 2.66;
  f.add(mc('well', ({ add }) => {
    const ww = wx1 - wx0, wd = wz1 - z1, t = .06, wc = '#cfc8bc';
    add(G.box(ww, .04, wd, .01), '#b9b2a6', (wx0 + wx1) / 2, wy - .02, (z1 + wz1) / 2);
    add(G.pbox(ww, -wy, t), wc, (wx0 + wx1) / 2, wy / 2, wz1 - t / 2); add(G.pbox(t, -wy, wd), wc, wx1 - t / 2, wy / 2, (z1 + wz1) / 2);
    // 계단 다섯 (왼쪽 땅에서 오른쪽 아래로): 시멘트 디딤 · 앞 모서리 미끄럼 막이
    const n = 4, sw = .21, rise = -wy / (n + 1);
    for (let k = 0; k < n; k++) { const top = -rise * (k + 1), x = wx0 + sw * k + sw / 2;
      add(G.box(sw + .01, top - wy, wd - t, .012), '#d9d2c6', x, (top + wy) / 2, (z1 + wz1 - t) / 2);
      add(G.pbox(.03, .012, wd - t - .06), '#5e5a70', x + sw / 2 - .03, top + .006, (z1 + wz1 - t) / 2); }
    // 갓돌 (땅 높이, 우물 둘레 앞과 오른쪽)
    add(G.box(ww + .12, .05, .12, .015), '#e2dbd0', (wx0 + wx1) / 2 + .06, .025, wz1 + .03); add(G.box(.12, .05, wd, .015), '#e2dbd0', wx1 - .01, .025, (z1 + wz1) / 2);
    // 난간: 앞 갓돌 위와 오른쪽 (왼쪽 계단 입구는 엶) · 계단 입구 기둥
    const RH = .9;
    add(G.cyl(.022, .022, ww, 8), C.green, (wx0 + wx1) / 2, RH, wz1 + .03, 0, 0, HP); add(G.cyl(.022, .022, wd, 8), C.green, wx1 - .01, RH, (z1 + wz1) / 2, HP, 0, 0);
    add(G.cyl(.014, .014, ww, 6), C.green, (wx0 + wx1) / 2, .45, wz1 + .03, 0, 0, HP);
    for (let x = wx0 + .02; x <= wx1 + .04; x += .17) add(G.cyl(.012, .012, RH - .05, 6), C.greenD, x, (RH + .05) / 2, wz1 + .03);
    for (let z = z1 + .1; z < wz1; z += .17) add(G.cyl(.012, .012, RH - .05, 6), C.greenD, wx1 - .01, (RH + .05) / 2, z);
    add(G.cyl(.03, .03, RH + .05, 10), C.greenD, wx0 + .02, (RH + .05) / 2, wz1 + .03); add(G.sph(.04, 10, 8), C.greenD, wx0 + .02, RH + .07, wz1 + .03);
    // 반지하 문: 짙은 초록 철문 · 문틀 · 손잡이 · 'B01' 판 · 등
    add(G.box(dx1 - dx0 + .1, 1.6, .05, .012), '#e2dbd0', (dx0 + dx1) / 2, wy + .8, z1 + .02);
    add(G.box(dx1 - dx0, 1.52, .05, .012), '#2f7d5c', (dx0 + dx1) / 2, wy + .77, z1 + .04);
    add(G.box(dx1 - dx0 - .1, .5, .02, .01), shade('#2f7d5c', .08), (dx0 + dx1) / 2, wy + 1.1, z1 + .07); add(G.box(dx1 - dx0 - .1, .5, .02, .01), shade('#2f7d5c', .08), (dx0 + dx1) / 2, wy + .45, z1 + .07);
    add(G.cyl(.022, .022, .05, 10), '#e8c070', dx0 + .08, wy + .78, z1 + .09, HP, 0, 0); add(G.box(.06, .1, .03, .01), '#c9cfd8', dx0 + .08, wy + .86, z1 + .07);
    add(G.box(.14, .08, .015, .006), '#3a5fa8', (dx0 + dx1) / 2, wy + 1.42, z1 + .07);
    add(G.box(.12, .08, .1, .03), '#f4f1ea', 1.8, wy + 1.3, z1 + .06); add(G.sph(.05, 10, 8), '#fff2b8', 1.8, wy + 1.24, z1 + .1);
    // 계단참: 신발 한 켤레 · 기대 둔 노란 우산 · 화분 하나
    for (const [x, a] of [[2.3, .1], [2.42, -.08]]) { add(G.box(.1, .045, .22, .04), '#ff8f6b', x, wy + .025, -1.72, 0, a, 0); add(G.box(.08, .03, .07, .02), '#ffffff', x, wy + .05, -1.66, 0, a, 0); }
    add(G.cone(.09, .62, 8), '#ffd23f', 1.98, wy + .33, -2.18, .25, 0, 0); add(G.cyl(.01, .01, .14, 6), '#6a4a2a', 1.98, wy + .66, -2.25, .25, 0, 0);
    add(G.cyl(.09, .07, .16, 12), '#c96f45', 2.6, wy + .08, -1.68); for (let k = 0; k < 5; k++) add(G.sph(.06, 8, 6), k % 2 ? C.grass : C.grass2, 2.6 + Math.cos(k * 1.3) * .05, wy + .22 + (k % 2) * .03, -1.68 + Math.sin(k * 1.3) * .05);
  }));
  // 바닥 매트 (들림)
  const mt = grp(put(mesh(G.box(.44, .02, .3, .008), mat('#8a6a4c')), 0, 0, 0), put(mesh(G.box(.36, .006, .22, .004), mat('#c9a26a')), 0, .012, 0));
  put(mt, (dx0 + dx1) / 2, wy + .012, -1.98); f.add(mt);
  const mp = f.part('lift', mt, (t, b) => { mt.position.y = b.p.y + .2 * t; mt.position.z = b.p.z + .1 * t; mt.rotation.x = -.7 * t; }, { label: '현관 매트', sfx: 'lift' });
  f.spot('inside', null, (dx0 + dx1) / 2, wy + .005, -1.98, { part: mp, maxH: .22, label: '현관 매트 밑', scale: .75 });
  f.spot('on', null, 2.04, wy + .01, -1.64, { maxH: .4, label: '반지하 계단 아래', scale: .85 });
  f.spot('behind', null, .85, .02, z1 + .2, { maxH: .3, label: '반지하 창 앞', scale: .8 });
  f.walkBoxes = [[x0, 0, z0, x1, H, z1 + .15], [wx0, 0, z1, wx1 + .1, 1, wz1 + .1]];
  f.collideBox = [x0, 0, z0, x1, H, wz1 + .1];
  // 접기: 방 N벽과 같은 규칙 (안쪽 법선 · 카메라 방향 < -.18이면 무릎 높이 .8 — 반지하 문 위까지)
  const camDir = new THREE.Vector3(), nrm = new THREE.Vector3(), stub = .8 / H; let k = 1;
  f.updateView = (Wd, dt = 1 / 60) => {
    if (!Wd || !Number.isFinite(Wd.yaw)) return;
    f.group.updateWorldMatrix(true, false);
    camDir.set(Math.sin(Wd.yaw), 0, Math.cos(Wd.yaw)); nrm.set(0, 0, 1).transformDirection(f.group.matrixWorld);
    const want = nrm.dot(camDir) < -.18 ? 0 : 1, prev = k;
    k += (want - k) * (1 - Math.exp(-Math.max(0, dt) * 12)); if (Math.abs(k - want) < .002) k = want;
    if (k !== prev) { face.scale.y = stub + (1 - stub) * k; Wd.shadowDirty = true; }
  };
};

// ── 앞 담과 오른쪽 담: 벽돌 허리 담 + 갓돌 + 초록 철 난간, 열린 초록 대문(벽돌 기둥 · 문패 · 초인종 · 우유 주머니) ─────────────
B.jd_wall = (f, T) => {
  const { z0, z1, gate: [g0, g1], ex0 } = WALL, zc = (z0 + z1) / 2, BH = .5, RH = 1.04, ex1 = ex0 + .2, exc = ex0 + .1;
  f.noOccupied = true;
  const segs = [[-3, g0 - .13, 'x', 1], [g1 + .13, ex1, 'x', 1], [-2.5, z0, 'z', 0]];
  const bm = mat('#ffffff', { map: brickTex(), rough: .85, rim: .08 });
  for (const [a, b, d] of segs) {
    const L = b - a, m = mesh(d === 'x' ? new THREE.BoxGeometry(L, BH, z1 - z0) : new THREE.BoxGeometry(ex1 - ex0, BH, L), bm);
    const t = bm.map.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(L / 1.9, BH / .45); m.material = mat('#ffffff', { map: t, rough: .85, rim: .08 });
    put(m, d === 'x' ? (a + b) / 2 : exc, BH / 2, d === 'x' ? zc : (a + b) / 2); f.add(m);
  }
  f.add(mc('rail', ({ add }) => {
    for (const [a, b, d, rail] of segs) {
      const L = b - a, c = (a + b) / 2;
      const at = (u, y, w, h, dd, col) => d === 'x' ? add(G.box(w, h, dd, .015), col, u, y, zc) : add(G.box(dd, h, w, .015), col, exc, y, u);
      at(c, BH + .03, L + .04, .06, .28, C.cap);
      if (!rail) continue;
      // 난간 (앞 담만 — 오른쪽 담은 갓돌까지, 반지하 계단이 보이게): 위·가운데 가로대, 살 12 cm, 살 사이 동그라미 장식
      at(c, RH, L, .04, .04, C.green); at(c, BH + .2, L, .03, .03, C.green);
      for (let u = a + .08; u < b - .04; u += .12) at(u, (BH + .06 + RH) / 2, .022, RH - BH - .06, .022, C.greenD);
      for (let u = a + .14; u < b - .1; u += .24) d === 'x' ? add(G.tor(.045, .01, PI * 2, 5, 14), C.green, u, BH + .2 + .12, zc) : add(G.tor(.045, .01, PI * 2, 5, 14), C.green, exc, BH + .2 + .12, u, 0, HP, 0);
    }
    for (const x of [-2.9, exc]) add(G.box(.32, .06, .32, .02), C.cap, x, RH + .1, zc);
    // 대문 기둥 둘 (높게) · 갓돌 · 문지방
    for (const x of [g0 - .07, g1 + .07]) { add(G.box(.34, .08, .38, .02), C.cap, x, 1.66, zc); add(G.box(.2, .1, .2, .03), C.cap, x, 1.75, zc); }
    add(G.box(g1 - g0, .04, z1 - z0 + .06, .01), '#c9c0b2', (g0 + g1) / 2, .02, zc);
    // 초인종 (오른 기둥 바깥) · 우편 투입구
    add(G.box(.12, .18, .04, .02), '#f4f1ea', g1 + .07, 1.12, z1 + .02); add(G.cyl(.025, .025, .02, 10), '#e8473d', g1 + .07, 1.08, z1 + .045, HP, 0, 0); add(G.pbox(.08, .04, .01), '#3a3550', g1 + .07, 1.16, z1 + .042);
    add(G.box(.18, .05, .03, .01), '#8a8698', g1 + .07, .86, z1 + .015);
  }));
  // 대문 기둥 둘 (벽돌 결)
  for (const x of [g0 - .07, g1 + .07]) f.add(put(mesh(new THREE.BoxGeometry(.26, 1.62, .3), brickWall(.26, 1.62)), x, .81, zc));
  // 난간 끝 기둥 (벽돌 결): 왼쪽 끝 · 오른쪽 모서리
  for (const x of [-2.9, exc]) f.add(put(mesh(new THREE.BoxGeometry(.24, RH + .08, .26), brickWall(.24, RH + .08)), x, (RH + .08) / 2, zc));
  // 문패
  f.add(put(decal(.22, .09, plateTex()), g0 - .07, 1.3, z1 + .004));
  f.add(put(mesh(G.box(.24, .11, .02, .01), mat('#7a4a2a')), g0 - .07, 1.3, z1 - .008));
  // 열린 대문 두 짝: 초록 철판, 위 창살, 손잡이 — 마당 쪽으로 활짝 (경첩은 기둥 안쪽)
  const leaf = (hx, ang) => {
    const pv = grp(); put(pv, hx, 0, zc - .04, 0, ang, 0);
    pv.add(mc('leaf', ({ add }) => {
      const w = (g1 - g0) / 2 - .02, H = 1.38;
      add(G.box(w, .9, .035, .012), C.green, w / 2, .5, 0);
      add(G.box(w - .1, .7, .04, .01), shade(C.green, .08), w / 2, .5, 0);
      add(G.box(w, .04, .04, .01), C.greenD, w / 2, H, 0); add(G.box(w, .04, .04, .01), C.greenD, w / 2, .96, 0);
      for (let x = .06; x < w - .02; x += .1) add(G.cyl(.012, .012, H - .96, 6), C.greenD, x, (H + .96) / 2, 0);
      for (const x of [.02, w - .02]) add(G.box(.04, H - .05, .045, .01), C.greenD, x, (H + .05) / 2, 0);
      add(G.tor(.04, .01, PI * 2, 5, 12), '#ffd23f', w - .1, .78, .03);
    }));
    f.add(pv); return pv;
  };
  // (10/30 사용자 "대문 대야 안뚫게 여는 한계 각도 조절": 100° → 75°, the right leaf ran through the red tub)
  leaf(g0, 1.3); leaf(g1, PI - 1.3);
  // 우유 주머니 (왼 기둥 바깥, 천 주머니 — 안에 숨는 곳)
  const bag = grp(put(mesh(G.box(.2, .22, .08, .03), mat('#ffffff', { map: clothTex() })), 0, -.11, 0), put(mesh(G.box(.22, .03, .1, .01), mat('#8fb6e0')), 0, 0, 0));
  put(bag, g0 - .07, 1.04, z1 + .06); f.add(bag);
  const bp = f.part('lift', bag, (t, b) => { bag.position.z = b.p.z + .1 * t; bag.rotation.x = -.5 * t; }, { label: '우유 주머니', sfx: 'lift' });
  f.spot('inside', null, g0 - .07, .95, z1 + .07, { part: bp, maxH: .16, label: '우유 주머니 안', scale: .55 });
  // 왼쪽 담 (마당 옆 이웃집과의 골목 담): 방의 W벽 대신 마당 길이만큼만 — 보도는 막지 않고 섬 끝까지 흐른다. 방 벽처럼 카메라가
  // 이쪽으로 돌면 무릎 높이로 접힌다 (WALLS.W와 같은 틀: 안쪽 면 x -3, 안쪽 법선 +x)
  const wl = z0 + 2.5, wg = boundary('alleywall', wl, T, { capL: false, capR: true });
  const ww = grp(); ww.add(wg); put(ww, -3, 0, (z0 - 2.5) / 2, 0, HP, 0); f.add(ww); (f.live || (f.live = [])).push(ww);
  f.walkBoxes = [[-3, 0, z0, g0, 1.2, z1], [g1, 0, z0, ex1, 1.2, z1], [ex0, 0, -2.5, ex1, 1.2, z1], [-3.2, 0, -2.5, -3, 1.6, z1]];
  f.collideBox = [g0 - .2, 0, z0, g1 + .2, 1.7, z1];
  const camDir = new THREE.Vector3(), nrm = new THREE.Vector3(), stub = .42 / 1.6; let k = 1;
  f.updateView = (Wd, dt = 1 / 60) => {
    if (!Wd || !Number.isFinite(Wd.yaw)) return;
    f.group.updateWorldMatrix(true, false);
    camDir.set(Math.sin(Wd.yaw), 0, Math.cos(Wd.yaw)); nrm.set(1, 0, 0).transformDirection(f.group.matrixWorld);
    const want = nrm.dot(camDir) < -.18 ? 0 : 1, prev = k;
    k += (want - k) * (1 - Math.exp(-Math.max(0, dt) * 12)); if (Math.abs(k - want) < .002) k = want;
    if (k !== prev) { ww.scale.y = stub + (1 - stub) * k; Wd.shadowDirty = true; }
  };
};

// ── 장독대: 막돌 축대 위 판돌, 크기 다른 옹기 여섯 — 금줄 두른 큰 독 · 소쿠리 덮은 독 · 면보 묶은 독 · 뚜껑은 다 들린다 ─────
// 바닥 2.0 × 1.3 (x ±1.0, z ±.65), 높이 .32; 뒤·왼쪽은 담에 붙음
const PH = .32;
// (10/30 사용자 "항아리도 안에 움푹 들어가게": the mouth goes down into a hollow to H .66 — it was capped just under the rim, and what was
// hidden in it sat under that cap, unseen)
const jarPts = (R, H) => [[0, 0], [R * .56, 0], [R * .78, H * .08], [R * .95, H * .3], [R, H * .48], [R * .94, H * .68], [R * .78, H * .83], [R * .66, H * .9], [R * .64, H * .94], [R * .7, H * .96], [R * .7, H], [R * .6, H], [R * .58, H * .97], [R * .56, H * .8], [R * .5, H * .66], [0, H * .66]];
function jar(f, { x, z, R, H, name, dir, seed, lid = 'lid' }) {
  const y0 = PH, base = seed % 2 ? C.onggi : C.onggiL;
  const g = new THREE.LatheGeometry(jarPts(R, H).map(([r, y]) => new THREE.Vector2(r, y)), 30);
  f.add(put(mesh(g, mat('#ffffff', { map: onggiTex(base, seed), rough: .38, rim: .22, side: THREE.DoubleSide })), x, y0, z, 0, seed, 0));
  f.add(put(mesh(new THREE.CircleGeometry(R * .5, 22), mat('#3d2016')), x, y0 + H * .665, z, -HP, 0, 0));
  let pv;
  if (lid === 'basket') {
    // 대나무 소쿠리를 엎어 덮음
    pv = grp(put(mesh(new THREE.SphereGeometry(R * .86, 20, 8, 0, PI * 2, 0, HP * .75), mat('#ffffff', { map: basketTex(), rough: .9 })), 0, -R * .2, 0),
      put(mesh(G.tor(R * .66, .016, PI * 2, 6, 24), mat('#b98a45')), 0, -R * .2 + R * .86 * Math.cos(HP * .75), 0, HP, 0, 0));
  } else if (lid === 'cloth') {
    // 흰 면보를 씌우고 끈으로 묶음 (가장자리가 늘어짐)
    pv = grp(put(mesh(new THREE.SphereGeometry(R * .74, 20, 8, 0, PI * 2, 0, HP * .55), mat('#ffffff', { map: clothTex(), rough: .9 })), 0, -R * .06, 0, 0, 0, 0, [1, .55, 1]));
    pv.add(put(mesh(new THREE.CylinderGeometry(R * .74, R * .82, .1, 20, 1, true), mat('#ffffff', { map: clothTex(), side: THREE.DoubleSide, rough: .9 })), 0, -.05, 0));
    pv.add(put(mesh(G.tor(R * .715, .012, PI * 2, 6, 24), mat('#c94a3a')), 0, -.035, 0, HP, 0, 0));
    pv.add(put(mesh(G.sph(.025, 8, 6), mat('#c94a3a')), R * .7, -.04, R * .1));
  } else {
    // 옹기 뚜껑: 얕은 엎은 사발 + 꼭지
    const lc = shade(base, -.04);
    pv = grp(put(mesh(new THREE.SphereGeometry(R * .76, 22, 8, 0, PI * 2, 0, HP * .62), mat('#ffffff', { map: onggiTex(lc, seed + 5), rough: .38, rim: .22 })), 0, -R * .2, 0, 0, 0, 0, [1, .82, 1]),
      put(mesh(G.cyl(R * .73, R * .73, .025, 22), mat(shade(lc, -.1))), 0, .01, 0),
      put(mesh(G.cyl(R * .15, R * .19, .05, 14), mat(shade(lc, -.08))), 0, R * .5, 0));
  }
  put(pv, x, y0 + H, z); f.add(pv);
  const p = f.part('lift', pv, (t, b) => { pv.position.y = b.p.y + .26 * t; pv.position.x = b.p.x + dir * .16 * t; pv.rotation.z = -dir * .55 * t; }, { label: name + (lid === 'lid' ? ' 뚜껑' : ''), sfx: 'lift' });
  f.spot('inside', null, x, y0 + H * .67, z, { part: p, maxH: Math.min(.4, H * .55), label: name + ' 안', scale: R < .2 ? .6 : R < .25 ? .72 : .82 });
  return pv;
}
B.jd_jangdok = f => {
  const sm = mat('#ffffff', { map: fieldTex(), rough: .9, rim: .08 });
  // 축대: 앞·오른쪽 면은 막돌 텍스처, 위는 판돌 (상자 하나에 면마다 재질)
  const tt = slabTex().clone(); tt.needsUpdate = true; tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(2.0, 1.3);
  const top = mat('#ffffff', { map: tt, rough: .85, rim: .08 });
  const fx = fieldTex().clone(); fx.needsUpdate = true; fx.wrapS = fx.wrapT = THREE.RepeatWrapping; fx.repeat.set(2.0, .64);
  const fz = fieldTex().clone(); fz.needsUpdate = true; fz.wrapS = fz.wrapT = THREE.RepeatWrapping; fz.repeat.set(1.3, .64);
  const sideX = mat('#ffffff', { map: fx, rough: .9, rim: .08 }), sideZ = mat('#ffffff', { map: fz, rough: .9, rim: .08 });
  f.add(put(mesh(new THREE.BoxGeometry(2.0, PH, 1.3), [sideZ, sideZ, top, sm, sideX, sideX]), 0, PH / 2, 0));
  f.add(mc('jd-rim', ({ add }) => {
    // 판돌 가장자리 턱 · 앞 오른쪽 디딤돌 · 이끼 · 축대 발치 작은 돌
    add(G.box(2.04, .05, .12, .02), '#d2c8b9', 0, PH + .01, .62); add(G.box(.12, .05, 1.34, .02), '#d2c8b9', .97, PH + .01, 0);
    add(G.box(.42, .15, .3, .05), '#cbc2b4', .72, .075, .82); add(G.box(.4, .02, .28, .02), '#d8cfc2', .72, .155, .82);
    for (const [x, z, s] of [[-.9, .7, 1], [-.3, .72, .7], [.35, .71, .8], [.94, .3, .7], [.94, -.35, .9]]) add(G.sph(.06 * s, 8, 6), '#7fb35a', x, PH - .02, z, 0, 0, 0, [1.4, .5, 1]);
    for (const [x, z, s] of [[-.6, .74, 1], [.05, .76, .7], [1.06, .1, .8]]) add(G.sph(.08 * s, 8, 6), '#b8ad9c', x, .04, z, 0, 0, 0, [1.3, .7, 1]);
  }));
  // 옹기 여섯 (뒤 줄 큰 것, 앞 줄 작은 것)
  const J1 = jar(f, { x: -.6, z: -.22, R: .3, H: .78, name: '큰 항아리', dir: -1, seed: 1 });
  jar(f, { x: .05, z: -.27, R: .27, H: .7, name: '항아리', dir: 1, seed: 2 });
  jar(f, { x: .6, z: -.2, R: .22, H: .52, name: '소쿠리 덮은 항아리', dir: 1, seed: 3, lid: 'basket' });
  jar(f, { x: -.46, z: .33, R: .2, H: .46, name: '면보 덮은 항아리', dir: -1, seed: 4, lid: 'cloth' });
  jar(f, { x: .12, z: .32, R: .15, H: .34, name: '작은 항아리', dir: 1, seed: 5 });
  jar(f, { x: .6, z: .36, R: .12, H: .28, name: '꿀단지', dir: 1, seed: 6 });
  // 큰 독 뚜껑 위 엎어 둔 바가지
  J1.add(put(mesh(new THREE.SphereGeometry(.12, 16, 8, 0, PI * 2, 0, HP), mat('#e8c27a')), .02, .13, .02, 0, 0, 0, [1, .6, 1]));
  J1.add(put(mesh(G.cap(.022, .1, 2, 6), mat('#c99a52')), .15, .14, .02, 0, 0, HP - .3));
  // 두 번째 독 목에 두른 금줄: 새끼줄 고리 + 매단 빨간 고추·숯·한지
  f.add(mc('geumjul', ({ add }) => {
    const x = .05, z = -.27, y = PH + .7 * .82, r = .27 * .82;
    for (let k = 0; k < 28; k++) { const a = k / 28 * PI * 2; add(G.sph(.022, 6, 5), k % 2 ? C.straw : shade(C.straw, -.1), x + Math.cos(a) * r, y + Math.sin(a * 3) * .006, z + Math.sin(a) * r, 0, a, 0, [1.5, .8, 1]); }
    for (const [a, c, kind] of [[.5, C.red, 'p'], [1.0, '#2a2526', 'c'], [1.5, C.red, 'p'], [2.0, '#ffffff', 'h'], [2.5, C.red, 'p'], [-.2, '#2a2526', 'c']]) {
      const px = x + Math.cos(a) * (r + .015), pz = z + Math.sin(a) * (r + .015);
      if (kind === 'p') { add(G.cap(.018, .06, 2, 6), c, px, y - .06, pz, 0, 0, .15); add(G.cyl(.006, .006, .03, 5), '#3f8a3a', px, y - .015, pz); }
      else if (kind === 'c') add(G.box(.05, .045, .035, .012), c, px, y - .045, pz);
      else add(G.pbox(.05, .07, .004), c, px, y - .05, pz, 0, -a + HP, 0);
    }
  }));
  // 축대 앞 봉숭아 화분 둘
  f.add(mc('pots', ({ add }) => {
    for (const [x, z, s] of [[-.6, .86, 1], [.25, .84, .85]]) {
      add(G.cyl(.12 * s, .09 * s, .18 * s, 14), '#c96f45', x, .09 * s, z); add(G.cyl(.125 * s, .125 * s, .03, 14), '#b85f3a', x, .18 * s, z);
      for (let k = 0; k < 6; k++) { const a = k * 1.05; add(G.sph(.06 * s, 8, 6), k % 2 ? C.grass : C.grass2, x + Math.cos(a) * .06 * s, .26 * s + (k % 3) * .03, z + Math.sin(a) * .05 * s, 0, 0, 0, [1.2, .8, 1]); add(G.sph(.028 * s, 6, 5), k % 2 ? '#ff5f8f' : '#ff8fb0', x + Math.cos(a + .5) * .08 * s, .32 * s + (k % 2) * .03, z + Math.sin(a + .5) * .07 * s); }
    }
  }));
  f.spot('behind', null, -.28, PH, -.52, { maxH: .4, label: '항아리 사이', scale: .8 });
  f.spot('on', null, .84, PH + .02, .48, { maxH: .4, label: '장독대 위', scale: .8 });
  f.spot('behind', null, -.25, 0, .86, { maxH: .3, label: '화분 사이', scale: .75 });
};

// ── 화분 줄: 대문 밖 담 아래 보도에 내놓은 살림 화분 — 페인트 통 대파 · 토분 제라늄 · 검은 고무 대야 국화
// (길이 1.3 m, 앞이 +z — 등은 담 바깥 면에 붙음)
B.jd_pots = f => {
  f.add(mc('potrow', ({ add }) => {
    const leafy = (x, y, z, n, s, c1 = C.grass, c2 = C.grass2) => { for (let k = 0; k < n; k++) { const a = k * 2.4; add(G.sph(.07 * s, 8, 6), k % 2 ? c1 : c2, x + Math.cos(a) * .07 * s, y + (k % 3) * .03 * s, z + Math.sin(a) * .06 * s, 0, 0, 0, [1.2, .8, 1]); } };
    const flowers = (x, y, z, n, s, cols) => { for (let k = 0; k < n; k++) { const a = k * 2.1 + .4; add(G.sph(.032 * s, 6, 5), cols[k % cols.length], x + Math.cos(a) * .08 * s, y + .04 * s + (k % 2) * .03 * s, z + Math.sin(a) * .07 * s); } };
    // 흰 페인트 통에 심은 대파 (손잡이 · 파란 상표)
    add(G.cyl(.15, .14, .3, 16), '#f4f1ea', -.48, .15, 0); add(G.pbox(.2, .11, .005), '#3a7bd5', -.48, .17, .148); add(G.tor(.15, .008, PI, 5, 12), '#a8afbd', -.48, .3, 0, 0, .4, 0);
    add(G.cyl(.135, .135, .02, 16), '#7a5a3e', -.48, .29, 0);
    for (let k = 0; k < 9; k++) add(G.cyl(.012, .014, .32 + (k % 3) * .05, 6), k % 2 ? '#3fae4a' : '#5cc458', -.54 + (k % 3) * .05, .45 + (k % 3) * .02, -.05 + Math.floor(k / 3) * .05, (k % 3 - 1) * .12, 0, (k % 2 ? 1 : -1) * .1);
    // 토분 제라늄 (벽돌 한 장 위)
    add(G.box(.3, .08, .18, .015), C.brick, -.08, .04, -.02);
    add(G.cyl(.13, .1, .22, 14), '#d27a52', -.08, .19, -.02); add(G.cyl(.14, .14, .04, 14), '#bf6a44', -.08, .3, -.02);
    leafy(-.08, .35, -.02, 7, 1); flowers(-.08, .42, -.02, 7, 1.1, ['#e8314a', '#ff5f6f']);
    // 검은 고무 대야 + 노란 국화
    add(new THREE.LatheGeometry([[0, 0], [.2, 0], [.26, .2], [.28, .22], [0, .22]].map(([r, y]) => new THREE.Vector2(r, y)), 18), '#3a3640', .36, 0, -.02);
    leafy(.36, .25, -.02, 9, 1.2); flowers(.36, .3, -.02, 10, 1.2, ['#ffd23f', '#ffe36e', '#ffb23f']);
  }));
  f.spot('behind', null, -.28, 0, -.2, { maxH: .3, label: '화분 뒤', scale: .8 });
  f.spot('behind', null, .64, 0, -.12, { maxH: .3, label: '대야 화분 옆', scale: .8 });
};

// ── 플라스틱 동그란 의자 (빨강 · 파랑) — 삐딱이 '의자 두 개' (하나는 가방 자리) ───────────────────────────────────────────
B.jd_stool = (f, T, o = {}) => {
  const c = o.c || '#e8473d';
  f.add(mc('stool|' + c, ({ add }) => {
    add(G.cyl(.17, .17, .045, 22), c, 0, .41, 0); add(G.cyl(.15, .15, .02, 22), shade(c, .12), 0, .438, 0);
    for (let k = 0; k < 4; k++) { const a = k * HP + PI / 4; add(G.box(.045, .4, .06, .015), c, Math.cos(a) * .12, .2, Math.sin(a) * .12, Math.sin(a) * .12, 0, -Math.cos(a) * .12); }
    add(G.tor(.13, .014, PI * 2, 5, 18), shade(c, -.08), 0, .14, 0, HP, 0, 0);
  }));
  f.spot('on', null, 0, .44, 0, { maxH: .35, label: '의자 위', scale: .8 });
  f.spot('under', null, 0, 0, 0, { maxH: .26, label: '의자 밑', scale: .75 });
};

export const JD_BUILDERS = B;
export const JD_INFO = {
  jd_base: { w: .1, d: .1, name: '장독대 마당 둥근 섬', price: 0, hidden: true, floor: true },
  jd_house: { w: .1, d: .1, name: '삐딱이네 집', price: 0, hidden: true, floor: true },
  jd_wall: { w: .1, d: .1, name: '담과 대문', price: 0, hidden: true, floor: true },
  jd_jangdok: { w: 2, d: 1, name: '장독대', price: 0, hidden: true },
  jd_pots: { w: 1, d: 1, name: '화분 줄', price: 0, hidden: true },
  jd_stool: { w: 1, d: 1, name: '플라스틱 의자', price: 0, hidden: true },
};

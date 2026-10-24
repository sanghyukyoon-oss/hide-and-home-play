// 21판 동네 파출소 앞 3안 policefront3 (① 10/23, 사용자 "파출소도 다시 해 줘야 할 듯. 도로에 담장 있고 지금.. 흠.." · "제로베이스로 아예
// 다시. 자동차는 만든 것 써도 괜찮지만.. 단차, 도로, 벽 이런 거 어색하지 않게. 텍스쳐 많이 쓰고 현실적이고 재미있게 새롭게."):
// 담장 없이 열린 길 모퉁이 한 토막을 둥근 섬으로 자른 디오라마. 보도는 걷는 높이(방 바닥), 차도는 화강암 연석 한 단(13 cm) 아래로
// 섬 끝까지 그대로 흐르고, 건너편 보도 한 줄과 연석이 길을 마무리한다(벽 X). 횡단보도 자리는 연석을 낮춘 경사로 + 점자 블록.
// 위에는 파출소 건물 모양 그대로 자른 단면 — 흰 타일 벽에 파란 띠, 길모퉁이 탑 자체가 거대 경광등(이 판의 '거대 소품 건물'),
// 지붕 위 '몽글 파출소' 간판, 파란 '경찰' 등. 안은 길 쪽 민원 창구·분실물 유리 보관함(문 한 짝 열린 단면)·포스터, 바깥 뒷벽엔
// 실외기·가스관·창. 횡단보도 옆 신호등, 섬 뒤 하얀 동네 옆 골목 끝에 다음 판(22판 골목)의 편의점·포장마차가 작게 (10/23 승인 방향).
// 장치·자물쇠·보스 연출 부품(patrolcar·lostbox·vending·mailbox·postbox2 …)은 정본 가구 그대로 policefront3-map.js가 놓는다.
// 좌표는 방 좌표 그대로(두 조각 다 x 0, z 0에 놓임): 방 9 × 5 = 보도와 파출소(걷는 곳), 차도와 건너편 보도는 방 앞(z 2.5~)의 섬.
import * as THREE from 'three';
import { put, mat, mesh, canvasTex, texCache, roundRect } from './kit.js';
import { HG as G, hmc as rawMc } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';
import { makeFurniture } from './furniture.js';
import { addPigeon } from './birds.js';

const WORDS = { '몽글 파출소': 'Mongle Police Box', '민원 창구': 'Help Desk', '분실물': 'Lost & Found', '경찰': 'POLICE', '순찰함': 'Patrol Box',
  '번호표': 'Ticket', '천천히': 'SLOW', '순찰 중': 'On Patrol', '잠깐 순찰 중이에요': 'Out on patrol', '분실물 찾아가세요': 'Claim your lost items',
  '자전거 도난 주의': 'Lock your bike', '범죄 신고': 'Report a crime', '어린이 안전': 'Kids first', '경찰 전용': 'Police only', '누르세요': 'Push', '분실물 보관함': 'Lost & Found',
  '파출소 앞 비둘기': 'Pigeons by the police box', '가로수': 'Street tree' };
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

const PI = Math.PI, HP = PI / 2;
const mc = (key, fn) => rawMc('pf3|' + key, fn);
const TEX = texCache();
const C = {
  tile: '#f7f9fd', grout: '#cfd7e6', blue: '#3f6fd8', navy: '#2b3a7c', sky: '#bfe0f7', lblue: '#7fa6ee',
  stone: '#d3d6de', stone2: '#bfc3cd', earth: '#b0906f', earth2: '#94765a', grass: '#8cc864', grass2: '#6fb052',
  wood: '#d9a86a', woodD: '#a8743f', steel: '#c9cfe0', steelD: '#9aa3ba', red: '#e8433d', yel: '#ffcf3a', ink: '#2a1d33',
  pave: '#e6e7ec', road: '#86849a', curb: '#ecebe6', curb2: '#d6d4cc',
};
// 섬: 둥근 네모(모서리 1.4 m) x ±4.95, z -2.95 ~ 5.6. 보도·파출소는 z 2.5까지(방), 차도 z 2.5 ~ 5.05 (13 cm 아래), 건너편 보도 그 앞
export const ISLE = { hx: 4.95, z0: -2.95, z1: 5.6, r: 1.4, curb: 2.5, curb2: 5.05, ry: -.13 };
// 건물: 뒷벽 바깥 z -2.47, 왼벽 바깥 x -4.45, 앞은 z .2까지 열림, 오른쪽 둥근 탑 (1.0, -1.85) 반지름 .8
export const BLD = { x0: -4.45, x1: 1.0, z0: -2.47, z1: .2, t: .18, H: 2.75, tower: [1.0, -1.85], tr: .8, TH: 3.3, BH: 1.45 };
// 횡단보도 x 범위 (연석 낮춘 경사로도 여기)
const CROSS = [1.0, 3.35];

// the island outline as a polygon of (x, z), corners as arcs
function isleOutline(grow = 0) {
  const { hx, z0, z1, r } = ISLE, X = hx + grow, A = z0 - grow, Bz = z1 + grow, out = [];
  const arc = (cx, cz, a0) => { for (let k = 0; k <= 10; k++) { const a = a0 + HP * k / 10; out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  arc(X - r, A + r, -HP); arc(X - r, Bz - r, 0); arc(-X + r, Bz - r, HP); arc(-X + r, A + r, PI);
  return out;
}
// the part of a convex outline between za and zb (Sutherland–Hodgman against two lines)
function clipZ(poly, za, zb) {
  const cut = (P, keep, zc) => { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = keep(a[1]), ib = keep(b[1]);
    if (ia) out.push(a); if (ia !== ib) { const t = (zc - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, zc]); } } return out; };
  return cut(cut(poly, z => z >= za, za), z => z <= zb, zb);
}
const halfW = z => { const { hx, z0, z1, r } = ISLE; const cz = z < z0 + r ? z0 + r : z > z1 - r ? z1 - r : null; return cz == null ? hx : hx - r + Math.sqrt(Math.max(0, r * r - (z - cz) ** 2)); };
const shapeOf = pts => { const s = new THREE.Shape(); s.moveTo(pts[0][0], -pts[0][1]); for (const p of pts.slice(1)) s.lineTo(p[0], -p[1]); return s; };
const flat = (pts, m, y) => { const o = mesh(new THREE.ShapeGeometry(shapeOf(pts)), m, { cast: false }); o.rotation.x = -HP; o.position.y = y; o.receiveShadow = true; return o; };
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

// ── textures (world-mapped: a ShapeGeometry's uv is its x, -z in metres; repeat = 1 / the texture's span) ──────────────
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const paverTex = () => TEX.get('pf3|paver', () => canvasTex(1024, 1024, (c, w, h) => {
  // 보도블록: 20 × 10 cm 직사각 블록 엇갈려 깔기, 회색 셋에 연분홍이 가끔, 줄눈과 잔 얼룩 — 텍스처 하나가 2 m
  const px = w / 2, bw = .2 * px, bh = .1 * px;
  c.fillStyle = '#c7cad3'; c.fillRect(0, 0, w, h);
  const tones = ['#e6e7ec', '#dfe1e7', '#eceef1', '#e2e3e9', '#e9dcdc'];
  for (let r = 0; r < h / bh; r++) for (let k = -1; k < w / bw + 1; k++) {
    const x = k * bw + (r % 2 ? bw / 2 : 0), y = r * bh, n = hash(r * 97 + k * 13);
    c.fillStyle = tones[n < .08 ? 4 : Math.floor(n * 4) % 4]; c.fillRect(x + 1.6, y + 1.6, bw - 3.2, bh - 3.2);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + 1.6, y + 1.6, bw - 3.2, 2);
  }
  for (let k = 0; k < 500; k++) { c.fillStyle = `rgba(110,112,130,${.05 + hash(k) * .07})`; c.fillRect(hash(k + 3) * w, hash(k + 7) * h, 2 + hash(k + 9) * 3, 2); }
}, { repeat: [.5, .5] }));
const roadTex = () => TEX.get('pf3|road', () => canvasTex(1024, 1024, (c, w, h) => {
  // 아스팔트: 보랏빛 회색 결, 굵은 알갱이, 땜질한 자국 둘, 잔금 — 텍스처 하나가 4 m (반복이 덜 보이게)
  c.fillStyle = C.road; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 5200; k++) { const n = hash(k); c.fillStyle = n < .55 ? 'rgba(58,56,78,.16)' : n < .85 ? 'rgba(255,255,255,.09)' : 'rgba(40,38,60,.22)'; c.fillRect(hash(k + 1) * w, hash(k + 2) * h, 1.5 + hash(k + 4) * 3, 1.5 + hash(k + 5) * 2); }
  c.fillStyle = 'rgba(70,68,92,.35)'; roundRect(c, 120, 600, 230, 150, 10); c.fill(); roundRect(c, 700, 180, 160, 260, 10); c.fill();
  c.strokeStyle = 'rgba(52,50,72,.55)'; c.lineWidth = 2.5; c.lineCap = 'round';
  for (const [x, y, s] of [[420, 300, 1], [180, 900, -1], [820, 760, 1]]) { c.beginPath(); c.moveTo(x, y); for (let k = 1; k < 7; k++) c.lineTo(x + k * 22 * s + (k % 2 ? 8 : -6), y + k * 14 + (k % 3) * 6); c.stroke(); }
}, { repeat: [.25, .25] }));
const curbTex = () => TEX.get('pf3|curb', () => canvasTex(256, 64, (c, w, h) => {
  // 화강암 연석 옆면: 희끗한 점박이, 위 모서리 밝게
  c.fillStyle = C.curb; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 420; k++) { const n = hash(k + 50); c.fillStyle = n < .5 ? 'rgba(120,118,130,.28)' : n < .8 ? 'rgba(80,80,95,.22)' : 'rgba(255,255,255,.6)'; c.fillRect(hash(k + 51) * w, hash(k + 52) * h, 2, 2); }
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, 0, w, 4); c.fillStyle = 'rgba(90,88,100,.35)'; c.fillRect(w - 3, 0, 3, h);
}));
const inTileTex = () => TEX.get('pf3|intile', () => canvasTex(512, 512, (c, w, h) => {
  // 파출소 안 바닥: 30 cm 흰 타일에 하늘 타일이 드문드문 — 텍스처 하나가 1.2 m
  const n = 4, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { c.fillStyle = (i * 3 + j) % 7 === 2 ? '#d6e3f7' : '#f6f8fc'; c.fillRect(i * s, j * s, s, s); }
  c.strokeStyle = '#c9d3e4'; c.lineWidth = 4; for (let k = 0; k <= n; k++) { c.beginPath(); c.moveTo(k * s, 0); c.lineTo(k * s, h); c.stroke(); c.beginPath(); c.moveTo(0, k * s); c.lineTo(w, k * s); c.stroke(); }
  c.fillStyle = 'rgba(120,130,160,.08)'; for (let k = 0; k < 120; k++) c.fillRect(hash(k + 90) * w, hash(k + 91) * h, 3, 3);
}, { repeat: [1 / 1.2, 1 / 1.2] }));
const wallTex = (key, len, hgt) => TEX.get('pf3|wall|' + key, () => {
  // 흰 타일 벽: 25 × 12.5 cm 타일, 줄눈, 타일마다 아주 옅은 차이 (벽 한 장 크기대로 그려 늘어나지 않게)
  const px = 128, W = Math.round(len * px), H = Math.round(hgt * px), th = px * .125, tw = px * .25;
  return canvasTex(W, H, (c, w, h) => {
    c.fillStyle = C.grout; c.fillRect(0, 0, w, h);
    for (let r = 0; r * th < h; r++) for (let k = -1; k * tw < w; k++) { const x = k * tw + (r % 2) * tw / 2, y = h - (r + 1) * th, n = hash(r * 31 + k);
      c.fillStyle = n < .1 ? '#eef2f9' : C.tile; c.fillRect(x + 1, y + 1, tw - 2, th - 2); }
  });
});
const manholeTex = () => TEX.get('pf3|manhole', () => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#5f5d73'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 2, 0, PI * 2); c.fill();
  c.strokeStyle = '#4b495e'; c.lineWidth = 10; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 12, 0, PI * 2); c.stroke();
  c.lineWidth = 5; for (const r of [70, 40]) { c.beginPath(); c.arc(w / 2, h / 2, r, 0, PI * 2); c.stroke(); }
  for (let k = 0; k < 12; k++) { const a = k * PI / 6; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * 40, h / 2 + Math.sin(a) * 40); c.lineTo(w / 2 + Math.cos(a) * 104, h / 2 + Math.sin(a) * 104); c.stroke(); }
  c.fillStyle = '#7a788e'; c.font = '800 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('오수', w / 2, h / 2);
}));
const paintTex = (key, text, px = 64) => TEX.get('pf3|paint|' + key, () => textTex(512, 160, (c, w, h) => {
  fitText(c, text, w / 2, h / 2 + 2, w * .92, px, 'rgba(255,255,255,.92)', { weight: '800' });
}));
const signTex = () => TEX.get('pf3|sign', () => textTex(1024, 220, (c, w, h) => {
  c.fillStyle = C.navy; roundRect(c, 3, 3, w - 6, h - 6, 22); c.fill();
  c.strokeStyle = '#ffffff'; c.lineWidth = 5; roundRect(c, 10, 10, w - 20, h - 20, 16); c.stroke();
  const bx = 70, by = h / 2;
  c.fillStyle = C.yel; c.beginPath(); c.moveTo(bx, by - 40); c.lineTo(bx + 34, by - 28); c.lineTo(bx + 30, by + 12); c.quadraticCurveTo(bx + 20, by + 34, bx, by + 43); c.quadraticCurveTo(bx - 20, by + 34, bx - 30, by + 12); c.lineTo(bx - 34, by - 28); c.closePath(); c.fill();
  c.fillStyle = C.blue; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -HP + k * PI / 5, r = k % 2 ? 8 : 19; c.lineTo(bx + Math.cos(a) * r, by + 2 + Math.sin(a) * r); } c.closePath(); c.fill();
  fitText(c, '몽글 파출소', w / 2 + 40, h / 2 + 4, w - 190, 80, '#ffffff', { weight: '800' });
}));
const small = (key, w, h, bg, fg, text, px, line) => TEX.get('pf3|' + key, () => textTex(w, h, (c, W, H) => {
  c.fillStyle = bg; roundRect(c, 1, 1, W - 2, H - 2, Math.min(W, H) * .16); c.fill();
  if (line) { c.strokeStyle = line; c.lineWidth = 3; roundRect(c, 4, 4, W - 8, H - 8, Math.min(W, H) * .12); c.stroke(); }
  fitText(c, text, W / 2, H / 2 + 1, W * .82, px, fg, { weight: '800', lines: 2 });
}));
const poster = (key, title, bg, art) => TEX.get('pf3|poster|' + key, () => textTex(240, 320, (c, w, h) => {
  // 포스터: 위 색 띠 제목, 가운데 단순한 그림, 아래 줄 글 흉내
  c.fillStyle = '#fbf7ee'; c.fillRect(0, 0, w, h); c.fillStyle = bg; c.fillRect(0, 0, w, 44);
  fitText(c, title, w / 2, 23, w * .86, 18, '#ffffff', { weight: '800', lines: 2 });
  art(c, w, h);
  c.fillStyle = '#c9c2b4'; for (let k = 0; k < 3; k++) c.fillRect(18, 128 + k * 9, w - 36 - k * 14, 4);
  c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2);
}));
const P_LOST = () => poster('lost', '분실물 찾아가세요', '#3f6fd8', (c, w) => { c.fillStyle = '#ffcf3a'; roundRect(c, w / 2 - 30, 60, 60, 46, 8); c.fill(); c.fillStyle = '#e8433d'; c.beginPath(); c.arc(w / 2, 58, 12, PI, 0); c.fill(); c.fillStyle = '#2b3a7c'; c.fillRect(w / 2 - 22, 76, 44, 5); });
const P_BIKE = () => poster('bike', '자전거 도난 주의', '#e8433d', (c, w) => { c.strokeStyle = '#2b3a7c'; c.lineWidth = 5; for (const x of [w / 2 - 26, w / 2 + 26]) { c.beginPath(); c.arc(x, 92, 16, 0, PI * 2); c.stroke(); } c.beginPath(); c.moveTo(w / 2 - 26, 92); c.lineTo(w / 2 - 6, 66); c.lineTo(w / 2 + 18, 66); c.lineTo(w / 2 + 26, 92); c.stroke(); c.fillStyle = '#ffcf3a'; roundRect(c, w / 2 - 6, 80, 14, 14, 3); c.fill(); });
const P_112 = () => poster('112', '범죄 신고', '#2b3a7c', (c, w) => { c.fillStyle = '#e8433d'; c.font = '800 46px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('112', w / 2, 86); });
const P_KIDS = () => poster('kids', '어린이 안전', '#4cae7b', (c, w) => { c.fillStyle = '#ffcf3a'; c.beginPath(); c.arc(w / 2, 82, 26, 0, PI * 2); c.fill(); c.fillStyle = '#2a1d33'; for (const x of [-9, 9]) { c.beginPath(); c.arc(w / 2 + x, 78, 3.5, 0, PI * 2); c.fill(); } c.strokeStyle = '#2a1d33'; c.lineWidth = 3; c.beginPath(); c.arc(w / 2, 86, 10, .2, PI - .2); c.stroke(); });
const decal = (w, h, t, o) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: t, ...o }), { cast: false });

const B = {};

// ── 바탕: 둥근 섬 — 보도블록 보도 · 화강암 연석 한 단 · 차도(아스팔트·차선·횡단보도·맨홀) · 건너편 보도 ─────────────────
B.pf3_base = f => {
  const { hx, z0, z1, curb, curb2, ry } = ISLE, O = isleOutline();
  const near = clipZ(O, -99, curb), road = clipZ(O, curb, curb2), far = clipZ(O, curb2, 99);
  // 건너편 보도의 가로수 자리 · 순찰차 주차 칸 (x -3.0 ~ -.8)
  const tx = -2.6, tz = curb2 + .32, PK = [-2.25, .05];
  const mid = (curb + curb2) / 2;
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.8, 0, .01, -.75, .01];
  f.add(mc('base-v3', ({ add }) => {
    // 받침: 차도 높이까지 돌 켜 · 흙 켜 (두께 있는 둥근 블록), 그 위 보도 두 판 (보도 판석 옆면 = 섬 테두리)
    add(G.ext(shapeOf(O), .36, 0, 8), C.stone, 0, ry - .36, 0, -HP, 0, 0);
    add(G.ext(shapeOf(isleOutline(-.06)), .34, .04, 8), C.earth, 0, ry - .74, 0, -HP, 0, 0);
    for (const P of [near, far]) add(G.ext(shapeOf(P), -ry + .004, 0, 8), '#dfe1e7', 0, ry, 0, -HP, 0, 0);
    // 돌 켜 줄눈 (카메라 쪽 앞·오른쪽)
    for (let x = -3.4; x <= 3.41; x += .5) add(G.pbox(.02, .3, .02), C.stone2, x, ry - .18, z1 + .006);
    for (let z = -1.4; z <= 4.1; z += .5) add(G.pbox(.02, .3, .02), C.stone2, hx + .006, ry - .18, z);
    add(G.pbox(7.1, .02, .02), C.stone2, 0, ry - .1, z1 + .006); add(G.pbox(.02, .02, 5.5, .004), C.stone2, hx + .006, ry - .1, 1.35);
    for (const [x, z] of [[-2.6, z1 - .03], [-.3, z1 - .03], [2.1, z1 - .03], [hx - .03, 3.3], [hx - .03, .2]]) add(G.sph(.07, 8, 6), C.earth2, x, ry - .55, z, 0, 0, 0, [1.4, .8, 1]);
    // 연석 위 모서리 (보도 쪽, 횡단보도 자리는 낮춤)
    const kerb = (z, s) => { for (const [a, b] of [[-halfW(z), CROSS[0]], [CROSS[1], halfW(z)]]) { const L = b - a; if (L > .05) add(G.box(L, .05, .16, .02), C.curb, (a + b) / 2, .012, z - s * .08); } };
    kerb(curb, 1); kerb(curb2, -1);
    // 경사로: 연석을 낮춘 횡단보도 자리 — 보도에서 차도로 비스듬히
    for (const [z, s] of [[curb, 1], [curb2, -1]]) {
      const L = .42, a = Math.atan2(-ry, L);
      add(G.pbox(CROSS[1] - CROSS[0], .03, Math.hypot(L, ry)), '#d6d7dd', (CROSS[0] + CROSS[1]) / 2, ry / 2 - .01, z + s * L / 2, s * a, 0, 0);
      for (const x of CROSS) add(G.pbox(.05, -ry, L), '#d6d7dd', x, ry / 2, z + s * L / 2);
    }
    // 점자 블록 (경사로 위 보도)
    for (const [z, s] of [[curb - .3, 1], [curb2 + .3, -1]]) {
      add(G.box(CROSS[1] - CROSS[0] - .3, .014, .3, .01), '#f2c94c', (CROSS[0] + CROSS[1]) / 2, .02, z);
      for (let x = CROSS[0] + .25; x < CROSS[1] - .2; x += .12) for (const dz of [-.07, .07]) add(G.cyl(.02, .024, .014, 6), '#e5b53a', x, .032, z + dz);
    }
    // 차선: 가운데 노란 두 줄(횡단보도에서 끊김), 정지선, 길가 흰 줄, 횡단보도, 화살표
    const Y = ry + .012;
    for (const dz of [-.06, .06]) { add(G.pbox(CROSS[0] - .6 + 4.6, .006, .07), '#f2c94c', (CROSS[0] - .6 - 4.6) / 2, Y, mid + dz); add(G.pbox(halfW(mid) - CROSS[1] - .6, .006, .07), '#f2c94c', (CROSS[1] + .6 + halfW(mid)) / 2, Y, mid + dz); }
    add(G.pbox(.1, .006, curb2 - mid - .1), '#ffffff', CROSS[0] - .45, Y, (mid + curb2) / 2 + .05);
    add(G.pbox(.1, .006, mid - curb - .1), '#ffffff', CROSS[1] + .45, Y, (curb + mid) / 2 - .05);
    for (const z of [curb + .22, curb2 - .22]) add(G.pbox(4.6 + CROSS[0] - .6, .006, .06), '#ffffff', (CROSS[0] - .6 - 4.6) / 2, Y, z);
    for (let x = CROSS[0] + .12; x < CROSS[1] - .1; x += .4) add(G.pbox(.24, .006, curb2 - curb - .9), '#ffffff', x, Y + .001, mid);
    // 순찰차 주차 칸 (흰 테두리)
    add(G.pbox(PK[1] - PK[0], .006, .07), '#ffffff', (PK[0] + PK[1]) / 2, Y, mid - .12); for (const x of PK) add(G.pbox(.07, .006, mid - .12 - curb - .05), '#ffffff', x, Y, (mid - .12 + curb + .05) / 2);
    // 빗물받이 (연석 아래)
    for (const [x, z] of [[-3.5, curb + .2], [4.0, curb2 - .2]]) { add(G.box(.6, .012, .24, .008), '#6c6a80', x, ry + .008, z); for (let k = 0; k < 6; k++) add(G.pbox(.035, .014, .18), '#45435a', x - .22 + k * .088, ry + .01, z); }
    // 건너편 보도: 볼라드 둘 (가로수는 아래 tree-v2)
    for (const x of [CROSS[0] - .3, CROSS[1] + .3]) { add(G.cyl(.07, .08, .5, 12), '#5b5672', x, .25, curb2 + .35); add(G.cyl(.075, .075, .05, 12), C.yel, x, .4, curb2 + .35); }
    // 섬 가장자리 풀 한 줌 (모서리에만 — 한적하게)
    for (const [x, z, s] of [[-4.72, -.6, 1], [-3.9, -2.75, .8], [4.3, -2.45, 1.1], [4.65, -1.9, .8], [4.25, 5.25, .7], [-4.4, 5.2, .75]]) {
      add(G.sph(.2 * s, 10, 8), C.grass, x, .1 * s, z, 0, 0, 0, [1.3, .8, 1.1]);
      add(G.sph(.15 * s, 10, 8), C.grass2, x + .16 * s, .08 * s, z + .1, 0, 0, 0, [1.2, .8, 1]);
    }
  }));
  // 가로수 (10/24 사용자 "가로수 디테일 올려줘"): 화강암 받침 테 · 흙 위 쇠 격자 보호 덮개(바깥 테 · 고리 둘 · 살) · 덮개 위로 나온 뿌리 ·
  // 살짝 기운 줄기(껍질 조각 · 옹이) · 가을 볏짚 잠복소 · 세 갈래 나무 지주목과 가로대 · 가지 넷 · 잎 덩어리 여럿(아래 짙게 · 위 밝게 ·
  // 노랗게 물든 몇 송이) · 덮개와 보도에 떨어진 잎
  f.add(mc('tree-v2', ({ add, tube }) => {
    const X = tx, Z = tz, GW = .62, GD = .44, IRON = '#4f4b63', IRON2 = '#66617d', BARK = '#8a6a4c', BARK2 = '#6f5440';
    // 받침 테 (보도보다 조금 높은 화강암 네 변) · 흙
    for (const sz of [-1, 1]) add(G.box(GW + .14, .04, .07, .012), '#dddbd3', X, .022, Z + sz * (GD / 2 + .035));
    for (const sx of [-1, 1]) add(G.box(.07, .04, GD, .012), '#dddbd3', X + sx * (GW / 2 + .035), .022, Z);
    add(G.pbox(GW, .012, GD), '#6e5440', X, .008, Z);
    for (const [dx, dz] of [[-.2, .12], [.22, -.1], [-.08, -.15], [.16, .14]]) add(G.sph(.018, 6, 5), '#9a8a7a', X + dx, .016, Z + dz, 0, 0, 0, [1.2, .5, 1]);
    // 쇠 격자 덮개: 바깥 테 · 고리 둘 · 고리에서 테까지 살 열둘
    const GY = .034;
    for (const sz of [-1, 1]) add(G.box(GW, .024, .03, .006), IRON, X, GY, Z + sz * (GD / 2 - .015));
    for (const sx of [-1, 1]) add(G.box(.03, .024, GD, .006), IRON, X + sx * (GW / 2 - .015), GY, Z);
    add(G.tor(.105, .012, PI * 2, 6, 28), IRON, X, GY, Z, HP, 0, 0);
    add(G.tor(.175, .01, PI * 2, 6, 34), IRON2, X, GY, Z, HP, 0, 0);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * PI * 2 + PI / 12, c = Math.cos(a), sn = Math.sin(a);
      const t = Math.min((GW / 2 - .03) / Math.max(1e-3, Math.abs(c)), (GD / 2 - .03) / Math.max(1e-3, Math.abs(sn)));
      const r0 = .11, L = t - r0, rm = (r0 + t) / 2;
      add(G.pbox(L, .02, .016), i % 2 ? IRON2 : IRON, X + c * rm, GY, Z + sn * rm, 0, -a, 0);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.012, .012, .008, 8), '#8d88a3', X + sx * (GW / 2 - .015), GY + .014, Z + sz * (GD / 2 - .015));
    // 줄기 (살짝 기움) · 뿌리 · 껍질 조각 · 옹이
    const top = [X + .05, 1.22, Z - .03];
    tube([X, 0, Z], top, .085, BARK, 12, .055);
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + .4; tube([X + Math.cos(a) * .04, .13, Z + Math.sin(a) * .04], [X + Math.cos(a) * .12, .03, Z + Math.sin(a) * .1], .034, BARK2, 7, .02); }
    for (const [y, a, w] of [[.28, .3, 1], [.42, 2.4, .8], [1.02, 4.1, .9], [1.12, 1.2, .7], [.95, 3.0, .8]]) {
      const k = y / 1.22, r = .085 + (.055 - .085) * k + .002;
      add(G.box(.035 * w, .08 * w, .012, .005), BARK2, X + .05 * k + Math.cos(a) * r, y, Z - .03 * k + Math.sin(a) * r, 0, -a + HP, 0);
    }
    add(G.sph(.022, 8, 6), BARK2, X + .05 * .36 + .077, .45, Z - .01, 0, 0, 0, [.6, 1, 1]);
    add(G.sph(.012, 6, 5), '#4e3a2c', X + .05 * .36 + .088, .45, Z - .01);
    // 잠복소: 볏짚을 두른 띠와 새끼줄 두 줄, 아래 끝 짚 술
    add(G.cyl(.088, .093, .24, 16), '#e2c27a', X + .05 * .52, .64, Z - .03 * .52);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; add(G.box(.012, .22, .008, .003), i % 2 ? '#cfa95e' : '#ead196', X + .026 + Math.cos(a) * .092, .64, Z - .016 + Math.sin(a) * .092, 0, -a + HP, 0); }
    for (const y of [.56, .73]) add(G.tor(.094, .009, PI * 2, 5, 20), '#8a6a3c', X + .026, y, Z - .016, HP, 0, 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2 + .2; add(G.cone(.012, .05, 4), '#d9b86c', X + .026 + Math.cos(a) * .088, .505, Z - .016 + Math.sin(a) * .088, PI, 0, 0); }
    // 지주목: 보도에 박힌 세 나무 기둥이 줄기 쪽으로 기대고, 가로대 셋, 줄기에 묶은 검은 고무 띠
    const TY = .98, tk = [X + .05 * .8, TY, Z - .03 * .8];
    const legs = [[X - .37, Z + .03], [X + .22, Z - .27], [X + .14, Z + .2]];
    const at = (b, t) => [b[0] + (tk[0] - b[0]) * t, t * TY, b[1] + (tk[2] - b[1]) * t];
    for (const [lx, lz] of legs) {
      const d = Math.hypot(tk[0] - lx, tk[2] - lz), k = .07 / d;
      tube([lx, 0, lz], [tk[0] + (lx - tk[0]) * k, TY + .06, tk[2] + (lz - tk[2]) * k], .022, '#c99a62', 8, .019);
      add(G.cyl(.026, .026, .03, 8), '#a8743f', lx, .015, lz);
    }
    for (let i = 0; i < 3; i++) { const A = legs[i], Bq = legs[(i + 1) % 3]; tube(at(A, .62), at(Bq, .62), .014, '#b88a54', 6); }
    add(G.cyl(.068, .068, .05, 14), '#3b3550', ...tk);
    // 가지: 줄기 끝에서 넷, 잔가지 몇
    const br = [[-.34, 1.55, .1], [.36, 1.58, -.12], [-.08, 1.72, -.2], [.12, 1.7, .22]];
    for (const [dx, y, dz] of br) {
      tube(top, [X + dx, y, Z + dz], .042, BARK, 8, .022);
      tube([X + dx, y, Z + dz], [X + dx * 1.3, y + .16, Z + dz * 1.4], .02, BARK, 6, .01);
    }
    tube([top[0], top[1] - .1, top[2]], [X - .2, 1.36, Z - .14], .03, BARK, 7, .014);
    // 잎 덩어리: 아래쪽 그늘 → 가운데 → 위 밝은 면 → 노랗게 물든 몇 송이
    add(G.sph(.36, 14, 10), '#4f8f42', X + .02, 1.42, Z, 0, 0, 0, [1.25, .42, 1.1]);
    const LV = [
      [0, 1.64, 0, .4, '#5fa64a'], [-.33, 1.52, .06, .28, '#5fa64a'], [.34, 1.54, -.05, .29, '#5fa64a'], [-.12, 1.52, .27, .26, C.grass2],
      [.15, 1.5, -.27, .25, '#5fa64a'], [-.22, 1.86, -.08, .3, C.grass2], [.21, 1.86, .1, .3, C.grass], [-.38, 1.74, -.13, .21, C.grass2],
      [.39, 1.76, .15, .21, C.grass], [.02, 2.04, .02, .27, '#9ad36c'], [-.12, 1.7, .32, .2, C.grass], [.18, 1.72, -.3, .19, C.grass2],
      [.1, 2.18, .1, .14, '#b6e283'], [-.25, 2.0, .17, .13, '#b6e283'], [.3, 1.98, -.06, .12, '#a9dc77'],
      [.33, 1.44, .18, .12, '#d6d45e'], [-.31, 1.97, -.24, .11, '#e2cf55'], [-.42, 1.48, -.1, .1, '#cfd25c'],
    ];
    for (const [dx, y, dz, r, c] of LV) add(G.sph(r, 14, 10), c, X + dx, y, Z + dz, 0, 0, 0, [1, .86, 1]);
    // 떨어진 잎 (덮개 위 · 보도)
    for (const [dx, dz, a, c] of [[-.16, .1, .3, '#e2cf55'], [.12, -.12, 1.4, '#9ad36c'], [.24, .08, 2.2, '#d6d45e'], [-.24, -.12, .9, '#e2cf55'],
      [.5, .16, 1.9, '#d6d45e'], [-.52, -.06, 2.7, '#9ad36c'], [.06, .2, .5, '#e2cf55']])
      add(G.sph(.026, 7, 4), c, X + dx, .048, Z + dz, 0, a, 0, [1.3, .18, .8]);
  }));
  // 겉면: 보도블록 · 아스팔트 · 연석 옆면(화강암) · 맨홀 · 노면 글자
  const pm = mat('#ffffff', { map: paverTex(), rough: .75, rim: .1 });
  f.add(flat(near, pm, .012)); f.add(flat(far, pm, .012));
  f.add(flat(road, mat('#ffffff', { map: roadTex(), rough: .85, rim: .08 }), ry + .006));
  const ct = curbTex(), cm = L => mat('#ffffff', { map: ct, rough: .7, rim: .1 });
  for (const [z, s] of [[curb, 1], [curb2, -1]]) for (const [a, b] of [[-halfW(z), CROSS[0]], [CROSS[1], halfW(z)]]) {
    for (let x = a; x < b - .02; x += .8) { const L = Math.min(.8, b - x) - .015; const fm = mesh(new THREE.PlaneGeometry(L, -ry + .03), cm(L), { cast: false }); put(fm, x + L / 2, (ry + .03) / 2 + .0, z + s * .002, 0, s > 0 ? 0 : PI, 0); f.add(fm); }
  }
  { const m = mesh(new THREE.CircleGeometry(.34, 28), mat('#ffffff', { map: manholeTex(), rough: .6 }), { cast: false }); put(m, -.2, ry + .014, 4.4, -HP, 0, 0); f.add(m); }
  { const m = mesh(new THREE.CircleGeometry(.24, 24), mat('#ffffff', { map: manholeTex(), rough: .6 }), { cast: false }); put(m, -.7, .016, 1.25, -HP, 0, 0); f.add(m); }
  f.add(put(decal(1.5, .46, paintTex('slow', '천천히', 70), { opacity: .97 }), -3.0, ry + .014, 4.4, -HP, 0, 0));
  f.add(put(decal(.95, .26, paintTex('police', '경찰 전용', 60), { opacity: .97 }), PK[1] - .2, ry + .014, (curb + mid) / 2 - .05, -HP, 0, HP));
  f.group.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  f.spot('behind', null, -3.5, ry + .02, curb + .38, { maxH: .2, label: '빗물받이 옆', scale: .8 });
  f.spot('behind', null, tx + .35, .016, tz + .05, { maxH: .3, label: '가로수 밑', scale: .85 });
  // (차도는 걷는 곳이 아님 — 방 바닥이 보도까지라 걷기 칸은 따로 막을 것 없음)
};

// ── 파출소 단면: 흰 타일 벽 둘 + 둥근 모서리 탑 · 처마 · 간판 · 경광등 · 길 쪽 민원 창구 · 분실물 칸 선반 · 포스터 ──────────
B.pf3_station = f => {
  const { x0, x1, z0, z1, t, H, tower: [tx, tz], tr, TH, BH } = BLD;
  const LH = TH - BH - .2, LY = BH + .18 + LH / 2;
  const zi = z0 + t, xi = x0 + t, RW = .5;
  // 민원 창구 (cx0..cx1, 앞뒤 가운데 cz) · 분실물 유리 보관함 (sx0부터 sw 너비, 유리 선반 높이 SHELF)
  const cx0 = -3.95, cx1 = -2.2, cz = z1 - .5, cw = cx1 - cx0, ccx = (cx0 + cx1) / 2;
  const sx0 = xi + .05, sw = 1.2, sd = .45, sh = 1.75, scx = sx0 + sw / 2, sz = zi + sd / 2, SHELF = [.6, 1.05, 1.5];
  // 탑 겉면 위 한 점 (a: x축에서 z쪽으로 잰 각)
  const onTower = (a, dr = 0) => [tx + Math.cos(a) * (tr + dr), tz + Math.sin(a) * (tr + dr)];
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.8, 0, .01, -.75, .01];
  f.add(mc('station-v2', ({ add }) => {
    add(G.box(x1 - xi + .02, .016, z1 - zi, .006), '#e9edf5', (xi + x1) / 2, .008, (zi + z1) / 2);
    add(G.box(x1 - xi, .03, .1, .012), C.navy, (xi + x1) / 2, .015, z1 + .02);
    // 벽 몸통 (흰 타일 겉면은 따로) — 뒷벽, 왼벽(앞 끝 위 모서리를 둥글게 깎은 단면)
    add(G.box(tx - x0, H, t, .03), C.tile, (x0 + tx) / 2, H / 2, z0 + t / 2);
    add(G.box(t, H, z1 - RW - z0, .03), C.tile, x0 + t / 2, H / 2, (z0 + z1 - RW) / 2);
    add(G.box(t, H - RW, RW + .02, .03), C.tile, x0 + t / 2, (H - RW) / 2, z1 - RW / 2 - .01);
    add(G.cyl(RW, RW, t, 20), C.tile, x0 + t / 2, H - RW, z1 - RW, 0, 0, HP);
    // 남색 걸레받이 · 허리 하늘 줄 · 위 파란 띠 · 흰 갓돌 (안·밖 함께)
    for (const [h, y, c] of [[.14, .07, C.navy], [.07, 1.06, C.lblue], [.3, H - .26, C.blue], [.05, H - .08, '#ffffff']]) {
      add(G.box(tx - x0 + .02, h, t + .03, .01), c, (x0 + tx) / 2, y, z0 + t / 2);
      const zEnd = y > H - RW ? z1 - RW : z1 + .01;
      add(G.box(t + .03, h, zEnd - z0, .01), c, x0 + t / 2, y, (z0 + zEnd) / 2);
    }
    // 처마: 뒤와 왼쪽에만 얇게 (방 위는 열어 둠)
    add(G.box(tx - x0 + .3, .12, .82, .04), C.navy, (x0 + tx) / 2 - .15, H + .06, z0 + .33);
    add(G.box(.8, .12, z1 - z0 - .5, .04), C.navy, x0 + .32, H + .06, (z0 + z1) / 2 - .25);
    add(G.box(tx - x0 + .2, .03, .74, .02), '#e8ecf4', (x0 + tx) / 2 - .15, H + .135, z0 + .33);
    // 거대 경광등 탑 (이 판의 '거대 소품 건물' — 길모퉁이 탑 자체가 커다란 경광등): 흰 타일 받침(동그란 창) · 은빛 테 ·
    // 빨강/파랑 반반 큰 렌즈(세로 골·가로 띠·하이라이트) · 흰 갓 · 꼭지
    add(G.cyl(tr, tr, BH, 32), C.tile, tx, BH / 2, tz);
    for (const [r, h, y, c] of [[.015, .14, .07, C.navy], [.015, .07, BH - .16, C.lblue], [.07, .16, BH + .06, C.steel], [.09, .05, BH + .155, '#ffffff']]) add(G.cyl(tr + r, tr + r, h, 32), c, tx, y, tz);
    { const [cx, czz] = onTower(PI * .06, .005);
      add(G.tor(.17, .04, PI * 2, 8, 22), C.navy, cx, .82, czz, 0, HP - PI * .06, 0); add(G.cyl(.16, .16, .02, 20), C.sky, cx, .82, czz, 0, PI - PI * .06, HP); }
    add(new THREE.CylinderGeometry(tr - .02, tr - .02, LH, 32, 1, false, PI * .25, PI), '#f0605a', tx, LY, tz);
    add(new THREE.CylinderGeometry(tr - .02, tr - .02, LH, 32, 1, false, PI * 1.25, PI), '#4f86ff', tx, LY, tz);
    for (let k = 0; k < 16; k++) { const a = k * PI / 8 + PI / 16, [cx, czz] = onTower(a, -.015); add(G.pbox(.05, LH - .06, .02), a > PI * .25 && a < PI * 1.25 ? '#7aa4ff' : '#f58a83', cx, LY, czz, 0, HP - a, 0); }
    for (const y of [LY - LH * .3, LY + LH * .3]) add(G.tor(tr - .01, .025, PI * 2, 6, 32), '#ffffff', tx, y, tz, HP, 0, 0);
    for (const [a, c] of [[PI * .45, '#d6e4ff'], [PI * .05, '#ffd9d6']]) { const [cx, czz] = onTower(a, .0); add(G.box(.09, LH * .7, .03, .015), c, cx, LY + .05, czz, 0, HP - a, 0); }
    add(G.cyl(tr + .08, tr + .08, .12, 32), '#ffffff', tx, TH, tz);
    add(G.sph(tr * .8, 24, 12), '#f4f6fb', tx, TH + .06, tz, 0, 0, 0, [1, .45, 1]);
    add(G.cyl(.08, .1, .18, 12), C.steel, tx, TH + .42, tz); add(G.sph(.1, 12, 8), '#ffffff', tx, TH + .55, tz);
    // 렌즈 가운데 흰 판 '112' (카메라 쪽)
    { const a = PI * .27, [cx, czz] = onTower(a, .01); add(G.box(.62, .34, .04, .03), '#ffffff', cx, LY, czz, 0, HP - a, 0); }
    // 지붕 간판 (받침 다리)
    for (const x of [-3.3, -.8]) add(G.box(.08, .4, .08, .02), C.steelD, x, H + .32, z0 + .3);
    add(G.box(3.4, .78, .1, .04), C.navy, -2.05, H + .87, z0 + .3);
    // 파란 '경찰' 등 (왼벽 앞 끝, 순찰함 위)
    add(G.box(.44, .27, .16, .04), '#ffffff', x0 + .09, 2.02, z1 + .08);
    // 바깥 뒷벽 (뒤로 돌려 볼 때): 실외기 · 가스관 · 작은 창 · 빗물 홈통
    add(G.box(.8, .62, .34, .04), '#eef0f4', -1.4, .42, z0 - .19); add(G.cyl(.22, .22, .02, 22), '#9aa3ba', -1.55, .45, z0 - .37, HP, 0, 0);
    for (let k = 0; k < 5; k++) add(G.pbox(.012, .4, .012), '#c9cfe0', -1.72 + k * .08, .45, z0 - .38);
    add(G.box(.3, .3, .02, .01), '#c9cfe0', -1.05, .45, z0 - .37);
    add(G.cyl(.025, .025, 2.4, 8), '#f2c94c', -3.2, 1.3, z0 - .05); add(G.cyl(.025, .025, 1.6, 8), '#f2c94c', -2.4, 2.4, z0 - .05, 0, 0, HP); add(G.box(.18, .12, .1, .02), '#c9cfe0', -3.2, .9, z0 - .08);
    add(G.cyl(.045, .045, H, 10), '#b9c1d2', .2, H / 2, z0 - .06);
    add(G.box(1.1, .7, .06, .02), C.navy, -3.6, 1.75, z0 - .02); add(G.pbox(.98, .58, .02), C.sky, -3.6, 1.75, z0 - .05); add(G.pbox(.02, .58, .03), '#ffffff', -3.6, 1.75, z0 - .06);
    // 길 쪽 민원 창구: 하늘색 판 계산대, 나무 상판, 유리 칸막이 테와 머리 간판, 번호표 기계, 호출 벨, 볼펜, 택배 상자
    add(G.box(cw, .86, .5, .04), '#e7eefb', ccx, .43, cz);
    add(G.box(cw - .1, .12, .03, .01), C.blue, ccx, .62, cz + .26);
    add(G.box(cw + .1, .06, .62, .025), C.wood, ccx, .89, cz + .03);
    for (const x of [cx0 + .03, ccx, cx1 - .03]) add(G.box(.04, .5, .04, .012), C.steelD, x, 1.17, cz - .08);
    add(G.box(cw, .04, .05, .012), C.steelD, ccx, 1.42, cz - .08);
    add(G.box(.8, .2, .03, .01), C.blue, -3.08, 1.55, cz - .08); for (const x of [-3.38, -2.78]) add(G.box(.02, .1, .02, .005), C.steelD, x, 1.47, cz - .08);
    add(G.cyl(.04, .05, .03, 12), '#ffd23f', ccx + .45, .935, cz + .12); add(G.sph(.025, 8, 6), '#c9a227', ccx + .45, .96, cz + .12);
    add(G.box(.16, .24, .14, .03), C.red, cx0 + .2, 1.04, cz + .12); add(G.box(.1, .02, .02, .005), C.ink, cx0 + .2, 1.0, cz + .2);
    add(G.box(.13, .015, .04, .005), '#ffffff', ccx - .2, .93, cz + .15, 0, .3, 0); add(G.cyl(.006, .006, .14, 5), C.ink, ccx - .12, .93, cz + .1, 0, 0, HP);
    add(G.box(.34, .1, .26, .02), '#f2c46b', cx1 - .35, .95, cz - .12); add(G.box(.3, .02, .22, .005), '#ffffff', cx1 - .35, 1.0, cz - .12);
    add(G.box(.3, .22, .24, .02), '#c9a27a', cx1 + .3, .11, cz - .1); add(G.pbox(.31, .03, .06), '#e3cfa8', cx1 + .3, .2, cz - .1);
    // 분실물 유리 보관함 (뒷벽 왼쪽, 단면): 남색 받침 · 은빛 기둥 · 유리 선반 셋 · 하늘색 뒤판, 앞 유리문 한 짝은 열려 있음 —
    // 곰 인형 · 경찰 모자 · 우산 · 지갑 · 장난감 차 · 장갑 · 열쇠고리
    add(G.box(sw, .14, sd, .02), C.navy, scx, .07, sz);
    add(G.box(sw, .025, sd - .04, .01), '#dfe9f7', scx, .155, sz);
    add(G.pbox(sw - .04, sh - .2, .02), '#dbe8f8', scx, (sh + .14) / 2, zi + .03);
    for (const x of [sx0 + .02, sx0 + sw - .02]) for (const z of [zi + .03, zi + sd - .02]) add(G.box(.04, sh - .14, .04, .012), C.steel, x, (sh + .14) / 2, z);
    for (const y of SHELF) add(G.box(sw - .06, .02, sd - .06, .006), '#cfe6f7', scx, y, sz);
    add(G.box(sw + .04, .08, sd + .04, .02), C.steelD, scx, sh + .04, sz);
    add(G.box(sw - .1, .03, .03, .01), C.steel, scx, SHELF[0] - .02, zi + sd - .03);
    const sl = k => sx0 + .2 + k * (sw - .4) / 2;
    add(G.sph(.1, 10, 8), '#c99a6a', sl(0), .27, sz); add(G.sph(.075, 10, 8), '#c99a6a', sl(0), .4, sz); for (const q of [-1, 1]) add(G.sph(.03, 6, 5), '#c99a6a', sl(0) + q * .05, .47, sz);
    add(G.cyl(.02, .02, .42, 6), '#5aa6ff', sl(2), .37, sz, 0, 0, .3); add(G.cone(.09, .26, 8), '#5aa6ff', sl(2) - .03, .38, sz, 0, 0, .3 + PI);
    add(G.sph(.13, 12, 8), C.navy, sl(1), SHELF[1] + .05, sz, 0, 0, 0, [1, .55, 1]); add(G.cyl(.15, .15, .02, 14), C.navy, sl(1), SHELF[1] + .02, sz + .03); add(G.cyl(.03, .03, .01, 8), C.yel, sl(1), SHELF[1] + .1, sz + .13, HP, 0, 0);
    add(G.box(.18, .04, .12, .015), '#8a5a3c', sl(0), SHELF[1] + .03, sz + .04, 0, .3, 0);
    add(G.box(.08, .15, .02, .012), '#3a3550', sl(0), SHELF[0] + .085, sz - .05, -.2, 0, 0); add(G.pbox(.065, .12, .004), '#9fd0ff', sl(0), SHELF[0] + .09, sz - .038, -.2, 0, 0);
    add(G.box(.22, .16, .1, .04), '#e8605a', sl(2), SHELF[0] + .09, sz); add(G.tor(.07, .012, PI, 4, 10), '#a8433d', sl(2), SHELF[0] + .17, sz);
    add(G.box(.2, .07, .1, .025), '#ff8fb0', sl(0) + .02, SHELF[2] + .045, sz); for (const x of [-.06, .06]) add(G.cyl(.03, .03, .03, 10), C.ink, sl(0) + .02 + x, SHELF[2] + .02, sz + .05, HP, 0, 0);
    add(G.box(.1, .14, .05, .02), '#9ad0a8', sl(2) - .05, SHELF[2] + .08, sz); add(G.box(.1, .14, .05, .02), '#9ad0a8', sl(2) + .06, SHELF[2] + .08, sz + .02);
    add(G.tor(.04, .01, PI * 2, 4, 12), C.yel, sl(1), SHELF[2] + .02, sz + .08, HP, 0, 0); add(G.box(.03, .06, .01, .004), C.steel, sl(1) + .04, SHELF[2] + .02, sz + .1);
    // 왼벽 안: 벽시계 (포스터 위)
    add(G.cyl(.17, .17, .04, 20), '#ffffff', xi + .03, 2.15, -1.5, 0, 0, HP); add(G.tor(.17, .025, PI * 2, 6, 20), C.navy, xi + .04, 2.15, -1.5, 0, HP, 0);
    add(G.pbox(.01, .1, .015), C.ink, xi + .065, 2.19, -1.5); add(G.pbox(.01, .015, .08), C.ink, xi + .065, 2.15, -1.47);
    // 입구: 우산꽂이 (우산 셋)
    add(G.cyl(.15, .13, .42, 16), '#9aa3ba', .55, .21, z1 - .3); add(G.tor(.15, .015, PI * 2, 4, 16), '#c9cfe0', .55, .42, z1 - .3, HP, 0, 0);
    for (const [dx, dz, c, r] of [[-.05, 0, '#e8433d', .14], [.05, .04, '#3f6fd8', -.12], [0, -.05, '#ffcf3a', .05]]) { add(G.cyl(.018, .018, .75, 6), C.ink, .55 + dx, .6, z1 - .3 + dz, 0, 0, r); add(G.cone(.07, .5, 8), c, .55 + dx - r * .3, .55, z1 - .3 + dz, 0, 0, r + PI); }
    // 보도 위 A자 입간판 '순찰 중'
    for (const s of [-1, 1]) add(G.box(.5, .7, .03, .015), '#ffffff', .3, .37, z1 + .75 + s * .1, -s * .14, 0, 0);
    add(G.box(.52, .04, .26, .01), C.navy, .3, .72, z1 + .75);
  }));
  // 흰 타일 겉면 · 바닥 타일 · 간판 · 등 · 창구 글자 · 포스터 · 입간판
  const tileMat = (key, len, hgt) => mat('#ffffff', { map: wallTex(key, len, hgt), rough: .6, rim: .12 });
  const backLen = tx - x0 - .02, sideLen = z1 - z0 - RW - .05, tileH = H - .42;
  f.add(put(mesh(new THREE.PlaneGeometry(backLen, tileH), tileMat('back', backLen, tileH), { cast: false }), (x0 + tx) / 2, .14 + tileH / 2, zi + .005));
  f.add(put(mesh(new THREE.PlaneGeometry(sideLen, tileH), tileMat('side', sideLen, tileH), { cast: false }), xi + .005, .14 + tileH / 2, z0 + .02 + sideLen / 2, 0, HP, 0));
  f.add(put(mesh(new THREE.PlaneGeometry(backLen, tileH), tileMat('back', backLen, tileH), { cast: false }), (x0 + tx) / 2, .14 + tileH / 2, z0 - .005, 0, PI, 0));
  f.add(put(mesh(new THREE.PlaneGeometry(sideLen, tileH), tileMat('side', sideLen, tileH), { cast: false }), x0 - .005, .14 + tileH / 2, z0 + .02 + sideLen / 2, 0, -HP, 0));
  f.add(flat(rect(xi, zi, x1, z1), mat('#ffffff', { map: inTileTex(), rough: .6, rim: .1 }), .0175));
  f.add(put(decal(3.25, .7, signTex()), -2.05, H + .87, z0 + .356));
  f.add(put(decal(.38, .21, small('lamp', 256, 112, '#4d86ef', '#ffffff', '경찰', 40)), x0 + .09, 2.02, z1 + .166));
  { const a = PI * .27, [px, pz] = onTower(a, .035); f.add(put(decal(.56, .28, small('l112', 256, 128, '#ffffff', C.red, '112', 64)), px, LY, pz, 0, HP - a, 0)); }
  f.add(put(decal(.74, .17, small('desk', 320, 80, '#ffffff', C.navy, '민원 창구', 30, C.blue)), -3.08, 1.55, cz - .058));
  { const gl = mesh(new THREE.PlaneGeometry(cw - .06, .46), mat('#cfe8ff', { opacity: .35, rough: .1, rim: .05 }), { cast: false }); put(gl, ccx, 1.17, cz - .08); f.add(gl); }
  f.add(put(decal(.7, .15, small('lost', 320, 70, C.yel, C.navy, '분실물 보관함', 26)), scx, sh + .2, zi + .012));
  // 유리: 앞 고정 한 짝 · 열린 문 한 짝 · 오른쪽 옆판 (옅은 하늘빛 투명)
  const glass = (w, h) => mesh(new THREE.PlaneGeometry(w, h), mat('#d8f0ff', { opacity: .28, rough: .05, rim: .05, side: THREE.DoubleSide }), { cast: false });
  const gh = sh - .2, gy = (sh + .14) / 2;
  f.add(put(glass(sw / 2 - .04, gh), sx0 + sw * .25, gy, zi + sd - .01));
  { const dr = glass(sw / 2 - .04, gh); dr.position.set(-(sw / 2 - .04) / 2, 0, 0); const hinge = put(new THREE.Group(), sx0 + sw - .02, gy, zi + sd - .01, 0, 1.05, 0); hinge.add(dr); f.add(hinge);
    hinge.add(put(mesh(new THREE.BoxGeometry(.02, gh, .02), mat(C.steel), { cast: false }), -(sw / 2 - .04), 0, 0)); }
  f.add(put(glass(sd - .04, gh), sx0 + sw - .01, gy, sz, 0, HP, 0));
  f.add(put(decal(.1, .066, small('ticket', 96, 64, '#ffffff', C.navy, '번호표', 11)), cx0 + .2, 1.06, cz + .196));
  // 포스터: 뒷벽 안 (책상 위 오른쪽) · 왼벽 안 · 탑 겉 (카메라 쪽) · 바깥 뒷벽
  f.add(put(decal(.3, .4, P_LOST()), .06, 1.6, zi + .012, 0, 0, .03));
  f.add(put(decal(.36, .48, P_KIDS()), xi + .012, 1.6, -1.5, 0, HP, -.02));
  { const a = PI * .22, [px, pz] = onTower(a, .012); f.add(put(decal(.36, .48, P_112()), px, .78, pz, 0, HP - a, 0)); }
  { const a = PI * .38, [px, pz] = onTower(a, .012); f.add(put(decal(.36, .48, P_BIKE()), px, .8, pz, 0, HP - a, .04)); }
  f.add(put(decal(.36, .48, P_112()), -2.5, 1.45, z0 - .012, 0, PI, 0));
  for (const s of [-1, 1]) f.add(put(decal(.42, .5, small('patrol', 200, 240, '#ffffff', C.navy, '잠깐 순찰 중이에요', 34, C.blue)), .3, .4, z1 + .75 + s * .118, -s * .14, s > 0 ? 0 : PI, 0));
  f.add(put(decal(.26, .15, small('pbox', 160, 96, C.yel, C.navy, '순찰함', 24)), x0 + .09, 1.29, z1 + .176));
  f.add(mc('pbox', ({ add }) => { add(G.box(.3, .36, .16, .03), C.yel, x0 + .09, 1.3, z1 + .09); add(G.box(.32, .05, .18, .015), C.navy, x0 + .09, 1.5, z1 + .09); }));
  // 숨김 자리: 분실물 칸 · 창구 · 우산꽂이 · 입간판 · 둥근 탑 옆 · 실외기 뒤
  f.spot('on', null, sx0 + .6, SHELF[0] + .015, sz + .04, { maxH: .36, label: '분실물 유리장 가운데 칸', scale: .85 });
  f.spot('on', null, sx0 + .98, SHELF[1] + .015, sz + .04, { maxH: .36, label: '분실물 유리장 모자 옆', scale: .85 });
  f.spot('on', null, sx0 + .6, .17, sz + .04, { maxH: .36, label: '분실물 유리장 아래 칸', scale: .85 });
  f.spot('on', null, ccx - .45, .92, cz + .1, { maxH: .22, label: '민원 창구 위', scale: .8 });
  f.spot('behind', null, cx1 + .3, .02, cz + .12, { maxH: .22, label: '택배 상자 옆', scale: .8 });
  f.spot('behind', null, .82, .02, z1 - .25, { maxH: .3, label: '우산꽂이 옆', scale: .85 });
  f.spot('under', null, .3, .02, z1 + .75, { maxH: .3, label: '입간판 밑', scale: .85 });
  f.spot('behind', null, tx + .62, .02, tz + .62, { maxH: .3, label: '둥근 탑 옆', scale: .85 });
  // 걷기 벽: 두 벽 · 탑 · 창구 · 분실물 선반 · 우산꽂이 · 입간판 (방 좌표 그대로)
  f.walkBoxes = [
    [x0, 0, z0, tx, H, zi], [x0, 0, z0, xi, H, z1],
    [tx - tr * .78, 0, tz - tr * .78, tx + tr * .78, TH, tz + tr * .78],
    [cx0 - .05, 0, cz - .3, cx1 + .05, 1.4, cz + .3], [sx0, 0, zi, sx0 + sw, sh, zi + sd],
    [.38, 0, z1 - .47, .72, .9, z1 - .13], [.04, 0, z1 + .55, .56, .75, z1 + .95],
  ];
};

// ── 신호등 (횡단보도 오른쪽 보도): 기둥 · 차도 위로 뻗은 팔에 가로 신호등(빨강 켜짐) · 보행 신호등(빨간 사람 켜짐) · 누름 버튼 ────
const walkerTex = (key, color, on, walking) => TEX.get('pf3|walker|' + key, () => canvasTex(128, 128, (c, w, h) => {
  c.fillStyle = '#26232f'; c.fillRect(0, 0, w, h);
  c.fillStyle = on ? color : 'rgba(255,255,255,.12)';
  c.beginPath(); c.arc(64, 26, 12, 0, PI * 2); c.fill();
  c.lineCap = 'round'; c.strokeStyle = c.fillStyle; c.lineWidth = 16;
  c.beginPath(); c.moveTo(64, 46); c.lineTo(64, 80); c.stroke();
  c.lineWidth = 11; c.beginPath();
  if (walking) { c.moveTo(64, 80); c.lineTo(48, 112); c.moveTo(64, 80); c.lineTo(82, 110); c.moveTo(64, 52); c.lineTo(44, 74); c.moveTo(64, 52); c.lineTo(84, 70); }
  else { c.moveTo(58, 80); c.lineTo(56, 114); c.moveTo(70, 80); c.lineTo(72, 114); c.moveTo(58, 52); c.lineTo(50, 82); c.moveTo(70, 52); c.lineTo(78, 82); }
  c.stroke();
}));
B.pf3_signal = f => {
  const PH = 2.75, ARM = 1.45;
  f.noSolid = true;
  f.add(mc('signal-v1', ({ add, tube }) => {
    add(G.cyl(.16, .18, .06, 16), '#9aa3ba', 0, .03, 0);
    add(G.cyl(.055, .065, PH, 14), '#7d8599', 0, PH / 2, 0);
    for (const y of [.5, 1.5]) add(G.cyl(.07, .07, .05, 14), '#ffcf3a', 0, y, 0);
    // 팔과 가로 신호등 (차도 쪽 +z, 얼굴은 +x)
    tube([0, PH - .1, 0], [0, PH - .1, ARM], .04, '#7d8599', 10); tube([0, PH - .55, .05], [0, PH - .12, .7], .025, '#7d8599', 8);
    add(G.box(.2, .26, .78, .05), '#3a3550', 0, PH - .1, ARM);
    for (const [k, c] of [[0, '#ff4d42'], [1, '#6b5a2a'], [2, '#244a33']]) {
      const z = ARM - .24 + k * .24;
      add(G.cyl(.085, .085, .02, 18), c, .105, PH - .1, z, 0, 0, HP);
      add(G.cyl(.1, .1, .12, 18, true), '#26232f', .16, PH - .02, z, 0, 0, HP, [1, 1, 1]);
    }
    // 보행 신호등 상자 (+z 쪽을 봄) · 누름 버튼
    add(G.box(.32, .58, .2, .04), '#3a3550', 0, 1.95, .14);
    add(G.box(.36, .05, .26, .02), '#26232f', 0, 2.27, .16); add(G.box(.36, .04, .24, .02), '#26232f', 0, 1.96, .17);
    add(G.box(.16, .24, .1, .03), '#ffcf3a', 0, 1.05, .07); add(G.cyl(.04, .04, .03, 14), '#e8433d', 0, 1.08, .13, HP, 0, 0);
  }));
  const face = (t, y) => { const m = mesh(new THREE.PlaneGeometry(.24, .24), mat('#ffffff', { map: t, emissive: '#ffffff', ei: .15 }), { cast: false }); put(m, 0, y, .242); f.add(m); };
  face(walkerTex('red', '#ff4d42', true, false), 2.1); face(walkerTex('green', '#3fd07a', false, true), 1.82);
  f.add(put(decal(.12, .06, small('push', 120, 60, '#ffffff', C.navy, '누르세요', 20)), 0, .98, .121));
  f.walkBoxes = [[-.12, 0, -.12, .12, PH, .12], [-.18, 0, .02, .18, 2.3, .26]];
  f.spot('behind', null, -.25, .02, -.1, { maxH: .3, label: '신호등 기둥 뒤', scale: .85 });
};

// ── 먼 동네 (배경): 다음 판(22판 골목)의 편의점·떡볶이 포장마차·자판기를 섬 뒤 옆 골목에 작게 — 찾을 자리·문은 없는 풍경 ─────────
B.pf3_far = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [-.001, -.2, -.001, .001, -.15, .001];
  f.group.userData.scenery = true;
  const Y = (T.townY ?? -.86) - .02;
  // (동네 배경 gptneighborhood의 옆 골목 x -7.5를 따라 — 그 골목 끝이 22판)
  // (멀리 있는 것처럼 3/4 크기로 — 카메라가 원근이 약해 거리만으로는 작아지지 않음)
  for (const [type, x, z, a] of [['vending', -9.55, -4.7, HP], ['konbini', -9.55, -6.0, HP], ['tteokstall', -9.55, -7.75, HP]]) {
    const k = makeFurniture(type, T); k.group.position.set(x, Y, z); k.group.rotation.y = a; k.group.scale.setScalar(.75);
    k.group.traverse(o => { if (o.isMesh) { o.castShadow = false; delete o.userData.part; } });
    f.add(k.group);
  }
};

// ── 하얀 단순한 동네 (배경, 공용 동네가 나오기 전까지): 섬 밑바닥 높이의 땅 · 섬의 차도가 양옆으로 이어지는 길 · 22판으로 가는 옆 골목 ·
// 집은 섬 뒤쪽 띠에만(0·L·R 어느 카메라에서도 화면 아래 앞쪽에 집이 오지 않게 — 앞쪽은 낮은 보도·잔디만) ─────────────────────
B.pf3_town = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [-.001, -.2, -.001, .001, -.15, .001];
  f.group.userData.scenery = true;
  const Y = (T.townY ?? -.86) - .02, { curb, curb2 } = ISLE;
  // 땅: 가까이 흰빛, 멀리 하늘빛으로 (꼭짓점 색)
  { const g = new THREE.CircleGeometry(48, 48, 0, PI * 2); g.rotateX(-HP); const pos = g.attributes.position, col = new Float32Array(pos.count * 3), a = new THREE.Color('#f4f5f8'), b = new THREE.Color('#e3ebf3'), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { const r = Math.hypot(pos.getX(i), pos.getZ(i)), t = Math.min(1, Math.max(0, (r - 12) / 26)); c.copy(a).lerp(b, t * t * (3 - 2 * t)); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = mat('#ffffff', { rim: 0 }).clone(); m.vertexColors = true;
    const gm = new THREE.Mesh(g, m); gm.position.y = Y - .01; gm.receiveShadow = true; gm.renderOrder = -2; f.add(gm); }
  f.add(mc('town-v1', ({ add }) => {
    // 섬의 차도가 양옆으로 이어지는 길 (+ 양쪽 보도) · 22판으로 가는 옆 골목 x -7.5
    for (const [x0, x1] of [[-46, -5.6], [5.6, 46]]) { const L = x1 - x0, cx = (x0 + x1) / 2;
      add(G.pbox(L, .02, curb2 - curb), '#d5d7df', cx, Y + .01, (curb + curb2) / 2);
      for (const z of [curb - .55, curb2 + .55]) add(G.pbox(L, .04, 1.1), '#eceef2', cx, Y + .02, z);
      for (let x = x0 + 1; x < x1 - 1; x += 3) add(G.pbox(1.4, .006, .07), '#f7f1d6', x + .7, Y + .022, (curb + curb2) / 2); }
    add(G.pbox(2.3, .02, 40), '#d5d7df', -7.5, Y + .01, curb - 20.6);
    for (const x of [-8.95, -6.05]) add(G.pbox(.6, .04, 40), '#eceef2', x, Y + .02, curb - 20.6);
    // 앞쪽(카메라 쪽)은 낮은 잔디 띠만
    for (const [x, z, w, d] of [[9, -3.5, 5, 2.2], [11, 9, 6, 2.4], [-3, 10.5, 7, 2.2], [-12, 8.5, 4, 2.6], [12.5, -9, 2.6, 5]]) add(G.box(w, .08, d, .03), '#dcebd2', x, Y + .04, z);
    // 집: 흰 벽 · 옅은 지붕 · 작은 창, 섬 뒤 띠에만 (x + z ≤ -11, |x − z| ≤ 6.5)
    const roof = (w, h, d) => { const v = [-w / 2, 0, -d / 2, w / 2, 0, -d / 2, 0, h, -d / 2, -w / 2, 0, d / 2, w / 2, 0, d / 2, 0, h, d / 2], g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex([0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 2, 5, 4, 2, 4, 1, 0, 1, 4, 0, 4, 3]); g.computeVertexNormals(); return g; };
    const RO = ['#c9d3e4', '#d9dee8', '#b9c6dc', '#e3d9d6', '#cdd6e6', '#d6dbe4', '#c3cfe3'];
    [[-4.1, -9.2, 3.4, 2.9, 2.2, .1], [-5.6, -11.6, 3.8, 3.2, 2.6, -.05], [-11.8, -10.2, 3.6, 3.4, 2.3, .08], [-9.4, -15.2, 4.2, 3.4, 2.8, -.1],
     [-15.4, -9.6, 3.6, 3.0, 2.1, .06], [-14.2, -15.8, 4.4, 3.6, 2.5, 0], [-2.4, -14.6, 3.8, 3.2, 2.4, .12]].forEach(([x, z, w, d, h, ry], i) => {
      add(G.box(w, h, d, .04), i % 2 ? '#f8f9fb' : '#ffffff', x, Y + h / 2, z, 0, ry, 0);
      add(roof(w + .4, .85, d + .36), RO[i % RO.length], x, Y + h, z, 0, ry, 0);
      for (const u of [-w * .25, w * .25]) { const c = Math.cos(ry), sn = Math.sin(ry); add(G.box(.5, .55, .04, .01), '#cfe2f2', x + u * c + (d / 2 + .02) * sn, Y + h * .58, z - u * sn + (d / 2 + .02) * c, 0, ry, 0); }
    });
    // 나무 몇 그루 (뒤 띠)
    for (const [x, z, sc] of [[-6.8, -8.6, .9], [-1.2, -11.2, .8], [-12.6, -6.6, .95], [-17.2, -12.4, 1.1], [-7.4, -18.4, 1]]) {
      add(G.cyl(.1 * sc, .14 * sc, 1.2 * sc, 6), '#b48a62', x, Y + .6 * sc, z); add(G.sph(.75 * sc, 8, 6), '#bfe0b0', x, Y + 1.6 * sc, z); add(G.sph(.5 * sc, 8, 6), '#d3eac6', x + .15, Y + 2.05 * sc, z - .1);
    }
  }));
};

// ── 건너편 보도의 비둘기 둘 (10/24 사용자 "비둘기 제대로 만들고 애니메이션도"): 공용 새 birds.js — 회청색 하나는 보도를 오가고,
// 흰 얼룩 하나는 제자리에서 쪼고 두리번 (벤치 옆 비둘기는 벤치 조각 몫) ────────────────────────────────────────────────
B.pf3_pigeons = f => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [-.001, -.2, -.001, .001, -.15, .001];
  addPigeon(f, -.95, .012, 5.3, .1, { tone: 'grey', range: .26, s: 1.1, seed: 3 });
  addPigeon(f, -.3, .012, 5.42, PI - .35, { tone: 'pied', range: .08, s: 1.05, seed: 8 });
};

export const PF3_BUILDERS = B;
export const PF3_INFO = {
  pf3_base: { w: .1, d: .1, name: '파출소 앞 둥근 섬', price: 0, hidden: true, floor: true },
  pf3_station: { w: .1, d: .1, name: '몽글 파출소', price: 0, hidden: true, floor: true },
  pf3_signal: { w: .4, d: .4, name: '신호등', price: 0, hidden: true },
  pf3_pigeons: { w: .1, d: .1, name: '파출소 앞 비둘기', price: 0, hidden: true, floor: true },
  pf3_far: { w: .1, d: .1, name: '이어지는 동네 (22판 골목)', price: 0, hidden: true, floor: true },
  pf3_town: { w: .1, d: .1, name: '하얀 동네 (배경)', price: 0, hidden: true, floor: true },
};

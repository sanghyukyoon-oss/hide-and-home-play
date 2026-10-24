// 22판 우리 동네 골목 3 street3 (⑦ 10/23, 사용자 1~70 검토 메모 "정리만: 도로·인도 단차, 도로를 벽으로 막지 않기, 디테일 조금, 도로 방향,
// 인도·도로 사이 턱, 정지 표지·반사경 배치 정리, 버스 정류장이 인도 한복판 → 정리"): 옛 22판(street)과 같은 골목 모퉁이를 둥근 섬으로 자른
// 디오라마. 방(걷는 곳) = 인도 6 × 5, 담은 그 뒤(북·서)에만. 차도는 방 밖에서 화강암 연석 한 단(14 cm) 아래로 섬 끝까지 그대로 흐름 —
// 앞 큰길(동서)과 오른쪽 골목길(남북)이 T자로 만나고, 건너편 인도 한 줄과 연석이 길을 마무리(담 X). 큰길 건널목 자리는 연석을 낮추고
// 점자 블록. 골목길 끝에 정지선 · '천천히'. 이 조각은 바탕만(걷기 막지 않음) — 가게·표지판·정류장은 정본 가구 그대로 redo7/s22.js가 놓음.
import * as THREE from 'three';
import { mat, mesh, put, canvasTex, texCache, roundRect } from './kit.js';
import { HG as G, hmc as rawMc } from './house-props.js';
import { groundTex } from './outdoor.js';
import { fitText, textTex } from './gpt-paper.js';

const PI = Math.PI, HP = PI / 2;
const mc = (key, fn) => rawMc('st3|' + key, fn);
const TEX = texCache();
// 섬(둥근 네모)과 길: 방 x -3 ~ 3, z -2.5 ~ 2.5 (인도) · 앞 차도 z 2.5 ~ 4.4 · 오른쪽 차도 x 3 ~ 4.9 · 건너편 인도 그 바깥
export const ST3 = { x0: -3.3, x1: 5.75, z0: -2.95, z1: 5.25, r: 1.05, ry: -.14, sx: 3, sz: 2.5, rx: 4.9, rz: 4.4 };
const CROSS = [-1.9, -.5];   // 큰길 건널목 x 범위 (정류장 왼쪽, 연석 낮춤 + 점자 블록)
const C = { stone: '#d2cbc0', stone2: '#bdb5a9', earth: '#b98f68', earth2: '#9c7553', curb: '#eeeae2', curbSide: '#dcd6cb',
  asph: '#8f8899', line: '#fdfbf4', yel: '#f6c94a', grass: '#8fca66', grass2: '#72b450', bark: '#9a7353', iron: '#5d5a6e' };

function outline(grow = 0) {
  const { x0, x1, z0, z1, r } = ST3, A = x0 - grow, Bx = x1 + grow, Az = z0 - grow, Bz = z1 + grow, out = [];
  const arc = (cx, cz, a0) => { for (let k = 0; k <= 10; k++) { const a = a0 + HP * k / 10; out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  arc(Bx - r, Az + r, -HP); arc(Bx - r, Bz - r, 0); arc(A + r, Bz - r, HP); arc(A + r, Az + r, PI);
  return out;
}
// a convex polygon cut to a box (Sutherland–Hodgman, four half-planes)
function clip(poly, xa, xb, za, zb) {
  const cut = (P, inside, at) => { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = inside(a), ib = inside(b);
    if (ia) out.push(a); if (ia !== ib) out.push(at(a, b)); } return out; };
  const lx = c => (a, b) => { const t = (c - a[0]) / (b[0] - a[0]); return [c, a[1] + (b[1] - a[1]) * t]; };
  const lz = c => (a, b) => { const t = (c - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, c]; };
  let P = cut(poly, p => p[0] >= xa, lx(xa)); P = cut(P, p => p[0] <= xb, lx(xb)); P = cut(P, p => p[1] >= za, lz(za)); return cut(P, p => p[1] <= zb, lz(zb));
}
const shapeOf = pts => { const s = new THREE.Shape(); s.moveTo(pts[0][0], -pts[0][1]); for (const p of pts.slice(1)) s.lineTo(p[0], -p[1]); return s; };
const flat = (pts, m, y) => { const o = mesh(new THREE.ShapeGeometry(shapeOf(pts)), m, { cast: false }); o.rotation.x = -HP; o.position.y = y; o.receiveShadow = true; return o; };
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ── 겉면 그림 (월드 좌표 uv: ShapeGeometry의 uv = x, -z 미터) ─────────────────────────────────────────────
const roadTex = () => TEX.get('st3|road', () => canvasTex(1024, 1024, (c, w, h) => {
  // 아스팔트 한 장 = 4 m: 보랏빛 회색, 굵은 알갱이, 땜질 자국 둘, 실금 셋, 가장자리 쪽 옅은 바퀴 자국
  c.fillStyle = C.asph; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 40; k++) { const n = hash(k + 700); c.fillStyle = n < .5 ? 'rgba(255,255,255,.035)' : 'rgba(30,24,50,.05)'; c.beginPath(); c.ellipse(hash(k + 701) * w, hash(k + 702) * h, 30 + n * 70, 20 + n * 50, n * 3, 0, PI * 2); c.fill(); }
  for (let k = 0; k < 6000; k++) { const n = hash(k); c.fillStyle = n < .5 ? 'rgba(48,42,70,.17)' : n < .82 ? 'rgba(255,255,255,.1)' : 'rgba(36,30,56,.24)'; c.fillRect(hash(k + 1) * w, hash(k + 2) * h, 1.5 + hash(k + 4) * 3, 1.5 + hash(k + 5) * 2); }
  c.fillStyle = 'rgba(78,72,98,.32)'; roundRect(c, 140, 610, 220, 140, 10); c.fill(); roundRect(c, 700, 160, 150, 240, 10); c.fill();
  c.strokeStyle = 'rgba(56,50,78,.5)'; c.lineWidth = 2.5; c.lineCap = 'round';
  for (const [x, y, s] of [[430, 300, 1], [190, 880, -1], [830, 740, 1]]) { c.beginPath(); c.moveTo(x, y); for (let k = 1; k < 7; k++) c.lineTo(x + k * 22 * s + (k % 2 ? 8 : -6), y + k * 14 + (k % 3) * 6); c.stroke(); }
}, { repeat: [.25, .25] }));
const curbTex = () => TEX.get('st3|curb', () => canvasTex(256, 64, (c, w, h) => {
  // 화강암 연석 옆면: 희끗한 점박이, 위 모서리 밝게, 블록 끝 줄눈
  c.fillStyle = C.curbSide; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 420; k++) { const n = hash(k + 50); c.fillStyle = n < .5 ? 'rgba(120,112,104,.26)' : n < .8 ? 'rgba(84,78,90,.2)' : 'rgba(255,255,255,.6)'; c.fillRect(hash(k + 51) * w, hash(k + 52) * h, 2, 2); }
  c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(0, 0, w, 5); c.fillStyle = 'rgba(96,88,90,.45)'; c.fillRect(w - 3, 0, 3, h);
}));
const manholeTex = () => TEX.get('st3|manhole', () => canvasTex(256, 256, (c, w, h) => {
  // 차도 맨홀: 둥근 쇠 뚜껑, 테 둘, 바큇살 무늬, 가운데 '하수'
  c.fillStyle = '#625e74'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 2, 0, PI * 2); c.fill();
  c.strokeStyle = '#4c485e'; c.lineWidth = 10; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 12, 0, PI * 2); c.stroke();
  c.lineWidth = 5; for (const r of [70, 40]) { c.beginPath(); c.arc(w / 2, h / 2, r, 0, PI * 2); c.stroke(); }
  for (let k = 0; k < 12; k++) { const a = k * PI / 6; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * 40, h / 2 + Math.sin(a) * 40); c.lineTo(w / 2 + Math.cos(a) * 104, h / 2 + Math.sin(a) * 104); c.stroke(); }
  c.fillStyle = '#7d798f'; c.font = '800 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('하수', w / 2, h / 2);
}));
const paintTex = (key, text, px = 64) => TEX.get('st3|paint|' + key, () => textTex(512, 160, (c, w, h) => {
  fitText(c, text, w / 2, h / 2 + 2, w * .92, px, 'rgba(255,255,255,.94)', { weight: '800' });
}));
const decal = (w, h, t) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: t, transparent: true, opacity: .96, rough: .8 }), { cast: false });

const B = {};

// ── 바탕: 둥근 섬 — 인도(방 바닥 높이) · 화강암 연석 한 단 · 차도 둘(T자) · 건너편 인도 · 돌 켜와 흙 켜 받침 ──────────
B.st3_base = (f, T) => {
  const { x1, z0, z1, ry, sx, sz, rx, rz } = ST3, O = outline();
  const near = clip(O, -99, sx, -99, sz);                         // 이쪽 인도(방 + 담 뒤 띠)
  const front = clip(O, -99, 99, sz, rz), side = clip(O, sx, rx, -99, sz);   // 차도: 앞 큰길 · 오른쪽 골목길
  const farF = clip(O, -99, 99, rz, 99), farS = clip(O, rx, 99, -99, sz);    // 건너편 인도
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.8, 0, .01, -.75, .01];
  const midF = (sz + rz) / 2, Y = ry + .012, tx = 2.3, tz = rz + .44;
  f.add(mc('base', ({ add }) => {
    // 받침: 차도 높이까지 돌 켜, 그 아래 흙 켜 (두께 있는 둥근 블록); 인도 판은 연석 높이만큼 위로
    add(G.ext(shapeOf(O), .34, 0, 10), C.stone, 0, ry - .34, 0, -HP, 0, 0);
    add(G.ext(shapeOf(outline(-.06)), .36, .04, 10), C.earth, 0, ry - .72, 0, -HP, 0, 0);
    for (const P of [near, farF, farS]) add(G.ext(shapeOf(P), -ry - .004, 0, 10), C.stone2, 0, ry, 0, -HP, 0, 0);
    // 돌 켜 줄눈 · 흙 속 자갈 (카메라 쪽 앞·오른쪽 면)
    for (let x = -2.2; x <= 4.6; x += .55) add(G.pbox(.02, .3, .02), shade2(C.stone, -.1), x, ry - .17, z1 + .006);
    for (let z = -1.85; z <= 4.1; z += .55) add(G.pbox(.02, .3, .02), shade2(C.stone, -.1), x1 + .006, ry - .17, z);
    add(G.pbox(6.9, .02, .02), shade2(C.stone, -.1), 1.22, ry - .1, z1 + .006); add(G.pbox(.02, .02, 6.1, .004), shade2(C.stone, -.1), x1 + .006, ry - .1, 1.15);
    for (const [x, z] of [[-1.9, z1 - .03], [.4, z1 - .03], [2.9, z1 - .03], [x1 - .03, 3.3], [x1 - .03, .9], [x1 - .03, -1.6]]) add(G.sph(.07, 8, 6), C.earth2, x, ry - .52, z, 0, 0, 0, [1.4, .8, 1]);
    // 연석 윗돌: 이쪽 인도의 동·남 모서리, 건너편 인도 둘 (건널목 자리는 낮춤)
    const K = .15;
    add(G.box(K, .03, sz - z0 + .02, .01), C.curb, sx - K / 2, .006, (z0 + sz) / 2);                          // 골목길 쪽
    for (const [a, b] of [[-3.3, CROSS[0]], [CROSS[1], sx]]) add(G.box(b - a, .03, K, .01), C.curb, (a + b) / 2, .006, sz - K / 2);   // 큰길 쪽
    for (const [a, b] of [[-3.3, CROSS[0]], [CROSS[1], x1 - .05]]) add(G.box(b - a, .03, K, .01), C.curb, (a + b) / 2, .006, rz + K / 2);
    add(G.box(K, .03, sz - z0 + .02, .01), C.curb, rx + K / 2, .006, (z0 + sz) / 2);
    add(G.box(x1 - .05 - rx + K, .03, K, .01), C.curb, (rx + x1 - .05) / 2, .006, sz - K / 2);
    // 모퉁이 연석: 둥글게 돈 돌 하나 (이쪽 · 건너편)
    add(G.cyl(K * .9, K * .9, .03, 12), C.curb, sx - K / 2, .006, sz - K / 2); add(G.cyl(K * .9, K * .9, .03, 12), C.curb, rx + K / 2, .006, sz - K / 2);
    // 건널목: 연석 낮춘 경사로(양쪽) · 노란 점자 블록
    for (const [z, s] of [[sz, 1], [rz, -1]]) {
      const L = .36, a = Math.atan2(-ry, L);
      add(G.pbox(CROSS[1] - CROSS[0], .03, Math.hypot(L, ry)), '#d8d1c6', (CROSS[0] + CROSS[1]) / 2, ry / 2 - .008, z - s * L / 2, -s * a, 0, 0);
      for (const x of CROSS) add(G.pbox(.04, -ry, L), C.curbSide, x, ry / 2, z - s * L / 2);
      // (10/24 사용자 "노란 거 떨어져 있다": 점자 블록은 경사로 윗단에 바로 붙여, 바닥에 반쯤 묻히게)
      const tz = z - s * (L + .13);
      add(G.box(CROSS[1] - CROSS[0] - .1, .012, .26, .006), C.yel, (CROSS[0] + CROSS[1]) / 2, .004, tz);
      for (let x = CROSS[0] + .14; x < CROSS[1] - .09; x += .11) for (const dz of [-.06, .06]) add(G.cyl(.02, .024, .012, 6), '#e2b237', x, .014, tz + dz);
    }
    // 큰길 노면: 가운데 노란 두 줄(건널목에서 끊김) · 건널목 흰 띠(차 흐름과 나란히) · 정지선 · 길가 흰 줄
    for (const dz of [-.055, .055]) for (const [a, b] of [[ST3.x0 + .03, CROSS[0] - .5], [CROSS[1] + .5, x1 - .03]]) add(G.pbox(b - a, .006, .06), C.yel, (a + b) / 2, Y, midF + dz);
    for (let z = sz + .32; z < rz - .25; z += .38) add(G.pbox(CROSS[1] - CROSS[0] - .1, .006, .2), C.line, (CROSS[0] + CROSS[1]) / 2, Y + .001, z);
    add(G.pbox(.09, .006, midF - sz - .1), C.line, CROSS[1] + .38, Y, (sz + midF) / 2);
    add(G.pbox(.09, .006, rz - midF - .1), C.line, CROSS[0] - .38, Y, (midF + rz) / 2);
    // 골목길: 큰길 앞 정지선(남쪽으로 오는 쪽 반) · 길 가운데 점선 없음(좁은 골목)
    add(G.pbox((rx - sx) / 2 + .05, .006, .14, .004), C.line, sx + (rx - sx) / 4 + .02, Y, sz - .55);
    // 빗물받이 (연석 아래, 쇠살)
    for (const [x, z, a] of [[-2.55, sz + .17, 0], [sx + .17, -1.55, HP], [4.0, rz - .17, 0]]) {
      add(G.box(.58, .012, .24, .008), '#6a6578', x, ry + .008, z, 0, a, 0);
      for (let k = 0; k < 6; k++) { const u = -.22 + k * .088; add(G.pbox(.034, .014, .18), '#433f54', x + Math.cos(a) * u, ry + .012, z - Math.sin(a) * u, 0, a, 0); }
    }
    // 건너편 인도 (앞): 가로수 한 그루 + 쇠살 받침 · 낮은 회양목 화단 · 볼라드 둘 · 전신주 받침 돌
    add(G.box(.62, .02, .44, .01), '#857f90', tx, .012, tz); for (let k = 0; k < 5; k++) add(G.pbox(.012, .024, .4), C.iron, tx - .24 + k * .12, .02, tz);
    add(G.cyl(.06, .085, 1.35, 10), C.bark, tx, .68, tz);
    for (const [dx, dy, dz, s, c] of [[0, 1.6, 0, .44, C.grass2], [-.25, 1.42, .05, .32, C.grass], [.26, 1.46, -.04, .33, C.grass], [.04, 1.84, .02, .31, C.grass], [-.1, 1.5, .26, .28, C.grass2]]) add(G.sph(s, 12, 9), c, tx + dx, dy, tz + dz, 0, 0, 0, [1, .86, .92]);
    for (let x = -2.9; x < -.9; x += .34) add(G.sph(.19, 10, 8), x % .68 < .34 ? C.grass2 : C.grass, x + .1, .19, rz + .45, 0, 0, 0, [1.1, .85, 1]);
    add(G.box(2.1, .16, .46, .04), '#c9b9a4', -1.85, .08, rz + .45);
    for (const x of [CROSS[0] - .22, CROSS[1] + .22]) { add(G.cyl(.065, .075, .48, 12), '#6b6680', x, .24, rz + .25); add(G.cyl(.07, .07, .05, 12), C.yel, x, .38, rz + .25); add(G.sph(.066, 10, 6), '#6b6680', x, .48, rz + .25, 0, 0, 0, [1, .5, 1]); }
    // 건너편 인도 (오른쪽): 낮은 담장 토막과 화분 둘, 쓰레기 봉투 하나
    add(G.box(.18, .5, 2.2, .04), '#efe2cf', 5.55, .25, -1.2); add(G.box(.24, .06, 2.26, .02), '#c0603f', 5.55, .53, -1.2);
    for (const [z, c] of [[-.05, '#e88a5c'], [.45, '#d9786a']]) { add(G.cyl(.15, .12, .24, 12), c, 5.28, .12, z); add(G.sph(.17, 10, 8), C.grass, 5.28, .32, z, 0, 0, 0, [1, .8, 1]); }
    add(G.sph(.16, 10, 8), '#f4f1ea', 5.22, .14, 1.55, 0, 0, 0, [1, .9, 1]); add(G.cyl(.03, .05, .08, 8), '#f4f1ea', 5.22, .31, 1.55);
    // 섬 가장자리 풀 한 줌 (모서리와 담 밑에만 — 한적하게)
    for (const [x, z, s] of [[-3.15, -2.7, .9], [-3.12, 1.9, .7], [2.6, -2.8, .8], [5.6, -2.55, 1], [5.45, 4.95, .8], [-2.95, 4.95, .75], [.6, -2.78, .6]]) {
      add(G.sph(.2 * s, 10, 8), C.grass, x, .1 * s, z, 0, 0, 0, [1.3, .8, 1.1]);
      add(G.sph(.15 * s, 10, 8), C.grass2, x + .15 * s, .08 * s, z + .08, 0, 0, 0, [1.2, .8, 1]);
    }
  }));
  // 겉면: 보도블록(방 바닥과 같은 그림) · 아스팔트 · 연석 옆면 · 노면 글자
  const pt = groundTex('brickpave', { ...T, tactile: false }).clone(); pt.needsUpdate = true; pt.repeat.set(.2, .2);
  const pm = mat('#ffffff', { map: pt, rough: .75, rim: .1 });
  for (const P of [near, farF, farS]) f.add(flat(P, pm, -.002));
  const rm = mat('#ffffff', { map: roadTex(), rough: .85, rim: .08 });
  f.add(flat(front, rm, ry + .006)); f.add(flat(side, rm, ry + .006));
  const ct = curbTex();
  const face = (x0, x1, z, s) => { for (let x = x0; x < x1 - .02; x += .8) { const L = Math.min(.8, x1 - x) - .012; const fm = mesh(new THREE.PlaneGeometry(L, -ry + .03), mat('#ffffff', { map: ct, rough: .7, rim: .1 }), { cast: false }); put(fm, x + L / 2, ry / 2 + .008, z + s * .002, 0, s > 0 ? 0 : PI, 0); f.add(fm); } };
  const faceX = (z0_, z1_, x, s) => { for (let z = z0_; z < z1_ - .02; z += .8) { const L = Math.min(.8, z1_ - z) - .012; const fm = mesh(new THREE.PlaneGeometry(L, -ry + .03), mat('#ffffff', { map: ct, rough: .7, rim: .1 }), { cast: false }); put(fm, x + s * .002, ry / 2 + .008, z + L / 2, 0, s > 0 ? HP : -HP, 0); f.add(fm); } };
  face(-3.3, CROSS[0], sz, 1); face(CROSS[1], sx, sz, 1);           // 이쪽 인도 → 큰길
  faceX(z0, sz, sx, 1);                                             // 이쪽 인도 → 골목길
  face(-3.3, CROSS[0], rz, -1); face(CROSS[1], x1 - .05, rz, -1);         // 건너편 인도 → 큰길
  faceX(z0, sz, rx, -1); face(rx, x1 - .05, sz, 1);                      // 건너편(오른쪽) 인도 → 골목길 · 큰길
  f.add(put(decal(1.3, .4, paintTex('slow', '천천히', 72)), (sx + rx) / 2, ry + .014, -.95, -HP, 0, 0));
  { const m = mesh(new THREE.CircleGeometry(.3, 28), mat('#ffffff', { map: manholeTex(), rough: .6 }), { cast: false }); put(m, .9, ry + .013, midF + .5, -HP, 0, 0); f.add(m); }
  f.group.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  // 숨김 자리 둘 (걷는 곳이 아닌 길가: 물건이 놓일 수 있는 작은 틈)
  f.spot('behind', null, -2.55, ry + .02, sz + .4, { maxH: .2, label: '빗물받이 옆', scale: .8 });
  f.spot('behind', null, tx + .36, .018, tz + .06, { maxH: .3, label: '가로수 밑', scale: .85 });
};
const shade2 = (hex, k) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };

export const ST3_BUILDERS = B;
export const ST3_INFO = { st3_base: { w: .1, d: .1, name: '골목 길바닥', price: 0, hidden: true, floor: true } };

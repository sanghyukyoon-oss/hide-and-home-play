// 19판 곰돌이네 119 안전센터 3 — firestation3 (① 10/23, 사용자 "19도 마찬가지 — 새로 디테일 있게"). 레퍼(ref18-garage·camper·burgershop)의 결:
// 소방서 모양 그대로 자른 단면 + 둥근 작은 섬 + 거대 소품이 건물의 일부.
//   fs3_island — 둥근 섬 받침(두께 있는 흙·연석 띠), 앞 보도(분홍 보도블록), 차고 앞 콘크리트 진입로(노란 선·맨홀), 잔디 자리 셋·덤불
//   fs3_house  — 왼쪽은 아치 지붕 차고(아치 테·부채창·반쯤 내려온 셔터·큰 119 간판), 오른쪽은 박공 2층 당직실 탑
//                (2층 마루·침대·책상·옷 선반·빨랫줄, 아래층은 장비 칸 — 정본 장비 걸이·사물함 자리), 계단, 미끄럼 기둥(곰돌이 장식 없음),
//                지붕 꼭대기 거대 사이렌, 오른쪽 벽에 매단 거대 호스 릴
// 소방 빨강은 크게 두 곳만(소방차, 사이렌) — 벽은 크림 회벽, 테두리는 순한 벽돌, 지붕은 흐린 남청.
// 숨김 자리(f.spot)·움직이는 부품(f.part: 0 셔터, 1 사이렌, 2 당직실 이불)은 정본 엔진 그대로. 좌표는 방 좌표(조각을 방 가운데에 둠).
import * as THREE from 'three';
import { addI18n } from '../i18n.js';
import { put, grp, mat, mesh, geo, texCache, roundRect, canvasTex } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';
import { Char } from './chars.js';
import { clothBend } from './clothbend.js';

const WORDS = { '소방차 전용': 'Fire engines only', '주정차 금지': 'No parking', '근무표': 'Duty Roster', '안전센터': 'Fire Station', '곰돌이네': "Bear's", '당직실': 'Duty Room', '출동 준비!': 'Ready to roll!', '불조심': 'Fire Safety' };
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

const PI = Math.PI, HP = PI / 2;
const P = {
  plaster: '#fbf3e6', plasterD: '#efe1cd', brick: '#eaa58a', brickD: '#d48a6e', stone: '#f1e7d8',
  roof: '#5f86a3', roofL: '#7fa3bd', roofD: '#4b6d88', wood: '#e6b47e', woodD: '#b57f50', woodL: '#f0cfa2',
  red: '#e8493f', redD: '#b9362f', cream: '#fff6e6', steel: '#cbd1d9', steelD: '#9aa3ae', brass: '#ebb84e', brassD: '#c89232',
  glass: '#c3e5f3', glassD: '#a2cde0', navy: '#4a5878', yellow: '#ffd04a', ink: '#5a4434',
  paving: '#ece5d9', pavingJ: '#d9cfc1', kerb: '#f6f1e8', earth: '#d3a47a', earthD: '#b0805a', drive: '#dedad2', driveJ: '#c9c4ba',
  walk: '#efcfc0', walkJ: '#ddb5a3', grass: '#b9dc92', grassD: '#94c472', leaf: '#86c46b', leafD: '#5fa45a', blue: '#8fb8dc', pink: '#f4a6b8',
};
const B = {}, TEX = texCache();
// (textTex draws at 2x: .5 back so every drawing below is in its canvas's own w × h units)
const tex = (key, w, h, draw) => TEX.get('fs3|' + key, () => textTex(w, h, c => { c.scale(.5, .5); draw(c, w, h); }));
const decal = (w, h, t) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: t }), { cast: false });

// ── textures (UV in metres; a texture is one tile of TILE metres, repeating) — 사용자 10/23 "텍스처 많이(나무결·타일·아스팔트·천·포스터)"
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const shadeHex = (hex, k) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };
const jit = (hex, a) => shadeHex(hex, (rnd() - .5) * a);
const specks = (c, W, H, n, cols, s = 2) => { for (let i = 0; i < n; i++) { c.fillStyle = cols[i % cols.length]; c.fillRect(rnd() * W, rnd() * H, s * (.5 + rnd()), s * (.5 + rnd())); } };
const crack = (c, W, H, n, col) => { c.strokeStyle = col; c.lineWidth = 1.2; for (let i = 0; i < n; i++) { let x = rnd() * W, y = rnd() * H; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (rnd() - .5) * 26; y += (rnd() - .5) * 26; c.lineTo(x, y); } c.stroke(); } };
const blot = (c, W, H, n, col, r0 = 20, r1 = 60) => { for (let i = 0; i < n; i++) { const x = rnd() * W, y = rnd() * H, r = r0 + rnd() * (r1 - r0), g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); } };
const TILES = {
  // plaza: 50 cm stone squares, each a touch different, worn joints
  stone: [2, 512, c => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = jit('#ece4d6', .05); c.fillRect(i * 128, j * 128, 128, 128); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(i * 128 + 8, j * 128 + 8, 50, 4); }
    specks(c, 512, 512, 1600, ['#d9cfbf', '#f7f2ea', '#cbbfae']); blot(c, 512, 512, 6, 'rgba(150,130,100,.10)'); crack(c, 512, 512, 2, 'rgba(140,120,100,.35)');
    c.fillStyle = '#d2c6b3'; for (let i = 0; i <= 4; i++) { c.fillRect(i * 128 - 2, 0, 4, 512); c.fillRect(0, i * 128 - 2, 512, 4); } }],
  // pavement: rose-terracotta blocks, running bond (25 × 12.5 cm)
  walk: [1, 256, c => { for (let r = 0; r < 8; r++) for (let i = -1; i < 5; i++) { c.fillStyle = jit(['#efcdbd', '#e9c0ae', '#f3d8ca'][(r + i + 9) % 3], .04); c.fillRect(i * 64 + (r % 2) * 32 + 2, r * 32 + 2, 60, 28); }
    specks(c, 256, 256, 500, ['#d9ab97', '#f8e4da']); c.fillStyle = 'rgba(160,110,90,.5)'; for (let r = 0; r <= 8; r++) c.fillRect(0, r * 32 - 1.5, 256, 3); }],
  // asphalt: speckled grey, cracks and a darker patch
  asphalt: [2, 512, c => { c.fillStyle = '#7d7f87'; c.fillRect(0, 0, 512, 512); c.fillStyle = '#717379'; c.fillRect(300, 60, 150, 110);
    specks(c, 512, 512, 7000, ['#6a6c73', '#90929a', '#a3a5ab', '#5f6168'], 2.2); blot(c, 512, 512, 8, 'rgba(40,40,50,.12)', 30, 80); crack(c, 512, 512, 6, 'rgba(50,50,58,.6)'); }],
  // concrete: pale slabs a metre across, trowel arcs, stains of oil and rain
  concrete: [2, 512, c => { c.fillStyle = '#e1ded7'; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { c.fillStyle = jit('#e1ded7', .04); c.fillRect(i * 256, j * 256, 256, 256); }
    c.strokeStyle = 'rgba(170,165,155,.35)'; c.lineWidth = 1.5; for (let i = 0; i < 18; i++) { c.beginPath(); c.arc(rnd() * 512, rnd() * 512, 20 + rnd() * 40, rnd() * 3, rnd() * 3 + 1.2); c.stroke(); }
    specks(c, 512, 512, 2200, ['#cfcbc3', '#f0ede7', '#bdb8af']); blot(c, 512, 512, 5, 'rgba(70,70,80,.13)', 18, 50); crack(c, 512, 512, 3, 'rgba(120,115,105,.4)');
    c.fillStyle = '#c4bfb5'; for (let i = 0; i <= 2; i++) { c.fillRect(i * 256 - 2, 0, 4, 512); c.fillRect(0, i * 256 - 2, 512, 4); } }],
  // grass: blades in three greens and a little clover
  grass: [1, 256, c => { c.fillStyle = '#b4d98b'; c.fillRect(0, 0, 256, 256); blot(c, 256, 256, 8, 'rgba(120,170,80,.18)', 15, 40);
    for (let i = 0; i < 1400; i++) { const x = rnd() * 256, y = rnd() * 256; c.strokeStyle = ['#9fcb76', '#c6e5a0', '#8fbf68'][i % 3]; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd() - .5) * 4, y - 5 - rnd() * 6); c.stroke(); }
    for (let i = 0; i < 14; i++) { const x = rnd() * 256, y = rnd() * 256; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill(); c.fillStyle = '#ffe48a'; c.beginPath(); c.arc(x, y, 1, 0, 7); c.fill(); } }],
  // floor boards: 12 cm boards with grain, knots and staggered ends
  planks: [1, 256, c => { for (let r = 0; r < 8; r++) { let x = -rnd() * 160; while (x < 256) { const L = 90 + rnd() * 120; c.fillStyle = jit('#e7b884', .07); c.fillRect(x, r * 32, L, 32);
      c.strokeStyle = 'rgba(150,95,50,.28)'; c.lineWidth = 1; for (let k = 0; k < 4; k++) { const y = r * 32 + 5 + k * 7 + rnd() * 2; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + L * .3, y + (rnd() - .5) * 6, x + L * .7, y + (rnd() - .5) * 6, x + L, y); c.stroke(); }
      if (rnd() < .35) { c.fillStyle = 'rgba(130,80,40,.45)'; c.beginPath(); c.ellipse(x + L * (.2 + rnd() * .6), r * 32 + 16, 5, 3, 0, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(120,75,40,.55)'; c.fillRect(x, r * 32, 2, 32); x += L; } }
    c.fillStyle = 'rgba(110,70,35,.55)'; for (let r = 0; r <= 8; r++) c.fillRect(0, r * 32 - 1, 256, 2); }],
  // plaster: warm cream, faint trowel blotches and hairline cracks
  plaster: [2, 512, c => { c.fillStyle = '#fbf3e6'; c.fillRect(0, 0, 512, 512); blot(c, 512, 512, 7, 'rgba(210,190,160,.06)', 80, 160); blot(c, 512, 512, 5, 'rgba(255,255,255,.25)', 60, 120);
    specks(c, 512, 512, 1500, ['#efe3cf', '#fffaf2', '#e6d8c2'], 1.6); crack(c, 512, 512, 3, 'rgba(170,150,120,.35)'); }],
  // brick: soft terracotta bricks, cream mortar
  brick: [1, 256, c => { c.fillStyle = '#f3dccb'; c.fillRect(0, 0, 256, 256); for (let r = 0; r < 8; r++) for (let i = -1; i < 5; i++) { c.fillStyle = jit('#e9a78c', .06); c.fillRect(i * 64 + (r % 2) * 32 + 3, r * 32 + 3, 58, 26); }
    specks(c, 256, 256, 400, ['#d68f74', '#f6c3ad']); blot(c, 256, 256, 4, 'rgba(120,70,50,.12)', 15, 40); }],
  // the duty-room duvet: a soft blue gingham
  gingham: [.5, 256, c => { c.fillStyle = '#f4f8fc'; c.fillRect(0, 0, 256, 256); c.fillStyle = 'rgba(110,160,210,.45)'; for (let i = 0; i < 8; i++) { c.fillRect(i * 32, 0, 16, 256); c.fillRect(0, i * 32, 256, 16); }
    c.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 256; i += 3) c.fillRect(i, 0, 1, 256); }],
};
const TTEX = new Map();
// a material with the tile texture (the texture is drawn once; the material comes from kit's cache)
function TM(key) {
  if (!TTEX.has(key)) {
    const [m, px, draw] = TILES[key]; seed = 7 + key.length * 131;
    TTEX.set(key, canvasTex(px, px, c => draw(c), { repeat: [1 / m, 1 / m] }));
  }
  return mat('#ffffff', { map: TTEX.get(key), rough: .85 });
}
// a w × h plane (in its own x, y) whose UVs are metres, so its tile texture keeps its real size
const plTex = (w, h, key) => mesh(geo('fs3-pl|' + w.toFixed(3) + '|' + h.toFixed(3), () => { const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h); return g; }), TM(key), { cast: false });
const noParkTex = () => tex('nopark', 200, 200, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(w / 2, h / 2, w * .48, 0, 7); c.fill();
  c.strokeStyle = '#e8493f'; c.lineWidth = w * .09; c.beginPath(); c.arc(w / 2, h / 2, w * .4, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(w * .22, h * .22); c.lineTo(w * .78, h * .78); c.stroke();
  fitText(c, '소방차 전용', w / 2, h * .42, w * .5, 15, '#3a3a44', { weight: '800' });
  fitText(c, '주정차 금지', w / 2, h * .6, w * .5, 15, '#3a3a44', { weight: '800' });
});

// ── 섬 모양: 뒤 모서리는 살짝(.6), 앞 모서리는 크게(2.3) 둥근 네모. 점 목록 (x, z)
const IX = 4.95, IZ = 3.95, RB = .6, RF = 2.3;
function outline(inset = 0) {
  const x0 = -IX + inset, x1 = IX - inset, z0 = -IZ + inset, z1 = IZ - inset, rb = Math.max(.05, RB - inset), rf = Math.max(.05, RF - inset), pts = [];
  const arc = (cx, cz, r, a0, a1) => { for (let k = 0; k <= 12; k++) { const a = a0 + (a1 - a0) * k / 12; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  arc(x1 - rb, z0 + rb, rb, -HP, 0);
  arc(x1 - rf, z1 - rf, rf, 0, HP);
  arc(x0 + rf, z1 - rf, rf, HP, PI);
  arc(x0 + rb, z0 + rb, rb, PI, PI * 1.5);
  return pts;
}
// keep the part of a polygon on one side of an axis line (axis 0 = x, 1 = z)
function clip(pts, axis, v, keepAbove) {
  const out = [], inside = p => keepAbove ? p[axis] >= v : p[axis] <= v;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ia = inside(a), ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) { const t = (v - a[axis]) / (b[axis] - a[axis]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
const shapeOf = pts => { const s = new THREE.Shape(); pts.forEach(([x, z], i) => i ? s.lineTo(x, -z) : s.moveTo(x, -z)); s.closePath(); return s; };
// the island's half-width at depth z (inset from the rim)
function halfX(z, inset = 0) {
  const zf = IZ - RF, zb = -IZ + RB;
  if (z > zf) { const r = RF - inset, d = z - zf; return d >= r ? 0 : IX - RF + Math.sqrt(r * r - d * d); }
  if (z < zb) { const r = RB - inset, d = zb - z; return d >= r ? 0 : IX - RB + Math.sqrt(r * r - d * d); }
  return IX - inset;
}
// the island's front edge at x (inset from the rim)
function halfZ(x, inset = 0) {
  const xf = IX - RF, d = Math.abs(x) - xf, r = RF - inset;
  return d <= 0 ? IZ - inset : d >= r ? IZ - RF : IZ - RF + Math.sqrt(r * r - d * d);
}
// walking barriers outside the front rounded corners (local = room metres)
function edgeBoxes() {
  const out = [];
  for (const sx of [-1, 1]) for (let x = IX - RF; x < IX; x += .2) {
    const zEdge = IZ - RF + Math.sqrt(Math.max(0, RF * RF - (x + .2 - (IX - RF)) ** 2));
    const a = sx * x, b = sx * (x + .2);
    out.push([Math.min(a, b), 0, zEdge, Math.max(a, b), .5, IZ + .1]);
  }
  return out;
}

// ── 20판 햇살 빌라 far behind (사용자 10/23 승인 방향 '이어지는 동네': 다음 판 건물이 멀리 작게) — a landmark of the white town
// (gfx/whitetown-kit.js, ① 10/24: the old flat white board with little houses on it read as a paper cut-out, 아트 점검 10/23)
addI18n({ '햇살빌라(먼 동네)': 'Sunny Villa (down the street)' });
B.fs3_villamark = f => {
  f.add(mc('fs3-villamark', ({ add }) => {
    const WIN = '#dfe6ee', vx = 0, vz = 0, vh = 3.3;
    // three storeys, balconies, a rooftop with its yellow water tank, a pink parasol, pots and the rooftop room
    add(G.box(3.2, vh, 2.6, .06), '#fffaf2', vx, vh / 2, vz);
    for (let k = 0; k < 3; k++) { add(G.box(3.24, .06, 2.64, .01), '#ece4d6', vx, (k + 1) * 1.1, vz); for (const fx of [-.8, .8]) add(G.box(.6, .5, .03, .01), WIN, vx + fx, .6 + k * 1.1, vz + 1.31); add(G.box(1.2, .3, .3, .02), '#f6efe2', vx - .8, .32 + k * 1.1, vz + 1.42); }
    add(G.box(3.3, .2, 2.7, .03), '#efe6d6', vx, vh + .1, vz);
    add(G.box(1.0, .8, .9, .04), '#fdf4e4', vx - .9, vh + .6, vz - .6); add(G.box(.3, .5, .02, .01), '#7fbf7a', vx - .9, vh + .45, vz - .14);
    add(G.cyl(.38, .38, .7, 18), '#efc75e', vx + .9, vh + .55, vz - .7); add(G.sph(.38, 14, 8), '#efc75e', vx + .9, vh + .9, vz - .7, 0, 0, 0, [1, .35, 1]);
    add(G.cyl(.03, .03, .9, 6), '#ffffff', vx + .5, vh + .65, vz + .6); add(G.cone(.7, .32, 12), '#f4a6b8', vx + .5, vh + 1.2, vz + .6);
    for (const [px, pz] of [[vx - 1.3, vz + 1.0], [vx + 1.3, vz + 1.0], [vx + 1.3, vz]]) { add(G.cyl(.14, .11, .22, 10), '#e6a07a', px, vh + .31, pz); add(G.sph(.2, 10, 8), '#86c46b', px, vh + .52, pz); }
    for (let x = vx - 1.6; x <= vx + 1.61; x += .4) add(G.box(.04, .35, .04, .01), '#ffffff', x, vh + .37, vz + 1.33);
    add(G.box(3.24, .05, .05, .01), '#ffffff', vx, vh + .55, vz + 1.33);
    }));
};
// the front band of the island is a street: the pavement (SW0..RZ) and a kerb down to the asphalt road (RZ..front, top RY)
const SW0 = 2.25, RZ = 2.85, RY = -.115;
B.fs3_island = f => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];
  // (the road is for cars: nobody stands on it — and the rounded corners are no ground)
  f.walkBoxes = [...edgeBoxes(), [-IX - .1, 0, RZ - .12, IX + .1, .5, IZ + .1]];
  const T = (key, pts, depth, y) => f.add(put(mesh(geo('fs3-flat|' + key + '|' + y, () => G.ext(shapeOf(pts), depth, 0, 4)), TM(key)), 0, y, 0, -HP, 0, 0));
  f.add(mc('fs3-island-v2', ({ add }) => {
    const flat = (pts, depth, color, y, bevel = 0) => add(G.ext(shapeOf(pts), depth, bevel, 4), color, 0, y, 0, -HP, 0, 0);
    // the block: dark earth foot, warm earth body, a pale stone band under the paving, a gravel bed under the road
    flat(outline(.1), .16, P.earthD, -.86, .03);
    flat(outline(0), .44, P.earth, -.6, .04);
    flat(clip(outline(0), 1, RZ, false), .14, P.kerb, -.15, .02);
    flat(clip(outline(0), 1, RZ, true), .05, '#8d8a86', -.17, .015);
    // stones in the earth face
    for (let k = 0; k < 26; k++) {
      const z = -3.3 + k * .28; if (z > IZ - RF) break;
      for (const sx of [-1, 1]) add(G.sph(.07 + (k % 3) * .015, 7, 5), k % 2 ? '#c99670' : '#e2bd98', sx * (IX + .03), -.38 - (k % 2) * .14, z, 0, 0, 0, [.5, .8, 1.2]);
    }
    for (let k = 0; k < 22; k++) { const x = -3.7 + k * .36; if (Math.abs(x) > IX - RF + .2) continue; add(G.sph(.07 + (k % 3) * .015, 7, 5), k % 2 ? '#c99670' : '#e2bd98', x, -.38 - (k % 2) * .14, IZ + .03, 0, 0, 0, [1.2, .8, .5]); }
    // the kerb: granite blocks .14 over the road, lowered (a dropped kerb with a ramp) where the engines drive out
    for (let x = -halfX(RZ, .1); x < halfX(RZ, .1) - .05; x += .5) {
      const w = Math.min(.48, halfX(RZ, .1) - x), cx = x + w / 2, drop = cx > -3.55 && cx < -.25;
      add(G.box(w, drop ? .06 : .15, .14, .02), drop ? '#e4ded4' : P.kerb, cx, drop ? RY + .03 : RY + .075, RZ - .07);
    }
    add(G.box(3.2, .03, .34, .01), '#d8d3c9', -1.9, RY + .05, RZ - .26, -.33, 0, 0);
    // road paint: a white dashed centre line, the stop line at the station's exit, the manhole with its rim
    for (let x = -3.6; x < 3.7; x += 1.0) { const zc = 3.45; if (halfX(zc, .2) > Math.abs(x) + .35) add(G.box(.6, .006, .08, .002), '#ffffff', x, RY + .008, zc); }
    add(G.box(3.0, .006, .1, .002), '#ffffff', -1.9, RY + .008, RZ + .12);
    add(G.cyl(.31, .31, .016, 22), '#6c6a68', 1.6, RY + .006, 3.42); add(G.cyl(.25, .25, .018, 22), '#8a8784', 1.6, RY + .008, 3.42);
    for (const dz of [-.12, 0, .12]) add(G.box(.4, .006, .025, .002), '#6c6a68', 1.6, RY + .018, 3.42 + dz);
    // a drain grate in the gutter
    add(G.box(.6, .012, .2, .004), '#7d838c', .6, RY + .004, RZ + .14);
    for (let k = 0; k < 5; k++) add(G.box(.025, .014, .16, .002), '#5f646c', .38 + k * .11, RY + .01, RZ + .14);
    // the driveway's paint: yellow edge lines, the hatched no-parking box across the pavement
    for (const x of [-3.5, -.3]) add(G.box(.07, .006, RZ - .55, .002), P.yellow, x, .016, (RZ + .45) / 2 - .06);
    for (let k = 0; k < 6; k++) add(G.box(.5, .006, .07, .002), P.yellow, -3.15 + k * .5, .016, SW0 + .28, 0, .7, 0);
    // bollards beside the driveway on the pavement, and a no-parking sign post
    for (const x of [-3.85, .05]) { add(G.cyl(.07, .08, .62, 12), '#a7adb6', x, .31, SW0 + .3); add(G.cyl(.075, .075, .07, 12), P.yellow, x, .5, SW0 + .3); add(G.sph(.075, 10, 6), '#a7adb6', x, .62, SW0 + .3, 0, 0, 0, [1, .6, 1]); }
    add(G.cyl(.03, .03, 1.75, 8), '#a7adb6', .55, .875, SW0 + .32); add(G.cyl(.06, .07, .05, 10), '#8c929b', .55, .025, SW0 + .32);
    // gentle grass tufts and flowers along the beds' edges
    const tuft = (x, z, c = P.grassD) => { for (let k = 0; k < 3; k++) add(G.cone(.035, .11 + k * .02, 4), c, x + (k - 1) * .04, .07, z + (k % 2) * .03, 0, 0, (k - 1) * .3); };
    for (const [x, z] of [[3.3, -.4], [3.25, .7], [3.0, 1.95], [4.45, 1.6], [4.5, -2.6], [-4.4, -1.8], [-4.6, -2.6], [-4.3, -3.4], [-4.3, 2.0]]) tuft(x, z);
    const flower = (x, z, c) => { add(G.cyl(.008, .008, .16, 4), P.leafD, x, .1, z); for (let k = 0; k < 5; k++) { const a = k * 1.256; add(G.sph(.03, 6, 4), c, x + Math.cos(a) * .035, .19, z + Math.sin(a) * .035, 0, 0, 0, [1, .5, 1]); } add(G.sph(.022, 6, 4), P.yellow, x, .2, z); };
    for (const [x, z, c] of [[4.6, .4, P.pink], [4.5, 1.05, '#ffffff'], [3.05, 2.05, P.pink], [-4.5, -2.2, '#ffffff'], [-4.45, -1.3, P.pink], [4.7, -2.45, '#ffffff'], [-4.6, 2.05, P.pink]]) flower(x, z, c);
    const bush = (x, z, s) => { for (const [dx, dz, r] of [[0, 0, .32], [.26, .08, .24], [-.22, .1, .22], [.05, .22, .2]]) add(G.sph(r * s, 10, 8), dx > 0 ? P.leaf : P.leafD, x + dx * s, r * s * .85, z + dz * s, 0, 0, 0, [1, .85, 1]); };
    bush(4.45, -3.35, 1); bush(4.55, -1.95, .62);
    // recycling bins by the back corner: blue (paper), green (glass), yellow (cans) with their lids
    // (10/29 대수선 "대충 만든 오브젝트"): 네모 상자 셋 → 바퀴 달린 둥근 수거함 — 살짝 좁아지는 몸통, 테두리 띠, 손잡이 달린 뚜껑(종이함은
    // 빼꼼 열려 신문이 보임), 앞면 흰 표시판과 재활용 화살표, 뒤 바퀴 두 개
    for (const [k, c] of [[0, '#7fa9d4'], [1, '#86c483'], [2, '#f0cb67']]) {
      const x = 3.2 + k * .43, z = -1.75, cd = shadeHex(c, -.14);
      add(G.cyl(.17, .15, .5, 18), c, x, .29, z, 0, 0, 0, [1, 1, 1.05]); add(G.tor(.172, .018, PI * 2, 5, 20), cd, x, .5, z, HP, 0, 0, [1, 1.05, 1]);
      add(G.tor(.155, .014, PI * 2, 4, 20), cd, x, .1, z, HP, 0, 0, [1, 1.05, 1]);
      for (const sx of [-1, 1]) add(G.cyl(.045, .045, .03, 12), '#4a4858', x + sx * .11, .045, z - .15, 0, 0, HP);
      const open = k === 0 ? -.35 : 0;
      add(G.cyl(.19, .19, .045, 18), cd, x, .565 - open * .1, z - open * .2, open, 0, 0, [1, 1, 1.05]); add(G.box(.14, .03, .04, .012), shadeHex(c, -.25), x, .6 - open * .1, z + .17 - open * .25, open, 0, 0);
      if (k === 0) { add(G.box(.2, .05, .16, .01), '#f4f1e8', x, .56, z + .02, 0, .3, 0); add(G.pbox(.16, .008, .12), '#c9c6be', x, .586, z + .02, 0, .3, 0); }
      add(G.box(.13, .1, .012, .004), '#ffffff', x, .3, z + .17, -.04, 0, 0);
      for (let q = 0; q < 3; q++) { const a = q * 2.094 + .3; add(G.box(.045, .012, .006, .002), cd, x + Math.cos(a) * .028, .3 + Math.sin(a) * .028, z + .178, 0, 0, a + HP); }
    }
  }));
  // textured surfaces (UV in metres): the stone plaza, the pink pavement, the asphalt, the driveway's concrete, the grass beds
  T('stone', clip(outline(.16), 1, SW0, false), .012, -.006);
  T('walk', clip(clip(outline(.16), 1, SW0, true), 1, RZ - .14, false), .012, -.006);
  T('asphalt', clip(outline(0), 1, RZ, true), .01, RY - .01);
  f.add(put(plTex(3.15, RZ - .2 - .45, 'concrete'), -1.9, .011, (RZ - .2 + .45) / 2, -HP, 0, 0));
  T('grass', clip(clip(outline(.32), 0, 2.85, true), 1, SW0 - .1, false), .022, 0);
  T('grass', clip(clip(outline(.3), 0, 3.0, true), 1, -2.2, false), .022, 0);
  T('grass', clip(clip(outline(.3), 0, -3.62, false), 1, 2.1, false), .022, 0);
  // the no-parking sign: "소방차 전용 — 주정차 금지"
  const sign = grp(); put(sign, .55, 1.55, SW0 + .36); f.add(sign);
  sign.add(put(mesh(G.box(.5, .5, .03, .01), mat('#f4f4f4')), 0, 0, -.02));
  sign.add(put(decal(.46, .46, noParkTex()), 0, 0, .0));
  f.spot('behind', null, 4.45, .02, -2.95, { maxH: .3, label: '덤불 뒤', scale: .85 });
  f.spot('behind', null, 3.7, .02, -2.0, { maxH: .4, label: '분리수거함 뒤', scale: .85 });
  // the room's own square floor would show past the round island's corners: the island is the floor here
  f.idle = () => {
    if (f.fs3Floor) return;
    const room = f.group.parent; if (!room) return;
    f.fs3Floor = true;
    for (const o of room.children) if (o.isMesh && o.userData.floor) o.visible = false;
  };
};

// ── the station. Local = room metres.
const GX0 = -3.6, GX1 = -.2, TX1 = 2.95, BZ = -3.95, BW = .2, FZ = .4, SPRING = 2.9, ARCH = 1.1, FH = 2.4, TWALL = 4.2, APEX = 5.0;
const GC = (GX0 + GX1) / 2, GH = (GX1 - GX0) / 2, TC = (GX1 + TX1) / 2;
// the first floor's deck (z DZ0..DZ1), the stairs (x SX, foot at SZ0), the pole (PX, PZ), the bed (BX, BBZ)
const DZ0 = BZ + BW, DZ1 = -2.25, SX = 2.66, SZ0 = .4, PX = .55, PZ = -1.9, BX = GX1 + .62, BBZ = -3.05;
const archY = (x, a = GH, b = ARCH) => { const u = (x - GC) / a; return Math.abs(u) >= 1 ? 0 : b * Math.sqrt(1 - u * u); };

const signTex = () => tex('sign', 640, 176, (c, w, h) => {
  c.fillStyle = P.cream; roundRect(c, 3, 3, w - 6, h - 6, 22); c.fill();
  c.strokeStyle = P.red; c.lineWidth = 7; roundRect(c, 9, 9, w - 18, h - 18, 17); c.stroke();
  fitText(c, '119', w * .24, h * .54, w * .36, 92, P.red, { weight: '800' });
  fitText(c, '곰돌이네', w * .68, h * .33, w * .5, 30, P.ink, { weight: '800' });
  fitText(c, '안전센터', w * .68, h * .68, w * .52, 46, P.ink, { weight: '800' });
});
const dutyTex = () => tex('duty', 256, 84, (c, w, h) => {
  c.fillStyle = P.navy; roundRect(c, 2, 2, w - 4, h - 4, 14); c.fill();
  fitText(c, '당직실', w / 2, h / 2 + 2, w * .78, 40, P.cream, { weight: '800' });
});
const posterTex = () => tex('poster', 160, 220, (c, w, h) => {
  c.fillStyle = '#fff3d6'; c.fillRect(0, 0, w, h);
  c.fillStyle = P.red; c.fillRect(0, 0, w, h * .2);
  fitText(c, '불조심', w / 2, h * .1 + 1, w * .8, 26, '#ffffff', { weight: '800' });
  c.fillStyle = '#ffb347'; c.beginPath(); c.moveTo(w * .5, h * .3); c.quadraticCurveTo(w * .78, h * .52, w * .62, h * .7); c.quadraticCurveTo(w * .5, h * .78, w * .38, h * .7); c.quadraticCurveTo(w * .22, h * .52, w * .5, h * .3); c.fill();
  c.fillStyle = '#ffe07a'; c.beginPath(); c.ellipse(w * .5, h * .62, w * .09, h * .08, 0, 0, 7); c.fill();
  c.strokeStyle = P.red; c.lineWidth = 6; c.beginPath(); c.moveTo(w * .2, h * .32); c.lineTo(w * .8, h * .82); c.stroke();
  fitText(c, '출동 준비!', w / 2, h * .9, w * .84, 20, P.ink, { weight: '800' });
});

// the back wall in one piece: the garage's arch on the left, the duty tower's gable on the right
// (H: the helmet variant — the tower's top is level, the giant helmet sits on it)
function backWall(H) {
  const wall = new THREE.Shape(); wall.moveTo(GX0, 0); wall.lineTo(TX1, 0); wall.lineTo(TX1, TWALL); if (!H) wall.lineTo(TC, APEX); wall.lineTo(GX1, TWALL); wall.lineTo(GX1, SPRING);
  for (let k = 1; k <= 20; k++) { const x = GX1 - (GX1 - GX0) * k / 20; wall.lineTo(x, SPRING + archY(x)); }
  wall.lineTo(GX0, 0);
  return wall;
}
// the duty roster whiteboard (근무표): three shifts, magnets by the names
const rosterTex = () => tex('roster', 248, 176, (c, w, h) => {
  c.fillStyle = '#9aa3ae'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffffff'; c.fillRect(4, 4, w - 8, h - 8);
  fitText(c, '근무표', w / 2, 16, w * .6, 16, '#3a3a44', { weight: '800' });
  c.strokeStyle = '#7a8291'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(10, 30 + i * 32); c.lineTo(w - 10, 30 + i * 32); c.stroke(); }
  c.beginPath(); c.moveTo(60, 30); c.lineTo(60, 126); c.stroke();
  const rows = [['주간', '#4d8fd6'], ['야간', '#e8493f'], ['비번', '#5fa45a']];
  rows.forEach(([t, col], i) => { fitText(c, t, 34, 46 + i * 32, 44, 13, '#3a3a44', { weight: '800' }); for (let k = 0; k < 3; k++) { c.fillStyle = col; c.beginPath(); c.arc(80 + k * 52, 46 + i * 32, 6, 0, 7); c.fill(); c.fillStyle = '#c9ced6'; c.fillRect(90 + k * 52, 42 + i * 32, 26, 8); } });
  c.strokeStyle = '#e8493f'; c.lineWidth = 2; c.beginPath(); c.moveTo(14, 148); c.quadraticCurveTo(60, 136, 110, 150); c.stroke();
  c.fillStyle = '#9aa3ae'; c.fillRect(20, h - 14, w - 40, 6);
});
// a month calendar with today circled
const calendarTex = () => tex('calendar', 120, 160, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8493f'; c.fillRect(0, 0, w, 34);
  fitText(c, '10', w / 2, 18, w * .5, 22, '#ffffff', { weight: '800' });
  c.fillStyle = '#c9ced6'; for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) c.fillRect(8 + k * 15, 48 + r * 21, 10, 8);
  c.strokeStyle = '#e8493f'; c.lineWidth = 2.5; c.beginPath(); c.arc(8 + 4 * 15 + 5, 48 + 3 * 21 + 4, 9, 0, 7); c.stroke();
});
// a child's crayon drawing of a fire engine, taped up
const drawingTex = () => tex('drawing', 168, 128, (c, w, h) => {
  c.fillStyle = '#fffdf6'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ef5a4c'; c.fillRect(30, 52, 92, 40); c.fillRect(110, 40, 30, 52);
  c.fillStyle = '#9fd3f0'; c.fillRect(116, 46, 18, 16);
  c.fillStyle = '#3a3a44'; c.beginPath(); c.arc(54, 96, 11, 0, 7); c.arc(118, 96, 11, 0, 7); c.fill();
  c.strokeStyle = '#f2c14e'; c.lineWidth = 3; c.beginPath(); c.moveTo(34, 46); c.lineTo(104, 30); c.stroke();
  c.fillStyle = '#ffd04a'; c.beginPath(); c.arc(146, 20, 12, 0, 7); c.fill();
  c.fillStyle = 'rgba(240,220,170,.8)'; c.fillRect(70, 0, 30, 9);
});
// opts.helmet (19판 비교안 firestation3b, 사용자 10/23 승인 방향 "지붕은 거대 소방 헬멧"): the duty tower wears a giant fire
// helmet for a roof instead of the gable, and the siren moves to the garage arch's crown
// where the siren stands: the gable's peak, or (helmet variant) the crown of the garage's front arch
const sirenAt = H => H ? [GC, SPRING + ARCH + .32 + .24, FZ] : [TC, APEX + .52, BZ + .3];
// the giant fire helmet on the duty tower: a yellow shell with its comb, a reflective band, the long rear brim sloping over
// the back wall, and the front badge (119). It sits back (centre z HZ) so the duty room shows under its front brim.
const HZ = -3.55, HY = TWALL + .1;
const badgeTex = () => tex('badge', 160, 176, (c, w, h) => {
  c.fillStyle = '#fff6e6'; c.beginPath(); c.moveTo(w * .5, 4); c.lineTo(w - 6, h * .2); c.lineTo(w - 14, h * .68); c.quadraticCurveTo(w * .5, h - 4, 14, h * .68); c.lineTo(6, h * .2); c.closePath(); c.fill();
  c.strokeStyle = '#c89232'; c.lineWidth = 7; c.stroke();
  fitText(c, '119', w / 2, h * .45, w * .7, 54, '#e8493f', { weight: '800' });
  c.fillStyle = '#c89232'; c.beginPath(); c.arc(w / 2, h * .72, 9, 0, 7); c.fill();
});
// (10/29 대수선, 자리별 보임 검사): 헬멧이 2층 당직실(이불·침대 밑·책상 위)을 기본 카메라에서 통째로 가려서 — 받침점(TC, HY, HZ)을
// 그대로 두고 .62배로; 뒤챙은 뒷벽 위에 걸치고 앞챙은 당직실 시선 위로
const HS = .62;
function helmetRoof(f) {
  const hg = grp(); hg.scale.setScalar(HS); hg.position.set(TC * (1 - HS), HY * (1 - HS), HZ * (1 - HS)); f.add(hg);
  hg.add(mc('fs3-helmet', ({ add }) => {
    const Y = '#ffc84a', YD = '#e6a42e';
    add(new THREE.SphereGeometry(1.62, 30, 14, 0, PI * 2, 0, HP), Y, TC, HY + .12, HZ, 0, 0, 0, [1, .78, 1.08]);
    // the brim: a broad ellipse, longer and lower at the back (over the wall), turned up a little at the front
    add(G.cyl(1, 1, .09, 32), YD, TC, HY + .08, HZ, 0, 0, 0, [1.95, 1, 2.05]);
    add(G.cyl(1, 1, .08, 28), YD, TC, HY - .06, HZ - .95, -.22, 0, 0, [1.8, 1, 1.35]);
    add(G.tor(1, .05, PI * 2, 5, 40), Y, TC, HY + .1, HZ, HP, 0, 0, [1.95, 2.05, 1]);
    // the comb ridge front to back, and the reflective band round the shell
    add(G.tor(1.3, .13, PI, 6, 24), YD, TC, HY + .14, HZ, 0, HP, 0, [1.06, .98, 1]);
    add(G.tor(1.0, .055, PI * 2, 5, 40), '#f4f4f0', TC, HY + .42, HZ, HP, 0, 0, [1.56, 1.69, 1]);
    // rivets each side of the comb
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { const a = .35 + k * .4; add(G.sph(.05, 8, 6), YD, TC + sx * .3, HY + .12 + Math.sin(a) * 1.22, HZ + Math.cos(a) * 1.68, 0, 0, 0, [1, 1, .5]); }
    // the badge holder on the front
    add(G.box(.6, .66, .06, .03), '#c89232', TC, HY + .62, HZ + 1.62, -.48, 0, 0);
  }));
  hg.add(put(decal(.52, .58, badgeTex()), TC, HY + .63, HZ + 1.67, -.48, 0, 0));
}
// the duty room upstairs (사용자 10/24 "2층에 물건들 디테일, 퀄리티 올려줘"): every piece a real thing — the hiding spots stay
// where they were (bed quilt · under the bed · desk top · under the desk · shelf top), and the floor round them is clear
function dutyRoom(add, tube) {
  const at = (cx, cz, ry) => (g, c, x, y, z, rx = 0, r2 = 0, rz = 0, s) => add(g, c, cx + Math.cos(ry) * x + Math.sin(ry) * z, y, cz - Math.sin(ry) * x + Math.cos(ry) * z, rx, ry + r2, rz, s);
  const bx = BX, bz = BBZ, F = FH;
  // bed: four legs (under it shows), a frame, slats, the mattress, a headboard with a round top and posts with knobs, a low
  // footboard, a fluffy pillow (the quilt is part 2)
  for (const [lx, lz] of [[-.45, -.63], [.45, -.63], [-.45, .63], [.45, .63]]) add(G.box(.07, .3, .07, .02), P.woodD, bx + lx, F + .15, bz + lz);
  for (const s of [-1, 1]) add(G.box(.05, .08, 1.24, .02), P.wood, bx + s * .45, F + .3, bz);
  add(G.box(.94, .08, .05, .02), P.wood, bx, F + .3, bz + .63);
  for (let k = 0; k < 5; k++) add(G.pbox(.86, .015, .09), P.woodL, bx, F + .285, bz - .5 + k * .25);
  add(G.box(.86, .12, 1.2, .05), '#fbf6ee', bx, F + .35, bz); add(G.pbox(.87, .012, 1.21), '#d9e6f2', bx, F + .33, bz);
  const hb = new THREE.Shape(); hb.moveTo(-.42, 0); hb.lineTo(.42, 0); hb.lineTo(.42, .32); hb.quadraticCurveTo(0, .52, -.42, .32); hb.lineTo(-.42, 0);
  add(G.ext(hb, .05, .015, 8), P.wood, bx, F + .3, bz - .69);
  for (let k = 0; k < 3; k++) add(G.pbox(.05, .28, .01), P.woodL, bx - .2 + k * .2, F + .48, bz - .628);
  for (const s of [-1, 1]) { add(G.box(.08, .74, .08, .02), P.woodD, bx + s * .46, F + .37, bz - .66); add(G.sph(.055, 10, 8), P.woodD, bx + s * .46, F + .78, bz - .66); }
  add(G.box(.86, .22, .05, .02), P.wood, bx, F + .42, bz + .66);
  for (const s of [-1, 1]) { add(G.box(.08, .5, .08, .02), P.woodD, bx + s * .46, F + .25, bz + .66); add(G.sph(.05, 10, 8), P.woodD, bx + s * .46, F + .54, bz + .66); }
  add(G.box(.56, .12, .28, .06), '#ffffff', bx, F + .47, bz - .47, .12, 0, 0); add(G.pbox(.5, .006, .2), '#dbe8f5', bx, F + .535, bz - .47, .12, 0, 0);
  // the rug and slippers by the bed
  add(G.cyl(1, 1, .012, 28), '#bcd6ee', 1.36, F + .04, -2.96, 0, 0, 0, [.5, 1, .34]); add(G.tor(1, .02, PI * 2, 3, 28), '#ffffff', 1.36, F + .046, -2.96, HP, 0, 0, [.42, .28, 1]);
  for (const [z, r] of [[-2.72, -.15], [-2.54, .1]]) { add(G.box(.11, .04, .24, .04), '#8fb8dc', 1.02, F + .05, z, 0, r, 0); add(G.box(.12, .03, .08, .015), '#ffffff', 1.02 + Math.sin(r) * .05, F + .08, z + Math.cos(r) * .05, 0, r, 0); }
  // desk: a top on two slim legs and a three-drawer pedestal, a low back panel
  const dx = 1.95, dz = -3.42, DT = F + .72;
  add(G.box(.92, .05, .52, .015), P.wood, dx, DT, dz); add(G.pbox(.88, .006, .48), P.woodL, dx, DT + .026, dz);
  for (const z of [-.21, .21]) add(G.box(.05, .7, .05, .012), P.woodD, dx - .41, F + .36, dz + z);
  add(G.box(.04, .04, .4, .01), P.woodD, dx - .41, F + .14, dz);
  add(G.box(.32, .7, .48, .02), P.woodD, dx + .28, F + .36, dz);
  for (let k = 0; k < 3; k++) { add(G.box(.27, .19, .02, .012), P.woodL, dx + .28, F + .15 + k * .21, dz + .245); add(G.box(.08, .02, .02, .006), P.brass, dx + .28, F + .2 + k * .21, dz + .26); }
  add(G.box(.55, .3, .02, .01), P.woodD, dx - .12, DT - .2, dz - .23);
  // on the desk (the front left is the hiding spot): the lamp at the back left, the radio, a pen cup, books with a bookend,
  // a mug, the cup noodle with its lid peeled back and chopsticks across
  add(G.cyl(.07, .08, .03, 14), P.navy, 1.58, DT + .04, -3.6); tube([1.58, DT + .05, -3.6], [1.55, DT + .3, -3.66], .012, P.navy, 5);
  add(G.sph(.022, 8, 6), P.navy, 1.55, DT + .3, -3.66); tube([1.55, DT + .3, -3.66], [1.57, DT + .44, -3.6], .012, P.navy, 5);
  add(G.cone(.09, .12, 14), P.yellow, 1.57, DT + .42, -3.58, -.5, 0, 0); add(G.sph(.035, 8, 6), '#fff2b0', 1.575, DT + .38, -3.56);
  add(G.box(.22, .13, .11, .025), '#4a5878', 2.0, DT + .09, -3.58); add(G.pbox(.09, .07, .005), '#2f3a52', 1.95, DT + .095, -3.523);
  for (let k = 0; k < 3; k++) add(G.pbox(.08, .008, .006), '#7d8aa6', 1.95, DT + .07 + k * .02, -3.52);
  add(G.cyl(.018, .018, .02, 8), P.yellow, 2.06, DT + .11, -3.52, HP, 0, 0); add(G.sph(.012, 6, 4), P.red, 2.08, DT + .14, -3.52);
  tube([2.08, DT + .15, -3.6], [2.1, DT + .36, -3.61], .006, '#3a3a44', 4); add(G.sph(.012, 6, 4), '#3a3a44', 2.1, DT + .36, -3.61);
  add(G.cyl(.035, .035, .1, 10), P.red, 1.83, DT + .075, -3.62); for (const [x, c] of [[-.012, P.blue], [.01, '#3a3a44'], [0, P.yellow]]) tube([1.83 + x, DT + .1, -3.62], [1.83 + x * 2, DT + .19, -3.62 + x], .006, c, 4);
  for (const [k, c, h] of [[0, P.navy, .2], [1, '#e8493f', .17], [2, '#8fb8dc', .22]]) add(G.box(.04, h, .15, .008), c, 2.24 + k * .045, DT + .025 + h / 2, -3.56);
  add(G.box(.015, .14, .1, .004), P.steelD, 2.36, DT + .095, -3.56, 0, 0, -.1);
  add(G.cyl(.045, .04, .09, 14), '#8fb8dc', 2.13, DT + .07, -3.27); add(G.tor(.03, .01, PI * 2, 4, 10), '#8fb8dc', 2.18, DT + .075, -3.27, 0, 0, 0);
  add(G.cyl(.065, .05, .12, 16), '#fffaf0', 2.3, DT + .085, -3.32); add(G.cyl(.066, .062, .03, 16), P.red, 2.3, DT + .11, -3.32);
  add(G.cyl(.066, .066, .006, 16), '#f6efe0', 2.29, DT + .16, -3.36, -.9, 0, 0); for (const dzz of [-.012, .012]) add(G.box(.22, .01, .012, .003), '#e6c48e', 2.3, DT + .152, -3.32 + dzz, 0, .2, 0);
  // the chair, pulled out and turned a little
  const C = at(1.78, -2.98, .35);
  C(G.box(.38, .04, .36, .015), P.wood, 0, F + .44, 0);
  for (const [x, z] of [[-.16, -.15], [.16, -.15], [-.16, .15], [.16, .15]]) C(G.box(.04, .44, .04, .01), P.woodD, x, F + .22, z);
  for (const x of [-.16, .16]) C(G.box(.04, .46, .04, .01), P.woodD, x, F + .67, .16);
  for (const y of [.62, .82]) C(G.box(.36, .07, .03, .012), P.wood, 0, F + y, .165);
  // the clothes shelf: open sides, three boards; folded uniforms and gloves, the spare helmet; its top kept clear (a hiding spot)
  const sx0 = 2.68, sz0 = -3.55;
  for (const s of [-1, 1]) add(G.box(.03, 1.0, .4, .01), P.woodD, sx0 + s * .2, F + .5, sz0);
  add(G.pbox(.4, 1.0, .015), P.wood, sx0, F + .5, sz0 - .19);
  for (const y of [.04, .36, .68, .985]) add(G.box(.42, .03, .4, .01), P.woodL, sx0, F + y, sz0);
  for (let k = 0; k < 3; k++) add(G.box(.26, .055, .26, .025), k === 2 ? '#f2c14e' : P.navy, sx0 - .03, F + .41 + k * .058, sz0 + .02);
  add(G.pbox(.27, .012, .262), '#e8e2d2', sx0 - .03, F + .468, sz0 + .02);
  for (const dzz of [-.06, .07]) add(G.box(.08, .04, .14, .02), '#e2a43a', sx0 + .12, F + .72, sz0 + dzz, 0, .3, 0);
  add(G.sph(.12, 14, 8), P.yellow, sx0 - .02, F + .1, sz0 + .02, 0, 0, 0, [1, .82, 1.12]); add(G.cyl(.165, .165, .015, 18), P.yellow, sx0 - .02, F + .065, sz0 + .04, 0, 0, 0, [1, 1, 1.15]);
  add(G.box(.07, .07, .02, .01), '#c89232', sx0 - .02, F + .16, sz0 + .145, -.4, 0, 0); add(G.tor(.12, .01, PI, 4, 14), '#f4f4f0', sx0 - .02, F + .12, sz0 + .02, 0, HP, 0, [1, 1, 1.1]);
  // the backpack slumped by the shelf: a round body, a pocket with a zip, straps, a little star charm
  const Bp = at(2.36, -3.2, -.3);
  Bp(G.box(.3, .38, .18, .08), '#6f8fb0', 0, F + .2, 0, -.12); Bp(G.box(.22, .14, .06, .03), '#5b7a99', 0, F + .14, .1, -.12);
  Bp(G.pbox(.16, .008, .008), '#e8e2d2', 0, F + .2, .13, -.12); Bp(G.tor(.05, .012, PI, 4, 10), '#3a4a6a', 0, F + .4, -.02, 0, 0, 0);
  Bp(G.sph(.025, 8, 6), P.yellow, .1, F + .1, .14);
  // the stand fan: a round foot, the post, the motor, a cage of two rings and spokes, three blades
  const Fn = at(1.25, -2.55, -.5);
  Fn(G.cyl(.13, .15, .035, 16), '#ffffff', 0, F + .05, 0); Fn(G.cyl(.018, .022, .44, 8), '#ffffff', 0, F + .28, 0);
  Fn(G.sph(.065, 12, 8), '#ffffff', 0, F + .52, -.06, 0, 0, 0, [1, 1, 1.4]);
  for (const z of [.0, .07]) Fn(G.tor(.17, .012, PI * 2, 4, 22), '#a9c7e6', 0, F + .55, z);
  for (let k = 0; k < 8; k++) { const a = k * PI / 4; Fn(G.box(.17, .01, .01, .004), '#a9c7e6', Math.cos(a) * .085, F + .55 + Math.sin(a) * .085, .072, 0, 0, a); }
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + .3; Fn(G.sph(.075, 10, 6), '#8fb8dc', Math.cos(a) * .08, F + .55 + Math.sin(a) * .08, .035, 0, 0, a, [1.4, .7, .25]); }
  Fn(G.cyl(.03, .03, .03, 10), '#ffffff', 0, F + .55, .08, HP, 0, 0);
  // a carton of noodles with two cups on it
  add(G.box(.4, .26, .3, .02), '#f2b04a', 2.05, F + .16, -2.42, 0, .1, 0); add(G.box(.41, .07, .005, .002), P.red, 2.05 + .015, F + .2, -2.27 + .0, 0, .1, 0);
  for (const s of [-1, 1]) add(G.box(.18, .012, .29, .004), '#e8a03e', 2.05 + s * .1, F + .295, -2.42, 0, .1, s * -.5);
  for (const x of [-.08, .09]) { add(G.cyl(.065, .05, .12, 14), '#fffaf0', 2.05 + x, F + .35, -2.43); add(G.cyl(.066, .062, .03, 14), P.red, 2.05 + x, F + .37, -2.43); add(G.cyl(.067, .067, .008, 14), '#f6efe0', 2.05 + x, F + .412, -2.43); }
  // the washing line: pegged on it a navy T-shirt with a yellow band, a striped towel, a pair of socks
  const LX = TX1 - .1, LY = F + 1.55;
  tube([LX, LY, DZ1 - .1], [LX, LY, -3.6], .008, '#ffffff', 4);
  const tee = new THREE.Shape(); tee.moveTo(-.11, 0); tee.lineTo(.11, 0); tee.lineTo(.11, .2); tee.lineTo(.18, .17); tee.lineTo(.21, .23); tee.lineTo(.08, .29); tee.quadraticCurveTo(0, .25, -.08, .29); tee.lineTo(-.21, .23); tee.lineTo(-.18, .17); tee.lineTo(-.11, .2); tee.lineTo(-.11, 0);
  add(G.ext(tee, .02, .006, 4), P.navy, LX - .01, LY - .29, -2.62, 0, HP, 0); add(G.pbox(.02, .03, .22), P.yellow, LX, LY - .2, -2.62);
  add(G.box(.02, .4, .24, .006), '#ffffff', LX, LY - .2, -3.0); for (const y of [-.08, -.34]) add(G.pbox(.024, .03, .24), '#8fb8dc', LX, LY + y, -3.0);
  for (const [z, c] of [[-3.3, P.pink], [-3.42, P.pink]]) { add(G.box(.02, .16, .06, .01), c, LX, LY - .08, z); add(G.box(.02, .05, .1, .01), c, LX, LY - .15, z + .02); }
  for (const z of [-2.55, -2.69, -2.9, -3.1, -3.3, -3.42]) add(G.box(.02, .05, .015, .004), '#e6b47e', LX, LY - .01, z);
}
B.fs3_house = (f, T, opts = {}) => {
  const H = !!opts?.helmet;
  f.noSolid = true; f.collideBox = [0, -.5, 0, .01, -.45, .01];
  f.add(mc('fs3-house-v3' + (H ? '-helmet' : ''), ({ add, tube }) => {
    // ── back wall: the garage's arch on the left, the duty tower's gable on the right — one shape, so one ink outline
    const iz = BZ + BW + .02;
    // the corner quoins (the wall itself and its brick plinth are textured meshes, below)
    for (let y = .9; y < TWALL - .2; y += .42) for (const [x, w] of [[TX1 - .16, .3], [GX1 + .02, .22]]) add(G.box(w, .26, .07, .02), y % .84 < .42 ? P.brick : P.stone, x, y, iz + .01);
    // arch band on the back wall's edge (stone voussoirs) and a fan window inside the arch
    for (let k = 0; k < 13; k++) {
      const a = PI * (k + .5) / 13, x = GC + Math.cos(a) * (GH - .08), y = SPRING + Math.sin(a) * (ARCH - .06);
      add(G.box(.34, .2, .3, .03), k % 2 ? P.brick : P.stone, x, y, BZ + BW / 2, 0, 0, a - HP);
    }
    const fan = new THREE.Shape(); fan.moveTo(GC - 1.15, 0); for (let k = 0; k <= 16; k++) { const a = PI - PI * k / 16; fan.lineTo(GC + Math.cos(a) * 1.15, Math.sin(a) * .72); } fan.lineTo(GC - 1.15, 0);
    add(G.ext(fan, .03, .015, 4), P.glass, 0, SPRING + .02, iz);
    for (let k = 1; k < 6; k++) { const a = PI * k / 6; tube([GC, SPRING + .03, iz + .05], [GC + Math.cos(a) * 1.13, SPRING + .03 + Math.sin(a) * .7, iz + .05], .022, P.cream, 5); }
    add(G.tor(.2, .03, PI, 5, 12), P.cream, GC, SPRING + .03, iz + .05);
    add(G.box(2.5, .09, .16, .03), P.cream, GC, SPRING - .02, iz + .06);
    // garage left wall with a ribbon of windows, its top a cornice
    add(G.box(BW, SPRING, FZ - BZ, .03), P.plaster, GX0 + BW / 2, SPRING / 2, (BZ + FZ) / 2);
    add(G.box(BW + .1, .12, FZ - BZ + .08, .03), P.stone, GX0 + BW / 2, SPRING + .04, (BZ + FZ) / 2);
    for (const z of [-2.7, -1.75, -.8]) {
      add(G.box(.06, .74, .74, .02), P.cream, GX0 + BW + .02, 2.0, z);
      add(G.box(.03, .62, .62, .01), P.glass, GX0 + BW + .05, 2.0, z);
      add(G.box(.04, .62, .04, .01), P.cream, GX0 + BW + .07, 2.0, z); add(G.box(.04, .04, .62, .01), P.cream, GX0 + BW + .07, 2.0, z);
    }
    // ── garage front: two stone pillars, the arch ring over them, a plaster tympanum (the sign goes on it), the shutter's drum
    for (const x of [GX0 + .15, GX1 - .15]) {
      add(G.box(.34, SPRING, .42, .04), P.stone, x, SPRING / 2, FZ);
      add(G.box(.46, .3, .54, .04), P.stone, x, .15, FZ); add(G.box(.5, .06, .58, .02), P.plasterD, x, .03, FZ);
      for (let k = 0; k < 5; k++) { const y = .52 + k * .44, w = k % 2 ? .37 : .4; add(G.box(w, .2, w + .07, .03), k % 2 ? P.brickD : P.brick, x, y, FZ); }
      add(G.box(.42, .08, .5, .025), P.stone, x, SPRING - .1, FZ); add(G.box(.48, .1, .56, .03), P.plasterD, x, SPRING - .02, FZ);
      // a lantern on the pillar's face: a bracket, a hexagonal cap, warm glass between dark posts, a finial
      const lz = FZ + .21;
      add(G.box(.06, .06, .16, .015), P.navy, x, 2.08, lz + .07); add(G.box(.12, .16, .03, .01), P.navy, x, 2.08, lz + .01);
      add(G.cone(.12, .1, 6), P.navy, x, 2.27, lz + .16, 0, PI / 6, 0); add(G.sph(.025, 8, 6), P.brass, x, 2.34, lz + .16);
      add(G.cyl(.075, .06, .17, 6), '#ffe7a0', x, 2.13, lz + .16, 0, PI / 6, 0);
      for (let k = 0; k < 6; k++) { const a = k * PI / 3; add(G.pbox(.012, .17, .012), P.navy, x + Math.cos(a) * .075, 2.13, lz + .16 + Math.sin(a) * .075); }
      add(G.cyl(.065, .03, .05, 6), P.navy, x, 2.02, lz + .16, 0, PI / 6, 0);
    }
    const ring = new THREE.Shape(), ro = [GH + .02, ARCH + .32], ri = [GH - .28, ARCH + .02];
    for (let k = 0; k <= 20; k++) { const a = PI * k / 20, p = [GC + Math.cos(a) * ro[0], Math.sin(a) * ro[1]]; k ? ring.lineTo(p[0], p[1]) : ring.moveTo(p[0], p[1]); }
    for (let k = 20; k >= 0; k--) { const a = PI * k / 20; ring.lineTo(GC + Math.cos(a) * ri[0], Math.sin(a) * ri[1]); }
    ring.closePath();
    add(G.ext(ring, .4, .02, 6), P.stone, 0, SPRING, FZ - .2);
    for (let k = 0; k < 15; k++) {
      const key = k === 7, a0 = PI * k / 15 + (key ? -.02 : .012), a1 = PI * (k + 1) / 15 - (key ? -.02 : .012), am = (a0 + a1) / 2, ex = key ? .06 : 0;
      const pt = (a, r, e = 0) => [GC + Math.cos(a) * (r[0] + e), Math.sin(a) * (r[1] + e)], v = new THREE.Shape();
      const q = [pt(a0, ri, -.01), pt(a0, ro, .02 + ex * .6), pt(am, ro, .02 + ex), pt(a1, ro, .02 + ex * .6), pt(a1, ri, -.01), pt(am, ri, -.01)];
      q.forEach(([x, y], i) => i ? v.lineTo(x, y) : v.moveTo(x, y)); v.closePath();
      add(G.ext(v, .44 + (key ? .06 : 0), .018, 2), key ? P.stone : k % 2 ? P.brick : '#f6e9d6', 0, SPRING, FZ - .22 - (key ? .03 : 0));
    }
    const tym = new THREE.Shape(); tym.moveTo(GC - ri[0], 0); for (let k = 0; k <= 20; k++) { const a = PI - PI * k / 20; tym.lineTo(GC + Math.cos(a) * ri[0], Math.sin(a) * ri[1]); } tym.lineTo(GC - ri[0], 0);
    add(G.ext(tym, .08, .01, 4), P.plasterD, 0, SPRING, FZ - .04);
    add(G.box(2.48, .8, .1, .045), P.red, GC, SPRING + .5, FZ + .2); add(G.box(2.4, .72, .02, .01), P.redD, GC, SPRING + .5, FZ + .245);
    for (const sx of [-1.12, 1.12]) for (const sy of [-.3, .3]) { add(G.cyl(.028, .028, .02, 10), P.brass, GC + sx, SPRING + .5 + sy, FZ + .262, HP, 0, 0); }
    for (const sx of [-.8, .8]) {
      add(G.box(.06, .2, .12, .02), P.steelD, GC + sx, SPRING + .98, FZ + .17);
      const lx = GC + sx, ly = SPRING + 1.06;
      add(G.box(.12, .1, .04, .015), P.navy, lx, ly, FZ + .25);
      const arm = new THREE.CatmullRomCurve3([new THREE.Vector3(lx, ly, FZ + .26), new THREE.Vector3(lx, ly + .1, FZ + .36), new THREE.Vector3(lx, ly + .04, FZ + .5), new THREE.Vector3(lx, ly - .04, FZ + .55)]);
      add(new THREE.TubeGeometry(arm, 10, .016, 5, false), P.navy, 0, 0, 0);
      add(G.cone(.1, .1, 14), P.navy, lx, ly - .08, FZ + .56); add(G.sph(.04, 8, 6), '#fff2b0', lx, ly - .13, FZ + .56);
    }
    add(G.box(GX1 - GX0 - .6, .3, .34, .04), P.steel, GC, SPRING - .12, FZ - .02);
    add(G.cyl(.15, .15, GX1 - GX0 - .7, 16), P.steelD, GC, SPRING - .17, FZ - .2, 0, 0, HP);
    for (const x of [GX0 + .36, GX1 - .36]) add(G.box(.05, SPRING - .3, .07, .015), P.steelD, x, (SPRING - .3) / 2, FZ - .1);
    // garage floor: smooth concrete, parking marks, a drain channel
    for (const x of [GC - .95, GC + .95]) add(G.box(.06, .006, 2.3, .002), P.yellow, x, .016, -.95);
    add(G.box(GX1 - GX0 - .4, .006, .12, .002), '#b9b4aa', GC + .1, .016, .1);
    for (let k = 0; k < 12; k++) add(G.box(.02, .008, .09, .002), '#9ea3ab', GX0 + .45 + k * .25, .018, .1);
    // ── garage working detail (back and left walls only — the truck's flanks stay clear)
    // a hose rack on the back wall: three rolled hoses on hooks
    add(G.box(1.5, .08, .2, .02), P.woodD, GC - .2, 1.62, iz + .1);
    for (let k = 0; k < 3; k++) {
      const x = GC - .7 + k * .5; add(G.cyl(.02, .02, .22, 6), P.steelD, x, 1.55, iz + .14, HP, 0, 0);
      for (const r of [.13, .17, .21]) add(G.tor(r, .03, PI * 2, 5, 18), k === 1 ? '#f2dcae' : P.cream, x, 1.38, iz + .16);
      add(G.cyl(.04, .05, .1, 10), P.brass, x + .2, 1.2, iz + .17);
    }
    // the tool board and a fire extinguisher pair on the left wall
    add(G.box(.04, .8, 1.25, .015), P.woodL, GX0 + BW + .04, 1.1, -2.2);
    for (let k = 0; k < 5; k++) add(G.box(.05, .26 - (k % 2) * .08, .05, .012), [P.steelD, P.red, P.steelD, P.navy, P.brassD][k], GX0 + BW + .08, 1.15, -2.7 + k * .25);
    for (const z of [-1.0, -.62]) {
      add(G.cyl(.09, .09, .44, 12), P.red, GX0 + BW + .14, .3, z); add(G.sph(.09, 10, 6), P.red, GX0 + BW + .14, .52, z, 0, 0, 0, [1, .6, 1]);
      add(G.box(.05, .08, .16, .015), '#3a3a44', GX0 + BW + .14, .62, z); add(G.box(.13, .1, .005, .002), '#ffffff', GX0 + BW + .14, .3, z + .09);
    }
    // a tool cart at the garage's front left corner, in sight from the start view (its top is a hiding place) and a stack of spare tyres
    add(G.box(.62, .07, .42, .02), P.navy, -3.05, .7, -.25); add(G.box(.62, .07, .42, .02), P.navy, -3.05, .35, -.25);
    for (const [x, z] of [[-3.33, -.43], [-2.77, -.43], [-3.33, -.07], [-2.77, -.07]]) { add(G.cyl(.016, .016, .68, 6), P.steelD, x, .38, z); add(G.sph(.035, 6, 5), '#3a3a44', x, .035, z); }
    add(G.box(.2, .08, .14, .02), P.red, -3.17, .77, -.25); add(G.box(.16, .05, .1, .02), P.yellow, -2.93, .76, -.21);
    for (let k = 0; k < 3; k++) { add(G.tor(.24, .1, PI * 2, 8, 20), '#4b4b55', 2.3, .1 + k * .2, -3.38, HP, 0, 0); add(G.cyl(.14, .14, .14, 14), '#c4c8ce', 2.3, .1 + k * .2, -3.38); }
    // a shelf under the hose rack on two brackets
    add(G.box(1.5, .05, .26, .015), P.woodD, GC - .2, .97, iz + .14); for (const x of [GC - .85, GC + .45]) add(G.box(.04, .16, .2, .01), P.steelD, x, .87, iz + .11);
    // ── duty tower: the first floor deck on posts, a front beam, boards
    add(G.box(TX1 - GX1, .12, DZ1 - DZ0, .03), P.woodD, TC, FH - .06, (DZ0 + DZ1) / 2);
    add(G.box(TX1 - GX1 - .04, .03, DZ1 - DZ0 - .04, .01), P.wood, TC, FH + .015, (DZ0 + DZ1) / 2);
    add(G.box(TX1 - GX1 + .06, .16, .14, .03), P.woodD, TC, FH - .12, DZ1);
    for (const [x, z, h] of [[GX1 + .07, DZ1, FH], [TX1 - .07, DZ1, FH], [TX1 - .1, BZ + BW + .08, TWALL]]) add(G.box(.14, h, .14, .03), P.woodD, x, h / 2, z);
    // first-floor railings: front (gaps for the pole and the stairs), the garage side, the right side
    const rail = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / .32)), a = Math.atan2(-(z1 - z0), x1 - x0);
      add(G.box(L + .06, .06, .07, .02), P.cream, (x0 + x1) / 2, FH + .72, (z0 + z1) / 2, 0, a, 0);
      add(G.box(L, .04, .05, .015), P.cream, (x0 + x1) / 2, FH + .36, (z0 + z1) / 2, 0, a, 0);
      for (let k = 0; k <= n; k++) add(G.box(.05, .72, .05, .012), P.navy, x0 + (x1 - x0) * k / n, FH + .36, z0 + (z1 - z0) * k / n);
    };
    rail(GX1 + .05, DZ1 + .05, PX - .27, DZ1 + .05); rail(PX + .27, DZ1 + .05, 2.3, DZ1 + .05);
    rail(GX1 + .05, DZ0 + .05, GX1 + .05, DZ1 + .05); rail(TX1 - .05, DZ0 + .05, TX1 - .05, DZ1 + .05);
    // the tower's upper back wall: a window, a round gable window, siding lines
    for (let y = FH + .3; y < TWALL; y += .3) add(G.pbox(TX1 - GX1 - .3, .014, .012), P.plasterD, TC, y, iz + .002);
    add(G.box(1.0, .76, .06, .02), P.cream, 1.0, FH + 1.05, iz + .02); add(G.box(.86, .62, .03, .01), P.glass, 1.0, FH + 1.05, iz + .05);
    add(G.box(.04, .62, .04, .01), P.cream, 1.0, FH + 1.05, iz + .07); add(G.box(1.1, .07, .14, .02), P.woodD, 1.0, FH + .64, iz + .07);
    if (!H) { add(G.cyl(.3, .3, .06, 20), P.cream, TC, 4.48, iz + .02, HP, 0, 0); add(G.cyl(.23, .23, .03, 20), P.glassD, TC, 4.48, iz + .05, HP, 0, 0);
    add(G.box(.04, .46, .03, .01), P.cream, TC, 4.48, iz + .07); add(G.box(.46, .04, .03, .01), P.cream, TC, 4.48, iz + .07); }
    else add(G.box(TX1 - GX1 + .1, .12, BW + .1, .03), P.stone, TC, TWALL, BZ + BW / 2);
    // gable roof edges (a cut roof: only the eaves over the back), the garage's curved roof edge, gutters
    const gl = Math.hypot(TC - GX1 + .2, APEX - TWALL + .1), ga = Math.atan2(APEX - TWALL, TC - GX1);
    if (!H) for (const sx of [-1, 1]) {
      const cx = TC + sx * (TC - GX1) / 2, cy = (TWALL + APEX) / 2 + .1;
      add(G.box(gl + .2, .12, .78, .03), P.roofD, cx, cy, BZ + .3, 0, 0, -sx * ga);
      for (let k = 0; k < 7; k++) { const t = (k + .5) / 7 - .5; add(G.box(.26, .08, .8, .02), k % 2 ? P.roof : P.roofL, cx + Math.cos(ga) * t * gl, cy + .08 - sx * Math.sin(ga) * t * gl, BZ + .3, 0, 0, -sx * ga); }
    }
    if (!H) add(G.box(.26, .16, .82, .04), P.roofD, TC, APEX + .14, BZ + .3);
    // the garage's barrel roof edge (사용자 10/24 "아치형 건물 파츠 디테일"): one curved band over the back arch — its seams standing
    // across it, a darker drip edge at the front, gutters and their heads at both feet
    const band = new THREE.Shape(), bo = [GH + .2, ARCH + .24], bi = [GH + .04, ARCH + .08];
    const AS = Math.acos((GX1 - GC) / bo[0]), AA = k => AS + (PI - AS) * k / 28;
    for (let k = 0; k <= 28; k++) { const a = AA(k); k ? band.lineTo(GC + Math.cos(a) * bo[0], Math.sin(a) * bo[1]) : band.moveTo(GC + Math.cos(a) * bo[0], Math.sin(a) * bo[1]); }
    for (let k = 28; k >= 0; k--) { const a = AA(k); band.lineTo(GC + Math.cos(a) * bi[0], Math.sin(a) * bi[1]); }
    add(G.ext(band, .74, .02, 4), P.roof, 0, SPRING, BZ - .06);
    for (let k = 1; k < 12; k++) { const a = PI * k / 12; if (a < AS + .08) continue; add(G.box(.05, .06, .78, .015), P.roofL, GC + Math.cos(a) * (bo[0] + .01), SPRING + Math.sin(a) * (bo[1] + .01), BZ + .31, 0, 0, Math.atan2(Math.cos(a) * bo[1], -Math.sin(a) * bo[0]) - 0); }
    const drip = new THREE.Shape();
    for (let k = 0; k <= 28; k++) { const a = AA(k); k ? drip.lineTo(GC + Math.cos(a) * (bo[0] + .03), Math.sin(a) * (bo[1] + .03)) : drip.moveTo(GC + Math.cos(a) * (bo[0] + .03), Math.sin(a) * (bo[1] + .03)); }
    for (let k = 28; k >= 0; k--) { const a = AA(k); drip.lineTo(GC + Math.cos(a) * (bi[0] - .02), Math.sin(a) * (bi[1] - .02)); }
    add(G.ext(drip, .06, .012, 4), P.roofD, 0, SPRING, BZ + .68);
    add(G.box(.2, .1, .24, .03), P.steelD, GC - bo[0] + .08, SPRING - .02, BZ + .55);
    add(G.tor(1, .028, PI, 5, 30), P.cream, GC, SPRING + .02, iz + .05, 0, 0, 0, [1.17, .74, 1]);
    tube([GX0 + .05, SPRING - .1, BZ + .55], [GX0 + .05, .1, BZ + .55], .04, P.steelD, 8);
    for (const y of [.6, 1.4, 2.2]) add(G.box(.1, .04, .1, .01), P.steelD, GX0 + .05, y, BZ + .55);
    add(G.box(.14, .1, .14, .02), P.steelD, GX0 + .05, .08, BZ + .62);
    dutyRoom(add, tube);
    // a 'duty room' plaque and a fire-safety poster on the upper wall
    // ── the stairs up the tower's right side (rise 2.4 over 2.65)
    const n = 11;
    for (const x of [SX - .3, SX + .3]) tube([x, .02, SZ0 + .1], [x, FH + .02, DZ1 - .02], .045, P.woodD, 6);
    for (let k = 0; k < n; k++) { const t = (k + .5) / n; add(G.box(.58, .05, .26, .015), P.wood, SX, t * FH, SZ0 + (DZ1 - SZ0) * t); }
    tube([SX + .33, .9, SZ0 + .05], [SX + .33, FH + .8, DZ1], .022, P.cream, 6);
    for (const t of [.1, .5, .9]) add(G.cyl(.016, .016, .8, 5), P.navy, SX + .33, t * FH + .45, SZ0 + (DZ1 - SZ0) * t);
    // ── the slide pole (no rider): brass, a ring at the floor opening, a red landing mat
    add(G.cyl(.05, .05, FH + 1.4, 14), P.brass, PX, (FH + 1.4) / 2, PZ);
    add(G.tor(.3, .035, PI * 1.2, 6, 20), P.brass, PX, FH + .9, PZ - .05, HP, 0, PI * 1.4);
    add(G.cyl(.08, .08, .1, 12), P.brassD, PX, FH + 1.38, PZ); add(G.box(.12, .06, .4, .02), P.brassD, PX, FH + 1.38, PZ - .2);
    add(G.cyl(.42, .45, .08, 24), P.redD, PX, .04, PZ); add(G.cyl(.36, .36, .03, 24), '#f07f6c', PX, .09, PZ);
    add(G.tor(.26, .02, PI * 2, 4, 22), P.cream, PX, .105, PZ, HP, 0, 0);
    // under the deck: rolled spare hoses and boxes in the shade
    for (let k = 0; k < 2; k++) { add(G.tor(.22, .08, PI * 2, 6, 18), k ? '#f6e8c8' : '#f2dcae', 1.1, .085 + k * .165, -3.4, HP, 0, 0); add(G.cyl(.13, .13, .14, 12), P.brassD, 1.1, .085 + k * .165, -3.4); }
    add(G.cyl(.05, .035, .22, 10), P.brass, 1.42, .05, -3.25, 0, 0, HP);
    // downstairs life: a mop in its bucket, a six-pack of water under the stairs, rubber boots drying by the stair foot
    add(G.cyl(.16, .13, .3, 14), '#79a9d6', 1.5, .15, -2.75); add(G.cyl(.15, .15, .02, 14), '#9fc4e6', 1.5, .27, -2.75); add(G.tor(.15, .012, PI, 4, 12), P.steelD, 1.5, .3, -2.75);
    add(G.cyl(.016, .016, 1.25, 6), P.woodD, 1.5, .78, -2.8, .12, 0, .05); add(G.box(.2, .12, .12, .03), '#e8e2d2', 1.5, .2, -2.78);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { add(G.cyl(.045, .045, .26, 10), '#cfe8f6', 2.52 + i * .1, .13, -1.75 + j * .1); add(G.cyl(.02, .02, .03, 8), '#4d8fd6', 2.52 + i * .1, .275, -1.75 + j * .1); }
    // (10/29 대수선 "대충 그린 모델": 원기둥+상자 → 장화 한 켤레 — 굽은 목, 반사 띠, 둥근 앞코, 검은 밑창, 한 짝은 살짝 기울게)
    for (const [dz, tl] of [[0, 0], [.17, .12]]) {
      const bx = 2.2, bz = .72 + dz, YB = '#f2c14e', YD = '#d9a83a';
      add(G.cyl(.058, .064, .3, 14), YB, bx, .2, bz, tl, 0, 0); add(G.tor(.058, .014, PI * 2, 4, 14), YD, bx, .35, bz + tl * .15, HP + tl, 0, 0);
      add(G.cyl(.061, .065, .035, 14), '#f4f4ec', bx, .22, bz + tl * .03, tl, 0, 0);
      add(G.box(.13, .075, .19, .035, 2), YB, bx, .045, bz + .045); add(G.sph(.066, 12, 8), YB, bx, .05, bz + .13, 0, 0, 0, [1, .75, .9]);
      add(G.box(.135, .02, .25, .01), '#4a4858', bx, .01, bz + .06);
    }
    // ── the giant siren on the gable's peak: a squat stand
    const [rx0, ry0, rz0] = sirenAt(H);
    add(G.box(.62, .1, .5, .03), H ? P.stone : P.roofD, rx0, ry0 - .27, rz0); add(G.box(.5, .1, .42, .03), H ? '#f6e9d6' : P.roofL, rx0, ry0 - .18, rz0);
    add(G.cyl(.07, .09, .14, 12), P.steelD, rx0, ry0 - .07, rz0);
    // ── the giant hose reel's wall bracket on the right
    add(G.box(.3, .9, .12, .03), P.steelD, TX1 + .05, H ? 3.0 : 3.55, BZ + .25);
    add(G.cyl(.06, .06, .5, 10), P.steelD, TX1 + .55, H ? 3.0 : 3.55, BZ + .45, HP, 0, 0);
  }));
  // textured surfaces: the plaster back wall (one shape: the arch and the gable), its brick plinth, the garage's plastered side
  // wall and brick foot, the garage's concrete floor, the duty room's floorboards
  f.add(put(mesh(geo('fs3-backwall' + (H ? '-h' : ''), () => G.ext(backWall(H), BW, .02, 6)), TM('plaster')), 0, 0, BZ));
  if (H) helmetRoof(f);
  f.add(put(plTex(TX1 - GX0, .7, 'brick'), (GX0 + TX1) / 2, .35, BZ + BW + .03));
  f.add(put(plTex(FZ - BZ - .2, SPRING - .7, 'plaster'), GX0 + BW + .004, .7 + (SPRING - .7) / 2, (BZ + FZ) / 2 - .1, 0, HP, 0));
  f.add(put(plTex(FZ - BZ - .2, .7, 'brick'), GX0 + BW + .006, .35, (BZ + FZ) / 2 - .1, 0, HP, 0));
  f.add(put(plTex(GX1 - GX0 - .22, FZ - BZ - .22, 'concrete'), GC + .1, .012, (BZ + FZ) / 2 + .1, -HP, 0, 0));
  f.add(put(plTex(TX1 - GX1 - .06, DZ1 - DZ0 - .06, 'planks'), TC, FH + .033, (DZ0 + DZ1) / 2, -HP, 0, 0));
  // signs, posters and papers
  f.add(put(decal(.62, .44, rosterTex()), -.72, 1.75, BZ + BW + .04));
  f.add(put(decal(.3, .4, calendarTex()), .25, FH + 1.15, BZ + BW + .05));
  f.add(put(decal(.34, .26, drawingTex()), 1.62, FH + 1.38, BZ + BW + .05, 0, 0, -.06));
  f.add(put(decal(2.3, .63, signTex()), GC, SPRING + .5, FZ + .258));
  f.add(put(decal(.7, .23, dutyTex()), 1.0, FH + 1.66, BZ + BW + .06));
  f.add(put(decal(.36, .5, posterTex()), 2.1, FH + 1.1, BZ + BW + .05, 0, 0, .04));

  // 0 — the garage shutter: starts two-thirds up (the truck shows), rolls fully up into the steel box
  // (10/29 대수선: 드럼 둘레로 말리던 살들이 반지름 .15 원에 열두 장 겹쳐 서로 뚫고 상자 뒤로 삐져나옴 — 상자에 들어가면 숨김)
  const slats = [], N = 12, OPEN = SPRING - .3, SH = OPEN / N, SW = GX1 - GX0 - .72, Z = FZ - .12, TOP = SPRING - .3;
  for (let k = 0; k < N; k++) {
    const g = grp();
    g.add(mc('fs3-slat-' + (k ? 'p' : 'h'), ({ add }) => {
      add(G.box(SW, SH - .01, .05, .015), k % 4 === 3 ? '#f3c9b6' : P.cream, 0, 0, 0);
      add(G.box(SW - .1, .014, .012, .004), P.plasterD, 0, -SH / 2 + .012, .03);
      if (!k) { add(G.box(SW, .05, .07, .02), P.red, 0, -SH / 2 + .03, .01); add(G.box(.4, .045, .07, .018), P.steelD, 0, -.01, .05); }
    })); f.add(g); slats.push(g);
  }
  const shutter = f.part('shutter', slats, t => {
    const lift = .68 + .32 * t;
    slats.forEach((g, k) => {
      const y = SH * (k + .5) + lift * OPEN;
      if (y < TOP) { g.visible = true; g.position.set(GC, y, Z); g.rotation.x = 0; }
      else { g.visible = false; g.position.set(GC, TOP, Z); g.rotation.x = 0; }
    });
  }, { label: '차고 셔터 올리기', sfx: 'open_metal', dur: .95 });
  shutter.setOpen(0);

  // 1 — the giant siren: a red dome on a ring of four horns, the dome's lamp turning
  const siren = grp(); put(siren, ...sirenAt(H)); f.add(siren);
  siren.add(mc('fs3-siren-v2', ({ add, addM }) => {
    add(G.cyl(.25, .28, .1, 22), P.steel, 0, .02, 0); add(G.cyl(.27, .27, .02, 22), P.steelD, 0, .075, 0);
    for (let k = 0; k < 8; k++) { const a = k * PI / 4 + .2; add(G.sph(.02, 6, 4), P.steelD, Math.cos(a) * .26, .02, Math.sin(a) * .26); }
    add(G.box(.66, .05, .1, .02), P.steelD, 0, .1, 0);
    const horn = new THREE.LatheGeometry([[.05, -.1], [.055, 0], [.065, .1], [.085, .18], [.12, .25], [.17, .3], [.21, .33], [.22, .35], [.2, .36], [.18, .35]].map(([x, y]) => new THREE.Vector2(x * .8, y * .8)), 22);
    const Y = new THREE.Vector3(0, 1, 0);
    for (const sx of [-1, 1]) {
      const d = new THREE.Vector3(sx * Math.cos(.5), -.12, Math.sin(.5)).normalize(), q = new THREE.Quaternion().setFromUnitVectors(Y, d), at = new THREE.Vector3(sx * .3, .16, .02);
      add(G.box(.05, .14, .08, .015), P.steelD, sx * .3, .14, 0);
      addM(horn.clone(), new THREE.Matrix4().compose(at, q, new THREE.Vector3(1, 1, 1)), P.cream);
      addM(new THREE.CylinderGeometry(.14, .14, .012, 20), new THREE.Matrix4().compose(at.clone().addScaledVector(d, .268), q, new THREE.Vector3(1, 1, 1)), '#4a4458');
      addM(new THREE.TorusGeometry(.172, .016, 5, 22), new THREE.Matrix4().compose(at.clone().addScaledVector(d, .28), q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), HP)), new THREE.Vector3(1, 1, 1)), P.steelD);
      addM(new THREE.CylinderGeometry(.065, .065, .12, 14), new THREE.Matrix4().compose(at.clone().addScaledVector(d, -.12), q, new THREE.Vector3(1, 1, 1)), P.steelD);
    }
  }));
  const lamp = grp(); put(lamp, 0, .13, 0); siren.add(lamp);
  lamp.add(mc('fs3-siren-dome-v2', ({ add }) => {
    add(G.cyl(.17, .19, .06, 22), P.steel, 0, .03, 0); add(G.tor(.18, .015, PI * 2, 4, 22), P.steelD, 0, .06, 0, HP, 0, 0);
    add(new THREE.SphereGeometry(.165, 22, 12, 0, PI * 2, 0, HP), P.red, 0, .06, 0, 0, 0, 0, [1, 1.35, 1]);
    for (let k = 0; k < 10; k++) add(G.tor(.168, .011, HP, 4, 10), k ? '#f37a6c' : '#ffffff', 0, .06, 0, 0, k * PI / 5, 0, [1, 1.35, 1]);
    add(G.cyl(.05, .07, .05, 14), P.steel, 0, .3, 0); add(G.sph(.03, 8, 6), P.steelD, 0, .34, 0);
  }));
  const sirenP = f.part('spin', [siren, lamp], t => { lamp.rotation.y = t * PI * 6; siren.rotation.y = .12 * Math.sin(t * PI * 10) * (1 - t); }, { label: '사이렌 울리기', sfx: 'sirenFire', dur: 1.4 });
  sirenP.setOpen(0);

  // 2 — the duty-room duvet (lifts: something under it)
  // (사용자 10/29 "침대 들출 때 제발 벤딩 좀 줘라, 다른 천들처럼"): 두꺼운 판 대신 얇은 천 — 윗면·양옆·발치 늘어짐, 머리 쪽 접힌 시트;
  // 들면 발치부터 말려 올라감(gfx/clothbend.js, 다른 이불과 같은 방식)
  const bx = BX, bz = BBZ, quilt = grp(); put(quilt, bx, FH + .445, bz - .3); f.add(quilt);
  quilt.add(mc('fs3-quilt-v2', ({ add }) => {
    add(G.box(.94, .05, .9, .022), P.blue, 0, 0, .45);
    for (const sx of [-1, 1]) add(G.box(.016, .15, .9, .006), P.blue, sx * .478, -.07, .45);
    add(G.box(.96, .15, .016, .006), P.blue, 0, -.07, .908);
    for (const x of [-.28, 0, .28]) add(G.pbox(.04, .006, .86), '#ffffff', x, .027, .47);
    add(G.box(.95, .03, .16, .012), '#ffffff', 0, .03, .07); add(G.cyl(.022, .022, .95, 12), '#ffffff', 0, .03, -.01, 0, 0, HP);
  }));
  quilt.add(put(plTex(.88, .66, 'gingham'), 0, .0262, .56, -HP, 0, 0));
  const qp = f.part('lift', quilt, clothBend(f, quilt, { hinge: [0, 0, 0], along: [0, 0, 1], toward: [0, 1, 0], len: .91, turn: 2.3, rise: .1, flaps: true }), { label: '당직실 이불', sfx: 'lift', dur: .6 });

  // the giant hose reel (no part: a big still thing that is the building's sign)
  f.add(mc('fs3-giant-reel' + (H ? '-h' : ''), ({ add }) => {
    const cx = TX1 + .6, cy = H ? 3.0 : 3.55, cz = BZ + .55;
    for (const z of [cz - .32, cz + .32]) {
      add(G.cyl(.78, .78, .07, 30), P.red, cx, cy, z, HP, 0, 0);
      add(G.tor(.78, .035, PI * 2, 6, 30), P.redD, cx, cy, z + (z > cz ? .035 : -.035));
      for (let k = 0; k < 6; k++) { const a = k * PI / 3; add(G.cyl(.09, .09, .075, 12), P.redD, cx + Math.cos(a) * .52, cy + Math.sin(a) * .52, z + (z > cz ? .01 : -.01), HP, 0, 0); }
    }
    for (const r of [.48, .58, .66]) add(G.tor(r, .07, PI * 2, 6, 28), r === .58 ? '#f6e6c4' : P.cream, cx, cy, cz - .14);
    for (const r of [.48, .58, .66]) add(G.tor(r, .07, PI * 2, 6, 28), r === .58 ? P.cream : '#f6e6c4', cx, cy, cz + .14);
    add(G.cyl(.16, .16, .8, 16), P.brass, cx, cy, cz, HP, 0, 0); add(G.cyl(.08, .08, .86, 12), P.brassD, cx, cy, cz, HP, 0, 0);
    // the hose's end hangs down to a brass nozzle
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(cx + .66, cy, cz), new THREE.Vector3(cx + .78, cy - .5, cz + .05), new THREE.Vector3(cx + .7, cy - 1.05, cz + .1), new THREE.Vector3(cx + .6, cy - 1.3, cz + .14)]);
    add(new THREE.TubeGeometry(curve, 16, .06, 8, false), P.cream, 0, 0, 0);
    add(G.cyl(.075, .05, .3, 12), P.brass, cx + .58, cy - 1.45, cz + .15, .1, 0, 0); add(G.cyl(.09, .09, .06, 12), P.brassD, cx + .6, cy - 1.3, cz + .14);
  }));

  // hiding places
  f.spot('inside', null, bx, FH + .43, bz - .1, { part: qp, maxH: .38, label: '당직실 이불 아래', scale: .95 });
  f.spot('under', null, bx + .1, FH + .03, bz + .45, { maxH: .24, label: '당직실 침대 밑', scale: .85 });
  f.spot('on', null, 1.75, FH + .745, -3.33, { maxH: .35, label: '당직실 책상 위', scale: .9 });
  f.spot('under', null, 1.75, FH + .03, -3.4, { maxH: .5, label: '책상 밑', scale: .9 });
  f.spot('on', null, 2.68, FH + 1.02, -3.48, { maxH: .3, label: '옷 선반 위', scale: .75 });
  f.spot('on', null, -3.05, .74, -.25, { maxH: .5, label: '공구 수레 위', scale: .9 });
  f.spot('behind', null, 2.3, .02, -2.86, { maxH: .4, label: '타이어 더미 옆', scale: .9 });
  f.spot('on', null, PX + .2, .11, PZ + .2, { maxH: .5, label: '소방봉 매트 위', scale: .9 });
  f.spot('under', null, SX, .02, -1.4, { maxH: .7, label: '계단 밑', scale: .9 });
  f.spot('behind', null, 1.72, .02, -3.3, { maxH: .45, label: '호스 뭉치 뒤', scale: .9 });

  // walking: the walls, pillars, posts and the stairs' foot are barriers on the ground; upstairs is a deck reached by the stairs
  f.walkBoxes = [
    [GX0, 0, BZ, TX1 + .05, 2, BZ + BW + .12], [GX0, 0, BZ, GX0 + BW + .2, 2, FZ + .22],
    [GX0, 0, FZ - .22, GX0 + .34, 2, FZ + .22], [GX1 - .34, 0, FZ - .22, GX1, 2, FZ + .22],
    [GX1, 0, DZ1 - .08, GX1 + .14, 2, DZ1 + .08], [TX1 - .14, 0, DZ1 - .08, TX1, 2, DZ1 + .08],
    [SX - .34, 0, -1.2, SX + .36, .6, SZ0 - .05],
    // (the garage round the truck, the shade under the deck and the grass strip by the drying tower: no walking there — 보행 섬 0)
    [GX0, 0, BZ, GX1, .5, FZ - .05], [GX1, 0, BZ, TX1, .5, DZ1 - .05], [-IX - .1, 0, BZ, GX0, .5, .3], [-3.35, 0, -3.55, -2.65, .8, -3.05], [-1.2, 0, -3.6, -.6, .7, -3.0],
    [.75, 0, -3.7, 2.4, .7, -3.2], [-3.4, 0, -1.15, -3.15, .7, -.45], [PX - .08, 0, PZ - .08, PX + .08, 2, PZ + .08],
  ];
  f.walk = {
    areas: [{ x0: GX1 + 1.1, x1: TX1 - .1, z0: -3.15, z1: DZ1, y: FH + .03 }],
    paths: [{ width: .56, points: [[SX, 0, SZ0 + .45], [SX, 0, SZ0], [SX, FH + .03, DZ1 - .02], [SX, FH + .03, DZ1 - .3]] }],
  };
};

// ══ 19판 장치 셋, 우리 그림체로 새로 (① 10/24, 사용자 19판 메모 "종 … 개집. 디테일, 퀄리티 올려줘" · 18판 "지피티가 만든 스타일이 남아있어서
// 짜증나"): GPT 출동 종·소방견 집·호스 건조탑(gpt3k-fire-props.js)을 안전센터와 같은 재료(크림 회벽·순한 벽돌·흐린 남청 지붕·나무·놋쇠)로.
// 부품 순서·종류·숨김 자리는 GPT 것과 같게(장치 줄 gpt-chains-a.js CHAINS_A.firestation3의 dev 키만 새 이름으로).
addI18n({
  '출동 종': 'Call-out bell', '출동 벨 당기기': 'Pull the call-out bell', '출동 벨 받침 뒤': 'Behind the bell’s base', '종 받침 위': 'On the bell’s base',
  '소방견 집': 'Fire dog’s kennel', '소방견 집 지붕': 'Fire dog kennel roof', '소방견 방석 옆': 'Beside the fire dog’s cushion', '개집 앞 바닥': 'In front of the kennel',
  '개집 뒤': 'Behind the kennel', '호스 건조탑': 'Hose drying tower', '호스 건조탑 손잡이': 'Hose tower handwheel', '건조 호스 아래': 'Under the drying hoses',
  '건조탑 앞 바닥': 'In front of the hose tower', '소방견': 'FIRE DOG', '출동': 'CALL-OUT', '소화': 'FIRE',
  '분리수거함 뒤': 'Behind the recycling bins', '당직실 이불 아래': 'Under the duty-room quilt', '당직실 침대 밑': 'Under the duty-room bed',
  '당직실 책상 위': 'On the duty-room desk', '책상 밑': 'Under the desk', '옷 선반 위': 'On the clothes shelf', '공구 수레 위': 'On the tool cart',
  '타이어 더미 옆': 'Beside the tyre pile', '소방봉 매트 위': 'On the pole’s mat', '계단 밑': 'Under the stairs', '호스 뭉치 뒤': 'Behind the hose rolls',
  '호스 걸이 아래 선반': 'Shelf under the hose rack', '호스 장비': 'HOSE GEAR', '차고 셔터 올리기': 'Raise the garage shutter', '사이렌 울리기': 'Sound the siren', '당직실 이불': 'Duty-room quilt',
  '안전센터 둥근 섬': 'Fire station island', '곰돌이네 119 안전센터': 'Bear’s 119 Fire Station', '안전센터 훈련 마당': 'Fire station drill yard',
});
// small lettered plates (the game font, translated in English mode)
const plateTex = (key, text, w, h, bg, fg, border) => tex('plate-' + key, w, h, (c, W, H) => {
  c.fillStyle = bg; roundRect(c, 2, 2, W - 4, H - 4, Math.min(W, H) * .22); c.fill();
  if (border) { c.strokeStyle = border; c.lineWidth = Math.max(3, H * .07); roundRect(c, 6, 6, W - 12, H - 12, Math.min(W, H) * .18); c.stroke(); }
  fitText(c, text, W / 2, H / 2 + 2, W * .8, H * .56, fg, { weight: '800' });
});
// a gable roof of two shingled slabs (ridge along z when along = 'z'), its ridge cap — in the station's slate blue
function gableRoof(add, cx, y0, cz, span, len, rise, th = .06, along = 'z') {
  const a = Math.atan2(rise, span / 2), L = Math.hypot(span / 2, rise) + .08, rows = Math.max(3, Math.round(L / .11));
  for (const s of [-1, 1]) {
    const mx = s * span / 4, my = y0 + rise / 2;
    const P3 = (u, v) => along === 'z' ? [cx + u, v, cz] : [cx, v, cz + u];
    const rot = along === 'z' ? [0, 0, -s * a] : [s * a, 0, 0];
    const [bx, by, bz] = P3(mx, my);
    add(along === 'z' ? G.box(L, th, len, .02) : G.box(len, th, L, .02), P.roofD, bx, by, bz, ...rot);
    for (let k = 0; k < rows; k++) {
      const t = (k + .5) / rows - .5, du = Math.cos(a) * t * L * s, dv = -Math.sin(a) * t * L;
      const [rx, ry, rz] = P3(mx + du, my + dv + th * .75);
      add(along === 'z' ? G.box(L / rows + .012, th * .6, len + .02, .012) : G.box(len + .02, th * .6, L / rows + .012, .012), k % 2 ? P.roof : P.roofL, rx, ry, rz, ...rot);
    }
  }
  const [qx, qy, qz] = along === 'z' ? [cx, y0 + rise + th * .6, cz] : [cx, y0 + rise + th * .6, cz];
  add(along === 'z' ? G.box(.12, .1, len + .06, .03) : G.box(len + .06, .1, .12, .03), P.roofD, qx, qy, qz);
}

// ── 출동 종 (1×1): a little bell house on a brick plinth — two wooden posts with brass bands and knee braces, a shingled gable
// roof with a red lamp on the ridge, a big brass bell on a yoke between brass bearings, its rope down to a red-and-cream grip,
// a rope cleat with a few turns on the post, a red fire bucket on a hook, the "출동" plate on the plinth
B.fs3_bell = f => {
  const PY = .36, PX = .31, TOP = 2.06, AX = 1.86;
  f.add(mc('fs3-bell-house', ({ add, tube }) => {
    add(G.box(.94, .1, .8, .03), P.stone, 0, .05, 0);
    add(G.box(.82, .22, .68, .04), P.brick, 0, .21, 0);
    for (let i = 0; i < 4; i++) add(G.box(.18, .085, .02, .012), '#f0b49c', -.3 + i * .2, .14, .345); for (let i = 0; i < 2; i++) add(G.box(.18, .085, .02, .012), '#f0b49c', -.3 + i * .6, .25, .345);
    add(G.box(.37, .14, .016, .01), P.brassD, 0, .23, .352);
    add(G.box(.9, .06, .76, .025), P.stone, 0, PY - .03, 0);
    for (let k = 0; k < 9; k++) add(G.box(.1, .03, .012, .004), k % 2 ? '#3d3a44' : P.yellow, -.4 + k * .1, PY - .03, .383);
    for (const x of [-PX, PX]) {
      add(G.box(.2, .1, .2, .03), P.stone, x, PY + .05, 0);
      add(G.box(.13, TOP - PY, .13, .035), P.wood, x, (PY + TOP) / 2, 0);
      for (const y of [PY + .22, TOP - .3]) { add(G.box(.15, .05, .15, .015), P.brass, x, y, 0); for (const sx of [-1, 1]) add(G.sph(.012, 6, 4), P.brassD, x + sx * .04, y, .077); }
    }
    // the beams: a cross beam, the yoke's bearings, knee braces
    add(G.box(.86, .12, .2, .03), P.woodD, 0, TOP + .02, 0);
    for (const s of [-1, 1]) {
      tube([s * PX, TOP - .34, 0], [s * (PX - .22), TOP - .04, 0], .032, P.woodD, 6);
      add(G.cyl(.075, .075, .05, 16), P.brass, s * (PX - .085), AX, 0, 0, 0, HP); add(G.cyl(.03, .03, .07, 10), P.brassD, s * (PX - .1), AX, 0, 0, 0, HP);
    }
    // the roof and its gable boards, the lamp on the ridge
    gableRoof(add, 0, TOP + .1, 0, 1.1, .74, .34);
    for (const z of [-.33, .33]) { const sh = new THREE.Shape(); sh.moveTo(-.46, 0); sh.lineTo(.46, 0); sh.lineTo(0, .27); sh.lineTo(-.46, 0); add(G.ext(sh, .03, .008, 1), P.cream, 0, TOP + .1, z - .015); }
    add(G.cyl(.05, .05, .04, 10), P.steelD, 0, TOP + .48, .2); add(G.sph(.06, 12, 8), P.red, 0, TOP + .53, .2, 0, 0, 0, [1, 1.1, 1]);
    // the rope's eye under the beam, the cleat on the right post with three turns of rope, the bucket on the left post
    add(G.box(.04, .04, .16, .012), P.brassD, .17, TOP - .03, .13); add(G.tor(.03, .01, PI * 2, 4, 10), P.brassD, .17, TOP - .07, .2);
    add(G.box(.04, .04, .14, .012), P.brassD, PX + .08, 1.12, 0); for (let k = 0; k < 3; k++) add(G.tor(.035, .013, PI * 2, 4, 10), P.cream, PX + .1, 1.08 + k * .028, 0, HP, 0, 0);
    add(G.box(.06, .03, .03, .01), P.steelD, -PX - .08, 1.32, .02); tube([-PX - .1, 1.32, .02], [-PX - .17, 1.2, .02], .008, P.steelD, 4);
    add(G.cyl(.11, .085, .2, 14), P.red, -PX - .17, 1.08, .02); add(G.tor(.11, .012, PI * 2, 4, 16), P.redD, -PX - .17, 1.18, .02, HP, 0, 0);
    add(G.tor(.1, .008, PI, 4, 12), P.steelD, -PX - .17, 1.18, .02, 0, 0, 0);
  }));
  f.add(put(decal(.34, .12, plateTex('bell', '출동', 204, 72, P.brass, '#5a4434', '#c89232')), 0, .23, .3615));
  // the bell on its yoke: a waisted brass bell with a lip, two bands and the crown loop, the clapper inside
  const bell = grp(); put(bell, 0, AX, 0); f.add(bell);
  bell.add(mc('fs3-bell', ({ add }) => {
    add(G.box(.42, .1, .12, .03), P.woodD, 0, .02, 0); add(G.cyl(.022, .022, .5, 8), P.steelD, 0, 0, 0, 0, 0, HP);
    const prof = [[.0, -.06], [.07, -.06], [.1, -.08], [.13, -.15], [.15, -.26], [.17, -.36], [.22, -.44], [.27, -.5], [.29, -.53], [.28, -.56], [.24, -.55], [.2, -.5], [.15, -.42], [.12, -.3], [.09, -.15], [0, -.13]];
    add(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 26), P.brass, 0, 0, 0);
    add(G.tor(.152, .014, PI * 2, 5, 26), P.brassD, 0, -.27, 0, HP, 0, 0); add(G.tor(.25, .016, PI * 2, 5, 26), P.brassD, 0, -.48, 0, HP, 0, 0);
    add(G.tor(.05, .018, PI * 2, 6, 14), P.brassD, 0, -.02, 0);
    add(G.cyl(.012, .012, .32, 6), P.steelD, 0, -.32, 0); add(G.sph(.055, 12, 8), P.steelD, 0, -.5, 0);
  }));
  // the rope from the eye under the beam down to the grip
  const rope = grp(); put(rope, .17, TOP - .1, .2); f.add(rope);
  rope.add(mc('fs3-bell-rope', ({ add, tube }) => { tube([0, 0, 0], [.03, -.83, .14], .018, P.cream, 6); for (let k = 1; k < 8; k++) add(G.tor(.019, .005, PI * 2, 3, 8), '#e8d6b0', .03 * k / 8, -.83 * k / 8, .14 * k / 8, HP, 0, 0); }));
  const handle = grp(); put(handle, .2, TOP - .97, .34); f.add(handle);
  handle.add(mc('fs3-bell-grip', ({ add }) => { add(G.cap(.04, .14, 3, 10), P.red, 0, -.08, 0); for (const y of [-.02, -.14]) add(G.cyl(.043, .043, .025, 12), P.cream, 0, y, 0); add(G.sph(.03, 8, 6), P.red, 0, .02, 0); }));
  const p = f.part('pull', [bell, handle, rope], t => {
    const pull = .1 * Math.sin(t * PI);
    handle.position.y = TOP - .97 - pull; rope.scale.y = 1 + pull / .83;
    bell.rotation.x = .6 * Math.sin(t * PI * 3) * (1 - .35 * t);
  }, { label: '출동 벨 당기기', sfx: 'clink', dur: .8 });
  p.setOpen?.(0);
  f.spot('behind', null, -.18, PY, .14, { maxH: .3, label: '출동 벨 받침 뒤', scale: .8 });
};

// ── 소방견 집 (2×2): a little fire station for the fire dog — a plank deck with a step, cream walls with brick corner quoins,
// a round-arched door ringed with stone and brick voussoirs, a shingled roof (it lifts: part 0) with a red lamp on the ridge and
// the '소방견' plate in its gable, a gingham cushion inside with the sleeping shiba; outside a red bowl of kibble, a bone, a
// little helmet and the leash on hooks, a paw mat at the door, a toy hydrant
const DH = { W: 1.36, D: 1.16, H: .82, FY: .27 };
B.fs3_doghouse = (f, T) => {
  const { W, D, H, FY } = DH, hw = W / 2, hd = D / 2, DW = .74, DHt = .66;
  f.add(mc('fs3-doghouse', ({ add, addM, tube }) => {
    // deck, planks, a step at the front
    add(G.box(1.56, .24, 1.38, .04), P.woodD, 0, .12, 0);
    for (let k = 0; k < 7; k++) add(G.box(.2, .04, 1.36, .012), k % 2 ? P.wood : P.woodL, -.6 + k * .2, .26, 0);
    add(G.box(.7, .08, .2, .02), P.woodD, 0, .04, .78);
    // the walls: back and sides plain, the front with its arched door (one extruded shape)
    add(G.box(W, H, .08, .02), P.plaster, 0, FY + H / 2, -hd + .04);
    for (const s of [-1, 1]) add(G.box(.08, H, D, .02), P.plaster, s * (hw - .04), FY + H / 2, 0);
    const front = new THREE.Shape(); front.moveTo(-hw, 0); front.lineTo(-DW / 2, 0); front.lineTo(-DW / 2, DHt - DW / 2); front.absarc(0, DHt - DW / 2, DW / 2, PI, 0, true);
    front.lineTo(DW / 2, 0); front.lineTo(hw, 0); front.lineTo(hw, H); front.lineTo(-hw, H); front.lineTo(-hw, 0);
    add(G.ext(front, .08, .01, 10), P.plaster, 0, FY, hd - .09);
    // stone-and-brick ring round the door, a keystone with a bone on it
    for (let k = 0; k < 9; k++) { const a = PI * (k + .5) / 9, r = DW / 2 + .06; add(G.box(.1, .1, .1, .02), k % 2 ? P.brick : P.stone, Math.cos(a) * r, FY + DHt - DW / 2 + Math.sin(a) * r, hd + .0, 0, 0, a - HP); }
    for (const s of [-1, 1]) for (let y = .06; y < DHt - DW / 2; y += .12) add(G.box(.1, .1, .1, .02), (y * 100 | 0) % 24 < 12 ? P.brick : P.stone, s * (DW / 2 + .06), FY + y + .04, hd);
    add(G.box(.14, .14, .12, .025), P.stone, 0, FY + DHt + .08, hd + .01);
    // corner quoins
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) add(G.box(.12, .13, .12, .02), k % 2 ? P.stone : P.brick, s * (hw - .03), FY + .1 + k * .16, hd - .03);
    // inside: a dark back so the door reads, the cushion with its piping
    add(G.pbox(W - .18, H - .04, .01), '#c9b8a2', 0, FY + H / 2, -hd + .085);
    add(G.box(.98, .12, .76, .06), '#8fb8dc', 0, .35, -.03); add(G.tor(.36, .025, PI * 2, 4, 24), '#ffffff', 0, .41, -.03, HP, 0, 0, [1.3, 1, 1]);
    // the wall plate beside the door: a hook with the leash and a little red helmet
    for (const x of [-.535, .535]) add(G.box(.04, .04, .06, .01), P.brassD, x, FY + .62, hd + .03);
    add(G.sph(.062, 14, 8), P.red, -.535, FY + .56, hd + .07, 0, 0, 0, [1, .8, 1.05]); add(G.cyl(.082, .082, .012, 16), P.red, -.535, FY + .53, hd + .07);
    add(G.box(.035, .035, .01, .008), P.yellow, -.535, FY + .57, hd + .125);
    tube([.535, FY + .62, hd + .06], [.52, FY + .32, hd + .08], .012, '#4d8fd6', 5); tube([.52, FY + .32, hd + .08], [.55, FY + .22, hd + .07], .012, '#4d8fd6', 5); add(G.tor(.03, .01, PI * 2, 4, 10), P.steelD, .55, FY + .19, hd + .07, HP, 0, 0);
    // outside: the paw mat, the bowl of kibble, a bone, a toy hydrant
    add(G.box(.62, .02, .32, .01), '#f2b04a', 0, .01, .98);
    for (const [x, z] of [[-.18, .94], [-.05, 1.02], [.08, .94], [.2, 1.02]]) { add(G.cyl(.032, .032, .006, 10), '#c97f2a', x, .022, z); for (let k = 0; k < 3; k++) add(G.cyl(.012, .012, .006, 8), '#c97f2a', x - .025 + k * .025, .022, z - .04); }
    add(G.cyl(.15, .18, .1, 18), P.red, .58, .05, .95); add(G.cyl(.12, .12, .01, 16), '#8a5a34', .58, .095, .95);
    for (let k = 0; k < 7; k++) add(G.sph(.026, 6, 4), '#b87a4a', .58 + Math.cos(k * 2.3) * .06, .1, .95 + Math.sin(k * 2.3) * .06);
    add(G.tor(.15, .015, PI * 2, 4, 18), '#ffffff', .58, .1, .95, HP, 0, 0);
    add(G.cap(.025, .16, 2, 8), '#fff4dc', -.62, .03, .95, 0, .5, HP); for (const s of [-1, 1]) for (const t of [-.04, .04]) add(G.sph(.032, 8, 6), '#fff4dc', -.62 + s * .07 * Math.cos(.5) + t * Math.sin(.5) * .5, .03, .95 - s * .07 * Math.sin(.5) + t * Math.cos(.5) * .5);
    add(G.cyl(.05, .055, .16, 12), P.red, .76, .08, .55); add(G.sph(.05, 10, 6), P.red, .76, .16, .55, 0, 0, 0, [1, .7, 1]); for (const s of [-1, 1]) add(G.cyl(.02, .02, .04, 8), P.brass, .76 + s * .06, .1, .55, 0, 0, HP);
  }));
  f.add(put(plTex(.94, .72, 'gingham'), 0, .412, -.03, -HP, 0, 0));
  const dog = new Char('shiba');
  dog.shadow.removeFromParent(); dog.pose = 'cross'; dog.setFace('happy'); dog.update(0);
  dog.root.traverse(o => { if (o.isMesh) o.userData.noMerge = true; });
  dog.root.position.set(-.18, .415, -.05); dog.root.rotation.y = .12; f.add(dog.root);
  f.gptChars = [dog];
  // the roof (lifts from its back edge)
  const roof = grp(); put(roof, 0, FY + H, -hd - .08); f.add(roof);
  roof.add(mc('fs3-doghouse-roof', ({ add }) => {
    gableRoof(add, 0, 0, hd + .08, W + .26, D + .3, .44, .07, 'z');
    for (const z of [hd + .08 - (D + .3) / 2 + .17, hd + .08 + (D + .3) / 2 - .19]) { const sh = new THREE.Shape(); sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(0, .39); sh.lineTo(-hw, 0); add(G.ext(sh, .06, .01, 1), P.plaster, 0, 0, z - .03); }
    add(G.box(.08, .06, .08, .02), P.steelD, 0, .5, hd + .08 + (D + .3) / 2 - .14); add(G.sph(.07, 12, 8), P.red, 0, .57, hd + .08 + (D + .3) / 2 - .14, 0, 0, 0, [1, 1.15, 1]);
  }));
  roof.add(put(decal(.42, .14, plateTex('dog', '소방견', 252, 84, P.navy, P.cream)), 0, .15, hd + .08 + (D + .3) / 2 - .14));
  const p = f.part('lid', roof, t => { roof.rotation.x = -1.2 * t; dog.update(0); }, { label: '소방견 집 지붕', sfx: 'creak', dur: .6 });
  const s = f.spot('inside', null, .16, .37, -.05, { part: p, maxH: .35, label: '소방견 방석 옆', scale: .95 });
  // (10/29: no drawer slides out through the kennel wall — under the lifted roof the treat tray rises up to the eaves)
  fs3Drawer(f.pullOut(p, s, .67, { w: .38, d: .3, color: P.wood, up: .22 }), 'dog', .38, .3);
  f.spot('on', null, -.5, .025, 1.2, { maxH: .8, label: '개집 앞 바닥', scale: 1 });
};

// (19판 10/29 사용자 실폰 "열면 튀어나오는 거 허접해서 뭐가 뭔지 모르겠어"): 판자 한 장이던 pullOut 받침을 속 빈 서랍으로 — 바닥·세 벽·앞판·손잡이와 안 내용물.
// hose: 빨간 철 장비 서랍(이름표 '호스 장비'·막대 손잡이, 안 구석에 감긴 호스·놋쇠 노즐), dog: 소방견 간식 서랍(뼈다귀 손잡이, 안 구석에 사료 그릇·뼈)
function fs3Drawer(tr, kind, w, d) {
  const dog = kind === 'dog', WH = .07, FH = .1, fz = d / 2;
  tr.add(mc('fs3-drawer-' + kind, ({ add, tube }) => {
    const side = dog ? P.woodL : P.red, inner = dog ? P.wood : '#d9dde3';
    for (const s of [-1, 1]) add(G.box(.022, WH, d - .02, .006), side, s * (w / 2 - .011), .01 + WH / 2, -.01);
    add(G.box(w - .02, WH, .022, .006), side, 0, .01 + WH / 2, -fz + .011);
    for (const s of [-1, 1]) add(G.pbox(.004, WH - .01, d - .06), inner, s * (w / 2 - .024), .012 + WH / 2, -.01);
    add(G.box(w + .02, FH, .03, .01), dog ? P.red : P.redD, 0, FH / 2 - .01, fz - .012);
    add(G.box(w - .03, FH - .03, .008, .004), dog ? '#f0625a' : P.red, 0, FH / 2 - .01, fz + .004);
    if (dog) {
      add(G.cap(.013, .1, 2, 8), P.cream, 0, .042, fz + .03, 0, 0, HP);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(G.sph(.019, 10, 8), P.cream, sx * .064, .042 + sy * .014, fz + .03);
      for (const sx of [-1, 1]) add(G.cyl(.008, .008, .025, 6), P.brassD, sx * .03, .042, fz + .015, HP, 0, 0);
      const bx = -w / 2 + .075, bz = -fz + .07;
      add(G.cyl(.05, .042, .035, 16), P.blue, bx, .028, bz); add(G.cyl(.04, .04, .006, 14), '#9a6a40', bx, .043, bz);
      for (let k = 0; k < 6; k++) add(G.sph(.014, 6, 4), '#c88a52', bx + Math.cos(k * 2.3) * .022, .047, bz + Math.sin(k * 2.3) * .022);
      add(G.cap(.011, .06, 2, 6), P.cream, w / 2 - .06, .024, -.02, HP, 0, 0);
      for (const sz of [-1, 1]) for (const sx of [-1, 1]) add(G.sph(.016, 8, 6), P.cream, w / 2 - .06 + sx * .012, .024, -.02 + sz * .045);
    } else {
      for (const sx of [-1, 1]) add(G.box(.02, .02, .03, .006), P.steelD, sx * .07, .03, fz + .02);
      tube([-.08, .03, fz + .036], [.08, .03, fz + .036], .011, P.steel, 8);
      const hx = -w / 2 + .075, hz = -fz + .075;
      for (let k = 0; k < 2; k++) add(G.tor(.042 - k * .016, .011, PI * 2, 6, 18), k ? '#efdcb4' : P.cream, hx, .024 + k * .012, hz, HP, 0, 0);
      add(G.cyl(.016, .016, .02, 10), P.brass, hx + .045, .022, hz + .03);
      const nx = w / 2 - .055;
      add(G.cyl(.016, .026, .13, 12), P.brass, nx, .03, -.01, HP, 0, 0); add(G.cyl(.03, .03, .025, 12), P.red, nx, .03, .065, HP, 0, 0);
      add(G.cyl(.012, .012, .015, 8), P.brassD, nx, .03, -.082, HP, 0, 0);
    }
  }));
  if (!dog) tr.add(put(decal(.19, .042, plateTex('hosegear', '호스 장비', 228, 50, P.cream, P.redD)), 0, .072, fz + .009));
  return tr;
}
// ── 호스 건조탑 (2×2, placed at .7): a slim tower open at the front — a brick plinth, cream walls with brick quoins, a louvred
// band and a shingled hip roof with a red pennant; inside, two long flat hoses hang from the pulley bar (they rise when the
// handwheel on the front turns: part 0) over a boot shelf; a steel ladder up the left side
B.fs3_hosetower = f => {
  const W = 1.44, D = 1.36, HT = 3.9, hw = W / 2, hd = D / 2;
  f.add(mc('fs3-hosetower', ({ add, tube }) => {
    add(G.box(W + .16, .3, D + .16, .05), P.brick, 0, .15, 0); add(G.box(W + .22, .06, D + .22, .02), P.stone, 0, .32, 0);
    add(G.box(W, HT - .35, .12, .02), P.plaster, 0, .35 + (HT - .35) / 2, -hd + .06);
    for (const s of [-1, 1]) add(G.box(.14, HT - .35, D, .02), P.plaster, s * (hw - .07), .35 + (HT - .35) / 2, 0);
    for (const s of [-1, 1]) for (let k = 0; k < 9; k++) { const y = .55 + k * .38; add(G.box(.22, .2, .2, .025), k % 2 ? P.stone : P.brick, s * (hw - .05), y, hd - .06); add(G.box(.2, .2, .22, .025), k % 2 ? P.brick : P.stone, s * (hw - .05), y, -hd + .06); }
    // the louvred band at the top and the floor under it
    add(G.box(W + .08, .1, D + .08, .025), P.stone, 0, HT - .02, 0);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) add(G.box(.04, .07, D - .1, .01), P.roofD, s * (hw + .01), HT + .12 + k * .1, 0, 0, 0, s * .35);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) add(G.box(W - .1, .07, .04, .01), P.roofD, 0, HT + .12 + k * .1, s * (hd + .01), -s * .35, 0, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.12, .46, .12, .02), P.stone, sx * (hw - .02), HT + .27, sz * (hd - .02));
    add(G.box(W + .1, .08, D + .1, .02), P.stone, 0, HT + .52, 0);
    // the hip roof: four shingled faces up to a brass ball and the pennant
    const RH = .7, RY = HT + .56;
    for (let k = 0; k < 4; k++) {
      const r0 = (Math.max(W, D) / 2 + .2) * Math.SQRT2 * (1 - k / 4), r1 = (Math.max(W, D) / 2 + .2) * Math.SQRT2 * (1 - (k + 1) / 4);
      add(new THREE.CylinderGeometry(Math.max(.02, r1), r0, RH / 4, 4, 1), k % 2 ? P.roof : P.roofL, 0, RY + RH * (k + .5) / 4, 0, 0, PI / 4, 0);
      add(new THREE.CylinderGeometry(r0 + .015, r0 + .015, .035, 4, 1), P.roofD, 0, RY + RH * k / 4 + .012, 0, 0, PI / 4, 0);
    }
    add(G.cyl(.04, .04, .3, 8), P.steelD, 0, RY + RH + .1, 0); add(G.sph(.07, 12, 8), P.brass, 0, RY + RH + .27, 0);
    tube([0, RY + RH + .27, 0], [0, RY + RH + .95, 0], .018, P.steelD, 6);
    const pen = new THREE.Shape(); pen.moveTo(0, 0); pen.lineTo(.5, -.11); pen.lineTo(0, -.22); pen.lineTo(0, 0);
    add(G.ext(pen, .015, 0, 1), P.red, .02, RY + RH + .92, 0);
    // the pulley bar inside the top and its wheel
    for (const s of [-1, 1]) { add(G.box(.06, .22, .2, .02), P.steelD, s * (hw - .17), HT - .18, .05); for (const y of [-.1, -.26]) for (const z of [-.03, .13]) add(G.sph(.016, 8, 6), P.steel, s * (hw - .2), HT + y, z); }
    const SX = -hw + .14, SY = HT - .32, SZ = hd + .03;
    add(G.box(.08, .08, .34, .02), P.steelD, SX, SY + .2, hd - .1); for (let k = 0; k < 4; k++) add(G.box(.085, .085, .06, .006), k % 2 ? '#3d3a44' : P.yellow, SX, SY + .2, hd - .22 + k * .085);
    for (const s of [-1, 1]) { add(G.box(.018, .26, .16, .006), P.steelD, SX + s * .045, SY + .06, SZ); add(G.sph(.018, 8, 6), P.steel, SX + s * .058, SY, SZ); add(G.sph(.014, 8, 6), P.steel, SX + s * .058, SY + .16, SZ); }
    add(G.cyl(.022, .022, .13, 8), P.steel, SX, SY, SZ, 0, 0, HP);
    tube([SX, SY + .074, SZ], [SX, SY + .074, .05], .016, '#e9d7ae', 6);
    // the boot shelf inside (a hiding place sits on it) with two pairs of boots
    add(G.box(1.0, .06, .8, .02), P.wood, 0, .56, -.1); for (const x of [-.42, .42]) add(G.box(.06, .2, .76, .015), P.woodD, x, .44, -.1);
    for (const x of [-.32, -.14]) {
      add(G.cyl(.058, .064, .28, 14), '#f2c14e', x, .74, -.34); add(G.tor(.058, .014, PI * 2, 4, 14), '#d9a83a', x, .88, -.34, HP, 0, 0);
      add(G.cyl(.061, .065, .035, 14), '#f4f4ec', x, .76, -.34);
      add(G.box(.13, .075, .19, .035, 2), '#f2c14e', x, .635, -.295); add(G.sph(.066, 12, 8), '#f2c14e', x, .64, -.21, 0, 0, 0, [1, .75, .9]); add(G.box(.135, .02, .25, .01), '#4a4858', x, .6, -.29);
    }
    // the ladder up the left side, hoops from 1.8 m
    for (const z of [-.25, .25]) tube([-hw - .12, .35, z], [-hw - .12, HT + .3, z], .028, P.steelD, 6);
    for (let y = .55; y < HT + .2; y += .3) tube([-hw - .12, y, -.25], [-hw - .12, y, .25], .018, P.steel, 5);
    for (let y = 1.9; y < HT; y += .6) add(G.tor(.3, .018, PI, 4, 12), P.steelD, -hw - .14, y, 0, 0, HP, 0);
    for (const z of [-.25, .25]) { tube([-hw - .12, HT + .3, z], [-hw - .02, HT + .45, z * .8], .024, P.steelD, 6); add(G.box(.12, .05, .12, .015), P.steelD, -hw - .1, .38, z); for (let k = 0; k < 4; k++) add(G.box(.13, .03, .13, .005), k % 2 ? '#3d3a44' : P.yellow, -hw - .1, .44 + k * .03, z); }
    for (let y = 1.0; y < HT; y += .9) for (const z of [-.25, .25]) { add(G.box(.12, .035, .035, .008), P.steelD, -hw - .06, y, z); add(G.sph(.015, 8, 6), P.steel, -hw - .005, y, z); }
    // the handwheel's bracket on the front left quoin
    add(G.box(.16, .16, .1, .03), P.steelD, -hw + .05, 1.35, hd + .04); add(G.cyl(.035, .035, .16, 10), P.steelD, -hw + .05, 1.35, hd + .12, HP, 0, 0);
    add(G.box(.34, .44, .025, .01), P.steelD, -hw + .05, 1.35, hd + .055); for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(G.sph(.02, 8, 6), P.steel, -hw + .05 + sx * .14, 1.35 + sy * .19, hd + .07);
    for (let k = 0; k < 5; k++) add(G.box(.068, .06, .012, .004), k % 2 ? '#3d3a44' : P.yellow, -hw + .05 - .136 + k * .068, 1.6, hd + .066);
    add(G.box(.035, .1, .03, .008), P.red, -hw - .05, 1.47, hd + .1, 0, 0, -.5); add(G.sph(.016, 8, 6), P.steel, -hw - .03, 1.43, hd + .12);
    tube([-hw + .14, 1.35, hd + .12], [-hw + .14, HT - .32, hd + .12], .016, '#e9d7ae', 6);
    for (let k = 1; k < 9; k++) add(G.tor(.017, .004, PI * 2, 3, 8), '#d8c294', -hw + .14, 1.35 + (HT - 1.67) * k / 9, hd + .12, HP, 0, 0);
  }));
  const sheave = grp(); put(sheave, -hw + .14, HT - .32, hd + .03); f.add(sheave);
  sheave.add(mc('fs3-tower-sheave', ({ add }) => {
    const prof = [[.02, -.035], [.1, -.035], [.1, -.022], [.072, 0], [.1, .022], [.1, .035], [.02, .035]];
    add(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 22), P.red, 0, 0, 0, 0, 0, HP);
    add(G.tor(.074, .014, PI * 2, 4, 22), '#e9d7ae', 0, 0, 0, 0, HP, 0);
    add(G.cyl(.035, .035, .08, 12), P.brass, 0, 0, 0, 0, 0, HP);
    for (let k = 0; k < 4; k++) add(G.cyl(.012, .012, .075, 6), P.redD, 0, Math.cos(k * HP) * .055, Math.sin(k * HP) * .055, 0, 0, HP);
  }));
  // the hoses: two long flat cream hoses folded over the bar, brass couplings at their feet
  const hose = grp(); f.add(hose);
  hose.add(mc('fs3-tower-hose', ({ add }) => {
    for (const [x, c, l1, l2] of [[-.25, '#f3e2c0', 2.2, 1.9], [.2, '#f6f0e4', 2.0, 2.3]]) {
      add(new THREE.CylinderGeometry(.137, .137, .2, 14, 1, false, 0, PI), c, x, HT - .2, .05, 0, 0, HP);
      add(G.box(.2, l1, .035, .015), c, x, HT - .2 - l1 / 2, .17); add(G.box(.2, l2, .035, .015), c, x, HT - .2 - l2 / 2, -.07);
      add(G.cyl(.065, .065, .14, 12), P.brass, x, HT - .2 - l1 - .06, .17); add(G.cyl(.065, .065, .14, 12), P.brass, x, HT - .2 - l2 - .06, -.07);
      for (let k = 0; k < 3; k++) add(G.pbox(.2, .01, .004), '#e2cfa8', x, HT - .5 - k * .55, .19);
    }
    add(G.cyl(.06, .06, W - .44, 14), P.steelD, 0, HT - .2, .05, 0, 0, HP);
    for (let k = 0; k < 9; k++) add(G.cyl(.064, .064, (W - .44) / 9 - .004, 14), k % 2 ? '#3d3a44' : P.yellow, -(W - .44) / 2 + (k + .5) * (W - .44) / 9, HT - .2, .05, 0, 0, HP);
    for (const s of [-1, 1]) { add(G.cyl(.08, .08, .03, 14), P.steelD, s * (W - .44) / 2, HT - .2, .05, 0, 0, HP); add(G.cyl(.03, .03, .045, 6), P.steel, s * ((W - .44) / 2 + .03), HT - .2, .05, 0, 0, HP); }
    add(G.box(.16, .12, .12, .025), P.red, -.03, HT - .06, .05); for (const sx of [-1, 1]) add(G.sph(.016, 8, 6), P.steel, -.03 + sx * .05, HT - .06, .115);
    add(G.tor(.05, .016, PI * 2, 6, 16), P.steelD, -.03, HT + .03, .05);
    add(G.tor(.06, .022, PI * 1.35, 6, 18), P.steel, -.03, HT - .2, .05, 0, 0, PI * .82); add(G.sph(.026, 8, 6), P.steel, .03, HT - .14, .05);
  }));
  const wheel = grp(); put(wheel, -hw + .05, 1.35, hd + .22); f.add(wheel);
  wheel.add(mc('fs3-tower-handwheel', ({ add, tube }) => {
    add(G.tor(.24, .035, PI * 2, 7, 24), P.red, 0, 0, 0);
    for (let k = 0; k < 3; k++) { const a = k * PI / 3; tube([Math.cos(a) * .22, Math.sin(a) * .22, 0], [-Math.cos(a) * .22, -Math.sin(a) * .22, 0], .016, P.redD, 6); }
    add(G.cyl(.06, .06, .06, 12), P.brass, 0, 0, 0, HP, 0, 0); add(G.cyl(.03, .03, .14, 8), P.woodD, .17, .17, .06, HP, 0, 0);
    for (let k = 0; k < 6; k++) add(G.sph(.012, 6, 4), P.brassD, Math.cos(k * PI / 3) * .04, Math.sin(k * PI / 3) * .04, .032);
    add(G.cap(.036, .1, 3, 10), '#3d3a44', .17, .17, .14, HP, 0, 0); for (const z of [.1, .14, .18]) add(G.tor(.037, .007, PI * 2, 3, 12), '#5a5866', .17, .17, z);
    add(G.cyl(.09, .09, .1, 18), P.steelD, 0, 0, -.1, HP, 0, 0); for (const z of [-.152, -.048]) add(G.cyl(.13, .13, .014, 18), P.steel, 0, 0, z, HP, 0, 0);
    for (let k = 0; k < 5; k++) add(G.tor(.095, .014, PI * 2, 4, 18), k % 2 ? '#d8c294' : '#e9d7ae', 0, 0, -.135 + k * .021);
    for (let k = 0; k < 12; k++) { const a = k * PI / 6; add(G.box(.03, .03, .03, .006), P.brassD, Math.cos(a) * .135, Math.sin(a) * .135, -.17, 0, 0, a); }
  }));
  const p = f.part('crank', [wheel, hose], t => { wheel.rotation.z = -t * PI * 4; sheave.rotation.x = t * PI * 5; hose.position.y = .7 * t; hose.scale.y = 1 - .15 * t; }, { label: '호스 건조탑 손잡이', sfx: 'ratchet', dur: 1.05 });
  const s = f.spot('inside', null, .28, .61, .22, { part: p, maxH: .4, label: '건조 호스 아래', scale: .95 });
  fs3Drawer(f.pullOut(p, s, .65, { w: .45, d: .33, color: '#d9dde3' }), 'hose', .45, .33);
  // (10/29 1.0.280 사용자 "저 나오는 서랍도 어디서 나오는 거여, 또 크기도 안 맞고": the drawer slid out of thin air — a red steel equipment
  // cabinet on the boot shelf now holds it: top, sides and back round the drawer, a label plate and rivets, open at the front)
  f.add(mc('fs3-hose-cab', ({ add }) => {
    const cx = .28, y0 = .598, H = .15, W2 = .25, z0 = .04, z1 = .4, zc = (z0 + z1) / 2;
    for (const sx of [-1, 1]) add(G.box(.022, H, z1 - z0, .006), P.redD, cx + sx * W2, y0 + H / 2, zc);
    add(G.box(W2 * 2 + .022, .022, z1 - z0, .006), P.red, cx, y0 + H, zc); add(G.box(W2 * 2 + .022, .016, z1 - z0, .004), P.redD, cx, y0 - .008, zc);
    add(G.box(W2 * 2, H, .02, .006), P.redD, cx, y0 + H / 2, z0 + .01);
    for (const sx of [-1, 1]) for (const sy of [0, 1]) add(G.sph(.008, 6, 4), P.steel, cx + sx * W2, y0 + .02 + sy * (H - .04), z1 + .002);
    add(G.box(W2 * 2 + .04, .028, .03, .008), P.steelD, cx, y0 + H + .016, z1 - .01);
  }));
  f.spot('on', null, 0, .025, 1.3, { maxH: .8, label: '건조탑 앞 바닥', scale: 1 });
};

export const FS3_BUILDERS = B;
export const FS3_INFO = {
  fs3_island: { w: .1, d: .1, name: '안전센터 둥근 섬', price: 0, hidden: true, floor: true },
  fs3_villamark: { w: .1, d: .1, name: '햇살빌라(먼 동네)', price: 0, hidden: true },
  fs3_house: { w: 7, d: 4, name: '곰돌이네 119 안전센터', price: 0, hidden: true, floor: true },
  fs3_bell: { w: 1, d: 1, name: '출동 종', price: 0, hidden: true },
  fs3_doghouse: { w: 2, d: 2, name: '소방견 집', price: 0, hidden: true },
  fs3_hosetower: { w: 2, d: 2, name: '호스 건조탑', price: 0, hidden: true },
};

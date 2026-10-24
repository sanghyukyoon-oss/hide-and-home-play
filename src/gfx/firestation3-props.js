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
    for (const [x, z] of [[3.3, -.4], [3.25, .7], [4.5, -.2], [3.0, 1.95], [4.45, 1.6], [3.3, -2.9], [4.5, -2.6], [-4.4, -1.8], [-4.65, -.9], [-4.5, .1], [-4.3, 1.9]]) tuft(x, z);
    const flower = (x, z, c) => { add(G.cyl(.008, .008, .16, 4), P.leafD, x, .1, z); for (let k = 0; k < 5; k++) { const a = k * 1.256; add(G.sph(.03, 6, 4), c, x + Math.cos(a) * .035, .19, z + Math.sin(a) * .035, 0, 0, 0, [1, .5, 1]); } add(G.sph(.022, 6, 4), P.yellow, x, .2, z); };
    for (const [x, z, c] of [[4.6, .4, P.pink], [4.5, 1.05, '#ffffff'], [3.05, 2.05, P.pink], [-4.6, -.4, '#ffffff'], [-4.45, -1.3, P.pink], [4.6, -1.5, '#ffffff'], [-4.55, 1.7, P.pink]]) flower(x, z, c);
    const bush = (x, z, s) => { for (const [dx, dz, r] of [[0, 0, .32], [.26, .08, .24], [-.22, .1, .22], [.05, .22, .2]]) add(G.sph(r * s, 10, 8), dx > 0 ? P.leaf : P.leafD, x + dx * s, r * s * .85, z + dz * s, 0, 0, 0, [1, .85, 1]); };
    bush(4.45, -3.35, 1); bush(4.55, -1.95, .62);
    // recycling bins by the back corner: blue (paper), green (glass), yellow (cans) with their lids
    for (const [k, c] of [[0, '#6f9fd0'], [1, '#7fbf7a'], [2, '#f0c75a']]) {
      const x = 3.25 + k * .44, z = -1.75;
      add(G.box(.38, .56, .38, .04), c, x, .28, z); add(G.box(.42, .06, .42, .02), shadeHex(c, -.12), x, .59, z); add(G.box(.2, .02, .03, .01), '#ffffff', x, .4, z + .195);
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
const DZ0 = BZ + BW, DZ1 = -2.25, SX = 2.66, SZ0 = .4, PX = .85, PZ = -1.9, BX = GX1 + .62, BBZ = -3.05;
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
function helmetRoof(f) {
  f.add(mc('fs3-helmet', ({ add }) => {
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
  f.add(put(decal(.52, .58, badgeTex()), TC, HY + .63, HZ + 1.67, -.48, 0, 0));
}
B.fs3_house = (f, T, opts = {}) => {
  const H = !!opts?.helmet;
  f.noSolid = true; f.collideBox = [0, -.5, 0, .01, -.45, .01];
  f.add(mc('fs3-house-v2' + (H ? '-helmet' : ''), ({ add, tube }) => {
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
      for (let y = .3; y < SPRING; y += .48) add(G.box(.38, .2, .46, .03), P.brick, x, y, FZ);
      add(G.box(.42, .12, .5, .03), P.stone, x, SPRING, FZ);
    }
    const ring = new THREE.Shape(), ro = [GH + .02, ARCH + .32], ri = [GH - .28, ARCH + .02];
    for (let k = 0; k <= 20; k++) { const a = PI * k / 20, p = [GC + Math.cos(a) * ro[0], Math.sin(a) * ro[1]]; k ? ring.lineTo(p[0], p[1]) : ring.moveTo(p[0], p[1]); }
    for (let k = 20; k >= 0; k--) { const a = PI * k / 20; ring.lineTo(GC + Math.cos(a) * ri[0], Math.sin(a) * ri[1]); }
    ring.closePath();
    add(G.ext(ring, .4, .02, 6), P.stone, 0, SPRING, FZ - .2);
    for (let k = 0; k < 11; k++) { const a = PI * (k + .5) / 11; add(G.box(.08, .36, .44, .01), P.brick, GC + Math.cos(a) * (GH - .12), SPRING + Math.sin(a) * (ARCH + .17), FZ, 0, 0, a - HP); }
    const tym = new THREE.Shape(); tym.moveTo(GC - ri[0], 0); for (let k = 0; k <= 20; k++) { const a = PI - PI * k / 20; tym.lineTo(GC + Math.cos(a) * ri[0], Math.sin(a) * ri[1]); } tym.lineTo(GC - ri[0], 0);
    add(G.ext(tym, .08, .01, 4), P.plasterD, 0, SPRING, FZ - .04);
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
    // a tool cart behind the truck (its top is a hiding place) and a stack of spare tyres
    add(G.box(.62, .07, .42, .02), P.navy, -3.0, .7, -3.3); add(G.box(.62, .07, .42, .02), P.navy, -3.0, .35, -3.3);
    for (const [x, z] of [[-3.28, -3.48], [-2.72, -3.48], [-3.28, -3.12], [-2.72, -3.12]]) { add(G.cyl(.016, .016, .68, 6), P.steelD, x, .38, z); add(G.sph(.035, 6, 5), '#3a3a44', x, .035, z); }
    add(G.box(.2, .08, .14, .02), P.red, -3.12, .77, -3.3); add(G.box(.16, .05, .1, .02), P.yellow, -2.88, .76, -3.26);
    for (let k = 0; k < 3; k++) { add(G.tor(.24, .1, PI * 2, 8, 20), '#4b4b55', -.9, .1 + k * .2, -3.3, HP, 0, 0); add(G.cyl(.14, .14, .14, 14), '#c4c8ce', -.9, .1 + k * .2, -3.3); }
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
    rail(GX1 + .05, DZ1 + .05, .58, DZ1 + .05); rail(1.12, DZ1 + .05, 2.3, DZ1 + .05);
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
    for (let k = 0; k < 14; k++) {
      const a = PI * (k + .5) / 14, x = GC + Math.cos(a) * (GH + .1), y = SPRING + Math.sin(a) * (ARCH + .12);
      add(G.box(.42, .1, .72, .025), k % 2 ? P.roof : P.roofL, x, y + .02, BZ + .3, 0, 0, a - HP);
    }
    tube([GX0 + .05, SPRING - .1, BZ + .55], [GX0 + .05, .1, BZ + .55], .04, P.steelD, 8);
    // ── duty room (upstairs): a bed against the garage-side rail, a desk under the window, a little clothes shelf
    const bx = BX, bz = BBZ;
    add(G.box(.98, .26, 1.34, .05), P.woodD, bx, FH + .16, bz);
    add(G.box(.9, .14, 1.26, .06), P.cream, bx, FH + .34, bz);
    add(G.box(.98, .56, .08, .03), P.wood, bx, FH + .32, bz - .69);
    add(G.box(.6, .13, .3, .06), '#ffffff', bx, FH + .47, bz - .45, .1, 0, 0);
    for (const x of [bx - .32, bx + .32]) add(G.box(.13, .06, .26, .03), P.blue, x, FH + .03, bz + .85, 0, x > bx ? .2 : -.1, 0);
    // desk: drawers on the right, a lamp, an instant-ramen cup, a mug, a phone on its charger
    const dx = 1.95, dz = -3.42, DT = FH + .72;
    add(G.box(.9, .05, .5, .015), P.wood, dx, DT, dz);
    add(G.box(.04, .7, .46, .012), P.woodD, dx - .42, FH + .36, dz); add(G.box(.3, .7, .46, .02), P.woodD, dx + .29, FH + .36, dz);
    for (const y of [.18, .42]) add(G.box(.26, .2, .02, .01), P.woodL, dx + .29, FH + y, dz + .24);
    add(G.cyl(.07, .08, .03, 12), P.navy, dx - .3, DT + .04, dz - .12); tube([dx - .3, DT + .05, dz - .12], [dx - .22, DT + .38, dz - .1], .012, P.navy, 5);
    add(G.cone(.11, .14, 12), P.yellow, dx - .2, DT + .4, dz - .08, .3, 0, -.4);
    add(G.cyl(.07, .05, .1, 14), '#ffffff', dx + .28, DT + .075, dz + .02); add(G.cyl(.072, .072, .015, 14), P.red, dx + .28, DT + .12, dz + .02);
    add(G.box(.05, .006, .14, .002), '#f2c14e', dx + .3, DT + .13, dz + .02, 0, .4, 0);
    add(G.cyl(.045, .042, .09, 12), P.blue, dx + .05, DT + .07, dz + .12); add(G.tor(.03, .01, PI * 2, 4, 10), P.blue, dx + .1, DT + .07, dz + .12, 0, HP, 0);
    add(G.box(.08, .012, .15, .01), '#3a3a44', dx - .05, DT + .032, dz - .15, 0, .3, 0); tube([dx - .05, DT + .03, dz - .23], [dx - .08, DT - .3, dz - .25], .005, '#ffffff', 4);
    add(G.box(.36, .4, .04, .01), P.wood, dx, FH + .3, dz + .55); add(G.box(.36, .04, .36, .02), P.woodL, dx, FH + .44, dz + .4);
    // clothes shelf: folded duty shirts, a spare yellow helmet on top
    const sx0 = 2.68;
    add(G.box(.42, 1.0, .4, .02), P.woodD, sx0, FH + .5, -3.55); add(G.box(.36, .03, .34, .01), P.woodL, sx0, FH + .5, -3.52);
    for (let k = 0; k < 3; k++) add(G.box(.3, .06, .26, .025), k % 2 ? P.navy : '#f2c14e', sx0, FH + .56 + k * .065, -3.52);
    add(G.sph(.15, 12, 8), P.yellow, sx0, FH + 1.1, -3.55, 0, 0, 0, [1, .8, 1.1]); add(G.cyl(.19, .19, .02, 16), P.yellow, sx0, FH + 1.06, -3.55);
    // a washing line from the right post to the wall: socks and a towel
    tube([TX1 - .1, FH + 1.55, DZ1 - .1], [TX1 - .1, FH + 1.55, -3.6], .008, '#ffffff', 4);
    for (const [z, c, h] of [[-2.55, P.blue, .2], [-2.75, '#ffffff', .2], [-3.05, P.pink, .44]]) add(G.box(.03, h, h > .3 ? .3 : .09, .01), c, TX1 - .1, FH + 1.55 - h / 2, z);
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
    for (let k = 0; k < 2; k++) { add(G.tor(.22, .08, PI * 2, 6, 18), '#f2dcae', 1.0 + k * .55, .09, -3.45, HP, 0, 0); add(G.cyl(.12, .12, .1, 12), P.brass, 1.0 + k * .55, .09, -3.45); }
    add(G.box(.5, .38, .4, .03), '#d9b384', 2.1, .19, -3.5); add(G.box(.4, .3, .36, .03), '#cfa575', 2.15, .53, -3.5, 0, .2, 0);
    add(G.box(.5, .02, .1, .005), '#f0e2b8', 2.1, .385, -3.4);
    // life upstairs: a little electric fan, a box of instant noodles, a backpack slumped by the shelf
    add(G.cyl(.13, .15, .03, 14), '#ffffff', 1.25, FH + .05, -2.55); add(G.cyl(.02, .02, .45, 6), '#ffffff', 1.25, FH + .27, -2.55);
    add(G.tor(.16, .015, PI * 2, 4, 20), P.blue, 1.25, FH + .55, -2.53); add(G.cyl(.05, .05, .07, 10), '#ffffff', 1.25, FH + .55, -2.58, HP, 0, 0);
    for (let k = 0; k < 3; k++) add(G.box(.13, .03, .36, .01), P.blue, 1.25 + Math.cos(k * 2.1) * .07, FH + .55 + Math.sin(k * 2.1) * .07, -2.52, 0, 0, k * 2.1);
    add(G.box(.42, .26, .3, .02), '#f2b04a', 1.95, FH + .14, -2.95); add(G.box(.3, .1, .005, .002), P.red, 1.95, FH + .16, -2.8);
    add(G.box(.32, .4, .2, .08), '#6f8fb0', 2.4, FH + .21, -3.05, 0, -.3, .1); add(G.box(.2, .14, .06, .04), '#5b7a99', 2.43, FH + .17, -2.93, 0, -.3, .1);
    // downstairs life: a mop in its bucket, a six-pack of water under the stairs, rubber boots drying by the stair foot
    add(G.cyl(.16, .13, .3, 14), '#79a9d6', -.55, .15, -2.55); add(G.cyl(.15, .15, .02, 14), '#9fc4e6', -.55, .27, -2.55);
    add(G.cyl(.016, .016, 1.25, 6), P.woodD, -.55, .78, -2.6, .12, 0, .05); add(G.box(.08, .1, .2, .03), '#e8e2d2', -.55, .25, -2.6);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { add(G.cyl(.045, .045, .26, 10), '#cfe8f6', 2.52 + i * .1, .13, -1.75 + j * .1); add(G.cyl(.02, .02, .03, 8), '#4d8fd6', 2.52 + i * .1, .275, -1.75 + j * .1); }
    for (const dz of [0, .15]) { add(G.cyl(.06, .065, .32, 10), '#f2c14e', 2.2, .2, .75 + dz); add(G.box(.12, .07, .2, .03), '#f2c14e', 2.2, .035, .79 + dz); }
    // ── the giant siren on the gable's peak: a squat stand
    const [rx0, ry0, rz0] = sirenAt(H);
    add(G.box(.5, .18, .5, .04), H ? P.stone : P.roofD, rx0, ry0 - .22, rz0);
    add(G.cyl(.36, .42, .14, 20), P.steelD, rx0, ry0 - .07, rz0);
    // ── the giant hose reel's wall bracket on the right
    add(G.box(.3, .9, .12, .03), P.steelD, TX1 + .05, 3.55, BZ + .25);
    add(G.cyl(.06, .06, .5, 10), P.steelD, TX1 + .55, 3.55, BZ + .45, HP, 0, 0);
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
  f.add(put(decal(2.3, .63, signTex()), GC, SPRING + .5, FZ + .23));
  f.add(put(mesh(G.box(2.4, .72, .06, .02), mat(P.red)), GC, SPRING + .5, FZ + .19));
  f.add(put(decal(.7, .23, dutyTex()), 1.0, FH + 1.66, BZ + BW + .06));
  f.add(put(decal(.36, .5, posterTex()), 2.1, FH + 1.1, BZ + BW + .05, 0, 0, .04));

  // 0 — the garage shutter: starts two-thirds up (the truck shows), rolls fully up round the drum
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
      else { const a = (y - TOP) / .15; g.visible = a < PI * 1.6; g.position.set(GC, TOP + Math.sin(a) * .15, Z - .15 + Math.cos(a) * .15); g.rotation.x = -a; }
    });
  }, { label: '차고 셔터 올리기', sfx: 'open_metal', dur: .95 });
  shutter.setOpen(0);

  // 1 — the giant siren: a red dome on a ring of four horns, the dome's lamp turning
  const siren = grp(); put(siren, ...sirenAt(H)); f.add(siren);
  siren.add(mc('fs3-siren', ({ add }) => {
    add(G.cyl(.3, .34, .16, 20), P.steel, 0, .08, 0);
    for (let k = 0; k < 4; k++) {
      const a = k * HP + PI / 4, c = Math.cos(a), s = Math.sin(a);
      add(G.cyl(.09, .2, .42, 14, true), P.steel, c * .38, .1, s * .38, 0, -a, HP);
      add(G.cyl(.21, .21, .04, 14), P.steelD, c * .59, .1, s * .59, 0, -a, HP);
    }
    add(G.cyl(.36, .36, .1, 20), P.redD, 0, .22, 0);
  }));
  const lamp = grp(); put(lamp, 0, .27, 0); siren.add(lamp);
  lamp.add(mc('fs3-siren-dome', ({ add }) => {
    add(new THREE.SphereGeometry(.38, 20, 12, 0, PI * 2, 0, HP), P.red, 0, 0, 0);
    add(G.sph(.1, 10, 8), '#ffffff', -.14, .24, .14, 0, 0, 0, [1, .6, 1]);
    add(G.cyl(.07, .09, .1, 12), P.redD, 0, .4, 0); add(G.sph(.06, 10, 8), P.yellow, 0, .47, 0);
    add(G.box(.06, .26, .3, .02), '#ffe7a0', .3, .1, 0, 0, 0, -.5);
  }));
  const sirenP = f.part('spin', [siren, lamp], t => { lamp.rotation.y = t * PI * 6; siren.rotation.y = .12 * Math.sin(t * PI * 10) * (1 - t); }, { label: '사이렌 울리기', sfx: 'sirenFire', dur: 1.4 });
  sirenP.setOpen(0);

  // 2 — the duty-room duvet (lifts: something under it)
  const bx = BX, bz = BBZ, quilt = grp(); put(quilt, bx, FH + .42, bz - .3); f.add(quilt);
  quilt.add(mc('fs3-quilt', ({ add }) => {
    add(G.box(.94, .11, .9, .05), P.blue, 0, 0, .45);
    for (const x of [-.28, 0, .28]) add(G.box(.05, .012, .88, .006), '#ffffff', x, .058, .45);
    add(G.box(.92, .05, .18, .02), '#ffffff', 0, .07, .06);
  }));
  quilt.add(put(plTex(.9, .7, 'gingham'), 0, .057, .55, -HP, 0, 0));
  const qp = f.part('lift', quilt, t => { quilt.rotation.x = -1.0 * t; }, { label: '당직실 이불', sfx: 'rustle' });

  // the giant hose reel (no part: a big still thing that is the building's sign)
  f.add(mc('fs3-giant-reel', ({ add }) => {
    const cx = TX1 + .6, cy = 3.55, cz = BZ + .55;
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
  f.spot('on', null, -3.0, .74, -3.3, { maxH: .5, label: '공구 수레 위', scale: .9 });
  f.spot('behind', null, -.6, .02, -3.05, { maxH: .4, label: '타이어 더미 옆', scale: .9 });
  f.spot('on', null, PX + .2, .11, PZ + .2, { maxH: .5, label: '소방봉 매트 위', scale: .9 });
  f.spot('under', null, SX, .02, -1.4, { maxH: .7, label: '계단 밑', scale: .9 });
  f.spot('behind', null, 1.6, .02, -3.3, { maxH: .5, label: '호스 뭉치 뒤', scale: .9 });
  f.spot('on', null, -1.2, 1.0, -3.45, { maxH: .25, label: '호스 걸이 아래 선반', scale: .7 });

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

export const FS3_BUILDERS = B;
export const FS3_INFO = {
  fs3_island: { w: .1, d: .1, name: '안전센터 둥근 섬', price: 0, hidden: true, floor: true },
  fs3_villamark: { w: .1, d: .1, name: '햇살빌라(먼 동네)', price: 0, hidden: true },
  fs3_house: { w: 7, d: 4, name: '곰돌이네 119 안전센터', price: 0, hidden: true, floor: true },
};

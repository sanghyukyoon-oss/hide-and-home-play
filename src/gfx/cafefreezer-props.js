// 39판 새 맵 '카페 지하 냉동 창고' cafefreezer (⑨ 10/23 — 스토리 룸 34~70 표: 39판 빨래방★ → 카페 지하 냉동 창고, 친구 파르페).
// 카페 1층에서 계단으로 내려오는 지하 창고를 흙 속에 판 단면 디오라마로: 뒤(북)·왼쪽(서)은 1층 높이까지 흙 띠(잘린 면에 지층·자갈·
// 수도관), 북쪽 띠 위에는 카페 1층 한 줄(나무 바닥·계산대·케이크 진열장·커피 머신), 서쪽 띠 위에는 잔디와 꽃 상자.
// 지하 안은 둘로: 왼쪽 뒤 = 냉동실(흰 단열 패널·성에, 앞·옆 벽은 무릎 높이로 잘려 단열재 단면이 보임), 오른쪽 = 창고 앞방(민트 칠한
// 콘크리트, 계단·사물함·수레·대걸레). 모티프 다섯: 두꺼운 냉동 문(빈 핸들 소켓) · 큰 얼음 블록(파르페가 비침) · 성에 낀 철제 선반 ·
// 아이스크림 통 줄과 업소용 냉동고 · 석유난로 모양 온풍기. 큰 면은 순한 하늘·민트·흰 성에, 쨍한 색은 통 라벨·딸기·온풍기 주황에만.
//
// 장치 부품 (② 레벨이 devices.js PLANS·RUN·TELL.freezer로 주 연쇄를 얹음 — 이 파일은 부품만; 흐름: 핸들 → 냉동 문 → 바구니가 저절로
// 내려옴 → 온풍기 터치 → 얼음이 녹아 파르페):
//   fz_coldroom      parts[0] 냉동 문: kind 'door', device 'freezer', t 0..1 = 문이 바깥(+x)으로 열림, 숨김 자리 없음.
//                      f.handleAt 핸들 꽂는 자리(가구 안 좌표 — 이 가구는 방 가운데 a 0이라 방 좌표와 같음), 처음엔 빈 소켓이 보임
//                      f.handle   둥근 바퀴 핸들 그룹(처음 visible=false, rotation.z로 돌리면 문 면 위에서 빙글), 문과 같이 움직임
//                      f.mistAt   냉기 김 나올 자리(문 안쪽 가운데) · f.doorAt 문 바깥 가운데
//   fz_basketpulley  냉동실 안 도르래 높은 선반 + 매달린 바구니(f.basket, f.basketUp/f.basketDown, f.setBasket(k), f.setRope()),
//                      parts[0] 바구니 속 얼음(잠글 수 없음, 숨김 자리 하나 = 파르페), f.ice, f.iceAt, f.setMelt(t) — 아래 그 절 참고.
//   fz_heater        parts[0] 온풍기: kind 'switch', t 0..1 = 다이얼이 돌고 위 난로 팬 날개가 돌며 열선이 빨갛게(f.setHeat(t)), 숨김 자리 없음.
//                      f.warmAt 따뜻한 바람 나올 자리(앞 철망, 가구 안 좌표), f.knob·f.fan 그룹. 앞(+z)이 바구니가 내려오는 자리를 봄.
// 보조 장치 (gpt-chains.js CHAINS.cafefreezer의 aux — ★ 판에선 aux만 돎, 등록은 cafefreezer-map.js): fz_icecreamchest 미닫이 뚜껑,
//   fz_flipsign 팻말 뒤집기('고장' → '영하 18도'), fz_frostshelf 성에 덩어리(톡 → 와르르, 뒤 칸이 보임).
// 잠글 수 있는 부품: fz_locker 왼쪽·오른쪽 문, fz_supplycab 계단 밑 수납장 문 (셋, 다 앞이 트인 쪽).
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, shade, fadeDisc } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';

const PI = Math.PI, HP = PI / 2;
const K = (ko, en) => { EN[ko] ??= en; return ko; };
// 큰 면: 순한 하늘·민트·흰 성에 / 포인트: 통 라벨·딸기·온풍기 주황
const PANEL = '#eef5fa', PANEL2 = '#dbe8f1', SEAM = '#c3d6e4', FROST = '#ffffff', FROSTB = '#e4f4fb', ICE = '#bfe9f7', ICED = '#8fd0ea',
  STEEL = '#cbd4de', STEELD = '#9aa8b8', CHROME = '#e6edf3', FOAM = '#f2d77e', CONC = '#e2e9e6', MINTW = '#cde8dd', MINTWD = '#a7d0c1', CREAM = '#fbf4e4',
  EARTH = '#a3825f', EARTH2 = '#8a6b4d', EARTH3 = '#6f553e', GRASS = '#93cf7c', GRASS2 = '#71b965', WOOD = '#e4b47e', WOODD = '#a8733f',
  ORANGE = '#f0893c', ORANGED = '#c9682a', RED = '#e8414e', PINK = '#ff9fb8', MINT = '#7fd6c0', CHOCO = '#8a5a3c', YEL = '#ffd25c', INK = '#3e3b55',
  SKYB = '#a9cbe6', SKYBD = '#86aed0', KRAFT = '#e2bb85', KRAFTD = '#c69a62', MILK = '#5aa9ec';
const B = {};
const rnd = s => { let a = s * 9301 + 49297; return () => ((a = (a * 9301 + 49297) % 233280) / 233280); };
const live = o => { o.traverse(m => { if (m.isMesh) m.userData.noMerge = true; }); return o; };
const frosty = o => { o.traverse(m => { if (m.isMesh) { m.userData.noMerge = true; m.userData.fzFrost = true; } }); o.userData.fzFrost = true; return o; };
const tex = (w, h, draw, rep) => { const t = canvasTex(w, h, draw); if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
const plane = (w, h, m, x, y, z, rx = 0, ry = 0) => { const p = mesh(new THREE.PlaneGeometry(w, h), m, { cast: false }); put(p, x, y, z, rx, ry, 0); return p; };
const tmat = (t, o = {}) => mat('#ffffff', { map: t, rough: .85, rim: .1, ...o });

// ── 크기 (방 6 × 6 m, 가운데가 원점, 바닥 y 0) ──────────────────────────────────────────────────────────────────
const X0 = -3, X1 = 3, Z0 = -3, Z1 = 3, UP = 2.9, ST = .72;   // 1층 높이, 흙 띠 두께
const FZ = { x1: .3, z1: .6 };                 // 냉동실: x -3 ~ .3, z -3 ~ .6
const DOOR = { z0: -1.8, z1: -.8, h: 2.0 }, CH = 2.4, CZ0 = -2.02, CZ1 = -.58, PT = .14;   // 문 · 문틀 덩어리 높이·범위 · 패널 두께
const STAIR = { x0: 2.0, x1: 2.95, n: 12 };    // 계단: z 0(바닥) → -3(1층)
const IS = { x0: X0 - ST - .12, x1: X1 + .3, z0: Z0 - ST - .12, z1: Z1 + .3, r: 1.0 };

// ── 그림 ─────────────────────────────────────────────────────────────────────────────────────────────────
const MEMO = {};
const once = (k, f) => MEMO[k] || (MEMO[k] = f());
// 냉동실 단열 패널: 세로 이음매, 가로 리브, 위쪽 성에 얼룩과 얼음 결정 (1.2 m 한 장)
const panelTex = () => once('panel', () => tex(256, 256, (c, W, H) => {
  c.fillStyle = PANEL; c.fillRect(0, 0, W, H);
  c.fillStyle = PANEL2; for (let x = 0; x < W; x += 128) c.fillRect(x + 124, 0, 4, H);
  c.fillStyle = '#e4eef5'; for (let y = 20; y < H; y += 42) c.fillRect(0, y, W, 3);
  const r = rnd(4);
  for (let i = 0; i < 22; i++) { const x = r() * W, y = r() * H * .5; c.fillStyle = `rgba(255,255,255,${.5 + r() * .4})`; c.beginPath(); c.ellipse(x, y, 14 + r() * 26, 6 + r() * 10, 0, 0, PI * 2); c.fill(); }
  c.strokeStyle = 'rgba(170,215,240,.8)'; c.lineWidth = 2;
  for (let i = 0; i < 9; i++) { const x = r() * W, y = r() * H, s = 5 + r() * 5; for (let k = 0; k < 3; k++) { const a = k * PI / 3; c.beginPath(); c.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s); c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); c.stroke(); } }
}, [1 / 1.2, 1 / 1.2]));
// 앞방 벽: 아래 민트 칠, 위 크림, 콘크리트 결과 작은 구멍 (1.5 m 한 장)
const wallTex = () => once('wall', () => tex(256, 256, (c, W, H) => {
  c.fillStyle = '#f2f4ec'; c.fillRect(0, 0, W, H);
  const r = rnd(7);
  for (let i = 0; i < 160; i++) { c.fillStyle = r() < .5 ? 'rgba(160,170,160,.12)' : 'rgba(255,255,255,.4)'; c.fillRect(r() * W, r() * H, 2 + r() * 3, 2 + r() * 3); }
  c.strokeStyle = 'rgba(150,165,160,.25)'; c.lineWidth = 2; for (let y = 0; y < H; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
}, [1 / 1.5, 1 / 1.5]));
// 흙 단면: 지층 띠, 자갈, 잔뿌리 (1.6 m 한 장, 위쪽이 땅 위)
const soilTex = () => once('soil', () => tex(256, 256, (c, W, H) => {
  const bands = [[0, '#8f6e50'], [.22, '#a3825f'], [.5, '#977656'], [.74, '#86684c']];
  bands.forEach(([y, col], i) => { c.fillStyle = col; c.fillRect(0, y * H, W, (i < 3 ? bands[i + 1][0] - y : 1 - y) * H + 1); });
  const r = rnd(12);
  for (let i = 0; i < 46; i++) { const x = r() * W, y = r() * H, s = 3 + r() * 7; c.fillStyle = ['#c4b6a2', '#b3a48f', '#d4c8b4', '#9d8f7c'][i % 4]; c.beginPath(); c.ellipse(x, y, s * 1.3, s, r() * PI, 0, PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(x - s * .3, y - s * .3, s * .4, s * .25, 0, 0, PI * 2); c.fill(); }
  c.strokeStyle = 'rgba(70,50,35,.35)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { let x = r() * W, y = r() * H * .3; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 30; y += 10 + r() * 14; c.lineTo(x, y); } c.stroke(); }
}, [1 / 1.6, 1 / 1.6]));
// 냉동실 바닥: 옅은 하늘빛 줄무늬 철판 (1 m 한 장)
const plateTex = () => once('plate', () => tex(256, 256, (c, W, H) => {
  c.fillStyle = '#d9e6ee'; c.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 32) for (let x = 0; x < W; x += 32) { const o = (y / 32) % 2 ? 16 : 0; c.save(); c.translate(x + o + 8, y + 16); c.rotate(((x + y) / 32) % 2 ? .7 : -.7); c.fillStyle = '#c4d5e1'; c.fillRect(-9, -3, 18, 6); c.fillStyle = '#eef5f9'; c.fillRect(-9, -3, 18, 2); c.restore(); }
  const r = rnd(3); for (let i = 0; i < 14; i++) { c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(r() * W, r() * H, 10 + r() * 22, 6 + r() * 10, r(), 0, PI * 2); c.fill(); }
}, [1, 1]));
// 앞방 바닥: 민트 회색 에폭시, 점 얼룩 (1.5 m 한 장)
const epoxyTex = () => once('epoxy', () => tex(256, 256, (c, W, H) => {
  c.fillStyle = '#d8e6e1'; c.fillRect(0, 0, W, H);
  const r = rnd(21); for (let i = 0; i < 260; i++) { c.fillStyle = ['rgba(120,150,140,.18)', 'rgba(255,255,255,.5)', 'rgba(90,120,110,.12)'][i % 3]; c.fillRect(r() * W, r() * H, 2, 2); }
  c.strokeStyle = 'rgba(140,165,155,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke();
}, [1 / 1.5, 1 / 1.5]));
// 카페 1층 바닥: 꿀빛 판자
const plankTex = () => once('plank', () => tex(256, 256, (c, W, H) => {
  const r = rnd(5);
  for (let y = 0; y < H; y += 32) { c.fillStyle = shade(WOOD, -.04 + r() * .06); c.fillRect(0, y, W, 32); c.fillStyle = 'rgba(140,90,50,.35)'; c.fillRect(0, y + 30, W, 2); const cut = r() * W; c.fillRect(cut, y, 2, 32); for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(160,110,60,.18)'; c.fillRect(r() * W, y + 6 + k * 8, 40 + r() * 60, 1.5); } }
}, [1 / 1.6, 1 / 1.6]));
// 카페 벽지: 크림에 작은 컵 무늬
const cafeTex = () => once('cafe', () => tex(256, 256, (c, W, H) => {
  c.fillStyle = '#f7eedd'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#efe0c6'; for (let x = 0; x < W; x += 32) c.fillRect(x, 0, 14, H);
  c.fillStyle = 'rgba(168,115,63,.28)'; for (let y = 24; y < H; y += 64) for (let x = 16; x < W; x += 64) { const o = (y / 64 % 2) * 32; c.fillRect(x + o - 7, y, 14, 12); c.beginPath(); c.arc(x + o + 9, y + 5, 4, 0, PI * 2); c.lineWidth = 2; c.strokeStyle = 'rgba(168,115,63,.28)'; c.stroke(); }
}, [1 / 1.2, 1 / 1.2]));
// 글자 판 (게임 폰트, 한·영)
const sign = (w, h, bg, lines, { ink = '#ffffff', stripe = null, round = 10 } = {}) => textTex(w, h, (c, W, Hh) => {
  c.fillStyle = bg; c.beginPath(); c.roundRect ? c.roundRect(0, 0, W, Hh, round) : c.rect(0, 0, W, Hh); c.fill();
  if (stripe) { c.fillStyle = stripe; for (let x = -Hh; x < W; x += 26) { c.beginPath(); c.moveTo(x, Hh); c.lineTo(x + 12, Hh); c.lineTo(x + 12 + 12, Hh - 12); c.lineTo(x + 12, Hh - 12); c.fill(); } }
  lines.forEach(([s, y, px, col]) => fitText(c, s, W / 2, y * Hh, W * .86, px, col || ink));
});
K('냉동실', 'Freezer'); K('영하 18도', '−18 °C'); K('문 꼭 닫기!', 'Keep shut!'); K('고장', 'Out of order'); K('수리 중', 'Being fixed'); K('꽁꽁', 'Brrr');
K('아이스크림', 'Ice cream'); K('딸기', 'Strawberry'); K('민트초코', 'Mint choc'); K('바닐라', 'Vanilla'); K('초코', 'Choc'); K('콘', 'Cones');
K('냉동 창고 점검표', 'Freezer checklist'); K('온도', 'Temp'); K('문 닫힘', 'Door shut'); K('얼음', 'Ice'); K('파르페', 'Parfait'); K('알바', 'Staff');
K('카페 ↑', 'Café ↑'); K('오늘의 케이크', "Today's cake"); K('우유', 'Milk'); K('냉동 딸기', 'Frozen berries'); K('생크림', 'Cream'); K('컵', 'Cups');

// ── 접히는 벽 (otakuloft3와 같은 방식: 카메라 쪽으로 온 벽은 무릎 높이로, 장식은 숨김) ──────────────────────────────
const foldWall = (f, n, H) => {
  const g = grp(), deco = grp(); f.add(g); f.add(deco);
  (f.live || (f.live = [])).push(g, deco);
  const q = { g, deco, n: new THREE.Vector3(...n), k: 1, stub: .42 / H };
  (f.fzWalls || (f.fzWalls = [])).push(q);
  return q;
};
const tagWall = (o, k) => o.traverse(m => { if (m.isMesh) { m.userData.noMerge = true; m.userData.gptWall = k; m.castShadow = true; m.receiveShadow = true; } });
const viewFold = f => {
  const cam = new THREE.Vector3(), nrm = new THREE.Vector3();
  f.updateView = (Wd, dt = 1 / 60) => {
    if (!Wd || !Number.isFinite(Wd.yaw)) return;
    f.group.updateWorldMatrix(true, false);
    cam.set(Math.sin(Wd.yaw), 0, Math.cos(Wd.yaw));
    const sm = 1 - Math.exp(-Math.max(0, dt) * 12);
    for (const q of f.fzWalls) {
      nrm.copy(q.n).transformDirection(f.group.matrixWorld);
      const want = nrm.dot(cam) < -.18 ? 0 : 1, prev = q.k;
      q.k += (want - q.k) * sm; if (Math.abs(q.k - want) < .002) q.k = want;
      if (q.k === prev) continue;
      q.g.scale.y = q.stub + (1 - q.stub) * q.k; q.deco.visible = q.k > .65;
      Wd.shadowDirty = true; Wd.idsDirty = true;
    }
  };
};
// 둥근 네모 (평면 x, -z로 그려 눕힘)
const rr = (s, x0, y0, x1, y1, r) => { s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.absarc(x1 - r, y0 + r, r, -HP, 0, false); s.lineTo(x1, y1 - r); s.absarc(x1 - r, y1 - r, r, 0, HP, false); s.lineTo(x0 + r, y1); s.absarc(x0 + r, y1 - r, r, HP, PI, false); s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, PI, PI * 1.5, false); return s; };
const isl = (i = 0) => rr(new THREE.Shape(), IS.x0 + i, -IS.z1 + i, IS.x1 - i, -IS.z0 - i, IS.r - i);
const ext = (shape, d, curve = 12) => new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: curve });

// ── 바탕: 흙 섬 + 뒤·왼쪽 흙 띠(1층 높이) + 벽 마감 + 카페 1층 한 줄 + 잔디 ─────────────────────────────────────────
B.fz_shell = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.3, 0, .001, -.29, .001];
  // 섬 받침: 위 콘크리트 테(얇게), 흙 두 단, 맨 아래 짙은 흙
  f.add(mc('fz-island', ({ add }) => {
    add(ext(isl(), .16, 16), '#cfd6d4', 0, -.16, 0, -HP, 0, 0);
    add(ext(isl(.08), .5, 16), EARTH, 0, -.66, 0, -HP, 0, 0);
    add(ext(isl(.22), .3, 16), EARTH2, 0, -.96, 0, -HP, 0, 0);
    add(ext(isl(.4), .14, 16), EARTH3, 0, -1.1, 0, -HP, 0, 0);
    // 흙 단면에 박힌 자갈 (앞·오른쪽 둥근 옆면을 따라)
    const r = rnd(8);
    for (let k = 0; k < 34; k++) {
      const u = r(), side = k % 2, y = -.24 - r() * .36, s = .05 + r() * .06;
      const x = side ? IS.x1 - .06 : IS.x0 + 1 + u * (IS.x1 - IS.x0 - 2), z = side ? IS.z0 + 1 + u * (IS.z1 - IS.z0 - 2) : IS.z1 - .06;
      add(G.sph(s, 7, 5), ['#c4b6a2', '#b3a48f', '#d4c8b4'][k % 3], x, y, z, 0, r() * 3, 0, [1.3, .8, 1]);
    }
    // 앞 테두리 연석 (방 바닥 둘레, 섬 위)
    add(G.box(X1 - X0 + .3, .05, .12, .02), '#dfe4e2', (X0 + X1 + .3) / 2, .005, Z1 + .1);
    add(G.box(.12, .05, Z1 - Z0 + .3, .02), '#dfe4e2', X1 + .1, .005, (Z0 + Z1 + .3) / 2);
  }));
  // 섬 옆면 흙 무늬 (앞·오른쪽 곧은 면)
  { const sm = tmat(soilTex()); f.add(plane(IS.x1 - IS.x0 - 2 * IS.r, .62, sm, (IS.x0 + IS.x1) / 2, -.48, IS.z1 - .079)); const p = plane(IS.z1 - IS.z0 - 2 * IS.r, .62, sm, IS.x1 - .079, -.48, (IS.z0 + IS.z1) / 2, 0, HP); f.add(p); }
  // 앞방 바닥 (에폭시) + 노란 안전선 + 배수구
  { const m = plane(X1 - FZ.x1, Z1 - Z0, tmat(epoxyTex(), { rough: .6 }), (FZ.x1 + X1) / 2, .004, 0, -HP); m.userData.floor = true; m.receiveShadow = true; f.add(m);
    const m2 = plane(FZ.x1 - X0, Z1 - FZ.z1, tmat(epoxyTex(), { rough: .6 }), (X0 + FZ.x1) / 2, .004, (FZ.z1 + Z1) / 2, -HP); m2.userData.floor = true; m2.receiveShadow = true; f.add(m2); }
  f.add(mc('fz-floorlines', ({ add }) => {
    add(G.pbox(.07, .006, Z1 - FZ.z1 - .2), YEL, FZ.x1 + .45, .008, (FZ.z1 + Z1) / 2 + .1);
    add(G.pbox(1.7, .006, .07), YEL, 1.05, .008, -.42);
    add(G.cyl(.2, .2, .012, 18), '#9aa8a6', 1.0, .008, 1.55); for (let k = -2; k <= 2; k++) add(G.pbox(.3 - Math.abs(k) * .05, .014, .025), '#7d8b89', 1.0, .01, 1.55 + k * .06);
  }));

  // ── 뒤(북) 흙 띠 + 벽 + 카페 1층 ──
  const N = foldWall(f, [0, 0, 1], UP);
  {
    N.g.add(mc('fz-nblock', ({ add }) => {
      add(G.pbox(X1 + .3 - (X0 - ST - .12), UP, ST + .12), EARTH, (X1 + .3 + X0 - ST - .12) / 2, UP / 2, Z0 - (ST + .12) / 2);
      // 1층 바닥판 단면 (콘크리트 띠 + 철근 점) — 벽 위
      add(G.pbox(X1 + .3 - (X0 - ST - .12), .26, .06), '#d6dcdc', (X1 + .3 + X0 - ST - .12) / 2, UP - .13, Z0 + .03);
      for (let x = X0 + .2; x < X1 + .2; x += .5) add(G.cyl(.022, .022, .02, 8), '#8f9898', x, UP - .13, Z0 + .065, HP, 0, 0);
    }));
    // 벽 마감: 냉동실은 단열 패널, 앞방은 칠한 콘크리트(아래 민트 띠)
    N.g.add(plane(FZ.x1 - X0, UP - .26, tmat(panelTex()), (X0 + FZ.x1) / 2, (UP - .26) / 2, Z0 + .003));
    N.g.add(plane(X1 - FZ.x1, UP - .26, tmat(wallTex()), (FZ.x1 + X1) / 2, (UP - .26) / 2, Z0 + .003));
    N.g.add(mc('fz-nwall-trim', ({ add }) => {
      add(G.pbox(X1 - FZ.x1, .9, .02), MINTW, (FZ.x1 + X1) / 2, .45, Z0 + .012); add(G.pbox(X1 - FZ.x1, .05, .03), MINTWD, (FZ.x1 + X1) / 2, .9, Z0 + .017);
      add(G.pbox(FZ.x1 - X0, .12, .03), PANEL2, (X0 + FZ.x1) / 2, .06, Z0 + .017);
    }));
    // 흙 띠 동쪽 끝 단면
    N.g.add(plane(ST + .12, UP, tmat(soilTex()), X1 + .301, UP / 2, Z0 - (ST + .12) / 2, 0, HP));
    // 카페 1층: 판자 바닥(흙 띠 위)
    { const m = plane(X1 + .3 - (X0 - ST - .12), ST + .12, tmat(plankTex()), (X1 + .3 + X0 - ST - .12) / 2, UP + .004, Z0 - (ST + .12) / 2, -HP); N.deco.add(m); }
    // 카페 뒷벽(낮게): 컵 무늬 벽지, 창, 메뉴판
    N.deco.add(plane(X1 + .3 - (X0 - ST - .12), 1.05, tmat(cafeTex()), (X1 + .3 + X0 - ST - .12) / 2, UP + .525, Z0 - ST - .1));
    N.deco.add(mc('fz-cafe', ({ add, tube }) => {
      const zb = Z0 - ST - .12, zc = Z0 - .5;
      add(G.pbox(X1 + .3 - (X0 - ST - .12), .07, .08), WOODD, (X1 + .3 + X0 - ST - .12) / 2, UP + 1.06, zb + .04);
      // 창 (따뜻한 오후 빛)
      add(G.box(1.0, .62, .05, .02), CREAM, -1.6, UP + .58, zb + .03); add(G.box(.9, .52, .02, .01), '#ffe2a8', -1.6, UP + .58, zb + .06); add(G.pbox(.02, .52, .03), CREAM, -1.6, UP + .58, zb + .07);
      // 계산대 + 커피 머신 + 그라인더
      add(G.box(1.9, .82, .5, .03), WOOD, -1.75, UP + .41, zc); add(G.box(1.96, .06, .56, .02), '#fff6e8', -1.75, UP + .85, zc);
      for (let k = 0; k < 5; k++) add(G.pbox(.02, .7, .01), WOODD, -2.6 + k * .42, UP + .4, zc + .253);
      add(G.box(.55, .42, .34, .05), CHROME, -2.2, UP + 1.09, zc - .04); add(G.box(.5, .08, .3, .02), STEELD, -2.2, UP + 1.33, zc - .04);
      for (const x of [-2.32, -2.08]) { add(G.cyl(.035, .035, .1, 10), INK, x, UP + .98, zc + .1); add(G.cyl(.05, .04, .07, 12), '#ffffff', x, UP + .9, zc + .12); }
      add(G.cyl(.09, .11, .3, 12), INK, -1.45, UP + 1.03, zc - .05); add(G.cone(.1, .14, 12), '#c9a37a', -1.45, UP + 1.25, zc - .05, PI, 0, 0);
      // 케이크 진열장 (유리 + 케이크 셋)
      add(G.box(1.0, .72, .5, .03), '#ffffff', -.1, UP + .36, zc); add(G.box(.94, .38, .44, .02), '#d8f0f8', -.1, UP + .92, zc);
      for (const [x, c1, c2] of [[-.4, '#fff4e2', PINK], [-.1, CHOCO, '#f6d9b8'], [.2, '#fff4e2', '#ffd25c']]) { add(G.cyl(.1, .1, .12, 14), c1, x, UP + .8, zc); add(G.cyl(.1, .1, .03, 14), c2, x, UP + .87, zc); add(G.sph(.025, 8, 6), RED, x, UP + .9, zc); }
      add(G.pbox(.96, .03, .46), WOODD, -.1, UP + 1.12, zc);
      // 의자 둘, 화분, 계단 위 손잡이 끝
      for (const x of [1.0, 1.55]) { add(G.cyl(.17, .17, .05, 14), '#ff9f6b', x, UP + .62, zc + .15); add(G.cyl(.02, .02, .6, 6), INK, x, UP + .3, zc + .15); add(G.cyl(.14, .16, .03, 12), INK, x, UP + .015, zc + .15); }
      add(G.cyl(.16, .12, .3, 12), '#e8a07a', 2.55, UP + .15, zb + .3); for (let k = 0; k < 6; k++) { const a = k * 1.05; add(G.sph(.13, 8, 6), k % 2 ? GRASS : GRASS2, 2.55 + Math.cos(a) * .1, UP + .45 + (k % 3) * .08, zb + .3 + Math.sin(a) * .08); }
      // 지하로 내려가는 계단 구멍 둘레 난간 (계단 서쪽)
      for (const z of [Z0 - .1, Z0 - .6]) { add(G.cyl(.022, .022, .9, 8), STEELD, STAIR.x0 - .03, UP + .45, z); }
      tube([STAIR.x0 - .03, UP + .9, Z0 - .6], [STAIR.x0 - .03, UP + .9, Z0 - .02], .02, STEELD, 8);
      // 1층 바닥 끝 난간 (냉동실·앞방 위)
      for (let x = X0 + .1; x < STAIR.x0 - .2; x += .55) add(G.cyl(.018, .018, .7, 6), STEELD, x, UP + .35, Z0 - .05);
      tube([X0 + .1, UP + .7, Z0 - .05], [STAIR.x0 - .2, UP + .7, Z0 - .05], .022, STEELD, 8);
    }));
    { const m = mesh(new THREE.PlaneGeometry(.8, .5), mat('#ffffff', { map: sign(256, 160, '#3e5a4e', [['오늘의 케이크', .25, 26, '#fff6e0'], ['딸기 · 초코', .6, 30, '#ffd6e2']], { round: 8 }), rough: .9, rim: .1 }), { cast: false });
      put(m, .9, UP + .66, Z0 - ST - .065); N.deco.add(m); }
    // 냉동실 뒤 벽: 냉각기(팬 둘, 고드름), 둥근 온도계, 파란 등
    N.deco.add(frosty(mc('fz-evap-frost', ({ add }) => {
      for (let k = 0; k < 7; k++) add(G.cone(.03 + (k % 3) * .01, .12 + (k % 4) * .06, 6), FROSTB, -1.95 + k * .16, 2.05 - (k % 4) * .03, Z0 + .3, PI, 0, 0);
      add(G.box(1.2, .06, .4, .03), FROST, -1.45, 2.66, Z0 + .22);
    })));
    N.deco.add(mc('fz-evap', ({ add }) => {
      add(G.box(1.2, .5, .36, .05), '#f6fafc', -1.45, 2.36, Z0 + .2);
      for (const x of [-1.75, -1.15]) { add(G.cyl(.17, .17, .03, 20), STEELD, x, 2.36, Z0 + .385, HP, 0, 0); add(G.tor(.17, .02, PI * 2, 6, 20), STEEL, x, 2.36, Z0 + .4); for (let k = 0; k < 3; k++) add(G.box(.3, .03, .01, .005), STEEL, x, 2.36, Z0 + .405, 0, 0, k * PI / 3); }
    }));
    N.deco.add(mc('fz-nwall-life', ({ add, tube }) => {
      // 냉동실 파란 등 · 앞방 철망 전구
      add(G.box(.5, .1, .1, .03), '#ffffff', -.4, 2.5, Z0 + .06); add(G.box(.44, .05, .06, .02), '#bfe8ff', -.4, 2.44, Z0 + .08);
      add(G.box(.16, .14, .1, .03), STEELD, 1.1, 2.45, Z0 + .05); add(G.sph(.09, 10, 8), '#ffe2a6', 1.1, 2.33, Z0 + .12);
      for (let k = 0; k < 4; k++) add(G.tor(.1, .008, PI, 3, 10), STEELD, 1.1, 2.33, Z0 + .12, 0, k * PI / 4, 0);
      // 두꺼비집·스위치·전선관, 벽 파이프
      add(G.box(.42, .52, .1, .03), '#e9eef0', .75, 1.6, Z0 + .05); add(G.box(.36, .1, .02, .01), '#ff9f6b', .75, 1.8, Z0 + .1);
      add(G.box(.1, .14, .04, .015), '#ffffff', .4, 1.15, Z0 + .03); add(G.box(.04, .06, .02, .01), ORANGE, .4, 1.15, Z0 + .055);
      tube([.75, 1.86, Z0 + .04], [.75, 2.85, Z0 + .04], .025, STEEL, 6);
      tube([.3, 2.7, Z0 + .09], [2.0, 2.7, Z0 + .09], .045, '#d9dfe2', 10);
      tube([2.0, 2.7, Z0 + .09], [2.0, 2.86, Z0 + .09], .045, '#d9dfe2', 10);
      // 벽 시계
      add(G.cyl(.15, .15, .04, 20), CREAM, 1.75, 2.1, Z0 + .03, HP, 0, 0); add(G.tor(.15, .022, PI * 2, 6, 20), INK, 1.75, 2.1, Z0 + .05);
      add(G.pbox(.015, .09, .01), INK, 1.75, 2.13, Z0 + .06); add(G.pbox(.07, .015, .01), INK, 1.78, 2.1, Z0 + .06);
    }));
    { const m = mesh(new THREE.PlaneGeometry(.42, .56), mat('#ffffff', { map: sign(192, 256, '#ffffff', [['냉동 창고 점검표', .12, 20, INK], ['온도  −18 ✓', .36, 18, '#4f8fb0'], ['문 닫힘  ✓', .54, 18, '#4f8fb0'], ['얼음  ✓', .72, 18, '#4f8fb0'], ['파르페  ?', .88, 18, RED]], { round: 4 }), rough: .9, rim: .1 }), { cast: false });
      put(m, 1.4, 1.45, Z0 + .012); N.deco.add(m); }
    tagWall(N.g, 'N'); tagWall(N.deco, 'N');
  }

  // ── 왼쪽(서) 흙 띠 + 벽 + 잔디 ──
  const W = foldWall(f, [1, 0, 0], UP);
  {
    W.g.add(mc('fz-wblock', ({ add }) => { add(G.pbox(ST + .12, UP, Z1 + .3 - Z0), EARTH, X0 - (ST + .12) / 2, UP / 2, (Z0 + Z1 + .3) / 2); }));
    W.g.add(plane(FZ.z1 - Z0, UP, tmat(panelTex()), X0 + .003, UP / 2, (Z0 + FZ.z1) / 2, 0, HP));
    W.g.add(plane(Z1 - FZ.z1, UP, tmat(wallTex()), X0 + .003, UP / 2, (FZ.z1 + Z1) / 2, 0, HP));
    W.g.add(mc('fz-wwall-trim', ({ add }) => {
      add(G.pbox(.02, .9, Z1 - FZ.z1), MINTW, X0 + .012, .45, (FZ.z1 + Z1) / 2); add(G.pbox(.03, .05, Z1 - FZ.z1), MINTWD, X0 + .017, .9, (FZ.z1 + Z1) / 2);
      add(G.pbox(.03, .12, FZ.z1 - Z0), PANEL2, X0 + .017, .06, (Z0 + FZ.z1) / 2);
    }));
    W.g.add(plane(ST + .12, UP, tmat(soilTex()), X0 - (ST + .12) / 2, UP / 2, Z1 + .301));
    // 잔디 윗면 + 꽃 상자 + 반지하 환기창
    W.deco.add(mc('fz-wtop', ({ add }) => {
      add(G.pbox(ST + .12, .06, Z1 + .3 - Z0), GRASS2, X0 - (ST + .12) / 2, UP + .03, (Z0 + Z1 + .3) / 2);
      const r = rnd(6);
      for (let k = 0; k < 26; k++) add(G.sph(.07 + r() * .05, 7, 5), k % 2 ? GRASS : GRASS2, X0 - .1 - r() * (ST - .1), UP + .06, Z0 + .2 + r() * (Z1 - Z0), 0, 0, 0, [1.2, .6, 1]);
      add(G.box(.42, .26, 1.0, .03), WOOD, X0 - .4, UP + .19, -1.6); add(G.box(.36, .05, .94, .02), '#7a5a3e', X0 - .4, UP + .31, -1.6);
      for (let k = 0; k < 6; k++) { add(G.sph(.06, 8, 6), ['#ff9fb8', '#ffe27a', '#ffffff'][k % 3], X0 - .4 + (k % 2 ? .08 : -.08), UP + .4, -1.98 + k * .15); add(G.sph(.07, 8, 6), GRASS2, X0 - .4, UP + .35, -1.98 + k * .15); }
      // 우유 상자 셋 (배달 와서 내려놓은 것)
      for (const [z, y] of [[1.6, 0], [2.05, 0], [1.82, .3]]) { add(G.box(.42, .28, .42, .03), MILK, X0 - .4, UP + .14 + y, z); add(G.box(.36, .02, .36, .01), '#3d86c6', X0 - .4, UP + .29 + y, z); }
    }));
    tagWall(W.g, 'W'); tagWall(W.deco, 'W');
  }
  viewFold(f);
};

// ── 냉동실 (문 + 얼음 블록): 바닥 철판, 앞·옆 무릎 벽(단열재 단면), 문틀 덩어리와 두꺼운 문, 큰 얼음 블록 ───────────────
// 문틀 덩어리 바깥면(+x)에 '냉동실 · 영하 18도' 판, 문에는 빈 핸들 소켓·둥근 창·고무 테. 얼음 블록은 나무 받침 위.
B.fz_coldroom = (f, T) => {
  const x1 = FZ.x1, z1 = FZ.z1;
  // 바닥 철판 + 문턱 노란 띠
  { const m = plane(x1 - X0, z1 - Z0, tmat(plateTex(), { rough: .55 }), (X0 + x1) / 2, .006, (Z0 + z1) / 2, -HP); m.userData.floor = true; m.receiveShadow = true; f.add(m); }
  // 무릎 벽: 흰 패널 두 겹 사이 노란 단열재가 위로 보이는 단면, 알루미늄 모서리
  const KH = .58;
  const knee = (add, xa, za, xb, zb) => {
    const L = Math.hypot(xb - xa, zb - za), cx = (xa + xb) / 2, cz = (za + zb) / 2, a = Math.atan2(-(zb - za), xb - xa);
    add(G.box(L, KH, PT, .015), PANEL, cx, KH / 2, cz, 0, a, 0);
    add(G.pbox(L - .02, .012, PT - .05), FOAM, cx, KH + .004, cz, 0, a, 0);
    add(G.pbox(L - .02, .02, .025), '#ffffff', cx + Math.sin(a) * (PT / 2 - .012), KH + .002, cz + Math.cos(a) * (PT / 2 - .012), 0, a, 0);
    add(G.pbox(L - .02, .02, .025), '#ffffff', cx - Math.sin(a) * (PT / 2 - .012), KH + .002, cz - Math.cos(a) * (PT / 2 - .012), 0, a, 0);
    add(G.pbox(L, .06, PT + .01), PANEL2, cx, .03, cz, 0, a, 0);
  };
  f.add(mc('fz-coldroom-walls', ({ add }) => {
    knee(add, x1, Z0, x1, CZ0); knee(add, x1, CZ1, x1, z1); knee(add, X0, z1, x1 + PT / 2, z1);
    // 문틀 덩어리: 문 양옆 기둥 + 위 인방, 바깥 강철 띠
    for (const [za, zb] of [[CZ0, DOOR.z0 - .02], [DOOR.z1 + .02, CZ1]]) add(G.box(PT, CH, zb - za, .02), PANEL, x1, CH / 2, (za + zb) / 2);
    add(G.box(PT, CH - DOOR.h - .02, DOOR.z1 - DOOR.z0 + .04, .02), PANEL, x1, (CH + DOOR.h + .02) / 2, (DOOR.z0 + DOOR.z1) / 2);
    add(G.pbox(PT + .02, .04, CZ1 - CZ0), STEEL, x1, CH + .02, (CZ0 + CZ1) / 2);
    for (const z of [DOOR.z0 - .03, DOOR.z1 + .03]) add(G.pbox(.04, DOOR.h + .02, .04), STEELD, x1 + PT / 2 + .01, DOOR.h / 2, z);
    add(G.pbox(.04, .04, DOOR.z1 - DOOR.z0 + .1), STEELD, x1 + PT / 2 + .01, DOOR.h + .02, (DOOR.z0 + DOOR.z1) / 2);
    // 패널 세로 이음매 (덩어리 바깥면)
    for (const z of [CZ0 + .1, CZ1 - .1]) add(G.pbox(.01, CH - .1, .015), SEAM, x1 + PT / 2 + .003, CH / 2, z);
    // 문 앞 고무 발판, 문턱 노랑·검정 띠
    add(G.box(.6, .02, 1.1, .01), '#6f7a86', x1 + .42, .012, (DOOR.z0 + DOOR.z1) / 2);
    for (let k = 0; k < 5; k++) add(G.pbox(.05, .014, 1.0), '#5c6672', x1 + .2 + k * .1, .026, (DOOR.z0 + DOOR.z1) / 2);
    add(G.pbox(.12, .01, 1.0), YEL, x1 - .02, .012, (DOOR.z0 + DOOR.z1) / 2);
  }));
  // 덩어리 위 표지: 냉동실 · 영하 18도
  { const m = mesh(new THREE.PlaneGeometry(.92, .32), mat('#ffffff', { map: sign(288, 100, '#4f8fb0', [['냉동실  −18 ℃', .38, 34], ['문 꼭 닫기!', .78, 22, '#d9f2ff']], { round: 14 }), rough: .9, rim: .1 }), { cast: false });
    put(m, x1 + PT / 2 + .006, 2.2, (DOOR.z0 + DOOR.z1) / 2, 0, HP, 0); f.add(m); }
  // 성에: 무릎 벽 위·덩어리 위·문틀, 바닥 구석 냉기 웅덩이 (녹을 때 다 줄어듦)
  f.add(frosty(mc('fz-coldroom-frost', ({ add }) => {
    const r = rnd(14);
    for (let k = 0; k < 16; k++) { const u = r(); add(G.sph(.05 + r() * .05, 7, 5), k % 3 ? FROST : FROSTB, X0 + .3 + u * (x1 - X0 - .4), KH + .02, z1, 0, r() * 3, 0, [1.5, .5, 1]); }
    for (let k = 0; k < 10; k++) { const u = r(); add(G.sph(.05 + r() * .04, 7, 5), k % 3 ? FROST : FROSTB, x1, KH + .02, k < 5 ? Z0 + .1 + u * (CZ0 - Z0 - .2) : CZ1 + .1 + u * (z1 - CZ1 - .2), 0, r() * 3, 0, [1, .5, 1.5]); }
    for (let k = 0; k < 8; k++) add(G.sph(.07 + r() * .05, 7, 5), FROST, x1, CH + .05, CZ0 + .1 + k * .19, 0, r() * 3, 0, [1, .55, 1.3]);
    for (let k = 0; k < 6; k++) add(G.cone(.025, .1 + (k % 3) * .05, 6), FROSTB, x1 + PT / 2 + .02, DOOR.h - .02, DOOR.z0 + .1 + k * .16, PI, 0, 0);
  })));
  { const mt = fadeDisc(64, '#ffffff', r => .55 * (1 - Math.max(0, r - .2) / .8)), mm = new THREE.MeshBasicMaterial({ map: mt, transparent: true, depthWrite: false, opacity: .9 });
    const mist = grp(); for (const [x, z, s] of [[-.35, -1.3, 1.5], [-2.3, .1, 1.3], [-2.0, -2.2, 1.6]]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(s, s * .7), mm); put(p, x, .03, z, -HP, 0, 0); p.renderOrder = 2; mist.add(p); }
    f.add(frosty(mist)); }

  // ── 문: 경첩은 북쪽 끝(z0), 바깥(+x)으로 열림 → 열리면 안쪽 면이 카메라 쪽(+z)을 봄
  const DW = DOOR.z1 - DOOR.z0, DT = .16;
  const pv = grp(); put(pv, x1 + PT / 2 + .02, 0, DOOR.z0); f.add(pv);
  pv.add(mc('fz-door', ({ add }) => {
    add(G.box(DT, DOOR.h - .03, DW - .02, .04), '#f7fbfd', -DT / 2 + .03, DOOR.h / 2, DW / 2);
    // 고무 테·발치 강철판·둥근 창 테
    add(G.pbox(.02, DOOR.h - .1, .03), '#aab4bf', .045, DOOR.h / 2, .04); add(G.pbox(.02, DOOR.h - .1, .03), '#aab4bf', .045, DOOR.h / 2, DW - .04);
    add(G.pbox(.02, .03, DW - .1), '#aab4bf', .045, DOOR.h - .06, DW / 2);
    add(G.box(.02, .32, DW - .12, .01), STEEL, .05, .2, DW / 2);
    add(G.tor(.15, .03, PI * 2, 6, 22), STEEL, .055, 1.55, DW / 2, 0, HP, 0);
    // 경첩 셋
    for (const y of [.35, 1.0, 1.65]) add(G.box(.08, .16, .07, .02), STEELD, .04, y, .02);
    // 빈 핸들 소켓: 둥근 크롬 판 + 가운데 네모 구멍
    add(G.cyl(.13, .13, .03, 22), CHROME, .06, 1.02, DW - .2, 0, 0, HP);
    add(G.tor(.13, .015, PI * 2, 6, 22), STEELD, .075, 1.02, DW - .2, 0, HP, 0);
    add(G.pbox(.012, .06, .06), INK, .08, 1.02, DW - .2);
    // 안쪽 면 (열리면 보임): 성에 얼룩
    add(G.box(.02, 1.4, DW - .2, .01), FROSTB, -DT + .03, 1.0, DW / 2);
  }));
  { const g = mesh(new THREE.CircleGeometry(.13, 20), mat('#cfeaf6', { rough: .3, rim: .2 }), { cast: false }); put(g, .06, 1.55, DW / 2, 0, HP, 0); pv.add(g); }
  // 문짝의 '영하 18도' 작은 스티커 (눈 결정)
  { const m = mesh(new THREE.PlaneGeometry(.3, .3), mat('#ffffff', { map: sign(128, 128, '#ffffff', [['❄', .45, 70, '#4f8fb0'], ['−18℃', .85, 26, '#4f8fb0']], { round: 60 }), rough: .9, rim: .1 }), { cast: false });
    put(m, .062, 1.22, DW / 2 - .02, 0, HP, 0); pv.add(m); }
  // 핸들 (②가 보이게 하고 돌림): 소켓 앞 둥근 바퀴 — 크롬 고리, 살 넷, 빨간 손잡이 넷. rotation.z = 문 면 위에서 빙글
  const hd = grp(); put(hd, .09, 1.02, DW - .2, 0, HP, 0); pv.add(hd); hd.visible = false;
  hd.add(live(mc('fz-handle', ({ add }) => {
    add(G.cyl(.04, .04, .1, 12), CHROME, 0, 0, -.03, HP, 0, 0);
    add(G.tor(.15, .022, PI * 2, 6, 24), CHROME, 0, 0, .03);
    for (let k = 0; k < 4; k++) { const a = k * HP; add(G.box(.3, .028, .028, .01), CHROME, 0, 0, .03, 0, 0, a); add(G.sph(.04, 10, 8), RED, Math.cos(a) * .17, Math.sin(a) * .17, .03); }
    add(G.cyl(.05, .05, .04, 14), RED, 0, 0, .05, HP, 0, 0);
  })));
  const door = f.part('door', pv, (t, b) => { pv.rotation.y = b.r.y + 1.72 * t; }, { label: K('냉동 창고 문', 'Freezer door'), sfx: 'door_metal', dur: .9 });
  door.device = 'freezer'; door.gpt2Reach = true;
  f.handle = hd; f.handleAt = new THREE.Vector3(x1 + PT / 2 + .02 + .09, 1.02, DOOR.z0 + DW - .2); f.mistAt = new THREE.Vector3(x1 - .45, 1.0, (DOOR.z0 + DOOR.z1) / 2);
  f.doorAt = new THREE.Vector3(x1 + .2, 1.0, (DOOR.z0 + DOOR.z1) / 2);

  // (문 열림 검사에선 몸통 없음 — L자 벽을 상자 하나로 재면 옆 사물함 문까지 막힘; 문짝·벽에 붙은 건 없음)
  f.collideBox = [0, -.3, 0, .001, -.29, .001];
  // 걷기 몸통 (문 자리는 열어 둠 — 냉동실 안도 걸어서 닿게)
  f.walkSolids = [
    [x1 - PT / 2, 0, Z0, x1 + PT / 2, KH, CZ0], [x1 - PT / 2, 0, CZ0, x1 + PT / 2, CH, DOOR.z0 - .02], [x1 - PT / 2, 0, DOOR.z1 + .02, x1 + PT / 2, CH, CZ1],
    [x1 - PT / 2, 0, CZ1, x1 + PT / 2, KH, z1], [X0, 0, z1 - PT / 2, x1, KH, z1 + PT / 2],
  ];
};

// ── 도르래 높은 선반 (1×1, 앞 +z): 냉동실 안 키 큰 철제 선반, 꼭대기 들보에서 앞으로 뻗은 팔 끝에 도르래 바퀴, 줄에 매달린 큰 철망 바구니
// — 바구니 안엔 큰 얼음 블록(속에 파르페가 비침). 아래 두 칸엔 생크림 상자·냉동 딸기 봉지(숨김 자리 둘).
//   f.basket 바구니 그룹(얼음 포함, 위치 = 바구니 바닥 가운데) · f.basketUp / f.basketDown 그 그룹의 위·아래 자리(가구 안 Vector3)
//   f.setBasket(k) 0 위 → 1 아래 (그룹 위치·줄 길이·도르래 바퀴 돌기를 한 번에; ②가 f.basket을 직접 옮기면 f.setRope()로 줄만 맞춤)
//   parts[0] 얼음: kind 'lift', 잠글 수 없음, 숨김 자리 하나(얼음 블록 속 — 파르페, maxH .95; 앵커는 바구니 그룹 안·f.ice 밖)
//   f.ice 얼음 그룹(반투명 하늘색 + 파르페 실루엣) · f.iceAt(가구 안, 위에 있을 때 얼음 가운데) · f.setMelt(t) 0 꽁꽁 → 1 물기만
//   (얼음이 줄고, 작은 얼음·실루엣이 사라지고, 바구니 밑 물방울·바닥 웅덩이가 생기고, 방 안 모든 성에 fzFrost가 같이 줄어듦 — 얼음 부품이
//   열릴 때(togglePart) 저절로 돌아요)
const BK = { up: new THREE.Vector3(0, 1.46, .5), down: new THREE.Vector3(0, .04, .5), top: 2.62, wy: 2.74 };
B.fz_basketpulley = (f, T) => {
  const W = 1.12, D = .48, z0 = -.12, ys = [.1, .56];
  f.add(mc('fz-bkrack', ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.05, BK.top, .05, .01), STEEL, sx * (W / 2 - .03), BK.top / 2, z0 + sz * (D / 2 - .03));
    for (const y of [...ys, 1.2]) { add(G.box(W, .025, D, .008), STEEL, 0, y, z0); for (let k = 0; k < 5; k++) add(G.pbox(.008, .01, D - .02), STEELD, -W / 2 + .12 + k * .22, y + .016, z0); }
    // 꼭대기 들보 + 앞으로 뻗은 팔 + 도르래 받침
    add(G.box(W + .06, .08, D + .06, .02), STEELD, 0, BK.top, z0);
    add(G.box(.09, .09, BK.up.z - z0 + .22, .02), STEELD, 0, BK.top + .06, (z0 + BK.up.z + .22) / 2);
    for (const s of [-1, 1]) add(G.box(.02, .18, .06, .006), STEEL, s * .05, BK.wy - .02, BK.up.z);
    // 아래 칸: 생크림 상자, 냉동 딸기 봉지
    add(G.box(.42, .28, .34, .02), '#ffffff', -.28, ys[0] + .16, z0); add(G.box(.3, .08, .01, .005), PINK, -.28, ys[0] + .18, z0 + .172);
    for (let k = 0; k < 3; k++) { add(G.box(.26, .07, .2, .04), '#ffffff', .3, ys[1] + .06 + k * .07, z0 - .04 + (k % 2) * .03, 0, k * .2, 0); add(G.box(.12, .072, .1, .02), RED, .3, ys[1] + .06 + k * .07, z0 - .04 + (k % 2) * .03, 0, k * .2, 0); }
    // 줄 감는 통 (기둥 옆) — 줄이 여기서 들보로
    add(G.cyl(.07, .07, .14, 14), '#e2e8ee', W / 2 + .06, 1.3, z0 + D / 2 - .05, 0, 0, HP); add(G.cyl(.075, .075, .02, 14), RED, W / 2 + .13, 1.3, z0 + D / 2 - .05, 0, 0, HP);
  }));
  { const m = mesh(new THREE.PlaneGeometry(.5, .16), mat('#ffffff', { map: sign(200, 64, '#ffffff', [['생크림', .55, 30, '#e86f8f']], { round: 4 }), rough: .9, rim: .1 }), { cast: false }); put(m, -.28, ys[0] + .2, z0 + .175); f.add(m); }
  f.add(frosty(mc('fz-bkrack-frost', ({ add }) => {
    const r = rnd(51);
    for (const y of [...ys, 1.2, BK.top]) for (let k = 0; k < 5; k++) add(G.sph(.04 + r() * .04, 7, 5), k % 2 ? FROST : FROSTB, -W / 2 + .1 + r() * (W - .2), y + .03, z0 + D / 2 - .02, 0, r() * 3, 0, [1.5, .5, 1]);
    for (let k = 0; k < 5; k++) add(G.cone(.02, .08 + (k % 3) * .04, 5), FROSTB, -.4 + k * .2, BK.top - .07, z0 + D / 2, PI, 0, 0);
  })));
  // 도르래 바퀴 (돌아감)
  const wheel = grp(); put(wheel, 0, BK.wy, BK.up.z); f.add(wheel);
  wheel.add(live(mc('fz-bkwheel', ({ add }) => { add(G.cyl(.11, .11, .05, 18), CHROME, 0, 0, 0, 0, 0, HP); add(G.tor(.11, .018, PI * 2, 5, 18), ORANGE, 0, 0, 0, 0, HP, 0); for (let k = 0; k < 3; k++) add(G.box(.02, .2, .02, .005), STEELD, 0, 0, 0, k * PI / 3, 0, 0); })));
  // 줄: 바퀴에서 바구니 고리까지 (길이는 setRope가 맞춤) + 바퀴에서 감는 통까지 (고정)
  const ropeM = mat('#e8d8b8');
  const rope = mesh(new THREE.CylinderGeometry(.012, .012, 1, 6), ropeM); rope.userData.noMerge = true; f.add(rope);
  f.add(mc('fz-bkrope2', ({ tube }) => { tube([0, BK.wy + .11, BK.up.z], [0, BK.top + .12, z0 + D / 2 - .05], .012, '#e8d8b8', 6); tube([0, BK.top + .1, z0 + D / 2 - .05], [W / 2 + .06, 1.3, z0 + D / 2 - .05], .012, '#e8d8b8', 6); }));
  // 바구니: 철망 상자(테·살) + 손잡이 고리 넷 + 가운데 줄 고리
  const bk = grp(); bk.position.copy(BK.up); f.add(bk);
  const BW = .92, BH = .5, BD = .78;
  bk.add(live(mc('fz-basket', ({ add, tube }) => {
    add(G.box(BW, .03, BD, .01), STEELD, 0, .015, 0);
    for (const y of [.02, BH * .5, BH]) { add(G.pbox(BW, .022, .022), STEEL, 0, y, BD / 2); add(G.pbox(BW, .022, .022), STEEL, 0, y, -BD / 2); add(G.pbox(.022, .022, BD), STEEL, BW / 2, y, 0); add(G.pbox(.022, .022, BD), STEEL, -BW / 2, y, 0); }
    for (let k = 0; k <= 6; k++) { const x = -BW / 2 + k * BW / 6; add(G.pbox(.014, BH, .014), STEEL, x, BH / 2, BD / 2); add(G.pbox(.014, BH, .014), STEEL, x, BH / 2, -BD / 2); }
    for (let k = 0; k <= 5; k++) { const z = -BD / 2 + k * BD / 5; add(G.pbox(.014, BH, .014), STEEL, BW / 2, BH / 2, z); add(G.pbox(.014, BH, .014), STEEL, -BW / 2, BH / 2, z); }
    add(G.box(.3, .1, .012, .01), ORANGE, 0, BH * .75, BD / 2 + .01);
    // 매다는 줄 넷 → 위 고리
    const hy = 1.2;
    for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) tube([x * (BW / 2 - .02), BH, z * (BD / 2 - .02)], [0, hy, 0], .01, '#9aa8b8', 5);
    add(G.tor(.05, .014, PI * 2, 5, 14), CHROME, 0, hy + .05, 0);
  })));
  // 얼음 (바구니 안): 큰 블록 + 작은 얼음 셋 + 파르페 실루엣
  const ice = grp(); put(ice, 0, .03, 0); bk.add(ice);
  const IW = .8, IH = .9, ID = .68;
  const iceM = mat(ICE, { opacity: .6, rough: .15, rim: .5 }), iceM2 = mat(ICED, { opacity: .55, rough: .2, rim: .4 });
  const big = mesh(G.box(IW, IH, ID, .07, 2), iceM, { cast: false }); put(big, 0, IH / 2, 0); ice.add(big);
  const shine = mc('fz-ice-shine', ({ add }) => {
    add(G.pbox(.04, .52, .01), '#ffffff', -IW / 2 + .12, IH * .6, ID / 2 + .006, 0, 0, .25); add(G.pbox(.025, .26, .01), '#ffffff', -IW / 2 + .21, IH * .68, ID / 2 + .006, 0, 0, .25);
    add(G.pbox(.01, .4, .03), '#ffffff', IW / 2 + .006, IH * .6, -ID / 2 + .15, .25, 0, 0);
    add(G.box(IW - .08, .04, ID - .08, .02), '#f4fbff', 0, IH + .005, 0);
    for (let k = 0; k < 5; k++) add(G.sph(.05 + (k % 2) * .025, 7, 5), FROST, -.28 + k * .14, IH + .025, -.2 + (k % 3) * .17, 0, k, 0, [1.4, .5, 1]);
  });
  ice.add(shine);
  // 파르페 실루엣 (유리컵·딸기 스쿱·웨하스·체리, 꼭 감은 눈) — 얼음 너머로 비침
  const sil = grp(); put(sil, 0, .04, .02); sil.scale.setScalar(.82); ice.add(sil);
  sil.add(mc('fz-ice-parfait', ({ add }) => {
    add(G.cyl(.1, .055, .07, 14), '#d9f1ff', 0, .04, 0); add(G.cyl(.022, .022, .12, 8), '#d9f1ff', 0, .13, 0);
    add(G.cyl(.21, .12, .3, 16), '#d9f1ff', 0, .34, 0);
    add(G.sph(.2, 14, 10), '#ff9fc0', 0, .55, 0, 0, 0, 0, [1.1, .85, 1.05]);
    add(G.sph(.12, 12, 8), '#fff4e2', -.05, .7, .02);
    add(G.sph(.055, 10, 8), RED, .02, .82, .02); add(G.cyl(.006, .006, .08, 4), '#5c8a3a', .03, .89, .02, 0, 0, -.3);
    add(G.box(.05, .22, .03, .01), '#f3c47a', .14, .74, -.04, 0, 0, -.35);
    for (const s of [-1, 1]) add(G.box(.05, .014, .01, .006), INK, s * .07, .55, .2, 0, 0, s * .2);
  }));
  const smalls = [];
  for (const [x, z, s, ry] of [[.3, .24, .2, .3], [-.32, .22, .18, -.2], [.32, -.22, .17, .5]]) {
    const m = mesh(G.box(s, s, s, .03, 2), iceM2, { cast: false }); put(m, x, s / 2, z, 0, ry, 0); ice.add(m); smalls.push(m);
  }
  live(ice);
  // 녹은 물: 바구니 밑 물방울 셋(바구니와 같이), 바닥 웅덩이(아래 자리 밑)
  const drips = grp(); bk.add(drips); drips.visible = false;
  drips.add(live(mc('fz-drips', ({ add }) => { for (const [x, z] of [[-.2, .1], [.15, -.12], [.05, .25]]) add(G.sph(.03, 8, 6), '#9fd6ee', x, -.06, z, 0, 0, 0, [.8, 1.4, .8]); })));
  const pud = mesh(new THREE.CylinderGeometry(1, 1, .012, 28), mat('#9fd6ee', { opacity: .82, rough: .1, rim: .4 }), { cast: false });
  put(pud, BK.down.x, .014, BK.down.z); pud.scale.set(.05, 1, .05); pud.visible = false; pud.userData.noMerge = true; f.add(pud);
  f.live = [...(f.live || []), bk, wheel, rope, pud];
  // 줄·바구니
  const setRope = () => {
    const top = BK.wy, bot = bk.position.y + 1.25, L = Math.max(.02, top - bot);
    rope.scale.set(1, L, 1); rope.position.set(bk.position.x, bot + L / 2, bk.position.z);
  };
  f.setRope = setRope;
  f.setBasket = k => { k = Math.max(0, Math.min(1, k)); bk.position.lerpVectors(BK.up, BK.down, k); wheel.rotation.x = k * PI * 6; setRope(); };
  f.setBasket(0);
  let frostAll = null;
  const frostList = () => {
    if (frostAll && frostAll.length) return frostAll;
    const room = f.group.parent; frostAll = [];
    (room || f.group).traverse(o => { if (o.userData.fzFrost && !(o.parent && o.parent.userData.fzFrost)) frostAll.push(o); });
    frostAll.forEach(o => { o.userData.fzS = o.scale.clone(); });
    return frostAll;
  };
  const smooth = t => t * t * (3 - 2 * t), c01 = t => Math.max(0, Math.min(1, t));
  f.setMelt = t => {
    t = c01(t);
    const k = smooth(t);
    big.scale.set(1 - .5 * k, Math.max(.04, 1 - .96 * k), 1 - .5 * k); big.position.y = IH * big.scale.y / 2;
    shine.scale.set(1 - .5 * k, Math.max(.04, 1 - .96 * k), 1 - .5 * k);
    smalls.forEach((m, i) => { const q = c01(t * 1.6 - i * .12); m.scale.setScalar(Math.max(.02, 1 - q)); m.visible = q < .98; });
    sil.visible = t < .7;
    drips.visible = t > .05 && t < .97;
    const down = bk.position.y < .3;
    pud.visible = t > .02 && down; const ps = .2 + .75 * k; pud.scale.set(ps, 1, ps * .85);
    for (const o of frostList()) { const s = Math.max(.001, 1 - c01(t * 1.25)); o.scale.copy(o.userData.fzS).multiplyScalar(s); o.visible = s > .01; }
  };
  const icePart = f.part('lift', ice, t => { f.setMelt(t); }, { label: K('바구니 속 얼음 블록', 'Ice block in the basket'), sfx: 'whoosh', dur: 2.4 });
  icePart.gpt2Reach = true; icePart.isGadget = true;
  f.ice = ice; f.basket = bk; f.wheel = wheel; f.rope = rope; f.basketUp = BK.up.clone(); f.basketDown = BK.down.clone();
  f.iceAt = new THREE.Vector3(BK.up.x, BK.up.y + .03 + IH / 2, BK.up.z);
  f.spot('inside', bk, 0, .06, 0, { part: icePart, maxH: .95, label: K('얼음 블록 속', 'Inside the ice block'), scale: 1 });
  f.spot('on', null, .3, ys[0] + .03, z0, { maxH: .4, label: K('도르래 선반 아래 칸', 'Pulley rack, bottom'), scale: .8 });
  f.spot('on', null, -.25, ys[1] + .03, z0, { maxH: .5, label: K('도르래 선반 가운데 칸', 'Pulley rack, middle'), scale: .8 });
  f.walkSolids = [[-W / 2 - .02, 0, z0 - D / 2 - .02, W / 2 + .02, BK.top, z0 + D / 2 + .02]];
};

// ── 온풍기: 석유난로 모양 원통(주황 몸통, 크롬 철망 안 열선), 위에 난로 팬, 앞 다이얼 ─────────────────────────────────
B.fz_heater = (f, T) => {
  const R = .25, H = .62;
  const hg = grp(); f.add(hg);
  hg.add(mc('fz-heater', ({ add }) => {
    add(G.cyl(R + .05, R + .07, .06, 22), INK, 0, .03, 0);
    for (let k = 0; k < 3; k++) { const a = k * PI * 2 / 3 + .5; add(G.box(.1, .04, .06, .015), INK, Math.cos(a) * (R + .06), .02, Math.sin(a) * (R + .06), 0, -a, 0); }
    add(G.cyl(R, R, .14, 22), ORANGE, 0, .13, 0);
    add(G.cyl(R + .01, R + .01, .03, 22), ORANGED, 0, .2, 0);
    add(G.cyl(R, R, .1, 22), ORANGE, 0, H - .05, 0); add(G.cyl(R + .01, R + .01, .03, 22), ORANGED, 0, H - .1, 0);
    // 철망 살 (세로)
    for (let k = 0; k < 20; k++) { const a = k / 20 * PI * 2; add(G.cyl(.008, .008, H - .32, 5), CHROME, Math.cos(a) * (R - .005), .2 + (H - .32) / 2 + .01, Math.sin(a) * (R - .005)); }
    // 위 돔 + 손잡이 고리
    add(G.sph(R + .005, 20, 10), ORANGE, 0, H, 0, 0, 0, 0, [1, .35, 1]);
    add(G.tor(.12, .016, PI, 5, 12), CHROME, 0, H + .1, 0, 0, HP, 0);
    // 앞 이름표 + 다이얼 받침
    add(G.box(.2, .07, .02, .01), CREAM, 0, .12, R + .005); add(G.cyl(.065, .065, .03, 18), CHROME, 0, .12 + .0, R + .02, HP, 0, 0);
    // 팬 받침
    add(G.cyl(.03, .05, .1, 10), STEELD, 0, H + .15, -.04); add(G.box(.05, .12, .03, .01), STEELD, 0, H + .24, -.04);
  }));
  // 열선 (빛나는 속): 따로 재질 — setHeat로 밝기
  const coilM = new THREE.MeshToonMaterial({ color: '#7a3b2e', emissive: new THREE.Color('#ff5a2a'), emissiveIntensity: 0 });
  const coil = grp(); hg.add(coil);
  for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(new THREE.TorusGeometry(R - .07, .014, 6, 24), coilM); put(m, 0, .27 + k * .065, 0, HP, 0, 0); coil.add(m); }
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(R - .1, R - .1, H - .34, 16), coilM); put(m, 0, .2 + (H - .34) / 2 + .02, 0); coil.add(m); }
  live(coil);
  // 앞 빛 (켜지면)
  const glowT = fadeDisc(64, '#ffb066', r => 1 - Math.min(1, r)), glow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .9), new THREE.MeshBasicMaterial({ map: glowT, transparent: true, depthWrite: false, opacity: 0 }));
  put(glow, 0, .42, R + .08); glow.renderOrder = 3; glow.userData.noMerge = true; glow.userData.noPick = true; hg.add(glow);
  // 다이얼 (앞) · 난로 팬 날개 (위)
  const knob = grp(); put(knob, 0, .12, R + .045, 0, 0, 0); hg.add(knob);
  knob.add(live(mc('fz-heater-knob', ({ add }) => { add(G.cyl(.055, .055, .04, 16), '#ffffff', 0, 0, 0, HP, 0, 0); add(G.box(.016, .07, .02, .006), RED, 0, .015, .02); })));
  const fan = grp(); put(fan, 0, H + .3, -.01); hg.add(fan);
  fan.add(live(mc('fz-heater-fan', ({ add }) => {
    add(G.cyl(.025, .025, .04, 10), CHROME, 0, 0, 0, HP, 0, 0);
    for (let k = 0; k < 3; k++) add(G.box(.13, .045, .008, .006), '#d9a83a', Math.cos(k * PI * 2 / 3) * .075, Math.sin(k * PI * 2 / 3) * .075, .02, .35, 0, k * PI * 2 / 3);
  })));
  const c = new THREE.Color(), cold = new THREE.Color('#7a3b2e'), hot = new THREE.Color('#ff7a3a');
  f.setHeat = t => { t = Math.max(0, Math.min(1, t)); coilM.emissiveIntensity = 1.6 * t; c.copy(cold).lerp(hot, t); coilM.color.copy(c); glow.material.opacity = .55 * t; glow.visible = t > .01; };
  f.setHeat(0);
  const p = f.part('switch', [hg, knob, fan], t => { knob.rotation.z = -t * PI * 1.25; fan.rotation.z = -t * PI * 8; f.setHeat(t); }, { label: K('온풍기', 'Heater'), sfx: 'click', dur: 1.4 });
  p.gpt2Reach = true;
  f.knob = knob; f.fan = fan; f.coil = coil;
  f.warmAt = new THREE.Vector3(0, .42, R + .12);
  f.collideBox = [-R - .07, 0, -R - .07, R + .07, H + .4, R + .07];
  f.walkSolids = [[-R, 0, -R, R, H + .4, R]];
};

// ── 성에 낀 철제 선반 (2×1, 앞 +z): 4단 — 우유 상자·과일 상자·생크림 통·버터, 둘째 칸 앞은 두꺼운 성에 덩어리(보조: 톡 → 와르르)
B.fz_frostshelf = (f, T) => {
  const W = 1.5, D = .46, Hh = 1.92, ys = [.12, .58, 1.04, 1.5];
  f.add(mc('fz-frostshelf', ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.04, Hh, .04, .01), STEEL, sx * (W / 2 - .02), Hh / 2, -.25 + sz * (D / 2 - .02));
    for (const y of ys) { add(G.box(W, .025, D, .008), STEEL, 0, y, -.25); for (let k = 0; k < 7; k++) add(G.pbox(.008, .01, D - .02), STEELD, -W / 2 + .1 + k * .22, y + .016, -.25); }
    // 바닥 칸: 우유 상자 둘(파랑) + 우유 팩
    for (const x of [-.45, .2]) { add(G.box(.5, .3, .38, .03), MILK, x, ys[0] + .16, -.26); add(G.box(.44, .02, .32, .01), '#3d86c6', x, ys[0] + .3, -.26); for (let k = 0; k < 3; k++) { add(G.box(.1, .2, .1, .01), '#ffffff', x - .13 + k * .13, ys[0] + .25, -.26); add(G.box(.104, .04, .104, .01), MILK, x - .13 + k * .13, ys[0] + .32, -.26); } }
    // 셋째 칸: 과일 상자(딸기·망고 라벨) + 생크림 통
    add(G.box(.46, .24, .34, .02), KRAFT, -.42, ys[2] + .13, -.26); add(G.box(.3, .1, .01, .005), '#ffffff', -.42, ys[2] + .15, -.088); for (let k = 0; k < 3; k++) add(G.sph(.035, 8, 6), RED, -.52 + k * .1, ys[2] + .15, -.08);
    for (let k = 0; k < 3; k++) { add(G.cyl(.08, .08, .16, 14), '#ffffff', .1 + k * .19, ys[2] + .09, -.25); add(G.cyl(.083, .083, .03, 14), PINK, .1 + k * .19, ys[2] + .18, -.25); }
    // 맨 위: 버터 상자, 납작한 쟁반
    add(G.box(.34, .14, .28, .02), YEL, -.4, ys[3] + .08, -.25); add(G.box(.3, .03, .3, .01), STEEL, .35, ys[3] + .03, -.25);
  }));
  f.add(frosty(mc('fz-frostshelf-frost', ({ add }) => {
    const r = rnd(31);
    for (const y of ys) for (let k = 0; k < 6; k++) add(G.sph(.04 + r() * .04, 7, 5), k % 2 ? FROST : FROSTB, -W / 2 + .1 + r() * (W - .2), y + .02, -.25 + D / 2 - .02, 0, r() * 3, 0, [1.6, .5, 1]);
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) add(G.sph(.05, 7, 5), FROST, sx * (W / 2 - .02), .4 + k * .42 + r() * .1, -.25 + D / 2 - .02, 0, 0, 0, [1.2, .8, 1.2]);
    for (let k = 0; k < 5; k++) add(G.cone(.02, .08 + (k % 3) * .04, 5), FROSTB, -.5 + k * .25, ys[3] - .04, -.25 + D / 2 - .03, PI, 0, 0);
  })));
  // 둘째 칸 성에 덩어리 (보조 장치): 톡 → 금이 가며 앞으로 기울어 떨어지고 부서짐
  const slab = grp(); put(slab, 0, ys[1] + .02, -.25 + D / 2 - .02); f.add(slab);
  slab.add(mc('fz-frostshelf-slab', ({ add }) => {
    add(G.box(W - .1, .4, .08, .04), FROST, 0, .2, 0);
    for (let k = 0; k < 8; k++) add(G.sph(.08, 7, 5), k % 2 ? FROSTB : FROST, -W / 2 + .14 + k * .18, .2 + (k % 3 - 1) * .1, .04, 0, k, 0, [1.3, 1, .6]);
    add(G.pbox(.6, .01, .01), '#bfe0f0', -.1, .22, .05, 0, 0, .4); add(G.pbox(.4, .01, .01), '#bfe0f0', .3, .16, .05, 0, 0, -.5);
  }));
  const p = f.part('lift', slab, (t, b) => { const k = Math.min(1, t * 1.4); slab.rotation.x = b.r.x + k * 1.2; slab.position.y = b.p.y - .5 * t * t; slab.position.z = b.p.z + .25 * k; const s = Math.max(.02, 1 - Math.max(0, t - .55) / .45); slab.scale.set(s, s, s); slab.visible = s > .03; },
    { label: K('성에 덩어리', 'Frost crust'), sfx: 'clink', dur: 1.1 });
  p.gpt2Reach = true;
  f.spot('inside', null, -.1, ys[1] + .03, -.26, { part: p, maxH: .4, label: K('성에 낀 선반 가운데 칸', 'Frosty shelf, middle'), scale: .85 });
  f.spot('on', null, .15, ys[3] + .03, -.25, { maxH: .36, label: K('철제 선반 맨 위', 'Top of the steel shelf'), scale: .8 });
  f.spot('on', null, .45, ys[2] + .03, -.12, { maxH: .4, label: K('생크림 통 옆', 'By the cream tubs'), scale: .75 });
  f.collideBox = [-W / 2, 0, -.5, W / 2, Hh, 0];
};

// ── 업소용 아이스크림 냉동고 (1×1, 앞 +z): 흰 몸통, 파란 띠 라벨, 위 미닫이 유리 뚜껑 둘(보조: 뒤 뚜껑이 앞으로 스르륵), 속에 통 넷
B.fz_icecreamchest = (f, T) => {
  const W = 1.24, D = .66, Hh = .82;
  f.add(mc('fz-chest', ({ add }) => {
    add(G.box(W, Hh - .06, D, .06), '#ffffff', 0, (Hh - .06) / 2 + .06, -.08);
    add(G.box(W - .04, .06, D - .04, .02), STEELD, 0, .03, -.08);
    add(G.box(W + .01, .14, .02, .01), '#5aa9ec', 0, Hh - .25, -.08 + D / 2);
    add(G.box(W + .02, .04, D + .02, .015), STEEL, 0, Hh, -.08);
    // 속 (뚜껑 아래 보이는 통 넷)
    add(G.pbox(W - .1, .02, D - .1), '#c9e6f2', 0, Hh - .2, -.08);
    for (let k = 0; k < 4; k++) { const x = -.42 + k * .28; add(G.cyl(.11, .11, .16, 16), '#ffffff', x, Hh - .12, -.08); add(G.cyl(.105, .105, .01, 16), ['#ffb3cf', '#bdeedd', '#f6e6c0', '#9a6b4a'][k], x, Hh - .035, -.08); }
    // 뒤 압축기 통풍구
    for (let k = 0; k < 4; k++) add(G.pbox(.3, .015, .01), STEELD, .4, .2 + k * .05, -.08 + D / 2 + .005);
  }));
  { const m = mesh(new THREE.PlaneGeometry(.9, .12), mat('#ffffff', { map: sign(300, 40, '#5aa9ec', [['아이스크림', .55, 28]], { round: 4 }), rough: .9, rim: .1 }), { cast: false }); put(m, -.05, Hh - .25, -.08 + D / 2 + .012); f.add(m); }
  // 고정 앞 뚜껑 + 미닫이 뒤 뚜껑
  f.add(mc('fz-chest-lid0', ({ add }) => { add(G.box(W / 2 - .02, .03, D - .06, .012), '#e1f2f8', W / 4 - .01, Hh + .03, -.08); add(G.pbox(W / 2 - .06, .012, .02), STEEL, W / 4 - .01, Hh + .05, -.08 + D / 2 - .06); }));
  const lid = grp(); put(lid, -W / 4 + .01, Hh + .055, -.08); f.add(lid);
  lid.add(mc('fz-chest-lid1', ({ add }) => { add(G.box(W / 2 - .02, .03, D - .06, .012), '#d7eef6', 0, 0, 0); add(G.box(.18, .03, .05, .01), STEELD, .18, .02, D / 2 - .1); }));
  f.add(frosty(mc('fz-chest-frost', ({ add }) => { const r = rnd(41); for (let k = 0; k < 9; k++) add(G.sph(.04 + r() * .04, 7, 5), k % 2 ? FROST : FROSTB, -W / 2 + .1 + r() * (W - .2), Hh + .06, -.08 - D / 2 + .1 + r() * (D - .2), 0, r() * 3, 0, [1.5, .45, 1.2]); })));
  const p = f.part('slide', lid, (t, b) => { lid.position.x = b.p.x + (W / 2 - .04) * t; lid.position.y = b.p.y + .035 * Math.min(1, t * 4); }, { label: K('아이스크림 냉동고 뚜껑', 'Ice-cream freezer lid'), sfx: 'slide', dur: .6 });
  p.gpt2Reach = true;
  f.spot('inside', null, -W / 4, Hh - .2, -.08, { part: p, maxH: .3, label: K('아이스크림 냉동고 안', 'In the ice-cream freezer'), scale: .85 });
  f.spot('behind', null, W / 2 + .14, 0, -.05, { maxH: .5, label: K('냉동고 옆 틈', 'Beside the freezer'), scale: .8 });
};

// ── 업소용 아이스크림 통 줄과 콘 상자 (1×1): 큰 통 다섯(딸기·민트초코·바닐라·초코 라벨), 콘 상자 둘, 스쿱
let TUBL = null;
const tubLabel = () => TUBL || (TUBL = textTex(512, 64, (c, W, H) => {
  const L = [['딸기', '#ff8fb0'], ['민트초코', '#6fcfb3'], ['바닐라', '#f2c76a'], ['초코', '#9a6b4a']];
  L.forEach(([s, col], i) => { c.fillStyle = '#ffffff'; c.fillRect(i * W / 4, 0, W / 4, H); c.fillStyle = col; c.fillRect(i * W / 4, H * .62, W / 4, H * .38); fitText(c, s, i * W / 4 + W / 8, H * .32, W / 4 * .85, 18, col); });
}));
B.fz_tubs = (f, T) => {
  const cols = [['#ff9fc0', 0], ['#7fd6c0', 1], ['#f6dc8a', 2], ['#9a6b4a', 3], ['#ff9fc0', 0]];
  const pos = [[-.28, 0, .08], [.12, 0, .14], [-.1, 0, -.26], [.3, 0, -.22], [-.08, .3, -.04]];
  f.add(mc('fz-tubs', ({ add }) => {
    pos.forEach(([x, y, z], i) => { add(G.cyl(.17, .15, .28, 18), '#ffffff', x, y + .14, z); add(G.cyl(.175, .175, .035, 18), cols[i][0], x, y + .3, z); add(G.cyl(.06, .06, .02, 10), shade(cols[i][0], -.15), x, y + .325, z); });
    // 콘 상자 둘 (갈색 종이, 콘 그림 대신 세모 줄)
    add(G.box(.42, .34, .3, .02), KRAFT, .55, .17, .2); add(G.box(.36, .26, .3, .02), KRAFTD, .58, .47, .18);
    for (let k = 0; k < 4; k++) add(G.cone(.035, .1, 6), '#d9a35e', .4 + k * .1, .2, .355, PI, 0, 0);
    // 스쿱
    add(G.cyl(.012, .012, .2, 6), CHROME, -.08, .7, -.04, 0, 0, 1.0); add(G.sph(.04, 10, 6), CHROME, -.16, .66, -.04, 0, 0, 0, [1, .6, 1]);
  }));
  const lt = tubLabel();
  pos.forEach(([x, y, z], i) => { const g = new THREE.CylinderGeometry(.172, .162, .1, 18, 1, true); const uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, (cols[i][1] + uv.getX(k)) / 4 * 1); const m = mesh(g, mat('#ffffff', { map: lt, rough: .9, rim: .1 }), { cast: false }); put(m, x, y + .15, z); f.add(m); });
  f.add(frosty(mc('fz-tubs-frost', ({ add }) => { for (let k = 0; k < 5; k++) add(G.sph(.05, 7, 5), FROST, pos[k][0] + .05, pos[k][1] + .33, pos[k][2], 0, k, 0, [1.4, .4, 1]); })));
  f.spot('on', null, .56, .61, .18, { maxH: .36, label: K('콘 상자 위', 'On the cone box'), scale: .8 });
  f.spot('behind', null, .25, 0, -.48, { maxH: .4, label: K('아이스크림 통 뒤', 'Behind the tubs'), scale: .8 });
  f.walkSolids = [[-.46, 0, -.42, .78, .8, .36]];
};

// ── 냉동실 뒤 우유 상자 더미 (장식 — 문틀 뒤라 숨김 자리 없음)
B.fz_crates = (f, T) => {
  f.add(mc('fz-crates', ({ add }) => {
    for (const [x, y, z] of [[-.25, 0, 0], [.25, 0, 0], [0, .3, 0], [-.25, .6, .02]]) { add(G.box(.46, .28, .4, .03), MILK, x, y + .14, z); add(G.box(.4, .02, .34, .01), '#3d86c6', x, y + .27, z); }
    add(G.box(.5, .2, .4, .02), KRAFT, .3, .4, .04); add(G.box(.2, .06, .01, .005), RED, .3, .42, .245);
  }));
  f.add(frosty(mc('fz-crates-frost', ({ add }) => { for (let k = 0; k < 6; k++) add(G.sph(.05, 7, 5), FROST, -.45 + k * .17, .9, 0, 0, k, 0, [1.4, .4, 1]); })));
};

// ── 직원 사물함 (1×1, 앞 +z): 하늘색 두 칸, 이름표(파르페·알바), 통풍 구멍; 옆 고리에 고무 앞치마, 발치 장화
B.fz_locker = (f, T) => {
  const W = .8, D = .45, Hh = 1.72, z0 = -.24, dw = W / 2 - .02;
  f.add(mc('fz-locker', ({ add }) => {
    add(G.box(W, Hh, D, .02), SKYB, 0, Hh / 2, z0);
    add(G.box(W + .02, .04, D + .02, .01), SKYBD, 0, Hh, z0); add(G.box(W + .02, .06, D + .02, .01), SKYBD, 0, .03, z0);
    add(G.pbox(.02, Hh - .1, .01), SKYBD, 0, Hh / 2, z0 + D / 2 + .004);
    // 안 (열면 보임): 선반 둘
    for (const sx of [-1, 1]) { add(G.pbox(dw - .04, .02, D - .06), '#d6e6f2', sx * W / 4, .9, z0); add(G.pbox(dw - .04, .02, D - .06), '#d6e6f2', sx * W / 4, .14, z0); }
    // 옆 고리 + 노란 고무 앞치마 + 장화
    add(G.cyl(.012, .012, .08, 6), STEELD, W / 2 + .03, 1.45, z0 + .05, 0, 0, HP);
    add(G.box(.03, .7, .34, .04), '#f5c84c', W / 2 + .05, 1.08, z0 + .05); add(G.tor(.1, .008, PI, 3, 10), '#d9a83a', W / 2 + .05, 1.45, z0 + .05, 0, HP, 0);
    for (const x of [-.18, .02]) { add(G.cyl(.06, .06, .26, 10), '#4f8fb0', x, .13, z0 + D / 2 + .1); add(G.box(.12, .06, .2, .02), '#4f8fb0', x, .03, z0 + D / 2 + .15); }
    // 위에 박스 하나
    add(G.box(.42, .22, .3, .02), KRAFT, -.12, Hh + .11, z0); add(G.pbox(.43, .04, .02), '#d9c08a', -.12, Hh + .12, z0 + .15);
  }));
  const mk = (side, nm, en) => {
    const pv = grp(); put(pv, side * (W / 2 - .005), 0, z0 + D / 2 + .01); f.add(pv);
    pv.add(mc('fz-locker-door' + side, ({ add }) => {
      add(G.box(dw, Hh - .1, .025, .01), SKYB, -side * dw / 2, Hh / 2, 0);
      for (let k = 0; k < 4; k++) add(G.pbox(dw * .6, .015, .01), SKYBD, -side * dw / 2, Hh - .2 - k * .05, .014);
      add(G.box(.04, .14, .03, .01), CHROME, -side * (dw - .07), 1.0, .02);
      add(G.box(.16, .06, .01, .005), '#ffffff', -side * dw / 2, 1.38, .014);
    }));
    { const m = mesh(new THREE.PlaneGeometry(.15, .055), mat('#ffffff', { map: sign(96, 36, '#ffffff', [[nm, .55, 20, INK]], { round: 4 }), rough: .9, rim: .1 }), { cast: false }); put(m, -side * dw / 2, 1.38, .0205); pv.add(m); }
    const p = f.part('door', pv, (t, b) => { pv.rotation.y = b.r.y + side * 1.75 * t; }, { label: K(`${nm} 사물함`, `${en} locker`), sfx: 'door_metal', dur: .4 });
    p.lockable = true; p.lockAt = { x: -side * (dw - .07), y: 1.0, z: .05, parent: pv };
    f.spot('inside', null, side * W / 4, .92, z0, { part: p, maxH: .5, label: K(`${nm} 사물함 위 칸`, `${en} locker, top`), scale: .85 });
    if (side < 0) f.spot('inside', null, side * W / 4, .16, z0, { part: p, maxH: .6, label: K(`${nm} 사물함 아래 칸`, `${en} locker, bottom`), scale: .9 });
    return p;
  };
  mk(-1, '파르페', 'Parfait'); mk(1, '알바', 'Staff');
  f.spot('on', null, .24, Hh + .01, z0, { maxH: .4, label: K('사물함 위', 'On the lockers'), scale: .8 });
  f.lockAt = { x: 0, y: 1.0, z: z0 + D / 2 + .04 };
};

// ── 계단 밑 비품장 (1×1, 앞 +z): 하얀 두 문, 손잡이 막대, '컵' 라벨; 위엔 컵 홀더 묶음
B.fz_supplycab = (f, T) => {
  const W = .84, D = .44, Hh = 1.06, z0 = -.25;
  f.add(mc('fz-supplycab', ({ add }) => {
    add(G.box(W, Hh, D, .02), '#f6f8f8', 0, Hh / 2, z0); add(G.box(W + .02, .04, D + .02, .01), WOOD, 0, Hh + .02, z0); add(G.box(W - .04, .06, D - .02, .01), STEELD, 0, .03, z0);
    add(G.pbox(W - .08, .02, D - .06), '#e3e9e9', 0, .55, z0);
    for (let k = 0; k < 3; k++) { add(G.cyl(.05, .04, .3, 12), '#ffffff', -.25 + k * .13, .71, z0 - .02); add(G.cyl(.052, .052, .02, 12), '#a8733f', -.25 + k * .13, .87, z0 - .02); }
    for (let k = 0; k < 2; k++) add(G.box(.3, .2, .24, .02), KRAFT, .18, .17 + k * .2, z0, 0, k * .1, 0);
    add(G.box(.2, .12, .2, .02), '#ffffff', -.15, Hh + .1, z0); add(G.box(.12, .1, .12, .02), '#e8b47c', .18, Hh + .09, z0);
  }));
  const pv = grp(); put(pv, -W / 2 + .01, 0, z0 + D / 2 + .01); f.add(pv);
  pv.add(mc('fz-supplycab-door', ({ add }) => { add(G.box(W - .04, Hh - .1, .025, .01), '#fbfcfc', W / 2 - .01, Hh / 2 + .02, 0); add(G.pbox(.012, Hh - .14, .01), '#dfe6e6', W / 2 - .01, Hh / 2 + .02, .014); add(G.box(.025, .16, .03, .01), CHROME, W - .1, .62, .025); }));
  { const m = mesh(new THREE.PlaneGeometry(.22, .09), mat('#ffffff', { map: sign(96, 40, '#ffffff', [['컵', .55, 24, '#a8733f']], { round: 4 }), rough: .9, rim: .1 }), { cast: false }); put(m, W / 2 - .01, .88, .0145); pv.add(m); }
  const p = f.part('door', pv, (t, b) => { pv.rotation.y = b.r.y - 1.7 * t; }, { label: K('계단 밑 비품장', 'Supply cupboard'), sfx: 'open', dur: .4 });
  p.lockable = true; f.lockAt = { x: W / 2 - .1, y: .62, z: z0 + D / 2 + .06 }; p.lockAt = { x: W - .1, y: .62, z: .05, parent: pv };
  f.spot('inside', null, -.18, .57, z0, { part: p, maxH: .42, label: K('비품장 위 칸', 'Cupboard, top shelf'), scale: .85 });
  f.spot('inside', null, -.2, .07, z0 + .04, { part: p, maxH: .42, label: K('비품장 아래 칸', 'Cupboard, bottom'), scale: .85 });
  f.spot('on', null, .02, Hh + .04, z0, { maxH: .4, label: K('비품장 위', 'On the cupboard'), scale: .8 });
};

// ── 계단 (카페 1층 → 지하, 방 좌표에 그대로): 나무 디딤판·노란 미끄럼 방지, 강철 옆판, 서쪽 손잡이; 밑엔 비품장(따로)·컵 상자
B.fz_stairs = (f, T) => {
  const { x0, x1, n } = STAIR, rise = UP / n, run = 3.0 / n;
  f.add(mc('fz-stairs', ({ add, tube }) => {
    for (let k = 0; k < n; k++) {
      const y = (k + 1) * rise, z = -(k + .5) * run;
      add(G.box(x1 - x0 - .08, .05, run + .04, .012), WOOD, (x0 + x1) / 2, y - .025, z);
      add(G.pbox(x1 - x0 - .1, .012, .05), YEL, (x0 + x1) / 2, y + .002, z + run / 2 - .02);
      add(G.pbox(x1 - x0 - .1, rise - .05, .015), '#f3ead8', (x0 + x1) / 2, y - rise / 2 - .02, z + run / 2);
    }
    // 강철 옆판 (비스듬한 띠 둘)
    const L = Math.hypot(UP, 3.0), a = Math.atan2(UP, 3.0);
    for (const x of [x0 + .02, x1 - .02]) add(G.box(.05, .2, L, .02), STEELD, x, UP / 2 - .05, -1.5, a, 0, 0);
    // 손잡이 (서쪽, 앞방 쪽)
    for (let k = 1; k < n; k += 3) { const y = (k + 1) * rise, z = -(k + .5) * run; add(G.cyl(.018, .018, .82, 6), STEEL, x0 + .04, y + .41, z); }
    tube([x0 + .04, rise * 2 + .82, -1.5 * run], [x0 + .04, UP + .8, -3.0 + .05], .025, ORANGE, 8);
    // 계단 밑 받침 기둥
    add(G.box(.08, UP * .55, .08, .02), STEELD, x0 + .06, UP * .55 / 2, -1.6); add(G.box(.08, UP * .55, .08, .02), STEELD, x1 - .06, UP * .55 / 2, -1.6);
    // 밑 컵 상자 더미
    for (const [x, y, z, s] of [[2.3, 0, -1.25, .42], [2.62, 0, -1.2, .36], [2.45, .38, -1.25, .34]]) { add(G.box(s, s * .9, s, .02), KRAFT, x, y + s * .45, z); add(G.pbox(s + .005, .04, .02), '#d9c08a', x, y + s * .5, z + s / 2); }
    // 계단 입구 'CAFE ↑' 판 받침
    add(G.cyl(.02, .02, 1.1, 6), STEELD, x0 + .1, .55, -.12);
  }));
  { const m = mesh(new THREE.PlaneGeometry(.5, .22), mat('#ffffff', { map: sign(200, 88, '#a8733f', [['카페 ↑', .55, 36, '#fff6e0']], { round: 10 }), rough: .9, rim: .1 }), { cast: false }); put(m, x0 + .1, 1.0, -.1, 0, PI / 4, 0); f.add(m); }
  f.spot('on', null, (x0 + x1) / 2, 4 * rise, -3.5 * run, { maxH: .4, label: K('계단 넷째 칸', 'Fourth stair'), scale: .8 });
  f.spot('behind', null, 2.45, .72, -1.25, { maxH: .36, label: K('계단 밑 컵 상자 위', 'On the cup boxes under the stairs'), scale: .8 });
  f.walkSolids = [[x0, 0, -3.0, x1, UP, 0]];
  // (문 열림 검사용 몸통은 계단 위쪽만 — 밑의 비품장 문이 계단 상자에 걸리지 않게)
  f.collideBox = [x0, 1.12, -3.0, x1, UP, -.9];
};

// ── 수레 (1×1, 앞 +z): 2단 철제 서빙 카트 — 위 컵 상자·박스 테이프·작업 장갑, 아래 종이봉투
B.fz_cart = (f, T) => {
  f.add(mc('fz-cart', ({ add, tube }) => {
    for (const y of [.2, .72]) { add(G.box(.86, .03, .5, .02), STEEL, 0, y, 0); add(G.pbox(.86, .05, .02), STEELD, 0, y + .03, .25); add(G.pbox(.86, .05, .02), STEELD, 0, y + .03, -.25); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(G.cyl(.015, .015, .72, 6), STEELD, sx * .41, .44, sz * .23); add(G.cyl(.05, .05, .04, 10), INK, sx * .41, .05, sz * .23, HP, 0, 0); }
    tube([.43, .78, -.2], [.55, .95, -.2], .015, STEELD, 6); tube([.43, .78, .2], [.55, .95, .2], .015, STEELD, 6); tube([.55, .95, -.2], [.55, .95, .2], .02, '#4f8fb0', 6);
    add(G.box(.36, .22, .3, .02), '#ffffff', -.18, .85, -.04); add(G.box(.3, .02, .2, .01), '#a8733f', -.18, .97, -.04);
    add(G.tor(.06, .03, PI * 2, 6, 14), '#c9a37a', .18, .78, .1, HP, 0, 0); add(G.tor(.07, .012, PI * 2, 4, 14), '#e8c48a', .18, .78, .1, HP, 0, 0);
    for (const s of [-1, 1]) add(G.box(.09, .02, .16, .02), '#ffd25c', .26 + s * .03, .745, -.12, 0, s * .3, 0);
    add(G.box(.3, .26, .14, .02), KRAFT, .15, .35, 0); add(G.box(.22, .2, .14, .02), KRAFTD, -.2, .32, .02);
  }));
  f.spot('on', null, .14, .74, -.12, { maxH: .36, label: K('수레 위', 'On the cart'), scale: .8 });
  f.spot('inside', null, -.05, .22, .05, { maxH: .4, label: K('수레 아래 칸', 'Cart, lower shelf'), scale: .8 });
  f.walkSolids = [[-.45, 0, -.26, .45, 1.0, .26]];
};

// ── 대걸레 양동이 (1×1): 노란 짜는 통 + 기댄 대걸레 + 접힌 '미끄럼 주의' 팻말
B.fz_mop = (f, T) => {
  f.add(mc('fz-mop', ({ add, tube }) => {
    add(G.box(.5, .32, .36, .06), YEL, 0, .2, 0); add(G.box(.44, .02, .3, .02), '#7fb6d8', 0, .35, 0);
    for (const sx of [-1, 1]) add(G.cyl(.04, .04, .03, 8), INK, sx * .2, .03, .14, 0, 0, HP);
    add(G.box(.2, .18, .26, .03), '#f0b52c', .1, .45, 0);
    tube([-.06, .2, .02], [-.28, 1.35, -.08], .018, '#c9a37a', 6);
    for (let k = 0; k < 7; k++) add(G.cyl(.02, .015, .22, 5), '#f3f0e6', -.06 + (k - 3) * .025, .2, .02 + (k % 2) * .02, 0, 0, (k - 3) * .08);
    add(G.box(.3, .5, .04, .02), YEL, .42, .25, -.12, -.12, -.3, 0); add(G.box(.2, .2, .01, .005), INK, .42, .3, -.095, -.12, -.3, 0);
  }));
  f.spot('behind', null, 0, 0, -.32, { maxH: .4, label: K('양동이 뒤', 'Behind the mop bucket'), scale: .8 });
  f.walkSolids = [[-.26, 0, -.2, .26, .5, .2]];
};

// ── 포장 작업대 (2×1, 앞 +z): 점검표 클립보드·박스 테이프·저울·온도계, 아래 칸에 접은 상자
B.fz_workbench = (f, T) => {
  const W = 1.4, D = .58, Hh = .84;
  f.add(mc('fz-workbench', ({ add }) => {
    add(G.box(W, .06, D, .02), WOOD, 0, Hh, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.05, Hh - .03, .05, .01), STEELD, sx * (W / 2 - .05), (Hh - .03) / 2, sz * (D / 2 - .05));
    add(G.box(W - .1, .025, D - .1, .01), STEEL, 0, .22, 0);
    for (let k = 0; k < 4; k++) add(G.box(.62, .012, .44, .005), k % 2 ? KRAFT : KRAFTD, -.25, .245 + k * .014, 0, 0, k * .04, 0);
    // 박스 테이프 커터, 저울, 온도계
    add(G.box(.22, .09, .1, .02), RED, .1, Hh + .075, .1); add(G.tor(.05, .025, PI * 2, 6, 14), '#c9a37a', .1, Hh + .13, .1, 0, 0, 0);
    add(G.box(.26, .05, .24, .02), '#ffffff', .48, Hh + .055, -.05); add(G.box(.2, .02, .2, .01), CHROME, .48, Hh + .09, -.05); add(G.box(.1, .03, .01, .005), '#9fe3a6', .48, Hh + .06, .07);
    add(G.cyl(.012, .012, .2, 6), '#ffffff', .2, Hh + .04, -.18, 0, .5, HP); add(G.sph(.018, 6, 6), RED, .1, Hh + .04, -.13);
    // 냉동 딸기 봉지
    add(G.box(.26, .06, .18, .04), '#ffffff', .52, .28, .02); add(G.box(.12, .062, .1, .02), RED, .52, .28, .02);
  }));
  // 클립보드 (점검표)
  { const g = grp(); put(g, -.38, Hh + .035, .02, -HP, 0, -.15); f.add(g);
    g.add(mc('fz-clip', ({ add }) => { add(G.box(.3, .4, .012, .01), '#c9a37a', 0, 0, 0); add(G.box(.12, .04, .02, .01), CHROME, 0, .19, .01); }));
    const m = mesh(new THREE.PlaneGeometry(.26, .34), mat('#ffffff', { map: sign(160, 210, '#ffffff', [['냉동 창고 점검표', .1, 16, INK], ['온도  −18 ✓', .32, 15, '#4f8fb0'], ['문 닫힘  ✓', .5, 15, '#4f8fb0'], ['얼음  ✓', .68, 15, '#4f8fb0'], ['파르페  ?', .86, 15, RED]], { round: 2 }), rough: .9, rim: .1 }), { cast: false });
    put(m, 0, -.02, .008); g.add(m); }
  f.spot('on', null, -.05, Hh + .03, -.12, { maxH: .4, label: K('작업대 위', 'On the workbench'), scale: .8 });
  f.spot('inside', null, .2, .24, 0, { maxH: .5, label: K('작업대 아래 칸', 'Workbench, lower shelf'), scale: .85 });
  f.spot('under', null, -.45, 0, .2, { maxH: .2, label: K('작업대 밑', 'Under the workbench'), scale: .7 });
};

// ── 뒤집는 팻말 (1×1, 앞 +z, 보조): 크롬 기둥 위 판 — 앞 '고장 · 수리 중'(빨강 사선), 톡 → 빙글 → 뒤 '영하 18도 · 꽁꽁'(파랑 눈 결정)
B.fz_flipsign = (f, T) => {
  f.add(mc('fz-flipsign', ({ add }) => {
    add(G.cyl(.2, .22, .05, 18), INK, 0, .025, 0); add(G.cyl(.022, .022, 1.0, 8), CHROME, 0, .52, 0);
    add(G.cyl(.03, .03, .05, 8), CHROME, 0, 1.03, 0);
  }));
  const pv = grp(); put(pv, 0, 1.32, 0); f.add(pv);
  pv.add(mc('fz-flipsign-board', ({ add }) => { add(G.box(.62, .5, .04, .03), '#ffffff', 0, 0, 0); }));
  { const a = mesh(new THREE.PlaneGeometry(.56, .44), mat('#ffffff', { map: sign(240, 190, '#ffffff', [['고장', .36, 64, RED], ['수리 중', .74, 30, '#7a6f80']], { stripe: '#ffd25c', round: 12 }), rough: .9, rim: .1 }), { cast: false }); put(a, 0, 0, .022); pv.add(a);
    const b = mesh(new THREE.PlaneGeometry(.56, .44), mat('#ffffff', { map: sign(240, 190, '#dff2fb', [['❄ 영하 18도', .36, 36, '#3f7fa8'], ['꽁꽁!', .74, 44, '#5aa9ec']], { round: 12 }), rough: .9, rim: .1 }), { cast: false }); put(b, 0, 0, -.022, 0, PI, 0); pv.add(b); }
  const p = f.part('flip', pv, (t, b) => { pv.rotation.y = b.r.y + PI * t; }, { label: K('뒤집는 팻말', 'Flip sign'), sfx: 'flip', dur: .5 });
  p.gpt2Reach = true;
  f.spot('behind', null, .15, 0, -.32, { maxH: .4, label: K('팻말 뒤', 'Behind the sign'), scale: .8 });
  f.collideBox = [-.22, 0, -.22, .22, 1.6, .22];
  f.walkSolids = [[-.22, 0, -.22, .22, 1.6, .22]];
};

// ── 손수레와 우유 상자 (1×1): 빨간 손수레에 파란 우유 상자 셋
B.fz_handtruck = (f, T) => {
  f.add(mc('fz-handtruck', ({ add, tube }) => {
    tube([-.2, .05, -.2], [-.2, 1.25, -.32], .025, RED, 8); tube([.2, .05, -.2], [.2, 1.25, -.32], .025, RED, 8); tube([-.2, 1.25, -.32], [.2, 1.25, -.32], .025, RED, 8);
    add(G.box(.48, .03, .26, .01), STEELD, 0, .03, -.06); for (const sx of [-1, 1]) add(G.cyl(.09, .09, .06, 14), INK, sx * .26, .09, -.22, 0, 0, HP);
    for (let k = 0; k < 3; k++) { add(G.box(.44, .27, .36, .03), MILK, 0, .19 + k * .29, -.08 - k * .02); add(G.box(.38, .02, .3, .01), '#3d86c6', 0, .31 + k * .29, -.08 - k * .02); for (let m = 0; m < 3; m++) add(G.box(.09, .18, .09, .01), '#ffffff', -.12 + m * .12, .2 + k * .29, -.08 - k * .02); }
  }));
  f.spot('on', null, 0, .92, -.12, { maxH: .36, label: K('우유 상자 위', 'On the milk crates'), scale: .8 });
  f.spot('behind', null, .38, 0, 0, { maxH: .4, label: K('손수레 옆', 'Beside the hand truck'), scale: .8 });
  f.walkSolids = [[-.28, 0, -.4, .28, 1.3, .1]];
};

export const FZ_BUILDERS = B;
const H = { hidden: true, price: 0 };
export const FZ_INFO = {
  fz_shell: { w: 1, d: 1, name: '카페 지하 냉동 창고', ...H },
  fz_coldroom: { w: 1, d: 1, name: '냉동실', ...H },
  fz_basketpulley: { w: 1, d: 1, name: '도르래 높은 선반', ...H },
  fz_heater: { w: 1, d: 1, name: '온풍기', ...H },
  fz_frostshelf: { w: 2, d: 1, name: '성에 낀 철제 선반', ...H },
  fz_icecreamchest: { w: 1, d: 1, name: '아이스크림 냉동고', ...H },
  fz_tubs: { w: 1, d: 1, name: '아이스크림 통 줄', ...H },
  fz_crates: { w: 1, d: 1, name: '우유 상자 더미', ...H },
  fz_locker: { w: 1, d: 1, name: '직원 사물함', ...H },
  fz_supplycab: { w: 1, d: 1, name: '계단 밑 비품장', ...H },
  fz_stairs: { w: 1, d: 1, name: '카페 계단', ...H },
  fz_cart: { w: 1, d: 1, name: '서빙 수레', ...H },
  fz_mop: { w: 1, d: 1, name: '대걸레 양동이', ...H },
  fz_workbench: { w: 2, d: 1, name: '포장 작업대', ...H },
  fz_flipsign: { w: 1, d: 1, name: '뒤집는 팻말', ...H },
  fz_handtruck: { w: 1, d: 1, name: '손수레', ...H },
};
export const FZ_ROOM = { X0, X1, Z0, Z1, UP, FZ, DOOR, STAIR, BK };

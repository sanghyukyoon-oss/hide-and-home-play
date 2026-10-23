// 18판 비교안 '너굴이네 오락실 2층집' otakuloft4 (① 10/23 — 사용자 승인 방향 "ㅇㅇ 니 말이 맞음"): 1층은 문 닫은 동네 오락실(인형 뽑기·오락기),
// 2층이 너굴이 방. 건물 단면은 거대 오락기 캐비닛 옆모습 그대로 — 아래 발판, 앞으로 튀어나온 조작판(큰 단추·스틱), 뒤로 눕는 화면 면, 위로 튀어나온
// 불 켜진 간판(마키) — 지붕엔 거대 조이스틱 간판. 시간 놀이와 이어지게: 반쯤 내린 셔터에 '오늘 영업 끝' 판, 큰 벽시계, 가게 앞 안내판.
// 뒤 멀리 다음 판(19판 소방서)과 하얀 동네 집이 작은 섬 위에 — 카메라가 그쪽을 볼 때만 보임(앞으로 오면 숨김).
// 섬·보도·웅덩이·벽 접기 도우미는 otakuloft3(게임기 집)와 같은 것.
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { rrect, circle, ext, islandShape, ISY, rainTex, tileTex, foldWall, tagWall, basic, rnd, CURB, EARTH, EARTHD, PAVED, LEAF, LEAF2, POLE, WARM, WOODD, CREAM, CORAL, INKY } from './otakuloft3-props.js';

const PI = Math.PI, HP = PI / 2;
// 캐비닛 몸(짙은 체리 — 테두리·두께에만 보임), T-몰딩(노랑 띠), 1층 오락실 벽(남색 바탕에 네온 무늬), 2층 너굴이 방(따뜻한 크림)
const BODY = '#c9524c', BODYD = '#a8433f', TRIM = '#f2c14e', NAVY = '#3a3f74', ROOF = '#8f8aa8', STEEL = '#c9cfd8';
const DECK = 2.1, TOP = 5.0, NX0 = -3.84, NX1 = 3.7, NT = .34, NZ = -3, WX = -3.5, WT = .3, EX = 3.5;
// 옆모습 (z, y): 뒤 아래에서 앞 아래 → 발판 → 조작판 → 화면 면(뒤로 누움) → 간판(앞으로) → 지붕 → 뒤
// (간판은 2층 바닥 앞 끝이 가리지 않는 높이 4.15 m 위로 — 카메라 35°에서 2층이 다 보이게)
const PROFILE = [[-3.0, 0], [3.12, 0], [3.12, 1.0], [3.6, 1.08], [3.6, 1.32], [2.95, 1.42], [2.2, 4.1], [2.8, 4.15], [2.8, 4.75], [2.55, TOP], [-2.65, TOP], [-3.0, TOP - .35]];
const B = {};

let ARC = null, WARMP = null, SIGN = null, CLOSED = null, BOARD = null, MURAL = null;
// 오락실 벽: 남색 바탕에 네온 낙서(동그라미·세모·지그재그) — 옛 오락실 카펫 무늬 (1.6 m 한 장)
const arcadeTex = () => ARC || (ARC = (() => {
  const t = canvasTex(256, 256, (c, W, H) => {
    c.fillStyle = NAVY; c.fillRect(0, 0, W, H);
    const r = rnd(21), cols = ['#ff7fbf', '#5fdbe8', '#ffd25c', '#9f8cff'];
    c.lineWidth = 5; c.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      const x = r() * W, y = r() * H, k = i % 4; c.strokeStyle = c.fillStyle = cols[(i * 3) % 4];
      if (k === 0) { c.beginPath(); c.arc(x, y, 9, 0, PI * 2); c.stroke(); }
      else if (k === 1) { c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x + 9, y + 7); c.lineTo(x - 9, y + 7); c.closePath(); c.stroke(); }
      else if (k === 2) { c.beginPath(); c.moveTo(x - 14, y); for (let s = 0; s < 4; s++) c.lineTo(x - 14 + (s + 1) * 7, y + (s % 2 ? 6 : -6)); c.stroke(); }
      else { c.fillRect(x - 3, y - 3, 6, 6); }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 1.6, 1 / 1.6); return t;
})());
// 2층 너굴이 방 벽지: 따뜻한 크림, 넓은 세로 띠와 작은 별 (1.2 m 한 장)
const warmPaper = () => WARMP || (WARMP = (() => {
  const t = canvasTex(256, 256, (c, W, H) => {
    c.fillStyle = '#f5ecdc'; c.fillRect(0, 0, W, H); c.fillStyle = '#ece0ca'; for (let x = 0; x < W; x += 64) c.fillRect(x, 0, 30, H);
    c.fillStyle = '#e2c99e'; for (let y = 20; y < H; y += 64) for (let x = 46; x < W; x += 64) { c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 2.4 : 6, a = -HP + i * PI / 5; c.lineTo(x + Math.cos(a) * rr, y + ((x / 64) % 2) * 32 + Math.sin(a) * rr); } c.fill(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 1.2, 1 / 1.2); return t;
})());
// 1층 옆벽 벽화: 오락기 옆면 그림처럼 비스듬한 줄 셋과 큰 별
const muralTex = () => MURAL || (MURAL = (() => {
  const t = canvasTex(512, 256, (c, W, H) => {
    c.fillStyle = NAVY; c.fillRect(0, 0, W, H);
    for (const [k, col] of [[0, '#e8705f'], [1, '#f2c14e'], [2, '#5fdbe8']]) { c.save(); c.translate(W * .55, H * .55); c.rotate(-.42); c.fillStyle = col; c.fillRect(-W, -40 + k * 34, W * 2, 20); c.restore(); }
    c.fillStyle = '#ffe14d'; c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 24 : 58, a = -HP + i * PI / 5; c.lineTo(120 + Math.cos(a) * rr, 92 + Math.sin(a) * rr); } c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(120, 92, 14, 0, PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.fillText('HI-SCORE  너굴  999900', 330, 220);
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
})());
// 간판(마키): 불 켜진 '너굴 오락실'
const signTex = () => SIGN || (SIGN = canvasTex(512, 64, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#3a2f6a'); g.addColorStop(.5, '#5a3f8a'); g.addColorStop(1, '#3a2f6a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = '#ff7fbf'; c.fillText('★ 너굴 오락실 ★', W / 2 + 2, H / 2 + 3); c.fillStyle = '#fff4c2'; c.fillText('★ 너굴 오락실 ★', W / 2, H / 2 + 1);
}));
// 셔터에 건 판: 오늘 영업 끝 (시간 놀이)
const closedTex = () => CLOSED || (CLOSED = canvasTex(256, 96, (c, W, H) => {
  c.fillStyle = CREAM; c.fillRect(0, 0, W, H); c.strokeStyle = CORAL; c.lineWidth = 6; c.strokeRect(5, 5, W - 10, H - 10);
  c.fillStyle = '#3e3b55'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('오늘 영업 끝!', W / 2, 34);
  c.fillStyle = CORAL; c.font = 'bold 22px sans-serif'; c.fillText('내일 오전 10시에 만나요', W / 2, 68);
}));
// 가게 앞 안내판
const boardTex = () => BOARD || (BOARD = canvasTex(128, 160, (c, W, H) => {
  c.fillStyle = '#2f3a36'; c.fillRect(0, 0, W, H); c.strokeStyle = '#c9a27a'; c.lineWidth = 8; c.strokeRect(4, 4, W - 8, H - 8);
  c.fillStyle = '#ffffff'; c.font = 'bold 20px sans-serif'; c.textAlign = 'center'; c.fillText('영업 시간', W / 2, 36);
  c.fillStyle = '#ffd25c'; c.font = 'bold 22px sans-serif'; c.fillText('10:00', W / 2, 72); c.fillText('~ 22:00', W / 2, 100);
  c.fillStyle = '#ff9fc8'; c.font = 'bold 16px sans-serif'; c.fillText('인형 뽑기 1판', W / 2, 130); c.fillText('500원', W / 2, 150);
}));

// 굵은 선 한 줄 (모양 테두리를 상자 조각으로): 두 점 사이 상자, 평면은 (z, y), x 두께
const seg = (add, x, w, a, b, t, color) => { const [z0, y0] = a, [z1, y1] = b, L = Math.hypot(z1 - z0, y1 - y0); if (L < .01) return; add(G.box(w, t, L + t * .6, .02), color, x, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y1 - y0, z1 - z0), 0, 0); };
// 옆모습 Shape: 모양 좌표 (u = -z, y) — y축으로 +90° 돌리면 u → -z, 두께 → +x
const profileShape = () => { const s = new THREE.Shape(); PROFILE.forEach(([z, y], i) => i ? s.lineTo(-z, y) : s.moveTo(-z, y)); s.closePath(); return s; };

B.ol4_shell = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.3, 0, .001, -.29, .001];
  // 섬 (게임기 집과 같은 둥근 섬, 연석·잔디·맨홀)
  f.add(mc('ol4-island', ({ add }) => {
    add(ext(islandShape(), .3, 16), PAVED, 0, ISY - .3, 0, -HP, 0, 0);
    add(ext(islandShape(.22), .42, 16), EARTH, 0, ISY - .72, 0, -HP, 0, 0);
    add(ext(islandShape(.42), .14, 16), EARTHD, 0, ISY - .86, 0, -HP, 0, 0);
    const ring = islandShape(); ring.holes.push(islandShape(.16)); add(ext(ring, .07, 16), CURB, 0, ISY - .002, 0, -HP, 0, 0);
    add(G.box(NX1 - NX0 + .14, .16, 3.12 - NZ + NT, .04), BODYD, (NX0 + NX1 + .14) / 2, -.082, (NZ - NT + 3.12) / 2);
    for (const [x, z, n] of [[-4.0, -.6, 5], [-3.95, 1.4, 4], [4.6, -1.7, 5], [4.75, .2, 4], [-2.6, -3.5, 4], [2.2, -3.55, 5], [4.3, 2.9, 4]])
      for (let k = 0; k < n; k++) { const a = k * 2.3; add(G.sph(.09 + (k % 3) * .02, 8, 6), k % 2 ? LEAF : LEAF2, x + Math.cos(a) * .09, ISY + .04 + (k % 2) * .03, z + Math.sin(a) * .07, 0, 0, 0, [1.1, .8, 1]); }
    add(G.cyl(.32, .32, .02, 24), '#6d7286', 4.2, ISY + .01, 2.6); add(G.tor(.32, .025, PI * 2, 4, 24), '#5b6074', 4.2, ISY + .02, 2.6, HP, 0, 0);
    for (let k = -2; k <= 2; k++) add(G.box(.5 - Math.abs(k) * .1, .012, .03, .004), '#5b6074', 4.2, ISY + .025, 2.6 + k * .1);
    // 웅덩이 (짙은 물·밝은 테·빗물 동그라미·간판 빛 한 줄)
    for (const [x, z, rx, rz, a] of [[4.3, .6, .5, .3, .3], [.9, 4.0, .62, .34, -.1], [3.1, 3.95, .4, .24, .2]]) {
      add(G.cyl(1, 1, .01, 28), '#4b5680', x, ISY + .008, z, 0, a, 0, [rx, 1, rz]); add(G.cyl(1, 1, .006, 28), '#6c78a6', x, ISY + .006, z, 0, a, 0, [rx + .05, 1, rz + .04]);
      for (const [dx, dz, r] of [[-.12, .02, .08], [.14, -.05, .05]]) add(G.tor(r, .006, PI * 2, 3, 18), '#a9b6e0', x + dx, ISY + .016, z + dz, HP, 0, 0);
      add(G.box(rx * .9, .004, .035, .002), '#ffb8dc', x, ISY + .016, z + rz * .2, 0, a + .05, 0);
    }
    // 가로등 (앞 왼쪽)
    const lx = -1.5, lz = 4.05;
    add(G.cyl(.16, .2, .14, 12), POLE, lx, ISY + .07, lz); add(G.cyl(.05, .065, 2.5, 10), POLE, lx, ISY + 1.32, lz);
    add(G.box(.06, .06, .5, .02), POLE, lx, ISY + 2.6, lz - .22); add(G.cone(.2, .16, 12), POLE, lx, ISY + 2.56, lz - .45);
  }));
  { const b = mesh(new THREE.SphereGeometry(.085, 10, 8), mat(WARM, { emissive: WARM, ei: 1.2 }), { cast: false }); put(b, -1.5, ISY + 2.44, 3.6); f.add(b); }
  { const g = new THREE.ShapeGeometry(islandShape(.16), 16); const m = mesh(g, mat('#ffffff', { map: tileTex(), rough: .5, rim: .1 }), { cast: false }); put(m, 0, ISY + .002, 0, -HP, 0, 0); m.userData.floor = true; f.add(m); }
  // 가게 앞 영업 시간 안내판 (A자 판)
  f.add(mc('ol4-aboard', ({ add }) => { for (const s of [-1, 1]) add(G.box(.5, .7, .03, .01), '#c9a27a', 2.2, ISY + .35, 3.75 + s * .1, s * .2, 0, 0); }));
  { const b = mesh(new THREE.PlaneGeometry(.42, .54), mat('#ffffff', { map: boardTex(), rough: .8, rim: .1 }), { cast: false }); put(b, 2.2, ISY + .37, 3.905, .2, 0, 0); f.add(b); }
  // 2층 바닥 앞 끝을 받치는 들보와 왼쪽 기둥 (오른쪽 기둥은 다락 것)
  f.add(mc('ol4-beam', ({ add }) => { add(G.box(.14, DECK - .2, .14, .03), WOODD, -3.43, (DECK - .2) / 2, -.07); add(G.box(.14, DECK - .2, .14, .03), WOODD, -3.43, (DECK - .2) / 2, -2.93); }));

  // ── 뒷벽: 캐비닛 뒤판 — 1층은 오락실 벽, 2층은 너굴이 방(비 오는 창·꼬마전구), 지붕 반쯤 덮고 거대 조이스틱 간판 ───────
  const N = foldWall(f, [0, 0, 1], TOP); N.th = -.18;
  {
    const body = new THREE.Shape(); rrect(body, NX0, 0, NX1, TOP, [0, 0, .35, .35]);
    const WIN = [-1.6, 3.05, .4, 4.3];
    body.holes.push(rrect(new THREE.Path(), ...WIN, .08));
    N.g.add(mc('ol4-back', ({ add }) => {
      add(ext(body, NT, 8), BODY, 0, 0, NZ - NT);
      add(G.box(NX1 - NX0, .14, .06, .02), TRIM, (NX0 + NX1) / 2, TOP - .07, NZ + .02);
      add(G.box(NX1 - NX0 - .3, .12, .05, .02), '#2a2d55', (NX0 + NX1) / 2, .06, NZ + .025);
    }));
    const low = mesh(new THREE.PlaneGeometry(NX1 - .02 - WX, DECK), mat('#ffffff', { map: arcadeTex(), rough: .9, rim: .1 }), { cast: false }); put(low, (WX + NX1) / 2, DECK / 2, NZ + .003); N.g.add(low);
    const up = new THREE.Shape(); rrect(up, WX, DECK, NX1 - .02, TOP - .14, 0); up.holes.push(rrect(new THREE.Path(), ...WIN, .08));
    const um = mesh(new THREE.ShapeGeometry(up, 6), mat('#ffffff', { map: warmPaper(), rough: .9, rim: .1 }), { cast: false }); put(um, 0, 0, NZ + .003); N.g.add(um);
    N.knee.add(mc('ol4-back-knee', ({ add }) => { add(G.box(NX1 - NX0, .42, NT, .05), BODY, (NX0 + NX1) / 2, .21, NZ - NT / 2); add(G.box(NX1 - NX0, .05, NT + .04, .02), TRIM, (NX0 + NX1) / 2, .42, NZ - NT / 2); }));
    // 비 오는 창 (나무 틀·십자 살·창턱·꼬마전구)
    { const gl = new THREE.Mesh(new THREE.ShapeGeometry(rrect(new THREE.Shape(), ...WIN, .08), 6), basic(rainTex(), '#d8def5')); gl.position.z = NZ - NT * .55; N.deco.add(gl); }
    N.deco.add(mc('ol4-window', ({ add }) => {
      const [x0, y0, x1, y1] = WIN, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      for (const y of [y0, y1]) add(G.box(x1 - x0 + .16, .08, .1, .02), '#b98a5c', cx, y, NZ + .02); for (const x of [x0, x1]) add(G.box(.08, y1 - y0 + .08, .1, .02), '#b98a5c', x, cy, NZ + .02);
      add(G.box(.05, y1 - y0, .05, .01), '#b98a5c', cx, cy, NZ - .1); add(G.box(x1 - x0, .05, .05, .01), '#b98a5c', cx, cy, NZ - .1);
      add(G.box(x1 - x0 + .3, .06, .2, .02), '#b98a5c', cx, y0 - .06, NZ + .08);
      // 오락실 쪽: 큰 벽시계(시간 놀이), 점수판 포스터
      add(G.cyl(.28, .28, .05, 24), CREAM, -2.75, 1.45, NZ + .03, HP, 0, 0); add(G.tor(.28, .035, PI * 2, 6, 24), CORAL, -2.75, 1.45, NZ + .06);
      add(G.box(.025, .18, .01, .005), INKY, -2.75, 1.51, NZ + .065); add(G.box(.14, .025, .01, .005), INKY, -2.69, 1.45, NZ + .065, 0, 0, .5);
      for (let k = 0; k < 12; k++) { const a = k * PI / 6; add(G.box(.02, .04, .01, .003), INKY, -2.75 + Math.sin(a) * .22, 1.45 + Math.cos(a) * .22, NZ + .06, 0, 0, -a); }
    }));
    { const pts = []; for (let k = 0; k <= 18; k++) { const t = k / 18; pts.push([-3.3 + t * 6.6, 4.62 - Math.sin(t * PI * 4) ** 2 * .12]); }
      N.deco.add(mc('ol4-fairy', ({ tube }) => { for (let k = 0; k < pts.length - 1; k++) tube([pts[k][0], pts[k][1], NZ + .06], [pts[k + 1][0], pts[k + 1][1], NZ + .06], .008, '#5a5470', 4); }));
      const cols = ['#ffd98a', '#ff9fb8', '#9fd8ff', '#b9f0a0']; for (let k = 0; k < 17; k++) { const t = (k + .5) / 17, c = cols[k % 4]; const b = mesh(new THREE.SphereGeometry(.035, 8, 6), mat(c, { emissive: c, ei: 1.1 }), { cast: false }); put(b, -3.3 + t * 6.6, 4.57 - Math.sin(t * PI * 4) ** 2 * .12, NZ + .07); N.deco.add(b); } }
    // 지붕 (뒤 절반만 덮음 — 단면이 보이게) + 거대 조이스틱 간판과 큰 단추 둘
    N.deco.add(mc('ol4-roof', ({ add }) => {
      add(G.box(NX1 - NX0 + .2, .22, 1.95, .06), ROOF, (NX0 + NX1) / 2, TOP + .11, NZ - NT + .95);
      add(G.box(NX1 - NX0 + .24, .08, .1, .02), TRIM, (NX0 + NX1) / 2, TOP + .2, NZ - NT + 1.92);
      const jx = 1.7, jz = -2.25, jy = TOP + .22;
      add(G.box(1.3, .3, 1.1, .1), '#2f2b3d', jx, jy + .15, jz); add(G.cyl(.32, .4, .2, 18), '#3e3b55', jx, jy + .4, jz);
      add(G.cyl(.09, .09, 1.25, 12), STEEL, jx + .12, jy + 1.0, jz + .08, .14, 0, -.18);
      add(G.sph(.55, 22, 16), '#e8414e', jx + .25, jy + 1.75, jz + .17); add(G.sph(.16, 12, 8), '#ff9a8f', jx + .08, jy + 1.95, jz + .4);
      for (const [x, z, c] of [[-.4, -2.3, '#f2c14e'], [-1.3, -2.1, '#5fb8e8']]) { add(G.cyl(.34, .38, .12, 20), '#2f2b3d', x, jy + .06, z); add(G.cyl(.3, .3, .14, 20), c, x, jy + .18, z); }
    }));
    tagWall(N.g, 'N'); tagWall(N.deco, 'N'); tagWall(N.knee, 'N');
  }

  // ── 옆벽: 캐비닛 옆모습 (안쪽: 1층 앞은 옆면 벽화, 2층 방은 크림 벽지·둥근 창) ─────────────────────────────────────
  const W = foldWall(f, [1, 0, 0], TOP); W.th = -.18;
  {
    const wall = grp(); wall.rotation.y = HP; wall.position.x = WX - WT; W.g.add(wall);
    const prof = profileShape();
    const porth = circle(new THREE.Path(), 1.5, 3.45, .3); prof.holes.push(porth);
    wall.add(mc('ol4-side', ({ add }) => { add(ext(prof, WT, 6), BODY, 0, 0, 0); }));
    // 안쪽 면: 벽화(1층 전체 면) — 옆모습 모양 그대로 자른 판에 그림을 붙임, 2층 방 부분은 벽지
    const inner = profileShape(); inner.holes.push(circle(new THREE.Path(), 1.5, 3.45, .3));
    const im = mesh(new THREE.ShapeGeometry(inner, 6), mat('#ffffff', { map: muralTex(), rough: .9, rim: .1 }), { cast: false });
    // (벽화 UV: 모양 좌표 → 0..1 — u -3.6..3.0, y 0..TOP)
    { const uv = im.geometry.attributes.uv, pos = im.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 3.6) / 6.6, pos.getY(i) / TOP); uv.needsUpdate = true; }
    put(im, 0, 0, WT + .003); wall.add(im);
    const room2 = new THREE.Shape(); rrect(room2, .05, DECK, 3.0, TOP - .2, [0, 0, .25, 0]); room2.holes.push(circle(new THREE.Path(), 1.5, 3.45, .3));
    const rm = mesh(new THREE.ShapeGeometry(room2, 8), mat('#ffffff', { map: warmPaper(), rough: .9, rim: .1 }), { cast: false }); put(rm, 0, 0, WT + .006); wall.add(rm);
    W.knee.add(mc('ol4-side-knee', ({ add }) => { add(G.box(WT, .42, 6.12, .05), BODY, WX - WT / 2, .21, .06); add(G.box(WT + .04, .05, 6.12, .02), TRIM, WX - WT / 2, .42, .06); }));
    // T-몰딩 (옆모습 앞 가장자리와 위를 따라 노란 띠), 둥근 창 테·유리
    W.deco.add(mc('ol4-side-trim', ({ add }) => {
      for (let k = 1; k < PROFILE.length; k++) seg(add, WX - WT / 2, WT + .06, PROFILE[k - 1], PROFILE[k], .09, TRIM);
      add(G.tor(.3, .05, PI * 2, 8, 24), '#b98a5c', WX + .03, 3.45, -1.5, 0, HP, 0);
      // 조작판 (가게 앞에 튀어나온 판): 큰 단추 넷과 스틱 — 바깥 의자처럼
      add(G.box(1.24, .3, .48, .05), BODY, WX - .34 + .62, 1.18, 3.36); add(G.box(1.28, .05, .52, .02), TRIM, WX - .34 + .62, 1.33, 3.36);
      for (const [dx, c] of [[.2, '#e8414e'], [.42, '#f2c14e'], [.64, '#5fb8e8'], [.86, '#7fd6a0']]) add(G.cyl(.08, .08, .07, 16), c, WX - .34 + dx, 1.38, 3.4);
      add(G.cyl(.02, .02, .2, 8), INKY, WX - .34 + 1.08, 1.45, 3.36); add(G.sph(.065, 10, 8), '#e8414e', WX - .34 + 1.08, 1.56, 3.36);
      // 1층 옆벽 시계 대신 '동전 넣는 곳' 표시 둘 (벽화 아래)
      for (const z of [1.2, 2.2]) { add(G.box(.04, .16, .1, .01), '#2f2b3d', WX + .02, .95, z); add(G.box(.05, .03, .06, .005), '#ffd25c', WX + .04, .98, z); }
    }));
    { const gl = mesh(new THREE.CircleGeometry(.3, 20), basic(rainTex(), '#d8def5'), { cast: false }); gl.rotation.y = HP; gl.position.set(WX - WT * .5, 3.45, -1.5); W.deco.add(gl); }
    tagWall(W.g, 'W'); tagWall(W.deco, 'W'); tagWall(W.knee, 'W');
  }
  // ── 오른쪽: 옆모습 테두리만 (같은 띠 — 건물이 캐비닛 한 대로 읽히게), 오른쪽에서 볼 때만 숨김 ──────────────────────
  const E = foldWall(f, [-1, 0, 0], TOP); E.th = -.75; E.stub = .02;
  E.g.add(mc('ol4-eframe', ({ add }) => {
    for (let k = 2; k < PROFILE.length; k++) seg(add, EX + .1, .2, PROFILE[k - 1], PROFILE[k], .16, BODY);
    seg(add, EX + .1, .2, PROFILE[PROFILE.length - 1], PROFILE[0].map((v, i) => i ? 0 : -3.0), .16, BODY);
    for (let k = 2; k < PROFILE.length; k++) seg(add, EX + .1, .24, PROFILE[k - 1], PROFILE[k], .05, TRIM);
    add(G.box(.34, .3, .48, .05), BODY, EX + .1, 1.18, 3.36); add(G.cyl(.08, .08, .07, 16), '#e8414e', EX + .1, 1.36, 3.4);
  }));
  tagWall(E.g, 'E');

  // ── 앞 위: 간판(마키) 띠 — 불 켜진 '너굴 오락실' — 그 밑 반쯤 내린 셔터와 '오늘 영업 끝' 판 ─────────────────────────
  f.add(mc('ol4-marquee', ({ add }) => {
    add(G.box(NX1 - NX0 + .2, .78, .46, .06), BODY, (NX0 + NX1) / 2 + .1, 4.55, 2.57);
    add(G.box(NX1 - NX0 + .24, .07, .5, .02), TRIM, (NX0 + NX1) / 2 + .1, 4.96, 2.57); add(G.box(NX1 - NX0 + .24, .07, .5, .02), TRIM, (NX0 + NX1) / 2 + .1, 4.14, 2.57);
    // 셔터 통과 조금 내려온 살 (문 닫는 중 — 2층이 가리지 않게 짧게), 거기서 줄 둘로 늘어뜨린 '영업 끝' 판
    add(G.box(NX1 - NX0 - .3, .2, .26, .08), '#9aa0b5', (NX0 + NX1) / 2, 4.0, 2.4);
    for (let k = 0; k < 2; k++) add(G.box(NX1 - NX0 - .4, .085, .03, .01), k % 2 ? '#b9bfd0' : '#a9afc2', (NX0 + NX1) / 2, 3.86 - k * .08, 2.43);
    add(G.box(NX1 - NX0 - .38, .05, .05, .015), '#7d8399', (NX0 + NX1) / 2, 3.75, 2.44);
    for (const x of [-.45, .45]) add(G.cyl(.006, .006, 1.0, 4), '#5a5470', x, 3.22, 2.47);
  }));
  { const s = mesh(new THREE.PlaneGeometry(NX1 - NX0 - .4, .56), basic(signTex(), '#f2eaf6'), { cast: false }); put(s, (NX0 + NX1) / 2 + .1, 4.55, 2.805); f.add(s); }
  { const s = mesh(new THREE.PlaneGeometry(1.0, .38), mat('#ffffff', { map: closedTex(), rough: .8, rim: .1 }), { cast: false }); put(s, 0, 2.52, 2.47); f.add(s); }
  { const cols = ['#fff1b8', '#ffb8dc']; for (let k = 0; k < 24; k++) { const c = cols[k % 2], b = mesh(new THREE.SphereGeometry(.04, 8, 6), mat(c, { emissive: c, ei: 1.0 }), { cast: false }); put(b, NX0 + .3 + k * (NX1 - NX0 - .6) / 23, 4.96, 2.83); f.add(b); } }

  // ── 뒤 멀리 이어지는 동네: 다음 판 19판 소방서와 하얀 집 둘, 작은 섬 위 (카메라가 이쪽을 볼 때만) ─────────────────────
  const town = [];
  const isle = (x, z, r, build) => { const g = grp(); g.position.set(x, -1.4, z); g.scale.setScalar(.6); f.add(g); g.add(mc('ol4-town-isle|' + r, ({ add }) => { add(G.cyl(r, r * .9, .3, 24), '#ece8f2', 0, -.15, 0); add(G.cyl(r * .9, r * .6, .35, 24), '#bdb6cf', 0, -.47, 0); })); build(g); town.push(g); return g; };
  isle(-10.9, -9.3, 1.6, g => g.add(mc('ol4-town-fire', ({ add }) => {
    add(G.box(1.7, 1.1, 1.1, .05), '#f6f3f8', 0, .55, 0); add(G.box(1.8, .12, 1.2, .03), '#e0605a', 0, 1.15, 0);
    add(G.box(.7, .7, .03, .02), '#e8705f', -.35, .36, .56); for (let k = 0; k < 4; k++) add(G.box(.66, .02, .02, .005), '#c9524c', -.35, .14 + k * .16, .58);
    add(G.box(.42, .2, .03, .02), '#e0605a', .45, .9, .56); add(G.box(.28, .26, .03, .01), '#ffe2a6', .45, .45, .56);
    add(G.box(.4, 1.9, .4, .03), '#f6f3f8', -.95, .95, -.2); add(G.box(.48, .1, .48, .02), '#e0605a', -.95, 1.92, -.2); add(G.box(.18, .18, .03, .01), '#ffe2a6', -.95, 1.5, 0);
    add(G.sph(.07, 8, 6), '#ff5a4a', .8, 1.28, .4);
  })));
  isle(-5.5, -14.5, 1.3, g => g.add(mc('ol4-town-house', ({ add }) => {
    add(G.box(1.0, .8, .9, .04), '#f7f5f9', 0, .4, 0);
    const tri = new THREE.Shape(); tri.moveTo(-.62, 0); tri.lineTo(.62, 0); tri.lineTo(0, .5); tri.closePath(); add(ext(tri, 1.0, 2), '#c9c4d8', 0, .8, -.5);
    add(G.box(.22, .22, .03, .01), '#ffe2a6', -.22, .48, .46); add(G.box(.2, .4, .03, .01), '#b9b2cc', .22, .2, .46);
  })));
  isle(-9.5, -14.1, 1.1, g => g.add(mc('ol4-town-house2', ({ add }) => {
    add(G.box(.8, 1.2, .8, .04), '#f7f5f9', 0, .6, 0); add(G.box(.86, .08, .86, .02), '#c9c4d8', 0, 1.22, 0);
    for (const y of [.4, .85]) add(G.box(.2, .2, .03, .01), y > .5 ? '#ffe2a6' : '#d9d4e6', .15, y, .41);
  })));
  for (const g of town) g.traverse(m => { if (m.isMesh) { m.userData.noMerge = true; m.castShadow = false; } });
  (f.live || (f.live = [])).push(...town);

  // 벽 접기(방 벽처럼 안쪽 법선 · 카메라 < 문턱) + 뒤 동네는 카메라 반대쪽에 있을 때만
  const cam = new THREE.Vector3(), nrm = new THREE.Vector3(), p = new THREE.Vector3(), o = new THREE.Vector3();
  f.updateView = (Wd, dt = 1 / 60) => {
    if (!Wd || !Number.isFinite(Wd.yaw)) return;
    f.group.updateWorldMatrix(true, false);
    cam.set(Math.sin(Wd.yaw), 0, Math.cos(Wd.yaw));
    const sm = 1 - Math.exp(-Math.max(0, dt) * 12);
    let dirty = false;
    for (const q of f.ol3Walls) {
      nrm.copy(q.n).transformDirection(f.group.matrixWorld);
      const want = nrm.dot(cam) < (q.th ?? -.18) ? 0 : 1, prev = q.k;
      q.k += (want - q.k) * sm; if (Math.abs(q.k - want) < .002) q.k = want;
      if (q.k === prev) continue;
      q.g.scale.y = q.stub + (1 - q.stub) * q.k;
      q.deco.visible = q.k > .65; q.g.visible = q.k > .3; q.knee.visible = q.k <= .3 && q.knee.children.length > 0;
      dirty = true;
    }
    f.group.getWorldPosition(o);
    for (const g of town) { g.getWorldPosition(p); p.sub(o); p.y = 0; const on = p.normalize().dot(cam) < -.35; if (g.visible !== on) { g.visible = on; dirty = true; } }
    if (dirty) { Wd.shadowDirty = true; Wd.idsDirty = true; }
  };
};

// ── 동전 교환기 (1×1): 크림 몸에 코랄 앞판, 지폐·동전 넣는 곳, 동전 받는 컵(숨김 자리), '동전 교환' 띠
B.ol4_changer = (f, T) => {
  const z0 = -.18;
  f.add(mc('ol4-changer', ({ add }) => {
    add(G.box(.58, 1.48, .44, .05), CREAM, 0, .74, z0); add(G.box(.5, .9, .03, .03), CORAL, 0, .95, z0 + .22);
    add(G.box(.3, .1, .02, .02), '#fff4c2', 0, 1.3, z0 + .24); add(G.box(.18, .03, .02, .01), '#2f2b3d', -.08, 1.08, z0 + .24); add(G.box(.04, .08, .02, .01), '#2f2b3d', .14, 1.05, z0 + .24);
    for (const [x, c] of [[-.12, '#7fd6a0'], [0, '#f2c14e'], [.12, '#5fb8e8']]) add(G.cyl(.03, .03, .03, 12), c, x, .88, z0 + .24, HP, 0, 0);
    add(G.box(.3, .04, .16, .01), '#c9cfd8', 0, .34, z0 + .3); add(G.box(.3, .14, .02, .01), '#c9cfd8', 0, .41, z0 + .37);
    add(G.box(.6, .06, .46, .02), '#2f2b3d', 0, .03, z0);
  }));
  { const s = mesh(new THREE.PlaneGeometry(.3, .07), basic(canvasTex(128, 32, (c, W, H) => { c.fillStyle = '#fff4c2'; c.fillRect(0, 0, W, H); c.fillStyle = '#3e3b55'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('동전 교환', W / 2, H / 2 + 1); }), '#e6e0e8'), { cast: false }); put(s, 0, 1.3, z0 + .252); f.add(s); }
  f.spot('inside', null, 0, .37, z0 + .3, { maxH: .1, label: '동전 받는 컵', scale: .55 });
  f.spot('on', null, 0, 1.48, z0, { maxH: .3, label: '동전 교환기 위', scale: .7 });
  f.spot('behind', null, .36, 0, z0, { maxH: .4, label: '동전 교환기 옆 틈', scale: .7 });
};

// (18판 새 안 otakuloft5 — 오락실 2층집 다시 짓기 — 가 같은 그림·도우미를 씀: gfx/otakuloft5-props.js)
export { arcadeTex, warmPaper, muralTex, signTex, closedTex, boardTex, seg, BODY, BODYD, TRIM, NAVY, ROOF, STEEL };
export const OL4_BUILDERS = B;
export const OL4_INFO = {
  ol4_shell: { w: 1, d: 1, name: '너굴이네 오락실 2층집', hidden: true, price: 0 },
  ol4_changer: { w: 1, d: 1, name: '동전 교환기', hidden: true, price: 0 },
};

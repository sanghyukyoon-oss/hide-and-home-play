// 18판 새 안 '너굴이네 오락실 2층집' otakuloft5 (① 10/23 — 사용자 "완전히 새롭게 다시. 지금 예전 계단 같은 거 너무 별로야", 방향은 B안).
// 옛 18판 구조(방 안 다락 + 서랍 계단)를 버리고 진짜 두 층으로:
//   1층 = 문 닫은 동네 오락실 — 2층 바닥(두꺼운 판, 밑에 형광등)이 뒤 절반을 덮고, 앞은 탁 트인 두 층 높이; 2층 밑엔 오락기·캡슐 뽑기·동전 교환기·
//         경품 진열장, 앞엔 빨강 경품 오락기·인형 뽑기 둘, 2층 끝에 매달린 둥근 시계(시간 놀이)
//   2층 = 너굴이 방 — 유리 난간, 로프트 침대·만화책장·브라운관·빈백·긴 서랍장(비밀번호 칸)·빨래 건조대
//   오르내리기 — 오른쪽 앞 철제 나선 계단(오르기), 왼쪽 2층 끝에서 1층 앞까지 노란 미끄럼틀(내려오기), 가운데 집게 크레인 바구니(물건 오르내림)
//   건물 — 오락기 캐비닛 옆모습 단면(B안 그대로: 조작판 단추, 불 켜진 간판, 지붕 위 거대 조이스틱), 둥근 섬, 뒤 멀리 19판 소방서
// 장치는 전부 터치하면 저절로(크레인: 손잡이 터치 → 바구니가 올라감, 서랍장: 서랍 넷을 다 열면 숨은 칸이 저절로 — 잠겼으면 비밀번호).
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { rrect, circle, ext, islandShape, ISY, rainTex, tileTex, foldWall, tagWall, basic, rnd, CURB, EARTH, EARTHD, PAVED, LEAF, LEAF2, POLE, WARM, WOODD, CREAM, CORAL, INKY } from './otakuloft3-props.js';
import { arcadeTex, warmPaper, muralTex, signTex, closedTex, boardTex, seg, BODY, BODYD, TRIM, ROOF, STEEL } from './otakuloft4-props.js';

const PI = Math.PI, HP = PI / 2;
export const OL5_Y = 2.5;   // 2층 바닥 윗면
const RWID = 7, Y2 = OL5_Y, SLAB_B = 2.2, TOP = 5.2, NX0 = -3.84, NX1 = 3.7, NT = .34, NZ = -3, WX = -3.5, WT = .3, EX = 3.5, SZ = 0;
// 옆모습 (z, y): 간판은 2층 바닥 앞 끝이 가리지 않게 뒤로 당기고 높게 (카메라 35°)
const PROFILE = [[-3.0, 0], [3.12, 0], [3.12, 1.0], [3.6, 1.08], [3.6, 1.32], [2.95, 1.42], [1.5, 4.25], [2.0, 4.3], [2.0, 5.0], [1.8, TOP], [-2.65, TOP], [-3.0, TOP - .35]];
const DARK = '#2f2b3d', GLASS = '#cfeaf6', PLUSH = ['#ffb3cd', '#9fd8ff', '#ffe08a', '#b9f0a0', '#d9c2ff', '#ffc89a'];
const B = {};
let PLANK = null;
// 2층 마루: 따뜻한 꿀색 널, 이음매·나뭇결 (2 m 한 장)
const plankTex = () => PLANK || (PLANK = (() => {
  const t = canvasTex(256, 256, (c, W, H) => {
    c.fillStyle = '#e2b47c'; c.fillRect(0, 0, W, H); const r = rnd(31);
    for (let y = 0; y < H; y += 32) { c.fillStyle = shade('#e2b47c', -.06 + r() * .1); c.fillRect(0, y + 1, W, 30); c.fillStyle = '#b98a5c'; c.fillRect(0, y, W, 2); const o = Math.floor(r() * W); c.fillRect(o, y, 2, 32); c.fillRect((o + 128) % W, y, 2, 32);
      c.strokeStyle = 'rgba(140,90,50,.18)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, y + 12 + r() * 8); c.bezierCurveTo(80, y + 8, 170, y + 22, W, y + 14); c.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 2, 1 / 2); return t;
})());
const profileShape = () => { const s = new THREE.Shape(); PROFILE.forEach(([z, y], i) => i ? s.lineTo(-z, y) : s.moveTo(-z, y)); s.closePath(); return s; };
const bulb = (f, c, x, y, z, r = .035) => { const b = mesh(new THREE.SphereGeometry(r, 8, 6), mat(c, { emissive: c, ei: 1.1 }), { cast: false }); put(b, x, y, z); f.add(b); return b; };

B.ol5_shell = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.3, 0, .001, -.29, .001];
  // 섬 (둥근 섬·연석·잔디·맨홀·웅덩이·가로등)
  f.add(mc('ol5-island', ({ add }) => {
    add(ext(islandShape(), .3, 16), PAVED, 0, ISY - .3, 0, -HP, 0, 0);
    add(ext(islandShape(.22), .42, 16), EARTH, 0, ISY - .72, 0, -HP, 0, 0);
    add(ext(islandShape(.42), .14, 16), EARTHD, 0, ISY - .86, 0, -HP, 0, 0);
    const ring = islandShape(); ring.holes.push(islandShape(.16)); add(ext(ring, .07, 16), CURB, 0, ISY - .002, 0, -HP, 0, 0);
    add(G.box(NX1 - NX0 + .14, .16, 3.12 - NZ + NT, .04), BODYD, (NX0 + NX1 + .14) / 2, -.082, (NZ - NT + 3.12) / 2);
    for (const [x, z, n] of [[-4.0, -.6, 5], [-3.95, 1.4, 4], [4.6, -1.7, 5], [4.75, .2, 4], [-2.6, -3.5, 4], [2.2, -3.55, 5], [4.3, 2.9, 4]])
      for (let k = 0; k < n; k++) { const a = k * 2.3; add(G.sph(.09 + (k % 3) * .02, 8, 6), k % 2 ? LEAF : LEAF2, x + Math.cos(a) * .09, ISY + .04 + (k % 2) * .03, z + Math.sin(a) * .07, 0, 0, 0, [1.1, .8, 1]); }
    add(G.cyl(.32, .32, .02, 24), '#6d7286', 4.2, ISY + .01, 2.6); add(G.tor(.32, .025, PI * 2, 4, 24), '#5b6074', 4.2, ISY + .02, 2.6, HP, 0, 0);
    for (let k = -2; k <= 2; k++) add(G.box(.5 - Math.abs(k) * .1, .012, .03, .004), '#5b6074', 4.2, ISY + .025, 2.6 + k * .1);
    for (const [x, z, rx, rz, a] of [[4.3, .6, .5, .3, .3], [.9, 4.0, .62, .34, -.1], [3.1, 3.95, .4, .24, .2]]) {
      add(G.cyl(1, 1, .01, 28), '#4b5680', x, ISY + .008, z, 0, a, 0, [rx, 1, rz]); add(G.cyl(1, 1, .006, 28), '#6c78a6', x, ISY + .006, z, 0, a, 0, [rx + .05, 1, rz + .04]);
      for (const [dx, dz, r] of [[-.12, .02, .08], [.14, -.05, .05]]) add(G.tor(r, .006, PI * 2, 3, 18), '#a9b6e0', x + dx, ISY + .016, z + dz, HP, 0, 0);
      add(G.box(rx * .9, .004, .035, .002), '#ffb8dc', x, ISY + .016, z + rz * .2, 0, a + .05, 0);
    }
    const lx = -1.5, lz = 4.05;
    add(G.cyl(.16, .2, .14, 12), POLE, lx, ISY + .07, lz); add(G.cyl(.05, .065, 2.5, 10), POLE, lx, ISY + 1.32, lz);
    add(G.box(.06, .06, .5, .02), POLE, lx, ISY + 2.6, lz - .22); add(G.cone(.2, .16, 12), POLE, lx, ISY + 2.56, lz - .45);
    for (const s of [-1, 1]) add(G.box(.5, .7, .03, .01), '#c9a27a', 2.2, ISY + .35, 3.75 + s * .1, s * .2, 0, 0);
  }));
  bulb(f, WARM, -1.5, ISY + 2.44, 3.6, .085);
  { const g = new THREE.ShapeGeometry(islandShape(.16), 16); const m = mesh(g, mat('#ffffff', { map: tileTex(), rough: .5, rim: .1 }), { cast: false }); put(m, 0, ISY + .002, 0, -HP, 0, 0); m.userData.floor = true; f.add(m); }
  { const b = mesh(new THREE.PlaneGeometry(.42, .54), mat('#ffffff', { map: boardTex(), rough: .8, rim: .1 }), { cast: false }); put(b, 2.2, ISY + .37, 3.905, .2, 0, 0); f.add(b); }

  // ── 2층 바닥판: 두꺼운 판(밑은 오락실 천장 — 형광등 셋, 하나만 켜 둠), 앞 얼굴은 짙은 띠에 노란 줄·꼬마 전구, 위는 꿀색 마루
  f.add(mc('ol5-slab', ({ add }) => {
    add(G.box(RWID, Y2 - SLAB_B, -NZ + SZ, .03), '#e6e0ee', 0, (SLAB_B + Y2) / 2, (NZ + SZ) / 2);
    add(G.box(RWID + .04, Y2 - SLAB_B + .04, .08, .02), DARK, 0, (SLAB_B + Y2) / 2, SZ + .02); add(G.box(RWID + .06, .045, .1, .015), TRIM, 0, Y2 - .02, SZ + .03);
    for (const x of [-2.2, 0, 2.2]) { add(G.box(1.3, .05, .16, .02), '#d9d3e6', x, SLAB_B - .03, -1.6); }
    // 매달린 둥근 시계 (양면) — 2층 끝 밑, 가운데 왼쪽
    for (const x of [-1.95, -1.65]) add(G.cyl(.012, .012, .2, 6), STEEL, x, SLAB_B - .1, SZ - .1);
    add(G.cyl(.3, .3, .1, 26), CREAM, -1.8, 1.86, SZ - .1, HP, 0, 0); add(G.tor(.3, .04, PI * 2, 6, 26), CORAL, -1.8, 1.86, SZ - .1);
    for (const sz of [-1, 1]) { const z = SZ - .1 + sz * .055; add(G.box(.025, .2, .01, .005), INKY, -1.8, 1.93, z); add(G.box(.15, .025, .01, .005), INKY, -1.74, 1.86, z, 0, 0, .5);
      for (let k = 0; k < 12; k++) { const a = k * PI / 6; add(G.box(.02, .045, .01, .003), INKY, -1.8 + Math.sin(a) * .24, 1.86 + Math.cos(a) * .24, z, 0, 0, -a); } }
    // 유리 난간 기둥·윗대 (미끄럼틀 입구와 나선 계단 도착 자리는 비움)
    for (const x of [-2.45, -1.2, 0, 1.2, 2.45]) add(G.box(.05, .92, .05, .01), STEEL, x, Y2 + .46, SZ - .05);
    add(G.cyl(.025, .025, 4.9, 8), BODY, 0, Y2 + .93, SZ - .05, 0, 0, HP);
  }));
  { const top = mesh(new THREE.PlaneGeometry(RWID, -NZ + SZ), mat('#ffffff', { map: plankTex(), rough: .7, rim: .1 }), { cast: false }); put(top, 0, Y2 + .002, (NZ + SZ) / 2, -HP, 0, 0); top.userData.floor = true; f.add(top); }
  { const g = mesh(new THREE.PlaneGeometry(4.9, .86), mat(GLASS, { opacity: .3, rough: .2 }), { cast: false }); put(g, 0, Y2 + .47, SZ - .05); f.add(g); }
  { const b = mesh(new THREE.BoxGeometry(1.2, .04, .12), mat('#f4f8ff', { emissive: '#f4f8ff', ei: 1.0 }), { cast: false }); put(b, 0, SLAB_B - .06, -1.6); f.add(b); }
  for (let k = 0; k < 16; k++) bulb(f, k % 2 ? '#fff1b8' : '#ffb8dc', -3.3 + k * 6.6 / 15, (SLAB_B + Y2) / 2, SZ + .07, .03);

  // ── 뒷벽: 1층 오락실 벽 · 2층 너굴이 방(비 오는 창·꼬마전구), 지붕 반쯤 + 거대 조이스틱 간판 ─────────────────────────────
  const N = foldWall(f, [0, 0, 1], TOP); N.th = -.18;
  {
    const WIN = [-.15, 3.95, 1.45, 4.8];
    const body = new THREE.Shape(); rrect(body, NX0, 0, NX1, TOP, [0, 0, .35, .35]); body.holes.push(rrect(new THREE.Path(), ...WIN, .08));
    N.g.add(mc('ol5-back', ({ add }) => {
      add(ext(body, NT, 8), BODY, 0, 0, NZ - NT);
      add(G.box(NX1 - NX0, .14, .06, .02), TRIM, (NX0 + NX1) / 2, TOP - .07, NZ + .02);
      add(G.box(NX1 - NX0 - .3, .12, .05, .02), '#2a2d55', (NX0 + NX1) / 2, .06, NZ + .025);
      add(G.box(RWID, .1, .05, .02), '#b98a5c', 0, Y2 + .05, NZ + .025);
    }));
    const low = mesh(new THREE.PlaneGeometry(NX1 - .02 - WX, SLAB_B), mat('#ffffff', { map: arcadeTex(), rough: .9, rim: .1 }), { cast: false }); put(low, (WX + NX1) / 2, SLAB_B / 2, NZ + .003); N.g.add(low);
    const up = new THREE.Shape(); rrect(up, WX, Y2, NX1 - .02, TOP - .14, 0); up.holes.push(rrect(new THREE.Path(), ...WIN, .08));
    const um = mesh(new THREE.ShapeGeometry(up, 6), mat('#ffffff', { map: warmPaper(), rough: .9, rim: .1 }), { cast: false }); put(um, 0, 0, NZ + .003); N.g.add(um);
    N.knee.add(mc('ol5-back-knee', ({ add }) => { add(G.box(NX1 - NX0, .42, NT, .05), BODY, (NX0 + NX1) / 2, .21, NZ - NT / 2); add(G.box(NX1 - NX0, .05, NT + .04, .02), TRIM, (NX0 + NX1) / 2, .42, NZ - NT / 2); }));
    { const gl = new THREE.Mesh(new THREE.ShapeGeometry(rrect(new THREE.Shape(), ...WIN, .08), 6), basic(rainTex(), '#d8def5')); gl.position.z = NZ - NT * .55; N.deco.add(gl); }
    N.deco.add(mc('ol5-window', ({ add }) => {
      const [x0, y0, x1, y1] = WIN, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      for (const y of [y0, y1]) add(G.box(x1 - x0 + .16, .08, .1, .02), '#b98a5c', cx, y, NZ + .02); for (const x of [x0, x1]) add(G.box(.08, y1 - y0 + .08, .1, .02), '#b98a5c', x, cy, NZ + .02);
      add(G.box(.05, y1 - y0, .05, .01), '#b98a5c', cx, cy, NZ - .1); add(G.box(x1 - x0 + .3, .06, .2, .02), '#b98a5c', cx, y0 - .06, NZ + .08);
      // 2층 벽: 작은 액자 셋, 게임 포스터
      for (const [x, y, c] of [[-.9, 4.2, '#ffb3cd'], [-.55, 4.45, '#9fd8ff'], [-.55, 4.0, '#ffe08a']]) { add(G.box(.26, .22, .03, .01), '#ffffff', x, y, NZ + .02); add(G.box(.2, .16, .01, .005), c, x, y, NZ + .04); }
      add(G.box(.5, .7, .02, .01), '#ffffff', 2.4, 3.9, NZ + .015); add(G.box(.44, .64, .01, .005), '#3a4a8a', 2.4, 3.9, NZ + .03); add(G.sph(.12, 10, 8), '#e8414e', 2.4, 4.0, NZ + .04, 0, 0, 0, [1, 1, .2]);
    }));
    { const pts = []; for (let k = 0; k <= 18; k++) { const t = k / 18; pts.push([-3.3 + t * 6.6, 4.95 - Math.sin(t * PI * 4) ** 2 * .12]); }
      N.deco.add(mc('ol5-fairy', ({ tube }) => { for (let k = 0; k < pts.length - 1; k++) tube([pts[k][0], pts[k][1], NZ + .06], [pts[k + 1][0], pts[k + 1][1], NZ + .06], .008, '#5a5470', 4); }));
      const cols = ['#ffd98a', '#ff9fb8', '#9fd8ff', '#b9f0a0']; for (let k = 0; k < 17; k++) { const t = (k + .5) / 17; N.deco.add(bulb({ add: o => o }, cols[k % 4], -3.3 + t * 6.6, 4.9 - Math.sin(t * PI * 4) ** 2 * .12, NZ + .07)); } }
    N.deco.add(mc('ol5-roof', ({ add }) => {
      add(G.box(NX1 - NX0 + .2, .22, 1.95, .06), ROOF, (NX0 + NX1) / 2, TOP + .11, NZ - NT + .95);
      add(G.box(NX1 - NX0 + .24, .08, .1, .02), TRIM, (NX0 + NX1) / 2, TOP + .2, NZ - NT + 1.92);
      const jx = 1.7, jz = -2.25, jy = TOP + .22;
      add(G.box(1.3, .3, 1.1, .1), DARK, jx, jy + .15, jz); add(G.cyl(.32, .4, .2, 18), '#3e3b55', jx, jy + .4, jz);
      add(G.cyl(.09, .09, 1.25, 12), STEEL, jx + .12, jy + 1.0, jz + .08, .14, 0, -.18);
      add(G.sph(.55, 22, 16), '#e8414e', jx + .25, jy + 1.75, jz + .17); add(G.sph(.16, 12, 8), '#ff9a8f', jx + .08, jy + 1.95, jz + .4);
      for (const [x, z, c] of [[-.4, -2.3, '#f2c14e'], [-1.3, -2.1, '#5fb8e8']]) { add(G.cyl(.34, .38, .12, 20), DARK, x, jy + .06, z); add(G.cyl(.3, .3, .14, 20), c, x, jy + .18, z); }
    }));
    tagWall(N.g, 'N'); tagWall(N.deco, 'N'); tagWall(N.knee, 'N');
  }

  // ── 옆벽: 캐비닛 옆모습 (1층은 옆면 벽화, 2층은 크림 벽지·둥근 창), 앞에 튀어나온 조작판 ─────────────────────────────
  const W = foldWall(f, [1, 0, 0], TOP); W.th = -.18;
  {
    const PORT = [1.5, 3.75, .3];
    const wall = grp(); wall.rotation.y = HP; wall.position.x = WX - WT; W.g.add(wall);
    const prof = profileShape(); prof.holes.push(circle(new THREE.Path(), ...PORT));
    wall.add(mc('ol5-side', ({ add }) => { add(ext(prof, WT, 6), BODY, 0, 0, 0); }));
    const inner = profileShape(); inner.holes.push(circle(new THREE.Path(), ...PORT));
    const im = mesh(new THREE.ShapeGeometry(inner, 6), mat('#ffffff', { map: muralTex(), rough: .9, rim: .1 }), { cast: false });
    { const uv = im.geometry.attributes.uv, pos = im.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 3.6) / 6.6, pos.getY(i) / TOP); uv.needsUpdate = true; }
    put(im, 0, 0, WT + .003); wall.add(im);
    const room2 = new THREE.Shape(); rrect(room2, .05, Y2, 3.0, TOP - .2, [0, 0, .25, 0]); room2.holes.push(circle(new THREE.Path(), ...PORT));
    const rm = mesh(new THREE.ShapeGeometry(room2, 8), mat('#ffffff', { map: warmPaper(), rough: .9, rim: .1 }), { cast: false }); put(rm, 0, 0, WT + .006); wall.add(rm);
    W.knee.add(mc('ol5-side-knee', ({ add }) => { add(G.box(WT, .42, 6.12, .05), BODY, WX - WT / 2, .21, .06); add(G.box(WT + .04, .05, 6.12, .02), TRIM, WX - WT / 2, .42, .06); }));
    W.deco.add(mc('ol5-side-trim', ({ add }) => {
      for (let k = 1; k < PROFILE.length; k++) seg(add, WX - WT / 2, WT + .06, PROFILE[k - 1], PROFILE[k], .09, TRIM);
      add(G.tor(.3, .05, PI * 2, 8, 24), '#b98a5c', WX + .03, PORT[1], -PORT[0], 0, HP, 0);
      add(G.box(1.24, .3, .48, .05), BODY, WX - .34 + .62, 1.18, 3.36); add(G.box(1.28, .05, .52, .02), TRIM, WX - .34 + .62, 1.33, 3.36);
      for (const [dx, c] of [[.2, '#e8414e'], [.42, '#f2c14e'], [.64, '#5fb8e8'], [.86, '#7fd6a0']]) add(G.cyl(.08, .08, .07, 16), c, WX - .34 + dx, 1.38, 3.4);
      add(G.cyl(.02, .02, .2, 8), INKY, WX - .34 + 1.08, 1.45, 3.36); add(G.sph(.065, 10, 8), '#e8414e', WX - .34 + 1.08, 1.56, 3.36);
      add(G.box(.06, .1, 3.0, .02), '#b98a5c', WX + .03, Y2 + .05, -1.5);
    }));
    { const gl = mesh(new THREE.CircleGeometry(.3, 20), basic(rainTex(), '#d8def5'), { cast: false }); gl.rotation.y = HP; gl.position.set(WX - WT * .5, PORT[1], -PORT[0]); W.deco.add(gl); }
    tagWall(W.g, 'W'); tagWall(W.deco, 'W'); tagWall(W.knee, 'W');
  }
  // ── 오른쪽: 옆모습 테두리 띠 (오른쪽에서 볼 때만 숨김) ───────────────────────────────────────────────────────
  const E = foldWall(f, [-1, 0, 0], TOP); E.th = -.75; E.stub = .02;
  E.g.add(mc('ol5-eframe', ({ add }) => {
    for (let k = 2; k < PROFILE.length; k++) seg(add, EX + .1, .2, PROFILE[k - 1], PROFILE[k], .16, BODY);
    seg(add, EX + .1, .2, PROFILE[PROFILE.length - 1], [-3.0, 0], .16, BODY);
    for (let k = 2; k < PROFILE.length; k++) seg(add, EX + .1, .24, PROFILE[k - 1], PROFILE[k], .05, TRIM);
    add(G.box(.34, .3, .48, .05), BODY, EX + .1, 1.18, 3.36); add(G.cyl(.08, .08, .07, 16), '#e8414e', EX + .1, 1.36, 3.4);
    add(G.box(.2, Y2 - SLAB_B, 3.0, .02), BODY, EX + .1, (SLAB_B + Y2) / 2, -1.5);
  }));
  tagWall(E.g, 'E');

  // ── 간판(마키) 띠 + 거기 매단 '오늘 영업 끝' 판 ─────────────────────────────────────────────────────────────
  const MZ = 1.75;
  f.add(mc('ol5-marquee', ({ add }) => {
    add(G.box(NX1 - NX0 + .2, .74, .5, .06), BODY, (NX0 + NX1) / 2 + .1, 4.68, MZ);
    add(G.box(NX1 - NX0 + .24, .07, .54, .02), TRIM, (NX0 + NX1) / 2 + .1, 5.06, MZ); add(G.box(NX1 - NX0 + .24, .07, .54, .02), TRIM, (NX0 + NX1) / 2 + .1, 4.3, MZ);
    for (const x of [-.45, .45]) add(G.cyl(.006, .006, .4, 4), '#5a5470', x, 4.07, MZ + .1);
  }));
  { const s = mesh(new THREE.PlaneGeometry(NX1 - NX0 - .4, .54), basic(signTex(), '#f2eaf6'), { cast: false }); put(s, (NX0 + NX1) / 2 + .1, 4.68, MZ + .255); f.add(s); }
  { const s = mesh(new THREE.PlaneGeometry(1.0, .38), mat('#ffffff', { map: closedTex(), rough: .8, rim: .1 }), { cast: false }); put(s, 0, 3.7, MZ + .1); f.add(s); }
  for (let k = 0; k < 24; k++) bulb(f, k % 2 ? '#fff1b8' : '#ffb8dc', NX0 + .3 + k * (NX1 - NX0 - .6) / 23, 5.08, MZ + .28, .04);

  // ── 뒤 멀리 이어지는 동네 (19판 소방서·하얀 집, 카메라 반대쪽일 때만) ─────────────────────────────────────────────
  const town = [];
  const isle = (x, z, r, build) => { const g = grp(); g.position.set(x, -1.4, z); g.scale.setScalar(.6); f.add(g); g.add(mc('ol4-town-isle|' + r, ({ add }) => { add(G.cyl(r, r * .9, .3, 24), '#ece8f2', 0, -.15, 0); add(G.cyl(r * .9, r * .6, .35, 24), '#bdb6cf', 0, -.47, 0); })); build(g); town.push(g); };
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

// ── 철제 나선 계단 (1×1, 1층 바닥 → 2층 바닥 앞 끝): 가운데 기둥, 앞(+z)에서 올라 한 바퀴 반 돌아 뒤(-z)로 2층에 내림 — 짙은 철 디딤판에
// 노란 끝선, 빨강 손잡이 나선, 기둥 꼭대기 노란 공
B.ol5_spiral = (f, T, o = {}) => {
  const Y = o.y || Y2, N = 16, R = .56, D = 3 * PI / (N - 1);
  f.add(mc('ol5-spiral|' + Y, ({ add, tube }) => {
    add(G.cyl(.32, .36, .04, 20), DARK, 0, .02, 0);
    add(G.cyl(.05, .05, Y + .95, 10), STEEL, 0, (Y + .95) / 2, 0); add(G.sph(.08, 12, 8), TRIM, 0, Y + .98, 0);
    const rail = [];
    for (let k = 0; k < N; k++) {
      const a = k * D, y = (k + 1) * Y / N, sx = Math.sin(a), cz = Math.cos(a);
      add(G.box(.3, .045, .5, .012), '#3e3b55', sx * .3, y, cz * .3, 0, a, 0);
      add(G.box(.3, .02, .05, .006), TRIM, sx * .54, y + .03, cz * .54, 0, a, 0);
      if (k % 2 === 0) add(G.cyl(.012, .012, .82, 5), STEEL, sx * R, y + .41, cz * R);
      rail.push([sx * R, y + .84, cz * R]);
    }
    for (let k = 0; k < rail.length - 1; k++) tube(rail[k], rail[k + 1], .025, BODY, 6);
  }));
  f.spot('under', null, -.22, 0, .18, { maxH: .4, label: '나선 계단 밑', scale: .7 });
  { const k = 7, a = k * D; f.spot('on', null, Math.sin(a) * .36, (k + 1) * Y / N + .03, Math.cos(a) * .36, { maxH: .22, label: '나선 계단 가운데 칸', scale: .6 }); }
  f.collideBox = [-.6, 0, -.6, .6, Y + 1, .6];
};

// ── 노란 미끄럼틀 (1×3, 뒤 끝이 2층 바닥 앞 끝): 2층에서 미끄러져 1층 앞 매트까지 — 내려오는 길. 위에 잡는 손잡이, 밑에 받침 기둥 둘
B.ol5_slide = (f, T, o = {}) => {
  const Y = o.y || Y2;
  const curve = new THREE.CatmullRomCurve3([[0, Y + .04, -1.78], [0, Y - .06, -1.4], [0, Y * .55, -.25], [0, .5, .75], [0, .3, 1.15]].map(p => new THREE.Vector3(...p)));
  f.add(mc('ol5-slide|' + Y, ({ add }) => {
    const n = 16, pts = curve.getSpacedPoints(n);
    for (let k = 0; k < n; k++) {
      const a = pts[k], b = pts[k + 1], dy = b.y - a.y, dz = b.z - a.z, L = Math.hypot(dy, dz) + .02, rx = -Math.atan2(dy, dz), y = (a.y + b.y) / 2, z = (a.z + b.z) / 2;
      add(G.box(.5, .045, L, .008), '#f5c84c', 0, y, z, rx, 0, 0);
      for (const sx of [-1, 1]) add(G.box(.05, .17, L, .01), '#e8a93a', sx * .25, y + .07, z, rx, 0, 0);
    }
    add(G.box(.6, .05, .4, .02), '#e8a93a', 0, Y + .02, -1.7);
    for (const sx of [-1, 1]) add(G.cyl(.02, .02, .55, 6), BODY, sx * .27, Y + .3, -1.62);
    add(G.cyl(.022, .022, .56, 8), BODY, 0, Y + .58, -1.62, 0, 0, HP);
    for (const [z, h] of [[-.2, 1.3], [.75, .5]]) for (const sx of [-1, 1]) add(G.cyl(.03, .03, h, 8), STEEL, sx * .2, h / 2, z);
    add(G.box(.7, .09, .5, .04), '#9fb8e8', 0, .045, 1.32); add(G.box(.62, .02, .42, .01), '#c9d8f5', 0, .095, 1.32);
  }));
  f.spot('under', null, .05, 0, -.55, { maxH: .7, label: '미끄럼틀 밑', scale: .8 });
  f.spot('on', null, .1, .1, 1.32, { maxH: .22, label: '미끄럼틀 끝 매트', scale: .7 });
  f.collideBox = [-.5, 0, -1.5, .5, Y + .7, 1.5];
};

// ── 경품 진열장 (2×1, 2층 밑): 유리 앞 세 칸에 동그란 인형들, 위에 '경품' 띠
B.ol5_prizewall = (f, T) => {
  const z0 = -.24, W = 1.86, H = 1.72, D = .44;
  f.add(mc('ol5-prizewall', ({ add }) => {
    add(G.box(W, .12, D, .02), DARK, 0, .06, z0); add(G.box(W, .06, D, .02), CREAM, 0, H - .03, z0);
    for (const sx of [-1, 1]) add(G.box(.06, H, D, .02), CREAM, sx * (W / 2 - .03), H / 2, z0); add(G.box(W, H, .03, .01), '#f6e9ee', 0, H / 2, z0 - D / 2 + .015);
    for (const y of [.62, 1.12]) add(G.box(W - .1, .03, D - .04, .008), CREAM, 0, y, z0);
    const r = rnd(41);
    for (const y of [.12, .65, 1.15]) for (let k = 0; k < 7; k++) {
      const x = -.78 + k * .26 + (r() - .5) * .04, c = PLUSH[(k + Math.round(y * 3)) % 6], s = .1 + r() * .03, zz = z0 + (k % 2 ? .02 : -.06);
      add(G.sph(s, 10, 8), c, x, y + s, zz); add(G.sph(s * .78, 10, 8), c, x, y + s * 2.4, zz);
      for (const ex of [-1, 1]) add(G.sph(s * .3, 6, 4), shade(c, -.08), x + ex * s * .5, y + s * 3.05, zz);
      for (const ex of [-1, 1]) add(G.sph(.012, 4, 3), INKY, x + ex * s * .3, y + s * 2.5, zz + s * .75);
    }
    add(G.box(.8, .2, .05, .03), CORAL, 0, H + .12, z0 + D / 2 - .05);
  }));
  { const s = mesh(new THREE.PlaneGeometry(.6, .14), basic(canvasTex(128, 32, (c, W2, H2) => { c.fillStyle = CORAL; c.fillRect(0, 0, W2, H2); c.fillStyle = '#ffffff'; c.font = 'bold 24px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★ 경품 ★', W2 / 2, H2 / 2 + 1); }), '#f2eaf6'), { cast: false }); put(s, 0, H + .12, z0 + D / 2 - .02); f.add(s); }
  { const g = mesh(new THREE.PlaneGeometry(W - .12, H - .2), mat(GLASS, { opacity: .25, rough: .2 }), { cast: false }); put(g, 0, H / 2 + .04, z0 + D / 2 + .005); f.add(g); }
  f.spot('inside', null, -.4, .65, z0 + .1, { maxH: .25, label: '경품 진열장 가운데 칸', scale: .6 });
  f.spot('inside', null, .5, .12, z0 + .1, { maxH: .25, label: '경품 진열장 아래 칸', scale: .6 });
  f.spot('behind', null, W / 2 + .12, 0, z0, { maxH: .5, label: '경품 진열장 옆 틈', scale: .7 });
};

// ── 2층 긴 서랍장 (drawerstairs 자리 그대로 — 자물쇠 code 부품 이름 유지, 계단 아님; 1×2를 눕혀 2 m): 파스텔 서랍 넷과
// 오른쪽 끝 숨은 칸(비밀번호 자물쇠), 서랍 넷을 다 열면 숨은 칸이 저절로 열림(잠겼으면 안 열림); 위엔 어항·스탠드·액자
B.ol5_chest = (f, T, o = {}) => {
  const g = grp(); g.rotation.y = -HP; f.add(g);   // (자연 좌표: 앞 +z, 길이 x — 방에선 rot 1로 놓여 앞이 방 쪽)
  const L = 1.9, H = .78, D = .45, z0 = -.27, DW = .64, DH = .3;
  g.add(mc('ol5-chest', ({ add }) => {
    add(G.box(L, H, D, .03), '#f1e6d6', 0, H / 2 + .06, z0); add(G.box(L + .04, .04, D + .04, .015), '#d9a46a', 0, H + .08, z0);
    for (const sx of [-1, 1]) add(G.box(.06, .06, .06, .02), '#9c6a42', sx * (L / 2 - .08), .03, z0);
    // 위: 작은 어항(물·물고기), 버섯 스탠드, 액자
    add(G.box(.36, .24, .2, .02), '#cfeaf6', -.6, H + .22, z0); add(G.box(.34, .16, .18, .01), '#7fc6e8', -.6, H + .18, z0); add(G.sph(.03, 8, 6), '#ff8f3a', -.62, H + .2, z0 + .05, 0, 0, 0, [1.4, 1, .6]);
    add(G.cyl(.04, .06, .2, 10), '#f2f2f2', .1, H + .2, z0); add(G.sph(.13, 14, 8), '#ff9fb8', .1, H + .34, z0, 0, 0, 0, [1, .7, 1]);
    add(G.box(.22, .28, .03, .01), '#ffffff', .45, H + .24, z0 - .08, -.15, 0, 0); add(G.box(.17, .22, .01, .005), '#ffd98a', .45, H + .24, z0 - .065, -.15, 0, 0);
    add(G.box(.52, H - .16, .02, .01), shade('#f1e6d6', -.06), L / 2 - .33, H / 2 + .06, z0 + D / 2 + .005);
  }));
  const drawers = [], cols = ['#ffc23d', '#7fd6c0', '#ff9fb8', '#8fd3f4'];
  for (let i = 0; i < 4; i++) {
    const x = -L / 2 + .06 + DW / 2 + (i % 2) * (DW + .03), y = .1 + DH / 2 + Math.floor(i / 2) * (DH + .04);
    const dv = grp(); put(dv, x, y, z0 + D / 2 + .005); g.add(dv);
    dv.add(mc('ol5-chest-drawer|' + i, ({ add }) => { add(G.box(DW, DH, .03, .015), shade(cols[i], .15), 0, 0, .015); add(G.cyl(.03, .03, .03, 12), cols[i], 0, 0, .04, HP, 0, 0); add(G.box(DW - .06, .02, D - .1, .005), '#e8d8c0', 0, -DH / 2 + .04, -(D - .1) / 2); }));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .3 * t; }, { label: `서랍장 ${i + 1}번 서랍`, sfx: 'drawer', dur: .24 });
    f.spot('inside', dv, 0, -DH / 2 + .05, -(D - .1) / 2, { part: p, maxH: .2, label: `서랍장 ${i + 1}번 서랍 속`, scale: .7 });
    drawers.push(p);
  }
  const sv = grp(); put(sv, L / 2 - .06, .1, z0 + D / 2 + .012); g.add(sv);
  sv.add(mc('ol5-chest-door', ({ add }) => { add(G.box(.5, .64, .03, .015), '#e8705f', -.25, .32, 0); add(G.box(.04, .12, .03, .01), '#ffe14d', -.44, .34, .02); }));
  const ps = f.part('door', sv, t => { sv.rotation.y = 1.4 * t; }, { label: '서랍장 끝 숨은 칸', sfx: 'creak', dur: .4 });
  ps.lockable = true; ps.lockKind = 'code'; ps.lockAt = { x: -.4, y: .34, z: .04, parent: sv };
  f.spot('inside', g, L / 2 - .3, .12, z0, { part: ps, maxH: .4, label: '서랍장 끝 숨은 칸', scale: .8 });
  const check = S => { if (ps.t > .5 || ps.lock || drawers.some(d => d.t < .5)) return; S.G.audio.sfx('special'); setTimeout(() => !S.dead && S.togglePart(ps, true), 400); };
  drawers.forEach(d => { d.afterOpen = check; });
  f.secretPart = ps;
  f.spot('behind', g, -L / 2 - .12, 0, z0, { maxH: .35, label: '서랍장 옆 틈', scale: .7 });
};

// ── 집게 크레인 바구니 (loftpulley 자리 그대로 — 단서 걸이 부품 이름 유지): 인형 뽑기 집게를 크게 — 빨강 기둥·팔, 노란 집게 머리, 분홍 바구니가
// 1층 바닥에서 2층 난간 높이까지 오르내림; 기둥 손잡이를 터치하면 저절로 감김; 집게 밑 고리에 걸린 건 바구니가 올라오면 떨어져 들어감
B.ol5_crane = (f, T, o = {}) => {
  const Y = o.y || Y2, TOPC = Y + 1.0, bx = 0, bz = .1, yB = .02, yT = Y + .06;
  f.add(mc('ol5-crane|' + Y, ({ add, tube }) => {
    add(G.box(.1, TOPC, .1, .02), BODY, .38, TOPC / 2, -.42);
    for (let k = 0; k < 6; k++) add(G.box(.11, .08, .11, .01), TRIM, .38, .5 + k * .55, -.42);
    add(G.box(.5, .08, .08, .02), BODY, .16, TOPC - .05, -.42); add(G.box(.08, .08, .6, .02), BODY, bx, TOPC - .05, -.15);
    add(G.cyl(.09, .07, .1, 14), TRIM, bx, TOPC - .14, bz); add(G.sph(.05, 10, 8), BODY, bx, TOPC - .2, bz);
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; tube([bx, TOPC - .2, bz], [bx + Math.cos(a) * .1, TOPC - .32, bz + Math.sin(a) * .1], .012, STEEL, 4); }
    add(G.cyl(.07, .07, .05, 14), STEEL, .38, 1.0, -.36, HP, 0, 0);
    tube([.17, TOPC - .1, bz], [.17, TOPC - .22, bz], .006, '#a87a34', 5); add(G.tor(.03, .009, PI * 1.45, 6, 14), '#e0b04a', .165, TOPC - .25, bz, 0, 0, PI);
  }));
  const crank = grp(); put(crank, .38, 1.0, -.33); f.add(crank);
  crank.add(mc('ol5-crane-crank', ({ add }) => { add(G.box(.15, .03, .03, .008), STEEL, .06, 0, .02); add(G.sph(.04, 10, 8), '#e8414e', .14, 0, .05); }));
  const bk = grp(); put(bk, bx, yB, bz); f.add(bk);
  bk.add(mc('ol5-crane-basket', ({ add }) => {
    add(G.cyl(.21, .17, .26, 18), '#ff9fc8', 0, .13, 0); add(G.tor(.21, .02, PI * 2, 6, 20), '#e8709f', 0, .26, 0, HP, 0, 0);
    for (const sx of [-1, 1]) add(G.tor(.07, .012, PI, 4, 10), '#e8709f', sx * .16, .3, 0);
    add(G.cyl(.18, .18, .03, 16), '#f2dc9a', 0, .2, 0);
  }));
  const rope = mesh(new THREE.CylinderGeometry(.006, .006, 1, 5), mat('#e8d6a8')); f.add(rope);
  const setRope = () => { const y0 = TOPC - .22, y1 = bk.position.y + .3, L = Math.max(.02, y0 - y1); rope.scale.y = L; rope.position.set(bx, y1 + L / 2, bz); };
  setRope();
  const p = f.part('slide', [bk, crank], (t, b) => { bk.position.y = b.p.y + (yT - yB) * t; bk.rotation.z = Math.sin(t * PI * 3) * .04 * (1 - t); crank.rotation.z = -t * PI * 6; setRope(); }, { label: '크레인 바구니', sfx: 'swish', dur: 1.2 });
  p.handle = crank;
  f.spot('inside', bk, 0, .23, 0, { part: p, maxH: .26, label: '크레인 바구니 안', scale: .85 });
  f.spot('on', null, .17, TOPC - .56, bz, { maxH: .24, label: '크레인 집게 밑 고리', scale: .8, wallFace: true }).hang = p;
  f.spot('behind', null, .3, 0, -.25, { maxH: .3, label: '크레인 기둥 옆', scale: .7 });
};

export const OL5_BUILDERS = B;
export const OL5_INFO = {
  ol5_shell: { w: 1, d: 1, name: '너굴이네 오락실 2층집', hidden: true, price: 0 },
  ol5_spiral: { w: 1, d: 1, name: '철제 나선 계단', hidden: true, price: 0 },
  ol5_slide: { w: 1, d: 3, name: '노란 미끄럼틀', hidden: true, price: 0 },
  ol5_prizewall: { w: 2, d: 1, name: '경품 진열장', hidden: true, price: 0 },
  ol5_chest: { w: 1, d: 2, name: '긴 서랍장', hidden: true, price: 0 },
  ol5_crane: { w: 1, d: 1, name: '집게 크레인 바구니', hidden: true, price: 0 },
};

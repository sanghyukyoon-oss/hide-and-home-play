// 3판 C안 「개굴이네 연잎 연못 집 — 여우비 오는 날」 (frogpond, 10/24 — 스토리 룸 _handoff/stage3-planB-1023.md 맨 위):
// 맑은 연못 가운데 둥근 섬, 나무 기둥 위 작은 개굴이 집(연잎 지붕·동그란 창·우산꽂이, 지붕엔 빗물 고인 뒤집힌 우산), 큰 연잎·연꽃 징검다리,
// 물가 작은 나무 물레방아(손잡이 터치 → 양동이가 감겨 올라옴 = 3판 릴과 같은 부품·코드). 해 뜬 채 가늘고 밝은 비, 하늘 한쪽에 옅은 무지개.
// 숨김 자리 수는 3판과 같은 열다섯 조각: 벤치 → 집(현관 벤치·신문지·집 밑), 좌대 → 물레방아, 연못 → 연잎 징검다리, 파라솔 → 노란 비 우산 의자,
// 간판 → 개굴이 간판; 나머지는 A 모델. 섬 바닥·물가·연못물은 B와 같은 방식(gfx/s3b-props.js groundMesh·beachGeo, s3-kit lakeWater).
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { blobOutline, scaleOutline } from './pc-kit.js';
import { groundMesh, beachGeo } from './s3b-props.js';
import { G, mc, mt, TX, PI, HP, mix, texMat, paintTex, stone, lily, lotus, cattails, daisy, tuft, butterfly, dragonfly, scenery, lakeWater, rainFall } from './s3-kit.js';

const B = {};
const WOOD = '#e6b47a', WOODD = '#b98552', WOODL = '#f2cf9c';
const PAD = '#5cb25e', PAD2 = '#7cc86c';
// (다듬기 10/24, 허브 "섬이 폰 세로 가운데를 더 채우게"): 섬과 그 위 자리를 화면 위아래 방향(x+z 대각선)으로 1.36배, 옆으로 .95배 —
// 폰 세로 화면에서 섬이 길쭉하게 가운데를 채움. 판 자리(stage3-maps.js)도 같은 변환을 거침
const SQ = Math.SQRT1_2;
export const stretchC = ([x, z]) => { const u = (x + z) * SQ * 1.36, v = (x - z) * SQ * .95; return [(u + v) * SQ, (u - v) * SQ]; };
export const ISLAND_C = blobOutline(3.3, 2.9, { pad: .5, round: 2.5, amp: .17, seed: 11, n: 140, bulge: [[.05, .3, .45]] }).map(stretchC);
const inIsland = (x, z, grow = 0) => { let c = false; const P = ISLAND_C; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j], gi = 1 + grow / Math.hypot(xi, zi), gj = 1 + grow / Math.hypot(xj, zj); if ((zi * gi > z) !== (zj * gj > z) && x < (xj * gj - xi * gi) * (z - zi * gi) / (zj * gj - zi * gi) + xi * gi) c = !c; } return c; };
const W = -.075;   // the pond's surface (the island top is 0)

// a big lily leaf: a shallow dish with its notch, a paler heart, curved veins running out to a light rim, raindrops that catch the
// light (a small white glint on each) — pad: flat on the water; leaf: a roof or a parasol (dome)
function bigLeaf(add, x, y, z, r, rot = 0, { dome = 0, c1 = PAD, c2 = PAD2, drops = 4, tube = null } = {}) {
  const lift = d => dome * (1 - d * d);
  const s = new THREE.Shape(); s.absarc(0, 0, r, .22, PI * 2 - .02, false); s.lineTo(0, 0);
  const g = G.ext(s, .03, .012, 32); g.rotateX(-HP); g.rotateY(rot);
  if (dome) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const d = Math.hypot(p.getX(i), p.getZ(i)) / r; p.setY(i, p.getY(i) + lift(d)); } g.computeVertexNormals(); }
  add(g, c1, x, y, z);
  const s2 = new THREE.Shape(); s2.absarc(0, 0, r * .62, .35, PI * 2 - .12, false); s2.lineTo(0, 0);
  const g2 = G.ext(s2, .006, 0, 24); g2.rotateX(-HP); g2.rotateY(rot);
  if (dome) { const p = g2.attributes.position; for (let i = 0; i < p.count; i++) { const d = Math.hypot(p.getX(i), p.getZ(i)) / r; p.setY(i, p.getY(i) + lift(d)); } }
  add(g2, c2, x, y + .028, z);
  // the rim: a thin paler lip round the leaf (not across the notch)
  const rim = new THREE.TorusGeometry(r * .985, .009 + r * .006, 4, 40, PI * 2 - .26); rim.rotateX(HP); rim.rotateY(rot);
  if (!dome) add(rim, mix(c1, '#e8ffd0', .35), x, y + .03, z);
  const vc = mix(c2, '#ffffff', .35);
  for (let k = 0; k < 9; k++) {
    const a = rot + .45 + k * (PI * 2 - .7) / 8, bend = .18 * (k % 2 ? 1 : -1);
    if (tube) { const pts = [.12, .45, .78, .95].map(t => { const aa = a + bend * t * t, d = t; return [x + Math.cos(aa) * r * d, y + .036 + lift(d) + (dome ? .006 : 0), z - Math.sin(aa) * r * d]; });
      for (let q = 0; q < 3; q++) tube(pts[q], pts[q + 1], .0055 - q * .001, vc, 4); }
    else add(G.box(r * .9, .006, .012, 0), vc, x + Math.cos(a) * r * .5, y + .036 + (dome ? dome * .7 : 0), z - Math.sin(a) * r * .5, 0, a, (dome ? -dome * 1.1 : 0));
  }
  for (let k = 0; k < drops; k++) { const a = rot + 1 + k * 1.7, d = .3 + (k % 3) * .18, px = x + Math.cos(a) * r * d, pz = z - Math.sin(a) * r * d, py = y + .045 + lift(d);
    add(G.sph(.024, 10, 8), '#dff6ff', px, py, pz, 0, 0, 0, [1, .65, 1]); add(G.sph(.008, 6, 4), '#ffffff', px - .008, py + .012, pz - .006); }
}
// a water lily in three rings: pink outer petals, paler middle, near-white heart petals and a crown of yellow stamens
function lotus2(add, x, z, s = 1, y = W + .03, outer = '#ffadc6', mid = '#ffd0de', inner = '#fff0f4') {
  for (let k = 0; k < 9; k++) { const a = k * PI * 2 / 9; add(G.sph(.055 * s, 12, 8), outer, x + Math.cos(a) * .06 * s, y + .018 * s, z + Math.sin(a) * .06 * s, 0, -a, .45, [1.55, .45, .66]); }
  for (let k = 0; k < 7; k++) { const a = k * PI * 2 / 7 + .3; add(G.sph(.045 * s, 12, 8), mid, x + Math.cos(a) * .038 * s, y + .045 * s, z + Math.sin(a) * .038 * s, 0, -a, .95, [1.45, .45, .7]); }
  for (let k = 0; k < 5; k++) { const a = k * PI * 2 / 5 + .6; add(G.sph(.032 * s, 10, 6), inner, x + Math.cos(a) * .018 * s, y + .07 * s, z + Math.sin(a) * .018 * s, 0, -a, 1.3, [1.3, .45, .7]); }
  for (let k = 0; k < 8; k++) { const a = k * PI / 4; add(G.sph(.007 * s, 6, 4), '#ffc93a', x + Math.cos(a) * .018 * s, y + .095 * s, z + Math.sin(a) * .018 * s); }
  add(G.sph(.016 * s, 8, 6), '#ffe27a', x, y + .088 * s, z);
}

// the shore's soft bands (no outline, see-through): wet sand darkening toward the water and a lace of white foam at the waterline
// (radial from the island's middle, like the beach: d = how far out from the grass edge)
const beachY = d => -.085 * (.35 * (d / .5) ** 2 + .65 * (d / .5));
function shoreBand(pts, rows, wob = 0, lace = 0) {
  const n = pts.length, pos = [], col = [], idx = [];
  rows.forEach(([d, c, a, y]) => { const cc = new THREE.Color(c); for (let i = 0; i < n; i++) { const [x, z] = pts[i], L = Math.hypot(x, z) || 1, dd = d + wob * Math.sin(i * .9) * Math.sin(i * .37); pos.push(x + x / L * dd, y ?? Math.max(beachY(dd), W) + .004, z + z / L * dd); col.push(cc.r, cc.g, cc.b, a * (1 - lace + lace * (.5 + .5 * Math.sin(i * 1.7 + d * 9) * Math.sin(i * .53)))); } });
  for (let k = 0; k < rows.length - 1; k++) for (let i = 0; i < n; i++) { const a = k * n + i, b = k * n + (i + 1) % n; idx.push(a, a + n, b, b, a + n, b + n); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  scenery(m); m.renderOrder = 1; return m;
}

const beachSkirt = (pts, d0, R, y) => {
  const n = pts.length, pos = [], idx = [];
  for (const [x, z] of pts) { const L = Math.hypot(x, z) || 1; pos.push(x + x / L * d0, y, z + z / L * d0); }
  for (const [x, z] of pts) { const L = Math.hypot(x, z) || 1; pos.push(x / L * R, y, z / L * R); }
  for (let i = 0; i < n; i++) { const a = i, b = (i + 1) % n; idx.push(a, a + n, b, b, a + n, b + n); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide }));
  m.castShadow = false; m.receiveShadow = false; m.raycast = () => {}; m.userData.noOcclude = true; m.userData.noMerge = true; return m;
};
// ── 섬 (판 바닥): B와 같은 풀밭+모래 물가 한 덩어리, 연못물(옥빛, 빗방울 고리), 물가 풀포기·조약돌·붓꽃, 연잎 무리 ─────────────────
B.s3c_island = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];
  const pts = ISLAND_C;
  f.add(groundMesh(pts, beachGeo(pts, .5, 0, -.085), { ...T, grass: T.grass || '#88cc72', clover: 18, daisies: 10, meadowSeed: 47 }, { sand: '#efe3c4' }));
  // (10/24 사용자 "섬 테두리 하얀 백사장에는 외곽선을 없앨 수 있는지"): the beach's ink line comes from the island ending against
  // nothing in the outline pass (the pond is drawn without one). An unseen skirt — no colour, no depth in the picture, only in
  // the outline pass, as the island's own piece — carries the beach on flat out under the pond, so the shore has no edge to ink
  f.add(beachSkirt(pts, .46, 26, -.086));
  lakeWater(f, { pts: scaleOutline(pts, .45), y: W, R: 24, near: '#aee9df', mid: '#82d6d2', far: '#93d6e4', sky: '#d8eef2', rainy: true, glint: 9 });
  // dry sand → wet sand → a lace of foam → the clear shallows
  f.add(shoreBand(pts, [[.16, '#b9a47a', 0], [.3, '#b9a47a', .32], [.42, '#b4a079', .4]]));
  f.add(shoreBand(pts, [[.41, '#ffffff', 0], [.46, '#ffffff', .95], [.52, '#ffffff', .7], [.6, '#ffffff', .35], [.72, '#ffffff', 0]], .035, .55));
  const skip = [[4.75, 1.0], [4.75, 5.55]];   // (the waterwheel's foot and the lily steps out on the water — stage3-maps.js)
  f.add(mc('s3c-shore', ({ add }) => {
    const r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(31);
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i], L = Math.hypot(x, z) || 1, ix = x - x / L * .08, iz = z - z / L * .08;
      if (skip.some(([sx, sz], k) => Math.hypot(x - sx, z - sz) < (k ? 1.25 : .95))) continue;   // the waterwheel and the lily steps
      // the grass edge frays onto the sand: small tufts close together, now and then a clover flower or a violet
      if (i % 3 === 0) tuft(add, ix + (r() - .5) * .05, iz + (r() - .5) * .05, .55 + r() * .3, '#5aae5c', '#84c96c');
      if (i % 11 === 5) daisy(add, ix, iz, .8, '#ffffff', '#ffcf3a', 0, .12);
      else if (i % 17 === 9) for (let k = 0; k < 3; k++) { const a = k * 2.1; daisy(add, ix + Math.cos(a) * .05, iz + Math.sin(a) * .05, .9, '#c9b6f6', '#fff2a0', 0, .18); }
      // smooth pebbles where the sand meets the water
      if (i % 7 === 3) stone(add, x + x / L * (.3 + r() * .12), z + z / L * (.3 + r() * .12), .045 + r() * .04, i, ['#e8e2d8', '#d6cfc4', '#c9c2b8'][i % 3], -.075, .5);
    }
    // stepping stones: the house's ladder to the lily steps, and over to the waterwheel
    for (const [x0, z0, sz, a] of [[-.95, -.55, .17, .3], [-.65, .05, .16, 1.1], [-.45, .7, .16, .5], [-.35, 1.35, .15, 1.4], [-.3, 1.95, .15, .7], [-.25, 2.55, .15, 1.0], [.35, -.45, .15, .9], [1.0, -.25, .16, .2], [1.65, -.05, .15, 1.2], [2.3, .05, .16, .4]]) {
      const [x, z] = stretchC([x0, z0]); stone(add, x, z, sz, Math.round(x * 13 + z * 5) & 15, '#e9e3d9', -.045, .28, a);
    }
    // round bushes along the back, little clumps of white clover flowers
    const bushC = (x, z, s) => { for (const [dx, dz, rr, c] of [[0, 0, .3, '#5fb064'], [.24, .08, .22, '#4fa55a'], [-.22, .1, .21, '#579f5a'], [.04, .22, .19, '#78c46c'], [-.05, -.16, .2, '#5fb064']]) add(G.sph(rr * s, 14, 10), c, x + dx * s, rr * s * .85, z + dz * s, 0, 0, 0, [1, .88, 1]); };
    for (const [x, z, sc] of [[.3, -2.95, .9], [3.0, -2.35, .85], [-3.35, -.95, .8]]) { const [X, Z] = stretchC([x, z]); bushC(X, Z, sc); }
    for (const [x0, z0] of [[-.9, -3.0], [1.3, -2.95], [3.4, -1.0]]) { const [x, z] = stretchC([x0, z0]); for (let k = 0; k < 5; k++) { const a = k * 1.26 + x; daisy(add, x + Math.cos(a) * .13, z + Math.sin(a) * .1, .9, '#ffffff', '#ffcf3a'); } }
  }));
  // in the shallows: a few clumps of water grass standing out of the water and specks of duckweed (no outline: they are the water's)
  f.add(scenery(mc('s3c-shallows', ({ add }) => {
    const r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(53);
    for (let i = 4; i < pts.length; i += 13) {
      const [x, z] = pts[i], L = Math.hypot(x, z) || 1, d = .7 + r() * .25, px = x + x / L * d, pz = z + z / L * d;
      if (skip.some(([sx, sz]) => Math.hypot(px - sx, pz - sz) < 1.1)) continue;
      if (i % 2) for (let k = 0; k < 5; k++) { const a = k * 1.25 + r(), h = .14 + r() * .12; const g = G.box(.022, h, .004, 0); g.translate(0, h / 2, 0); add(g, k % 2 ? '#6fbf5e' : '#8fd06a', px + Math.cos(a) * .04, W, pz + Math.sin(a) * .04, (r() - .5) * .5, a, (r() - .5) * .4); }
      else for (let k = 0; k < 9; k++) { const a = r() * PI * 2, rr = r() * .22; add(G.cyl(.022 + r() * .015, .022, .004, 7), k % 3 ? '#86cc66' : '#a6dc7a', px + Math.cos(a) * rr, W + .004, pz + Math.sin(a) * rr); }
    }
  })));
};

// ── 개굴이 집 (정본 '벤치' 자리): 여섯 나무 기둥 위 둥근 마루, 크림 판자 둥근 오두막에 민트 문·동그란 창, 큰 연잎 지붕(지붕 위엔 빗물 고인
// 노란 우산이 뒤집혀 있음), 현관 작은 벤치(신문지), 우산꽂이·작은 장화, 내려가는 사다리; 집 밑(기둥 사이)도 숨는 자리 ──────────────
B.s3c_house = f => {
  const Y = .58, R = .78, Z0 = -.12, K = 1.3;   // (the map's face: drawn 1.3× — the places below are scaled with it)
  const root = grp(); root.scale.setScalar(K); f.add(root);
  f.collideBox = [-.85 * K, 0, (Z0 - .85) * K, .85 * K, 1.6 * K, (Z0 + .85) * K];
  root.add(mt('s3c-stilt-logs', TX.bark(), ({ add }) => { for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2 + .26; add(G.cyl(.058, .068, Y, 12), '#b07a4c', Math.cos(a) * .6, Y / 2, Z0 + Math.sin(a) * .6, 0, 0, 0, 1, .25); } }));
  root.add(mc('s3c-stilts', ({ add, tube }) => {
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2 + .26, x = Math.cos(a) * .6, z = Z0 + Math.sin(a) * .6; add(G.cyl(.08, .085, .05, 10), shade(WOODD, -.1), x, .025, z); for (const y of [Y - .1, Y - .14]) add(G.tor(.066, .012, PI * 2, 5, 14), '#efe0c0', x, y, z, HP, 0, 0); }
    for (let k = 0; k < 6; k += 2) { const a = k / 6 * PI * 2 + .26, b = (k + 1) / 6 * PI * 2 + .26; tube([Math.cos(a) * .6, .12, Z0 + Math.sin(a) * .6], [Math.cos(b) * .6, Y - .08, Z0 + Math.sin(b) * .6], .022, WOODD, 5); }
    // the ladder down to the lawn (front right)
    for (const s of [-1, 1]) tube([.38 + s * .14, Y, Z0 + .66 + s * .06], [.62 + s * .14, 0, Z0 + 1.08 + s * .06], .022, WOODD, 6);
    for (let k = 1; k < 4; k++) { const t = k / 4; add(G.box(.3, .03, .06, .01), WOODL, .38 + .24 * t, Y * (1 - t), Z0 + .66 + .42 * t, 0, -.25, 0); }
  }));
  root.add(mt('s3c-deck', TX.plank(), ({ add }) => { add(G.cyl(R, R, .07, 32), WOOD, 0, Y, Z0, 0, 0, 0, 1, { w: .5 }); }));
  root.add(mt('s3c-cabin', TX.plank(), ({ add }) => { add(G.cyl(.5, .52, .74, 28), '#fff3dc', 0, Y + .4, Z0 - .12, 0, 0, 0, 1, .3); }));
  root.add(mc('s3c-house', ({ add, tube }) => {
    add(G.tor(R, .025, PI * 2, 6, 40), WOODD, 0, Y + .03, Z0, HP, 0, 0);
    for (let k = 0; k < 28; k++) { const a = k / 28 * PI * 2; add(G.box(.16, .018, .05, .006), k % 3 ? WOODL : shade(WOOD, -.06), Math.cos(a) * (R - .03), Y + .037, Z0 + Math.sin(a) * (R - .03), 0, -a, 0); }
    // trims round the cabin's top and foot
    add(G.tor(.505, .022, PI * 2, 6, 36), '#f0d9b2', 0, Y + .77, Z0 - .12, HP, 0, 0); add(G.tor(.52, .02, PI * 2, 6, 36), '#e8cfa6', 0, Y + .05, Z0 - .12, HP, 0, 0);
    // the door (+z): a mint door in a cream frame with a round porthole, hinges and a knob; a striped mat on the deck
    const dz = Z0 - .12 + .505;
    // (the door itself is a part below — it swings open; behind it the warm-lit doorway, hidden inside the shut door)
    add(G.box(.28, .32, .006, .002), '#ffe39a', 0, Y + .24, dz + .003); add(G.cyl(.14, .14, .006, 18), '#ffe39a', 0, Y + .41, dz + .003, HP, 0, 0);
    add(G.box(.22, .012, .006, .002), '#f2c46a', 0, Y + .09, dz + .004);
    add(G.tor(.17, .022, PI, 6, 18), '#fff6e6', 0, Y + .41, dz + .012); for (const sx of [-1, 1]) add(G.box(.035, .36, .03, .01), '#fff6e6', sx * .17, Y + .23, dz + .012);
    // a little frog plaque over the door
    add(G.sph(.06, 14, 10), '#7fcf6a', 0, Y + .63, dz + .012, 0, 0, 0, [1.2, .8, .35]); for (const sx of [-1, 1]) { add(G.sph(.022, 10, 8), '#7fcf6a', sx * .035, Y + .675, dz + .016, 0, 0, 0, [1, 1, .5]); add(G.sph(.01, 8, 6), '#2a1d33', sx * .035, Y + .678, dz + .026); }
    add(G.box(.3, .012, .16, .004), '#ffb3a6', 0, Y + .045, dz + .12); for (const x of [-.09, 0, .09]) add(G.box(.035, .013, .16, .002), '#fff1ec', x, Y + .046, dz + .12);
    // the round window (+x): a cream frame, a cross of bars, warm light inside, a little curtain tied at both sides and a potted sprout on the sill
    const wx = .49, wy = Y + .42, wz = Z0 - .2;
    add(G.cyl(.12, .12, .02, 20), '#ffe7a8', wx - .012, wy, wz, 0, 0, HP); add(G.tor(.12, .024, PI * 2, 6, 20), '#fff6e6', wx, wy, wz, 0, HP, 0);
    add(G.box(.012, .24, .016, .003), '#fff6e6', wx + .004, wy, wz); add(G.box(.012, .016, .24, .003), '#fff6e6', wx + .004, wy, wz);
    for (const sz of [-1, 1]) add(G.sph(.045, 10, 8), '#ffc6d6', wx - .006, wy + .03, wz + sz * .085, 0, 0, 0, [.4, 1.2, .6]);
    add(G.box(.06, .02, .2, .006), '#fff6e6', wx + .025, wy - .125, wz); add(G.cyl(.026, .02, .04, 10), '#e9845a', wx + .03, wy - .095, wz + .05); add(G.sph(.028, 8, 6), '#6cc068', wx + .03, wy - .06, wz + .05);
    add(G.box(.06, .06, .06, .015), '#ffe9a8', -.2, Y + .55, dz + .03); tube([-.2, Y + .58, dz + .03], [-.2, Y + .62, dz - .01], .006, '#8a95a8', 4);
    // the lily-leaf roof
    bigLeaf(add, 0, Y + .78, Z0 - .12, .74, 1.2, { dome: .32, drops: 7, tube });
    add(G.cyl(.04, .05, .08, 8), '#5fae5a', 0, Y + .74, Z0 - .12);
    // the upturned yellow umbrella on the roof, rain pooled in it
    const ux = .14, uy = Y + 1.13, uz = Z0 - .16;
    // (a closed cone upside down: its yellow-striped sides show below the rim, the cap on top is the rim's inside, the rain sits in it)
    for (let k = 0; k < 8; k++) add(new THREE.ConeGeometry(.3, .22, 3, 1, false, k * PI / 4, PI / 4), k % 2 ? '#ffd84a' : '#fff1a8', ux, uy + .1, uz, PI, 0, .12);
    add(G.tor(.3, .02, PI * 2, 5, 24), '#ffcf3c', ux - .013, uy + .222, uz, HP, 0, .12);
    add(G.cyl(.26, .26, .012, 22), '#9fdcf2', ux - .014, uy + .232, uz, 0, 0, .12); add(G.cyl(.15, .15, .014, 18), '#d6f3ff', ux - .02, uy + .238, uz, 0, 0, .12);
    tube([ux + .01, uy, uz], [ux + .05, uy + .42, uz], .012, '#f6f2ea', 5); add(G.tor(.05, .012, PI, 5, 10), '#ff8f8a', ux + .1, uy + .42, uz, 0, 0, 0);
    // the ribs down the striped sides to the tip, a ring of ripple and a glint on the pooled rain
    for (let k = 0; k < 8; k++) { const a = k * PI / 4, ca = Math.cos(a), sa = Math.sin(a); tube([ux - .013 + ca * .3 * Math.cos(.12), uy + .21 + ca * .3 * Math.sin(.12) * -1 * 0, uz + sa * .3], [ux + .02, uy - .01, uz], .006, '#e9b830', 4); }
    add(G.cyl(.016, .01, .05, 8), '#d9d2c9', ux + .025, uy - .03, uz, 0, 0, .12);
    add(G.tor(.1, .005, PI * 2, 4, 20), '#ffffff', ux - .03, uy + .246, uz + .04, HP, 0, .12); add(G.sph(.035, 8, 4), '#ffffff', ux - .1, uy + .248, uz - .06, 0, .5, 0, [1.6, .2, .45]);
    // porch: the umbrella stand with two umbrellas, a pair of little rain boots
    add(G.cyl(.08, .07, .2, 14), '#7fb8e8', .34, Y + .1, Z0 + .42);
    tube([.32, Y + .05, Z0 + .42], [.3, Y + .42, Z0 + .4], .02, '#ff8f8a', 6); add(G.tor(.035, .01, PI, 4, 8), '#ff8f8a', .27, Y + .42, Z0 + .4);
    tube([.37, Y + .05, Z0 + .43], [.4, Y + .38, Z0 + .46], .02, '#a9c8ff', 6); add(G.tor(.035, .01, PI, 4, 8), '#a9c8ff', .43, Y + .38, Z0 + .46);
    for (const sx of [-1, 1]) { add(G.cyl(.032, .034, .1, 10), '#ffd84a', -.05 + sx * .05 + .45, Y + .05, Z0 + .6); add(G.box(.06, .03, .1, .01), '#ffd84a', -.05 + sx * .05 + .45, Y + .015, Z0 + .63); }
  }));
  // the door: hinged on its left, swings out onto the deck — seen from the front its warm doorway shows (a touch: 10/24 사용자
  // "인터랙션이 있으면 좋겠음"; the bench sits a little further left so the open door clears it)
  const DZ = Z0 - .12 + .505, door = grp(); put(door, -.15, 0, DZ); root.add(door);
  door.add(mc('s3c-door', ({ add }) => {
    add(G.box(.3, .34, .04, .02), '#7fd3b8', .15, Y + .24, 0); add(G.cyl(.15, .15, .04, 18, false), '#7fd3b8', .15, Y + .41, 0, HP, 0, 0);
    for (const x of [.06, .15, .24]) add(G.box(.008, .3, .006, .002), '#6cc2a6', x, Y + .23, .021);
    add(G.cyl(.055, .055, .02, 16), '#bfe6f6', .15, Y + .38, .022, HP, 0, 0); add(G.tor(.055, .012, PI * 2, 5, 16), '#5fb7a0', .15, Y + .38, .03);
    add(G.sph(.022, 8, 6), '#ffd84a', .24, Y + .25, .028); for (const y of [.12, .32]) add(G.box(.03, .04, .012, .004), '#c9a95a', .02, Y + y, .024);
  }));
  const dp = f.part('door', door, t => { door.rotation.y = -1.2 * t; }, { label: '개굴이 집 문', sfx: 'open', dur: .4 });
  dp.gpt2Reach = true;   // (nothing hides behind it: a touch that only opens and shuts)
  // more of the house (10/24 "집 디테일 올리기"): a rain chain down the left side into a little barrel, a pot of fern on the deck,
  // and a mailbox on a post by the ladder's foot whose flap opens
  root.add(mc('s3c-house-more', ({ add, tube }) => {
    for (let k = 0; k < 7; k++) add(G.tor(.022, .006, PI * 2, 4, 10), '#c9a95a', -.7, Y + .72 - k * .066, Z0 - .02, 0, k % 2 ? HP : 0, 0);
    add(G.cyl(.1, .09, .2, 16), '#c98f5a', -.66, Y + .14, Z0 - .02); for (const y of [.07, .2]) add(G.tor(.1 - y * .03, .009, PI * 2, 4, 18), '#8a95a8', -.66, Y + y, Z0 - .02, HP, 0, 0);
    add(G.cyl(.085, .085, .01, 16), '#9fdcf2', -.66, Y + .235, Z0 - .02); add(G.tor(.035, .004, PI * 2, 4, 12), '#ffffff', -.68, Y + .242, Z0 - .02, HP, 0, 0);
    add(G.cyl(.065, .05, .1, 12), '#e9845a', .64, Y + .09, Z0 + .02); add(G.tor(.066, .008, PI * 2, 4, 14), '#f29a72', .64, Y + .14, Z0 + .02, HP, 0, 0);
    for (let k = 0; k < 7; k++) { const a = k * .9; add(G.sph(.05, 8, 6), k % 2 ? '#5fae5a' : '#79c46a', .64 + Math.cos(a) * .05, Y + .2 + (k % 3) * .02, Z0 + .02 + Math.sin(a) * .05, 0, -a, .7, [1.5, .4, .7]); }
    add(G.box(.04, .42, .04, .01), WOODD, .9, .21, Z0 + .62); add(G.box(.12, .05, .14, .01), WOODD, .9, .43, Z0 + .62);
    add(G.box(.13, .12, .2, .03), '#ff9aa8', .9, .52, Z0 + .62); add(G.cyl(.065, .065, .2, 14, false, 0, PI), '#ff9aa8', .9, .58, Z0 + .62, HP, 0, 0);
    add(G.box(.012, .1, .03, .004), '#ffd84a', .97, .63, Z0 + .58);
  }));
  const flap = grp(); put(flap, .9, .46, Z0 + .725); root.add(flap);
  flap.add(mc('s3c-mailflap', ({ add }) => { add(G.box(.12, .14, .012, .004), '#ff8a9a', 0, .07, 0); add(G.sph(.012, 6, 4), '#ffffff', 0, .1, .01); }));
  const letter = grp(); put(letter, .9, .5, Z0 + .66); root.add(letter);
  letter.add(mc('s3c-letter', ({ add }) => { add(G.box(.09, .06, .004, .001), '#fffaf0', 0, 0, 0); add(G.box(.02, .02, .006, .002), '#7fcf6a', .025, .015, .002); }));
  const mp = f.part('lid', [flap, letter], (t, bF, bL) => { flap.rotation.x = 1.5 * t; letter.position.z = bL.p.z + .1 * t; letter.position.y = bL.p.y + .03 * t; letter.rotation.x = -.3 * t; }, { label: '우편함', sfx: 'open' });
  mp.gpt2Reach = true;
  // the porch bench (the old bench's three places: on it, the newspaper on it, under the house among the stilts)
  const BX = -.45, BZ = Z0 + .46, BY = Y + .04, br = -.6;
  root.add(put(mc('s3c-bench', ({ add }) => {
    add(G.box(.5, .04, .18, .012), WOODL, 0, .2, 0); add(G.box(.5, .12, .03, .012), WOOD, 0, .32, -.09);
    for (const sx of [-1, 1]) add(G.box(.04, .2, .16, .01), WOODD, sx * .21, .1, 0);
  }), BX, BY, BZ, 0, br, 0));
  const news = paintTex('s3c-news', 128, 96, (c, w, h) => { c.fillStyle = '#f7f4ec'; c.fillRect(0, 0, w, h); c.fillStyle = '#5fae8a'; c.fillRect(8, 8, w - 16, 14); c.fillStyle = '#c9cfdc'; for (let y = 30; y < h - 6; y += 9) { c.fillRect(8, y, 50, 4); c.fillRect(70, y, 50, 4); } });
  const np = grp(new THREE.Mesh(new THREE.BoxGeometry(.2, .012, .14), texMat(news)));
  const ca = Math.cos(br), sa = Math.sin(br), lx = .1, NX = BX + lx * ca, NZ = BZ - lx * sa;
  put(np, NX, BY + .227, NZ, 0, br + .2, 0); root.add(np);
  const p = f.part('lift', np, (t, b) => { np.position.y = b.p.y + .2 * t; np.rotation.x = -.38 * t; np.rotation.z = .15 * t; }, { label: '신문지', sfx: 'swish' });
  f.spot('inside', null, NX * K, (BY + .22) * K, NZ * K, { part: p, maxH: .2, label: '신문지 밑', scale: .7 });
  f.spot('on', null, (BX - .12 * ca) * K, (BY + .22) * K, (BZ + .12 * sa) * K, { maxH: .3, label: '현관 벤치 위', scale: .7 });
  f.spot('under', null, -.15 * K, 0, (Z0 + .05) * K, { maxH: .4, label: '집 밑', scale: .85 });
};

// ── 물레방아 (정본 '낚시 좌대' 자리 — 같은 부품·같은 감기): 물가 작은 나무 마루, 물에 반쯤 잠긴 나무 바퀴, 물 위로 뻗은 도르래 팔과
// 양동이 — 손잡이를 터치하면 저절로 감겨 양동이가 올라오고(바퀴도 돎) 매번 다른 게 걸려요 (reelcatch) ─────────────────────────
B.s3c_wheel = f => {
  const D = .8, Y = .16, X0 = -.95, X1 = .35, AZ0 = -.34, AZ1 = -.66;
  f.collideBox = [X0, 0, -.85, X1 + .9, Y + .9, D / 2];
  f.add(mt('s3c-wheel-deck', TX.plank(), ({ add }) => { let k = 0; for (let x = X0 + .11; x < X1; x += .215, k++) add(G.box(.2, .05, D, .014), k % 3 === 1 ? WOODL : k % 3 === 2 ? shade(WOOD, -.05) : WOOD, x, Y, 0, 0, 0, 0, 1, { w: .45 }); }));
  f.add(mc('s3c-wheel-frame', ({ add, tube }) => {
    for (const sz of [-1, 1]) add(G.box(X1 - X0 + .04, .06, .07, .015), WOODD, (X0 + X1) / 2, Y - .045, sz * (D / 2 - .04));
    for (const x of [X0 + .12, X1 - .05]) for (const sz of [-1, 1]) add(G.cyl(.05, .055, Y + .4, 10), WOODD, x, (Y + .4) / 2 - .4, sz * (D / 2 - .04));
    // the wheel's two posts in the water and its axle
    for (const sz of [-.3, .3]) add(G.box(.08, .9, .08, .02), WOODD, .85, .22, sz);
    add(G.cyl(.04, .04, .7, 10), '#8a6448', .85, .5, 0, HP, 0, 0);
    // the arm out over the water with a pulley, on a post at the deck's edge; the stool; a watering can
    // (10/24 사용자 "물레방아와 바구니가 닿음": the arm reaches out past the wheel's side, so the bucket hangs clear of the paddles)
    add(G.box(.08, 1.05, .08, .02), WOODD, X1 - .05, Y + .52, AZ0);
    tube([X1 - .05, Y + 1.0, AZ0], [X1 + .95, Y + 1.0, AZ1 - .02], .035, WOOD, 8); tube([X1 - .05, Y + .7, AZ0], [X1 + .35, Y + .98, AZ0 + (AZ1 - AZ0) * .4], .025, WOODD, 6);
    add(G.cyl(.06, .06, .04, 14), '#8a95a8', X1 + .9, Y + .96, AZ1, HP, 0, 0);
    add(G.cyl(.15, .15, .05, 18), WOODL, -.55, Y + .2, .05);
    for (const a of [0, 2.09, 4.19]) tube([-.55 + Math.cos(a) * .11, Y + .02, .05 + Math.sin(a) * .11], [-.55 + Math.cos(a) * .08, Y + .2, .05 + Math.sin(a) * .08], .018, WOODD, 6);
    add(G.cyl(.145, .15, .05, 18), '#ffc6d6', -.55, Y + .25, .05);
    add(G.cyl(.07, .08, .14, 14), '#7fd3b8', -.2, Y + .1, .25); tube([-.13, Y + .08, .25], [.0, Y + .2, .25], .014, '#7fd3b8', 5); add(G.tor(.05, .01, PI, 4, 10), '#5fb7a0', -.2, Y + .17, .25, 0, 0, 0);
    // (29판 10/24 "디테일 올려"): a coil of rope on the deck, a little lantern hung from the arm's post, a scoop net leaning on it
    for (let k = 0; k < 4; k++) add(G.tor(.075 - k * .012, .012, PI * 2, 5, 18), '#d9b98a', -.82, Y + .04 + k * .014, -.22, HP, 0, 0);
    tube([X1 - .05, Y + .9, AZ0], [X1 - .18, Y + .9, AZ0], .008, WOODD, 4); tube([X1 - .18, Y + .9, AZ0], [X1 - .18, Y + .82, AZ0], .004, '#8a95a8', 4);
    add(G.box(.06, .08, .06, .015), '#ffe9a8', X1 - .18, Y + .76, AZ0); add(G.cone(.05, .035, 4), '#8a95a8', X1 - .18, Y + .82, AZ0, 0, PI / 4, 0); add(G.cyl(.032, .032, .01, 4), '#8a95a8', X1 - .18, Y + .715, AZ0, 0, PI / 4, 0);
    tube([X0 + .25, Y + .03, .33], [X0 + .5, Y + .62, .37], .01, WOODD, 5); add(G.tor(.07, .008, PI * 2, 4, 16), '#5fb0e6', X0 + .52, Y + .68, .37, .4, 0, .3);
  }));
  // the wheel: a part pivot (it turns as the bucket comes up)
  const wheel = grp(); put(wheel, .85, .5, 0); f.add(wheel);
  wheel.add(mt('s3c-wheel-wood', TX.plank(), ({ add }) => {
    for (const sz of [-.2, .2]) add(G.tor(.52, .038, PI * 2, 6, 40), WOOD, 0, 0, sz, 0, 0, 0, 1, .3);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; for (const sz of [-.2, .2]) add(G.box(.05, 1.02, .04, .01), WOODD, 0, 0, sz, 0, 0, a, 1, .3); add(G.box(.18, .05, .46, .012), k % 2 ? WOODL : shade(WOODL, -.05), Math.cos(a) * .55, Math.sin(a) * .55, 0, 0, 0, a + HP, 1, .3); }
    add(G.cyl(.09, .09, .46, 14), WOODD, 0, 0, 0, HP, 0, 0, 1, .3);
  }));
  wheel.add(mc('s3c-wheel-iron', ({ add }) => {
    for (const sz of [-.2, .2]) { add(G.tor(.555, .01, PI * 2, 4, 48), '#8a95a8', 0, 0, sz + (sz > 0 ? .03 : -.03)); add(G.cyl(.11, .11, .02, 14), '#8a95a8', 0, 0, sz + (sz > 0 ? .02 : -.02), HP, 0, 0); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; for (const sz of [-.23, .23]) add(G.sph(.014, 6, 5), '#6f7a8e', Math.cos(a) * .52, Math.sin(a) * .52, sz); }
  }));
  // water running off the paddles: a few drops falling from the top and a ring of foam where the wheel meets the pond (no outline)
  f.add(scenery(mc('s3c-wheel-water', ({ add }) => {
    for (const [x, y, z, s2] of [[1.32, .55, .05, 1], [1.36, .36, -.06, .8], [1.38, .18, .1, .9], [1.3, .72, -.1, .7], [1.37, .05, -.02, .6]]) add(G.sph(.022 * s2, 8, 6), '#e9f9ff', x, y, z, 0, 0, 0, [.8, 1.5, .8]);
    for (let k = 0; k < 14; k++) { const a = k / 14 * PI * 2; add(G.sph(.05, 8, 5), '#ffffff', .85 + Math.cos(a) * .5, W + .01, Math.sin(a) * .3, 0, -a, 0, [1.6, .18, .7]); }
  })));
  // the crank on the arm's post (the reel's part) and the rope with the bucket (the keep-net's place)
  const crank = grp(); put(crank, X1 - .05, Y + .62, AZ0 + .08); f.add(crank);
  crank.add(mc('s3c-crank', ({ add }) => { add(G.cyl(.065, .065, .05, 16), '#ffcf3c', 0, 0, 0, HP, 0, 0); add(G.box(.025, .11, .025, .008), '#8a6448', 0, -.05, .04); add(G.sph(.026, 8, 6), '#ff8f8a', 0, -.11, .05); }));
  const BXp = X1 + .9, BZp = AZ1, yLo = -.45, yHi = Y + .45;
  const bucket = grp(); put(bucket, BXp, yLo, BZp); f.add(bucket);
  bucket.add(mc('s3c-bucket', ({ add, tube }) => {
    for (let k = 0; k < 14; k++) { const a = k / 14 * PI * 2; add(G.box(.072, .24, .02, .006), k % 2 ? WOOD : shade(WOOD, -.07), Math.cos(a) * .155, .12, Math.sin(a) * .155, 0, -a + HP, 0, [1, 1, 1]); }
    add(G.cyl(.14, .14, .02, 18), WOODD, 0, .01, 0); add(G.cyl(.125, .125, .01, 18), '#9fdcf2', 0, .18, 0);
    for (const y of [.04, .2]) add(G.tor(.15 + y * .1, .012, PI * 2, 5, 20), '#8a95a8', 0, y, 0, HP, 0, 0);
    tube([-.17, .24, 0], [0, .38, 0], .006, '#efe0c0', 4); tube([0, .38, 0], [.17, .24, 0], .006, '#efe0c0', 4);
  }));
  const rope = grp(); put(rope, BXp, Y + .96, BZp); f.add(rope);
  rope.add(mc('s3c-rope', ({ add }) => add(G.cyl(.006, .006, 1, 4), '#efe0c0', 0, -.5, 0)));
  const setRope = by => { rope.scale.y = Math.max(.05, Y + .96 - (by + .38)); };
  setRope(yLo);
  const p = f.part('lift', [bucket, crank, rope, wheel], (t, bB) => {
    bucket.position.y = bB.p.y + (yHi - yLo) * t; bucket.rotation.y = t * .8;
    crank.rotation.z = -t * PI * 6; wheel.rotation.z = -t * PI * 1.5; setRope(bucket.position.y);
  }, { label: '물레방아 양동이', sfx: 'swish', dur: .9 });
  // (29판 10/24: 'in' — sunk half in the bucket's water, like a thing in a pond: as 'inside' the lift's rope and wheel counted as a
  // lid right over it, and the catch drew at 4%)
  f.spot('in', bucket, 0, .1, 0, { part: p, maxH: .22, label: '물속 양동이', scale: .72 });
  f.spot('on', null, -.55, Y + .29, .05, { maxH: .3, label: '물가 의자 위', scale: .7 });
  f.spot('under', null, -.62, .005, -.2, { maxH: .14, label: '물가 마루 밑', scale: .7 });
};

// ── 연잎 징검다리 (정본 '연못' 자리 — 3×3): 섬에서 물 위로 이어지는 큰 연잎들, 연꽃 몇 송이, 물가 쪽 매끈한 돌 ─────────────────────
B.s3c_lilysteps = f => {
  f.add(mc('s3c-lilysteps', ({ add, tube }) => {
    for (const [x, z, s, k] of [[-1.3, -.95, .15, 2], [-1.42, -.45, .13, 8], [.95, -1.05, .12, 9]]) stone(add, x, z, s, k, ['#d6cfc4', '#c9c2b8', '#e0d9cf'][k % 3], -.05, .5);
    add(G.rock(6, .12, 14, 10), '#cbc4ba', -1.15, -.06, -.55, 0, .4, 0, [.24, .08, .2]);
    // the other big pads of the steps and the flowers between them
    for (const [x, z, r, rot] of [[-.05, .05, .27, 1.3], [1.15, .95, .26, 3.9], [-.9, .75, .22, .4], [1.25, -.2, .2, 2.4]]) bigLeaf(add, x, W + .005, z, r, rot, { drops: 2, tube });
    lotus2(add, -.5, .35, 1.15); lotus2(add, .85, .1, .95, W + .03, '#ffffff', '#fff6f8', '#fffbe8'); lotus2(add, 1.45, .5, .85);
    // a closed bud on its stalk
    tube([.3, W, -.05], [.32, W + .22, -.04], .008, '#5fae5a', 5); add(G.sph(.04, 10, 8), '#ffb6cc', .32, W + .26, -.04, 0, 0, 0, [.8, 1.4, .8]);
    for (const [x, z] of [[.1, .75], [-1.3, .25], [1.6, 1.3]]) lily(add, x, z, .1, x * 3, W + .004);
    cattails(add, tube, 1.4, -.75, .85, 9, 7);
  }));
  const pad = (x, z, r, rot) => {
    put(f.add(mc('s3c-pad|' + r + '|' + rot, ({ add, tube }) => bigLeaf(add, 0, W + .006, 0, r, rot, { drops: 2, tube }))), x, 0, z);
    f.spot('on', null, x, W + .045, z, { maxH: .28, label: '연잎 위', scale: .7, noDecoy: true });
  };
  pad(.45, -.4, .3, .4); pad(-.35, -.55, .26, 2.1); pad(.7, .45, .27, 4.4);
  f.spot('behind', null, -1.15, -.01, -.55, { maxH: .25, label: '연못가 돌 뒤', scale: .7 });
};

// ── 노란 비 우산 의자 (정본 '파라솔 의자' 자리): 땅에 꽂아 둔 큰 노란·크림 우산(물방울 맺힘), 밑에 분홍 방석 나무 의자 ──────────────
B.s3c_umbrella = f => {
  f.collideBox = [-.25, 0, -.22, .45, .66, .32];   // (the pole and the chair: the wide canopy's box held the cooler's lid at a third — 10/24)
  // the canopy on its own pivot: a touch gives it a twirl that flicks the rain off (10/24 "인터랙션이 있으면 좋겠음")
  const tilt = grp(); put(tilt, .06, 1.3, -.1, .08, 0, -.06); f.add(tilt);
  const spin = grp(); tilt.add(spin);
  spin.add(mc('s3c-umb-canopy', ({ add, tube }) => {
    for (let k = 0; k < 8; k++) { const c = k % 2 ? '#fff6dc' : '#ffd84a', g = new THREE.ConeGeometry(.74, .36, 4, 1, true, k * PI / 4, PI / 4); add(g, c, 0, .08, 0);
      const a = k * PI / 4 + PI / 8; add(G.sph(.07, 10, 6), c, Math.sin(a) * .69, -.09, Math.cos(a) * .69, 0, a, 0, [1.4, .5, .5]); }
    add(G.cone(.75, .02, 8), '#fff1b8', 0, -.09, 0, PI, 0, 0);
    for (let k = 0; k < 8; k++) { const a = k * PI / 4; tube([0, -.2, 0], [Math.sin(a) * .66, -.1, Math.cos(a) * .66], .006, '#e9d9b0', 4); }
    add(G.cyl(.03, .03, .06, 10), '#f6f2ea', 0, -.2, 0);
    add(G.sph(.045, 10, 8), '#ff8f8a', 0, .3, 0);
    for (const [x, z] of [[.4, .3], [-.35, .25], [.1, -.55], [-.5, -.3]]) add(G.sph(.022, 8, 6), '#eafaff', x * .9, -.04 + .22 * (1 - Math.hypot(x, z)), z * .9, 0, 0, 0, [1, .7, 1]);
    for (const a of [.4, 2.3, 4.1]) add(G.sph(.016, 8, 6), '#dff6ff', Math.sin(a) * .72, -.2, Math.cos(a) * .72, 0, 0, 0, [.8, 1.6, .8]);
  }));
  const up = f.part('lift', spin, t => { spin.rotation.y = t * PI * 2; spin.position.y = .03 * Math.sin(t * PI); }, { label: '노란 우산', sfx: 'swish', dur: .7 });
  up.gpt2Reach = true;
  f.add(mc('s3c-umbrella', ({ add, tube }) => {
    tube([0, 0, -.12], [.06, 1.42, -.1], .022, '#f6f2ea', 8); add(G.tor(.05, .014, PI, 5, 10), '#ff8f8a', -.05, .03, -.12, 0, 0, PI);
    // a striped towel over the chair's back, a stump table with a glass of melon juice
    add(G.box(.26, .012, .16, .004), '#bfe9f6', 0, .64, -.06, -.12, 0, 0); add(G.box(.26, .14, .012, .004), '#bfe9f6', 0, .58, .02, -.12, 0, 0);
    for (const x of [-.08, .08]) add(G.box(.03, .145, .014, .002), '#ffffff', x, .58, .022, -.12, 0, 0);
    add(G.cyl(.1, .11, .22, 14), '#b07a4c', .34, .11, .18); add(G.cyl(.1, .1, .012, 14), '#efd2a2', .34, .226, .18); add(G.tor(.06, .004, PI * 2, 4, 14), '#d9b384', .34, .233, .18, HP, 0, 0);
    add(G.cyl(.032, .026, .09, 12), '#eafaff', .32, .277, .17); add(G.cyl(.028, .024, .06, 12), '#9fe07a', .32, .27, .17); tube([.33, .29, .17], [.36, .36, .16], .004, '#ff8fa8', 4);
    // the little wooden chair
    add(G.box(.4, .04, .34, .012), WOODL, 0, .3, .12);
    add(G.box(.4, .3, .035, .012), WOOD, 0, .48, -.03, -.12, 0, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.022, .022, .3, 6), WOODD, sx * .17, .15, .12 + sz * .14);
    add(G.box(.32, .03, .26, .012), '#ffc6d6', 0, .335, .12);
  }));
  f.spot('on', null, 0, .35, .12, { maxH: .3, label: '우산 의자 위', scale: .75 });
  f.spot('under', null, 0, 0, .12, { maxH: .22, label: '우산 의자 밑', scale: .7 });
};

// ── 개굴이 간판 (정본 '낚시터 간판' 자리): 작은 박공 지붕 아래 개굴이 얼굴과 빗방울을 그린 판 ──────────────────────────────────
const frogSignTex = () => paintTex('s3c-sign', 512, 272, (c, w, h) => {
  c.fillStyle = '#fff6e4'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#7fcf6a'; c.beginPath(); c.ellipse(256, 160, 120, 86, 0, 0, PI * 2); c.fill();
  for (const sx of [-1, 1]) { c.beginPath(); c.arc(256 + sx * 66, 86, 44, 0, PI * 2); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(256 + sx * 66, 86, 28, 0, PI * 2); c.fill(); c.fillStyle = '#2a1d33'; c.beginPath(); c.arc(256 + sx * 66 + 4, 88, 14, 0, PI * 2); c.fill(); c.fillStyle = '#7fcf6a'; }
  c.fillStyle = '#ffb3c6'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(256 + sx * 82, 176, 20, 12, 0, 0, PI * 2); c.fill(); }
  c.strokeStyle = '#2a1d33'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.arc(256, 160, 40, .35, PI - .35); c.stroke();
  c.fillStyle = '#7fc6ef'; for (const [x, y, s] of [[70, 70, 1], [440, 60, .8], [410, 190, 1.1], [90, 200, .9]]) { c.beginPath(); c.moveTo(x, y - 22 * s); c.quadraticCurveTo(x + 16 * s, y, x, y + 10 * s); c.quadraticCurveTo(x - 16 * s, y, x, y - 22 * s); c.fill(); }
});
B.s3c_sign = f => {
  f.add(mc('s3c-sign-frame', ({ add }) => {
    for (const sx of [-1, 1]) { add(G.box(.07, .98, .07, .02), WOODD, sx * .34, .49, -.05); add(G.cyl(.05, .06, .04, 10), shade(WOODD, -.1), sx * .34, .02, -.05); }
    add(G.box(.9, .5, .05, .025), WOOD, 0, .78, -.03);
    add(G.box(.52, .03, .24, .01), '#5fb45e', -.23, 1.1, -.03, 0, 0, .42); add(G.box(.52, .03, .24, .01), '#5fb45e', .23, 1.1, -.03, 0, 0, -.42);
    add(G.sph(.04, 10, 8), '#ffb6cc', 0, 1.22, -.03);
    tuft(add, .3, .08, .9); tuft(add, -.36, .1, .8); daisy(add, .22, .14, .9, '#c9b6f6', '#fff2a0');
  }));
  // (29판 10/24 사용자 "오브젝트 디테일 알아서 좀 올려 줘"): a light wood frame round the painted board with brass nails, a little
  // wooden tag hanging under it with frog footprints, raindrops along the leaf roof's edge, a pot of water lilies at its foot
  f.add(mc('s3c-sign-more', ({ add, tube }) => {
    for (const [w, h2, x, y] of [[.86, .035, 0, 1.0], [.86, .035, 0, .56], [.035, .44, -.43, .78], [.035, .44, .43, .78]]) add(G.box(w, h2, .02, .008), WOODL, x, y, .004);
    for (const [x, y] of [[-.41, .98], [.41, .98], [-.41, .58], [.41, .58]]) add(G.sph(.011, 8, 6), '#e9b84a', x, y, .016);
    for (const sx of [-1, 1]) tube([sx * .1, .545, -.005], [sx * .1, .47, -.005], .004, '#efe0c0', 4);
    add(G.box(.3, .085, .02, .008), WOODL, 0, .43, -.005); add(G.box(.3, .012, .022, .004), shade(WOODL, -.08), 0, .39, -.005);
    for (const [x, y] of [[-.09, .43], [-.03, .44], [.03, .42], [.09, .435]]) { add(G.sph(.012, 8, 6), '#6cc06a', x, y, .008, 0, 0, 0, [1, 1, .4]); for (const d of [-1, 0, 1]) add(G.sph(.005, 6, 4), '#6cc06a', x + d * .009, y + .015, .008, 0, 0, 0, [1, 1, .4]); }
    for (const [x, d] of [[-.42, .08], [-.2, .02], [.12, .04], [.38, .06]]) add(G.sph(.016, 8, 6), '#dff6ff', x, 1.0 - Math.abs(x) * .25 - d, .1, 0, 0, 0, [.8, 1.4, .8]);
    add(G.cyl(.08, .065, .1, 14), '#9fd2f0', .48, .05, .12); add(G.tor(.08, .01, PI * 2, 4, 16), '#c9e6f6', .48, .1, .12, HP, 0, 0); add(G.cyl(.07, .07, .006, 14), '#8fe0e6', .48, .095, .12);
    add(G.cyl(.04, .04, .004, 14), '#6cc06a', .46, .1, .11); add(G.sph(.016, 10, 8), '#ffb6cc', .5, .11, .14);
  }));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(.82, .43), texMat(frogSignTex())); board.position.set(0, .78, -.003); f.add(board);
  f.spot('behind', null, 0, 0, -.25, { maxH: .3, label: '간판 뒤', scale: .7 });
  f.spot('on', null, 0, 1.04, -.02, { maxH: .2, label: '간판 위', scale: .55 });
};

// ── 여우비와 무지개 (숨김 자리 없음): 해 뜬 채 내리는 가늘고 밝은 빗줄기(한 메시, 매 순간 조금씩 떨어짐), 뒤쪽 하늘의 옅은 무지개,
// 물 위 연잎 무리·잠자리·나비 ───────────────────────────────────────────────────────────────────────────────────────
B.s3c_weather = f => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];   // (rain and rainbow are no obstacle: their box held every lid and the waterwheel's bucket at a third — 10/24)
  // the sunshower (shared with A — s3-kit.js rainFall): a ring where a drop lands on the pond
  const rain = rainFall(f, { wet: (x, z) => !inIsland(x, z, .45) && Math.hypot(x, z) < 8, ringY: W + .006 });
  // the rainbow behind the island (10/24 사용자 "무지개를 더 크게, 섬에 더 가깝게, 아래 경계를 지우고 살짝 그라데이션"): one soft
  // painted arc — the colours melt into each other, its feet fade into the pond instead of ending on a hard line
  const bowTex = paintTex('s3c-bow', 512, 272, (c, w, h) => {
    const cx = w / 2, cy = h, R1 = 250, R0 = 182, g = c.createRadialGradient(cx, cy, R0, cx, cy, R1);
    [[0, 'rgba(196,178,242,0)'], [.1, 'rgba(196,178,242,.85)'], [.26, 'rgba(159,210,246,.9)'], [.42, 'rgba(168,230,160,.9)'], [.58, 'rgba(255,240,154,.92)'], [.74, 'rgba(255,201,138,.9)'], [.9, 'rgba(255,154,154,.85)'], [1, 'rgba(255,154,154,0)']].forEach(([t, col]) => g.addColorStop(t, col));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'destination-in';
    const f2 = c.createLinearGradient(0, 0, 0, h); f2.addColorStop(0, 'rgba(0,0,0,1)'); f2.addColorStop(.45, 'rgba(0,0,0,1)'); f2.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = f2; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over';
  });
  bowTex.wrapS = bowTex.wrapT = THREE.ClampToEdgeWrapping;
  const BOW = .62, BR = 4.6, bm = new THREE.Mesh(new THREE.PlaneGeometry(BR * 2 * 512 / 500, BR * 272 / 250), new THREE.MeshBasicMaterial({ map: bowTex, transparent: true, opacity: BOW, depthWrite: false, fog: false }));
  { const u = -5.6, v = -.9; bm.position.set((u + v) * SQ, BR * 272 / 250 / 2 - .55, (u - v) * SQ); }
  bm.rotation.y = PI / 4; scenery(bm); bm.renderOrder = -1; f.add(bm);
  const bows = [bm];
  // (29판 흑백 10/24, 허브 "처음엔 색이 빠진 연못 집 + 여우비, 찾을수록 색이 돌아오고 마지막에 비가 그치며 무지개"): stage.js calls
  // onGray at a grey stage's start and onColor once all the colour is back (colorBloom)
  let bowK = null;
  f.onGray = () => { for (const b of bows) b.visible = false; };
  f.onColor = () => { rain.stop(); bowK = 0; for (const b of bows) { b.visible = true; b.material.opacity = 0; } };
  const prevW = f.weather; f.weather = t => { prevW?.(t); if (bowK != null && bowK < 1) { bowK = Math.min(1, bowK + 1 / 45); for (const b of bows) b.material.opacity = BOW * bowK; } };
  const life = mc('s3c-life', ({ add }) => {
    for (const [x0, z0, nn, s] of [[-4.3, -1.6, 4, 1], [4.2, -2.4, 3, .9], [2.4, 4.0, 3, .85], [-3.6, 2.8, 3, .9]]) { const [x, z] = stretchC([x0, z0]); for (let k = 0; k < nn; k++) { const a = k * 2.3 + x; lily(add, x + Math.cos(a) * .3 * s, z + Math.sin(a) * .25 * s, (.13 + (k % 3) * .04) * s, a, W); if (k === 1) lotus2(add, x + Math.cos(a) * .3 * s, z + Math.sin(a) * .25 * s, .75); } }
    { const [x, z] = stretchC([1.2, 3.4]); dragonfly(add, x, .9, z, .4, '#7fb8e8'); } { const [x, z] = stretchC([-2.4, 1.2]); butterfly(add, x, .8, z, '#ffd3e4', .5, .85); }
  });
  f.add(scenery(life));
};

export const S3C_BUILDERS = B;
export const S3C_INFO = {
  s3c_island: { w: 1, d: 1, name: '연못 섬', price: 0, hidden: true },
  s3c_weather: { w: 1, d: 1, name: '여우비', price: 0, hidden: true },
  // (29판 흑백: 찾을 가구 목록에 쓰는 이름 — 조각 종류는 정본 이름 그대로, 그림·이름만 이 판 것)
  s3c_house: { w: 2, d: 1, name: '개굴이 집', price: 0, hidden: true }, s3c_wheel: { w: 2, d: 1, name: '물레방아', price: 0, hidden: true },
  s3c_lilysteps: { w: 3, d: 3, name: '연잎 징검다리', price: 0, hidden: true }, s3c_umbrella: { w: 1, d: 1, name: '노란 우산 의자', price: 0, hidden: true },
  s3c_sign: { w: 1, d: 1, name: '개굴이 간판', price: 0, hidden: true },
};

// 하얀 동네 배경 키트 (⑦ 10/23, 허브 — 사용자 26판 메모 "2층집 외 배경은 하얀 느낌의 단순한 동네(자리만 잡혀 있게)"; ①·⑧도 같이 씀).
// 판과 상관없는 배경: 놀이 구역 둘레에 흰 덩어리 집(2층 박공·단층·3층 빌라)·길(연석·점선·횡단보도)·흰 나무를 '자리만' 깔아요.
// 색은 흰색 몇 단과 아주 옅은 회색뿐이고, 모양은 잉크선이 그려 줘요(먼 줄은 잉크 없이 하늘색으로 흐려짐). 집어지지도, 숨김 자리도 아니에요.
//
// 쓰는 법 (둘 중 하나)
//   1) 그룹으로: import { whiteTown } from './gfx/whitetown-kit.js';  scene.add(whiteTown({ clear: [-5, -3.5, 5, 3.5] }));
//   2) 판 배치의 가구 한 조각으로: registerFurniture(WHITETOWN_BUILDERS, WHITETOWN_INFO) 한 번 하고,
//      layout.furniture에 { type: 'whitetown', x: 0, z: 0, a: 0, opts: { clear, at: [그 방의 at x, z], … } }
//      (at을 주면 좌표가 지도 기준 — 여러 방 맵에서 어느 방에 넣어도 같은 자리)
// opts (전부 지도 좌표, m)
//   clear: [x0, z0, x1, z1]  놀이 구역 — 이 안엔 아무것도 안 둠 (기본 [-5, -3.5, 5, 3.5])
//   gap: 3.4                  뒤쪽 첫 줄 집까지 거리 (놀이 구역 가장자리에서)
//   open: ['S', 'E']          카메라 쪽 변: 가까이엔 길과 낮은 것만, 집은 far 밖에 (시작 카메라는 +x +z 쪽)
//   far: 9                    카메라 쪽 집까지 거리
//   roads: true | false | [{ x0, z0, x1, z1, zebra: [x 또는 z …] }]   true = 열린 변을 따라 큰길 하나씩 (보도 1.1 + 차도 2.4)
//   rows: 2                   둘레 집 줄 수 (가까운 줄 + 먼 줄, 먼 줄은 잉크 없이 흐리게)
//   roadLen: 8               길이 놀이 구역 밖으로 뻗는 길이 (14 m만 돼도 돌린 시점에서 연석 끝이 카메라 가까이 와 흰 줄로 그려졌음)
//   haze: [10, 24]            가운데서 이 거리 사이에 하늘색으로 흐려짐
//   trees: true, seed: 1, ground: true (멀리 하늘색으로 녹는 바닥판 — 판에 이미 바닥 룩이 있으면 false)
//   sky: '#f5f6f6'            먼 것이 녹아드는 색 (판 하늘 가운데 색)
//   nearKinds / farKinds      줄마다 집 종류 순서 ('a' 2층 박공 · 'b' 단층 · 'c' 3층 빌라)
//   fold: true                카메라가 넘어간 변의 집·나무·랜드마크는 땅으로 접혀 사라짐(방 벽처럼) — 그룹으로 쓸 땐 매 프레임 foldTown(g, world.yaw, dt)
//   palette: { w0, w1, w2, w3, win, road, curb, walk } 흰색 단계 바꾸기
//   landmarks: [{ build: () => THREE.Object3D 또는 가구 키 문자열, x, z, s = 1, ry = 0, theme }]
//              멀리 작게 보이는 다음 판 건물 같은 것 — 그대로 세움(색 유지), 집지 못하게만 막음
//   skip: [[x, z, r] …]       이 원 안엔 집·나무를 안 둠 (랜드마크 자리 비우기 등)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { geo, mat, mesh, STYLE } from './kit.js';
import { makeFurniture } from './furniture.js';

const PI = Math.PI, HP = PI / 2;
// (판 빛(해 2.5 + 주변 1.3)을 받으면 한 단 밝아져요: 칠은 살짝 차가운 연회색으로 해야 화면에서 누렇지 않은 흰색)
export const WHITE_PAL = { w0: '#eceef1', w1: '#e2e5e9', w2: '#d6d9de', w3: '#c9cdd3', win: '#d3dbe6', road: '#d5d7dd', road2: '#cacdd4', curb: '#eceef1', walk: '#e4e6ea', line: '#f6f7f8', ground: '#e6e8eb' };
const NO_PICK = () => {};
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const tint = c => new THREE.Color(STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(c) : c);
const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

const VM = new Map();
const vmat = () => { if (!VM.has(STYLE.mode)) { const m = mat('#ffffff', { rim: 0 }).clone(); m.vertexColors = true; m.name = 'whitetown'; VM.set(STYLE.mode, m); } return VM.get(STYLE.mode); };
function scenery(m, ink) {
  m.castShadow = false; m.receiveShadow = false; m.raycast = NO_PICK;
  m.userData.scenery = true; m.userData.noOcclude = true; m.userData.noMerge = true;
  if (!ink) m.layers.set(2);
  return m;
}

// a geometry builder: pieces in one house's own frame, put down by that house's matrix, coloured per vertex (hazed by distance)
// (and every vertex goes toward the sky colour with its distance from the middle: far roads and houses melt into the backdrop)
function builder(sky, far = [10, 24]) {
  const list = [], fade = tint(sky), M = new THREE.Matrix4(), L = new THREE.Matrix4(), cv = new THREE.Color();
  let base = new THREE.Matrix4(), haze = 0;
  const addM = (src, m, color) => {
    const g = src.index ? src.toNonIndexed() : src.clone(); src.dispose();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.applyMatrix4(M.multiplyMatrices(base, m));
    const c = tint(color), p = g.attributes.position, n = p.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { cv.copy(c).lerp(fade, Math.max(haze, .85 * smooth(far[0], far[1], Math.hypot(p.getX(i), p.getZ(i))))); a[i * 3] = cv.r; a[i * 3 + 1] = cv.g; a[i * 3 + 2] = cv.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); list.push(g);
  };
  const add = (src, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => addM(src, L.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1)), color);
  const box = (w, h, d, color, x, y, z, rx, ry, rz) => add(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz);
  return {
    add, box, list,
    at(x, z, ry = 0, h = 0, s = 1) { base = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s)); haze = h; },
    done() { const out = list.length ? mergeGeometries(list, false) : new THREE.BufferGeometry(); list.forEach(g => g.dispose()); out.computeBoundingSphere(); return out; },
  };
}
const prism = (w, h, d) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g; };

// ── 집 셋 (앞이 +z) ── a: 2층 박공집 · b: 단층 넓은 집(앞 낮은 담) · c: 3층 빌라(평지붕·물탱크·난간)
export const WHITE_HOUSES = {
  a: { w: 3.4, d: 2.8, h: 2.7, roof: 1.15, floors: 2, door: .65, chimney: true },
  b: { w: 4.2, d: 2.6, h: 1.75, roof: .95, floors: 1, door: -.9, wall: true },
  c: { w: 3.8, d: 3.0, h: 4.2, roof: 0, floors: 3, door: 0, flat: true, balcony: true },
};
function house(B, P, k, far) {
  const o = WHITE_HOUSES[k], { w, d, h } = o;
  B.box(w + .1, .18, d + .1, P.w2, 0, .09, 0);
  B.box(w - .04, h, d - .04, P.w0, 0, .18 + h / 2, 0);
  if (o.flat) {
    B.box(w + .1, .14, d + .1, P.w1, 0, .18 + h + .07, 0);
    B.box(w - .3, .12, d - .3, P.w2, 0, .18 + h + .2, 0);
    if (!far) B.add(new THREE.CylinderGeometry(.32, .32, .5, 12), P.w1, w / 2 - .6, .18 + h + .45, -d / 2 + .6);
  } else {
    const slope = Math.atan2(o.roof, w / 2), L = Math.hypot(w / 2, o.roof) + .22;
    for (const sx of [-1, 1]) B.box(L, .1, d + .3, P.w2, sx * w / 4, .18 + h + o.roof / 2 + .02, 0, 0, 0, -sx * slope);
    B.add(prism(w - .04, o.roof, d - .06), P.w0, 0, .18 + h, 0);
    if (o.chimney) B.box(.32, .7, .32, P.w1, w / 4, .18 + h + o.roof * .6, -d / 6);
  }
  if (far) return;
  const fh = h / o.floors;
  for (let f = 0; f < o.floors; f++) for (const u of [-.3, .3]) {
    const x = u * w, y = .18 + fh * (f + .55);
    if (f === 0 && Math.abs(x - o.door) < .5) continue;
    B.box(.62, .56, .04, P.w1, x, y, d / 2 - .005);
    B.box(.5, .44, .03, P.win, x, y, d / 2 + .01);
    B.box(.62, .05, .1, P.w1, x, y - .3, d / 2 + .03);
    if (o.balcony && f > 0) B.box(.9, .32, .3, P.w1, x, y - .32, d / 2 + .15);
  }
  for (const sx of [-1, 1]) B.box(.04, .5, .5, P.win, sx * (w / 2 - .005), .18 + fh * .55, 0);
  B.box(.58, 1.0, .05, P.w2, o.door, .68, d / 2);
  B.box(.76, .06, .32, P.w1, o.door, 1.3, d / 2 + .14);
  B.box(.7, .1, .36, P.w2, o.door, .05, d / 2 + .22);
  if (o.wall) for (const [a, b] of [[-w / 2, o.door - .45], [o.door + .45, w / 2]]) B.box(b - a, .42, .14, P.w1, (a + b) / 2, .21, d / 2 + .9);
}
function tree(B, P, s = 1) {
  B.add(new THREE.CylinderGeometry(.09 * s, .12 * s, 1.1 * s, 8), P.w3, 0, .55 * s, 0);
  B.add(new THREE.SphereGeometry(.62 * s, 12, 9), P.w1, 0, 1.55 * s, 0);
  B.add(new THREE.SphereGeometry(.45 * s, 10, 8), P.w0, .32 * s, 1.85 * s, .1 * s);
  B.add(new THREE.SphereGeometry(.4 * s, 10, 8), P.w1, -.3 * s, 1.8 * s, -.12 * s);
}

// roads: a strip of asphalt with a dashed middle line, kerbs on both sides, a zebra crossing or two
function road(B, P, r) {
  const alongX = (r.x1 - r.x0) >= (r.z1 - r.z0), L = alongX ? r.x1 - r.x0 : r.z1 - r.z0, W = alongX ? r.z1 - r.z0 : r.x1 - r.x0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  const ry = alongX ? 0 : HP;
  B.at(cx, cz, ry);
  B.box(L, .012, W, P.road, 0, -.004, 0);
  for (let u = -L / 2 + .6; u < L / 2 - .6; u += 1.4) if (!(r.zebra || []).some(q => Math.abs((alongX ? q - cx : -(q - cz)) - u) < 1.6)) B.box(.7, .014, .07, P.line, u, -.002, 0);
  // kerbs, left open where another road joins (r.cut: { near: [[a, b]…], farSide: […] } in world units along the road; near = the -z / -x side)
  const toU = q => alongX ? q - cx : -(q - cz);
  for (const s of [-1, 1]) {
    const cuts = ((s < 0 ? r.cut?.near : r.cut?.farSide) || []).map(([a, b]) => [toU(a), toU(b)].sort((p, q) => p - q)).sort((p, q) => p[0] - q[0]);
    let u = -L / 2;
    for (const [a, b] of [...cuts, [L / 2, L / 2]]) { if (a - u > .05) B.box(a - u, .1, .14, P.curb, (u + a) / 2, .05, s * (W / 2 + .07)); u = Math.max(u, b); }
  }
  for (const q of r.zebra || []) { const u = alongX ? q - cx : -(q - cz); for (let k = 0; k < 6; k++) B.box(.22, .015, W - .3, P.line, u - 1 + k * .4, -.001, 0); }
}

export function whiteTown(opts = {}) {
  const o = { clear: [-5, -3.5, 5, 3.5], gap: 3.4, open: ['S', 'E'], far: 9, roads: true, rows: 2, trees: true, seed: 1, ground: true, sky: '#f5f6f6', landmarks: [], skip: [], fold: true, roadLen: 8, haze: [10, 24],
    nearKinds: ['a', 'b', 'a', 'b', 'b'], farKinds: ['a', 'c', 'b', 'a', 'c'], ...opts };
  const P = { ...WHITE_PAL, ...(o.palette || {}) }, [x0, z0, x1, z1] = o.clear, r = rng(o.seed * 9301 + 7);
  const open = new Set(o.open), g = new THREE.Group(); g.name = 'whitetown'; g.userData.scenery = true;
  const placed = [];
  const free = (x, z, rad) => !o.skip.some(([sx, sz, sr]) => Math.hypot(x - sx, z - sz) < sr + rad) && !(x > x0 - rad && x < x1 + rad && z > z0 - rad && z < z1 + rad)
    && !placed.some(([px, pz, pr]) => Math.hypot(x - px, z - pz) < pr + rad);
  // which side of the play area a point is on (a side folds as one when the camera is over it, like a room's wall)
  const sideOf = (x, z) => { const ox = Math.max(x0 - x, x - x1), oz = Math.max(z0 - z, z - z1); return oz >= ox ? (z < (z0 + z1) / 2 ? 'N' : 'S') : (x < (x0 + x1) / 2 ? 'W' : 'E'); };
  const SIDES = ['N', 'W', 'S', 'E'], near = {}, farB = {};
  for (const k of SIDES) { near[k] = builder(o.sky, o.haze); farB[k] = builder(o.sky, o.haze); }
  const flat = builder(o.sky, [o.haze[0] - 2, o.haze[0] + o.roadLen]);
  // roads (low: they never fold) — 8 m past the play area: further, a road's kerbs came round near the camera when the view
  // turned and drew as long white streaks up the screen (14 m still did); their ends melt into the backdrop (haze below)
  const R = o.roadLen;
  const roads = o.roads === true ? [
    ...(open.has('S') ? [{ x0: x0 - R, x1: x1 + R, z0: z1 + 1.1, z1: z1 + 3.5, zebra: [(x0 + x1) / 2 + 2], cut: open.has('E') ? { near: [[x1 + 1.1, x1 + 3.5]] } : null }] : []),
    ...(open.has('E') ? [{ x0: x1 + 1.1, x1: x1 + 3.5, z0: z0 - R, z1: z1 + 1.1, zebra: [z1 - .6] }] : []),
    ...(open.has('N') ? [{ x0: x0 - R, x1: x1 + R, z0: z0 - 3.5, z1: z0 - 1.1 }] : []),
    ...(open.has('W') ? [{ x0: x0 - 3.5, x1: x0 - 1.1, z0: z0 - R, z1: z1 + 1.1 }] : []),
  ] : o.roads || [];
  for (const rd of roads) road(flat, P, rd);
  // sidewalk joints along the open sides (faint lines on the ground between the lot and the road)
  flat.at(0, 0);
  if (open.has('S')) for (let x = x0 - o.roadLen; x < x1 + 1; x += .8) flat.box(.012, .006, 1.0, P.w2, x, .001, z1 + .55);
  if (open.has('E')) for (let z = z0 - o.roadLen; z < z1 + .5; z += .8) flat.box(.9, .006, .012, P.w2, x1 + .55, .001, z);
  // houses round the play area: the near row on the closed sides (gap), on the open sides past the roads (far); the far row
  // a block further out, hazed toward the sky and without windows
  for (let row = 0; row < o.rows; row++) {
    const extra = row * 6.5, isFar = row > 0, kinds = isFar ? o.farKinds : o.nearKinds;
    for (const side of SIDES) {
      const B = (isFar ? farB : near)[side];
      const dist = (open.has(side) ? o.far : o.gap) + extra, alongX = side === 'N' || side === 'S';
      const a0 = (alongX ? x0 : z0) - 3 - extra * .6, a1 = (alongX ? x1 : z1) + 3 + extra * .6;
      let u = a0 + r() * 1.2, n = 0;
      while (u < a1) {
        const k = kinds[(n + row + side.charCodeAt(0)) % kinds.length], H = WHITE_HOUSES[k], wd = H.w, dp = H.d;
        const off = dist + dp / 2 + (k === 'b' ? .9 : 0);
        const x = alongX ? u + wd / 2 : side === 'W' ? x0 - off : x1 + off;
        const z = alongX ? (side === 'N' ? z0 - off : z1 + off) : u + wd / 2;
        const ry = side === 'N' ? 0 : side === 'S' ? PI : side === 'W' ? HP : -HP;
        if (free(x, z, Math.max(wd, dp) / 2)) { B.at(x, z, ry, isFar ? .55 : 0); house(B, P, k, isFar); placed.push([x, z, Math.max(wd, dp) / 2]); }
        u += wd + 1.0 + r() * 1.4;
        if (o.trees && u < a1) { const tx = alongX ? u - .6 : side === 'W' ? x0 - dist - 1.2 : x1 + dist + 1.2, tz = alongX ? (side === 'N' ? z0 - dist - 1.2 : z1 + dist + 1.2) : u - .6;
          if (free(tx, tz, .7) && r() < .8) { B.at(tx, tz, 0, isFar ? .55 : 0, .8 + r() * .35); tree(B, P); placed.push([tx, tz, .6]); } }
        n++;
      }
    }
  }
  // street trees on the far sidewalks of the open roads
  if (o.trees) for (const rd of roads) {
    const alongX = (rd.x1 - rd.x0) >= (rd.z1 - rd.z0);
    for (let k = 0; k < 4; k++) {
      const t = (k + .5) / 4, x = alongX ? rd.x0 + 2 + (rd.x1 - rd.x0 - 4) * t : rd.x1 + .55, z = alongX ? rd.z1 + .55 : rd.z0 + 2 + (rd.z1 - rd.z0 - 4) * t;
      if (free(x, z, .7)) { const B = near[sideOf(x, z)]; B.at(x, z, 0, 0, .8); tree(B, P); placed.push([x, z, .6]); }
    }
  }
  const put = (B, name, ink, parent = g) => { const m = scenery(mesh(B.done(), vmat(), { cast: false, recv: false }), ink); m.name = name; parent.add(m); return m; };
  put(flat, 'whitetown-roads', true);
  const sides = {};
  for (const k of SIDES) { const sg = sides[k] = new THREE.Group(); sg.name = 'whitetown-' + k; g.add(sg); put(near[k], 'whitetown-near-' + k, true, sg); put(farB[k], 'whitetown-far-' + k, false, sg); }
  if (o.ground) g.add(groundPlane(P.ground, o.sky));
  // landmarks: whatever the stage hands in (the next stage's building, small and far), left as they are but never picked;
  // they fold with the side they stand on
  for (const L of o.landmarks) {
    const obj = typeof L.build === 'function' ? L.build() : makeFurniture(L.build, L.theme || {}).group;
    obj.position.set(L.x || 0, L.y || 0, L.z || 0); obj.rotation.y = L.ry || 0; if (L.s) obj.scale.setScalar(L.s);
    obj.traverse(m => { if (m.isMesh) { m.raycast = NO_PICK; m.castShadow = false; m.userData.scenery = true; m.userData.noOcclude = true; m.userData.keep = true; } });
    obj.userData.scenery = true; sides[sideOf(L.x || 0, L.z || 0)].add(obj);
  }
  if (o.at) g.position.set(-o.at[0], 0, -o.at[1]);
  g.userData.sides = sides; g.userData.fold = o.fold;
  return g;
}
// fold the side the camera is over away (it sinks into the ground and goes, like a room's near walls fold) — call every
// frame with the camera's yaw (world.yaw); the furniture piece below does it through f.updateView. Returns true while moving.
const NRM = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
export function foldTown(g, yaw, dt = 1, snap = false) {
  if (!g?.userData.sides || g.userData.fold === false) return false;
  const q = new THREE.Quaternion(); g.getWorldQuaternion(q);
  const c = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), n = new THREE.Vector3(); let moving = false;
  for (const [k, sg] of Object.entries(g.userData.sides)) {
    n.set(NRM[k][0], 0, NRM[k][1]).applyQuaternion(q);
    // (squashed flat, a side's roofs and tree crowns drew as outlined blobs on the ground: it shrinks away and is hidden instead)
    const want = n.dot(c) > .18 ? 0 : 1, cur = sg.userData.k ?? 1;
    let nx = cur + (want - cur) * (1 - Math.exp(-dt * 10)); if (Math.abs(nx - want) < .003) nx = want;
    if (snap) { sg.userData.k = want; sg.visible = want > 0; continue; }
    if (nx !== cur) { sg.userData.k = nx; sg.scale.y = Math.max(.001, nx); sg.visible = nx > .04; moving = true; }
  }
  return moving;
}

// a ground running on to the horizon: the near colour fading to the sky (vertex alpha), under everything, no ink
const GM = new Map();
function groundPlane(near, sky) {
  const gg = geo('whitetown-ground|' + STYLE.mode + '|' + near + '|' + sky, () => {
    const p0 = new THREE.PlaneGeometry(80, 80, 24, 24); p0.rotateX(-HP); p0.translate(0, -.03, 0);
    const p = p0.attributes.position, col = new Float32Array(p.count * 3), al = new Float32Array(p.count), a = tint(near), b = tint(sky), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), rr = Math.hypot(x, z); c.copy(a).lerp(b, smooth(8, 30, rr)); col.set([c.r, c.g, c.b], i * 3); al[i] = 1 - smooth(26, 38, Math.max(Math.abs(x), Math.abs(z))); }
    p0.setAttribute('color', new THREE.BufferAttribute(col, 3)); p0.setAttribute('wtAlpha', new THREE.BufferAttribute(al, 1));
    return p0;
  });
  if (!GM.has(STYLE.mode)) {
    const m = mat('#ffffff', { rim: 0 }).clone(); m.vertexColors = true; m.transparent = true; m.depthWrite = false; m.name = 'whitetown-ground';
    m.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float wtAlpha; varying float vWtAlpha;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWtAlpha = wtAlpha;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vWtAlpha;').replace('#include <opaque_fragment>', 'diffuseColor.a *= vWtAlpha;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'whitetown-ground-' + STYLE.mode;
    GM.set(STYLE.mode, m);
  }
  const m = scenery(mesh(gg, GM.get(STYLE.mode), { cast: false, recv: false }), false); m.renderOrder = -2; m.name = 'whitetown-ground';
  return m;
}

// as one scenery piece in a stage layout (see the top): the furniture system never treats it as solid, a hiding place or a pick
export const WHITETOWN_BUILDERS = {
  whitetown: (f, T, opts = {}) => {
    f.group.name = 'whitetown'; f.group.userData.scenery = true;
    f.collideBox = [-.001, -.2, -.001, .001, -.15, .001]; f.noOccupied = true; f.noSolid = true;
    const town = whiteTown(opts || {}); f.add(town);
    // the side the camera is over folds down (the room calls updateView every frame)
    f.updateView = (wd, dt) => { if (foldTown(town, wd.yaw, dt)) wd.shadowDirty = true; };
    // the start camera's sides go at once — hidden only, scale left at 1: the piece is baked after this (bakeStatic), and a side
    // squashed then came back stretched a thousandfold when the view turned (tall white streaks)
    foldTown(town, Math.PI / 4, 1, true);
  },
};
export const WHITETOWN_INFO = { whitetown: { w: 1, d: 1, name: '하얀 동네', price: 0, hidden: true } };

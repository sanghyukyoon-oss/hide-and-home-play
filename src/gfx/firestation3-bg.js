// 19판 곰돌이네 119 안전센터 둘레 (① 10/24, 사용자 19판 메모 "배경 뒤쪽에 집 목업? 지우라 그냥. 배경 뭔가 소방서랑 잘 어울리는 배경으로"):
// 흰 집·먼 빌라 없이 소방서 마당다운 둘레 — 섬 밑동 높이(y -.86)의 땅에 깔아 섬이 그 위에 솟은 블록으로 보이게.
//   뒤(N)  호스 건조대(트레슬에 걸린 납작 호스 다섯 줄·호스 수레), 훈련 마당(노란 주차선), 둥근 나무
//   왼(W)  훈련탑(빨강·크림 줄 4층, 창 구멍, 3층 발코니, 바깥 사다리, 옥상 난간·구조 로프 팔·경광등), 그 앞 훈련 소화전 줄(관으로 이어진 셋), 나무
//   오른(E) 119 깃대(삼각기), 나무 · 앞(S) 길 건너 보도의 둥근 나무
//   바닥   길(앞 큰길·오른쪽 옆길, 연석·점선·횡단보도 — 차고 출구 앞 횡단보도는 '소방차 출동로' 빨간 칠), 보도 줄눈,
//          연한 잔디 땅이 멀리 하늘색으로 녹음(꼭짓점 색), 먼 끝은 투명하게 사라짐
// 카메라 쪽 변(N·W·S·E 중 카메라가 넘어간 변)의 높은 것은 땅으로 접혀 사라짐(하얀 동네 키트의 foldTown) — 길·바닥은 늘 남음.
// 색은 순하게(큰 면은 옅은 빨강·크림·연회색), 거리에 따라 하늘색(#cbe7f6)으로 흐려짐. 집어지지도, 숨김 자리도 아님.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { geo, mat, mesh, STYLE } from './kit.js';
import { HG as G } from './house-props.js';
import { foldTown } from './whitetown-kit.js';

// (far things: plain boxes — rounded corners don't show at this distance and cost triangles)
const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d);

const PI = Math.PI, HP = PI / 2;
const NO_PICK = () => {};
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const tint = c => new THREE.Color(STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(c) : c);
const Q = {
  red: '#e2796c', redD: '#c9645a', cream: '#f7f0e4', creamD: '#e9dfcf', conc: '#e4e2dc', concD: '#d3d0c8', steel: '#c3cad3', steelD: '#9ea7b2',
  win: '#7d8ca3', winD: '#66758c', hose: '#f3e7cf', hoseD: '#e3d2b2', brass: '#e2bd6a', hyd: '#e2685c', hydD: '#c4544a', yellow: '#f2cf62',
  road: '#cfd3d9', roadL: '#f4f6f7', kerb: '#eef0f2', walk: '#e6e1da', walkJ: '#d6d0c7', ground: '#e2e9d9', lawn: '#cfe0bd', yard: '#e7e5df',
  leaf: '#a8cf8a', leafD: '#8dbd75', trunk: '#b99674', navy: '#7488a8',
};
const VM = new Map();
const vmat = () => { if (!VM.has(STYLE.mode)) { const m = mat('#ffffff', { rim: 0 }).clone(); m.vertexColors = true; m.name = 'fs3bg'; VM.set(STYLE.mode, m); } return VM.get(STYLE.mode); };
function scenery(m, ink) {
  m.castShadow = false; m.receiveShadow = false; m.raycast = NO_PICK;
  m.userData.scenery = true; m.userData.noOcclude = true; m.userData.noMerge = true;
  if (!ink) m.layers.set(2);
  return m;
}
// one merged, vertex-coloured mesh: pieces put down by a base matrix (at), each vertex hazed toward the sky by its distance
function builder(sky, far) {
  const list = [], fade = tint(sky), M = new THREE.Matrix4(), cv = new THREE.Color();
  let base = new THREE.Matrix4(), haze = 0;
  const addM = (src, m, color) => {
    const g = src.index ? src.toNonIndexed() : src.clone(); src.dispose();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    g.applyMatrix4(M.multiplyMatrices(base, m));
    const c = tint(color), p = g.attributes.position, n = p.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { cv.copy(c).lerp(fade, Math.max(haze, .88 * smooth(far[0], far[1], Math.hypot(p.getX(i), p.getZ(i))))); a[i * 3] = cv.r; a[i * 3 + 1] = cv.g; a[i * 3 + 2] = cv.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); list.push(g);
  };
  const xf = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s));
  const add = (src, color, x, y, z, rx, ry, rz, s) => addM(src, xf(x, y, z, rx, ry, rz, s), color);
  const tube = (a, b, r, color, seg = 6) => { const A = new THREE.Vector3(...a), B2 = new THREE.Vector3(...b), d = B2.clone().sub(A), L = d.length();
    addM(new THREE.CylinderGeometry(r, r, L, seg), new THREE.Matrix4().compose(A.clone().add(B2).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1)), color); };
  return {
    add, addM, tube, list,
    at(x, z, ry = 0, h = 0, s = 1) { base = xf(x, 0, z, 0, ry, 0, s); haze = h; },
    done() { const out = list.length ? mergeGeometries(list, false) : new THREE.BufferGeometry(); list.forEach(g => g.dispose()); out.computeBoundingSphere(); return out; },
  };
}

// ── 훈련탑: 2.4 m square, four 1.5 m storeys (a red band at each floor, cream above with a window hole), a third-floor balcony,
// a steel ladder up the side, a parapet and railing on the roof, a davit arm with the rescue rope hanging to the yard, a beacon
function tower(B) {
  const { add, tube } = B, W = 2.4, FL = 1.5, N = 4, H = FL * N, hw = W / 2;
  add(BOX(W + .5, .26, W + .5), Q.concD, 0, .13, 0);
  for (let f = 0; f < N; f++) {
    const y0 = .26 + f * FL;
    add(BOX(W + .04, .42, W + .04), Q.red, 0, y0 + .21, 0);
    add(BOX(W, FL - .42, W), Q.cream, 0, y0 + .42 + (FL - .42) / 2, 0);
    // a window opening on the front and on the side, white frames and a sill (the 4th floor's front is the beacon's door)
    for (const [ry, ox] of [[0, -.35], [HP, .3]]) {
      const c = Math.cos(ry), s = Math.sin(ry), px = (u, d) => [u * c + d * s, -u * s + d * c];
      const [wx, wz] = px(ox, hw + .005), [fx, fz] = px(ox, hw + .03), [sx, sz] = px(ox, hw + .07);
      add(G.pbox(.62, .66, .02), f === 2 && !ry ? Q.winD : Q.win, wx, y0 + .98, wz, 0, ry, 0);
      add(BOX(.74, .08, .06), Q.cream, fx, y0 + 1.35, fz, 0, ry, 0); add(BOX(.08, .74, .06), Q.cream, fx - .35 * c, y0 + .98, fz + .35 * s, 0, ry, 0);
      add(BOX(.08, .74, .06), Q.cream, fx + .35 * c, y0 + .98, fz - .35 * s, 0, ry, 0);
      add(BOX(.84, .07, .16), Q.creamD, sx, y0 + .62, sz, 0, ry, 0);
    }
  }
  // the third-floor balcony on the front: a slab and a red-topped railing
  const by = .26 + FL * 2;
  add(BOX(1.5, .1, .62), Q.concD, -.35, by + .05, hw + .31);
  add(BOX(1.54, .06, .06), Q.red, -.35, by + .92, hw + .6); for (const x of [-1.08, .38]) add(BOX(.06, .06, .62), Q.red, x, by + .92, hw + .31);
  for (let k = 0; k <= 7; k++) add(G.pbox(.03, .82, .03), Q.steel, -1.08 + k * .209, by + .51, hw + .6);
  for (const x of [-1.08, .38]) for (let k = 1; k < 3; k++) add(G.pbox(.03, .82, .03), Q.steel, x, by + .51, hw + .6 - k * .2);
  // roof: a parapet, a railing, the beacon, the davit arm and its rope down to a coil at the foot
  add(BOX(W + .12, .22, W + .12), Q.redD, 0, .26 + H + .11, 0);
  add(BOX(W - .3, .06, W - .3), Q.creamD, 0, .26 + H + .19, 0);
  for (const s of [-1, 1]) { tube([-hw + .08, .26 + H + .22, s * (hw - .08)], [hw - .08, .26 + H + .22, s * (hw - .08)], .025, Q.steelD); tube([s * (hw - .08), .26 + H + .22, -hw + .08], [s * (hw - .08), .26 + H + .22, hw - .08], .025, Q.steelD); }
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) tube([x * (hw - .08), .26 + H + .22, z * (hw - .08)], [x * (hw - .08), .26 + H + .8, z * (hw - .08)], .03, Q.steelD);
  for (const s of [-1, 1]) { tube([-hw + .08, .26 + H + .8, s * (hw - .08)], [hw - .08, .26 + H + .8, s * (hw - .08)], .03, Q.steel); tube([s * (hw - .08), .26 + H + .8, -hw + .08], [s * (hw - .08), .26 + H + .8, hw - .08], .03, Q.steel); }
  add(G.cyl(.16, .18, .12, 14), Q.steelD, -.6, .26 + H + .28, -.55); add(G.sph(.17, 14, 8), Q.red, -.6, .26 + H + .38, -.55, 0, 0, 0, [1, 1.1, 1]);
  const ay = .26 + H + .3; tube([.75, ay, .75], [.75, ay + 1.0, .75], .05, Q.steelD); tube([.75, ay + 1.0, .75], [1.45, ay + 1.0, 1.45], .045, Q.steelD); add(G.cyl(.08, .08, .07, 12), Q.yellow, 1.45, ay + .96, 1.45);
  tube([1.45, ay + .95, 1.45], [1.45, .5, 1.45], .018, Q.hoseD, 5);
  for (let k = 0; k < 3; k++) add(G.tor(.2 - k * .04, .035, PI * 2, 5, 16), Q.hoseD, 1.45, .3 + k * .06, 1.45, HP, 0, 0);
  // the ladder up the right side, with hoops from the second floor on
  const lx = hw + .12;
  for (const z of [-.25, .25]) tube([lx, .26, z], [lx, .26 + H + .9, z], .03, Q.steelD);
  for (let y = .5; y < .26 + H + .9; y += .32) tube([lx, y, -.25], [lx, y, .25], .02, Q.steel);
  for (let y = 2.3; y < .26 + H + .6; y += .7) add(G.tor(.32, .02, PI, 4, 14), Q.steelD, lx + .02, y, 0, 0, -HP, 0);
  // a 119 plate between the top windows
  add(BOX(.7, .32, .05), Q.red, .45, .26 + FL * 3 + .98, hw + .03); add(BOX(.58, .2, .02), Q.cream, .45, .26 + FL * 3 + .98, hw + .06);
  for (let k = 0; k < 3; k++) add(BOX(.05, .14, .02), Q.redD, .3 + k * .15, .26 + FL * 3 + .98, hw + .075);
}
// ── 호스 건조대: two steel trestles under a bar 2.3 m up, five flat hoses folded over it (couplings at the ends), a hose cart
function hoseRack(B) {
  const { add, tube } = B, L = 3.2, Y = 2.3;
  for (const x of [-L / 2, L / 2]) {
    for (const s of [-1, 1]) tube([x, 0, s * .55], [x, Y, 0], .045, Q.steelD, 8);
    add(BOX(.2, .06, 1.3), Q.steelD, x, .03, 0); tube([x, .8, -.36], [x, .8, .36], .025, Q.steel);
  }
  tube([-L / 2 - .1, Y, 0], [L / 2 + .1, Y, 0], .06, Q.steel, 10);
  for (let k = 0; k < 5; k++) {
    const x = -1.2 + k * .6, c = k % 2 ? Q.hose : '#eef2f5', dropF = 1.7 + (k % 3) * .2, dropB = 1.9 - (k % 2) * .25;
    add(BOX(.2, .05, .14), c, x, Y + .07, 0);
    add(BOX(.2, dropF, .04), c, x, Y - dropF / 2, .08); add(BOX(.2, dropB, .04), c, x, Y - dropB / 2, -.08);
    add(G.cyl(.06, .06, .12, 10), Q.brass, x, Y - dropF - .05, .08); add(G.cyl(.06, .06, .12, 10), Q.brass, x, Y - dropB - .05, -.08);
  }
  // the hose cart: two big wheels, a drum of rolled hose, a T handle
  const cx = L / 2 + 1.0;
  for (const s of [-1, 1]) { add(G.tor(.38, .05, PI * 2, 6, 20), '#7a7f8c', cx, .43, s * .45); add(G.cyl(.06, .06, .06, 10), Q.steelD, cx, .43, s * .45, HP, 0, 0); }
  add(G.cyl(.3, .3, .78, 18), Q.hose, cx, .43, 0, HP, 0, 0); for (const s of [-1, 1]) add(G.cyl(.36, .36, .04, 18), Q.red, cx, .43, s * .4, HP, 0, 0);
  tube([cx, .43, 0], [cx - .9, .85, 0], .03, Q.steelD); tube([cx - .9, .85, -.25], [cx - .9, .85, .25], .03, Q.steelD);
}
// ── 훈련 소화전 줄: four hydrants on pads joined by a low grey main, each with a coiled hose before it
function hydrantRow(B, n = 4) {
  const { add, tube } = B, gap = 1.25, x0 = -(n - 1) * gap / 2;
  tube([x0 - .3, .16, -.28], [-x0 + .3, .16, -.28], .07, Q.steelD, 10);
  for (let k = 0; k < n; k++) {
    const x = x0 + k * gap;
    add(BOX(.62, .05, .62), Q.concD, x, .025, 0);
    tube([x, .16, -.28], [x, .16, 0], .06, Q.steelD, 8);
    add(G.cyl(.16, .18, .08, 16), Q.hydD, x, .09, 0); add(G.cyl(.12, .13, .46, 16), Q.hyd, x, .36, 0);
    add(G.cyl(.15, .15, .05, 16), Q.hydD, x, .6, 0); add(G.sph(.13, 14, 8), Q.hyd, x, .63, 0, 0, 0, 0, [1, .7, 1]); add(G.cyl(.04, .05, .07, 6), Q.steelD, x, .73, 0);
    for (const s of [-1, 1]) add(G.cyl(.055, .055, .12, 10), Q.brass, x + s * .16, .42, 0, 0, 0, HP);
    if (k % 2 === 0) for (let j = 0; j < 3; j++) add(G.tor(.22 - j * .05, .045, PI * 2, 5, 16), Q.hose, x + .1, .05 + j * .02, .62, HP, 0, 0);
  }
}
function tree(B, s = 1, lean = 0) {
  const { add } = B;
  add(G.cyl(.08 * s, .12 * s, 1.1 * s, 8), Q.trunk, 0, .55 * s, 0, 0, 0, lean);
  for (const [x, y, z, r, c] of [[0, 1.55, 0, .62, Q.leaf], [.34, 1.8, .12, .44, Q.leafD], [-.3, 1.78, -.1, .42, Q.leaf], [.04, 2.1, -.06, .38, Q.leafD]]) add(G.sph(r * s, 12, 9), c, x * s, y * s, z * s);
}
function flagpole(B) {
  const { add, tube } = B;
  add(G.cyl(.32, .36, .18, 14), Q.concD, 0, .09, 0); tube([0, .18, 0], [0, 5.4, 0], .05, Q.steel, 10); add(G.sph(.08, 10, 8), Q.brass, 0, 5.45, 0);
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1.4, -.38); s.lineTo(0, -.76); s.lineTo(0, 0);
  add(G.ext(s, .02, 0, 1), Q.red, .05, 5.3, 0); add(BOX(.32, .2, .03), Q.cream, .38, 4.92, .01);
}
// a road: asphalt, a dashed middle, kerbs both sides, zebra crossings (red = the fire engines' way out)
function road(B, r) {
  const { add } = B, alongX = (r.x1 - r.x0) >= (r.z1 - r.z0), L = alongX ? r.x1 - r.x0 : r.z1 - r.z0, W = alongX ? r.z1 - r.z0 : r.x1 - r.x0;
  B.at((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, alongX ? 0 : HP);
  const cu = alongX ? (r.x0 + r.x1) / 2 : -(r.z0 + r.z1) / 2, toU = q => alongX ? q - cu : -q - cu;
  add(G.pbox(L, .012, W), Q.road, 0, -.004, 0);
  for (let u = -L / 2 + .6; u < L / 2 - .6; u += 1.4) if (!(r.zebra || []).some(z => Math.abs(toU(z[0]) - u) < 1.6)) add(G.pbox(.7, .014, .07), Q.roadL, u, -.002, 0);
  for (const s of [-1, 1]) {
    const cuts = (s < 0 ? r.cut || [] : []).map(([a, b]) => [toU(a), toU(b)].sort((p, q) => p - q));
    let u = -L / 2;
    for (const [a, b] of [...cuts, [L / 2, L / 2]]) { if (a - u > .05) add(G.pbox(a - u, .1, .14), Q.kerb, (u + a) / 2, .05, s * (W / 2 + .07)); u = Math.max(u, b); }
  }
  for (const [q, red] of r.zebra || []) {
    const u = toU(q);
    if (red) add(G.pbox(3.3, .013, W - .06), '#e9a397', u, -.003, 0);
    for (let w = -W / 2 + .34; w < W / 2 - .2; w += .62) add(G.pbox(2.8, .015, .32), Q.roadL, u, -.001, w);
  }
}
// the ground: lawn colour near, the sky's far away (vertex colours), fading out at the far edge (vertex alpha) — under everything
const GM = new Map();
function groundPlane(near, sky) {
  const gg = geo('fs3bg-ground|' + STYLE.mode + '|' + near + '|' + sky, () => {
    const p0 = new THREE.PlaneGeometry(84, 84, 28, 28); p0.rotateX(-HP); p0.translate(0, -.03, 0);
    const p = p0.attributes.position, col = new Float32Array(p.count * 3), al = new Float32Array(p.count), a = tint(near), b = tint(sky), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), rr = Math.hypot(x, z); c.copy(a).lerp(b, smooth(9, 30, rr)); col.set([c.r, c.g, c.b], i * 3); al[i] = 1 - smooth(27, 40, Math.max(Math.abs(x), Math.abs(z))); }
    p0.setAttribute('color', new THREE.BufferAttribute(col, 3)); p0.setAttribute('wtAlpha', new THREE.BufferAttribute(al, 1));
    return p0;
  });
  if (!GM.has(STYLE.mode)) {
    const m = mat('#ffffff', { rim: 0 }).clone(); m.vertexColors = true; m.transparent = true; m.depthWrite = false; m.name = 'fs3bg-ground';
    m.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float wtAlpha; varying float vWtAlpha;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWtAlpha = wtAlpha;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vWtAlpha;').replace('#include <opaque_fragment>', 'diffuseColor.a *= vWtAlpha;\n#include <opaque_fragment>');
    };
    m.customProgramCacheKey = () => 'fs3bg-ground-' + STYLE.mode;
    GM.set(STYLE.mode, m);
  }
  const m = scenery(mesh(gg, GM.get(STYLE.mode), { cast: false, recv: false }), false); m.renderOrder = -2; m.name = 'fs3bg-ground';
  return m;
}

// the whole surround (local = map metres, y 0 = the ground at the island's foot)
export function fireYard(o = {}) {
  const sky = o.sky || '#cbe7f6', far = [11, 28], g = new THREE.Group(); g.name = 'fs3bg'; g.userData.scenery = true;
  const flat = builder(sky, [10, 24]), sides = {}, S = {};
  for (const k of ['N', 'W', 'S', 'E']) { S[k] = builder(sky, far); sides[k] = new THREE.Group(); sides[k].name = 'fs3bg-' + k; g.add(sides[k]); }
  // ground patches: the training yard (pale concrete) behind and left, its yellow parking lines; lawn strips
  flat.at(0, 0);
  flat.add(G.pbox(17, .01, 7.4), Q.yard, -1.5, -.012, -8.6);
  flat.add(G.pbox(6.4, .01, 10.4), Q.yard, -9.6, -.012, -1.4);
  for (let k = 0; k < 4; k++) flat.add(G.pbox(.08, .012, 4.2), Q.yellow, -7.6 + k * 2.6, -.004, -9.3);
  flat.add(G.pbox(10.5, .012, .08), Q.yellow, -3.7, -.004, -11.4);
  for (const [x, z, w, d] of [[7.6, -8.6, 2.4, 7.2], [-14.3, -1.4, 2.4, 10.4], [-1.5, -13.2, 17, 1.8]]) flat.add(G.pbox(w, .01, d), Q.lawn, x, -.011, z);
  // the pavement round the island's foot (joints), the roads beyond
  flat.add(G.pbox(14.4, .012, 1.0), Q.walk, 0, -.006, 4.55); flat.add(G.pbox(1.0, .012, 9.6), Q.walk, 5.55, -.006, -.25);
  for (let x = -7; x <= 7; x += .8) flat.add(G.pbox(.014, .014, 1.0), Q.walkJ, x, -.002, 4.55);
  for (let z = -5; z <= 4.5; z += .8) flat.add(G.pbox(1.0, .014, .014), Q.walkJ, 5.55, -.002, z);
  road(flat, { x0: -18, x1: 18, z0: 5.05, z1: 7.65, zebra: [[-1.9, true], [3.4, false]], cut: [[5.98, 8.72]] });
  road(flat, { x0: 6.05, x1: 8.65, z0: -16, z1: 5.05, zebra: [[1.2, false]] });
  flat.at(0, 0);
  flat.add(G.pbox(18, .012, 1.4), Q.walk, 0, -.006, 8.4); flat.add(G.pbox(1.4, .012, 21), Q.walk, 9.4, -.006, -5.5);
  // low things that never fold: hydrants on the near pavements, bollards at the crossings
  for (const [x, z, ry] of [[-6.4, 4.45, 0], [5.55, -3.2, -HP], [-11, 8.35, 0]]) { flat.at(x, z, ry); hydrantRow(flat, 1); }
  flat.at(0, 0); for (const x of [-3.6, -.2]) { flat.add(G.cyl(.07, .08, .6, 10), Q.steelD, x, .3, 4.95); flat.add(G.cyl(.075, .075, .07, 10), Q.yellow, x, .48, 4.95); }
  // behind (N): the hose drying rack and its cart, the training hydrant row, trees
  S.N.at(-4.6, -12.6, .62, .12); hoseRack(S.N);
  for (const [x, z, s] of [[5.2, -10.8, 1.05], [-10.5, -11.5, 1.2], [9.6, -13.5, 1], [-1.5, -13.6, .9]]) { S.N.at(x, z, x, .1, s); tree(S.N, 1); }
  // left (W): the training tower, its front toward the start camera; two trees
  S.W.at(-9.9, -6.45, .62, .14); tower(S.W);
  S.W.at(-7.1, -5.5, .62, .12); hydrantRow(S.W, 3);
  for (const [x, z, s] of [[-8.6, 2.6, 1.1], [-12.6, 1.0, .95], [-13, -7.5, 1.1]]) { S.W.at(x, z, x, .1, s); tree(S.W, 1); }
  // right (E): the 119 flag, a tree; front (S): trees on the far pavement
  S.E.at(10.4, -2.6, -HP, .1); flagpole(S.E);
  for (const [x, z, s] of [[10.5, -8.5, 1.1], [10.6, 3.6, .9]]) { S.E.at(x, z, x, .1, s); tree(S.E, 1); }
  for (const [x, z, s] of [[-7.5, 9.1, 1], [-1.0, 9.2, .9], [5.5, 9.1, 1.05]]) { S.S.at(x, z, x, .1, s); tree(S.S, 1); }
  const put = (B, name, ink, parent) => { const m = scenery(mesh(B.done(), vmat(), { cast: false, recv: false }), ink); m.name = name; parent.add(m); return m; };
  put(flat, 'fs3bg-flat', true, g);
  for (const k of ['N', 'W', 'S', 'E']) put(S[k], 'fs3bg-near-' + k, true, sides[k]);
  g.add(groundPlane(Q.ground, sky));
  g.userData.sides = sides; g.userData.fold = true;
  return g;
}

export const FS3BG_BUILDERS = {
  fs3_yard: (f, T, opts = {}) => {
    f.group.name = 'fs3bg'; f.group.userData.scenery = true;
    f.collideBox = [-.001, -.2, -.001, .001, -.15, .001]; f.noOccupied = true; f.noSolid = true;
    const yard = fireYard(opts || {}); f.add(yard);
    f.updateView = (wd, dt) => { if (foldTown(yard, wd.yaw, dt)) wd.shadowDirty = true; };
    foldTown(yard, Math.PI / 4, 1, true);
  },
};
export const FS3BG_INFO = { fs3_yard: { w: 1, d: 1, name: '안전센터 훈련 마당', price: 0, hidden: true } };

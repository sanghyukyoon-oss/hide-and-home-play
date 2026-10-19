// 한 채의 집 (2026-10-17, user: "2층 3층까지 확장… 특색 있고 이쁘고 계속 보고 싶은 맛"; reference: Codex concepts
// two-storey-concept-v2 / three-storey-concept-v2). The pieces that make a stack of rooms read as ONE house:
//   houseRail(len, T, o)        — a wooden balcony railing for an upper floor's open side (gaps where stairs arrive),
//                                 with ivy trailing over the edge
//   gableTop(len, WH, T, o)     — a gable on top of a wall: clad triangle, round attic window, tiled roof edges that
//                                 overhang, a ridge and a brick chimney (a cut-away roof: nothing covers the rooms)
//   timberFrame(len, WH, T, o)  — corner posts and a top beam on the outside of a wall (half-timbered look)
// They hang on the wall's body, so they fold away with the wall when the camera is on that side.
// Furniture: liftbasket (도르래 바구니) — a pulley, rope and wicker basket between two floors, wound down with a crank.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mesh, geo, shade, STYLE } from './kit.js';

export const FLOOR_H = 2.9;
const PI = Math.PI, HP = PI / 2;
const K = { wood: '#e9b77c', woodD: '#b97a45', roof: '#e8735a', roof2: '#f3967a', brick: '#d9886a', leaf: '#6cc46a', leaf2: '#4fae5a', clad: '#fff3e2' };
const col = (T, k) => (T && T[k]) || K[k];

// ── geometry helpers (same family as map-props.js) ─────────────────────────────────────────────────────────────────
const G = {
  box: (w, h, d, r = .02, seg = 1) => { r = Math.min(r, Math.min(w, h, d) * .45); return r > .004 ? new RoundedBoxGeometry(w, h, d, seg, r) : new THREE.BoxGeometry(w, h, d); },
  pbox: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  sph: (r, ws = 10, hs = 8) => new THREE.SphereGeometry(r, ws, hs),
  cyl: (rt, rb, h, seg = 14, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open),
  tor: (R, t, arc = PI * 2, rs = 6, ts = 22) => new THREE.TorusGeometry(R, t, rs, ts, arc),
  cone: (r, h, seg = 8) => new THREE.ConeGeometry(r, h, seg),
  cap: (r, len, cs = 2, rs = 6) => new THREE.CapsuleGeometry(r, len, cs, rs),
  ext: (shape, depth, bevel = 0, curve = 6) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: curve }),
};
const xf = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(s[0], s[1], s[2]));
const tubeM = (a, b) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length();
  return [L, new THREE.Matrix4().compose(A.clone().add(Bv).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1))]; };
const tint = hex => (STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(hex) : hex);
const VM = {};
function vmat() {
  const k = STYLE.mode;
  return VM[k] || (VM[k] = STYLE.mode !== 'std'
    ? new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: STYLE.grad })
    : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .82 }));
}
// many pieces, many colours, one mesh (vertex colours), cached by key
function mc(key, fn) {
  const g = geo('hmc|' + STYLE.mode + '|' + key, () => {
    const list = [];
    const addM = (src, m, color) => {
      const c = src.index ? src.toNonIndexed() : src.clone();
      for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal') c.deleteAttribute(k);
      c.applyMatrix4(m);
      const cc = new THREE.Color(tint(color)), n = c.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; }
      c.setAttribute('color', new THREE.BufferAttribute(a, 3));
      list.push(c);
    };
    const add = (src, color, x, y, z, rx, ry, rz, s) => addM(src, xf(x, y, z, rx, ry, rz, s), color);
    const tube = (a, b, r, color, seg = 6, r2 = r) => { const [L, m] = tubeM(a, b); addM(new THREE.CylinderGeometry(r2, r, L, seg), m, color); };
    fn({ add, addM, tube });
    const out = mergeGeometries(list, false); out.name = key;
    return out;
  });
  return mesh(g, vmat());
}
// a little bunch of leaves (trailing ivy, window boxes)
function leaves(add, x, y, z, n, c1, c2, s = 1, drop = 0) {
  for (let k = 0; k < n; k++) {
    const a = k * 2.4, r = .07 * s, yy = y - (drop ? (k / n) * drop : 0);
    add(G.sph(r * (.8 + (k % 3) * .15), 8, 6), k % 2 ? c1 : c2, x + Math.cos(a) * .06 * s, yy + Math.sin(a * 1.3) * .03 * s, z + Math.sin(a) * .04 * s, 0, 0, 0, [1.25, .75, 1]);
  }
}

// ── balcony railing: wall-local coords, x along the side, the room on +z; o.gaps = [u, ...] where stairs arrive ─────
export function houseRail(len, T = {}, o = {}) {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), leaf = col(T, 'leaf'), leaf2 = col(T, 'leaf2');
  // (in order along the side: 펭펭이네 2층집 listed [2.5, −.5], and the rail ran on across both — over the stairs' landing and
  // the slide's top; user, 10/19: "스테이지 7에서 미끄럼틀 벽에 막혀 있다")
  const gaps = (o.gaps || []).slice().sort((a, b) => a - b).map(u => [u - .5, u + .5]), inGap = x => gaps.some(([a, b]) => x > a && x < b);
  const L = +len.toFixed(2), key = `hrail|${L}|${gaps.flat().join(',')}|${wood}|${woodD}|${leaf}`;
  return mc(key, ({ add, tube }) => {
    const H = .92, z = .06;
    // runs of rail between the gaps, a newel post at every end
    const cuts = [-L / 2, ...gaps.flat(), L / 2], runs = [];
    for (let k = 0; k < cuts.length; k += 2) runs.push([cuts[k], cuts[k + 1]]);
    for (const [a, b] of runs) {
      if (b - a < .05) continue;
      add(G.box(b - a, .07, .08, .025), woodD, (a + b) / 2, H, z);
      add(G.box(b - a, .05, .07, .015), wood, (a + b) / 2, .1, z);
      for (const x of [a, b]) { add(G.box(.13, H + .14, .13, .025), woodD, x + (x === a ? .065 : -.065), (H + .14) / 2, z); add(G.sph(.075, 10, 8), wood, x + (x === a ? .065 : -.065), H + .19, z); }
      for (let x = a + .3; x < b - .15; x += .3) add(G.box(.04, H - .12, .04, .01), wood, x, (H - .02) / 2 + .04, z);   // airy: the room behind stays readable
    }
    // the floor's edge board, and ivy trailing over it at a few places
    add(G.box(L, .1, .08, .03), woodD, 0, -.05, z - .04);
    for (let x = -L / 2 + .7; x < L / 2 - .3; x += 1.35) {
      if (inGap(x)) continue;
      const drop = .45 + ((x * 7.3) % .35 + .35) % .35;
      tube([x, .04, z - .08], [x + .05, -drop, z - .12], .012, leaf2, 5);
      leaves(add, x, .02, z - .1, 5, leaf, leaf2, 1.1, drop);
      leaves(add, x + .18, .9, z - .02, 3, leaf, leaf2, .8);   // a sprig wound round the rail
    }
  });
}

// ── gable on top of a wall (wall-local coords: x along it, y up from the wall's top WH, room on +z) ─────────────────
export function gableTop(len, WH, T = {}, o = {}) {
  const roof = col(T, 'roof'), roof2 = col(T, 'roof2'), clad = col(T, 'clad'), woodD = col(T, 'woodD'), brick = col(T, 'brick');
  const L = +len.toFixed(2), P = +(Math.min(1.7, L * .27)).toFixed(2), key = `hgable|${L}|${P}|${roof}|${clad}|${woodD}|${brick}|${o.chimney ? 1 : 0}`;
  const g = new THREE.Group(); g.position.y = WH;
  g.add(mc(key, ({ add }) => {
    const t = .16;
    // clad triangle with horizontal boards
    const s = new THREE.Shape(); s.moveTo(-L / 2, 0); s.lineTo(L / 2, 0); s.lineTo(0, P); s.lineTo(-L / 2, 0);
    add(G.ext(s, t, 0, 2), clad, 0, 0, -t);
    for (let y = .22; y < P - .15; y += .24) { const w = L * (1 - y / P) - .1; add(G.pbox(w, .025, .012), shade(clad, -.07), 0, y, .006); }
    // round attic window
    const wy = P * .42, wr = Math.min(.26, P * .2);
    add(G.tor(wr, .045, PI * 2, 8, 26), woodD, 0, wy, .02);
    add(new THREE.CircleGeometry(wr - .02, 24), '#bfe6ff', 0, wy, .012);
    add(G.pbox(.03, wr * 2 - .04, .02), woodD, 0, wy, .03); add(G.pbox(wr * 2 - .04, .03, .02), woodD, 0, wy, .03);
    // roof edges: thick tiled bars along both slopes, overhanging the wall front and back
    const ov = .32, sl = Math.hypot(L / 2 + ov, P + ov * P / (L / 2)), ang = Math.atan2(P, L / 2), D = 1.0;
    for (const sx of [-1, 1]) {
      const cx = sx * (L / 4 - ov / 2), cy = P / 2 - ov * P / (L / 2) / 2 + .1;
      add(G.box(sl, .2, D, .05), roof, cx, cy, -.3, 0, 0, -sx * ang);
      for (let k = .3; k < sl - .1; k += .3) {   // tile scallops on top
        const px = cx - sx * Math.cos(ang) * (sl / 2 - k), py = cy + Math.sin(ang) * (sl / 2 - k) + .1;
        add(G.box(.26, .08, D + .02, .035), roof2, px, py, -.3, 0, 0, -sx * ang);
      }
      add(G.box(sl, .07, .08, .02), woodD, cx, cy - .12, .21, 0, 0, -sx * ang);   // barge board under the tiles
    }
    add(G.box(.32, .2, D + .1, .06), roof2, 0, P + .14, -.3);   // ridge
    if (o.chimney) {
      const chx = L * .24, chy = P * (1 - (chx + .1) / (L / 2)) + .1;
      add(G.box(.42, .9, .42, .03), brick, chx, chy + .35, -.35);
      add(G.box(.5, .1, .5, .03), shade(brick, -.12), chx, chy + .82, -.35);
      for (let k = 0; k < 4; k++) add(G.pbox(.43, .02, .43), shade(brick, .08), chx, chy + .05 + k * .2, -.35);
    }
  }));
  return g;
}

// ── half-timbering on the outside of a wall: corner posts, a top beam, little knee braces ─────────────────────────
export function timberFrame(len, WH, T = {}, o = {}) {
  const woodD = col(T, 'woodD'), L = +len.toFixed(2), H = +WH.toFixed(2);
  return mc(`htimber|${L}|${H}|${woodD}|${o.ends ?? 3}`, ({ add }) => {
    const z = -.2, e = o.ends ?? 3;
    for (const [sx, bit] of [[-1, 1], [1, 2]]) if (e & bit) {
      add(G.box(.2, H + .1, .2, .03), woodD, sx * (L / 2 + .04), (H + .1) / 2, z);
      add(G.box(.08, .5, .08, .015), woodD, sx * (L / 2 - .22), H - .3, z + .02, 0, 0, sx * .7);
    }
    add(G.box(L + .2, .11, .12, .03), woodD, 0, H - .02, z + .02);
    add(G.box(L + .24, .16, .2, .03), shade(woodD, -.1), 0, .08, z + .02);   // sill beam on the ground
  });
}

// ── 도르래 바구니 (1×1): two posts up past the upper floor, a pulley, a crank on the side; tap and the basket comes down
const B = {};
// o.up: the basket waits downstairs and the crank sends it UP through the floor's hatch (10/19: what it carries arrives
// where it is needed upstairs — the pulley joins the two floors instead of standing beside them)
B.liftbasket = (f, T, o = {}) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [wood, woodD].join(',');
  const TOP = FLOOR_H + 1.35, yT = FLOOR_H + .12, yB = .5, z0 = -.28, up = !!o.up;
  // o.crank 'left': the crank on the left post — against an east wall the right one's handle stood 21 cm in the wall, and the
  // room's part fitting then held the whole lift at .35 (7판: the basket never reached the upper floor — 10/20)
  const cs = o.crank === 'left' ? -1 : 1;
  f.add(mc('liftframe|' + tk + (cs < 0 ? '|L' : ''), ({ add, tube }) => {
    for (const sx of [-1, 1]) { add(G.box(.11, TOP, .11, .02), woodD, sx * .36, TOP / 2, z0); add(G.box(.22, .06, .22, .02), woodD, sx * .36, .03, z0); }
    add(G.box(.86, .12, .14, .03), woodD, 0, TOP - .04, z0);
    add(G.cyl(.15, .15, .07, 22), wood, 0, TOP - .2, z0 + .1, HP, 0, 0);
    add(G.tor(.15, .02, PI * 2, 6, 22), woodD, 0, TOP - .2, z0 + .1);
    add(G.cyl(.03, .03, .2, 8), '#c9cfe0', 0, TOP - .2, z0 + .06, HP, 0, 0);
    // the crank box on the right post
    add(G.box(.16, .2, .16, .03), '#c9cfe0', cs * .44, 1.0, z0 + .02);
    tube([cs * .36, TOP - .2, z0 + .1], [cs * .44, 1.1, z0 + .1], .01, '#e8d8b8', 5);   // drive rope down to the crank
  }));
  const crank = new THREE.Group(); put(crank, cs * .53, 1.0, z0 + .02); f.add(crank);
  const ch = new THREE.Group(); ch.rotation.y = cs < 0 ? PI : 0; crank.add(ch);   // (the handle faces out on either side)
  ch.add(mc('liftcrank', ({ add }) => { add(G.cyl(.025, .025, .14, 8), '#c9cfe0', .02, 0, 0, 0, 0, HP); add(G.box(.04, .2, .04, .01), '#c9cfe0', .08, -.08, 0); add(G.cyl(.035, .035, .1, 10), '#ffcf5c', .13, -.17, 0, 0, 0, HP); }));
  const basket = new THREE.Group(); put(basket, 0, up ? yB : yT, z0 + .1); f.add(basket);
  basket.add(mc('liftbasket|' + tk, ({ add, tube }) => {
    // an open wicker tray: floor and four low sides, so what rides in it can be seen
    add(G.box(.5, .04, .4, .015), '#b97a45', 0, .02, 0);
    for (const sx of [-1, 1]) add(G.box(.035, .2, .4, .012), '#d9a05b', sx * .2325, .1, 0);
    for (const sz of [-1, 1]) add(G.box(.5, .2, .035, .012), '#d9a05b', 0, .1, sz * .1825);
    for (let y = .06; y < .2; y += .065) { add(G.box(.51, .02, .03, .008), '#c78a45', 0, y, .19); add(G.box(.51, .02, .03, .008), '#c78a45', 0, y, -.19); }
    for (const sz of [-1, 1]) add(G.box(.53, .035, .05, .012), '#c78a45', 0, .2, sz * .19);   // rim
    for (const sx of [-1, 1]) add(G.box(.05, .035, .42, .012), '#c78a45', sx * .24, .2, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tube([sx * .22, .2, sz * .17], [0, .62, 0], .008, '#e8d8b8', 4);
    add(G.tor(.05, .012, PI * 2, 5, 12), '#c9cfe0', 0, .64, 0);
  }));
  const rope = new THREE.Group(); put(rope, 0, TOP - .2, z0 + .1); f.add(rope);
  rope.add(mc('liftrope', ({ add }) => add(G.cyl(.012, .012, 1, 5), '#e8d8b8', 0, -.5, 0)));
  const setRope = by => { rope.scale.y = Math.max(.05, TOP - .2 - (by + .66)); };
  setRope(up ? yB : yT);
  const p = f.part('lift', [basket, crank, rope], (t, bB, bC, bR) => {
    basket.position.y = bB.p.y + ((up ? yT : yB) - (up ? yB : yT)) * t; basket.rotation.z = Math.sin(t * PI * 3) * .04 * (1 - t);
    crank.rotation.x = (up ? 1 : -1) * t * PI * 6; setRope(basket.position.y);
  }, { label: '도르래 바구니', sfx: 'swish', dur: up ? 1.4 : .9 });
  f.spot('inside', basket, 0, .04, 0, { part: p, maxH: .26, label: '도르래 바구니 안', scale: .8 });
  f.spot('behind', null, 0, 0, z0 - .05, { maxH: .3, label: '바구니 기둥 뒤', scale: .7 });
};
export const HOUSE_BUILDERS = B;
export const HOUSE_INFO = { liftbasket: { w: 1, d: 1, name: '도르래 바구니', price: 380 } };

// the geometry helpers, shared with the newer theme sets (fishing, skatepark, stage…)
export { G as HG, xf as hxf, mc as hmc, leaves as hleaves };

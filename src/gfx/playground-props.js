// Apartment-complex playground props (단지 놀이터): the playground between the 동 buildings of a Korean apartment complex —
// a slide tower with a red roof, a red slide, a yellow tube slide and a climbing wall, green A-frame swings, a seesaw, a
// sand pit with a sandcastle, a spring rider horse, a wooden 정자 with a dark tiled roof, a bike shelter, the coloured
// 분리수거 bins, a striped ice-cream cart, a picnic table with a gingham cloth, a kettle grill, a 길고양이 급식소, the
// complex notice board, a globe street lamp, a flower planter, a chalk 사방치기 court and the 103동 wall with its entrance.
// Same contract as street-props.js / trail-props.js:
//   builder(f, T, opts) fills a Furn. Origin = footprint centre on the ground, the piece faces +z, back toward -z, 1 tile = 1.
//   parts open / lift / slide / flip; spots: inside (needs its part open) | under/behind (visible but tucked) | on (plain sight).
//   Lockable parts carry p.lockable = true and p.lockKind ('pad' | 'code'), with f.lockAt where the lock hardware goes.
// Toy-set rules: chunky silhouettes, few draw calls. Plain static decor is merged into ONE vertex-coloured mesh per piece
// (mc). Textured surfaces (wood grain, planks, concrete, sand, roof tiles, corrugated steel, bricks, wall tiles, rubber
// granules, tread plate) are vertex-coloured meshes printed with one shared greyscale texture each (mt), so one texture
// tints to any colour; signs and prints share one label atlas (mg). Every moving part is its own mesh. Decals sit >= .006
// in front of the face they are on.
//   import { PLAYGROUND_BUILDERS, PLAYGROUND_INFO, PLAYGROUND_THEMES, PLAYGROUND_ITEMS } from './gfx/playground-props.js';
//   registerFurniture(PLAYGROUND_BUILDERS, PLAYGROUND_INFO); Object.assign(ITEMS, PLAYGROUND_ITEMS);
//   for (const k in PLAYGROUND_THEMES) THEMES[k] = { ...THEMES.my, ...PLAYGROUND_THEMES[k] };
// 'hopscotch' stays flat (<= .03 tall, info floor: true). 'aptwall' is a backdrop: a 2-wide, 3 m apartment wall that
// belongs against the back edge of a map (its whole depth is façade, balconies and the entrance porch).
// Bright afternoon palette on light-beige paving: cream, honey wood, tomato red, mustard, sky, mint, green, charcoal tiles.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { grp, mat, mesh, geo, canvasTex, texCache, roundRect, shade, starShape, heartShape, STYLE } from './kit.js';
import { rng } from '../util.js';
import { tr } from '../i18n.js';

const PI = Math.PI, HP = PI / 2;

// ── palette ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Theme keys first (pieces follow the scene they are bought into). Extra keys only the playground theme sets:
// slide (slide / tower roof), tower (tower posts), panel (tower panels), tube (tube slide), swing (swing + seesaw frames),
// seesaw (seesaw plank), sand (sand pit), rider (spring horse), roofTile (정자 roof), awning (ice-cream canopy), cart
// (ice-cream cart body), shelter (bike-shelter roof), lamp (lamp post), board (notice board), cloth (picnic gingham),
// grill (kettle grill), feedroof (cat-house roof), aptband (apartment floor band), canopy (apartment entrance canopy).
const K = { wood: '#e9b47e', woodD: '#b98252', accent: '#7fd6c0', accent2: '#8fd3f4', accent3: '#ffc23d', pot: '#e88a5c', soil: '#7a5536',
  concrete: '#e2d9cd', stone: '#cfc3b6', plaster: '#f4e7d3', brick: '#d0785a', bike: '#4fae9b',
  slide: '#ff5a4a', tower: '#3f7fd8', panel: '#ffc23d', tube: '#ffc23d', swing: '#3fae74', seesaw: '#ffb02e', sand: '#f0d39c',
  rider: '#4f9be8', roofTile: '#6b6f7c', awning: '#ff5a4a', cart: '#fffaf2', shelter: '#2fa58e', lamp: '#33394a', board: '#3b8f6a',
  cloth: '#ff5a5a', grill: '#3d3a52', feedroof: '#d9644a', aptband: '#c98a6a', canopy: '#4a4f5e' };
const col = (T, k) => (T && T[k]) || K[k];
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', SKY = '#8fd3f4', MUSTARD = '#ffc23d', TOMATO = '#ff6b57',
  MINT = '#7fd6c0', BLUSH = '#ff9fb5', LEAF = '#6cc46a', LEAF2 = '#4ea85a', LEAF3 = '#8fd47a', ORANGE = '#ffab4c',
  STEEL = '#c9cfe0', STEEL2 = '#a9b2c8', ALU = '#dde2ea', CHAR = '#3b3550', KRAFT = '#e8bb82', LILAC = '#b9a6ff', BROWN = '#c98a52',
  RED = '#ff4b4b', YELLOW = '#ffd23f', PINK = '#ff8fb8', RUBBER = '#34303f', NAVY = '#3b4a6a';
const BINS = [['일반', '#4f8fe8'], ['플라스틱', '#45b86b'], ['캔', '#ff9a3c'], ['종이', '#a58cf0']];

// ── geometry helpers (as street-props.js / trail-props.js) ──────────────────────────────────────────────────────
const G = {
  box: (w, h, d, r = .02, seg = 1) => { r = Math.min(r, Math.min(w, h, d) * .45); return r > .004 ? new RoundedBoxGeometry(w, h, d, seg, r) : new THREE.BoxGeometry(w, h, d); },
  pbox: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  sph: (r, ws = 10, hs = 8) => new THREE.SphereGeometry(r, ws, hs),
  dome: (r, ws = 16, hs = 5) => new THREE.SphereGeometry(r, ws, hs, 0, PI * 2, 0, HP),
  cyl: (rt, rb, h, seg = 14, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open),
  cone: (r, h, seg = 8) => new THREE.ConeGeometry(r, h, seg),
  cap: (r, len, cs = 2, rs = 6) => new THREE.CapsuleGeometry(r, len, cs, rs),
  tor: (R, t, arc = PI * 2, rs = 5, ts = 20) => new THREE.TorusGeometry(R, t, rs, ts, arc),
  lathe: (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg),
  ext: (shape, depth, bevel = 0, curve = 6) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: curve }),
};
const ni = g => (g.index ? g.toNonIndexed() : g);
const Y = new THREE.Vector3(0, 1, 0), ZA = new THREE.Vector3(0, 0, 1), I4 = new THREE.Matrix4();
const v3 = a => (a.isVector3 ? a.clone() : new THREE.Vector3(a[0], a[1], a[2]));
const xf = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(s[0], s[1], s[2]));
const tubeM = (a, b) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length(); return [L, new THREE.Matrix4().compose(A.clone().add(Bv).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(Y, d.normalize()), new THREE.Vector3(1, 1, 1))]; };
// a frame at p whose `axis` (Y for cones / cylinders, ZA for tori) points along d
const along = (p, d, axis = Y, s = 1) => new THREE.Matrix4().compose(v3(p), new THREE.Quaternion().setFromUnitVectors(axis, v3(d).normalize()), typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(s[0], s[1], s[2]));
const tint = hex => (STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(hex) : hex);

const VM = {};
function vmat() {
  const k = STYLE.mode;
  return VM[k] || (VM[k] = STYLE.mode !== 'std'
    ? new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: STYLE.grad })
    : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .82 }));
}
function paint(c, color) {
  const cc = new THREE.Color(tint(color)), n = c.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; }
  c.setAttribute('color', new THREE.BufferAttribute(a, 3));
}
// Many pieces, many colours, ONE mesh (vertex colours). Cached by key: put every theme colour the piece uses in the key.
//   fn({ add(geometry, color, x, y, z, rx, ry, rz, s), addM(geometry, matrix, color), tube(a, b, r, color, seg, r2) })
function mc(key, fn) {
  const g = geo('pmc|' + STYLE.mode + '|' + key, () => {
    const list = [];
    const addM = (src, m, color) => {
      const c = src.index ? src.toNonIndexed() : src.clone();
      for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal') c.deleteAttribute(k);
      c.applyMatrix4(m); paint(c, color); list.push(c);
    };
    const add = (src, color, x, y, z, rx, ry, rz, s) => addM(src, xf(x, y, z, rx, ry, rz, s), color);
    const tube = (a, b, r, color, seg = 6, r2 = r) => { const [L, m] = tubeM(a, b); addM(new THREE.CylinderGeometry(r2, r, L, seg), m, color); };
    fn({ add, addM, tube });
    const out = mergeGeometries(list, false); out.name = key;
    return out;
  });
  return mesh(g, vmat());
}
// Textured + vertex-coloured: every piece is printed with ONE shared greyscale texture multiplied by its own colour.
// uv per piece:  number s → box-mapped in the piece's own (untransformed) axes, s units per repeat (model long things
// along x) | { w: s } → box-mapped in its final position [default, s = .4] | { s, swap } → as a number, u / v swapped |
// [su, sv, swap] → the geometry's own uvs scaled (cylinders: u round, v along) | null → the geometry's own uvs.
const VTM = {};
function vtmat(map) {
  const k = STYLE.mode + '|' + map.uuid;
  return VTM[k] || (VTM[k] = STYLE.mode !== 'std'
    ? new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, map, gradientMap: STYLE.grad })
    : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, map, roughness: .82 }));
}
function swapUV(c) { const a = c.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getY(i), a.getX(i)); }
function mt(key, map, fn) {
  const g = geo('pmt|' + STYLE.mode + '|' + key, () => {
    const list = [];
    const addM = (src, m, color, uv = { w: .4 }) => {
      const c = src.index ? src.toNonIndexed() : src.clone();
      for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') c.deleteAttribute(k);
      if (Array.isArray(uv)) {
        const a = c.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * uv[0], a.getY(i) * uv[1]);
        if (uv[2]) swapUV(c);
      } else if (typeof uv === 'number') planarUV(c, uv);
      else if (uv && uv.s) { planarUV(c, uv.s); if (uv.swap) swapUV(c); }
      c.applyMatrix4(m);
      if (uv && uv.w) planarUV(c, uv.w);
      if (!c.attributes.uv) planarUV(c, .4);
      paint(c, color); list.push(c);
    };
    const add = (src, color, x, y, z, rx, ry, rz, s, uv) => addM(src, xf(x, y, z, rx, ry, rz, s), color, uv);
    const tube = (a, b, r, color, s = .3, swap = false, r2 = r, seg = 10) => { const [L, m] = tubeM(a, b); addM(new THREE.CylinderGeometry(r2, r, L, seg, 1, true), m, color, swap ? [L / s, 2 * PI * r / s, true] : [2 * PI * r / s, L / s]); };
    fn({ add, addM, tube });
    const out = mergeGeometries(list, false); out.name = key;
    return out;
  });
  return mesh(g, vtmat(map));
}
// One mesh from many pieces sharing one material (labels, prints, glass, fabric). fn gets { add, addM }; keeps uvs.
function mg(key, m, fn) {
  const g = geo('pmg|' + key, () => {
    const list = [];
    const addM = (src, mm) => {
      const c = src.index ? src.toNonIndexed() : src.clone();
      for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') c.deleteAttribute(k);
      c.applyMatrix4(mm); list.push(c);
    };
    const add = (src, x, y, z, rx, ry, rz, s) => addM(src, xf(x, y, z, rx, ry, rz, s));
    fn({ add, addM });
    const out = mergeGeometries(list, false); out.name = key;
    return out;
  });
  return mesh(g, m);
}
// Box-mapped uvs (a print is the same size on every face).
function planarUV(g, s) {
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [u, v] = ay >= ax && ay >= az ? [p.getX(i), p.getZ(i)] : ax >= az ? [p.getZ(i), p.getY(i)] : [p.getX(i), p.getY(i)];
    uv[i * 2] = u / s; uv[i * 2 + 1] = v / s;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
// Remap a geometry's 0..1 uvs into an atlas rect [u0, v0, u1, v1].
function cellUV(g, c) {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, c[0] + uv.getX(i) * (c[2] - c[0]), c[1] + uv.getY(i) * (c[3] - c[1]));
  return g;
}
const quadGeo = (w, h, rc) => cellUV(new THREE.PlaneGeometry(w, h), rc);
const circGeo = (r, rc) => cellUV(new THREE.CircleGeometry(r, 32), rc);
const discGeo = (r, rc) => circGeo(r, rc).rotateX(-HP);
// a geometry turned inside out (seen from inside: tube and bucket interiors)
function inward(src) {
  const g = src.index ? src.toNonIndexed() : src.clone();
  for (const at of Object.values(g.attributes)) {
    const s = at.itemSize, a = at.array;
    for (let i = 0; i + 2 < at.count; i += 3) for (let k = 0; k < s; k++) { const t = a[(i + 1) * s + k]; a[(i + 1) * s + k] = a[(i + 2) * s + k]; a[(i + 2) * s + k] = t; }
  }
  const n = g.attributes.normal; if (n) for (let i = 0; i < n.array.length; i++) n.array[i] = -n.array[i];
  return g;
}
// flat convex polygons [[points…], outward] → one geometry, every triangle wound to face its outward vector; uvOf(p) → [u, v]
function facets(list, uvOf = null) {
  const pos = [], uv = [], e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3();
  for (const [P, out] of list) {
    const V = P.map(v3), o = v3(out);
    for (let k = 1; k + 1 < V.length; k++) {
      let a = V[0], b = V[k], c = V[k + 1];
      n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
      if (n.dot(o) < 0) [b, c] = [c, b];
      for (const q of [a, b, c]) { pos.push(q.x, q.y, q.z); if (uvOf) uv.push(...uvOf(q)); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (uvOf) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
// a box section swept along a path of [y, z] points at fixed x (slides): x0..x1 across, v0..v1 up off the path
function sweepBox(path, x0, x1, v0, v1) {
  const N = path.length, fr = [];
  for (let i = 0; i < N; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(N - 1, i + 1)];
    let ty = b[0] - a[0], tz = b[1] - a[1]; const L = Math.hypot(ty, tz); ty /= L; tz /= L;
    fr.push([ty, tz, tz, -ty]);   // tangent, then the up-normal
  }
  const P = (i, x, v) => [x, path[i][0] + fr[i][2] * v, path[i][1] + fr[i][3] * v];
  const list = [];
  for (let i = 0; i + 1 < N; i++) {
    const n = [0, fr[i][2] + fr[i + 1][2], fr[i][3] + fr[i + 1][3]];
    list.push([[P(i, x0, v1), P(i, x1, v1), P(i + 1, x1, v1), P(i + 1, x0, v1)], n]);
    list.push([[P(i, x0, v0), P(i, x1, v0), P(i + 1, x1, v0), P(i + 1, x0, v0)], n.map(q => -q)]);
    list.push([[P(i, x0, v0), P(i, x0, v1), P(i + 1, x0, v1), P(i + 1, x0, v0)], [-1, 0, 0]]);
    list.push([[P(i, x1, v0), P(i, x1, v1), P(i + 1, x1, v1), P(i + 1, x1, v0)], [1, 0, 0]]);
  }
  list.push([[P(0, x0, v0), P(0, x1, v0), P(0, x1, v1), P(0, x0, v1)], [0, -fr[0][0], -fr[0][1]]]);
  list.push([[P(N - 1, x0, v0), P(N - 1, x1, v0), P(N - 1, x1, v1), P(N - 1, x0, v1)], [0, fr[N - 1][0], fr[N - 1][1]]]);
  return facets(list);
}
// A lumpy pebble: a sphere with every vertex nudged in or out (welded, so the lumps stay closed). Scale it per use.
function stoneGeo(seed, lump = .14) {
  return geo('pg-stone|' + seed + '|' + lump, () => {
    let g = new THREE.SphereGeometry(1, 12, 8); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4);
    const p = g.attributes.position, r = rng(seed * 7 + 3);
    for (let i = 0; i < p.count; i++) { const s = 1 - lump / 2 + r() * lump; p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, p.getZ(i) * s); }
    g.computeVertexNormals();
    return g;
  });
}
class Helix extends THREE.Curve {
  constructor(r, y0, y1, turns) { super(); this.r = r; this.y0 = y0; this.y1 = y1; this.turns = turns; }
  getPoint(t, o = new THREE.Vector3()) { const a = t * PI * 2 * this.turns; return o.set(Math.cos(a) * this.r, this.y0 + t * (this.y1 - this.y0), Math.sin(a) * this.r); }
}
const transparent = o => { o.castShadow = false; return o; };

// ── canvas textures (drawn at 2x; Hangul in Jua, redrawn once the web font arrives) ──────────────────────────────
const FONT = px => `${px}px Ssurround, Jua, "Malgun Gothic", "Apple SD Gothic Neo", "Yu Gothic", "Hiragino Sans", sans-serif`;
function txt(c, s, x, y, px, color, o = {}) {
  c.font = FONT(px); c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
  // in English the sign reads in English, shrunk to the width the Korean had if it runs longer
  const t = tr(s); if (t !== s) { const w0 = c.measureText(s).width * 1.25, w1 = c.measureText(t).width; if (w1 > w0) c.font = FONT(Math.max(6, px * w0 / w1)); s = t; }
  if (o.stroke) { c.lineJoin = 'round'; c.strokeStyle = o.stroke; c.lineWidth = o.sw || 4; c.strokeText(s, x, y); }
  c.fillStyle = color; c.fillText(s, x, y);
}
function liveTex(w, h, draw, o = {}) {
  const run = cx => { cx.save(); cx.scale(2, 2); draw(cx, w / 2, h / 2); cx.restore(); };
  const t = canvasTex(w, h, run, o);
  if (o.text && typeof document !== 'undefined' && document.fonts && !document.fonts.check('20px Ssurround')) {
    document.fonts.load('20px Ssurround').then(() => { const cx = t.image.getContext('2d'); cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, w, h); run(cx); t.needsUpdate = true; }).catch(() => {});
  }
  return t;
}
const TEX = texCache();   // cached per scene generation (kit.js purgeGeo)
const tex = (key, w, h, draw, o) => TEX.get(key, () => liveTex(w, h, draw, o));
const blob = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); };
// draw at (x, y) and at its wrapped copies so a texture tiles seamlessly
const wrap = (W, H, x, y, m, fn) => { for (const dx of [-W, 0, W]) for (const dy of [-H, 0, H]) { const X = x + dx, Y2 = y + dy; if (X > -m && X < W + m && Y2 > -m && Y2 < H + m) fn(X, Y2); } };
function clip(c, x, y, w, h, fn) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); fn(); c.restore(); }
// the game's mochi hero
function mochi(c, x, y, r, body = '#ffffff') {
  c.fillStyle = body; c.beginPath(); c.ellipse(x, y, r, r * .84, 0, 0, PI * 2); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1.1, r * .08); c.stroke();
  c.fillStyle = '#2a1d33'; blob(c, x - r * .34, y - r * .06, r * .1); blob(c, x + r * .34, y - r * .06, r * .1);
  c.fillStyle = '#ff9fb5'; blob(c, x - r * .58, y + r * .2, r * .14); blob(c, x + r * .58, y + r * .2, r * .14);
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1, r * .07); c.beginPath(); c.arc(x, y + r * .06, r * .14, .25, PI - .25); c.stroke();
}
// a round bear face (the complex's mascot)
function bear(c, x, y, r, fur = '#c98a52', ink = '#2a1d33', inner = '#ffdcb5') {
  c.fillStyle = fur; blob(c, x - r * .74, y - r * .7, r * .36); blob(c, x + r * .74, y - r * .7, r * .36); blob(c, x, y, r);
  c.fillStyle = inner; blob(c, x - r * .74, y - r * .7, r * .18); blob(c, x + r * .74, y - r * .7, r * .18);
  c.beginPath(); c.ellipse(x, y + r * .3, r * .42, r * .3, 0, 0, PI * 2); c.fill();
  c.fillStyle = ink; blob(c, x - r * .38, y - r * .1, r * .1); blob(c, x + r * .38, y - r * .1, r * .1); blob(c, x, y + r * .2, r * .11);
  c.fillStyle = '#ff9fb5'; blob(c, x - r * .64, y + r * .2, r * .13); blob(c, x + r * .64, y + r * .2, r * .13);
}
function catFace(c, x, y, r, fur = '#ffffff', patch = '#ffab4c', patch2 = '#5a4a48') {
  c.fillStyle = fur;
  c.beginPath(); c.moveTo(x - r * .92, y - r * .1); c.lineTo(x - r * .8, y - r * 1.18); c.lineTo(x - r * .28, y - r * .76);
  c.lineTo(x + r * .28, y - r * .76); c.lineTo(x + r * .8, y - r * 1.18); c.lineTo(x + r * .92, y - r * .1); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(x, y, r, r * .82, 0, 0, PI * 2); c.fill();
  c.save(); c.beginPath(); c.ellipse(x, y, r, r * .82, 0, 0, PI * 2); c.clip();
  c.fillStyle = patch; blob(c, x - r * .7, y - r * .55, r * .62); c.fillStyle = patch2; blob(c, x + r * .75, y - r * .6, r * .5); c.restore();
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1, r * .08); c.beginPath(); c.ellipse(x, y, r, r * .82, 0, 0, PI * 2); c.stroke();
  c.fillStyle = '#2a1d33'; blob(c, x - r * .36, y - r * .05, r * .1); blob(c, x + r * .36, y - r * .05, r * .1);
  c.fillStyle = '#ff9fb5'; blob(c, x, y + r * .16, r * .08);
}
function recycle(c, x, y, r, color) {   // three chasing arrows round a ring
  c.strokeStyle = color; c.fillStyle = color; c.lineWidth = r * .3; c.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const a0 = -HP + k * PI * 2 / 3 + .3, a1 = a0 + PI * 2 / 3 - .75;
    c.beginPath(); c.arc(x, y, r, a0, a1); c.stroke();
    const hx = x + Math.cos(a1) * r, hy = y + Math.sin(a1) * r, ta = a1 + HP;
    c.beginPath(); c.moveTo(hx + Math.cos(ta) * r * .5, hy + Math.sin(ta) * r * .5); c.lineTo(hx + Math.cos(ta + 2.2) * r * .38, hy + Math.sin(ta + 2.2) * r * .38); c.lineTo(hx + Math.cos(ta - 2.2) * r * .38, hy + Math.sin(ta - 2.2) * r * .38); c.closePath(); c.fill();
  }
}
function paw(c, x, y, r, color) { c.fillStyle = color; c.beginPath(); c.ellipse(x, y + r * .25, r * .62, r * .5, 0, 0, PI * 2); c.fill(); for (const [dx, dy] of [[-.62, -.38], [-.22, -.72], [.22, -.72], [.62, -.38]]) blob(c, x + dx * r, y + dy * r, r * .24); }
function starPath(c, x, y, R, r, n = 5) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -HP + i * PI / n, q = i % 2 ? r : R; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); }
function cone(c, x, y, s, scoop = '#ff9fb5', scoop2 = '#bff0dc') {   // an ice-cream cone pictogram
  c.fillStyle = '#e8a855'; c.beginPath(); c.moveTo(x - 7 * s, y); c.lineTo(x + 7 * s, y); c.lineTo(x, y + 16 * s); c.closePath(); c.fill();
  c.strokeStyle = '#c98a3c'; c.lineWidth = .8 * s; for (const d of [-3, 1, 5]) { c.beginPath(); c.moveTo(x + d * s - 3 * s, y + 1); c.lineTo(x + d * s + 2 * s, y + 9 * s); c.stroke(); }
  c.fillStyle = scoop2; blob(c, x, y - 4 * s, 6.5 * s); c.fillStyle = scoop; blob(c, x, y - 11 * s, 6 * s);
  c.fillStyle = '#ff5a4a'; blob(c, x + 1 * s, y - 17.5 * s, 2 * s);
}
function popsicle(c, x, y, s, a = '#ff8fb8', b = '#ffffff') {
  c.fillStyle = '#e8c08a'; c.fillRect(x - 1.5 * s, y + 6 * s, 3 * s, 8 * s);
  c.fillStyle = a; roundRect(c, x - 6 * s, y - 12 * s, 12 * s, 19 * s, 5 * s); c.fill();
  c.fillStyle = b; c.fillRect(x - 6 * s, y - 2 * s, 12 * s, 3 * s);
}
const REP = { repeat: [1, 1] };

// Greyscale surface prints (white = the piece's own colour; darker = grooves, joints, grain).
// wood grain, lines along u
const grainTex = () => tex('pg-grain', 256, 256, (c, w, h) => {
  const r = rng(31);
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { const y = r() * h, hh = 5 + r() * 12, a = r() < .5 ? .05 : .09; wrap(w, h, 0, y, hh + 2, (X, Yy) => { c.fillStyle = `rgba(110,70,40,${a})`; c.fillRect(0, Yy, w, hh); }); }
  c.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const y0 = r() * h, A = .8 + r() * 2.4, fq = 1 + Math.floor(r() * 3), ph = r() * 6.28, a = .12 + r() * .16, lw = .6 + r() * .8;
    for (const dy of [-h, 0, h]) { c.strokeStyle = `rgba(100,60,30,${a})`; c.lineWidth = lw; c.beginPath(); for (let x = 0; x <= w; x += 4) { const y = y0 + dy + Math.sin(x / w * PI * 2 * fq + ph) * A; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  }
  for (let i = 0; i < 2; i++) wrap(w, h, r() * w, r() * h, 20, (X, Yy) => {
    for (let k = 0; k < 3; k++) { c.strokeStyle = `rgba(100,60,30,${.32 - k * .08})`; c.lineWidth = 1; c.beginPath(); c.ellipse(X, Yy, 6 + k * 3.5, 2.4 + k * 1.6, 0, 0, PI * 2); c.stroke(); }
    c.fillStyle = 'rgba(100,60,30,.4)'; c.beginPath(); c.ellipse(X, Yy, 3.4, 1.6, 0, 0, PI * 2); c.fill();
  });
}, REP);
// planks along u (4 per repeat): dark gaps, a staggered butt joint with two nails per plank, grain
const plankTex = () => tex('pg-plank', 256, 256, (c, w, h) => {
  const r = rng(41), n = 4, ph = h / n, tones = ['#ffffff', '#f3ebe2', '#fbf5ee', '#ece2d6'];
  c.fillStyle = '#76584a'; c.fillRect(0, 0, w, h);
  for (let k = 0; k < n; k++) {
    const y = k * ph, j = r() * w;
    c.fillStyle = tones[k % 4]; c.fillRect(0, y + 1.3, w, ph - 2.6);
    c.save(); c.beginPath(); c.rect(0, y + 1.3, w, ph - 2.6); c.clip();
    for (let i = 0; i < 6; i++) {
      const y0 = y + 3 + r() * (ph - 6), A = .5 + r() * 1.6, fq = 1 + Math.floor(r() * 3), p0 = r() * 6.28;
      c.strokeStyle = `rgba(110,70,40,${.12 + r() * .14})`; c.lineWidth = .7 + r() * .6; c.beginPath();
      for (let x = 0; x <= w; x += 4) { const yy = y0 + Math.sin(x / w * PI * 2 * fq + p0) * A; x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke();
    }
    c.restore();
    c.fillStyle = '#76584a'; c.fillRect(j - 1, y, 2, ph); if (j < 2) c.fillRect(j - 1 + w, y, 2, ph);
    c.fillStyle = 'rgba(60,40,30,.55)'; for (const dx of [-5, 5]) for (const fy of [.32, .68]) wrap(w, h, j + dx, y + ph * fy, 3, (X, Yy) => blob(c, X, Yy, 1.1));
  }
}, REP);
// concrete / granite speckle
const speckleTex = () => tex('pg-speck', 256, 256, (c, w, h) => {
  const r = rng(61);
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) { const lt = r() < .5, rad = 8 + r() * 18; wrap(w, h, r() * w, r() * h, rad, (X, Yy) => { c.fillStyle = lt ? 'rgba(255,255,255,.5)' : 'rgba(120,110,105,.09)'; blob(c, X, Yy, rad); }); }
  for (let i = 0; i < 900; i++) { c.fillStyle = r() < .65 ? 'rgba(70,60,62,.3)' : 'rgba(255,255,255,.8)'; const s = .8 + r() * 1.1; c.fillRect(r() * w, r() * h, s, s); }
  c.strokeStyle = 'rgba(70,60,62,.3)'; c.lineWidth = .9;
  for (let i = 0; i < 4; i++) { let x = r() * w, y = r() * h; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 18; y += 4 + r() * 8; c.lineTo(x, y); } c.stroke(); }
}, REP);
// rubber safety mat granules
const rubberTex = () => tex('pg-rubber', 128, 128, (c, w, h) => {
  const r = rng(91);
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { const k = r(); c.fillStyle = k < .45 ? 'rgba(0,0,0,.18)' : k < .8 ? 'rgba(255,255,255,.9)' : 'rgba(255,220,120,.7)'; c.fillRect(r() * w, r() * h, 1.4, 1.2); }
}, REP);
// roof tiles (기와): convex tile columns along v, a course line every 32 units with the round tile-ends' shadows
const tileTex = () => tex('pg-tile', 256, 256, (c, w, h) => {
  for (let k = 0; k < 8; k++) {
    const x = k * 16, g = c.createLinearGradient(x, 0, x + 16, 0);
    g.addColorStop(0, '#7d8197'); g.addColorStop(.35, '#ffffff'); g.addColorStop(.55, '#f1f1f6'); g.addColorStop(1, '#7d8197');
    c.fillStyle = g; c.fillRect(x, 0, 16, h);
  }
  for (let y = 0; y < h; y += 32) {
    c.fillStyle = 'rgba(30,30,60,.4)'; c.fillRect(0, y, w, 2.4);
    for (let k = 0; k < 8; k++) { c.fillStyle = 'rgba(30,30,60,.2)'; c.beginPath(); c.ellipse(k * 16 + 8, y + 2.4, 7.5, 5, 0, 0, PI); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(0, y + 2.4, w, 1);
  }
}, REP);
// sand: soft blotches, wind ripples, grains and a few pebbles
const sandTex = () => tex('pg-sand', 256, 256, (c, w, h) => {
  const r = rng(201);
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { const rad = 10 + r() * 26, lt = r() < .5; wrap(w, h, r() * w, r() * h, rad, (X, Yy) => { c.fillStyle = lt ? 'rgba(255,255,255,.8)' : 'rgba(150,110,60,.09)'; blob(c, X, Yy, rad); }); }
  c.lineCap = 'round';
  for (let k = 0; k < 9; k++) {
    const y0 = k * h / 9 + r() * 6, ph = r() * 6;
    for (const dy of [-h, 0, h]) for (const [o, st, lw] of [[0, 'rgba(140,100,50,.2)', 1.6], [1.8, 'rgba(255,255,255,.75)', 1]]) {
      c.strokeStyle = st; c.lineWidth = lw; c.beginPath();
      for (let x = 0; x <= w; x += 4) { const y = y0 + dy + o + Math.sin(x / w * PI * 4 + ph) * 3.5; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    }
  }
  for (let i = 0; i < 1400; i++) { c.fillStyle = r() < .55 ? 'rgba(120,80,40,.28)' : 'rgba(255,255,255,.9)'; c.fillRect(r() * w, r() * h, 1.2, 1.2); }
  for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h, a = r() * 3; wrap(w, h, x, y, 4, (X, Yy) => { c.fillStyle = 'rgba(110,90,80,.35)'; c.beginPath(); c.ellipse(X, Yy, 2.6, 1.8, a, 0, PI * 2); c.fill(); }); }
}, REP);
// corrugated steel: ribs along u (they follow an arched roof), panel seams and bolt rows along v
const corrTex = () => tex('pg-corr', 128, 128, (c, w, h) => {
  const n = 8, bh = h / n;
  for (let k = 0; k < n; k++) { const y = k * bh, g = c.createLinearGradient(0, y, 0, y + bh); g.addColorStop(0, '#8d93a6'); g.addColorStop(.4, '#ffffff'); g.addColorStop(.62, '#eef0f4'); g.addColorStop(1, '#8d93a6'); c.fillStyle = g; c.fillRect(0, y, w, bh); }
  c.fillStyle = 'rgba(50,50,70,.4)'; c.fillRect(0, 0, 1.4, h); c.fillRect(w / 2, 0, 1, h);
  c.fillStyle = 'rgba(50,50,70,.5)'; for (let k = 0; k < n; k++) blob(c, w / 4, k * bh + bh * .45, 1.2);
}, REP);
// bricks (greyscale, stretcher bond)
const brickTex = () => tex('pg-brick', 256, 256, (c, w, h) => {
  const r = rng(211), tones = ['#ffffff', '#f2ebe7', '#e6ddd8', '#faf6f3'], rows = 8, rh = h / rows, bw = w / 4;
  c.fillStyle = '#8a7d78'; c.fillRect(0, 0, w, h);
  for (let j = 0; j < rows; j++) for (let k = -1; k < 5; k++) { const x = k * bw + (j % 2) * bw / 2; c.fillStyle = tones[Math.floor(r() * 4)]; roundRect(c, x + 1.3, j * rh + 1.3, bw - 2.6, rh - 2.6, 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x + 3, j * rh + 2, bw - 6, 1.2); }
}, REP);
// tread plate (the slide-tower deck): raised lozenges in a herringbone
const treadTex = () => tex('pg-tread', 128, 128, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  const n = 8;
  for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) wrap(w, h, (k + .5) * w / n + (j % 2) * w / (2 * n), (j + .5) * h / n, 6, (X, Yy) => {
    c.save(); c.translate(X, Yy); c.rotate((j + k) % 2 ? .65 : -.65);
    c.fillStyle = 'rgba(60,60,80,.32)'; roundRect(c, -3.4, -.6, 6.8, 2, 1); c.fill();
    c.fillStyle = 'rgba(255,255,255,.95)'; roundRect(c, -3.4, -1.4, 6.8, 1, .5); c.fill();
    c.restore();
  });
}, REP);
// apartment façade tiles: small ceramic tiles, grout lines, faint rain streaks
const facadeTex = () => tex('pg-facade', 256, 256, (c, w, h) => {
  const r = rng(221), tones = ['#ffffff', '#f6f3ef', '#eeeae5', '#fbf9f6'], cols = 4, rows = 8, tw = w / cols, th = h / rows;
  c.fillStyle = '#c3bab1'; c.fillRect(0, 0, w, h);
  for (let j = 0; j < rows; j++) for (let k = 0; k < cols; k++) { c.fillStyle = tones[Math.floor(r() * 4)]; c.fillRect(k * tw + .9, j * th + .9, tw - 1.8, th - 1.8); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(k * tw + .9, j * th + .9, tw - 1.8, 1.2); }
  for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h * .5, g = c.createLinearGradient(0, y, 0, y + 60); g.addColorStop(0, 'rgba(120,110,100,.12)'); g.addColorStop(1, 'rgba(120,110,100,0)'); c.fillStyle = g; c.fillRect(x, y, 3 + r() * 4, 60); }
}, REP);
// full-colour prints
const ginghamTex = c1 => tex('pg-gingham|' + c1 + '|' + STYLE.mode, 128, 128, (c, w, h) => {
  const a = tint(c1), n = 4, s = w / n;
  c.fillStyle = '#fffaf4'; c.fillRect(0, 0, w, h);
  c.globalAlpha = .45; c.fillStyle = a; for (let k = 0; k < n; k++) { c.fillRect(k * s, 0, s / 2, h); c.fillRect(0, k * s, w, s / 2); }
  c.globalAlpha = 1; for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) c.fillRect(k * s, j * s, s / 2, s / 2);
  c.fillStyle = 'rgba(0,0,0,.05)'; for (let k = 0; k < w; k += 2) { c.fillRect(k, 0, .5, h); c.fillRect(0, k, w, .5); }
}, REP);
const stripeTex = c1 => tex('pg-stripe|' + c1 + '|' + STYLE.mode, 128, 128, (c, w, h) => {
  c.fillStyle = '#fffaf2'; c.fillRect(0, 0, w, h);
  c.fillStyle = tint(c1); c.fillRect(0, 0, w / 2, h);
  c.fillStyle = 'rgba(0,0,0,.05)'; for (let y = 0; y < h; y += 3) c.fillRect(0, y, w, .7);
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(w / 2 - 3, 0, 1.2, h); c.fillRect(w - 3, 0, 1.2, h);
}, REP);
// the chalk 사방치기 court (alpha): the front of the court (+z) is the bottom of the canvas
const hopTex = () => tex('pg-hop', 256, 512, (c, w, h) => {
  const r = rng(231), s = 38, cx = w / 2, y0 = h - 16;
  const fills = ['rgba(255,120,170,.55)', 'rgba(255,205,60,.6)', 'rgba(110,190,240,.6)', 'rgba(100,205,170,.6)', 'rgba(175,150,255,.55)'];
  const inks = ['#e8457a', '#e08a00', '#2f7fd8', '#1f9a74', '#7a5ad8'];
  const cells = []; let y = y0, n = 1;
  for (const pair of [false, true, false, true, false]) {
    y -= s;
    if (pair) { cells.push([cx - s, y, n++]); cells.push([cx, y, n++]); } else cells.push([cx - s / 2, y, n++]);
  }
  const chalk = path => { for (const [st, lw] of [['rgba(70,50,70,.28)', 4.6], ['rgba(255,255,255,.95)', 2.6]]) { c.strokeStyle = st; c.lineWidth = lw; c.lineJoin = 'round'; path(); c.stroke(); } };
  const sky = [cx, y, s * .78];
  c.fillStyle = 'rgba(255,240,160,.6)'; c.beginPath(); c.arc(sky[0], sky[1], sky[2], PI, 0); c.closePath(); c.fill();
  for (const [x, yy, k] of cells) { c.fillStyle = fills[(k - 1) % 5]; c.fillRect(x, yy, s, s); }
  chalk(() => { c.beginPath(); c.arc(sky[0], sky[1], sky[2], PI, 0); c.closePath(); });
  for (const [x, yy] of cells) chalk(() => { c.beginPath(); c.rect(x, yy, s, s); });
  for (const [x, yy, k] of cells) txt(c, String(k), x + s / 2, yy + s / 2 + 1, 24, inks[(k - 1) % 5], { stroke: '#ffffff', sw: 4 });
  txt(c, '하늘', sky[0], sky[1] - 11, 15, '#e8457a', { stroke: '#ffffff', sw: 4 });
  // doodles: a star, a heart, a mochi, a start arrow
  c.fillStyle = 'rgba(255,215,60,.95)'; starPath(c, w - 17, 30, 10, 4.4); c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; c.stroke();
  c.save(); c.translate(17, 150); c.fillStyle = 'rgba(255,120,170,.95)'; c.beginPath(); c.moveTo(0, 7); c.bezierCurveTo(-11, -1, -6, -10, 0, -4); c.bezierCurveTo(6, -10, 11, -1, 0, 7); c.fill(); c.restore();
  mochi(c, 18, 70, 11);
  c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(18, h - 12); c.lineTo(18, h - 40); c.moveTo(11, h - 33); c.lineTo(18, h - 41); c.lineTo(25, h - 33); c.stroke();
  txt(c, '출발', 18, h - 52, 11, '#ffffff', { stroke: 'rgba(70,50,70,.45)', sw: 3 });
  // chalk grain: little holes rubbed out of every stroke
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(0,0,0,${.25 + r() * .4})`; c.fillRect(r() * w, r() * h, .9, .9); }
  c.globalCompositeOperation = 'source-over';
}, { text: true });

// Label atlas, 1024² canvas = 512² drawing units: the ice-cream cart print, four bin labels, the slide-tower panel, the bear
// emblem and flag, the rubber star, three notice-board posters, the ice-cream menu, the charcoal bag, the cat-feeder sign,
// the notice-board header, the 103 sign, the bike-shelter sign, a kid's drawing, the recycling schedule, two windows, the
// juice label, the chalk tin, the 자동문 sticker, the intercom, the flower-bed sign, the 쉼터 plaque, a recycling disc, the
// lamp number, a paw sticker, the 103동 plate and the freezer lid.
const AT = 512, PXU = .5 / 1024;
const RC = (x, y, w, h) => [x / AT + PXU, 1 - (y + h) / AT + PXU, (x + w) / AT - PXU, 1 - y / AT - PXU];
const RG = {
  cart: RC(0, 0, 256, 80), bin0: RC(256, 0, 60, 80), bin1: RC(320, 0, 60, 80), bin2: RC(384, 0, 60, 80), bin3: RC(448, 0, 60, 80),
  panel: RC(0, 84, 128, 64), bear: RC(132, 84, 64, 64), flag: RC(200, 84, 64, 40), star: RC(268, 84, 64, 64),
  lost: RC(336, 84, 56, 72), bazaar: RC(396, 84, 56, 72), rules: RC(456, 84, 56, 76),
  menu: RC(0, 164, 56, 84), bbq: RC(60, 164, 56, 76), feeder: RC(120, 164, 160, 32), header: RC(120, 200, 160, 28),
  apt103: RC(284, 164, 112, 40), shelter: RC(284, 208, 128, 26), kid: RC(400, 164, 56, 40), sched: RC(456, 164, 56, 40),
  win: RC(0, 252, 96, 96), win2: RC(100, 252, 128, 96), juice: RC(232, 252, 56, 96), tin: RC(292, 252, 64, 40),
  auto: RC(292, 296, 64, 24), phone: RC(360, 252, 32, 48), love: RC(396, 252, 64, 32), rest: RC(396, 288, 72, 28),
  recy: RC(468, 252, 40, 40), no: RC(360, 304, 32, 20), paw: RC(468, 296, 40, 40), dong: RC(0, 352, 160, 48), icelid: RC(164, 352, 96, 40), strip: RC(264, 352, 128, 32),
};
function drawCart(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#fff6ee'; c.fillRect(x, y, w, h);
    c.fillStyle = '#ff8fb8'; for (let k = 0; k < w; k += 24) c.fillRect(x + k, y, 12, 9);
    c.fillStyle = '#ff6fa0'; c.fillRect(x, y + h - 14, w, 14);
    c.fillStyle = '#ffffff'; for (let k = 6; k < w; k += 16) blob(c, x + k, y + h - 7, 2.4);
    c.fillStyle = '#ffffff'; roundRect(c, x + 46, y + 15, w - 92, h - 34, 14); c.fill(); c.strokeStyle = '#ffc2d8'; c.lineWidth = 2.5; c.stroke();
    txt(c, '아이스크림', x + w / 2, y + 40, 30, '#ff4f8a', { stroke: '#ffe3ee', sw: 4 });
    cone(c, x + 25, y + 42, 1.25); popsicle(c, x + w - 24, y + 40, 1.05, '#7fd6c0');
    c.fillStyle = '#ffd23f'; starPath(c, x + 60, y + 21, 5, 2.2); c.fill(); starPath(c, x + w - 62, y + 58, 4, 1.8); c.fill();
  });
}
function binIcon(c, k, x, y) {
  c.fillStyle = '#5a6278'; c.strokeStyle = '#5a6278'; c.lineWidth = 1.6;
  if (k === 0) { c.beginPath(); c.ellipse(x, y + 2, 7, 6, 0, 0, PI * 2); c.fill(); c.beginPath(); c.moveTo(x - 3, y - 4); c.lineTo(x - 5, y - 9); c.moveTo(x + 3, y - 4); c.lineTo(x + 5, y - 9); c.stroke(); }
  else if (k === 1) { roundRect(c, x - 4, y - 4, 8, 13, 2); c.fill(); c.fillRect(x - 2, y - 8, 4, 4); }
  else if (k === 2) { roundRect(c, x - 5, y - 7, 10, 15, 2); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(x - 5, y - 3, 10, 2); }
  else { c.fillRect(x - 7, y - 6, 14, 12); c.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) c.fillRect(x - 5, y - 3 + i * 3, 10, 1.2); }
}
function drawBin(c, x, y, w, h, k) {
  const [label, cl] = BINS[k];
  c.fillStyle = tint(cl); c.fillRect(x, y, w, h);
  c.fillStyle = '#ffffff'; roundRect(c, x + 3, y + 3, w - 6, h - 6, 7); c.fill();
  c.fillStyle = tint(cl); roundRect(c, x + 6, y + 6, w - 12, 30, 5); c.fill();
  recycle(c, x + w / 2, y + 21, 8.5, '#ffffff');
  txt(c, label, x + w / 2, y + 48, label.length > 2 ? 12.5 : 17, tint(shade(cl, -.18)));
  binIcon(c, k, x + w / 2, y + 66);
}
function drawPanel(c, x, y, w, h) {
  c.fillStyle = '#ffc23d'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#e8a21f'; c.lineWidth = 4; roundRect(c, x + 3, y + 3, w - 6, h - 6, 8); c.stroke();
  for (let k = 0; k < 3; k++) {
    const cx = x + 27 + k * 37, top = y + 13, bot = y + h - 10;
    c.fillStyle = '#2f8f5a'; c.beginPath(); c.moveTo(cx - 12, bot); c.lineTo(cx - 12, top + 12); c.arc(cx, top + 12, 12, PI, 0); c.lineTo(cx + 12, bot); c.closePath(); c.fill();
    c.fillStyle = '#5fcf8a'; c.beginPath(); c.moveTo(cx - 7, bot - 4); c.lineTo(cx - 7, top + 12); c.arc(cx, top + 12, 7, PI, 0); c.lineTo(cx + 7, bot - 4); c.closePath(); c.fill();
  }
  c.fillStyle = '#c98a1f'; for (const [dx, dy] of [[9, 9], [w - 9, 9], [9, h - 9], [w - 9, h - 9]]) blob(c, x + dx, y + dy, 2.2);
}
function drawStrip(c, x, y, w, h) {
  c.fillStyle = '#ffc23d'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#e8a21f'; c.lineWidth = 3; roundRect(c, x + 2, y + 2, w - 4, h - 4, 6); c.stroke();
  for (let k = 0; k < 4; k++) { const cx = x + 19 + k * 30; c.fillStyle = '#2f8f5a'; blob(c, cx, y + h / 2, 9); c.fillStyle = '#5fcf8a'; blob(c, cx, y + h / 2, 5.5); c.fillStyle = 'rgba(255,255,255,.7)'; blob(c, cx - 2.5, y + h / 2 - 2.5, 1.8); }
  c.fillStyle = '#c98a1f'; for (const dx of [6, w - 6]) for (const dy of [6, h - 6]) blob(c, x + dx, y + dy, 1.6);
}
function drawBear(c, x, y, s) {
  c.fillStyle = '#fff4e2'; c.fillRect(x, y, s, s);
  c.fillStyle = '#ffab4c'; blob(c, x + s / 2, y + s / 2, s / 2 - 1); c.fillStyle = '#fff4e2'; blob(c, x + s / 2, y + s / 2, s / 2 - 6);
  bear(c, x + s / 2, y + s / 2 + 4, 15);
}
function drawFlag(c, x, y, w, h) {
  c.fillStyle = '#ff7a2f'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ffd23f'; c.fillRect(x, y + h - 6, w, 6);
  bear(c, x + w / 2, y + h / 2, 10, '#fff4e2', '#2a1d33', '#ffdcb5');
  c.fillStyle = '#ffffff'; starPath(c, x + 10, y + 10, 4, 1.8); c.fill(); starPath(c, x + w - 10, y + 12, 3.5, 1.5); c.fill();
}
function drawStar(c, x, y, s) {
  c.fillStyle = '#ff9f8a'; c.fillRect(x, y, s, s);
  c.fillStyle = '#ffffff'; for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; blob(c, x + s / 2 + Math.cos(a) * 27, y + s / 2 + Math.sin(a) * 27, 1.6); }
  c.fillStyle = '#ffd23f'; starPath(c, x + s / 2, y + s / 2 + 1, 21, 9); c.fill();
  c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke();
}
function drawLost(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ff5a4a'; c.fillRect(x, y, w, 20);
  txt(c, '고양이를', x + w / 2, y + 7, 8.5, '#ffffff'); txt(c, '찾아요', x + w / 2, y + 15, 8.5, '#ffffff');
  catFace(c, x + w / 2, y + 36, 11);
  c.fillStyle = '#c9c4cf'; for (let i = 0; i < 2; i++) c.fillRect(x + 7, y + 51 + i * 4, w - 14, 1.6);
  c.strokeStyle = '#b9b4c0'; c.lineWidth = .8; c.setLineDash([2, 2]); for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(x + k * w / 5, y + h - 11); c.lineTo(x + k * w / 5, y + h); c.stroke(); } c.setLineDash([]);
  c.fillStyle = '#8a8490'; for (let k = 0; k < 5; k++) c.fillRect(x + k * w / 5 + 4, y + h - 8, w / 5 - 8, 1.4);
}
function drawBazaar(c, x, y, w, h) {
  c.fillStyle = '#c9f0e2'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ffffff'; roundRect(c, x + 4, y + 4, w - 8, 24, 5); c.fill();
  txt(c, '알뜰', x + w / 2, y + 11, 9, '#1f9a74'); txt(c, '바자회', x + w / 2, y + 22, 11, '#ff6b57');
  c.fillStyle = '#ffab4c'; c.beginPath(); c.moveTo(x + 10, y + 36); c.lineTo(x + 18, y + 33); c.lineTo(x + 26, y + 36); c.lineTo(x + 24, y + 41); c.lineTo(x + 22, y + 40); c.lineTo(x + 22, y + 52); c.lineTo(x + 14, y + 52); c.lineTo(x + 14, y + 40); c.lineTo(x + 12, y + 41); c.closePath(); c.fill();
  bear(c, x + 39, y + 44, 7);
  txt(c, '토요일 10시', x + w / 2, y + 62, 8.5, '#2f6f5a');
}
function drawRules(c, x, y, w, h) {
  c.fillStyle = '#e2f2ff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#2f7fd8'; c.fillRect(x, y, w, 22);
  txt(c, '놀이터', x + w / 2, y + 7, 8.5, '#ffffff'); txt(c, '이용 안내', x + w / 2, y + 16, 8.5, '#ffffff');
  const rows = [['#ff6b57', '양보해요'], ['#ffc23d', '뛰지 않기'], ['#45b86b', '깨끗이']];
  rows.forEach(([cc, s], i) => { c.fillStyle = cc; blob(c, x + 9, y + 32 + i * 13, 4); txt(c, s, x + 16, y + 32 + i * 13, 8.5, '#3b4a6a', { align: 'left' }); });
  mochi(c, x + w - 12, y + h - 11, 7);
}
function drawMenu(c, x, y, w, h) {
  c.fillStyle = '#34443c'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#b98252'; c.lineWidth = 3; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  txt(c, '메뉴', x + w / 2, y + 13, 12, '#ffe9a8');
  cone(c, x + 16, y + 36, .9); popsicle(c, x + 40, y + 34, .8, '#ffd23f');
  txt(c, '1000', x + 16, y + 60, 9, '#ffc7d8'); txt(c, '700', x + 40, y + 60, 9, '#ffc7d8');
  txt(c, '♥', x + w / 2, y + h - 10, 10, '#ff9fb5');
}
function drawBBQ(c, x, y, w, h) {
  c.fillStyle = tint(KRAFT); c.fillRect(x, y, w, h);
  c.fillStyle = '#8a3b2a'; c.fillRect(x, y + 6, w, 3);
  bear(c, x + w / 2, y + 26, 10, '#a0643c', '#2a1d33', '#f3c48a');
  txt(c, 'BBQ', x + w / 2, y + 47, 15, '#c8402e');
  txt(c, '참숯', x + w / 2, y + 62, 10, '#5a3a2a');
  c.fillStyle = '#ff7a2f'; for (const dx of [-12, 12]) { c.beginPath(); c.moveTo(x + w / 2 + dx, y + 70); c.quadraticCurveTo(x + w / 2 + dx - 5, y + 64, x + w / 2 + dx, y + 58); c.quadraticCurveTo(x + w / 2 + dx + 5, y + 64, x + w / 2 + dx, y + 70); c.fill(); }
}
function drawFeeder(c, x, y, w, h) {
  c.fillStyle = '#f3c88e'; c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(140,90,50,.25)'; c.lineWidth = 1; for (const yy of [8, 15, 23]) { c.beginPath(); c.moveTo(x, y + yy); c.bezierCurveTo(x + w * .3, y + yy - 2, x + w * .7, y + yy + 2, x + w, y + yy); c.stroke(); }
  c.strokeStyle = '#8a5a34'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
  txt(c, '길고양이 급식소', x + w / 2, y + h / 2 + 1, 16, '#5a3a2a');
  paw(c, x + 11, y + h / 2 + 1, 6, '#ff8fb8'); paw(c, x + w - 11, y + h / 2 + 1, 6, '#ff8fb8');
}
function drawHeader(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#3b8f6a'; c.fillRect(x, y, w, 3); c.fillRect(x, y + h - 3, w, 3);
  txt(c, '단지 게시판', x + w / 2, y + h / 2 + 1, 16, '#2f7a58');
  c.fillStyle = '#6cc46a'; for (const dx of [14, w - 14]) { c.beginPath(); c.ellipse(x + dx, y + h / 2, 6, 3.5, .6, 0, PI * 2); c.fill(); }
}
function drawApt103(c, x, y, w, h) {
  c.fillStyle = '#3e4352'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#6a7084'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, w - 4, h - 4);
  txt(c, '103', x + w / 2, y + h / 2 + 2, 34, '#ffffff');
}
function drawShelter(c, x, y, w, h) {
  c.fillStyle = '#2f6fd6'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#ffffff'; c.lineWidth = 1.8; c.beginPath(); c.arc(x + 14, y + 16, 5, 0, PI * 2); c.arc(x + 30, y + 16, 5, 0, PI * 2); c.stroke();
  c.beginPath(); c.moveTo(x + 14, y + 16); c.lineTo(x + 20, y + 9); c.lineTo(x + 28, y + 9); c.lineTo(x + 30, y + 16); c.moveTo(x + 20, y + 9); c.lineTo(x + 22, y + 16); c.stroke();
  txt(c, '자전거 보관소', x + 82, y + h / 2 + 1, 14, '#ffffff');
}
function drawKid(c, x, y, w, h) {
  c.fillStyle = '#fffdf6'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ffd23f'; blob(c, x + 9, y + 9, 5);
  c.fillStyle = '#ff8f73'; c.beginPath(); c.moveTo(x + 22, y + 22); c.lineTo(x + 30, y + 14); c.lineTo(x + 38, y + 22); c.fill(); c.fillStyle = '#8fd3f4'; c.fillRect(x + 24, y + 22, 12, 10);
  mochi(c, x + 47, y + 28, 6);
  c.strokeStyle = '#6cc46a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 3, y + h - 4); c.quadraticCurveTo(x + w / 2, y + h - 9, x + w - 3, y + h - 4); c.stroke();
}
function drawSched(c, x, y, w, h) {
  c.fillStyle = '#fff6cf'; c.fillRect(x, y, w, h);
  txt(c, '분리수거', x + w / 2, y + 8, 9, '#3b4a6a');
  ['월', '수', '금'].forEach((s, i) => { txt(c, s, x + 12 + i * 16, y + 22, 8, '#3b4a6a'); c.fillStyle = tint(BINS[i + 1][1]); blob(c, x + 12 + i * 16, y + 32, 3.4); });
}
function drawWin(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#a9dcf6'); g.addColorStop(1, '#e3f4fc'); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = '#fff3dc'; for (const sx of [0, 1]) { const cx0 = sx ? x + w - 24 : x; c.fillRect(cx0, y, 24, h); c.fillStyle = 'rgba(200,150,110,.25)'; for (let k = 1; k < 4; k++) c.fillRect(cx0 + k * 6, y, 1.2, h); c.fillStyle = '#fff3dc'; }
    c.fillStyle = '#5fbf62'; blob(c, x + w / 2 - 10, y + h - 20, 9); blob(c, x + w / 2 + 2, y + h - 24, 11); c.fillStyle = '#e88a5c'; c.fillRect(x + w / 2 - 12, y + h - 14, 18, 14);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(x + 30, y); c.lineTo(x + 46, y); c.lineTo(x + 22, y + h); c.lineTo(x + 6, y + h); c.fill();
    c.beginPath(); c.moveTo(x + 54, y); c.lineTo(x + 60, y); c.lineTo(x + 36, y + h); c.lineTo(x + 30, y + h); c.fill();
  });
}
function drawWin2(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#9fd5f2'); g.addColorStop(1, '#dff1fb'); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = '#ffe6b8'; c.fillRect(x, y, 30, h); c.fillStyle = '#d6efe0'; c.fillRect(x + w - 34, y, 34, h);
    c.fillStyle = 'rgba(160,110,70,.2)'; for (let k = 1; k < 5; k++) { c.fillRect(x + k * 6, y, 1.2, h); c.fillRect(x + w - 34 + k * 7, y, 1.2, h); }
    c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x + 52, y + 30); c.lineTo(x + 68, y + 30); c.lineTo(x + 64, y + 18); c.lineTo(x + 56, y + 18); c.fill(); c.fillStyle = '#7a7486'; c.fillRect(x + 59, y + 30, 2, 50);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(x + 40, y); c.lineTo(x + 58, y); c.lineTo(x + 34, y + h); c.lineTo(x + 16, y + h); c.fill();
    c.beginPath(); c.moveTo(x + 92, y); c.lineTo(x + 100, y); c.lineTo(x + 76, y + h); c.lineTo(x + 68, y + h); c.fill();
  });
}
function drawJuice(c, x, y, w, h) {
  c.fillStyle = tint('#ffab4c'); c.fillRect(x, y, w, h);
  c.fillStyle = '#ffffff'; roundRect(c, x + 4, y + 8, w - 8, h - 20, 8); c.fill();
  c.fillStyle = '#4ea85a'; c.beginPath(); c.ellipse(x + w / 2 + 7, y + 22, 7, 3.5, -.5, 0, PI * 2); c.fill();
  c.fillStyle = '#ff9a1f'; blob(c, x + w / 2, y + 38, 15); c.fillStyle = '#ffc56a'; blob(c, x + w / 2, y + 38, 11);
  c.strokeStyle = '#ff9a1f'; c.lineWidth = 1.4; for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; c.beginPath(); c.moveTo(x + w / 2, y + 38); c.lineTo(x + w / 2 + Math.cos(a) * 11, y + 38 + Math.sin(a) * 11); c.stroke(); }
  txt(c, '오렌지', x + w / 2, y + 62, 12, '#ff7a1f');
  txt(c, '100%', x + w / 2, y + 76, 10, '#4ea85a');
  c.fillStyle = '#ffffff'; for (let k = 4; k < w; k += 10) blob(c, x + k, y + h - 6, 1.8);
}
function drawTin(c, x, y, w, h) {
  c.fillStyle = '#4f8fe8'; c.fillRect(x, y, w, h);
  ['#ff6b8a', '#ffc23d', '#7fd6c0', '#ffffff', '#b9a6ff'].forEach((cc, i) => { c.fillStyle = cc; roundRect(c, x + 6 + i * 11, y + 22, 8, 13, 3); c.fill(); });
  txt(c, '분필', x + w / 2, y + 11, 13, '#ffffff');
}
function drawAuto(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; roundRect(c, x, y, w, h, 5); c.fill();
  c.strokeStyle = '#2f7fd8'; c.lineWidth = 2; roundRect(c, x + 2, y + 2, w - 4, h - 4, 4); c.stroke();
  txt(c, '자동문', x + w / 2, y + h / 2 + 1, 12, '#2f7fd8');
  c.fillStyle = '#2f7fd8'; for (const s of [-1, 1]) { const ax = x + w / 2 + s * 26; c.beginPath(); c.moveTo(ax + s * 4, y + h / 2); c.lineTo(ax - s * 2, y + h / 2 - 4); c.lineTo(ax - s * 2, y + h / 2 + 4); c.fill(); }
}
function drawPhone(c, x, y, w, h) {
  c.fillStyle = '#4a4f5e'; c.fillRect(x, y, w, h);
  c.fillStyle = '#9fd5f2'; roundRect(c, x + 6, y + 5, w - 12, 12, 2); c.fill();
  c.fillStyle = '#dde2ea'; for (let j = 0; j < 4; j++) for (let k = 0; k < 3; k++) blob(c, x + 9 + k * 7, y + 23 + j * 5.5, 1.8);
  c.fillStyle = '#7fd6c0'; blob(c, x + w / 2, y + h - 4, 2.4);
}
function drawLove(c, x, y, w, h) {
  c.fillStyle = '#f6e2c0'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#8a5a34'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
  txt(c, '꽃을', x + w / 2 + 6, y + 10, 10, '#5a3a2a'); txt(c, '사랑해요', x + w / 2 + 6, y + 22, 10, '#5a3a2a');
  c.fillStyle = '#ff8fb8'; for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; blob(c, x + 9 + Math.cos(a) * 3.5, y + h / 2 + Math.sin(a) * 3.5, 2.8); } c.fillStyle = '#ffd23f'; blob(c, x + 9, y + h / 2, 2);
}
function drawRest(c, x, y, w, h) {
  c.fillStyle = '#6e4428'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#c98a52'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, w - 4, h - 4);
  txt(c, '쉼터', x + w / 2, y + h / 2 + 1, 16, '#fff1d6');
}
function drawRecy(c, x, y, s) { c.fillStyle = '#ffffff'; c.fillRect(x, y, s, s); recycle(c, x + s / 2, y + s / 2, s * .28, '#45b86b'); }
function drawNo(c, x, y, w, h) { c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h); c.strokeStyle = '#2f7fd8'; c.lineWidth = 1.5; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); txt(c, '07', x + w / 2, y + h / 2 + 1, 12, '#2f7fd8'); }
function drawPawSticker(c, x, y, s) { c.fillStyle = '#fff4e2'; c.fillRect(x, y, s, s); paw(c, x + s / 2, y + s / 2 + 2, 11, '#ff8fb8'); }
function drawDong(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#2f5fa8'; c.fillRect(x, y, 10, h);
  txt(c, '몽글마을', x + 52, y + h / 2 + 1, 15, '#7a8296');
  txt(c, '103동', x + 118, y + h / 2 + 2, 26, '#2f5fa8');
}
function drawIceLid(c, x, y, w, h) {
  c.fillStyle = '#cfeefc'; c.fillRect(x, y, w, h);
  popsicle(c, x + 14, y + 21, .8, '#ff8fb8'); popsicle(c, x + w - 14, y + 21, .8, '#ffd23f');
  txt(c, 'ICE', x + w / 2, y + h / 2 + 1, 20, '#2f7fd8', { stroke: '#ffffff', sw: 4 });
}
const atlas = () => tex('pg-atlas|' + STYLE.mode, 1024, 1024, c => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, AT, AT);
  drawCart(c, 0, 0, 256, 80); for (let k = 0; k < 4; k++) drawBin(c, 256 + k * 64, 0, 60, 80, k);
  drawPanel(c, 0, 84, 128, 64); drawBear(c, 132, 84, 64); drawFlag(c, 200, 84, 64, 40); drawStar(c, 268, 84, 64);
  drawLost(c, 336, 84, 56, 72); drawBazaar(c, 396, 84, 56, 72); drawRules(c, 456, 84, 56, 76);
  drawMenu(c, 0, 164, 56, 84); drawBBQ(c, 60, 164, 56, 76); drawFeeder(c, 120, 164, 160, 32); drawHeader(c, 120, 200, 160, 28);
  drawApt103(c, 284, 164, 112, 40); drawShelter(c, 284, 208, 128, 26); drawKid(c, 400, 164, 56, 40); drawSched(c, 456, 164, 56, 40);
  drawWin(c, 0, 252, 96, 96); drawWin2(c, 100, 252, 128, 96); drawJuice(c, 232, 252, 56, 96); drawTin(c, 292, 252, 64, 40);
  drawAuto(c, 292, 296, 64, 24); drawPhone(c, 360, 252, 32, 48); drawLove(c, 396, 252, 64, 32); drawRest(c, 396, 288, 72, 28);
  drawRecy(c, 468, 252, 40); drawNo(c, 360, 304, 32, 20); drawPawSticker(c, 468, 296, 40); drawDong(c, 0, 352, 160, 48); drawIceLid(c, 164, 352, 96, 40); drawStrip(c, 264, 352, 128, 32);
}, { text: true });
const atlasMat = () => mat('#ffffff', { map: atlas() });
const signMat = () => mat('#ffffff', { map: atlas(), emissive: '#ffffff', ei: .12 });
const glassMat = () => mat('#cdeffa', { opacity: .28 });
const bulbMat = () => mat('#fff3c4', { emissive: '#ffcf6b', ei: .9 });
const hopMat = () => mat('#ffffff', { map: hopTex(), opacity: .97, rim: 0 });

// shared little bits
const tuft = (add, x, z, s = 1, y = 0, c1 = LEAF, c2 = LEAF3) => {
  for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; add(G.cone(.022 * s, .11 * s, 5), k % 2 ? c1 : c2, x + Math.cos(a) * .018 * s, y + .05 * s, z + Math.sin(a) * .018 * s, Math.sin(a) * .35, 0, -Math.cos(a) * .35); }
};
const daisy = (add, x, y, z, s = 1, petal = WHITE, mid = MUSTARD) => {
  for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; add(G.sph(.014 * s, 6, 4), petal, x + Math.cos(a) * .016 * s, y, z + Math.sin(a) * .016 * s, 0, 0, 0, [1, .5, 1]); }
  add(G.sph(.01 * s, 6, 4), mid, x, y + .004 * s, z);
};
const bush = (add, x, y, z, s = 1, cs = [LEAF2, LEAF, LEAF3]) => {
  add(G.sph(.11 * s, 12, 9), cs[0], x, y + .08 * s, z);
  add(G.sph(.085 * s, 10, 8), cs[1], x - .08 * s, y + .06 * s, z + .04 * s);
  add(G.sph(.08 * s, 10, 8), cs[2], x + .07 * s, y + .1 * s, z + .03 * s);
};
// a calico cat (white with orange and dark patches) in the cat's own frame (faces +z): 'loaf' sits, 'nap' lies curled
function calico(addM, M, pose = 'loaf') {
  const L = (g, c, x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => addM(g, M.clone().multiply(xf(x, y, z, rx, ry, rz, s)), c);
  const W = '#fffaf2', O = '#ffab4c', D = '#5a4a48';
  const nap = pose === 'nap', hy = nap ? .09 : .19, hz = nap ? .11 : .09, hx = nap ? .1 : 0;
  if (nap) {
    L(G.sph(.1, 14, 10), W, 0, .07, 0, 0, 0, 0, [1.35, .7, 1]);
    L(G.sph(.06, 10, 8), O, -.07, .11, -.02, 0, 0, 0, [1.3, .45, 1]);
    L(G.sph(.045, 10, 8), D, .03, .115, .03, 0, 0, 0, [1.2, .4, 1]);
    L(G.tor(.1, .022, PI * .9, 5, 14), O, -.02, .03, .04, HP, 0, .6);
    for (const s of [-1, 1]) L(G.sph(.028, 8, 6), W, hx + .02 + s * .03, .03, hz + .04, 0, 0, 0, [1, .7, 1.3]);
  } else {
    L(G.sph(.1, 14, 10), W, 0, .09, -.01, 0, 0, 0, [1, .9, 1.15]);
    L(G.sph(.06, 10, 8), O, -.04, .15, -.05, 0, 0, 0, [1.2, .5, 1.3]);
    L(G.sph(.045, 10, 8), D, .05, .13, -.08, 0, 0, 0, [1, .5, 1.2]);
    L(G.tor(.1, .022, PI * .85, 5, 14), O, 0, .025, 0, HP, 0, -.3);
    for (const s of [-1, 1]) L(G.sph(.028, 8, 6), W, s * .04, .02, .1, 0, 0, 0, [1, .7, 1.3]);
  }
  L(G.sph(.075, 14, 10), W, hx, hy, hz, 0, 0, 0, [1.12, .92, 1]);
  L(G.sph(.042, 10, 8), O, hx - .045, hy + .035, hz - .01, 0, 0, 0, [1, .7, 1]);
  for (const s of [-1, 1]) {
    L(G.cone(.03, .06, 4), s < 0 ? O : D, hx + s * .045, hy + .065, hz - .01, 0, PI / 4, -s * .3);
    L(G.tor(.014, .0045, PI, 3, 8), INK, hx + s * .028, hy + .006, hz + .068, 0, 0, PI);
    L(G.sph(.012, 6, 4), BLUSH, hx + s * .05, hy - .014, hz + .062, 0, 0, 0, [1, .6, .4]);
  }
  L(G.sph(.033, 8, 6), W, hx, hy - .026, hz + .052, 0, 0, 0, [1.25, .7, .6]);
  L(G.sph(.009, 6, 4), '#ff8a9a', hx, hy - .01, hz + .074);
}

const B = {};

// ═════════════════════════════════════════════ PLAY EQUIPMENT ═════════════════════════════════════════════
// 미끄럼틀 놀이탑 (2×2): a square tower on blue posts — a tread-plate deck, a yellow back panel with green arches and a
// red steering wheel, top rails, a red pyramid roof with the bear emblem and a bear flag; a red slide with a white bed
// runs to the front onto a green rubber mat, a yellow tube slide spirals down the left side to the front, and a grey
// climbing wall with coloured holds leans on the right. Something can hide under the deck or inside the tube's mouth.
B.slidetower = (f, T) => {
  const tw = col(T, 'tower'), pn = col(T, 'panel'), sl = col(T, 'slide'), tb = col(T, 'tube'), conc = col(T, 'concrete'), tk = [tw, pn, sl, tb, conc].join(',');
  const TX = -.05, TZ = -.42, HS = .4, PH = .74, RB = 1.5, RH = .42, RA = .52;
  const X0 = TX - HS + .04, X1 = TX + HS - .04, Z0 = TZ - HS + .04, Z1 = TZ + HS - .04;
  const SW = .36, SZ0 = TZ + HS - .04, SZ1 = .9, SY1 = .13, BED = '#fff3e6', TOP = PH + .008;
  const path = [[TOP, SZ0 - .07]];
  for (let i = 0; i <= 16; i++) { const s = i / 16; path.push([SY1 + (TOP - SY1) * Math.pow(1 - s, 1.8), SZ0 + s * (SZ1 - SZ0)]); }
  const yAt = z => { const s = Math.min(1, Math.max(0, (z - SZ0) / (SZ1 - SZ0))); return SY1 + (TOP - SY1) * Math.pow(1 - s, 1.8); };
  const curve = new THREE.CatmullRomCurve3([[-.44, .9, -.46], [-.62, .87, -.56], [-.8, .76, -.43], [-.83, .58, -.12], [-.79, .4, .22], [-.75, .26, .5], [-.72, .2, .74]].map(v3));
  const TR = .14, TI = TR - .018;
  const CX0 = TX + HS, CX1 = .93, CA = Math.atan2(PH, CX1 - CX0), CL = Math.hypot(PH, CX1 - CX0), CW = .56;
  const CM = xf((CX0 + CX1) / 2, PH / 2, TZ, 0, 0, -CA);
  const at = (M, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(M).toArray();
  f.add(mc('slidetower|' + tk, ({ add, addM, tube }) => {
    for (const x of [X0, X1]) for (const z of [Z0, Z1]) { add(G.cyl(.045, .05, RB, 14), tw, x, RB / 2, z); add(G.cyl(.075, .08, .05, 16), conc, x, .025, z); }
    const RY = PH + .44;
    tube([X0, RY, Z0], [X1, RY, Z0], .022, tw, 8); tube([X0, RY, Z1], [X1, RY, Z1], .022, tw, 8);
    tube([X0, RY, Z0], [X0, RY, Z1], .022, tw, 8); tube([X1, RY, Z0], [X1, RY, Z1], .022, tw, 8);
    tube([X0, .3, Z0], [X1, .3, Z0], .02, tw, 8); tube([X0, .3, Z0], [X0, .3, Z1], .02, tw, 8);
    add(G.box(X1 - X0 - .05, .14, .03, .01), pn, TX, PH + .37, Z1);
    for (const x of [X0, X1]) add(G.box(.03, .14, Z1 - Z0 - .05, .01), pn, x, PH + .37, TZ);
    // back panel with a steering wheel
    add(G.box(X1 - X0 - .05, .42, .03, .012), pn, TX, PH + .21, Z0);
    const wx = TX + .17, wy = PH + .25, wz = Z0 + .085;
    add(G.cyl(.012, .012, .07, 8), STEEL2, wx, wy, Z0 + .05, HP, 0, 0);
    add(G.tor(.07, .014, PI * 2, 6, 22), TOMATO, wx, wy, wz);
    add(G.sph(.024, 10, 8), MUSTARD, wx, wy, wz);
    for (let k = 0; k < 3; k++) { const a = HP + k * PI * 2 / 3; add(G.box(.064, .014, .012, .004), TOMATO, wx + Math.cos(a) * .035, wy + Math.sin(a) * .035, wz, 0, 0, a); }
    // the slide: a white bed between red side walls, on two short legs and a middle post
    addM(sweepBox(path, TX - SW / 2, TX + SW / 2, -.03, 0), I4, BED);
    addM(sweepBox(path, TX - SW / 2 - .035, TX - SW / 2, -.05, .08), I4, sl);
    addM(sweepBox(path, TX + SW / 2, TX + SW / 2 + .035, -.05, .08), I4, sl);
    for (const sx of [-1, 1]) tube([TX + sx * .13, 0, .84], [TX + sx * .13, yAt(.84) - .03, .84], .02, tw, 8);
    tube([TX, 0, .38], [TX, yAt(.38) - .04, .38], .026, tw, 8);
    for (const sx of [-1, 1]) { tube([TX + sx * (SW / 2 + .07), PH, Z1 + .03], [TX + sx * (SW / 2 + .07), PH + .3, Z1 + .03], .018, tw, 8); add(G.sph(.03, 10, 8), MUSTARD, TX + sx * (SW / 2 + .07), PH + .3, Z1 + .03); }
    // tube slide: yellow outside, light inside, blue joint rings, two posts
    addM(new THREE.TubeGeometry(curve, 48, TR, 16, false), I4, tb);
    addM(inward(new THREE.TubeGeometry(curve, 48, TI, 16, false)), I4, shade(tb, .16));
    for (const u of [0, .25, .5, .75, 1]) { const end = u === 0 || u === 1; addM(G.tor(end ? (TR + TI) / 2 : TR + .003, end ? .022 : .016, PI * 2, 6, 26), along(curve.getPointAt(u), curve.getTangentAt(u), ZA), tw); }
    for (const u of [.45, .76]) { const p = curve.getPointAt(u); tube([p.x, 0, p.z], [p.x, p.y - TR + .01, p.z], .024, tw, 8); add(G.cyl(.05, .055, .03, 12), conc, p.x, .015, p.z); }
    // climbing wall rails, holds and grab bars
    for (const s of [-1, 1]) tube(at(CM, -CL / 2 - .01, .045, s * (CW / 2 + .03)), at(CM, CL / 2 + .01, .045, s * (CW / 2 + .03)), .022, tw, 8);
    const HC = [TOMATO, MUSTARD, SKY, MINT, LILAC, PINK];
    for (let k = 0; k < 12; k++) {
      const u = -CL / 2 + .12 + (k % 4) * (CL - .24) / 3 + (Math.floor(k / 4) % 2) * .06, z = -CW / 2 + .1 + Math.floor(k / 4) * (CW - .2) / 2;
      addM(stoneGeo(k + 3, .3), CM.clone().multiply(xf(u, .03, z, 0, k, 0, [.042, .03, .036])), HC[k % 6]);
    }
    for (const s of [-1, 1]) { tube([CX0 - .02, PH, TZ + s * (CW / 2 + .05)], [CX0 - .02, PH + .32, TZ + s * (CW / 2 + .05)], .018, tw, 8); add(G.sph(.03, 10, 8), MUSTARD, CX0 - .02, PH + .32, TZ + s * (CW / 2 + .05)); }
    // roof: a red pyramid with light hip lines on a cream eave board, a finial and the bear flag
    add(G.box(2 * RA + .04, .05, 2 * RA + .04, .015), CREAM, TX, RB - .02, TZ);
    add(G.cone(RA * Math.SQRT2, RH, 4), sl, TX, RB + RH / 2, TZ, 0, PI / 4, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tube([TX + sx * RA, RB + .006, TZ + sz * RA], [TX, RB + RH, TZ], .016, shade(sl, .2), 6);
    add(G.sph(.04, 10, 8), MUSTARD, TX, RB + RH, TZ);
    tube([TX, RB + RH, TZ], [TX, RB + RH + .4, TZ], .012, WHITE, 6); add(G.sph(.022, 8, 6), MUSTARD, TX, RB + RH + .41, TZ);
    add(G.box(.22, .14, .008, .003), '#ff7a2f', TX + .12, RB + RH + .31, TZ);
  }));
  f.add(mt('slidetower-deck|' + tk, treadTex(), ({ add }) => add(G.box(2 * HS - .03, .06, 2 * HS - .03, .012), '#b8c2d6', TX, PH - .03, TZ, 0, 0, 0, 1, { w: .3 })));
  f.add(mt('slidetower-wall|' + tk, speckleTex(), ({ addM }) => addM(G.box(CL + .02, .05, CW, .015), CM, '#a9b4c8', .5)));
  f.add(mt('slidetower-mat|' + tk, rubberTex(), ({ add }) => add(G.cyl(.34, .34, .014, 36), '#5cbf6a', TX, .007, .62, 0, 0, 0, 1, { w: .3 })));
  f.add(mg('slidetower-prints', atlasMat(), ({ add }) => {
    add(quadGeo(X1 - X0 - .14, .36, RG.panel), TX, PH + .21, Z0 + .015 + .006);
    const n = new THREE.Vector3(0, RA, RH).normalize(), ph = Math.atan2(n.y, n.z), t0 = .4;
    add(circGeo(.13, RG.bear), TX, RB + t0 * RH + n.y * .007, TZ + RA * (1 - t0) + n.z * .007, -ph, 0, 0);
    add(quadGeo(X1 - X0 - .1, .12, RG.strip), TX, PH + .37, Z1 + .015 + .006);
    add(quadGeo(Z1 - Z0 - .1, .12, RG.strip), X1 + .015 + .006, PH + .37, TZ, 0, HP, 0);
    add(quadGeo(Z1 - Z0 - .1, .12, RG.strip), X0 - .015 - .006, PH + .37, TZ, 0, -HP, 0);
    for (const s of [1, -1]) add(quadGeo(.2, .125, RG.flag), TX + .12, RB + RH + .31, TZ + s * (.004 + .006), 0, s > 0 ? 0 : PI, 0);
  }));
  f.spot('under', null, TX + .04, 0, TZ + .1, { maxH: .45, label: '놀이탑 밑', scale: .8 });
  const q = curve.getPointAt(.965);
  f.spot('under', null, q.x, q.y - TI + .004, q.z, { maxH: .2, label: '튜브 미끄럼틀 안', scale: .7 });
};

// 그네 (2×1): a green A-frame with yellow end caps on concrete feet, two seats (navy and red) on chains, a blue bird on the
// beam; rubber pads under the seats (the red seat's pad has a star).
B.swings2 = (f, T) => {
  const sw = col(T, 'swing'), conc = col(T, 'concrete'), tk = [sw, conc].join(',');
  const BY = 1.42, LX = .87, SX = [-.42, .42], SY = .42, FX = .93, FZ = .38;
  const leg = (sx, sz, y) => { const t = (BY - y) / BY; return [sx * (LX + (FX - LX) * t), y, sz * FZ * t]; };
  f.add(mc('swings2|' + tk, ({ add, tube }) => {
    tube([-.95, BY, 0], [.95, BY, 0], .045, sw, 12);
    for (const sx of [-1, 1]) {
      add(G.sph(.055, 12, 8), MUSTARD, sx * .955, BY, 0);
      add(G.cyl(.062, .062, .1, 14), shade(sw, -.12), sx * LX, BY, 0, 0, 0, HP);
      for (const sz of [-1, 1]) { tube(leg(sx, sz, BY), leg(sx, sz, .02), .04, sw, 10); add(G.box(.13, .05, .13, .015), conc, ...leg(sx, sz, .025)); }
      tube(leg(sx, -1, .55), leg(sx, 1, .55), .028, sw, 8);
    }
    SX.forEach((x, i) => {
      const sc = i ? '#ff5a4a' : NAVY;
      for (const dx of [-.15, .15]) {
        add(G.box(.05, .03, .1, .01), STEEL2, x + dx, BY - .055, 0);
        tube([x + dx, BY - .06, 0], [x + dx, SY + .03, 0], .007, STEEL, 5);
        for (let k = 0; k < 12; k++) add(G.tor(.014, .004, PI * 2, 3, 6), STEEL2, x + dx, BY - .1 - k * .075, 0, 0, (k % 2) * HP, 0);
        add(G.box(.03, .04, .05, .008), STEEL2, x + dx, SY + .035, 0);
      }
      add(G.box(.36, .045, .15, .02), sc, x, SY, 0);
      add(G.cyl(.24, .24, .012, 30), i ? '#ff9f8a' : '#9fd3f4', x, .006, 0);
    });
    // a blue bird on the beam
    const bx = .06, by = BY + .045;
    add(G.sph(.042, 12, 8), '#4f9be8', bx, by + .02, 0, 0, 0, 0, [1, .9, 1.3]);
    add(G.sph(.03, 10, 8), WHITE, bx, by + .012, .022, 0, 0, 0, [1, .9, .8]);
    add(G.sph(.03, 10, 8), '#4f9be8', bx, by + .068, .03);
    add(G.cone(.012, .03, 6), MUSTARD, bx, by + .064, .065, HP, 0, 0);
    for (const s of [-1, 1]) { add(G.sph(.006, 6, 4), INK, bx + s * .02, by + .075, .052); add(G.cyl(.003, .003, .03, 4), ORANGE, bx + s * .012, by - .002, .005); add(G.sph(.022, 8, 6), shade('#4f9be8', -.1), bx + s * .036, by + .025, -.005, 0, 0, 0, [.4, .8, 1.2]); }
    add(G.box(.03, .008, .06, .004), shade('#4f9be8', -.1), bx, by + .03, -.06, -.5, 0, 0);
  }));
  f.add(mg('swings2-star', atlasMat(), ({ addM }) => addM(discGeo(.19, RG.star), xf(SX[1], .012 + .006, 0))));
  f.spot('under', null, SX[1], .012, 0, { maxH: .34, label: '그네 밑', scale: .8 });
};

// 시소 (2×1): a mustard plank with red seat pads and blue handles, balanced on a green stand with blue axle caps; a
// half-buried tyre under each end. Something can hide under the high side, next to the stand.
B.seesaw2 = (f, T) => {
  const ss = col(T, 'seesaw'), sw = col(T, 'swing'), tw = col(T, 'tower'), conc = col(T, 'concrete'), tk = [ss, sw, tw, conc].join(',');
  const PY = .42, AY = .37, a = .266, L = 1.84, PT = .06, M = xf(0, PY, 0, 0, 0, a);
  const housing = new THREE.Shape(); housing.moveTo(-.18, 0); housing.lineTo(.18, 0); housing.lineTo(.08, AY); housing.absarc(0, AY, .08, 0, PI, false); housing.lineTo(-.18, 0);
  f.add(mt('seesaw2-base|' + tk, speckleTex(), ({ add }) => add(G.box(.52, .04, .42, .012), conc, 0, .02, 0)));
  f.add(mc('seesaw2|' + tk, ({ add, addM }) => {
    add(G.ext(housing, .26, 0, 10), sw, 0, 0, -.13);
    add(G.cyl(.03, .03, .34, 12), STEEL2, 0, AY, 0, HP, 0, 0);
    for (const s of [-1, 1]) add(G.cyl(.065, .065, .02, 18), tw, 0, AY, s * .14, HP, 0, 0);
    const P = (g, c, x, y, z, rx, ry, rz, s) => addM(g, M.clone().multiply(xf(x, y, z, rx, ry, rz, s)), c);
    P(G.box(L, PT, .22, .025), ss, 0, 0, 0);
    P(G.box(.22, .05, .2, .012), STEEL2, 0, -PT / 2 - .02, 0);
    for (const s of [-1, 1]) {
      P(G.box(.3, .035, .24, .016), '#ff5a4a', s * (L / 2 - .17), PT / 2 + .0175, 0);
      const hx = s * (L / 2 - .42);
      for (const z of [-.08, .08]) P(G.cyl(.016, .016, .1, 8), tw, hx, PT / 2 + .05, z);
      P(G.tor(.08, .018, PI, 6, 14), tw, hx, PT / 2 + .1, 0, 0, HP, 0);
      P(G.box(.04, .012, .2, .005), shade(ss, -.12), s * .5, PT / 2 + .001, 0);
    }
    for (const s of [-1, 1]) { add(G.tor(.1, .045, PI * 2, 8, 22), RUBBER, s * .86, .004, 0); add(G.tor(.1, .012, PI * 2, 4, 22), '#55506a', s * .86, .004, .045); }
  }));
  f.spot('under', null, .36, 0, .04, { maxH: .4, label: '시소 밑', scale: .8 });
};

// 모래놀이터 (2×2): a concrete curb capped with wooden boards round a pit of rippled sand — a sandcastle with towers and
// a flag (lift it and there is a hollow underneath), a red bucket (something can sit in it), a toy dump truck, a yellow
// rake, a green watering can and star-shaped sand pies.
B.sandbox2 = (f, T) => {
  const conc = col(T, 'concrete'), wood = col(T, 'wood'), sand = col(T, 'sand'), tk = [conc, wood, sand].join(',');
  const O = .94, CW = .14, CH = .2, SY = .15, IN = O - CW;
  const CX = -.18, CZ = -.12, BX = .42, BZ = .36;
  f.add(mt('sandbox2-curb|' + tk, speckleTex(), ({ add }) => {
    for (const s of [-1, 1]) { add(G.box(2 * O, CH, CW, .02), conc, 0, CH / 2, s * (O - CW / 2)); add(G.box(CW, CH, 2 * IN, .02), conc, s * (O - CW / 2), CH / 2, 0); }
  }));
  f.add(mt('sandbox2-cap|' + tk, plankTex(), ({ add }) => {
    for (const s of [-1, 1]) { add(G.box(2 * O + .02, .04, CW + .04, .012), wood, 0, CH + .02, s * (O - CW / 2), 0, 0, 0, 1, .5); add(G.box(2 * IN - .04, .04, CW + .04, .012), shade(wood, -.04), s * (O - CW / 2), CH + .02, 0, 0, HP, 0, 1, .5); }
  }));
  f.add(mt('sandbox2-sand|' + tk, sandTex(), ({ add }) => {
    add(G.box(2 * IN - .004, SY, 2 * IN - .004, .01), sand, 0, SY / 2, 0, 0, 0, 0, 1, { w: .7 });
    for (const [x, z, r] of [[.5, -.45, .16], [-.55, .2, .2], [.1, .55, .14]]) add(G.sph(r, 14, 8), shade(sand, -.03), x, SY - r * .72, z, 0, 0, 0, 1, { w: .7 });
  }));
  f.add(mc('sandbox2|' + tk, ({ add, addM, tube }) => {
    // red bucket (open, with a wire handle)
    add(G.lathe([[0, 0], [.095, 0], [.12, .15], [.13, .155], [.13, .165], [.112, .165], [.088, .012], [0, .012]], 22), TOMATO, BX, SY, BZ);
    add(G.tor(.12, .006, PI, 4, 14), STEEL, BX, SY + .16, BZ, -.5, 0, 0);
    for (const s of [-1, 1]) add(G.sph(.014, 8, 6), MUSTARD, BX + s * .122, SY + .15, BZ);
    // toy dump truck
    const TXx = -.52, TZz = .45, ry = .5, Mt = xf(TXx, SY, TZz, 0, ry, 0), P = (g, c, x, y, z, rx, ry2, rz, s) => addM(g, Mt.clone().multiply(xf(x, y, z, rx, ry2, rz, s)), c);
    P(G.box(.12, .1, .14, .02), '#ff5a4a', .1, .085, 0); P(G.box(.07, .05, .12, .01), '#cfeefc', .12, .12, 0);
    P(G.box(.2, .03, .15, .01), CHAR, 0, .045, 0); P(G.box(.18, .09, .16, .015), YELLOW, -.06, .1, 0, 0, 0, .25);
    for (const x of [-.08, .1]) for (const s of [-1, 1]) P(G.cyl(.035, .035, .025, 14), RUBBER, x, .035, s * .08, HP, 0, 0);
    // yellow rake, green watering can
    const RK = xf(-.02, SY + .02, .5, 0, -.36, 0);
    tube([.0, SY + .02, .5 + .007], [.32, SY + .02, .62], .012, '#3f9be0', 6);
    addM(G.box(.04, .02, .16, .006), RK, '#3f9be0');
    for (let k = 0; k < 5; k++) addM(G.box(.014, .02, .014, .003), RK.clone().multiply(xf(-.026, -.012, -.064 + k * .032)), '#3f9be0');
    const wx = -.6, wz = -.5;
    add(G.cyl(.065, .07, .13, 16), '#45b86b', wx, SY + .065, wz);
    tube([wx + .05, SY + .05, wz], [wx + .16, SY + .15, wz], .014, '#45b86b', 8); add(G.cyl(.03, .02, .03, 10), '#45b86b', wx + .17, SY + .16, wz, 0, 0, -.9);
    add(G.tor(.05, .012, PI, 5, 10), shade('#45b86b', -.1), wx - .03, SY + .13, wz, 0, 0, .4);
    // star sand pies
    for (const [x, z, r, c] of [[.48, -.42, .4, '#3f86e0'], [.26, -.6, 1.2, shade(sand, -.16)], [.66, -.16, .2, PINK]]) add(G.ext(starShape(.075, .036), .045, .006, 2), c, x, SY - .004, z, -HP, 0, r);
    // shells round the curb
    for (const [x, z] of [[-.7, -.68], [.72, .7], [-.3, .72]]) add(G.sph(.022, 8, 6), BLUSH, x, SY + .004, z, 0, x, 0, [1.2, .5, 1]);
  }));
  const cv = new THREE.Group(); cv.position.set(CX, SY, CZ);
  cv.add(mt('sandbox2-castle|' + sand, sandTex(), ({ add }) => {
    const c1 = shade(sand, -.05), c2 = shade(sand, -.09), c3 = shade(sand, -.13);
    add(G.cyl(.22, .26, .05, 20), c1, 0, .025, 0);
    add(G.box(.22, .16, .22, .02), c2, 0, .13, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(G.cyl(.052, .058, .22, 12), c1, sx * .12, .16, sz * .12); add(G.cone(.07, .09, 10), c3, sx * .12, .315, sz * .12); }
    for (let k = 0; k < 4; k++) { const a = k * HP; add(G.box(.05, .04, .05, .01), c1, Math.cos(a) * .075, .23, Math.sin(a) * .075); }
    add(G.cyl(.055, .065, .14, 12), c1, 0, .28, 0); add(G.cone(.075, .11, 12), c3, 0, .405, 0);
  }));
  cv.add(mc('sandbox2-castledeco', ({ add, tube }) => {
    add(G.box(.07, .09, .012, .004), '#9a6a3a', 0, .095, .11 + .006);
    for (let k = 0; k < 4; k++) add(G.sph(.016, 8, 6), [BLUSH, WHITE, SKY, BLUSH][k], -.15 + k * .1, .055, .2 - (k % 2) * .03, 0, k, 0, [1.2, .55, 1]);
    tube([0, .44, 0], [0, .56, 0], .006, WHITE, 4);
    add(G.box(.07, .045, .004, .001), '#ff5a4a', .036, .53, 0);
  }));
  f.add(cv);
  const p = f.part('lift', cv, (t, b) => { cv.position.y = b.p.y + .48 * t; cv.position.x = b.p.x + .1 * t; cv.rotation.z = -.32 * t; }, { label: '모래성', sfx: 'lift' });
  f.spot('inside', null, CX, SY, CZ, { part: p, maxH: .3, label: '모래성 밑', scale: .7 });
  f.spot('under', null, BX, SY + .012, BZ, { maxH: .2, label: '모래 양동이 안', scale: .6 });
};

// 스프링 놀이기구 (1×1): a blue horse on a big dark spring — yellow mane, saddle and tail, red handle and foot pegs, dot
// eyes and a pale snout — on a round concrete pad. Something can hide behind it.
B.springrider = (f, T) => {
  const rc = col(T, 'rider'), conc = col(T, 'concrete'), tk = [rc, conc].join(',');
  const z0 = -.02, HY = .44, lt = shade(rc, .18);
  f.add(mt('springrider-base|' + tk, speckleTex(), ({ add }) => add(G.cyl(.3, .32, .05, 28), conc, 0, .025, z0)));
  f.add(mc('springrider|' + tk, ({ add, addM, tube }) => {
    add(G.cyl(.11, .12, .02, 18), CHAR, 0, .06, z0);
    addM(new THREE.TubeGeometry(new Helix(.088, .07, .285, 3.2), 80, .018, 6, false), xf(0, 0, z0), CHAR);
    add(G.cyl(.1, .1, .03, 18), CHAR, 0, .295, z0);
    // body, neck, head
    add(G.cap(.13, .2, 4, 12), rc, 0, HY, z0 - .02, HP, 0, 0);
    tube([0, HY + .02, z0 + .1], [0, HY + .17, z0 + .19], .085, rc, 12);
    add(G.sph(.1, 14, 10), rc, 0, HY + .21, z0 + .21, 0, 0, 0, [.9, 1, 1.1]);
    add(G.sph(.075, 12, 8), lt, 0, HY + .17, z0 + .31, 0, 0, 0, [1, .85, 1]);
    for (const s of [-1, 1]) {
      add(G.sph(.009, 6, 4), CHAR, s * .03, HY + .175, z0 + .375);
      add(G.cone(.03, .07, 6), rc, s * .05, HY + .31, z0 + .17, -.2, 0, -s * .25);
      add(G.sph(.017, 8, 6), INK, s * .078, HY + .235, z0 + .25, 0, 0, 0, [.5, 1.2, 1]);
      add(G.sph(.006, 6, 4), WHITE, s * .085, HY + .245, z0 + .255);
      add(G.sph(.016, 8, 6), BLUSH, s * .075, HY + .19, z0 + .29, 0, 0, 0, [.4, .7, 1]);
    }
    // mane, tail, saddle, pegs, little legs
    for (let k = 0; k < 6; k++) add(G.sph(.035, 8, 6), MUSTARD, 0, HY + .3 - k * .045, z0 + .15 - k * .035, 0, 0, 0, [.7, 1, 1]);
    for (let k = 0; k < 3; k++) add(G.cone(.03, .13, 6), MUSTARD, (k - 1) * .02, HY + .02, z0 - .2, -2.2 + k * .2, 0, (k - 1) * .2);
    add(G.box(.2, .04, .2, .02), MUSTARD, 0, HY + .13, z0 - .04);
    add(G.box(.22, .015, .03, .005), '#ff5a4a', 0, HY + .14, z0 + .05);
    add(G.cyl(.016, .016, .3, 8), STEEL, 0, HY + .2, z0 + .2, 0, 0, HP);
    for (const s of [-1, 1]) { add(G.sph(.035, 10, 8), '#ff5a4a', s * .15, HY + .2, z0 + .2, 0, 0, 0, [1.3, 1, 1]); add(G.cyl(.018, .018, .1, 8), '#ff5a4a', s * .16, HY - .08, z0 - .02, 0, 0, HP); add(G.sph(.026, 8, 6), '#ff5a4a', s * .21, HY - .08, z0 - .02); }
    for (const sz of [-1, 1]) for (const s of [-1, 1]) add(G.sph(.04, 8, 6), shade(rc, -.08), s * .06, HY - .1, z0 + sz * .12, 0, 0, 0, [.8, 1.1, .9]);
    tuft(add, .32, .32, .9); tuft(add, -.34, .26, .8, 0, LEAF2, LEAF);
  }));
  f.spot('behind', null, 0, 0, -.42, { maxH: .45, label: '스프링 말 뒤', scale: .7 });
};

// ═════════════════════════════════════════════ COMPLEX FURNITURE ═════════════════════════════════════════════
// 단지 정자 (2×2): a wooden pavilion — a plank floor raised on beams and stone footings, honey posts with lintels and a
// 쉼터 plaque, low lattice railings with the front left open, brick steps, and a dark hip-and-ridge tiled roof with
// upturned corners and dark ridges; cushions, a thermos tray and a fan on the floor; a calico cat naps on the ridge.
B.pavilion2 = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), tile = col(T, 'roofTile'), stone = col(T, 'stone'), brick = col(T, 'brick'), tk = [wood, woodD, tile, stone, brick].join(',');
  const CZ = -.1, FY = .5, DX = .84, DZ = .72, PX = .74, PZ = .62, YE = 1.64, AX = .98, AZ = .86, RL = .4, YR = 2.12, LY = YE - .14;
  const POST = shade(wood, -.12), RIDGE = shade(tile, .2);
  const E = (sx, sz) => [sx * AX, YE, CZ + sz * AZ], R = sx => [sx * RL, YR, CZ];
  f.add(mt('pavilion2-floor|' + tk, plankTex(), ({ add }) => add(G.box(2 * DX, .07, 2 * DZ, .015), wood, 0, FY - .035, CZ, 0, 0, 0, 1, .5)));
  f.add(mt('pavilion2-wood|' + tk, grainTex(), ({ add }) => {
    for (const s of [-1, 1]) { add(G.box(2 * DX - .06, .06, .06, .012), woodD, 0, FY - .1, CZ + s * (DZ - .05), 0, 0, 0, 1, .5); add(G.box(2 * DZ - .06, .06, .06, .012), woodD, s * (DX - .05), FY - .1, CZ, 0, HP, 0, 1, .5); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.055, .06, LY - FY, 14), POST, sx * PX, (LY + FY) / 2, CZ + sz * PZ, 0, 0, 0, 1, [2 * PI * .06 / .3, (LY - FY) / .3, true]);
    for (const s of [-1, 1]) { add(G.box(2 * PX + .14, .1, .08, .012), woodD, 0, LY + .05, CZ + s * PZ, 0, 0, 0, 1, .5); add(G.box(2 * PZ + .14, .1, .08, .012), woodD, s * PX, LY + .05, CZ, 0, HP, 0, 1, .5); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(G.box(.16, .05, .05, .01), POST, sx * (PX - .08), LY - .03, CZ + sz * PZ, 0, 0, 0, 1, .5); add(G.box(.16, .05, .05, .01), POST, sx * PX, LY - .03, CZ + sz * (PZ - .08), 0, HP, 0, 1, .5); }
    add(G.box(2 * AX - .1, .04, 2 * AZ - .1, .012), wood, 0, YE - .045, CZ, 0, 0, 0, 1, .5);
    // railings on the back, both sides and the two front corners
    const rail = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      add(G.box(len, .04, .05, .012), woodD, cx, FY + .3, cz, 0, ry, 0, 1, .5);
      add(G.box(len, .03, .04, .01), woodD, cx, FY + .06, cz, 0, ry, 0, 1, .5);
      const n = Math.max(2, Math.round(len / .12));
      for (let k = 1; k < n; k++) { const u = k / n; add(G.box(.024, .22, .024, .006), wood, x0 + (x1 - x0) * u, FY + .18, z0 + (z1 - z0) * u, 0, 0, 0, 1, .5); }
    };
    rail(-PX, CZ - PZ, PX, CZ - PZ); rail(-PX, CZ - PZ, -PX, CZ + PZ); rail(PX, CZ - PZ, PX, CZ + PZ);
    rail(-PX, CZ + PZ, -.38, CZ + PZ); rail(.38, CZ + PZ, PX, CZ + PZ);
    add(G.box(.36, .15, .025, .008), '#6e4428', 0, LY - .07, CZ + PZ + .04 + .0125, 0, 0, 0, 1, .5);
  }));
  f.add(mt('pavilion2-stone|' + tk, speckleTex(), ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.2, FY - .13, .2, .03), shade(stone, (sx + sz) * .02), sx * PX, (FY - .13) / 2, CZ + sz * PZ);
    add(G.box(.2, FY - .13, .2, .03), stone, 0, (FY - .13) / 2, CZ - PZ);
  }));
  f.add(mt('pavilion2-steps|' + tk, brickTex(), ({ add }) => {
    add(G.box(.72, FY * 2 / 3, .17, .012), brick, 0, FY / 3, CZ + DZ + .085, 0, 0, 0, 1, { w: .45 });
    add(G.box(.72, FY / 3, .17, .012), shade(brick, -.04), 0, FY / 6, CZ + DZ + .255, 0, 0, 0, 1, { w: .45 });
  }));
  // roof: four tiled faces, uvs in world units with the tile columns running down each slope
  const face = (P, sx, sz) => {
    const A = v3(P[0]), e = v3(P[1]).sub(A).normalize(), top = v3(P[2]).sub(A), up = top.sub(e.clone().multiplyScalar(top.dot(e))).normalize();
    return facets([[P, [sx, 1, sz]]], q => { const d = q.clone().sub(A); return [d.dot(e) / .42, d.dot(up) / .42]; });
  };
  f.add(mt('pavilion2-roof|' + tk, tileTex(), ({ addM }) => {
    addM(face([E(-1, 1), E(1, 1), R(1), R(-1)], 0, 1), I4, tile, null);
    addM(face([E(1, -1), E(-1, -1), R(-1), R(1)], 0, -1), I4, tile, null);
    addM(face([E(1, 1), E(1, -1), R(1)], 1, 0), I4, shade(tile, -.03), null);
    addM(face([E(-1, -1), E(-1, 1), R(-1)], -1, 0), I4, shade(tile, -.03), null);
  }));
  f.add(mc('pavilion2|' + tk, ({ add, addM, tube }) => {
    for (const s of [-1, 1]) { add(G.box(2 * AX + .02, .07, .05, .012), RIDGE, 0, YE - .028, CZ + s * (AZ - .02)); add(G.box(.05, .07, 2 * AZ - .06, .012), RIDGE, s * (AX - .02), YE - .028, CZ); }
    add(G.box(2 * RL + .16, .08, .1, .025), RIDGE, 0, YR + .02, CZ);
    for (const s of [-1, 1]) { add(G.cyl(.045, .05, .07, 12), RIDGE, s * (RL + .07), YR + .07, CZ, 0, 0, -s * .3); add(G.sph(.045, 10, 8), RIDGE, s * (RL + .085), YR + .105, CZ, 0, 0, 0, [1, .8, 1]); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const c0 = [sx * (AX - .03), YE + .02, CZ + sz * (AZ - .03)];
      tube(c0, [sx * RL, YR + .02, CZ], .024, RIDGE, 8);
      addM(G.cap(.026, .07, 3, 8), along([sx * (AX + .0), YE + .055, CZ + sz * (AZ + .0)], [sx * .5, .7, sz * .5]), RIDGE);
    }
    // floor things: two cushions, a tray with a thermos and two cups, a paper fan
    add(G.box(.3, .05, .3, .025), '#e8604f', -.36, FY + .025, CZ - .38, 0, .2, 0);
    add(G.cyl(.03, .03, .012, 12), MUSTARD, -.36, FY + .052, CZ - .38);
    add(G.box(.3, .05, .3, .025), MUSTARD, .08, FY + .025, CZ - .44, 0, -.15, 0);
    add(G.cyl(.03, .03, .012, 12), '#e8604f', .08, FY + .052, CZ - .44);
    add(G.box(.3, .025, .22, .008), '#8a5a34', .45, FY + .0125, CZ - .2);
    add(G.cyl(.04, .04, .16, 14), MINT, .38, FY + .025 + .08, CZ - .22); add(G.cyl(.032, .036, .04, 14), WHITE, .38, FY + .025 + .18, CZ - .22);
    for (const [x, z] of [[.5, -.16], [.54, -.26]]) add(G.cyl(.025, .02, .05, 12), WHITE, x, FY + .025 + .025, CZ + z);
    add(G.cyl(.12, .12, .008, 18, false), '#ffe0a8', .5, FY + .006, CZ + .14, 0, 0, 0, [1, 1, .55]);
    add(G.box(.02, .01, .16, .003), '#8a5a34', .5, FY + .006, CZ + .26);
    // a calico cat napping on the ridge
    calico(addM, xf(-.05, YR + .055, CZ, 0, 0, 0, 1.1), 'nap');
  }));
  f.add(mg('pavilion2-plaque', signMat(), ({ add }) => add(quadGeo(.32, .12, RG.rest), 0, LY - .07, CZ + PZ + .04 + .025 + .006)));
  f.spot('on', null, -.4, FY, CZ + .32, { maxH: .45, label: '정자 마루 위', scale: .8 });
  f.spot('under', null, .5, 0, CZ + DZ - .12, { maxH: .3, label: '정자 마루 밑', scale: .7 });
};

// 자전거 거치대 (2×1): a bike shelter — white posts carrying a green arched corrugated roof, a back rail with the
// 자전거 보관소 sign, a wheel rack on a concrete pad, a red and a sky-blue city bike (the blue one has a wire basket).
const bike = (add, tube, X, fc, basket) => {
  const RZ = -.25, FZ = .26, WR = .19, WY = .03 + .2;
  const BB = [X, .29, -.02], ST = [X, .6, -.13], HT = [X, .62, .17], HB = [X, .5, .2];
  for (const z of [RZ, FZ]) {
    add(G.tor(WR, .024, PI * 2, 6, 30), CHAR, X, WY, z, 0, HP, 0);
    add(G.tor(WR - .028, .007, PI * 2, 4, 26), STEEL, X, WY, z, 0, HP, 0);
    add(G.cyl(.025, .025, .07, 10), STEEL2, X, WY, z, 0, 0, HP);
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2 + .3; tube([X, WY, z], [X, WY + Math.sin(a) * (WR - .028), z + Math.cos(a) * (WR - .028)], .004, STEEL, 4); }
    add(G.tor(WR + .035, .012, 2.3, 4, 16), ALU, X, WY, z, 0, HP, -.2);
  }
  tube(BB, ST, .022, fc, 8); tube(BB, HB, .024, fc, 8); tube([X, .53, -.1], HT, .02, fc, 8);
  tube([X, WY, RZ], BB, .014, fc, 6); tube([X, WY, RZ], [X, .56, -.12], .013, fc, 6);
  tube(HT, [X, WY, FZ], .018, fc, 8); tube(HB, HT, .026, fc, 8);
  add(G.box(.03, .07, .2, .02), fc, X + .03, .3, -.13);
  add(G.cyl(.032, .032, .05, 12), STEEL2, ...BB, 0, 0, HP);
  tube(ST, [X, .63, -.15], .012, STEEL, 6);
  add(G.box(.09, .045, .17, .02), BROWN, X, .655, -.16);
  tube(HT, [X, .72, .15], .014, STEEL, 6);
  tube([X - .19, .72, .15], [X + .19, .72, .15], .012, STEEL, 6);
  for (const s of [-1, 1]) add(G.cap(.018, .06, 2, 8), BROWN, X + s * .2, .72, .15, 0, 0, HP);
  add(G.dome(.02, 10, 4), YELLOW, X + .1, .725, .15);
  tube([X, .22, -.12], [X + .1, .005, -.2], .01, STEEL2, 5);
  if (basket) {
    const x0 = X - .12, x1 = X + .12, z0 = .26, z1 = .44, by = .62, BH = .12, wire = '#eef1f6';
    add(G.pbox(x1 - x0 - .01, .008, z1 - z0 - .01), '#e3e8ef', X, by + .004, (z0 + z1) / 2);
    for (const [y, rr] of [[by, .006], [by + BH / 2, .005], [by + BH, .009]]) { tube([x0, y, z0], [x1, y, z0], rr, wire, 4); tube([x0, y, z1], [x1, y, z1], rr, wire, 4); tube([x0, y, z0], [x0, y, z1], rr, wire, 4); tube([x1, y, z0], [x1, y, z1], rr, wire, 4); }
    for (let k = 0; k <= 4; k++) { const x = x0 + k * (x1 - x0) / 4; for (const z of [z0, z1]) tube([x, by, z], [x, by + BH, z], .004, wire, 4); }
    for (let k = 1; k < 4; k++) { const z = z0 + k * (z1 - z0) / 4; for (const x of [x0, x1]) tube([x, by, z], [x, by + BH, z], .004, wire, 4); }
    for (const s of [-1, 1]) tube([X + s * .06, by, .36], [X + s * .02, WY, FZ], .006, STEEL2, 4);
  } else {
    for (const s of [-1, 1]) tube([X + s * .07, .64, -.3], [X + s * .07, .64, -.42], .008, ALU, 4);
    tube([X - .07, .64, -.42], [X + .07, .64, -.42], .008, ALU, 4);
  }
};
B.bikeshelter = (f, T) => {
  const sh = col(T, 'shelter'), conc = col(T, 'concrete'), rb = col(T, 'bike'), tk = [sh, conc, rb].join(',');
  const PY = 1.2, AR = .6, HA = Math.asin(.45 / AR), ACY = PY - AR * Math.cos(HA), L = 1.96, POST = '#e8ebf0';
  f.add(mt('bikeshelter-pad|' + tk, speckleTex(), ({ add }) => add(G.box(1.98, .03, .98, .01), conc, 0, .015, 0)));
  f.add(mt('bikeshelter-roof|' + tk, corrTex(), ({ addM }) => {
    const R1 = AR + .02, th = HA + .03, arc = R1 * 2 * th;
    const outer = new THREE.CylinderGeometry(R1, R1, L, 26, 1, true, HP - th, 2 * th).rotateZ(HP);
    addM(outer, xf(0, ACY, 0), sh, [arc / .5, L / .4]);
    const inner = inward(new THREE.CylinderGeometry(AR + .008, AR + .008, L - .004, 26, 1, true, HP - th, 2 * th).rotateZ(HP));
    addM(inner, xf(0, ACY, 0), shade(sh, -.12), [arc / .5, L / .4]);
  }));
  f.add(mc('bikeshelter|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { tube([sx * .9, .03, sz * .42], [sx * .9, PY + .02, sz * .42], .03, POST, 10); add(G.box(.1, .02, .1, .006), STEEL2, sx * .9, .04, sz * .42); }
    for (const x of [-.9, 0, .9]) add(G.tor(AR - .015, .022, 2 * HA, 6, 22), POST, x, ACY, 0, 0, HP, HP - HA);
    for (const sx of [-1, 1]) add(G.tor(AR + .03, .018, 2 * (HA + .03), 5, 24), shade(sh, -.18), sx * .98, ACY, 0, 0, HP, HP - HA - .03);
    for (const y of [.48, .92]) tube([-.9, y, -.42], [.9, y, -.42], .016, POST, 8);
    add(G.box(.66, .14, .02, .006), WHITE, 0, .7, -.42);
    for (const s of [-1, 1]) add(G.box(.03, .5, .025, .006), STEEL2, s * .3, .7, -.43);
    // wheel rack
    add(G.box(1.7, .03, .05, .01), STEEL2, 0, .045, -.3);
    for (const x of [-.37, .5]) add(G.tor(.15, .014, PI, 5, 14), STEEL, x, .045, -.26, 0, HP, 0);
    bike(add, tube, -.45, '#ff5a4a', false);
    bike(add, tube, .42, rb === K.bike ? '#3f9be0' : rb, true);
    tuft(add, -.95, .44, .8, .03); tuft(add, .95, -.1, .7, .03, LEAF2, LEAF);
  }));
  f.add(mg('bikeshelter-sign', signMat(), ({ add }) => add(quadGeo(.62, .126, RG.shelter), 0, .7, -.42 + .01 + .006)));
  f.spot('on', null, .42, .628, .35, { maxH: .13, label: '자전거 바구니', scale: .5 });
  f.spot('behind', null, .7, .03, -.45, { maxH: .45, label: '자전거 보관소 뒤', scale: .55 });
};

// 분리수거함 (2×1): four coloured recycling bins on a concrete pad — 일반, 플라스틱, 캔, 종이 — each with a printed label,
// a recycling disc on its lid and back wheels; every lid flips open (the 종이 bin takes a padlock) onto what was thrown in.
B.recyclebins = (f, T) => {
  const conc = col(T, 'concrete'), tk = conc;
  const BW = .42, BD = .5, BH = .64, Y0 = .04, Z0 = -.06, t = .03, XS = [-.72, -.24, .24, .72], FILL = .4;
  f.add(mt('recyclebins-pad|' + tk, speckleTex(), ({ add }) => add(G.box(1.98, Y0, .76, .01), conc, 0, Y0 / 2, -.06)));
  f.add(mc('recyclebins|' + tk, ({ add, tube }) => {
    XS.forEach((x, i) => {
      const c = BINS[i][1], inner = shade(c, -.25), zf = Z0 + BD / 2, zb = Z0 - BD / 2;
      add(G.box(BW, BH, t, .01), c, x, Y0 + BH / 2, zf - t / 2);
      add(G.box(BW, BH, t, .01), c, x, Y0 + BH / 2, zb + t / 2);
      for (const s of [-1, 1]) add(G.box(t, BH, BD - 2 * t, .01), c, x + s * (BW / 2 - t / 2), Y0 + BH / 2, Z0);
      add(G.box(BW - 2 * t - .004, FILL, BD - 2 * t - .004, .006), inner, x, Y0 + FILL / 2, Z0);
      add(G.box(BW + .012, .05, .012, .004), shade(c, -.12), x, Y0 + .065, zf + .006);
      for (const s of [-1, 1]) { add(G.cyl(.05, .05, .03, 14), RUBBER, x + s * .15, .05, zb - .012, 0, 0, HP); add(G.cyl(.02, .02, .032, 8), STEEL2, x + s * .15, .05, zb - .012, 0, 0, HP); }
      // what was thrown in, round the back of the bin
      const fy = Y0 + FILL, bz = zb + t + .07;
      if (i === 0) { add(G.sph(.08, 10, 8), '#4a4560', x - .08, fy + .05, bz, 0, 0, 0, [1, .8, 1]); add(G.sph(.06, 10, 8), '#f3efe8', x + .1, fy + .04, bz + .02); }
      else if (i === 1) for (let k = 0; k < 3; k++) { add(G.cyl(.03, .03, .14, 12), '#cdeefc', x - .12 + k * .12, fy + .03, bz, HP, 0, .3 * (k - 1)); add(G.cyl(.014, .014, .02, 8), ['#3f86e0', '#ff6b57', '#45b86b'][k], x - .12 + k * .12, fy + .03, bz + .08, HP, 0, 0); }
      else if (i === 2) for (let k = 0; k < 4; k++) add(G.cyl(.026, .026, .08, 12), [TOMATO, STEEL, '#45b86b', MUSTARD][k], x - .13 + k * .085, fy + .026, bz + (k % 2) * .05, HP, k, 0);
      else for (let k = 0; k < 2; k++) add(G.box(.2 - k * .05, .05, .14, .008), k ? '#f3efe8' : KRAFT, x - .04 + k * .06, fy + .025 + k * .05, bz, 0, k * .4, 0);
      add(G.box(.06, .05, .01, .003), STEEL2, x, Y0 + BH - .04, zf + .005);
    });
  }));
  f.add(mg('recyclebins-labels', atlasMat(), ({ add }) => XS.forEach((x, i) => add(quadGeo(.32, .427, RG['bin' + i]), x, Y0 + BH * .5, Z0 + BD / 2 + .006))));
  XS.forEach((x, i) => {
    const c = BINS[i][1], pv = new THREE.Group(); pv.position.set(x, Y0 + BH + .004, Z0 - BD / 2 - .01);
    pv.add(mc('recyclebins-lid' + i, ({ add }) => {
      add(G.box(BW + .03, .045, BD + .03, .015), shade(c, -.06), 0, .0225, BD / 2 + .005);
      add(G.box(.14, .03, .03, .01), WHITE, 0, .03, BD + .025);
      add(G.box(.05, .06, .01, .003), STEEL2, 0, -.018, BD + .03);
    }));
    pv.add(mg('recyclebins-recy', atlasMat(), ({ addM }) => addM(discGeo(.075, RG.recy), xf(0, .045 + .006, BD / 2))));
    f.add(pv);
    const p = f.part('lid', pv, t2 => { pv.rotation.x = -1.8 * t2; }, { label: BINS[i][0] + ' 수거함', sfx: 'open', dur: .3 });
    if (i === 3) { p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: -.075, z: BD + .056, parent: pv }; }
    f.spot('inside', null, x, Y0 + FILL, Z0 + .06, { part: p, maxH: .24, label: BINS[i][0] + ' 수거함 안', scale: .7 });
  });
};

// 아이스크림 카트 (2×1): a cream cart printed 아이스크림 with a sky-blue chest freezer on top (its lid flips up onto
// popsicles and cups), two big wheels and two legs, a push bar, a red-and-white striped canopy with a scalloped valance
// and a giant cone on top, and a chalk menu board standing by the handle.
B.icecart = (f, T) => {
  const aw = col(T, 'awning'), cart = col(T, 'cart'), tk = [aw, cart].join(',');
  const X0 = -.72, X1 = .5, CZ = -.05, CD = .5, BY0 = .22, BY1 = .6, FY1 = .84, FX = (X0 + X1) / 2, FW = X1 - X0 - .06, FD = CD - .04, t = .035;
  const CAN = xf(-.11, 1.72, .05, .14, 0, 0), MX = .84, CNW = 1.5, CND = .84;
  const M1 = xf(MX, .2, .3, -.17, 0, 0), M2 = xf(MX, .2, .2, .17, 0, 0);
  f.add(mc('icecart|' + tk, ({ add, addM, tube }) => {
    add(G.box(X1 - X0, BY1 - BY0, CD, .02), cart, FX, (BY0 + BY1) / 2, CZ);
    add(G.box(X1 - X0 + .02, .03, CD + .02, .01), '#ff8fb8', FX, BY1 + .006, CZ);
    // freezer: walls round a light floor
    for (const s of [-1, 1]) { add(G.box(FW, FY1 - BY1, t, .01), '#8fd3f4', FX, (BY1 + FY1) / 2, CZ + s * (FD / 2 - t / 2)); add(G.box(t, FY1 - BY1, FD - 2 * t, .01), '#8fd3f4', FX + s * (FW / 2 - t / 2), (BY1 + FY1) / 2, CZ); }
    add(G.box(FW - 2 * t - .004, .05, FD - 2 * t - .004, .006), '#e6f6fd', FX, BY1 + .025, CZ);
    const pal = [PINK, MUSTARD, MINT, '#ff6b57', LILAC];
    for (let k = 0; k < 6; k++) { const x = X0 + .12 + k * .085; add(G.box(.05, .025, .13, .012), pal[k % 5], x, BY1 + .0625, CZ - .1, 0, .1 * (k % 2), 0); add(G.box(.012, .008, .05, .003), '#e8c08a', x, BY1 + .06, CZ - .17); }
    for (const [x, c] of [[X1 - .14, PINK], [X1 - .14, MINT]]) add(G.cyl(.04, .032, .05, 12), c, x, BY1 + .075, CZ + (c === PINK ? -.08 : .06));
    // wheels, legs, push bar
    for (const s of [-1, 1]) { add(G.tor(.12, .03, PI * 2, 6, 24), RUBBER, X0 + .2, .15, CZ + s * (CD / 2 + .04)); add(G.cyl(.05, .05, .03, 14), STEEL, X0 + .2, .15, CZ + s * (CD / 2 + .035), HP, 0, 0); }
    add(G.cyl(.022, .022, CD + .08, 10), STEEL2, X0 + .2, .15, CZ, HP, 0, 0);
    for (const s of [-1, 1]) { tube([X1 - .08, BY0 + .01, CZ + s * .18], [X1 - .08, .03, CZ + s * .18], .018, STEEL2, 8); add(G.cyl(.03, .03, .03, 10), RUBBER, X1 - .08, .015, CZ + s * .18); }
    tube([X1, .72, CZ - .18], [X1 + .13, .76, CZ - .18], .016, STEEL, 8); tube([X1, .72, CZ + .18], [X1 + .13, .76, CZ + .18], .016, STEEL, 8);
    tube([X1 + .13, .76, CZ - .2], [X1 + .13, .76, CZ + .2], .022, '#ff8fb8', 8);
    // canopy poles, canopy underside, a giant cone on top
    for (const x of [X0 - .04, X1 + .04]) { tube([x, 0, -.31], [x, 1.76, -.31], .02, STEEL, 8); add(G.cyl(.04, .04, .03, 10), STEEL2, x, .015, -.31); }
    addM(G.box(CNW - .02, .012, CND - .02, .004), CAN.clone().multiply(xf(0, -.019, 0)), shade(aw, -.25));
    const top = CAN.clone().multiply(xf(.3, .02, -.1));
    addM(G.cone(.07, .2, 12), top.clone().multiply(xf(0, .1, 0, PI, 0, 0)), '#e8a855');
    addM(G.sph(.075, 14, 10), top.clone().multiply(xf(0, .21, 0)), MINT);
    addM(G.sph(.07, 14, 10), top.clone().multiply(xf(0, .3, 0)), PINK);
    addM(G.sph(.022, 8, 6), top.clone().multiply(xf(.01, .375, 0)), '#ff5a4a');
    // chalk menu board
    for (const M of [M1, M2]) addM(G.box(.2, .4, .02, .008), M, '#8a5a34');
    addM(G.box(.18, .02, .1, .005), xf(MX, .38, .25), '#8a5a34');
  }));
  f.add(mg('icecart-canopy|' + aw, mat('#ffffff', { map: stripeTex(aw) }), ({ addM }) => {
    addM(planarUV(ni(G.box(CNW, .03, CND, .01)), .3), CAN);
    addM(planarUV(ni(G.box(CNW, .1, .02, .006)), .3), CAN.clone().multiply(xf(0, -.05, CND / 2 + .01)));
  }));
  f.add(mc('icecart-scallop|' + aw, ({ addM }) => {
    for (let k = 0; k < 10; k++) addM(G.cyl(.075, .075, .006, 14), CAN.clone().multiply(xf(-.675 + k * .15, -.1, CND / 2 + .01, HP, 0, 0)), k % 2 ? '#fffaf2' : aw);
  }));
  f.add(mg('icecart-prints', signMat(), ({ add, addM }) => {
    add(quadGeo(X1 - X0 - .04, .3, RG.cart), FX, (BY0 + BY1) / 2 + .01, CZ + CD / 2 + .006);
    addM(quadGeo(.18, .27, RG.menu), M1.clone().multiply(xf(0, .02, .01 + .006)));
  }));
  const pv = new THREE.Group(); pv.position.set(FX, FY1 + .004, CZ - FD / 2 - .01);
  pv.add(mc('icecart-lid', ({ add }) => {
    add(G.box(FW + .02, .04, FD + .02, .014), '#bfe6f7', 0, .02, FD / 2 + .01);
    add(G.box(.2, .025, .03, .01), WHITE, 0, .02, FD + .03);
  }));
  pv.add(mg('icecart-lidprint', atlasMat(), ({ addM }) => addM(quadGeo(.5, .208, RG.icelid).rotateX(-HP), xf(0, .04 + .006, FD / 2 + .01))));
  f.add(pv);
  const p = f.part('lid', pv, t2 => { pv.rotation.x = -1.7 * t2; }, { label: '아이스크림 냉동고', sfx: 'open', dur: .3 });
  f.spot('inside', null, FX + .12, BY1 + .05, CZ + .06, { part: p, maxH: .18, label: '아이스크림 냉동고 안', scale: .55 });
};

// 피크닉 테이블 (2×1): a plank picnic table with benches on A-frame legs; a red gingham cloth over the left end (its
// right end folds up and back), a hot dog on a plate, a paper cup and ketchup on the bare end, a green cooler under the bench.
B.picnic2 = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), cl = col(T, 'cloth'), tk = [wood, woodD].join(',');
  const TY = .7, TT = .045, BY = .43, BZ = .39, LX = .62, CX0 = -.79, CLW = 1.04, CD = .56;
  f.add(mt('picnic2-planks|' + tk, grainTex(), ({ add }) => {
    for (const z of [-.195, -.065, .065, .195]) add(G.box(1.66, TT, .125, .01), wood, 0, TY - TT / 2, z, 0, 0, 0, 1, .5);
    for (const s of [-1, 1]) for (const dz of [-.05, .05]) add(G.box(1.66, .04, .095, .01), wood, 0, BY - .02, s * BZ + dz, 0, 0, 0, 1, .5);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) { const a = [sx * LX, TY - TT, sz * .14], b = [sx * LX, 0, sz * .44], [L2, m] = tubeM(a, b); add(G.box(.05, L2, .07, .01).applyMatrix4(m), woodD, 0, 0, 0, 0, 0, 0, 1, { s: .5, swap: true }); }
      add(G.box(1.0, .06, .05, .01), woodD, sx * LX, BY - .07, 0, 0, HP, 0, 1, .5);
      add(G.box(.5, .05, .05, .01), woodD, sx * LX, TY - TT - .025, 0, 0, HP, 0, 1, .5);
    }
  }));
  f.add(mc('picnic2|' + tk, ({ add, tube }) => {
    const top = TY;
    add(G.cyl(.11, .095, .016, 22), WHITE, .38, top + .008, .06);
    add(G.cap(.03, .14, 3, 10), '#f3c06a', .38, top + .04, .06, 0, .3, HP);
    add(G.cap(.017, .16, 3, 8), '#d8553a', .38, top + .058, .06, 0, .3, HP);
    for (let k = 0; k < 5; k++) add(G.box(.024, .006, .008, .002), YELLOW, .32 + k * .028, top + .077, .06 - (k - 2) * .009 + (k % 2) * .008, 0, .3 + (k % 2 ? .5 : -.5), 0);
    add(G.cyl(.04, .032, .1, 14), WHITE, .62, top + .05, .14); add(G.cyl(.041, .041, .03, 14), PINK, .62, top + .07, .14);
    tube([.625, top + .1, .14], [.645, top + .17, .13], .006, PINK, 6);
    add(G.cyl(.03, .03, .12, 12), '#ff5a4a', .7, top + .06, -.02); add(G.cone(.018, .05, 10), '#ff5a4a', .7, top + .145, -.02); add(G.cyl(.006, .006, .02, 6), WHITE, .7, top + .18, -.02);
    // cooler under the front bench
    add(G.box(.3, .2, .2, .03), '#3fae74', .25, .1, .4);
    add(G.box(.31, .05, .21, .02), WHITE, .25, .225, .4);
    tube([.13, .26, .4], [.37, .26, .4], .012, WHITE, 6);
    tuft(add, -.92, .42, .8); tuft(add, .93, -.4, .7, 0, LEAF2, LEAF);
  }));
  const pv = new THREE.Group(); pv.position.set(CX0, TY + .007, 0);
  pv.add(mg('picnic2-cloth|' + cl, mat('#ffffff', { map: ginghamTex(cl) }), ({ addM }) => {
    addM(planarUV(ni(G.box(CLW, .01, CD, .003)).translate(CLW / 2, 0, 0), .2), I4);
    for (const s of [-1, 1]) addM(planarUV(ni(G.box(CLW, .11, .01, .003)).translate(CLW / 2, -.05, s * (CD / 2 + .005)), .2), I4);
  }));
  f.add(pv);
  const p = f.part('lift', pv, (t2, b) => { pv.rotation.z = 1.05 * t2; pv.position.y = b.p.y + .03 * t2; }, { label: '식탁보', sfx: 'lift', dur: .32 });
  f.spot('inside', null, -.32, TY, .0, { part: p, maxH: .09, label: '식탁보 밑', scale: .9 });
  f.spot('on', null, .58, TY, -.13, { maxH: .45, label: '피크닉 테이블 위', scale: .75 });
};

// 바비큐 그릴 (1×1): a charcoal kettle grill on three legs with two wheels and an ash pan — glowing coals, a grate with
// sausages, a corn cob and a skewer; the domed lid (wooden handle, vent, thermometer) lifts aside. A BBQ charcoal bag
// with the bear stands next to it.
B.bbqgrill = (f, T) => {
  const gc = col(T, 'grill'), tk = gc;
  const R = .21, GY = .54, z0 = -.05, gl = shade(gc, .1);
  const bowl = [];
  for (let k = 0; k <= 8; k++) { const a = k / 8 * HP; bowl.push([R * Math.sin(a), -R * Math.cos(a)]); }
  bowl.push([R + .012, 0], [R + .012, .012], [R - .012, .012]);
  for (let k = 8; k >= 0; k--) { const a = k / 8 * HP; bowl.push([(R - .014) * Math.sin(a), -(R - .014) * Math.cos(a) + .002]); }
  f.add(mc('bbqgrill|' + tk, ({ add, tube }) => {
    add(G.lathe(bowl, 28), gc, 0, GY, z0);
    add(G.tor(R + .004, .008, PI * 2, 4, 30), STEEL, 0, GY + .006, z0, HP);
    for (let k = 0; k < 3; k++) { const a = HP + k * PI * 2 / 3, x = Math.cos(a), z = Math.sin(a); tube([x * .12, GY - .17, z0 + z * .12], [x * .25, .02, z0 + z * .25], .016, gl, 8); }
    for (const k of [1, 2]) { const a = HP + k * PI * 2 / 3; add(G.cyl(.055, .055, .03, 16), RUBBER, Math.cos(a) * .27, .055, z0 + Math.sin(a) * .27, 0, -a, HP); }
    add(G.cyl(.1, .09, .03, 18), STEEL2, 0, .2, z0);
    for (let k = 0; k < 3; k++) { const a = HP + k * PI * 2 / 3; tube([Math.cos(a) * .09, .2, z0 + Math.sin(a) * .09], [Math.cos(a) * .19, .12, z0 + Math.sin(a) * .19], .008, STEEL2, 4); }
    add(G.box(.12, .03, .03, .01), '#c98a52', R + .06, GY - .03, z0); tube([R - .01, GY - .03, z0 - .03], [R + .02, GY - .03, z0 - .03], .006, STEEL, 4); tube([R - .01, GY - .03, z0 + .03], [R + .02, GY - .03, z0 + .03], .006, STEEL, 4);
    // coals and the grate
    for (let k = 0; k < 11; k++) { const a = k * 2.4, r = .03 + (k % 4) * .035; add(G.sph(.03, 8, 6), k % 3 ? '#ff7a3c' : '#4a4458', Math.cos(a) * r, GY - .1, z0 + Math.sin(a) * r, 0, k, 0, [1.2, .6, 1]); }
    const gy = GY - .032;
    add(G.tor(R - .02, .006, PI * 2, 4, 28), STEEL, 0, gy, z0, HP);
    for (let k = -3; k <= 3; k++) { const z = k * .05, hl = Math.sqrt((R - .02) ** 2 - z * z); tube([-hl, gy, z0 + z], [hl, gy, z0 + z], .005, STEEL, 4); }
    for (const [x, z, r] of [[-.08, -.11, .2], [.04, -.12, -.15], [.12, -.06, .5]]) add(G.cap(.019, .09, 3, 8), '#c8553a', x, gy + .02, z0 + z, 0, r, HP);
    add(G.cap(.026, .1, 3, 8), '#ffd23f', -.12, gy + .025, z0 + .06, 0, .9, HP);
    for (let k = 0; k < 4; k++) add(G.box(.03, .03, .03, .008), ['#c8553a', '#6cc46a', '#ff9a3c', '#c8553a'][k], .1 + k * .015, gy + .022, z0 + .06 + k * .02, 0, .6, 0);
    tube([.06, gy + .022, z0 + .02], [.17, gy + .022, z0 + .12], .004, '#e6c48e', 4);
    // charcoal bag
    add(G.box(.17, .3, .1, .012), KRAFT, .31, .15, .3, 0, -.25, 0);
    add(G.box(.15, .04, .08, .01), shade(KRAFT, -.1), .31, .315, .3, 0, -.25, 0);
    tuft(add, -.36, .34, .8); tuft(add, .38, -.36, .7, 0, LEAF2, LEAF);
  }));
  f.add(mg('bbqgrill-bag', atlasMat(), ({ addM }) => addM(quadGeo(.145, .2, RG.bbq), xf(.31, .16, .3, 0, -.25, 0).multiply(xf(0, 0, .05 + .006)))));
  const lid = new THREE.Group(); lid.position.set(0, GY + .016, z0);
  lid.add(mc('bbqgrill-lid|' + tk, ({ add, tube }) => {
    add(G.dome(R + .014, 26, 7), gc, 0, 0, 0, 0, 0, 0, [1, .82, 1]);
    add(G.tor(R + .012, .008, PI * 2, 4, 30), STEEL, 0, .004, 0, HP);
    for (const s of [-1, 1]) tube([s * .06, .17, 0], [s * .06, .205, 0], .008, STEEL, 4);
    add(G.cap(.016, .12, 3, 8), '#c98a52', 0, .21, 0, 0, 0, HP);
    add(G.cyl(.032, .032, .008, 14), STEEL, -.09, .157, .03, -.25, 0, .5);
    add(G.cyl(.026, .026, .012, 14), WHITE, 0, .11, R * .78, 1.05, 0, 0);
    add(G.box(.004, .016, .004, .001), '#ff4b4b', .004, .116, R * .78 + .012, 1.05, 0, -.5);
  }));
  f.add(lid);
  const p = f.part('lift', lid, (t2, b) => { lid.position.y = b.p.y + .27 * t2; lid.position.x = b.p.x - .12 * t2; lid.rotation.z = .6 * t2; }, { label: '그릴 뚜껑', sfx: 'lift' });
  f.spot('inside', null, -.02, GY - .025, z0 + .02, { part: p, maxH: .24, label: '바비큐 그릴 안', scale: .6 });
};

// 길고양이 급식소 (1×1): a little plank house on legs — low walls with a door, a pink cushion and a bowl inside, a
// paw sticker; its gabled roof (both gables, the ridge and the 길고양이 급식소 sign on the front gable) lifts off in one
// piece. A pink mat with a food bowl and a water bowl in front, and a calico cat sitting by it.
B.catfeeder = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), roof = col(T, 'feedroof'), tk = [wood, woodD, roof].join(',');
  const HW = .25, Z0 = -.34, Z1 = .1, BY = .1, WH = .24, WT = .035, OW = .17, OH = .17, ZC = (Z0 + Z1) / 2, D = Z1 - Z0, GH = .19;
  const gable = new THREE.Shape(); gable.moveTo(-HW, 0); gable.lineTo(HW, 0); gable.lineTo(0, GH); gable.closePath();
  f.add(mt('catfeeder-walls|' + tk, plankTex(), ({ add }) => {
    const pl = { s: .32, swap: true };
    add(G.box(2 * HW, WH, WT, .008), wood, 0, BY + WH / 2, Z0 + WT / 2, 0, 0, 0, 1, pl);
    for (const s of [-1, 1]) add(G.box(WT, WH, D - 2 * WT, .008), shade(wood, -.04), s * (HW - WT / 2), BY + WH / 2, ZC, 0, 0, 0, 1, pl);
    const sw = HW - OW / 2;
    for (const s of [-1, 1]) add(G.box(sw, WH, WT, .008), wood, s * (OW / 2 + sw / 2), BY + WH / 2, Z1 - WT / 2, 0, 0, 0, 1, pl);
    add(G.box(OW + .004, WH - OH, WT, .006), wood, 0, BY + OH + (WH - OH) / 2, Z1 - WT / 2, 0, 0, 0, 1, pl);
  }));
  f.add(mc('catfeeder|' + tk, ({ add, addM }) => {
    add(G.box(2 * HW + .08, .05, D + .1, .012), woodD, 0, BY - .025, ZC);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.05, BY - .05, .05, .008), woodD, sx * (HW - .02), (BY - .05) / 2, ZC + sz * .2);
    add(G.box(2 * HW - 2 * WT - .004, .012, D - 2 * WT - .004, .004), '#d9a36a', 0, BY + .006, ZC);
    add(G.cyl(.1, .1, .04, 20), '#ff9fb5', -.07, BY + .012 + .02, Z0 + .14, 0, 0, 0, [1, 1, .85]);
    add(G.tor(.1, .014, PI * 2, 5, 22), '#ff7fa8', -.07, BY + .012 + .04, Z0 + .14, HP, 0, 0, [1, .85, 1]);
    add(G.cyl(.05, .042, .035, 14), '#4f8fe8', .14, BY + .012 + .0175, Z0 + .1); add(G.cyl(.042, .042, .006, 14), '#8a5a3c', .14, BY + .012 + .037, Z0 + .1);
    // door frame, mat, bowls
    for (const s of [-1, 1]) add(G.box(.022, OH, .014, .004), WHITE, s * (OW / 2 + .011), BY + OH / 2, Z1 + .007);
    add(G.box(OW + .044, .022, .014, .004), WHITE, 0, BY + OH + .011, Z1 + .007);
    add(G.box(.46, .012, .18, .006), PINK, 0, .006, .3);
    add(G.cyl(.075, .06, .045, 18), '#ff6b57', -.11, .012 + .0225, .3); add(G.cyl(.064, .064, .008, 16), '#a0643c', -.11, .012 + .045, .3);
    for (let k = 0; k < 6; k++) add(G.sph(.012, 6, 4), '#7a4a2a', -.11 + Math.cos(k) * .03, .012 + .051, .3 + Math.sin(k) * .03);
    add(G.cyl(.075, .06, .045, 18), '#4f8fe8', .11, .012 + .0225, .3); add(G.cyl(.064, .064, .008, 16), '#bfe8fb', .11, .012 + .045, .3);
    calico(addM, xf(.385, 0, .3, 0, -.5, 0, .9), 'loaf');
  }));
  f.add(mg('catfeeder-paw', atlasMat(), ({ add }) => add(quadGeo(.1, .1, RG.paw), HW + .006, BY + .12, ZC, 0, HP, 0)));
  const ang = Math.atan2(GH, HW), U = (HW + .06) / Math.cos(ang), th = .03, sa = Math.sin(ang), ca = Math.cos(ang);
  const pv = new THREE.Group(); pv.position.set(0, BY + WH, ZC);
  pv.add(mt('catfeeder-gables|' + tk, plankTex(), ({ add }) => {
    add(G.ext(gable, WT, 0, 1), wood, 0, 0, D / 2 - WT, 0, 0, 0, 1, { s: .32, swap: true });
    add(G.ext(gable, WT, 0, 1), wood, 0, 0, -D / 2, 0, 0, 0, 1, { s: .32, swap: true });
  }));
  pv.add(mt('catfeeder-roof|' + tk, tileTex(), ({ add }) => {
    for (const s of [-1, 1]) add(G.box(U, th, D + .1, .01), roof, s * (U / 2 * ca + th / 2 * sa), GH - U / 2 * sa + th / 2 * ca, 0, 0, 0, -s * ang, 1, { s: .25, swap: true });
  }));
  pv.add(mc('catfeeder-ridge|' + tk, ({ add }) => { add(G.cyl(.024, .024, D + .14, 12), shade(roof, -.18), 0, GH + .03, 0, HP, 0, 0); add(G.sph(.028, 8, 6), MUSTARD, 0, GH + .03, D / 2 + .075); }));
  pv.add(mg('catfeeder-sign', atlasMat(), ({ add }) => add(quadGeo(.3, .06, RG.feeder), 0, .04, D / 2 + .006)));
  f.add(pv);
  const p = f.part('lift', pv, (t2, b) => { pv.position.y = b.p.y + .32 * t2; pv.position.x = b.p.x - .1 * t2; pv.rotation.z = .32 * t2; }, { label: '급식소 지붕', sfx: 'lift' });
  f.spot('inside', null, -.07, BY + .052, Z0 + .14, { part: p, maxH: .2, label: '고양이 집 안', scale: .65 });
};

// 단지 게시판 (1×1): a freestanding notice board on green posts — a cork board in a green frame under a little gabled
// cap with the 단지 게시판 header, pinned posters (고양이를 찾아요, 놀이터 이용 안내, a kid's drawing, the recycling days)
// and a 알뜰 바자회 poster pinned only at the top: flip it up and there is something tucked behind it.
B.noticeboard2 = (f, T) => {
  const bc = col(T, 'board'), conc = col(T, 'concrete'), tk = [bc, conc].join(',');
  const BW = .86, BH = .6, BYc = 1.08, BZ = -.12, PX = .43, CF = BZ + .02, FR = BZ + .05;
  f.add(mt('noticeboard2-cork|' + tk, speckleTex(), ({ add }) => {
    add(G.box(BW - .06, BH, .04, .006), '#d9a066', 0, BYc, BZ, 0, 0, 0, 1, { w: .25 });
    for (const s of [-1, 1]) add(G.box(.16, .08, .16, .02), conc, s * PX, .04, BZ);
  }));
  f.add(mc('noticeboard2|' + tk, ({ add }) => {
    for (const s of [-1, 1]) add(G.box(.06, 1.64, .06, .012), bc, s * PX, .82, BZ);
    add(G.box(BW + .1, .1, .07, .015), bc, 0, BYc + BH / 2 + .05, BZ + .015);
    add(G.box(BW + .1, .05, .07, .012), bc, 0, BYc - BH / 2 - .025, BZ + .015);
    for (const s of [-1, 1]) add(G.box(.05, BH, .07, .012), bc, s * (BW / 2 + .0), BYc, BZ + .015);
    for (const s of [-1, 1]) add(G.box(BW + .1, .03, .15, .01), shade(bc, .06), 0, BYc + BH / 2 + .24, BZ + s * .062, s * .38, 0, 0);
    add(G.cyl(.02, .02, BW + .12, 10), shade(bc, -.1), 0, BYc + BH / 2 + .27, BZ, 0, 0, HP);
    // thumbtacks on the fixed posters
    for (const [x, y, c] of [[-.35, 1.232, '#ff5a4a'], [-.19, 1.232, '#3f86e0'], [-.08, 1.218, MUSTARD], [.08, 1.218, '#45b86b'], [-.19, .928, '#ff5a4a'], [-.05, .928, MINT], [.12, .92, '#3f86e0'], [.28, .92, PINK]]) add(G.sph(.012, 8, 6), c, x, y, CF + .012);
  }));
  f.add(mg('noticeboard2-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.55, .096, RG.header), 0, BYc + BH / 2 + .05, FR + .006);
    add(quadGeo(.2, .257, RG.lost), -.27, 1.12, CF + .006);
    add(quadGeo(.2, .271, RG.rules), .0, 1.1, CF + .006);
    add(quadGeo(.18, .129, RG.kid), -.12, .88, CF + .006);
    add(quadGeo(.19, .136, RG.sched), .2, .87, CF + .006);
  }));
  const pv = new THREE.Group(); pv.position.set(.27, 1.27, CF);
  pv.add(mc('noticeboard2-poster', ({ add }) => {
    add(G.box(.2, .26, .004, .001), WHITE, 0, -.13, .004);
    for (const x of [-.08, .08]) add(G.sph(.012, 8, 6), x < 0 ? '#ff6b57' : MUSTARD, x, -.015, .02);
  }));
  pv.add(mg('noticeboard2-bazaar', atlasMat(), ({ add }) => add(quadGeo(.19, .244, RG.bazaar), 0, -.13, .006 + .006)));
  f.add(pv);
  const p = f.part('flip', pv, t2 => { pv.rotation.x = -1.25 * t2; }, { label: '바자회 포스터', sfx: 'lift', dur: .3 });
  f.spot('inside', null, .27, 1.13, CF + .006, { part: p, maxH: .09, label: '포스터 뒤', wallFace: true, scale: .85 });
};

// 단지 가로등 (1×1): a dark lamp post on a stone pedestal — a flared foot, two collars, a number plate and a glowing
// globe under a cap with a finial. Something can sit on the pedestal.
B.streetlamp2 = (f, T) => {
  const lamp = col(T, 'lamp'), stone = col(T, 'stone'), tk = [lamp, stone].join(',');
  const BH = .24, CT = BH + .05, top = 2.06, lt = shade(lamp, .14);
  f.add(mt('streetlamp2-base|' + tk, speckleTex(), ({ add }) => {
    add(G.box(.44, BH, .44, .03), stone, 0, BH / 2, 0);
    add(G.box(.5, .05, .5, .015), shade(stone, .04), 0, BH + .025, 0);
  }));
  f.add(mc('streetlamp2|' + tk, ({ add }) => {
    add(G.cyl(.065, .1, .16, 16), lamp, 0, CT + .08, 0);
    add(G.cyl(.042, .046, top - CT - .16, 14), lamp, 0, (top + CT + .16) / 2, 0);
    for (const y of [CT + .17, 1.0, 1.8]) add(G.tor(.05, .014, PI * 2, 5, 18), lt, 0, y, 0, HP);
    add(G.box(.12, .07, .01, .003), WHITE, 0, 1.3, .046 + .005);
    add(G.cyl(.075, .05, .07, 16), lamp, 0, top + .035, 0);
    add(G.tor(.152, .012, PI * 2, 4, 24), lt, 0, top + .065, 0, HP);
    add(G.cyl(.13, .16, .05, 18), lamp, 0, top + .38, 0);
    add(G.dome(.12, 18, 6), lamp, 0, top + .405, 0, 0, 0, 0, [1, .5, 1]);
    add(G.cone(.025, .1, 8), lamp, 0, top + .5, 0); add(G.sph(.02, 8, 6), MUSTARD, 0, top + .555, 0);
    for (let k = 0; k < 4; k++) { const a = k * HP + PI / 4; add(G.box(.014, .3, .014, .004), lamp, Math.cos(a) * .152, top + .21, Math.sin(a) * .152); }
    tuft(add, .3, .3, .8); tuft(add, -.32, -.3, .7, 0, LEAF2, LEAF);
  }));
  f.add(mg('streetlamp2-bulb', bulbMat(), ({ add }) => add(new THREE.SphereGeometry(.14, 18, 12), 0, top + .215, 0)));
  f.add(mg('streetlamp2-no', atlasMat(), ({ add }) => add(quadGeo(.1, .0625, RG.no), 0, 1.3, .046 + .01 + .006)));
  f.spot('on', null, 0, CT, .15, { maxH: .45, label: '가로등 받침 위', scale: .65 });
};

// 꽃 화단 (2×1): a plank planter box with chunky corner posts, full of soil — round bushes behind a row of daisies,
// tulips and yellow flowers, a butterfly, and a 꽃을 사랑해요 stake. There is a gap in the planting behind the flowers.
B.planter = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), soil = col(T, 'soil'), tk = [wood, woodD, soil].join(',');
  const PW = .9, PD = .27, PH = .34, WT = .05, SY = PH - .035;
  f.add(mt('planter-walls|' + tk, plankTex(), ({ add }) => {
    for (const s of [-1, 1]) { add(G.box(2 * PW - .06, PH, WT, .01), wood, 0, PH / 2, s * (PD - WT / 2), 0, 0, 0, 1, .4); add(G.box(2 * PD - 2 * WT, PH, WT, .01), wood, s * (PW - WT / 2 - .02), PH / 2, 0, 0, HP, 0, 1, .4); }
  }));
  f.add(mt('planter-posts|' + tk, grainTex(), ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.09, PH + .05, .09, .015), woodD, sx * (PW - .045), (PH + .05) / 2, sz * (PD - .035), 0, 0, 0, 1, { s: .4, swap: true });
  }));
  f.add(mc('planter|' + tk, ({ add, tube }) => {
    add(G.box(2 * PW - .16, .03, 2 * PD - 2 * WT - .004, .008), soil, 0, SY - .015, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cone(.07, .05, 4), shade(woodD, -.08), sx * (PW - .045), PH + .075, sz * (PD - .035), 0, PI / 4, 0);
    for (const x of [-.68, -.3, .1]) bush(add, x, SY - .02, -.08, 1.35);
    bush(add, .76, SY - .02, -.07, 1.1, [LEAF, LEAF2, LEAF3]);
    // two rows of daisies, red tulips and yellow flowers; a tall pink clump in front of the gap
    for (let k = 0; k < 18; k++) {
      const row = k % 2, x = -.78 + (k >> 1) * .19 + row * .09, z = row ? .02 : .13, h = .1 + ((k * 7) % 4) * .03 + row * .04;
      if (x > .32 && x < .66 && row) continue;
      tube([x, SY, z], [x, SY + h, z], .007, LEAF2, 4);
      add(G.sph(.035, 8, 6), k % 3 ? LEAF : LEAF3, x + .025, SY + .035, z, 0, k, .5, [1.3, .45, .75]);
      const kind = (k * 5) % 3;
      if (kind === 0) daisy(add, x, SY + h, z, 2.2);
      else if (kind === 1) { add(G.sph(.038, 10, 8), '#ff4f5e', x, SY + h + .012, z, 0, 0, 0, [1, 1.3, 1]); for (let q = 0; q < 3; q++) add(G.cone(.022, .04, 5), '#ff4f5e', x + Math.cos(q * 2.1) * .016, SY + h + .05, z + Math.sin(q * 2.1) * .016); }
      else daisy(add, x, SY + h, z, 2.1, YELLOW, '#ff9a3c');
    }
    for (const [x, h, z] of [[.4, .2, .04], [.47, .25, .0], [.54, .21, .05], [.61, .18, .01]]) { tube([x, SY, z], [x, SY + h, z], .008, LEAF2, 4); add(G.sph(.045, 10, 8), PINK, x, SY + h + .012, z, 0, 0, 0, [1, .8, 1]); add(G.sph(.02, 8, 6), MUSTARD, x, SY + h + .036, z + .012); }
    add(G.sph(.07, 10, 8), LEAF, .5, SY + .05, .04, 0, 0, 0, [1.8, .6, 1]);
    // butterfly, the sign stake
    for (const s of [-1, 1]) add(G.sph(.022, 8, 6), '#ffab4c', .16 + s * .02, SY + .27, .02, 0, 0, s * .5, [1, .25, 1.2]);
    add(G.cap(.006, .03, 2, 4), INK, .16, SY + .27, .02, HP, 0, 0);
    add(G.box(.025, .3, .025, .006), woodD, -.48, SY + .1, .17);
    add(G.box(.2, .1, .02, .006), '#f6e2c0', -.48, SY + .3, .17);
  }));
  f.add(mg('planter-sign', atlasMat(), ({ add }) => add(quadGeo(.19, .095, RG.love), -.48, SY + .3, .17 + .01 + .006)));
  f.spot('behind', null, .5, SY, -.13, { maxH: .3, label: '꽃 화단 속', scale: .7 });
};

// 사방치기 (1×2, flat): a chalk hopscotch court drawn on the paving — numbered pastel squares up to a 하늘 half-moon,
// doodles, a pebble in square 3, two chalk sticks, and a flat blue chalk tin whose lid flips open.
B.hopscotch = (f, T) => {
  f.add(transparent(mg('hopscotch-chalk', hopMat(), ({ add }) => add(new THREE.PlaneGeometry(.94, 1.92).rotateX(-HP), 0, .006, 0))));
  f.add(mc('hopscotch', ({ add }) => {
    add(stoneGeo(77, .2), '#b9b2c4', .14, .011, .41, 0, .6, 0, [.05, .011, .04]);
    add(G.cyl(.009, .009, .09, 8), PINK, .38, .009, .36, 0, .4, HP);
    add(G.cyl(.009, .009, .07, 8), YELLOW, .37, .009, .18, 0, -.7, HP);
  }));
  const tin = new THREE.Group(); tin.position.set(.3, 0, .8); tin.rotation.y = -.3;
  const TW = .2, TD = .13, TH = .018, tt = .006;
  tin.add(mc('hopscotch-tin', ({ add }) => {
    add(G.box(TW - .004, .004, TD - .004, .001), '#3f74c8', 0, .002, 0);
    for (const s of [-1, 1]) { add(G.box(TW, TH, tt, .002), '#4f8fe8', 0, TH / 2, s * (TD / 2 - tt / 2)); add(G.box(tt, TH, TD - 2 * tt, .002), '#4f8fe8', s * (TW / 2 - tt / 2), TH / 2, 0); }
    ['#ff6b8a', '#ffc23d', '#7fd6c0'].forEach((c, k) => add(G.cyl(.008, .008, .15, 8), c, 0, .004 + .008, -TD / 2 + tt + .01 + k * .017, 0, 0, HP));
  }));
  const pv = new THREE.Group(); pv.position.set(0, TH, -TD / 2);
  pv.add(mc('hopscotch-lid', ({ add }) => add(G.box(TW + .006, .005, TD + .004, .002), '#4f8fe8', 0, .0025, TD / 2)));
  pv.add(mg('hopscotch-lidprint', atlasMat(), ({ addM }) => addM(quadGeo(TW - .02, (TW - .02) * .625, RG.tin).rotateX(-HP), xf(0, .005 + .006, TD / 2))));
  tin.add(pv); f.add(tin);
  const p = f.part('lid', pv, t2 => { pv.rotation.x = -1.9 * t2; }, { label: '분필 통', sfx: 'open', dur: .26 });
  f.spot('inside', tin, .0, .004, .025, { part: p, maxH: .016, label: '분필 통 안', scale: .75 });
};

// 아파트 동 외벽 (2×1, backdrop): the bottom of 103동 — a tiled façade with a stone base and a terracotta floor band, a
// ground-floor window with a flower box and bushes, two balconies (potted plants and a towel on one, an AC unit and red
// geraniums on the other) in front of sliding windows, a 몽글마을 103동 plate, a downpipe, and the entrance porch: stone
// piers, a dark canopy with the big 103, an intercom, steps, and sliding glass doors (자동문) onto a lobby with mailboxes.
B.aptwall = (f, T) => {
  const pl = col(T, 'plaster'), band = col(T, 'aptband'), cano = col(T, 'canopy'), stone = col(T, 'stone'), tk = [pl, band, cano, stone].join(',');
  const WF = -.32, H = 3.0, F2 = 1.56, FR = '#f4f1ec', RAIL = '#4a4f5e';
  f.add(mt('aptwall-facade|' + tk, facadeTex(), ({ add }) => {
    add(G.box(2.0, H, .18, .01), pl, 0, H / 2, WF - .09, 0, 0, 0, 1, { w: .8 });
  }));
  f.add(mt('aptwall-stone|' + tk, speckleTex(), ({ add }) => {
    const st = shade(stone, -.06);
    add(G.box(1.996, .28, .19, .01), st, 0, .14, WF - .075);
    add(G.box(.06, 1.3, .44, .01), stone, .03, .65, -.1);
    add(G.box(.06, 1.3, .44, .01), stone, .91, .65, -.1);
    add(G.box(.22, 1.3, .08, .01), stone, .11, .65, .14);
    add(G.box(.22, 1.3, .08, .01), stone, .83, .65, .14);
    add(G.box(.5, .2, .08, .01), stone, .47, 1.2, .14);
    add(G.box(.84, .1, .44, .008), '#e9e4dc', .47, .05, -.1);
    add(G.box(.7, .1, .14, .008), shade(stone, -.1), .47, .05, .25);
    add(G.box(.7, .05, .14, .008), shade(stone, -.14), .47, .025, .39);
  }));
  f.add(mc('aptwall|' + tk, ({ add, tube }) => {
    add(G.box(1.996, .12, .19, .012), band, 0, F2 - .06, WF - .065);
    add(G.box(2.04, .1, .21, .015), shade(pl, -.1), 0, H + .05, WF - .075);
    tube([-.95, H, WF + .03], [-.95, .02, WF + .03], .022, '#c9c4bc', 8);
    for (const y of [.6, 1.4, 2.3]) add(G.box(.05, .03, .05, .006), '#a9a49c', -.95, y, WF + .015);
    // ground-floor window, sill, flower box, bushes
    const wx = -.54, wy = .95;
    for (const s of [-1, 1]) add(G.box(.04, .7, .04, .008), FR, wx + s * .32, wy, WF + .02);
    for (const s of [-1, 1]) add(G.box(.68, .04, .04, .008), FR, wx, wy + s * .33, WF + .02);
    add(G.box(.03, .62, .03, .006), FR, wx, wy, WF + .015);
    add(G.box(.74, .04, .1, .008), FR, wx, wy - .37, WF + .05);
    add(G.box(.66, .12, .14, .015), '#e88a5c', wx, wy - .45, WF + .07);
    for (let k = 0; k < 7; k++) { const x = wx - .27 + k * .09; add(G.sph(.045, 8, 6), k % 2 ? LEAF : LEAF2, x, wy - .37, WF + .07 + (k % 2) * .02); add(G.sph(.022, 8, 6), ['#ff4f5e', WHITE, PINK][k % 3], x + .01, wy - .33, WF + .1); }
    for (const [x, s] of [[-.8, 1.2], [-.5, 1.4], [-.2, 1.1]]) bush(add, x, 0, -.14, s);
    // balconies
    for (const [bx, bw] of [[-.52, .76], [.5, .76]]) {
      add(G.box(bw + .04, .07, .36, .012), FR, bx, F2 + .035, WF + .18);
      for (const s of [-1, 1]) add(G.box(.03, .46, .03, .006), RAIL, bx + s * bw / 2, F2 + .3, WF + .34);
      add(G.box(bw + .04, .04, .05, .01), RAIL, bx, F2 + .54, WF + .34);
      for (const s of [-1, 1]) add(G.box(.04, .04, .3, .01), RAIL, bx + s * (bw / 2 + .0), F2 + .54, WF + .18);
      for (let k = 1; k < 9; k++) add(G.box(.012, .44, .012, .003), RAIL, bx - bw / 2 + k * bw / 9, F2 + .29, WF + .34);
      for (const s of [-1, 1]) add(G.box(.04, .98, .04, .008), FR, bx + s * .36, F2 + .62, WF + .02);
      add(G.box(.76, .04, .04, .008), FR, bx, F2 + 1.11, WF + .02); add(G.box(.76, .04, .04, .008), FR, bx, F2 + .13, WF + .02); add(G.box(.03, .9, .03, .006), FR, bx, F2 + .62, WF + .015);
    }
    // left balcony: potted plants and a towel; right balcony: an AC unit and geraniums
    add(G.cyl(.07, .055, .13, 14), '#e88a5c', -.72, F2 + .135, WF + .14); add(G.cyl(.012, .015, .2, 6), '#8a5a3c', -.72, F2 + .3, WF + .14);
    add(G.sph(.12, 12, 9), LEAF2, -.72, F2 + .44, WF + .14); add(G.sph(.08, 10, 8), LEAF, -.66, F2 + .5, WF + .18);
    add(G.cyl(.055, .045, .1, 12), CREAM, -.5, F2 + .12, WF + .12); for (let k = 0; k < 5; k++) add(G.cone(.02, .12, 5), LEAF3, -.5 + Math.cos(k) * .02, F2 + .22, WF + .12 + Math.sin(k) * .02, Math.sin(k) * .3, 0, Math.cos(k) * .3);
    add(G.box(.3, .36, .012, .004), '#ff8fb8', -.3, F2 + .4, WF + .372); add(G.box(.304, .04, .016, .003), WHITE, -.3, F2 + .32, WF + .372);
    add(G.box(.34, .26, .18, .02), '#f6f7f9', .66, F2 + .2, WF + .13);
    add(G.cyl(.09, .09, .01, 22), '#c9cfe0', .62, F2 + .2, WF + .222, HP, 0, 0); add(G.cyl(.03, .03, .014, 12), '#8a90a3', .62, F2 + .2, WF + .226, HP, 0, 0);
    for (let k = 0; k < 4; k++) add(G.box(.17, .006, .006, .001), '#8a90a3', .62, F2 + .2 - .06 + k * .04, WF + .236);
    add(G.box(.5, .1, .1, .01), '#c0603f', .38, F2 + .5, WF + .41);
    for (let k = 0; k < 6; k++) { const x = .17 + k * .085; add(G.sph(.04, 8, 6), LEAF2, x, F2 + .57, WF + .41); add(G.sph(.024, 8, 6), '#ff4f5e', x + .01, F2 + .61, WF + .42 + (k % 2) * .02); }
    // 103동 plate up high
    add(G.box(.52, .17, .02, .006), WHITE, -.48, 2.84, WF + .01);
    // entrance: canopy, lobby lamp, mailboxes, intercom, step rail, a pot
    add(G.box(1.02, .22, .64, .02), cano, .47, 1.41, 0);
    add(G.box(.06, .36, .3, .008), ALU, .09, .78, -.18);
    for (let j = 0; j < 3; j++) for (let k = 0; k < 2; k++) { add(G.box(.008, .1, .13, .002), '#c9cfe0', .124, .66 + j * .12, -.25 + k * .14); add(G.box(.004, .012, .06, .001), CHAR, .13, .69 + j * .12, -.25 + k * .14); }
    add(G.box(.13, .2, .02, .006), '#4a4f5e', .83, .95, .18 + .01);
    tube([.1, 0, .44], [.1, .6, .44], .016, RAIL, 8); tube([.1, .6, .2], [.1, .6, .44], .016, RAIL, 8);
    add(G.cyl(.1, .08, .18, 16), '#e88a5c', -.06, .09, .34); bush(add, -.06, .18, .34, .7, [LEAF, LEAF2, LEAF3]);
  }));
  f.add(mg('aptwall-lamp', bulbMat(), ({ add }) => add(new THREE.SphereGeometry(.05, 12, 8), .47, 1.3 - .02, -.1)));
  f.add(mg('aptwall-prints', signMat(), ({ add }) => {
    add(quadGeo(.6, .62, RG.win), -.54, .95, WF + .006);
    for (const bx of [-.52, .5]) add(quadGeo(.7, .94, RG.win2), bx, F2 + .62, WF + .006);
    add(quadGeo(.5, .18, RG.apt103), .47, 1.41, .32 + .006);
    add(quadGeo(.48, .144, RG.dong), -.48, 2.84, WF + .02 + .006);
    add(quadGeo(.1, .15, RG.phone), .83, .95, .2 + .006);
  }));
  // sliding glass doors (two leaves part sideways behind the piers)
  const leaf = (x, sticker) => {
    const g = new THREE.Group(); g.position.set(x, .1, .07);
    g.add(mc('aptwall-leaf', ({ add }) => {
      for (const s of [-1, 1]) add(G.box(.03, 1.0, .03, .006), '#5b6070', s * .11, .5, 0);
      for (const y of [.02, .98]) add(G.box(.25, .04, .03, .006), '#5b6070', 0, y, 0);
    }));
    g.add(transparent(mg('aptwall-glass', glassMat(), ({ add }) => add(new THREE.PlaneGeometry(.19, .94), 0, .5, 0))));
    if (sticker) g.add(mg('aptwall-auto', atlasMat(), ({ add }) => add(quadGeo(.16, .06, RG.auto), -.02, .75, .006)));
    f.add(g); return g;
  };
  const L = leaf(.345, false), R = leaf(.595, true);
  const p = f.part('slide', [L, R], (t2, bl, br) => { L.position.x = bl.p.x - .14 * t2; R.position.x = br.p.x + .14 * t2; }, { label: '103동 현관문', sfx: 'drawer', dur: .36 });
  f.spot('inside', null, .47, .1, -.04, { part: p, maxH: .45, label: '103동 현관 안', scale: .8 });
};

export const PLAYGROUND_BUILDERS = B;

export const PLAYGROUND_INFO = {
  slidetower: { w: 2, d: 2, name: '미끄럼틀 놀이탑', price: 600, region: 'park' },
  swings2: { w: 2, d: 1, name: '그네', price: 380, region: 'park' },
  seesaw2: { w: 2, d: 1, name: '시소', price: 280, region: 'park' },
  sandbox2: { w: 2, d: 2, name: '모래놀이터', price: 340, region: 'park' },
  springrider: { w: 1, d: 1, name: '스프링 놀이기구', price: 220, region: 'park' },
  pavilion2: { w: 2, d: 2, name: '단지 정자', price: 560, region: 'park' },
  bikeshelter: { w: 2, d: 1, name: '자전거 거치대', price: 420, region: 'park' },
  recyclebins: { w: 2, d: 1, name: '분리수거함', price: 300, region: 'park' },
  icecart: { w: 2, d: 1, name: '아이스크림 카트', price: 460, region: 'park' },
  picnic2: { w: 2, d: 1, name: '피크닉 테이블', price: 320, region: 'park' },
  bbqgrill: { w: 1, d: 1, name: '바비큐 그릴', price: 240, region: 'park' },
  catfeeder: { w: 1, d: 1, name: '길고양이 급식소', price: 260, region: 'park' },
  noticeboard2: { w: 1, d: 1, name: '단지 게시판', price: 200, region: 'park' },
  streetlamp2: { w: 1, d: 1, name: '단지 가로등', price: 180, region: 'park' },
  planter: { w: 2, d: 1, name: '꽃 화단', price: 160, region: 'park' },
  hopscotch: { w: 1, d: 2, name: '사방치기', price: 120, region: 'park', floor: true },
  aptwall: { w: 2, d: 1, name: '아파트 동 외벽', price: 500, region: 'park' },
};

// Suggested outdoor theme (stages.js THEMES shape, a superset of the ALLEY / PARK keys): warm light-beige brick paving
// (outdoor.js 'brickpave' reads pave; the bleed apron reads floor / floor2) under a bright afternoon light, plus every
// key these props read.
export const PLAYGROUND_THEMES = {
  playground: { name: '단지 놀이터', friend: null, bg: ['#fff4dc', '#ffe7c6'], base: '#d9c4a5',
    floorKind: 'brickpave', floor: '#ecdcc2', floor2: '#dcc6a6', pave: '#efe0c6', asphalt: '#8a8190', grass: '#9ad66f', sand: '#f0d39c', dirt: '#c8956a',
    wallKind: 'plain', wall: '#f6ead8', wall2: '#e3cdb1', wainscot: '#ead6bc', wallEdge: '#fff8ee', trim: '#ffffff',
    plaster: '#f4e7d3', brick: '#d0785a', roofTile: '#6b6f7c', gate: '#3b8f6a', concrete: '#e2d9cd', stone: '#cfc3b6', rock: '#b9b2b6',
    hedge: '#4fa85a', fence: '#f0d9b0', flower: '#ff8fb8', leaf: '#5fc45a', soil: '#7a5536',
    wood: '#e9b47e', woodD: '#b98252', body: '#fff7ea', accent: '#7fd6c0', accent2: '#8fd3f4', accent3: '#ffc23d', door: '#bfe6d2',
    knob: '#ffd84a', sheet: '#ffffff', pillow: '#fff3d6', fabric: '#fff0d8', fabric2: '#ffe3bf', curtain: '#fff3d6', rug: '#fff3df',
    rug2: '#ffd9a8', pot: '#e88a5c', top: '#fffaf0', vend: '#ff4d5e', bin: '#3f9a6e', bike: '#4fae9b',
    slide: '#ff5a4a', tower: '#3f7fd8', panel: '#ffc23d', tube: '#ffc23d', swing: '#3fae74', seesaw: '#ffb02e', rider: '#4f9be8',
    awning: '#ff5a4a', cart: '#fffaf2', shelter: '#2fa58e', lamp: '#33394a', board: '#3b8f6a', cloth: '#ff5a5a', grill: '#3d3a52',
    feedroof: '#d9644a', aptband: '#c98a6a', canopy: '#4a4f5e',
    light: { ambColor: '#ffe9d2', amb: 1.55, sunColor: '#fff0d6', sun: 2.45 } },
};

// ═════════════════════════════════════════════ ITEMS ═════════════════════════════════════════════
// Same shape as items.js ITEMS: { name, h, flat?, build() } → Group, origin bottom centre.
//   Object.assign(ITEMS, PLAYGROUND_ITEMS)   (and push the keys into TARGET_POOL / a theme pool to make them stage targets)
export const PLAYGROUND_ITEMS = {
  // 모래삽: a red sand spade lying down — a rounded blade with a socket, a wooden shaft and a yellow T-grip
  shovel: { name: '모래삽', h: .05, flat: true, build() {
    const g = grp(), RD = '#ff4f5e';
    g.add(mc('it-shovel', ({ add }) => {
      const s = new THREE.Shape(); s.moveTo(-.055, -.05); s.lineTo(.03, -.058); s.quadraticCurveTo(.1, -.045, .115, 0); s.quadraticCurveTo(.1, .045, .03, .058); s.lineTo(-.055, .05); s.closePath();
      add(G.ext(s, .012, .004, 6), RD, .07, .004, 0, -HP, 0, 0);
      add(G.cyl(.02, .016, .06, 12), RD, -.005, .022, 0, 0, 0, HP);
      add(G.cyl(.012, .012, .18, 10), '#e9b47e', -.12, .022, 0, 0, 0, HP);
      add(G.cyl(.016, .016, .09, 12), YELLOW, -.215, .022, 0, HP, 0, 0);
      for (const s2 of [-1, 1]) add(G.sph(.017, 8, 6), YELLOW, -.215, .022, s2 * .045);
    }));
    return g;
  } },
  // 축구공: a white soccer ball with twelve black pentagon patches
  ball2: { name: '축구공', h: .2, build() {
    const g = grp(), R = .1, ph = (1 + Math.sqrt(5)) / 2;
    g.add(mc('it-ball2', ({ add, addM }) => {
      add(G.sph(R, 26, 18), WHITE, 0, R, 0);
      for (const v of [[-1, ph, 0], [1, ph, 0], [-1, -ph, 0], [1, -ph, 0], [0, -1, ph], [0, 1, ph], [0, -1, -ph], [0, 1, -ph], [ph, 0, -1], [ph, 0, 1], [-ph, 0, -1], [-ph, 0, 1]]) {
        const d = v3(v).normalize();
        addM(new THREE.SphereGeometry(R + .003, 5, 2, 0, PI * 2, 0, .42), new THREE.Matrix4().compose(new THREE.Vector3(0, R, 0), new THREE.Quaternion().setFromUnitVectors(Y, d), new THREE.Vector3(1, 1, 1)), CHAR);
      }
    }));
    return g;
  } },
  // 고무 오리: a yellow bath duck in a red-and-white swim ring, wearing a little blue sailor cap
  rubberduck2: { name: '고무 오리', h: .28, build() {
    const g = grp(), yl = '#ffd23f';
    g.add(mc('it-rubberduck2', ({ add }) => {
      for (let k = 0; k < 8; k++) add(G.tor(.1, .04, PI / 4, 8, 6), k % 2 ? WHITE : '#ff5a5a', 0, .04, 0, HP, 0, k * PI / 4);
      add(G.sph(.085, 16, 12), yl, 0, .095, -.01, 0, 0, 0, [1.15, .9, 1.25]);
      add(G.cone(.03, .05, 8), yl, 0, .15, -.115, -.9, 0, 0);
      for (const s of [-1, 1]) add(G.sph(.04, 10, 8), shade(yl, -.05), s * .085, .11, -.01, 0, 0, 0, [.4, .7, 1]);
      add(G.sph(.062, 14, 10), yl, 0, .19, .03);
      add(G.sph(.03, 10, 8), '#ff9a3c', 0, .178, .09, 0, 0, 0, [1.2, .5, 1]);
      for (const s of [-1, 1]) { add(G.sph(.011, 6, 4), INK, s * .03, .205, .078); add(G.sph(.014, 6, 4), BLUSH, s * .048, .182, .068, 0, 0, 0, [1, .6, .4]); }
      add(G.cyl(.045, .05, .025, 16), WHITE, 0, .248, .02, -.15, 0, 0);
      add(G.cyl(.051, .051, .01, 16), '#3f86e0', 0, .238, .022, -.15, 0, 0);
      add(G.sph(.012, 6, 4), '#ff5a5a', 0, .263, .018);
    }));
    return g;
  } },
  // 주스팩: an orange-juice carton with a printed orange label and a pink straw
  juicebox: { name: '주스팩', h: .225, build() {
    const g = grp(), W = .085, D = .055, H = .15;
    g.add(mc('it-juicebox', ({ add, tube }) => {
      add(G.box(W, H, D, .006), '#ffab4c', 0, H / 2, 0);
      add(G.box(W - .012, .008, D - .012, .003), WHITE, 0, H + .004, 0);
      tube([.02, H + .004, 0], [.034, H + .062, -.006], .005, PINK, 6);
      tube([.034, H + .062, -.006], [.046, H + .068, -.006], .005, PINK, 6);
    }));
    g.add(mg('it-juicebox-label', atlasMat(), ({ add }) => add(quadGeo(W - .012, (W - .012) * 96 / 56, RG.juice), 0, H / 2, D / 2 + .006)));
    return g;
  } },
  // 머리핀: a flat pink snap hair clip with a yellow heart charm
  // 머리핀: a hair clip with a big ribbon bow on it, so it reads at phone size (user, 10/17: some things couldn't be told apart)
  hairpin: { name: '머리핀', h: .06, flat: true, build() {
    const g = grp();
    g.add(mc('it-hairpin2', ({ add }) => {
      add(G.box(.2, .012, .03, .006), '#d9dde8', 0, .008, 0);   // the clip
      add(G.box(.18, .006, .02, .003), '#b8bfd0', 0, .017, 0);
      for (const sx of [-1, 1]) { const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(sx * .05, .06, sx * .085, .04); s.quadraticCurveTo(sx * .1, 0, sx * .085, -.04); s.quadraticCurveTo(sx * .05, -.06, 0, 0);
        add(G.ext(s, .02, .006, 8), '#ff7eb6', 0, .03, -.01, -HP, 0, 0); }
      for (const sx of [-1, 1]) add(G.box(.025, .008, .07, .004), '#ff5a9a', sx * .03, .03, .05, 0, sx * .5, 0);   // ribbon tails
      add(G.sph(.022, 10, 8), '#ffd23f', 0, .045, 0);
    }));
    return g;
  } },
};

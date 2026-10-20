// Mountain-trail props (동네 뒷산 산길): the neighbourhood hill behind the apartments, where Korean, Japanese and American
// trails meet — a crooked red pine with a magpie, a stone cairn (돌탑), a wooden signpost to the summit, timber deck stairs
// up a bank, a spring (약수터) with plastic dippers, a small tiled pavilion (정자), a log bench, an outdoor gym hand-wheel,
// a plank bridge over a brook, a piece of brook with stepping stones, a string of paper lanterns, a hiking backpack, a
// pup tent, a wish box tied with five-colour cloth (성황당) and a dry-stone wall with a pumpkin vine.
// Same contract as apt-props.js / street-props.js:
//   builder(f, T, opts) fills a Furn. Origin = footprint centre on the ground, the piece faces +z, back toward -z, 1 tile = 1.
//   parts open / lift / flip / curtain; spots: inside (needs its part open) | under/behind (visible but tucked) | on (plain sight).
//   Lockable parts carry p.lockable = true and p.lockKind ('pad' | 'code'), with f.lockAt where the lock hardware goes.
// Toy-set rules (as street-props.js): chunky silhouettes, flat matte colours, few draw calls. Plain static decor is merged
// into ONE vertex-coloured mesh per piece (mc). Textured surfaces (bark, stone, planks, needles, fabric, roof tiles) are
// vertex-coloured meshes printed with one shared greyscale texture each (mt), so one texture tints to any colour; signs and
// prints share one label atlas (mg). Every moving part is its own mesh. Decals sit >= .006 in front of the face they are on.
//   import { TRAIL_BUILDERS, TRAIL_INFO, TRAIL_THEMES, TRAIL_ITEMS } from './gfx/trail-props.js';
//   registerFurniture(TRAIL_BUILDERS, TRAIL_INFO); Object.assign(ITEMS, TRAIL_ITEMS);
//   for (const k in TRAIL_THEMES) THEMES[k] = { ...THEMES.my, ...TRAIL_THEMES[k] };
// Bright afternoon palette on a warm dirt path: honey wood, red-pine bark, pine green, blue-grey roof tiles, warm stone,
// clear water blue, and loud accents (tomato, mustard, sky, mint) for the man-made bits.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { grp, mat, mesh, geo, canvasTex, texCache, roundRect, shade, STYLE } from './kit.js';
import { rng } from '../util.js';
import { tr } from '../i18n.js';

const PI = Math.PI, HP = PI / 2;

// ── palette ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Theme keys first (pieces follow the scene they are bought into). Extra keys only the trail theme sets:
// bark (tree bark), pine (pine needles), stone (cut stone), rock (boulders), tile (pavilion roof), pillar (pavilion posts),
// dan (dancheong green), tent / tent2 (tent fly / door), bag (backpack), gym / gym2 (outdoor-gym frame / wheel).
const K = { wood: '#f3c47e', woodD: '#b5773f', stone: '#d3d0d6', rock: '#aaa6b9', bark: '#a7643f', pine: '#3f9d5f',
  tile: '#5f6f8f', pillar: '#b8553a', dan: '#3f9b84', tent: '#3fb6a0', tent2: '#ffc93c', bag: '#ff6b4a', gym: '#ffc23d', gym2: '#ff5a4a' };
const col = (T, k) => (T && T[k]) || K[k];
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', SKY = '#8fd3f4', MUSTARD = '#ffc23d', TOMATO = '#ff6b57',
  MINT = '#7fd6c0', BLUSH = '#ff9fb5', LEAF = '#6cc46a', LEAF2 = '#4ea85a', LEAF3 = '#8fd47a', ORANGE = '#ffab4c',
  STEEL = '#c9cfe0', STEEL2 = '#a9b2c8', CHAR = '#3b3550', ROPE = '#e2c088', PINERED = '#cf7448', EARTH = '#a8744c',
  NAVY = '#33456e', SAND = '#a8825e';

// ── geometry helpers (same as street-props.js) ──────────────────────────────────────────────────────────────────
const G = {
  box: (w, h, d, r = .02, seg = 1) => { r = Math.min(r, Math.min(w, h, d) * .45); return r > .004 ? new RoundedBoxGeometry(w, h, d, seg, r) : new THREE.BoxGeometry(w, h, d); },
  pbox: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  sph: (r, ws = 10, hs = 8) => new THREE.SphereGeometry(r, ws, hs),
  dome: (r, ws = 16, hs = 5) => new THREE.SphereGeometry(r, ws, hs, 0, PI * 2, 0, HP),
  cyl: (rt, rb, h, seg = 14, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open),
  cone: (r, h, seg = 8) => new THREE.ConeGeometry(r, h, seg),
  cap: (r, len, cs = 2, rs = 6) => new THREE.CapsuleGeometry(r, len, cs, rs),
  tor: (R, t, arc = PI * 2, rs = 5, ts = 20) => new THREE.TorusGeometry(R, t, rs, ts, arc),
  ext: (shape, depth, bevel = 0, curve = 6) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: curve }),
};
const Y = new THREE.Vector3(0, 1, 0);
const xf = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(s[0], s[1], s[2]));
const tubeM = (a, b) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length(); return [L, new THREE.Matrix4().compose(A.clone().add(Bv).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(Y, d.normalize()), new THREE.Vector3(1, 1, 1))]; };
const tint = hex => (STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(hex) : hex);
const I4 = new THREE.Matrix4();

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
  const g = geo('tmc|' + STYLE.mode + '|' + key, () => {
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
// Textured + vertex-coloured: every piece is printed with ONE shared greyscale texture (bark furrows, stone joints, plank
// grain…) multiplied by its own colour. uv per piece:
//   number s       → box-mapped in the piece's own (untransformed) axes, s units per repeat (model long things along x)
//   { w: s }       → box-mapped in the piece's final position (stones, blobs), s units per repeat   [the default, s = .4]
//   { s, swap }    → as a number, with u / v swapped (grain along local z)
//   [su, sv, swap] → the geometry's own uvs scaled (cylinders: u round, v along), optionally swapped
//   null           → the geometry's own uvs as they are
const VTM = {};
function vtmat(map) {
  const k = STYLE.mode + '|' + map.uuid;
  // (the texture comes from the per-scene texture cache: when that lets it go, this material goes too — QA 10/20: the
  // cache's old signs stayed alive through here, their canvases piling up stage after stage)
  if (!VTM[k]) map.addEventListener('dispose', () => { delete VTM[k]; });
  return VTM[k] || (VTM[k] = STYLE.mode !== 'std'
    ? new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, map, gradientMap: STYLE.grad })
    : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, map, roughness: .82 }));
}
function swapUV(c) { const a = c.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getY(i), a.getX(i)); }
function mt(key, map, fn) {
  const g = geo('tmt|' + STYLE.mode + '|' + key, () => {
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
    // an open tube; its own uvs run round (u) and along (v), scaled to world size (s units per repeat)
    const tube = (a, b, r, color, s = .3, swap = false, r2 = r, seg = 10) => { const [L, m] = tubeM(a, b); addM(new THREE.CylinderGeometry(r2, r, L, seg, 1, true), m, color, swap ? [L / s, 2 * PI * r / s, true] : [2 * PI * r / s, L / s]); };
    fn({ add, addM, tube });
    const out = mergeGeometries(list, false); out.name = key;
    return out;
  });
  return mesh(g, vtmat(map));
}
// One mesh from many pieces sharing one material (labels, prints, water). fn gets { add, addM }; keeps uvs.
function mg(key, m, fn) {
  const g = geo('tmg|' + key, () => {
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
const subCell = (c, u0, u1, v0 = 0, v1 = 1) => [c[0] + (c[2] - c[0]) * u0, c[1] + (c[3] - c[1]) * v0, c[0] + (c[2] - c[0]) * u1, c[1] + (c[3] - c[1]) * v1];
const quadGeo = (w, h, rc) => cellUV(new THREE.PlaneGeometry(w, h), rc);
const discGeo = (r, rc) => cellUV(new THREE.CircleGeometry(r, 32), rc).rotateX(-HP);
// a flat shape printed with an atlas cell; the shape's bounding rect is w × h, centred on its origin
function shapeRect(shape, w, h, rc) {
  const g = new THREE.ShapeGeometry(shape, 4), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w + .5, uv.getY(i) / h + .5);
  return cellUV(g, rc);
}
// a patch of a sphere's skin facing +z (phi = 90°), printed with an atlas cell (its own uvs already span 0..1)
const sphPatch = (r, a, b, rc) => cellUV(new THREE.SphereGeometry(r, 12, 6, HP - a / 2, a, HP - b / 2, b), rc);
// A lumpy pebble: a sphere with every vertex nudged in or out (welded, so the lumps stay closed). Scale it per use.
function stoneGeo(seed, lump = .14) {
  return geo('tr-stone|' + seed + '|' + lump, () => {
    let g = new THREE.SphereGeometry(1, 12, 8); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4);
    const p = g.attributes.position, r = rng(seed * 7 + 3);
    for (let i = 0; i < p.count; i++) { const s = 1 - lump / 2 + r() * lump; p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, p.getZ(i) * s); }
    g.computeVertexNormals();
    return g;
  });
}
// one face of a square pyramid roof (eave edge along +z), uvs in world units so the tile rows stay parallel to the eave
function roofFace(E, yb, ya, s = .32) {
  const g = new THREE.BufferGeometry(), sl = Math.hypot(E, ya - yb);
  g.setAttribute('position', new THREE.Float32BufferAttribute([-E, yb, E, E, yb, E, 0, ya, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2 * E / s, 0, E / s, sl / s], 2));
  g.computeVertexNormals();
  return g;
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
function mochi(c, x, y, r, body = '#ffffff') {
  c.fillStyle = body; c.beginPath(); c.ellipse(x, y, r, r * .84, 0, 0, PI * 2); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1.1, r * .08); c.stroke();
  c.fillStyle = '#2a1d33'; blob(c, x - r * .34, y - r * .06, r * .1); blob(c, x + r * .34, y - r * .06, r * .1);
  c.fillStyle = '#ff9fb5'; blob(c, x - r * .58, y + r * .2, r * .14); blob(c, x + r * .58, y + r * .2, r * .14);
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1, r * .07); c.beginPath(); c.arc(x, y + r * .06, r * .14, .25, PI - .25); c.stroke();
}
const REP = { repeat: [1, 1] };

// Greyscale surface prints (white = the piece's own colour; darker = grooves, joints, grain).
// wood grain, lines along u
const grainTex = () => tex('tr-grain', 256, 256, (c, w, h) => {
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
const plankTex = () => tex('tr-plank', 256, 256, (c, w, h) => {
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
// bark: a network of wavy vertical furrows with cross links between them, soft plate tones (cylinders: u round, v along)
const barkTex = () => tex('tr-bark', 128, 256, (c, w, h) => {
  const r = rng(51), N = 5;
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) { const rx = 4 + r() * 5, ry = 10 + r() * 22, lt = r() < .5; wrap(w, h, r() * w, r() * h, ry, (X, Yy) => { c.fillStyle = lt ? 'rgba(255,255,255,.7)' : 'rgba(120,85,70,.13)'; c.beginPath(); c.ellipse(X, Yy, rx, ry, 0, 0, PI * 2); c.fill(); }); }
  const xs = Array.from({ length: N }, (_, k) => (k + .3 + r() * .4) * w / N), ph = xs.map(() => r() * 6.28);
  const fx = (k, y) => xs[k % N] + (k >= N ? w : 0) + Math.sin(y / h * PI * 2 * (1 + (k % 2)) + ph[k % N]) * 2.6;
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let k = 0; k < N; k++) {
    let y = r() * 26;
    while (y < h) {
      const y2 = y + (r() - .5) * 16, k2 = k + 1;
      for (const dx of [-w, 0]) for (const dy of [-h, 0, h]) { c.strokeStyle = 'rgba(70,45,35,.5)'; c.lineWidth = 1.5 + r() * .8; c.beginPath(); c.moveTo(fx(k, y) + dx, y + dy); c.lineTo(fx(k2, y2) + dx, y2 + dy); c.stroke(); }
      y += 20 + r() * 32;
    }
  }
  for (let k = 0; k < N; k++) for (const dx of [-w, 0, w]) {
    c.strokeStyle = 'rgba(70,45,35,.62)'; c.lineWidth = 2.2 + (k % 2) * .8; c.beginPath();
    for (let y = 0; y <= h; y += 4) { const x = fx(k, y) + dx; y ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.1; c.beginPath();
    for (let y = 0; y <= h; y += 4) { const x = fx(k, y) + dx + 3.2; y ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  }
}, REP);
// granite speckle for single stones
const speckleTex = () => tex('tr-speck', 256, 256, (c, w, h) => {
  const r = rng(61);
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) { const lt = r() < .5, rad = 8 + r() * 18; wrap(w, h, r() * w, r() * h, rad, (X, Yy) => { c.fillStyle = lt ? 'rgba(255,255,255,.5)' : 'rgba(120,110,105,.09)'; blob(c, X, Yy, rad); }); }
  for (let i = 0; i < 900; i++) { c.fillStyle = r() < .65 ? 'rgba(70,60,62,.3)' : 'rgba(255,255,255,.8)'; const s = .8 + r() * 1.1; c.fillRect(r() * w, r() * h, s, s); }
  c.strokeStyle = 'rgba(70,60,62,.32)'; c.lineWidth = .9;
  for (let i = 0; i < 4; i++) { let x = r() * w, y = r() * h; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 18; y += 4 + r() * 8; c.lineTo(x, y); } c.stroke(); }
}, REP);
// dry-stone masonry: irregular rounded field stones of mixed size, dark clay joints, an ink edge and a highlight
const masonTex = () => tex('tr-mason', 256, 256, (c, w, h) => {
  const r = rng(71), tones = ['#ffffff', '#f0eef3', '#e2dfe6', '#f7f5f1', '#d8d4dc', '#ebe6de'];
  c.fillStyle = '#8a8088'; c.fillRect(0, 0, w, h);
  const rows = 6, rh = h / rows;
  for (let j = 0; j < rows; j++) {
    const n = 4 + (j % 2), sw = w / n, off = r() * sw;
    for (let i = 0; i < n; i++) {
      const cx = off + (i + .5) * sw + (r() - .5) * 5, cy = (j + .5) * rh + (r() - .5) * 4;
      const rx = sw * (.52 + r() * .07), ry = rh * (.56 + r() * .08), rot = (r() - .5) * .35, t = tones[Math.floor(r() * tones.length)];
      const pts = Array.from({ length: 10 }, (_, k) => { const a = k / 10 * PI * 2, q = 1 + (r() - .5) * .18; return [Math.cos(a) * rx * q, Math.sin(a) * ry * q]; });
      const sp = Array.from({ length: 6 }, () => [(r() - .5) * rx * 1.2, (r() - .5) * ry * 1.1]);
      wrap(w, h, cx, cy, rx + 3, (X, Yy) => {
        c.save(); c.translate(X, Yy); c.rotate(rot);
        c.beginPath();
        pts.forEach((p, k) => { const q = pts[(k + 1) % 10], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; if (!k) c.moveTo((pts[9][0] + p[0]) / 2, (pts[9][1] + p[1]) / 2); c.quadraticCurveTo(p[0], p[1], m[0], m[1]); });
        c.closePath(); c.fillStyle = t; c.fill(); c.strokeStyle = 'rgba(50,40,48,.5)'; c.lineWidth = 1.2; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 0, rx * .7, ry * .62, 0, PI * 1.05, PI * 1.45); c.stroke();
        c.fillStyle = 'rgba(70,60,70,.28)'; for (const [sx, sy] of sp) c.fillRect(sx, sy, 1.3, 1.3);
        c.restore();
      });
    }
  }
}, REP);
// pine needles: tufts of short strokes
const needleTex = () => tex('tr-needle', 256, 256, (c, w, h) => {
  const r = rng(81);
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { const rad = 6 + r() * 10; wrap(w, h, r() * w, r() * h, rad, (X, Yy) => { c.fillStyle = 'rgba(0,50,30,.08)'; blob(c, X, Yy, rad); }); }
  c.lineCap = 'round';
  for (let i = 0; i < 300; i++) {
    const a0 = r() * PI * 2, dark = r() < .78;
    wrap(w, h, r() * w, r() * h, 9, (X, Yy) => {
      c.strokeStyle = dark ? 'rgba(10,60,35,.34)' : 'rgba(255,255,255,.6)'; c.lineWidth = .9;
      for (let k = 0; k < 5; k++) { const a = a0 + (k - 2) * .32, l = 4 + (k % 2) * 2.5; c.beginPath(); c.moveTo(X, Yy); c.lineTo(X + Math.cos(a) * l, Yy + Math.sin(a) * l); c.stroke(); }
    });
  }
}, REP);
// ripstop nylon
const fabricTex = () => tex('tr-fabric', 128, 128, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(0,0,0,.06)'; for (let k = 0; k < w; k += 8) { c.fillRect(k, 0, .8, h); c.fillRect(0, k, w, .8); }
  c.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 4; k < w; k += 16) c.fillRect(0, k, w, .7);
}, REP);
// rubber safety mat granules
const rubberTex = () => tex('tr-rubber', 128, 128, (c, w, h) => {
  const r = rng(91);
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { const k = r(); c.fillStyle = k < .45 ? 'rgba(0,0,0,.16)' : k < .8 ? 'rgba(255,255,255,.9)' : 'rgba(255,220,120,.6)'; c.fillRect(r() * w, r() * h, 1.4, 1.2); }
}, REP);
// roof tiles (기와): convex tile columns along v, a course line every 32 units with the round tile-ends' shadows
const tileTex = () => tex('tr-tile', 256, 256, (c, w, h) => {
  for (let k = 0; k < 8; k++) {
    const x = k * 16, g = c.createLinearGradient(x, 0, x + 16, 0);
    g.addColorStop(0, '#8f93a8'); g.addColorStop(.35, '#ffffff'); g.addColorStop(.55, '#f4f4f8'); g.addColorStop(1, '#8f93a8');
    c.fillStyle = g; c.fillRect(x, 0, 16, h);
  }
  for (let y = 0; y < h; y += 32) {
    c.fillStyle = 'rgba(40,40,70,.35)'; c.fillRect(0, y, w, 2.2);
    for (let k = 0; k < 8; k++) { c.fillStyle = 'rgba(40,40,70,.18)'; c.beginPath(); c.ellipse(k * 16 + 8, y + 2, 7.5, 5, 0, 0, PI); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(0, y + 2.2, w, 1);
  }
}, REP);
// end grain: rings round the centre with a dark bark edge (circle uvs)
const ringTex = () => tex('tr-ring', 128, 128, (c, w, h) => {
  const r = rng(101), cx = w / 2, cy = h / 2;
  c.fillStyle = '#fffaf2'; c.fillRect(0, 0, w, h);
  c.lineWidth = .9;
  for (let rr = 3; rr < 28; rr += 2.6 + r() * 1.4) {
    c.strokeStyle = `rgba(150,90,40,${.22 + r() * .14})`; c.beginPath();
    for (let a = 0; a <= 64; a++) { const t = a / 64 * PI * 2, q = rr * (1 + .04 * Math.sin(t * 3 + rr)); a ? c.lineTo(cx + Math.cos(t) * q, cy + Math.sin(t) * q) : c.moveTo(cx + Math.cos(t) * q, cy + Math.sin(t) * q); }
    c.stroke();
  }
  c.strokeStyle = 'rgba(120,70,30,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 9, cy - 20); c.stroke();
  c.strokeStyle = 'rgba(90,50,30,.85)'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, 30, 0, PI * 2); c.stroke();
}, REP);
// clear brook water (full colour)
const waterTex = () => tex('tr-water', 256, 256, (c, w, h) => {
  const r = rng(111);
  c.fillStyle = '#72c6ee'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 24; i++) { const lt = r() < .55, rad = 10 + r() * 22; wrap(w, h, r() * w, r() * h, rad, (X, Yy) => { c.fillStyle = lt ? '#86d3f4' : '#62b6e2'; c.beginPath(); c.ellipse(X, Yy, rad * 1.5, rad, 0, 0, PI * 2); c.fill(); }); }
  for (let i = 0; i < 9; i++) wrap(w, h, r() * w, r() * h, 8, (X, Yy) => { c.fillStyle = 'rgba(60,100,140,.22)'; c.beginPath(); c.ellipse(X, Yy, 5 + r() * 3, 3.5, r() * 3, 0, PI * 2); c.fill(); });
  c.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h, l = 8 + r() * 12; wrap(w, h, x, y, 22, (X, Yy) => { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(X, Yy, l, 3, 0, PI * 1.1, PI * 1.9); c.stroke(); }); }
  for (let i = 0; i < 10; i++) wrap(w, h, r() * w, r() * h, 4, (X, Yy) => { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(X, Yy - 3); c.lineTo(X + 1, Yy); c.lineTo(X, Yy + 3); c.lineTo(X - 1, Yy); c.fill(); c.beginPath(); c.moveTo(X - 3, Yy); c.lineTo(X, Yy + .8); c.lineTo(X + 3, Yy); c.lineTo(X, Yy - .8); c.fill(); });
}, REP);

// Label atlas, 1024² canvas = 512² drawing units: a dancheong band, three signpost arrows, the spring sign, the pavilion
// name board, 산불조심, the wish plaque, the backpack patch, a wish tag, the gym how-to plate, the bandana, a baduk board, the
// twister disc, four lantern labels and the trail map.
const AT = 512, PXU = .5 / 1024;
const RC = (x, y, w, h) => [x / AT + PXU, 1 - (y + h) / AT + PXU, (x + w) / AT - PXU, 1 - y / AT - PXU];
const RG = {
  dan: RC(0, 0, 512, 40),
  signA: RC(0, 44, 240, 58), signB: RC(244, 44, 240, 58), signC: RC(0, 106, 240, 58), yaksu: RC(244, 106, 150, 60),
  plaque: RC(0, 168, 176, 52), fire: RC(180, 168, 112, 48), wish: RC(296, 168, 80, 52), patch: RC(380, 168, 60, 60), tag: RC(444, 168, 24, 64),
  gym: RC(0, 236, 96, 124), towel: RC(100, 236, 100, 76), baduk: RC(204, 236, 96, 96), disc: RC(304, 236, 96, 96),
  lan0: RC(0, 364, 84, 50), lan1: RC(88, 364, 84, 50), lan2: RC(176, 364, 84, 50), lan3: RC(264, 364, 84, 50),
  map: RC(352, 364, 150, 100),
};
function drawDan(c, x, y, w, h) {
  c.fillStyle = '#3f9b84'; c.fillRect(x, y, w, h);
  c.fillStyle = '#e8433d'; c.fillRect(x, y, w, 4); c.fillRect(x, y + h - 4, w, 4);
  c.fillStyle = '#ffffff'; c.fillRect(x, y + 4, w, 2); c.fillRect(x, y + h - 6, w, 2);
  for (let k = 0; k < w / 64; k++) {
    const cx = x + 32 + k * 64, cy = y + h / 2;
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; c.fillStyle = i % 2 ? '#ffffff' : '#8fd3f4'; c.beginPath(); c.ellipse(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 6, 3.6, a, 0, PI * 2); c.fill(); }
    c.fillStyle = '#e8433d'; blob(c, cx, cy, 5.5); c.fillStyle = '#ffd23f'; blob(c, cx, cy, 2.4);
    c.fillStyle = '#ffab4c'; c.beginPath(); c.moveTo(cx + 32, cy - 7); c.lineTo(cx + 38, cy); c.lineTo(cx + 32, cy + 7); c.lineTo(cx + 26, cy); c.closePath(); c.fill();
    c.fillStyle = '#ffffff'; for (const d of [-14, 14]) blob(c, cx + 32 + d, cy, 2);
  }
}
// an arrow board (dir +1 points right): dark-stained wood, cream lettering, a yellow chevron at the point
function drawSign(c, x, y, w, h, name, dist, dir, px = 24) {
  const tip = w * .08 / .5, x0 = dir > 0 ? x : x + tip, x1 = dir > 0 ? x + w - tip : x + w;
  c.fillStyle = '#6e4428'; c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1.2; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(x, y + 6 + k * 9); c.bezierCurveTo(x + w * .3, y + 3 + k * 9, x + w * .6, y + 10 + k * 9, x + w, y + 5 + k * 9); c.stroke(); }
  c.strokeStyle = '#f3d9a8'; c.lineWidth = 1.8; c.beginPath();
  if (dir > 0) { c.moveTo(x0 + 4, y + 4); c.lineTo(x1, y + 4); c.lineTo(x + w - 6, y + h / 2); c.lineTo(x1, y + h - 4); c.lineTo(x0 + 4, y + h - 4); }
  else { c.moveTo(x1 - 4, y + 4); c.lineTo(x0, y + 4); c.lineTo(x + 6, y + h / 2); c.lineTo(x0, y + h - 4); c.lineTo(x1 - 4, y + h - 4); }
  c.closePath(); c.stroke();
  const ax = dir > 0 ? x1 - 4 : x0 + 4;
  c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(ax + dir * 12, y + h / 2); c.lineTo(ax - dir * 4, y + h / 2 - 12); c.lineTo(ax - dir * 4, y + h / 2 + 12); c.closePath(); c.fill();
  const mid = (x0 + x1) / 2 - dir * 10;
  txt(c, name, mid - 26, y + h / 2 + 1, px, '#fff3dc');
  txt(c, dist, mid + 52, y + h / 2 + 2, 17, '#ffd23f');
}
function drawYaksu(c, x, y, w, h) {
  c.fillStyle = '#fff3dc'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#6e4428'; c.lineWidth = 3; roundRect(c, x + 3, y + 3, w - 6, h - 6, 6); c.stroke();
  txt(c, '약수터', x + 60, y + 25, 30, '#6e4428');
  txt(c, '마실 수 있어요', x + 60, y + 48, 11, '#2f7fd8');
  const dx = x + w - 26, dy = y + h / 2;
  c.fillStyle = '#3f9be0'; c.beginPath(); c.moveTo(dx, dy - 17); c.bezierCurveTo(dx + 14, dy - 2, dx + 13, dy + 13, dx, dy + 13); c.bezierCurveTo(dx - 13, dy + 13, dx - 14, dy - 2, dx, dy - 17); c.fill();
  c.fillStyle = '#ffffff'; blob(c, dx - 4, dy + 3, 3);
}
function drawPlaque(c, x, y, w, h) {
  c.fillStyle = '#3b2f2a'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#ffd23f'; c.lineWidth = 2.6; c.strokeRect(x + 4, y + 4, w - 8, h - 8);
  ['솔', '바', '람', '정'].forEach((s, i) => txt(c, s, x + w / 2 + (i - 1.5) * 34, y + h / 2 + 1, 30, '#ffd23f'));
}
function drawFire(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#e8433d'; c.lineWidth = 4; c.strokeRect(x + 3, y + 3, w - 6, h - 6);
  const fx = x + 20, fy = y + h / 2 + 2;
  c.fillStyle = '#ff7a2f'; c.beginPath(); c.moveTo(fx, fy - 15); c.bezierCurveTo(fx + 11, fy - 4, fx + 10, fy + 10, fx, fy + 10); c.bezierCurveTo(fx - 10, fy + 10, fx - 11, fy - 4, fx, fy - 15); c.fill();
  c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(fx, fy + 4, 4.5, 6, 0, 0, PI * 2); c.fill();
  txt(c, '산불조심', x + 66, y + h / 2 + 1, 21, '#e8433d');
}
function drawWish(c, x, y, w, h) {
  c.fillStyle = '#c8473a'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#ffd23f'; c.lineWidth = 2.2; roundRect(c, x + 4, y + 4, w - 8, h - 8, 5); c.stroke();
  txt(c, '소원', x + w / 2, y + h / 2 + 1, 28, '#ffe9a8');
}
function drawPatch(c, x, y, s) {
  const cx = x + s / 2, cy = y + s / 2;
  c.fillStyle = '#ffffff'; c.fillRect(x, y, s, s);
  c.fillStyle = '#33456e'; blob(c, cx, cy, s / 2 - 1);
  c.fillStyle = '#ffd23f'; blob(c, cx + 11, cy - 10, 5);
  c.fillStyle = '#5fc45a'; c.beginPath(); c.moveTo(cx - 22, cy + 10); c.lineTo(cx - 6, cy - 12); c.lineTo(cx + 4, cy + 1); c.lineTo(cx + 10, cy - 6); c.lineTo(cx + 22, cy + 10); c.closePath(); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(cx - 10, cy - 6); c.lineTo(cx - 6, cy - 12); c.lineTo(cx - 2, cy - 6); c.closePath(); c.fill();
  txt(c, '몽글 산악회', cx, cy + 18, 8, '#ffffff');
}
function drawTag(c, x, y, w, h) {
  c.fillStyle = '#fffdf6'; c.fillRect(x, y, w, h);
  c.fillStyle = '#d9cbb4'; blob(c, x + w / 2, y + 6, 2.5);
  c.strokeStyle = 'rgba(70,60,90,.6)'; c.lineWidth = 1.4;
  for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + 6, y + 18 + k * 9); c.bezierCurveTo(x + 10, y + 15 + k * 9, x + 14, y + 21 + k * 9, x + w - 6, y + 17 + k * 9); c.stroke(); }
  c.strokeStyle = '#e8433d'; c.lineWidth = 1.6; c.beginPath(); c.arc(x + w / 2, y + h - 11, 6, 0, PI * 2); c.stroke();
}
function drawGym(c, x, y, w, h) {
  c.fillStyle = '#2f7fd8'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#ffffff'; c.lineWidth = 2; roundRect(c, x + 4, y + 4, w - 8, h - 8, 6); c.stroke();
  txt(c, '어깨 돌리기', x + w / 2, y + 17, 15, '#ffffff');
  const wx = x + w / 2 + 14, wy = y + 64;
  c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.beginPath(); c.arc(wx, wy, 19, 0, PI * 2); c.stroke();
  c.lineWidth = 2; for (let k = 0; k < 4; k++) { const a = k * HP + PI / 4; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + Math.cos(a) * 19, wy + Math.sin(a) * 19); c.stroke(); }
  c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.beginPath(); c.arc(wx, wy, 27, -PI * .85, -PI * .25); c.stroke();
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(wx + 22, wy - 22); c.lineTo(wx + 15, wy - 13); c.lineTo(wx + 26, wy - 12); c.closePath(); c.fill();
  mochi(c, x + 22, y + 52, 10);
  c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 30, y + 58); c.lineTo(wx - 15, wy - 6); c.moveTo(x + 22, y + 61); c.lineTo(x + 22, y + 84); c.lineTo(x + 16, y + 98); c.moveTo(x + 22, y + 84); c.lineTo(x + 29, y + 98); c.stroke();
  txt(c, '좌우 10회', x + w / 2, y + h - 15, 13, '#ffe9a8');
}
function drawTowel(c, x, y, w, h) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = '#3f86e0'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(x + 5, y + 5, w - 10, h - 10); c.lineWidth = 1; c.strokeRect(x + 9, y + 9, w - 18, h - 18);
  const drop = (px, py, s, a, col2) => { c.save(); c.translate(px, py); c.rotate(a); c.fillStyle = col2; c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * .9, -s * .2, s * .7, s, 0, s); c.bezierCurveTo(-s * .8, s, -s * .7, s * .1, 0, -s); c.fill(); c.fillStyle = '#3f86e0'; blob(c, 0, s * .35, s * .3); c.restore(); };
  [[18, 20, .5], [80, 20, -.6], [18, 56, -.4], [82, 56, .7], [50, 14, 1.6], [50, 64, -1.5]].forEach(([px, py, a], i) => drop(x + px, y + py, 6, a, i % 2 ? '#ffd23f' : '#ffffff'));
  const cx = x + w / 2, cy = y + h / 2 + 4;
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(cx - 20, cy + 10); c.lineTo(cx - 6, cy - 12); c.lineTo(cx + 2, cy - 1); c.lineTo(cx + 8, cy - 8); c.lineTo(cx + 20, cy + 10); c.closePath(); c.fill();
  c.fillStyle = '#ffd23f'; blob(c, cx + 13, cy - 15, 4);
  c.restore();
}
function drawBaduk(c, x, y, s) {
  c.fillStyle = '#f3c25e'; c.fillRect(x, y, s, s);
  c.strokeStyle = '#6b4424'; c.lineWidth = 1; const m = 10, st = (s - 2 * m) / 8;
  for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(x + m, y + m + k * st); c.lineTo(x + s - m, y + m + k * st); c.stroke(); c.beginPath(); c.moveTo(x + m + k * st, y + m); c.lineTo(x + m + k * st, y + s - m); c.stroke(); }
  c.fillStyle = '#6b4424'; for (const a of [2, 4, 6]) for (const b of [2, 4, 6]) if ((a + b) % 4 === 0) blob(c, x + m + a * st, y + m + b * st, 1.8);
}
function drawDisc(c, x, y, s) {
  const cx = x + s / 2, cy = y + s / 2;
  c.fillStyle = '#4fbf8a'; c.fillRect(x, y, s, s);
  c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.beginPath(); c.arc(cx, cy, s / 2 - 7, 0, PI * 2); c.stroke();
  const foot = (fx, fy, a) => { c.save(); c.translate(fx, fy); c.rotate(a); c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(0, -4, 6, 10, 0, 0, PI * 2); c.fill(); c.beginPath(); c.ellipse(0, 11, 4.5, 5, 0, 0, PI * 2); c.fill(); c.restore(); };
  foot(cx - 13, cy, -.15); foot(cx + 13, cy, .15);
  c.strokeStyle = '#ffd23f'; c.lineWidth = 2.6; c.beginPath(); c.arc(cx, cy, 34, -PI * .8, -PI * .2); c.stroke();
  c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(cx + 30, cy - 24); c.lineTo(cx + 24, cy - 14); c.lineTo(cx + 34, cy - 14); c.closePath(); c.fill();
}
function drawLan(c, x, y, w, h, k) {
  c.fillStyle = '#fff6e2'; c.fillRect(x, y, w, h);
  c.fillStyle = '#e8433d'; c.fillRect(x, y, w, 3); c.fillRect(x, y + h - 3, w, 3);
  const cx = x + w / 2, cy = y + h / 2;
  if (k === 0) {
    for (let i = 0; i < 5; i++) { const a = -PI / 2 + (i - 2) * .5; c.fillStyle = i % 2 ? '#ffb3c8' : '#ff8fb0'; c.beginPath(); c.ellipse(cx + Math.cos(a) * 9, cy + 4 + Math.sin(a) * 9, 5, 11, a + HP, 0, PI * 2); c.fill(); }
    c.fillStyle = '#5fc45a'; c.beginPath(); c.ellipse(cx, cy + 14, 18, 4, 0, 0, PI * 2); c.fill();
  } else if (k === 1) {
    txt(c, '福', cx, cy + 1, 32, '#e8433d');
  } else if (k === 2) {
    c.fillStyle = '#ffc23d'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -HP + i * PI / 5, r = i % 2 ? 6 : 14; c[i ? 'lineTo' : 'moveTo'](cx - 10 + Math.cos(a) * r, cy + 1 + Math.sin(a) * r); } c.closePath(); c.fill();
    c.fillStyle = '#3f86e0'; blob(c, cx + 16, cy - 1, 9); c.fillStyle = '#fff6e2'; blob(c, cx + 20, cy - 4, 8);
  } else mochi(c, cx, cy + 1, 15);
}
function drawMap(c, x, y, w, h) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = '#fdf6e3'; c.fillRect(x, y, w, h);
  const px = x + 104, py = y + 34;
  for (let k = 5; k >= 1; k--) { c.fillStyle = ['#e9f3d2', '#d9ecc0', '#c7e3a8', '#b4d98f', '#a0cf78'][5 - k]; c.beginPath(); c.ellipse(px - k * 2, py + k * 3, k * 15, k * 10, -.3, 0, PI * 2); c.fill(); }
  c.strokeStyle = '#3f9be0'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y + 70); c.bezierCurveTo(x + 40, y + 60, x + 50, y + 92, x + 90, y + 100); c.stroke();
  c.strokeStyle = '#e8433d'; c.lineWidth = 2.4; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(x + 14, y + h - 8); c.bezierCurveTo(x + 50, y + 70, x + 60, y + 50, px, py); c.stroke(); c.setLineDash([]);
  c.fillStyle = '#5a4a3a'; c.beginPath(); c.moveTo(px - 8, py + 6); c.lineTo(px, py - 8); c.lineTo(px + 8, py + 6); c.closePath(); c.fill();
  c.strokeStyle = '#5a4a3a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(px, py - 8); c.lineTo(px, py - 22); c.stroke();
  c.fillStyle = '#e8433d'; c.beginPath(); c.moveTo(px, py - 22); c.lineTo(px + 11, py - 18); c.lineTo(px, py - 14); c.fill();
  txt(c, '정상', px + 24, py + 2, 12, '#5a4a3a');
  c.fillStyle = '#3f9be0'; blob(c, x + 50, y + 72, 5); txt(c, '약수터', x + 52, y + 86, 10, '#2f6fb8');
  for (const [tx, ty] of [[24, 30], [40, 22], [130, 78], [140, 62], [70, 40]]) { c.fillStyle = '#4ea85a'; c.beginPath(); c.moveTo(x + tx, y + ty - 8); c.lineTo(x + tx + 6, y + ty + 4); c.lineTo(x + tx - 6, y + ty + 4); c.closePath(); c.fill(); }
  c.fillStyle = '#3b3550'; c.beginPath(); c.moveTo(x + 136, y + 8); c.lineTo(x + 140, y + 20); c.lineTo(x + 132, y + 20); c.closePath(); c.fill(); txt(c, 'N', x + 136, y + 27, 9, '#3b3550');
  c.strokeStyle = 'rgba(120,100,80,.25)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.stroke();
  c.restore();
}
const atlas = () => tex('tr-atlas|' + STYLE.mode, 1024, 1024, c => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, AT, AT);
  drawDan(c, 0, 0, 512, 40);
  drawSign(c, 0, 44, 240, 58, '정상', '1.2km', 1, 26); drawSign(c, 244, 44, 240, 58, '약수터', '0.3km', -1, 24); drawSign(c, 0, 106, 240, 58, '등산로 입구', '0.8km', -1, 19);
  drawYaksu(c, 244, 106, 150, 60);
  drawPlaque(c, 0, 168, 176, 52); drawFire(c, 180, 168, 112, 48); drawWish(c, 296, 168, 80, 52); drawPatch(c, 380, 168, 60); drawTag(c, 444, 168, 24, 64);
  drawGym(c, 0, 236, 96, 124); drawTowel(c, 100, 236, 100, 76); drawBaduk(c, 204, 236, 96); drawDisc(c, 304, 236, 96);
  for (let k = 0; k < 4; k++) drawLan(c, k * 88, 364, 84, 50, k);
  drawMap(c, 352, 364, 150, 100);
}, { text: true });
const atlasMat = () => mat('#ffffff', { map: atlas() });
const signMat = () => mat('#ffffff', { map: atlas(), emissive: '#ffffff', ei: .12 });
const waterMat = () => mat('#ffffff', { map: waterTex(), emissive: '#bfe9ff', ei: .12, rim: .1 });
const streamMat = () => mat('#d6f3ff', { opacity: .62 });

// shared little bits
const tuft = (add, x, z, s = 1, c1 = LEAF, c2 = LEAF3) => {
  for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; add(G.cone(.022 * s, .11 * s, 5), k % 2 ? c1 : c2, x + Math.cos(a) * .018 * s, .05 * s, z + Math.sin(a) * .018 * s, Math.sin(a) * .35, 0, -Math.cos(a) * .35); }
};
const daisy = (add, x, y, z, s = 1, petal = WHITE) => {
  for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; add(G.sph(.012 * s, 6, 4), petal, x + Math.cos(a) * .014 * s, y, z + Math.sin(a) * .014 * s, 0, 0, 0, [1, .5, 1]); }
  add(G.sph(.009 * s, 6, 4), MUSTARD, x, y + .004 * s, z);
};
const stonePal = T => [col(T, 'stone'), col(T, 'rock'), shade(col(T, 'stone'), -.08), shade(col(T, 'rock'), .08), '#c3c0cf', '#dcd8d2'];

const B = {};

// ═════════════════════════════════════════════ TREES & STONES ═════════════════════════════════════════════
// 소나무 (1×1): a crooked Korean red pine — dark plated bark low down turning orange-red higher up, flat cloud-like
// needle pads on short branches, pine cones, a magpie (까치) on a branch; something can hide behind the trunk.
B.pine2 = (f, T) => {
  const bark = col(T, 'bark'), pine = col(T, 'pine'), tk = [bark, pine].join(',');
  const P = [[.02, 0, 0], [.08, .38, -.02], [-.02, .76, .01], [.07, 1.14, -.02], [.0, 1.48, 0]], R = [.092, .078, .066, .054, .042];
  const BC = [shade(bark, -.06), shade(bark, .02), PINERED, PINERED];
  const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  // needle pads: [x, y, z, rx, ry, rz] — flat clouds on short branches, the widest on top like an umbrella
  const PADS = [[-.25, .9, .08, .22, .085, .19], [.26, 1.08, -.06, .21, .08, .18], [-.12, 1.3, -.05, .23, .09, .2], [.1, 1.54, .03, .3, .11, .25], [.2, .7, .17, .13, .06, .11]];
  const FROM = [lerp(P[1], P[2], .85), lerp(P[2], P[3], .9), lerp(P[3], P[4], .45), P[4], lerp(P[1], P[2], .3)];
  f.add(mt('pine2-bark|' + tk, barkTex(), ({ add, addM, tube }) => {
    for (let i = 0; i < 4; i++) {
      const [L, m] = tubeM(P[i], P[i + 1]);
      addM(new THREE.CylinderGeometry(R[i + 1], R[i], L, 12, 1, true), m, BC[i], [2 * PI * R[i] / .5, L / .5]);
      if (i) add(G.sph(R[i] * .985, 12, 8), BC[i], ...P[i]);
    }
    add(G.sph(R[4], 10, 6), PINERED, ...P[4]);
    add(G.cyl(.085, .15, .13, 14, true), BC[0], .02, .065, 0, 0, 0, 0, 1, [2 * PI * .15 / .5, .13 / .5]);
    for (const a of [.6, 2.45, -.55]) { const d = [Math.cos(a), Math.sin(a)]; tube([.02 + d[0] * .07, .06, d[1] * .07], [.02 + d[0] * .26, .0, d[1] * .26], .04, BC[0], .4, false, .026); }
    PADS.forEach((q, i) => tube(FROM[i], [q[0] * .8, q[1] - q[4] * .3, q[2] * .8], .026, PINERED, .4, false, .018));
  }));
  const pineD = shade(pine, -.08), pineL = shade(pine, .07);
  f.add(mt('pine2-needles|' + pine, needleTex(), ({ add }) => {
    PADS.forEach(([x, y, z, rx, ry, rz], i) => {
      add(stoneGeo(300 + i, .24), pineD, x, y, z, 0, i * 1.3, 0, [rx, ry, rz]);
      add(stoneGeo(310 + i, .24), pine, x + .012, y + ry * .5, z + .018, 0, i * 2.1, 0, [rx * .8, ry * .8, rz * .78]);
      add(stoneGeo(320 + i, .2), pineL, x - rx * .25, y + ry * .85, z - rz * .1, 0, i, 0, [rx * .38, ry * .5, rz * .36]);
    });
  }));
  f.add(mc('pine2-deco', ({ add, addM }) => {
    for (const [x, y, z] of [[-.3, .82, .14], [-.16, .81, -.02], [.18, 1.42, .14]]) { add(G.sph(.026, 8, 6), '#a0643c', x, y, z, 0, 0, 0, [1, 1.45, 1]); add(G.cyl(.004, .004, .04, 4), '#7a4a2a', x, y + .05, z); }
    for (const [x, z, a] of [[.36, .3, .4], [.28, .4, 1.6], [-.34, .34, 2.2]]) add(G.sph(.03, 8, 6), '#a0643c', x, .026, z, 0, a, HP, [1, 1.45, 1]);
    tuft(add, -.3, .18); tuft(add, .32, -.2, .9); tuft(add, .12, .36, .8, LEAF2, LEAF);
    // a magpie perched on the right pad, side-on to the camera
    const MB = xf(.29, 1.205, -.06, 0, .78, 0), L = (g, c, x, y, z, rx, ry, rz, s) => addM(g, MB.clone().multiply(xf(x, y, z, rx, ry, rz, s)), c);
    L(G.sph(.048, 12, 8), '#2f2f45', 0, 0, 0, 0, 0, -.2, [1.35, .9, .9]);
    L(G.sph(.034, 10, 8), WHITE, .02, -.014, 0, 0, 0, -.2, [1.2, .8, 1.05]);
    for (const s of [-1, 1]) L(G.sph(.022, 8, 6), WHITE, -.016, .01, s * .038, 0, 0, -.2, [1.5, .6, .3]);
    L(G.sph(.032, 10, 8), '#2f2f45', .058, .036, 0);
    L(G.cone(.011, .036, 6), '#2f2f45', .1, .032, 0, 0, 0, -HP);
    for (const s of [-1, 1]) { L(G.sph(.008, 6, 4), WHITE, .072, .046, s * .024); L(G.sph(.004, 5, 4), INK, .076, .047, s * .03); }
    L(G.box(.15, .012, .036, .005), '#33467a', -.12, .03, 0, 0, 0, -.25);
    for (const s of [-1, 1]) L(G.cyl(.004, .004, .04, 4), '#2f2f45', .0, -.05, s * .015);
  }));
  f.spot('behind', null, -.06, 0, -.3, { maxH: .4, label: '소나무 뒤', scale: .7 });
};

// 돌탑 (1×1): a wishing cairn — a ring of round stones, three flat stones stacked smaller and smaller, then a cap stone
// (with a pebble on it) resting on three pebbles; lift the cap and there is a little hollow underneath.
B.rockpile = (f, T) => {
  const pal = stonePal(T), tk = pal.join(',');
  f.add(mt('rockpile|' + tk, speckleTex(), ({ add }) => {
    for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2 + .3, rr = .135 + (k % 3) * .012; add(stoneGeo(k + 1), pal[k % 6], Math.cos(a) * .25, rr * .55, Math.sin(a) * .23, 0, a, 0, [rr * 1.1, rr * .75, rr]); }
    add(stoneGeo(9), pal[2], 0, .15, 0, 0, .4, 0, [.22, .13, .2]);
    add(stoneGeo(10, .08), pal[0], 0, .3, 0, 0, .2, 0, [.27, .055, .24]);
    add(stoneGeo(11, .08), pal[3], .01, .385, -.01, 0, .9, 0, [.23, .05, .2]);
    add(stoneGeo(12, .08), pal[1], -.01, .47, .01, 0, 1.6, 0, [.19, .05, .17]);
    [-HP, PI / 6, 5 * PI / 6].forEach((a, i) => add(stoneGeo(20 + i), pal[4 + (i % 2)], Math.cos(a) * .11, .555, Math.sin(a) * .11, 0, a, 0, [.05, .04, .045]));
    for (const [x, z, s, k] of [[.4, .12, .045, 2], [-.4, .3, .05, 3], [.38, -.3, .04, 4], [-.24, -.42, .045, 5], [-.42, -.12, .035, 0]]) add(stoneGeo(30 + k), pal[k], x, s * .4, z, 0, k, 0, [s * 1.2, s * .7, s]);
    // a little three-stone stack of its own
    add(stoneGeo(41, .1), pal[3], .33, .03, .35, 0, .5, 0, [.07, .04, .06]);
    add(stoneGeo(42, .1), pal[0], .33, .085, .35, 0, 1.2, 0, [.05, .03, .045]);
    add(stoneGeo(43, .1), pal[4], .335, .125, .35, 0, 0, 0, [.032, .022, .03]);
  }));
  f.add(mc('rockpile-moss', ({ add }) => {
    for (const [x, y, z] of [[-.2, .2, .2], [.22, .19, -.2], [.05, .25, .24]]) add(G.sph(.05, 10, 6), LEAF2, x, y, z, 0, x * 9, 0, [1.3, .35, 1]);
    tuft(add, -.38, .38, .9); tuft(add, .42, -.08, .8); tuft(add, -.1, -.44, .8, LEAF2, LEAF);
    daisy(add, -.3, .02, .44, 1.2); daisy(add, .2, .02, .44, 1, '#ffd23f');
  }));
  const cap = new THREE.Group(); cap.position.set(0, .6, 0);
  cap.add(mt('rockpile-cap|' + tk, speckleTex(), ({ add }) => {
    add(stoneGeo(51, .1), pal[3], 0, .045, 0, 0, .3, 0, [.17, .058, .15]);
    add(stoneGeo(52), pal[0], .03, .11, .01, 0, 0, 0, [.048, .04, .044]);
  }));
  f.add(cap);
  const p = f.part('lift', cap, (t, b) => { cap.position.y = b.p.y + .3 * t; cap.position.x = b.p.x + .14 * t; cap.rotation.z = -.4 * t; }, { label: '돌탑 꼭대기 돌', sfx: 'lift' });
  f.spot('inside', null, 0, .52, 0, { part: p, maxH: .14, label: '돌탑 꼭대기 돌 밑', scale: .5 });
};

// ═════════════════════════════════════════════ ON THE PATH ═════════════════════════════════════════════
// 등산로 이정표 (1×1): a square timber post in a ring of stones, three arrow boards (정상 1.2km →, ← 약수터 0.3km and
// 등산로 입구 0.8km pointing at you), a 산불조심 plate, a little pyramid cap and hiking-club ribbons tied under it.
B.trailsign = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), pal = stonePal(T), tk = [wood, woodD, ...pal].join(',');
  const pz = -.05, PH = 1.5, BRD = '#6e4428', BL = .5, BH = .12, TIP = .08;
  const arrow = dir => {
    const s = new THREE.Shape(), a = -BL / 2, b = BL / 2;
    const pts = dir > 0 ? [[a, -BH / 2], [b - TIP, -BH / 2], [b, 0], [b - TIP, BH / 2], [a, BH / 2]] : [[b, -BH / 2], [b, BH / 2], [a + TIP, BH / 2], [a, 0], [a + TIP, -BH / 2]];
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s;
  };
  const MA = xf(.21, 1.2, .027), MB = xf(-.21, 1.0, .027), MC = xf(.077, .8, pz + .21, 0, HP, 0);
  f.add(mt('trailsign-wood|' + tk, grainTex(), ({ add, addM }) => {
    add(G.box(PH, .12, .12, .02), wood, 0, PH / 2, pz, 0, 0, HP, 1, .5);
    for (const [M, dir] of [[MA, 1], [MB, -1], [MC, -1]]) addM(G.ext(arrow(dir), .03, 0, 1).translate(0, 0, -.015), M, BRD, .5);
    add(G.box(.2, .085, .012, .004), WHITE, 0, .55, .016, 0, 0, 0, 1, .5);
  }));
  f.add(mt('trailsign-stones|' + tk, speckleTex(), ({ add }) => {
    for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2 + .2, s = .075 + (k % 3) * .012; add(stoneGeo(60 + k), pal[k % 6], Math.cos(a) * .15, s * .45, pz + Math.sin(a) * .14, 0, a, 0, [s * 1.15, s * .7, s]); }
  }));
  f.add(mc('trailsign|' + tk, ({ add }) => {
    add(G.box(.15, .02, .15, .006), woodD, 0, PH + .01, pz);
    add(G.cone(.11, .1, 4), woodD, 0, PH + .07, pz, 0, PI / 4, 0);
    add(G.box(.136, .022, .136, .006), ROPE, 0, 1.44, pz);
    // hiking-club ribbons (리본) tied round the post
    for (const [x, z, ry, rz, c] of [[.03, pz + .069, 0, .1, '#ff4b4b'], [-.028, pz + .069, 0, -.07, '#ffd23f'], [.069, pz + .02, HP, .08, '#3f9be0'], [.069, pz - .03, HP, -.1, '#7fd6c0']]) {
      add(G.pbox(.034, .13, .005), c, x, 1.365, z, 0, ry, rz);
    }
    tuft(add, .3, .3, .9); tuft(add, -.32, .2, .8); daisy(add, .24, .03, .4, 1.1, '#ffd23f');
  }));
  f.add(mg('trailsign-prints', signMat(), ({ addM }) => {
    addM(shapeRect(arrow(1), BL, BH, RG.signA), MA.clone().multiply(xf(0, 0, .015 + .006)));
    addM(shapeRect(arrow(-1), BL, BH, RG.signB), MB.clone().multiply(xf(0, 0, .015 + .006)));
    addM(shapeRect(arrow(-1), BL, BH, RG.signC), MC.clone().multiply(xf(0, 0, .015 + .006)));
    addM(quadGeo(.19, .076, RG.fire), xf(0, .55, .022 + .006));
  }));
  f.spot('behind', null, 0, 0, -.37, { maxH: .45, label: '이정표 뒤', scale: .7 });
};

// 나무 계단 (2×1): timber deck stairs climbing a bank — six plank treads on two stringers up to a little landing on
// posts, a rope rail on stakes along the open side, and the earth bank behind with stones and grass. The space under
// the landing is open.
B.woodstairs = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), pal = stonePal(T), tk = [wood, woodD, ...pal].join(',');
  // laid out climbing toward +u, then mirrored (x = -u) so the risers face the usual camera
  const u0 = -.95, n = 6, run = .24, rise = .1, us = u0 + .04, uL = us + n * run, LY = n * rise, hz = .26, RZ = .36, M = u => -u;
  const hAt = u => (u < us ? 0 : u >= uL ? LY : (Math.floor((u - us) / run) + 1) * rise);
  const top = u => (u < uL - .02 ? .04 + (u + .95) * (LY - .01) / (uL - .02 + .95) : LY + .03);
  const POSTS = [-.86, -.38, .1, .5, .92];
  f.add(mt('woodstairs-planks|' + tk, plankTex(), ({ add }) => {
    for (let k = 0; k < n; k++) {
      add(G.box(2 * hz, .035, run - .006, .008), k % 2 ? wood : shade(wood, -.03), M(us + k * run + run / 2), (k + 1) * rise - .0175, 0, 0, HP, 0, 1, .5);
      add(G.box(2 * hz - .01, rise - .035, .02, .004), shade(wood, -.16), M(us + k * run + .012), k * rise + (rise - .035) / 2, 0, 0, HP, 0, 1, .5);
    }
    add(G.box(.6, .04, .41, .008), wood, M(uL + .205), LY - .02, 0, 0, HP, 0, 1, .5);
  }));
  f.add(mt('woodstairs-wood|' + tk, grainTex(), ({ add }) => {
    const ang = Math.atan2(LY, uL - u0), SL = Math.hypot(LY, uL - u0);
    for (const sz of [-1, 1]) add(G.box(SL + .02, .1, .04, .01), woodD, M((u0 + uL) / 2), LY / 2 - .07, sz * .29, 0, 0, -ang, 1, .5);
    for (const sz of [-1, 1]) add(G.box(.44, .08, .04, .01), woodD, M(uL + .21), LY - .08, sz * .29, 0, 0, 0, 1, .5);
    add(G.box(.52, .08, .04, .01), woodD, M(.925), LY - .08, 0, 0, HP, 0, 1, .5);
    for (const u of [uL + .03, .92]) for (const sz of [-1, 1]) add(G.box(LY - .08, .05, .05, .01), woodD, M(u), (LY - .08) / 2, sz * .26, 0, 0, HP, 1, .5);
    for (const u of POSTS) { const H = hAt(u) + .4; add(G.box(H, .065, .065, .015), woodD, M(u), H / 2, RZ, 0, 0, HP, 1, .5); }
  }));
  f.add(mc('woodstairs-rope', ({ add, tube }) => {
    const ps = POSTS.map(u => [M(u), hAt(u) + .36, RZ + .036]);
    for (let i = 0; i < ps.length - 1; i++) { const a = ps[i], b = ps[i + 1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - .035, RZ + .028]; tube(a, m, .016, ROPE, 6); tube(m, b, .016, ROPE, 6); add(G.sph(.016, 6, 4), ROPE, ...m); }
    for (const p of ps) add(G.tor(.038, .011, PI * 2, 4, 10), shade(ROPE, -.15), p[0], p[1], RZ, 0, 0, 0);
    for (const p of ps) add(G.sph(.038, 8, 6), shade(woodD, -.05), p[0], p[1] + .04, RZ, 0, 0, 0, [1, .55, 1]);
    // grass and flowers on the bank top
    for (let i = 0; i < 9; i++) { const u = -.88 + i * .22, y = top(u); add(G.sph(.07, 10, 6), i % 2 ? LEAF : LEAF2, M(u), y, -.41 + (i % 3 - 1) * .03, 0, i, 0, [1.3, .45, 1.1]); for (let k = 0; k < 3; k++) add(G.cone(.02, .09, 5), k % 2 ? LEAF3 : LEAF, M(u) + (k - 1) * .04, y + .05, -.38, 0, 0, (k - 1) * .4); }
    for (const [u, c] of [[-.55, WHITE], [.05, '#ffd23f'], [.7, WHITE]]) daisy(add, M(u), top(u) + .06, -.36, 1.2, c);
  }));
  f.add(mt('woodstairs-bank|' + tk, speckleTex(), ({ add }) => {
    const sh = new THREE.Shape(); sh.moveTo(M(-.95), 0); sh.lineTo(M(-.95), .04); sh.lineTo(M(uL - .02), LY + .03); sh.lineTo(M(.95), LY + .03); sh.lineTo(M(.95), 0); sh.closePath();
    add(G.ext(sh, .18, 0, 1), EARTH, 0, 0, -.5);
    for (const [u, y, sc, k] of [[-.7, .05, .06, 0], [-.3, .12, .07, 1], [.12, .28, .06, 2], [.5, .22, .075, 3], [.8, .4, .06, 4], [.35, .5, .05, 5]]) add(stoneGeo(70 + k), pal[k], M(u), y, -.35, 0, k, 0, [sc * 1.2, sc * .8, sc * .6]);
  }));
  f.spot('under', null, M(uL + .2), 0, .02, { maxH: .42, label: '나무 계단 밑', scale: .8 });
  f.spot('on', null, M(uL + .22), LY, -.04, { maxH: .45, label: '계단 위 쉼터', scale: .7 });
};

// 약수터 (1×1): a mountain spring — a steel spout from a mossy boulder pours into a granite trough; a 약수터 sign on a
// wooden rack with a red and a blue dipper hanging from it; a yellow dipper lies upside down on a stone step in the
// trough (lift it), and a water bottle waits by the trough.
B.spring = (f, T) => {
  const pal = stonePal(T), wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [wood, woodD, ...pal].join(',');
  const bx0 = -.37, bx1 = .19, bz0 = -.12, bz1 = .2, BH = .24, t = .05, WY = .165;
  const bcx = (bx0 + bx1) / 2, bcz = (bz0 + bz1) / 2, BW = bx1 - bx0, BD = bz1 - bz0;
  const LX = bx1 - t - .0655, LZ = bcz, SX = -.24, SZ = -.05;
  f.add(mt('spring-stone|' + tk, speckleTex(), ({ add }) => {
    add(stoneGeo(81), pal[1], -.03, .22, -.31, 0, .3, 0, [.33, .3, .16]);
    add(stoneGeo(82), pal[3], .2, .1, -.36, 0, 1, 0, [.16, .14, .12]);
    add(G.box(BW, BH, t, .015), pal[0], bcx, BH / 2, bz1 - t / 2);
    add(G.box(BW, BH, t, .015), pal[0], bcx, BH / 2, bz0 + t / 2);
    for (const x of [bx0 + t / 2, bx1 - t / 2]) add(G.box(t, BH, BD - 2 * t + .01, .015), pal[0], x, BH / 2, bcz);
    add(G.box(.125, .2, .21, .02), pal[2], LX, .1, LZ);
  }));
  f.add(mg('spring-water', waterMat(), ({ addM }) => addM(planarUV(new THREE.PlaneGeometry(BW - 2 * t - .004, BD - 2 * t - .004).rotateX(-HP).translate(bcx, WY, bcz), .5), I4)));
  f.add(transparent(mg('spring-stream', streamMat(), ({ add }) => add(new THREE.CylinderGeometry(.014, .016, .41 - WY, 10), SX, (.41 + WY) / 2, SZ))));
  f.add(mt('spring-rack|' + tk, grainTex(), ({ add }) => {
    for (const x of [.29, .45]) add(G.box(.82, .04, .04, .008), woodD, x, .41, -.04, 0, 0, HP, 1, .5);
    add(G.box(.22, .03, .03, .006), woodD, .37, .52, -.005, 0, 0, 0, 1, .5);
    add(G.box(.22, .09, .025, .006), wood, .37, .73, -.0075, 0, 0, 0, 1, .5);
  }));
  f.add(mc('spring|' + tk, ({ add, tube }) => {
    tube([SX, .45, -.19], [SX, .45, -.065], .022, STEEL, 10); add(G.sph(.022, 10, 8), STEEL, SX, .45, -.065);
    tube([SX, .45, -.065], [SX, .41, SZ], .02, STEEL, 10); add(G.cyl(.026, .026, .02, 10), STEEL2, SX, .45, -.15, HP, 0, 0);
    add(G.tor(.034, .008, PI * 2, 4, 16), WHITE, SX, WY + .004, SZ, HP);
    for (const [dx, dz] of [[.05, .02], [-.04, .03], [.03, -.04]]) add(G.sph(.008, 6, 4), WHITE, SX + dx, WY + .03, SZ + dz);
    // moss and ferns on the boulder
    for (const [x, y, z, s] of [[-.2, .48, -.27, .07], [.05, .5, -.33, .06], [.22, .22, -.32, .05]]) add(G.sph(s, 10, 6), LEAF2, x, y, z, 0, x * 7, 0, [1.4, .4, 1]);
    tuft(add, -.42, -.2, 1.1); tuft(add, .4, -.38, .9, LEAF2, LEAF); tuft(add, -.44, .1, .8);
    // rack hooks and hanging dippers (red, blue), caps on the posts
    for (const x of [.29, .45]) add(G.sph(.026, 8, 6), woodD, x, .825, -.04, 0, 0, 0, [1, .6, 1]);
    for (const [x, c] of [[.315, '#ff5a4a'], [.435, '#3f8fe8']]) {
      add(G.tor(.012, .004, PI * 2, 3, 8), STEEL2, x, .5, .014, 0, HP, 0);
      tube([x, .49, .016], [x, .365, .032], .009, c, 6);
      add(G.sph(.055, 14, 10), c, x, .32, .032, 0, 0, 0, [1, 1, .55]);
      add(G.cyl(.043, .043, .004, 16), shade(c, -.2), x, .32, .032 + .033, HP, 0, 0);
    }
    // a 2 L water bottle by the trough
    add(G.cyl(.05, .05, .19, 16), '#cfeefc', -.43, .095, .33);
    add(G.cyl(.05, .03, .04, 16), '#cfeefc', -.43, .21, .33);
    add(G.cyl(.022, .022, .03, 10), '#3f7fe0', -.43, .245, .33);
    add(G.cyl(.051, .051, .06, 16), '#3f9be0', -.43, .11, .33);
  }));
  f.add(mg('spring-sign', signMat(), ({ add }) => add(quadGeo(.21, .084, RG.yaksu), .37, .73, .005 + .006)));
  const lv = new THREE.Group(); lv.position.set(LX, .2, LZ);
  lv.add(mc('spring-ladle', ({ add, tube }) => {
    const Y1 = '#ffd23f';
    add(G.dome(.072, 18, 6), Y1, 0, .002, 0, 0, 0, 0, [1, .9, 1]);
    add(G.tor(.072, .008, PI * 2, 4, 22), shade(Y1, -.1), 0, .005, 0, HP);
    tube([-.065, .02, 0], [-.4, .072, 0], .011, Y1, 8);
    add(G.sph(.015, 8, 6), shade(Y1, -.1), -.4, .072, 0);
  }));
  f.add(lv);
  const p = f.part('lift', lv, (t2, b) => { lv.position.y = b.p.y + .3 * t2; lv.position.x = b.p.x + .03 * t2; lv.rotation.z = -.5 * t2; }, { label: '약수 바가지', sfx: 'lift' });
  f.spot('inside', null, LX, .2, LZ, { part: p, maxH: .14, label: '약수 바가지 밑', scale: .5 });
};

// 정자 (2×2): a little square pavilion — a plank floor (maru) raised on beams and stone footings so you can see under it,
// red-brown pillars, green dancheong beams with a painted band, a 솔바람정 name board, a blue-grey tiled pyramid roof with
// white hip ridges and upturned corners; a baduk board, a cushion, and hiking shoes left on the step stone.
B.pavilion = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), tile = col(T, 'tile'), pil = col(T, 'pillar'), dan = col(T, 'dan'), pal = stonePal(T);
  const tk = [wood, woodD, tile, pil, dan, ...pal].join(',');
  const FY = .46, FH = .76, PX = .64, PT = 1.6, E = .95, RB = 1.69, RA = 2.32, RL = .73;
  f.add(mt('pavilion-floor|' + tk, plankTex(), ({ add }) => add(G.box(2 * FH, .06, 2 * FH, .015), wood, 0, FY - .03, 0, 0, 0, 0, 1, .5)));
  f.add(mt('pavilion-wood|' + tk, grainTex(), ({ add }) => {
    for (const s of [-1, 1]) { add(G.box(2 * FH - .04, .1, .08, .012), woodD, 0, .348, s * (FH - .05), 0, 0, 0, 1, .5); add(G.box(2 * FH - .04, .1, .08, .012), woodD, s * (FH - .05), .348, 0, 0, HP, 0, 1, .5); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.055, .06, PT - .155, 14), pil, sx * PX, .14 + (PT - .155) / 2, sz * PX, 0, 0, 0, 1, [(PT - .155) / .3, 2 * PI * .06 / .3, true]);
    // railing on the back and both sides (the front stays open)
    for (const [ry, ox, oz] of [[0, 0, -RL], [HP, -RL, 0], [HP, RL, 0]]) {
      const L = 2 * RL, at = (u, y) => [ox + (ry ? 0 : u), y, oz + (ry ? -u : 0)];
      add(G.box(L, .04, .05, .012), woodD, ...at(0, FY + .22), 0, ry, 0, 1, .5);
      add(G.box(L, .03, .04, .01), woodD, ...at(0, FY + .045), 0, ry, 0, 1, .5);
      for (let k = -3; k <= 3; k++) add(G.box(.16, .024, .024, .006), woodD, ...at(k * .19 + (k ? 0 : .0), FY + .135), 0, ry, HP, 1, .5);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.28, .055, .055, .012), woodD, sx * RL, FY + .13, sz * RL, 0, 0, HP, 1, .5);
    // beams on the pillar tops, brackets, the eave board
    for (const s of [-1, 1]) { add(G.box(2 * PX + .1, .1, .09, .012), dan, 0, PT - .05, s * PX, 0, 0, 0, 1, .5); add(G.box(2 * PX + .1, .1, .09, .012), dan, s * PX, PT - .05, 0, 0, HP, 0, 1, .5); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.16, .05, .16, .012), shade(pil, -.05), sx * PX, PT + .02, sz * PX, 0, 0, 0, 1, .5);
    add(G.box(2 * E, .06, 2 * E, .015), dan, 0, RB - .03, 0, 0, 0, 0, 1, .5);
    add(G.box(.46, .14, .025, .008), '#3b2f2a', 0, 1.42, PX + .045 + .0125, 0, 0, 0, 1, .5);
  }));
  f.add(mt('pavilion-roof|' + tk, tileTex(), ({ addM }) => { for (let k = 0; k < 4; k++) addM(roofFace(E, RB, RA, .46), xf(0, 0, 0, 0, k * HP, 0), tile, null); }));
  f.add(mt('pavilion-stone|' + tk, speckleTex(), ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.2, .14, .2, .04), pal[(sx + sz + 2) % 4], sx * PX, .07, sz * PX);
    add(G.box(.5, .13, .22, .05), pal[1], 0, .065, .86);
  }));
  f.add(mc('pavilion|' + tk, ({ add, tube }) => {
    const RIDGE = '#f4efe6';
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      tube([sx * (E - .03), RB + .025, sz * (E - .03)], [0, RA + .012, 0], .032, RIDGE, 8);
      tube([sx * (E - .03), RB + .025, sz * (E - .03)], [sx * .962, RB + .11, sz * .962], .03, RIDGE, 8);
      add(G.sph(.03, 8, 6), RIDGE, sx * (E - .03), RB + .025, sz * (E - .03));
    }
    add(G.cyl(.05, .06, .1, 12), '#4a4458', 0, RA + .05, 0);
    add(G.sph(.045, 10, 8), MUSTARD, 0, RA + .13, 0);
    for (const sx of [-1, 1]) add(G.cyl(.005, .005, .012, 4), STEEL2, sx * .16, 1.495, PX + .057);
    // on the floor: a baduk board with bowls and stones, a cushion
    add(G.box(.3, .07, .3, .012), '#f3c25e', .3, FY + .035, -.3);
    for (const [x, z] of [[-.08, -.06], [.03, .03], [.08, -.09]]) add(G.cyl(.014, .014, .008, 10), CHAR, .3 + x, FY + .07 + .011, -.3 + z);
    for (const [x, z] of [[-.04, .06], [.06, .0], [-.09, .09]]) add(G.cyl(.014, .014, .008, 10), WHITE, .3 + x, FY + .07 + .011, -.3 + z);
    add(G.cyl(.05, .045, .055, 14), '#8a5a34', .1, FY + .0275, -.04); add(G.cyl(.04, .04, .006, 14), CHAR, .1, FY + .055, -.04);
    add(G.cyl(.05, .045, .055, 14), '#8a5a34', .5, FY + .0275, -.04); add(G.cyl(.04, .04, .006, 14), WHITE, .5, FY + .055, -.04);
    add(G.box(.28, .05, .28, .025), '#3f8fd8', .28, FY + .025, .28, 0, .2, 0);
    add(G.box(.2, .006, .2, .002), '#7fb8ee', .28, FY + .053, .28, 0, .2, 0);
    // hiking shoes on the step stone
    for (const sx of [-1, 1]) { add(G.box(.075, .025, .16, .01), CHAR, sx * .07, .13 + .0125, .86, 0, sx * .1, 0); add(G.box(.07, .05, .13, .025), TOMATO, sx * .07, .13 + .045, .85, 0, sx * .1, 0); add(G.box(.03, .008, .06, .003), WHITE, sx * .07, .13 + .072, .87, 0, sx * .1, 0); }
    tuft(add, -.9, .9); tuft(add, .9, .85, .9, LEAF2, LEAF); tuft(add, -.88, -.9, .8);
  }));
  f.add(mg('pavilion-prints', atlasMat(), ({ add }) => {
    const o = PX + .045 + .006;
    add(quadGeo(1.3, .09, RG.dan), 0, PT - .05, o); add(quadGeo(1.3, .09, RG.dan), 0, PT - .05, -o, 0, PI, 0);
    add(quadGeo(1.3, .09, RG.dan), o, PT - .05, 0, 0, HP, 0); add(quadGeo(1.3, .09, RG.dan), -o, PT - .05, 0, 0, -HP, 0);
    add(quadGeo(.28, .28, RG.baduk).rotateX(-HP), .3, FY + .07 + .006, -.3);
  }));
  f.add(mg('pavilion-plaque', signMat(), ({ add }) => add(quadGeo(.42, .124, RG.plaque), 0, 1.42, PX + .045 + .025 + .006)));
  f.spot('on', null, -.36, FY, .26, { maxH: .45, label: '정자 마루 위', scale: .8 });
  f.spot('under', null, .3, 0, .5, { maxH: .26, label: '정자 마루 밑', scale: .7 });
};

// 통나무 벤치 (1×1): a half log on two stumps — bark round the outside, end grain rings at the ends, a smooth cut seat;
// moss on the bark and a red toadstool by one stump. Something can hide under the seat.
B.bench3 = (f, T) => {
  const bark = col(T, 'bark'), wood = col(T, 'wood'), tk = [bark, wood].join(',');
  const L = .86, R = .2, SY = .44, LX = .28;
  f.add(mt('bench3-bark|' + tk, barkTex(), ({ add }) => {
    add(new THREE.CylinderGeometry(R, R, L, 18, 1, true, PI, PI), bark, 0, SY, 0, 0, 0, HP, 1, [PI * R / .3, L / .3]);
    for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(.12, .135, .3, 14, 1, true), shade(bark, -.06), sx * LX, .15, 0, 0, sx, 0, 1, [2 * PI * .13 / .3, 1]);
  }));
  f.add(mt('bench3-seat|' + tk, grainTex(), ({ add }) => add(G.box(L - .01, .016, 2 * R + .01, .005), shade(wood, .04), 0, SY - .002, 0, 0, 0, 0, 1, .5)));
  f.add(mt('bench3-rings|' + tk, ringTex(), ({ add }) => { for (const sx of [-1, 1]) add(new THREE.CircleGeometry(R, 24, PI, PI), shade(wood, .02), sx * L / 2, SY, 0, 0, sx * HP, 0, 1, null); }));
  f.add(mc('bench3', ({ add }) => {
    for (const [x, y, z, s] of [[-.2, SY - .12, .15, .05], [.15, SY - .15, .12, .04], [-.3, .22, -.11, .04]]) add(G.sph(s, 10, 6), LEAF2, x, y, z, .5, 0, 0, [1.4, .7, .45]);
    add(G.cyl(.016, .02, .07, 8), CREAM, .41, .035, .3);
    add(G.dome(.048, 14, 5), '#ff4f4a', .41, .065, .3, 0, 0, 0, [1, .75, 1]);
    for (const [dx, dz] of [[.02, .02], [-.022, .01], [0, -.025]]) add(G.sph(.009, 6, 4), WHITE, .41 + dx, .088, .3 + dz);
    tuft(add, -.4, .3, .9); tuft(add, .4, -.32, .8, LEAF2, LEAF); daisy(add, -.25, .02, .38, 1.1, '#ffd23f');
  }));
  f.spot('under', null, 0, 0, .03, { maxH: .22, label: '통나무 벤치 밑', scale: .7 });
};

// 야외 운동기구 (1×1): the yellow outdoor-gym frame every Korean hill has — a red shoulder hand-wheel on one post (with a
// how-to plate), a T-bar on the other and a green twister disc to stand on, all bolted to a sky-blue rubber pad.
B.exerciser = (f, T) => {
  const gym = col(T, 'gym'), gym2 = col(T, 'gym2'), tk = [gym, gym2].join(',');
  const PA = [-.22, -.26], PB = [.24, -.26], WY = 1.0, WZ = -.1, WR = .2, DX = .24, DZ = .12;
  f.add(mt('exerciser-pad', rubberTex(), ({ add }) => add(G.box(.86, .05, .86, .02), '#5ea6d6', 0, .025, 0, 0, 0, 0, 1, .3)));
  f.add(mc('exerciser|' + tk, ({ add, tube }) => {
    for (const [x, z] of [PA, PB]) { add(G.cyl(.09, .09, .02, 16), STEEL2, x, .06, z); for (let k = 0; k < 4; k++) { const a = k * HP + PI / 4; add(G.cyl(.012, .012, .016, 6), STEEL, x + Math.cos(a) * .066, .078, z + Math.sin(a) * .066); } }
    tube([PA[0], .05, PA[1]], [PA[0], 1.2, PA[1]], .05, gym, 16); add(G.dome(.05, 14, 5), gym, PA[0], 1.2, PA[1]);
    tube([PB[0], .05, PB[1]], [PB[0], .98, PB[1]], .045, gym, 16); add(G.dome(.045, 14, 5), gym, PB[0], .98, PB[1]);
    // hand-wheel
    tube([PA[0], WY, PA[1] + .04], [PA[0], WY, WZ - .02], .022, STEEL2, 10);
    add(G.tor(WR, .026, PI * 2, 8, 30), gym2, PA[0], WY, WZ);
    add(G.cyl(.05, .05, .06, 16), gym2, PA[0], WY, WZ, HP, 0, 0);
    add(G.cyl(.03, .03, .066, 12), STEEL, PA[0], WY, WZ, HP, 0, 0);
    for (let k = 0; k < 4; k++) { const a = k * HP + PI / 4; tube([PA[0] + Math.cos(a) * .045, WY + Math.sin(a) * .045, WZ], [PA[0] + Math.cos(a) * (WR - .02), WY + Math.sin(a) * (WR - .02), WZ], .014, gym2, 8); }
    for (const a of [.3, .3 + PI]) { const x = PA[0] + Math.cos(a) * WR, y = WY + Math.sin(a) * WR; tube([x, y, WZ], [x, y, WZ + .08], .016, STEEL2, 8); add(G.cap(.022, .05, 2, 8), CHAR, x, y, WZ + .11, HP, 0, 0); }
    // T-bar and twister
    tube([PB[0] - .17, .95, PB[1]], [PB[0] + .17, .95, PB[1]], .025, gym, 10);
    for (const s of [-1, 1]) add(G.cap(.03, .07, 2, 8), CHAR, PB[0] + s * .17, .95, PB[1], 0, 0, HP);
    add(G.cyl(.07, .08, .1, 16), STEEL2, DX, .1, DZ);
    add(G.cyl(.2, .2, .045, 30), '#4fbf8a', DX, .17, DZ);
    add(G.tor(.2, .012, PI * 2, 5, 32), WHITE, DX, .17, DZ, HP);
    // how-to plate on post A
    add(G.box(.2, .26, .012, .004), WHITE, PA[0], .62, PA[1] + .05 + .006);
    for (const y of [.52, .72]) add(G.tor(.052, .008, PI * 2, 4, 16), STEEL2, PA[0], y, PA[1], HP);
    tuft(add, .42, .44, .8); tuft(add, -.44, .4, .9, LEAF2, LEAF);
  }));
  f.add(mg('exerciser-prints', signMat(), ({ add, addM }) => {
    add(quadGeo(.186, .24, RG.gym), PA[0], .62, PA[1] + .05 + .012 + .006);
    addM(discGeo(.188, RG.disc), xf(DX, .17 + .0225 + .006, DZ));
  }));
  f.spot('on', null, -.2, .05, .22, { maxH: .45, label: '운동기구 받침 위', scale: .75 });
};

// 나무 다리 (2×1): a little arched plank bridge on two curved stringers over a brook — log rails on stakes, stone
// abutments, banks of round stones, reeds and two cattails, orange fish in the water; a flat stone sits under the arch.
B.bridge = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), pal = stonePal(T), tk = [wood, woodD, ...pal].join(',');
  const XE = .92, YE = .13, YC = .42, ZR = .335;
  const yA = x => YE + (YC - YE) * (1 - (x / XE) ** 2), sl = x => -2 * (YC - YE) * x / XE ** 2;
  const PXS = [-.84, -.42, 0, .42, .84];
  f.add(mg('bridge-water', waterMat(), ({ addM }) => addM(planarUV(new THREE.PlaneGeometry(.92, .99).rotateX(-HP).translate(0, .014, 0), .5), I4)));
  f.add(mt('bridge-planks|' + tk, grainTex(), ({ add, tube }) => {
    for (let i = 0; i < 17; i++) { const x = -.88 + i * .11; add(G.box(.1, .035, .62, .008), i % 2 ? wood : shade(wood, -.035), x, yA(x), 0, 0, 0, Math.atan(sl(x)), 1, { s: .5, swap: true }); }
    const xsP = Array.from({ length: 13 }, (_, i) => -.9 + i * .15);
    for (let i = 0; i < 12; i++) {
      const a = xsP[i], b = xsP[i + 1], xm = (a + b) / 2, L = Math.hypot(b - a, yA(b) - yA(a));
      for (const sz of [-1, 1]) add(G.box(L + .01, .07, .04, 0), woodD, xm, yA(xm) - .0175 - .037, sz * .24, 0, 0, Math.atan2(yA(b) - yA(a), b - a), 1, .5);
    }
    for (const x of PXS) for (const sz of [-1, 1]) add(G.box(.36, .05, .05, .012), woodD, x, yA(x) + .1, sz * ZR, 0, 0, HP, 1, .5);
    for (const sz of [-1, 1]) for (let i = 0; i < PXS.length - 1; i++) { const a = PXS[i], b = PXS[i + 1]; tube([a, yA(a) + .27, sz * ZR], [b, yA(b) + .27, sz * ZR], .024, shade(wood, -.06), .3, true); }
  }));
  f.add(mt('bridge-stones|' + tk, speckleTex(), ({ add }) => {
    for (const sx of [-1, 1]) {
      add(G.box(.2, .1, .7, .03), pal[2], sx * .86, .05, 0);
      for (let k = 0; k < 8; k++) { const z = -.44 + k * .126, s = .065 + ((k * 7) % 3) * .012; add(stoneGeo(90 + k + (sx > 0 ? 10 : 0)), pal[(k + (sx > 0 ? 3 : 0)) % 6], sx * (.47 + ((k * 5) % 3) * .015), s * .4, z, 0, k, 0, [s * 1.1, s * .75, s]); }
    }
    add(stoneGeo(111), pal[4], -.2, .02, -.32, 0, 0, 0, [.06, .03, .05]);
    add(stoneGeo(112), pal[1], .26, .02, .34, 0, 1, 0, [.05, .028, .045]);
    add(stoneGeo(113, .06), pal[5], .2, .03, .05, 0, .4, 0, [.1, .025, .085]);
  }));
  f.add(mc('bridge-deco', ({ add, tube }) => {
    for (const x of PXS) for (const sz of [-1, 1]) add(G.sph(.03, 8, 6), shade(woodD, -.05), x, yA(x) + .285, sz * ZR, 0, 0, 0, [1, .6, 1]);
    for (const [x, z, a] of [[-.15, .36, .5], [.12, -.38, 2.6]]) {
      add(G.sph(.03, 10, 6), '#ff8a3c', x, .024, z, 0, a, 0, [1.5, .4, .8]);
      add(G.cone(.022, .03, 4), '#ff8a3c', x - Math.cos(a) * .055, .024, z + Math.sin(a) * .055, 0, a, HP, [1, 1, .4]);
    }
    for (const [x, z] of [[-.62, .4], [.64, -.42], [.6, .42]]) tuft(add, x, z, 1.1);
    for (const [x, z] of [[-.6, -.44], [-.66, -.36]]) { tube([x, 0, z], [x, .42, z], .006, LEAF2, 4); add(G.cap(.016, .07, 2, 6), '#8a5a34', x, .44, z); add(G.cone(.012, .14, 4), LEAF, x + .02, .12, z, 0, 0, -.25); }
  }));
  f.spot('under', null, .2, .055, .05, { maxH: .28, label: '나무 다리 밑', scale: .7 });
};

// 개울 조각 (1×1): a piece of brook running front to back across the tile (it lines up with the 나무 다리 stream) —
// clear water between round bank stones, two stepping stones, a fish and cattails; a flat stone on the right bank lifts
// off a damp hollow.
B.stream = (f, T) => {
  const pal = stonePal(T), tk = pal.join(',');
  const xc = z => -.06 + .07 * Math.sin(z * 4.2 + .5), hw = z => .19 + .03 * Math.sin(z * 6.5 + 1), FXZ = [.35, .25];
  const NZ = 12, zs = Array.from({ length: NZ + 1 }, (_, i) => -.5 + i / NZ);
  const sh = new THREE.Shape();
  zs.forEach((z, i) => (i ? sh.lineTo(xc(z) - hw(z), -z) : sh.moveTo(xc(z) - hw(z), -z)));
  [...zs].reverse().forEach(z => sh.lineTo(xc(z) + hw(z), -z)); sh.closePath();
  f.add(mg('stream-water', waterMat(), ({ addM }) => addM(planarUV(new THREE.ShapeGeometry(sh, 4).rotateX(-HP).translate(0, .013, 0), .5), I4)));
  f.add(mt('stream-stones|' + tk, speckleTex(), ({ add }) => {
    for (let i = 0; i < 9; i++) for (const sd of [-1, 1]) {
      const z = -.44 + i * .11 + (sd > 0 ? .05 : 0); if (sd > 0 && Math.abs(z - FXZ[1]) < .16) continue; if (z > .46) continue;
      const k = i * 2 + (sd > 0), sz = .042 + ((k * 7) % 4) * .009;
      add(stoneGeo(120 + k), pal[k % 6], xc(z) + sd * (hw(z) + sz * .55), sz * .35, z, 0, k, 0, [sz * 1.15, sz * .7, sz]);
    }
    add(stoneGeo(140, .08), pal[3], xc(-.16) - .05, .028, -.16, 0, 0, 0, [.075, .03, .065]);
    add(stoneGeo(141, .08), pal[4], xc(.08) + .06, .028, .08, 0, 2, 0, [.07, .03, .06]);
  }));
  f.add(mc('stream-deco', ({ add, tube }) => {
    add(G.cyl(.085, .085, .006, 20), '#8f7158', FXZ[0], .005, FXZ[1]);
    for (const [x, z, sc] of [[-.42, .3, 1], [.36, -.36, .9], [-.4, -.1, .8]]) tuft(add, x, z, sc);
    for (const [x, z] of [[-.42, -.4], [-.36, -.44]]) { tube([x, 0, z], [x, .26, z], .008, LEAF2, 5); add(G.cap(.018, .06, 2, 6), '#8a5a34', x, .29, z); add(G.cone(.014, .16, 4), LEAF, x + .025, .08, z, 0, 0, -.3); }
    add(G.sph(.026, 10, 6), '#ff8a3c', xc(-.32), .022, -.32, 0, .3, 0, [1.5, .4, .8]);
    add(G.cone(.019, .026, 4), '#ff8a3c', xc(-.32) - .052, .022, -.32 + .016, 0, .3, HP, [1, 1, .4]);
    daisy(add, .36, .02, -.08, 1.1); daisy(add, -.42, .02, .4, 1, '#ffd23f');
  }));
  const pv = new THREE.Group(); pv.position.set(FXZ[0], 0, FXZ[1]);
  pv.add(mt('stream-flat|' + tk, speckleTex(), ({ add }) => add(stoneGeo(150, .07), pal[0], 0, .03, 0, 0, .5, 0, [.14, .04, .12])));
  f.add(pv);
  const p = f.part('lift', pv, (t, b) => { pv.position.y = b.p.y + .26 * t; pv.position.x = b.p.x - .03 * t; pv.rotation.z = .55 * t; }, { label: '납작한 돌', sfx: 'lift' });
  f.spot('inside', null, FXZ[0], .009, FXZ[1], { part: p, maxH: .25, label: '개울가 돌 밑', scale: .65 });
};

// 등 줄 (2×1): paper lanterns on a sagging string between two log posts — tomato, mustard, sky, mint and orange, each with
// ribs, black caps, a printed label (lotus, 福, star and moon, mochi) and a paper wish tag; one post has a flat top board.
B.lanterns = (f, T) => {
  const bark = col(T, 'bark'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), pal = stonePal(T), tk = [bark, wood, woodD, ...pal].join(',');
  const PXL = .86, pz = -.06, PH = 1.55, TY = 1.48, SAG = .16, XS = .8;
  const yS = x => TY - SAG * (1 - (x / XS) ** 2);
  const LXS = [-.52, -.26, 0, .26, .52], LC = [TOMATO, MUSTARD, SKY, MINT, ORANGE], LR = .1, LSY = .92;
  const cyOf = x => yS(x) - .2;
  f.add(mt('lanterns-wood|' + tk, grainTex(), ({ add }) => {
    for (const sx of [-1, 1]) add(G.cyl(.05, .058, PH, 12, true), sx < 0 ? woodD : shade(woodD, .04), sx * PXL, PH / 2, pz, 0, sx, 0, 1, [PH / .3, 2 * PI * .058 / .3, true]);
    add(G.box(.2, .03, .2, .008), wood, PXL, PH + .015, pz, 0, 0, 0, 1, .5);
  }));
  f.add(mt('lanterns-stones|' + tk, speckleTex(), ({ add }) => {
    for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2 + sx, s = .055 + (k % 2) * .015; add(stoneGeo(160 + k + (sx > 0 ? 5 : 0)), pal[(k + 2 * sx + 6) % 6], sx * PXL + Math.cos(a) * .1, s * .4, pz + Math.sin(a) * .1, 0, a, 0, [s * 1.1, s * .7, s]); }
  }));
  f.add(mc('lanterns|' + tk, ({ add, tube }) => {
    add(G.dome(.06, 12, 5), shade(bark, -.1), -PXL, PH, pz, 0, 0, 0, [1, .7, 1]);
    for (const sx of [-1, 1]) add(G.tor(.06, .009, PI * 2, 4, 14), CHAR, sx * PXL, TY, pz, HP);
    const N = 14;
    for (let i = 0; i < N; i++) { const a = -XS + i * 2 * XS / N, b = a + 2 * XS / N; tube([a, yS(a), pz], [b, yS(b), pz], .006, CHAR, 4); }
    LXS.forEach((x, i) => {
      const c = LC[i], cy = cyOf(x), rib = shade(c, -.15);
      tube([x, yS(x), pz], [x, cy + LR * LSY + .02, pz], .004, CHAR, 4);
      add(G.sph(LR, 18, 12), c, x, cy, pz, 0, 0, 0, [1, LSY, 1]);
      for (const hu of [-.05, .05]) add(G.tor(LR * Math.sqrt(1 - (hu / LR) ** 2) + .001, .006, PI * 2, 4, 22), rib, x, cy + hu * LSY, pz, HP);
      for (const s of [-1, 1]) add(G.cyl(.036, .04, .028, 14), CHAR, x, cy + s * (LR * LSY + .006), pz);
      add(G.cone(.02, .07, 8), '#ffd23f', x, cy - LR * LSY - .055, pz, PI, 0, 0);
      tube([x, cy - LR * LSY - .09, pz], [x, cy - LR * LSY - .12, pz], .003, CHAR, 4);
      add(G.pbox(.045, .12, .004), '#fffdf6', x, cy - LR * LSY - .18, pz, 0, 0, (i % 2 ? .08 : -.08));
    });
    tuft(add, -.6, .3); tuft(add, .55, .32, .9, LEAF2, LEAF); daisy(add, 0, .02, .36, 1.2, '#ffd23f'); daisy(add, -.2, .02, .4, 1);
  }));
  f.add(mg('lanterns-prints', signMat(), ({ addM }) => {
    LXS.forEach((x, i) => {
      const cy = cyOf(x);
      addM(sphPatch(LR + .006, 1.3, .8, RG['lan' + (i % 4)]), xf(x, cy, pz, 0, 0, 0, [1, LSY, 1]));
      addM(quadGeo(.04, .107, RG.tag), xf(x, cy - LR * LSY - .18, pz + .002 + .006, 0, 0, (i % 2 ? .08 : -.08)));
    });
  }));
  f.spot('on', null, PXL, PH + .03, pz, { maxH: .3, label: '등 기둥 꼭대기', scale: .55 });
};

// ═════════════════════════════════════════════ CAMPING GEAR ═════════════════════════════════════════════
// 등산 가방 (1×1): a tomato-red hiking backpack standing up — charcoal base, navy drawstring collar, a front pocket with
// a white bungee cord and a club patch, hip-belt wings, mesh side pockets with a water bottle, an enamel mug on a
// carabiner, padded straps behind; the pillowy top lid with its buckle strap flips back to open the bag.
B.backpack2 = (f, T) => {
  const bag = col(T, 'bag'), tk = bag, bagD = shade(bag, -.1);
  const W = .38, D = .26, HB = .46, zc = .02, zf = zc + D / 2, zb = zc - D / 2, CT = .54, PF = zf + .055, CI = .055;
  f.add(mt('backpack2|' + tk, fabricTex(), ({ add }) => {
    add(G.box(W, HB, D, .08, 2), bag, 0, HB / 2, zc, 0, 0, 0, 1, .25);
    add(G.box(W + .014, .09, D + .014, .045, 2), CHAR, 0, .045, zc, 0, 0, 0, 1, .25);
    const ch = CT - .4, cy = .4 + ch / 2;
    add(G.box(W - 2 * CI, ch, .02, .008), NAVY, 0, cy, zf - CI, 0, 0, 0, 1, .25);
    add(G.box(W - 2 * CI, ch, .02, .008), NAVY, 0, cy, zb + CI, 0, 0, 0, 1, .25);
    for (const sx of [-1, 1]) add(G.box(.02, ch, D - 2 * CI, .008), NAVY, sx * (W / 2 - CI), cy, zc, 0, 0, 0, 1, .25);
    add(G.box(.28, .24, .08, .05, 2), bagD, 0, .2, zf + .015, 0, 0, 0, 1, .25);
    for (const sx of [-1, 1]) { add(G.box(.06, .17, .17, .03), NAVY, sx * (W / 2 + .015), .15, zc, 0, 0, 0, 1, .25); add(G.box(.07, .07, .14, .03), NAVY, sx * (W / 2 + .025), .09, zb + .06, 0, sx * .25, 0, 1, .25); }
    for (const sx of [-1, 1]) add(G.cap(.03, .28, 2, 8), CHAR, sx * .09, .26, zb - .02, .08, 0, 0);
  }));
  f.add(mc('backpack2-deco|' + tk, ({ add, tube }) => {
    add(G.pbox(W - .12, .006, D - .12), '#2b2840', 0, HB + .003, zc);
    add(G.tor(.2, .006, PI * 2, 3, 30), WHITE, 0, CT - .016, zc, HP, 0, 0, [.76, .45, 1]);
    // bungee cord zigzag across the pocket
    const zz = Array.from({ length: 5 }, (_, i) => [i % 2 ? .11 : -.11, .29 - i * .04]);
    for (let i = 0; i < zz.length - 1; i++) tube([zz[i][0], zz[i][1], PF + .007], [zz[i + 1][0], zz[i + 1][1], PF + .007], .0045, WHITE, 5);
    for (const [x, y] of zz) add(G.sph(.008, 6, 4), CHAR, x, y, PF + .005);
    // water bottle in the right pocket, mug on a carabiner on the left
    add(G.cyl(.04, .04, .22, 14), SKY, W / 2 + .025, .2, zc); add(G.cyl(.03, .03, .03, 12), MINT, W / 2 + .025, .325, zc);
    add(G.tor(.022, .005, PI * 2, 3, 10), STEEL2, -W / 2 - .035, .33, zc, 0, HP, 0);
    add(G.cyl(.034, .03, .055, 14), WHITE, -W / 2 - .062, .275, zc); add(G.tor(.034, .006, PI * 2, 3, 14), '#3f7fe0', -W / 2 - .062, .302, zc, HP);
    add(G.tor(.016, .005, PI, 3, 8), WHITE, -W / 2 - .1, .275, zc, 0, HP, -HP);
    add(G.tor(.04, .009, PI, 4, 10), CHAR, 0, .42, zb - .01, 0, 0, 0);
  }));
  const pv = new THREE.Group(); pv.position.set(0, CT, zb - .005);
  pv.add(mt('backpack2-lid|' + tk, fabricTex(), ({ add }) => {
    add(G.box(W + .02, .12, D + .03, .06, 3), bag, 0, .035, .15, 0, 0, 0, 1, .25);
    add(G.pbox(.05, .2, .012), NAVY, 0, -.04, .295 + .012);
  }));
  pv.add(mc('backpack2-buckle', ({ add }) => { add(G.box(.07, .04, .02, .006), CHAR, 0, -.13, .322); add(G.pbox(.04, .012, .004), STEEL2, 0, -.13, .334); }));
  pv.add(mg('backpack2-patch', atlasMat(), ({ add }) => add(quadGeo(.07, .07, RG.patch), -.11, .035, .295 + .006)));
  f.add(pv);
  const p = f.part('lid', pv, t => { pv.rotation.x = -1.95 * t; }, { label: '등산 가방 뚜껑', sfx: 'open', dur: .3 });
  f.spot('inside', null, 0, HB + .006, zc + .005, { part: p, maxH: .2, label: '등산 가방 안', scale: .6 });
};

// 작은 텐트 (1×1): a little A-frame pup tent — teal ripstop walls, a lighter front with a door hole, a mustard door flap
// that rolls up from the bottom, piping on the front edges, guy ropes to wooden pegs and a red pennant on top; a pillow
// and a sleeping bag at the back inside.
B.tentsmall = (f, T) => {
  const tent = col(T, 'tent'), tent2 = col(T, 'tent2'), tk = [tent, tent2].join(',');
  const FZ = .3, BZ = -.36, AY = .6, BW = .42, DW = .28, DH = .32, DR = .06;
  const tA = Math.atan2(BW, AY), SL = Math.hypot(BW, AY);
  const tri = (door) => {
    const s = new THREE.Shape();
    s.moveTo(-BW + .012, 0);
    if (door) { s.lineTo(-DW / 2, 0); s.lineTo(-DW / 2, DH - DR); s.quadraticCurveTo(-DW / 2, DH, -DW / 2 + DR, DH); s.lineTo(DW / 2 - DR, DH); s.quadraticCurveTo(DW / 2, DH, DW / 2, DH - DR); s.lineTo(DW / 2, 0); }
    s.lineTo(BW - .012, 0); s.lineTo(0, AY - .016); s.closePath(); return s;
  };
  f.add(mt('tentsmall|' + tk, fabricTex(), ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.018, SL + .03, FZ - BZ + .1, .006), sx < 0 ? tent : shade(tent, -.05), sx * BW / 2, AY / 2, (FZ + BZ) / 2, 0, 0, sx * tA, 1, .3);
    add(G.ext(tri(true), .016, 0, 6), shade(tent, .1), 0, 0, FZ - .016, 0, 0, 0, 1, .3);
    add(G.ext(tri(false), .016, 0, 1), shade(tent, .1), 0, 0, BZ, 0, 0, 0, 1, .3);
    add(G.box(.82, .012, FZ - BZ + .02, .004), '#e9dcc0', 0, .006, (FZ + BZ) / 2, 0, 0, 0, 1, .3);
    add(G.box(.2, .06, .12, .03), WHITE, -.13, .042, BZ + .12, 0, .1, 0, 1, .3);
    add(G.cap(.055, .26, 3, 10), MUSTARD, .1, .06, BZ + .16, 0, 0, HP, 1, .3);
  }));
  f.add(mc('tentsmall-deco|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) add(G.pbox(.03, SL + .02, .006), tent2, sx * BW / 2, AY / 2, FZ + .05 + .003, 0, 0, sx * tA);
    for (const z of [FZ + .05, BZ - .05]) add(G.sph(.026, 10, 8), tent2, 0, AY + .012, z);
    tube([0, AY, FZ + .05], [0, AY + .2, FZ + .05], .006, '#8a5a34', 5);
    add(G.pbox(.1, .055, .004), TOMATO, .05, AY + .17, FZ + .05, 0, 0, -.05);
    tube([0, AY, FZ + .05], [0, .02, .47], .004, CREAM, 4); add(G.cone(.012, .07, 5), '#c98a52', 0, .03, .47, PI, 0, 0);
    tube([0, AY, BZ - .05], [0, .02, -.48], .004, CREAM, 4); add(G.cone(.012, .07, 5), '#c98a52', 0, .03, -.48, PI, 0, 0);
    for (const sx of [-1, 1]) for (const z of [FZ + .03, BZ - .03]) add(G.cone(.01, .06, 5), '#c98a52', sx * (BW + .03), .025, z, PI, 0, 0);
    tuft(add, .42, .42, .8); tuft(add, -.44, .38, .9, LEAF2, LEAF);
  }));
  const dv = new THREE.Group(); dv.position.set(0, DH, FZ + .006);
  dv.add(mt('tentsmall-door|' + tk, fabricTex(), ({ add }) => add(G.box(DW + .03, DH, .01, .004), tent2, 0, -DH / 2, .005, 0, 0, 0, 1, .3)));
  dv.add(mc('tentsmall-zip', ({ add }) => { add(G.pbox(.008, DH - .05, .004), CHAR, 0, -DH / 2, .012); add(G.box(.018, .032, .008, .003), STEEL, .0, -.08, .016); }));
  const rl = new THREE.Group(); rl.position.set(0, .016, FZ + .046);
  rl.add(mt('tentsmall-roll|' + tk, fabricTex(), ({ add }) => add(G.cyl(.026, .026, DW + .03, 14), shade(tent2, -.06), 0, 0, 0, 0, 0, HP, 1, [1, 1])));
  rl.scale.set(1, .4, .4);
  f.add(dv); f.add(rl);
  const p = f.part('curtain', [dv, rl], (t, bd, br) => { dv.scale.y = 1 - .82 * t; rl.position.y = br.p.y + .82 * DH * t; const s = .4 + .75 * t; rl.scale.set(1, s, s); }, { label: '텐트 지퍼 문', sfx: 'swish', dur: .34 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: .07, y: -.1, z: .04, parent: dv };   // a padlock on the zip pull (사건 판)
  f.spot('inside', null, 0, .012, .12, { part: p, maxH: .26, label: '작은 텐트 안', scale: .7 });
};

// 성황당 소원 상자 (1×1): a dark wooden wish box on a stone plinth, iron corners, a red 소원 plaque, a straw rope (금줄)
// round it hung with five-colour cloth strips, a little gabled roof for a lid (it takes a padlock); a stick with
// fluttering cloth and a pile of offering pebbles behind.
B.shrinebox = (f, T) => {
  const tile = col(T, 'tile'), woodD = col(T, 'woodD'), pal = stonePal(T), tk = [tile, woodD, ...pal].join(',');
  const BOX = '#8f5534', IN = '#5e3a26', W = .42, H = .28, D = .3, y0 = .1, t = .03, zf = D / 2;
  const OBANG = ['#3f7fe0', '#e8433d', '#ffd23f', '#ffffff', '#3fae6a'];
  f.add(mt('shrinebox-stone|' + tk, speckleTex(), ({ add }) => {
    add(G.box(.52, .1, .42, .03), pal[2], 0, .05, 0);
    for (const [x, z, s, k] of [[-.36, -.32, .06, 0], [-.3, -.36, .045, 1], [-.34, -.3, .03, 2], [.36, -.4, .05, 3]]) add(stoneGeo(170 + k), pal[k + 1], x, s * .5 + (k === 2 ? .06 : 0), z, 0, k, 0, [s * 1.1, s * .7, s]);
  }));
  f.add(mt('shrinebox-wood|' + tk, plankTex(), ({ add }) => {
    add(G.box(W, H, t, .006), BOX, 0, y0 + H / 2, zf - t / 2, 0, 0, 0, 1, .4);
    add(G.box(W, H, t, .006), BOX, 0, y0 + H / 2, -zf + t / 2, 0, 0, 0, 1, .4);
    for (const sx of [-1, 1]) add(G.box(t, H, D - 2 * t + .004, .006), BOX, sx * (W / 2 - t / 2), y0 + H / 2, 0, 0, 0, 0, 1, .4);
    add(G.box(W - 2 * t + .004, t, D - 2 * t + .004, .006), IN, 0, y0 + t / 2, 0, 0, 0, 0, 1, .4);
  }));
  f.add(mc('shrinebox|' + tk, ({ add, tube }) => {
    const IRON = '#4a4458';
    for (const sx of [-1, 1]) { add(G.pbox(.04, H - .02, .006), IRON, sx * (W / 2 - .02), y0 + H / 2, zf + .003); add(G.pbox(.006, H - .02, .04), IRON, sx * (W / 2 + .003), y0 + H / 2, zf - .02); }
    add(G.box(.05, .03, .02, .006), IRON, 0, y0 + H - .035, zf + .01);
    // straw rope with five-colour strips
    const ry = y0 + H - .07, ox = W / 2 + .012, oz = zf + .012;
    for (const [a, b] of [[[-ox, ry, oz], [ox, ry, oz]], [[ox, ry, oz], [ox, ry, -oz]], [[ox, ry, -oz], [-ox, ry, -oz]], [[-ox, ry, -oz], [-ox, ry, oz]]]) tube(a, b, .012, '#e8c88a', 6);
    for (const [x, y, z] of [[-ox, ry, oz], [ox, ry, oz], [ox, ry, -oz], [-ox, ry, -oz]]) add(G.sph(.014, 6, 4), '#e8c88a', x, y, z);
    [-.17, -.12, .12, .17].forEach((x, i) => add(G.pbox(.03, .15, .004), OBANG[i], x, ry - .08, oz + .014, 0, 0, (i % 2 ? .07 : -.06)));
    [[-.08, 0], [.07, 4], [-.02, 2]].forEach(([z, k], i) => { add(G.pbox(.004, .14, .03), OBANG[k], ox + .014, ry - .075, z, (i % 2 ? .07 : -.07), 0, 0); add(G.pbox(.004, .14, .03), OBANG[(k + 1) % 5], -ox - .014, ry - .075, z + .03, (i % 2 ? -.06 : .06), 0, 0); });
    // the stick of fluttering cloth behind
    tube([.36, 0, -.33], [.36, .92, -.33], .014, '#8a5a34', 6);
    OBANG.forEach((c, i) => add(G.pbox(.11, .03, .004), c, .36 + .06, .9 - i * .045, -.33, 0, -.3 + (i % 2) * .15, -.25 + (i % 3) * .1));
    tuft(add, -.42, .4, .9); tuft(add, .42, .36, .8, LEAF2, LEAF); daisy(add, .3, .02, .44, 1.1, '#ffd23f');
  }));
  f.add(mg('shrinebox-plaque', atlasMat(), ({ add }) => add(quadGeo(.13, .085, RG.wish), 0, y0 + .1, zf + .006)));
  const pv = new THREE.Group(); pv.position.set(0, y0 + H, -zf);
  pv.add(mc('shrinebox-lid|' + tk, ({ add }) => {
    const LD = D + .04, LW = W + .05;
    add(G.box(LW, .035, LD, .008), woodD, 0, .0175, LD / 2 - .02);
    for (const s of [-1, 1]) add(G.box(LW + .02, .02, LD / 2 + .03, .006), tile, 0, .035 + .052, LD / 2 - .02 + s * (LD / 4 - .002), s * .55, 0, 0);
    add(G.cyl(.02, .02, LW + .04, 10), '#f4efe6', 0, .035 + .1, LD / 2 - .02, 0, 0, HP);
    add(G.box(.04, .045, .012, .004), '#4a4458', 0, -.005, LD - .02 + .006);
  }));
  f.add(pv);
  const p = f.part('lid', pv, t2 => { pv.rotation.x = -1.7 * t2; }, { label: '소원 상자 뚜껑', sfx: 'open', dur: .3 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: -.07, z: D + .06, parent: pv };
  f.spot('inside', null, 0, y0 + t + .002, 0, { part: p, maxH: .2, label: '소원 상자 안', scale: .6 });
};

// 돌담 (2×1): a low dry-stone wall — masonry face, big round stones bulging out of it, a row of cap stones with grass,
// a pumpkin vine with leaves, a yellow flower and a little pumpkin on top, wildflowers at its foot.
B.stonewall = (f, T) => {
  const pal = stonePal(T), st = col(T, 'stone'), tk = pal.join(',');
  const WL = 1.92, WH = .62, WT = .32, wz = -.02, fz = wz + WT / 2;
  f.add(mt('stonewall-mason|' + tk, masonTex(), ({ add }) => add(G.box(WL, WH, WT, .05), st, 0, WH / 2, wz, 0, 0, 0, 1, { w: .8 })));
  f.add(mt('stonewall-stones|' + tk, speckleTex(), ({ add }) => {
    for (const [x, y, s, k] of [[-.72, .16, .11, 0], [-.35, .38, .1, 1], [-.05, .14, .12, 2], [.3, .4, .09, 3], [.62, .18, .11, 4], [-.6, .44, .08, 5], [.82, .42, .08, 1]]) add(stoneGeo(180 + k + Math.round(x * 10)), pal[k], x, y, fz - .02, 0, k, 0, [s * 1.2, s * .85, s * .5]);
    for (let i = 0; i < 8; i++) { const x = -.84 + i * .24, s = .13 + (i % 2) * .015; add(stoneGeo(200 + i, .16), pal[(i + 2) % 6], x, WH + .03, wz + ((i % 3) - 1) * .02, 0, i, 0, [s, .085, .15]); }
  }));
  f.add(mc('stonewall-vine', ({ add, tube }) => {
    const VY = WH + .085;
    const pts = [[-.9, VY, wz + .05], [-.55, VY + .02, wz - .04], [-.2, VY, wz + .06], [.15, VY + .02, wz - .02], [.5, VY, wz + .05], [.75, VY + .01, wz]];
    for (let i = 0; i < pts.length - 1; i++) tube(pts[i], pts[i + 1], .01, LEAF2, 5);
    for (const [x, z, a, s] of [[-.72, wz + .06, .4, 1], [-.38, wz - .07, 2, .9], [-.02, wz + .08, 1.1, 1.05], [.32, wz - .06, 2.6, .95], [.62, wz + .09, .2, .9]]) {
      add(G.sph(.075 * s, 12, 6), x < 0 ? LEAF : '#5fbf55', x, VY + .035, z, .25, a, .15, [1, .2, .85]);
      add(G.sph(.05 * s, 10, 6), LEAF3, x + .015, VY + .045, z + .01, .25, a, .15, [1, .18, .7]);
    }
    for (const [x, y, z] of [[-.8, .5, fz + .01], [-.82, .38, fz + .015], [.12, .52, fz + .01], [.1, .42, fz + .012]]) add(G.sph(.035, 8, 6), LEAF, x, y, z, 0, 0, .5, [1.2, .8, .4]);
    // the pumpkin flower and a little pumpkin
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; add(G.sph(.026, 8, 6), '#ffd23f', .1 + Math.cos(a) * .028, VY + .07, wz + .05 + Math.sin(a) * .028, 0, -a, 0, [1.3, .45, .8]); }
    add(G.sph(.016, 8, 6), ORANGE, .1, VY + .08, wz + .05);
    add(G.sph(.062, 14, 10), '#ff9a3c', .62, VY + .05, wz - .03, 0, 0, 0, [.85, .8, .9]);
    for (const s of [-1, 1]) add(G.sph(.054, 12, 8), '#ffab4c', .62 + s * .042, VY + .045, wz - .03, 0, 0, 0, [.7, .78, .85]);
    add(G.cyl(.012, .016, .05, 6), '#6b8a3a', .62, VY + .11, wz - .03, .3, 0, .2);
    for (const [x, z] of [[-.86, -.36], [.02, -.4], [.88, -.38]]) tuft(add, x, z, 1);
    for (const [x, z, c] of [[-.7, .3, WHITE], [-.6, .36, '#ffd23f'], [.4, .3, WHITE], [.5, .38, BLUSH]]) daisy(add, x, .05, z, 1.2, c);
    for (const [x, z] of [[-.65, .33], [.45, .34]]) tuft(add, x, z, 1.1);
  }));
  f.spot('behind', null, -.45, 0, -.36, { maxH: .45, label: '돌담 뒤', scale: .72 });
};

export const TRAIL_BUILDERS = B;

export const TRAIL_INFO = {
  pine2: { w: 1, d: 1, name: '소나무', price: 220, region: 'trail' },
  rockpile: { w: 1, d: 1, name: '돌탑', price: 150, region: 'trail' },
  trailsign: { w: 1, d: 1, name: '등산로 이정표', price: 180, region: 'trail' },
  woodstairs: { w: 2, d: 1, name: '나무 계단', price: 320, region: 'trail' },
  spring: { w: 1, d: 1, name: '약수터', price: 380, region: 'trail' },
  pavilion: { w: 2, d: 2, name: '정자', price: 600, region: 'trail' },
  bench3: { w: 1, d: 1, name: '통나무 벤치', price: 140, region: 'trail' },
  exerciser: { w: 1, d: 1, name: '야외 운동기구', price: 260, region: 'trail' },
  bridge: { w: 2, d: 1, name: '나무 다리', price: 360, region: 'trail' },
  stream: { w: 1, d: 1, name: '개울', price: 160, region: 'trail' },
  lanterns: { w: 2, d: 1, name: '등 줄', price: 240, region: 'trail' },
  backpack2: { w: 1, d: 1, name: '등산 가방', price: 170, region: 'trail' },
  tentsmall: { w: 1, d: 1, name: '작은 텐트', price: 280, region: 'trail' },
  shrinebox: { w: 1, d: 1, name: '소원 상자', price: 300, region: 'trail' },
  stonewall: { w: 2, d: 1, name: '돌담', price: 200, region: 'trail' },
};

// Suggested outdoor theme (stages.js THEMES shape, a superset of the CAMP keys): a warm dirt path under bright afternoon
// light, plus the boundary keys outdoor.js reads (rock for 'cliff', hedge, fence, flower, grass) and the keys these props
// read (bark, pine, stone, rock, tile, pillar, dan, tent, tent2, bag, gym, gym2).
export const TRAIL_THEMES = {
  trail: { name: '동네 뒷산 산길', friend: null, bg: ['#e8f5ff', '#e4f2d6'], base: '#8f7259',
    floorKind: 'dirt', floor: '#b39478', floor2: '#9e7f64', dirt: '#b39478', grass: '#9ad66f',
    wallKind: 'plain', wall: '#f3ead8', wall2: '#cdbfa8', wainscot: '#e6dac4', wallEdge: '#fbf6ec', trim: '#ffffff',
    rock: '#aaa6b9', stone: '#d3d0d6', hedge: '#4fa85a', fence: '#f0d9b0', flower: '#ffd23f', leaf: '#5fc45a', soil: '#7a5536',
    wood: '#f3c47e', woodD: '#b5773f', body: '#fff7ea', accent: '#7fd6c0', accent2: '#8fd3f4', accent3: '#ffc23d', door: '#bfe6d2',
    knob: '#ffd84a', sheet: '#ffffff', pillow: '#fff3d6', fabric: '#fff0d8', fabric2: '#ffe3bf', curtain: '#fff3d6', rug: '#fff3df',
    rug2: '#ffd9a8', pot: '#e88a5c', top: '#fffaf0',
    bark: '#a7643f', pine: '#3f9d5f', tile: '#5f6f8f', pillar: '#b8553a', dan: '#3f9b84', tent: '#3fb6a0', tent2: '#ffc93c',
    bag: '#ff6b4a', gym: '#ffc23d', gym2: '#ff5a4a',
    light: { ambColor: '#eef2ff', amb: 1.5, sunColor: '#ffe9c4', sun: 2.4 } },
};

// ═════════════════════════════════════════════ ITEMS ═════════════════════════════════════════════
// Same shape as items.js ITEMS: { name, h, flat?, build() } → Group, origin bottom centre.
//   Object.assign(ITEMS, TRAIL_ITEMS)   (and push the keys into TARGET_POOL / a theme pool to make them stage targets)
export const TRAIL_ITEMS = {
  // 도토리: a glossy acorn with a scaly cap, a stalk and an oak leaf
  acorn: { name: '도토리', h: .15, build() {
    const g = grp();
    g.add(mc('it-acorn', ({ add }) => {
      add(G.sph(.052, 18, 12), '#cf8a45', 0, .062, 0, 0, 0, 0, [1, 1.18, 1]);
      add(G.sph(.012, 8, 6), '#9a5f2c', 0, .006, 0);
      add(G.sph(.014, 8, 6), '#f3c48a', -.022, .07, .042, 0, 0, 0, [1, 1.6, .5]);
      add(G.dome(.058, 18, 6), '#8a5a34', 0, .086, 0, 0, 0, 0, [1, .62, 1]);
      add(G.tor(.057, .006, PI * 2, 4, 22), '#6f4626', 0, .088, 0, HP);
      for (const [rr, y] of [[.05, .103], [.036, .114]]) add(G.tor(rr, .0035, PI * 2, 3, 20), '#6f4626', 0, y, 0, HP);
      add(G.cyl(.006, .008, .032, 6), '#6b4a2a', .004, .135, 0, 0, 0, -.2);
      add(G.sph(.04, 10, 6), LEAF, .05, .118, -.01, 0, .4, .5, [1.5, .22, .7]);
    }));
    return g;
  } },
  // 등산 김밥 도시락: a mint lunchbox of kimbap slices (rice, egg, carrot, spinach, ham, danmuji) with chopsticks across
  gimbap2: { name: '등산 김밥 도시락', h: .09, flat: true, build() {
    const g = grp(), BX = '#7fd6c0', NORI = '#2f3a2c', RICE = '#fbf8ef';
    g.add(mc('it-gimbap2', ({ add }) => {
      const W = .22, D = .15, H = .055, t = .008;
      add(G.box(W, t, D, .003), BX, 0, t / 2, 0);
      for (const s of [-1, 1]) { add(G.box(W, H, t, .003), BX, 0, H / 2, s * (D / 2 - t / 2)); add(G.box(t, H, D - 2 * t, .003), BX, s * (W / 2 - t / 2), H / 2, 0); }
      for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) {
        const x = -.064 + i * .064, z = -.032 + r * .064, y = t + .015;
        add(G.cyl(.029, .029, .03, 18), NORI, x, y, z);
        add(G.cyl(.024, .024, .014, 16), RICE, x, y + .014, z);
        for (const [u, v, w, d, c] of [[0, .008, .016, .008, '#ffd84a'], [-.01, -.004, .008, .012, '#ff9a3c'], [.01, -.003, .008, .012, '#4ea85a'], [0, -.012, .014, .006, '#ff9fb5']]) add(G.box(w, .008, d, .002), c, x + u, y + .024, z + v);
      }
      for (const dz of [-.008, .008]) add(G.box(.26, .008, .008, .002), '#e6c48e', .01, H + .006, dz, 0, .12, 0);
    }));
    return g;
  } },
  // 등산 손수건: a blue paisley bandana folded in half corner to corner, the top flap a triangle, a little mountain print
  towel: { name: '등산 손수건', h: .04, flat: true, build() {
    const g = grp(), BL = '#3f86e0', S = .2, rc = subCell(RG.towel, .12, .88, 0, 1);
    const tri = new THREE.Shape(); tri.moveTo(-S / 2, -S / 2); tri.lineTo(S / 2, -S / 2); tri.lineTo(S / 2, S / 2); tri.closePath();
    g.add(mc('it-towel', ({ add, addM }) => {
      add(G.box(S, .012, S, .004), BL, 0, .006, 0);
      addM(G.ext(tri, .01, .003, 1).rotateX(-HP), xf(0, .014, 0, 0, 0, 0), shade(BL, -.05));
    }));
    g.add(mg('it-towel-print', atlasMat(), ({ addM }) => {
      addM(quadGeo(S - .01, S - .01, rc).rotateX(-HP), xf(0, .012 + .006, 0));
      addM(shapeRect(tri, S, S, rc).rotateX(-HP), xf(0, .014 + .013 + .006, 0));
    }));
    return g;
  } },
  // 호루라기: an orange safety whistle lying on its side, a ring and a green lanyard loop
  whistle: { name: '호루라기', h: .065, flat: true, build() {
    const g = grp(), OR = '#ff7a2f';
    g.add(mc('it-whistle', ({ add }) => {
      add(G.cyl(.032, .032, .05, 20), OR, .02, .033, 0, HP, 0, 0);
      add(G.box(.09, .032, .05, .012), OR, -.04, .036, 0);
      add(G.box(.03, .006, .036, .002), CHAR, .005, .066, 0);
      add(G.box(.012, .02, .036, .003), shade(OR, -.15), -.084, .036, 0);
      add(G.tor(.018, .005, PI * 2, 4, 12), STEEL, .06, .03, 0, HP, 0, 0);
      add(G.tor(.07, .008, PI * 2, 4, 26), '#3fae6a', .14, .008, 0, HP, 0, 0, [1, .55, 1]);
    }));
    return g;
  } },
  // 등산 지도: a trail map opened on its fold, contour lines, a red dashed trail up to the summit flag
  map: { name: '등산 지도', h: .03, flat: true, build() {
    const g = grp(), PW = .12, PD = .16, a = .1;
    g.add(mc('it-map', ({ add }) => {
      for (const s of [-1, 1]) add(G.pbox(PW, .004, PD), '#f6eedb', s * PW / 2 * Math.cos(a), .004 + Math.sin(a) * PW / 2, 0, 0, 0, -s * a);
    }));
    g.add(mg('it-map-print', atlasMat(), ({ addM }) => {
      for (const s of [-1, 1]) addM(quadGeo(PW - .006, PD - .006, subCell(RG.map, s < 0 ? 0 : .5, s < 0 ? .5 : 1)).rotateX(-HP), xf(s * PW / 2 * Math.cos(a), .004 + Math.sin(a) * PW / 2, 0, 0, 0, -s * a).multiply(xf(0, .002 + .006, 0)));
    }));
    return g;
  } },
};

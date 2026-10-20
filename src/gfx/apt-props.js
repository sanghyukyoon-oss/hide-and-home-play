// Everyday-apartment props (우리 아파트): a Korean apartment living room with Japanese and American homes mixed in —
// kotatsu, kimchi fridge, a magnet-covered side-by-side fridge, a drying rack, zabuton, a robot vacuum, a delivery box,
// a low TV stand, a floor lamp, a monstera, a cream sofa, a snack cart, a little dining set, a record cabinet and a laundry
// basket; on the walls a balcony sliding window, a cat clock and a two-tier shelf. Same contract as map-props.js:
//   builder(f, T, opts) fills a Furn. Origin = footprint centre on the floor, the piece faces +z, back toward -z, 1 tile = 1.
//   Wall pieces (wall: true, span 1|2) hang on a wall's inner face: origin at the face, floor height, +z into the room.
//   parts open / lift / slide / flip; spots: inside (needs its part open) | under/behind (visible but tucked) | on (plain sight).
//   Lockable parts carry p.lockable = true and p.lockKind ('pad' | 'code'), with f.lockAt where the lock hardware goes.
// Toy-set rules (as story-props.js): chunky silhouettes, flat matte colours, few draw calls. Static decor is merged into
// ONE vertex-coloured mesh per piece (mc); prints share one label atlas (mg); every moving part is its own mesh.
// Decals / panels / stickers always sit >= .004 in front of the face they are on (no coplanar faces of two colours).
//   import { APT_BUILDERS, APT_INFO, APT_THEMES, APT_ITEMS } from './gfx/apt-props.js';
//   registerFurniture(APT_BUILDERS, APT_INFO); Object.assign(ITEMS, APT_ITEMS);
//   for (const k in APT_THEMES) THEMES[k] = { ...THEMES.my, ...APT_THEMES[k] };
// Warm afternoon palette: cream, honey wood, sage / mint, sky, tomato, mustard (never all-pink).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mat, mesh, geo, canvasTex, texCache, roundRect, shade, heartShape, starShape, STYLE } from './kit.js';
import { tr } from '../i18n.js';

const PI = Math.PI, HP = PI / 2, DS = THREE.DoubleSide;

// ── palette ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Theme keys first (pieces follow the room they are bought into). Extra keys only the apartment themes set:
// sofa (cream sofa), quilt (kotatsu check), kimchi (kimchi fridge), cloth (dining gingham), throw (sofa throw).
const K = { wood: '#eebf86', woodD: '#c98f58', body: '#fff7ea', accent: '#a9d8b8', accent2: '#8fd3f4', accent3: '#ffc23d', fabric: '#fff0d8',
  fabric2: '#ffe3bf', knob: '#ffd84a', top: '#fffaf0', door: '#bfe6d2', curtain: '#fff3d6', pot: '#f3a272',
  sofa: '#fff0d8', quilt: '#ff6b57', kimchi: '#9b3b4b', cloth: '#8fcf9a', throw: '#7fa8e8' };
const col = (T, k) => (T && T[k]) || K[k];
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', SKY = '#8fd3f4', SKY2 = '#cdeefc', HONEY = '#ffcf5c', MUSTARD = '#ffc23d',
  TOMATO = '#ff6b57', CORAL = '#ff9f8a', MINT = '#7fd6c0', BLUSH = '#ff9fb5', GOLD = '#ffc93c', LEAF = '#6cc46a', LEAF2 = '#4ea85a',
  LEAF3 = '#8fd47a', ORANGE = '#ffab4c', STEEL = '#c9cfe0', STEEL2 = '#a9b2c8', DARK = '#5b5672', CHAR = '#3b3550', KRAFT = '#e8bb82',
  KRAFT2 = '#cf9a5e', TAPE = '#f6e2b0', SOIL = '#8a5a3c', LILAC = '#b9a6ff', BROWN = '#c98a52';

// ── geometry helpers (same as story-props.js / map-props.js) ────────────────────────────────────────────────────
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
const Y = new THREE.Vector3(0, 1, 0);
const xf = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(s[0], s[1], s[2]));
const tubeM = (a, b) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length(); return [L, new THREE.Matrix4().compose(A.clone().add(Bv).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(Y, d.normalize()), new THREE.Vector3(1, 1, 1))]; };
const tint = hex => (STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(hex) : hex);

const VM = {};
function vmat() {
  const k = STYLE.mode;
  return VM[k] || (VM[k] = STYLE.mode !== 'std'
    ? new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: STYLE.grad })
    : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .82 }));
}
// Many pieces, many colours, ONE mesh (vertex colours). Cached by key: put every theme colour the piece uses in the key.
//   fn({ add(geometry, color, x, y, z, rx, ry, rz, s), addM(geometry, matrix, color), tube(a, b, r, color, seg, r2) })
function mc(key, fn) {
  const g = geo('amc|' + STYLE.mode + '|' + key, () => {
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
// One mesh from many pieces sharing one material (labels, prints, fabric). fn gets { add, addM }; keeps uvs.
function mg(key, m, fn, post = null) {
  const g = geo('amg|' + key, () => {
    const list = [];
    const addM = (src, mm) => {
      const c = src.index ? src.toNonIndexed() : src.clone();
      for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') c.deleteAttribute(k);
      c.applyMatrix4(mm); list.push(c);
    };
    const add = (src, x, y, z, rx, ry, rz, s) => addM(src, xf(x, y, z, rx, ry, rz, s));
    fn({ add, addM });
    const out = mergeGeometries(list, false); out.name = key;
    if (post) post(out);
    return out;
  });
  return mesh(g, m);
}
// Box-mapped uvs in world units (a print is the same size on every face of a merged cloth).
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
function rrShape(x, y, w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// Soft cat ear (base on y = 0, tip up), for extrusion.
function earShape(w, h, r = .025) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(r * .7, h - r); s.quadraticCurveTo(0, h + r * .3, -r * .7, h - r); s.lineTo(-w / 2, 0);
  return s;
}
// Tiny dot-eye face on a +z-facing surface (the "objects are characters" touch).
function face(add, x, y, z, s = 1, { blush = BLUSH, smile = true } = {}) {
  for (const sx of [-1, 1]) {
    add(G.sph(.021 * s, 8, 6), INK, x + sx * .066 * s, y, z, 0, 0, 0, [1, 1.18, .45]);
    add(G.sph(.0068 * s, 5, 4), WHITE, x + sx * .066 * s - .006 * s, y + .009 * s, z + .009 * s);
    if (blush) add(G.sph(.026 * s, 8, 6), blush, x + sx * .118 * s, y - .034 * s, z - .002, 0, 0, 0, [1, .6, .3]);
  }
  if (smile) add(G.tor(.021 * s, .0058 * s, PI, 3, 8), INK, x, y - .018 * s, z + .002, 0, 0, PI);
}
// A five-petal flower decal on a +z face: pass z = face + .006 (petals are squashed spheres, the centre a dot).
function flower(add, x, y, z, s = 1, petal = WHITE, mid = MUSTARD) {
  for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2 + HP; add(G.sph(.016 * s, 8, 6), petal, x + Math.cos(a) * .017 * s, y + Math.sin(a) * .017 * s, z, 0, 0, 0, [1, 1, .3]); }
  add(G.sph(.011 * s, 8, 6), mid, x, y, z + .002, 0, 0, 0, [1, 1, .4]);
}
// A slanted cloth panel: top edge (width wT) at y = 0, bottom edge (width wB) at y = -H pushed out by s along +z; thickness t.
function trapGeo(wT, wB, H, s, t) {
  const g = new THREE.BoxGeometry(1, 1, t), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const top = p.getY(i) > 0; p.setXYZ(i, p.getX(i) * (top ? wT : wB), top ? 0 : -H, p.getZ(i) + (top ? 0 : s)); }
  g.computeVertexNormals();
  return g;
}
// A T-shirt silhouette in the xy plane, collar at y = 0, hem at y = -.46.
function shirtShape() {
  const s = new THREE.Shape(), P = [[-.06, 0], [-.135, -.014], [-.2, -.09], [-.165, -.152], [-.13, -.122], [-.13, -.46], [.13, -.46], [.13, -.122], [.165, -.152], [.2, -.09], [.135, -.014], [.06, 0]];
  s.moveTo(...P[0]); for (const p of P.slice(1)) s.lineTo(...p);
  s.quadraticCurveTo(0, -.065, -.06, 0);
  return s;
}
// A monstera leaf: heart-shaped with slits cut in from the edge; stem joint at the origin, tip at (0, 1).
function monsteraShape() {
  const R = [[.06, .05], [.22, -.05], [.4, .04], [.5, .22], [.52, .42], [.46, .62], [.33, .8], [.15, .94], [0, 1]];
  const pts = [];
  R.forEach(([x, y], i) => {
    pts.push([x, y]);
    if (i >= 2 && i <= 6) {   // a slit between point i and i + 1
      const [x2, y2] = R[i + 1], mx = (x + x2) / 2, my = (y + y2) / 2, dx = x2 - x, dy = y2 - y, L = Math.hypot(dx, dy), ux = dx / L * .04, uy = dy / L * .04;
      pts.push([mx - ux, my - uy], [mx * .4, my - .07], [mx + ux, my + uy]);
    }
  });
  const s = new THREE.Shape();
  s.moveTo(0, .1);
  for (const [x, y] of pts) if (x > 0) s.lineTo(x, y);
  s.lineTo(0, 1);
  for (const [x, y] of pts.slice().reverse()) if (x > 0) s.lineTo(-x, y);
  s.lineTo(0, .1);
  for (const sx of [-1, 1]) for (const [x, y] of [[.17, .3], [.2, .56]]) s.holes.push(new THREE.Path().absellipse(sx * x, y, .028, .045, 0, PI * 2, sx < 0, 0));
  return s;
}

// ── canvas textures (drawn at 2x; Hangul in Jua, redrawn once the web font arrives) ──────────────────────────────
const FONT = px => `${px}px Ssurround, Jua, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
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
const line = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
function heartPath(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * .7); c.bezierCurveTo(x - s * 1.2, y - s * .1, x - s * .55, y - s * .95, x, y - s * .35); c.bezierCurveTo(x + s * .55, y - s * .95, x + s * 1.2, y - s * .1, x, y + s * .7); }
function clip(c, x, y, w, h, fn) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); fn(); c.restore(); }
function cloud(c, x, y, s) { c.fillStyle = '#ffffff'; blob(c, x, y, 8 * s); blob(c, x + 10 * s, y - 5 * s, 10 * s); blob(c, x + 21 * s, y, 8 * s); c.fillRect(x, y - 2 * s, 21 * s, 10 * s); }
function daisy(c, x, y, r, petal = '#ffffff', mid = '#ffc23d') { c.fillStyle = petal; for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; blob(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * .78); } c.fillStyle = mid; blob(c, x, y, r * .6); }
// the game's mochi hero, for screens and photos
function mochi(c, x, y, r, body = '#ffffff') {
  c.fillStyle = body; c.beginPath(); c.ellipse(x, y, r, r * .84, 0, 0, PI * 2); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1.1, r * .08); c.stroke();
  c.fillStyle = '#2a1d33'; blob(c, x - r * .34, y - r * .06, r * .1); blob(c, x + r * .34, y - r * .06, r * .1);
  c.fillStyle = '#ff9fb5'; blob(c, x - r * .58, y + r * .2, r * .14); blob(c, x + r * .58, y + r * .2, r * .14);
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1, r * .07); c.beginPath(); c.arc(x, y + r * .06, r * .14, .25, PI - .25); c.stroke();
}

// Label atlas, 1024² canvas = 512² drawing units. Rows 0–1: 8 labels (128×32); below: TV screen, cereal box, parcel label,
// album covers, photos, a calendar, a kid's drawing and the kimchi-fridge display.
const AT = 512, PXU = .5 / 1024;
const RC = (x, y, w, h) => [x / AT + PXU, 1 - (y + h) / AT + PXU, (x + w) / AT - PXU, 1 - y / AT - PXU];
const LBL = [['김치', '#fff4e2', '#9b3b4b'], ['감자칩', '#ffd23f', '#e8462f'], ['쿠키', '#8fd3f4', '#ffffff'], ['라면', '#ff6b57', '#ffffff'],
  ['우유', '#ffffff', '#3f9be0'], ['보리차', '#f6d79a', '#8a5a2e'], ['주스', '#ffab4c', '#ffffff'], ['만두', '#ffffff', '#4fae5a']];
const LB = i => RC((i % 4) * 128, Math.floor(i / 4) * 32, 128, 32);
const RG = { tv: RC(0, 64, 256, 144), cereal: RC(256, 64, 96, 128), ship: RC(352, 64, 128, 80), cal: RC(256, 208, 80, 96), draw: RC(336, 208, 80, 64), disp: RC(0, 280, 96, 32) };
const PHOTO = i => RC(i * 64, 208, 64, 72);
const ALBUM = i => RC(352 + i * 64, 144, 64, 64);

function drawTV(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#6fc3f5'); g.addColorStop(1, '#e4f7ff'); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = '#ffe27a'; blob(c, x + w - 46, y + 46, 13);
    cloud(c, x + 24, y + 40, 1); cloud(c, x + 130, y + 30, .8);
    c.fillStyle = '#9be38f'; c.beginPath(); c.ellipse(x + 50, y + h + 18, 124, 66, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#6cc46a'; c.beginPath(); c.ellipse(x + 214, y + h + 28, 120, 70, 0, 0, PI * 2); c.fill();
    for (const [fx, fy] of [[x + 26, y + 122], [x + 66, y + 112], [x + 206, y + 120], [x + 238, y + 130]]) daisy(c, fx, fy, 3);
    mochi(c, x + 108, y + 98, 22);
    c.fillStyle = '#ffd23f'; blob(c, x + 166, y + 110, 11); c.fillStyle = '#2a1d33'; blob(c, x + 162, y + 107, 1.7); blob(c, x + 170, y + 107, 1.7);
    c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(x + 163, y + 112); c.lineTo(x + 169, y + 112); c.lineTo(x + 166, y + 116); c.fill();
    c.fillStyle = '#ff5a6e'; for (let i = 0; i < 3; i++) { heartPath(c, x + 14 + i * 15, y + 14, 6); c.fill(); }
    c.fillStyle = '#ffc93c'; blob(c, x + w - 58, y + 14, 6);
    txt(c, '×12', x + w - 36, y + 15, 12, '#ffffff', { stroke: '#2a1d33', sw: 3 });
  });
}
function drawCereal(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#ffd65c'; c.fillRect(x, y, w, h);
    c.fillStyle = '#ff6b57'; c.fillRect(x, y, w, 30);
    txt(c, '시리얼', x + w / 2, y + 16, 20, '#ffffff', { stroke: '#c8402e', sw: 3 });
    const bx = x + w / 2, by = y + 62;
    c.fillStyle = '#c98a52'; blob(c, bx - 17, by - 16, 8); blob(c, bx + 17, by - 16, 8); blob(c, bx, by, 22);
    c.fillStyle = '#f6dcb8'; c.beginPath(); c.ellipse(bx, by + 8, 11, 8, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#2a1d33'; blob(c, bx - 8, by - 4, 2.4); blob(c, bx + 8, by - 4, 2.4); blob(c, bx, by + 5, 2.6);
    c.fillStyle = '#ff9fb5'; blob(c, bx - 14, by + 6, 3.2); blob(c, bx + 14, by + 6, 3.2);
    c.fillStyle = '#ff9a3c'; for (const [dx, dy] of [[-18, 0], [-6, -3], [6, -2], [18, 0], [0, 3]]) { c.beginPath(); c.arc(bx + dx, y + 100 + dy, 5, 0, PI * 2); c.fill(); }
    c.fillStyle = '#8fd3f4'; c.beginPath(); c.moveTo(bx - 32, y + 102); c.quadraticCurveTo(bx, y + 136, bx + 32, y + 102); c.closePath(); c.fill();
    c.fillStyle = '#ffffff'; c.fillRect(bx - 32, y + 101, 64, 3);
  });
}
function drawShip(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
    c.fillStyle = '#ffc23d'; c.fillRect(x, y, w, 18); txt(c, '택배', x + 24, y + 10, 13, '#8a5a2e');
    c.fillStyle = '#c98a52'; blob(c, x + w - 14, y + 9, 6); blob(c, x + w - 19, y + 4, 2.5); blob(c, x + w - 9, y + 4, 2.5);
    c.fillStyle = '#d9d4cc'; for (let i = 0; i < 3; i++) c.fillRect(x + 8, y + 26 + i * 9, i === 2 ? 50 : 76, 4);
    c.fillStyle = '#2a1d33'; for (let i = 0; i < 26; i++) { const bw = (i * 7) % 3 + 1; c.fillRect(x + 8 + i * 3.2, y + 58, bw, 16); }
    c.save(); c.translate(x + 104, y + 52); c.rotate(-.25); c.strokeStyle = '#ff5a5a'; c.lineWidth = 2; c.strokeRect(-18, -9, 36, 18); txt(c, '조심', 0, 1, 11, '#ff5a5a'); c.restore();
  });
}
function drawPhoto(c, i, x, y) {
  clip(c, x, y, 64, 72, () => {
    c.fillStyle = '#ffffff'; c.fillRect(x, y, 64, 72);
    const px = x + 5, py = y + 5, pw = 54, ph = 50;
    const g = c.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, '#8fd3f4'); g.addColorStop(1, '#e4f7ff'); c.fillStyle = g; c.fillRect(px, py, pw, ph);
    if (i === 0) {   // Fuji
      c.fillStyle = '#6f8fd8'; c.beginPath(); c.moveTo(px, py + ph); c.lineTo(px + 27, py + 14); c.lineTo(px + pw, py + ph); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(px + 18, py + 27); c.lineTo(px + 27, py + 14); c.lineTo(px + 36, py + 27); c.lineTo(px + 31, py + 24); c.lineTo(px + 27, py + 28); c.lineTo(px + 23, py + 24); c.fill();
      c.fillStyle = '#ff7a8a'; blob(c, px + 46, py + 10, 5);
    } else if (i === 1) {   // a cat
      c.fillStyle = '#ffab4c'; blob(c, px + 27, py + 30, 15);
      c.beginPath(); c.moveTo(px + 13, py + 24); c.lineTo(px + 15, py + 9); c.lineTo(px + 24, py + 18); c.fill(); c.beginPath(); c.moveTo(px + 41, py + 24); c.lineTo(px + 39, py + 9); c.lineTo(px + 30, py + 18); c.fill();
      c.fillStyle = '#2a1d33'; blob(c, px + 21, py + 29, 2); blob(c, px + 33, py + 29, 2); c.fillStyle = '#ff7f9e'; blob(c, px + 27, py + 34, 1.8);
    } else if (i === 2) {   // seaside
      c.fillStyle = '#4fa8e8'; c.fillRect(px, py + 30, pw, 20); c.fillStyle = '#f6dfa6'; c.fillRect(px, py + 42, pw, 8);
      c.fillStyle = '#ffd23f'; blob(c, px + 40, py + 16, 8); cloud(c, px + 6, py + 12, .5);
    } else {   // two mochis
      c.fillStyle = '#9be38f'; c.fillRect(px, py + 36, pw, 14);
      mochi(c, px + 18, py + 32, 11); mochi(c, px + 38, py + 34, 8, '#ffe9a8');
    }
    c.fillStyle = '#d9d4cc'; c.fillRect(x + 14, y + 61, 36, 3);
  });
}
function drawCal(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h); c.fillStyle = '#ff6b57'; c.fillRect(x, y, w, 22); txt(c, '10월', x + w / 2, y + 12, 15, '#ffffff');
    c.fillStyle = '#c9c3d9'; for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) c.fillRect(x + 6 + k * 12, y + 30 + r * 13, 8, 7);
    c.strokeStyle = '#ff4d5e'; c.lineWidth = 2; c.beginPath(); c.arc(x + 46, y + 59.5, 7, 0, PI * 2); c.stroke();
    c.fillStyle = '#7fd6c0'; c.fillRect(x + 6 + 12 * 4, y + 30 + 13 * 3, 8, 7);
  });
}
function drawKid(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#fffdf3'; c.fillRect(x, y, w, h);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = '#ffd23f'; blob(c, x + 66, y + 13, 7);
    c.strokeStyle = '#ffd23f'; c.lineWidth = 1.6; for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; line(c, [[x + 66 + Math.cos(a) * 9, y + 13 + Math.sin(a) * 9], [x + 66 + Math.cos(a) * 12, y + 13 + Math.sin(a) * 12]]); }
    c.strokeStyle = '#ff6b57'; c.lineWidth = 2.2; line(c, [[x + 10, y + 34], [x + 28, y + 18], [x + 46, y + 34]]);
    c.strokeStyle = '#3f9be0'; c.strokeRect(x + 14, y + 34, 28, 22);
    c.fillStyle = '#ffab4c'; c.fillRect(x + 24, y + 44, 8, 12);
    mochi(c, x + 60, y + 46, 8);
    c.strokeStyle = '#6cc46a'; c.lineWidth = 2; line(c, [[x + 4, y + 60], [x + 76, y + 60]]);
  });
}
function drawAlbum(c, i, x, y) {
  clip(c, x, y, 64, 64, () => {
    if (i === 0) {
      c.fillStyle = '#8fd3f4'; c.fillRect(x, y, 64, 64); c.fillStyle = '#ffc23d'; blob(c, x + 32, y + 36, 18);
      c.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) c.fillRect(x, y + 48 + k * 6, 64, 3);
      txt(c, '여름', x + 32, y + 13, 12, '#ffffff', { stroke: '#3f9be0', sw: 3 });
    } else {
      c.fillStyle = '#ff6b57'; c.fillRect(x, y, 64, 64); c.fillStyle = '#fff4e2'; blob(c, x + 32, y + 32, 20);
      c.fillStyle = '#2a1d33'; blob(c, x + 28, y + 38, 5); c.fillRect(x + 32, y + 20, 2.5, 18); c.fillRect(x + 32, y + 20, 9, 3);
    }
  });
}
function drawDisp(c, x, y, w, h) {
  c.fillStyle = '#2f3346'; c.fillRect(x, y, w, h);
  txt(c, '-1℃', x + 30, y + 17, 17, '#7fffd4');
  c.fillStyle = '#ffc23d'; for (let i = 0; i < 3; i++) c.fillRect(x + 60 + i * 10, y + 22 - i * 4, 6, 4 + i * 4);
}
const atlas = () => tex('apt-atlas', 1024, 1024, c => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, AT, AT);
  LBL.forEach(([s, bg, fg], i) => {
    const x = (i % 4) * 128, y = Math.floor(i / 4) * 32;
    c.fillStyle = bg; c.fillRect(x, y, 128, 32);
    c.fillStyle = fg; c.fillRect(x, y + 2, 128, 3); c.fillRect(x, y + 27, 128, 3);
    txt(c, s, x + 64, y + 17, s.length > 2 ? 18 : 20, fg);
  });
  drawTV(c, 0, 64, 256, 144); drawCereal(c, 256, 64, 96, 128); drawShip(c, 352, 64, 128, 80);
  drawAlbum(c, 0, 352, 144); drawAlbum(c, 1, 416, 144);
  for (let i = 0; i < 4; i++) drawPhoto(c, i, i * 64, 208);
  drawCal(c, 256, 208, 80, 96); drawKid(c, 336, 208, 80, 64); drawDisp(c, 0, 280, 96, 32);
}, { text: true });
const atlasMat = () => mat('#ffffff', { map: atlas() });
const screenMat = () => mat('#ffffff', { map: atlas(), emissive: '#ffffff', ei: .12 });
const bandGeo = (r, h, rc, a = 2.2) => cellUV(new THREE.CylinderGeometry(r, r, h, 8, 1, true, -a / 2, a), rc);
const quadGeo = (w, h, rc) => cellUV(new THREE.PlaneGeometry(w, h), rc);

// Fabric prints (repeat; world-sized through planarUV)
const quiltTex = c1 => tex('apt-quilt|' + c1, 128, 128, (c, w, h) => {
  c.fillStyle = tint('#fff3ea'); c.fillRect(0, 0, w, h);
  c.fillStyle = tint(shade(c1, .17)); c.fillRect(0, 0, w / 2, h); c.fillRect(0, 0, w, h / 2);
  c.fillStyle = tint(c1); c.fillRect(0, 0, w / 2, h / 2);
  daisy(c, w * .25, h * .25, 4.2, '#ffffff', '#ffc23d');
}, { repeat: [1, 1] });
const ginghamTex = c1 => tex('apt-gingham|' + c1, 128, 128, (c, w, h) => {
  c.fillStyle = '#fffaf2'; c.fillRect(0, 0, w, h);
  c.fillStyle = tint(shade(c1, .14)); c.fillRect(0, 0, w / 2, h); c.fillRect(0, 0, w, h / 2);
  c.fillStyle = tint(c1); c.fillRect(0, 0, w / 2, h / 2);
}, { repeat: [1, 1] });
// The city seen from the balcony: sky, apartment blocks, trees, the balcony rail and planters.
const viewTex = () => tex('apt-view', 512, 564, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h * .75); g.addColorStop(0, '#79c4f2'); g.addColorStop(1, '#dff4ff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  cloud(c, 30, 36, 1.2); cloud(c, 170, 24, .9);
  const block = (x, y, bw, bh, body, win, roof) => {
    c.fillStyle = body; c.fillRect(x, y, bw, bh); c.fillStyle = roof; c.fillRect(x - 2, y - 6, bw + 4, 7);
    c.fillStyle = win; for (let yy = y + 8; yy < y + bh - 6; yy += 13) for (let xx = x + 6; xx < x + bw - 8; xx += 12) c.fillRect(xx, yy, 7, 7);
  };
  block(6, 78, 58, 160, '#e7e0f4', '#cfc5ea', '#d7cdee'); block(176, 66, 66, 170, '#e7e0f4', '#cfc5ea', '#d7cdee');
  block(56, 104, 84, 140, '#fff0dc', '#9fd2f2', '#ff9f8a'); block(150, 118, 70, 130, '#ffe3d1', '#9fd2f2', '#7fd6c0');
  txt(c, '101동', 98, 122, 12, '#c98f58');
  c.fillStyle = '#6cc46a'; for (let i = 0; i < 9; i++) blob(c, 8 + i * 31, 206 + (i % 2) * 6, 20);
  c.fillStyle = '#8fd47a'; for (let i = 0; i < 8; i++) blob(c, 22 + i * 32, 214 + (i % 2) * 5, 15);
  c.fillStyle = '#f2e3cc'; c.fillRect(0, 240, w, h - 240);
  c.fillStyle = '#e6d3b6'; for (let x = 0; x < w; x += 32) c.fillRect(x, 240, 2, h - 240);
  c.fillStyle = '#ffffff'; c.fillRect(0, 196, w, 6); c.fillRect(0, 236, w, 5);
  for (let x = 6; x < w; x += 14) c.fillRect(x, 200, 3, 38);
  const planter = (x, y, pc, fc) => {
    c.fillStyle = '#5fb35a'; for (let k = 0; k < 5; k++) blob(c, x + 6 + k * 9, y - 6 - (k % 2) * 4, 8);
    for (let k = 0; k < 4; k++) daisy(c, x + 9 + k * 10, y - 12 - (k % 2) * 5, 3, fc, '#ffc23d');
    c.fillStyle = pc; roundRect(c, x, y - 4, 48, 20, 3); c.fill();
  };
  planter(14, 262, '#ffffff', '#ffffff'); planter(184, 266, '#f3a272', '#ff8a7a');
}, { text: true });

const B = {};

// ═════════════════════════════════════════════ LIVING ROOM ═════════════════════════════════════════════
// 코타츠 (1×1): a low honey table over a quilted red-check blanket with little daisies; tea things on top. The front of the
// blanket lifts to show the warm space under the table.
B.kotatsu = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), q = col(T, 'quilt'), acc = col(T, 'accent'), tk = [wood, woodD, q, acc].join(',');
  const qm = mat('#ffffff', { map: quiltTex(q), side: DS });
  const TY = .4, ti = .4, bo = .49, H = TY - .012, s = bo - ti, th = .03, BT = TY + .056, hem = shade(q, -.14);
  // the three fixed sides sit .005 lower than the lifting front one, so their top edges never share its plane
  const panel = (ry, dy = 0) => planarUV(ni(trapGeo(2 * ti, 2 * bo, H, s, th)).applyMatrix4(xf(Math.sin(ry) * ti, TY + dy, Math.cos(ry) * ti, 0, ry, 0)), .22);
  const hemL = xf(0, -H + .025, s - .025 * s / H, -Math.atan2(s, H));   // a piping band along the hem, centred on the cloth
  const hemM = ry => xf(Math.sin(ry) * ti, TY - .005, Math.cos(ry) * ti, 0, ry, 0).multiply(hemL);
  f.add(mg('kotatsu-quilt|' + q, qm, ({ addM }) => {
    const I = new THREE.Matrix4();
    for (const ry of [HP, PI, -HP]) addM(panel(ry, -.005), I);
    addM(planarUV(ni(G.box(2 * ti + .02, .04, 2 * ti + .02, .015)).translate(0, TY - .024, 0), .22), I);   // top a hair under the flap's top edge
  }));
  f.add(mc('kotatsu|' + tk, ({ add, addM, tube }) => {
    for (const ry of [HP, PI, -HP]) addM(G.box(2 * bo - .06, .05, .044, .016), hemM(ry), hem);
    add(G.pbox(.74, .006, .74), shade(q, .22), 0, .003, 0);                       // warm mat inside
    add(G.box(.3, .05, .3, .015), '#e9e2d6', 0, TY - .085, 0);                    // the heater under the board
    add(G.box(.86, .045, .86, .02), woodD, 0, TY + .006 + .0225, 0);
    add(G.box(.74, .01, .74, .004), wood, 0, BT - .005, 0);                          // lighter inset top
    // tea tray: a sage teapot and a cup; a tomato mug
    add(G.cyl(.15, .14, .02, 22), CREAM, -.14, BT + .01, -.12);
    const px = -.17, pz = -.14, py = BT + .02;
    add(G.sph(.075, 14, 10), acc, px, py + .062, pz, 0, 0, 0, [1, .85, 1]);
    add(G.cyl(.035, .042, .02, 12), shade(acc, -.08), px, py + .127, pz);
    add(G.sph(.016, 8, 6), MUSTARD, px, py + .145, pz);
    tube([px + .055, py + .05, pz], [px + .115, py + .1, pz], .013, acc, 6);
    add(G.tor(.04, .011, PI, 4, 10), shade(acc, -.08), px - .075, py + .065, pz, 0, 0, HP);
    add(G.cyl(.036, .03, .05, 12), WHITE, -.04, py + .025, -.05);
    add(G.cyl(.03, .03, .004, 12), '#c99a5c', -.04, py + .052, -.05);
    add(G.cyl(.046, .042, .095, 14), TOMATO, .2, BT + .0475, -.2);
    add(G.tor(.03, .011, PI * 2, 4, 10), TOMATO, .25, BT + .052, -.2);
    add(G.cyl(.04, .04, .004, 12), '#a8714a', .2, BT + .097, -.2);
  }));
  // the front of the quilt (its own mesh: it lifts)
  const pv = new THREE.Group(); put(pv, 0, TY, ti); f.add(pv);
  pv.add(mg('kotatsu-flap|' + q, qm, ({ addM }) => addM(panel(0).translate(0, -TY, -ti), new THREE.Matrix4())));
  pv.add(mc('kotatsu-flaphem|' + q, ({ addM }) => addM(G.box(2 * bo - .06, .05, .044, .016), hemL, hem)));
  const p = f.part('lift', pv, (t, b) => { pv.rotation.x = -2.5 * t; pv.position.y = b.p.y + .07 * t; }, { label: '코타츠 이불', sfx: 'swish', dur: .32 });
  f.spot('inside', null, .12, .006, .2, { part: p, maxH: .32, label: '코타츠 이불 속', scale: .9 });
  f.spot('on', null, .12, BT, .16, { maxH: .45, label: '코타츠 위', scale: .8 });
};

// 방석 (1×1): two zabuton stacked on the floor — a mustard one under a fluffy sage one with a daisy; the top one lifts.
B.zabuton = (f, T) => {
  const lo = col(T, 'accent3'), hi = col(T, 'accent'), tk = [lo, hi].join(',');
  f.add(mc('zabuton|' + tk, ({ add }) => {
    add(G.box(.64, .07, .64, .032, 2), lo, 0, .035, 0, 0, .14, 0);
    for (const [x, z] of [[-.3, .22], [.27, .26]]) add(G.sph(.024, 8, 6), shade(lo, -.14), x, .03, z, 0, 0, 0, [1, .8, 1]);
  }));
  const cu = grp(mc('zabuton-top|' + tk, ({ add }) => {
    add(G.box(.56, .1, .56, .045, 2), hi, 0, 0, 0);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; add(G.sph(.045, 10, 6), WHITE, Math.cos(a) * .066, .05, Math.sin(a) * .066, 0, -a, 0, [1.3, .22, .75]); }
    add(G.sph(.04, 10, 6), MUSTARD, 0, .057, 0, 0, 0, 0, [1, .3, 1]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.sph(.026, 8, 6), CREAM, sx * .265, 0, sz * .265);
    add(G.sph(.016, 8, 6), shade(hi, -.14), 0, 0, .285, 0, 0, 0, [1, 1, .5]);
  }));
  put(cu, 0, .122, 0); f.add(cu);
  const p = f.part('lift', cu, (t, b) => { cu.position.y = b.p.y + .3 * t; cu.position.z = b.p.z - .14 * t; cu.rotation.x = -.5 * t; }, { label: '방석', sfx: 'lift' });
  f.spot('inside', null, 0, .07, .04, { part: p, maxH: .3, label: '방석 밑', scale: .85 });
};

// 로봇청소기 (1×1): a round white robot vacuum with a sleepy sensor face, parked in front of its charging dock.
B.robovac = (f, T) => {
  const acc = col(T, 'accent'), tk = [acc].join(',');
  const R = .22, cz = .05;
  f.add(mc('robovac|' + tk, ({ add }) => {
    add(G.box(.34, .17, .08, .035), WHITE, 0, .085, -.42);
    add(G.box(.34, .02, .12, .008), '#e2e6ee', 0, .01, -.33);
    add(G.sph(.014, 8, 6), MINT, 0, .13, -.38 + .006, 0, 0, 0, [1, 1, .5]);
    add(G.pbox(.1, .012, .006), STEEL2, 0, .06, -.38 + .007);
    // the robot
    add(G.cyl(R - .012, R - .02, .012, 30), DARK, 0, .006, cz);
    add(G.cyl(R, R, .06, 32), WHITE, 0, .042, cz);
    add(G.tor(R + .004, .016, PI, 5, 22), '#d4d9e6', 0, .038, cz, HP, 0, 0);
    add(G.cyl(R - .03, R - .03, .016, 32), '#eef1f7', 0, .078, cz);
    add(G.tor(R - .03, .007, PI * 2, 4, 32), acc, 0, .086, cz, HP, 0, 0);
    add(G.cyl(.055, .06, .028, 20), STEEL2, 0, .1, cz - .1);
    face(add, 0, .102, cz - .1 + .052, .45, { blush: null });
    add(G.cyl(.022, .022, .008, 14), acc, -.09, .09, cz + .09);
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + .3; add(G.pbox(.08, .004, .012), WHITE, .17 + Math.cos(a) * .035, .006, cz + .15 + Math.sin(a) * .035, 0, -a, 0); }
  }));
  f.spot('on', null, .04, .086, cz + .04, { maxH: .45, label: '로봇청소기 위', scale: .85 });
};

// 택배상자 (1×1): a kraft delivery box with a shipping label and a bear stamp; the tape runs over the two flaps, which open.
// Crumpled paper inside lifts whatever hides there into view.
B.parcel = (f, T) => {
  const W = .62, D = .46, H = .42, t = .025, fz = D / 2;
  f.add(mc('parcel', ({ add }) => {
    for (const sz of [-1, 1]) add(G.box(W, H, t, .008), KRAFT, 0, H / 2, sz * (D / 2 - t / 2));
    for (const sx of [-1, 1]) add(G.box(t, H, D - 2 * t, .008), KRAFT, sx * (W / 2 - t / 2), H / 2, 0);
    add(G.pbox(W - 2 * t, .015, D - 2 * t), KRAFT2, 0, .0075, 0);
    for (const [x, y, z, r, c] of [[-.15, .1, -.08, .1, WHITE], [.12, .09, .06, .11, '#f3ecdf'], [0, .12, -.1, .09, '#f3ecdf'], [-.12, .09, .1, .09, WHITE], [.17, .1, -.1, .08, WHITE]])
      add(G.sph(r, 9, 7), c, x, y, z, .4, x * 7, 0, [1, .8, 1]);
    // sticker + bear stamp on the right side
    add(G.box(.08, .08, .006, .002), TOMATO, -.2, .31, fz + .006);
    add(G.cyl(.022, .02, .004, 10), WHITE, -.2, .31, fz + .011, HP, 0, 0);
    const sx = W / 2 + .007;
    add(G.sph(.06, 12, 8), KRAFT2, sx, .22, -.02, 0, 0, 0, [.1, 1, 1]);
    for (const dz of [-.045, .045]) add(G.sph(.022, 8, 6), KRAFT2, sx, .27, -.02 + dz, 0, 0, 0, [.1, 1, 1]);
    for (const dz of [-.022, .022]) add(G.sph(.008, 6, 4), '#8a5a2e', sx + .005, .225, -.02 + dz, 0, 0, 0, [.5, 1, 1]);
  }));
  f.add(mg('parcel-label', atlasMat(), ({ add }) => add(quadGeo(.28, .175, RG.ship), .1, .24, fz + .005)));
  const flap = sx => {   // sx = -1: the left flap (hinge on the left edge), +1: the right one
    const pv = new THREE.Group(); put(pv, sx * W / 2, H + .012, 0);
    pv.add(mc('parcel-flap' + sx, ({ add }) => {
      const cx = -sx * W / 4, tx = -sx * (W / 2 - .0225);
      add(G.box(W / 2 - .003, .024, D, .006), KRAFT, cx, 0, 0);
      add(G.pbox(.045, .006, D + .006), TAPE, tx, .015, 0);
      for (const sz of [-1, 1]) add(G.pbox(.045, .088, .006), TAPE, tx, -.026, sz * (D / 2 + .007));
    }));
    f.add(pv); return pv;
  };
  const L = flap(-1), R = flap(1);
  const p = f.part('lid', [L, R], t => { L.rotation.z = 2.4 * t; R.rotation.z = -2.4 * t; }, { label: '택배상자', sfx: 'open' });
  f.spot('inside', null, 0, .16, 0, { part: p, maxH: .26, label: '택배상자 안', scale: .85 });
};

// 낮은 TV장 (2×1): a low honey cabinet — a drawer each side, an open middle cubby of game cases — with a TV showing a
// cheerful game, a docked console and a bunny figurine on top.
B.tvlow = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [wood, woodD].join(',');
  const W = 1.76, H = .38, D = .42, z0 = -.22, y0 = .07, fz = z0 + D / 2, back = z0 - D / 2, topY = y0 + H + .04, bayH = H - .035, dfront = shade(wood, .05);
  f.add(mc('tvlow|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.03, .022, y0, 10), woodD, sx * (W / 2 - .08), y0 / 2, z0 + sz * (D / 2 - .07));
    add(G.box(W, .035, D, .012), wood, 0, y0 + .0175, z0);
    add(G.box(W, H, .03, .012), wood, 0, y0 + H / 2, back + .015);
    for (const sx of [-1, 1]) add(G.box(.035, H, D, .012), wood, sx * (W / 2 - .0175), y0 + H / 2, z0);
    for (const sx of [-1, 1]) add(G.pbox(.03, bayH, D - .03), wood, sx * .3, y0 + .035 + bayH / 2, z0 + .015);
    add(G.box(W + .04, .04, D + .02, .015), woodD, 0, y0 + H + .02, z0);
    add(G.pbox(.57, bayH - .01, .006), shade(wood, -.14), 0, y0 + .035 + bayH / 2, back + .034);
    // the cubby: game cases, a little router
    [TOMATO, SKY, MUSTARD, MINT, LILAC, CORAL].forEach((c, k) => add(G.box(.024, .19, .17, .006), c, -.25 + k * .03, y0 + .035 + .095, z0 - .02));
    add(G.box(.13, .035, .09, .01), WHITE, .19, y0 + .035 + .0175, z0 - .11);
    add(G.sph(.008, 6, 4), '#4bd18a', .16, y0 + .056, z0 - .11 + .045, 0, 0, 0, [1, 1, .5]);
    // TV
    const tz = z0 - .1;
    add(G.box(.4, .02, .18, .008), CHAR, 0, topY + .01, tz + .06);
    add(G.box(.06, .12, .04, .01), CHAR, 0, topY + .08, tz - .02);
    add(G.box(1.14, .66, .05, .025), CHAR, 0, topY + .45, tz);
    add(G.sph(.009, 6, 4), MINT, .5, topY + .14, tz + .025 + .004, 0, 0, 0, [1, 1, .5]);
    // docked console with red / blue controllers
    const cx = -.68, cz = z0 + .02;
    add(G.box(.2, .1, .06, .015), CHAR, cx, topY + .05, cz);
    add(G.box(.24, .13, .018, .006), '#2f3346', cx, topY + .125, cz - .006);
    add(G.box(.035, .13, .018, .008), TOMATO, cx - .1375, topY + .125, cz - .006);
    add(G.box(.035, .13, .018, .008), SKY, cx + .1375, topY + .125, cz - .006);
    // bunny figurine
    const bx = .7, bz = z0 - .1;
    add(G.sph(.055, 12, 8), WHITE, bx, topY + .05, bz, 0, 0, 0, [1, .95, .9]);
    add(G.sph(.045, 12, 8), WHITE, bx, topY + .13, bz);
    for (const s of [-1, 1]) { add(G.cap(.016, .06, 2, 6), WHITE, bx + s * .02, topY + .2, bz, 0, 0, -s * .15); add(G.sph(.007, 5, 4), INK, bx + s * .018, topY + .135, bz + .042); }
    add(G.sph(.01, 6, 4), BLUSH, bx, topY + .122, bz + .045);
  }));
  f.add(mg('tvlow-screen', screenMat(), ({ add }) => add(quadGeo(1.06, .596, RG.tv), 0, topY + .45, z0 - .1 + .025 + .005)));
  for (const sx of [-1, 1]) {
    const dv = new THREE.Group(); put(dv, sx * .58, y0 + .035 + bayH / 2, fz + .004);
    dv.add(mc('tvlow-drawer' + sx + '|' + tk, ({ add }) => {
      const ic = shade(wood, -.12), fl = -bayH / 2 + .03;
      add(G.box(.52, bayH - .012, .035, .016), dfront, 0, 0, 0);
      add(G.cap(.014, .14, 2, 6), woodD, 0, bayH / 2 - .07, .03, 0, 0, HP);
      add(G.pbox(.46, .012, .34), ic, 0, fl, -.19);
      for (const k of [-1, 1]) add(G.pbox(.012, .17, .34), ic, k * .23, fl + .085, -.19);
      add(G.pbox(.46, .17, .012), ic, 0, fl + .085, -.36);
      add(G.box(.12, .03, .09, .01), sx < 0 ? TOMATO : SKY, -.12, fl + .006 + .015, -.28);
    }));
    f.add(dv);
    const lbl = sx < 0 ? 'TV장 왼쪽 서랍' : 'TV장 오른쪽 서랍';
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .36 * t; }, { label: lbl, sfx: 'drawer', dur: .26 });
    f.spot('inside', dv, .08, -bayH / 2 + .036, -.17, { part: p, maxH: .28, label: lbl, scale: .8 });
  }
  f.spot('on', null, .07, y0 + .035, z0 + .06, { maxH: .3, label: 'TV장 가운데 칸', scale: .8 });
  f.spot('on', null, .6, topY, z0 + .1, { maxH: .45, label: 'TV장 위', scale: .8 });
};

// 스탠드 조명 (1×1): a wooden floor lamp with a glowing cream drum shade and a side tray halfway up (a mug on it).
B.floorlamp = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc = col(T, 'accent'), tk = [wood, woodD, acc].join(',');
  const ty = .6, sy = 1.5;
  f.add(mc('floorlamp|' + tk, ({ add, tube }) => {
    add(G.cyl(.17, .19, .04, 24), woodD, 0, .02, 0);
    tube([0, .04, 0], [0, sy - .08, 0], .018, woodD, 8);
    add(G.cyl(.2, .2, .03, 26), wood, 0, ty - .015, 0);
    add(G.tor(.2, .012, PI * 2, 4, 26), woodD, 0, ty, 0, HP);
    add(G.cyl(.045, .04, .09, 12), acc, -.1, ty + .045, .08);
    add(G.tor(.03, .01, PI * 2, 4, 10), acc, -.145, ty + .05, .08, 0, HP, 0);
    add(G.tor(.25, .012, PI * 2, 4, 26), '#f0d3a2', 0, sy - .15, 0, HP);
    add(G.tor(.19, .012, PI * 2, 4, 24), '#f0d3a2', 0, sy + .15, 0, HP);
  }));
  f.add(put(mesh(geo('apt-lampshade', () => new THREE.CylinderGeometry(.19, .25, .3, 26)), mat(CREAM, { emissive: '#ffe9b8', ei: .55 })), 0, sy, 0));
  f.spot('on', null, .08, ty, -.03, { maxH: .45, label: '스탠드 쟁반', scale: .8 });
  f.spot('under', null, .1, .04, .1, { maxH: .45, label: '스탠드 아래', scale: .8 });
};

// 몬스테라 화분 (1×1): a big monstera with split leaves in a cream pot; something can hide behind the pot.
B.monstera = (f, T) => {
  const pc = col(T, 'pot'), tk = [pc].join(',');
  const LEAVES = [   // [direction (0 = +z), base height, radius, tilt up, size, colour]
    [.3, 1.2, .1, .35, .46, LEAF], [-1.15, 1.05, .12, .45, .42, LEAF2], [1.6, .98, .12, .4, .42, LEAF3], [2.6, 1.14, .1, .55, .38, LEAF],
    [-2.4, .92, .1, .5, .36, LEAF2], [-.45, .8, .14, .22, .38, LEAF3], [.95, .7, .16, .18, .34, LEAF2]];
  f.add(mc('monstera|' + tk, ({ add, addM, tube }) => {
    add(G.lathe([[0, 0], [.14, 0], [.16, .02], [.2, .36], [.22, .38], [.205, .395], [.188, .372], [.182, .34], [0, .34]], 24), '#fbf3e6', 0, 0, 0);
    add(G.tor(.195, .014, PI * 2, 4, 24), pc, 0, .3, 0, HP);
    add(G.cyl(.182, .18, .02, 22), SOIL, 0, .345, 0);
    const leaf = monsteraShape(), lg = G.ext(leaf, .025, 0, 4), rib = G.pbox(.026, .8, .012);
    for (const [a, y, r, e, s, c] of LEAVES) {
      const P = [Math.sin(a) * r, y, Math.cos(a) * r];
      tube([Math.sin(a) * .03, .35, Math.cos(a) * .03], P, .012, LEAF2, 6);
      const M = new THREE.Matrix4().makeTranslation(...P).multiply(new THREE.Matrix4().makeRotationY(a + PI)).multiply(new THREE.Matrix4().makeRotationX(-HP + e)).multiply(new THREE.Matrix4().makeScale(s, s, s));
      addM(lg, M, c);
      addM(rib, M.clone().multiply(xf(0, .5, .025 + .011)), shade(c, .12));
    }
  }));
  f.spot('behind', null, .08, 0, -.33, { maxH: .45, label: '화분 뒤', scale: .75 });
  f.spot('on', null, .07, .355, .07, { maxH: .3, label: '화분 흙 위', scale: .65 });
};

// 2인 소파 (2×1): a cream sofa, a blue gingham throw over its right arm, two throw pillows (sage daisy, mustard stripe) that
// lift to show what slipped under them.
B.sofa2 = (f, T) => {
  const sofa = col(T, 'sofa'), woodD = col(T, 'woodD'), thr = col(T, 'throw'), p1 = col(T, 'accent'), p2 = col(T, 'accent3');
  const tk = [sofa, woodD, thr, p1, p2].join(','), sofaD = shade(sofa, -.05), seat = .42;
  f.add(mc('sofa2|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.035, .028, .08, 10), woodD, sx * .8, .04, .1 + sz * .3);
    add(G.box(1.8, .2, .74, .06), sofaD, 0, .18, .1);
    add(G.box(1.62, .58, .2, .09), sofa, 0, .57, -.22);
    for (const sx of [-1, 1]) add(G.box(.2, .34, .8, .09), sofa, sx * .8, .45, .08);
    for (const sx of [-1, 1]) add(G.box(.7, .14, .58, .06), sofa, sx * .355, .35, .17);
  }));
  f.add(mg('sofa2-throw|' + thr, mat('#ffffff', { map: ginghamTex(thr) }), ({ addM }) => {
    const I = new THREE.Matrix4(), P = (w, h, d, x, y, z) => addM(planarUV(ni(G.box(w, h, d, .008)).translate(x, y, z), .16), I);
    P(.24, .02, .46, .8, .63, .14);
    P(.02, .36, .46, .915, .45, .14);
    P(.02, .16, .46, .685, .55, .14);
  }));
  f.add(mc('sofa2-fringe|' + thr, ({ add }) => { for (let i = 0; i < 7; i++) add(G.cap(.006, .03, 2, 4), WHITE, .915, .255, -.06 + i * .066); }));
  const pillow = (sx, c, key, deco) => {
    const pv = grp(mc('sofa2-pillow' + key + '|' + tk, ({ add }) => { add(G.box(.36, .34, .13, .06, 2), c, 0, 0, 0); deco(add); }));
    put(pv, sx * .42, seat + .17, -.02, -.28, 0, 0); f.add(pv);
    const p = f.part('lift', pv, (t, b) => { pv.position.y = b.p.y + .3 * t; pv.position.z = b.p.z + .18 * t; pv.rotation.x = b.r.x + .55 * t; pv.rotation.z = sx * .15 * t; }, { label: '소파 쿠션', sfx: 'lift' });
    f.spot('inside', null, sx * .42, seat, .02, { part: p, maxH: .3, label: '소파 쿠션 밑', scale: .8 });
  };
  pillow(-1, p1, 'a', add => { for (const [x, y] of [[-.08, .07], [.07, -.06], [.09, .09], [-.07, -.08]]) flower(add, x, y, .065 + .006, 1.1); });
  pillow(1, p2, 'b', add => { for (const y of [-.09, 0, .09]) add(G.pbox(.25, .022, .004), WHITE, 0, y, .065 + .006); });
  f.spot('behind', null, .3, 0, -.41, { maxH: .45, label: '소파 뒤', scale: .8 });
};

// 간식 카트 (1×1): a three-tier rolling cart — juice and snacks at the bottom, cup noodles in the middle, chips and cookies on
// top. Something can sit on every tier.
B.snackcart = (f, T) => {
  const tray = col(T, 'accent'), hd = col(T, 'accent3'), tk = [tray, hd].join(',');
  const W = .52, D = .38, z0 = -.02, TI = [.13, .42, .71], top = TI.map(y => y + .0125);
  f.add(mc('snackcart|' + tk, ({ add, addM, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (W / 2 - .02), z = z0 + sz * (D / 2 - .02);
      tube([x, .06, z], [x, .8, z], .014, WHITE, 6);
      add(G.sph(.017, 8, 6), WHITE, x, .8, z);
      add(G.box(.03, .03, .04, .008), STEEL2, x, .068, z);
      add(G.cyl(.032, .032, .026, 12), DARK, x, .035, z, 0, 0, HP);
      add(G.cyl(.013, .013, .036, 8), WHITE, x, .035, z, 0, 0, HP);
    }
    for (const y of TI) {
      add(G.box(W, .025, D, .01), tray, 0, y, z0);
      for (const sz of [-1, 1]) add(G.box(W, .055, .014, .006), tray, 0, y + .035, z0 + sz * (D / 2 - .007));
      for (const sx of [-1, 1]) add(G.box(.014, .055, D, .006), tray, sx * (W / 2 - .007), y + .035, z0);
    }
    tube([W / 2, .72, z0 - .1], [W / 2 + .07, .74, z0 - .1], .011, hd, 6); tube([W / 2, .72, z0 + .1], [W / 2 + .07, .74, z0 + .1], .011, hd, 6);
    tube([W / 2 + .07, .74, z0 - .11], [W / 2 + .07, .74, z0 + .11], .016, hd, 8);
    // bottom: a juice multipack and a bag of rice puffs
    add(G.box(.2, .14, .14, .015), '#fff4e2', -.12, top[0] + .07, z0 - .06);
    for (const k of [-1, 0, 1]) add(G.cyl(.012, .012, .02, 8), ORANGE, -.12 + k * .06, top[0] + .15, z0 - .06);
    // middle: two cup noodles
    for (const [x, z, lid] of [[-.14, z0 - .05, TOMATO], [-.02, z0 - .08, MUSTARD]]) {
      add(G.cyl(.06, .048, .11, 16), WHITE, x, top[1] + .055, z);
      add(G.cyl(.064, .064, .008, 16), lid, x, top[1] + .11 + .004, z);
    }
    // top: a bag of chips, a cookie box
    const bag = xf(-.12, top[2] + .1, z0 - .04, 0, 0, .08);
    addM(G.box(.16, .19, .05, .022), bag, '#ffd23f');
    for (const dy of [-.085, .085]) addM(G.box(.166, .022, .06, .006), bag.clone().multiply(xf(0, dy, 0)), TOMATO);
    add(G.box(.14, .1, .1, .012), SKY, .1, top[2] + .05, z0 - .08);
  }));
  f.add(mg('snackcart-labels', atlasMat(), ({ add, addM }) => {
    add(quadGeo(.16, .04, LB(6)), -.12, top[0] + .07, z0 - .06 + .07 + .005);
    for (const [x, z] of [[-.14, z0 - .05], [-.02, z0 - .08]]) add(bandGeo(.0565, .045, LB(3), 2.4), x, top[1] + .06, z);
    addM(quadGeo(.13, .0325, LB(1)), xf(-.12, top[2] + .1, z0 - .04, 0, 0, .08).multiply(xf(0, 0, .025 + .005)));
    add(quadGeo(.12, .03, LB(2)), .1, top[2] + .05, z0 - .08 + .05 + .005);
  }));
  f.spot('on', null, .12, top[0], z0 + .04, { maxH: .25, label: '간식 카트 아래칸', scale: .75 });
  f.spot('on', null, .13, top[1], z0 + .04, { maxH: .25, label: '간식 카트 가운데칸', scale: .75 });
  f.spot('on', null, .08, top[2], z0 + .07, { maxH: .45, label: '간식 카트 위칸', scale: .75 });
};

// 작은 식탁 (2×1): a small table under a sage gingham cloth (the front drape rolls up), a chair on each side, a mug, a
// notebook and a daisy on top.
B.diningset = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), cl = col(T, 'cloth'), cush = col(T, 'accent'), tk = [wood, woodD, cl, cush].join(',');
  const TW = .9, TD = .64, ty = .66, CW = TW + .06, CD = TD + .06, ctop = ty + .056, drop = .42;
  const gm = mat('#ffffff', { map: ginghamTex(cl) });
  f.add(mc('diningset|' + tk, ({ add, tube }) => {
    add(G.pbox(TW, .04, TD), wood, 0, ty + .02, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.05, ty, .05, .012), woodD, sx * (TW / 2 - .06), ty / 2, sz * (TD / 2 - .06));
    for (const sx of [-1, 1]) add(G.pbox(.03, .04, CD - .01), WHITE, sx * (CW / 2 - .008), ctop - drop + .02, 0);
    add(G.pbox(CW + .01, .04, .03), WHITE, 0, ctop - drop + .02, -(CD / 2 - .008));
    // chairs, facing the table from each side
    for (const sx of [-1, 1]) {
      const cx = sx * .74, bx = cx + sx * .18;
      for (const lx of [-1, 1]) for (const lz of [-1, 1]) add(G.box(.04, .43, .04, .01), woodD, cx + lx * .16, .215, lz * .16);
      add(G.box(.4, .04, .4, .015), wood, cx, .45, 0);
      add(G.box(.36, .05, .36, .022), cush, cx, .495, 0);
      for (const lz of [-1, 1]) add(G.box(.04, .48, .04, .01), woodD, bx, .69, lz * .16);
      add(G.box(.045, .12, .38, .02), wood, bx, .88, 0);
      add(G.box(.035, .05, .32, .012), wood, bx, .66, 0);
    }
    // on the cloth: a mug, a notebook with a pen, a daisy in a bud vase
    add(G.cyl(.046, .042, .095, 14), TOMATO, .25, ctop + .0475, -.12);
    add(G.tor(.03, .011, PI * 2, 4, 10), TOMATO, .3, ctop + .052, -.12);
    add(G.box(.2, .014, .15, .004), WHITE, -.12, ctop + .007, .07, 0, .25, 0);
    add(G.box(.205, .008, .155, .003), SKY, -.12, ctop + .018, .07, 0, .25, 0);
    add(G.cap(.008, .12, 2, 6), MUSTARD, -.1, ctop + .03, .08, 0, -.6, HP);
    add(G.lathe([[0, 0], [.035, 0], [.045, .04], [.025, .1], [.02, .12], [.028, .13], [0, .13]], 12), SKY2, .04, ctop, -.2);
    tube([.04, ctop + .12, -.2], [.05, ctop + .24, -.2], .005, LEAF2, 4);
    flower(add, .05, ctop + .25, -.2, 1.4);
  }));
  f.add(mg('diningset-cloth|' + cl, gm, ({ addM }) => {
    const I = new THREE.Matrix4(), P = (w, h, d, x, y, z) => addM(planarUV(ni(G.box(w, h, d, .006)).translate(x, y, z), .2), I);
    P(CW, .016, CD, 0, ctop - .008, 0);
    for (const sx of [-1, 1]) P(.016, drop, CD, sx * (CW / 2 - .008), ctop - drop / 2, 0);
    P(CW, drop, .016, 0, ctop - drop / 2, -(CD / 2 - .008));
  }));
  const pv = new THREE.Group(); put(pv, 0, ctop, CD / 2 + .012);
  pv.add(mg('diningset-drape|' + cl, gm, ({ addM }) => addM(planarUV(ni(G.box(CW + .012, drop, .016, .006)).translate(0, ctop - drop / 2, CD / 2 + .012), .2).translate(0, -ctop, -(CD / 2 + .012)), new THREE.Matrix4())));
  pv.add(mc('diningset-drapetrim', ({ add }) => {
    add(G.pbox(CW + .03, .04, .03), WHITE, 0, -drop + .02, 0);
    for (let i = 0; i < 4; i++) add(G.cyl(.02, .02, .012, 10), WHITE, -.33 + i * .22, -drop + .065, .016, HP);
  }));
  f.add(pv);
  const p = f.part('curtain', pv, (t, b) => { pv.scale.y = 1 - .8 * t; pv.position.z = b.p.z + .02 * t; }, { label: '식탁보', sfx: 'swish', dur: .32 });
  f.spot('inside', null, .05, 0, .04, { part: p, maxH: .5, label: '식탁보 밑', scale: .9 });
  f.spot('on', null, .2, ctop, .15, { maxH: .45, label: '식탁 위', scale: .85 });
  f.spot('on', null, .74, .52, .03, { maxH: .42, label: '의자 위', scale: .8 });
};

// 레코드장 (1×1): a low cabinet with a row of records in the left cubby; a turntable on top whose dust lid lifts (something
// can sit on the record), an album leaning beside it.
B.recordcab = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc = col(T, 'accent3'), tk = [wood, woodD, acc].join(',');
  const W = .84, H = .5, D = .42, z0 = -.2, y0 = .07, fz = z0 + D / 2, back = z0 - D / 2, topY = y0 + H + .04, bay = H - .035;
  const PX = -.1, PW = .48, PD = .36, PH = .07, LH = .18, lidC = '#d3edf7';
  f.add(mc('recordcab|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.026, .018, y0, 10), woodD, sx * (W / 2 - .07), y0 / 2, z0 + sz * (D / 2 - .07));
    add(G.box(W, .035, D, .012), wood, 0, y0 + .0175, z0);
    add(G.box(W, H, .03, .012), wood, 0, y0 + H / 2, back + .015);
    for (const sx of [-1, 1]) add(G.box(.035, H, D, .012), wood, sx * (W / 2 - .0175), y0 + H / 2, z0);
    add(G.pbox(.03, bay, D - .03), wood, .08, y0 + .035 + bay / 2, z0 + .015);
    add(G.box(W + .04, .04, D + .02, .015), woodD, 0, y0 + H + .02, z0);
    add(G.pbox(W - .08, bay - .01, .006), shade(wood, -.14), 0, y0 + .035 + bay / 2, back + .034);
    [TOMATO, MUSTARD, SKY, MINT, CREAM, LILAC, CORAL, '#4a4560', SKY].forEach((c, k) => add(G.box(.02, .3, .32, .004), c, -.36 + k * .042, y0 + .035 + .15, z0 + .01, 0, 0, k > 6 ? -.08 * (k - 6) : 0));
    for (let k = 0; k < 3; k++) add(G.cyl(.12, .12, .008, 22), k % 2 ? CHAR : '#4a4560', .245, y0 + .035 + .004 + k * .009, z0 - .08);
    // turntable
    const tp = topY + PH;
    add(G.box(PW, PH, PD, .02), woodD, PX, topY + PH / 2, z0);
    add(G.cyl(.14, .14, .02, 28), STEEL2, PX - .06, tp + .01, z0);
    add(G.cyl(.135, .135, .006, 28), CHAR, PX - .06, tp + .023, z0);
    add(G.cyl(.042, .042, .004, 16), TOMATO, PX - .06, tp + .028, z0);
    add(G.cyl(.006, .006, .02, 6), STEEL, PX - .06, tp + .035, z0);
    add(G.cyl(.028, .032, .03, 12), STEEL, PX + .16, tp + .015, z0 - .11);
    tube([PX + .16, tp + .035, z0 - .11], [PX + .07, tp + .035, z0 + .07], .007, STEEL, 6);
    add(G.box(.03, .016, .045, .005), DARK, PX + .065, tp + .03, z0 + .085, 0, .45, 0);
    for (const [x, c] of [[PX + .12, acc], [PX + .18, MINT]]) add(G.cyl(.018, .018, .02, 12), c, x, topY + .035, z0 + PD / 2 + .01, HP, 0, 0);
    // an album leaning on the right
    add(G.box(.2, .2, .012, .004), WHITE, .29, topY + .1, z0 - .1, -.14, 0, 0);
  }));
  f.add(mg('recordcab-album', atlasMat(), ({ addM }) => addM(quadGeo(.19, .19, ALBUM(0)), xf(.29, topY + .1, z0 - .1, -.14, 0, 0).multiply(xf(0, 0, .011)))));
  const lid = grp(mc('recordcab-lid', ({ add }) => {
    add(G.box(PW + .012, .015, PD + .012, .006), lidC, 0, LH - .0075, PD / 2 + .006);
    for (const sx of [-1, 1]) add(G.box(.012, LH, PD + .012, .004), lidC, sx * (PW / 2), LH / 2, PD / 2 + .006);
    for (const zz of [.006, PD + .006]) add(G.box(PW + .012, LH, .012, .004), lidC, 0, LH / 2, zz);
    add(G.pbox(.04, .16, .004), WHITE, -.12, LH * .55, PD + .006 + .01, 0, 0, -.6);
    add(G.pbox(.02, .1, .004), WHITE, -.07, LH * .6, PD + .006 + .01, 0, 0, -.6);
  }));
  put(lid, PX, topY + PH, z0 - PD / 2 - .006); f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.35 * t; }, { label: '턴테이블 뚜껑', sfx: 'open' });
  f.spot('inside', null, PX - .06, topY + PH + .026, z0, { part: p, maxH: .14, label: '레코드판 위', scale: .6 });
  f.spot('on', null, .24, y0 + .035 + .03, z0 + .06, { maxH: .4, label: '레코드장 칸', scale: .75 });
};

// 빨래 바구니 (1×1): a slotted sky basket of folded laundry; the big mustard towel on top lifts. A sleeve hangs out.
B.laundrybasket = (f, T) => {
  const bc = col(T, 'accent2'), tw = col(T, 'accent3'), sh = col(T, 'accent'), tk = [bc, tw, sh].join(',');
  const W = .62, D = .46, H = .34, t = .025, slot = shade(bc, -.18);
  f.add(mc('laundrybasket|' + tk, ({ add, tube }) => {
    for (const sz of [-1, 1]) add(G.box(W, H, t, .01), bc, 0, H / 2, sz * (D / 2 - t / 2));
    for (const sx of [-1, 1]) add(G.box(t, H, D - 2 * t, .01), bc, sx * (W / 2 - t / 2), H / 2, 0);
    add(G.pbox(W - 2 * t, .02, D - 2 * t), shade(bc, -.1), 0, .01, 0);
    for (const sz of [-1, 1]) add(G.box(W + .02, .03, t + .02, .01), WHITE, 0, H, sz * (D / 2 - t / 2));
    for (const sx of [-1, 1]) add(G.box(t + .02, .03, D + .02, .01), WHITE, sx * (W / 2 - t / 2), H, 0);
    for (const sz of [-1, 1]) for (let k = 0; k < 6; k++) add(G.box(.035, .17, .006, .002), slot, -.225 + k * .09, .16, sz * (D / 2 + .005));
    for (const sx of [-1, 1]) {
      add(G.box(.006, .045, .14, .005), slot, sx * (W / 2 + .005), H - .075, 0);
      for (let k = 0; k < 3; k++) add(G.box(.006, .14, .035, .002), slot, sx * (W / 2 + .005), .14, -.1 + k * .1);
    }
    // folded clothes, and a striped cloth hanging over the front rim
    add(G.box(.52, .06, .36, .025), WHITE, 0, .19, 0);
    add(G.box(.5, .025, .34, .01), sh, 0, .14, 0);
    add(G.box(.13, .014, .06, .005), CORAL, .16, H + .015 + .007, D / 2 - .015);
    add(G.box(.13, .16, .014, .005), CORAL, .16, H + .022 - .08, D / 2 + .022);
    add(G.box(.13, .1, .014, .005), CORAL, .16, H - .04, D / 2 - .04);
    for (const y of [.25, .28]) add(G.pbox(.13, .014, .004), WHITE, .16, y, D / 2 + .029 + .004);
  }));
  const tow = grp(mc('laundrybasket-towel|' + tk, ({ add }) => {
    add(G.box(.5, .1, .36, .04, 2), tw, 0, 0, 0);
    for (const z of [-.1, .1]) add(G.box(.51, .11, .035, .01), WHITE, 0, 0, z);
  }));
  put(tow, 0, .272, 0); f.add(tow);
  const p = f.part('lift', tow, (t, b) => { tow.position.y = b.p.y + .28 * t; tow.position.z = b.p.z - .1 * t; tow.rotation.x = -.45 * t; }, { label: '빨래 바구니 수건', sfx: 'lift' });
  f.spot('inside', null, 0, .222, .02, { part: p, maxH: .3, label: '빨래 바구니 안', scale: .8 });
};

// ═════════════════════════════════════════════ KITCHEN ═════════════════════════════════════════════
// 김치냉장고 (1×1, tall): a maroon stand-up kimchi fridge with a little display, three drawers (flower decals, a kimchi
// tub in each) and a rice cooker with a face on top. The middle drawer takes a padlock.
B.kimchifridge = (f, T) => {
  const body = col(T, 'kimchi'), front = shade(body, .06), ic = '#e2dbe2', tk = [body].join(',');
  const W = .72, D = .64, z0 = -.15, fz = z0 + D / 2, y0 = .05, H = 1.48, topY = y0 + H, back = z0 - D / 2, PH = .14;
  const bayTop = topY - PH, bayH = (bayTop - (y0 + .04)) / 3;
  f.add(mc('kimchifridge|' + tk, ({ add }) => {
    add(G.pbox(W - .06, y0, D - .06), shade(body, -.2), 0, y0 / 2, z0);
    add(G.box(W, H - PH, .04, .015), body, 0, y0 + (H - PH) / 2, back + .02);
    for (const sx of [-1, 1]) add(G.box(.04, H - PH, D, .015), body, sx * (W / 2 - .02), y0 + (H - PH) / 2, z0);
    add(G.box(W, .04, D, .015), body, 0, y0 + .02, z0);
    for (let i = 1; i < 3; i++) add(G.pbox(W - .06, .02, D - .04), body, 0, y0 + .04 + i * bayH, z0);
    add(G.pbox(W - .08, bayTop - y0 - .06, .01), '#4a2730', 0, (bayTop + y0) / 2, back + .045);
    add(G.box(W, PH, D, .03), body, 0, bayTop + PH / 2, z0);
    // rice cooker with a face
    const rx = -.12, rz = z0 - .02;
    add(G.cyl(.12, .13, .15, 22), CREAM, rx, topY + .075, rz);
    add(G.dome(.122, 22, 6), TOMATO, rx, topY + .15, rz, 0, 0, 0, [1, .36, 1]);
    add(G.tor(.05, .012, PI, 4, 10), DARK, rx, topY + .19, rz);
    add(G.box(.07, .03, .02, .008), SKY, rx, topY + .045, rz + .127 + .006);
    face(add, rx, topY + .1, rz + .124 + .004, .7);
    for (const [dx, dy, r] of [[.04, .24, .022], [.055, .275, .016]]) add(G.sph(r, 8, 6), WHITE, rx + dx, topY + dy, rz - .03);
    // a little plant
    add(G.cyl(.05, .04, .08, 12), MUSTARD, .2, topY + .04, z0 - .1);
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; add(G.sph(.04, 8, 5), i % 2 ? LEAF : LEAF3, .2 + Math.cos(a) * .03, topY + .11 + (i % 2) * .02, z0 - .1 + Math.sin(a) * .03, 0, -a, .5, [1.3, .5, .7]); }
  }));
  f.add(mg('kimchifridge-labels', atlasMat(), ({ add }) => {
    add(quadGeo(.26, .087, RG.disp), -.13, bayTop + PH / 2, fz + .005);
    add(quadGeo(.16, .04, LB(0)), .19, bayTop + PH / 2, fz + .005);
  }));
  const tubLid = [TOMATO, MINT, MUSTARD];
  for (let i = 0; i < 3; i++) {   // i = 0 is the top drawer
    const cy = bayTop - bayH * (i + .5), fl = -bayH / 2 + .05, BD = .5, bh = .15;
    const dv = new THREE.Group(); put(dv, 0, cy, fz + .004);
    dv.add(mc('kimchifridge-drawer' + i + '|' + tk, ({ add }) => {
      add(G.box(W - .03, bayH - .02, .04, .02), front, 0, 0, 0);
      add(G.box(W - .16, .035, .035, .015), CREAM, 0, bayH / 2 - .055, .03);
      flower(add, .22, -.12, .02 + .006, 1.3, WHITE, BLUSH);
      flower(add, .27, -.07, .02 + .006, .9, BLUSH, WHITE);
      add(G.sph(.02, 8, 6), LEAF, .19, -.08, .02 + .006, 0, 0, .6, [1.4, .6, .3]);
      add(G.pbox(W - .1, .012, BD), ic, 0, fl, -BD / 2 - .02);
      for (const sx of [-1, 1]) add(G.pbox(.012, bh, BD), ic, sx * (W - .1) / 2, fl + bh / 2, -BD / 2 - .02);
      add(G.pbox(W - .1, bh, .012), ic, 0, fl + bh / 2, -BD - .02);
      add(G.box(.26, .16, .22, .02), '#f3f0ea', -.15, fl + .006 + .08, -BD + .1);
      add(G.box(.27, .03, .23, .012), tubLid[i], -.15, fl + .006 + .175, -BD + .1);
    }));
    f.add(dv);
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .42 * t; }, { label: `김치냉장고 ${i + 1}칸`, sfx: 'drawer', dur: .26 });
    if (i === 1) { p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: -.2, y: -.04, z: .055, parent: dv }; }
    f.spot('inside', dv, .13, fl + .006, -.16, { part: p, maxH: .3, label: `김치냉장고 ${i + 1}칸`, scale: .7 });
  }
};

// 양문 냉장고 (1×1, tall): a white side-by-side fridge covered in magnets, photos, a calendar and a kid's drawing, a cereal
// box on top. Both doors open together (a code lock between them): freezer on the left, fridge on the right.
B.bigfridge = (f, T) => {
  const W = .9, D = .68, z0 = -.15, fz = z0 + D / 2, y0 = .04, H = 1.9, topY = y0 + H, back = z0 - D / 2;
  const body = '#f4f7fb', inner = '#e8f2fa', shelfC = '#cfe6f5', doorC = '#fbfcfe', fl0 = y0 + .046;
  f.add(mc('bigfridge', ({ add }) => {
    add(G.pbox(W - .06, y0, D - .06), STEEL2, 0, y0 / 2, z0);
    add(G.box(W, H, .04, .015), body, 0, y0 + H / 2, back + .02);
    for (const sx of [-1, 1]) add(G.box(.04, H, D, .015), body, sx * (W / 2 - .02), y0 + H / 2, z0);
    add(G.box(W, .04, D, .015), body, 0, topY - .02, z0);
    add(G.box(W, .04, D, .015), body, 0, y0 + .02, z0);
    add(G.pbox(.03, H - .08, D - .05), body, 0, y0 + H / 2, back + .05 + (D - .05) / 2);
    add(G.pbox(W - .08, H - .08, .01), inner, 0, y0 + H / 2, back + .045);
    add(G.pbox(W - .08, .006, D - .06), inner, 0, y0 + .043, z0 + .01);
    for (const y of [.62, 1.17]) add(G.pbox(.38, .016, D - .1), shelfC, .2125, y, z0);
    for (const y of [.55, 1.0, 1.45]) add(G.pbox(.38, .016, D - .1), shelfC, -.2125, y, z0);
    // fridge side: milk, jam, juice; freezer side: an ice-cream tub, dumplings, an ice tray
    const mz = z0 - .17;
    add(G.box(.09, .18, .09, .01), WHITE, .32, fl0 + .09, mz); add(G.box(.098, .05, .098, .006), SKY, .32, fl0 + .06, mz);
    add(G.cyl(.06, .06, .09, 3), WHITE, .32, fl0 + .198, mz, -HP, 0, 0, [1, 1, .6]);
    add(G.cyl(.05, .05, .1, 12), HONEY, .3, .628 + .05, mz); add(G.cyl(.054, .054, .025, 12), TOMATO, .3, .628 + .1125, mz);
    add(G.cyl(.04, .04, .2, 12), ORANGE, .28, 1.178 + .1, mz); add(G.cyl(.02, .02, .04, 8), WHITE, .28, 1.178 + .22, mz);
    add(G.cyl(.07, .065, .12, 16), WHITE, -.3, fl0 + .06, mz); add(G.cyl(.074, .074, .02, 16), BLUSH, -.3, fl0 + .13, mz);
    add(G.sph(.1, 12, 8), WHITE, -.15, fl0 + .05, z0 - .02, 0, .3, 0, [1.2, .45, .9]);
    add(G.box(.26, .04, .12, .01), SKY2, -.2, 1.458 + .02, z0 - .12);
    // on top: a cereal box, a honey jar, a little plant
    add(G.box(.24, .32, .08, .012), MUSTARD, -.2, topY + .16, z0 - .08);
    add(G.cyl(.05, .05, .1, 12), HONEY, .05, topY + .05, z0 - .12); add(G.cyl(.054, .054, .025, 12), WHITE, .05, topY + .1125, z0 - .12);
    add(G.cyl(.055, .045, .09, 12), col(T, 'pot'), .28, topY + .045, z0 - .1);
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; add(G.sph(.045, 8, 5), i % 2 ? LEAF : LEAF3, .28 + Math.cos(a) * .035, topY + .12 + (i % 2) * .02, z0 - .1 + Math.sin(a) * .035, 0, -a, .5, [1.3, .5, .7]); }
  }));
  f.add(mg('bigfridge-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.22, .293, RG.cereal), -.2, topY + .16, z0 - .04 + .005);
    add(quadGeo(.1, .025, LB(7)), -.15, fl0 + .05, z0 - .02 + .09 + .006, -.2, .3, 0);
  }));
  const DW = W / 2 - .008, DH = H - .02;
  const door = (sx, key, deco, prints) => {   // sx = -1: the left door (hinge on the left edge), +1: the right one
    const pv = new THREE.Group(); put(pv, sx * (W / 2 - .002), y0 + H / 2, fz + .034);
    const cx = -sx * DW / 2, hx = -sx * (DW - .05);
    pv.add(mc('bigfridge-door' + key, ({ add }) => {
      add(G.box(DW, DH, .06, .03), doorC, cx, 0, 0);
      add(G.box(.025, .5, .03, .012), STEEL, hx, .15, .05);
      for (const dy of [-.08, .38]) add(G.box(.025, .03, .03, .008), STEEL, hx, dy, .035);
      for (const y of [-.5, -.1, .3]) add(G.box(DW - .08, .1, .08, .01), shelfC, cx, y, -.07);
      add(G.cyl(.03, .03, .16, 10), [MINT, CORAL][(sx + 1) / 2], cx - .08, -.36, -.07);
      deco(add, cx);
    }));
    pv.add(mg('bigfridge-doorprints' + key, atlasMat(), ({ add }) => prints(add, cx)));
    f.add(pv); return pv;
  };
  const Z = .03;   // the door's front face
  const L = door(-1, 'L', (add, cx) => {
    const bx = cx - .1, by = .45;   // bear-face magnet
    add(G.sph(.055, 14, 10), BROWN, bx, by, Z + .02, 0, 0, 0, [1, .92, .3]);
    for (const k of [-1, 1]) { add(G.sph(.022, 8, 6), BROWN, bx + k * .042, by + .046, Z + .015, 0, 0, 0, [1, 1, .3]); add(G.sph(.008, 6, 4), INK, bx + k * .021, by + .013, Z + .037, 0, 0, 0, [1, 1, .5]); }
    add(G.sph(.022, 8, 6), '#f6dcb8', bx, by - .016, Z + .036, 0, 0, 0, [1.2, .9, .3]);
    add(G.sph(.007, 6, 4), INK, bx, by - .01, Z + .043, 0, 0, 0, [1, .8, .5]);
    add(G.ext(starShape(.045, .02), .012, 0, 2), MUSTARD, cx + .09, .66, Z + .004);
    const pz = new THREE.Shape(); pz.moveTo(-.052, .04); pz.lineTo(.052, .04); pz.lineTo(0, -.065); pz.lineTo(-.052, .04);
    add(G.ext(pz, .012, 0, 2), HONEY, cx - .1, -.07, Z + .004);
    add(G.cap(.011, .09, 2, 6), ORANGE, cx - .1, -.03, Z + .014, 0, 0, HP);
    for (const [dx, dy] of [[-.016, .005], [.018, 0], [0, -.03]]) add(G.sph(.011, 6, 4), TOMATO, cx - .1 + dx, -.07 + dy, Z + .021, 0, 0, 0, [1, 1, .4]);
    add(G.cyl(.016, .016, .012, 10), TOMATO, cx + .04, .265, Z + .016, HP, 0, 0);
    flower(add, cx - .06, -.36, Z + .006, 2.2, WHITE, TOMATO);
  }, (add, cx) => add(quadGeo(.14, .157, PHOTO(2)), cx + .04, .18, Z + .006, 0, 0, .06));
  const R = door(1, 'R', (add, cx) => {
    add(G.cyl(.016, .016, .012, 10), MINT, cx - .02, .535, Z + .016, HP, 0, 0);
    add(G.cyl(.016, .016, .012, 10), MUSTARD, cx + .04, .182, Z + .016, HP, 0, 0);
    add(G.ext(heartShape(.09), .014, 0, 6), TOMATO, cx - .08, -.26, Z + .004);
    add(G.cyl(.014, .014, .012, 10), SKY, cx + .09, -.13, Z + .016, HP, 0, 0);
    add(G.sph(.04, 12, 8), ORANGE, cx - .08, -.45, Z + .014, 0, 0, 0, [1, .9, .3]);   // a cat magnet
    for (const k of [-1, 1]) { add(G.cone(.016, .03, 6), ORANGE, cx - .08 + k * .026, -.414, Z + .012, 0, 0, -k * .3, [1, 1, .4]); add(G.sph(.006, 5, 4), INK, cx - .08 + k * .014, -.448, Z + .027, 0, 0, 0, [1, 1, .5]); }
  }, (add, cx) => {
    add(quadGeo(.19, .225, RG.cal), cx, .42, Z + .006);
    add(quadGeo(.2, .16, RG.draw), cx + .03, .1, Z + .006, 0, 0, -.05);
    add(quadGeo(.12, .135, PHOTO(1)), cx + .09, -.2, Z + .006, 0, 0, .08);
  });
  const p = f.part('door', [L, R], t => { L.rotation.y = -1.95 * t; R.rotation.y = 1.95 * t; }, { label: '양문 냉장고', sfx: 'open', dur: .32 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: 0, y: .7, z: fz + .1 };
  f.spot('inside', null, .2, fl0, z0 + .08, { part: p, maxH: .45, label: '냉장실 아래칸', scale: .8 });
  f.spot('inside', null, .2, .628, z0 + .08, { part: p, maxH: .45, label: '냉장실 가운데칸', scale: .8 });
  f.spot('inside', null, -.2, 1.008, z0 + .08, { part: p, maxH: .4, label: '냉동실', scale: .75 });
  f.spot('on', null, .18, topY, z0 + .1, { maxH: .45, label: '냉장고 위', scale: .75 });
};

// 빨래건조대 (1×1): a folding drying rack with three T-shirts on hangers (sky stripe, a bear print, a mustard star) and a
// sage towel over the low rail — the gap behind the laundry hides things.
B.dryrack = (f, T) => {
  const s1 = col(T, 'accent2'), tow = col(T, 'accent'), feet = col(T, 'accent3'), tk = [s1, tow, feet].join(',');
  const metal = '#e3e8f0', X = .42, TY = 1.2, LZ = .26, top = TY - .06;
  f.add(mc('dryrack|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) { tube([sx * X, .02, sz * LZ], [sx * X, TY, 0], .016, metal, 6); add(G.sph(.026, 8, 6), feet, sx * X, .02, sz * LZ, 0, 0, 0, [1, .7, 1]); }
      tube([sx * X, .5, -LZ * .58], [sx * X, .5, LZ * .58], .012, metal, 6);
      add(G.sph(.026, 8, 6), metal, sx * X, TY, 0);
    }
    tube([-X - .04, TY, 0], [X + .04, TY, 0], .016, metal, 8);
    for (const sz of [-1, 1]) tube([-X, .5, sz * .15], [X, .5, sz * .15], .012, metal, 6);
    // shirts on hangers (each one a little further forward so overlapping sleeves never share a plane)
    const sh = G.ext(shirtShape(), .02, 0, 4);
    [[-.29, -.028, s1], [0, 0, WHITE], [.29, .028, TOMATO]].forEach(([x, z, c]) => {
      add(G.tor(.024, .005, PI * 1.3, 3, 10), STEEL2, x, TY, 0, 0, HP, -.4);
      tube([x, TY - .024, 0], [x, top + .005, z], .005, STEEL2, 4);
      add(sh, c, x, top, z - .01);
    });
    const fz = .01 + .004;
    add(G.pbox(.26, .03, .004), WHITE, -.29, top - .2, -.028 + fz);
    add(G.pbox(.26, .012, .004), WHITE, -.29, top - .25, -.028 + fz);
    add(G.sph(.055, 12, 8), BROWN, 0, top - .25, fz + .003, 0, 0, 0, [1, .9, .12]);
    for (const s of [-1, 1]) { add(G.sph(.022, 8, 6), BROWN, s * .045, top - .195, fz + .002, 0, 0, 0, [1, 1, .15]); add(G.sph(.006, 5, 4), INK, s * .02, top - .24, fz + .012, 0, 0, 0, [1, 1, .4]); }
    add(G.sph(.022, 8, 6), '#f6dcb8', 0, top - .265, fz + .009, 0, 0, 0, [1.2, .9, .2]);
    add(G.ext(starShape(.055, .024), .006, 0, 2), MUSTARD, .29, top - .22, .028 + .01 + .004);
    // towel over the front low rail
    add(G.cyl(.024, .024, .5, 10), tow, .06, .5, .15, 0, 0, HP);
    add(G.box(.5, .24, .014, .006), tow, .06, .38, .174);
    add(G.box(.5, .16, .014, .006), tow, .06, .42, .126);
    for (const y of [.3, .34]) add(G.pbox(.5, .022, .004), WHITE, .06, y, .181 + .004);
  }));
  f.spot('behind', null, .08, 0, -.12, { maxH: .4, label: '빨래 뒤', scale: .85 });
};

// ═════════════════════════════════════════════ WALL PIECES ═════════════════════════════════════════════
// 베란다 창 (wall, span 2): a tall sliding balcony window onto a sunny apartment view, a glass wind chime, cream curtains (the
// right one draws back) and a wooden sill with a couple of little pots.
B.balconywin = (f, T) => {
  const frame = '#fbf7f0', wood = col(T, 'wood'), woodD = col(T, 'woodD'), curt = col(T, 'curtain'), tie = col(T, 'accent3'), pc = col(T, 'pot');
  const tk = [wood, woodD, curt, tie, pc].join(','), sill = .27, yt = 2.22, ROD = 2.36, CZ = .2;
  f.add(mg('balconywin-view', mat('#ffffff', { map: viewTex(), emissive: '#ffffff', ei: .14 }), ({ add }) => add(new THREE.PlaneGeometry(1.76, 1.94), 0, 1.275, .014)));
  const sash = (x0, x1) => { const s = rrShape(x0, sill + .04, x1 - x0, yt - sill - .04, .02); s.holes.push(rrShape(x0 + .045, sill + .085, x1 - x0 - .09, yt - sill - .13, .012)); return G.ext(s, .03, 0, 3); };
  f.add(mc('balconywin|' + tk, ({ add, tube }) => {
    add(G.box(1.96, .05, .3, .015), wood, 0, sill - .025, .15);
    for (const sx of [-1, 1]) add(G.box(.06, 2.01, .1, .012), frame, sx * .91, 1.275, .05);
    add(G.box(1.88, .04, .1, .01), frame, 0, sill + .02, .05);
    add(G.box(1.88, .06, .1, .012), frame, 0, yt + .03, .05);
    add(sash(-.88, .04), frame, 0, 0, .062);
    add(sash(-.04, .88), frame, 0, 0, .022);
    add(G.box(.02, .14, .02, .006), STEEL2, .015, 1.2, .102);
    add(G.box(.02, .14, .02, .006), STEEL2, -.015, 1.2, .062);
    for (const [x, z, w] of [[-.5, .085, .035], [-.4, .085, .018], [.42, .045, .035], [.52, .045, .018]]) add(G.pbox(w, .42, .004), '#f2fbff', x, 1.45, z, 0, 0, -.55);
    // curtain rod + the tied-back left curtain
    tube([-1.0, ROD, CZ], [1.0, ROD, CZ], .016, woodD, 8);
    for (const sx of [-1, 1]) { add(G.sph(.03, 10, 8), woodD, sx * 1.01, ROD, CZ); add(G.box(.03, .03, .2, .008), woodD, sx * .93, ROD, .1); }
    add(G.box(.26, .95, .06, .03), curt, -.86, 1.86, CZ);
    add(G.box(.32, .8, .06, .03), curt, -.86, .72, CZ);
    add(G.box(.2, .25, .07, .03), curt, -.86, 1.24, CZ);
    for (const dx of [-.07, 0, .07]) add(G.pbox(.02, .9, .07), shade(curt, -.06), -.86 + dx, 1.86, CZ);
    for (const dx of [-.09, 0, .09]) add(G.pbox(.02, .76, .07), shade(curt, -.06), -.86 + dx, .72, CZ);
    add(G.box(.22, .05, .09, .02), tie, -.86, 1.12, CZ);
    // wind chime (풍경)
    const wx = -.36, wz = .13;
    tube([wx, yt, wz], [wx, 2.0, wz], .003, WHITE, 4);
    add(G.dome(.055, 14, 5), SKY2, wx, 1.95, wz, 0, 0, 0, [1, 1.1, 1]);
    add(G.sph(.012, 6, 4), ORANGE, wx, 1.985, wz + .051, 0, 0, 0, [1.4, 1, .5]);
    tube([wx, 1.95, wz], [wx, 1.86, wz], .003, WHITE, 4);
    add(G.pbox(.045, .15, .004), CREAM, wx, 1.79, wz);
    add(G.pbox(.045, .02, .006), TOMATO, wx, 1.84, wz);
    // little pots on the sill
    add(G.cyl(.06, .05, .1, 12), pc, -.62, sill + .05, .15);
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; add(G.sph(.045, 8, 5), i % 2 ? LEAF : LEAF3, -.62 + Math.cos(a) * .035, sill + .13 + (i % 2) * .02, .15 + Math.sin(a) * .035, 0, -a, .5, [1.3, .5, .7]); }
    add(G.cyl(.05, .045, .08, 12), WHITE, -.44, sill + .04, .16);
    add(G.cap(.03, .06, 2, 8), LEAF2, -.44, sill + .12, .16);
    add(G.sph(.014, 6, 5), BLUSH, -.44, sill + .175, .16);
  }));
  // the right curtain: draws back toward the right edge
  const RW = .64, RH = ROD - sill - .04;
  const cr = new THREE.Group(); put(cr, .98, ROD - .02, CZ);
  cr.add(mc('balconywin-curtain|' + curt, ({ add }) => {
    add(G.box(RW, RH, .05, .025), curt, -RW / 2, -RH / 2, 0);
    for (let k = 0; k < 4; k++) add(G.pbox(.022, RH - .04, .06), shade(curt, -.06), -.08 - k * .15, -RH / 2, 0);
    for (let k = 0; k < 6; k++) add(G.tor(.022, .006, PI * 2, 3, 10), STEEL2, -.05 - k * .11, .02, 0, 0, 0, 0);
  }));
  f.add(cr);
  const p = f.part('curtain', cr, (t, b) => { cr.scale.x = 1 - .62 * t; }, { label: '커튼', sfx: 'swish', dur: .3 });
  f.spot('on', null, -.12, sill, .15, { maxH: .45, label: '창틀 위', scale: .8 });
  f.spot('inside', null, .58, sill, .1, { part: p, maxH: .45, label: '커튼 뒤 창틀', scale: .8 });
};

// 고양이 벽시계 (wall, span 1): a round wooden cat clock with ears, a sleepy face on the dial and a curly tail; it swings aside on
// its nail (it stays flat on the wall) to show what was tucked behind it.
B.catclock = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [wood, woodD].join(',');
  const R = .24, PY = 2.2, cy = -.3;
  f.add(mc('catclock-hook', ({ add }) => { add(G.cyl(.012, .012, .03, 8), STEEL2, 0, PY + .012, .015, HP, 0, 0); add(G.sph(.016, 8, 6), STEEL2, 0, PY + .012, .032); }));
  const pv = new THREE.Group(); put(pv, 0, PY, .006);
  pv.add(mc('catclock|' + tk, ({ add, tube }) => {
    add(G.cyl(R, R, .05, 32), wood, 0, cy, .03, HP, 0, 0);
    for (const sx of [-1, 1]) {
      add(G.ext(earShape(.16, .15, .03), .045, .006, 4), wood, sx * .15, cy + .15, .008, 0, 0, -sx * .45);
      add(G.ext(earShape(.08, .075, .015), .008, 0, 4), BLUSH, sx * .152, cy + .16, .064, 0, 0, -sx * .45);
    }
    const fz = .055 + .012;
    add(G.cyl(R - .035, R - .035, .012, 32), CREAM, 0, cy, .055 + .006, HP, 0, 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, big = i % 3 === 0; add(G.sph(big ? .014 : .009, 8, 6), big ? MUSTARD : woodD, Math.sin(a) * .165, cy + Math.cos(a) * .165, fz + .004, 0, 0, 0, [1, 1, .45]); }
    for (const sx of [-1, 1]) {
      add(G.sph(.016, 8, 6), INK, sx * .07, cy - .05, fz + .004, 0, 0, 0, [1.2, .5, .4]);
      add(G.sph(.02, 8, 6), BLUSH, sx * .105, cy - .085, fz + .003, 0, 0, 0, [1, .6, .3]);
      for (const k of [-1, 1]) add(G.pbox(.06, .006, .004), woodD, sx * .14, cy - .1 + k * .016, fz + .004, 0, 0, sx * k * .15);
    }
    add(G.sph(.012, 6, 5), CORAL, 0, cy - .085, fz + .004, 0, 0, 0, [1.3, .9, .5]);
    add(G.box(.014, .1, .006, .003), INK, -.035, cy + .03, fz + .009, 0, 0, .9);
    add(G.box(.012, .14, .006, .003), INK, .045, cy + .05, fz + .016, 0, 0, -.7);
    add(G.cyl(.016, .016, .02, 12), GOLD, 0, cy, fz + .012, HP, 0, 0);
    add(G.tor(.06, .018, PI * 1.2, 5, 14), wood, .06, cy - R - .045, .03, 0, 0, -.3);
    add(G.sph(.022, 8, 6), woodD, .06 + .06 * Math.cos(PI * 1.2 - .3), cy - R - .045 + .06 * Math.sin(PI * 1.2 - .3), .03);
  }));
  f.add(pv);
  const p = f.part('flip', pv, t => { pv.rotation.z = 1.45 * t; }, { label: '고양이 시계', sfx: 'lift', dur: .34 });
  f.spot('inside', null, 0, PY + cy, .012, { part: p, maxH: .09, label: '시계 뒤', wallFace: true });
};

// 선반 (wall, span 1): two honey wall shelves — a daruma, a family photo and a Fuji photo, a trailing pothos.
B.wallshelf2 = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), pc = col(T, 'pot'), tk = [wood, woodD, pc].join(',');
  const W = .86, D = .24, S = [1.32, 1.74], th = .04, dz = .12;
  const frames = [[-.02, S[1], WHITE, PHOTO(3)], [-.28, S[0], wood, PHOTO(0)]];
  const fM = (x, y) => xf(x, y + .1, .1, -.12, 0, 0);
  f.add(mc('wallshelf2|' + tk, ({ add, addM, tube }) => {
    for (const y of S) {
      add(G.box(W, th, D, .012), wood, 0, y - th / 2, D / 2 + .004);
      for (const sx of [-1, 1]) add(G.box(.035, .12, .16, .01), woodD, sx * .3, y - th - .06, .085);
    }
    for (const [x, y, c] of frames) { addM(G.box(.15, .19, .02, .008), fM(x, y), c); addM(G.box(.04, .12, .015, .004), fM(x, y).multiply(xf(0, -.03, -.03, .5)), woodD); }
    // daruma
    const dx = -.29, dy = S[1];
    add(G.sph(.085, 16, 12), TOMATO, dx, dy + .088, dz, 0, 0, 0, [1, 1.08, .95]);
    add(G.sph(.05, 12, 8), CREAM, dx, dy + .11, dz + .066, 0, 0, 0, [1, .85, .45]);
    add(G.sph(.011, 8, 6), INK, dx - .018, dy + .115, dz + .088, 0, 0, 0, [1, 1, .4]);
    add(G.tor(.01, .003, PI * 2, 3, 10), INK, dx + .018, dy + .115, dz + .088);
    for (const s of [-1, 1]) add(G.pbox(.022, .005, .004), INK, dx + s * .018, dy + .135, dz + .087, 0, 0, s * .2);
    add(G.tor(.016, .004, PI, 3, 8), INK, dx, dy + .09, dz + .088, 0, 0, PI);
    for (const s of [-1, 1]) add(G.sph(.016, 8, 6), GOLD, dx + s * .03, dy + .045, dz + .078, 0, s * .3, 0, [1, .6, .4]);
    // a little cactus on the top shelf
    add(G.cyl(.045, .038, .07, 12), SKY, .1, dy + .035, dz);
    add(G.cap(.026, .05, 2, 8), LEAF2, .1, dy + .11, dz);
    add(G.sph(.012, 6, 5), BLUSH, .1, dy + .155, dz);
    // pothos on the lower shelf, trailing over the edge
    const px = .3, py = S[0];
    add(G.cyl(.06, .05, .1, 12), pc, px, py + .05, dz);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; add(G.sph(.042, 8, 5), i % 2 ? LEAF : LEAF3, px + Math.cos(a) * .04, py + .13 + (i % 2) * .02, dz + Math.sin(a) * .04, 0, -a, .5, [1.3, .5, .7]); }
    tube([px + .04, py + .1, dz + .05], [px + .06, py - .05, D + .02], .006, LEAF2, 4);
    tube([px + .06, py - .05, D + .02], [px + .03, py - .24, D + .03], .006, LEAF2, 4);
    for (const [ox, oy] of [[.05, -.02], [.065, -.11], [.04, -.18], [.03, -.25]]) add(G.sph(.026, 8, 5), LEAF, px + ox, py + oy, D + .03, 0, 0, .6, [1.2, .7, .4]);
  }));
  f.add(mg('wallshelf2-photos', atlasMat(), ({ addM }) => { for (const [x, y, , rc] of frames) addM(quadGeo(.12, .135, rc), fM(x, y).multiply(xf(0, .01, .015))); }));
  f.spot('on', null, .27, S[1], .13, { maxH: .45, label: '선반 위칸', scale: .8 });
  f.spot('on', null, .0, S[0], .13, { maxH: .36, label: '선반 아래칸', scale: .8 });
};

export const APT_BUILDERS = B;

export const APT_INFO = {
  // 거실
  kotatsu: { w: 1, d: 1, name: '코타츠', price: 280, region: 'apt' },
  zabuton: { w: 1, d: 1, name: '방석', price: 120, region: 'apt' },
  robovac: { w: 1, d: 1, name: '로봇청소기', price: 240, region: 'apt' },
  parcel: { w: 1, d: 1, name: '택배상자', price: 120, region: 'apt' },
  tvlow: { w: 2, d: 1, name: '낮은 TV장', price: 340, region: 'apt' },
  floorlamp: { w: 1, d: 1, name: '스탠드 조명', price: 150, region: 'apt' },
  monstera: { w: 1, d: 1, name: '몬스테라 화분', price: 180, region: 'apt' },
  sofa2: { w: 2, d: 1, name: '2인 소파', price: 320, region: 'apt' },
  recordcab: { w: 1, d: 1, name: '레코드장', price: 260, region: 'apt' },
  laundrybasket: { w: 1, d: 1, name: '빨래 바구니', price: 130, region: 'apt' },
  dryrack: { w: 1, d: 1, name: '빨래건조대', price: 140, region: 'apt' },
  // 주방
  kimchifridge: { w: 1, d: 1, name: '김치냉장고', price: 420, region: 'apt' },
  bigfridge: { w: 1, d: 1, name: '양문 냉장고', price: 480, region: 'apt' },
  snackcart: { w: 1, d: 1, name: '간식 카트', price: 200, region: 'apt' },
  diningset: { w: 2, d: 1, name: '작은 식탁', price: 300, region: 'apt' },
  // 벽
  balconywin: { wall: true, span: 2, name: '베란다 창', price: 360, region: 'apt' },
  catclock: { wall: true, span: 1, name: '고양이 벽시계', price: 150, region: 'apt' },
  wallshelf2: { wall: true, span: 1, name: '선반', price: 130, region: 'apt' },
};

// Suggested room themes (stages.js THEMES shape). Extra keys these props read: sofa, quilt, kimchi, cloth, throw.
const BASE_T = { trim: '#ffffff', sheet: '#ffffff', pillow: '#fff3d6', rug2: '#ffffff', knob: '#ffd84a', top: '#fffaf0' };
export const APT_THEMES = {
  apt: { ...BASE_T, name: '우리 아파트 거실', friend: null, bg: ['#fff4e0', '#ffe4c0'], base: '#e9c08f', floorKind: 'planks', floor: '#f2cf9f', floor2: '#d6a874',
    wallKind: 'plain', wall: '#fff6e8', wall2: '#fff6e8', wainscot: '#f1dcbc', wallEdge: '#fffaf2',
    wood: '#eebf86', woodD: '#c98f58', body: '#fff7ea', accent: '#a9d8b8', accent2: '#8fd3f4', accent3: '#ffc23d', door: '#bfe6d2', fabric: '#fff0d8', fabric2: '#ffe3bf',
    curtain: '#fff3d6', rug: '#fff3df', rug2: '#ffd9a8', pot: '#f3a272', sofa: '#fff0d8', quilt: '#ff6b57', kimchi: '#9b3b4b', cloth: '#8fcf9a', throw: '#7fa8e8' },
  aptkitchen: { ...BASE_T, name: '우리 아파트 주방', friend: null, bg: ['#f1faf0', '#e0f2dc'], base: '#bcd9b0', floorKind: 'checker', floor: '#fffaf0', floor2: '#dcefd6',
    wallKind: 'tile', wall: '#fdfcf6', wall2: '#e3efdc', wainscot: '#d9ecd2', wallEdge: '#fffef9',
    wood: '#eebf86', woodD: '#c98f58', body: '#fffaf0', accent: '#9fd3a6', accent2: '#8fd3f4', accent3: '#ffc23d', door: '#cfe9d2', fabric: '#fff0d8', fabric2: '#ffe3bf',
    curtain: '#fff3d6', rug: '#e9f5e2', rug2: '#ffffff', pot: '#f3a272', sofa: '#fff0d8', quilt: '#ff6b57', kimchi: '#9b3b4b', cloth: '#ff8f73', throw: '#7fa8e8' },
};

// ═════════════════════════════════════════════ ITEMS ═════════════════════════════════════════════
// Same shape as items.js ITEMS: { name, h, flat?, build() } → Group, origin bottom centre.
//   Object.assign(ITEMS, APT_ITEMS)   (and push the keys into TARGET_POOL to make them stage targets)
export const APT_ITEMS = {
  // 리모컨: a chunky TV remote — red power button, a d-pad, a grid of buttons
  remote: { name: '리모컨', h: .05, flat: true, build() {
    const g = grp(), body = '#4a4560';
    g.add(mc('it-remote', ({ add }) => {
      add(G.box(.095, .032, .27, .02), body, 0, .016, 0);
      add(G.cyl(.017, .017, .008, 14), TOMATO, 0, .034, -.098);
      add(G.cyl(.032, .032, .008, 16), '#6c6782', 0, .034, -.035);
      add(G.cyl(.012, .012, .01, 12), WHITE, 0, .035, -.035);
      for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) add(G.box(.018, .008, .016, .004), r === 0 ? [MINT, MUSTARD, SKY][k] : '#d9d6e6', -.025 + k * .025, .034, .025 + r * .028);
    }));
    return g;
  } },
  // 토끼 슬리퍼: a pink bunny slipper with ears and a face on the toe
  slipper: { name: '토끼 슬리퍼', h: .17, build() {
    const g = grp(), pk = '#ffb3c6', pk2 = '#ff8fab';
    g.add(mc('it-slipper', ({ add }) => {
      add(G.cap(.07, .16, 3, 10), pk2, 0, .025, 0, HP, 0, 0, [1.15, 1, .35]);
      add(G.sph(.085, 14, 10), pk, 0, .05, .055, 0, 0, 0, [1, .62, 1.05]);
      add(G.sph(.075, 12, 8), pk, 0, .045, -.1, 0, 0, 0, [1, .42, .6]);
      for (const s of [-1, 1]) {
        add(G.cap(.025, .08, 2, 8), pk, s * .035, .12, .02, -.45, 0, -s * .22);
        add(G.cap(.012, .06, 2, 6), WHITE, s * .036, .124, .034, -.45, 0, -s * .22);
        add(G.sph(.012, 8, 6), INK, s * .033, .078, .128, 0, 0, 0, [1, 1.2, .5]);
        add(G.sph(.013, 8, 6), BLUSH, s * .058, .062, .124, 0, 0, 0, [1, .7, .4]);
      }
      add(G.sph(.01, 6, 5), '#ff7f9e', 0, .066, .139, 0, 0, 0, [1.2, .8, .5]);
    }));
    return g;
  } },
  // 귤: a tangerine with a leaf
  mandarin: { name: '귤', h: .19, build() {
    const g = grp(), o = '#ff9a1f';
    g.add(mc('it-mandarin2', ({ add }) => {
      add(G.sph(.1, 18, 12), o, 0, .083, 0, 0, 0, 0, [1, .82, 1]);
      add(G.sph(.02, 8, 6), '#e07a12', 0, .163, 0, 0, 0, 0, [1, .4, 1]);
      add(G.cyl(.007, .009, .026, 6), '#6b4a2a', 0, .175, 0);
      add(G.sph(.045, 8, 6), LEAF, .044, .178, 0, 0, .4, .45, [1.4, .3, .7]);
      add(G.sph(.025, 8, 6), '#ffd08a', -.044, .12, .072, 0, 0, 0, [1, .7, .35]);
    }));
    return g;
  } },
  // 게임 패드: a white controller with coloured buttons and two sticks
  gamepad: { name: '게임 패드', h: .07, flat: true, build() {
    // a lavender controller with a white D-pad, four coloured buttons and two dark sticks
    // (10/20 "야매한 것들": white on white, and 2.4k corners)
    const g = grp(), body = '#9b8cff', dk = '#3d3758';
    g.add(mc('it-gamepad2', ({ add }) => {
      add(G.box(.2, .04, .1, .03), body, 0, .026, -.01);
      for (const s of [-1, 1]) add(G.sph(.055, 7, 4), body, s * .09, .026, .03, 0, -s * .35, 0, [1, .5, 1.3]);
      add(G.pbox(.046, .012, .016), WHITE, -.065, .053, -.015); add(G.pbox(.016, .012, .046), WHITE, -.065, .053, -.015);
      [[.065, -.04, TOMATO], [.088, -.017, MUSTARD], [.065, .006, SKY], [.042, -.017, MINT]].forEach(([x, z, c]) => add(G.cyl(.012, .012, .012, 6), c, x, .053, z));
      for (const s of [-1, 1]) add(G.cyl(.016, .019, .026, 8), dk, s * .022, .061, .016);
    }));
    return g;
  } },
  // 티슈: a mustard tissue box with daisies, a tissue puffing out
  tissue: { name: '티슈', h: .2, build() {
    const g = grp();
    g.add(mc('it-tissue', ({ add }) => {
      add(G.box(.25, .12, .15, .02), MUSTARD, 0, .06, 0);
      add(G.box(.13, .006, .05, .003), '#fff4dc', 0, .122, 0);
      add(G.sph(.05, 12, 8), WHITE, 0, .148, 0, .3, 0, .2, [1.1, .9, .5]);
      add(G.cone(.03, .07, 6), WHITE, .012, .182, 0, 0, 0, -.3, [1, 1, .5]);
      for (const [x, y] of [[-.07, .06], [.06, .045]]) flower(add, x, y, .075 + .006, 1.1);
    }));
    return g;
  } },
};

// TV 퍼즐 (the apartment's "use the tool you found"): the low TV starts switched off — a dark glass screen — and only
// the remote turns it on; the cartoon channel then shows the password of a lock in the room. Added at play time by
// planStage on the stages that use it, never saved with a room.
export function tvPuzzle(f) {
  if (f.type !== 'tvlow') return null;
  const g = new THREE.Group(); g.position.set(0, .94, -.284); f.add(g);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.07, .605), new THREE.MeshBasicMaterial({ color: '#262a3d' }));
  const glint = new THREE.Mesh(new THREE.PlaneGeometry(.46, .045), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .2 }));
  glint.position.set(-.2, .15, .002); glint.rotation.z = .5;
  g.add(scr, glint);
  return {
    f, group: g, done: false,
    on(code) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 290;
      const x = c.getContext('2d'), font = getComputedStyle(document.body).getPropertyValue('--font') || 'sans-serif';
      const bg = x.createLinearGradient(0, 0, 0, 290); bg.addColorStop(0, '#8fd3f4'); bg.addColorStop(1, '#ffe0f0'); x.fillStyle = bg; x.fillRect(0, 0, 512, 290);
      x.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(60 + i * 85, 250 + (i % 2) * 18, 46, 0, 7); x.fill(); }
      x.fillStyle = '#ffd23f'; x.beginPath(); x.arc(452, 52, 30, 0, 7); x.fill();
      x.textAlign = 'center'; x.fillStyle = '#3a2453'; x.font = `bold 40px ${font}`; x.fillText(tr(code ? '오늘의 비밀번호' : '몽글 TV'), 256, 70);
      x.font = `bold 128px ${font}`; x.lineWidth = 14; x.strokeStyle = '#ffffff'; x.lineJoin = 'round';
      const t = code ? code.split('').join(' ') : '♪ ♫'; x.strokeText(t, 256, 200); x.fillStyle = '#ff5a7a'; x.fillText(t, 256, 200);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      scr.material = new THREE.MeshBasicMaterial({ map: tex }); glint.visible = false; this.done = true;
    },
  };
}

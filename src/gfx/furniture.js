// The core furniture every room and player home uses, with real hiding places.
// Each piece: origin = footprint centre on the floor, faces +z, back toward -z.
//   parts: openable pieces (drawer / door / lid / cushion / curtain / picture) with setOpen(t)
//   spots: places an item can sit. kind: inside (needs its part open) | under/behind (visible, but tucked away) | on (in plain sight)
// Everyday look (same toy-set rules as apt-props.js / oneroom-props.js): chunky silhouettes, flat matte colours, detail
// carried by canvas textures mapped in world units (wood grain, patchwork, knit, curtains, louvres, rug) and one shared
// print atlas (TV game, painting, labels, dials). Static decor is merged into ONE vertex-coloured mesh per piece (mc);
// every moving part is its own mesh / group. Decals / panels sit >= .006 in front of the face they are on.
// Wood is a warm honey taken from the theme's wood but always kept clear of the floor's tone (woods()).
// Optional theme keys (fallbacks in brackets): fwood / fwoodD (derived from wood + floor), trim (#ffffff).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { bakeStatic } from './bake.js';
import { rbox, sph, tor, put, grp, mat, mesh, geo, extrude, starShape, heartShape, canvasTex, texCache, roundRect, shade, STYLE } from './kit.js';
import { rng } from '../util.js';
import { tr } from '../i18n.js';

export class Furn {
  constructor(type, w, d, wall = false) {
    this.type = type; this.w = w; this.d = d; this.wall = wall;
    this.group = new THREE.Group(); this.parts = []; this.spots = []; this.lockAt = null;
  }
  add(o) { this.group.add(o); return o; }
  part(kind, pivots, apply, o = {}) {
    if (!Array.isArray(pivots)) pivots = [pivots];
    // reach: how far it may open (0..1), set by the room so a door never swings into the bed next to it
    const p = { kind, pivots, apply, t: 0, reach: 1, furn: this, spots: [], lock: null, label: o.label || '', sfx: o.sfx || 'open', dur: o.dur || .3, busy: false };
    pivots.forEach(pv => pv.userData.base = { p: pv.position.clone(), r: pv.rotation.clone(), s: pv.scale.clone() });
    p.setOpen = t => { p.t = t; p.apply(t * p.reach, ...pivots.map(pv => pv.userData.base)); };
    this.parts.push(p);
    return p;
  }
  spot(kind, parent, x, y, z, o = {}) {
    const a = new THREE.Object3D(); a.position.set(x, y, z); (parent || this.group).add(a);
    const s = { kind, anchor: a, part: o.part || null, maxH: o.maxH ?? .45, label: o.label || '', furn: this, item: null, idx: this.spots.length, wallFace: !!o.wallFace, scale: o.scale ?? 1 };
    if (s.part) s.part.spots.push(s);
    this.spots.push(s);
    return s;
  }
  finalize() {
    this.group.traverse(o => { if (o.isMesh) o.userData.furn = this; });
    for (const p of this.parts) p.pivots.forEach(pv => pv.traverse(o => { if (o.isMesh) o.userData.part = p; }));
    this.group.userData.furn = this;
    return this;
  }
  setLock(part, kind, code = null) {
    part.lock = { kind, code };
    const L = this.lockAt; if (!L) return;
    const g = new THREE.Group();
    if (kind === 'pad') {
      g.add(put(tor(.05, .016, '#c9cfe0', { metal: .6, rough: .3 }, Math.PI, 8, 16), 0, .07, 0));
      g.add(put(rbox(.13, .11, .05, '#ffc93c', .025, { metal: .5, rough: .3 }), 0, 0, 0));
      g.add(put(sph(.016, '#5a3d2e', null, 8, 6), 0, -.005, .028));
    } else if (kind === 'color') {
      // three empty colour sockets; the clue card says which colours, in order
      g.add(put(rbox(.24, .12, .04, '#3b3f5c', .03), 0, 0, 0));
      part.sockets = [];
      for (let i = 0; i < 3; i++) { const sk = put(sph(.028, '#e9e4f2', null, 12, 10), -.07 + i * .07, 0, .03); g.add(sk); part.sockets.push(sk); }
    } else if (kind === 'lever') {
      // chained shut until a lever somewhere in the room is pulled
      g.add(put(rbox(.2, .1, .04, '#6f7fae', .03), 0, 0, 0));
      g.add(put(tor(.035, .012, '#c9cfe0', null), -.05, 0, .03, 0, 0, Math.PI / 2)); g.add(put(tor(.035, .012, '#c9cfe0', null), .0, 0, .03)); g.add(put(tor(.035, .012, '#c9cfe0', null), .05, 0, .03, 0, 0, Math.PI / 2));
      g.add(put(extrude('star-s', starShape(.04, .018), .01, '#ffe14d'), 0, .075, .02));
    } else {
      g.add(put(rbox(.2, .13, .03, '#3b3f5c', .02), 0, 0, 0));
      for (let i = 0; i < 3; i++) g.add(put(rbox(.045, .07, .02, '#9ff0c8', .01, { emissive: '#4bd18a', ei: .5 }), -.06 + i * .06, 0, .02));
    }
    put(g, L.x, L.y, L.z);
    g.traverse(o => { if (o.isMesh) { o.userData.part = part; o.userData.furn = this; } });
    (L.parent || this.group).add(g);
    part.lockMesh = g;
  }
}

const PI = Math.PI, HP = PI / 2, DS = THREE.DoubleSide;

// ── palette ─────────────────────────────────────────────────────────────────────────────────────────────────────
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', SKY = '#8fd3f4', SKY2 = '#cdeefc', HONEY = '#ffcf5c', MUSTARD = '#ffc23d',
  TOMATO = '#ff6b57', CORAL = '#ff9f8a', MINT = '#7fd6c0', BLUSH = '#ff9fb5', GOLD = '#ffc93c', LEAF = '#6cc46a', LEAF2 = '#4ea85a',
  LEAF3 = '#8fd47a', ORANGE = '#ffab4c', STEEL = '#c9cfe0', STEEL2 = '#a9b2c8', DARK = '#5b5672', CHAR = '#3b3550', KRAFT = '#e8bb82',
  KRAFT2 = '#cf9a5e', TAPE = '#f6e2b0', SOIL = '#8a5a3c', LILAC = '#b9a6ff', BROWN = '#c98a52', NAVY = '#4f6db0', BRASS = '#e8b84a';

// Furniture wood: the theme's wood, kept clearly apart from a plank floor of the same hue (lighter on a dark floor,
// a richer honey on a pale one). HSL in sRGB, the way the palette is picked.
const WOODS = new Map(), SRGB = THREE.SRGBColorSpace;
function woods(T) {
  const k = (T.fwood || '') + '|' + (T.fwoodD || '') + '|' + T.wood + '|' + T.floor;
  if (WOODS.has(k)) return WOODS.get(k);
  let out;
  if (T.fwood) out = { wood: T.fwood, woodD: T.fwoodD || shade(T.fwood, -.18) };
  else {
    const h = {}, fh = {};
    new THREE.Color(T.wood || '#f0cba0').getHSL(h, SRGB); new THREE.Color(T.floor || '#f4d4ad').getHSL(fh, SRGB);
    let l = Math.min(h.l, .8);
    const s = Math.min(.85, h.s + .04);
    if (fh.s > .2 && Math.abs(fh.h - h.h) < .07 && Math.abs(fh.l - l) < .15) l = fh.l >= .7 ? fh.l - .2 : Math.min(.84, fh.l + .17);
    const hex = (hh, ss, ll) => '#' + new THREE.Color().setHSL(hh, ss, ll, SRGB).getHexString();
    out = { wood: hex(h.h, s, l), woodD: hex(h.h, Math.min(.85, s + .04), l - .2) };
  }
  WOODS.set(k, out);
  return out;
}
// Of a few theme colours, the one that stands out most against the floor (a bin or a toy chest standing on it).
function farFrom(T, cands) {
  const f = {}; new THREE.Color(T.floor || '#f4d4ad').getHSL(f, SRGB);
  let best = cands[0], bd = -1;
  for (const c of cands) {
    if (!c) continue;
    const h = {}; new THREE.Color(c).getHSL(h, SRGB);
    const dh = Math.min(Math.abs(h.h - f.h), 1 - Math.abs(h.h - f.h)) * 2 * Math.min(h.s, f.s + .3), d = dh + Math.abs(h.l - f.l);
    if (d > bd) { bd = d; best = c; }
  }
  return best;
}
// Cardboard a step lighter than a mid / dark plank floor, a step darker than a pale one.
const kraftFor = T => { const f = {}; new THREE.Color(T.floor || '#f4d4ad').getHSL(f, SRGB); return f.l > .72 ? ['#d9a066', '#bf8448'] : ['#f3cd96', '#dcae72']; };

// ── geometry helpers (same as apt-props.js / oneroom-props.js) ──────────────────────────────────────────────────
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
  const g = geo('fmc|' + STYLE.mode + '|' + key, () => {
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
function mg(key, m, fn) {
  const g = geo('fmg|' + key, () => {
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
// Box-mapped uvs in world units (a print is the same size on every face). vert: grain runs up the side faces.
function planarUV(g, s, vert = false) {
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); if (vert) [u, v] = [v, u]; }
    else { const a = ax >= az ? p.getZ(i) : p.getX(i); if (vert) { u = p.getY(i); v = a; } else { u = a; v = p.getY(i); } }
    uv[i * 2] = u / s; uv[i * 2 + 1] = v / s;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
// A planar-mapped textured mesh: fn({ box(w, h, d, x, y, z, { r, vert, rx, ry, rz }), geo(geometry, matrix, vert) })
function pm(key, m, s, fn) {
  return mg(key, m, ({ addM }) => {
    const I = new THREE.Matrix4();
    const g_ = (g, mm, vert = false) => { const c = g.index ? g.toNonIndexed() : g.clone(); if (!c.attributes.normal) c.computeVertexNormals(); addM(planarUV(c.applyMatrix4(mm), s, vert), I); };
    const box = (w, h, d, x, y, z, o = {}) => g_(G.box(w, h, d, o.r ?? .012), xf(x, y, z, o.rx || 0, o.ry || 0, o.rz || 0), o.vert);
    fn({ box, geo: g_ });
  });
}
// Remap a geometry's 0..1 uvs into an atlas rect [u0, v0, u1, v1].
function cellUV(g, c) {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, c[0] + uv.getX(i) * (c[2] - c[0]), c[1] + uv.getY(i) * (c[3] - c[1]));
  return g;
}
// uvs from the xy position, normalised to a box [x0, y0, w, h] (flat shapes facing +z)
function boxUV(g, x0, y0, w, h) {
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) - x0) / w; uv[i * 2 + 1] = (p.getY(i) - y0) / h; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}
function rrShape(x, y, w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// a round rug's outline: a circle of radius R with n soft scallops of height a
function scallopShape(R, a, n) {
  const s = new THREE.Shape(), N = n * 8;
  for (let i = 0; i <= N; i++) { const t = i / N * PI * 2, r = R + a * Math.sin(PI * ((i % 8) / 8)), x = Math.cos(t) * r, y = Math.sin(t) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  return s;
}
// a leaf: base at the origin, tip at (0, 1)
function leafShape(w = .52) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(w * .95, .12, w * .8, .78, 0, 1); s.bezierCurveTo(-w * .8, .78, -w * .95, .12, 0, 0);
  return s;
}
// a wall bracket in the xy plane: the top edge along +x (under the shelf), a concave brace down to (0, -h)
function bracketShape(w, h) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, -.025); s.quadraticCurveTo(.03, -.03, .025, -h); s.lineTo(0, -h); s.lineTo(0, 0);
  return s;
}
// a raised rectangular moulding (four bars) on a +z face; the bars' back face sits on z
function frameBars(add, cx, cy, w, h, b, d, z, c) {
  add(G.box(w, b, d, .004), c, cx, cy + h / 2 - b / 2, z + d / 2);
  add(G.box(w, b, d, .004), c, cx, cy - h / 2 + b / 2, z + d / 2);
  add(G.box(b, h - 2 * b, d, .004), c, cx - w / 2 + b / 2, cy, z + d / 2);
  add(G.box(b, h - 2 * b, d, .004), c, cx + w / 2 - b / 2, cy, z + d / 2);
}
// A five-petal flower decal on a +z face (pass z = face + .006).
function flower(add, x, y, z, s = 1, petal = WHITE, mid = MUSTARD) {
  for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2 + HP; add(G.sph(.016 * s, 8, 6), petal, x + Math.cos(a) * .017 * s, y + Math.sin(a) * .017 * s, z, 0, 0, 0, [1, 1, .3]); }
  add(G.sph(.011 * s, 8, 6), mid, x, y, z + .002, 0, 0, 0, [1, 1, .4]);
}
// a little potted plant (rosette of leaves), pot base at (x, y, z)
function pottedPlant(add, x, y, z, pot, s = 1) {
  add(G.cyl(.05 * s, .04 * s, .08 * s, 12), pot, x, y + .04 * s, z);
  add(G.cyl(.055 * s, .055 * s, .014 * s, 12), shade(pot, -.08), x, y + .078 * s, z);
  for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; add(G.sph(.042 * s, 8, 5), i % 2 ? LEAF : LEAF3, x + Math.cos(a) * .032 * s, y + (.11 + (i % 2) * .02) * s, z + Math.sin(a) * .032 * s, 0, -a, .5, [1.3 * s, .5 * s, .7 * s]); }
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
function starPath(c, x, y, R, r = R * .45) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -HP + i * PI / 5, rr = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
function clip(c, x, y, w, h, fn) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); fn(); c.restore(); }
function cloud(c, x, y, s, color = '#ffffff') { c.fillStyle = color; blob(c, x, y, 8 * s); blob(c, x + 10 * s, y - 5 * s, 10 * s); blob(c, x + 21 * s, y, 8 * s); c.fillRect(x, y - 2 * s, 21 * s, 10 * s); }
function daisy(c, x, y, r, petal = '#ffffff', mid = '#ffc23d') { c.fillStyle = petal; for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; blob(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * .78); } c.fillStyle = mid; blob(c, x, y, r * .6); }
// the game's mochi hero, for screens and pictures
function mochi(c, x, y, r, body = '#ffffff') {
  c.fillStyle = body; c.beginPath(); c.ellipse(x, y, r, r * .84, 0, 0, PI * 2); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1.1, r * .08); c.stroke();
  c.fillStyle = '#2a1d33'; blob(c, x - r * .34, y - r * .06, r * .1); blob(c, x + r * .34, y - r * .06, r * .1);
  c.fillStyle = '#ff9fb5'; blob(c, x - r * .58, y + r * .2, r * .14); blob(c, x + r * .58, y + r * .2, r * .14);
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1, r * .07); c.beginPath(); c.arc(x, y + r * .06, r * .14, .25, PI - .25); c.stroke();
}

// ── surface textures (repeat; world-sized through planarUV) ─────────────────────────────────────────────────────
// Wood: three boards per tile, each a touch lighter or darker, wavy grain that wraps, one small knot, a dark seam.
const woodTex = c1 => tex('fu-wood|' + c1, 256, 256, (c, w, h) => {
  const nb = 3, bh = h / nb;
  for (let b = 0; b < nb; b++) {
    c.fillStyle = tint(shade(c1, [-.02, .025, 0][b])); c.fillRect(0, b * bh, w, bh);
    c.lineWidth = 1.3;
    for (let k = 0; k < 5; k++) {
      c.strokeStyle = tint(shade(c1, k % 2 ? -.1 : -.16)); c.globalAlpha = k % 2 ? .5 : .65;
      const y0 = b * bh + 5 + k * (bh - 10) / 4, amp = 1.1 + (k % 3) * .8, ph = k * 1.9 + b * 2.3, n = 1 + ((k + b) % 2);
      c.beginPath(); for (let x = 0; x <= w; x += 4) { const y = y0 + Math.sin(x / w * PI * 2 * n + ph) * amp; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    }
    c.globalAlpha = 1;
    if (b === 1) {
      const kx = 70, ky = b * bh + bh * .5;
      c.strokeStyle = tint(shade(c1, -.15)); c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(kx, ky, 7, 2.8, 0, 0, PI * 2); c.stroke();
      c.fillStyle = tint(shade(c1, -.2)); c.beginPath(); c.ellipse(kx, ky, 2.6, 1.1, 0, 0, PI * 2); c.fill();
    }
    c.fillStyle = tint(shade(c1, -.24)); c.fillRect(0, b * bh, w, 1.4);
    c.fillStyle = tint(shade(c1, .07)); c.fillRect(0, b * bh + 1.4, w, 1);
  }
}, { repeat: [1, 1] });
const woodMat = c1 => mat('#ffffff', { map: woodTex(c1) });
const wd = (key, c1, fn, s = .7) => pm(key + '|' + c1, woodMat(c1), s, fn);
// Louvred door slats: a lit top edge, the slat, a dark shadow line, faint grain.
const louvreTex = c1 => tex('fu-louvre|' + c1, 128, 128, (c, w, h) => {
  const n = 4, sh = h / n;
  for (let k = 0; k < n; k++) {
    const y = k * sh;
    c.fillStyle = tint(shade(c1, .02)); c.fillRect(0, y, w, sh);
    c.fillStyle = tint(shade(c1, .1)); c.fillRect(0, y, w, 2.2);
    c.fillStyle = tint(shade(c1, -.06)); c.fillRect(0, y + sh * .55, w, sh * .3);
    c.fillStyle = tint(shade(c1, -.2)); c.fillRect(0, y + sh - 2.6, w, 2.6);
  }
}, { repeat: [1, 1] });
const ginghamTex = c1 => tex('fu-gingham|' + c1, 128, 128, (c, w, h) => {
  c.fillStyle = '#fffaf2'; c.fillRect(0, 0, w, h);
  c.fillStyle = tint(shade(c1, .14)); c.fillRect(0, 0, w / 2, h); c.fillRect(0, 0, w, h / 2);
  c.fillStyle = tint(c1); c.fillRect(0, 0, w / 2, h / 2);
}, { repeat: [1, 1] });
// Patchwork quilt: daisy squares in the main colour, cream squares dotted in the second colour, white running stitches.
const quiltTex = (c1, c2, c3) => tex('fu-quilt|' + c1 + c2 + c3, 128, 128, (c, w, h) => {
  const s = w / 2;
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h);
  c.fillStyle = tint('#fff7ec'); c.fillRect(s, 0, s, s); c.fillRect(0, s, s, s);
  for (const [x, y] of [[0, 0], [s, s]]) { daisy(c, x + s / 2, y + s / 2, 7, '#ffffff', tint(c3)); c.fillStyle = tint(shade(c1, .12)); for (const [dx, dy] of [[10, 10], [s - 10, 10], [10, s - 10], [s - 10, s - 10]]) blob(c, x + dx, y + dy, 2.4); }
  c.fillStyle = tint(c2); for (const [x, y] of [[s, 0], [0, s]]) for (const [dx, dy] of [[16, 16], [s - 16, 16], [s / 2, s / 2], [16, s - 16], [s - 16, s - 16]]) blob(c, x + dx, y + dy, 3.4);
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.3; c.setLineDash([3.2, 2.6]);
  for (const v of [2, s - 2, s + 2, w - 2]) { line(c, [[v, 0], [v, h]]); line(c, [[0, v], [w, v]]); }
  c.setLineDash([]);
}, { repeat: [1, 1] });
// Knitted wool: rows of little V stitches.
const knitTex = c1 => tex('fu-knit|' + c1, 64, 64, (c, w, h) => {
  c.fillStyle = tint(shade(c1, -.08)); c.fillRect(0, 0, w, h);
  const n = 4, s = w / n;
  for (let r = 0; r < n * 2; r++) for (let k = 0; k < n; k++) {
    const x = k * s + s / 2, y = r * s / 2 + s / 4;
    c.fillStyle = tint(shade(c1, .05));
    for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(x + sx * s * .2, y, s * .2, s * .3, sx * .55, 0, PI * 2); c.fill(); }
  }
}, { repeat: [1, 1] });
// Light curtains: soft vertical folds and a scatter of little dots and flowers.
const curtainTex = c1 => tex('fu-curtain|' + c1, 128, 128, (c, w, h) => {
  const n = 4, s = w / n;
  for (let k = 0; k < n; k++) {
    const g = c.createLinearGradient(k * s, 0, (k + 1) * s, 0);
    g.addColorStop(0, tint(shade(c1, -.07))); g.addColorStop(.4, tint(shade(c1, .05))); g.addColorStop(.75, tint(c1)); g.addColorStop(1, tint(shade(c1, -.07)));
    c.fillStyle = g; c.fillRect(k * s, 0, s, h);
  }
  c.fillStyle = 'rgba(255,255,255,.8)';
  for (const [x, y] of [[10, 14], [42, 40], [74, 12], [106, 44], [20, 78], [58, 98], [96, 84], [116, 120], [36, 122]]) blob(c, x, y, 2.4);
  for (const [x, y] of [[26, 46], [88, 58], [60, 18], [8, 104], [108, 104]]) daisy(c, x, y, 2.6, 'rgba(255,255,255,.95)', tint(MUSTARD));
}, { repeat: [1, 1] });
// Round rug: base colour, a contrast border, a dotted ring, inner rings and a flower medallion (uv 0..1 across the rug).
const rugTex = (c1, c2, c3) => tex('fu-rug|' + c1 + c2 + c3, 512, 512, (c, w, h) => {
  const cx = w / 2, cy = h / 2;
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h);
  c.fillStyle = tint(shade(c3, .04)); c.beginPath(); c.arc(cx, cy, 128, 0, PI * 2); c.arc(cx, cy, 112, 0, PI * 2, true); c.fill('evenodd');
  c.fillStyle = tint(c2); for (let i = 0; i < 28; i++) { const a = i / 28 * PI * 2; blob(c, cx + Math.cos(a) * 120, cy + Math.sin(a) * 120, 2.6); }
  c.fillStyle = tint(c2); for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2; blob(c, cx + Math.cos(a) * 100, cy + Math.sin(a) * 100, 4.4); }
  c.strokeStyle = tint(c2); c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, 84, 0, PI * 2); c.stroke();
  c.strokeStyle = tint(shade(c3, .1)); c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 74, 0, PI * 2); c.stroke();
  c.fillStyle = tint(c3); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2 + .26; heartPath(c, cx + Math.cos(a) * 60, cy + Math.sin(a) * 60, 5); c.fill(); }
  c.fillStyle = tint(c2); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; c.beginPath(); c.ellipse(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26, 15, 7.5, a, 0, PI * 2); c.fill(); }
  c.strokeStyle = tint(shade(c3, .04)); c.lineWidth = 2.4; c.beginPath(); c.arc(cx, cy, 44, 0, PI * 2); c.stroke();
  daisy(c, cx, cy, 8, tint(c3), tint(MUSTARD));
});
// The view out of the window: a soft sky, clouds, a round tree and the neighbours' roofs.
const viewTex = () => tex('fu-view', 512, 448, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#7cc7f4'); g.addColorStop(.75, '#dff4ff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffe27a'; blob(c, 204, 40, 16); c.fillStyle = 'rgba(255,240,170,.45)'; blob(c, 204, 40, 26);
  cloud(c, 24, 46, 1.2); cloud(c, 120, 26, .8); cloud(c, 150, 92, .6);
  c.fillStyle = '#b9dfa0'; c.beginPath(); c.ellipse(70, h + 40, 180, 90, 0, 0, PI * 2); c.fill();
  // roofs
  const house = (x, y, bw, roof, wall) => { c.fillStyle = wall; c.fillRect(x, y, bw, 80); c.fillStyle = roof; c.beginPath(); c.moveTo(x - 8, y + 2); c.lineTo(x + bw / 2, y - 30); c.lineTo(x + bw + 8, y + 2); c.fill(); c.fillStyle = '#9fd2f2'; c.fillRect(x + bw * .3, y + 18, bw * .4, 22); c.fillStyle = '#ffffff'; c.fillRect(x + bw * .5 - 1, y + 18, 2, 22); };
  house(150, 170, 64, '#ff8f6b', '#fff4e2'); house(208, 186, 56, '#5fb3a8', '#fde9d4');
  // the tree
  c.fillStyle = '#8a6a4a'; c.fillRect(54, 150, 10, 80);
  c.fillStyle = '#5fbf62'; blob(c, 40, 140, 34); blob(c, 78, 128, 30); blob(c, 60, 104, 30); c.fillStyle = '#7fd47a'; blob(c, 52, 112, 16); blob(c, 82, 126, 12);
  c.fillStyle = '#ff9fb5'; for (const [x, y] of [[36, 128], [70, 100], [92, 140], [50, 150]]) blob(c, x, y, 3.2);
  c.strokeStyle = '#4a4560'; c.lineWidth = 1.6; for (const [x, y] of [[150, 60], [166, 70]]) line(c, [[x - 6, y - 3], [x, y], [x + 6, y - 3]]);
}, { text: false });

// ── print atlas, 1024² canvas = 512² drawing units ───────────────────────────────────────────────────────────────
const AT = 512, PXU = .5 / 1024;
const RC = (x, y, w, h) => [x / AT + PXU, 1 - (y + h) / AT + PXU, (x + w) / AT - PXU, 1 - y / AT - PXU];
const RG = { tv: RC(0, 0, 256, 144), paint: RC(256, 0, 176, 126), clock: RC(432, 0, 80, 80), cookie: RC(432, 80, 80, 24), sticker: RC(432, 104, 64, 32),
  box: RC(0, 144, 128, 64), abc: RC(128, 144, 160, 52), dial: RC(288, 144, 80, 80), plate: RC(368, 144, 96, 32), hazard: RC(368, 176, 96, 24),
  kid: RC(0, 208, 80, 64), cal: RC(80, 208, 64, 80), photo: RC(144, 208, 56, 64), arrows: RC(200, 208, 64, 64), photo2: RC(264, 224, 56, 64) };
function drawTV(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#6fc3f5'); g.addColorStop(1, '#e4f7ff'); c.fillStyle = g; c.fillRect(x, y, w, h);
    // a rainbow, hills, a path of coins and the mochi hero hopping along
    for (const [r, col] of [[96, '#ff8a7a'], [88, '#ffc23d'], [80, '#9be38f'], [72, '#8fd3f4']]) { c.strokeStyle = col; c.lineWidth = 8; c.beginPath(); c.arc(x + 190, y + 150, r, PI, PI * 2); c.stroke(); }
    cloud(c, x + 18, y + 40, 1); cloud(c, x + 120, y + 30, .7);
    c.fillStyle = '#9be38f'; c.beginPath(); c.ellipse(x + 50, y + h + 20, 130, 64, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#6cc46a'; c.beginPath(); c.ellipse(x + 220, y + h + 30, 120, 66, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#f6dfa6'; c.beginPath(); c.moveTo(x + 40, y + h); c.quadraticCurveTo(x + 120, y + 100, x + 250, y + 108); c.lineTo(x + 256, y + 120); c.quadraticCurveTo(x + 140, y + 116, x + 90, y + h); c.fill();
    c.fillStyle = '#ffc93c'; for (const [cx, cy] of [[x + 150, y + 96], [x + 176, y + 92], [x + 202, y + 94]]) { blob(c, cx, cy, 5); }
    for (const [fx, fy] of [[x + 20, y + 124], [x + 230, y + 132], [x + 30, y + 136]]) daisy(c, fx, fy, 3);
    mochi(c, x + 100, y + 96, 20);
    c.fillStyle = '#ff5a6e'; for (let i = 0; i < 3; i++) { heartPath(c, x + 14 + i * 15, y + 14, 6); c.fill(); }
    c.fillStyle = '#ffc93c'; blob(c, x + w - 58, y + 14, 6);
    txt(c, '×24', x + w - 34, y + 15, 12, '#ffffff', { stroke: '#2a1d33', sw: 3 });
  });
}
function drawPainting(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#bfe6ff'); g.addColorStop(1, '#fff1e6'); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = '#ffd84a'; blob(c, x + 140, y + 30, 14);
    cloud(c, x + 20, y + 30, .8);
    c.fillStyle = '#a9b8ea'; c.beginPath(); c.moveTo(x + 40, y + 86); c.lineTo(x + 92, y + 34); c.lineTo(x + 150, y + 86); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + 79, y + 47); c.lineTo(x + 92, y + 34); c.lineTo(x + 105, y + 47); c.lineTo(x + 98, y + 44); c.lineTo(x + 92, y + 50); c.lineTo(x + 86, y + 44); c.fill();
    c.fillStyle = '#9be38f'; c.beginPath(); c.ellipse(x + 30, y + 120, 100, 44, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#7cd67a'; c.beginPath(); c.ellipse(x + 150, y + 126, 90, 40, 0, 0, PI * 2); c.fill();
    // a little red-roofed cottage
    c.fillStyle = '#fff4e2'; c.fillRect(x + 104, y + 84, 34, 24); c.fillStyle = '#ff6b57'; c.beginPath(); c.moveTo(x + 98, y + 86); c.lineTo(x + 121, y + 68); c.lineTo(x + 144, y + 86); c.fill();
    c.fillStyle = '#8fd3f4'; c.fillRect(x + 110, y + 90, 9, 8); c.fillStyle = '#c98a52'; c.fillRect(x + 125, y + 92, 8, 16);
    c.fillStyle = '#6a4a2a'; c.fillRect(x + 36, y + 76, 5, 24); c.fillStyle = '#5fbf62'; blob(c, x + 38, y + 70, 14); blob(c, x + 48, y + 78, 10);
    for (const [fx, fy, col] of [[x + 20, y + 112, '#ffffff'], [x + 60, y + 116, '#ff9fb5'], [x + 160, y + 116, '#ffffff'], [x + 84, y + 120, '#ffc23d']]) daisy(c, fx, fy, 3, col);
  });
}
function drawClock(c, x, y, s) {
  const cx = x + s / 2, cy = y + s / 2, r = s / 2;
  c.fillStyle = '#fff8ec'; c.fillRect(x, y, s, s);
  c.fillStyle = '#ffe9c9'; blob(c, cx, cy, r * .7);
  c.fillStyle = '#5b5672'; for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; if (i % 3) blob(c, cx + Math.sin(a) * r * .82, cy - Math.cos(a) * r * .82, 1.6); }
  [['12', 0], ['3', 3], ['6', 6], ['9', 9]].forEach(([n, i]) => { const a = i / 12 * PI * 2; txt(c, n, cx + Math.sin(a) * r * .74, cy - Math.cos(a) * r * .74 + 1, 13, '#4a4560'); });
  c.fillStyle = '#ff9fb5'; blob(c, cx - 14, cy + 14, 4); blob(c, cx + 14, cy + 14, 4);
}
function drawBox(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#fffaf0'; roundRect(c, x + 2, y + 2, w - 4, h - 4, 8); c.fill();
    c.strokeStyle = '#c98a52'; c.lineWidth = 2; c.setLineDash([4, 3]); roundRect(c, x + 6, y + 6, w - 12, h - 12, 6); c.stroke(); c.setLineDash([]);
    // bear face
    const bx = x + 28, by = y + h / 2;
    c.fillStyle = '#c98a52'; blob(c, bx - 11, by - 11, 6); blob(c, bx + 11, by - 11, 6); blob(c, bx, by, 15);
    c.fillStyle = '#f6dcb8'; c.beginPath(); c.ellipse(bx, by + 5, 7, 5, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#2a1d33'; blob(c, bx - 5, by - 3, 1.8); blob(c, bx + 5, by - 3, 1.8); blob(c, bx, by + 3, 1.8);
    txt(c, '장난감', x + 84, y + h / 2 + 1, 20, '#8a5a2e');
  });
}
function drawABC(c, x, y, w, h) {
  c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(x, y, w, h);
  const cols = [['#ff6b57', 'A'], ['#ffc23d', 'B'], ['#8fd3f4', 'C'], ['#7fd6c0', 'D']], s = 40;
  c.fillStyle = '#fff4e2'; roundRect(c, x + 1, y + 1, w - 2, h - 2, 10); c.fill();
  cols.forEach(([col, L], i) => { const bx = x + 2 + i * (s - 1) + 2, by = y + 6 + (i % 2) * 2; c.fillStyle = col; roundRect(c, bx, by, s - 4, s - 4, 6); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(bx + 3, by + 3, s - 14, 4); txt(c, L, bx + (s - 4) / 2, by + (s - 4) / 2 + 2, 24, '#ffffff', { stroke: shade(col, -.25), sw: 3 }); });
}
function drawDial(c, x, y, s) {
  const cx = x + s / 2, cy = y + s / 2, r = s / 2;
  c.fillStyle = '#ffd86b'; c.fillRect(x, y, s, s);
  c.fillStyle = '#ffe9a6'; blob(c, cx, cy, r * .62);
  c.fillStyle = '#7a5a1a'; for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2, big = i % 5 === 0; c.save(); c.translate(cx + Math.sin(a) * r * .86, cy - Math.cos(a) * r * .86); c.rotate(a); c.fillRect(-.7, -(big ? 4 : 2.2), 1.4, big ? 8 : 4.4); c.restore(); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; txt(c, String(i * 10), cx + Math.sin(a) * r * .64, cy - Math.cos(a) * r * .64 + 1, 9, '#7a5a1a'); }
}
function drawPlate(c, x, y, w, h) {
  c.fillStyle = '#ffd86b'; c.fillRect(x, y, w, h); c.strokeStyle = '#b8862a'; c.lineWidth = 2; c.strokeRect(x + 3, y + 3, w - 6, h - 6);
  txt(c, '금 고', x + w / 2, y + h / 2 + 1, 18, '#8a5a1a');
}
function drawHazard(c, x, y, w, h) {
  clip(c, x, y, w, h, () => { c.fillStyle = '#ffd23f'; c.fillRect(x, y, w, h); c.fillStyle = '#3b3550'; for (let k = -2; k < 12; k++) { c.beginPath(); c.moveTo(x + k * 14, y + h); c.lineTo(x + k * 14 + 7, y + h); c.lineTo(x + k * 14 + 7 + h, y); c.lineTo(x + k * 14 + h, y); c.fill(); } });
}
function drawCookie(c, x, y, w, h) {
  c.fillStyle = '#fff4e2'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ff6b57'; c.fillRect(x, y, w, 2.5); c.fillRect(x, y + h - 2.5, w, 2.5);
  c.fillStyle = '#d9954f'; blob(c, x + 14, y + h / 2, 8); c.fillStyle = '#6a3f22'; for (const [dx, dy] of [[-3, -2], [3, 1], [-1, 4]]) blob(c, x + 14 + dx, y + h / 2 + dy, 1.4);
  txt(c, '쿠키', x + 46, y + h / 2 + 1, 15, '#8a5a2e');
  c.fillStyle = '#ff6b8a'; heartPath(c, x + 70, y + h / 2, 5); c.fill();
}
function drawSticker(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; roundRect(c, x + 2, y + 2, w - 4, h - 4, 8); c.fill();
  c.strokeStyle = '#4fae5a'; c.lineWidth = 3; c.beginPath(); c.arc(x + 16, y + h / 2, 8, .4, PI * 1.7); c.stroke();
  c.fillStyle = '#4fae5a'; c.beginPath(); c.moveTo(x + 22, y + h / 2 - 9); c.lineTo(x + 26, y + h / 2 - 2); c.lineTo(x + 18, y + h / 2 - 3); c.fill();
  txt(c, '분리', x + 42, y + h / 2 + 1, 13, '#4fae5a');
}
function drawKid(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#fffdf3'; c.fillRect(x, y, w, h);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = '#ffd23f'; blob(c, x + 66, y + 13, 7);
    c.strokeStyle = '#ff6b57'; c.lineWidth = 2.2; line(c, [[x + 10, y + 34], [x + 28, y + 18], [x + 46, y + 34]]);
    c.strokeStyle = '#3f9be0'; c.strokeRect(x + 14, y + 34, 28, 22);
    c.fillStyle = '#ffab4c'; c.fillRect(x + 24, y + 44, 8, 12);
    mochi(c, x + 60, y + 46, 8);
    c.strokeStyle = '#6cc46a'; c.lineWidth = 2; line(c, [[x + 4, y + 60], [x + 76, y + 60]]);
  });
}
function drawCal(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h); c.fillStyle = '#ff6b57'; c.fillRect(x, y, w, 20); txt(c, '10월', x + w / 2, y + 11, 14, '#ffffff');
    c.fillStyle = '#c9c3d9'; for (let r = 0; r < 5; r++) for (let k = 0; k < 5; k++) c.fillRect(x + 6 + k * 11, y + 28 + r * 10, 7, 6);
    c.strokeStyle = '#ff4d5e'; c.lineWidth = 2; c.beginPath(); c.arc(x + 31.5, y + 51, 6, 0, PI * 2); c.stroke();
  });
}
function drawPhoto(c, x, y, w, h, kind) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
    const px = x + 4, py = y + 4, pw = w - 8, ph = h - 16;
    const g = c.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, '#8fd3f4'); g.addColorStop(1, '#e4f7ff'); c.fillStyle = g; c.fillRect(px, py, pw, ph);
    if (kind) { c.fillStyle = '#4fa8e8'; c.fillRect(px, py + ph * .6, pw, ph * .4); c.fillStyle = '#f6dfa6'; c.fillRect(px, py + ph * .82, pw, ph * .18); c.fillStyle = '#ffd23f'; blob(c, px + pw * .7, py + 12, 7); }
    else { c.fillStyle = '#9be38f'; c.fillRect(px, py + ph - 12, pw, 12); mochi(c, px + pw * .35, py + ph - 16, 10); mochi(c, px + pw * .7, py + ph - 14, 7, '#ffe9a8'); }
    c.fillStyle = '#d9d4cc'; c.fillRect(x + 12, y + h - 8, w - 24, 3);
  });
}
function drawArrows(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#fff8ea'; roundRect(c, x + 2, y + 2, w - 4, h - 4, 8); c.fill();
  c.fillStyle = '#8a5a2e';
  for (const ax of [x + 18, x + 46]) { c.beginPath(); c.moveTo(ax, y + 10); c.lineTo(ax + 10, y + 24); c.lineTo(ax + 4, y + 24); c.lineTo(ax + 4, y + 36); c.lineTo(ax - 4, y + 36); c.lineTo(ax - 4, y + 24); c.lineTo(ax - 10, y + 24); c.fill(); }
  c.strokeStyle = '#8a5a2e'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x + 22, y + 44); c.lineTo(x + 24, y + 58); c.lineTo(x + 40, y + 58); c.lineTo(x + 42, y + 44); c.stroke();
  line(c, [[x + 32, y + 40], [x + 32, y + 50]]);
}
const atlas = () => tex('fu-atlas', 1024, 1024, c => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, AT, AT);
  drawTV(c, 0, 0, 256, 144); drawPainting(c, 256, 0, 176, 126); drawClock(c, 432, 0, 80); drawCookie(c, 432, 80, 80, 24); drawSticker(c, 432, 104, 64, 32);
  drawBox(c, 0, 144, 128, 64); drawABC(c, 128, 144, 160, 52); drawDial(c, 288, 144, 80); drawPlate(c, 368, 144, 96, 32); drawHazard(c, 368, 176, 96, 24);
  drawKid(c, 0, 208, 80, 64); drawCal(c, 80, 208, 64, 80); drawPhoto(c, 144, 208, 56, 64, 0); drawArrows(c, 200, 208, 64, 64); drawPhoto(c, 264, 224, 56, 64, 1);
}, { text: true });
const atlasMat = () => mat('#ffffff', { map: atlas() });
const screenMat = () => mat('#ffffff', { map: atlas(), emissive: '#ffffff', ei: .14 });
const glowMat = (c = '#fff6d8', e = '#ffd98a', ei = .9) => mat(c, { emissive: e, ei });
const bandGeo = (r, h, rc, a = 1.6, seg = 10) => cellUV(new THREE.CylinderGeometry(r, r, h, seg, 1, true, -a / 2, a), rc);
const quadGeo = (w, h, rc) => cellUV(new THREE.PlaneGeometry(w, h), rc);
const discGeo = (r, rc, seg = 28) => cellUV(new THREE.CircleGeometry(r, seg), rc);

const B = {};

// ═════════════════════════════════════════════ BEDROOM ═════════════════════════════════════════════
// 침대 (1×2): a honey-wood bed with turned posts, arched head- and footboards with painted panels (a heart and stars), a
// white mattress with piping, a patchwork quilt that drapes over the sides (the turned-down sheet at its top) and a cream
// pillow with mustard piping. The pillow and the quilt lift.
B.bed = (f, T) => {
  const { wood, woodD } = woods(T), sheet = T.sheet || WHITE, pilC = T.pillow || CREAM, acc = T.accent, acc2 = T.accent2, acc3 = T.accent3 || MUSTARD;
  const tk = [wood, woodD, sheet, pilC, acc, acc2, acc3].join(',');
  const HZ = -.945, FZ = .955, PX = .458, panel = shade(acc2, .1);
  f.add(wd('bed-frame', wood, ({ box, geo }) => {
    for (const sx of [-1, 1]) box(.05, .14, 1.85, sx * .455, .3, .005, { r: .015 });                // side rails
    geo(G.ext(rrShape(-.43, .2, .86, .84, .2), .045, 0, 8), xf(0, 0, HZ - .0225));                 // headboard
    geo(G.ext(rrShape(-.43, .2, .86, .42, .12), .045, 0, 8), xf(0, 0, FZ - .0225));                // footboard
    for (const sx of [-1, 1]) {
      geo(G.cyl(.034, .03, 1.1, 12), xf(sx * PX, .55, HZ), true); geo(G.sph(.04, 12, 8), xf(sx * PX, 1.13, HZ));
      geo(G.cyl(.034, .03, .7, 12), xf(sx * PX, .35, FZ), true); geo(G.sph(.04, 12, 8), xf(sx * PX, .73, FZ));
    }
  }));
  f.add(mc('bed|' + tk, ({ add }) => {
    add(G.box(.88, .17, 1.76, .05, 2), sheet, 0, .455, .01);                                         // mattress
    add(G.box(.894, .02, 1.774, .008), acc2, 0, .49, .01);                                           // piping
    for (const sx of [-1, 1]) { add(G.cyl(.012, .012, .012, 8), woodD, sx * PX, 1.06, HZ, 0, 0, 0); add(G.cyl(.012, .012, .012, 8), woodD, sx * PX, .66, FZ); }
    // painted panels: a heart and two stars on the headboard, three dots on the footboard
    const hz = HZ + .0225 + .002;
    add(G.ext(rrShape(-.31, .34, .62, .56, .14), .01, 0, 6), panel, 0, 0, hz);
    add(G.ext(heartShape(.1), .008, 0, 8), acc, 0, .62, hz + .01);
    for (const sx of [-1, 1]) add(G.ext(starShape(.045, .02), .008, 0, 2), acc3, sx * .19, .76, hz + .01);
    const fz = FZ + .0225 + .002;
    add(G.ext(rrShape(-.31, .3, .62, .22, .08), .01, 0, 6), panel, 0, 0, fz);
    for (const [x, c] of [[-.14, acc], [0, acc3], [.14, acc]]) add(G.sph(.026, 10, 8), c, x, .41, fz + .01, 0, 0, 0, [1, 1, .4]);
    // stubby feet under the side rails
    for (const sx of [-1, 1]) add(G.cyl(.03, .024, .23, 10), woodD, sx * .44, .115, .1);
  }));
  // pillow (lifts)
  const pil = grp(mc('bed-pillow|' + tk, ({ add }) => {
    add(G.box(.62, .13, .34, .05, 2), pilC, 0, 0, 0);
    add(G.box(.634, .024, .354, .01), acc3, 0, -.008, 0);
    add(G.ext(heartShape(.045), .006, 0, 6), acc, .18, .065 + .002, .07, -HP, 0, 0);
  }));
  put(pil, 0, .6, -.62); f.add(pil);
  const pp = f.part('lift', pil, (t, b) => { pil.position.y = b.p.y + .42 * t; pil.rotation.x = -.35 * t; pil.rotation.z = .12 * t; }, { label: '베개', sfx: 'lift' });
  f.spot('inside', null, 0, .54, -.62, { part: pp, maxH: .3, label: '베개 밑' });
  // patchwork quilt (lifts): the top, side and foot drapes; a turned-down sheet with a stripe
  const bl = new THREE.Group(); put(bl, 0, .575, .36); f.add(bl);
  bl.add(pm('bed-quilt|' + acc + acc2 + acc3, mat('#ffffff', { map: quiltTex(acc, acc2, acc3) }), .36, ({ box }) => {
    box(.92, .06, 1.06, 0, 0, .01, { r: .025 });
    for (const sx of [-1, 1]) box(.016, .15, 1.06, sx * .456, -.05, .01, { r: .006 });
    box(.928, .15, .016, 0, -.05, .548, { r: .006 });
  }));
  bl.add(mc('bed-fold|' + tk, ({ add }) => {
    add(G.box(.926, .016, .16, .006), sheet, 0, .038, -.44);
    add(G.cyl(.026, .026, .926, 12), sheet, 0, .03, -.52, 0, 0, HP);
    add(G.pbox(.926, .008, .024), acc2, 0, .05, -.41);
  }));
  const bp = f.part('lift', bl, (t, b) => { bl.position.y = b.p.y + .55 * t; bl.position.z = b.p.z + .06 * t; bl.scale.z = 1 - .45 * t; bl.rotation.x = .2 * t; }, { label: '이불', sfx: 'lift' });
  f.spot('inside', null, 0, .54, .36, { part: bp, maxH: .3, label: '이불 속' });
  f.spot('under', null, .3, 0, .35, { maxH: .19, label: '침대 밑', scale: .85 });
};

// 다락 이불 (1×2): bedding laid straight on the loft boards — a low mattress, a patchwork quilt and a pillow. A loft is
// too low for a bed frame; this keeps it cosy instead of crammed.
B.futon = (f, T) => {
  const sheet = T.sheet || WHITE, pilC = T.pillow || CREAM, acc = T.accent, acc2 = T.accent2, acc3 = T.accent3 || MUSTARD;
  const tk = [sheet, pilC, acc, acc2, acc3].join(',');
  f.add(mc('futon|' + tk, ({ add }) => {
    add(G.box(.84, .1, 1.7, .04, 2), sheet, 0, .05, .02);                                           // mattress
    add(G.box(.854, .018, 1.714, .008), acc2, 0, .03, .02);                                         // piping
    add(G.cyl(.05, .05, .2, 14), acc3, .3, .15, .8, 0, 0, HP);                                       // a little bolster at the foot
  }));
  const pil = grp(mc('futon-pillow|' + tk, ({ add }) => {
    add(G.box(.58, .11, .3, .05, 2), pilC, 0, 0, 0);
    add(G.ext(heartShape(.04), .006, 0, 6), acc, .17, .055 + .002, .06, -HP, 0, 0);
  }));
  put(pil, 0, .16, -.62); f.add(pil);
  const pp = f.part('lift', pil, (t, b) => { pil.position.y = b.p.y + .36 * t; pil.rotation.x = -.35 * t; pil.rotation.z = .12 * t; }, { label: '베개', sfx: 'lift' });
  f.spot('inside', null, 0, .1, -.62, { part: pp, maxH: .26, label: '베개 밑' });
  const bl = new THREE.Group(); put(bl, 0, .13, .2); f.add(bl);
  bl.add(pm('futon-quilt|' + acc + acc2 + acc3, mat('#ffffff', { map: quiltTex(acc, acc2, acc3) }), .36, ({ box }) => {
    box(.88, .05, 1.0, 0, 0, 0, { r: .022 });
    for (const sx of [-1, 1]) box(.016, .08, 1.0, sx * .436, -.03, 0, { r: .006 });
  }));
  bl.add(mc('futon-fold|' + tk, ({ add }) => { add(G.cyl(.024, .024, .88, 12), sheet, 0, .03, -.5, 0, 0, HP); }));
  const bp = f.part('lift', bl, (t, b) => { bl.position.y = b.p.y + .45 * t; bl.position.z = b.p.z + .05 * t; bl.scale.z = 1 - .45 * t; bl.rotation.x = .2 * t; }, { label: '이불', sfx: 'lift' });
  f.spot('inside', null, 0, .1, .2, { part: bp, maxH: .26, label: '이불 속' });
};

// 옷장 (1×1): a cream wardrobe with a honey crown and plinth, two panelled doors with brass knobs and cream hearts. Inside:
// a shelf with folded sweaters, a rail with clothes and a mirror on the back of the left door; a hat box on top.
B.wardrobe = (f, T) => {
  const { wood, woodD } = woods(T), body = T.body || CREAM, door = T.door || T.accent, knob = T.knob || GOLD, acc = T.accent, acc2 = T.accent2, acc3 = T.accent3 || MUSTARD;
  const tk = [wood, woodD, body, door, knob, acc, acc2, acc3].join(',');
  const W = .92, H = 1.86, D = .6, z0 = -.18, y0 = .08, inner = shade(body, -.1), back = z0 - D / 2, fz = z0 + D / 2, top = y0 + H;
  f.add(mc('wardrobe|' + tk, ({ add, addM, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.04, .026, y0, 10), woodD, sx * (W / 2 - .07), y0 / 2, z0 + sz * (D / 2 - .08));
    add(G.box(W - .06, .05, .03, .01), woodD, 0, y0 - .015, fz - .02);                            // apron
    add(G.pbox(W - .02, H - .01, .04), inner, 0, y0 + (H - .01) / 2, back + .025);
    for (const sx of [-1, 1]) add(G.box(.045, H, D, .015), body, sx * (W / 2 - .0225), y0 + H / 2, z0);
    add(G.pbox(W - .09, .045, D - .04), inner, 0, y0 + .0225, z0 + .02);
    add(G.box(W, .045, D, .015), body, 0, top - .0225, z0);
    add(G.box(W + .03, .025, D + .03, .008), woodD, 0, top - .0165, z0 - .0);                         // cove under the crown
    for (const dy of [-.62, .62]) add(G.box(.02, .11, .03, .006), BRASS, -W / 2 - .002, y0 + H / 2 + dy, fz + .03);   // hinges
    for (const dy of [-.62, .62]) add(G.box(.02, .11, .03, .006), BRASS, W / 2 + .002, y0 + H / 2 + dy, fz + .03);
    add(G.pbox(W - .09, .035, D - .08), shade(inner, -.03), 0, 1.06, z0 - .02);                      // shelf (top 1.0775)
    // a raised panel on each side
    for (const sx of [-1, 1]) {
      const M = xf(sx * (W / 2 + .001), y0 + H / 2, z0, 0, sx * HP, 0);
      for (const [cy, h] of [[.42, .86], [-.48, .74]]) for (const [dx, dy, w2, h2] of [[0, h / 2 - .015, D - .14, .03], [0, -h / 2 + .015, D - .14, .03], [-(D - .14) / 2 + .015, 0, .03, h - .06], [(D - .14) / 2 - .015, 0, .03, h - .06]])
        addM(G.box(w2, h2, .014, .004), M.clone().multiply(xf(dx, cy + dy, .007)), shade(body, -.05));
    }
    // inside: folded sweaters on the shelf, clothes on the rail, boots and a shoe box below
    [acc2, acc3, CREAM].forEach((c, k) => add(G.box(.22, .06, .26, .02), c, -.3 + (k % 2) * .01, 1.0775 + .03 + k * .06, z0 - .04));
    tube([-W / 2 + .045, 1.72, z0], [W / 2 - .045, 1.72, z0], .012, STEEL, 8);
    const shirt = new THREE.Shape(); shirt.moveTo(-.05, 0); shirt.lineTo(-.15, -.03); shirt.lineTo(-.15, -.4); shirt.lineTo(.15, -.4); shirt.lineTo(.15, -.03); shirt.lineTo(.05, 0); shirt.lineTo(-.05, 0);
    [[.22, acc2], [.3, acc3], [.38, acc]].forEach(([x, c]) => {
      add(G.tor(.022, .005, PI * 1.3, 3, 10), STEEL2, x, 1.72, z0, 0, 0, -.4);
      add(G.ext(shirt, .022, 0, 2), c, x - .011, 1.69, z0, 0, HP, 0);
    });
    add(G.box(.24, .12, .2, .01), KRAFT, -.26, y0 + .045 + .06, z0 - .14);
    for (const dz of [-.05, .06]) { add(G.box(.08, .22, .09, .03), BROWN, .3, y0 + .045 + .11, z0 + dz - .02); add(G.box(.08, .05, .16, .02), BROWN, .3, y0 + .045 + .025, z0 + dz + .02); }
    // a hat box on top
    add(G.cyl(.12, .12, .13, 20), acc2, -.27, top + .07 + .065, z0);
    add(G.cyl(.126, .126, .03, 20), shade(acc2, -.1), -.27, top + .07 + .125, z0);
    add(G.cyl(.121, .121, .03, 20), acc3, -.27, top + .07 + .05, z0);
  }));
  f.add(wd('wardrobe-crown', wood, ({ box }) => box(W + .08, .07, .7, 0, top + .035, -.145, { r: .02 })));
  const zf = fz + .028, DW = W / 2 - .015, DH = H - .05;
  const L = new THREE.Group(), R = new THREE.Group();
  put(L, -W / 2 + .01, y0 + H / 2, zf); put(R, W / 2 - .01, y0 + H / 2, zf);
  for (const [pv, sx, k] of [[L, 1, 'L'], [R, -1, 'R']]) {
    const cx = sx * W / 4, mold = shade(door, -.16);
    pv.add(mc('wardrobe-door' + k + '|' + tk, ({ add }) => {
      add(G.box(DW, DH, .05, .02), door, cx, 0, 0);
      frameBars(add, cx, .43, DW - .12, .82, .032, .014, .025, mold);
      frameBars(add, cx, -.48, DW - .12, .76, .032, .014, .025, mold);
      add(G.ext(heartShape(.06), .01, 0, 8), CREAM, cx, .52, .025 + .002);
      add(G.cyl(.028, .028, .01, 14), shade(knob, -.12), sx * (W / 2 - .07), -.02, .03, HP, 0, 0);
      add(G.sph(.034, 12, 10), knob, sx * (W / 2 - .07), -.02, .052);
      if (k === 'L') { add(G.box(.24, .52, .01, .004), '#d8eef8', cx, .3, -.036); add(G.pbox(.03, .3, .004), WHITE, cx - .05, .36, -.043, 0, 0, -.5); }
    }));
    f.add(pv);
  }
  const p = f.part('door', [L, R], (t, bl, br) => { L.rotation.y = -2.2 * t; R.rotation.y = 2.2 * t; }, { label: '옷장', sfx: 'open', dur: .32 });
  p.lockable = true; f.lockAt = { x: 0, y: y0 + H * .55, z: zf + .05 };
  f.spot('inside', null, 0, 1.08, z0, { part: p, maxH: .5, label: '옷장 위칸' });
  f.spot('inside', null, 0, y0 + .05, z0, { part: p, maxH: .5, label: '옷장 아래칸' });
  f.spot('on', null, .12, y0 + H + .07, z0, { maxH: .4, label: '옷장 꼭대기' });
};

// 서랍장 (1×1): a cream chest of drawers on stubby legs with a honey top — three colour drawers with raised panels and brass
// bar pulls (a folded cloth tucked at the back of each); a framed photo and a little cactus on top.
B.drawers = (f, T) => {
  const { wood, woodD } = woods(T), body = T.body || CREAM, knob = T.knob || GOLD, acc2 = T.accent2;
  const cols = [T.accent, T.accent2, T.accent3 || T.accent], z0 = -.19, fz = z0 + .28;
  const tk = [wood, woodD, body, knob, ...cols].join(',');
  f.add(mc('drawers|' + tk, ({ add, addM }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.035, .024, .07, 10), woodD, sx * .38, .035, z0 + sz * .2);
    add(G.box(.9, .88, .56, .03), body, 0, .51, z0);
    add(G.box(.84, .04, .02, .006), woodD, 0, .095, fz + .01);
    const fM = xf(.3, 1.01 + .1, z0 - .14, -.12, -.25, 0);
    addM(G.box(.17, .2, .022, .008), fM, woodD);
    addM(G.box(.04, .12, .015, .004), fM.clone().multiply(xf(0, -.03, -.035, .5)), woodD);
    add(G.cyl(.045, .038, .07, 12), acc2, .18, 1.01 + .035, z0 - .02);
    add(G.cap(.026, .05, 2, 8), LEAF2, .18, 1.01 + .1, z0 - .02);
    for (const s of [-1, 1]) add(G.cap(.013, .02, 2, 6), LEAF2, .18 + s * .03, 1.01 + .1, z0 - .02, 0, 0, -s * .9);
    add(G.sph(.013, 6, 5), BLUSH, .18, 1.01 + .15, z0 - .02);
  }));
  f.add(mg('drawers-photo', atlasMat(), ({ addM }) => addM(quadGeo(.13, .15, RG.photo), xf(.3, 1.01 + .1, z0 - .14, -.12, -.25, 0).multiply(xf(0, .005, .011 + .006)))));
  f.add(wd('drawers-top', wood, ({ box }) => box(.96, .06, .62, 0, .98, z0, { r: .02 })));
  [.24, .51, .78].forEach((y, i) => {
    const c = cols[i], pv = new THREE.Group(); put(pv, 0, y, z0 + .28);
    pv.add(mc('drawers-d' + i + '|' + tk, ({ add }) => {
      add(G.box(.82, .24, .05, .02), c, 0, 0, .02);
      add(G.box(.7, .15, .012, .01), shade(c, .07), 0, 0, .051);
      for (const sx of [-1, 1]) add(G.cyl(.011, .011, .03, 8), shade(knob, -.12), sx * .055, 0, .072, HP, 0, 0);
      add(G.cap(.014, .12, 2, 8), knob, 0, 0, .087, 0, 0, HP);
      const inner = shade(body, -.1);
      add(G.pbox(.74, .02, .46), inner, 0, -.1, -.24);
      add(G.pbox(.02, .16, .46), inner, -.36, -.03, -.24);
      add(G.pbox(.02, .16, .46), inner, .36, -.03, -.24);
      add(G.pbox(.74, .16, .02), inner, 0, -.03, -.46);
      add(G.box(.15, .05, .12, .02), [CREAM, SKY2, '#ffe9c9'][i], -.26, -.065, -.38);
      add(G.box(.15, .04, .12, .016), [SKY2, CREAM, BLUSH][i], -.26, -.02, -.38);
    }));
    f.add(pv);
    const p = f.part('drawer', pv, (t, b) => { pv.position.z = b.p.z + .4 * t; }, { label: `서랍 ${3 - i}칸`, sfx: 'drawer', dur: .26 });
    f.spot('inside', pv, 0, -.09, -.22, { part: p, maxH: .22, label: `서랍 ${3 - i}칸`, scale: .9 });
  });
  f.spot('on', null, -.18, 1.01, z0, { maxH: .45, label: '서랍장 위' });
};

// 책상 (2×1): a honey desk — a cream drawer pedestal (two drawers, brass pulls), a bendy desk lamp, a pen pot, a globe and
// two books; a wooden chair with a cushion and a spindle back is tucked in front.
B.desk = (f, T) => {
  const { wood, woodD } = woods(T), body = T.body || CREAM, knob = T.knob || GOLD, acc = T.accent, acc2 = T.accent2, acc3 = T.accent3 || MUSTARD;
  const tk = [wood, woodD, body, knob, acc, acc2, acc3].join(',');
  const z0 = -.1, cx = -.3, cz = .3;
  f.add(wd('desk-wood', wood, ({ box, geo }) => {
    box(1.92, .07, .76, 0, .77, z0, { r: .02 });
    for (const z of [z0 - .32, z0 + .32]) geo(G.cyl(.034, .024, .735, 10), xf(-.88, .3675, z), true);
    box(.04, .08, .58, -.88, .69, z0);
    box(1.06, .08, .03, -.33, .69, z0 - .335);
    // the chair
    box(.42, .05, .4, cx, .44, cz, { r: .015 });
    for (const sx of [-1, 1]) {
      geo(G.cyl(.022, .018, .415, 8), xf(cx + sx * .17, .2075, cz - .16), true);
      geo(G.cyl(.022, .018, .89, 8), xf(cx + sx * .17, .445, cz + .165), true);
    }
    box(.42, .1, .035, cx, .84, cz + .165, { r: .015 });
  }));
  f.add(mc('desk|' + tk, ({ add, addM, tube }) => {
    add(G.box(.56, .705, .72, .02), body, .62, .3825, z0);
    add(G.box(.52, .03, .66, .01), woodD, .62, .015, z0);
    add(G.ext(heartShape(.07), .008, 0, 8), acc, .9 + .002, .5, z0 + .05, 0, HP, 0);
    // chair: spindles and a cushion
    for (const dx of [-.08, 0, .08]) tube([cx + dx, .465, cz + .165], [cx + dx, .79, cz + .165], .012, woodD, 6);
    add(G.box(.38, .045, .36, .02, 2), acc2, cx, .4875, cz);
    for (const sx of [-1, 1]) add(G.sph(.012, 6, 5), shade(acc2, -.15), cx + sx * .08, .512, cz, 0, 0, 0, [1, .5, 1]);
    // desk lamp: base, two arms, a shade with a glowing bulb (separate)
    const lb = [-.8, .805, -.33];
    add(G.cyl(.075, .08, .03, 18), acc3, lb[0], lb[1] + .015, lb[2]);
    add(G.cyl(.028, .028, .03, 10), shade(acc3, -.15), lb[0], lb[1] + .045, lb[2]);
    tube([lb[0], lb[1] + .05, lb[2]], [-.82, 1.12, -.36], .012, WHITE, 6);
    add(G.sph(.024, 10, 8), acc3, -.82, 1.12, -.36);
    tube([-.82, 1.12, -.36], [-.68, 1.17, -.26], .012, WHITE, 6);
    add(G.sph(.02, 8, 6), acc3, -.68, 1.17, -.26);
    add(G.dome(.11, 18, 6), acc3, -.65, 1.15, -.235, -.35, 0, .5, [1, .85, 1]);
    addM(G.tor(.108, .009, PI * 2, 4, 20), xf(-.65, 1.15, -.235, -.35, 0, .5, [1, .85, 1]).multiply(xf(0, 0, 0, HP, 0, 0)), shade(acc3, -.12));
    // pen pot, globe, books
    add(G.cyl(.045, .04, .1, 14), acc, .06, .805 + .05, z0 - .26);
    [[-.015, TOMATO, .14], [.012, SKY, .16], [0, MUSTARD, .13]].forEach(([dx, c, L], k) => tube([.06 + dx, .82, z0 - .26 + (k - 1) * .012], [.06 + dx * 2.2, .82 + L, z0 - .26 + (k - 1) * .02], .007, c, 5));
    add(G.cyl(.06, .07, .02, 16), woodD, .84, .815, z0 - .23);
    tube([.84, .825, z0 - .23], [.84, .87, z0 - .23], .012, woodD, 6);
    add(G.tor(.115, .009, PI, 4, 16), GOLD, .84, .985, z0 - .23, 0, HP, -.4);
    add(G.sph(.1, 16, 12), SKY, .84, .985, z0 - .23);
    for (const [a, b, s] of [[.4, .2, .045], [-.9, -.3, .05], [2.2, .5, .04]]) add(G.sph(s, 8, 6), LEAF, .84 + Math.sin(a) * Math.cos(b) * .085, .985 + Math.sin(b) * .085, z0 - .23 + Math.cos(a) * Math.cos(b) * .085, 0, a, 0, [1, .8, .35]);
    add(G.box(.24, .035, .17, .006), TOMATO, .8, .805 + .0175, z0 + .19, 0, .15, 0);
    add(G.box(.22, .03, .16, .006), MINT, .81, .805 + .05, z0 + .19, 0, -.1, 0);
  }));
  f.add(put(mesh(geo('fu-bulb', () => new THREE.SphereGeometry(.034, 10, 8)), glowMat()), -.632, 1.118, -.224));
  const inner = shade(body, -.1);
  const drawer = (y, h, c, k, ih, label, spotH, sy, scale) => {
    const pv = new THREE.Group(); put(pv, .62, y, z0 + .37);
    pv.add(mc('desk-drawer' + k + '|' + tk, ({ add }) => {
      add(G.box(.5, h, .04, .016), c, 0, 0, 0);
      add(G.box(.4, h - .09, .012, .008), shade(c, .07), 0, 0, .026);
      for (const sx of [-1, 1]) add(G.cyl(.01, .01, .028, 8), shade(knob, -.12), sx * .05, h > .3 ? .07 : 0, .046, HP, 0, 0);
      add(G.cap(.013, .11, 2, 8), knob, 0, h > .3 ? .07 : 0, .06, 0, 0, HP);
      add(G.pbox(.44, .02, .6), inner, 0, -h / 2 + .03, -.3);
      for (const sx of [-1, 1]) add(G.pbox(.02, ih, .6), inner, sx * .21, -h / 2 + .03 + ih / 2, -.3);
      add(G.pbox(.44, ih, .02), inner, 0, -h / 2 + .03 + ih / 2, -.59);
    }));
    f.add(pv);
    const p = f.part('drawer', pv, (t, b) => { pv.position.z = b.p.z + .45 * t; }, { label, sfx: 'drawer', dur: .26 });
    f.spot('inside', pv, 0, sy, -.3, { part: p, maxH: spotH, label, scale });
  };
  drawer(.58, .22, acc, 'a', .13, '책상 서랍', .14, -.07, .85);
  drawer(.27, .34, acc2, 'b', .25, '책상 아래 서랍', .3, -.14, .9);
  f.spot('on', null, -.3, .805, z0 - .12, { maxH: .45, label: '책상 위' });
  f.spot('on', null, .45, .805, z0 - .05, { maxH: .45, label: '책상 위' });
  f.spot('under', null, -.4, 0, z0 - .05, { maxH: .5, label: '책상 밑' });
};

// 책장 (1×1): an open honey bookcase with a pastel back — rows of books (spine bands, one leaning), a gap on each shelf
// where something can sit, and a little potted plant and a photo on top.
B.bookshelf = (f, T, o = {}) => {
  const { wood, woodD } = woods(T), backC = shade(T.accent2, .12), pot = T.pot || '#ff9b73';
  const W = .9, H = 1.84, D = .36, z0 = -.3, back = z0 - D / 2;
  const levels = [.085, .64, 1.2];
  f.add(wd('bookshelf', wood, ({ box }) => {
    for (const sx of [-1, 1]) box(.045, H, D, sx * (W / 2 - .0225), H / 2, z0, { r: .01 });
    box(W - .09, .045, D - .02, 0, .0625, z0 + .01, { r: .006 });
    for (const y of levels.slice(1)) box(W - .09, .035, D - .03, 0, y - .0175, z0 + .01, { r: .006 });
    box(W + .05, .045, D + .04, 0, H + .0225, z0 + .01, { r: .012 });
  }));
  const r = rng((o.seed || 7) * 97 + 3), r2 = rng((o.seed || 7) * 31 + 5);
  const cols = ['#ff8f7a', '#8fd3f4', '#ffd23f', '#9be38f', '#c9a7ff', '#ffb07a', '#7fb7ff', '#ff9fb5', '#7fd6c0'];
  const books = [], gaps = [];
  levels.forEach((y, li) => {
    const gapAt = r() < .5 ? -.2 : .2;
    let x = -.4;
    while (x < .4) {
      if (x > gapAt - .17 && x < gapAt + .17) { x = gapAt + .18; continue; }
      const w = .06 + r() * .05, h = .24 + r() * .14;
      if (x + w > .41) break;
      books.push({ x: x + w / 2, y, w, h, c: r.pick(cols), lean: r() < .12, d: .22 + r2() * .06, band: r2() });
      x += w + .006;
    }
    gaps.push(gapAt);
  });
  const tk = [wood, woodD, backC, pot, o.seed || 7].join(',');
  f.add(mc('bookshelf|' + tk, ({ add, tube }) => {
    add(G.pbox(W - .09, H - .085, .015), backC, 0, .085 + (H - .085) / 2, back + .0225);
    add(G.box(W - .1, .06, .02, .006), woodD, 0, .03, z0 + D / 2 - .03);
    for (const b of books) {
      const zc = back + .03 + b.d / 2, front = zc + b.d / 2;
      const rz = b.lean ? .12 : 0, yc = b.y + b.h / 2 - (b.lean ? .004 : 0), M = xf(b.x, yc, zc, 0, 0, rz);
      add(G.box(b.w, b.h, b.d, .008), b.c, b.x, yc, zc, 0, 0, rz);
      if (b.band > .3) {
        const bc = b.band > .7 ? GOLD : shade(b.c, b.band > .5 ? .2 : -.18);
        for (const dy of [b.h / 2 - .045, -b.h / 2 + .05]) add(G.pbox(b.w * .82, .018, .006), bc, b.x - Math.sin(rz) * dy, yc + Math.cos(rz) * dy, front + .004, 0, 0, rz);
      }
      if (b.band < .15) add(G.box(b.w * .6, .03, .006, .002), WHITE, b.x, yc + .02, front + .004, 0, 0, rz);
    }
    // on top: a little plant and a photo on a stand
    pottedPlant(add, -.24, H + .045, z0 - .02, pot, 1.15);
    add(G.box(.13, .16, .02, .006), WHITE, .24, H + .045 + .085, z0 - .02, -.14, -.2, 0);
    add(G.box(.035, .1, .012, .004), woodD, .24 - .005, H + .045 + .05, z0 - .05, .45, -.2, 0);
  }));
  f.add(mg('bookshelf-photo', atlasMat(), ({ addM }) => addM(quadGeo(.11, .126, RG.photo2), xf(.24, H + .045 + .085, z0 - .02, -.14, -.2, 0).multiply(xf(0, .004, .016)))));
  gaps.forEach((gapAt, li) => f.spot('on', null, gapAt, levels[li], z0 + .03, { maxH: .5, label: `책장 ${3 - li}층`, scale: .85 }));
};

// ═════════════════════════════════════════════ LIVING ═════════════════════════════════════════════
// 소파 (2×1): a plump fabric sofa with rounded arms, a button-tufted back and two piped seat cushions (they lift); a
// contrast throw pillow with daisies rides on the left cushion, a knitted throw hangs over the right arm.
B.sofa = (f, T) => {
  const { woodD } = woods(T), fab = T.fabric, fab2 = T.fabric2, pc = T.accent2, thr = T.accent3 || MUSTARD;
  const tk = [woodD, fab, fab2, pc, thr].join(','), fabD = shade(fab, -.05);
  f.add(mc('sofa|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const z of [-.22, .36]) add(G.cyl(.034, .024, .08, 10), woodD, sx * .8, .04, z);
    add(G.box(1.76, .3, .74, .09, 2), fabD, 0, .23, .07);
    add(G.box(1.74, .58, .22, .1, 2), fab, 0, .64, -.19);
    for (const sx of [-1, 1]) add(G.box(.2, .46, .74, .09, 2), fab, sx * .87, .43, .07);
    for (const sx of [-1, 1]) for (const x of [.22, .6]) for (const y of [.62, .79]) add(G.sph(.022, 8, 6), shade(fab, -.14), sx * x + (y > .7 ? sx * -.19 : 0), y, -.08 + .004, 0, 0, 0, [1, 1, .45]);
    add(G.cyl(.012, .012, 1.56, 8), shade(fab, -.1), 0, .9, -.08, 0, 0, HP);
  }));
  f.add(pm('sofa-throw|' + thr, mat('#ffffff', { map: knitTex(thr) }), .14, ({ box }) => {
    box(.23, .02, .5, .87, .668, .1, { r: .008 });
    box(.016, .32, .5, .978, .52, .1, { r: .006 });
  }));
  f.add(mc('sofa-fringe|' + thr, ({ add }) => { for (let i = 0; i < 8; i++) add(G.cap(.007, .03, 2, 4), shade(thr, -.12), .978, .345, -.12 + i * .063); }));
  const cushion = (sx, deco) => {
    const pv = new THREE.Group(); put(pv, sx * .4, .46, .17); f.add(pv);
    pv.add(mc('sofa-cushion' + sx + '|' + tk, ({ add }) => {
      add(G.box(.74, .14, .5, .06, 2), fab2, 0, 0, 0);
      add(G.box(.752, .024, .512, .01), shade(fab2, -.1), 0, 0, 0);
      for (const dx of [-.18, .18]) add(G.sph(.016, 8, 6), shade(fab2, -.12), dx, .07, 0, 0, 0, 0, [1, .4, 1]);
      if (deco) deco(add);
    }));
    const p = f.part('lift', pv, (t, b) => { pv.position.y = b.p.y + .34 * t; pv.position.z = b.p.z + .04 * t; pv.rotation.x = -.42 * t; pv.rotation.z = sx * .1 * t; }, { label: '소파 쿠션', sfx: 'lift' });
    f.spot('inside', null, sx * .4, .39, .17, { part: p, maxH: .25, label: '소파 쿠션 밑' });
  };
  cushion(-1, add => {
    const M = xf(-.2, .2, -.13, -.25, .3, .1);
    const P = (g, c, x, y, z, s) => add(g, c, ...new THREE.Vector3(x, y, z).applyMatrix4(M).toArray(), -.25, .3, .1, s);
    P(G.box(.32, .3, .11, .05, 2), pc, 0, 0, 0);
    for (const [x, y] of [[-.07, .07], [.07, -.06], [.08, .08], [-.06, -.07]]) {
      for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2 + HP; P(G.sph(.016, 8, 6), WHITE, x + Math.cos(a) * .017, y + Math.sin(a) * .017, .055 + .006, [1, 1, .3]); }
      P(G.sph(.011, 8, 6), MUSTARD, x, y, .055 + .008, [1, 1, .4]);
    }
  });
  cushion(1, null);
  f.spot('behind', null, .5, 0, -.39, { maxH: .5, label: '소파 뒤', scale: .78 });
};

// 장난감 상자 (1×1): a painted toy chest with honey corner posts and plinth, ABC blocks across the front, two stars, rope
// handles and a padded lid with a big star; a pile of soft toys inside lifts what hides there into view.
B.chest = (f, T) => {
  const { wood, woodD } = woods(T), acc = T.accent, acc2 = T.accent2, acc3 = T.accent3 || MUSTARD;
  const tk = [wood, woodD, acc, acc2, acc3].join(',');
  const W = .8, H = .48, D = .58, z0 = -.05, y0 = .04, t = .045, inner = shade(acc, -.07), fz = z0 + D / 2, bz = z0 - D / 2, top = y0 + H;
  f.add(mc('chest|' + tk, ({ add }) => {
    add(G.box(W - .04, H, t, .01), acc, 0, y0 + H / 2, fz - t / 2);
    add(G.box(W - .04, H, t, .01), acc, 0, y0 + H / 2, bz + t / 2);
    for (const sx of [-1, 1]) add(G.box(t, H, D - .04, .01), acc, sx * (W / 2 - t / 2), y0 + H / 2, z0);
    add(G.pbox(W - 2 * t, .02, D - 2 * t), inner, 0, y0 + .01, z0);
    for (const sz of [-1, 1]) add(G.pbox(W - 2 * t - .004, H - .03, .006), inner, 0, y0 + .02 + (H - .03) / 2, z0 + sz * (D / 2 - t - .003));
    for (const sx of [-1, 1]) add(G.pbox(.006, H - .03, D - 2 * t - .004), inner, sx * (W / 2 - t - .003), y0 + .02 + (H - .03) / 2, z0);
    // stars flanking the lock, rope handles
    for (const sx of [-1, 1]) add(G.ext(starShape(.06, .027), .01, 0, 2), acc3, sx * .26, .41, fz + .002);
    for (const sx of [-1, 1]) {
      add(G.box(.014, .05, .03, .004), woodD, sx * (W / 2 + .007), .36, z0 - .06);
      add(G.box(.014, .05, .03, .004), woodD, sx * (W / 2 + .007), .36, z0 + .06);
      add(G.tor(.06, .012, PI, 4, 12), '#f3e2c0', sx * (W / 2 + .02), .36, z0, 0, sx * HP, PI);
    }
    // soft toys: lumps of colour, a little drum
    [[CORAL, -.2, -.08, .13], [SKY, .18, -.12, .12], [MUSTARD, -.04, .1, .12], [MINT, .22, .1, .11], [LILAC, -.24, .12, .11]].forEach(([c, x, z, r]) => add(G.sph(r, 12, 8), c, x, .12, z0 + z, 0, x * 4, 0, [1, .55, 1]));
    add(G.cyl(.07, .07, .08, 14), TOMATO, .02, .14, z0 - .14, HP, 0, .4);
    add(G.cyl(.072, .072, .012, 14), WHITE, .02 - .037, .14 + .0, z0 - .14 + .0, HP, 0, .4);
  }));
  f.add(wd('chest-wood', wood, ({ box }) => {
    box(W + .04, .05, D + .04, 0, .025, z0, { r: .015 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(.07, top - .026, .07, sx * (W / 2 - .02), .02 + (top - .026) / 2, z0 + sz * (D / 2 - .02), { r: .015, vert: true });
    box(W - .12, .04, .012, 0, top - .03, fz + .006, { r: .004 });
    box(W - .12, .03, .012, 0, .075, fz + .006, { r: .004 });
  }));
  f.add(mg('chest-abc', atlasMat(), ({ add }) => add(quadGeo(.52, .17, RG.abc), 0, .2, fz + .006)));
  // the padded lid, hinged on the back top edge
  const lid = new THREE.Group(); put(lid, 0, top, bz); f.add(lid);
  lid.add(wd('chest-lidrim', wood, ({ box }) => box(W + .06, .05, D + .06, 0, .025, D / 2, { r: .015 })));
  lid.add(mc('chest-lid|' + tk, ({ add }) => {
    add(G.box(W - .04, .07, D - .06, .03, 2), acc2, 0, .075, D / 2);
    add(G.ext(starShape(.1, .045), .008, 0, 2), acc3, 0, .11 + .002, D / 2 + .1, -HP, 0, 0);
    for (const sx of [-1, 1]) add(G.ext(heartShape(.04), .006, 0, 6), WHITE, sx * .24, .11 + .002, D / 2 - .1, -HP, 0, 0);
    for (const sx of [-1, 1]) add(G.box(.05, .056, .03, .008), GOLD, sx * (W / 2 + .015), .025, D + .02);
    add(G.box(.07, .08, .012, .004), GOLD, 0, -.01, D + .036);
  }));
  const p = f.part('lid', lid, (t) => { lid.rotation.x = -1.75 * t; }, { label: '장난감 상자', sfx: 'open', dur: .3 });
  p.lockable = true;
  f.lockAt = { x: 0, y: .42, z: z0 + D / 2 + .04 };
  f.spot('inside', null, 0, .2, z0, { part: p, maxH: .42, label: '장난감 상자 안' });
};

// 금고 (1×1): a chunky steel-blue safe on little feet — hinge barrels, corner rivets, a brass combination dial, a spoked
// handle wheel and a gold '금고' plate; gold bars and coins inside, a piggy bank on top.
B.safe = (f, T) => {
  const W = .7, H = .7, D = .58, z0 = -.12, y0 = .03, c = '#8fa0d6', c2 = '#a9b8ea', inner = '#5f6d9e', fz = z0 + D / 2;
  f.add(mc('safe', ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.035, .03, y0, 10), CHAR, sx * (W / 2 - .07), y0 / 2, z0 + sz * (D / 2 - .07));
    add(G.box(W, H, .06, .03), c, 0, y0 + H / 2, z0 - D / 2 + .03);
    for (const sx of [-1, 1]) add(G.box(.06, H, D, .03), c, sx * (W / 2 - .03), y0 + H / 2, z0);
    add(G.box(W, .06, D, .03), c, 0, y0 + H - .03, z0);
    add(G.box(W, .045, D, .02), c, 0, y0 + .0225, z0);
    add(G.pbox(W - .12, H - .105, .01), inner, 0, y0 + .045 + (H - .105) / 2, z0 - D / 2 + .065);
    add(G.pbox(W - .12, .006, D - .08), inner, 0, y0 + .048, z0 + .01);
    for (const dy of [-.2, .2]) add(G.cyl(.024, .024, .11, 12), STEEL2, -W / 2 + .01, y0 + H / 2 + dy, fz + .03);
    for (const sx of [-1, 1]) for (const dz of [-.2, 0, .2]) for (const y of [y0 + .06, y0 + H - .06]) add(G.sph(.014, 8, 6), STEEL, sx * (W / 2 + .001), y, z0 + dz, 0, 0, 0, [.5, 1, 1]);
    // gold bars and a coin stack inside
    for (const [x, y, z] of [[-.2, 0, -.33], [-.2, 0, -.24], [-.2, .05, -.285]]) add(G.box(.1, .05, .085, .01), GOLD, x, y0 + .051 + .025 + y, z);
    for (let k = 0; k < 4; k++) add(G.cyl(.04, .04, .012, 14), shade(GOLD, -.04 * (k % 2)), .2 + (k % 2) * .004, y0 + .051 + .006 + k * .013, -.32);
    // piggy bank on top
    const px = .12, py = y0 + H + .095, pz = z0 - .06, pig = '#ffb3c6';
    add(G.sph(.1, 16, 12), pig, px, py, pz, 0, 0, 0, [1.25, .95, 1]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.024, .02, .05, 8), pig, px + sx * .07, py - .08, pz + sz * .05);
    add(G.cyl(.04, .042, .04, 14), shade(pig, -.06), px + .128, py, pz, 0, 0, HP);
    for (const dz of [-.014, .014]) add(G.sph(.009, 6, 4), '#d96a8a', px + .149, py, pz + dz, 0, 0, 0, [.5, 1, 1]);
    for (const dz of [-.05, .05]) { add(G.cone(.03, .05, 6), pig, px + .07, py + .09, pz + dz, 0, 0, -.4); add(G.sph(.012, 6, 4), INK, px + .1, py + .03, pz + dz * .8, 0, 0, 0, [.6, 1, 1]); }
    add(G.box(.06, .012, .012, .003), CHAR, px - .02, py + .094, pz);
    add(G.tor(.02, .006, PI * 1.5, 3, 8), pig, px - .13, py + .02, pz, 0, HP, 0);
  }));
  const pv = new THREE.Group(); put(pv, -W / 2 + .02, y0 + H / 2, fz + .03);
  const cx = W / 2 - .02, dx = cx - .06, dy = .08, hx = cx + .2, hy = 0;
  pv.add(mc('safe-door', ({ add, tube }) => {
    add(G.box(W - .03, H - .03, .07, .03), c2, cx, 0, 0);
    add(G.box(W - .17, H - .17, .008, .02), shade(c2, .05), cx, 0, .037);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(G.sph(.016, 8, 6), STEEL, cx + sx * .29, sy * .29, .035 + .002, 0, 0, 0, [1, 1, .5]);
    add(G.cyl(.09, .09, .03, 28), GOLD, dx, dy, .035 + .015, HP, 0, 0);
    add(G.cyl(.032, .036, .03, 16), shade(GOLD, -.15), dx, dy, .08 + .015, HP, 0, 0);
    add(G.box(.014, .03, .008, .003), TOMATO, dx, dy + .115, .041 + .004);
    add(G.cyl(.026, .026, .04, 14), STEEL2, hx, hy, .035 + .02, HP, 0, 0);
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + HP; tube([hx, hy, .065], [hx + Math.cos(a) * .07, hy + Math.sin(a) * .07, .065], .01, STEEL, 6); add(G.sph(.017, 8, 6), STEEL, hx + Math.cos(a) * .075, hy + Math.sin(a) * .075, .065); }
    add(G.box(.16, .06, .008, .003), shade(GOLD, -.1), cx, .265, .041 + .004);
  }));
  pv.add(mg('safe-prints', atlasMat(), ({ add }) => {
    add(discGeo(.082, RG.dial), dx, dy, .065 + .006);
    add(quadGeo(.14, .045, RG.plate), cx, .265, .049 + .006);
  }));
  f.add(pv);
  const p = f.part('door', pv, (t) => { pv.rotation.y = -1.8 * t; }, { label: '금고', sfx: 'open', dur: .34 });
  p.lockable = true;
  f.lockAt = { x: W / 2 - .02, y: -.17, z: .07, parent: pv };
  f.spot('inside', null, 0, .075, z0, { part: p, maxH: .5, label: '금고 안' });
};

// 화분 (1×1): a leafy fiddle-leaf plant in a glazed pot with a cream dotted band, on a saucer; a little name stake in the
// soil. Things hide behind the pot or sit on the soil.
B.plant = (f, T) => {
  const pot = T.pot || '#ff9b73', tk = [pot].join(',');
  const LV = [];   // [direction, height, radius, tilt up, size, colour]: four tiers of big round leaves
  [[.72, .07, .28, .36, 0], [.9, .06, .5, .36, .8], [1.08, .05, .74, .34, .2], [1.26, .04, 1.0, .31, 1.0]].forEach(([y, r, e, sz, a0], ti) => {
    const n = ti === 3 ? 3 : 4;
    for (let k = 0; k < n; k++) LV.push([a0 + k / n * PI * 2 + (k % 2) * .25, y + (k % 2) * .04, r, e + (k % 2) * .08, sz - (k % 2) * .03, [LEAF2, LEAF, LEAF3][(k + ti) % 3]]);
  });
  f.add(mc('plant|' + tk, ({ add, addM, tube }) => {
    add(G.cyl(.235, .2, .025, 24), shade(pot, -.14), 0, .0125, 0);
    add(G.lathe([[0, .025], [.19, .025], [.2, .035], [.245, .36], [.272, .37], [.274, .43], [.252, .432], [.242, .4], [0, .4]], 26), pot, 0, 0, 0);
    add(G.cyl(.244, .244, .02, 24), SOIL, 0, .405, 0);
    add(G.cyl(.2335, .2247, .07, 26, true), CREAM, 0, .2, 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; add(G.sph(.014, 8, 6), shade(pot, -.06), Math.sin(a) * .2335, .2, Math.cos(a) * .2335, 0, a, 0, [1, 1, .35]); }
    // trunk + leaves
    tube([0, .4, -.02], [.02, .9, -.03], .024, '#8a6a4a', 8); tube([.02, .9, -.03], [-.01, 1.28, -.02], .017, '#8a6a4a', 8);
    const leaf = G.ext(leafShape(.66), .02, 0, 5), rib = G.pbox(.02, .82, .01);
    for (const [a, y, r, e, s, c] of LV) {
      const P = [Math.sin(a) * r, y, Math.cos(a) * r - .02];
      tube([0, y - .04, -.02], P, .008, LEAF2, 5);
      const M = new THREE.Matrix4().makeTranslation(...P).multiply(new THREE.Matrix4().makeRotationY(a + PI)).multiply(new THREE.Matrix4().makeRotationX(-HP + e)).multiply(new THREE.Matrix4().makeScale(s, s, s));
      addM(leaf, M, c);
      addM(rib, M.clone().multiply(xf(0, .48, .02 + .01)), shade(c, .14));
    }
    // a name stake in the soil
    tube([-.15, .41, -.1], [-.15, .56, -.1], .006, '#c98f58', 4);
    add(G.box(.08, .05, .008, .003), WHITE, -.15, .56, -.1 + .008);
    add(G.ext(heartShape(.018), .004, 0, 4), TOMATO, -.15, .56, -.1 + .012 + .002);
  }));
  f.spot('behind', null, 0, 0, -.4, { maxH: .5, label: '화분 뒤', scale: .7 });
  f.spot('on', null, .08, .42, .08, { maxH: .3, label: '화분 흙 위', scale: .7 });
};

// 러그 (2×2): a round scalloped rug — a contrast border, dotted rings, a ring of hearts and a flower medallion. It lifts
// at the front to show what slipped under it.
B.rug = (f, T) => {
  const c1 = T.rug || '#ffd1e0', c2 = T.rug2 || WHITE, c3 = T.accent2 || SKY, R = .9;
  const pv = new THREE.Group(); put(pv, 0, 0, -.88); f.add(pv);
  const rug = mg('rug|' + c1 + c2 + c3, mat('#ffffff', { map: rugTex(c1, c2, c3) }), ({ addM }) => {
    addM(boxUV(G.ext(scallopShape(R - .04, .04, 30), .03, 0, 2), -R, -R, 2 * R, 2 * R), xf(0, 0, .88, -HP, 0, 0));
  });
  rug.castShadow = false; pv.add(rug);
  const p = f.part('lift', pv, (t) => { pv.rotation.x = -.62 * t; }, { label: '러그', sfx: 'lift', dur: .32 });
  f.spot('inside', null, -.3, 0, .18, { part: p, maxH: .09, label: '러그 밑' });
  f.spot('inside', null, .32, 0, -.12, { part: p, maxH: .09, label: '러그 밑' });
  f.floor = true;
};

// 쿠키 탁자 (1×1): a round honey table on a turned pedestal and cross feet, a lace doily under a glazed cookie jar (printed
// '쿠키' band, a lid with a wooden knob that lifts) and a daisy in a bud vase.
B.table = (f, T) => {
  const { wood, woodD } = woods(T), acc = T.accent, acc2 = T.accent2, tk = [wood, woodD, acc, acc2].join(',');
  const jx = -.15, jz = -.08, jy = .696, jarC = acc2, jarIn = shade(acc2, -.2);
  f.add(wd('table-top', wood, ({ geo }) => geo(G.cyl(.46, .46, .05, 40), xf(0, .665, 0))));
  f.add(mc('table|' + tk, ({ add, tube }) => {
    add(G.cyl(.4, .38, .05, 32), woodD, 0, .615, 0);
    add(G.lathe([[0, .06], [.06, .06], [.072, .1], [.046, .2], [.05, .3], [.078, .38], [.052, .46], [.046, .55], [.072, .59], [0, .59]], 16), woodD, 0, 0, 0);
    for (const a of [PI / 4, -PI / 4]) add(G.box(.6, .06, .08, .03), woodD, 0, .03, 0, 0, a, 0);
    for (let i = 0; i < 4; i++) { const a = PI / 4 + i * HP; add(G.sph(.045, 10, 8), wood, Math.cos(a) * .3, .03, Math.sin(a) * .3, 0, 0, 0, [1, .7, 1]); }
    // lace doily
    add(G.ext(scallopShape(.17, .02, 14), .006, 0, 2), WHITE, jx, .69, jz, -HP, 0, 0);
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; add(G.sph(.012, 6, 4), '#f1e8f5', jx + Math.cos(a) * .15, .696, jz + Math.sin(a) * .15, 0, 0, 0, [1, .3, 1]); }
    // the jar: glazed outside + rim, a darker inside
    add(G.lathe([[0, 0], [.1, 0], [.13, .04], [.14, .1], [.126, .17], [.11, .193], [.116, .2], [.098, .2]], 24), jarC, jx, jy, jz);
    add(G.lathe([[.097, .2], [.108, .17], [.12, .1], [.105, .07], [0, .07]], 24), jarIn, jx, jy, jz);
    // a daisy in a bud vase
    add(G.lathe([[0, 0], [.035, 0], [.045, .04], [.024, .1], [.02, .12], [.028, .13], [0, .13]], 12), WHITE, .2, .69, -.25);
    tube([.2, .8, -.25], [.21, .93, -.25], .005, LEAF2, 4);
    add(G.sph(.02, 8, 6), LEAF, .19, .87, -.24, 0, 0, .6, [1.4, .5, .6]);
    flower(add, .21, .94, -.25, 1.4, WHITE, MUSTARD);
  }));
  f.add(mg('table-label', atlasMat(), ({ add }) => add(bandGeo(.146, .06, RG.cookie, 1.7), jx, jy + .1, jz)));
  const lid = grp(mc('table-lid|' + tk, ({ add }) => {
    add(G.lathe([[0, -.01], [.122, -.01], [.124, .004], [.1, .035], [.05, .052], [0, .056]], 24), acc, 0, 0, 0);
    add(G.sph(.034, 12, 8), wood, 0, .075, 0);
    add(G.cyl(.016, .02, .02, 8), wood, 0, .055, 0);
  }));
  put(lid, jx, jy + .21, jz); f.add(lid);
  const p = f.part('lift', lid, (t, b) => { lid.position.y = b.p.y + .26 * t; lid.position.x = b.p.x - .12 * t; lid.rotation.z = .6 * t; }, { label: '쿠키 단지', sfx: 'lift' });
  f.spot('inside', null, jx, jy + .07, jz, { part: p, maxH: .32, label: '쿠키 단지 안', scale: .8 });
  f.spot('on', null, .2, .69, .14, { maxH: .45, label: '탁자 위' });
  f.spot('under', null, .05, 0, .28, { maxH: .4, label: '탁자 밑', scale: .85 });
};

// ═════════════════════════════════════════════ KITCHEN ═════════════════════════════════════════════
// 냉장고 (1×1): a retro two-door fridge in the theme's second colour — chrome handles, magnets, a kid's drawing, a
// calendar and a photo; jars, eggs and juice on the shelves, bottles in the door pockets, a cookie tin and a plant on top.
B.fridge = (f, T) => {
  const W = .86, H = 1.86, D = .64, z0 = -.16, y0 = .04, body = '#f6f8fc', inner = '#e4f0fa', shelfC = '#cfe6f5', dc = T.accent2, pot = T.pot || '#ff9b73', fz = z0 + D / 2, top = y0 + H;
  const tk = [dc, pot].join(',');
  f.add(mc('fridge|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.03, .03, y0, 8), CHAR, sx * (W / 2 - .07), y0 / 2, z0 + sz * (D / 2 - .07));
    add(G.box(W - .1, .036, .02, .006), CHAR, 0, .02, fz - .03);
    add(G.box(W, H, .045, .02), body, 0, y0 + H / 2, z0 - D / 2 + .0225);
    for (const sx of [-1, 1]) add(G.box(.045, H, D, .02), body, sx * (W / 2 - .0225), y0 + H / 2, z0);
    add(G.box(W, .045, D, .02), body, 0, top - .0225, z0);
    add(G.pbox(W - .09, .045, D - .045), inner, 0, y0 + .0225, z0 + .0225);
    add(G.pbox(W - .1, H - .1, .008), inner, 0, y0 + H / 2, z0 - D / 2 + .049);
    add(G.pbox(W - .09, .03, D - .08), shelfC, 0, .62, z0 - .01);
    add(G.box(W - .06, .05, D - .04, .01), body, 0, 1.26, z0 + .02);
    // inside: jam jars, a lettuce, eggs, juice; an ice-cream tub and an ice tray in the freezer
    for (const [x, c] of [[.28, TOMATO], [.32, MUSTARD]]) { add(G.cyl(.045, .045, .09, 12), HONEY, x, .085 + .045, z0 - .16 + (x - .3) * 3); add(G.cyl(.048, .048, .025, 12), c, x, .085 + .1, z0 - .16 + (x - .3) * 3); }
    add(G.sph(.08, 12, 8), LEAF3, -.28, .085 + .07, z0 - .12, 0, 0, 0, [1, .85, 1]); add(G.sph(.05, 10, 6), LEAF, -.28, .085 + .1, z0 - .12, 0, .5, 0, [1.2, .6, 1]);
    add(G.box(.18, .05, .1, .01), WHITE, -.27, .635 + .025, z0 - .16);
    for (let k = 0; k < 3; k++) add(G.sph(.026, 8, 6), '#fff0d8', -.33 + k * .06, .635 + .06, z0 - .16, 0, 0, 0, [1, 1.2, 1]);
    add(G.cyl(.04, .04, .22, 12), ORANGE, .3, .635 + .11, z0 - .16); add(G.cyl(.02, .02, .04, 8), WHITE, .3, .635 + .24, z0 - .16);
    add(G.cyl(.07, .065, .12, 16), WHITE, -.28, 1.285 + .06, z0 - .14); add(G.cyl(.074, .074, .02, 16), BLUSH, -.28, 1.285 + .13, z0 - .14);
    add(G.box(.22, .04, .12, .01), SKY2, .24, 1.285 + .02, z0 - .14);
    // on top: a cookie tin and a little plant
    add(G.cyl(.1, .1, .1, 20), TOMATO, -.2, top + .05, z0 - .08);
    add(G.cyl(.104, .104, .025, 20), WHITE, -.2, top + .1, z0 - .08);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; add(G.sph(.012, 6, 4), WHITE, -.2 + Math.sin(a) * .1, top + .05, z0 - .08 + Math.cos(a) * .1, 0, a, 0, [1, 1, .4]); }
    pottedPlant(add, .22, top, z0 - .1, pot, 1.2);
  }));
  const zf = fz + .03;
  const door = (key, h, py, hy, hh, deco, prints) => {
    const pv = new THREE.Group(); put(pv, -W / 2 + .01, py, zf);
    pv.add(mc('fridge-door' + key + '|' + tk, ({ add, tube }) => {
      add(G.box(W - .01, h, .07, .05), dc, W / 2, 0, 0);
      add(G.box(W - .07, h - .06, .01, .004), shade(dc, -.06), W / 2, 0, -.035 - .006);
      // chrome handle
      for (const dy of [-hh / 2 + .02, hh / 2 - .02]) add(G.cyl(.012, .012, .03, 8), STEEL2, W - .1, hy + dy, .045, HP, 0, 0);
      add(G.cap(.017, hh - .02, 2, 8), STEEL, W - .1, hy, .065);
      deco(add, tube);
    }));
    pv.add(mg('fridge-prints' + key, atlasMat(), ({ add }) => prints(add)));
    f.add(pv); return pv;
  };
  const Z = .035;
  const main = door('M', 1.2, .66, .15, .34, (add, tube) => {
    add(G.ext(heartShape(.08), .014, 0, 6), TOMATO, .2, .42, Z + .004);
    add(G.ext(starShape(.05, .022), .012, 0, 2), MUSTARD, .62, -.32, Z + .004);
    add(G.cyl(.016, .016, .012, 10), MINT, .3, .07, Z + .016, HP, 0, 0);
    add(G.cyl(.016, .016, .012, 10), SKY, .56, .36, Z + .016, HP, 0, 0);
    // door pockets with bottles (inside)
    for (const y of [-.38, 0, .34]) { add(G.box(W - .16, .09, .07, .01), SKY2, W / 2, y - .02, -.035 - .045); }
    for (const [x, y, c, hgt] of [[.2, -.38, TOMATO, .18], [.32, -.38, MUSTARD, .16], [.52, 0, CORAL, .14], [.64, .34, LEAF3, .12]]) add(G.cyl(.032, .032, hgt, 10), c, x, y + hgt / 2 - .05, -.08);
  }, add => {
    add(quadGeo(.22, .176, RG.kid), .3, .1, Z + .006, 0, 0, -.05);
    add(quadGeo(.13, .148, RG.photo), .56, .28, Z + .006, 0, 0, .08);
  });
  const frz = door('F', .58, 1.57, -.12, .2, (add) => {
    add(G.sph(.034, 12, 8), ORANGE, .64, .17, Z + .012, 0, 0, 0, [1, .9, .3]);
    for (const k of [-1, 1]) add(G.cone(.014, .026, 6), ORANGE, .64 + k * .022, .2, Z + .01, 0, 0, -k * .3, [1, 1, .4]);
    for (const k of [-1, 1]) add(G.sph(.005, 5, 4), INK, .64 + k * .012, .172, Z + .024, 0, 0, 0, [1, 1, .5]);
    add(G.box(W - .16, .08, .06, .01), SKY2, W / 2, -.12, -.035 - .04);
    add(G.box(.13, .04, .012, .012), STEEL, .2, .19, Z + .006);
    add(G.box(.1, .016, .006, .004), dc, .2, .19, Z + .015);
  }, add => {
    add(quadGeo(.16, .2, RG.cal), .32, .02, Z + .006, 0, 0, .04);
  });
  const p1 = f.part('door', main, (t) => { main.rotation.y = -1.9 * t; }, { label: '냉장고', sfx: 'open' });
  const p2 = f.part('door', frz, (t) => { frz.rotation.y = -1.9 * t; }, { label: '냉동실', sfx: 'open' });
  f.spot('inside', null, 0, .08, z0, { part: p1, maxH: .5, label: '냉장고 아래칸' });
  f.spot('inside', null, 0, .64, z0, { part: p1, maxH: .55, label: '냉장고 위칸' });
  f.spot('inside', null, 0, 1.29, z0, { part: p2, maxH: .5, label: '냉동실' });
};

// 찬장 (1×1): a kitchen base cabinet — a honey butcher-block top with an upstand, a Shaker door with a chrome bar handle and
// a gingham tea towel, a dark kick plinth; bowls and a honey jar inside. The stove variant adds a black glass hob, two
// knobs on the top's front edge and a tomato pot whose lid lifts.
B.counter = (f, T, o = {}) => {
  const { wood, woodD } = woods(T), body = T.body || WHITE, acc = T.accent, acc2 = T.accent2, tw = T.accent3 || MUSTARD;
  const tk = [wood, woodD, body, acc, acc2, tw].join(',');
  const W = .94, D = .6, z0 = -.18, inner = shade(body, -.1), fz = z0 + D / 2;
  f.add(mc('counter|' + tk, ({ add }) => {
    add(G.pbox(W - .02, .86, .04), inner, 0, .43, z0 - D / 2 + .025);
    for (const sx of [-1, 1]) add(G.box(.045, .865, D, .012), body, sx * (W / 2 - .0225), .4325, z0);
    add(G.pbox(W - .09, .04, D - .04), inner, 0, .06, z0 + .02);
    add(G.box(W - .1, .075, .02, .006), shade(body, -.32), 0, .0375, fz - .04);
    add(G.pbox(W - .08, .03, D - .06), inner, 0, .44, z0);
    // bowls and a honey jar inside
    for (let k = 0; k < 3; k++) add(G.cyl(.09 - k * .004, .06, .045, 16), k % 2 ? SKY2 : WHITE, -.3, .08 + .0225 + k * .035, z0 - .1);
    add(G.cyl(.05, .05, .1, 12), HONEY, .32, .455 + .05, z0 - .1); add(G.cyl(.054, .054, .025, 12), acc2, .32, .455 + .1125, z0 - .1);
  }));
  f.add(wd('counter-top', wood, ({ box }) => {
    box(1.0, .07, .66, 0, .9, z0 + .02, { r: .015 });
    box(1.0, .065, .03, 0, .9675, -.475, { r: .008 });
  }));
  const pv = new THREE.Group(); put(pv, -W / 2 + .02, .46, fz + .025);
  const dcx = W / 2 - .02;
  pv.add(mc('counter-door|' + tk, ({ add }) => {
    add(G.box(W - .04, .76, .05, .016), acc, dcx, 0, 0);
    frameBars(add, dcx, 0, W - .06, .74, .075, .012, .025, shade(acc, -.07));
    for (const dy of [.08, .28]) add(G.cyl(.011, .011, .035, 8), STEEL2, W - .14, dy, .045, HP, 0, 0);
    add(G.cap(.013, .2, 2, 8), STEEL, W - .14, .18, .062);
  }));
  pv.add(pm('counter-towel|' + tw, mat('#ffffff', { map: ginghamTex(tw) }), .12, ({ box, geo }) => {
    box(.13, .22, .012, W - .14, .06, .084, { r: .004 });
    geo(G.cyl(.018, .018, .13, 10), xf(W - .14, .18, .075, 0, 0, HP));
  }));
  f.add(pv);
  const p = f.part('door', pv, (t) => { pv.rotation.y = -1.8 * t; }, { label: '찬장', sfx: 'open' });
  f.spot('inside', null, 0, .08, z0 + .12, { part: p, maxH: .34, label: '찬장 아래칸' });   // near the door: from above, the back of the low shelf can't be seen (bot stuck on a milk carton there, 10/18)
  f.spot('inside', null, 0, .46, z0 + .12, { part: p, maxH: .36, label: '찬장 위칸', scale: .9 });
  if (o.variant === 'stove') {
    const px = .2, pz = z0 - .02, pc = '#ff8f7a';
    f.add(mc('counter-stove', ({ add }) => {
      add(G.box(.52, .012, .5, .005), CHAR, .2, .935 + .006, z0 - .03);
      add(G.tor(.13, .007, PI * 2, 4, 28), '#ff7a5c', px, .949, pz, HP, 0, 0);
      add(G.tor(.07, .006, PI * 2, 4, 20), STEEL2, px, .949, pz, HP, 0, 0);
      for (let k = 0; k < 3; k++) add(G.sph(.008, 6, 4), k ? STEEL2 : '#7fffd4', .04 + k * .03, .948, .17 - .045, 0, 0, 0, [1, .4, 1]);
      for (const x of [.14, .32]) { add(G.cyl(.026, .026, .022, 14), WHITE, x, .9, .17 + .011, HP, 0, 0); add(G.box(.008, .028, .006, .002), CHAR, x, .905, .17 + .022 + .003); }
      // the pot
      add(G.lathe([[0, 0], [.15, 0], [.162, .012], [.168, .19], [.178, .198], [.176, .206], [.16, .206]], 26), pc, px, .948, pz);
      add(G.lathe([[.158, .206], [.155, .03], [0, .022]], 26), shade(pc, -.22), px, .948, pz);
      for (const sx of [-1, 1]) add(G.tor(.035, .012, PI, 4, 10), pc, px + sx * .19, 1.1, pz, 0, sx > 0 ? 0 : PI, -HP);
    }));
    const lid = grp(mc('counter-potlid', ({ add }) => {
      add(G.lathe([[0, -.012], [.18, -.012], [.182, 0], [.15, .028], [.06, .042], [0, .045]], 26), '#ffb3a6', 0, 0, 0);
      add(G.sph(.034, 10, 8), WHITE, 0, .06, 0);
    }));
    put(lid, px, 1.17, pz); f.add(lid);
    const lp = f.part('lift', lid, (t, b) => { lid.position.y = b.p.y + .28 * t; lid.position.x = b.p.x + .1 * t; lid.rotation.z = -.55 * t; }, { label: '냄비', sfx: 'lift' });
    f.spot('inside', null, px, .97, pz, { part: lp, maxH: .3, label: '냄비 안', scale: .8 });
    f.spot('on', null, -.22, .94, z0 + .05, { maxH: .45, label: '조리대 위' });
  } else {
    f.spot('on', null, -.18, .94, z0, { maxH: .45, label: '조리대 위' });
    f.spot('on', null, .22, .94, z0 + .05, { maxH: .45, label: '조리대 위' });
  }
};

// TV장 (2×1): a honey media console on tapered legs — two louvred doors in the theme's colours with round wooden knobs,
// game cases inside — and a TV playing a cheerful mochi game, a docked console and a little succulent on top.
B.tvstand = (f, T) => {
  const { wood, woodD } = woods(T), acc = T.accent, acc2 = T.accent2, pot = T.pot || '#ff9b73';
  const tk = [wood, woodD, acc, acc2, pot].join(',');
  const W = 1.84, H = .44, D = .5, z0 = -.2, y0 = .06, t = .045, back = z0 - D / 2, fz = z0 + D / 2;
  f.add(wd('tvstand', wood, ({ box }) => {
    box(W, t, D, 0, y0 + H - t / 2, z0, { r: .012 });
    box(W, t, D, 0, y0 + t / 2, z0, { r: .012 });
    for (const sx of [-1, 1]) box(t, H, D, sx * (W / 2 - t / 2), y0 + H / 2, z0, { r: .012 });
    box(t, H - 2 * t, D - .05, 0, y0 + H / 2, z0 + .005, { r: .004 });
  }));
  f.add(mc('tvstand|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.032, .022, y0, 10), woodD, sx * (W / 2 - .08), y0 / 2, z0 + sz * (D / 2 - .07));
    add(G.pbox(W - .09, H - .09, .012), shade(wood, -.16), 0, y0 + H / 2, back + .006);
    for (const sx of [-1, 1]) [TOMATO, SKY, MUSTARD, MINT].forEach((c, k) => add(G.box(.025, .2, .17, .006), c, sx * (.82 - k * .032), y0 + t + .1, z0 - .1));
    // TV
    const ty = y0 + H, tz = z0 - .06;
    add(G.box(.3, .025, .18, .01), CHAR, 0, ty + .0125, z0 - .02);
    add(G.box(.06, .12, .04, .01), CHAR, 0, ty + .08, tz - .02);
    add(G.box(1.04, .62, .08, .035), CHAR, 0, .92, tz);
    add(G.sph(.009, 6, 4), MINT, .46, .64, tz + .04 + .004, 0, 0, 0, [1, 1, .5]);
    // console with red / blue controllers
    const cx = -.3, cz = z0 + .06;
    add(G.box(.2, .1, .06, .015), CHAR, cx, ty + .05, cz);
    add(G.box(.24, .13, .018, .006), '#2f3346', cx, ty + .125, cz - .006);
    add(G.box(.035, .13, .018, .008), TOMATO, cx - .1375, ty + .125, cz - .006);
    add(G.box(.035, .13, .018, .008), SKY, cx + .1375, ty + .125, cz - .006);
    // a succulent at the right
    pottedPlant(add, .8, ty, z0 + .1, pot, 1.1);
  }));
  f.add(mg('tvstand-screen', screenMat(), ({ add }) => add(quadGeo(.96, .54, RG.tv), 0, .92, z0 - .06 + .04 + .006)));
  const zf = fz + .025, DW = W / 2 - .04, DH = H - .04;
  const door = (sx, c, key) => {
    const pv = new THREE.Group(); put(pv, sx * (W / 2 - .02), y0 + H / 2, zf);
    const cx = -sx * (W / 4 - .01);
    pv.add(mc('tvstand-door' + key + '|' + tk, ({ add }) => {
      add(G.box(DW, DH, .05, .018), c, cx, 0, 0);
      add(G.cyl(.032, .028, .025, 14), woodD, -sx * (W / 2 - .12), 0, .025 + .0125, HP, 0, 0);
      add(G.sph(.026, 10, 8), wood, -sx * (W / 2 - .12), 0, .055, 0, 0, 0, [1, 1, .6]);
    }));
    pv.add(pm('tvstand-louvre' + key + '|' + c, mat('#ffffff', { map: louvreTex(c) }), .16, ({ box }) => box(DW - .2, DH - .12, .012, cx + sx * .04, 0, .025 + .006, { r: 0 })));
    f.add(pv); return pv;
  };
  const L = door(-1, acc, 'L'), R = door(1, acc2, 'R');
  const pl = f.part('door', L, (t) => { L.rotation.y = -1.7 * t; }, { label: 'TV장 왼쪽', sfx: 'open' });
  const pr = f.part('door', R, (t) => { R.rotation.y = 1.7 * t; }, { label: 'TV장 오른쪽', sfx: 'open' });
  f.spot('inside', null, -.46, .1, z0, { part: pl, maxH: .3, label: 'TV장 왼쪽 칸' });
  f.spot('inside', null, .46, .1, z0, { part: pr, maxH: .3, label: 'TV장 오른쪽 칸' });
  f.spot('behind', null, .62, .5, z0 - .13, { maxH: .4, label: 'TV 뒤', scale: .75 });
  f.spot('on', null, -.62, .5, z0 + .02, { maxH: .4, label: 'TV장 위', scale: .85 });
};

// 휴지통 (1×1): a round pedal bin — a tapered glazed body with a chrome band, a recycle sticker, a pedal, a domed lid with
// a handle on a back hinge; crumpled paper inside.
B.trash = (f, T) => {
  const c = farFrom(T, [T.accent3, T.accent2, T.accent]), cD = shade(c, -.22), tk = [c].join(',');
  f.add(mc('trash|' + tk, ({ add }) => {
    add(G.cyl(.17, .165, .03, 22), CHAR, 0, .015, 0);
    add(G.lathe([[0, .03], [.165, .03], [.192, .5], [.205, .5], [.205, .518], [.18, .518]], 28), c, 0, 0, 0);
    add(G.lathe([[.178, .518], [.158, .06], [0, .06]], 28), cD, 0, 0, 0);
    add(G.cyl(.1865, .1842, .04, 28, true), STEEL, 0, .28, 0);
    add(G.box(.12, .025, .09, .01), STEEL2, 0, .045, .2);
    add(G.box(.05, .04, .04, .01), STEEL2, 0, .5, -.2);
    [[-.06, .2, .05, WHITE, .07], [.07, .19, -.04, '#fff3c9', .068], [0, .17, .08, '#e8f4ff', .065], [.05, .26, .07, WHITE, .06], [-.05, .27, -.05, '#fff3c9', .055]].forEach(([x, y, z, col, r]) => add(G.sph(r, 7, 5), col, x, y, z, .4, x * 9, 0));
  }));
  f.add(mg('trash-sticker', atlasMat(), ({ add }) => add(bandGeo(.179, .09, RG.sticker, 1.2), 0, .16, 0)));
  const pv = new THREE.Group(); put(pv, 0, .53, -.2);
  pv.add(mc('trash-lid|' + tk, ({ add }) => {
    add(G.lathe([[0, -.012], [.215, -.012], [.218, .0], [.2, .02], [.12, .04], [0, .045]], 28), shade(c, .06), 0, 0, .2);
    add(G.cap(.014, .1, 2, 6), WHITE, 0, .052, .2, 0, 0, HP);
    for (const sx of [-1, 1]) add(G.cyl(.012, .012, .02, 8), WHITE, sx * .05, .04, .2);
  }));
  f.add(pv);
  const p = f.part('lid', pv, (t) => { pv.rotation.x = -1.6 * t; }, { label: '휴지통', sfx: 'open' });
  f.spot('inside', null, 0, .33, 0, { part: p, maxH: .35, label: '휴지통 안', scale: .8 });
};

// 상자 (1×1): a kraft moving box — a '장난감' label with a bear, hand holes, 'this way up' arrows, tape running over the
// two flaps (they open) and down the sides; crumpled paper in the corners.
B.boxes = (f, T) => {
  const W = .72, H = .5, D = .68, t = .028, y0 = .01, [KR, KR2] = kraftFor(T), tk = KR;
  f.add(mc('boxes|' + tk, ({ add }) => {
    for (const sz of [-1, 1]) add(G.box(W, H, t, .008), KR, 0, y0 + H / 2, sz * (D / 2 - t / 2));
    for (const sx of [-1, 1]) add(G.box(t, H, D - 2 * t, .008), KR, sx * (W / 2 - t / 2), y0 + H / 2, 0);
    add(G.pbox(W - 2 * t, .03, D - 2 * t), KR2, 0, y0 + .015, 0);
    for (const sx of [-1, 1]) add(G.sph(.055, 12, 8), '#8a5a3c', sx * (W / 2 + .001), .4, 0, 0, 0, 0, [.12, .4, 1]);
    for (const [x, z, r, c] of [[-.24, -.22, .08, WHITE], [.25, -.24, .075, '#f3ecdf'], [.24, .22, .07, WHITE], [-.25, .2, .065, '#f3ecdf']]) add(G.sph(r, 7, 5), c, x, .07, z, .4, x * 7, 0, [1, .8, 1]);
    for (const sz of [-1, 1]) add(G.pbox(.08, .11, .006), TAPE, 0, y0 + H - .055, sz * (D / 2 + .004));
  }));
  f.add(mg('boxes-prints|' + tk, atlasMat(), ({ add }) => {
    add(quadGeo(.34, .17, RG.box), 0, .26, D / 2 + .006);
    add(quadGeo(.2, .2, RG.arrows), W / 2 + .006, .28, 0, 0, HP, 0);
  }));
  const flap = sx => {   // sx = -1: the left flap (hinge on the left edge), +1: the right one
    const pv = new THREE.Group(); put(pv, sx * W / 2, y0 + H + .012, 0);
    pv.add(mc('boxes-flap' + sx + '|' + tk, ({ add }) => {
      const cx = -sx * W / 4, tx = -sx * (W / 2 - .04);
      add(G.box(W / 2 - .003, .024, D, .006), KR, cx, 0, 0);
      add(G.pbox(.08, .006, D + .006), TAPE, tx, .015, 0);
    }));
    f.add(pv); return pv;
  };
  const L = flap(-1), R = flap(1);
  const p = f.part('lid', [L, R], (t) => { L.rotation.z = 2.3 * t; R.rotation.z = -2.3 * t; }, { label: '상자', sfx: 'open' });
  f.spot('inside', null, 0, .05, 0, { part: p, maxH: .44, label: '상자 안' });
};

// 스탠드 (1×1): a tripod floor lamp — three honey legs, a collar and pole, a pleated glowing shade with wooden rims and a
// pull chain.
B.lamp = (f, T) => {
  const { wood, woodD } = woods(T), sh = T.accent3 || '#fff1c9', tk = [wood, woodD, T.accent, T.accent2].join(','), SY = 1.36;
  f.add(mc('lamp|' + tk, ({ add, tube }) => {
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * PI * 2 + PI / 6, fx = Math.sin(a) * .22, fz = Math.cos(a) * .22;
      tube([fx, .01, fz], [Math.sin(a) * .03, .62, Math.cos(a) * .03], .02, wood, 8, .015);
      add(G.sph(.024, 8, 6), woodD, fx, .016, fz, 0, 0, 0, [1, .7, 1]);
    }
    add(G.cyl(.05, .05, .08, 12), woodD, 0, .64, 0);
    tube([0, .68, 0], [0, SY - .1, 0], .016, woodD, 8);
    add(G.tor(.212, .012, PI * 2, 4, 32), wood, 0, SY - .16, 0, HP, 0, 0);
    add(G.tor(.142, .012, PI * 2, 4, 28), wood, 0, SY + .16, 0, HP, 0, 0);
    for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2; add(G.sph(.022, 8, 6), i % 2 ? T.accent : T.accent2, Math.sin(a) * .215, SY - .19, Math.cos(a) * .215); tube([Math.sin(a) * .212, SY - .16, Math.cos(a) * .212], [Math.sin(a) * .215, SY - .175, Math.cos(a) * .215], .003, '#8a7a6a', 3); }
    tube([.1, SY - .16, .1], [.1, SY - .32, .1], .003, STEEL2, 4);
    add(G.sph(.012, 6, 5), GOLD, .1, SY - .325, .1);
  }));
  const shade3 = geo('fu-pleat', () => {
    const g = new THREE.CylinderGeometry(.14, .21, .32, 32, 1, true), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if ((i % 33) % 2) { p.setX(i, p.getX(i) * .93); p.setZ(i, p.getZ(i) * .93); }
    g.computeVertexNormals(); return g;
  });
  f.add(put(mesh(shade3, mat(sh, { emissive: '#fff1c9', ei: .45, side: DS })), 0, SY, 0));
  f.add(put(mesh(geo('fu-lampbulb', () => new THREE.SphereGeometry(.05, 12, 10)), glowMat()), 0, SY - .05, 0));
};

// 의자 (1×1): a wooden stool — a round honey seat on four splayed legs with a ring stretcher, a puffy knitted cushion with
// a button.
B.stool = (f, T) => {
  const { wood, woodD } = woods(T), acc = T.accent, tk = [wood, woodD, acc].join(',');
  f.add(wd('stool', wood, ({ geo }) => {
    geo(G.cyl(.23, .21, .06, 24), xf(0, .46, 0));
    for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + PI / 4, [L, m] = tubeM([Math.sin(a) * .13, .44, Math.cos(a) * .13], [Math.sin(a) * .19, 0, Math.cos(a) * .19]); geo(G.cyl(.024, .018, L, 8), m, true); }
  }));
  f.add(mc('stool|' + tk, ({ add }) => {
    add(G.tor(.158, .011, PI * 2, 5, 28), woodD, 0, .33, 0, HP, 0, 0);
    add(G.sph(.016, 8, 6), shade(acc, -.18), 0, .55, 0, 0, 0, 0, [1, .45, 1]);
  }));
  f.add(pm('stool-cushion|' + acc, mat('#ffffff', { map: knitTex(acc) }), .12, ({ geo }) => geo(G.lathe([[0, 0], [.2, 0], [.214, .018], [.205, .042], [.17, .055], [0, .058]], 28), xf(0, .49, 0))));
  f.spot('on', null, 0, .545, 0, { maxH: .45, label: '의자 위', scale: .9 });
  f.spot('under', null, 0, 0, .05, { maxH: .35, label: '의자 밑', scale: .8 });
};

// ── Wall decor (origin: wall inner face, floor height; faces +z into the room)
// 창문: a white window with a deep reveal onto a sunny garden view (a tree, the neighbours' roofs), a muntin cross, a sill
// with a potted daisy, and patterned curtains on rings from a wooden rod — they draw back.
B.window = (f, T) => {
  const y = 1.55, frameC = T.trim || WHITE, cur = T.curtain || CREAM, pot = T.pot || '#ff9b73', { woodD } = woods(T);
  const tk = [frameC, cur, pot, woodD].join(','), ROD = y + .6, CZ = .26;
  f.add(mg('window-view', mat('#ffffff', { map: viewTex(), emissive: '#ffffff', ei: .18 }), ({ add }) => add(new THREE.PlaneGeometry(.92, .8), 0, y, .012)));
  f.add(mc('window|' + tk, ({ add, tube }) => {
    const ring = rrShape(-.54, y - .48, 1.08, .96, .03); ring.holes.push(rrShape(-.46, y - .4, .92, .8, .012));
    add(G.ext(ring, .07, 0, 4), frameC, 0, 0, -.01);
    add(G.box(.035, .8, .03, .006), frameC, 0, y, .03);
    add(G.box(.92, .035, .03, .006), frameC, 0, y, .03);
    for (const [x, w] of [[-.3, .04], [-.23, .02], [.2, .04], [.27, .02]]) add(G.pbox(w, .3, .004), '#f2fbff', x, y + .18, .02, 0, 0, -.55);
    add(G.box(1.24, .06, .26, .015), frameC, 0, y - .5, .1);
    add(G.box(1.0, .05, .03, .01), shade(frameC, -.04), 0, y - .555, .015);
    // a potted daisy on the sill
    const sx = .44, sy = y - .47;
    add(G.cyl(.055, .045, .1, 12), pot, sx, sy + .05, .1); add(G.cyl(.059, .059, .016, 12), shade(pot, -.08), sx, sy + .097, .1);
    for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2 + .4; add(G.sph(.035, 8, 5), i % 2 ? LEAF : LEAF3, sx + Math.cos(a) * .03, sy + .12, .1 + Math.sin(a) * .03, 0, -a, .5, [1.3, .5, .7]); }
    tube([sx, sy + .1, .1], [sx + .01, sy + .2, .1], .005, LEAF2, 4);
    flower(add, sx + .01, sy + .21, .1, 1.5, WHITE, MUSTARD);
    // rod with finials and brackets
    tube([-.74, ROD, CZ], [.74, ROD, CZ], .016, woodD, 8);
    for (const s of [-1, 1]) { add(G.sph(.032, 10, 8), woodD, s * .76, ROD, CZ); add(G.box(.03, .03, CZ, .008), woodD, s * .68, ROD, CZ / 2); }
  }));
  const CH = .98, CW = .56;
  const L = new THREE.Group(), R = new THREE.Group();
  put(L, -.58, ROD - .03, CZ); put(R, .58, ROD - .03, CZ);
  for (const [g, sx] of [[L, 1], [R, -1]]) {
    g.add(pm('window-curtain' + sx + '|' + cur, mat('#ffffff', { map: curtainTex(cur) }), .5, ({ box }) => box(CW, CH, .04, sx * CW / 2, -CH / 2, 0, { r: .015 })));
    g.add(mc('window-rings' + sx + '|' + tk, ({ add }) => {
      for (let k = 0; k < 5; k++) add(G.tor(.022, .005, PI * 2, 3, 10), woodD, sx * (.05 + k * .115), .03, 0);
      add(G.box(CW - .02, .03, .046, .01), shade(cur, -.08), sx * CW / 2, -CH + .05, 0);
    }));
    f.add(g);
  }
  const p = f.part('curtain', [L, R], (t, bl, br) => { L.position.x = bl.p.x - .32 * t; L.scale.x = 1 - .45 * t; R.position.x = br.p.x + .32 * t; R.scale.x = 1 - .45 * t; }, { label: '커튼', sfx: 'swish', dur: .3 });
  f.spot('inside', null, 0, y - .47, .1, { part: p, maxH: .45, label: '커튼 뒤 창틀', scale: .85 });
};

// 액자: a honey frame with a cream mat around a painting of a cottage under the mountains, hung on a wire from a nail; it
// flips up to show what is tucked behind it.
B.picture = (f, T) => {
  const { wood } = woods(T);
  f.add(mc('picture-nail', ({ add, tube }) => {
    add(G.cyl(.014, .014, .02, 8), STEEL2, 0, 1.95, .01, HP, 0, 0);
    tube([0, 1.95, .015], [-.2, 1.862, .03], .003, '#8a7a6a', 4); tube([0, 1.95, .015], [.2, 1.862, .03], .003, '#8a7a6a', 4);
  }));
  const pv = new THREE.Group(); put(pv, 0, 1.86, .03);
  const ring = rrShape(-.33, -.52, .66, .52, .02); ring.holes.push(rrShape(-.25, -.44, .5, .36, .008));
  pv.add(wd('picture-frame', wood, ({ geo }) => geo(G.ext(ring, .05, 0, 4), xf(0, 0, -.025)), .5));
  pv.add(mc('picture-mat', ({ add }) => {
    add(G.pbox(.52, .38, .01), CREAM, 0, -.26, 0);
    add(G.box(.1, .026, .008, .003), GOLD, 0, -.485, .025 + .004);
  }));
  pv.add(mg('picture-art', atlasMat(), ({ add }) => add(quadGeo(.42, .3, RG.paint), 0, -.26, .005 + .006)));
  f.add(pv);
  const p = f.part('flip', pv, (t, b) => { pv.rotation.x = -1.1 * t; pv.position.y = b.p.y + .24 * t; }, { label: '액자', sfx: 'lift' });
  f.spot('inside', null, 0, 1.57, .012, { part: p, maxH: .09, label: '액자 뒤', wallFace: true });
};

// 시계: a round alarm-style wall clock — a coloured case with a bezel, twin bells and a hammer on top, a printed cream dial
// with blushing cheeks, ink hands and a gold cap.
B.clock = (f, T) => {
  const acc = T.accent, acc2 = T.accent2, tk = [acc, acc2].join(','), cy = 2.0;
  f.add(mc('clock|' + tk, ({ add, tube }) => {
    add(G.cyl(.24, .24, .06, 36), acc, 0, cy, .03, HP, 0, 0);
    add(G.tor(.222, .02, PI * 2, 6, 36), shade(acc, .1), 0, cy, .06);
    for (const sx of [-1, 1]) {
      tube([sx * .1, cy + .2, .03], [sx * .15, cy + .25, .03], .012, STEEL2, 6);
      add(G.dome(.075, 16, 6), acc2, sx * .17, cy + .25, .03, 0, 0, -sx * .55);
      add(G.sph(.016, 8, 6), GOLD, sx * .17 - sx * .045, cy + .25 + .065, .03);
    }
    tube([0, cy + .23, .03], [0, cy + .3, .03], .008, STEEL2, 5);
    add(G.sph(.022, 8, 6), STEEL, 0, cy + .31, .03);
    for (const sx of [-1, 1]) tube([sx * .13, cy - .2, .03], [sx * .17, cy - .27, .03], .014, acc, 6);
    // hands, cap
    add(G.box(.024, .13, .006, .003), INK, -.03, cy + .045, .066 + .009, 0, 0, .55);
    add(G.box(.018, .17, .006, .003), INK, .04, cy + .065, .066 + .016, 0, 0, -.5);
    add(G.cyl(.02, .02, .02, 12), GOLD, 0, cy, .066 + .014, HP, 0, 0);
  }));
  f.add(mg('clock-dial', atlasMat(), ({ add }) => add(discGeo(.205, RG.clock, 32), 0, cy, .06 + .006)));
};

// 벽 선반: a honey floating shelf on curved brackets with a bunting garland along its front edge and a tiny cactus.
B.wallshelf = (f, T) => {
  const { wood, woodD } = woods(T), acc = T.accent, acc2 = T.accent2, acc3 = T.accent3 || MUSTARD, tk = [wood, woodD, acc, acc2, acc3].join(',');
  f.add(wd('wallshelf', wood, ({ box }) => box(.96, .05, .26, 0, 1.42, .13, { r: .012 })));
  f.add(mc('wallshelf|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) add(G.ext(bracketShape(.2, .15), .035, 0, 6), woodD, sx * .34 + .0175, 1.395, 0, 0, -HP, 0);
    const flag = new THREE.Shape(); flag.moveTo(-.04, 0); flag.lineTo(.04, 0); flag.lineTo(0, -.075); flag.lineTo(-.04, 0);
    tube([-.46, 1.4, .268], [.46, 1.4, .268], .003, '#8a7a6a', 4);
    [acc, acc2, acc3, MINT, acc, acc2, acc3, CORAL, acc2].forEach((c, k) => add(G.ext(flag, .006, 0, 1), c, -.4 + k * .1, 1.4, .266));
    add(G.cyl(.035, .03, .06, 12), acc2, 0, 1.445 + .03, .07);
    add(G.cap(.022, .04, 2, 8), LEAF2, 0, 1.445 + .09, .07);
    add(G.sph(.01, 6, 5), BLUSH, 0, 1.445 + .13, .07);
  }));
  f.spot('on', null, -.24, 1.445, .14, { maxH: .4, label: '벽 선반', scale: .85 });
  f.spot('on', null, .24, 1.445, .14, { maxH: .4, label: '벽 선반', scale: .85 });
};

// 레버: a riveted steel wall plate with yellow-black hazard bands and a slot; a chrome lever with a red ball knob.
B.lever = (f, T) => {
  f.add(mc('lever', ({ add }) => {
    add(G.box(.42, .56, .08, .05), '#8f9bc4', 0, 1.15, .04);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(G.sph(.018, 8, 6), STEEL, sx * .16, 1.15 + sy * .17, .08 + .002, 0, 0, 0, [1, 1, .5]);
    for (const y of [1.4, .9]) add(G.box(.3, .07, .05, .015), '#ffe14d', 0, y, .09);
    add(G.box(.07, .36, .012, .006), CHAR, 0, 1.15, .08 + .006);
    add(G.cyl(.05, .05, .1, 14), STEEL2, 0, 1.06, .11, 0, 0, HP);
  }));
  f.add(mg('lever-stripes', atlasMat(), ({ add }) => { for (const y of [1.4, .9]) add(quadGeo(.27, .05, RG.hazard), 0, y, .115 + .006); }));
  const pv = new THREE.Group(); put(pv, 0, 1.06, .11);
  pv.add(mc('lever-arm', ({ add }) => {
    add(G.cyl(.035, .035, .34, 12), '#d9dfef', 0, .17, 0);
    add(G.sph(.095, 16, 12), '#ff4f66', 0, .36, 0);
    add(G.sph(.03, 8, 6), '#ffd0d6', -.03, .4, .06, 0, 0, 0, [1, 1, .5]);
  }));
  f.add(pv);
  const p = f.part('lever', pv, t => { pv.rotation.x = .1 + .95 * t; }, { label: '레버', sfx: 'door', dur: .35 });
  p.setOpen(0);
  p.isLever = true;
};

// 문: a white door frame around a panelled door in the theme's door colour — raised panels, a cream heart, a brass knob
// on a rosette and a brass kick plate; a soft hallway shows behind it when it opens.
B.door = (f, T) => {
  const trim = T.trim || WHITE, dc = T.door || T.accent, knob = T.knob || GOLD, tk = [trim, dc, knob].join(',');
  f.add(mc('door|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.07, 1.82, .1, .015), trim, sx * .475, .91, 0);
    add(G.box(1.02, .07, .1, .015), trim, 0, 1.785, 0);
    add(G.pbox(.87, 1.745, .01), '#e2d6ea', 0, .8725, .005);
    for (const dy of [-.55, .55]) add(G.cyl(.018, .018, .12, 10), BRASS, -.437, .86 + dy, .06);
    add(G.pbox(.862, .3, .012), '#d4c6e0', 0, .15, .012);
  }));
  const pv = new THREE.Group(); put(pv, -.43, .86, .06);
  pv.add(mc('door-slab|' + tk, ({ add }) => {
    const mold = shade(dc, -.16);
    add(G.box(.86, 1.7, .06, .03), dc, .43, 0, 0);
    frameBars(add, .43, .4, .62, .74, .035, .014, .03, mold);
    frameBars(add, .43, -.42, .62, .62, .035, .014, .03, mold);
    add(G.ext(heartShape(.09), .01, 0, 8), CREAM, .43, .38, .03 + .002);
    add(G.cyl(.036, .036, .012, 16), shade(knob, -.1), .76, -.02, .036, HP, 0, 0);
    add(G.sph(.045, 12, 10), knob, .76, -.02, .07);
    add(G.cyl(.012, .012, .03, 8), shade(knob, -.1), .76, -.02, .048, HP, 0, 0);
    add(G.box(.66, .08, .008, .003), BRASS, .43, -.78, .03 + .004);
  }));
  f.add(pv);
  f.doorPart = f.part('door', pv, (t) => { pv.rotation.y = -1.7 * t; }, { label: '방문', sfx: 'door' });
  f.doorPart.noSearch = true;
};

export const FURN_INFO = {
  bed: { w: 1, d: 2, name: '침대', price: 300 },
  futon: { w: 1, d: 2, name: '다락 이불', price: 160 },
  wardrobe: { w: 1, d: 1, name: '옷장', price: 260 },
  drawers: { w: 1, d: 1, name: '서랍장', price: 220 },
  desk: { w: 2, d: 1, name: '책상', price: 240 },
  bookshelf: { w: 1, d: 1, name: '책장', price: 160 },
  sofa: { w: 2, d: 1, name: '소파', price: 280 },
  chest: { w: 1, d: 1, name: '장난감 상자', price: 180 },
  safe: { w: 1, d: 1, name: '금고', price: 420 },
  plant: { w: 1, d: 1, name: '화분', price: 90 },
  rug: { w: 2, d: 2, name: '러그', price: 120 },
  table: { w: 1, d: 1, name: '쿠키 탁자', price: 150 },
  fridge: { w: 1, d: 1, name: '냉장고', price: 320 },
  counter: { w: 1, d: 1, name: '찬장', price: 200 },
  tvstand: { w: 2, d: 1, name: 'TV장', price: 300 },
  trash: { w: 1, d: 1, name: '휴지통', price: 70 },
  boxes: { w: 1, d: 1, name: '상자', price: 80 },
  lamp: { w: 1, d: 1, name: '스탠드', price: 60 },
  stool: { w: 1, d: 1, name: '의자', price: 70 },
  window: { wall: true, name: '창문' }, picture: { wall: true, name: '액자' }, clock: { wall: true, name: '시계' },
  wallshelf: { wall: true, name: '벽 선반' }, door: { wall: true, name: '문' }, lever: { wall: true, name: '레버' },
};

export function makeFurniture(type, theme, opts = {}) {
  const info = FURN_INFO[type];
  const f = new Furn(type, info.w || 1, info.d || 1, !!info.wall);
  B[type](f, theme, opts);
  f.name = info.name;
  return bakeStatic(f.finalize(), type + '|' + JSON.stringify(opts), theme);
}

// Freestanding lever for outdoor stages that have no tall wall to mount one on: a steel post with hazard bands on a dark
// base, a riveted panel and the same red-knobbed lever.
B.leverpost = (f, T) => {
  f.add(mc('leverpost', ({ add }) => {
    add(G.cyl(.11, .14, .07, 18), CHAR, 0, .035, 0);
    add(G.box(.12, .9, .12, .03), '#8f9bc4', 0, .5, 0);
    for (const y of [.22, .42]) add(G.box(.132, .07, .132, .01), '#ffe14d', 0, y, 0);
    add(G.box(.36, .42, .1, .05), '#8f9bc4', 0, .98, .02);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(G.sph(.016, 8, 6), STEEL, sx * .13, .98 + sy * .15, .07 + .002, 0, 0, 0, [1, 1, .5]);
    add(G.box(.26, .06, .05, .015), '#ffe14d', 0, 1.17, .08);
    add(G.box(.06, .3, .012, .006), CHAR, 0, 1.0, .07 + .006);
    add(G.cyl(.045, .045, .09, 14), STEEL2, 0, .92, .1, 0, 0, HP);
  }));
  f.add(mg('leverpost-stripes', atlasMat(), ({ add }) => add(quadGeo(.23, .043, RG.hazard), 0, 1.17, .105 + .006)));
  const pv = new THREE.Group(); put(pv, 0, .92, .1);
  pv.add(mc('leverpost-arm', ({ add }) => {
    add(G.cyl(.035, .035, .32, 12), '#d9dfef', 0, .16, 0);
    add(G.sph(.09, 16, 12), '#ff4f66', 0, .34, 0);
    add(G.sph(.028, 8, 6), '#ffd0d6', -.03, .38, .055, 0, 0, 0, [1, 1, .5]);
  }));
  f.add(pv);
  const p = f.part('lever', pv, t => { pv.rotation.x = .1 + .95 * t; }, { label: '레버', sfx: 'door', dur: .35 });
  p.setOpen(0); p.isLever = true;
};
FURN_INFO.leverpost = { w: 1, d: 1, name: '레버 기둥', price: 0, hidden: true };

// Merge another builder registry (gfx/outdoor.js) into makeFurniture.
export function registerFurniture(builders, info) {
  for (const k in builders) B[k] = builders[k];
  for (const k in info) FURN_INFO[k] = info[k];
}

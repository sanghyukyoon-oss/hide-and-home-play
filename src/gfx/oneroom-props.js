// One-room props (원룸): a Korean studio apartment with Japanese and American homes mixed in — a loft bed over a little
// desk with fairy lights, a two-tile mini kitchen (sink, induction, red rubber gloves), a retro mini fridge with a microwave
// on top, a slim shoe cabinet with a maneki-neko, a drum washer, a clothes rail, a folding floor table with pot ramen, a
// PC desk with a pegboard, a corduroy beanbag, an arched full-length mirror, a rice cooker on its rack and a ladder plant
// stand; on the walls a blackout-curtain window, a peeling poster and a wall-mounted air conditioner.
// Same contract as apt-props.js:
//   builder(f, T, opts) fills a Furn. Origin = footprint centre on the floor, the piece faces +z, back toward -z, 1 tile = 1.
//   Wall pieces (wall: true, span 1|2) hang on a wall's inner face: origin at the face, floor height, +z into the room.
//   parts open / lift / slide / flip; spots: inside (needs its part open) | under/behind (visible but tucked) | on (plain sight).
//   Lockable parts carry p.lockable = true and p.lockKind ('pad' | 'code'), with f.lockAt where the lock hardware goes.
// Toy-set rules: chunky silhouettes, flat matte colours, few draw calls. Static decor is merged into ONE vertex-coloured
// mesh per piece (mc); surfaces that carry detail (wood grain, gingham, tiles, corduroy, pegboard, prints) are canvas
// textures mapped in world units (pm / wd) or one shared label atlas (mg); every moving part is its own mesh.
// Decals / panels / stickers always sit >= .006 in front of the face they are on (no coplanar faces of two colours).
//   import { ONEROOM_BUILDERS, ONEROOM_INFO, ONEROOM_THEMES, ONEROOM_ITEMS } from './gfx/oneroom-props.js';
//   registerFurniture(ONEROOM_BUILDERS, ONEROOM_INFO); Object.assign(ITEMS, ONEROOM_ITEMS);
//   for (const k in ONEROOM_THEMES) THEMES[k] = { ...THEMES.my, ...ONEROOM_THEMES[k] };
// Warm palette: cream, honey wood on a pale greige floor, sage / mint, sky, tomato, mustard (never all-pink).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mat, mesh, geo, canvasTex, texCache, roundRect, shade, heartShape, starShape, STYLE } from './kit.js';
import { tr } from '../i18n.js';

const PI = Math.PI, HP = PI / 2, BS = THREE.BackSide;

// ── palette ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Theme keys first (pieces follow the room they are bought into). Extra keys only the one-room theme sets:
// duvet (loft bed gingham), bean (beanbag corduroy), fridge (retro mini fridge), blackout (curtain), peg (pegboard).
const K = { wood: '#e3a464', woodD: '#a8693d', body: '#fffaf2', accent: '#9fd3a6', accent2: '#8fd3f4', accent3: '#ffc23d', fabric: '#fff0d8',
  fabric2: '#ffe3bf', knob: '#ffd84a', top: '#fffaf0', door: '#bfe6d2', curtain: '#fff3d6', pot: '#f3a272', rug: '#fff3df', rug2: '#ffd9a8',
  duvet: '#7fb6e8', bean: '#ffb43a', fridge: '#ff7a64', blackout: '#6a86c9', peg: '#9fd0f0' };
const col = (T, k) => (T && T[k]) || K[k];
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', SKY = '#8fd3f4', SKY2 = '#cdeefc', HONEY = '#ffcf5c', MUSTARD = '#ffc23d',
  TOMATO = '#ff6b57', CORAL = '#ff9f8a', MINT = '#7fd6c0', BLUSH = '#ff9fb5', GOLD = '#ffc93c', LEAF = '#6cc46a', LEAF2 = '#4ea85a',
  LEAF3 = '#8fd47a', ORANGE = '#ffab4c', STEEL = '#c9cfe0', STEEL2 = '#a9b2c8', DARK = '#5b5672', CHAR = '#3b3550', KRAFT = '#e8bb82',
  KRAFT2 = '#cf9a5e', TAPE = '#f6e2b0', SOIL = '#8a5a3c', LILAC = '#b9a6ff', BROWN = '#c98a52', NAVY = '#4f6db0', RUBBER = '#ff5d6c',
  BRASS = '#e8b84a', SINK = '#d9dee8', SINK2 = '#c3cad8', PVC = '#eef0f4';

// ── geometry helpers (same as apt-props.js) ─────────────────────────────────────────────────────────────────────
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
  const g = geo('ormc|' + STYLE.mode + '|' + key, () => {
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
  const g = geo('ormg|' + key, () => {
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
// Box-mapped uvs in world units (a print is the same size on every face). vert: grain / stripes run up the side faces
// (posts, legs, ladder rails) instead of across them.
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
    const g_ = (g, mm, vert = false) => { const c = g.index ? g.toNonIndexed() : g.clone(); addM(planarUV(c.applyMatrix4(mm), s, vert), I); };
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
const scaleUV = (g, su, sv = 1) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return g; };
// One flat triangle (a, b, c counter-clockwise seen from its front), with optional uvs.
function triGeo(a, b, c, uvs = null) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...a, ...b, ...c]), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs ? uvs.flat() : [0, 0, 1, 0, 0, 1]), 2));
  g.computeVertexNormals();
  return g;
}
function rrShape(x, y, w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// An arch (a rectangle with a half-round top), base centred at (0, y0); hole = the same path wound the other way.
function archPath(p, w, h, y0 = 0, hole = false) {
  const r = w / 2;
  if (!hole) { p.moveTo(-r, y0); p.lineTo(r, y0); p.lineTo(r, y0 + h - r); p.absarc(0, y0 + h - r, r, 0, PI, false); p.lineTo(-r, y0); }
  else { p.moveTo(-r, y0); p.lineTo(-r, y0 + h - r); p.absarc(0, y0 + h - r, r, PI, 0, true); p.lineTo(r, y0); p.lineTo(-r, y0); }
  return p;
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
// A garment body in the xy plane, collar at y = 0, hem at y = -L, half width w (shoulders), flare at the hem.
function bodyShape(w, L, flare = .015) {
  const s = new THREE.Shape();
  s.moveTo(-.055, 0); s.lineTo(-w * .74, -.014); s.quadraticCurveTo(-w, -.03, -w, -.08); s.lineTo(-w - flare, -L); s.lineTo(w + flare, -L);
  s.lineTo(w, -.08); s.quadraticCurveTo(w, -.03, w * .74, -.014); s.lineTo(.055, 0); s.quadraticCurveTo(0, -.06, -.055, 0);
  return s;
}
// A slanted cloth panel: top edge (width wT) at y = 0, bottom edge (width wB) at y = -H pushed out by s along +z; thickness t.
function trapGeo(wT, wB, H, s, t) {
  const g = new THREE.BoxGeometry(1, 1, t), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const top = p.getY(i) > 0; p.setXYZ(i, p.getX(i) * (top ? wT : wB), top ? 0 : -H, p.getZ(i) + (top ? 0 : s)); }
  g.computeVertexNormals();
  return g;
}
// a sansevieria leaf: a tall pointed blade (base on y = 0)
function bladeShape(w, h) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.quadraticCurveTo(-w * .62, h * .55, 0, h); s.quadraticCurveTo(w * .62, h * .55, w / 2, 0); s.lineTo(-w / 2, 0);
  return s;
}

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
const line = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
function heartPath(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * .7); c.bezierCurveTo(x - s * 1.2, y - s * .1, x - s * .55, y - s * .95, x, y - s * .35); c.bezierCurveTo(x + s * .55, y - s * .95, x + s * 1.2, y - s * .1, x, y + s * .7); }
function starPath(c, x, y, R, r = R * .45) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -HP + i * PI / 5, rr = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
function clip(c, x, y, w, h, fn) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); fn(); c.restore(); }
function cloud(c, x, y, s, color = '#ffffff') { c.fillStyle = color; blob(c, x, y, 8 * s); blob(c, x + 10 * s, y - 5 * s, 10 * s); blob(c, x + 21 * s, y, 8 * s); c.fillRect(x, y - 2 * s, 21 * s, 10 * s); }
function daisy(c, x, y, r, petal = '#ffffff', mid = '#ffc23d') { c.fillStyle = petal; for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; blob(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * .78); } c.fillStyle = mid; blob(c, x, y, r * .6); }
// the game's mochi hero, for screens and photos
function mochi(c, x, y, r, body = '#ffffff') {
  c.fillStyle = body; c.beginPath(); c.ellipse(x, y, r, r * .84, 0, 0, PI * 2); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1.1, r * .08); c.stroke();
  c.fillStyle = '#2a1d33'; blob(c, x - r * .34, y - r * .06, r * .1); blob(c, x + r * .34, y - r * .06, r * .1);
  c.fillStyle = '#ff9fb5'; blob(c, x - r * .58, y + r * .2, r * .14); blob(c, x + r * .58, y + r * .2, r * .14);
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1, r * .07); c.beginPath(); c.arc(x, y + r * .06, r * .14, .25, PI - .25); c.stroke();
}
function catFace(c, x, y, r, fur = '#ffab4c') {
  c.fillStyle = fur; blob(c, x, y, r);
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * r * .9, y - r * .2); c.lineTo(x + s * r * .78, y - r * 1.2); c.lineTo(x + s * r * .2, y - r * .82); c.fill(); }
  c.fillStyle = '#2a1d33'; blob(c, x - r * .38, y - r * .05, r * .12); blob(c, x + r * .38, y - r * .05, r * .12);
  c.fillStyle = '#ff7f9e'; blob(c, x, y + r * .22, r * .1);
}

// ── surface textures (repeat; world-sized through planarUV) ─────────────────────────────────────────────────────
// Wood: two boards per tile, each a touch lighter or darker, wavy grain that wraps, a knot, a dark seam.
const woodTex = c1 => tex('or-wood|' + c1, 256, 256, (c, w, h) => {
  const bh = h / 2;
  for (let b = 0; b < 2; b++) {
    c.fillStyle = tint(shade(c1, b ? .03 : -.015)); c.fillRect(0, b * bh, w, bh);
    c.lineWidth = 1.2;
    for (let k = 0; k < 7; k++) {
      c.strokeStyle = tint(shade(c1, k % 3 ? -.07 : -.12)); c.globalAlpha = k % 3 ? .45 : .6;
      const y0 = b * bh + 5 + k * (bh - 10) / 6, amp = 1.2 + (k % 3) * .9, ph = k * 1.9 + b * 2.3, n = 1 + ((k + b) % 2);
      c.beginPath(); for (let x = 0; x <= w; x += 4) { const y = y0 + Math.sin(x / w * PI * 2 * n + ph) * amp; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    }
    c.globalAlpha = 1;
    const kx = b ? 86 : 30, ky = b * bh + bh * .5;
    c.strokeStyle = tint(shade(c1, -.13)); c.lineWidth = 1.3;
    for (const r of [2.6, 5.2]) { c.beginPath(); c.ellipse(kx, ky, r * 2.1, r, 0, 0, PI * 2); c.stroke(); }
    c.fillStyle = tint(shade(c1, -.17)); c.beginPath(); c.ellipse(kx, ky, 2.4, 1.2, 0, 0, PI * 2); c.fill();
    c.fillStyle = tint(shade(c1, -.2)); c.fillRect(0, b * bh, w, 1.3);
    c.fillStyle = tint(shade(c1, .08)); c.fillRect(0, b * bh + 1.3, w, 1);
  }
}, { repeat: [1, 1] });
const woodMat = c1 => mat('#ffffff', { map: woodTex(c1) });
const wd = (key, c1, fn, s = .7) => pm(key + '|' + c1, woodMat(c1), s, fn);
// Louvred door slats: a lit top edge, the slat, a dark shadow line, faint grain.
const louvreTex = c1 => tex('or-louvre|' + c1, 128, 128, (c, w, h) => {
  const n = 4, sh = h / n;
  for (let k = 0; k < n; k++) {
    const y = k * sh;
    c.fillStyle = tint(shade(c1, .02)); c.fillRect(0, y, w, sh);
    c.fillStyle = tint(shade(c1, .1)); c.fillRect(0, y, w, 2.2);
    c.fillStyle = tint(shade(c1, -.06)); c.fillRect(0, y + sh * .55, w, sh * .3);
    c.fillStyle = tint(shade(c1, -.2)); c.fillRect(0, y + sh - 2.6, w, 2.6);
    c.strokeStyle = tint(shade(c1, -.08)); c.lineWidth = .8; c.globalAlpha = .5;
    line(c, [[0, y + 5], [w * .3, y + 5.6], [w * .7, y + 4.6], [w, y + 5]]); c.globalAlpha = 1;
  }
}, { repeat: [1, 1] });
const ginghamTex = c1 => tex('or-gingham|' + c1, 128, 128, (c, w, h) => {
  c.fillStyle = '#fffaf2'; c.fillRect(0, 0, w, h);
  c.fillStyle = tint(shade(c1, .14)); c.fillRect(0, 0, w / 2, h); c.fillRect(0, 0, w, h / 2);
  c.fillStyle = tint(c1); c.fillRect(0, 0, w / 2, h / 2);
  c.fillStyle = 'rgba(255,255,255,.55)'; for (const [x, y] of [[w * .75, h * .75]]) { daisy(c, x, y, 3.2, 'rgba(255,255,255,.9)', tint(MUSTARD)); }
}, { repeat: [1, 1] });
// flannel plaid: two-colour check with thin dark and light over-stripes
const plaidTex = (c1, c2) => tex('or-plaid|' + c1 + c2, 128, 128, (c, w, h) => {
  c.fillStyle = tint(c2); c.fillRect(0, 0, w, h);
  c.globalAlpha = .82; c.fillStyle = tint(c1); c.fillRect(0, 0, w * .5, h); c.fillRect(0, 0, w, h * .5); c.globalAlpha = 1;
  c.fillStyle = tint(shade(c1, -.18)); c.fillRect(0, 0, w * .5, h * .5);
  c.fillStyle = tint(INK); c.globalAlpha = .55; c.fillRect(w * .23, 0, 2, h); c.fillRect(0, h * .23, w, 2); c.globalAlpha = 1;
  c.fillStyle = '#ffffff'; c.globalAlpha = .7; c.fillRect(w * .76, 0, 1.4, h); c.fillRect(0, h * .76, w, 1.4); c.globalAlpha = 1;
}, { repeat: [1, 1] });
const stripeTex = (c1, c2) => tex('or-stripe|' + c1 + c2, 64, 64, (c, w, h) => {
  c.fillStyle = tint(c2); c.fillRect(0, 0, w, h); c.fillStyle = tint(c1); c.fillRect(0, 0, w, h * .45);
}, { repeat: [1, 1] });
// kitchen tiles: 4 x 4 glazed squares with a soft highlight, the odd coloured one
const tileTex = (c1, g1) => tex('or-tile|' + c1 + g1, 256, 256, (c, w, h) => {
  c.fillStyle = tint(g1); c.fillRect(0, 0, w, h);
  const n = 4, s = w / n, acc = [tint(MUSTARD), tint(SKY), tint(CORAL)];
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
    const odd = (r * 5 + k * 3) % 11 === 4;
    c.fillStyle = odd ? acc[(r + k) % 3] : tint(shade(c1, ((r + k) % 3) * -.012)); roundRect(c, k * s + 1.6, r * s + 1.6, s - 3.2, s - 3.2, 3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(k * s + 5, r * s + 5, s * .34, 2.2); c.fillRect(k * s + 5, r * s + 5, 2.2, s * .22);
    if (odd) { c.fillStyle = 'rgba(255,255,255,.85)'; daisy(c, k * s + s / 2, r * s + s / 2, 4.5, '#ffffff', tint(MUSTARD)); }
  }
}, { repeat: [1, 1] });
// corduroy: fine raised ribs (planar-mapped, so they run straight down the sides)
const cordTex = c1 => tex('or-cord|' + c1, 64, 64, (c, w, h) => {
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h);
  const n = 6, s = w / n;
  for (let k = 0; k < n; k++) { c.fillStyle = tint(shade(c1, .045)); c.fillRect(k * s + s * .2, 0, s * .42, h); c.fillStyle = tint(shade(c1, -.055)); c.fillRect(k * s + s * .74, 0, s * .2, h); }
}, { repeat: [1, 1] });
// a fluffy rug: short tufts every which way and a contrast ring near the edge
const furTex = (c1, c2) => tex('or-fur|' + c1 + c2, 256, 256, (c, w, h) => {
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h);
  let sd = 11; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  c.lineCap = 'round'; c.lineWidth = 1.5;
  for (let i = 0; i < 900; i++) { const x = R() * w, y = R() * h, a = R() * PI * 2, l = 3 + R() * 4; c.strokeStyle = R() < .5 ? tint(shade(c1, -.07)) : '#ffffff'; c.globalAlpha = .75; line(c, [[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l]]); }
  c.globalAlpha = 1; c.strokeStyle = tint(c2); c.lineWidth = 6; c.beginPath(); c.arc(w / 2, h / 2, 104, 0, PI * 2); c.stroke();
  c.fillStyle = tint(c2); for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; blob(c, w / 2 + Math.cos(a) * 84, h / 2 + Math.sin(a) * 84, 3.2); }
});
// blackout curtain: deep fold shading and a scatter of little cream stars and moons
const curtainTex = c1 => tex('or-blackout|' + c1, 256, 256, (c, w, h) => {
  const n = 4, s = w / n;
  for (let k = 0; k < n; k++) {
    const g = c.createLinearGradient(k * s, 0, (k + 1) * s, 0);
    g.addColorStop(0, tint(shade(c1, -.09))); g.addColorStop(.35, tint(shade(c1, .05))); g.addColorStop(.7, tint(c1)); g.addColorStop(1, tint(shade(c1, -.09)));
    c.fillStyle = g; c.fillRect(k * s, 0, s, h);
  }
  c.fillStyle = tint('#fff1c9');
  for (const [x, y, r] of [[16, 20, 4], [70, 52, 3], [44, 96, 3.6], [100, 110, 4], [22, 74, 2.4], [90, 16, 2.6]]) { starPath(c, x, y, r); c.fill(); }
  for (const [x, y] of [[60, 18], [12, 118], [112, 68]]) { c.beginPath(); c.arc(x, y, 4.2, 0, PI * 2); c.arc(x + 2.2, y - 1.2, 3.6, 0, PI * 2, true); c.fill('evenodd'); }
  for (const [x, y] of [[36, 40], [82, 84], [118, 34], [8, 46], [64, 124], [52, 70]]) blob(c, x, y, 1.1);
}, { repeat: [1, 1] });
// pegboard: rows of holes with a lit lower rim
const pegTex = c1 => tex('or-peg|' + c1, 128, 128, (c, w, h) => {
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h);
  const n = 4, s = w / n;
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
    const x = k * s + s / 2, y = r * s + s / 2;
    c.fillStyle = tint(shade(c1, .1)); blob(c, x + .6, y + .9, 3.4);
    c.fillStyle = tint(shade(c1, -.32)); blob(c, x, y, 2.9);
  }
}, { repeat: [1, 1] });
// the washer drum: brushed steel dotted with holes
const perfTex = () => tex('or-perf', 128, 128, (c, w, h) => {
  c.fillStyle = '#dfe4ec'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#eef2f7'; for (let y = 0; y < h; y += 8) c.fillRect(0, y, w, 2);
  c.fillStyle = '#8f97ab'; for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) blob(c, k * 8 + (r % 2) * 4 + 2, r * 8 + 4, 1.4);
}, { repeat: [1, 1] });
// air-con filter mesh
const meshTex = () => tex('or-filter', 64, 64, (c, w, h) => {
  c.fillStyle = '#e7edf5'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#a9b6c9'; c.lineWidth = 1;
  for (let x = 0; x <= w; x += 4) line(c, [[x, 0], [x, h]]);
  for (let y = 0; y <= h; y += 4) line(c, [[0, y], [w, y]]);
}, { repeat: [1, 1] });
// woven basket
const weaveTex = c1 => tex('or-weave|' + c1, 64, 64, (c, w, h) => {
  c.fillStyle = tint(shade(c1, -.12)); c.fillRect(0, 0, w, h);
  const s = w / 4;
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
    c.fillStyle = tint((r + k) % 2 ? c1 : shade(c1, .06)); roundRect(c, k * s + 1, r * s + 1, s - 2, s - 2, 2.5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; if ((r + k) % 2) c.fillRect(k * s + 2, r * s + 3, s - 4, 1.4); else c.fillRect(k * s + 3, r * s + 2, 1.4, s - 4);
  }
}, { repeat: [1, 1] });
// round rugs (the cap of a cylinder: uv 0..1 across the disc)
const rugTex = (c1, c2) => tex('or-rug|' + c1 + c2, 256, 256, (c, w, h) => {
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h);
  c.strokeStyle = tint(c2); c.lineWidth = 6; for (let r = 104; r > 10; r -= 24) { c.beginPath(); c.arc(w / 2, h / 2, r, 0, PI * 2); c.stroke(); }
  c.fillStyle = tint(c2); for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; blob(c, w / 2 + Math.cos(a) * 116, h / 2 + Math.sin(a) * 116, 4); }
  daisy(c, w / 2, h / 2, 8, '#ffffff', tint(MUSTARD));
});
// the drum washer's door glass: dark blue with tumbling laundry (no glint — 10/21 "리플렉션 꼴보기 싫다")
const washGlassTex = () => tex('or-washglass2', 128, 128, (c, w, h) => {
  const g = c.createRadialGradient(w * .45, h * .45, 4, w / 2, h / 2, w / 2); g.addColorStop(0, '#6f86b8'); g.addColorStop(1, '#2f3b5e');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (const [x, y, r, cc] of [[22, 46, 9, '#ffab4c'], [40, 44, 8, '#ffffff'], [30, 34, 7, '#8fd3f4'], [44, 30, 6, '#ff9fb5']]) { c.globalAlpha = .55; c.fillStyle = cc; c.beginPath(); c.ellipse(x, y, r, r * .7, x * .1, 0, PI * 2); c.fill(); }
  c.globalAlpha = 1;
});
// the full-length mirror: a pale reflection with glints and a faint window
const mirrorTex = () => tex('or-mirror', 128, 256, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#d9eef8'); g.addColorStop(.55, '#f3f9fd'); g.addColorStop(1, '#cfe6f3');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(8, 22, 26, 34); c.fillStyle = 'rgba(160,200,225,.35)'; c.fillRect(20, 22, 2, 34); c.fillRect(8, 38, 26, 2);
  c.fillStyle = 'rgba(120,190,130,.25)'; blob(c, 12, 112, 10); blob(c, 22, 104, 8); blob(c, 6, 98, 6);
  c.fillStyle = 'rgba(255,255,255,.8)';
  for (const [x, wd2] of [[30, 9], [44, 4], [8, 5]]) { c.beginPath(); c.moveTo(x, 128); c.lineTo(x + wd2, 128); c.lineTo(x + wd2 + 40, 0); c.lineTo(x + 40, 0); c.fill(); }
});
// the city outside the one-room window: a red-brick villa with a green water tank, a corner store, wires and a sparrow
const viewTex = () => tex('or-view', 512, 384, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h * .7); g.addColorStop(0, '#79c4f2'); g.addColorStop(1, '#e2f5ff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  cloud(c, 18, 30, 1.1); cloud(c, 170, 22, .8); cloud(c, 120, 48, .55);
  // far apartment blocks
  c.fillStyle = '#e4dcf2'; c.fillRect(150, 40, 60, 120); c.fillRect(214, 58, 42, 100);
  c.fillStyle = '#cfc4ea'; for (let y = 48; y < 150; y += 12) { for (let x = 156; x < 204; x += 11) c.fillRect(x, y, 6, 6); for (let x = 220; x < 250; x += 11) c.fillRect(x, y + 10, 6, 6); }
  // the villa next door
  const vx = 8, vy = 74, vw = 132, vh = 140;
  c.fillStyle = '#d98466'; c.fillRect(vx, vy, vw, vh);
  c.fillStyle = '#c5704f'; for (let y = vy + 4; y < vy + vh; y += 6) for (let x = vx + ((y / 6) % 2) * 6; x < vx + vw; x += 12) c.fillRect(x, y, 9, 2);
  c.fillStyle = '#f1e4d0'; c.fillRect(vx - 3, vy - 6, vw + 6, 7);
  c.fillStyle = '#4fae7a'; roundRect(c, vx + 92, vy - 30, 30, 24, 4); c.fill(); c.fillStyle = '#3e9466'; c.fillRect(vx + 92, vy - 20, 30, 3);
  c.fillStyle = '#e8e2d8'; c.fillRect(vx + 100, vy - 7, 3, 2); c.fillRect(vx + 114, vy - 7, 3, 2);
  for (const [x, y] of [[vx + 10, vy + 14], [vx + 52, vy + 14], [vx + 94, vy + 14], [vx + 10, vy + 62], [vx + 52, vy + 62], [vx + 94, vy + 62]]) {
    c.fillStyle = '#fff4e2'; c.fillRect(x - 2, y - 2, 32, 30); c.fillStyle = '#9fd2f2'; c.fillRect(x, y, 28, 26);
    c.fillStyle = '#ffffff'; c.fillRect(x + 13, y, 2, 26);
    c.fillStyle = '#e9edf3'; c.fillRect(x + 4, y + 30, 18, 10); c.fillStyle = '#b8c0cf'; blob(c, x + 13, y + 35, 3.6);
  }
  c.fillStyle = '#ffffff'; c.fillRect(vx + 52, vy + 50, 28, 2); c.fillStyle = '#ff9fb5'; c.fillRect(vx + 56, vy + 52, 6, 8); c.fillStyle = '#8fd3f4'; c.fillRect(vx + 66, vy + 52, 7, 10);
  // the corner store
  c.fillStyle = '#fbf6ee'; c.fillRect(154, 160, 98, 60); c.fillStyle = '#7f63d8'; c.fillRect(150, 150, 106, 18);
  txt(c, '편의점 24', 203, 159, 12, '#ffffff'); c.fillStyle = '#ffd23f'; c.fillRect(150, 166, 106, 3);
  c.fillStyle = '#bfe4f7'; c.fillRect(160, 176, 40, 40); c.fillRect(206, 176, 40, 40);
  c.fillStyle = '#ff6b57'; c.fillRect(166, 196, 8, 12); c.fillStyle = '#ffc23d'; c.fillRect(178, 192, 8, 16); c.fillStyle = '#7fd6c0'; c.fillRect(212, 194, 10, 14);
  // pole, wires and a sparrow
  c.fillStyle = '#9a8f86'; c.fillRect(136, 30, 6, 192); c.fillRect(126, 44, 26, 4);
  c.strokeStyle = '#4a4560'; c.lineWidth = 1.3;
  for (const [y0, sag] of [[46, 16], [58, 20]]) { c.beginPath(); c.moveTo(0, y0 - 6); c.quadraticCurveTo(70, y0 + sag, 139, y0); c.quadraticCurveTo(200, y0 + sag, w / 2, y0 - 4); c.stroke(); }
  c.fillStyle = '#a87a52'; c.beginPath(); c.ellipse(198, 64, 7, 5, 0, 0, PI * 2); c.fill(); blob(c, 204, 60, 4); c.fillStyle = '#2a1d33'; blob(c, 205, 59, 1); c.fillStyle = '#ffab4c'; c.fillRect(208, 59, 3, 1.6);
  // a street tree and the sill below
  c.fillStyle = '#6cc46a'; blob(c, 236, 214, 30); blob(c, 210, 222, 22); c.fillStyle = '#8fd47a'; blob(c, 228, 206, 16);
  c.fillStyle = '#efe7da'; c.fillRect(0, 222, w, h - 222); c.fillStyle = '#ddd2c2'; for (let x = 0; x < w; x += 24) c.fillRect(x, 222, 1.5, h - 222);
}, { text: true });

// ── label atlas: 1024² canvas = 512² drawing units ─────────────────────────────────────────────────────────────
const AT = 512, PXU = .5 / 1024;
const RC = (x, y, w, h) => [x / AT + PXU, 1 - (y + h) / AT + PXU, (x + w) / AT - PXU, 1 - y / AT - PXU];
const LBL = [['라면', '#ff6b57', '#ffffff'], ['즉석밥', '#ffffff', '#e8462f'], ['바나나맛', '#ffe066', '#8a5a2e'], ['세제', '#8fd3f4', '#ffffff'],
  ['사이다', '#7fd6c0', '#ffffff'], ['섬유유연제', '#b9a6ff', '#ffffff'], ['주방세제', '#9fd3a6', '#ffffff'], ['우유', '#ffffff', '#3f9be0']];
const LB = i => RC((i % 4) * 128, Math.floor(i / 4) * 32, 128, 32);
const RG = { screen: RC(0, 64, 256, 144), poster: RC(256, 64, 128, 176), flyer: RC(384, 64, 64, 88), memo: RC(448, 64, 64, 48), memo2: RC(448, 112, 64, 40),
  wdisp: RC(384, 152, 128, 32), mdisp: RC(384, 184, 64, 24), rdisp: RC(448, 184, 64, 24), ac: RC(384, 208, 64, 24), tee: RC(448, 208, 64, 64),
  patch: RC(0, 208, 32, 32), keys: RC(256, 240, 128, 48), phone: RC(480, 272, 32, 64), ricebag: RC(256, 288, 80, 96), cuplid: RC(336, 288, 48, 48),
  hetban: RC(336, 336, 48, 48), mwin: RC(0, 312, 96, 56), mat: RC(96, 312, 128, 64), deskmat: RC(384, 336, 128, 48), pack: RC(0, 384, 128, 64),
  lpscreen: RC(128, 384, 96, 64), flower: RC(224, 312, 32, 32) };
const PHOTO = i => RC(i * 64, 240, 64, 72);

function drawScreen(c, x, y, w, h) {   // a cosy night-camping game
  clip(c, x, y, w, h, () => {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#36407f'); g.addColorStop(.7, '#7a6fc8'); g.addColorStop(1, '#ffb38a'); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = '#ffffff'; for (const [sx, sy, r] of [[20, 30, 1.4], [60, 22, 1], [104, 40, 1.6], [150, 18, 1.2], [200, 34, 1.5], [236, 52, 1], [86, 58, 1]]) blob(c, x + sx, y + sy, r);
    c.fillStyle = '#ffe27a'; blob(c, x + 206, y + 36, 14); c.fillStyle = '#7a6fc8'; blob(c, x + 213, y + 31, 12);
    c.fillStyle = '#4a9a7a'; c.beginPath(); c.ellipse(x + 60, y + h + 10, 150, 52, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#5fb38a'; c.beginPath(); c.ellipse(x + 220, y + h + 16, 110, 50, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#ff6b57'; c.beginPath(); c.moveTo(x + 40, y + 124); c.lineTo(x + 70, y + 84); c.lineTo(x + 100, y + 124); c.fill();
    c.fillStyle = '#c8402e'; c.beginPath(); c.moveTo(x + 66, y + 124); c.lineTo(x + 70, y + 98); c.lineTo(x + 76, y + 124); c.fill();
    c.fillStyle = '#ffab4c'; c.beginPath(); c.moveTo(x + 150, y + 126); c.quadraticCurveTo(x + 156, y + 106, x + 160, y + 112); c.quadraticCurveTo(x + 166, y + 102, x + 170, y + 126); c.fill();
    c.fillStyle = '#ffe27a'; c.beginPath(); c.moveTo(x + 155, y + 126); c.quadraticCurveTo(x + 160, y + 114, x + 165, y + 126); c.fill();
    c.fillStyle = '#8a5a3c'; c.fillRect(x + 148, y + 126, 24, 4);
    mochi(c, x + 126, y + 116, 14);
    c.fillStyle = 'rgba(42,29,51,.55)'; roundRect(c, x + 6, y + 6, 92, 18, 6); c.fill();
    c.fillStyle = '#ff5a6e'; for (let i = 0; i < 3; i++) { heartPath(c, x + 18 + i * 14, y + 15, 5); c.fill(); }
    c.fillStyle = '#ffc93c'; blob(c, x + 70, y + 15, 5); txt(c, '128', x + 86, y + 16, 11, '#ffffff');
    c.fillStyle = 'rgba(255,255,255,.88)'; roundRect(c, x + w - 64, y + h - 28, 56, 20, 6); c.fill(); txt(c, '캠핑중', x + w - 36, y + h - 18, 12, '#36407f');
  });
}
function drawPoster(c, x, y, w, h) {   // a retro "world tour" poster: a striped sunset, Fuji, a mochi with headphones
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#fff1d6'; c.fillRect(x, y, w, h);
    c.fillStyle = '#2f3b6e'; c.fillRect(x, y, w, 6); c.fillRect(x, y + h - 6, w, 6);
    const cx = x + w / 2, cy = y + 74;
    clip(c, x + 8, y + 14, w - 16, 104, () => {
      c.fillStyle = '#8fd3f4'; c.fillRect(x, y, w, 120);
      ['#ffc23d', '#ffab4c', '#ff8a5c', '#ff6b57'].forEach((cc, i) => { c.fillStyle = cc; c.save(); c.beginPath(); c.arc(cx, cy, 44, 0, PI * 2); c.clip(); c.fillRect(x, cy - 44 + i * 22, w, 18); c.restore(); });
      c.fillStyle = '#5b78c8'; c.beginPath(); c.moveTo(x, y + 118); c.lineTo(cx - 6, y + 70); c.lineTo(cx + 6, y + 70); c.lineTo(x + w, y + 118); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(cx - 17, y + 83); c.lineTo(cx - 6, y + 70); c.lineTo(cx + 6, y + 70); c.lineTo(cx + 17, y + 83); c.lineTo(cx + 9, y + 79); c.lineTo(cx + 2, y + 85); c.lineTo(cx - 5, y + 79); c.fill();
      mochi(c, cx + 26, y + 104, 15);
      c.strokeStyle = '#2a1d33'; c.lineWidth = 2.6; c.beginPath(); c.arc(cx + 26, y + 102, 16, PI * 1.05, PI * 1.95); c.stroke();
      c.fillStyle = '#ff6b57'; roundRect(c, cx + 7, y + 96, 7, 12, 3); c.fill(); roundRect(c, cx + 38, y + 96, 7, 12, 3); c.fill();
    });
    txt(c, 'MOCHI', cx, y + 132, 27, '#ff6b57', { stroke: '#2f3b6e', sw: 5 });
    txt(c, 'もちもち WORLD TOUR', cx, y + 150, 9, '#2f3b6e');
    txt(c, '서울 · 도쿄 · LA', cx, y + 162, 10, '#c8402e');
    c.fillStyle = '#ffc23d'; starPath(c, x + 16, y + 132, 7); c.fill(); starPath(c, x + w - 16, y + 132, 7); c.fill();
  });
}
function drawFlyer(c, x, y, w, h) {   // a fried-chicken delivery menu
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#fffaf0'; c.fillRect(x, y, w, h);
    c.fillStyle = '#ff4b3a'; c.fillRect(x, y, w, 22); txt(c, '치킨', x + w / 2, y + 12, 16, '#ffffff', { stroke: '#c8302a', sw: 3 });
    c.fillStyle = '#e09a45'; c.beginPath(); c.ellipse(x + 26, y + 40, 14, 11, -.5, 0, PI * 2); c.fill();
    c.fillStyle = '#c87a32'; for (const [dx, dy] of [[-6, -2], [3, 4], [6, -5], [-2, 6]]) blob(c, x + 26 + dx, y + 40 + dy, 2);
    c.fillStyle = '#ffffff'; c.save(); c.translate(x + 40, y + 50); c.rotate(-.5); roundRect(c, -2, -3, 10, 5, 2.4); c.fill(); blob(c, 9, -2, 3); blob(c, 9, 2, 3); c.restore();
    c.fillStyle = '#ffc23d'; roundRect(c, x + 34, y + 28, 26, 13, 4); c.fill(); txt(c, '1+1', x + 47, y + 35, 10, '#c8402e');
    c.fillStyle = '#d9d4cc'; for (let i = 0; i < 3; i++) c.fillRect(x + 6, y + 62 + i * 7, i === 2 ? 30 : 50, 3);
    txt(c, '☎ 배달', x + w / 2, y + h - 6, 9, '#ff4b3a');
  });
}
function drawMemo(c, x, y, w, h, bg, s1, s2, ink) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = bg; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(x, y, w, 7);
    txt(c, s1, x + w / 2, y + h * .42, 13, ink); if (s2) txt(c, s2, x + w / 2, y + h * .76, 10, ink);
  });
}
function drawDisp(c, x, y, w, h, s, color, icons = false) {
  c.fillStyle = '#2f3346'; c.fillRect(x, y, w, h);
  txt(c, s, x + (icons ? w * .34 : w / 2), y + h / 2 + 1, h * .62, color);
  if (icons) { c.fillStyle = '#7fd6c0'; for (let i = 0; i < 3; i++) blob(c, x + w * .66 + i * 13, y + h / 2, 3.4); c.fillStyle = '#ffc23d'; blob(c, x + w - 10, y + h / 2, 3.4); }
}
function drawTee(c, x, y, w, h) {   // graphic tee / tote print: a mochi and "SEOUL"
  clip(c, x, y, w, h, () => { c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h); mochi(c, x + w / 2, y + 26, 16); txt(c, 'SEOUL', x + w / 2, y + 52, 13, '#3f9be0'); });
}
function drawPatch(c, x, y) { c.fillStyle = '#ffc23d'; blob(c, x + 16, y + 16, 15); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(x + 16, y + 16, 12.5, 0, PI * 2); c.stroke(); txt(c, 'M', x + 16, y + 17, 18, '#ff6b57', { stroke: '#ffffff', sw: 3 }); }
function drawPhoto(c, i, x, y) {
  clip(c, x, y, 64, 72, () => {
    c.fillStyle = '#ffffff'; c.fillRect(x, y, 64, 72);
    const px = x + 5, py = y + 5, pw = 54, ph = 50;
    const g = c.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, '#8fd3f4'); g.addColorStop(1, '#e4f7ff'); c.fillStyle = g; c.fillRect(px, py, pw, ph);
    if (i === 0) {   // the city tower on its hill
      c.fillStyle = '#6cc46a'; c.beginPath(); c.ellipse(px + 27, py + ph + 8, 40, 22, 0, 0, PI * 2); c.fill();
      c.fillStyle = '#ffffff'; c.fillRect(px + 25, py + 10, 4, 26); c.fillStyle = '#ff6b57'; roundRect(c, px + 21, py + 18, 12, 6, 2); c.fill(); c.fillRect(px + 26, py + 4, 2, 7);
    } else if (i === 1) {   // a cat
      catFace(c, px + 27, py + 30, 14);
    } else if (i === 2) {   // two friends
      c.fillStyle = '#9be38f'; c.fillRect(px, py + 36, pw, 14); mochi(c, px + 18, py + 32, 11); mochi(c, px + 38, py + 34, 8, '#ffe9a8');
    } else {   // tteokbokki night
      c.fillStyle = '#ffe9c7'; c.fillRect(px, py, pw, ph); c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(px + 27, py + 30, 22, 13, 0, 0, PI * 2); c.fill();
      c.fillStyle = '#e8452f'; c.beginPath(); c.ellipse(px + 27, py + 29, 17, 9, 0, 0, PI * 2); c.fill();
      c.fillStyle = '#fff3e0'; for (const [dx, dy] of [[-8, -2], [-2, 2], [6, -1], [10, 3], [0, -4]]) { roundRect(c, px + 27 + dx - 3, py + 29 + dy - 2, 7, 3.4, 1.6); c.fill(); }
    }
    c.fillStyle = '#d9d4cc'; c.fillRect(x + 14, y + 61, 36, 3);
  });
}
function drawKeys(c, x, y, w, h) {   // a keyboard seen from above
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#e3e0ea'; c.fillRect(x, y, w, h);
    const rows = 5, kh = (h - 6) / rows;
    for (let r = 0; r < rows; r++) {
      let kx = x + 3 + (r % 2) * 3;
      const n = r === 4 ? 0 : 13 - (r % 2);
      if (r === 4) { c.fillStyle = '#ffffff'; roundRect(c, kx, y + 3 + r * kh, 20, kh - 1.6, 2); c.fill(); c.fillStyle = '#7fd6c0'; roundRect(c, kx + 22, y + 3 + r * kh, 60, kh - 1.6, 2); c.fill(); c.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) { roundRect(c, kx + 84 + k * 10, y + 3 + r * kh, 8.4, kh - 1.6, 2); c.fill(); } continue; }
      for (let k = 0; k < n; k++) {
        const kw = 8.2;
        c.fillStyle = (r === 0 && k === 0) ? '#ffc23d' : (r === 2 && k === n - 1) ? '#ff6b57' : (r === 1 && k > 9) ? '#8fd3f4' : '#ffffff';
        roundRect(c, kx, y + 3 + r * kh, kw, kh - 1.6, 2); c.fill(); kx += kw + 1.1;
      }
    }
  });
}
function drawPhone(c, x, y, w, h) {   // a chat on the phone screen
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#f4f1fb'; c.fillRect(x, y, w, h); c.fillStyle = '#ffd23f'; c.fillRect(x, y, w, 9);
    for (const [bx, by, bw, cc] of [[3, 14, 18, '#ffffff'], [11, 25, 18, '#ffe27a'], [3, 36, 14, '#ffffff'], [9, 47, 20, '#ffe27a']]) { c.fillStyle = cc; roundRect(c, x + bx, y + by, bw, 7, 3); c.fill(); }
  });
}
function drawRiceBag(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#fbf6ea'; c.fillRect(x, y, w, h);
    c.fillStyle = '#7fbf6a'; c.fillRect(x, y + h - 16, w, 16);
    c.strokeStyle = '#c99a3c'; c.lineWidth = 2;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + w / 2 + s * 14, y + 70); c.quadraticCurveTo(x + w / 2 + s * 20, y + 44, x + w / 2 + s * 8, y + 26); c.stroke(); for (let k = 0; k < 5; k++) { c.fillStyle = '#e8bb52'; c.beginPath(); c.ellipse(x + w / 2 + s * (10 + k * 1.5), y + 30 + k * 8, 3.4, 2, s * .6, 0, PI * 2); c.fill(); } }
    txt(c, '쌀', x + w / 2, y + 52, 26, '#3b7a3a', { stroke: '#ffffff', sw: 4 });
    txt(c, '10kg', x + w / 2, y + h - 8, 11, '#ffffff');
    c.strokeStyle = '#ff4b3a'; c.lineWidth = 2; c.beginPath(); c.arc(x + w - 14, y + 14, 9, 0, PI * 2); c.stroke(); txt(c, '햅쌀', x + w - 14, y + 14, 7, '#ff4b3a');
  });
}
function drawCupLid(c, x, y, s, label, color) {
  c.fillStyle = '#fbf3e4'; c.fillRect(x, y, s, s);
  c.fillStyle = color; blob(c, x + s / 2, y + s / 2, s * .45); c.fillStyle = '#fbf3e4'; blob(c, x + s / 2, y + s / 2, s * .36);
  txt(c, label, x + s / 2, y + s / 2 + 1, s * .26, color);
}
function drawMicroWin(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#46506e'); g.addColorStop(1, '#2a2f44'); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(255,240,200,.25)'; c.beginPath(); c.ellipse(x + w / 2, y + h * .78, 30, 7, 0, 0, PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(x + 10, y + h); c.lineTo(x + 22, y + h); c.lineTo(x + 46, y); c.lineTo(x + 34, y); c.fill();
  });
}
function drawMat(c, x, y, w, h) {   // a coir doormat: "어서와!" and a paw
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#d9a066'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#c48a50'; c.lineWidth = 1; for (let k = 0; k < 40; k++) line(c, [[x + (k * 7) % w, y + (k * 13) % h], [x + (k * 7) % w + 3, y + (k * 13) % h + 2]]);
    c.strokeStyle = '#8a5a2e'; c.lineWidth = 3; c.strokeRect(x + 5, y + 5, w - 10, h - 10);
    txt(c, '어서와!', x + w / 2 - 10, y + h / 2 + 1, 19, '#6b4224');
    c.fillStyle = '#6b4224'; blob(c, x + w - 24, y + h / 2 + 4, 6); for (const [dx, dy] of [[-7, -7], [0, -10], [7, -7]]) blob(c, x + w - 24 + dx, y + h / 2 + 4 + dy, 2.6);
  });
}
function drawDeskMat(c, x, y, w, h) {   // a sky desk mat with clouds and a cat in the corner
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#bfe4f7'; c.fillRect(x, y, w, h);
    cloud(c, x + 10, y + 14, .55); cloud(c, x + 70, y + 30, .45); cloud(c, x + 40, y + 40, .35);
    catFace(c, x + w - 16, y + h - 14, 9, '#ffffff');
    c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, w - 4, h - 4);
  });
}
function drawPack(c, x, y, w, h) {   // a five-pack of instant noodles
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#ff4b3a'; c.fillRect(x, y, w, h); c.fillStyle = '#ffd23f'; c.fillRect(x, y + h - 12, w, 12);
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x + 34, y + 36, 22, 13, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#ffd38a'; c.beginPath(); c.ellipse(x + 34, y + 33, 17, 8, 0, 0, PI * 2); c.fill();
    c.strokeStyle = '#e8a64a'; c.lineWidth = 1.4; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + 22, y + 30 + k * 2); for (let t = 0; t < 6; t++) c.quadraticCurveTo(x + 24 + t * 4, y + 27 + k * 2 + (t % 2) * 6, x + 26 + t * 4, y + 30 + k * 2); c.stroke(); }
    c.fillStyle = '#6cc46a'; blob(c, x + 44, y + 30, 2.4); blob(c, x + 26, y + 34, 2); c.fillStyle = '#ffffff'; blob(c, x + 38, y + 32, 4); c.fillStyle = '#ffc23d'; blob(c, x + 38, y + 32, 2);
    txt(c, '라면', x + 90, y + 28, 24, '#ffffff', { stroke: '#a8261c', sw: 4 }); txt(c, '5개입', x + 90, y + 50, 11, '#ffffff');
    txt(c, '얼큰한 맛', x + w / 2, y + h - 6, 9, '#c8302a');
  });
}
function drawLaptop(c, x, y, w, h) {   // a laptop showing a recipe video
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#fff7ec'; c.fillRect(x, y, w, h); c.fillStyle = '#ff6b57'; c.fillRect(x, y, w, 9);
    c.fillStyle = '#2f3346'; c.fillRect(x + 6, y + 14, 56, 36); c.fillStyle = '#ffd23f'; blob(c, x + 34, y + 32, 10); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + 30, y + 26); c.lineTo(x + 40, y + 32); c.lineTo(x + 30, y + 38); c.fill();
    c.fillStyle = '#d9d4cc'; for (let i = 0; i < 4; i++) c.fillRect(x + 68, y + 16 + i * 9, 22, 4);
    c.fillStyle = '#7fd6c0'; c.fillRect(x + 6, y + 54, 56 * .6, 3);
  });
}
const atlas = () => tex('or-atlas', 1024, 1024, c => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, AT, AT);
  LBL.forEach(([s, bg, fg], i) => {
    const x = (i % 4) * 128, y = Math.floor(i / 4) * 32;
    c.fillStyle = bg; c.fillRect(x, y, 128, 32);
    c.fillStyle = fg; c.fillRect(x, y + 2, 128, 3); c.fillRect(x, y + 27, 128, 3);
    txt(c, s, x + 64, y + 17, s.length > 4 ? 15 : s.length > 2 ? 18 : 20, fg);
  });
  drawScreen(c, 0, 64, 256, 144); drawPoster(c, 256, 64, 128, 176); drawFlyer(c, 384, 64, 64, 88);
  drawMemo(c, 448, 64, 64, 48, '#ffe680', '우유 사기!', '♡', '#8a5a2e'); drawMemo(c, 448, 112, 64, 40, '#bff0dc', '월세 25일', null, '#2f6b55');
  drawDisp(c, 384, 152, 128, 32, '0:45', '#7fffd4', true); drawDisp(c, 384, 184, 64, 24, '0:30', '#ffc23d'); drawDisp(c, 448, 184, 64, 24, '취사완료', '#7fffd4');
  drawDisp(c, 384, 208, 64, 24, '24°', '#8fd3f4'); drawTee(c, 448, 208, 64, 64); drawPatch(c, 0, 208);
  for (let i = 0; i < 4; i++) drawPhoto(c, i, i * 64, 240);
  drawKeys(c, 256, 240, 128, 48); drawPhone(c, 480, 272, 32, 64); drawRiceBag(c, 256, 288, 80, 96);
  drawCupLid(c, 336, 288, 48, '라면', '#ff4b3a'); drawCupLid(c, 336, 336, 48, '밥', '#e8462f');
  drawMicroWin(c, 0, 312, 96, 56); drawMat(c, 96, 312, 128, 64); drawDeskMat(c, 384, 336, 128, 48); drawPack(c, 0, 384, 128, 64); drawLaptop(c, 128, 384, 96, 64);
  c.fillStyle = '#fff4e2'; c.fillRect(224, 312, 32, 32); daisy(c, 240, 328, 6, '#ffffff', '#ffc23d');
}, { text: true });
const atlasMat = () => mat('#ffffff', { map: atlas() });
const screenMat = () => mat('#ffffff', { map: atlas(), emissive: '#ffffff', ei: .14 });
const bulbMat = () => mat('#fff3c4', { emissive: '#ffcf6b', ei: .9 });
const bandGeo = (rt, rb, h, rc, a = 2.2, seg = 10) => cellUV(new THREE.CylinderGeometry(rt, rb, h, seg, 1, true, -a / 2, a), rc);
const quadGeo = (w, h, rc) => cellUV(new THREE.PlaneGeometry(w, h), rc);
const discGeo = (r, rc, seg = 20) => cellUV(new THREE.CircleGeometry(r, seg), rc);

const B = {};

// ═════════════════════════════════════════════ SLEEP & STUDY ═════════════════════════════════════════════
// 로프트 침대 (2×1): a honey-wood loft bed — a sky gingham duvet on a white mattress, a mustard pillow and a bear up top, a
// ladder at the right; underneath, a little desk (laptop, lamp, books), a stool, a three-drawer organiser and a string of
// warm fairy lights along the deck. The duvet lifts.
B.loftbed = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), duv = col(T, 'duvet'), pil = col(T, 'accent3'), acc = col(T, 'accent'), acc2 = col(T, 'accent2');
  const tk = [wood, woodD, duv, pil, acc, acc2].join(',');
  const X = .9, Z = .4, PY = 1.42, MT = PY + .16, PT = PY + .5, DT = .74, DZ = .04, LX0 = .47, LX1 = .81, LZ = .47, FX = .4;
  f.add(wd('loftbed-frame', wood, ({ box, geo }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(.07, PT, .07, sx * X, PT / 2, sz * Z, { vert: true });
    const L = 2 * X - .07, Dz = 2 * Z - .07;
    for (const sz of [-1, 1]) box(L, .14, .04, 0, PY, sz * Z);                                    // deck rails
    for (const sx of [-1, 1]) box(.04, .14, Dz, sx * X, PY, 0);
    for (const y of [PY + .3, PY + .44]) {                                                         // guard rails
      box(L, .065, .035, 0, y, -Z);
      for (const sx of [-1, 1]) box(.035, .065, Dz, sx * X, y, 0);
      box(FX + X - .035, .065, .035, (FX - X + .035) / 2, y, Z);
    }
    box(.05, PT - PY - .09, .05, FX + .025, (PT + PY + .05) / 2, Z, { vert: true });             // post at the ladder gap
    for (const x of [LX0, LX1]) box(.045, PT + .04, .04, x, (PT + .04) / 2, LZ, { vert: true }); // ladder
    for (let k = 1; k <= 5; k++) geo(G.cyl(.017, .017, LX1 - LX0, 10), xf((LX0 + LX1) / 2, k * .3, LZ, 0, 0, HP));
    box(1.19, .035, .58, -.27, DT - .0175, DZ);                                                    // the desk underneath
    for (const x of [-.835, .3]) box(.03, DT - .035, .54, x, (DT - .035) / 2, DZ, { vert: true, r: .008 });
    geo(G.cyl(.16, .16, .04, 20), xf(-.25, .42, .22));                                             // stool seat (tucked under)
  }));
  const hooks = [-.84, -.43, -.02, .38], LY = PY - .075, LZ2 = .445, bulbs = [];
  const lp = (s, t) => { const a = hooks[s], b = hooks[s + 1]; return [a + (b - a) * t, LY - .09 * 4 * t * (1 - t), LZ2]; };
  const lx = -.58, lz = .1, LM = xf(lx, DT + .016 + .0955, lz - .105 - .0296, -.3, 0, 0);
  f.add(mc('loftbed|' + tk, ({ add, addM, tube }) => {
    add(G.pbox(2 * X - .07, .025, 2 * Z - .07), woodD, 0, PY - .0125, 0);                        // slat board
    add(G.box(1.7, .16, .7, .05, 2), '#fbf7ef', 0, PY + .08, 0);                                   // mattress
    for (const sz of [-1, 1]) add(G.pbox(1.6, .012, .006), acc2, 0, PY + .08, sz * (.35 + .006));
    add(G.box(.32, .1, .5, .045, 2), pil, -.64, MT + .045, -.04);                                 // pillow
    // a bear plush
    const bx = -.64, bz = .27, by = MT;
    add(G.sph(.065, 12, 8), BROWN, bx, by + .06, bz, 0, 0, 0, [1, .95, .9]);
    add(G.sph(.055, 12, 8), BROWN, bx, by + .155, bz);
    for (const s of [-1, 1]) {
      add(G.sph(.022, 8, 6), BROWN, bx + s * .042, by + .2, bz - .005);
      add(G.sph(.008, 6, 4), INK, bx + s * .02, by + .168, bz + .052, 0, 0, 0, [1, 1, .5]);
      add(G.sph(.02, 8, 6), BROWN, bx + s * .06, by + .07, bz + .03);
    }
    add(G.sph(.022, 8, 6), '#f6dcb8', bx, by + .14, bz + .047, 0, 0, 0, [1.2, .9, .5]);
    add(G.sph(.007, 6, 4), INK, bx, by + .148, bz + .06, 0, 0, 0, [1.2, .8, .6]);
    // stool legs + cushion
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + .3; tube([-.25 + Math.cos(a) * .1, .4, .22 + Math.sin(a) * .1], [-.25 + Math.cos(a) * .14, 0, .22 + Math.sin(a) * .14], .016, woodD, 6); }
    add(G.cyl(.14, .145, .03, 18), acc, -.25, .455, .22);
    // three-drawer organiser
    const ox = .62, oz = -.13;
    add(G.box(.38, .6, .44, .02), '#f4f2ee', ox, .36, oz);
    [acc2, acc, pil].forEach((c, k) => {
      const y = .165 + k * .195;
      add(G.box(.34, .17, .02, .008), c, ox, y, oz + .22 + .012);
      add(G.pbox(.1, .018, .012), shade(c, -.2), ox, y + .04, oz + .22 + .022 + .004);
    });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.sph(.025, 8, 6), DARK, ox + sx * .15, .03, oz + sz * .17);
    // desk things: a laptop, a lamp, books, a mug of pens
    add(G.box(.3, .016, .21, .006), '#e8ebf2', lx, DT + .008, lz);
    add(G.pbox(.26, .004, .1), '#c9cfdc', lx, DT + .018, lz - .03);
    addM(G.box(.3, .2, .012, .006), LM, '#e8ebf2');
    add(G.cyl(.06, .065, .02, 16), acc2, .2, DT + .01, -.18);
    tube([.2, DT + .02, -.18], [.17, DT + .3, -.15], .011, acc2, 6);
    tube([.17, DT + .3, -.15], [.1, DT + .31, -.05], .011, acc2, 6);
    add(G.cone(.062, .085, 14), acc2, .1, DT + .29, -.04, 0, 0, .25);
    [[TOMATO, 0], [SKY, .3], [CREAM, -.2]].forEach(([c, a], k) => add(G.box(.2, .03, .14, .008), c, .17, DT + .015 + k * .03, .17, 0, a, 0));
    add(G.cyl(.04, .036, .09, 14), acc, -.34, DT + .045, -.17);
    for (const [dx, c] of [[-.012, TOMATO], [.012, MUSTARD], [0, SKY]]) tube([-.34 + dx, DT + .06, -.17 + (dx ? 0 : .012)], [-.34 + dx * 2, DT + .16, -.17 + (dx ? 0 : .02)], .006, c, 5);
    // fairy lights along the deck
    for (let s = 0; s < 3; s++) {
      for (let k = 0; k < 6; k++) tube(lp(s, k / 6), lp(s, (k + 1) / 6), .004, '#4e6a4a', 4);
      for (const t of [.25, .5, .75]) { const [x, y, z] = lp(s, t); add(G.cyl(.008, .008, .02, 6), '#4e6a4a', x, y - .012, z); bulbs.push([x, y - .036, z]); }
    }
    for (const x of hooks) add(G.box(.024, .03, .03, .004), '#4e6a4a', x, LY + .012, .435);
  }));
  f.add(mg('loftbed-bulbs', bulbMat(), ({ add }) => { for (const [x, y, z] of bulbs) add(G.sph(.017, 10, 8), x, y, z, 0, 0, 0, [1, 1.3, 1]); }));
  f.add(mg('loftbed-screen', screenMat(), ({ addM }) => addM(quadGeo(.27, .18, RG.lpscreen), LM.clone().multiply(xf(0, 0, .012)))));
  // the duvet (its own mesh: it lifts)
  const pv = new THREE.Group(); put(pv, .21, MT, 0); f.add(pv);
  pv.add(pm('loftbed-duvet|' + duv, mat('#ffffff', { map: ginghamTex(duv) }), .22, ({ box }) => box(1.26, .09, .7, 0, .045, 0, { r: .04 })));
  pv.add(mc('loftbed-fold', ({ add }) => add(G.cyl(.048, .048, .72, 14), WHITE, -.6, .07, 0, HP, 0, 0)));
  const p = f.part('lift', pv, (t, b) => { pv.position.y = b.p.y + .38 * t; pv.rotation.x = .3 * t; }, { label: '로프트 이불', sfx: 'lift', dur: .32 });
  f.spot('inside', null, .3, MT, .02, { part: p, maxH: .26, label: '로프트 침대 이불 속', scale: .9 });
  f.spot('on', null, -.12, DT, .12, { maxH: .45, label: '로프트 아래 책상', scale: .85 });
  f.spot('on', null, .62, .66, -.13, { maxH: .45, label: '수납함 위', scale: .8 });
};

// ═════════════════════════════════════════════ KITCHEN & LAUNDRY ═════════════════════════════════════════════
// 원룸 주방 (2×1): a one-room kitchen run — a stainless sink with a gooseneck tap and red rubber gloves on the wooden
// counter, a two-ring induction hob (an egg in the pan, a tomato kettle), a tiled splashback, an upper cabinet with a dish
// rack under it, spice jars and a slim hood. Sage double doors under the sink and under the hob open (the hob side locks).
B.minikitchen = (f, T) => {
  const body = col(T, 'body'), dc = col(T, 'accent'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc2 = col(T, 'accent2'), acc3 = col(T, 'accent3');
  const tk = [body, dc, wood, woodD, acc2, acc3].join(',');
  const W = 1.92, X1 = W / 2, z0 = -.2, D = .56, FZ = z0 + D / 2, BZ = z0 - D / 2, y0 = .1, CT = .86, CB = CT - .045, FL = y0 + .03;
  const inner = shade(body, -.07), SX0 = -.8, SX1 = -.3, SZ0 = -.4, SZ1 = -.04, SB = .66;
  const sw = SX1 - SX0, sd = SZ1 - SZ0, scx = (SX0 + SX1) / 2, scz = (SZ0 + SZ1) / 2;
  f.add(wd('minikitchen-top', wood, ({ box }) => {   // the counter, around the sink hole
    const y = CT - .0225, o = { r: 0 };
    box(1.94, .045, .15, 0, y, .035, o); box(1.94, .045, .1, 0, y, -.45, o);
    box(.17, .045, .36, -.885, y, scz, o); box(1.27, .045, .36, .335, y, scz, o);
  }));
  f.add(pm('minikitchen-tiles', mat('#ffffff', { map: tileTex('#fdfbf6', '#bcdccb') }), .4, ({ box }) => {
    box(1.94, .56, .02, 0, CT + .28, -.49, { r: 0 });
    box(.92, .52, .02, .51, 1.68, -.49, { r: 0 });
  }));
  const flatCap = (r, len) => G.cap(r, len, 2, 6).rotateX(HP);
  f.add(mc('minikitchen|' + tk, ({ add, addM, tube }) => {
    // carcass
    add(G.pbox(W - .06, y0, D - .08), '#a39a8c', 0, y0 / 2, z0 - .03);
    add(G.box(W - .08, .03, D, .008), inner, 0, y0 + .015, z0);
    for (const sx of [-1, 1]) add(G.box(.04, CB - y0, D, .008), body, sx * (X1 - .02), (y0 + CB) / 2, z0);
    add(G.pbox(W - .08, CB - FL, .02), inner, 0, (FL + CB) / 2, BZ + .01);
    add(G.pbox(.04, CB - FL, .48), body, 0, (FL + CB) / 2, -.2);
    add(G.box(W - .08, .035, .04, .008), body, 0, CB - .0175, FZ - .02);
    add(G.pbox(.88, .02, .48), inner, .47, .46, -.2);
    // the sink: basin, rim, drain, a gooseneck tap
    add(G.pbox(sw - .024, .012, sd - .024), SINK2, scx, SB + .006, scz);
    for (const sz of [-1, 1]) add(G.pbox(sw, CT - SB, .012), SINK, scx, (CT + SB) / 2, scz + sz * (sd / 2 - .006));
    for (const sx of [-1, 1]) add(G.pbox(.012, CT - SB, sd - .024), SINK, scx + sx * (sw / 2 - .006), (CT + SB) / 2, scz);
    for (const sz of [-1, 1]) add(G.pbox(sw + .06, .01, .03), SINK, scx, CT + .005, scz + sz * (sd / 2 + .015));
    for (const sx of [-1, 1]) add(G.pbox(.03, .01, sd), SINK, scx + sx * (sw / 2 + .015), CT + .005, scz);
    add(G.cyl(.026, .026, .006, 14), '#8f97ab', -.5, SB + .015, scz);
    const fx = -.55, fz = -.45;
    add(G.cyl(.032, .036, .03, 14), SINK, fx, CT + .015, fz);
    tube([fx, CT + .03, fz], [fx, CT + .3, fz], .016, SINK, 10);
    add(G.tor(.08, .016, PI, 6, 14), SINK, fx, CT + .3, fz + .08, 0, HP, 0);
    tube([fx, CT + .3, fz + .16], [fx, CT + .25, fz + .16], .015, SINK, 10);
    tube([fx, CT + .2, fz], [fx + .07, CT + .23, fz + .01], .009, SINK2, 6);
    // red rubber gloves drying on the counter
    for (const [gx, gz, a, y] of [[.12, -.15, .2, 0], [.235, -.13, -.15, .001]]) {
      const M = xf(gx, CT + y, gz, 0, a, 0);
      addM(G.box(.1, .016, .1, .007), M.clone().multiply(xf(0, .008, .06)), RUBBER);
      addM(G.box(.086, .02, .09, .009), M.clone().multiply(xf(0, .01, -.03)), RUBBER);
      for (let k = 0; k < 4; k++) addM(flatCap(.0105, .04 + (k === 1 || k === 2 ? .012 : 0)), M.clone().multiply(xf(-.03 + k * .02, .0105, -.1 - (k === 1 || k === 2 ? .006 : 0))), RUBBER);
      addM(flatCap(.011, .035), M.clone().multiply(xf(.052, .011, -.035, 0, -.6, 0)), RUBBER);
      addM(G.pbox(.1, .004, .016), M.clone().multiply(xf(0, .0185, .095)), '#ffd0d6');
    }
    // the hob: black glass, two rings, touch keys; a pan with a fried egg; a tomato kettle on the back ring
    add(G.box(.56, .014, .42, .006), CHAR, .58, CT + .007, -.21);
    for (const [x, z, r] of [[.47, -.29, .09], [.7, -.12, .075]]) add(G.tor(r, .005, PI * 2, 3, 24), '#8e88a8', x, CT + .014, z, HP, 0, 0);
    for (let k = 0; k < 4; k++) add(G.sph(.008, 6, 4), k === 3 ? TOMATO : WHITE, .38 + k * .05, CT + .014, -.03, 0, 0, 0, [1, .4, 1]);
    const py = CT + .014;
    add(G.lathe([[0, 0], [.07, 0], [.085, .035], [.077, .035], [.064, .008], [0, .008]], 20), acc2, .7, py, -.12);
    add(flatCap(.012, .1).rotateY(HP), woodD, .85, py + .03, -.12);
    add(G.sph(.042, 12, 8), WHITE, .69, py + .012, -.125, 0, .4, 0, [1, .22, .9]);
    add(G.sph(.018, 10, 8), MUSTARD, .7, py + .018, -.13, 0, 0, 0, [1, .55, 1]);
    const kx = .47, kz = -.29, ky = CT + .014;
    add(G.cyl(.072, .075, .016, 18), WHITE, kx, ky + .008, kz);
    add(G.lathe([[0, 0], [.07, 0], [.078, .02], [.075, .12], [.05, .165], [0, .17]], 18), TOMATO, kx, ky + .016, kz);
    add(G.sph(.016, 8, 6), WHITE, kx, ky + .19, kz);
    add(G.tor(.05, .012, PI, 4, 10), WHITE, kx - .072, ky + .09, kz, 0, 0, HP);
    tube([kx + .06, ky + .07, kz + .02], [kx + .11, ky + .13, kz + .04], .012, TOMATO, 8);
    face(add, kx, ky + .085, kz + .074, .4, { blush: null });
    // a sky cutting board leaning on the tiles
    const CBM = xf(-.1, CT + .15, -.458, -.1, 0, 0);
    addM(G.box(.24, .3, .015, .01), CBM, acc2);
    addM(G.cyl(.022, .022, .012, 12), CBM.clone().multiply(xf(0, .11, .0075, HP, 0, 0)), shade(acc2, -.25));
    // upper cabinet, its doors, a dish rack under it
    add(G.box(1.0, .52, .32, .015), body, -.47, 1.68, -.34);
    for (const x of [-.715, -.225]) {
      add(G.box(.475, .48, .02, .01), dc, x, 1.68, -.17);
      add(G.pbox(.39, .4, .008), shade(dc, .07), x, 1.68, -.158);
      add(G.box(.08, .016, .016, .005), STEEL, x + (x < -.47 ? .17 : -.17), 1.475, -.152);
    }
    add(G.pbox(.5, .012, .18), STEEL, -.55, 1.12, -.39);
    tube([-.8, 1.2, -.3], [-.3, 1.2, -.3], .006, STEEL, 6);
    for (const x of [-.8, -.3]) { tube([x, 1.12, -.3], [x, 1.2, -.3], .006, STEEL, 6); tube([x, 1.126, -.47], [x, 1.42, -.47], .007, STEEL, 6); }
    for (let k = 0; k < 4; k++) add(G.cyl(.085, .085, .012, 20), k % 2 ? WHITE : CREAM, -.74 + k * .055, 1.126 + .085, -.39, 0, 0, HP + .12);
    add(G.dome(.055, 14, 5), acc3, -.44, 1.126, -.4); add(G.dome(.05, 14, 5), SKY, -.36, 1.126, -.37);
    // spice shelf + jars
    add(G.box(.18, .02, .1, .006), woodD, .145, 1.22, -.43);
    [TOMATO, '#e8d6a8', LEAF].forEach((c, k) => { add(G.cyl(.022, .022, .06, 10), WHITE, .085 + k * .06, 1.26, -.43); add(G.cyl(.024, .024, .016, 10), c, .085 + k * .06, 1.298, -.43); });
    // slim range hood
    add(G.box(.64, .12, .36, .02), SINK, .58, 1.54, -.3);
    add(G.box(.28, .34, .17, .015), SINK, .58, 1.77, -.395);
    add(G.pbox(.58, .03, .006), STEEL2, .58, 1.515, -.12 + .009);
    for (let k = 0; k < 3; k++) add(G.sph(.008, 6, 4), k ? WHITE : MINT, .78 + k * .03, 1.565, -.12 + .006, 0, 0, 0, [1, 1, .5]);
    // inside the cabinets: the drain, a soap refill, a bucket; a pot; plates
    tube([-.5, SB, scz], [-.5, .42, scz], .02, PVC, 10);
    add(G.sph(.022, 8, 6), PVC, -.5, .42, scz);
    tube([-.5, .42, scz], [-.5, .42, -.455], .02, PVC, 10);
    add(G.box(.09, .16, .06, .02), MINT, -.84, FL + .08, -.32);
    add(G.cyl(.08, .065, .14, 16), TOMATO, -.27, FL + .07, -.3);
    add(G.tor(.075, .006, PI, 3, 12), DARK, -.27, FL + .14, -.3, 0, .3, 0);
    add(G.cyl(.1, .1, .1, 18), STEEL, .3, FL + .05, -.28);
    add(G.cyl(.102, .102, .01, 18), STEEL2, .3, FL + .105, -.28);
    add(G.sph(.016, 8, 6), DARK, .3, FL + .115, -.28);
    for (let k = 0; k < 4; k++) add(G.cyl(.1, .09, .012, 18), k % 2 ? WHITE : CREAM, .75, .47 + .006 + k * .013, -.3);
  }));
  f.add(mg('minikitchen-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.08, .02, LB(6)), -.84, FL + .1, -.32 + .03 + .006);
    add(quadGeo(.12, .09, RG.memo), -.18, 1.74, -.148, 0, 0, .05);
  }));
  // the four lower doors (two parts)
  const DW = .446, DH = .68, DY = .46, DZ = FZ + .02;
  const door = (hx, dir, key) => {   // dir +1: the door runs to +x of its hinge, -1: to -x
    const pv = new THREE.Group(); put(pv, hx, DY, DZ);
    const cx = dir * DW / 2, hxl = dir * (DW - .055);
    pv.add(mc('minikitchen-door' + key + '|' + tk, ({ add }) => {
      add(G.box(DW, DH, .028, .012), dc, cx, 0, 0);
      add(G.box(DW - .09, DH - .12, .012, .006), shade(dc, .07), cx, 0, .014);
      add(G.box(.018, .16, .018, .006), STEEL, hxl, .2, .023);
    }));
    f.add(pv); return pv;
  };
  const LA = door(-.92, 1, 'la'), LB2 = door(-.02, -1, 'lb'), RA = door(.02, 1, 'ra'), RB = door(.92, -1, 'rb');
  const pL = f.part('door', [LA, LB2], t => { LA.rotation.y = -1.75 * t; LB2.rotation.y = 1.4 * t; }, { label: '싱크대 아래 찬장', sfx: 'open', dur: .3 });
  const pR = f.part('door', [RA, RB], t => { RA.rotation.y = -1.4 * t; RB.rotation.y = 1.75 * t; }, { label: '인덕션 아래 찬장', sfx: 'open', dur: .3 });
  pR.lockable = true; pR.lockKind = 'pad'; f.lockAt = { x: .47, y: .62, z: DZ + .06 };
  f.spot('inside', null, -.68, FL, -.02, { part: pL, maxH: .4, label: '싱크대 아래', scale: .9 });
  f.spot('inside', null, .3, .47, -.12, { part: pR, maxH: .28, label: '인덕션 아래 위칸', scale: .85 });
  f.spot('inside', null, .7, FL, -.08, { part: pR, maxH: .28, label: '인덕션 아래 아래칸', scale: .85 });
  f.spot('on', null, -.06, CT, -.12, { maxH: .45, label: '조리대 위', scale: .85 });
};

// 미니 냉장고 (1×1): a retro tomato mini fridge with a chrome handle, covered in magnets — a fried-chicken menu, a cat photo,
// a strawberry, a cat, a heart and a "rent day" note — a microwave and instant rice on top. The door opens onto banana milk,
// kimchi and a can of cider.
B.minifridge = (f, T) => {
  const fb = col(T, 'fridge'), tk = [fb].join(',');
  const W = .54, H = .84, D = .5, z0 = -.2, y0 = .05, FZ = z0 + D / 2, BZ = z0 - D / 2, topY = y0 + H;
  const liner = '#f6f2ea', shelfC = '#d3ecf6', fl = .106, SH = .47, MH = .27, MD = .36, mz = z0 - .02, mf = mz + MD / 2, my = topY;
  f.add(mc('minifridge|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.022, .018, y0, 10), STEEL2, sx * .2, y0 / 2, z0 + sz * .18);
    add(G.box(W, H, .04, .025), fb, 0, y0 + H / 2, BZ + .02);
    for (const sx of [-1, 1]) add(G.box(.04, H, D, .02), fb, sx * (W / 2 - .02), y0 + H / 2, z0);
    add(G.box(W - .08, .04, D, .015), fb, 0, topY - .02, z0);
    add(G.box(W - .08, .05, D, .015), fb, 0, y0 + .025, z0);
    add(G.pbox(W - .08, H - .09, .01), liner, 0, y0 + H / 2, BZ + .045);
    add(G.pbox(W - .08, .006, .44), liner, 0, fl - .003, -.18);
    for (const sx of [-1, 1]) add(G.pbox(.006, H - .09, .44), liner, sx * (W / 2 - .043), y0 + H / 2, -.18);
    add(G.pbox(W - .094, .014, .3), shelfC, 0, SH, -.24);
    // inside: banana milk, a kimchi box, a can of cider
    for (const [x, z] of [[-.16, -.3], [-.07, -.33]]) {
      add(G.lathe([[0, 0], [.03, 0], [.038, .03], [.036, .07], [.018, .095], [.016, .11], [0, .11]], 14), '#ffe066', x, fl, z);
      add(G.cyl(.017, .017, .012, 10), '#f6f0dc', x, fl + .114, z);
    }
    add(G.box(.15, .08, .12, .012), '#f3f0ea', -.12, SH + .007 + .04, -.27);
    add(G.box(.155, .022, .125, .008), TOMATO, -.12, SH + .007 + .091, -.27);
    add(G.cyl(.028, .028, .1, 12), MINT, .17, SH + .007 + .05, -.37);
    add(G.cyl(.022, .026, .008, 12), STEEL, .17, SH + .007 + .104, -.37);
    // the microwave on top
    add(G.box(.48, MH, MD, .02), '#fbfbf8', 0, my + MH / 2, mz);
    add(G.box(.33, .23, .012, .006), '#efefec', -.065, my + MH / 2, mf + .006);
    add(G.box(.018, .19, .02, .007), STEEL, .085, my + MH / 2, mf + .022);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) add(G.pbox(.034, .022, .008), r === 2 && k === 1 ? MINT : '#dfe2ea', .145 + k * .045, my + .155 - r * .034, mf + .004);
    add(G.cyl(.026, .026, .016, 16), STEEL, .167, my + .045, mf + .008, HP, 0, 0);
    // instant rice and a succulent on the microwave
    for (let k = 0; k < 2; k++) add(G.cyl(.06, .05, .045, 16), WHITE, -.15, my + MH + .0225 + k * .045, -.13);
    add(G.cyl(.045, .038, .07, 12), SKY, .18, my + MH + .035, -.36);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; add(G.sph(.026, 8, 5), i % 2 ? LEAF : LEAF3, .18 + Math.cos(a) * .022, my + MH + .085 + (i % 2) * .012, -.36 + Math.sin(a) * .022, 0, -a, .7, [1.4, .6, .8]); }
  }));
  f.add(mg('minifridge-prints', atlasMat(), ({ add }) => {
    for (const [x, z] of [[-.16, -.3], [-.07, -.33]]) add(bandGeo(.04, .04, .014, LB(2), 1.8), x, fl + .05, z);
    add(bandGeo(.031, .031, .05, LB(4), 2.2), .17, SH + .007 + .05, -.37);
    add(quadGeo(.09, .034, RG.mdisp), .167, my + .225, mf + .006);
    add(quadGeo(.3, .175, RG.mwin), -.065, my + MH / 2, mf + .012 + .006);
    add(discGeo(.058, RG.hetban), -.15, my + MH + .09 + .006, -.13, -HP, 0, 0);
    add(bandGeo(.059, .059, .016, LB(1), 2), -.15, my + MH + .067, -.13);
  }));
  // the door
  const DW = W - .006, DH = H - .012, DT = .06, Z = DT / 2;
  const pv = new THREE.Group(); put(pv, -W / 2 + .003, y0 + H / 2, FZ + Z + .002); f.add(pv);
  const cx = DW / 2;
  pv.add(mc('minifridge-door|' + tk, ({ add }) => {
    add(G.box(DW, DH, DT, .03, 2), fb, cx, 0, 0);
    add(G.box(.026, .3, .026, .01), STEEL, DW - .055, .12, Z + .035);
    for (const dy of [0, .24]) add(G.cyl(.01, .01, .025, 8), STEEL, DW - .055, dy, Z + .0125, HP, 0, 0);
    add(G.box(.09, .025, .008, .003), STEEL, cx, DH / 2 - .06, Z + .004);
    // magnets
    add(G.sph(.03, 10, 8), TOMATO, .1, .3, Z + .012, 0, 0, 0, [1, 1.15, .45]);
    for (const a of [-.6, 0, .6]) add(G.sph(.014, 6, 4), LEAF, .1 + Math.sin(a) * .016, .34, Z + .016, 0, 0, a, [1, .5, .4]);
    for (const [dx, dy] of [[-.01, .01], [.01, -.008], [0, -.025]]) add(G.sph(.004, 4, 3), MUSTARD, .1 + dx, .3 + dy, Z + .026);
    add(G.sph(.034, 12, 8), WHITE, .38, .34, Z + .012, 0, 0, 0, [1, .9, .4]);
    for (const s of [-1, 1]) { add(G.cone(.013, .026, 6), WHITE, .38 + s * .021, .368, Z + .011, 0, 0, -s * .35, [1, 1, .4]); add(G.sph(.005, 5, 4), INK, .38 + s * .012, .342, Z + .026, 0, 0, 0, [1, 1, .5]); }
    add(G.sph(.005, 5, 4), BLUSH, .38, .332, Z + .026, 0, 0, 0, [1, 1, .5]);
    add(G.ext(heartShape(.075), .012, 0, 6), MUSTARD, .13, -.29, Z + .004);
    add(G.ext(starShape(.038, .017), .01, 0, 2), SKY, .39, .02, Z + .004);
    add(G.cyl(.013, .013, .01, 10), TOMATO, .14, .135, Z + .006 + .005, HP, 0, 0);
    add(G.cyl(.012, .012, .01, 10), MINT, .3, -.165, Z + .006 + .005, HP, 0, 0);
    // door bins and bottles on the inside
    for (const by of [-.17, .13]) {
      add(G.box(DW - .1, .012, .05, .004), liner, cx, by, -Z - .025);
      add(G.box(DW - .1, .05, .008, .004), liner, cx, by + .025, -Z - .046);
    }
    [[.1, MINT, .12], [.17, TOMATO, .09], [.23, MUSTARD, .09]].forEach(([x, c, h]) => { add(G.cyl(.02, .02, h, 10), c, x, -.17 + .006 + h / 2, -Z - .025); add(G.cyl(.01, .012, .02, 8), WHITE, x, -.17 + .006 + h + .01, -Z - .025); });
    add(G.box(.05, .1, .045, .006), WHITE, .36, -.17 + .056, -Z - .025);
    add(G.box(.052, .02, .047, .004), SKY, .36, -.17 + .111, -Z - .025);
    for (let k = 0; k < 4; k++) add(G.sph(.022, 8, 6), '#fff7ea', .1 + k * .05, .13 + .006 + .02, -Z - .025, 0, 0, 0, [1, 1.25, 1]);
  }));
  pv.add(mg('minifridge-doorprints', atlasMat(), ({ add }) => {
    add(quadGeo(.15, .206, RG.flyer), .14, .04, Z + .006, 0, 0, .04);
    add(quadGeo(.1, .1125, PHOTO(1)), .32, .2, Z + .006, 0, 0, -.08);
    add(quadGeo(.13, .081, RG.memo2), .3, -.2, Z + .006);
  }));
  const p = f.part('door', pv, t => { pv.rotation.y = -1.85 * t; }, { label: '미니 냉장고', sfx: 'open', dur: .3 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: DW - .09, y: .12, z: Z + .035, parent: pv };   // a friend can hide in here (사건 판)
  f.spot('inside', null, .1, fl, -.2, { part: p, maxH: .3, label: '냉장고 아래칸', scale: .8 });
  f.spot('inside', null, .08, SH + .007, -.22, { part: p, maxH: .3, label: '냉장고 위칸', scale: .8 });
  f.spot('on', null, .03, my + MH, -.18, { maxH: .45, label: '전자레인지 위', scale: .8 });
};

// 신발장 (1×1): a slim cream shoe cabinet with louvred honey doors on tall legs — a maneki-neko and a key tray on top,
// slippers tucked underneath, sneakers on an "어서와!" doormat in front. Both doors open onto shelves of sneakers.
B.shoerack = (f, T) => {
  const body = col(T, 'body'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc2 = col(T, 'accent2'), acc = col(T, 'accent'), acc3 = col(T, 'accent3');
  const tk = [body, wood, woodD, acc2, acc, acc3].join(',');
  const W = .82, H = .98, D = .34, z0 = -.3, y0 = .12, FZ = z0 + D / 2, BZ = z0 - D / 2, topY = y0 + H, TY = topY + .035;
  const inner = shade(body, -.07), S = [y0 + .02, y0 + .34, y0 + .66];
  const sneaker = (add, x, y, z, c, a = 0, hi = false) => {
    const M = xf(x, y, z, 0, a, 0), A = (g, m, cc) => add(g, cc, ...new THREE.Vector3().setFromMatrixPosition(M.clone().multiply(m)).toArray(), 0, a, 0);
    A(G.box(.09, .024, .23, .01), xf(0, .012, 0), WHITE);
    A(G.box(.082, hi ? .1 : .06, .17, .028), xf(0, .024 + (hi ? .05 : .03), -.025), c);
    A(G.box(.078, .045, .08, .022), xf(0, .045, .06), c);
    A(G.pbox(.03, .006, .07), xf(0, (hi ? .124 : .084) + .003, 0), WHITE);
  };
  f.add(mc('shoerack|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.02, .014, y0, 8), woodD, sx * (W / 2 - .06), y0 / 2, z0 + sz * (D / 2 - .05));
    add(G.pbox(W - .07, H, .02), inner, 0, y0 + H / 2, BZ + .01);
    for (const sx of [-1, 1]) add(G.box(.035, H, D, .01), body, sx * (W / 2 - .0175), y0 + H / 2, z0);
    add(G.box(W - .07, .02, D, .006), inner, 0, y0 + .01, z0);
    for (const y of S.slice(1)) add(G.pbox(W - .07, .018, D - .04), inner, 0, y - .009, z0 - .01);
    // sneakers inside
    for (const dx of [-.055, .055]) {
      sneaker(add, -.18 + dx, S[2], -.31, acc2);
      sneaker(add, .18 + dx, S[1], -.31, acc3);
      sneaker(add, -.18 + dx, S[0], -.31, WHITE, 0, true);
      sneaker(add, .18 + dx, S[0], -.31, acc);
    }
    // slippers under the cabinet
    for (const dx of [-.06, .06]) { add(G.box(.09, .02, .22, .03), acc2, .08 + dx, .01, -.26); add(G.box(.094, .035, .08, .03), CREAM, .08 + dx, .03, -.2); }
    // on top: a maneki-neko and a key tray
    const nx = -.27, nz = -.3;
    add(G.sph(.06, 12, 8), WHITE, nx, TY + .055, nz, 0, 0, 0, [1, 1.05, .9]);
    add(G.sph(.052, 12, 8), WHITE, nx, TY + .14, nz);
    for (const s of [-1, 1]) {
      add(G.cone(.02, .04, 6), WHITE, nx + s * .032, TY + .19, nz, 0, 0, -s * .3);
      add(G.cone(.011, .022, 6), BLUSH, nx + s * .031, TY + .187, nz + .008, 0, 0, -s * .3);
      add(G.tor(.008, .0025, PI, 3, 8), INK, nx + s * .02, TY + .145, nz + .05);
      add(G.sph(.01, 6, 4), BLUSH, nx + s * .034, TY + .128, nz + .04, 0, 0, 0, [1, .7, .4]);
    }
    add(G.cap(.017, .05, 2, 6), WHITE, nx + .05, TY + .15, nz + .015, 0, 0, -.25);
    add(G.tor(.042, .008, PI * 2, 4, 16), TOMATO, nx, TY + .105, nz, HP + .3, 0, 0);
    add(G.sph(.013, 8, 6), GOLD, nx, TY + .093, nz + .047);
    add(G.sph(.028, 10, 6), GOLD, nx - .018, TY + .055, nz + .05, 0, 0, 0, [1, 1.3, .35]);
    add(G.box(.17, .014, .11, .005), woodD, .3, TY + .007, -.26);
    for (const sx of [-1, 1]) add(G.pbox(.006, .014, .11), shade(woodD, -.1), .3 + sx * .082, TY + .021, -.26);
    add(G.tor(.018, .004, PI * 2, 3, 12), GOLD, .27, TY + .018, -.25, HP, 0, 0);
    add(G.box(.06, .008, .018, .003), GOLD, .31, TY + .018, -.25, 0, .3, 0);
    add(G.box(.04, .025, .008, .004), TOMATO, .33, TY + .02, -.28, 0, -.4, 0);
    // the doormat and a pair of sneakers on it
    add(G.box(.7, .015, .38, .006), '#c48a50', 0, .0075, .2);
    for (const dx of [-.055, .055]) sneaker(add, -.17 + dx * 1.2, .021, .22, TOMATO, .3 + dx * 2);
    for (const dx of [-.055, .055]) { add(G.box(.085, .02, .2, .03), acc, .2 + dx, .031, .24); add(G.box(.089, .03, .07, .028), WHITE, .2 + dx, .049, .19); }
  }));
  f.add(wd('shoerack-top', wood, ({ box }) => box(W + .04, .035, D + .03, 0, topY + .0175, z0 + .01)));
  f.add(mg('shoerack-mat', atlasMat(), ({ add }) => add(quadGeo(.66, .33, RG.mat), 0, .015 + .006, .2, -HP, 0, 0)));
  const DWd = W / 2 - .008, DH = H - .02, DZ = FZ + .016;
  const door = sx => {   // sx = -1: the left door (hinge on the left edge), +1: the right one
    const pv = new THREE.Group(); put(pv, sx * (W / 2 - .004), y0 + H / 2, DZ);
    const cx = -sx * DWd / 2;
    pv.add(pm('shoerack-louvre' + sx + '|' + wood, mat('#ffffff', { map: louvreTex(wood) }), .2, ({ box }) => box(DWd - .06, DH - .06, .02, cx, 0, 0, { r: 0 })));
    pv.add(wd('shoerack-frame' + sx, shade(wood, -.04), ({ box }) => {
      for (const k of [-1, 1]) box(.03, DH, .032, cx + k * (DWd / 2 - .015), 0, 0, { vert: true, r: .006 });
      for (const k of [-1, 1]) box(DWd - .06, .03, .032, cx, k * (DH / 2 - .015), 0, { r: .006 });
    }));
    pv.add(mc('shoerack-knob' + sx, ({ add }) => add(G.sph(.02, 10, 8), BRASS, -sx * (DWd - .045), .06, .03)));
    f.add(pv); return pv;
  };
  const L = door(-1), R = door(1);
  const p = f.part('door', [L, R], t => { L.rotation.y = -1.75 * t; R.rotation.y = 1.75 * t; }, { label: '신발장', sfx: 'open', dur: .3 });
  f.spot('inside', null, .18, S[2], -.3, { part: p, maxH: .26, label: '신발장 위칸', scale: .85 });
  f.spot('inside', null, -.18, S[1], -.3, { part: p, maxH: .26, label: '신발장 가운데칸', scale: .85 });
  f.spot('on', null, .04, TY, -.3, { maxH: .45, label: '신발장 위', scale: .8 });
};

// 드럼 세탁기 (1×1): a white front-loading washer — a chrome-ringed porthole (laundry tumbling behind the glass), a dial, a
// display and a detergent drawer; folded towels and the detergent on top. The door swings open onto the drum.
B.washer2 = (f, T) => {
  const acc2 = col(T, 'accent2'), acc = col(T, 'accent'), acc3 = col(T, 'accent3'), tk = [acc2, acc, acc3].join(',');
  const W = .62, H = .86, D = .58, z0 = -.19, y0 = .02, FZ = z0 + D / 2, BZ = z0 - D / 2, topY = y0 + H, PT = .025;
  const DR = .19, DY = .4, DL = .34, body = '#fbfcfe', panel = '#e6eaf2', CY = topY - .085;
  f.add(mc('washer2|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.025, .025, y0, 8), DARK, sx * .25, y0 / 2, z0 + sz * .22);
    add(G.box(W, H, .03, .02), body, 0, y0 + H / 2, BZ + .015);
    for (const sx of [-1, 1]) add(G.box(.03, H, D - PT, .015), body, sx * (W / 2 - .015), y0 + H / 2, z0 - PT / 2);
    add(G.box(W - .06, .03, D - PT, .012), body, 0, topY - .015, z0 - PT / 2);
    add(G.pbox(W - .06, .03, D - PT - .03), '#dfe3ea', 0, y0 + .015, z0 - PT / 2 + .015);
    const sh = rrShape(-W / 2, y0, W, H, .03); sh.holes.push(new THREE.Path().absarc(0, DY, DR + .012, 0, PI * 2, true));
    add(G.ext(sh, PT, 0, 24), body, 0, 0, FZ - PT);
    add(G.tor(DR + .008, .016, PI * 2, 6, 32), '#9aa0b4', 0, DY, FZ - .008);
    add(G.cyl(.04, .04, .02, 14), STEEL2, 0, DY, -.25, HP, 0, 0);
    for (let i = 0; i < 3; i++) { const a = HP + i * PI * 2 / 3; add(G.box(.05, .03, .3, .01), STEEL, Math.cos(a) * (DR - .015), DY + Math.sin(a) * (DR - .015), -.09, 0, 0, a + HP); }
    // laundry in the drum
    add(G.sph(.12, 12, 8), WHITE, -.01, .24, -.12, 0, .4, 0, [1.1, .4, 1]);
    add(G.cap(.025, .08, 2, 6), acc2, .07, .27, -.18, HP, .5, 0);
    add(G.sph(.06, 10, 8), CORAL, -.08, .27, -.2, 0, 0, 0, [1.2, .5, 1]);
    // control strip: detergent drawer, display, dial
    add(G.box(W - .04, .12, .012, .006), panel, 0, CY, FZ + .006);
    add(G.box(.2, .085, .016, .006), WHITE, -.18, CY, FZ + .018);
    add(G.pbox(.08, .012, .004), STEEL2, -.18, CY - .03, FZ + .026 + .004);
    add(G.cyl(.045, .045, .024, 20), WHITE, .2, CY, FZ + .024, HP, 0, 0);
    add(G.tor(.045, .006, PI * 2, 4, 20), STEEL2, .2, CY, FZ + .03);
    add(G.box(.008, .03, .006, .002), acc2, .2, CY + .015, FZ + .036 + .003);
    // on top: folded towels and the detergent
    add(G.box(.26, .05, .2, .02), acc, -.14, topY + .025, -.18);
    add(G.box(.25, .045, .19, .02), acc3, -.14, topY + .0725, -.18);
    for (const [y, c] of [[.025, acc], [.0725, acc3]]) for (const dy of [-.008, .008]) add(G.pbox(.2, .006, .004), WHITE, -.14, topY + y + dy, -.08 + .006 + .002 - (c === acc3 ? .005 : 0));
    add(G.box(.12, .2, .08, .02), acc2, .18, topY + .1, -.32);
    add(G.cyl(.022, .022, .03, 10), WHITE, .2, topY + .215, -.33);
    add(G.tor(.035, .01, PI, 4, 10), acc2, .18 - .06, topY + .15, -.32, 0, 0, HP);
    add(G.cyl(.033, .033, .14, 12), LILAC, .04, topY + .07, -.36);
    add(G.cyl(.016, .016, .025, 8), WHITE, .04, topY + .152, -.36);
  }));
  f.add(mg('washer2-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.17, .0425, RG.wdisp), .02, CY, FZ + .012 + .006);
    add(quadGeo(.1, .025, LB(3)), .18, topY + .1, -.32 + .04 + .006);
    add(bandGeo(.0345, .0345, .03, LB(5), 2.2), .04, topY + .08, -.36);
  }));
  f.add(mg('washer2-drum', mat('#ffffff', { map: perfTex(), side: BS }), ({ addM }) => addM(scaleUV(G.cyl(DR, DR, DL, 28, true), 6, 2), xf(0, DY, FZ - PT - DL / 2 + .002, HP, 0, 0))));
  f.add(mg('washer2-drumback', mat('#ffffff', { map: perfTex() }), ({ add }) => add(scaleUV(new THREE.CircleGeometry(DR, 28), 2, 2), 0, DY, FZ - PT - DL + .005)));
  // the porthole door
  const DRO = DR + .055, hx = -DRO - .01;
  const pv = new THREE.Group(); put(pv, hx, DY, FZ + .025); f.add(pv);
  pv.add(mc('washer2-door', ({ add }) => {
    add(G.cyl(DRO, DRO, .03, 32), WHITE, DRO + .01, 0, 0, HP, 0, 0);
    add(G.tor(DR + .03, .016, PI * 2, 6, 32), STEEL, DRO + .01, 0, .015);
    add(G.box(.04, .09, .03, .012), STEEL2, 2 * DRO - .025, 0, .02);
  }));
  pv.add(mg('washer2-glass', mat('#ffffff', { map: washGlassTex() }), ({ add }) => {
    add(new THREE.CircleGeometry(DR + .01, 28), DRO + .01, 0, .015 + .006);
    add(new THREE.CircleGeometry(DR - .03, 28), DRO + .01, 0, -.015 - .006, 0, PI, 0);
  }));
  pv.add(mc('washer2-doorback', ({ add }) => add(G.tor(DR - .025, .012, PI * 2, 5, 28), '#9aa0b4', DRO + .01, 0, -.015)));
  const p = f.part('door', pv, t => { pv.rotation.y = -1.65 * t; }, { label: '세탁기 문', sfx: 'open', dur: .32 });
  f.spot('inside', null, 0, .285, -.06, { part: p, maxH: .26, label: '세탁기 안', scale: .85 });
  f.spot('on', null, .13, topY, -.04, { maxH: .45, label: '세탁기 위', scale: .8 });
};

// ═════════════════════════════════════════════ LIVING ═════════════════════════════════════════════
// 옷걸이 행거 (1×1): a chrome clothes rail on casters — a letterman jacket, a plaid flannel, a mustard hoodie, a striped tee, a
// sage dress and a long camel coat on wooden hangers, a canvas tote on the end post, a woven basket and a shoe box on the
// wire shelf. Things hide on the shelf behind the long clothes.
B.hanger = (f, T) => {
  const acc = col(T, 'accent'), acc2 = col(T, 'accent2'), acc3 = col(T, 'accent3'), woodD = col(T, 'woodD'), tk = [acc, acc2, acc3, woodD].join(',');
  const X = .44, RY = 1.6, ZF = .26, metal = '#dfe4ec', SY = .2, CY = RY - .085, GT = .028, CAMEL = '#e2a86a';
  // [x, half width, length, sleeves]
  const GM = { jacket: [-.33, .19, .56, 'long'], flannel: [-.2, .18, .62, 'long'], hoodie: [-.07, .19, .58, 'long'], tee: [.07, .17, .46, 'short'], coat: [.2, .19, 1.12, 'long'], dress: [.33, .16, 1.02, 'none'] };
  const Mg = x => xf(x, CY, 0, 0, HP, 0);   // a garment's own frame: x across it (world -z), y up, z out of its +x face
  const bodyG = k => { const [x, w, L] = GM[k]; return [G.ext(bodyShape(w, L), GT, .004, 4), Mg(x).multiply(xf(0, 0, -GT / 2))]; };
  const sleeves = k => {
    const [x, w, L, sl] = GM[k], out = [];
    if (sl === 'short') for (const s of [-1, 1]) out.push([G.box(.09, .13, GT, .012), Mg(x).multiply(xf(s * (w + .02), -.08, 0, 0, 0, s * .55))]);
    if (sl === 'long') for (const s of [-1, 1]) out.push([G.cap(.036, L * .6, 2, 8), Mg(x).multiply(xf(s * (w + .014), -.07 - L * .32, 0, 0, 0, s * .06, [1, 1, .55]))]);
    return out;
  };
  f.add(mc('hanger|' + tk, ({ add, addM, tube }) => {
    for (const sx of [-1, 1]) {
      tube([sx * X, .05, -ZF], [sx * X, .05, ZF], .018, metal, 8);
      for (const sz of [-1, 1]) add(G.cyl(.026, .026, .022, 12), DARK, sx * X, .026, sz * (ZF - .02), 0, 0, HP);
      tube([sx * X, .05, 0], [sx * X, RY + .04, 0], .016, metal, 8);
      add(G.sph(.022, 8, 6), metal, sx * X, RY + .04, 0);
    }
    tube([-X - .03, RY, 0], [X + .03, RY, 0], .015, metal, 8);
    for (const z of [-.18, -.09, 0, .09, .18]) tube([-X, SY, z], [X, SY, z], .007, metal, 5);
    for (const sx of [-1, 1]) tube([sx * X, SY, -.2], [sx * X, SY, .2], .01, metal, 6);
    // wooden hangers
    for (const k in GM) {
      const [x, w] = GM[k];
      add(G.tor(.024, .005, PI * 1.4, 3, 12), STEEL2, x, RY + .004, 0, 0, HP, -.3);
      tube([x, RY - .02, 0], [x, RY - .06, 0], .005, STEEL2, 4);
      add(G.cap(.012, 2 * w - .03, 2, 6), woodD, x, RY - .07, 0, HP, 0, 0);
    }
    // plain garments
    for (const k of ['jacket', 'hoodie', 'dress', 'coat']) { const [g, m] = bodyG(k); addM(g, m, { jacket: NAVY, hoodie: acc3, dress: acc, coat: CAMEL }[k]); }
    for (const k of ['jacket', 'hoodie', 'coat']) for (const [g, m] of sleeves(k)) addM(g, m, k === 'jacket' ? CREAM : k === 'hoodie' ? acc3 : CAMEL);
    const F = (k, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(Mg(GM[k][0])).toArray();   // garment space → piece space
    // letterman cuffs and hem stripes
    for (const s of [-1, 1]) { const [x, w, L] = GM.jacket; addM(G.cyl(.04, .04, .03, 12), Mg(x).multiply(xf(s * (w + .02), -.07 - L * .62, 0, 0, 0, s * .06, [1, 1, .6])), acc3); }
    addM(G.box(.39, .035, GT + .012, .006), Mg(GM.jacket[0]).multiply(xf(0, -GM.jacket[2] + .03, 0)), CREAM);
    // hoodie: hood, pocket, strings
    addM(G.sph(.085, 12, 8), Mg(GM.hoodie[0]).multiply(xf(0, -.02, -.02, 0, 0, 0, [1, .75, .4])), shade(acc3, -.06));
    addM(G.box(.2, .09, .008, .004), Mg(GM.hoodie[0]).multiply(xf(0, -.43, GT / 2 + .004 + .006)), shade(acc3, -.08));
    for (const s of [-1, 1]) tube(F('hoodie', s * .03, -.06, .024), F('hoodie', s * .035, -.17, .024), .004, WHITE, 4);
    // dress: a tomato ribbon belt; coat: buttons and pockets
    addM(G.box(.33, .03, GT + .016, .006), Mg(GM.dress[0]).multiply(xf(0, -.34, 0)), TOMATO);
    for (const y of [-.25, -.42, -.59]) addM(G.cyl(.012, .012, .008, 10), Mg(GM.coat[0]).multiply(xf(-.04, y, GT / 2 + .004 + .008, HP, 0, 0)), '#7a4a2a');
    for (const s of [-1, 1]) addM(G.box(.1, .025, .006, .002), Mg(GM.coat[0]).multiply(xf(s * .1, -.68, GT / 2 + .004 + .006)), shade(CAMEL, -.12));
    // the shelf: a basket with a knit scarf, a shoe box
    add(G.sph(.1, 10, 8), CORAL, -.27, SY + .007 + .17, 0, 0, .3, 0, [1.1, .45, 1]);
    add(G.box(.22, .13, .3, .008), KRAFT, .3, SY + .007 + .065, 0);
    add(G.box(.226, .034, .306, .006), TOMATO, .3, SY + .007 + .117, 0);
    add(G.pbox(.08, .04, .004), WHITE, .3, SY + .007 + .065, .15 + .006);
    // the tote on the end post
    add(G.box(.026, .28, .3, .01), CREAM, X + .045, 1.0, 0);
    add(G.box(.03, .012, .03, .004), STEEL2, X + .02, 1.33, 0);
    for (const z of [-.1, .1]) tube([X + .045, 1.14, z], [X + .03, 1.33, 0], .006, CREAM, 4);
  }));
  f.add(pm('hanger-plaid|' + TOMATO, mat('#ffffff', { map: plaidTex(TOMATO, CREAM) }), .16, ({ geo }) => { geo(...bodyG('flannel')); for (const s of sleeves('flannel')) geo(...s); }));
  f.add(pm('hanger-stripe|' + acc2, mat('#ffffff', { map: stripeTex(acc2, WHITE) }), .07, ({ geo }) => { geo(...bodyG('tee')); for (const s of sleeves('tee')) geo(...s); }));
  f.add(pm('hanger-basket|' + KRAFT, mat('#ffffff', { map: weaveTex(KRAFT) }), .12, ({ box }) => box(.26, .16, .26, -.27, SY + .007 + .08, 0, { r: .02 })));
  f.add(mg('hanger-prints', atlasMat(), ({ addM }) => {
    addM(quadGeo(.06, .06, RG.patch), Mg(GM.jacket[0]).multiply(xf(-.08, -.16, GT / 2 + .004 + .006)));
    addM(quadGeo(.1, .1, RG.tee), Mg(GM.tee[0]).multiply(xf(0, -.18, GT / 2 + .004 + .006)));
    addM(quadGeo(.2, .2, RG.tee), xf(X + .045 + .013 + .006, 1.0, 0, 0, HP, 0));
  }));
  f.spot('behind', null, .03, SY + .007, -.02, { maxH: .4, label: '행거 아래 칸', scale: .85 });
};

// 접이식 좌식 테이블 (1×1): a low folding floor table (honey top on mustard fold-out legs) with pot ramen eaten off the lid —
// noodles, an egg and spring onion in the golden pot, chopsticks, kimchi, a can of cider, a phone — and a sky floor
// cushion in front. Things sit on it or hide under it.
B.foldtable = (f, T) => {
  const wood = col(T, 'wood'), acc2 = col(T, 'accent2'), acc3 = col(T, 'accent3'), tk = [wood, acc2, acc3].join(',');
  const TW = .84, TD = .54, TY = .32, th = .032, z0 = -.08, POT = '#f2c14e';
  f.add(wd('foldtable-top', wood, ({ box }) => box(TW, th, TD, 0, TY - th / 2, z0, { r: .016 })));
  f.add(mc('foldtable|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) {
      const x = sx * .32;
      for (const sz of [-1, 1]) tube([x, .025, z0 + sz * .19], [x, TY - th, z0 + sz * .19], .014, acc3, 8);
      tube([x, .02, z0 - .21], [x, .02, z0 + .21], .016, acc3, 8);
      for (const sz of [-1, 1]) add(G.sph(.018, 8, 6), shade(acc3, -.15), x, .02, z0 + sz * .215);
      add(G.box(.05, .02, .1, .006), STEEL2, x, TY - th - .01, z0);
    }
    // the golden ramen pot (양은냄비)
    const px = -.19, pz = -.11;
    add(G.lathe([[0, 0], [.1, 0], [.112, .01], [.118, .085], [.126, .09], [.12, .095], [.108, .088], [.104, .02], [0, .02]], 24), POT, px, TY, pz);
    add(G.cyl(.106, .106, .006, 22), '#ff7a3c', px, TY + .062, pz);
    for (let k = 0; k < 7; k++) { const a = k * 2.2; add(G.tor(.022 + (k % 3) * .006, .006, PI * 1.5, 3, 10), '#ffe08a', px + Math.cos(a) * .05, TY + .066, pz + Math.sin(a) * .05, HP, 0, a); }
    add(G.sph(.034, 10, 8), WHITE, px + .035, TY + .066, pz + .03, 0, 0, 0, [1, .3, 1]);
    add(G.sph(.016, 8, 6), MUSTARD, px + .04, TY + .072, pz + .03, 0, 0, 0, [1, .5, 1]);
    for (const [dx, dz] of [[-.05, -.03], [-.02, .05], [.05, -.05], [-.06, .03]]) add(G.tor(.007, .003, PI * 2, 3, 8), LEAF, px + dx, TY + .067, pz + dz, HP, 0, 0);
    for (const s of [-1, 1]) add(G.tor(.024, .006, PI, 3, 8), shade(POT, -.12), px + s * .13, TY + .075, pz, 0, 0, s > 0 ? -HP : HP);
    // the lid, used as a plate
    const lx = .04, lz = -.22;
    add(G.lathe([[0, 0], [.04, 0], [.115, .02], [.11, .024], [.04, .008], [0, .008]], 22), POT, lx, TY, lz);
    for (let k = 0; k < 3; k++) add(G.tor(.024 + k * .005, .006, PI * 1.4, 3, 10), '#ffe08a', lx - .02 + k * .02, TY + .013, lz + .01 * k, HP, 0, k * 1.7);
    for (const dz of [-.01, .01]) tube([px - .02, TY + .1, pz - .1 + dz], [lx + .02, TY + .1, lz + .14 + dz], .0045, STEEL, 5);
    // kimchi, cider, a phone
    add(G.cyl(.065, .05, .022, 18), WHITE, -.02, TY + .011, .09);
    for (const [dx, dz, c] of [[-.02, -.01, TOMATO], [.015, .01, '#ff8a5c'], [0, .02, TOMATO], [.02, -.02, '#ff8a5c']]) add(G.sph(.026, 8, 6), c, -.02 + dx, TY + .026, .09 + dz, .3, dx * 30, 0, [1.2, .45, .8]);
    add(G.cyl(.032, .032, .11, 14), MINT, -.34, TY + .055, .1);
    add(G.cyl(.027, .03, .008, 14), STEEL, -.34, TY + .114, .1);
    add(G.box(.075, .01, .15, .008), CHAR, .3, TY + .005, .08, 0, .4, 0);
    // the floor cushion
    add(G.box(.42, .07, .42, .03, 2), acc2, 0, .035, .28);
    for (const [x, z] of [[-.1, .18], [.1, .18], [-.1, .38], [.1, .38], [0, .28]]) add(G.sph(.016, 8, 6), WHITE, x, .07, z, 0, 0, 0, [1, .5, 1]);
  }));
  f.add(mg('foldtable-prints', atlasMat(), ({ add, addM }) => {
    add(bandGeo(.0345, .0345, .05, LB(4), 2.4), -.34, TY + .06, .1);
    addM(quadGeo(.06, .12, RG.phone), xf(.3, TY + .01 + .006, .08, 0, .4, 0).multiply(xf(0, 0, 0, -HP, 0, 0)));
  }));
  f.spot('on', null, .29, TY, -.2, { maxH: .45, label: '좌식 테이블 위', scale: .8 });
  f.spot('under', null, 0, 0, -.1, { maxH: .24, label: '좌식 테이블 밑', scale: .85 });
};

// 컴퓨터 책상 (1×1): a white desk with a sky pegboard (headphones, a little shelf, sticky notes, a photo), a monitor playing a
// cosy camping game, a keyboard on a cloud desk mat, a mouse, a tomato office chair and a drawer unit underneath whose top
// drawer opens.
B.pcdesk = (f, T) => {
  const peg = col(T, 'peg'), acc = col(T, 'accent'), acc2 = col(T, 'accent2'), acc3 = col(T, 'accent3'), wood = col(T, 'wood');
  const tk = [peg, acc, acc2, acc3, wood].join(',');
  const W = .96, D = .5, z0 = -.24, TY = .72, th = .035, desk = '#fffdf8', leg = '#eceae6', unit = '#f1ece2';
  const UX = .25, UZ = -.24, UD = .44, UF = UZ + UD / 2, MX = -.12, cx = -.1, cz = .24;
  f.add(pm('pcdesk-peg|' + peg, mat('#ffffff', { map: pegTex(peg) }), .16, ({ box }) => box(W - .04, .6, .018, 0, TY + .32, -.46, { r: .006 })));
  f.add(mc('pcdesk|' + tk, ({ add, tube }) => {
    add(G.box(W, th, D, .012), desk, 0, TY - th / 2, z0);
    for (const sx of [-1, 1]) {
      const x = sx * (W / 2 - .04);
      for (const sz of [-1, 1]) add(G.box(.04, TY - th - .025, .04, .008), leg, x, (TY - th + .025) / 2, z0 + sz * .2);
      add(G.box(.05, .025, .46, .008), leg, x, .0125, z0);
      add(G.box(.04, .03, .44, .008), leg, x, TY - th - .015, z0);
    }
    for (const sx of [-1, 1]) add(G.box(.024, .64, .024, .008), leg, sx * .47, TY + .32, -.46);
    // drawer unit
    for (const sx of [-1, 1]) add(G.box(.02, .58, UD, .006), unit, UX + sx * .12, .33, UZ);
    for (const y of [.05, .61, .41]) add(G.pbox(.22, .02, UD - .01), unit, UX, y, UZ + .005);
    add(G.pbox(.216, .54, .01), shade(unit, -.06), UX, .33, UZ - UD / 2 + .005);
    add(G.box(.25, .32, .02, .008), acc2, UX, .22, UF + .012);
    add(G.box(.08, .016, .016, .005), WHITE, UX, .33, UF + .022 + .008);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.sph(.016, 8, 6), DARK, UX + sx * .1, .02, UZ + sz * .18);
    // monitor, webcam, a mochi figure
    add(G.box(.2, .014, .14, .006), CHAR, MX, TY + .007, -.33);
    add(G.box(.04, .17, .025, .008), CHAR, MX, TY + .095, -.36);
    add(G.box(.6, .36, .03, .012), CHAR, MX, 1.03, -.34);
    add(G.box(.06, .025, .03, .008), CHAR, MX, 1.2225, -.345);
    add(G.sph(.012, 8, 6), '#2f3346', MX, 1.2225, -.33 + .002, 0, 0, 0, [1, 1, .4]);
    add(G.sph(.042, 12, 8), WHITE, .12, 1.21 + .036, -.34, 0, 0, 0, [1, .85, 1]);
    for (const s of [-1, 1]) { add(G.sph(.006, 6, 4), INK, .12 + s * .015, 1.25, -.34 + .039, 0, 0, 0, [1, 1, .5]); add(G.sph(.008, 6, 4), BLUSH, .12 + s * .027, 1.242, -.34 + .033, 0, 0, 0, [1, .7, .4]); }
    // desk mat, keyboard, mouse
    add(G.pbox(.62, .006, .22), '#bfe4f7', -.11, TY + .003, -.1);
    add(G.box(.42, .02, .16, .008), '#f6f4f0', MX, TY + .022, -.1);
    add(G.sph(.03, 12, 8), WHITE, .13, TY + .012 + .011, -.07, 0, 0, 0, [.8, .42, 1.2]);
    add(G.cyl(.005, .005, .012, 8), DARK, .13, TY + .012 + .022, -.085, 0, 0, HP);
    // pegboard things: a little shelf with a cactus, headphones, pegs
    add(G.box(.24, .015, .1, .005), wood, .31, 1.0, -.4);
    for (const sx of [-1, 1]) add(G.box(.012, .06, .08, .004), STEEL2, .31 + sx * .1, .97, -.41);
    add(G.cyl(.03, .026, .05, 12), TOMATO, .25, 1.0 + .0075 + .025, -.4); add(G.cap(.02, .04, 2, 6), LEAF2, .25, 1.0 + .0075 + .08, -.4);
    add(G.sph(.008, 6, 4), BLUSH, .25, 1.0 + .0075 + .11, -.4);
    add(G.box(.05, .07, .05, .015), acc3, .35, 1.0 + .0075 + .035, -.4);
    for (const s of [-1, 1]) add(G.sph(.007, 6, 4), INK, .35 + s * .012, 1.05, -.4 + .027, 0, 0, 0, [1, 1, .5]);
    tube([.32, 1.3, -.451], [.32, 1.31, -.4], .005, STEEL2, 4);
    add(G.tor(.07, .012, PI, 5, 14), TOMATO, .32, 1.24, -.4);
    for (const s of [-1, 1]) add(G.cyl(.032, .032, .03, 14), TOMATO, .32 + s * .07, 1.235, -.4, HP, 0, 0);
    for (const s of [-1, 1]) add(G.cyl(.026, .026, .006, 14), DARK, .32 + s * .07, 1.235, -.4 + .015 + .003, HP, 0, 0);
    // the chair
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2 + .3; tube([cx, .07, cz], [cx + Math.cos(a) * .2, .045, cz + Math.sin(a) * .2], .014, CHAR, 6); add(G.sph(.022, 8, 6), DARK, cx + Math.cos(a) * .2, .022, cz + Math.sin(a) * .2); }
    tube([cx, .07, cz], [cx, .42, cz], .022, STEEL2, 8);
    add(G.box(.42, .07, .4, .03, 2), TOMATO, cx, .44, cz);
    tube([cx, .44, cz + .17], [cx, .62, cz + .2], .016, CHAR, 6);
    add(G.box(.4, .34, .06, .03, 2), TOMATO, cx, .76, cz + .2, .12, 0, 0);
  }));
  f.add(mg('pcdesk-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.6, .2, RG.deskmat), -.11, TY + .006 + .006, -.1, -HP, 0, 0);
    add(quadGeo(.4, .14, RG.keys), MX, TY + .032 + .006, -.1, -HP, 0, 0);
    add(quadGeo(.12, .09, RG.memo), .4, .86, -.451 + .006, 0, 0, -.05);
    add(quadGeo(.12, .075, RG.memo2), -.38, 1.29, -.451 + .006, 0, 0, .04);
    add(quadGeo(.08, .09, PHOTO(2)), -.23, 1.285, -.451 + .006, 0, 0, -.08);
  }));
  f.add(mg('pcdesk-screen', screenMat(), ({ add }) => add(quadGeo(.56, .315, RG.screen), MX, 1.03, -.325 + .006)));
  // the top drawer of the unit
  const dv = new THREE.Group(); put(dv, UX, .51, UF + .012); f.add(dv);
  dv.add(mc('pcdesk-drawer|' + tk, ({ add }) => {
    add(G.box(.25, .17, .02, .008), acc3, 0, 0, 0);
    add(G.box(.08, .016, .016, .005), WHITE, 0, .03, .018);
    const li = '#efe9de';
    add(G.pbox(.2, .01, .37), li, 0, -.065, -.2);
    for (const s of [-1, 1]) add(G.pbox(.01, .09, .37), li, s * .105, -.025, -.2);
    add(G.pbox(.21, .09, .01), li, 0, -.025, -.39);
    add(G.box(.05, .012, .1, .004), SKY, -.05, -.054, -.32);
    add(G.cyl(.012, .012, .1, 8), MUSTARD, .05, -.048, -.32, HP, 0, 0);
  }));
  const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .3 * t; }, { label: '책상 서랍', sfx: 'drawer', dur: .26 });
  f.spot('inside', dv, -.02, -.06, -.17, { part: p, maxH: .12, label: '책상 서랍', scale: .85 });
  f.spot('on', null, .33, TY, -.25, { maxH: .26, label: '컴퓨터 책상 위', scale: .8 });
  f.spot('under', null, -.28, 0, -.25, { maxH: .45, label: '컴퓨터 책상 밑', scale: .85 });
};

// 빈백 (1×1): a fat mustard corduroy beanbag with a tomato heart cushion on a round sky rug, a game controller beside it. The
// beanbag tips over sideways to show what slipped under it.
B.beanbag = (f, T) => {
  const bean = col(T, 'bean'), rug = col(T, 'rug'), rug2 = col(T, 'rug2'), tk = [bean, rug, rug2].join(',');
  const RR = .48, RT = .02, PX = -.4, CZ = -.05, seam = shade(bean, -.16);
  f.add(mg('beanbag-rug|' + rug + rug2, mat('#ffffff', { map: rugTex(rug, rug2) }), ({ add }) => add(new THREE.CylinderGeometry(RR, RR, RT, 40), 0, RT / 2, 0)));
  f.add(mc('beanbag|' + tk, ({ add }) => {   // a game controller on the rug
    const gx = .27, gz = .3, a = -.6, M = (x, z) => [gx + x * Math.cos(a) + z * Math.sin(a), gz - x * Math.sin(a) + z * Math.cos(a)];
    add(G.box(.13, .03, .065, .02), '#f6f3fb', gx, RT + .016, gz, 0, a, 0);
    for (const s of [-1, 1]) { const [x, z] = M(s * .055, .025); add(G.sph(.036, 10, 8), '#f6f3fb', x, RT + .016, z, 0, a - s * .35, 0, [1, .5, 1.3]); }
    for (const [x, z, c] of [[.04, -.012, TOMATO], [.055, .004, MUSTARD], [.04, .02, SKY], [.025, .004, MINT]]) { const [wx, wz] = M(x, z); add(G.cyl(.007, .007, .01, 8), c, wx, RT + .033, wz); }
    for (const s of [-1, 1]) { const [wx, wz] = M(s * .014 - .02, .012); add(G.cyl(.009, .01, .014, 10), DARK, wx, RT + .036, wz); }
  }));
  // the bag: a wide soft seat and a slouched backrest behind it (its own mesh: it tips over to the left)
  const pv = new THREE.Group(); put(pv, PX, RT, CZ); f.add(pv);
  const prof = [[0, 0], [.3, 0], [.39, .04], [.42, .12], [.4, .22], [.33, .3], [.2, .345], [.08, .36], [0, .36]];
  pv.add(pm('beanbag-bag|' + bean, mat('#ffffff', { map: cordTex(bean) }), .26, ({ geo }) => {
    geo(G.lathe(prof, 32), xf(-PX, 0, 0));
    geo(G.sph(.3, 24, 14), xf(-PX, .36, -.16, -.35, 0, 0, [1.2, .85, .62]));
  }));
  pv.add(mc('beanbag-trim|' + tk, ({ add }) => {
    add(G.tor(.416, .011, PI * 2, 4, 40), seam, -PX, .12, 0, HP, 0, 0);
    add(G.ext(heartShape(.11), .035, .018, 8), TOMATO, -PX + .08, .4, .04, -.95, .3, 0);
    add(G.box(.05, .03, .01, .004), WHITE, -PX + .24, .07, .345, 0, .6, 0);
  }));
  const p = f.part('lift', pv, (t, b) => { pv.rotation.z = .55 * t; pv.position.y = b.p.y + .02 * t; }, { label: '빈백', sfx: 'lift', dur: .34 });
  f.spot('inside', null, .1, RT, 0, { part: p, maxH: .2, label: '빈백 밑', scale: .85 });
};

// 전신 거울 (1×1): an arched full-length mirror in a honey frame leaning on the wall — photos tucked in the frame, a canvas tote
// hanging off its side, a fluffy round rug in front. Something can hide in the gap behind it.
B.mirror2 = (f, T) => {
  const wood = col(T, 'wood'), acc3 = col(T, 'accent3'), tk = [wood, acc3].join(',');
  const MW = .58, MH = 1.64, FT = .045, lean = .2, zb = -.12, IW = MW - .1, IH = MH - .1;
  const M = xf(0, .006, zb, -lean, 0, 0);   // the mirror's own frame: x across, y up its face, z out of it
  const Lp = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(M).toArray();
  const outer = archPath(new THREE.Shape(), MW, MH); outer.holes.push(archPath(new THREE.Path(), IW, IH, .05, true));
  f.add(pm('mirror2-frame|' + wood, woodMat(wood), .7, ({ geo }) => geo(G.ext(outer, FT, .006, 16), M, true)));
  f.add(mg('mirror2-glass', mat('#ffffff', { map: mirrorTex(), emissive: '#ffffff', ei: .12 }), ({ addM }) => addM(boxUV(new THREE.ShapeGeometry(archPath(new THREE.Shape(), IW, IH, .05), 16), -IW / 2, .05, IW, IH), M.clone().multiply(xf(0, 0, .026)))));
  f.add(mc('mirror2|' + tk, ({ addM, add, tube }) => {
    addM(G.ext(archPath(new THREE.Shape(), IW + .006, IH + .004, .048), .01, 0, 16), M.clone().multiply(xf(0, 0, .01)), '#ece8e0');
    // the tote: a canvas bag on a strap off the frame's right side
    addM(G.box(.24, .26, .03, .01), M.clone().multiply(xf(.36, .92, .085)), CREAM);
    for (const sx of [.27, .45]) tube(Lp(sx, 1.05, .085), Lp(.3, 1.27, .06), .007, CREAM, 5);
    addM(G.cyl(.016, .016, .02, 8), M.clone().multiply(xf(.3, 1.27, .055, HP, 0, 0)), shade(wood, -.2));
  }));
  f.add(mg('mirror2-prints', atlasMat(), ({ addM }) => {
    addM(quadGeo(.1, .1125, PHOTO(0)), M.clone().multiply(xf(.19, .44, .051 + .006, 0, 0, -.12)));
    addM(quadGeo(.1, .1125, PHOTO(2)), M.clone().multiply(xf(.15, .33, .051 + .012, 0, 0, .15)));
    addM(quadGeo(.18, .18, RG.tee), M.clone().multiply(xf(.36, .92, .1 + .006)));
  }));
  f.add(mg('mirror2-rug|' + acc3, mat('#ffffff', { map: furTex(CREAM, acc3) }), ({ add }) => add(new THREE.CylinderGeometry(.22, .22, .024, 32), 0, .012, .25)));
  f.add(mc('mirror2-rugedge', ({ add }) => { for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2; add(G.sph(.032, 8, 6), CREAM, Math.cos(a) * .215, .011, .25 + Math.sin(a) * .215, 0, -a, 0, [1, .36, 1]); } }));
  f.spot('behind', null, .05, 0, -.37, { maxH: .4, label: '거울 뒤', scale: .85 });
};

// 밥솥 (1×1): a cream rice cooker with a tomato lid and a little face on a three-tier wooden rack — the rice paddle in its
// holder, instant rice and a ramen five-pack in the middle, a 10 kg rice sack and a basket of onions at the bottom. The lid
// opens onto fresh rice.
B.ricecooker = (f, T) => {
  const wood = col(T, 'wood'), acc = col(T, 'accent'), tk = [wood, acc].join(',');
  const W = .58, D = .4, z0 = -.26, S = [.07, .37, .67], th = .025, post = '#f4f1ea';
  const TS = S.map(y => y + th / 2), cx = -.06, cz = z0 - .01, CY = TS[2], R = .165, BH = .2;
  f.add(wd('ricecooker-rack', wood, ({ box }) => { for (const y of S) box(W, th, D, 0, y, z0, { r: .006 }); }));
  f.add(mc('ricecooker|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { tube([sx * (W / 2 - .02), 0, z0 + sz * (D / 2 - .02)], [sx * (W / 2 - .02), .74, z0 + sz * (D / 2 - .02)], .013, post, 6); add(G.sph(.017, 8, 6), post, sx * (W / 2 - .02), .74, z0 + sz * (D / 2 - .02)); }
    tube([-(W / 2 - .02), .74, z0 - D / 2 + .02], [W / 2 - .02, .74, z0 - D / 2 + .02], .009, post, 5);
    for (const sx of [-1, 1]) tube([sx * (W / 2 - .02), .74, z0 - D / 2 + .02], [sx * (W / 2 - .02), .74, z0 + D / 2 - .02], .009, post, 5);
    // the rice cooker
    add(G.lathe([[0, 0], [.13, 0], [.15, .012], [.165, .05], [.165, .16], [.158, BH], [.13, BH], [.128, .13], [0, .13]], 28), CREAM, cx, CY, cz);
    add(G.sph(.125, 16, 8), WHITE, cx, CY + .13, cz, 0, 0, 0, [1, .4, 1]);
    for (const [dx, dz, a] of [[-.03, .02, .4], [.04, -.03, 1.2], [.0, -.06, 2.1], [.05, .05, .7]]) add(G.sph(.008, 5, 4), '#fffdf6', cx + dx, CY + .178, cz + dz, 0, a, 0, [1.6, .6, 1]);
    add(G.tor(.13, .007, PI * 2, 4, 28), STEEL, cx, CY + BH - .002, cz, HP, 0, 0);
    add(G.box(.12, .07, .02, .008), '#efe8da', cx, CY + .09, cz + .158);
    for (const [dx, c] of [[-.025, TOMATO], [.025, MINT]]) add(G.cyl(.01, .01, .008, 10), c, cx + dx, CY + .07, cz + .168 + .004, HP, 0, 0);
    face(add, cx, CY + .158, cz + .162, .42, { blush: null });
    add(G.cyl(.03, .025, .08, 12), WHITE, .2, CY + .04, -.18);
    add(G.cap(.026, .07, 2, 8), '#fbf8f0', .205, CY + .13, -.18, 0, 0, -.15, [1, 1, .3]);
    add(G.box(.025, .1, .012, .005), '#fbf8f0', .195, CY + .07, -.18, 0, 0, -.15);
    // middle: instant rice and a ramen pack; bottom: a rice sack and onions
    for (let k = 0; k < 3; k++) add(G.cyl(.06, .05, .045, 16), WHITE, -.17, TS[1] + .0225 + k * .045, z0 + .02);
    add(G.box(.26, .16, .1, .02), '#ff4b3a', .12, TS[1] + .08, -.4);
    add(G.box(.28, .24, .16, .025, 2), '#fbf6ea', -.1, TS[0] + .12, z0);
    add(G.box(.06, .02, .14, .006), '#c99a5c', -.1, TS[0] + .245, z0);
    for (const [dx, dz] of [[-.03, -.02], [.03, -.03], [0, .03], [.04, .03]]) add(G.sph(.034, 10, 8), '#b7795a', .17 + dx, TS[0] + .07, z0 + dz, 0, 0, 0, [1, .9, 1]);
    for (const [dx, dz] of [[-.03, -.02], [.03, -.03], [0, .03], [.04, .03]]) add(G.cone(.008, .025, 5), '#8a5a3c', .17 + dx, TS[0] + .11, z0 + dz);
  }));
  f.add(pm('ricecooker-basket', mat('#ffffff', { map: weaveTex(KRAFT) }), .12, ({ box }) => box(.18, .06, .16, .17, TS[0] + .03, z0, { r: .012 })));
  f.add(mg('ricecooker-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.09, .034, RG.rdisp), cx, CY + .1, cz + .168 + .006);
    for (let k = 0; k < 3; k++) add(bandGeo(.059, .059, .018, LB(1), 2.2), -.17, TS[1] + .028 + k * .045, z0 + .02);
    add(discGeo(.058, RG.hetban), -.17, TS[1] + .135 + .006, z0 + .02, -HP, 0, 0);
    add(quadGeo(.24, .12, RG.pack), .12, TS[1] + .08, -.4 + .05 + .006);
    add(quadGeo(.14, .168, RG.ricebag), -.1, TS[0] + .12, z0 + .08 + .006);
  }));
  // the lid (hinged at the back)
  const pv = new THREE.Group(); put(pv, cx, CY + BH, cz - R); f.add(pv);
  pv.add(mc('ricecooker-lid', ({ add }) => {
    add(G.cyl(R + .003, R + .005, .03, 28), TOMATO, 0, .015, R);
    add(G.dome(.15, 24, 6), CREAM, 0, .03, R, 0, 0, 0, [1, .28, 1]);
    add(G.box(.09, .025, .035, .01), shade(TOMATO, -.12), 0, .032, R + .14);
    add(G.cyl(.022, .025, .02, 12), DARK, 0, .065, R - .04);
    add(G.cyl(.125, .125, .006, 24), STEEL, 0, -.004, R);
  }));
  const p = f.part('lid', pv, t => { pv.rotation.x = -1.45 * t; }, { label: '밥솥 뚜껑', sfx: 'open', dur: .3 });
  f.spot('inside', null, cx, CY + .175, cz, { part: p, maxH: .22, label: '밥솥 안', scale: .8 });
  f.spot('on', null, .1, TS[1], -.17, { maxH: .25, label: '밥솥 선반 가운데', scale: .8 });
};

// 식물 선반 (1×1): a three-step ladder plant stand — a trailing pothos and a cactus at the bottom, a snake plant and a mint
// watering can in the middle, a round fern and a tiny bonsai at the top. Every step has room for one more thing.
B.plantshelf = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), pc = col(T, 'pot'), acc3 = col(T, 'accent3'), acc2 = col(T, 'accent2');
  const tk = [wood, woodD, pc, acc3, acc2].join(',');
  const W = .8, TI = [[.22, .2], [.52, 0], [.82, -.2]], X = .39, BZ = -.31, fz = y => .447 - .667 * y;
  f.add(wd('plantshelf-steps', wood, ({ box }) => { for (const [y, z] of TI) box(W, .025, .2, 0, y - .0125, z, { r: .006 }); }));
  f.add(mc('plantshelf|' + tk, ({ add, addM, tube }) => {
    for (const sx of [-1, 1]) {
      const x = sx * X;
      tube([x, 0, fz(0)], [x, .86, fz(.86)], .016, woodD, 6);
      tube([x, 0, BZ], [x, .86, BZ], .016, woodD, 6);
      for (const [y] of TI) tube([x, y - .03, fz(y - .03)], [x, y - .03, BZ], .011, woodD, 5);
      add(G.sph(.02, 8, 6), woodD, x, .86, fz(.86)); add(G.sph(.02, 8, 6), woodD, x, .86, BZ);
    }
    tube([-X, .86, BZ], [X, .86, BZ], .011, woodD, 5);
    tube([-X, .06, fz(.06)], [X, .06, fz(.06)], .011, woodD, 5);
    const soil = (x, y, z, r) => add(G.cyl(r, r, .01, 14), SOIL, x, y + .004, z);   // y = the pot's rim
    // step 1: a trailing pothos in a white pot, a cactus in a sky pot
    let [y, z] = TI[0];
    add(G.cyl(.075, .06, .12, 16), WHITE, -.26, y + .06, z); add(G.tor(.075, .008, PI * 2, 4, 16), acc2, -.26, y + .1, z, HP, 0, 0); soil(-.26, y + .12, z, .066);
    for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; add(G.sph(.04, 8, 5), i % 2 ? LEAF : LEAF3, -.26 + Math.cos(a) * .05, y + .15 + (i % 3) * .015, z + Math.sin(a) * .05, 0, -a, .6, [1.3, .5, .9]); }
    const vine = [[-.22, y + .125, z + .06], [-.21, y + .03, z + .112], [-.18, y - .05, z + .12], [-.2, y - .12, z + .118], [-.17, y - .175, z + .115]];
    for (let k = 0; k < 4; k++) tube(vine[k], vine[k + 1], .006, LEAF2, 5);
    vine.slice(1).forEach(([vx, vy, vz], k) => addM(G.ext(heartShape(.034), .008, .003, 4), xf(vx + (k % 2 ? .028 : -.028), vy, vz + .008, 0, k % 2 ? .4 : -.4, PI + (k % 2 ? -.5 : .5)), k % 2 ? LEAF : LEAF3));
    add(G.cyl(.05, .042, .08, 14), SKY, .27, y + .04, z); soil(.27, y + .08, z, .044);
    add(G.cap(.03, .08, 2, 8), LEAF2, .27, y + .14, z); add(G.cap(.017, .04, 2, 6), LEAF2, .305, y + .15, z, 0, 0, -.7);
    add(G.sph(.016, 8, 6), BLUSH, .27, y + .205, z);
    // step 2: a snake plant in terracotta, a mint watering can
    [y, z] = TI[1];
    add(G.cyl(.07, .055, .13, 16), pc, .25, y + .065, z); add(G.tor(.07, .01, PI * 2, 4, 16), shade(pc, -.1), .25, y + .125, z, HP, 0, 0); soil(.25, y + .13, z, .062);
    [[0, .38], [1.05, .3], [2.1, .4], [3.15, .32], [4.2, .27], [5.25, .35]].forEach(([a, h], i) => addM(G.ext(bladeShape(.066, h), .012, 0, 4), xf(.25, y + .12, z, 0, a, 0).multiply(xf(0, 0, .012, .2 + (i % 2) * .12, 0, 0)), i % 2 ? LEAF2 : '#5fae68'));
    add(G.cyl(.06, .065, .1, 14), MINT, -.25, y + .05, z);
    tube([-.3, y + .03, z], [-.37, y + .12, z], .012, MINT, 6);
    add(G.cyl(.018, .014, .015, 8), shade(MINT, -.15), -.375, y + .125, z, 0, 0, .6);
    add(G.tor(.045, .01, PI, 4, 10), MINT, -.25, y + .1, z, 0, 0, 0);
    // step 3: a round fern in mustard, a tiny bonsai with a mochi
    [y, z] = TI[2];
    add(G.cyl(.07, .055, .1, 16), acc3, -.22, y + .05, z); soil(-.22, y + .1, z, .062);
    for (const [dx, dy, dz, r] of [[0, .16, 0, .09], [-.07, .12, .03, .065], [.07, .12, -.02, .065], [.02, .1, .07, .06], [-.03, .11, -.07, .06]]) add(G.sph(r, 10, 8), dy > .14 ? LEAF3 : LEAF, -.22 + dx, y + dy, z + dz);
    add(G.box(.16, .035, .1, .01), CHAR, .24, y + .0175, z);
    tube([.24, y + .035, z], [.22, y + .09, z], .012, BROWN, 5); tube([.22, y + .09, z], [.27, y + .14, z], .009, BROWN, 5);
    for (const [dx, dy, r] of [[-.03, .1, .035], [.04, .15, .04], [.0, .17, .03]]) add(G.sph(r, 8, 6), LEAF2, .24 + dx, y + dy, z, 0, 0, 0, [1.3, .6, 1]);
    add(G.sph(.022, 10, 8), WHITE, .3, y + .057, z + .02, 0, 0, 0, [1, .85, 1]);
    for (const s of [-1, 1]) add(G.sph(.004, 5, 4), INK, .3 + s * .008, y + .06, z + .02 + .021, 0, 0, 0, [1, 1, .5]);
  }));
  f.spot('on', null, .02, TI[0][0], TI[0][1], { maxH: .26, label: '식물 선반 아래칸', scale: .8 });
  f.spot('on', null, -.02, TI[1][0], TI[1][1], { maxH: .26, label: '식물 선반 가운데칸', scale: .8 });
  f.spot('on', null, .03, TI[2][0], TI[2][1], { maxH: .4, label: '식물 선반 위칸', scale: .8 });
};

// ═════════════════════════════════════════════ WALL PIECES ═════════════════════════════════════════════
// 암막 커튼 창 (wall, span 2): a sliding window onto the neighbourhood (a red-brick villa with a green water tank, the corner
// store, wires and a sparrow), a wooden sill with a cactus and an alarm clock, and denim-blue blackout curtains printed with
// little stars — the left one tied back, the right one drawn shut (it opens onto the sill behind it).
B.curtainwin = (f, T) => {
  const frame = '#fbf8f2', wood = col(T, 'wood'), woodD = col(T, 'woodD'), bo = col(T, 'blackout'), tie = col(T, 'accent3'), acc = col(T, 'accent');
  const tk = [wood, woodD, bo, tie, acc].join(',');
  const SY = .92, TY = 2.02, WX = .72, ROD = 2.24, CZ = .3, cm = mat('#ffffff', { map: curtainTex(bo) });
  f.add(mg('curtainwin-view', mat('#ffffff', { map: viewTex(), emissive: '#ffffff', ei: .14 }), ({ add }) => add(new THREE.PlaneGeometry(2 * WX, TY - SY), 0, (SY + TY) / 2, .014)));
  f.add(wd('curtainwin-sill', wood, ({ box }) => box(1.62, .045, .24, 0, SY - .0225, .12)));
  const sash = (x0, x1) => { const s = rrShape(x0, SY + .03, x1 - x0, TY - SY - .05, .015); s.holes.push(rrShape(x0 + .045, SY + .075, x1 - x0 - .09, TY - SY - .14, .01)); return G.ext(s, .03, 0, 3); };
  f.add(mc('curtainwin|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) add(G.box(.06, TY - SY + .1, .1, .012), frame, sx * (WX + .03), (SY + TY) / 2 + .03, .05);
    add(G.box(2 * WX + .12, .06, .1, .012), frame, 0, TY + .05, .05);
    add(G.box(2 * WX, .03, .1, .01), frame, 0, SY + .015, .05);
    add(sash(-WX, .04), frame, 0, 0, .062);
    add(sash(-.04, WX), frame, 0, 0, .022);
    add(G.box(.02, .1, .02, .006), STEEL2, .015, 1.45, .102);
    // rod, brackets, the tied-back left curtain's band
    tube([-.97, ROD, CZ], [.97, ROD, CZ], .016, woodD, 8);
    for (const sx of [-1, 1]) { add(G.sph(.03, 10, 8), woodD, sx * .97, ROD, CZ); add(G.box(.03, .03, CZ, .008), woodD, sx * .9, ROD, CZ / 2); }
    add(G.box(.24, .05, .09, .02), tie, -.83, 1.31, CZ);
    add(G.sph(.022, 8, 6), shade(tie, -.15), -.73, 1.31, CZ + .04);
    // on the sill: an alarm clock and a cactus
    const ax = -.55, az = .13;
    add(G.cyl(.06, .06, .045, 18), acc, ax, SY + .075, az, HP, 0, 0);
    add(G.cyl(.048, .048, .004, 18), WHITE, ax, SY + .075, az + .0225 + .004, HP, 0, 0);
    add(G.box(.004, .03, .003, .001), INK, ax, SY + .085, az + .03 + .002); add(G.box(.022, .004, .003, .001), INK, ax + .008, SY + .075, az + .03 + .002);
    for (const s of [-1, 1]) { add(G.dome(.024, 10, 4), GOLD, ax + s * .04, SY + .125, az, 0, 0, s * .5); add(G.cyl(.006, .006, .03, 6), DARK, ax + s * .035, SY + .016, az, 0, 0, s * .4); }
    add(G.cyl(.045, .038, .08, 14), TOMATO, -.3, SY + .04, .12); add(G.cyl(.04, .04, .01, 12), SOIL, -.3, SY + .078, .12);
    add(G.cap(.03, .09, 2, 8), LEAF2, -.3, SY + .15, .12); add(G.cap(.016, .04, 2, 6), LEAF2, -.27, SY + .16, .12, 0, 0, -.8);
    add(G.sph(.014, 8, 6), BLUSH, -.3, SY + .215, .12);
  }));
  f.add(pm('curtainwin-left|' + bo, cm, .5, ({ geo }) => {
    geo(trapGeo(.32, .15, .86, .03, .06), xf(-.83, ROD - .03, CZ - .015));
    geo(trapGeo(.15, .34, .5, -.015, .06), xf(-.83, 1.3, CZ + .015));
    geo(G.sph(.09, 12, 8), xf(-.83, 1.32, CZ + .01, 0, 0, 0, [1.05, .8, .5]));
  }));
  // the right curtain: draws back toward the right end of the rod
  const RW = .92, RH = ROD - .02 - .8;
  const cr = new THREE.Group(); put(cr, .99, ROD - .02, CZ);
  cr.add(pm('curtainwin-curtain|' + bo, cm, .5, ({ box }) => box(RW, RH, .05, -RW / 2, -RH / 2, 0, { r: .02 })));
  cr.add(mc('curtainwin-rings', ({ add }) => { for (let k = 0; k < 7; k++) add(G.tor(.024, .006, PI * 2, 3, 10), STEEL2, -.05 - k * .14, .02, 0, 0, HP, 0); }));
  f.add(cr);
  const p = f.part('curtain', cr, (t, b) => { cr.scale.x = 1 - .68 * t; }, { label: '암막 커튼', sfx: 'swish', dur: .3 });
  f.spot('on', null, -.07, SY, .13, { maxH: .45, label: '창틀 위', scale: .8 });
  f.spot('inside', null, .42, SY, .12, { part: p, maxH: .45, label: '커튼 뒤 창틀', scale: .85 });
};

// 포스터 (wall, span 1): a retro "MOCHI world tour" poster held up with masking tape, two polaroids taped beside it. Its
// bottom-right corner peels up to show what was slipped behind.
B.posterwall = (f, T) => {
  const acc = col(T, 'accent'), acc3 = col(T, 'accent3'), tk = [acc, acc3].join(',');
  const PW = .7, PH = .97, x0 = -.44, x1 = x0 + PW, y0 = .96, y1 = y0 + PH, A = .28, PZ = .006, rc = RG.poster;
  const uvOf = (x, y) => [rc[0] + (x - x0) / PW * (rc[2] - rc[0]), rc[1] + (y - y0) / PH * (rc[3] - rc[1])];
  f.add(mg('posterwall-poster', atlasMat(), ({ add }) => {   // the poster minus its peeling corner
    const sh = new THREE.Shape(); sh.moveTo(x0, y0); sh.lineTo(x1 - A, y0); sh.lineTo(x1, y0 + A); sh.lineTo(x1, y1); sh.lineTo(x0, y1); sh.lineTo(x0, y0);
    const g = new THREE.ShapeGeometry(sh), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, ...uvOf(p.getX(i), p.getY(i)));
    add(g, 0, 0, PZ);
    add(quadGeo(.13, .146, PHOTO(2)), .37, 1.64, PZ, 0, 0, .08);
    add(quadGeo(.13, .146, PHOTO(3)), .38, 1.27, PZ, 0, 0, -.06);
  }));
  f.add(mc('posterwall|' + tk, ({ add }) => {
    for (const [x, y, a, c] of [[x0, y1, -PI / 4, TAPE], [x1, y1, PI / 4, acc], [x0, y0, PI / 4, acc3], [.37 - .005, 1.64 + .07, .05, TAPE], [.38 + .004, 1.27 + .07, -.1, acc]])
      add(G.pbox(.1, .032, .004), c, x, y, PZ + .008, 0, 0, a);
  }));
  // the corner flap: hinged along the diagonal (a static group turns the hinge axis onto local x)
  const mx = x1 - A / 2, my = y0 + A / 2;
  const hinge = new THREE.Group(); put(hinge, mx, my, PZ, 0, 0, PI / 4); f.add(hinge);
  const pv = new THREE.Group(); hinge.add(pv);
  const inv = new THREE.Matrix4().makeRotationZ(-PI / 4).multiply(new THREE.Matrix4().makeTranslation(-mx, -my, 0));
  const a = [x1 - A, y0, 0], b = [x1, y0, 0], c = [x1, y0 + A, 0], cy = -A / Math.SQRT2;
  pv.add(mg('posterwall-flap', atlasMat(), ({ addM }) => addM(triGeo(a, b, c, [uvOf(a[0], a[1]), uvOf(b[0], b[1]), uvOf(c[0], c[1])]), inv)));
  pv.add(mc('posterwall-flapback', ({ add, addM }) => {
    addM(triGeo(a, c, b), inv, '#f4efe6');
    add(G.pbox(.032, .1, .004), TAPE, 0, cy + .035, .008);
  }));
  const p = f.part('flip', pv, t => { pv.rotation.x = -2.5 * t; }, { label: '포스터 모서리', sfx: 'lift', dur: .3 });
  f.spot('inside', null, x1 - .085, y0 + .085, .012, { part: p, maxH: .09, label: '포스터 뒤', wallFace: true });
};

// 벽걸이 에어컨 (wall, span 1): a slim white wall air conditioner (a sky stripe, a little 24° display) with its pipe cover and a
// remote in a wall pocket below. The front panel lifts onto the filters — a sneaky ledge for small things.
B.aircon2 = (f, T) => {
  const acc2 = col(T, 'accent2'), tk = [acc2].join(',');
  const W = .9, D = .24, Y0 = 1.96, Y1 = 2.24, body = '#f6f8fc';
  f.add(mc('aircon2|' + tk, ({ add }) => {
    add(G.pbox(W - .07, Y1 - Y0 - .085, .02), '#e9edf3', 0, Y0 + .05 + (Y1 - Y0 - .085) / 2, .01);
    add(G.box(W, .035, D, .014), body, 0, Y1 - .0175, D / 2);
    add(G.box(W - .07, .05, D, .02), '#e4eaf2', 0, Y0 + .025, D / 2);
    for (let k = 0; k < 10; k++) add(G.pbox(.05, .006, .13), '#c9d0dc', -.36 + k * .08, Y1 + .003, D / 2);
    for (const sx of [-1, 1]) add(G.box(.035, Y1 - Y0, D, .014), body, sx * (W / 2 - .0175), (Y0 + Y1) / 2, D / 2);
    add(G.box(W - .07, .012, .08, .004), '#e3e8ef', 0, Y0 - .014, .17, .35, 0, 0);
    for (const sx of [-1, 1]) add(G.box(.02, .02, .06, .006), '#e3e8ef', sx * (W / 2 - .05), Y0 - .006, .17);
    // the pipe cover down the wall
    add(G.box(.07, .45, .05, .015), body, -.4, Y0 - .225, .025);
    add(G.box(.12, .07, .05, .015), body, -.43, Y0 - .45, .025);
    // the remote in its wall pocket
    add(G.box(.06, .15, .022, .01), WHITE, .3, 1.35, .024);
    add(G.pbox(.04, .025, .004), acc2, .3, 1.395, .035 + .006);
    for (let k = 0; k < 3; k++) add(G.sph(.007, 6, 4), k ? '#dfe2ea' : TOMATO, .29 + k * .01, 1.372, .035 + .003, 0, 0, 0, [1, 1, .5]);
    add(G.box(.1, .13, .045, .012), '#eef1f6', .3, 1.29, .0225);
  }));
  f.add(pm('aircon2-filter', mat('#ffffff', { map: meshTex() }), .05, ({ box }) => box(W - .1, .19, .01, 0, 2.125, .1, { r: 0 })));
  const pv = new THREE.Group(); put(pv, 0, Y1 - .006, D + .004); f.add(pv);
  pv.add(mc('aircon2-panel|' + tk, ({ add }) => {
    add(G.box(W - .01, .238, .02, .01), body, 0, -.119, .01);
    add(G.pbox(W - .12, .008, .004), acc2, 0, -.205, .026);
    add(G.sph(.008, 6, 4), MINT, .38, -.205, .023, 0, 0, 0, [1, 1, .5]);
    add(G.cyl(.016, .016, .004, 14), acc2, -.36, -.06, .024, HP, 0, 0);
    add(G.sph(.007, 6, 4), WHITE, -.36, -.06, .028, 0, 0, 0, [1, 1, .4]);
  }));
  pv.add(mg('aircon2-display', atlasMat(), ({ add }) => add(quadGeo(.09, .034, RG.ac), .3, -.15, .026)));
  const p = f.part('lift', pv, t => { pv.rotation.x = -2.3 * t; }, { label: '에어컨 앞판', sfx: 'open', dur: .32 });
  f.spot('inside', null, -.16, Y0 + .05, .175, { part: p, maxH: .1, label: '에어컨 필터 앞', scale: .85 });
};

export const ONEROOM_BUILDERS = B;

export const ONEROOM_INFO = {
  loftbed: { w: 2, d: 1, name: '로프트 침대', price: 480, region: 'home' },
  minikitchen: { w: 2, d: 1, name: '원룸 주방', price: 560, region: 'home' },
  minifridge: { w: 1, d: 1, name: '미니 냉장고', price: 320, region: 'home' },
  shoerack: { w: 1, d: 1, name: '신발장', price: 220, region: 'home' },
  washer2: { w: 1, d: 1, name: '드럼 세탁기', price: 400, region: 'home' },
  hanger: { w: 1, d: 1, name: '옷걸이 행거', price: 180, region: 'home' },
  foldtable: { w: 1, d: 1, name: '접이식 좌식 테이블', price: 150, region: 'home' },
  pcdesk: { w: 1, d: 1, name: '컴퓨터 책상', price: 380, region: 'home' },
  beanbag: { w: 1, d: 1, name: '빈백', price: 200, region: 'home' },
  mirror2: { w: 1, d: 1, name: '전신 거울', price: 160, region: 'home' },
  ricecooker: { w: 1, d: 1, name: '밥솥', price: 240, region: 'home' },
  plantshelf: { w: 1, d: 1, name: '식물 선반', price: 200, region: 'home' },
  curtainwin: { wall: true, span: 2, name: '암막 커튼 창', price: 340, region: 'home' },
  posterwall: { wall: true, span: 1, name: '포스터', price: 120, region: 'home' },
  aircon2: { wall: true, span: 1, name: '벽걸이 에어컨', price: 300, region: 'home' },
};

// Suggested room theme (stages.js THEMES shape; every key APT_THEMES.apt sets, plus the ones these props read:
// duvet, bean, fridge, blackout, peg). A pale greige laminate floor so the honey wood furniture stands out from it.
const BASE_T = { trim: '#ffffff', sheet: '#ffffff', pillow: '#fff3d6', rug2: '#ffffff', knob: '#ffd84a', top: '#fffaf0' };
export const ONEROOM_THEMES = {
  oneroom: { ...BASE_T, name: '나의 원룸', friend: null, bg: ['#fff4e6', '#f3e6d4'], base: '#d6c3a6', floorKind: 'planks', floor: '#e9dfcd', floor2: '#cdbda3',
    wallKind: 'stripe', wall: '#fffaf1', wall2: '#fbf0de', wainscot: '#f1e7d6', wallEdge: '#fffdf8',
    wood: '#e3a464', woodD: '#a8693d', body: '#fffaf2', accent: '#9fd3a6', accent2: '#8fd3f4', accent3: '#ffc23d', door: '#bfe6d2', fabric: '#fff0d8', fabric2: '#ffe3bf',
    curtain: '#fff3d6', rug: '#bfe4f7', rug2: '#ffffff', pot: '#f3a272', sofa: '#fff0d8', quilt: '#ff6b57', kimchi: '#9b3b4b', cloth: '#8fcf9a', throw: '#7fa8e8',
    duvet: '#7fb6e8', bean: '#ffb43a', fridge: '#ff7a64', blackout: '#6a86c9', peg: '#9fd0f0' },
};

// ═════════════════════════════════════════════ ITEMS ═════════════════════════════════════════════
// Same shape as items.js ITEMS: { name, h, flat?, build() } → Group, origin bottom centre.
//   Object.assign(ITEMS, ONEROOM_ITEMS)   (and push the keys into TARGET_POOL to make them stage targets)
export const ONEROOM_ITEMS = {
  // 무선 이어폰: a white pebble case (a seam, a mint light, a sky cat sticker) with one earbud out beside it
  earphones: { name: '무선 이어폰', h: .07, flat: true, build() {
    const g = grp();
    g.add(mc('it-or-earphones', ({ add }) => {
      add(G.box(.13, .032, .095, .03), '#f2f4f8', 0, .016, 0);
      add(G.box(.13, .026, .095, .03), WHITE, 0, .045, 0);
      add(G.sph(.006, 6, 4), MINT, 0, .028, .0475 + .002, 0, 0, 0, [1, 1, .5]);
      add(G.cyl(.024, .024, .004, 16), SKY, -.025, .062, .005);
      for (const s of [-1, 1]) { add(G.cone(.009, .014, 5), SKY, -.025 + s * .014, .062, -.016, -HP, 0, 0, [1, 1, .3]); add(G.sph(.0035, 5, 4), INK, -.025 + s * .008, .065, .008); }
      add(G.sph(.021, 12, 8), WHITE, .1, .021, .01);
      add(G.cap(.008, .045, 2, 6).rotateX(HP), WHITE, .1, .01, .05);
      add(G.cyl(.01, .01, .004, 10), '#5b5672', .1, .021, -.012, HP, 0, 0);
    }));
    return g;
  } },
  // 컵라면: a cup noodle with a red label, a printed foil lid and wooden chopsticks on top
  ramen: { name: '컵라면', h: .15, build() {
    const g = grp();
    g.add(mc('it-or-ramen', ({ add }) => {
      add(G.cyl(.068, .052, .12, 22), WHITE, 0, .06, 0);
      add(G.tor(.067, .006, PI * 2, 4, 22), WHITE, 0, .12, 0, HP, 0, 0);
      for (const dz of [-.012, .012]) add(G.box(.2, .008, .012, .003), '#f3dcb0', .0, .136, dz, 0, .2, 0);
    }));
    g.add(mg('it-or-ramen-print', atlasMat(), ({ add }) => {
      for (const ry of [0, PI]) add(bandGeo(.0675, .0595, .06, LB(0), 2.6, 14), 0, .07, 0, 0, ry, 0);
      add(discGeo(.062, RG.cuplid), 0, .128, 0, -HP, 0, 0);
    }));
    return g;
  } },
  // 열쇠고리 인형: a little honey bear plush on a gold ring with a key
  keyring: { name: '열쇠고리 인형', h: .15, build() {
    const g = grp(), b = '#e9a86a';
    g.add(mc('it-or-keyring', ({ add }) => {
      add(G.sph(.042, 12, 8), b, 0, .042, 0, 0, 0, 0, [1, .95, .9]);
      add(G.sph(.04, 12, 8), b, 0, .1, 0);
      for (const s of [-1, 1]) {
        add(G.sph(.015, 8, 6), b, s * .03, .135, -.004);
        add(G.sph(.006, 6, 4), INK, s * .015, .106, .037, 0, 0, 0, [1, 1, .5]);
        add(G.sph(.008, 6, 4), BLUSH, s * .026, .094, .03, 0, 0, 0, [1, .7, .4]);
        add(G.sph(.014, 8, 6), b, s * .04, .05, .02);
        add(G.sph(.015, 8, 6), b, s * .022, .012, .025, 0, 0, 0, [1, .8, 1.2]);
      }
      add(G.sph(.014, 8, 6), '#fbe3c8', 0, .093, .034, 0, 0, 0, [1.2, .9, .6]);
      add(G.sph(.005, 5, 4), INK, 0, .097, .043);
      add(G.sph(.016, 8, 6), '#fbe3c8', 0, .04, .034, 0, 0, 0, [1, 1, .45]);
      add(G.tor(.006, .0025, PI * 2, 3, 8), GOLD, .036, .128, 0);
      add(G.tor(.022, .004, PI * 2, 3, 16), GOLD, .062, .108, 0);
      add(G.tor(.012, .004, PI * 2, 3, 12), GOLD, .07, .072, 0);
      add(G.box(.012, .055, .004, .002), GOLD, .07, .033, 0);
      for (const y of [.015, .028]) add(G.box(.012, .006, .004, .001), GOLD, .08, y, 0);
    }));
    return g;
  } },
  // 칫솔: a sky toothbrush with a tomato grip and a swirl of mint toothpaste
  toothbrush: { name: '칫솔', h: .05, flat: true, build() {
    const g = grp();
    g.add(mc('it-or-toothbrush', ({ add }) => {
      add(G.box(.17, .016, .026, .008), SKY, -.03, .008, 0);
      add(G.box(.062, .018, .028, .008), TOMATO, -.07, .009, 0);
      add(G.box(.05, .012, .016, .005), SKY, .075, .006, 0);
      add(G.box(.045, .012, .022, .005), SKY, .115, .006, 0);
      add(G.pbox(.028, .022, .02), WHITE, .121, .023, 0);
      add(G.pbox(.012, .022, .02), SKY2, .101, .023, 0);
      add(G.cap(.008, .03, 2, 6).rotateZ(HP), MINT, .115, .042, 0);
      add(G.sph(.006, 6, 4), WHITE, .128, .049, 0);
    }));
    return g;
  } },
  // 동전 지갑: a tomato gingham kiss-lock coin purse with a gold clasp
  coin: { name: '동전 지갑', h: .066, flat: true, build() {
    const g = grp();
    g.add(pm('it-or-coin', mat('#ffffff', { map: ginghamTex(TOMATO) }), .05, ({ geo }) => geo(G.ext(rrShape(-.075, -.05, .15, .1, .045), .028, .008, 6), xf(0, .008, 0, -HP, 0, 0))));
    g.add(mc('it-or-coin-clasp', ({ add }) => {
      add(G.cap(.0055, .12, 2, 6).rotateZ(HP), GOLD, 0, .042, -.05);
      for (const s of [-1, 1]) add(G.sph(.011, 8, 6), GOLD, s * .012, .054, -.05);
      add(G.sph(.008, 6, 4), WHITE, .045, .044, .02, 0, 0, 0, [1, .4, 1]);
    }));
    return g;
  } },
};

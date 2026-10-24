// Shop-interior props (가게 안): three everyday shops where Korean, Japanese and American places meet — inside a 24h
// konbini (a double-sided snack gondola, a glass-door drinks cooler, the till with a 호빵 steamer, an ice-cream chest, a
// magazine rack, a cup-noodle corner with a hot-water pot), a coin laundry (a stacked washer / dryer, a folding table, a
// coin changer) and a neighbourhood café (an espresso bar, a pastry case, a bistro table set, a chalk menu, a shop clock).
// Same contract as apt-props.js:
//   builder(f, T, opts) fills a Furn. Origin = footprint centre on the floor, the piece faces +z, back toward -z, 1 tile = 1.
//   Wall pieces (wall: true, span 1|2) hang on a wall's inner face: origin at the face, floor height, +z into the room.
//   parts open / lift / slide / flip; spots: inside (needs its part open) | under/behind (visible but tucked) | on (plain sight).
//   Lockable parts carry p.lockable = true and p.lockKind ('pad' | 'code'), with f.lockAt where the lock hardware goes.
// Toy-set rules: chunky silhouettes, flat matte colours. Static decor is merged into ONE vertex-coloured mesh per piece (mc);
// printed surfaces (packaging, labels, posters, menus) share one label atlas (mg); wood grain, marble, tile, pegboard and the
// perforated drum are small repeating canvas prints mapped in world units; glass is the only see-through material; every
// moving part is its own mesh. Decals / prints sit >= .006 in front of the face they are on (no coplanar faces of two colours).
//   import { SHOP_BUILDERS, SHOP_INFO, SHOP_THEMES, SHOP_ITEMS } from './gfx/shop-props.js';
//   registerFurniture(SHOP_BUILDERS, SHOP_INFO); Object.assign(ITEMS, SHOP_ITEMS);
//   for (const k in SHOP_THEMES) THEMES[k] = { ...THEMES.my, ...SHOP_THEMES[k] };
// Bright shop palette: white + mint konbini with its orange / red / blue stripes, sky-and-white laundry with a mustard coin
// changer, warm wood + green café (never all-pink).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { grp, mat, mesh, geo, canvasTex, texCache, roundRect, shade, starShape, STYLE } from './kit.js';
import { tr } from '../i18n.js';

const PI = Math.PI, HP = PI / 2, DS = THREE.DoubleSide;

// ── palette ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Theme keys first (pieces follow the room they are bought into). Extra keys only the shop themes set:
// cooler (drinks cooler body), vend (coin changer body), machine (espresso machine), stool (vinyl seats), washer, chalk.
const K = { wood: '#e8b47c', woodD: '#b97f4c', body: '#ffffff', accent: '#4fc7a8', accent2: '#4f9fe8', accent3: '#ffc23d', fabric: '#fff0d8',
  fabric2: '#ffe3bf', knob: '#ffd84a', top: '#fffaf0', door: '#bfe6d2', curtain: '#fff3d6', pot: '#f3a272',
  cooler: '#3f86d8', vend: '#ffc23d', machine: '#4fae86', stool: '#ff5a4a', washer: '#ffffff', chalk: '#35584a' };
const col = (T, k) => (T && T[k]) || K[k];
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', SKY = '#8fd3f4', SKY2 = '#cdeefc', HONEY = '#ffcf5c', MUSTARD = '#ffc23d',
  TOMATO = '#ff6b57', CORAL = '#ff9f8a', MINT = '#7fd6c0', BLUSH = '#ff9fb5', GOLD = '#ffc93c', LEAF = '#6cc46a', LEAF2 = '#4ea85a',
  LEAF3 = '#8fd47a', ORANGE = '#ffab4c', STEEL = '#c9cfe0', STEEL2 = '#a9b2c8', DARK = '#5b5672', CHAR = '#3b3550', KRAFT = '#e8bb82',
  TAPE = '#f6e2b0', LILAC = '#b9a6ff', RED = '#ff5a4a', BLUE = '#3f86d8', ICE = '#e3f4fb', COFFEE = '#6b3f2a', CRUST = '#e8a456',
  SILVER = '#dfe4ee';

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
const I4 = new THREE.Matrix4();
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
  const g = geo('smc|' + STYLE.mode + '|' + key, () => {
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
// One mesh from many pieces sharing one material (labels, prints, wood, glass). fn gets { add, addM }; keeps uvs.
function mg(key, m, fn, post = null) {
  const g = geo('smg|' + key, () => {
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
// Box-mapped uvs in world units (a print is the same size on every face of a merged piece).
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
const uvScale = (g, su, sv) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return g; };
function rrShape(x, y, w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
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
// A little potted plant (pot base at y): leaves are squashed spheres around a point.
function potPlant(add, x, y, z, pc, s = 1) {
  add(G.cyl(.055 * s, .045 * s, .09 * s, 12), pc, x, y + .045 * s, z);
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; add(G.sph(.042 * s, 8, 5), i % 2 ? LEAF : LEAF3, x + Math.cos(a) * .035 * s, y + (.12 + (i % 2) * .02) * s, z + Math.sin(a) * .035 * s, 0, -a, .5, [1.3 * s, .5 * s, .7 * s]); }
}

// ── canvas textures (drawn at 2x; Hangul in Jua, redrawn once the web font arrives) ──────────────────────────────
const FONT = px => `${px}px Ssurround, Jua, "Malgun Gothic", "Apple SD Gothic Neo", "Yu Gothic", sans-serif`;
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
const ell = (c, x, y, rx, ry, a = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, PI * 2); c.fill(); };
const line = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
const rr = (c, x, y, w, h, r) => { roundRect(c, x, y, w, h, r); c.fill(); };
function heartPath(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * .7); c.bezierCurveTo(x - s * 1.2, y - s * .1, x - s * .55, y - s * .95, x, y - s * .35); c.bezierCurveTo(x + s * .55, y - s * .95, x + s * 1.2, y - s * .1, x, y + s * .7); }
function starPath(c, x, y, R, r = R * .45) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -HP + i * PI / 5, q = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); }
function clip(c, x, y, w, h, fn) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); fn(); c.restore(); }
function daisy(c, x, y, r, petal = '#ffffff', mid = '#ffc23d') { c.fillStyle = petal; for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; blob(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * .78); } c.fillStyle = mid; blob(c, x, y, r * .6); }
// the game's mochi hero, for posters and packaging
function mochi(c, x, y, r, body = '#ffffff') {
  c.fillStyle = body; c.beginPath(); c.ellipse(x, y, r, r * .84, 0, 0, PI * 2); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1.1, r * .08); c.stroke();
  c.fillStyle = '#2a1d33'; blob(c, x - r * .34, y - r * .06, r * .1); blob(c, x + r * .34, y - r * .06, r * .1);
  c.fillStyle = '#ff9fb5'; blob(c, x - r * .58, y + r * .2, r * .14); blob(c, x + r * .58, y + r * .2, r * .14);
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1, r * .07); c.beginPath(); c.arc(x, y + r * .06, r * .14, .25, PI - .25); c.stroke();
}
// the shop's bear mascot (round face, ears, snout)
function bear(c, x, y, r, fur = '#d9944f') {
  c.fillStyle = fur; blob(c, x - r * .72, y - r * .66, r * .36); blob(c, x + r * .72, y - r * .66, r * .36); blob(c, x, y, r);
  c.fillStyle = '#ffe3c2'; ell(c, x, y + r * .28, r * .42, r * .32);
  c.fillStyle = '#2a1d33'; blob(c, x - r * .38, y - r * .12, r * .1); blob(c, x + r * .38, y - r * .12, r * .1); ell(c, x, y + r * .16, r * .12, r * .08);
  c.fillStyle = '#ff9fb5'; blob(c, x - r * .62, y + r * .22, r * .13); blob(c, x + r * .62, y + r * .22, r * .13);
}
function coinDraw(c, x, y, r, face = '#ffd23f', s = '500') {
  c.fillStyle = shade(face, -.2); blob(c, x, y + r * .12, r); c.fillStyle = face; blob(c, x, y, r);
  c.strokeStyle = shade(face, -.15); c.lineWidth = r * .12; c.beginPath(); c.arc(x, y, r * .78, 0, PI * 2); c.stroke();
  txt(c, s, x, y + .5, r * .78, shade(face, -.4));
}
function cupDraw(c, x, y, s, body = '#ffffff', band = '#e8462f') {   // a cup noodle, base centre (x, y)
  c.fillStyle = body; c.beginPath(); c.moveTo(x - 12 * s, y - 30 * s); c.lineTo(x + 12 * s, y - 30 * s); c.lineTo(x + 9 * s, y); c.lineTo(x - 9 * s, y); c.closePath(); c.fill();
  c.fillStyle = band; c.beginPath(); c.moveTo(x - 11 * s, y - 22 * s); c.lineTo(x + 11 * s, y - 22 * s); c.lineTo(x + 10 * s, y - 10 * s); c.lineTo(x - 10 * s, y - 10 * s); c.closePath(); c.fill();
  c.fillStyle = '#ffd23f'; rr(c, x - 13 * s, y - 33 * s, 26 * s, 4 * s, 1.5 * s);
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(.8, s); c.beginPath(); c.moveTo(x - 12 * s, y - 30 * s); c.lineTo(x - 9 * s, y); c.lineTo(x + 9 * s, y); c.lineTo(x + 12 * s, y - 30 * s); c.stroke();
}
function steamDraw(c, x, y, s, color = 'rgba(255,255,255,.9)') {
  c.strokeStyle = color; c.lineWidth = 2 * s; c.lineCap = 'round';
  for (const dx of [-6, 0, 6]) { c.beginPath(); c.moveTo(x + dx * s, y); c.bezierCurveTo(x + (dx - 4) * s, y - 5 * s, x + (dx + 4) * s, y - 9 * s, x + dx * s, y - 14 * s); c.stroke(); }
}

// Label atlas, 1024² canvas = 512² drawing units.
const AT = 512, PXU = .5 / 1024;
const RC = (x, y, w, h) => [x / AT + PXU, 1 - (y + h) / AT + PXU, (x + w) / AT - PXU, 1 - y / AT - PXU];
const SNACKS = [['감자칩', '#ffd23f'], ['새우칩', '#ff8a3c'], ['초코파이', '#e8462f'], ['초코스틱', '#ffffff'], ['쿠키', '#8fd3f4'],
  ['젤리', '#b9a6ff'], ['팝콘', '#ffffff'], ['せんべい', '#4fae5a'], ['콘칩', '#ffe066'], ['라면', '#ff6b2c']];
const SNACK_BODY = ['#ffd23f', '#ff8a3c', '#e8462f', '#e8462f', '#8fd3f4', '#b9a6ff', '#ff5a4a', '#4fae5a', '#ffe066', '#ff6b2c'];
const DRINKS = [['콜라', '#e8302f', '#ffffff'], ['사이다', '#2fae5a', '#ffffff'], ['바나나', '#ffe27a', '#8a5a2e'], ['お茶', '#4f9a4a', '#ffffff'],
  ['오렌지', '#ff9a2c', '#ffffff'], ['생수', '#d8f1ff', '#2f7fd8'], ['커피', '#6b3f2a', '#ffe9c8'], ['이온', '#ffffff', '#2f86e0']];
const SN = i => RC(i * 48, 0, 48, 64);                       // snack-pack fronts 0..9
const TAG = i => RC(480, i * 32, 32, 32);                    // 0: 1+1, 1: 2+1
const DR = i => RC(i * 64, 64, 64, 32);                      // drink labels 0..7
const MAG = i => RC(i * 64, 96, 64, 80);                     // magazine covers 0..3
const NOO = i => RC(256 + i * 128, 96, 128, 40);             // cup-noodle bands 0..1
const ICEP = i => (i < 2 ? RC(256 + i * 64, 136, 64, 40) : RC(i === 2 ? 396 : 448, 136, 40, 40));   // 0, 1 ice-bar wrappers, 2 cone lid, 3 tub lid (round)
const PT = i => RC(312 + (i % 5) * 40, 296 + Math.floor(i / 5) * 20, 40, 20);   // pastry price tags 0..9
const RG = {
  price: RC(0, 176, 256, 12), price2: RC(0, 188, 256, 12), cdisp: RC(256, 176, 64, 24), sand: RC(320, 176, 80, 24), pull: RC(400, 176, 64, 24),
  gauge: RC(464, 176, 32, 32), news: RC(0, 200, 96, 64), pos: RC(96, 200, 96, 64), steam: RC(192, 200, 96, 64), beans: RC(288, 200, 64, 64),
  latte: RC(352, 200, 48, 48), lotsign: RC(400, 208, 64, 40), hot: RC(0, 264, 64, 32), coin: RC(64, 264, 64, 32), wpanel: RC(128, 264, 128, 32),
  dpanel: RC(256, 264, 128, 32), wash: RC(384, 264, 64, 32), dry: RC(448, 264, 64, 32), logo: RC(0, 296, 96, 32), maghdr: RC(96, 296, 128, 32),
  det: RC(224, 296, 64, 40), poster: RC(0, 336, 96, 128), receipt: RC(96, 336, 48, 128), lotto: RC(144, 336, 96, 52), sleeve: RC(144, 392, 128, 32),
  snackhdr: RC(256, 336, 256, 48), bread: RC(272, 392, 96, 48), cold: RC(0, 464, 256, 48),
  wbrand: RC(144, 424, 128, 16), wguide: RC(368, 384, 64, 80), endcap: RC(432, 384, 64, 80),
};

function drawSnack(c, i, x, y) {
  const w = 48, h = 64, cx = x + w / 2, [nm, bg] = SNACKS[i];
  clip(c, x, y, w, h, () => {
    c.fillStyle = bg; c.fillRect(x, y, w, h);
    if (i === 0) {   // potato chips with a potato buddy
      c.fillStyle = '#e8462f'; c.fillRect(x, y, w, 17); txt(c, nm, cx, y + 9.5, 11, '#ffffff');
      c.fillStyle = '#f2a93b'; for (const [dx, dy, r] of [[-10, 33, 9], [9, 30, 8], [-1, 45, 10], [-13, 52, 7], [12, 49, 8]]) ell(c, cx + dx, y + dy, r, r * .68, dx * .05);
      c.fillStyle = '#ffe9a8'; for (const [dx, dy] of [[-12, 31], [7, 28], [-3, 43]]) ell(c, cx + dx, y + dy, 3, 1.6);
      c.fillStyle = '#c98a52'; ell(c, cx + 14, y + 27, 7, 6); c.fillStyle = INK; blob(c, cx + 12, y + 26, 1); blob(c, cx + 16.5, y + 26, 1);
      c.fillStyle = '#e8462f'; c.fillRect(x, y + h - 5, w, 5);
    } else if (i === 1) {   // shrimp crackers
      c.fillStyle = '#ffffff'; c.fillRect(x, y + 4, w, 15); txt(c, nm, cx, y + 12, 11, '#e8462f');
      c.strokeStyle = '#ff9f8a'; c.lineWidth = 5; c.lineCap = 'round';
      for (const [dx, dy, a] of [[-8, 38, .3], [8, 46, -.5], [-4, 54, 1]]) { c.beginPath(); c.arc(cx + dx, y + dy, 7, a, a + 3.6); c.stroke(); }
      c.fillStyle = '#ffd5c2'; for (const [dx, dy] of [[14, 32], [-15, 48], [12, 57]]) ell(c, cx + dx, y + dy, 5, 2.4, .5);
    } else if (i === 2) {   // choco pie box
      txt(c, nm, cx, y + 11, 10, '#ffffff', { stroke: '#a8261c', sw: 3 });
      c.fillStyle = '#6b3f2a'; ell(c, cx, y + 38, 17, 10); c.fillStyle = '#fff4e2'; c.fillRect(cx - 16, y + 37, 32, 4); c.fillStyle = '#8a5a3c'; ell(c, cx, y + 34, 16, 7);
      c.fillStyle = '#ffd23f'; heartPath(c, cx + 13, y + 54, 5); c.fill(); txt(c, '情', cx - 9, y + 55, 11, '#ffd23f');
    } else if (i === 3) {   // choco sticks
      c.fillStyle = '#e8462f'; c.fillRect(x, y + 40, w, 24); txt(c, nm, cx, y + 52, 10, '#ffffff');
      for (let k = 0; k < 4; k++) { c.save(); c.translate(x + 10 + k * 9, y + 30); c.rotate(-.35); c.fillStyle = '#f2d39a'; c.fillRect(-2, -14, 4, 28); c.fillStyle = '#6b3f2a'; c.fillRect(-2.5, -24, 5, 18); c.restore(); }
    } else if (i === 4) {   // cookies
      txt(c, nm, cx, y + 12, 14, '#ffffff', { stroke: '#3f9be0', sw: 3 });
      for (const [dx, dy, r] of [[-9, 36, 11], [9, 44, 12], [-6, 55, 8]]) { c.fillStyle = '#e8b46a'; blob(c, cx + dx, y + dy, r); c.fillStyle = '#6b3f2a'; for (const [ex, ey] of [[-.4, -.3], [.3, -.2], [0, .35], [.4, .3]]) blob(c, cx + dx + ex * r, y + dy + ey * r, r * .12); }
    } else if (i === 5) {   // gummy bears
      txt(c, nm, cx, y + 12, 14, '#ffffff', { stroke: '#7b63d8', sw: 3 });
      [['#ff5a6e', -12, 36], ['#ffd23f', 4, 34], ['#6cc46a', -4, 50], ['#ff9a3c', 12, 50]].forEach(([cc, dx, dy]) => {
        c.fillStyle = cc; blob(c, cx + dx, y + dy, 5.5); blob(c, cx + dx - 4, y + dy - 5, 2.4); blob(c, cx + dx + 4, y + dy - 5, 2.4); ell(c, cx + dx, y + dy + 7, 5, 4.5);
        c.fillStyle = 'rgba(255,255,255,.6)'; blob(c, cx + dx - 2, y + dy - 2, 1.4);
      });
    } else if (i === 6) {   // popcorn stripes
      c.fillStyle = '#ff5a4a'; for (let k = 0; k < 6; k++) c.fillRect(x + k * 9, y, 4.5, h);
      c.fillStyle = '#ffffff'; blob(c, cx, y + 36, 16);
      c.fillStyle = '#fff3c4'; for (const [dx, dy] of [[-7, 32], [0, 28], [7, 33], [-4, 39], [5, 40], [0, 35]]) blob(c, cx + dx, y + dy, 4.2);
      c.fillStyle = '#ffffff'; rr(c, x + 4, y + 4, w - 8, 15, 4); txt(c, nm, cx, y + 12, 11, '#ff5a4a');
      c.fillStyle = '#ffffff'; rr(c, x + 6, y + 52, w - 12, 9, 3); txt(c, 'BUTTER', cx, y + 56.5, 6, '#ff5a4a');
    } else if (i === 7) {   // senbei (rice crackers)
      txt(c, nm, cx, y + 11, 9, '#ffffff');
      for (const [dx, dy] of [[-8, 34], [9, 42], [-4, 53]]) { c.fillStyle = '#d9934a'; blob(c, cx + dx, y + dy, 9); c.fillStyle = '#2f3a30'; c.fillRect(cx + dx - 4, y + dy - 9, 8, 18); c.fillStyle = '#f2c27a'; blob(c, cx + dx + 4, y + dy - 3, 1.6); }
    } else if (i === 8) {   // corn chips
      c.fillStyle = '#6cc46a'; c.fillRect(x, y + 46, w, 18); txt(c, nm, cx, y + 55, 12, '#ffffff');
      c.fillStyle = '#ffc23d'; ell(c, cx, y + 26, 8, 15, .3); c.fillStyle = '#ffe9a8'; for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) blob(c, cx - 2 + k * 4 + r * 1.2, y + 17 + r * 6, 1.5);
      c.fillStyle = '#4ea85a'; c.beginPath(); c.moveTo(cx - 3, y + 40); c.quadraticCurveTo(cx - 16, y + 30, cx - 12, y + 14); c.quadraticCurveTo(cx - 8, y + 30, cx + 1, y + 38); c.fill();
    } else {   // ramen bag
      txt(c, nm, cx, y + 13, 17, '#ffffff', { stroke: '#a8261c', sw: 3 });
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx, y + 38, 16, 0, PI); c.fill();
      c.strokeStyle = '#ffd23f'; c.lineWidth = 1.6; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(cx - 13, y + 40 + k * 3); for (let s = 0; s < 8; s++) c.lineTo(cx - 13 + s * 3.7, y + 40 + k * 3 + (s % 2 ? -1.6 : 1.6)); c.stroke(); }
      c.fillStyle = '#ffffff'; blob(c, cx + 8, y + 37, 4.5); c.fillStyle = '#ffc23d'; blob(c, cx + 8, y + 37, 2.2);
      steamDraw(c, cx, y + 34, .6);
    }
  });
}
function drawTag(c, i) {
  const x = 480, y = i * 32;
  c.fillStyle = i ? '#ffd23f' : '#ff5a4a'; c.fillRect(x, y, 32, 32);
  c.fillStyle = '#ffffff'; starPath(c, x + 16, y + 16, 15, 11); c.fill();
  txt(c, i ? '2+1' : '1+1', x + 16, y + 17, 11, i ? '#e8462f' : '#ff5a4a');
}
function drawDrink(c, i, x, y) {
  const [nm, bg, fg] = DRINKS[i];
  clip(c, x, y, 64, 32, () => {
    c.fillStyle = bg; c.fillRect(x, y, 64, 32);
    if (i === 0) { c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y + 25); c.bezierCurveTo(x + 20, y + 18, x + 40, y + 32, x + 64, y + 22); c.stroke(); }
    if (i === 1) { c.fillStyle = 'rgba(255,255,255,.7)'; for (const [dx, dy, r] of [[8, 8, 2.5], [54, 10, 2], [12, 24, 1.8], [56, 24, 2.6]]) blob(c, x + dx, y + dy, r); }
    if (i === 2) { c.fillStyle = '#ffffff'; c.fillRect(x, y + 25, 64, 7); c.fillStyle = '#ffc23d'; c.beginPath(); c.ellipse(x + 52, y + 12, 8, 3, -.6, 0, PI * 2); c.fill(); }
    if (i === 3) { c.fillStyle = '#8fd47a'; ell(c, x + 52, y + 16, 5, 9, .5); c.fillStyle = '#ffffff'; c.fillRect(x, y + 27, 64, 3); }
    if (i === 4) { c.fillStyle = '#ffffff'; blob(c, x + 53, y + 16, 8); c.fillStyle = '#ffc23d'; blob(c, x + 53, y + 16, 6.5); c.strokeStyle = '#ffffff'; c.lineWidth = 1; for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; line(c, [[x + 53, y + 16], [x + 53 + Math.cos(a) * 6, y + 16 + Math.sin(a) * 6]]); } }
    if (i === 5) { c.fillStyle = '#7fb7ff'; c.beginPath(); c.moveTo(x + 40, y + 28); c.lineTo(x + 52, y + 10); c.lineTo(x + 64, y + 28); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + 48, y + 16); c.lineTo(x + 52, y + 10); c.lineTo(x + 56, y + 16); c.fill(); }
    if (i === 6) { c.fillStyle = '#c98a52'; ell(c, x + 53, y + 16, 5, 7, .4); c.strokeStyle = '#6b3f2a'; c.lineWidth = 1; line(c, [[x + 51, y + 11], [x + 55, y + 21]]); }
    if (i === 7) { c.fillStyle = '#2f86e0'; c.fillRect(x, y, 64, 5); c.fillRect(x, y + 27, 64, 5); }
    txt(c, nm, x + (i === 0 || i === 1 || i === 7 ? 32 : 26), y + 15, i === 3 ? 13 : 12, fg, i === 2 ? {} : (i === 5 || i === 7 ? {} : { stroke: shade(bg, -.25), sw: 2.5 }));
  });
}
function drawMag(c, i, x, y) {
  const M = [['#ff8f7a', 'MOCHI', '#ffffff'], ['#ffc23d', '요리', '#e8462f'], ['#5fb8f0', 'GAME', '#ffffff'], ['#6cc46a', '여행', '#ffffff']][i];
  clip(c, x, y, 64, 80, () => {
    c.fillStyle = M[0]; c.fillRect(x, y, 64, 80);
    if (i === 0) { c.fillStyle = '#fff4e2'; blob(c, x + 34, y + 50, 22); mochi(c, x + 34, y + 50, 15); c.fillStyle = '#ffd23f'; starPath(c, x + 12, y + 32, 6); c.fill(); }
    if (i === 1) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + 32, y + 46, 18, 0, PI); c.fill(); c.strokeStyle = '#ff9a3c'; c.lineWidth = 1.6; for (let k = 0; k < 3; k++) line(c, [[x + 18, y + 47 + k * 3], [x + 46, y + 47 + k * 3]]); c.fillStyle = '#6cc46a'; blob(c, x + 26, y + 44, 3); c.fillStyle = '#ffffff'; blob(c, x + 38, y + 43, 4); c.fillStyle = '#ffc23d'; blob(c, x + 38, y + 43, 2); steamDraw(c, x + 32, y + 40, .7); }
    if (i === 2) { c.fillStyle = '#ffffff'; rr(c, x + 12, y + 36, 40, 22, 10); c.fillStyle = '#2a1d33'; c.fillRect(x + 19, y + 45, 10, 3); c.fillRect(x + 22.5, y + 41.5, 3, 10); c.fillStyle = '#ff5a4a'; blob(c, x + 42, y + 44, 2.6); c.fillStyle = '#ffc23d'; blob(c, x + 46, y + 48, 2.6); c.fillStyle = '#ffd23f'; starPath(c, x + 52, y + 30, 5); c.fill(); }
    if (i === 3) { c.fillStyle = '#9fd8f6'; c.fillRect(x, y + 24, 64, 40); c.fillStyle = '#6f8fd8'; c.beginPath(); c.moveTo(x + 6, y + 62); c.lineTo(x + 32, y + 34); c.lineTo(x + 58, y + 62); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + 24, y + 43); c.lineTo(x + 32, y + 34); c.lineTo(x + 40, y + 43); c.lineTo(x + 32, y + 40); c.fill(); c.fillStyle = '#ff7a8a'; blob(c, x + 50, y + 32, 4); }
    txt(c, M[1], x + 32, y + 13, 16, M[2], { stroke: shade(M[0], -.3), sw: 3 });
    c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(x + 5, y + 66, 30, 3); c.fillRect(x + 5, y + 72, 22, 3);
    c.fillStyle = '#ff5a4a'; rr(c, x + 44, y + 64, 16, 12, 3); txt(c, 'NEW', x + 52, y + 70.5, 6, '#ffffff');
  });
}
function drawNoodleBand(c, i) {
  const x = 256 + i * 128, y = 96;
  clip(c, x, y, 128, 40, () => {
    c.fillStyle = i ? '#ffd23f' : '#e8462f'; c.fillRect(x, y, 128, 40);
    c.fillStyle = i ? '#ffffff' : '#ffd23f'; c.fillRect(x, y + 33, 128, 4);
    if (i) { txt(c, 'うどん', x + 48, y + 18, 15, '#4a2e2a'); c.fillStyle = '#ffffff'; blob(c, x + 100, y + 18, 9); c.strokeStyle = '#ff7a9a'; c.lineWidth = 1.6; c.beginPath(); c.arc(x + 100, y + 18, 4.5, 0, 5); c.stroke(); }
    else { txt(c, '매운 라면', x + 50, y + 18, 15, '#ffffff', { stroke: '#a8261c', sw: 3 }); c.fillStyle = '#c8261c'; c.beginPath(); c.ellipse(x + 104, y + 18, 5, 12, .5, 0, PI * 2); c.fill(); c.fillStyle = '#4ea85a'; c.fillRect(x + 108, y + 6, 3, 5); }
  });
}
function drawIce(c, i) {
  const x = 256 + i * 64, y = 136;
  clip(c, x, y, 64, 40, () => {
    if (i < 2) {
      const bg = i ? '#ff6b7a' : '#5fb8f0'; c.fillStyle = bg; c.fillRect(x, y, 64, 40);
      c.fillStyle = '#ffffff'; for (let k = 0; k < 7; k++) blob(c, x + 4 + k * 10, y + 38, 5);
      c.fillStyle = i ? '#ffd1d8' : '#ffffff'; rr(c, x + 38, y + 8, 14, 20, 6); c.fillStyle = '#e8bb82'; c.fillRect(x + 43, y + 27, 4, 8);
      if (i) { c.fillStyle = '#ff3b5c'; blob(c, x + 45, y + 13, 3); blob(c, x + 43, y + 20, 2.5); }
      txt(c, i ? '딸기바' : '소다바', x + 20, y + 17, 11, '#ffffff', { stroke: shade(bg, -.3), sw: 2.5 });
    } else if (i === 2) {
      c.fillStyle = '#ffe9c8'; c.fillRect(x, y, 64, 40); c.fillStyle = '#6b3f2a'; blob(c, x + 32, y + 20, 18);
      c.fillStyle = '#ffffff'; txt(c, '콘', x + 32, y + 20, 15, '#ffffff'); c.fillStyle = '#ff5a6e'; for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; blob(c, x + 32 + Math.cos(a) * 13, y + 20 + Math.sin(a) * 13, 1.6); }
    } else {
      c.fillStyle = '#7fd6c0'; c.fillRect(x, y, 40, 40); c.fillStyle = '#fff4e2'; blob(c, x + 20, y + 20, 17);
      c.fillStyle = '#7fd6c0'; blob(c, x + 20, y + 22, 7); c.fillStyle = '#ffffff'; blob(c, x + 17, y + 14, 5);
      txt(c, '바닐라', x + 20, y + 32, 7, '#3f8a72');
    }
  });
}
function drawPrice(c, y, alt) {
  c.fillStyle = '#ffffff'; c.fillRect(0, y, 256, 12);
  for (let k = 0; k < 8; k++) {
    const x = k * 32 + 2, deal = (k + alt) % 3 === 1;
    c.fillStyle = deal ? '#ff5a4a' : (alt ? '#c8f0d8' : '#ffe27a'); rr(c, x, y + 1, 28, 10, 2);
    txt(c, deal ? (k % 2 ? '2+1' : '1+1') : ['1,500', '1,200', '2,000', '900', '1,800'][(k + alt) % 5], x + 14, y + 6.5, 7, deal ? '#ffffff' : '#4a2e2a');
  }
}
function drawNews(c, x, y) {
  c.fillStyle = '#f3f0e8'; c.fillRect(x, y, 96, 64);
  c.fillStyle = '#2a1d33'; c.fillRect(x + 4, y + 4, 88, 2); txt(c, '동네신문', x + 48, y + 14, 13, '#2a1d33');
  c.fillStyle = '#2a1d33'; c.fillRect(x + 4, y + 22, 88, 1.5);
  c.fillStyle = '#9fd8f6'; c.fillRect(x + 6, y + 27, 34, 26); mochi(c, x + 23, y + 43, 8);
  c.fillStyle = '#b7b1a8'; for (let k = 0; k < 6; k++) c.fillRect(x + 46, y + 28 + k * 5, k === 5 ? 26 : 42, 2.2);
  for (let k = 0; k < 2; k++) c.fillRect(x + 6, y + 56 + k * 4, 84, 2);
}
function drawPOS(c, x, y) {
  c.fillStyle = '#eaf6ff'; c.fillRect(x, y, 96, 64);
  c.fillStyle = '#3f86d8'; c.fillRect(x, y, 96, 12); txt(c, '몽글마트 POS', x + 34, y + 6.5, 8, '#ffffff');
  const C = ['#ffd23f', '#ff9f8a', '#7fd6c0', '#8fd3f4', '#b9a6ff', '#ffab4c'];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) { c.fillStyle = C[(r * 3 + k) % 6]; rr(c, x + 4 + k * 19, y + 16 + r * 15, 17, 12, 2.5); }
  c.fillStyle = '#ffffff'; rr(c, x + 63, y + 16, 29, 42, 3); c.fillStyle = '#c9d6e6'; for (let k = 0; k < 4; k++) c.fillRect(x + 66, y + 20 + k * 6, 22, 2);
  c.fillStyle = '#ff5a4a'; rr(c, x + 63, y + 46, 29, 12, 3); txt(c, '4,500', x + 77.5, y + 52.5, 8, '#ffffff');
}
function drawSteam(c, x, y) {
  clip(c, x, y, 96, 64, () => {
    const g = c.createLinearGradient(0, y, 0, y + 64); g.addColorStop(0, '#f4fbff'); g.addColorStop(1, '#d5ecf6'); c.fillStyle = g; c.fillRect(x, y, 96, 64);
    for (const [dx, cc, mk] of [[16, '#fff6e6', '#e8a456'], [40, '#ffd27a', '#c97a3a'], [64, '#f2d0b0', '#8a4a3a'], [86, '#fff6e6', '#e8a456']]) {
      c.fillStyle = cc; ell(c, x + dx, y + 46, 11, 8); c.fillStyle = mk; blob(c, x + dx, y + 42, 1.6);
    }
    c.fillStyle = 'rgba(255,255,255,.75)'; for (let k = 0; k < 18; k++) blob(c, x + (k * 37) % 92 + 2, y + 24 + (k * 13) % 34, 1 + (k % 3) * .5);
    c.fillStyle = '#ff5a4a'; rr(c, x + 8, y + 4, 80, 16, 5); txt(c, '따끈따끈 호빵', x + 48, y + 12.5, 10, '#ffffff');
    steamDraw(c, x + 40, y + 36, .55, 'rgba(255,255,255,.95)');
  });
}
function drawLabels(c) {
  // customer display, sandwich label, pull sticker, pressure gauge
  c.fillStyle = '#26402f'; c.fillRect(256, 176, 64, 24); txt(c, '₩ 4,500', 288, 188.5, 12, '#b8ff7a');
  c.fillStyle = '#ffffff'; c.fillRect(320, 176, 80, 24); c.fillStyle = '#ffd23f'; c.fillRect(320, 176, 22, 24); c.fillStyle = '#ffffff'; blob(c, 331, 188, 6); c.fillStyle = '#ffc23d'; blob(c, 331, 188, 3);
  txt(c, '에그 샌드', 371, 188.5, 11, '#e8462f');
  c.fillStyle = '#ffffff'; rr(c, 401, 177, 62, 22, 5); c.strokeStyle = '#ff5a4a'; c.lineWidth = 2; roundRect(c, 403, 179, 58, 18, 4); c.stroke(); txt(c, '당기세요', 432, 188.5, 10, '#ff5a4a');
  c.fillStyle = '#ffffff'; blob(c, 480, 192, 15.5); c.strokeStyle = '#2a1d33'; c.lineWidth = 1; for (let k = 0; k < 7; k++) { const a = PI * .8 + k / 6 * PI * 1.4; line(c, [[480 + Math.cos(a) * 11, 192 + Math.sin(a) * 11], [480 + Math.cos(a) * 14, 192 + Math.sin(a) * 14]]); }
  c.fillStyle = '#ff5a4a'; c.beginPath(); c.arc(480, 192, 12, PI * 1.7, PI * 2.2); c.lineTo(480, 192); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = 1.6; line(c, [[480, 192], [488, 184]]); c.fillStyle = '#2a1d33'; blob(c, 480, 192, 2);
  // latte art (a heart in foam)
  c.fillStyle = '#c98a52'; c.fillRect(352, 200, 48, 48); c.fillStyle = '#a8693f'; blob(c, 376, 224, 23); c.fillStyle = '#c98a52'; blob(c, 376, 224, 20);
  c.fillStyle = '#fff4e2'; heartPath(c, 376, 222, 12); c.fill(); c.strokeStyle = '#c98a52'; c.lineWidth = 1.2; line(c, [[376, 213], [376, 233]]);
  // lottery sign
  c.fillStyle = '#3f6fd8'; rr(c, 400, 208, 64, 40, 6); c.fillStyle = '#ffd23f'; rr(c, 404, 212, 56, 18, 4); txt(c, '복권 판매', 432, 221.5, 10, '#3f6fd8');
  c.fillStyle = '#6cc46a'; for (let k = 0; k < 4; k++) { const a = k * HP + PI / 4; blob(c, 432 + Math.cos(a) * 4, 239 + Math.sin(a) * 4, 3.6); }
  txt(c, '★ 1등 ★', 451, 239, 6, '#ffd23f'); txt(c, 'LOTTO', 413, 239, 6, '#ffffff');
  // hot water, coin slot, washer / dryer panels, price stickers
  c.fillStyle = '#ffffff'; c.fillRect(0, 264, 64, 32); c.fillStyle = '#ff5a4a'; blob(c, 14, 280, 10); txt(c, '온수', 14, 280.5, 9, '#ffffff'); txt(c, 'HOT', 42, 276, 11, '#ff5a4a'); txt(c, '조심!', 42, 288, 8, '#2a1d33');
  c.fillStyle = '#e4e8f0'; c.fillRect(64, 264, 64, 32); c.fillStyle = '#5b5672'; rr(c, 72, 270, 8, 20, 2); c.fillStyle = '#2a1d33'; c.fillRect(75, 272, 2, 16); coinDraw(c, 100, 280, 10); txt(c, '▼', 118, 280, 8, '#ff5a4a');
  const panel = (x0, word, time, acc) => {
    c.fillStyle = '#f6f9fd'; c.fillRect(x0, 264, 128, 32);
    c.fillStyle = '#dde5ef'; blob(c, x0 + 18, 280, 12); c.strokeStyle = '#8f98ab'; c.lineWidth = 1; for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; line(c, [[x0 + 18 + Math.cos(a) * 9, 280 + Math.sin(a) * 9], [x0 + 18 + Math.cos(a) * 11.5, 280 + Math.sin(a) * 11.5]]); }
    c.fillStyle = '#26402f'; rr(c, x0 + 36, 270, 38, 15, 3); txt(c, time, x0 + 55, 278, 10, '#b8ff7a');
    txt(c, word, x0 + 55, 291, 8, '#5b5672');
    for (let k = 0; k < 3; k++) { c.fillStyle = [acc, '#7fd6c0', '#ffc23d'][k]; blob(c, x0 + 84 + k * 10, 278, 3.5); }
    c.fillStyle = '#5b5672'; rr(c, x0 + 114, 268, 8, 22, 2); c.fillStyle = '#ffd23f'; c.fillRect(x0 + 117, 270, 2, 18); txt(c, '500', x0 + 107, 292, 6, '#5b5672');
  };
  panel(128, '세탁', '38:00', '#4f9fe8'); panel(256, '건조', '45:00', '#ff9a3c');
  c.fillStyle = '#3f86d8'; rr(c, 384, 264, 64, 32, 5); txt(c, '세탁', 416, 274, 10, '#ffffff'); txt(c, '4,000원', 416, 287, 11, '#ffe27a');
  c.fillStyle = '#ff9a3c'; rr(c, 448, 264, 64, 32, 5); txt(c, '건조', 480, 274, 10, '#ffffff'); txt(c, '3,000원', 480, 287, 11, '#ffffff');
  // café logo, magazine header, detergent, pastry tags
  c.fillStyle = '#2f7a5a'; rr(c, 0, 296, 96, 32, 14); c.strokeStyle = '#fff4e2'; c.lineWidth = 1.5; roundRect(c, 3, 299, 90, 26, 11); c.stroke();
  c.fillStyle = '#c98a52'; ell(c, 16, 312, 5, 7, .4); c.strokeStyle = '#6b3f2a'; line(c, [[14, 307], [18, 317]]); txt(c, 'CAFÉ 몽글', 56, 312.5, 12, '#fff4e2');
  c.fillStyle = '#ffffff'; c.fillRect(96, 296, 128, 32); c.fillStyle = '#ff5a4a'; c.fillRect(96, 296, 128, 5); c.fillStyle = '#3f86d8'; c.fillRect(96, 323, 128, 5);
  txt(c, '잡지 · 신문', 160, 312.5, 15, '#2a1d33');
  c.fillStyle = '#8fd3f4'; c.fillRect(224, 296, 64, 40); c.fillStyle = '#ffffff'; for (const [dx, dy, r] of [[8, 8, 4], [56, 10, 5], [50, 32, 3], [12, 32, 3.5]]) blob(c, 224 + dx, 296 + dy, r);
  txt(c, '세제', 256, 312, 15, '#ffffff', { stroke: '#2f7fd8', sw: 3 }); txt(c, '향기 퐁퐁', 256, 328, 8, '#2f7fd8');
  const TN = [['크루아상', '2,800'], ['메론빵', '2,500'], ['도넛', '1,800'], ['베이글', '2,200'], ['소보로', '1,900'], ['단팥빵', '1,700'], ['쿠키', '1,200'], ['식빵', '3,500']];
  TN.forEach(([nm, pr], k) => {
    const x = 312 + (k % 5) * 40, y = 296 + Math.floor(k / 5) * 20;
    c.fillStyle = '#fffaf0'; c.fillRect(x, y, 40, 20); c.fillStyle = ['#ff9f8a', '#7fd6c0', '#ffc23d', '#8fd3f4'][k % 4]; c.fillRect(x, y, 40, 4);
    txt(c, nm, x + 20, y + 9.5, 7, '#4a2e2a'); txt(c, pr, x + 20, y + 16, 6, '#e8462f');
  });
}
function drawPoster(c, x, y) {   // the konbini's 2+1 promo
  clip(c, x, y, 96, 128, () => {
    c.fillStyle = '#ffe27a'; c.fillRect(x, y, 96, 128);
    c.fillStyle = '#ffd23f'; for (let k = 0; k < 9; k++) { c.save(); c.translate(x + 48, y + 74); c.rotate(k / 9 * PI * 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(-7, -70); c.lineTo(7, -70); c.fill(); c.restore(); }
    c.fillStyle = '#ff5a4a'; c.fillRect(x, y, 96, 26); txt(c, '오늘의 간식', x + 48, y + 13.5, 14, '#ffffff');
    // onigiri
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + 30, y + 48); c.quadraticCurveTo(x + 50, y + 82, x + 46, y + 86); c.lineTo(x + 14, y + 86); c.quadraticCurveTo(x + 10, y + 82, x + 30, y + 48); c.fill();
    c.fillStyle = '#2f3a30'; c.fillRect(x + 22, y + 72, 16, 14); c.fillStyle = '#2a1d33'; blob(c, x + 25, y + 66, 1.6); blob(c, x + 35, y + 66, 1.6);
    c.fillStyle = '#ff9fb5'; blob(c, x + 21, y + 69, 2.4); blob(c, x + 39, y + 69, 2.4);
    // sandwich
    c.fillStyle = '#fff3dc'; c.beginPath(); c.moveTo(x + 52, y + 86); c.lineTo(x + 70, y + 50); c.lineTo(x + 88, y + 86); c.closePath(); c.fill();
    c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x + 58, y + 82); c.lineTo(x + 70, y + 58); c.lineTo(x + 82, y + 82); c.closePath(); c.fill();
    c.fillStyle = '#6cc46a'; c.fillRect(x + 56, y + 80, 28, 3);
    c.fillStyle = '#ff5a4a'; rr(c, x + 14, y + 92, 68, 28, 8); txt(c, '2+1', x + 48, y + 106.5, 22, '#ffffff', { stroke: '#a8261c', sw: 3 });
  });
}
function drawReceipt(c, x, y) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, 48, 128);
  txt(c, '몽글마트', x + 24, y + 9, 9, '#2a1d33');
  c.fillStyle = '#9a96a8'; c.fillRect(x + 4, y + 16, 40, 1);
  for (let k = 0; k < 7; k++) { c.fillStyle = '#9a96a8'; c.fillRect(x + 4, y + 22 + k * 9, 18 + (k * 7) % 10, 2.4); c.fillRect(x + 32, y + 22 + k * 9, 12, 2.4); }
  c.fillStyle = '#2a1d33'; c.fillRect(x + 4, y + 87, 40, 1); txt(c, '합계', x + 12, y + 95, 8, '#2a1d33'); txt(c, '4,500', x + 33, y + 95, 8, '#e8462f');
  c.fillStyle = '#2a1d33'; for (let k = 0; k < 16; k++) c.fillRect(x + 5 + k * 2.4, y + 104, (k * 5) % 3 * .6 + .8, 12);
  txt(c, '감사합니다', x + 24, y + 122, 6, '#5b5672');
}
function drawLotto(c, x, y) {
  c.fillStyle = '#fff6d6'; c.fillRect(x, y, 96, 52);
  c.fillStyle = '#6cc46a'; c.fillRect(x, y, 96, 12); txt(c, '행운 복권', x + 30, y + 6.5, 9, '#ffffff');
  c.fillStyle = '#ffd23f'; starPath(c, x + 84, y + 6, 5); c.fill();
  const N = ['7', '13', '21', '28', '35', '42'];
  N.forEach((s, k) => { c.fillStyle = ['#ff9f8a', '#ffc23d', '#8fd3f4', '#7fd6c0', '#b9a6ff', '#ff9fb5'][k]; blob(c, x + 10 + k * 11, y + 23, 4.8); txt(c, s, x + 10 + k * 11, y + 23.5, 5.5, '#2a1d33'); });
  c.fillStyle = '#c9cfe0'; rr(c, x + 6, y + 32, 50, 15, 4); txt(c, '긁어요!', x + 31, y + 39.5, 8, '#5b5672');
  c.fillStyle = '#ffc93c'; blob(c, x + 76, y + 36, 12); txt(c, '1등', x + 76, y + 36.5, 8, '#a8261c');
}
function drawSleeve(c, x, y) {
  c.fillStyle = '#d9a46a'; c.fillRect(x, y, 128, 32);
  c.fillStyle = '#c98f58'; for (let k = 0; k < 32; k++) c.fillRect(x + k * 4, y, 1, 32);
  for (const cx of [x + 32, x + 96]) { c.fillStyle = '#2f7a5a'; blob(c, cx, y + 16, 12); c.fillStyle = '#fff4e2'; blob(c, cx, y + 16, 9); c.fillStyle = '#2f7a5a'; heartPath(c, cx, y + 15, 5); c.fill(); }
  txt(c, 'CAFÉ', x + 64, y + 16.5, 9, '#fff4e2');
}
function drawSnackHdr(c, x, y) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, 256, 48);
  c.fillStyle = '#ff9a3c'; c.fillRect(x, y, 256, 7); c.fillStyle = '#ff5a4a'; c.fillRect(x, y + 7, 256, 4); c.fillStyle = '#3f86d8'; c.fillRect(x, y + 41, 256, 7);
  txt(c, '과자 · 스낵', x + 128, y + 26, 22, '#2a1d33');
  for (const [dx, cc] of [[24, '#ffd23f'], [232, '#8fd3f4']]) { c.fillStyle = cc; rr(c, x + dx - 10, y + 14, 20, 24, 5); c.fillStyle = '#ff5a4a'; c.fillRect(x + dx - 10, y + 14, 20, 5); }
  c.fillStyle = '#ffc23d'; starPath(c, x + 52, y + 26, 6); c.fill(); starPath(c, x + 204, y + 26, 6); c.fill();
}
function drawBread(c, x, y) {
  c.fillStyle = '#35584a'; rr(c, x, y, 96, 48, 6); c.strokeStyle = '#c98f58'; c.lineWidth = 3; roundRect(c, x + 1.5, y + 1.5, 93, 45, 5); c.stroke();
  txt(c, '오늘의 빵', x + 48, y + 15, 13, '#ffe27a');
  c.fillStyle = '#e8a456'; for (let k = 0; k < 4; k++) ell(c, x + 30 + k * 8, y + 32 - Math.abs(k - 1.5) * 2, 5, 4);
  c.fillStyle = '#fff4e2'; txt(c, '갓 구운', x + 70, y + 33, 9, '#ffffff');
}
function drawLaundry(c) {
  // the brand strip along the foot of each machine
  { const x = 144, y = 424; c.fillStyle = '#2f7fd8'; c.fillRect(x, y, 128, 16); c.fillStyle = 'rgba(255,255,255,.55)'; for (const [dx, r] of [[6, 3], [14, 2], [118, 3], [124, 1.8]]) blob(c, x + dx, y + 8, r);
    txt(c, 'COIN LAUNDRY · 몽글빨래방', x + 64, y + 8.5, 8, '#ffffff'); }
  // how-to sticker: coin, detergent, start
  { const x = 368, y = 384; c.fillStyle = '#ffffff'; c.fillRect(x, y, 64, 80); c.fillStyle = '#2f7fd8'; c.fillRect(x, y, 64, 16); txt(c, '이용 방법', x + 32, y + 8.5, 10, '#ffffff');
    const step = (k, label, icon) => { const yy = y + 28 + k * 18; c.fillStyle = '#ffc23d'; blob(c, x + 9, yy, 6); txt(c, String(k + 1), x + 9, yy + .5, 8, '#2a1d33'); icon(x + 25, yy); txt(c, label, x + 47, yy + .5, 8, '#2f3a5a'); };
    step(0, '동전', (ix, iy) => coinDraw(c, ix, iy, 6));
    step(1, '세제', (ix, iy) => { c.fillStyle = '#5aa9ec'; rr(c, ix - 5, iy - 6, 10, 12, 2.5); c.fillStyle = '#ffffff'; c.fillRect(ix - 2, iy - 8, 4, 3); });
    step(2, '시작', (ix, iy) => { c.fillStyle = '#4fc77a'; blob(c, ix, iy, 6); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(ix - 2, iy - 3.5); c.lineTo(ix + 3.5, iy); c.lineTo(ix - 2, iy + 3.5); c.fill(); }); }
  // the gondola end-cap poster: new snacks
  { const x = 432, y = 384; c.fillStyle = '#fff1a8'; c.fillRect(x, y, 64, 80);
    c.fillStyle = '#ffd23f'; for (let k = 0; k < 8; k++) { c.save(); c.translate(x + 32, y + 48); c.rotate(k / 8 * PI * 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(-5, -44); c.lineTo(5, -44); c.fill(); c.restore(); }
    c.fillStyle = '#ff5a4a'; c.fillRect(x, y, 64, 18); txt(c, '신상 과자', x + 32, y + 9.5, 11, '#ffffff');
    c.fillStyle = '#ff8a3c'; rr(c, x + 12, y + 26, 22, 30, 5); c.fillStyle = '#ffffff'; c.fillRect(x + 12, y + 33, 22, 7); c.fillStyle = '#c8402e'; c.fillRect(x + 12, y + 26, 22, 3); c.fillRect(x + 12, y + 53, 22, 3);
    c.fillStyle = '#8fd3f4'; rr(c, x + 32, y + 30, 20, 26, 3); mochi(c, x + 42, y + 44, 6.5);
    c.fillStyle = '#ff5a4a'; starPath(c, x + 50, y + 66, 9); c.fill(); txt(c, 'NEW', x + 50, y + 66.5, 6, '#ffffff');
    txt(c, '맛있어요!', x + 22, y + 69, 8, '#c8402e'); }
}
function drawCold(c, x, y) {
  const g = c.createLinearGradient(0, y, 0, y + 48); g.addColorStop(0, '#5fc0ff'); g.addColorStop(1, '#2f86e0'); c.fillStyle = g; c.fillRect(x, y, 256, 48);
  c.fillStyle = 'rgba(255,255,255,.55)'; for (const [dx, dy, r] of [[10, 10, 3], [22, 36, 4], [236, 12, 4], [246, 34, 3], [70, 8, 2], [190, 40, 2.5]]) blob(c, x + dx, y + dy, r);
  c.fillStyle = '#e8f8ff'; for (const dx of [30, 210]) { c.save(); c.translate(x + dx + 8, y + 24); c.rotate(.3); rr(c, -9, -9, 18, 18, 4); c.restore(); }
  txt(c, '시원한 음료', x + 128, y + 20, 20, '#ffffff', { stroke: '#1f5fa8', sw: 4 });
  txt(c, 'COLD DRINKS', x + 128, y + 39, 9, '#e8f8ff');
}
const atlas = () => tex('shop-atlas', 1024, 1024, c => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, AT, AT);
  for (let i = 0; i < 10; i++) drawSnack(c, i, i * 48, 0);
  drawTag(c, 0); drawTag(c, 1);
  for (let i = 0; i < 8; i++) drawDrink(c, i, i * 64, 64);
  for (let i = 0; i < 4; i++) drawMag(c, i, i * 64, 96);
  drawNoodleBand(c, 0); drawNoodleBand(c, 1);
  for (let i = 0; i < 4; i++) drawIce(c, i);
  drawPrice(c, 176, 0); drawPrice(c, 188, 1);
  drawNews(c, 0, 200); drawPOS(c, 96, 200); drawSteam(c, 192, 200);
  // a kraft coffee-bean bag
  c.fillStyle = '#d9a46a'; c.fillRect(288, 200, 64, 64); c.fillStyle = '#2f7a5a'; rr(c, 296, 214, 48, 30, 5); txt(c, '원두', 320, 225, 12, '#fff4e2');
  c.fillStyle = '#6b3f2a'; for (const dx of [-8, 0, 8]) ell(c, 320 + dx, 238, 3, 4, .4); txt(c, 'BLEND', 320, 254, 7, '#6b3f2a');
  drawLabels(c);
  drawPoster(c, 0, 336); drawReceipt(c, 96, 336); drawLotto(c, 144, 336); drawSleeve(c, 144, 392); drawSnackHdr(c, 256, 336); drawBread(c, 272, 392);
  drawCold(c, 0, 464); drawLaundry(c);
}, { text: true });
const atlasMat = () => mat('#ffffff', { map: atlas() });
const signMat = () => mat('#ffffff', { map: atlas(), emissive: '#ffffff', ei: .2 });
const screenMat = () => mat('#ffffff', { map: atlas(), emissive: '#ffffff', ei: .14 });
// glass: a pale tint only (10/21, user: "유리에 이 네모 리플렉션 진짜 꼴보기 싫다" — no printed white streaks on any glass)
const glassTex = () => tex('shop-glass2', 128, 128, (c, w, h) => {
  c.fillStyle = '#d3eff9'; c.fillRect(0, 0, w, h);
});
const glassMat = (op = .3) => mat('#ffffff', { map: glassTex(), opacity: op, side: DS });
const litMat = () => mat('#fffdf6', { emissive: '#fff4dc', ei: .45 });
const bandGeo = (r, h, rc, a = 2.2, seg = 8) => cellUV(new THREE.CylinderGeometry(r, r, h, seg, 1, true, -a / 2, a), rc);
const taperBand = (rt, rb, h, rc, a = 2.2) => cellUV(new THREE.CylinderGeometry(rt, rb, h, 10, 1, true, -a / 2, a), rc);
const quadGeo = (w, h, rc) => cellUV(new THREE.PlaneGeometry(w, h), rc);
const transparent = o => { o.castShadow = false; return o; };

// Repeating surface prints (world-sized through planarUV)
const woodTex = (c1, vert = false) => tex('shop-wood|' + c1 + '|' + vert, 128, 128, (c, w, h) => {
  if (vert) { c.translate(w, 0); c.rotate(HP); }
  for (let k = 0; k < 2; k++) {
    const y0 = k * h / 2;
    c.fillStyle = tint(shade(c1, k ? .035 : -.015)); c.fillRect(0, y0, w, h / 2);
    c.strokeStyle = tint(shade(c1, -.09)); c.lineWidth = .9;
    for (let i = 0; i < 4; i++) { const yy = y0 + 4 + i * 7 + k * 2; c.beginPath(); c.moveTo(0, yy); c.bezierCurveTo(w * .3, yy - 2.2, w * .62, yy + 2.6, w, yy); c.stroke(); }
    c.fillStyle = tint(shade(c1, -.2)); c.fillRect(0, y0, w, 1.1);
  }
  c.fillStyle = tint(shade(c1, -.07)); ell(c, w * .7, h * .27, 3.6, 1.5); ell(c, w * .22, h * .78, 2.6, 1.1);
}, { repeat: [1, 1] });
// red gingham bakery paper
const checkTex = c1 => tex('shop-check|' + c1, 64, 64, (c, w, h) => {
  c.fillStyle = '#fffaf2'; c.fillRect(0, 0, w, h);
  c.fillStyle = tint(shade(c1, .2)); c.fillRect(0, 0, w / 2, h); c.fillRect(0, 0, w, h / 2);
  c.fillStyle = tint(c1); c.fillRect(0, 0, w / 2, h / 2);
}, { repeat: [1, 1] });
// the drinks cooler's side wrap: a big bottle, a can and bubbles on the cooler colour
const coolerSideTex = c1 => tex('shop-coolerside|' + c1, 256, 512, (c, w, h) => {
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 16; k++) blob(c, (k * 47) % w, (k * 89) % h, 2 + (k % 4) * 2.2);
  // bottle
  c.fillStyle = '#ffffff'; rr(c, 22, 92, 50, 140, 14); c.fillRect(37, 58, 20, 40); c.fillStyle = '#ff5a4a'; rr(c, 34, 46, 26, 14, 3);
  c.fillStyle = '#e8302f'; c.fillRect(22, 140, 50, 40); txt(c, '콜라', 47, 161, 15, '#ffffff');
  c.fillStyle = '#7a3b2a'; rr(c, 28, 186, 38, 40, 9);
  // can
  c.fillStyle = '#4fc77a'; rr(c, 76, 150, 40, 70, 8); c.fillStyle = '#e0e6ef'; c.fillRect(76, 150, 40, 6); c.fillRect(76, 214, 40, 6);
  txt(c, '사이다', 96, 186, 10, '#ffffff');
  c.fillStyle = '#ffffff'; rr(c, 10, 14, w - 20, 26, 8); txt(c, 'COLD!', w / 2, 28, 18, tint(c1));
  txt(c, '시원해요~', w / 2, 238, 15, '#ffffff', { stroke: tint(shade(c1, -.25)), sw: 4 });
}, { text: true });
// the coin changer's side wrap: a big 500 coin and falling coins
const vendSideTex = c1 => tex('shop-vendside|' + c1, 256, 512, (c, w, h) => {
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h);
  c.fillStyle = tint(shade(c1, -.08)); for (let k = 0; k < 6; k++) c.fillRect(0, 30 + k * 40, w, 14);
  c.fillStyle = '#ffffff'; rr(c, 12, 12, w - 24, 34, 9); txt(c, '동전 교환', w / 2, 30, 18, '#33406a');
  coinDraw(c, 64, 112, 38);
  for (const [x, y, r] of [[30, 180, 13], [96, 196, 15], [52, 226, 11], [104, 238, 9]]) coinDraw(c, x, y, r, '#e4e8f0', '100');
}, { text: true });
const marbleTex = () => tex('shop-marble', 256, 256, (c, w, h) => {
  c.fillStyle = tint('#fbf8f3'); c.fillRect(0, 0, w, h);
  c.lineCap = 'round';
  const vein = (y0, a, lw, color) => { c.strokeStyle = tint(color); c.lineWidth = lw; c.beginPath(); c.moveTo(0, y0); c.bezierCurveTo(w * .3, y0 + a, w * .55, y0 - a * .8, w * .75, y0 + a * .5); c.quadraticCurveTo(w * .9, y0 + a * .2, w, y0); c.stroke(); };
  vein(26, 14, 1.4, '#d8d0c8'); vein(70, -18, .9, '#e2dbd3'); vein(96, 10, 1.8, '#d3cbc2'); vein(48, 22, .7, '#e6e0d9');
  c.fillStyle = tint('#efe9e2'); for (let k = 0; k < 14; k++) blob(c, (k * 53) % w, (k * 31) % h, .9);
}, { repeat: [1, 1] });
const tileTex = (face, grout) => tex('shop-tile|' + face + grout, 64, 64, (c, w, h) => {
  c.fillStyle = tint(grout); c.fillRect(0, 0, w, h);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    c.fillStyle = tint(face); roundRect(c, i * 16 + .8, j * 16 + .8, 14.4, 14.4, 1.6); c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(i * 16 + 3, j * 16 + 3, 5, 1.2);
  }
}, { repeat: [1, 1] });
const pegTex = c1 => tex('shop-peg|' + c1, 64, 64, (c, w, h) => {
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h);
  c.fillStyle = tint(shade(c1, -.24)); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) blob(c, 8 + i * 16, 8 + j * 16, 1.9);
}, { repeat: [1, 1] });
const perfTex = () => tex('shop-perf', 64, 64, (c, w, h) => {
  c.fillStyle = tint('#d3d9e4'); c.fillRect(0, 0, w, h);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = 5 + i * 11 + (j % 2) * 5.5, y = 5 + j * 11; c.fillStyle = tint('#7f879a'); blob(c, x, y, 1.7); c.fillStyle = tint('#f2f5fa'); blob(c, x + .9, y + 1.6, .7); }
}, { repeat: [1, 1] });
const speckTex = c1 => tex('shop-speck|' + c1, 128, 128, (c, w, h) => {
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h);
  let s = 11; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const C = [shade(c1, -.12), shade(c1, .08), '#ffffff', shade(c1, -.2)];
  for (let i = 0; i < 160; i++) { c.fillStyle = tint(C[i % 4]); blob(c, R() * w, R() * h, .5 + R() * .9); }
}, { repeat: [1, 1] });

// Big one-off prints
// the till front: the konbini stripes, the bear mascot, the shop name
const counterTex = () => tex('shop-counter', 768, 512, (c, w, h) => {
  c.fillStyle = '#fffdf8'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ff9a3c'; c.fillRect(0, 0, w, 26); c.fillStyle = '#ff5a4a'; c.fillRect(0, 26, w, 14); c.fillStyle = '#3f86d8'; c.fillRect(0, 40, w, 26);
  c.fillStyle = '#ffc23d'; blob(c, 78, 150, 50); bear(c, 78, 156, 32);
  txt(c, '몽글마트', 236, 128, 44, '#33406a');
  txt(c, '24', 340, 128, 40, '#ff5a4a');
  txt(c, '어서오세요!', 238, 182, 26, '#ff9a3c');
  c.fillStyle = '#ffc23d'; starPath(c, 356, 184, 8); c.fill(); starPath(c, 130, 92, 6); c.fill();
  c.fillStyle = '#3f86d8'; c.fillRect(0, h - 22, w, 8); c.fillStyle = '#ff9a3c'; c.fillRect(0, h - 14, w, 14);
}, { text: true });
// the ice-cream chest's side wrap
const iceTex = () => tex('shop-iceside', 512, 256, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#4fb3f0'); g.addColorStop(1, '#bfe9ff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffffff'; for (let k = 0; k < 14; k++) blob(c, k * 20, h + 2, 14);
  c.fillStyle = 'rgba(255,255,255,.8)'; for (const [x, y] of [[20, 20], [236, 28], [140, 14], [200, 70]]) { c.save(); c.translate(x, y); for (let k = 0; k < 3; k++) { c.rotate(PI / 3); c.fillRect(-6, -.8, 12, 1.6); } c.restore(); }
  const pop = (x, y, col, bite) => {
    c.fillStyle = '#e8bb82'; c.fillRect(x - 3, y + 26, 6, 18);
    c.fillStyle = col; rr(c, x - 13, y - 14, 26, 42, 12);
    if (bite) { c.fillStyle = '#7fcaf5'; blob(c, x + 12, y - 12, 6); }
    c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, x - 9, y - 8, 5, 24, 2.5);
  };
  pop(36, 72, '#ff6b7a', true); pop(72, 80, '#ffc23d', false); pop(214, 76, '#7fd6c0', true);
  c.fillStyle = '#e8a456'; c.beginPath(); c.moveTo(166, 116); c.lineTo(152, 70); c.lineTo(180, 70); c.closePath(); c.fill();
  c.strokeStyle = '#c97a3a'; c.lineWidth = 1; for (let k = 0; k < 4; k++) { line(c, [[154 + k * 6, 72], [166, 112]]); }
  c.fillStyle = '#fff4e2'; blob(c, 166, 62, 15); c.fillStyle = '#ff9fb5'; blob(c, 160, 48, 11); c.fillStyle = '#ff5a6e'; blob(c, 167, 38, 4);
  txt(c, '아이스크림', 128, 24, 26, '#ffffff', { stroke: '#2f86e0', sw: 5 });
  c.fillStyle = '#ff5a4a'; rr(c, 92, 92, 52, 22, 7); txt(c, '1+1', 118, 103.5, 15, '#ffffff');
}, { text: true });
// the coin changer's instruction panel
const coinTex = () => tex('shop-coinfront', 256, 320, (c, w, h) => {
  c.fillStyle = '#33406a'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ff5a4a'; rr(c, 4, 4, w - 8, 30, 6); txt(c, '동전교환기', w / 2, 20, 18, '#ffffff');
  c.fillStyle = '#ffffff'; rr(c, 8, 42, w - 16, 76, 8);
  txt(c, '지폐를 넣으면', w / 2, 54, 11, '#33406a');
  c.fillStyle = '#7fcf8f'; rr(c, 16, 66, 40, 22, 3); c.fillStyle = '#4ea85a'; blob(c, 36, 77, 6); txt(c, '1000', 36, 77.5, 6, '#ffffff');
  txt(c, '→', 66, 77, 16, '#ff5a4a');
  coinDraw(c, 89, 77, 10); coinDraw(c, 110, 77, 10);
  txt(c, '500원 동전 2개', w / 2, 104, 10, '#33406a');
  mochi(c, 30, 140, 12); txt(c, '세탁기용', 82, 140, 12, '#ffe27a');
  c.fillStyle = '#ffe27a'; c.fillRect(8, 156, w - 16, 3);
}, { text: true });
// the cup-noodle corner's poster
const ramenTex = () => tex('shop-ramenposter', 512, 256, (c, w, h) => {
  c.fillStyle = '#fff4e2'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#e8462f'; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8);
  c.fillStyle = '#e8462f'; c.fillRect(4, 4, w - 8, 30); txt(c, '컵라면 코너', w / 2, 20, 20, '#ffffff');
  cupDraw(c, 46, 112, 1.5, '#ffffff', '#e8462f'); cupDraw(c, 96, 114, 1.3, '#ffffff', '#ffd23f'); steamDraw(c, 46, 58, 1); steamDraw(c, 96, 66, .8);
  txt(c, '뜨거운 물 조심!', 176, 62, 15, '#e8462f');
  c.fillStyle = '#ffffff'; rr(c, 132, 78, 100, 40, 8); txt(c, '컵라면', 166, 92, 11, '#2a1d33'); txt(c, '1,300원', 166, 108, 12, '#e8462f');
  c.fillStyle = '#ffd23f'; starPath(c, 218, 98, 9); c.fill();
}, { text: true });
// the café chalkboard menu
const chalkTex = c1 => tex('shop-chalk|' + c1, 512, 320, (c, w, h) => {
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 0; k < 18; k++) ell(c, (k * 61) % w, (k * 37) % h, 18 + (k % 4) * 6, 8, k);
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.2; c.setLineDash([5, 4]); c.strokeRect(6, 6, w - 12, h - 12); c.setLineDash([]);
  txt(c, 'MENU', 74, 24, 20, '#ffe27a'); txt(c, '메뉴', 128, 25, 15, '#ffffff');
  const L = [['아메리카노', '3.0'], ['카페라떼', '3.5'], ['바닐라라떼', '4.0'], ['녹차라떼', '4.0']], R = [['딸기스무디', '4.5'], ['크루아상', '2.8'], ['메론빵', '2.5']];
  L.forEach(([a, b], k) => { txt(c, a, 14, 52 + k * 22, 11, '#ffffff', { align: 'left' }); txt(c, b, 116, 52 + k * 22, 11, '#ffb3c6', { align: 'right' }); });
  R.forEach(([a, b], k) => { txt(c, a, 140, 52 + k * 22, 11, '#ffffff', { align: 'left' }); txt(c, b, 244, 52 + k * 22, 11, '#bff0d8', { align: 'right' }); });
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(196, 130); c.lineTo(200, 150); c.lineTo(222, 150); c.lineTo(226, 130); c.closePath(); c.stroke();
  c.beginPath(); c.arc(229, 138, 5, -HP, HP); c.stroke(); steamDraw(c, 211, 126, .7, 'rgba(255,255,255,.8)');
  c.fillStyle = '#ffb3c6'; heartPath(c, 172, 136, 6); c.fill(); c.fillStyle = '#ffe27a'; starPath(c, 150, 142, 6); c.fill();
  txt(c, '오늘도 좋은 하루!', 70, 144, 10, '#bff0d8');
}, { text: true });
// a shop clock face
const clockTex = () => tex('shop-clock', 256, 256, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  for (let k = 0; k < 60; k++) { const a = k / 60 * PI * 2, big = k % 5 === 0; c.strokeStyle = '#2a1d33'; c.lineWidth = big ? 2 : .8; line(c, [[cx + Math.sin(a) * (big ? 52 : 56), cy - Math.cos(a) * (big ? 52 : 56)], [cx + Math.sin(a) * 60, cy - Math.cos(a) * 60]]); }
  for (let k = 1; k <= 12; k++) { const a = k / 12 * PI * 2; txt(c, String(k), cx + Math.sin(a) * 43, cy - Math.cos(a) * 43 + 1, k % 3 ? 10 : 13, k % 3 ? '#2a1d33' : '#ff5a4a'); }
  txt(c, '몽글', cx, cy + 22, 9, '#ff5a4a');
}, { text: true });

const B = {};

// ═════════════════════════════════════════════ 편의점 안 ═════════════════════════════════════════════
// 과자 진열대 (2×1): a double-sided konbini gondola — a pegboard spine, mint end panels, three white shelves a side with
// printed price strips, packed with chip bags, boxes and cup noodles; a 과자·스낵 header sign on top. Things hide in the
// gaps between the packs (one on the far side).
B.snackshelf = (f, T) => {
  const body = col(T, 'body'), acc = col(T, 'accent'), tk = [body, acc].join(',');
  const W = 1.76, HX = .84, SP = .02, SD = .34, TOP = 1.18, S = [.125, .47, .815], PZ = .29;
  // [kind, x, art] per shelf; front rows leave the hiding gaps
  const ROWS = [
    { sz: 1, y: S[0], list: [['bag', -.74, 0], ['bag', -.17, 0], ['bag', .0, 1], ['bag', .17, 1], ['box', .34, 9], ['box', .51, 9], ['bag', .69, 8]] },
    { sz: 1, y: S[1], list: [['box', -.75, 2], ['box', -.59, 2], ['box', -.43, 4], ['bag', -.26, 5], ['bag', -.09, 5], ['bag', .08, 6], ['box', .72, 3]] },
    { sz: 1, y: S[2], list: [['cup', -.76, 0], ['cup', -.62, 0], ['cup', -.48, 1], ['cup', -.34, 1], ['box', -.18, 7], ['box', -.02, 7], ['box', .5, 3], ['box', .67, 4]] },
    { sz: -1, y: S[0], list: [['bag', -.72, 6], ['bag', -.55, 6], ['bag', -.38, 8], ['bag', -.21, 8], ['box', .31, 9], ['box', .48, 9], ['box', .66, 2]] },
    { sz: -1, y: S[1], list: [['box', -.73, 4], ['box', .0, 4], ['bag', .17, 5], ['bag', .34, 1], ['bag', .51, 1], ['box', .69, 3]] },
    { sz: -1, y: S[2], list: [['cup', -.75, 1], ['cup', -.61, 1], ['cup', -.47, 0], ['bag', .04, 5], ['bag', .21, 6], ['box', .39, 4], ['box', .56, 9], ['box', .72, 3]] },
  ];
  const packM = (r, x, i, k) => xf(x, r.y, r.sz * PZ, 0, r.sz < 0 ? PI : 0, (k % 3 - 1) * .035);
  f.add(mg('snackshelf-spine|' + body, mat('#ffffff', { map: pegTex(body) }), ({ addM }) => addM(planarUV(ni(G.pbox(HX * 2, TOP - .1, .04)).translate(0, (TOP + .1) / 2, 0), .12), I4)));
  f.add(mc('snackshelf|' + tk, ({ add, addM }) => {
    add(G.box(W - .06, .1, .7, .012), shade(acc, -.08), 0, .05, 0);
    for (const sx of [-1, 1]) add(G.box(.04, TOP + .05, .74, .012), acc, sx * (HX + .02), (TOP + .05) / 2, 0);
    add(G.box(W - .02, .03, .12, .01), acc, 0, TOP + .015, 0);
    for (const sz of [-1, 1]) for (const y of S) {
      add(G.pbox(HX * 2, .025, SD), body, 0, y - .0125, sz * (SP + SD / 2));
      add(G.pbox(HX * 2, .057, .012), body, 0, y - .0165, sz * (SP + SD + .006));
    }
    for (const sx of [-1, 1]) add(G.box(.03, .06, .03, .006), STEEL2, sx * .4, TOP + .06, 0);
    add(G.box(1.04, .21, .03, .01), WHITE, 0, TOP + .195, 0);
    for (const r of ROWS) r.list.forEach(([kind, x, i], k) => {
      const M = packM(r, x, i, k);
      if (kind === 'bag') {
        addM(G.box(.15, .21, .075, .026), M.clone().multiply(xf(0, .105, 0)), SNACK_BODY[i]);
        for (const dy of [-.101, .109]) addM(G.pbox(.158, .022, .044), M.clone().multiply(xf(0, .105 + dy, 0)), shade(SNACK_BODY[i], -.12));
      } else if (kind === 'box') addM(G.box(.14, .19, .065, .008), M.clone().multiply(xf(0, .095, 0)), SNACK_BODY[i]);
      else {
        addM(G.cyl(.058, .046, .1, 12), M.clone().multiply(xf(0, .05, 0)), WHITE);
        addM(G.cyl(.061, .061, .008, 12), M.clone().multiply(xf(0, .104, 0)), i ? '#ffd23f' : TOMATO);
        addM(G.box(.03, .004, .025, .002), M.clone().multiply(xf(.04, .11, .035, 0, .6, 0)), WHITE);
      }
    });
  }));
  f.add(mg('snackshelf-prints', atlasMat(), ({ add, addM }) => {
    for (const sx of [-1, 1]) add(quadGeo(.44, .55, RG.endcap), sx * (HX + .04 + .006), .74, 0, 0, sx * HP, 0);
    for (const sz of [-1, 1]) S.forEach((y, k) => { for (const sx of [-1, 1]) add(quadGeo(.82, .034, (k + (sz > 0 ? 0 : 1)) % 2 ? RG.price2 : RG.price), sx * .415, y - .012, sz * (SP + SD + .012 + .006), 0, sz < 0 ? PI : 0, 0); });
    for (const sz of [-1, 1]) add(quadGeo(1.0, .19, RG.snackhdr), 0, TOP + .195, sz * (.015 + .006), 0, sz < 0 ? PI : 0, 0);
    for (const r of ROWS) r.list.forEach(([kind, x, i], k) => {
      const M = packM(r, x, i, k);
      if (kind === 'bag') addM(quadGeo(.122, .162, SN(i)), M.clone().multiply(xf(0, .105, .0375 + .006)));
      else if (kind === 'box') addM(quadGeo(.122, .163, SN(i)), M.clone().multiply(xf(0, .095, .0325 + .006)));
      else addM(taperBand(.0605, .0545, .05, NOO(i), 2.4), M.clone().multiply(xf(0, .05, 0)));
    });
    // 1+1 / 2+1 shelf talkers clipped to the price strips
    for (const [x, y, sz, i] of [[-.6, S[1], 1, 0], [.62, S[2], 1, 1], [.3, S[0], -1, 0]]) add(quadGeo(.09, .09, TAG(i)), x, y - .06, sz * (SP + SD + .012 + .012), 0, sz < 0 ? PI : 0, .1);
  }));
  f.spot('behind', null, -.45, S[0], .24, { maxH: .3, label: '과자 진열대 아래칸', scale: .8 });
  f.spot('behind', null, .38, S[1], .24, { maxH: .3, label: '과자 봉지 사이', scale: .8 });
  f.spot('behind', null, -.36, S[1], -.24, { maxH: .3, label: '진열대 뒤편', scale: .8 });
  // (레벨 보고서 10/18: the konbini had 3 places in plain sight — three gaps on the shelves, front and back)
  f.spot('on', null, .235, S[2], .25, { maxH: .3, label: '과자 진열대 맨 윗칸', scale: .8 });
  f.spot('on', null, .045, S[0], -.25, { maxH: .3, label: '진열대 뒤편 아랫칸', scale: .8 });
  f.spot('on', null, -.225, S[2], -.25, { maxH: .3, label: '진열대 뒤편 맨 윗칸', scale: .8 });
};

// 음료 냉장고 (2×1, tall): a blue walk-up drinks cooler — a glowing 시원한 음료 header, two glass doors (they open together)
// with pull stickers, a lit back wall and four shelves of cola, cider, banana milk, tea, juice, water and cans.
B.drinkfridge = (f, T) => {
  const cool = col(T, 'cooler'), tk = [cool].join(',');
  const W = 1.84, HW = W / 2, D = .7, z0 = -.14, back = z0 - D / 2, fz = z0 + D / 2, y0 = .09, CT = 1.74, HT = 1.98;
  const SY = [y0 + .03, .53, .93, 1.33], frame = '#eef3f8', BZ = z0 + .02;
  const LIQ = ['#7a3b2a', '#bdf0c4', '#ffe27a', '#c9d96a', '#ffab4c', '#d6f1ff', '#8a5a3c', '#eef8ff'];
  const CAPS = [TOMATO, LEAF2, '#6cc46a', LEAF, ORANGE, SKY, '#6b3f2a', '#3f86d8'];
  // [shelf, x, kind, art]; kinds: big (1.5 l), pet (500 ml), can, milk
  const B2 = [];
  for (let k = 0; k < 6; k++) { const x = -.78 + k * .13; B2.push([0, x, 'big', [0, 1, 5, 0, 4, 1][k]]); if (Math.abs(-x - .5) > .2) B2.push([0, -x, 'big', [5, 0, 7, 4, 1, 5][k]]); }
  for (let k = 0; k < 8; k++) { const x = -.8 + k * .095; if (x < -.46 || x > -.15) B2.push([1, x, 'pet', [3, 3, 7, 7, 4, 4, 5, 5][k]]); B2.push([1, -x, 'pet', [1, 1, 0, 0, 6, 6, 3, 3][k]]); }
  for (let k = 0; k < 9; k++) { const x = -.8 + k * .085; B2.push([2, x, 'can', [0, 0, 1, 1, 6, 6, 7, 7, 4][k]]); B2.push([2, -x, 'can', [4, 6, 6, 0, 0, 1, 1, 7, 7][k]]); }
  for (let k = 0; k < 7; k++) { const x = -.79 + k * .11; B2.push([3, x, 'milk', 2]); B2.push([3, -x, 'pet', [6, 6, 3, 3, 1, 1, 0][k]]); }
  const H = { big: .32, pet: .23, can: .13, milk: .13 }, Rr = { big: .052, pet: .035, can: .031, milk: .042 };
  f.add(mc('drinkfridge|' + tk, ({ add }) => {
    add(G.box(W - .06, y0, D - .06, .01), CHAR, 0, y0 / 2, z0 - .02);
    for (const y of [.025, .045, .065]) add(G.pbox(W - .4, .01, .006), STEEL2, 0, y, z0 - .02 + (D - .06) / 2 + .009);
    for (const sx of [-1, 1]) add(G.box(.05, HT, D, .015), cool, sx * (HW - .025), HT / 2, z0);
    add(G.box(W - .1, HT - y0, .04, .012), cool, 0, (y0 + HT) / 2, back + .02);
    add(G.pbox(W - .1, .03, D - .07), ICE, 0, y0 + .015, (back + .04 + fz - .03) / 2);
    add(G.box(W - .1, .04, D, .012), cool, 0, CT - .02, z0);
    add(G.box(W + .02, HT - CT, D + .04, .02), cool, 0, (CT + HT) / 2, z0 + .02);
    add(G.box(.05, CT - .04 - y0, .04, .01), cool, 0, (y0 + CT - .04) / 2, fz - .02);
    for (const sx of [-1, 1]) add(G.pbox(.006, CT - .04 - y0 - .03, D - .1), ICE, sx * (HW - .053), (y0 + .03 + CT - .04) / 2, z0 - .02);
    for (let k = 1; k < 4; k++) for (const sx of [-1, 1]) {
      add(G.pbox(.84, .02, D - .14), '#d6e4ee', sx * .445, SY[k] - .01, z0 - .02);
      add(G.pbox(.84, .04, .012), WHITE, sx * .445, SY[k] - .012, z0 - .02 + (D - .14) / 2 + .006);
    }
    // header bubbles either side of the sign
    for (const sx of [-1, 1]) for (const [dx, dy, r] of [[.72, .04, .03], [.82, -.04, .022], [.86, .06, .016]]) add(G.sph(r, 8, 6), WHITE, sx * dx, (CT + HT) / 2 + dy, z0 + .02 + (D + .04) / 2 + .002, 0, 0, 0, [1, 1, .4]);
    for (const [s, x, kind, i] of B2) {
      const y = SY[s], h = H[kind], r = Rr[kind], liq = LIQ[i];
      if (kind === 'can') { add(G.cyl(r, r, h, 10), DRINKS[i][1], x, y + h / 2, BZ); add(G.cyl(r * .86, r, .008, 10), SILVER, x, y + h + .004, BZ); }
      else if (kind === 'milk') { add(G.sph(r, 10, 8), '#fff0b8', x, y + r * 1.05, BZ, 0, 0, 0, [1, 1.15, 1]); add(G.cyl(r * .55, r * .6, .03, 10), '#fff0b8', x, y + r * 2.1 + .01, BZ); add(G.cyl(r * .62, r * .62, .016, 10), '#6cc46a', x, y + r * 2.1 + .033, BZ); }
      else {
        add(G.cyl(r, r, h * .66, 9), liq, x, y + h * .33, BZ);
        add(G.cyl(r * .45, r, h * .16, 9), liq, x, y + h * .74, BZ);
        add(G.cyl(r * .42, r * .42, h * .12, 8), shade(liq, .08), x, y + h * .88, BZ);
        add(G.cyl(r * .5, r * .5, h * .06, 8), CAPS[i], x, y + h * .97, BZ);
      }
    }
  }));
  f.add(mg('drinkfridge-lit', litMat(), ({ add }) => add(new THREE.PlaneGeometry(W - .1, CT - .04 - y0 - .03), 0, (y0 + .03 + CT - .04) / 2, back + .04 + .006)));
  f.add(mg('drinkfridge-sign', signMat(), ({ add }) => add(quadGeo(1.2, .225, RG.cold), 0, (CT + HT) / 2, z0 + .02 + (D + .04) / 2 + .006)));
  f.add(mg('drinkfridge-side|' + cool, mat('#ffffff', { map: coolerSideTex(cool) }), ({ add }) => { for (const sx of [-1, 1]) add(new THREE.PlaneGeometry(.56, 1.12), sx * (HW + .006), .98, z0, 0, sx * HP, 0); }));
  f.add(mg('drinkfridge-labels', atlasMat(), ({ add }) => {
    for (let k = 1; k < 4; k++) for (const sx of [-1, 1]) add(quadGeo(.82, .034, (k + (sx > 0 ? 1 : 0)) % 2 ? RG.price2 : RG.price), sx * .445, SY[k] - .012, z0 - .02 + (D - .14) / 2 + .012 + .006);
    for (const [s, x, kind, i] of B2) {
      const y = SY[s], h = H[kind], r = Rr[kind];
      if (kind === 'can') add(bandGeo(r + .006, h * .7, DR(i), 2.6), x, y + h * .5, BZ);
      else if (kind === 'milk') add(bandGeo(r * 1.0 + .008, .03, DR(2), 2.2, 8), x, y + r * 1.0, BZ);
      else add(bandGeo(r + .006, h * .26, DR(i), 2.4), x, y + h * .36, BZ);
    }
  }));
  const DW = HW - .02, DH = CT - y0 - .04;
  const door = sx => {   // sx = -1: the left door (hinge on the left edge), +1: the right one
    const pv = new THREE.Group(); put3(pv, sx * (HW - .005), y0 + .02 + DH / 2, fz + .025);
    const cx = -sx * DW / 2, hx = -sx * (DW - .03);
    pv.add(mc('drinkfridge-door' + sx + '|' + tk, ({ add }) => {
      add(G.box(DW, .08, .04, .012), frame, cx, DH / 2 - .04, 0);
      add(G.box(DW, .12, .04, .012), frame, cx, -DH / 2 + .06, 0);
      for (const k of [-1, 1]) add(G.box(.06, DH, .04, .012), frame, cx + k * (DW / 2 - .03), 0, 0);
      add(G.box(.03, .62, .03, .012), STEEL2, hx, .08, .055);
      for (const dy of [-.18, .34]) add(G.box(.024, .024, .04, .006), STEEL2, hx, dy, .035);
    }));
    pv.add(transparent(mg('drinkfridge-glass' + sx, glassMat(), ({ add }) => add(new THREE.PlaneGeometry(DW - .1, DH - .16), cx, .02, 0))));
    pv.add(mg('drinkfridge-stickers' + sx, atlasMat(), ({ add }) => {
      add(quadGeo(.16, .06, RG.pull), -sx * (DW - .16), .5, .006);
      add(quadGeo(.13, .13, TAG(sx > 0 ? 1 : 0)), cx + sx * .2, .62, .006, 0, 0, sx * .12);
    }));
    f.add(pv); return pv;
  };
  const L = door(-1), R = door(1);
  const p = f.part('door', [L, R], t => { L.rotation.y = -1.75 * t; R.rotation.y = 1.75 * t; }, { label: '음료 냉장고', sfx: 'open', dur: .32 });
  f.spot('inside', null, -.3, SY[1], BZ, { part: p, maxH: .34, label: '음료 냉장고 둘째 칸', scale: .8 });
  f.spot('inside', null, .5, SY[0], BZ, { part: p, maxH: .36, label: '음료 냉장고 아래칸', scale: .85 });
  f.spot('on', null, .45, HT, z0, { maxH: .4, label: '음료 냉장고 위', scale: .8 });   // (레벨 보고서 10/18)
};

// 계산대 (2×1): the till counter — the konbini front print with the bear mascot, a wood-grain top with a POS screen,
// a customer display, a barcode scanner, a receipt printer and a 호빵 steamer whose lid lifts; shopping baskets and a
// gap in the open bay under the right end; a lottery sign.
B.counter2 = (f, T) => {
  const body = col(T, 'body'), wood = col(T, 'wood'), acc2 = col(T, 'accent2'), tk = [body, wood, acc2].join(',');
  const HW = .92, z0 = -.1, D = .62, fz = z0 + D / 2, back = z0 - D / 2, CH = .9, TY = .95, BX = .36, BY = .48;
  const inner = shade(body, -.1), SX = .56, SZ = -.1, SW = .44, SD = .36, SH = .3, SM = xf(-.56, TY + .3, -.2, -.38, 0, 0);
  f.add(mc('counter2|' + tk, ({ add, addM, tube }) => {
    add(G.box(2 * HW - .04, .05, D - .04, .01), CHAR, 0, .025, z0 - .01);
    add(G.box(HW + BX, CH - .05, D, .015), body, (-HW + BX) / 2, .05 + (CH - .05) / 2, z0);
    add(G.box(HW - BX, CH - BY, D, .015), body, (BX + HW) / 2, BY + (CH - BY) / 2, z0);
    add(G.box(.04, BY - .05, D, .01), body, HW - .02, .05 + (BY - .05) / 2, z0);
    add(G.pbox(HW - BX - .04, .02, D - .04), inner, (BX + HW - .04) / 2, .06, z0 - .02);
    add(G.pbox(HW - BX - .04, BY - .07, .03), inner, (BX + HW - .04) / 2, (.07 + BY) / 2, back + .015);
    // shopping baskets in the bay (two nested: the upper one's rim shows)
    const bx = .48, bw = .22, bd = .32, bh = .16, bb = .07, bz = z0 - .05, red = RED;
    for (const sz of [-1, 1]) add(G.pbox(bw, bh, .012), red, bx, bb + bh / 2, bz + sz * (bd / 2 - .006));
    for (const sx of [-1, 1]) add(G.pbox(.012, bh, bd - .024), red, bx + sx * (bw / 2 - .006), bb + bh / 2, bz);
    add(G.pbox(bw - .024, .012, bd - .024), shade(red, -.12), bx, bb + .006, bz);
    add(G.box(bw + .016, .024, bd + .016, .008), shade(red, .06), bx, bb + bh + .03, bz);
    for (let k = 0; k < 4; k++) add(G.pbox(.024, .07, .006), shade(red, -.3), bx - .072 + k * .048, bb + .08, bz + bd / 2 + .006);
    for (const sx of [-1, 1]) add(G.tor(.06, .009, PI, 4, 10), WHITE, bx + sx * (bw / 2 + .012), bb + bh + .04, bz, 0, HP, 0);
    // POS: cash drawer base, keys, neck, screen
    add(G.box(.4, .1, .34, .015), '#4a4560', -.56, TY + .05, -.12);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) add(G.box(.045, .014, .032, .004), r === 0 ? [MINT, MUSTARD, TOMATO, SKY][k] : '#d9d6e6', -.65 + k * .06, TY + .1 + .007, -.04 + r * .04 - .04);
    add(G.box(.05, .16, .05, .01), CHAR, -.56, TY + .18, -.24);
    addM(G.box(.38, .25, .035, .015), SM, CHAR);
    // customer display on a little pole, barcode scanner in its cradle
    tube([-.24, TY, -.02], [-.24, TY + .17, -.02], .012, STEEL2, 8);
    add(G.box(.17, .075, .035, .01), CHAR, -.24, TY + .2, -.02);
    add(G.box(.09, .05, .1, .012), CHAR, -.84, TY + .025, .02);
    add(G.box(.06, .05, .12, .015), DARK, -.84, TY + .08, .02, .5, 0, 0);
    add(G.pbox(.04, .006, .03), TOMATO, -.84, TY + .08 + .022, .02 + .05, .5, 0, 0);
    // receipt printer with a receipt curling out
    add(G.box(.15, .11, .2, .02), '#e9ecf3', -.18, TY + .055, -.14);
    add(G.pbox(.152, .008, .09), '#c9cfe0', -.18, TY + .114, -.18);
    add(G.pbox(.09, .004, .006), INK, -.18, TY + .112, -.07);
    add(G.pbox(.08, .1, .003), WHITE, -.18, TY + .16, -.075, -.25, 0, 0);
    add(G.pbox(.08, .08, .003), WHITE, -.18, TY + .2, -.05, -1.05, 0, 0);
    // 호빵 steamer: steel base, fogged walls, a tray of buns (the hiding gap at the front right)
    add(G.box(SW, .05, SD, .012), STEEL, SX, TY + .025, SZ);
    for (const sz of [-1, 1]) add(G.pbox(SW, SH - .05, .015), sz > 0 ? '#e3f1f7' : STEEL, SX, TY + .05 + (SH - .05) / 2, SZ + sz * (SD / 2 - .0075));
    for (const sx of [-1, 1]) add(G.pbox(.015, SH - .05, SD - .03), '#e3f1f7', SX + sx * (SW / 2 - .0075), TY + .05 + (SH - .05) / 2, SZ);
    add(G.pbox(SW - .04, .01, SD - .04), STEEL2, SX, TY + .07, SZ);
    for (const [dx, dz, c] of [[-.12, -.08, '#fff6e6'], [0, -.08, '#ffd27a'], [.12, -.08, '#f2d0b0'], [-.12, .07, '#fff6e6']]) {
      add(G.sph(.055, 12, 8), c, SX + dx, TY + .075 + .03, SZ + dz, 0, 0, 0, [1, .66, 1]);
      add(G.sph(.012, 6, 4), c === '#ffd27a' ? '#c97a3a' : (c === '#f2d0b0' ? '#8a4a3a' : '#e8a456'), SX + dx, TY + .075 + .065, SZ + dz, 0, 0, 0, [1, .5, 1]);
    }
  }));
  f.add(mg('counter2-top|' + wood, mat('#ffffff', { map: woodTex(wood) }), ({ addM }) => addM(planarUV(ni(G.box(2 * HW + .04, .05, D + .06, .012)).translate(0, CH + .025, z0 + .02), .5), I4)));
  f.add(mg('counter2-front', mat('#ffffff', { map: counterTex() }), ({ add }) => add(new THREE.PlaneGeometry(1.2, .8), (-HW + BX) / 2, .47, fz + .006)));
  f.add(mg('counter2-screens', screenMat(), ({ add, addM }) => {
    addM(quadGeo(.34, .22, RG.pos), SM.clone().multiply(xf(0, 0, .0175 + .006)));
    add(quadGeo(.15, .056, RG.cdisp), -.24, TY + .2, -.02 + .0175 + .006);
  }));
  f.add(mg('counter2-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.36, .225, RG.lotsign), (BX + HW) / 2, .69, fz + .006);
    add(quadGeo(.4, .24, RG.steam), SX, TY + .05 + (SH - .05) / 2, SZ + SD / 2 + .006);
    add(quadGeo(.1, .1, TAG(0)), BX + .09, .8, fz + .012, 0, 0, -.15);
  }));
  // the steamer lid (its own mesh): hinged at the back, it lifts up
  const lid = new THREE.Group(); put3(lid, SX, TY + SH, SZ - SD / 2);
  lid.add(mc('counter2-lid', ({ add }) => {
    add(G.box(SW + .02, .035, SD + .02, .012), STEEL, 0, .0175, SD / 2);
    add(G.box(.14, .025, .035, .01), DARK, 0, .045, SD / 2 + .1);
    add(G.box(.13, .03, .02, .006), RED, 0, .0175, SD + .012);
  }));
  f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.5 * t; }, { label: '호빵 찜기', sfx: 'open', dur: .3 });
  f.spot('inside', null, SX + .09, TY + .075, SZ + .07, { part: p, maxH: .2, label: '호빵 찜기 안', scale: .62 });
  f.spot('on', null, .08, TY, .05, { maxH: .45, label: '계산대 위', scale: .8 });
  f.spot('under', null, .72, .07, .06, { maxH: .36, label: '계산대 밑', scale: .8 });
  // (레벨 보고서 10/18) the counter's front edge, and 돈통: a cash drawer under the top on the cashier side (the back), its own mesh,
  // with a code lock on its face — the konbini had no lockable piece, so no chain could end here
  f.spot('on', null, -.62, TY, .17, { maxH: .4, label: '계산대 앞쪽', scale: .75 });
  const dv = new THREE.Group(); put3(dv, -.5, .74, back - .003); dv.rotation.y = PI;   // turned round: its face looks out of the back
  dv.add(mc('counter2-till|' + tk, ({ add }) => {
    add(G.box(.46, .2, .03, .012), body, 0, 0, 0);
    add(G.box(.16, .03, .03, .01), STEEL2, 0, .045, .025);
    add(G.pbox(.42, .012, .36), inner, 0, -.09, -.19);
    for (const sx of [-1, 1]) add(G.pbox(.012, .12, .36), inner, sx * .205, -.04, -.19);
    add(G.pbox(.42, .12, .012), inner, 0, -.04, -.37);
    for (let k = 0; k < 4; k++) add(G.pbox(.085, .02, .11), k % 2 ? GOLD : SILVER, -.15 + k * .1, -.075, -.08);   // coin trays
  }));
  f.add(dv);
  const tp = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z - .32 * t; }, { label: '계산대 돈통', sfx: 'drawer', dur: .26 });
  tp.lockable = true; tp.lockKind = 'code'; tp.noHide = true; f.lockAt = { x: .12, y: -.03, z: .03, parent: dv };   // noHide: a friend never hides in a till
  f.spot('inside', dv, -.05, -.084, -.24, { part: tp, maxH: .13, label: '계산대 돈통 안', scale: .7 });
};

// 아이스크림 냉동고 (1×1): a white chest freezer wrapped in a printed ice-cream decal (popsicles, a cone, 1+1), steel rims
// and two sliding glass lids; under them soda / strawberry bars, cones and tubs. The right lid slides over the left one.
B.icecreamchest = (f, T) => {
  const body = col(T, 'body'), acc2 = col(T, 'accent2'), tk = [body, acc2].join(',');
  const W = .92, D = .64, z0 = -.04, fz = z0 + D / 2, H = .78, t = .05, FB = .58, PW = W / 2 + .03, PD = D - .02;
  const WR = [[-.31, -.21, 0], [-.13, -.21, 1], [-.31, -.08, 1], [-.13, -.08, 0], [-.31, .05, 0], [-.13, .05, 1], [-.31, .17, 1], [-.13, .17, 0]];
  f.add(mc('icecreamchest|' + tk, ({ add }) => {
    add(G.box(W - .04, .06, D - .04, .01), CHAR, 0, .03, z0);
    for (const sz of [-1, 1]) add(G.box(W, H - .06, t, .015), body, 0, .06 + (H - .06) / 2, z0 + sz * (D / 2 - t / 2));
    for (const sx of [-1, 1]) add(G.box(t, H - .06, D - 2 * t, .015), body, sx * (W / 2 - t / 2), .06 + (H - .06) / 2, z0);
    add(G.pbox(W - 2 * t, .02, D - 2 * t), ICE, 0, FB - .01, z0);
    for (const sz of [-1, 1]) add(G.pbox(W - 2 * t, H - FB, .006), ICE, 0, (FB + H) / 2, z0 + sz * (D / 2 - t - .003));
    for (const sx of [-1, 1]) add(G.pbox(.006, H - FB, D - 2 * t - .012), ICE, sx * (W / 2 - t - .003), (FB + H) / 2, z0);
    for (const sz of [-1, 1]) add(G.box(W + .02, .03, .06, .008), STEEL2, 0, H + .015, z0 + sz * (D / 2 - .02));
    for (const sx of [-1, 1]) add(G.box(.06, .03, D - .1, .008), STEEL2, sx * (W / 2 - .02), H + .015, z0);
    for (const sz of [-1, 1]) add(G.pbox(W / 2 - .05, .026, .016), STEEL, W / 4 + .02, H + .043, z0 + sz * (PD / 2 - .015));   // the upper track (right half)
    // ice-bar wrappers (left), cones in a tray and two tubs (right)
    for (const [x, z, i] of WR) add(G.box(.16, .026, .1, .008), i ? '#ff6b7a' : '#5fb8f0', x, FB + .013, z0 + z, 0, (x + z) * .3, 0);
    for (const [x, z, i] of WR.slice(0, 4)) add(G.box(.16, .026, .1, .008), i ? '#ff6b7a' : '#5fb8f0', x + .03, FB + .039, z0 + z + .02, 0, -(x + z) * .2, 0);
    add(G.box(.36, .05, .11, .008), KRAFT, .2, FB + .025, z0 - .22);
    for (let k = 0; k < 3; k++) { const x = .09 + k * .11; add(G.cone(.042, .14, 10), '#e8b46a', x, FB + .07, z0 - .22, PI, 0, 0); add(G.cyl(.045, .045, .012, 12), '#6b3f2a', x, FB + .146, z0 - .22); }
    for (const x of [.08, .32]) { add(G.cyl(.065, .055, .08, 14), WHITE, x, FB + .04, z0 - .07); add(G.cyl(.068, .068, .012, 14), MINT, x, FB + .086, z0 - .07); }
    add(G.box(.2, .03, .12, .01), '#ffc23d', .3, FB + .015, z0 + .14, 0, -.3, 0);
  }));
  f.add(mg('icecreamchest-wrap', mat('#ffffff', { map: iceTex() }), ({ add }) => {
    add(new THREE.PlaneGeometry(.8, .4), 0, .43, fz + .006);
    for (const sx of [-1, 1]) add(new THREE.PlaneGeometry(.52, .26), sx * (W / 2 + .006), .45, z0, 0, sx * HP, 0);
  }));
  f.add(mg('icecreamchest-prints', atlasMat(), ({ add }) => {
    for (const [x, z, i] of WR) add(quadGeo(.15, .09, ICEP(i)), x, FB + .026 + .006, z0 + z, -HP, 0, (x + z) * .3);
    for (const [x, z, i] of WR.slice(0, 4)) add(quadGeo(.15, .09, ICEP(i)), x + .03, FB + .052 + .006, z0 + z + .02, -HP, 0, -(x + z) * .2);
    for (let k = 0; k < 3; k++) add(cellUV(new THREE.CircleGeometry(.04, 14), ICEP(2)), .09 + k * .11, FB + .152 + .006, z0 - .22, -HP, 0, 0);
    for (const x of [.08, .32]) add(cellUV(new THREE.CircleGeometry(.062, 16), ICEP(3)), x, FB + .092 + .006, z0 - .07, -HP, 0, 0);
    add(quadGeo(.18, .1, ICEP(0)), .3, FB + .03 + .006, z0 + .14, -HP, 0, -.3);
  }));
  const pane = (key, handleX) => {
    const g = new THREE.Group();
    g.add(mc('icecreamchest-pane' + key + '|' + acc2, ({ add }) => {
      for (const sz of [-1, 1]) add(G.box(PW, .02, .03, .008), '#f2f6fb', 0, 0, sz * (PD / 2 - .015));
      for (const sx of [-1, 1]) add(G.box(.03, .02, PD - .06, .008), '#f2f6fb', sx * (PW / 2 - .015), 0, 0);
      add(G.box(.035, .02, .2, .008), acc2, handleX, .018, 0);
    }));
    g.add(transparent(mg('icecreamchest-glass' + key, glassMat(), ({ add }) => add(new THREE.PlaneGeometry(PW - .04, PD - .04), 0, 0, 0, -HP, 0, 0))));
    f.add(g); return g;
  };
  const left = pane('L', -PW / 2 + .07); put3(left, -(W / 2 - PW / 2), H + .04, z0);
  const right = pane('R', -PW / 2 + .06); put3(right, W / 2 - PW / 2, H + .066, z0);
  const p = f.part('slide', right, (tt, b) => { right.position.x = b.p.x - .42 * tt; }, { label: '아이스크림 냉동고', sfx: 'drawer', dur: .3 });
  f.spot('inside', null, .1, FB, z0 + .12, { part: p, maxH: .21, label: '아이스크림 냉동고 안', scale: .7 });
};

// 잡지 꽂이 (1×1): a stepped wooden magazine rack — three slanted tiers of magazine covers (a mochi cover, cooking, games,
// travel), a newspaper shelf at the bottom and a 잡지·신문 sign on top. The gap behind it hides things.
B.magazinerack = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [wood, woodD].join(',');
  const HX = .42, a = .36, TI = [[.3, .27], [.6, .17], [.9, .07]];
  const M = k => xf(0, TI[k][0], TI[k][1], -a, 0, 0);
  const side = new THREE.Shape(); side.moveTo(-.22, 0); side.lineTo(.35, 0); side.lineTo(.35, .3); side.lineTo(.06, 1.24); side.lineTo(-.22, 1.24); side.lineTo(-.22, 0);
  const NP = [[-.22, .1, .1, .08], [-.2, .12, .12, -.1], [-.24, .14, .14, .15]];   // [x, y, z, turn] of the newspaper pile
  f.add(mg('magazinerack-sides|' + wood, mat('#ffffff', { map: woodTex(wood) }), ({ addM }) => {
    for (const x of [-HX, HX + .035]) addM(planarUV(G.ext(side, .035, 0, 2).applyMatrix4(xf(x, 0, 0, 0, -HP, 0)), .5), I4);
  }));
  f.add(mc('magazinerack|' + tk, ({ add, addM }) => {
    add(G.box(2 * HX, 1.2, .025, .008), shade(wood, -.06), 0, .62, -.205);
    add(G.box(2 * HX, .075, .5, .01), woodD, 0, .0375, .07);
    add(G.pbox(2 * HX, .025, .52), woodD, 0, .0875, .07);
    add(G.box(2 * HX, .1, .025, .008), wood, 0, .15, .32);
    for (let k = 0; k < 3; k++) {
      addM(G.box(2 * HX, .34, .02, .006), M(k).multiply(xf(0, .17, -.01)), shade(wood, -.12));
      addM(G.box(2 * HX, .025, .07, .006), M(k).multiply(xf(0, .0125, .03)), woodD);
      addM(G.box(2 * HX, .05, .015, .005), M(k).multiply(xf(0, .03, .0725)), wood);
      for (let j = 0; j < 4; j++) addM(G.box(.19, .26, .008, .003), M(k).multiply(xf(-.315 + j * .21, .155, .01, 0, 0, (j - 1.5) * .02)), WHITE);
    }
    for (const [x, y, z, r] of NP) add(G.box(.3, .02, .22, .006), '#f3f0e8', x, y + .01, z, 0, r, 0);
    add(G.box(.62, .15, .02, .006), WHITE, 0, 1.295, -.205);
  }));
  f.add(mg('magazinerack-prints', atlasMat(), ({ add, addM }) => {
    for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) addM(quadGeo(.17, .22, MAG((k + j * 3) % 4)), M(k).multiply(xf(-.315 + j * .21, .155, .014 + .006, 0, 0, (j - 1.5) * .02)));
    const [x, y, z, r] = NP[2]; add(quadGeo(.28, .19, RG.news), x, y + .02 + .006, z, -HP, 0, r);
    add(quadGeo(.58, .13, RG.maghdr), 0, 1.295, -.195 + .006);
  }));
  f.spot('behind', null, .08, 0, -.36, { maxH: .45, label: '잡지 꽂이 뒤', scale: .8 });
  f.spot('under', null, .22, .1, .14, { maxH: .15, label: '신문 칸', scale: .7 });
};

// 컵라면 코너 (2×1): the eat-in bar along the wall — tiled backsplash with a 컵라면 코너 poster, a wood-grain bar with a
// hot-water pot (red / blue taps and a sleepy face), chopsticks, napkins and cup noodles; a red vinyl bench in front.
B.cupnoodlebar = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), st = col(T, 'stool'), body = col(T, 'body'), acc = col(T, 'accent'), tk = [wood, woodD, st, body, acc].join(',');
  const BT = .78, BZ0 = -.47, BZ1 = -.09, BD = BZ1 - BZ0, BZ = (BZ0 + BZ1) / 2, WB = 1.86, BH = 1.6, HX = -.6, HZ = -.33;
  const CUPS = [[.08, -.3, 0, BT], [.22, -.34, 1, BT], [.72, -.33, 0, BT], [.72, -.33, 1, BT + .118], [.72, -.33, 0, BT + .236]];
  f.add(mg('cupnoodlebar-tile|' + body + acc, mat('#ffffff', { map: tileTex(shade(body, -.01), shade(acc, .2)) }), ({ addM }) => addM(planarUV(ni(G.pbox(WB, BH, .03)).translate(0, BH / 2, -.485), .2), I4)));
  f.add(mg('cupnoodlebar-bar|' + wood, mat('#ffffff', { map: woodTex(wood) }), ({ addM }) => addM(planarUV(ni(G.box(WB - .04, .05, BD + .02, .012)).translate(0, BT - .025, BZ + .01), .5), I4)));
  f.add(mc('cupnoodlebar|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) add(G.box(.04, BT - .05, BD - .02, .01), woodD, sx * .88, (BT - .05) / 2, BZ);
    // hot-water pot with a face
    add(G.box(.26, .4, .24, .03), WHITE, HX, BT + .2, HZ);
    add(G.box(.27, .04, .25, .015), STEEL2, HX, BT + .42, HZ);
    add(G.box(.08, .03, .05, .01), DARK, HX, BT + .455, HZ - .04);
    for (const [dx, c] of [[-.055, TOMATO], [.055, SKY]]) {
      add(G.box(.036, .045, .05, .01), STEEL, HX + dx, BT + .16, HZ + .12 + .02);
      add(G.cyl(.022, .022, .03, 10), c, HX + dx, BT + .198, HZ + .12 + .03);
    }
    add(G.box(.22, .025, .1, .008), STEEL2, HX, BT + .0125, HZ + .17);
    for (const dz of [-.025, 0, .025]) add(G.pbox(.2, .004, .008), DARK, HX, BT + .025 + .004, HZ + .17 + dz);
    face(add, HX, BT + .3, HZ + .12 + .006, .55);
    // chopsticks cup, napkins
    add(G.cyl(.045, .04, .12, 12), woodD, -.3, BT + .06, -.34);
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; tube([-.3 + Math.cos(a) * .018, BT + .05, -.34 + Math.sin(a) * .018], [-.3 + Math.cos(a) * .03, BT + .21, -.34 + Math.sin(a) * .03], .005, '#f6d9a8', 4); }
    add(G.box(.16, .07, .1, .012), WHITE, -.12, BT + .035, -.36);
    add(G.sph(.04, 8, 6), WHITE, -.12, BT + .08, -.36, .3, 0, .2, [1.2, .7, .6]);
    // cup noodles: two on the bar (chopsticks over one), a stack of three
    for (const [x, z, i, y] of CUPS) { add(G.cyl(.065, .05, .11, 14), WHITE, x, y + .055, z); add(G.cyl(.068, .068, .008, 14), i ? '#ffd23f' : TOMATO, x, y + .114, z); }
    for (const dz of [-.012, .012]) tube([.02, BT + .122, -.3 + dz], [.16, BT + .122, -.3 + dz * 1.6], .005, '#f6d9a8', 4);
    // the bench
    add(G.box(1.5, .04, .3, .01), woodD, 0, .385, .27);
    add(G.box(1.5, .07, .32, .03), st, 0, .44, .26);
    add(G.pbox(.012, .08, .325), shade(st, -.18), 0, .44, .26);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.05, .365, .05, .01), STEEL2, sx * .68, .1825, .27 + sz * .1);
    for (const sx of [-1, 1]) add(G.pbox(.03, .03, .2), STEEL2, sx * .68, .08, .27);
  }));
  f.add(mg('cupnoodlebar-poster', mat('#ffffff', { map: ramenTex() }), ({ add }) => add(new THREE.PlaneGeometry(1.0, .5), .15, 1.22, -.47 + .006)));
  f.add(mg('cupnoodlebar-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.14, .07, RG.hot), HX, BT + .37, HZ + .12 + .006);
    for (const [x, z, i, y] of CUPS) add(taperBand(.0665, .0585, .05, NOO(i), 2.4), x, y + .055, z);
  }));
  f.spot('under', null, .32, 0, .27, { maxH: .3, label: '벤치 밑', scale: .85 });
  f.spot('on', null, .47, BT, -.24, { maxH: .45, label: '컵라면 바 위', scale: .8 });
  f.spot('on', null, -.45, .475, .27, { maxH: .4, label: '빨간 벤치 위', scale: .75 });   // (레벨 보고서 10/18)
};

// ═════════════════════════════════════════════ 빨래방 ═════════════════════════════════════════════
// 코인 세탁기 (1×1, tall): a dryer stacked on a washer — round glass doors on a perforated steel drum, printed control
// panels (dial, timer, 500원 slot), price stickers, a fluffy towel in each drum; detergent and towels on top.
B.washer3 = (f, T) => {
  const wc = col(T, 'washer'), acc2 = col(T, 'accent2'), acc3 = col(T, 'accent3'), acc = col(T, 'accent'), tk = [wc, acc2, acc3, acc].join(',');
  const W = .82, D = .7, z0 = -.13, fz = z0 + D / 2, back = z0 - D / 2, UH = .9, Y0 = .05, RH = .19, RD = .21, DL = .38, CY = .4;
  const U = [{ yb: Y0, key: 'w', lbl: '세탁기', tow: acc2 }, { yb: Y0 + UH, key: 'd', lbl: '건조기', tow: acc3 }];
  const front = rrShape(-W / 2, 0, W, UH, .03); front.holes.push(new THREE.Path().absarc(0, CY, RH, 0, PI * 2, true));
  f.add(mc('washer3|' + tk, ({ add, addM }) => {
    add(G.box(W - .04, Y0, D - .06, .01), CHAR, 0, Y0 / 2, z0 - .02);
    const fg = G.ext(front, .04, 0, 24);
    for (const u of U) {
      const yb = u.yb, cy = yb + CY;
      add(G.box(W, UH, .04, .012), wc, 0, yb + UH / 2, back + .02);
      for (const sx of [-1, 1]) add(G.box(.04, UH, D - .04, .012), wc, sx * (W / 2 - .02), yb + UH / 2, z0 - .02);
      for (const y of [yb + .015, yb + UH - .015]) add(G.pbox(W - .08, .03, D - .08), wc, 0, y, z0 - .02);
      addM(fg, xf(0, yb, fz - .04), wc);
      add(G.cyl(.046, .046, .03, 18), WHITE, -.163, yb + UH - .1, fz + .015, HP, 0, 0);
      add(G.box(.012, .036, .01, .004), INK, -.163, yb + UH - .09, fz + .035);
      // drum back, lifters, a towel
      add(G.cyl(RD + .006, RD + .006, .02, 22), STEEL2, 0, cy, fz - .04 - DL - .01, HP, 0, 0);
      for (let k = 0; k < 3; k++) { const an = HP + k / 3 * PI * 2 + PI / 3; add(G.box(.05, .03, DL - .06, .01), STEEL, Math.cos(an) * (RD - .016), cy + Math.sin(an) * (RD - .016), fz - .04 - DL / 2, 0, 0, an + HP); }
      add(G.sph(1, 14, 10), u.tow, 0, cy - .175, fz - .2, 0, .3, 0, [.15, .055, .14]);
      add(G.sph(.06, 10, 8), shade(u.tow, .12), .06, cy - .14, fz - .3, 0, 0, 0, [1.2, .6, 1]);
    }
    add(G.box(W + .01, .03, D + .01, .012), wc, 0, Y0 + 2 * UH + .015, z0);
    // on top: a detergent jug and folded towels
    const ty = Y0 + 2 * UH + .03;
    add(G.box(.15, .22, .1, .03), acc2, -.2, ty + .11, z0 - .05);
    add(G.cyl(.028, .028, .04, 10), WHITE, -.25, ty + .24, z0 - .05);
    add(G.tor(.035, .012, PI, 4, 10), acc2, -.16, ty + .22, z0 - .05);
    [acc3, WHITE, acc].forEach((c, k) => add(G.box(.26, .05, .2, .02), c, .16, ty + .025 + k * .05, z0 - .02, 0, (k - 1) * .06, 0));
  }));
  f.add(mg('washer3-drums', mat('#ffffff', { map: perfTex(), side: DS }), ({ addM }) => {
    for (const u of U) addM(uvScale(new THREE.CylinderGeometry(RD, RD, DL, 24, 1, true), 14, 4), xf(0, u.yb + CY, fz - .04 - DL / 2, HP, 0, 0));
  }));
  f.add(mg('washer3-prints', atlasMat(), ({ add }) => {
    for (const u of U) {
      add(quadGeo(.62, .155, u.key === 'w' ? RG.wpanel : RG.dpanel), .06, u.yb + UH - .1, fz + .006);
      add(quadGeo(.2, .1, u.key === 'w' ? RG.wash : RG.dry), .28, u.yb + .145, fz + .006);
      add(quadGeo(.72, .09, RG.wbrand), 0, u.yb + .05, fz + .006);
    }
    for (const sx of [-1, 1]) add(quadGeo(.3, .375, RG.wguide), sx * (W / 2 + .006), Y0 + .5, z0 - .02, 0, sx * HP, 0);
    add(quadGeo(.11, .07, RG.det), -.2, Y0 + 2 * UH + .03 + .11, z0 - .05 + .05 + .006);
  }));
  for (const u of U) {
    const pv = new THREE.Group(); put3(pv, -.245, u.yb + CY, fz + .035);
    pv.add(mc('washer3-door' + u.key, ({ add }) => {
      add(G.tor(RH + .035, .03, PI * 2, 8, 30), '#eef1f6', .245, 0, 0);
      add(G.tor(RH + .006, .01, PI * 2, 5, 28), u.key === 'w' ? '#4f9fe8' : '#ff9a3c', .245, 0, .026);
      add(G.box(.04, .11, .035, .012), DARK, .245 + RH + .05, 0, .02);
      for (const dy of [-.09, .09]) add(G.box(.03, .05, .03, .008), STEEL2, .012, dy, -.005);
    }));
    pv.add(transparent(mg('washer3-glass' + u.key, glassMat(), ({ add }) => add(new THREE.CircleGeometry(RH + .012, 28), .245, 0, 0))));
    f.add(pv);
    const p = f.part('door', pv, t => { pv.rotation.y = -1.9 * t; }, { label: u.lbl + ' 문', sfx: 'open', dur: .3 });
    // the washer can take a padlock on its handle (a friend hiding in the drum, 사건 판)
    if (u.key === 'w') { p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: .245 + RH + .05, y: .1, z: .06, parent: pv }; }
    f.spot('inside', null, 0, u.yb + CY - .125, fz - .17, { part: p, maxH: .26, label: u.lbl + ' 안', scale: .6 });
  }
  f.spot('on', null, .16, Y0 + 2 * UH + .03 + .15, z0 - .02, { maxH: .3, label: '수건 더미 위', scale: .7 });   // (레벨 보고서 10/18: the laundromat had 3 places in plain sight)
};

// 빨래 개는 테이블 (2×1): a long folding table — a speckled mustard laminate top on steel legs, a sky laundry basket of towels
// with a sleeve hanging out, a stack of folded shirts, a detergent jug; a crate of hangers on the lower shelf. Something
// can be tucked under the open end.
B.foldingtable2 = (f, T) => {
  const acc2 = col(T, 'accent2'), acc3 = col(T, 'accent3'), acc = col(T, 'accent'), tk = [acc2, acc3, acc].join(',');
  const TW = 1.74, TD = .74, TH = .76, BW = .5, BD = .38, BH = .24, bx = -.48, bz = -.04, slot = shade(acc2, -.2);
  f.add(mg('foldingtable2-top|' + acc3, mat('#ffffff', { map: speckTex(shade(acc3, .2)) }), ({ addM }) => addM(planarUV(ni(G.pbox(TW, .04, TD)).translate(0, TH - .02, 0), .6), I4)));
  f.add(mc('foldingtable2|' + tk, ({ add, tube }) => {
    add(G.box(TW + .012, .03, TD + .012, .008), WHITE, 0, TH - .02 - .005, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { tube([sx * .8, 0, sz * .3], [sx * .8, TH - .045, sz * .3], .022, STEEL2, 8); add(G.sph(.026, 8, 6), DARK, sx * .8, .012, sz * .3, 0, 0, 0, [1, .5, 1]); }
    for (const sz of [-1, 1]) tube([-.8, TH - .08, sz * .3], [.8, TH - .08, sz * .3], .014, STEEL2, 6);
    add(G.pbox(.8, .02, .62), STEEL, -.41, .16, 0);
    // a crate of hangers on the lower shelf
    add(G.box(.42, .14, .3, .02), acc, -.42, .17 + .07, 0);
    for (let k = 0; k < 5; k++) add(G.pbox(.05, .07, .006), shade(acc, -.2), -.58 + k * .08, .24, .15 + .006);
    for (let k = 0; k < 4; k++) add(G.tor(.035, .006, PI * 1.3, 3, 10), STEEL2, -.53 + k * .07, .34, -.02, 0, HP, -.4);
    // basket of laundry
    for (const sz of [-1, 1]) add(G.box(BW, BH, .022, .008), acc2, bx, TH + BH / 2, bz + sz * (BD / 2 - .011));
    for (const sx of [-1, 1]) add(G.box(.022, BH, BD - .044, .008), acc2, bx + sx * (BW / 2 - .011), TH + BH / 2, bz);
    add(G.pbox(BW - .044, .015, BD - .044), shade(acc2, -.1), bx, TH + .0075, bz);
    for (const sz of [-1, 1]) add(G.box(BW + .02, .025, .04, .008), WHITE, bx, TH + BH, bz + sz * (BD / 2 - .011));
    for (const sx of [-1, 1]) add(G.box(.04, .025, BD + .02, .008), WHITE, bx + sx * (BW / 2 - .011), TH + BH, bz);
    for (let k = 0; k < 5; k++) add(G.pbox(.03, .12, .006), slot, bx - .16 + k * .08, TH + .11, bz + BD / 2 + .006);
    for (const [dx, dz, c, s] of [[-.1, -.05, WHITE, .14], [.1, .04, acc3, .13], [-.05, .08, CORAL, .11], [.12, -.08, MINT, .12]]) add(G.sph(s, 12, 8), c, bx + dx, TH + BH - .03, bz + dz, 0, dx * 3, 0, [1.2, .45, 1]);
    add(G.box(.12, .16, .014, .006), CORAL, bx + .14, TH + BH - .06, bz + BD / 2 + .02);
    for (const y of [TH + BH - .1, TH + BH - .06]) add(G.pbox(.12, .012, .004), WHITE, bx + .14, y, bz + BD / 2 + .027 + .004);
    // folded shirts
    [[acc, 0], [WHITE, .07], [TOMATO, -.05], [SKY, .04]].forEach(([c, r], k) => add(G.box(.32, .045, .26, .015), c, .14, TH + .0225 + k * .045, -.08, 0, r, 0));
    for (const dz of [-.06, 0, .06]) add(G.pbox(.3, .006, .022), WHITE, .14, TH + .18 + .006, -.08 + dz, 0, .04, 0);   // stripes on the top shirt
    // detergent jug
    add(G.box(.15, .22, .1, .03), acc2, .66, TH + .11, -.2);
    add(G.cyl(.028, .028, .04, 10), WHITE, .62, TH + .24, -.2);
    add(G.tor(.035, .012, PI, 4, 10), acc2, .7, TH + .22, -.2);
  }));
  f.add(mg('foldingtable2-prints', atlasMat(), ({ add }) => add(quadGeo(.11, .07, RG.det), .66, TH + .11, -.15 + .006)));
  f.spot('under', null, .42, 0, .02, { maxH: .45, label: '테이블 밑', scale: .85 });
  f.spot('on', null, .5, TH, .17, { maxH: .45, label: '빨래 테이블 위', scale: .8 });
  f.spot('on', null, .14, TH, .25, { maxH: .4, label: '빨래 테이블 앞쪽', scale: .75 });   // (레벨 보고서 10/18)
};

// 동전 교환기 (1×1): a mustard coin changer — a printed instruction panel (bill in, two 500원 coins out), a green-lit LED,
// a bill slot and a coin cup, a red lamp on top. The front panel opens on a code lock: coin hoppers and a cash box inside.
B.vendcoin = (f, T) => {
  const vb = col(T, 'vend'), tk = [vb].join(',');
  const BW = .58, BD = .46, z0 = -.06, fz = z0 + BD / 2, back = z0 - BD / 2, Y0 = .1, BT = 1.5, PH = BT - Y0 - .04, inner = shade(vb, -.32);
  f.add(mc('vendcoin|' + tk, ({ add }) => {
    add(G.box(BW - .06, Y0, BD - .06, .01), CHAR, 0, Y0 / 2, z0 - .01);
    add(G.box(BW, BT - Y0, .04, .012), vb, 0, (Y0 + BT) / 2, back + .02);
    for (const sx of [-1, 1]) add(G.box(.04, BT - Y0, BD - .02, .012), vb, sx * (BW / 2 - .02), (Y0 + BT) / 2, z0 - .01);
    add(G.box(BW + .02, .05, BD + .01, .015), shade(vb, -.06), 0, BT + .025, z0 + .005);
    add(G.pbox(BW - .08, .03, BD - .08), inner, 0, Y0 + .015, z0 - .02);
    add(G.pbox(BW - .08, BT - Y0 - .06, .01), inner, 0, (Y0 + BT) / 2, back + .045);
    add(G.pbox(BW - .085, .025, BD - .1), STEEL, 0, .62 - .0125, z0 - .03);
    add(G.box(.4, .3, .3, .02), STEEL2, 0, Y0 + .03 + .15, z0 - .05);
    add(G.box(.14, .03, .03, .01), DARK, 0, Y0 + .03 + .2, z0 - .05 + .15 + .012);
    for (const x of [-.12, .12]) {
      add(G.cyl(.075, .075, .4, 14), STEEL, x, 1.15, -.14);
      for (let k = 0; k < 3; k++) add(G.cyl(.06, .06, .014, 14), k % 2 ? GOLD : SILVER, x, 1.357 + k * .016, -.14, 0, 0, (k - 1) * .06);
    }
    add(G.dome(.055, 14, 5), RED, 0, BT + .05, z0);
    add(G.sph(.02, 8, 6), WHITE, -.02, BT + .09, z0 + .03, 0, 0, 0, [1, 1, .6]);
  }));
  const pv = new THREE.Group(); put3(pv, -BW / 2 + .005, Y0 + .02 + PH / 2, fz + .02);
  const PWd = BW - .01, cx = PWd / 2;
  pv.add(mc('vendcoin-panel|' + tk, ({ add }) => {
    add(G.box(PWd, PH, .04, .015), vb, cx, 0, 0);
    add(G.box(.27, .1, .02, .01), '#26402f', cx, -.08, .025);
    add(G.box(.3, .05, .03, .01), CHAR, cx, -.2, .03);
    add(G.pbox(.2, .008, .006), '#7fffb0', cx, -.2, .045 + .006);
    add(G.box(.23, .15, .05, .02), STEEL2, cx, -.56, .04);
    add(G.pbox(.17, .08, .006), DARK, cx, -.57, .065 + .006);
    add(G.cyl(.016, .016, .012, 10), GOLD, cx + .04, -.6, .072 + .006, HP, 0, 0);
    for (const sy of [-1, 1]) add(G.cyl(.014, .014, .09, 8), STEEL2, -.004, sy * .45, 0);
  }));
  f.add(mg('vendcoin-side|' + vb, mat('#ffffff', { map: vendSideTex(vb) }), ({ add }) => { for (const sx of [-1, 1]) add(new THREE.PlaneGeometry(.36, .72), sx * (BW / 2 + .006), .86, z0 - .01, 0, sx * HP, 0); }));
  pv.add(mg('vendcoin-panelprint', mat('#ffffff', { map: coinTex() }), ({ add }) => add(new THREE.PlaneGeometry(.5, .625), cx, .33, .02 + .006)));
  pv.add(mg('vendcoin-led', screenMat(), ({ add }) => add(quadGeo(.24, .075, RG.cdisp), cx, -.08, .035 + .006)));
  f.add(pv);
  const p = f.part('door', pv, t => { pv.rotation.y = -1.75 * t; }, { label: '동전 교환기', sfx: 'open', dur: .32 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: cx, y: -.37, z: .045, parent: pv };
  f.spot('inside', null, 0, .62, z0 - .02, { part: p, maxH: .28, label: '동전 교환기 안', scale: .7 });
  f.spot('on', null, 0, BT + .05, z0, { maxH: .4, label: '동전 교환기 위', scale: .75 });   // (레벨 보고서 10/18)
};

// ═════════════════════════════════════════════ 동네 카페 ═════════════════════════════════════════════
// 카페 커피머신 + 바 (2×1): a café bar with vertical wood slats and a marble top — a green two-group espresso machine (cups
// warming on top, gauges, a steam wand, two espressos on the drip tray), a grinder, takeaway cups and syrups; the drawer in
// the front slides out (a bag of beans inside).
B.espresso = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), mac = col(T, 'machine'), acc = col(T, 'accent'), tk = [wood, woodD, mac, acc].join(',');
  const HW = .92, D = .62, z0 = -.15, fz = z0 + D / 2, back = z0 - D / 2, CH = .9, TY = .95;
  const DX0 = .2, DX1 = .8, DY0 = .6, DY1 = .84, DCX = (DX0 + DX1) / 2, DCY = (DY0 + DY1) / 2, DHh = DY1 - DY0;
  const mx = -.45, mz = -.2, MW = .76, MD = .42, MH = .46, slat = shade(acc, -.06);
  // green-painted wood slats (the grain still shows) on the front and both ends
  const slatMat = mat('#ffffff', { map: woodTex(slat, true) });
  const skin = (x0, x1, y0, y1) => planarUV(ni(G.pbox(x1 - x0, y1 - y0, .03)).translate((x0 + x1) / 2, (y0 + y1) / 2, fz - .015), .5);
  f.add(mg('espresso-skin|' + slat, slatMat, ({ addM }) => {
    for (const g of [skin(-HW, DX0, .06, CH), skin(DX1, HW, .06, CH), skin(DX0, DX1, .06, DY0), skin(DX0, DX1, DY1, CH)]) addM(g, I4);
    for (const sx of [-1, 1]) addM(planarUV(ni(G.pbox(.03, CH - .06, D - .03)).translate(sx * (HW - .015), .06 + (CH - .06) / 2, z0 - .015), .5), I4);
  }));
  f.add(mg('espresso-top', mat('#ffffff', { map: marbleTex() }), ({ addM }) => addM(planarUV(ni(G.box(2 * HW + .04, .05, D + .05, .012)).translate(0, CH + .025, z0 + .015), 1.0), I4)));
  f.add(mc('espresso|' + tk, ({ add, tube }) => {
    add(G.box(2 * HW - .06, .06, D - .06, .01), CHAR, 0, .03, z0 - .02);
    add(G.box(2 * HW - .06, CH - .06, .03, .01), woodD, 0, .06 + (CH - .06) / 2, back + .015);
    add(G.pbox(DX1 - DX0, .02, D - .1), shade(wood, -.12), DCX, DY0 - .01, z0 - .02);
    for (const x of [DX0, DX1]) add(G.pbox(.02, DHh, D - .1), shade(wood, -.12), x + (x === DX0 ? -.01 : .01), DCY, z0 - .02);
    add(G.pbox(DX1 - DX0 + .04, .02, D - .1), shade(wood, -.12), DCX, DY1 + .01, z0 - .02);
    add(G.box(.46, .16, .016, .008), CREAM, -.42, .55, fz + .008);
    // espresso machine
    add(G.box(MW, .05, MD, .015), STEEL2, mx, TY + .025, mz);
    add(G.pbox(MW - .14, .012, .2), DARK, mx, TY + .056, mz + .08);
    add(G.box(MW, .16, .14, .02), mac, mx, TY + .05 + .08, mz - MD / 2 + .07);
    add(G.box(MW, MH - .21, MD, .04), mac, mx, TY + .21 + (MH - .21) / 2, mz);
    add(G.box(MW + .01, .03, MD + .01, .012), STEEL, mx, TY + MH + .015, mz);
    for (const sx of [-1, 1]) add(G.box(.025, .045, MD - .02, .008), STEEL2, mx + sx * (MW / 2 - .02), TY + MH + .045, mz);
    for (const gx of [-.17, .17]) {
      add(G.cyl(.06, .05, .05, 14), STEEL, mx + gx, TY + .185, mz + .1);
      add(G.cyl(.055, .045, .04, 14), STEEL2, mx + gx, TY + .14, mz + .1);
      tube([mx + gx, TY + .14, mz + .14], [mx + gx + .03, TY + .125, mz + .3], .018, CHAR, 8);
      add(G.cyl(.04, .032, .05, 12), WHITE, mx + gx, TY + .062 + .025, mz + .1);
      add(G.cyl(.034, .034, .004, 12), COFFEE, mx + gx, TY + .062 + .05 + .002, mz + .1);
      add(G.tor(.018, .006, PI * 2, 4, 8), WHITE, mx + gx + .045, TY + .09, mz + .1, 0, HP, 0);
    }
    for (const [dx, c] of [[-.08, WHITE], [0, TOMATO], [.08, WHITE]]) add(G.box(.04, .025, .02, .008), c, mx + dx, TY + .27, mz + MD / 2 + .008);
    for (const sx of [-1, 1]) add(G.cyl(.042, .042, .016, 18), STEEL, mx + sx * .27, TY + .35, mz + MD / 2 + .008, HP, 0, 0);
    tube([mx + MW / 2 - .04, TY + .24, mz + .17], [mx + MW / 2 + .02, TY + .1, mz + .2], .01, STEEL, 6);
    add(G.cyl(.026, .026, .03, 10), CHAR, mx + MW / 2 - .06, TY + MH + .045, mz + .14);
    // cups warming on top
    [[-.24, -.08], [-.08, -.08], [.08, -.08], [.24, -.08], [-.16, .08], [0, .08], [.16, .08]].forEach(([dx, dz], k) => {
      add(G.cyl(.036, .044, .065, 12), [WHITE, CREAM, acc][k % 3], mx + dx, TY + MH + .03 + .0325, mz + dz);
    });
    // grinder
    add(G.box(.18, .22, .22, .03), CHAR, .1, TY + .11, -.22);
    add(G.cyl(.09, .055, .18, 16), '#9a6a48', .1, TY + .22 + .09, -.22);
    add(G.cyl(.095, .095, .03, 16), CHAR, .1, TY + .4 + .015, -.22);
    add(G.box(.05, .04, .06, .01), STEEL2, .1, TY + .12, -.22 + .13);
    // takeaway cup stack, lids, syrups
    add(G.cyl(.055, .045, .3, 14), WHITE, .38, TY + .15, -.25);
    for (let k = 0; k < 6; k++) add(G.tor(.052, .004, PI * 2, 3, 14), '#e9e4dc', .38, TY + .06 + k * .045, -.25, HP);
    add(G.cyl(.058, .058, .07, 14), '#4a3a36', .38, TY + .035, -.1);
    [['#d9822b', .58], ['#f3e2b8', .7], ['#8a5a3c', .82]].forEach(([c, x]) => {
      add(G.cyl(.032, .032, .2, 10), c, x, TY + .1, -.3);
      add(G.cyl(.012, .012, .06, 6), STEEL, x, TY + .23, -.3);
      add(G.box(.05, .016, .016, .005), CHAR, x + .018, TY + .262, -.3);
    });
    // (⑥ 10/24 사용자 34판 "커피머신 디테일 올려줘"): the drip tray's grate, a steel milk pitcher under the steam wand, a tamper on
    // its mat and a glass jar of beans — a working bar, not a box with spouts
    for (let k = 0; k < 7; k++) add(G.pbox(.012, .006, .18), STEEL, mx - .27 + k * .09, TY + .064, mz + .08);
    add(G.cyl(.04, .046, .1, 14), STEEL, mx + MW / 2 + .05, TY + .05, mz + .27); add(G.cone(.018, .03, 6), STEEL, mx + MW / 2 + .085, TY + .095, mz + .27, 0, 0, -1.1);
    add(G.tor(.026, .007, PI * 1.2, 4, 10), STEEL2, mx + MW / 2 + .015, TY + .055, mz + .27, 0, 0, HP + .3);
    add(G.box(.12, .008, .1, .004), '#5b5672', mx - .3, TY + .004, mz + .3); add(G.cyl(.03, .03, .025, 14), STEEL, mx - .3, TY + .021, mz + .3); add(G.cyl(.012, .016, .07, 10), '#9a6a48', mx - .3, TY + .068, mz + .3); add(G.sph(.02, 10, 8), '#9a6a48', mx - .3, TY + .105, mz + .3);
    add(G.cyl(.05, .05, .13, 14), '#dfeef6', .58, TY + .065, -.1); add(G.cyl(.054, .054, .025, 14), '#9a6a48', .58, TY + .14, -.1);
    for (let k = 0; k < 9; k++) add(G.sph(.016, 6, 5), COFFEE, .58 + Math.cos(k * 2.1) * .025, TY + .02 + (k % 4) * .022, -.1 + Math.sin(k * 2.1) * .025, 0, k, 0, [1, .7, 1.2]);
    potPlant(add, .82, TY, -.1, col(T, 'pot'), .8);
  }));
  f.add(mg('espresso-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.42, .14, RG.logo), -.42, .55, fz + .016 + .006);
    add(quadGeo(.26, .087, RG.logo), mx, TY + .35, mz + MD / 2 + .006);
    for (const sx of [-1, 1]) add(quadGeo(.07, .07, RG.gauge), mx + sx * .27, TY + .35, mz + MD / 2 + .016 + .006);
    add(bandGeo(.058, .065, RG.sleeve, 2.4, 10).scale(1, 1, 1), .38, TY + .2, -.25);
  }));
  const dv = new THREE.Group(); put3(dv, DCX, DCY, fz + .004);
  dv.add(mg('espresso-drawerfront|' + slat, slatMat, ({ addM }) => addM(planarUV(ni(G.pbox(DX1 - DX0 - .012, DHh - .012, .03)).translate(0, 0, .015), .5), I4)));
  dv.add(mc('espresso-drawer|' + tk, ({ add }) => {
    const ic = shade(wood, .08), fl = -DHh / 2 + .02;
    add(G.sph(.022, 10, 8), GOLD, 0, 0, .04);
    add(G.pbox(.52, .012, .34), ic, 0, fl, -.19);
    for (const k of [-1, 1]) add(G.pbox(.012, .15, .34), ic, k * .26, fl + .075, -.19);
    add(G.pbox(.52, .15, .012), ic, 0, fl + .075, -.36);
    add(G.box(.13, .16, .07, .02), '#d9a46a', -.15, fl + .006 + .08, -.26, 0, .1, 0);
  }));
  dv.add(mg('espresso-beans', atlasMat(), ({ addM }) => addM(quadGeo(.11, .11, RG.beans), xf(-.15, -DHh / 2 + .02 + .006 + .08, -.26, 0, .1, 0).multiply(xf(0, 0, .035 + .006)))));
  f.add(dv);
  const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .36 * t; }, { label: '카페 바 서랍', sfx: 'drawer', dur: .26 });
  f.spot('inside', dv, .1, -DHh / 2 + .026, -.19, { part: p, maxH: .17, label: '카페 바 서랍', scale: .7 });
  f.spot('on', null, .58, TY, .03, { maxH: .45, label: '카페 바 위', scale: .8 });
};

// 빵 진열장 (1×1): a pastry case — a wood-grain base with an 오늘의 빵 chalk card, green corner posts, glass sides and a glass
// front that flips up; croissants, melon buns, a bagel, iced doughnuts and 소보로 on two tiers with price tags; a cookie jar
// on top.
B.pastrycase = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc = col(T, 'accent'), tk = [wood, woodD, acc].join(',');
  const W = .9, HW = W / 2, D = .6, z0 = -.08, fz = z0 + D / 2, back = z0 - D / 2, BH = .74, CT = 1.3, MS = 1.03, DH = CT - BH - .02;
  const T0 = BH + .032, T1 = MS + .0075;
  const croissant = (add, x, y, z, ry) => { for (let k = 0; k < 5; k++) { const an = -1.1 + k * .55, r = [.034, .047, .057, .047, .034][k]; add(G.sph(r, 10, 8), k % 2 ? shade(CRUST, .07) : CRUST, x + Math.sin(an + ry) * .07, y + r * .8, z + Math.cos(an + ry) * .07 - .04, 0, an + ry, 0, [1.2, .85, 1]); } };
  // price cards: [x, y, z, tag]
  const TAGS = [[-.3, T0, .1, 0], [-.08, T0, .1, 1], [.36, T0, -.07, 3], [-.3, T1, .11, 2], [.1, T1, .11, 4], [.32, T1, .13, 7]];
  f.add(mg('pastrycase-base|' + wood, mat('#ffffff', { map: woodTex(wood) }), ({ addM }) => addM(planarUV(ni(G.box(W, BH - .05, D, .012)).translate(0, .05 + (BH - .05) / 2, z0), .5), I4)));
  f.add(mg('pastrycase-top|' + woodD, mat('#ffffff', { map: woodTex(woodD) }), ({ addM }) => addM(planarUV(ni(G.box(W + .02, .04, D, .012)).translate(0, CT + .02, z0), .5), I4)));
  f.add(mg('pastrycase-trays', mat('#ffffff', { map: checkTex(TOMATO) }), ({ addM }) => { for (const sx of [-1, 1]) addM(planarUV(ni(G.pbox(.38, .012, .44)).translate(sx * .2, BH + .026, z0 - .01), .08), I4); }));
  f.add(mc('pastrycase|' + tk, ({ add }) => {
    add(G.box(W - .04, .05, D - .04, .01), CHAR, 0, .025, z0);
    add(G.pbox(W - .04, .02, D - .04), CREAM, 0, BH + .01, z0);
    add(G.box(W - .07, CT - BH, .03, .01), shade(acc, .14), 0, (BH + CT) / 2, back + .015);
    for (const sx of [-1, 1]) for (const zc of [fz - .0175, back + .02]) add(G.box(.035, CT - BH, .035, .008), acc, sx * (HW - .0175), (BH + CT) / 2, zc);
    add(G.pbox(W - .07, .015, D - .1), WHITE, 0, MS, z0 - .02);
    // lower tier: two croissants and a melon bun (left), two sesame bagels at the back right (the hiding gap in front)
    croissant(add, -.3, T0, -.02, .2); croissant(add, -.26, T0, -.2, -.3);
    add(G.sph(.085, 14, 10), '#ffe08a', -.09, T0, -.13, 0, 0, 0, [1, .62, 1]);
    for (let k = 0; k < 9; k++) { const rr2 = k ? .05 : 0, an = k * .8, h = .085 * .62 * Math.sqrt(1 - (rr2 / .085) ** 2); add(G.sph(.009, 5, 4), WHITE, -.09 + Math.cos(an) * rr2, T0 + h, -.13 + Math.sin(an) * rr2, 0, 0, 0, [1, .6, 1]); }
    for (const [x, z] of [[.12, -.22], [.31, -.19]]) {
      add(G.tor(.056, .03, PI * 2, 8, 18), '#d9934a', x, T0 + .03, z, HP, 0, 0);
      for (let k = 0; k < 8; k++) add(G.sph(.007, 4, 3), CREAM, x + Math.cos(k * .8) * .056, T0 + .058, z + Math.sin(k * .8) * .056);
    }
    // upper tier: iced doughnuts, 소보로 and a loaf
    [[-.32, -.18, '#ff9fb5'], [-.15, -.18, '#6b3f2a'], [-.24, .0, '#7fd6c0']].forEach(([x, z, ic]) => {
      add(G.tor(.055, .026, PI * 2, 8, 18), CRUST, x, T1 + .026, z, HP, 0, 0);
      add(G.tor(.055, .023, PI * 2, 6, 18), ic, x, T1 + .04, z, HP, 0, 0, [1, 1, .6]);
      for (let k = 0; k < 6; k++) add(G.box(.014, .005, .005, .001), [MUSTARD, WHITE, SKY, TOMATO, LEAF, LILAC][k], x + Math.cos(k * 1.1) * .055, T1 + .056, z + Math.sin(k * 1.1) * .055, 0, k, 0);
    });
    for (const [x, z] of [[.12, -.2], [.3, -.14]]) {
      add(G.sph(.075, 12, 8), '#e2a35a', x, T1, z, 0, 0, 0, [1, .62, 1]);
      for (let k = 0; k < 8; k++) add(G.sph(.019, 6, 4), '#f6c87e', x + Math.cos(k * .8) * .042, T1 + .04, z + Math.sin(k * .8) * .042, 0, 0, 0, [1, .6, 1]);
    }
    add(G.box(.17, .085, .1, .03), '#f2d39a', .2, T1 + .0425, .03);
    add(G.box(.18, .03, .11, .015), '#c98a52', .2, T1 + .085, .03);
    for (const [x, y, z] of TAGS) add(G.pbox(.08, .045, .004), WHITE, x, y + .03, z, -.35, 0, 0);
    // a cookie jar on top, two cookies on a little plate beside it
    add(G.cyl(.08, .08, .16, 16), CREAM, -.26, CT + .04 + .08, -.14);
    add(G.cyl(.084, .084, .03, 16), acc, -.26, CT + .04 + .175, -.14);
    add(G.sph(.022, 8, 6), MUSTARD, -.26, CT + .04 + .2, -.14);
    add(G.ext(starShape(.035, .016), .008, 0, 2), MUSTARD, -.26, CT + .04 + .09, -.14 + .08);
    add(G.cyl(.075, .065, .01, 16), WHITE, -.2, CT + .045, .06);
    for (const [dx, dy] of [[-.02, .012], [.025, .024]]) { add(G.cyl(.04, .04, .012, 14), '#e8b46a', -.2 + dx, CT + .044 + dy, .06, 0, 0, dx * 4); add(G.sph(.008, 5, 4), '#6b3f2a', -.2 + dx + .01, CT + .044 + dy + .007, .07); }
  }));
  f.add(mg('pastrycase-prints', atlasMat(), ({ addM, add }) => {
    for (const [x, y, z, i] of TAGS) addM(quadGeo(.075, .0375, PT(i)), xf(x, y + .03, z, -.35, 0, 0).multiply(xf(0, 0, .002 + .006)));
    add(quadGeo(.42, .21, RG.bread), 0, .44, fz + .006);
  }));
  f.add(transparent(mg('pastrycase-sides', glassMat(.16), ({ add }) => { for (const sx of [-1, 1]) add(new THREE.PlaneGeometry(D - .07, CT - BH - .02), sx * (HW - .0175), (BH + CT) / 2, z0, 0, HP, 0); })));
  const pv = new THREE.Group(); put3(pv, 0, CT, fz + .015);
  pv.add(mc('pastrycase-door|' + tk, ({ add }) => {
    add(G.box(W - .01, .04, .03, .01), acc, 0, -.02, 0);
    add(G.box(W - .01, .05, .03, .01), acc, 0, -DH + .025, 0);
    for (const sx of [-1, 1]) add(G.box(.035, DH, .03, .008), acc, sx * (HW - .0225), -DH / 2, 0);
    add(G.box(.22, .022, .03, .01), GOLD, 0, -DH + .09, .03);
    for (const sx of [-1, 1]) add(G.box(.02, .022, .03, .006), GOLD, sx * .1, -DH + .09, .012);
  }));
  pv.add(transparent(mg('pastrycase-glass', glassMat(.16), ({ add }) => add(new THREE.PlaneGeometry(W - .08, DH - .08), 0, -DH / 2 + .005, 0))));
  f.add(pv);
  const p = f.part('door', pv, t => { pv.rotation.x = -1.25 * t; }, { label: '빵 진열장', sfx: 'open', dur: .32 });
  f.spot('inside', null, .17, T0, .03, { part: p, maxH: .24, label: '빵 진열장 안', scale: .7 });
  f.spot('on', null, .17, CT + .04, -.1, { maxH: .45, label: '빵 진열장 위', scale: .8 });
};

// 카페 테이블 세트 (1×1): a round bistro table with a wood-grain top and an iron pedestal, two bentwood chairs with green
// cushions; a latte with heart art, a slice of strawberry cake and a bud vase on top.
B.cafetable = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc = col(T, 'accent'), tk = [wood, woodD, acc, col(T, 'accent3')].join(',');
  const TY = .72, R = .32, LX = -.12, LZ = .12;
  const wedge = new THREE.Shape(); wedge.moveTo(0, 0); wedge.lineTo(.13, -.04); wedge.quadraticCurveTo(.14, 0, .13, .04); wedge.lineTo(0, 0);
  f.add(mg('cafetable-top|' + wood, mat('#ffffff', { map: woodTex(wood) }), ({ addM }) => addM(planarUV(ni(G.cyl(R, R, .04, 30)).translate(0, TY - .02, 0), .5), I4)));
  f.add(mc('cafetable|' + tk, ({ add, addM, tube }) => {
    add(G.cyl(.2, .22, .03, 20), CHAR, 0, .015, 0);
    add(G.cyl(.03, .035, TY - .1, 10), CHAR, 0, .03 + (TY - .1) / 2, 0);
    add(G.cyl(.09, .06, .03, 12), CHAR, 0, TY - .055, 0);
    add(G.tor(R, .012, PI * 2, 6, 32), woodD, 0, TY - .02, 0, HP, 0, 0);
    // bentwood chairs painted deep green, mustard seat pads
    const fr = shade(acc, -.2), pad = col(T, 'accent3');
    for (const sx of [-1, 1]) {
      const cx = sx * .32, bx = cx + sx * .13;
      add(G.cyl(.15, .15, .04, 20), fr, cx, .44, 0);
      add(G.cyl(.14, .14, .03, 20), pad, cx, .475, 0);
      for (const lx of [-1, 1]) for (const lz of [-1, 1]) tube([cx + lx * .09, .42, lz * .09], [cx + lx * .13, 0, lz * .13], .013, fr, 6);
      add(G.tor(.16, .01, PI * 2, 4, 24), fr, cx, .18, 0, HP, 0, 0);
      add(G.tor(.13, .014, PI, 5, 16), fr, bx, .62, 0, 0, HP, 0);
      for (const z of [-.13, .13]) tube([bx, .46, z], [bx, .62, z], .014, fr, 6);
      for (const z of [-.05, .05]) tube([bx, .46, z], [bx, .72, z], .01, fr, 5);
    }
    // a latte on a saucer, a slice of strawberry cake, a bud vase
    add(G.cyl(.07, .065, .012, 18), WHITE, LX, TY + .006, LZ);
    add(G.lathe([[0, 0], [.036, 0], [.046, .07], [.04, .07], [.033, .058], [0, .058]], 18), WHITE, LX, TY + .012, LZ);
    add(G.tor(.02, .007, PI * 2, 4, 10), WHITE, LX + .052, TY + .05, LZ, 0, 0, 0);
    add(G.cyl(.1, .09, .012, 20), WHITE, -.06, TY + .006, -.15);
    addM(G.ext(wedge, .06, 0, 4), xf(-.12, TY + .012, -.15, -HP, 0, 0), '#fff0c8');
    addM(G.ext(wedge, .016, 0, 4), xf(-.12, TY + .072, -.15, -HP, 0, 0), WHITE);
    addM(G.pbox(.11, .004, .014), xf(-.12, TY + .012, -.15, -HP, 0, 0).multiply(xf(.0632, -.0257, .03, 0, 0, -.2985)), '#ff7a9a');   // the jam layer on the cut side
    add(G.sph(.018, 10, 8), TOMATO, -.06, TY + .1, -.15);
    add(G.cone(.01, .012, 5), LEAF, -.06, TY + .12, -.15);
    add(G.lathe([[0, 0], [.03, 0], [.038, .035], [.02, .09], [.016, .1], [.022, .11], [0, .11]], 12), SKY2, .18, TY, .14);
    tube([.18, TY + .1, .14], [.19, TY + .2, .14], .004, LEAF2, 4);
    for (let i = 0; i < 5; i++) { const an = i / 5 * PI * 2 + HP; add(G.sph(.014, 8, 6), WHITE, .19 + Math.cos(an) * .015, TY + .21 + Math.sin(an) * .015, .14, 0, 0, 0, [1, 1, .3]); }
    add(G.sph(.01, 8, 6), MUSTARD, .19, TY + .21, .146, 0, 0, 0, [1, 1, .4]);
  }));
  f.add(mg('cafetable-latte', atlasMat(), ({ add }) => add(cellUV(new THREE.CircleGeometry(.033, 16), RG.latte), LX, TY + .012 + .058 + .006, LZ, -HP, 0, 0)));
  f.spot('under', null, -.02, 0, .25, { maxH: .45, label: '카페 테이블 밑', scale: .8 });
  f.spot('on', null, .15, TY, -.04, { maxH: .45, label: '카페 테이블 위', scale: .7 });
};

// ═════════════════════════════════════════════ WALL PIECES ═════════════════════════════════════════════
// 메뉴판 (wall, span 2): a framed chalkboard menu — MENU / 메뉴, drinks and breads with prices in coloured chalk, a cup
// doodle — a chalk ledge with chalk and an eraser, and a little shelf with a potted plant below.
B.menuboard = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), chalk = col(T, 'chalk'), pc = col(T, 'pot'), tk = [wood, woodD, chalk, pc].join(',');
  const BW = 1.5, BH = .94, cy = 1.66, SY = .98;
  f.add(mc('menuboard|' + tk, ({ add }) => {
    add(G.box(BW, BH, .03, .01), chalk, 0, cy, .015);
    for (const sy of [-1, 1]) add(G.box(BW + .14, .07, .05, .015), wood, 0, cy + sy * (BH / 2 + .035), .025);
    for (const sx of [-1, 1]) add(G.box(.07, BH, .05, .015), wood, sx * (BW / 2 + .035), cy, .025);
    add(G.box(1.0, .025, .08, .008), woodD, 0, cy - BH / 2 - .07 - .0125, .05);
    [[-.3, WHITE], [-.22, '#ffb3c6'], [-.16, '#ffe27a']].forEach(([x, c], k) => add(G.cap(.008, .05, 2, 6), c, x, cy - BH / 2 - .07 + .008, .07 + (k - 1) * .006, 0, 0, HP));
    add(G.box(.1, .025, .04, .008), CHAR, .25, cy - BH / 2 - .07 + .0125, .07);
    add(G.box(.1, .015, .042, .005), woodD, .25, cy - BH / 2 - .07 + .032, .07);
    // a little shelf with a pot
    add(G.box(.64, .03, .2, .01), wood, .48, SY - .015, .1);
    for (const x of [.26, .7]) add(G.box(.03, .06, .14, .006), woodD, x, SY - .06, .07);
    potPlant(add, .7, SY, .1, pc, 1);
  }));
  f.add(mg('menuboard-chalk|' + chalk, mat('#ffffff', { map: chalkTex(chalk) }), ({ add }) => add(new THREE.PlaneGeometry(1.48, .925), 0, cy, .03 + .006)));
  f.spot('on', null, .4, SY, .1, { maxH: .4, label: '메뉴판 아래 선반', scale: .7 });
};

// 가게 벽시계 (wall, span 1): a red-rimmed shop clock on a nail above a taped-up 2+1 snack poster; the clock swings aside
// on its nail (it stays flat on the wall) to show what was tucked behind it.
B.clockposter = (f, T) => {
  const PY = 2.18, R = .21, cy = -.27, rim = RED;
  f.add(mc('clockposter-wall', ({ add }) => {
    add(G.cyl(.012, .012, .03, 8), STEEL2, 0, PY + .012, .015, HP, 0, 0); add(G.sph(.016, 8, 6), STEEL2, 0, PY + .012, .032);
    add(G.box(.54, .72, .004, .002), WHITE, 0, 1.25, .004);
    for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) add(G.pbox(.09, .03, .004), TAPE, sx * .25, 1.25 + sy * .35, .02, 0, 0, sx * sy * .6);
  }));
  f.add(mg('clockposter-poster', atlasMat(), ({ add }) => add(quadGeo(.5, .667, RG.poster), 0, 1.25, .006 + .006)));
  const pv = new THREE.Group(); put3(pv, 0, PY, .006);
  pv.add(mc('clockposter-clock', ({ add }) => {
    add(G.cyl(R, R, .05, 32), rim, 0, cy, .03, HP, 0, 0);
    add(G.tor(R - .016, .012, PI * 2, 5, 32), WHITE, 0, cy, .055);
    add(G.tor(.03, .008, PI * 2, 4, 12), STEEL2, 0, cy + R + .03, .02);
    add(G.box(.014, .1, .006, .003), INK, -.03, cy + .035, .074, 0, 0, .7);
    add(G.box(.011, .15, .006, .003), INK, .04, cy + .055, .081, 0, 0, -.6);
    add(G.box(.004, .16, .004, .001), RED, -.03, cy - .05, .087, 0, 0, -.5);
    add(G.cyl(.016, .016, .02, 12), GOLD, 0, cy, .087, HP, 0, 0);
  }));
  pv.add(mg('clockposter-face', mat('#ffffff', { map: clockTex() }), ({ add }) => add(new THREE.CircleGeometry(R - .024, 32), 0, cy, .055 + .006)));
  f.add(pv);
  const p = f.part('flip', pv, t => { pv.rotation.z = 1.45 * t; }, { label: '가게 벽시계', sfx: 'lift', dur: .34 });
  f.spot('inside', null, 0, PY + cy, .012, { part: p, maxH: .09, label: '시계 뒤', wallFace: true });
};

// ═════════════════════════════════════════════ 룩: 가게를 가게답게 ═════════════════════════════════════════════
// (10/19 아트 세션, user refs — an isometric cosy café and the TUTU shop: "이런 판이나 이런느낌의 판도 몇개 있었으면")
// Pieces the look layer (look.js RECIPES.konbini / cafe) hangs on the shop walls and stands on the free floor so the
// shops read as busy, lived-in places. No parts and no spots: the stage's hiding places stay exactly as they were.
// hidden: never sold, never in the layout editor, no thumbnail.

// WELCOME (wall, span 2): seven chunky letter tiles in the shop colours, set a little up and down like stuck-on blocks
const letterTex = (word, cols) => tex('shop-letters|' + word + '|' + cols.join(','), 128 * word.length, 128, (c, w, h) => {
  [...word].forEach((ch, k) => {
    c.fillStyle = cols[k % cols.length]; c.fillRect(k * 64, 0, 64, 64);
    txt(c, ch, k * 64 + 32, 34, 44, cols[k % cols.length] === '#ffffff' ? '#3f86d8' : '#ffffff');
  });
}, { text: true });
B.welcome = (f, T, o = {}) => {   // o.word / o.cols: another shop's sign (LAUNDRY)
  const word = o.word || 'WELCOME', cols = o.cols || [col(T, 'accent2'), col(T, 'accent'), '#ffffff', col(T, 'accent3')], n = word.length, S = .27, gap = .035;
  const x0 = -(n * S + (n - 1) * gap) / 2 + S / 2, y0 = 2.3, pos = k => [x0 + k * (S + gap), y0 + (k % 2 ? .05 : -.02), (k % 3 - 1) * .07];
  f.add(mc('welcome|' + word + '|' + cols.join(','), ({ add }) => { for (let k = 0; k < n; k++) { const [x, y, r] = pos(k); add(G.box(S, S, .05, .02), shade(cols[k % cols.length], -.12), x, y, .025, 0, 0, r); } }));
  f.add(mg('welcome-print|' + word + '|' + cols.join(','), mat('#ffffff', { map: letterTex(word, cols) }), ({ addM }) => {
    for (let k = 0; k < n; k++) { const [x, y, r] = pos(k); addM(cellUV(new THREE.PlaneGeometry(S - .03, S - .03), [k / n, 0, (k + 1) / n, 1]), xf(x, y, .056, 0, 0, r)); }
  }));
};
// a big "맛있다!" poster (wall, span 2): the mochi licking its lips in a burst of rays, hearts, a pink frame
const yummyTex = () => tex('shop-yummy', 512, 320, (c, w, h) => {
  c.fillStyle = '#bfe8fb'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#e6f6fd'; for (let k = 0; k < 14; k++) { const a = k / 14 * PI * 2; c.beginPath(); c.moveTo(w * .62, h * .62); c.arc(w * .62, h * .62, w, a, a + PI / 14); c.closePath(); c.fill(); }
  mochi(c, w * .62, h * .66, 42);
  c.fillStyle = '#ff9fb5'; ell(c, w * .62 + 4, h * .66 + 14, 6, 4);
  c.fillStyle = '#ffffff'; c.strokeStyle = '#2a1d33'; c.lineWidth = 2; roundRect(c, 14, 16, 108, 50, 18); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(96, 64); c.lineTo(118, 84); c.lineTo(112, 62); c.closePath(); c.fill();
  txt(c, '맛있다!', 68, 42, 22, '#ff5a73');
  c.fillStyle = '#ff7a95'; heartPath(c, 214, 40, 9); c.fill(); heartPath(c, 236, 66, 6); c.fill(); heartPath(c, 34, 116, 7); c.fill();
  c.fillStyle = '#ffd23f'; starPath(c, 196, 120, 8); c.fill();
}, { text: true });
B.yummyposter = (f, T) => {
  const PW = 1.22, PH = .76, cy = 2.12;
  f.add(mc('yummyposter', ({ add }) => {
    add(G.box(PW + .08, PH + .08, .03, .015), '#ff8fb0', 0, cy, .015);
    for (const [sx, sy] of [[-1, 1], [1, 1]]) add(G.pbox(.1, .03, .004), TAPE, sx * (PW / 2 - .02), cy + sy * (PH / 2 + .02), .034, 0, 0, sx * .5);
  }));
  f.add(mg('yummyposter-print', mat('#ffffff', { map: yummyTex() }), ({ add }) => add(new THREE.PlaneGeometry(PW, PH), 0, cy, .036)));
};
// two small sale posters, one above the other (wall, span 1): 1+1 삼각김밥 and a new drink
const saleTex = () => tex('shop-sale2', 256, 320, (c, w, h) => {
  c.fillStyle = '#ff5a4a'; c.fillRect(0, 0, w, h / 2); c.fillStyle = '#fff4e2'; c.fillRect(0, h / 2, w, h / 2);
  txt(c, 'SALE', 40, 22, 18, '#ffe27a'); txt(c, '1+1', 40, 46, 22, '#ffffff');
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(96, 18); c.lineTo(122, 64); c.lineTo(70, 64); c.closePath(); c.fill();
  c.fillStyle = '#2a1d33'; c.fillRect(84, 46, 24, 18); c.fillStyle = '#ffffff'; blob(c, 90, 36, 2); blob(c, 102, 36, 2);
  txt(c, 'NEW', 34, h / 2 + 22, 16, '#3f86d8'); txt(c, '음료', 34, h / 2 + 44, 15, '#2a1d33');
  c.fillStyle = '#7fd6c0'; roundRect(c, 84, h / 2 + 14, 22, 48, 6); c.fill(); c.fillStyle = '#3f86d8'; c.fillRect(88, h / 2 + 6, 14, 10);
  c.fillStyle = '#ffffff'; c.fillRect(86, h / 2 + 30, 18, 12);
}, { text: true });
B.saleposters = (f, T) => {
  const PW = .44, PH = .55;
  f.add(mc('saleposters', ({ add }) => { for (const y of [2.05, 1.42]) { add(G.box(PW + .04, PH + .04, .006, .003), WHITE, 0, y, .004); add(G.pbox(.09, .03, .004), TAPE, 0, y + PH / 2 + .01, .012); } }));
  f.add(mg('saleposters-print', mat('#ffffff', { map: saleTex() }), ({ addM }) => {
    addM(cellUV(new THREE.PlaneGeometry(PW, PH), [0, .5, 1, 1]), xf(0, 2.05, .012)); addM(cellUV(new THREE.PlaneGeometry(PW, PH), [0, 0, 1, .5]), xf(0, 1.42, .012));
  }));
};
// three chalk menus hanging high over the coffee bar (wall, span 2), each tipped a little toward the room
const menuTex = (k, chalk) => tex('shop-menu3|' + k + '|' + chalk, 256, 320, (c, w, h) => {
  c.fillStyle = tint(chalk); c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 9; i++) ell(c, (i * 53 + k * 17) % w, (i * 41) % h, 14 + (i % 3) * 5, 7, i);
  const T3 = [['COFFEE', [['아메리카노', '3.0'], ['카페라떼', '3.5'], ['카푸치노', '3.5'], ['모카', '4.0']]],
    ['DESSERT', [['딸기케이크', '5.0'], ['크루아상', '2.8'], ['쿠키', '1.5']]], ['TEA', [['녹차라떼', '4.0'], ['얼그레이', '3.5'], ['레몬티', '3.5'], ['코코아', '3.8']]]][k];
  txt(c, T3[0], w / 2, 22, 17, '#ffe27a');
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(20, 36); c.lineTo(w - 20, 36); c.stroke();
  T3[1].forEach(([a, b], i) => { txt(c, a, 14, 54 + i * 19, 11, '#ffffff', { align: 'left' }); txt(c, b, w - 14, 54 + i * 19, 11, ['#ffb3c6', '#bff0d8', '#ffe27a'][k], { align: 'right' }); });
  c.fillStyle = ['#ffb3c6', '#ffe27a', '#bff0d8'][k]; if (k === 1) { rr(c, w / 2 - 19, 132, 38, 16, 3); c.fillStyle = '#ffffff'; rr(c, w / 2 - 19, 126, 38, 8, 3); c.fillStyle = '#ff5a73'; blob(c, w / 2, 122, 4); }
  else { heartPath(c, w / 2, 140, 7); c.fill(); }
}, { text: true });
B.menutrio = (f, T) => {
  const wood = col(T, 'woodD'), chalk = col(T, 'chalk'), BW = .58, BH = .7, cy = 2.08, xs = [-.66, 0, .66];
  f.add(mc('menutrio|' + wood, ({ add, tube }) => {
    xs.forEach(x => {
      add(G.box(BW + .08, BH + .08, .04, .015), wood, x, cy, .03, -.1, 0, 0);
      tube([x - .18, cy + BH / 2 + .03, .04], [x, cy + BH / 2 + .2, .005], .006, STEEL2); tube([x + .18, cy + BH / 2 + .03, .04], [x, cy + BH / 2 + .2, .005], .006, STEEL2);
      add(G.sph(.016, 8, 6), STEEL2, x, cy + BH / 2 + .2, .008);
    });
  }));
  xs.forEach((x, k) => f.add(mg('menutrio-chalk|' + k + '|' + chalk, mat('#ffffff', { map: menuTex(k, chalk) }), ({ add }) => add(new THREE.PlaneGeometry(BW, BH), x, cy, .052, -.1, 0, 0))));
};
// two wooden shelves of jars, cups and a little plant (wall, span 1) — the back bar over the pastry case
B.cupshelf = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), pc = col(T, 'pot'), SW = .94, L1 = 1.62, L2 = 2.02;
  f.add(mc('cupshelf|' + [wood, woodD, pc].join(','), ({ add }) => {
    for (const y of [L1, L2]) {
      add(G.box(SW, .04, .24, .012), wood, 0, y, .12);
      for (const x of [-SW / 2 + .1, SW / 2 - .1]) add(G.box(.04, .12, .18, .01), woodD, x, y - .08, .09);
    }
    // lower shelf: two jars of beans with coloured lids, three mugs
    [[-.34, '#8a5634', '#ff8f86'], [-.18, '#5b3a26', '#ffd25c']].forEach(([x, bean, lid]) => {
      add(G.cyl(.06, .06, .17, 14), '#e8f4f6', x, L1 + .02 + .085, .12); add(G.cyl(.053, .053, .12, 14), bean, x, L1 + .02 + .065, .12); add(G.cyl(.065, .065, .035, 14), lid, x, L1 + .02 + .18, .12);
    });
    [[.0, '#ffffff'], [.15, '#ffb3c6'], [.3, '#8fd3f4']].forEach(([x, c]) => {
      add(G.cyl(.05, .045, .1, 12), c, x, L1 + .02 + .05, .13); add(G.tor(.03, .01, PI, 4, 8), c, x + .055, L1 + .02 + .055, .13, 0, 0, -HP);
    });
    // upper shelf: two syrup bottles, a bear cookie jar, a plant
    [[-.36, '#ff8f86'], [-.26, '#ffd25c']].forEach(([x, c]) => { add(G.cyl(.035, .04, .2, 10), c, x, L2 + .02 + .1, .12); add(G.cyl(.014, .014, .07, 8), c, x, L2 + .02 + .23, .12); add(G.cyl(.018, .018, .02, 8), CHAR, x, L2 + .02 + .27, .12); });
    add(G.sph(.1, 14, 10), '#f6d6ae', -.04, L2 + .02 + .1, .12, 0, 0, 0, [1, .95, .9]); for (const sx of [-1, 1]) add(G.sph(.035, 8, 6), '#d9944f', -.04 + sx * .07, L2 + .02 + .19, .12);
    add(G.cyl(.08, .08, .05, 14), '#e8f4f6', -.04, L2 + .02 + .2, .12);
    potPlant(add, .26, L2 + .02, .12, pc, 1.3);
  }));
};
// the café's own sign (wall, span 1): an arched board with a cup and a loaf painted on, hung on two chains
const cafeSignTex = () => tex('shop-cafesign', 256, 256, (c, w, h) => {
  c.fillStyle = '#fff4e2'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffffff'; c.strokeStyle = '#6b3f2a'; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(34, 60); c.lineTo(40, 98); c.lineTo(68, 98); c.lineTo(74, 60); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.arc(78, 74, 7, -HP, HP); c.stroke(); steamDraw(c, 54, 52, .8, 'rgba(107,63,42,.8)');
  c.fillStyle = '#e8a456'; ell(c, 92, 84, 22, 14); c.strokeStyle = '#b06a2a'; c.lineWidth = 2; for (const dx of [-8, 0, 8]) { c.beginPath(); c.moveTo(92 + dx - 3, 76); c.lineTo(92 + dx + 3, 90); c.stroke(); }
  txt(c, 'CAFE', 64, 22, 18, '#6b3f2a'); txt(c, '빵과 커피', 64, 114, 12, '#a8693f');
}, { text: true });
B.cafesign = (f, T) => {
  const wood = col(T, 'woodD'), cy = 1.95, SW = .62, SH = .62;
  f.add(mc('cafesign|' + wood, ({ add, tube }) => {
    add(G.box(SW + .08, SH + .08, .04, .03), wood, 0, cy, .04);
    add(G.cyl(SW / 2 + .04, SW / 2 + .04, .04, 24, false), wood, 0, cy + SH / 2, .04, HP, 0, 0, [1, 1, .55]);
    tube([-.2, cy + SH / 2 + .1, .04], [0, cy + SH / 2 + .32, .01], .006, STEEL2); tube([.2, cy + SH / 2 + .1, .04], [0, cy + SH / 2 + .32, .01], .006, STEEL2);
    add(G.sph(.016, 8, 6), STEEL2, 0, cy + SH / 2 + .32, .01);
  }));
  f.add(mg('cafesign-print', mat('#ffffff', { map: cafeSignTex() }), ({ add }) => add(new THREE.PlaneGeometry(SW, SH), 0, cy, .062)));
};
// a stack of red shopping baskets by the door (floor, 1×1)
B.basketstack = (f, T) => {
  f.add(mc('basketstack', ({ add }) => {
    for (let k = 0; k < 4; k++) {
      const y = .02 + k * .075, r = k % 2 ? .05 : -.04;
      add(G.box(.5, .2, .36, .03), RED, r * .4, y + .1, r * .2, 0, r, 0);
      add(G.box(.42, .02, .28, .01), shade(RED, -.25), r * .4, y + .2 + .002, r * .2, 0, r, 0);   // the open top
      for (const sx of [-1, 1]) add(G.box(.008, .08, .2, .003), shade(RED, -.25), r * .4 + sx * .252, y + .11, r * .2, 0, r, 0);   // the side grips
      for (const dx of [-.15, 0, .15]) add(G.box(.09, .022, .006, .003), shade(RED, -.3), r * .4 + dx, y + .1, r * .2 + .182, 0, r, 0);   // the mesh slits
    }
    // the top basket's two black handles, folded over
    for (const sz of [-1, 1]) add(G.tor(.15, .014, PI, 4, 12), '#2a1d33', .0, .445, sz * .12, sz * 1.15, .05, 0);
  }));
};
// 빨래방: a washing line high across a wall (o.len long), socks and little tees pegged on it
B.sockline = (f, T, o = {}) => {
  const L = o.len || 2.4, Y = 2.5, sag = .08, n = 24, at = t => [(-.5 + t) * L, Y - sag * 4 * t * (1 - t), .09];
  const cols = ['#ff8f86', '#ffd25c', '#7fd6c0', '#8fd3f4', '#ffffff', '#b9a6ff', '#ff9fb5'];
  f.add(mc('sockline|' + L, ({ add, tube }) => {
    for (let i = 0; i < n; i++) tube(at(i / n), at((i + 1) / n), .007, '#f6efe4');
    for (const t of [0, 1]) { const [x] = at(t); add(G.box(.05, .05, .1, .01), STEEL2, x, Y, .05); }
    const things = Math.max(4, Math.round(L / .42));
    for (let k = 0; k < things; k++) {
      const t = (k + .7) / (things + .4), [x, y, z] = at(t), c = cols[k % cols.length], tilt = ((k * 37) % 9 - 4) * .02;
      add(G.box(.025, .06, .025, .006), WOOD_PEG, x, y - .01, z);
      if (k % 3 === 2) {   // a little tee
        add(G.box(.2, .24, .02, .02), c, x, y - .15, z, 0, 0, tilt); for (const sx of [-1, 1]) add(G.box(.09, .08, .02, .015), c, x + sx * .13, y - .08, z, 0, 0, tilt + sx * .5);
      } else {             // a sock
        add(G.box(.08, .22, .025, .02), c, x, y - .13, z, 0, 0, tilt); add(G.box(.12, .07, .025, .02), c, x + .03, y - .26, z, 0, 0, tilt);
        add(G.box(.085, .04, .028, .01), WHITE, x, y - .045, z, 0, 0, tilt);
      }
    }
  }));
};
const WOOD_PEG = '#e8bb82';
// the laundry's how-to poster (wall, span 1): 세탁 안내 — coin, soap, start
const washTex = () => tex('shop-washguide', 256, 320, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#5aa9ec'; c.fillRect(0, 0, w, 30);
  txt(c, '세탁 안내', w / 2, 16, 15, '#ffffff');
  [['동전 넣기', '#ffd23f'], ['세제 넣기', '#7fd6c0'], ['시작!', '#ff8f86']].forEach(([t, cc], k) => {
    const y = 52 + k * 36; c.fillStyle = cc; blob(c, 22, y, 11); txt(c, String(k + 1), 22, y + 1, 12, '#ffffff'); txt(c, t, 44, y, 12, '#33406a', { align: 'left' });
  });
  c.fillStyle = '#cdeefc'; for (let k = 0; k < 6; k++) blob(c, 96 + (k % 3) * 10, 136 + Math.floor(k / 3) * 9, 4 + (k % 2));
}, { text: true });
B.washguide = (f, T) => {
  const PW = .46, PH = .58, cy = 1.62;
  f.add(mc('washguide', ({ add }) => { add(G.box(PW + .04, PH + .04, .006, .003), '#5aa9ec', 0, cy, .004); add(G.pbox(.09, .03, .004), TAPE, 0, cy + PH / 2 + .01, .012); }));
  f.add(mg('washguide-print', mat('#ffffff', { map: washTex() }), ({ add }) => add(new THREE.PlaneGeometry(PW, PH), 0, cy, .012)));
};
// a door mat, '어서 오세요' (floor, 1×1, flat)
const matTex = c1 => tex('shop-doormat|' + c1, 256, 160, (c, w, h) => {
  c.fillStyle = tint(c1); c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.setLineDash([4, 3]); c.strokeRect(6, 6, w - 12, h - 12); c.setLineDash([]);
  txt(c, '어서 오세요', w / 2, h / 2, 14, '#ffffff');
}, { text: true });
B.doormat = (f, T, o = {}) => {
  const c1 = o.color || col(T, 'accent');
  f.add(mc('doormat|' + c1, ({ add }) => add(G.box(.86, .02, .56, .008), shade(c1, -.12), 0, .01, 0)));
  f.add(mg('doormat-print|' + c1, mat('#ffffff', { map: matTex(c1) }), ({ add }) => add(new THREE.PlaneGeometry(.8, .5), 0, .022, 0, -HP, 0, 0)));
};
// an A-frame chalk sign, '오늘의 케이크' (floor, 1×1)
const todayTex = chalk => tex('shop-today|' + chalk, 256, 320, (c, w, h) => {
  c.fillStyle = tint(chalk); c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; c.setLineDash([4, 3]); c.strokeRect(6, 6, w - 12, h - 12); c.setLineDash([]);
  txt(c, 'TODAY', w / 2, 24, 17, '#ffe27a'); txt(c, '오늘의 케이크', w / 2, 46, 12, '#ffffff');
  c.fillStyle = '#ffffff'; rr(c, 34, 80, 60, 28, 4); c.fillStyle = '#ffb3c6'; rr(c, 34, 72, 60, 12, 4); c.fillStyle = '#ff5a73'; blob(c, 64, 66, 6);
  txt(c, '딸기 생크림', w / 2, 128, 11, '#ffffff'); txt(c, '5.0', w / 2, 146, 12, '#ffb3c6');
}, { text: true });
B.aframe = (f, T) => {
  const wood = col(T, 'woodD'), chalk = col(T, 'chalk'), H = .82, A = .2;
  f.add(mc('aframe|' + wood, ({ add }) => {
    for (const s of [-1, 1]) { add(G.box(.5, H, .04, .012), wood, 0, H / 2 * Math.cos(A), s * (H / 2 * Math.sin(A) + .02), -s * A, 0, 0); }
    add(G.box(.48, .03, .03, .01), wood, 0, H * Math.cos(A) - .01, 0);
  }));
  f.add(mg('aframe-chalk|' + chalk, mat('#ffffff', { map: todayTex(chalk) }), ({ add }) => {
    add(new THREE.PlaneGeometry(.42, .62), 0, H / 2 * Math.cos(A) + .03, H / 2 * Math.sin(A) + .045, -A, 0, 0);
  }));
};

// put() without the scale argument (kit.put also resets rotation)
function put3(o, x, y, z) { o.position.set(x, y, z); return o; }

export const SHOP_BUILDERS = B;

export const SHOP_INFO = {
  // 편의점 안
  snackshelf: { w: 2, d: 1, name: '과자 진열대', price: 320, region: 'shop' },
  drinkfridge: { w: 2, d: 1, name: '음료 냉장고', price: 520, region: 'shop' },
  counter2: { w: 2, d: 1, name: '계산대', price: 460, region: 'shop' },
  icecreamchest: { w: 1, d: 1, name: '아이스크림 냉동고', price: 360, region: 'shop' },
  magazinerack: { w: 1, d: 1, name: '잡지 꽂이', price: 180, region: 'shop' },
  cupnoodlebar: { w: 2, d: 1, name: '컵라면 코너', price: 340, region: 'shop' },
  // 빨래방
  washer3: { w: 1, d: 1, name: '코인 세탁기', price: 480, region: 'shop' },
  foldingtable2: { w: 2, d: 1, name: '빨래 개는 테이블', price: 240, region: 'shop' },
  vendcoin: { w: 1, d: 1, name: '동전 교환기', price: 420, region: 'shop' },
  // 동네 카페
  espresso: { w: 2, d: 1, name: '카페 커피머신', price: 600, region: 'shop' },
  pastrycase: { w: 1, d: 1, name: '빵 진열장', price: 380, region: 'shop' },
  cafetable: { w: 1, d: 1, name: '카페 테이블 세트', price: 220, region: 'shop' },
  // 벽
  menuboard: { wall: true, span: 2, name: '메뉴판', price: 260, region: 'shop' },
  clockposter: { wall: true, span: 1, name: '가게 벽시계', price: 150, region: 'shop' },
  // 룩 (look.js shop recipes): decoration only, never sold or offered
  welcome: { wall: true, span: 2, name: '웰컴 글자판', hidden: true },
  yummyposter: { wall: true, span: 2, name: '맛있다 포스터', hidden: true },
  saleposters: { wall: true, span: 1, name: '세일 포스터', hidden: true },
  menutrio: { wall: true, span: 2, name: '메뉴판 셋', hidden: true },
  cupshelf: { wall: true, span: 1, name: '컵 선반', hidden: true },
  cafesign: { wall: true, span: 1, name: '카페 간판', hidden: true },
  basketstack: { w: 1, d: 1, name: '장바구니', hidden: true },
  aframe: { w: 1, d: 1, name: '입간판', hidden: true },
  sockline: { wall: true, span: 1, high: true, name: '양말 빨랫줄', hidden: true },
  washguide: { wall: true, span: 1, pad: .05, name: '세탁 안내', hidden: true },   // (pad: only half a tile wide)
  doormat: { w: 1, d: 1, name: '현관 매트', hidden: true },
};

// Suggested room themes (stages.js THEMES shape; every APT_THEMES.apt key). Extra keys these props read: cooler, vend,
// machine, stool, washer, chalk.
const BASE_T = { trim: '#ffffff', sheet: '#ffffff', pillow: '#fff3d6', rug2: '#ffffff', knob: '#ffd84a', top: '#fffaf0' };
const APT_KEYS = { sofa: '#fff0d8', quilt: '#ff6b57', kimchi: '#9b3b4b', cloth: '#8fcf9a', throw: '#7fa8e8' };
export const SHOP_THEMES = {
  konbini: { ...BASE_T, ...APT_KEYS, name: '편의점 안', friend: null, bg: ['#eefaf6', '#d6f2e8'], base: '#a9dccb', floorKind: 'checker', floor: '#fdfdfb', floor2: '#e2eaee',
    wallKind: 'tile', wall: '#f6fdf9', wall2: '#c4ecdd', wainscot: '#8fdcc4', wallEdge: '#fbfffd',
    wood: '#ecb985', woodD: '#c58a55', body: '#ffffff', accent: '#4fc7a8', accent2: '#4f9fe8', accent3: '#ffc23d', door: '#bfe6d2', fabric: '#fff0d8', fabric2: '#ffe3bf',
    curtain: '#fff3d6', rug: '#e5f6ef', pot: '#f3a272',
    cooler: '#3f86d8', vend: '#ffc23d', machine: '#4fae86', stool: '#ff5a4a', washer: '#ffffff', chalk: '#35584a' },
  laundry: { ...BASE_T, ...APT_KEYS, name: '빨래방', friend: null, bg: ['#eef7ff', '#d8ecfb'], base: '#a9cfee', floorKind: 'checker', floor: '#ffffff', floor2: '#cfe7f8',
    wallKind: 'stripe', wall: '#f4faff', wall2: '#dcefff', wainscot: '#9fcff2', wallEdge: '#fafdff',
    wood: '#eebf86', woodD: '#c98f58', body: '#ffffff', accent: '#7fd6c0', accent2: '#5aa9ec', accent3: '#ffc23d', door: '#cfe6f7', fabric: '#fff0d8', fabric2: '#ffe3bf',
    curtain: '#fff3d6', rug: '#e2f1fc', pot: '#f3a272',
    cooler: '#3f86d8', vend: '#ffc23d', machine: '#4fae86', stool: '#ff8f5a', washer: '#ffffff', chalk: '#35584a' },
  cafe: { ...BASE_T, ...APT_KEYS, name: '동네 카페', friend: null, bg: ['#f6f4e6', '#e6edd4'], base: '#c9b48f', floorKind: 'planks', floor: '#e4b47e', floor2: '#b98250',
    wallKind: 'stripe', wall: '#eef5e2', wall2: '#e2eed2', wainscot: '#7fae7a', wallEdge: '#f7fbef',
    wood: '#e8b47c', woodD: '#9c6a42', body: '#fffaf0', accent: '#6cb87e', accent2: '#8fd3f4', accent3: '#ffc23d', door: '#cfe6c4', fabric: '#fff0d8', fabric2: '#ffe3bf',
    curtain: '#fff3d6', rug: '#efe6d0', pot: '#f3a272',
    cooler: '#3f86d8', vend: '#ffc23d', machine: '#4f9f7a', stool: '#6cb87e', washer: '#ffffff', chalk: '#34574a' },
};

// ═════════════════════════════════════════════ ITEMS ═════════════════════════════════════════════
// Same shape as items.js ITEMS: { name, h, flat?, build() } → Group, origin bottom centre.
//   Object.assign(ITEMS, SHOP_ITEMS)   (and push the keys into TARGET_POOL / a theme's pool to make them stage targets)
export const SHOP_ITEMS = {
  // 영수증: a long receipt with its ends curling up (printed lines, a total, a barcode)
  receipt: { name: '영수증', h: .04, flat: true, build() {
    const g = grp();
    g.add(mg('it-receipt', mat('#ffffff', { map: atlas(), side: DS }), ({ addM }) => {
      const pg = cellUV(new THREE.PlaneGeometry(.155, .34, 1, 12), RG.receipt), p = pg.attributes.position;   // (a little wider — ① 10/21)
      for (let i = 0; i < p.count; i++) { const yy = p.getY(i) / .17; p.setZ(i, .028 * Math.pow(Math.abs(yy), 3) + (yy > 0 ? .01 * yy * yy : 0)); }
      pg.computeVertexNormals();
      addM(pg, xf(0, .004, 0, -HP, 0, .25));
    }));
    return g;
  } },
  // 삼각 샌드위치: a konbini triangle sandwich — bread wedge, lettuce and egg on the cut face, a label on the back
  sandwich: { name: '삼각 샌드위치', h: .2, build() {
    const g = grp();
    const tri = (s) => { const sh = new THREE.Shape(), r = .02 * s; sh.moveTo(-.12 * s + r, 0); sh.lineTo(.12 * s - r, 0); sh.quadraticCurveTo(.12 * s, 0, .11 * s, .02 * s); sh.lineTo(.012 * s, .185 * s); sh.quadraticCurveTo(0, .2 * s, -.012 * s, .185 * s); sh.lineTo(-.11 * s, .02 * s); sh.quadraticCurveTo(-.12 * s, 0, -.12 * s + r, 0); return sh; };
    // two bread slices with lettuce, egg and ham between them (each filling a hair larger, so its edge shows)
    g.add(mc('it-sandwich', ({ addM }) => {
      for (const z of [.0125, -.0425]) addM(G.ext(tri(1), .03, 0, 4), xf(0, 0, z), '#fff6e2');
      addM(G.ext(tri(1.07), .008, 0, 4), xf(0, 0, .0045), '#7fd06a');
      addM(G.ext(tri(1.04), .009, 0, 4), xf(0, 0, -.0045), '#ffd84a');
      addM(G.ext(tri(1.02), .008, 0, 4), xf(0, 0, -.0125), '#ff9fb5');
    }));
    g.add(mg('it-sandwich-label', atlasMat(), ({ add }) => {
      add(quadGeo(.16, .048, RG.sand), 0, .055, .0425 + .006);
      add(quadGeo(.16, .048, RG.sand), 0, .055, -.0425 - .006, 0, PI, 0);
    }));
    return g;
  } },
  // 양말 한 켤레: a pair of striped socks lying side by side (red heel and toe, mustard stripes)
  sockpair: { name: '양말 한 켤레', h: .05, flat: true, build() {
    const g = grp();
    // m = 1: toe to the right; m = -1: the mirrored sock (ExtrudeGeometry fixes the winding of a mirrored outline)
    const sockShape = m => {
      const s = new THREE.Shape();
      s.moveTo(-.045 * m, .2); s.lineTo(.045 * m, .2); s.lineTo(.045 * m, .06); s.lineTo(.12 * m, .06); s.quadraticCurveTo(.17 * m, .055, .17 * m, .005); s.quadraticCurveTo(.168 * m, -.045, .12 * m, -.045);
      s.lineTo(0, -.045); s.quadraticCurveTo(-.045 * m, -.045, -.045 * m, 0); s.lineTo(-.045 * m, .2);
      return s;
    };
    g.add(mc('it-sockpair', ({ addM }) => {
      [[-1, -.055, .1, WHITE, TOMATO], [1, .055, -.1, SKY2, '#3f86d8']].forEach(([m, x, rz, base, acc]) => {
        const M = xf(x, .007, .03, 0, 0, 0, .85).multiply(xf(0, 0, 0, -HP, 0, rz));
        addM(G.ext(sockShape(m), .024, .008, 6), M, base);
        for (const y of [.13, .165]) addM(G.pbox(.098, .016, .006), M.clone().multiply(xf(0, y, .032 + .006)), MUSTARD);
        addM(G.pbox(.1, .03, .006), M.clone().multiply(xf(0, .19, .032 + .006)), acc);
        addM(G.sph(.034, 10, 6), M.clone().multiply(xf(.135 * m, .006, .032 + .004, 0, 0, 0, [1, 1, .18])), acc);
        addM(G.sph(.03, 10, 6), M.clone().multiply(xf(-.012 * m, -.012, .032 + .004, 0, 0, 0, [1, 1, .18])), acc);
      });
    }));
    return g;
  } },
  // 테이크아웃 커피: a white takeaway cup with a kraft sleeve (café print) and a dark lid
  coffee: { name: '테이크아웃 커피', h: .27, build() {
    const g = grp();
    g.add(mc('it-coffee', ({ add }) => {
      add(G.lathe([[0, 0], [.052, 0], [.056, .004], [.072, .2], [0, .2]], 20), WHITE, 0, 0, 0);
      add(G.lathe([[0, .198], [.078, .198], [.08, .21], [.074, .222], [.054, .232], [.05, .245], [0, .245]], 20), '#4a3a36', 0, 0, 0);
      add(G.box(.024, .006, .012, .002), INK, 0, .244, .03);
    }));
    g.add(mg('it-coffee-sleeve', atlasMat(), ({ add }) => {
      const rb = .056 + (.06 - .004) / .196 * .016 + .006, rt = .056 + (.15 - .004) / .196 * .016 + .006;
      add(cellUV(new THREE.CylinderGeometry(rt, rb, .09, 20, 1, true), RG.sleeve), 0, .105, 0);
    }));
    return g;
  } },
  // 복권: a lottery ticket (numbers, a scratch panel, a gold 1등 seal)
  lottery: { name: '복권', h: .02, flat: true, build() {
    const g = grp();
    g.add(mc('it-lottery', ({ add }) => add(G.box(.22, .008, .12, .003), WHITE, 0, .004, 0, 0, .15, 0)));
    g.add(mg('it-lottery-print', atlasMat(), ({ add }) => add(quadGeo(.212, .114, RG.lotto), 0, .008 + .006, 0, -HP, 0, .15)));
    return g;
  } },
};

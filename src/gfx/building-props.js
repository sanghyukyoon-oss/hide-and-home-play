// Office-building props (빌딩): a lobby where Korean, Japanese and American office buildings meet — an elevator with a
// floor indicator and a directory, a wood-slat reception desk with a bell, a teal tufted velvet sofa, a wall of mailboxes, a big
// fiddle-leaf fig in a navy terrazzo planter, speed-gate turnstiles, a cork notice board, a water cooler and a lost-and-found
// box — and its rooftop: a blue water tank on a stand, an AC outdoor unit with a pigeon, styrofoam vegetable boxes, a laundry
// line with a flowered blanket, a sun lounger, a TV antenna with a dish and the stairwell door. Same contract as apt-props.js:
//   builder(f, T, opts) fills a Furn. Origin = footprint centre on the floor, the piece faces +z, back toward -z, 1 tile = 1.
//   Wall pieces (wall: true, span 1|2) hang on a wall's inner face: origin at the face, floor height, +z into the room.
//   parts open / lift / slide / flip; spots: inside (needs its part open) | under/behind (visible but tucked) | on (plain sight).
//   Lockable parts carry p.lockable = true and p.lockKind ('pad' | 'code'), with f.lockAt where the lock hardware goes.
// Toy-set rules (as apt-props.js): chunky silhouettes, flat matte colours, few draw calls. Static decor is merged into ONE
// vertex-coloured mesh per piece (mc); signage and posters share one label atlas (mg); stone, brushed steel, cork, terrazzo,
// slats, concrete and fabric prints are world-sized canvas textures (planarUV); every moving part is its own mesh.
// Decals / prints sit >= .006 in front of the face they are on (no coplanar faces of two colours).
//   import { BUILDING_BUILDERS, BUILDING_INFO, BUILDING_THEMES, BUILDING_ITEMS } from './gfx/building-props.js';
//   registerFurniture(BUILDING_BUILDERS, BUILDING_INFO); Object.assign(ITEMS, BUILDING_ITEMS);
//   for (const k in BUILDING_THEMES) THEMES[k] = { ...THEMES.my, ...BUILDING_THEMES[k] };
// rooftopdoor is a little stairwell house standing against the wall (its roof clears a 1.6 m alley-wall cap).
// Bright palette: white & navy, honey wood, travertine, sky, mint, mustard, tomato; the roof adds sky blue, brick and a red blanket.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mat, mesh, geo, canvasTex, texCache, roundRect, shade, starShape, STYLE } from './kit.js';
import { clothBend, clothWave, clothSlab } from './clothbend.js';
import { tr } from '../i18n.js';

const PI = Math.PI, HP = PI / 2;

// ── palette ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Theme keys first (pieces follow the room they are bought into). Extra keys only the building themes set:
// navy (lobby navy), stone (travertine), sofa (lobby sofa), tank (water tank), rdoor (stairwell door), blanket (the 이불 on
// the line), lounger (sun-lounger cushion), plaster (stairwell walls).
const K = { wood: '#e9b884', woodD: '#c4905c', accent: '#7fd6c0', accent2: '#8fd3f4', accent3: '#ffc23d', pot: '#e07a52',
  navy: '#34508a', stone: '#ecdec6', sofa: '#2f9e8f', tank: '#3f9be0', rdoor: '#3f9e86', blanket: '#e8475a', lounger: '#3fa9d6',
  plaster: '#eee8de', concrete: '#d9d2c6' };
const col = (T, k) => (T && T[k]) || K[k];
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', SKY = '#8fd3f4', SKY2 = '#cdeefc', MUSTARD = '#ffc23d', TOMATO = '#ff6b57',
  CORAL = '#ff9f8a', MINT = '#7fd6c0', BLUSH = '#ff9fb5', LEAF = '#6cc46a', LEAF2 = '#4ea85a', LEAF3 = '#8fd47a', ORANGE = '#ffab4c',
  STEEL = '#c9cfe0', STEEL2 = '#a9b2c8', ALU = '#dde2ea', DARK = '#5b5672', CHAR = '#3b3550', SOIL = '#8a5a3c', BROWN = '#c98a52',
  RED = '#ff4b4b', YELLOW = '#ffd23f', GOLD = '#ffc93c', NAVY2 = '#26396a', SCREEN = '#232b40', STYRO = '#f7f6f1', GREY = '#9a97a8',
  PIGEON = '#a9aec2', PIGEON2 = '#8a8fa6';

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
  const g = geo('bmc|' + STYLE.mode + '|' + key, () => {
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
// One mesh from many pieces sharing one material (labels, prints, stone, steel). fn gets { add, addM, P }; keeps uvs.
//   P(w, h, d, x, y, z, s, r) adds a box with world-sized (planar) uvs, s = world size of one texture repeat.
function mg(key, m, fn) {
  const g = geo('bmg|' + key, () => {
    const list = [];
    const addM = (src, mm) => {
      const c = src.index ? src.toNonIndexed() : src.clone();
      for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') c.deleteAttribute(k);
      c.applyMatrix4(mm); list.push(c);
    };
    const add = (src, x, y, z, rx, ry, rz, s) => addM(src, xf(x, y, z, rx, ry, rz, s));
    const P = (w, h, d, x, y, z, s = .6, r = 0) => addM(planarUV(ni(r > 0 ? G.box(w, h, d, r) : G.pbox(w, h, d)).translate(x, y, z), s), I4);
    fn({ add, addM, P });
    const out = mergeGeometries(list, false); out.name = key;
    return out;
  });
  return mesh(g, m);
}
// Box-mapped uvs in world units (a print is the same size on every face).
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
// The same box mapping chosen per triangle (by its face normal, not each corner's): on a rounded edge or a rolled arm a
// triangle never mixes two projections, so a print keeps its size and direction there too — no smeared stripes along the
// bevels (로비 소파 누빔, user 10/21: "쇼파만 uv 박스나 그냥 큐브다 좀 제대로 나오게"). Needs a non-indexed geometry (ni).
const FA = new THREE.Vector3(), FB = new THREE.Vector3(), FC = new THREE.Vector3();
function faceUV(g, s) {
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i + 2 < p.count; i += 3) {
    FA.fromBufferAttribute(p, i); FB.fromBufferAttribute(p, i + 1).sub(FA); FC.fromBufferAttribute(p, i + 2).sub(FA); FB.cross(FC);
    const ax = Math.abs(FB.x), ay = Math.abs(FB.y), az = Math.abs(FB.z);
    for (let k = i; k < i + 3; k++) {
      const [u, v] = ay >= ax && ay >= az ? [p.getX(k), p.getZ(k)] : ax >= az ? [p.getZ(k), p.getY(k)] : [p.getX(k), p.getY(k)];
      uv[k * 2] = u / s; uv[k * 2 + 1] = v / s;
    }
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
// a print wrapped round part of an upright cylinder, centred on +z
const bandGeo = (r, h, rc, a = 2.2, seg = 18) => cellUV(new THREE.CylinderGeometry(r, r, h, seg, 1, true, -a / 2, a), rc);
function rrShape(x, y, w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// A T-shirt silhouette in the xy plane, collar at y = 0, hem at y = -.46.
function shirtShape() {
  const s = new THREE.Shape(), P = [[-.06, 0], [-.135, -.014], [-.2, -.09], [-.165, -.152], [-.13, -.122], [-.13, -.46], [.13, -.46], [.13, -.122], [.165, -.152], [.2, -.09], [.135, -.014], [.06, 0]];
  s.moveTo(...P[0]); for (const p of P.slice(1)) s.lineTo(...p);
  s.quadraticCurveTo(0, -.065, -.06, 0);
  return s;
}
// A fiddle-leaf-fig leaf: a broad violin-shaped blade; stem joint at the origin, tip at (0, 1).
function figShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(.22, .02, .3, .2, .26, .4); s.bezierCurveTo(.24, .52, .34, .66, .3, .82); s.quadraticCurveTo(.22, 1.0, 0, 1.0);
  s.quadraticCurveTo(-.22, 1.0, -.3, .82); s.bezierCurveTo(-.34, .66, -.24, .52, -.26, .4); s.bezierCurveTo(-.3, .2, -.22, .02, 0, 0);
  return s;
}
// A grey city pigeon (the roof's regulars), facing +x before ry; feet on y = 0.
function pigeon(add, tube, x, y, z, ry = 0, s = 1) {
  const M = (dx, dy, dz) => { const c = Math.cos(ry), sn = Math.sin(ry); return [x + (dx * c + dz * sn) * s, y + dy * s, z + (-dx * sn + dz * c) * s]; };
  const at = (geom, color, dx, dy, dz, rx, rz, sc) => add(geom, color, ...M(dx, dy, dz), rx || 0, ry, rz || 0, sc);
  at(G.sph(.075 * s, 12, 9), PIGEON, 0, .085, 0, 0, -.15, [1.35, .95, 1]);
  at(G.box(.11 * s, .03 * s, .08 * s, .012 * s), PIGEON2, -.1, .1, 0, 0, .35);
  for (const k of [-1, 1]) at(G.sph(.045 * s, 10, 8), PIGEON2, -.01, .1, k * .052, 0, -.2, [1.4, .7, .35]);
  at(G.sph(.042 * s, 10, 8), '#8fc9b8', .06, .14, 0, 0, 0, [1, 1, 1.05]);
  at(G.sph(.045 * s, 12, 9), PIGEON, .085, .185, 0);
  at(G.cone(.012 * s, .04 * s, 6), '#3b3550', .135, .18, 0, 0, -HP);
  at(G.sph(.008 * s, 6, 5), WHITE, .118, .192, 0, 0, 0, [1, .8, 1.6]);
  for (const k of [-1, 1]) { at(G.sph(.009 * s, 6, 5), INK, .1, .2, k * .035); at(G.cyl(.006 * s, .006 * s, .04 * s, 5), '#ff8a6a', .01, .02, k * .025); }
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
function clip(c, x, y, w, h, fn) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); fn(); c.restore(); }
function daisy(c, x, y, r, petal = '#ffffff', mid = '#ffc23d') { c.fillStyle = petal; for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; blob(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * .78); } c.fillStyle = mid; blob(c, x, y, r * .6); }
// the game's mochi hero, for photos and posters
function mochi(c, x, y, r, body = '#ffffff') {
  c.fillStyle = body; c.beginPath(); c.ellipse(x, y, r, r * .84, 0, 0, PI * 2); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1.1, r * .08); c.stroke();
  c.fillStyle = '#2a1d33'; blob(c, x - r * .34, y - r * .06, r * .1); blob(c, x + r * .34, y - r * .06, r * .1);
  c.fillStyle = '#ff9fb5'; blob(c, x - r * .58, y + r * .2, r * .14); blob(c, x + r * .58, y + r * .2, r * .14);
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1, r * .07); c.beginPath(); c.arc(x, y + r * .06, r * .14, .25, PI - .25); c.stroke();
}
function catHead(c, x, y, r) {
  c.beginPath(); c.moveTo(x - r * .92, y - r * .1); c.lineTo(x - r * .8, y - r * 1.18); c.lineTo(x - r * .28, y - r * .76);
  c.lineTo(x + r * .28, y - r * .76); c.lineTo(x + r * .8, y - r * 1.18); c.lineTo(x + r * .92, y - r * .1); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(x, y, r, r * .82, 0, 0, PI * 2); c.fill();
}
function drop(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r * 1.5); c.quadraticCurveTo(x + r * 1.1, y - r * .1, x + r * .95, y + r * .35); c.arc(x, y + r * .25, r, .1, PI - .1); c.quadraticCurveTo(x - r * 1.1, y - r * .1, x, y - r * 1.5); c.fill(); }
function scribble(c, x, y, w, rows, color, lw = 1.2) {
  c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round';
  for (let r = 0; r < rows; r++) { const yy = y + r * 7, L = w * (r === rows - 1 ? .55 : .9 - (r % 2) * .15); c.beginPath(); c.moveTo(x, yy); for (let k = 0; k <= 10; k++) c.lineTo(x + L * k / 10, yy + Math.sin(k * 1.7 + r) * 1.3); c.stroke(); }
}

// Label atlas, 1024² canvas = 512² drawing units.
const AT = 512, PXU = .5 / 1024;
const RC = (x, y, w, h) => [x / AT + PXU, 1 - (y + h) / AT + PXU, (x + w) / AT - PXU, 1 - y / AT - PXU];
const RG = {
  disp: RC(0, 0, 128, 40), info: RC(128, 0, 224, 56), mailsign: RC(352, 0, 160, 32), notice: RC(352, 32, 160, 28),
  dir: RC(0, 64, 128, 200), recycle: RC(128, 64, 96, 128), cat: RC(224, 64, 80, 104), yoga: RC(304, 64, 80, 104), inspect: RC(384, 64, 128, 72),
  flea: RC(384, 136, 96, 120), sticky: RC(480, 136, 32, 32), sticky2: RC(480, 168, 32, 32), card: RC(128, 192, 64, 88), water: RC(192, 168, 112, 48),
  cupnote: RC(304, 168, 80, 40), hand: RC(192, 216, 64, 48), visit: RC(256, 216, 64, 40), mag: RC(320, 208, 48, 64),
  lost: RC(240, 280, 160, 80), reader: RC(400, 264, 64, 80), staff: RC(464, 264, 48, 80),
  tank: RC(0, 360, 192, 40), ac: RC(192, 360, 112, 40), styroA: RC(304, 360, 160, 48), styroB: RC(0, 400, 160, 48), exit: RC(160, 400, 128, 44),
  doornote: RC(288, 408, 88, 104), dish: RC(376, 416, 64, 32), caution: RC(440, 416, 72, 32), btns: RC(0, 448, 48, 64), cap: RC(48, 448, 112, 32),
  note: RC(160, 448, 48, 48), book: RC(208, 448, 80, 56),
};
const MAILN = (r, k) => RC(k * 40, 280 + r * 18, 40, 18);   // mailbox number plates, 6 × 4
const TAG = i => RC(464, 344 + i * 24, 48, 24);              // plant labels

function drawDisp(c, x, y, w, h) {
  c.fillStyle = '#1d2540'; c.fillRect(x, y, w, h);
  c.fillStyle = '#2b3557'; roundRect(c, x + 4, y + 4, w - 8, h - 8, 6); c.fill();
  c.fillStyle = '#ffb547'; c.beginPath(); c.moveTo(x + 22, y + 10); c.lineTo(x + 32, y + 24); c.lineTo(x + 12, y + 24); c.closePath(); c.fill();
  c.fillStyle = '#5a6488'; c.beginPath(); c.moveTo(x + w - 22, y + 30); c.lineTo(x + w - 12, y + 16); c.lineTo(x + w - 32, y + 16); c.closePath(); c.fill();
  txt(c, '7', x + w / 2 - 6, y + h / 2 + 1, 30, '#ffb547');
  txt(c, 'F', x + w / 2 + 14, y + h / 2 + 5, 15, '#ffb547');
}
function drawInfo(c, x, y, w, h) {
  c.fillStyle = '#34508a'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#ffd27a'; c.lineWidth = 2; roundRect(c, x + 4, y + 4, w - 8, h - 8, 8); c.stroke();
  c.fillStyle = '#ffffff'; blob(c, x + 30, y + h / 2, 17);
  txt(c, 'i', x + 30, y + h / 2 + 1, 26, '#34508a');
  txt(c, '안내', x + 84, y + h / 2 + 1, 30, '#ffffff');
  txt(c, 'INFORMATION', x + 166, y + h / 2 - 8, 15, '#ffd27a');
  txt(c, '受付 · 案内', x + 166, y + h / 2 + 11, 12, '#cfe0ff');
}
function drawMailSign(c, x, y, w, h) {
  c.fillStyle = '#34508a'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ffffff'; roundRect(c, x + 10, y + 8, 24, 16, 2); c.fill();
  c.strokeStyle = '#34508a'; c.lineWidth = 1.6; line(c, [[x + 11, y + 9], [x + 22, y + 18], [x + 33, y + 9]]);
  txt(c, '우편함', x + 68, y + h / 2 + 1, 18, '#ffffff');
  txt(c, 'MAIL · 郵便', x + 124, y + h / 2 + 1, 11, '#ffd27a');
}
function drawNotice(c, x, y, w, h) {
  c.fillStyle = '#34508a'; c.fillRect(x, y, w, h);
  txt(c, '게시판', x + 52, y + h / 2 + 1, 17, '#ffffff');
  txt(c, 'NOTICE', x + 112, y + h / 2 + 1, 13, '#ffd27a');
  c.fillStyle = '#ff6b57'; blob(c, x + 14, y + h / 2, 4); blob(c, x + w - 14, y + h / 2, 4);
}
function drawDir(c, x, y, w, h) {
  c.fillStyle = '#26396a'; c.fillRect(x, y, w, h);
  c.fillStyle = '#34508a'; c.fillRect(x, y, w, 38);
  txt(c, '층별 안내', x + w / 2, y + 15, 16, '#ffffff');
  txt(c, 'FLOOR GUIDE', x + w / 2, y + 30, 9, '#ffd27a');
  const rows = [['7F', '옥상 정원', '#6cc46a'], ['6F', '회의실', '#8fd3f4'], ['5F', '디자인팀', '#ff9fb5'], ['4F', '개발팀', '#b9a6ff'],
    ['3F', '카페 ☕', '#ffab4c'], ['2F', '헬스장', '#7fd6c0'], ['1F', '로비', '#ffc23d']];
  rows.forEach(([f, n, cc], i) => {
    const yy = y + 50 + i * 21;
    if (i === 6) { c.fillStyle = 'rgba(255,210,122,.22)'; c.fillRect(x + 4, yy - 9, w - 8, 18); }
    c.fillStyle = cc; roundRect(c, x + 8, yy - 7, 26, 14, 3); c.fill();
    txt(c, f, x + 21, yy + 1, 10, '#26396a');
    txt(c, n, x + 42, yy + 1, 12, '#ffffff', { align: 'left' });
  });
  c.fillStyle = '#ff6b57'; blob(c, x + w - 14, y + 176, 5);
  txt(c, '지금 여기', x + w - 40, y + 190, 9, '#ffd27a');
}
function drawRecycle(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#4fae5a'; c.fillRect(x, y, w, 26);
  txt(c, '분리수거', x + w / 2, y + 13, 16, '#ffffff');
  const B = [['종이', '#3f9be0'], ['플라', '#ffc23d'], ['유리', '#4fae5a'], ['캔', '#a9b2c8']];
  B.forEach(([n, cc], i) => {
    const bx = x + 8 + (i % 2) * 44, by = y + 34 + Math.floor(i / 2) * 44;
    c.fillStyle = cc; roundRect(c, bx + 6, by + 4, 26, 26, 4); c.fill(); c.fillRect(bx + 3, by, 32, 6);
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(bx + 19, by + 9); c.lineTo(bx + 26, by + 21); c.lineTo(bx + 12, by + 21); c.closePath(); c.fill();
    txt(c, n, bx + 19, by + 37, 10, '#2a1d33');
  });
  txt(c, '매주 화 · 금 저녁', x + w / 2, y + h - 9, 9, '#ff6b57');
}
function drawLostCat(c, x, y, w, h) {
  c.fillStyle = '#fffdf4'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ff4b4b'; c.fillRect(x, y, w, 20);
  txt(c, '고양이를', x + w / 2, y + 8, 10, '#ffffff'); txt(c, '찾습니다', x + w / 2, y + 16, 9, '#ffe3e3');
  c.fillStyle = '#cdeefc'; c.fillRect(x + 10, y + 24, w - 20, 38);
  c.fillStyle = '#ffab4c'; catHead(c, x + w / 2, y + 46, 13);
  c.fillStyle = '#2a1d33'; blob(c, x + w / 2 - 5, y + 45, 1.8); blob(c, x + w / 2 + 5, y + 45, 1.8);
  c.fillStyle = '#ff7f9e'; blob(c, x + w / 2, y + 50, 1.6);
  txt(c, '치즈 · 3살', x + w / 2, y + 71, 10, '#2a1d33');
  c.strokeStyle = '#c9c3d9'; c.lineWidth = 1; for (let k = 1; k < 6; k++) line(c, [[x + k * w / 6, y + 80], [x + k * w / 6, y + h]]);
  c.fillStyle = '#8a85a0'; for (let k = 0; k < 6; k++) { c.save(); c.translate(x + k * w / 6 + w / 12, y + 92); c.rotate(-HP); txt(c, '010-', 0, 0, 7, '#8a85a0'); c.restore(); }
}
function drawYoga(c, x, y, w, h) {
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#b9e6ff'); g.addColorStop(1, '#e8fbef'); c.fillStyle = g; c.fillRect(x, y, w, h);
  txt(c, '점심 요가', x + w / 2, y + 13, 13, '#34508a');
  txt(c, 'YOGA', x + w / 2, y + 27, 11, '#ff6b57');
  c.fillStyle = '#9be38f'; c.beginPath(); c.ellipse(x + w / 2, y + 86, 34, 9, 0, 0, PI * 2); c.fill();
  mochi(c, x + w / 2, y + 62, 14);
  c.strokeStyle = '#2a1d33'; c.lineWidth = 1.6; line(c, [[x + w / 2 - 13, y + 54], [x + w / 2 - 20, y + 42]]); line(c, [[x + w / 2 + 13, y + 54], [x + w / 2 + 20, y + 42]]);
  txt(c, '수 12:30 · 7F', x + w / 2, y + h - 8, 9, '#34508a');
}
function drawInspect(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#34508a'; c.fillRect(x, y, w, 20);
  txt(c, '엘리베이터 점검', x + w / 2, y + 10, 13, '#ffffff');
  c.fillStyle = '#d9d4e2'; for (let k = 0; k < 3; k++) c.fillRect(x + 10, y + 27 + k * 8, k === 2 ? 60 : 84, 3);
  txt(c, '10/20(화) 10~12시', x + w / 2 - 10, y + 60, 11, '#ff4b4b');
  c.save(); c.translate(x + w - 18, y + 38); c.rotate(.6); c.fillStyle = '#ffc23d'; c.fillRect(-3, -12, 6, 24); blob(c, 0, -13, 6); c.fillStyle = '#ffffff'; c.fillRect(-2, -20, 4, 7); c.restore();
}
function drawFlea(c, x, y, w, h) {
  c.fillStyle = '#ffd23f'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ffffff'; for (const [dx, dy, r] of [[12, 12, 6], [84, 20, 8], [10, 100, 7], [86, 104, 5]]) blob(c, x + dx, y + dy, r);
  txt(c, '플리마켓', x + w / 2, y + 18, 18, '#ff4b4b', { stroke: '#ffffff', sw: 4 });
  txt(c, 'フリマ · FLEA', x + w / 2, y + 36, 10, '#34508a');
  c.fillStyle = '#7fd6c0'; c.beginPath(); c.moveTo(x + 22, y + 50); c.lineTo(x + 30, y + 46); c.lineTo(x + 38, y + 50); c.lineTo(x + 42, y + 58); c.lineTo(x + 36, y + 60); c.lineTo(x + 36, y + 76); c.lineTo(x + 24, y + 76); c.lineTo(x + 24, y + 60); c.lineTo(x + 18, y + 58); c.closePath(); c.fill();
  c.fillStyle = '#ff9f8a'; roundRect(c, x + 54, y + 54, 20, 22, 4); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(x + 57, y + 58, 14, 3);
  mochi(c, x + w / 2, y + 92, 10);
  txt(c, '토 11시 · 옥상', x + w / 2, y + h - 9, 10, '#34508a');
}
function drawSticky(c, x, y, w, h, bg, ink) {
  c.fillStyle = bg; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(x, y, w, 5);
  scribble(c, x + 5, y + 11, w - 10, 3, ink, 1.1);
}
function drawCard(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#34508a'; c.fillRect(x, y, w, 16); txt(c, 'MOCHI CO.', x + w / 2, y + 8, 9, '#ffffff');
  c.fillStyle = '#cdeefc'; c.fillRect(x + 14, y + 20, 36, 34); mochi(c, x + 32, y + 40, 12);
  txt(c, '몽글이', x + w / 2, y + 63, 12, '#2a1d33');
  txt(c, '디자인팀', x + w / 2, y + 74, 8, '#8a85a0');
  c.fillStyle = '#2a1d33'; for (let k = 0; k < 18; k++) c.fillRect(x + 10 + k * 2.4, y + 80, (k * 5) % 3 ? 1 : 1.8, 6);
}
function drawWater(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#3f9be0'; drop(c, x + 16, y + 20, 8);
  txt(c, '정수기', x + 52, y + 15, 14, '#34508a'); txt(c, 'WATER · 給水', x + 52, y + 30, 8, '#8a85a0');
  c.fillStyle = '#3f9be0'; roundRect(c, x + 80, y + 6, 26, 15, 6); c.fill(); txt(c, '냉', x + 93, y + 14, 10, '#ffffff');
  c.fillStyle = '#ff4b4b'; roundRect(c, x + 80, y + 26, 26, 15, 6); c.fill(); txt(c, '온', x + 93, y + 34, 10, '#ffffff');
}
function drawCupNote(c, x, y, w, h) {
  c.fillStyle = '#fff7c9'; c.fillRect(x, y, w, h);
  txt(c, '컵은 하나씩!', x + w / 2 - 4, y + 15, 12, '#3f6fd8');
  c.strokeStyle = '#3f6fd8'; c.lineWidth = 1.2; c.beginPath(); c.arc(x + w - 12, y + 28, 6, 0, PI * 2); c.stroke(); c.beginPath(); c.arc(x + w - 12, y + 29, 3, .3, PI - .3); c.stroke();
  c.fillStyle = 'rgba(246,226,176,.9)'; c.save(); c.translate(x + 10, y + 3); c.rotate(-.3); c.fillRect(-8, -3, 16, 6); c.restore();
}
function drawHand(c, x, y, w, h) {
  c.fillStyle = '#ffd23f'; roundRect(c, x, y, w, h, 8); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = 2; roundRect(c, x + 3, y + 3, w - 6, h - 6, 6); c.stroke();
  c.fillStyle = '#ffffff'; roundRect(c, x + 10, y + 12, 12, 14, 4); c.fill();
  for (let k = 0; k < 4; k++) { roundRect(c, x + 10 + k * 3.2, y + 6, 2.6, 9, 1.2); c.fill(); }
  c.strokeStyle = '#ff4b4b'; c.lineWidth = 2; line(c, [[x + 26, y + 10], [x + 26, y + 28]]);
  txt(c, '손 끼임', x + 44, y + 17, 9, '#ff4b4b'); txt(c, '주의', x + 44, y + 29, 9, '#2a1d33');
  txt(c, 'CAUTION', x + w / 2, y + 40, 7, '#2a1d33');
}
function drawVisit(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#7fd6c0'; c.fillRect(x, y, w, 6);
  txt(c, '방문증 발급', x + w / 2, y + 17, 10, '#34508a'); txt(c, 'VISITOR', x + w / 2, y + 30, 9, '#ff6b57');
}
function drawMag(c, x, y, w, h) {
  c.fillStyle = '#ff9f8a'; c.fillRect(x, y, w, h);
  txt(c, 'LOBBY', x + w / 2, y + 10, 11, '#ffffff');
  c.fillStyle = '#fff4e2'; c.fillRect(x + 6, y + 18, w - 12, 34);
  c.fillStyle = '#6cc46a'; for (const [dx, dy] of [[-8, 4], [0, -4], [8, 3]]) blob(c, x + w / 2 + dx, y + 32 + dy, 7);
  c.fillStyle = '#34508a'; c.fillRect(x + w / 2 - 6, y + 40, 12, 10);
  c.fillStyle = '#ffffff'; c.fillRect(x + 6, y + 56, 28, 2);
}
function drawMailNums(c) {
  for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) {
    const x = k * 40, y = 280 + r * 18;
    c.fillStyle = '#fbf8f0'; c.fillRect(x, y, 40, 18);
    c.fillStyle = '#e8e1d2'; c.fillRect(x, y + 15, 40, 3);
    txt(c, `${4 - r}0${k + 1}`, x + 20, y + 8.5, 13, '#26396a');
  }
}
function drawLost(c, x, y, w, h) {
  c.fillStyle = '#fff4dc'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#34508a'; c.lineWidth = 3; roundRect(c, x + 4, y + 4, w - 8, h - 8, 8); c.stroke();
  txt(c, '분실물', x + 62, y + 28, 26, '#34508a');
  txt(c, 'LOST & FOUND', x + 62, y + 51, 12, '#ff6b57');
  txt(c, '落とし物', x + 62, y + 65, 10, '#8a85a0');
  c.strokeStyle = '#2a1d33'; c.lineWidth = 3.5; c.beginPath(); c.arc(x + 126, y + 34, 13, 0, PI * 2); c.stroke();
  c.lineWidth = 5; c.lineCap = 'round'; line(c, [[x + 135, y + 44], [x + 146, y + 56]]);
  c.fillStyle = '#8fd3f4'; blob(c, x + 126, y + 34, 10);
  c.fillStyle = '#ffc23d'; c.save(); c.translate(x + 126, y + 34); c.beginPath(); for (let i = 0; i < 10; i++) { const a = -HP + i * PI / 5, rr = i % 2 ? 2.6 : 6; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.fill(); c.restore();
}
function drawReader(c, x, y, w, h) {
  c.fillStyle = '#1d2133'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#8fd3f4'; c.lineWidth = 2; roundRect(c, x + 16, y + 10, 32, 22, 3); c.stroke();
  c.fillStyle = '#8fd3f4'; c.fillRect(x + 20, y + 14, 8, 8);
  c.strokeStyle = '#8fd3f4'; c.lineWidth = 1.6; for (const r of [6, 10]) { c.beginPath(); c.arc(x + 44, y + 21, r, -.7, .7); c.stroke(); }
  c.fillStyle = '#3ddc84'; c.beginPath(); c.moveTo(x + w / 2, y + 40); c.lineTo(x + w / 2 + 14, y + 56); c.lineTo(x + w / 2 + 6, y + 56); c.lineTo(x + w / 2 + 6, y + 70); c.lineTo(x + w / 2 - 6, y + 70); c.lineTo(x + w / 2 - 6, y + 56); c.lineTo(x + w / 2 - 14, y + 56); c.closePath(); c.fill();
}
function drawStaff(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#34508a'; roundRect(c, x + 3, y + 3, w - 6, h - 6, 5); c.fill();
  ['직', '원', '전', '용'].forEach((s, i) => txt(c, s, x + w / 2, y + 13 + i * 15, 13, '#ffffff'));
  txt(c, 'STAFF', x + w / 2, y + h - 7, 7, '#ffd27a');
}
function drawTank(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#3f9be0'; drop(c, x + 18, y + 22, 8); drop(c, x + w - 18, y + 22, 8);
  txt(c, '물탱크', x + 66, y + 16, 18, '#26396a');
  txt(c, '음용수 · 청소 10월', x + 66, y + 32, 9, '#3f9be0');
  txt(c, 'WATER', x + 140, y + 15, 12, '#3f9be0'); txt(c, '貯水槽', x + 140, y + 30, 10, '#8a85a0');
}
function drawAC(c, x, y, w, h) {
  c.fillStyle = '#e7ebf2'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#3f9be0'; c.lineWidth = 2; c.lineCap = 'round';
  for (let i = 0; i < 3; i++) { const a = i * PI / 3; line(c, [[x + 20 - Math.cos(a) * 10, y + 20 - Math.sin(a) * 10], [x + 20 + Math.cos(a) * 10, y + 20 + Math.sin(a) * 10]]); }
  txt(c, 'COOL', x + 62, y + 16, 16, '#26396a'); txt(c, 'INVERTER · 실외기', x + 66, y + 31, 7, '#8a85a0');
}
function drawStyro(c, x, y, w, h, kind) {
  c.fillStyle = '#f7f6f1'; c.fillRect(x, y, w, h);
  if (kind === 'A') {
    for (const [dx, r] of [[18, 11], [36, 9]]) { c.fillStyle = '#ff9a1f'; blob(c, x + dx, y + 26, r); c.fillStyle = '#4ea85a'; c.beginPath(); c.ellipse(x + dx + 3, y + 26 - r, 4, 2, -.5, 0, PI * 2); c.fill(); }
    txt(c, '제주 감귤', x + 98, y + 20, 20, '#ff7a12');
    txt(c, '신선 · 10kg', x + 98, y + 38, 10, '#4ea85a');
  } else {
    c.fillStyle = '#3f9be0'; c.beginPath(); c.ellipse(x + 26, y + 24, 15, 8, 0, 0, PI * 2); c.fill();
    c.beginPath(); c.moveTo(x + 38, y + 24); c.lineTo(x + 48, y + 16); c.lineTo(x + 48, y + 32); c.closePath(); c.fill();
    c.fillStyle = '#ffffff'; blob(c, x + 19, y + 22, 2);
    txt(c, '싱싱 수산', x + 102, y + 20, 20, '#2f7fd8');
    c.strokeStyle = '#8fd3f4'; c.lineWidth = 2; c.beginPath(); for (let k = 0; k <= 20; k++) { const xx = x + 62 + k * 4; c.lineTo(xx, y + 38 + Math.sin(k * 1.2) * 2.5); } c.stroke();
  }
}
function drawTags(c) {
  [['상추', '#4ea85a'], ['고추', '#e8452f'], ['トマト', '#ff5a3a']].forEach(([s, cc], i) => {
    const x = 464, y = 344 + i * 24;
    c.fillStyle = '#f6dfb8'; c.fillRect(x, y, 48, 24); c.fillStyle = '#e8c48e'; c.fillRect(x, y + 20, 48, 4);
    txt(c, s, x + 24, y + 11, 13, cc);
  });
}
function drawExit(c, x, y, w, h) {
  c.fillStyle = '#1fae63'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ffffff'; c.fillRect(x + 6, y + 6, 26, 32); c.fillStyle = '#1fae63'; c.fillRect(x + 10, y + 10, 18, 26);
  c.fillStyle = '#ffffff'; blob(c, x + 44, y + 11, 4.5);
  c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
  line(c, [[x + 42, y + 17], [x + 38, y + 27]]); line(c, [[x + 38, y + 27], [x + 44, y + 33], [x + 44, y + 39]]); line(c, [[x + 38, y + 27], [x + 32, y + 33], [x + 26, y + 34]]);
  line(c, [[x + 41, y + 19], [x + 48, y + 24]]); line(c, [[x + 41, y + 19], [x + 34, y + 22]]);
  txt(c, '비상구', x + 88, y + 16, 17, '#ffffff'); txt(c, 'EXIT · 非常口', x + 88, y + 33, 10, '#e2ffef');
}
function drawDoorNote(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(246,226,176,.95)'; for (const sx of [0, 1]) { c.save(); c.translate(x + 8 + sx * (w - 16), y + 4); c.rotate(sx ? .5 : -.5); c.fillRect(-9, -3, 18, 7); c.restore(); }
  txt(c, '옥상 출입문', x + w / 2, y + 17, 13, '#26396a');
  txt(c, '꼭 닫아', x + w / 2, y + 36, 16, '#ff4b4b'); txt(c, '주세요!', x + w / 2, y + 53, 16, '#ff4b4b');
  txt(c, '開けたら閉めて', x + w / 2, y + 70, 9, '#8a85a0');
  c.fillStyle = '#ffab4c'; catHead(c, x + 24, y + 88, 9); c.fillStyle = '#2a1d33'; blob(c, x + 21, y + 88, 1.3); blob(c, x + 27, y + 88, 1.3);
  txt(c, '- 관리실', x + 60, y + 92, 9, '#8a85a0');
}
function drawDish(c, x, y, w, h) {
  c.fillStyle = '#34508a'; roundRect(c, x, y, w, h, 6); c.fill();
  txt(c, 'mochi', x + 26, y + h / 2 + 1, 13, '#ffffff'); txt(c, 'TV', x + 52, y + h / 2 + 1, 12, '#ffc23d');
}
function drawCaution(c, x, y, w, h) {
  c.fillStyle = '#2a1d33'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ffd23f'; for (let k = -2; k < 10; k++) { c.beginPath(); c.moveTo(x + k * 10, y); c.lineTo(x + k * 10 + 5, y); c.lineTo(x + k * 10 - 5 + 10, y + h); c.lineTo(x + k * 10 - 10 + 10, y + h); c.closePath(); c.fill(); }
  c.fillStyle = '#ffd23f'; c.fillRect(x + 6, y + 6, w - 12, h - 12);
  txt(c, '주의 CAUTION', x + w / 2, y + h / 2 + 1, 10, '#2a1d33');
}
function drawBtns(c, x, y, w, h) {
  c.fillStyle = '#d5dbe6'; c.fillRect(x, y, w, h);
  for (let k = 0; k < 8; k++) {
    const bx = x + 14 + (k % 2) * 20, by = y + 10 + Math.floor(k / 2) * 14;
    c.fillStyle = k === 6 ? '#ffb547' : '#f4f6fa'; blob(c, bx, by, 5.5); c.strokeStyle = '#8a92a8'; c.lineWidth = 1; c.beginPath(); c.arc(bx, by, 5.5, 0, PI * 2); c.stroke();
    txt(c, k < 7 ? String(7 - k) : 'B', bx, by + .5, 7, '#26396a');
  }
}
function drawCap(c, x, y, w, h) {
  c.fillStyle = '#c9cfe0'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#8a92a8'; c.lineWidth = 1.5; c.strokeRect(x + 2, y + 2, w - 4, h - 4);
  txt(c, '정원 9인 · 600kg', x + w / 2, y + h / 2 + 1, 11, '#26396a');
}
function drawNote(c, x, y, w, h) {
  c.fillStyle = '#ffe14d'; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(0,0,0,.05)'; c.fillRect(x, y, w, 7);
  txt(c, '할 일', x + 16, y + 14, 11, '#3f6fd8');
  scribble(c, x + 7, y + 25, w - 14, 3, '#3f6fd8', 1.3);
  c.strokeStyle = '#ff4b4b'; c.lineWidth = 1.6; line(c, [[x + 34, y + 10], [x + 37, y + 14], [x + 43, y + 6]]);
}
function drawBook(c, x, y, w, h) {
  c.fillStyle = '#fffdf6'; c.fillRect(x, y, w, h);
  c.fillStyle = '#e9e2d2'; c.fillRect(x + w / 2 - 1, y, 2, h);
  txt(c, '방문자 명부', x + w / 4, y + 8, 7, '#34508a');
  c.strokeStyle = '#d6d0e2'; c.lineWidth = .8; for (let k = 0; k < 5; k++) { line(c, [[x + 4, y + 16 + k * 8], [x + w / 2 - 4, y + 16 + k * 8]]); line(c, [[x + w / 2 + 4, y + 8 + k * 9], [x + w - 4, y + 8 + k * 9]]); }
  scribble(c, x + 6, y + 13, 26, 3, '#3f6fd8', .9); scribble(c, x + w / 2 + 6, y + 6, 26, 2, '#2a1d33', .9);
}
const atlas = () => tex('bd-atlas', 1024, 1024, c => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, AT, AT);
  drawDisp(c, 0, 0, 128, 40); drawInfo(c, 128, 0, 224, 56); drawMailSign(c, 352, 0, 160, 32); drawNotice(c, 352, 32, 160, 28);
  drawDir(c, 0, 64, 128, 200); drawRecycle(c, 128, 64, 96, 128); drawLostCat(c, 224, 64, 80, 104); drawYoga(c, 304, 64, 80, 104); drawInspect(c, 384, 64, 128, 72);
  drawFlea(c, 384, 136, 96, 120); drawSticky(c, 480, 136, 32, 32, '#ffe14d', '#3f6fd8'); drawSticky(c, 480, 168, 32, 32, '#ffb3c6', '#ff4b4b');
  drawCard(c, 128, 192, 64, 88); drawWater(c, 192, 168, 112, 48); drawCupNote(c, 304, 168, 80, 40); drawHand(c, 192, 216, 64, 48);
  drawVisit(c, 256, 216, 64, 40); drawMag(c, 320, 208, 48, 64); drawMailNums(c); drawLost(c, 240, 280, 160, 80); drawReader(c, 400, 264, 64, 80); drawStaff(c, 464, 264, 48, 80);
  drawTank(c, 0, 360, 192, 40); drawAC(c, 192, 360, 112, 40); drawStyro(c, 304, 360, 160, 48, 'A'); drawStyro(c, 0, 400, 160, 48, 'B'); drawTags(c);
  drawExit(c, 160, 400, 128, 44); drawDoorNote(c, 288, 408, 88, 104); drawDish(c, 376, 416, 64, 32); drawCaution(c, 440, 416, 72, 32);
  drawBtns(c, 0, 448, 48, 64); drawCap(c, 48, 448, 112, 32); drawNote(c, 160, 448, 48, 48); drawBook(c, 208, 448, 80, 56);
}, { text: true });
const atlasMat = () => mat('#ffffff', { map: atlas() });
const signMat = () => mat('#ffffff', { map: atlas(), emissive: '#ffffff', ei: .2 });
const glassMat = () => mat('#cdeffa', { opacity: .32 });
const bulbMat = () => mat('#fff3c4', { emissive: '#ffcf6b', ei: .9 });
const transparent = o => { o.castShadow = false; return o; };

// ── surface textures (repeat; world-sized through planarUV) ─────────────────────────────────────────────────────
// a seeded random so every texture draws the same way each time
const rnd = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
// draw fn(X, Y) at (x, y) and at its wrapped copies so a repeat tile has no seams
function wrap(S, x, y, r, fn) { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) if (x + dx > -r && x + dx < S + r && y + dy > -r && y + dy < S + r) fn(x + dx, y + dy); }
// travertine / marble: warm stone with soft veins
const stoneTex = base => tex('bd-stone|' + STYLE.mode + base, 256, 256, (c, S) => {
  const b = tint(base), r = rnd(7);
  c.fillStyle = b; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) { const x = r() * S, y = r() * S, rad = 6 + r() * 18; wrap(S, x, y, rad * 2, (X, Yy) => { c.fillStyle = r() < .5 ? shade(b, .035) : shade(b, -.03); c.beginPath(); c.ellipse(X, Yy, rad * 2, rad * .6, 0, 0, PI * 2); c.fill(); }); }
  c.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const y0 = r() * S, a = (r() - .5) * .5;
    c.strokeStyle = i % 3 ? 'rgba(150,110,70,.18)' : 'rgba(255,255,255,.5)'; c.lineWidth = .8 + r() * 1.4;
    for (const dy of [-S, 0, S]) { c.beginPath(); for (let k = 0; k <= 16; k++) { const x = k / 16 * S, yy = y0 + dy + Math.sin(k * .9 + i) * 6 + (x - S / 2) * a; k ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); }
  }
  for (let i = 0; i < 160; i++) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.4)' : 'rgba(120,90,60,.12)'; c.fillRect(r() * S, r() * S, 1.2, 1.2); }
}, { repeat: [1, 1] });
const stoneMat = base => mat('#ffffff', { map: stoneTex(base) });
// brushed steel: fine vertical grain, a soft sheen
const steelTex = () => tex('bd-steel|' + STYLE.mode, 128, 128, (c, S) => {
  const r = rnd(3);
  c.fillStyle = tint('#d3d9e4'); c.fillRect(0, 0, S, S);
  for (let x = 0; x < S; x += .7) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.22)' : 'rgba(80,90,120,.1)'; c.fillRect(x, 0, .5, S); }
  const g = c.createLinearGradient(0, 0, S, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, S, S);
}, { repeat: [1, 1] });
const steelMat = () => mat('#ffffff', { map: steelTex() });
// cork: honey board, darker and lighter crumbs
const corkTex = () => tex('bd-cork|' + STYLE.mode, 128, 128, (c, S) => {
  const r = rnd(11);
  c.fillStyle = tint('#d9a066'); c.fillRect(0, 0, S, S);
  for (let i = 0; i < 520; i++) { const x = r() * S, y = r() * S, rr = .6 + r() * 1.6; c.fillStyle = r() < .55 ? 'rgba(120,70,30,.3)' : 'rgba(255,230,190,.45)'; c.beginPath(); c.ellipse(x, y, rr, rr * (.5 + r() * .5), r() * 3, 0, PI * 2); c.fill(); }
}, { repeat: [1, 1] });
// terrazzo: chips of colour in a base
const terrazzoTex = base => tex('bd-terrazzo|' + STYLE.mode + base, 256, 256, (c, S) => {
  const r = rnd(5), b = tint(base);
  c.fillStyle = b; c.fillRect(0, 0, S, S);
  const chips = ['#ffffff', '#ffffff', '#f4e9d8', '#ffc23d', '#ff9f8a', '#7fd6c0', '#8fd3f4'];
  for (let i = 0; i < 150; i++) {
    const x = r() * S, y = r() * S, rad = 1.5 + r() * 4.5, cc = chips[Math.floor(r() * chips.length)], n = 4 + Math.floor(r() * 3), rot = r() * 6;
    wrap(S, x, y, rad, (X, Yy) => { c.fillStyle = cc; c.beginPath(); for (let k = 0; k < n; k++) { const a = rot + k / n * PI * 2, rr = rad * (.6 + ((k * 7 + i) % 5) / 10); c.lineTo(X + Math.cos(a) * rr, Yy + Math.sin(a) * rr); } c.closePath(); c.fill(); });
  }
}, { repeat: [1, 1] });
// vertical wood slats with dark gaps (reception front)
const slatTex = wood => tex('bd-slat|' + STYLE.mode + wood, 128, 128, (c, S) => {
  const w = tint(wood), r = rnd(13);
  c.fillStyle = tint(shade(wood, -.3)); c.fillRect(0, 0, S, S);
  for (let k = 0; k < 4; k++) {
    c.fillStyle = shade(w, ((k * 5) % 3 - 1) * .03); c.fillRect(k * 16 + 1.4, 0, 13.2, S);
    c.strokeStyle = 'rgba(120,60,20,.14)'; c.lineWidth = .8;
    for (let j = 0; j < 3; j++) { const x0 = k * 16 + 3 + r() * 9; c.beginPath(); c.moveTo(x0, 0); c.bezierCurveTo(x0 + 2, S * .3, x0 - 2, S * .6, x0, S); c.stroke(); }
  }
}, { repeat: [1, 1] });
// painted concrete: mottled with a faint formwork grid
const concreteTex = base => tex('bd-concrete|' + STYLE.mode + base, 256, 256, (c, S) => {
  const b = tint(base), r = rnd(17);
  c.fillStyle = b; c.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) { const x = r() * S, y = r() * S, rad = 6 + r() * 16; wrap(S, x, y, rad, (X, Yy) => { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(90,70,60,.035)'; c.beginPath(); c.arc(X, Yy, rad, 0, PI * 2); c.fill(); }); }
  c.strokeStyle = 'rgba(90,70,60,.12)'; c.lineWidth = 1.2; for (const y of [S / 2, S]) line(c, [[0, y - .6], [S, y - .6]]);
  c.fillStyle = 'rgba(90,70,60,.16)'; for (const [x, y] of [[S * .25, S * .25], [S * .75, S * .25], [S * .25, S * .75], [S * .75, S * .75]]) blob(c, x, y, 2);
  for (let i = 0; i < 600; i++) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.3)' : 'rgba(80,60,50,.12)'; c.fillRect(r() * S, r() * S, 1, 1); }
}, { repeat: [1, 1] });
// the Korean flowered blanket (꽃무늬 밍크 이불): big peonies and leaves on a bold ground
const blanketTex = base => tex('bd-blanket|' + STYLE.mode + base, 512, 512, (c, S) => {
  c.fillStyle = tint(base); c.fillRect(0, 0, S, S);
  c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 6; for (let k = -1; k < 5; k++) line(c, [[k * 64, 0], [k * 64 + 64, S]]);
  const peony = (x, y, R, p1, p2) => wrap(S, x, y, R * 1.4, (X, Yy) => {
    c.fillStyle = '#5fbf5a'; for (const a of [.5, 2.4, 4.2]) { c.beginPath(); c.ellipse(X + Math.cos(a) * R * 1.05, Yy + Math.sin(a) * R * 1.05, R * .55, R * .25, a, 0, PI * 2); c.fill(); }
    c.fillStyle = p1; for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; blob(c, X + Math.cos(a) * R * .55, Yy + Math.sin(a) * R * .55, R * .5); }
    c.fillStyle = p2; for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2 + .3; blob(c, X + Math.cos(a) * R * .28, Yy + Math.sin(a) * R * .28, R * .32); }
    c.fillStyle = '#ffd23f'; blob(c, X, Yy, R * .16);
  });
  peony(52, 60, 30, '#ffe0e6', '#ff9fb5'); peony(180, 150, 34, '#fff4e2', '#ffc23d'); peony(90, 200, 24, '#ffb3c6', '#ffffff'); peony(210, 36, 20, '#ffffff', '#ffb3c6');
  for (const [x, y] of [[140, 80], [30, 140], [236, 222], [150, 240]]) wrap(S, x, y, 10, (X, Yy) => daisy(c, X, Yy, 5, '#ffffff', '#ffc23d'));
}, { repeat: [1, 1] });
// diamond-tufted velvet: puffy diamonds, creases between the buttons (sofa back and arms)
const tuftTex = base => tex('bd-tuft|' + STYLE.mode + base, 256, 256, (c, S) => {
  const b = tint(base), n = 4, d = S / n;
  c.fillStyle = shade(b, -.03); c.fillRect(0, 0, S, S);
  for (let j = -1; j <= 2 * n + 1; j++) for (let i = -1; i <= n; i++) {
    const x = i * d + d / 2 + (j % 2 ? d / 2 : 0), y = j * d / 2;
    const g = c.createRadialGradient(x - d * .08, y - d * .1, 1, x, y, d * .5); g.addColorStop(0, shade(b, .1)); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x, y - d / 2); c.lineTo(x + d / 2, y); c.lineTo(x, y + d / 2); c.lineTo(x - d / 2, y); c.closePath(); c.fill();
  }
  c.strokeStyle = shade(b, -.16); c.lineWidth = 1.3;
  for (let m = -n; m <= 2 * n; m++) { line(c, [[0, m * d], [S, m * d + S]]); line(c, [[0, m * d], [S, m * d - S]]); }
  for (let j = 0; j <= 2 * n; j++) for (let i = -1; i <= n; i++) {
    const x = i * d + (j % 2 ? d / 2 : 0), y = j * d / 2;
    c.fillStyle = shade(b, -.24); blob(c, x, y, 2.2); c.fillStyle = 'rgba(255,255,255,.35)'; blob(c, x - .7, y - .7, .8);
  }
}, { repeat: [1, 1] });
// stripes along u (vertical on front faces): a, b, a with a thin line
const stripeTex = (a, b, n = 4) => tex('bd-stripe|' + STYLE.mode + a + b + n, 128, 128, (c, S) => {
  c.fillStyle = tint(a); c.fillRect(0, 0, S, S);
  c.fillStyle = tint(b); for (let k = 0; k < n; k++) c.fillRect(k * S / n, 0, S / n / 2, S);
  c.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < n; k++) c.fillRect(k * S / n + S / n * .72, 0, 1.2, S);
}, { repeat: [1, 1] });

const B = {};

// ═════════════════════════════════════════════ LOBBY ═════════════════════════════════════════════
// 엘리베이터 (wall, span 2): a travertine elevator front standing out from the wall — brushed-steel doors part into pockets
// behind the cladding and show the car (steel side panels, a mirror over a dado, a wood handrail, a button panel, a navy mat);
// a floor indicator over the doors, call buttons on the right, the building directory on the left, a wood-banded stone cap.
B.elevator = (f, T) => {
  const navy = col(T, 'navy'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), stone = col(T, 'stone'), tk = [navy, wood, woodD, stone].join(',');
  const HW = .95, OW = .45, OH = 1.8, TOP = 2.3, ZB = .514, ZP = .554, ZF = .59, CF = .03, ZM = .03;
  f.add(mg('elev-stone|' + stone, stoneMat(stone), ({ P }) => {
    for (const sx of [-1, 1]) {
      const cx = sx * (OW + HW) / 2, pw = HW - OW;
      P(pw, TOP, ZB - .004, cx, TOP / 2, (ZB + .004) / 2, .9);              // pilaster body
      P(pw, TOP, ZF - ZP, cx, TOP / 2, (ZP + ZF) / 2, .9);                  // its cladding (the door pocket runs between)
      P(.02, TOP, ZP - ZB, sx * (HW - .01), TOP / 2, (ZB + ZP) / 2, .9);    // closes the pocket at the outer edge
    }
    P(2 * OW, TOP - OH, ZB - .004, 0, (OH + TOP) / 2, (ZB + .004) / 2, .9);
    P(2 * OW, TOP - OH, ZF - ZP, 0, (OH + TOP) / 2, (ZP + ZF) / 2, .9);
  }));
  f.add(mc('elev|' + tk, ({ add, tube }) => {
    add(G.box(2 * HW + .04, .06, ZF + .03 - .004, .015), woodD, 0, TOP + .03, (ZF + .03 + .004) / 2);   // cornice
    add(G.box(2 * HW + .06, .03, ZF + .05 - .004, .012), shade(stone, -.07), 0, TOP + .075, (ZF + .05 + .004) / 2);
    // steel portal round the opening
    for (const sx of [-1, 1]) add(G.box(.05, OH + .05, .014, .005), ALU, sx * (OW + .025), (OH + .05) / 2, ZF + .007);
    add(G.box(2 * OW + .1, .05, .014, .005), ALU, 0, OH + .025, ZF + .007);
    // threshold
    add(G.box(2 * OW, CF, ZF + .05 - ZB, .006), ALU, 0, CF / 2, (ZB + ZF + .05) / 2);
    for (const z of [.578, .606, .628]) add(G.pbox(2 * OW - .05, .004, .006), STEEL2, 0, CF + .002, z);
    // the car: floor, mat, wood side panels, wood dado + mirror on the back, handrail, button panel, capacity plate
    add(G.pbox(2 * OW, CF, ZB - .004), '#d8cfc0', 0, CF / 2, (ZB + .004) / 2);
    add(G.box(.62, .008, .34, .004), navy, 0, CF + .004, .27);
    for (const sx of [-1, 1]) add(G.pbox(.012, OH - CF, ZB - ZM), '#d3dae6', sx * (OW - .006), (OH + CF) / 2, (ZB + ZM) / 2);
    add(G.pbox(2 * OW - .024, .9 - CF, ZM - .004), '#b9c3d4', 0, (.9 + CF) / 2, (ZM + .004) / 2);
    add(G.pbox(2 * OW - .024, OH - .9, ZM - .004), '#e6f3fa', 0, (OH + .9) / 2, (ZM + .004) / 2);
    tube([-.38, .92, .085], [.38, .92, .085], .016, woodD, 8);
    for (const sx of [-1, 1]) tube([sx * .33, .92, ZM], [sx * .33, .92, .085], .009, STEEL2, 6);
    add(G.box(.02, .4, .11, .005), '#5d6478', OW - .012 - .01, 1.05, .41);
    // floor indicator panel, call buttons, directory frame
    add(G.box(.48, .2, .02, .01), CHAR, 0, 2.05, ZF + .01);
    add(G.box(.1, .24, .016, .006), ALU, .7, 1.05, ZF + .008);
    for (const [y, c, rz] of [[1.1, MUSTARD, 0], [1.0, WHITE, PI]]) {
      add(G.cyl(.026, .026, .014, 16), c, .7, y, ZF + .016 + .007, HP, 0, 0);
      add(G.cone(.012, .018, 3), INK, .7, y, ZF + .03 + .003, 0, 0, rz, [1, 1, .3]);
    }
    add(G.box(.32, .5, .02, .008), woodD, -.7, 1.3, ZF + .01);
  }));
  f.add(mg('elev-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.26, .406, RG.dir), -.7, 1.3, ZF + .02 + .006);
    add(quadGeo(.08, .107, RG.btns), OW - .032 - .006, 1.08, .41, 0, -HP, 0);
    add(quadGeo(.1, .029, RG.cap), OW - .032 - .006, .98, .41, 0, -HP, 0);
  }));
  f.add(mg('elev-disp', signMat(), ({ add }) => add(quadGeo(.42, .131, RG.disp), 0, 2.05, ZF + .02 + .006)));
  // the doors (each its own mesh): brushed steel with a rubber seal on the meeting edge; they slide into the pockets
  const DW = .47, DH = OH - .035, DZ = (ZB + ZP) / 2, dy = .031 + DH / 2;
  const door = sx => {
    const pv = new THREE.Group(); put(pv, sx * (DW / 2 + .0015), dy, DZ);
    pv.add(mg('elev-door' + sx, steelMat(), ({ P }) => P(DW - .014, DH, .03, sx * .007, 0, 0, .5)));
    pv.add(mc('elev-seal' + sx, ({ add }) => add(G.pbox(.012, DH, .03), '#6d7488', -sx * (DW / 2 - .006), 0, 0)));
    if (sx > 0) pv.add(mg('elev-hand', atlasMat(), ({ add }) => add(quadGeo(.09, .0675, RG.hand), -DW / 2 + .07, -.12, .015 + .006)));
    f.add(pv); return pv;
  };
  const L = door(-1), R = door(1);
  const p = f.part('slide', [L, R], (t, bl, br) => { L.position.x = bl.p.x - .44 * t; R.position.x = br.p.x + .44 * t; }, { label: '엘리베이터 문', sfx: 'door', dur: .42 });
  f.spot('inside', null, .08, CF + .008, .27, { part: p, maxH: .45, label: '엘리베이터 안', scale: .9 });
};

// 안내 데스크 (2×1): a honey wood-slat reception desk under a travertine top — a navy 안내 INFORMATION sign, a recessed navy
// plinth (something slips under the front), a navy keep-drawer with a code lock on the right; on top a desk bell, the
// visitor book with a pen, a 방문증 sign and a tulip vase, and on the staff side a monitor, a phone and a pen cup.
B.reception = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), navy = col(T, 'navy'), stone = col(T, 'stone'), tk = [wood, woodD, navy, stone].join(',');
  const FZ = .3, BZ = -.38, TY = .9, PL = .14, XS = .3, XE = .92, top = TY + .05, inner = shade(wood, -.22);
  f.add(mg('reception-slats|' + wood, mat('#ffffff', { map: slatTex(wood) }), ({ P }) => {
    P(XS + XE, TY - PL, .02, (XS - XE) / 2, (TY + PL) / 2, FZ - .01, .32);
    P(XE - .03 - XS, .54 - PL, .02, (XS + XE - .03) / 2, (.54 + PL) / 2, FZ - .01, .32);
    P(.03, TY - PL, FZ - BZ, XE - .015, (TY + PL) / 2, (FZ + BZ) / 2, .32);
  }));
  f.add(mg('reception-top|' + stone, stoneMat(stone), ({ P }) => P(1.92, .05, FZ + .06 - (BZ - .02), 0, TY + .025, (FZ + .06 + BZ - .02) / 2, .8, .012)));
  f.add(mc('reception|' + tk, ({ add, tube }) => {
    add(G.pbox(1.76, PL, .1 - (BZ + .02)), navy, 0, PL / 2, (.1 + BZ + .02) / 2);                                   // recessed plinth
    add(G.pbox(XS + XE, TY - PL, FZ - .02 - BZ), wood, (XS - XE) / 2, (TY + PL) / 2, (FZ - .02 + BZ) / 2);           // left block
    add(G.pbox(XE - .03 - XS, TY - PL, .03), inner, (XS + XE - .03) / 2, (TY + PL) / 2, BZ + .015);                  // pedestal back
    add(G.pbox(XE - .03 - XS, .02, FZ - .02 - BZ - .03), inner, (XS + XE - .03) / 2, .55, (FZ - .02 + BZ + .03) / 2); // drawer bay floor
    add(G.pbox(XS + XE, .04, .008), navy, (XS - XE) / 2, .8, FZ + .004);                                              // navy inlay
    add(G.box(.58, .16, .02, .006), navy, -.33, .52, FZ + .01);
    // a desk bell
    add(G.cyl(.05, .055, .022, 16), CHAR, .62, top + .011, .14);
    add(G.dome(.044, 16, 6), GOLD, .62, top + .022, .14);
    add(G.cyl(.006, .006, .02, 6), STEEL, .62, top + .07, .14); add(G.sph(.011, 8, 6), STEEL, .62, top + .082, .14);
    // the visitor book and a pen
    add(G.box(.3, .01, .2, .003), navy, .15, top + .005, .12);
    add(G.box(.28, .014, .19, .003), WHITE, .15, top + .017, .12);
    add(G.cap(.007, .11, 2, 6), MUSTARD, .2, top + .042, .16, 0, .5, HP);
    // 방문증 acrylic stand
    add(G.box(.15, .1, .008, .003), WHITE, .4, top + .046, .24, -.35, -.3, 0);
    add(G.box(.15, .012, .06, .003), WHITE, .4, top + .006, .22, 0, -.3, 0);
    // tulips in a navy vase
    add(G.cyl(.042, .036, .13, 14), navy, -.8, top + .065, .02);
    for (const [dx, dz, h, c] of [[-.02, 0, .22, TOMATO], [.025, .01, .25, MUSTARD], [0, -.025, .2, CORAL]]) {
      tube([-.8 + dx * .3, top + .12, .02 + dz * .3], [-.8 + dx, top + h, .02 + dz], .005, LEAF2, 4);
      add(G.sph(.028, 10, 8), c, -.8 + dx, top + h + .02, .02 + dz, 0, 0, 0, [1, 1.3, 1]);
    }
    add(G.sph(.04, 8, 6), LEAF, -.78, top + .15, .04, 0, .4, .5, [1.4, .3, .6]);
    // staff side: a monitor (seen from the back), a phone, a pen cup
    add(G.box(.18, .012, .12, .004), CHAR, -.3, top + .006, -.22);
    add(G.box(.04, .16, .03, .008), CHAR, -.3, top + .09, -.24);
    add(G.box(.46, .28, .035, .012), CHAR, -.3, top + .3, -.2, 0, PI - .25, 0);
    add(G.sph(.012, 8, 6), WHITE, -.3 + .0, top + .32, -.2 + .02, 0, 0, 0, [1, 1, .5]);
    add(G.box(.16, .045, .13, .015), WHITE, -.68, top + .0225, -.2, 0, .2, 0);
    add(G.cap(.022, .12, 2, 8), navy, -.68, top + .06, -.2, 0, .2, HP);
    add(G.cyl(.035, .035, .09, 12), woodD, .05, top + .045, -.22);
    for (const [dx, c] of [[-.012, TOMATO], [.012, SKY], [0, MUSTARD]]) tube([.05 + dx, top + .08, -.22], [.05 + dx * 2, top + .15, -.22 + dx], .005, c, 4);
  }));
  f.add(mg('reception-prints', atlasMat(), ({ add, addM }) => {
    add(quadGeo(.54, .135, RG.info), -.33, .52, FZ + .02 + .006);
    add(quadGeo(.27, .185, RG.book), .15, top + .024 + .006, .12, -HP, 0, 0);
    addM(quadGeo(.13, .081, RG.visit), xf(.4, top + .046, .24, -.35, -.3, 0).multiply(xf(0, 0, .004 + .006)));
  }));
  // the keep-drawer (its own mesh): slides out of the right pedestal; a code lock on its face
  const dv = new THREE.Group(); put(dv, (XS + XE - .03) / 2, .72, FZ - .003);
  dv.add(mc('reception-drawer|' + tk, ({ add }) => {
    add(G.box(.57, .3, .03, .012), navy, 0, 0, 0);
    add(G.cap(.012, .12, 2, 6), GOLD, -.1, .07, .03, 0, 0, HP);
    for (const sx of [-1, 1]) add(G.box(.02, .02, .03, .006), GOLD, -.1 + sx * .07, .07, .018);
    add(G.pbox(.53, .012, .46), inner, 0, -.13, -.248);
    for (const sx of [-1, 1]) add(G.pbox(.012, .12, .46), inner, sx * .259, -.07, -.248);
    add(G.pbox(.53, .12, .012), inner, 0, -.07, -.475);
    // keys on a ring and a stack of visitor badges at the back
    add(G.tor(.03, .005, PI * 2, 4, 14), STEEL, .16, -.12, -.38, HP, 0, 0);
    add(G.box(.05, .006, .02, .003), GOLD, .19, -.12, -.36, 0, .4, 0);
    add(G.box(.09, .024, .13, .006), MINT, .14, -.112, -.25);
  }));
  f.add(dv);
  const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .34 * t; }, { label: '안내 데스크 서랍', sfx: 'drawer', dur: .26 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: .16, y: -.01, z: .03, parent: dv };
  f.spot('inside', dv, -.08, -.124, -.24, { part: p, maxH: .12, label: '안내 데스크 서랍', scale: .7 });
  f.spot('under', null, -.45, 0, .2, { maxH: .13, label: '안내 데스크 밑', scale: .8 });
  f.spot('on', null, .4, top, -.06, { maxH: .45, label: '안내 데스크 위', scale: .75 });
  // (레벨 보고서 10/18: the lobby had 3 places in plain sight)
  f.spot('on', null, -.55, top, .22, { maxH: .4, label: '안내 데스크 앞쪽', scale: .75 });
  f.spot('on', null, .74, top, -.2, { maxH: .4, label: '안내 데스크 안쪽 끝', scale: .75 });
};

// 로비 소파 (2×1): a teal velvet lobby sofa, diamond-tufted back and rolled arms, on honey legs — a mustard-striped pillow,
// a lobby magazine on the arm. The right seat cushion lifts; something can also slip under the front.
B.lobbysofa = (f, T) => {
  const sofa = col(T, 'sofa'), woodD = col(T, 'woodD'), a3 = col(T, 'accent3'), tk = [sofa, woodD, a3].join(','), sofaD = shade(sofa, -.07), btn = shade(sofa, -.2);
  const seat = .43, cz = .13;
  const pm = xf(-.55, seat + .15, -.06, -.28, .15, 0);
  // the tufting: box-mapped per triangle in world units after placing (faceUV), one size on the back, the arms and the rolls
  const TU = .54;
  f.add(mg('lobbysofa-tuft2|' + sofa, mat('#ffffff', { map: tuftTex(sofa) }), ({ addM }) => {
    addM(faceUV(ni(G.box(1.64, .52, .2, .08)).translate(0, .56, -.24), TU), I4);
    for (const sx of [-1, 1]) {
      addM(faceUV(ni(G.box(.2, .32, .78, .05)).translate(sx * .8, .46, .04), TU), I4);
      addM(faceUV(ni(G.cyl(.07, .07, .78, 16)).applyMatrix4(xf(sx * .8, .6, .04, HP, 0, 0, [1.05, 1, .75])), TU), I4);
    }
  }));
  f.add(mg('lobbysofa-pillow2|' + a3, mat('#ffffff', { map: stripeTex(CREAM, a3, 3) }), ({ addM }) => addM(faceUV(ni(G.box(.32, .3, .1, .045, 2)).applyMatrix4(pm), .3), I4)));
  f.add(mc('lobbysofa|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.032, .02, .1, 10), woodD, sx * .8, .05, .04 + sz * .27);
    add(G.box(1.8, .2, .72, .05), sofaD, 0, .2, .04);
    for (const sx of [-1, 1]) add(G.sph(.03, 10, 8), btn, sx * .8, .6, .04 + .39 + .002, 0, 0, 0, [1, .8, .4]);
    add(G.box(.696, .13, .54, .05), sofa, -.35, .365, cz);
    for (const [x, z] of [[-.17, -.12], [.17, -.12], [0, .1]]) add(G.sph(.014, 8, 6), btn, -.35 + x, seat + .001, cz + z, 0, 0, 0, [1, .5, 1]);
    // magazine on the right arm
    add(G.box(.16, .012, .22, .003), WHITE, .8, .659, .12, 0, .15, 0);
  }));
  f.add(mg('lobbysofa-mag', atlasMat(), ({ add }) => add(quadGeo(.15, .2, RG.mag), .8, .659 + .006 + .006, .12, -HP, 0, -.15)));
  const cu = grp(mc('lobbysofa-cushion|' + tk, ({ add }) => {
    add(G.box(.696, .13, .54, .05), sofa, 0, 0, 0);
    for (const [x, z] of [[-.17, -.12], [.17, -.12], [0, .1]]) add(G.sph(.014, 8, 6), btn, x, .066, z, 0, 0, 0, [1, .5, 1]);
  }));
  put(cu, .35, .365, cz); f.add(cu);
  const p = f.part('lift', cu, (t, b) => { cu.position.y = b.p.y + .32 * t; cu.position.z = b.p.z + .1 * t; cu.rotation.x = .5 * t; }, { label: '로비 소파 쿠션', sfx: 'lift' });
  f.spot('inside', null, .35, .3, .12, { part: p, maxH: .3, label: '로비 소파 쿠션 밑', scale: .8 });
  f.spot('under', null, -.45, 0, .3, { maxH: .09, label: '로비 소파 밑', scale: .8 });
  f.spot('on', null, -.18, seat, .2, { maxH: .4, label: '로비 소파 위', scale: .75 });
  f.spot('on', null, -.8, .655, .1, { maxH: .35, label: '소파 팔걸이 위', scale: .7 });   // (레벨 보고서 10/18)
};

// 우편함 벽 (wall, span 2): a honey-framed bank of 24 brushed-steel mailboxes with number plates and slots (letters poke out of
// a few), a navy 우편함 sign above and a shelf of flyers below. Three boxes open; 302호 takes a padlock.
B.mailboxes2 = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), navy = col(T, 'navy'), tk = [wood, woodD, navy].join(',');
  const X0 = -.9, X1 = .9, Y0 = .62, Y1 = 1.78, ZB = .02, ZF = .3, FT = .03, DV = .016, NC = 6, NR = 4;
  const CW = (X1 - X0 - 2 * FT) / NC, CH = (Y1 - Y0 - 2 * FT) / NR, DW = CW - .02, DHt = CH - .02;
  const cx = k => X0 + FT + CW * (k + .5), cy = r => Y1 - FT - CH * (r + .5);
  const floorY = r => (r === NR - 1 ? Y0 + FT : Y1 - FT - CH * (r + 1) + DV / 2);
  const OPEN = [[0, 1], [2, 1], [1, 4]], LOCK = 1;   // [row, col] (row 0 = top): 402호, 202호 (padlocked) and 305호 open
  const isOpen = (r, k) => OPEN.some(([a, b]) => a === r && b === k);
  const MAILC = [[0, 3, WHITE], [1, 0, '#ffd6a8'], [2, 4, '#cdeefc'], [3, 2, WHITE], [3, 5, '#ffe3ef']];
  f.add(mc('mailboxes2|' + tk, ({ add }) => {
    add(G.pbox(X1 - X0 - 2 * FT, Y1 - Y0 - 2 * FT, ZB - .004), shade(wood, -.3), 0, (Y0 + Y1) / 2, (ZB + .004) / 2);
    for (const sx of [-1, 1]) add(G.pbox(FT, Y1 - Y0, ZF - .004), wood, sx * (X1 - FT / 2), (Y0 + Y1) / 2, (ZF + .004) / 2);
    for (const y of [Y0 + FT / 2, Y1 - FT / 2]) add(G.pbox(X1 - X0 - 2 * FT, FT, ZF - .004), wood, 0, y, (ZF + .004) / 2);
    for (let k = 1; k < NC; k++) add(G.pbox(DV, Y1 - Y0 - 2 * FT, ZF - ZB), shade(wood, -.08), X0 + FT + CW * k, (Y0 + Y1) / 2, (ZF + ZB) / 2);
    for (let r = 1; r < NR; r++) add(G.pbox(X1 - X0 - 2 * FT, DV, ZF - ZB), shade(wood, -.08), 0, Y1 - FT - CH * r, (ZF + ZB) / 2);
    // closed doors: a mail slot, a little knob; letters poking out of a few
    for (let r = 0; r < NR; r++) for (let k = 0; k < NC; k++) {
      if (isOpen(r, k)) continue;
      add(G.box(.15, .02, .006, .003), CHAR, cx(k), cy(r) - .025, ZF + .02 + .003);
      add(G.cyl(.012, .012, .014, 10), STEEL2, cx(k) + .1, cy(r) - .07, ZF + .02 + .007, HP, 0, 0);
    }
    for (const [r, k, c] of MAILC) add(G.box(.12, .006, .06, .002), c, cx(k) - .01, cy(r) - .024, ZF + .02 + .03, .25, .08, 0);
    // the sign and the flyer shelf
    add(G.box(.62, .13, .02, .006), navy, 0, 1.88, .014);
    add(G.box(1.1, .035, .4, .01), woodD, 0, .45, .204);
    for (const sx of [-1, 1]) add(G.box(.03, .1, .3, .006), woodD, sx * .42, .383, .154);
    [[-.32, MUSTARD, .1], [-.08, WHITE, -.06], [.16, SKY, .08], [.38, MINT, -.12]].forEach(([x, c, ry], i) => {
      const h = .016 + (i % 2) * .01;
      add(G.box(.2, h, .14, .003), c, x, .4675 + h / 2, .27, 0, ry, 0);
      add(G.box(.18, .004, .12, .002), shade(c, -.14), x, .4675 + h + .002, .27, 0, ry + .06, 0);
    });
  }));
  f.add(mg('mailboxes2-doors', steelMat(), ({ P }) => {
    for (let r = 0; r < NR; r++) for (let k = 0; k < NC; k++) if (!isOpen(r, k)) P(DW, DHt, .02, cx(k), cy(r), ZF + .01, .4);
  }));
  f.add(mg('mailboxes2-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.58, .116, RG.mailsign), 0, 1.88, .024 + .006);
    for (let r = 0; r < NR; r++) for (let k = 0; k < NC; k++) if (!isOpen(r, k)) add(quadGeo(.1, .045, MAILN(r, k)), cx(k) - .04, cy(r) + .075, ZF + .02 + .006);
  }));
  OPEN.forEach(([r, k], i) => {
    const pv = new THREE.Group(); put(pv, cx(k) - DW / 2, cy(r), ZF + .01);
    pv.add(mg('mailboxes2-door', steelMat(), ({ P }) => P(DW, DHt, .02, DW / 2, 0, 0, .4)));
    pv.add(mc('mailboxes2-doorbits', ({ add }) => {
      add(G.box(.15, .02, .006, .003), CHAR, DW / 2, -.025, .013);
      add(G.cyl(.012, .012, .014, 10), STEEL2, DW / 2 + .1, -.07, .017, HP, 0, 0);
    }));
    pv.add(mg('mailboxes2-doorplate' + r + k, atlasMat(), ({ add }) => add(quadGeo(.1, .045, MAILN(r, k)), DW / 2 - .04, .075, .016)));
    f.add(pv);
    const lbl = `${4 - r}0${k + 1}호 우편함`;
    const p = f.part('door', pv, t => { pv.rotation.y = -1.9 * t; }, { label: lbl, sfx: 'open', dur: .26 });
    if (i === LOCK) { p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: DW / 2 + .055, y: -.02, z: .037, parent: pv }; }
    f.spot('inside', null, cx(k) + .02, floorY(r), .19, { part: p, maxH: .22, label: lbl, scale: .65 });
  });
  // a letter left at the back of each box that opens
  f.add(mc('mailboxes2-inside', ({ add }) => { for (const [r, k] of OPEN) add(G.box(.12, .012, .08, .003), '#fff4e2', cx(k) - .07, floorY(r) + .006, .065, 0, .2, 0); }));
};

// 큰 화분 (1×1): a tall fiddle-leaf fig in a navy terrazzo cube planter with a pebble-topped soil; something can hide behind.
B.plantbig = (f, T) => {
  const navy = col(T, 'navy'), tk = [navy].join(',');
  const PW = .52, PH = .5, RW = .55, RT = .045;
  f.add(mg('plantbig-pot|' + navy, mat('#ffffff', { map: terrazzoTex(navy) }), ({ P }) => {
    P(PW, PH - .04, PW, 0, .04 + (PH - .04) / 2, 0, .45);
    for (const sz of [-1, 1]) P(RW, .05, RT, 0, PH + .025, sz * (RW / 2 - RT / 2), .45);
    for (const sx of [-1, 1]) P(RT, .05, RW - 2 * RT, sx * (RW / 2 - RT / 2), PH + .025, 0, .45);
  }));
  const LV = [];
  for (let i = 0; i < 28; i++) { const a = i * 2.4, y = .8 + i * .036; LV.push([a, y, .04 + (i % 4) * .03, .28 + (i % 5) * .11 + (i > 22 ? .3 : 0), .27 + (i % 3) * .035, [LEAF2, LEAF, '#3f9a52', LEAF3][i % 4]]); }
  f.add(mc('plantbig|' + tk, ({ add, addM, tube }) => {
    add(G.box(PW - .04, .04, PW - .04, .01), NAVY2, 0, .02, 0);
    add(G.pbox(RW - 2 * RT, .035, RW - 2 * RT), SOIL, 0, PH + .0175, 0);
    for (let i = 0; i < 9; i++) { const a = i * 2.1; add(G.sph(.022, 8, 6), i % 3 ? '#f4efe6' : '#c9c3d9', Math.cos(a) * (.08 + (i % 3) * .06), PH + .035, Math.sin(a) * (.08 + (i % 3) * .06), 0, 0, 0, [1.2, .5, 1]); }
    const bark = '#9a6a45';
    tube([0, PH + .02, 0], [.02, 1.2, -.01], .036, bark, 8, .03);
    tube([.02, 1.2, -.01], [-.1, 1.62, .04], .026, bark, 6, .018);
    tube([.02, 1.18, -.01], [.14, 1.58, -.06], .024, bark, 6, .016);
    const leaf = G.ext(figShape(), .018, 0, 5), rib = G.pbox(.02, .78, .01);
    for (const [a, y, r, e, s, c] of LV) {
      const P = [Math.sin(a) * r, y, Math.cos(a) * r];
      tube([Math.sin(a) * .02, y - .04, Math.cos(a) * .02], P, .008, LEAF2, 4);
      const M = new THREE.Matrix4().makeTranslation(...P).multiply(new THREE.Matrix4().makeRotationY(a + PI)).multiply(new THREE.Matrix4().makeRotationX(-HP + e)).multiply(new THREE.Matrix4().makeScale(s, s, s));
      addM(leaf, M, c);
      addM(rib, M.clone().multiply(xf(0, .45, .048)), shade(c, .14));
    }
  }));
  f.spot('behind', null, .1, 0, -.38, { maxH: .45, label: '큰 화분 뒤', scale: .8 });
};

// 보안 게이트 (2×1): two lanes of navy speed-gate pedestals with steel caps, mint light strips, card readers (green arrows)
// and glass wings; a 직원 전용 sticker on the side. Something can be dropped under a wing.
B.securitygate = (f, T) => {
  const navy = col(T, 'navy'), acc = col(T, 'accent'), tk = [navy, acc].join(',');
  const PX = [-.86, 0, .86], PW = .2, PL = .84, PH = .96, WZ = .05, PLATE = .008;
  const rdM = x => xf(x, PH + .03, .27, .3, 0, 0);
  f.add(mc('securitygate|' + tk, ({ add, addM }) => {
    for (const x of PX) {
      add(G.box(PW, PH - .1, PL, .03), navy, x, (PH - .1) / 2, 0);
      add(G.box(PW + .02, .1, PL + .02, .03), ALU, x, PH - .05, 0);
      add(G.box(PW + .024, .04, PL + .024, .012), CHAR, x, .02, 0);
      addM(G.box(.16, .05, .17, .012), rdM(x), CHAR);
      add(G.cyl(.028, .028, .012, 14), acc, x, .72, PL / 2 + .006, HP, 0, 0);
      add(G.sph(.008, 6, 5), WHITE, x - .008, .73, PL / 2 + .013, 0, 0, 0, [1, 1, .4]);
      for (const sx of [-1, 1]) {
        if ((x < 0 && sx < 0 && x < -.5) || (x > .5 && sx > 0)) continue;   // only the faces toward a lane get a light strip
        for (const [z0, z1] of [[-.38, WZ - .03], [WZ + .03, .38]]) add(G.pbox(.006, .025, z1 - z0), acc, x + sx * (PW / 2 + .003), .8, (z0 + z1) / 2);
      }
    }
    // lane floor plates with a yellow arrow
    for (const cxl of [-.43, .43]) {
      add(G.pbox(.64, PLATE, PL), '#c3c9d6', cxl, PLATE / 2, 0);
      const ar = new THREE.Shape(); ar.moveTo(0, .09); ar.lineTo(.07, .01); ar.lineTo(.03, .01); ar.lineTo(.03, -.08); ar.lineTo(-.03, -.08); ar.lineTo(-.03, .01); ar.lineTo(-.07, .01); ar.lineTo(0, .09);
      add(G.ext(ar, .004, 0, 2), YELLOW, cxl, PLATE, .26, -HP, 0, 0);
    }
  }));
  f.add(mg('securitygate-prints', atlasMat(), ({ add, addM }) => {
    for (const x of PX) addM(quadGeo(.13, .1625, RG.reader), rdM(x).multiply(xf(0, .025 + .006, 0, -HP)));
    add(quadGeo(.09, .15, RG.staff), PX[2] + PW / 2 + .006, .5, .1, 0, HP, 0);
  }));
  f.add(transparent(mg('securitygate-glass', glassMat(), ({ addM }) => {
    for (const [x0, dir] of [[-.76, 1], [-.1, -1], [.1, 1], [.76, -1]]) {
      const g = G.ext(rrShape(0, 0, .33, .44, .06), .012, 0, 4); g.translate(0, 0, -.006);
      addM(g, xf(x0 - dir * .005, .44, WZ, 0, dir > 0 ? 0 : PI, 0));
    }
  })));
  f.spot('under', null, -.43, PLATE, .17, { maxH: .4, label: '보안 게이트 밑', scale: .85 });
  f.spot('on', null, 0, PH, -.2, { maxH: .4, label: '게이트 위', scale: .65 });
  for (const x of [PX[0], PX[2]]) f.spot('on', null, x, PH, -.2, { maxH: .4, label: x < 0 ? '게이트 왼쪽 기둥 위' : '게이트 오른쪽 기둥 위', scale: .65 });   // (레벨 보고서 10/18)
};

// 게시판 (wall, span 1): a cork notice board in a navy frame over a wood pen ledge — a recycling guide, an elevator-check notice, a lost cat,
// lunchtime yoga, sticky notes and push pins; a 플리마켓 flyer taped at the top flips up to show what was tucked behind it.
B.noticeboard = (f, T) => {
  const woodD = col(T, 'woodD'), navy = col(T, 'navy'), tk = [woodD, navy].join(',');
  const BX = .46, Y0 = .96, Y1 = 1.68, FT = .04, CZ = .034, FZ = .056, PZ = CZ + .006;
  const POST = [[RG.recycle, -.27, 1.44, .2, .267, .03, TOMATO], [RG.inspect, .03, 1.53, .26, .146, -.02, MUSTARD], [RG.cat, .3, 1.47, .16, .208, .05, SKY], [RG.yoga, -.04, 1.25, .16, .208, -.04, MINT]];
  f.add(mg('noticeboard-cork', mat('#ffffff', { map: corkTex() }), ({ P }) => P(2 * BX - 2 * FT, Y1 - Y0 - 2 * FT, CZ - .004, 0, (Y0 + Y1) / 2, (CZ + .004) / 2, .45)));
  f.add(mc('noticeboard|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(FT, Y1 - Y0, FZ - .004, .01), navy, sx * (BX - FT / 2), (Y0 + Y1) / 2, (FZ + .004) / 2);
    for (const y of [Y0 + FT / 2, Y1 - FT / 2]) add(G.box(2 * BX - 2 * FT, FT, FZ - .004, .01), navy, 0, y, (FZ + .004) / 2);
    add(G.box(.5, .02, .07, .006), woodD, 0, Y0 - .01, .06);
    add(G.cap(.011, .11, 2, 6), navy, -.12, Y0 + .011, .07, 0, .1, HP);
    add(G.cap(.011, .11, 2, 6), TOMATO, .1, Y0 + .011, .065, 0, -.15, HP);
    add(G.box(.5, .09, .016, .005), navy, 0, Y1 + .06, .012);
    for (const [, x, y, w, h, rz, c] of POST) { const px = x - Math.sin(rz) * h / 2, py = y + Math.cos(rz) * h / 2 - .014; add(G.sph(.013, 8, 6), c, px, py, PZ + .008); }
    add(G.sph(.013, 8, 6), TOMATO, .24, 1.356, PZ + .006);
  }));
  f.add(mg('noticeboard-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.46, .081, RG.notice), 0, Y1 + .06, .02 + .006);
    for (const [rc, x, y, w, h, rz] of POST) add(quadGeo(w, h, rc), x, y, PZ, 0, 0, rz);
    add(quadGeo(.08, .08, RG.sticky), -.3, 1.12, PZ, 0, 0, .1);
    add(quadGeo(.08, .08, RG.sticky2), -.19, 1.07, PZ, 0, 0, -.12);
  }));
  // the flyer (its own mesh): taped at its top edge, it flips up
  const pv = new THREE.Group(); put(pv, .24, 1.33, CZ + .004);
  pv.add(mc('noticeboard-flyer', ({ add }) => add(G.pbox(.18, .225, .003), WHITE, 0, -.1125, .0015)));
  pv.add(mg('noticeboard-flyerprint', atlasMat(), ({ add }) => add(quadGeo(.17, .2125, RG.flea), 0, -.1125, .003 + .006)));
  f.add(pv);
  const p = f.part('flip', pv, t => { pv.rotation.x = -2.0 * t; }, { label: '플리마켓 전단지', sfx: 'swish', dur: .3 });
  f.spot('inside', null, .24, 1.21, CZ + .002, { part: p, maxH: .09, label: '전단지 뒤', wallFace: true, scale: .8 });
};

// 정수기 (1×1): an office water cooler with a big blue bottle upside down on top — hot and cold taps over a drip tray, a 정수기
// label, a paper-cup tube on the side; the mint cabinet door below opens onto spare cups and filters.
B.watercan = (f, T) => {
  const acc = col(T, 'accent'), navy = col(T, 'navy'), tk = [acc, navy].join(',');
  const W = .38, D = .36, z0 = -.06, FZ = z0 + D / 2, BZ = z0 - D / 2, BY = .54, TOPY = 1.04, body = '#eef2f7', inner = '#c9d2de', water = '#8fd0f5';
  f.add(mc('watercan|' + tk, ({ add, tube }) => {
    add(G.box(W - .02, .06, D - .02, .012), '#7d8296', 0, .03, z0);
    add(G.pbox(W - .04, .02, D - .02), inner, 0, .07, z0 + .01);
    for (const sx of [-1, 1]) add(G.pbox(.02, BY - .06, D), body, sx * (W / 2 - .01), (BY + .06) / 2, z0);
    add(G.pbox(W - .04, BY - .06, .02), inner, 0, (BY + .06) / 2, BZ + .01);
    add(G.box(W, TOPY - BY, D, .03), body, 0, (BY + TOPY) / 2, z0);
    add(G.box(.3, .3, .012, .006), navy, 0, .76, FZ + .006);
    for (const [x, c] of [[-.065, '#3f9be0'], [.065, RED]]) {
      add(G.box(.05, .05, .05, .01), c, x, .8, FZ + .012 + .025);
      add(G.cyl(.01, .01, .04, 8), STEEL, x, .765, FZ + .05);
      add(G.box(.05, .012, .04, .004), WHITE, x, .835, FZ + .045);
    }
    add(G.box(.26, .03, .1, .008), '#7d8296', 0, .63, FZ + .04);
    for (let k = 0; k < 5; k++) add(G.pbox(.006, .004, .08), '#5d6276', -.1 + k * .05, .647, FZ + .04);
    // the bottle (upside down in its collar)
    add(G.cyl(.13, .13, .04, 24), body, 0, TOPY + .02, z0);
    add(G.tor(.13, .008, PI * 2, 4, 24), navy, 0, TOPY + .03, z0, HP, 0, 0);
    add(G.lathe([[0, 0], [.045, 0], [.045, .06], [.12, .1], [.16, .15], [.165, .2], [.165, .36], [.16, .4], [.13, .43], [0, .44]], 24), water, 0, TOPY + .04, z0);
    for (const y of [.22, .3]) add(G.tor(.166, .007, PI * 2, 4, 24), shade(water, -.1), 0, TOPY + .04 + y, z0, HP, 0, 0);
    add(G.cap(.012, .2, 2, 6), WHITE, -.09, TOPY + .32, z0 + .135);
    add(G.cap(.008, .1, 2, 6), WHITE, -.05, TOPY + .36, z0 + .155);
    for (let k = 0; k < 4; k++) add(G.pbox(.006, .014, .18), '#9aa3b5', W / 2 + .003, .18 + k * .045, z0 - .02);
    // paper-cup tube on the right side
    add(G.box(.02, .06, .04, .006), STEEL2, W / 2 + .01, .82, FZ - .07);
    add(G.cyl(.04, .04, .3, 14), '#e3f3fb', W / 2 + .06, .8, FZ - .07);
    add(G.cyl(.042, .03, .06, 14), WHITE, W / 2 + .06, .625, FZ - .07);
    // inside the cabinet: a stack of cups and a box of filters
    add(G.cyl(.036, .03, .2, 14), WHITE, .1, .18, BZ + .07);
    add(G.box(.12, .1, .1, .01), SKY, -.09, .13, BZ + .08);
  }));
  f.add(mg('watercan-label', atlasMat(), ({ add }) => add(quadGeo(.24, .103, RG.water), 0, .955, FZ + .006)));
  const DW = W - .044, DH = BY - .08 - .012;
  const dv = new THREE.Group(); put(dv, -W / 2 + .022, .08 + .004 + DH / 2, FZ);
  dv.add(mc('watercan-door|' + tk, ({ add }) => {
    add(G.box(DW, DH, .025, .01), acc, DW / 2, 0, -.0125);
    add(G.box(.024, .12, .022, .008), WHITE, DW - .04, .02, .011);
    add(G.pbox(DW - .08, .006, .006), shade(acc, -.12), DW / 2, -DH / 2 + .05, .003);
  }));
  dv.add(mg('watercan-note', atlasMat(), ({ add }) => add(quadGeo(.16, .08, RG.cupnote), DW / 2 - .03, .09, .006)));
  f.add(dv);
  const p = f.part('door', dv, t => { dv.rotation.y = -1.9 * t; }, { label: '정수기 아래 칸', sfx: 'open', dur: .28 });
  f.spot('inside', null, -.02, .08, -.04, { part: p, maxH: .4, label: '정수기 아래 칸', scale: .8 });
};

// 분실물 함 (1×1): a honey wooden lost-and-found chest with rope handles and corner brackets, a 분실물 LOST & FOUND sign and
// a paper tag; the navy lid (a sticky note on it) lifts onto a striped scarf, a red mitten, a rubber duck and a cap.
B.lostfound = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), navy = col(T, 'navy'), tk = [wood, woodD, navy].join(',');
  const W = .72, D = .5, H = .36, y0 = .05, t = .03, z0 = -.04, fz = z0 + D / 2, FY = .22, dy = FY - .07;   // a raised false floor keeps the finds in view
  f.add(mc('lostfound|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.08, y0, .08, .01), woodD, sx * (W / 2 - .06), y0 / 2, z0 + sz * (D / 2 - .06));
    for (const sz of [-1, 1]) add(G.pbox(W, H, t), wood, 0, y0 + H / 2, z0 + sz * (D / 2 - t / 2));
    for (const sx of [-1, 1]) add(G.pbox(t, H, D - 2 * t), wood, sx * (W / 2 - t / 2), y0 + H / 2, z0);
    add(G.pbox(W - 2 * t, .02, D - 2 * t), shade(wood, -.2), 0, FY - .01, z0);
    for (const sx of [-1, 1]) {
      for (const y of [.12, .24]) add(G.pbox(.006, .008, D - .04), woodD, sx * (W / 2 + .003), y0 + y, z0);
      add(G.tor(.05, .012, PI, 4, 12), '#e8c48e', sx * (W / 2 + .014), y0 + H * .62, z0, 0, HP, PI);
      for (const sz of [-1, 1]) add(G.pbox(.012, .1, .05), STEEL2, sx * (W / 2 + .006), y0 + H - .06, z0 + sz * (D / 2 - .025));
    }
    for (const sx of [-1, 1]) add(G.pbox(.05, .1, .012), STEEL2, sx * (W / 2 - .025), y0 + H - .06, fz + .006);
    // a kraft tag on a string at the front corner
    tube([-W / 2 + .06, y0 + H - .02, fz + .006], [-W / 2 + .1, y0 + H - .1, fz + .012], .003, '#c9c3d9', 4);
    add(G.box(.07, .1, .004, .002), '#e8bb82', -W / 2 + .11, y0 + H - .15, fz + .012, 0, 0, .2);
    // inside: a striped scarf, a red mitten, a rubber duck, a cap
    add(G.box(.36, .06, .3, .02), TOMATO, -.12, .1 + dy, z0 + .02);
    for (const x of [-.24, -.12, 0]) add(G.pbox(.04, .004, .3), WHITE, x, .132 + dy, z0 + .02);
    add(G.sph(.07, 10, 8), RED, .2, .11 + dy, z0 + .07, 0, .3, 0, [1, .45, 1.3]);
    add(G.sph(.03, 8, 6), RED, .14, .11 + dy, z0 + .12, 0, .3, 0, [1, .5, 1]);
    add(G.box(.13, .03, .05, .01), WHITE, .23, .11 + dy, z0 - .03, 0, .3, 0);
    add(G.sph(.055, 12, 8), YELLOW, .2, .12 + dy, z0 - .14, 0, 0, 0, [1.2, .85, 1]);
    add(G.sph(.038, 10, 8), YELLOW, .24, .19 + dy, z0 - .12);
    add(G.cone(.016, .03, 6), ORANGE, .28, .185 + dy, z0 - .11, 0, 0, -HP);
    for (const s of [-1, 1]) add(G.sph(.007, 6, 4), INK, .255, .2 + dy, z0 - .12 + s * .028);
    add(G.dome(.07, 14, 5), col(T, 'navy'), -.2, .07 + dy, -.22, 0, 0, 0, [1, .8, 1]);
    add(G.box(.09, .008, .07, .004), col(T, 'navy'), -.1, .074 + dy, -.22);
  }));
  f.add(mg('lostfound-sign', atlasMat(), ({ add }) => add(quadGeo(.5, .25, RG.lost), .05, y0 + H / 2 + .01, fz + .006)));
  const lid = new THREE.Group(); put(lid, 0, y0 + H, z0 - D / 2 - .01);
  lid.add(mc('lostfound-lid|' + tk, ({ add }) => {
    add(G.box(W + .03, .04, D + .03, .015), navy, 0, .02, D / 2 + .01);
    add(G.box(.16, .03, .03, .01), GOLD, 0, .02, D + .04);
    for (const sx of [-1, 1]) add(G.pbox(.08, .006, .08), GOLD, sx * (W / 2 - .03), .04 + .003, D / 2 + .01 + (D / 2 - .03));
  }));
  lid.add(mg('lostfound-lidnote', atlasMat(), ({ add }) => add(quadGeo(.12, .12, RG.sticky), -.12, .04 + .006, D / 2, -HP, 0, .2)));
  f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.75 * t; }, { label: '분실물 함 뚜껑', sfx: 'open' });
  f.spot('inside', null, -.12, .135 + dy, z0 + .03, { part: p, maxH: .3, label: '분실물 함 안', scale: .8 });
};

// ═════════════════════════════════════════════ ROOFTOP ═════════════════════════════════════════════
// 물탱크 (1×1): a ribbed sky-blue water tank on a steel stand — a 물탱크 · 음용수 label band, a hatch and a vent on the domed
// top (a pigeon keeps watch), a ladder up the side, the outlet pipe with a red valve wheel. Things roll under the stand.
B.watertank = (f, T) => {
  const tank = col(T, 'tank'), tk = [tank].join(',');
  const LH = .5, R = .37, TH = .74, ty = LH + .04, L = .33, frame = '#7d8aa3', pipe = '#c3c9d6';
  f.add(mc('watertank|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(G.box(.05, LH, .05, .008), frame, sx * L, LH / 2, sz * L); add(G.box(.09, .02, .09, .006), frame, sx * L, .01, sz * L); }
    for (const s of [-1, 1]) { tube([-L, .18, s * L], [L, .18, s * L], .014, frame, 6); tube([s * L, .18, -L], [s * L, .18, L], .014, frame, 6); }
    for (const s of [-1, 1]) { tube([-L, .05, s * L], [L, .45, s * L], .01, frame, 5); tube([L, .05, s * L], [-L, .45, s * L], .01, frame, 5); }
    add(G.box(.8, .04, .8, .012), frame, 0, LH + .02, 0);
    add(G.cyl(R, R, TH, 32), tank, 0, ty + TH / 2, 0);
    for (const y of [.1, .28, .5, .66]) add(G.tor(R + .006, .018, PI * 2, 5, 32), shade(tank, -.1), 0, ty + y, 0, HP, 0, 0);
    add(G.dome(R, 32, 6), tank, 0, ty + TH, 0, 0, 0, 0, [1, .28, 1]);
    add(G.cyl(.12, .12, .05, 18), shade(tank, .14), 0, ty + TH + .115, 0);
    add(G.tor(.05, .01, PI, 4, 10), STEEL2, 0, ty + TH + .14, 0);
    tube([-.2, ty + TH + .06, -.12], [-.2, ty + TH + .2, -.12], .02, pipe, 8);
    add(G.cyl(.045, .03, .04, 10), pipe, -.2, ty + TH + .22, -.12);
    // ladder up the right side
    const lx = R + .07;
    for (const sz of [-1, 1]) { tube([lx, 0, sz * .1], [lx, ty + TH + .02, sz * .1], .012, STEEL, 6); tube([lx, ty + TH + .02, sz * .1], [R - .08, ty + TH + .07, sz * .1], .012, STEEL, 6); }
    for (let y = .14; y < ty + TH; y += .14) tube([lx, y, -.1], [lx, y, .1], .009, STEEL, 5);
    tube([lx, LH + .02, 0], [.4, LH + .02, 0], .008, STEEL2, 4); tube([lx, ty + .3, 0], [R - .02, ty + .3, 0], .008, STEEL2, 4);
    // outlet pipe, valve wheel
    tube([-.18, ty + .02, .18], [-.18, .26, .18], .03, pipe, 10);
    add(G.sph(.03, 10, 8), pipe, -.18, .26, .18);
    tube([-.18, .26, .18], [-.18, .26, -.48], .03, pipe, 10);
    add(G.tor(.05, .009, PI * 2, 4, 16), RED, -.18, .4, .22);
    for (let i = 0; i < 3; i++) add(G.pbox(.1, .008, .008), RED, -.18, .4, .22, 0, 0, i * PI / 3);
    add(G.cyl(.014, .014, .04, 8), RED, -.18, .4, .2, HP, 0, 0);
    pigeon(add, tube, .13, ty + TH + .085, .15, -.7);
  }));
  f.add(mg('watertank-label', atlasMat(), ({ add }) => add(bandGeo(R + .008, .15, RG.tank, 2.0), 0, ty + .39, 0)));
  f.spot('under', null, .06, 0, .02, { maxH: .42, label: '물탱크 밑', scale: .85 });
};

// 실외기 (1×1): an AC outdoor unit on a steel rail stand against the back — a big round fan grille (it swings open onto the
// fan bay), louvres and a COOL label on the right, a 주의 sticker and taped pipes on the side, a brick and a pigeon on top.
B.outdoorunit = (f, T) => {
  const W = .82, H = .62, D = .34, y0 = .1, BZ = -.44, FZ = BZ + D, XS = .11, body = '#f3f5f9', bodyD = '#dce1ea', bay = '#c5ccd8';
  const PW = XS + W / 2 - .004, PHt = H - .004, fcx = -W / 2 + PW / 2, fcy = y0 + H / 2;
  f.add(mc('outdoorunit', ({ add, addM, tube }) => {
    for (const z of [BZ + .07, FZ - .07]) { add(G.box(W + .06, .04, .05, .006), '#8d97ab', 0, .08, z); for (const sx of [-1, 1]) add(G.box(.08, .06, .08, .012), CHAR, sx * (W / 2 - .02), .03, z); }
    add(G.box(W / 2 - XS, H, D, .02), body, (XS + W / 2) / 2, y0 + H / 2, (BZ + FZ) / 2);
    add(G.pbox(XS + W / 2, H, .02), '#555c70', (XS - W / 2) / 2, y0 + H / 2, BZ + .01);
    add(G.pbox(.02, H, D - .02), body, -W / 2 + .01, y0 + H / 2, (BZ + .02 + FZ) / 2);
    for (const y of [y0 + .01, y0 + H - .01]) add(G.pbox(XS + W / 2 - .02, .02, D - .02), body, (XS - W / 2 + .02) / 2, y, (BZ + .02 + FZ) / 2);
    add(G.box(W + .02, .02, D + .02, .006), bodyD, 0, y0 + H + .01, (BZ + FZ) / 2);
    // the fan in its bay
    add(G.cyl(.05, .05, .06, 16), '#8d97ab', fcx, fcy, BZ + .08, HP, 0, 0);
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + .4; addM(G.sph(.11, 12, 8), xf(fcx + Math.cos(a) * .1, fcy + Math.sin(a) * .1, BZ + .09, 0, 0, a).multiply(xf(0, 0, 0, .5, 0, 0, [1, .42, .12])), '#d3dae6'); }
    // right section: louvres, label
    add(G.pbox(.24, .44, .006), '#6d7488', (XS + W / 2) / 2, y0 + .29, FZ + .003);
    for (let k = 0; k < 7; k++) add(G.box(.26, .018, .03, .004), bodyD, (XS + W / 2) / 2, y0 + .1 + k * .062, FZ + .018, -.5, 0, 0);
    // pipes out of the side, wrapped in tape, down to the floor and back to the wall
    const px = W / 2;
    add(G.box(.02, .1, .08, .006), bodyD, px + .01, y0 + .2, -.17);
    tube([px - .01, y0 + .17, -.17], [px + .05, y0 + .17, -.17], .026, WHITE, 8);
    add(G.sph(.026, 8, 6), WHITE, px + .05, y0 + .17, -.17);
    tube([px + .05, y0 + .17, -.17], [px + .05, .03, -.17], .026, WHITE, 8);
    add(G.sph(.026, 8, 6), WHITE, px + .05, .03, -.17);
    tube([px + .05, .03, -.17], [px + .05, .03, -.49], .026, WHITE, 8);
    for (const z of [-.26, -.38]) add(G.cyl(.029, .029, .02, 8), '#e8c48e', px + .05, .03, z, HP, 0, 0);
    tube([px - .01, y0 + .24, -.12], [px + .03, y0 + .24, -.12], .01, '#d98b5a', 6);
    // a brick and a pigeon on top
    add(G.box(.2, .06, .1, .008), '#c9583c', .2, y0 + H + .05, -.3, 0, .3, 0);
    pigeon(add, tube, -.15, y0 + H + .02, -.24, .5, .95);
  }));
  f.add(mg('outdoorunit-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.2, .071, RG.ac), (XS + W / 2) / 2, y0 + H - .055, FZ + .006);
    add(quadGeo(.14, .062, RG.caution), W / 2 + .006, y0 + .45, -.3, 0, HP, 0);
  }));
  const pv = new THREE.Group(); put(pv, -W / 2, fcy, FZ);
  pv.add(mc('outdoorunit-grille', ({ add }) => {
    const s = rrShape(0, -PHt / 2, PW, PHt, .03); s.holes.push(new THREE.Path().absarc(PW / 2, 0, .23, 0, PI * 2, true));
    add(G.ext(s, .02, 0, 6), body, 0, 0, 0);
    for (const r of [.075, .14, .205]) add(G.tor(r, .007, PI * 2, 4, 36), '#7d869c', PW / 2, 0, .012);
    for (let i = 0; i < 6; i++) add(G.pbox(.46, .009, .009), '#7d869c', PW / 2, 0, .011, 0, 0, i * PI / 6);
    add(G.cyl(.04, .04, .014, 18), '#7d869c', PW / 2, 0, .014, HP, 0, 0);
    add(G.tor(.232, .012, PI * 2, 5, 40), bodyD, PW / 2, 0, .02);
    for (const y of [-.2, .2]) add(G.box(.02, .06, .016, .005), bodyD, .02, y, .028);
  }));
  f.add(pv);
  const p = f.part('door', pv, t => { pv.rotation.y = -1.6 * t; }, { label: '실외기 그릴', sfx: 'open', dur: .3 });
  f.spot('inside', null, fcx - .02, y0 + .02, -.2, { part: p, maxH: .4, label: '실외기 안', scale: .8 });
  f.spot('on', null, 0, y0 + H, BZ + D / 2, { maxH: .4, label: '실외기 위', scale: .75 });   // (레벨 보고서 10/18: the rooftop had 2 places in plain sight)
};

// 옥상 텃밭 상자 (1×1): two styrofoam boxes from the market (제주 감귤, 싱싱 수산) turned vegetable beds on a pallet — green and
// red lettuce, a chili plant, cherry tomatoes on a stake, wooden name tags, red-coated work gloves; a mint watering can and
// a little succulent pot on the floor (the pot lifts).
B.rooftopgarden = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), pot = col(T, 'pot'), tk = [wood, woodD, pot].join(',');
  const PY = .1, z0 = -.08, BW = .42, BH = .26, BD = .48, t = .03, SY = PY + BH - .03;
  const rosette = (add, x, z, r, c1, c2, n = 7) => {
    for (let k = 0; k < n; k++) { const a = k / n * PI * 2; add(G.sph(r, 9, 7), k % 2 ? c1 : c2, x + Math.cos(a) * r * .7, SY + r * .55, z + Math.sin(a) * r * .7, 0, -a, .55, [1.15, .45, .8]); }
    add(G.sph(r * .75, 9, 7), c1, x, SY + r * .6, z, 0, 0, 0, [1, .8, 1]);
  };
  f.add(mc('rooftopgarden|' + tk, ({ add, addM, tube }) => {
    for (const z of [z0 - .3, z0, z0 + .3]) add(G.box(.9, .02, .1, .005), woodD, 0, .01, z);
    for (const x of [-.38, 0, .38]) for (const z of [z0 - .3, z0, z0 + .3]) add(G.box(.1, .055, .1, .008), woodD, x, .0475, z);
    for (let k = 0; k < 5; k++) add(G.box(.9, .025, .11, .006), wood, 0, PY - .0125, z0 - .29 + k * .145);
    for (const sx of [-1, 1]) {
      const cx = sx * .22;
      for (const sz of [-1, 1]) add(G.pbox(BW, BH, t), STYRO, cx, PY + BH / 2, z0 + sz * (BD / 2 - t / 2));
      for (const s2 of [-1, 1]) add(G.pbox(t, BH, BD - 2 * t), STYRO, cx + s2 * (BW / 2 - t / 2), PY + BH / 2, z0);
      add(G.pbox(BW - 2 * t, .02, BD - 2 * t), SOIL, cx, SY - .01, z0);
    }
    // box A: two green lettuces and a red one (적상추)
    rosette(add, -.33, z0 - .1, .06, LEAF3, LEAF);
    rosette(add, -.12, z0 - .1, .06, LEAF, LEAF3);
    rosette(add, -.23, z0 + .1, .06, '#b8475e', '#8fcf6a');
    // box B: a chili plant and cherry tomatoes on a bamboo stake
    tube([.12, SY, z0 - .04], [.12, SY + .26, z0 - .04], .008, LEAF2, 5);
    for (let k = 0; k < 7; k++) { const a = k * 2.2, y = SY + .1 + (k % 4) * .05; add(G.sph(.035, 8, 6), k % 2 ? LEAF : LEAF2, .12 + Math.cos(a) * .05, y, z0 - .04 + Math.sin(a) * .05, 0, -a, .5, [1.4, .4, .7]); }
    for (const [dx, dy, dz, c] of [[.05, .14, .03, RED], [-.04, .1, .04, '#3f9a52'], [.03, .2, -.04, RED], [-.05, .17, -.02, RED]]) add(G.cap(.011, .05, 2, 6), c, .12 + dx, SY + dy, z0 - .04 + dz, .2, 0, .15);
    tube([.32, SY - .02, z0 + .06], [.32, SY + .5, z0 + .06], .009, '#e8c48e', 6);
    tube([.3, SY, z0 + .04], [.31, SY + .42, z0 + .06], .007, LEAF2, 5);
    for (let k = 0; k < 6; k++) { const a = k * 2.4, y = SY + .12 + k * .05; add(G.sph(.034, 8, 6), k % 2 ? LEAF : LEAF2, .32 + Math.cos(a) * .06, y, z0 + .06 + Math.sin(a) * .06, 0, -a, .5, [1.4, .4, .7]); }
    for (const [dx, dy, dz] of [[.05, .2, .04], [.07, .17, .02], [.04, .15, .06], [-.05, .3, .04], [-.06, .27, .06], [.05, .36, -.02]]) add(G.sph(.024, 10, 8), dy > .25 && dz > .05 ? ORANGE : TOMATO, .32 + dx, SY + dy, z0 + .06 + dz);
    for (const s of [-1, 1]) add(G.sph(.012, 6, 5), YELLOW, .26, SY + .38 + s * .02, z0 + .1);
    // name tags on sticks
    for (const [x, y] of [[-.12, SY + .13], [.07, SY + .12], [.36, SY + .12]]) { tube([x, SY - .01, z0 + .17], [x, y - .02, z0 + .17], .006, '#c9a06c', 4); add(G.pbox(.1, .05, .006), '#e8c48e', x, y, z0 + .17); }
    // red-coated work gloves (코팅장갑) on the pallet edge: one palm up, one palm down
    for (const [x, z, ry, up] of [[-.3, .222, HP + .2, true], [-.08, .222, -HP + .15, false]]) {
      const M = xf(x, PY, z, 0, ry, 0), palm = up ? '#e8452f' : WHITE;
      addM(G.box(.08, .018, .085, .008), M.clone().multiply(xf(0, .009, 0)), palm);
      addM(G.box(.084, .022, .04, .008), M.clone().multiply(xf(0, .011, .06)), WHITE);
      for (let k = 0; k < 4; k++) addM(G.cap(.0095, .04, 2, 6), M.clone().multiply(xf(-.03 + k * .02, .01, -.068 - (k === 1 || k === 2 ? .006 : 0), HP, 0, 0)), up ? '#e8452f' : WHITE);
      if (!up) for (let k = 0; k < 4; k++) addM(G.sph(.0105, 6, 5), M.clone().multiply(xf(-.03 + k * .02, .01, -.1 - (k === 1 || k === 2 ? .006 : 0))), '#e8452f');
      addM(G.cap(.01, .03, 2, 6), M.clone().multiply(xf(.048 * (up ? 1 : -1), .01, -.02, HP, -.6 * (up ? 1 : -1), 0)), up ? '#e8452f' : WHITE);
    }
    // a mint watering can on the floor
    const wx = .26, wz = .36;
    add(G.cyl(.075, .085, .16, 18), MINT, wx, .08, wz);
    add(G.cyl(.06, .075, .03, 18), shade(MINT, -.08), wx, .175, wz);
    tube([wx + .06, .06, wz], [wx + .17, .2, wz - .02], .014, MINT, 6);
    add(G.cyl(.03, .018, .035, 10), shade(MINT, -.1), wx + .18, .215, wz - .02, 0, 0, -.7);
    add(G.tor(.06, .012, PI, 4, 12), shade(MINT, -.08), wx - .04, .19, wz, 0, 0, .4);
  }));
  f.add(mg('rooftopgarden-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.38, .114, RG.styroA), -.22, PY + BH / 2, z0 + BD / 2 + .006);
    add(quadGeo(.38, .114, RG.styroB), .22, PY + BH / 2, z0 + BD / 2 + .006);
    [[-.12, SY + .13], [.07, SY + .12], [.36, SY + .12]].forEach(([x, y], i) => add(quadGeo(.094, .047, TAG(i)), x, y, z0 + .17 + .003 + .006));
  }));
  // the little succulent pot (its own mesh): it lifts
  const pv = new THREE.Group(); put(pv, -.28, 0, .36);
  pv.add(mc('rooftopgarden-pot|' + pot, ({ add }) => {
    add(G.cyl(.1, .08, .13, 18), pot, 0, .065, 0);
    add(G.tor(.1, .016, PI * 2, 4, 20), shade(pot, -.08), 0, .13, 0, HP, 0, 0);
    add(G.cyl(.088, .088, .01, 16), SOIL, 0, .132, 0);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; add(G.cone(.026, .07, 6), k % 2 ? '#8fd0a8' : '#a9dcb9', Math.cos(a) * .035, .15, Math.sin(a) * .035, Math.sin(a) * .9, 0, -Math.cos(a) * .9); }
    add(G.sph(.026, 8, 6), '#ff9fb5', 0, .17, 0);
  }));
  f.add(pv);
  const p = f.part('lift', pv, (t, b) => { pv.position.y = b.p.y + .3 * t; pv.position.x = b.p.x - .03 * t; pv.rotation.z = .45 * t; }, { label: '작은 화분', sfx: 'lift' });
  f.spot('inside', null, -.28, 0, .36, { part: p, maxH: .28, label: '작은 화분 밑', scale: .6 });
  f.spot('on', null, .3, PY, .21, { maxH: .35, label: '화분 받침 위', scale: .7 });   // (레벨 보고서 10/18)
};

// 옥상 빨랫줄 (2×1): two poles set in concrete-filled buckets carry a white and a yellow line — a red flowered blanket (꽃무늬
// 이불) folded over the front line, a sky-striped sheet pinned on the back one, a T-shirt and socks, and a basket of folded
// towels. Something can hide on the ground behind the blanket.
B.laundryline = (f, T) => {
  const bl = col(T, 'blanket'), a2 = col(T, 'accent2'), a3 = col(T, 'accent3'), acc = col(T, 'accent'), tk = [bl, a2, a3, acc].join(',');
  const PX = .84, LY = 1.5, FZL = .12, BZL = -.12, steel = '#9fa9bd', bucket = '#3f8fd8';
  const BX0 = -.74, BX1 = .02, bw = BX1 - BX0, bcx = (BX0 + BX1) / 2;
  f.add(mc('laundryline2|' + tk, ({ add, tube, addM }) => {
    for (const sx of [-1, 1]) {
      const x = sx * PX;
      add(G.cyl(.13, .11, .24, 18), bucket, x, .12, 0);
      add(G.tor(.13, .014, PI * 2, 4, 20), shade(bucket, -.12), x, .24, 0, HP, 0, 0);
      add(G.cyl(.12, .12, .012, 18), '#c9c4bb', x, .24, 0);
      tube([x, .24, 0], [x, LY + .05, 0], .022, steel, 8);
      tube([x, LY, -.17], [x, LY, .17], .018, steel, 6);
      for (const sz of [-1, 1]) add(G.sph(.022, 8, 6), steel, x, LY, sz * .17);
    }
    tube([-PX, LY, FZL], [PX, LY, FZL], .006, WHITE, 5);
    tube([-PX, LY, BZL], [PX, LY, BZL], .006, '#ffcf5c', 5);
    // pins along the lines (the blanket's satin hem is on the blanket: it lifts)
    for (const x of [BX0 + .08, bcx, BX1 - .08]) add(G.box(.016, .05, .05, .004), [MINT, TOMATO, SKY][Math.round((x - BX0) * 3) % 3], x, LY + .01, FZL);
    for (const x of [.1, .4, .7]) add(G.box(.016, .05, .03, .004), [CORAL, MINT, MUSTARD][Math.round(x * 3) % 3], x, LY - .005, BZL);
    // a T-shirt and two socks on the front line
    add(G.ext(shirtShape(), .016, 0, 4), a3, .3, LY - .012, FZL - .008);
    add(G.pbox(.06, .03, .004), WHITE, .3, LY - .2, FZL + .008 + .004);
    for (const sx of [-1, 1]) add(G.box(.014, .04, .03, .004), [TOMATO, SKY][(sx + 1) / 2], .3 + sx * .1, LY + .005, FZL);
    for (const [x, c] of [[.6, TOMATO], [.72, acc]]) {
      add(G.box(.065, .17, .016, .006), c, x, LY - .09, FZL);
      add(G.box(.11, .06, .016, .006), c, x + .025, LY - .2, FZL);
      add(G.pbox(.067, .025, .028), WHITE, x, LY - .025, FZL);
      add(G.box(.014, .04, .03, .004), MUSTARD, x, LY + .005, FZL);
    }
    // a basket of folded towels
    const kx = .58, kz = .3, KW = .36, KH = .2, KD = .26, kc = '#ffb3c6';
    for (const sz of [-1, 1]) add(G.pbox(KW, KH, .02), kc, kx, KH / 2, kz + sz * (KD / 2 - .01));
    for (const sx of [-1, 1]) add(G.pbox(.02, KH, KD - .04), kc, kx + sx * (KW / 2 - .01), KH / 2, kz);
    add(G.pbox(KW - .04, .02, KD - .04), shade(kc, -.1), kx, .01, kz);
    for (let k = 0; k < 4; k++) add(G.box(.035, .08, .006, .002), shade(kc, -.18), kx - .105 + k * .07, .1, kz + KD / 2 + .003);
    for (const sz of [-1, 1]) add(G.box(KW + .012, .022, .028, .008), WHITE, kx, KH, kz + sz * (KD / 2 - .008));
    for (const sx of [-1, 1]) add(G.box(.028, .022, KD - .044, .008), WHITE, kx + sx * (KW / 2 - .008), KH, kz);
    add(G.box(.3, .1, .2, .02), WHITE, kx, .07, kz);
    add(G.box(.28, .06, .19, .02), MINT, kx, .15, kz, 0, .05, 0);
    add(G.box(.26, .04, .18, .014), MUSTARD, kx + .01, .2, kz, 0, -.06, 0);
    for (const dz of [-.05, .05]) add(G.pbox(.262, .005, .02), WHITE, kx + .01, .2225, kz + dz, 0, -.06, 0);
  }));
  // (⑥ 10/23 31~70판 훑기 "판자 같은 천": the blanket and the sheet hung as flat boards — now cloth with soft folds that deepen
  // toward the hem, the pattern following the folds)
  const zb = clothWave(bw, .8, 3, .014), zf = clothWave(bw, .95, 3, .02), zs = clothWave(.68, .86, 3, .018);
  f.add(mg('laundryline-blanket2|' + bl, mat('#ffffff', { map: blanketTex(bl) }), ({ addM }) => {
    addM(planarUV(ni(clothSlab(bw, .8, .016, (x, y) => -zb(x, y))).translate(bcx, LY, FZL - .05), .55), I4);   // (folds out of the way of the front half's)
    addM(planarUV(ni(G.cyl(.024, .024, bw, 12)).rotateZ(HP).translate(bcx, LY, FZL), .55), I4);
  }));
  f.add(mg('laundryline-sheet2|' + a2, mat('#ffffff', { map: stripeTex(WHITE, a2, 4) }), ({ addM }) => addM(planarUV(ni(clothSlab(.68, .86, .012, zs)).translate(.4, LY - .01, BZL), .34), I4)));
  // the front half of the blanket ("이불건조대에 이불 밴딩", ③ #97 10/21): its own cloth that curls up from the hem when
  // touched (gfx/clothbend.js); what's behind it stays where it was (not a part's spot: seen from behind as before)
  const fv = grp(); put(fv, bcx, LY, FZL + .016); f.add(fv);
  fv.add(mg('laundryline-front2|' + bl, mat('#ffffff', { map: blanketTex(bl) }), ({ addM }) => addM(planarUV(ni(clothSlab(bw, .95, .016, zf)), .55), I4)));
  fv.add(mg('laundryline-hem2', mat(GOLD), ({ addM }) => addM(ni(clothSlab(bw + .01, .04, .03, zf, -.91)), I4)));
  f.part('lift', fv, clothBend(f, fv, { along: [0, -1, 0], toward: [0, 0, 1], len: .95, turn: 4.4, bias: 3, tip: .15 }), { label: '이불', sfx: 'flip', dur: .72 });
  f.spot('behind', null, -.4, 0, -.24, { maxH: .45, label: '이불 뒤', scale: .85 });
  f.spot('on', null, .58, .22, .3, { maxH: .4, label: '빨래 바구니 위', scale: .65 });
};

// 선베드 (2×1): a honey slatted sun lounger with a raised back, a sky-striped cushion, a pillow and a rolled towel, small wheels
// at the head; a round side table with an iced coffee. Things slip under the lounger.
B.deckchair = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), lg = col(T, 'lounger'), a3 = col(T, 'accent3'), tk = [wood, woodD, lg, a3].join(',');
  const X0 = -.95, X1 = .66, Z0 = -.05, HW = .3, RY = .26, HX = X0 + .58, ST = RY + .05;
  const BM = xf(HX, RY + .04, Z0, 0, 0, -.62);   // the backrest frame: local -x runs up toward the head
  f.add(mc('deckchair|' + tk, ({ add, addM, tube }) => {
    for (const sz of [-1, 1]) add(G.box(X1 - X0, .06, .04, .01), wood, (X0 + X1) / 2, RY, Z0 + sz * (HW - .02));
    for (const x of [X0 + .08, X1 - .08]) for (const sz of [-1, 1]) add(G.box(.05, RY, .05, .01), woodD, x, RY / 2, Z0 + sz * .25);
    for (const sz of [-1, 1]) { add(G.cyl(.04, .04, .025, 14), CHAR, X0 + .08, .04, Z0 + sz * .3, HP, 0, 0); add(G.cyl(.015, .015, .03, 8), STEEL, X0 + .08, .04, Z0 + sz * .3, HP, 0, 0); }
    for (let x = HX + .04; x < X1 - .02; x += .1) add(G.box(.07, .02, 2 * HW - .06, .005), wood, x, RY + .04, Z0);
    for (const sz of [-1, 1]) addM(G.box(.58, .04, .04, .01), BM.clone().multiply(xf(-.29, .0, sz * (HW - .02))), wood);
    for (let k = 0; k < 5; k++) addM(G.box(.07, .02, 2 * HW - .06, .005), BM.clone().multiply(xf(-.06 - k * .11, .03, 0)), wood);
    for (const sz of [-1, 1]) tube([X0 + .14, RY + .03, Z0 + sz * .2], [X0 + .3, RY + .22, Z0 + sz * .2], .012, woodD, 6);
    addM(G.cap(.055, .36, 2, 10), BM.clone().multiply(xf(-.48, .13, 0, HP, 0, 0)), WHITE);
    // rolled towel at the foot
    add(G.cyl(.05, .05, .4, 14), WHITE, X1 - .1, ST + .06 + .05, Z0, HP, 0, 0);
    for (const dz of [-.12, .12]) add(G.cyl(.052, .052, .03, 14), a3, X1 - .1, ST + .11, Z0 + dz, HP, 0, 0);
    // side table and an iced coffee
    const tx = .84, tz = .05;
    add(G.cyl(.13, .13, .03, 22), wood, tx, .42, tz);
    add(G.cyl(.018, .018, .38, 8), woodD, tx, .22, tz);
    add(G.cyl(.09, .1, .02, 18), woodD, tx, .01, tz);
    add(G.cyl(.036, .03, .09, 14), '#8a5a3c', tx - .04, .435 + .045, tz + .05);
    add(G.cyl(.037, .036, .03, 14), '#f2e6d8', tx - .04, .435 + .105, tz + .05);
    add(G.dome(.038, 14, 4), '#f4fbff', tx - .04, .435 + .12, tz + .05, 0, 0, 0, [1, .5, 1]);
    tube([tx - .04, .435 + .12, tz + .05], [tx - .02, .435 + .21, tz + .06], .007, '#3fb37a', 6);
  }));
  f.add(mg('deckchair-cushion|' + lg, mat('#ffffff', { map: stripeTex(WHITE, lg, 3) }), ({ addM }) => {
    addM(planarUV(ni(G.box(X1 - HX - .06, .06, 2 * HW - .04, .025)).translate((HX + X1 - .06) / 2 + .02, ST + .03, Z0), .36), I4);
    addM(planarUV(ni(G.box(.54, .06, 2 * HW - .04, .025)).applyMatrix4(BM.clone().multiply(xf(-.3, .07, 0))), .36), I4);
  }));
  f.spot('under', null, .15, 0, .1, { maxH: .21, label: '선베드 밑', scale: .85 });
  f.spot('on', null, .88, .435, -.02, { maxH: .4, label: '선베드 옆 탁자', scale: .6 });
  f.spot('on', null, .2, ST + .06, Z0, { maxH: .35, label: '선베드 위', scale: .7 });   // (레벨 보고서 10/18)
};

// 안테나 (1×1): a TV antenna mast on crossed cinder blocks, guyed to little anchors — a fishbone aerial at the top with a
// pigeon on the boom, a white dish (a mochiTV sticker) halfway up; something lies at the base under the dish.
B.antenna = (f, T) => {
  const MX = -.1, MZ = -.12, BLK = '#c4bfb7', mast = '#b8c0cf';
  const DM = new THREE.Matrix4().makeTranslation(.07, .95, .12).multiply(new THREE.Matrix4().makeRotationY(.55)).multiply(new THREE.Matrix4().makeRotationX(-.5));
  f.add(mc('antenna', ({ add, addM, tube }) => {
    add(G.box(.4, .19, .2, .012), BLK, MX, .095, MZ);
    add(G.box(.2, .19, .4, .012), shade(BLK, -.04), MX, .285, MZ);
    for (const dx of [-.15, .15]) add(G.pbox(.07, .006, .1), '#6e6a66', MX + dx, .19 + .003, MZ);
    for (const dz of [-.1, .1]) add(G.pbox(.1, .006, .11), '#6e6a66', MX, .38 + .003, MZ + dz);
    tube([MX, .38, MZ], [MX, 1.95, MZ], .022, mast, 8);
    add(G.cyl(.04, .04, .06, 12), mast, MX, .41, MZ);
    // guy wires to anchors
    for (const [ax, az] of [[.38, .3], [-.42, .26], [.36, -.42]]) {
      tube([MX, 1.3, MZ], [ax, .03, az], .004, '#5d5872', 4);
      add(G.cyl(.05, .055, .03, 12), BLK, ax, .015, az);
      add(G.tor(.012, .004, PI * 2, 3, 8), STEEL2, ax, .04, az);
    }
    // fishbone aerial
    const AY = 1.82;
    tube([MX - .34, AY, MZ], [MX + .3, AY, MZ], .012, mast, 6);
    [[-.32, .56], [-.18, .44], [-.06, .4], [.06, .36], [.17, .33], [.27, .3]].forEach(([dx, L]) => tube([MX + dx, AY, MZ - L / 2], [MX + dx, AY, MZ + L / 2], .007, mast, 4));
    add(G.box(.05, .07, .04, .01), WHITE, MX + .03, AY - .05, MZ);
    tube([MX + .03, AY - .09, MZ], [MX + .01, 1.2, MZ + .02], .006, CHAR, 4);
    pigeon(add, tube, MX + .17, AY + .01, MZ, -.3, .6);
    // the dish on its arm
    tube([MX, .95, MZ], [.03, .93, .07], .016, mast, 6);
    addM(G.sph(.22, 22, 10), DM.clone().multiply(xf(0, 0, 0, 0, 0, 0, [1, 1, .25])), WHITE);
    addM(G.cyl(.14, .14, .01, 22), DM.clone().multiply(xf(0, 0, .062, HP, 0, 0)), '#e6eaf1');
    addM(G.cyl(.012, .012, .29, 6), DM.clone().multiply(xf(0, -.105, .14, .86, 0, 0)), mast);
    addM(G.box(.05, .05, .07, .012), DM.clone().multiply(xf(0, 0, .26)), CHAR);
    tube([.03, .93, .07], [MX + .02, .5, MZ + .1], .007, CHAR, 4);
  }));
  f.add(mg('antenna-sticker', atlasMat(), ({ addM }) => addM(quadGeo(.12, .06, RG.dish), DM.clone().multiply(xf(0, .03, .067 + .006)))));
  f.spot('under', null, .13, 0, .1, { maxH: .4, label: '안테나 받침 옆', scale: .8 });
};

// 옥상 문 (wall, span 1): the little stairwell house standing against the parapet — painted concrete walls under a slab with
// green waterproofing, a teal steel door (wired-glass window, lever, kick plate, a 꼭 닫아 주세요 note) up a concrete step,
// a glowing 비상구 sign and a bulkhead lamp. The door opens onto the landing; stairs go down into the dark, a red fire
// extinguisher in the corner.
B.rooftopdoor = (f, T) => {
  const pl = col(T, 'plaster'), rd = col(T, 'rdoor'), conc = col(T, 'concrete'), tk = [pl, rd, conc].join(',');
  const HX = .48, ZB = .1, ZF = .58, HH = 1.86, WT = .04, OX = .3, SY = .3, OY = 1.42;
  f.add(mg('rooftopdoor-walls|' + pl, mat('#ffffff', { map: concreteTex(pl) }), ({ P }) => {
    for (const sx of [-1, 1]) P(WT, HH, ZF - ZB, sx * (HX - WT / 2), HH / 2, (ZB + ZF) / 2, .9);
    P(2 * HX - 2 * WT, HH, WT, 0, HH / 2, ZB + WT / 2, .9);
    for (const sx of [-1, 1]) P(HX - WT - OX, OY, WT, sx * (OX + (HX - WT - OX) / 2), OY / 2, ZF - WT / 2, .9);
    P(2 * HX - 2 * WT, HH - OY, WT, 0, (OY + HH) / 2, ZF - WT / 2, .9);
    P(2 * OX, SY, WT, 0, SY / 2, ZF - WT / 2, .9);
    P(2 * HX - .04, 1.598, ZB - .004, 0, .799, (ZB + .004) / 2, .9);
  }));
  f.add(mc('rooftopdoor|' + tk, ({ add, tube }) => {
    add(G.box(2 * HX + .03, .08, ZF + .06 - .004, .015), conc, 0, HH + .04, (ZF + .06 + .004) / 2);
    add(G.box(2 * HX + .01, .012, ZF + .04 - .004, .004), '#5fae7a', 0, HH + .08 + .006, (ZF + .04 + .004) / 2);
    // landing and the stairs going down, nosing strips, a dark stairwell beyond
    add(G.pbox(2 * HX - 2 * WT, SY, ZF - WT - .44), conc, 0, SY / 2, (.44 + ZF - WT) / 2);
    add(G.pbox(2 * HX - 2 * WT, .2, .1), shade(conc, -.06), 0, .1, .39);
    add(G.pbox(2 * HX - 2 * WT, .1, .1), shade(conc, -.14), 0, .05, .29);
    add(G.pbox(2 * HX - 2 * WT, .02, .1), '#4a4458', 0, .01, .19);
    for (const [y, z] of [[SY, .455], [.2, .355], [.1, .255]]) add(G.pbox(2 * HX - 2 * WT - .04, .006, .025), MUSTARD, 0, y + .003, z);
    tube([.41, 1.0, .5], [.41, .62, .16], .014, STEEL, 6);
    for (const [y, z] of [[.95, .45], [.72, .24]]) tube([HX - WT, y, z], [.41, y, z], .008, STEEL, 4);
    add(G.box(.1, .06, .05, .01), CHAR, 0, 1.5, ZB + WT + .025);
    // fire extinguisher on the landing
    add(G.cyl(.05, .05, .22, 14), RED, -.34, SY + .11, .49);
    add(G.dome(.05, 14, 4), RED, -.34, SY + .22, .49);
    add(G.box(.04, .04, .03, .008), CHAR, -.34, SY + .26, .49);
    tube([-.33, SY + .25, .5], [-.3, SY + .1, .52], .007, CHAR, 4);
    // outside: a step with a mat, the steel door frame, the exit sign box, the bulkhead lamp
    add(G.box(.7, .16, .2, .012), conc, 0, .08, ZF + .1);
    add(G.box(.5, .012, .15, .004), '#5fbf7a', 0, .166, ZF + .1);
    for (const sx of [-1, 1]) add(G.pbox(.04, OY - SY + .02, .05), shade(rd, -.18), sx * (OX + .016), (OY + SY) / 2 + .01, ZF + .005);
    add(G.pbox(2 * OX + .072, .04, .05), shade(rd, -.18), 0, OY + .016, ZF + .005);
    add(G.box(.3, .11, .03, .008), WHITE, 0, 1.63, ZF + .015);
    add(G.box(.12, .03, .05, .01), CHAR, 0, 1.78, ZF + .025);
    add(G.sph(.055, 12, 8), CHAR, 0, 1.75, ZF + .06, 0, 0, 0, [1.4, .9, .6]);
  }));
  f.add(mesh(geo('bd-bulkhead', () => new THREE.SphereGeometry(.045, 12, 8).scale(1.3, .8, .5).translate(0, 1.75, ZF + .088)), bulbMat()));
  f.add(mg('rooftopdoor-exit', signMat(), ({ add }) => add(quadGeo(.28, .096, RG.exit), 0, 1.63, ZF + .03 + .006)));
  // the door (its own mesh): hinged on the left, swings out
  const DW = .584, DH = OY - .006 - (SY + .004);
  const pv = new THREE.Group(); put(pv, -DW / 2, SY + .004 + DH / 2, ZF);
  pv.add(mc('rooftopdoor-door|' + rd, ({ add }) => {
    add(G.box(DW, DH, .04, .008), rd, DW / 2, 0, -.02);
    add(G.pbox(DW - .06, .12, .006), STEEL2, DW / 2, -DH / 2 + .08, .003);
    for (const y of [-.2, -.26]) add(G.pbox(DW - .1, .012, .006), shade(rd, -.1), DW / 2, y, .003);
    const wx = DW / 2, wy = .27, ww = .26, wh = .2;
    add(G.pbox(ww, wh, .004), '#bfe6f5', wx, wy, .002);
    for (const sx of [-1, 1]) add(G.pbox(.02, wh + .04, .012), shade(rd, -.18), wx + sx * (ww / 2 + .01), wy, .006);
    for (const sy of [-1, 1]) add(G.pbox(ww, .02, .012), shade(rd, -.18), wx, wy + sy * (wh / 2 + .01), .006);
    for (let k = 1; k < 4; k++) add(G.pbox(.003, wh, .003), '#8fb3c9', wx - ww / 2 + k * ww / 4, wy, .0075);
    for (let k = 1; k < 3; k++) add(G.pbox(ww, .003, .003), '#8fb3c9', wx, wy - wh / 2 + k * wh / 3, .0075);
    add(G.cyl(.032, .032, .012, 14), STEEL, DW - .07, -.02, .006, HP, 0, 0);
    add(G.box(.12, .022, .022, .008), STEEL, DW - .12, -.02, .03);
    add(G.cyl(.006, .006, .004, 8), INK, DW - .07, -.06, .002, HP, 0, 0);
  }));
  pv.add(mg('rooftopdoor-note', atlasMat(), ({ add }) => add(quadGeo(.16, .189, RG.doornote), .2, -.06, .006, 0, 0, .04)));
  f.add(pv);
  const p = f.part('door', pv, t => { pv.rotation.y = -1.75 * t; }, { label: '옥상 문', sfx: 'door', dur: .36 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: DW - .07, y: -.17, z: .03, parent: pv };   // (레벨 보고서 10/18) a padlock under the handle: the rooftop had nothing to lock
  f.spot('inside', null, .08, SY, .49, { part: p, maxH: .45, label: '옥상 계단실 안', scale: .85 });
};

export const BUILDING_BUILDERS = B;

export const BUILDING_INFO = {
  // 로비
  elevator: { wall: true, span: 2, name: '엘리베이터', price: 560, region: 'building' },
  reception: { w: 2, d: 1, name: '안내 데스크', price: 420, region: 'building' },
  lobbysofa: { w: 2, d: 1, name: '로비 소파', price: 320, region: 'building' },
  mailboxes2: { wall: true, span: 2, name: '우편함 벽', price: 360, region: 'building' },
  plantbig: { w: 1, d: 1, name: '큰 화분', price: 200, region: 'building' },
  securitygate: { w: 2, d: 1, name: '보안 게이트', price: 480, region: 'building' },
  noticeboard: { wall: true, span: 1, name: '게시판', price: 150, region: 'building' },
  watercan: { w: 1, d: 1, name: '정수기', price: 220, region: 'building' },
  lostfound: { w: 1, d: 1, name: '분실물 함', price: 180, region: 'building' },
  // 옥상
  watertank: { w: 1, d: 1, name: '물탱크', price: 380, region: 'building' },
  outdoorunit: { w: 1, d: 1, name: '실외기', price: 240, region: 'building' },
  rooftopgarden: { w: 1, d: 1, name: '옥상 텃밭 상자', price: 260, region: 'building' },
  laundryline: { w: 2, d: 1, name: '옥상 빨랫줄', price: 280, region: 'building' },
  deckchair: { w: 2, d: 1, name: '선베드', price: 300, region: 'building' },
  antenna: { w: 1, d: 1, name: '안테나', price: 230, region: 'building' },
  rooftopdoor: { wall: true, span: 1, name: '옥상 문', price: 340, region: 'building' },
};

// Suggested themes (stages.js THEMES shape). Extra keys these props read: navy, stone, sofa, tank, rdoor, blanket, lounger,
// plaster, concrete. The rooftop is outdoor: brick paving under a clear sky, plaster-and-brick parapets ('alleywall' reads
// plaster / brick / roofTile), and every key the street / alley themes carry.
const BASE_T = { trim: '#ffffff', sheet: '#ffffff', pillow: '#fff3d6', rug2: '#ffffff', knob: '#ffd84a', top: '#fffaf0' };
export const BUILDING_THEMES = {
  lobby: { ...BASE_T, name: '빌딩 로비', friend: null, bg: ['#eef4fb', '#dde8f6'], base: '#b9c6db', floorKind: 'checker', floor: '#f5f1e9', floor2: '#d9cdbb',
    wallKind: 'tile', wall: '#fbfbfd', wall2: '#e2e8f2', wainscot: '#34508a', trim: '#d9a066', wallEdge: '#ffffff',
    wood: '#e9b884', woodD: '#c4905c', body: '#ffffff', accent: '#7fd6c0', accent2: '#8fd3f4', accent3: '#ffc23d', door: '#cfe1f5', fabric: '#fff0d8', fabric2: '#ffe3bf',
    curtain: '#f3f6fb', rug: '#34508a', rug2: '#ffffff', pot: '#e88a5c', navy: '#34508a', stone: '#ecdec6', sofa: '#2f9e8f',
    light: { ambColor: '#f6f2ff', amb: 1.5, sunColor: '#fff6ea', sun: 2.4 } },
  rooftop: { ...BASE_T, name: '빌딩 옥상', friend: null, bg: ['#e4f3ff', '#cfe8fb'], base: '#b7c3cf',
    floorKind: 'brickpave', floor: '#eadccb', floor2: '#d8c6af', pave: '#ebd2b4', asphalt: '#8d8a99',
    wallKind: 'plain', wall: '#f1ece4', wall2: '#d9846a', wainscot: '#e3d9cb', wallEdge: '#fbf8f2',
    plaster: '#eee8de', brick: '#d9846a', roofTile: '#4f7fb8', gate: '#3b8f6a', concrete: '#d9d2c6', stone: '#d8cfc2',
    wood: '#e9b884', woodD: '#c4905c', body: '#fff7ea', accent: '#7fd6c0', accent2: '#8fd3f4', accent3: '#ffc23d', door: '#bfe6d2',
    fabric: '#fff0d8', fabric2: '#ffe3bf', curtain: '#fff3d6', rug: '#fff3df', pot: '#e07a52', vend: '#ff4d5e', bin: '#3f9a6e', soil: '#7a5536', leaf: '#5fc45a',
    awning: '#ff5a4a', shop: '#fffaf2', stall: '#fff1dc', stool: '#ff4f4a', bike: '#4fae9b', lamp: '#5d7088',
    navy: '#34508a', tank: '#3f9be0', rdoor: '#3f9e86', blanket: '#e8475a', lounger: '#3fa9d6',
    light: { ambColor: '#eef4ff', amb: 1.55, sunColor: '#fff4e2', sun: 2.45 } },
};

// ═════════════════════════════════════════════ ITEMS ═════════════════════════════════════════════
// Same shape as items.js ITEMS: { name, h, flat?, build() } → Group, origin bottom centre.
//   Object.assign(ITEMS, BUILDING_ITEMS)   (and push the keys into TARGET_POOL / a theme pool to make them stage targets)
export const BUILDING_ITEMS = {
  // 사원증: an ID card (a mochi photo, name, barcode) with its navy lanyard coiled beside it and a steel clip
  idcard: { name: '사원증', h: .03, flat: true, build() {
    const g = grp();
    // (① 모델 품질 10/22: the lanyard loop was as big as the card — the card bigger, in a blue holder edge, the strap loop small)
    g.add(mc('it-idcard2', ({ add }) => {
      add(G.box(.15, .008, .2, .004), '#3f7fe0', -.03, .004, 0);
      add(G.box(.138, .006, .188, .003), WHITE, -.03, .009, 0);
      add(G.tor(.04, .01, PI * 2, 4, 20), '#34508a', .095, .005, -.055, HP, 0, 0, [1, 1.2, .5]);
      add(G.box(.035, .012, .022, .004), STEEL, .05, .01, -.07);
    }));
    g.add(mg('it-idcard-print2', atlasMat(), ({ add }) => add(quadGeo(.134, .184, RG.card), -.03, .012 + .002, 0, -HP, 0, 0)));
    return g;
  } },
  // USB 메모리: a chunky mint stick with a steel plug, a white label and a star charm on a ring
  usb: { name: 'USB 메모리', h: .045, flat: true, build() {
    const g = grp();
    g.add(mc('it-usb', ({ add }) => {
      add(G.box(.11, .028, .05, .012), '#3fc1a5', 0, .014, 0);
      add(G.box(.04, .016, .034, .003), STEEL, .074, .014, 0);
      for (const dz of [-.008, .008]) add(G.pbox(.008, .004, .006), CHAR, .08, .022 + .002, dz);
      add(G.pbox(.04, .004, .03), WHITE, -.01, .028 + .002, 0);
      add(G.tor(.02, .005, PI * 2, 4, 14), STEEL2, -.07, .006, 0, HP, 0, 0);
      add(G.ext(starShape(.03, .014), .01, 0, 2), MUSTARD, -.115, .001, 0, -HP, 0, 0);
    }));
    return g;
  } },
  // 스테이플러: a red stapler on a dark base, steel tip and hinge
  stapler: { name: '스테이플러', h: .09, build() {
    // a desk stapler, a little open: a dark base with a silver anvil, a chunky red arm with a white top strip and a rounded
    // nose, a silver hinge at the back (10/20 "야매한 것들": it read as a red bar on a grey one)
    const g = grp();
    // (① 모델 품질 10/22: a chunkier arm opened wider, so the jaw — what says "stapler" — shows)
    g.add(mc('it-stapler3', ({ add }) => {
      add(G.box(.24, .022, .074, .01), CHAR, 0, .011, 0);
      add(G.pbox(.05, .004, .054), STEEL, .08, .024, 0);
      add(G.cyl(.022, .022, .078, 12), STEEL2, -.1, .032, 0, HP, 0, 0);
      add(G.box(.22, .044, .068, .018), RED, .01, .062, 0, 0, 0, .2);
      add(G.cyl(.022, .022, .068, 12), RED, .114, .085, 0, HP, 0, 0);
      add(G.pbox(.15, .006, .036), WHITE, -.005, .086, 0, 0, 0, .2);
    }));
    return g;
  } },
  // 선글라스: red-framed sunglasses lying open, the arms folded under, a glint on each lens
  sunglasses: { name: '선글라스', h: .05, flat: true, build() {
    const g = grp(), fr = '#ff5a4a';
    g.add(mc('it-sunglasses', ({ add, tube }) => {
      for (const sx of [-1, 1]) {
        add(G.cyl(.048, .048, .01, 20), '#2f3346', sx * .062, .03, 0, 0, 0, 0, [1, 1, .82]);
        add(G.tor(.05, .009, PI * 2, 5, 22), fr, sx * .062, .03, 0, HP, 0, 0, [1, .82, 1]);
        add(G.pbox(.03, .004, .008), WHITE, sx * .062 - .015, .035 + .004, -.012, 0, .5, 0);
      }
      tube([-.016, .034, -.01], [.016, .034, -.01], .007, fr, 6);
      add(G.box(.15, .01, .012, .004), fr, -.01, .012, -.05, 0, .06, 0);
      add(G.box(.15, .01, .012, .004), fr, .01, .023, -.062, 0, -.06, 0);
    }));
    return g;
  } },
  // 포스트잇: a yellow sticky-note pad (a to-do scribble on top) with a pink note stuck on it
  postit: { name: '포스트잇', h: .045, flat: true, build() {
    const g = grp();
    g.add(mc('it-postit', ({ add }) => {
      add(G.pbox(.12, .024, .12), '#ffe14d', 0, .012, 0);
      for (const y of [.006, .012, .018]) add(G.pbox(.126, .002, .126), '#f2cf2e', 0, y, 0);
      add(G.pbox(.06, .003, .06), '#ffb3c6', .06, .039, .055, 0, .6, 0);
    }));
    g.add(mg('it-postit-print', atlasMat(), ({ add }) => add(quadGeo(.112, .112, RG.note), 0, .024 + .006, 0, -HP, 0, 0)));
    return g;
  } },
};

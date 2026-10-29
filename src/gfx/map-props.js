// Map props for the bigger maps: 욕실 (bathroom), 사무실 (office floor), 지하실 (basement), and the 계단 that joins one
// floor to the next (floor-to-floor height FLOOR_H = 2.9). Same contract as furniture.js / story-props.js:
//   builder(f, T, opts) fills a Furn. Origin = footprint centre on the floor, the piece faces +z, back toward -z, 1 tile = 1.
//   Wall pieces (wall: true, span 1|2) hang on a wall's inner face: origin at the face, floor height, +z into the room.
//   parts open / lift / slide / flip; spots: inside (needs its part open) | under/behind (visible but tucked) | on (plain sight).
//   Lockable parts carry p.lockable = true and p.lockKind ('pad' | 'code'), with f.lockAt where the lock hardware goes.
//   The stairs carry f.stairs = { from, to, steps, rise, run, width } (furniture-local) for walking up / down.
// Toy-set rules (as story-props.js): chunky silhouettes, flat matte colours, few draw calls. Static decor is merged into
// ONE vertex-coloured mesh per piece (mc); text / prints share one label atlas (mg); every moving part is its own mesh.
//   import { MAP_BUILDERS, MAP_INFO } from './gfx/map-props.js';
//   registerFurniture(MAP_BUILDERS, MAP_INFO);
// MAP_THEMES holds suggested room themes (욕실 / 사무실 / 지하실) in the stages.js THEMES shape.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mat, mesh, geo, canvasTex, texCache, roundRect, shade, heartShape, STYLE } from './kit.js';
import { tr } from '../i18n.js';

export const FLOOR_H = 2.9;
const PI = Math.PI, HP = PI / 2, DS = THREE.DoubleSide;

// ── palette ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Theme keys first (pieces follow the room they are bought into); fallbacks are a fresh mint / cream / honey / sky set.
const K = { wood: '#f1d1a6', woodD: '#cfa46f', body: '#fffaf2', accent: '#7fd6c0', accent2: '#8fd3f4', accent3: '#ffcf5c', fabric: '#bfe8d8',
  fabric2: '#e3f6ee', knob: '#ffd84a', top: '#fff7ea', door: '#9fe0cf', curtain: '#9fe3d0', tub: '#a6dcf5', felt: '#b9e3d6' };
const col = (T, k) => (T && T[k]) || K[k];
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', SKY = '#8fd3f4', SKY2 = '#cdeefc', HONEY = '#ffcf5c', CORAL = '#ff9f8a', MINT = '#7fd6c0',
  MINT2 = '#c4efe2', BLUSH = '#ff9fb5', GOLD = '#ffc93c', LEAF = '#6cc46a', ORANGE = '#ffab4c', STEEL = '#c9cfe0', STEEL2 = '#a9b2c8', DARK = '#5b5672',
  LILAC = '#b9a6ff', KRAFT = '#e8bb82', COPPER = '#f0a36b';

// ── geometry helpers (same as story-props.js) ───────────────────────────────────────────────────────────────────
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
  const g = geo('mmc|' + STYLE.mode + '|' + key, () => {
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
  const g = geo('mmg|' + key, () => {
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
function dropShape(s) {
  const p = new THREE.Shape();
  p.moveTo(0, s); p.bezierCurveTo(s * .55, s * .2, s * .62, -s * .6, 0, -s * .62); p.bezierCurveTo(-s * .62, -s * .6, -s * .55, s * .2, 0, s);
  return p;
}
// A local frame inside an mc() call: A(geometry, color, x, y, z, rx, ry, rz, s) relative to (x0, y0, z0, ry0, s0).
const local = (addM, x0, y0, z0, ry0 = 0, s0 = 1) => { const M = xf(x0, y0, z0, 0, ry0, 0, s0); return (g, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => addM(g, M.clone().multiply(xf(x, y, z, rx, ry, rz, s)), c); };
// Tiny dot-eye face on a +z-facing surface (the Gotoyoda-style "objects are characters" touch).
function face(add, x, y, z, s = 1, { blush = BLUSH, smile = true } = {}) {
  for (const sx of [-1, 1]) {
    add(G.sph(.021 * s, 8, 6), INK, x + sx * .066 * s, y, z, 0, 0, 0, [1, 1.18, .45]);
    add(G.sph(.0068 * s, 5, 4), WHITE, x + sx * .066 * s - .006 * s, y + .009 * s, z + .009 * s);
    if (blush) add(G.sph(.026 * s, 8, 6), blush, x + sx * .118 * s, y - .034 * s, z - .002, 0, 0, 0, [1, .6, .3]);
  }
  if (smile) add(G.tor(.021 * s, .0058 * s, PI, 3, 8), INK, x, y - .018 * s, z + .002, 0, 0, PI);
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
function starPath(c, x, y, R, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -HP + i * PI / 5, rr = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
function heartPath(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * .7); c.bezierCurveTo(x - s * 1.2, y - s * .1, x - s * .55, y - s * .95, x, y - s * .35); c.bezierCurveTo(x + s * .55, y - s * .95, x + s * 1.2, y - s * .1, x, y + s * .7); }

// Label atlas, 1024² canvas = 512² drawing units. Row 0–3: 16 labels (128×32); below: board, chart, screen, notes, prints.
const AT = 512, PXU = .5 / 1024;
const RC = (x, y, w, h) => [x / AT + PXU, 1 - (y + h) / AT + PXU, (x + w) / AT - PXU, 1 - y / AT - PXU];
const LBL = [
  ['보일러', CREAM, '#ff7a5c', 'flame'], ['정수기', '#bfe8fb', '#2f8fd0', 'drop'], ['공구', HONEY, '#5a3d2e', 'wrench'], ['세제', WHITE, '#3fa9e8', 'bubble'],
  ['딸기', WHITE, '#ff5a6e', 'berry'], ['사과', '#fff4dc', '#4fa84a', 'apple'], ['포도', '#efe6ff', '#8a5ad8', 'grape'], ['귤', '#fff1cc', '#ff8a2a', 'orange'],
  ['꿀', HONEY, '#9a5a1a', 'hex'], ['페인트', WHITE, '#4a4560', 'splash'], ['겨울옷', '#f2d3a3', '#8a5a2e', 'snow'], ['장식', '#ffe9ec', '#e25a5a', 'star'],
  ['원두', '#8a5a3c', '#fff1dc', 'bean'], ['복사 1', '#2f5f6a', '#9ff0d8', null], ['세탁', WHITE, '#3fa9e8', 'bubble'], ['커피', CORAL, WHITE, 'cup'],
];
const LB = i => RC((i % 4) * 128, Math.floor(i / 4) * 32, 128, 32);
const RG = { board: RC(0, 128, 256, 154), chart: RC(256, 128, 70, 136), screen: RC(352, 128, 160, 100), cal: RC(256, 284, 96, 110), photo: RC(352, 284, 64, 72), memo: RC(416, 284, 96, 64) };
const NOTE = i => RC(352 + i * 40, 232, 40, 40);

function icon(c, k, x, y, s, fg, bg) {
  c.save(); c.translate(x, y); c.fillStyle = fg; c.strokeStyle = fg; c.lineCap = 'round'; c.lineJoin = 'round';
  if (k === 'flame' || k === 'drop') {
    c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * .9, -s * .1, s * .8, s * .9, 0, s * .9); c.bezierCurveTo(-s * .8, s * .9, -s * .9, -s * .1, 0, -s); c.fill();
    if (k === 'flame') { c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(0, s * .4, s * .36, s * .42, 0, 0, PI * 2); c.fill(); }
    else { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-s * .3, s * .2, s * .14, s * .28, -.3, 0, PI * 2); c.fill(); }
  } else if (k === 'wrench') {
    c.rotate(-.75); c.lineWidth = s * .5; line(c, [[0, -s * .2], [0, s * 1.05]]); blob(c, 0, -s * .55, s * .55);
    c.fillStyle = bg; c.fillRect(-s * .2, -s * 1.15, s * .4, s * .55);
  } else if (k === 'bubble') {
    c.lineWidth = 1.6; for (const [bx, by, r] of [[-s * .3, s * .2, s * .55], [s * .45, -s * .35, s * .4], [s * .5, s * .55, s * .22]]) { c.beginPath(); c.arc(bx, by, r, 0, PI * 2); c.stroke(); }
  } else if (k === 'berry') {
    c.beginPath(); c.moveTo(-s * .75, -s * .35); c.quadraticCurveTo(0, -s * .7, s * .75, -s * .35); c.quadraticCurveTo(s * .5, s * .7, 0, s * 1.0); c.quadraticCurveTo(-s * .5, s * .7, -s * .75, -s * .35); c.fill();
    c.fillStyle = '#4fbf5a'; c.beginPath(); c.ellipse(0, -s * .55, s * .55, s * .2, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#ffe9a8'; for (const [dx, dy] of [[-.25, 0], [.25, .05], [0, .4]]) blob(c, dx * s, dy * s, s * .08);
  } else if (k === 'apple' || k === 'orange') {
    c.fillStyle = k === 'apple' ? '#ff6b5a' : fg; blob(c, 0, s * .15, s * .78);
    c.fillStyle = '#4fbf5a'; c.beginPath(); c.ellipse(s * .3, -s * .7, s * .35, s * .16, -.5, 0, PI * 2); c.fill();
  } else if (k === 'grape') {
    for (const [dx, dy] of [[-.45, -.35], [0, -.35], [.45, -.35], [-.22, .1], [.22, .1], [0, .55]]) blob(c, dx * s, dy * s, s * .3);
  } else if (k === 'hex') {
    c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * PI / 3; c.lineTo(Math.cos(a) * s * .85, Math.sin(a) * s * .85); } c.closePath(); c.fill();
  } else if (k === 'splash') {
    c.fillStyle = '#ff8a7a'; blob(c, -s * .35, -s * .2, s * .5); c.fillStyle = '#5fd0b4'; blob(c, s * .4, -s * .1, s * .4); c.fillStyle = '#6fb8f0'; blob(c, 0, s * .45, s * .38);
  } else if (k === 'snow') {
    c.lineWidth = 1.8; for (let i = 0; i < 3; i++) { const a = i * PI / 3; line(c, [[Math.cos(a) * s, Math.sin(a) * s], [-Math.cos(a) * s, -Math.sin(a) * s]]); }
  } else if (k === 'star') {
    starPath(c, 0, 0, s, s * .45); c.fill();
  } else if (k === 'bean') {
    c.beginPath(); c.ellipse(0, 0, s * .55, s * .8, .5, 0, PI * 2); c.fill(); c.strokeStyle = bg; c.lineWidth = 1.6; line(c, [[-s * .2, -s * .55], [s * .1, 0], [-s * .05, s * .6]]);
  } else if (k === 'cup') {
    roundRect(c, -s * .7, -s * .45, s * 1.15, s * 1.1, s * .3); c.fill(); c.lineWidth = 2; c.beginPath(); c.arc(s * .5, s * .1, s * .32, -HP, HP); c.stroke();
  }
  c.restore();
}
function drawBoard(c, x, y, w, h) {
  c.fillStyle = '#fbfdff'; c.fillRect(x, y, w, h);
  c.lineCap = 'round'; c.lineJoin = 'round';
  txt(c, '회의', x + 30, y + 19, 19, '#3f9be0');
  c.strokeStyle = '#3f9be0'; c.lineWidth = 2.4; line(c, [[x + 12, y + 31], [x + 50, y + 31]]);
  ['아이디어', '점심 메뉴', '숨바꼭질'].forEach((s, i) => {
    const yy = y + 50 + i * 21;
    c.strokeStyle = '#4a4560'; c.lineWidth = 1.6; c.strokeRect(x + 13, yy - 6, 11, 11);
    txt(c, s, x + 30, yy + 1, 13, '#4a4560', { align: 'left' });
    if (i < 2) { c.strokeStyle = '#ff6f6f'; c.lineWidth = 2.4; line(c, [[x + 14, yy - 1], [x + 18, yy + 4], [x + 27, yy - 9]]); }
  });
  // bar chart with a rising arrow
  const bx = x + 136, by = y + 126;
  c.strokeStyle = '#4a4560'; c.lineWidth = 2; line(c, [[bx, y + 46], [bx, by], [bx + 104, by]]);
  [['#5fd0b4', 26], ['#ffc23d', 42], ['#6fb8f0', 58], ['#ff8a7a', 78]].forEach(([cc, hh], i) => { c.fillStyle = cc; c.fillRect(bx + 10 + i * 23, by - hh, 15, hh); });
  c.strokeStyle = '#ff6f6f'; c.lineWidth = 2.6; line(c, [[bx + 10, by - 44], [bx + 46, by - 62], [bx + 92, by - 96]]);
  c.fillStyle = '#ff6f6f'; c.beginPath(); c.moveTo(bx + 99, by - 101); c.lineTo(bx + 84, by - 99); c.lineTo(bx + 94, by - 88); c.closePath(); c.fill();
  // doodles: a smiley, a star, a little cat
  c.strokeStyle = '#3f9be0'; c.lineWidth = 2; c.beginPath(); c.arc(x + 36, y + 128, 12, 0, PI * 2); c.stroke();
  c.fillStyle = '#3f9be0'; blob(c, x + 32, y + 125, 1.8); blob(c, x + 40, y + 125, 1.8); c.beginPath(); c.arc(x + 36, y + 129, 5.5, .2, PI - .2); c.stroke();
  c.fillStyle = '#ffc23d'; starPath(c, x + 104, y + 24, 10, 4.5); c.fill();
  c.strokeStyle = '#ff8a7a'; c.lineWidth = 2; c.beginPath(); c.arc(x + 82, y + 130, 10, 0, PI * 2); c.stroke();
  line(c, [[x + 74, y + 124], [x + 75, y + 114], [x + 80, y + 121]]); line(c, [[x + 84, y + 121], [x + 89, y + 114], [x + 90, y + 124]]);
  txt(c, '화이팅!', x + 200, y + 22, 14, '#ff6f6f');
}
function drawChart(c, x, y, w, h) {
  c.fillStyle = '#fffdf6'; c.fillRect(x, y, w, h);
  txt(c, '목표!', x + w / 2, y + 18, 15, '#ff6f6f');
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = '#4a4560'; c.lineWidth = 1.6; line(c, [[x + 10, y + 36], [x + 10, y + 92], [x + w - 8, y + 92]]);
  c.strokeStyle = '#3f9be0'; c.lineWidth = 2.4; const P = [[x + 14, y + 84], [x + 26, y + 76], [x + 38, y + 80], [x + 50, y + 60], [x + 60, y + 44]]; line(c, P);
  c.fillStyle = '#3f9be0'; P.forEach(([px, py]) => blob(c, px, py, 2.4));
  c.fillStyle = '#ff8a7a'; heartPath(c, x + 60, y + 34, 6); c.fill();
  c.strokeStyle = '#d9d4cc'; c.lineWidth = 2; for (let i = 0; i < 3; i++) line(c, [[x + 10, y + 106 + i * 10], [x + w - (i === 2 ? 30 : 10), y + 106 + i * 10]]);
}
function drawScreen(c, x, y, w, h) {
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#bfe6ff'); g.addColorStop(1, '#e3fbf1'); c.fillStyle = g; c.fillRect(x, y, w, h);
  c.fillStyle = '#ffffff'; roundRect(c, x + 40, y + 14, 92, 64, 6); c.fill();
  c.fillStyle = '#ff9f8a'; roundRect(c, x + 40, y + 14, 92, 13, 6); c.fill(); c.fillRect(x + 40, y + 21, 92, 6);
  c.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) blob(c, x + 47 + i * 7, y + 20.5, 2);
  c.fillStyle = '#d6dbe6'; for (let i = 0; i < 4; i++) c.fillRect(x + 48, y + 35 + i * 10, i === 3 ? 44 : 74, 4);
  c.fillStyle = '#ffc23d'; roundRect(c, x + 10, y + 14, 18, 14, 3); c.fill();
  c.fillStyle = '#5fd0b4'; roundRect(c, x + 10, y + 36, 18, 16, 4); c.fill();
  c.fillStyle = '#ff9fb5'; roundRect(c, x + 10, y + 60, 18, 16, 4); c.fill();
  c.fillStyle = '#ffd23f'; blob(c, x + w - 16, y + 18, 9);
  c.fillStyle = '#4a4560'; blob(c, x + w - 19, y + 17, 1.3); blob(c, x + w - 13, y + 17, 1.3);
  c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(x, y + h - 10, w, 10);
}
function drawPrints(c) {
  [['할 일', '#ffe27a'], ['점심!', '#bff0dc'], ['', '#ffc2cf'], ['전화', '#cdeefc']].forEach(([s, bg], i) => {
    const x = 352 + i * 40, y = 232;
    c.fillStyle = bg; c.fillRect(x, y, 40, 40); c.fillStyle = shade(bg, -.08); c.fillRect(x, y, 40, 7);
    if (s) { txt(c, s, x + 20, y + 19, 11, '#4a4560'); c.strokeStyle = shade(bg, -.18); c.lineWidth = 1.4; line(c, [[x + 8, y + 31], [x + 32, y + 31]]); }
    else { c.fillStyle = '#ff6f8a'; heartPath(c, x + 20, y + 24, 9); c.fill(); }
  });
  // calendar
  let x = 256, y = 284;
  c.fillStyle = '#ffffff'; c.fillRect(x, y, 96, 110); c.fillStyle = '#ff8a7a'; c.fillRect(x, y, 96, 24); txt(c, '10월', x + 48, y + 13, 15, '#ffffff');
  c.fillStyle = '#c9c3d9'; for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) c.fillRect(x + 8 + k * 14, y + 34 + r * 15, 9, 8);
  c.strokeStyle = '#ff4d5e'; c.lineWidth = 2; c.beginPath(); c.arc(x + 54.5, y + 68, 8, 0, PI * 2); c.stroke();
  // polaroid with a cat
  x = 352; y = 284;
  c.fillStyle = '#ffffff'; c.fillRect(x, y, 64, 72); c.fillStyle = '#bfe6ff'; c.fillRect(x + 6, y + 6, 52, 48);
  c.fillStyle = '#ffab4c'; blob(c, x + 32, y + 36, 14); c.beginPath(); c.moveTo(x + 19, y + 30); c.lineTo(x + 21, y + 16); c.lineTo(x + 29, y + 24); c.fill(); c.beginPath(); c.moveTo(x + 45, y + 30); c.lineTo(x + 43, y + 16); c.lineTo(x + 35, y + 24); c.fill();
  c.fillStyle = '#2a1d33'; blob(c, x + 27, y + 35, 1.8); blob(c, x + 37, y + 35, 1.8); c.fillStyle = '#ff7f9e'; blob(c, x + 32, y + 39, 1.6);
  txt(c, '우리 냥이', x + 32, y + 63, 10, '#4a4560');
  // memo
  x = 416; y = 284;
  c.fillStyle = '#fff7df'; c.fillRect(x, y, 96, 64); txt(c, '회의 3시', x + 48, y + 22, 17, '#ff6f6f');
  c.strokeStyle = '#ff6f6f'; c.lineWidth = 2; c.lineCap = 'round'; line(c, [[x + 16, y + 34], [x + 80, y + 34]]); txt(c, '꼭 오기!', x + 48, y + 49, 12, '#4a4560');
}
const atlas = () => tex('map-atlas', 1024, 1024, c => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, AT, AT);
  LBL.forEach(([s, bg, fg, ic], i) => {
    const x = (i % 4) * 128, y = Math.floor(i / 4) * 32;
    c.fillStyle = bg; c.fillRect(x, y, 128, 32);
    if (ic) { icon(c, ic, x + 24, y + 16, 10, fg, bg); txt(c, s, x + 76, y + 17, s.length > 2 ? 18 : 20, fg); }
    else { txt(c, s, x + 64, y + 17, 20, fg); }
  });
  drawBoard(c, 0, 128, 256, 154); drawChart(c, 256, 128, 70, 136); drawScreen(c, 352, 128, 160, 100); drawPrints(c);
}, { text: true });
const atlasMat = () => mat('#ffffff', { map: atlas() });
// A label band round the front of a cylinder (radius r, height h, arc a), or a flat label quad, mapped to an atlas rect.
const bandGeo = (r, h, rc, a = 2.2) => cellUV(new THREE.CylinderGeometry(r, r, h, 8, 1, true, -a / 2, a), rc);
const quadGeo = (w, h, rc) => cellUV(new THREE.PlaneGeometry(w, h), rc);

const dotTex = bg => tex('map-dots|' + bg, 128, 128, (c, w, h) => {
  c.fillStyle = tint(bg); c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffffff'; blob(c, w * .25, h * .25, w * .11); blob(c, w * .75, h * .75, w * .11);
}, { repeat: [1, 1] });
const stripeTex = c1 => tex('map-stripe|' + c1, 64, 64, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = tint(c1); c.fillRect(0, 0, w / 2, h);
}, { repeat: [1, 1] });

const B = {};

// ═════════════════════════════════════════════ BATHROOM ═════════════════════════════════════════════
// 욕조 (2×1): a sky-skinned roll-top tub on gold ball feet, bubbles heaped at one end, a rubber duck on the rim.
// A free-standing curtain frame; the dotted shower curtain bunches to the left to show the tub.
// (o.blackout — 9판 정전 욕실, 사용자 10/23 메모: 거품 방울 대신 벽 샤워기, 찾는 오리랑 헷갈리는 욕조 오리는 빼고, 테두리에 촛불 셋;
// 커튼 밑단은 욕조 테두리 위에서 멈춤 — 커튼이 욕조로 들어가며 뚫려 보이던 것)
B.bathtub = (f, T, o = {}) => {
  const skin = col(T, 'tub'), curt = col(T, 'curtain'), dark = !!o.blackout, tk = [skin, curt, dark].join(',');
  const TW = 1.78, TD = .8, cz = -.08, y0 = .13, y1 = .54, rim = .075, fz = cz + TD / 2;
  const PX = .93, PZB = -.47, PZF = fz + .08, RY = 2.0;
  const ring = (w, d, r, t) => { const s = rrShape(-w / 2, -d / 2, w, d, r); s.holes.push(rrShape(-w / 2 + t, -d / 2 + t, w - 2 * t, d - 2 * t, r - t)); return s; };
  f.add(mc('bathtub|' + tk, ({ add, addM, tube }) => {
    add(G.ext(ring(TW, TD, .32, .036), y1 - y0 - .035, .012, 6), skin, 0, y0, cz, -HP, 0, 0);                 // outer skin
    add(G.ext(ring(TW - .06, TD - .06, .29, rim - .034), y1 - y0, .014, 6), WHITE, 0, y0, cz, -HP, 0, 0);       // inner wall + rolled rim
    add(G.ext(rrShape(-TW / 2 + .02, -TD / 2 + .02, TW - .04, TD - .04, .3), .05, .012, 6), skin, 0, y0 - .045, cz, -HP, 0, 0);
    add(G.ext(rrShape(-TW / 2 + rim, -TD / 2 + rim, TW - 2 * rim, TD - 2 * rim, .25), .006, 0, 6), '#e3f5fc', 0, y0 + .02, cz, -HP, 0, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.sph(.056, 10, 7), GOLD, sx * .66, .058, cz + sz * .24, 0, 0, 0, [1, .9, 1]);
    // tap at the left end
    const fx = -TW / 2 + .045;
    add(G.cyl(.02, .024, .16, 8), STEEL, fx, y1 + .08, cz);
    add(G.tor(.055, .02, PI, 4, 8), STEEL, fx + .055, y1 + .16, cz);
    add(G.cyl(.024, .02, .05, 8), STEEL, fx + .11, y1 + .14, cz);
    for (const sz of [-1, 1]) { add(G.cyl(.012, .012, .05, 6), STEEL, fx, y1 + .03, cz + sz * .12); add(G.sph(.032, 8, 6), sz < 0 ? CORAL : SKY, fx, y1 + .065, cz + sz * .12, 0, 0, 0, [1, .7, 1]); }
    // a heap of bubbles at the right end (not in the blackout bath: a wall shower over that end instead)
    if (!dark) [[.52, .44, -.06, .12, WHITE], [.68, .48, .1, .1, SKY2], [.36, .5, .12, .07, WHITE], [.7, .6, -.08, .075, WHITE], [.55, .62, .04, .065, SKY2], [.44, .58, -.15, .05, WHITE]]
      .forEach(([x, y, z, r, c]) => add(G.sph(r, 12, 8), c, x, y, cz + z));
    else {
      tube([PX - .06, y1 + .02, PZB + .02], [PX - .06, 1.62, PZB + .02], .018, STEEL, 6);
      tube([PX - .06, 1.62, PZB + .02], [PX - .3, 1.7, PZB + .1], .016, STEEL, 6);
      add(G.cyl(.075, .05, .045, 14), STEEL, PX - .33, 1.67, PZB + .12, .5, 0, 0);
      add(G.cyl(.068, .068, .006, 14), '#cfe4ee', PX - .335, 1.645, PZB + .135, .5, 0, 0);
      add(G.box(.09, .05, .03, .012), STEEL, PX - .06, .95, PZB + .03);
      for (const sz of [-1, 1]) add(G.sph(.022, 8, 6), sz < 0 ? CORAL : SKY, PX - .06 + sz * .05, .95, PZB + .055);
    }
    // rubber duck on the front rim (not in the blackout bath — "찾는 오리랑 헷갈려")
    const A = dark ? () => {} : local(addM, .66, y1 + .012, fz - .04, -1.05, 1);
    A(G.sph(.075, 12, 8), '#ffd93b', 0, .055, 0, 0, 0, 0, [1.25, .85, 1]);
    A(G.sph(.052, 12, 8), '#ffd93b', .065, .135, 0);
    A(G.sph(.026, 8, 6), ORANGE, .118, .125, 0, 0, 0, 0, [1.45, .55, 1.1]);
    A(G.cone(.03, .06, 6), '#ffd93b', -.1, .095, 0, 0, 0, .95);
    for (const sz of [-1, 1]) { A(G.sph(.011, 6, 4), INK, .097, .152, sz * .03); A(G.sph(.022, 6, 4), '#ffc21a', -.005, .07, sz * .068, 0, 0, 0, [1.5, .6, .45]); }
    // curtain frame: two posts at the back corners, side rails, a rod along the front
    for (const sx of [-1, 1]) {
      tube([sx * PX, 0, PZB], [sx * PX, RY, PZB], .017, STEEL, 6);
      tube([sx * PX, RY, PZB], [sx * PX, RY, PZF], .017, STEEL, 6);
      add(G.cyl(.05, .06, .025, 10), STEEL, sx * PX, .012, PZB);
      add(G.sph(.034, 8, 6), GOLD, sx * PX, RY, PZF);
      add(G.sph(.026, 8, 6), STEEL, sx * PX, RY, PZB);
    }
    tube([-PX, RY, PZF], [PX, RY, PZF], .017, STEEL, 6);
  }));
  // (9판 사용자 10/23·10/24 "커튼 욕조쪽으로 들어갈때 뚫림": the curtain hangs a little in front of the tub, so seen from above its hem
// still met the rim's line — it stops well above the rim now, open, half or shut)
  const CW = 2 * PX - .04, CH = RY - .05 - .88;
  const cg = new THREE.Group(); put(cg, -PX + .02, RY - .035, PZF);
  cg.add(mg('bathtub-curtain|' + curt, mat('#ffffff', { map: dotTex(curt), side: DS }), ({ addM }) => {
    const g = new THREE.PlaneGeometry(CW, CH, 24, 1); g.translate(CW / 2, -CH / 2, 0);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, .028 * Math.cos(Math.round(p.getX(i) / CW * 24) * PI));
    g.computeVertexNormals(); addM(planarUV(ni(g), .2), new THREE.Matrix4());
  }));
  cg.add(mc('bathtub-rings', ({ add }) => {
    for (let i = 0; i <= 12; i++) add(G.tor(.026, .007, PI * 2, 3, 10), HONEY, .02 + i * (CW - .04) / 12, .035, 0, 0, HP, 0);
    add(G.pbox(CW, .045, .034), WHITE, CW / 2, -.02, 0);
  }));
  f.add(cg);
  // three candles on the back rim — their flames glow, so the night's lamp pools find them (look.js nightLights)
  if (dark) {
    const flame = mat('#ffcf6a', { emissive: '#ffb347', ei: .9, rim: 0 });
    f.add(mc('bathtub-candles', ({ add }) => {
      for (const [x, h] of [[-.42, .12], [-.3, .08], [.18, .1]]) { add(G.cyl(.032, .034, h, 10), '#fbf3e0', x, y1 + h / 2 + .01, cz - TD / 2 + .045); add(G.cyl(.003, .003, .02, 4), INK, x, y1 + h + .02, cz - TD / 2 + .045); }
    }));
    for (const [x, h] of [[-.42, .12], [-.3, .08], [.18, .1]]) { const fl = new THREE.Mesh(G.sph(.016, 8, 6), flame); fl.scale.set(1, 1.7, 1); put(fl, x, y1 + h + .045, cz - TD / 2 + .045); f.add(fl); }
  }
  const p = f.part('curtain', cg, t => { cg.scale.x = 1 - .82 * t; }, { label: '샤워 커튼', sfx: 'swish', dur: .32 });
  f.spot('inside', null, -.24, y0 + .026, cz, { part: p, maxH: .42, label: '욕조 안', scale: .92 });
};

// 변기 (1×1): a round toilet with a fluffy lid cover and a cloud bath mat; the tank lid lifts off (water inside).
// A toilet-roll stand on the right; something can hide in the gap behind it.
B.toilet = (f, T) => {
  const cover = col(T, 'fabric'), matC = col(T, 'fabric2'), tk = [cover, matC].join(',');
  const TW = .54, TD = .3, tz = -.32, ty0 = .44, ty1 = .88, wt = .035, fill = .66, bz = .1;
  f.add(mc('toilet|' + tk, ({ add, tube }) => {
    add(G.ext(rrShape(-.3, -.15, .6, .3, .14), .014, .006, 6), matC, 0, .004, .3, -HP, 0, 0);
    for (const [x, z] of [[-.15, .26], [.0, .38], [.16, .28]]) add(G.cyl(.03, .03, .006, 10), shade(matC, -.07), x, .022, z);
    add(G.lathe([[0, 0], [.15, 0], [.16, .02], [.125, .1], [.115, .2], [.15, .29], [.2, .36], [.225, .41], [.215, .43], [0, .43]], 18), WHITE, 0, 0, bz, 0, 0, 0, [1, 1, 1.28]);
    add(G.tor(.17, .03, PI * 2, 5, 18), WHITE, 0, .44, bz, HP, 0, 0, [1, 1.28, 1]);
    add(G.cyl(.215, .215, .03, 20), WHITE, 0, .47, bz, 0, 0, 0, [1, 1, 1.28]);
    add(G.sph(.205, 16, 6), cover, 0, .484, bz + .01, 0, 0, 0, [1, .17, 1.25]);
    add(G.box(.14, .05, .06, .02), WHITE, 0, .465, tz + TD / 2 + .02);
    // tank: four walls, water inside
    const tH = ty1 - ty0, tyc = (ty0 + ty1) / 2;
    add(G.box(TW, tH, wt, .014), WHITE, 0, tyc, tz - TD / 2 + wt / 2);
    add(G.box(TW, tH, wt, .014), WHITE, 0, tyc, tz + TD / 2 - wt / 2);
    for (const sx of [-1, 1]) add(G.box(wt, tH, TD, .014), WHITE, sx * (TW / 2 - wt / 2), tyc, tz);
    add(G.pbox(TW - .01, .03, TD - .01), WHITE, 0, ty0 + .015, tz);
    add(G.pbox(TW - 2 * wt, fill - ty0, TD - 2 * wt), '#cdeefc', 0, (ty0 + fill) / 2, tz);
    add(G.cyl(.022, .022, .02, 10), STEEL, -.17, ty1 - .08, tz + TD / 2 + .008, HP, 0, 0);
    add(G.box(.09, .022, .02, .008), STEEL, -.13, ty1 - .086, tz + TD / 2 + .02, 0, 0, -.15);
    // toilet-roll stand
    const hx = .4, hz = -.12;
    tube([hx, 0, hz], [hx, .58, hz], .014, STEEL, 6); add(G.cyl(.06, .07, .02, 10), STEEL, hx, .01, hz);
    add(G.sph(.022, 6, 5), GOLD, hx, .6, hz);
    tube([hx, .52, hz], [hx - .13, .52, hz], .01, STEEL, 5);
    add(G.cyl(.065, .065, .1, 14), WHITE, hx - .07, .52, hz, 0, 0, HP);
    add(G.cyl(.024, .024, .102, 8), '#e9dcc8', hx - .07, .52, hz, 0, 0, HP);
    add(G.pbox(.095, .16, .006), WHITE, hx - .07, .44, hz + .066);
  }));
  const lid = grp(mc('toilet-lid', ({ add }) => {
    add(G.box(TW + .04, .05, TD + .04, .02), WHITE, 0, .025, 0);
    add(G.cyl(.045, .05, .02, 14), STEEL, 0, .058, 0);
    add(G.cyl(.032, .032, .022, 12), HONEY, 0, .066, 0);
  }));
  put(lid, 0, ty1, tz); f.add(lid);
  const p = f.part('lift', lid, (t, b) => { lid.position.y = b.p.y + .28 * t; lid.position.x = b.p.x - .22 * t; lid.rotation.z = .42 * t; }, { label: '변기 물탱크', sfx: 'lift' });
  f.spot('inside', null, 0, fill, tz, { part: p, maxH: .3, label: '물탱크 안', scale: .56 });
  f.spot('behind', null, -.38, 0, -.32, { maxH: .4, label: '변기 뒤', scale: .66 });
};

// 세면대 (1×1): a mint vanity cabinet (two doors, bubble prints) with a round vessel basin, a gooseneck tap, a toothbrush
// cup and a soap pump on the counter, a towel on the side bar.
B.vanity = (f, T) => {
  const body = col(T, 'door'), bodyD = shade(body, -.08), inner = shade(body, -.2), top = col(T, 'top'), knob = col(T, 'knob'), towel = col(T, 'accent2');
  const tk = [body, top, knob, towel].join(',');
  const W = .84, H = .76, D = .5, z0 = -.21, y0 = .06, fz = z0 + D / 2, ty = y0 + H + .045;
  const bx = -.1, bz = z0 - .02;
  f.add(mc('vanity|' + tk, ({ add, tube }) => {
    add(G.pbox(W - .1, y0, D - .1), bodyD, 0, y0 / 2, z0 + .02);
    add(G.box(W, H, .04, .015), body, 0, y0 + H / 2, z0 - D / 2 + .02);
    for (const sx of [-1, 1]) add(G.box(.04, H, D, .015), body, sx * (W / 2 - .02), y0 + H / 2, z0);
    add(G.box(W, .04, D, .015), body, 0, y0 + .02, z0);
    add(G.pbox(W - .08, H - .06, .01), inner, 0, y0 + H / 2, z0 - D / 2 + .045);
    add(G.pbox(W - .08, .01, D - .06), inner, 0, y0 + .045, z0 + .01);
    add(G.box(W + .06, .05, D + .06, .02), top, 0, y0 + H + .02, z0 + .02);
    // spares inside the cabinet (back corners)
    add(G.cyl(.06, .06, .1, 12), WHITE, .27, y0 + .1, z0 - .13); add(G.cyl(.022, .022, .102, 8), '#e9dcc8', .27, y0 + .1, z0 - .13);
    add(G.cyl(.04, .045, .16, 10), SKY, -.28, y0 + .13, z0 - .13); add(G.cyl(.018, .018, .04, 6), WHITE, -.28, y0 + .23, z0 - .13);
    // vessel basin + gooseneck tap
    add(G.lathe([[0, 0], [.12, 0], [.18, .04], [.21, .1], [.215, .13], [.195, .13], [.18, .09], [.13, .045], [0, .04]], 18), WHITE, bx, ty, bz);
    add(G.cyl(.025, .025, .004, 10), STEEL2, bx, ty + .044, bz);
    const tz = bz - .19;
    add(G.cyl(.045, .05, .03, 12), STEEL, bx, ty + .015, tz);
    tube([bx, ty, tz], [bx, ty + .22, tz], .02, STEEL, 8);
    add(G.tor(.06, .02, PI, 4, 8), STEEL, bx, ty + .22, tz + .06, 0, -HP, 0);
    add(G.cyl(.022, .018, .04, 8), STEEL, bx, ty + .2, tz + .12);
    for (const sx of [-1, 1]) { add(G.cyl(.012, .012, .04, 6), STEEL, bx + sx * .09, ty + .02, tz); add(G.sph(.034, 8, 6), sx < 0 ? CORAL : SKY, bx + sx * .09, ty + .05, tz, 0, 0, 0, [1, .7, 1]); }
    // toothbrush cup + soap pump
    add(G.cyl(.045, .04, .1, 12), MINT, .3, ty + .05, z0 - .13);
    for (const [a, c] of [[.28, CORAL], [-.22, SKY]]) {
      add(G.cyl(.008, .008, .2, 5), c, .3 - Math.sin(a) * .05, ty + .14, z0 - .13, 0, 0, a);
      add(G.box(.022, .05, .022, .006), WHITE, .3 - Math.sin(a) * .15, ty + .14 + Math.cos(a) * .1, z0 - .13, 0, 0, a);
    }
    add(G.cyl(.04, .045, .12, 12), HONEY, -.36, ty + .06, z0 - .12); add(G.cyl(.012, .012, .05, 6), STEEL, -.36, ty + .14, z0 - .12); add(G.box(.05, .016, .016, .005), STEEL, -.34, ty + .165, z0 - .12);
    // towel bar + towel on the right side
    const rx = W / 2 + .035, ry = y0 + H - .1;
    for (const sz of [-1, 1]) tube([W / 2, ry, z0 + sz * .15], [rx, ry, z0 + sz * .15], .01, STEEL, 5);
    tube([rx, ry, z0 - .17], [rx, ry, z0 + .17], .012, STEEL, 6);
    add(G.box(.018, .34, .28, .008), towel, rx + .012, ry - .15, z0);
    add(G.box(.03, .04, .28, .012), towel, rx, ry + .005, z0);
    add(G.pbox(.02, .025, .28), WHITE, rx + .013, ry - .27, z0);
  }));
  const leafW = W / 2 - .03, leafH = H - .07;
  const leaf = sx => {
    const pv = new THREE.Group(); put(pv, sx * (W / 2 - .02), y0 + H / 2, fz + .004);
    pv.add(mc('vanity-leaf' + sx + '|' + tk, ({ add }) => {
      const cx = -sx * leafW / 2;
      add(G.box(leafW, leafH, .035, .02), body, cx, 0, 0);
      add(G.box(leafW - .09, leafH - .12, .012, .006), shade(body, .06), cx, 0, .018);
      for (const [x, y, r] of [[-.05, .17, .036], [.05, .23, .022], [.01, .1, .016]]) add(G.sph(r, 8, 6), WHITE, cx + x, y, .022, 0, 0, 0, [1, 1, .35]);
      add(G.sph(.026, 8, 6), knob, -sx * (leafW - .05), .04, .03);
    }));
    f.add(pv); return pv;
  };
  const L = leaf(-1), R = leaf(1);
  const p = f.part('door', [L, R], t => { L.rotation.y = -2.3 * t; R.rotation.y = 2.3 * t; }, { label: '세면대 수납장', sfx: 'open', dur: .32 });
  f.spot('inside', null, 0, y0 + .05, z0 + .03, { part: p, maxH: .44, label: '세면대 아래', scale: .88 });
  f.spot('on', null, .23, ty, z0 + .1, { maxH: .45, label: '세면대 위', scale: .76 });
};

// 거울 수납장 (wall, span 1): a mint medicine cabinet with three vanity bulbs; the mirror door swings back flat.
B.mirrorcab = (f, T) => {
  const frame = col(T, 'accent'), knob = col(T, 'knob'), tk = [frame, knob].join(',');
  const W = .62, H = .64, D = .23, yb = 1.32, yt = yb + H, sy = yb + .3;
  f.add(mc('mirrorcab|' + tk, ({ add }) => {
    add(G.box(W, H, .03, .015), frame, 0, yb + H / 2, .015);
    for (const sx of [-1, 1]) add(G.box(.035, H, D, .015), frame, sx * (W / 2 - .0175), yb + H / 2, D / 2);
    add(G.box(W, .035, D, .015), frame, 0, yb + .0175, D / 2);
    add(G.box(W + .05, .05, D + .03, .018), frame, 0, yt, D / 2 + .005);
    add(G.pbox(W - .07, H - .07, .006), '#fff7ec', 0, yb + H / 2, .033);
    add(G.pbox(W - .07, .02, D - .04), '#fff7ec', 0, sy, D / 2 - .005);
    // toiletries on the upper shelf
    add(G.cyl(.032, .036, .13, 10), CORAL, -.19, sy + .075, .11); add(G.cyl(.014, .014, .03, 6), WHITE, -.19, sy + .155, .11);
    add(G.cyl(.03, .03, .09, 10), SKY, -.1, sy + .055, .12); add(G.cyl(.034, .034, .02, 10), WHITE, -.1, sy + .11, .12);
    add(G.cap(.022, .13, 2, 6), WHITE, .12, sy + .033, .11, 0, .25, HP); add(G.cyl(.016, .016, .025, 8), MINT, .045, sy + .033, .13, 0, .25, HP);
    add(G.sph(.04, 10, 7), BLUSH, .22, sy + .05, .1, 0, 0, 0, [1, .8, 1]);
    // vanity bulbs on the cap
    for (const x of [-.2, 0, .2]) { add(G.cyl(.02, .02, .03, 8), STEEL, x, yt + .035, D - .02); add(G.sph(.036, 10, 8), '#fff4c4', x, yt + .075, D - .02); }
  }));
  const dv = new THREE.Group(); put(dv, -W / 2, yb + H / 2, D + .004);
  dv.add(mc('mirrorcab-door|' + tk, ({ add }) => {
    const s = rrShape(0, -H / 2 + .01, W, H - .02, .05); s.holes.push(rrShape(.05, -H / 2 + .06, W - .1, H - .12, .03));
    add(G.ext(s, .03, 0, 5), frame, 0, 0, 0);
    add(G.ext(rrShape(.04, -H / 2 + .05, W - .08, H - .1, .035), .012, 0, 5), '#d3eef9', 0, 0, .008);
    add(G.sph(.022, 8, 6), knob, W - .03, -.05, .035);
  }));
  f.add(dv);
  const p = f.part('door', dv, t => { dv.rotation.y = -2.55 * t; }, { label: '거울 수납장', sfx: 'open', dur: .3 });
  f.spot('inside', null, .02, yb + .035, D / 2 + .01, { part: p, maxH: .25, label: '거울장 아래칸', scale: .55 });
};

// 빨래 바구니 (1×1): a striped cotton hamper with rope handles and a cream dome lid (takes a padlock); a sock escaped.
B.laundry = (f, T) => {
  const st = col(T, 'accent'), knob = col(T, 'knob'), tk = [st, knob].join(',');
  const R0 = .22, R1 = .26, H = .62, zc = -.03;
  f.add(mg('laundry-shell|' + st, mat('#ffffff', { map: stripeTex(st) }), ({ add }) => add(G.lathe([[0, 0], [R0, 0], [R1, H], [R1 - .018, H], [R0 - .018, .03], [0, .03]], 24), 0, 0, zc),
    g => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, uv.getX(i) * 12, p.getY(i)); }));
  f.add(mc('laundry|' + tk, ({ add }) => {
    add(G.tor(R1 - .004, .022, PI * 2, 5, 24), WHITE, 0, H, zc, HP);
    add(G.tor(R0 + .004, .014, PI * 2, 4, 22), WHITE, 0, .02, zc, HP);
    for (const sx of [-1, 1]) add(G.tor(.05, .014, PI, 4, 8), HONEY, sx * (R1 - .012), H - .15, zc, 0, HP, 0);
    // clothes heaped inside (the spot sits on the heap)
    add(G.sph(.21, 12, 6), '#fff1f4', 0, .38, zc, 0, 0, 0, [1, .4, 1]);
    add(G.sph(.1, 10, 6), SKY, -.1, .43, zc - .09, 0, .4, 0, [1.3, .5, 1]);
    add(G.sph(.09, 10, 6), HONEY, .11, .43, zc - .08, 0, -.3, 0, [1.3, .5, 1]);
    // an escaped sock
    add(G.cap(.034, .13, 2, 6), SKY, .3, .034, .33, 0, .5, HP);
    add(G.cap(.034, .06, 2, 6), SKY, .37, .034, .41, 0, -1.07, HP);
    add(G.tor(.034, .01, PI * 2, 3, 10), WHITE, .25, .034, .36, 0, .5 + HP, 0);
    add(G.sph(.036, 8, 6), CORAL, .4, .034, .45);
  }));
  const lid = grp(mc('laundry-lid|' + tk, ({ add }) => {
    add(G.cyl(R1 + .028, R1 + .028, .035, 24), CREAM, 0, .018, R1 + .01);
    add(G.dome(R1 - .005, 20, 5), CREAM, 0, .035, R1 + .01, 0, 0, 0, [1, .28, 1]);
    add(G.tor(.036, .012, PI, 4, 8), knob, 0, .035 + R1 * .28 - .01, R1 + .01);
    add(G.pbox(.06, .07, .016), STEEL, 0, -.015, 2 * R1 + .045);
  }));
  put(lid, 0, H, zc - R1 - .01); f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.75 * t; }, { label: '빨래 바구니', sfx: 'open' });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: H - .11, z: zc + R1 + .055 };
  f.spot('inside', null, 0, .455, zc + .04, { part: p, maxH: .3, label: '빨래 바구니 안', scale: .74 });
};

// ═════════════════════════════════════════════ OFFICE ═════════════════════════════════════════════
// 사무용 책상 (2×1): a desk on a steel panel leg and a drawer pedestal; a cream monitor (cheerful desktop), a keyboard,
// a mouse, a coffee mug and a tiny cactus. The pedestal's top drawer slides out; the knee space is open.
B.officedesk = (f, T) => {
  const top = col(T, 'wood'), ped = col(T, 'body'), dr = col(T, 'accent2'), tk = [top, ped, dr].join(',');
  const z0 = -.1, D = .76, ty = .74, tt = .045, px = .64, PW = .46, PD = .66, top_y = ty + tt;
  const mx = -.22, mz = z0 - .2, bez = '#fbf7ef';
  f.add(mc('officedesk|' + tk, ({ add, tube }) => {
    add(G.box(1.88, tt, D, .02), top, 0, ty + tt / 2, z0);
    add(G.box(.06, ty, .64, .02), STEEL, -.86, ty / 2, z0);
    add(G.box(.08, .04, .7, .015), STEEL2, -.86, .02, z0);
    add(G.pbox(1.24, .34, .025), STEEL, -.21, ty - .2, z0 - D / 2 + .06);
    // pedestal: lower file drawer is fixed decor, the top drawer is the part
    // (10/29 사용자 "책상 서랍 열었는데 안에 막혀 있음": the pedestal was one solid block round the drawer — now hollow where the drawer
    // runs: the block below, a band above, two side walls and a back, a dark lining; the drawer front still covers the hole when shut)
    { const c0 = ty - .245, c1 = ty - .035, hw = (PW - .08) / 2, zb = z0 - PD / 2 + .04, ink = shade(ped, -.3);
      add(G.box(PW, c0, PD, .02), ped, px, c0 / 2, z0);
      add(G.box(PW, ty - .01 - c1, PD, .02), ped, px, (c1 + ty - .01) / 2, z0);
      for (const sx of [-1, 1]) add(G.box(PW / 2 - hw, c1 - c0, PD, .006), ped, px + sx * (hw + (PW / 2 - hw) / 2), (c0 + c1) / 2, z0);
      add(G.box(PW - .08, c1 - c0, .04, .006), ped, px, (c0 + c1) / 2, z0 - PD / 2 + .02);
      add(G.pbox(PW - .08, .006, PD - .05), ink, px, c0 + .003, (zb + z0 + PD / 2) / 2); add(G.pbox(PW - .08, c1 - c0, .006), ink, px, (c0 + c1) / 2, zb + .003); }
    add(G.box(PW - .05, .36, .03, .015), shade(dr, .08), px, .25, z0 + PD / 2 + .01);
    add(G.box(.16, .024, .028, .01), STEEL2, px, .38, z0 + PD / 2 + .03);
    add(G.pbox(.12, .055, .008), WHITE, px, .3, z0 + PD / 2 + .028);
    // monitor
    add(G.cyl(.11, .12, .025, 16), STEEL, mx, top_y + .012, mz, 0, 0, 0, [1.35, 1, .85]);
    add(G.box(.06, .22, .04, .015), STEEL, mx, top_y + .12, mz - .03);
    add(G.box(.72, .46, .05, .03), bez, mx, top_y + .44, mz);
    add(G.sph(.012, 6, 4), MINT, mx + .3, top_y + .24, mz + .026);
    add(G.pbox(.07, .07, .006), HONEY, mx + .3, top_y + .62, mz + .027, 0, 0, .12);
    add(G.pbox(.07, .07, .006), BLUSH, mx + .36, top_y + .57, mz + .03, 0, 0, -.1);
    // keyboard + mouse
    const kz = z0 + .15;
    add(G.box(.52, .03, .17, .012), bez, mx, top_y + .015, kz);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) {
      if (r === 2 && k > 2 && k < 6) continue;
      add(G.pbox(.042, .012, .036), r === 0 && k === 0 ? MINT : r === 1 && k === 8 ? CORAL : '#e4e9f2', mx - .2 + k * .05, top_y + .034, kz - .05 + r * .048);
    }
    add(G.pbox(.14, .012, .036), '#e4e9f2', mx, top_y + .034, kz + .046);
    add(G.pbox(.2, .006, .18), MINT2, mx + .4, top_y + .003, kz);
    add(G.sph(.042, 10, 7), dr, mx + .4, top_y + .012, kz, 0, 0, 0, [1, .5, 1.35]);
    // mug of coffee + cactus
    add(G.cyl(.05, .046, .11, 12), CORAL, .3, top_y + .055, z0 - .12);
    add(G.tor(.032, .011, PI * 2, 3, 8), CORAL, .355, top_y + .06, z0 - .12);
    add(G.cyl(.042, .042, .004, 12), '#8a5a3c', .3, top_y + .105, z0 - .12);
    add(G.cyl(.06, .048, .09, 12), HONEY, .78, top_y + .045, z0 - .26);
    add(G.cap(.04, .1, 2, 8), LEAF, .78, top_y + .16, z0 - .26);
    add(G.cap(.022, .04, 2, 6), LEAF, .83, top_y + .17, z0 - .26, 0, 0, -.9);
    add(G.sph(.022, 6, 5), BLUSH, .78, top_y + .245, z0 - .26);
    // (⑥ 10/24 사용자 16판 "컴퓨터·컴퓨터 책상 다시"): the monitor's rounded back and its cable down behind the desk, a power
    // button and a little webcam; a two-tier paper tray with sheets, a ring binder and a framed photo; a pen pot
    add(G.box(.5, .32, .09, .06), shade(bez, -.06), mx, top_y + .44, mz - .07);
    add(G.sph(.009, 6, 5), DARK, mx + .3, top_y + .225, mz + .028); add(G.box(.06, .025, .03, .01), DARK, mx, top_y + .685, mz + .005); add(G.sph(.007, 6, 5), '#5f8fd8', mx, top_y + .685, mz + .021);
    tube([mx + .05, top_y + .3, mz - .12], [mx + .1, top_y + .02, mz - .2], .008, DARK, 4); tube([mx + .1, top_y + .02, mz - .2], [mx + .2, ty - .1, z0 - D / 2 + .05], .008, DARK, 4);
    for (const k of [0, 1]) { add(G.box(.26, .012, .2, .004), '#c9cfe0', .32, top_y + .01 + k * .07, z0 + .16); for (const sx of [-1, 1]) add(G.pbox(.008, .07, .2), '#a9b2c8', .32 + sx * .126, top_y + .045, z0 + .16); add(G.box(.21, .008, .28, .002), WHITE, .32, top_y + .021 + k * .07, z0 + .16, 0, (k - .5) * .1, 0); }
    add(G.box(.06, .26, .2, .01), '#5f8fd8', .58, top_y + .13, z0 - .24); add(G.box(.064, .06, .1, .004), WHITE, .58, top_y + .17, z0 - .24 + .001);
    add(G.box(.14, .18, .02, .01), '#e8bb82', .5, top_y + .09, z0 - .3, -.2, .3, 0); add(G.pbox(.11, .14, .004), '#bfe4f4', .5 + .004, top_y + .09, z0 - .3 + .012, -.2, .3, 0);
    add(G.cyl(.035, .03, .1, 12), '#7fc6e8', .14, top_y + .05, z0 - .27); for (const [dx, c] of [[-.01, '#ff6b57'], [.012, '#2a1d33'], [0, '#ffd23f']]) add(G.cyl(.005, .005, .14, 5), c, .14 + dx, top_y + .11, z0 - .27 + (dx ? 0 : .01), dx * 6, 0, dx * 8);
  }));
  f.add(mg('officedesk-screen', atlasMat(), ({ add }) => add(quadGeo(.64, .38, RG.screen), mx, top_y + .45, mz + .026)));
  const dv = new THREE.Group(); put(dv, px, ty - .14, z0 + PD / 2 + .018);
  dv.add(mc('officedesk-drawer|' + tk, ({ add }) => {
    const ic = shade(ped, -.12);
    add(G.box(PW - .05, .22, .035, .018), dr, 0, 0, 0);
    add(G.box(.16, .025, .03, .01), STEEL2, 0, .05, .025);
    add(G.pbox(.13, .045, .006), WHITE, 0, -.04, .019);
    add(G.pbox(PW - .1, .012, .5), ic, 0, -.09, -.26);
    for (const sx of [-1, 1]) add(G.pbox(.012, .17, .5), ic, sx * (PW - .1) / 2, -.01, -.26);
    add(G.pbox(PW - .1, .17, .012), ic, 0, -.01, -.51);
    add(G.pbox(.12, .01, .3), HONEY, -.1, -.078, -.33, 0, .2, 0);
  }));
  f.add(dv);
  const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .4 * t; }, { label: '책상 서랍', sfx: 'drawer', dur: .26 });
  f.spot('inside', dv, .04, -.084, -.17, { part: p, maxH: .2, label: '책상 서랍', scale: .64 });
  f.spot('under', null, -.42, 0, z0 + .02, { maxH: .45, label: '책상 밑', scale: .9 });
  f.spot('on', null, .52, top_y, z0 + .12, { maxH: .45, label: '책상 위', scale: .78 });
};

// 사무 의자 (1×1): a swivel chair on a five-star base with a honey lumbar pillow.
B.officechair = (f, T) => {
  const seat = col(T, 'accent'), tk = [seat].join(',');
  const sy = .47;
  f.add(mc('officechair|' + tk, ({ add, tube }) => {
    for (let k = 0; k < 5; k++) {
      const a = PI + k * 2 * PI / 5, dx = Math.sin(a), dz = Math.cos(a);
      tube([dx * .04, .1, dz * .04], [dx * .3, .07, dz * .3], .024, STEEL2, 6);
      add(G.sph(.036, 8, 6), DARK, dx * .3, .036, dz * .3);
    }
    add(G.cyl(.055, .065, .06, 12), STEEL2, 0, .1, 0);
    add(G.cyl(.026, .026, .3, 10), STEEL, 0, .27, 0);
    add(G.box(.18, .045, .18, .015), DARK, 0, sy - .07, .0);
    add(G.box(.52, .1, .5, .045), seat, 0, sy, .02);
    add(G.box(.06, .34, .04, .015), DARK, 0, sy + .12, -.25);
    add(G.box(.48, .5, .09, .045), seat, 0, sy + .4, -.27, -.08, 0, 0);
    add(G.sph(.1, 12, 8), HONEY, 0, sy + .24, -.2, 0, 0, 0, [1.4, .62, .5]);
    for (const sx of [-1, 1]) {
      add(G.box(.035, .2, .035, .01), STEEL2, sx * .28, sy + .1, -.02);
      add(G.box(.07, .04, .28, .018), DARK, sx * .28, sy + .2, 0);
    }
  }));
  f.spot('under', null, 0, 0, .17, { maxH: .3, label: '의자 밑', scale: .76 });
  f.spot('on', null, 0, sy + .05, .07, { maxH: .45, label: '의자 위', scale: .82 });
};

// 복합기 (1×1): a cream copier with a sleepy face; the paper-out slot is its mouth (a sheet sticks out like a tongue).
// The sky scanner lid lifts to show the glass; the paper drawer slides out.
B.copier = (f, T) => {
  const lidC = col(T, 'accent2'), tk = [lidC].join(',');
  const W = .76, D = .58, z0 = -.15, fz = z0 + D / 2, body = '#f6f2ea', plinth = '#a9b3c9', dark = '#5b5672';
  const yS = .36, yT = .8, back = z0 - D / 2;
  f.add(mc('copier|' + tk, ({ add }) => {
    add(G.box(W, .07, D, .02), plinth, 0, .035, z0);
    // lower bay (the paper drawer slides in here)
    add(G.box(W, yS - .07, .04, .015), body, 0, (yS + .07) / 2, back + .02);
    for (const sx of [-1, 1]) add(G.box(.04, yS - .07, D, .015), body, sx * (W / 2 - .02), (yS + .07) / 2, z0);
    add(G.pbox(W - .08, yS - .1, .01), dark, 0, (yS + .07) / 2, back + .045);
    add(G.pbox(W - .08, .01, D - .06), dark, 0, .075, z0);
    // upper body with the face and the paper-out mouth
    add(G.box(W, yT - yS, D, .03), body, 0, (yS + yT) / 2, z0);
    face(add, 0, .64, fz + .003, 1.25);
    add(G.box(.3, .045, .03, .014), dark, 0, .47, fz + .004);
    add(G.pbox(.2, .006, .13), WHITE, 0, .462, fz + .055, .32, 0, 0);
    // glass under the lid, control strip in front of it
    add(G.pbox(.62, .008, .38), '#cdeefc', 0, yT + .004, back + .23);
    add(G.box(W - .02, .05, .16, .02), '#e9e4dc', 0, yT + .015, fz - .08);
    for (const [x, c] of [[.06, CORAL], [.13, HONEY], [.2, MINT]]) add(G.cyl(.02, .02, .016, 10), c, x, yT + .045, fz - .06);
    add(G.cyl(.034, .034, .02, 12), MINT, .3, yT + .047, fz - .07);
    // side output tray with printed sheets
    add(G.box(.18, .02, .34, .008), plinth, -W / 2 - .08, .56, z0, 0, 0, -.18);
    add(G.pbox(.14, .03, .28), WHITE, -W / 2 - .075, .585, z0, 0, 0, -.18);
    add(G.pbox(.03, .1, .2), plinth, -W / 2 - .01, .52, z0);
  }));
  f.add(mg('copier-screen', atlasMat(), ({ add }) => add(quadGeo(.17, .0425, LB(13)), -.17, yT + .041, fz - .07, -HP, 0, 0)));
  const LD = .44;
  const lid = grp(mc('copier-lid|' + tk, ({ add }) => {
    add(G.box(W - .02, .06, LD, .025), lidC, 0, .03, LD / 2);
    add(G.box(W - .14, .02, LD - .12, .01), shade(lidC, .1), 0, .062, LD / 2);
    add(G.box(.2, .025, .04, .01), WHITE, 0, .035, LD + .01);
  }));
  put(lid, 0, yT, back + .005); f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.35 * t; }, { label: '복합기 덮개', sfx: 'open' });
  f.spot('inside', null, -.04, yT + .008, back + .24, { part: p, maxH: .3, label: '복합기 유리판', scale: .7 });
  const dv = new THREE.Group(); put(dv, 0, .215, fz + .005);
  dv.add(mc('copier-drawer', ({ add }) => {
    add(G.box(W - .06, .26, .035, .018), body, 0, 0, 0);
    add(G.box(.22, .03, .03, .012), '#cfc8bb', 0, .07, .025);
    add(G.pbox(.06, .03, .006), SKY, -.25, .07, .02);
    const ic = '#e6e0d4';
    add(G.pbox(W - .12, .012, .46), ic, 0, -.115, -.25);
    for (const sx of [-1, 1]) add(G.pbox(.012, .16, .46), ic, sx * (W - .12) / 2, -.04, -.25);
    add(G.pbox(W - .12, .16, .012), ic, 0, -.04, -.48);
    add(G.pbox(.42, .05, .3), WHITE, -.06, -.085, -.26);
  }));
  f.add(dv);
  const dp = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .36 * t; }, { label: '복합기 용지함', sfx: 'drawer', dur: .26 });
  f.spot('inside', dv, -.06, -.06, -.2, { part: dp, maxH: .2, label: '복합기 용지함', scale: .62 });
};

// 정수기 (1×1): a water cooler whose big bottle is a smiling water drop; hot / cold taps, a cup tube on the side,
// a mint cabinet door below.
B.watercooler = (f, T) => {
  const door = col(T, 'accent'), knob = col(T, 'knob'), tk = [door, knob].join(',');
  const W = .44, D = .42, z0 = -.12, fz = z0 + D / 2, yT = .96, bay = .54, back = z0 - D / 2;
  f.add(mc('watercooler|' + tk, ({ add }) => {
    add(G.box(W - .02, .05, D - .02, .015), '#cfd8e6', 0, .025, z0);
    add(G.box(W, yT - .04, .04, .015), WHITE, 0, (yT + .04) / 2, back + .02);
    for (const sx of [-1, 1]) add(G.box(.04, yT - .04, D, .015), WHITE, sx * (W / 2 - .02), (yT + .04) / 2, z0);
    add(G.box(W, .04, D, .015), WHITE, 0, .065, z0);
    add(G.pbox(W - .08, bay - .1, .01), '#dfe6f0', 0, (bay + .08) / 2, back + .045);
    add(G.box(W, yT - bay, D, .02), WHITE, 0, (bay + yT) / 2, z0);
    // tap alcove, taps, drip tray
    add(G.box(W - .1, .22, .012, .006), '#e4eef7', 0, .74, fz + .002);
    for (const [x, c] of [[-.08, CORAL], [.08, SKY]]) { add(G.box(.06, .06, .06, .016), c, x, .79, fz + .03); add(G.cyl(.012, .012, .04, 6), STEEL, x, .75, fz + .045); }
    add(G.box(.26, .03, .1, .01), STEEL, 0, .63, fz + .035);
    for (let i = 0; i < 4; i++) add(G.pbox(.2, .004, .012), STEEL2, 0, .646, fz + .005 + i * .022);
    // the bottle: a water-drop character
    add(G.cyl(.12, .13, .03, 16), '#e9eef6', 0, yT + .015, z0);
    add(G.lathe([[0, 0], [.05, 0], [.05, .05], [.13, .09], [.165, .15], [.17, .38], [.15, .44], [.09, .46], [0, .465]], 18), '#bfe7fa', 0, yT + .02, z0);
    for (const y of [.2, .31]) add(G.tor(.17, .008, PI * 2, 3, 18), '#a6dcf5', 0, yT + .02 + y, z0, HP);
    add(G.cap(.016, .13, 2, 5), WHITE, -.12, yT + .28, z0 + .118, 0, -.8, 0);
    face(add, 0, yT + .27, z0 + .168, .95);
    // paper-cup tube
    add(G.pbox(.03, .08, .06), STEEL2, W / 2 + .01, .74, z0 + .06);
    add(G.cyl(.042, .042, .24, 12), '#e4f4fb', W / 2 + .05, .74, z0 + .06);
    add(G.lathe([[0, 0], [.03, 0], [.045, .07], [.04, .07], [0, .01]], 10), WHITE, W / 2 + .05, .55, z0 + .06);
  }));
  f.add(mg('watercooler-label', atlasMat(), ({ add }) => add(quadGeo(.2, .05, LB(1)), 0, .9, fz + .003)));
  const DH = bay - .09;
  const dv = new THREE.Group(); put(dv, -W / 2 + .02, (bay + .085) / 2, fz + .004);
  dv.add(mc('watercooler-door|' + tk, ({ add }) => {
    const cx = (W - .04) / 2;
    add(G.box(W - .045, DH, .03, .018), door, cx, 0, 0);
    add(G.ext(dropShape(.07), .01, 0, 6), WHITE, cx, .03, .015);
    add(G.sph(.022, 8, 6), knob, W - .09, -.08, .025);
  }));
  f.add(dv);
  const p = f.part('door', dv, t => { dv.rotation.y = -2.4 * t; }, { label: '정수기 수납장', sfx: 'open' });
  f.spot('inside', null, 0, .085, z0 + .02, { part: p, maxH: .4, label: '정수기 아래칸', scale: .72 });
};

// 서류 캐비닛 (1×1, tall): three deep drawers with hanging folders; the top one takes a code lock. A plant on top.
B.filecab = (f, T) => {
  const body = '#d4e4f2', front = '#e6f0fa', inner = '#aebfd4', ic = '#c5d3e4', tabs = [HONEY, CORAL, MINT];
  const W = .56, D = .62, z0 = -.15, fz = z0 + D / 2, y0 = .04, H = 1.24, bayH = (H - .04) / 3, back = z0 - D / 2, topY = y0 + H;
  f.add(mc('filecab', ({ add }) => {
    add(G.pbox(W - .06, y0, D - .06), '#9fb0c8', 0, y0 / 2, z0);
    add(G.box(W, H, .04, .015), body, 0, y0 + H / 2, back + .02);
    for (const sx of [-1, 1]) add(G.box(.04, H, D, .015), body, sx * (W / 2 - .02), y0 + H / 2, z0);
    add(G.box(W + .02, .04, D + .02, .015), body, 0, topY - .02, z0);
    add(G.box(W, .04, D, .015), body, 0, y0 + .02, z0);
    for (let i = 1; i < 3; i++) add(G.pbox(W - .06, .02, D - .04), body, 0, y0 + .02 + i * bayH, z0);
    add(G.pbox(W - .08, H - .08, .01), inner, 0, y0 + H / 2, back + .045);
    // a leafy plant in a honey pot on top
    add(G.cyl(.07, .055, .12, 12), HONEY, .14, topY + .06, z0 - .12);
    add(G.cyl(.062, .062, .01, 12), '#8a5a3c', .14, topY + .118, z0 - .12);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; add(G.sph(.06, 8, 5), i % 2 ? LEAF : '#8fd47a', .14 + Math.cos(a) * .05, topY + .17 + (i % 2) * .03, z0 - .12 + Math.sin(a) * .05, 0, -a, .55, [1.3, .5, .7]); }
  }));
  for (let i = 0; i < 3; i++) {   // i = 0 is the top drawer
    const cy = topY - .02 - bayH * (i + .5);
    const dv = new THREE.Group(); put(dv, 0, cy, fz + .004);
    const BD = .5, bh = bayH - .1, fl = -bayH / 2 + .06;
    dv.add(mc('filecab-drawer' + i, ({ add }) => {
      add(G.box(W - .05, bayH - .04, .035, .02), front, 0, 0, 0);
      add(G.box(.22, .03, .03, .012), STEEL2, 0, -.06, .025);
      add(G.box(.17, .085, .01, .006), STEEL2, -.11, .08, .018);
      add(G.pbox(.15, .065, .008), WHITE, -.11, .08, .022);
      add(G.pbox(.11, .012, .009), tabs[i], -.11, .095, .025); add(G.pbox(.08, .008, .009), '#c9c3d9', -.12, .07, .025);
      add(G.pbox(W - .1, .012, BD), ic, 0, fl, -BD / 2 - .02);
      for (const sx of [-1, 1]) add(G.pbox(.012, bh, BD), ic, sx * (W - .1) / 2, fl + bh / 2, -BD / 2 - .02);
      add(G.pbox(W - .1, bh, .012), ic, 0, fl + bh / 2, -BD - .02);
      [[SKY, -.33], [HONEY, -.38], [MINT, -.43], [CORAL, -.48]].forEach(([c, z], k) => {
        add(G.pbox(W - .15, bh - .06, .008), c, 0, fl + (bh - .06) / 2 + .01, z);
        add(G.pbox(.08, .04, .009), shade(c, -.06), -.14 + k * .09, fl + bh - .03, z);
      });
    }));
    f.add(dv);
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .42 * t; }, { label: `캐비닛 ${i + 1}칸`, sfx: 'drawer', dur: .26 });
    if (i === 0) { p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: .12, y: .08, z: .035, parent: dv }; }
    f.spot('inside', dv, 0, fl + .006, -.14, { part: p, maxH: .28, label: `캐비닛 ${i + 1}칸`, scale: .68 });
  }
  f.spot('on', null, -.1, topY, z0 + .05, { maxH: .45, label: '캐비닛 위', scale: .8 });
};

// 화이트보드 (wall, span 2): a whiteboard with a meeting doodle, a marker tray (markers + eraser) and a flip-chart sheet
// on a stand-off rod; the sheet flips up to show what was left on the tray behind it.
B.whiteboard = (f, T) => {
  const W = 1.56, H = .94, yc = 1.56, yb = yc - H / 2, zf = .045, ty = yb - .01, TD = .13, tz = zf + TD / 2 - .005, CZ = .25;
  f.add(mc('whiteboard', ({ add, tube }) => {
    add(G.box(W + .08, H + .08, .04, .025), STEEL, 0, yc, .02);
    add(G.box(W * .94, .025, TD, .01), STEEL, 0, ty - .0125, tz);
    add(G.pbox(W * .94, .03, .012), STEEL2, 0, ty + .006, zf + TD - .012);
    [SKY, CORAL, MINT].forEach((c, k) => { const z = zf + .03 + k * .032; add(G.cap(.013, .1, 2, 6), WHITE, -.6, ty + .013, z, 0, 0, HP); add(G.cap(.0145, .03, 2, 6), c, -.53, ty + .013, z, 0, 0, HP); });
    add(G.box(.13, .045, .06, .012), HONEY, -.37, ty + .03, zf + .06); add(G.pbox(.13, .014, .06), DARK, -.37, ty + .007, zf + .06);
    for (const [x, y, c] of [[-.66, 1.95, CORAL], [-.12, 1.96, HONEY]]) add(G.cyl(.028, .028, .02, 12), c, x, y, zf + .01, HP, 0, 0);
    for (const x of [.18, .74]) tube([x, 2.0, zf], [x, 2.0, CZ], .012, STEEL2, 6);
    tube([.16, 2.0, CZ], [.76, 2.0, CZ], .014, STEEL2, 6);
  }));
  f.add(mg('whiteboard-face', atlasMat(), ({ add }) => add(quadGeo(W, H, RG.board), 0, yc, zf + .001)));
  const SW = .5, SH = .98;
  const sh = new THREE.Group(); put(sh, .46, 1.985, CZ);
  sh.add(mg('whiteboard-chart', atlasMat(), ({ add }) => add(quadGeo(SW, SH, RG.chart), 0, -SH / 2 - .01, .004)));
  sh.add(mc('whiteboard-sheet', ({ add }) => {
    add(G.pbox(SW, SH, .006), '#fdfbf4', 0, -SH / 2 - .01, 0);
    add(G.box(SW + .04, .05, .03, .012), HONEY, 0, -.012, .002);
    for (const sx of [-1, 1]) add(G.box(.05, .06, .04, .01), STEEL2, sx * .17, 0, .012);
  }));
  f.add(sh);
  const p = f.part('flip', sh, t => { sh.rotation.x = -1.95 * t; }, { label: '차트', sfx: 'lift', dur: .3 });
  f.spot('on', null, -.1, ty, tz, { maxH: .25, label: '화이트보드 받침', scale: .55 });
  f.spot('inside', null, .46, ty, tz, { part: p, maxH: .25, label: '차트 뒤', scale: .55 });
};

// 칸막이 (2×1): a low felt office divider with an aluminium cap, pinned with a calendar, a cat photo, a memo and sticky
// notes. Things hide behind it at both ends.
B.cubicle = (f, T) => {
  const felt = col(T, 'felt'), tk = [felt].join(',');
  const W = 1.82, H = 1.12, t = .07, pz = -.02, fz = pz + t / 2 + .003;
  const papers = [[-.55, .72, .26, .3, .03], [-.18, .78, .18, .2, -.08], [.22, .82, .27, .18, .05], [.56, .86, .14, .14, -.1], [.7, .64, .14, .14, .12], [.46, .6, .14, .14, .06], [.0, .52, .14, .14, -.05]];
  f.add(mc('cubicle|' + tk, ({ add }) => {
    add(G.box(W, H - .06, t, .02), felt, 0, .04 + (H - .06) / 2, pz);
    add(G.box(W + .06, .05, t + .03, .02), STEEL, 0, H, pz);
    for (const sx of [-1, 1]) { add(G.box(.05, H, t + .03, .02), STEEL, sx * (W / 2 + .01), H / 2, pz); add(G.box(.08, .04, .52, .015), STEEL2, sx * (W / 2 - .02), .02, pz); }
    const pins = [CORAL, HONEY, MINT, SKY, CORAL, LILAC, HONEY];
    papers.forEach(([x, y, w, h, r], i) => add(G.sph(.017, 8, 6), pins[i], x - Math.sin(r) * h * .4, y + Math.cos(r) * h * .4, fz + .012));
    add(G.sph(.017, 8, 6), MINT, -.4, .76, pz - t / 2 - .012);
  }));
  f.add(mg('cubicle-notes', atlasMat(), ({ add }) => {
    const rects = [RG.cal, RG.photo, RG.memo, NOTE(0), NOTE(1), NOTE(2), NOTE(3)];
    papers.forEach(([x, y, w, h, r], i) => add(quadGeo(w, h, rects[i]), x, y, fz, 0, 0, r));
    add(quadGeo(.14, .14, NOTE(1)), -.4, .7, pz - t / 2 - .003, 0, PI, .1);
  }));
  for (const sx of [-1, 1]) f.spot('behind', null, sx * .66, 0, -.3, { maxH: .45, label: '칸막이 뒤', scale: .85 });
};

// 커피 바 (1×1): a little counter with a coral espresso machine (it has a face), cups warming on top, a bean jar and a cup
// stack; the cabinet door (with a coffee-cup print) hides the lower shelf.
B.coffeebar = (f, T) => {
  const body = col(T, 'body'), wood = col(T, 'wood'), door = col(T, 'door'), knob = col(T, 'knob'), tk = [body, wood, door, knob].join(',');
  const W = .84, H = .82, D = .54, z0 = -.2, fz = z0 + D / 2, y0 = .05, ty = y0 + H + .05, back = z0 - D / 2;
  const mx = -.17, mz = z0 - .05, mach = CORAL;
  f.add(mc('coffeebar|' + tk, ({ add }) => {
    add(G.pbox(W - .1, y0, D - .1), shade(body, -.1), 0, y0 / 2, z0 + .02);
    add(G.box(W, H, .04, .015), body, 0, y0 + H / 2, back + .02);
    for (const sx of [-1, 1]) add(G.box(.04, H, D, .015), body, sx * (W / 2 - .02), y0 + H / 2, z0);
    add(G.box(W, .04, D, .015), body, 0, y0 + .02, z0);
    add(G.pbox(W - .08, H - .06, .01), shade(body, -.14), 0, y0 + H / 2, back + .045);
    add(G.pbox(W - .08, .01, D - .06), shade(body, -.14), 0, y0 + .045, z0 + .01);
    add(G.box(W + .06, .05, D + .06, .02), wood, 0, y0 + H + .025, z0 + .02);
    add(G.box(.2, .24, .15, .06), KRAFT, -.26, y0 + .16, back + .12);
    add(G.pbox(.12, .05, .004), '#8a5a3c', -.26, y0 + .2, back + .197);
    // espresso machine with a face
    add(G.box(.36, .4, .24, .05), mach, mx, ty + .2, mz);
    add(G.box(.38, .05, .27, .02), WHITE, mx, ty + .42, mz);
    for (const dx of [-.08, .06]) add(G.cyl(.032, .042, .06, 10), dx < 0 ? WHITE : MINT, mx + dx, ty + .475, mz - .03);
    face(add, mx, ty + .32, mz + .121, .95);
    add(G.cyl(.045, .05, .05, 12), STEEL, mx, ty + .2, mz + .14, HP, 0, 0);
    add(G.cyl(.04, .04, .03, 12), STEEL2, mx, ty + .165, mz + .17);
    add(G.cap(.017, .1, 2, 6), DARK, mx + .07, ty + .165, mz + .23, HP, 0, .9);
    add(G.box(.22, .022, .12, .008), STEEL, mx, ty + .011, mz + .17);
    add(G.cyl(.04, .034, .06, 12), WHITE, mx, ty + .052, mz + .17); add(G.cyl(.034, .034, .004, 12), '#8a5a3c', mx, ty + .081, mz + .17);
    // bean jar + cup stack
    add(G.cyl(.068, .068, .12, 12), '#8a5a3c', .12, ty + .06, back + .1);
    add(G.cyl(.066, .068, .05, 12), '#f3ead8', .12, ty + .145, back + .1);
    add(G.cyl(.074, .074, .03, 12), wood, .12, ty + .185, back + .1); add(G.sph(.022, 6, 5), wood, .12, ty + .21, back + .1);
    for (let i = 0; i < 3; i++) add(G.cyl(.05, .036, .07, 12), i % 2 ? MINT : WHITE, .32, ty + .035 + i * .045, back + .12);
  }));
  f.add(mg('coffeebar-labels', atlasMat(), ({ add }) => {
    add(bandGeo(.07, .045, LB(12), 2.4), .12, ty + .07, back + .1);
    add(quadGeo(.17, .0425, LB(15)), mx + .181, ty + .26, mz, 0, HP, 0);
  }));
  const dv = new THREE.Group(); put(dv, -W / 2 + .02, y0 + H / 2 + .005, fz + .004);
  dv.add(mc('coffeebar-door|' + tk, ({ add }) => {
    const cx = (W - .04) / 2;
    add(G.box(W - .045, H - .07, .035, .02), door, cx, 0, 0);
    add(G.box(.17, .13, .012, .04), WHITE, cx, -.02, .02);
    add(G.tor(.042, .012, PI * 2, 3, 10), WHITE, cx + .09, -.02, .02);
    add(G.pbox(.13, .03, .006), '#8a5a3c', cx, .03, .028);
    for (const k of [-1, 1]) add(G.cap(.011, .06, 2, 4), WHITE, cx + k * .035, .13, .02, 0, 0, k * .2);
    add(G.sph(.025, 8, 6), knob, W - .1, 0, .03);
  }));
  f.add(dv);
  const p = f.part('door', dv, t => { dv.rotation.y = -2.4 * t; }, { label: '커피 바 수납장', sfx: 'open' });
  f.spot('inside', null, .07, y0 + .045, z0 + .04, { part: p, maxH: .42, label: '커피 바 아래칸', scale: .88 });
  f.spot('on', null, .2, ty, -.04, { maxH: .45, label: '커피 바 위', scale: .76 });
};

// ═════════════════════════════════════════════ BASEMENT ═════════════════════════════════════════════
// 보일러 (1×1, tall): a mint boiler with a sleepy face, a gauge hat and copper pipes up into the ceiling (one with a
// coral valve wheel). The cream front panel opens on the burner bay.
B.boiler = (f, T) => {
  const body = '#9fe3cf', bodyD = shade(body, -.1), panel = '#fff3df';
  const W = .62, D = .48, z0 = -.18, fz = z0 + D / 2, y0 = .07, bayT = .7, H = 1.52, back = z0 - D / 2, pz = z0 - .08;
  f.add(mc('boiler', ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.08, y0, .08, .02), '#6f7f9e', sx * (W / 2 - .08), y0 / 2, z0 + sz * (D / 2 - .08));
    add(G.box(W, bayT - y0, .04, .015), body, 0, (bayT + y0) / 2, back + .02);
    for (const sx of [-1, 1]) add(G.box(.04, bayT - y0, D, .015), body, sx * (W / 2 - .02), (bayT + y0) / 2, z0);
    add(G.box(W, .04, D, .015), body, 0, y0 + .02, z0);
    add(G.pbox(W - .08, bayT - y0 - .06, .01), '#4a4560', 0, (bayT + y0) / 2, back + .045);
    add(G.pbox(W - .08, .01, D - .06), '#6f6a86', 0, y0 + .045, z0);
    add(G.box(.32, .08, .09, .02), STEEL2, 0, y0 + .09, back + .1);
    for (const [x, h] of [[-.08, .09], [0, .12], [.08, .09]]) { add(G.cone(.03, h, 8), ORANGE, x, y0 + .13 + h / 2, back + .1); add(G.cone(.016, h * .6, 6), '#ffe27a', x, y0 + .13 + h * .3, back + .115); }
    tube([-.2, y0 + .2, back + .06], [.2, y0 + .2, back + .06], .02, COPPER, 8);
    // upper body: face, gauge hat, label plate
    add(G.box(W, H - bayT, D, .04), body, 0, (bayT + H) / 2, z0);
    add(G.box(W + .04, .06, D + .04, .025), bodyD, 0, H + .02, z0);
    face(add, 0, 1.1, fz + .002, 1.6);
    add(G.cyl(.08, .08, .03, 18), STEEL, -.16, 1.36, fz + .012, HP, 0, 0);
    add(G.cyl(.065, .065, .012, 18), WHITE, -.16, 1.36, fz + .03, HP, 0, 0);
    add(G.pbox(.01, .05, .006), CORAL, -.15, 1.375, fz + .038, 0, 0, -.5);
    add(G.sph(.01, 6, 4), INK, -.16, 1.36, fz + .038);
    add(G.box(.24, .07, .02, .01), WHITE, .12, 1.36, fz + .008);
    add(G.box(W - .1, .03, .02, .01), bodyD, 0, bayT + .03, fz + .006);
    // copper pipes: two up into the ceiling and back into the wall, one out of the side into the floor
    const up = (x, y1) => { tube([x, H + .04, pz], [x, y1, pz], .038, COPPER, 10); add(G.sph(.042, 10, 8), COPPER, x, y1, pz); tube([x, y1, pz], [x, y1, -.5], .038, COPPER, 10); add(G.cyl(.06, .06, .03, 12), STEEL2, x, y1, -.48, HP, 0, 0); };
    up(-.13, 2.22); up(.15, 2.0);
    add(G.cyl(.05, .05, .05, 12), STEEL2, -.13, H + .07, pz);
    add(G.cyl(.012, .012, .08, 6), STEEL2, -.13, 1.86, pz + .06, HP, 0, 0);
    add(G.tor(.075, .016, PI * 2, 4, 16), CORAL, -.13, 1.86, pz + .1);
    for (const a of [0, HP]) add(G.pbox(.14, .014, .014), CORAL, -.13, 1.86, pz + .1, 0, 0, a);
    tube([W / 2, .95, z0], [W / 2 + .12, .95, z0], .034, COPPER, 10); add(G.sph(.038, 10, 8), COPPER, W / 2 + .12, .95, z0);
    tube([W / 2 + .12, .95, z0], [W / 2 + .12, 0, z0], .034, COPPER, 10); add(G.cyl(.06, .065, .025, 12), STEEL2, W / 2 + .12, .012, z0);
  }));
  f.add(mg('boiler-label', atlasMat(), ({ add }) => add(quadGeo(.22, .055, LB(0)), .12, 1.36, fz + .019)));
  const DH = bayT - y0 - .08;
  const dv = new THREE.Group(); put(dv, -W / 2 + .02, (y0 + .04 + bayT) / 2, fz + .004);
  dv.add(mc('boiler-door', ({ add }) => {
    const cx = (W - .04) / 2;
    add(G.box(W - .045, DH, .035, .02), panel, cx, 0, 0);
    for (let i = 0; i < 3; i++) add(G.box(.26, .024, .012, .008), '#ead6b8', cx, -.12 - i * .055, .02);
    add(G.cyl(.065, .065, .02, 18), '#4a4560', cx, .1, .02, HP, 0, 0);
    add(G.cyl(.048, .048, .022, 18), '#ffcf6b', cx, .1, .022, HP, 0, 0);
    add(G.cone(.024, .055, 6), ORANGE, cx, .095, .036, 0, 0, 0, [1, 1, .4]);
    add(G.box(.04, .13, .03, .012), STEEL2, W - .1, 0, .03);
  }));
  f.add(dv);
  const p = f.part('door', dv, t => { dv.rotation.y = -2.45 * t; }, { label: '보일러 문', sfx: 'open' });
  f.spot('inside', null, 0, y0 + .05, z0 + .07, { part: p, maxH: .4, label: '보일러 안', scale: .78 });
};

// 세탁기 (1×1): a front-loader with a surprised face (the porthole is its "O" mouth); the round door swings open on the
// drum; detergent on top.
B.washer = (f, T) => {
  const body = '#fbfdff', trim = '#a6dcf5';
  const W = .74, D = .62, z0 = -.14, fz = z0 + D / 2, y0 = .05, H = .84, yT = y0 + H, cy = .41, Ro = .2, Rd = .23, DD = .42, PT = .05, zb = fz - PT, back = z0 - D / 2;
  f.add(mc('washer', ({ add }) => {
    add(G.pbox(W - .06, y0, D - .06), '#cfd8e6', 0, y0 / 2, z0);
    const s = rrShape(-W / 2, y0, W, H, .05); s.holes.push(new THREE.Path().absarc(0, cy, Ro, 0, PI * 2, true));
    add(G.ext(s, PT, .012, 14), body, 0, 0, zb);
    const bd = D - PT - DD;
    add(G.box(W, H, bd, .03), body, 0, y0 + H / 2, back + bd / 2);
    add(G.pbox(W, yT - (cy + Rd), DD), body, 0, (yT + cy + Rd) / 2, zb - DD / 2);
    add(G.pbox(W, cy - Rd - y0, DD), body, 0, (cy - Rd + y0) / 2, zb - DD / 2);
    for (const sx of [-1, 1]) add(G.pbox(W / 2 - Rd, 2 * Rd, DD), body, sx * (W / 2 + Rd) / 2, cy, zb - DD / 2);
    add(G.lathe([[Rd, DD + .01], [Rd, 0], [0, 0]], 22), '#b9c6d8', 0, cy, zb - DD - .005, HP, 0, 0);
    for (const a of [-1, 1]) add(G.box(.04, .03, .3, .01), STEEL, Math.sin(a) * (Rd - .015), cy + Math.cos(a) * (Rd - .015), zb - DD / 2, 0, 0, -a);
    add(G.box(W + .01, .03, D + .01, .015), '#eef4fa', 0, yT, z0);
    // control strip: eyes, a dial, two buttons
    add(G.box(W - .06, .13, .012, .006), trim, 0, yT - .085, fz + .012);
    face(add, -.15, yT - .08, fz + .02, 1.05);
    add(G.cyl(.056, .056, .035, 16), WHITE, .22, yT - .085, fz + .03, HP, 0, 0);
    add(G.pbox(.012, .05, .006), INK, .22, yT - .07, fz + .049);
    for (const [x, c] of [[.07, CORAL], [.12, HONEY]]) add(G.cyl(.016, .016, .014, 10), c, x, yT - .085, fz + .022, HP, 0, 0);
    // detergent bottle on top
    add(G.box(.13, .2, .09, .03), CORAL, .22, yT + .115, back + .12);
    add(G.cyl(.026, .026, .04, 10), WHITE, .25, yT + .23, back + .12);
    add(G.tor(.03, .01, PI, 3, 8), shade(CORAL, -.08), .18, yT + .21, back + .12);
  }));
  f.add(mg('washer-label', atlasMat(), ({ add }) => add(quadGeo(.12, .03, LB(3)), .22, yT + .1, back + .166)));
  const hx = -Ro - .065;
  const dv = new THREE.Group(); put(dv, hx, cy, fz + .02);
  dv.add(mc('washer-door', ({ add }) => {
    const cx = -hx;
    add(G.tor(Ro + .02, .04, PI * 2, 8, 28), '#e9eef6', cx, 0, .02);
    add(G.cyl(Ro + .005, Ro + .005, .02, 24), '#cfeefc', cx, 0, .02, HP, 0, 0);
    add(G.box(.05, .1, .04, .015), STEEL2, cx + Ro + .045, 0, .03);
    add(G.box(.05, .08, .04, .015), STEEL2, 0, 0, 0);
  }));
  f.add(dv);
  const p = f.part('door', dv, t => { dv.rotation.y = -2.3 * t; }, { label: '세탁기 문', sfx: 'open' });
  f.spot('inside', null, 0, cy - Rd + .006, zb - .1, { part: p, maxH: .3, label: '세탁기 안', scale: .58 });
  f.spot('on', null, -.14, yT + .015, z0 + .02, { maxH: .45, label: '세탁기 위', scale: .8 });
};

// 창고 선반 (2×1): a steel rack of paint cans, cardboard boxes and a coil of rope; the sky bin of ornaments on top has a
// mint lid that flips back.
B.metalshelf = (f, T) => {
  const W = 1.8, D = .46, z0 = -.22, Ht = 1.8, L = [.1, .62, 1.14, 1.66], S = L.map(y => y + .015), post = '#9aa5be';
  const BX = -.36, BW = .6, BH = .28, BD = .38;
  const cans = [[-.68, S[0], z0 + .04, .1, .17, CORAL], [-.45, S[0], z0 - .02, .09, .15, MINT], [.62, S[1], z0 + .02, .085, .14, SKY], [.48, S[2], z0, .065, .11, HONEY], [.68, S[2], z0 + .02, .065, .11, LILAC]];
  f.add(mc('metalshelf', ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(G.pbox(.04, Ht, .04), post, sx * (W / 2 - .02), Ht / 2, z0 + sz * (D / 2 - .02)); add(G.cyl(.03, .035, .02, 8), DARK, sx * (W / 2 - .02), .01, z0 + sz * (D / 2 - .02)); }
    for (const y of L) { add(G.box(W - .02, .03, D - .02, .008), STEEL, 0, y, z0); add(G.pbox(W - .04, .045, .012), post, 0, y - .01, z0 + D / 2 - .01); }
    for (const [x, y, z, r, h, c] of cans) {
      add(G.cyl(r, r, h, 14), '#e3e8f0', x, y + h / 2, z);
      add(G.cyl(r * .92, r * .92, .012, 14), c, x, y + h + .004, z);
      add(G.tor(r * .96, .008, PI * 2, 3, 14), STEEL2, x, y + h, z, HP);
      add(G.cap(r * .14, h * .22, 2, 5), c, x - r * .5, y + h - h * .12, z + r * .86);
      add(G.tor(r * .8, .006, PI, 3, 8), STEEL2, x, y + h, z, 0, .3, 0);
    }
    // cardboard boxes
    const box = (x, y, w, h, d, c) => { add(G.box(w, h, d, .012), c, x, y + h / 2, z0); add(G.pbox(.08, h + .004, d + .004), '#f6e7c4', x, y + h / 2, z0); add(G.pbox(w + .004, .02, .08), '#f6e7c4', x, y + h - .01, z0); };
    box(.4, S[0], .58, .32, .38, KRAFT); box(-.5, S[1], .46, .28, .36, '#e0b277'); box(.5, S[3], .36, .22, .3, KRAFT);
    // coil of rope
    for (let i = 0; i < 2; i++) add(G.tor(.11, .032, PI * 2, 5, 18), HONEY, -.6, S[2] + .032 + i * .055, z0, HP);
    add(G.cap(.03, .1, 2, 5), HONEY, -.46, S[2] + .03, z0 + .1, 0, .8, HP);
    // ornament bin (static shell + filler)
    add(G.box(BW, BH, .03, .01), '#a6dcf5', BX, S[3] + BH / 2, z0 - BD / 2 + .015);
    add(G.box(BW, BH, .03, .01), '#a6dcf5', BX, S[3] + BH / 2, z0 + BD / 2 - .015);
    for (const sx of [-1, 1]) add(G.box(.03, BH, BD, .01), '#a6dcf5', BX + sx * (BW / 2 - .015), S[3] + BH / 2, z0);
    add(G.pbox(BW - .04, .13, BD - .04), '#8fc7e6', BX, S[3] + .065, z0);
    for (const [x, z, c] of [[-.22, -.12, CORAL], [-.1, -.13, GOLD], [.2, -.11, MINT], [.22, .1, CORAL], [-.22, .1, GOLD]]) { add(G.sph(.045, 10, 8), c, BX + x, S[3] + .17, z0 + z); add(G.cyl(.012, .012, .02, 6), STEEL, BX + x, S[3] + .222, z0 + z); }
  }));
  f.add(mg('metalshelf-labels', atlasMat(), ({ add }) => {
    for (const [x, y, z, r, h] of cans) add(bandGeo(r + .002, h * .45, LB(9), 2.0), x, y + h * .45, z);
    add(quadGeo(.2, .05, LB(10)), -.5, S[1] + .15, z0 + .181);
    add(quadGeo(.2, .05, LB(11)), BX, S[3] + .15, z0 + BD / 2 + .002);
  }));
  const lid = grp(mc('metalshelf-lid', ({ add }) => {
    add(G.box(BW + .03, .04, BD + .03, .015), MINT, 0, .02, (BD + .03) / 2);
    add(G.box(.16, .025, .03, .01), shade(MINT, -.1), 0, .02, BD + .035);
  }));
  put(lid, BX, S[3] + BH, z0 - BD / 2 - .015); f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.9 * t; }, { label: '장식 상자', sfx: 'open' });
  f.spot('inside', null, BX, S[3] + .13, z0 + .02, { part: p, maxH: .3, label: '장식 상자 안', scale: .7 });
  f.spot('on', null, .06, S[1], z0 + .04, { maxH: .42, label: '선반 둘째 칸', scale: .82 });
  f.spot('on', null, -.12, S[2], z0 + .04, { maxH: .42, label: '선반 셋째 칸', scale: .82 });
};

// 공구함 (1×1, low): a coral toolbox with a honey handle (takes a padlock); a hammer and a tape measure lie nearby.
B.toolbox = (f, T) => {
  const body = '#ff8f7a', bodyD = shade(body, -.1), inner = shade(body, -.25);
  const W = .64, D = .36, H = .3, z0 = -.04, fz = z0 + D / 2, y0 = .02, yt = y0 + H;
  f.add(mc('toolbox', ({ add }) => {
    add(G.box(W, .04, D, .012), bodyD, 0, y0 + .02, z0);
    add(G.box(W, H, .035, .012), body, 0, y0 + H / 2, z0 - D / 2 + .0175);
    add(G.box(W, H, .035, .012), body, 0, y0 + H / 2, fz - .0175);
    for (const sx of [-1, 1]) add(G.box(.035, H, D, .012), body, sx * (W / 2 - .0175), y0 + H / 2, z0);
    add(G.pbox(W - .07, .1, D - .07), inner, 0, y0 + .05 + .03, z0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.05, .05, .05, .012), STEEL, sx * (W / 2 - .01), y0 + .025, z0 + sz * (D / 2 - .01));
    // tools inside, at the back
    add(G.cap(.018, .1, 2, 6), HONEY, -.14, y0 + .14, z0 - .1, 0, 0, HP); add(G.cyl(.006, .006, .1, 5), STEEL, -.03, y0 + .14, z0 - .1, 0, 0, HP);
    add(G.pbox(.16, .016, .03), STEEL, .12, y0 + .14, z0 - .1, 0, .2, 0); add(G.tor(.022, .009, PI * 1.5, 3, 8), STEEL, .2, y0 + .14, z0 - .085, HP, 0, 0);
    // hammer + tape measure on the floor
    add(G.cap(.018, .26, 2, 6), '#e0a96a', .33, .02, .33, 0, -.6, HP); add(G.box(.06, .05, .14, .012), STEEL2, .43, .028, .27, 0, -.6, 0);
    add(G.cyl(.065, .065, .05, 14), HONEY, -.36, .025, .32, 0, 0, 0); add(G.cyl(.02, .02, .052, 8), DARK, -.36, .026, .32); add(G.pbox(.14, .006, .03), '#ffe27a', -.26, .004, .36, 0, -.3, 0);
  }));
  f.add(mg('toolbox-label', atlasMat(), ({ add }) => add(quadGeo(.2, .05, LB(2)), -.14, y0 + .16, fz + .002)));
  const lid = grp(mc('toolbox-lid', ({ add }) => {
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(D + .02, 0); s.lineTo(D - .04, .07); s.lineTo(.06, .07); s.lineTo(0, 0);
    add(G.ext(s, W + .02, .008, 2), body, W / 2 + .01, 0, 0, 0, -HP, 0);
    add(G.tor(.1, .018, PI, 4, 12), HONEY, 0, .075, (D + .02) / 2);
    for (const sx of [-1, 1]) add(G.box(.04, .03, .05, .01), STEEL, sx * .1, .08, (D + .02) / 2);
    add(G.box(.06, .07, .02, .008), STEEL, .12, -.02, D + .03);
  }));
  put(lid, 0, yt, z0 - D / 2 - .01); f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.9 * t; }, { label: '공구함', sfx: 'open' });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: .12, y: yt - .1, z: fz + .045 };
  f.spot('inside', null, -.04, y0 + .13, z0 + .06, { part: p, maxH: .3, label: '공구함 안', scale: .66 });
};

// 잼 선반 (wall, span 2): a wooden pantry cubby full of jam jars with cloth caps, a honey pot and bunting along the top.
B.jarshelf = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [wood, woodD].join(',');
  const W = 1.6, Dp = .26, y1 = 1.12, y2 = 1.58, yTop = 2.02, bt = .04, s1 = y1 + bt / 2, s2 = y2 + bt / 2, jz = .13;
  const JARS = [[s1, -.66, .068, .17, '#ff5a6e', CORAL, 4], [s1, -.5, .056, .13, '#9b6be0', LILAC, 6], [s1, .0, .072, .19, ORANGE, HONEY, 7], [s1, .17, .058, .14, '#8fd47a', MINT, 5],
    [s2, -.64, .06, .15, '#ffb03a', HONEY, 8], [s2, -.47, .05, .12, '#ff5a6e', CORAL, 4], [s2, .28, .066, .17, '#9b6be0', LILAC, 6], [s2, .46, .054, .12, ORANGE, HONEY, 7], [s2, .64, .06, .15, '#8fd47a', MINT, 5]];
  f.add(mc('jarshelf|' + tk, ({ add }) => {
    add(G.pbox(W - .06, yTop - y1 + .02, .015), shade(wood, .06), 0, (yTop + y1) / 2, .008);
    for (const sx of [-1, 1]) add(G.box(.04, yTop - y1 + .12, Dp, .012), woodD, sx * (W / 2 - .02), (yTop + y1 - .12) / 2, Dp / 2);
    for (const y of [y1, y2]) add(G.box(W, bt, Dp, .012), wood, 0, y, Dp / 2);
    add(G.box(W + .06, bt, Dp + .03, .012), woodD, 0, yTop, Dp / 2);
    const arch = new THREE.Shape(); arch.moveTo(-.3, 0); arch.quadraticCurveTo(-.3, .16, 0, .17); arch.quadraticCurveTo(.3, .16, .3, 0); arch.lineTo(-.3, 0);
    add(G.ext(arch, .03, .006, 8), woodD, 0, yTop + .02, .02);
    add(G.ext(heartShape(.05), .012, .004, 6), CORAL, 0, yTop + .1, .055);
    // bunting across the front
    for (let i = 0; i < 9; i++) { const x = -.72 + i * .18, tri = new THREE.Shape(); tri.moveTo(-.06, 0); tri.lineTo(.06, 0); tri.lineTo(0, -.09); tri.lineTo(-.06, 0); add(G.ext(tri, .006, 0, 1), [CORAL, HONEY, MINT][i % 3], x, yTop - .03 - Math.sin(i / 8 * PI) * .03, Dp + .01); }
    // jars: jam, a band of glass at the top, steel lid, gingham-ish cloth cap tied with string
    for (const [y, x, r, h, jam, cap] of JARS) {
      add(G.cyl(r, r, h * .78, 12), jam, x, y + h * .39, jz);
      add(G.cyl(r * .96, r, h * .22, 12), '#eef8fb', x, y + h * .89, jz);
      add(G.sph(r * 1.25, 12, 5), cap, x, y + h + .01, jz, 0, 0, 0, [1, .34, 1]);
      add(G.sph(r * .5, 8, 4), WHITE, x - r * .3, y + h + .022, jz + r * .3, 0, 0, 0, [1, .3, 1]);
      add(G.tor(r * .9, .006, PI * 2, 3, 12), WHITE, x, y + h - .006, jz, HP);
    }
    // honey pot with a dipper
    add(G.sph(.08, 12, 8), HONEY, .66, s1 + .075, jz, 0, 0, 0, [1, .92, 1]);
    add(G.cyl(.05, .055, .03, 12), '#e0a63a', .66, s1 + .15, jz);
    add(G.cyl(.008, .008, .18, 5), wood, .69, s1 + .2, jz, 0, 0, -.25);
    add(G.cyl(.022, .022, .04, 8), woodD, .715, s1 + .29, jz, 0, 0, -.25);
  }));
  f.add(mg('jarshelf-labels', atlasMat(), ({ add }) => {
    for (const [y, x, r, h, , , li] of JARS) add(bandGeo(r + .002, h * .38, LB(li), 2.0), x, y + h * .4, jz);
    add(bandGeo(.072, .05, LB(8), 1.6), .66, s1 + .075, jz);
  }));
  f.spot('on', null, -.26, s1, .14, { maxH: .4, label: '잼 선반 아래칸', scale: .62 });
  f.spot('on', null, .43, s1, .14, { maxH: .4, label: '잼 선반 아래칸', scale: .58 });
  f.spot('on', null, -.17, s2, .14, { maxH: .38, label: '잼 선반 위칸', scale: .62 });
};

// ═════════════════════════════════════════════ STRUCTURE ═════════════════════════════════════════════
// 계단 (w 1 × d 3): open-riser wooden stairs rising FLOOR_H over the 3-tile depth, HIGH end at -z (against the back wall),
// a runner down the middle, a handrail with a honey newel ball, and a little under-stairs closet whose two arched leaves
// open sideways (on +x; opts.side = 'left' mirrors the whole piece so they face -x). The low, open part under the
// stairs is an "under" spot.
B.stairsup = (f, T, o = {}) => {
  const sx = o.side === 'left' ? -1 : 1;
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), door = col(T, 'door'), knob = col(T, 'knob'), runner = col(T, 'accent2'), wall = col(T, 'body');
  const tk = [wood, woodD, door, knob, runner, wall].join(',');
  const N = 12, RISE = FLOOR_H / N, RUN = 3 / N, SW = .86, k = FLOOR_H / 3;
  const ZC = -.35, OZ0 = -1.1, OZ1 = -.42, OY = .03, OH = 1.15, PX = SW / 2 - .04;   // closet front, door opening, side panel x
  const yc = z => (1.5 - z) * k - .08;          // underside line of the treads
  const yr = z => (1.5 - z) * k + RISE + .85;   // handrail line
  const M = new THREE.Group(); M.scale.x = sx; f.add(M);
  M.add(mc('stairs|' + tk, ({ add, tube }) => {
    for (let i = 1; i <= N; i++) {
      const y = i * RISE, zc = 1.5 - (i - .5) * RUN;
      add(G.pbox(SW, .055, RUN + .02), wood, 0, y - .0275, zc - .01);
      add(G.cyl(.028, .028, SW, 6), wood, 0, y - .028, zc + RUN / 2, 0, 0, HP);
      add(G.pbox(SW * .52, .008, RUN + .03), runner, 0, y + .003, zc);
    }
    // stringers: a sloped board each side
    const s = new THREE.Shape(), top = (1.5 - (-1.5 + RUN)) * k + RISE + .05;
    s.moveTo(-1.5, 0); s.lineTo(-1.5, RISE + .05); s.lineTo(1.5 - RUN, top); s.lineTo(1.5, top); s.lineTo(1.5, top - .4); s.lineTo(1.5 - RUN, top - .4);
    s.lineTo(-1.5 + (.4 - RISE - .05) / k, 0); s.lineTo(-1.5, 0);
    for (const side of [-1, 1]) add(G.ext(s, .06, .008, 2), woodD, side > 0 ? SW / 2 : -SW / 2 - .06, 0, 0, 0, HP, 0);
    // closet: side panels (door opening on +x), front, sloped soffit, back, floor
    const panel = hole => { const p = new THREE.Shape(); p.moveTo(-ZC, 0); p.lineTo(-ZC, yc(ZC)); p.lineTo(1.5, yc(-1.5)); p.lineTo(1.5, 0); p.lineTo(-ZC, 0); if (hole) p.holes.push(rrShape(-OZ1, OY, OZ1 - OZ0, OH, .14)); return p; };
    add(G.ext(panel(true), .04, 0, 6), wall, PX, 0, 0, 0, HP, 0);
    add(G.ext(panel(false), .04, 0, 2), wall, -PX - .04, 0, 0, 0, HP, 0);
    const trim = rrShape(-OZ1 - .04, 0, OZ1 - OZ0 + .08, OH + OY + .04, .17); trim.holes.push(rrShape(-OZ1, OY, OZ1 - OZ0, OH, .14));
    add(G.ext(trim, .02, .004, 6), woodD, PX + .04, 0, 0, 0, HP, 0);
    add(G.pbox(SW - .08, yc(ZC), .04), wall, 0, yc(ZC) / 2, ZC - .02);
    const sl = Math.hypot(1.5 + ZC, yc(-1.5) - yc(ZC));
    add(G.pbox(SW - .08, .03, sl), shade(wall, -.04), 0, (yc(ZC) + yc(-1.5)) / 2 - .015, (ZC - 1.5) / 2, Math.atan(k), 0, 0);
    add(G.pbox(SW - .08, yc(-1.5), .03), wall, 0, yc(-1.5) / 2, -1.485);
    add(G.pbox(SW - .1, .016, 1.1), shade(wall, -.12), 0, .008, (ZC - 1.5) / 2);
    // closet things at the back: a broom and a box
    tube([-.28, .02, -1.3], [-.2, 1.1, -1.42], .014, wood, 5);
    add(G.cone(.08, .2, 8), HONEY, -.285, .1, -1.3, -.05, 0, .07);
    add(G.box(.26, .2, .22, .012), KRAFT, .18, .1, -1.3); add(G.pbox(.06, .204, .224), '#f6e7c4', .18, .1, -1.3);
    // handrail on the +x side: rail, balusters on every other tread, a newel post with a honey ball
    const rx = SW / 2 - .05;
    tube([rx, yr(1.42), 1.42], [rx, yr(-1.45), -1.45], .022, wood, 8);
    for (let i = 2; i <= N; i += 2) { const z = 1.5 - (i - .5) * RUN; tube([rx, i * RISE, z], [rx, yr(z), z], .012, WHITE, 5); }
    add(G.box(.08, yr(1.42) + .08, .08, .02), woodD, rx, (yr(1.42) + .08) / 2, 1.42);
    add(G.sph(.06, 10, 8), HONEY, rx, yr(1.42) + .13, 1.42);
  }));
  // the closet's two arched leaves (hinged at the opening's front and back edges, folding outward)
  const LW = (OZ1 - OZ0) / 2 - .006, LH = OH - .01;
  const leaf = (s, z0, key) => {
    const pv = new THREE.Group(); put(pv, PX + .02, OY + .005, z0, 0, HP, 0);
    pv.add(mc('stairs-leaf' + key + '|' + [door, knob].join(','), ({ add }) => {
      const cx = s * LW / 2;
      add(G.box(LW, LH, .035, .03), door, cx, LH / 2, 0);
      add(G.box(LW - .1, LH * .42, .012, .02), shade(door, .07), cx, LH * .3, .018);
      add(G.cyl(.075, .075, .014, 16), SKY2, cx, LH - .26, .019, HP, 0, 0);
      add(G.tor(.075, .013, PI * 2, 3, 16), WHITE, cx, LH - .26, .024);
      add(G.pbox(.012, .14, .006), WHITE, cx, LH - .26, .027); add(G.pbox(.14, .012, .006), WHITE, cx, LH - .26, .027);
      add(G.sph(.024, 8, 6), knob, s * (LW - .05), LH * .5, .032);
    }));
    M.add(pv); return pv;
  };
  const LF = leaf(1, OZ1, 'F'), LBk = leaf(-1, OZ0, 'B');
  const p = f.part('door', [LF, LBk], t => { LF.rotation.y = HP - 2.55 * t; LBk.rotation.y = HP + 2.55 * t; }, { label: '계단 밑 창고', sfx: 'open', dur: .32 });
  f.spot('inside', null, sx * .17, .02, -.76, { part: p, maxH: .45, label: '계단 밑 창고', scale: .82 });
  f.spot('under', null, -sx * .04, 0, .06, { maxH: .45, label: '계단 밑', scale: .9 });
  f.stairs = { from: { x: 0, y: 0, z: 1.5 }, to: { x: 0, y: FLOOR_H, z: -1.5 }, steps: N, rise: RISE, run: RUN, width: SW };
};

export const MAP_BUILDERS = B;

export const MAP_INFO = {
  // 욕실
  bathtub: { w: 2, d: 1, name: '욕조', price: 320 },
  toilet: { w: 1, d: 1, name: '변기', price: 160 },
  vanity: { w: 1, d: 1, name: '세면대', price: 210 },
  mirrorcab: { wall: true, span: 1, name: '거울 수납장', price: 150 },
  laundry: { w: 1, d: 1, name: '빨래 바구니', price: 90 },
  // 사무실
  officedesk: { w: 2, d: 1, name: '사무용 책상', price: 260 },
  officechair: { w: 1, d: 1, name: '사무 의자', price: 110 },
  copier: { w: 1, d: 1, name: '복합기', price: 340 },
  watercooler: { w: 1, d: 1, name: '정수기', price: 150 },
  filecab: { w: 1, d: 1, name: '서류 캐비닛', price: 240 },
  whiteboard: { wall: true, span: 2, name: '화이트보드', price: 170 },
  cubicle: { w: 2, d: 1, name: '칸막이', price: 120 },
  coffeebar: { w: 1, d: 1, name: '커피 바', price: 230 },
  // 지하실
  boiler: { w: 1, d: 1, name: '보일러', price: 280 },
  washer: { w: 1, d: 1, name: '세탁기', price: 300 },
  metalshelf: { w: 2, d: 1, name: '창고 선반', price: 190 },
  toolbox: { w: 1, d: 1, name: '공구함', price: 130 },
  jarshelf: { wall: true, span: 2, name: '잼 선반', price: 160 },
  // 구조
  stairsup: { w: 1, d: 3, name: '계단', price: 420 },
};

// Suggested room themes (stages.js THEMES shape). Extra keys used by these props: tub, felt (both fall back above).
const BASE_T = { trim: '#ffffff', sheet: '#ffffff', pillow: '#fff3d6', rug2: '#ffffff', knob: '#ffd84a', top: '#ffffff' };
export const MAP_THEMES = {
  bath: { ...BASE_T, name: '욕실', friend: null, bg: ['#e4f6ff', '#d0eefc'], base: '#a9d8ef', floorKind: 'checker', floor: '#ffffff', floor2: '#d3eefb', wallKind: 'tile', wall: '#f4fbff', wall2: '#d6ecf7', wainscot: '#cde9f6', wallEdge: '#f7fcff',
    wood: '#f1d1a6', woodD: '#cfa46f', body: '#ffffff', accent: '#7fd6c0', accent2: '#ffb7a6', accent3: '#ffe27a', door: '#9fe0cf', fabric: '#ffd0a6', fabric2: '#d9f3ea', curtain: '#9fe3d0', tub: '#a6dcf5', rug: '#d9f3ea', pot: '#ffb7a6' },
  office: { ...BASE_T, name: '사무실', friend: null, bg: ['#eef3fb', '#dfe8f5'], base: '#b8c9e2', floorKind: 'carpet', floor: '#e3e9f2', floor2: '#cfd9e8', wallKind: 'stripe', wall: '#fbf8f1', wall2: '#f1ece1', wainscot: '#d6e4f0', wallEdge: '#fdfbf6',
    wood: '#f0d2a8', woodD: '#c9a06e', body: '#fbf8f1', accent: '#7fd6c0', accent2: '#8fd3f4', accent3: '#ffcf5c', door: '#ffcf9e', fabric: '#c9dcf2', fabric2: '#e4eefa', curtain: '#a9c8f0', felt: '#b9d5ee', rug: '#e4eefa', pot: '#ffb7a6' },
  basement: { ...BASE_T, name: '지하실', friend: null, bg: ['#f3ece2', '#e6dccd'], base: '#c9b79e', floorKind: 'checker', floor: '#ece6dc', floor2: '#dcd3c4', wallKind: 'wood', wall: '#f6ecdc', wall2: '#e6d4b8', wainscot: '#dccab0', wallEdge: '#f8f0e4',
    wood: '#e9c393', woodD: '#c0915e', body: '#fbf3e6', accent: '#7fd6c0', accent2: '#ff9f8a', accent3: '#ffcf5c', door: '#9fd8c8', fabric: '#ffd0a6', fabric2: '#ffe3c7', curtain: '#ffcf8f', rug: '#f2e2c8', pot: '#7fbfff' },
};

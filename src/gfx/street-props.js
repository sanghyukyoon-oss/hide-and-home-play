// Street-corner props (우리 동네 골목): an everyday corner where Korean, Japanese and American streets meet — a 24h konbini
// front, a tteokbokki stall under a red awning, red plastic stools, a fire hydrant, a STOP sign, a street lamp, a convex
// traffic mirror, rubber cones, a stack of parcels, a city bike with a front basket, a gate post with pots, a red post box,
// a manhole and a bus-stop bench; on the wall a 고양이 주의 sign. Same contract as apt-props.js / map-props.js:
//   builder(f, T, opts) fills a Furn. Origin = footprint centre on the ground, the piece faces +z, back toward -z, 1 tile = 1.
//   Wall pieces (wall: true, span 1|2) hang on a boundary wall's inner face: origin at the face, ground height, +z into the scene.
//   parts open / lift / slide / flip; spots: inside (needs its part open) | under/behind (visible but tucked) | on (plain sight).
//   Lockable parts carry p.lockable = true and p.lockKind ('pad' | 'code'), with f.lockAt where the lock hardware goes.
// Toy-set rules (as apt-props.js): chunky silhouettes, flat matte colours, few draw calls. Static decor is merged into ONE
// vertex-coloured mesh per piece (mc); prints and signage share one label atlas (mg); every moving part is its own mesh.
// Glass, steam and light bulbs are the only extra materials. Decals / prints sit >= .004 in front of the face they are on.
//   import { STREET_BUILDERS, STREET_INFO, STREET_THEMES, STREET_ITEMS } from './gfx/street-props.js';
//   registerFurniture(STREET_BUILDERS, STREET_INFO); Object.assign(ITEMS, STREET_ITEMS);
//   for (const k in STREET_THEMES) THEMES[k] = { ...THEMES.my, ...STREET_THEMES[k] };
// 'manhole' stays flat (< .03 tall); its info carries floor: true as a hint that it can be walked over like the rug.
// Warm late-afternoon palette: cream, honey, tomato red, sky, mint, mustard, warm asphalt.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { grp, put, mat, mesh, geo, canvasTex, texCache, roundRect, shade, STYLE } from './kit.js';
import { tr, addI18n } from '../i18n.js';

const PI = Math.PI, HP = PI / 2;

// ── palette ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Theme keys first (pieces follow the scene they are bought into). Extra keys only the street theme sets:
// awning (stall tarp), shop (konbini walls), stall (cart body), stool (plastic stools), bike, lamp (lamp / shelter steel),
// concrete, brick, gate.
const K = { wood: '#e9b47e', woodD: '#b98252', accent: '#7fd6c0', accent2: '#8fd3f4', accent3: '#ffc23d', pot: '#e88a5c',
  awning: '#ff5a4a', shop: '#fffaf2', stall: '#fff1dc', stool: '#ff4f4a', bike: '#4fae9b', lamp: '#5d7088',
  concrete: '#e2d9cd', brick: '#d0785a', gate: '#3b8f6a' };
const col = (T, k) => (T && T[k]) || K[k];
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', SKY = '#8fd3f4', SKY2 = '#cdeefc', MUSTARD = '#ffc23d', TOMATO = '#ff6b57',
  CORAL = '#ff9f8a', MINT = '#7fd6c0', BLUSH = '#ff9fb5', LEAF = '#6cc46a', LEAF2 = '#4ea85a', LEAF3 = '#8fd47a', ORANGE = '#ffab4c',
  STEEL = '#c9cfe0', STEEL2 = '#a9b2c8', ALU = '#dde2ea', DARK = '#5b5672', CHAR = '#3b3550', KRAFT = '#e8bb82', KRAFT2 = '#cf9a5e',
  TAPE = '#f6e2b0', SOIL = '#8a5a3c', LILAC = '#b9a6ff', BROWN = '#c98a52', RED = '#ff4b4b', CONE = '#ff7a2f', YELLOW = '#ffd23f',
  SAUCE = '#e8452f', RICE = '#fbf8ef', NORI = '#2f3a2c', MIRROR = '#ff8a3c';

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
addI18n({ '회오리 감자': 'Tornado potato', '떡꼬치': 'Rice cake skewer' });
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
// One mesh from many pieces sharing one material (labels, prints, glass). fn gets { add, addM }; keeps uvs.
function mg(key, m, fn) {
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
// Remap a geometry's 0..1 uvs into an atlas rect [u0, v0, u1, v1].
function cellUV(g, c) {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, c[0] + uv.getX(i) * (c[2] - c[0]), c[1] + uv.getY(i) * (c[3] - c[1]));
  return g;
}
const quadGeo = (w, h, rc) => cellUV(new THREE.PlaneGeometry(w, h), rc);
// a print wrapped round part of a (tapered) cylinder, centred on +z
const bandGeo = (rt, rb, h, rc, a = 2.2, seg = 16) => cellUV(new THREE.CylinderGeometry(rt, rb, h, seg, 1, true, -a / 2, a), rc);
// a flat shape printed with an atlas cell; the shape spans -R..R on both axes
function shapeAtlas(shape, R, rc) {
  const g = new THREE.ShapeGeometry(shape, 2), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / (2 * R) + .5, uv.getY(i) / (2 * R) + .5);
  return cellUV(g, rc);
}
// a shallow convex spherical cap facing +z (base ring of radius R at z = 0), printed flat with an atlas cell
function capGeo(R, rc, th = .5) {
  const Rs = R / Math.sin(th), g = new THREE.SphereGeometry(Rs, 28, 6, 0, PI * 2, 0, th);
  g.rotateX(HP); g.translate(0, 0, -Rs * Math.cos(th));
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (2 * R) + .5, p.getY(i) / (2 * R) + .5);
  return cellUV(g, rc);
}
const discGeo = (r, rc) => cellUV(new THREE.CircleGeometry(r, 32), rc).rotateX(-HP);
function octShape(R) {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) { const a = PI / 8 + i * PI / 4; i ? s.lineTo(Math.cos(a) * R, Math.sin(a) * R) : s.moveTo(Math.cos(a) * R, Math.sin(a) * R); }
  s.closePath(); return s;
}
// rounded triangle (onigiri), base on y = y0
function triShape(w, h, r, y0 = 0) {
  const P = [[-w / 2, y0], [w / 2, y0], [0, y0 + h]], s = new THREE.Shape();
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = P[(i + 2) % 3], [bx, by] = P[i], [cx, cy] = P[(i + 1) % 3];
    const d1 = Math.hypot(ax - bx, ay - by), d2 = Math.hypot(cx - bx, cy - by);
    const p1 = [bx + (ax - bx) * r / d1, by + (ay - by) * r / d1], p2 = [bx + (cx - bx) * r / d2, by + (cy - by) * r / d2];
    if (i) s.lineTo(...p1); else s.moveTo(...p1);
    s.quadraticCurveTo(bx, by, ...p2);
  }
  s.closePath(); return s;
}
// Dot-eye face on the front of an upright cylinder of radius R centred at (cx, cz): every dot hugs the curved surface.
function cylFace(add, cx, y, cz, R, s = 1) {
  const at = (x, out) => cz + Math.sqrt(Math.max(0, R * R - x * x)) + out;
  for (const sx of [-1, 1]) {
    const ex = sx * .042 * s, a = Math.asin(ex / R);
    add(G.sph(.016 * s, 8, 6), INK, cx + ex, y, at(ex, -.002), 0, a, 0, [1, 1.2, .45]);
    add(G.sph(.005 * s, 5, 4), WHITE, cx + ex - .004 * s, y + .007 * s, at(ex, .005));
    const bx = sx * .07 * s, b = Math.asin(bx / R);
    add(G.sph(.02 * s, 8, 6), BLUSH, cx + bx, y - .028 * s, at(bx, -.003), 0, b, 0, [1, .6, .3]);
  }
  add(G.tor(.016 * s, .0045 * s, PI, 3, 8), INK, cx, y - .016 * s, at(0, .0), 0, 0, PI);
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
function clip(c, x, y, w, h, fn) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); fn(); c.restore(); }
function daisy(c, x, y, r, petal = '#ffffff', mid = '#ffc23d') { c.fillStyle = petal; for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; blob(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * .78); } c.fillStyle = mid; blob(c, x, y, r * .6); }
// the game's mochi hero
function mochi(c, x, y, r, body = '#ffffff') {
  c.fillStyle = body; c.beginPath(); c.ellipse(x, y, r, r * .84, 0, 0, PI * 2); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1.1, r * .08); c.stroke();
  c.fillStyle = '#2a1d33'; blob(c, x - r * .34, y - r * .06, r * .1); blob(c, x + r * .34, y - r * .06, r * .1);
  c.fillStyle = '#ff9fb5'; blob(c, x - r * .58, y + r * .2, r * .14); blob(c, x + r * .58, y + r * .2, r * .14);
  c.strokeStyle = '#2a1d33'; c.lineWidth = Math.max(1, r * .07); c.beginPath(); c.arc(x, y + r * .06, r * .14, .25, PI - .25); c.stroke();
}
// a round bear face (the corner store's mascot)
function bear(c, x, y, r, fur = '#eaa560', ink = '#2a1d33', inner = '#ffdcb5') {
  c.fillStyle = fur; blob(c, x - r * .74, y - r * .7, r * .36); blob(c, x + r * .74, y - r * .7, r * .36); blob(c, x, y, r);
  c.fillStyle = inner; blob(c, x - r * .74, y - r * .7, r * .18); blob(c, x + r * .74, y - r * .7, r * .18);
  c.beginPath(); c.ellipse(x, y + r * .3, r * .42, r * .3, 0, 0, PI * 2); c.fill();
  c.fillStyle = ink; blob(c, x - r * .38, y - r * .1, r * .1); blob(c, x + r * .38, y - r * .1, r * .1); blob(c, x, y + r * .2, r * .11);
  c.fillStyle = '#ff9fb5'; blob(c, x - r * .64, y + r * .2, r * .13); blob(c, x + r * .64, y + r * .2, r * .13);
}
function catHead(c, x, y, r) {
  c.beginPath(); c.moveTo(x - r * .92, y - r * .1); c.lineTo(x - r * .8, y - r * 1.18); c.lineTo(x - r * .28, y - r * .76);
  c.lineTo(x + r * .28, y - r * .76); c.lineTo(x + r * .8, y - r * 1.18); c.lineTo(x + r * .92, y - r * .1); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(x, y, r, r * .82, 0, 0, PI * 2); c.fill();
}

// Label atlas, 1024² canvas = 512² drawing units: the konbini sign band on top, then the STOP face, the mirror view, the
// manhole lid, the cat sign, the bus-stop ad, the stall's menu and sign, the post box print, a shipping label, stickers,
// the bus-stop name board, a door poster, a tomato box print, the onigiri label, the bubble-tea band and a nobori flag.
const AT = 512, PXU = .5 / 1024;
const RC = (x, y, w, h) => [x / AT + PXU, 1 - (y + h) / AT + PXU, (x + w) / AT - PXU, 1 - y / AT - PXU];
const RG = {
  sign: RC(0, 0, 512, 68), stop: RC(0, 72, 128, 128), mirror: RC(128, 72, 128, 128), manhole: RC(256, 72, 128, 128), cat: RC(384, 72, 112, 128),
  ad: RC(0, 204, 128, 192), menu: RC(128, 204, 96, 176), tteok: RC(224, 204, 224, 48), atm: RC(448, 204, 64, 32), fragile: RC(448, 240, 64, 32),
  post: RC(224, 256, 96, 48), ship: RC(320, 256, 128, 80), house: RC(448, 276, 64, 32), open: RC(448, 316, 64, 40), stopname: RC(224, 340, 192, 40),
  tomato: RC(224, 384, 64, 64), oni: RC(288, 384, 64, 32), tea: RC(352, 384, 112, 32), nobori: RC(464, 384, 40, 128), hazard: RC(0, 400, 128, 16),
  poster: RC(128, 400, 96, 104),
};

function drawSign(c, x, y, w, h) {
  c.fillStyle = '#fffdf7'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ff9a3c'; c.fillRect(x, y + 12, w, 11);
  c.fillStyle = '#ff5a4a'; c.fillRect(x, y + 27, w, 6);
  c.fillStyle = '#3f9be0'; c.fillRect(x, y + 37, w, 11);
  c.fillStyle = '#ffffff'; roundRect(c, x + w / 2 - 112, y + 3, 224, h - 6, 12); c.fill();
  c.strokeStyle = '#ffd7b0'; c.lineWidth = 2; c.stroke();
  bear(c, x + w / 2 - 76, y + h / 2 + 3, 20);
  txt(c, '24', x + w / 2 - 12, y + h / 2 + 2, 46, '#ff5a4a', { stroke: '#ffe9d2', sw: 3 });
  txt(c, 'コンビニ', x + w / 2 + 60, y + h / 2 - 9, 17, '#3f9be0');
  txt(c, '편의점', x + w / 2 + 60, y + h / 2 + 13, 14, '#ff9a3c');
  for (const sx of [-1, 1]) { daisy(c, x + w / 2 + sx * 190, y + h / 2 + 1, 5); daisy(c, x + w / 2 + sx * 152, y + h / 2 + 1, 3.6, '#fff4e2', '#ff9a3c'); }
}
function drawStop(c, x, y, s) {
  const cx = x + s / 2, cy = y + s / 2;
  const oct = r => { c.beginPath(); for (let i = 0; i < 8; i++) { const a = PI / 8 + i * PI / 4; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); };
  c.fillStyle = '#ffffff'; c.fillRect(x, y, s, s);
  oct(s / 2); c.fill(); c.fillStyle = '#e8433d'; oct(s / 2 - 7); c.fill();
  txt(c, '정지', cx, cy - 9, 40, '#ffffff');
  txt(c, 'STOP', cx, cy + 27, 22, '#ffffff');
}
function drawMirror(c, x, y, s) {
  const cx = x + s / 2, cy = y + s / 2, R = s / 2;
  c.fillStyle = '#ff8a3c'; c.fillRect(x, y, s, s);
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, PI * 2); c.clip();
  const g = c.createLinearGradient(0, y, 0, y + s); g.addColorStop(0, '#9fd3f2'); g.addColorStop(.55, '#ffe9cf'); g.addColorStop(1, '#ffd4b0'); c.fillStyle = g; c.fillRect(x, y, s, s);
  // fish-eye houses curving in from both sides
  c.fillStyle = '#ffe0c2'; c.beginPath(); c.moveTo(x - 4, y + 8); c.quadraticCurveTo(x + 52, y + 30, x + 44, y + 104); c.lineTo(x - 4, y + s); c.fill();
  c.fillStyle = '#d7e6f6'; c.beginPath(); c.moveTo(x + s + 4, y + 14); c.quadraticCurveTo(x + s - 50, y + 36, x + s - 42, y + 104); c.lineTo(x + s + 4, y + s); c.fill();
  c.fillStyle = '#ff8f73'; c.beginPath(); c.moveTo(x - 4, y + 4); c.quadraticCurveTo(x + 50, y + 20, x + 56, y + 30); c.lineTo(x - 4, y + 20); c.fill();
  c.fillStyle = '#8fc9ef'; for (const [wx, wy] of [[12, 40], [26, 50], [12, 66], [28, 74]]) { roundRect(c, x + wx, y + wy, 9, 9, 2); c.fill(); }
  c.fillStyle = '#ffffff'; for (const [wx, wy] of [[s - 22, 46], [s - 36, 56], [s - 22, 72]]) { roundRect(c, x + wx, y + wy, 9, 9, 2); c.fill(); }
  // the road, a curving lane line, a post box, a little mochi crossing
  c.fillStyle = '#8a8190'; c.beginPath(); c.ellipse(cx, y + s + 18, R * 1.1, 58, 0, 0, PI * 2); c.fill();
  c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.setLineDash([8, 7]); c.beginPath(); c.moveTo(x + 18, y + s - 10); c.quadraticCurveTo(cx, y + 92, x + s - 18, y + s - 10); c.stroke(); c.setLineDash([]);
  c.fillStyle = '#ff4b4b'; roundRect(c, x + 30, y + 86, 10, 16, 3); c.fill();
  c.fillStyle = '#6cc46a'; blob(c, x + s - 34, y + 84, 9); blob(c, x + s - 26, y + 88, 7);
  mochi(c, cx + 4, y + 102, 10);
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.arc(cx, cy, R * .78, PI * 1.08, PI * 1.36); c.stroke();
  c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, R * .78, PI * 1.45, PI * 1.52); c.stroke();
  c.restore();
}
function drawManhole(c, x, y, s) {
  const cx = x + s / 2, cy = y + s / 2, R = s / 2;
  c.fillStyle = '#7a758c'; c.fillRect(x, y, s, s);
  c.strokeStyle = '#5f5a73'; c.lineWidth = 3; for (const r of [R - 5, R * .6]) { c.beginPath(); c.arc(cx, cy, r, 0, PI * 2); c.stroke(); }
  c.fillStyle = '#8d88a1'; for (let i = 0; i < 18; i++) { const a = i / 18 * PI * 2, r = R * .8; c.save(); c.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); c.rotate(a); roundRect(c, -6, -4, 12, 8, 2.5); c.fill(); c.restore(); }
  bear(c, cx, cy + 5, 22, '#9b96b0', '#4b465e', '#b3aec6');
  txt(c, '우수', cx, cy - 28, 11, '#c9c5d8');
  c.fillStyle = '#4b465e'; for (const sx of [-1, 1]) { roundRect(c, cx + sx * (R - 14) - 5, cy - 2, 10, 4, 2); c.fill(); }
}
function drawCat(c, x, y, w, h) {
  c.fillStyle = '#ffd23f'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#2a1d33'; c.lineWidth = 5; roundRect(c, x + 5, y + 5, w - 10, h - 10, 10); c.stroke();
  const cx = x + w / 2, cy = y + 50;
  c.fillStyle = '#2a1d33'; catHead(c, cx, cy, 25);
  c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(cx - 9, cy - 2, 4.5, 6, 0, 0, PI * 2); c.fill(); c.beginPath(); c.ellipse(cx + 9, cy - 2, 4.5, 6, 0, 0, PI * 2); c.fill();
  c.fillStyle = '#ff9fb5'; blob(c, cx, cy + 8, 2.6);
  c.strokeStyle = '#ffd23f'; c.lineWidth = 1.4;
  for (const sx of [-1, 1]) for (const k of [-1, 1]) { c.beginPath(); c.moveTo(cx + sx * 10, cy + 9 + k * 2); c.lineTo(cx + sx * 24, cy + 7 + k * 5); c.stroke(); }
  txt(c, '고양이', cx, y + 91, 22, '#2a1d33');
  txt(c, '주의', cx, y + 112, 20, '#2a1d33');
}
function drawAd(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffcfdc'); g.addColorStop(1, '#fff3e4'); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(255,255,255,.55)'; for (const [dx, dy, r] of [[18, 48, 10], [108, 70, 14], [20, 140, 8], [104, 132, 6]]) blob(c, x + dx, y + dy, r);
    txt(c, '버블티', x + w / 2, y + 24, 24, '#ff5a7a', { stroke: '#ffffff', sw: 5 });
    const cx = x + w / 2, cy = y + 100;
    c.fillStyle = '#ff7fa8'; c.save(); c.translate(cx + 8, cy - 52); c.rotate(.22); c.fillRect(-4, -26, 8, 40); c.restore();
    c.fillStyle = '#e8c49a'; c.beginPath(); c.moveTo(cx - 30, cy - 36); c.lineTo(cx + 30, cy - 36); c.lineTo(cx + 23, cy + 40); c.lineTo(cx - 23, cy + 40); c.closePath(); c.fill();
    c.strokeStyle = '#2a1d33'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#4a2e2a'; for (let k = 0; k < 6; k++) blob(c, cx - 17 + k * 7, cy + 33 - (k % 2) * 6, 4.2);
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(cx, cy - 37, 33, 9, 0, PI, 0); c.fill(); c.fillRect(cx - 33, cy - 38, 66, 4);
    c.fillStyle = '#2a1d33'; blob(c, cx - 10, cy - 6, 3); blob(c, cx + 10, cy - 6, 3);
    c.fillStyle = '#ff9fb5'; blob(c, cx - 17, cy + 2, 4); blob(c, cx + 17, cy + 2, 4);
    c.strokeStyle = '#2a1d33'; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy - 2, 4, .3, PI - .3); c.stroke();
    mochi(c, x + 26, y + 152, 13);
    const bx = x + w - 30, by = y + h - 50;
    c.fillStyle = '#ffd23f'; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2, r = i % 2 ? 17 : 23; c[i ? 'lineTo' : 'moveTo'](bx + Math.cos(a) * r, by + Math.sin(a) * r); } c.closePath(); c.fill();
    txt(c, '1+1', bx, by + 1, 15, '#ff5a4a');
    c.fillStyle = '#ff7fa8'; c.fillRect(x, y + h - 20, w, 20);
    txt(c, '새로 나왔어요!', x + w / 2, y + h - 10, 11, '#ffffff');
  });
}
function drawMenu(c, x, y, w, h) {
  c.fillStyle = '#34443c'; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(255,255,255,.05)'; for (const [dx, dy, r] of [[20, 40, 18], [70, 100, 22], [30, 150, 14]]) blob(c, x + dx, y + dy, r);
  txt(c, '메뉴', x + w / 2, y + 18, 19, '#ffe9a8');
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 14, y + 31); c.lineTo(x + w - 14, y + 31); c.stroke();
  [['떡볶이', '3000'], ['오뎅', '1000'], ['순대', '3000'], ['튀김', '500']].forEach(([a, b], i) => {
    txt(c, a, x + 8, y + 48 + i * 25, 14, '#ffffff', { align: 'left' });
    txt(c, b, x + w - 7, y + 48 + i * 25, 11, '#ffc7d8', { align: 'right' });
  });
  const kx = x + w - 26, ky = y + h - 22;
  c.strokeStyle = '#ffffff'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(kx, ky, 11, 9, 0, 0, PI * 2); c.stroke();
  c.beginPath(); c.moveTo(kx - 10, ky - 4); c.lineTo(kx - 8, ky - 14); c.lineTo(kx - 3, ky - 8); c.moveTo(kx + 10, ky - 4); c.lineTo(kx + 8, ky - 14); c.lineTo(kx + 3, ky - 8); c.stroke();
  c.fillStyle = '#ffffff'; blob(c, kx - 4, ky - 1, 1.3); blob(c, kx + 4, ky - 1, 1.3);
  txt(c, '♥', x + 20, y + h - 20, 12, '#ff9fb5');
}
function drawTteok(c, x, y, w, h) {
  c.fillStyle = '#fff3dc'; c.fillRect(x, y, w, h);
  c.strokeStyle = '#ff5a4a'; c.lineWidth = 3; roundRect(c, x + 3, y + 3, w - 6, h - 6, 9); c.stroke();
  txt(c, '떡볶이', x + w / 2 - 6, y + h / 2 + 1, 32, '#ff4a3a');
  bear(c, x + w - 30, y + h / 2 + 3, 13);
  c.fillStyle = '#ff4a3a'; blob(c, x + 27, y + h / 2, 15);
  txt(c, '분식', x + 27, y + h / 2 + 1, 11, '#ffffff');
}
function drawPost(c, x, y, w, h) {
  c.fillStyle = tint(RED); c.fillRect(x, y, w, h);
  c.fillStyle = '#ffffff'; roundRect(c, x + 7, y + 12, 30, 22, 3); c.fill();
  c.strokeStyle = tint(RED); c.lineWidth = 2; c.beginPath(); c.moveTo(x + 8, y + 13); c.lineTo(x + 22, y + 25); c.lineTo(x + 36, y + 13); c.stroke();
  txt(c, 'POST', x + 66, y + 18, 18, '#ffffff');
  txt(c, '우편', x + 66, y + 36, 11, '#ffe1e1');
}
function drawShip(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#ffffff'; c.fillRect(x, y, w, h);
    c.fillStyle = '#ffc23d'; c.fillRect(x, y, w, 18); txt(c, '택배', x + 24, y + 10, 13, '#8a5a2e');
    c.fillStyle = '#c98a52'; blob(c, x + w - 14, y + 9, 6); blob(c, x + w - 19, y + 4, 2.5); blob(c, x + w - 9, y + 4, 2.5);
    c.fillStyle = '#d9d4cc'; for (let i = 0; i < 3; i++) c.fillRect(x + 8, y + 26 + i * 9, i === 2 ? 50 : 76, 4);
    c.fillStyle = '#2a1d33'; for (let i = 0; i < 26; i++) { const bw = (i * 7) % 3 + 1; c.fillRect(x + 8 + i * 3.2, y + 58, bw, 16); }
    c.save(); c.translate(x + 104, y + 52); c.rotate(-.25); c.strokeStyle = '#ff5a5a'; c.lineWidth = 2; c.strokeRect(-18, -9, 36, 18); txt(c, '빠른', 0, 1, 11, '#ff5a5a'); c.restore();
  });
}
function drawStopName(c, x, y, w, h) {
  c.fillStyle = '#2f6fd6'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ffffff'; roundRect(c, x + 8, y + 9, 26, 19, 4); c.fill();
  c.fillStyle = '#2f6fd6'; c.fillRect(x + 11, y + 12, 8, 6); c.fillRect(x + 22, y + 12, 8, 6);
  c.fillStyle = '#ffffff'; blob(c, x + 14, y + 31, 3); blob(c, x + 28, y + 31, 3);
  txt(c, '몽글동 정류장', x + 98, y + h / 2 + 1, 18, '#ffffff');
  c.fillStyle = '#3fb36a'; blob(c, x + w - 20, y + h / 2, 13);
  txt(c, '12', x + w - 20, y + h / 2 + 1, 14, '#ffffff');
}
function drawPoster(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#fff6e2'; c.fillRect(x, y, w, h);
    c.fillStyle = '#ff5a4a'; c.fillRect(x, y, w, 20);
    txt(c, 'おにぎり', x + w / 2, y + 11, 14, '#ffffff');
    const cx = x + w / 2, cy = y + 56;
    c.fillStyle = '#ffffff'; c.strokeStyle = '#2a1d33'; c.lineWidth = 2; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(cx, cy - 24); c.quadraticCurveTo(cx + 4, cy - 26, cx + 26, cy + 14); c.quadraticCurveTo(cx + 28, cy + 20, cx + 20, cy + 20); c.lineTo(cx - 20, cy + 20); c.quadraticCurveTo(cx - 28, cy + 20, cx - 26, cy + 14); c.quadraticCurveTo(cx - 4, cy - 26, cx, cy - 24); c.fill(); c.stroke();
    c.fillStyle = '#2f3a2c'; c.fillRect(cx - 11, cy + 3, 22, 17);
    c.fillStyle = '#2a1d33'; blob(c, cx - 7, cy - 4, 2); blob(c, cx + 7, cy - 4, 2);
    c.fillStyle = '#ff9fb5'; blob(c, cx - 12, cy, 2.6); blob(c, cx + 12, cy, 2.6);
    txt(c, '100円', cx, y + h - 18, 22, '#ff5a4a', { stroke: '#ffffff', sw: 3 });
  });
}
function drawTomato(c, x, y, w, h) {
  c.fillStyle = tint(KRAFT2); c.fillRect(x, y, w, h);
  c.fillStyle = '#ff5a4a'; blob(c, x + w / 2, y + 28, 17);
  c.fillStyle = 'rgba(255,255,255,.5)'; blob(c, x + w / 2 - 7, y + 22, 4);
  c.fillStyle = '#4ea85a'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 - HP, r = i % 2 ? 3 : 9; c[i ? 'lineTo' : 'moveTo'](x + w / 2 + Math.cos(a) * r, y + 13 + Math.sin(a) * r * .6); } c.closePath(); c.fill();
  txt(c, '토마토', x + w / 2, y + 54, 12, '#7a4a22');
}
function drawHazard(c, x, y, w, h) {
  clip(c, x, y, w, h, () => {
    c.fillStyle = '#ffd23f'; c.fillRect(x, y, w, h);
    c.fillStyle = '#2f2b3a'; for (let k = -1; k < w / 12 + 1; k++) { c.beginPath(); c.moveTo(x + k * 12, y + h); c.lineTo(x + k * 12 + 6, y + h); c.lineTo(x + k * 12 + 6 + h, y); c.lineTo(x + k * 12 + h, y); c.closePath(); c.fill(); }
  });
}
function drawNobori(c, x, y, w, h) {
  c.fillStyle = '#e8433d'; c.fillRect(x, y, w, h);
  c.fillStyle = '#ffffff'; c.fillRect(x, y, w, 9); c.fillRect(x + w - 6, y + 9, 3, h - 9);
  ['か', 'ら', 'あ', 'げ'].forEach((s, i) => txt(c, s, x + w / 2 - 2, y + 26 + i * 23, 20, '#ffffff'));
  c.fillStyle = '#ffd23f'; blob(c, x + w / 2 - 2, y + h - 12, 5);
}
const atlas = () => tex('st-atlas|' + STYLE.mode, 1024, 1024, c => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, AT, AT);
  drawSign(c, 0, 0, 512, 68);
  drawStop(c, 0, 72, 128); drawMirror(c, 128, 72, 128); drawManhole(c, 256, 72, 128); drawCat(c, 384, 72, 112, 128);
  drawAd(c, 0, 204, 128, 192); drawMenu(c, 128, 204, 96, 176); drawTteok(c, 224, 204, 224, 48);
  // ATM / 취급주의 / house number / OPEN stickers
  c.fillStyle = '#2f7fd8'; roundRect(c, 449, 205, 62, 30, 6); c.fill(); txt(c, 'ATM', 480, 221, 20, '#ffffff');
  c.fillStyle = '#ffffff'; c.fillRect(448, 240, 64, 32); c.strokeStyle = '#ff4b4b'; c.lineWidth = 2.5; c.strokeRect(450, 242, 60, 28); txt(c, '취급주의', 480, 257, 13, '#ff4b4b');
  c.fillStyle = '#33406a'; c.fillRect(448, 276, 64, 32); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.strokeRect(451, 279, 58, 26); txt(c, '101', 480, 293, 20, '#ffffff');
  c.fillStyle = '#ffffff'; roundRect(c, 448, 316, 64, 40, 7); c.fill(); c.strokeStyle = '#ff5a4a'; c.lineWidth = 2.5; roundRect(c, 450, 318, 60, 36, 6); c.stroke();
  txt(c, 'OPEN', 480, 330, 15, '#ff5a4a'); txt(c, '24시간', 480, 346, 11, '#3f9be0');
  drawPost(c, 224, 256, 96, 48); drawShip(c, 320, 256, 128, 80); drawStopName(c, 224, 340, 192, 40);
  drawTomato(c, 224, 384, 64, 64);
  c.fillStyle = '#ffffff'; c.fillRect(288, 384, 64, 32); c.fillStyle = '#ff5a4a'; c.fillRect(288, 384, 10, 32); txt(c, 'ツナマヨ', 325, 401, 12, '#2a1d33');
  c.fillStyle = '#fff0f4'; c.fillRect(352, 384, 112, 32); c.fillStyle = '#ff9fb5'; c.fillRect(352, 384, 112, 4); c.fillRect(352, 412, 112, 4);
  txt(c, '버블티', 408, 401, 15, '#ff5a7a'); c.fillStyle = '#4a2e2a'; for (const dx of [12, 22, 90, 100]) blob(c, 352 + dx, 400, 3.2);
  drawNobori(c, 464, 384, 40, 128); drawHazard(c, 0, 400, 128, 16); drawPoster(c, 128, 400, 96, 104);
}, { text: true });
const atlasMat = () => mat('#ffffff', { map: atlas() });
const signMat = () => mat('#ffffff', { map: atlas(), emissive: '#ffffff', ei: .16 });
const mirrorMat = () => mat('#ffffff', { map: atlas(), emissive: '#ffffff', ei: .22 });
const glassMat = () => mat('#cdeffa', { opacity: .2 });
const litMat = () => mat('#fffdf6', { emissive: '#fff4dc', ei: .45 });
const bulbMat = () => mat('#fff3c4', { emissive: '#ffcf6b', ei: .9 });
// chunky bricks for the gate post (world-sized through planarUV)
const brickTex = c1 => tex('st-brick|' + c1, 128, 128, (c, w, h) => {
  c.fillStyle = '#efe2d0'; c.fillRect(0, 0, w, h);
  const cols = [tint(c1), tint(shade(c1, .05)), tint(shade(c1, -.04)), tint(shade(c1, .09))];
  for (let r = 0; r < 4; r++) for (let k = -1; k < 3; k++) {
    const bx = k * 32 + (r % 2) * 16, by = r * 16;
    c.fillStyle = cols[(r * 3 + k + 4) % 4]; roundRect(c, bx + 1.2, by + 1.2, 29.6, 13.6, 2.4); c.fill();
  }
}, { repeat: [1, 1] });
const transparent = o => { o.castShadow = false; return o; };

const B = {};
// (10/29 사용자 "허접한 건 디벨롭" — 19판부터만: 1~18판은 그대로, map-41-55-gate19가 두는 판 번호)
const LATE19 = () => (globalThis.__sbkStage ?? -1) >= 18;

// ═════════════════════════════════════════════ STOREFRONTS ═════════════════════════════════════════════
// 편의점 (2×1, against the back): a 24h konbini front — striped sign band with the bear mascot, a big window onto
// shelves of snacks and bottles, a sliding glass door (an onigiri poster on it) that slides open onto a snack rack, an ATM
// sticker, a window ledge outside, a からあげ nobori flag, an umbrella stand and a doormat; a cat naps on the roof.
B.konbini = (f, T) => {
  const shop = col(T, 'shop'), acc = col(T, 'accent'), wood = col(T, 'wood'), tk = [shop, acc, wood].join(','), KICK = '#6f7a92';
  const W = 1.96, z0 = -.5, fz = .2, H = 2.0, fl = .06, gy = .35, gt = 1.68, dx = .32, dz = .09, DW = .6, DH = 1.6;
  const gh = gt - gy, gyc = (gy + gt) / 2;
  f.add(mc('konbini|' + tk, ({ add, tube }) => {
    add(G.box(W - .03, fl, .755, .012), '#e6dfd4', 0, fl / 2, -.1175);                            // tiled floor + front step
    add(G.box(W - .12, H, .06, .015), '#fffaf0', 0, H / 2, z0 + .03);
    for (const sx of [-1, 1]) add(G.box(.08, H, fz - z0, .015), shop, sx * (W / 2 - .04), H / 2, (z0 + fz) / 2);
    // shop front: kick panels, a window ledge, aluminium mullions, a header, the sign band and the roof
    add(G.box(.875, gy - fl, .06, .012), KICK, -.4825, (gy + fl) / 2, .17);
    add(G.box(.235, gy - fl, .06, .012), KICK, .8025, (gy + fl) / 2, .17);
    for (const sx of [-1, 1]) add(G.box(.088, .07, fz - z0 + .004, .012), KICK, sx * (W / 2 - .04), .035, (z0 + fz) / 2 + .004);
    add(G.box(.92, .03, .14, .01), wood, -.48, gy, .215);
    for (const x of [-.02, .66]) add(G.box(.05, gt - fl, .06, .012), ALU, x, (gt + fl) / 2, .17);
    add(G.box(W - .18, .1, .08, .012), ALU, 0, gt + .05, .16);
    add(G.box(W + .04, .3, .12, .02), WHITE, 0, gt + .1 + .15, .2);
    for (const sx of [-1, 1]) for (const [y, h, c] of [[1.993, .042, '#ff9a3c'], [1.9455, .023, '#ff5a4a'], [1.8975, .042, '#3f9be0']]) add(G.pbox(.006, h, .1), c, sx * (W / 2 + .02 + .003), y, .2);
    add(G.box(W + .06, .06, .78, .02), acc, 0, gt + .4 + .03, -.115);
    // inside, left: a gondola of snacks, cup noodles and bottles
    const sx0 = -.88, sx1 = -.1, gz = -.28;
    for (const x of [sx0, sx1]) add(G.box(.02, 1.45, .28, .006), WHITE, x, fl + .725, gz);
    const SH = [.3, .68, 1.06, 1.44];
    for (const y of SH) { add(G.box(sx1 - sx0, .025, .26, .006), WHITE, (sx0 + sx1) / 2, y, gz); add(G.pbox(sx1 - sx0, .03, .006), SKY, (sx0 + sx1) / 2, y - .002, gz + .13 + .003); }
    const pal = [TOMATO, MUSTARD, SKY, MINT, CORAL, LILAC];
    for (let k = 0; k < 6; k++) {
      const x = sx0 + .07 + k * .128;
      add(G.box(.1, .17, .07, .03), pal[k], x, SH[0] + .0125 + .085, gz + .02, 0, 0, (k % 2 ? .06 : -.06));
      add(G.cyl(.042, .034, .09, 12), WHITE, x, SH[1] + .0125 + .045, gz + .02); add(G.cyl(.045, .045, .008, 12), pal[(k + 2) % 6], x, SH[1] + .0125 + .094, gz + .02);
      add(G.cyl(.026, .026, .15, 10), pal[(k + 4) % 6], x - .025, SH[2] + .0125 + .075, gz); add(G.cyl(.026, .026, .15, 10), pal[(k + 1) % 6], x + .03, SH[2] + .0125 + .075, gz + .03);
      add(G.cyl(.012, .012, .03, 8), WHITE, x - .025, SH[2] + .0125 + .165, gz); add(G.cyl(.012, .012, .03, 8), WHITE, x + .03, SH[2] + .0125 + .165, gz + .03);
    }
    // inside, right: an open drinks cooler behind the snack rack
    const fx0 = .08, fx1 = .62, fzc = -.345;
    for (const x of [fx0 + .01, fx1 - .01]) add(G.box(.02, 1.44, .25, .006), WHITE, x, fl + .72, fzc);
    add(G.box(fx1 - fx0, .08, .25, .01), MINT, (fx0 + fx1) / 2, fl + 1.44 + .04, fzc);
    for (const [j, y] of [.6, .95, 1.3].entries()) {
      add(G.pbox(fx1 - fx0 - .04, .02, .22), '#dbe9f2', (fx0 + fx1) / 2, y, fzc);
      for (let k = 0; k < 6; k++) { const x = fx0 + .07 + k * .08; add(G.cyl(.028, .028, .15, 10), pal[(k + j * 2) % 6], x, y + .01 + .075, fzc - .02); add(G.cyl(.014, .014, .03, 8), WHITE, x, y + .01 + .165, fzc - .02); }
    }
    // the snack rack just behind the door (the hiding shelf is its bottom one)
    const rx = .32, rz = -.035;
    for (const x of [.085, .555]) add(G.box(.025, .5, .18, .006), WHITE, x, fl + .25, rz);
    for (const y of [.13, .44]) add(G.box(.47, .02, .18, .006), WHITE, rx, y, rz);
    add(G.pbox(.455, .46, .015), '#f1f6fa', rx, fl + .25, rz - .075);
    for (const [x, c, rz2] of [[.16, '#ffd23f', .1], [.3, TOMATO, -.08], [.44, SKY, .05]]) {
      add(G.box(.11, .15, .05, .025), c, x, .45 + .075, rz - .02, 0, 0, rz2);
      for (const dy of [-.064, .064]) add(G.box(.112, .03, .055, .006), shade(c, -.12), x, .45 + .075 + dy, rz - .02, 0, 0, rz2);
    }
    add(G.box(.1, .07, .1, .012), MINT, .5, .14 + .035, rz);
    // umbrella stand with two umbrellas, a doormat
    const ux = .82, uz = .36;
    add(G.cyl(.075, .07, .28, 16), '#6d7488', ux, .14, uz);
    add(G.tor(.075, .01, PI * 2, 4, 18), STEEL, ux, .28, uz, HP);
    for (const [ox, oz, c, lean] of [[-.025, -.01, TOMATO, .12], [.025, .015, '#4f9be8', -.1]]) {
      add(G.cyl(.032, .022, .16, 10), c, ux + ox, .32, uz + oz, 0, 0, lean);
      tube([ux + ox - lean * .07, .39, uz + oz], [ux + ox - lean * .3, .62, uz + oz], .008, STEEL2, 6);
      add(G.tor(.035, .011, PI, 4, 10), BROWN, ux + ox - lean * .3 - .035, .62, uz + oz);
    }
    add(G.box(.56, .014, .18, .005), '#5fbf7a', dx, .007, .37);
    add(G.box(.48, .004, .11, .002), '#8fdb9f', dx, .016, .37);
    // nobori flag (からあげ) on a weighted pole
    add(G.cyl(.065, .075, .08, 14), CHAR, -.9, .04, .4);
    tube([-.9, .08, .4], [-.9, 1.66, .4], .012, WHITE, 6);
    tube([-.9, 1.64, .4], [-.71, 1.64, .4], .008, WHITE, 6);
    add(G.pbox(.17, .54, .006), '#e8433d', -.81, 1.37, .394);
    // roof: a planter and a sleepy cat
    add(G.box(.7, .14, .22, .03), wood, -.5, gt + .43 + .07, -.3);
    for (let k = 0; k < 6; k++) add(G.sph(.075, 10, 8), k % 2 ? LEAF : LEAF2, -.78 + k * .11, gt + .58 + (k % 2) * .03, -.3 + (k % 3 - 1) * .04);
    // a ginger cat curled up asleep on the roof, its face toward the street (22판 실폰 10/21, user: "아 고양이 왜 이래 ㅠ" — it read
    // as two flat discs and sticks): one round loaf of a body, soft stripes on its back, the head tucked down on its front paws,
    // eyes shut, the tail wrapped round the front to its chin — the same soft round toy look as the characters' cats
    const cx = .4, cz = -.22, cy = gt + .46, k = 1.45, cat = ORANGE, catD = shade(ORANGE, -.2), P = (x, y, z) => [cx + x * k, cy + y * k, cz + z * k];
    add(G.sph(.1 * k, 18, 12), cat, ...P(0, .072, 0), 0, 0, 0, [1.3, .82, 1.1]);
    for (const [x, rz] of [[-.07, .45], [-.02, .12], [.03, -.2]]) add(G.sph(.032 * k, 10, 6), catD, ...P(x, .146 - Math.abs(x) * .3, -.01), 0, 0, rz, [.55, .22, 1.9]);
    // the front paws, the head resting on them
    for (const x of [.05, .13]) { add(G.sph(.028 * k, 10, 8), cat, ...P(x, .022, .12), 0, 0, 0, [1, .8, 1.3]); add(G.sph(.016 * k, 8, 6), WHITE, ...P(x, .016, .148), 0, 0, 0, [1.3, .8, 1]); }
    const HD = P(.1, .1, .08), hk = .082 * k;
    add(G.sph(hk, 16, 12), cat, ...HD, 0, 0, 0, [1.12, .92, 1]);
    for (const s2 of [-1, 1]) {
      const ex = HD[0] + s2 * .05 * k, ey = HD[1] + .078 * k, ez = HD[2] - .008;
      add(G.cone(.034 * k, .065 * k, 8), cat, ex, ey, ez, -.1, 0, -s2 * .32);
      add(G.cone(.018 * k, .036 * k, 6), CORAL, ex - s2 * .002, ey - .006, ez + .016, -.1, 0, -s2 * .32);
      add(G.tor(.015 * k, .005 * k, PI, 3, 8), INK, HD[0] + s2 * .031 * k, HD[1] + .006, HD[2] + .074 * k, 0, 0, PI);
    }
    add(G.sph(.037 * k, 10, 8), WHITE, HD[0], HD[1] - .028 * k, HD[2] + .06 * k, 0, 0, 0, [1.25, .7, .6]);
    add(G.sph(.01 * k, 6, 4), CORAL, HD[0], HD[1] - .01 * k, HD[2] + .083 * k);
    for (const s2 of [-1, 1]) add(G.sph(.014 * k, 8, 6), BLUSH, HD[0] + s2 * .05 * k, HD[1] - .018 * k, HD[2] + .06 * k, 0, 0, 0, [1, .6, .4]);
    // the tail: from the back round the left side to the chin, a thick soft tube, the tip a shade darker
    const T0 = [[-.1, .02, -.08], [-.135, .02, -.01], [-.12, .02, .07], [-.06, .02, .115], [.01, .02, .128]].map(q => P(...q));
    for (let n = 0; n < T0.length - 1; n++) { tube(T0[n], T0[n + 1], .018 * k, n < T0.length - 2 ? cat : catD, 8); add(G.sph(.018 * k, 10, 8), n < T0.length - 2 ? cat : catD, ...T0[n + 1]); }
  }));
  // (10/29 "허접한 건 디벨롭": turned round, the shop's back was one blank cream board) 19판부터 the staff side — siding seams, a
  // steel back door under a little canopy and lamp, an exhaust vent, the gas meter and its yellow pipe, a drainpipe, two drink crates
  if (LATE19()) f.add(mc('konbini-back', ({ add, tube }) => {
    const bz = z0 - .004;
    for (let k = 1; k < 8; k++) add(G.pbox(W - .14, .014, .008), '#ece3d3', 0, k * .25, bz);
    add(G.box(.6, 1.6, .04, .012), '#8f98ad', .42, .8, bz - .016); add(G.pbox(.5, 1.46, .006), '#b4bccd', .42, .82, bz - .039);
    add(G.pbox(.4, .006, .006), '#8f98ad', .42, 1.1, bz - .043); add(G.box(.035, .16, .045, .01), CHAR, .2, .86, bz - .05);
    add(G.box(.76, .04, .24, .015), '#6f7a92', .42, 1.72, bz - .12); for (const sx of [-1, 1]) tube([.42 + sx * .34, 1.7, bz - .22], [.42 + sx * .34, 1.82, bz - .01], .008, STEEL2, 5);
    add(G.sph(.045, 10, 8), '#fff2c2', .42, 1.64, bz - .07, 0, 0, 0, [1, .7, 1]); add(G.cyl(.05, .05, .02, 12), STEEL2, .42, 1.68, bz - .07);
    add(G.box(.34, .26, .07, .015), ALU, -.42, 1.62, bz - .035); for (let k = 0; k < 4; k++) add(G.pbox(.28, .02, .01), DARK, -.42, 1.53 + k * .06, bz - .072);
    add(G.box(.18, .24, .1, .02), '#ece8de', -.72, .95, bz - .05); add(G.cyl(.04, .04, .01, 14), '#ffffff', -.72, 1.0, bz - .102, HP, 0, 0);
    tube([-.72, .83, bz - .05], [-.72, .08, bz - .05], .016, '#f2c94c', 6); tube([-.72, 1.07, bz - .05], [-.72, 2.0, bz - .05], .016, '#f2c94c', 6);
    tube([-.9, 2.05, bz - .04], [-.9, .04, bz - .04], .03, STEEL2, 8); add(G.box(.12, .03, .1, .01), STEEL2, -.9, .03, bz - .08);
    for (const [y, c] of [[.15, '#4f86d9'], [.43, '#e8605a']]) { add(G.box(.42, .26, .3, .02), c, -.2, y, bz - .2); for (const sx of [-1, 1]) add(G.pbox(.1, .05, .31), shade(c, -.25), -.2 + sx * .13, y + .06, bz - .2); }
  }));
  // the lit back walls inside (a 24h store glows)
  f.add(mg('konbini-lit', litMat(), ({ add }) => {
    add(new THREE.PlaneGeometry(.78, 1.45), -.49, fl + .725, -.405);
    add(new THREE.PlaneGeometry(.5, 1.38), .35, fl + .69, -.435);
  }));
  f.add(transparent(mg('konbini-glass', glassMat(), ({ add }) => {
    add(new THREE.PlaneGeometry(.875, gh), -.4825, gyc, .185);
    add(new THREE.PlaneGeometry(.235, gh), .8025, gyc, .185);
  })));
  f.add(mg('konbini-sign', signMat(), ({ add }) => add(quadGeo(W, .26, RG.sign), 0, gt + .25, .26 + .005)));
  f.add(mg('konbini-prints', atlasMat(), ({ add }) => {
    add(quadGeo(.24, .15, RG.open), -.22, 1.46, .185 + .006);
    add(quadGeo(.2, .1, RG.atm), .8025, 1.1, .185 + .006);
    add(quadGeo(.16, .512, RG.nobori), -.81, 1.37, .394 + .003 + .005);
  }));
  // the sliding door (its own mesh): slides left behind the window
  const dv = new THREE.Group(); dv.position.set(dx, fl, dz);
  dv.add(mc('konbini-door', ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.045, DH, .03, .01), ALU, sx * (DW / 2 - .0225), DH / 2, 0);
    add(G.box(DW, .05, .03, .01), ALU, 0, DH - .025, 0);
    add(G.box(DW, .1, .03, .01), ALU, 0, .05, 0);
    add(G.box(.024, .42, .024, .008), STEEL2, -DW / 2 + .09, .85, .03);
    for (const y of [.66, 1.04]) add(G.box(.02, .02, .03, .005), STEEL2, -DW / 2 + .09, y, .016);
  }));
  dv.add(transparent(mg('konbini-doorglass', glassMat(), ({ add }) => add(new THREE.PlaneGeometry(DW - .09, DH - .15), 0, .1 + (DH - .15) / 2, 0))));
  dv.add(mg('konbini-poster', atlasMat(), ({ add }) => add(quadGeo(.46, .5, RG.poster), 0, .55, .006)));
  f.add(dv);
  const p = f.part('slide', dv, (t, b) => { dv.position.x = b.p.x - .6 * t; }, { label: '편의점 문', sfx: 'drawer', dur: .36 });
  f.spot('inside', null, .3, .14, -.03, { part: p, maxH: .29, label: '편의점 과자 선반', scale: .75 });
  f.spot('on', null, -.62, gy + .015, .225, { maxH: .45, label: '편의점 창턱', scale: .7 });
};

// 떡볶이 포장마차 (2×1): a cream cart under a red awning with a 떡볶이 sign and warm bulbs — a pan of tteokbokki, a tray of
// fish-cake skewers, a lidded 순대 pot (the lid lifts), paper cups and sauce bottles; a crate on the low shelf, a gas
// bottle, and a chalk menu board standing out front.
B.tteokstall = (f, T) => {
  const aw = col(T, 'awning'), st = col(T, 'stall'), woodD = col(T, 'woodD'), tk = [aw, st, woodD].join(',');
  const cx = -.14, CW = 1.44, cz = -.08, CD = .56, CT = .82, fzc = cz + CD / 2;
  const PX = -.52, OX = .02, KX = .38, KZ = -.06, KR = .145, KB = CT + .04, KH = .245, MX = .78, VY = 1.88;
  const M1 = xf(MX, .3, .2, -.17, 0, 0), M2 = xf(MX, .3, .1, .17, 0, 0);
  const CAN = xf(0, 2.1, -.01, .25, 0, 0);
  f.add(mc('tteokstall|' + tk, ({ add, addM, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = cx + sx * (CW / 2 - .05), z = cz + sz * (CD / 2 - .05); tube([x, 0, z], [x, .45, z], .022, STEEL2, 8); }
    add(G.box(CW - .04, .03, CD - .04, .01), '#d9dee8', cx, .13, cz);
    add(G.box(CW, .34, CD, .02), st, cx, .61, cz);
    add(G.pbox(CW - .06, .05, .006), aw, cx, .52, fzc + .003);
    add(G.pbox(CW - .06, .016, .006), aw, cx, .57, fzc + .003);
    add(G.box(CW + .04, .04, CD + .04, .012), '#e4e8f0', cx, .8, cz);
    // low shelf: a blue crate of bottles
    add(G.box(.36, .18, .3, .02), '#4f8fe0', cx - .45, .145 + .09, cz);
    for (const k of [-1, 0, 1]) add(G.pbox(.08, .1, .006), shade('#4f8fe0', -.15), cx - .45 + k * .11, .145 + .09, cz + .15 + .003);
    for (let k = 0; k < 4; k++) add(G.cyl(.022, .022, .05, 8), k % 2 ? '#4fb85a' : '#8fd47a', cx - .58 + k * .09, .145 + .2, cz - .05 + (k % 2) * .08);
    // tteokbokki pan
    add(G.box(.52, .02, .4, .006), STEEL, PX, CT + .01, cz);
    for (const sz of [-1, 1]) add(G.box(.52, .07, .02, .006), STEEL, PX, CT + .035, cz + sz * .19);
    for (const sx of [-1, 1]) add(G.box(.02, .07, .36, .006), STEEL, PX + sx * .25, CT + .035, cz);
    add(G.pbox(.48, .03, .36), SAUCE, PX, CT + .035, cz);
    for (const [x, z, r] of [[-.17, -.1, .4], [-.08, -.12, -.3], [.02, -.09, .9], [.13, -.11, .2], [-.15, 0, -.6], [-.05, .02, .5], [.07, 0, -.2], [.17, .03, .7], [-.12, .11, .1], [-.01, .12, -.8], [.1, .1, .35]])
      add(G.cap(.019, .085, 2, 6), '#ff7a4a', PX + x, CT + .052, cz + z, 0, r, HP);
    for (const [x, z, r] of [[-.02, -.03, .4], [.12, .06, -.5]]) add(G.box(.075, .016, .055, .006), '#f2b25f', PX + x, CT + .055, cz + z, .2, r, 0);
    for (const [x, z] of [[-.19, .06], [.18, -.06]]) add(G.sph(.032, 10, 8), '#f0b07a', PX + x, CT + .058, cz + z, 0, .5, 0, [1, .8, 1.25]);
    for (const [x, z] of [[-.1, -.04], [.05, .07], [.15, -.12], [-.2, -.12]]) add(G.cyl(.009, .009, .03, 6), LEAF, PX + x, CT + .052, cz + z, 0, x * 9, HP);
    // fish-cake (오뎅) tray with skewers standing in the broth
    for (const sz of [-1, 1]) add(G.box(.32, .12, .02, .006), STEEL, OX, CT + .06, cz + sz * .19);
    for (const sx of [-1, 1]) add(G.box(.02, .12, .36, .006), STEEL, OX + sx * .15, CT + .06, cz);
    add(G.pbox(.32, .02, .4), STEEL, OX, CT + .01, cz);
    add(G.pbox(.28, .02, .36), '#f0cf8a', OX, CT + .09, cz);
    for (const [ox, oz, lx, lz] of [[-.09, -.1, -.25, -.1], [0, -.12, .05, -.15], [.09, -.08, .2, -.1], [-.08, .06, -.2, .15], [.03, .08, .1, .2], [.1, .1, .25, .1]]) {
      const a = [OX + ox, CT + .085, cz + oz], b = [OX + ox + lx * .3, CT + .33, cz + oz + lz * .3];
      tube(a, b, .006, '#e6c48e', 5);
      const [L, m] = tubeM(a, b);
      for (let k = 0; k < 3; k++) addM(G.box(.07, .045, .02, .008), m.clone().multiply(xf(k % 2 ? .012 : -.012, -L / 2 + .05 + k * .038, 0, 0, 0, k % 2 ? .3 : -.3)), k % 2 ? '#e9ad5a' : '#f2be6e');
    }
    // the 순대 pot on its burner (the lid is a part)
    add(G.cyl(.12, .13, .04, 16), CHAR, KX, CT + .02, KZ);
    add(G.lathe([[0, 0], [KR - .015, 0], [KR, .02], [KR, KH - .02], [KR + .012, KH - .005], [KR + .008, KH], [KR - .012, KH - .004], [KR - .012, .035], [0, .035]], 24), ALU, KX, KB, KZ);
    add(G.cyl(KR - .02, KR - .02, .006, 20), '#9aa3b4', KX, KB + .038, KZ);
    for (const sx of [-1, 1]) add(G.box(.05, .02, .07, .008), CHAR, KX + sx * (KR + .02), KB + KH - .045, KZ);
    // paper cups, sauce bottles, a cup of picks
    for (let k = 0; k < 3; k++) add(G.cyl(.042, .032, .1, 14), WHITE, .5, CT + .05 + k * .022, .12);
    for (const [x, c] of [[-.22, TOMATO], [-.16, MUSTARD]]) { add(G.cyl(.03, .03, .13, 12), c, x, CT + .065, .12); add(G.cone(.018, .05, 8), c, x, CT + .155, .12); add(G.cyl(.006, .006, .02, 6), WHITE, x, CT + .19, .12); }
    add(G.cyl(.032, .028, .07, 12), MINT, .22, CT + .035, .14);
    for (const [dx2, dz2] of [[-.01, 0], [.012, .008], [0, -.01]]) tube([.22 + dx2, CT + .05, .14 + dz2], [.22 + dx2 * 3, CT + .14, .14 + dz2 * 3], .004, '#e6c48e', 4);
    // gas bottle on the left
    add(G.cyl(.075, .08, .02, 16), '#c9c4d6', -.91, .01, .3);
    add(G.cyl(.08, .08, .34, 16), '#f3f1ec', -.91, .19, .3);
    add(G.dome(.08, 16, 5), '#f3f1ec', -.91, .36, .3, 0, 0, 0, [1, .5, 1]);
    add(G.cyl(.02, .02, .05, 8), STEEL2, -.91, .42, .3);
    add(G.tor(.045, .01, PI * 2, 4, 14), STEEL2, -.91, .42, .3, HP);
    add(G.pbox(.1, .08, .006), TOMATO, -.91, .22, .3 + .08 + .003);
    // awning: four poles, a sloped red canopy with lighter stripes, a valance with scallops and a cream piping, bulbs
    for (const sx of [-1, 1]) { tube([sx * .95, 0, .43], [sx * .95, 1.98, .43], .022, STEEL2, 8); tube([sx * .95, 0, -.45], [sx * .95, 2.22, -.45], .022, STEEL2, 8); }
    addM(G.box(2.02, .03, .98, .01), CAN, aw);
    for (const x of [-.8, -.4, 0, .4, .8]) addM(G.pbox(.14, .006, .98), CAN.clone().multiply(xf(x, .018, 0)), shade(aw, .1));
    add(G.box(2.02, .24, .03, .008), aw, 0, VY, .48);
    for (let x = -.96; x < .97; x += .12) add(G.cyl(.06, .06, .022, 14), aw, x, VY - .12, .48, HP, 0, 0);
    add(G.box(2.02, .02, .04, .006), CREAM, 0, VY - .11, .48);
    for (const x of [-.75, -.25, .25, .75]) { tube([x, 1.98, .38], [x, 1.73, .38], .005, CHAR, 4); add(G.cyl(.018, .018, .04, 8), CHAR, x, 1.72, .38); }
    // menu board (A-frame)
    for (const M of [M1, M2]) addM(G.box(.32, .6, .025, .01), M, woodD);
    addM(G.box(.3, .025, .03, .006), xf(MX, .58, .15), woodD);
  }));
  f.add(mg('tteokstall-prints', atlasMat(), ({ add, addM }) => {
    add(quadGeo(1.0, .214, RG.tteok), -.12, VY + .01, .495 + .005);
    addM(quadGeo(.26, .48, RG.menu), M1.clone().multiply(xf(0, -.01, .0125 + .005)));
  }));
  f.add(mg('tteokstall-bulbs', bulbMat(), ({ add }) => { for (const x of [-.75, -.25, .25, .75]) add(new THREE.SphereGeometry(.036, 12, 8), x, 1.675, .38); }));
  // (the steam over the pan and the broth is ambient.js STEAM: it rises and thins — no frozen white balls, 10/21)
  const lid = new THREE.Group(); lid.position.set(KX, KB + KH + .004, KZ);
  lid.add(mc('tteokstall-lid', ({ add }) => {
    add(G.dome(KR + .018, 22, 5), ALU, 0, 0, 0, 0, 0, 0, [1, .32, 1]);
    add(G.cyl(.012, .016, .03, 8), CHAR, 0, .055, 0);
    add(G.sph(.026, 10, 8), CHAR, 0, .078, 0, 0, 0, 0, [1, .7, 1]);
  }));
  f.add(lid);
  const p = f.part('lift', lid, (t, b) => { lid.position.y = b.p.y + .26 * t; lid.position.z = b.p.z - .1 * t; lid.rotation.x = -.7 * t; }, { label: '순대 솥 뚜껑', sfx: 'lift' });
  f.spot('inside', null, KX, KB + .041, KZ, { part: p, maxH: .19, label: '순대 솥 안', scale: .6 });
  f.spot('under', null, cx + .25, .145, cz, { maxH: .27, label: '포장마차 아래 칸', scale: .8 });
  f.spot('behind', null, MX, 0, -.12, { maxH: .45, label: '메뉴판 뒤', scale: .75 });
};

// 빨간 플라스틱 의자 세트 (1×1): a round red plastic table (a plate of tteokbokki, a paper cup, chopsticks, pickled
// radish) and three red stools, one tucked half under the table.
B.redstools = (f, T) => {
  const red = col(T, 'stool'), tk = red, rd = shade(red, -.08);
  const TY = .5, TR = .28, tz = -.06;
  const stool = (add, tube, x, z, ry = 0) => {
    add(G.cyl(.13, .125, .035, 20), red, x, .3 - .0175, z);
    add(G.sph(.034, 10, 6), shade(red, -.28), x, .3, z, 0, ry, 0, [1, .14, .5]);
    for (let k = 0; k < 4; k++) { const a = ry + PI / 4 + k * HP; tube([x + Math.cos(a) * .07, .28, z + Math.sin(a) * .07], [x + Math.cos(a) * .115, 0, z + Math.sin(a) * .115], .028, red, 8); }
    add(G.tor(.095, .012, PI * 2, 4, 18), rd, x, .12, z, HP);
  };
  f.add(mc('redstools|' + tk, ({ add, tube }) => {
    add(G.cyl(TR, TR - .01, .03, 30), red, 0, TY + .015, tz);
    add(G.tor(TR, .016, PI * 2, 5, 30), rd, 0, TY + .015, tz, HP);
    add(G.cyl(.05, .05, .04, 12), rd, 0, TY - .02, tz);
    for (let k = 0; k < 4; k++) { const a = PI / 4 + k * HP; tube([Math.cos(a) * .06, TY - .02, tz + Math.sin(a) * .06], [Math.cos(a) * .24, 0, tz + Math.sin(a) * .24], .02, red, 8); add(G.sph(.026, 8, 6), rd, Math.cos(a) * .24, .012, tz + Math.sin(a) * .24); }
    add(G.tor(.165, .012, PI * 2, 4, 22), red, 0, .2, tz, HP);
    stool(add, tube, -.34, .22, .2); stool(add, tube, .34, .2, -.3); stool(add, tube, 0, -.36, 0);
    // on the table
    const top = TY + .03, px = -.06, pz = tz - .06;
    add(G.cyl(.11, .095, .016, 20), WHITE, px, top + .008, pz);
    add(G.cyl(.085, .085, .008, 18), SAUCE, px, top + .02, pz);
    for (const [x, z, r] of [[-.04, -.02, .3], [.02, .03, -.5], [.04, -.04, 1.1], [-.03, .04, -.2]]) add(G.cap(.016, .06, 2, 6), '#ff7a4a', px + x, top + .03, pz + z, 0, r, HP);
    add(G.cyl(.04, .032, .09, 14), WHITE, .14, top + .045, tz + .06);
    add(G.cyl(.0405, .0405, .02, 14), SKY, .14, top + .07, tz + .06);
    for (const dx of [-.008, .008]) add(G.box(.008, .008, .2, .002), '#e6c48e', .05 + dx, top + .004, tz + .15, 0, .25, 0);
    add(G.cyl(.05, .045, .014, 14), WHITE, .13, top + .007, tz - .1);
    for (const [x, z] of [[-.015, 0], [.015, .01], [0, -.018]]) add(G.box(.022, .016, .022, .004), '#ffe066', .13 + x, top + .022, tz - .1 + z, 0, x * 30, 0);
  }));
  f.spot('under', null, 0, 0, -.02, { maxH: .45, label: '빨간 탁자 밑', scale: .85 });
  f.spot('on', null, -.34, .3, .22, { maxH: .45, label: '빨간 의자 위', scale: .7 });
};

// ═════════════════════════════════════════════ STREET FURNITURE ═════════════════════════════════════════════
// 소화전 (1×1): an American red fire hydrant with steel caps on chains and a sleepy dot face, on a concrete pad.
B.hydrant = (f, T) => {
  const conc = col(T, 'concrete'), tk = conc, rd = shade(RED, -.1);
  const cz = .03;
  f.add(mc('hydrant|' + tk, ({ add }) => {
    add(G.box(.56, .04, .56, .012), conc, 0, .02, -.02);
    add(G.cyl(.15, .16, .05, 20), rd, 0, .065, cz);
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + .3; add(G.sph(.014, 6, 4), STEEL, Math.cos(a) * .135, .092, cz + Math.sin(a) * .135); }
    add(G.cyl(.108, .116, .4, 22), RED, 0, .29, cz);
    add(G.cyl(.135, .13, .035, 22), rd, 0, .5, cz);
    add(G.dome(.118, 22, 6), RED, 0, .517, cz, 0, 0, 0, [1, .75, 1]);
    add(G.cyl(.03, .04, .03, 12), rd, 0, .6, cz);
    add(G.cyl(.034, .038, .045, 5), STEEL2, 0, .63, cz);
    for (const sx of [-1, 1]) {
      add(G.cyl(.045, .045, .1, 14), RED, sx * .15, .36, cz, 0, 0, HP);
      add(G.cyl(.058, .058, .03, 14), STEEL, sx * .2, .36, cz, 0, 0, HP);
      add(G.cyl(.024, .028, .03, 5), STEEL2, sx * .225, .36, cz, 0, 0, HP);
      for (let k = 0; k < 3; k++) add(G.tor(.012, .004, PI * 2, 3, 8), STEEL2, sx * (.19 - k * .026), .3 - k * .01, cz + .06, 0, HP * (k % 2), 0);
    }
    add(G.cyl(.06, .062, .07, 16), RED, 0, .3, cz + .14, HP, 0, 0);
    add(G.cyl(.075, .075, .035, 16), STEEL, 0, .3, cz + .19, HP, 0, 0);
    add(G.cyl(.03, .034, .03, 5), STEEL2, 0, .3, cz + .22, HP, 0, 0);
    cylFace(add, 0, .44, cz, .109, 1);
    add(G.tor(.11, .012, PI * 2, 4, 22), CREAM, 0, .17, cz, HP);
  }));
  f.spot('behind', null, 0, .04, -.2, { maxH: .45, label: '소화전 뒤', scale: .8 });
};

// 정지 표지판 (1×1): an octagonal 정지 STOP sign on a white pole with a hazard sleeve, set in a concrete block.
B.stopsign = (f, T) => {
  const conc = col(T, 'concrete'), tk = conc;
  const SY = 1.74, R = .3, pz = -.08, bz = -.05, oct = octShape(R);
  f.add(mc('stopsign|' + tk, ({ add, tube }) => {
    add(G.box(.48, .03, .34, .01), shade(conc, -.08), 0, .015, bz);
    add(G.box(.44, .2, .3, .03), conc, 0, .11, bz);
    tube([0, .2, pz], [0, SY + .3, pz], .033, '#e3e7ee', 12);
    add(G.sph(.036, 10, 8), '#e3e7ee', 0, SY + .3, pz);
    for (let k = 0; k < 4; k++) add(G.cyl(.038, .038, .05, 12), k % 2 ? CHAR : YELLOW, 0, .235 + k * .05, pz);
    add(G.ext(oct, .024, 0, 1), '#e9edf3', 0, SY, pz + .037);
    for (const dy of [-.16, .16]) add(G.box(.09, .04, .05, .01), STEEL2, 0, SY + dy, pz + .015);
  }));
  // (10/29 19판부터) the back of the plate grey like a real sign's, with its clamp bracket and an inspection sticker
  if (LATE19()) f.add(mc('stopsign-back', ({ add }) => {
    add(G.ext(oct, .006, 0, 1), '#a9b0c0', 0, SY, pz + .03);
    add(G.box(.07, .44, .02, .008), STEEL2, 0, SY, pz + .022); for (const dy of [-.16, .16]) add(G.sph(.014, 8, 6), STEEL, .05, SY + dy, pz + .02);
    add(G.box(.09, .06, .006, .003), '#9fd7a8', -.14, SY - .12, pz + .028);
  }));
  f.add(mg('stopsign-face', atlasMat(), ({ addM, add }) => {
    addM(shapeAtlas(oct, R, RG.stop), xf(0, SY, pz + .061 + .005));
    add(quadGeo(.4, .05, RG.hazard), 0, .15, bz + .15 + .005);
  }));
  f.spot('behind', null, 0, 0, -.36, { maxH: .45, label: '정지 표지판 뒤', scale: .75 });
};

// 가로등 (1×1): a slate street lamp — a concrete plinth, a curved arm and a glowing bulb under a dome shade.
B.streetlamp = (f, T) => {
  const conc = col(T, 'concrete'), lamp = col(T, 'lamp'), tk = [conc, lamp].join(',');
  const pz = -.12, top = 2.36, AR = .22, hz = pz + AR + .1, hy = top + AR - .04, LH = .17;
  f.add(mc('streetlamp|' + tk, ({ add, tube }) => {
    add(G.box(.52, .16, .52, .03), conc, 0, .08, 0);
    add(G.cyl(.1, .125, .3, 16), lamp, 0, .31, pz);
    add(G.box(.07, .12, .02, .006), shade(lamp, .12), 0, .3, pz + .107);
    add(G.cyl(.034, .048, top - .46, 12), lamp, 0, (top + .46) / 2, pz);
    add(G.tor(.05, .014, PI * 2, 4, 16), shade(lamp, .12), 0, .62, pz, HP);
    add(G.tor(.04, .012, PI * 2, 4, 16), shade(lamp, .12), 0, 1.9, pz, HP);
    add(G.tor(AR, .026, HP, 6, 12), lamp, 0, top, pz + AR, 0, HP, 0);
    add(G.sph(.026, 8, 6), lamp, 0, top, pz);
    tube([0, top + AR, pz + AR], [0, top + AR, hz], .026, lamp, 8);
    add(G.sph(.03, 8, 6), lamp, 0, top + AR, hz);
    // lantern: a hex cap, warm glass between six posts, a little bottom finial
    add(G.cone(.13, .09, 6), lamp, 0, hy - .045, hz, 0, PI / 6, 0);
    add(G.cyl(.135, .135, .02, 6), shade(lamp, .14), 0, hy - .095, hz, 0, PI / 6, 0);
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; tube([Math.cos(a) * .092, hy - .1, hz + Math.sin(a) * .092], [Math.cos(a) * .07, hy - .1 - LH, hz + Math.sin(a) * .07], .008, lamp, 4); }
    add(G.cyl(.08, .05, .045, 6), lamp, 0, hy - .1 - LH - .02, hz, 0, PI / 6, 0);
    add(G.sph(.022, 8, 6), lamp, 0, hy - .1 - LH - .05, hz);
  }));
  f.add(mg('streetlamp-bulb', bulbMat(), ({ add }) => add(new THREE.CylinderGeometry(.086, .066, LH, 6), 0, hy - .1 - LH / 2, hz, 0, PI / 6, 0)));
  // (① 모델 품질 10/21: a thin post in the icon) a hanging flower basket on a little arm halfway up, toward the street
  f.add(mc('streetlamp-flowers', ({ add, tube }) => {
    const by = 1.42, bx = .26;
    tube([0, by + .26, pz], [bx, by + .26, pz], .012, '#5b5672', 6); tube([bx, by + .26, pz], [bx, by + .1, pz], .006, '#5b5672', 4);
    add(G.sph(.13, 12, 8), '#b07a4a', bx, by + .06, pz, 0, 0, 0, [1, .7, 1]); add(G.tor(.13, .014, PI * 2, 4, 16), '#8a5a34', bx, by + .08, pz, HP, 0, 0);
    for (let k = 0; k < 9; k++) { const a = k * 2.4, r = .03 + (k % 3) * .035; add(G.sph(.035, 6, 5), ['#ff6f91', '#ffd23c', '#ffffff', '#ff8f3a'][k % 4], bx + Math.cos(a) * r, by + .13 + (k % 2) * .02, pz + Math.sin(a) * r); }
    for (let k = 0; k < 5; k++) { const a = k * 1.3 + .4; add(G.sph(.04, 6, 5), k % 2 ? '#4ea85a' : '#6cc46a', bx + Math.cos(a) * .11, by + .02 - (k % 2) * .05, pz + Math.sin(a) * .11, 0, 0, 0, [.8, 1.4, .8]); }
  }));
  f.spot('on', null, 0, .16, .14, { maxH: .45, label: '가로등 받침 위', scale: .65 });
};

// 볼록거울 (1×1): a round convex traffic mirror with an orange rim and a little visor, on an orange pole in a concrete
// drum with a hazard band; it shows a fish-eye street (and a mochi crossing).
B.mirrorpole = (f, T) => {
  const conc = col(T, 'concrete'), tk = conc;
  const pz = -.04, MY = 1.7, MR = .27, M = xf(0, MY, pz + .1, .14, .32, 0);
  f.add(mc('mirrorpole|' + tk, ({ add, addM, tube }) => {
    add(G.cyl(.17, .2, .2, 22), conc, 0, .1, pz);
    tube([0, .2, pz], [0, MY + .2, pz], .034, MIRROR, 12);
    add(G.sph(.036, 10, 8), MIRROR, 0, MY + .2, pz);
    for (let k = 0; k < 3; k++) add(G.cyl(.038, .038, .05, 12), k % 2 ? CHAR : YELLOW, 0, .225 + k * .05, pz);
    const L = (g, m, c) => addM(g, M.clone().multiply(m), c);
    L(G.cyl(MR + .03, MR - .01, .06, 30), xf(0, 0, -.03, HP, 0, 0), MIRROR);
    L(G.tor(MR + .012, .028, PI * 2, 6, 34), xf(0, 0, 0), MIRROR);
    L(G.tor(MR + .03, .03, PI, 5, 22), xf(0, 0, .05), MIRROR);
    L(G.box(.09, .12, .1, .02), xf(0, 0, -.1), STEEL2);
  }));
  f.add(mg('mirrorpole-glass', mirrorMat(), ({ addM }) => addM(capGeo(MR, RG.mirror), M)));
  f.add(mg('mirrorpole-band', atlasMat(), ({ add }) => add(bandGeo(.181, .19, .06, RG.hazard, 2.8, 20), 0, .13, pz)));
  f.spot('behind', null, 0, 0, -.36, { maxH: .45, label: '볼록거울 뒤', scale: .7 });
};

// 러버콘 (1×1): two rubber cones joined by a striped cone bar, and a third cone in front that lifts.
B.cones = (f, T) => {
  if ((globalThis.__sbkStage ?? -1) >= 18) return B.cones2(f, T);
  const cr = y => .125 - .093 * (y - .04) / .5 + .005;
  const cone = (add, x = 0, z = 0) => {
    add(G.box(.3, .04, .3, .014), shade(CONE, -.1), x, .02, z);
    add(G.cyl(.032, .125, .5, 18), CONE, x, .29, z);
    for (const [ya, yb] of [[.17, .25], [.33, .39]]) add(G.cyl(cr(yb), cr(ya), yb - ya, 18), WHITE, x, (ya + yb) / 2, z);
  };
  const A = [-.25, -.2], Bc = [.25, -.24];
  f.add(mc('cones', ({ add, addM, tube }) => {
    for (const [x, z] of [A, Bc]) cone(add, x, z);
    const y = .5, a = [A[0], y, A[1]], b = [Bc[0], y, Bc[1]];
    tube(a, b, .026, YELLOW, 10);
    const [L, m] = tubeM(a, b);
    for (let k = 0; k < 4; k++) addM(new THREE.CylinderGeometry(.031, .031, .06, 10), m.clone().multiply(xf(0, -L / 2 + .1 + k * (L - .2) / 3, 0)), CHAR);
    for (const [x, z] of [A, Bc]) add(G.tor(.048, .014, PI * 2, 5, 16), YELLOW, x, y, z, HP);
  }));
  const cn = grp(mc('cones-lift', ({ add }) => cone(add)));
  cn.position.set(.05, 0, .2); f.add(cn);
  const p = f.part('lift', cn, (t, b) => { cn.position.y = b.p.y + .42 * t; cn.position.x = b.p.x - .08 * t; cn.rotation.z = .5 * t; }, { label: '러버콘', sfx: 'lift' });
  f.spot('inside', null, .05, 0, .2, { part: p, maxH: .3, label: '러버콘 밑', scale: .8 });
};

// 러버콘 2 (1×1, 19판부터 — ① 10/29 공용 소품 다듬기, 1~18판은 위 B.cones 그대로): road-work cones as they stand on a real
// street — a black rubber foot with a raised collar, an orange body with a dusty band low down, two reflective white bands
// with a silver edge, a lip at the top; a yellow-and-black striped cone bar whose end sleeves sit over the tips, and a
// sandbag slung over one foot. Same lift part, spot and footprint.
B.cones2 = (f, T) => {
  const RUB = '#3d3a48', cr = y => .125 - .093 * (y - .06) / .5 + .004;
  const cone = (add, x = 0, z = 0) => {
    add(G.box(.32, .045, .32, .02), RUB, x, .0225, z);
    add(G.cyl(.14, .15, .025, 20), shade(RUB, .12), x, .057, z);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(G.cyl(.012, .012, .006, 8), shade(RUB, .2), x + sx * .12, .048, z + sz * .12);
    add(G.cyl(.035, .127, .5, 20), CONE, x, .31, z);
    add(G.cyl(cr(.13), cr(.07), .06, 20), shade(CONE, -.14), x, .1, z);
    for (const [ya, yb] of [[.2, .27], [.35, .4]]) {
      add(G.cyl(cr(yb) + .003, cr(ya) + .003, yb - ya, 20), '#f6f8fb', x, (ya + yb) / 2, z);
      for (const y of [ya, yb]) add(G.tor(cr(y) + .003, .0035, PI * 2, 3, 20), '#c9d0dc', x, y, z, HP);
    }
    add(G.tor(.04, .008, PI * 2, 4, 14), shade(CONE, -.08), x, .56, z, HP);
    add(G.cyl(.026, .026, .004, 12), '#4a2a1a', x, .563, z);
  };
  const A = [-.25, -.2], Bc = [.25, -.24];
  f.add(mc('cones2', ({ add, addM }) => {
    for (const [x, z] of [A, Bc]) cone(add, x, z);
    const y = .5, a = [A[0], y, A[1]], b = [Bc[0], y, Bc[1]];
    const [L, m] = tubeM(a, b), N = 9;
    for (let k = 0; k < N; k++) addM(new THREE.CylinderGeometry(.026, .026, L / N + .001, 10), m.clone().multiply(xf(0, -L / 2 + (k + .5) * L / N, 0)), k % 2 ? CHAR : YELLOW);
    for (const [x, z] of [A, Bc]) { add(G.tor(.048, .016, PI * 2, 6, 16), YELLOW, x, y, z, HP); add(G.cyl(.05, .05, .03, 14), YELLOW, x, y + .01, z); }
    const sx = A[0] + .1, sz = A[1] + .13;
    add(G.sph(.1, 14, 10), '#cfae76', sx, .07, sz, 0, .5, 0, [1.25, .42, .75]);
    for (const e of [-1, 1]) { add(G.cyl(.022, .04, .05, 10), '#c39c62', sx + e * .13 * Math.cos(.5), .07, sz - e * .13 * Math.sin(.5), 0, .5, e * HP); add(G.tor(.022, .006, PI * 2, 3, 10), '#8f6a3a', sx + e * .105 * Math.cos(.5), .07, sz - e * .105 * Math.sin(.5), 0, .5 + HP, 0); }
    for (let k = -2; k <= 2; k++) add(G.pbox(.006, .004, .1), '#b08d5a', sx + k * .035 * Math.cos(.5), .112, sz - k * .035 * Math.sin(.5), 0, .5, 0);
  }));
  const cn = grp(mc('cones2-lift', ({ add }) => cone(add)));
  cn.position.set(.05, 0, .2); f.add(cn);
  const p = f.part('lift', cn, (t, b) => { cn.position.y = b.p.y + .42 * t; cn.position.x = b.p.x - .08 * t; cn.rotation.z = .5 * t; }, { label: '러버콘', sfx: 'lift' });
  f.spot('inside', null, .05, 0, .2, { part: p, maxH: .3, label: '러버콘 밑', scale: .8 });
};

// 소화전 디테일 (19·21·22·25판에만 나옴 — ① 10/29 공용 소품 다듬기): the hydrant stood alone on a bare slab. Now a yellow
// no-parking stripe on the slab's front edge, a crack with two weed tufts, rust streaks under the side caps, chipped paint
// flecks, and a slim white marker pole with a red reflector and a 119 plate at the back corner.
const hydPlateTex = () => tex('st-hydplate2|' + STYLE.mode, 96, 64, (c, w, h) => {
  c.fillStyle = tint('#ffffff'); roundRect(c, 1, 1, w - 2, h - 2, 6); c.fill();
  c.strokeStyle = tint('#e8453c'); c.lineWidth = 3; roundRect(c, 3, 3, w - 6, h - 6, 5); c.stroke();
  c.fillStyle = tint('#e8453c'); c.fillRect(14, 24, 14, 22); c.beginPath(); c.arc(21, 24, 8, PI, 0); c.fill(); c.fillRect(9, 30, 24, 6);
  c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('119', 62, 34);
});
{ const b = B.hydrant; B.hydrant = (f, T) => {
  b(f, T);
  const conc = col(T, 'concrete');
  f.add(mc('hydrant2-ext|' + conc, ({ add, tube }) => {
    add(G.pbox(.56, .004, .06), YELLOW, 0, .042, .23);
    tube([-.26, .041, -.12], [-.16, .041, -.04], .004, shade(conc, -.25), 4); tube([-.16, .041, -.04], [-.18, .041, .06], .004, shade(conc, -.25), 4);
    for (const [x, z] of [[-.17, -.05], [.2, .16]]) for (let k = 0; k < 4; k++) add(G.cone(.012, .07, 5), k % 2 ? LEAF : LEAF2, x + (k - 1.5) * .012, .07, z, 0, 0, (k - 1.5) * .3);
    for (const sx of [-1, 1]) add(G.pbox(.004, .07, .016), '#b04a34', sx * .109, .28, .03);
    for (const [x, y, a] of [[.06, .2, .3], [-.07, .4, 1.1], [.09, .43, -.6]]) add(G.sph(.012, 6, 4), CREAM, Math.sin(a) * .11, y, .03 + Math.cos(a) * .11, 0, a, 0, [1, 1, .25]);
    add(G.box(.06, .03, .06, .01), shade(conc, -.06), .2, .055, -.2);
    add(G.cyl(.014, .014, .86, 10), WHITE, .2, .47, -.2);
    for (const y of [.62, .74, .86]) add(G.cyl(.016, .016, .05, 10), RED, .2, y, -.2);
    add(G.cyl(.03, .03, .012, 14), '#d12b2b', .2, .9, -.183, HP, 0, 0);
    add(G.cyl(.018, .018, .014, 12), '#ff7a6a', .2, .9, -.176, HP, 0, 0);
  }));
  f.add(mg('hydrant2-plate', mat('#ffffff', { map: hydPlateTex() }), ({ add }) => add(new THREE.PlaneGeometry(.15, .1), .2, .48, -.183)));
  f.add(mc('hydrant2-plateback', ({ add }) => add(G.box(.16, .11, .01, .004), '#e8e8ee', .2, .48, -.19)));
}; }

// 택배 상자 더미 (1×1): three parcels stacked by the door — a taped one with a shipping label, a darker tomato box, and an
// open-topped one on top whose flaps open; a padded mailer leans on the side.
B.boxstack = (f, T) => {
  const W1 = .62, D1 = .46, H1 = .32, z1 = -.06;
  const W2 = .5, D2 = .38, H2 = .26, M2 = xf(-.03, H1 + .002 + H2 / 2, -.08, 0, .12, 0);
  const W3 = .4, D3 = .3, H3 = .21, t = .02, x3 = .04, z3 = -.06, y3 = H1 + H2 + .004, top3 = y3 + H3;
  f.add(mc('boxstack', ({ add, addM }) => {
    add(G.box(W1, H1, D1, .01), KRAFT, 0, H1 / 2, z1);
    add(G.pbox(W1 + .004, .006, .07), TAPE, 0, H1 + .003, z1);
    add(G.pbox(.07, .12, .006), TAPE, 0, H1 - .06, z1 + D1 / 2 + .003);
    addM(G.box(W2, H2, D2, .01), M2, KRAFT2);
    addM(G.pbox(.07, .006, D2 + .004), M2.clone().multiply(xf(0, H2 / 2 + .003, 0)), TAPE);
    for (const sz of [-1, 1]) add(G.box(W3, H3, t, .006), KRAFT, x3, y3 + H3 / 2, z3 + sz * (D3 / 2 - t / 2));
    for (const sx of [-1, 1]) add(G.box(t, H3, D3 - 2 * t, .006), KRAFT, x3 + sx * (W3 / 2 - t / 2), y3 + H3 / 2, z3);
    add(G.pbox(W3 - 2 * t, .012, D3 - 2 * t), KRAFT2, x3, y3 + .006, z3);
    for (const [x, z, r, c] of [[-.08, -.05, .07, WHITE], [.09, .04, .065, '#f3ecdf'], [.0, -.07, .06, '#f3ecdf'], [-.09, .06, .06, WHITE], [.1, -.06, .055, WHITE]])
      add(G.sph(r, 9, 7), c, x3 + x, y3 + .04, z3 + z, .4, x * 7, 0, [1, .7, 1]);
    add(G.box(.03, .3, .26, .012), '#ffb3c6', .345, .15, .06, 0, 0, .12);
    add(G.pbox(.004, .05, .12), WHITE, .345 + .018, .2, .06, 0, 0, .12);
  }));
  f.add(mg('boxstack-labels', atlasMat(), ({ add, addM }) => {
    add(quadGeo(.26, .1625, RG.ship), -.17, .17, z1 + D1 / 2 + .005);
    addM(quadGeo(.19, .19, RG.tomato), M2.clone().multiply(xf(.08, -.005, D2 / 2 + .005)));
    add(quadGeo(.13, .065, RG.fragile), x3 - .1, y3 + .08, z3 + D3 / 2 + .005);
  }));
  const flap = sx => {
    const pv = new THREE.Group(); pv.position.set(x3 + sx * W3 / 2, top3 + .012, z3);
    pv.add(mc('boxstack-flap' + sx, ({ add }) => {
      const cx = -sx * W3 / 4, tx = -sx * (W3 / 2 - .0225);
      add(G.box(W3 / 2 - .003, .024, D3, .006), KRAFT, cx, 0, 0);
      add(G.pbox(.045, .006, D3 + .006), TAPE, tx, .015, 0);
      for (const sz of [-1, 1]) add(G.pbox(.045, .07, .006), TAPE, tx, -.022, sz * (D3 / 2 + .007));
    }));
    f.add(pv); return pv;
  };
  const L = flap(-1), R = flap(1);
  const p = f.part('lid', [L, R], t => { L.rotation.z = 2.4 * t; R.rotation.z = -2.4 * t; }, { label: '택배 상자', sfx: 'open' });
  f.spot('inside', null, x3, y3 + .05, z3, { part: p, maxH: .16, label: '택배 상자 안', scale: .55 });
  f.spot('behind', null, -.1, 0, -.4, { maxH: .45, label: '택배 상자 뒤', scale: .6 });
};

// 택배 상자 더미 2 (19판부터 — ① 10/29 공용 소품 다듬기 2, 1~18판은 위 B.boxstack 그대로): the same three parcels, now with
// fibre-flecked kraft on the faces, a squashed-corner crease, pale corrugated cut edges round the open box's rim, brown
// twine tied round the middle parcel with a bow, a clear invoice pouch on the bottom box's side and a grey poly mailer
// leaning on the left. Same flaps, spots and footprint.
const stackKraftTex = c0 => tex('st-kraft2|' + STYLE.mode + c0, 128, 128, (c, w, h) => {
  c.fillStyle = tint(c0); c.fillRect(0, 0, w, h);
  let s = 9; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 150; i++) { c.fillStyle = r() < .5 ? 'rgba(120,70,30,.10)' : 'rgba(255,240,210,.16)'; c.fillRect(r() * w, r() * h, 1 + r() * 2.5, .6 + r() * .8); }
});
{ const b = B.boxstack; B.boxstack2 = (f, T) => {
  b(f, T);
  const W1 = .62, D1 = .46, H1 = .32, z1 = -.06, W2 = .5, D2 = .38, H2 = .26, M2 = xf(-.03, H1 + .002 + H2 / 2, -.08, 0, .12, 0);
  const W3 = .4, D3 = .3, H3 = .21, x3 = .04, z3 = -.06, y3 = H1 + H2 + .004, t = .02;
  f.add(mg('boxstack2-k1', mat('#ffffff', { map: stackKraftTex(KRAFT) }), ({ add, addM }) => {
    add(new THREE.PlaneGeometry(W1 - .02, H1 - .02), 0, H1 / 2, z1 + D1 / 2 + .003);
    add(new THREE.PlaneGeometry(D1 - .02, H1 - .02), W1 / 2 + .003, H1 / 2, z1, 0, HP, 0);
    add(new THREE.PlaneGeometry(D3 - .02, H3 - .02), x3 + W3 / 2 + .003, y3 + H3 / 2, z3, 0, HP, 0);
    add(new THREE.PlaneGeometry(W3 - .02, H3 - .02), x3, y3 + H3 / 2, z3 + D3 / 2 + .003);
  }));
  f.add(mg('boxstack2-k2', mat('#ffffff', { map: stackKraftTex(KRAFT2) }), ({ addM }) => {
    addM(new THREE.PlaneGeometry(W2 - .02, H2 - .02), M2.clone().multiply(xf(0, 0, D2 / 2 + .003)));
    addM(new THREE.PlaneGeometry(D2 - .02, H2 - .02), M2.clone().multiply(xf(W2 / 2 + .003, 0, 0, 0, HP, 0)));
  }));
  f.add(mc('boxstack2-ext', ({ add, addM, tube }) => {
    for (const sz of [-1, 1]) add(G.pbox(W3 - .006, .005, t - .006), shade(KRAFT, .16), x3, y3 + H3 + .002, z3 + sz * (D3 / 2 - t / 2));
    for (const sx of [-1, 1]) add(G.pbox(t - .006, .005, D3 - .006), shade(KRAFT, .16), x3 + sx * (W3 / 2 - t / 2), y3 + H3 + .002, z3);
    tube([W1 / 2 - .12, H1 - .01, z1 + D1 / 2 + .004], [W1 / 2 - .01, H1 - .1, z1 + D1 / 2 + .004], .004, shade(KRAFT, -.22), 4);
    const TW = '#a8744a';
    for (const [w, h, d, x, y, z] of [[.008, .008, D2 + .012, -.12, H2 / 2 + .004, 0], [.008, H2 + .012, .008, -.12, 0, D2 / 2 + .004], [.008, H2 + .012, .008, -.12, 0, -D2 / 2 - .004], [W2 + .012, .008, .008, 0, 0, D2 / 2 + .004], [W2 + .012, .008, .008, 0, 0, -D2 / 2 - .004], [.008, .008, D2 + .012, W2 / 2 + .004, 0, 0], [.008, .008, D2 + .012, -W2 / 2 - .004, 0, 0]]) addM(G.pbox(w, h, d), M2.clone().multiply(xf(x, y, z)), TW);
    for (const a of [.6, -.6]) addM(G.tor(.022, .005, PI * 2, 4, 12), M2.clone().multiply(xf(-.12 + Math.sign(a) * -.025, .0, D2 / 2 + .01, 0, 0, a)), TW);
    for (const a of [-.25, .25]) addM(G.pbox(.005, .05, .005), M2.clone().multiply(xf(-.12 + a * .06, -.03, D2 / 2 + .01, 0, 0, a)), TW);
    add(G.pbox(.004, .12, .1), '#e9f3f8', W1 / 2 + .005, .2, z1 + .1);
    add(G.pbox(.003, .09, .08), WHITE, W1 / 2 + .008, .19, z1 + .1);
    add(G.box(.04, .3, .28, .03), '#c9ced8', -W1 / 2 - .03, .15, z1 + .06, 0, 0, -.14);
    add(G.pbox(.004, .05, .2), '#8f97a8', -W1 / 2 - .055, .27, z1 + .06, 0, 0, -.14);
    add(G.pbox(.004, .08, .1), WHITE, -W1 / 2 - .052, .14, z1 + .1, 0, 0, -.14);
  }));
}; B.boxstack = (f, T) => ((globalThis.__sbkStage ?? -1) >= 18 ? B.boxstack2 : b)(f, T); }

// 가로등 디테일 (21·22·30판에만 나옴 — ① 10/29 공용 소품 다듬기 2): the post stood on a bare block. Now a chamfered cap and a
// rain-stained skirt on the block, weed tufts at its corners, a bike chain with a padlock round the foot of the post, a
// numbered plate, and two flyers taped round the post — one half torn off.
const lampFlyerTex = () => tex('st-lampflyer2|' + STYLE.mode, 128, 160, (c, w, h) => {
  c.fillStyle = tint('#fffaf0'); c.fillRect(0, 0, w, h);
  c.fillStyle = tint('#ff9f8a'); c.fillRect(0, 0, w, 22);
  c.fillStyle = tint('#8a8fa8'); blob(c, 64, 70, 26); blob(c, 50, 48, 9); blob(c, 78, 48, 9);
  c.fillStyle = tint('#fffaf0'); blob(c, 56, 66, 4); blob(c, 72, 66, 4);
  c.fillStyle = tint('#2a1d33'); blob(c, 56, 66, 2.4); blob(c, 72, 66, 2.4);
  c.font = 'bold 14px sans-serif'; c.textAlign = 'center'; c.fillText('010-1234', 64, 118);
  c.strokeStyle = tint('#2a1d33'); c.lineWidth = 1;
  for (let x = 8; x < w; x += 15) { c.beginPath(); c.moveTo(x, 132); c.lineTo(x, h); c.stroke(); }
  c.font = '9px sans-serif'; for (let x = 15; x < w; x += 15) { c.save(); c.translate(x, 146); c.rotate(-HP); c.fillText('1234', 0, 0); c.restore(); }
});
const lampPlateTex = () => tex('st-lampplate2|' + STYLE.mode, 64, 96, (c, w, h) => {
  c.fillStyle = tint('#f4f6fa'); roundRect(c, 1, 1, w - 2, h - 2, 6); c.fill();
  c.fillStyle = tint('#4f6db0'); c.fillRect(1, 1, w - 2, 20);
  c.fillStyle = tint('#2a1d33'); c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('A', 32, 44); c.fillText('17', 32, 72);
});
{ const b = B.streetlamp; B.streetlamp = (f, T) => {
  b(f, T);
  const conc = col(T, 'concrete'), lamp = col(T, 'lamp'), pz = -.12, rAt = y => .048 - .014 * (y - .46) / 1.9;
  f.add(mc('streetlamp2-ext|' + [conc, lamp].join(','), ({ add, tube }) => {
    add(G.box(.48, .025, .48, .01), shade(conc, .06), 0, .168, 0);
    add(G.pbox(.524, .05, .524), shade(conc, -.1), 0, .025, 0);
    for (const [x, z] of [[-.25, .25], [.25, .24], [-.24, -.25]]) for (let k = 0; k < 4; k++) add(G.cone(.012, .08, 5), k % 2 ? LEAF : LEAF2, x + (k - 1.5) * .014, .04, z, 0, 0, (k - 1.5) * .35);
    add(G.tor(.06, .009, PI * 2, 4, 18), '#8c939e', 0, .5, pz, HP + .25, 0, 0);
    for (let k = 0; k < 4; k++) add(G.tor(.016, .006, PI * 2, 4, 10), '#8c939e', .02 + k * .01, .44 - k * .035, pz + .065 + k * .006, 0, k % 2 ? HP : 0, 0);
    add(G.box(.06, .07, .03, .01), '#e8b84a', .05, .29, pz + .08);
    add(G.tor(.022, .007, PI, 4, 10), STEEL2, .05, .325, pz + .08);
    add(G.box(.075, .115, .006, .003), '#dfe3ea', 0, 1.62, pz + rAt(1.62) + .004);
    for (const y of [.935, 1.185]) add(G.cyl(rAt(y) + .006, rAt(y) + .006, .022, 16, true), TAPE, 0, y, pz);
  }));
  f.add(mg('streetlamp2-plate', mat('#ffffff', { map: lampPlateTex() }), ({ add }) => add(new THREE.PlaneGeometry(.065, .1), 0, 1.62, pz + rAt(1.62) + .008)));
  f.add(mg('streetlamp2-flyer', mat('#ffffff', { map: lampFlyerTex(), side: THREE.DoubleSide }), ({ add }) => {
    add(new THREE.CylinderGeometry(rAt(1.2) + .004, rAt(.92) + .004, .26, 12, 1, true, -.95, 1.9), 0, 1.06, pz);
  }));
  f.add(mc('streetlamp2-torn', ({ add }) => {
    add(G.cyl(rAt(1.5) + .004, rAt(1.38) + .004, .1, 10, true), '#fff3c9', 0, 1.44, pz);
    for (let k = 0; k < 4; k++) add(G.pbox(.012, .03, .003), '#fff3c9', Math.sin(PI + .5 + k * .25) * .046, 1.375 - (k % 2) * .012, pz + Math.cos(PI + .5 + k * .25) * .046);
  }));
}; }

// 자전거 (2×1): a step-through city bike (mamachari) with a front wire basket, silver mudguards, a chain guard, a rear
// rack and a centre stand.
B.bike2 = (f, T) => {
  const fc = col(T, 'bike'), tk = fc;
  const R = [-.55, .29, 0], F = [.55, .29, 0], BB = [-.06, .27, 0], ST = [-.24, .74, 0], HB = [.4, .6, 0], HT = [.43, .82, 0];
  const bx = .66, by = .74, BW = .3, BD = .36, BH = .22;
  f.add(mc('bike2|' + tk, ({ add, tube }) => {
    for (const [x, y] of [R, F]) {
      add(G.tor(.27, .032, PI * 2, 6, 34), CHAR, x, y, 0);
      add(G.tor(.235, .012, PI * 2, 4, 30), STEEL, x, y, 0);
      add(G.cyl(.03, .03, .09, 10), STEEL2, x, y, 0, HP, 0, 0);
      for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2 + .2; tube([x, y, (k % 2 ? .02 : -.02)], [x + Math.cos(a) * .232, y + Math.sin(a) * .232, 0], .004, STEEL, 4); }
    }
    add(G.tor(.31, .02, 2.5, 4, 22), ALU, R[0], R[1], 0, 0, 0, .5);
    add(G.tor(.31, .02, 2.2, 4, 20), ALU, F[0], F[1], 0, 0, 0, .35);
    // frame (step-through)
    const r = .028;
    for (const sz of [-1, 1]) { tube([R[0], R[1], sz * .035], [BB[0], BB[1], sz * .02], .02, fc, 8); tube([R[0], R[1], sz * .035], [-.22, .66, sz * .015], .018, fc, 8); }
    tube(BB, ST, r, fc, 10);
    tube(BB, [.12, .3, 0], .03, fc, 10); tube([.12, .3, 0], HB, .03, fc, 10); add(G.sph(.03, 8, 6), fc, .12, .3, 0);
    tube(HB, HT, .034, fc, 10);
    for (const sz of [-1, 1]) tube([HB[0], HB[1], sz * .02], [F[0], F[1], sz * .035], .018, fc, 8);
    add(G.cyl(.035, .035, .1, 12), STEEL2, BB[0], BB[1], 0, HP, 0, 0);
    add(G.box(.52, .1, .02, .03), fc, -.3, .3, .055);
    // cranks + pedals
    tube([BB[0], BB[1], .07], [BB[0] - .08, BB[1] - .12, .07], .012, STEEL2, 6); add(G.box(.1, .025, .06, .008), CHAR, BB[0] - .08, BB[1] - .12, .1);
    tube([BB[0], BB[1], -.07], [BB[0] + .08, BB[1] + .12, -.07], .012, STEEL2, 6); add(G.box(.1, .025, .06, .008), CHAR, BB[0] + .08, BB[1] + .12, -.1);
    // saddle, handlebar, bell
    tube(ST, [-.27, .84, 0], .016, STEEL, 8);
    add(G.box(.2, .06, .14, .03), BROWN, -.28, .87, 0);
    for (const sz of [-1, 1]) add(G.tor(.014, .005, PI * 2, 3, 8), STEEL2, -.3, .825, sz * .04, 0, HP, 0);
    tube(HT, [.42, .94, 0], .018, STEEL, 8);
    for (const sz of [-1, 1]) { tube([.42, .94, 0], [.34, .95, sz * .22], .014, STEEL, 8); add(G.cap(.02, .07, 2, 8), BROWN, .335, .95, sz * .25, HP, 0, 0); }
    add(G.dome(.024, 10, 4), YELLOW, .38, .955, .13);
    // front basket (wire)
    const x0 = bx - BW / 2, x1 = bx + BW / 2, z0 = -BD / 2, z1 = BD / 2, wire = '#eef1f6';
    add(G.pbox(BW - .01, .008, BD - .01), '#e3e8ef', bx, by + .004, 0);
    for (const [y, rr] of [[by, .007], [by + BH / 2, .006], [by + BH, .011]]) {
      tube([x0, y, z0], [x1, y, z0], rr, wire, 5); tube([x0, y, z1], [x1, y, z1], rr, wire, 5);
      tube([x0, y, z0], [x0, y, z1], rr, wire, 5); tube([x1, y, z0], [x1, y, z1], rr, wire, 5);
    }
    for (let k = 0; k <= 5; k++) { const x = x0 + k * BW / 5; for (const z of [z0, z1]) tube([x, by, z], [x, by + BH, z], .005, wire, 4); }
    for (let k = 1; k < 6; k++) { const z = z0 + k * BD / 6; for (const x of [x0, x1]) tube([x, by, z], [x, by + BH, z], .005, wire, 4); }
    for (const sz of [-1, 1]) tube([bx, by, sz * .09], [F[0], F[1], sz * .04], .008, STEEL2, 5);
    add(G.cyl(.036, .03, .06, 12), CHAR, x1 + .035, by - .02, 0, 0, 0, HP);
    add(G.cyl(.026, .026, .006, 12), CREAM, x1 + .068, by - .02, 0, 0, 0, HP);
    // rear rack + centre stand
    for (const sz of [-1, 1]) tube([-.8, .66, sz * .08], [-.36, .66, sz * .08], .01, ALU, 6);
    for (const x of [-.78, -.58, -.38]) tube([x, .66, -.08], [x, .66, .08], .01, ALU, 6);
    for (const sz of [-1, 1]) { tube([-.6, .66, sz * .08], [R[0], R[1], sz * .05], .009, ALU, 6); tube([-.5, .27, sz * .05], [-.56, .01, sz * .13], .012, STEEL2, 6); add(G.box(.05, .016, .04, .005), CHAR, -.56, .008, sz * .13); }
  }));
  f.spot('on', null, bx, by + .008, 0, { maxH: .2, label: '자전거 바구니', scale: .7 });
  f.spot('under', null, .17, 0, .03, { maxH: .22, label: '자전거 밑', scale: .7 });
};

// 화분 놓인 대문 기둥 (1×1): a brick gate post with a cap, a 101 plate and a doorbell, a short iron railing, and pots at its
// foot — a big terracotta fern, red geraniums in a cream pot, a sky-blue succulent — plus ivy trailing from the cap.
B.potgate = (f, T) => {
  const brick = col(T, 'brick'), conc = col(T, 'concrete'), gate = col(T, 'gate'), pc = col(T, 'pot'), tk = [brick, conc, gate, pc].join(',');
  const PX = -.14, PZ = -.36, PW = .42, PD = .28, PH = 1.42, PF = PZ + PD / 2;
  f.add(mg('potgate-brick|' + brick, mat('#ffffff', { map: brickTex(brick) }), ({ addM }) => addM(planarUV(ni(G.box(PW, PH, PD, .02)).translate(PX, PH / 2, PZ), .5), new THREE.Matrix4())));
  f.add(mc('potgate|' + tk, ({ add, tube }) => {
    add(G.box(PW + .08, .07, PD + .08, .02), conc, PX, PH + .035, PZ);
    add(G.box(PW - .04, .05, PD - .04, .02), shade(conc, -.06), PX, PH + .095, PZ);
    add(G.box(.2, .11, .012, .004), '#33406a', PX - .05, 1.18, PF + .006);
    add(G.box(.08, .12, .024, .008), WHITE, PX + .12, .98, PF + .012);
    add(G.cyl(.018, .018, .012, 10), MUSTARD, PX + .12, .96, PF + .024 + .006, HP, 0, 0);
    for (const dy of [.01, .025]) add(G.pbox(.04, .006, .004), STEEL2, PX + .12, .98 + dy, PF + .024 + .002);
    // iron railing
    for (const y of [.1, .82]) tube([PX + PW / 2, y, PZ], [.5, y, PZ], .014, gate, 6);
    for (let k = 0; k < 6; k++) { const x = .11 + k * .075; tube([x, 0, PZ], [x, .86, PZ], .012, gate, 6); add(G.cone(.022, .05, 6), gate, x, .885, PZ); }
    for (let k = 0; k < 5; k++) add(G.tor(.024, .006, PI * 2, 3, 10), gate, .1475 + k * .075, .46, PZ);
    // big terracotta pot with a leafy fern and pink flowers
    const ax = -.2, az = .16;
    add(G.lathe([[0, 0], [.12, 0], [.155, .25], [.172, .26], [.172, .29], [.152, .29], [.148, .27], [0, .27]], 22), pc, ax, 0, az);
    add(G.cyl(.146, .146, .012, 18), SOIL, ax, .276, az);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; add(G.sph(.09, 10, 7), k % 2 ? LEAF : LEAF2, ax + Math.cos(a) * .1, .38 + (k % 3) * .04, az + Math.sin(a) * .1, 0, -a, .45, [1.35, .5, .75]); }
    add(G.sph(.08, 10, 8), LEAF3, ax, .48, az);
    for (const [x, y, z] of [[-.06, .5, .07], [.07, .47, .08], [.02, .53, -.04], [-.09, .44, -.05]]) add(G.sph(.022, 8, 6), BLUSH, ax + x, y, az + z);
    // cream pot of red geraniums
    const bx = .2, bz = .02;
    add(G.lathe([[0, 0], [.09, 0], [.11, .18], [.12, .19], [.12, .21], [.105, .21], [.1, .195], [0, .195]], 20), CREAM, bx, 0, bz);
    add(G.cyl(.1, .1, .01, 16), SOIL, bx, .2, bz);
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2 + .3; add(G.sph(.05, 10, 7), LEAF2, bx + Math.cos(a) * .07, .25, bz + Math.sin(a) * .07, 0, 0, 0, [1, .55, 1]); }
    for (const [x, y, z] of [[-.03, .33, .02], [.05, .31, -.03], [.0, .3, .07], [.06, .35, .05]]) for (let k = 0; k < 4; k++) add(G.sph(.018, 8, 6), '#ff4f5e', bx + x + Math.cos(k * HP) * .016, y + (k % 2) * .008, bz + z + Math.sin(k * HP) * .016);
    // small sky pot with a succulent
    const cx = .07, cz = .33;
    add(G.cyl(.07, .055, .11, 16), SKY, cx, .055, cz);
    add(G.cyl(.06, .06, .008, 14), SOIL, cx, .108, cz);
    for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2; add(G.cone(.022, .07, 6), LEAF3, cx + Math.cos(a) * .03, .14, cz + Math.sin(a) * .03, Math.sin(a) * .5, 0, -Math.cos(a) * .5); }
    add(G.sph(.016, 8, 6), BLUSH, cx, .17, cz);
    // little pot on the cap, ivy trailing down the front
    const qx = PX - .08, qy = PH + .12;
    add(G.cyl(.07, .06, .1, 14), pc, qx, qy + .05, PZ);
    for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; add(G.sph(.042, 8, 6), k % 2 ? LEAF : LEAF3, qx + Math.cos(a) * .035, qy + .12 + (k % 2) * .02, PZ + Math.sin(a) * .035, 0, -a, .5, [1.3, .5, .7]); }
    for (const [x, y] of [[-.13, -.0], [-.11, -.08], [-.15, -.15], [-.12, -.23], [-.16, -.3]]) add(G.sph(.028, 8, 6), LEAF, PX + x + .03, PH + y, PF + .034, 0, 0, .6, [1.2, .75, .45]);
    tube([PX - .1, PH + .02, PF + .02], [PX - .13, PH - .3, PF + .03], .005, LEAF2, 4);
  }));
  f.add(mg('potgate-plate', atlasMat(), ({ add }) => add(quadGeo(.16, .08, RG.house), PX - .05, 1.18, PF + .012 + .005)));
  f.spot('behind', null, -.2, 0, -.11, { maxH: .45, label: '화분 뒤', scale: .65 });
};

// 빨간 우체통 (1×1): a red arch-top post box on a dark post — a letter slot under a brow, a POST print, and a collection
// door below that flips down (it takes a padlock) onto letters waiting inside.
B.postbox2 = (f, T) => {
  const W = .46, D = .38, y0 = .53, H = .54, z0 = -.02, fz = z0 + D / 2, t = .03, DR = shade(RED, -.12), IN = '#a83a36';
  const dy = y0 + t + .005, DH = .23, DW = W - 2 * t - .01, uy = dy + DH + .005;
  f.add(mc('postbox2', ({ add }) => {
    add(G.box(.34, .03, .3, .01), CHAR, 0, .015, z0);
    add(G.box(.14, y0 - .03, .12, .02), CHAR, 0, .03 + (y0 - .03) / 2, z0);
    add(G.box(W, t, D, .01), RED, 0, y0 + t / 2, z0);
    add(G.box(W, H, t, .01), RED, 0, y0 + H / 2, z0 - D / 2 + t / 2);
    for (const sx of [-1, 1]) add(G.box(t, H, D, .01), RED, sx * (W / 2 - t / 2), y0 + H / 2, z0);
    add(G.box(W, y0 + H - uy, t, .01), RED, 0, (uy + y0 + H) / 2, fz - t / 2);
    add(G.cyl(W / 2, W / 2, D - .006, 30), RED, 0, y0 + H, z0, HP, 0, 0);
    add(G.box(.26, .03, .02, .006), CHAR, 0, y0 + H - .07, fz + .006);
    add(G.box(.32, .022, .06, .01), DR, 0, y0 + H - .04, fz + .02);
    add(G.pbox(W - 2 * t, .006, D - 2 * t), IN, 0, y0 + t + .003, z0);
    add(G.pbox(W - 2 * t, H - t - .02, .006), IN, 0, y0 + t + (H - t - .02) / 2, z0 - D / 2 + t + .003);
    [[-.08, -.06, .3, WHITE], [.07, -.02, -.4, '#fff4e2'], [-.02, .06, .1, SKY2]].forEach(([x, z, r, c], k) => add(G.box(.17, .008, .11, .003), c, x, y0 + t + .006 + .004 + k * .007, z0 + z, 0, r, 0));
    add(G.box(.024, .02, .03, .005), TOMATO, -.05, y0 + t + .006 + .018, z0 - .05);
  }));
  // (10/29 19판부터) the back: the collection-times plate, a rib and four bolts instead of one flat red board
  if (LATE19()) f.add(mc('postbox2-back', ({ add }) => {
    const bz = z0 - D / 2 - .004;
    add(G.box(.3, .2, .012, .005), WHITE, 0, y0 + .3, bz); for (let k = 0; k < 4; k++) add(G.pbox(k ? .22 : .16, .01, .004), k ? STEEL2 : TOMATO, 0, y0 + .37 - k * .04, bz - .008);
    add(G.box(W - .02, .03, .02, .006), DR, 0, y0 + H - .05, bz); add(G.box(W - .02, .03, .02, .006), DR, 0, y0 + .08, bz);
    for (const sx of [-1, 1]) for (const y of [y0 + .14, y0 + .44]) add(G.sph(.012, 8, 6), STEEL, sx * .17, y, bz - .004);
  }));
  f.add(mg('postbox2-print', atlasMat(), ({ add }) => add(quadGeo(.3, .15, RG.post), 0, .88, fz + .005)));
  const pv = new THREE.Group(); pv.position.set(0, dy, fz + .0105);
  pv.add(mc('postbox2-door', ({ add }) => {
    add(G.box(DW, DH, .025, .01), RED, 0, DH / 2, 0);
    add(G.box(.1, .025, .025, .008), STEEL, -.06, DH - .04, .02);
    add(G.pbox(.16, .06, .006), WHITE, -.04, DH / 2 - .03, .0125 + .003);
    for (const k of [0, 1]) add(G.pbox(.12, .008, .004), STEEL2, -.04, DH / 2 - .02 - k * .02, .0185 + .002);
  }));
  f.add(pv);
  const p = f.part('flip', pv, t2 => { pv.rotation.x = 1.45 * t2; }, { label: '우체통 문', sfx: 'open', dur: .28 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: .12, y: DH - .06, z: .03, parent: pv };
  f.spot('inside', null, 0, y0 + t + .006, z0 - .02, { part: p, maxH: .22, label: '우체통 안', scale: .65 });
};

// 맨홀 뚜껑 (1×1, flat): a steel ring and a lid with a bear pressed into it; the lid lifts aside onto the dark hole.
B.manhole = (f, T) => {
  f.add(mc('manhole', ({ add, addM }) => {
    addM(G.tor(.34, .045, PI * 2, 6, 40), xf(0, .008, 0, HP, 0, 0, [1, 1, .25]), DARK);
    add(G.cyl(.305, .305, .006, 32), '#2a2535', 0, .004, 0);
  }));
  const pv = new THREE.Group(); pv.position.set(0, .009, 0);
  pv.add(mc('manhole-lid', ({ add }) => add(G.cyl(.288, .288, .014, 34), '#77728a', 0, .007, 0)));
  pv.add(mg('manhole-face', atlasMat(), ({ addM }) => addM(discGeo(.27, RG.manhole), xf(0, .014 + .005, 0))));
  f.add(pv);
  const p = f.part('lift', pv, (t, b) => { pv.position.y = b.p.y + .32 * t; pv.position.x = b.p.x + .2 * t; pv.rotation.z = -.55 * t; }, { label: '맨홀 뚜껑', sfx: 'lift', dur: .34 });
  f.spot('inside', null, 0, .007, 0, { part: p, maxH: .3, label: '맨홀 속', scale: .75 });
};

// 버스 정류장 벤치 (2×1): a slim bus shelter — slate posts and roof, a glass back with a glowing bubble-tea ad, the stop's
// name board on the roof, and a wooden slatted bench on three steel legs.
B.bench2 = (f, T) => {
  const wood = col(T, 'wood'), lamp = col(T, 'lamp'), acc = col(T, 'accent'), tk = [wood, lamp, acc].join(',');
  const bz = -.42, RY = 2.1, SY = .44;
  f.add(mc('bench2|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.07, RY, .07, .015), lamp, sx * .95, RY / 2, bz);
    add(G.box(2.06, .07, .8, .02), lamp, 0, RY + .035, -.1);
    add(G.box(2.08, .06, .05, .015), acc, 0, RY + .035, .31);
    add(G.box(1.0, .2, .05, .015), '#2f6fd6', -.4, RY + .07 + .1, .2);
    for (const y of [.5, 1.95]) add(G.box(1.84, .05, .05, .012), ALU, 0, y, bz);
    add(G.box(.05, 1.4, .05, .012), ALU, 0, 1.225, bz);
    add(G.box(.9, 1.4, .1, .02), ALU, .47, 1.225, bz + .02);
    for (const z of [-.28, -.16, -.04]) add(G.box(1.66, .035, .1, .012), wood, 0, SY, z);
    for (const x of [-.7, 0, .7]) {
      add(G.box(.05, SY - .02, .05, .01), STEEL2, x, (SY - .02) / 2, -.16);
      add(G.box(.05, .03, .3, .01), STEEL2, x, SY - .035, -.16);
      add(G.box(.07, .02, .26, .006), STEEL2, x, .01, -.16);
    }
  }));
  f.add(transparent(mg('bench2-glass', glassMat(), ({ add }) => add(new THREE.PlaneGeometry(.88, 1.4), -.48, 1.225, bz))));
  f.add(mg('bench2-ad', signMat(), ({ add }) => add(quadGeo(.82, 1.23, RG.ad), .47, 1.225, bz + .07 + .005)));
  // (10/29 19판부터) from the street side the ad box was a blank grey board: the same ad on its back, a route map frame on the post
  if (LATE19()) {
    f.add(mg('bench2-ad-back', signMat(), ({ add }) => add(quadGeo(.82, 1.23, RG.ad), .47, 1.225, bz - .03 - .005, 0, PI, 0)));
    f.add(mc('bench2-back|' + tk, ({ add }) => { add(G.box(.3, .42, .03, .01), ALU, -.48, 1.35, bz - .03); add(G.pbox(.24, .36, .006), '#f4f1e8', -.48, 1.35, bz - .048);
      for (let k = 0; k < 5; k++) add(G.pbox(.18, .012, .004), k % 2 ? '#3f9be0' : CHAR, -.48, 1.46 - k * .05, bz - .052); }));
  }
  f.add(mg('bench2-name', atlasMat(), ({ add }) => add(quadGeo(.92, .19, RG.stopname), -.4, RY + .17, .225 + .005)));
  f.spot('under', null, -.35, 0, -.16, { maxH: .38, label: '정류장 벤치 밑', scale: .85 });
  f.spot('on', null, .35, SY + .0175, -.16, { maxH: .45, label: '정류장 벤치 위', scale: .75 });
};

// ═════════════════════════════════════════════ WALL PIECES ═════════════════════════════════════════════
// 고양이 주의 (wall, span 1): a yellow 고양이 주의 sign hanging from a hinge rod (it swings up to show what was tucked
// behind it) over a little wooden flower box.
B.catsign = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [wood, woodD].join(',');
  const HY = 1.32, SW = .44, SH = .52, BY = .42;   // under the 1.6 m alley wall cap, even when the sign is swung aside
  f.add(mc('catsign|' + tk, ({ add, tube }) => {
    add(G.cyl(.012, .012, .05, 8), STEEL2, 0, HY + .012, .025, HP, 0, 0);
    add(G.sph(.016, 8, 6), STEEL2, 0, HY + .012, .05);
    add(G.box(.52, .15, .18, .02), wood, 0, BY, .1);
    for (const y of [-.035, .035]) add(G.pbox(.5, .008, .004), woodD, 0, BY + y, .19 + .004);
    add(G.box(.46, .03, .13, .012), SOIL, 0, BY + .085, .1);
    for (const sx of [-1, 1]) tube([sx * .2, BY - .2, .012], [sx * .2, BY - .075, .16], .014, woodD, 6);
    for (const [x, fl] of [[-.17, WHITE], [.17, BLUSH]]) {
      for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; add(G.sph(.04, 8, 6), k % 2 ? LEAF : LEAF2, x + Math.cos(a) * .035, BY + .13 + (k % 2) * .02, .1 + Math.sin(a) * .03, 0, -a, .5, [1.3, .55, .7]); }
      for (const [dx, dz] of [[-.02, .03], [.03, .0], [0, -.03]]) { add(G.sph(.017, 8, 6), fl, x + dx, BY + .19, .1 + dz); add(G.sph(.009, 6, 4), MUSTARD, x + dx, BY + .2, .1 + dz + .008); }
    }
  }));
  const PT = -.1 - SH / 2, pv = new THREE.Group(); pv.position.set(0, HY, .03);
  pv.add(mc('catsign-plate', ({ add, tube }) => {
    add(G.box(SW, SH, .022, .03), YELLOW, 0, PT, 0);
    for (const sx of [-1, 1]) { tube([0, 0, .006], [sx * .15, -.1, .006], .005, STEEL2, 4); add(G.tor(.014, .005, PI * 2, 3, 10), STEEL2, sx * .15, -.1, .006, 0, HP, 0); }
    add(G.tor(.016, .006, PI * 2, 3, 10), STEEL2, 0, 0, .006);
  }));
  pv.add(mg('catsign-face', atlasMat(), ({ add }) => add(quadGeo(SW - .04, SH - .04, RG.cat), 0, PT, .011 + .005)));
  f.add(pv);
  const p = f.part('flip', pv, t => { pv.rotation.z = 1.4 * t; }, { label: '고양이 주의 표지판', sfx: 'lift', dur: .34 });
  f.spot('inside', null, 0, HY + PT, .012, { part: p, maxH: .09, label: '표지판 뒤', wallFace: true, scale: .85 });
  f.spot('on', null, 0, BY + .1, .1, { maxH: .4, label: '꽃 상자 위', scale: .6 });
};

export const STREET_BUILDERS = B;

export const STREET_INFO = {
  konbini: { w: 2, d: 1, name: '편의점', price: 600, region: 'alley' },
  tteokstall: { w: 2, d: 1, name: '떡볶이 포장마차', price: 480, region: 'alley' },
  redstools: { w: 1, d: 1, name: '빨간 플라스틱 의자 세트', price: 160, region: 'alley' },
  hydrant: { w: 1, d: 1, name: '소화전', price: 180, region: 'alley' },
  stopsign: { w: 1, d: 1, name: '정지 표지판', price: 150, region: 'alley' },
  streetlamp: { w: 1, d: 1, name: '가로등', price: 220, region: 'alley' },
  mirrorpole: { w: 1, d: 1, name: '볼록거울', price: 170, region: 'alley' },
  cones: { w: 1, d: 1, name: '러버콘', price: 120, region: 'alley' },
  boxstack: { w: 1, d: 1, name: '택배 상자 더미', price: 130, region: 'alley' },
  bike2: { w: 2, d: 1, name: '자전거', price: 260, region: 'alley' },
  potgate: { w: 1, d: 1, name: '화분 놓인 대문 기둥', price: 240, region: 'alley' },
  postbox2: { w: 1, d: 1, name: '빨간 우체통', price: 280, region: 'alley' },
  manhole: { w: 1, d: 1, name: '맨홀 뚜껑', price: 140, region: 'alley', floor: true },
  bench2: { w: 2, d: 1, name: '버스 정류장 벤치', price: 360, region: 'alley' },
  catsign: { wall: true, span: 1, name: '고양이 주의 표지', price: 120, region: 'alley' },
};

// Suggested outdoor theme (stages.js THEMES shape, a superset of the ALLEY keys): warm asphalt under a late-afternoon
// light, plaster-and-brick boundary walls (outdoor.js 'alleywall' reads plaster / brick / roofTile), plus the keys these
// props read (awning, shop, stall, stool, bike, lamp, concrete, brick, gate, pot).
export const STREET_THEMES = {
  street: { name: '우리 동네 골목', friend: null, bg: ['#ffe9d2', '#ffd3b2'], base: '#c9b7a6',
    floorKind: 'asphalt', floor: '#8a8190', floor2: '#78707f', asphalt: '#8a8190', pave: '#e39a72',
    wallKind: 'plain', wall: '#f6e6d0', wall2: '#d0785a', wainscot: '#ead6bc', wallEdge: '#fff6ea', trim: '#ffffff',
    plaster: '#f6e6d0', brick: '#d0785a', roofTile: '#c0603f', gate: '#3b8f6a', concrete: '#e2d9cd', stone: '#d8cfc2',
    wood: '#e9b47e', woodD: '#b98252', body: '#fff7ea', accent: '#7fd6c0', accent2: '#8fd3f4', accent3: '#ffc23d', door: '#bfe6d2',
    knob: '#ffd84a', sheet: '#ffffff', pillow: '#fff3d6', fabric: '#fff0d8', fabric2: '#ffe3bf', curtain: '#fff3d6', rug: '#fff3df',
    rug2: '#ffd9a8', pot: '#e88a5c', top: '#fffaf0', vend: '#ff4d5e', bin: '#3f9a6e', soil: '#7a5536', leaf: '#5fc45a',
    awning: '#ff5a4a', shop: '#fffaf2', stall: '#fff1dc', stool: '#ff4f4a', bike: '#4fae9b', lamp: '#5d7088',
    light: { ambColor: '#ffe2c6', amb: 1.3, sunColor: '#ffd9a6', sun: 2.15 } },
};

// ═════════════════════════════════════════════ ITEMS ═════════════════════════════════════════════
// Same shape as items.js ITEMS: { name, h, flat?, build() } → Group, origin bottom centre.
//   Object.assign(ITEMS, STREET_ITEMS)   (and push the keys into TARGET_POOL / a theme pool to make them stage targets)
export const STREET_ITEMS = {
  // 버블티 (⑥ 10/23 밤 사용자 "동그란 것들이 컵 밖으로 뚫고 나와 징그러워"): a clear cup with the pearls heaped INSIDE at the
  // bottom (well in from the wall, seen through it) in milk tea that fills the cup, a milk foam top with two ice cubes, a sealed film lid
  // on the rim, the shop band and a fat pink straw through the seal
  bubbletea: { name: '버블티', h: .31, build() {
    // (사용자 메모 10/24 28판 "버블티 이거 투명도 없애보자. 이상하다": no see-through parts any more — the drink itself is the cup's
    // colour (opaque milk tea), the pearls pressed against its lower wall, a milky band above the drink to the lid, the printed band)
    const g = grp();
    g.add(mc('it-bubbletea3', ({ add, tube }) => {
      // (⑥ 10/24 GPT QA ART-06 "7판 책장에서 책·나무와 섞임": the tea a lighter milky caramel than any shelf wood, so the dark pearls
      // and the white lid stand out on it)
      add(G.cyl(.069, .056, .162, 24), '#efcc9c', 0, .083, 0); add(G.cyl(.058, .058, .006, 22), '#dcae78', 0, .003, 0);
      for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; add(G.sph(.012, 12, 9), i % 2 ? '#5a3424' : '#2e1a16', Math.cos(a) * .047, .02 + (i % 3) * .008, Math.sin(a) * .047); }   // (10/24 "튀어나오지만 말게": only a flat dot of each pearl shows at the wall)
      add(G.cyl(.075, .07, .038, 24, true), '#fdf6ee', 0, .182, 0); add(G.cyl(.07, .07, .006, 22), '#f3e3cf', 0, .165, 0);
      for (const [x, z, r] of [[.03, -.012, .4], [-.022, .024, -.3]]) add(G.box(.026, .024, .026, .006), '#eaf7ff', x, .18, z, .2, r, .1);
      add(G.tor(.075, .006, PI * 2, 4, 28), WHITE, 0, .2, 0, HP);
      add(G.cyl(.075, .075, .004, 28), '#fff6fa', 0, .2, 0);
      add(G.tor(.05, .004, PI * 2, 4, 24), '#ffb3cc', 0, .2025, 0, HP);
      tube([.012, .06, 0], [.034, .31, .012], .015, '#ff7fa8', 12);
    }));
    g.add(mg('it-bubbletea-band', atlasMat(), ({ add }) => add(bandGeo(.0744, .0704, .05, RG.tea, 2.4, 18), 0, .13, 0)));
    return g;
  } },
  // 김밥 한 줄: a roll of kimbap on foil, its cut end and two slices showing rice, egg, carrot, spinach, ham and danmuji
  kimbap: { name: '김밥', h: .09, flat: true, build() {
    const g = grp();
    const fill = (add, cx, cy, cz, axis) => {   // the filling dots on a cut face: axis 'x' (end of the roll) or 'y' (a slice lying flat)
      for (const [u, v, w, h, c] of [[0, .012, .024, .012, '#ffd84a'], [-.015, -.006, .012, .016, '#ff9a3c'], [.015, -.004, .012, .016, '#4ea85a'], [0, -.016, .02, .01, '#ff9fb5'], [-.014, .012, .01, .01, '#ffe066']])
        if (axis === 'x') add(G.box(.006, h, w, .002), c, cx, cy + v, cz + u); else add(G.box(w, .006, h, .002), c, cx + u, cy, cz - v);
    };
    // (① 모델 품질 10/21: the dark roll took most of it and read as a stick — now the slices themselves, the colourful cut faces
    // up, a row of five leaning on each other on the foil tray)
    g.add(mc('it-kimbap3', ({ add }) => {
      add(G.box(.36, .006, .2, .002), '#e3e7ee', 0, .003, 0);
      for (let k = 0; k < 5; k++) {
        const x = -.11 + k * .055, z = (k % 2 ? .014 : -.014), tilt = -.35;
        const yy = .028 + Math.sin(-tilt) * .02;
        add(G.cyl(.048, .048, .026, 10), NORI, x, yy, z, 0, 0, tilt);
        add(G.cyl(.041, .041, .006, 8), RICE, x - Math.sin(tilt) * .013, yy + Math.cos(tilt) * .013, z, 0, 0, tilt);
        for (const [u, v, w, h, c] of [[0, .012, .026, .013, '#ffd84a'], [-.016, -.008, .013, .018, '#ff9a3c'], [.016, -.006, .013, .018, '#4ea85a']])
          add(G.box(w, .006, h, .002), c, x - Math.sin(tilt) * .017 + u * Math.cos(tilt), yy + Math.cos(tilt) * .017 + u * Math.sin(tilt), z - v, 0, 0, tilt);
      }
    }));
    return g;
  } },
  // 삼각김밥: a triangle onigiri in its konbini wrapper — nori band, red tear strip, a ツナマヨ label
  // 삼각김밥: a konbini onigiri (10/29 2차 — 6판 "못 알아봤다", then "이거 맞아?": standing up, the shelf camera only saw its
  // white top edge): the classic face — a puffy rice triangle, the black nori sheet at the bottom middle wrapping round under
  // it to the back, the red tear strip from the tip down to the nori, the flavour label on the nori — leaning back a little so
  // that face looks up at the shelf camera
  onigiri: { name: '삼각김밥', h: .16, build() {
    const g = grp(), lie = grp(); put(lie, 0, .024, 0, -.55, 0, 0); g.add(lie);
    lie.add(mc('it-onigiri4', ({ add }) => {
      const W = .2, H = .17, D = .06, NW = .1, NH = .085, Z0 = -D / 2;
      add(G.ext(triShape(W, H, .055, 0), D, .014, 6), RICE, 0, 0, Z0);
      add(G.box(NW, NH, .005, .003), NORI, 0, NH / 2 + .002, Z0 + D + .016);                           // the nori, front
      add(G.box(NW, NH * .7, .005, .003), NORI, 0, NH * .35 + .002, Z0 - .016);                        // and round the back
      add(G.box(NW, .006, D + .03, .003), NORI, 0, -.012, 0);                                            // under the bottom
      add(G.box(.014, H - NH - .03, .004, .002), TOMATO, 0, NH + (H - NH - .03) / 2, Z0 + D + .016);  // the red tear strip
      add(G.box(.026, .018, .004, .003), TOMATO, 0, H - .006, Z0 + D + .016);
    }));
    lie.add(mg('it-onigiri-label', atlasMat(), ({ add }) => add(quadGeo(.075, .038, RG.oni), 0, .045, -.03 + .06 + .021)));
    return g;
  } },
  // 회오리 감자 (10/29, 2차 — the thin ribbon read as a drill): a tornado potato as the stall sells it — one potato cut in a
  // spiral and fanned out along the stick, so it shows as a row of round golden chips all leaning the same way, each with a
  // toasted rim and a dusting of red seasoning; the stick out at both ends
  fishcake: { name: '회오리 감자', h: .1, flat: true, build() {
    const g = grp(), Y = .07, N = 11, X0 = -.13, DX = .026;
    g.add(mc('it-tornado2', ({ add }) => {
      add(G.cyl(.008, .008, .42, 6), '#e8c690', -.03, Y, 0, 0, 0, HP); add(G.cone(.008, .03, 6), '#e8c690', .195, Y, 0, 0, 0, -HP);
      for (let k = 0; k < N; k++) {
        const x = X0 + k * DX, r = .062 - Math.abs(k - (N - 1) / 2) * .0035, spin = 0;
        add(G.cyl(r, r, .007, 28), k % 2 ? '#f6c650' : '#f9d469', x, Y, 0, spin, 0, HP - .5);
        add(G.cyl(r + .004, r + .004, .004, 28), '#d68b2c', x - .006, Y, 0, spin, 0, HP - .5);   // the toasted rim, just behind
      }
      for (let k = 1; k < N; k += 2) { const x = X0 + k * DX; for (const [a, rr] of [[.4, .035], [2.3, .045], [4.1, .03]]) add(G.sph(.006, 5, 3), '#e2552d', x + .01, Y + Math.cos(a) * rr, Math.sin(a) * rr, 0, 0, 0, [.5, 1, 1]); }
    }));
    return g;
  } },
  // 접은 우산: a folded sky umbrella with a strap, a steel tip and a wooden J handle, lying on its side
  umbrella: { name: '접은 우산', h: .09, flat: true, build() {
    if ((globalThis.__sbkStage ?? -1) >= 18) return umbrellaLate();
    // a folded umbrella lying down: a fat pleated canopy (eight folds) in yellow with white dots, wound with its strap, a
    // metal tip and a brown crook handle (10/20 "야매한 것들": a thin stick nobody read as an umbrella)
    const g = grp(), uc = '#ffc93a', y = .045, X = .04;
    const P = [[0, -.158], [.014, -.155], [.03, -.13], [.043, -.09], [.041, -.02], [.033, .05], [.021, .11], [.008, .145], [0, .147]];
    const rAt = ly => { for (let i = 1; i < P.length; i++) if (ly <= P[i][1]) { const [r0, y0] = P[i - 1], [r1, y1] = P[i]; return r0 + (r1 - r0) * (ly - y0) / (y1 - y0); } return 0; };
    // (10/21 2차, ① 모델 품질: a stroke at the start view — the folded canopy now lies a little squashed, half again as wide
    // as it is tall, and the crook is thicker; the height (flat, .09) is the same)
    const SZ = 1.45;
    g.add(mc('it-umbrella3', ({ add, addM }) => {
      add(G.lathe(P, 8), uc, X, y, 0, 0, 0, -HP, [1, 1, SZ]);
      for (const [x, a] of [[-.06, .5], [.0, -1.2], [.06, 1.1], [.11, -.3], [-.03, 2.4], [.08, 2.9]]) { const r = rAt(x - X) * .93; add(G.sph(.013, 5, 3), WHITE, x, y + Math.cos(a) * r, Math.sin(a) * r * SZ); }
      add(G.tor(.04, .008, PI * 2, 4, 12), shade(uc, -.22), .02, y, 0, 0, HP, 0, [1, 1, SZ]);
      add(G.box(.02, .012, .02, .004), '#ffffff', .02, y + .042, 0);
      add(G.cone(.009, .055, 6), STEEL, .215, y, 0, 0, 0, -HP);
      add(G.cyl(.009, .009, .057, 8), STEEL, -.1465, y, 0, 0, 0, HP);
      add(G.cyl(.02, .02, .045, 8), BROWN, -.195, y, 0, 0, 0, HP);
      addM(G.tor(.05, .02, PI, 4, 9), new THREE.Matrix4().makeTranslation(-.215, y, -.05).multiply(new THREE.Matrix4().makeRotationY(-HP)).multiply(new THREE.Matrix4().makeRotationX(HP)), BROWN);
      add(G.sph(.02, 6, 4), BROWN, -.215, y, -.1);
    }));
    return g;
  } },
};

// 접은 우산 19판~ (⑩ 10/29 실폰 "숨겨진 물건들도 다 디테일이 떨어지고": from the start camera it read as a flat yellow leaf) — the
// same folded canopy, now pleated: eight darker fold seams down its length and white dots between them, a red strap with a
// white snap wound round its middle, a longer steel tip and ferrule, and a big glossy brown crook handle lying flat beside it.
// Height and footprint as before (flat, .09). 1~18판 keep the old one.
function umbrellaLate() {
  const g = grp(), uc = '#ffc93a', y = .045, X = .04, SZ = 1.85;
  const P = [[0, -.158], [.014, -.155], [.03, -.13], [.043, -.09], [.041, -.02], [.033, .05], [.021, .11], [.008, .145], [0, .147]];
  const rAt = ly => { for (let i = 1; i < P.length; i++) if (ly <= P[i][1]) { const [r0, y0] = P[i - 1], [r1, y1] = P[i]; return r0 + (r1 - r0) * (ly - y0) / (y1 - y0); } return 0; };
  g.add(mc('it-umbrella6', ({ add, addM, tube }) => {
    add(G.lathe(P, 8), uc, X, y, 0, 0, 0, -HP, [1, 1, SZ]);
    for (let k = 0; k < 8; k++) { const a = (k + .5) * PI / 4, pts = []; for (let i = 0; i <= 6; i++) { const lx = -.13 + i * .043, r = rAt(lx) * 1.01; pts.push([X + lx, y + Math.cos(a) * r, Math.sin(a) * r * SZ]); } for (let i = 0; i < 6; i++) tube(pts[i], pts[i + 1], .004, shade(uc, -.25), 4); }
    for (const [x, a] of [[-.07, .2], [-.02, 1.0], [.03, -.4], [.08, .6], [.12, -1.0], [-.04, -.8], [.05, 1.8]]) { const r = rAt(x - X) * .98; add(G.sph(.011, 5, 3), WHITE, x, y + Math.cos(a) * r, Math.sin(a) * r * SZ); }
    add(G.tor(.037, .009, PI * 2, 5, 14), '#e8504a', .01, y, 0, 0, HP, 0, [1, 1, SZ]);
    add(G.cyl(.011, .011, .006, 10), '#ffffff', .01, y + .044, 0);
    add(G.cone(.01, .07, 6), STEEL, .225, y, 0, 0, 0, -HP);
    add(G.cyl(.01, .01, .06, 8), STEEL, -.15, y, 0, 0, 0, HP);
    add(G.cyl(.024, .024, .05, 10), '#7a4a2a', -.2, y, 0, 0, 0, HP);
    addM(G.tor(.07, .026, PI, 5, 12), new THREE.Matrix4().makeTranslation(-.225, y, -.07).multiply(new THREE.Matrix4().makeRotationY(-HP)).multiply(new THREE.Matrix4().makeRotationX(HP)), '#7a4a2a');
    add(G.sph(.026, 8, 6), '#7a4a2a', -.225, y, -.14);
    add(G.box(.012, .006, .03, .002), '#ffffff', -.2, y + .024, 0);
  }));
  return g;
}

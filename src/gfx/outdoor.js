// Outdoor props for the alley (골목길), park (공원·놀이터) and campsite (산·캠핑) stages, plus ground textures and
// diorama boundaries. Same contract as furniture.js:
//   builder(f, T, opts) fills a Furn. Origin = footprint centre on the ground, the piece faces +z, back toward -z.
//   Wall pieces (wall: true) hang on a wall's inner face: origin at the face, floor height, +z into the scene.
//   parts open/lift/slide, spots: inside (needs its part open) | under/behind (visible but tucked) | on (in plain sight).
// Lockable parts carry p.lockable = true and p.lockKind ('pad' | 'code') as a hint for the stage planner.
// Toy-set rules: big chunky silhouettes, few meshes (decor is merged into one mesh per colour), theme colours where
// they make sense, fixed iconic colours where the object is iconic (빨간 대야, 초록 대문, 주황 라바콘).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rbox, sph, hemi, cyl, tor, cone, cap, disc, plane, put, grp, mat, mesh, geo, extrude, canvasTex, texCache, roundRect, shade } from './kit.js';
import { clothBend, clothWave, clothSlab } from './clothbend.js';
import { Furn } from './furniture.js';
import { rng } from '../util.js';
import { tr } from '../i18n.js';

const PI = Math.PI, HP = PI / 2, DS = THREE.DoubleSide;

// Fallback palette for theme keys outdoor themes may not define.
const K = {
  rubber: '#ff4f4a', onggi: '#97553a', concrete: '#d9d3ca', stone: '#d2cabe', gate: '#2fa36b', brick: '#d9745a',
  plaster: '#f4e8d4', roofTile: '#557495', styro: '#f8f7f1', soil: '#7a5536', leaf: '#5fc45a', leaf2: '#8be06f',
  bark: '#8f5d3b', sand: '#f3d28a', grass: '#8fd46a', dirt: '#c99a6b', asphalt: '#7d7b8e', rock: '#aaa5bd',
  tent: '#ff9b3d', tent2: '#ffd23f', fence: '#fff3df', hedge: '#4fb85a', vend: '#ff4d5e', bin: '#3f9a6e', pine: '#2f9d63',
};
const col = (T, k) => (T && T[k]) || K[k];

// ── geometry helpers ────────────────────────────────────────────────────────────────────────────────────────────
const Y = new THREE.Vector3(0, 1, 0);
const G = {
  box: (w, h, d, r = .02) => { r = Math.min(r, Math.min(w, h, d) * .45); return r > .004 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d); },
  sph: (r, ws = 14, hs = 10) => new THREE.SphereGeometry(r, ws, hs),
  cyl: (rt, rb, h, seg = 14, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open),
  cone: (r, h, seg = 14) => new THREE.ConeGeometry(r, h, seg),
  cap: (r, len) => new THREE.CapsuleGeometry(r, len, 4, 10),
  tor: (R, t, arc = PI * 2) => new THREE.TorusGeometry(R, t, 8, 20, arc),
};
// One mesh from many pieces of one colour (cached by key). fn gets { add, addM, tube }.
function mg(key, color, fn, o) {
  const g = geo('omg|' + key, () => {
    const list = [];
    const addM = (src, m) => {
      const c = src.index ? src.toNonIndexed() : src.clone();
      for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') c.deleteAttribute(k);
      c.applyMatrix4(m); list.push(c);
    };
    const add = (src, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => addM(src, new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(s[0], s[1], s[2])));
    const tube = (a, b, r, seg = 10, r2 = r) => {
      const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length();
      addM(new THREE.CylinderGeometry(r2, r, L, seg), new THREE.Matrix4().compose(A.clone().add(Bv).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(Y, d.normalize()), new THREE.Vector3(1, 1, 1)));
    };
    fn({ add, addM, tube });
    return mergeGeometries(list, false);
  });
  return mesh(g, mat(color, o));
}
function lathe(key, pts, color, o, seg = 24) {
  return mesh(geo('ola|' + key, () => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg)), mat(color, { side: DS, ...o }));
}
// Extrusion that keeps the shape's own origin (for pivots), small bevel.
function extrudeRaw(key, shape, depth, color, o) {
  return mesh(geo('oex|' + key, () => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 1, curveSegments: 8 })), mat(color, o));
}
// Chunky low-poly boulder, bottom flattened so it sits on the ground at y = -0.55 (unit size).
function rockGeo(seed) {
  return geo('orock|' + seed, () => {
    const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position, v = new THREE.Vector3(), r = rng(seed), seen = new Map();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const k = v.x.toFixed(3) + ',' + v.y.toFixed(3) + ',' + v.z.toFixed(3);
      let s = seen.get(k); if (s == null) { s = .84 + r() * .28; seen.set(k, s); }
      v.multiplyScalar(s); if (v.y < -.55) v.y = -.55 - (v.y + .55) * .12;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
}
function hollowBox(add, W, H, D, t, x, y, z, { top = false, front = true } = {}) {
  const r = t * .4;
  add(G.box(W, t, D, r), x, y + t / 2, z);
  add(G.box(W, H, t, r), x, y + H / 2, z - D / 2 + t / 2);
  if (front) add(G.box(W, H, t, r), x, y + H / 2, z + D / 2 - t / 2);
  add(G.box(t, H, D, r), x - W / 2 + t / 2, y + H / 2, z);
  add(G.box(t, H, D, r), x + W / 2 - t / 2, y + H / 2, z);
  if (top) add(G.box(W, t, D, r), x, y + H - t / 2, z);
}

// One shared minimal face for the few friendly props (우편함, 자판기, 공원 쓰레기통, 텐트): two dot eyes with a white
// highlight and a tiny smile, sitting on a flat front that faces +z. Never used on hideable items.
function face(x, y, z, s = 1, ry = 0) {
  const g = new THREE.Group();
  g.add(mg('face-dark', '#2a1d33', ({ add }) => {
    for (const sx of [-1, 1]) add(G.sph(.03, 12, 10), sx * .065, 0, 0, 0, 0, 0, [1, 1.15, .45]);
    add(new THREE.TorusGeometry(.024, .0075, 6, 12, PI), 0, -.042, .004, 0, 0, PI);
  }));
  g.add(mg('face-hi', '#ffffff', ({ add }) => { for (const sx of [-1, 1]) add(G.sph(.011, 8, 6), sx * .065 - .009, .012, .012); }));
  return put(g, x, y, z, 0, ry, 0, s);
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
// draw something at (x, y) and at its wrapped copies so the texture tiles seamlessly
const wrap = (S, x, y, m, fn) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { const X = x + dx, Y2 = y + dy; if (X > -m && X < S + m && Y2 > -m && Y2 < S + m) fn(X, Y2); } };

// (10/22 밤 사용자 "돗자리 줄무늬도 과함": a straw mat in fine faint weave with one soft green edge — the thick green and red
// double border is gone)
const dotjariTex = () => tex('dotjari', 256, 160, (c, w, h) => {
  c.fillStyle = '#f1dca0'; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(170,125,40,.16)'; c.lineWidth = 1;
  for (let x = 4; x < w; x += 7) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  c.strokeStyle = '#86c9a2'; c.lineWidth = 4; c.strokeRect(5, 5, w - 10, h - 10);
});
// a plastic mesh food cover (망사 상보): pink with a fine white lattice, tiled round the dome
const meshCoverTex = () => tex('meshcover', 128, 128, (c, w, h) => {
  c.fillStyle = '#ff9fbd'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffe6ef'; for (let i = 0; i < w; i += 8) { c.fillRect(i, 0, 2, h); c.fillRect(0, i, w, 2); }
}, { repeat: [5, 2] });
const slipperTex = () => tex('slipper', 64, 64, (c, w, h) => { c.fillStyle = '#2f6fe0'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) c.fillRect(0, 4 + i * 9, w, 4.5); });
const washboardTex = () => tex('washboard', 96, 160, (c, w, h) => {
  c.fillStyle = '#e8b67c'; c.fillRect(0, 0, w, h);
  for (let y = 22; y < h - 14; y += 7) { c.fillStyle = '#f6d3a2'; c.fillRect(8, y, w - 16, 3.5); c.fillStyle = '#c98f58'; c.fillRect(8, y + 3.5, w - 16, 2); }
});
const onggiTex = base => tex('onggi|' + base, 256, 128, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, shade(base, -.04)); g.addColorStop(.6, base); g.addColorStop(1, shade(base, .03));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = shade(base, .14); c.lineWidth = 3.2;
  for (const yy of [.6, .67]) { c.beginPath(); for (let x = 0; x <= w; x += 2) { const y = h * yy + Math.sin(x / w * PI * 12) * 3.5; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
});
const hazardTex = () => tex('hazard', 128, 64, (c, w, h) => {
  c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2433';
  for (let x = -h; x < w + h; x += 16) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 8, h); c.lineTo(x + 8 + h, 0); c.lineTo(x + h, 0); c.fill(); }
});
const flyerTex = kind => tex('flyer|' + kind, 256, 336, (c, w, h) => {
  if (kind === 'dog') {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    txt(c, '강아지를', w / 2, 14, 15, '#ff4f5e'); txt(c, '찾아요!', w / 2, 30, 15, '#ff4f5e');
    c.fillStyle = '#f2d1a0'; blob(c, w / 2, 62, 17); c.fillStyle = '#b77b4a'; c.beginPath(); c.ellipse(w / 2 - 15, 54, 6, 11, .3, 0, 7); c.fill(); c.beginPath(); c.ellipse(w / 2 + 15, 54, 6, 11, -.3, 0, 7); c.fill();
    c.fillStyle = '#2a1d33'; blob(c, w / 2 - 6, 60, 2.2); blob(c, w / 2 + 6, 60, 2.2); blob(c, w / 2, 67, 3);
    txt(c, '이름: 몽이', w / 2, 92, 10, '#3b2a55');
    c.strokeStyle = '#c9c3d9'; c.lineWidth = 1;
    for (let i = 0; i < 7; i++) { const x = 6 + i * 16.5; c.strokeRect(x, 112, 14, 50); c.save(); c.translate(x + 7, 137); c.rotate(-HP); txt(c, '010-1234', 0, 0, 7, '#5b4270'); c.restore(); }
  } else if (kind === 'tutor') {
    c.fillStyle = '#fff1a0'; c.fillRect(0, 0, w, h);
    txt(c, '수학', w / 2, 30, 26, '#2f6fe0'); txt(c, '과외', w / 2, 60, 26, '#2f6fe0');
    txt(c, '1:1 꼼꼼!', w / 2, 92, 13, '#3b2a55'); c.fillStyle = '#ff6f91'; c.fillRect(14, 112, w - 28, 22); txt(c, '010-0000', w / 2, 123, 12, '#ffffff');
  } else {
    c.fillStyle = '#ffd9e6'; c.fillRect(0, 0, w, h);
    txt(c, '원룸', w / 2, 32, 30, '#e8455f'); txt(c, '월세', w / 2, 66, 22, '#3b2a55');
    c.fillStyle = '#ffffff'; c.fillRect(16, 88, w - 32, 40); txt(c, '역세권', w / 2, 108, 14, '#e8455f');
  }
}, { text: true });
const mailDoorTex = (n, door) => tex('mail|' + n + door, 256, 192, (c, w, h) => {
  c.fillStyle = door; c.fillRect(0, 0, w, h);
  c.fillStyle = shade(door, -.18); roundRect(c, 20, 14, w - 40, 7, 3); c.fill();
  c.fillStyle = '#ffffff'; roundRect(c, 30, 40, w - 60, 34, 7); c.fill();
  txt(c, n, w / 2, 58, 22, '#3b2a55');
}, { text: true });
const gateTex = base => tex('gate|' + base, 512, 1024, (c, w, h) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  const hi = shade(base, .12), lo = shade(base, -.1);
  c.strokeStyle = hi; c.lineWidth = 10; c.strokeRect(12, 12, w - 24, h - 24);
  c.strokeStyle = lo; c.lineWidth = 4; c.strokeRect(22, 22, w - 44, h - 44);
  // sunrise fan at the top (classic 철대문 pattern)
  c.save(); c.beginPath(); c.rect(26, 26, w - 52, 140); c.clip();
  c.strokeStyle = hi; c.lineWidth = 6;
  for (let i = 0; i <= 8; i++) { const a = PI + i * PI / 8; c.beginPath(); c.moveTo(w / 2, 160); c.lineTo(w / 2 + Math.cos(a) * 200, 160 + Math.sin(a) * 200); c.stroke(); }
  c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(w / 2, 160, 34, PI, 0); c.fill();
  c.restore();
  c.fillStyle = hi; c.fillRect(26, 166, w - 52, 10);
  for (const y0 of [196, 352]) { c.strokeStyle = hi; c.lineWidth = 6; c.strokeRect(46, y0, w - 92, 130); c.fillStyle = lo; c.beginPath(); c.moveTo(w / 2, y0 + 22); c.lineTo(w / 2 + 34, y0 + 65); c.lineTo(w / 2, y0 + 108); c.lineTo(w / 2 - 34, y0 + 65); c.fill(); }
  c.fillStyle = shade(base, .2); for (let y = 40; y < h - 30; y += 46) { blob(c, 32, y, 3.5); blob(c, w - 32, y, 3.5); }
});
const milkTex = () => tex('milk', 192, 192, (c, w, h) => { c.fillStyle = '#ffe14d'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffffff'; roundRect(c, 10, 22, w - 20, 50, 10); c.fill(); txt(c, '우유', w / 2, 48, 26, '#2f6fe0'); }, { text: true });
const nameTex = () => tex('nameplate', 256, 128, (c, w, h) => { c.fillStyle = '#c98f58'; c.fillRect(0, 0, w, h); c.fillStyle = '#f6dcb4'; roundRect(c, 6, 6, w - 12, h - 12, 6); c.fill(); txt(c, '행복한 집', w / 2, h / 2 + 1, 20, '#5a3420'); }, { text: true });
const bellTex = () => tex('bell', 96, 128, (c, w, h) => { c.fillStyle = '#f4f4f6'; c.fillRect(0, 0, w, h); c.fillStyle = '#3b3550'; roundRect(c, 10, 8, w - 20, 16, 4); c.fill(); c.fillStyle = '#ff5a5a'; blob(c, w / 2, 44, 9); });
const shopSignTex = () => tex('shopsign', 512, 96, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#2f6fe0'; c.fillRect(0, h - 8, w, 8); c.fillRect(0, 0, w, 4);
  txt(c, '행복슈퍼', w / 2, h / 2 - 1, 34, '#ff3b4e', { stroke: '#ffffff', sw: 6 });
  c.fillStyle = '#ffd23f'; blob(c, 30, h / 2, 13); blob(c, w - 30, h / 2, 13);
  txt(c, '★', 30, h / 2 + 1, 14, '#ff3b4e'); txt(c, '★', w - 30, h / 2 + 1, 14, '#ff3b4e');
}, { text: true });
const shutterTex = () => tex('shutter', 256, 256, (c, w, h) => {
  c.fillStyle = '#c9d3dd'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 9) { c.fillStyle = '#e4ebf1'; c.fillRect(0, y, w, 3); c.fillStyle = '#a9b5c2'; c.fillRect(0, y + 6, w, 2); }
  c.fillStyle = '#8e9aa8'; c.fillRect(0, h - 12, w, 12);
  c.fillStyle = '#5b6474'; roundRect(c, w / 2 - 14, h - 24, 28, 9, 4); c.fill();
  c.save(); c.translate(w * .68, h * .38); c.rotate(-.06);
  c.fillStyle = '#fffbe8'; c.fillRect(-36, -26, 72, 52); c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(-12, -31, 24, 9);
  txt(c, '잠시', 0, -10, 15, '#e8455f'); txt(c, '외출중', 0, 10, 15, '#3b2a55');
  c.restore();
}, { text: true });
const tobaccoTex = () => tex('tobacco', 256, 256, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff3b4e'; blob(c, w / 2, h / 2, w / 2 - 6); txt(c, '담배', w / 2, h / 2 + 2, 30, '#ffffff'); }, { text: true });
const vendTex = () => tex('vend', 512, 648, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ff4d5e'; roundRect(c, 8, 8, w - 16, 40, 10); c.fill();
  txt(c, '시원한 음료', w / 2, 29, 21, '#ffffff');
  const g = c.createLinearGradient(0, 56, 0, 252); g.addColorStop(0, '#bfe6ff'); g.addColorStop(1, '#e9f7ff');
  c.fillStyle = g; roundRect(c, 12, 56, w - 24, 196, 10); c.fill();
  const cans = ['#ff4d5e', '#4fb8ff', '#ffd23f', '#7bd96a', '#ff9f43', '#b48cff'];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) {
    const x = 26 + i * 25, y = 66 + r * 62;
    c.fillStyle = cans[(r * 4 + i) % 6]; roundRect(c, x, y, 18, 36, 5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + 3, y + 6, 4, 22);
    c.fillStyle = '#ff4d5e'; blob(c, x + 9, y + 47, 4);
  }
  c.fillStyle = '#d7dde6'; roundRect(c, 12, 262, w - 24, 48, 8); c.fill();
  c.fillStyle = '#3b3550'; roundRect(c, 26, 278, 6, 20, 3); c.fill(); roundRect(c, 46, 282, 40, 10, 4); c.fill();
  txt(c, '700원', 100, 288, 16, '#3b2a55', { align: 'left' });
});
const flapTex = () => tex('vflap', 256, 128, (c, w, h) => { c.fillStyle = '#4a4e66'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, 0, w, h * .4); txt(c, '꺼내는 곳', w / 2, h / 2 + 2, 14, '#ffffff'); }, { text: true });
// (10/22 밤 사용자 "글자가 상자 면보다 크고 모서리를 넘어가 '싱싱수산'이 잘림": the word shrinks until it fits with a margin)
const styroLabelTex = (s, color) => tex('styro2|' + s, 384, 128, (c, w, h) => {
  c.fillStyle = '#f8f7f1'; c.fillRect(0, 0, w, h);
  let px = 36; c.font = FONT(px); while (px > 12 && c.measureText(tr(s)).width > w * .8) { px -= 2; c.font = FONT(px); }
  txt(c, s, w / 2, h / 2 + 2, px, color, { stroke: color, sw: 2 });
}, { text: true });
const crateTex = () => tex('crate', 256, 192, (c, w, h) => { c.fillStyle = '#ff5a4e'; c.fillRect(0, 0, w, h); c.fillStyle = '#c93a32'; for (let y = 12; y < h - 10; y += 22) for (let x = 10; x < w - 10; x += 22) { roundRect(c, x, y, 14, 14, 4); c.fill(); } });
const wickerTex = () => tex('wicker', 256, 256, (c, w, h) => {
  c.fillStyle = '#d9a35e'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 16) { c.fillStyle = (x / 16 + y / 12) % 2 ? '#e8bd7c' : '#c98c48'; roundRect(c, x + 1, y + 1, 14, 10, 4); c.fill(); }
});
// (10/22 밤 사용자 "띠 글자 '량제'·'종량'처럼 잘림": the word on its own flat label on the bag's front, never round a curve)
const bagLabelTex = () => tex('baglabel', 256, 112, (c, w, h) => {
  c.fillStyle = '#ff8a3c'; roundRect(c, 2, 2, w - 4, h - 4, 9); c.fill();
  c.fillStyle = '#ffffff'; roundRect(c, 8, h - 17, w - 16, 11, 4); c.fill();
  txt(c, '종량제', w / 2, h * .38, 25, '#ffffff', { stroke: '#e0601a', sw: 3 });
  txt(c, '일반 쓰레기 20L', w / 2, h - 11.5, 8, '#e0601a');
}, { text: true });
// the bag's plastic: soft grey creases running up to the neck and a long shine, round the lathe
const bagSkinTex = () => tex('bagskin', 256, 128, (c, w, h) => {
  c.fillStyle = '#f7f6f2'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 9; i++) { const x = (i + .3 * Math.sin(i * 2.7)) * w / 9; const g = c.createLinearGradient(x - 6, 0, x + 6, 0); g.addColorStop(0, 'rgba(150,152,170,0)'); g.addColorStop(.5, 'rgba(150,152,170,.32)'); g.addColorStop(1, 'rgba(150,152,170,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 6, h); c.lineTo(x + 6, h); c.lineTo(x + 2, 0); c.lineTo(x - 2, 0); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(w * .18, h * .25, 5, h * .5);
});
const noDumpTex = () => tex('nodump', 320, 224, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ff3b4e'; c.lineWidth = 4; c.strokeRect(5, 5, w - 10, h - 10);
  txt(c, '쓰레기', w / 2, h * .25, 22, '#3b2a55'); txt(c, '무단투기', w / 2, h * .53, 30, '#ff3b4e'); txt(c, '금지!', w / 2, h * .8, 26, '#ff3b4e');
}, { text: true });
const flowerTex = () => tex('ibul', 256, 384, (c, w, h) => {
  c.fillStyle = '#ff5f8f'; c.fillRect(0, 0, w, h);
  const r = rng(4);
  for (let i = 0; i < 16; i++) {
    const x = r() * w, y = r() * h, s = 18 + r() * 14;
    c.fillStyle = '#5fc45a'; c.beginPath(); c.ellipse(x + s * .9, y + s * .5, s * .5, s * .22, .5, 0, 7); c.fill();
    c.fillStyle = r() < .5 ? '#ffffff' : '#ffd23f';
    for (let k = 0; k < 6; k++) { const a = k * PI / 3; blob(c, x + Math.cos(a) * s * .5, y + Math.sin(a) * s * .5, s * .38); }
    c.fillStyle = '#e8455f'; blob(c, x, y, s * .3);
  }
  c.fillStyle = '#ffd9e6'; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 10, w, 10);
});
const basketTex = () => tex('lbasket', 256, 192, (c, w, h) => { c.fillStyle = '#ff9ec2'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe3ee'; for (let y = 14; y < h - 8; y += 18) for (let x = 8; x < w - 6; x += 15) { roundRect(c, x, y, 9, 11, 4); c.fill(); } });
const newsTex = () => tex('news', 384, 256, (c, w, h) => {
  c.fillStyle = '#eeeadf'; c.fillRect(0, 0, w, h);
  txt(c, '오늘의 뉴스', w / 2, 16, 18, '#2a2433'); c.fillStyle = '#2a2433'; c.fillRect(8, 28, w - 16, 2);
  c.fillStyle = '#b9b4c4'; c.fillRect(10, 38, 66, 46);
  c.fillStyle = '#9a96a6'; for (let i = 0; i < 9; i++) c.fillRect(84, 38 + i * 9, w - 96, 4); for (let i = 0; i < 4; i++) c.fillRect(10, 92 + i * 9, w - 22, 4);
}, { text: true });
const binLabelTex = () => tex('binlabel', 512, 160, (c, w, h) => {
  c.fillStyle = '#5b6474'; roundRect(c, 2, 2, w / 2 - 4, h - 4, 10); c.fill(); c.fillStyle = '#2f7fe0'; roundRect(c, w / 2 + 2, 2, w / 2 - 4, h - 4, 10); c.fill();
  txt(c, '일반쓰레기', w / 4, h / 2 + 1, 19, '#ffffff'); txt(c, '재활용', w * .75, h / 2 + 1, 22, '#ffffff');
}, { text: true });
const barkTex = base => tex('bark|' + base, 256, 256, (c, w, h) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h); c.strokeStyle = shade(base, -.09); c.lineWidth = 1.8;
  for (let x = 5; x < w; x += 10) { c.beginPath(); for (let y = 0; y <= h; y += 8) { const xx = x + Math.sin(y * .11 + x) * 2.5; y ? c.lineTo(xx, y) : c.moveTo(xx, y); } c.stroke(); }
});
const ringsTex = () => tex('rings', 256, 256, (c, w, h) => {
  c.fillStyle = '#f2c98f'; c.fillRect(0, 0, w, h); c.strokeStyle = '#d9a466'; c.lineWidth = 2.6;
  for (let r = 8; r < 60; r += 9) { c.beginPath(); c.arc(w / 2 + 2, h / 2 - 1, r, 0, PI * 2); c.stroke(); }
  c.strokeStyle = '#a8703f'; c.lineWidth = 5; c.beginPath(); c.arc(w / 2, h / 2, 61, 0, PI * 2); c.stroke();
});
const plaidTex = () => tex('plaid', 256, 256, (c, w, h) => {
  c.fillStyle = '#e8455f'; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(60,30,70,.45)'; for (let x = 0; x < w; x += 32) { c.fillRect(x + 10, 0, 12, h); c.fillRect(0, x + 10, w, 12); }
  c.fillStyle = 'rgba(255,255,255,.5)'; for (let x = 0; x < w; x += 32) { c.fillRect(x + 26, 0, 2, h); c.fillRect(0, x + 26, w, 2); }
});
const slatTex = () => tex('slat', 256, 192, (c, w, h) => { c.fillStyle = '#efc28c'; c.fillRect(0, 0, w, h); c.fillStyle = '#c98f58'; for (let y = 0; y < h; y += 16) c.fillRect(0, y, w, 2.5); });
const doorPortholeTex = base => tex('cubby|' + base, 256, 320, (c, w, h) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffffff'; blob(c, w / 2, 52, 27); c.fillStyle = '#bfe6ff'; blob(c, w / 2, 52, 21);
  c.fillStyle = 'rgba(255,255,255,.8)'; blob(c, w / 2 - 7, 45, 6);
  c.fillStyle = '#ffd23f'; roundRect(c, w / 2 + 22, 100, 10, 26, 5); c.fill();
});
const stoneTex = () => tex('stone', 512, 256, (c, w, h) => {
  c.fillStyle = '#b6aca0'; c.fillRect(0, 0, w, h); const r = rng(8);
  for (let y = 0; y < h; y += 26) for (let x = -(y / 26 % 2) * 20; x < w; x += 40 + r() * 10) { c.fillStyle = r.pick(['#d6cdc1', '#cfc5b8', '#ddd5ca', '#c7bcae']); roundRect(c, x + 2, y + 2, 36 + r() * 8, 22, 7); c.fill(); }
});
function brickRows(c, x0, y0, w, h, bw, bh, cols, mortar, seed) {
  const r = rng(seed); c.fillStyle = mortar; c.fillRect(x0, y0, w, h);
  for (let j = 0; j * bh < h; j++) for (let x = -(j % 2) * bw / 2; x < w; x += bw) { c.fillStyle = r.pick(cols); roundRect(c, x0 + x + 1.2, y0 + j * bh + 1.2, bw - 2.4, bh - 2.4, 2); c.fill(); }
}
const pillarTex = brick => tex('pillar|' + brick, 96, 640, (c, w, h) => brickRows(c, 0, 0, w, h, 24, 12, [brick, shade(brick, .05), shade(brick, -.05)], '#efe3d3', 3));

// ═════════════════════════════════════════════ ALLEY ═════════════════════════════════════════════
const B = {};

// 빨간 고무 대야 + 빨래판 + 엎어 둔 바가지
B.daeya = (f, T) => {
  const red = col(T, 'rubber'), bx = -.1, bz = -.08;
  f.add(put(lathe('daeya', [[0, 0], [.29, 0], [.34, .03], [.4, .26], [.43, .29], [.43, .335], [.385, .335], [.355, .285], [.3, .065], [0, .065]], red), bx, 0, bz));
  f.add(put(rbox(.28, .46, .035, '#ffffff', .02, { map: washboardTex() }), bx + .05, .25, bz - .22, -.45, .1, 0));
  const heap = grp(
    put(sph(.2, '#ff9ec2'), -.07, 0, .03, 0, .4, 0, [1.05, .42, .85]),
    put(sph(.16, '#7fd0ff'), .1, .06, -.04, .2, -.3, .1, [1, .48, .9]),
    put(cap(.045, .15, '#ffffff'), 0, .1, .1, HP, .7, 0));
  put(heap, bx, .14, bz + .06); f.add(heap);
  const hp = f.part('lift', heap, (t, b) => { heap.position.y = b.p.y + .46 * t; heap.position.z = b.p.z + .16 * t; heap.rotation.x = -.4 * t; heap.rotation.z = .22 * t; }, { label: '빨래', sfx: 'lift' });
  f.spot('inside', null, bx, .065, bz + .08, { part: hp, maxH: .32, label: '대야 안' });
  const dip = grp(put(hemi(.15, '#4fb8ff'), 0, 0, 0, 0, 0, 0, [1, .72, 1]), put(cap(.032, .12, '#4fb8ff'), .19, .035, 0, 0, 0, HP - .15));
  put(dip, .33, 0, .33, 0, -.6, 0); f.add(dip);
  const dp = f.part('lift', dip, (t, b) => { dip.position.y = b.p.y + .3 * t; dip.position.x = b.p.x + .05 * t; dip.rotation.z = -.8 * t; }, { label: '바가지', sfx: 'lift' });
  f.spot('inside', null, .33, 0, .33, { part: dp, maxH: .22, label: '바가지 밑', scale: .72 });
};

// 평상: slatted platform, 돗자리, 방석, 소반 with a plate of watermelon, two cups of barley tea and a pink mesh food cover (망사 상보 —
// 10/22 밤 사용자 "줄무늬 돔 + 빨간 소반: 뭔지 안 읽힘": the patchwork dome read as nothing), 삼선 슬리퍼
B.pyeongsang = (f, T) => {
  const wood = T.wood || '#ecc08a', woodD = T.woodD || '#c98f58', top = .42, zc = -.07, D = .8;
  f.add(mg('pys-top', wood, ({ add }) => { for (let i = 0; i < 5; i++) add(G.box(1.88, .06, D / 5 - .018, .02), 0, top - .03, zc - D / 2 + D / 10 + i * D / 5); }));
  f.add(mg('pys-frame', woodD, ({ add }) => {
    for (const x of [-.86, 0, .86]) for (const z of [zc - D / 2 + .07, zc + D / 2 - .07]) add(G.box(.1, top - .06, .1, .025), x, (top - .06) / 2, z);
    for (const z of [zc - D / 2 + .05, zc + D / 2 - .05]) add(G.box(1.8, .07, .05, .02), 0, top - .095, z);
  }));
  f.add(put(rbox(1.16, .02, .62, '#ffffff', .008, { map: dotjariTex() }), -.26, top + .01, zc));
  const cu = grp(put(rbox(.38, .08, .38, T.accent || '#ff6f91', .04), 0, 0, 0), put(sph(.035, T.accent3 || '#ffd23f'), 0, .04, 0, 0, 0, 0, [1, .5, 1]));
  put(cu, -.56, top + .06, zc + .08, 0, .2, 0); f.add(cu);
  const cp = f.part('lift', cu, (t, b) => { cu.position.y = b.p.y + .34 * t; cu.rotation.x = -.45 * t; cu.rotation.z = .15 * t; }, { label: '방석', sfx: 'lift' });
  f.spot('inside', null, -.56, top + .02, zc + .08, { part: cp, maxH: .3, label: '방석 밑' });
  const sx = .44, sz = zc - .02, st = top + .22;
  f.add(put(cyl(.3, .3, .04, '#c96f45', null, 28), sx, top + .2, sz));
  f.add(put(tor(.3, .012, '#a5512f', null, PI * 2, 8, 40), sx, st, sz, HP, 0, 0));
  f.add(put(mg('soban-legs', '#8f3d2a', ({ add }) => { for (const [x, z] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) add(G.box(.04, .19, .04, .012), x, .095, z); }), sx, top, sz));
  // the front half: a white plate of three watermelon slices (red flesh, green rind, black seeds) and two cups of barley tea
  const px = sx + .13, pz = sz + .15;
  f.add(put(cyl(.11, .09, .018, '#ffffff', null, 22), px, st + .009, pz));
  const slice = (r, th) => new THREE.CylinderGeometry(r, r, th, 10, 1, false, 0, .95);
  f.add(put(mg('wm-rind', '#3fa65a', ({ add }) => { for (let k = 0; k < 3; k++) add(slice(.092, .026), Math.sin(k * 2.1 + .47) * .012, 0, Math.cos(k * 2.1 + .47) * .012, 0, k * 2.1, 0); }), px, st + .031, pz));
  f.add(put(mg('wm-flesh', '#ff5a64', ({ add }) => { for (let k = 0; k < 3; k++) add(slice(.08, .03), Math.sin(k * 2.1 + .47) * .012, .004, Math.cos(k * 2.1 + .47) * .012, 0, k * 2.1, 0); }), px, st + .031, pz));
  f.add(put(mg('wm-seeds', '#2a1d22', ({ add }) => { for (let k = 0; k < 3; k++) for (const [rr, da] of [[.035, .3], [.055, .62], [.05, .18]]) { const a = k * 2.1 + da; add(G.sph(.007, 6, 4), Math.sin(a) * rr, .02, Math.cos(a) * rr, 0, 0, 0, [1, .5, 1.5]); } }), px, st + .031, pz));
  f.add(mg('tea-cups', '#ffffff', ({ add }) => { for (const [x, z] of [[sx - .16, sz + .14], [sx - .05, sz + .21]]) add(G.cyl(.032, .026, .055, 14), x, st + .028, z); }));
  f.add(mg('tea-tops', '#d39a52', ({ add }) => { for (const [x, z] of [[sx - .16, sz + .14], [sx - .05, sz + .21]]) add(G.cyl(.027, .027, .004, 14), x, st + .054, z); }));
  // the back half: the mesh food cover over a little side dish — lifts off, and the spot under it
  const cx = sx - .05, cz = sz - .11;
  const cv = grp(put(hemi(.17, '#ffffff', { map: meshCoverTex() }), 0, 0, 0, 0, 0, 0, [1, .72, 1]),
    put(mg('cover-ribs', '#f0708f', ({ add }) => { for (let k = 0; k < 4; k++) add(G.tor(.17, .006, PI), 0, 0, 0, 0, k * PI / 4, 0, [1, .72, 1]); add(G.tor(.17, .008), 0, .004, 0, HP, 0, 0); }), 0, 0, 0),
    put(sph(.028, '#f0708f'), 0, .13, 0));
  put(cv, cx, st, cz); f.add(cv);
  const vp = f.part('lift', cv, (t, b) => { cv.position.y = b.p.y + .3 * t; cv.position.x = b.p.x - .08 * t; cv.rotation.z = .45 * t; }, { label: '상보', sfx: 'lift' });
  f.spot('inside', null, cx, st, cz, { part: vp, maxH: .2, label: '상보 밑', scale: .72 });
  f.add(mg('slipper-soles', '#2a58c0', ({ add }) => { add(G.box(.13, .03, .23, .014), .1, .015, .38, 0, .15, 0); add(G.box(.13, .03, .23, .014), .27, .015, .39, 0, -.1, 0); }));
  f.add(mg('slipper-straps', '#ffffff', ({ add }) => { add(G.box(.14, .055, .1, .02), .095, .045, .42, 0, .15, 0); add(G.box(.14, .055, .1, .02), .274, .045, .43, 0, -.1, 0); }, { map: slipperTex() }));
  f.spot('on', null, -.02, top + .02, zc - .16, { maxH: .45, label: '평상 위', scale: .9 });
  f.spot('under', null, .1, 0, zc + .26, { maxH: .3, label: '평상 밑', scale: .9 });
};

// 장독대: stone platform with three 옹기 항아리 whose lids lift
function onggi(f, T, x, z, y0, R, H, name, dir) {
  const brown = col(T, 'onggi'), lidC = shade(brown, -.05);
  const pts = [[0, 0], [R * .58, 0], [R * .8, H * .1], [R * .97, H * .36], [R, H * .5], [R * .93, H * .7], [R * .74, H * .86], [R * .66, H * .92], [R * .68, H * .97], [R * .64, H], [R * .56, H], [R * .54, H * .95], [R * .54, H * .86], [0, H * .86]];
  f.add(put(lathe(`onggi|${R}|${H}`, pts, '#ffffff', { map: onggiTex(brown) }), x, y0, z));
  f.add(put(disc(R * .54, '#5e3320'), x, y0 + H * .865, z, -HP));
  const lid = grp(put(cyl(R * .72, R * .76, .045, lidC, null, 24), 0, .022, 0), put(sph(R * .7, lidC, null, 24, 10), 0, .04, 0, 0, 0, 0, [1, .3, 1]), put(sph(.035, shade(lidC, -.12)), 0, .04 + R * .7 * .3, 0));
  put(lid, x, y0 + H, z); f.add(lid);
  const p = f.part('lift', lid, (t, b) => { lid.position.y = b.p.y + .28 * t; lid.position.x = b.p.x + dir * .17 * t; lid.rotation.z = -dir * .6 * t; }, { label: name + ' 뚜껑', sfx: 'lift' });
  f.spot('inside', null, x, y0 + H * .87, z, { part: p, maxH: .4, label: name + ' 안', scale: R < .25 ? .62 : .8 });
}
B.jangdok = (f, T) => {
  f.add(put(rbox(1.88, .2, .9, '#ffffff', .05, { map: stoneTex() }), 0, .1, 0));
  onggi(f, T, -.52, -.06, .2, .34, .8, '큰 항아리', -1);
  onggi(f, T, .2, -.16, .2, .27, .62, '항아리', 1);
  onggi(f, T, .66, .17, .2, .21, .46, '작은 항아리', 1);
  f.spot('behind', null, -.12, .2, -.33, { maxH: .4, label: '항아리 사이', scale: .8 });
  f.spot('on', null, .02, .2, .3, { maxH: .45, label: '장독대 위', scale: .85 });
};

// 전봇대 with 전단지 (one lifts) and an orange traffic cone that hides something
B.pole = (f, T) => {
  const conc = col(T, 'concrete'), px = -.08, pz = -.14, Hh = 2.85, rr = y => .13 - .035 * y / Hh;
  f.add(put(cyl(.095, .13, Hh, conc, null, 18), px, Hh / 2, pz));
  f.add(put(cyl(.137, .141, .5, '#ffffff', { map: hazardTex() }, 18), px, .27, pz));
  f.add(put(mg('pole-arm', '#8c939e', ({ add }) => { add(G.box(.96, .08, .08, .02), 0, 0, 0); add(G.box(.12, .12, .14, .02), 0, 0, 0); add(G.box(.1, .1, .3, .02), 0, -.52, -.16); }), px, 2.62, pz));
  // (① 모델 품질 10/21: just a post in the icon) white insulators on the cross arm (no wire stubs: they would end in the air)
  f.add(put(mg('pole-insul', '#f4f1ea', ({ add }) => { for (const x of [-.4, -.14, .4]) { add(G.cyl(.03, .036, .05, 10), x, .065, 0); add(G.cyl(.024, .03, .04, 10), x, .11, 0); add(G.sph(.02, 8, 6), x, .14, 0); } }), px, 2.62, pz));
  f.add(put(mg('pole-tr', '#a3adb8', ({ add }) => { add(G.cyl(.15, .15, .42, 18), 0, 0, 0); add(G.cyl(.16, .16, .05, 18), 0, .22, 0); add(G.cyl(.03, .03, .12, 8), .06, .29, 0); }), px, 2.08, pz - .3));
  // the flyers (22판 실폰 10/21, user: "오브젝트 겹치지 않게 해줘" — flat cards wider than the pole stuck through it and each
  // other): each one is a curved sheet wrapped round the pole at its own height — the tutor ad high on the left, the lost dog
  // in front (it lifts), the room ad low on the right — none of them touching
  const sheet = (kind, r, w = .26, h = .34) => mesh(geo('pole-flyer|' + kind + '|' + r.toFixed(3), () => new THREE.CylinderGeometry(r, r, h, 16, 1, true, -w / r / 2, w / r)), mat('#ffffff', { map: flyerTex(kind), side: DS }));
  const flyer = (kind, a, y) => put(sheet(kind, rr(y) + .008), px, y, pz, 0, a, 0);
  f.add(flyer('tutor', -1.25, 1.62)); f.add(flyer('room', 1.3, .8));
  const fy = 1.17, fr = rr(fy) + .012, pv = new THREE.Group(); put(pv, px, fy + .17, pz + fr);
  pv.add(put(sheet('dog', fr - .002, .27, .35), 0, -.175, -fr + .002));
  pv.add(put(rbox(.09, .03, .014, '#fff8c4', .004), 0, -.01, .004));
  f.add(pv);
  const p = f.part('flip', pv, t => { pv.rotation.x = -1.25 * t; }, { label: '전단지', sfx: 'swish' });
  f.spot('inside', null, px, fy - .04, pz + fr - .006, { part: p, maxH: .09, label: '전단지 뒤', wallFace: true, scale: .8 });
  const cn = grp(put(rbox(.3, .035, .3, '#ff6a2a', .012), 0, .018, 0), put(cone(.12, .42, '#ff7a33', null, 20), 0, .245, 0), put(cyl(.066, .084, .08, '#ffffff', null, 20), 0, .2, 0));
  put(cn, .3, 0, .27); f.add(cn);
  const cp = f.part('lift', cn, (t, b) => { cn.position.y = b.p.y + .36 * t; cn.position.x = b.p.x - .04 * t; cn.rotation.z = .55 * t; }, { label: '라바콘', sfx: 'lift' });
  f.spot('inside', null, .3, 0, .27, { part: cp, maxH: .3, label: '라바콘 밑', scale: .8 });
  f.spot('behind', null, px, 0, pz - .3, { maxH: .45, label: '전봇대 뒤', scale: .85 });
};

// 우편함 (wall): 2×2 다세대 mailboxes, each flap opens; 102호 takes a padlock
B.mailbox = (f, T) => {
  const steel = T.mailbox || '#c9d6df', door = T.mailDoor || '#5aaee8', y0 = 1.0, cw = .3, ch = .23, D = .26, t = .025;
  const W = cw * 2 + t * 3, H = ch * 2 + t * 3;
  const hb = .14;
  f.add(mg('mailbox-frame2', steel, ({ add }) => {
    add(G.box(W, H - t + hb, .02, .008), 0, y0 + (H - t + hb) / 2, .01);
    for (const x of [-W / 2 + t / 2, 0, W / 2 - t / 2]) add(G.box(t, H, D, .008), x, y0 + H / 2, D / 2);
    for (const y of [y0 + t / 2, y0 + H / 2]) add(G.box(W, t, D, .008), 0, y, D / 2);
    add(G.box(W, hb, D, .015), 0, y0 + H - t + hb / 2, D / 2);
  }));
  f.add(face(0, y0 + H - t + hb / 2 + .01, D + .002, .85));
  f.add(put(rbox(W + .1, .045, D + .1, T.accent || '#ff6f91', .02), 0, y0 + H - t + hb + .022, D / 2 + .02));
  const nums = ['201', '202', '101', '102']; let k = 0;
  for (const row of [1, 0]) for (const ci of [0, 1]) {
    const n = nums[k++], cx = -W / 2 + t + cw / 2 + ci * (cw + t), cyB = y0 + t + row * (ch + t);
    const pv = new THREE.Group(); put(pv, cx, cyB, D + .012);
    pv.add(put(rbox(cw - .012, ch - .012, .02, '#ffffff', .008, { map: mailDoorTex(n, door) }), 0, (ch - .012) / 2, 0));
    f.add(pv);
    const p = f.part('door', pv, tt => { pv.rotation.x = 1.5 * tt; }, { label: `우편함 ${n}호`, sfx: 'open', dur: .26 });
    f.spot('inside', null, cx, cyB, D * .6, { part: p, maxH: .2, label: `우편함 ${n}호`, scale: .6 });
    if (n === '102') { p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: ch * .55, z: .035, parent: pv }; }
  }
};

// 초록 대문 (wall): brick pillars, two steel leaves over a shallow doorstep niche, 우유 투입함, 문패, 초인종
B.gate = (f, T) => {
  const green = col(T, 'gate'), brick = col(T, 'brick'), W = 1.34, D = .34, LH = 1.4, PX = W / 2 + .13;
  f.add(mg('gate-pillars', '#ffffff', ({ add }) => { for (const sx of [-1, 1]) add(G.box(.26, 1.74, D + .08, .03), sx * PX, .87, (D + .08) / 2); }, { map: pillarTex(brick) }));
  f.add(mg('gate-caps', '#ece6dc', ({ add }) => { for (const sx of [-1, 1]) add(G.box(.34, .08, D + .16, .03), sx * PX, 1.78, (D + .08) / 2); add(G.box(W + .3, .07, D + .1, .02), 0, .035, (D + .1) / 2); }));
  const leaf = sx => {
    const pv = new THREE.Group(); put(pv, sx * W / 2, .08 + LH / 2, D);
    pv.add(put(rbox(W / 2 - .012, LH, .05, '#ffffff', .02, { map: gateTex(green) }), -sx * W / 4, 0, 0));
    pv.add(put(tor(.045, .013, '#ffd23f', { metal: .5, rough: .3 }), -sx * (W / 2 - .1), -.04, .035));
    f.add(pv); return pv;
  };
  // behind the leaves (23판 실폰 10/21, user: "문 열고 막혀 있는데 ㅋㅋㅋ 이게 뭐여" — opened, it was a bare wall): the house's front
  // step — a tiled floor, a raised doorstep, the 현관문 itself in the back wall (a wooden door with two panels, a little window,
  // a brass handle, a lamp and the house number over it), a small mailbox on the wall, a pot plant and slippers in the corners.
  // The two '대문 안쪽' spots (x ±W/4, the middle of the floor) stay clear.
  const FY = .07, DW2 = .28, DH2 = 1.22;
  f.add(mg('gate-in-floor', '#d9d0c2', ({ add }) => { add(G.box(W - .02, .012, D - .02, .004), 0, FY + .006, D / 2); add(G.box(W - .06, .07, .12, .02), 0, FY + .035, .065); }));
  f.add(mg('gate-in-floorline', '#c4b9a8', ({ add }) => { for (const x of [-W / 4, 0, W / 4]) add(G.box(.008, .004, D - .14, .002), x, FY + .013, D / 2 + .06); add(G.box(W - .04, .004, .008, .002), 0, FY + .013, .24); }));
  f.add(mg('gate-in-frame', '#efe8dc', ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.06, DH2 + .06, .04, .01), sx * (DW2 + .03), FY + .07 + (DH2 + .06) / 2, .02);
    add(G.box(DW2 * 2 + .12, .06, .045, .01), 0, FY + .07 + DH2 + .06, .022);
  }));
  f.add(mg('gate-in-door', '#9a6a45', ({ add }) => { add(G.box(DW2 * 2, DH2, .03, .012), 0, FY + .07 + DH2 / 2, .016); }));
  f.add(mg('gate-in-doorpanel', '#b9844f', ({ add }) => { for (const y of [.35, .75]) add(G.box(DW2 * 2 - .14, .3, .01, .006), 0, FY + .07 + y, .034); }));
  f.add(mg('gate-in-window', '#cfe9f5', ({ add }) => { add(G.box(.34, .16, .01, .006), 0, FY + .07 + 1.05, .034); }));
  f.add(mg('gate-in-brass', '#e8b84a', ({ add }) => { add(G.box(.035, .1, .025, .008), DW2 - .07, FY + .07 + .62, .045); add(G.box(.12, .05, .012, .006), 0, FY + .07 + DH2 + .16, .03); }));
  f.add(mg('gate-in-lamp', '#fff3c4', ({ add }) => { add(G.sph(.05, 12, 10), -DW2 - .14, FY + .07 + DH2 - .05, .07); }, { emissive: '#ffe08a', ei: .5 }));
  f.add(mg('gate-in-lampcap', '#5b5672', ({ add }) => { add(G.cyl(.04, .055, .04, 12), -DW2 - .14, FY + .07 + DH2 + .0, .07); add(G.box(.03, .03, .06, .008), -DW2 - .14, FY + .07 + DH2 + .02, .03); }));
  f.add(mg('gate-in-mail', '#e2403a', ({ add }) => { add(G.box(.16, .2, .09, .02), DW2 + .23, FY + .07 + .78, .05); }));
  f.add(mg('gate-in-mailslot', '#3b3556', ({ add }) => { add(G.box(.1, .015, .01, .004), DW2 + .23, FY + .07 + .84, .096); }));
  f.add(mg('gate-in-pot', '#d98b5f', ({ add }) => { add(G.cyl(.07, .055, .12, 12), -W / 2 + .1, FY + .06, D - .1); }));
  f.add(mg('gate-in-leaf', '#6cc46a', ({ add }) => { for (let k = 0; k < 5; k++) add(G.sph(.055, 8, 6), -W / 2 + .1 + Math.cos(k * 1.3) * .04, FY + .16 + (k % 2) * .05, D - .1 + Math.sin(k * 1.3) * .03, 0, 0, 0, [1, 1.3, 1]); }));
  f.add(mg('gate-in-slipper', '#5f8fe0', ({ add }) => { for (const dx of [-.045, .045]) add(G.box(.075, .025, .17, .03), W / 2 - .14 + dx, FY + .07 + .013, .07, 0, dx * 3, 0); }));
  f.add(mg('gate-in-slipperband', '#ffffff', ({ add }) => { for (const dx of [-.045, .045]) add(G.box(.08, .02, .04, .008), W / 2 - .14 + dx, FY + .07 + .03, .1, 0, dx * 3, 0); }));
  const L = leaf(-1), R = leaf(1);
  const pl = f.part('door', L, t => { L.rotation.y = -1.45 * t; }, { label: '대문 왼쪽', sfx: 'door' });
  const pr = f.part('door', R, t => { R.rotation.y = 1.45 * t; }, { label: '대문 오른쪽', sfx: 'door' });
  f.spot('inside', null, -W / 4, .07, D * .45, { part: pl, maxH: .45, label: '대문 안쪽', scale: .9 });
  f.spot('inside', null, W / 4, .07, D * .45, { part: pr, maxH: .45, label: '대문 안쪽', scale: .9 });
  // milk box on the left pillar
  const mx = -PX, my = .92, mz = D + .08;
  f.add(mg('milkbox', '#ffe14d', ({ add }) => hollowBox(add, .22, .2, .15, .02, mx, my, mz + .075)));
  f.add(put(plane(.18, .16, mat('#ffffff', { map: milkTex() })), mx, my + .1, mz + .151));
  const lid = grp(put(rbox(.24, .03, .17, '#ffcf3a', .01), 0, .015, .085)); put(lid, mx, my + .2, mz); f.add(lid);
  const lp = f.part('lid', lid, t => { lid.rotation.x = -1.6 * t; }, { label: '우유 투입함', sfx: 'open', dur: .24 });
  lp.lockable = true; lp.lockKind = 'color'; f.lockAt = { x: 0, y: -.045, z: .185, parent: lid };
  f.spot('inside', null, mx, my + .02, mz + .075, { part: lp, maxH: .17, label: '우유 투입함', scale: .55 });
  f.add(put(rbox(.18, .09, .02, '#ffffff', .01, { map: nameTex() }), PX, 1.3, D + .09));
  f.add(put(rbox(.07, .1, .025, '#ffffff', .01, { map: bellTex() }), PX, 1.1, D + .09));
  f.spot('on', null, PX, 1.82, (D + .08) / 2, { maxH: .35, label: '대문 기둥 위', scale: .8 });
};

// 셔터 내린 가게 (행복슈퍼): roll the shutter up to see the shelves; 담배 sign, red plastic crate outside
B.shopfront = (f, T) => {
  const W = 1.92, H = 1.66, D = .74, z0 = -.13, wallC = T.shopWall || '#f6e7cf', fz = z0 + D / 2, oy = H - .34;
  f.add(mg('shop-shell', wallC, ({ add }) => {
    add(G.box(W, H, .08, .02), 0, H / 2, z0 - D / 2 + .04);
    add(G.box(.1, H, D, .02), -W / 2 + .05, H / 2, z0); add(G.box(.1, H, D, .02), W / 2 - .05, H / 2, z0);
    add(G.box(W + .08, .1, D + .1, .03), 0, H + .05, z0 + .02);
  }));
  f.add(put(rbox(W - .2, .05, D - .1, '#c9cfd8', .015), 0, .025, z0));
  f.add(put(plane(W - .2, oy - .05, mat(shade(wallC, -.14))), 0, (oy - .05) / 2 + .05, z0 - D / 2 + .081));
  f.add(put(rbox(W + .04, .34, .1, '#ffffff', .03, { map: shopSignTex() }), 0, H - .17, fz + .05));
  f.add(put(cyl(.07, .07, W - .18, '#b8c2cc', null, 14), 0, oy - .06, fz + .05, 0, 0, HP));
  f.add(mg('shop-shelf', T.wood || '#e0aa6c', ({ add }) => {
    for (const y of [.34, .74]) add(G.box(W - .4, .04, .26, .012), 0, y, z0 - D / 2 + .21);
    for (const x of [-(W / 2 - .2), W / 2 - .2]) add(G.box(.04, .9, .26, .012), x, .45, z0 - D / 2 + .21);
  }));
  f.add(mg('shop-goods-a', '#ff5a4e', ({ add }) => { for (const x of [-.55, -.3, .4]) add(G.box(.2, .26, .18, .02), x, .89, z0 - D / 2 + .2); add(G.box(.2, .24, .18, .02), .45, .48, z0 - D / 2 + .2); }));
  f.add(mg('shop-goods-b', '#ffd23f', ({ add }) => { for (const x of [-.02, .16]) add(G.box(.15, .22, .07, .03), x, .87, z0 - D / 2 + .22, 0, 0, .08); add(G.box(.15, .22, .07, .03), .66, .47, z0 - D / 2 + .22, 0, 0, -.1); }));
  const pv = new THREE.Group(); put(pv, 0, oy - .08, fz + .035);
  pv.add(put(rbox(W - .2, oy - .1, .03, '#ffffff', .01, { map: shutterTex() }), 0, -(oy - .1) / 2, 0));
  f.add(pv);
  const p = f.part('shutter', pv, t => { pv.scale.y = 1 - .9 * t; }, { label: '셔터', sfx: 'drawer', dur: .42 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: .25, y: -(oy - .1) + .12, z: .035, parent: pv };
  f.spot('inside', null, -.4, .36, z0 - D / 2 + .24, { part: p, maxH: .34, label: '가게 선반', scale: .85 });
  f.spot('inside', null, .45, .05, fz - .18, { part: p, maxH: .45, label: '가게 안' });
  const tsx = W / 2 - .12, tsy = 1.12, tsz = fz + .2;
  f.add(put(cyl(.15, .15, .04, '#ff3b4e', null, 24), tsx, tsy, tsz, 0, 0, HP));
  f.add(put(mg('tobacco-faces', '#ffffff', ({ add }) => { add(new THREE.CircleGeometry(.13, 24), .021, 0, 0, 0, HP, 0); add(new THREE.CircleGeometry(.13, 24), -.021, 0, 0, 0, -HP, 0); }, { map: tobaccoTex() }), tsx, tsy, tsz));
  f.add(put(rbox(.05, .05, .2, '#8c939e', .015), W / 2 - .12, 1.12, fz + .07));
  f.add(put(rbox(.42, .24, .24, '#ffffff', .03, { map: crateTex() }), -.62, .12, .37));
  f.spot('on', null, -.62, .24, .37, { maxH: .45, label: '플라스틱 상자 위', scale: .85 });
};

// 자판기: service door (code lock) and the 꺼내는 곳 flap
B.vending = (f, T) => {
  const W = .84, H = 1.72, D = .6, z0 = -.16, red = col(T, 'vend'), fz = z0 + D / 2, dy0 = .46, DH = H - dy0 - .22;
  f.add(mg('vend-shell', red, ({ add }) => {
    add(G.box(W, H, .05, .02), 0, H / 2, z0 - D / 2 + .025);
    add(G.box(.05, H, D, .02), -W / 2 + .025, H / 2, z0); add(G.box(.05, H, D, .02), W / 2 - .025, H / 2, z0);
    add(G.box(W, .06, D, .02), 0, H - .03, z0);
    add(G.box(W, dy0, D, .03), 0, dy0 / 2, z0);
    add(G.box(W, H - dy0 - DH, .06, .02), 0, (dy0 + DH + H) / 2, fz - .03);
  }));
  f.add(face(0, (dy0 + DH + H) / 2 + .01, fz + .002, 1.15));
  f.add(put(plane(W - .1, DH - .06, mat('#eaf6ff')), 0, dy0 + DH / 2, z0 - D / 2 + .051));
  f.add(mg('vend-shelf', '#c9d4e0', ({ add }) => { for (const y of [.88, 1.28]) add(G.box(W - .1, .03, D - .1, .01), 0, y, z0 - .02); }));
  f.add(mg('vend-cans-a', '#ff4d5e', ({ add }) => { for (const x of [-.24, -.08, .08, .24]) add(G.cyl(.055, .055, .2, 14), x, 1.395, z0 - .1); }));
  f.add(mg('vend-cans-b', '#4fb8ff', ({ add }) => { for (const x of [.12, .27]) add(G.cyl(.055, .055, .2, 14), x, .995, z0 - .1); }));
  const pv = new THREE.Group(); put(pv, -W / 2, dy0 + DH / 2, fz + .035);
  pv.add(put(rbox(W, DH, .07, '#ffffff', .03, { map: vendTex() }), W / 2, 0, 0));
  pv.add(put(rbox(.04, .3, .04, '#d7dde6', .015), W - .07, -.1, .05));
  f.add(pv);
  const p = f.part('door', pv, t => { pv.rotation.y = -1.75 * t; }, { label: '자판기 문', sfx: 'open', dur: .34 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: W - .2, y: -DH / 2 + .14, z: .05, parent: pv };
  f.spot('inside', null, -.14, .9, z0 + .12, { part: p, maxH: .34, label: '자판기 안', scale: .85 });
  f.add(mg('vend-pocket', '#3b3550', ({ add }) => {
    add(G.box(.54, .03, .16, .01), 0, .37, fz + .08); add(G.box(.54, .03, .16, .01), 0, .125, fz + .08);
    for (const sx of [-1, 1]) add(G.box(.03, .27, .16, .01), sx * .255, .25, fz + .08);
  }));
  const fl = new THREE.Group(); put(fl, 0, .355, fz + .155);
  fl.add(put(rbox(.48, .21, .02, '#ffffff', .008, { map: flapTex() }), 0, -.105, 0)); f.add(fl);
  const fp = f.part('lift', fl, t => { fl.rotation.x = -3 * t; }, { label: '꺼내는 곳', sfx: 'open', dur: .24 });
  f.spot('inside', null, 0, .14, fz + .095, { part: fp, maxH: .2, label: '꺼내는 곳', scale: .6 });
  f.spot('on', null, .1, H, z0, { maxH: .4, label: '자판기 위', scale: .85 });
};

// 스티로폼 텃밭: fish boxes reused as planters (상추, 대파, 무 / 고추, 방울토마토), a terracotta pot of marigolds to lift.
// (10/23 사용자 "얘네 좀 못생겨서..": big flat white blocks with a shout of a word, plastic lettuce, floating onions, a board of
// soil — two ways: A) the styrofoam boxes kept but small and soft, a little hand-drawn sticker, crumbly damp soil, lettuces of
// overlapping leaves, tomato clusters on a tied stake, wooden name tags; B) 할머니 텃밭 — slatted wooden apple crates, a pot, a
// red basin of 대파, a watering can. The lift parts (무, 화분) and the spots keep their names in both.)
const soilTex = c1 => tex('soil3|' + c1, 128, 128, (c, w, h) => {
  c.fillStyle = c1; c.fillRect(0, 0, w, h);
  let sd = 5; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  c.fillStyle = shade(c1, -.05); for (let i = 0; i < 7; i++) blob(c, R() * w, R() * h, 7 + R() * 8);   // damp patches
  for (let i = 0; i < 120; i++) { c.fillStyle = shade(c1, R() < .55 ? .12 : -.1); blob(c, R() * w, R() * h, .6 + R() * 1.1); }
}, { repeat: [1, 1] });
// a little sticker on a box: paper, a strip of tape, a drawn crop and its name in small handwriting
const veggieTex = kind => tex('veg|' + kind, 192, 128, (c, w, h) => {
  c.fillStyle = '#fffaf0'; roundRect(c, 3, 3, w - 6, h - 6, 10); c.fill();
  c.fillStyle = 'rgba(255,214,120,.75)'; c.save(); c.translate(w * .5, 8); c.rotate(-.06); c.fillRect(-18, -6, 36, 12); c.restore();
  if (kind === 'lettuce') { c.fillStyle = '#7fd65c'; for (let i = 0; i < 5; i++) blob(c, 32 + Math.cos(i * 1.3) * 9, 36 + Math.sin(i * 1.3) * 7, 11); c.fillStyle = '#c8f2a2'; blob(c, 32, 36, 7); }
  else { c.strokeStyle = '#4ea85a'; c.lineWidth = 2; c.beginPath(); c.moveTo(32, 18); c.lineTo(32, 30); c.stroke(); c.fillStyle = '#ff4a3d'; blob(c, 26, 38, 8); blob(c, 38, 40, 8); blob(c, 32, 50, 7); c.fillStyle = '#4ea85a'; blob(c, 32, 30, 4); }
  txt(c, kind === 'lettuce' ? '상추' : '토마토', 72, 38, 17, '#7a5a3a', { align: 'left' });
}, { text: true });
const tagTex = kind => tex('vtag|' + kind, 64, 96, (c, w, h) => {
  c.fillStyle = '#f6e3bf'; roundRect(c, 2, 2, w - 4, h - 4, 14); c.fill();
  if (kind === 'lettuce') { c.fillStyle = '#7fd65c'; for (let i = 0; i < 5; i++) blob(c, 16 + Math.cos(i * 1.3) * 6, 18 + Math.sin(i * 1.3) * 5, 7); }
  else { c.fillStyle = '#ff4a3d'; blob(c, 13, 20, 6); blob(c, 21, 22, 6); c.fillStyle = '#4ea85a'; blob(c, 17, 13, 3); }
});
// crops (into one mg each — shared by both ways): a lettuce of overlapping leaves, a planted bunch of 대파, a tied stake of
// cherry tomatoes, a pepper plant, a wooden name tag
const lettuce = (f, key, list, S) => {
  f.add(mg(key + '-out', '#7fd65c', ({ add }) => { for (const [x, z, k] of list) for (let i = 0; i < 9; i++) { const a = i * PI * 2 / 9 + k; add(G.sph(.055 * (k + 1), 10, 8), x + Math.cos(a) * .05 * (k + 1), S + .03 * (k + 1), z + Math.sin(a) * .05 * (k + 1), 0, -a, 1.0, [1.25, .22, .8]); } }));
  f.add(mg(key + '-in', '#a8e67a', ({ add }) => { for (const [x, z, k] of list) for (let i = 0; i < 5; i++) { const a = i * PI * 2 / 5 + .3; add(G.sph(.04 * (k + 1), 10, 8), x + Math.cos(a) * .025 * (k + 1), S + .055 * (k + 1), z + Math.sin(a) * .025 * (k + 1), 0, -a, .55, [1.2, .28, .8]); } }));
  f.add(mg(key + '-heart', '#d6f3a8', ({ add }) => { for (const [x, z, k] of list) add(G.sph(.026 * (k + 1), 10, 8), x, S + .065 * (k + 1), z, 0, 0, 0, [1, .85, 1]); }));
};
const onions = (f, key, x, z, S) => {
  f.add(mg(key + '-w', '#f6f7ef', ({ add }) => { for (let i = 0; i < 5; i++) add(G.cyl(.013, .016, .09, 8), x + Math.cos(i * 2.4) * .022, S + .045, z + Math.sin(i * 2.4) * .022); }));
  f.add(mg(key + '-g', '#3fae4a', ({ add, tube }) => { for (let i = 0; i < 5; i++) { const bx = x + Math.cos(i * 2.4) * .022, bz = z + Math.sin(i * 2.4) * .022, tx = bx + Math.cos(i * 2.4) * .06, tz = bz + Math.sin(i * 2.4) * .04; tube([bx, S + .085, bz], [tx, S + .32 + (i % 2) * .05, tz], .011, 6, .007); } }));
};
const tomatoes = (f, key, x, z, S, H = .44) => {
  f.add(mg(key + '-stake', '#c9925a', ({ add }) => add(G.box(.022, H + .04, .022, .006), x, S + H / 2, z)));
  f.add(mg(key + '-tie', '#f2e2b8', ({ add }) => { for (const y of [.18, .34]) add(G.tor(.02, .004, PI * 2), x, S + y, z, HP, 0, 0); }));
  f.add(mg(key + '-vine', '#5aae4c', ({ add, tube }) => {
    let q0 = [x + .02, S, z + .02]; for (let k = 1; k <= 5; k++) { const q = [x + .025 + Math.sin(k * 1.7) * .03, S + k * H / 5.5, z + .02 + Math.cos(k * 1.7) * .02]; tube(q0, q, .008, 5); q0 = q; }
    for (const [y, a] of [[.12, .5], [.22, 2.4], [.3, 4.2], [.38, 1.2]]) add(G.sph(.045, 8, 6), x + Math.cos(a) * .06, S + y, z + Math.sin(a) * .05, 0, a, .6, [1.4, .26, .8]);
  }));
  const fruit = [[.06, .2, .05], [.075, .17, .03], [.045, .165, .065], [.06, .14, .045], [-.05, .3, .04], [-.062, .27, .025], [-.04, .265, .06]];
  f.add(mg(key + '-red', '#ff4a3d', ({ add }) => { for (const [dx, y, dz] of fruit) add(G.sph(.022, 10, 8), x + dx, S + y, z + dz); }));
  f.add(mg(key + '-cal', '#4ea85a', ({ add }) => { for (const [dx, y, dz] of fruit) add(G.cone(.012, .008, 5), x + dx, S + y + .02, z + dz, PI, 0, 0); }));
};
const pepper = (f, key, x, z, S) => {
  f.add(mg(key + '-plant', '#4caf50', ({ add, tube }) => { tube([x, S, z], [x, S + .26, z], .01, 6); for (const [y, a] of [[.1, .3], [.16, 1.9], [.22, 3.4], [.26, 5.0]]) for (const s2 of [-1, 1]) add(G.sph(.034, 8, 6), x + Math.cos(a) * .045 * s2, S + y, z + Math.sin(a) * .045 * s2, 0, a, s2 * .5, [1.5, .3, .7]); }));
  f.add(mg(key + '-red', '#ff3b30', ({ add }) => { for (const [dx, y, dz, rz] of [[-.04, .14, .03, .15], [.045, .19, .04, -.2], [.03, .1, -.04, .1]]) add(G.cap(.014, .05, 2, 8), x + dx, S + y, z + dz, 0, 0, rz); }));
};
const nameTag = (f, key, kind, x, z, S, ry = 0) => {
  f.add(mg(key + '-stick', '#d9b07a', ({ add }) => add(G.box(.014, .12, .008, .003), x, S + .06, z, 0, ry, 0)));
  f.add(put(mesh(geo('vtag-plane', () => new THREE.PlaneGeometry(.055, .082)), mat('#ffffff', { map: tagTex(kind), side: DS })), x, S + .15, z + .006, 0, ry, 0));
};
// the two lift parts, the same in both ways: a 무 pulled up out of the soil, a pot of marigolds
const radishPart = (f, x, z, S) => {
  const rad = grp(put(cap(.06, .1, '#fbfbf5'), 0, -.02, 0), put(cap(.035, .02, '#d9efc9'), 0, .06, 0),
    put(mg('radish-leaf2', '#4fb85a', ({ add }) => { for (let i = 0; i < 4; i++) { const a = i * HP + .4; add(G.sph(.045, 10, 8), Math.sin(a) * .045, .17, Math.cos(a) * .045, Math.cos(a) * .4, 0, -Math.sin(a) * .4, [.6, 2.3, .3]); } }), 0, 0, 0));
  put(rad, x, S, z); f.add(rad);
  const rp = f.part('lift', rad, (t, b) => { rad.position.y = b.p.y + .4 * t; rad.rotation.z = .35 * t; }, { label: '무', sfx: 'lift' });
  f.spot('inside', null, x, S, z, { part: rp, maxH: .3, label: '무 뽑은 자리', scale: .72 });
};
const marigoldPot = (f, x, z) => {
  const pot = grp(
    put(lathe('tpot', [[0, 0], [.1, 0], [.14, .17], [.155, .17], [.155, .21], [.125, .21], [.12, .19], [0, .19]], '#e07a52'), 0, 0, 0),
    put(mg('tpot-leaf', '#5fc45a', ({ add }) => { for (let i = 0; i < 4; i++) { const a = i * HP + .3; add(G.sph(.06, 10, 8), Math.cos(a) * .06, .25, Math.sin(a) * .06, 0, -a, .6, [1.3, .45, .7]); } }), 0, 0, 0),
    put(mg('tpot-marigold', '#ffc23d', ({ add }) => { for (const [cx, cz] of [[-.03, .02], [.04, -.03]]) for (let k = 0; k < 7; k++) { const a = k * PI * 2 / 7; add(G.sph(.026, 8, 6), cx + Math.cos(a) * .028, .31, cz + Math.sin(a) * .028, 0, -a, 0, [1.3, .45, .8]); } }), 0, 0, 0),
    put(mg('tpot-marigold-eye', '#e8742a', ({ add }) => { for (const [cx, cz] of [[-.03, .02], [.04, -.03]]) add(G.sph(.016, 8, 6), cx, .318, cz); }), 0, 0, 0));
  put(pot, x, 0, z); f.add(pot);
  const pp = f.part('lift', pot, (t, b) => { pot.position.y = b.p.y + .3 * t; pot.position.x = b.p.x - .1 * t; pot.rotation.z = .4 * t; }, { label: '화분', sfx: 'lift' });
  f.spot('inside', null, x, 0, z, { part: pp, maxH: .1, label: '화분 밑', scale: .9 });
};
// A) small soft styrofoam boxes
const gardenA = (f, T) => {
  const soil = col(T, 'soil'), sty = col(T, 'styro'), H = .2, S = H - .01, boxes = [[-.46, -.2, .62, .42], [.42, -.22, .56, .4]];
  f.add(mg('gardenA-sty', sty, ({ add }) => boxes.forEach(([x, z, w, d]) => {
    add(G.box(w, H, d, .06), x, H / 2, z);
    for (const s2 of [-1, 1]) { add(G.box(w + .02, .045, .055, .022), x, H + .005, z + s2 * (d / 2 - .02)); add(G.box(.055, .045, d + .02, .022), x + s2 * (w / 2 - .02), H + .005, z); }
  })));
  f.add(mg('gardenA-groove', shade(sty, -.06), ({ add }) => boxes.forEach(([x, z, w, d]) => add(G.box(w - .12, .006, .006, .002), x, H * .45, z + d / 2 + .001))));
  f.add(mg('gardenA-soil|' + soil, '#ffffff', ({ add }) => boxes.forEach(([x, z, w, d]) => add(G.box(w - .08, .02, d - .08, .008), x, S, z)), { map: soilTex(soil), rough: .95 }));
  f.add(mg('gardenA-clods', shade(soil, -.15), ({ add }) => boxes.forEach(([x, z, w, d], bi) => { for (let k = 0; k < 10; k++) add(G.sph(.013, 6, 4), x - w / 2 + .07 + ((k * 37 + bi * 11) % 40) / 40 * (w - .14), S + .01, z - d / 2 + .07 + ((k * 23 + bi * 7) % 30) / 30 * (d - .14), 0, k, 0, [1.3, .6, 1]); })));
  f.add(put(plane(.15, .1, mat('#ffffff', { map: veggieTex('lettuce') })), -.3, .1, -.2 + .21 + .002, 0, 0, -.05));
  f.add(put(plane(.15, .1, mat('#ffffff', { map: veggieTex('tomato') })), .52, .1, -.22 + .2 + .002, 0, 0, .06));
  lettuce(f, 'gardenA-let', [[-.38, -.3, 0], [-.22, -.12, .15]], S);
  onions(f, 'gardenA-pa', -.2, -.33, S);
  nameTag(f, 'gardenA-tag1', 'lettuce', -.72, -.04, S, .2);
  radishPart(f, -.64, -.22, S);
  tomatoes(f, 'gardenA-tom', .26, -.3, S);
  pepper(f, 'gardenA-pep', .5, -.2, S);
  nameTag(f, 'gardenA-tag2', 'tomato', .62, -.07, S, -.2);
  f.spot('on', null, .64, S, -.12, { maxH: .4, label: '텃밭 상자 위', scale: .8 });
  marigoldPot(f, -.3, .3);
};
// B) 할머니 텃밭: slatted wooden apple crates, a pot, a basin of 대파 and a tin watering can
const gardenB = (f, T) => {
  const soil = col(T, 'soil'), wood = '#d4a46a', woodD = '#a8763f', H = .24, S = H - .02, crates = [[-.46, -.2, .64, .42], [.42, -.22, .56, .4]];
  f.add(mg('gardenB-in', shade(woodD, -.25), ({ add }) => crates.forEach(([x, z, w, d]) => add(G.box(w - .03, H - .02, d - .03, .006), x, H / 2, z))));
  f.add(mg('gardenB-slat', wood, ({ add }) => crates.forEach(([x, z, w, d]) => { for (const k of [0, 1, 2]) { const y = H * (.18 + k * .32); add(G.box(w, H * .24, d, .01), x, y, z); } })));
  f.add(mg('gardenB-post', woodD, ({ add }) => crates.forEach(([x, z, w, d]) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.045, H + .01, .045, .01), x + sx * (w / 2 - .02), H / 2, z + sz * (d / 2 - .02)); for (const sx of [-1, 1]) add(G.box(.008, .035, .1, .004), x + sx * (w / 2 + .002), H * .82, z); })));
  f.add(mg('gardenB-soil|' + soil, '#ffffff', ({ add }) => crates.forEach(([x, z, w, d]) => add(G.box(w - .05, .02, d - .05, .008), x, S, z)), { map: soilTex(soil), rough: .95 }));
  f.add(put(plane(.12, .08, mat('#ffffff', { map: veggieTex('tomato') })), .5, H * .5, -.22 + .2 + .003));
  f.add(mg('gardenB-apple', '#ff5a4e', ({ add }) => { add(G.sph(.03, 12, 9), -.3, H * .5, -.2 + .21 + .012, 0, 0, 0, [1, .9, .4]); }));
  f.add(mg('gardenB-apple-leaf', '#5fc45a', ({ add }) => add(G.sph(.014, 8, 6), -.29, H * .5 + .034, -.2 + .21 + .012, 0, 0, .6, [1.4, .6, .4])));
  lettuce(f, 'gardenB-let', [[-.4, -.3, 0], [-.24, -.14, 0], [-.42, -.08, -.2]], S);
  radishPart(f, -.64, -.22, S);
  tomatoes(f, 'gardenB-tom', .26, -.3, S, .4);
  pepper(f, 'gardenB-pep', .52, -.2, S);
  nameTag(f, 'gardenB-tag', 'lettuce', -.12, -.32, S, -.15);
  f.spot('on', null, .64, S, -.12, { maxH: .4, label: '텃밭 상자 위', scale: .8 });
  marigoldPot(f, -.3, .3);
  // a red rubber basin of 대파 and a tin watering can at the front
  f.add(put(lathe('gardenB-basin', [[0, 0], [.12, 0], [.15, .11], [.16, .11], [.16, .125], [.145, .125], [.14, .11], [0, .1]], '#e8453c'), .18, 0, .3));
  f.add(mg('gardenB-basin-soil|' + soil, '#ffffff', ({ add }) => add(G.cyl(.14, .14, .01, 16), .18, .105, .3), { map: soilTex(soil), rough: .95 }));
  onions(f, 'gardenB-pa', .18, .3, .1);
  f.add(mg('gardenB-can', '#b9c3cf', ({ add, tube }) => { add(G.cyl(.06, .065, .13, 14), .66, .065, .3); add(G.tor(.045, .008, PI), .64, .15, .3, 0, HP, 0); tube([.71, .06, .3], [.82, .16, .3], .012, 8, .018); add(G.cyl(.024, .016, .02, 10), .83, .17, .3, 0, 0, -.8); }));
};
// (10/23 사용자 "어떤 판은 스티로폼, 어떤 판은 나무… 이렇게 나오길": never mixed in one garden — a map gets one whole way.
// opts.v 'a' | 'b' says which; without it a grass yard (a house's 마당) gets B, a street or alley A.)
B.garden = (f, T, o = {}) => ((o.v || ((T && T.floorKind) === 'grass' ? 'b' : 'a')) === 'b' ? gardenB(f, T) : gardenA(f, T));

// 에어컨 실외기: the fan grille swings open; things get left on top and slip underneath
B.aircon = (f, T) => {
  const W = .84, H = .62, D = .36, y0 = .14, zc = -.24, fz = zc + D / 2, wc = '#eef2f4', hx = -.12, hy = y0 + H / 2, hr = .22;
  f.add(mg('ac-rails2', '#9aa3ad', ({ add }) => { for (const x of [-W / 2 + .07, W / 2 - .07]) add(G.box(.07, y0, D + .06, .015), x, y0 / 2, zc); }));
  f.add(mg('ac-body', wc, ({ add }) => {
    add(G.box(W, .04, D, .015), 0, y0 + .02, zc); add(G.box(W, .04, D, .015), 0, y0 + H - .02, zc);
    add(G.box(.04, H, D, .015), -W / 2 + .02, hy, zc); add(G.box(.04, H, D, .015), W / 2 - .02, hy, zc);
    add(G.box(W, H, .04, .015), 0, hy, zc - D / 2 + .02);
  }));
  f.add(put(mesh(geo('ac-front', () => {
    const s = new THREE.Shape(); s.moveTo(-W / 2, -H / 2); s.lineTo(W / 2, -H / 2); s.lineTo(W / 2, H / 2); s.lineTo(-W / 2, H / 2); s.closePath();
    const h = new THREE.Path(); h.absarc(hx, 0, hr, 0, PI * 2, true); s.holes.push(h);
    return new THREE.ExtrudeGeometry(s, { depth: .035, bevelEnabled: false, curveSegments: 28 });
  }), mat(wc)), 0, hy, fz - .035));
  f.add(put(cyl(hr, hr, .28, '#3f3a52', { side: THREE.BackSide }, 28, true), hx, hy, fz - .035 - .14, HP));
  f.add(put(rbox(.36, .02, .26, '#55506a', .008), hx, hy - .155, fz - .16));
  f.add(put(mg('ac-fan', '#7b8796', ({ add }) => { add(G.sph(.05, 12, 8), 0, 0, 0); for (let i = 0; i < 3; i++) { const a = i * PI * 2 / 3; add(G.sph(.1, 12, 8), Math.cos(a) * .1, Math.sin(a) * .1, 0, 0, 0, a, [1.2, .55, .18]); } }), hx, hy, fz - .26));
  const gp = new THREE.Group(); put(gp, hx - hr, hy, fz + .012);
  gp.add(put(mg('ac-grille', '#5f6b7a', ({ add }) => { add(G.tor(hr - .005, .014), 0, 0, 0); add(G.tor(hr * .58, .012), 0, 0, 0); add(G.box(hr * 2 - .02, .022, .022, .008), 0, 0, 0); add(G.box(.022, hr * 2 - .02, .022, .008), 0, 0, 0); add(G.cyl(.055, .055, .03, 16), 0, 0, 0, HP); }), hr, 0, 0));
  f.add(gp);
  const p = f.part('door', gp, t => { gp.rotation.y = -1.7 * t; }, { label: '실외기 팬', sfx: 'open' });
  p.lockable = true; p.lockKind = 'lever'; f.lockAt = { x: hr * 1.55, y: 0, z: .04, parent: gp };
  f.spot('inside', null, hx, hy - .145, fz - .13, { part: p, maxH: .3, label: '실외기 속', scale: .72 });
  f.add(mg('ac-vents', '#b8c2cc', ({ add }) => { for (let i = 0; i < 5; i++) add(G.box(.22, .022, .02, .008), .25, hy - .18 + i * .09, fz + .008); }));
  f.add(mg('ac-pipes', '#f1ead8', ({ add, tube }) => { for (const [y, r] of [[.28, .03], [.38, .026]]) { tube([W / 2 - .02, y, zc + .05], [W / 2 + .07, y, zc + .05], r); add(G.sph(r, 10, 8), W / 2 + .07, y, zc + .05); tube([W / 2 + .07, y, zc + .05], [W / 2 + .07, y, -.5], r); } }));
  f.spot('on', null, .14, y0 + H, zc, { maxH: .45, label: '실외기 위', scale: .9 });
  f.spot('under', null, -.05, 0, zc + .1, { maxH: .1, label: '실외기 밑', scale: .7 });
};

// 장바구니 자전거: wicker basket with a cloth bag (and the obligatory 대파), a lidded box on the rear rack
B.bike = (f, T) => {
  // 동네 자전거 (10/21 다시 — user "자전거도 다시": a pink lid floated behind, a pedal lay on the ground away from the frame, the
  // rear box hung empty in the air). A step-through town bike standing on its centre stand: spoked wheels under fenders, the
  // chainring, cranks and pedals on the frame with the chain to the rear cog, a saddle on its post, swept city bars with a
  // bell; the wicker basket in front (leeks and the shopping bag), a lidded box strapped onto a real rear rack.
  const fc = T.bike || '#3fc7b4', R = [-.5, .3, 0], F = [.55, .3, 0], BB = [-.03, .27, 0], RK = .64;
  const rim = '#c9d0dc', dark = '#3a3346';
  f.add(mg('bike2-tires', dark, ({ add }) => { for (const p of [R, F]) add(new THREE.TorusGeometry(.265, .038, 8, 26), ...p); }));
  f.add(mg('bike2-rims', rim, ({ add, tube }) => {
    for (const p of [R, F]) {
      add(new THREE.TorusGeometry(.222, .012, 4, 26), ...p); add(G.cyl(.04, .04, .1, 10), p[0], p[1], p[2], HP);
      for (let k = 0; k < 6; k++) { const a = k * PI / 6, dx = Math.cos(a) * .22, dy = Math.sin(a) * .22; tube([p[0] - dx, p[1] - dy, 0], [p[0] + dx, p[1] + dy, 0], .0045, 4); }
    }
    // the centre stand (two legs from the rear axle to the ground, a foot across) and the bell
    for (const sz of [-1, 1]) tube([R[0], R[1], sz * .055], [R[0] - .1, .012, sz * .13], .013, 6);
    tube([R[0] - .1, .012, -.13], [R[0] - .1, .012, .13], .012, 6);
    add(G.cyl(.028, .032, .03, 12), .31, .965, -.2); add(G.sph(.012, 6, 4), .31, .985, -.2);
  }));
  f.add(mg('bike2-frame', fc, ({ add, tube }) => {
    const r = .03;
    // step-through: the down tube sweeps low from the head tube to the bottom bracket
    tube([.39, .62, 0], [.24, .4, 0], r * 1.1); tube([.24, .4, 0], [.1, .29, 0], r * 1.1); tube([.1, .29, 0], BB, r * 1.1);
    tube(BB, [-.17, .7, 0], r);                                                            // seat tube
    tube([.39, .62, 0], [.36, .8, 0], r * 1.25);                                           // head tube
    tube([.39, .62, 0], [.5, .42, 0], r * .8); tube([.5, .42, 0], F, r * .8);             // fork
    for (const sz of [-1, 1]) {
      tube([BB[0], BB[1], sz * .04], [R[0], R[1], sz * .05], .016);                        // chain stays
      tube([-.16, .64, sz * .03], [R[0], R[1], sz * .05], .015);                            // seat stays
    }
    add(G.sph(.042, 10, 8), ...BB);
    // fenders over both wheels (a strip bent round the tyre's top half)
    for (const p of [R, F]) add(new THREE.TorusGeometry(.315, .02, 4, 16, PI * .95), p[0], p[1], 0, 0, 0, .1, [1, 1, 2.2]);
    // the rear rack: a flat grid over the rear wheel, struts down to the axle and forward to the seat stays
    for (const sz of [-1, 1]) { tube([-.76, RK, sz * .1], [-.26, RK, sz * .1], .011, 6); tube([-.76, RK, sz * .1], [R[0], R[1], sz * .055], .011, 6); tube([-.26, RK, sz * .1], [-.17, .62, sz * .03], .011, 6); }
    for (const x of [-.74, -.6, -.46, -.32]) tube([x, RK, -.1], [x, RK, .1], .009, 5);
  }));
  // the drive side (+z, toward the room): chainring, cranks and pedals on the bottom bracket, the chain back to the cog
  f.add(mg('bike2-drive', '#7d8696', ({ add, tube }) => {
    add(new THREE.TorusGeometry(.085, .013, 4, 18), BB[0], BB[1], .075); add(G.cyl(.06, .06, .01, 12), BB[0], BB[1], .075, HP);
    add(G.cyl(.045, .045, .012, 10), R[0], R[1], .075, HP);
    add(G.cyl(.016, .016, .2, 8), BB[0], BB[1], 0, HP);   // the axle the cranks turn on
    for (const [a, sz] of [[-1.05, .085], [-1.05 + PI, -.085]]) {
      const ex = BB[0] + Math.cos(a) * .17, ey = BB[1] + Math.sin(a) * .17;
      tube([BB[0], BB[1], sz], [ex, ey, sz], .014, 6);
    }
  }));
  f.add(mg('bike2-chain', dark, ({ add, tube }) => {
    tube([BB[0], BB[1] + .088, .075], [R[0], R[1] + .047, .075], .0065, 4); tube([BB[0], BB[1] - .088, .075], [R[0], R[1] - .047, .075], .0065, 4);
    for (const [a, sz] of [[-1.05, .12], [-1.05 + PI, -.12]]) add(G.box(.1, .025, .06, .008), BB[0] + Math.cos(a) * .17, BB[1] + Math.sin(a) * .17, sz);   // pedals
    // grips, the saddle's dark parts
    for (const sz of [-1, 1]) add(G.cap(.022, .08), .27, .96, sz * .26, HP);
  }));
  f.add(mg('bike2-bars', rim, ({ tube }) => {
    tube([.36, .8, 0], [.36, .93, 0], .018, 6);                                              // stem
    for (const sz of [-1, 1]) { tube([.36, .93, 0], [.33, .95, sz * .14], .015, 6); tube([.33, .95, sz * .14], [.27, .96, sz * .23], .015, 6); }
    tube([-.17, .7, 0], [-.19, .83, 0], .016, 6);                                            // seat post
  }));
  f.add(put(rbox(.27, .06, .15, '#6b4a3a', .028), -.2, .86, 0, 0, 0, .05));                  // saddle
  // front basket on its bracket
  const bx = .64, by = .7;
  f.add(mg('bike2-bracket', dark, ({ tube }) => { tube([.37, .78, 0], [bx - .12, by + .02, 0], .012, 5); tube([.5, .42, 0], [bx + .02, by, 0], .01, 5); }));
  f.add(mg('bike-basket', '#ffffff', ({ add }) => hollowBox(add, .32, .24, .36, .022, bx, by, 0), { map: wickerTex() }));
  const bag = grp(put(sph(.15, '#ff8fb8'), 0, 0, 0, 0, 0, 0, [1, .55, 1.1]), put(tor(.06, .012, '#ff6f91'), 0, .07, 0, 0, HP, 0));
  put(bag, bx, by + .12, .05); f.add(bag);
  const bp = f.part('lift', bag, (t, b) => { bag.position.y = b.p.y + .34 * t; bag.rotation.x = -.35 * t; bag.rotation.z = .25 * t; }, { label: '장바구니', sfx: 'lift' });
  f.spot('inside', null, bx, by + .022, .04, { part: bp, maxH: .24, label: '자전거 바구니', scale: .7 });
  f.add(mg('bike-pa-w', '#ffffff', ({ add }) => { add(G.cap(.024, .2), bx - .02, by + .2, -.12, 0, 0, -.45); add(G.cap(.024, .2), bx + .02, by + .2, -.09, 0, 0, -.5); }));
  f.add(mg('bike-pa-g', '#5fc45a', ({ add }) => { add(G.cap(.022, .22), bx + .1, by + .4, -.12, 0, 0, -.45); add(G.cap(.022, .22), bx + .15, by + .38, -.09, 0, 0, -.5); }));
  // the rear box, sitting on the rack, two black straps round it; its lid hinges on a pin along the back edge
  const rx = -.51, ry = RK + .012, bw = .36, bh = .22, bd = .3, boxC = T.accent2 || '#4fb8ff';
  f.add(mg('bike2-rbox', boxC, ({ add }) => hollowBox(add, bw, bh, bd, .022, rx, ry, 0)));
  f.add(mg('bike2-rbox-trim', dark, ({ add }) => {
    for (const x of [rx - .1, rx + .1]) { add(G.box(.03, .006, bd + .012, .003), x, ry - .002, 0); add(G.box(.03, bh, .006, .003), x, ry + bh / 2, bd / 2 + .004); add(G.box(.03, bh, .006, .003), x, ry + bh / 2, -bd / 2 - .004); }
    add(G.cyl(.012, .012, bw - .02, 8), rx, ry + bh + .006, -bd / 2 - .006, 0, 0, HP);      // the hinge pin
  }));
  const lid = grp(put(rbox(bw + .02, .035, bd + .02, T.accent3 || '#ffd23f', .014), 0, .018, (bd + .02) / 2), put(rbox(.06, .03, .02, dark, .008), 0, .0, bd + .025));
  put(lid, rx, ry + bh, -bd / 2 - .006); f.add(lid);
  const lp = f.part('lid', lid, t => { lid.rotation.x = -1.6 * t; }, { label: '짐칸 상자', sfx: 'open', dur: .26 });
  lp.lockable = true; lp.lockKind = 'pad'; f.lockAt = { x: 0, y: -.05, z: bd + .04, parent: lid };
  f.spot('inside', null, rx, ry + .022, 0, { part: lp, maxH: .19, label: '짐칸 상자', scale: .65 });
};

// 쓰레기 봉투 더미: 종량제 봉투 (one rolls aside), a taped box, the 무단투기 금지 sign — 10/22 밤 사용자 "양파 같은 덩어리, 띠 글자
// 잘림, 팻말 판자가 얇고 납작": bags that bulge and crease round a twisted neck with two tied ears, the word on a flat label,
// the sign a real board (thickness, a red frame, bolts) on a square wooden post
function bagGeo(s) {
  return geo('bagbody|' + s, () => {
    const pts = [[0, 0], [.13, .01], [.21, .05], [.25, .12], [.25, .2], [.21, .29], [.14, .36], [.07, .41], [.035, .44]].map(([r, y]) => new THREE.Vector2(r * s, y * s));
    const g = new THREE.LatheGeometry(pts, 30), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), t = y / (.44 * s);
      const k = 1 + (.07 * Math.sin(7 * a + t * 5) + .035 * Math.sin(13 * a - t * 3)) * Math.sin(PI * Math.min(1, t * 1.15));
      p.setXYZ(i, x * k, y, z * k);
    }
    g.computeVertexNormals();
    return g;
  });
}
B.trashbags = (f, T) => {
  const knot = mg('bag-knot2', '#f6f3ec', ({ add }) => {
    add(G.cyl(.024, .032, .05, 10), 0, 0, 0); add(G.sph(.032, 10, 8), 0, .03, 0);
    add(G.cone(.036, .11, 10), -.045, .075, 0, 0, 0, .8, [1, 1, .45]); add(G.cone(.036, .11, 10), .045, .075, 0, 0, 0, -.8, [1, 1, .45]);
  });
  const bag = s => grp(mesh(bagGeo(s), mat('#ffffff', { map: bagSkinTex() })), put(plane(.21 * s, .092 * s, mat('#ffffff', { map: bagLabelTex() })), 0, .19 * s, .275 * s, -.06, 0, 0),
    put(knot.clone(), 0, .44 * s - .012, 0));
  const A = bag(1); put(A, .2, 0, -.18, 0, .5, .04); f.add(A);
  const Bg = bag(.84); put(Bg, -.12, 0, .22, 0, .9, 0); f.add(Bg);
  const p = f.part('lift', Bg, (t, b) => { Bg.position.x = b.p.x + .26 * t; Bg.position.y = b.p.y + .06 * Math.sin(t * PI) + .02 * t; Bg.rotation.z = -1.1 * t; }, { label: '쓰레기 봉투', sfx: 'swish' });
  f.spot('inside', null, -.12, 0, .22, { part: p, maxH: .3, label: '봉투 밑', scale: .8 });
  const bxX = -.24, bxZ = -.22, W = .42, Hb = .34, Db = .4;
  f.add(mg('tb-box', '#dcae6e', ({ add }) => hollowBox(add, W, Hb, Db, .025, bxX, 0, bxZ)));
  f.add(mg('tb-fill', '#f4efe6', ({ add }) => { add(G.box(W - .06, .1, Db - .06, .02), bxX, .07, bxZ); for (const [x, z] of [[-.1, -.08], [.09, .06], [-.05, .1], [.1, -.1]]) add(G.sph(.07, 10, 8), bxX + x, .13, bxZ + z, .3, x * 9, 0, [1, .7, 1]); }));
  const fL = grp(put(rbox(W / 2, .02, Db, '#e8bd7c', .008), W / 4, 0, 0)), fR = grp(put(rbox(W / 2, .02, Db, '#e8bd7c', .008), -W / 4, 0, 0));
  put(fL, bxX - W / 2, Hb + .01, bxZ); put(fR, bxX + W / 2, Hb + .01, bxZ); f.add(fL); f.add(fR);
  const bp = f.part('lid', [fL, fR], t => { fL.rotation.z = 2.2 * t; fR.rotation.z = -2.2 * t; }, { label: '상자', sfx: 'open' });
  f.spot('inside', null, bxX, .12, bxZ, { part: bp, maxH: .3, label: '상자 안', scale: .8 });
  const sign = grp(mg('nd-post', '#8a5a3a', ({ add }) => { add(G.box(.06, .9, .06, .012), 0, .45, 0); add(G.box(.14, .05, .14, .015), 0, .025, 0); }),
    put(rbox(.42, .3, .04, '#e8454f', .012), 0, .72, .035), put(rbox(.38, .26, .046, '#ffffff', .01), 0, .72, .036),
    put(plane(.36, .24, mat('#ffffff', { map: noDumpTex() })), 0, .72, .06),
    mg('nd-bolts', '#8c939e', ({ add }) => { for (const x of [-.15, .15]) add(G.sph(.012, 8, 6), x, .83, .061); }));
  put(sign, .4, 0, -.46, 0, .35, 0); f.add(sign);
};

// 빨랫줄: a flowery 이불 on the line — touched, it curls up from its hem (③ #97 10/21, one way for every 이불: gfx/clothbend.js;
// it used to slide along the line), uncovering the laundry basket behind it. (10/22 밤 사용자 "이불이 판자처럼 빳빳, 티도 납작,
// 회색 쇠기둥": the quilt hangs folded over a sagging line, soft folds deepening to the hem, held by pegs; the T-shirt and socks
// are cloth too and sway a little on their pegs; wooden posts)
// a hanging cloth, cached per size (gfx/clothbend.js clothSlab: soft folds deepening toward the hem)
const clothGeo = (w, h, folds = 3, amp = .03, d = .024) => geo(`cloth|${w}|${h}|${folds}|${amp}|${d}`, () => clothSlab(w, h, d, clothWave(w, h, folds, amp)));
B.clothesline = (f, T) => {
  const lz = -.04, lineY = x => { const t = (x + .86) / 1.72; return 1.52 - .24 * t * (1 - t); };
  f.add(mg('cl-poles2', T.woodD || '#b9814f', ({ add }) => { for (const x of [-.86, .86]) { add(G.box(.07, 1.6, .07, .015), x, .8, lz); add(G.box(.07, .06, .3, .015), x, 1.56, lz); } }));
  f.add(mg('cl-bases', '#d6d0c6', ({ add }) => { for (const x of [-.86, .86]) add(G.box(.24, .12, .24, .03), x, .06, lz); }));
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.86, 1.52, lz), new THREE.Vector3(0, 1.4, lz), new THREE.Vector3(.86, 1.52, lz));
  f.add(mesh(geo('cl-line-sag', () => new THREE.TubeGeometry(curve, 24, .011, 6, false)), mat('#ffffff')));
  const qx = -.3, qy = lineY(qx), cloth = mat('#ffffff', { map: flowerTex() });
  const pv = new THREE.Group(); put(pv, qx, qy, lz);
  pv.add(put(mesh(clothGeo(.84, 1.3, 3, .05), cloth), 0, -.02, .03));
  pv.add(put(mesh(clothGeo(.84, .34, 3, .018), cloth), 0, -.02, -.024));
  pv.add(put(cyl(.03, .03, .86, '#ff5f8f', null, 12), 0, -.006, 0, 0, 0, HP));
  f.add(pv);
  const p = f.part('lift', pv, clothBend(f, pv, { along: [0, -1, 0], toward: [0, 0, 1], len: 1.36, turn: 4.4, bias: 3, tip: .15 }), { label: '이불', sfx: 'flip', dur: .72 });
  // pegs on the line: three for the quilt, two for the shirt, one for each sock
  const pegs = [qx - .36, qx, qx + .36, .51, .69, .18, .3];
  f.add(mg('cl-pegs', '#5fb8ff', ({ add }) => { for (const x of pegs) add(G.box(.022, .06, .03, .006), x, lineY(x) - .01, lz + .03); }));
  const shirt = new THREE.Group(), tc = T.accent3 || '#ffd23f', sy = lineY(.6);
  shirt.add(put(mesh(clothGeo(.26, .3, 2, .014, .022), mat(tc)), 0, -.03, 0));
  for (const s of [-1, 1]) shirt.add(put(mesh(clothGeo(.1, .11, 1, .008, .02), mat(tc)), s * .15, -.03, 0, 0, 0, s * .95));
  shirt.add(put(tor(.045, .01, shade(tc, -.12), null, PI, 6, 12), 0, -.03, .012, 0, 0, PI));
  put(shirt, .6, sy, lz + .006); f.add(shirt);
  const socks = new THREE.Group();
  socks.add(mg('cl-socks2', '#ff7eb6', ({ add }) => { for (const x of [.18, .3]) { add(G.cap(.032, .13), x, lineY(x) - .1, 0); add(G.cap(.03, .05), x + .03, lineY(x) - .19, .015, HP * .9, 0, 0); } }));
  put(socks, 0, 0, lz + .006); f.add(socks);
  f.live = [...(f.live || []), shirt, socks];
  f.tick = t => { shirt.rotation.x = Math.sin(t * 1.3) * .06; socks.rotation.x = Math.sin(t * 1.5 + 1) * .04; };
  const bx = -.32, bz = -.3;
  f.add(mg('cl-basket', '#ffffff', ({ add }) => hollowBox(add, .52, .26, .3, .025, bx, 0, bz), { map: basketTex() }));
  f.add(mg('cl-clothes', '#9fd8ff', ({ add }) => { add(G.box(.46, .12, .24, .03), bx, .08, bz); for (const [x, z] of [[-.12, -.04], [.1, .05], [0, -.06]]) add(G.sph(.08, 10, 8), bx + x, .16, bz + z, 0, x * 7, 0, [1.3, .5, .9]); }));
  f.spot('inside', null, bx, .17, bz, { part: p, maxH: .35, label: '빨래 바구니', scale: .8 });
  f.spot('on', null, -.86, .12, lz, { maxH: .4, label: '빨랫대 받침', scale: .75 });
};

// 계단: concrete steps to a 2nd floor; a blue tarp under the stairs hides things, a 싸리비 leans on the pillar
B.stairs = (f, T) => {
  const conc = col(T, 'concrete'), D = .58, z0 = -.2, n = 6, run = .27, rise = .2, x0 = -.86, top = n * rise, k = rise / run, soff = x => k * (x - x0) - .25;
  f.add(mg('stairs2', conc, ({ add }) => {
    const sh = new THREE.Shape(); sh.moveTo(x0, 0);
    for (let i = 0; i < n; i++) { sh.lineTo(x0 + i * run, (i + 1) * rise); sh.lineTo(x0 + (i + 1) * run, (i + 1) * rise); }
    sh.lineTo(.86, top); sh.lineTo(.86, 0); sh.lineTo(.72, 0); sh.lineTo(.72, soff(.72)); sh.lineTo(x0 + .25 / k, 0); sh.closePath();
    add(new THREE.ExtrudeGeometry(sh, { depth: D - .03, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 1 }), 0, 0, z0 - D / 2 + .015);
  }));
  f.add(mg('stairs-nose', '#ffd23f', ({ add }) => { for (let i = 0; i < n; i++) add(G.box(.06, .014, D - .08, .005), x0 + i * run + .045, (i + 1) * rise + .022, z0); }));
  const fz = z0 + D / 2 - .03;
  f.add(mg('stairs-rail', '#3faa7a', ({ tube }) => {
    const pts = [1, 3, 5].map(i => [x0 + run * (i + .5), rise * (i + 1), fz]);
    for (const [x, y, z] of pts) tube([x, y, z], [x, y + .5, z], .022);
    tube([pts[0][0] - .12, pts[0][1] + .5 - .089, fz], [pts[2][0] + .06, pts[2][1] + .5 + .044, fz], .026);
  }));
  const tp = grp(put(hemi(.28, '#3f7fe0'), 0, 0, 0, 0, 0, 0, [1, .9, .75]), put(tor(.19, .014, '#ffd23f'), 0, .12, 0, HP, 0, 0, [1, .7, 1]));
  put(tp, .43, 0, z0); f.add(tp);
  const p = f.part('lift', tp, (t, b) => { tp.position.z = b.p.z + .44 * t; tp.scale.y = 1 - .55 * t; tp.rotation.x = .2 * t; }, { label: '방수포', sfx: 'swish' });
  f.spot('inside', null, .43, 0, z0, { part: p, maxH: .36, label: '계단 밑 방수포', scale: .85 });
  f.spot('under', null, -.05, 0, z0 + .04, { maxH: .26, label: '계단 밑', scale: .8 });
  f.spot('on', null, x0 + run * 1.5, rise * 2, z0 - .05, { maxH: .45, label: '계단 위', scale: .8 });
  const px = x0 + run * 5.5;
  f.add(put(lathe('spot-pot', [[0, 0], [.08, 0], [.11, .14], [.12, .14], [.12, .17], [0, .17]], '#e07a52'), px, top, z0 - .12));
  f.add(put(mg('step-plant', '#5fc45a', ({ add }) => { for (let i = 0; i < 4; i++) { const a = i * HP; add(G.sph(.06, 10, 8), Math.cos(a) * .05, .22, Math.sin(a) * .05, 0, -a, .6, [1.3, .5, .7]); } add(G.sph(.05, 10, 8), 0, .27, 0); }), px, top, z0 - .12));
  f.add(mg('broom-stick', '#c98f58', ({ tube }) => tube([.8, .3, .2], [.75, 1.02, .12], .02)));
  f.add(put(cone(.12, .36, '#e2c27a', null, 12), .805, .18, .205, 0, 0, 0, [1, 1, .4]));
};

// ═════════════════════════════════════════════ PARK ═════════════════════════════════════════════
// 미끄럼틀: deck with a pointy roof, ladder, chute, and a little cubby under the deck behind a porthole door
B.slide = (f, T) => {
  const post = T.accent3 || '#ffd23f', deck = T.accent2 || '#4fb8ff', chute = T.accent || '#ff6f91', px = -.48, py = .9, P = .31;
  f.add(mg('slide-posts', post, ({ add, tube }) => {
    for (const x of [px - P + .04, px + P - .04]) for (const z of [-P + .04, P - .04]) add(G.cyl(.045, .045, 1.32, 12), x, .66, z);
    for (const z of [-P + .04, P - .04]) tube([px - P + .04, 1.12, z], [px + P - .04, 1.12, z], .03);
    add(G.cyl(.04, .04, .2, 10), .82, .1, 0);
  }));
  f.add(put(rbox(2 * P + .06, .08, 2 * P + .06, deck, .025), px, py, 0));
  f.add(put(cone(.56, .34, '#ff6b5e', null, 4), px, 1.49, 0, 0, PI / 4, 0));
  const lx = px - P - .07;
  f.add(mg('slide-ladder', deck, ({ tube }) => { for (const z of [-.17, .17]) tube([lx - .08, 0, z], [lx, py + .32, z], .03); for (let i = 1; i <= 4; i++) { const k = i / 5; tube([lx - .08 * (1 - k), (py + .32) * k - .04, -.17], [lx - .08 * (1 - k), (py + .32) * k - .04, .17], .022); } }));
  const s0 = [px + P, py + .04], s1 = [.72, .2], dx = s1[0] - s0[0], dy = s1[1] - s0[1], L = Math.hypot(dx, dy), a = Math.atan2(dy, dx), cx = (s0[0] + s1[0]) / 2, cy = (s0[1] + s1[1]) / 2, ux = -Math.sin(a), uy = Math.cos(a);
  f.add(mg('slide-chute', chute, ({ add }) => {
    add(G.box(L + .06, .04, .38, .015), cx, cy, 0, 0, 0, a);
    for (const z of [-.19, .19]) add(G.box(L + .06, .11, .035, .015), cx + ux * .04, cy + uy * .04, z, 0, 0, a);
    add(G.box(.24, .04, .38, .015), .82, .2, 0);
    for (const z of [-.19, .19]) add(G.box(.24, .08, .035, .015), .82, .23, z);
  }));
  f.add(mg('slide-cubby', '#fff4d6', ({ add }) => {
    add(G.box(2 * P, py - .04, .03, .01), px, (py - .04) / 2, -P + .015);
    for (const x of [px - P + .015, px + P - .015]) add(G.box(.03, py - .04, 2 * P, .01), x, (py - .04) / 2, 0);
  }));
  const dv = new THREE.Group(); put(dv, px - P + .03, (py - .04) / 2, P - .01);
  dv.add(put(rbox(2 * P - .06, py - .08, .035, '#ffffff', .015, { map: doorPortholeTex(T.accent || '#ff8fb0') }), P - .03, 0, 0));
  f.add(dv);
  const p = f.part('door', dv, t => { dv.rotation.y = -1.6 * t; }, { label: '미끄럼틀 아래 문', sfx: 'door' });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: 2 * P - .17, y: 0, z: .035, parent: dv };
  f.spot('inside', null, px, 0, .04, { part: p, maxH: .45, label: '미끄럼틀 아래 방' });
  f.spot('on', null, px, py + .04, -.06, { maxH: .3, label: '미끄럼틀 꼭대기', scale: .85 });
  f.spot('on', null, .84, .22, 0, { maxH: .4, label: '미끄럼틀 끝', scale: .85 });
  f.spot('under', null, .3, 0, 0, { maxH: .35, label: '미끄럼틀 밑', scale: .85 });
};

// 그네: A-frame with two seats over worn sand
B.swing = (f, T) => {
  const Hs = 1.62, X = .88;
  f.add(mg('swing-frame', T.accent || '#ff6b5e', ({ tube }) => { for (const sx of [-1, 1]) { tube([sx * X, 0, -.42], [sx * X, Hs, 0], .045); tube([sx * X, 0, .42], [sx * X, Hs, 0], .045); tube([sx * X, .32, -.34], [sx * X, .32, .34], .03); } }));
  f.add(put(cyl(.055, .055, 2 * X + .16, T.accent2 || '#4fb8ff', null, 14), 0, Hs, 0, 0, 0, HP));
  const sand = mg('swing-sand', col(T, 'sand'), ({ add }) => { for (const x of [-.42, .42]) add(new THREE.CircleGeometry(.34, 24), x, .006, 0, -HP); });
  sand.castShadow = false; f.add(sand);
  f.add(mg('swing-chains', '#a3adb8', ({ tube }) => { for (const x of [-.42, .42]) for (const dx of [-.16, .16]) tube([x + dx, Hs - .03, 0], [x + dx, .47, 0], .014, 6); }));
  f.add(put(rbox(.4, .05, .2, T.accent3 || '#ffd23f', .02), -.42, .45, 0));
  f.add(put(rbox(.4, .05, .2, '#7bd96a', .02), .42, .45, 0));
  f.spot('on', null, -.42, .475, 0, { maxH: .4, label: '그네 위', scale: .85 });
  f.spot('on', null, .42, .475, 0, { maxH: .4, label: '그네 위', scale: .85 });
  f.spot('under', null, .0, 0, -.26, { maxH: .45, label: '그네 밑', scale: .85 });
};

// 모래밭: dig the two sand mounds, lift the upturned toy bucket
B.sandbox = (f, T) => {
  const wood = T.wood || '#ecc08a', sand = col(T, 'sand'), W = 1.86, D = .9;
  f.add(mg('sbox-frame', wood, ({ add }) => {
    for (const z of [-D / 2 + .06, D / 2 - .06]) add(G.box(W, .2, .12, .03), 0, .1, z);
    for (const x of [-W / 2 + .06, W / 2 - .06]) add(G.box(.12, .2, D - .24, .03), x, .1, 0);
    add(G.box(.32, .04, .32, .015), W / 2 - .16, .22, D / 2 - .16); add(G.box(.32, .04, .32, .015), -W / 2 + .16, .22, -D / 2 + .16);
  }));
  f.add(put(rbox(W - .2, .12, D - .2, sand, .02), 0, .07, 0));
  const mound = (x, z, s, label) => {
    const m = grp(put(hemi(.3, shade(sand, -.05)), 0, 0, 0, 0, 0, 0, [1.1 * s, .78 * s, 1 * s])); put(m, x, .13, z); f.add(m);
    // dug open: the sand is pushed aside into a low heap clear of the hollow (squashed in place it still covered a flat
    // card lying in it — found by the bot sweep, stage 48)
    const p = f.part('lift', m, (t, b) => { m.scale.set(1 - .25 * t, 1 - .55 * t, 1 - .25 * t); m.position.x = b.p.x + Math.sign(x) * .36 * t; m.position.z = b.p.z + .06 * t; }, { label, sfx: 'swish', dur: .36 });
    f.spot('inside', null, x, .13, z, { part: p, maxH: .3, label, scale: .85 });
  };
  mound(-.45, -.06, 1, '모래 둔덕'); mound(.32, .08, .9, '모래 둔덕');
  const bk = grp(put(cyl(.1, .13, .17, '#ff6b5e', null, 18), 0, .085, 0), put(tor(.115, .01, '#ffd23f', null, PI), 0, .02, 0, 0, 0, PI));
  put(bk, -.06, .13, .27); f.add(bk);
  const bp = f.part('lift', bk, (t, b) => { bk.position.y = b.p.y + .28 * t; bk.rotation.z = .75 * t; }, { label: '모래 양동이', sfx: 'lift' });
  f.spot('inside', null, -.06, .13, .27, { part: bp, maxH: .2, label: '양동이 밑', scale: .72 });
  f.add(put(mg('sandcastle', shade(sand, -.07), ({ add }) => { add(G.cyl(.09, .1, .12, 14), 0, .06, 0); for (const [x, z] of [[-.05, -.03], [.05, -.02], [0, .05]]) add(G.cone(.035, .09, 8), x, .16, z); }), .62, .13, -.18));
  f.spot('on', null, W / 2 - .16, .24, D / 2 - .16, { maxH: .4, label: '모래밭 모서리', scale: .8 });
};

// 벤치: newspaper someone left, a pigeon
B.bench = (f, T) => {
  const sy = .42;
  f.add(mg('bench-iron', '#2f6d57', ({ tube }) => {
    for (const sx of [-1, 1]) {
      const x = sx * .78;
      tube([x, 0, .16], [x, sy, .14], .03); tube([x, 0, -.18], [x, sy, -.16], .03); tube([x, sy, -.16], [x, .88, -.28], .03);
      tube([x, sy - .03, .19], [x, sy - .03, -.2], .03); tube([x, .62, .2], [x, .62, -.2], .028); tube([x, .62, .2], [x, sy, .15], .028);
    }
  }));
  f.add(mg('bench-slats', T.wood || '#e7a967', ({ add }) => {
    for (const z of [.12, 0, -.12]) add(G.box(1.8, .045, .1, .02), 0, sy + .02, z);
    for (const [y, z] of [[.62, -.21], [.79, -.25]]) add(G.box(1.8, .1, .035, .02), 0, y, z, -.22, 0, 0);
  }));
  const np = grp(put(rbox(.44, .025, .3, '#ffffff', .008, { map: newsTex() }), 0, 0, 0)); put(np, .45, sy + .056, 0, 0, .22, 0); f.add(np);
  const p = f.part('lift', np, (t, b) => { np.position.y = b.p.y + .3 * t; np.rotation.x = -.38 * t; np.rotation.z = .15 * t; }, { label: '신문지', sfx: 'swish' });
  f.spot('inside', null, .45, sy + .045, 0, { part: p, maxH: .3, label: '신문지 밑', scale: .82 });
  f.spot('on', null, -.42, sy + .045, 0, { maxH: .45, label: '벤치 위', scale: .85 });
  f.spot('under', null, 0, 0, -.02, { maxH: .35, label: '벤치 밑', scale: .85 });
  f.add(put(mg('pigeon', '#a9aec8', ({ add }) => { add(G.sph(.09, 12, 9), 0, .09, 0, 0, 0, .15, [1.3, .9, .9]); add(G.sph(.055, 12, 9), .1, .19, 0); add(G.box(.1, .03, .07, .01), -.13, .1, 0, 0, 0, .3); }), -.64, 0, .34, 0, .5, 0));
  f.add(put(mg('pigeon-b', '#ff9f43', ({ add }) => { add(G.cone(.022, .06, 8), .17, .19, 0, 0, 0, -HP); }), -.64, 0, .34, 0, .5, 0));
};

// 나무: a hollow at the roots and a 새집 whose roof lifts
B.tree = (f, T) => {
  const bark = col(T, 'bark'), leaf = col(T, 'leaf');
  f.add(mg('tree-trunk', bark, ({ add, tube }) => {
    add(G.cyl(.13, .2, 1.3, 16), 0, .65, 0);
    for (let i = 0; i < 4; i++) { const a = i * HP + .7; tube([Math.sin(a) * .1, .2, Math.cos(a) * .1], [Math.sin(a) * .32, .02, Math.cos(a) * .32], .09, 10, .035); }
  }));
  f.add(put(sph(.12, '#3b2a33'), 0, .12, .17, 0, 0, 0, [1, 1.25, .38]));
  f.spot('behind', null, 0, 0, .33, { maxH: .25, label: '나무 밑동', scale: .7 });
  f.add(mg('tree-canopy', leaf, ({ add }) => { for (const [x, y, z, r] of [[0, 1.66, 0, .56], [-.36, 1.46, .08, .38], [.37, 1.5, -.04, .4], [.04, 2.05, -.06, .38], [.1, 1.52, .32, .33], [-.12, 1.6, -.32, .36]]) add(G.sph(r, 18, 12), x, y, z); }));
  f.add(mg('tree-canopy2b', col(T, 'leaf2'), ({ add }) => { for (const [x, y, z, r] of [[-.2, 1.92, .28, .16], [.3, 1.8, .3, .14], [-.42, 1.62, .3, .12], [.1, 2.3, .1, .14], [.44, 1.62, .2, .11], [-.05, 1.62, .55, .12], [-.38, 1.95, -.05, .12]]) add(G.sph(r, 12, 9), x, y, z); }));   // (more light tufts: the crown read as one green ball — ① 10/21)
  const hx = 0, hy = .66, hz = .27;
  // the front is a wide window (low lip + header) so whatever sits inside can be seen once the roof is up
  f.add(mg('birdhouse', '#ffcf5c', ({ add }) => {
    hollowBox(add, .2, .2, .18, .02, hx, hy - .1, hz, { front: false });
    add(G.box(.2, .05, .02, .008), hx, hy - .075, hz + .08); add(G.box(.2, .04, .02, .008), hx, hy + .08, hz + .08);
    add(G.cyl(.012, .012, .08, 6), hx, hy - .07, hz + .12, HP);
  }));
  const roof = grp(put(mg('bh-roof', '#ff6b5e', ({ add }) => { add(G.box(.15, .025, .24, .008), -.055, .03, 0, 0, 0, .6); add(G.box(.15, .025, .24, .008), .055, .03, 0, 0, 0, -.6); }), 0, 0, 0));
  put(roof, hx, hy + .1, hz); f.add(roof);
  const p = f.part('lift', roof, (t, b) => { roof.position.y = b.p.y + .2 * t; roof.position.x = b.p.x + .12 * t; roof.rotation.z = -.5 * t; }, { label: '새집 지붕', sfx: 'lift' });
  f.spot('inside', null, hx, hy - .08, hz, { part: p, maxH: .18, label: '새집 안', scale: .55 });
  f.spot('behind', null, 0, 0, -.34, { maxH: .45, label: '나무 뒤', scale: .85 });
};

// 덤불: the two halves lean apart
B.bush = (f, T) => {
  const leaf = T.hedge || col(T, 'leaf'), fl = T.flower || '#ff8fb8';
  const half = sx => {
    const pv = new THREE.Group(); put(pv, sx * .46, 0, 0, 0, sx > 0 ? PI : 0, 0);
    pv.add(mg('bush-half', leaf, ({ add }) => { for (const [x, y, z, r] of [[.24, .28, 0, .3], [.14, .22, .2, .22], [.14, .22, -.2, .22], [.3, .5, .05, .22], [.12, .46, -.04, .2]]) add(G.sph(r, 16, 11), x, y, z); }));
    pv.add(mg('bush-flowers', fl, ({ add }) => { for (const [x, y, z] of [[.2, .46, .26], [.34, .64, .14], [.08, .36, .3], [.4, .34, .22], [.26, .2, -.32]]) add(G.sph(.04, 8, 6), x, y, z); }));
    f.add(pv); return pv;
  };
  const L = half(-1), R = half(1);
  const p = f.part('lift', [L, R], (t, bl, br) => { L.rotation.z = .55 * t; L.position.x = bl.p.x - .08 * t; R.rotation.z = .55 * t; R.position.x = br.p.x + .08 * t; }, { label: '덤불', sfx: 'swish' });
  f.spot('inside', null, 0, 0, .04, { part: p, maxH: .4, label: '덤불 속', scale: .9 });
  f.spot('behind', null, 0, 0, -.4, { maxH: .4, label: '덤불 뒤', scale: .8 });
  f.spot('on', L, .3, .7, .05, { maxH: .3, label: '덤불 위', scale: .7 });   // (레벨 세션 10/18: 숨은그림 판의 'on' 자리)
};

// 공원 쓰레기통: 일반 / 재활용 lids
B.parkbin = (f, T) => {
  const body = col(T, 'bin'), W = .8, H = .84, D = .46, z0 = -.06;
  f.add(mg('pbin-body', body, ({ add }) => { hollowBox(add, W, H, D, .045, 0, 0, z0); add(G.box(.04, H - .05, D - .06, .01), 0, H / 2, z0); }));
  f.add(put(plane(W - .1, .25, mat('#ffffff', { map: binLabelTex() })), 0, H * .55, z0 + D / 2 + .003));
  f.add(face(0, H * .83, z0 + D / 2 + .002, 1.05));
  f.add(mg('pbin-fill', '#e9e5f0', ({ add }) => { for (const sx of [-1, 1]) { add(G.box(W / 2 - .08, .5, D - .1, .02), sx * W / 4, .3, z0); for (const [x, z] of [[-.08, -.08], [.08, .06], [-.04, .1]]) add(G.sph(.075, 10, 8), sx * W / 4 + x, .56, z0 + z, .3, x * 9, 0, [1, .7, 1]); } }));
  for (const [sx, lab] of [[-1, '일반쓰레기통'], [1, '재활용통']]) {
    const lid = grp(put(rbox(W / 2 - .012, .06, D + .05, shade(body, -.08), .025), 0, .03, D / 2 + .01), put(rbox(.12, .03, .05, '#ffffff', .012), 0, .07, D - .02));
    put(lid, sx * W / 4, H, z0 - D / 2 - .01); f.add(lid);
    const p = f.part('lid', lid, t => { lid.rotation.x = -1.7 * t; }, { label: lab, sfx: 'open' });
    if (sx < 0) { p.lockable = true; p.lockKind = 'color'; f.lockAt = { x: 0, y: -.06, z: D + .05, parent: lid }; }
    f.spot('inside', null, sx * W / 4, .6, z0, { part: p, maxH: .35, label: lab, scale: .8 });
  }
  f.spot('behind', null, 0, 0, -.42, { maxH: .4, label: '쓰레기통 뒤', scale: .8 });
  f.spot('on', f.parts[1].pivots[0], 0, .062, D / 2 - .02, { maxH: .35, label: '쓰레기통 뚜껑 위', scale: .75 });   // (레벨 세션 10/18: 숨은그림 판의 'on' 자리)
};

// 시소: push it the other way to see what the down seat was sitting on
B.seesaw = (f, T) => {
  const a0 = .25, py = .34;
  f.add(mg('seesaw-base', T.accent3 || '#ffd23f', ({ add }) => { add(G.cyl(.2, .2, .34, 3), 0, .1, 0, -HP, 0, 0); add(G.cyl(.045, .045, .4, 12), 0, py - .03, 0, HP, 0, 0); }));
  const pv = new THREE.Group(); put(pv, 0, py, 0, 0, 0, a0);
  pv.add(put(rbox(1.9, .06, .24, T.accent2 || '#4fb8ff', .025), 0, .03, 0));
  pv.add(put(rbox(.3, .06, .3, T.accent || '#ff6f91', .03), -.78, .08, 0));
  pv.add(put(rbox(.3, .06, .3, '#7bd96a', .03), .78, .08, 0));
  pv.add(mg('seesaw-handles', '#a3adb8', ({ tube }) => { for (const sx of [-1, 1]) { const x = sx * .56; tube([x, .05, -.1], [x, .26, -.1], .02); tube([x, .05, .1], [x, .26, .1], .02); tube([x, .26, -.1], [x, .26, .1], .02); } }));
  f.add(pv);
  const p = f.part('lift', pv, t => { pv.rotation.z = a0 - 2 * a0 * t; }, { label: '시소', sfx: 'lift', dur: .4 });
  f.add(put(tor(.16, .06, '#3a3346'), -.8, .03, 0, HP));
  f.spot('inside', null, -.8, 0, 0, { part: p, maxH: .3, label: '시소 밑 타이어', scale: .7 });
  f.spot('behind', null, .3, 0, -.36, { maxH: .3, label: '시소 뒤', scale: .8 });
};

// ═════════════════════════════════════════════ CAMP ═════════════════════════════════════════════
// 텐트: A-frame pup tent; the front panel has an arched door that rolls up, with a little face above it
B.tent = (f, T) => {
  const body = col(T, 'tent'), flapC = col(T, 'tent2'), hw = .68, Ht = 1.0, zb = -.3, zf = .46, L = zf - zb, mz = (zb + zf) / 2;
  const slope = Math.atan2(Ht, hw), sl = Math.hypot(hw, Ht), dw = .27, dh = .29;   // door: half width, straight part height
  const arch = (sh, w, h0, y0 = 0) => { sh.moveTo(-w, y0); sh.lineTo(w, y0); sh.lineTo(w, h0); sh.absarc(0, h0, w, 0, PI, false); sh.lineTo(-w, y0); return sh; };
  f.add(put(rbox(2 * hw + .14, .025, L + .12, '#4f7fd8', .01), 0, .0125, mz));
  f.add(mg('tent-shell2', body, ({ add }) => {
    add(G.box(sl + .04, .035, L, .015), -hw / 2, Ht / 2, mz, 0, 0, slope);
    add(G.box(sl + .04, .035, L, .015), hw / 2, Ht / 2, mz, 0, 0, -slope);
    const tri = () => { const t = new THREE.Shape(); t.moveTo(-hw, 0); t.lineTo(hw, 0); t.lineTo(0, Ht); t.closePath(); return t; };
    add(new THREE.ExtrudeGeometry(tri(), { depth: .03, bevelEnabled: false }), 0, 0, zb - .015);
    const fr = tri(); fr.holes.push(arch(new THREE.Path(), dw, dh, .03));
    add(new THREE.ExtrudeGeometry(fr, { depth: .03, bevelEnabled: false, curveSegments: 14 }), 0, 0, zf - .03);
  }));
  f.add(put(rbox(.4, .012, .5, '#ffd9a0', .005), 0, .03, zf - .22));
  f.add(mg('tent-poles2', '#5b4a6a', ({ add, tube }) => {
    tube([0, Ht + .02, zb - .1], [0, Ht + .02, zf + .1], .024); tube([0, Ht, zf + .06], [0, Ht + .3, zf + .06], .014);
    for (const [x, z] of [[-hw - .08, zf + .08], [hw + .08, zf + .08], [-hw - .08, zb - .08], [hw + .08, zb - .08]]) add(G.cone(.025, .1, 6), x, .03, z, PI, 0, 0);
  }));
  const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.lineTo(.06, -.035); fs.lineTo(0, -.07); fs.closePath();
  f.add(put(extrudeRaw('pennant', fs, .01, '#ff4f5e'), 0, Ht + .3, zf + .06, 0, -HP, 0));
  f.add(face(0, .73, zf + .002, .8));
  const pv = new THREE.Group(); put(pv, 0, dh + dw, zf + .004);
  pv.add(put(extrudeRaw('tentdoor', arch(new THREE.Shape(), dw + .02, dh + .01), .022, flapC), 0, -(dh + dw) - .005, 0));
  pv.add(put(sph(.024, '#5b4a6a'), .14, -(dh + dw) + .2, .03));
  f.add(pv);
  const p = f.part('door', pv, (t, b) => { pv.scale.y = 1 - .82 * t; pv.position.z = b.p.z + .03 * t; }, { label: '텐트 문', sfx: 'swish', dur: .34 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: .02, y: -(dh + dw) + .3, z: .045, parent: pv };
  f.add(put(cap(.13, .46, '#5fc45a'), -.32, .09, mz - .02, HP, 0, 0, [1, 1, .55]));
  f.add(put(rbox(.24, .07, .14, '#ffffff', .03), -.32, .06, zb + .12));
  f.spot('inside', null, .04, .03, .31, { part: p, maxH: .45, label: '텐트 안', scale: .9 });
  f.spot('behind', null, .84, 0, -.18, { maxH: .45, label: '텐트 옆', scale: .85 });
};

// 아이스박스: lid hinged at the back, padlock-able
B.cooler = (f, T) => {
  const body = T.cooler || '#3f8cff', W = .66, H = .4, D = .44, z0 = -.04, fz = z0 + D / 2;
  f.add(mg('cooler-body', body, ({ add }) => hollowBox(add, W, H, D, .04, 0, 0, z0)));
  f.add(put(rbox(W - .08, .2, D - .08, '#d8f3ff', .03), 0, .12, z0));
  f.add(mg('cooler-cans', '#ff5a4e', ({ add }) => { add(G.cyl(.05, .05, .15, 14), -.18, .25, z0 - .08); add(G.cyl(.05, .05, .15, 14), -.06, .24, z0 - .1, .2, 0, .15); }));
  f.add(mg('cooler-trim', '#ffffff', ({ add }) => { for (const sx of [-1, 1]) add(G.box(.05, .06, .2, .02), sx * (W / 2 + .02), H - .1, z0); add(G.box(.12, .06, .03, .01), 0, H - .04, fz + .01); }));
  const lid = grp(put(rbox(W + .04, .09, D + .04, '#ffffff', .035), 0, .045, D / 2 + .02), put(rbox(W - .12, .02, D - .14, shade(body, .1), .01), 0, .095, D / 2 + .02));
  put(lid, 0, H, z0 - D / 2 - .02); f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.75 * t; }, { label: '아이스박스', sfx: 'open' });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: H - .13, z: fz + .045 };
  f.spot('inside', null, .1, .22, z0 + .04, { part: p, maxH: .3, label: '아이스박스 안', scale: .85 });
  f.spot('behind', null, 0, 0, -.4, { maxH: .4, label: '아이스박스 뒤', scale: .8 });
  f.spot('on', lid, 0, .105, D / 2 + .02, { maxH: .35, label: '아이스박스 위', scale: .8 });   // (레벨 세션 10/18: 숨은그림 판의 'on' 자리)
};

// 캠핑 의자 with a plaid blanket thrown over it
B.campchair = (f, T) => {
  const sy = .4, seat = T.accent2 || '#4fb8ff';
  f.add(mg('cchair-frame', '#4a4f6a', ({ add, tube }) => {
    for (const sx of [-1, 1]) { const x = sx * .26; tube([x, 0, .2], [x, sy + .02, -.2], .022); tube([x, 0, -.2], [x, sy + .02, .2], .022); tube([x, sy + .02, -.2], [x, .9, -.32], .02); tube([x, sy + .18, .22], [x, sy + .18, -.24], .022); }
    add(G.cyl(.045, .04, .08, 14), .31, sy + .2, .17);
  }));
  f.add(put(rbox(.52, .04, .42, seat, .015), 0, sy, 0, .05, 0, 0));
  f.add(put(rbox(.52, .46, .035, seat, .015), 0, sy + .27, -.26, -.22, 0, 0));
  const bl = grp(put(rbox(.46, .035, .38, '#ffffff', .01, { map: plaidTex() }), 0, .03, 0), put(rbox(.46, .24, .03, '#ffffff', .01, { map: plaidTex() }), 0, -.08, .2, .15, 0, 0));
  put(bl, 0, sy, .01); f.add(bl);
  // (③ #97 10/21, user "이불도 벤딩으로": the cloth bends and curls back from its free edge — gfx/clothbend.js)
  const p = f.part('lift', bl, clothBend(f, bl, { hinge: [0, .03, -.17], along: [0, 0, 1], toward: [0, 1, 0], len: .4, turn: 2.4, tip: .25, rise: .08 }), { label: '담요', sfx: 'lift', dur: .5 });
  f.spot('inside', null, 0, sy + .02, -.02, { part: p, maxH: .3, label: '담요 밑', scale: .85 });
  f.spot('under', null, 0, 0, -.02, { maxH: .3, label: '의자 밑', scale: .85 });
};

// 속 빈 통나무: leaf/moss plugs at both ends hide what's inside
B.log = (f, T) => {
  const bark = col(T, 'bark'), R = .3, r = .21, Lg = 1.56, cy = R, ex = Lg / 2;
  f.add(put(cyl(R, R, Lg, '#ffffff', { map: barkTex(bark) }, 24, true), 0, cy, 0, 0, 0, HP));
  f.add(put(cyl(r, r, Lg - .01, '#5a3a26', { side: THREE.BackSide }, 20, true), 0, cy, 0, 0, 0, HP));
  f.add(mg('log-rings', '#ffffff', ({ add }) => { add(new THREE.RingGeometry(r, R, 24), ex, cy, 0, 0, HP, 0); add(new THREE.RingGeometry(r, R, 24), -ex, cy, 0, 0, -HP, 0); }, { map: ringsTex() }));
  const plug = (sx, c1, c2, label) => {
    const pv = grp(
      mg('logplug|' + c1, c1, ({ add }) => { for (const [y, z, s] of [[-.08, 0, .14], [.02, -.1, .11], [.04, .1, .11], [.1, 0, .1]]) add(G.sph(s, 12, 9), 0, y, z, 0, 0, 0, [.7, 1, 1]); }),
      mg('logplug2|' + c2, c2, ({ add }) => { for (const [y, z] of [[-.06, -.12], [.1, .08], [-.12, .1]]) add(G.sph(.06, 10, 8), .04, y, z, 0, 0, 0, [.6, 1, 1.2]); }));
    put(pv, sx * (ex - .06), cy, 0); f.add(pv);
    const p = f.part('lift', pv, (t, b) => { pv.position.x = b.p.x + sx * .3 * t; pv.position.y = b.p.y - .16 * t; pv.rotation.z = -sx * .5 * t; pv.scale.setScalar(1 - .25 * t); }, { label, sfx: 'swish' });
    // the thing sits at the log's mouth (it shows only once the plug is lifted, so it reads as rolled out): deep inside the
    // tube it could not be seen from any angle — stage 59's key was lost there (level report 10/18 B2)
    f.spot('inside', null, sx * (ex + .06), .02, .05, { part: p, maxH: .3, label: '통나무 속', scale: .66 });
  };
  plug(1, '#ff9f43', '#ffd23f', '낙엽 뭉치'); plug(-1, '#6fc45a', '#a8e07a', '이끼 뭉치');
  f.add(mg('log-mush-s', '#fff3dc', ({ add }) => { add(G.cyl(.025, .03, .1, 8), -.3, 2 * R + .02, .08); add(G.cyl(.02, .025, .07, 8), -.16, 2 * R + .01, .12); }));
  f.add(mg('log-mush-c', '#ff6b5e', ({ add }) => { add(G.sph(.06, 12, 8), -.3, 2 * R + .07, .08, 0, 0, 0, [1, .6, 1]); add(G.sph(.045, 12, 8), -.16, 2 * R + .05, .12, 0, 0, 0, [1, .6, 1]); }));
  f.spot('on', null, .22, 2 * R - .01, 0, { maxH: .45, label: '통나무 위', scale: .85 });
};

// 바위: roll it aside
B.rock = (f, T) => {
  const rc = col(T, 'rock');
  // (⑥ 10/23 31~70판 훑기: the moss was one flat green lid on top — now a few soft clumps hugging the top, with sprouts)
  const rk = grp(put(mesh(rockGeo(3), mat(rc)), 0, 0, 0, 0, .4, 0, [.4, .36, .37]), mg('rock-moss2', '#7cc45a', ({ add }) => {
    for (const [x, y, z, r] of [[.03, .3, -.02, .09], [-.08, .28, .07, .065], [.12, .27, .06, .06], [-.05, .29, -.1, .055]]) add(G.sph(r, 10, 7), x, y, z, 0, 0, 0, [1.25, .55, 1.15]);
    for (const [x, z, a] of [[.05, .02, .3], [-.07, .08, -.4], [.11, .07, .1]]) add(G.cone(.012, .07, 4), x, .35, z, 0, 0, a);
  }));
  put(rk, -.08, .2, 0); f.add(rk);
  const p = f.part('lift', rk, (t, b) => { rk.position.x = b.p.x + .4 * t; rk.position.y = b.p.y + .07 * Math.sin(t * PI); rk.rotation.z = -1.4 * t; }, { label: '바위', sfx: 'lift', dur: .42 });
  f.spot('inside', null, -.08, 0, 0, { part: p, maxH: .3, label: '바위 밑', scale: .85 });
  f.add(put(mesh(rockGeo(7), mat(shade(rc, .04))), -.34, .09, .32, 0, 1, 0, [.17, .16, .15]));
  f.add(mg('rock-grass', '#7cc45a', ({ add }) => { for (const [x, z] of [[.34, -.32], [-.4, -.14], [.36, .38]]) for (let i = 0; i < 3; i++) add(G.cone(.03, .14, 5), x + (i - 1) * .04, .06, z, 0, 0, (i - 1) * .35); }));
  f.spot('behind', null, .18, 0, -.38, { maxH: .4, label: '바위 뒤', scale: .8 });
  f.spot('on', rk, .03, .37, -.02, { maxH: .35, label: '바위 위', scale: .75 });   // (레벨 세션 10/18: 숨은그림 판의 'on' 자리)
};

// 장작더미 under a tarp, a chopping stump with an axe
B.firewood = (f, T) => {
  const bark = col(T, 'bark'), r = .12, Lw = .66, cx = -.32, logs = [];
  [[4, .12], [3, .33], [2, .54]].forEach(([n, y]) => { for (let i = 0; i < n; i++) logs.push([cx + (i - (n - 1) / 2) * .245, y]); });
  f.add(mg('fw-logs', bark, ({ add }) => logs.forEach(([x, y], i) => add(G.cyl(r, r, Lw, 12), x, y, i % 2 ? .03 : -.03, HP, 0, 0))));
  f.add(mg('fw-ends', '#ffffff', ({ add }) => logs.forEach(([x, y], i) => { const dz = i % 2 ? .03 : -.03; add(new THREE.CircleGeometry(r * .95, 16), x, y, dz + Lw / 2 + .002); add(new THREE.CircleGeometry(r * .95, 16), x, y, dz - Lw / 2 - .002, 0, PI, 0); }), { map: ringsTex() }));
  // (⑥ 10/23 31~70판 훑기 "판자 같은 천": the tarp was three green boards — now one sheet of cloth that lies over the top logs
  // and droops down the front and the left in soft folds, with two tie-down cords to pegs)
  const tarp = grp(mesh(geo('fw-tarp2', () => {
    const g = new THREE.BoxGeometry(.92, .022, .84, 22, 1, 20), q = g.attributes.position;
    for (let i = 0; i < q.count; i++) {
      const x = q.getX(i), z = q.getZ(i) + .42, fz = Math.max(0, z - .62) / .22, fx = Math.max(0, -.3 - x) / .16;
      const droop = .26 * fz * fz + .2 * fx * fx;
      q.setXYZ(i, x - .05 * fx * fx, q.getY(i) - droop + .012 * Math.sin(x * 23 + z * 4) * (fz + fx), z + .05 * fz);
    }
    g.computeVertexNormals(); return g;
  }), mat('#4f9a5e')));
  tarp.add(put(rbox(.9, .02, .03, shade('#4f9a5e', -.18), .008), 0, -.27, .845));
  for (const x of [-.4, .4]) tarp.add(put(tor(.014, .005, '#d9dde4', null, PI * 2, 4, 10), x, -.2, .85));
  put(tarp, cx, .7, -.38); f.add(tarp);   // (a thin cloth: up 2 cm so the top logs don't poke through)
  f.add(mg('fw-ties', '#e8d9b8', ({ tube }) => { for (const x of [-.4, .4]) tube([cx + x, .48, .47], [cx + x * 1.15, .02, .62], .007, 5); }));
  f.add(mg('fw-pegs', '#c49a64', ({ add }) => { for (const x of [-.4, .4]) add(G.cone(.018, .1, 6), cx + x * 1.15, .03, .62, PI, 0, 0); }));
  const p = f.part('lid', tarp, t => { tarp.rotation.x = -1.7 * t; }, { label: '방수포', sfx: 'swish' });
  p.lockable = true; p.lockKind = 'lever'; f.lockAt = { x: .1, y: -.13, z: .86, parent: tarp };   // (just proud of the drooping front cloth)
  f.spot('inside', null, cx, .66, 0, { part: p, maxH: .35, label: '방수포 밑', scale: .85 });
  f.add(put(cyl(.22, .26, .3, '#ffffff', { map: barkTex(bark) }, 20), .6, .15, .12));
  f.add(put(disc(.22, '#ffffff', { map: ringsTex() }), .6, .301, .12, -HP));
  f.add(put(cyl(.022, .022, .44, '#e7b77a', null, 8), .7, .46, .05, 0, 0, -.55));
  f.add(put(rbox(.15, .1, .035, '#aab4c0', .012, { metal: .3 }), .6, .33, .05, 0, 0, -.55));
  f.spot('on', null, .52, .3, .2, { maxH: .45, label: '그루터기 위', scale: .8 });
  f.spot('behind', null, .3, 0, -.32, { maxH: .4, label: '장작 옆', scale: .8 });
};

// 랜턴 테이블: folding camp table, lantern on a hook pole, a 코펠 pot with a lid
B.lantern = (f, T) => {
  const ty = .6, tx = .05;
  f.add(put(rbox(.8, .04, .54, '#ffffff', .015, { map: slatTex() }), tx, ty, .04));
  f.add(mg('lt-legs', '#9aa3b5', ({ tube }) => { for (const sx of [-1, 1]) { const x = tx + sx * .33; tube([x, 0, -.18], [x, ty - .02, .24], .02); tube([x, 0, .26], [x, ty - .02, -.16], .02); } }));
  const lx = -.17, ly = 1.06, lz = -.36;
  f.add(mg('lt-pole', '#4a4f6a', ({ add, tube }) => { tube([-.4, 0, lz], [-.4, 1.46, lz], .022); tube([-.4, 1.42, lz], [lx, 1.42, lz], .018); tube([lx, 1.42, lz], [lx, 1.36, lz], .012); add(G.box(.2, .03, .2, .01), -.4, .015, lz); }));
  f.add(mg('lt-lantern', '#2f8f6a', ({ add }) => { add(G.cyl(.08, .09, .05, 16), lx, ly, lz); add(G.cone(.09, .09, 16), lx, ly + .25, lz); add(G.tor(.05, .01, PI), lx, ly + .29, lz); for (const a of [0, PI / 2, PI, PI * 1.5]) add(G.box(.012, .2, .012, .004), lx + Math.cos(a) * .072, ly + .12, lz + Math.sin(a) * .072); }));
  f.add(put(cyl(.064, .064, .18, '#fff3c4', { emissive: '#ffd36e', ei: .9 }, 16), lx, ly + .115, lz));
  const px = .24, pz = .05;
  f.add(put(lathe('koppel', [[0, 0], [.12, 0], [.13, .13], [.12, .13], [.11, .02], [0, .02]], '#d5dbe4', { metal: .3 }), px, ty + .02, pz));
  f.add(put(mg('koppel-h', '#4a4f6a', ({ add }) => { add(G.box(.12, .02, .03, .008), .18, .1, 0); }), px, ty + .02, pz));
  const lid = grp(put(cyl(.135, .135, .025, '#c4ccd8', { metal: .3 }, 20), 0, 0, 0), put(sph(.025, '#4a4f6a'), 0, .025, 0));
  put(lid, px, ty + .165, pz); f.add(lid);
  const p = f.part('lift', lid, (t, b) => { lid.position.y = b.p.y + .22 * t; lid.position.x = b.p.x + .1 * t; lid.rotation.z = -.55 * t; }, { label: '코펠 뚜껑', sfx: 'lift' });
  f.spot('inside', null, px, ty + .04, pz, { part: p, maxH: .25, label: '코펠 안', scale: .62 });
  f.spot('on', null, -.12, ty + .02, .12, { maxH: .45, label: '캠핑 테이블 위', scale: .85 });
  f.spot('under', null, tx, 0, .04, { maxH: .45, label: '테이블 밑', scale: .9 });
};

// 버섯 무리: the big toadstool tips over sideways
B.mushrooms = (f, T) => {
  const red = '#ff5a5a', cream = '#fff3dc', bx = -.14, bz = -.04;
  const big = new THREE.Group(); put(big, bx - .14, 0, bz);
  big.add(put(cyl(.085, .11, .4, cream, null, 16), .14, .2, 0));
  big.add(put(hemi(.32, red), .14, .36, 0, 0, 0, 0, [1, .62, 1]));
  big.add(put(disc(.31, '#f6dcc0'), .14, .362, 0, HP));
  big.add(mg('mush-dots', '#ffffff', ({ add }) => { for (const [th, ph, s] of [[.25, 0, .055], [.75, .4, .05], [.8, 2.2, .05], [.7, 3.6, .045], [.85, 5.1, .05], [.55, 1.3, .04], [.6, 4.4, .04]]) add(G.sph(s, 10, 8), .14 + Math.sin(th) * Math.cos(ph) * .32, .36 + Math.cos(th) * .32 * .62, Math.sin(th) * Math.sin(ph) * .32, 0, 0, 0, [1, .45, 1]); }));
  f.add(big);
  const p = f.part('lift', big, (t, b) => { big.rotation.z = 1.15 * t; big.position.y = b.p.y + .04 * t; }, { label: '큰 버섯', sfx: 'lift' });
  f.spot('inside', null, bx, 0, bz + .2, { part: p, maxH: .3, label: '버섯 밑', scale: .8 });
  f.add(put(cyl(.06, .075, .28, cream, null, 14), .28, .14, -.2));
  f.add(put(cyl(.2, .22, .07, '#c9844e', null, 22), .28, .31, -.2));
  f.spot('on', null, .28, .345, -.2, { maxH: .4, label: '납작 버섯 위', scale: .8 });
  f.add(mg('mush-small-s', cream, ({ add }) => { for (const [x, z, h] of [[.3, .3, .1], [.4, .18, .13], [.18, .38, .08]]) add(G.cyl(.02, .025, h, 8), x, h / 2, z); }));
  f.add(mg('mush-small-c', '#ff9f43', ({ add }) => { for (const [x, z, h, r] of [[.3, .3, .1, .06], [.4, .18, .13, .07], [.18, .38, .08, .05]]) add(G.sph(r, 12, 8), x, h, z, 0, 0, 0, [1, .6, 1]); }));
  f.spot('behind', null, 0, 0, -.4, { maxH: .3, label: '버섯 뒤', scale: .8 });
};

// 침엽수: lift the lowest boughs
B.pine = (f, T) => {
  const g1 = col(T, 'pine');
  f.add(put(cyl(.07, .1, .6, col(T, 'bark'), null, 12), 0, .3, 0));
  const tier = (key, r, h, color) => lathe('pine|' + key, [[0, h], [r * .3, h * .72], [r * .72, h * .3], [r, .02], [r * .82, -.03], [0, .04]], color, null, 20);
  const t1 = grp(tier('a2', .5, .5, g1)); put(t1, 0, .26, 0); f.add(t1);
  f.add(put(tier('b', .4, .58, shade(g1, .05)), 0, .7, 0));
  f.add(put(tier('c', .29, .54, shade(g1, .1)), 0, 1.12, 0));
  const p = f.part('lift', t1, (t, b) => { t1.position.y = b.p.y + .2 * t; t1.rotation.x = -.35 * t; }, { label: '아랫가지', sfx: 'swish' });
  f.spot('inside', null, 0, 0, .25, { part: p, maxH: .3, label: '나뭇가지 밑', scale: .8 });
  f.add(mg('pinecones', '#a0643c', ({ add }) => { for (const [x, z, a] of [[.34, .36, .3], [.42, .24, 1.2]]) add(G.sph(.05, 10, 8), x, .045, z, 0, a, HP, [1, 1.4, 1]); }));
  f.spot('under', null, -.22, 0, -.24, { maxH: .2, label: '나무 밑', scale: .7 });
};

// 피크닉 바구니: gingham blanket, a wicker basket whose lid takes a padlock, a thermos on the side
const ginghamTex = () => tex('gingham', 256, 256, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,92,120,.42)'; for (let i = 0; i < 8; i++) { c.fillRect(i * 16, 0, 8, h); c.fillRect(0, i * 16, w, 8); }
}, { repeat: [1, 1] });
const picnicWeaveTex = () => tex('basketweave', 256, 128, (c, w, h) => {
  c.fillStyle = '#d9a35f'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 8) for (let x = (y / 8 % 2) * 8; x < w; x += 16) { c.fillStyle = 'rgba(120,70,30,.28)'; roundRect(c, x + 1, y + 1, 12, 6, 3); c.fill(); }
}, { repeat: [1, 1] });
B.picnic = (f, T) => {
  f.add(put(rbox(.92, .02, .88, '#ffffff', .008, { map: ginghamTex() }), 0, .01, 0));
  const W = .5, H = .26, D = .34, z0 = -.1, y0 = .02;
  f.add(mg('pic-basket', '#ffffff', ({ add }) => hollowBox(add, W, H, D, .03, 0, y0, z0), { map: picnicWeaveTex() }));
  f.add(mg('pic-handles', '#b9803f', ({ add }) => { for (const sx of [-1, 1]) add(G.tor(.055, .014, PI), sx * (W / 2 + .005), y0 + H - .07, z0, 0, HP, 0); }));
  const lid = grp(put(rbox(W + .04, .045, D + .04, '#c98f4c', .018), 0, .022, D / 2 + .02), put(rbox(W - .08, .02, D - .06, '#e2b06c', .008), 0, .05, D / 2 + .02));
  put(lid, 0, y0 + H, z0 - D / 2 - .02); f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.7 * t; }, { label: '피크닉 바구니', sfx: 'open' });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: -.035, z: D + .055, parent: lid };
  f.spot('inside', null, 0, y0 + .03, z0, { part: p, maxH: .2, label: '피크닉 바구니 안', scale: .75 });
  f.add(mg('pic-thermos', '#4fb8ff', ({ add }) => { add(G.cyl(.055, .055, .22, 16), .3, .13, .25); }));
  f.add(put(cyl(.06, .06, .04, '#ffffff', null, 16), .3, .26, .25));
  f.spot('on', null, -.24, .02, .27, { maxH: .4, label: '돗자리 위', scale: .85 });
  f.spot('behind', null, 0, .02, -.36, { maxH: .35, label: '바구니 뒤', scale: .8 });
};

// 분실물 보관함: a little cabinet on a post with a smiling face, a keypad door and a yellow sign
const lostTex = () => tex('lostsign', 256, 96, (c, w, h) => {
  c.fillStyle = '#ffd23f'; roundRect(c, 3, 3, w - 6, h - 6, 10); c.fill();
  txt(c, '분실물', w / 2, h / 2 + 1, 26, '#3b2a33');
}, { text: true });
B.lostbox = (f, T) => {
  const W = .58, H = .5, D = .36, y0 = .52, z0 = -.08, body = T.lost || '#7fc8a9', fz = z0 + D / 2;
  f.add(mg('lb-post', '#8f7a6a', ({ add }) => { add(G.box(.1, y0, .1, .02), 0, y0 / 2, z0); add(G.box(.32, .04, .26, .015), 0, .02, z0); }));
  f.add(mg('lb-body', body, ({ add }) => { hollowBox(add, W, H, D, .035, 0, y0, z0, { front: false, top: true }); add(G.box(W - .07, .025, D - .07, .01), 0, y0 + H * .45, z0); }));
  f.add(put(rbox(W + .08, .05, D + .1, shade(body, -.12), .02), 0, y0 + H + .025, z0));
  f.add(put(plane(.34, .13, mat('#ffffff', { map: lostTex() })), 0, y0 + H + .14, fz - .02));
  f.add(mg('lb-signpost', '#8f7a6a', ({ add }) => { add(G.box(.025, .1, .02, .006), -.12, y0 + H + .07, fz - .03); add(G.box(.025, .1, .02, .006), .12, y0 + H + .07, fz - .03); }));
  const dv = new THREE.Group(); put(dv, -W / 2 + .02, y0 + H / 2, fz + .01);
  dv.add(put(rbox(W - .04, H - .04, .03, shade(body, .08), .015), W / 2 - .02, 0, 0));
  dv.add(face(W / 2 - .02, .08, .018, 1.1));
  dv.add(put(rbox(.03, .12, .03, '#ffffff', .01), W - .1, -.04, .03));
  f.add(dv);
  const p = f.part('door', dv, t => { dv.rotation.y = -1.7 * t; }, { label: '분실물 보관함', sfx: 'door', dur: .3 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: W - .2, y: -.15, z: .035, parent: dv };
  f.spot('inside', null, 0, y0 + .035, z0 + .02, { part: p, maxH: .19, label: '보관함 아래 칸', scale: .7 });
  f.spot('inside', null, 0, y0 + H * .45 + .013, z0 + .02, { part: p, maxH: .2, label: '보관함 위 칸', scale: .7 });
  f.spot('under', null, .18, 0, z0 + .15, { maxH: .4, label: '보관함 밑', scale: .85 });
  f.spot('on', null, .2, y0 + H + .05, z0 - .04, { maxH: .3, label: '보관함 위', scale: .7 });   // (레벨 세션 10/18: 숨은그림 판의 'on' 자리)
};

// 캠핑 트렁크: a strapped wooden trunk with brass corners; the domed lid locks
B.trunk = (f, T) => {
  const W = .74, H = .38, D = .46, z0 = -.04, wood = T.trunk || '#4f8f7a', fz = z0 + D / 2;
  f.add(mg('tr-body', wood, ({ add }) => hollowBox(add, W, H, D, .035, 0, 0, z0)));
  f.add(mg('tr-straps', '#8a5a3c', ({ add }) => { for (const x of [-.22, .22]) { add(G.box(.07, H + .01, .02, .008), x, H / 2, fz + .008); add(G.box(.07, H + .01, .02, .008), x, H / 2, z0 - D / 2 - .008); } }));
  f.add(mg('tr-brass', '#ffcf5c', ({ add }) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.07, .07, .07, .015), sx * (W / 2 - .02), .03, z0 + sz * (D / 2 - .02)); }));
  const lid = grp(
    put(rbox(W + .03, .08, D + .03, shade(wood, .06), .03), 0, .04, D / 2 + .015),
    put(mesh(geo('trunk-dome', () => new THREE.CylinderGeometry(D / 2 + .015, D / 2 + .015, W + .03, 20, 1, false, 0, PI)), mat(shade(wood, .06))), 0, .08, D / 2 + .015, 0, 0, HP, [.35, 1, 1]),
    put(rbox(.08, .2, D + .05, '#8a5a3c', .01), -.22, .1, D / 2 + .015), put(rbox(.08, .2, D + .05, '#8a5a3c', .01), .22, .1, D / 2 + .015));
  put(lid, 0, H, z0 - D / 2 - .015); f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.6 * t; }, { label: '캠핑 트렁크', sfx: 'open', dur: .32 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: 0, y: -.02, z: D + .045, parent: lid };
  f.spot('inside', null, 0, .04, z0, { part: p, maxH: .28, label: '트렁크 안', scale: .85 });
  f.spot('behind', null, 0, 0, -.42, { maxH: .4, label: '트렁크 뒤', scale: .8 });
  f.spot('on', lid, 0, .17, D / 2 + .015, { maxH: .35, label: '트렁크 위', scale: .8 });   // (레벨 세션 10/18: 숨은그림 판의 'on' 자리)
};

export const OUTDOOR_BUILDERS = B;

export const OUTDOOR_INFO = {
  // alley 골목길
  daeya: { w: 1, d: 1, name: '고무 대야', price: 70, region: 'alley' },
  pyeongsang: { w: 2, d: 1, name: '평상', price: 240, region: 'alley' },
  jangdok: { w: 2, d: 1, name: '장독대', price: 260, region: 'alley' },
  pole: { w: 1, d: 1, name: '전봇대', price: 120, region: 'alley' },
  mailbox: { wall: true, span: 1, name: '우편함', price: 150, region: 'alley' },
  gate: { wall: true, span: 2, name: '초록 대문', price: 300, region: 'alley' },
  shopfront: { w: 2, d: 1, name: '동네 슈퍼', price: 380, region: 'alley' },
  vending: { w: 1, d: 1, name: '자판기', price: 320, region: 'alley' },
  garden: { w: 2, d: 1, name: '스티로폼 텃밭', price: 140, region: 'alley' },
  aircon: { w: 1, d: 1, name: '에어컨 실외기', price: 160, region: 'alley' },
  bike: { w: 2, d: 1, name: '자전거', price: 200, region: 'alley' },
  trashbags: { w: 1, d: 1, name: '쓰레기 봉투', price: 60, region: 'alley' },
  clothesline: { w: 2, d: 1, name: '빨랫줄', price: 150, region: 'alley' },
  stairs: { w: 2, d: 1, name: '바깥 계단', price: 220, region: 'alley' },
  // park 공원·놀이터
  slide: { w: 2, d: 1, name: '미끄럼틀', price: 300, region: 'park' },
  swing: { w: 2, d: 1, name: '그네', price: 260, region: 'park' },
  sandbox: { w: 2, d: 1, name: '모래밭', price: 180, region: 'park' },
  bench: { w: 2, d: 1, name: '벤치', price: 140, region: 'park' },
  tree: { w: 1, d: 1, name: '나무', price: 160, region: 'park' },
  bush: { w: 1, d: 1, name: '덤불', price: 80, region: 'park' },
  parkbin: { w: 1, d: 1, name: '공원 쓰레기통', price: 90, region: 'park' },
  seesaw: { w: 2, d: 1, name: '시소', price: 200, region: 'park' },
  picnic: { w: 1, d: 1, name: '피크닉 바구니', price: 170, region: 'park' },
  lostbox: { w: 1, d: 1, name: '분실물 보관함', price: 230, region: 'park' },
  // camp 산·캠핑
  tent: { w: 2, d: 1, name: '텐트', price: 300, region: 'camp' },
  cooler: { w: 1, d: 1, name: '아이스박스', price: 180, region: 'camp' },
  campchair: { w: 1, d: 1, name: '캠핑 의자', price: 110, region: 'camp' },
  log: { w: 2, d: 1, name: '속 빈 통나무', price: 120, region: 'camp' },
  rock: { w: 1, d: 1, name: '바위', price: 90, region: 'camp' },
  firewood: { w: 2, d: 1, name: '장작더미', price: 150, region: 'camp' },
  lantern: { w: 1, d: 1, name: '랜턴 테이블', price: 160, region: 'camp' },
  mushrooms: { w: 1, d: 1, name: '버섯 무리', price: 100, region: 'camp' },
  pine: { w: 1, d: 1, name: '침엽수', price: 140, region: 'camp' },
  trunk: { w: 1, d: 1, name: '캠핑 트렁크', price: 240, region: 'camp' },
};

// Convenience twin of makeFurniture for outdoor props (the game merges the registries; the preview uses this).
export function makeOutdoor(type, theme = {}, opts = {}) {
  const info = OUTDOOR_INFO[type];
  const f = new Furn(type, info.w || 1, info.d || 1, !!info.wall);
  B[type](f, theme, opts);
  f.name = info.name;
  return f.finalize();
}

// ═════════════════════════════════════════════ GROUND ═════════════════════════════════════════════
// groundTex(kind, T): one seamless CanvasTexture that spans 5×5 tiles (texture.userData.span = 5).
// Use it like room.js floorTex: tex.repeat.set(w / 5, d / 5) on a w×d floor plane (wrap is already Repeat).
const GROUND = {
  asphalt(c, S, T) {
    const base = col(T, 'asphalt'), r = rng(5);
    c.fillStyle = base; c.fillRect(0, 0, S, S);
    for (let i = 0; i < 46; i++) { const x = r() * S, y = r() * S, rad = 18 + r() * 46, lt = r() < .5; wrap(S, x, y, rad, (X, Yy) => { c.fillStyle = lt ? 'rgba(255,255,255,.035)' : 'rgba(20,10,40,.045)'; blob(c, X, Yy, rad); }); }
    for (let i = 0; i < 3200; i++) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.16)' : 'rgba(30,20,50,.18)'; c.fillRect(r() * S, r() * S, 1.3, 1.3); }
    c.fillStyle = shade(base, -.045); roundRect(c, 60, 300, 120, 70, 8); c.fill(); roundRect(c, 330, 70, 60, 110, 8); c.fill();
    c.strokeStyle = 'rgba(30,20,50,.35)'; c.lineWidth = 1.6;
    for (const pts of [[[20, 120], [48, 132], [60, 160], [92, 168]], [[400, 420], [420, 400], [452, 398], [470, 372]], [[220, 40], [232, 70], [226, 92]]]) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
    c.save(); c.globalAlpha = .62; c.strokeStyle = '#ffffff'; c.lineWidth = 7; c.setLineDash([34, 26]); c.beginPath(); c.moveTo(-10, S * .5); c.lineTo(S + 10, S * .5); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#ffd23f'; c.lineWidth = 4; for (const y of [S * .06, S * .94]) { c.beginPath(); c.moveTo(0, y); c.lineTo(S, y); c.stroke(); }
    c.translate(S * .3, S * .76); c.scale(1, 1.45); txt(c, '천천히', 0, 0, 40, '#ffffff'); c.restore();
    const mx = S * .74, my = S * .27;
    c.fillStyle = '#5a5869'; blob(c, mx, my, 27); c.fillStyle = '#6d6b7e'; blob(c, mx, my, 22);
    c.strokeStyle = '#4b495a'; c.lineWidth = 2; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(mx + k * 8, my - 20); c.lineTo(mx + k * 8, my + 20); c.stroke(); c.beginPath(); c.moveTo(mx - 20, my + k * 8); c.lineTo(mx + 20, my + k * 8); c.stroke(); }
    c.strokeStyle = '#4b495a'; c.lineWidth = 3; c.beginPath(); c.arc(mx, my, 22, 0, PI * 2); c.stroke();
    c.fillStyle = '#4b495a'; roundRect(c, S * .82, S * .86, 60, 22, 4); c.fill(); c.fillStyle = '#2f2d3c'; for (let k = 0; k < 6; k++) c.fillRect(S * .82 + 6 + k * 9, S * .86 + 5, 4, 12);
  },
  brickpave(c, S, T) {
    const cols = T.pave ? [0, .05, -.05, .09, -.08, .02].map(k => shade(T.pave, k)) : ['#e39a72', '#eab08a', '#d7c4ae', '#cfa489', '#dc8b6b', '#e8c2a2'], r = rng(9);
    c.fillStyle = '#b4a596'; c.fillRect(0, 0, S, S);
    for (let j = 0; j < 32; j++) for (let x = -(j % 2) * 16; x < S; x += 32) { c.fillStyle = r.pick(cols); roundRect(c, x + 1.2, j * 16 + 1.2, 29.6, 13.6, 2.5); c.fill(); if (x < 0) { roundRect(c, x + S + 1.2, j * 16 + 1.2, 29.6, 13.6, 2.5); c.fill(); } }
    if (T.tactile === false) return;   // (기차역: the yellow strip is at the platform's edge, the train's own)
    const ty = Math.round(S * .62 / 16) * 16;
    for (let x = 0; x < S; x += 32) { c.fillStyle = '#b4a596'; c.fillRect(x, ty, 32, 32); c.fillStyle = '#ffd23f'; roundRect(c, x + 1.2, ty + 1.2, 29.6, 29.6, 3); c.fill(); c.fillStyle = '#e8b81f'; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) blob(c, x + 7 + a * 9, ty + 7 + b * 9, 2.4); }
  },
  grass(c, S, T) {
    const base = col(T, 'grass'), r = rng(12);
    c.fillStyle = base; c.fillRect(0, 0, S, S);
    for (let i = 0; i < 60; i++) { const x = r() * S, y = r() * S, rad = 16 + r() * 40, lt = r() < .5; wrap(S, x, y, rad, (X, Yy) => { c.fillStyle = lt ? shade(base, .035) : shade(base, -.035); blob(c, X, Yy, rad); }); }
    c.strokeStyle = shade(base, -.13); c.lineWidth = 1.6; c.lineCap = 'round';
    for (let i = 0; i < 700; i++) { const x = r() * S, y = r() * S; c.beginPath(); c.moveTo(x - 2.5, y - 4); c.lineTo(x, y); c.lineTo(x + 2.5, y - 4.5); c.stroke(); }
    for (let i = 0; i < 34; i++) { const x = r() * S, y = r() * S, cc = r.pick(['#ffffff', '#ffe14d', '#ffb3d1']); wrap(S, x, y, 10, (X, Yy) => { c.fillStyle = cc; for (let k = 0; k < 4; k++) blob(c, X + Math.cos(k * HP) * 2.4, Yy + Math.sin(k * HP) * 2.4, 2); c.fillStyle = '#ffb000'; blob(c, X, Yy, 1.4); }); }
  },
  sand(c, S, T) {
    const base = col(T, 'sand'), r = rng(14);
    c.fillStyle = base; c.fillRect(0, 0, S, S);
    for (let i = 0; i < 30; i++) { const x = r() * S, y = r() * S, rad = 20 + r() * 50, lt = r() < .5; wrap(S, x, y, rad, (X, Yy) => { c.fillStyle = lt ? shade(base, .03) : shade(base, -.03); blob(c, X, Yy, rad); }); }
    c.lineWidth = 2.2;
    for (let k = 0; k < 16; k++) { const y0 = k * S / 16; c.strokeStyle = k % 2 ? shade(base, .06) : shade(base, -.06); c.beginPath(); for (let x = 0; x <= S; x += 4) { const y = y0 + Math.sin(x / S * PI * 6 + k) * 5; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    for (let i = 0; i < 1500; i++) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(150,100,40,.25)'; c.fillRect(r() * S, r() * S, 1.4, 1.4); }
    for (let i = 0; i < 8; i++) { const x = r() * S, y = r() * S; c.fillStyle = r() < .5 ? '#ffd9e6' : '#fff6e0'; c.beginPath(); c.ellipse(x, y, 4, 3, r() * 3, 0, PI * 2); c.fill(); }
  },
  // a lake round an island (호수 섬, 10/20): clear blue, soft lighter patches, short ripple strokes, a few glints
  water(c, S, T) {
    const base = (T && T.water) || '#7fd0ea', r = rng(18);
    c.fillStyle = base; c.fillRect(0, 0, S, S);
    for (let i = 0; i < 40; i++) { const x = r() * S, y = r() * S, rad = 30 + r() * 70, lt = r() < .6; wrap(S, x, y, rad, (X, Yy) => { c.fillStyle = lt ? shade(base, .025) : shade(base, -.018); blob(c, X, Yy, rad); }); }
    c.lineCap = 'round';
    // little ripple rings (round, so they never line up into streaks when the ground is seen at an angle)
    for (let i = 0; i < 12; i++) { const x = r() * S, y = r() * S, w = 8 + r() * 14; c.strokeStyle = shade(base, .1); c.lineWidth = 2; wrap(S, x, y, w * 1.6, (X, Yy) => { for (const k of [1, 1.6]) { c.beginPath(); c.ellipse(X, Yy, w * k, w * k * .8, 0, 0, PI * 2); c.stroke(); } }); }
    for (let i = 0; i < 24; i++) { const x = r() * S, y = r() * S; c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(x, y, 5, 1.6, 0, 0, PI * 2); c.fill(); }
  },
  dirt(c, S, T) {
    const base = col(T, 'dirt'), r = rng(16);
    c.fillStyle = base; c.fillRect(0, 0, S, S);
    for (let i = 0; i < 50; i++) { const x = r() * S, y = r() * S, rad = 14 + r() * 44, lt = r() < .45; wrap(S, x, y, rad, (X, Yy) => { c.fillStyle = lt ? shade(base, .04) : shade(base, -.05); blob(c, X, Yy, rad); }); }
    for (let i = 0; i < 1800; i++) { c.fillStyle = r() < .5 ? 'rgba(255,240,220,.22)' : 'rgba(70,40,20,.2)'; c.fillRect(r() * S, r() * S, 1.5, 1.5); }
    for (let i = 0; i < 70; i++) { const x = r() * S, y = r() * S, w = 3 + r() * 5; wrap(S, x, y, 10, (X, Yy) => { c.fillStyle = r() < .5 ? '#b9b2c4' : '#a59eb2'; c.beginPath(); c.ellipse(X, Yy, w, w * .7, r() * 3, 0, PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.45)'; blob(c, X - w * .3, Yy - w * .25, w * .3); }); }
    c.strokeStyle = '#7cb85a'; c.lineWidth = 1.6; c.lineCap = 'round';
    for (let i = 0; i < 28; i++) { const x = r() * S, y = r() * S; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + k * 2, y); c.lineTo(x + k * 4.5, y - 7); c.stroke(); } }
    for (let i = 0; i < 26; i++) { const x = r() * S, y = r() * S; c.fillStyle = r.pick(['#ff9f43', '#ffd23f', '#e8704a']); c.beginPath(); c.ellipse(x, y, 4.5, 2.4, r() * 3, 0, PI * 2); c.fill(); }
  },
};
export function groundTex(kind, T = {}) {
  const draw = GROUND[kind] || GROUND.grass;
  const t = liveTex(1024, 1024, (c, w) => draw(c, w, T), { text: kind === 'asphalt' });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.userData.span = 5;
  return t;
}

// ═════════════════════════════════════════════ BOUNDARY ═════════════════════════════════════════════
// boundary(kind, len, T): one side of an outdoor diorama, same frame as room.js walls (origin at the inner face,
// x along the side, +z into the scene). Returns a Group with userData { kind, len, h, body, decor }:
//   body  = the solid part (tag its meshes userData.wall = k and squash body.scale.y for the cutaway, like room walls)
//   decor = attach wall pieces (mailbox, gate…) here at x = u, exactly like Room.addDecor does with wall.decor.
// Pieces overhang each end by their thickness so corners close like room walls.
const alleyWallTex = T => tex('alleywall|' + (T.plaster || '') + (T.brick || ''), 512, 410, (c, w, h) => {
  const pl = col(T, 'plaster'), brick = col(T, 'brick'), r = rng(21);
  c.fillStyle = pl; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 18; i++) { const x = r() * w, y = r() * h * .6, rad = 10 + r() * 30; wrap(w, x, y, rad, (X, Yy) => { c.fillStyle = r() < .5 ? shade(pl, -.025) : shade(pl, .02); c.beginPath(); c.ellipse(X, Yy, rad * 1.4, rad, 0, 0, PI * 2); c.fill(); }); }
  const by = h * .7;
  brickRows(c, 0, by, w, h - by, 32, 15.5, [brick, shade(brick, .05), shade(brick, -.05), shade(brick, .1)], '#efe2d0', 22);
  c.fillStyle = shade(pl, -.08); c.fillRect(0, by - 6, w, 6);
  c.strokeStyle = shade(pl, -.15); c.lineWidth = 1.4; c.beginPath(); c.moveTo(70, 40); c.lineTo(78, 62); c.lineTo(74, 80); c.moveTo(78, 62); c.lineTo(92, 70); c.stroke();
}, { repeat: [1, 1] });
// o: { capL, capR } overhang that end to close the corner (the N / S sides), { inL, inR } stop short of a corner another
// side closes (W / E). Two sides both filling a corner put identical faces in one place, which flickers.
export function boundary(kind, len, T = {}, o = {}) {
  const g = new THREE.Group(), body = new THREE.Group(), decor = new THREE.Group();
  g.add(body); g.add(decor);
  let h = 1;
  const L = +len.toFixed(3);
  const cl = o.capL ?? true, cr = o.capR ?? true, il = !!o.inL, ir = !!o.inR, ends = `${+cl}${+cr}${+il}${+ir}`;
  if (kind === 'alleywall') {
    const H = 1.6, t = .2, plaster = col(T, 'plaster');
    h = H;
    const x0 = -L / 2 - (cl ? t : 0), x1 = L / 2 + (cr ? t : 0);
    body.add(put(rbox(x1 - x0, H, t, shade(plaster, -.05), .04), (x0 + x1) / 2, H / 2, -t / 2));
    const wt = alleyWallTex(T).clone(); wt.needsUpdate = true; wt.wrapS = THREE.RepeatWrapping; wt.repeat.set(L / 2, 1);
    body.add(put(plane(L, H - .02, mat('#ffffff', { map: wt, rim: .1 })), 0, (H - .02) / 2, .003));
    body.add(mg(`wallcap|${L}|${ends}`, col(T, 'roofTile'), ({ add }) => {
      const c0 = x0 - (cl ? .04 : 0) + (il ? .12 : 0), c1 = x1 + (cr ? .04 : 0) - (ir ? .12 : 0), LL = c1 - c0, cx = (c0 + c1) / 2;
      add(G.box(LL, .06, t + .06, .02), cx, H + .03, -t / 2);
      add(G.box(LL, .04, .2, .015), cx, H + .1, -t / 2 + .09, .5, 0, 0);
      add(G.box(LL, .04, .2, .015), cx, H + .1, -t / 2 - .09, -.5, 0, 0);
      add(G.cyl(.05, .05, LL, 10), cx, H + .17, -t / 2, 0, 0, HP);
      for (let x = c0 + .07; x < c1 - .03; x += .14) add(G.cyl(.042, .042, .05, 10), x, H + .045, .065, HP, 0, 0);
    }));
  } else if (kind === 'fence') {
    const H = .72; h = H;
    body.add(mg(`fence|${L}|${ends}`, col(T, 'fence'), ({ add }) => {
      const f0 = -L / 2 - (il ? .02 : .05), f1 = L / 2 + (ir ? .02 : .05), LL = f1 - f0, n = Math.max(2, Math.round(LL / .17));
      for (let i = 0; i <= n; i++) { const x = f0 + i * LL / n; add(G.box(.11, H - .08, .035, .015), x, (H - .08) / 2, -.03); add(G.box(.078, .078, .035, .01), x, H - .08, -.03, 0, 0, PI / 4); }
      for (const y of [.2, .5]) add(G.box(LL, .07, .045, .015), (f0 + f1) / 2, y, -.075);
      const posts = Math.max(1, Math.round(L));
      for (let i = 0; i <= posts; i++) { if ((i === 0 && il) || (i === posts && ir)) continue; add(G.box(.1, H + .06, .1, .025), -L / 2 + i * L / posts, (H + .06) / 2, -.075); }
    }));
  } else if (kind === 'hedge') {
    h = .8;
    const r = rng(Math.round(L * 13) + 1);
    body.add(mg(`hedge|${L}|${ends}`, T.hedge || col(T, 'hedge'), ({ add }) => {
      const h0 = -L / 2 - (il ? .02 : .15), h1 = L / 2 + (ir ? .02 : .15);
      add(G.box(h1 - h0, .52, .46, .18), (h0 + h1) / 2, .28, -.25);
      for (let x = -L / 2 - .1; x <= L / 2 + .1; x += .3) add(G.sph(.2 + r() * .06, 14, 10), x + (r() - .5) * .06, .54 + r() * .05, -.25 + (r() - .5) * .1);
      for (let x = -L / 2; x <= L / 2; x += .45) add(G.sph(.17, 12, 9), x + .1, .3, -.06, 0, 0, 0, [1, 1, .6]);
    }));
    body.add(mg(`hedgefl|${L}`, T.flower || '#ff8fb8', ({ add }) => { for (let x = -L / 2 + .2; x < L / 2; x += .37 + r() * .2) add(G.sph(.04, 8, 6), x, .26 + r() * .4, -.01 - r() * .04); }));
    body.add(mg(`hedgefl2|${L}`, '#ffffff', ({ add }) => { for (let x = -L / 2 + .4; x < L / 2; x += .5 + r() * .3) add(G.sph(.035, 8, 6), x, .62 + r() * .1, -.08 - r() * .1); }));
  } else if (kind === 'cliff') {
    h = .45;
    const r = rng(Math.round(L * 7) + 3), rc = col(T, 'rock');
    body.add(mg(`cliff|${L}`, rc, ({ addM }) => {
      for (let x = -L / 2 - .1; x <= L / 2 + .1; x += .38) {
        const s = .2 + r() * .12;
        addM(rockGeo(1 + Math.floor(r() * 5)), new THREE.Matrix4().compose(new THREE.Vector3(x + (r() - .5) * .1, s * .55, -.18 + (r() - .5) * .08), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 6, 0)), new THREE.Vector3(s * 1.15, s, s)));
      }
    }));
    body.add(mg(`cliffface|${L}`, shade(rc, -.12), ({ addM }) => {
      for (let x = -L / 2 - .1; x <= L / 2 + .1; x += .32) {
        const s = .26 + r() * .1;
        addM(rockGeo(2 + Math.floor(r() * 5)), new THREE.Matrix4().compose(new THREE.Vector3(x, -.36 + (r() - .5) * .12, -.36), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 6, 0)), new THREE.Vector3(s, s * 1.2, s * .8)));
      }
    }));
    body.add(mg(`clifftuft|${L}`, '#7cc45a', ({ add }) => { for (let x = -L / 2; x <= L / 2; x += .5 + r() * .3) for (let i = 0; i < 3; i++) add(G.cone(.03, .14, 5), x + (i - 1) * .04, .06, -.02, 0, 0, (i - 1) * .35); }));
  }
  body.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { kind, len, h, body, decor };
  return g;
}

// 보물 파기 (the park's "use the tool you found" puzzle): a smoothed patch of sand with a big red X on it. Dig it with
// the 모래삽 and the X is scooped away, a hole opens with the sand heaped beside it and what was buried rises out.
// Added at play time on the stages that use it (planStage), so it is never part of a saved room's part/spot order.
export const DIG_AT = { sandbox: [0, .13, -.19], sandbox2: [.42, .15, .02] };
export function digPatch(f, T = {}) {
  const at = DIG_AT[f.type]; if (!at) return null;
  const sand = col(T, 'sand'), RED = '#ef5a3c';
  const g = grp(); put(g, ...at); f.add(g);
  g.add(put(cyl(.16, .18, .026, shade(sand, -.04), null, 20), 0, .01, 0));
  const X = grp(put(rbox(.26, .014, .055, RED, .007), 0, .03, 0), put(rbox(.26, .014, .055, RED, .007), 0, .03, 0, 0, HP, 0));   // square to the box: reads as an X from the corner view
  const hole = put(cyl(.12, .09, .016, '#9c7342', null, 20), 0, .027, 0);
  const heap = put(hemi(.11, shade(sand, -.09)), .2, .01, -.05, 0, 0, 0, [1.1, .8, 1]);
  const pit = grp(); put(pit, 0, -.1, 0);
  g.add(X, hole, heap, pit);
  const p = f.part('lift', [X, hole, heap, pit], (t, bX, bH, bP, bPit) => {
    const k = Math.min(1, t * 2.2);
    X.scale.setScalar(Math.max(.001, 1 - k)); X.position.y = bX.p.y + .06 * k;
    hole.scale.set(Math.max(.001, t), 1, Math.max(.001, t));
    heap.scale.set(1.1 * Math.max(.001, t), .8 * Math.max(.001, t), Math.max(.001, t));
    pit.position.y = bPit.p.y + .13 * t; pit.scale.setScalar(Math.max(.001, t));
  }, { label: '모래 속 X', sfx: 'swish', dur: .55 });
  f.spot('inside', pit, 0, 0, 0, { part: p, maxH: .3, label: '모래 속', scale: .8 });
  p.dig = true; p.digMark = X;
  p.setOpen(0);
  g.traverse(o => { if (o.isMesh) { o.userData.furn = f; o.userData.part = p; } });
  return p;
}

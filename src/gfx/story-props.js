// Story props for 「심통난 냥냥이」 (냥냥이네 부엌): cat furniture, a lived-in kitchen, and the story items.
// Same contract as furniture.js / outdoor.js:
//   builder(f, T) fills a Furn. Origin = footprint centre on the floor, the piece faces +z, back toward -z, 1 tile = 1.
//   Wall pieces (wall: true) hang on a wall's inner face: origin at the face, floor height, +z into the room.
//   parts open / lift / slide; spots: inside (needs its part open) | under/behind (visible but tucked) | on (plain sight).
//   Lockable parts carry p.lockable = true and p.lockKind ('pad' | 'code'), with f.lockAt where the lock hardware goes.
//   Places a character can sit (the story's sulking cat) are marked p.sitAt / f.sitAt = { x, y, z } (furniture-local).
// Toy-set rules: chunky silhouettes, flat matte colours, few draw calls. Static decor is merged into ONE mesh per piece
// with vertex colours (mc), so a dense, many-coloured prop still costs 1–3 draw calls; textured bits (labels, gingham,
// sisal) are merged per texture (mg). Every moving part is its own mesh, so it outlines on its own.
//   import { STORY_BUILDERS, STORY_INFO, STORY_ITEMS } from './gfx/story-props.js';
//   registerFurniture(STORY_BUILDERS, STORY_INFO); Object.assign(ITEMS, STORY_ITEMS);
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mat, mesh, geo, canvasTex, texCache, roundRect, shade, heartShape, STYLE } from './kit.js';
import { gptLock } from './gpt-locks.js';
import { tr } from '../i18n.js';

const PI = Math.PI, HP = PI / 2, DS = THREE.DoubleSide;

// ── palette ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Theme keys first (so the pieces follow whichever room they are bought into); these are the cat-kitchen defaults.
const K = { wood: '#f1d1a6', woodD: '#cfa46f', body: '#fffaf2', accent: '#7fd6c0', accent2: '#ffb7a6', accent3: '#ffe27a', fabric: '#ffd0a6', fabric2: '#ffe3c7', knob: '#ffd84a', top: '#fff7ea' };
const col = (T, k) => (T && T[k]) || K[k];
const INK = '#2a1d33', WHITE = '#ffffff', SKY = '#8fd3f4', SKY2 = '#cdeefc', HONEY = '#ffcf5c', CORAL = '#ff9f8a', MINT = '#7fd6c0',
  BLUSH = '#ff9fb5', GOLD = '#ffc93c', LEAF = '#6cc46a', ORANGE = '#ffab4c', STEEL = '#c9cfe0';

// ── geometry helpers ────────────────────────────────────────────────────────────────────────────────────────────
const G = {
  box: (w, h, d, r = .02, seg = 1) => { r = Math.min(r, Math.min(w, h, d) * .45); return r > .004 ? new RoundedBoxGeometry(w, h, d, seg, r) : new THREE.BoxGeometry(w, h, d); },
  pbox: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  sph: (r, ws = 10, hs = 8) => new THREE.SphereGeometry(r, ws, hs),
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

// Vertex-coloured material (toon in the cartoon style, matching kit.mat()).
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
// One mesh from many pieces sharing one material (labels, gingham, sisal). fn gets { add, addM }; keeps uvs.
// post(g) may rewrite the merged geometry (e.g. world-space uvs) before it is cached.
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
// Box-mapped uvs in world units (so a gingham check is the same size on every face of a merged cloth).
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
// Remap a geometry's 0..1 uvs into an atlas cell [u0, v0, u1, v1].
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
function fishIcon(c, x, y, s, color, eye = '#ffffff') {
  c.fillStyle = color; c.beginPath(); c.ellipse(x - s * .15, y, s * .55, s * .36, 0, 0, PI * 2); c.fill();
  c.beginPath(); c.moveTo(x + s * .3, y); c.lineTo(x + s * .75, y - s * .32); c.lineTo(x + s * .75, y + s * .32); c.closePath(); c.fill();
  c.fillStyle = eye; blob(c, x - s * .42, y - s * .06, s * .09);
}
function pawIcon(c, x, y, s, color, a = 0) {
  c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = color;
  c.beginPath(); c.ellipse(0, s * .18, s * .34, s * .27, 0, 0, PI * 2); c.fill();
  for (const [dx, dy, r] of [[-.38, -.12, .14], [-.14, -.36, .15], [.14, -.36, .15], [.38, -.12, .14]]) { c.beginPath(); c.ellipse(dx * s, dy * s, r * s, r * s * 1.2, dx * .6, 0, PI * 2); c.fill(); }
  c.restore();
}
// Label atlas (512×512, cells of 256×64 in two columns): jar / can / bag labels for the kitchen pieces.
const LABELS = ['설탕', '소금', '꿀', '참치', '먹이', '사료', '쌀', '냥캔'];
const LABEL_COLS = [['#ffffff', '#ff8a7a'], ['#ffffff', '#5aa8e8'], ['#ffe9a8', '#c9862a'], ['#5aa8e8', '#ffffff'], ['#ffe14d', '#3b6fd8'], ['#ff8f6b', '#ffffff'], ['#f4efe2', '#6b8f3a'], ['#7fd6c0', '#ffffff']];
const labelTex = () => tex('story-labels', 512, 512, (c) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, 256, 256);
  LABELS.forEach((s, i) => {
    const x = (i % 2) * 128, y = Math.floor(i / 2) * 32, [bg, fg] = LABEL_COLS[i];
    c.fillStyle = bg; c.fillRect(x, y, 128, 32);
    if (s === '참치' || s === '먹이' || s === '사료' || s === '냥캔') { fishIcon(c, x + 26, y + 16, 22, fg, bg); txt(c, s, x + 80, y + 17, 18, fg); }
    else { c.fillStyle = fg; c.fillRect(x, y + 2, 128, 3); c.fillRect(x, y + 27, 128, 3); txt(c, s, x + 64, y + 17, 19, fg); }
  });
}, { text: true });
const cell = i => { const x = (i % 2) * 256, y = Math.floor(i / 2) * 64; return [x / 512, 1 - (y + 64) / 512, (x + 256) / 512, 1 - y / 512]; };
// A label band wrapped round the front of a cylinder (radius r, height h, arc a), mapped to atlas cell i.
const bandGeo = (r, h, i, a = 2.2) => cellUV(new THREE.CylinderGeometry(r, r, h, 8, 1, true, -a / 2, a), cell(i));
const quadGeo = (w, h, i) => cellUV(new THREE.PlaneGeometry(w, h), cell(i));

const ginghamTex = c1 => tex('story-gingham|' + c1, 128, 128, (c, w, h) => {
  c.fillStyle = '#fffaf2'; c.fillRect(0, 0, w, h);
  c.fillStyle = shade(c1, .12); c.fillRect(0, 0, w / 2, h); c.fillRect(0, 0, w, h / 2);
  c.fillStyle = c1; c.fillRect(0, 0, w / 2, h / 2);
}, { repeat: [1, 1] });
const sisalTex = () => tex('story-sisal', 32, 64, (c, w, h) => {
  c.fillStyle = '#f2d39e'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#dcae6c'; c.fillRect(0, 0, w, 5); c.fillRect(0, 16, w, 3);
}, { repeat: [1, 1] });
const wickerTex = () => tex('story-wicker', 64, 64, (c, w, h) => {
  c.fillStyle = '#d69c52'; c.fillRect(0, 0, w, h);
  for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) {
    const x0 = bx * 16, y0 = by * 16, horiz = (bx + by) % 2 === 0;
    c.fillStyle = (bx + by) % 2 ? '#ecb86e' : '#f2c47e';
    for (let k = 0; k < 3; k++) { if (horiz) roundRect(c, x0 + .8, y0 + .8 + k * 5.2, 14.4, 4.2, 2); else roundRect(c, x0 + .8 + k * 5.2, y0 + .8, 4.2, 14.4, 2); c.fill(); }
  }
}, { repeat: [1, 1] });
const pawMatTex = base => tex('story-pawmat|' + base, 256, 256, (c, w, h) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  const pc = shade(base, -.1);
  [[34, 92, -.5], [56, 62, -.5], [84, 92, -.5], [106, 62, -.5]].forEach(([x, y, a]) => pawIcon(c, x, y, 12, pc, a));
  c.strokeStyle = shade(base, -.04); c.lineWidth = 3; c.setLineDash([6, 5]); c.strokeRect(8, 8, w - 16, h - 16);
});

// ═════════════════════════════════════════════ CAT FURNITURE ═════════════════════════════════════════════
const B = {};

// 캣타워: paw-print carpet base, striped sisal posts, a cat-face 숨숨집 (cubby) whose door has a round entrance hole,
// a side shelf with a dangling pom-pom, and a donut bed on top. The memento reward, so it gets the most love.
B.cattower = (f, T) => {
  const wood = col(T, 'wood'), cush = col(T, 'accent'), cub = col(T, 'accent2'), pom = col(T, 'accent3');
  const tk = [wood, cush, cub, pom].join(',');
  const carpet = '#fff1dc', cubIn = shade(cub, -.09);
  const bx = .14, bz = -.05, BW = .54, BH = .42, BD = .48, by = .34, t = .04, fz = bz + BD / 2;
  const Mx = -.3, Mz = -.3, Ux = .25, Uz = -.22;
  const L2 = { x: -.25, y: .99, z: -.1 }, L3 = { x: -.02, y: 1.43, z: -.2 }, mTop = L3.y - .05;
  const hx = L2.x - .16, hz = L2.z + .17;
  f.add(mg('cattower-base', mat('#ffffff', { map: pawMatTex(carpet) }), ({ add }) => add(G.box(.9, .06, .9, .03), 0, .03, 0)));
  f.add(mg('cattower-posts', mat('#ffffff', { map: sisalTex() }), ({ add }) => {
    add(G.cyl(.07, .07, mTop - .06, 14), Mx, (mTop + .06) / 2, Mz);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.042, .042, by - .06, 10), bx + sx * .21, (by + .06) / 2, bz + sz * .18);
    add(G.cyl(.058, .058, mTop - (by + BH), 12), Ux, (mTop + by + BH) / 2, Uz);
  }, g => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setY(i, p.getY(i) / .07); }));
  f.add(mc('cattower|' + tk, ({ add }) => {
    add(G.cyl(.095, .105, .035, 14), wood, Mx, .075, Mz); add(G.cyl(.08, .09, .03, 12), wood, Ux, by + BH + .015, Uz);
    // 숨숨집 shell (open front, the door closes it) and a darker inside
    add(G.box(BW, t, BD, .015), cub, bx, by + t / 2, bz);
    add(G.box(BW, t, BD, .015), cub, bx, by + BH - t / 2, bz);
    add(G.box(t, BH, BD, .015), cub, bx - BW / 2 + t / 2, by + BH / 2, bz);
    add(G.box(t, BH, BD, .015), cub, bx + BW / 2 - t / 2, by + BH / 2, bz);
    add(G.box(BW, BH, t, .015), cub, bx, by + BH / 2, bz - BD / 2 + t / 2);
    add(G.pbox(BW - 2 * t, BH - 2 * t, .01), cubIn, bx, by + BH / 2, bz - BD / 2 + t + .006);
    add(G.pbox(BW - 2 * t, .01, BD - t - .01), cubIn, bx, by + BH - t - .006, bz - .005);
    add(G.pbox(.01, BH - 2 * t, BD - t - .01), cubIn, bx - BW / 2 + t + .006, by + BH / 2, bz - .005);
    add(G.pbox(.01, BH - 2 * t, BD - t - .01), cubIn, bx + BW / 2 - t - .006, by + BH / 2, bz - .005);
    add(G.box(BW - .1, .024, BD - .1, .01), shade(cush, .12), bx, by + t + .012, bz);
    // ears on the 숨숨집 roof
    for (const sx of [-1, 1]) {
      add(G.ext(earShape(.19, .16), .04, .008, 4), cub, bx + sx * .165, by + BH - .01, fz - .07, 0, 0, -sx * .12);
      add(G.ext(earShape(.1, .085, .015), .01, 0, 4), BLUSH, bx + sx * .165, by + BH + .012, fz - .02, 0, 0, -sx * .12);
    }
    // side shelf (L2) and the donut bed on top (L3)
    add(G.box(.46, .05, .44, .02), wood, L2.x, L2.y - .025, L2.z);
    add(G.box(.42, .05, .4, .025), cush, L2.x, L2.y + .02, L2.z);
    add(G.cyl(.31, .31, .05, 20), wood, L3.x, L3.y - .025, L3.z);
    add(G.tor(.235, .072, PI * 2, 6, 20), cush, L3.x, L3.y + .055, L3.z, HP, 0, 0, [1, 1, .85]);
    add(G.cyl(.2, .2, .05, 18), carpet, L3.x, L3.y + .025, L3.z);
    // pom-pom toy on a string, with a little bell
    add(G.cyl(.007, .007, .3, 4), WHITE, hx, L2.y - .05 - .15, hz);
    add(G.sph(.026, 8, 6), GOLD, hx, L2.y - .05 - .31, hz);
    add(G.sph(.065, 10, 8), pom, hx, L2.y - .05 - .39, hz);
    for (let i = 0; i < 3; i++) add(G.cone(.02, .075, 5), pom, hx + Math.cos(i * 2.1) * .032, L2.y - .05 - .46, hz + Math.sin(i * 2.1) * .032, PI, 0, (i - 1) * .3);
  }));
  // the door: rounded panel with the round entrance hole, a sleepy cat face around it
  const dv = new THREE.Group(); put(dv, bx - BW / 2, by + BH / 2, fz + .002);
  dv.add(mc('cattower-door|' + tk, ({ add }) => {
    const s = rrShape(0, -BH / 2 + .004, BW, BH - .008, .05);
    s.holes.push(new THREE.Path().absarc(BW / 2, -.055, .115, 0, PI * 2, true));
    add(G.ext(s, .028, 0, 6), shade(cub, .05), 0, 0, 0);
    add(G.tor(.115, .013, PI * 2, 4, 20), shade(cub, -.1), BW / 2, -.055, .03);
    for (const sx of [-1, 1]) {
      add(G.sph(.027, 8, 6), INK, BW / 2 + sx * .12, .11, .03, 0, 0, 0, [1, 1.2, .45]);
      add(G.sph(.009, 5, 4), WHITE, BW / 2 + sx * .12 - .008, .122, .04);
      add(G.sph(.034, 8, 6), BLUSH, BW / 2 + sx * .19, .045, .028, 0, 0, 0, [1, .65, .3]);
      for (const k of [-1, 1]) add(G.pbox(.075, .009, .008), INK, BW / 2 + sx * .2, -.005 + k * .026, .032, 0, 0, sx * k * .16);
    }
    add(G.sph(.017, 6, 5), '#ff7f9e', BW / 2, .07, .03, 0, 0, 0, [1.3, .8, .4]);
  }));
  f.add(dv);
  const p = f.part('door', dv, tt => { dv.rotation.y = -2.7 * tt; }, { label: '숨숨집', sfx: 'open', dur: .32 });   // swings well clear of the opening
  f.spot('inside', null, bx, by + t + .024, bz + .05, { part: p, maxH: .3, label: '숨숨집 안', scale: .8 });
  f.spot('under', null, bx, .06, bz + .04, { maxH: .25, label: '숨숨집 밑', scale: .74 });
  f.spot('on', null, L2.x + .02, L2.y + .045, L2.z + .03, { maxH: .33, label: '캣타워 선반', scale: .78 });
  f.spot('on', null, L3.x, L3.y + .05, L3.z + .02, { maxH: .45, label: '캣타워 꼭대기', scale: .85 });
  f.sitAt = { x: L3.x, y: L3.y + .05, z: L3.z };
};

// 고양이 방석: a round cat-ear bed; the paw-print cushion lifts. A toy mouse waits nearby.
B.catbed = (f, T) => {
  const rim = col(T, 'fabric'), base = shade(rim, -.07), cushC = col(T, 'fabric2'), paw = shade(rim, -.04);
  const tk = [rim, cushC].join(',');
  f.add(mc('catbed|' + tk, ({ add, tube }) => {
    add(G.cyl(.36, .37, .07, 26), base, 0, .035, 0);
    add(G.tor(.29, .1, PI * 2, 8, 26), rim, 0, .125, 0, HP, 0, 0, [1, 1, .85]);
    for (const sx of [-1, 1]) {
      const a = sx * .72, ex = Math.sin(a) * .28, ez = -Math.cos(a) * .28, ry = -a * .4;
      add(G.ext(earShape(.21, .19, .04), .05, .01, 4), rim, ex, .16, ez - .025, 0, ry, -sx * .12);
      add(G.ext(earShape(.11, .1, .02), .012, 0, 4), BLUSH, ex + Math.sin(ry) * .066, .185, ez - .025 + Math.cos(ry) * .066, 0, ry, -sx * .12);
    }
    // toy mouse
    const mx = .35, mz = .34;
    add(G.sph(.065, 10, 8), '#bdb6cf', mx, .05, mz, 0, .6, 0, [1.35, .8, 1]);
    for (const sx of [-1, 1]) add(G.cyl(.026, .026, .01, 10), BLUSH, mx - .04 + sx * .015, .1, mz - .03 + sx * .03, HP, .6 + sx * .5, 0);
    add(G.sph(.012, 5, 4), INK, mx - .07, .07, mz + .055);
    add(G.sph(.014, 5, 4), '#ff7f9e', mx - .085, .05, mz + .07);
    tube([mx + .07, .03, mz - .05], [mx + .02, .012, mz - .16], .009, BLUSH, 4);
  }));
  const cu = grp(mc('catbed-cush|' + tk, ({ add }) => {
    add(G.sph(.255, 20, 10), cushC, 0, 0, 0, 0, 0, 0, [1, .32, 1]);
    add(G.sph(.065, 10, 6), paw, 0, .07, .04, 0, 0, 0, [1, .25, .85]);
    for (const [x, z] of [[-.07, -.04], [-.025, -.075], [.025, -.075], [.07, -.04]]) add(G.sph(.026, 8, 5), paw, x, .07, z, 0, 0, 0, [1, .3, 1.15]);
  }));
  put(cu, 0, .13, 0); f.add(cu);
  const p = f.part('lift', cu, (t, b) => { cu.position.y = b.p.y + .32 * t; cu.position.z = b.p.z - .1 * t; cu.rotation.x = -.5 * t; }, { label: '고양이 방석', sfx: 'lift' });
  p.sitAt = { x: 0, y: .21, z: 0 };
  f.spot('inside', null, 0, .07, .03, { part: p, maxH: .3, label: '방석 밑', scale: .85 });
  f.spot('behind', null, -.34, 0, -.36, { maxH: .35, label: '방석 뒤', scale: .72 });
};

// 털실 바구니: round wicker basket full of yarn; the cloth-topped lid hinges at the back and takes a padlock.
// The lid is flat on purpose: a sulking cat can sit on it (p.sitAt). A ball has rolled out, needles and all.
B.yarnbasket = (f, T) => {
  const wick = '#ecb86e', band = '#cf9448', cloth = col(T, 'accent'), R = .3, H = .33;
  const tk = [cloth].join(',');
  const ball = (add, x, y, z, r, c, ra = .5) => { add(G.sph(r, 10, 7), c, x, y, z); add(G.tor(r * 1.01, .009, PI * 2, 3, 14), shade(c, .14), x, y, z, ra, .3, 0); };
  f.add(mg('yarnbasket-shell', mat('#ffffff', { map: wickerTex() }), ({ add }) => add(G.lathe([[0, 0], [.235, 0], [.255, .02], [.29, .3], [.302, H], [.282, H], [.268, .3], [.232, .055], [0, .055]], 20)),
    g => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, uv.getX(i) * 20, p.getY(i) / .085); }));
  f.add(mc('yarnbasket|' + tk, ({ add, tube }) => {
    add(G.tor(.3, .026, PI * 2, 5, 24), band, 0, H - .004, 0, HP);
    add(G.tor(.258, .016, PI * 2, 4, 24), band, 0, .03, 0, HP);
    for (const sx of [-1, 1]) add(G.tor(.055, .016, PI, 4, 8), band, sx * .305, .24, 0, 0, HP, 0);
    // yarn inside: a soft heap with balls at the back (the hiding spot sits on the heap)
    add(G.sph(.22, 12, 6), shade(SKY, .1), 0, .085, 0, 0, 0, 0, [1, .3, 1]);
    ball(add, -.13, .15, -.1, .1, SKY); ball(add, .13, .15, -.1, .1, CORAL, -.6); ball(add, 0, .14, -.17, .085, HONEY);
    // a ball that rolled out, with needles stuck in it and a trailing strand; another ball behind
    const bx = .34, bz = .32;
    ball(add, bx, .09, bz, .09, CORAL, .4);
    for (const [a, c] of [[.5, HONEY], [-.3, SKY]]) { const e = [bx - .02 + Math.sin(a) * .22, .26, bz - .08 + Math.cos(a) * .05]; tube([bx - .02, .11, bz + .02], e, .009, '#d9dee8', 5); add(G.sph(.021, 6, 4), c, ...e); }
    const curve = new THREE.CatmullRomCurve3([[bx - .07, .02, bz + .04], [bx - .2, .012, bz + .12], [bx - .36, .012, bz + .06], [bx - .5, .012, bz + .13]].map(p => new THREE.Vector3(...p)));
    add(new THREE.TubeGeometry(curve, 12, .014, 4), CORAL);
    ball(add, -.36, .08, -.32, .08, MINT);
  }));
  const lid = grp(mc('yarnbasket-lid|' + tk, ({ add }) => {
    add(G.cyl(R + .022, R + .022, .04, 24), wick, 0, .02, R + .015);
    add(G.cyl(R - .025, R - .005, .035, 24), cloth, 0, .055, R + .015);
    add(G.tor(R - .015, .012, PI * 2, 3, 24), WHITE, 0, .055, R + .015, HP);
    add(G.pbox(.05, .075, .018), STEEL, 0, -.01, 2 * R + .045);
    for (const sx of [-1, 1]) add(G.sph(.03, 6, 5), HONEY, sx * .05, .08, 2 * R - .04, 0, 0, -sx * .5, [1.4, .55, .8]);
    add(G.sph(.018, 6, 4), shade(HONEY, -.06), 0, .08, 2 * R - .04);
  }));
  put(lid, 0, H, -R - .015); f.add(lid);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.7 * t; }, { label: '털실 바구니', sfx: 'open' });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: H - .1, z: R + .055 };
  p.sitAt = { x: 0, y: H + .075, z: 0 };
  f.spot('inside', null, 0, .15, .08, { part: p, maxH: .28, label: '털실 바구니 안', scale: .78 });
  f.spot('behind', null, .3, 0, -.36, { maxH: .35, label: '바구니 뒤', scale: .72 });
};

// 어항 선반: a sky-blue cabinet with a round fish bowl (two goldfish), a can of fish food, door below
B.fishtank = (f, T) => {
  const body = '#8fcfee', top = col(T, 'top'), door = '#aee0f8', inner = shade(body, -.16), W = .72, H = .62, D = .5, z0 = -.13, y0 = .07, fz = z0 + D / 2;
  const bwx = -.12, bwz = z0 + .02, R = .22, cy = y0 + H + .05 + R * Math.cos(.45), bot = cy - R * Math.cos(.45);
  const tk = [top].join(',');
  f.add(mc('fishtank|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.pbox(.06, y0, .06), '#6fb2d6', sx * (W / 2 - .06), y0 / 2, z0 + sz * (D / 2 - .06));
    add(G.box(W, .04, D, .015), body, 0, y0 + .02, z0);
    add(G.box(W, H, .04, .015), body, 0, y0 + H / 2, z0 - D / 2 + .02);
    add(G.box(.04, H, D, .015), body, -W / 2 + .02, y0 + H / 2, z0);
    add(G.box(.04, H, D, .015), body, W / 2 - .02, y0 + H / 2, z0);
    add(G.pbox(W - .08, H - .04, .01), inner, 0, y0 + H / 2, z0 - D / 2 + .045);
    add(G.pbox(W - .08, .01, D - .05), inner, 0, y0 + .045, z0 + .01);
    add(G.box(W + .06, .05, D + .06, .02), top, 0, y0 + H + .025, z0);
    add(G.pbox(.14, .2, .1), HONEY, .2, y0 + .15, z0 - .14);
    // bowl: opaque lip + foot ring (the glass itself is transparent), gravel, weed, two goldfish
    add(G.tor(R * Math.sin(.55), .014, PI * 2, 4, 22), '#e6f7ff', bwx, cy + R * Math.cos(.55), bwz, HP);
    add(G.cyl(.105, .115, .03, 16), '#e6f7ff', bwx, bot + .015, bwz);
    add(G.tor((R - .016) * Math.sin(1.05), .006, PI * 2, 3, 22), '#bfeaff', bwx, cy + (R - .016) * Math.cos(1.05), bwz, HP);
    [[-.04, -.03, '#ffb3c7'], [.04, -.02, HONEY], [0, .05, WHITE], [-.06, .04, '#9fe0c0'], [.05, .05, '#ffb3c7']].forEach(([x, z, c]) => add(G.sph(.028, 6, 4), c, bwx + x, bot + .022, bwz + z, 0, 0, 0, [1, .55, 1]));
    for (const [x, z, a, l] of [[-.05, -.04, .15, .12], [-.02, -.06, -.2, .09], [.05, -.05, .1, .07]]) add(G.cap(.016, l, 2, 5), LEAF, bwx + x, bot + .03 + l / 2, bwz + z, 0, 0, a);
    const fish = (x, y, z, ry, c, s) => {
      add(G.sph(.055 * s, 10, 8), c, x, y, z, 0, ry, 0, [1.3, 1, .72]);
      add(G.cone(.042 * s, .07 * s, 6), c, x - Math.cos(ry) * .085 * s, y, z + Math.sin(ry) * .085 * s, 0, ry, -HP, [1, 1, .45]);
      add(G.cone(.02 * s, .04 * s, 5), shade(c, -.06), x - Math.cos(ry) * .01 * s, y + .055 * s, z + Math.sin(ry) * .01 * s, 0, ry, -.4, [1, 1, .4]);
      for (const sz of [-1, 1]) add(G.sph(.012 * s, 5, 4), INK, x + Math.cos(ry) * .045 * s + Math.sin(ry) * sz * .033 * s, y + .012 * s, z - Math.sin(ry) * .045 * s + Math.cos(ry) * sz * .033 * s);
    };
    fish(bwx + .02, cy + .01, bwz + .03, -.35, '#ff7a1f', 1);
    fish(bwx - .06, cy - .07, bwz - .03, PI + .4, '#ffcc1a', .8);
    // fish-food can with a sky lid (label is a separate textured band)
    add(G.cyl(.055, .055, .11, 12), HONEY, .23, y0 + H + .105, 0);
    add(G.cyl(.06, .06, .025, 12), SKY, .23, y0 + H + .172, 0);
  }));
  f.add(mg('fishtank-label', mat('#ffffff', { map: labelTex() }), ({ add }) => add(bandGeo(.057, .07, 4, 2.4), .23, y0 + H + .105, 0)));
  // glass bowl + water (transparent: drawn without ink); the glass casts the bowl's shadow
  const glass = mesh(geo('st-bowl', () => new THREE.SphereGeometry(R, 16, 9, 0, PI * 2, .55, PI - 1)), mat('#e4f6ff', { opacity: .14, side: DS }));
  const water = mesh(geo('st-water2', () => new THREE.SphereGeometry(R - .014, 18, 7, 0, PI * 2, 1.05, PI - 1.05 - .47)), mat('#7fd6fa', { opacity: .18, side: DS }));
  water.castShadow = false;
  for (const m of [glass, water]) { put(m, bwx, cy, bwz); f.add(m); }
  // door
  const dv = new THREE.Group(); put(dv, -W / 2 + .01, y0 + H / 2 + .01, fz + .005);
  dv.add(mc('fishtank-door|' + tk, ({ add }) => {
    const cx = (W - .02) / 2;
    add(G.box(W - .02, H - .05, .035, .02), door, cx, 0, 0);
    add(G.cyl(.11, .11, .012, 16), WHITE, cx, .02, .02, HP);
    add(G.sph(.05, 8, 6), '#ff8a3c', cx - .01, .02, .028, 0, 0, 0, [1.3, 1, .35]);
    add(G.cone(.035, .05, 6), '#ff8a3c', cx + .065, .02, .028, 0, 0, HP, [1, 1, .35]);
    add(G.sph(.01, 5, 4), INK, cx - .045, .03, .045);
    for (const [x, y, r] of [[.1, .18, .022], [.14, .22, .015], [.12, .14, .012]]) add(G.sph(r, 6, 4), WHITE, cx + x, y, .02, 0, 0, 0, [1, 1, .4]);
    add(G.pbox(.035, .12, .03), WHITE, W - .08, -.02, .03);
  }));
  f.add(dv);
  const p = f.part('door', dv, t => { dv.rotation.y = -1.8 * t; }, { label: '어항 선반', sfx: 'open' });
  p.lockable = true; p.lockKind = 'lever'; f.lockAt = { x: W - .2, y: -.12, z: .04, parent: dv };   // chained shut in the story boss
  f.spot('inside', null, -.09, y0 + .05, z0 + .03, { part: p, maxH: .44, label: '어항 선반 안', scale: .9 });
  f.spot('on', null, .25, y0 + H + .05, z0 - .08, { maxH: .4, label: '어항 옆', scale: .66 });
};

// 주방 선반 (wall, span 2): two shelves of jars, a cat-food can pyramid, a teapot, bowls and two mugs on hooks
B.wallrack = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc = col(T, 'accent'), acc2 = col(T, 'accent2');
  const tk = [wood, woodD, acc, acc2].join(',');
  const W = 1.64, Dp = .27, y1 = 1.4, y2 = 1.84, bt = .045;
  const s1 = y1 + bt / 2, s2 = y2 + bt / 2;   // shelf top surfaces
  f.add(mc('wallrack|' + tk, ({ add }) => {
    for (const y of [y1, y2]) add(G.box(W, bt, Dp, .015), wood, 0, y, Dp / 2);
    for (const sx of [-1, 1]) {
      const sh = new THREE.Shape(); sh.moveTo(0, -.18); sh.lineTo(0, y2 - y1 + .08); sh.lineTo(Dp - .02, y2 - y1 + .08); sh.lineTo(Dp - .02, 0); sh.quadraticCurveTo(Dp - .03, -.14, .05, -.18); sh.lineTo(0, -.18);
      add(G.ext(sh, .035, .006, 6), woodD, sx * (W / 2 - .03) + .0175, y1, 0, 0, -HP, 0);
    }
    // scalloped trim under the lower shelf
    for (let i = 0; i < 13; i++) add(G.cyl(.05, .05, .012, 8), acc, -W / 2 + .1 + i * (W - .2) / 12, y1 - bt / 2 - .002, Dp + .002, HP, 0, 0, [1, 1, .55]);
    // upper shelf: three jars, bowls, teapot
    [[-.66, '#fbfbf5', acc2, .18], [-.5, '#fbfbf5', SKY, .15], [-.35, HONEY, '#c98943', .13]].forEach(([x, c, lc, h]) => {
      add(G.cyl(.062, .062, h, 12), c, x, s2 + h / 2, .13);
      add(G.cyl(.066, .066, .035, 12), lc, x, s2 + h + .017, .13);
      add(G.sph(.018, 6, 4), lc, x, s2 + h + .04, .13);
    });
    for (let i = 0; i < 3; i++) add(G.cyl(.105 - i * .006, .075 - i * .006, .045, 14), i % 2 ? acc2 : WHITE, .22, s2 + .022 + i * .04, .13);
    const tx = .56;
    add(G.sph(.1, 12, 8), SKY, tx, s2 + .085, .13, 0, 0, 0, [1.15, .85, 1]);
    add(G.cyl(.05, .065, .03, 10), SKY, tx, s2 + .17, .13);
    add(G.sph(.022, 6, 4), WHITE, tx, s2 + .195, .13);
    add(G.cap(.02, .08, 2, 5), SKY, tx + .13, s2 + .11, .13, 0, 0, -.8);
    add(G.tor(.05, .014, PI * 1.2, 4, 8), SKY, tx - .12, s2 + .1, .13, 0, 0, HP - .1);
    add(G.cyl(.03, .03, .006, 10), WHITE, tx, s2 + .09, .23, HP);
    // mugs on hooks under the upper shelf
    for (const [x, c] of [[.42, acc], [.64, HONEY]]) {
      add(G.cyl(.004, .004, .03, 4), STEEL, x + .05, y2 - bt / 2 - .015, .14);
      add(G.tor(.014, .004, PI * 1.4, 3, 6), STEEL, x + .05, y2 - bt / 2 - .035, .14, 0, HP, PI * 1.2);
      add(G.tor(.03, .01, PI * 2, 4, 8), c, x + .05, y2 - .095, .14, 0, HP, 0);
      add(G.cyl(.045, .04, .1, 10), c, x, y2 - .13, .14);
    }
    // lower shelf: cat-food can pyramid, a little plant
    for (const [x, y] of [[-.21, 0], [-.09, 0], [-.15, .09]]) { add(G.cyl(.058, .058, .09, 12), '#e3e8f0', x, s1 + y + .045, .13); add(G.cyl(.054, .054, .006, 12), '#bfc6d4', x, s1 + y + .092, .13); }
    add(G.cyl(.06, .05, .09, 10), CORAL, .64, s1 + .045, .13);
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; add(G.sph(.042, 6, 4), LEAF, .64 + Math.cos(a) * .035, s1 + .12, .13 + Math.sin(a) * .035, 0, -a, .5, [1.3, .55, .7]); }
    add(G.sph(.035, 6, 5), shade(LEAF, .1), .64, s1 + .14, .13);
  }));
  f.add(mg('wallrack-labels', mat('#ffffff', { map: labelTex() }), ({ add }) => {
    add(bandGeo(.064, .06, 0), -.66, s2 + .08, .13);
    add(bandGeo(.064, .06, 1), -.5, s2 + .07, .13);
    add(bandGeo(.064, .05, 2), -.35, s2 + .06, .13);
    for (const [x, y] of [[-.21, 0], [-.09, 0], [-.15, .09]]) add(bandGeo(.06, .06, 7, 2.6), x, s1 + y + .045, .13);
  }));
  f.spot('on', null, -.52, s1, .14, { maxH: .36, label: '선반 아래칸', scale: .85 });
  f.spot('on', null, .2, s1, .14, { maxH: .36, label: '선반 아래칸', scale: .85 });
  f.spot('on', null, -.08, s2, .14, { maxH: .45, label: '선반 위칸', scale: .85 });
};

// 그릇 찬장: a kitchen dresser. Arched "glass" doors (code lock) over two shelves of dishes, a drawer, a gingham
// curtain over the bottom shelf, a counter ledge, and plates on display along the top.
B.dishcab = (f, T) => {
  const body = col(T, 'accent'), bodyD = shade(body, -.1), inner = shade(body, -.2), wood = col(T, 'wood'), frame = '#fffaf2', pane = '#d9f0f8', drawerC = col(T, 'accent3'), knob = col(T, 'knob'), curtC = col(T, 'accent2');
  const tk = [body, wood, drawerC, knob, curtC].join(',');
  const W = .84, D = .46, z0 = -.2, bfz = z0 + D / 2, ly = .62, HW = .82, HD = .3, hz = -.43 + HD / 2, hfz = hz + HD / 2, top = 1.5, shY = 1.08;
  f.add(mc('dishcab|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.pbox(.06, .06, .06), bodyD, sx * (W / 2 - .05), .03, z0 + sz * (D / 2 - .05));
    // base: shell, drawer bay, open bottom shelf behind the curtain
    add(G.box(W, .04, D, .015), body, 0, .08, z0);
    add(G.box(.04, ly - .06, D, .015), body, -W / 2 + .02, (ly + .06) / 2, z0); add(G.box(.04, ly - .06, D, .015), body, W / 2 - .02, (ly + .06) / 2, z0);
    add(G.pbox(W, ly - .06, .04), body, 0, (ly + .06) / 2, z0 - D / 2 + .02);
    add(G.pbox(W - .06, .03, D - .03), body, 0, .425, z0);
    add(G.pbox(W - .08, .32, .01), inner, 0, .26, z0 - D / 2 + .045);
    add(G.cyl(.012, .012, W - .06, 6), STEEL, 0, .405, bfz - .015, 0, 0, HP);
    add(G.cyl(.09, .08, .12, 12), '#ff9f6b', -.25, .16, z0 - .08); add(G.cyl(.1, .1, .02, 12), '#e8805a', -.25, .23, z0 - .08);
    // ledge
    add(G.box(W + .06, .05, D + .06, .02), wood, 0, ly + .025, z0 + .03);
    // hutch
    add(G.pbox(HW, top - ly - .05, .03), body, 0, (top + ly + .05) / 2, -.43 + .015);
    add(G.pbox(HW - .06, top - ly - .1, .006), inner, 0, (top + ly + .05) / 2, -.43 + .032);
    add(G.box(.035, top - ly - .05, HD, .012), body, -HW / 2 + .0175, (top + ly + .05) / 2, hz); add(G.box(.035, top - ly - .05, HD, .012), body, HW / 2 - .0175, (top + ly + .05) / 2, hz);
    add(G.pbox(HW - .05, .03, HD - .02), body, 0, shY, hz - .01);
    add(G.box(HW + .08, .06, HD + .08, .02), bodyD, 0, top + .01, hz + .02);
    add(G.pbox(HW + .02, .03, HD + .02), body, 0, top + .055, hz + .02);
    // dishes inside: a stack of plates, two cups
    for (let i = 0; i < 4; i++) add(G.cyl(.11, .09, .02, 12), i % 2 ? WHITE : SKY2, -.2, ly + .06 + i * .022, hz - .02);
    for (const [x, c] of [[-.27, curtC], [-.12, WHITE]]) { add(G.cyl(.045, .038, .085, 10), c, x, shY + .058, hz - .02); add(G.tor(.026, .009, PI * 2, 3, 8), c, x + .05, shY + .062, hz - .02); }
    // plates on display along the top
    for (const [x, c] of [[-.25, SKY], [0, CORAL], [.25, HONEY]]) {
      add(G.cyl(.105, .105, .018, 16), WHITE, x, top + .16, hz - .04, HP - .28, 0, 0);
      add(G.cyl(.06, .06, .02, 12), c, x, top + .162, hz - .035, HP - .28, 0, 0);
    }
    add(G.cyl(.01, .01, HW, 5), bodyD, 0, top + .13, hz + .06, 0, 0, HP);
    for (const sx of [-1, 1]) add(G.cyl(.012, .012, .08, 5), bodyD, sx * (HW / 2 - .02), top + .1, hz + .06);
  }));
  // glass doors (code lock): arched frames with flat light panes and two white glints
  const leafW = HW / 2 - .005, leafH = top - ly - .07, ly0 = ly + .05;
  const leaf = sx => {
    const pv = new THREE.Group(); put(pv, sx * HW / 2, ly0 + leafH / 2, hfz + .004);
    pv.add(mc('dishcab-leaf' + sx + '|' + tk, ({ add }) => {
      const X = x => sx * -x;   // leaf runs from the hinge (0) toward the middle
      const s = rrShape(Math.min(X(0), X(leafW)), -leafH / 2, leafW, leafH, .03);
      const hw = leafW - .1, ax = X(leafW / 2), hb = -leafH / 2 + .06, ht = leafH / 2 - .06 - hw / 2;
      const arch = (p, e) => { p.moveTo(ax - hw / 2 - e, hb - e); p.lineTo(ax + hw / 2 + e, hb - e); p.lineTo(ax + hw / 2 + e, ht); p.absarc(ax, ht, hw / 2 + e, 0, PI, false); p.lineTo(ax - hw / 2 - e, hb - e); return p; };
      s.holes.push(arch(new THREE.Path(), 0));
      add(G.ext(s, .025, 0, 5), frame, 0, 0, 0);
      add(G.ext(arch(new THREE.Shape(), .01), .006, 0, 6), pane, 0, 0, .008);
      add(G.pbox(hw + .02, .03, .02), frame, ax, -.05, .015);
      add(G.sph(.022, 6, 5), knob, X(leafW - .045), -.06, .035);
    }));
    f.add(pv); return pv;
  };
  const L = leaf(-1), R = leaf(1);
  const p = f.part('door', [L, R], t => { L.rotation.y = -1.85 * t; R.rotation.y = 1.85 * t; }, { label: '그릇 찬장', sfx: 'open', dur: .32 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: -.2, y: -.2, z: .045, parent: R };
  f.spot('inside', null, .15, shY + .015, hz - .01, { part: p, maxH: .3, label: '찬장 위칸', scale: .75 });
  f.spot('inside', null, .15, ly + .05, hz - .01, { part: p, maxH: .3, label: '찬장 아래칸', scale: .75 });
  // drawer
  const dv = new THREE.Group(); put(dv, 0, .52, bfz);
  dv.add(mc('dishcab-drawer|' + tk, ({ add }) => {
    const ic = shade(drawerC, -.15);
    add(G.box(W - .07, .15, .035, .02), drawerC, 0, 0, 0);
    add(G.cyl(.024, .024, .03, 10), knob, 0, 0, .03, HP);
    add(G.pbox(W - .12, .012, D - .1), ic, 0, -.06, -(D - .1) / 2);
    for (const sx of [-1, 1]) add(G.pbox(.012, .1, D - .1), ic, sx * (W - .12) / 2, -.02, -(D - .1) / 2);
    add(G.pbox(W - .12, .1, .012), ic, 0, -.02, -(D - .1));
  }));
  f.add(dv);
  const dp = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .32 * t; }, { label: '찬장 서랍', sfx: 'drawer', dur: .26 });
  f.spot('inside', dv, .08, -.054, -.18, { part: dp, maxH: .12, label: '찬장 서랍', scale: .8 });
  // gingham curtain over the bottom shelf (two halves slide apart)
  const gm = mat('#ffffff', { map: ginghamTex(curtC) });
  const half = sx => {
    const pv = new THREE.Group(); put(pv, sx * (W / 2 - .04), .405, bfz - .005);
    pv.add(mg('dishcab-curtain|' + curtC + sx, gm, ({ addM }) => {
      const I = new THREE.Matrix4();
      addM(planarUV(ni(G.pbox(W / 2 - .03, .31, .016).translate(-sx * (W / 4 - .015), -.16, 0)), .16), I);
      for (let i = 0; i < 3; i++) addM(planarUV(ni(G.pbox(.022, .3, .024).translate(-sx * (.07 + i * .12), -.16, .004)), .16), I);
    }));
    f.add(pv); return pv;
  };
  const cL = half(-1), cR = half(1);
  const cp = f.part('curtain', [cL, cR], t => { cL.scale.x = 1 - .75 * t; cR.scale.x = 1 - .75 * t; }, { label: '찬장 커튼', sfx: 'swish', dur: .3 });
  f.spot('inside', null, .04, .1, z0 + .06, { part: cp, maxH: .28, label: '찬장 커튼 안', scale: .8 });
  f.spot('on', null, -.22, ly + .05, -.02, { maxH: .45, label: '찬장 선반 위', scale: .75 });
};

// 밥그릇 매트: a fish-shaped mat with a kibble bowl and a water bowl; the tail flips up. A bag of 사료 leans nearby.
B.catbowls = (f, T) => {
  const matC = SKY, bowlA = col(T, 'accent2'), zc = -.1;
  const tk = [bowlA].join(',');
  const bowl = (add, x, z, c, inside) => {
    add(G.lathe([[0, 0], [.088, 0], [.1, .012], [.118, .072], [.104, .078], [.09, .028], [0, .028]], 18), c, x, .028, z);
    add(G.cyl(.09, .09, .006, 16), inside, x, .028 + .048, z);
  };
  f.add(mc('catbowls|' + tk, ({ add }) => {
    const s = new THREE.Shape(); s.absellipse(-.1, 0, .28, .26, 0, PI * 2, false);
    add(G.ext(s, .016, .006, 14), matC, 0, .006, zc, -HP, 0, 0);
    add(G.sph(.024, 8, 6), INK, -.29, .03, zc + .07, 0, 0, 0, [1, .4, 1.15]);
    add(G.sph(.009, 5, 4), WHITE, -.297, .039, zc + .063);
    add(G.tor(.07, .01, PI * .9, 3, 10), WHITE, -.18, .03, zc, -HP, 0, -PI * .45);
    for (const [x, z] of [[.05, .12], [.1, -.08], [-.02, -.16]]) add(G.cyl(.022, .022, .006, 10), shade(matC, .1), x, .033, zc + z);
    bowl(add, -.19, zc - .1, bowlA, '#c98a4b');
    for (const [x, z, y] of [[-.21, -.11, .09], [-.17, -.08, .095], [-.19, -.13, .1], [-.15, -.12, .09], [-.22, -.07, .09], [-.19, -.095, .108]]) add(G.sph(.021, 6, 4), '#b8763c', x, y, zc + z, 0, x * 20, 0, [1, .75, 1]);
    bowl(add, .02, zc + .03, WHITE, '#7fd0f8');
    add(G.tor(.108, .008, PI * 2, 3, 18), SKY, .02, .028 + .045, zc + .03, HP);
    for (const [x, z] of [[-.02, .18], [.0, .25], [.04, .21]]) add(G.sph(.02, 6, 4), '#b8763c', x, .02, zc + z, 0, x * 30, 0, [1, .75, 1]);
    // 사료 bag (label is textured)
    add(G.box(.22, .27, .1, .03), HONEY, .3, .135, .31, 0, -.45, .05);
    add(G.box(.2, .04, .06, .015), shade(HONEY, -.08), .306, .285, .307, 0, -.45, .05);
    add(G.box(.14, .03, .075, .01), SKY, .307, .3, .307, 0, -.45, .05);
  }));
  const bag = new THREE.Group(); put(bag, .3, .135, .31, 0, -.45, .05);
  bag.add(mg('catbowls-label', mat('#ffffff', { map: labelTex() }), ({ add }) => add(quadGeo(.18, .045, 5), 0, .02, .051)));
  f.add(bag);
  // the tail flips up around the joint
  const tail = new THREE.Group(); put(tail, .14, .006, zc);
  tail.add(mc('catbowls-tail', ({ add }) => {
    const s = new THREE.Shape(); s.moveTo(-.04, .07); s.lineTo(.28, .22); s.quadraticCurveTo(.2, 0, .28, -.22); s.lineTo(-.04, -.07); s.quadraticCurveTo(-.06, 0, -.04, .07);
    add(G.ext(s, .016, .006, 6), shade(matC, -.04), 0, 0, 0, -HP, 0, 0);
    for (const k of [-1, 1]) add(G.pbox(.16, .006, .014), WHITE, .12, .029, k * .06, 0, -k * .35, 0);   // (a hair above the tail's top: they flickered on it — ① 10/21)
  }));
  f.add(tail);
  const p = f.part('lift', tail, t => { tail.rotation.z = 1.25 * t; }, { label: '매트 꼬리', sfx: 'lift' });
  f.spot('inside', null, .3, 0, zc, { part: p, maxH: .3, label: '매트 꼬리 밑', scale: .7 });
  f.spot('on', null, -.15, 0, .3, { maxH: .45, label: '밥그릇 앞', scale: .78 });
};

// 주방 의자: a wooden chair with a cat-ear back (and a tiny face); the seat cushion lifts
B.stool2 = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), cush = col(T, 'accent');
  const tk = [wood, woodD, cush].join(',');
  const sy = .44, lx = .17, lz = .15;
  f.add(mc('stool2|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.05, sy, .05, .015), woodD, sx * lx, sy / 2, sz * lz);
    for (const sx of [-1, 1]) add(G.pbox(.03, .03, 2 * lz), woodD, sx * lx, .14, 0);
    add(G.box(.44, .045, .4, .015), wood, 0, sy + .0225, 0);
    // back: two uprights, a rail, and a top board with cat ears
    for (const sx of [-1, 1]) add(G.box(.045, .5, .045, .015), woodD, sx * lx, sy + .25, -lz - .005, -.06, 0, 0);
    add(G.box(.32, .045, .035, .012), wood, 0, sy + .24, -lz - .02, -.06, 0, 0);
    add(G.ext(rrShape(-.22, 0, .44, .16, .05), .035, .006, 4), wood, 0, sy + .38, -lz - .055, -.06, 0, 0);
    for (const sx of [-1, 1]) {
      add(G.ext(earShape(.12, .1, .025), .035, .006, 4), wood, sx * .14, sy + .53, -lz - .065, -.06, 0, -sx * .15);
      add(G.ext(earShape(.06, .05, .012), .008, 0, 4), BLUSH, sx * .14, sy + .545, -lz - .022, -.06, 0, -sx * .15);
      add(G.sph(.016, 6, 5), INK, sx * .06, sy + .46, -lz - .012, 0, 0, 0, [1, 1.2, .5]);
    }
    add(G.tor(.016, .005, PI, 3, 6), INK, 0, sy + .44, -lz - .012, 0, 0, PI);
    // (⑥ 10/24 사용자 34판 "의자 디테일 올려줘"): two spindles in the back, a little heart on the top board, rungs between the
    // front legs, felt pads under the feet
    for (const sx of [-1, 1]) add(G.cyl(.012, .014, .13, 8), woodD, sx * .06, sy + .31, -lz - .03, -.06, 0, 0);
    add(G.ext(heartShape(.025), .008, 0, 6), BLUSH, .12, sy + .36, -lz - .02, -.06, 0, 0);
    add(G.pbox(2 * lx, .025, .025), woodD, 0, .1, lz);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.03, .03, .012, 10), '#c9b89a', sx * lx, .006, sz * lz);
  }));
  const cu = grp(mc('stool2-cush|' + tk, ({ add }) => {
    add(G.box(.38, .06, .35, .028, 2), cush, 0, 0, 0);
    for (const [x, z] of [[-.08, -.07], [.08, -.07], [-.08, .07], [.08, .07]]) add(G.sph(.012, 6, 4), shade(cush, -.12), x, .032, z, 0, 0, 0, [1, .5, 1]);
    for (const sz of [-1, 1]) add(G.box(.37, .014, .014, .006), shade(cush, -.08), 0, 0, sz * .172); for (const sx of [-1, 1]) add(G.box(.014, .014, .33, .006), shade(cush, -.08), sx * .187, 0, 0);
    for (const sx of [-1, 1]) add(G.cap(.009, .06, 2, 4), shade(cush, -.1), sx * .17, -.01, -.19, .5, 0, sx * .3);
  }));
  put(cu, 0, sy + .075, .01); f.add(cu);
  const p = f.part('lift', cu, (t, b) => { cu.position.y = b.p.y + .32 * t; cu.position.z = b.p.z + .12 * t; cu.rotation.x = -.25 * t; cu.rotation.z = .14 * t; }, { label: '의자 방석', sfx: 'lift' });
  f.spot('inside', null, 0, sy + .046, .02, { part: p, maxH: .3, label: '의자 방석 밑', scale: .85 });
  f.spot('under', null, 0, 0, .04, { maxH: .33, label: '의자 밑', scale: .8 });
};

// 식탁 (2×1): a table under a gingham cloth that falls to the floor; the front drape rolls up to show what's under the
// table. On top: a grilled fish on a plate (the cat's obsession), a flower vase, a mug and a jam jar.
B.kitchentable = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), clothC = col(T, 'accent2'), acc = col(T, 'accent');
  const tk = [wood, woodD, clothC, acc].join(',');
  const ty = .72, top = ty + .045, CW = 1.88, CD = .92, drop = .66;
  const gm = mat('#ffffff', { map: ginghamTex(clothC) });
  f.add(mc('kitchentable|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.07, ty - .02, .07, .02), woodD, sx * .82, (ty - .02) / 2, sz * .36);
    add(G.pbox(1.8, .04, .84), wood, 0, ty + .005, 0);
    // trim along the fixed drapes
    for (const sx of [-1, 1]) add(G.pbox(.03, .05, CD + .02), WHITE, sx * (CW / 2 + .01), top - drop + .02, 0);
    add(G.pbox(CW + .04, .05, .03), WHITE, 0, top - drop + .02, -CD / 2 - .01);
    // grilled fish on a plate
    const px = -.5, pz = .06;
    add(G.cyl(.17, .14, .025, 20), WHITE, px, top + .012, pz);
    add(G.tor(.15, .008, PI * 2, 3, 20), SKY, px, top + .026, pz, HP);
    // (⑥ 10/23 사용자 메모 6판 "이런 것들 디테일이 떨어짐": a stretched ball and a cone — now one grilled fish cut as a fish (round
    // head, fat belly, a forked tail, a fin on its back), golden with darker grill bars, a white eye, beside it a lemon wedge and a
    // sprig of parsley, and a pair of chopsticks on a little rest)
    { const fsh = new THREE.Shape(); fsh.moveTo(-.12, 0); fsh.bezierCurveTo(-.12, .05, -.04, .062, .04, .04); fsh.lineTo(.09, .014); fsh.lineTo(.14, .05); fsh.lineTo(.125, 0); fsh.lineTo(.14, -.05); fsh.lineTo(.09, -.014); fsh.lineTo(.04, -.04); fsh.bezierCurveTo(-.04, -.062, -.12, -.05, -.12, 0);
      const fg = G.ext(fsh, .035, .012, 10).rotateX(-HP), fy = top + .03, a = .3, P = (u, v) => [px + u * Math.cos(a) + v * Math.sin(a), pz - u * Math.sin(a) + v * Math.cos(a)];
      add(fg, '#f0a24e', px - .01, fy, pz, 0, a, 0);
      for (let i = 0; i < 4; i++) { const [x, z] = P(-.06 + i * .04, 0); add(G.box(.01, .006, .075 - Math.abs(i - 1.5) * .012, .002), '#8a4d2a', x, fy + .06, z, 0, a + .5, 0); }
      { const [x, z] = P(.0, -.03); add(G.ext(fsh, .004, 0, 4).scale(.5, .35, 1).rotateX(-HP).rotateZ(-.2), '#e08a3a', x, fy + .055, z, 0, a, 0); }
      { const [x, z] = P(-.095, .016); add(G.sph(.012, 8, 6), WHITE, x, fy + .05, z); add(G.sph(.006, 6, 4), INK, x + .002, fy + .056, z + .004); }
      { const [x, z] = P(.02, .1); add(G.cyl(.035, .035, .02, 12, false, 0, PI), '#ffe066', x, top + .035, z, HP, a + .4, 0); add(G.sph(.016, 6, 5), '#6cbf5a', x + .04, top + .04, z - .02, 0, 0, 0, [1.3, .6, 1]); add(G.sph(.012, 6, 5), '#4ea85a', x + .055, top + .045, z - .01); }
      for (const dz of [-.012, .012]) add(G.box(.008, .008, .2, .002), '#c98a52', px + .22, top + .012, pz + dz, 0, .1, 0);
      add(G.box(.02, .012, .05, .004), '#ff9fb0', px + .22, top + .006, pz - .07, 0, .1, 0); }
    // vase with a flower
    const vx = .02, vz = -.26;
    add(G.lathe([[0, 0], [.045, 0], [.055, .05], [.035, .12], [.03, .15], [.04, .17], [0, .17]], 12), acc, vx, top, vz);
    add(G.cyl(.006, .006, .14, 4), LEAF, vx, top + .22, vz);
    add(G.sph(.03, 6, 5), LEAF, vx + .03, top + .2, vz, 0, 0, -.6, [1.4, .5, .8]);
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; add(G.sph(.026, 6, 5), HONEY, vx + Math.cos(a) * .03, top + .3, vz + Math.sin(a) * .03, 0, 0, 0, [1, .6, 1]); }
    add(G.sph(.02, 6, 5), '#ff8a3c', vx, top + .305, vz);
    // mug + jam jar
    add(G.cyl(.05, .045, .1, 12), acc, .55, top + .05, -.22); add(G.tor(.032, .011, PI * 2, 3, 8), acc, .605, top + .055, -.22);
    add(G.cyl(.045, .045, .09, 10), CORAL, .68, top + .045, -.1); add(G.cyl(.05, .05, .03, 10), WHITE, .68, top + .1, -.1);
    add(G.sph(.016, 5, 4), CORAL, .68, top + .12, -.1);
  }));
  // the cloth: top + side and back drapes (fixed), gingham with world-sized checks
  f.add(mg('kitchentable-cloth|' + clothC, gm, ({ addM }) => {
    const I = new THREE.Matrix4();
    const piece = (w, h, d, x, y, z) => addM(planarUV(ni(G.box(w, h, d, .008)).translate(x, y, z), .24), I);
    piece(CW, .02, CD, 0, top - .01, 0);
    for (const sx of [-1, 1]) piece(.02, drop, CD, sx * CW / 2, top - drop / 2, 0);
    piece(CW, drop, .02, 0, top - drop / 2, -CD / 2);
  }));
  // front drape: rolls up (scale.y) from the table edge
  const pv = new THREE.Group(); put(pv, 0, top, CD / 2 + .002);
  pv.add(mg('kitchentable-drape|' + clothC, gm, ({ addM }) => addM(planarUV(ni(G.box(CW, drop, .02, .008)).translate(0, -drop / 2, 0), .24), new THREE.Matrix4())));
  pv.add(mc('kitchentable-drapetrim', ({ add }) => {
    add(G.pbox(CW + .02, .05, .03), WHITE, 0, -drop + .02, .004);
    for (let i = 0; i < 4; i++) add(G.cyl(.022, .022, .012, 8), WHITE, -.66 + i * .44, -drop + .06, .02, HP);
  }));
  f.add(pv);
  const p = f.part('curtain', pv, (t, b) => { pv.scale.y = 1 - .8 * t; pv.position.z = b.p.z + .02 * t; }, { label: '식탁보', sfx: 'swish', dur: .32 });
  f.spot('inside', null, -.42, 0, .04, { part: p, maxH: .45, label: '식탁보 밑', scale: .9 });
  f.spot('inside', null, .42, 0, .04, { part: p, maxH: .45, label: '식탁보 밑', scale: .9 });
  f.spot('on', null, .25, top, .12, { maxH: .45, label: '식탁 위', scale: .88 });
  f.spot('on', null, -.2, top, -.2, { maxH: .45, label: '식탁 위', scale: .8 });
};

export const STORY_BUILDERS = B;

export const STORY_INFO = {
  cattower: { w: 1, d: 1, name: '캣타워', price: 400 },
  catbed: { w: 1, d: 1, name: '고양이 방석', price: 150 },
  yarnbasket: { w: 1, d: 1, name: '털실 바구니', price: 130 },
  fishtank: { w: 1, d: 1, name: '어항 선반', price: 260 },
  wallrack: { wall: true, span: 2, name: '주방 선반', price: 180 },
  dishcab: { w: 1, d: 1, name: '그릇 찬장', price: 340 },
  catbowls: { w: 1, d: 1, name: '밥그릇 매트', price: 80 },
  stool2: { w: 1, d: 1, name: '주방 의자', price: 90 },
  kitchentable: { w: 2, d: 1, name: '식탁', price: 280 },
};

// ═════════════════════════════════════════════ STORY ITEMS ═════════════════════════════════════════════
// Same shape as items.js ITEMS: { name, h, flat?, build() } → Group, origin bottom centre, ~0.25–0.4 wide.
const diaryTex = () => tex('story-diary2', 256, 200, (c, w, h) => {
  c.fillStyle = tint('#9d86ff'); c.fillRect(0, 0, w, h);   // same paint as the vertex-coloured cover
  c.fillStyle = '#fff6e4'; roundRect(c, 12, 30, 70, 38, 9); c.fill();
  txt(c, '일기장', 47, 50, 16, '#6a4fd8');
  c.fillStyle = '#ffd23f';
  for (const [x, y, r] of [[20, 84, 5], [76, 16, 4], [24, 16, 3], [60, 86, 3]]) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -HP + i * PI / 5, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); }
  c.fillStyle = '#ff9fc0'; blob(c, 40, 84, 3); blob(c, 50, 80, 2.2);
}, { text: true });
const pawNoteTex = () => tex('story-pawnote', 256, 200, (c, w, h) => {
  c.fillStyle = '#fff7df'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#f0d3a8'; c.lineWidth = 1.5;
  for (let y = 26; y < h; y += 16) { c.beginPath(); c.moveTo(8, y); c.lineTo(w - 8, y); c.stroke(); }
  pawIcon(c, w / 2 - 6, h / 2 + 6, 44, '#e9772a');
  txt(c, '냥!', w - 24, 18, 15, '#e9772a');
  c.save(); c.translate(26, h - 16); c.rotate(-.2); txt(c, '흥', 0, 0, 12, '#c4643a'); c.restore();
}, { text: true });
const snackLabelTex = () => tex('story-snacklabel', 192, 64, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#4fb8ff'; c.fillRect(0, 0, w, 5); c.fillRect(0, h - 5, w, 5);
  fishIcon(c, 20, h / 2, 14, '#ff8a3c');
  txt(c, '간식', 60, h / 2 + 1, 17, '#ff6a3d');
}, { text: true });

function fishShape(L = .34, Hh = .19) {
  const s = new THREE.Shape(), a = L / 2;
  s.moveTo(-a, 0);
  s.bezierCurveTo(-a + .02, Hh * .45, a * .1, Hh * .5, a * .55, Hh * .1);
  s.lineTo(a, Hh * .42); s.quadraticCurveTo(a * .8, 0, a, -Hh * .42); s.lineTo(a * .55, -Hh * .1);
  s.bezierCurveTo(a * .1, -Hh * .5, -a + .02, -Hh * .45, -a, 0);
  return s;
}

export const STORY_ITEMS = {
  // 생선 간식: a plump baked fish treat lying on its side, wearing a paper 간식 band
  fishsnack: { name: '생선 간식', h: .08, flat: true, build() {
    const g = grp(), gold = '#ffb54d', dark = '#e88a2c';
    g.add(mc('it-fishsnack2', ({ add }) => {
      add(G.ext(fishShape(), .036, .012, 10), gold, 0, .012, 0, -HP, 0, 0);
      const top = .06;
      add(G.sph(.02, 8, 6), INK, -.115, top, -.024, 0, 0, 0, [1, .4, 1.15]);
      add(G.sph(.007, 4, 3), WHITE, -.12, top + .007, -.031);
      add(G.sph(.02, 6, 4), '#ff8f6b', -.118, top - .004, .022, 0, 0, 0, [1.1, .3, .75]);
      add(G.tor(.014, .005, PI, 3, 6), INK, -.152, top - .002, .002, -HP, 0, HP);
      add(G.tor(.045, .008, PI * .8, 3, 8), dark, -.072, top - .002, 0, -HP, 0, PI * .6);
      for (const [x, z] of [[.1, -.025], [.1, .025], [.125, 0]]) add(G.tor(.014, .005, PI, 3, 6), dark, x, top - .002, z, -HP, 0, -HP);
      // paper band round the middle, sky stripes at its edges
      add(G.box(.075, .074, .2, .01), WHITE, .025, .037, 0);
      for (const sx of [-1, 1]) add(G.box(.012, .076, .202, .004), '#4fb8ff', .025 + sx * .032, .037, 0);
    }));
    g.add(put(mesh(geo('it-snacklabel', () => new THREE.PlaneGeometry(.17, .056)), mat('#ffffff', { map: snackLabelTex() })), .025, .0745, 0, -HP, 0, HP));
    return g;
  } },
  // 몽글이 일기장: a chunky lilac diary, cream page block, a strap over the edge with a little gold heart lock
  diary: { name: '몽글이 일기장', h: .15, flat: true, build() {
    const g = grp(), cov = '#9d86ff', covD = '#7f68e8', pages = '#fff7e8', strap = '#b97a44';
    g.add(mc('it-diary2', ({ add }) => {
      add(G.box(.32, .022, .25, .008), cov, 0, .011, 0);
      add(G.box(.3, .07, .232, .006), pages, .008, .055, 0);
      for (const y of [.035, .055, .075]) add(G.pbox(.004, .002, .2), '#eadcc4', .158, y, 0);
      add(G.box(.32, .022, .25, .008), cov, 0, .1, 0);
      add(G.cyl(.058, .058, .25, 12), covD, -.155, .057, 0, HP, 0, 0, [.42, 1, 1]);
      add(G.pbox(.018, .004, .05), '#4fb8ff', .07, .092, .14, 0, .2, 0);
      add(G.pbox(.018, .03, .004), '#4fb8ff', .074, .078, .165, 0, .2, 0);
      // strap: up the side, over the front cover, ending in the shared little brass lock
      add(G.pbox(.07, .008, .05), strap, .13, .115, 0);
      add(G.pbox(.01, .12, .05), strap, .166, .057, 0);
    }));
    // Face up above the strap; the shackle runs toward the cover's outer edge.
    g.add(put(gptLock('pad'), .1, .134, 0, -HP, 0, -HP, .48));
    g.add(put(mesh(geo('it-diarylabel', () => new THREE.PlaneGeometry(.26, .2)), mat('#ffffff', { map: diaryTex() })), -.015, .1115, 0, -HP));
    return g;
  } },
  // 황금 생선뼈: the secret bonus — a golden fish skeleton
  goldbone: { name: '황금 생선뼈', h: .05, flat: true, build() {
    const g = grp(), gold = '#ffc93c', light = '#ffe58a', dark = '#e2a21f';
    g.add(mc('it-goldbone', ({ add, tube }) => {
      const hs = new THREE.Shape(); hs.moveTo(-.19, 0); hs.bezierCurveTo(-.17, .08, -.08, .1, -.06, .065); hs.lineTo(-.06, -.065); hs.bezierCurveTo(-.08, -.1, -.17, -.08, -.19, 0);
      hs.holes.push(new THREE.Path().absarc(-.125, .02, .018, 0, PI * 2, true));
      add(G.ext(hs, .022, .007, 8), gold, 0, .007, 0, -HP, 0, 0);
      add(G.cyl(.016, .016, .2, 8), gold, .04, .02, 0, 0, 0, HP);
      [[-.03, .1], [.02, .09], [.07, .072]].forEach(([x, l]) => { for (const sz of [-1, 1]) { tube([x, .02, sz * .012], [x + .035, .02, sz * (l + .012)], .011, gold, 6); add(G.sph(.013, 6, 4), gold, x + .035, .02, sz * (l + .012)); } });
      const ts = new THREE.Shape(); ts.moveTo(.12, 0); ts.lineTo(.2, .07); ts.quadraticCurveTo(.175, 0, .2, -.07); ts.lineTo(.12, 0);
      add(G.ext(ts, .02, .006, 6), gold, 0, .007, 0, -HP, 0, 0);
      add(G.sph(.012, 6, 4), light, -.16, .033, -.03);
      add(G.cap(.006, .05, 2, 4), light, -.1, .034, -.055, HP, 0, -HP * .6);
      add(G.cyl(.019, .019, .006, 10), dark, -.125, .009, -.02);
    }));
    return g;
  } },
  // 털뭉치 단서: a soft tuft of orange cat fur, a few loose wisps
  furball: { name: '털뭉치 단서', h: .19, build() {
    const g = grp(), o = ORANGE, d = '#ef8a33', cr = '#fff1d9';
    g.add(mc('it-furball2', ({ add }) => {
      add(G.sph(.085, 12, 9), o, 0, .07, 0, 0, 0, 0, [1.25, .8, 1.05]);
      [[-.08, .05, .04, .055, o], [.08, .055, -.03, .06, d], [.02, .1, .05, .05, cr], [-.04, .1, -.05, .05, o], [.07, .04, .06, .045, cr], [-.09, .04, -.05, .045, d]].forEach(([x, y, z, r, c]) => add(G.sph(r, 10, 7), c, x, y, z, 0, 0, 0, [1, .85, 1]));
      for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + .3; add(G.cone(.03, .05, 5), i % 3 ? o : cr, Math.cos(a) * .125, .065 + (i % 2) * .025, Math.sin(a) * .1, Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.35); }
      add(G.tor(.03, .008, PI * 1.2, 3, 8), d, .02, .15, 0, 0, .4, 0);
      add(G.tor(.025, .007, PI * 1.1, 3, 8), o, -.03, .145, .02, 0, -.6, .3);
    }));
    return g;
  } },
  // 발자국 쪽지: a note with a big orange paw print (and a dog-eared corner)
  pawprint: { name: '발자국 쪽지', h: .025, flat: true, build() {
    const g = grp();
    g.add(mc('it-pawprint', ({ add }) => {
      add(G.box(.25, .01, .2, .003), '#fff7df', 0, .005, 0);
      const cs = new THREE.Shape(); cs.moveTo(.075, -.1); cs.lineTo(.075, -.05); cs.lineTo(.125, -.05); cs.lineTo(.075, -.1);
      add(new THREE.ShapeGeometry(cs), '#eedcb8', 0, .0113, 0, -HP, 0, 0);
      add(G.sph(.014, 6, 5), '#ff6f91', -.1, .016, -.075, 0, 0, 0, [1, .45, 1]);
    }));
    g.add(put(mesh(geo('it-pawnote', () => new THREE.PlaneGeometry(.24, .19)), mat('#ffffff', { map: pawNoteTex() })), 0, .0106, 0, -HP));
    return g;
  } },
};

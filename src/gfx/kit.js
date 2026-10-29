// Shared geometry/material kit. Everything is procedural: rounded boxes, spheres, capsules, soft rim light.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const GEO = new Map(), MAT = new Map();
export const cachedGeos = () => new Set(GEO.values());   // (myhome.js frees a rebuilt room but keeps the shared shapes)
// Free the GPU side of what a scene built: its own geometries and every texture it used — canvas textures are made per
// scene, and a cached material keyed by such a texture would otherwise keep it (and itself) forever, so those cache
// entries go too. Shared cached geometries stay. Safe even if something is still referenced elsewhere: three uploads a
// disposed geometry or texture again the next time it is drawn.
// Materials are NOT disposed (2026-10-18): a material holds no GPU memory of its own (its textures are freed above,
// the object is garbage-collected), but disposing the last material of a kind made three delete that shader program,
// so every stage entry compiled 5 shaders again (home: 2) — a hitch at each stage start on phones that compile on the
// main thread (most Android). Keeping them leaves the programs warm.
export function disposeTree(root) {
  const keepG = new Set(GEO.values()), keepM = new Set(MAT.values());
  const doneG = new Set(), mats = new Set(), texs = new Set();
  root.traverse(o => {
    if (o.geometry && !keepG.has(o.geometry) && !doneG.has(o.geometry)) { doneG.add(o.geometry); o.geometry.dispose(); }
    for (const m of [].concat(o.material || [])) { mats.add(m); for (const k in m) if (m[k]?.isTexture && m[k] !== STYLE.grad) texs.add(m[k]); }
  });
  for (const [k, m] of MAT) if (m.map && texs.has(m.map)) MAT.delete(k);
  for (const t of texs) t.dispose();
}
// (QA3-tex11, GPT QA TECH-12) the same for a caller that frees textures itself (my home's freeRoom): a cached material keyed by a
// freed texture is never asked for again (its key holds the texture's uuid), but it kept the texture — and its canvas — alive
export function forgetMats(texs) { for (const [k, m] of MAT) if (m.map && texs.has(m.map)) MAT.delete(k); }
// Shared shapes are cached by key, and the key carries theme colours, so every new room adds a few. They used to stay on
// the GPU for good (disposeTree spares cached shapes), and after a dozen stages phones ran out of memory and the page
// was reloaded (user, 10/17: "스테이지 몇판 하다보면 튕김"). Each scene build is a generation: purgeGeo() frees whatever
// the last two scenes never asked for; a freed shape is simply rebuilt if it is wanted again.
let GEN = 0; const USED = new Map();
// textured materials in the material cache, by the generation they were last asked for (see purgeGeo). A cached material
// holds its texture and the texture its canvas; the cache never let go of them, so every stage left its floor, wall, ground
// and apron canvases behind (look.js swaps the apron's material and makes its own textured ones; texCache textures went but
// their materials stayed) — 1판→7판 the live canvases went 56 → 97 MB, and an iPhone reloaded the page after 9판's 이불 놀이
// (QA 10/20). Dropping the cache's hold changes nothing on screen: whatever still shows keeps its own material.
const MUSE = new Map();
export function geo(key, make) { let g = GEO.get(key); if (!g) { g = make(); GEO.set(key, g); } USED.set(key, GEN); return g; }
export function purgeGeo() {
  GEN++;
  for (const [k, g] of GEO) if ((USED.get(k) ?? -9) < GEN - 2) { g.dispose(); GEO.delete(k); USED.delete(k); }
  for (const m of TEXCACHES) for (const [k, e] of m) if (e.gen < GEN - 2) { e.t.dispose(); m.delete(k); }
  for (const [k, g] of MUSE) if (g < GEN - 2) { MAT.delete(k); MUSE.delete(k); }
}
// The props' painted textures (signs, labels, patterns — keyed by theme colours and text) are cached the same way. They
// used to live forever: ~5 more canvases every stage, 146 canvases / ~60 MB after 28 stages, on top of what each scene
// needs (user, 10/18: "몇 판 하다 보면 하얗게 변하고 처음 로딩 화면"). texCache().get(key, make) = cached per generation.
const TEXCACHES = [];
export function texCache() {
  const m = new Map(); TEXCACHES.push(m);
  return { get(key, make) { let e = m.get(key); if (!e) m.set(key, e = { t: make(), gen: GEN }); e.gen = GEN; return e.t; }, get size() { return m.size; } };
}

// Soft fresnel rim on every material: the "몽글몽글" glow that makes flat pastel shapes read as soft and squishy.
const RIM_COLOR = new THREE.Color('#fff3ea');
function rimify(m, strength) {
  m.onBeforeCompile = sh => {
    sh.uniforms.uRimColor = { value: RIM_COLOR };
    sh.uniforms.uRimStrength = { value: strength };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimStrength;')
      .replace('#include <opaque_fragment>', 'float rimF = 1.0 - saturate(dot(geometryNormal, geometryViewDir));\noutgoingLight += uRimColor * pow(rimF, 2.6) * uRimStrength;\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'rim' + strength;
}

// Render style switch. 'std' = the original soft PBR look; 'toon' = matte cel shading for the cartoon-outline art test.
export const STYLE = { mode: 'std', remap: null, grad: null };
// a door, drawer, lid or lift moved this frame: its shadow must follow (World redraws the shadow map, which otherwise only
// happens when the view turns — so an opened door's shadow stayed shut, then jumped long at the next turn; user 10/19:
// "가끔 그림자가 튀는데 길어지는거같디도하고")
export const SHADOW = { moved: false };
export function setStyle(mode, { remap = null, steps = [.58, .8, 1] } = {}) {
  STYLE.mode = mode; STYLE.remap = remap;
  if (mode !== 'std') {
    // (a highlight band above 1 needs a float texture — 빛 받는 곳 하이라이트 시험, 10/22)
    // (always float: the 후보정 panel can lift the top band above 1 live — style.js SHADE)
    const t = new THREE.DataTexture(new Float32Array(steps), steps.length, 1, THREE.RedFormat, THREE.FloatType);
    t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
    STYLE.grad = t;
  }
}

export function mat(color, o) {
  o = o || {};
  const rough = o.rough ?? 0.82, metal = o.metal ?? 0, em = o.emissive ?? null, ei = o.ei ?? 1;
  const op = o.opacity ?? 1, side = o.side ?? THREE.FrontSide, map = o.map ?? null, rim = o.rim ?? 0.34;
  const key = [STYLE.mode, color, rough, metal, em, ei, op, side, map ? map.uuid : '', rim].join('|');
  // (a textured one goes from the cache two scenes after it was last asked for — purgeGeo)
  if (map) MUSE.set(key, GEN);
  let m = MAT.get(key);
  if (m) return m;
  if (STYLE.mode !== 'std') {
    const c = STYLE.remap ? STYLE.remap(color) : color;
    m = new THREE.MeshToonMaterial({ color: c, gradientMap: STYLE.grad, transparent: op < 1, opacity: op, side, map });
    if (op < 1) m.depthWrite = false;
    if (em) { m.emissive = new THREE.Color(STYLE.remap ? STYLE.remap(em) : em); m.emissiveIntensity = ei * .6; }
    MAT.set(key, m);
    return m;
  }
  m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, transparent: op < 1, opacity: op, side, map });
  if (op < 1) m.depthWrite = false;
  if (em) { m.emissive = new THREE.Color(em); m.emissiveIntensity = ei; }
  if (rim > 0) rimify(m, rim);
  MAT.set(key, m);
  return m;
}

export function mesh(g, m, { cast = true, recv = true } = {}) {
  const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = recv; return o;
}
export function rbox(w, h, d, color, r = 0.05, o) {
  r = Math.min(r, Math.min(w, h, d) * 0.45);
  const g = geo(`rb|${w}|${h}|${d}|${r.toFixed(4)}`, () => r > 0.004 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d));
  return mesh(g, mat(color, o));
}
export function sph(r, color, o, ws = 22, hs = 16) {
  return mesh(geo(`sp|${r}|${ws}|${hs}`, () => new THREE.SphereGeometry(r, ws, hs)), mat(color, o));
}
export function hemi(r, color, o) { // dome, flat side down
  return mesh(geo(`hm|${r}`, () => new THREE.SphereGeometry(r, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2)), mat(color, o));
}
export function cyl(rt, rb, h, color, o, seg = 22, open = false) {
  return mesh(geo(`cy|${rt}|${rb}|${h}|${seg}|${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)), mat(color, o));
}
export function tor(R, t, color, o, arc = Math.PI * 2, rs = 12, ts = 28) {
  return mesh(geo(`to|${R}|${t}|${arc}|${rs}|${ts}`, () => new THREE.TorusGeometry(R, t, rs, ts, arc)), mat(color, o));
}
export function cone(r, h, color, o, seg = 18) {
  return mesh(geo(`co|${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg)), mat(color, o));
}
export function cap(r, len, color, o) {
  return mesh(geo(`ca|${r}|${len}`, () => new THREE.CapsuleGeometry(r, len, 6, 14)), mat(color, o));
}
export function disc(r, color, o) {
  return mesh(geo(`di|${r}`, () => new THREE.CircleGeometry(r, 24)), mat(color, o), { cast: false, recv: false });
}
export function plane(w, h, m) {
  return mesh(geo(`pl|${w}|${h}`, () => new THREE.PlaneGeometry(w, h)), m, { cast: false, recv: true });
}
export function put(o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = null) {
  o.position.set(x, y, z); o.rotation.set(rx, ry, rz);
  if (s != null) { if (typeof s === 'number') o.scale.setScalar(s); else o.scale.set(s[0], s[1], s[2]); }
  return o;
}
export function grp(...kids) { const g = new THREE.Group(); for (const k of kids) g.add(k); return g; }

// Star / heart shapes for extrusions
export function starShape(R = 0.14, r = 0.065, n = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R;
    const x = Math.cos(a) * rr, y = -Math.sin(a) * rr;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath(); return s;
}
export function heartShape(sz = 0.12) {
  const s = new THREE.Shape(), k = sz / 10;
  s.moveTo(0, -7 * k);
  s.bezierCurveTo(-2 * k, -5 * k, -10 * k, -1 * k, -10 * k, 4 * k);
  s.bezierCurveTo(-10 * k, 9 * k, -3 * k, 10 * k, 0, 5 * k);
  s.bezierCurveTo(3 * k, 10 * k, 10 * k, 9 * k, 10 * k, 4 * k);
  s.bezierCurveTo(10 * k, -1 * k, 2 * k, -5 * k, 0, -7 * k);
  return s;
}
export function extrude(key, shape, depth, color, o) {
  return mesh(geo(`ex|${key}`, () => {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * 0.45, bevelSize: depth * 0.45, bevelSegments: 3, curveSegments: 10 });
    g.center(); return g;
  }), mat(color, o));
}

// Canvas textures (wallpaper, floors, labels)
export function canvasTex(w, h, draw, { repeat = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
// a soft disc of one colour that fades out in alpha (a glow, a blob shadow), worked out pixel by pixel: Safari dithers a
// canvas gradient and stores it premultiplied, so a canvas-painted fade came back with red / green / black specks in its
// nearly clear edge (10/20 실폰 9판). alpha(r): r = the distance from (cx, cy) in half-widths (1 = the texture's side;
// a row of data is a row up, v — not a canvas row down).
export function fadeDisc(N, hex, alpha, { cx = .5, cy = .5 } = {}) {
  const d = new Uint8Array(N * N * 4), n = parseInt(hex.slice(1), 16), R = n >> 16 & 255, G = n >> 8 & 255, B = n & 255;   // (the sRGB bytes as written)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const r = Math.hypot((i + .5) / N - cx, (j + .5) / N - cy) * 2, k = (j * N + i) * 4;
    d[k] = R; d[k + 1] = G; d[k + 2] = B; d[k + 3] = Math.round(Math.max(0, Math.min(1, alpha(r))) * 255);
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export function shade(hex, amt) {
  const c = new THREE.Color(hex);
  const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt)));
  return '#' + c.getHexString();
}
// (10/29 실폰 "서랍 같은 거 열었는데 안에 막혀 있는 거 많음") hollow a solid body, its outside untouched: cutFace drops the
// flat face that a lid or door covers (the rounded edges round it stay), liner lines the hole with an open box seen from inside
export function cutFace(g, axis = 'y', sign = 1) {
  const P = g.attributes.position, A = 'xyz'.indexOf(axis), src = g.index ? Array.from(g.index.array) : [...Array(P.count).keys()], keep = [];
  let m = -Infinity; for (let i = 0; i < P.count; i++) m = Math.max(m, sign * P.getComponent(i, A));
  for (let t = 0; t < src.length; t += 3) if (![0, 1, 2].every(j => sign * P.getComponent(src[t + j], A) > m - 1e-4)) keep.push(src[t], src[t + 1], src[t + 2]);
  const out = g.clone(); out.setIndex(keep); out.clearGroups(); return out;
}
export function liner(w, h, d, axis = 'y', sign = 1) {
  const g = new THREE.BoxGeometry(w, h, d), gr = g.groups['xyz'.indexOf(axis) * 2 + (sign > 0 ? 0 : 1)], I = g.index.array, N = g.attributes.normal, keep = [];
  for (let t = 0; t < I.length; t += 3) if (t < gr.start || t >= gr.start + gr.count) keep.push(I[t], I[t + 2], I[t + 1]);
  for (let i = 0; i < N.count; i++) N.setXYZ(i, -N.getX(i), -N.getY(i), -N.getZ(i));
  g.setIndex(keep); g.clearGroups(); return g;
}
// (10/29 사용자 "책상 서랍 열리는 데 구멍 좀 뚫어라") holeFace: rect holes [u0, u1, v0, v1] cut out of the flat face (axis, sign) of a
// solid body — only the face inside each rect goes, so the outside stays the same triangle for triangle; a drawer front covers
// the hole when shut and a liner lines it. u, v = the other two axes in xyz order (axis 'z': x, y)
export function holeFace(g, holes, axis = 'z', sign = 1) {
  const s = g.index ? g.toNonIndexed() : g.clone(), A = 'xyz'.indexOf(axis), [U, V] = [0, 1, 2].filter(i => i !== A);
  const P = s.attributes.position, N = s.attributes.normal, UV = s.attributes.uv;
  let m = -Infinity; for (let i = 0; i < P.count; i++) m = Math.max(m, sign * P.getComponent(i, A));
  const vert = i => [P.getX(i), P.getY(i), P.getZ(i), N ? N.getX(i) : 0, N ? N.getY(i) : 0, N ? N.getZ(i) : 0, UV ? UV.getX(i) : 0, UV ? UV.getY(i) : 0];
  const lerp = (a, b, t) => a.map((x, k) => x + (b[k] - x) * t);
  const clip = (poly, k, c, keepLess) => {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], ia = keepLess ? a[k] <= c : a[k] >= c, ib = keepLess ? b[k] <= c : b[k] >= c;
      if (ia) out.push(a);
      if (ia !== ib) out.push(lerp(a, b, (c - a[k]) / (b[k] - a[k])));
    }
    return out.length >= 3 ? out : null;
  };
  const tris = [];
  for (let t = 0; t < P.count; t += 3) {
    let polys = [[vert(t), vert(t + 1), vert(t + 2)]];
    if ([0, 1, 2].every(j => sign * P.getComponent(t + j, A) > m - 1e-4)) for (const [u0, u1, v0, v1] of holes) {
      const next = [];
      for (const p of polys) {
        const a = clip(p, U, u0, true), b = clip(p, U, u1, false), mid = clip(p, U, u0, false), mid2 = mid && clip(mid, U, u1, true);
        const c = mid2 && clip(mid2, V, v0, true), d = mid2 && clip(mid2, V, v1, false);
        for (const q of [a, b, c, d]) if (q) next.push(q);
      }
      polys = next;
    }
    for (const p of polys) for (let i = 1; i < p.length - 1; i++) tris.push(p[0], p[i], p[i + 1]);
  }
  const out = new THREE.BufferGeometry(), f = (o, n) => new THREE.BufferAttribute(new Float32Array(tris.flatMap(v => v.slice(o, o + n))), n);
  out.setAttribute('position', f(0, 3)); if (N) out.setAttribute('normal', f(3, 3)); if (UV) out.setAttribute('uv', f(6, 2));
  return out;
}
export function inward(g) { const I = g.index.array, N = g.attributes.normal; for (let t = 0; t < I.length; t += 3) { const v = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = v; } for (let i = 0; i < N.count; i++) N.setXYZ(i, -N.getX(i), -N.getY(i), -N.getZ(i)); return g; }
// the rest of a rect [x0, x1, y0, y1] once a hole is taken out of it, as rects; windowFace: a face (w × h, centre 0, front at
// z = 0) with a hole, made of t-deep strips that stand where the cut face was
export function minusRect([x0, x1, y0, y1], [a, b, c, d]) {
  if (b <= x0 || a >= x1 || d <= y0 || c >= y1) return [[x0, x1, y0, y1]];
  const m = Math.max(y0, c), n = Math.min(y1, d);
  return [[x0, x1, y0, c], [x0, x1, d, y1], [x0, a, m, n], [b, x1, m, n]].filter(r => r[1] - r[0] > 1e-4 && r[3] - r[2] > 1e-4);
}
// (hole may be a list of holes — 10/29 drawers over a cupboard)
export function windowFace(w, h, hole, t = .02) {
  const P = (Array.isArray(hole[0]) ? hole : [hole]).reduce((R, q) => R.flatMap(r => minusRect(r, q)), [[-w / 2, w / 2, -h / 2, h / 2]]).map(([a, b, c, d]) => new THREE.BoxGeometry(b - a, d - c, t).translate((a + b) / 2, (c + d) / 2, -t / 2));
  return mergeGeometries(P);
}
// Mark every mesh under root for picking.
export function tag(root, data) { root.traverse(o => { if (o.isMesh) Object.assign(o.userData, data); }); return root; }
// Soft blob shadow (no shadow-map cost) for characters and props that move every frame.
let _blobTex = null;
export function blobShadow(r = 0.4, opacity = 0.28) {
  if (!_blobTex) _blobTex = fadeDisc(64, '#3c1e46', r => 1 - Math.max(0, r - 1 / 16) / (15 / 16));
  const m = new THREE.MeshBasicMaterial({ map: _blobTex, transparent: true, opacity, depthWrite: false });
  const p = new THREE.Mesh(geo('blob', () => new THREE.PlaneGeometry(1, 1)), m);
  p.rotation.x = -Math.PI / 2; p.scale.set(r * 2, r * 2, 1); p.position.y = 0.012; p.renderOrder = 1;
  return p;
}

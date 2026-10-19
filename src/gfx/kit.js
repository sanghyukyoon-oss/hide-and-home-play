// Shared geometry/material kit. Everything is procedural: rounded boxes, spheres, capsules, soft rim light.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
export function geo(key, make) { let g = GEO.get(key); if (!g) { g = make(); GEO.set(key, g); } USED.set(key, GEN); return g; }
export function purgeGeo() {
  GEN++;
  for (const [k, g] of GEO) if ((USED.get(k) ?? -9) < GEN - 2) { g.dispose(); GEO.delete(k); USED.delete(k); }
  for (const m of TEXCACHES) for (const [k, e] of m) if (e.gen < GEN - 2) { e.t.dispose(); m.delete(k); }
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
    const d = new Uint8Array(steps.map(v => Math.round(v * 255)));
    const t = new THREE.DataTexture(d, steps.length, 1, THREE.RedFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
    STYLE.grad = t;
  }
}

export function mat(color, o) {
  o = o || {};
  const rough = o.rough ?? 0.82, metal = o.metal ?? 0, em = o.emissive ?? null, ei = o.ei ?? 1;
  const op = o.opacity ?? 1, side = o.side ?? THREE.FrontSide, map = o.map ?? null, rim = o.rim ?? 0.34;
  const key = [STYLE.mode, color, rough, metal, em, ei, op, side, map ? map.uuid : '', rim].join('|');
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
// Mark every mesh under root for picking.
export function tag(root, data) { root.traverse(o => { if (o.isMesh) Object.assign(o.userData, data); }); return root; }
// Soft blob shadow (no shadow-map cost) for characters and props that move every frame.
let _blobTex = null;
export function blobShadow(r = 0.4, opacity = 0.28) {
  if (!_blobTex) _blobTex = canvasTex(64, 64, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(60,30,70,1)'); g.addColorStop(1, 'rgba(60,30,70,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const m = new THREE.MeshBasicMaterial({ map: _blobTex, transparent: true, opacity, depthWrite: false });
  const p = new THREE.Mesh(geo('blob', () => new THREE.PlaneGeometry(1, 1)), m);
  p.rotation.x = -Math.PI / 2; p.scale.set(r * 2, r * 2, 1); p.position.y = 0.012; p.renderOrder = 1;
  return p;
}

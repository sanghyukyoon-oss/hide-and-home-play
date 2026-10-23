// 공원·캠프 새 맵 공용 키트 (10/23 — 45 별 지붕 밤 놀이터 · 49 소풍 잔디 언덕 · 55 반딧불 계곡 · 56 개울가 징검다리 캠핑 · 58 흔들다리 숲).
// 사용자 기준(_handoff/redo-18to33-1023.md): 떠 있는 네모 바닥 X → 둥글고 불규칙한 작은 섬(두께 있는 층진 받침), 텍스처 많이(풀결·나무결·
// 돌·천·물결), 1~10판처럼 덩어리 큰 귀여운 모델, 큰 면은 순하게·작은 것만 포인트 색.
//   mc(key, fn)        여러 조각을 꼭짓점 색 한 덩어리로(외곽선이 잘 나옴) — trail-props.js와 같은 방식
//   mt(key, tex, fn)   + 회색 질감 하나를 곱해서(나무결·돌·풀·천·물결) — uv: { w: s } 놓인 자리 기준 s m마다 한 번
//   TX.grass() …       회색 질감(색은 꼭짓점 색이 정함 — 흑백 판에서도 결이 남음)
//   blobOutline        둥근 네모에 물결을 얹은 섬 가장자리 [[x, z]…] (방 좌표)
//   island(f, o)       섬 받침 조각: 층진 옆면(흙·돌·풀 테), 윗면(풀결), 가장자리 풀·돌, 길·개울은 o.decor로 — 방 바닥판은 layout.hideFloor로 숨김
//   firefly(f, …)      반딧불 점빛(한 메시, 6번/초만 움직임 — 부분 다시 그리기가 한 상자만)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { mesh, geo, canvasTex, texCache, STYLE } from './kit.js';
import { rng } from '../util.js';

export const PI = Math.PI, HP = PI / 2;
export const G = {
  box: (w, h, d, r = .02, seg = 1) => { r = Math.min(r, Math.min(w, h, d) * .45); return r > .004 ? new RoundedBoxGeometry(w, h, d, seg, r) : new THREE.BoxGeometry(w, h, d); },
  pbox: (w, h, d) => new THREE.BoxGeometry(w, h, d),
  sph: (r, ws = 10, hs = 8) => new THREE.SphereGeometry(r, ws, hs),
  dome: (r, ws = 16, hs = 5) => new THREE.SphereGeometry(r, ws, hs, 0, PI * 2, 0, HP),
  cyl: (rt, rb, h, seg = 14, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open),
  cone: (r, h, seg = 8) => new THREE.ConeGeometry(r, h, seg),
  cap: (r, len, cs = 2, rs = 6) => new THREE.CapsuleGeometry(r, len, cs, rs),
  tor: (R, t, arc = PI * 2, rs = 5, ts = 20) => new THREE.TorusGeometry(R, t, rs, ts, arc),
  ext: (shape, depth, bevel = 0, curve = 6) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: curve }),
  // a flat shape lying on the ground ([[x, z]…] in room coordinates), from y to y + h
  slab: (pts, h, bevel = 0) => { const g = G.ext(shapeOf(pts), h, bevel, 4); g.rotateX(-HP); return g; },
  // a lumpy boulder (the same seed gives the same stone)
  rock: (seed, lump = .16, ws = 12, hs = 8) => geo('pc-rock|' + seed + '|' + lump + '|' + ws, () => {
    let g = new THREE.SphereGeometry(1, ws, hs); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4);
    const p = g.attributes.position, r = rng(seed * 7 + 3);
    for (let i = 0; i < p.count; i++) { const s = 1 - lump / 2 + r() * lump; p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, p.getZ(i) * s); }
    g.computeVertexNormals(); return g;
  }),
};
export function shapeOf(pts) { const s = new THREE.Shape(); s.moveTo(pts[0][0], -pts[0][1]); for (const [x, z] of pts.slice(1)) s.lineTo(x, -z); s.closePath(); return s; }
const xf = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(s[0], s[1], s[2]));
const tubeM = (a, b) => { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length();
  return [L, new THREE.Matrix4().compose(A.clone().add(Bv).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1))]; };
const tint = hex => (STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(hex) : hex);
function paint(c, color) {
  const cc = new THREE.Color(tint(color)), n = c.attributes.position.count, a = new Float32Array(n * 3), nr = c.attributes.normal;
  for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; }
  c.setAttribute('color', new THREE.BufferAttribute(a, 3));
}
const VM = {};
function vmat() {
  const k = STYLE.mode;
  return VM[k] || (VM[k] = k !== 'std' ? new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: STYLE.grad })
    : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .82 }));
}
const VTM = {};
function vtmat(map) {
  const k = STYLE.mode + '|' + map.uuid;
  if (!VTM[k]) map.addEventListener('dispose', () => { delete VTM[k]; });
  return VTM[k] || (VTM[k] = STYLE.mode !== 'std' ? new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, map, gradientMap: STYLE.grad })
    : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, map, roughness: .85 }));
}
function planarUV(g, s) {
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [u, v] = ay >= ax && ay >= az ? [p.getX(i), p.getZ(i)] : ax >= az ? [p.getZ(i), p.getY(i)] : [p.getX(i), p.getY(i)];
    uv[i * 2] = u / s; uv[i * 2 + 1] = v / s;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
function collect(fn, keepUV) {
  const list = [];
  const addM = (src, m, color, uv) => {
    const c = src.index ? src.toNonIndexed() : src.clone();
    if (!c.attributes.normal) c.computeVertexNormals();
    for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && !(keepUV && k === 'uv')) c.deleteAttribute(k);
    if (keepUV) {
      if (typeof uv === 'number') planarUV(c, uv);
      c.applyMatrix4(m);
      if (uv == null || typeof uv === 'object' && uv.w) planarUV(c, uv?.w || .4);
      if (!c.attributes.uv) planarUV(c, .4);
    } else c.applyMatrix4(m);
    paint(c, color); list.push(c);
  };
  const add = (src, color, x, y, z, rx, ry, rz, s, uv) => addM(src, xf(x, y, z, rx, ry, rz, s), color, uv);
  const tube = (a, b, r, color, seg = 6, r2 = r, uv) => { const [L, m] = tubeM(a, b); addM(new THREE.CylinderGeometry(r2, r, L, seg), m, color, uv); };
  fn({ add, addM, tube });
  return list;
}
// many pieces, many colours, ONE mesh (put every colour the piece uses in the key)
export function mc(key, fn) {
  const g = geo('pcmc|' + STYLE.mode + '|' + key, () => { const out = mergeGeometries(collect(fn, false), false); out.name = key; return out; });
  return mesh(g, vmat());
}
// the same, printed with one shared greyscale texture
export function mt(key, map, fn) {
  const g = geo('pcmt|' + STYLE.mode + '|' + key, () => { const out = mergeGeometries(collect(fn, true), false); out.name = key; return out; });
  return mesh(g, vtmat(map));
}

// ── greyscale textures (white = the piece's own colour; darker = grain, joints, blades) ─────────────────────────
const TEXC = texCache();
const gtex = (key, N, draw) => TEXC.get('pc|' + key, () => { const t = canvasTex(N, N, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); draw(x, w, h, rng(key.length * 31 + 7)); }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t; });
export const TX = {
  // short grass blades in two tones and a few clover dots
  grass: () => gtex('grass', 256, (x, w, h, r) => {
    for (let i = 0; i < 900; i++) { const px = r() * w, py = r() * h, L = 4 + r() * 6, a = -HP + (r() - .5) * .9; x.strokeStyle = r() < .5 ? 'rgba(70,90,40,.22)' : 'rgba(255,255,230,.35)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke(); }
    for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(60,80,40,.16)'; x.beginPath(); x.arc(r() * w, r() * h, 3 + r() * 4, 0, 7); x.fill(); }
  }),
  // packed earth: soft blotches and small pebbles
  dirt: () => gtex('dirt', 256, (x, w, h, r) => {
    for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(90,60,40,${.05 + r() * .07})`; x.beginPath(); x.ellipse(r() * w, r() * h, 8 + r() * 22, 5 + r() * 12, r() * 3, 0, 7); x.fill(); }
    for (let i = 0; i < 160; i++) { x.fillStyle = r() < .5 ? 'rgba(255,250,240,.5)' : 'rgba(80,55,40,.3)'; x.beginPath(); x.arc(r() * w, r() * h, .8 + r() * 2.2, 0, 7); x.fill(); }
  }),
  // bark: long vertical furrows (v along the trunk)
  bark: () => gtex('bark', 128, (x, w, h, r) => {
    for (let i = 0; i < 26; i++) { const px = r() * w; x.strokeStyle = `rgba(60,35,25,${.25 + r() * .25})`; x.lineWidth = 1.5 + r() * 2.5; x.beginPath(); x.moveTo(px, 0); for (let y = 0; y <= h; y += 16) x.lineTo(px + (r() - .5) * 6, y); x.stroke(); }
    for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(255,240,220,.25)'; x.fillRect(r() * w, r() * h, 2, 6 + r() * 8); }
  }),
  // planks: boards along u with grain and gaps
  plank: () => gtex('plank', 256, (x, w, h, r) => {
    const n = 4, bh = h / n;
    for (let k = 0; k < n; k++) {
      x.fillStyle = `rgba(120,80,50,${r() * .08})`; x.fillRect(0, k * bh, w, bh);
      for (let i = 0; i < 9; i++) { const y = k * bh + 4 + r() * (bh - 8); x.strokeStyle = 'rgba(110,70,40,.18)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * .3, y + (r() - .5) * 6, w * .6, y + (r() - .5) * 6, w, y); x.stroke(); }
      x.fillStyle = 'rgba(70,45,30,.45)'; x.fillRect(0, k * bh, w, 2.5);
      const kx = r() * w; x.fillStyle = 'rgba(90,55,35,.3)'; x.beginPath(); x.ellipse(kx, k * bh + bh / 2, 5, 3, 0, 0, 7); x.fill();
    }
  }),
  // stone: soft speckle and a few cracks
  stone: () => gtex('stone', 128, (x, w, h, r) => {
    for (let i = 0; i < 260; i++) { x.fillStyle = r() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(60,55,70,.18)'; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(60,55,70,.25)'; x.lineWidth = 1; x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (r() - .5) * 26; py += (r() - .5) * 26; x.lineTo(px, py); } x.stroke(); }
  }),
  // woven cloth: a fine cross weave
  cloth: () => gtex('cloth', 64, (x, w, h) => { for (let i = 0; i < w; i += 4) { x.fillStyle = 'rgba(80,60,60,.10)'; x.fillRect(i, 0, 2, h); x.fillRect(0, i, w, 2); } }),
  // gingham: the picnic mat's check (white = the mat's colour, the grey bands make the darker checks)
  check: () => gtex('check', 64, (x, w, h) => { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 0, w / 2, h); x.fillRect(0, 0, w, h / 2); x.fillStyle = 'rgba(0,0,0,.1)'; x.fillRect(0, 0, w / 2, h / 2); }),
  // water: soft ripple lines and glints
  water: () => gtex('water', 256, (x, w, h, r) => {
    for (let i = 0; i < 70; i++) { const px = r() * w, py = r() * h, L = 10 + r() * 30; x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.5 + r() * 1.5; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + L / 2, py - 3, px + L, py); x.stroke(); }
    for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(40,70,110,.12)'; x.beginPath(); x.ellipse(r() * w, r() * h, 12 + r() * 20, 3 + r() * 4, 0, 0, 7); x.fill(); }
  }),
  // leaves: a crown's clumped foliage
  leaf: () => gtex('leaf', 128, (x, w, h, r) => {
    for (let i = 0; i < 140; i++) { const px = r() * w, py = r() * h, s = 3 + r() * 5; x.fillStyle = r() < .55 ? 'rgba(40,70,30,.2)' : 'rgba(255,255,220,.3)'; x.beginPath(); x.ellipse(px, py, s, s * .6, r() * 3, 0, 7); x.fill(); }
  }),
};

// ── the island ──────────────────────────────────────────────────────────────────────────────────────────────
// the map's rectangle (half sizes hx, hz) grown by `pad`, corners rounded by `round`, and a soft wobble along it so the
// shore never runs straight; o.bulge: [[angle, amount, width]] — a headland / a bay here and there
export function blobOutline(hx, hz, { pad = .7, round = 1.6, amp = .22, seed = 3, n = 96, bulge = [] } = {}) {
  const X = hx + pad, Z = hz + pad, rc = Math.min(round, X - .2, Z - .2), r = rng(seed * 13 + 5);
  const ph = [r() * 6.3, r() * 6.3, r() * 6.3], out = [];
  for (let k = 0; k < n; k++) {
    const a = k / n * PI * 2, c = Math.cos(a), s = Math.sin(a);
    // the rounded rectangle's edge along this direction (superellipse-ish by marching)
    let lo = 0, hi = Math.hypot(X, Z) + 1;
    for (let it = 0; it < 24; it++) { const m = (lo + hi) / 2, px = Math.abs(c * m), pz = Math.abs(s * m), dx = Math.max(0, px - (X - rc)), dz = Math.max(0, pz - (Z - rc)); if (px <= X && pz <= Z && Math.hypot(dx, dz) <= rc) lo = m; else hi = m; }
    let R = lo + amp * (.55 * Math.sin(a * 3 + ph[0]) + .3 * Math.sin(a * 5 + ph[1]) + .15 * Math.sin(a * 9 + ph[2]));
    for (const [ba, bm, bw] of bulge) { let d = Math.abs(((a - ba) % (PI * 2) + PI * 3) % (PI * 2) - PI); if (d < bw) R += bm * (.5 + .5 * Math.cos(d / bw * PI)); }
    out.push([c * R, s * R]);
  }
  return out;
}
export const scaleOutline = (pts, k) => pts.map(([x, z]) => { const L = Math.hypot(x, z) || 1; return [x + x / L * k, z + z / L * k]; });
// island(f, o): o.pts (outline), o.top (grass colour), o.topTex ('grass' | 'dirt'), o.layers [{ h, color, k (out), stones }],
// o.lip (grass lip colour), o.rim (true: tufts and pebbles along the shore), o.decor({ add }) / o.decorTex({ add }) extra flat bits
export function island(f, o) {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];
  const pts = o.pts, key = o.key, top = o.top || '#9fd27a', r = rng(o.seed || 9);
  const layers = o.layers || [{ h: .22, color: '#a07650', k: 0 }, { h: .26, color: '#c2b2a0', k: -.03, stones: true }, { h: .2, color: '#7d5a40', k: -.12 }];
  // the side bands, top down
  f.add(mt(key + '-sides', TX.stone(), ({ add }) => {
    // (the bevel grows a slab by its size at both ends: the top band stops 2.5 cm under the cap's top so it never shows through
    // the grass or the creek's water)
    let y = -.045;
    for (const L of layers) { y -= L.h; add(G.slab(scaleOutline(pts, L.k || 0), L.h, .02), L.color, 0, y, 0, 0, 0, 0, 1, { w: .5 }); }
    // stones set into the stone band
    let y2 = -.045 - layers[0].h; const sb = layers.find(L => L.stones);
    if (sb) for (let i = 0; i < pts.length; i += 2) {
      const [x, z] = pts[i], L = Math.hypot(x, z) || 1, s = .07 + r() * .06;
      add(G.rock(i % 7 + 1, .25, 8, 6), r() < .5 ? sb.color : '#d8cfc4', x + x / L * .015, y2 - .07 - r() * .12, z + z / L * .015, 0, r() * 3, 0, [s * 1.3, s, s * .7], { w: .3 });
    }
  }));
  // the top: one textured cap (it is the floor: taps land on it, the camera frames by it)
  const capT = o.topTex === 'dirt' ? TX.dirt() : TX.grass();
  const cap = mt(key + '-top', capT, ({ add }) => { add(G.slab(pts, .03, 0), top, 0, -.029, 0, 0, 0, 0, 1, { w: o.topTex === 'dirt' ? 1.6 : 1.3 }); });
  cap.userData.floor = true; cap.receiveShadow = true; f.add(cap);
  if (o.decorTex) f.add(mt(key + '-paths', o.decorTexMap || TX.dirt(), o.decorTex));
  // the lip: a soft rounded roll of grass all round the edge, then tufts and pebbles on the shore
  f.add(mc(key + '-lip', ({ add, tube }) => {
    const lip = o.lip || top;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; tube([a[0], -.03, a[1]], [b[0], -.03, b[1]], .05, lip, 6); add(G.sph(.05, 6, 4), lip, a[0], -.03, a[1]); }
    if (o.rim !== false) for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i], L = Math.hypot(x, z) || 1, ix = x - x / L * .14, iz = z - z / L * .14;
      if (o.skip?.some(([sx, sz, sr]) => Math.hypot(ix - sx, iz - sz) < sr)) continue;
      if (i % 3 === 0) tuft(add, ix, iz, .8 + r() * .5, o.tuft || '#6fb85a', o.tuft2 || '#8fcf6a');
      else if (i % 7 === 1) add(G.rock(i % 5 + 2, .2, 9, 6), o.pebble || '#cfc7bd', ix, .03, iz, 0, r() * 3, 0, [.11, .07, .09]);
      else if (i % 11 === 5) flower(add, ix, iz, ['#ffffff', '#ffd23f', '#ffb3cf', '#b9a6ff'][i % 4]);
    }
    o.decor?.({ add, tube });
  }));
}
// a ribbon along a polyline, width w (flat, for water and banks)
export function ribbon(line, w, y, k = 6) {
  const pts = [], L = [], R = [];
  for (let i = 0; i < line.length - 1; i++) for (let s = 0; s < k; s++) { const t = s / k, a = line[i], b = line[i + 1]; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  pts.push(line.at(-1));
  for (let i = 0; i < pts.length; i++) {
    const p = pts[Math.max(0, i - 1)], q = pts[Math.min(pts.length - 1, i + 1)], dx = q[0] - p[0], dz = q[1] - p[1], n = Math.hypot(dx, dz) || 1;
    const ww = w * (.85 + .15 * Math.sin(i * 1.7)), nx = -dz / n * ww / 2, nz = dx / n * ww / 2;
    L.push([pts[i][0] + nx, pts[i][1] + nz]); R.push([pts[i][0] - nx, pts[i][1] - nz]);
  }
  const pos = [];
  // (each triangle wound counter-clockwise seen from above, so its face points up)
  const tri = (a, b, c) => { const cy = (b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1]); if (cy < 0) [b, c] = [c, b]; pos.push(a[0], y, a[1], b[0], y, b[1], c[0], y, c[1]); };
  for (let i = 0; i < pts.length - 1; i++) { tri(L[i], R[i], L[i + 1]); tri(L[i + 1], R[i], R[i + 1]); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  // (faces wound either way: make them point up)
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return { g, L, R, pts };
}

// a little clump of grass blades
export function tuft(add, x, z, s = 1, c1 = '#6fb85a', c2 = '#8fcf6a', y = 0) {
  for (let k = 0; k < 5; k++) { const a = k * 1.3; add(G.cone(.03 * s, (.14 + (k % 3) * .04) * s, 4), k % 2 ? c1 : c2, x + Math.cos(a) * .04 * s, y + (.07 + (k % 3) * .02) * s, z + Math.sin(a) * .03 * s, Math.sin(a) * .25, 0, Math.cos(a) * .25); }
}
// a small five-petal flower on a stalk
export function flower(add, x, z, c = '#ffffff', s = 1, y = 0) {
  add(G.cyl(.007 * s, .007 * s, .14 * s, 4), '#5fa45a', x, y + .07 * s, z);
  for (let k = 0; k < 5; k++) { const a = k * 1.256; add(G.sph(.026 * s, 6, 4), c, x + Math.cos(a) * .03 * s, y + .15 * s, z + Math.sin(a) * .03 * s, 0, 0, 0, [1, .5, 1]); }
  add(G.sph(.018 * s, 6, 4), c === '#ffd23f' ? '#ff9f40' : '#ffd23f', x, y + .158 * s, z);
}
// a round leafy bush of a few balls
export function bush(add, x, z, s = 1, c1 = '#6cbf5a', c2 = '#4fa64f', y = 0) {
  for (const [dx, dz, rr, c] of [[0, 0, .3, c1], [.24, .08, .22, c2], [-.22, .1, .21, c2], [.04, .22, .19, c1], [-.05, -.16, .2, c1]]) add(G.sph(rr * s, 12, 9), c, x + dx * s, y + rr * s * .85, z + dz * s, 0, 0, 0, [1, .88, 1]);
}
// a fern: a fan of long leaves
export function fern(add, x, z, s = 1, c1 = '#4fa64f', c2 = '#6cbf5a', y = 0) {
  for (let k = 0; k < 7; k++) { const g = G.cone(.06 * s, .5 * s, 4); g.rotateZ(.95); g.rotateY(k * .9); add(g, k % 2 ? c1 : c2, x, y + .16 * s, z, 0, 0, 0, [1, 1, .45]); }
}
// a pine of stacked cones on a short trunk
export function pine(add, x, z, s = 1, c1 = '#3f9d5f', c2 = '#2f8a52', trunk = '#9a5c3a') {
  add(G.cyl(.08 * s, .11 * s, .5 * s, 8), trunk, x, .25 * s, z);
  for (const [y, rr, h, c] of [[.45, .62, .75, c2], [.85, .5, .65, c1], [1.2, .36, .55, c2], [1.5, .22, .42, c1]]) add(G.cone(rr * s, h * s, 9), c, x, (y + h / 2) * s, z);
}

// ── fireflies: soft yellow-green dots drifting round a few places, one mesh, moved six times a second ────────
const FLY_GEO = new THREE.SphereGeometry(.04, 6, 4);
export function fireflies(f, places, { n = 22, color = '#e9ff8a', seed = 4 } = {}) {
  const r = rng(seed), m = new THREE.InstancedMesh(FLY_GEO, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .95, depthWrite: false }), n);
  const halo = new THREE.InstancedMesh(FLY_GEO, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .3, depthWrite: false }), n);
  const flies = [];
  for (let i = 0; i < n; i++) { const [px, pz, pr = .6, py = .7] = places[i % places.length]; flies.push({ x: px, z: pz, r: pr * (.3 + r() * .7), y: py * (.6 + r() * .8), a: r() * 6.3, sp: .25 + r() * .35, ph: r() * 6.3 }); }
  const M = new THREE.Matrix4(), S = new THREE.Vector3(), P = new THREE.Vector3(), Q = new THREE.Quaternion();
  const set = t => flies.forEach((q, i) => {
    const a = q.a + t * q.sp, b = Math.sin(t * 1.7 + q.ph), on = .55 + .45 * Math.max(0, Math.sin(t * 2.1 + q.ph * 3));
    P.set(q.x + Math.cos(a) * q.r, q.y + b * .12, q.z + Math.sin(a * 1.3) * q.r * .8);
    m.setMatrixAt(i, M.compose(P, Q, S.setScalar(on))); halo.setMatrixAt(i, M.compose(P, Q, S.setScalar(on * 3.2)));
  });
  set(0);
  for (const g of [m, halo]) { g.userData.noMerge = true; g.userData.noOcclude = true; g.castShadow = g.receiveShadow = false; g.layers.set(2); g.renderOrder = 3; g.frustumCulled = false; f.add(g); }
  let last = -1;
  f.tick = t => { const k = Math.floor(t * 6); if (k === last) return; last = k; set(k / 6); m.instanceMatrix.needsUpdate = halo.instanceMatrix.needsUpdate = true; };
  f.live = [...(f.live || []), m, halo];
}

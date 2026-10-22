// Draw-call diet: merge each furniture piece's static meshes (everything not under a moving part), each moving part
// and each item into as few meshes as possible. Plain-coloured meshes (no texture, opaque, no glow) of ANY colour go
// into one vertex-coloured mesh; textured or special ones merge per material. A piece stays one outline group either
// way (outlines are per furniture body / part / item), so nothing looks different, but a dense room draws a fraction of
// the meshes (and the outline ID pass draws them again, so every mesh saved counts twice).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { STYLE } from './kit.js';

const M = new THREE.Matrix4(), INV = new THREE.Matrix4();
const VM = {};
function vmat() {
  const k = STYLE.mode;
  return VM[k] || (VM[k] = k !== 'std'
    ? new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: STYLE.grad })
    : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .82 }));
}
const plain = m => !m.map && !m.transparent && m.side === THREE.FrontSide && (!m.emissive || m.emissive.getHex() === 0 || !m.emissiveIntensity) && (m.isMeshToonMaterial || m.isMeshStandardMaterial);

const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const MODE = QS.get('bake') || 'all';   // QA: off | body | all
// heat (2026-10-18, from GPT's exact-reindex experiment): merged meshes come out non-indexed, so every triangle corner is
// its own vertex and the GPU transforms each shared corner 3–6 times, in every pass (shadow, colour, IDs). Corners whose
// every attribute is bit-for-bit the same become one indexed vertex; triangles, their order and all values stay the same.
const REINDEX = QS.get('opt') !== '0' && QS.get('rx') !== '0';
export function bakeStatic(f, key = null, theme = null) {
  deFlush(f.group, f.parts, key && 'f:' + key, theme);
  if (MODE === 'off') return f;
  const moving = new Set(); for (const p of f.parts) for (const pv of p.pivots) moving.add(pv);
  for (const pv of f.live || []) moving.add(pv);   // (groups that move on their own: the gifts' turning bits — gift-props.js)
  bakeUnder(f.group, moving, { furn: f });
  // each moving part is rigid too: merge inside every pivot (pivots that are themselves meshes stay as they are)
  if (MODE === 'all') for (const p of f.parts) for (const pv of p.pivots) if (!pv.isMesh) bakeUnder(pv, new Set([...moving].filter(x => x !== pv)), { furn: f, part: p });
  if (MODE === 'all') for (const pv of f.live || []) {
    const p = f.parts.find(q => q.pivots.some(x => { for (let o = pv; o; o = o.parent) if (o === x) return true; return false; }));
    bakeUnder(pv, new Set([...moving].filter(x => x !== pv)), p ? { furn: f, part: p } : { furn: f });
  }
  return f;
}
// an item is one outline shape: merge it (before its pick proxy is attached)
export function bakeItem(g, key = null) { deFlush(g, [], key && 'i:' + key); if (MODE === 'all') bakeUnder(g, new Set(), {}); return g; }

// Flush faces: two pieces of one object whose faces lie in the same plane and overlap (a panel on a door, soil level
// with a pot rim, a lid flush with its jar) flicker against each other ("z-fighting"): the depth test can't tell which
// is in front, so the colours and the outline IDs speckle. Lift the smaller piece a hair off that face.
// A piece is one connected shape: a mesh, or one box inside a merged multi-colour mesh.
// The same build (type + options + theme) always gives the same pieces, so the result is remembered and replayed.
const LIFT = .006, TOL = .0015;
const PLANS = new WeakMap();   // theme object → Map(build key → plan)
const NO_THEME = {};
// perMesh: meshes with no furniture/part marker each draw their own outline (scenery), so any two of them count as different
export function deFlush(root, parts = [], key = null, theme = null, perMesh = false) {
  const t0 = performance.now();
  try {
    const meshes = []; root.traverse(o => { if (o.isMesh && !o.userData.proxy && o.geometry?.attributes?.position && !Array.isArray(o.material)) meshes.push(o); });
    if (!meshes.length) return 0;
    const sig = meshes.map(o => o.geometry.attributes.position.count).join(',');
    const th = theme || NO_THEME;
    let store = null;
    if (key) { store = PLANS.get(th); if (!store) PLANS.set(th, store = new Map()); }
    let plan = store?.get(key);
    if (!plan || plan.sig !== sig) { plan = planFlush(root, meshes, parts, perMesh); plan.sig = sig; store?.set(key, plan); }
    for (const [mi, list] of plan.byMesh) {
      const o = meshes[mi]; o.geometry = o.geometry.clone();
      const pos = o.geometry.attributes.position;
      for (const { d, verts } of list) for (const i of verts) pos.setXYZ(i, pos.getX(i) + d[0], pos.getY(i) + d[1], pos.getZ(i) + d[2]);
      pos.needsUpdate = true; o.geometry.computeBoundingBox(); o.geometry.computeBoundingSphere();
    }
    return plan.byMesh.size;
  } finally { globalThis.__dfMs = (globalThis.__dfMs || 0) + performance.now() - t0; }
}
function planFlush(root, meshes, parts, perMesh = false) {
  root.updateMatrixWorld(true);
  const pivots = new Set(); for (const p of parts) for (const pv of p.pivots) pivots.add(pv);
  const groupOf = o => { for (let p = o; p && p !== root; p = p.parent) { if (pivots.has(p)) return p; if (perMesh && (p.userData.og || p.userData.char)) return p.userData.og || p; } return perMesh ? o : root; };
  const pieces = [], B = new Map(), meshUF = [];
  let T = new Float64Array(4096 * 15), nt = 0;   // per triangle: piece, nx, ny, nz, d, dq, 9 world coords
  const e = new THREE.Vector3(), f = new THREE.Vector3(), n = new THREE.Vector3(), v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  meshes.forEach((o, mi) => {
    const g = o.geometry, pos = g.attributes.position, idx = g.index, nv = pos.count, cnt = idx ? idx.count : nv;
    const col = o.material.vertexColors ? g.attributes.color : null, m = o.material, two = m.side !== THREE.FrontSide;
    const look0 = (m.color ? m.color.getHex() : 0) + '|' + (m.map ? m.map.uuid : '') + '|' + (m.emissive ? m.emissive.getHex() : '');
    // connected pieces: vertices joined by triangles or by sharing a position
    const up = new Int32Array(nv); for (let i = 0; i < nv; i++) up[i] = i;
    const find = i => { while (up[i] !== i) { up[i] = up[up[i]]; i = up[i]; } return i; };
    const join = (a, b) => { a = find(a); b = find(b); if (a !== b) up[a] = b; };
    const at = new Map();
    // (only the same colour: two shapes of different colours whose points meet — a pail and the cement in it, both caps' centre
    // points on the axis — are still two pieces; joined, their flush tops were never lifted apart and flickered. ① 10/21 user
    // "여기는 면 겹치나 보다. 지글거림")
    for (let i = 0; i < nv; i++) {
      let k = ((Math.round(pos.getX(i) * 1000) + 8192) * 16384 + (Math.round(pos.getY(i) * 1000) + 8192)) * 16384 + (Math.round(pos.getZ(i) * 1000) + 8192);
      if (col) k = k + ':' + Math.round(col.getX(i) * 255) + '.' + Math.round(col.getY(i) * 255) + '.' + Math.round(col.getZ(i) * 255);
      const j = at.get(k); if (j === undefined) at.set(k, i); else join(i, j);
    }
    const I = idx ? idx.array : null;
    for (let t = 0; t + 2 < cnt; t += 3) { const a = I ? I[t] : t; join(a, I ? I[t + 1] : t + 1); join(a, I ? I[t + 2] : t + 2); }
    meshUF[mi] = { find, nv };
    const byRoot = new Map(), gr = groupOf(o), M = o.matrixWorld;
    for (let t = 0; t + 2 < cnt; t += 3) {
      const a = I ? I[t] : t, r = find(a);
      let pc = byRoot.get(r);
      if (pc === undefined) {
        const c = col ? ':' + Math.round(col.getX(a) * 255) + '.' + Math.round(col.getY(a) * 255) + '.' + Math.round(col.getZ(a) * 255) : '';
        pc = pieces.length; byRoot.set(r, pc); pieces.push({ mi, root: r, g: gr, k: look0 + c, box: new THREE.Box3(), lift: [] });
      }
      for (let k = 0; k < 3; k++) { v[k].fromBufferAttribute(pos, I ? I[t + k] : t + k).applyMatrix4(M); pieces[pc].box.expandByPoint(v[k]); }
      e.subVectors(v[1], v[0]); f.subVectors(v[2], v[0]); n.crossVectors(e, f);
      const ar = n.length(); if (ar < 1e-6) continue; n.divideScalar(ar);
      if (n.y < -.25 && two === false) continue;    // the camera is always above: a down-facing front face never shows
      if (nt * 15 + 15 > T.length) { const T2 = new Float64Array(T.length * 2); T2.set(T); T = T2; }
      const b = nt * 15, d = n.dot(v[0]), dq = Math.round(d / TOL);
      T[b] = pc; T[b + 1] = n.x; T[b + 2] = n.y; T[b + 3] = n.z; T[b + 4] = d; T[b + 5] = dq;
      for (let k = 0; k < 3; k++) { T[b + 6 + k * 3] = v[k].x; T[b + 7 + k * 3] = v[k].y; T[b + 8 + k * 3] = v[k].z; }
      const nk = ((Math.round(n.x * 40) + 64) * 128 + (Math.round(n.y * 40) + 64)) * 128 + (Math.round(n.z * 40) + 64);
      const bk = nk * 4194304 + (dq + 2097152);
      let L = B.get(bk); if (!L) B.set(bk, L = []); L.push(nt);
      nt++;
    }
  });
  const byMesh = new Map();
  if (pieces.length < 2) return { byMesh };
  for (const P of pieces) { const s = P.box.getSize(n); P.vol = s.x * s.y * s.z + (s.x * s.y + s.y * s.z + s.x * s.z) * .01; P.box.expandByScalar(TOL); }
  const done = new Set(), stack = [], key3 = n => Math.round(n.x * 20) + ',' + Math.round(n.y * 20) + ',' + Math.round(n.z * 20);
  const ta = { n: new THREE.Vector3(), p: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, tb = { n: new THREE.Vector3(), p: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] };
  const load = (o, i) => { const b = i * 15; o.n.set(T[b + 1], T[b + 2], T[b + 3]); for (let k = 0; k < 3; k++) o.p[k].set(T[b + 6 + k * 3], T[b + 7 + k * 3], T[b + 8 + k * 3]); return o; };
  for (const [bk, L] of B) {
    const L2 = B.get(bk + 1);   // the next distance bucket (the previous one visits this one)
    for (let x = 0; x < L.length; x++) {
      const i = L[x], pa = T[i * 15], A = pieces[pa];
      const scan = j => {
        const pb = T[j * 15], C = pieces[pb];
        if (C === A || Math.abs(T[j * 15 + 4] - T[i * 15 + 4]) > TOL) return;
        if (A.k === C.k && A.g === C.g) return;                                 // same look, same outline: invisible
        if (T[i * 15 + 1] * T[j * 15 + 1] + T[i * 15 + 2] * T[j * 15 + 2] + T[i * 15 + 3] * T[j * 15 + 3] < .995) return;
        const pk = (pa < pb ? pa * 1e6 + pb : pb * 1e6 + pa) + ':' + bk; if (done.has(pk)) return;
        if (!A.box.intersectsBox(C.box)) return;
        if (overlap2(load(ta, i), load(tb, j)) < 1e-6) return;   // (any same-way overlap flickers: a curved piece's small triangles each overlap less than a cm² — ① 10/21)
        done.add(pk);
        const mover = A.vol <= C.vol ? A : C, base = mover === A ? C : A;
        stack.push([mover, base, ta.n.clone()]);
      };
      for (let y = x + 1; y < L.length; y++) scan(L[y]);
      if (L2) for (const j of L2) scan(j);
    }
  }
  // layers: a piece sits one step above whatever it lies on, so a sticker on a panel on a door ends up on top of both
  // (lifting both by the same amount would just make them flush again)
  for (let it = 0; it < 6; it++) {
    let changed = false;
    for (const [m, b, n] of stack) {
      const want = (b.lv?.get(key3(n)) || 0) + 1;
      m.lv = m.lv || new Map();
      if ((m.lv.get(key3(n)) || 0) < want) { m.lv.set(key3(n), want); m.ln = m.ln || new Map(); m.ln.set(key3(n), n); changed = true; }
    }
    if (!changed) break;
  }
  // the move, for that piece's vertices only, in the mesh's own space (applied to a copy of the geometry). Only the side
  // of the piece that faces each lift direction moves out: a piece lifted both ways (a disc flush with a door at its front
  // AND its back) grows a hair thicker instead of the two lifts cancelling out.
  const inv = new THREE.Matrix3(), wv = new THREE.Vector3(), c = new THREE.Vector3(), dv = new THREE.Vector3();
  for (const P of pieces) {
    if (!P.lv) continue;
    const o = meshes[P.mi], U = meshUF[P.mi], pos = o.geometry.attributes.position;
    inv.setFromMatrix4(o.matrixWorld).invert(); P.box.getCenter(c);
    const groups = new Map();
    for (let i = 0; i < U.nv; i++) {
      if (U.find(i) !== P.root) continue;
      wv.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).sub(c); dv.set(0, 0, 0);
      for (const [k, lv] of P.lv) { const n = P.ln.get(k); if (wv.dot(n) > -1e-5) dv.addScaledVector(n, LIFT * lv); }
      if (!dv.lengthSq()) continue;
      dv.applyMatrix3(inv);
      const gk = dv.x.toFixed(6) + ',' + dv.y.toFixed(6) + ',' + dv.z.toFixed(6);
      let gr = groups.get(gk); if (!gr) groups.set(gk, gr = { d: [dv.x, dv.y, dv.z], v: [] });
      gr.v.push(i);
    }
    let list = byMesh.get(P.mi); if (!list) byMesh.set(P.mi, list = []);
    for (const gr of groups.values()) list.push({ d: gr.d, verts: Uint32Array.from(gr.v) });
  }
  return { byMesh };
}
// area shared by two coplanar triangles (projected on their dominant axis)
function overlap2(t, u) {
  const n = t.n, ax = Math.abs(n.x) > Math.abs(n.y) ? (Math.abs(n.x) > Math.abs(n.z) ? 0 : 2) : (Math.abs(n.y) > Math.abs(n.z) ? 1 : 2);
  const pr = p => ax === 0 ? [p.y, p.z] : ax === 1 ? [p.x, p.z] : [p.x, p.y];
  const ccw = P => ((P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[1][1] - P[0][1]) * (P[2][0] - P[0][0])) >= 0 ? P : [P[0], P[2], P[1]];
  let poly = ccw(t.p.map(pr)); const clip = ccw(u.p.map(pr));
  for (let i = 0; i < 3 && poly.length; i++) {
    const c0 = clip[i], c1 = clip[(i + 1) % 3], out = [];
    const side = p => (c1[0] - c0[0]) * (p[1] - c0[1]) - (c1[1] - c0[1]) * (p[0] - c0[0]);
    for (let j = 0; j < poly.length; j++) {
      const p = poly[j], q = poly[(j + 1) % poly.length], sp = side(p), sq = side(q);
      if (sp >= 0) out.push(p);
      if ((sp >= 0) !== (sq >= 0)) { const k = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]); }
    }
    poly = out;
  }
  let s = 0; for (let j = 0; j < poly.length; j++) { const p = poly[j], q = poly[(j + 1) % poly.length]; s += p[0] * q[1] - q[0] * p[1]; }
  return Math.abs(s) / 2;
}

function bakeUnder(root, stop, tag) {
  root.updateMatrixWorld(true);
  INV.copy(root.matrixWorld).invert();
  const buckets = new Map();
  const visit = o => {
    if (stop.has(o)) return;
    if (o.isMesh && o !== root) {
      const g = o.geometry, m = o.material, u = o.userData;
      const ok = g?.attributes?.position && !Array.isArray(m) && !m.transparent && !u.noMerge && !u.proxy && !u.og && !o.isInstancedMesh && !o.isSkinnedMesh && !o.children.length;   // a mesh carrying anchors/children stays
      if (ok) {
        const sh = (o.castShadow ? 1 : 0) + '' + (o.receiveShadow ? 1 : 0);
        const sig = plain(m) && !g.attributes.color ? 'vc|' + sh
          : [m.uuid, g.index ? 'i' : 'n', Object.keys(g.attributes).sort().map(k => k + g.attributes[k].itemSize).join(','), sh].join('|');
        let list = buckets.get(sig); if (!list) buckets.set(sig, list = []);
        list.push(o);
      }
    }
    for (const c of o.children.slice()) visit(c);
  };
  visit(root);
  for (const [sig, list] of buckets) {
    if (list.length < 2) continue;
    const vc = sig.startsWith('vc|');
    const geos = list.map(o => {
      let g = o.geometry.clone();
      g.applyMatrix4(M.multiplyMatrices(INV, o.matrixWorld)); if (M.determinant() < 0) flip(g);
      if (!vc) return g;
      // vertex-colour form: position + normal + colour, non-indexed so every piece fits together
      if (g.index) g = g.toNonIndexed();
      if (!g.attributes.normal) g.computeVertexNormals();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      for (const k of Object.keys(g.morphAttributes || {})) delete g.morphAttributes[k];
      const c = o.material.color, n = g.attributes.position.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.clearGroups();
      return g;
    });
    let merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    if (!merged) continue;
    if (REINDEX) merged = reindexExact(merged);
    const mesh = new THREE.Mesh(merged, vc ? vmat() : list[0].material);
    mesh.castShadow = list[0].castShadow; mesh.receiveShadow = list[0].receiveShadow;
    Object.assign(mesh.userData, tag, { baked: true });
    for (const o of list) o.parent?.remove(o);
    root.add(mesh);
  }
}

// a mirrored transform turns triangles inside out; swap winding so they still face out
function flip(g) {
  if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; } g.index.needsUpdate = true; return; }
  const n = g.attributes.position.count;
  for (const at of Object.values(g.attributes)) { const s = at.itemSize, arr = at.array; for (let i = 0; i + 2 < n; i += 3) for (let k = 0; k < s; k++) { const t = arr[(i + 1) * s + k]; arr[(i + 1) * s + k] = arr[(i + 2) * s + k]; arr[(i + 2) * s + k] = t; } at.needsUpdate = true; }
}

// one vertex per distinct corner: compares every attribute as raw 32-bit words (float32 bits), so only corners that are
// exactly equal merge; the triangle list (corner order, winding, groups, draw range) is unchanged
export function reindexExact(g) {
  const pos = g.attributes.position; if (!pos) return g;
  const n = pos.count, cnt = g.index ? g.index.count : n;
  const at = Object.values(g.attributes);
  if (Object.keys(g.morphAttributes || {}).length || at.some(a => a.isInterleavedBufferAttribute || a.count !== n || a.array.BYTES_PER_ELEMENT !== 4)) return g;
  const words = at.map(a => new Uint32Array(a.array.buffer, a.array.byteOffset, n * a.itemSize)), sizes = at.map(a => a.itemSize);
  const remap = new Int32Array(n).fill(-1), rep = [], table = new Map(), idx = new Uint32Array(cnt);
  const same = (a, b) => { for (let k = 0; k < words.length; k++) { const w = words[k], s = sizes[k]; for (let j = 0; j < s; j++) if (w[a * s + j] !== w[b * s + j]) return false; } return true; };
  for (let i = 0; i < cnt; i++) {
    const v = g.index ? g.index.array[i] : i;
    let id = remap[v];
    if (id < 0) {
      let h = 2166136261;
      for (let k = 0; k < words.length; k++) { const w = words[k], s = sizes[k]; for (let j = 0; j < s; j++) h = Math.imul(h ^ w[v * s + j], 16777619); }
      h >>>= 0;
      let list = table.get(h);
      if (list) for (const c of list) if (same(v, rep[c])) { id = c; break; }
      if (id < 0) { id = rep.length; rep.push(v); if (list) list.push(id); else table.set(h, [id]); }
      remap[v] = id;
    }
    idx[i] = id;
  }
  const u = rep.length;
  if (u * 1.15 >= n) return g;   // hardly any sharing: keep it as it is
  const out = new THREE.BufferGeometry();
  at.forEach((a, k) => {
    const s = sizes[k], src = words[k], arr = new a.array.constructor(u * s), dst = new Uint32Array(arr.buffer);
    for (let id = 0; id < u; id++) { const v = rep[id]; for (let j = 0; j < s; j++) dst[id * s + j] = src[v * s + j]; }
    const b = new THREE.BufferAttribute(arr, s, a.normalized); b.name = a.name; b.usage = a.usage;
    out.setAttribute(Object.keys(g.attributes)[k], b);
  });
  out.setIndex(new THREE.BufferAttribute(u <= 65535 ? new Uint16Array(idx) : idx, 1));
  for (const gr of g.groups) out.addGroup(gr.start, gr.count, gr.materialIndex);
  out.setDrawRange(g.drawRange.start, g.drawRange.count);
  out.userData = { ...g.userData };
  if (g.boundingBox) out.boundingBox = g.boundingBox.clone(); else out.computeBoundingBox();
  if (g.boundingSphere) out.boundingSphere = g.boundingSphere.clone(); else out.computeBoundingSphere();
  g.dispose();
  return out;
}

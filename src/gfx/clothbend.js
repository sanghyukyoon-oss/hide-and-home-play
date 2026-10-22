// 천 휘어 말림 (③ 10/21, user: "25 이불도 벤딩으로 올려주게", "이불건조대에 이불 밴딩 넣어주고"): one way for every 이불·담요
// that lifts — the cloth itself bends, a page being turned: the free edge curls first and quick, the curl climbs toward the
// edge that stays put, a soft give at the end. Before this, most of them lifted as one stiff board (and 20판's quilt was six
// stiff strips on hinges — still "판처럼 꺾여").
//   const p = f.part('lift', pv, clothBend(f, pv, { hinge, along, toward, len, turn }), { label: '이불', sfx: 'flip', dur: .72 });
// pv: the part's pivot (a group, left where it is); in pv's own frame —
//   hinge: a point on the edge that stays (the line, the head of the bed)    along: from there toward the free edge
//   toward: the side the cloth curls to (up for a blanket lying flat, out for one hanging)    len: hinge → free edge (m)
//   turn: how far the free end turns at full open (rad; ≈ how high it ends up)    rise: lifted a little as a whole (m)
//   tip: the whole cloth tipping at the hinge (rad)    lag: how much later the curl reaches the hinge (0: all at once)
//   bias: how much the bend gathers toward the free edge    segs: the bend's steps along the cloth (more = smoother)
//   flaps: sides hanging off the cloth (a bed quilt's drapes) fold flat into it as it lifts, instead of swinging out
// A part's reach (room.js: less where a loft's ceiling or a wall is near) makes the bend lower, not slower or cut short.
// The meshes are taken on the first open, after bake.js has merged them (and deFlush cloned them): each gets its own copy,
// cut finer along the cloth where it's long, so it can bend; then only vertices move (no new meshes, nothing per frame
// but the vertex loop). The spots on the cloth (f.spot with the cloth as parent) and opts.follow ride on it.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (a, d) => new THREE.Vector3(...(a || d));
const ss = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

// cut every triangle longer than `max` along A in two at that edge's middle, until none is; one middle per edge, shared by
// both triangles on it (indexed: no cracks, each corner moved once a frame)
function subdivide(g, H, A, max) {
  if (g.groups.length > 1) return g;
  if (!g.index) g = mergeVertices(g, 1e-5);
  const names = Object.keys(g.attributes), at = names.map(n => g.attributes[n]), n0 = g.attributes.position.count;
  let cap = Math.max(1024, n0 * 2), n = n0;
  let buf = at.map(a => { const b = new Float32Array(cap * a.itemSize); for (let i = 0; i < n0 * a.itemSize; i++) b[i] = a.array[i]; return b; });
  let S = new Float32Array(cap);
  const P = g.attributes.position.array;
  for (let i = 0; i < n0; i++) S[i] = (P[i * 3] - H.x) * A.x + (P[i * 3 + 1] - H.y) * A.y + (P[i * 3 + 2] - H.z) * A.z;
  const nIdx = names.indexOf('normal'), mids = new Map(), out = [];
  const mid = (i, j) => {
    const k = i < j ? i * 4194304 + j : j * 4194304 + i; let m = mids.get(k); if (m !== undefined) return m;
    if (n >= cap) { cap *= 2; buf = buf.map((b, q) => { const c = new Float32Array(cap * at[q].itemSize); c.set(b); return c; }); const S2 = new Float32Array(cap); S2.set(S); S = S2; }
    m = n++; S[m] = (S[i] + S[j]) / 2;
    buf.forEach((b, q) => {
      const z = at[q].itemSize; for (let c = 0; c < z; c++) b[m * z + c] = (b[i * z + c] + b[j * z + c]) / 2;
      if (q === nIdx) { const l = Math.hypot(b[m * 3], b[m * 3 + 1], b[m * 3 + 2]) || 1; b[m * 3] /= l; b[m * 3 + 1] /= l; b[m * 3 + 2] /= l; }
    });
    mids.set(k, m); return m;
  };
  const I = g.index ? g.index.array : null, nt = (I ? I.length : n0) / 3, st = [];
  for (let t = 0; t < nt; t++) st.push(I ? I[t * 3] : t * 3, I ? I[t * 3 + 1] : t * 3 + 1, I ? I[t * 3 + 2] : t * 3 + 2);
  let budget = 200000;
  while (st.length) {
    const c = st.pop(), b = st.pop(), a = st.pop();
    const dab = Math.abs(S[a] - S[b]), dbc = Math.abs(S[b] - S[c]), dca = Math.abs(S[c] - S[a]), mx = Math.max(dab, dbc, dca);
    if (mx <= max || --budget <= 0) { out.push(a, b, c); continue; }
    if (mx === dab) { const x = mid(a, b); st.push(a, x, c, x, b, c); }
    else if (mx === dbc) { const x = mid(b, c); st.push(a, b, x, a, x, c); }
    else { const x = mid(c, a); st.push(a, b, x, x, b, c); }
  }
  const ng = new THREE.BufferGeometry();
  names.forEach((nm, q) => ng.setAttribute(nm, new THREE.BufferAttribute(buf[q].slice(0, n * at[q].itemSize), at[q].itemSize, at[q].normalized)));
  ng.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(out, 1) : new THREE.Uint16BufferAttribute(out, 1));
  return ng;
}

export function clothBend(f, pv, o = {}) {
  const H = V(o.hinge, [0, 0, 0]), A = V(o.along, [0, -1, 0]).normalize(), N0 = V(o.toward, [0, 0, 1]);
  N0.addScaledVector(A, -N0.dot(A)).normalize();
  const L = new THREE.Vector3().crossVectors(A, N0), UP = o.up ? V(o.up) : N0.clone();
  const flaps = o.flaps ? .85 : 0, turn = o.turn ?? 2, tip = o.tip ?? 0, lag = o.lag ?? .42, bias = o.bias ?? 2, give = o.give ?? .1, rise = o.rise ?? 0, S = o.segs ?? 32;
  let len = o.len || 0, cloth = null, fol = null;
  const th = new Float32Array(S + 1), X = new Float32Array(S + 1), Y = new Float32Array(S + 1);
  let G = 0; for (let j = 0; j < S; j++) G += (.2 + Math.pow((j + .5) / S, bias)) / S;
  // the bend at t: the angle along the cloth, and where each step of it ends up (in the hinge's along/toward plane)
  let amp = 1;
  const shape = t => {
    th[0] = tip * amp * ss(t * 1.2 - .2); X[0] = 0; Y[0] = 0;
    const ds = len / S;
    for (let j = 0; j < S; j++) {
      const w = (j + .5) / S, d = (1 - w) * lag, u = ss((t - d) / (1 - d * .85)), gv = 1 + give * Math.sin(Math.min(1, u) * Math.PI) * w;
      th[j + 1] = th[j] + amp * turn * (.2 + Math.pow(w, bias)) / G / S * u * gv;
      const a = (th[j] + th[j + 1]) / 2; X[j + 1] = X[j] + Math.cos(a) * ds; Y[j + 1] = Y[j] + Math.sin(a) * ds;
    }
  };
  const at = s => {   // → [x, y, angle] for a point s along the cloth (straight on past either end)
    if (s <= 0) return [Math.cos(th[0]) * s, Math.sin(th[0]) * s, th[0]];
    const u = s / len * S;
    if (u >= S) { const e = u - S, k = th[S], ds = len / S; return [X[S] + Math.cos(k) * e * ds, Y[S] + Math.sin(k) * e * ds, k]; }
    const j = Math.floor(u), r = u - j;
    return [X[j] + (X[j + 1] - X[j]) * r, Y[j] + (Y[j + 1] - Y[j]) * r, th[j] + (th[j + 1] - th[j]) * r];
  };
  const q = new THREE.Vector3(), T = new THREE.Vector3(), Nn = new THREE.Vector3();
  // a point (in pv's frame) bent: out = where it goes, returns the angle there
  let fl = 0;
  const bendPt = (p, out, lift) => {
    q.subVectors(p, H); const s = q.dot(A), v0 = q.dot(N0), v = v0 < -.03 ? -.03 + (v0 + .03) * (1 - fl) : v0, l = q.dot(L), [x, y, a] = at(s), c = Math.cos(a), sn = Math.sin(a);
    T.copy(A).multiplyScalar(c).addScaledVector(N0, sn); Nn.copy(A).multiplyScalar(-sn).addScaledVector(N0, c);
    out.copy(H).addScaledVector(L, l).addScaledVector(A, x).addScaledVector(N0, y).addScaledVector(Nn, v).addScaledVector(UP, lift);
    return a;
  };
  const rel = (o2) => { const m = new THREE.Matrix4(); for (let x = o2; x && x !== pv; x = x.parent) { x.updateMatrix(); m.premultiply(x.matrix); } return m; };
  const under = (o2, root) => { for (let x = o2; x; x = x.parent) if (x === root) return true; return false; };
  const take = () => {
    let anchors = f.spots.map(s => s.anchor).filter(a => under(a, pv)).concat(o.follow || []);
    // (a spot on a hook that rides the cloth — 20판's '이불 속' on keyAt — rides with its hook, not on its own as well)
    anchors = anchors.filter(a => !anchors.some(b => b !== a && under(a.parent, b)));
    cloth = [];
    pv.traverse(m => {
      if (!m.isMesh || m.userData.proxy || anchors.some(a => under(m, a))) return;
      const M = rel(m), g0 = m.geometry.clone().applyMatrix4(M), g = subdivide(g0, H, A, o.sub ?? Math.max(.03, (len || 1) / 16));
      g.computeBoundingSphere(); m.geometry = g;
      m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.set(1, 1, 1); if (m.parent !== pv) pv.add(m);
      cloth.push({ g, P0: g.attributes.position.array.slice(), N0: g.attributes.normal?.array.slice() });
    });
    if (!len) { let mx = 0; for (const c of cloth) for (let i = 0; i < c.P0.length; i += 3) mx = Math.max(mx, (c.P0[i] - H.x) * A.x + (c.P0[i + 1] - H.y) * A.y + (c.P0[i + 2] - H.z) * A.z); len = mx || 1; }
    fol = anchors.map(a => { const M = rel(a), P = rel(a.parent), p = new THREE.Vector3(), r = new THREE.Quaternion(), sc = new THREE.Vector3(); M.decompose(p, r, sc); return { a, p, r, sc, Pinv: P.clone().invert() }; });
  };
  const p = new THREE.Vector3(), o3 = new THREE.Vector3(), qa = new THREE.Quaternion(), M4 = new THREE.Matrix4();
  let part = null;
  const fn = t => {
    if (!cloth) { if (t <= 0) return; take(); }
    part = part || f.parts.find(x => x.apply === fn);
    const r = part ? part.reach : 1; if (r <= 0) return;
    t = Math.min(1, t / r); amp = r; fl = flaps * ss(t);
    shape(t); const lift = rise * r * ss(t);
    for (const c of cloth) {
      const pa = c.g.attributes.position.array, na = c.g.attributes.normal?.array;
      for (let i = 0; i < pa.length; i += 3) {
        p.set(c.P0[i], c.P0[i + 1], c.P0[i + 2]); const a = bendPt(p, o3, lift); pa[i] = o3.x; pa[i + 1] = o3.y; pa[i + 2] = o3.z;
        if (na) {
          const cs = Math.cos(a), sn = Math.sin(a);
          const nx = c.N0[i], ny = c.N0[i + 1], nz = c.N0[i + 2], na_ = nx * A.x + ny * A.y + nz * A.z, nn = nx * N0.x + ny * N0.y + nz * N0.z;
          const ka = na_ * cs - nn * sn, kn = na_ * sn + nn * cs;
          na[i] = nx + (ka - na_) * A.x + (kn - nn) * N0.x; na[i + 1] = ny + (ka - na_) * A.y + (kn - nn) * N0.y; na[i + 2] = nz + (ka - na_) * A.z + (kn - nn) * N0.z;
        }
      }
      c.g.attributes.position.needsUpdate = true; if (na) c.g.attributes.normal.needsUpdate = true;
      c.g.computeBoundingSphere(); c.g.computeBoundingBox();
    }
    for (const F of fol) {
      const a = bendPt(F.p, o3, lift); qa.setFromAxisAngle(L, a).multiply(F.r);
      M4.compose(o3, qa, F.sc).premultiply(F.Pinv); M4.decompose(F.a.position, F.a.quaternion, F.a.scale);
    }
  };
  // (room.js fitParts: a cloth touching something already when shut is opened fully)
  fn.cloth = true;
  return fn;
}

// a cloth hanging from its top edge (10/22 밤 사용자 "이불이 판자처럼 빳빳하고 평평" — the alley line, the rooftop line, the drying
// rack): a thin slab cut fine whose face waves out by zf(x, y), y measured down from the top edge (negative); clothWave gives the
// usual soft folds, deepening toward the hem. Decorations on the cloth sit at zf of their own spot so they ride the folds.
export const clothWave = (w, h, folds, amp) => (x, y) => amp * (.3 + .7 * Math.min(1, -y / h)) * Math.sin((x / w + .5) * folds * Math.PI * 2);
export function clothSlab(w, h, d, zf, y0 = 0) {
  const g = new THREE.BoxGeometry(w, h, d, 14, Math.max(1, Math.round(h / .06)), 1), p = g.attributes.position;
  g.translate(0, y0 - h / 2, 0);
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + zf(p.getX(i), p.getY(i)));
  g.computeVertexNormals();
  return g;
}

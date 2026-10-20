// 자리에 맞는 물건 (10/19 저녁, 사용자 실폰: 3판 "축구공.. (작은 새집 안)", "도넛도 이렇게 뚫려 있다"(바구니 옆면), 5판 "스테이지5
// 열쇠 뚫어 버렸네? 크기 키우다가 ㅋ", 3판 "고무오리 얼굴이 바구니 쪽에 있음. 돌려 봐야 하는데"; 스토리 룸 원칙 "몸이 들어가야
// 해요 · 뚫고 박히면 안 돼요"): a thing goes to a place only if it fits there at the size it will be drawn.
//   size  — the drawn size (stage.js: ~34 cm on the longest side, at least 1.25×) is held to the place's box: its headroom
//           (maxH) and the room round it — four rays out from the place, low and at mid height, against its own piece of
//           furniture and the room's walls. Inside something (a drawer, a birdhouse, a basket) it keeps 10% air.
//           A tight place may draw its thing a little smaller (down to 80% of the wanted size); tighter than that, the place
//           is not used for that thing at all.
//   face  — a thing looks out of its hiding place: behind a piece, away from it (you find it from that side); in a drawer
//           or behind a door, out of the front; anywhere else at the start view.
// One test for the planner (stages.js fits), the first-screen tidy (tiers.js), the key moves (hunt.js) and the drawing
// (stage.js), so they never disagree. ?fit=0 turns the box test off (headroom only, as before).
import * as THREE from 'three';
import { ITEMS, buildItem } from './gfx/items.js';

const ON = typeof location === 'undefined' || !/[?&]fit=0(&|$)/.test(location.search);
const PROBE = typeof location === 'undefined' || !/[?&]probe=0(&|$)/.test(location.search);
const FAR = 1;                       // (a place with nothing round it within a metre is open)
const AIR_IN = 1.1, AIR_ON = 1;      // inside: 10% room to spare; on / under / behind: just clear (fitClear adds 1.5 cm)
const KEEP = .8;                     // the least of the wanted size a tight place may draw
const FOLIAGE = /^(bush|reeds|hedge|grass|shrub|flowerbed|haystack|leafpile)/;
// (and under covers — a pillow, a quilt, a cushion: a thing tucked under there peeks out, and that is a good hiding place —
// user 10/19 "베개 밑으로 살짝 삐져나온 건 왜 괜찮게 느껴지지", 스토리 룸 원칙 3)
const COVERS = /^(bed|futon|zabuton|kotatsu|catbed|bunkbed|hammock|cushion)/;   // (soft ones: not a sofa or a beanbag, whose firm body a thing went into — 겹침 QA v173 소파 쿠션 밑·빈백 밑)
export const nestles = spot => FOLIAGE.test(spot?.furn?.type || '') || (spot?.kind === 'inside' && COVERS.test(spot?.furn?.type || ''));   // (a bush, the reeds: a thing peeks out between the leaves)

// the model's own size at scale 1 (meshes only — the tap sphere is added later, in attachItem)
const NAT = new Map();
export function natSize(type) {
  let v = NAT.get(type); if (v) return v;
  if (!ITEMS[type]?.build) return new THREE.Vector3(.2, .2, .2);   // (not a thing of the list: a cameo, a story prop)
  const g = buildItem(type), b = new THREE.Box3(), bb = new THREE.Box3();
  g.updateMatrixWorld(true);
  g.traverse(o => { if (o.isMesh && o.geometry && o.visible !== false) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
  v = b.isEmpty() ? new THREE.Vector3(.2, .2, .2) : b.getSize(new THREE.Vector3());
  NAT.set(type, v); return v;
}

// the size a thing is drawn at, as a multiple of the place's own scale (stage.js; was inline there)
export function wantScale(type, spot, role, want = .34) {
  if (role === 'decoy') return 1.08;
  const nat = natSize(type), big = Math.max(nat.x, nat.y, nat.z) || .2;
  const room = (spot.maxH + .02) / Math.max(.01, (ITEMS[type]?.h || .2) * (spot.scale || 1));
  const ss = spot.scale || 1, lim = ITEMS[type]?.flat ? 2.4 : room;
  return Math.max(1.15, Math.min(lim, Math.max(1.25, Math.min(2.4, want / ss / big))));
}

// the room round a place: free distance along the furniture's own ±x and ±z (and which way is out of its front)
const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _c = new THREE.Vector3(), _b = new THREE.Box3();
// the room being planned: its walls, its matrices brought up to date — once per stage, before the planner (stage.js)
let WALLS = [], ROOMS = [];
export function fitPrep(room) {
  WALLS = []; ROOMS = [];
  if (!room?.group) return;
  ROOMS = (room.rooms || [room]).map(R => R.group);
  room.group.updateMatrixWorld(true);
  room.group.traverse(o => { if (o.isMesh && o.userData.wall) WALLS.push({ m: o, box: new THREE.Box3().setFromObject(o) }); });
}
// (fast: rays only against the walls within a metre of the place, and a piece's own meshes listed once — the first K took
// 60–250 ms a stage on a desktop to plan, 레벨 1~10 밸런스 10/19)
const wallsNear = p => WALLS.filter(w => w.box.distanceToPoint(p) < FAR).map(w => w.m);
const FMESH = new WeakMap();
function meshesOf(g) {
  let l = FMESH.get(g); if (l) return l;
  l = []; const walk = o => { if (o.userData.item) return; if (o.isMesh && !o.userData.proxy) l.push(o); for (const c of o.children) walk(c); };   // (not a thing put there)
  walk(g); FMESH.set(g, l); return l;
}
export function clearance(spot) {
  if (spot._clr) return spot._clr;
  const fg = spot.furn?.group, a = spot.anchor;
  if (!fg || !a) return (spot._clr = { px: FAR, nx: FAR, pz: FAR, nz: FAR });
  const rc = new THREE.Raycaster(); rc.far = FAR;
  a.getWorldPosition(_o);
  const own = meshesOf(fg).filter(o => o.visible !== false), targets = [...own, ...wallsNear(_o)];
  fg.getWorldQuaternion(_q);
  const out = {};
  // (one height, its middle: the place picked is tried again with the thing's own shape — shapeFits)
  const hs = [Math.min(.15, Math.max(.05, spot.maxH * .5)) * (spot.scale || 1)];
  for (const [k, x, z] of [['px', 1, 0], ['nx', -1, 0], ['pz', 0, 1], ['nz', 0, -1]]) {
    _d.set(x, 0, z).applyQuaternion(_q); _d.y = 0; _d.normalize();
    let best = FAR;
    for (const h of hs) {
      a.getWorldPosition(_o); _o.y += h; rc.set(_o, _d);
      const hit = rc.intersectObjects(targets, false)[0];
      if (hit) best = Math.min(best, hit.distance);
    }
    out[k] = best;
  }
  // (and straight down its middle, from just under its headroom: a plant's stem, a floor lamp's pole running up through the
  // place — 겹침 QA 10/19, 5판 스탠드 쟁반 · 화분 흙 위 줄기 — nothing but a thing tucked under covers may sit round that)
  if (spot.kind === 'on' && !spot.wallFace && !nestles(spot)) {   // (out on top of something only: a box's closed lid and its own insides are not a pole)
    const top = Math.max(.05, Math.min(spot.maxH, .5) - .02) * (spot.scale || 1);
    a.getWorldPosition(_o); _o.y += top; rc.set(_o, _d.set(0, -1, 0)); rc.far = top - .015;
    out.mid = rc.intersectObjects(own, false).length > 0;
  }
  return (spot._clr = out);
}

// the most this thing may be drawn at this place (× the place's scale): its headroom and the room round it
// under a cover you lift (a newspaper, a cushion, a pillow, a beanbag, a crate's top): only as tall as the gap under it when it
// lies shut, plus a soft cover's give (half its thickness) — 3판 a football came up from under a flat newspaper (user 10/20:
// "신문지 밑에서 축구공이 솟아났네.. 매직인가"); a sheet gives 1 cm. Measured once per place, while it is shut.
// (a soft one gives half its thickness, 6 cm at most: a 22 cm ball of yarn under a beanbag no)
const GAP = new WeakMap(), RESTS = /(신문지|담요|쿠션|베개|방석|빈백|이불|러그|매트) ?밑/;   // (a cover that lies on what it hides — not a box's lid or a birdhouse roof)
function coverGap(spot, box = false) {
  if (GAP.has(spot)) return GAP.get(spot);
  let v = null;
  const p = spot.part, a = spot.anchor;
  if (p?.pivots?.length && a && !(p.t > .05)) {
    const b = new THREE.Box3(), bb = new THREE.Box3();
    for (const pv of p.pivots) { pv.updateMatrixWorld(true); for (const m of meshesOf(pv)) { if (!m.geometry?.attributes?.position) continue; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); b.union(bb.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld)); } }
    if (!b.isEmpty()) { const y = a.getWorldPosition(new THREE.Vector3()).y, thick = b.max.y - b.min.y; v = Math.max(0, b.min.y - y) + (box ? .01 : thick > .05 ? Math.min(.06, thick * .5) : .012); }
  }
  GAP.set(spot, v); return v;
}
export function capScale(type, spot, role) {
  if (!ITEMS[type]) return 0;
  if (type === 'friendtoken') return Infinity;   // (not a thing — the marker of where a friend hides)
  // headroom (as before, but for the model's real height)
  const nat = natSize(type), ss = spot.scale || 1;
  let cap = ITEMS[type].flat || spot.kind === 'in' ? Infinity : (spot.maxH + .02) / Math.max(.01, nat.y * ss);
  if (spot.part?.kind === 'lift' && !ITEMS[type].flat && RESTS.test(spot.label || '')) { const g = coverGap(spot); if (g != null) cap = Math.min(cap, g / Math.max(.005, nat.y * ss)); }
  // (and in a box with a lid or a top that lifts — a toy chest, a cooler, a laundry basket, an art crate: no taller than the box is deep when shut; 2·5·7판's
  // 34–40 cm things stood 7–12 cm out of the toy chest, 9판's duck 20 cm out of the basket — 레벨 기획안 E, 10/20)
  else if ((spot.part?.kind === 'lid' || spot.part?.kind === 'lift') && spot.kind === 'inside' && !ITEMS[type].flat) { const g = coverGap(spot, true); if (g != null) cap = Math.min(cap, g / Math.max(.005, nat.y * ss)); }
  // the room round it (not for a wall frame, not sunk in a ball pit or a pond, where it is meant to be half in)
  // (not among leaves or reeds either: a thing nestled in a bush is meant to peek out between the stalks — 스토리 룸 원칙 3)
  if (ON && !spot.wallFace && spot.kind !== 'in' && !nestles(spot)) {
    const c = clearance(spot), air = spot.kind === 'inside' ? AIR_IN : AIR_ON;
    const cx = Math.min(c.px, c.nx), cz = Math.min(c.pz, c.nz);
    // squared to the furniture either way round (fitClear turns a long key along a cubby the same way)
    const fit = (w, d) => Math.min(cx / Math.max(.001, w / 2 * air), cz / Math.max(.001, d / 2 * air));
    cap = Math.min(cap, Math.max(fit(nat.x * ss, nat.z * ss), fit(nat.z * ss, nat.x * ss)));
    if (c.mid) return 0;
  }
  return cap;
}

// fitClear's measure, before the thing is there: its own model on the place at scale sc, turned square to the furniture
// either way, rays from its middle to the four sides against its furniture and the walls → how much of sc fits (1 = all)
const EDGE_KINDS = new Set(['on', 'behind', 'under']);   // (out in the open next to its piece; in a box the box's insides are fitClear's)
const PROTO = new Map(), _pb = new THREE.Box3(), _pbb = new THREE.Box3(), _pc = new THREE.Vector3(), _pd = new THREE.Vector3(), _po = new THREE.Vector3();
const _eb = new THREE.Box3(), _mb2 = new THREE.Box3(), _ta = new THREE.Vector3(), _tb = new THREE.Vector3(), _tc = new THREE.Vector3(), _ray = new THREE.Ray(), _hp = new THREE.Vector3();
const segIn = (p, q, box) => { const L = p.distanceTo(q); if (L < 1e-5) return false; _ray.origin.copy(p); _ray.direction.subVectors(q, p).divideScalar(L); return !!_ray.intersectBox(box, _hp) && _hp.distanceTo(p) <= L; };
// does any triangle of these meshes reach into the box (a corner inside it, or an edge through it)
function edgesThrough(meshes, box) {
  for (const m of meshes) {
    const g = m.geometry, pos = g?.attributes?.position; if (!pos) continue;
    if (!g.boundingBox) g.computeBoundingBox();
    if (!_mb2.copy(g.boundingBox).applyMatrix4(m.matrixWorld).intersectsBox(box)) continue;
    const idx = g.index, n = idx ? idx.count : pos.count, mw = m.matrixWorld;
    for (let i = 0; i + 2 < n; i += 3) {
      _ta.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(mw);
      _tb.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(mw);
      _tc.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(mw);
      if (box.containsPoint(_ta) || box.containsPoint(_tb) || box.containsPoint(_tc) || segIn(_ta, _tb, box) || segIn(_tb, _tc, box) || segIn(_tc, _ta, box)) return true;
    }
  }
  return false;
}
function furnRoot(a) { let fr = a; while (fr.parent && !ROOMS.includes(fr.parent)) fr = fr.parent; return fr.parent ? fr : null; }
function probe(type, spot, sc, edgeOnly = false) {
  const key = type + '@' + sc.toFixed(3) + (edgeOnly ? 'e' : ''); spot._probe ||= {};
  if (spot._probe[key] != null) return spot._probe[key];
  const a = spot.anchor, fr = furnRoot(a);
  if (!fr || !ITEMS[type]?.build) return (spot._probe[key] = 1);
  let g = PROTO.get(type); if (!g) { g = buildItem(type); PROTO.set(type, g); }
  const mine = new Set(); g.traverse(o => mine.add(o));
  const rc = new THREE.Raycaster(); a.getWorldPosition(_pc);
  const targets = [...meshesOf(fr).filter(o => o.visible !== false), ...wallsNear(_pc)];
  a.add(g); g.position.set(0, 0, 0); g.scale.setScalar(sc * (spot.scale || 1));
  let best = 0;
  for (const ry of [0, Math.PI / 2]) {
    g.rotation.set(0, ry, 0); g.position.set(0, 0, 0); g.updateMatrixWorld(true); centerOn(g, spot);
    _pb.makeEmpty();
    g.traverse(o => { if (o.isMesh && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _pb.union(_pbb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
    if (_pb.isEmpty()) { best = 1; break; }
    _pb.getCenter(_pc);
    let k = 1;
    for (const [dx, dz, half] of [[1, 0, _pb.max.x - _pc.x], [-1, 0, _pc.x - _pb.min.x], [0, 1, _pb.max.z - _pc.z], [0, -1, _pc.z - _pb.min.z]]) {
      if (half <= .01) continue;
      rc.set(_pc, _pd.set(dx, 0, dz)); rc.far = half + .05;
      const hit = rc.intersectObjects(targets, false).find(h => !mine.has(h.object));
      if (hit) k = Math.min(k, (hit.distance - .015) / half);
      // and from its edge in to its middle (a ray that starts inside a stem or a pole never sees it): a plant's stem, a floor
      // lamp's pole, a swing's chain inside the thing's own outline — 겹침 QA 10/19 — and it doesn't go there at all
    }
    // out on top of something: no edge of the furniture's own triangles passes through the thing (a floor lamp's pole 1.2 cm
    // off the middle, a plant's thin slanting stem slipped between rays — 겹침 QA 10/20 실측). Its box less 5 mm a side, from
    // 1 cm above the place up (what it stands on is no crossing). In a box or a drawer the closed lid and the insides are fitClear's.
    if (EDGE_KINDS.has(spot.kind)) {   // (and behind or under a piece: 10판's heart behind the big pot grazed it 4 cm — 겹침 QA v178)
      a.getWorldPosition(_po);
      // (at the size it will be drawn: shrunk by k round its middle when the side rays said a little less fits)
      const kk = edgeOnly ? 1 : Math.max(0, Math.min(1, k)), hx = (_pb.max.x - _pb.min.x) / 2 * kk, hz = (_pb.max.z - _pb.min.z) / 2 * kk;
      _eb.min.set(_pc.x - hx + .005, _pb.min.y, _pc.z - hz + .005); _eb.max.set(_pc.x + hx - .005, _pb.min.y + (_pb.max.y - _pb.min.y) * kk, _pc.z + hz - .005);
      _eb.min.y = Math.max(_eb.min.y, _po.y + .01);
      if (!_eb.isEmpty() && edgesThrough(meshesOf(fr).filter(o => o.visible !== false), _eb)) k = 0;
    }
    if (edgeOnly) { best = k > 0 ? 1 : 0; if (best) break; continue; }
    best = Math.max(best, k);
    if (best >= 1) break;
  }
  a.remove(g); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0);
  return (spot._probe[key] = Math.max(0, best));
}
// how big this thing is drawn at this place (× the place's scale), or 0 when it does not fit there
export function drawnScale(type, spot, role = 'target', want = .34) {
  const sc = wantScale(type, spot, role, want), cap = capScale(type, spot, role);
  if (cap >= sc) return sc;
  // (a decoy is clutter: in a tight place it may be drawn smaller, down to .6 — 3판 kept 2 of its 6 otherwise)
  return role === 'decoy' ? (cap >= .6 ? cap : 0) : cap >= Math.max(1, sc * KEEP) ? cap : 0;
}
export const spotFits = (type, spot, role) => drawnScale(type, spot, role) > 0;
// drawn at (nearly) the full size wanted — ~34 cm on its longest side: not held down by a low headroom (1장's place preference)
export const fullSize = (type, spot) => { const n = natSize(type), d = drawnScale(type, spot, 'target'); return d > 0 && d * (spot.scale || 1) * Math.max(n.x, n.y, n.z) >= .29; };
// the place a planner or a tidy has picked, tried with the thing's own shape the way the drawing's fitClear measures it, so the
// drawing doesn't shrink it again (겹침 QA 10/19: 52 places went down to 57%): true when it keeps 80% of the wanted size. Only
// for the place picked (a dozen a stage), not every candidate — every candidate cost 100–300 ms a stage.
export function shapeFits(type, spot, role = 'target') {
  if (!PROBE || spot.wallFace || spot.kind === 'in' || nestles(spot) || !ITEMS[type]?.build) return true;
  // (a decoy too, on top of something: nothing running through it — 겹침 QA 10/20, a pot on the monstera's soil)
  if (role === 'decoy') { if (!EDGE_KINDS.has(spot.kind)) return true; const d = drawnScale(type, spot, 'decoy'); return d > 0 && probe(type, spot, d, true) > 0; }
  const want = wantScale(type, spot, role), sc = drawnScale(type, spot, role);
  if (!(sc > 0) || sc >= want * 2) return sc > 0;
  return sc * probe(type, spot, sc) >= Math.max(1, want * KEEP) - 1e-6;
}

// which way a thing at this place looks (world yaw: its own +z, where a face or a label is, turned to it)
const VIEW = Math.PI / 4;   // (the start view: stage.js frameCamera — yaw π/4 for every stage)
const SIDEWAYS = new Set(['door', 'drawer', 'slide', 'shutter', 'hatch']);
export function faceYaw(spot) {
  const fg = spot.furn?.group;
  if (fg && spot.kind === 'inside' && spot.part && SIDEWAYS.has(spot.part.kind)) {   // out of the front it opens from
    fg.getWorldQuaternion(_q); _d.set(0, 0, 1).applyQuaternion(_q); return Math.atan2(_d.x, _d.z);
  }
  // in a cubby or on a shelf with sides and a back (walls close on three sides): out of the furniture's front, the open side
  const c = spot._clr;
  if (fg && c && (spot.kind === 'on' || spot.kind === 'inside') && [c.px, c.nx, c.nz].filter(v => v < .4).length >= 2) {
    fg.getWorldQuaternion(_q); _d.set(0, 0, 1).applyQuaternion(_q); return Math.atan2(_d.x, _d.z);
  }
  if (fg && spot.kind === 'behind' && spot.anchor) {   // away from the piece it hides behind
    _b.setFromObject(fg).getCenter(_c); spot.anchor.getWorldPosition(_o);
    const dx = _o.x - _c.x, dz = _o.z - _c.z; if (dx * dx + dz * dz > 1e-4) return Math.atan2(dx, dz);
  }
  return VIEW;
}
// turn a thing on its place so it looks that way (a little either side, so a room of things isn't all lined up)
const _e = new THREE.Euler();
export function faceItem(g, spot, jit = 0) {
  if (spot.wallFace || !spot.anchor || !g) return;
  spot.anchor.updateWorldMatrix(true, false); spot.anchor.getWorldQuaternion(_q); _e.setFromQuaternion(_q, 'YXZ');
  g.rotation.y = faceYaw(spot) - _e.y + jit;
}
// the thing sits in the middle of its place (a key's model starts at its ring: it hung out over the cubby's edge), feet where they were
const _m = new THREE.Vector3(), _w = new THREE.Vector3(), _bb = new THREE.Box3(), _mb = new THREE.Box3();
export function centerOn(g, spot) {
  if (spot.wallFace || !spot.anchor || !g?.parent) return;
  g.updateMatrixWorld(true); _mb.makeEmpty();
  g.traverse(o => { if (o.isMesh && !o.userData.proxy && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _mb.union(_bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } });
  if (_mb.isEmpty()) return;
  _mb.getCenter(_m); spot.anchor.getWorldPosition(_w); _m.y = _w.y;   // (only across: the height stays)
  const local = g.parent.worldToLocal(_m.clone()), at = g.parent.worldToLocal(_w.clone());
  g.position.x -= local.x - at.x; g.position.z -= local.z - at.z; g.updateMatrixWorld(true);
}
// the drawing: a thing on top of something, turned to look out, whose turned corners now reach into its furniture (a duck on a
// swing seat turned to the start view met the ropes, 겹침 QA 10/20) goes square to the furniture again — whichever way is clear
const _ib = new THREE.Box3(), _ibb = new THREE.Box3(), _ia = new THREE.Vector3();
function itemBox(g) { _ib.makeEmpty(); g.updateMatrixWorld(true); g.traverse(o => { if (o.isMesh && !o.userData.proxy && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _ib.union(_ibb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } }); return _ib; }
export function squareIfCrossing(g, spot) {
  if (!PROBE || !g || !EDGE_KINDS.has(spot.kind) || spot.wallFace || nestles(spot) || !spot.anchor) return;
  const fr = furnRoot(spot.anchor); if (!fr) return;
  const ms = meshesOf(fr).filter(o => o.visible !== false);
  spot.anchor.getWorldPosition(_ia);
  const crosses = () => { const b = itemBox(g); if (b.isEmpty()) return false; b.min.x += .005; b.min.z += .005; b.max.x -= .005; b.max.z -= .005; b.min.y = Math.max(b.min.y, _ia.y + .01); return !b.isEmpty() && edgesThrough(ms, b); };
  if (!crosses()) return;
  const ry = g.rotation.y;
  for (const a of [0, Math.PI / 2]) { g.rotation.y = a; g.position.x = g.position.z = 0; centerOn(g, spot); if (!crosses()) return; }
  g.rotation.y = ry; g.position.x = g.position.z = 0; centerOn(g, spot);
}
// a thing on top of something sits on it: when the place's mark is a little under the board it stands on (a plant shelf's top
// shelf: 6–9 mm sunk, 겹침 QA v178), it comes up onto the surface — never more than 2 cm (a thing meant to sit in sand stays)
const _sd = new THREE.Vector3(0, -1, 0), _so = new THREE.Vector3(), _sl = new THREE.Vector3();
export function settleOn(g, spot) {
  if (!g || spot.kind !== 'on' || spot.wallFace || nestles(spot) || !spot.anchor || !g.parent) return;
  const fr = furnRoot(spot.anchor); if (!fr) return;
  const b = itemBox(g); if (b.isEmpty()) return;
  const rc = new THREE.Raycaster(); b.getCenter(_so); _so.y = b.min.y + .02; rc.set(_so, _sd); rc.far = .021;
  const hit = rc.intersectObjects(meshesOf(fr).filter(o => o.visible !== false), false)[0];
  if (!hit) return;
  const up = hit.point.y - b.min.y;
  if (up > .001 && up < .02) {   // (up by that much in the world, whatever the place's own frame is)
    const pw = g.parent.getWorldPosition(new THREE.Vector3()), a1 = g.parent.worldToLocal(pw.clone()), a2 = g.parent.worldToLocal(pw.clone().add(_sl.set(0, up, 0)));
    g.position.add(a2.sub(a1)); g.updateMatrixWorld(true);
  }
}

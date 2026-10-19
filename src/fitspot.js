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
const FAR = 1;                       // (a place with nothing round it within a metre is open)
const AIR_IN = 1.1, AIR_ON = 1;      // inside: 10% room to spare; on / under / behind: just clear (fitClear adds 1.5 cm)
const KEEP = .8;                     // the least of the wanted size a tight place may draw
const FOLIAGE = /^(bush|reeds|hedge|grass|shrub|flowerbed|haystack|leafpile)/;
// (and under covers — a pillow, a quilt, a cushion: a thing tucked under there peeks out, and that is a good hiding place —
// user 10/19 "베개 밑으로 살짝 삐져나온 건 왜 괜찮게 느껴지지", 스토리 룸 원칙 3)
const COVERS = /^(bed|futon|zabuton|kotatsu|sofa|beanbag|catbed|bunkbed|hammock|cushion)/;
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
let WALLS = [];
export function fitPrep(room) {
  WALLS = [];
  if (!room?.group) return;
  room.group.updateMatrixWorld(true);
  room.group.traverse(o => { if (o.isMesh && o.userData.wall) WALLS.push(o); });
}
export function clearance(spot) {
  if (spot._clr) return spot._clr;
  const fg = spot.furn?.group, a = spot.anchor;
  if (!fg || !a) return (spot._clr = { px: FAR, nx: FAR, pz: FAR, nz: FAR });
  const rc = new THREE.Raycaster(); rc.far = FAR;
  const targets = [fg, ...WALLS];
  fg.getWorldQuaternion(_q);
  const out = {};
  const hs = [.03, Math.min(.15, Math.max(.05, spot.maxH * .5))].map(h => h * (spot.scale || 1));
  for (const [k, x, z] of [['px', 1, 0], ['nx', -1, 0], ['pz', 0, 1], ['nz', 0, -1]]) {
    _d.set(x, 0, z).applyQuaternion(_q); _d.y = 0; _d.normalize();
    let best = FAR;
    for (const h of hs) {
      a.getWorldPosition(_o); _o.y += h; rc.set(_o, _d);
      const hit = rc.intersectObjects(targets, true).find(q => q.object.isMesh && q.object.visible !== false && !q.object.userData.proxy);
      if (hit) best = Math.min(best, hit.distance);
    }
    out[k] = best;
  }
  return (spot._clr = out);
}

// the most this thing may be drawn at this place (× the place's scale): its headroom and the room round it
export function capScale(type, spot) {
  if (!ITEMS[type]) return 0;
  if (type === 'friendtoken') return Infinity;   // (not a thing — the marker of where a friend hides)
  // headroom (as before, but for the model's real height)
  const nat = natSize(type), ss = spot.scale || 1;
  let cap = ITEMS[type].flat || spot.kind === 'in' ? Infinity : (spot.maxH + .02) / Math.max(.01, nat.y * ss);
  // the room round it (not for a wall frame, not sunk in a ball pit or a pond, where it is meant to be half in)
  // (not among leaves or reeds either: a thing nestled in a bush is meant to peek out between the stalks — 스토리 룸 원칙 3)
  if (ON && !spot.wallFace && spot.kind !== 'in' && !nestles(spot)) {
    const c = clearance(spot), air = spot.kind === 'inside' ? AIR_IN : AIR_ON;
    const cx = Math.min(c.px, c.nx), cz = Math.min(c.pz, c.nz);
    // squared to the furniture either way round (fitClear turns a long key along a cubby the same way)
    const fit = (w, d) => Math.min(cx / Math.max(.001, w / 2 * air), cz / Math.max(.001, d / 2 * air));
    cap = Math.min(cap, Math.max(fit(nat.x * ss, nat.z * ss), fit(nat.z * ss, nat.x * ss)));
  }
  return cap;
}
// how big this thing is drawn at this place (× the place's scale), or 0 when it does not fit there
export function drawnScale(type, spot, role = 'target', want = .34) {
  const sc = wantScale(type, spot, role, want), cap = capScale(type, spot);
  if (cap >= sc) return sc;
  // (a decoy is clutter: in a tight place it may be drawn smaller, down to .6 — 3판 kept 2 of its 6 otherwise)
  return role === 'decoy' ? (cap >= .6 ? cap : 0) : cap >= Math.max(1, sc * KEEP) ? cap : 0;
}
export const spotFits = (type, spot, role) => drawnScale(type, spot, role) > 0;

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

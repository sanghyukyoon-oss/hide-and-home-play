// Free hiding: put an item on any upward-facing surface — the floor, a furniture top, a shelf, the inside of an open
// drawer — instead of only the prepared hiding spots. A place is stored by its host so another player's game can rebuild it:
//   'room' (the floor) · 'f:<furniture id>' · 'd:<wall decor index>' · 'p:<part key>' (moves and hides with that part)
import * as THREE from 'three';

const N = new THREE.Vector3();

// A roof rotates inside its synthetic furniture wrapper; free points belong to that actual roof-local frame.
const decorNode = rec => rec.roof ? rec.f.group.children[0] : rec.f.group;

// what is under the finger: { key, node, part, furn, label, point (world) } or { side: true } / null
export function pickSurface(world, room, x, y, skip = null) {
  for (const h of world.pick(x, y, [room.group])) {
    const o = h.object, u = o.userData;
    if (u.proxy || u.noOcclude) continue;
    let inSkip = false, isItem = false, isChar = false;
    for (let p = o; p; p = p.parent) { if (p === skip) inSkip = true; if (p.userData.item) isItem = true; if (p.userData.char) isChar = true; }
    if (inSkip || isChar) continue;
    if (isItem) return null;                                 // don't stack on other hidden things
    if (!h.face) continue;
    N.copy(h.face.normal).transformDirection(o.matrixWorld);
    if (N.y < .55) return { side: true };                    // a wall or the side of something
    const host = hostOf(room, o);
    if (!host) return null;
    // the floor of an opened box / cupboard: the thing belongs to the lid or door that was opened
    if (host.furn && !host.part) {
      const open = host.furn.parts.filter(p => p.t > .5 && p.key);
      if (open.length) {
        const c = new THREE.Vector3();
        open.sort((a, b) => partDist(a, h.point, c) - partDist(b, h.point, c));
        host.part = open[0]; host.via = open[0].key; host.label = (open[0].label || host.furn.name || '') + ' 안';
      }
    }
    return { ...host, point: h.point.clone() };
  }
  return null;
}

function partDist(p, pt, c) { new THREE.Box3().setFromObject(p.pivots[0]).getCenter(c); return c.distanceTo(pt); }

export function hostOf(room, obj) {
  for (let o = obj; o; o = o.parent) {
    const u = o.userData;
    if (u.part?.key) return { key: 'p:' + u.part.key, node: u.part.pivots[0], part: u.part, furn: u.part.furn, label: u.part.label || u.part.furn?.name || '' };
    if (u.furn) {
      const f = u.furn;
      if (f.rec?.wall || f.rec?.roof) { const di = room.decors.indexOf(f.rec); return di < 0 ? null : { key: 'd:' + di, node: decorNode(f.rec), furn: f, label: f.name || '' }; }
      return f.rec?.id ? { key: 'f:' + f.rec.id, node: f.group, furn: f, label: (f.name || '') + ' 위' } : null;
    }
    if (u.floor) return { key: 'room', node: room.group, label: '바닥' };
    if (u.wall) return null;
  }
  return null;
}

export function resolveHost(room, key, partByKey, via = null) {
  const h = resolveHost0(room, key, partByKey);
  if (h && via && partByKey?.[via]) { h.part = partByKey[via]; h.via = via; h.label = (h.part.label || h.furn?.name || '') + ' 안'; }
  return h;
}
function resolveHost0(room, key, partByKey) {
  if (key === 'room') return { key, node: room.group, label: '바닥' };
  const [t, id] = [key.slice(0, 1), key.slice(2)];
  if (t === 'f') { const r = room.furns.find(x => x.id === id); return r ? { key, node: r.f.group, furn: r.f, label: (r.f.name || '') + ' 위' } : null; }
  if (t === 'd') { const r = room.decors[+id]; return r ? { key, node: decorNode(r), furn: r.f, label: r.f.name || '' } : null; }
  if (t === 'p') { const p = partByKey?.[id]; return p ? { key, node: p.pivots[0], part: p, furn: p.furn, label: p.label || '' } : null; }
  return null;
}

// A room's hosts are local to that zone: the active hide draft may still belong to another room.
export function roofHideDraft(home, zoneId) {
  if (!zoneId) return null;
  return home.hide?.zoneId === zoneId ? home.hide : home.drafts?.[zoneId] || null;
}

// Switching roof styles can replace a bench/planter with a different surface. Release only free points on that roof;
// prepared spots and points on wall decor, furniture and moving parts keep their existing identities.
export function clearRoofFreeItems(room, hide) {
  const rec = room.gptRoof?.rec, index = rec?.roof ? room.decors.indexOf(rec) : -1;
  if (index < 0 || !Array.isArray(hide?.items)) return 0;
  const before = hide.items.length, key = 'd:' + index;
  hide.items = hide.items.filter(e => e.free?.host !== key);
  return before - hide.items.length;
}

// a spot object that the rest of the game (attachItem, parts opening, the planner, the bot) treats like any other
export function makeFreeSpot(host, local, ry = 0) {
  const anchor = new THREE.Object3D(); anchor.position.copy(local); anchor.rotation.y = ry;
  host.node.add(anchor);
  const spot = { kind: host.part ? 'inside' : 'on', free: true, anchor, part: host.part || null, maxH: 9, label: host.label || '어딘가', furn: host.furn || null, item: null, idx: -1, scale: 1, hostKey: host.key };
  if (host.part) host.part.spots.push(spot);
  return spot;
}
export function dropFreeSpot(spot) {
  spot.anchor.parent?.remove(spot.anchor);
  if (spot.part) spot.part.spots = spot.part.spots.filter(s => s !== spot);
}
export function toLocal(host, worldPoint) { host.node.updateWorldMatrix(true, false); return host.node.worldToLocal(worldPoint.clone()); }

// how many of 36 camera angles see this item (its container opened if it has one); 0 = nobody could ever find it
export function viewsOf(world, room, it) {
  const W = world, y0 = W.yaw, p0 = W.pitch, z0 = W.zoom, tg0 = W.target.clone(), part = it.spot.part, t0 = part?.t ?? 0;
  if (part) { part.setOpen(1); it.g.visible = true; }
  let views = 0;
  W.zoom = 1;
  room.group.updateMatrixWorld(true); W.target.copy(new THREE.Box3().setFromObject(it.g).getCenter(new THREE.Vector3()));
  for (const p of [.4, .7, 1.05]) for (let k = 0; k < 12; k++) {
    W.yaw = k * Math.PI / 6; W.pitch = p; W.updateCam(); room.update(1); room.group.updateMatrixWorld(true);
    const c = new THREE.Box3().setFromObject(it.g).getCenter(new THREE.Vector3());
    if (!W.occluded(it.g, c, [room.group])) views++;
  }
  if (part) { part.setOpen(t0); it.g.visible = t0 > .05; }
  W.yaw = y0; W.pitch = p0; W.zoom = z0; W.target.copy(tg0); W.updateCam(); room.update(1);
  return views;
}

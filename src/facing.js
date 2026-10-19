// 벽을 보는 서랍·자물쇠 막기 (user 10/19, 1~10판을 폰으로 해 보고: 9판 "바구니 자물쇠가 벽 쪽에 있어서 자물쇠가 걸린지도
// 모르겠더라", 10판 "안내데스크도 벽 쪽으로 서랍이 열림.. 미친 거 아님?"): a part whose front — where its lock hangs,
// where its drawer slides out — looks into a wall close by is never given a lock, and nothing to find goes inside it. The
// front is the furniture's own +z (every builder faces its doors, drawers and lock plate that way); a short ray from the
// front of the piece along it that meets a wall within REACH marks the piece. Runs once on the built room, before the
// planner; marks part.wallFacing (and furn.wallFacing). The same test lists every such piece for the level sessions
// (facingReport). ?facing=0 turns the guard off.
import * as THREE from 'three';

const ON = typeof location === 'undefined' || !/[?&]facing=0(&|$)/.test(location.search);
const REACH = .3;   // (a front closer than this to a wall: the drawer opens into it, the lock plate is pressed against it)
const SIDEWAYS = new Set(['door', 'drawer', 'slide', 'shutter', 'hatch']);   // parts that open out of the front (a lid or a lifted cushion opens upward: only its lock plate faces the wall)

export function markWallFacing(room) {
  const out = [];
  if (!ON || !room) return out;
  const rooms = room.rooms || [room];
  room.group.updateMatrixWorld(true);
  const walls = []; room.group.traverse(o => { if (o.isMesh && o.userData.wall) walls.push(o); });
  if (!walls.length) return out;
  const rc = new THREE.Raycaster(), q = new THREE.Quaternion(), dir = new THREE.Vector3(), box = new THREE.Box3(), c = new THREE.Vector3(), size = new THREE.Vector3();
  for (const R of rooms) for (const rec of R.furns || []) {
    const f = rec.f; if (!f?.parts?.length) continue;
    const parts = f.parts.filter(p => p.spots?.length || p.lockable);
    if (!parts.length) continue;
    f.group.getWorldQuaternion(q); dir.set(0, 0, 1).applyQuaternion(q); dir.y = 0; if (dir.lengthSq() < 1e-6) continue; dir.normalize();
    box.setFromObject(f.group); box.getCenter(c); box.getSize(size);
    // from the middle of the piece at knee height, out through its front face
    const half = Math.abs(dir.x) * size.x / 2 + Math.abs(dir.z) * size.z / 2;
    const o = new THREE.Vector3(c.x, Math.min(box.max.y - .05, box.min.y + .35), c.z);
    rc.set(o, dir); rc.far = half + REACH;
    const hit = rc.intersectObjects(walls, false)[0];
    if (!hit) continue;
    // a door or drawer: no lock, nothing inside; a lid: only no lock (its plate is on the front)
    let any = false;
    for (const p of parts) { if (SIDEWAYS.has(p.kind)) { p.wallFacing = true; any = true; } else if (p.lockable) { p.lockWallFacing = true; any = true; } }
    if (!any) continue;
    f.wallFacing = true;
    out.push({ type: f.type, at: [rec.i, rec.j], rot: rec.rot, gap: +(hit.distance - half).toFixed(2), parts: parts.filter(p => p.wallFacing || p.lockWallFacing).map(p => (p.label || p.kind) + (p.wallFacing ? '' : '(자물쇠만)')) });
  }
  return out;
}

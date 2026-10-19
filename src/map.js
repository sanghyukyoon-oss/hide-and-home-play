// A stage map made of several grid rooms: side by side (joined by doorway walls) and/or stacked in floors
// (basement −1, ground 0, upper 1…). It exposes the parts of the Room interface the stage, planner and bot use,
// so a one-room stage and a whole house go through the same code.
//   def: { rooms: [{ layout, at: [x, z], level }], friendAt: [x, z, level?], ... }   (layout = a LAYOUTS-style room)
import * as THREE from 'three';
import { Room, makeApron } from './room.js';
import { rbox, put, shade } from './gfx/kit.js';

export const FLOOR_H = 2.9;

export class MapRooms {
  constructor(world, def) {
    this.world = world; this.def = def; this.L = def; this.T = def.theme || def.rooms[0].layout.theme;
    this.group = new THREE.Group(); this.rooms = [];
    const minLevel = Math.min(...def.rooms.map(r => r.level || 0));
    const lv = r => r.level || 0, solid = (r, q) => { const k = r.layout.walls?.[q] || 'wall'; return k === 'wall' || k === 'door'; };
    for (const r of def.rooms) {
      // a side left open onto a neighbour whose wall stands there: start this room's walls after that wall
      const join = {};
      for (const q of def.rooms) {
        if (q === r || lv(q) !== lv(r)) continue;
        const [rx, rz] = r.at, [qx, qz] = q.at, rw = r.layout.w / 2, rd = r.layout.d / 2, qw = q.layout.w / 2, qd = q.layout.d / 2;
        const zOver = Math.min(rz + rd, qz + qd) - Math.max(rz - rd, qz - qd) > .5, xOver = Math.min(rx + rw, qx + qw) - Math.max(rx - rw, qx - qw) > .5;
        if (zOver && Math.abs((qx + qw) - (rx - rw)) < .01 && solid(q, 'E') && !solid(r, 'W')) join.W = true;
        if (zOver && Math.abs((qx - qw) - (rx + rw)) < .01 && solid(q, 'W') && !solid(r, 'E')) join.E = true;
        if (xOver && Math.abs((qz + qd) - (rz - rd)) < .01 && solid(q, 'S') && !solid(r, 'N')) join.N = true;
        if (xOver && Math.abs((qz - qd) - (rz + rd)) < .01 && solid(q, 'N') && !solid(r, 'S')) join.S = true;
      }
      // every floor's slab is one piece built below (per-room slabs overlapped where rooms meet)
      const lay = { ...r.layout, join, slab: r.layout.slab || 'none' };
      const room = new Room(world, lay);
      room.group.position.set(r.at[0], (r.level || 0) * FLOOR_H, r.at[1]);
      room.level = r.level || 0; room.at = r.at;
      this.group.add(room.group); this.rooms.push(room);
    }
    // a door or lid in one room must not swing into the next room's wall either (10/19 겹침 QA: 36·40판 세탁기 문, 54·59판
    // 이끼 뭉치 went 8 cm into the neighbour's wall): each room fits its parts again with the other rooms' wall pieces
    this.group.updateMatrixWorld(true);
    const wallBoxes = R => Object.values(R.walls).flatMap(Wl => { const out = []; Wl.body.traverse(o => { if (o.isMesh) out.push(new THREE.Box3().setFromObject(o).expandByScalar(-.02)); }); return out; }).filter(b => !b.isEmpty());
    for (const R of this.rooms) { R.shellBoxes = this.rooms.filter(q => q !== R && q.level === R.level).flatMap(wallBoxes); if (R.shellBoxes.length) R.fitParts(); }
    // one cake slab per ground-level block of rooms (upper floors bring their own thin slab)
    const box = this.box = new THREE.Box3();
    for (const R of this.rooms) {
      const [x, z] = R.at, y = R.level * FLOOR_H;
      box.expandByPoint(new THREE.Vector3(x - R.w / 2, y, z - R.d / 2)); box.expandByPoint(new THREE.Vector3(x + R.w / 2, y + 2.5, z + R.d / 2));
    }
    const base = this.rooms.filter(R => R.level === Math.min(...this.rooms.map(q => q.level)));
    const b0 = new THREE.Box3(); for (const R of base) { b0.expandByPoint(new THREE.Vector3(R.at[0] - R.w / 2, 0, R.at[1] - R.d / 2)); b0.expandByPoint(new THREE.Vector3(R.at[0] + R.w / 2, 0, R.at[1] + R.d / 2)); }
    const sx = b0.max.x - b0.min.x, sz = b0.max.z - b0.min.z, cx = (b0.min.x + b0.max.x) / 2, cz = (b0.min.z + b0.max.z) / 2, y0 = base[0].level * FLOOR_H;
    const T = base[0].T, og = {};
    if (def.bleed) {
      const ap = makeApron(sx, sz, base[0].floorTexture || null, T); ap.position.set(cx, y0 - .004, cz); this.group.add(ap);
    } else {
      const s1 = put(rbox(sx + .5, .36, sz + .5, T.base, .16), cx, y0 - .2, cz), s2 = put(rbox(sx + .62, .2, sz + .62, shade(T.base, -.08), .1), cx, y0 - .4, cz);
      s1.userData.og = og; s2.userData.og = og;
      this.group.add(s1, s2);
    }
    this.levels = [...new Set(this.rooms.map(R => R.level))].sort((a, b) => a - b);
    // upper floors: one thin slab under all of that floor's rooms
    for (const L of this.levels) {
      if (L === base[0].level) continue;
      const rs = this.rooms.filter(R => R.level === L && !def.rooms[this.rooms.indexOf(R)].layout.slab), b = new THREE.Box3();
      if (!rs.length) continue;
      for (const R of rs) { b.expandByPoint(new THREE.Vector3(R.at[0] - R.w / 2, 0, R.at[1] - R.d / 2)); b.expandByPoint(new THREE.Vector3(R.at[0] + R.w / 2, 0, R.at[1] + R.d / 2)); }
      const sl = put(rbox(b.max.x - b.min.x + .5, .36, b.max.z - b.min.z + .5, rs[0].T.base, .16), (b.min.x + b.max.x) / 2, L * FLOOR_H - .2, (b.min.z + b.max.z) / 2);
      sl.userData.og = {}; this.group.add(sl);
    }
  }
  get w() { return this.box.max.x - this.box.min.x; }
  get d() { return this.box.max.z - this.box.min.z; }
  get center() { return this.box.getCenter(new THREE.Vector3()); }
  get spots() { return this.rooms.flatMap(R => R.spots); }
  get parts() { return this.rooms.flatMap(R => R.parts); }
  get furns() { return this.rooms.flatMap(R => R.furns); }
  get decors() { return this.rooms.flatMap(R => R.decors); }
  get floorMesh() { return this.rooms[0].floorMesh; }
  get doorDecor() { return this.rooms.find(R => R.doorDecor)?.doorDecor; }
  set allDown(v) { for (const R of this.rooms) R.allDown = v; }
  update(dt) { for (const R of this.rooms) R.update(dt); }
  clearAt(x, z, r = .3) { return this.rooms.every(R => R.clearAt(x, z, r)); }
  // world position of a room-local point
  toWorld(R, v) { return v.clone().add(R.group.position); }
}

// helpers so map definitions read like the single-room LAYOUTS
export const room = (layout, x, z, level = 0) => ({ layout, at: [x, z], level });

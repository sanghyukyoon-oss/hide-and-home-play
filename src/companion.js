// The player's own character (몽글이; the friend picked in the 도감 walks beside it — save.hero) walking around the stage with you: it trails the middle of
// the view a step behind — when you move or turn, it hops after you along free floor tiles, never through furniture or
// the other characters. It is never pickable, so it can't block a tap on a hidden thing behind it.
import * as THREE from 'three';
import { Char, CHAR_DEFS } from './gfx/chars.js';
import { ECON, ownedFriends } from './econ.js';

// Between two rooms of a map you pass only through a doorway or an open side — never through a wall (the walk grid,
// the boss runner and the seeker's eyes all use this; before, everyone walked and looked straight through walls).
const SOLID = new Set(['wall', 'alleywall', 'fence', 'hedge', 'cliff', 'rail']);
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
export function crossOK(A, B, x, z) {
  if (A === B) return true;
  const a = A.group.position, b = B.group.position, dx = b.x - a.x, dz = b.z - a.z;
  const side = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'E' : 'W') : (dz > 0 ? 'S' : 'N');
  const ka = A.L.walls?.[side] || 'wall', kb = B.L.walls?.[OPP[side]] || 'wall';
  if (SOLID.has(ka) || SOLID.has(kb)) return false;
  for (const [R, k, kind] of [[A, side, ka], [B, OPP[side], kb]]) {
    if (kind !== 'door') continue;
    const o = R.group.position, u = R.L.doorAt?.[k] ?? 0;
    const gap = k === 'E' ? o.z + u : k === 'W' ? o.z - u : k === 'N' ? o.x + u : o.x - u, along = k === 'E' || k === 'W' ? z : x;
    if (Math.abs(along - gap) > .5) return false;
  }
  return true;
}
// The sides of the rooms that stand (a wall, a rail, a fence, a hedge, a cliff — a doorway's or a rail's gap is open), with
// how far their pieces reach into the room and out of it near the floor: bodies keep WALL_GAP off them (10/19 겹침 QA, user
// on 6판: "벽에 걸려 있는 애들 있어" — the walk grid reached .25 m from a wall: 7판 몽글이 12 cm from the balcony rail, the
// friend you bring 21–25 cm, the host 21 cm from a hedge, walkers 22–34 cm from a cliff)
export const WALL_GAP = .35;
export function wallSides(rooms) {
  const out = [], v = new THREE.Vector3();
  for (const R of rooms) {
    R.group.updateMatrixWorld(true);
    const o = R.group.getWorldPosition(new THREE.Vector3()), inv = R.group.matrixWorld.clone().invert();
    for (const k of ['N', 'S', 'W', 'E']) {
      const kind = R.L.walls?.[k] || 'wall'; if (kind === 'none' || !R.walls?.[k]) continue;
      const ns = k === 'N' || k === 'S', len = ns ? R.w : R.d, half = (ns ? R.d : R.w) / 2, sgn = k === 'N' || k === 'W' ? -1 : 1;
      let inw = 0, outw = .16;
      R.walls[k].body.traverse(m => {
        if (!m.isMesh) return;
        const pos = m.geometry.attributes.position, st = Math.max(1, Math.floor(pos.count / 400));
        for (let i = 0; i < pos.count; i += st) {
          v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv);
          if (v.y < .05 || v.y > .9) continue;
          const c = (ns ? v.z : v.x) * sgn - half;   // + outside the room, − inside
          if (-c > inw && -c < .8) inw = -c; if (c > outw && c < .8) outw = c;
        }
      });
      const open = [], gap = (u, hw) => { const c = k === 'E' || k === 'N' ? u : -u; open.push([c - hw + .1, c + hw - .1]); };
      if (kind === 'door') gap(R.L.doorAt?.[k] ?? 0, .58);
      if (kind === 'rail') for (const u of R.L.railGaps?.[k] || []) gap(u, .5);
      out.push({ ns, sgn, half, len, ox: o.x, oz: o.z, y: o.y, inw, outw, open });
    }
  }
  return out;
}
export function offWall(sides, x, y, z, m = WALL_GAP) {
  for (const S of sides) {
    if (Math.abs(S.y - y) > .5) continue;
    const px = x - S.ox, pz = z - S.oz, along = S.ns ? px : pz, c = (S.ns ? pz : px) * S.sgn - S.half;
    if (Math.abs(along) > S.len / 2 + m || S.open.some(([a, b]) => along > a && along < b)) continue;
    if (c <= 0 ? -c < S.inw + m : c - S.outw < m) return false;
  }
  return true;
}
// walkable points every half tile on the floor (not a cut-out or a raised step) with room for a body, each with its
// neighbours (one step apart, clear floor between)
// opts.raised: raised platforms count as floor one step up (the boss runner and seeker climb them)
export function walkGrid(rooms, r = .26, opts = null) {
  const tiles = [], sides = wallSides(rooms);
  // furniture of the other rooms that reaches into this one's air (a slide from the floor below up onto a balcony: 7판 몽글이
  // stood on its top — 겹침 QA 10/19), with the height it spans
  const others = rooms.map(R => rooms.filter(Q => Q !== R).flatMap(Q => Q.furns.filter(e => e.type !== 'rug').map(e => new THREE.Box3().setFromObject(e.f.group, true))));
  const inOther = (k, x, y, z) => others[k].some(b => b.min.y < y + .6 && b.max.y > y + .05 && Math.max(b.min.x - x, 0, x - b.max.x) ** 2 + Math.max(b.min.z - z, 0, z - b.max.z) ** 2 < r * r);
  for (const [k, R] of rooms.entries()) {
    R.group.updateMatrixWorld(true); const o = R.group.position;
    for (let gz = .25; gz < R.d; gz += .5) for (let gx = .25; gx < R.w; gx += .5) {
      const i = Math.floor(gx), j = Math.floor(gz);
      const hh = R.heightAt?.(i, j) || 0;
      if (R.isCut?.(i, j) || (hh && !opts?.raised)) continue;
      const x = o.x + gx - R.w / 2, z = o.z + gz - R.d / 2;
      if (R.clearAt(x, z, r, opts) && offWall(sides, x, o.y + hh, z) && !inOther(k, x, o.y + hh, z)) tiles.push({ x, z, y: o.y + hh, R });
    }
  }
  const climb = opts?.raised ? .38 : .05;
  for (const t of tiles) t.nb = tiles.filter(u => u !== t && Math.abs(u.y - t.y) < climb && Math.hypot(u.x - t.x, u.z - t.z) < .75
    && t.R.clearAt((t.x + u.x) / 2, (t.z + u.z) / 2, r - .02, opts) && crossOK(t.R, u.R, (t.x + u.x) / 2, (t.z + u.z) / 2));
  // stairs between floors: a chain of steps up the treads, joined to the floor in front and the landing above
  // (stairsup rises one storey over its 3 tiles, high end at -z)
  for (const R of rooms) for (const rec of R.furns) {
    if (rec.type !== 'stairsup' || rec.rot) continue;
    const c = R.tileToWorld(rec.i, rec.j, 1, 3), o = R.group.position, x = o.x + c.x, zc = o.z + c.z, chain = [];
    for (let k = 0; k < 6; k++) { const z = zc + 1.25 - k * .5; chain.push({ x, z, y: o.y + 2.9 * (1.5 - (z - zc)) / 3, R, nb: [], stair: true }); }
    chain.forEach((t, k) => { if (k) { t.nb.push(chain[k - 1]); chain[k - 1].nb.push(t); } });
    const near = (p, y) => tiles.filter(u => Math.abs(u.y - y) < .05 && Math.hypot(u.x - p.x, u.z - p.z) < 1.1).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    const foot = near(chain[0], o.y), top = near(chain[5], o.y + 2.9);
    if (!foot || !top) continue;
    chain[0].nb.push(foot); foot.nb.push(chain[0]); chain[5].nb.push(top); top.nb.push(chain[5]);
    tiles.push(...chain);
  }
  return tiles;
}
// breadth-first route over walkGrid tiles (excluding the ones in block); null when there is no way
export function gridPath(from, to, block = new Set()) {
  const prev = new Map([[from, null]]), q = [from];
  while (q.length) { const t = q.shift(); if (t === to) break; for (const u of t.nb) if (!prev.has(u) && !block.has(u)) { prev.set(u, t); q.push(u); } }
  if (!prev.has(to)) return null;
  const out = []; for (let t = to; t && t !== from; t = prev.get(t)) out.unshift(t);
  return out;
}
// a world point is seen from the camera as it is now: on screen (inside rect when given) with nothing of roots in front of it
export function seenAt(W, v, roots, rect = null) {
  const s = W.toScreen(v);
  if (rect ? s.x < rect.x0 || s.x > rect.x1 || s.y < rect.y0 || s.y > rect.y1 : s.x < 0 || s.x > W.W || s.y < 0 || s.y > W.H) return false;
  const hit = W.pick(s.x, s.y, roots).find(q => !q.object.userData.proxy);
  return !hit || hit.distance >= W.raycaster.ray.origin.distanceTo(v) - .08;
}
export const nearestTile = (tiles, x, z, avoid) => { let b = null, bd = 1e9; for (const t of tiles) { if (avoid?.has(t)) continue; const d = (t.x - x) ** 2 + (t.z - z) ** 2; if (d < bd) { bd = d; b = t; } } return b; };

const STAY = true;   // 몽글이 (and the friend you bring) stay at their first spot — 10/19 user
export class Companion {
  // rooms: the stage's Room(s); others(): characters to keep clear of
  constructor(G, rooms, others) {
    this.G = G; this.others = others;
    // walkable points every half tile: on the floor (not a cut-out or a raised step), clear of furniture for a body
    const tiles = this.tiles = walkGrid(rooms);
    // (10/19 user, phone: "주인공 따라다니지 말고 가만있기로 하지 않았음?" — the friend is put next to 몽글이 when the stage starts
    // and then stays where it is; only 몽글이 pops up at the screen's edge, as decided 10/18)
    // 같이 다니는 친구 (10/19, user OK; 스토리 룸): 몽글이 always walks — the script's 몽글이 lines stay on 몽글이 — and the friend
    // picked in the 도감 (save.hero) walks beside it. A friend who is in this stage already (its host, a friend hiding here)
    // stays home that day: never two of the same one in a room.
    const want = CHAR_DEFS[G.save.hero] && G.save.hero !== 'mong' && (!ECON || ownedFriends(G.save.home).has(G.save.hero)) ? G.save.hero : null;   // (친구 부르기: a friend you've called home)
    const cast = new Set((others?.() || []).map(c => c?.kind).filter(Boolean));
    this.ch = new Char('mong'); this.on = true; this.busy = false; this.wait = .6;
    // (10/19 user: 2판 몽글이 started on top of 토순이 — it stays where it starts since v144, so start a body's width or more
    // from everyone: tiles within 1.1 m of another character are out, then the usual .6, then anything)
    const far = new Set(); for (const o of others()) { const q = o.root.position; for (const t of tiles) if (Math.hypot(t.x - q.x, t.z - q.z) < 1.1) far.add(t); }
    // (10/19 겹침 QA: 7판 it stood wholly behind the slide, 12판 behind the desk — and stays there) the stage frames its start
    // view first; the spot nearest the middle of it where you can see 몽글이 wins, then as before
    const W = G.world; this.roots = [...rooms.map(R => R.group), ...others().map(o => o.root)];
    const start = this.inView(W, far) || this.nearest(W.target.x, W.target.z, far) || this.nearest(W.target.x, W.target.z, this.taken()) || this.nearest(W.target.x, W.target.z) || tiles[0];
    this.t = start; this.ch.root.position.set(start.x, start.y || 0, start.z);
    this.ch.root.rotation.y = Math.atan2(W.cam.position.x - start.x, W.cam.position.z - start.z);
    W.root.add(this.ch.root); W.idsDirty = true;
    this.buddy = want && !cast.has(want) ? new Char(want) : null; this.resting = !!want && !this.buddy;
    if (this.buddy) { W.root.add(this.buddy.root); this.besideHero(W); }
  }
  // the buddy on free floor next to 몽글이 (half a step to a step away, same level), facing you; none → it waits out of sight
  besideHero(W) {
    const b = this.buddy; if (!b) return null;
    const h = this.t, taken = this.taken(); let best = null, bd = Infinity;
    const roots = [...(this.roots || []), this.ch.root];   // (seen from the start view too, not behind a stool or 몽글이 — 겹침 QA 10/19: 8·12·18판)
    // nor standing in front of 몽글이 as you look (beside it, or behind it a little to one side)
    const rx = Math.cos(W.yaw), rz = -Math.sin(W.yaw), fx = Math.sin(W.yaw), fz = Math.cos(W.yaw);
    for (const t of this.tiles) {
      if (t === h || t.stair || taken.has(t) || Math.abs((t.y || 0) - (h.y || 0)) > .05) continue;
      const d = Math.hypot(t.x - h.x, t.z - h.z); if (d < .6 || d > 1.7) continue;   // (.5 had the two touching — 44·51판)
      // (a step and a half away only when nothing nearer can be seen — 겹침 QA 10/20: 7판 every spot within 1.2 m was behind the slide)
      const far = d > 1.2, seen = this.seen(W, t, roots); if (far && !seen) continue;
      const side = Math.abs((t.x - h.x) * rx + (t.z - h.z) * rz), front = (t.x - h.x) * fx + (t.z - h.z) * fz > 0;
      const s = (far ? 4 + d - 1.2 : Math.abs(d - .75)) + (seen ? 0 : 5) + (front && side < .45 ? 3 : 0); if (s < bd) { bd = s; best = t; }
    }
    b.root.visible = !!best;
    if (best) { b.root.position.set(best.x, best.y || 0, best.z); b.root.rotation.y = Math.atan2(W.cam.position.x - best.x, W.cam.position.z - best.z); W.idsDirty = true; }
    return best;
  }
  // a body standing on t is seen from the camera as it is now: its middle and its head on screen (clear of the bars) and
  // nothing of the room (or anyone) in front of them
  seen(W, t, roots = this.roots) {
    if (!roots?.length) return true;
    const r = this.rect(W), v = new THREE.Vector3();
    for (const hgt of [.2, .42]) if (!seenAt(W, v.set(t.x, (t.y || 0) + hgt, t.z), roots, r)) return false;
    return true;
  }
  // the free spot nearest the middle of the start view that the view sees (the nearest 60 tried, 200 ms at most — it runs
  // while the stage loads); null when none
  inView(W, avoid = new Set()) {
    const c = W.target, t0 = performance.now(), list = this.tiles.filter(t => !t.stair && !avoid.has(t)).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z));
    for (const t of list.slice(0, 60)) { if (this.seen(W, t)) return t; if (performance.now() - t0 > 200) break; }
    return null;
  }
  nearest(x, z, avoid = new Set()) {
    let b = null, bd = 1e9;
    for (const t of this.tiles) { if (avoid.has(t)) continue; const d = (t.x - x) ** 2 + (t.z - z) ** 2; if (d < bd) { bd = d; b = t; } }
    return b;
  }
  // the free spot nearest the middle of the screen — measured from the line of sight, so looking up at a balcony
  // picks the balcony, not the floor underneath it
  nearestView(W, avoid = new Set()) {
    const c = W.cam.position, d = new THREE.Vector3().subVectors(W.target, c).normalize(), v = new THREE.Vector3();
    let b = null, bd = 1e9;
    for (const t of this.tiles) {
      if (avoid.has(t) || t.stair) continue;
      v.set(t.x - c.x, (t.y || 0) + .3 - c.y, t.z - c.z);
      const along = v.dot(d), dd = v.lengthSq() - along * along;
      if (dd < bd) { bd = dd; b = t; }
    }
    return b;
  }
  // tiles someone else is standing on (or about to)
  taken() {
    const s = new Set();
    for (const o of this.others()) { const p = o.root.position; for (const t of this.tiles) if (Math.hypot(t.x - p.x, t.z - p.z) < .6) s.add(t); }
    return s;
  }
  path(from, to, block) { return gridPath(from, to, block); }
  // It used to trail the middle of the view, hopping after every move and turn — eye-catching motion nobody asked for
  // while you look for things (user, 10/18: "이동하면 내 캐릭터가 따라가잖아. 응근 거슬리는데"). Now it stays where it is;
  // once the view has settled (no finger on the glass or the dial, the camera still for .4 s) and it is out of sight,
  // it pops up at the nearest edge of the screen. It moves otherwise only to react (react()).
  update(dt, tw, paused) {
    if (!this.on) return;
    this.ch.update(dt); this.buddy?.update(dt);
    if (this.busy || paused) return;
    const W = this.G.world, key = [W.yaw, W.pitch, W.zoom, W.target.x, W.target.z].map(v => v.toFixed(3)).join();
    const still = !W.ptrs?.size && !W._tdHeld && !W.flying && key === this._key;
    this._key = key; this._still = still ? (this._still || 0) + dt : 0;
    if (this._still < .4 || this.inSight(W)) return;
    // (10/19 user, phone: "몽글이 왜 여적 따라댕겨, 자꾸 스폰돼서 쳐다보게 됨 — 처음 스폰 위치 고정") it stays where the stage put it;
    // no pop-in at the screen's edge any more (popIn kept for reference)
    if (STAY) return;
    this.popIn(W, tw);
  }
  // the part of the screen it should stand in: clear of the top bar, the list and the dial at the bottom
  rect(W) { return { x0: 28, x1: W.W - 28, y0: 110, y1: W.H - 190 }; }
  inSight(W) {
    const p = this.ch.root.position, s = W.toScreen(new THREE.Vector3(p.x, p.y + .3, p.z)), r = this.rect(W);
    return s.x >= r.x0 - 20 && s.x <= r.x1 + 20 && s.y >= r.y0 - 30 && s.y <= r.y1 + 40;
  }
  // pop up on free floor nearest the edge it went out by (its screen point pulled back inside), facing you
  popIn(W, tw) {
    const p = this.ch.root.position, s = W.toScreen(new THREE.Vector3(p.x, p.y + .3, p.z)), r = this.rect(W);
    const qx = Math.min(r.x1 - 30, Math.max(r.x0 + 30, s.x)), qy = Math.min(r.y1 - 20, Math.max(r.y0 + 20, s.y));
    const block = this.taken(); block.delete(this.t);
    if (this.buddy?.root.visible) { const bp = this.buddy.root.position; for (const t of this.tiles) if (Math.hypot(t.x - bp.x, t.z - bp.z) < .6) block.add(t); }   // (not onto the friend, who stays put)
    let best = null, bd = Infinity; const v = new THREE.Vector3();
    for (const t of this.tiles) {
      if (block.has(t) || t.stair) continue;
      const q = W.toScreen(v.set(t.x, (t.y || 0) + .3, t.z));
      if (q.x < r.x0 || q.x > r.x1 || q.y < r.y0 || q.y > r.y1) continue;
      const d = (q.x - qx) ** 2 + (q.y - qy) ** 2; if (d < bd) { bd = d; best = t; }
    }
    if (!best) { this._still = 0; return; }   // no free floor on screen (zoomed into a wall): try again after the next move
    this.busy = true; this.t = best;
    const root = this.ch.root, s0 = root.scale.x;
    root.position.set(best.x, best.y || 0, best.z);
    root.rotation.y = Math.atan2(W.cam.position.x - best.x, W.cam.position.z - best.z);
    root.scale.setScalar(s0 * .01); this.G.world.idsDirty = true;
    const sp = W.toScreen(new THREE.Vector3(best.x, (best.y || 0) + .25, best.z));
    W.fx.burst(sp.x, sp.y, { n: 7, shape: 'circle', colors: ['#ffffff', '#ffeaf2'], speed: 90, gravity: -20, life: .45, size: 8 });
    this.G.audio.sfx('pop', 3);
    tw.run(.28, k => root.scale.setScalar(s0 * (k < .7 ? k / .7 * 1.12 : 1.12 - .12 * (k - .7) / .3))).then(() => { root.scale.setScalar(s0); this.busy = false; this._still = 0; });
  }
  // a find ('find': looks at it, a happy hop) or something happening ('event': looks at it, 'wow', a small jump)
  async react(kind, at, tw) {
    if (!this.on || this.busy) return;
    const ch = this.ch, root = ch.root, p = root.position;
    this.busy = true;
    try {
      if (at) { const r0 = root.rotation.y; let d = Math.atan2(at.x - p.x, at.z - p.z) - r0; d = Math.atan2(Math.sin(d), Math.cos(d)); await tw.run(.18, k => { root.rotation.y = r0 + d * k; }); }
      const face0 = ch.face;
      ch.setFace(kind === 'find' ? 'happy' : 'wow');
      const B = this.buddy; if (B?.root.visible) { if (at) B.faceTo(at.x, at.z); B.bump(.35); }
      if (kind === 'find') await ch.hopTo(tw, p.x, p.z, { height: .2, dur: .3 }); else ch.bump(.45);
      await tw.wait(kind === 'find' ? .7 : .9);
      if (this.on) ch.setFace(face0 === 'wow' || face0 === 'happy' ? 'normal' : face0);
    } finally { this.busy = false; this._still = 0; }
  }
  async walk(route, tw) {
    this.busy = true;
    for (const t of route) {
      if (!this.on) break;
      const p = this.ch.root.position;
      // unhurried bouncy hops with a tiny pause on landing: it toddles after you rather than dashing (user, 10/17)
      const y0 = p.y, y1 = t.y || 0;
      if (y1 !== y0) tw.run(.3, k => { p.y = y0 + (y1 - y0) * k; });   // up or down a stair as it hops
      await this.ch.hopTo(tw, t.x, t.z, { height: .17, dur: .3 });
      this.t = t; p.y = y1;
      await tw.wait(.06);
    }
    this.busy = false; this.wait = .6;
  }
  dispose() { this.on = false; this.ch.root.parent?.remove(this.ch.root); this.buddy?.root.parent?.remove(this.buddy.root); }
}

// The player's own character (몽글이 by default, save.hero) walking around the stage with you: it trails the middle of
// the view a step behind — when you move or turn, it hops after you along free floor tiles, never through furniture or
// the other characters. It is never pickable, so it can't block a tap on a hidden thing behind it.
import * as THREE from 'three';
import { Char, CHAR_DEFS } from './gfx/chars.js';

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
// walkable points every half tile on the floor (not a cut-out or a raised step) with room for a body, each with its
// neighbours (one step apart, clear floor between)
// opts.raised: raised platforms count as floor one step up (the boss runner and seeker climb them)
export function walkGrid(rooms, r = .26, opts = null) {
  const tiles = [];
  for (const R of rooms) {
    R.group.updateMatrixWorld(true); const o = R.group.position;
    for (let gz = .25; gz < R.d; gz += .5) for (let gx = .25; gx < R.w; gx += .5) {
      const i = Math.floor(gx), j = Math.floor(gz);
      const hh = R.heightAt?.(i, j) || 0;
      if (R.isCut?.(i, j) || (hh && !opts?.raised)) continue;
      const x = o.x + gx - R.w / 2, z = o.z + gz - R.d / 2;
      if (R.clearAt(x, z, r, opts)) tiles.push({ x, z, y: o.y + hh, R });
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
export const nearestTile = (tiles, x, z, avoid) => { let b = null, bd = 1e9; for (const t of tiles) { if (avoid?.has(t)) continue; const d = (t.x - x) ** 2 + (t.z - z) ** 2; if (d < bd) { bd = d; b = t; } } return b; };

export class Companion {
  // rooms: the stage's Room(s); others(): characters to keep clear of
  constructor(G, rooms, others) {
    this.G = G; this.others = others;
    // walkable points every half tile: on the floor (not a cut-out or a raised step), clear of furniture for a body
    const tiles = this.tiles = walkGrid(rooms);
    const kind = CHAR_DEFS[G.save.hero] ? G.save.hero : 'mong';
    this.ch = new Char(kind); this.on = true; this.busy = false; this.wait = .6;
    const W = G.world, start = this.nearest(W.target.x, W.target.z) || tiles[0];
    this.t = start; this.ch.root.position.set(start.x, start.y || 0, start.z);
    this.ch.root.rotation.y = Math.atan2(W.cam.position.x - start.x, W.cam.position.z - start.z);
    W.root.add(this.ch.root); W.idsDirty = true;
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
  update(dt, tw, paused) {
    if (!this.on) return;
    this.ch.update(dt);
    if (this.busy || paused) return;
    this.wait -= dt; if (this.wait > 0) return;
    this.wait = .25;
    const W = this.G.world, block = this.taken();
    block.delete(this.t);
    // aim a little in front of the middle of the view, so it stays in sight rather than under the HUD
    const goal = this.nearestView(W, block);
    if (!goal || goal === this.t || (Math.abs((goal.y || 0) - (this.t.y || 0)) < .5 && Math.hypot(goal.x - this.t.x, goal.z - this.t.z) < 1.4)) return;
    const route = this.path(this.t, goal, block);
    if (!route?.length) return;
    // a few hops at a time — but once on the stairs, on to the far landing whatever the view does next
    let n = Math.min(4, route.length);
    while (n < route.length && (route[n - 1].stair || route[n]?.stair)) n++;
    this.walk(route.slice(0, n), tw);
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
  dispose() { this.on = false; this.ch.root.parent?.remove(this.ch.root); }
}

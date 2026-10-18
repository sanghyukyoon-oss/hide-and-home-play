// A diorama room: floor slab, 4 walls with Sims-style cutaway, grid-placed furniture, wall decor, hiding spots.
import * as THREE from 'three';
import { rbox, put, grp, mat, mesh, geo, canvasTex, shade, plane, sph } from './gfx/kit.js';
import { makeFurniture, FURN_INFO } from './gfx/furniture.js';
import { clamp } from './util.js';
import { houseRail, gableTop, timberFrame } from './gfx/house-props.js';

const WALL_H = 2.5, WALL_T = .16;
// for each wall: the side walls at its local -x and +x ends
const WALL_ENDS = { N: ['W', 'E'], S: ['E', 'W'], W: ['S', 'N'], E: ['N', 'S'] };
const KNEE = .42;   // height a cut-away wall keeps
const WALLS = {
  N: { rot: 0, n: new THREE.Vector3(0, 0, 1) },
  W: { rot: Math.PI / 2, n: new THREE.Vector3(1, 0, 0) },
  S: { rot: Math.PI, n: new THREE.Vector3(0, 0, -1) },
  E: { rot: -Math.PI / 2, n: new THREE.Vector3(-1, 0, 0) },
};

// Outdoor kit (ground textures + boundary pieces) is injected by main.js from gfx/outdoor.js when present.
let OUTDOOR = null;
export function setOutdoorKit(kit) { OUTDOOR = kit; }
const TALL = { wall: true, alleywall: true, fence: true, hedge: true, cliff: true };

function noiseGround(a, b, dots = 120, r0 = 3, r1 = 9) {
  return canvasTex(512, 512, (c, W, H) => {
    c.scale(2, 2); const w = W / 2, h = H / 2;
    c.fillStyle = a; c.fillRect(0, 0, w, h);
    let s = 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
    c.fillStyle = b;
    for (let i = 0; i < dots; i++) { c.globalAlpha = .25 + R() * .35; c.beginPath(); c.ellipse(R() * w, R() * h, r0 + R() * (r1 - r0), (r0 + R() * (r1 - r0)) * .6, R() * 3, 0, 7); c.fill(); }
    c.globalAlpha = 1;
  });
}
function floorTex(kind, a, b, T = null) {
  if (['grass', 'sand', 'asphalt', 'brickpave', 'dirt'].includes(kind)) {
    if (OUTDOOR?.groundTex) { try { return OUTDOOR.groundTex(kind, T || { floor: a, floor2: b }); } catch {} }
    return noiseGround(a, b, kind === 'grass' ? 160 : 90);
  }
  if (kind === 'checker') return canvasTex(512, 512, (c, W, H) => { c.scale(2, 2); const w = W / 2, h = H / 2;
    c.fillStyle = a; c.fillRect(0, 0, w, h); c.fillStyle = b; c.fillRect(0, 0, w / 2, h / 2); c.fillRect(w / 2, h / 2, w / 2, h / 2);
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; c.strokeRect(1, 1, w - 2, h - 2); c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  });
  if (kind === 'carpet') return canvasTex(512, 512, (c, W, H) => { c.scale(2, 2); const w = W / 2, h = H / 2;
    c.fillStyle = a; c.fillRect(0, 0, w, h); c.fillStyle = b;
    for (let y = 16; y < h; y += 32) for (let x = (y / 32 % 2) * 16 + 16; x < w; x += 32) { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }
  });
  return canvasTex(1024, 1024, (c, W, H) => {
    c.scale(2, 2); const w = W / 2, h = H / 2;
    c.fillStyle = a; c.fillRect(0, 0, w, h);
    const rows = 8, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r * 173) % 256;
      // every board a slightly different shade
      // two boards per row in a 512-wide tile: [off, off+256) and the one wrapping round [off+256, 512) + [0, off)
      const tone = k => shade(a, -.06 + (((r * 7 + k * 13) % 5) / 4) * .1);
      c.fillStyle = tone(0); c.fillRect(off, r * rh, 256, rh);
      c.fillStyle = tone(1); c.fillRect(off + 256, r * rh, w - off - 256, rh); c.fillRect(0, r * rh, off, rh);
      c.strokeStyle = 'rgba(110,60,30,.13)'; c.lineWidth = 2;
      for (let k = 0; k < 3; k++) { c.beginPath(); const yy = r * rh + 10 + k * 18; c.moveTo(0, yy); c.bezierCurveTo(w * .3, yy - 4, w * .6, yy + 5, w, yy); c.stroke(); }
      c.strokeStyle = b; c.lineWidth = 4; c.beginPath(); c.moveTo(0, r * rh); c.lineTo(w, r * rh); c.stroke();
      for (let x = off; x < w + 256; x += 256) { c.beginPath(); c.moveTo(x % w, r * rh); c.lineTo(x % w, r * rh + rh); c.stroke(); }
    }
  });
}
function wallTex(kind, a, b) {
  return canvasTex(512, 512, (c, W, H) => {
    c.scale(2, 2); const w = W / 2, h = H / 2;
    c.fillStyle = a; c.fillRect(0, 0, w, h); c.fillStyle = b;
    if (kind === 'plain') { /* paint only */ }
    else if (kind === 'stripe') { for (let x = 0; x < w; x += 64) c.fillRect(x, 0, 26, h); }
    else if (kind === 'check') { for (let y = 0; y < h; y += 64) for (let x = ((y / 64) % 2) * 32; x < w; x += 64) c.fillRect(x, y, 32, 32); }
    else if (kind === 'wood') { c.strokeStyle = b; c.lineWidth = 4; for (let x = 0; x <= w; x += 42) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } }
    else if (kind === 'flower') {
      for (let y = 32; y < h; y += 64) for (let x = (y / 64 % 2) * 32 + 32; x < w + 32; x += 64) { c.save(); c.translate(x % w, y); for (let k = 0; k < 5; k++) { const an = k / 5 * Math.PI * 2; c.beginPath(); c.arc(Math.cos(an) * 6, Math.sin(an) * 6, 5, 0, 7); c.fill(); } c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, 4, 0, 7); c.fill(); c.fillStyle = b; c.restore(); }
    }
    else if (kind === 'heart') {
      for (let y = 32; y < h; y += 64) for (let x = (y / 64 % 2) * 32 + 32; x < w + 32; x += 64) { c.save(); c.translate(x % w, y); c.beginPath(); c.moveTo(0, 6); c.bezierCurveTo(-12, -4, -6, -12, 0, -5); c.bezierCurveTo(6, -12, 12, -4, 0, 6); c.fill(); c.restore(); }
    } else if (kind === 'star') {
      for (let y = 32; y < h; y += 64) for (let x = (y / 64 % 2) * 32 + 32; x < w + 32; x += 64) { c.save(); c.translate(x % w, y); c.beginPath(); for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 4 : 9; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.fill(); c.restore(); }
    } else if (kind === 'brick') {   // a building's outside (the fire station, 10/18): staggered bricks and their mortar
      c.fillStyle = b; for (let y = 0, r = 0; y < h; y += 24, r++) for (let x = (r % 2) * -32; x < w; x += 64) c.fillRect(x + 3, y + 3, 58, 18);
    } else if (kind === 'tile') {
      c.strokeStyle = b; c.lineWidth = 4; for (let x = 0; x <= w; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    } else { for (let y = 20; y < h; y += 40) for (let x = (y / 40 % 2) * 20 + 20; x < w + 20; x += 40) { c.beginPath(); c.arc(x % w, y, 5, 0, 7); c.fill(); } }
  }, { repeat: [1, 1] });
}

// small wall pieces a stage can do without when there is no clear place for them (never a door, a puzzle frame, a gate…)
const SPARE_DECOR = new Set(['window', 'curtainwin', 'posterwall', 'picture', 'clock', 'catclock', 'wallrack', 'poster']);

export class Room {
  constructor(world, layout) {
    this.world = world; this.L = layout; this.T = layout.theme;
    this.w = layout.w || 5; this.d = layout.d || 5;
    this.group = new THREE.Group();
    this.furns = []; this.decors = []; this.walls = {}; this.occ = []; this.floorOcc = [];
    this.buildShell();
    for (const fd of layout.furniture || []) {
      const rec = fd.x != null ? this.addFurnitureAt(fd.type, fd.x, fd.z, fd.a || 0, fd.id, fd.opts) : this.addFurniture(fd.type, fd.i, fd.j, fd.rot || 0, fd.id, fd.opts);
      const y = fd.y ?? this.heightAt(fd.i, fd.j);
      if (y) { rec.f.group.position.y = y; rec.y = y; }
    }
    for (const dd of layout.decor || []) this.addDecor(dd.type, dd.wall, dd.u, dd.opts);
    if (layout.door) this.doorDecor = this.addDecor('door', layout.door.wall, layout.door.u);
    // a window or door on a side with no wall at all (a map's open side onto the next room) would hang in the air
    for (const rec of this.decors) if ((layout.walls?.[rec.wall] || 'wall') === 'none') { rec.f.group.visible = false; rec.hidden = true; }
    // a layout fixed by hand in 배치 편집 (exact) stands exactly as placed; the others get their wall pieces tidied
    if (!layout.exact) this.settleDecor();
    this.fitParts();
  }
  // Nothing hangs where it can't be seen: a window, door, clock or picture that ends up behind something tall standing
  // by its wall (a wardrobe, a loft bed, a fridge) or on top of another wall piece slides along the wall to the nearest
  // clear spot (user, 2026-10-16: "침대랑 창문, 옷장이랑 창문 중첩"). Indices stay the same, so hiding-spot keys hold.
  settleDecor() {
    const GAP = .14;
    this.group.updateMatrixWorld(true);
    const solid = [...this.furns.filter(r => r.type !== 'rug').map(r => r.f.group), ...(this.lofts || []).map(l => l.group)]
      .map(o => new THREE.Box3().setFromObject(o, true)).filter(b => !b.isEmpty());
    const placed = [];
    // doors first: they never move, so everything else on that wall has to keep clear of them
    for (const rec of [...this.decors].sort((a, b) => (b.type === 'door') - (a.type === 'door'))) {
      if (rec.hidden) continue;
      const K = rec.wall, g = rec.f.group;
      if (K !== 'N' && K !== 'W') { placed.push(rec); continue; }
      const ax = K === 'N' ? 'x' : 'z', dp = K === 'N' ? 'z' : 'x', len = K === 'N' ? this.w : this.d;
      const box = () => { g.updateMatrixWorld(true); return new THREE.Box3().setFromObject(g, true); };
      const blocked = b => {
        const bw = b.max[ax] - b.min[ax];
        for (const f of solid) {
          if (f.max.y < b.min.y + .15 || f.min.y > b.max.y - .1 || f.min[dp] - b.min[dp] > .9) continue;
          if (Math.min(f.max[ax], b.max[ax]) - Math.max(f.min[ax], b.min[ax]) > -GAP) return true;   // keep a little air beside it, not just no overlap
        }
        const bb = b.clone().expandByScalar(GAP);
        return placed.some(o => o.wall === K && o._box && o._box.intersectsBox(bb));
      };
      let b = box();
      // a door stays put in a player's room; a stage layout (tidy) may slide it out from behind a shelf too
      if (blocked(b) && (rec.type !== 'door' || this.L.tidy)) {
        const u0 = g.position.x, hw = (b.max[ax] - b.min[ax]) / 2;
        let done = false;
        for (let k = 1; k <= len * 10 && !done; k++) for (const sg of [1, -1]) {
          const u = u0 + sg * k * .1; if (Math.abs(u) + hw > len / 2 - .04) continue;
          g.position.x = u; if (!blocked(box())) { rec.u = u; done = true; break; }
        }
        if (!done) g.position.x = u0;   // nowhere better: leave it where the layout put it
        // a stage's poster, clock or window with no clear place left is simply not hung (never two things on top
        // of each other); the record stays, so decor indices (and hiding-spot keys) don't shift
        if (!done && this.L.tidy && SPARE_DECOR.has(rec.type)) { g.visible = false; rec.hidden = true; continue; }
        b = box();
      }
      rec._box = b; placed.push(rec);
    }
  }
  // Is there room for a character of radius r standing at world (x, z)? Furniture bodies (and open parts) count, rugs,
  // flat floor pieces and things hanging high on a wall don't. Boxes are cached; call fitParts() after moving things.
  clearAt(x, z, r = .3, opts = null) {
    const lx = x - this.group.position.x, lz = z - this.group.position.z;
    if (this.isCut(Math.floor(lx + this.w / 2), Math.floor(lz + this.d / 2))) return false;   // no floor there
    if (!this._solid) {
      this.group.updateMatrixWorld(true);
      this._solid = [...this.furns, ...this.decors].filter(q => q.type !== 'rug' && !(q.y > 1)).map(q => new THREE.Box3().setFromObject(q.f.group, true))
        .filter(b => !b.isEmpty() && b.max.y - b.min.y > .06 && b.min.y < this.group.position.y + .7)
        .concat((this.extraSolid || []).map(o => { const b = new THREE.Box3().setFromObject(o, true); b.raised = !!o.userData.raised; return b; }));
    }
    for (const b of this._solid) {
      if (opts?.raised && b.raised) continue;
      const dx = Math.max(b.min.x - x, 0, x - b.max.x), dz = Math.max(b.min.z - z, 0, z - b.max.z);
      if (dx * dx + dz * dz < r * r) return false;
    }
    return true;
  }
  // Doors, lids and drawers open only as far as they can without going into the furniture next to them (a wardrobe
  // door swinging into the bed was drawn as a door poking through the blanket). Call again after moving furniture.
  fitParts() {
    this._solid = null;
    const recs = [...this.furns, ...this.decors].filter(r => r.type !== 'rug');
    this.group.updateMatrixWorld(true);
    const boxes = recs.map(r => { const b = new THREE.Box3(); r.f.group.traverse(o => { if (o.isMesh && !o.userData.proxy && !o.userData.part) b.expandByObject(o); }); return b.expandByScalar(-.025); });
    const v = new THREE.Vector3();
    recs.forEach((r, ri) => {
      for (const p of r.f.parts) {
        const t0 = p.t;
        let fit = .35;
        for (const reach of [1, .9, .8, .7, .6, .5, .42]) {
          p.reach = reach; p.setOpen(1); p.pivots.forEach(pv => pv.updateMatrixWorld(true));
          let hit = false;
          for (const pv of p.pivots) pv.traverse(o => {
            if (hit || !o.isMesh || o.userData.proxy) return;
            const pos = o.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / 160));
            for (let i = 0; i < pos.count && !hit; i += step) {
              v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
              for (let k = 0; k < boxes.length && !hit; k++) if (k !== ri && boxes[k].containsPoint(v)) hit = true;
            }
          });
          if (!hit) { fit = reach; break; }
        }
        p.reach = fit; p.setOpen(t0);
      }
    });
    // a rug with furniture standing on it can't be lifted (whatever is under it stays under the table)
    const solidBoxes = recs.map(r => new THREE.Box3().setFromObject(r.f.group, true));
    for (const r of this.furns) {
      if (r.type !== 'rug') continue;
      const rb = new THREE.Box3().setFromObject(r.f.group, true).expandByScalar(-.05);
      if (recs.some((q, k) => q !== r && solidBoxes[k].min.x < rb.max.x && solidBoxes[k].max.x > rb.min.x && solidBoxes[k].min.z < rb.max.z && solidBoxes[k].max.z > rb.min.z))
        for (const p of r.f.parts) p.reach = 0;
    }
  }
  get spots() { const s = []; for (const f of this.furns) s.push(...f.f.spots); for (const d of this.decors) if (!d.hidden) s.push(...d.f.spots); return s; }
  get parts() { const p = []; for (const f of this.furns) p.push(...f.f.parts); for (const d of this.decors) if (!d.hidden) p.push(...d.f.parts.filter(x => !x.noSearch)); return p; }
  buildShell() {
    const { w, d, T } = this;
    const g = this.group;
    // cake-like diorama slab
    // both tiers outline as one shape so the rim reads as a single ink line
    // slab: 'cake' (a lone room), 'thin' (an upper floor), 'none' (a room standing on a map's shared slab)
    const slab = {}, sk = this.L.slab || (this.L.bleed ? 'none' : 'cake');
    if (sk !== 'none') { g.add(put(rbox(w + .5, .36, d + .5, T.base, .16), 0, -.2, 0)); g.children.at(-1).userData.og = slab; }
    if (sk === 'cake') { g.add(put(rbox(w + .62, .2, d + .62, shade(T.base, -.08), .1), 0, -.4, 0)); g.children.at(-1).userData.og = slab; }
    const ft = floorTex(T.floorKind || 'planks', T.floor, T.floor2, T);
    const span = ft.userData?.span || 2;
    ft.wrapS = ft.wrapT = THREE.RepeatWrapping;
    let fl;
    if (this.L.cut?.length) { ft.repeat.set(1, 1); fl = new THREE.Mesh(tileFloorGeo(w, d, this.isCut.bind(this), span), mat('#ffffff', { map: ft, rough: .7, rim: .12 })); fl.position.y = .001; }
    else { ft.repeat.set(w / span, d / span); fl = put(plane(w, d, mat('#ffffff', { map: ft, rough: .7, rim: .12 })), 0, .001, 0, -Math.PI / 2); }
    fl.userData.floor = true; fl.receiveShadow = true; g.add(fl); this.floorMesh = fl;
    // raised floor sections (a tatami step, a window-seat platform) and little lofts (a 다락 up a ladder)
    this.extraSolid = [];
    for (const z of this.L.raised || []) this.buildRaised(z);
    for (const lf of this.L.lofts || []) this.buildLoft(lf);
    for (const z of this.L.floorZones || []) {
      const zt = floorTex(z.kind, z.a, z.b, { ...T, floor: z.a, floor2: z.b }), zs = zt.userData?.span || 2;
      zt.wrapS = zt.wrapT = THREE.RepeatWrapping; zt.repeat.set(z.w / zs, z.d / zs);
      const zm = put(plane(z.w, z.d, mat('#ffffff', { map: zt, rough: .7, rim: .12 })), -w / 2 + z.i + z.w / 2, .005, -d / 2 + z.j + z.d / 2, -Math.PI / 2);
      zm.userData.floor = true; zm.receiveShadow = true; g.add(zm);
    }
    // 'bleed' (the everyday look): no island under the room — the floor runs on past the walls and fades into the
    // background, so the room reads as one corner of a bigger home or street
    this.floorTexture = ft;
    if (this.L.bleed) { const ap = makeApron(w, d, ft, T, this.L.bleed); ap.position.y = -.004; g.add(ap); this.apron = ap; }
    for (const k of ['N', 'W', 'S', 'E']) this.walls[k] = this.buildWall(k);
    // sunlight through a window: a warm, soft-edged patch on the floor (no outline, never picked)
    for (const sn of this.L.sun || autoSun(this.L, w, d)) g.add(sunPatch(sn));
  }
  buildWall(k) {
    const { w, d, T } = this, W = WALLS[k];
    const kind = this.L.walls?.[k] || 'wall';
    const len = (k === 'N' || k === 'S') ? w : d;
    const wg = new THREE.Group(); wg.rotation.y = W.rot;
    const off = (k === 'N' || k === 'S') ? d / 2 : w / 2;
    wg.position.copy(W.n).multiplyScalar(-off);
    const body = new THREE.Group(); wg.add(body);
    if (kind !== 'wall' && kind !== 'door') {
      // outdoor boundary: fence / hedge / alley wall / cliff / nothing
      // corners as with walls: N / S pieces overhang a corner that has a side piece, W / E pieces stop short of it
      const on = q => (this.L.walls?.[q] || 'wall') !== 'none', [sL, sR] = WALL_ENDS[k], ns = k === 'N' || k === 'S';
      const bo = { capL: ns && on(sL), capR: ns && on(sR), inL: !ns && on(sL), inR: !ns && on(sR) };
      if (kind === 'rail') body.add(houseRail(len, T, { gaps: this.L.railGaps?.[k] }));   // an upper floor's open side
      else if (kind !== 'none') body.add(OUTDOOR?.boundary ? OUTDOOR.boundary(kind, len, T, bo) : fallbackBoundary(kind, len, T));
      body.traverse(o => { if (o.isMesh) { o.userData.wall = k; o.castShadow = true; o.receiveShadow = true; } });
      const decor = new THREE.Group(); wg.add(decor);
      this.group.add(wg);
      return { k, g: wg, body, decor, n: W.n, len, kk: 1, down: false, kind, tall: !!TALL[kind] };
    }
    // a wall is built from segments so an interior wall can keep a doorway open ('door' kind)
    // Corners: only the N / S walls reach over a corner (and only where the side wall there is solid), the W / E walls stop
    // at it, so no two walls share the corner block (shared faces flicker). join[side]: a neighbouring room's wall already
    // stands on that side of the floor, so this room's walls start after it.
    const solid = q => { const kq = this.L.walls?.[q] || 'wall'; return kq === 'wall' || kq === 'door'; };
    const [sL, sR] = WALL_ENDS[k], ns = k === 'N' || k === 'S', join = this.L.join || {};
    const capL = ns && solid(sL) && !join[sL], capR = ns && solid(sR) && !join[sR];
    const a0 = -len / 2 + (join[sL] ? WALL_T : 0), a1 = len / 2 - (join[sR] ? WALL_T : 0);
    const inL = !ns && solid(sL) ? .05 : 0, inR = !ns && solid(sR) ? .05 : 0;   // rails stop short of the N / S rails at a corner
    const baseTex = wallTex(T.wallKind || 'dots', T.wall, T.wall2);
    const WH = this.L.wallH || WALL_H;   // bleed rooms can stand taller so the back walls run off the top of the screen
    const seg = (x0, x1, y0 = 0, y1 = WH, endL = false, endR = false) => {
      const sl = x1 - x0, cx = (x0 + x1) / 2, ex = (endL ? WALL_T : 0) + (endR ? WALL_T : 0), ox = ((endR ? WALL_T : 0) - (endL ? WALL_T : 0)) / 2;
      if (sl <= .01) return;
      body.add(put(rbox(sl + ex, y1 - y0, WALL_T, T.wallEdge || '#fff6ee', .04), cx + ox, (y0 + y1) / 2, -WALL_T / 2));
      const top = Math.max(y0, .86);
      if (y1 > top) {
        const wt = baseTex.clone(); wt.needsUpdate = true; wt.repeat.set(sl / 1.6, (y1 - top) / 1.6 * .62 * WALL_H / (WALL_H - .86));
        body.add(put(plane(sl, y1 - top, mat('#ffffff', { map: wt, rough: .9, rim: .1 })), cx, (top + y1) / 2, .002));
      }
      if (y0 < .86) {
        body.add(put(plane(sl, .86 - y0, mat(T.wainscot || shade(T.wall, -.06), { rough: .85, rim: .1 })), cx, (y0 + .86) / 2, .002));
        const r0 = x0 + (x0 <= a0 + 1e-6 ? inL : 0), r1 = x1 - (x1 >= a1 - 1e-6 ? inR : 0);
        body.add(put(rbox(r1 - r0, .06, .05, T.trim || '#ffffff', .02), (r0 + r1) / 2, .86, .02));
        body.add(put(rbox(r1 - r0, .1, .05, T.trim || '#ffffff', .02), (r0 + r1) / 2, .05, .02));
      }
    };
    if (kind === 'door') {
      const u = this.L.doorAt?.[k] ?? 0, hw = .58, DH = 2.08;
      seg(a0, u - hw, 0, WH, capL, false); seg(u + hw, a1, 0, WH, false, capR); seg(u - hw, u + hw, DH, WH);
      for (const sx of [-1, 1]) body.add(put(rbox(.08, DH, WALL_T + .06, T.trim || '#ffffff', .02), u + sx * hw, DH / 2, -WALL_T / 2));
      body.add(put(rbox(hw * 2 + .16, .09, WALL_T + .06, T.trim || '#ffffff', .02), u, DH, -WALL_T / 2));
    } else seg(a0, a1, 0, WH, capL, capR);
    // top trim: over the corner on N / S, stopping short of it on W / E (the N / S trim's lip covers the gap)
    const t0 = a0 - (capL ? WALL_T + .01 : 0) + (!ns && solid(sL) ? .02 : 0), t1 = a1 + (capR ? WALL_T + .01 : 0) - (!ns && solid(sR) ? .02 : 0);
    body.add(put(rbox(t1 - t0, .08, WALL_T + .04, T.trim || '#ffffff', .03), (t0 + t1) / 2, WH, -WALL_T / 2));
    // one house rather than a stack of boxes: a gable with its roof edges on top, half-timbering outside
    if (this.L.timber) body.add(timberFrame(len, WH, T, { ends: ns ? 3 : 0 }));
    body.traverse(o => { if (o.isMesh) { o.userData.wall = k; o.castShadow = true; o.receiveShadow = true; } });
    const decor = new THREE.Group(); wg.add(decor);
    // the gable rides with the wall's hangings: gone while that wall is folded (squashed it read as a roof slab lying
    // across the rooms)
    if (this.L.gable === k) { const gb = gableTop(len, WH, T, { chimney: true }); gb.traverse(o => { if (o.isMesh) { o.userData.wall = k; o.castShadow = true; } }); decor.add(gb); }
    this.group.add(wg);
    return { k, g: wg, body, decor, n: W.n, len, kk: 1, down: false, kind, tall: true };
  }
  tileToWorld(i, j, fw = 1, fd = 1) { return new THREE.Vector3(-this.w / 2 + i + fw / 2, 0, -this.d / 2 + j + fd / 2); }
  footprint(type, rot) { const inf = FURN_INFO[type]; return rot % 2 ? [inf.d, inf.w] : [inf.w, inf.d]; }
  canPlace(type, i, j, rot, ignoreId = null) {
    const [fw, fd] = this.footprint(type, rot);
    if (i < 0 || j < 0 || i + fw > this.w || j + fd > this.d) return false;
    const floor = type === 'rug';
    for (const r of this.furns) {
      if (r.id === ignoreId) continue;
      if ((r.type === 'rug') !== floor) continue;
      const [rw, rd] = this.footprint(r.type, r.rot);
      if (i < r.i + rw && r.i < i + fw && j < r.j + rd && r.j < j + fd) return false;
    }
    return true;
  }
  addFurniture(type, i, j, rot = 0, id = null, opts = {}) {
    const f = makeFurniture(type, this.T, opts);
    const [fw, fd] = this.footprint(type, rot);
    const p = this.tileToWorld(i, j, fw, fd);
    f.group.position.copy(p); f.group.rotation.y = rot * Math.PI / 2;
    this.group.add(f.group);
    const rec = { f, type, i, j, rot, id: id ?? ('f' + Math.random().toString(36).slice(2, 8)), opts };
    f.rec = rec; this.furns.push(rec);
    this.world.shadowDirty = true;
    return rec;
  }
  // ── free placement: a footprint is an oriented rectangle at (x, z) turned by a (radians)
  obb(type, x, z, a, shrink = .9) { const inf = FURN_INFO[type]; return { x, z, c: Math.cos(a), s: Math.sin(a), hw: (inf.w || 1) / 2 * shrink, hd: (inf.d || 1) / 2 * shrink }; }
  recObb(r, shrink) {
    if (r.x != null) return this.obb(r.type, r.x, r.z, r.a, shrink);
    const [fw, fd] = this.footprint(r.type, r.rot), p = this.tileToWorld(r.i, r.j, fw, fd);
    return this.obb(r.type, p.x, p.z, r.rot * Math.PI / 2, shrink);
  }
  canPlaceAt(type, x, z, a, ignoreId = null) {
    const full = this.obb(type, x, z, a, 1);
    for (const [cx, cz] of obbCorners(full)) if (Math.abs(cx) > this.w / 2 + .02 || Math.abs(cz) > this.d / 2 + .02) return false;
    const floor = type === 'rug', me = this.obb(type, x, z, a);
    for (const r of this.furns) {
      if (r.id === ignoreId || (r.type === 'rug') !== floor) continue;
      if (obbOverlap(me, this.recObb(r))) return false;
    }
    return true;
  }
  addFurnitureAt(type, x, z, a = 0, id = null, opts = {}) {
    const f = makeFurniture(type, this.T, opts);
    f.group.position.set(x, 0, z); f.group.rotation.y = a;
    this.group.add(f.group);
    const rec = { f, type, x, z, a, id: id ?? ('f' + Math.random().toString(36).slice(2, 8)), opts };
    this.tileApprox(rec);
    f.rec = rec; this.furns.push(rec);
    this.world.shadowDirty = true;
    return rec;
  }
  moveFurnitureAt(rec, x, z, a) {
    rec.x = x; rec.z = z; rec.a = a; this.tileApprox(rec);
    rec.f.group.position.set(x, 0, z); rec.f.group.rotation.y = a;
    this.world.shadowDirty = true;
  }
  // tile-based callers (stage planner, NPC tiles) still see an approximate i, j, rot
  tileApprox(rec) {
    const rot = ((Math.round(rec.a / (Math.PI / 2)) % 4) + 4) % 4, [fw, fd] = this.footprint(rec.type, rot);
    rec.rot = rot; rec.i = Math.max(0, Math.min(this.w - fw, Math.round(rec.x + this.w / 2 - fw / 2))); rec.j = Math.max(0, Math.min(this.d - fd, Math.round(rec.z + this.d / 2 - fd / 2)));
  }
  // tiles whose centre lies under some furniture (rugs don't count)
  // tiles with no floor (layout.cut: [{ i, j, w, d }]) and the height of the floor at a tile (raised sections)
  isCut(i, j) { return (this.L.cut || []).some(c => i >= c.i && i < c.i + c.w && j >= c.j && j < c.j + c.d); }
  heightAt(i, j) { const z = (this.L.raised || []).find(c => i >= c.i && i < c.i + c.w && j >= c.j && j < c.j + c.d); return z ? z.h ?? .3 : 0; }
  buildRaised(z) {
    const { w, d, T } = this, h = z.h ?? .3, cx = -w / 2 + z.i + z.w / 2, cz = -d / 2 + z.j + z.d / 2;
    const g = new THREE.Group(); g.userData.og = {};
    const edge = z.edge || T.woodD || '#c98f58';
    g.add(put(rbox(z.w, h, z.d, edge, .04), cx, h / 2, cz));
    const zt = floorTex(z.kind || 'planks', z.a || T.floor, z.b || T.floor2, { ...T, floor: z.a || T.floor, floor2: z.b || T.floor2 }), zs = zt.userData?.span || 2;
    zt.wrapS = zt.wrapT = THREE.RepeatWrapping; zt.repeat.set(z.w / zs, z.d / zs);
    const top = put(plane(z.w - .04, z.d - .04, mat('#ffffff', { map: zt, rough: .7, rim: .12 })), cx, h + .004, cz, -Math.PI / 2);
    top.receiveShadow = true; g.add(top);
    // a little step in front so it reads as a platform you climb onto
    if (z.step !== false) g.add(put(rbox(Math.min(1, z.w * .5), h * .5, .28, shade(edge, .08), .03), cx + (z.stepX ?? 0), h * .25, cz + z.d / 2 + .14));
    g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.userData.floor = true; } });
    g.userData.raised = true;   // a platform: solid to the friends, a step up for the boss runner (clearAt opts.raised)
    this.group.add(g); this.extraSolid.push(g);
  }
  // a 다락 (little loft) on posts: a deck at y with a railing on its open sides and a ladder up
  buildLoft(lf) {
    const { w, d, T } = this, y = lf.y ?? 1.45, cx = -w / 2 + lf.i + lf.w / 2, cz = -d / 2 + lf.j + lf.d / 2;
    const g = new THREE.Group(), og = {}, wood = T.wood || '#f3cf9c', woodD = T.woodD || '#d29c62';
    const add = m => { m.userData.og = og; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    // a solid deck that never reads as a hole in the floor: a thick slab with a darker fascia, its own pale boards
    // running the other way from the room floor, and a raised lip along the open edges
    add(put(rbox(lf.w, .24, lf.d, woodD, .035), cx, y - .12, cz));
    const lt = floorTex('planks', '#fbe6c2', '#f1d3a2', T); lt.wrapS = lt.wrapT = THREE.RepeatWrapping; lt.repeat.set(lf.d / 1.3, lf.w / 1.3); lt.center.set(.5, .5); lt.rotation = Math.PI / 2;
    add(put(plane(lf.w - .1, lf.d - .1, mat('#ffffff', { map: lt, rough: .7 })), cx, y + .004, cz, -Math.PI / 2));
    const x0 = cx - lf.w / 2, x1 = cx + lf.w / 2, z0 = cz - lf.d / 2, z1 = cz + lf.d / 2;
    add(put(rbox(lf.w, .06, .07, woodD, .02), cx, y + .03, z1 - .035));
    add(put(rbox(.07, .06, lf.d, woodD, .02), x1 - .035, y + .03, cz));
    const atW = lf.i === 0, atN = lf.j === 0;   // sides against the walls need no posts or rails
    const posts = [[x1, z1], ...(atW ? [] : [[x0, z1]]), ...(atN ? [] : [[x1, z0]]), ...(atW || atN ? [] : [[x0, z0]])];
    const postMeshes = posts.map(([px, pz]) => add(put(rbox(.14, y, .14, woodD, .03), px - Math.sign(px - cx) * .07, y / 2, pz - Math.sign(pz - cz) * .07)));
    // railing: the front edge (+z) and the east edge (+x), with a gap for the ladder
    const lad = lf.ladder || 'S', gap = lf.ladderAt ?? 0;
    const rail = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az); if (L < .1) return; const ang = Math.atan2(bz - az, bx - ax);
      add(put(rbox(L, .07, .07, wood, .02), (ax + bx) / 2, y + .55, (az + bz) / 2, 0, -ang, 0));
      for (let t = .5; t < L; t += .32) add(put(rbox(.05, .5, .05, wood, .015), ax + (bx - ax) * t / L, y + .28, az + (bz - az) * t / L)); };
    if (lad === 'S') { const gx = cx + gap; rail(x0, z1, gx - .35, z1); rail(gx + .35, z1, x1, z1); } else rail(x0, z1, x1, z1);
    if (lad === 'E') { const gz = cz + gap; rail(x1, z0, x1, gz - .35); rail(x1, gz + .35, x1, z1); } else rail(x1, z0, x1, z1);
    // a curtain round the open sides (2판 only — tiers.js tiltLayout): the loft becomes a nook you see into only from above,
    // the tilt lesson's place (검토 재검토 1: through the railing the quilt star showed from the first view)
    if (lf.curtain) {
      const cc = lf.curtainColor || shade(T.wall2 || '#ffb3a3', .12), cd = shade(cc, -.16), h = 1.05, top = y + 1.1;
      const panel = (ax, az, bx, bz) => {
        const L = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bz - az, bx - ax), mx = (ax + bx) / 2, mz = (az + bz) / 2;
        add(put(rbox(L, h, .025, cc, .01), mx, top - h / 2, mz, 0, -ang, 0));
        for (let t = .1; t < L - .05; t += .2) add(put(rbox(.045, h - .12, .05, cd, .02), ax + (bx - ax) * t / L, top - h / 2 - .05, az + (bz - az) * t / L, 0, -ang, 0));   // pleats
        add(put(rbox(L + .02, .12, .05, cd, .02), mx, top - .07, mz, 0, -ang, 0));   // a frilled valance
        add(put(rbox(L + .06, .04, .04, woodD, .015), mx, top + .02, mz, 0, -ang, 0));   // the rod
      };
      panel(x0, z1 + .04, x1 + .04, z1 + .04); panel(x1 + .04, z0, x1 + .04, z1 + .04);
    }
    // ladder leaning against the open side
    const lx = lad === 'S' ? cx + gap : x1 + .45, lz = lad === 'S' ? z1 + .45 : cz + gap, ry = lad === 'S' ? 0 : Math.PI / 2;
    const ladder = new THREE.Group(); ladder.position.set(lx, 0, lz); ladder.rotation.y = ry;
    const tilt = Math.atan2(.45, y);
    for (const sx of [-.24, .24]) { const r = put(rbox(.07, y + .2, .07, woodD, .02), sx, (y + .2) / 2, 0); r.rotation.x = -tilt; ladder.add(r); }
    for (let k = 1; k * .32 < y; k++) { const yy = k * .32; ladder.add(put(rbox(.48, .05, .06, wood, .015), 0, yy, -Math.tan(tilt) * yy)); }
    ladder.traverse(o => { if (o.isMesh) { o.userData.og = og; o.castShadow = true; } });
    g.add(ladder);
    this.group.add(g);
    this.extraSolid.push(...postMeshes);   // posts block walking
    this.extraSolid.push(ladder);
    this.lofts = this.lofts || []; this.lofts.push({ ...lf, y, group: g });
  }
  occupied() {
    const occ = new Set();
    for (let j = 0; j < this.d; j++) for (let i = 0; i < this.w; i++) if (this.isCut(i, j) || this.heightAt(i, j)) occ.add(i + ',' + j);
    for (const r of this.furns) {
      if (r.type === 'rug') continue;
      const o = this.recObb(r, 1);
      for (let j = 0; j < this.d; j++) for (let i = 0; i < this.w; i++) {
        const px = i - this.w / 2 + .5 - o.x, pz = j - this.d / 2 + .5 - o.z;
        const u = px * o.c - pz * o.s, v = px * o.s + pz * o.c;
        if (Math.abs(u) < o.hw + .05 && Math.abs(v) < o.hd + .05) occ.add(i + ',' + j);
      }
    }
    return occ;
  }
  moveFurniture(rec, i, j, rot) {
    rec.i = i; rec.j = j; rec.rot = rot;
    const [fw, fd] = this.footprint(rec.type, rot);
    rec.f.group.position.copy(this.tileToWorld(i, j, fw, fd)); rec.f.group.rotation.y = rot * Math.PI / 2;
    this.world.shadowDirty = true;
  }
  removeFurniture(rec) {
    this.group.remove(rec.f.group);
    this.furns = this.furns.filter(r => r !== rec);
    this.world.shadowDirty = true;
  }
  addDecor(type, wallK, u, opts = {}) {
    const wall = this.walls[wallK];
    const f = makeFurniture(type, this.T, opts);
    f.group.position.set(u, 0, 0);
    wall.decor.add(f.group);
    const rec = { f, type, wall: wallK, u, opts }; f.rec = rec;
    this.decors.push(rec);
    return rec;
  }
  // stand point in front of a furniture / decor piece (world)
  frontOf(f) {
    const rec = f.rec, v = new THREE.Vector3();
    if (rec.wall) {
      const W = this.walls[rec.wall];
      f.group.getWorldPosition(v); v.addScaledVector(W.n, .62); v.y = 0;
    } else {
      const [fw, fd] = this.footprint(rec.type, rec.rot);
      const dir = new THREE.Vector3(Math.sin(rec.rot * Math.PI / 2), 0, Math.cos(rec.rot * Math.PI / 2));
      v.copy(f.group.position).addScaledVector(dir, (rec.rot % 2 ? fw : fd) / 2 + .42);
      if (rec.type === 'rug') v.copy(f.group.position).add(new THREE.Vector3(.0, 0, .0));
    }
    v.x = clamp(v.x, -this.w / 2 + .35, this.w / 2 - .35); v.z = clamp(v.z, -this.d / 2 + .35, this.d / 2 - .35);
    return v;
  }
  spotWorld(s) { const v = new THREE.Vector3(); s.anchor.getWorldPosition(v); return v; }
  update(dt) {
    const wd = this.world;
    const c = new THREE.Vector3(Math.sin(wd.yaw), 0, Math.cos(wd.yaw));
    for (const k in this.walls) {
      const W = this.walls[k];
      const want = W.tall && (W.n.dot(c) < -.18 || this.allDown) ? 0 : 1;
      const prev = W.kk;
      W.kk += (want - W.kk) * (1 - Math.exp(-dt * 12));
      if (Math.abs(W.kk - want) < .002) W.kk = want;
      if (W.kk !== prev) {
        // a folded wall stays as a knee-high wall (dollhouse cutaway), so whatever stands against it reads as against a
        // wall instead of floating in the room (user, 2026-10-16: "배치가 자연스러우면")
        const STUB = KNEE / (this.L.wallH || 2.9);
        W.body.scale.y = STUB + (1 - STUB) * W.kk; W.decor.visible = W.kk > .65; wd.shadowDirty = true;
        W.body.visible = true;
        const flat = false;
        if (flat !== W.flat) { W.flat = flat; W.body.traverse(o => { if (o.isMesh && !o.material?.transparent) o.layers.set(flat ? 2 : 0); }); }
      }
      W.down = W.kk < .5;
    }
  }
}

// Attach an item group into a spot, with an invisible fat-finger pick proxy.
export function attachItem(spot, g, { rotY = null, scale = 1 } = {}) {
  const s = (spot.scale || 1) * scale;
  g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.setScalar(s);
  g.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3());
  spot.anchor.add(g);
  g.rotation.set(0, rotY ?? 0, 0);
  if (spot.wallFace) g.rotation.set(Math.PI / 2, 0, 0);
  const r = Math.max(.2, Math.max(size.x, size.y, size.z) * .62);
  const proxy = new THREE.Mesh(geo('proxy', () => new THREE.SphereGeometry(1, 10, 8)), PROXY_MAT);
  proxy.scale.setScalar(r / s); proxy.position.set(0, (spot.wallFace ? .02 : size.y / s / 2), 0);
  proxy.userData.proxy = true; proxy.userData.noOcclude = true; proxy.castShadow = false; proxy.receiveShadow = false;
  g.add(proxy);
  g.traverse(o => { if (o.isMesh && o !== proxy) { o.castShadow = false; } });
  spot.itemGroup = g;
  g.visible = !spot.part || spot.part.t > .05;
  return g;
}
const PROXY_MAT = new THREE.MeshBasicMaterial({ visible: false });

// a floor made of the room's tiles minus cut-outs, UVs in world units so the texture runs on seamlessly
function tileFloorGeo(w, d, cut, span) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) {
    if (cut(i, j)) continue;
    const x0 = -w / 2 + i, z0 = -d / 2 + j, b = pos.length / 3;
    for (const [x, z] of [[x0, z0], [x0 + 1, z0], [x0 + 1, z0 + 1], [x0, z0 + 1]]) { pos.push(x, 0, z); uv.push((x + w / 2) / span, 1 - (z + d / 2) / span); }
    idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// sun: { from: [x0, z0, x1, z1] (the window's foot on the floor), dir: [dx, dz] (how far the light reaches), a: strength }
let SUN_TEX = null;
// warm afternoon light falling in from every window on an indoor back wall (rooms without a hand-placed L.sun)
const WIN_HW = { window: .46, curtainwin: .62, balconywin: .86 };
function autoSun(L, w, d) {
  const out = [];
  for (const dc of L.decor || []) {
    const hw = WIN_HW[dc.type]; if (!hw || (L.walls?.[dc.wall] || 'wall') !== 'wall') continue;
    if (dc.wall === 'N') out.push({ from: [dc.u - hw, -d / 2, dc.u + hw, -d / 2], dir: [.9, 2.1], a: .32 });
    else if (dc.wall === 'W') out.push({ from: [-w / 2, -dc.u + hw, -w / 2, -dc.u - hw], dir: [2.1, .9], a: .32 });
  }
  return out;
}
function sunPatch({ from: [x0, z0, x1, z1], dir: [dx, dz], a = .42, color = '#ffc95c' }) {
  if (!SUN_TEX) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128; const x = c.getContext('2d'), img = x.createImageData(64, 128);
    for (let j = 0; j < 128; j++) for (let i = 0; i < 64; i++) {
      const u = (i + .5) / 64, v = (j + .5) / 128, side = Math.min(1, Math.min(u, 1 - u) / .12), len = Math.pow(1 - v, .8), k = (j * 64 + i) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.round(255 * side * len * (.82 + .18 * (Math.floor(u * 4) % 2))); img.data[k + 3] = 255;
    }
    x.putImageData(img, 0, 0); SUN_TEX = new THREE.CanvasTexture(c);
  }
  const p = [[x0, z0], [x1, z1], [x1 + dx, z1 + dz], [x0 + dx, z0 + dz]], y = .007;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p.flatMap(([x, z]) => [x, y, z]), 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
  geo.setIndex([0, 2, 1, 0, 3, 2]); geo.computeVertexNormals();
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: a, alphaMap: SUN_TEX, depthWrite: false, blending: THREE.NormalBlending, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, m); mesh.userData.noOcclude = true; mesh.renderOrder = 2;
  return mesh;
}

// The floor running on past a room (or a whole map) and fading into the background: no island under the scene.
export function makeApron(w, d, ft, T, o = {}) {
  const S = Math.max(w, d) + 16, at = new THREE.CanvasTexture(fadeMask(w / S, d / S, (o.fade ?? 5) / S));
  // outdoor ground textures carry one-off marks (lane lines, a manhole): the apron gets the plain ground instead
  const outdoor = ['grass', 'sand', 'asphalt', 'brickpave', 'dirt'].includes(T.floorKind);
  // outdoors the plain ground runs on; indoors the room stands on a soft plain surround (a patterned floor carried
  // past the walls read as a seam)
  const sa = T.bg?.[1] || '#f3e6d6';
  const at2 = outdoor ? noiseGround(T.floor, T.floor2, 90) : noiseGround(shade(sa, -.05), shade(sa, -.09), 26); at2.needsUpdate = true; at2.wrapS = at2.wrapT = THREE.RepeatWrapping;
  at2.repeat.set(S / 4, S / 4);
  const m = mat(o.tint || (outdoor ? shade('#ffffff', -.07) : '#ffffff'), { map: at2, rough: .8 });
  m.alphaMap = at; m.transparent = true; m.depthWrite = false;
  const ap = put(plane(S, S, m), 0, 0, 0, -Math.PI / 2);
  ap.userData.noOcclude = true; ap.renderOrder = -1;
  return ap;
}
// alpha mask for a bleed apron: opaque over the room (fw × fd of the plane) and a soft fade of `fade` around it
function fadeMask(fw, fd, fade) {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), img = x.createImageData(N, N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = Math.abs((i + .5) / N - .5), v = Math.abs((j + .5) / N - .5);
    const du = Math.max(0, u - fw / 2), dv = Math.max(0, v - fd / 2), dd = Math.hypot(du, dv) / Math.max(1e-3, fade);
    const a = Math.max(0, 1 - dd), k = (j * N + i) * 4, g = Math.round(255 * a * a * (3 - 2 * a));
    img.data[k] = img.data[k + 1] = img.data[k + 2] = g; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

// oriented rectangles (x, z centre; c, s = cos, sin of the turn; hw, hd half sizes along the local x / z axes)
function obbCorners(o) {
  const out = [];
  for (const [u, v] of [[-o.hw, -o.hd], [o.hw, -o.hd], [o.hw, o.hd], [-o.hw, o.hd]]) out.push([o.x + u * o.c + v * o.s, o.z - u * o.s + v * o.c]);
  return out;
}
function obbOverlap(A, B) {
  const ca = obbCorners(A), cb = obbCorners(B);
  for (const o of [A, B]) for (const [ax, az] of [[o.c, -o.s], [o.s, o.c]]) {
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const [x, z] of ca) { const d = x * ax + z * az; a0 = Math.min(a0, d); a1 = Math.max(a1, d); }
    for (const [x, z] of cb) { const d = x * ax + z * az; b0 = Math.min(b0, d); b1 = Math.max(b1, d); }
    if (a1 <= b0 || b1 <= a0) return false;
  }
  return true;
}

// Simple stand-ins until gfx/outdoor.js provides the real boundary pieces.
function fallbackBoundary(kind, len, T) {
  const g = new THREE.Group();
  if (kind === 'hedge') {
    for (let x = -len / 2 + .3; x <= len / 2 - .2; x += .5) g.add(put(sph(.36, T.hedge || '#6fcf6a', null, 14, 10), x, .3, -.2, 0, 0, 0, [1, .85, .9]));
  } else if (kind === 'alleywall') {
    g.add(put(rbox(len + .3, 1.6, .22, T.wall || '#efe3cf', .03), 0, .8, -.11));
    g.add(put(rbox(len + .36, .12, .3, T.wall2 || '#b9a58c', .03), 0, 1.66, -.11));
  } else if (kind === 'cliff') {
    for (let x = -len / 2 + .4; x <= len / 2; x += .8) g.add(put(sph(.45, '#a99a8a', null, 10, 8), x, .1, -.3, 0, x, 0, [1.1, .6, .8]));
  } else {
    for (let x = -len / 2 + .2; x <= len / 2; x += .5) g.add(put(rbox(.09, .55, .09, T.fence || '#ffffff', .03), x, .275, -.08));
    g.add(put(rbox(len, .07, .05, T.fence || '#ffffff', .02), 0, .4, -.08)); g.add(put(rbox(len, .07, .05, T.fence || '#ffffff', .02), 0, .18, -.08));
  }
  return g;
}

// Stable keys for hiding places so a room can be saved, published and rebuilt by someone else.
export function indexSpots(room) {
  const spots = {}, parts = {};
  room.furns.forEach(r => { r.f.spots.forEach(s => { s.key = r.id + ':' + s.idx; spots[s.key] = s; }); r.f.parts.forEach((p, i) => { p.key = r.id + ':p' + i; parts[p.key] = p; }); });
  room.decors.forEach((d, di) => { d.f.spots.forEach(s => { s.key = 'd' + di + ':' + s.idx; spots[s.key] = s; }); d.f.parts.forEach((p, i) => { p.key = 'd' + di + ':p' + i; parts[p.key] = p; }); });
  return { spots, parts };
}

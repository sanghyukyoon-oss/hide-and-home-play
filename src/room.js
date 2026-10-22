// A diorama room: floor slab, 4 walls with Sims-style cutaway, grid-placed furniture, wall decor, hiding spots.
import * as THREE from 'three';
import { rbox, put, grp, mat, mesh, geo, canvasTex, shade, plane, sph } from './gfx/kit.js';
import { makeFurniture, FURN_INFO } from './gfx/furniture.js';
import { clamp } from './util.js';
import { houseRail, gableTop, timberFrame, entryNook } from './gfx/house-props.js';
import { atticTop } from './gfx/bunnyattic-props.js';   // 2판 다락 (10/20)
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hasWall, hasFloor, paint } from './patterns.js';   // 벽지·바닥 더하기 (10/20): the shop's newer patterns

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
// (⑤ 10/21 #71, user on a phone: "경찰차 끝나고 한번 하얗게 변하고 뻗음") rooms built together — the hotel's lobby and its eight
// rooms, a wide map's cells — each drew its own floor (1024²) and wall (512²) picture even when the paint was the same: 21판 →
// 호텔 put about 60 MB of new textures up at once. Same paint, same picture now: every room still gets its own Texture (its own
// repeat and offset), but they share one image, which three uploads once. The pictures are only remembered while a build runs.
const TEXMEMO = new Map(); let memoT = 0;
const memo = (key, make) => {
  let base = TEXMEMO.get(key);
  if (!base) { base = make(); TEXMEMO.set(key, base); clearTimeout(memoT); memoT = setTimeout(() => TEXMEMO.clear(), 3000); }
  return base.clone();
};
const GROUND = ['grass', 'sand', 'asphalt', 'brickpave', 'dirt', 'water'];
// res: the plank floor's picture size — 1024 (512 px a tile); the hotel's nine little rooms, seen whole from far out, ask for 512
function floorTex(kind, a, b, T = null, res = 1024) { return GROUND.includes(kind) ? floorTex0(kind, a, b, T) : memo(`f|${kind}|${a}|${b}|${res}`, () => floorTex0(kind, a, b, T, res)); }
function wallTex(kind, a, b) { return memo(`w|${kind}|${a}|${b}`, () => wallTex0(kind, a, b)); }
function floorTex0(kind, a, b, T = null, res = 1024) {
  if (hasFloor(kind)) return canvasTex(512, 512, (c, W) => paint(c, W, kind, a, b, true));
  if (['grass', 'sand', 'asphalt', 'brickpave', 'dirt', 'water'].includes(kind)) {   // (water: a shallow strip of sea or lake on the map's own floor — 바닷가 가게)
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
  return canvasTex(res, res, (c, W, H) => {
    c.scale(W / 512, H / 512); const w = 512, h = 512;
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
function wallTex0(kind, a, b) {
  if (hasWall(kind)) return canvasTex(512, 512, (c, W) => paint(c, W, kind, a, b, false), { repeat: [1, 1] });
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
// the floor a slide needs where you land (and at the climbing wall's foot): local rectangles [x0, x1, z0, z1] at the piece's
// own turn, kept inside the room and clear of furniture when a piece is set down (내 방·로비·배치 편집) — 10/19 user: "미끄럼틀
// 뚫는 부분 엄청 많으니까 정리 잘해 줘 봐" (겹침 QA)
export const KEEP_CLEAR = { slide: [[1.0, 1.6, -.35, .35], [-1.45, -1.0, -.3, .3]], slidetower: [[-.3, .2, 1.0, 1.6], [-1.0, -.45, .9, 1.5], [1.0, 1.5, -.7, -.15]] };
// what you may land on: a rug, a floor marking (사방치기), the sand pit, the ball pit
const landing = t => t === 'rug' || t === 'sandbox2' || t === 'ballpit' || !!FURN_INFO[t]?.floor;
const clearZones = (type, x, z, a) => (KEEP_CLEAR[type] || []).map(([x0, x1, z0, z1]) => {
  const c = Math.cos(a), s = Math.sin(a), u = (x0 + x1) / 2, v = (z0 + z1) / 2;
  return { x: x + u * c + v * s, z: z - u * s + v * c, c, s, hw: (x1 - x0) / 2, hd: (z1 - z0) / 2 };
});

const hasFine = e => !!(e.s && e.s !== 1 || e.ry || e.dx || e.dz || e.dy);

// 가구 위에 올리기 (10/20, user: "로봇은 가구 위에 못 올리나 근데?"): in my home (layout.stack) a small piece may stand on a piece
// with a flat top — dragged over it, it sits on that top (the height of the top's '…위' hiding spot). A piece with something on
// it stays put until that is taken off (myhome).
export const STACK_SMALL = new Set(['kitrobot', 'kitparfait', 'kitmovebox', 'lamp', 'plant', 'monstera', 'amphora', 'tacklebox', 'baitbucket', 'speaker', 'yarnbasket', 'sp_neonlamp', 'sp_rocket', 'sp_skate', 'sp2_radio']);   // (sp_: 스페셜 models to come)
export const STACK_TOP = { drawers: 1.01, desk: .81, table: .69, counter: .94, safe: .94, stool: .55, guidedesk: .85, kitchentable: .77, merchtable: .71, schooldesk: .68, kitmovebox: .47 };

export class Room {
  constructor(world, layout) {
    this.world = world; this.L = layout; this.T = layout.theme;
    this.w = layout.w || 5; this.d = layout.d || 5;
    this.group = new THREE.Group();
    this.furns = []; this.decors = []; this.walls = {}; this.occ = []; this.floorOcc = [];
    this.stack = !!layout.stack;
    this.buildShell();
    for (const fd of layout.furniture || []) {
      const rec = fd.x != null ? this.addFurnitureAt(fd.type, fd.x, fd.z, fd.a || 0, fd.id, fd.opts) : this.addFurniture(fd.type, fd.i, fd.j, fd.rot || 0, fd.id, fd.opts);
      const y = fd.y ?? this.heightAt(fd.i, fd.j);
      if (y) { rec.f.group.position.y = y; rec.y = y; }
      if (hasFine(fd)) this.fine(rec, fd);
    }
    if (this.stack) for (const r of this.furns) if (STACK_SMALL.has(r.type)) this.settle(r);   // (once all are in: a base may come later in the list)
    for (const dd of layout.decor || []) { const rec = this.addDecor(dd.type, dd.wall, dd.u, dd.opts); if (hasFine(dd)) this.fine(rec, dd); }
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
    // pieces on the side walls count too, as far as their parts open — a window whose curtain slides along into the corner
    // (10/19 겹침 QA, user on the phone: 9판 "커튼 열었을 때 욕실장 뚫림" — the 거울 수납장 had been slid into that corner)
    const reachBox = rec => {
      const g = rec.f.group; g.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g, true);
      for (const p of rec.f.parts) { const t0 = p.t; p.setOpen(1); g.updateMatrixWorld(true); b.union(new THREE.Box3().setFromObject(g, true)); p.setOpen(t0); }
      g.updateMatrixWorld(true); return b;
    };
    const side = this.decors.filter(r => !r.hidden && r.wall !== 'N' && r.wall !== 'W').map(r => ({ wall: r.wall, b: reachBox(r) }));
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
        if (side.some(o => o.wall !== K && o.b.intersectsBox(bb))) return true;
        return placed.some(o => (o.wall === K ? o._box : o._reach)?.intersectsBox(bb));
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
      rec._box = b; rec._reach = reachBox(rec); placed.push(rec);
    }
  }
  // Is there room for a character of radius r standing at world (x, z)? Furniture bodies (and open parts) count, rugs,
  // flat floor pieces and things hanging high on a wall don't. Boxes are cached; call fitParts() after moving things.
  clearAt(x, z, r = .3, opts = null) {
    const lx = x - this.group.position.x, lz = z - this.group.position.z;
    if (this.isCut(Math.floor(lx + this.w / 2), Math.floor(lz + this.d / 2))) return false;   // no floor there
    // no standing in the water (바닷가 가게 10/21: a friend stood in the shallows): a floor zone of kind 'water' is off limits
    // to the body's middle half — the shore's edge stays a place to stand
    for (const q of this.L?.floorZones || []) if (q.kind === 'water') {
      const x0 = q.i - this.w / 2, z0 = q.j - this.d / 2, ex = Math.max(x0 - lx, 0, lx - (x0 + q.w)), ez = Math.max(z0 - lz, 0, lz - (z0 + q.d));
      if (ex * ex + ez * ez < r * r * .25) return false;
    }
    if (!this._solid) {
      this.group.updateMatrixWorld(true);
      this._solid = [...this.furns, ...this.decors].filter(q => q.type !== 'rug' && !(q.y > 1) && !q.f.noSolid).map(q => new THREE.Box3().setFromObject(q.f.group, true))
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
    const boxes = recs.map(r => {
      // f.collideBox (a big tree: just its trunk) — local [x0, y0, z0, x1, y1, z1] in place of the box round every mesh (10/21)
      if (r.f.collideBox) { const [a, b2, c, d2, e, g2] = r.f.collideBox; return new THREE.Box3(new THREE.Vector3(a, b2, c), new THREE.Vector3(d2, e, g2)).applyMatrix4(r.f.group.matrixWorld); }
      const b = new THREE.Box3(); r.f.group.traverse(o => { if (o.isMesh && !o.userData.proxy && !o.userData.part) b.expandByObject(o); }); return b.expandByScalar(-.025);
    });
    // a loft's floor, posts, rails and curtains too, piece by piece (1·2판: the wardrobe's door opened up into the loft bed)
    // (a loft's wall-side post is up only while its wall is folded: not in a door's way — 10/22)
    const loftBoxes = []; for (const l of this.lofts || []) l.group.traverse(o => { if (o.isMesh && !o.userData.wallPost) { const b = new THREE.Box3().setFromObject(o).expandByScalar(-.02); if (!b.isEmpty()) loftBoxes.push(b); } });
    const v = new THREE.Vector3();
    // nor into this room's own walls or floor (10/19 겹침 QA: 4판 옷장 문, 11판 냉장고 문, 15판 세탁기 문, 24·25판 자판기 문
    // swung 5–10 cm into the wall); a doorway's gap and a floor's cut-out are open; on a map, the next room's walls and
    // furniture too (shellBoxes, nearBoxes: set by MapRooms)
    const inv = this.group.matrixWorld.clone().invert(), lv = new THREE.Vector3();
    const ray = new THREE.Ray(), ea = new THREE.Vector3(), eb = new THREE.Vector3(), ed = new THREE.Vector3(), eq = new THREE.Vector3(); let eL = 0;
    const shut = (k, along) => {
      const kind = this.L.walls?.[k] || 'wall'; if (kind === 'none') return false;
      if (kind !== 'door') return true;
      const u = this.L.doorAt?.[k] ?? 0, c = k === 'E' || k === 'N' ? u : -u;
      return Math.abs(along - c) > .58;
    };
    const intoShell = w => {
      lv.copy(w).applyMatrix4(inv);
      const hx = this.w / 2 + .02, hz = this.d / 2 + .02;
      if ((lv.x < -hx && shut('W', lv.z)) || (lv.x > hx && shut('E', lv.z)) || (lv.z < -hz && shut('N', lv.x)) || (lv.z > hz && shut('S', lv.x))) return true;
      return lv.y < -.03 && Math.abs(lv.x) < this.w / 2 && Math.abs(lv.z) < this.d / 2 && !this.isCut(Math.floor(lv.x + this.w / 2), Math.floor(lv.z + this.d / 2));
    };
    recs.forEach((r, ri) => {
      for (const p of r.f.parts) {
        const t0 = p.t;
        let fit = .35;
        // a bending cloth (gfx/clothbend.js) touching something already when shut (4판's loft futon on the loft's boards: every
        // reach "hit", so it only ever opened a third): what it touches at rest isn't what opening runs into — open it fully
        const tries = p.apply.cloth ? [0, 1, .9, .8, .7, .6, .5, .42] : [1, .9, .8, .7, .6, .5, .42];
        for (const reach of tries) {
          p.reach = reach || 1; p.setOpen(reach ? 1 : 0); p.pivots.forEach(pv => pv.updateMatrixWorld(true));
          let hit = false;
          // only what the opened piece can reach (its box), then its corners and — for thin pieces (a curtain, a rod) whose
          // corners are all outside what they pass through — its edges (10/19 겹침 QA: 9판 창 커튼이 열리면 욕실장 속 19 cm)
          const pb = new THREE.Box3(); p.pivots.forEach(pv => pb.expandByObject(pv));
          const near = [...boxes.filter((b, k) => k !== ri && b.intersectsBox(pb)), ...(!r.wall && this.shellBoxes || []).filter(b => b.intersectsBox(pb)), ...(this.nearBoxes || []).filter(b => b.intersectsBox(pb)), ...loftBoxes.filter(b => b.intersectsBox(pb))];
          const through = b => { const q = ray.intersectBox(b, eq); return q && q.distanceTo(ea) <= eL; };
          for (const pv of p.pivots) pv.traverse(o => {
            if (hit || !o.isMesh || o.userData.proxy) return;
            const pos = o.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / 160));
            for (let i = 0; i < pos.count && !hit; i += step) {
              v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
              if (near.some(b => b.containsPoint(v)) || (!r.wall && intoShell(v))) hit = true;
            }
            if (hit || !near.length) return;
            const idx = o.geometry.index, nt = (idx ? idx.count : pos.count) / 3, ts = Math.max(1, Math.floor(nt / 120));
            for (let t = 0; t < nt && !hit; t += ts) for (let e = 0; e < 3 && !hit; e++) {
              const i0 = idx ? idx.getX(t * 3 + e) : t * 3 + e, i1 = idx ? idx.getX(t * 3 + (e + 1) % 3) : t * 3 + (e + 1) % 3;
              ea.fromBufferAttribute(pos, i0).applyMatrix4(o.matrixWorld); eb.fromBufferAttribute(pos, i1).applyMatrix4(o.matrixWorld);
              eL = ea.distanceTo(eb); if (eL < .02) continue;
              ray.set(ea, ed.subVectors(eb, ea).divideScalar(eL));
              if (near.some(through)) hit = true;
            }
          });
          if (!reach) { if (hit) { fit = 1; break; } continue; }
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
    // 'cut': an upper floor whose slab keeps its floor's cut-outs open — a hatch for a pulley, a ladder or a slide to
    // pass through (10/19 user: "도르레도 있는데 잘 써먹지도 못하는거같아 유기적으로"); each hole gets a wooden rim
    // 현관 (검토 10/20): a lone room's cut corner is its entrance, a step down — the slab's top tier has the cut open and a
    // block in it .12 lower than the floor (one mesh, the same colour); buildEntry lays its tiles, the nosing and the shoes
    // (most rooms stand on the bleed floor, no slab: there the plain ground plane draws first and writes no depth, so the
    // entrance's floor just goes in under it and shows — no hole needed)
    const entry = this.L.cut?.length && !this.L.noEntry && (sk === 'cake' || (sk === 'none' && this.L.bleed));
    if (sk === 'cut') { g.add(put(holedSlab(w, d, this.L.cut || [], T.base), 0, -.38, 0)); g.children.at(-1).userData.og = slab; this.buildHatchRims(); }
    else if (entry && sk === 'cake') { g.add(put(holedSlab(w, d, this.L.cut, T.base, ENTRY_DROP), 0, -.38, 0)); g.children.at(-1).userData.og = slab; }
    else if (sk !== 'none') { g.add(put(rbox(w + .5, .36, d + .5, T.base, .16), 0, -.2, 0)); g.children.at(-1).userData.og = slab; }
    if (sk === 'cake') { g.add(put(rbox(w + .62, .2, d + .62, shade(T.base, -.08), .1), 0, -.4, 0)); g.children.at(-1).userData.og = slab; }
    const ft = floorTex(T.floorKind || 'planks', T.floor, T.floor2, T, this.L.texRes || 1024);
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
    if (entry) this.buildEntry();
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
        // panelled wainscot (opt-in, the new maps 10/21 — "깔끔하고 디테일"): raised frames between the rail and the skirting
        if (this.L.panels) { const n = Math.max(1, Math.round((r1 - r0) / .75)), pw = (r1 - r0) / n; for (let q = 0; q < n; q++) { const px = r0 + (q + .5) * pw; body.add(put(rbox(pw - .14, .56, .025, shade(T.wainscot || T.wall, .07), .015), px, .47, .015)); } }
      }
      // a crown moulding under the top of a tall wall, and a picture rail (opt-in, same)
      if (this.L.panels && y1 >= WH - .01 && WH > 2) { body.add(put(rbox(sl, .09, .06, T.trim || '#ffffff', .02), cx, WH - .1, .03)); body.add(put(rbox(sl, .025, .03, T.trim || '#ffffff', .01), cx, WH - .5, .015)); }
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
    // 다락 (L.attic, 2판 10/20): the wall's top slopes up toward the room's back corner like a roof seen from inside — hung with
    // the wall's pieces, so it folds away with the wall (gfx/bunnyattic-props.js atticTop)
    if (this.L.attic) { const at = atticTop(k, len, WH, w, d, T, baseTex, this.L.attic); at.traverse(o => { if (o.isMesh) o.userData.wall = k; if (o.userData.needs) (this.roofBits ||= []).push(o); }); decor.add(at); }
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
    // stairs in the last column: the closet under them opens on the room's side, not into the wall beside them
    // (10/19 겹침 QA: 8·18·26·30판 '계단 밑 창고' could not open at all without going into the wall)
    if (type === 'stairsup' && !rot && !opts.side && i + this.footprint(type, rot)[0] >= this.w) opts = { ...opts, side: 'left' };
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
    // (on a top: only the others on that same top are in the way)
    const sp = this.stackSpot(type, x, z, a, ignoreId);
    if (sp) { const at = this.obb(type, sp.x, sp.z, a); return !this.furns.some(r => r.id !== ignoreId && r.on === sp.base.id && obbOverlap(at, this.recObb(r))); }
    for (const r of this.furns) {
      if (r.id === ignoreId || (r.type === 'rug') !== floor || (r.on && !floor)) continue;
      if (obbOverlap(me, this.recObb(r))) return false;
    }
    if (floor) return true;
    // a slide's landing stays open: inside the room with nothing standing on it, and nothing set down on another's
    for (const zo of clearZones(type, x, z, a)) {
      for (const [cx, cz] of obbCorners(zo)) if (Math.abs(cx) > this.w / 2 || Math.abs(cz) > this.d / 2) return false;
      for (const r of this.furns) if (r.id !== ignoreId && !landing(r.type) && obbOverlap(zo, this.recObb(r))) return false;
    }
    if (landing(type)) return true;
    for (const r of this.furns) {
      if (r.id === ignoreId || !KEEP_CLEAR[r.type]) continue;
      const o = this.recObb(r, 1);
      if (clearZones(r.type, o.x, o.z, Math.atan2(o.s, o.c)).some(zo => obbOverlap(me, zo))) return false;
    }
    return true;
  }
  // the slides of this room whose landing has something on it or runs out of the room (stage layouts are placed by hand;
  // QA reads this)
  blockedSlides() {
    const out = [];
    for (const r of this.furns) {
      if (!KEEP_CLEAR[r.type]) continue;
      const o = this.recObb(r, 1), zs = clearZones(r.type, o.x, o.z, Math.atan2(o.s, o.c));
      zs.forEach((zo, i) => {
        const off = obbCorners(zo).some(([cx, cz]) => Math.abs(cx) > this.w / 2 || Math.abs(cz) > this.d / 2);
        const on = this.furns.filter(q => q !== r && !landing(q.type) && obbOverlap(zo, this.recObb(q))).map(q => q.type);
        if (off || on.length) out.push({ type: r.type, id: r.id, zone: i, off, on });
      });
    }
    return out;
  }
  addFurnitureAt(type, x, z, a = 0, id = null, opts = {}) {
    const f = makeFurniture(type, this.T, opts);
    f.group.position.set(x, 0, z); f.group.rotation.y = a;
    this.group.add(f.group);
    const rec = { f, type, x, z, a, id: id ?? ('f' + Math.random().toString(36).slice(2, 8)), opts };
    this.tileApprox(rec);
    f.rec = rec; this.furns.push(rec);
    if (this.stack) this.settle(rec);
    this.world.shadowDirty = true;
    return rec;
  }
  moveFurnitureAt(rec, x, z, a) {
    rec.x = x; rec.z = z; rec.a = a; this.tileApprox(rec);
    rec.f.group.position.set(x, 0, z); rec.f.group.rotation.y = a;
    if (this.stack) this.settle(rec);
    this.world.shadowDirty = true;
  }
  // 가구 위에 올리기: the piece a small one at (x, z) would stand on — its centre over the top — and where on that top it goes
  // (pulled in so it doesn't hang over the edge); null on the floor
  stackSpot(type, x, z, a, ignoreId = null) {
    if (!this.stack || !STACK_SMALL.has(type)) return null;
    for (const r of this.furns) {
      if (r.id === ignoreId || r.on || STACK_TOP[r.type] == null || r.type === type) continue;
      const o = this.recObb(r, 1), dx = x - o.x, dz = z - o.z, u = dx * o.c - dz * o.s, v = dx * o.s + dz * o.c;
      if (Math.abs(u) > o.hw || Math.abs(v) > o.hd) continue;
      const me = this.obb(type, 0, 0, 0, 1), mu = Math.max(0, o.hw - me.hw * .8), mv = Math.max(0, o.hd - me.hd * .8);
      const cu = clamp(u, -mu, mu), cv = clamp(v, -mv, mv);
      return { base: r, x: o.x + cu * o.c + cv * o.s, z: o.z - cu * o.s + cv * o.c, y: STACK_TOP[r.type] };
    }
    return null;
  }
  // a small piece sits on whatever it is over (rec.on: that piece's id), or back on the floor
  settle(rec) {
    if (!STACK_SMALL.has(rec.type)) return;
    const sp = this.stackSpot(rec.type, rec.x, rec.z, rec.a, rec.id);
    rec.on = sp ? sp.base.id : null; rec.y = sp ? sp.y : 0; rec.f.group.position.y = rec.y;
  }
  topsOn(rec) { return this.furns.filter(r => r.on === rec.id); }
  // tile-based callers (stage planner, NPC tiles) still see an approximate i, j, rot
  tileApprox(rec) {
    const rot = ((Math.round(rec.a / (Math.PI / 2)) % 4) + 4) % 4, [fw, fd] = this.footprint(rec.type, rot);
    rec.rot = rot; rec.i = Math.max(0, Math.min(this.w - fw, Math.round(rec.x + this.w / 2 - fw / 2))); rec.j = Math.max(0, Math.min(this.d - fd, Math.round(rec.z + this.d / 2 - fd / 2)));
  }
  // tiles whose centre lies under some furniture (rugs don't count)
  // tiles with no floor (layout.cut: [{ i, j, w, d }]) and the height of the floor at a tile (raised sections)
  // a wooden frame round each hole in a 'cut' floor, so an opening reads as made, not missing
  buildHatchRims() {
    const { w, d, T } = this, col = T.woodD || '#c98d55';
    for (const c of this.L.cut || []) {
      const x0 = -w / 2 + c.i, z0 = -d / 2 + c.j, x1 = x0 + c.w, z1 = z0 + c.d, t = .07, h = .05;
      for (const [cx, cz, sx, sz] of [[(x0 + x1) / 2, z0 + t / 2, c.w, t], [(x0 + x1) / 2, z1 - t / 2, c.w, t], [x0 + t / 2, (z0 + z1) / 2, t, c.d - 2 * t], [x1 - t / 2, (z0 + z1) / 2, t, c.d - 2 * t]]) {
        this.group.add(put(rbox(sx, h, sz, col, .015), cx, h / 2, cz));
      }
    }
  }
  // 현관 floor: big calm checker tiles (two squares a metre, quieter than the room's own colours), the wooden nosing on the
  // step and the owner's shoes (gfx/house-props.js entryNook — one mesh). No light, no shadow of their own; nobody stands there
  // (cut tiles are never walked or placed on) and no hiding place yet (the level session's call)
  buildEntry() {
    // (the room's own floor colour, drained to a greige and lightened: two calm tones a step apart — quieter than the room)
    const { w, d, T } = this, hsl = {}; new THREE.Color(T.floor || T.base || '#d8c4a8').getHSL(hsl);
    const a = '#' + new THREE.Color().setHSL(hsl.h, Math.min(.22, hsl.s * .3), .86).getHexString(), b = '#' + new THREE.Color().setHSL(hsl.h, Math.min(.22, hsl.s * .3), .75).getHexString();
    for (const c of this.L.cut) {
      const tt = floorTex('checker', a, b, T); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(c.w, c.d);
      const tm = put(plane(c.w, c.d, mat('#ffffff', { map: tt, rough: .75, rim: .1 })), -w / 2 + c.i + c.w / 2, -ENTRY_DROP + .001, -d / 2 + c.j + c.d / 2, -Math.PI / 2);
      tm.userData.floor = true; tm.receiveShadow = true; this.group.add(tm);
      const nook = entryNook(c, w, d, T, T.friend, ENTRY_DROP); nook.castShadow = false; nook.receiveShadow = true; this.group.add(nook);
      // the ground plane round a bleed room is see-through, so it draws after everything solid — over the sunken entrance too:
      // its mask gets the cut corner punched out (its own canvas, made for this room — makeApron)
      const am = this.apron?.material.alphaMap, cv = am?.image;
      if (cv?.getContext) {
        const N = cv.width, S = this.apron.geometry.parameters.width, px = v => (v + S / 2) / S * N, x = cv.getContext('2d');
        x.fillStyle = '#000'; x.fillRect(px(-w / 2 + c.i), px(-d / 2 + c.j), c.w / S * N, c.d / S * N); am.needsUpdate = true;
      }
    }
  }
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
    // a little step in front so it reads as a platform you climb onto ('full': one step the whole width of its front)
    if (z.step === 'full') g.add(put(rbox(z.w, h * .5, .26, shade(edge, .08), .02), cx, h * .25, cz + z.d / 2 + .13));
    else if (z.step !== false && !z.stairs) g.add(put(rbox(Math.min(1, z.w * .5), h * .5, .28, shade(edge, .08), .03), cx + (z.stepX ?? 0), h * .25, cz + z.d / 2 + .14));
    // (새 맵 10/21, 사용자 "단차 같은 거 신경 써서… 깔끔하고 디테일하게"): opt-in finish for a platform — a rounded nosing along its
    // open edges (z.nose), a darker plinth at their foot (z.plinth), and real stairs (z.stairs: [{ side, at, w }]) down to the floor
    const open = { N: z.j > 0, S: z.j + z.d < d, W: z.i > 0, E: z.i + z.w < w };
    const along = (s, cb) => { if (!open[s]) return; const ns = s === 'N' || s === 'S', L = ns ? z.w : z.d, ex = s === 'E' ? z.w / 2 : s === 'W' ? -z.w / 2 : 0, ez = s === 'S' ? z.d / 2 : s === 'N' ? -z.d / 2 : 0; cb(ns, L, cx + ex, cz + ez); };
    for (const s of ['N', 'S', 'W', 'E']) {
      if (z.nose) along(s, (ns, L, x, zz) => g.add(put(rbox(ns ? L + .06 : .09, .07, ns ? .09 : L + .06, z.nose, .03), x, h + .01, zz)));
      if (z.plinth) along(s, (ns, L, x, zz) => g.add(put(rbox(ns ? L : .05, .07, ns ? .05 : L, z.plinth, .015), x + (s === 'E' ? .005 : s === 'W' ? -.005 : 0), .035, zz + (s === 'S' ? .005 : s === 'N' ? -.005 : 0))));
    }
    for (const st of z.stairs || []) {
      const n = Math.max(2, Math.round(h / .15)), td = .26, sw = st.w || 1, sx = st.side === 'E' ? 1 : st.side === 'W' ? -1 : 0, sz = st.side === 'S' ? 1 : st.side === 'N' ? -1 : 0;
      const ox = sx ? cx + sx * z.w / 2 : cx + (st.at || 0), oz = sz ? cz + sz * z.d / 2 : cz + (st.at || 0);
      for (let k = 1; k < n; k++) {
        const hh = h * (n - k) / n, dx = sx * (k - .5) * td, dz = sz * (k - .5) * td;
        g.add(put(rbox(sx ? td + .02 : sw, hh, sz ? td + .02 : sw, shade(edge, .06 * k), .025), ox + dx, hh / 2, oz + dz));
        if (z.nose) g.add(put(rbox(sx ? .08 : sw + .04, .05, sz ? .08 : sw + .04, z.nose, .02), ox + dx + sx * (td / 2 - .03), hh + .005, oz + dz + sz * (td / 2 - .03)));
      }
    }
    // a stone face on the open front and east sides (opt-in, z.stone: the platform's wall in the station picture) — blocks
    // in courses, a darker joint behind them, ivy hanging down in a few places
    if (z.stone) {
      const sc = z.stone, rows = Math.max(1, Math.round(h / .14)), rh = h / rows;
      for (const side of ['S', 'E']) { const L = side === 'S' ? z.w : z.d;
        for (let r = 0; r < rows; r++) for (let u = -L / 2 + (r % 2 ? .18 : 0); u < L / 2 - .05; u += .36) { const bw = Math.min(.32, L / 2 - u - .02), bc = shade(sc, ((r * 7 + Math.round(u * 10)) % 3 - 1) * .04);
          if (side === 'S') g.add(put(rbox(bw, rh * .84, .03, bc, .012), cx + u + bw / 2, rh * (r + .5), cz + z.d / 2 + .012));
          else g.add(put(rbox(.03, rh * .84, bw, bc, .012), cx + z.w / 2 + .012, rh * (r + .5), cz + u + bw / 2)); }
        if (z.ivy) for (let q = 0; q < 3; q++) { const u = -L / 2 + L * (.2 + q * .3), n = 3 + q % 2; for (let m = 0; m < n; m++) { const leaf = put(sph(.06, '#6cbf5a'), 0, 0, 0); leaf.scale.set(1.2, .8, .6);
          if (side === 'S') leaf.position.set(cx + u + Math.sin(m) * .05, h - .03 - m * .09, cz + z.d / 2 + .04); else leaf.position.set(cx + z.w / 2 + .04, h - .03 - m * .09, cz + u + Math.sin(m) * .05); g.add(leaf); } } }
    }
    // a tactile strip along the front edge on top (opt-in, z.strip: the platform's yellow line)
    if (z.strip) g.add(put(rbox(z.w - .1, .012, .14, z.strip, .004), cx, h + .012, cz + z.d / 2 - .2));
    // trim (opt-in, the new maps 10/21 — user "단차 같은 거 좀 신경 써서… 깔끔하고 디테일해야"): a pale nosing along the open
    // front and east edges, a shade line under it, so the level change reads clean and made
    if (z.trim) {
      const tc = z.trim, sc = shade(edge, -.18);
      g.add(put(rbox(z.w + .04, .045, .07, tc, .015), cx, h + .012, cz + z.d / 2 + .005));
      g.add(put(rbox(.07, .045, z.d + .04, tc, .015), cx + z.w / 2 + .005, h + .012, cz));
      g.add(put(rbox(z.w, .02, .012, sc, .004), cx, h - .05, cz + z.d / 2 + .01));
      g.add(put(rbox(.012, .02, z.d, sc, .004), cx + z.w / 2 + .01, h - .05, cz));
    }
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
    // (10/22 사용자 실폰 1판 "복층이랑 벽 경계 원래 이랬나?": turning the view folds the near walls down to knee height, and the
    // deck's wall side then hung in the air) the corners against a wall get posts too, close to the wall under the deck — shown
    // only while that wall is folded down (update), so a standing wall still carries the deck as before
    this.loftWallPosts = this.loftWallPosts || [];
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1]]) {
      const walls = [...(atW && px === x0 ? ['W'] : []), ...(atN && pz === z0 ? ['N'] : [])]; if (!walls.length) continue;
      const m = add(put(rbox(.12, y - .2, .12, woodD, .03), px + (px === x0 ? .06 : -.07), (y - .2) / 2, pz + (pz === z0 ? .06 : -.07)));
      m.visible = false; m.userData.wallPost = true; this.loftWallPosts.push({ m, walls });
    }
    // railing: the front edge (+z) and the east edge (+x), with a gap for the ladder
    const lad = lf.ladder || 'S', gap = lf.ladderAt ?? 0;
    const rail = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az); if (L < .1) return; const ang = Math.atan2(bz - az, bx - ax);
      add(put(rbox(L, .07, .07, wood, .02), (ax + bx) / 2, y + .55, (az + bz) / 2, 0, -ang, 0));
      for (let t = .5; t < L; t += .32) add(put(rbox(.05, .5, .05, wood, .015), ax + (bx - ax) * t / L, y + .28, az + (bz - az) * t / L)); };
    if (lad === 'S' || lad === 'stairs') { const gx = cx + gap, gw = lad === 'stairs' ? .45 : .35; rail(x0, z1, gx - gw, z1); rail(gx + gw, z1, x1, z1); } else rail(x0, z1, x1, z1);
    if (lad === 'E') { const gz = cz + gap; rail(x1, z0, x1, gz - .35); rail(x1, gz + .35, x1, z1); } else rail(x1, z0, x1, z1);
    // a curtain round the open sides (2판 only — tiers.js tiltLayout): the loft becomes a nook you see into only from above,
    // the tilt lesson's place (검토 재검토 1: through the railing the quilt star showed from the first view)
    if (lf.curtain) {
      const cc = lf.curtainColor || shade(T.wall2 || '#ffb3a3', .12), cd = shade(cc, -.16), h = 1.05, top = y + 1.1;
      // a real curtain, not a striped board (user, 2판 on a phone: "침대 쪽 벽인 거 같아서 이상함"): the cloth hangs in deep
      // soft folds (a wavy sheet, so the toon light shades each fold), from rings on a round rod with knob ends, with a
      // scalloped hem — it still closes the nook from the side, as the tilt lesson needs
      const panel = (ax, az, bx, bz) => {
        const L = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bz - az, bx - ax);
        const A = .045, k = Math.PI * 2 / .19, t = .02, n = Math.max(8, Math.round(L / .02));
        const sh = new THREE.Shape(); sh.moveTo(0, t / 2);
        for (let i = 1; i <= n; i++) { const u = L * i / n; sh.lineTo(u, A * Math.sin(k * u) + t / 2); }
        for (let i = n; i >= 0; i--) { const u = L * i / n; sh.lineTo(u, A * Math.sin(k * u) - t / 2); }
        const cg = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 4 }); cg.rotateX(-Math.PI / 2);
        const cloth = add(new THREE.Mesh(cg, mat(cc, { rough: .9, rim: .1, side: THREE.DoubleSide })));
        cloth.position.set(ax, top - h - .02, az); cloth.rotation.y = -ang;
        const at = (u, yy) => [ax + (bx - ax) * u / L, yy, az + (bz - az) * u / L];
        for (let u = .06; u < L - .03; u += .11) { const [px, py, pz] = at(u, top - h - .015); add(put(new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 5), mat(cd, { rough: .9 })), px, py, pz, 0, 0, 0, [1, .55, 1])); }   // the scalloped hem
        add(put(new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, L + .1, 10), mat(woodD)), (ax + bx) / 2, top + .05, (az + bz) / 2, 0, -ang, Math.PI / 2));   // the rod
        for (const u of [-.05, L + .05]) { const [px, , pz] = at(u, 0); add(put(new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), mat(woodD)), px, top + .05, pz)); }   // its knobs
        for (let u = .1; u < L - .05; u += .19) { const [px, , pz] = at(u, 0); add(put(new THREE.Mesh(new THREE.TorusGeometry(.03, .008, 4, 10), mat('#e8d6a8')), px, top + .05, pz, 0, Math.PI / 2 - ang, 0)); }   // rings round the rod
      };
      // (hung a hand outside the railing: the folds' hollows went behind it and the baluster tops showed through the cloth)
      panel(x0, z1 + .1, x1 + .1, z1 + .1); panel(x1 + .1, z0, x1 + .1, z1 + .1);
    }
    // (lf.ladder 'stairs': the gap in the rail only — a stairs piece of furniture comes up to it, 18판 너굴이네 서랍 계단)
    if (lad === 'stairs') { this.lofts = this.lofts || []; this.lofts.push({ ...lf, y, group: g }); this.group.add(g); this.extraSolid.push(...postMeshes); return; }
    // ladder leaning against the open side
    const lx = lad === 'S' ? cx + gap : x1 + .45, lz = lad === 'S' ? z1 + .45 : cz + gap, ry = lad === 'S' ? 0 : Math.PI / 2;
    const ladder = new THREE.Group(); ladder.position.set(lx, 0, lz); ladder.rotation.y = ry;
    const tilt = Math.atan2(.45, y);
    // (the rails lean from their feet, the line the rungs follow — they used to turn about their middle, which left the rungs
    // floating a hand in front of them: user, 4판 on a phone, "사다리 기둥이랑 다리랑 떨어져 있어")
    const RL = y + .2;
    for (const sx of [-.24, .24]) { const r = put(rbox(.07, RL, .07, woodD, .02), sx, RL / 2 * Math.cos(tilt), -RL / 2 * Math.sin(tilt)); r.rotation.x = -tilt; ladder.add(r); }
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
  // 배치 편집's fine touches on top of the grid (10/19): s = size, ry = an extra turn in degrees, dx / dz = a nudge in
  // metres, dy = up or down (wall pieces; they slide along the wall by u already). Set on the piece's group, so its
  // hiding spots and doors go with it. A wall piece grows from its middle and keeps its back on the wall.
  fine(rec, e = rec) {
    const g = rec.f.group, s = +e.s || 1, ry = +e.ry || 0, dx = +e.dx || 0, dz = +e.dz || 0, dy = +e.dy || 0;
    Object.assign(rec, { s, ry, dx, dz, dy });
    if (rec.wall) {
      if (!rec.c0) {
        g.scale.setScalar(1); g.position.set(rec.u, 0, 0); g.updateWorldMatrix(true, true);
        rec.c0 = g.worldToLocal(new THREE.Box3().setFromObject(g, true).getCenter(new THREE.Vector3()));
      }
      g.scale.setScalar(s); g.position.set(rec.u + rec.c0.x * (1 - s), dy + rec.c0.y * (1 - s), 0);
    } else {
      const [fw, fd] = this.footprint(rec.type, rec.rot), p = rec.x != null ? new THREE.Vector3(rec.x, 0, rec.z) : this.tileToWorld(rec.i, rec.j, fw, fd);
      g.scale.setScalar(s); g.position.x = p.x + dx; g.position.z = p.z + dz;
      g.rotation.y = (rec.x != null ? rec.a || 0 : rec.rot * Math.PI / 2) + ry * Math.PI / 180;
    }
    this.world.shadowDirty = true;
    return rec;
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
    // a gift's own little motion (gift-props.js: f.idle turns its live groups)
    this.liveT = (this.liveT || 0) + dt; for (const r of this.furns) r.f.idle?.(this.liveT);
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
    // a loft's posts against a wall: up only while that wall is folded down (buildLoft)
    if (this.loftWallPosts) for (const q of this.loftWallPosts) { const on = q.walls.some(k => this.walls[k] && this.walls[k].kk <= .65); if (q.m.visible !== on) { q.m.visible = on; wd.shadowDirty = true; } }
    // roof pieces that rest on two walls (다락 박공 L.attic.gable): shown only while both stand
    if (this.roofBits) for (const b of this.roofBits) b.visible = b.userData.needs.every(q => !this.walls[q] || this.walls[q].kk > .65);
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

// an upper floor's slab (.36 thick, overhanging .25 like the solid one) with its floor's cut-outs left open — or, with
// fill (a lone room's 현관), each cut-out filled again up to `fill` under the floor: a step down into the entrance
const ENTRY_DROP = .12;
function holedSlab(w, d, cuts, color, fill = 0) {
  const W = w + .5, D = d + .5, r = .16, sh = new THREE.Shape();
  sh.moveTo(-W / 2 + r, -D / 2); sh.lineTo(W / 2 - r, -D / 2); sh.quadraticCurveTo(W / 2, -D / 2, W / 2, -D / 2 + r);
  sh.lineTo(W / 2, D / 2 - r); sh.quadraticCurveTo(W / 2, D / 2, W / 2 - r, D / 2); sh.lineTo(-W / 2 + r, D / 2);
  sh.quadraticCurveTo(-W / 2, D / 2, -W / 2, D / 2 - r); sh.lineTo(-W / 2, -D / 2 + r); sh.quadraticCurveTo(-W / 2, -D / 2, -W / 2 + r, -D / 2);
  for (const c of cuts) {
    const x0 = -w / 2 + c.i, y0 = -d / 2 + c.j, hole = new THREE.Path();
    hole.moveTo(x0, y0); hole.lineTo(x0, y0 + c.d); hole.lineTo(x0 + c.w, y0 + c.d); hole.lineTo(x0 + c.w, y0); hole.lineTo(x0, y0);
    sh.holes.push(hole);
  }
  let geo = new THREE.ExtrudeGeometry(sh, { depth: .36, bevelEnabled: false, curveSegments: 4 });
  geo.rotateX(Math.PI / 2);   // shape x/y → world x/z, extruded downward from y 0 to -.36… then lifted by the caller
  geo.translate(0, .36, 0);
  if (fill) {
    const parts = [geo.index ? geo.toNonIndexed() : geo];
    for (const c of cuts) { const b = new THREE.BoxGeometry(c.w, .36 - fill, c.d).toNonIndexed(); b.translate(-w / 2 + c.i + c.w / 2, (.36 - fill) / 2, -d / 2 + c.j + c.d / 2); b.deleteAttribute('uv'); parts.push(b); }
    parts.forEach(q => { for (const k of Object.keys(q.attributes)) if (k !== 'position' && k !== 'normal') q.deleteAttribute(k); });
    geo = mergeGeometries(parts, false);
  }
  return mesh(geo, mat(color, { rough: .8 }));
}

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

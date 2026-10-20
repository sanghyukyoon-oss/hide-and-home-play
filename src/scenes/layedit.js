// 배치 편집 (2026-10-17, user: "배치모드로 스테이지 1~70까지 고르면서 모든 스테이지 수정"): pick any stage, then move, turn,
// swap, add or remove its furniture and wall pieces and change its wallpaper and floor. Saved per room on this device
// (layedits.js), so every stage that uses the room plays with the fix; 내보내기 copies the JSON to bake into stages.js.
// The room is rebuilt from the edited layout after every change, so lofts, raised floors and the wall tidy-up
// (Room.settleDecor) behave exactly as they will in the stage.
import * as THREE from 'three';
import { Room } from '../room.js';
import { MapRooms, FLOOR_H } from '../map.js';
import { FURN_INFO } from '../gfx/furniture.js';
import { h } from '../ui.js';
import { disposeTree } from '../gfx/kit.js';
import { Tweens, clamp, ease } from '../util.js';
import { stageSpec, layoutFor, THEMES, STAGE_COUNT } from '../stages.js';
import { EDITS, saveEdits, editOf } from '../layedits.js';
import { WALLPAPERS, PAINTS, FLOORS } from '../catalog.js';
import { initNet } from '../net.js';

const clone = o => JSON.parse(JSON.stringify(o));
// a layout whose editable parts are our own copies (LAYOUTS / MAPS share their arrays between calls)
function own(L) {
  const mine = l => ({ ...l, furniture: clone(l.furniture || []), decor: clone(l.decor || []), ...(l.door ? { door: clone(l.door) } : {}) });
  return L.rooms ? { ...L, rooms: L.rooms.map(r => ({ ...r, layout: mine(r.layout) })) } : mine(L);
}
const WALL_OK = k => !k || k === 'wall' || k === 'alleywall';

// 크기 · 돌리기 · 살짝 옮기기 (10/19, user: "내가 크기나 위치, 로테이션 수정하면 정본에도"): fine touches on top of the
// grid, kept on the layout entry (s, ry in degrees, dx / dz in metres; dy for wall pieces) and set by Room.fine, so the
// stage builds them exactly as the editor shows them.
const FINE = { s: { min: .6, max: 1.6, step: .05, def: 1 }, ry: { step: 5, def: 0 }, dy: { min: -.8, max: .8, step: .05, def: 0 } };
const NUDGE = .05;
const r2 = v => Math.round(v * 100) / 100;
const SV = d => `<svg viewBox="0 0 40 40"><path d="${d}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const IC = {
  minus: SV('M10 20h20'), plus: SV('M10 20h20M20 10v20'),
  up: SV('M20 32V9M10 18l10-10 10 10'), left: SV('M25 8L13 20l12 12'), right: SV('M15 8l12 12-12 12'),
  rotL: SV('M12 14a11 11 0 1 1-2 10M11 6v9h9'), rotR: SV('M28 14a11 11 0 1 0 2 10M29 6v9h-9'),
  undo: SV('M14 9L7 16l7 7M8 16h15a9 9 0 0 1 0 18h-6'), turn: SV('M30 13A12 12 0 1 0 32 24M24 12h8V4'),
};
const ICON_CHECK = SV('M9 21l7 7 15-16');
const CSS = `
.le-sel.le-col { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 6px; }
.le-row { display: flex; align-items: center; gap: 6px; justify-content: center; }
.le-ctl { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; }
.le-row.le-head { justify-content: flex-start; flex-wrap: wrap; }
.le-row.le-head .le-name { flex: 1; min-width: 70px; }
.le-lab { width: 62px; flex: none; font-size: 15px; color: var(--ink); text-align: left; padding-left: 4px; line-height: 1.1; }
.le-val { pointer-events: auto; cursor: pointer; min-width: 58px; flex: none; text-align: center; padding: 9px 4px; border-radius: 14px; background: #fff; border: 3px solid var(--ink); font-size: 16px; color: var(--ink); }
.le-val.off { color: #9a8ab0; }
.le-sel .btn.le-step { width: 50px; height: 48px; padding: 0; flex: none; -webkit-touch-callout: none; touch-action: none; }
.le-sel .btn.le-step svg, .le-act .btn svg { width: 26px; height: 26px; }
.le-act { display: flex; gap: 6px; justify-content: center; align-items: center; }
.le-act .btn { font-size: 16px; padding: .4em .8em .5em; }
.btn.le-saved { --c1: #e6f7da; --c2: #b6e3a0; }
.btn.le-saved .lbl { color: #2f6b1f; -webkit-text-stroke-width: 0; text-shadow: none; }
.btn.le-saved svg path { stroke: #2f6b1f; }
.le-top .btn.sm svg { width: 22px; height: 22px; }
`;

export class LayEditScene {
  constructor(G) { this.G = G; this.name = 'layedit'; }
  async enter({ idx = 0 } = {}) {
    const G = this.G, W = G.world;
    this.tw = new Tweens();
    W.onTap = (x, y) => this.tap(x, y);
    W.onDragStart = (x, y) => this.dragStart(x, y);
    W.onRotate = null; W.tapInstant = null;
    G.audio.music('home');
    document.getElementById('app').style.setProperty('--joyB', '200px');   // the turn/move badge sits above the editor bar
    if (!document.getElementById('le-css')) document.head.append(h('style', { id: 'le-css' }, CSS));
    this.buildHud();
    this.load(idx);
    if (!G.save.tut?.layedit) {
      (G.save.tut || (G.save.tut = {})).layedit = true; G.persist();
      G.ui.toast('가구를 터치해서 골라 끌면 옮겨져요. 크기·돌리기·살짝 옮기기는 아래 버튼으로!', 'green');
    }
  }
  exit() {
    this.dead = true;
    document.getElementById('app').style.removeProperty('--joyB');
    const W = this.G.world;
    if (this.room) { W.root.remove(this.room.group); disposeTree(this.room.group); }
    W.onTap = null; W.onDragStart = null;
    this.G.ui.clear(); this.tw.clear();
  }

  // ── which stage / room
  load(idx) {
    this.idx = clamp(idx, 0, STAGE_COUNT - 1);
    this.key = stageSpec(this.idx).room;
    this.lay = own(layoutFor(this.key));
    this.dirty = false; this.sel = null;
    this.build(true);
    // what you see is what gets saved: a room not edited yet was tidied automatically, so take its wall pieces where
    // they ended up (dropping the ones that were put away) and from here on build it exactly as the data says
    if (!EDITS[this.key]) this.snapshot();
    this.hist = []; this.lastKey = null; this.saved = this.snap();
    this.updHud();
  }
  // ── undo: the layout as it was before each change (a run of taps on one 크기 / 돌리기 / 옮기기 button is one step)
  snap() {
    const L = this.lay, p = l => ({ furniture: l.furniture || [], decor: l.decor || [], door: l.door || null });
    return JSON.stringify(L.rooms ? { rooms: L.rooms.map(r => ({ ...p(r.layout), th: r.layout.theme })), theme: L.theme, et: L.editTheme || null } : { ...p(L), theme: L.theme, et: L.editTheme || null });
  }
  restore(str) {
    const o = JSON.parse(str), L = this.lay;
    const put = (l, x) => { l.furniture = x.furniture; l.decor = x.decor; if (x.door) l.door = x.door; else delete l.door; };
    if (L.rooms) o.rooms.forEach((x, i) => { put(L.rooms[i].layout, x); L.rooms[i].layout.theme = x.th; }); else put(L, o);
    L.theme = o.theme; if (o.et) L.editTheme = o.et; else delete L.editTheme;
  }
  mark(key = null) {
    const now = performance.now();
    if (key && key === this.lastKey && now - this.lastAt < 1500) { this.lastAt = now; return false; }
    this.hist.push(this.snap()); if (this.hist.length > 80) this.hist.shift();
    this.lastKey = key; this.lastAt = now;
    return true;
  }
  undo() {
    const s = this.hist.pop();
    if (!s) { this.G.ui.toast('되돌릴 게 없어요', ''); return; }
    this.lastKey = null; this.restore(s);
    this.build(); this.G.audio.sfx('swish'); this.updHud();
    this.G.ui.toast('하나 되돌렸어요', '');
  }
  snapshot() {
    this.rooms().forEach((R, ri) => {
      const L = this.layOf(ri), n = (L.decor || []).length;
      const keep = [];
      R.decors.forEach((rec, di) => {
        const u = +(+rec.f.group.position.x).toFixed(2);
        if (di < n) { if (!rec.hidden) keep.push({ ...L.decor[di], u }); }
        else if (L.door) L.door = { ...L.door, u };
      });
      L.decor = keep;
    });
    this.setExact(); this.build();
  }
  setExact() { if (this.lay.rooms) this.lay.rooms.forEach(r => { r.layout.exact = true; }); else this.lay.exact = true; }
  sharers() { const out = []; for (let i = 0; i < STAGE_COUNT; i++) if (stageSpec(i).room === this.key) out.push(i + 1); return out; }
  layOf(ri) { return this.lay.rooms ? this.lay.rooms[ri].layout : this.lay; }
  rooms() { return this.room.rooms || [this.room]; }
  build(frame = false) {
    const G = this.G, W = G.world;
    // every rebuild (each edit, each stage flipped to) frees the old room's GPU memory: flipping through stages kept
    // piling up rooms until the phone's browser gave up (user, 10/17: "스테이지 계속 넘기면 튕김")
    if (this.room) { W.root.remove(this.room.group); disposeTree(this.room.group); }
    this.footprint = null;
    const th = { ...(THEMES[this.key] || this.lay.theme || {}), ...(this.lay.editTheme || {}) };
    G.setBg(th.bg || ['#fff3e3', '#ffe2c4']); W.setLight(th.light || null);
    this.room = this.lay.rooms ? new MapRooms(W, this.lay) : new Room(W, this.lay);
    W.root.add(this.room.group);
    W.idsDirty = true; W.shadowDirty = true;
    if (frame) this.frameCamera();
    if (this.sel) this.select(this.recOf(this.sel), true);
  }
  frameCamera() {
    const W = this.G.world, R = this.room;
    const big = R.rooms ? R : null, rw = R.w, rd = R.d;
    const c = big ? big.center : new THREE.Vector3(0, 0, 0), floors = big ? big.levels.length : 1;
    const span = (rw + rd) / Math.SQRT2 + .5, fitW = Math.min(span, 9), tall = (floors - 1) * FLOOR_H;
    W.home.set(c.x, big ? (big.levels[0] * FLOOR_H + tall / 2 + .75) : .75, c.z); W.target.copy(W.home);
    W.yaw = Math.PI / 4; W.pitch = floors > 1 ? .5 : .62; W.zoom = 1; W.vYaw = 0; W.autoSpin = 0;
    W.bounds = Math.max(2.4, Math.max(rw, rd) * .55); W.minZoom = .7; W.maxZoom = 8; W.minPitch = .06; W.maxPitch = 1.45;
    const extra = Math.max(0, span - fitW) / 2;
    W.slack = extra > 0 ? { x: extra, z: extra } : null;
    W.setFit(Math.max(7.5, fitW), Math.max(6.6, fitW * .62 + tall * .85), .45);
  }

  // ── selection: { ri, kind: 'f' | 'd' | 'door', k } (indices into the layout, so it survives a rebuild)
  locate(rec) {
    const RS = this.rooms();
    for (let ri = 0; ri < RS.length; ri++) {
      const L = this.layOf(ri), fi = RS[ri].furns.indexOf(rec);
      if (fi >= 0 && fi < (L.furniture || []).length) return { ri, kind: 'f', k: fi };
      const di = RS[ri].decors.indexOf(rec);
      if (di >= 0) return di < (L.decor || []).length ? { ri, kind: 'd', k: di } : L.door ? { ri, kind: 'door', k: 0 } : null;
    }
    return null;
  }
  recOf(s) {
    const R = this.rooms()[s.ri]; if (!R) return null;
    if (s.kind === 'f') return R.furns[s.k] || null;
    if (s.kind === 'd') return R.decors[s.k] || null;
    return R.doorDecor || null;
  }
  entry(s) { const L = this.layOf(s.ri); return s.kind === 'f' ? L.furniture[s.k] : s.kind === 'd' ? L.decor[s.k] : L.door; }
  select(rec, quiet = false) {
    const G = this.G, R0 = this.room;
    this.footprint?.parent?.remove(this.footprint); this.footprint = null;
    this.sel = rec ? this.locate(rec) : null;
    if (this.sel && rec) {
      const R = this.rooms()[this.sel.ri];
      if (this.sel.kind === 'f') {
        const fp = this.footprint = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#7be04f', transparent: true, opacity: .5, depthWrite: false }));
        fp.rotation.x = -Math.PI / 2; fp.userData.noOcclude = true; fp.renderOrder = 3;
        R.group.add(fp); this.placeFootprint(rec, R);
      }
      if (!quiet) {
        const g = rec.f.group, s0 = g.scale.clone();
        this.tw.run(.25, k => g.scale.copy(s0).multiplyScalar(1 + Math.sin(k * Math.PI) * .08), ease.linear).then(() => g.scale.copy(s0));
        G.audio.sfx('click');
      }
      if (rec.hidden) G.ui.toast('이 벽 장식은 자리가 없어서 안 보여요. 옮기거나 빼 주세요', 'red');
    }
    void R0;
    this.updHud();
  }

  // the green patch under the chosen piece: its tiles, grown, turned and nudged with it; red while it pokes into a wall
  placeFootprint(rec, R, at = null) {
    const fp = this.footprint; if (!fp) return;
    const [fw, fd] = R.footprint(rec.type, rec.rot), s = rec.s || 1, p = at || R.tileToWorld(rec.i, rec.j, fw, fd).add(new THREE.Vector3(rec.dx || 0, 0, rec.dz || 0));
    fp.scale.set(Math.max(.2, fw * s - .06), Math.max(.2, fd * s - .06), 1);
    fp.rotation.z = (rec.ry || 0) * Math.PI / 180;
    fp.position.set(p.x, (rec.y || 0) + .03, p.z);
    fp.material.color.set(this.overWall(rec, R) > .03 ? '#ff4f66' : '#7be04f');
  }
  // how far (m) a furniture piece sticks out past each edge of its room's floor, i.e. into or through a wall
  sides(rec, R) {
    const g = rec.f.group; g.updateWorldMatrix(true, true);
    const b = new THREE.Box3().setFromObject(g, true), o = R.group.getWorldPosition(new THREE.Vector3());
    if (b.isEmpty()) return { xp: 0, xn: 0, zp: 0, zn: 0 };
    return { xp: b.max.x - o.x - R.w / 2, xn: -R.w / 2 - (b.min.x - o.x), zp: b.max.z - o.z - R.d / 2, zn: -R.d / 2 - (b.min.z - o.z) };
  }
  overWall(rec, R) { const q = this.sides(rec, R); return Math.max(0, q.xp, q.xn, q.zp, q.zn); }
  // grown or turned against a wall: slide it back into the room (no further out than it already was); false if it can't fit
  keepIn(rec, R, e, base) {
    const q = this.sides(rec, R), lim = k => Math.max(base[k], .02), up = v => Math.ceil(v * 100) / 100;
    let sx = 0, sz = 0;
    if (q.xp > lim('xp')) sx -= up(q.xp - lim('xp')); if (q.xn > lim('xn')) sx += up(q.xn - lim('xn'));
    if (q.zp > lim('zp')) sz -= up(q.zp - lim('zp')); if (q.zn > lim('zn')) sz += up(q.zn - lim('zn'));
    if (!sx && !sz) return true;
    const dx = r2((e.dx || 0) + sx), dz = r2((e.dz || 0) + sz);
    if (Math.abs(dx) > 1 || Math.abs(dz) > 1) return false;
    if (dx) e.dx = dx; else delete e.dx; if (dz) e.dz = dz; else delete e.dz;
    R.fine(rec, e);
    const q2 = this.sides(rec, R);
    return ['xp', 'xn', 'zp', 'zn'].every(k => q2[k] <= lim(k) + .01);
  }

  // ── input
  pick(x, y) {
    for (const hh of this.G.world.pick(x, y, [this.room.group])) {
      if (hh.object === this.footprint) continue;
      for (let o = hh.object; o; o = o.parent) if (o.userData.furn?.rec) return o.userData.furn.rec;
    }
    return null;
  }
  tap(x, y) { this.select(this.pick(x, y)); }
  dragStart(x, y) {
    if (this.sel && this.sel.kind !== 'f') return this.dragDecor(x, y);
    if (!this.sel || this.sel.kind !== 'f') return null;
    const rec = this.recOf(this.sel);
    if (!rec || this.pick(x, y) !== rec) return null;
    const W = this.G.world, R = this.rooms()[this.sel.ri], y0 = rec.y || 0;
    const g0 = W.screenToGround(x, y, R.group.position.y + y0); if (!g0) return null;
    const [fw, fd] = R.footprint(rec.type, rec.rot), i0 = rec.i, j0 = rec.j;
    let cur = { i: i0, j: j0, ok: true };
    return {
      move: (mx, my) => {
        const g = W.screenToGround(mx, my, R.group.position.y + y0); if (!g) return;
        const i = clamp(Math.round(i0 + g.x - g0.x), 0, R.w - fw), j = clamp(Math.round(j0 + g.z - g0.z), 0, R.d - fd);
        if (i === cur.i && j === cur.j) return;
        cur = { i, j, ok: R.canPlace(rec.type, i, j, rec.rot, rec.id) && !R.isCut(i, j) };
        const p = R.tileToWorld(i, j, fw, fd).add(new THREE.Vector3(rec.dx || 0, 0, rec.dz || 0));
        rec.f.group.position.set(p.x, y0 + .12, p.z);
        if (this.footprint) { this.placeFootprint(rec, R, p); this.footprint.material.color.set(cur.ok ? '#7be04f' : '#ff4f66'); }
        this.G.audio.sfx('tap');
      },
      end: () => {
        if (cur.ok && (cur.i !== i0 || cur.j !== j0)) {
          this.mark();
          const e = this.entry(this.sel); e.i = cur.i; e.j = cur.j; delete e.x; delete e.z; delete e.a;
          // standing on a raised floor follows its height; loft furniture keeps its own
          if (!(e.y > 1)) { delete e.y; }
          this.changed('place');
        } else { if (!cur.ok) this.G.ui.toast('거긴 놓을 수 없어요', 'red'); this.build(); }
      },
      cancel: () => this.build(),
    };
  }
  // slide a wall piece along its wall under the finger (snapped to 5 cm)
  dragDecor(x, y) {
    const rec = this.recOf(this.sel);
    if (!rec || this.pick(x, y) !== rec) return null;
    const W = this.G.world, R = this.rooms()[this.sel.ri], wall = R.walls[rec.wall], g = rec.f.group;
    const len = (rec.wall === 'N' || rec.wall === 'S') ? R.w : R.d;
    const n = new THREE.Vector3(), p0 = new THREE.Vector3();
    wall.decor.updateMatrixWorld(true); g.getWorldPosition(p0); n.copy(wall.n).applyQuaternion(R.group.getWorldQuaternion(new THREE.Quaternion()));
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, p0), rc = new THREE.Raycaster(), hit = new THREE.Vector3();
    const uAt = (mx, my) => {
      const r = this.G.world.renderer.domElement.getBoundingClientRect();
      rc.setFromCamera(new THREE.Vector2((mx - r.left) / r.width * 2 - 1, -((my - r.top) / r.height) * 2 + 1), W.cam);
      return rc.ray.intersectPlane(plane, hit) ? wall.decor.worldToLocal(hit.clone()).x : null;
    };
    const u0 = uAt(x, y), g0 = g.position.x; if (u0 == null) return null;
    let cur = g0;
    return {
      move: (mx, my) => { const u = uAt(mx, my); if (u == null) return; cur = clamp(Math.round((g0 + u - u0) * 20) / 20, -len / 2 + .3, len / 2 - .3); g.position.x = cur; },
      end: () => { if (Math.abs(cur - g0) < .01) return; this.mark(); const e = this.entry(this.sel); e.u = +(e.u + cur - g0).toFixed(2); this.changed('place'); },
      cancel: () => this.build(),
    };
  }
  changed(sfx = 'pop') {
    this.dirty = true; this.build();
    // a grown or turned piece moved or turned by whole tiles: keep it out of the walls
    const s = this.sel, rec = s && s.kind === 'f' && this.recOf(s);
    if (rec && (rec.s > 1 || rec.ry)) { const R = this.rooms()[s.ri], z = { xp: 0, xn: 0, zp: 0, zn: 0 }; if (this.overWall(rec, R) > .03) { this.keepIn(rec, R, this.entry(s), z); this.placeFootprint(rec, R); } }
    this.G.audio.sfx(sfx); this.updHud();
  }

  // ── tools on the selection
  rotateSel() {
    const s = this.sel; if (!s || s.kind !== 'f') return;
    const rec = this.recOf(s), R = this.rooms()[s.ri], e = this.entry(s);
    for (let k = 1; k <= 3; k++) {
      const rot = (rec.rot + k) % 4, [fw, fd] = R.footprint(rec.type, rot);
      const i = clamp(rec.i, 0, R.w - fw), j = clamp(rec.j, 0, R.d - fd);
      if (R.canPlace(rec.type, i, j, rot, rec.id)) { this.mark(); e.rot = rot; e.i = i; e.j = j; return this.changed('swish'); }
    }
    this.G.ui.toast('돌릴 자리가 없어요', 'red');
  }
  nudge(d) {
    const s = this.sel; if (!s || s.kind === 'f') return;
    const e = this.entry(s), R = this.rooms()[s.ri], len = (e.wall === 'N' || e.wall === 'S') ? R.w : R.d;
    const u = clamp(r2(e.u + d), -len / 2 + .3, len / 2 - .3); if (u === e.u) return;
    this.mark('u:' + JSON.stringify(s)); e.u = u;
    const rec = this.recOf(s); rec.u = u; R.fine(rec, e);
    this.G.audio.sfx('tap'); this.updHud();
  }
  // 크기 / 돌리기 (and 위아래 for a wall piece): d = a step up or down, null = back to normal
  fineSel(k, d) {
    const s = this.sel, rec = s && this.recOf(s); if (!rec || s.kind === 'door') return;
    const e = this.entry(s), R = this.rooms()[s.ri], F0 = FINE[k], old = e[k] ?? F0.def;
    let v = d == null ? F0.def : old + d * F0.step;
    v = k === 'ry' ? ((Math.round(v) + 180) % 360 + 360) % 360 - 180 : clamp(r2(v), F0.min, F0.max);
    if (v === old) return;
    const base = s.kind === 'f' ? this.sides(rec, R) : null, was = { dx: e.dx, dz: e.dz }, pushed = this.mark(k + ':' + JSON.stringify(s));
    const set = x => { if (x === F0.def) delete e[k]; else e[k] = x; R.fine(rec, e); };
    set(v);
    if (s.kind === 'f' && !this.keepIn(rec, R, e, base)) {
      if (was.dx) e.dx = was.dx; else delete e.dx; if (was.dz) e.dz = was.dz; else delete e.dz;
      set(old); if (pushed) { this.hist.pop(); this.lastKey = null; }
      this.G.ui.toast(k === 's' ? '방에 비해 너무 커요' : '여기선 더 못 돌려요', 'red'); this.G.audio.sfx('miss'); return;
    }
    this.placeFootprint(rec, R); this.G.audio.sfx('tap'); this.updHud();
  }
  // 살짝 옮기기: 5 cm along the floor (ax 'x' or 'z', sg ±1); past half a tile it carries over to the next tile if that is free
  moveSel(ax, sg) {
    const s = this.sel, rec = s && this.recOf(s); if (!rec || s.kind !== 'f') return;
    const e = this.entry(s), R = this.rooms()[s.ri], [fw, fd] = R.footprint(rec.type, rec.rot);
    const tx = rec.i + (e.dx || 0) + (ax === 'x' ? sg * NUDGE : 0), tz = rec.j + (e.dz || 0) + (ax === 'z' ? sg * NUDGE : 0);
    let i = clamp(Math.round(tx), 0, R.w - fw), j = clamp(Math.round(tz), 0, R.d - fd);
    if ((i !== rec.i || j !== rec.j) && !(R.canPlace(rec.type, i, j, rec.rot, rec.id) && !R.isCut(i, j))) { i = rec.i; j = rec.j; }
    const dx = clamp(r2(tx - i), -.5, .5), dz = clamp(r2(tz - j), -.5, .5);
    if (i === rec.i && j === rec.j && dx === (e.dx || 0) && dz === (e.dz || 0)) return;
    const base = this.sides(rec, R), was = { dx: e.dx, dz: e.dz }, pushed = this.mark('m:' + JSON.stringify(s));
    const setD = (a, b) => { if (a) e.dx = a; else delete e.dx; if (b) e.dz = b; else delete e.dz; };
    if (i !== rec.i || j !== rec.j) {
      e.i = i; e.j = j; if (!(e.y > 1)) delete e.y; setD(dx, dz);
      this.build(); this.G.audio.sfx('tap'); this.updHud(); return;
    }
    setD(dx, dz); R.fine(rec, e);
    const q = this.sides(rec, R);
    if (['xp', 'xn', 'zp', 'zn'].some(k => q[k] > Math.max(base[k], .02) + .005)) {
      setD(was.dx, was.dz); R.fine(rec, e); if (pushed) { this.hist.pop(); this.lastKey = null; }
      this.G.ui.toast('벽에 닿아요', 'red'); this.G.audio.sfx('miss'); return;
    }
    this.placeFootprint(rec, R); this.G.audio.sfx('tap'); this.updHud();
  }
  centerSel() {
    const s = this.sel, rec = s && this.recOf(s); if (!rec) return;
    const e = this.entry(s), R = this.rooms()[s.ri];
    if (s.kind === 'f') { if (!e.dx && !e.dz) return; this.mark(); delete e.dx; delete e.dz; }
    else { if (!e.dy) return; this.mark(); delete e.dy; }
    R.fine(rec, e); this.placeFootprint(rec, R); this.G.audio.sfx('tap'); this.updHud();
  }
  removeSel() {
    const s = this.sel; if (!s || s.kind === 'door') return;
    const L = this.layOf(s.ri);
    this.mark();
    (s.kind === 'f' ? L.furniture : L.decor).splice(s.k, 1);
    this.sel = null; this.changed('pop');
  }
  swapSel() {
    const s = this.sel; if (!s || s.kind === 'door') return;
    this.picker(s.kind === 'f' ? 'furn' : 'decor', t => {
      const e = this.entry(s), old = { type: e.type, rot: e.rot, opts: e.opts }, before = this.snap();
      e.type = t; delete e.opts;
      if (s.kind === 'f') {
        const R = this.rooms()[s.ri], rec = this.recOf(s);
        let ok = false;
        for (const rot of [e.rot || 0, ((e.rot || 0) + 1) % 4, ((e.rot || 0) + 2) % 4, ((e.rot || 0) + 3) % 4]) {
          const [fw, fd] = R.footprint(t, rot), i = clamp(e.i, 0, R.w - fw), j = clamp(e.j, 0, R.d - fd);
          if (R.canPlace(t, i, j, rot, rec.id)) { e.rot = rot; e.i = i; e.j = j; ok = true; break; }
        }
        if (!ok) { Object.assign(e, old); if (!old.opts) delete e.opts; this.G.ui.toast('그 자리엔 안 들어가요 (크기가 달라요)', 'red'); return; }
      }
      this.hist.push(before); this.lastKey = null;
      this.changed('place');
    });
  }
  // add a piece near the middle of the view, in whichever room of a map is under it
  nearRoom() {
    const W = this.G.world, RS = this.rooms();
    let best = 0, bd = 1e9;
    RS.forEach((R, i) => { const p = R.group.position, d = Math.hypot(p.x - W.target.x, p.z - W.target.z); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  addFurn(t) {
    const W = this.G.world, ri = this.nearRoom(), R = this.rooms()[ri], L = this.layOf(ri);
    const lx = W.target.x - R.group.position.x, lz = W.target.z - R.group.position.z;
    let best = null;
    for (const rot of [0, 1]) {
      const [fw, fd] = R.footprint(t, rot);
      for (let j = 0; j + fd <= R.d; j++) for (let i = 0; i + fw <= R.w; i++) {
        if (!R.canPlace(t, i, j, rot) || R.isCut(i, j) || R.heightAt(i, j)) continue;
        const p = R.tileToWorld(i, j, fw, fd), d = Math.hypot(p.x - lx, p.z - lz) + rot * .01;
        if (!best || d < best.d) best = { i, j, rot, d };
      }
    }
    if (!best) { this.G.ui.toast('빈자리가 없어요. 먼저 뭘 빼 주세요', 'red'); return; }
    this.mark();
    L.furniture.push({ type: t, i: best.i, j: best.j, rot: best.rot });
    this.dirty = true; this.build(); this.G.audio.sfx('place');
    this.select(this.rooms()[ri].furns[L.furniture.length - 1] || null);
  }
  addDecor(t) {
    const ri = this.nearRoom(), R = this.rooms()[ri], L = this.layOf(ri);
    const wall = ['N', 'W', 'E', 'S'].find(k => R.walls[k] && WALL_OK(R.walls[k].kind));
    if (!wall) { this.G.ui.toast('이 방엔 장식을 걸 벽이 없어요', 'red'); return; }
    this.mark();
    L.decor.push({ type: t, wall, u: 0 });
    this.dirty = true; this.build(); this.G.audio.sfx('place');
    this.select(this.rooms()[ri].decors[L.decor.length - 1] || null);
  }
  setTheme(patch) {
    this.mark();
    const t = this.lay.editTheme = { ...(this.lay.editTheme || {}), ...patch };
    if (this.lay.rooms) { this.lay.theme = { ...(this.lay.theme || {}), ...t }; this.lay.rooms.forEach(r => { r.layout.theme = { ...(r.layout.theme || {}), ...t }; }); }
    else this.lay.theme = { ...(this.lay.theme || {}), ...t };
    this.changed('place');
  }

  // ── save / reset / export / play
  save() {
    EDITS[this.key] = editOf(this.lay); saveEdits();
    this.saved = this.snap(); this.dirty = false; this.updHud();
    const n = this.sharers();
    // enough places to hide things? (a room emptied of furniture would make a stage with nothing to find)
    const spots = this.rooms().reduce((a, R) => a + R.spots.length, 0), need = Math.max(...n.map(i => stageSpec(i - 1).n)) + 4;
    if (spots < need) this.G.ui.toast(`저장했어요. 그런데 숨길 자리가 ${spots}곳뿐이라 ${need}곳은 있어야 안전해요 — 가구를 조금 더 놓아 주세요`, 'red');
    else this.G.ui.toast(`저장! 이 방을 쓰는 스테이지 ${n.length}개(${n.join(', ')})에 적용돼요`, 'green');
    this.upload(this.key, EDITS[this.key]);
  }
  // the artifact owner's edits also go to the shared store (stagelayouts/{room}), where Claude reads them to bake into
  // the game for everyone; anyone else just keeps them on their own device
  async upload(key, edit) {
    const N = await initNet();
    if (!N.ok || this.dead) return;
    try {
      const ref = N.db.doc('stagelayouts/' + key);
      if (edit) await ref.set({ edit: JSON.stringify(edit), at: Date.now() }); else await ref.delete();
      if (edit && !this.dead) this.G.ui.toast('클로드도 볼 수 있게 올렸어요', 'green');
    } catch { /* not the owner, or offline: the edit stays on this device */ }
  }
  reset() {
    const G = this.G;
    G.ui.panel({ title: '원래대로', color: 'red', close: () => {}, body: [h('div', { class: 'txt' }, '이 방에서 고친 걸 모두 지우고 처음 배치로 돌릴까요?')],
      buttons: [G.ui.btn('돌리기', { color: 'red', onClick: () => { G.ui.closePanel(); delete EDITS[this.key]; saveEdits(); this.upload(this.key, null); this.load(this.idx); G.ui.toast('처음 배치로 돌렸어요', ''); } }),
        G.ui.btn('그만', { color: 'gray', onClick: () => G.ui.closePanel() })] });
  }
  exportAll() {
    const G = this.G, text = JSON.stringify(EDITS);
    navigator.clipboard?.writeText(text).then(() => G.ui.toast('복사했어요! 클로드한테 붙여 주면 게임에 넣어 줄게요', 'green'), () => {});
    const ta = h('textarea', { class: 'le-json', readonly: '' }); ta.value = text;
    G.ui.panel({ title: '내보내기', color: 'blue', close: () => {}, body: [h('div', { class: 'txt' }, `고친 방 ${Object.keys(EDITS).length}개. 아래 글을 통째로 복사해서 보내 주세요.`), ta],
      buttons: [G.ui.btn('닫기', { color: 'gray', onClick: () => G.ui.closePanel() })] });
    setTimeout(() => { ta.focus(); ta.select(); }, 50);
  }
  leave(then) {
    const G = this.G;
    if (!this.dirty) return then();
    G.ui.panel({ title: '저장 안 했어요', color: 'orange', close: () => {}, body: [h('div', { class: 'txt' }, '고친 걸 저장할까요?')],
      buttons: [G.ui.btn('저장', { color: 'green', onClick: () => { G.ui.closePanel(); this.save(); then(); } }),
        G.ui.btn('버리기', { color: 'red', onClick: () => { G.ui.closePanel(); this.dirty = false; then(); } })] });
  }

  // ── picker panel: furniture (with pictures) or wall pieces
  picker(kind, onPick) {
    const G = this.G;
    const types = Object.keys(FURN_INFO).filter(t => !FURN_INFO[t].hidden && (kind === 'decor' ? FURN_INFO[t].wall : !FURN_INFO[t].wall) && t !== 'door' && t !== 'lever' && t !== 'leverpost');
    const outdoor = t => !!FURN_INFO[t].region;
    types.sort((a, b) => outdoor(a) - outdoor(b) || FURN_INFO[a].name.localeCompare(FURN_INFO[b].name, 'ko'));
    let tab = 'all';
    const grid = h('div', { class: 'le-grid' });
    const fill = () => {
      G.needThumbs?.(types.map(t => 'furn_' + t));
      grid.innerHTML = '';
      for (const t of types) {
        if (tab === 'in' && outdoor(t)) continue;
        if (tab === 'out' && !outdoor(t)) continue;
        const inf = FURN_INFO[t], src = G.thumbs['furn_' + t];
        grid.append(h('div', { class: 'card', onclick: () => { G.ui.closePanel(); onPick(t); } },
          src ? h('img', { src }) : h('div', { class: 'le-noimg' }, '🖼'), h('div', {}, inf.name), h('div', { class: 'le-size' }, `${inf.w || 1}×${inf.d || 1}`)));
      }
    };
    const tabs = h('div', { class: 'le-tabs' });
    for (const [k, n] of [['all', '전체'], ['in', '실내'], ['out', '야외']]) tabs.append(G.ui.btn(n, { color: 'blue', cls: 'sm', onClick: () => { tab = k; fill(); } }));
    fill();
    G.ui.panel({ title: kind === 'decor' ? '벽 장식 고르기' : '가구 고르기', color: 'orange', cls: 'le-panel', close: () => {}, body: kind === 'decor' ? [grid] : [tabs, grid],
      buttons: [G.ui.btn('닫기', { color: 'gray', onClick: () => G.ui.closePanel() })] });
  }
  stylePanel(kind) {
    const G = this.G, list = kind === 'wall' ? [...WALLPAPERS, ...PAINTS] : FLOORS;
    const grid = h('div', { class: 'le-grid sw' });
    for (const st of list) {
      const a = kind === 'wall' ? st.wall : st.floor, b = kind === 'wall' ? st.wall2 : st.floor2;
      grid.append(h('div', { class: 'card', onclick: () => {
        G.ui.closePanel();
        this.setTheme(kind === 'wall' ? { wallKind: st.wallKind, wall: st.wall, wall2: st.wall2, ...(st.wainscot ? { wainscot: st.wainscot } : {}) } : { floorKind: st.floorKind, floor: st.floor, floor2: st.floor2 });
      } }, h('div', { class: 'le-swatch', style: `background:linear-gradient(135deg, ${a} 50%, ${b} 50%)` }), h('div', {}, st.name.replace(' 페인트', ''))));
    }
    G.ui.panel({ title: kind === 'wall' ? '벽지' : '바닥', color: 'pink', cls: 'le-panel', close: () => {}, body: [grid],
      buttons: [G.ui.btn('원래 테마', { color: 'gray', onClick: () => { G.ui.closePanel(); this.mark(); const t = { ...(this.lay.editTheme || {}) };
        for (const k of kind === 'wall' ? ['wallKind', 'wall', 'wall2', 'wainscot'] : ['floorKind', 'floor', 'floor2']) delete t[k];
        const raw = layoutFor(this.key, true); this.lay.editTheme = Object.keys(t).length ? t : undefined;
        if (this.lay.rooms) { this.lay.theme = { ...raw.theme, ...t }; this.lay.rooms.forEach((r, i) => { r.layout.theme = { ...raw.rooms[i].layout.theme, ...t }; }); } else this.lay.theme = { ...raw.theme, ...t };
        this.changed('place'); } }),
        G.ui.btn('닫기', { color: 'gray', onClick: () => G.ui.closePanel() })] });
  }
  jumpPanel() {
    const G = this.G, grid = h('div', { class: 'le-jump' });
    for (let i = 0; i < STAGE_COUNT; i++) {
      const k = stageSpec(i).room;
      grid.append(h('div', { class: 'le-n' + (i === this.idx ? ' cur' : '') + (EDITS[k] ? ' ed' : ''), onclick: () => { G.ui.closePanel(); this.leave(() => this.load(i)); } }, String(i + 1)));
    }
    G.ui.panel({ title: '스테이지 고르기', color: 'purple', cls: 'le-panel', close: () => {}, body: [h('div', { class: 'txt' }, '노란 칸: 고친 방'), grid],
      buttons: [G.ui.btn('닫기', { color: 'gray', onClick: () => G.ui.closePanel() })] });
  }

  // ── HUD
  buildHud() {
    const G = this.G, ui = G.ui, col = ui.col();
    const back = ui.ibtn('home', 'blue', () => this.leave(() => G.go('home')));
    back.style.cssText += 'position:absolute;left:12px;top:calc(12px + var(--safeT))';
    this.titleEl = h('div', { class: 'le-title', onclick: () => this.jumpPanel() });
    const prev = ui.btn(null, { color: 'purple', cls: 'sm', icon: IC.left, onClick: () => this.leave(() => this.load((this.idx + STAGE_COUNT - 1) % STAGE_COUNT)) });
    const next = ui.btn(null, { color: 'purple', cls: 'sm', icon: IC.right, onClick: () => this.leave(() => this.load((this.idx + 1) % STAGE_COUNT)) });
    this.shareEl = h('div', { class: 'le-share' });
    col.append(back, h('div', { class: 'le-top' }, prev, this.titleEl, next), this.shareEl);
    this.selBar = h('div', { class: 'le-sel le-col' });
    this.mainBar = h('div', { class: 'le-main' },
      ui.btn('+ 가구', { color: 'orange', cls: 'sm', onClick: () => this.picker('furn', t => this.addFurn(t)) }),
      ui.btn('+ 벽장식', { color: 'orange', cls: 'sm', onClick: () => this.picker('decor', t => this.addDecor(t)) }),
      ui.btn('벽지', { color: 'pink', cls: 'sm', onClick: () => this.stylePanel('wall') }),
      ui.btn('바닥', { color: 'pink', cls: 'sm', onClick: () => this.stylePanel('floor') }),
      ui.btn('원래대로', { color: 'gray', cls: 'sm', onClick: () => this.reset() }),
      ui.btn('내보내기', { color: 'blue', cls: 'sm', onClick: () => this.exportAll() }),
      this.playBtn = ui.btn('해 보기', { color: 'yellow', cls: 'sm', onClick: () => this.leave(() => G.go('stage', { idx: this.idx })) }));
    // always at the bottom: undo, let go of the chosen piece, save (and whether it is saved)
    this.undoBtn = ui.btn('되돌리기', { color: 'blue', icon: IC.undo, onClick: () => this.undo() });
    this.doneBtn = ui.btn('다 했어요', { color: 'purple', onClick: () => this.select(null) });
    this.saveBtn = ui.btn('저장', { color: 'green', onClick: () => this.save() });
    this.bar = h('div', { class: 'modebar le-bar' }, this.selBar, this.mainBar, h('div', { class: 'le-act' }, this.undoBtn, this.doneBtn, this.saveBtn));
    col.append(this.bar);
  }
  // a button that steps once on touch and keeps stepping while held
  stepBtn(icon, color, fn) {
    const b = this.G.ui.btn(null, { color, icon, cls: 'sm le-step', sfx: 'none' });
    let t = null;
    const stop = () => { clearTimeout(t); clearInterval(t); t = null; };
    b.addEventListener('pointerdown', () => { stop(); fn(); addEventListener('pointerup', stop, { once: true }); addEventListener('pointercancel', stop, { once: true }); t = setTimeout(() => { t = setInterval(() => { if (this.dead) return stop(); fn(); }, 90); }, 380); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, stop);
    return b;
  }
  updHud() {
    const G = this.G, ui = G.ui;
    if (!this.titleEl) return;
    const th = THEMES[this.key] || this.lay.theme || {};
    this.titleEl.innerHTML = `STAGE <b>${this.idx + 1}</b> · ${th.name || this.key}${EDITS[this.key] ? ' <i>고침</i>' : ''}`;
    const n = this.sharers();
    this.shareEl.textContent = n.length > 1 ? `같은 방을 쓰는 스테이지: ${n.join(', ')}` : '';
    // saved or not, at a glance: 저장 (pulsing) while there is something to save, 저장됨 once it is kept
    if (this.saved != null) this.dirty = this.snap() !== this.saved;
    const kept = !this.dirty && !!EDITS[this.key];
    this.saveBtn.classList.toggle('pulse', !!this.dirty);
    this.saveBtn.classList.toggle('le-saved', kept);
    this.saveBtn.classList.toggle('green', !kept);
    this.saveBtn.querySelector('.lbl').textContent = kept ? '저장됨' : '저장';
    this.saveBtn.querySelector('svg')?.remove();
    if (kept) this.saveBtn.insertAdjacentHTML('afterbegin', ICON_CHECK);
    this.undoBtn.classList.toggle('disabled', !this.hist?.length);
    const s = this.sel, rec = s && this.recOf(s);
    this.mainBar.style.display = rec ? 'none' : '';
    this.doneBtn.style.display = rec ? '' : 'none';
    this.selBar.style.display = rec ? '' : 'none';
    // the same piece still chosen: only the numbers change (rebuilding would drop a button that is being held)
    const selKey = rec ? JSON.stringify(s) + rec.type : '';
    if (rec && selKey === this.selKey) this.refreshVals();
    else this.fillSel(s, rec, selKey);
    this.fitView();
  }
  // the numbers shown between the step buttons
  vals(s) {
    const e = this.entry(s), sz = e.s || 1, ry = e.ry || 0, dy = e.dy || 0, moved = !!(e.dx || e.dz);
    return { s: [sz.toFixed(2) + '배', sz === 1], ry: [ry + '°', !ry], m: [moved ? `${Math.round(Math.hypot(e.dx || 0, e.dz || 0) * 100)}cm` : '제자리', !moved],
      dy: [dy ? `${dy > 0 ? '+' : ''}${Math.round(dy * 100)}cm` : '제자리', !dy], u: [(+e.u || 0).toFixed(2), false] };
  }
  refreshVals() {
    const v = this.vals(this.sel);
    for (const k in this.valEls || {}) { const el = this.valEls[k]; el.textContent = v[k][0]; el.classList.toggle('off', v[k][1]); }
  }
  fillSel(s, rec, selKey) {
    const ui = this.G.ui;
    this.selBar.innerHTML = ''; this.selKey = selKey; this.valEls = {};
    this.arrows = null;
    if (rec) {
      const name = FURN_INFO[rec.type]?.name || rec.type, e = this.entry(s), V = this.vals(s);
      const head = h('div', { class: 'le-row le-head' }, h('div', { class: 'le-name' }, name));
      const row = (lab, ...kids) => h('div', { class: 'le-row' }, h('div', { class: 'le-lab' }, lab), h('div', { class: 'le-ctl' }, ...kids));
      const val = (k, onclick) => (this.valEls[k] = h('div', { class: 'le-val' + (V[k][1] ? ' off' : ''), onclick }, V[k][0]));
      void e;
      if (s.kind === 'f') {
        head.append(
          ui.btn('90°', { color: 'blue', cls: 'sm', icon: IC.turn, onClick: () => this.rotateSel() }),
          ui.btn('바꾸기', { color: 'purple', cls: 'sm', onClick: () => this.swapSel() }),
          ui.btn('빼기', { color: 'red', cls: 'sm', onClick: () => this.removeSel() }));
        const ax = ['x+', 'z+', 'x-', 'z-'].map(k => { const b = this.stepBtn(IC.up, 'orange', () => this.moveSel(k[0], k[1] === '+' ? 1 : -1)); b.dataset.ax = k; return b; });
        this.arrows = ax; this.arrowAng = null;
        this.selBar.append(head,
          row('크기', this.stepBtn(IC.minus, 'blue', () => this.fineSel('s', -1)), val('s', () => this.fineSel('s', null)), this.stepBtn(IC.plus, 'blue', () => this.fineSel('s', 1))),
          row('방향', this.stepBtn(IC.rotL, 'blue', () => this.fineSel('ry', 1)), val('ry', () => this.fineSel('ry', null)), this.stepBtn(IC.rotR, 'blue', () => this.fineSel('ry', -1))),
          row('살짝 옮기기', ...ax.slice(0, 2), val('m', () => this.centerSel()), ...ax.slice(2)));
        this.aimArrows();
      } else {
        if (s.kind === 'd') head.append(
          ui.btn('바꾸기', { color: 'purple', cls: 'sm', onClick: () => this.swapSel() }),
          ui.btn('빼기', { color: 'red', cls: 'sm', onClick: () => this.removeSel() }));
        const up = this.stepBtn(IC.up, 'orange', () => this.fineSel('dy', 1)), dn = this.stepBtn(IC.up, 'orange', () => this.fineSel('dy', -1));
        dn.querySelector('svg').style.transform = 'rotate(180deg)';
        this.selBar.append(head,
          ...(s.kind === 'd' ? [row('크기', this.stepBtn(IC.minus, 'blue', () => this.fineSel('s', -1)), val('s', () => this.fineSel('s', null)), this.stepBtn(IC.plus, 'blue', () => this.fineSel('s', 1))),
            row('위아래', dn, val('dy', () => this.centerSel()), up)] : []),
          row('옆으로', this.stepBtn(IC.left, 'orange', () => this.nudge(-NUDGE)), val('u', null), this.stepBtn(IC.right, 'orange', () => this.nudge(NUDGE))));
      }
    }
  }
  fitView() {
    const G = this.G;
    // the room stays in view above the bar, and the camera badge sits just over it
    requestAnimationFrame(() => {
      if (this.dead || !this.bar) return;
      const W = G.world, bh = this.bar.offsetHeight, H = innerHeight;
      document.getElementById('app').style.setProperty('--joyB', (bh + 24) + 'px');
      if (W.fit) { const cy = clamp((110 + (H - bh - 20)) / 2 / H, .3, .5); if (Math.abs(cy - W.fit.cy) > .005) W.setFit(W.fit.w, W.fit.h, cy); }
    });
  }
  // each 살짝 옮기기 arrow points the way the piece will go on screen (along the room's tiles, whichever way the camera turns)
  aimArrows() {
    const s = this.sel; if (!this.arrows || !s) return;
    const R = this.rooms()[s.ri], W = this.G.world; if (!R) return;
    const o = R.group.getWorldPosition(new THREE.Vector3()), a = o.clone().project(W.cam);
    const ang = {};
    for (const [k, v] of [['x+', [1, 0]], ['z+', [0, 1]], ['x-', [-1, 0]], ['z-', [0, -1]]]) {
      const b = o.clone().add(new THREE.Vector3(v[0], 0, v[1])).project(W.cam);
      ang[k] = Math.round(Math.atan2(-(b.y - a.y) * W.H, (b.x - a.x) * W.W) * 180 / Math.PI);
    }
    const key = JSON.stringify(ang); if (key === this.arrowAng) return; this.arrowAng = key;
    // left to right on screen, so the row reads like the directions it moves
    const order = [...this.arrows].sort((p, q) => Math.cos(ang[p.dataset.ax] * Math.PI / 180) - Math.cos(ang[q.dataset.ax] * Math.PI / 180));
    const par = this.arrows[0].parentNode, mid = par?.querySelector('.le-val');
    if (par && mid) { par.insertBefore(order[0], mid); par.insertBefore(order[1], mid); mid.after(order[3]); mid.after(order[2]); }
    for (const b of this.arrows) b.querySelector('svg').style.transform = `rotate(${ang[b.dataset.ax] + 90}deg)`;
  }

  update(dt) {
    this.tw.update(dt); this.room?.update?.(dt);
    if (this.arrows && (this.aimT = (this.aimT || 0) + dt) > .25) { this.aimT = 0; this.aimArrows(); }
  }
  state() { return { scene: 'layedit', stage: this.idx + 1, room: this.key, dirty: !!this.dirty, sel: this.sel, entry: this.sel && this.entry(this.sel), undo: this.hist?.length || 0, edits: Object.keys(EDITS) }; }
}

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
    this.buildHud();
    this.load(idx);
    if (!G.save.tut?.layedit) {
      (G.save.tut || (G.save.tut = {})).layedit = true; G.persist();
      G.ui.toast('가구를 톡 골라서 끌면 옮겨져요. 아래 버튼으로 돌리기·바꾸기·빼기!', 'green');
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
    this.updHud();
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
        const [fw, fd] = R.footprint(rec.type, rec.rot);
        const fp = this.footprint = new THREE.Mesh(new THREE.PlaneGeometry(fw - .06, fd - .06), new THREE.MeshBasicMaterial({ color: '#7be04f', transparent: true, opacity: .5, depthWrite: false }));
        fp.rotation.x = -Math.PI / 2; fp.position.copy(R.tileToWorld(rec.i, rec.j, fw, fd)); fp.position.y = (rec.y || 0) + .03; fp.userData.noOcclude = true; fp.renderOrder = 3;
        R.group.add(fp);
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
        const p = R.tileToWorld(i, j, fw, fd);
        rec.f.group.position.set(p.x, y0 + .12, p.z);
        if (this.footprint) { this.footprint.position.set(p.x, y0 + .03, p.z); this.footprint.material.color.set(cur.ok ? '#7be04f' : '#ff4f66'); }
        this.G.audio.sfx('tap');
      },
      end: () => {
        if (cur.ok && (cur.i !== i0 || cur.j !== j0)) {
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
      end: () => { if (Math.abs(cur - g0) < .01) return; const e = this.entry(this.sel); e.u = +cur.toFixed(2); this.changed('place'); },
      cancel: () => this.build(),
    };
  }
  changed(sfx = 'pop') { this.dirty = true; this.build(); this.G.audio.sfx(sfx); this.updHud(); }

  // ── tools on the selection
  rotateSel() {
    const s = this.sel; if (!s || s.kind !== 'f') return;
    const rec = this.recOf(s), R = this.rooms()[s.ri], e = this.entry(s);
    for (let k = 1; k <= 3; k++) {
      const rot = (rec.rot + k) % 4, [fw, fd] = R.footprint(rec.type, rot);
      const i = clamp(rec.i, 0, R.w - fw), j = clamp(rec.j, 0, R.d - fd);
      if (R.canPlace(rec.type, i, j, rot, rec.id)) { e.rot = rot; e.i = i; e.j = j; return this.changed('swish'); }
    }
    this.G.ui.toast('돌릴 자리가 없어요', 'red');
  }
  nudge(d) {
    const s = this.sel; if (!s || s.kind === 'f') return;
    const e = this.entry(s), R = this.rooms()[s.ri], len = (e.wall === 'N' || e.wall === 'S') ? R.w : R.d;
    e.u = clamp(+(e.u + d).toFixed(2), -len / 2 + .3, len / 2 - .3);
    this.changed('tap');
  }
  removeSel() {
    const s = this.sel; if (!s || s.kind === 'door') return;
    const L = this.layOf(s.ri);
    (s.kind === 'f' ? L.furniture : L.decor).splice(s.k, 1);
    this.sel = null; this.changed('pop');
  }
  swapSel() {
    const s = this.sel; if (!s || s.kind === 'door') return;
    this.picker(s.kind === 'f' ? 'furn' : 'decor', t => {
      const e = this.entry(s), old = { type: e.type, rot: e.rot, opts: e.opts };
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
    L.furniture.push({ type: t, i: best.i, j: best.j, rot: best.rot });
    this.dirty = true; this.build(); this.G.audio.sfx('place');
    this.select(this.rooms()[ri].furns[L.furniture.length - 1] || null);
  }
  addDecor(t) {
    const ri = this.nearRoom(), R = this.rooms()[ri], L = this.layOf(ri);
    const wall = ['N', 'W', 'E', 'S'].find(k => R.walls[k] && WALL_OK(R.walls[k].kind));
    if (!wall) { this.G.ui.toast('이 방엔 장식을 걸 벽이 없어요', 'red'); return; }
    L.decor.push({ type: t, wall, u: 0 });
    this.dirty = true; this.build(); this.G.audio.sfx('place');
    this.select(this.rooms()[ri].decors[L.decor.length - 1] || null);
  }
  setTheme(patch) {
    const t = this.lay.editTheme = { ...(this.lay.editTheme || {}), ...patch };
    if (this.lay.rooms) { this.lay.theme = { ...(this.lay.theme || {}), ...t }; this.lay.rooms.forEach(r => { r.layout.theme = { ...(r.layout.theme || {}), ...t }; }); }
    else this.lay.theme = { ...(this.lay.theme || {}), ...t };
    this.changed('place');
  }

  // ── save / reset / export / play
  save() {
    EDITS[this.key] = editOf(this.lay); saveEdits();
    this.dirty = false; this.updHud();
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
      buttons: [G.ui.btn('원래 테마', { color: 'gray', onClick: () => { G.ui.closePanel(); const t = { ...(this.lay.editTheme || {}) };
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
    const prev = ui.btn('◀', { color: 'purple', cls: 'sm', onClick: () => this.leave(() => this.load((this.idx + STAGE_COUNT - 1) % STAGE_COUNT)) });
    const next = ui.btn('▶', { color: 'purple', cls: 'sm', onClick: () => this.leave(() => this.load((this.idx + 1) % STAGE_COUNT)) });
    this.shareEl = h('div', { class: 'le-share' });
    col.append(back, h('div', { class: 'le-top' }, prev, this.titleEl, next), this.shareEl);
    this.selBar = h('div', { class: 'le-sel' });
    const main = h('div', { class: 'le-main' },
      ui.btn('+ 가구', { color: 'orange', cls: 'sm', onClick: () => this.picker('furn', t => this.addFurn(t)) }),
      ui.btn('+ 벽장식', { color: 'orange', cls: 'sm', onClick: () => this.picker('decor', t => this.addDecor(t)) }),
      ui.btn('벽지', { color: 'pink', cls: 'sm', onClick: () => this.stylePanel('wall') }),
      ui.btn('바닥', { color: 'pink', cls: 'sm', onClick: () => this.stylePanel('floor') }),
      ui.btn('원래대로', { color: 'gray', cls: 'sm', onClick: () => this.reset() }),
      ui.btn('내보내기', { color: 'blue', cls: 'sm', onClick: () => this.exportAll() }),
      this.playBtn = ui.btn('해 보기', { color: 'yellow', cls: 'sm', onClick: () => this.leave(() => G.go('stage', { idx: this.idx })) }),
      this.saveBtn = ui.btn('저장', { color: 'green', cls: 'sm', onClick: () => this.save() }));
    col.append(h('div', { class: 'modebar le-bar' }, this.selBar, main));
  }
  updHud() {
    const G = this.G, ui = G.ui;
    if (!this.titleEl) return;
    const th = THEMES[this.key] || this.lay.theme || {};
    this.titleEl.innerHTML = `STAGE <b>${this.idx + 1}</b> · ${th.name || this.key}${EDITS[this.key] ? ' <i>고침</i>' : ''}`;
    const n = this.sharers();
    this.shareEl.textContent = n.length > 1 ? `같은 방을 쓰는 스테이지: ${n.join(', ')}` : '';
    this.saveBtn.classList.toggle('pulse', !!this.dirty);
    this.selBar.innerHTML = '';
    const s = this.sel, rec = s && this.recOf(s);
    if (!s || !rec) { this.selBar.append(h('div', { class: 'le-hint' }, '가구나 벽 장식을 톡 골라 보세요')); return; }
    const name = FURN_INFO[rec.type]?.name || rec.type;
    this.selBar.append(h('div', { class: 'le-name' }, name));
    if (s.kind === 'f') this.selBar.append(
      ui.btn('↻ 돌리기', { color: 'blue', cls: 'sm', onClick: () => this.rotateSel() }),
      ui.btn('⇄ 바꾸기', { color: 'purple', cls: 'sm', onClick: () => this.swapSel() }),
      ui.btn('빼기', { color: 'red', cls: 'sm', onClick: () => this.removeSel() }));
    else this.selBar.append(
      ui.btn('◀', { color: 'blue', cls: 'sm', onClick: () => this.nudge(-.1) }),
      ui.btn('▶', { color: 'blue', cls: 'sm', onClick: () => this.nudge(.1) }),
      ...(s.kind === 'd' ? [ui.btn('⇄ 바꾸기', { color: 'purple', cls: 'sm', onClick: () => this.swapSel() }), ui.btn('빼기', { color: 'red', cls: 'sm', onClick: () => this.removeSel() })] : []));
  }

  update(dt) { this.tw.update(dt); this.room?.update?.(dt); }
  state() { return { scene: 'layedit', stage: this.idx + 1, room: this.key, dirty: !!this.dirty, sel: this.sel, edits: Object.keys(EDITS) }; }
}

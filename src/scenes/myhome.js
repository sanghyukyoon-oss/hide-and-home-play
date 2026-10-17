// Meta: 몽글이's home. Decorate modular zones (rooms → storage → yard → park), hide things, publish the room,
// and strangers who open the shared game come to find what you hid.
import * as THREE from 'three';
import { Room, attachItem, indexSpots } from '../room.js';
import { validateRoom } from '../roomdoc.js';
import { buildItem, ITEMS } from '../gfx/items.js';
import { FURN_INFO } from '../gfx/furniture.js';
import { Char } from '../gfx/chars.js';
import { pickSurface, resolveHost, makeFreeSpot, dropFreeSpot, toLocal, viewsOf } from '../freehide.js';
import { Visitors } from '../visitors.js';
import { h, ICON } from '../ui.js';
import { ease, clamp, Tweens } from '../util.js';
import { HOME_ZONES, ZONE_TYPES, zoneLayout, SHOP_FURN } from '../catalog.js';
import { playDialog } from '../story.js';
import { openShop } from '../shop.js';
import { net, initNet, publishRoom, roomStats } from '../net.js';

const V = new THREE.Vector3();
const MAX_HIDE = 5;

export class MyHomeScene {
  constructor(G) { this.G = G; this.name = 'myhome'; }
  get H() { return this.G.save.home; }
  get zone() { return this.H.zones[this.zoneId]; }
  async enter({ zone = null, mode = 'view' } = {}) {
    const G = this.G, W = G.world;
    this.tw = new Tweens();
    this.zoneId = zone && G.zoneOpen(zone) ? zone : (this.H.current && G.zoneOpen(this.H.current) ? this.H.current : 'room1');
    this.H.current = this.zoneId;
    this.build();
    W.home.set(0, .75, 0); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = .62; W.zoom = 1; W.vYaw = 0; W.autoSpin = 0; W.snap = !!G.save.settings?.snap;
    this.fitCam();
    W.onTap = (x, y) => this.tap(x, y);
    W.onRotate = null;
    W.onDragStart = (x, y) => this.dragStart(x, y);
    G.audio.music('home');
    this.setMode(mode);
    this.loadStats();
    // first visit (home opens after stage 2): 몽글이 shows how decorating, hiding and sharing work
    const tut = G.save.tut || (G.save.tut = {});
    if (!tut.home && !G.bot && !G.skipTalk) {
      tut.home = true; G.persist();
      await this.tw.wait(.6); if (this.dead) return;
      await playDialog(G, [
        { who: 'mong', text: '여기가 우리 집이야! 스테이지에서 찾은 물건이랑 가구로 마음대로 꾸밀 수 있어.' },
        { who: 'mong', text: "'꾸미기'에선 가구를 끌어서 옮기고 돌려 봐. 상점에선 가구, 테마, 방 크기까지 살 수 있어!" },
        { who: 'mong', text: "'숨기기'에선 찾은 물건을 아무 데나 숨겨. 서랍을 열고 안쪽에 쏙 넣어도 되고!" },
        { who: 'mong', text: "다 숨겼으면 '방 올리기'! 친구들이 내 방에 찾으러 와. 기발하게 숨겨 보자~" },
      ], { title: '내 집' });
      if (this.dead) return;
      const b = [...document.querySelectorAll('.btn')].find(x => x.textContent.includes('꾸미기'));
      b?.classList.add('pulse');
    }
  }
  // frame the zone whatever its size (rooms can be widened in the shop)
  fitCam() {
    const W = this.G.world, R = this.room, span = (R.w + R.d) / Math.SQRT2 + .5;
    document.getElementById('app').style.setProperty('--joyB', '330px');   // above the cards and buttons
    W.bounds = Math.max(2.4, Math.max(R.w, R.d) * .48); W.minPitch = .06; W.maxPitch = 1.45; W.minZoom = .85; W.maxZoom = 7;
    // hiding and decorating have cards and buttons at the bottom: the room sits higher and a little smaller there
    const busy = this.mode === 'hide' || this.mode === 'edit';
    W.setFit(Math.max(7.5, span), Math.max(6.6, span * .62) * (busy ? 1.05 : 1), busy ? .405 : .45);
  }
  exit() { document.getElementById('app').style.removeProperty('--joyB'); this.dead = true; this.visitors?.dispose(); const W = this.G.world; W.root.remove(this.room.group); W.onTap = null; W.onDragStart = null; this.G.ui.clear(); this.tw.clear(); }

  build() {
    const G = this.G, W = G.world;
    if (this.room) W.root.remove(this.room.group);
    const z = this.zone, lay = zoneLayout(z);
    G.setBg(lay.theme.bg || (ZONE_TYPES[z.type].indoor ? ['#fff3e3', '#ffe2c4'] : ['#e4f6ff', '#d6f3d8'])); G.world.setLight(lay.theme.light || null);
    this.room = new Room(W, zoneLayout(z));
    W.root.add(this.room.group);
    const idx = indexSpots(this.room); this.spotByKey = idx.spots; this.partByKey = idx.parts;
    this.items = {};
    const hid = this.H.hide;
    if (hid.zoneId === this.zoneId) {
      for (const e of hid.items.slice()) {
        if (e.free) {
          const host = resolveHost(this.room, e.free.host, this.partByKey, e.free.part);
          if (!host) { hid.items = hid.items.filter(x => x !== e); continue; }
          this.putItem(e.item, makeFreeSpot(host, new THREE.Vector3(...e.free.p), e.free.ry || 0));
          continue;
        }
        const s = this.spotByKey[e.spot];
        if (!s || s.item) { hid.items = hid.items.filter(x => x !== e); continue; }
        this.putItem(e.item, s);
      }
      for (const pk in hid.locks) { const p = this.partByKey[pk]; if (p) p.furn.setLock(p, hid.locks[pk], hid.code); else delete hid.locks[pk]; }
    }
    this.mong = new Char('mong'); this.mong.root.position.set(1.9, 0, 1.9); this.mong.root.rotation.y = .8; this.room.group.add(this.mong.root);
    W.idsDirty = true;
    // friends drop by while you just look at your home
    this.visitors?.dispose();
    const door = this.room.doorDecor ? this.room.frontOf(this.room.doorDecor.f) : null;
    this.visitors = new Visitors(G, { parent: this.room.group, mong: this.mong, tw: this.tw, indoorRoom: !!ZONE_TYPES[this.zone.type].indoor,
      active: () => this.mode === 'view' && !G.ui.panelOpen,
      entry: () => door ? [door.x, door.z] : [-1.9, 2.1], meet: () => [1.9 - .8, 1.9 - .3], say: (ch, t, ms) => this.say(ch, t, ms),
      clear: (x, z, r) => this.room.clearAt(x, z, r) });
  }
  putItem(type, spot) {
    const g = buildItem(type, { code: this.H.hide.code || '000' });
    attachItem(spot, g, { rotY: .3 });
    const it = { type, spot, g }; g.userData.item = it; spot.item = it; this.items[type] = it;
    this.G.world.idsDirty = true;
    return it;
  }
  removeItem(type) {
    const it = this.items[type]; if (!it) return;
    it.spot.item = null; it.spot.itemGroup = null; it.g.parent?.remove(it.g);
    if (it.spot.free) dropFreeSpot(it.spot);
    delete this.items[type];
    this.H.hide.items = this.H.hide.items.filter(e => e.item !== type);
  }
  switchZone(id) {
    if (id === this.zoneId) return;
    const G = this.G;
    if (!G.zoneOpen(id)) { const z = HOME_ZONES.find(x => x.id === id); G.ui.toast(`스테이지 ${z.unlock.stage}에서 열려요 · 상점에서 미리 열 수도 있어요`, 'red'); return; }
    this.zoneId = id; this.H.current = id; G.persist();
    G.audio.sfx('whoosh');
    this.build(); this.setMode(this.mode === 'hide' ? 'hide' : this.mode);
  }

  // ── HUD
  setMode(mode) {
    const G = this.G, ui = G.ui;
    this.mode = mode; this.sel = null; this.markers = null; this.ftool = null;
    ui.clear(); if (this.room) this.fitCam();
    const col = this.col = ui.col();
    const back = ui.ibtn('home', 'blue', () => mode === 'view' ? G.go('home') : this.setMode('view'));
    back.style.cssText += 'position:absolute;left:12px;top:calc(12px + var(--safeT))';
    col.append(back);
    const pills = h('div', { class: 'pills' }); const cp = ui.pill('coin', G.save.coins); pills.append(cp); col.append(pills); G.coinPills = [cp];
    col.append(this.zoneTabs());
    if (mode === 'view') this.viewHud();
    else if (mode === 'edit') this.editHud();
    else if (mode === 'hide') this.hideHud();
  }
  zoneTabs() {
    const G = this.G;
    const bar = h('div', { class: 'zonetabs' });
    for (const z of HOME_ZONES) {
      const open = G.zoneOpen(z.id);
      bar.append(h('button', { class: 'zonetab' + (z.id === this.zoneId ? ' on' : '') + (open ? '' : ' locked'), onclick: () => this.switchZone(z.id) }, open ? z.name : `🔒 ${z.name}`));
    }
    return bar;
  }
  viewHud() {
    const G = this.G, ui = G.ui;
    this.recordEl = h('div', { class: 'record' }, '내 숨바꼭질 방 기록 불러오는 중…');
    this.col.append(this.recordEl);
    const bar = h('div', { class: 'modebar' });
    bar.append(h('div', { class: 'btnrow' },
      ui.btn('꾸미기', { color: 'orange', icon: 'paint', onClick: () => this.setMode('edit') }),
      ui.btn('숨기기', { color: 'purple', icon: 'hide', onClick: () => this.setMode('hide') }),
      ui.btn('상점', { color: 'yellow', icon: 'shop', onClick: () => this.shop() })));
    bar.append(ui.btn('놀러 가기', { color: 'green', icon: 'play', cls: 'big stack', sub: '다른 사람이 숨긴 방 찾기', onClick: () => G.go('visit') }));
    this.col.append(bar);
    this.renderRecord();
  }
  async loadStats() {
    await initNet(); if (this.dead) return;
    const N = net();
    if (!N.ok) { this.stats = null; this.renderRecord(); return; }
    const all = await roomStats();
    if (this.dead) return;
    this.stats = all[N.uid] || { visitors: 0, plays: 0, wins: 0, fails: 0 };
    this.renderRecord();
  }
  renderRecord() {
    const el = this.recordEl; if (!el || this.mode !== 'view') return;
    const G = this.G, H = this.H, N = net();
    el.innerHTML = '';
    if (!H.published) { el.append(h('span', {}, '아직 올린 방이 없어요. 숨기기에서 방을 꾸며 올려 보세요!')); return; }
    if (!N.ok) { el.append(h('span', {}, `올린 방: ${HOME_ZONES.find(z => z.id === H.published.zoneId)?.name || ''} · 물건 ${H.published.count}개 (연습 모드에선 나만 볼 수 있어요)`)); return; }
    const s = this.stats;
    if (!s) { el.append(h('span', {}, '기록 불러오는 중…')); return; }
    el.append(h('span', {}, `내 방에 놀러 온 사람 ${s.visitors ?? s.plays}명 · 도전 ${s.plays}번 · 다 찾음 ${s.wins} · 못 찾음 ${s.fails}`));
    const due = Math.max(0, s.fails - (H.claimedFails || 0));
    if (due > 0) el.append(G.ui.btn(`보상 +${due * 30}`, { color: 'yellow', icon: 'coin', cls: 'sm', onClick: () => { H.claimedFails = s.fails; G.addCoins(due * 30); G.persist(); G.audio.sfx('coin'); this.renderRecord(); } }));
  }
  shop(tab = 'furn') {
    openShop(this.G, { zone: this.zone, onChange: kind => {
      if (kind === 'paint') { this.build(); this.fitCam(); this.setMode(this.mode); }
      if (kind === 'zone') this.setMode(this.mode);
      if (kind === 'furn' && this.mode === 'edit') this.renderInv();
    }, onClose: () => { if (this.mode !== 'edit') this.setMode(this.mode); } }, tab);
  }

  // ── decorate
  editHud() {
    const G = this.G, ui = G.ui;
    this.col.append(h('div', { class: 'hint' }, h('span', {}, '가구를 탭해서 고르고, 끌어서 옮겨요')));
    const bar = h('div', { class: 'modebar' });
    this.cardsEl = h('div', { class: 'cards' });
    bar.append(this.cardsEl);
    bar.append(h('div', { class: 'btnrow' },
      ui.btn('상점', { color: 'orange', icon: 'shop', onClick: () => this.shop('furn') }),
      ui.btn('벽·바닥', { color: 'pink', icon: 'paint', onClick: () => this.shop(ZONE_TYPES[this.zone.type].indoor ? 'wall' : 'floor') }),
      ui.btn('완료', { color: 'green', icon: ICON.check, onClick: () => { G.persist(); this.setMode('view'); } })));
    this.col.append(bar);
    this.renderInv();
  }
  fits(t) { const z = ZONE_TYPES[this.zone.type], it = SHOP_FURN.find(x => x.type === t); return !it || (z.indoor ? it.indoor : it.outdoor); }
  renderInv() {
    const G = this.G;
    if (!this.cardsEl) return;
    this.cardsEl.innerHTML = '';
    const inv = this.H.inventory;
    const shown = inv.map((t, i) => [t, i]).filter(([t]) => FURN_INFO[t]);
    if (!shown.length) this.cardsEl.append(h('div', { style: 'padding:14px;font-size:16px;color:#8a6a9a' }, '보관함이 비었어요. 상점에서 가구를 사 보세요!'));
    G.needThumbs?.(shown.map(([t]) => 'furn_' + t));
    for (const [t, i] of shown) {
      const ok = this.fits(t);
      this.cardsEl.append(h('div', { class: 'card' + (ok ? '' : ' lockedc'), onclick: () => ok ? this.placeFromInv(i) : G.ui.toast(ZONE_TYPES[this.zone.type].indoor ? '야외용이에요' : '실내용이에요', 'red') },
        h('img', { src: G.thumbs['furn_' + t] }), h('div', {}, FURN_INFO[t].name)));
    }
  }
  placeFromInv(i) {
    const G = this.G, t = this.H.inventory[i], R = this.room;
    const cands = [];
    for (let z = -R.d / 2 + .5; z <= R.d / 2 - .5; z += .5) for (let x = -R.w / 2 + .5; x <= R.w / 2 - .5; x += .5) for (const a of [0, Math.PI / 2])
      if (R.canPlaceAt(t, x, z, a)) cands.push({ x, z, a, d: Math.hypot(x, z) + a * .05 });
    if (!cands.length) { G.ui.toast('자리가 없어요! 가구를 보관함에 넣어 보세요', 'red'); return; }
    cands.sort((a, b) => a.d - b.d);
    const c = cands[0], id = 'f' + Date.now().toString(36) + i;
    this.H.inventory.splice(i, 1);
    this.zone.furniture.push({ type: t, x: c.x, z: c.z, a: c.a, id });
    const rec = R.addFurnitureAt(t, c.x, c.z, c.a, id);
    const idx = indexSpots(R); this.spotByKey = idx.spots; this.partByKey = idx.parts;
    G.audio.sfx('place'); G.world.idsDirty = true;
    this.select(rec);
    const g = rec.f.group, y0 = g.position.y; this.tw.run(.35, k => { g.position.y = y0 + (1 - k) * 1.2; }, ease.outBounce);
    this.renderInv(); G.persist();
  }
  select(rec) {
    const G = this.G;
    this.sel = rec;
    this.ftool?.remove(); this.ftool = null;
    this.footprint?.parent?.remove(this.footprint);
    if (!rec) return;
    const ui = G.ui;
    this.ftool = h('div', { class: 'ftool' },
      ui.btn(null, { color: 'blue', icon: 'rotate', onClick: () => this.rotateSel() }),
      ui.btn(null, { color: 'red', icon: 'box', onClick: () => this.storeSel() }));
    ui.wui.append(this.ftool);
    this.ftool.querySelectorAll('.btn').forEach(b => b.style.pointerEvents = 'auto');
    if (rec.x == null) { const [fw, fd] = this.room.footprint(rec.type, rec.rot), p = this.room.tileToWorld(rec.i, rec.j, fw, fd); this.room.moveFurnitureAt(rec, p.x, p.z, rec.rot * Math.PI / 2); }
    const fp = this.footprint = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#7be04f', transparent: true, opacity: .45, depthWrite: false }));
    fp.rotation.order = 'YXZ'; fp.position.y = .02; this.room.group.add(fp);
    this.updFootprint(rec.x, rec.z, rec.a, true);
    G.audio.sfx('click');
  }
  updFootprint(x, z, a, ok) {
    const inf = FURN_INFO[this.sel.type];
    this.footprint.position.set(x, .02, z); this.footprint.rotation.set(-Math.PI / 2, a, 0); this.footprint.scale.set((inf.w || 1) - .06, (inf.d || 1) - .06, 1);
    this.footprint.material.color.set(ok ? '#7be04f' : '#ff4f66');
  }
  rotateSel() {
    const r = this.sel; if (!r) return;
    for (let k = 1; k <= 8; k++) { const a = r.a + k * Math.PI / 4; if (this.room.canPlaceAt(r.type, r.x, r.z, a, r.id)) { this.room.moveFurnitureAt(r, r.x, r.z, ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)); this.syncRec(r); this.updFootprint(r.x, r.z, r.a, true); this.G.audio.sfx('swish'); return; } }
    this.G.ui.toast('돌릴 자리가 없어요!', 'red');
  }
  storeSel() {
    const r = this.sel; if (!r) return;
    for (const s of r.f.spots) if (s.item) this.removeItem(s.item.type);
    for (const t in this.items) { let on = false; for (let o = this.items[t].spot.anchor; o; o = o.parent) if (o === r.f.group) on = true; if (on) this.removeItem(t); }
    for (const p of r.f.parts) if (p.key) delete this.H.hide.locks[p.key];
    this.room.removeFurniture(r); this.room.fitParts();
    this.zone.furniture = this.zone.furniture.filter(f => f.id !== r.id);
    this.H.inventory.push(r.type);
    this.select(null);
    const idx = indexSpots(this.room); this.spotByKey = idx.spots; this.partByKey = idx.parts;
    this.renderInv(); this.G.persist(); this.G.audio.sfx('pop', 2);
  }
  syncRec(r) { const f = this.zone.furniture.find(x => x.id === r.id); if (f) { f.x = +r.x.toFixed(3); f.z = +r.z.toFixed(3); f.a = +r.a.toFixed(4); f.i = r.i; f.j = r.j; f.rot = r.rot; } this.room.fitParts(); }
  dragStart(x, y) {
    if (this.mode === 'hide') return this.dragItem(x, y);
    if (this.mode !== 'edit' || !this.sel) return null;
    const hit = this.pick(x, y);
    if (hit.kind !== 'furn' || hit.furn.rec !== this.sel) return null;
    const r = this.sel, R = this.room, W = this.G.world, snap = v => Math.round(v * 4) / 4;
    const start = { x: r.x, z: r.z }, g0 = W.screenToGround(x, y, 0);
    let cur = { ...start, ok: true };
    return {
      move: (mx, my) => {
        const g = W.screenToGround(mx, my, 0); if (!g || !g0) return;
        const nx = clamp(snap(start.x + g.x - g0.x), -R.w / 2, R.w / 2), nz = clamp(snap(start.z + g.z - g0.z), -R.d / 2, R.d / 2);
        if (nx === cur.x && nz === cur.z) return;
        cur = { x: nx, z: nz, ok: R.canPlaceAt(r.type, nx, nz, r.a, r.id) };
        r.f.group.position.set(nx, .15, nz);
        this.updFootprint(nx, nz, r.a, cur.ok); this.G.audio.sfx('tap');
      },
      end: () => {
        if (cur.ok && (cur.x !== start.x || cur.z !== start.z)) { R.moveFurnitureAt(r, cur.x, cur.z, r.a); this.syncRec(r); this.G.audio.sfx('place'); this.G.persist(); }
        else { R.moveFurnitureAt(r, start.x, start.z, r.a); if (!cur.ok) this.G.ui.toast('거긴 놓을 수 없어요', 'red'); }
        this.updFootprint(r.x, r.z, r.a, true);
      },
      cancel: () => {},
    };
  }
  // hide mode: drag something you hid onto any other surface
  dragItem(x, y) {
    const hit = this.pick(x, y);
    if (hit.kind !== 'item') return null;
    const it = hit.item, type = it.type, W = this.G.world, R = this.room;
    let cur = null;
    return {
      move: (mx, my) => {
        const s = pickSurface(W, R, mx, my, it.g);
        if (!s || s.side || (s.part && s.part.t < .5)) return;
        cur = s;
        R.group.add(it.g); it.g.position.copy(R.group.worldToLocal(s.point.clone())); it.g.visible = true;
      },
      end: async () => {
        if (!cur) return;
        const ok = await this.freePlace(cur, type, true);
        if (!ok) { this.build(); this.setMode('hide'); }   // the record never changed: show it where it still is
      },
      cancel: () => { if (cur) { this.build(); this.setMode('hide'); } },
    };
  }
  // put one saved hiding record back into the room (after a refused move)
  restoreItem(e) {
    if (e.free) {
      const host = resolveHost(this.room, e.free.host, this.partByKey, e.free.part);
      if (host) this.putItem(e.item, makeFreeSpot(host, new THREE.Vector3(...e.free.p), e.free.ry || 0));
    } else { const s = this.spotByKey[e.spot]; if (s && !s.item) this.putItem(e.item, s); }
  }
  // hide `type` on a surface picked with pickSurface(); refuses places nobody could ever see
  async freePlace(s, type = this.selItem, moving = false) {
    const G = this.G, hid = this.H.hide;
    if (!type) return false;
    if ((type === 'key' || type === 'note') && s.part && hid.locks[s.part.key]) { G.ui.toast('잠근 곳 안에 열쇠를 넣으면 안 돼요!', 'red'); return false; }
    const isTarget = type !== 'key' && type !== 'note';
    if (isTarget && !this.items[type] && this.targetCount() >= MAX_HIDE) { G.ui.toast(`한 번에 ${MAX_HIDE}개까지 숨길 수 있어요`, 'red'); return false; }
    const prevAt = hid.items.findIndex(e => e.item === type), prev = prevAt >= 0 ? hid.items[prevAt] : null;
    if (this.items[type]) this.removeItem(type);
    const local = toLocal(s, s.point), ry = +((Math.random() - .5) * 1.2).toFixed(2);
    const it = this.putItem(type, makeFreeSpot(s, local, ry));
    if (!viewsOf(G.world, this.room, it)) {
      this.removeItem(type); G.audio.sfx('miss');
      if (prev) { hid.items.splice(prevAt, 0, prev); this.restoreItem(prev); }   // the old place stays
      G.ui.toast('여긴 아무도 못 찾아요! 조금이라도 보이는 곳에 놓아 주세요', 'red');
      return false;
    }
    const rec = { item: type, free: { host: s.key, ...(s.via ? { part: s.via } : {}), p: [local.x, local.y, local.z].map(v => +v.toFixed(3)), ry } };
    if (prev) hid.items.splice(prevAt, 0, rec); else hid.items.push(rec);
    G.persist(); G.audio.sfx('place');
    const sp = G.world.toScreen(s.point);
    G.world.fx.burst(sp.x, sp.y, { n: 10, shape: 'heart', colors: ['#ff6fa6', '#ffb3d1', '#ffffff'], speed: 140 });
    G.ui.floatText(sp.x, sp.y - 30, s.label || '여기', '');
    if (!moving) {
      const placed = new Set(hid.items.map(e => e.item));
      this.selItem = [...this.chainNeeded(), ...G.save.collection].find(x => !placed.has(x)) || null;
    }
    this.renderHideCards();
    return true;
  }

  // ── hide & publish
  hideHud() {
    const G = this.G, ui = G.ui, hid = this.H.hide;
    if (hid.zoneId !== this.zoneId) {
      // one room is the hide-and-seek room at a time; the other rooms keep their own draft until you come back
      const drafts = this.H.drafts || (this.H.drafts = {});
      if (hid.zoneId && (hid.items.length || Object.keys(hid.locks).length)) drafts[hid.zoneId] = { items: hid.items, locks: hid.locks, code: hid.code };
      const d = drafts[this.zoneId]; delete drafts[this.zoneId];
      if (hid.items.length && hid.zoneId) G.ui.toast(`숨김 방을 ${this.zone.name}(으)로 바꿨어요 · 전 방 배치는 저장해 뒀어요`, '');
      hid.zoneId = this.zoneId; hid.items = d?.items || []; hid.locks = d?.locks || {}; if (d?.code) hid.code = d.code;
      G.persist();
      this.build();
    }
    this.col.append(h('div', { class: 'hint' }, h('span', {}, `물건 고르고 숨길 곳 탭 · 최대 ${MAX_HIDE}개`)));
    const tut = G.save.tut || (G.save.tut = {});
    if (!tut.raidTip) { tut.raidTip = 1; G.persist(); setTimeout(() => !this.dead && G.ui.toast('서랍 속·자물쇠 안일수록 동네 주민이 못 털어 가요', ''), 900); }
    const bar = h('div', { class: 'modebar' });
    this.cardsEl = h('div', { class: 'cards' });
    bar.append(this.cardsEl);
    this.lockRow = h('div', { class: 'btnrow' });
    bar.append(this.lockRow);
    this.pubBtn = ui.btn('방 올리기', { color: 'green', icon: 'share', onClick: dis => dis ? this.whyNot() : this.publish() });
    this.testBtn = ui.btn('내가 풀어보기', { color: 'blue', onClick: () => this.selfTest() });
    bar.append(h('div', { class: 'btnrow' }, this.testBtn, this.pubBtn));
    this.col.append(bar);
    this.selItem = null;
    this.renderHideCards();
    this.markers = null;   // no round guide markers (user, 2026-10-15): tap a drawer to open it, then tap inside
  }
  chainNeeded() { return Object.values(this.H.hide.locks).map(k => k === 'pad' ? 'key' : 'note'); }
  renderHideCards() {
    const G = this.G, hid = this.H.hide;
    this.cardsEl.innerHTML = '';
    const coll = G.save.collection;
    const placed = new Set(hid.items.map(e => e.item));
    const list = [...this.chainNeeded(), ...coll];
    if (!this.selItem) this.selItem = list.find(t => !placed.has(t));
    for (const t of list) {
      const e = hid.items.find(x => x.item === t), s = e && this.items[t]?.spot;   // fixed spots and free places alike
      this.cardsEl.append(h('div', { class: 'card' + (this.selItem === t ? ' sel' : '') + (s ? ' done' : ''), onclick: () => { this.selItem = t; G.audio.sfx('click'); this.renderHideCards(); } },
        s ? h('div', { class: 'tag' }, '숨김') : null, h('img', { src: G.thumbs['item_' + t] }), h('div', {}, ITEMS[t].name), h('div', { style: 'font-size:11px;color:#9b6cff' }, s ? s.label : (t === 'key' || t === 'note') ? '꼭 숨겨야 해요' : '')));
    }
    this.cardsEl.append(h('div', { class: 'card lockedc', style: 'display:flex;align-items:center;justify-content:center;font-size:12px;min-height:110px' }, `스테이지에서 찾은 물건이 여기 모여요 (${coll.length}종)`));
    this.lockRow.innerHTML = '';
    const lockables = this.room.parts.filter(p => p.lockable && p.spots.some(s => s.item && this.items[s.item.type] === s.item && s.item.type !== 'key' && s.item.type !== 'note'));
    for (const p of lockables) {
      const on = !!hid.locks[p.key];
      this.lockRow.append(G.ui.btn(on ? `${p.label} 잠금 풀기` : `${p.label} 잠그기`, { color: on ? 'gray' : 'yellow', icon: 'lock', cls: 'sm', onClick: () => this.toggleLock(p) }));
    }
    const r = this.ready();
    this.pubBtn.classList.toggle('disabled', !r.ok); this.pubBtn.classList.toggle('pulse', r.ok);
  }
  targetCount() { return this.H.hide.items.filter(e => e.item !== 'key' && e.item !== 'note').length; }
  ready() {
    if (!this.targetCount()) return { ok: false, why: '먼저 물건을 하나 이상 숨겨 주세요' };
    // every record must still sit somewhere real (a free place with a sane position whose host still exists)
    for (const e of this.H.hide.items) {
      const bad = e.free ? !(Array.isArray(e.free.p) && e.free.p.length === 3 && e.free.p.every(v => Number.isFinite(v) && Math.abs(v) <= 20)) : false;
      if (bad || (this.items && !this.items[e.item])) return { ok: false, why: `${ITEMS[e.item]?.name || '물건'}을(를) 다시 놓아 주세요` };
    }
    for (const c of this.chainNeeded()) if (!this.H.hide.items.some(e => e.item === c)) return { ok: false, why: c === 'key' ? '열쇠도 다른 곳에 숨겨야 해요' : '비밀번호 쪽지도 숨겨야 해요' };
    if (this.stuckItems().length) return { ok: false, why: '열쇠나 쪽지가 잠긴 곳에 갇혀서 끝까지 못 찾아요' };
    return { ok: true };
  }
  // Play the room out the way a visitor would: the key opens every padlock, the note opens every code lock.
  // Anything still behind a closed lock at the end can never be reached.
  stuckItems() {
    const hid = this.H.hide, open = new Set(), have = {};
    const lockOf = e => { const p = e.free ? (e.free.part || (e.free.host.startsWith('p:') ? e.free.host.slice(2) : null)) : this.spotByKey[e.spot]?.part?.key; return p && hid.locks[p] ? p : null; };
    for (let changed = true; changed;) {
      changed = false;
      for (const e of hid.items) {
        if ((e.item === 'key' || e.item === 'note') && !have[e.item]) { const l = lockOf(e); if (!l || open.has(l)) { have[e.item] = true; changed = true; } }
      }
      for (const pk in hid.locks) if (!open.has(pk) && have[hid.locks[pk] === 'pad' ? 'key' : 'note']) { open.add(pk); changed = true; }
    }
    return hid.items.filter(e => { const l = lockOf(e); return l && !open.has(l); });
  }
  whyNot() { this.G.ui.toast(this.ready().why, 'red'); }
  toggleLock(p) {
    const G = this.G, hid = this.H.hide;
    if (hid.locks[p.key]) {
      const kind = hid.locks[p.key]; delete hid.locks[p.key];
      if (p.lockMesh) { p.lockMesh.parent?.remove(p.lockMesh); p.lockMesh = null; } p.lock = null;
      const c = kind === 'pad' ? 'key' : 'note';
      if (!this.chainNeeded().includes(c)) this.removeItem(c);
    } else {
      if (p.spots.some(s => s.item && (s.item.type === 'key' || s.item.type === 'note'))) { G.ui.toast('열쇠나 쪽지가 들어 있는 곳은 잠글 수 없어요', 'red'); G.audio.sfx('miss'); return; }
      const kind = p.furn.type === 'safe' ? 'code' : 'pad';
      hid.locks[p.key] = kind; hid.code = hid.code || String(100 + Math.floor(Math.random() * 900));
      p.furn.setLock(p, kind, hid.code);
      G.audio.sfx('unlock');
      this.selItem = kind === 'pad' ? 'key' : 'note';
      G.ui.toast(kind === 'pad' ? '잠갔어요! 열쇠를 다른 곳에 숨겨 주세요' : '잠갔어요! 비밀번호 쪽지를 다른 곳에 숨겨 주세요', 'green');
      G.world.idsDirty = true;
    }
    G.persist(); this.renderHideCards();
  }
  async placeIn(place) {
    const t = this.selItem; if (!t) return;
    const def = ITEMS[t];
    const ok = s => def.h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || def.flat);
    const s = place.spots.find(x => x.item?.type === t) || place.spots.find(x => !x.item && ok(x)) || place.spots.find(ok) || place.spots[0];
    await this.placeTreasure(s);
  }
  async placeTreasure(spot) {
    const G = this.G, t = this.selItem, hid = this.H.hide;
    if (!t || !spot) return;
    const def = ITEMS[t];
    if (def.h * (spot.scale || 1) > spot.maxH + .001 || (spot.maxH < .1 && !def.flat)) { G.ui.toast('여긴 너무 좁아요! 납작한 것만 들어가요', 'red'); G.audio.sfx('miss'); return; }
    if ((t === 'key' || t === 'note') && spot.part && hid.locks[spot.part.key]) { G.ui.toast('잠근 곳 안에 열쇠를 넣으면 안 돼요!', 'red'); return; }
    const isTarget = t !== 'key' && t !== 'note';
    if (isTarget && !this.items[t] && this.targetCount() >= MAX_HIDE) { G.ui.toast(`한 번에 ${MAX_HIDE}개까지 숨길 수 있어요`, 'red'); return; }
    if (spot.item && spot.item.type !== t) this.removeItem(spot.item.type);
    if (this.items[t]) this.removeItem(t);
    this.putItem(t, spot);
    hid.items.push({ item: t, spot: spot.key });
    G.persist(); G.audio.sfx('place');
    const sp = G.world.toScreen(this.room.spotWorld(spot));
    G.world.fx.burst(sp.x, sp.y, { n: 10, shape: 'heart', colors: ['#ff6fa6', '#ffb3d1', '#ffffff'], speed: 140 });
    G.ui.floatText(sp.x, sp.y - 30, spot.label, '');
    if (spot.part) { await this.openPart(spot.part, true); await this.tw.wait(.35); await this.openPart(spot.part, false); }
    const placed = new Set(hid.items.map(e => e.item));
    this.selItem = [...this.chainNeeded(), ...G.save.collection].find(x => !placed.has(x)) || null;
    this.renderHideCards();
  }
  roomDoc() {
    const hid = this.H.hide;
    return {
      v: 2, title: this.zone.name, face: 'mong',
      zone: { type: this.zone.type, furniture: this.zone.furniture.map(f => ({ type: f.type, i: f.i, j: f.j, rot: f.rot, id: f.id, ...(f.x != null ? { x: f.x, z: f.z, a: f.a } : {}) })), paint: this.zone.paint || {},
        ...(this.zone.style ? { style: this.zone.style } : {}), ...(this.zone.size ? { size: this.zone.size } : {}) },
      hidden: hid.items.map(e => e.free ? { item: e.item, free: e.free } : { item: e.item, spot: e.spot }), locks: Object.entries(hid.locks).map(([part, kind]) => ({ part, kind })), code: hid.code || '000',
      count: this.targetCount(),
    };
  }
  // 내가 풀어보기: play my own room exactly as a visitor would — no coins, no stats — then come back to fix it
  selfTest() {
    const r = this.ready(); if (!r.ok) return this.whyNot();
    this.G.persist();
    this.G.go('stage', { custom: { ...this.roomDoc(), id: 'self-' + this.zoneId, practice: true, selfTest: true, nick: '나', title: this.zone.name, back: this.zoneId } });
  }
  async publish() {
    const G = this.G, H = this.H, hid = H.hide;
    const r = this.ready(); if (!r.ok) return this.whyNot();
    const doc = this.roomDoc();
    const bad = validateRoom(doc);
    if (bad) { G.ui.toast('방 정보가 이상해서 올리지 못했어요: ' + bad, 'red'); G.audio.sfx('miss'); return; }
    if (this._publishing) return;
    this._publishing = true;
    G.ui.toast('방을 올리는 중…', '');
    await initNet();
    const res = await publishRoom(doc);
    this._publishing = false;
    const keepOn = G.ui.btn('계속 꾸미기', { color: 'blue', cls: 'sm', onClick: () => { G.ui.closePanel(); this.setMode('view'); } });
    if (res.ok || res.why === 'offline') {
      // the published copy changes only once it really went somewhere
      H.published = { zoneId: this.zoneId, at: Date.now(), count: doc.count, online: !!res.ok };
      H.publishedDoc = doc;
      G.persist();
    }
    if (res.ok) {
      G.audio.sfx('win'); G.world.fx.confetti(70);
      G.ui.panel({ title: '방을 올렸어요!', color: 'green', body: [
        h('div', { class: 'big-txt' }, `${this.zone.name} · 숨긴 물건 ${doc.count}개`),
        h('div', { class: 'txt' }, '이 게임을 여는 다른 사람들이 내 방에 찾으러 와요. 못 찾고 돌아가면 보상을 받아요!'),
      ], buttons: [keepOn, G.ui.btn('놀러 가기', { color: 'green', icon: 'play', onClick: () => G.go('visit') })] });
    } else if (res.why === 'offline') {
      G.audio.sfx('place');
      G.ui.panel({ title: '이 기기에 저장했어요', color: 'blue', body: [
        h('div', { class: 'big-txt' }, `${this.zone.name} · 숨긴 물건 ${doc.count}개`),
        h('div', { class: 'txt' }, '지금은 연습 모드라 다른 사람에게는 아직 안 보여요. 공유된 Claude 링크로 열면 다른 사람이 찾으러 올 수 있어요.'),
      ], buttons: [keepOn, G.ui.btn('놀러 가기', { color: 'green', icon: 'play', onClick: () => G.go('visit') })] });
    } else {
      G.audio.sfx('miss');
      G.ui.panel({ title: '올리지 못했어요', color: 'red', body: [
        h('div', { class: 'txt' }, res.why === 'permission-denied' ? '이 링크에서는 방을 올릴 권한이 없어요.' : '연결이 잠깐 불안정했어요.'),
        h('div', { class: 'txt' }, H.published ? '전에 올린 방은 그대로 있어요.' : '숨긴 물건과 배치는 이 기기에 그대로 있어요.'),
      ], buttons: [keepOn, G.ui.btn('다시 올리기', { color: 'green', onClick: () => { G.ui.closePanel(); this.publish(); } })] });
    }
  }
  async openPart(part, open) {
    const W = this.G.world;
    if (part.busy) return;
    part.busy = true;
    if (open) { part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = true; }); this.G.audio.sfx(part.sfx); }
    else this.G.audio.sfx('close');
    const a = part.t, b = open ? 1 : 0;
    await this.tw.run(part.dur, k => { part.setOpen(a + (b - a) * k); W.shadowDirty = true; }, open ? ease.outBack : ease.inOutQuad);
    if (!open) part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; });
    part.busy = false;
  }
  hidePlaces() {
    const places = [], seen = new Set();
    for (const s of this.room.spots) {
      if (s.furn.wall && this.room.walls[s.furn.rec.wall]?.down) continue;
      // open surfaces need no marker any more (tap anywhere); only things that open get one
      if (s.part && !s.free) { if (seen.has(s.part)) continue; seen.add(s.part); places.push({ key: s.part, spots: s.part.spots.filter(q => !q.free), inside: true, pos: () => this.partCenter(s.part) }); }
    }
    return places;
  }
  partCenter(part) { const b = new THREE.Box3(); part.pivots.forEach(p => b.expandByObject(p)); return b.getCenter(new THREE.Vector3()); }
  updMarkers() {
    const W = this.G.world, want = new Set();
    for (const pl of this.hidePlaces()) {
      want.add(pl.key);
      let m = this.markers.get(pl.key);
      if (!m) {
        m = h('div', { class: 'mk' + (pl.inside ? ' inside' : '') });
        m.addEventListener('pointerdown', e => e.stopPropagation());
        m.addEventListener('pointerup', e => { e.stopPropagation(); this.placeIn(m._pl); });
        this.G.ui.wui.append(m); this.markers.set(pl.key, m);
      }
      m._pl = pl;
      const usedIt = pl.spots.map(s => s.item).find(it => it && this.items[it.type] === it);
      const sig = usedIt ? usedIt.type : '';
      if (m._sig !== sig) { m._sig = sig; m.classList.toggle('used', !!usedIt); m.innerHTML = usedIt ? `<img src="${this.G.thumbs['item_' + usedIt.type]}" style="width:28px;height:28px">` : ''; }
      const p = W.toScreen(pl.pos());
      m.style.left = p.x + 'px'; m.style.top = p.y + 'px';
    }
    for (const [k, m] of this.markers) if (!want.has(k)) { m.remove(); this.markers.delete(k); }
  }

  // ── taps
  pick(x, y) {
    const hits = this.G.world.pick(x, y, [this.room.group]);
    for (const hh of hits) {
      for (let o = hh.object; o; o = o.parent) {
        const u = o.userData;
        if (u.item) return { kind: 'item', item: u.item };
        if (u.char) return { kind: 'char', char: u.char };
        if (u.part && this.mode !== 'edit') return { kind: 'part', part: u.part };
        if (u.furn) return { kind: 'furn', furn: u.furn };
        if (u.wall || u.floor) return { kind: 'floor' };
      }
    }
    return { kind: 'none' };
  }
  tap(x, y) {
    const G = this.G, hit = this.pick(x, y);
    if (hit.kind === 'char') { this.reactChar(hit.char); return; }
    if (this.mode === 'edit') { if (hit.kind === 'furn' && !hit.furn.wall) this.select(hit.furn.rec); else this.select(null); return; }
    if (this.mode === 'hide') {
      if (this.selItem) {
        const s = pickSurface(G.world, this.room, x, y);
        if (s && !s.side && (!s.part || s.part.t > .5)) { this.freePlace(s); return; }
      }
      if (hit.kind === 'part' && !hit.part.lock) { this.openPart(hit.part, hit.part.t < .5); return; }
      if (hit.kind === 'part' && hit.part.lock) { G.audio.sfx('locked'); return; }
      if (this.selItem) G.ui.toast('바닥이나 가구 위, 열어 둔 서랍 안을 눌러 숨겨요', '');
      return;
    }
    if (hit.kind === 'part' && !hit.part.lock) this.openPart(hit.part, hit.part.t < .5);
    else if (hit.kind === 'part' && hit.part.lock) G.audio.sfx('locked');
  }
  reactChar(ch) {
    const G = this.G;
    if (ch.react) { const r = ch.react(this.tw, (n, p) => G.audio.sfx(n, p)); if (r.line) this.say(ch, r.line); return; }
    ch.bump(.4); G.audio.sfx('giggle');
  }
  say(ch, text, ms = 1300) {
    const b = h('div', { class: 'bubble pop' }, text);
    this.G.ui.wui.append(b);
    const upd = () => { const p = this.G.world.toScreen(V.copy(ch.root.getWorldPosition(new THREE.Vector3())).setY(ch.headTop() + .2)); b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; };
    upd(); const iv = setInterval(upd, 30);
    setTimeout(() => { clearInterval(iv); b.remove(); }, ms);
  }
  update(dt) {
    this.tw.update(dt);
    this.room.update(dt);
    this.mong.update(dt);
    this.visitors?.update(dt);
    if (this.mode === 'hide' && this.markers) this.updMarkers();
    if (this.ftool && this.sel) {
      const b = new THREE.Box3().setFromObject(this.sel.f.group);
      const p = this.G.world.toScreen(new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y + .1, (b.min.z + b.max.z) / 2));
      this.ftool.style.left = p.x + 'px'; this.ftool.style.top = p.y + 'px';
    }
  }
  botStep(dt) {
    this._bt = (this._bt || 0) + dt; if (this._bt < 1) return; this._bt = 0;
    if (this.mode === 'view') this.setMode('hide');
    else if (this.mode === 'hide') {
      if (this.targetCount() < Math.min(3, this.G.save.collection.length)) {
        const t = this.G.save.collection.find(x => !this.items[x]);
        const free = this.room.spots.filter(s => !s.item && ITEMS[t].h <= s.maxH && (s.maxH >= .1 || ITEMS[t].flat));
        this.selItem = t; this.placeTreasure(free[Math.floor(Math.random() * free.length)]);
      } else if (!this._pub) { this._pub = true; this.publish(); }
    }
  }
  state() { return { scene: 'myhome', zone: this.zoneId, mode: this.mode, hidden: this.targetCount() }; }
}

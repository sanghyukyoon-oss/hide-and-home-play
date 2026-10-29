// Meta: decorate your own room (CoC-style base building), hide treasures (with locks), then watch Mom raid it live.
import * as THREE from 'three';
import { Room, attachItem } from '../room.js';
import { THEMES, LAYOUTS } from '../stages.js';
import { buildItem, ITEMS, TREASURES } from '../gfx/items.js';
import { realScale } from '../fitspot.js';
import { FURN_INFO } from '../gfx/furniture.js';
import { Char } from '../gfx/chars.js';
import { h, ICON } from '../ui.js';
import { ease, clamp, Tweens, rng } from '../util.js';
import { shown } from '../world.js';
import { mat, geo } from '../gfx/kit.js';

const V = new THREE.Vector3();
const SHOP = ['wardrobe', 'bookshelf', 'desk', 'sofa', 'safe', 'table', 'tvstand', 'boxes', 'trash', 'stool', 'lamp', 'drawers', 'chest', 'plant', 'fridge', 'counter'];

// How suspicious Mom finds each hiding place (by furniture type / spot label), and what she expects per treasure.
const BASE = { bed: .9, wardrobe: .75, drawers: .7, desk: .7, chest: .8, safe: .95, sofa: .55, plant: .3, rug: .45, table: .45, fridge: .25, counter: .35, tvstand: .5, trash: .2, boxes: .6, stool: .25, window: .35, picture: .25, bookshelf: .4 };
const AFF = {
  console: { bed: 1.5, wardrobe: 1.2, tvstand: 1.6, desk: 1.3, sofa: 1.4, chest: 1.1 },
  snack: { desk: 1.4, table: 1.6, chest: 1.2, drawers: 1.1, trash: 1.3, boxes: 1.3, counter: 1.4, fridge: 1.4 },
  report: { rug: 1.6, picture: 1.7, drawers: 1.3, desk: 1.4, bookshelf: 1.3, bed: 1.1 },
};
const TR_LINE = { console: '게임 소리가 나던데…', snack: '과자 부스러기가 있던데…', report: '성적표 나올 때 됐는데…' };

export class MyRoomScene {
  constructor(G) { this.G = G; this.name = 'myroom'; }
  get M() { return this.G.save.myroom; }
  async enter({ mode = 'view' } = {}) {
    const G = this.G, W = G.world;
    this.tw = new Tweens();
    G.setBg(THEMES.my.bg); G.world.setLight(null);
    this.build();
    W.home.set(0, .75, 0); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = .62; W.zoom = 1; W.vYaw = 0; W.autoSpin = 0;
    W.bounds = 2.4; W.minPitch = .34; W.maxPitch = 1.15; W.minZoom = 1; W.maxZoom = 2.6;
    W.setFit(7.5, 6.6, .45);
    W.onTap = (x, y) => this.tap(x, y);
    W.onRotate = null;
    W.onDragStart = (x, y) => this.dragStart(x, y);
    G.audio.music('home');
    this.setMode(mode);
    if (!this.M.tutDone && mode !== 'raid') { this.M.tutDone = true; G.persist(); if (mode === 'view') this.setMode('hide'); G.ui.toast('엄마 몰래 게임기를 숨겨볼까?', 'green'); }
  }
  exit() { this.dead = true; const W = this.G.world; W.root.remove(this.room.group); W.onTap = null; W.onDragStart = null; this.G.ui.clear(); this.tw.clear(); }
  build() {
    const G = this.G, W = G.world;
    if (this.room) W.root.remove(this.room.group);
    const L = LAYOUTS.my;
    this.room = new Room(W, { w: 5, d: 5, theme: THEMES.my, furniture: this.M.furniture, decor: L.decor, door: L.door });
    W.root.add(this.room.group);
    this.indexSpots();
    // treasures
    this.items = {};
    for (const t in this.M.hidden) {
      const s = this.spotByKey[this.M.hidden[t]];
      if (!s || s.item) { delete this.M.hidden[t]; continue; }
      this.putItem(t, s, true);
    }
    for (const pk in this.M.locks) { const p = this.partByKey[pk]; if (p) p.furn.setLock(p, this.M.locks[pk]); else delete this.M.locks[pk]; }
    this.mong = new Char('mong'); this.mong.root.position.set(1.9, 0, 1.9); this.mong.root.rotation.y = -2.4; this.room.group.add(this.mong.root);
  }
  indexSpots() {
    this.spotByKey = {}; this.partByKey = {};
    this.room.furns.forEach(r => { r.f.spots.forEach(s => { s.key = r.id + ':' + s.idx; this.spotByKey[s.key] = s; }); r.f.parts.forEach((p, i) => { p.key = r.id + ':p' + i; this.partByKey[p.key] = p; }); });
    this.room.decors.forEach((d, di) => { d.f.spots.forEach(s => { s.key = 'd' + di + ':' + s.idx; this.spotByKey[s.key] = s; }); d.f.parts.forEach((p, i) => { p.key = 'd' + di + ':p' + i; this.partByKey[p.key] = p; }); });
  }
  putItem(type, spot, silent = false) {
    const g = buildItem(type, { code: this.M.code || '000' });
    attachItem(spot, g, { rotY: .3, scale: realScale(type) });
    const it = { type, spot, g };
    g.userData.item = it; spot.item = it; this.items[type] = it;
    return it;
  }
  removeItem(type) {
    const it = this.items[type]; if (!it) return;
    it.spot.item = null; it.spot.itemGroup = null; it.g.parent?.remove(it.g);
    delete this.items[type]; delete this.M.hidden[type];
  }

  // ── modes
  setMode(mode) {
    const G = this.G, ui = G.ui;
    this.mode = mode; this.sel = null; this.selTreasure = null;
    ui.clear(); this.markers = null; this.ftool = null;
    this.room.allDown = false;
    const col = this.col = ui.col();
    if (mode !== 'raid') {
      col.append(Object.assign(ui.ibtn('home', 'blue', () => mode === 'view' ? G.go('home') : this.setMode('view')), { style: 'position:absolute;left:12px;top:calc(12px + var(--safeT))' }));
      const pills = h('div', { class: 'pills' }); const cp = ui.pill('coin', G.save.coins); pills.append(cp); col.append(pills); G.coinPills = [cp];
    }
    if (mode === 'view') this.viewHud();
    else if (mode === 'edit') this.editHud();
    else if (mode === 'hide') this.hideHud();
  }
  viewHud() {
    const G = this.G, ui = G.ui;
    this.col.append(h('div', { class: 'hint' }, h('span', {}, `몽글이 방 · 방어 ${this.M.wins}승 ${this.M.raids - this.M.wins}패`)));
    const bar = h('div', { class: 'modebar' });
    const n = Object.keys(this.M.hidden).filter(t => TREASURES.includes(t)).length;
    bar.append(h('div', { class: 'btnrow' },
      ui.btn('꾸미기', { color: 'orange', icon: 'paint', onClick: () => this.setMode('edit') }),
      ui.btn('숨기기', { color: 'purple', icon: 'hide', onClick: () => this.setMode('hide') })));
    bar.append(ui.btn('엄마 부르기!', { color: 'pink', icon: ICON.mom, cls: 'big' + (n ? ' pulse' : ''), disabled: !n, sub: n ? `숨긴 물건 ${n}개` : '먼저 물건을 숨겨!', onClick: dis => dis ? this.setMode('hide') : this.startRaid() }));
    bar.lastChild.classList.add('stack');
    this.col.append(bar);
  }
  // ── edit (decorate)
  editHud() {
    const G = this.G, ui = G.ui;
    this.col.append(h('div', { class: 'hint' }, h('span', {}, '가구를 터치해서 고르고, 드래그해서 옮겨!')));
    const bar = h('div', { class: 'modebar' });
    this.cardsEl = h('div', { class: 'cards' });
    bar.append(this.cardsEl);
    bar.append(h('div', { class: 'btnrow' }, ui.btn('상점', { color: 'orange', icon: 'shop', onClick: () => this.openShop() }), ui.btn('완료', { color: 'green', icon: ICON.check, onClick: () => { this.G.persist(); this.setMode('view'); } })));
    this.col.append(bar);
    this.renderInv();
  }
  renderInv() {
    const G = this.G;
    this.cardsEl.innerHTML = '';
    const inv = this.M.inventory;
    if (!inv.length) this.cardsEl.append(h('div', { style: 'padding:14px;font-size:16px;color:#8a6a9a' }, '보관함이 비었어. 상점에서 가구를 사봐!'));
    G.needThumbs?.(inv.map(t => 'furn_' + t));
    inv.forEach((t, i) => {
      const c = h('div', { class: 'card', onclick: () => this.placeFromInv(i) }, h('img', { src: G.thumbs['furn_' + t] }), h('div', {}, FURN_INFO[t].name));
      this.cardsEl.append(c);
    });
  }
  openShop() {
    const G = this.G, ui = G.ui;
    const grid = h('div', { class: 'shopgrid' });
    G.needThumbs?.(SHOP.map(t => 'furn_' + t));
    for (const t of SHOP) {
      const inf = FURN_INFO[t];
      const owned = this.M.furniture.filter(f => f.type === t).length + this.M.inventory.filter(x => x === t).length;
      const nSpots = this.countSpots(t);
      const c = h('div', { class: 'card', onclick: () => {
        if (G.save.coins < inf.price) { ui.toast('코인이 모자라!', 'red'); G.audio.sfx('miss'); return; }
        G.addCoins(-inf.price); this.M.inventory.push(t); G.persist(); G.audio.sfx('buy');
        ui.toast(`${inf.name} 구입! 보관함에서 꺼내 놓자`, 'green'); ui.closePanel(); this.renderInv();
      } }, owned ? h('div', { class: 'tag' }, `보유 ${owned}`) : null, h('img', { src: G.thumbs['furn_' + t] }), h('div', {}, inf.name), h('div', { style: 'font-size:11px;color:#9b6cff' }, `숨을 곳 ${nSpots}`), h('div', { class: 'pr', html: ICON.coin + inf.price }));
      grid.append(c);
    }
    ui.panel({ title: '가구 상점', color: 'orange', body: [grid], close: () => {} });
  }
  countSpots(t) { this._sc = this._sc || {}; if (this._sc[t] == null) { const r = this.room.furns.find(f => f.type === t); this._sc[t] = r ? r.f.spots.length : { wardrobe: 3, bookshelf: 3, desk: 5, sofa: 3, safe: 1, table: 3, tvstand: 4, boxes: 1, trash: 1, stool: 2, lamp: 0, drawers: 4, chest: 1, plant: 2, fridge: 3, counter: 3 }[t] ?? 1; } return this._sc[t]; }
  placeFromInv(i) {
    const G = this.G, t = this.M.inventory[i], R = this.room;
    const cands = [];
    for (let j = 0; j < 5; j++) for (let ii = 0; ii < 5; ii++) for (let rot = 0; rot < 4; rot++) if (R.canPlace(t, ii, j, rot)) cands.push({ i: ii, j, rot, d: Math.abs(ii - 2) + Math.abs(j - 2) + rot * .1 });
    if (!cands.length) { G.ui.toast('자리가 없어! 가구를 보관함에 넣어봐', 'red'); return; }
    cands.sort((a, b) => a.d - b.d);
    const c = cands[0];
    const id = 'f' + Date.now().toString(36) + i;
    this.M.inventory.splice(i, 1);
    this.M.furniture.push({ type: t, i: c.i, j: c.j, rot: c.rot, id });
    const rec = R.addFurniture(t, c.i, c.j, c.rot, id);
    this.indexSpots();
    G.audio.sfx('place');
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
    const fp = this.footprint = new THREE.Mesh(geo('fp', () => new THREE.PlaneGeometry(1, 1)), new THREE.MeshBasicMaterial({ color: '#7be04f', transparent: true, opacity: .45, depthWrite: false }));
    fp.rotation.x = -Math.PI / 2; fp.position.y = .02; this.room.group.add(fp);
    this.updFootprint(rec.i, rec.j, rec.rot, true);
    G.audio.sfx('click');
  }
  updFootprint(i, j, rot, ok) {
    const [fw, fd] = this.room.footprint(this.sel.type, rot);
    const p = this.room.tileToWorld(i, j, fw, fd);
    this.footprint.position.set(p.x, .02, p.z); this.footprint.scale.set(fw - .06, fd - .06, 1);
    this.footprint.material.color.set(ok ? '#7be04f' : '#ff4f66');
  }
  rotateSel() {
    const r = this.sel; if (!r) return;
    for (let k = 1; k <= 4; k++) { const rot = (r.rot + k) % 4; if (this.room.canPlace(r.type, r.i, r.j, rot, r.id)) { this.room.moveFurniture(r, r.i, r.j, rot); this.syncRec(r); this.updFootprint(r.i, r.j, rot, true); this.G.audio.sfx('swish'); return; } }
    this.G.ui.toast('돌릴 자리가 없어!', 'red');
  }
  storeSel() {
    const r = this.sel; if (!r) return;
    for (const s of r.f.spots) if (s.item) { this.removeItem(s.item.type); }
    for (const p of r.f.parts) delete this.M.locks[p.key];
    this.room.removeFurniture(r);
    this.M.furniture = this.M.furniture.filter(f => f.id !== r.id);
    this.M.inventory.push(r.type);
    this.select(null); this.indexSpots(); this.renderInv(); this.G.persist();
    this.G.audio.sfx('pop', 2);
  }
  syncRec(r) { const f = this.M.furniture.find(x => x.id === r.id); if (f) { f.i = r.i; f.j = r.j; f.rot = r.rot; } }
  dragStart(x, y) {
    if (this.mode !== 'edit' || !this.sel) return null;
    const hit = this.pick(x, y);
    if (hit.kind !== 'furn' || hit.furn.rec !== this.sel) return null;
    const r = this.sel, R = this.room, W = this.G.world;
    const start = { i: r.i, j: r.j };
    const g0 = W.screenToGround(x, y, 0);
    let cur = { ...start, ok: true };
    return {
      move: (mx, my) => {
        const g = W.screenToGround(mx, my, 0); if (!g || !g0) return;
        const di = Math.round(g.x - g0.x), dj = Math.round(g.z - g0.z);
        const i = clamp(start.i + di, 0, 4), j = clamp(start.j + dj, 0, 4);
        if (i === cur.i && j === cur.j) return;
        const ok = R.canPlace(r.type, i, j, r.rot, r.id);
        cur = { i, j, ok };
        const [fw, fd] = R.footprint(r.type, r.rot);
        if (i + fw <= 5 && j + fd <= 5) { const p = R.tileToWorld(i, j, fw, fd); r.f.group.position.set(p.x, .15, p.z); }
        this.updFootprint(i, j, r.rot, ok);
        this.G.audio.sfx('tap');
      },
      end: () => {
        if (cur.ok && (cur.i !== start.i || cur.j !== start.j)) { R.moveFurniture(r, cur.i, cur.j, r.rot); this.syncRec(r); this.G.audio.sfx('place'); this.G.persist(); }
        else { R.moveFurniture(r, start.i, start.j, r.rot); if (!cur.ok) this.G.ui.toast('거긴 놓을 수 없어!', 'red'); }
        this.updFootprint(r.i, r.j, r.rot, true);
      },
      cancel: () => {},
    };
  }

  // ── hide
  hideHud() {
    const G = this.G, ui = G.ui;
    this.col.append(h('div', { class: 'hint' }, h('span', {}, '숨길 물건을 고르고 동그라미를 터치!')));
    const bar = h('div', { class: 'modebar' });
    this.cardsEl = h('div', { class: 'cards' });
    bar.append(this.cardsEl);
    this.lockRow = h('div', { class: 'btnrow' });
    bar.append(this.lockRow);
    this.raidBtn = ui.btn('엄마 부르기!', { color: 'pink', icon: ICON.mom, cls: 'big', onClick: dis => dis ? this.whyNotReady() : this.startRaid() });
    bar.append(this.raidBtn);
    this.col.append(bar);
    this.selTreasure = TREASURES.find(t => !this.M.hidden[t]) || 'console';
    this.renderTreasures();
    this.markers = new Map();
  }
  chainNeeded() {
    const need = [];
    for (const pk in this.M.locks) need.push(this.M.locks[pk] === 'pad' ? 'key' : 'note');
    return need;
  }
  renderTreasures() {
    const G = this.G;
    this.cardsEl.innerHTML = '';
    const list = TREASURES.concat(this.chainNeeded());
    for (const t of list) {
      const s = this.spotByKey[this.M.hidden[t]];
      const c = h('div', { class: 'card' + (this.selTreasure === t ? ' sel' : '') + (s ? ' done' : ''), onclick: () => { this.selTreasure = t; G.audio.sfx('click'); this.renderTreasures(); } },
        s ? h('div', { class: 'tag' }, '숨김') : null, h('img', { src: G.thumbs['item_' + t] }), h('div', {}, ITEMS[t].name), h('div', { style: 'font-size:11px;color:#9b6cff' }, s ? s.label : '아직 안 숨김'));
      this.cardsEl.append(c);
    }
    // lock toggle when a treasure sits in a lockable container
    this.lockRow.innerHTML = '';
    const lockables = this.room.parts.filter(p => p.lockable && p.spots.some(s => s.item && TREASURES.includes(s.item.type)));
    for (const p of lockables) {
      const on = !!this.M.locks[p.key];
      this.lockRow.append(G.ui.btn(on ? `${p.label} 잠금 해제` : `${p.label} 잠그기`, { color: on ? 'gray' : 'yellow', icon: 'lock', cls: 'sm', onClick: () => this.toggleLock(p) }));
    }
    const ready = this.readyToRaid();
    this.raidBtn.classList.toggle('disabled', !ready.ok);
    this.raidBtn.classList.toggle('pulse', ready.ok);
  }
  readyToRaid() {
    const n = TREASURES.filter(t => this.M.hidden[t]).length;
    if (!n) return { ok: false, why: '먼저 물건을 하나 숨겨!' };
    for (const c of this.chainNeeded()) if (!this.M.hidden[c]) return { ok: false, why: c === 'key' ? '열쇠도 어딘가에 숨겨야 해!' : '비밀번호 쪽지도 숨겨야 해!' };
    return { ok: true };
  }
  whyNotReady() { this.G.ui.toast(this.readyToRaid().why, 'red'); }
  toggleLock(p) {
    const G = this.G;
    if (this.M.locks[p.key]) {
      delete this.M.locks[p.key];
      if (p.lockMesh) { p.lockMesh.parent?.remove(p.lockMesh); p.lockMesh = null; } p.lock = null;
      const c = p.furn.type === 'safe' ? 'note' : 'key';
      if (!this.chainNeeded().includes(c)) this.removeItem(c);
    } else {
      const kind = p.furn.type === 'safe' ? 'code' : 'pad';
      this.M.locks[p.key] = kind; this.M.code = this.M.code || String(100 + Math.floor(Math.random() * 900));
      p.furn.setLock(p, kind, this.M.code);
      G.audio.sfx('unlock');
      this.selTreasure = kind === 'pad' ? 'key' : 'note';
      G.ui.toast(kind === 'pad' ? '잠갔다! 이제 열쇠를 다른 곳에 숨겨' : '잠갔다! 비밀번호 쪽지를 다른 곳에 숨겨', 'green');
    }
    G.persist(); this.renderTreasures();
  }
  async placeTreasure(spot) {
    const G = this.G, t = this.selTreasure;
    if (!t) return;
    const def = ITEMS[t];
    if (def.h * (spot.scale || 1) > spot.maxH + .001 || (spot.maxH < .1 && !def.flat)) { G.ui.toast('여긴 너무 좁아! 납작한 것만 들어가', 'red'); G.audio.sfx('miss'); return; }
    if ((t === 'key' || t === 'note') && spot.part && this.M.locks[spot.part.key]) { G.ui.toast('잠근 곳 안에 열쇠를 넣으면 안 돼!', 'red'); return; }
    if (spot.item && spot.item.type !== t) this.removeItem(spot.item.type);
    if (this.items[t]) this.removeItem(t);
    const it = this.putItem(t, spot);
    this.M.hidden[t] = spot.key;
    G.persist();
    G.audio.sfx('place');
    const s = G.world.toScreen(this.room.spotWorld(spot));
    G.world.fx.burst(s.x, s.y, { n: 10, shape: 'heart', colors: ['#ff6fa6', '#ffb3d1', '#ffffff'], speed: 140 });
    G.ui.floatText(s.x, s.y - 30, spot.label, '');
    if (spot.part) {
      await this.openPart(spot.part, true);
      await this.tw.wait(.35);
      await this.openPart(spot.part, false);
    }
    const nextT = TREASURES.concat(this.chainNeeded()).find(x => !this.M.hidden[x]);
    if (nextT) this.selTreasure = nextT;
    this.renderTreasures();
  }
  async openPart(part, open) {
    const W = this.G.world;
    if (part.busy) return;
    part.busy = true;
    if (open) { part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = true; }); this.G.audio.sfxPart(part, part.sfx); }
    else this.G.audio.sfxPart(part, part.kind === 'drawer' ? 'drawerClose' : 'close');
    const a = part.t, b = open ? 1 : 0;
    await this.tw.run(part.dur, k => { part.setOpen(a + (b - a) * k); W.shadowDirty = true; }, open ? ease.outBack : ease.inOutQuad);
    if (!open) part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; });
    part.busy = false;
  }
  // One marker per hiding place: a whole container (drawer, wardrobe, pillow…) or a single tucked-away spot.
  hidePlaces() {
    const places = [];
    const seen = new Set();
    for (const s of this.room.spots) {
      if (s.furn.wall && this.room.walls[s.furn.rec.wall]?.down) continue;
      if (s.part) { if (seen.has(s.part)) continue; seen.add(s.part); places.push({ key: s.part, spots: s.part.spots, inside: true, pos: () => this.partCenter(s.part) }); }
      else places.push({ key: s, spots: [s], inside: false, pos: () => this.room.spotWorld(s).add(V.set(0, .12, 0)) });
    }
    return places;
  }
  partCenter(part) { const b = new THREE.Box3(); part.pivots.forEach(p => b.expandByObject(p)); return b.getCenter(new THREE.Vector3()); }
  placeIn(place) {
    const t = this.selTreasure; if (!t) return;
    const def = ITEMS[t];
    const ok = s => def.h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || def.flat);
    const s = place.spots.find(x => x.item?.type === t) || place.spots.find(x => !x.item && ok(x)) || place.spots.find(x => ok(x) && x.item && !TREASURES.includes(x.item.type)) || place.spots.find(ok) || place.spots[0];
    this.placeTreasure(s);
  }
  updMarkers() {
    const W = this.G.world;
    const want = new Set();
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
    const G = this.G;
    const hit = this.pick(x, y);
    if (this.mode === 'raid') return;
    if (hit.kind === 'char') { hit.char.bump(.4); G.audio.laugh(hit.char.kind); return; }
    if (this.mode === 'edit') {
      if (hit.kind === 'furn' && !hit.furn.wall) this.select(hit.furn.rec);
      else this.select(null);
      return;
    }
    if (hit.kind === 'part' && !hit.part.lock) this.openPart(hit.part, hit.part.t < .5);
    else if (hit.kind === 'part' && hit.part.lock) { G.audio.sfx('locked'); }
  }

  // ── Mom raid
  async startRaid() {
    const G = this.G, W = G.world, ui = G.ui, R = this.room;
    if (!this.readyToRaid().ok) return this.whyNotReady();
    this.setMode('raid');
    this.closeAll();
    G.audio.music('tense');
    const hidden = TREASURES.filter(t => this.M.hidden[t]);
    // search units: openable parts + tucked-away spots. Things in plain sight are seen at once.
    const units = [];
    for (const p of R.parts) units.push({ kind: 'part', part: p, furn: p.furn, label: p.label, spots: p.spots });
    for (const s of R.spots) if (s.kind === 'under' || s.kind === 'behind') units.push({ kind: 'look', spot: s, furn: s.furn, label: s.label, spots: [s] });
    const mem = this.M.memory;
    const unitKey = u => u.kind === 'part' ? u.part.key : u.spot.key;
    for (const u of units) {
      const ft = u.furn.type;
      let aff = 1; for (const t of hidden) aff = Math.max(aff, AFF[t]?.[ft] || 1);
      u.score = (BASE[ft] ?? .4) * aff + (mem[unitKey(u)] || 0) * .7;
    }
    const AP = clamp(Math.round(units.length * .42), 4, 12);
    this.ap = AP;
    const apRow = h('div', { class: 'ap' }, ...Array.from({ length: AP }, () => h('i')));
    const speed = ui.btn('x2', { color: 'purple', cls: 'sm', onClick: () => { G.timeScaleUser = G.timeScaleUser === 2 ? 1 : 2; speed.querySelector('.lbl').textContent = G.timeScaleUser === 2 ? 'x1' : 'x2'; } });
    speed.style.cssText += 'position:absolute;right:12px;top:calc(12px + var(--safeT))';
    this.col.append(h('div', { class: 'raidhud' }, apRow), speed, h('div', { class: 'hint', style: 'top:calc(120px + var(--safeT))' }, h('span', {}, '엄마가 방을 뒤지는 중… 두근두근')));
    // Mom enters
    const mom = this.mom = new Char('mom');
    const door = R.doorDecor;
    const doorPos = new THREE.Vector3(); door.f.group.getWorldPosition(doorPos);
    const inward = R.walls[door.wall].n;
    mom.root.position.copy(doorPos).addScaledVector(inward, -.4); mom.root.position.y = 0;
    mom.faceTo(0, 0); mom.setFace('normal');
    R.group.add(mom.root);
    this.mong.setFace('sweat');
    G.audio.sfx('door');
    await this.tw.run(.4, k => door.f.doorPart.setOpen(k), ease.outCubic);
    await mom.hopTo(this.tw, doorPos.x + inward.x * 1.0, doorPos.z + inward.z * 1.0, { sfx: n => G.audio.sfx(n) });
    this.say(mom, '몽글아~ 엄마 방 검사한다!', 1500); G.audio.sfx('hmm');
    await this.wait(1.5);
    this.say(mom, TR_LINE[hidden[0]], 1400, 'think');
    await this.wait(1.4);
    // anything left in plain sight?
    const log = [];
    const caught = new Set();
    for (const t of hidden) {
      const s = this.items[t].spot;
      if (s.kind === 'on') {
        await this.momGo(mom, s.furn); this.say(mom, '어머! 이게 뭐니?', 1200);
        await this.catchItem(mom, t); caught.add(t); log.push({ label: s.label, hit: true });
      }
    }
    // search loop
    const r = rng(Date.now() & 0xffff);
    let ap = AP, forced = null, keyFound = false, codeFound = false;
    const remaining = units.slice();
    const lockedTried = new Set();
    while (ap > 0 && caught.size < hidden.length && remaining.length && !this.dead) {
      let u = forced; forced = null;
      if (!u) {
        const here = mom.root.position;
        const w = remaining.map(x => { const d = R.frontOf(x.furn.rec ? x.furn : x.furn).distanceTo(here); return Math.exp((x.score - d * .07) / .32) * (.7 + r() * .6); });
        let sum = w.reduce((a, b) => a + b, 0), pickV = r() * sum, idx = 0;
        for (; idx < w.length - 1; idx++) { pickV -= w[idx]; if (pickV <= 0) break; }
        u = remaining[idx];
      }
      remaining.splice(remaining.indexOf(u), 1);
      await this.momGo(mom, u.furn);
      ap--; apRow.children[AP - 1 - ap]?.classList.add('off'); G.audio.sfx('pop', 1);
      const hasTreasure = u.spots.some(s => s.item && TREASURES.includes(s.item.type) && !caught.has(s.item.type));
      mom.pose = 'search';
      if (u.kind === 'part' && u.part.lock) {
        const L = u.part.lock;
        const can = (L === 'pad' || L.kind === 'pad') ? keyFound : codeFound;
        if (!can) {
          this.say(mom, '잠겼네? 열쇠가 어딨지…', 1300); G.audio.sfx('locked');
          lockedTried.add(u);
          log.push({ label: u.label + '(잠김)', hit: false });
          await this.wait(1.2); mom.pose = 'idle';
          continue;
        }
        G.audio.sfx('unlock'); if (u.part.lockMesh) { u.part.lockMesh.parent?.remove(u.part.lockMesh); u.part.lockMesh = null; }
      }
      if (hasTreasure) { this.mong.setFace('wow'); G.audio.sfx('heart'); await this.wait(.45); G.audio.sfx('heart'); }
      else if (u.score > 1.1 && r() < .5) { G.audio.sfx('heart'); }
      if (u.kind === 'part') await this.openPart(u.part, true);
      else { mom.bump(.35); mom.lean = .25; G.ui.floatText(...this.scr(u.spot), '🔍', ''); }
      this.say(mom, '흠…', 700); G.audio.sfx('hmm');
      await this.wait(.75);
      let hit = false;
      for (const s of u.spots) {
        const it = s.item; if (!it) continue;
        if (TREASURES.includes(it.type) && !caught.has(it.type)) { await this.catchItem(mom, it.type); caught.add(it.type); hit = true; }
        else if (it.type === 'key' || it.type === 'note') {
          if (it.type === 'key') keyFound = true; else codeFound = true;
          this.say(mom, it.type === 'key' ? '열쇠다! 어디가 잠겨 있었지?' : '비밀번호 쪽지네?', 1300); G.audio.sfx('special');
          await this.wait(1.0);
          const lk = [...lockedTried].find(x => x.part.lock && ((x.part.lock.kind || x.part.lock) === (it.type === 'key' ? 'pad' : 'code')))
            || remaining.find(x => x.kind === 'part' && x.part.lock && ((x.part.lock.kind || x.part.lock) === (it.type === 'key' ? 'pad' : 'code')));
          if (lk) { forced = lk; if (!remaining.includes(lk)) remaining.push(lk); }
        }
      }
      log.push({ label: u.label, hit });
      mom.lean = 0; mom.pose = 'idle';
      if (!hit) { this.say(mom, '없네…', 650); }
      if (u.kind === 'part') await this.openPart(u.part, false);
      if (!hit) this.mong.setFace(caught.size ? 'sweat' : 'sweat');
      await this.wait(.25);
    }
    // outcome
    const safe = hidden.filter(t => !caught.has(t));
    const win = safe.length > 0;
    this.M.raids++; if (!caught.size) this.M.wins++;
    // Mom learns: where she found things gets more suspicious; old memories fade
    for (const k in mem) mem[k] *= .6;
    for (const t of hidden) { const s = this.items[t]?.spot; if (!s) continue; const u = units.find(x => x.spots.includes(s)); if (u) mem[unitKey(u)] = (mem[unitKey(u)] || 0) + (caught.has(t) ? 1 : .45); }
    const coins = safe.length * 50 + (safe.length === hidden.length ? 30 : 0) + Object.keys(this.M.locks).length * (safe.length ? 20 : 0);
    if (!caught.size) { mom.setFace('sus'); this.say(mom, '흠… 오늘은 깨끗하네?', 1500); this.mong.setFace('happy'); this.mong.pose = 'cheer'; G.audio.sfx('phew'); W.fx.confetti(90); }
    else { mom.setFace('angry'); this.say(mom, safe.length ? '이건 압수! 근데 또 있는 거 아냐?' : '전부 압수야!', 1600); this.mong.setFace('dizzy'); G.audio.sfx('angry'); }
    for (const t of caught) this.removeItem(t);
    G.addCoins(coins, false);
    G.persist();
    await this.wait(1.8);
    if (this.dead) return;
    mom.hopTo(this.tw, doorPos.x + inward.x * .2, doorPos.z + inward.z * .2, { sfx: n => G.audio.sfx(n) });
    this.resultPanel(hidden, caught, coins, log, units, unitKey);
  }
  resultPanel(hidden, caught, coins, log, units, unitKey) {
    const G = this.G, ui = G.ui;
    this.raidDone = true; this.tw.to(G.world, { zoom: 1 }, .6);
    G.timeScaleUser = 1;
    const allSafe = caught.size === 0, allCaught = caught.size === hidden.length;
    const cv = h('span', {}, '0');
    const mem = this.M.memory;
    const top = Object.entries(mem).sort((a, b) => b[1] - a[1])[0];
    const topU = top && units.find(u => unitKey(u) === top[0]);
    ui.panel({
      title: allSafe ? '방어 성공!' : allCaught ? '다 들켰다…' : '절반 성공!', color: allSafe ? 'green' : allCaught ? 'red' : 'orange',
      body: [
        h('div', { class: 'trs' }, ...hidden.map(t => h('div', { class: 'tr ' + (caught.has(t) ? 'caught' : 'safe') }, h('img', { src: G.thumbs['item_' + t] }), h('div', { class: 'st2' }, caught.has(t) ? '압수!' : '지켰다!')))),
        h('div', { class: 'reward', html: ICON.coin }, cv),
        h('div', { class: 'log' }, ...log.map(l => h('span', { class: l.hit ? 'hit' : '' }, l.label))),
        topU ? h('div', { class: 'txt', style: 'font-size:15px' }, `엄마의 촉: 다음엔 '${topU.label}'부터 의심할걸?`) : null,
      ],
      buttons: [ui.btn('홈', { color: 'blue', icon: 'home', cls: 'sm', onClick: () => G.go('home') }), ui.btn('꾸미기', { color: 'orange', cls: 'sm', onClick: () => G.go('myroom', { mode: 'edit' }) }), this.againBtn = ui.btn('다시 숨기기', { color: 'green', cls: 'big', onClick: () => { G.stats.rehide++; G.go('myroom', { mode: 'hide' }); } })],
    });
    G.stats.raids++;
    ui.countUp(cv, 0, coins, 700, v => { if (v % 10 === 0) G.audio.sfx('coin'); });
  }
  closeAll() { for (const p of this.room.parts) if (p.t > 0) { p.setOpen(0); p.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; }); } this.G.world.shadowDirty = true; }
  async momGo(mom, furn) {
    const W = this.G.world;
    if (furn.wall && this.room.walls[furn.rec.wall]?.down) {
      const n = this.room.walls[furn.rec.wall].n;
      const base = Math.atan2(n.x, n.z);
      const cands = [base + Math.PI / 4, base - Math.PI / 4];
      const d = y => Math.abs(Math.atan2(Math.sin(y - W.yaw), Math.cos(y - W.yaw)));
      W.flyTo(this.tw, { yaw: d(cands[0]) < d(cands[1]) ? cands[0] : cands[1], dur: .7 });
    }
    const p = this.room.frontOf(furn);
    await mom.walkTo(this.tw, p.x, p.z, { sfx: n => this.G.audio.sfx(n, 2) });
    const t = new THREE.Vector3(); furn.group.getWorldPosition(t);
    mom.faceTo(t.x, t.z);
  }
  async catchItem(mom, type) {
    const G = this.G, W = G.world, it = this.items[type]; if (!it) return;
    it.g.visible = true;
    G.hitstop(.12); G.audio.sfx('gasp');
    const wp = new THREE.Vector3(); it.g.getWorldPosition(wp);
    const s = W.toScreen(wp);
    W.fx.burst(s.x, s.y, { n: 20, colors: ['#ff4f66', '#ffffff', '#ffd23f'], speed: 320 });
    mom.setFace('angry'); this.say(mom, '찾았다!!', 1100);
    this.mong.setFace('wow');
    G.ui.floatText(s.x, s.y - 40, '들켰다!', 'red big');
    const g = it.g, s0 = g.scale.x;
    await this.tw.run(.3, k => { g.position.y = k * .6; g.scale.setScalar(s0 * (1 + k * .5)); }, ease.outBack);
    await this.wait(.6);
    g.visible = false; mom.setFace('normal');
  }
  scr(spot) { const p = this.G.world.toScreen(this.room.spotWorld(spot)); return [p.x, p.y - 20]; }
  wait(s) { return this.tw.wait(s); }
  say(ch, text, ms = 1200, cls = '') {
    const b = h('div', { class: 'bubble pop ' + cls }, text);
    this.G.ui.wui.append(b);
    const upd = () => { const p = this.G.world.toScreen(V.copy(ch.root.position).setY(ch.root.position.y + ch.S * 1.15 + .25)); b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; };
    upd(); const iv = setInterval(upd, 30);
    setTimeout(() => { clearInterval(iv); b.remove(); }, ms / (this.G.timeScaleUser || 1));
  }
  update(dt) {
    this.tw.update(dt);
    this.room.update(dt);
    this.mong.update(dt);
    this.mom?.update(dt);
    if (this.mode === 'raid' && this.mom && !this.raidDone) {
      const W = this.G.world, p = this.mom.root.position;
      W.target.lerp(V.set(p.x * .45, .75, p.z * .45), 1 - Math.exp(-dt * 2.5));
      W.zoom += (1.2 - W.zoom) * (1 - Math.exp(-dt * 2));
    }
    if (this.mode === 'hide' && this.markers) this.updMarkers();
    if (this.ftool && this.sel) {
      const g = this.sel.f.group, b = new THREE.Box3().setFromObject(g);
      const p = this.G.world.toScreen(new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y + .1, (b.min.z + b.max.z) / 2));
      this.ftool.style.left = p.x + 'px'; this.ftool.style.top = p.y + 'px';
    }
  }
  botStep(dt) {
    this._bt = (this._bt || 0) + dt; if (this._bt < 1) return; this._bt = 0;
    if (this.mode === 'hide') {
      const t = TREASURES.find(x => !this.M.hidden[x]);
      if (t) { this.selTreasure = t; const free = this.room.spots.filter(s => !s.item && ITEMS[t].h <= s.maxH && (s.maxH >= .1 || ITEMS[t].flat)); this.placeTreasure(free[Math.floor(Math.random() * free.length)]); }
      else this.startRaid();
    } else if (this.mode === 'view') this.setMode('hide');
    else if (this.mode === 'raid' && this.G.ui.panelOpen && this.againBtn) this.againBtn.press();
  }
  state() { return { scene: 'myroom', mode: this.mode, hidden: Object.keys(this.M.hidden).length, raids: this.M.raids }; }
}

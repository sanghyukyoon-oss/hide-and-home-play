// 몽글 호텔 — a 숨바꼭집 boss: 친구들과 X박 X일 여행, 방 배정은 지배인 몽글이 담당. The same dollhouse cut-away as 몽글 빌라
// (games/villa), dressed as a hotel: a lobby with a reception desk and a bell at the bottom, numbered rooms above.
// One boss = one trip (1박 2일 / 2박 3일 / 3박 4일). Every NIGHT is a round:
//   check-in (new guests wait in the lobby with their suitcases; staying guests are still in their rooms)
//   → drag guests into rooms (or tap a guest, then a room). Placing a guest from the lobby is free; moving anyone who
//     already has a room costs one of tonight's 방 바꾸기 → "불 끄기" → the night plays out (music, 쿵쿵, 쾅쾅, 멍멍, 하트…)
//   → morning: one funny line about last night and each guest's stars (꿀잠 ★★★ / 뒤척 ★).
// Between nights: check-outs, check-ins and an event card that changes tonight's rules (싸움, 생일 파티룸, 감기, 공사).
// Trip end: everyone gathers in the lobby for a real group photo; win if the trip's stars reach 85 %, else 최악의 여행.
// Guests (one quirk each, same as the villa): 둠칫이 music → rooms beside/above/below · 졸졸이 hates noise · 판다 쿵쿵 → the
// room below · 멍뭉이 vs a cat next door · 냥냥이 wants the top floor · 토순이·곰돌이 단짝 (next door).
import * as THREE from 'three';
import { MapRooms } from '../map.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { makeFurniture } from '../gfx/furniture.js';
import { ICON } from '../ui.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree, rbox, sph, cyl, put, mat, fadeDisc } from '../gfx/kit.js';

const Fu = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const De = (type, wall, u, opts) => ({ type, wall, u, opts });

const C = 2, RW = 3, RD = 3, WALL_H = 2.2, FH = WALL_H + .5;   // guest rooms: 3×3 tiles, two per floor
const LOBBY_H = 1.9, LFH = LOBBY_H + .5;                        // the lobby is a little lower
const CS = 1.65, STAND = [.15, .5], DRAG_Z = RD / 2 + .9, LIFT_PX = 26, PITCH = .26;
const EVENING = { ambColor: '#dccfff', amb: 1.3, sunColor: '#ffdcb8', sun: 1.8 };
const NIGHT = { ambColor: '#7f86d4', amb: 1.0, sunColor: '#c9d2ff', sun: .85 };
const MORNING = { ambColor: '#fff3e2', amb: 1.55, sunColor: '#fff6e6', sun: 2.35 };
const CATS = new Set(['cat']);
const BAR = .85;   // the trip's stars needed to call it a good trip
const V = new THREE.Vector3();
const rnd = (a, b) => a + Math.random() * (b - a);
const OUT = -2;   // pos of a guest who isn't staying tonight (-1 = waiting in the lobby, 0… = a room)

const TAG = {
  note: '<svg viewBox="0 0 20 20"><path d="M8 15.5V5l8-2v9.5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linejoin="round"/><ellipse cx="5.6" cy="15.6" rx="2.9" ry="2.3" fill="#fff"/><ellipse cx="13.6" cy="13" rx="2.9" ry="2.3" fill="#fff"/></svg>',
  up: '<svg viewBox="0 0 20 20"><path d="M10 16V5M5 9.5L10 4.5l5 5" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  heart: '<svg viewBox="0 0 20 20"><path d="M10 16.5C4 12.5 2.5 9.5 3.6 7 4.8 4.4 8.3 4.3 10 7c1.7-2.7 5.2-2.6 6.4 0 1.1 2.5-.4 5.5-6.4 9.5z" fill="#fff"/></svg>',
  moon: '<svg viewBox="0 0 20 20"><path d="M13.5 15.5A6.5 6.5 0 0 1 8.2 3.6a6.5 6.5 0 1 0 7.9 9.9 6.4 6.4 0 0 1-2.6 2z" fill="#fff"/></svg>',
};
const GUESTS = {
  dj: { kind: 'dj', name: '둠칫이', tag: TAG.note, color: '#9b7bff', line: '음악 소리가 옆·위·아래 방까지 쿵짝', bag: '#9b7bff' },
  sleepy: { kind: 'sleepy', name: '졸졸이', tag: 'Zz', color: '#6f9bff', line: '잠꾸러기 · 시끄러우면 깨서 화내요', bag: '#7fa8ff' },
  cat: { kind: 'cat', name: '냥냥이', tag: TAG.up, color: '#ffad3b', line: '높은 곳 좋아 · 꼭대기 층에 묵을래요', bag: '#ffb347' },
  panda: { kind: 'panda', name: '판다', tag: '쿵', color: '#7d7a8c', line: '발소리 쿵쿵 · 바로 아랫방이 괴로워요', bag: '#55606e' },
  shiba: { kind: 'shiba', name: '멍뭉이', tag: '멍', color: '#ff7a4d', line: '옆방에 고양이가 오면 서로 싸워요', bag: '#ff8a5c' },
  bunny: { kind: 'bunny', name: '토순이', tag: TAG.heart, color: '#ff6f9c', line: '곰돌이랑 단짝 · 바로 옆방이 좋아요', pal: 'bear', bag: '#ff9fc0' },
  bear: { kind: 'bear', name: '곰돌이', tag: TAG.heart, color: '#ff6f9c', line: '토순이랑 단짝 · 바로 옆방이 좋아요', pal: 'bunny', bag: '#c98a52' },
};
// three trips. F guest floors; per night: who checks out / in, tonight's event, 방 바꾸기 (moves) for the night.
// Rooms: index f*2+c, floor 0 = 1층 객실 (101·102) … top = 301·302. ev: fight (토순이·곰돌이 apart), bday (둠칫이 must
// be in that room), cold (졸졸이 wants no one around at all), closed (rooms under repair).
const TRIPS = [
  { name: '1박 2일', sub: '첫 여행! 친구들 방을 정해 줘', F: 2, nights: [
    { in: ['dj', 'sleepy', 'cat', 'panda'], budget: 2 }] },
  { name: '2박 3일', sub: '단짝 토순이·곰돌이도 함께', F: 3, nights: [
    { in: ['dj', 'sleepy', 'cat', 'bunny', 'bear'], budget: 2 },
    { out: ['dj'], in: ['panda'], ev: { fight: true, closed: [3] }, budget: 2 }] },
  { name: '3박 4일', sub: '긴 여행, 별일이 다 생겨요', F: 3, nights: [
    { in: ['dj', 'sleepy', 'cat', 'shiba', 'panda'], budget: 2 },
    { out: ['shiba'], in: ['bunny', 'bear'], ev: { bday: 5 }, budget: 3 },
    { out: ['bunny', 'bear', 'panda'], in: ['shiba'], ev: { cold: true }, budget: 3 }] },
];
const NIGHT_NAME = ['첫째 밤', '둘째 밤', '셋째 밤', '넷째 밤'];
const roomNo = idx => (Math.floor(idx / C) + 1) * 100 + (idx % C) + 1;

// room styles (furniture at the back so the guest, front and centre, is never hidden)
const ROOMS = [
  { th: 'bunny', furn: [Fu('bed', 0, 0), Fu('drawers', 2, 0), Fu('plant', 2, 2)], decor: [] },
  { th: 'bear', furn: [Fu('lamp', 0, 0), Fu('sofa2', 1, 0), Fu('rug', 1, 1)], decor: [] },
  { th: 'peng', furn: [Fu('bookshelf', 0, 0, 0, { seed: 7 }), Fu('bed', 2, 0)], decor: [] },
  { th: 'cat', furn: [Fu('bed', 0, 0), Fu('recordcab', 2, 0), Fu('catbed', 2, 2)], decor: [] },
  { th: 'my', furn: [Fu('wardrobe', 0, 0), Fu('bed', 2, 0), Fu('lamp', 1, 0)], decor: [] },
  { th: 'apt', furn: [Fu('bed', 0, 0), Fu('minifridge', 2, 0), Fu('zabuton', 2, 2)], decor: [] },
];

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.fxs = []; this.anch = []; this.bubbles = new Map(); this.decor = []; }

  // ── setup
  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world, ui = L.ui;
    this.lvIdx = clamp(lv | 0, 0, TRIPS.length - 1); const TR = this.trip = TRIPS[this.lvIdx];
    this.Fn = TR.F; this.nR = TR.F * C;
    this.seen = new Set(TRIPS.slice(0, this.lvIdx).flatMap(t => t.nights.flatMap(n => n.in || [])));
    this.guests = []; this.pos = []; this.n = -1; this.ev = {}; this.phase = 'intro';
    this.stars = 0; this.maxStars = 0; this.nightLog = []; this.result = null; this.sel = null; this.drag = null; this.evalT = 0; this.beatT = 0; this.beat = 0;
    this.app = document.getElementById('app'); this.app.classList.add('ht');
    await this.ensureCss();
    if (this.dead) return;
    W.setLight(EVENING);
    this.tex = {
      glow: fadeDisc(128, '#ffffff', r => 1 - r * .76, { cx: .5, cy: .34 }),
      frame: canvasTexture(256, 200, (x, w, h) => { x.beginPath(); x.roundRect(9, 9, w - 18, h - 18, 26); x.fillStyle = 'rgba(255,255,255,.2)'; x.fill(); x.lineWidth = 11; x.strokeStyle = '#ffffff'; x.stroke(); }),
      tape: canvasTexture(256, 32, (x, w, h) => { x.fillStyle = '#ffd23f'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2433'; for (let i = -2; i < 18; i++) { x.beginPath(); x.moveTo(i * 16, h); x.lineTo(i * 16 + 8, h); x.lineTo(i * 16 + 20, 0); x.lineTo(i * 16 + 12, 0); x.fill(); } }),
    };
    this.buildHotel();
    this.buildHud();
    this.frame(); this._rs = () => this.frame(); addEventListener('resize', this._rs);
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    this.plan = this.planTrip();
    if (!this.plan) console.warn('hotel: trip', this.lvIdx + 1, 'has no full plan');
    await ui.banner(`몽글 호텔 · ${TR.name}`, TR.sub, 1250);
    if (this.dead) return;
    this.started = true;
    this.startNight(0);
  }
  // the stylesheet comes with the game (the hub swaps games in one page; exit() takes it away again)
  ensureCss() {
    const href = new URL('./hotel.css', import.meta.url).href;
    if ([...document.styleSheets].some(s => s.href === href)) return Promise.resolve();
    const l = this.cssLink = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.append(l);
    return new Promise(res => { l.onload = l.onerror = res; setTimeout(res, 2000); });
  }
  colX(c) { return (c - (C - 1) / 2) * RW; }
  rf(idx) { return Math.floor(idx / C); }
  rc(idx) { return idx % C; }
  floorY(f) { return LFH + f * FH; }
  standPos(idx, out = new THREE.Vector3()) { return out.set(this.colX(this.rc(idx)) + STAND[0], this.floorY(this.rf(idx)), STAND[1]); }
  roomMid(idx, y = 1.0) { return new THREE.Vector3(this.colX(this.rc(idx)), this.floorY(this.rf(idx)) + y, 0); }
  lobbySlot(k, out = new THREE.Vector3()) { return out.set(-1.0 + k * .9, 0, .9); }

  buildHotel() {
    const W = this.L.world, g = this.hotel = new THREE.Group(); W.root.add(g);
    const VB = '#e3c4a6', w = C * RW;
    // the lobby: reception desk with a bell, 몽글이 behind it, a sofa, a big plant, the way in on the left
    const lobT = { ...THEMES.lobby, base: VB };
    const lobby = this.lobby = new MapRooms(W, { theme: lobT, bleed: false, rooms: [{ at: [0, 0], level: 0, layout: { w, d: RD, theme: lobT, wallH: LOBBY_H, tidy: true,
      walls: { N: 'wall', S: 'none', W: 'door', E: 'wall' }, doorAt: { W: .2 },
      furniture: [Fu('reception', 0, 1), Fu('plantbig', 0, 0), Fu('lobbysofa', 4, 0), Fu('rug', 2, 1)], decor: [] } }] });
    g.add(lobby.group);
    // 몽글이, the manager, behind the desk; the bell on the counter
    const rec = lobby.furns.find(r => r.type === 'reception'); lobby.group.updateMatrixWorld(true);
    const rb = new THREE.Box3().setFromObject(rec.f.group, true), deskX = (rb.min.x + rb.max.x) / 2;
    const mong = this.mong = new Char('mong'); mong.root.scale.setScalar(CS); mong.root.position.set(-2.25, 0, .95); W.root.add(mong.root);
    const bell = this.bell = new THREE.Group();
    bell.add(put(cyl(.13, .15, .035, '#c98f58'), 0, .018, 0), put(sph(.11, '#ffd23f', { rough: .3 }, 18, 12), 0, .05, 0, 0, 0, 0, [1, .8, 1]), put(sph(.03, '#ffe98a'), 0, .14, 0));
    bell.position.set(deskX + .45, rb.max.y, (rb.min.z + rb.max.z) / 2 + .05); g.add(bell);
    // a "front desk" light on the lobby's back wall
    this.floors = []; this.rooms = [];
    for (let f = 0; f < this.Fn; f++) {
      const defs = [];
      for (let c = 0; c < C; c++) {
        const idx = f * C + c, R = ROOMS[(idx * 5 + this.lvIdx * 2) % ROOMS.length];
        const theme = { ...THEMES[R.th], base: VB };
        defs.push({ at: [this.colX(c), 0], level: 0, layout: { w: RW, d: RD, theme, wallH: WALL_H, tidy: true,
          walls: { N: 'wall', S: 'none', W: c === 0 ? 'wall' : 'none', E: 'wall' }, furniture: R.furn, decor: [De('door', 'N', c === 0 ? .55 : -.55)] } });
      }
      const map = new MapRooms(W, { theme: defs[0].layout.theme, bleed: false, rooms: defs });
      map.group.position.y = this.floorY(f); g.add(map.group); this.floors.push(map);
      map.rooms.forEach((room, c) => {
        const idx = f * C + c, x = this.colX(c), y0 = this.floorY(f);
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(RW - .3, WALL_H - .05), new THREE.MeshBasicMaterial({ map: this.tex.glow, color: '#ffc46b', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        glow.position.set(x, y0 + WALL_H / 2, -RD / 2 + .12); glow.renderOrder = 3; g.add(glow);
        const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 36), new THREE.MeshBasicMaterial({ map: this.tex.glow, color: '#ffb35c', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        pool.rotation.x = -Math.PI / 2; pool.scale.set(1.25, .8, 1); pool.position.set(x + STAND[0], y0 + .03, STAND[1] - .1); pool.renderOrder = 3; g.add(pool);
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(RW - .1, WALL_H + .35), new THREE.MeshBasicMaterial({ map: this.tex.frame, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
        frame.position.set(x, y0 + WALL_H / 2 - .1, RD / 2 + .08); frame.renderOrder = 6; g.add(frame);
        const plate = this.L.h('div', { class: 'ht-plate' }, String(roomNo(idx))); this.L.ui.wui.append(plate);
        this.rooms.push({ room, f, c, idx, base: room.group.position.clone(), shake: 0, glow, pool, glowK: 0, glowGoal: 0, glowColor: '#ffc46b', frame, frameK: 0, frameGoal: 0, frameColor: '#ffffff', plate });
      });
    }
    // the lobby's own drop frame (a guest carried back down)
    this.lobbyFrame = new THREE.Mesh(new THREE.PlaneGeometry(w - .1, LOBBY_H + .3), new THREE.MeshBasicMaterial({ map: this.tex.frame, color: '#fff3b0', transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
    this.lobbyFrame.position.set(0, LOBBY_H / 2, RD / 2 + .08); this.lobbyFrame.renderOrder = 6; g.add(this.lobbyFrame); this.lobbyK = 0; this.lobbyGoal = 0;
    // the roof: a slab and a little parapet, the sign above it
    const top = this.floorY(this.Fn) - .5;
    g.add(put(rbox(w + .7, .3, RD + .7, '#d9b38f', .1), 0, top + .15, 0), put(rbox(w + .9, .14, RD + .9, '#f08a7a', .06), 0, top + .36, 0));
    this.bulbs = [];
    for (let k = 0; k < 11; k++) { const b = put(sph(.07, ['#ffd23f', '#ff8fb8', '#8fd3ff', '#9be38f'][k % 4], { emissive: '#ffffff', ei: .25 }, 10, 8), -w / 2 + .1 + k * (w - .2) / 10, top + .02 - Math.sin(k / 10 * Math.PI) * .12, RD / 2 + .42); g.add(b); this.bulbs.push(b); }
    g.updateMatrixWorld(true);
  }
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col();
    const top = this.topEl = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), this.titleEl = h('div', { class: 'lab-title ol' }, '몽글 호텔', this.subEl = h('small', {}, this.trip.name)));
    this.movesEl = h('div', { class: 'ht-pill ht-moves' }, h('span', { class: 'ico', html: ICON.box }), '방 바꾸기', this.movesN = h('b', {}, '0'));
    this.starEl = h('div', { class: 'ht-pill ht-trip' }, h('span', { class: 'ico', html: ICON.star }), this.starN = h('b', {}, '0'));
    top.append(h('div', { class: 'ht-topr' }, this.movesEl, this.starEl));
    col.append(top);
    this.notes = h('div', { class: 'ht-notes' }); col.append(this.notes);
    this.info = h('div', { class: 'ht-info' }, '');
    this.btn = ui.btn('불 끄기', { color: 'blue', cls: 'big', onClick: () => this.mainBtn() });
    this.btn.classList.add('ht-btn');
    this.bottom = h('div', { class: 'ht-bottom' }, this.info, this.btn);
    this.bottom.addEventListener('pointerdown', e => { e.stopPropagation(); if (this.sel != null && this.pos[this.sel] >= 0 && this.canAct()) { const s = this.sel; this.select(null); this.dropGuest(s, -1); } });
    col.append(this.bottom);
    this.sign = h('div', { class: 'ht-sign' }, '몽글 호텔'); ui.wui.append(this.sign);
    this.btn.style.visibility = 'hidden';
  }
  // near-frontal dollhouse view: the whole hotel between the top bar and the bottom bar
  frame() {
    const W = this.L.world, cp = Math.cos(PITCH), sp = Math.sin(PITCH);
    const top = this.floorY(this.Fn) + .25, bot = -.55, zb = RD / 2 + .32, zt = -RD / 2;
    const vTop = top * cp - zt * sp, vBot = bot * cp - zb * sp, vExt = vTop - vBot, vMid = (vTop + vBot) / 2;
    const H = W.H || innerHeight, a = (W.W || innerWidth) / H;
    const maxNotes = Math.max(0, ...this.trip.nights.map(nt => (nt.ev?.fight ? 1 : 0) + (nt.ev?.bday != null ? 1 : 0) + (nt.ev?.cold ? 1 : 0) + (nt.ev?.closed?.length || 0)));
    const tb = this.topEl ? this.topEl.getBoundingClientRect().bottom + 6 + maxNotes * 34 : 100, tr = this.bottom ? this.bottom.getBoundingClientRect().top : H * .8;
    const avail = Math.max(.3, (tr - tb - 14) / H), cy = clamp(((tb + tr) / 2) / H, .3, .7);
    const viewH = Math.max(vExt / avail, (C * RW + 1.0) / a);
    W.yaw = 0; W.pitch = PITCH; W.zoom = 1; W.yawGoal = null; W.vYaw = 0;
    W.target.set(0, vMid / cp, 0); W.home.copy(W.target); this.home0 = W.target.clone();
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(viewH * .94 * a, 0, cy);
    W.updateCam?.();
  }

  // ── rules (pure: the bots and the hover preview use them too). pos[i]: room, -1 = lobby, OUT (-2) = not staying tonight
  evalMoods(pos, ev = this.ev) {
    const occ = new Array(this.nR).fill(-1), G = this.guests;
    pos.forEach((r, i) => { if (r >= 0) occ[r] = i; });
    const at = (f, c) => (f < 0 || f >= this.Fn || c < 0 || c >= C) ? -1 : occ[f * C + c];
    const is = (j, key) => j >= 0 && G[j].key === key;
    const here = key => pos.some((r, j) => r !== OUT && r != null && G[j].key === key);
    return pos.map((r, i) => {
      if (r == null || r < 0) return null;
      const k = G[i].key, f = Math.floor(r / C), c = r % C;
      const side = [at(f, c - 1), at(f, c + 1)].filter(j => j >= 0), up = at(f + 1, c), dn = at(f - 1, c);
      if (k === 'sleepy') {
        const s = side.find(j => is(j, 'dj'));
        if (s != null) return { ok: false, why: 'dj', src: s, dir: 'side' };
        if (is(up, 'dj')) return { ok: false, why: 'dj', src: up, dir: 'up' };
        if (is(dn, 'dj')) return { ok: false, why: 'dj', src: dn, dir: 'down' };
        if (is(up, 'panda')) return { ok: false, why: 'panda', src: up, dir: 'up' };
        if (ev.cold) { const j = side[0] ?? (up >= 0 ? up : dn >= 0 ? dn : null); if (j != null) return { ok: false, why: 'cold', src: j, dir: side.length ? 'side' : up >= 0 ? 'up' : 'down' }; }
        return { ok: true };
      }
      if (k === 'shiba') { const s = side.find(j => CATS.has(G[j].key)); return s != null ? { ok: false, why: 'cat', src: s } : { ok: true }; }
      if (CATS.has(k)) {
        const s = side.find(j => is(j, 'shiba'));
        if (s != null) return { ok: false, why: 'dog', src: s };
        if (k === 'cat' && f !== this.Fn - 1) return { ok: false, why: 'low' };
        return { ok: true };
      }
      if (GUESTS[k].pal) {
        const p = GUESTS[k].pal, s = side.find(j => is(j, p));
        if (!here(p)) return { ok: true };
        if (ev.fight) return s != null ? { ok: false, why: 'fight', src: s } : { ok: true };
        return s != null ? { ok: true, pal: s } : { ok: false, why: 'alone' };
      }
      if (k === 'dj' && ev.bday != null && r !== ev.bday) return { ok: false, why: 'party' };
      return { ok: true };
    });
  }
  // every all-happy assignment of tonight's guests (rooms under repair left out)
  nightSols(keys, ev) {
    const open = [...Array(this.nR).keys()].filter(r => !(ev.closed || []).includes(r)), n = keys.length, out = [], cur = [];
    const fake = keys.map(key => ({ key }));
    const save = this.guests; this.guests = fake;
    const rec = () => {
      if (cur.length === n) { if (this.evalMoods(cur, ev).every(m => m.ok)) out.push(cur.slice()); return; }
      for (const r of open) if (!cur.includes(r)) { cur.push(r); rec(); cur.pop(); }
    };
    rec(); this.guests = save; return out;
  }
  // the smart bot's whole-trip plan: per night a target room for every guest, within every night's 방 바꾸기
  planTrip(from = 0, keys0 = [], pos0 = []) {
    const N = this.trip.nights;
    const cost = (pos, s) => s.reduce((a, r, i) => a + (pos[i] >= 0 && pos[i] !== r ? 1 : 0), 0);
    const carry = (keys, pos, nt) => {
      const keep = keys.map(k => !(nt.out || []).includes(k));
      let p = pos.filter((_, i) => keep[i]), k = keys.filter((_, i) => keep[i]);
      p = p.map(r => (nt.ev?.closed || []).includes(r) ? -1 : r);
      for (const x of nt.in || []) { if (!k.includes(x)) { k.push(x); p.push(-1); } }
      return { keys: k, pos: p };
    };
    const dfs = (n, keys, pos) => {
      if (n >= N.length) return [];
      const nt = N[n], c = n === from && keys0.length ? { keys: keys0, pos: pos0 } : carry(keys, pos, nt), ev = nt.ev || {};
      const S = this.nightSols(c.keys, ev).map(s => [cost(c.pos, s), s]).filter(([d]) => d <= nt.budget).sort((a, b) => a[0] - b[0]);
      for (const [, s] of S) { const rest = dfs(n + 1, c.keys, s); if (rest) return [{ keys: c.keys, rooms: s }, ...rest]; }
      return null;
    };
    return dfs(from, [], []);
  }
  occ(r) { return this.pos.indexOf(r); }
  present(i) { return this.pos[i] != null && this.pos[i] !== OUT; }
  hypo(i, dest) { const p = this.pos.slice(), src = p[i], o = dest >= 0 ? p.indexOf(dest) : -1; p[i] = dest; if (o >= 0 && o !== i) p[o] = src; return p; }
  closed(r) { return (this.ev.closed || []).includes(r); }
  movesLeft() { return this.budget - this.movesUsed; }

  // ── one night
  async startNight(n) {
    const L = this.L, TR = this.trip, NT = this.nt = TR.nights[n], ui = L.ui;
    this.n = n; this.ev = NT.ev || {}; this.budget = NT.budget; this.movesUsed = 0; this.phase = 'arrive'; this.btn.style.visibility = 'hidden';
    this.subEl.textContent = `${TR.name} · ${NIGHT_NAME[n]}`;
    this.app.classList.remove('ht-night', 'ht-morning'); L.world.setLight(EVENING);
    for (const G of this.guests) { if (G.starEl) { G.starEl.remove(); G.starEl = null; } G.party = false; }
    this.updMoves();
    const evLine = this.ev.bday != null ? '오늘은 둠칫이 생일!' : this.ev.fight ? '토순이랑 곰돌이가 싸웠대!' : this.ev.cold ? '졸졸이가 감기에 걸렸대' : n === 0 ? '친구들이 체크인해요' : '새 손님이 와요';
    await ui.banner(NIGHT_NAME[n], evLine, 1150);
    if (this.dead) return;
    // check-outs: wave, hop down to the lobby and out of the door
    const outs = this.guests.filter(G => (NT.out || []).includes(G.key) && this.present(G.i));
    for (const G of outs) { this.say(G.ch, ['잘 쉬었다 가요~', '또 올게!', '안녕~'][G.i % 3], 1000); G.ch.pose = 'wave'; }
    if (outs.length) { this.L.audio.sfx('door'); await this.tw.wait(.6); }
    for (const G of outs) { this.pos[G.i] = OUT; this.leave(G); }
    if (outs.length) await this.tw.wait(.5);
    // tonight's event card(s) and the rooms they change
    this.clearDecor();
    this.notes.innerHTML = '';
    for (const R of this.rooms) { R.plate.classList.remove('party', 'shut'); R.plate.textContent = String(roomNo(R.idx)); }
    const cards = [];
    if (this.ev.fight) cards.push(['토순이랑 곰돌이가 싸웠대! 오늘은 떨어뜨려 줘', 'fight']);
    if (this.ev.bday != null) { cards.push([`둠칫이 생일! 파티룸(${roomNo(this.ev.bday)}호)으로 보내 줘`, 'party']); this.partyRoom(this.ev.bday); }
    if (this.ev.cold) cards.push(['졸졸이 감기 · 옆·위·아래가 다 빈 조용한 방으로', 'cold']);
    for (const r of this.ev.closed || []) { cards.push([`${roomNo(r)}호 공사 중! 오늘은 못 써요`, 'shut']); this.repairRoom(r); }
    for (const [text, kind] of cards) {
      const el = L.h('div', { class: 'ht-note ' + kind, html: `${ICON.note}<span>${text}</span>` }); this.notes.append(el);
      this.L.audio.sfx('pop', 6); await this.tw.wait(.45); if (this.dead) return;
    }
    // guests in a room under repair go back to the lobby
    for (const G of this.guests) if (this.present(G.i) && this.closed(this.pos[G.i])) { this.pos[G.i] = -1; this.say(G.ch, '앗, 공사래!', 900, 'red'); this.sendHome(G); }
    // check-ins: through the door, a ring of the bell, 몽글이 says hello; a new quirk gets one line
    const news = [];
    for (const key of NT.in || []) {
      let G = this.guests.find(x => x.key === key);
      if (!G) G = this.newGuest(key);
      this.pos[G.i] = -1; G.mode = 'hop'; G.ch.root.visible = true; G.ch.root.position.set(-RW * C / 2 - .8, 0, .95); G.ch.root.scale.setScalar(CS);
      this.sendHome(G);
      this.ding(); if (!this.seen.has(key)) { news.push(G); this.seen.add(key); }
      await this.tw.wait(.32); if (this.dead) return;
    }
    this.say(this.mong, n === 0 ? '어서 오세요, 몽글 호텔입니다!' : '어서 오세요~', 1300);
    this.mong.pose = 'wave'; this.tw.wait(1.2).then(() => { if (!this.dead) this.mong.pose = 'idle'; });
    this.phase = 'checkin'; this.evalT = .6; this.btn.style.visibility = '';
    this.setBtn();
    this.introLines(news);
    if (this.lvIdx === 0 && n === 0 && !this.L.bot) this.tw.wait(1).then(() => { if (!this.dead && this.phase === 'checkin' && !this.touched) this.showHand(); });
  }
  async introLines(news) {
    this.introRunning = true;
    for (const G of news) {
      if (this.introStop || this.dead || this.phase !== 'checkin') break;
      this.setInfo(`<i class="nw">새 손님</i>${this.quirkHtml(G)}`, 'new');
      G.ch.bump(.4); this.jump(G, .2);
      await this.tw.wait(1.9);
    }
    this.introRunning = false;
    if (!this.dead && !this.introStop && this.phase === 'checkin') this.setInfo('');
  }
  newGuest(key) {
    const L = this.L, W = L.world, def = GUESTS[key], i = this.guests.length;
    const ch = new Char(def.kind); ch.root.scale.setScalar(CS); ch.root.visible = false; W.root.add(ch.root);
    // a little suitcase that goes everywhere with them
    const bag = new THREE.Group(), bc = def.bag;
    bag.add(put(rbox(.2, .25, .1, bc, .035), 0, .145, 0), put(rbox(.21, .03, .11, '#fff7ea', .01), 0, .2, 0), put(rbox(.08, .035, .02, '#3a2453', .01), 0, .29, 0));
    for (const sx of [-.065, .065]) bag.add(put(sph(.022, '#3a2453'), sx, .018, 0));
    bag.position.set(-.38, 0, -.08); bag.rotation.y = .35; ch.root.add(bag);
    const label = L.h('div', { class: 'ht-name', style: `--tc:${def.color}` }, L.h('i', { html: def.tag }), def.name); L.ui.wui.append(label);
    const mk = L.h('div', { class: 'ht-mood' }); L.ui.wui.append(mk);
    const G = { key, def, i, ch, bag, label, mk, mode: 'out', mood: null, room: null, pt: rnd(.3, 1.2) };
    this.guests.push(G); this.pos.push(OUT);
    W.idsDirty = true;
    return G;
  }
  // a guest checking out: down to the lobby, out through the door
  leave(G) {
    const ch = G.ch, from = ch.root.position.clone(), door = new THREE.Vector3(-RW * C / 2 - .9, 0, .9);
    this.hideBubble(ch); G.mode = 'hop'; G.hop = { from, to: door, t: 0, dur: .9, h: .8 + from.y * .1, s0: CS, s1: CS * .7, room: null, gone: true };
  }
  partyRoom(r) {
    const W = this.L.world, g = new THREE.Group(), x = this.colX(this.rc(r)), y = this.floorY(this.rf(r));
    const cols = ['#ff6f9c', '#ffd23f', '#7fd6ff', '#9be38f', '#c9a7ff'];
    for (let k = 0; k < 5; k++) { const bx = x - 1.2 + (k % 2) * .28 + (k > 2 ? 2.15 : 0), by = y + .95 + (k % 3) * .18, bz = -.55 + (k % 2) * .25;
      g.add(put(sph(.17, cols[k], { rough: .35 }, 16, 12), bx, by, bz, 0, 0, 0, [1, 1.15, 1]), put(cyl(.006, .006, .8, '#ffffff'), bx, by - .55, bz)); }
    for (let k = 0; k < 9; k++) g.add(put(rbox(.15, .2, .02, cols[k % 5], .01), x - 1.3 + k * .325, y + WALL_H - .28 - Math.sin(k / 8 * Math.PI) * .2, RD / 2 - .15, 0, 0, Math.PI));
    this.hotel.add(g); this.decor.push(g); W.idsDirty = true;
    const R = this.rooms[r]; R.plate.textContent = `${roomNo(r)} 파티룸`; R.plate.classList.add('party'); R.glowColor = '#ff9fe0';
  }
  repairRoom(r) {
    const W = this.L.world, g = new THREE.Group(), x = this.colX(this.rc(r)), y = this.floorY(this.rf(r));
    const tm = new THREE.MeshBasicMaterial({ map: this.tex.tape, transparent: false });
    for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .22), tm); m.position.set(x, y + 1.05, RD / 2 + .12 + (s > 0 ? .01 : 0)); m.rotation.z = s * .55; g.add(m); }
    const cones = makeFurniture('cones', THEMES.my).group; cones.position.set(x + .9, y, .9); cones.scale.setScalar(.8); g.add(cones);
    this.hotel.add(g); this.decor.push(g); W.idsDirty = true;
    const R = this.rooms[r]; R.plate.textContent = `${roomNo(r)} 공사 중`; R.plate.classList.add('shut');
  }
  clearDecor() { for (const g of this.decor) { this.hotel.remove(g); disposeTree(g); } this.decor = []; for (const R of this.rooms) R.glowColor = '#ffc46b'; }

  // ── input: drag a guest (from the lobby or a room), or tap to pick then tap a room
  bindInput() {
    const W = this.L.world;
    W.inputEnabled = false; W.camLock = true;
    this._pd = e => this.worldDown(e); this._pm = e => this.ptrMove(e); this._pu = e => this.ptrUp(e);
    this.app.addEventListener('pointerdown', this._pd);
    addEventListener('pointermove', this._pm); addEventListener('pointerup', this._pu); addEventListener('pointercancel', this._pu);
  }
  canAct() { return this.started && this.phase === 'checkin' && !this.result && !this.dead; }
  // who is under the finger: a waiting guest in the lobby (the nearest one), or whoever lives in that room
  guestAt(x, y) {
    let best = -1, bd = 44;
    for (const G of this.guests) {
      if (this.pos[G.i] !== -1 || G.mode === 'hop' || G.mode === 'drag') continue;
      const s = this.L.world.toScreen(V.copy(G.ch.root.position).setY(G.ch.root.position.y + .45)), d = Math.hypot(s.x - x, s.y - y);
      if (d < bd) { bd = d; best = G.i; }
    }
    if (best >= 0) return best;
    const r = this.roomAt(x, y);
    return r >= 0 ? this.occ(r) : -1;
  }
  worldDown(e) {
    if (e.button > 0 || !this.canAct()) return;
    if (this.drag) { if (!e.isPrimary) return; const o = this.drag; this.drag = null; if (o.moved) { this.endHover(); this.dropGuest(o.gid, null); } }   // (a primary press: the old drag lost its lift — it goes back, QA3 10/19)
    if (e.target.closest?.('.btn, .ht-bottom, .panel, #overlay.on, .topbar')) return;
    const i = this.guestAt(e.clientX, e.clientY);
    this.drag = { id: e.pointerId, gid: i, room: this.roomAt(e.clientX, e.clientY), x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, moved: false, hover: undefined };
  }
  ptrMove(e) {
    const d = this.drag; if (!d || e.pointerId !== d.id) return;
    d.x = e.clientX; d.y = e.clientY;
    if (!d.moved && d.gid >= 0 && Math.hypot(d.x - d.x0, d.y - d.y0) > 9) {
      if (this.pos[d.gid] >= 0 && this.movesLeft() <= 0) { this.noMoves(this.guests[d.gid]); this.drag = null; return; }
      d.moved = true; this.lift(d.gid, d);
    }
    if (d.moved) this.dragTo(d);
  }
  ptrUp(e) {
    const d = this.drag; if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (d.moved) { const dest = e.type === 'pointercancel' ? null : this.dropAt(e.clientX, e.clientY); this.endHover(); this.dropGuest(d.gid, dest); return; }   // (cancelled: back where it was — QA3 10/19)
    if (e.type === 'pointercancel') return;
    if (d.gid >= 0 && this.pos[d.gid] === -1) { this.select(this.sel === d.gid ? null : d.gid); if (this.sel != null) this.touch(this.guests[d.gid]); return; }
    this.tapRoom(d.room);
  }
  tapRoom(r) {
    if (!this.canAct()) return;
    if (r == null || r < 0) { if (r === -1 && this.sel != null && this.pos[this.sel] >= 0) { const s = this.sel; this.select(null); this.dropGuest(s, -1); return; } this.select(null); return; }
    const o = this.occ(r);
    if (this.sel != null) {
      if (o === this.sel) { this.select(null); return; }
      const s = this.sel; this.select(null); this.dropGuest(s, r); return;
    }
    if (o >= 0) { this.select(o); this.touch(this.guests[o]); return; }
    this.setInfo('로비의 손님을 이 방으로 드래그해요', 'flash');
  }
  select(i) {
    if (this.sel === i) return;
    this.sel = i;
    for (const R of this.rooms) { R.frameGoal = i != null && !this.closed(R.idx) ? .35 : 0; R.frameColor = '#ffffff'; }
    if (i != null) { this.L.audio.sfx('tap'); const G = this.guests[i]; G.ch.bump(.35); this.jump(G, .15); }
  }
  touch(G) { this.introStop = true; this.touched = true; this.hand?.remove(); this.hand = null; this.setInfo(this.quirkHtml(G)); }
  quirkHtml(G) {
    const k = G.key, ev = this.ev;
    let line = G.def.line;
    if (ev.fight && G.def.pal) line = `${GUESTS[G.def.pal].name}랑 싸웠대 · 오늘은 옆방 싫어!`;
    if (ev.bday != null && k === 'dj') line = `오늘 생일! 파티룸(${roomNo(ev.bday)}호)에 묵고 싶어`;
    if (ev.cold && k === 'sleepy') line = '감기 · 옆·위·아래 방이 다 비어야 푹 자요';
    return `<b style="--tc:${G.def.color}">${G.def.name}</b> ${line}`;
  }
  setInfo(html, cls = '') {
    if (!html) html = this.statusHtml();
    this.info.innerHTML = html; this.info.className = 'ht-info';
    if (cls) { void this.info.offsetWidth; this.info.classList.add(...cls.split(' ')); }
  }
  statusHtml() {
    const here = this.guests.filter(G => this.present(G.i)), wait = here.filter(G => this.pos[G.i] === -1).length, ok = here.filter(G => G.mood?.ok).length;
    if (this.lvIdx === 0 && this.n === 0 && this.movesUsed === 0 && wait === here.length) return '로비의 손님을 드래그해서 방에 넣어 주세요';
    if (wait) return `로비에서 기다리는 손님 <b>${wait}</b>명 · 행복한 손님 ${ok}/${here.length}`;
    return ok === here.length ? '모두 행복해! 불 끌까?' : `행복한 손님 <b>${ok}</b> / ${here.length} · 그래도 불 끌까?`;
  }
  noMoves(G) {
    this.setInfo('오늘 방 바꾸기를 다 썼어요', 'warn'); this.L.audio.sfx('miss');
    G.ch.bump(.3); this.movesEl.classList.remove('bump'); void this.movesEl.offsetWidth; this.movesEl.classList.add('bump');
  }
  roomAt(x, y) {
    const p = this.planeAt(x, y, 0); if (!p) return null;
    if (Math.abs(p.x) > C * RW / 2 + .2) return null;
    if (p.y < LFH - .5) return p.y > -.6 ? -1 : null;   // the lobby
    const c = Math.floor((p.x + C * RW / 2) / RW), f = Math.floor((p.y - LFH + .5) / FH);
    if (c < 0 || c >= C || f < 0 || f >= this.Fn) return null;
    return f * C + c;
  }
  planeAt(x, y, z) {
    const W = this.L.world; W.raycaster.setFromCamera(W.ndc(x, y), W.cam);
    return W.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z), new THREE.Vector3());
  }
  dropAt(x, y) { if (y > this.bottom.getBoundingClientRect().top - 6) return -1; return this.roomAt(x, y - LIFT_PX); }
  lift(i, d) {
    const G = this.guests[i], ch = G.ch;
    this.select(null); this.touch(G);
    G.mode = 'drag'; G.hop = null; ch.pose = 'flail'; ch.setFace('wow'); ch.body.position.x = 0;
    this.hideBubble(ch); this.L.audio.sfx('lift');
    this.dragTo(d);
  }
  dragTo(d) {
    const G = this.guests[d.gid];
    G.dragGoal = this.planeAt(d.x, d.y - LIFT_PX, DRAG_Z);
    const dest = this.dropAt(d.x, d.y);
    if (dest !== d.hover) { d.hover = dest; this.hover(G, dest); }
  }
  hover(G, dest) {
    const reach = new Set();
    if (dest != null && dest >= 0 && !this.closed(dest) && (G.key === 'dj' || G.key === 'panda')) {
      const f = this.rf(dest), c = this.rc(dest), nb = G.key === 'dj' ? [[f, c - 1], [f, c + 1], [f + 1, c], [f - 1, c]] : [[f - 1, c]];
      for (const [ff, cc] of nb) if (ff >= 0 && ff < this.Fn && cc >= 0 && cc < C) reach.add(ff * C + cc);
    }
    for (const R of this.rooms) { R.frameGoal = R.idx === dest ? 1 : reach.has(R.idx) ? .7 : 0; R.frameColor = reach.has(R.idx) ? '#c6a8ff' : '#ffffff'; }
    this.lobbyGoal = dest === -1 ? 1 : 0;
    const ch = G.ch;
    if (dest == null || dest < 0) { ch.setFace('wow'); G.pv = null; return; }
    const R = this.rooms[dest];
    if (this.closed(dest)) { G.pv = { ok: false, why: 'shut' }; R.frameColor = '#ff9aa8'; ch.setFace('sad'); return; }
    const m = this.evalMoods(this.hypo(G.i, dest))[G.i];
    G.pv = m; R.frameColor = m.ok ? '#c8ffd8' : '#ffd0d6';
    ch.setFace(m.ok ? 'happy' : this.badFace(G, m));
    this.L.audio.sfx('tick');
  }
  endHover() { for (const R of this.rooms) { R.frameGoal = this.sel != null && !this.closed(R.idx) ? .35 : 0; R.frameColor = '#ffffff'; } this.lobbyGoal = 0; }

  // ── the one place both the player's drops / taps and the bots change who sleeps where
  dropGuest(i, dest) {
    const G = this.guests[i], src = this.pos[i];
    G.pv = null;
    if (!this.canAct() || dest == null || dest === src || (dest >= 0 && this.closed(dest))) { if (dest >= 0 && this.closed(dest)) { this.setInfo(`${roomNo(dest)}호는 공사 중이에요`, 'warn'); this.L.audio.sfx('miss'); } this.sendHome(G); return false; }
    const o = dest >= 0 ? this.occ(dest) : -1, cost = src >= 0 || o >= 0 ? 1 : 0;
    if (cost && this.movesLeft() <= 0) { this.noMoves(G); this.sendHome(G); return false; }
    this.pos[i] = dest; if (o >= 0) this.pos[o] = src;
    this.movesUsed += cost;
    this.sendHome(G); if (o >= 0) this.sendHome(this.guests[o], .06);
    this.L.audio.sfx('whoosh');
    this.hand?.remove(); this.hand = null;
    this.updMoves();
    this.evalT = Math.max(G.hop?.dur || 0, o >= 0 ? (this.guests[o].hop?.dur || 0) + .06 : 0) + .03;
    return true;
  }
  // hop to where this guest belongs now: a room, or a free spot in the lobby
  sendHome(G, delay = 0) {
    const ch = G.ch, r = this.pos[G.i];
    if (r == null || r === OUT) return;
    const to = r >= 0 ? this.standPos(r) : this.lobbySlot(this.lobbyIndex(G));
    const from = ch.root.position.clone(), dy = Math.abs(to.y - from.y);
    G.mode = 'hop'; G.hop = { from, to, t: -delay, dur: .4 + Math.min(.3, dy * .04), h: .7 + Math.min(1.2, dy * .15), s0: ch.root.scale.x, s1: CS, room: r };
    ch.pose = r >= 0 ? 'flail' : 'idle'; ch.body.position.x = 0;
    if (r < 0) this.hideBubble(ch);
    // the other lobby guests shuffle along
    if (r !== -1) this.tw.wait(.05).then(() => this.relayLobby(G));
  }
  // waiting guests keep their place in the queue (by arrival); the queue closes up when someone gets a room
  lobbyIndex(G) {
    if (G.lobbyAt == null) G.lobbyAt = this.t + G.i * 1e-3;
    return this.guests.filter(x => x !== G && this.pos[x.i] === -1 && x.lobbyAt != null && x.lobbyAt < G.lobbyAt).length;
  }
  relayLobby(except) {
    for (const G of this.guests) if (G !== except && this.pos[G.i] === -1 && G.mode === 'lobby') {
      const to = this.lobbySlot(this.lobbyIndex(G)); if (to.distanceTo(G.ch.root.position) > .05) { G.mode = 'hop'; G.hop = { from: G.ch.root.position.clone(), to, t: 0, dur: .3, h: .25, s0: CS, s1: CS, room: -1 }; }
    }
  }
  landed(G) {
    const ch = G.ch, H = G.hop, r = H.room, L = this.L, W = L.world;
    G.hop = null; ch.root.rotation.y = 0; ch.pose = 'idle'; ch.squash = .4;
    if (H.gone) { G.mode = 'out'; ch.root.visible = false; G.lobbyAt = undefined; return; }
    if (r === -1) { G.mode = 'lobby'; L.audio.sfx('hop', 2); return; }
    G.mode = 'room'; G.lobbyAt = undefined;
    L.audio.sfx('land'); L.audio.sfx('place');
    const s = W.toScreen(V.copy(ch.root.position)); W.fx.ring(s.x, s.y, { r: 34, color: '#ffffff', width: 5, life: .4 });
    W.fx.burst(s.x, s.y - 6, { n: 8, speed: 150, size: 7, life: .45, colors: ['#ffffff', '#ffe16b', G.def.color] });
  }

  // ── moods: recompute, and let everyone whose mood changed react
  refresh(react = true) {
    const moods = this.evalMoods(this.pos), fresh = [];
    this.guests.forEach((G, i) => {
      const m = moods[i], pm = G.mood, moved = G.room !== this.pos[i];
      G.mood = m; G.room = this.pos[i];
      if (!m) return;
      const same = pm && pm.ok === m.ok && pm.why === m.why && pm.src === m.src;
      if (react && (moved || !same)) fresh.push([G, m, moved]);
      else if (G.mode === 'room') this.restFace(G);
    });
    fresh.sort((a, b) => a[1].ok - b[1].ok);
    fresh.forEach(([G, m, moved], k) => this.tw.wait(k * .14).then(() => { if (!this.dead && G.mood === m && G.mode === 'room' && this.phase === 'checkin') this.react(G, m, moved); }));
    for (const R of this.rooms) { const o = this.occ(R.idx); R.glowGoal = o >= 0 && moods[o]?.ok ? 1 : 0; }
    const changed = new Set(fresh.map(f => f[0]));
    for (const G of this.guests) { G.mk.className = 'ht-mood' + (G.mood ? (G.mood.ok ? ' ok' : ' no') : ''); G.mk.innerHTML = G.mood?.ok ? SMILE : FROWN; G._mkKey = null; if (changed.has(G)) { void G.mk.offsetWidth; G.mk.classList.add('pop'); } }
    const okN = this.guests.filter(G => G.mood?.ok).length;
    if (!this.drag && !this.introRunning && this.phase === 'checkin') this.setInfo('', okN > (this.okN || 0) ? 'flash' : '');
    this.okN = okN;
    this.setBtn(); this.updMoves();
  }
  setBtn() {
    const wait = this.guests.filter(G => this.pos[G.i] === -1).length, lbl = this.btn.querySelector('.lbl');
    if (this.phase === 'checkin') { lbl.textContent = wait ? `손님 ${wait}명 남음` : '불 끄기'; this.btn.classList.toggle('disabled', wait > 0); this.btn.classList.toggle('ready', !wait); }
  }
  updMoves() {
    const left = Math.max(0, (this.budget || 0) - this.movesUsed);
    this.movesN.textContent = String(left);
    this.movesEl.classList.toggle('low', left === 0 && this.phase === 'checkin');
    this.starN.textContent = String(this.stars);
  }
  badFace(G, m) { return (G.key === 'cat' && m.why === 'low') || m.why === 'alone' || m.why === 'party' || m.why === 'shut' ? 'sad' : 'angry'; }
  restFace(G) {
    const m = G.mood, ch = G.ch; if (!m) return;
    if (m.ok) { ch.setFace(G.key === 'sleepy' ? 'normal' : 'happy'); ch.pose = 'idle'; }
    else ch.setFace(this.badFace(G, m));
    this.faceToward(G);
  }
  faceToward(G) {
    const m = G.mood; let goal = 0;
    const j = m?.src ?? m?.pal;
    if (j != null && this.pos[j] >= 0 && this.pos[G.i] >= 0 && (m.dir === 'side' || m.why === 'cat' || m.why === 'dog' || m.pal != null)) goal = Math.sign(this.rc(this.pos[j]) - this.rc(this.pos[G.i])) * .75;
    if (m?.why === 'fight') goal = -goal * 1.6;   // a huff: back turned to the other one
    G.yawGoal = goal;
  }
  react(G, m, moved) {
    const ch = G.ch, L = this.L, k = G.key;
    this.faceToward(G);
    if (!m.ok) { this.complain(G, m, true); return; }
    ch.setFace(k === 'sleepy' ? 'normal' : 'happy'); ch.pose = 'idle';
    const pop = (line, fx = 'star') => { this.say(ch, line, 1100); ch._fx(this.tw, fx, { x: -.36, y: .9 }); ch._fx(this.tw, fx, { x: .38, y: 1.0, delay: .12 }); this.jump(G, .22); };
    if (k === 'dj') { if (this.ev.bday != null) { pop('생일 파티다~!', 'star'); const s = L.world.toScreen(this.roomMid(this.pos[G.i], 1.3)); L.world.fx.burst(s.x, s.y, { n: 18, speed: 240, size: 9, life: .8 }); } else pop('둠칫둠칫~', 'note'); L.audio.sfx('special'); }
    else if (k === 'sleepy') { this.say(ch, this.ev.cold ? '조용하다… 콜록, 쿨' : '여기 조용하다… 쿨쿨', 1300, 'think'); L.audio.sfx('phew'); }
    else if (k === 'cat') { pop('꼭대기다! 전망 최고냥', 'heart'); L.audio.sfx('giggle'); }
    else if (k === 'panda') { pop(moved ? '판다 체크인!' : '판다 최고!'); L.audio.sfx('pop', 4); this.stomp(G, true); }
    else if (k === 'shiba') { pop(moved ? '멍! 좋아요!' : '휴, 고양이 갔다'); L.audio.sfx('giggle'); }
    else if (GUESTS[k].pal) {
      if (this.ev.fight) { this.say(ch, '흥, 멀리 있으니 좋다', 1100); L.audio.sfx('hmm'); return; }
      const P = this.guests[m.pal];
      pop(k === 'bunny' ? '곰돌아, 안녕!' : '토순아, 반가워!', 'heart'); L.audio.sfx('heart');
      if (P) { P.ch.setFace('happy'); P.ch._fx(this.tw, 'heart', { y: 1.0 }); }
      this.heartBridge(G, P);
    } else { pop('좋아요!'); L.audio.sfx('pop', 5); }
  }
  complain(G, m, first) {
    const ch = G.ch, L = this.L, k = G.key;
    ch.setFace(this.badFace(G, m));
    G.nag = (G.nag || 0) + 1;
    if (k === 'sleepy') {
      const S = this.guests[m.src], dir = m.dir, night = this.phase === 'night';
      const lines = m.why === 'cold' ? ['콜록콜록… 조용히 좀!', '콜록! 옆방 소리 다 들려', '감기 낫고 싶어…'] : m.why === 'panda' ? ['윗방 쿵쿵 그만!', '쿵쿵 좀 그만!', '잠 좀 자자!'] : dir === 'up' ? ['윗방 음악 꺼!', '시끄러워!', '잠 좀 자자!'] : dir === 'down' ? ['아랫방 음악 꺼!', '시끄러워!', '잠 좀 자자!'] : ['옆방 음악 꺼!', '시끄러워!', '조용히 해!'];
      if (first || G.nag % 2 === 0 || night) this.say(ch, lines[first ? 0 : 1 + (G.nag >> 1) % 2], 1000, 'red');
      const r = this.pos[G.i], sr = S ? this.pos[S.i] : -1, me = this.roomMid(r, 1.25);
      const at = dir === 'up' ? this.roomMid(r, WALL_H - .15) : dir === 'down' ? this.roomMid(r, .3).setX(this.colX(this.rc(r)) - .85) : me.clone().setX(me.x + Math.sign(this.colX(this.rc(sr)) - me.x) * (RW / 2 - .1));
      this.pop(at, m.why === 'cold' ? '콜록!' : dir === 'side' ? '쾅쾅!' : '쿵쿵!', 'bang');
      this.shake(r, first ? 1 : .7); if (sr >= 0) this.shake(sr, .45);
      ch.pose = 'flail'; this.tw.wait(.55).then(() => { if (G.mood === m) ch.pose = 'idle'; });
      ch._fx(this.tw, 'anger', { x: .34, y: .95 }); ch.bump(.35);
      this.snd(m.why === 'cold' ? 'cough' : 'bang'); if (first) L.audio.sfx('angry');
      if (S && first && S.key === 'dj' && this.phase === 'checkin') this.tw.wait(.5).then(() => { if (S.mode === 'room' && !this.result) this.say(S.ch, '앗, 미안~', 800); });
      return;
    }
    if (k === 'shiba') {
      const Cg = this.guests[m.src];
      this.say(ch, first ? '멍멍멍!' : ['멍!', '왈왈!', '으르릉…'][G.nag % 3], 800, 'red');
      ch.bump(.4); this.jump(G, .18); ch._fx(this.tw, 'excl', { x: .34, y: .95 }); this.snd('bark');
      this.shake(this.pos[G.i], .5);
      if (Cg && Cg.mode === 'room') this.tw.wait(.3).then(() => { if (Cg.mood && !Cg.mood.ok && Cg.mood.why === 'dog') this.hiss(Cg); });
      if (first) L.audio.sfx('angry');
      return;
    }
    if (CATS.has(k)) {
      if (m.why === 'dog') { if (first) this.hiss(G); return; }
      this.say(ch, first ? '더 높은 방이 좋은데…' : ['꼭대기가 좋은데…', '높은 데 가고 싶다냥'][G.nag % 2], 1200, 'think');
      ch._fx(this.tw, 'ques', { x: .34, y: .95 }); if (first) L.audio.sfx('miss');
      return;
    }
    if (GUESTS[k].pal) {
      const P = GUESTS[GUESTS[k].pal];
      if (m.why === 'fight') {
        this.say(ch, first ? '흥! 옆방 싫어!' : ['흥!', '쳇!', '말 걸지 마!'][G.nag % 3], 900, 'red'); ch._fx(this.tw, 'anger', { x: .34, y: .95 }); this.jump(G, .15);
        const r = this.pos[G.i], o = this.guests[m.src]; if (o && this.pos[o.i] >= 0 && G.key === 'bunny') { const a = this.roomMid(r, 1.0), b = this.roomMid(this.pos[o.i], 1.0); this.pop(a.lerp(b, .5), '투닥!', 'bang'); this.shake(r, .5); this.shake(this.pos[o.i], .5); this.snd('bang', .6); }
        if (first) L.audio.sfx('angry');
        return;
      }
      this.say(ch, first ? `${P.name} 어디 있지…` : [`${P.name} 보고 싶다…`, `${P.name}랑 옆방 하고 싶어`][G.nag % 2], 1200, 'think');
      ch._fx(this.tw, 'drop', { x: .36, y: .85, rise: -.1 }); if (first) L.audio.sfx('miss');
      return;
    }
    if (k === 'dj' && m.why === 'party') { this.say(ch, first ? '파티룸은 어디야…?' : '생일인데 파티룸이 아니야…', 1200, 'think'); ch._fx(this.tw, 'ques', { x: .34, y: .95 }); if (first) L.audio.sfx('miss'); return; }
    this.say(ch, '싫어!', 800, 'red');
  }
  hiss(Cg) { const ch = Cg.ch; ch.setFace('angry'); this.say(ch, '하악!', 800, 'red'); ch._fx(this.tw, 'anger', { x: .34, y: .95 }); this.jump(Cg, .3); this.snd('hiss'); this.shake(this.pos[Cg.i], .4); }
  stomp(G, soft = false) {
    const r = this.pos[G.i]; G.ch.bump(.45); this.jump(G, .12, .2);
    const below = r - C;
    if (below >= 0) { this.pop(this.roomMid(below, WALL_H - .2), '쿵!', 'boom'); this.shake(below, soft ? .5 : .35); this.snd('thump'); }
    else { this.pop(new THREE.Vector3(this.colX(this.rc(r)), LOBBY_H - .15, 0), '쿵!', 'boom'); this.snd('thump', .45); }
  }
  jump(G, h = .2, dur = .34) { const ch = G.ch; this.tw.run(dur, k => { ch.lift = h * 4 * k * (1 - k); }, ease.linear).then(() => { ch.lift = 0; }); }
  shake(r, a = 1) { const R = this.rooms[r]; if (R) R.shake = Math.max(R.shake, a); }
  heartBridge(A, B) {
    if (!B || !(this.pos[A.i] >= 0) || !(this.pos[B.i] >= 0)) return;
    const a = this.standPos(this.pos[A.i]).setY(this.floorY(this.rf(this.pos[A.i])) + 1.0), b = this.standPos(this.pos[B.i]).setY(this.floorY(this.rf(this.pos[B.i])) + 1.0);
    for (let k = 0; k < 2; k++) this.fly(k ? b : a, a.clone().lerp(b, .5).setY(a.y + .45), '♥', 'note', .7, k * .15, 'hrt');
  }
  ding() { this.snd('bell'); this.mong.bump(.3); this.tw.run(.25, k => { this.bell.scale.setScalar(1 + Math.sin(k * Math.PI) * .25); }, ease.linear); }

  // ── the main button: 불 끄기 → the night → (morning) 다음 날 / 체크아웃
  mainBtn() {
    if (this.dead || this.result) return;
    if (this.phase === 'checkin') {
      if (this.guests.some(G => this.pos[G.i] === -1)) { this.setInfo('로비에 손님이 아직 있어요', 'warn'); return; }
      if (this.drag || this.evalT > 0) return;
      this.lightsOut(); return;
    }
    if (this.phase === 'morning') { if (this.n + 1 < this.trip.nights.length) this.startNight(this.n + 1); else this.checkout(); }
  }
  async lightsOut() {
    const L = this.L, W = L.world;
    this.phase = 'night'; this.select(null); this.endHover(); this.btn.style.visibility = 'hidden'; this.hand?.remove();
    this.refresh(false);
    this.app.classList.add('ht-night'); W.setLight(NIGHT); this.snd('switch');
    for (const G of this.guests) if (this.pos[G.i] >= 0) { G.pt = rnd(.1, .7); if (G.mood?.ok) G.ch.setFace(G.key === 'sleepy' ? 'normal' : 'happy'); }
    this.setInfo('불을 껐어요… 쉿', 'night');
    for (const [t, line] of [[1.4, '밤 12시 · 쿨쿨…'], [2.8, '새벽 3시 · …'], [4.3, '아침 7시!']]) this.tw.wait(t).then(() => { if (!this.dead && this.phase === 'night') { this.setInfo(line, 'night'); L.audio.sfx('tick'); } });
    await this.tw.wait(4.8);
    if (this.dead) return;
    this.morning();
  }
  // the morning: stars over everyone's head, one line about last night
  async morning() {
    const L = this.L, W = L.world;
    this.phase = 'morning';
    this.app.classList.remove('ht-night'); this.app.classList.add('ht-morning'); W.setLight(MORNING); L.audio.sfx('phew');
    const moods = this.evalMoods(this.pos);
    this.guests.forEach((G, i) => { if (this.pos[i] >= 0) { if (!G.mood) console.warn('hotel: no mood at morning', G.key, this.pos[i], G.mode); G.mood = moods[i]; } });
    const here = this.guests.filter(G => this.pos[G.i] >= 0), log = { n: this.n, moods: here.map(G => ({ key: G.key, ...G.mood })) };
    this.nightLog.push(log);
    this.setInfo(this.recap(here), 'recap');
    for (const [k, G] of here.entries()) {
      await this.tw.wait(.22); if (this.dead) return;
      const ok = G.mood?.ok, s = ok ? 3 : 1;
      this.stars += s; this.maxStars += 3;
      G.ch.setFace(ok ? 'happy' : 'sad'); G.ch.pose = ok ? 'stretch' : 'idle';
      this.tw.wait(.8).then(() => { if (G.ch.pose === 'stretch') G.ch.pose = 'idle'; });
      G.starEl = L.h('div', { class: 'ht-stars ' + (ok ? 'good' : 'bad') }, ...[0, 1, 2].map(j => L.h('i', { class: j < s ? 'on' : '', html: ICON.star }))); L.ui.wui.append(G.starEl);
      if (ok) { L.audio.sfx('coin', k); this.say(G.ch, ['잘 잤다~', '꿀잠!', '개운해!'][k % 3], 900); } else { L.audio.sfx('miss'); this.say(G.ch, ['한숨도 못 잤어…', '피곤해…', '최악이야…'][k % 3], 1100, 'think'); }
      this.starN.textContent = String(this.stars); this.starEl.classList.remove('bump'); void this.starEl.offsetWidth; this.starEl.classList.add('bump');
    }
    if (this.dead) return;
    const lbl = this.btn.querySelector('.lbl'), last = this.n + 1 >= this.trip.nights.length;
    lbl.textContent = last ? '체크아웃' : '다음 날 ▶'; this.btn.classList.remove('disabled', 'ready'); this.btn.style.visibility = '';
  }
  recap(here) {
    const bad = here.filter(G => !G.mood?.ok), G = k => here.find(x => x.key === k);
    if (!bad.length) {
      const opts = ['모두 꿀잠! 조식 뷔페까지 싹싹 먹었대', '아무도 안 깼어요. 완벽한 밤!'];
      if (G('panda')) opts.push('판다도 오늘은 사뿐사뿐 걸었대');
      if (G('dj')) opts.push(this.ev.bday != null ? '둠칫이 생일 파티 대성공! 케이크가 맛있었대' : '둠칫이 음악은 빈방만 들었대. 다들 꿀잠!');
      if (G('bunny') && !this.ev.fight) opts.push('토순이·곰돌이는 밤새 벽 너머로 수다 떨었대');
      if (this.ev.fight) opts.push('토순이·곰돌이, 아침엔 화해했대!');
      return opts[(this.n + this.lvIdx) % opts.length];
    }
    const b = bad[0], m = b.mood || {}, src = m.src != null ? this.guests[m.src] : null, more = bad.length > 1 ? ` (불만 ${bad.length}명)` : '';
    let s;
    if (b.key === 'sleepy') s = m.why === 'panda' ? '어젯밤 판다 쿵쿵 때문에 졸졸이가 한숨도 못 잤대…' : m.why === 'cold' ? '감기 걸린 졸졸이가 옆방 소리에 밤새 콜록콜록…' : '둠칫이 음악에 졸졸이 눈 밑이 퀭해졌대…';
    else if (b.key === 'shiba' || m.why === 'dog') s = '멍뭉이랑 냥냥이가 밤새 싸워서 복도에 털이 날려…';
    else if (b.key === 'cat') s = '냥냥이는 밤새 창밖만 봤대. 더 높은 방이 좋았는데…';
    else if (m.why === 'fight') s = '싸운 토순이·곰돌이가 옆방이라 밤새 투닥투닥…';
    else if (m.why === 'alone') s = '토순이랑 곰돌이가 서로 보고 싶어서 밤새 문자했대';
    else if (m.why === 'party') s = '생일인데 파티룸이 아니라서 둠칫이가 시무룩…';
    else s = `${b.def.name}가 잠을 설쳤대…`;
    return s + more + (src ? '' : '');
  }

  // ── the end of the trip: everyone in the lobby for a group photo
  async checkout() {
    const L = this.L, W = L.world, ui = L.ui;
    this.phase = 'end'; this.btn.style.visibility = 'hidden'; this.notes.innerHTML = '';
    for (const G of this.guests) if (G.starEl) { G.starEl.remove(); G.starEl = null; }
    this.clearDecor();
    const ratio = this.maxStars ? this.stars / this.maxStars : 0, good = ratio >= BAR - 1e-9;
    this.setInfo(good ? '체크아웃! 다 같이 사진 찍자' : '체크아웃… 사진이라도 찍자', '');
    // everyone of the trip comes down (or back in through the door) and lines up
    const all = this.guests, n = all.length;
    if (n <= 4) all.forEach((G, k) => { G.photoAt = new THREE.Vector3(-1.05 + k * 1.15, 0, .95); G.back = false; });
    else { const nf = Math.floor(n / 2) + 1, fx = j => -1.1 + j * (3.9 / (nf - 1)); all.forEach((G, k) => { const f = k < nf, j = f ? k : k - nf; G.back = !f; G.photoAt = f ? new THREE.Vector3(fx(j), 0, 1.05) : new THREE.Vector3((fx(j) + fx(j + 1)) / 2, 0, .2); }); }
    for (const G of all) {
      if (!G.ch.root.visible) { G.ch.root.visible = true; G.ch.root.position.set(-RW * C / 2 - .8, 0, .95); G.ch.root.scale.setScalar(CS); }
      this.pos[G.i] = OUT; G.mood = null; this.hideBubble(G.ch);
      G.mode = 'hop'; G.hop = { from: G.ch.root.position.clone(), to: G.photoAt, t: -G.i * .08, dur: .6, h: .8, s0: G.ch.root.scale.x, s1: CS, room: -9 };
    }
    { const m0 = this.mong.root.position.clone(), m1 = new THREE.Vector3(-2.15, 0, 1.0); this.mong.pose = 'idle'; this.tw.run(.6, k => { this.mong.root.position.lerpVectors(m0, m1, k); this.mong.root.position.y = Math.sin(k * Math.PI) * .5; }, ease.inOutSine); }
    await ui.banner('체크아웃!', `${this.trip.name} 여행 끝`, 1000);
    if (this.dead) return;
    W.flyTo(this.tw, { target: new THREE.Vector3(0, .95, .3), zoom: 1.12, dur: .7 });
    await this.tw.wait(.8); if (this.dead) return;
    this.say(this.mong, '자, 다 같이! 하나, 둘…', 1100);
    for (const G of all) { G.ch.root.rotation.y = 0; const sad = !good && this.nightLog.some(l => l.moods.some(m => m.key === G.key && !m.ok)); G.ch.setFace(sad ? 'angry' : 'happy'); G.ch.pose = sad ? 'cross' : (G.i % 2 ? 'cheer' : 'wave'); G.photoJump = G.back; }
    this.mong.setFace('happy'); this.mong.pose = 'cheer';
    await this.tw.wait(1.2); if (this.dead) return;
    this.say(this.mong, good ? '김치~!' : '…김치?', 700);
    await this.tw.wait(.35); if (this.dead) return;
    this.snd('shutter'); const photo = this.snapshot();
    const fl = this.flash = L.h('div', { class: 'ht-flash' }); this.app.append(fl); setTimeout(() => fl.remove(), 700);
    if (good) { W.fx.confetti(120); L.audio.sfx('win'); } else L.audio.sfx('lose');
    await this.tw.wait(1.0); if (this.dead) return;
    this.finish(good, ratio, photo);
  }
  snapshot() {
    try {
      const W = this.L.world, cv = W.canvas, r = cv.width / innerWidth;
      const a = W.toScreen(new THREE.Vector3(-C * RW / 2 - .1, LOBBY_H + .5, 0)), b = W.toScreen(new THREE.Vector3(C * RW / 2 + .1, -.5, RD / 2));
      let x0 = Math.max(0, a.x), x1 = Math.min(innerWidth, b.x), y0 = Math.max(0, a.y), y1 = Math.min(innerHeight, b.y);
      const w = x1 - x0, hh = Math.max(w * .72, y1 - y0); y0 = Math.max(0, (y0 + y1) / 2 - hh / 2);
      const N = 360, out = document.createElement('canvas'); out.width = N; out.height = Math.round(N * hh / w);
      const g = out.getContext('2d'); g.fillStyle = '#ffe9cc'; g.fillRect(0, 0, out.width, out.height);
      W.render(); g.drawImage(cv, x0 * r, y0 * r, w * r, hh * r, 0, 0, out.width, out.height);
      g.fillStyle = 'rgba(255, 196, 140, .1)'; g.fillRect(0, 0, out.width, out.height);
      g.font = 'bold 16px ui-monospace, Menlo, monospace'; g.textAlign = 'right'; g.fillStyle = 'rgba(255, 120, 40, .95)'; g.fillText("'26 10 18", out.width - 10, out.height - 10);
      return out.toDataURL('image/jpeg', .85);
    } catch (e) { return null; }
  }
  finish(good, ratio, photo) {
    const L = this.L, h = L.h;
    this.result = good ? 'win' : 'fail';
    const rating = ratio >= 1 - 1e-9 ? 3 : ratio >= .93 ? 2 : good ? 1 : 0;
    L.log({ result: this.result, lv: this.lvIdx + 1, stars: this.stars, max: this.maxStars, rating, line: good ? `별 ${this.stars} / ${this.maxStars} · ${rating === 3 ? '모두 꿀잠, 완벽한 여행!' : rating === 2 ? '거의 완벽한 여행!' : '그래도 즐거운 여행!'}` : undefined, photo: photo || undefined });   // (its own panel stays: the group photo — the reward card could take it over via e.photo)
    const last = this.lvIdx >= TRIPS.length - 1;
    const pic = h('div', { class: 'ht-photo' + (good ? '' : ' bad') }, photo ? h('img', { src: photo, alt: '로비 단체 사진' }) : null, h('span', {}, `몽글 호텔 · ${this.trip.name}`));
    const body = [pic];
    if (good) body.push(h('div', { class: 'stars' }, ...[0, 1, 2].map(k => h('div', { class: 'st' + (k < rating ? ' on' : ''), html: k < rating ? ICON.star : ICON.starGray }))));
    body.push(h('div', { class: 'txt' }, good ? `별 ${this.stars} / ${this.maxStars} · ${rating === 3 ? '모두 꿀잠, 완벽한 여행!' : rating === 2 ? '거의 완벽한 여행!' : '그래도 즐거운 여행!'}` : `별 ${this.stars} / ${this.maxStars} · 다들 다크서클이… 다음엔 꿀잠 재워 줘`));
    L.ui.panel({ title: good ? '즐거운 여행 끝!' : '최악의 여행…', color: good ? 'green' : 'red', cls: 'ht-panel', body,
      buttons: good ? [this.againBtn = L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
        this.nextBtn = L.ui.btn(last ? '처음 여행으로' : '다음 여행', { color: 'green', cls: 'big', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) })]
        : [this.againBtn = L.ui.btn('다시 하기', { color: 'orange', cls: 'big', onClick: () => L.go({ lv: this.lvIdx }) })] });
  }

  // ── little world-anchored pieces (DOM)
  say(ch, text, ms = 1100, cls = '') {
    this.hideBubble(ch);
    const b = this.L.h('div', { class: 'bubble pop ' + cls }, text); this.L.ui.wui.append(b);
    const a = { el: b, at: () => V.copy(ch.root.position).setY(ch.root.position.y + (ch.headTop() + .12) * ch.root.scale.y + .58), until: this.t + ms / 1000 * (this.L.fast || 1), bubble: true };
    this.anch.push(a); this.bubbles.set(ch, a); this.place(a);
    return b;
  }
  hideBubble(ch) { const a = this.bubbles.get(ch); if (a) { a.until = 0; this.bubbles.delete(ch); } }
  place(a) {
    const s = this.L.world.toScreen(a.at());
    if (a.bubble) { a.el.style.left = s.x + 'px'; a.el.style.top = Math.max(44, s.y) + 'px'; }
    else a.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
  }
  pop(p, text, cls, ms = 900) {
    const el = this.L.h('div', { class: 'ht-fx ' + cls }, this.L.h('span', {}, text)); this.L.ui.wui.append(el);
    const at = p.clone(), a = { el, at: () => at, until: this.t + ms / 1000 * (this.L.fast || 1) };
    this.anch.push(a); this.place(a);
  }
  fly(a, b, text, cls, dur = .9, delay = 0, extra = '') {
    const el = this.L.h('div', { class: `ht-fx ${cls} ${extra}`, style: 'opacity:0' }, this.L.h('span', {}, text)); this.L.ui.wui.append(el);
    this.fxs.push({ el, a: a.clone(), b: b.clone(), t: -delay, dur, ph: Math.random() * 6 });
  }
  stepFx(dt) {
    const W = this.L.world;
    this.fxs = this.fxs.filter(f => {
      f.t += dt; if (f.t < 0) return true;
      const k = Math.min(1, f.t / f.dur);
      V.lerpVectors(f.a, f.b, ease.outQuad(k)); V.y += Math.sin(k * Math.PI) * .45; V.x += Math.sin(f.t * 9 + f.ph) * .08;
      const s = W.toScreen(V), sc = .6 + Math.sin(Math.min(1, k * 1.6) * Math.PI / 2) * .5;
      f.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) scale(${sc.toFixed(2)})`;
      f.el.style.opacity = String(k < .15 ? k / .15 : k > .75 ? (1 - k) / .25 : 1);
      if (k >= 1) { f.el.remove(); return false; }
      return true;
    });
    this.anch = this.anch.filter(a => { if (this.t > a.until) { a.el.remove(); return false; } this.place(a); return true; });
  }
  showHand() {
    const G = this.guests.find(x => this.pos[x.i] === -1); if (!G || this.hand) return;
    const s = this.L.world.toScreen(V.copy(G.ch.root.position).setY(.4)), tgt = this.L.world.toScreen(this.standPos(0).setY(this.floorY(0) + .6));
    const el = this.hand = this.L.h('div', { class: 'ht-hand', html: ICON.hand });
    el.style.left = (s.x - 12) + 'px'; el.style.top = (s.y - 4) + 'px';
    el.style.setProperty('--hx', (tgt.x - s.x) + 'px'); el.style.setProperty('--hy', (tgt.y - s.y) + 'px');
    this.L.ui.hud.append(el);
  }

  // ── sound bits the shared kit doesn't have
  snd(kind, vol = 1) {
    const A = this.L.audio; if (A.muted) return;
    A.unlock?.(); const c = A.ctx; if (!c || c.state !== 'running' || !A.sfxBus) return;
    const t0 = c.currentTime, out = A.sfxBus;
    const tone = (type, f, f2, dur, v, at = 0, lp = 0) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0 + at); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + at + dur);
      g.gain.setValueAtTime(0, t0 + at); g.gain.linearRampToValueAtTime(v * vol, t0 + at + .005); g.gain.exponentialRampToValueAtTime(.0001, t0 + at + dur);
      let nd = o; if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); nd = fl; }
      nd.connect(g).connect(out); o.start(t0 + at); o.stop(t0 + at + dur + .02);
    };
    const noise = (dur, v, type, f, at = 0) => {
      const len = Math.ceil(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const s = c.createBufferSource(); s.buffer = buf; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f;
      const g = c.createGain(); g.gain.setValueAtTime(v * vol, t0 + at); g.gain.exponentialRampToValueAtTime(.0001, t0 + at + dur);
      s.connect(fl).connect(g).connect(out); s.start(t0 + at);
    };
    switch (kind) {
      case 'kick': tone('sine', 140, 44, .17, .32); break;
      case 'hat': noise(.035, .05, 'highpass', 6800); break;
      case 'snare': noise(.12, .12, 'bandpass', 1800); tone('triangle', 220, 160, .08, .08); break;
      case 'thump': tone('sine', 92, 36, .24, .5); noise(.14, .16, 'lowpass', 420); break;
      case 'bark': tone('sawtooth', 680, 360, .09, .2, 0, 1700); tone('sawtooth', 640, 340, .1, .2, .14, 1700); break;
      case 'hiss': noise(.42, .16, 'highpass', 3000); break;
      case 'bang': for (const at of [0, .15]) { tone('square', 170, 62, .08, .12, at, 900); noise(.09, .22, 'lowpass', 900, at); } break;
      case 'bell': tone('sine', 1568, 1560, .9, .22); tone('sine', 2350, 2340, .6, .08); tone('sine', 1975, 1970, .9, .16, .16); break;
      case 'cough': for (const at of [0, .2]) noise(.11, .2, 'bandpass', 900, at); break;
      case 'snore': tone('sawtooth', 70, 95, .7, .07, 0, 380); break;
      case 'switch': tone('square', 1200, 900, .03, .1, 0, 3000); noise(.04, .12, 'highpass', 2000); break;
      case 'shutter': tone('square', 1800, 1200, .02, .14, 0, 4000); noise(.09, .25, 'highpass', 2500); noise(.07, .2, 'highpass', 2500, .09); break;
    }
  }

  // ── per frame
  update(dt) {
    const L = this.L, W = L.world;
    this.t += dt; this.tw.update(dt);
    if (!this.rooms || !this.guests) return;   // (숨바꼭집, 10/18: on the web the stylesheet loads first and frames run meanwhile)
    this.lobby?.update(dt); for (const f of this.floors || []) f.update(dt);
    this.mong?.update(dt);
    if (this.evalT > 0) { this.evalT -= dt; if (this.evalT <= 0 && this.phase === 'checkin') this.refresh(true); }
    for (const G of this.guests) {
      const ch = G.ch;
      if (G.mode === 'hop' && G.hop) {
        const H = G.hop; H.t += dt;
        const k = clamp(H.t / H.dur, 0, 1), e = ease.inOutSine(k);
        ch.root.position.lerpVectors(H.from, H.to, e); ch.root.position.y += H.h * 4 * k * (1 - k);
        ch.root.scale.setScalar(Math.max(.01, H.s0 + (H.s1 - H.s0) * ease.outQuad(k)));
        ch.root.rotation.y = Math.sin(k * Math.PI) * .5 * Math.sign(H.to.x - H.from.x);
        if (k >= 1) { if (H.room === -9) { G.mode = 'photo'; G.hop = null; ch.root.rotation.y = 0; ch.squash = .35; } else this.landed(G); }
      } else if (G.mode === 'drag' && G.dragGoal) {
        const p = ch.root.position, vx = G.dragGoal.x - p.x;
        p.lerp(G.dragGoal, 1 - Math.exp(-dt * 22));
        ch.lean = clamp(-vx * .9, -.6, .6) + Math.sin(this.t * 7) * .06;
      } else if (G.mode === 'room') {
        const g = this.phase === 'morning' ? 0 : (G.yawGoal || 0);
        ch.root.rotation.y += (g - ch.root.rotation.y) * (1 - Math.exp(-dt * 6));
      }
      if (G.mode !== 'drag') ch.lean *= Math.exp(-dt * 10);
      ch.update(dt);
    }
    // rooms: shaking, lamp glow (night: only the party and the sleepless), drop frames
    const night = this.phase === 'night';
    for (const R of this.rooms) {
      if (R.shake > .01) { const dx = Math.sin(this.t * 60) * R.shake * .07, dy = Math.abs(Math.sin(this.t * 47)) * R.shake * .025; R.room.group.position.set(R.base.x + dx, R.base.y + dy, R.base.z); R.shake *= Math.exp(-dt * 7); R.shook = true; }
      else if (R.shook) { R.room.group.position.copy(R.base); R.shook = false; R.shake = 0; }
      const o = this.occ(R.idx), G = o >= 0 ? this.guests[o] : null;
      if (G && G.mode === 'room') G.ch.body.position.x = R.shook ? (R.room.group.position.x - R.base.x) / CS : 0;
      let goal = R.glowGoal && G?.mode === 'room' ? 1 : 0, col = R.glowColor;
      if (night && G) { const m = G.mood; goal = G.key === 'dj' ? 1.3 : m && !m.ok ? .9 : .35; col = G.key === 'dj' ? ['#ff7ad9', '#7ad7ff', '#ffe066', '#9dff8a'][Math.floor(this.t * 4) % 4] : m && !m.ok ? '#ff7a7a' : '#8fa8ff'; }
      if (this.phase === 'morning' && G) goal = G.mood?.ok ? 1 : 0;
      R.glowK += (goal - R.glowK) * (1 - Math.exp(-dt * 5));
      R.glow.material.color.set(col); R.pool.material.color.set(col);
      R.glow.material.opacity = R.glowK * .42; R.pool.material.opacity = R.glowK * .32;
      const fg = R.frameGoal * (R.frameGoal < 1 ? .55 + Math.sin(this.t * 5) * .25 : 1);
      R.frameK += (fg - R.frameK) * (1 - Math.exp(-dt * 14));
      R.frame.material.opacity = R.frameK * .9; R.frame.material.color.set(R.frameColor);
      const s = W.toScreen(V.set(this.colX(R.c) - RW / 2 + .2, this.floorY(R.f) + WALL_H - .12, RD / 2)); R.plate.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
    }
    this.lobbyK += (this.lobbyGoal - this.lobbyK) * (1 - Math.exp(-dt * 14)); this.lobbyFrame.material.opacity = this.lobbyK * .9;
    if (this.started && (this.phase === 'checkin' || this.phase === 'night')) this.stepLife(dt);
    // labels: names under waiting guests, moods over placed ones, stars in the morning
    for (const G of this.guests) {
      const ch = G.ch, inLobby = this.pos[G.i] === -1 && G.mode === 'lobby' && this.phase === 'checkin';
      G.label.classList.toggle('on', inLobby);
      if (inLobby) { const s = W.toScreen(V.copy(ch.root.position).setY(-.08)), dy = (this.lobbyIndex(G) % 2) * 11; G.label.style.transform = `translate(${s.x.toFixed(1)}px, ${(s.y + dy).toFixed(1)}px)`; G.label.classList.toggle('sel', this.sel === G.i); }
      if (G.mode === 'photo' && G.photoJump) ch.lift = Math.abs(Math.sin(this.t * 6 + G.i)) * .35;
      const show = (G.mode === 'room' && G.mood && (this.phase === 'checkin' || this.phase === 'night')) || (G.mode === 'drag' && G.pv);
      G.mk.classList.toggle('on', !!show);
      const head = V.copy(ch.root.position).setY(ch.root.position.y + (ch.headTop() + .1) * ch.root.scale.y + .08), hs = W.toScreen(head);
      if (show) {
        const key = G.mode === 'drag' ? 'pv' + G.pv.ok : 'm' + G.mood.ok;
        if (key !== G._mkKey) { const ok = G.mode === 'drag' ? G.pv.ok : G.mood.ok, pop = G.mk.classList.contains('pop') && G.mode !== 'drag'; G.mk.className = 'ht-mood on' + (G.mode === 'drag' ? ' pv' : '') + (ok ? ' ok' : ' no') + (pop ? ' pop' : ''); G.mk.innerHTML = ok ? SMILE : FROWN; G._mkKey = key; }
        G.mk.style.transform = `translate(${hs.x.toFixed(1)}px, ${hs.y.toFixed(1)}px)`;
      }
      if (G.starEl) G.starEl.style.transform = `translate(${hs.x.toFixed(1)}px, ${hs.y.toFixed(1)}px)`;
      if (this.sel === G.i && G.mode !== 'drag') ch.lift = Math.abs(Math.sin(this.t * 7)) * .12;
    }
    { const s = W.toScreen(V.set(0, this.floorY(this.Fn) + .05, RD / 2 + .3)); this.sign.style.left = s.x + 'px'; this.sign.style.top = s.y + 'px'; }
    if (this.bulbs) this.bulbs.forEach((b, k) => b.scale.setScalar(this.phase === 'night' || this.phase === 'end' ? 1 + .25 * Math.max(0, Math.sin(this.t * 5 + k * 1.7)) : 1));
    this.stepFx(dt);
  }
  // the live hotel: everyone's quirk keeps going (much louder once the lights are off)
  stepLife(dt) {
    const night = this.phase === 'night', K = night ? 1.6 : 1;
    const dj = this.guests.find(G => G.key === 'dj' && G.mode === 'room');
    if (dj) {
      this.beatT -= dt;
      if (this.beatT <= 0) {
        this.beatT += night ? .3 : .42; const b = this.beat++;
        this.snd(b % 2 ? (b % 4 === 3 ? 'snare' : 'hat') : 'kick', night ? .9 : .55);
        if (b % 2 === 0) dj.ch.bump(night ? .25 : .16);
        if (b % 2 === 0 || night) {
          const r = this.pos[dj.i], f = this.rf(r), c = this.rc(r), nb = [[f, c - 1], [f, c + 1], [f + 1, c], [f - 1, c]].filter(([ff, cc]) => ff >= 0 && ff < this.Fn && cc >= 0 && cc < C);
          if (nb.length) {
            const [ff, cc] = nb[(b >> 1) % nb.length], to = this.roomMid(ff * C + cc, ff > f ? .9 : ff < f ? 1.5 : 1.25);
            const from = this.standPos(r).setY(this.floorY(f) + 1.15);
            if (cc !== c) to.x = this.colX(cc) + (cc > c ? -.35 : .35);
            this.fly(from, to, ['♪', '♫', '♬'][b % 3], 'note', .95, 0, ['', 'n2', 'n3'][(b >> 1) % 3]);
          }
        }
      }
    }
    for (const G of this.guests) {
      if (G.mode !== 'room' || !G.mood) continue;
      G.pt -= dt * K; if (G.pt > 0) continue;
      const m = G.mood, k = G.key, ch = G.ch;
      if (k === 'panda') { G.pt = rnd(1.5, 1.9); this.stomp(G); continue; }
      if (k === 'dj') { G.pt = 3; if (night) this.say(ch, ['둠칫둠칫!', '한 곡 더!', '파티 타임~'][Math.floor(Math.random() * 3)], 800); continue; }
      if (!m.ok) {
        if (k === 'sleepy' || k === 'shiba') { G.pt = rnd(2.1, 2.6); this.complain(G, m, false); }
        else if (CATS.has(k) && m.why === 'dog') G.pt = 9;
        else if (m.why === 'fight') { G.pt = rnd(2.2, 2.8); this.complain(G, m, false); }
        else { G.pt = rnd(3.5, 4.5); this.complain(G, m, false); }
        continue;
      }
      if (k === 'sleepy') { G.pt = rnd(2.2, 3); this.pop(V.copy(ch.root.position).add(new THREE.Vector3(-.25, 1.0, .2)), night ? ['드르렁~', 'Zz', '쿨…'][Math.floor(Math.random() * 3)] : ['z', 'Zz', 'zZ'][Math.floor(Math.random() * 3)], 'zz', 1500); if (night) this.snd('snore', .8); }
      else if (GUESTS[k].pal && !this.ev.fight) { G.pt = rnd(2.2, 2.8); ch._fx(this.tw, 'heart', { y: 1.0, s: .8 }); if (k === 'bunny') this.heartBridge(G, this.guests[m.pal]); }
      else if (night) { G.pt = rnd(2.4, 3.2); this.pop(V.copy(ch.root.position).add(new THREE.Vector3(-.25, 1.0, .2)), 'Zz', 'zz', 1500); }
      else G.pt = rnd(4, 6);
    }
  }

  exit() {
    this.dead = true; const W = this.L.world;
    this.app.removeEventListener('pointerdown', this._pd);
    removeEventListener('pointermove', this._pm); removeEventListener('pointerup', this._pu); removeEventListener('pointercancel', this._pu);
    removeEventListener('resize', this._rs);
    W.inputEnabled = true; W.camLock = false;
    this.app.classList.remove('ht', 'ht-night', 'ht-morning');
    for (const o of [this.hotel, this.mong?.root, ...this.guests.map(G => G.ch.root)].filter(Boolean)) { W.root.remove(o); disposeTree(o); }
    for (const f of this.fxs) f.el.remove(); for (const a of this.anch) a.el.remove();
    for (const G of this.guests) { G.label.remove(); G.mk.remove(); G.starEl?.remove(); }
    for (const R of this.rooms || []) R.plate.remove();
    this.sign?.remove(); this.hand?.remove(); this.flash?.remove();
    if (this.tex) for (const k in this.tex) this.tex[k].dispose();
    this.cssLink?.remove();
  }

  // ── bots (QA): pick a guest, tap a room — like a player — then press the same buttons
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 1.6 && this.L.ui.panelOpen) { this._endT = 0; (this.result === 'win' ? this.nextBtn : this.againBtn)?.press(); } return; }
    if (!this.started) return;
    this._bt = (this._bt ?? .5) - dt; if (this._bt > 0) return;
    if (this.phase === 'morning') { if (this.btn.style.visibility !== 'hidden') { this._bt = 1.2; this.btn.press(); } return; }
    if (this.phase !== 'checkin' || this.drag || this.evalT > 0) return;
    this._bt = mode === 'random' ? .5 : .7;
    const here = this.guests.filter(G => this.present(G.i)), lobby = here.filter(G => this.pos[G.i] === -1);
    const open = [...Array(this.nR).keys()].filter(r => !this.closed(r));
    if (mode === 'random') {
      if (this._rn !== this.n) { this._rn = this.n; this._tries = this.budget; }
      if (lobby.length) { const G = lobby[Math.floor(Math.random() * lobby.length)], free = open.filter(r => this.occ(r) < 0); this.select(G.i); this.tapRoom(free[Math.floor(Math.random() * free.length)]); return; }
      if (this._tries > 0) { this._tries--; if (Math.random() < .5 && this.movesLeft() > 0) { const G = here[Math.floor(Math.random() * here.length)], r = open[Math.floor(Math.random() * open.length)]; if (r !== this.pos[G.i]) { this.select(G.i); this.tapRoom(r); } } return; }
      this.btn.press(); return;
    }
    // smart: tonight's targets from the trip plan (re-planned from here if the night went off-plan)
    let tgt = this.plan?.[this.n];
    const keys = here.map(G => G.key), sameSet = tgt && tgt.keys.length === keys.length && tgt.keys.every(k => keys.includes(k));
    if (!sameSet || !this._planOk) {
      const ordered = here.map(G => G.key), pos = here.map(G => this.pos[G.i]);
      const p = this.planTrip(this.n, ordered, pos) || null; if (p) { const old = this.plan || []; this.plan = [...Array.from({ length: this.n }, (_, k) => old[k] || null), ...p]; } tgt = p ? this.plan[this.n] : null; this._planOk = true;
    }
    if (!tgt) { this.btn.press(); return; }
    const want = G => tgt.rooms[tgt.keys.indexOf(G.key)];
    const wrong = here.filter(G => this.pos[G.i] !== want(G));
    if (!wrong.length) { this._planOk = false; this.btn.press(); return; }
    // placed guests first (to their targets, swapping if that's where the other one belongs), then the lobby
    const G = wrong.find(G => this.pos[G.i] >= 0 && this.occ(want(G)) < 0) || wrong.find(G => this.pos[G.i] >= 0 && this.occ(want(G)) >= 0 && want(this.guests[this.occ(want(G))]) === this.pos[G.i])
      || wrong.find(G => this.pos[G.i] === -1 && this.occ(want(G)) < 0) || wrong[0];
    this.select(G.i); this.tapRoom(want(G));
  }
  // the random bot's policy over many whole trips, scored by the game's own rules (fast, no animation)
  simulate(N) {
    const save = this.guests, nights = this.trip.nights; let wins = 0, sum = 0;
    for (let k = 0; k < N; k++) {
      let keys = [], pos = [], st = 0, mx = 0;
      for (const nt of nights) {
        const ev = nt.ev || {}, keep = keys.map(x => !(nt.out || []).includes(x));
        pos = pos.filter((_, i) => keep[i]).map(r => (ev.closed || []).includes(r) ? -1 : r); keys = keys.filter((_, i) => keep[i]);
        for (const x of nt.in || []) if (!keys.includes(x)) { keys.push(x); pos.push(-1); }
        const open = [...Array(this.nR).keys()].filter(r => !(ev.closed || []).includes(r));
        for (let i = 0; i < keys.length; i++) if (pos[i] < 0) { const free = open.filter(r => !pos.includes(r)); pos[i] = free[Math.floor(Math.random() * free.length)]; }
        let left = nt.budget;
        for (let b = 0; b < nt.budget; b++) { if (Math.random() < .5 || left <= 0) continue; const i = Math.floor(Math.random() * keys.length), r = open[Math.floor(Math.random() * open.length)]; if (r === pos[i]) continue; const o = pos.indexOf(r), sv = pos[i]; pos[i] = r; if (o >= 0) pos[o] = sv; left--; }
        this.guests = keys.map(key => ({ key }));
        const m = this.evalMoods(pos, ev); st += m.reduce((a, x) => a + (x.ok ? 3 : 1), 0); mx += 3 * keys.length;
      }
      this.guests = save; sum += st / mx; if (st / mx >= BAR - 1e-9) wins++;
    }
    this.guests = save;
    return { trips: N, randomWin: +(wins / N * 100).toFixed(1), avgStars: +(sum / N * 100).toFixed(1) };
  }
  state() {
    const here = this.guests.filter(G => this.present(G.i));
    return { scene: 'hotel', lv: this.lvIdx + 1, night: this.n + 1, nights: this.trip.nights.length, phase: this.phase, result: this.result,
      happy: here.filter(G => G.mood?.ok).length, total: here.length, moves: this.movesUsed || 0, budget: this.budget || 0, stars: this.stars, maxStars: this.maxStars };
  }
  get api() {
    return {
      place: (key, r) => { const G = this.guests.find(x => x.key === key); return G ? this.dropGuest(G.i, r) : false; },
      lights: () => this.mainBtn(), next: () => this.mainBtn(),
      pos: () => Object.fromEntries(this.guests.filter(G => this.present(G.i)).map(G => [G.key, this.pos[G.i]])),
      moods: () => Object.fromEntries(this.guests.filter(G => this.present(G.i)).map(G => [G.key, G.mood ? (G.mood.ok ? 'ok' : G.mood.why) : null])),
      plan: () => this.plan?.map(p => p.keys.map((k, i) => k + ':' + roomNo(p.rooms[i])).join(' ')),
      rooms: () => this.rooms.map(R => { const s = this.L.world.toScreen(this.roomMid(R.idx, 1.0)); return { no: roomNo(R.idx), x: Math.round(s.x), y: Math.round(s.y) }; }),
      sim: (N = 2000) => this.simulate(N),
      lobby: () => this.guests.filter(G => this.pos[G.i] === -1).map(G => { const s = this.L.world.toScreen(V.copy(G.ch.root.position).setY(.45)); return { key: G.key, x: Math.round(s.x), y: Math.round(s.y) }; }),
    };
  }
}
const SMILE = '<svg viewBox="0 0 24 24"><circle cx="8.3" cy="10" r="2" fill="#fff"/><circle cx="15.7" cy="10" r="2" fill="#fff"/><path d="M7 14q5 5 10 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>';
const FROWN = '<svg viewBox="0 0 24 24"><path d="M5.5 7.5l4.5 2.2M18.5 7.5L14 9.7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M7 17.5q5-5 10 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>';

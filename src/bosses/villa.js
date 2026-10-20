// ② 몽글 빌라 방 배정 — a cut-away villa (a dollhouse section: two or three floors of little rooms) gets new tenants.
// Drag a tenant's card from the tray into a room (or tap the card, then a room). Drag a tenant in the villa to move it:
// onto someone = they swap, onto the tray = back out. Every tenant has ONE quirk and reacts the moment it lands:
//   둠칫이 dj      loud music — noise in the rooms beside, above and below
//   졸졸이 sleepy  hates noise — wakes up angry and bangs the wall / ceiling
//   판다 panda     heavy steps — noise in the room right below (층간소음)
//   멍뭉이 shiba   a cat next door → barking and hissing, both unhappy
//   냥냥이 cat     wants the top floor (and is a cat)
//   토순이·곰돌이  단짝 — happy only right next door to each other (same floor)
// Everyone happy = the villa lights up and celebrates. 이사 기회 (a move budget) ends the day; stars by moves.
import * as THREE from 'three';
import { MapRooms } from '../map.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { makeFurniture } from '../gfx/furniture.js';
import { ICON } from '../ui.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree, fadeDisc } from '../gfx/kit.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });

const RW = 3, RD = 3, WALL_H = 2.2, FH = WALL_H + .5;   // a room is 3×3 tiles; every floor stands on its own slab
const CS = 1.65;                                       // tenants are drawn bigger than in the hide-and-seek rooms
const STAND = [.15, .5];                               // where a tenant stands in its room (local x, z)
const DRAG_Z = RD / 2 + .9;                            // a lifted tenant dangles in front of the villa
const LIFT_PX = 26;                                    // …a little above the finger, so the finger doesn't hide it
const PITCH = .26, YAW = 0;
const DUSK = { ambColor: '#dccfff', amb: 1.3, sunColor: '#ffdcb8', sun: 1.8 };
const PARTY = { ambColor: '#a3a2ea', amb: 1.15, sunColor: '#ffe3bd', sun: 1.25 };   // night falls, every room's lamp is on
const CATS = new Set(['cat', 'cheese']);
const V = new THREE.Vector3();

// the tenants: one quirk each, a tag on the card, one short line the first time they arrive
const TAG = {
  note: '<svg viewBox="0 0 20 20"><path d="M8 15.5V5l8-2v9.5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linejoin="round"/><ellipse cx="5.6" cy="15.6" rx="2.9" ry="2.3" fill="#fff"/><ellipse cx="13.6" cy="13" rx="2.9" ry="2.3" fill="#fff"/></svg>',
  up: '<svg viewBox="0 0 20 20"><path d="M10 16V5M5 9.5L10 4.5l5 5" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  heart: '<svg viewBox="0 0 20 20"><path d="M10 16.5C4 12.5 2.5 9.5 3.6 7 4.8 4.4 8.3 4.3 10 7c1.7-2.7 5.2-2.6 6.4 0 1.1 2.5-.4 5.5-6.4 9.5z" fill="#fff"/></svg>',
};
const TEN = {
  dj: { kind: 'dj', name: '둠칫이', tag: TAG.note, color: '#9b7bff', line: '음악 소리가 옆·위·아래 집까지 쿵짝' },
  sleepy: { kind: 'sleepy', name: '졸졸이', tag: 'Zz', color: '#6f9bff', line: '잠꾸러기 · 시끄러우면 깨서 화내요' },
  cat: { kind: 'cat', name: '냥냥이', tag: TAG.up, color: '#ffad3b', line: '높은 곳 좋아 · 꼭대기 층에 살래요' },
  panda: { kind: 'panda', name: '판다', tag: '쿵', color: '#7d7a8c', line: '발소리 쿵쿵 · 바로 아랫집이 괴로워요' },
  shiba: { kind: 'shiba', name: '멍뭉이', tag: '멍', color: '#ff7a4d', line: '옆집에 고양이가 오면 서로 싸워요' },
  bunny: { kind: 'bunny', name: '토순이', tag: TAG.heart, color: '#ff6f9c', line: '곰돌이랑 단짝 · 바로 옆집이 좋아요', pal: 'bear' },
  bear: { kind: 'bear', name: '곰돌이', tag: TAG.heart, color: '#ff6f9c', line: '토순이랑 단짝 · 바로 옆집이 좋아요', pal: 'bunny' },
};

// six little homes; each level hangs them on its floors in its own order (furniture stays at the back so the tenant,
// standing front and centre, is never hidden)
const VB = '#e9c9a7';   // the villa's slabs
const ROOMS = [
  { th: 'bunny', furn: [F('bed', 0, 0), F('drawers', 2, 0), F('plant', 2, 2)], decor: [D('picture', 'N', .75)] },
  { th: 'bear', furn: [F('lamp', 0, 0), F('sofa2', 1, 0), F('rug', 1, 1)], decor: [D('clock', 'N', -1.0)] },
  { th: 'peng', furn: [F('bookshelf', 0, 0, 0, { seed: 7 }), F('desk', 1, 0), F('beanbag', 2, 2)], decor: [] },
  { th: 'cat', furn: [F('cattower', 0, 0), F('recordcab', 2, 0), F('catbed', 0, 2)], decor: [D('window', 'N', .55)] },
  { th: 'my', furn: [F('wardrobe', 0, 0), F('drawers', 1, 0), F('monstera', 2, 0)], decor: [D('window', 'N', .2)] },
  { th: 'apt', furn: [F('minikitchen', 0, 0), F('minifridge', 2, 0), F('zabuton', 0, 2)], decor: [] },
];
// three villas. F floors × C rooms, the tenants (in tray order), spare moves on top of the minimum, room styles by index
// (floor 0 = ground, left to right). Solutions / random odds: see the QA report (qa/villa-*.json).
const LEVELS = [
  { name: '첫 입주', sub: '모두가 행복한 빌라를 만들어 줘!', F: 2, C: 2, ten: ['dj', 'sleepy', 'cat'], spare: 5, rooms: [1, 0, 2, 3] },
  { name: '새 이웃', sub: '판다랑 멍뭉이도 이사 왔어요', F: 3, C: 2, ten: ['dj', 'sleepy', 'panda', 'shiba', 'cat'], spare: 5, rooms: [4, 1, 0, 5, 3, 2] },
  { name: '꽉 찬 빌라', sub: '단짝 토순이·곰돌이까지 여섯 집!', F: 3, C: 2, ten: ['sleepy', 'panda', 'shiba', 'cat', 'bunny', 'bear'], spare: 6, rooms: [5, 0, 2, 1, 4, 3] },
];

const SMILE = '<svg viewBox="0 0 24 24"><circle cx="8.3" cy="10" r="2" fill="#fff"/><circle cx="15.7" cy="10" r="2" fill="#fff"/><path d="M7 14q5 5 10 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>';
const FROWN = '<svg viewBox="0 0 24 24"><path d="M5.5 7.5l4.5 2.2M18.5 7.5L14 9.7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M7 17.5q5-5 10 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.fxs = []; this.anch = []; this.bubbles = new Map(); }

  // ── setup
  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world, ui = L.ui;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx];
    this.Fn = LV.F; this.Cn = LV.C; this.nR = LV.F * LV.C;
    const seen = new Set(LEVELS.slice(0, this.lvIdx).flatMap(l => l.ten));
    this.ten = LV.ten.map((key, i) => ({ key, i, def: TEN[key], isNew: !seen.has(key), mode: 'tray', pt: rnd(.2, 1.2), mood: null, room: -1 }));
    this.pos = this.ten.map(() => -1); this.moves = 0; this.opt = this.ten.length; this.budget = this.opt + LV.spare;
    this.result = null; this.sel = null; this.drag = null; this.evalT = 0; this.beatT = 0; this.beat = 0;
    this.sols = this.solveAll();
    if (!this.sols.length) console.warn('villa: level', this.lvIdx + 1, 'has no solution');
    this.app = document.getElementById('app'); this.app.classList.add('vl');
    W.setLight(DUSK);
    this.tex = { glow: fadeDisc(128, '#ffffff', r => 1 - r * .76, { cx: .5, cy: .34 }),
      frame: canvasTexture(256, 200, (x, w, h) => { const r = 26, i = 9; x.beginPath(); x.roundRect(i, i, w - 2 * i, h - 2 * i, r); x.fillStyle = 'rgba(255,255,255,.2)'; x.fill(); x.lineWidth = 11; x.strokeStyle = '#ffffff'; x.stroke(); }) };
    this.buildVilla();
    this.buildChars();
    L.makeThumbs({ faces: this.ten.map(T => [T.def.kind, 'normal']) });
    this.buildHud();
    this.frame(); this._rs = () => this.frame(); addEventListener('resize', this._rs);
    this.bindInput();
    this.refresh(false);
    W.idsDirty = true; W.shadowDirty = true;
    await ui.banner(LV.name, LV.sub, 1250);
    if (this.dead) return;
    this.started = true;
    this.arrivals();
  }
  colX(c) { return (c - (this.Cn - 1) / 2) * RW; }
  rf(idx) { return Math.floor(idx / this.Cn); }
  rc(idx) { return idx % this.Cn; }
  standPos(idx, out = new THREE.Vector3()) { return out.set(this.colX(this.rc(idx)) + STAND[0], this.rf(idx) * FH, STAND[1]); }
  roomMid(idx, y = 1.0) { return new THREE.Vector3(this.colX(this.rc(idx)), this.rf(idx) * FH + y, 0); }

  buildVilla() {
    const W = this.L.world, LV = this.lv, g = this.villa = new THREE.Group(); W.root.add(g);
    this.floors = []; this.rooms = [];
    for (let f = 0; f < this.Fn; f++) {
      const defs = [];
      for (let c = 0; c < this.Cn; c++) {
        const R = ROOMS[LV.rooms[f * this.Cn + c] % ROOMS.length];
        const theme = { ...THEMES[R.th], base: VB };
        defs.push({ at: [this.colX(c), 0], level: 0, layout: { w: RW, d: RD, theme, wallH: WALL_H, tidy: true,
          walls: { N: 'wall', S: 'none', W: c === 0 ? 'wall' : 'none', E: 'wall' }, furniture: R.furn, decor: R.decor } });
      }
      const map = new MapRooms(W, { theme: defs[0].layout.theme, bleed: false, rooms: defs });
      map.group.position.y = f * FH; g.add(map.group); this.floors.push(map);
      map.rooms.forEach((room, c) => {
        const idx = f * this.Cn + c, x = this.colX(c), y0 = f * FH;
        // a warm lamp glow on the back wall: on while the tenant there is happy, full on at the party
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(RW - .3, WALL_H - .05), new THREE.MeshBasicMaterial({ map: this.tex.glow, color: '#ffc46b', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        glow.position.set(x, y0 + WALL_H / 2, -RD / 2 + .12); glow.renderOrder = 3; g.add(glow);
        const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 36), new THREE.MeshBasicMaterial({ map: this.tex.glow, color: '#ffb35c', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        pool.rotation.x = -Math.PI / 2; pool.scale.set(1.25, .8, 1); pool.position.set(x + STAND[0], y0 + .03, STAND[1] - .1); pool.renderOrder = 3; g.add(pool);
        // the drop frame over the open front (shown while something is carried over this room)
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(RW - .1, WALL_H + .35), new THREE.MeshBasicMaterial({ map: this.tex.frame, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
        frame.position.set(x, y0 + WALL_H / 2 - .1, RD / 2 + .08); frame.renderOrder = 6; g.add(frame);
        const wash = new THREE.Mesh(new THREE.PlaneGeometry(RW - .15, WALL_H), new THREE.MeshBasicMaterial({ map: this.tex.glow, color: '#ff9f4a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        wash.position.set(x, y0 + WALL_H / 2, RD / 2 - .25); wash.renderOrder = 4; g.add(wash);
        this.rooms.push({ room, f, c, idx, base: room.group.position.clone(), shake: 0, glow, pool, wash, glowK: 0, frame, frameK: 0, frameGoal: 0, party: 0 });
      });
    }
    // the roof: a little rooftop with a water tank and a laundry line, behind a rail
    const roofT = { ...THEMES.my, base: VB, floorKind: 'grass', floor: '#9ad47a', floor2: '#7fbf63', wood: '#fff3e2', woodD: '#e8c9a7' };
    const w = this.Cn * RW, furn = this.Cn >= 2 ? [F('watertank', 0, 0), F('rooftopgarden', 1, 0), F('laundryline', w - 3, 0), F('outdoorunit', w - 1, 0)] : [F('watertank', 0, 0)];
    const roof = this.roof = new MapRooms(W, { theme: roofT, bleed: false, rooms: [{ at: [0, 0], level: 0, layout: { w, d: RD, theme: roofT, wallH: 1, walls: { N: 'rail', S: 'rail', W: 'rail', E: 'rail' }, furniture: furn, decor: [] } }] });
    roof.group.position.y = this.Fn * FH; g.add(roof.group);
    g.updateMatrixWorld(true);
  }
  buildChars() {
    const W = this.L.world;
    for (const T of this.ten) {
      const ch = T.ch = new Char(T.def.kind);
      ch.root.scale.setScalar(CS); ch.root.visible = false; W.root.add(ch.root);
      T.mk = this.L.h('div', { class: 'vl-mood' }); this.L.ui.wui.append(T.mk);
      if (T.key === 'dj') {
        const sp = T.speaker = makeFurniture('speaker', THEMES.my).group; sp.scale.setScalar(.5); sp.visible = false; W.root.add(sp);
      }
    }
  }
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col();
    const top = this.topEl = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, '몽글 빌라', h('small', {}, `${this.lvIdx + 1}단지 · ${this.lv.name}`)));
    this.movesEl = h('div', { class: 'vl-moves' }, h('span', { class: 'ico', html: ICON.box }), '이사', this.movesN = h('b', {}, String(this.budget)));
    this.starEls = [0, 1, 2].map(() => h('i', { html: ICON.star }));
    top.append(h('div', { class: 'vl-topr' }, this.movesEl, h('div', { class: 'vl-stars' }, ...this.starEls)));
    col.append(top);
    this.info = h('div', { class: 'vl-info' }, '');
    this.cards = this.ten.map(T => {
      const c = h('div', { class: 'vl-card', style: `--tc:${T.def.color}` }, h('img', { src: L.thumbs[`face_${T.def.kind}_normal`] }), h('span', { class: 'nm' }, T.def.name), h('i', { class: 'tag', html: T.def.tag }),
        T.isNew ? (T.newEl = h('em', { class: 'new' }, 'NEW')) : null);
      c.style.visibility = 'hidden';
      c.addEventListener('pointerdown', e => this.cardDown(e, T));
      return c;
    });
    this.tray = h('div', { class: 'vl-tray' }, this.info, this.cardRow = h('div', { class: 'vl-cards' }, ...this.cards));
    // the tray itself: a tap there with a placed tenant picked puts it back
    this.tray.addEventListener('pointerdown', e => { e.stopPropagation(); if (this.sel != null && this.pos[this.sel] >= 0 && this.canAct()) { this.dropTenant(this.sel, -1); this.select(null); } });
    col.append(this.tray);
    this.sign = h('div', { class: 'vl-sign' }, '몽글 빌라'); ui.wui.append(this.sign);
    this.setInfo('');
  }
  // the camera: a near-frontal dollhouse view, the whole villa between the top bar and the tray
  frame() {
    const W = this.L.world, cp = Math.cos(PITCH), sp = Math.sin(PITCH);
    const top = this.Fn * FH + 1.45, bot = -.55, zb = RD / 2 + .32, zt = -RD / 2;
    const vTop = top * cp - zt * sp, vBot = bot * cp - zb * sp, vExt = vTop - vBot, vMid = (vTop + vBot) / 2;
    const H = W.H || innerHeight, a = (W.W || innerWidth) / H;
    const tb = this.topEl ? this.topEl.getBoundingClientRect().bottom : 70, tr = this.tray ? this.tray.getBoundingClientRect().top : H * .8;
    const avail = Math.max(.3, (tr - tb - 18) / H), cy = clamp(((tb + tr) / 2 + 4) / H, .3, .7);
    const viewH = Math.max(vExt / avail, (this.Cn * RW + 1.0) / a);
    W.yaw = YAW; W.pitch = PITCH; W.zoom = 1; W.yawGoal = null; W.vYaw = 0;
    W.target.set(0, vMid / cp, 0); W.home.copy(W.target);
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(viewH * .94 * a, 0, cy);
    W.updateCam?.();
  }

  // ── rules: the mood of every placed tenant { ok, why, src, dir }. Pure: the bots and the hover preview use it too.
  evalMoods(pos) {
    const C = this.Cn, Fn = this.Fn, ten = this.ten, occ = new Array(this.nR).fill(-1);
    pos.forEach((r, i) => { if (r >= 0) occ[r] = i; });
    const at = (f, c) => (f < 0 || f >= Fn || c < 0 || c >= C) ? -1 : occ[f * C + c];
    const is = (j, key) => j >= 0 && ten[j].key === key;
    return pos.map((r, i) => {
      if (r < 0) return null;
      const k = ten[i].key, f = Math.floor(r / C), c = r % C;
      const side = [at(f, c - 1), at(f, c + 1)].filter(j => j >= 0), up = at(f + 1, c), dn = at(f - 1, c);
      if (k === 'sleepy') {
        const s = side.find(j => is(j, 'dj'));
        if (s != null) return { ok: false, why: 'dj', src: s, dir: 'side' };
        if (is(up, 'dj')) return { ok: false, why: 'dj', src: up, dir: 'up' };
        if (is(dn, 'dj')) return { ok: false, why: 'dj', src: dn, dir: 'down' };
        if (is(up, 'panda')) return { ok: false, why: 'panda', src: up, dir: 'up' };
        return { ok: true };
      }
      if (k === 'shiba') { const s = side.find(j => CATS.has(ten[j].key)); return s != null ? { ok: false, why: 'cat', src: s } : { ok: true }; }
      if (CATS.has(k)) {
        const s = side.find(j => is(j, 'shiba'));
        if (s != null) return { ok: false, why: 'dog', src: s };
        if (k === 'cat' && f !== Fn - 1) return { ok: false, why: 'low' };
        return { ok: true };
      }
      if (TEN[k].pal) { const s = side.find(j => is(j, TEN[k].pal)); return s != null ? { ok: true, pal: s } : { ok: false, why: 'alone' }; }
      return { ok: true };
    });
  }
  solved(pos) { return pos.every(p => p >= 0) && this.evalMoods(pos).every(m => m.ok); }
  solveAll() {
    const n = this.ten.length, N = this.nR, out = [], cur = [], used = new Array(N).fill(false);
    const rec = () => {
      if (cur.length === n) { if (this.solved(cur)) out.push(cur.slice()); return; }
      for (let r = 0; r < N; r++) if (!used[r]) { used[r] = true; cur.push(r); rec(); cur.pop(); used[r] = false; }
    };
    rec(); return out;
  }
  occ(r) { return this.pos.indexOf(r); }
  // where everyone would be if tenant i were dropped on dest (dest's tenant swaps into i's old place)
  hypo(i, dest) { const p = this.pos.slice(), src = p[i], o = dest >= 0 ? p.indexOf(dest) : -1; p[i] = dest; if (o >= 0 && o !== i) p[o] = src; return p; }
  starsFor(m) { return m <= this.opt + 1 ? 3 : m <= this.opt + 3 ? 2 : 1; }

  // ── input: drag a card / a tenant, or tap to pick then tap a room
  bindInput() {
    const W = this.L.world;
    W.inputEnabled = false; W.camLock = true;
    this._pd = e => this.worldDown(e); this._pm = e => this.ptrMove(e); this._pu = e => this.ptrUp(e);
    this.app.addEventListener('pointerdown', this._pd);
    addEventListener('pointermove', this._pm); addEventListener('pointerup', this._pu); addEventListener('pointercancel', this._pu);
  }
  canAct() { return this.started && !this.result && !this.failing && !this.dead && this.moves < this.budget; }
  worldDown(e) {
    if (e.button > 0 || !this.canAct() || this.drag) return;
    if (e.target.closest?.('.btn, .vl-tray, .panel, #overlay.on')) return;
    const r = this.roomAt(e.clientX, e.clientY);
    this.drag = { id: e.pointerId, tid: r >= 0 ? this.occ(r) : -1, from: 'world', room: r, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, moved: false, hover: null };
  }
  cardDown(e, T) {
    e.stopPropagation();
    if (e.button > 0 || !this.canAct() || this.drag) return;
    this.drag = { id: e.pointerId, tid: T.i, from: 'card', x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, moved: false, hover: null };
    this.touchCard(T);
  }
  ptrMove(e) {
    const d = this.drag; if (!d || e.pointerId !== d.id) return;
    d.x = e.clientX; d.y = e.clientY;
    if (!d.moved && d.tid >= 0 && Math.hypot(d.x - d.x0, d.y - d.y0) > 9) { d.moved = true; this.lift(d.tid, d); }
    if (d.moved) this.dragTo(d);
  }
  ptrUp(e) {
    const d = this.drag; if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (d.moved) { const dest = e.type === 'pointercancel' ? null : this.dropAt(e.clientX, e.clientY); this.endHover(); this.dropTenant(d.tid, dest); return; }   // (cancelled — the OS, or the 잠깐! menu: back where it was, as in 몽글 호텔 — 외부 QA 10/20)
    if (e.type === 'pointercancel') return;
    if (d.from === 'card') { this.select(this.sel === d.tid ? null : d.tid); return; }
    this.tapRoom(d.room);
  }
  // a tap on a room: with someone picked, they move in there; otherwise pick whoever lives there
  tapRoom(r) {
    if (!this.canAct()) return;
    if (r < 0) { this.select(null); return; }
    const o = this.occ(r);
    if (this.sel != null) {
      if (o === this.sel) { this.select(null); return; }
      const s = this.sel; this.select(null); this.dropTenant(s, r); return;
    }
    if (o >= 0) { this.select(o); this.touchCard(this.ten[o]); return; }
    this.setInfo('아래 카드를 이 방으로 드래그해요', 'flash');
  }
  select(i) {
    if (this.sel === i) return;
    if (this.sel != null) this.cards[this.sel]?.classList.remove('sel');
    this.sel = i;
    for (const R of this.rooms) { R.frameGoal = i != null ? .35 : 0; R.frameColor = '#ffffff'; }
    if (i != null) { this.cards[i].classList.add('sel'); this.L.audio.sfx('tap'); const T = this.ten[i]; if (T.mode === 'room') T.ch.bump(.3); }
  }
  touchCard(T) {
    if (T.newEl) { T.newEl.remove(); T.newEl = null; }
    this.introStop = true; this.hand?.remove(); this.hand = null;
    this.setInfo(this.quirkHtml(T), T.isNew && !T.seen ? 'new' : '');
    T.seen = true;
  }
  quirkHtml(T) { return `<b style="--tc:${T.def.color}">${T.def.name}</b> ${T.def.line}`; }
  setInfo(html, cls = '') {
    if (!html) {
      const n = this.ten.length, ok = this.ten.filter(T => T.mood?.ok).length, left = this.pos.filter(p => p < 0).length;
      html = this.lvIdx === 0 && this.moves === 0 ? '카드를 드래그해서 방에 넣어 주세요' : left ? `행복한 이웃 <b>${ok}</b> / ${n} · 남은 입주자 ${left}명` : `행복한 이웃 <b>${ok}</b> / ${n}`;
    }
    this.info.innerHTML = html; this.info.className = 'vl-info';
    if (cls) { void this.info.offsetWidth; this.info.classList.add(...cls.split(' ')); }
  }
  roomAt(x, y) {
    const p = this.planeAt(x, y, 0); if (!p) return -1;
    const c = Math.floor((p.x + this.Cn * RW / 2) / RW), f = Math.floor((p.y + .5) / FH);
    if (c < 0 || c >= this.Cn || f < 0 || f >= this.Fn) return -1;
    return f * this.Cn + c;
  }
  planeAt(x, y, z) {
    const W = this.L.world; W.raycaster.setFromCamera(W.ndc(x, y), W.cam);
    const out = new THREE.Vector3(); return W.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z), out);
  }
  trayTop() { return this.tray.getBoundingClientRect().top; }
  dropAt(x, y) { return y > this.trayTop() - 6 ? -1 : this.roomAt(x, y - LIFT_PX); }
  cardWorld(T) { const b = this.cards[T.i].getBoundingClientRect(); return this.planeAt(b.left + b.width / 2, b.top + b.height * .55, DRAG_Z) || new THREE.Vector3(0, -3, DRAG_Z); }
  lift(i, d) {
    const T = this.ten[i], ch = T.ch, L = this.L;
    this.select(null);
    if (T.mode === 'tray' || !ch.root.visible) {
      const p = this.planeAt(d.x, d.y - LIFT_PX, DRAG_Z); if (p) ch.root.position.copy(p);
      ch.root.visible = true; ch.root.scale.setScalar(.01); T.grow = 0;
      this.cards[i].classList.add('out'); this.L.world.idsDirty = true;
    }
    T.mode = 'drag'; T.hop = null; ch.pose = 'flail'; ch.setFace('wow'); ch.body.position.x = 0;
    if (d.from !== 'card') this.touchCard(T);
    if (T.speaker) T.speaker.visible = false;
    this.hideBubble(ch);
    L.audio.sfx('lift');
    this.dragTo(d);
  }
  dragTo(d) {
    const T = this.ten[d.tid];
    T.dragGoal = this.planeAt(d.x, d.y - LIFT_PX, DRAG_Z);
    const dest = this.dropAt(d.x, d.y);
    if (dest !== d.hover) { d.hover = dest; this.hover(T, dest); }
  }
  // the carried tenant's own face says whether it would like that room; the room's frame shows where it lands
  hover(T, dest) {
    const reach = new Set();
    if (dest != null && dest >= 0 && (T.key === 'dj' || T.key === 'panda')) {
      const f = this.rf(dest), c = this.rc(dest), nb = T.key === 'dj' ? [[f, c - 1], [f, c + 1], [f + 1, c], [f - 1, c]] : [[f - 1, c]];
      for (const [ff, cc] of nb) if (ff >= 0 && ff < this.Fn && cc >= 0 && cc < this.Cn) reach.add(ff * this.Cn + cc);
    }
    for (const R of this.rooms) { R.frameGoal = R.idx === dest ? 1 : reach.has(R.idx) ? .7 : 0; R.frameColor = reach.has(R.idx) ? '#c6a8ff' : '#ffffff'; }
    this.tray.classList.toggle('drop', dest === -1);
    const ch = T.ch;
    if (dest == null || dest < 0) { ch.setFace('wow'); T.pv = null; return; }
    const m = this.evalMoods(this.hypo(T.i, dest))[T.i];
    T.pv = m;
    const R = this.rooms[dest]; R.frameColor = m.ok ? '#c8ffd8' : '#ffd0d6';
    ch.setFace(m.ok ? 'happy' : this.badFace(T, m));
    this.L.audio.sfx('tick');
  }
  endHover() { for (const R of this.rooms) { R.frameGoal = this.sel != null ? .35 : 0; R.frameColor = '#ffffff'; } this.tray.classList.remove('drop'); }

  // ── moving in: the one place both the player's drops / taps and the bots change the villa
  dropTenant(i, dest) {
    const T = this.ten[i], src = this.pos[i];
    T.pv = null;
    if (dest === src || dest == null) { this.sendHome(T); return false; }
    if (!this.canAct()) { this.sendHome(T); return false; }
    const o = dest >= 0 ? this.occ(dest) : -1;
    this.pos[i] = dest; if (o >= 0) this.pos[o] = src;
    this.moves++;
    this.sendHome(T); if (o >= 0) this.sendHome(this.ten[o], .06);
    if (dest >= 0) { this.cards[i].classList.add('out'); if (T.newEl) { T.newEl.remove(); T.newEl = null; } }
    this.L.audio.sfx('whoosh');
    this.hand?.remove(); this.hand = null;
    this.updMoves();
    // moods change the moment it lands (and the one it swapped with has landed too)
    this.evalT = Math.max(T.hop?.dur || 0, o >= 0 ? (this.ten[o].hop?.dur || 0) + .06 : 0) + .03;
    return true;
  }
  // hop to wherever this tenant now belongs: its room, or back into its card
  sendHome(T, delay = 0) {
    const ch = T.ch, r = this.pos[T.i];
    const to = r >= 0 ? this.standPos(r) : this.cardWorld(T);
    if (!ch.root.visible) { ch.root.position.copy(this.cardWorld(T)); ch.root.visible = true; ch.root.scale.setScalar(.01); this.cards[T.i].classList.add('out'); this.L.world.idsDirty = true; }
    const from = ch.root.position.clone(), dy = Math.abs(to.y - from.y);
    T.mode = 'hop'; T.hop = { from, to, t: -delay, dur: .4 + Math.min(.25, dy * .04), h: .7 + Math.min(1.2, dy * .15), s0: ch.root.scale.x, s1: r >= 0 ? CS : .15, room: r };
    ch.pose = r >= 0 ? 'flail' : 'idle'; ch.body.position.x = 0;
    if (T.speaker) T.speaker.visible = false;
    if (r < 0) this.hideBubble(ch);
  }
  landed(T) {
    const ch = T.ch, r = T.hop.room, L = this.L, W = L.world;
    T.hop = null;
    if (r < 0) {
      T.mode = 'tray'; ch.root.visible = false; T.room = -1;
      const c = this.cards[T.i]; c.classList.remove('out'); c.classList.remove('back'); void c.offsetWidth; c.classList.add('back');
      L.audio.sfx('pop', 2); return;
    }
    T.mode = 'room'; ch.root.rotation.y = 0; ch.pose = 'idle'; ch.squash = .4;
    L.audio.sfx('land'); L.audio.sfx('place');
    const s = W.toScreen(V.copy(ch.root.position)); W.fx.ring(s.x, s.y, { r: 34, color: '#ffffff', width: 5, life: .4 });
    W.fx.burst(s.x, s.y - 6, { n: 8, speed: 150, size: 7, life: .45, colors: ['#ffffff', '#ffe16b', T.def.color] });
    if (T.speaker) { this.placeSpeaker(T); T.speaker.visible = true; T.speaker.scale.setScalar(.01); this.tw.run(.35, k => T.speaker.scale.setScalar(Math.max(.01, .5 * k)), ease.outBack); W.idsDirty = true; }
  }
  placeSpeaker(T) { const r = this.pos[T.i]; T.speaker.position.set(this.colX(this.rc(r)) - .95, this.rf(r) * FH, .25); }

  // ── moods: recompute, and let everyone whose mood changed react (the sound, the bubble, the shaking)
  refresh(react = true) {
    const moods = this.evalMoods(this.pos), fresh = [];
    this.ten.forEach((T, i) => {
      const m = moods[i], pm = T.mood, moved = T.room !== this.pos[i];
      T.mood = m; T.room = this.pos[i];
      if (!m) return;
      const same = pm && pm.ok === m.ok && pm.why === m.why && pm.src === m.src;
      if (react && (moved || !same)) fresh.push([T, m, moved]);
      else if (T.mode === 'room' && !T.party) this.restFace(T);
    });
    // complaints first (they're the drama), then the happy ones, a beat apart
    fresh.sort((a, b) => a[1].ok - b[1].ok);
    fresh.forEach(([T, m, moved], k) => this.tw.wait(k * .14).then(() => { if (!this.dead && T.mood === m && T.mode === 'room') this.react(T, m, moved); }));
    for (const R of this.rooms) { const o = this.occ(R.idx); R.glowGoal = o >= 0 && moods[o]?.ok ? 1 : 0; }
    const changed = new Set(fresh.map(f => f[0]));
    for (const T of this.ten) { T.mk.className = 'vl-mood' + (T.mood ? (T.mood.ok ? ' ok' : ' no') : ''); T.mk.innerHTML = T.mood?.ok ? SMILE : FROWN; T._mkKey = null; if (changed.has(T)) { void T.mk.offsetWidth; T.mk.classList.add('pop'); } }
    const okN = this.ten.filter(T => T.mood?.ok).length;
    if (!this.drag && !this.introRunning) this.setInfo('', okN > (this.okN || 0) ? 'flash' : '');
    this.okN = okN;
    this.updMoves();
  }
  updMoves() {
    const left = this.budget - this.moves;
    this.movesN.textContent = String(left);
    this.movesEl.classList.toggle('low', left <= 2 && !this.result);
    const best = this.starsFor(this.moves + this.pos.filter(p => p < 0).length);
    this.starEls.forEach((s, k) => s.classList.toggle('off', k >= best));
  }
  badFace(T, m) { return (T.key === 'cat' && m.why === 'low') || m.why === 'alone' ? 'sad' : 'angry'; }
  restFace(T) {
    const m = T.mood, ch = T.ch; if (!m) return;
    if (m.ok) { ch.setFace(T.key === 'sleepy' ? 'normal' : 'happy'); ch.pose = 'idle'; }
    else ch.setFace(this.badFace(T, m));
    this.faceToward(T);
  }
  // turn a little toward whoever is the trouble (or the friend)
  faceToward(T) {
    const m = T.mood, ch = T.ch; let goal = 0;
    const j = m?.src ?? m?.pal;
    if (j != null && this.pos[j] >= 0 && (m.dir === 'side' || m.why === 'cat' || m.why === 'dog' || m.pal != null)) goal = Math.sign(this.rc(this.pos[j]) - this.rc(this.pos[T.i])) * .75;
    T.yawGoal = goal;
  }
  react(T, m, moved) {
    const ch = T.ch, L = this.L, k = T.key;
    this.faceToward(T);
    if (!m.ok) { this.complain(T, m, true); return; }
    ch.setFace(k === 'sleepy' ? 'normal' : 'happy'); ch.pose = 'idle';
    const pop = (line, fx = 'star') => { this.say(ch, line, 1100); ch._fx(this.tw, fx, { x: -.36, y: .9 }); ch._fx(this.tw, fx, { x: .38, y: 1.0, delay: .12 }); this.jump(T, .22); };
    if (k === 'dj') { pop('둠칫둠칫~', 'note'); L.audio.sfx('special'); }
    else if (k === 'sleepy') { this.say(ch, moved ? '여기 조용하다… 쿨쿨' : '이제 좀 자겠다… 쿨', 1300, 'think'); L.audio.sfx('phew'); }
    else if (k === 'cat') { pop('꼭대기다! 전망 최고냥', 'heart'); L.audio.sfx('giggle'); }
    else if (k === 'panda') { pop(moved ? '판다 입주!' : '판다 최고!'); L.audio.sfx('pop', 4); this.stomp(T, true); }
    else if (k === 'shiba') { pop(moved ? '멍! 좋아요!' : '휴, 고양이 갔다', 'star'); L.audio.sfx('giggle'); }
    else if (TEN[k].pal) {
      const P = this.ten[m.pal];
      pop(k === 'bunny' ? '곰돌아, 안녕!' : '토순아, 반가워!', 'heart'); L.audio.sfx('heart');
      if (P) { P.ch.setFace('happy'); P.ch._fx(this.tw, 'heart', { y: 1.0 }); }
      this.heartBridge(T, P);
    } else { pop('좋아요!'); L.audio.sfx('pop', 5); }
  }
  // unhappy: loud and readable (first = the moment it happens; later = the grumbling that keeps going)
  complain(T, m, first) {
    const ch = T.ch, L = this.L, k = T.key, W = L.world;
    ch.setFace(this.badFace(T, m));
    if (k === 'sleepy') {
      const S = this.ten[m.src], dir = m.dir;
      const lines = m.why === 'panda' ? ['윗집 쿵쿵 그만!', '쿵쿵 좀 그만!', '잠 좀 자자!'] : dir === 'up' ? ['윗집 음악 꺼!', '시끄러워!', '잠 좀 자자!'] : dir === 'down' ? ['아랫집 음악 꺼!', '시끄러워!', '잠 좀 자자!'] : ['옆집 음악 꺼!', '시끄러워!', '조용히 해!'];
      T.nag = (T.nag || 0) + 1;
      if (first || T.nag % 2 === 0) this.say(ch, lines[first ? 0 : 1 + (T.nag >> 1) % 2], 1000, 'red');
      // bang on the wall (or the ceiling) toward the noise
      const r = this.pos[T.i], sr = S ? this.pos[S.i] : -1, me = this.roomMid(r, 1.25);
      const at = dir === 'up' ? this.roomMid(r, WALL_H - .15) : dir === 'down' ? this.roomMid(r, .3).setX(this.colX(this.rc(r)) - .85) : me.clone().setX(me.x + Math.sign(this.colX(this.rc(sr)) - me.x) * (RW / 2 - .1));
      this.pop(at, dir === 'side' ? '쾅쾅!' : '쿵쿵!', 'bang');
      this.shake(r, first ? 1 : .7); if (sr >= 0) this.shake(sr, .45);
      ch.pose = 'flail'; this.tw.wait(.55).then(() => { if (T.mood === m && !T.party) ch.pose = 'idle'; });
      ch._fx(this.tw, 'anger', { x: .34, y: .95 }); ch.bump(.35);
      this.snd('bang'); if (first) L.audio.sfx('angry');
      if (S && first && S.key === 'dj') this.tw.wait(.5).then(() => { if (S.mode === 'room' && !this.result) this.say(S.ch, '앗, 미안~', 800); });
      return;
    }
    if (k === 'shiba') {
      const C = this.ten[m.src];
      this.say(ch, first ? '멍멍멍!' : ['멍!', '왈왈!', '으르릉…'][(T.nag = (T.nag || 0) + 1) % 3], 800, 'red');
      ch.bump(.4); this.jump(T, .18); ch._fx(this.tw, 'excl', { x: .34, y: .95 }); this.snd('bark');
      this.shake(this.pos[T.i], .5);
      if (C && C.mode === 'room') this.tw.wait(.3).then(() => { if (C.mood && !C.mood.ok && C.mood.why === 'dog' && !this.result) this.hiss(C); });
      if (first) L.audio.sfx('angry');
      return;
    }
    if (CATS.has(k)) {
      if (m.why === 'dog') { if (first) this.hiss(T); return; }   // the dog drives the fight; the cat answers
      this.say(ch, first ? '더 높은 데 살래…' : ['꼭대기가 좋은데…', '높은 데 가고 싶다냥'][(T.nag = (T.nag || 0) + 1) % 2], 1200, 'think');
      ch._fx(this.tw, 'ques', { x: .34, y: .95 }); if (first) L.audio.sfx('miss');
      return;
    }
    if (TEN[k].pal) {
      const P = TEN[TEN[k].pal];
      this.say(ch, first ? `${P.name} 어디 있지…` : [`${P.name} 보고 싶다…`, `${P.name}랑 옆집 하고 싶어`][(T.nag = (T.nag || 0) + 1) % 2], 1200, 'think');
      ch._fx(this.tw, 'drop', { x: .36, y: .85, rise: -.1 }); if (first) L.audio.sfx('miss');
      return;
    }
    this.say(ch, '싫어!', 800, 'red');
  }
  hiss(C) {
    const ch = C.ch; ch.setFace('angry'); this.say(ch, '하악!', 800, 'red'); ch._fx(this.tw, 'anger', { x: .34, y: .95 }); this.jump(C, .3); this.snd('hiss');
    this.shake(this.pos[C.i], .4);
  }
  stomp(T, soft = false) {
    const r = this.pos[T.i]; T.ch.bump(.45); this.jump(T, .12, .2);
    const below = r - this.Cn;
    if (below >= 0) {
      this.pop(this.roomMid(below, WALL_H - .2), '쿵!', 'boom'); this.shake(below, soft ? .5 : .35); this.snd('thump');
    } else this.snd('thump', .45);
  }
  jump(T, h = .2, dur = .34) { const ch = T.ch; this.tw.run(dur, k => { ch.lift = h * 4 * k * (1 - k); }, ease.linear).then(() => { ch.lift = 0; }); }
  shake(r, a = 1) { const R = this.rooms[r]; if (R) R.shake = Math.max(R.shake, a); }
  heartBridge(A, B) {
    if (!B || this.pos[A.i] < 0 || this.pos[B.i] < 0) return;
    const a = this.standPos(this.pos[A.i]).setY(this.rf(this.pos[A.i]) * FH + 1.0), b = this.standPos(this.pos[B.i]).setY(this.rf(this.pos[B.i]) * FH + 1.0);
    for (let k = 0; k < 2; k++) this.fly(k ? b : a, a.clone().lerp(b, .5).setY(a.y + .45), '♥', 'note', .7, k * .15, 'hrt');
  }

  // ── little world-anchored pieces (DOM): bubbles that follow a head, pops, flying notes
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
    const el = this.L.h('div', { class: 'vl-fx ' + cls }, this.L.h('span', {}, text)); this.L.ui.wui.append(el);
    const at = p.clone(), a = { el, at: () => at, until: this.t + ms / 1000 * (this.L.fast || 1) };
    this.anch.push(a); this.place(a);
  }
  // a glyph flying from a to b (a little arc and wobble), fading at the end
  fly(a, b, text, cls, dur = .9, delay = 0, extra = '') {
    const el = this.L.h('div', { class: `vl-fx ${cls} ${extra}`, style: 'opacity:0' }, this.L.h('span', {}, text)); this.L.ui.wui.append(el);
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
    this.anch = this.anch.filter(a => {
      if (this.t > a.until) { a.el.remove(); return false; }
      this.place(a); return true;
    });
  }

  // ── sound: a few synth bits the shared kit doesn't have (beat, thump, bark, hiss, wall bang)
  snd(kind, vol = 1) {
    const A = this.L.audio; if (A.muted) return;
    A.unlock?.(); const c = A.ctx; if (!c || c.state !== 'running' || !A.sfxBus) return;
    const t0 = c.currentTime, out = A.sfxBus;
    const tone = (type, f, f2, dur, v, at = 0, lp = 0) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0 + at); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + at + dur);
      g.gain.setValueAtTime(0, t0 + at); g.gain.linearRampToValueAtTime(v * vol, t0 + at + .005); g.gain.exponentialRampToValueAtTime(.0001, t0 + at + dur);
      let n = o; if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); n = fl; }
      n.connect(g).connect(out); o.start(t0 + at); o.stop(t0 + at + dur + .02);
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
    }
  }

  // ── the first look: tenants arrive in the tray one by one; new ones get one short line
  async arrivals() {
    this.introRunning = true;
    const news = [];
    for (const T of this.ten) {
      const c = this.cards[T.i]; c.style.visibility = ''; c.classList.add('arrive'); this.L.audio.sfx('pop', 3 + T.i * 2);
      if (T.isNew) news.push(T);
      await this.tw.wait(.16); if (this.dead) return;
    }
    if (this.lvIdx === 0 && this.moves === 0 && !this.L.bot) this.showHand();
    for (const T of news) {
      if (this.introStop || this.dead) break;
      this.setInfo(`<i class="nw">새 입주자</i>${this.quirkHtml(T)}`, 'new');
      this.cards[T.i].classList.remove('back'); void this.cards[T.i].offsetWidth; this.cards[T.i].classList.add('back');
      await this.tw.wait(1.9);
    }
    this.introRunning = false;
    if (this.dead) return;
    if (!this.introStop) this.setInfo('');
  }
  // first level only: a finger lifting the first card up into the villa (gone after the first move)
  showHand() {
    const c = this.cards.find((_, i) => this.pos[i] < 0); if (!c) return;
    const b = c.getBoundingClientRect(), tgt = this.L.world.toScreen(this.standPos(this.Cn).setY(FH + .6));
    const el = this.hand = this.L.h('div', { class: 'vl-hand', html: ICON.hand });
    el.style.left = (b.left + b.width / 2 - 10) + 'px'; el.style.top = (b.top + b.height / 2 - 6) + 'px';
    el.style.setProperty('--hx', (tgt.x - b.left - b.width / 2) + 'px'); el.style.setProperty('--hy', (tgt.y - b.top - b.height / 2) + 'px');
    this.L.ui.hud.append(el);
  }

  // ── per frame
  update(dt) {
    const L = this.L, W = L.world;
    this.t += dt; this.tw.update(dt);
    for (const f of this.floors) f.update(dt);
    this.roof?.update(dt);
    if (this.evalT > 0) { this.evalT -= dt; if (this.evalT <= 0) { this.refresh(true); this.checkEnd(); } }
    // tenants: hops, the carried one, idle
    for (const T of this.ten) {
      const ch = T.ch;
      if (T.mode === 'hop' && T.hop) {
        const H = T.hop; H.t += dt;
        const k = clamp(H.t / H.dur, 0, 1), e = ease.inOutSine(k);
        ch.root.position.lerpVectors(H.from, H.to, e); ch.root.position.y += H.h * 4 * k * (1 - k);
        ch.root.scale.setScalar(Math.max(.01, H.s0 + (H.s1 - H.s0) * ease.outQuad(k)));
        ch.root.rotation.y = Math.sin(k * Math.PI) * .5 * Math.sign(H.to.x - H.from.x);
        if (k >= 1) this.landed(T);
      } else if (T.mode === 'drag' && T.dragGoal) {
        const p = ch.root.position, vx = T.dragGoal.x - p.x;
        p.lerp(T.dragGoal, 1 - Math.exp(-dt * 22));
        ch.lean = clamp(-vx * .9, -.6, .6) + Math.sin(this.t * 7) * .06;
        if (ch.root.scale.x < CS) ch.root.scale.setScalar(Math.min(CS, ch.root.scale.x + dt * 8));
      } else if (T.mode === 'room') {
        ch.lean *= Math.exp(-dt * 8);
        const g = T.party ? Math.sin(this.t * 3 + T.i) * .4 : (T.yawGoal || 0);
        ch.root.rotation.y += (g - ch.root.rotation.y) * (1 - Math.exp(-dt * 6));
        if (T.party) ch.lift = Math.abs(Math.sin(this.t * 8 + T.i * 1.3)) * .22;
      }
      if (T.mode !== 'drag') ch.lean *= Math.exp(-dt * 10);
      ch.update(dt);
    }
    // rooms: shaking, lamp glow, drop frames
    for (const R of this.rooms) {
      if (R.shake > .01) { const dx = Math.sin(this.t * 60) * R.shake * .07, dy = Math.abs(Math.sin(this.t * 47)) * R.shake * .025; R.room.group.position.set(R.base.x + dx, R.base.y + dy, R.base.z); R.shake *= Math.exp(-dt * 7); R.shook = true; }
      else if (R.shook) { R.room.group.position.copy(R.base); R.shook = false; R.shake = 0; }
      const o = this.occ(R.idx), T = o >= 0 ? this.ten[o] : null;
      if (T && T.mode === 'room') T.ch.body.position.x = R.shook ? (R.room.group.position.x - R.base.x) / CS : 0;
      const goal = R.party ? 1.5 : (R.glowGoal && T?.mode === 'room' ? 1 : 0);
      R.glowK += (goal - R.glowK) * (1 - Math.exp(-dt * 5));
      const flick = R.party ? .85 + Math.sin(this.t * 6 + R.idx) * .15 : 1;
      R.glow.material.opacity = R.glowK * .42 * flick; R.pool.material.opacity = R.glowK * .32 * flick;
      R.wash.material.opacity = R.party ? R.glowK * .2 * flick : 0;
      const fg = R.frameGoal * (R.frameGoal < 1 ? .55 + Math.sin(this.t * 5) * .25 : 1);
      R.frameK += (fg - R.frameK) * (1 - Math.exp(-dt * 14));
      R.frame.material.opacity = R.frameK * .9;
      R.frame.material.color.set(R.frameColor || '#ffffff');
    }
    // the living villa: everyone's quirk keeps going while they live here
    if (this.started && this.result !== 'fail') this.stepLife(dt);
    // markers over heads, the sign on the roof
    for (const T of this.ten) {
      const show = (T.mode === 'room' && T.mood && !this.result) || (T.mode === 'drag' && T.pv);
      T.mk.classList.toggle('on', !!show);
      if (!show) continue;
      const key = T.mode === 'drag' ? 'pv' + T.pv.ok : 'm' + T.mood.ok;
      if (key !== T._mkKey) {
        const ok = T.mode === 'drag' ? T.pv.ok : T.mood.ok, pop = T.mk.classList.contains('pop') && T.mode !== 'drag';
        T.mk.className = 'vl-mood on' + (T.mode === 'drag' ? ' pv' : '') + (ok ? ' ok' : ' no') + (pop ? ' pop' : ''); T.mk.innerHTML = ok ? SMILE : FROWN; T._mkKey = key;
      }
      const ch = T.ch, s = W.toScreen(V.copy(ch.root.position).setY(ch.root.position.y + (ch.headTop() + .1) * ch.root.scale.y + .08));
      T.mk.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
    }
    { const s = W.toScreen(V.set(0, this.Fn * FH + .12, RD / 2 + .3)); this.sign.style.left = s.x + 'px'; this.sign.style.top = s.y + 'px'; }
    this.stepFx(dt);
  }
  stepLife(dt) {
    const dj = this.ten.find(T => T.key === 'dj' && T.mode === 'room');
    // 둠칫이's beat (faster at the party)
    if (dj) {
      this.beatT -= dt;
      if (this.beatT <= 0) {
        this.beatT += this.result === 'win' ? .3 : .42; const b = this.beat++;
        this.snd(b % 2 ? (b % 4 === 3 ? 'snare' : 'hat') : 'kick', this.result === 'win' ? .9 : .6);
        if (dj.speaker?.visible) { const sp = dj.speaker; this.tw.run(.18, k => sp.scale.set(.5 * (1 + (1 - k) * .14), .5 * (1 + (1 - k) * .1), .5 * (1 + (1 - k) * .14)), ease.linear); }
        if (b % 2 === 0) dj.ch.bump(.16);
        // notes out to every room the music reaches
        if (b % 2 === 0 && !this.result) {
          const r = this.pos[dj.i], f = this.rf(r), c = this.rc(r), nb = [[f, c - 1], [f, c + 1], [f + 1, c], [f - 1, c]].filter(([ff, cc]) => ff >= 0 && ff < this.Fn && cc >= 0 && cc < this.Cn);
          if (nb.length) {
            const [ff, cc] = nb[(b >> 1) % nb.length], to = this.roomMid(ff * this.Cn + cc, ff > f ? .9 : ff < f ? 1.5 : 1.25);
            const from = this.standPos(r).setY(f * FH + 1.15);
            if (cc !== c) to.x = this.colX(cc) + (cc > c ? -.35 : .35);
            this.fly(from, to, ['♪', '♫', '♬'][b % 3], 'note', .95, 0, ['', 'n2', 'n3'][(b >> 1) % 3]);
          }
        }
      }
    }
    if (this.result || this.failing) return;
    for (const T of this.ten) {
      if (T.mode !== 'room' || !T.mood) continue;
      T.pt -= dt; if (T.pt > 0) continue;
      const m = T.mood, k = T.key, ch = T.ch;
      if (k === 'panda') { T.pt = rnd(1.5, 1.9); this.stomp(T); continue; }
      if (k === 'dj') { T.pt = 3; continue; }
      if (!m.ok) {
        if (k === 'sleepy') { T.pt = rnd(2.2, 2.7); this.complain(T, m, false); }
        else if (k === 'shiba') { T.pt = rnd(2.1, 2.6); this.complain(T, m, false); }
        else if (CATS.has(k) && m.why === 'dog') T.pt = 9;
        else { T.pt = rnd(4, 5); this.complain(T, m, false); }
        continue;
      }
      if (k === 'sleepy') { T.pt = rnd(2.6, 3.4); this.pop(V.copy(ch.root.position).add(new THREE.Vector3(-.25, 1.0, .2)), ['z', 'Zz', 'zZ'][Math.floor(Math.random() * 3)], 'zz', 1500); }
      else if (TEN[k].pal) { T.pt = rnd(2.2, 2.8); ch._fx(this.tw, 'heart', { y: 1.0, s: .8 }); if (k === 'bunny') this.heartBridge(T, this.ten[m.pal]); }
      else if (k === 'cat') { T.pt = rnd(4, 6); ch._fx(this.tw, 'heart', { x: .3, y: .95, s: .7 }); }
      else T.pt = rnd(4, 6);
    }
  }

  // ── the end of the day
  checkEnd() {
    if (this.result) return;
    if (this.solved(this.pos)) return this.win();
    if (this.moves >= this.budget) {
      this.failing = true; this.select(null);
      this.tw.wait(1.2).then(() => { if (!this.dead) this.fail(); });
    }
  }
  win() {
    if (this.result === 'win') return;
    const L = this.L, W = L.world, h = L.h; this.result = 'win'; this.drag = null; this.select(null); this.endHover();
    const stars = this.starsFor(this.moves);
    L.log({ result: 'win', lv: this.lvIdx + 1, moves: this.moves, stars });
    this.hand?.remove();
    // every window lights up, floor by floor; everyone cheers
    const order = this.rooms.slice().sort((a, b) => a.idx - b.idx);
    order.forEach((R, k) => this.tw.wait(.25 + k * .13).then(() => {
      if (this.dead) return;
      R.party = 1; const s = W.toScreen(this.roomMid(R.idx, 1.1));
      W.fx.burst(s.x, s.y, { n: 16, speed: 230, size: 10, life: .7 }); L.audio.sfx('pop', 3 + k * 2);
      const o = this.occ(R.idx); if (o >= 0) { const T = this.ten[o]; T.party = true; T.ch.setFace('happy'); T.ch.pose = 'cheer'; this.say(T.ch, ['야호!', '최고의 빌라!', '이웃 좋아!', '행복해!', '만세!', '좋은 집!'][k % 6], 1500); }
    }));
    const tAll = .35 + order.length * .13;
    this.tw.wait(tAll).then(() => {
      if (this.dead) return;
      W.setLight(PARTY); this.app.classList.add('party'); this.sign.classList.add('lit');
      if (!this.ten.some(T => T.key === 'dj')) { L.audio.music('play'); this.music = true; }
      W.fx.confetti(150); L.audio.sfx('win');
      W.fx.ring(innerWidth / 2, innerHeight * .45, { r: 160, color: '#ffe16b', width: 12, life: .7 });
      const z0 = W.zoom; this.tw.run(.25, k => { W.zoom = z0 * (1 + .06 * Math.sin(k * Math.PI)); }, ease.linear);
    });
    this.tw.wait(tAll + 2.2).then(() => {
      if (this.dead) return;
      L.makeThumbs({ faces: this.ten.map(T => [T.def.kind, 'happy']) });
      const last = this.lvIdx >= LEVELS.length - 1;
      const msg = stars === 3 ? '완벽한 방 배정!' : stars === 2 ? '조금만 덜 옮기면 별 셋!' : '휴, 겨우 모두 행복해졌다!';
      L.ui.panel({ title: '모두 행복해!', color: 'green', body: [
        h('div', { class: 'stars' }, ...[0, 1, 2].map(k => h('div', { class: 'st' + (k < stars ? ' on' : ''), html: k < stars ? ICON.star : ICON.starGray }))),
        h('div', { class: 'vl-faces' }, ...this.ten.map(T => h('img', { src: L.thumbs[`face_${T.def.kind}_happy`] }))),
        h('div', { class: 'txt' }, `이사 ${this.moves}번 · ${msg}`)],
        buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
          this.nextBtn = L.ui.btn(last ? '처음 빌라로' : '다음 빌라', { color: 'green', cls: 'big', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) })] });
    });
  }
  fail() {
    const L = this.L, h = L.h; this.result = 'fail'; this.drag = null; this.select(null); this.endHover();
    const sad = this.ten.filter(T => !T.mood?.ok);
    L.log({ result: 'fail', lv: this.lvIdx + 1, moves: this.moves, unhappy: sad.map(T => T.key).join(',') });
    L.audio.sfx('lose');
    for (const T of sad) if (T.mode === 'room') { T.ch.setFace('angry'); T.ch.pose = 'flail'; this.say(T.ch, '흥!', 1200, 'red'); }
    for (const R of this.rooms) R.glowGoal = 0;
    this.tw.wait(1.1).then(() => {
      if (this.dead) return;
      L.makeThumbs({ faces: sad.map(T => [T.def.kind, 'sad']) });
      L.ui.panel({ title: '이사 기회 끝!', color: 'red', body: [
        h('div', { class: 'vl-faces sad' }, ...sad.map(T => h('img', { src: L.thumbs[`face_${T.def.kind}_sad`] }))),
        h('div', { class: 'txt' }, sad.length ? `${sad.map(T => T.def.name).join(', ')}${sad.length > 1 ? '가' : this.josa(sad[0].def.name)} 아직 불만이에요` : '아직 이사 안 한 이웃이 있어요')],
        buttons: [this.againBtn = L.ui.btn('다시 하기', { color: 'orange', cls: 'big', onClick: () => L.go({ lv: this.lvIdx }) })] });
    });
  }
  josa(w) { const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c % 28 ? '이' : '가'; }
  exit() {
    this.dead = true; const W = this.L.world;
    this.app.removeEventListener('pointerdown', this._pd);
    removeEventListener('pointermove', this._pm); removeEventListener('pointerup', this._pu); removeEventListener('pointercancel', this._pu);
    removeEventListener('resize', this._rs);
    W.inputEnabled = true; W.camLock = false;
    if (this.music) this.L.audio.stopMusic();
    this.app.classList.remove('vl', 'party');
    for (const o of [this.villa, ...this.ten.flatMap(T => [T.ch.root, T.speaker])].filter(Boolean)) { W.root.remove(o); disposeTree(o); }
    for (const f of this.fxs) f.el.remove(); for (const a of this.anch) a.el.remove();
    for (const T of this.ten) T.mk.remove();
    this.sign?.remove(); this.hand?.remove();
    this.tex.glow.dispose(); this.tex.frame.dispose();
  }

  // ── bots (QA) — they pick a tenant and tap a room, like a player. smart: a solver's nearest solution; random: anything
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 1.6 && this.L.ui.panelOpen) { this._endT = 0; (this.result === 'win' ? this.nextBtn : this.againBtn)?.press(); } return; }
    if (!this.started || this.drag || this.evalT > 0) return;
    this._bt = (this._bt ?? .5) - dt; if (this._bt > 0) return;
    this._bt = mode === 'random' ? .55 : .75;
    if (!this.canAct()) return;
    const n = this.ten.length;
    if (mode === 'random') {
      const tray = this.ten.filter(T => this.pos[T.i] < 0);
      let i, r;
      if (tray.length) { i = tray[Math.floor(Math.random() * tray.length)].i; r = Math.floor(Math.random() * this.nR); }
      else { i = Math.floor(Math.random() * n); do { r = Math.floor(Math.random() * this.nR); } while (r === this.pos[i]); }
      this.select(i); this.tapRoom(r); return;
    }
    if (!this.plan) this.plan = this.nearest();
    const todo = this.ten.map(T => T.i).filter(i => this.pos[i] !== this.plan[i]);
    if (!todo.length) { this.plan = this.nearest(); return; }
    const i = todo.find(i => this.occ(this.plan[i]) < 0) ?? todo[0];
    this.select(i); this.tapRoom(this.plan[i]);
  }
  nearest() {
    let best = null, bd = 1e9;
    for (const s of this.sols) { const d = s.reduce((a, r, i) => a + (this.pos[i] === r ? 0 : 1), 0) + Math.random() * .5; if (d < bd) { bd = d; best = s; } }
    return best || this.pos.slice();
  }
  state() {
    return { scene: 'villa', lv: this.lvIdx + 1, result: this.result, placed: this.pos.filter(p => p >= 0).length, moves: this.moves, budget: this.budget,
      happy: this.ten.filter(T => T.mood?.ok).length, total: this.ten.length, started: !!this.started, sols: this.sols.length };
  }
  get api() {
    return {
      place: (i, r) => this.dropTenant(i, r),
      solve: async () => { const s = this.nearest(); for (let i = 0; i < s.length; i++) if (this.pos[i] !== s[i]) { this.dropTenant(i, s[i]); await new Promise(r => setTimeout(r, 650)); } return this.state(); },
      pos: () => this.pos.slice(), moods: () => this.evalMoods(this.pos), sols: () => this.sols.map(s => s.join('')),
      rooms: () => this.rooms.map(R => { const s = this.L.world.toScreen(this.roomMid(R.idx, 1.0)); return { idx: R.idx, x: Math.round(s.x), y: Math.round(s.y) }; }),
    };
  }
}

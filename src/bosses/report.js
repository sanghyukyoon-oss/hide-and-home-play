// 📄 엄마 몰래 성적표 — 성적표 나온 날. 엄마가 "몽글아~ 성적표 어딨니~?" 하며 집을 한 군데씩 뒤진다.
//   you:   drag the 성적표 (몽글이 pulls it out and runs with it held over his head, following your finger) and let go
//          near a hiding place: he tucks it in there. Or just tap a hiding place: he takes it there by himself.
//   mom:   names the next place ("이불 속에 있나~?", a red preview of where she'll look, a red ring on the place),
//          walks there, opens it and rummages (nose in the drawer: the moment to move), "없네~", and on to the next.
//          The warm light on the floor is where her eyes are: carry the card through it and it's "그거 뭐니?".
//          A place she has just looked in (✓) is the safest; a card left in one place too long starts to "smell".
//   later: 멍뭉이 sniffs toward the card and barks at it; mom hears rustling near her (and on day 3 turns round).
//   "엄마! 저기 봐!" (got on day 1): she goes to look at something for a few seconds.
// Keep it hidden until the clock runs out.
import * as THREE from 'three';
import { MapRooms } from '../map.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { buildItem } from '../gfx/items.js';
import { walkGrid, gridPath, nearestTile } from '../companion.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree } from '../gfx/kit.js';
import { sees, wrap } from './yasik.js';
import { LANG } from '../i18n.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
const SP = (key, type, name, ask, o = {}) => ({ key, type, name, ask, ...o });
const EVE = { ambColor: '#ead2e2', amb: 1.14, sunColor: '#ffb98a', sun: 1.6 };
const DEG = Math.PI / 180;

// mom by day: walk speed, the warning before she sets off (tel), rummage time, how many of the last checks she
// remembers as done (mem), her nose for a card left in one place, how far she hears rustling, whether she turns round
// at a rustle (remember), how often she glances back while walking, and the dog
const TIERS = [
  { walk: 1.1, tel: 1.8, check: 1.4, sus: 1.7, mem: 2, nose: .95, hear: 0, remember: false, glance: 0, gtel: .9, dog: null },
  { walk: 1.28, tel: 1.45, check: 1.2, sus: 1.9, mem: 3, nose: 1.05, hear: 1.9, remember: false, glance: .06, gtel: .9, dog: { first: 8, every: [10, 13], speed: .88, give: 7.5 } },
  { walk: 1.42, tel: 1.2, check: 1.05, sus: 2.3, mem: 2, nose: 1.15, hear: 2.5, remember: true, glance: .11, gtel: .75, dog: { first: 6, every: [8, 11], speed: 1.05, give: 8 } },
];
const LEVELS = [
  { name: '첫째 날', sub: '엄마가 성적표를 찾는다!', time: 45, tier: 0, theme: 'my', w: 7, d: 5,
    furniture: [F('bed', 0, 0), F('trash', 1, 0), F('desk', 2, 0), F('wardrobe', 4, 0), F('lamp', 5, 0), F('chest', 0, 3, 1), F('rug', 2, 2), F('bookshelf', 4, 2, 1, { seed: 5 }), F('plant', 6, 4)],
    decor: [D('window', 'N', 2.4), D('picture', 'N', -1.6), D('clock', 'W', -.2), D('door', 'W', 1.6)],
    spots: [SP('bed', 'bed', '이불 속', '이불 속에 있나~?', { part: 1 }), SP('trash', 'trash', '휴지통', '설마… 휴지통에?'), SP('desk', 'desk', '책상 서랍', '책상 서랍에 있나~?'),
      SP('wardrobe', 'wardrobe', '옷장', '옷장 안에 있나~?'), SP('chest', 'chest', '장난감 상자', '장난감 상자에 있나~?'), SP('rug', 'rug', '러그 밑', '러그 밑에 깔아 놨나~?'),
      SP('books', 'bookshelf', '책 사이', '책 사이에 꽂아 놨나~?', { part: -1 }), SP('plant', 'plant', '화분 뒤', '화분 뒤에 숨겼나~?', { part: -1 })],
    start: 'desk', script: ['plant', '@card'], mom: [2.3, .9], me: null,
    look: { at: [2.4, -2.0], call: '엄마! 밖에 무지개 떴어!', a: '어머, 진짜?', b: '…무지개 없잖아?', got: true } },
  { name: '둘째 날', sub: '멍뭉이가 냄새를 맡는다!', time: 50, tier: 1, theme: 'apt', w: 7, d: 5,
    furniture: [F('monstera', 0, 0), F('bookshelf', 1, 0, 0, { seed: 7 }), F('tvlow', 2, 0), F('laundrybasket', 4, 0), F('floorlamp', 6, 0),
      F('kotatsu', 1, 2), F('zabuton', 1, 3), F('dryrack', 3, 2, 1), F('sofa2', 3, 3, 2), F('parcel', 6, 3), F('catbed', 5, 4)],
    decor: [D('balconywin', 'W', -1.2), D('catclock', 'N', 2.0), D('wallshelf2', 'N', -2.6), D('door', 'W', 1.4)],
    spots: [SP('sofa', 'sofa2', '소파 쿠션 밑', '소파 쿠션 밑에 있나~?'), SP('tv', 'tvlow', 'TV장 서랍', 'TV장 서랍에 있나~?'), SP('books', 'bookshelf', '책 사이', '책 사이에 꽂아 놨나~?', { part: -1 }),
      SP('plant', 'monstera', '화분 뒤', '화분 뒤에 숨겼나~?', { part: -1 }), SP('laundry', 'laundrybasket', '빨래 바구니', '빨래 바구니에 있나~?'), SP('kotatsu', 'kotatsu', '코타츠 이불 속', '코타츠 이불 속에 있나~?'),
      SP('cushion', 'zabuton', '방석 밑', '방석 밑에 깔았나~?'), SP('parcel', 'parcel', '택배상자', '택배상자에 넣었나~?')],
    start: 'kotatsu', script: [], mom: [2.4, -.1], dogBed: 'catbed',
    look: { at: [-.5, -1.25], call: '엄마! 드라마 시작했어!', a: '어머, 벌써?!', b: '…광고잖아!' } },
  { name: '셋째 날', sub: '엄마 귀가 밝아졌다!', time: 55, tier: 2, theme: 'my', w: 8, d: 6,
    zones: [{ i: 4, j: 1, w: 4, d: 5, kind: 'checker', a: '#fff6e8', b: '#f6dcc0' }],
    furniture: [F('bed', 0, 0), F('desk', 1, 0), F('wardrobe', 3, 0), F('drawers', 4, 0), F('lamp', 5, 0), F('tvlow', 6, 0), F('chest', 0, 4, 1),
      F('bookshelf', 3, 2, 1, { seed: 9 }), F('sofa2', 5, 3, 2), F('laundrybasket', 7, 5), F('trash', 2, 5), F('catbed', 5, 5), F('plant', 7, 2)],
    decor: [D('window', 'N', -1.2), D('picture', 'N', 2.6), D('clock', 'W', -1.0), D('door', 'W', 1.6)],
    spots: [SP('bed', 'bed', '이불 속', '이불 속에 있나~?', { part: 1 }), SP('desk', 'desk', '책상 서랍', '책상 서랍에 있나~?'), SP('wardrobe', 'wardrobe', '옷장', '옷장 안에 있나~?'),
      SP('drawers', 'drawers', '서랍장', '서랍장에 넣었나~?'), SP('tv', 'tvlow', 'TV장 서랍', 'TV장 서랍에 있나~?'), SP('chest', 'chest', '장난감 상자', '장난감 상자에 있나~?'),
      SP('books', 'bookshelf', '책 사이', '책 사이에 꽂아 놨나~?', { part: -1 }), SP('sofa', 'sofa2', '소파 쿠션 밑', '소파 쿠션 밑에 있나~?'),
      SP('laundry', 'laundrybasket', '빨래 바구니', '빨래 바구니에 있나~?'), SP('trash', 'trash', '휴지통', '설마… 휴지통에?'), SP('plant', 'plant', '화분 뒤', '화분 뒤에 숨겼나~?', { part: -1 })],
    start: 'chest', script: [], mom: [2.6, 1.6], dogBed: 'catbed',
    look: { at: [-3.4, 1.6], call: '엄마! 아빠 왔나 봐!', a: '어머, 여보?', b: '…아무도 없잖아?' } },
];
export { LEVELS };
const CARRY = 2.5, GRAB_T = .24, TUCK_T = .32, LIFT = 44;   // LIFT: 몽글이 runs to a point just above your finger (so you can see him)
const EYE_H = 1.25, CARRY_H = .5, IDLE_H = .42, ME_R = .16;
const DONE_LINES = ['없네~', '여긴 없네…', '흠, 없어', '어디 갔지?'];
const SAFE_LINES = ['휴~', '헤헤', '세이프!'];
const RUSTLE = ['부스럭', '바스락'];
const BUSY_MOM = new Set(['check', 'dist', 'end']);

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; }
  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world, app = document.getElementById('app');
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1);
    const LV = this.lv = LEVELS[this.lvIdx], T = this.T = TIERS[LV.tier];
    this.ensureCss();
    app.classList.add('rp-eve');
    L.setBg(['#ffc9a4', '#9b7ccc']); W.setLight(EVE);
    const th = THEMES[LV.theme] || THEMES.my;
    const map = this.map = new MapRooms(W, { theme: th, bleed: true, rooms: [{ at: [0, 0], layout: { w: LV.w, d: LV.d, theme: th, wallH: 2.9, walls: { N: 'wall', W: 'wall' }, floorZones: LV.zones, furniture: LV.furniture, decor: LV.decor } }] });
    W.root.add(map.group); map.group.updateMatrixWorld(true);
    const R = this.room = map.rooms[0];
    this.B = { x0: -R.w / 2 + .24, x1: R.w / 2 - .24, z0: -R.d / 2 + .24, z1: R.d / 2 - .24 };
    this.buildOccluders();
    this.grid = walkGrid([R], .24);
    this.buildSpots();
    // 몽글이, beside the card's first hiding place
    this.cardSpot = this.spot(LV.start) || this.spots[0];
    const me = this.me = new Char('mong'); W.root.add(me.root);
    this.pos = new THREE.Vector2(this.cardSpot.idle.x, this.cardSpot.idle.z); this.face = Math.PI / 4; this.placeMe(1);
    this.meS = 'idle'; this.meT = 0; this.route = []; this.dest = null; this.queued = null;
    // the card itself (only shown while it's out of its hiding place)
    const card = this.card = buildItem('report'); card.scale.setScalar(2.1); card.visible = false; W.root.add(card);
    // mom
    const mom = this.mom = new Char('mom'); W.root.add(mom.root);
    mom.root.position.set(LV.mom[0], 0, LV.mom[1]);
    this.eye = { x: LV.mom[0], z: LV.mom[1], h: EYE_H };
    this.momYaw = this.yawTo(this.pos.x, this.pos.y); mom.root.rotation.y = this.momYaw;
    this.mState = 'intro'; this.mT = 1.7; this.target = null; this.forced = null; this.momPath = []; this.history = []; this.picks = 0; this.parked = 0;
    this.heat = new Map(); this.script = [...(LV.script || [])];
    this.sus = 0; this.peak = 0; this.dodges = 0; this.near = 0; this.moves = 0; this.idleSeen = 0; this.idleCd = 0;
    this.looks = LV.look.got ? 0 : 1; this.gotLook = !LV.look.got; this.time = LV.time;
    if (T.dog) this.makeDog();
    this.buildVision();
    this.frame();
    L.makeThumbs({ items: ['report'], faces: [['mom', 'normal'], ['mom', 'sus'], ['mom', 'angry'], ['mom', 'wow'], ['mong', 'happy']] });
    this.buildHud();
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    this.momB = this.say(mom, '몽글아~ 성적표 나왔다며~?', 2200);
    await L.ui.banner(LV.name, LV.sub, 1300);
    if (this.dead) return;
    this.started = true; this.t0 = this.t;
  }
  // the hub page only loads the five games' sheets: bring this one's along when it's missing (and take it away again)
  ensureCss() {
    if ([...document.styleSheets].some(s => /games\/report\/game\.css/.test(s.href || '')) || document.querySelector('link[href*="games/report/game.css"]')) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = new URL('./report.css', import.meta.url).href; document.head.append(l); this._css = l;
  }
  spot(key) { return this.spots.find(s => s.key === key) || null; }
  yawTo(x, z) { return Math.atan2(x - this.eye.x, z - this.eye.z); }
  frame() {
    const W = this.L.world, R = this.room, span = (R.w + R.d) / Math.SQRT2 + .5;
    W.home.set(0, .4, .25); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = 1.06; W.zoom = 1;
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(span * .92, span * .8, .5);
  }
  // sight blockers (everything as tall as its box) and the footprints 몽글이 bumps into
  buildOccluders() {
    const occ = this.occ = [], R = this.room;
    for (const rec of this.map.furns) {
      if (['rug', 'zabuton', 'catbed'].includes(rec.type)) continue;
      const b = new THREE.Box3().setFromObject(rec.f.group), h = b.max.y - b.min.y; if (h < .22) continue;
      const s = .06, [fw, fd] = R.footprint(rec.type, rec.rot || 0), tx = -R.w / 2 + rec.i, tz = -R.d / 2 + rec.j, q = .2;
      occ.push({ x0: b.min.x + s, x1: b.max.x - s, z0: b.min.z + s, z1: b.max.z - s, h: b.max.y, type: rec.type, solid: { x0: tx + q, x1: tx + fw - q, z0: tz + q, z1: tz + fd - q } });
    }
  }
  free(x, z) {
    const B = this.B; if (x < B.x0 || x > B.x1 || z < B.z0 || z > B.z1) return false;
    for (const o of this.occ) { const S = o.solid; if (x > S.x0 - ME_R && x < S.x1 + ME_R && z > S.z0 - ME_R && z < S.z1 + ME_R) return false; }
    return true;
  }
  // every hiding place: the piece, the floor tile mom stands on to look in, the tile 몽글이 waits on beside it
  buildSpots() {
    const L = this.L, W = L.world, h = L.h, used = new Set(), q = new THREE.Quaternion(), f3 = new THREE.Vector3();
    this.spots = [];
    for (const d of this.lv.spots) {
      const rec = this.map.furns.filter(r => r.type === d.type)[d.n || 0]; if (!rec) continue;
      const g = rec.f.group, box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3());
      g.getWorldQuaternion(q); f3.set(0, 0, 1).applyQuaternion(q);
      const fx = Math.round(f3.x), fz = Math.round(f3.z), flat = d.type === 'rug' || d.type === 'zabuton';
      const ext = Math.abs(fx) * (box.max.x - box.min.x) / 2 + Math.abs(fz) * (box.max.z - box.min.z) / 2;
      const off = flat ? ext * .5 : ext + .38;
      let stand = nearestTile(this.grid, c.x + fx * off, c.z + fz * off, used);
      if (!stand || Math.hypot(stand.x - c.x, stand.z - c.z) > ext + 1.2) stand = nearestTile(this.grid, c.x, c.z, used);
      used.add(stand);
      const part = d.part === -1 ? null : rec.f.parts[d.part || 0] || null;
      const s = { ...d, rec, f: rec.f, part, c, box, top: new THREE.Vector3(c.x, Math.max(box.max.y, .3) + .14, c.z), fx, fz, stand, idle: null, open: 0 };
      s.cardAt = new THREE.Vector3(stand.x + (c.x - stand.x) * .62, flat ? .06 : Math.min(.45, box.max.y * .5), stand.z + (c.z - stand.z) * .62);
      s.dogAt = new THREE.Vector3(stand.x + (c.x - stand.x) * .25, 0, stand.z + (c.z - stand.z) * .25);
      this.spots.push(s);
    }
    // 몽글이's place: a free tile beside mom's, sideways to the piece, on no other place's tile
    for (const s of this.spots) {
      let best = null, bs = -1e9;
      for (const t of this.grid) {
        if (used.has(t)) continue;
        const dx = t.x - s.stand.x, dz = t.z - s.stand.z, dd = Math.hypot(dx, dz); if (dd < .45 || dd > .95) continue;
        const sc = Math.abs(dx * -s.fz + dz * s.fx) - Math.max(0, -(dx * s.fx + dz * s.fz)) * 1.5 - Math.hypot(t.x - s.c.x, t.z - s.c.z) * .4 + (dx * 1 + dz * 1) * .05;
        if (sc > bs) { bs = sc; best = t; }
      }
      s.idle = best || s.stand;
      // a ring on the floor in front of the piece, and a badge over it (✓ looked / ? next / the card)
      const ring = s.ring = new THREE.Mesh(new THREE.RingGeometry(.2, .28, 30), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .25, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(s.stand.x + (s.c.x - s.stand.x) * .35, .06, s.stand.z + (s.c.z - s.stand.z) * .35); ring.renderOrder = 3;
      W.root.add(ring);
      s.badge = h('div', { class: 'rp-spot' }); L.ui.wui.append(s.badge); s.bkey = '';
    }
  }
  makeDog() {
    const W = this.L.world, bed = this.map.furns.find(r => r.type === this.lv.dogBed);
    const b = bed ? new THREE.Box3().setFromObject(bed.f.group).getCenter(new THREE.Vector3()) : new THREE.Vector3(0, 0, 1.5);
    const dog = this.dog = new Char('shiba'); W.root.add(dog.root);
    dog.root.position.set(b.x, .05, b.z); dog.root.rotation.y = Math.PI / 4; dog.setFace('happy');
    this.dogHome = new THREE.Vector2(b.x, b.z); this.dState = 'nap'; this.dT = this.T.dog.first; this.dPath = []; this.dRe = 0; this._zz = 0;
  }

  // ── the floor overlay: her eyes now (warm) and where she's about to look (red), one canvas
  buildVision() {
    const Rm = this.room, x0 = -Rm.w / 2 - .2, x1 = Rm.w / 2 + .2, z0 = -Rm.d / 2 - .2, z1 = Rm.d / 2 + .2, R = 22;
    const cv = this.vc = document.createElement('canvas'); cv.width = Math.round((x1 - x0) * R); cv.height = Math.round((z1 - z0) * R);
    this.vctx = cv.getContext('2d'); this.vimg = this.vctx.createImageData(cv.width, cv.height);
    this.vbox = { x0, z0, R, w: cv.width, h: cv.height };
    const tex = this.vtex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, .05, (z0 + z1) / 2); m.renderOrder = 2;
    this.L.world.root.add(m); this.vmesh = m; this._vKey = '';
  }
  // { half, range, k (how fast she notices) } of her eyes in a state
  sight(st = this.mState) {
    switch (st) {
      case 'intro': return { half: 34 * DEG, range: 3.4, k: .9 };
      case 'think': return { half: 26 * DEG, range: 2.3, k: .8 };
      case 'turn': case 'walk': case 'hmm': return { half: 36 * DEG, range: 4.4, k: 1 };
      case 'check': return { half: 30 * DEG, range: 1.25, k: .9 };
      case 'done': return { half: 30 * DEG, range: 2.0, k: .9 };
      case 'glance': return { half: 50 * DEG, range: 5.4, k: 1.2 };
      case 'dist': return { half: 40 * DEG, range: 5.0, k: .7 };
      default: return null;
    }
  }
  // where she's about to look: in 'think' along her way to the place she named, in 'hmm' wherever she's turning to
  preview() {
    if (this.mState === 'think' && this.target) return { yaw: this.targetYaw, ...this.sight('walk') };
    if (this.mState === 'hmm') return { yaw: this.lookYaw, ...this.sight('glance') };
    return null;
  }
  canSee(x, z, ph, yaw = this.momYaw, S = this.sight(), eye = this.eye) {
    if (!S) return false;
    const dx = x - eye.x, dz = z - eye.z, r = Math.hypot(dx, dz);
    if (r > S.range) return false;
    if (r > .35 && Math.abs(wrap(Math.atan2(dx, dz) - yaw)) > S.half) return false;
    return sees(eye, this.occ, x, z, ph);
  }
  paint() {
    if (this.noPaint) return;
    const { x0, z0, R, w, h } = this.vbox, d = this.vimg.data, e = this.eye;
    const S = this.result ? null : this.sight(), P = this.result ? null : this.preview();
    const ear = this.T.hear && !this.result && !BUSY_MOM.has(this.mState) ? this.T.hear : 0;
    const key = `${this.mState}|${this.momYaw.toFixed(3)}|${e.x.toFixed(2)},${e.z.toFixed(2)}|${P ? P.yaw.toFixed(3) + '|' + Math.floor(this.t * 8) : ''}|${ear}`;
    if (key === this._vKey) return; this._vKey = key;
    d.fill(0);
    const layers = [];
    if (P) { const k = Math.abs(Math.sin(this.t * 9)); layers.push({ yaw: P.yaw, half: P.half, range: P.range, a: 95 + 60 * k, c: [255, 66, 98], ra: 230, rc: [214, 30, 70] }); }
    if (S) layers.push({ yaw: this.momYaw, half: S.half, range: S.range, a: 165, c: [255, 240, 120], ra: 235, rc: [255, 160, 40] });
    if (layers.length || ear) {
      const step = 2;
      for (let py = 0; py < h; py += step) for (let px = 0; px < w; px += step) {
        const x = x0 + (px + 1) / R, z = z0 + (py + 1) / R, dx = x - e.x, dz = z - e.z, r = Math.hypot(dx, dz);
        if (r < .2) continue;
        const ang = Math.atan2(dx, dz);
        let hit = null, seen = null;
        if (ear && Math.abs(r - ear) < .07 && Math.sin(ang * 34) > 0) hit = { a: 150, c: [255, 255, 255] };   // her earshot (days 2–3): a dashed ring
        for (const Ly of hit ? [] : layers) {
          if (r > Ly.range) continue;
          const da = Math.abs(wrap(ang - Ly.yaw)); if (da > Ly.half) continue;
          if (seen == null) seen = sees(e, this.occ, x, z, CARRY_H);
          if (!seen) break;
          const rim = (Ly.half - da) * r < .07 || Ly.range - r < .09;
          hit = rim ? { a: Ly.ra, c: Ly.rc } : { a: Ly.a * Math.min(1, .55 + (Ly.range - r) / 1.6), c: Ly.c }; break;
        }
        if (!hit) continue;
        for (let yy = 0; yy < step; yy++) for (let xx = 0; xx < step; xx++) {
          const k = ((py + yy) * w + (px + xx)) * 4; d[k] = hit.c[0]; d[k + 1] = hit.c[1]; d[k + 2] = hit.c[2]; d[k + 3] = hit.a;
        }
      }
    }
    this.vctx.putImageData(this.vimg, 0, 0); this.vtex.needsUpdate = true;
  }

  // ── HUD: mom's face with what she's after + the clock in one bar, the day; a hint line; the "저기 봐!" button
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col();
    const top = h('div', { class: 'topbar' });
    this.timerEl = h('div', { class: 'timer rp-timer' }, h('div', { class: 'face' }, this.faceImg = h('img', { src: L.thumbs.face_mom_normal })),
      h('div', { class: 'rp-tcol' }, this.tlEl = h('div', { class: 'tl' }, '엄마가 성적표를 찾는 중…'), h('div', { class: 'tbar' }, this.tbarI = h('i', { style: 'width:100%' }))),
      this.tnum = h('div', { class: 'num ol' }, String(this.lv.time)));
    top.append(L.homeBtn(), this.timerEl, h('div', { class: 'stagetag ol rp-day', html: LANG === 'en' ? `DAY<b>${this.lvIdx + 1}</b>` : `<b>${this.lvIdx + 1}</b>일째` }));   // (숨바꼭집: the English tag reads DAY / n like STAGE / n)
    col.append(top);
    this.hint = h('div', { class: 'rp-hint ol' }, h('span', { class: 'rp-hand' }), this.hintTx = h('span', {}, ''));
    col.append(this.hint);
    this.lookBtn = ui.btn('엄마! 저기 봐!', { color: 'pink', cls: 'rp-look', onClick: () => this.distract() });
    this.lookN = h('div', { class: 'badge' }, '1'); this.lookBtn.append(this.lookN);
    col.append(this.lookBtn); this.drawLook();
    this.vig = h('div', { class: 'rp-vig' }); document.getElementById('app').append(this.vig);
  }
  drawLook() { this.lookBtn.style.display = this.looks > 0 && !this.result ? '' : 'none'; this.lookN.textContent = String(this.looks); }
  setHint(t, first = false) {
    if (this.hintTx.textContent !== t) this.hintTx.textContent = t;
    this.hint.classList.toggle('gone', !t); this.hint.classList.toggle('first', first);
  }
  gotCard(title, name, sub) {
    const L = this.L, h = L.h;
    const c = h('div', { class: 'rp-get' }, h('div', { class: 'rp-get-t ol' }, title), h('div', { class: 'rp-get-n' }, name), h('div', { class: 'rp-get-s' }, sub));
    document.getElementById('app').append(c); this._gets = (this._gets || []).concat(c); L.audio.sfx('special');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2400);
  }
  meFace(f) { if (this.me.face !== f) this.me.setFace(f); }
  momFace(f) { if (this.mom.face !== f) this.mom.setFace(f); }
  // a speech bubble over a character (as L.say, but kept inside the screen's edges)
  say(ch, text, ms = 1200, cls = '') {
    const L = this.L, b = L.h('div', { class: 'bubble pop ' + cls }, text), V = new THREE.Vector3(); L.ui.wui.append(b);
    const upd = () => { const p = L.world.toScreen(V.copy(ch.root.position).setY(ch.root.position.y + ch.headTop() + .22)), hw = b.offsetWidth / 2 + 6; b.style.left = clamp(p.x, hw, Math.max(hw, innerWidth - hw)) + 'px'; b.style.top = Math.max(40, p.y) + 'px'; };
    upd(); const iv = setInterval(upd, 30); setTimeout(() => { clearInterval(iv); b.remove(); }, ms);
    return b;
  }
  momSay(text, ms = 1200, cls = '') { this.momB?.remove(); this.momB = this.say(this.mom, text, ms, cls); return this.momB; }
  meSay(text, ms = 900, cls = '') { this.meB?.remove(); this.meB = this.say(this.me, text, ms, cls); return this.meB; }
  float(v3, text, cls = '') { const s = this.L.world.toScreen(v3); this.L.ui.floatText(s.x, s.y, text, cls); }

  // ── input: drag from anywhere = 몽글이 takes the card out and runs toward your finger; let go = tucked into the
  // hiding place nearest the finger. A tap on a hiding place = he takes it there by himself.
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => {
      if (e.button > 0 || this.result || !this.started || this.touch) return;
      this.touch = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, steer: false };
    };
    this._move = e => {
      const T = this.touch; if (!T || e.pointerId !== T.id) return;
      T.x = e.clientX; T.y = e.clientY;
      if (!T.steer && Math.hypot(T.x - T.x0, T.y - T.y0) > 14) { T.steer = true; this.beginSteer(); }
    };
    this._up = e => {
      const T = this.touch; if (!T || (e?.pointerId != null && e.pointerId !== T.id)) return;
      this.touch = null;
      if (this.result || !this.started || e?.type === 'blur') return;
      const s = this.spotAtScreen(T.x, T.y - (T.steer ? LIFT : 0), T.steer);
      if (s) this.order(s);
      else if (T.steer && this.meS === 'carry') this.order(this.nearestSpot(this.pos.x, this.pos.y));
    };
    this._blur = () => this._up({ type: 'blur' });
    // (capture: a finger let go over a button still ends the drag)
    app.addEventListener('pointerdown', this._down); addEventListener('pointermove', this._move, true); addEventListener('pointerup', this._up, true); addEventListener('pointercancel', this._up, true); addEventListener('blur', this._blur);
  }
  // the hiding place under a screen point: the piece itself, or the nearest one on screen (a fat finger is fine)
  spotAtScreen(x, y, wide = false) {
    const W = this.L.world;
    const hit = W.pick(x, y, this.spots.map(s => s.f.group))[0];
    if (hit) for (let o = hit.object; o; o = o.parent) { const s = this.spots.find(q => q.f.group === o); if (s) return s; }
    let best = null, bd = wide ? 120 : 80;
    for (const s of this.spots) for (const v of [s.top, new THREE.Vector3(s.stand.x, 0, s.stand.z), s.c]) { const p = W.toScreen(v), d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = s; } }
    return best;
  }
  nearestSpot(x, z, not = null) { let b = null, bd = 1e9; for (const s of this.spots) { if (s === not) continue; const d = Math.hypot(s.stand.x - x, s.stand.z - z); if (d < bd) { bd = d; b = s; } } return b; }
  beginSteer() { if (this.meS === 'idle') this.startGrab(); }
  // send the card to a hiding place (the one way the player and the bots move it)
  order(s) {
    if (!s || this.result || !this.started) return;
    if (this.meS === 'idle' && s === this.cardSpot) { if (!this.touch) { this.meSay('쉿!', 600); this.me.bump(.3); } return; }
    this.dest = s;
    if (this.meS === 'idle') this.startGrab();
    else if (this.meS === 'carry') this.routeTo(s);
    else if (this.meS === 'tuck') this.queued = s;
  }
  routeTo(s) {
    const a = nearestTile(this.grid, this.pos.x, this.pos.y), tiles = a && s.idle ? [a, ...(gridPath(a, s.idle) || [s.idle])] : [s.idle];
    this.route = tiles.map(t => new THREE.Vector2(t.x, t.z));
    if (this.route.length > 1 && this.route[0].distanceTo(this.pos) < .3) this.route.shift();
  }
  startGrab() {
    const s = this.cardSpot, L = this.L; if (!s) return;
    this.meS = 'grab'; this.meT = GRAB_T; this.carryFrom = s; this.cardSpot = null; this.parked = 0; this.everMoved = true; this.moves++;
    this.pos.set(s.idle.x, s.idle.z); this.face = Math.atan2(s.c.x - this.pos.x, s.c.z - this.pos.y);
    this.me.pose = 'push'; this.me.bump(.25); this.openPart(s, .65, GRAB_T);
    L.audio.sfx('swish');   // (pulling it out is quiet; pushing it in rustles)
  }
  startTuck(s) {
    this.meS = 'tuck'; this.meT = TUCK_T; this.dest = s; this.route = [];
    this.face = Math.atan2(s.c.x - this.pos.x, s.c.z - this.pos.y); this.me.pose = 'push';
    this.openPart(s, .7, TUCK_T);
  }
  finishTuck() {
    const s = this.dest, L = this.L, recent = this.isRecent(s);
    this.cardSpot = s; this.meS = 'idle'; this.dest = null; this.parked = 0; this.heat.set(s, 0);
    this.me.pose = 'idle'; this.me.bump(.35); L.audio.sfx('pop', 4 + Math.floor(Math.random() * 4));
    this.float(s.top, '쏙!', 'gold');
    if (recent && this.target !== s) { setTimeout(() => !this.dead && this.float(s.top.clone().setY(s.top.y + .5), '엄마가 방금 본 곳!', 'green'), 180); if (!this._toldRecent) { this._toldRecent = true; this.meSay('여긴 아까 봤지롱~', 1100); } }
    this.rustle(s);
    L.log({ move: s.key, t: +(this.t - (this.t0 || 0)).toFixed(1), mom: this.mState, recent });
    if (this.queued) { const q = this.queued; this.queued = null; this.order(q); }
    else if (this.touch?.steer) this.startGrab();
  }
  // a part of a piece swings open and shut again (몽글이 tucking / pulling it out)
  openPart(s, to, dur) {
    const p = s.part; if (!p) return;
    const tok = s.optok = {};
    this.tw.run(dur, k => { if (s.optok !== tok || s.momOpen) return; p.setOpen(to * Math.sin(k * Math.PI)); }, ease.linear);
  }
  // you can hear it rustle: on day 2 she comes to see what it was, on day 3 she turns round at once
  rustle(s) {
    const T = this.T, L = this.L;
    if (!T.hear || this.result) return;   // (day 1: she doesn't hear it, so it isn't shown)
    this.float(s.top.clone().setY(s.top.y + .3), RUSTLE[Math.floor(Math.random() * 2)], 'rp-f');
    const d = Math.hypot(this.eye.x - s.c.x, this.eye.z - s.c.z);
    if (d > T.hear || BUSY_MOM.has(this.mState) || this.target === s) return;
    if (this.isRecent(s) && !T.remember) return;
    this.forced = s; this.mom.setFace('sus'); L.audio.sfx('hmm');
    if (T.remember && (this.mState === 'walk' || this.mState === 'turn')) this.startHmm(this.yawTo(s.c.x, s.c.z), .55, '응? 무슨 소리지?');
    else this.momSay('응? 무슨 소리지?', 1100, 'think');
  }
  isRecent(s) { return !!s && this.history.slice(-this.T.mem).includes(s); }

  // ── mom
  nextTarget(force = null) {
    const L = this.L, T = this.T;
    let s = force || this.forced; this.forced = null;
    let sniffed = false;
    if (!s && this.script.length) { const k = this.script.shift(); s = k === '@card' ? (this.cardSpot || this.carryFrom) : this.spot(k); }
    if (!s) {
      const recent = new Set(this.history.slice(-T.mem));
      let pool = this.spots.filter(q => q !== this.target && !recent.has(q));
      if (!pool.length) pool = this.spots.filter(q => q !== this.target);
      const ws = pool.map(q => {
        let w = 1 / (1 + .32 * Math.hypot(q.stand.x - this.eye.x, q.stand.z - this.eye.z));
        if (q === this.cardSpot) w += T.nose * (.55 + .5 * this.parked) + (this.heat.get(q) || 0);
        return w;
      });
      let r = Math.random() * ws.reduce((a, b) => a + b, 0); s = pool[pool.length - 1];
      for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) { s = pool[i]; break; } }
      sniffed = s === this.cardSpot && this.parked >= 2;
    }
    this.target = s; this.picks++; this.revealed = false; this.threat = s === this.cardSpot;
    // her way there
    const a = nearestTile(this.grid, this.eye.x, this.eye.z), tiles = a ? (gridPath(a, s.stand) || [s.stand]) : [s.stand];
    this.momPath = tiles.map(t => new THREE.Vector2(t.x, t.z));
    this.targetYaw = this.yawTo(s.c.x, s.c.z); this.momYaw0 = this.momYaw;
    this.mState = 'think'; this.mT = T.tel;
    this.momFace('sus'); this.mom.pose = 'point';
    this.momSay(sniffed ? `킁킁… ${s.name} 수상한데?` : s.ask, Math.max(1100, T.tel * 1000 + 300), 'think');
    L.audio.sfx('hmm');
    if (this.threat) { L.audio.sfx('gasp'); this.meFace('wow'); this.meSay('헉!', 700); this.vig.classList.add('pulse'); setTimeout(() => this.vig?.classList.remove('pulse'), 700); }
  }
  startHmm(yaw, tel, line = '흠…?') {
    if (BUSY_MOM.has(this.mState) || this.mState === 'hmm' || this.mState === 'glance') return;
    this.mState = 'hmm'; this.mT = this.hmmDur = tel; this.lookYaw = yaw; this.hmmYaw0 = this.momYaw;
    this.mom.setFace('sus'); this.momSay(line, Math.max(700, tel * 1000 + 200), 'think'); this.L.audio.sfx('hmm');
    this.glanceCd = 3.5;
  }
  stepMom(dt) {
    const T = this.T, L = this.L, mom = this.mom, p = mom.root.position;
    this.mT -= dt; this.glanceCd = Math.max(0, (this.glanceCd || 0) - dt);
    const turnTo = (goal, k) => { this.momYaw += wrap(goal - this.momYaw) * Math.min(1, k); };
    switch (this.mState) {
      case 'intro':
        turnTo(this.yawTo(this.pos.x, this.pos.y), dt * 4);
        if (this.mT <= 0 && this.started) this.nextTarget();
        break;
      case 'think': {   // she names the place and points; her head comes round a little
        const k = 1 - Math.max(0, this.mT) / T.tel;
        turnTo(this.momYaw0 + wrap(this.targetYaw - this.momYaw0) * .3 * k, dt * 8);
        if (this.mT <= 0) { this.mState = 'turn'; this.mT = .28; mom.pose = 'idle'; L.audio.sfx('swish'); }
        break;
      }
      case 'turn':
        turnTo(this.targetYaw, dt * 14);
        if (this.mT <= 0) this.mState = 'walk';
        break;
      case 'walk': {
        const path = this.momPath;
        if (!path.length) { this.startCheck(); break; }
        const t = path[0], dx = t.x - p.x, dz = t.y - p.z, d = Math.hypot(dx, dz), st = T.walk * dt;
        if (d <= st) { p.x = t.x; p.z = t.y; path.shift(); } else { p.x += dx / d * st; p.z += dz / d * st; }
        turnTo(Math.atan2(this.target.c.x - p.x, this.target.c.z - p.z), dt * 9);   // her eyes stay on the place she named
        mom.lift = Math.abs(Math.sin(this.t * 9)) * .04;
        // now and then she glances back over her shoulder (somewhere behind her: the red shows where first)
        if (T.glance && !this.glanceCd && this.pathLeft() > 1.4 && Math.random() < dt * T.glance) this.startHmm(this.momYaw + Math.PI + (Math.random() - .5) * 2.2, T.gtel);
        break;
      }
      case 'hmm': {
        const k = 1 - Math.max(0, this.mT) / this.hmmDur;
        turnTo(this.hmmYaw0 + wrap(this.lookYaw - this.hmmYaw0) * .2 * k, dt * 8); mom.lift *= .8;
        if (this.mT <= 0) { this.mState = 'glance'; this.mT = .9; this.glance0 = this.t; L.audio.sfx('swish'); }
        break;
      }
      case 'glance':
        turnTo(this.lookYaw + Math.sin((this.t - this.glance0) * 3) * .12, dt * 14);
        if (this.mT <= 0) { this.mState = 'walk'; this.momFace('normal'); }
        break;
      case 'check': {
        const s = this.target; turnTo(Math.atan2(s.c.x - p.x, s.c.z - p.z), dt * 10);
        mom.pose = 'search'; mom.lift = 0; mom.squash = Math.max(mom.squash, .16);   // crouched, nose in it
        const k = 1 - this.mT / T.check;
        if (s.part) s.part.setOpen(Math.min(1, k / .22) * (k > .86 ? Math.max(0, (1 - k) / .14) : 1));
        if ((this._rum = (this._rum || 0) - dt) <= 0) { this._rum = .32; mom.bump(.18); L.audio.sfx(s.part?.kind === 'drawer' ? 'drawer' : 'lift'); if (!this._rumT) { this._rumT = true; const q = this.L.world.toScreen(s.top); this.L.ui.floatText(q.x + 58, q.y - 6, '뒤적뒤적', 'rp-f'); } }
        if (!this.revealed && k > .5) { this.revealed = true; if (this.cardSpot === s && this.meS === 'idle') return this.fail('found'); }
        if (this.mT <= 0) this.endCheck();
        break;
      }
      case 'done':
        if (this.mT <= 0) this.nextTarget();
        break;
      case 'dist': {   // she's gone to look at whatever 몽글이 pointed at
        const LK = this.lv.look, path = this.momPath;
        if (path.length) { const t = path[0], dx = t.x - p.x, dz = t.y - p.z, d = Math.hypot(dx, dz), st = T.walk * 1.2 * dt; if (d <= st) { p.x = t.x; p.z = t.y; path.shift(); } else { p.x += dx / d * st; p.z += dz / d * st; } mom.lift = Math.abs(Math.sin(this.t * 11)) * .05; }
        else mom.lift *= .8;
        turnTo(Math.atan2(LK.at[0] - p.x, LK.at[1] - p.z), dt * 10);
        if (this.mT <= 0) { this.momSay(LK.b, 1200); mom.setFace('sus'); this.mState = 'done'; this.mT = .7; this.forced = this.forced || this.distFrom; }
        break;
      }
    }
    this.eye.x = p.x; this.eye.z = p.z; mom.root.rotation.y = this.momYaw;
  }
  pathLeft() { let d = 0, a = new THREE.Vector2(this.eye.x, this.eye.z); for (const q of this.momPath) { d += a.distanceTo(q); a = q; } return d; }
  startCheck() {
    const s = this.target; this.mState = 'check'; this.mT = this.T.check; this._rum = 0; this._rumT = false; s.momOpen = true;
    this.momSay('어디 보자~', 800, 'rp-sm');
  }
  endCheck() {
    const L = this.L, s = this.target; s.momOpen = false; s.part?.setOpen(0);
    this.mom.pose = 'idle'; this.momFace('normal');
    this.history.push(s); if (this.cardSpot) this.parked++;
    this.momSay(DONE_LINES[Math.floor(Math.random() * DONE_LINES.length)], 750, 'rp-sm');
    if (this.threat) {   // she came for the place the card had been: a dodge
      this.dodges++; this.float(s.top.clone().setY(s.top.y + .4), '헛걸음!', 'gold big'); L.audio.sfx('star');
      const sp = L.world.toScreen(s.top); L.world.fx.burst(sp.x, sp.y, { n: 12, speed: 200 });
      setTimeout(() => !this.dead && !this.result && this.meSay(SAFE_LINES[Math.floor(Math.random() * SAFE_LINES.length)], 800), 350);
      if (!this.gotLook) this.giveLook();
    }
    if (this.lvIdx === 0 && this.history.length === 1) this._recentHintT = 5;
    this.mState = 'done'; this.mT = .5; this.threat = false;
  }
  giveLook() {
    this.gotLook = true; this.looks = 1; this.drawLook(); this.lookBtn.classList.add('rp-new');
    setTimeout(() => this.lookBtn?.classList.remove('rp-new'), 3000);
    this.gotCard('새로 얻었다!', '"엄마! 저기 봐!"', '콕 하면 엄마가 딴 데를 봐요 · 한 번');
  }
  // "엄마! 저기 봐!": she goes over to look for a few seconds, then picks up where she left off
  distract() {
    if (!this.started || this.result || this.looks <= 0 || this.mState === 'dist' || this.mState === 'intro') return;
    const L = this.L, LK = this.lv.look, mom = this.mom, p = mom.root.position;
    this.looks--; this.drawLook();
    if (this.target) { this.target.momOpen = false; this.target.part?.setOpen(0); }
    // the place she was going to look (or looking) in: she comes back to it (unless she'd already looked)
    this.distFrom = this.mState === 'done' ? null : this.target; this.threat = false;
    this.mState = 'dist'; this.mT = 3.2; mom.pose = 'idle'; mom.setFace('wow');
    const a = nearestTile(this.grid, p.x, p.z), b = nearestTile(this.grid, LK.at[0], LK.at[1]);
    const tiles = a && b ? (gridPath(a, b) || []) : []; let acc = 0, prev = new THREE.Vector2(p.x, p.z); this.momPath = [];
    for (const t of tiles) { const v = new THREE.Vector2(t.x, t.z); acc += v.distanceTo(prev); prev = v; if (acc > 2.2) break; this.momPath.push(v); }
    setTimeout(() => !this.dead && !this.result && this.mState === 'dist' && this.momSay(LK.a, 1100), 650);
    this.me.pose = 'point'; this.face = Math.atan2(LK.at[0] - this.pos.x, LK.at[1] - this.pos.y); this.momB?.remove(); this.meSay(LK.call, 1000);
    setTimeout(() => { if (!this.dead && this.me.pose === 'point') this.me.pose = 'idle'; }, 1100);
    L.audio.sfx('whoosh'); L.audio.sfx('giggle');
    L.log({ look: 1, t: +(this.t - (this.t0 || 0)).toFixed(1) });
  }

  // ── 멍뭉이: naps; now and then wakes and follows his nose to the card; barks at it
  stepDog(dt) {
    const dog = this.dog; if (!dog) return;
    const D = this.T.dog, p = dog.root.position, L = this.L;
    this.dT -= dt; this.dRe -= dt;
    const walk = (tx, tz, v) => {
      if (this.dRe <= 0 || !this.dPath.length) { this.dRe = .6; const a = nearestTile(this.grid, p.x, p.z), b = nearestTile(this.grid, tx, tz); this.dPath = a && b ? (gridPath(a, b) || []).map(t => new THREE.Vector2(t.x, t.z)) : []; this.dPath.push(new THREE.Vector2(tx, tz)); }
      const t = this.dPath[0]; if (!t) return true;
      const dx = t.x - p.x, dz = t.y - p.z, d = Math.hypot(dx, dz), st = v * dt;
      if (d <= st) { p.x = t.x; p.z = t.y; this.dPath.shift(); } else { p.x += dx / d * st; p.z += dz / d * st; dog.root.rotation.y += wrap(Math.atan2(dx, dz) - dog.root.rotation.y) * Math.min(1, dt * 10); }
      dog.lift = Math.abs(Math.sin(this.t * 13)) * .04;
      return this.dPath.length === 0;
    };
    const scent = () => this.cardSpot ? this.cardSpot.dogAt : new THREE.Vector3(this.pos.x, 0, this.pos.y);
    switch (this.dState) {
      case 'nap':
        if ((this._zz -= dt) <= 0) { this._zz = 3; this.zzz = this.say(dog, 'Zz…', 2950, 'think rp-sm'); }
        if (this.dT <= 0) { this.dState = 'sniff'; this.dT = D.give; this.zzz?.remove(); this.zzz = null; dog.setFace('normal'); this.say(dog, '킁킁…?', 900); this.dPath = []; this._sn = 1; }
        break;
      case 'sniff': {
        const c = scent(), d = Math.hypot(c.x - p.x, c.z - p.z);
        if ((this._sn -= dt) <= 0) { this._sn = 1.1; this.float(new THREE.Vector3(p.x, .7, p.z), '킁킁', 'rp-f'); }
        dog.rx.rx = .22;
        if (d < .55) { dog.rx.rx = 0; this.bark(); break; }
        walk(c.x, c.z, D.speed);
        if (this.dT <= 0) { this.dState = 'home'; dog.rx.rx = 0; this.say(dog, '…?', 700); this.dPath = []; }
        break;
      }
      case 'bark':
        dog.rx.wag = 1; if ((this._bk -= dt) <= 0) { this._bk = .35; dog.bump(.35); }
        if (this.dT <= 0) { this.dState = 'home'; dog.rx.wag = 0; this.dPath = []; }
        break;
      case 'home':
        if (walk(this.dogHome.x, this.dogHome.y, D.speed * .9)) { this.dState = 'nap'; this.dT = D.every[0] + Math.random() * (D.every[1] - D.every[0]); dog.setFace('happy'); this._zz = 0; dog.lift = 0; }
        break;
    }
  }
  bark() {
    const L = this.L, dog = this.dog, s = this.cardSpot;
    this.dState = 'bark'; this.dT = 1.5; this._bk = 0; dog.setFace('happy');
    this.say(dog, '멍! 멍!', 1300, 'red'); L.audio.sfx('pop', 9); L.audio.sfx('gasp');
    if (this.result) return;
    if (s) {   // at the card's hiding place: mom comes straight over
      if (this.target !== s) {
        if (['intro', 'think', 'turn', 'walk', 'hmm', 'glance', 'done'].includes(this.mState)) { this.nextTarget(s); this.mT += .5; this.momSay('멍뭉아, 거기 뭐 있어?', 1700, 'think'); }
        else this.forced = s;
      }
    } else this.momSay('멍뭉아, 조용히 해~', 1000, 'rp-sm');   // at 몽글이 carrying it: she just shushes him
  }

  // ── per frame
  update(dt) {
    const L = this.L, W = L.world;
    this.t += dt; this.tw.update(dt);
    this.map.update(dt); this.me.update(dt); this.mom.update(dt); this.dog?.update(dt);
    this.placeCard();
    this.drawSpots();
    if (this.camHold) { this.paint(); return; }
    if (!this.started || this.result) { if (!this.result && this.mState === 'intro') this.stepMom(dt); this.placeMe(dt); this.paint(); return; }
    // the clock
    this.time -= dt;
    this.tnum.textContent = String(Math.max(0, Math.ceil(this.time))); this.tbarI.style.width = Math.max(0, this.time / this.lv.time * 100) + '%';
    this.timerEl.classList.toggle('danger', this.time < 8);
    if (this.time <= 0) return this.win();
    if (this.lvIdx === 0 && !this.gotLook && this.t - this.t0 > 24) this.giveLook();
    this.stepMom(dt); if (this.result) return;
    this.stepDog(dt);
    this.stepMe(dt);
    this.watch(dt); if (this.result) return;
    this.paint();
    this.drawHud(dt);
  }
  stepMe(dt) {
    const me = this.me, p = this.pos, L = this.L, W = L.world;
    switch (this.meS) {
      case 'idle': {
        const s = this.cardSpot; if (s) { p.x += (s.idle.x - p.x) * Math.min(1, dt * 8); p.y += (s.idle.z - p.y) * Math.min(1, dt * 8); }
        const dm = Math.hypot(this.eye.x - p.x, this.eye.z - p.y);
        this.face = dm < 3.2 ? Math.atan2(this.eye.x - p.x, this.eye.z - p.y) : Math.PI / 4;
        me.lift *= .8; if (me.pose === 'push' || me.pose === 'stretch') me.pose = 'idle';
        break;
      }
      case 'grab':
        this.meT -= dt;
        if (this.meT <= 0) { this.meS = 'carry'; this.me.pose = 'stretch'; if (this.dest && !this.touch?.steer) this.routeTo(this.dest); }
        break;
      case 'carry': {
        let tx = null, tz = null, steer = !!this.touch?.steer;
        if (steer) { const g = W.screenToGround(this.touch.x, this.touch.y - LIFT, 0); if (g) { tx = clamp(g.x, this.B.x0, this.B.x1); tz = clamp(g.z, this.B.z0, this.B.z1); } }
        me.pose = 'stretch';
        if (steer) {
          if (tx != null) {
            const dx = tx - p.x, dz = tz - p.y, d = Math.hypot(dx, dz);
            if (d > .08) {
              const st = Math.min(d, CARRY * dt), mx = dx / d, mz = dz / d;
              if (this.free(p.x + mx * st, p.y + mz * st)) { p.x += mx * st; p.y += mz * st; }
              else if (this.free(p.x + mx * st, p.y)) p.x += mx * st;
              else if (this.free(p.x, p.y + mz * st)) p.y += mz * st;
              this.face = Math.atan2(mx, mz); this.stepFx(dt);
            }
          }
          if ((this._ss = (this._ss || 0) - dt) <= 0) { this._ss = .1; this.steerSpot = this.spotAtScreen(this.touch.x, this.touch.y - LIFT, true); }
        } else {
          this.steerSpot = null;
          const t = this.route[0];
          if (!t) { if (this.dest) this.startTuck(this.dest); else this.order(this.nearestSpot(p.x, p.y)); break; }
          const dx = t.x - p.x, dz = t.y - p.y, d = Math.hypot(dx, dz), st = CARRY * dt;
          if (d <= st) { p.copy(t); this.route.shift(); } else { p.x += dx / d * st; p.y += dz / d * st; this.face = Math.atan2(dx, dz); }
          this.stepFx(dt);
        }
        break;
      }
      case 'tuck':
        this.meT -= dt;
        if (this.dest) { const s = this.dest; p.x += (s.idle.x - p.x) * Math.min(1, dt * 12); p.y += (s.idle.z - p.y) * Math.min(1, dt * 12); }
        if (this.meT <= 0) this.finishTuck();
        break;
    }
    this.placeMe(dt);
  }
  stepFx(dt) {
    const me = this.me; me.lift = Math.abs(Math.sin(this.t * 15)) * .07;
    if ((this._ft = (this._ft || 0) - dt) <= 0) { this._ft = .17; this.L.audio.sfx('tap', 8 + Math.floor(Math.random() * 6)); }
  }
  placeMe(dt) {
    const me = this.me, p = this.pos;
    me.root.position.set(p.x, 0, p.y);
    const r = me.root.rotation.y; me.root.rotation.y = r + wrap(this.face - r) * Math.min(1, dt * 14);
  }
  // the card: over 몽글이's head while it's out, flying in and out of the hiding place
  placeCard() {
    const c = this.card; if (this.revealCard) return;
    const head = new THREE.Vector3(this.pos.x, this.me.headTop() + .12 + Math.sin(this.t * 14) * .02, this.pos.y);
    c.rotation.set(0, Math.PI / 4, 0);
    if (this.meS === 'carry') { c.visible = true; c.position.copy(head); c.rotation.z = Math.sin(this.t * 10) * .12; c.scale.setScalar(2.1); }
    else if (this.meS === 'grab' && this.carryFrom) { const k = ease.outQuad(1 - this.meT / GRAB_T); c.visible = true; c.position.lerpVectors(this.carryFrom.cardAt, head, k); c.scale.setScalar(.8 + 1.3 * k); }
    else if (this.meS === 'tuck' && this.dest) { const k = ease.inQuad(1 - this.meT / TUCK_T); c.visible = true; c.position.lerpVectors(head, this.dest.cardAt, k); c.scale.setScalar(2.1 - 1.4 * k); }
    else c.visible = false;
  }
  // her eyes on you: carrying in them fills her suspicion fast (a moment to get out — "어?"); 몽글이 empty-handed in
  // them whistles, and if she keeps seeing him by the card's place she starts to wonder about it
  watch(dt) {
    const L = this.L, S = this.sight(), p = this.pos, out = this.meS !== 'idle';
    const seenCard = out && this.canSee(p.x, p.y, CARRY_H, this.momYaw, S);
    if (seenCard) { this.sus += dt * this.T.sus * S.k; this.peak = Math.max(this.peak, this.sus); }
    else this.sus = Math.max(0, this.sus - dt * 1.5);
    if (this.sus > .28 && !this._eh) { this._eh = true; this.momSay('어?', 700, 'think'); L.audio.sfx('gasp'); this.meFace('wow'); }
    if (this.sus <= 0) {
      if (this.peak > .28) { this.near++; this.float(new THREE.Vector3(p.x, 1.3, p.y), '아슬아슬!', 'gold big'); L.audio.sfx('phew'); this.meSay('휴~', 700); this.meFace('normal'); }
      this.peak = 0; this._eh = false;
    }
    if (this.sus >= 1) return this.fail('seen');
    // the whistle
    this.idleCd = Math.max(0, this.idleCd - dt);
    if (!out && this.canSee(p.x, p.y, IDLE_H, this.momYaw, S)) {
      this.idleSeen += dt;
      if ((this._wh = (this._wh || 0) - dt) <= 0) { this._wh = .9; this.me._fx(this.tw, 'note', { x: .3, y: .95, rise: .35, dur: .8 }); if (Math.random() < .5) this.meSay('휘~♪', 650, 'rp-sm'); }
      if (this.idleSeen > 1.6 && !this.idleCd && this.cardSpot && !BUSY_MOM.has(this.mState)) {
        this.idleSeen = 0; this.idleCd = 6; this.heat.set(this.cardSpot, (this.heat.get(this.cardSpot) || 0) + .7);
        this.momSay('몽글아, 거기서 뭐 해~?', 1200); setTimeout(() => !this.dead && !this.result && this.meSay('아, 아무것도 아니야~♪', 1100), 500);
      }
    } else this.idleSeen = Math.max(0, this.idleSeen - dt * .5);
    // faces: sweating while she's near the card; a heartbeat while the card is in her eyes or her next look
    const s = this.cardSpot, near = s && Math.hypot(this.eye.x - s.c.x, this.eye.z - s.c.z) < 2.2;
    if (this.sus < .28) this.meFace(near || (out && this.mState !== 'check') ? 'sweat' : this.target === s && s ? 'wow' : 'normal');
    const P = this.preview(), inNext = out && P && this.canSee(p.x, p.y, CARRY_H, P.yaw, P);
    if ((seenCard || inNext || (this.target === s && s && this.mState !== 'check')) && (this._hb = (this._hb || 0) - dt) <= 0) { this._hb = .42 - Math.min(.2, this.sus * .2); L.audio.sfx(this._hbk = !this._hbk ? 'tick' : 'tock'); }
    this.vig.style.opacity = seenCard ? String(.3 + this.sus * .5) : inNext ? '.28' : '0';
  }
  drawHud(dt) {
    const s = this.target, card = this.cardSpot, danger = !!s && s === card && !['done', 'dist'].includes(this.mState);
    let tl = '엄마가 성적표를 찾는 중…', face = 'normal';
    if (this.mState === 'dist') { tl = '엄마가 딴 데 봐!'; face = 'wow'; }
    else if (this.mState === 'check' && s) tl = `엄마: ${s.name} 뒤지는 중`;
    else if (s && this.mState !== 'done') tl = `엄마: ${s.name}?`;
    if (danger) { tl = `${s.name} 위험해!`; face = 'sus'; }
    if (this.tlEl.textContent !== tl) this.tlEl.textContent = tl;
    this.timerEl.classList.toggle('rp-alert', danger);
    if (this._face !== face) { this._face = face; const src = this.L.thumbs['face_mom_' + face]; if (src) this.faceImg.src = src; }
    // the hint says what to do right now (only when there is something to say)
    this._recentHintT = Math.max(0, (this._recentHintT || 0) - dt);
    let hint = '', first = false;
    if (this.lvIdx === 0 && !this.everMoved) { hint = danger ? '엄마가 온다! 성적표를 끌어서 딴 데로!' : '성적표를 끌어서 다른 곳에 쏙!'; first = true; }
    else if (danger && this.meS === 'idle') hint = '엄마가 온다! 얼른 딴 데로!';
    else if (this.meS !== 'idle' && this.lvIdx === 0 && this.moves <= 2) hint = '노란 빛(엄마 눈)은 피해서!';
    else if (this.dState === 'sniff') hint = '멍뭉이가 냄새 맡는 중!';
    else if (this._recentHintT > 0) hint = '엄마가 방금 본 곳(✓)이 제일 안전!';
    else if (this.mState === 'check' && this.lvIdx === 0 && this.moves < 4 && !this.isRecent(card)) hint = '지금이야! 엄마가 뒤지는 중';
    this.setHint(hint, first);
  }
  // rings on the floor and badges over each hiding place
  drawSpots() {
    const W = this.L.world, t = this.t, h = this.L.h;
    const dest = this.meS === 'carry' || this.meS === 'tuck' ? (this.touch?.steer ? this.steerSpot : this.dest) : null;
    for (const s of this.spots) {
      const tgt = s === this.target && !['done', 'end'].includes(this.mState) && !this.result, card = s === this.cardSpot, rec = this.isRecent(s) && !tgt;
      const m = s.ring.material;
      if (s === dest) { m.color.set('#ffe36b'); m.opacity = .85; s.ring.scale.setScalar(1.15 + Math.sin(t * 12) * .08); }
      else if (tgt) { m.color.set('#ff4f66'); m.opacity = .6 + Math.sin(t * 10) * .25; s.ring.scale.setScalar(1.3 + Math.sin(t * 10) * .1); }
      else if (card) { m.color.set('#ff9ec2'); m.opacity = .55; s.ring.scale.setScalar(1); }
      else if (rec) { m.color.set('#7dffc4'); m.opacity = .5; s.ring.scale.setScalar(1); }
      else { m.color.set('#ffffff'); m.opacity = this.result ? 0 : .26; s.ring.scale.setScalar(1); }
      const key = this.result ? '' : `${tgt ? 't' : ''}${card ? 'c' : ''}${rec ? 'r' : ''}${s === dest ? 'd' : ''}${card && this.lvIdx === 0 && !this.everMoved && this.started ? 'h' : ''}${card && this.parked >= 2 && !rec ? 's' : ''}`;
      if (key !== s.bkey) {
        s.bkey = key; const b = s.badge; b.className = 'rp-spot'; b.innerHTML = '';
        if (s === dest) { b.classList.add('dest'); b.append(h('span', { class: 'ol' }, s.name)); }
        else if (card) { b.classList.add('card'); if (tgt) b.classList.add('tgt'); if (key.includes('h')) b.classList.add('hand'); if (key.includes('s')) b.classList.add('smell'); b.append(h('img', { src: this.L.thumbs.item_report })); if (tgt) b.append(h('i', {}, '!')); }
        else if (tgt) { b.classList.add('tgt'); b.append(h('i', {}, '?')); }
        else if (rec) { b.classList.add('chk'); b.append(h('i', {}, '✓')); }
        else b.classList.add('off');
      }
      if (key) { const p = W.toScreen(s.top); s.badge.style.left = p.x + 'px'; s.badge.style.top = p.y + 'px'; }
    }
  }

  // ── end
  fail(how) {
    if (this.result) return;
    const L = this.L, mom = this.mom, me = this.me, W = L.world; this.result = 'fail'; this.touch = null; this.how = how;
    const s = how === 'found' ? this.cardSpot : null;
    this.failMom = `${this.mState}${this.dState ? '/' + this.dState : ''}`; this.mState = 'end';
    L.log({ result: 'fail', lv: this.lvIdx + 1, how, t: +(this.t - (this.t0 || 0)).toFixed(1), spot: s?.key || null });
    L.audio.sfx('gasp');
    // the card goes up into her hands
    const c = this.card; this.revealCard = true; c.visible = true;
    const from = s ? s.cardAt.clone() : c.position.clone(), mp = mom.root.position;
    mom.root.rotation.y = this.momYaw = Math.atan2((s ? s.c.x : this.pos.x) - mp.x, (s ? s.c.z : this.pos.y) - mp.z);
    this.tw.run(.55, k => { c.position.set(from.x + (mp.x - from.x) * k, from.y + (mom.headTop() + .35 - from.y) * k + Math.sin(k * Math.PI) * .6, from.z + (mp.z - from.z) * k); c.scale.setScalar(1.2 + k * 1.4); c.rotation.set(0, Math.PI / 4, Math.sin(k * 12) * .2 * (1 - k)); });
    mom.setFace('wow'); mom.pose = 'idle'; this.momSay(s ? '어머? 이게 뭐야~?' : '몽글아, 그거 뭐니?', 1000);
    me.setFace('wow'); me.pose = 'flail'; this.meSay('헉!', 800);
    if (s?.part) s.part.setOpen(1);
    W.flyTo(this.tw, { target: new THREE.Vector3(mp.x * .7 + this.pos.x * .3, .7, mp.z * .7 + this.pos.y * .3), zoom: 1.75, dur: .5 });
    this.camHold = true; this.vig.style.opacity = '.55'; this.drawLook(); this.setHint('');
    setTimeout(() => {
      if (this.dead) return;
      const h = L.h;
      this.reveal = h('div', { class: 'rp-reveal' }, h('div', { class: 'hd' }, '성적표'), h('div', { class: 'nm' }, '이름: 몽글이'),
        h('div', { class: 'row' }, h('span', {}, '국어'), h('b', {}, '85')), h('div', { class: 'row' }, h('span', {}, '영어'), h('b', {}, '70')),
        h('div', { class: 'row math' }, h('span', {}, '수학'), h('b', { class: 'ol' }, '32')));
      document.getElementById('app').append(this.reveal);
      mom.setFace('angry'); mom.pose = 'hips'; mom.bump(.6); this.momSay('수학 32점?!', 1600, 'red'); L.audio.sfx('angry');
      mom._fx(this.tw, 'anger', { x: .38, y: 1.0, dur: 1.2, s: 1.3 });
      me.setFace('dizzy'); me.pose = 'cover';
      W.fx.ring(innerWidth / 2, innerHeight * .4, { r: 140, color: '#ff5d6c', width: 10, life: .5 });
    }, 900);
    setTimeout(() => {
      if (this.dead) return;
      const h = L.h; this.reveal?.classList.add('out');
      L.ui.panel({ title: '들켰다!', color: 'red', body: [h('div', { class: 'rp-endface' }, h('img', { src: L.thumbs.face_mom_angry })),
        h('div', { class: 'txt' }, '"몽글아!!! 이리 와 봐!"'),
        h('div', { class: 'rp-tip' }, how === 'found' ? '엄마가 말한 곳에선 얼른 빼내기!' : '노란 빛(엄마 눈) 속으론 들고 가지 않기!')],
        buttons: [this.againBtn = L.ui.btn('다시 하기', { color: 'orange', cls: 'big', onClick: () => L.go({ lv: this.lvIdx }) })] });
    }, 2700);
  }
  win() {
    if (this.result) return;
    const L = this.L, me = this.me, mom = this.mom; this.result = 'win'; this.touch = null;
    this.mState = 'end'; this.target?.part?.setOpen(0);
    if (this.meS !== 'idle') { this.meS = 'idle'; this.card.visible = false; }
    L.log({ result: 'win', lv: this.lvIdx + 1, dodges: this.dodges, near: this.near, moves: this.moves });
    mom.setFace('sus'); mom.pose = 'hips'; this.momSay('이상하다… 아직 안 나왔나?', 1800, 'think');
    me.setFace('happy'); me.pose = 'cheer'; L.audio.sfx('win'); L.world.fx.confetti(110);
    this.vig.style.opacity = '0'; this.drawLook(); this.setHint('');
    setTimeout(() => !this.dead && this.meSay('내일 보여드려야지~', 1500), 1000);
    setTimeout(() => {
      if (this.dead) return;
      const h = L.h, last = this.lvIdx >= LEVELS.length - 1;
      L.ui.panel({ title: '성적표 지키기 성공!', color: 'green', body: [
        h('div', { class: 'rp-endface' }, h('img', { src: L.thumbs.face_mong_happy })),
        h('div', { class: 'rp-stats' }, h('div', {}, h('b', {}, String(this.dodges)), h('span', {}, '엄마 헛걸음')), h('div', {}, h('b', {}, String(this.near)), h('span', {}, '아슬아슬'))),
        h('div', { class: 'txt' }, this.dodges >= 3 ? '엄마를 완전히 따돌렸어!' : '휴… 오늘은 무사히 넘겼다')],
        buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
          this.nextBtn = L.ui.btn(last ? '처음부터' : '다음 날', { color: 'green', cls: 'big', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) })] });
    }, 2100);
  }
  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.classList.remove('rp-eve');
    app.removeEventListener('pointerdown', this._down); removeEventListener('pointermove', this._move, true); removeEventListener('pointerup', this._up, true); removeEventListener('pointercancel', this._up, true); removeEventListener('blur', this._blur);
    for (const s of this.spots || []) { s.part?.setOpen(0); if (s.ring) { W.root.remove(s.ring); disposeTree(s.ring); } s.badge?.remove(); }
    for (const o of [this.map?.group, this.me?.root, this.mom?.root, this.dog?.root, this.card, this.vmesh].filter(Boolean)) { W.root.remove(o); disposeTree(o); }
    this.vig?.remove(); this.reveal?.remove(); this.zzz?.remove(); (this._gets || []).forEach(c => c.remove()); this.vtex?.dispose();
    this._css?.remove(); this.tw.clear(); W.camLock = false;
  }

  // ── bots (QA) send the card the way a tap does (order) and press the same button.
  // smart: predicts where her eyes will be (predict) and gets the card out of a place she's named to the best place —
  // one she has just looked in — along a way those eyes won't cover and out of her earshot; re-targets mid-run if a glance
  // comes; moves away from the dog's nose only when it's safe; when she's moved on, slips the card into the place she
  // just left; "저기 봐!" when she's about to open the card's place and there's no way out. random: random places at
  // random times (and the button now and then).
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 1.6 && this.L.ui.panelOpen) { this._endT = 0; (this.result === 'win' ? this.nextBtn : this.againBtn)?.press(); } return; }
    if (!this.started) return;
    if (mode === 'random') {
      this._rt = (this._rt ?? 1) - dt;
      if (this._rt <= 0) {
        this._rt = .6 + Math.random() * 3;
        if (this.looks && Math.random() < .12) this.lookBtn.press();
        else this.order(this.spots[Math.floor(Math.random() * this.spots.length)]);
      }
      return;
    }
    // carrying: if the rest of the way has come into her eyes (a glance on its way, a bark), head for another place
    if (this.meS === 'carry') {
      if ((this._rp = (this._rp || 0) - dt) > 0 || !this.dest) return; this._rp = .2;
      const from = nearestTile(this.grid, this.pos.x, this.pos.y), cur = this.botScore(from, this.dest, false);
      if (cur.exp > 0) { const alt = this.botBest(from, true, false, false); if (alt && alt !== this.dest) this.order(alt); }
      return;
    }
    if (this.meS !== 'idle') return;
    const card = this.cardSpot, st = this.mState; if (!card || st === 'intro') return;
    const threatened = (this.target === card && st !== 'done') || this.forced === card;
    if (threatened) {
      const best = this.botBest(card.idle, true);
      if (best) { this.order(best); return; }
      const urgent = (st === 'walk' && this.pathLeft() < 1.3) || (st === 'check' && !this.revealed);
      if (urgent) {
        if (this.looks > 0) { this.lookBtn.press(); return; }
        const any = this.botBest(card.idle, false); if (any) this.order(any);
      }
      return;
    }
    // the dog's nose on it: move it if there's a quite safe way; otherwise let him bark and deal with mom then
    const dogNear = this.dState === 'sniff' && Math.hypot(this.dog.root.position.x - card.cardAt.x, this.dog.root.position.z - card.cardAt.z) < 2.2;
    if (dogNear) { const best = this.botBest(card.idle, true); if (best) this.order(best); return; }
    // slip it into the place she has just left, once she's on her way elsewhere
    if (!this.isRecent(card) && (st === 'think' || st === 'walk' || st === 'turn')) { const best = this.botBest(card.idle, true, true); if (best) this.order(best); }
  }
  // where mom will be and where she'll look `t` seconds from now, as far as can be told (null: by then she'll have
  // picked a new place — she starts that with a short look of thinking)
  predict(t) {
    const T = this.T, st = this.mState, e = this.eye;
    const here = (yaw, S) => ({ eye: { x: e.x, z: e.z, h: EYE_H }, yaw, S });
    const walkOn = t => {
      let d = t * T.walk, a = new THREE.Vector2(e.x, e.z), yaw = this.momYaw;
      for (const q of this.momPath) {
        const l = a.distanceTo(q), c = this.target?.c;
        if (d <= l) { const k = l > 1e-6 ? d / l : 0, x = a.x + (q.x - a.x) * k, z = a.y + (q.y - a.y) * k; return { eye: { x, z, h: EYE_H }, yaw: c ? Math.atan2(c.x - x, c.z - z) : yaw, S: this.sight('walk') }; }
        d -= l; a = q;
      }
      const s = this.target; if (!s) return null;
      if (d > T.check * T.walk + .5 * T.walk) return null;
      return { eye: { x: a.x, z: a.y, h: EYE_H }, yaw: Math.atan2(s.c.x - a.x, s.c.z - a.y), S: this.sight('check') };
    };
    switch (st) {
      case 'think': return t < this.mT + .28 ? here(this.momYaw, this.sight('think')) : walkOn(t - this.mT - .28);
      case 'turn': case 'walk': return walkOn(t);
      case 'hmm': return t < this.mT ? here(this.momYaw, this.sight('hmm')) : t < this.mT + .9 ? here(this.lookYaw, this.sight('glance')) : walkOn(t - this.mT - .9);
      case 'glance': return t < this.mT ? here(this.momYaw, this.sight('glance')) : walkOn(t - this.mT);
      case 'check': return t < this.mT ? here(this.momYaw, this.sight('check')) : t < this.mT + .5 ? here(this.momYaw, this.sight('done')) : null;
      case 'done': return t < this.mT ? here(this.momYaw, this.sight('done')) : null;
      case 'dist': { const LK = this.lv.look; return t < this.mT ? here(Math.atan2(LK.at[0] - e.x, LK.at[1] - e.z), this.sight('dist')) : null; }
      default: return null;
    }
  }
  // how much of the way to s (from a floor tile; with the pull-out first if grab) falls in her eyes as they will be
  botScore(from, s, grab = true) {
    const T = this.T, tiles = [from, ...(gridPath(from, s.idle) || [s.idle])], t0 = grab ? GRAB_T : 0, pts = [{ x: from.x, z: from.z, t: 0 }];
    let len = 0;
    for (let i = 0; i < tiles.length; i++) { if (i) len += Math.hypot(tiles[i].x - tiles[i - 1].x, tiles[i].z - tiles[i - 1].z); pts.push({ x: tiles[i].x, z: tiles[i].z, t: t0 + len / CARRY }); }
    const tEnd = t0 + len / CARRY + TUCK_T; pts.push({ x: s.idle.x, z: s.idle.z, t: tEnd });
    let exp = 0, unk = 0;
    for (const q of pts) { const P = this.predict(q.t); if (!P) { unk++; continue; } if (this.canSee(q.x, q.z, CARRY_H, P.yaw, P.S, P.eye) || Math.hypot(q.x - P.eye.x, q.z - P.eye.z) < .9) exp++; }
    const Pe = this.predict(tEnd), ex = Pe ? Pe.eye : this.eye;
    const heard = !!T.hear && Math.hypot(ex.x - s.c.x, ex.z - s.c.z) < T.hear + .3 && !(this.isRecent(s) && !T.remember);
    const left = this.isRecent(s) ? T.mem - (this.history.length - 1 - this.history.lastIndexOf(s)) : 0;
    return { s, exp, unk, heard, score: exp * 4 + unk * .4 + (heard ? 3 : 0) - left * 2.5 + len * .2 - Math.hypot(this.eye.x - s.c.x, this.eye.z - s.c.z) * .1 };
  }
  botBest(from, safeOnly, recentOnly = false, grab = true) {
    const out = [];
    for (const s of this.spots) {
      if (s === this.cardSpot || s === this.target || s === this.forced) continue;
      if (recentOnly && !this.isRecent(s)) continue;
      if (this.dog && this.dState === 'sniff' && Math.hypot(this.dog.root.position.x - s.cardAt.x, this.dog.root.position.z - s.cardAt.z) < 1.6) continue;
      out.push(this.botScore(from, s, grab));
    }
    out.sort((a, b) => a.score - b.score);
    const pick = safeOnly ? out.find(o => o.exp === 0 && !o.heard && o.unk <= 3) : out[0];
    return pick?.s || null;
  }
  state() {
    return { scene: 'report', lv: this.lvIdx + 1, result: this.result || null, time: +Math.max(0, this.time ?? 0).toFixed(1), spot: this.cardSpot?.key || (this.meS !== 'idle' ? 'carry' : null),
      momTarget: this.target?.key || null, mom: this.mState, me: this.meS, sus: +this.sus.toFixed(2), dodges: this.dodges, near: this.near, moves: this.moves, looks: this.looks, dog: this.dState || null, how: this.how || null, failMom: this.failMom || null };
  }
  get api() { return { win: () => this.win(), fail: h => this.fail(h || 'found'), target: k => this.nextTarget(this.spot(k)), look: () => this.distract(), order: k => this.order(this.spot(k)), spots: () => this.spots.map(s => s.key) }; }
}

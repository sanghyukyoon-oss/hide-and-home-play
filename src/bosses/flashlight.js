// ⑥ 손전등 숨바꼭질 — the lights go out at a pajama party and 몽글이 is 술래, with a flashlight.
//   aim:   press and drag anywhere — the beam swings toward your finger and stays where you leave it. The flashlight is
//          always on; its battery is the clock.
//   rule:  (무궁화 꽃이 피었습니다) a friend caught in the beam while it's out in the open — sneaking across the floor,
//          hopping into a hiding place — freezes on the spot ("얼음!") in whatever silly pose it was in, shivering; one
//          caught peeking out of a hiding place leaps out and freezes right there. Keep it lit about a second:
//          "찾았다!" — it flails and comes over to cheer beside you. Let the beam slip off and it scurries away.
//   dark:  whoever you aren't lighting sneaks off to another hiding place (wardrobe, toy chest, laundry basket, under
//          the blanket…), through the shadows when it can, and the bold ones creep up on you; one that reaches you goes
//          "왁!" — you jump, the beam spins, and the scare costs battery.
//   tells: tucked in a hiding place a friend gives itself away now and then — a giggle, glinting eyes, the lid lifting.
//          That's the moment to light it.
//   floors (the two-storey house): 몽글이 stands on one floor at a time; the ⬆ / ⬇ badge on the stairs sends him up or
//          down. From upstairs the beam also reaches over the balcony rail onto the front of the floor below; from
//          downstairs it can't see the floor above. Friends sneak up and down the stairs while it's dark.
// Find everyone before the battery runs out → the lights come back on.
import * as THREE from 'three';
import { MapRooms, FLOOR_H } from '../map.js';
import { THEMES, layoutFor } from '../stages.js';
import { Char, CHAR_DEFS, defineChar } from '../gfx/chars.js';
import { ICON } from '../ui.js';
import { Tweens, clamp, ease } from '../util.js';
import { walkGrid, gridPath } from '../companion.js';
import { disposeTree, rbox, cyl, put } from '../gfx/kit.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const inRect = (r, x, z, m = 0) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
const V = new THREE.Vector3();
const DARK = { ambColor: '#6a6cc4', amb: .44, sunColor: '#8a8fe6', sun: .24 };
const EYE_H = .38;            // the flashlight's height above the floor (몽글이 is small)
const BODY_H = .3;            // what the beam has to reach on a friend
const SCATTER = 2.0;          // seconds of dark scramble before the flashlight comes on
const OV_R = 20;              // beam-overlay pixels per unit
const PAINT_DT = 1 / 30;      // the beam's light, shadows and floor glow are redrawn at most this often…
const PAINT_YAW = .006;       // …and only once the beam has turned this far (rad) since the last redraw
const QA_CAPPED = typeof location !== 'undefined' && new URLSearchParams(location.search).has('fps');   // a frame-capped QA page is not a slow phone
const NO_OCC = new Set(['rug', 'zabuton', 'robovac', 'stairsup', 'liftbasket']);

// where a friend fits inside (each one has a door, lid, blanket or cloth that lifts): name, how far it opens for a peek
const HIDES = { wardrobe: ['옷장', .16], bed: ['이불 속', .32], chest: ['장난감 상자', .26], boxes: ['상자', .3], sofa: ['소파 쿠션 밑', .4], sofa2: ['소파 쿠션 밑', .4],
  kotatsu: ['코타츠', .28], diningset: ['식탁보 밑', .4], kitchentable: ['식탁보 밑', .4], laundrybasket: ['빨래 바구니', .45], parcel: ['택배 상자', .32], trash: ['휴지통', .4] };
const SEAT_Y = { bed: .4, sofa: .28, sofa2: .28, chest: .12, boxes: .12, laundrybasket: .12, parcel: .12, trash: .1 };

// the friends: how bold (chance to creep up on you instead of moving house), their giveaways and lines
const BASE = { bold: .3, speed: 1, tell: ['킥킥'], found: '앗, 들켰다!', spook: '왁!', run: '꺄~!', tellRate: 1 };
const PERS = {
  bunny: { bold: .25, tell: ['킥킥', '쉿… 킥킥'], found: '앗, 들켰다!', spook: '왁!', run: '꺄~ 불 꺼졌다!' },
  hamster: { bold: 0, speed: .85, tell: ['오물오물', '와삭와삭'], found: '찍! 들켰다…', run: '찍찍!' },
  shiba: { bold: .85, speed: 1.1, tell: ['헥헥', '멍…?'], found: '멍! 들켰다~', spook: '멍멍!!', run: '멍! 숨자!' },
  bear: { bold: .3, tell: ['흐흐', '쿡쿡'], found: '헤헤, 들켰네', spook: '어흥!', run: '흐아~' },
  sleepy: { bold: 0, stay: true, speed: .8, tell: ['zzz…', '쿨… 쿨…'], tellRate: .7, found: '음냐… 벌써 아침?', run: '하암… 어디 숨지' },
  frog: { bold: .5, tell: ['딸꾹!', '개굴… 딸꾹!'], found: '개굴… 딸꾹!', spook: '개굴!!', run: '개굴개굴!' },
  panda: { bold: .15, speed: .9, tell: ['냠냠', '아삭아삭'], found: '대나무 먹다 들켰다', run: '대나무 챙겨!' },
  trickster: { bold: .6, speed: 1.1, slip: .55, foundMul: 1.45, tell: ['히히', '메롱~'], found: '치사해!', spook: '왁!!! 히히', run: '히히, 못 찾을걸?' },
  churro: { bold: .35, tell: ['그르릉…', '…냥'], found: '냐앙…', spook: '냥!', run: '…냥!' },
  squirrel: { bold: .4, speed: 1.05, tell: ['사각사각', '쪼르르'], found: '으앙 들켰다!', spook: '왁!', run: '도토리 챙겨!' },
  coolcat: { bold: .45, tell: ['훗.', '…'], found: '…인정.', spook: '훗!', run: '훗, 쉽지.' },
  peng: { bold: .2, speed: .85, tell: ['펭…', '뒤뚱뒤뚱'], found: '펭! 우리 집인데 들켰다', run: '펭펭! 숨자!' },
  dj: { bold: .45, tell: ['♪ 둠칫', '♪ 둠칫둠칫'], found: '둠칫… 들켰네', spook: '둠칫!!', run: '♪ 숨자~' },
  cheese: { bold: .3, tell: ['골골…', '냥…'], found: '냐앙! 들켰다', spook: '냥!!', run: '냥냥!' },
  raccoon: { bold: .7, speed: 1.1, slip: .45, foundMul: 1.3, tell: ['크크', '쉿…'], found: '에잇, 술래 전문인데!', spook: '왁!!', run: '크크, 날 찾아 봐!' },
  calico: { bold: .25, tell: ['사각사각', '냥냥'], found: '냥! 들켰다', run: '냥~!' },
};
// the night pajama look: a nightcap for the ones without a hat
const CAPS = { hamster: '#ffb3cd', shiba: '#8fcff2', frog: '#ffd36e', panda: '#b9a2ff', churro: '#9fd9c4', raccoon: '#ff9f8f', cheese: '#8fcff2', calico: '#ffd36e' };

// four nights. post(s): where 몽글이 stands with the flashlight (one per floor); look: where the beam points first;
// friends: [kind, first hiding place ('type' or 'type@floor')]; spare: a spare battery on the floor [x, z, floor];
// hint: the one hint line; tutor: the first friend dawdles to its hiding place (the one you catch first)
// Boss slots in 숨바꼭집: lv 1 (거실, with the hint — the first time you meet it) and lv 3 (2층집, the hardest).
const LEVELS = [
  { name: '토순이네 침실', sub: '잠옷 파티 중에 정전!', theme: 'bunny', w: 6, d: 5, wallH: 2.9, hint: true, tutor: true,
    post: [1.5, 1.95], look: [-4, -.95], battery: 45, half: 19, range: 6.6, tell: [4.0, 6.5], tellDur: 1.5, move: [7, 11], sneak: .75, creep: .5, foundT: 1.1, maxCreep: 1, spookCost: 6,
    furniture: [F('bed', 0, 0), F('wardrobe', 1, 0), F('drawers', 2, 0), F('plant', 3, 0), F('boxes', 4, 0), F('chest', 5, 0), F('rug', 2, 2), F('laundrybasket', 0, 3), F('beanbag', 2, 4), F('trash', 5, 2), F('lamp', 0, 2)],
    decor: [D('window', 'N', .5), D('picture', 'N', 2.2), D('clock', 'W', 1.6), D('door', 'W', -1.0)],
    friends: [['bunny', 'bed'], ['hamster', 'chest'], ['shiba', 'boxes']], spare: [2.4, -.6], moon: [{ from: [0, -2.5, 1, -2.5], dir: [.9, 2.1] }] },
  { name: '곰돌이네 거실', sub: '숨은 친구 넷을 찾아라!', theme: 'bear', w: 7, d: 5, wallH: 2.9, hint: true, tutor: true,
    post: [0, 1.95], look: [1, -.5], battery: 58, half: 18, range: 6.8, tell: [4.2, 7.0], tellDur: 1.15, move: [5, 8.5], sneak: .85, creep: .58, foundT: 1.05, maxCreep: 1, spookCost: 7,
    furniture: [F('bookshelf', 0, 0, 0, { seed: 11 }), F('sofa', 1, 0), F('lamp', 3, 0), F('wardrobe', 4, 0), F('chest', 5, 0), F('boxes', 6, 0),
      F('monstera', 0, 1), F('kotatsu', 1, 2), F('diningset', 5, 3), F('laundrybasket', 0, 4), F('parcel', 6, 4)],
    decor: [D('window', 'N', -1.2), D('picture', 'N', 2.4), D('clock', 'W', 1.2), D('window', 'W', -.6)],
    friends: [['bear', 'laundrybasket'], ['sleepy', 'kotatsu'], ['frog', 'chest'], ['panda', 'diningset']], spare: [1.2, -1.2], moon: [{ from: [-1.7, -2.5, -.7, -2.5], dir: [.9, 2.1] }] },
  { name: '말썽이네 집', sub: '한가운데서 사방을 비춰!', theme: 'apt', w: 7, d: 6, wallH: 3.0,
    post: [0, .5], look: [-1, -1], battery: 62, half: 18, range: 5.8, tell: [4.5, 7.5], tellDur: 1.0, move: [4.5, 8], sneak: .9, creep: .64, foundT: 1.1, maxCreep: 2, spookCost: 7,
    furniture: [F('monstera', 0, 0), F('wardrobe', 1, 0), F('bookshelf', 2, 0, 0, { seed: 7 }), F('bigfridge', 4, 0), F('counter', 5, 0), F('boxes', 6, 0),
      F('sofa2', 0, 2, 1), F('floorlamp', 3, 1), F('chest', 6, 2), F('plant', 6, 4), F('laundrybasket', 0, 5), F('parcel', 2, 5), F('diningset', 4, 5), F('trash', 6, 5)],
    decor: [D('balconywin', 'W', 1.8), D('catclock', 'N', -1.5), D('wallshelf2', 'N', .4), D('picture', 'W', -1.2)],
    friends: [['trickster', 'wardrobe'], ['churro', 'laundrybasket'], ['squirrel', 'boxes'], ['coolcat', 'sofa2'], ['shiba', 'diningset']], spare: [2.5, -1.3], moon: [{ from: [-3.5, -1.1, -3.5, -2.5], dir: [2.1, .9] }] },
  // 펭펭이네 2층집 (engine/stages.js MAPS.house2f, refurnished): the living room below, a balcony bedroom up the stairs
  { name: '펭펭이네 2층집', sub: '계단을 톡! 위아래층을 오가며 찾아', theme: 'house2f', map: 'house2f', scatter: 3.2,
    posts: [[.75, 3.0], [-.75, -.75]], look: [.35, -1], looks: [[.35, -1], [.6, -1]], battery: 70, half: 18, range: 6.6, tell: [4.5, 7.5], tellDur: 1.05, move: [5, 8.5], sneak: .9, creep: .66, foundT: 1.1, maxCreep: 2, spookCost: 7,
    cam: { y: 1.55, pitch: .72, zoom: .97, dx: .3, dz: -.25 },
    edit: m => {
      const [down, up] = m.rooms;
      down.layout = { ...down.layout, sun: [], furniture: [F('stairsup', 0, 3), F('plant', 0, 0), F('bookshelf', 1, 0, 0, { seed: 13 }), F('lamp', 2, 0), F('fridge', 3, 0), F('counter', 4, 0, 0, { variant: 'stove' }), F('counter', 5, 0),
        F('sofa', 1, 2), F('chest', 4, 2), F('rug', 1, 3), F('diningset', 4, 5), F('laundrybasket', 0, 6), F('boxes', 5, 6)] };
      up.layout = { ...up.layout, sun: [], furniture: [F('plant', 0, 0), F('wardrobe', 1, 0), F('chest', 3, 0), F('boxes', 4, 0), F('bed', 5, 0), F('rug', 2, 1), F('plant', 5, 2)] };
    },
    friends: [['peng', 'sofa'], ['dj', 'boxes@0'], ['cheese', 'chest@1'], ['raccoon', 'wardrobe'], ['calico', 'laundrybasket']], spare: [2.2, .2, 0] },
];
export { LEVELS };

// ── line of sight on the floor plan (borrowed from ① yasik): an obstacle hides a point if the eye→point line passes
// below its top (heights above that floor). skip: the piece a friend is hiding in (lighting the piece lights its tenant)
function segBox(ax, az, bx, bz, o) {
  let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
  for (const [p, d, lo, hi] of [[ax, dx, o.x0, o.x1], [az, dz, o.z0, o.z1]]) {
    if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return null; continue; }
    let u0 = (lo - p) / d, u1 = (hi - p) / d; if (u0 > u1) [u0, u1] = [u1, u0];
    t0 = Math.max(t0, u0); t1 = Math.min(t1, u1); if (t0 > t1) return null;
  }
  return [t0, t1];
}
function sees(eye, occ, px, pz, ph, skip) {
  for (const o of occ) {
    if (skip && o.rec === skip) continue;
    const r = segBox(eye.x, eye.z, px, pz, o); if (!r) continue;
    if (r[0] < .02 && r[1] < .3) continue;
    if (r[1] > .985) { if (o.h > ph) return false; continue; }
    if (eye.h + (ph - eye.h) * r[1] < o.h) return false;
  }
  return true;
}

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.bubbles = 0; this.hs = 0; this.shake = 0; this.punch = 0; this.ovStep = 2; this.fpsE = 60; this._slowT = 0; this._fastT = 0; }
  async enter({ lv = 0, quick = false } = {}) {
    const L = this.L, W = L.world, ui = L.ui;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx];
    const app = document.getElementById('app'); app.dataset.night = '1';
    L.setBg(['#2a2850', '#14132b']);
    this.th = THEMES[LV.theme] || THEMES.my;
    // pajama nightcaps (removed again in exit)
    this.defs = [];
    for (const [k] of LV.friends) if (CAPS[k] && CHAR_DEFS[k] && !CHAR_DEFS['fl_' + k]) { defineChar('fl_' + k, { ...CHAR_DEFS[k], acc: [...(CHAR_DEFS[k].acc || []), ['nightcap', { color: CAPS[k] }]] }); this.defs.push('fl_' + k); }
    const kindOf = k => CHAR_DEFS['fl_' + k] ? 'fl_' + k : k;
    // the house: one room, or a map of rooms on floors
    const map = this.map = new MapRooms(W, this.mapDef(LV));
    W.root.add(map.group); map.group.updateMatrixWorld(true);
    this.buildFloors();
    this.buildGrid();
    this.posts = (LV.posts || [LV.post]).map((p, k) => { const t = this.near(p[0], this.floors[k].y, p[1], null, k); return { x: t.x, z: t.z, tile: t, k }; });
    this.cur = 0; this.post = new THREE.Vector2(this.posts[0].x, this.posts[0].z); this.postTile = this.posts[0].tile;
    this.buildSpots();
    // the floor 몽글이's light can't reach from his spot on that floor (behind furniture): sneakers take those ways
    for (const t of this.grid) { const P = this.posts[t.f], Fl = this.floors[t.f]; t.shade = !P || !sees({ x: P.x, z: P.z, h: EYE_H }, Fl.occ, t.x, t.z, BODY_H + t.y - Fl.y); }
    // 몽글이 with the flashlight
    const me = this.me = new Char('mong'); W.root.add(me.root);
    me.root.position.set(this.post.x, this.floors[0].y, this.post.y); me.root.scale.setScalar(1.12);
    this.beamYaw = this.aimYaw = this.litYaw = Math.atan2(LV.look[0], LV.look[1]); me.root.rotation.y = this.beamYaw;
    this.torch = this.makeTorch(); me.inner.add(this.torch); me.pose = 'push';
    this.eye = { x: this.post.x, z: this.post.y, h: EYE_H };
    // the friends: sitting together for the party, then off they go
    this.friends = LV.friends.map(([k, home], i) => {
      const P = { ...BASE, ...(PERS[k] || {}) }, ch = new Char(kindOf(k)); W.root.add(ch.root); ch.root.scale.setScalar(1.12);
      const [ht, hf] = home.split('@');
      return { i, k, kind: kindOf(k), P, ch, state: 'party', path: [], spot: null, prog: 0, unlit: 0, t: 0, sayT: 0, tellOn: 0, tellT: 0, moveT: 0, quiet: 0, creepCd: (P.bold > .5 ? 2 : 6) + i, nerv: 0,
        name: CHAR_DEFS[k]?.name || k, home: ht, homeF: hf == null ? null : +hf, foundT: LV.foundT * (P.foundMul || 1) };
    });
    this.seatFriends();
    this.teamSlots = [];
    this.buildLights();
    this.buildBeamFloors();
    this.makeSpare();
    this.frame();
    L.makeThumbs({ faces: [...this.friends.flatMap(Fr => [[Fr.kind, 'normal'], [Fr.kind, 'happy']]), ['mong', 'wow']] });
    this.buildHud();
    this.bindInput();
    this.st = { frz: 0, esc: 0, spot: 0, open: 0, tells: 0, peeks: 0, moves: 0, creeps: 0, climbs: 0 };
    this.battery = LV.battery; this.foundN = 0; this.spooks = 0; this.result = null; this.started = false;
    W.idsDirty = true; W.shadowDirty = true;
    // (quick: straight into the dark, for the simulated QA rounds — the scatter still takes its time)
    if (quick) { this.blackout(true); this.preT = LV.scatter || SCATTER; return; }
    // the party, lights on … then 팟!
    W.setLight(this.th.light || null); this.spot.intensity = 0; this.spill.intensity = 0; for (const Fl of this.floors) Fl.ov.mesh.visible = false;
    for (const Fr of this.friends) Fr.ch.setFace('happy');
    L.audio.music('play');
    await ui.banner(LV.name, LV.sub, 1250);
    if (this.dead) return;
    this.blackout(false);
    this.preT = LV.scatter || SCATTER;   // in the dark a moment while everyone scatters, then the flashlight clicks on (update)
  }
  mapDef(LV) {
    if (LV.map) { const m = layoutFor(LV.map); LV.edit?.(m); return m; }
    const room = { w: LV.w, d: LV.d, theme: this.th, wallH: LV.wallH, walls: { N: 'wall', W: 'wall' }, furniture: LV.furniture, decor: LV.decor, sun: (LV.moon || []).map(m => ({ ...m, a: .16, color: '#aab8ff' })) };
    return { theme: this.th, bleed: true, rooms: [{ at: [0, 0], layout: room }] };
  }
  // the lights go out: everyone shrieks and scatters to its hiding place
  blackout(quick) {
    const L = this.L, W = L.world;
    const from = { a: W.hemi.intensity, s: W.sun.intensity };
    W.setLight(DARK); const to = { a: W.hemi.intensity, s: W.sun.intensity };
    if (!quick) {
      W.hemi.intensity = from.a; W.sun.intensity = from.s;
      this.tw.run(.22, k => { W.hemi.intensity = from.a + (to.a - from.a) * k; W.sun.intensity = from.s + (to.s - from.s) * k; }, ease.linear);
      this.sfx('click'); this.sfx('gasp');
      const s = W.toScreen(V.set(this.post.x * .5, 1.2, this.post.y * .5)); L.ui.floatText(s.x, s.y, '팟!', 'gold big');
      this.me.setFace('wow');
    }
    // scatter: each to its first hiding place (with a tutor, the first friend dawdles — it's the one you catch first)
    this.friends.forEach((Fr, i) => {
      const S = this.spots.find(s => s.type === Fr.home && (Fr.homeF == null || s.f === Fr.homeF) && !s.taken) || this.spots.find(s => !s.taken);
      Fr.ch.setFace('wow'); Fr.ch.pose = 'flail';
      if (!quick && i < 3) setTimeout(() => !this.dead && this.say(Fr, Fr.P.run, 900, '', true), 80 + i * 160);
      this.goSpot(Fr, S, this.lv.tutor && i === 0 ? .42 : 2.2);
    });
  }
  beginPlay() {
    this.started = true; this.spot.intensity = this.spotI; this.spill.intensity = this.spillI; for (const Fl of this.floors) Fl.ov.mesh.visible = true;
    this.me.setFace('normal'); this.me.pose = 'push'; this._force = true;
    if (!this.sim) {
      this.sfx('click');
      // a little flicker as it comes on
      this.tw.run(.35, k => { const on = k > .9 || (k > .25 && k < .55); this.flick = on ? 1 : .15; }, ease.linear).then(() => { this.flick = 1; });
      this.say({ ch: this.me, sayT: 0 }, '딸깍! 다 찾아낼 거야!', 1300, '', true);
    }
    if (this.hint && this.lv.hint) this.hint.classList.remove('gone');
  }

  // ── the house: floors (each with its own occluders for the beam), the walk grid, hiding places
  buildFloors() {
    const lv0 = Math.min(...this.map.rooms.map(R => R.level || 0));
    this.floors = [];
    for (const R of this.map.rooms) {
      const k = (R.level || 0) - lv0, o = R.group.position;
      const Fl = this.floors[k] ||= { k, y: o.y, rooms: [], rect: { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 }, occ: [] };
      Fl.rooms.push(R); const r = Fl.rect;
      r.x0 = Math.min(r.x0, o.x - R.w / 2); r.x1 = Math.max(r.x1, o.x + R.w / 2); r.z0 = Math.min(r.z0, o.z - R.d / 2); r.z1 = Math.max(r.z1, o.z + R.d / 2);
      for (const rec of R.furns) {
        if (NO_OCC.has(rec.type)) continue;
        const b = new THREE.Box3().setFromObject(rec.f.group), h = b.max.y - o.y; if (h < .22) continue;
        const s = .06; Fl.occ.push({ x0: b.min.x + s, x1: b.max.x - s, z0: b.min.z + s, z1: b.max.z - s, h, rec });
      }
    }
  }
  floorOf(y) { return clamp(Math.round((y - this.floors[0].y) / FLOOR_H), 0, this.floors.length - 1); }
  buildGrid() {
    // the walk grid over every floor and the stairs, the biggest connected stretch only
    const all = walkGrid(this.map.rooms, .22), seen = new Set(); let best = [];
    for (const t of all) { if (seen.has(t)) continue; const comp = [], q = [t]; seen.add(t); while (q.length) { const u = q.pop(); comp.push(u); for (const v of u.nb) if (!seen.has(v)) { seen.add(v); q.push(v); } } if (comp.length > best.length) best = comp; }
    const keep = new Set(best);
    for (const t of best) t.nb = t.nb.filter(u => keep.has(u));
    best.forEach((t, k) => { t.k = k; t.y = t.y || 0; t.f = this.floorOf(t.y); });
    this.grid = best;
  }
  // the nearest floor point (y counts three times as much — so it's on the right floor); f: only that floor, no stairs
  near(x, y, z, avoid = null, f = null) {
    let b = null, bd = 1e9;
    for (const t of this.grid) { if (avoid?.has(t) || (f != null && (t.f !== f || t.stair))) continue; const d = (t.x - x) ** 2 + (t.z - z) ** 2 + ((t.y - y) * 3) ** 2; if (d < bd) { bd = d; b = t; } }
    return b;
  }
  buildSpots() {
    this.spots = []; this.dropped = [];
    for (const Fl of this.floors) for (const R of Fl.rooms) for (const rec of R.furns) {
      const hd = HIDES[rec.type]; if (!hd || !rec.f.parts.length) continue;
      const b = new THREE.Box3().setFromObject(rec.f.group), c = b.getCenter(new THREE.Vector3()), P = this.posts[Fl.k];
      const cx = (Fl.rect.x0 + Fl.rect.x1) / 2, cz = (Fl.rect.z0 + Fl.rect.z1) / 2;
      // the floor point in front of it (the side facing the floor's middle wins a tie)
      let t = null, bd = 1e9;
      for (const u of this.grid) { if (u.f !== Fl.k || u.stair) continue; const dd = Math.hypot(u.x - c.x, u.z - c.z); const s = dd + Math.hypot(u.x - cx, u.z - cz) * .15; if (dd < 1.6 && s < bd) { bd = s; t = u; } }
      // a hiding place the flashlight can't reach from where 몽글이 stands would be a friend nobody can ever find
      if (!t || !P || !sees({ x: P.x, z: P.z, h: EYE_H }, Fl.occ, c.x, c.z, Math.min(.7, (b.max.y - Fl.y) * .6), rec)) { this.dropped.push(rec.type + '@' + Fl.k); continue; }
      this.spots.push({ type: rec.type, name: hd[0], peek: hd[1], rec, parts: rec.f.parts, c, top: b.max.y, f: Fl.k, fy: Fl.y, y0: Fl.y + (SEAT_Y[rec.type] ?? 0), t, taken: null, cur: 0, goal: 0, hold: 0, wob: 0 });
    }
  }
  seatFriends() {
    // in a ring on the ground floor, a little way into the room from 몽글이
    const n = this.friends.length, P = this.posts[0], Fl = this.floors[0], used = new Set([this.postTile]);
    const c = this.lv.partyAt || [P.x * .35, P.z * .35];
    this.friends.forEach((Fr, i) => {
      const a = Math.atan2(-P.x, -P.z) + (i - (n - 1) / 2) * (6.28 / Math.max(n, 3));
      const t = this.near(c[0] + Math.sin(a) * .75, Fl.y, c[1] + Math.cos(a) * .75, used, 0) || this.postTile; used.add(t);
      Fr.ch.root.position.set(t.x, t.y, t.z); Fr.ch.faceTo(P.x, P.z);
    });
  }
  // found friends gather round 몽글이 (beside and behind, not in front of where he mostly shines)
  slotsFor(k) {
    if (this.teamSlots[k]) return this.teamSlots[k];
    const P = this.posts[k], Fl = this.floors[k], cx = (Fl.rect.x0 + Fl.rect.x1) / 2 - P.x, cz = (Fl.rect.z0 + Fl.rect.z1) / 2 - P.z, n = Math.hypot(cx, cz) || 1;
    const c = this.grid.filter(t => { const d = Math.hypot(t.x - P.x, t.z - P.z); return t.f === k && !t.stair && d > .4 && d < 1.7; })
      .map(t => ({ t, s: Math.hypot(t.x - P.x, t.z - P.z) + Math.max(0, ((t.x - P.x) * cx + (t.z - P.z) * cz) / n) * 1.2 })).sort((a, b) => a.s - b.s);
    const out = [];
    for (const { t } of c) { if (out.every(u => Math.hypot(u.x - t.x, u.z - t.z) > .55)) out.push(t); if (out.length >= 6) break; }
    while (out.length < 6) out.push(P.tile);
    return (this.teamSlots[k] = out);
  }
  frame() {
    const W = this.L.world, LV = this.lv, r = this.floors[0].rect, C = LV.cam, span = (r.x1 - r.x0 + r.z1 - r.z0) / Math.SQRT2 + .4;
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    W.home.set(cx + (C?.dx ?? 0), C?.y ?? .45, cz + (C?.dz ?? .25)); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = C?.pitch ?? .82; W.zoom = this.zoom0 = C?.zoom ?? 1.08;
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(span, span * .66, .5);
  }

  // ── the flashlight: a warm spotlight with real furniture shadows, a soft spill round 몽글이, a glow cone on the floor(s)
  makeTorch() {
    const g = new THREE.Group();
    g.add(put(cyl(.075, .075, .3, '#ffcf3c'), 0, 0, -.05, Math.PI / 2, 0, 0));
    g.add(put(cyl(.115, .08, .1, '#ff8f6b'), 0, 0, .14, Math.PI / 2, 0, 0));
    this.lens = put(cyl(.1, .1, .02, '#fff6c8', { emissive: '#fff3b0', ei: 1 }), 0, 0, .195, Math.PI / 2, 0, 0); g.add(this.lens);
    g.add(put(rbox(.04, .03, .08, '#ff6f86', .01), 0, .07, -.04));
    g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    g.position.set(.2, .42, .55);
    return g;
  }
  buildLights() {
    const W = this.L.world, LV = this.lv;
    this._sunCast = W.sun.castShadow; W.sun.castShadow = false;   // a night room: only the flashlight casts shadows
    const s = this.spot = new THREE.SpotLight('#ffe4b0', 0, LV.range + 3.5, (LV.half + 5) * Math.PI / 180, .45, .5);
    this.spotI = 3.4;
    s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.camera.near = .05; s.shadow.camera.far = LV.range + 4; s.shadow.bias = -.0008; s.shadow.normalBias = .03;
    if ('intensity' in s.shadow) s.shadow.intensity = .9;
    W.root.add(s); W.root.add(s.target);
    this.spill = new THREE.PointLight('#ffd58a', 0, 2.4, 1.0); this.spillI = .9; W.root.add(this.spill);
    this.placeEye(); this.placeLights();
  }
  // the logical eye (every frame) …
  placeEye() { const p = this.post; this.eye.x = p.x + Math.sin(this.beamYaw) * .22; this.eye.z = p.y + Math.cos(this.beamYaw) * .22; }
  // … and what you see of the beam: moved only on a redraw (see update)
  placeLights() {
    const p = this.post, yaw = this.litYaw, fx = Math.sin(yaw), fz = Math.cos(yaw), Fl = this.floors[this.cur], ey = this.me.root.position.y + EYE_H;
    this.spot.position.set(p.x + fx * .22, ey + .02, p.y + fz * .22);
    // 3.2 ahead on this floor — or, from upstairs out past the balcony, down onto the floor below
    const tx = p.x + fx * 3.2, tz = p.y + fz * 3.2, ty = this.cur > 0 && !inRect(Fl.rect, tx, tz) ? this.floors[this.cur - 1].y : Fl.y;
    this.spot.target.position.set(tx, ty, tz); this.spot.target.updateMatrixWorld();
    this.spill.position.set(p.x + fx * .35, ey + .37, p.y + fz * .35);
  }
  buildBeamFloors() {
    for (const Fl of this.floors) {
      const r = Fl.rect, x0 = r.x0 - .2, x1 = r.x1 + .2, z0 = r.z0 - .2, z1 = r.z1 + .2;
      const cv = document.createElement('canvas'); cv.width = Math.round((x1 - x0) * OV_R); cv.height = Math.round((z1 - z0) * OV_R);
      const ctx = cv.getContext('2d'), img = ctx.createImageData(cv.width, cv.height);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      mesh.rotation.x = -Math.PI / 2; mesh.position.set((x0 + x1) / 2, Fl.y + .022, (z0 + z1) / 2); mesh.renderOrder = 2;
      this.L.world.root.add(mesh);
      Fl.ov = { cv, ctx, img, tex, mesh, x0, z0, w: cv.width, h: cv.height, painted: false };
    }
  }
  // the glow cone on every floor the beam can reach (this one, and the one below from a balcony). Only called on a
  // redraw: when the beam has turned past PAINT_YAW, at most every PAINT_DT; ovStep (2…4 px) coarsens it on slow phones
  paintBeam() {
    if (this.sim) return;
    this.nPaint = (this.nPaint || 0) + 1;
    const LV = this.lv, e = this.eye, half = LV.half * Math.PI / 180, range = LV.range, yaw = this.litYaw, step = this.ovStep;
    for (const Fl of this.floors) {
      const O = Fl.ov, d = O.img.data;
      if (Fl.k > this.cur) { if (O.painted) { d.fill(0); O.ctx.putImageData(O.img, 0, 0); O.tex.needsUpdate = true; O.painted = false; } continue; }
      d.fill(0);
      const here = Fl.k === this.cur;
      for (let py = 0; py < O.h; py += step) for (let px = 0; px < O.w; px += step) {
        const x = O.x0 + (px + step / 2) / OV_R, z = O.z0 + (py + step / 2) / OV_R, dx = x - e.x, dz = z - e.z, r = Math.hypot(dx, dz);
        let a = 0;
        if (here && r < 1.1) a = 46 * (1 - r / 1.1);   // the spill round your feet
        if (r < range && r > .15) {
          const da = Math.abs(wrap(Math.atan2(dx, dz) - yaw));
          if (da < half && this.vis(x, z, Fl.k, .05, null)) a = Math.max(a, 120 * Math.min(1, (half - da) / .14) * Math.min(1, (range - r) / 1.4) * (1 - r / range * .45));
        }
        if (a < 1) continue;
        for (let yy = 0; yy < step && py + yy < O.h; yy++) for (let xx = 0; xx < step && px + xx < O.w; xx++) {
          const q = ((py + yy) * O.w + (px + xx)) * 4; d[q] = 255; d[q + 1] = 214; d[q + 2] = 140; d[q + 3] = a;
        }
      }
      O.ctx.putImageData(O.img, 0, 0); O.tex.needsUpdate = true; O.painted = true;
    }
  }
  // can the eye see (x, z) on floor fi at height ph above that floor? Same floor: furniture in the way. A floor below
  // (from a balcony): the line has to drop past the edge of this floor, then clear the furniture down there.
  vis(x, z, fi, ph, skip) {
    const ef = this.cur, e = this.eye;
    if (fi === ef) return sees(e, this.floors[fi].occ, x, z, ph, skip);
    if (fi > ef) return false;
    const up = this.floors[ef], dn = this.floors[fi], H = up.y - dn.y, eh = H + EYE_H;
    const t = (eh - H) / Math.max(.01, eh - ph), cx = e.x + (x - e.x) * t, cz = e.z + (z - e.z) * t;
    if (inRect(up.rect, cx, cz, -.04)) return false;
    if (!sees(e, up.occ, cx, cz, 0, null)) return false;
    return sees({ x: e.x, z: e.z, h: eh }, dn.occ, x, z, ph, skip);
  }
  // within the beam's reach at all (any direction) — the bots use it to know what they could light from here
  reach(x, z, fi, ph, skip) { return Math.hypot(x - this.eye.x, z - this.eye.z) <= this.lv.range && this.vis(x, z, fi, ph, skip); }
  // is a point lit right now? (in the cone, in range, nothing in the way but the piece it's hiding in)
  litAt(x, z, fi, h = BODY_H, skip = null) {
    if (!this.started || this.battery <= 0 || this.result) return false;
    const e = this.eye, dx = x - e.x, dz = z - e.z, r = Math.hypot(dx, dz);
    if (r > this.lv.range) return false;
    if (Math.abs(wrap(Math.atan2(dx, dz) - this.beamYaw)) > this.lv.half * Math.PI / 180 + Math.atan2(.16, Math.max(r, .3))) return false;
    return this.vis(x, z, fi, h, skip);
  }
  // a spare battery lying in the dark (light it a moment to take it: +10 s)
  makeSpare() {
    const g = new THREE.Group(), at = this.lv.spare, f = at[2] || 0;
    g.add(put(cyl(.09, .09, .3, '#5ad17a', { emissive: '#5ad17a', ei: .35 }), 0, .09, 0, 0, 0, Math.PI / 2));
    g.add(put(cyl(.092, .092, .09, '#ffe36b', { emissive: '#ffe36b', ei: .35 }), .13, .09, 0, 0, 0, Math.PI / 2));
    g.add(put(cyl(.035, .035, .04, '#fff3c4'), .19, .09, 0, 0, 0, Math.PI / 2));
    const t = this.near(at[0], this.floors[f].y, at[1], null, f) || this.grid[0];
    g.position.set(t.x, t.y, t.z); g.rotation.y = .6;
    this.L.world.root.add(g);
    this.spare = { g, x: t.x, y: t.y, z: t.z, f, t: 0, got: false };
  }

  // ── HUD: home, title, battery; the friends still out there; one hint line; the stairs badge (two floors)
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col();
    const top = h('div', { class: 'topbar fl-top' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, '손전등 숨바꼭질', h('small', {}, this.lv.name)));
    this.batEl = h('div', { class: 'fl-bat' }, h('div', { class: 'fl-bat-in' }, this.batI = h('i')), h('b', { class: 'fl-bat-nub' }));
    top.append(this.batEl);
    col.append(top);
    this.slots = this.friends.map(Fr => h('div', { class: 'fl-face' }, h('img', { src: L.thumbs[`face_${Fr.kind}_normal`] })));
    col.append(h('div', { class: 'fl-faces' }, ...this.slots));
    if (this.lv.hint || this.posts.length > 1) col.append(this.hint = h('div', { class: 'fl-hint ol gone' }, h('span', { class: 'fl-hand' }), this.hintTx = h('span', {}, '누른 채로 끌어서 비춰 봐')));
    const app = document.getElementById('app');
    this.vig = h('div', { class: 'fl-vig' }); app.append(this.vig);
    this.aimRing = new THREE.Mesh(new THREE.RingGeometry(.12, .18, 24), new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0, depthWrite: false }));
    this.aimRing.rotation.x = -Math.PI / 2; this.aimRing.renderOrder = 3; L.world.root.add(this.aimRing);
    if (this.posts.length > 1) {
      const st = this.grid.filter(t => t.stair).sort((a, b) => a.y - b.y), mid = st[Math.floor(st.length / 2)] || this.postTile;
      this.badgeAt = new THREE.Vector3(mid.x, mid.y + .95, mid.z);
      this.badge = h('button', { class: 'fl-stairs' }); app.append(this.badge);
      this._badge = e => { e.stopPropagation(); e.preventDefault(); this.climbTo(1 - this.cur); };
      this.badge.addEventListener('pointerdown', this._badge);
      this.updateBadge();
    }
  }
  updateBadge() { if (this.badge) this.badge.textContent = this.cur === 0 ? '⬆ 2층' : '⬇ 1층'; }
  showHint(text, ms = 3800) {
    if (!this.hint || this.sim) return;
    this.hintTx.textContent = text; this.hint.classList.remove('gone');
    clearTimeout(this._hintT); this._hintT = setTimeout(() => this.hint?.classList.add('gone'), ms);
  }
  hud() {
    const f = clamp(this.battery / this.lv.battery, 0, 1);
    this.batI.style.width = (f * 100).toFixed(1) + '%';
    this.batEl.classList.toggle('low', f < .25 && !this.result);
    this.batEl.classList.toggle('mid', f >= .25 && f < .5);
  }

  // ── input: press and drag anywhere = the beam swings toward that point on the floor (it stays when you let go)
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => {
      if (e.pointerType === 'mouse' && e.button > 0) return;
      if (this.result || this.touch || this.L.ui.panelOpen) return;
      this.touch = { id: e.pointerId, x: e.clientX, y: e.clientY }; this.aimScreen(e.clientX, e.clientY);
    };
    this._move = e => { const T = this.touch; if (T && e.pointerId === T.id) { T.x = e.clientX; T.y = e.clientY; this.aimScreen(T.x, T.y); } };
    this._up = e => { if (this.touch && (e?.pointerId == null || e.pointerId === this.touch.id)) this.touch = null; };
    app.addEventListener('pointerdown', this._down); addEventListener('pointermove', this._move); addEventListener('pointerup', this._up); addEventListener('pointercancel', this._up);
    this._blur = () => this._up({}); addEventListener('blur', this._blur);
  }
  aimScreen(sx, sy) {
    // aim a little above the fingertip, so the finger doesn't sit on what you're lighting; upstairs, a point on that
    // floor wins (it's in front of the one below)
    if (this.climbing) return;
    const W = this.L.world, y2 = sy - 34; let g = null;
    if (this.cur > 0) { const Fl = this.floors[this.cur], q = W.screenToGround(sx, y2, Fl.y); if (q && inRect(Fl.rect, q.x, q.z)) g = q; }
    if (!g) g = W.screenToGround(sx, y2, this.floors[0].y);
    if (g) this.aimWorld(g.x, g.z, g.y);
  }
  aimWorld(x, z, y = this.floors[this.cur].y) {
    const dx = x - this.post.x, dz = z - this.post.y; if (Math.hypot(dx, dz) < .25) return;
    this.aimYaw = Math.atan2(dx, dz); this.aimPt = { x, y, z };
  }
  // up or down the stairs (the badge, or a bot)
  climbTo(k) {
    if (this.climbing || !this.posts[k] || k === this.cur || this.result || !this.started) return;
    const path = gridPath(this.postTile, this.posts[k].tile); if (!path?.length) return;
    this.climbing = { path, to: k }; this.st.climbs++;
    this.me.pose = 'push'; this.sfx('hop'); this.badge?.classList.add('off');
    if (!this.sim) this.say({ ch: this.me, sayT: 0 }, k > this.cur ? '위층으로 후다닥!' : '아래층으로!', 800, '', true);
  }
  stepClimb(dt) {
    const C = this.climbing, p = this.me.root.position; let st = 4 * dt, hx = 0, hz = 0;
    while (st > 1e-5 && C.path.length) {
      const t = C.path[0], dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz) + Math.abs(t.y - p.y) * .5;
      if (d <= st) { p.set(t.x, t.y, t.z); C.path.shift(); st -= d; hx += dx; hz += dz; }
      else { const k = st / d; p.x += dx * k; p.z += dz * k; p.y += (t.y - p.y) * k; hx += dx * k; hz += dz * k; st = 0; }
    }
    if (Math.hypot(hx, hz) > 1e-4) this.aimYaw = Math.atan2(hx, hz);
    this.me.lift = Math.abs(Math.sin(this.t * 16)) * .08;
    this.post.set(p.x, p.z); this.cur = this.floorOf(p.y);
    if (!C.path.length) {
      const P = this.posts[C.to], lk = this.lv.looks?.[C.to];
      this.climbing = null; this.cur = C.to; this.post.set(P.x, P.z); this.postTile = P.tile; p.set(P.x, this.floors[C.to].y, P.z); this.me.lift = 0;
      if (lk) this.aimYaw = Math.atan2(lk[0], lk[1]);
      this.updateBadge(); this.badge?.classList.remove('off'); this.sfx('land'); this._force = true;
    }
  }

  // ── friends
  tileOf(Fr) { const p = Fr.ch.root.position; return this.near(p.x, p.y, p.z); }
  goSpot(Fr, S, speed) {
    if (!S) { Fr.state = 'run'; Fr.goal = 'wander'; Fr.path = []; return; }
    if (Fr.spot && Fr.spot !== S && Fr.spot.taken === Fr) Fr.spot.taken = null;
    if (Fr.toSpot && Fr.toSpot !== S && Fr.toSpot.taken === Fr) Fr.toSpot.taken = null;
    S.taken = Fr; Fr.toSpot = S; Fr.goal = 'spot'; Fr.speed = speed; Fr.state = 'run';
    Fr.path = this.sneakPath(this.tileOf(Fr), S.t, 1.2) || [S.t];
  }
  // the cheapest way over the floor when every step in the light costs extra (w)
  sneakPath(from, to, w) {
    if (!from || !to) return null; if (from === to) return [];
    const n = this.grid.length, Dd = new Float32Array(n).fill(1e9), Pp = new Int32Array(n).fill(-1), done = new Uint8Array(n);
    Dd[from.k] = 0;
    for (;;) {
      let u = -1, best = 1e9; for (let i = 0; i < n; i++) if (!done[i] && Dd[i] < best) { best = Dd[i]; u = i; }
      if (u < 0 || u === to.k) break; done[u] = 1;
      const t = this.grid[u];
      for (const v of t.nb) { const c = Dd[u] + Math.hypot(v.x - t.x, v.z - t.z, v.y - t.y) * (1 + (v.shade ? 0 : w)); if (c < Dd[v.k]) { Dd[v.k] = c; Pp[v.k] = u; } }
    }
    if (Pp[to.k] < 0) return null;
    const out = []; for (let k = to.k; k !== from.k; k = Pp[k]) out.unshift(this.grid[k]);
    return out;
  }
  goCreep(Fr) {
    if (Fr.toSpot?.taken === Fr) Fr.toSpot.taken = null;
    Fr.toSpot = null; Fr.goal = 'creep'; Fr.speed = this.lv.creep * Fr.P.speed; Fr.state = 'run'; Fr.go = true; Fr.bt = rnd(1, 1.6);
    Fr.cTo = this.postTile; Fr.path = this.sneakPath(this.tileOf(Fr), this.postTile, 3) || [];
  }
  // a fresh hiding place: free, not this one, away from where the beam points, rather on the floor 몽글이 isn't on
  // (and far from you after a scare)
  pickSpot(Fr, far = false) {
    const p = Fr.ch.root.position, free = this.spots.filter(S => (!S.taken || S.taken === Fr) && S !== Fr.spot);
    if (!free.length) return null;
    return free.map(S => {
      const off = Math.abs(wrap(Math.atan2(S.c.x - this.eye.x, S.c.z - this.eye.z) - this.beamYaw));
      return { S, s: off * 1.2 + Math.min(4, Math.hypot(S.c.x - p.x, S.c.z - p.z)) * .3 + (S.f !== this.cur ? .7 : 0) + (far ? Math.hypot(S.c.x - this.post.x, S.c.z - this.post.y) * .6 : 0) + Math.random() * 1.2 };
    }).sort((a, b) => b.s - a.s)[0].S;
  }
  exposed(Fr) { return Fr.state === 'run' || Fr.state === 'hopIn' || Fr.state === 'hopOut' || (Fr.state === 'hid' && Fr.tellOn > 0); }
  spotH(S) { return Math.min(.7, (S.top - S.fy) * .6); }
  isLit(Fr) {
    if (Fr.inSpot) { const S = Fr.spot; return this.litAt(S.c.x, S.c.z, S.f, this.spotH(S), S.rec); }
    const p = Fr.ch.root.position, fi = this.floorOf(p.y); return this.litAt(p.x, p.z, fi, BODY_H + p.y - this.floors[fi].y);
  }
  startHop(Fr, x1, y1, z1, dur, hgt, done) {
    const p = Fr.ch.root.position;
    Fr.hop = { x0: p.x, y0: p.y, z0: p.z, x1, y1, z1, k: 0, dur, hgt, done };
    if (Math.hypot(x1 - p.x, z1 - p.z) > .02) Fr.ch.root.rotation.y = Math.atan2(x1 - p.x, z1 - p.z);
    Fr.ch.squash = .25;
  }
  stepHop(Fr, dt) {
    const H = Fr.hop, p = Fr.ch.root.position; H.k = Math.min(1, H.k + dt / H.dur); const k = H.k;
    p.set(H.x0 + (H.x1 - H.x0) * k, H.y0 + (H.y1 - H.y0) * k + H.hgt * 4 * k * (1 - k), H.z0 + (H.z1 - H.z0) * k);
    if (k >= 1) { Fr.hop = null; Fr.ch.squash = .3; H.done?.(); }
  }
  moveAlong(Fr, speed, dt) {
    const p = Fr.ch.root.position; let st = speed * dt, hx = 0, hz = 0, moved = false;
    while (st > 1e-5 && Fr.path.length) {
      const t = Fr.path[0], dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
      if (d <= st) { p.set(t.x, t.y, t.z); Fr.path.shift(); st -= d; hx += dx; hz += dz; }
      else { const k = st / d; p.x += dx * k; p.z += dz * k; p.y += (t.y - p.y) * k; hx += dx * k; hz += dz * k; st = 0; }
      moved = true;
    }
    if (moved && Math.hypot(hx, hz) > 1e-4) { const a = Math.atan2(hx, hz), r = Fr.ch.root.rotation.y; Fr.ch.root.rotation.y = r + wrap(a - r) * Math.min(1, dt * 12); }
    return moved;
  }
  creepers() { return this.friends.filter(Fr => Fr.goal === 'creep' && (Fr.state === 'run' || (Fr.state === 'frozen' && !Fr.inSpot))).length; }
  // leave the hiding place: creep up on 몽글이 (the bold ones) or move house
  leave(Fr) {
    const S = Fr.spot, LV = this.lv;
    const creep = Fr.creepCd <= 0 && Math.random() < Fr.P.bold && this.creepers() < LV.maxCreep;
    const next = creep ? null : this.pickSpot(Fr);
    if (!creep && !next) { Fr.moveT = rnd(...LV.move); return; }
    this.st[creep ? 'creeps' : 'moves']++;
    this.endTell(Fr);
    Fr.inSpot = false; S.goal = 0; S.hold = .45; S.taken = null;
    Fr.ch.root.visible = true; Fr.ch.root.position.set(S.c.x, S.y0, S.c.z); Fr.ch.setFace(creep ? 'happy' : 'normal'); Fr.ch.pose = 'cover';
    this.L.world.idsDirty = true;
    Fr.state = 'hopOut'; Fr.spot = null;
    if (!creep && next) { next.taken = Fr; Fr.toSpot = next; Fr.goal = 'spot'; } else { Fr.toSpot = null; Fr.goal = 'creep'; }
    this.sfx('open', 3);
    this.startHop(Fr, S.t.x, S.t.y, S.t.z, .32, .42, () => { if (Fr.state !== 'hopOut') return; if (creep) this.goCreep(Fr); else this.goSpot(Fr, next, LV.sneak * Fr.P.speed); });
  }
  arrive(Fr) {
    const S = Fr.toSpot;
    if (!S || (S.taken && S.taken !== Fr)) { this.goSpot(Fr, this.pickSpot(Fr), Fr.speed); return; }
    Fr.state = 'hopIn'; S.goal = 0; S.hold = .5; this.sfx('open', 2);
    this.startHop(Fr, S.c.x, S.y0, S.c.z, .3, .5, () => {
      if (Fr.state !== 'hopIn') return;
      Fr.state = 'hid'; Fr.spot = S; Fr.toSpot = null; Fr.inSpot = true; S.taken = Fr; S.hold = .12;
      Fr.ch.root.visible = false; this.L.world.idsDirty = true; this.sfx('close', 2);
      Fr.tellT = rnd(...this.lv.tell) * (Fr.P.tellRate || 1) + (Fr.quiet || 0); Fr.moveT = rnd(...this.lv.move); Fr.nerv = 0; Fr.gulped = false;
    });
  }
  startTell(Fr, line = null) {
    const S = Fr.spot, LV = this.lv; if (!S) return;
    Fr.tellOn = LV.tellDur; S.goal = S.peek; Fr.eyesOn = true; this.st[line ? 'peeks' : 'tells']++;
    const txt = line || pick(Fr.P.tell);
    if (this.bubbles < 3) this.sayAt(S.c.x, S.top + .12, S.c.z, txt, Math.min(1400, LV.tellDur * 1000), 'think fl-tell');
    if ((this._gig = (this._gig || 0)) <= 0) { this.sfx(Fr.k === 'sleepy' ? 'hmm' : 'giggle'); this._gig = .5; }
    // two floors: the first giveaway you can't reach from where you stand points you at the stairs
    if (this.posts.length > 1 && !this._stairHint && !this.reach(S.c.x, S.c.z, S.f, this.spotH(S), S.rec)) { this._stairHint = true; this.showHint(S.f > this.cur ? '위층에서 소리가! ⬆ 계단을 톡' : '아래층에서 소리가! ⬇ 계단을 톡', 4200); }
  }
  endTell(Fr) { Fr.tellOn = 0; Fr.eyesOn = false; if (Fr.spot && Fr.state !== 'frozen') Fr.spot.goal = 0; }

  // caught in the beam: 얼음!
  freeze(Fr) {
    const ch = Fr.ch;
    this.st.frz++;
    Fr.prevState = Fr.state; Fr.state = 'frozen'; Fr.unlit = 0; Fr.hop = null;
    if (!Fr.inSpot) {
      ch.root.rotation.y = Math.atan2(this.eye.x - ch.root.position.x, this.eye.z - ch.root.position.z) + rnd(-.35, .35);
      ch.pose = pick(['hips', 'stretch', 'point', 'flail', 'cover', 'cheer', 'push']); ch.lean = rnd(-.24, .24); ch.lift = rnd(.02, .1);
      ch.setFace(Math.random() < .55 ? 'sweat' : 'wow'); ch._blink = 0; ch.blinkT = 9; ch.squash = 0; ch.update(.0001);
      Fr.fx0 = ch.root.position.clone();
      if (!this.sim) { const q = ch.root.position, s = this.L.world.toScreen(V.set(q.x, q.y + ch.headTop() + .55, q.z)); this.L.ui.floatText(s.x, s.y, pick(['얼음!', '얼음!!', '헉, 얼음!']), 'fl-icetxt'); }
    } else {
      Fr.spot.goal = Fr.spot.peek; Fr.eyesOn = true;
      this.sayAt(Fr.spot.c.x, Fr.spot.top + .12, Fr.spot.c.z, '얼음!', 800, 'fl-ice');
    }
    this.sfx('gasp'); this.hs = Math.max(this.hs, .05);
    if (!this.sim) Fr.ring?.classList.add('on');
  }
  popOut(Fr) {
    const S = Fr.spot, ch = Fr.ch; this.endTell(Fr);
    Fr.state = 'popOut'; Fr.inSpot = false; Fr.spot = null; S.taken = null; S.goal = 0; S.hold = .9;
    ch.root.visible = true; ch.root.position.set(S.c.x, S.y0, S.c.z); ch.setFace('wow'); ch.pose = 'flail'; ch.bump(.5);
    this.L.world.idsDirty = true; this.sfx('door'); this.sfx('pop', 5);
    this.say(Fr, '앗, 들켰다!', 700, '', true);
    Fr.toSpot = null; Fr.goal = 'spot';
    this.startHop(Fr, S.t.x, S.t.y, S.t.z, .3, .5, () => {
      if (Fr.state !== 'popOut') return;
      // landed: still in the light → 얼음! (else it scampers off to another hiding place)
      Fr.state = 'run'; Fr.path = []; this.goSpot(Fr, this.pickSpot(Fr), 1.5); Fr.dash = 1;
      if (this.isLit(Fr)) this.freeze(Fr);
    });
  }
  unfreeze(Fr) {
    const ch = Fr.ch; Fr.ring?.classList.remove('on'); this.st.esc++;
    ch.lean = 0; ch.lift = 0; ch.pose = 'idle'; ch.setFace('sweat'); Fr.slipT = 0; Fr.slipped = false;
    if (Fr.inSpot) {
      // ducks back in, holds its breath a while, then moves house soon
      Fr.state = 'hid'; Fr.tellOn = 0; Fr.eyesOn = false; Fr.spot.goal = 0; Fr.tellT = rnd(2.2, 3.2); Fr.moveT = Math.min(Fr.moveT, rnd(1, 2.2));
      if (this.bubbles < 3) this.sayAt(Fr.spot.c.x, Fr.spot.top + .12, Fr.spot.c.z, '휴~', 700, 'think');
      return;
    }
    if (Fr.fx0) ch.root.position.copy(Fr.fx0);
    this.say(Fr, '휴~ 살았다!', 800);
    this.sfx('phew');
    // off it scurries (a moment you can't freeze it again, and its "found" meter starts over)
    Fr.dash = 1.6; Fr.quiet = 3; Fr.prog = 0; Fr.immune = .9;
    if (Fr.goal === 'creep' && Fr.creepCd <= 0) { Fr.creepCd = 3; this.goSpot(Fr, this.pickSpot(Fr), 1.4); }
    else if (Fr.toSpot) this.goSpot(Fr, Fr.toSpot, Math.max(Fr.speed || 1, 1.3));
    else this.goSpot(Fr, this.pickSpot(Fr), 1.4);
  }
  found(Fr) {
    const L = this.L, W = L.world, ch = Fr.ch;
    Fr.state = 'found'; Fr.prog = 1; Fr.ring?.classList.remove('on'); Fr.eyesOn = false; Fr.tellOn = 0;
    ch.lean = 0; ch.lift = 0; ch.root.visible = true; W.idsDirty = true;
    this.foundN++;
    const S = Fr.spot, inSpot = Fr.inSpot; this.st[inSpot ? 'spot' : 'open']++;
    if (Fr.toSpot?.taken === Fr) Fr.toSpot.taken = null;
    Fr.toSpot = null; Fr.inSpot = false; Fr.goal = null;
    if (inSpot && S) {
      // the lid flies open and out it pops
      S.goal = 0; S.hold = 1.3; S.taken = null; Fr.spot = null;
      ch.root.position.set(S.c.x, S.y0, S.c.z); this.sfx('door');
      this.startHop(Fr, S.t.x, S.t.y, S.t.z, .42, .7, () => { Fr.t = .55; });
      ch.setFace('wow'); ch.pose = 'flail'; ch.bump(.5);
    } else { if (Fr.fx0) ch.root.position.copy(Fr.fx0); ch.setFace('dizzy'); ch.pose = 'flail'; ch.bump(.6); Fr.t = .8; }
    if (!this.sim) {
      const p = ch.root.position, s = W.toScreen(V.set(p.x, p.y + .5, p.z));
      W.fx.burst(s.x, s.y, { n: 22, speed: 320, size: 12, shape: 'star' });
      W.fx.ring(s.x, s.y, { r: 90, color: '#ffe36b', width: 9, life: .45 });
      L.ui.floatText(s.x, s.y - 70, inSpot && S ? `${S.name}에서 찾았다!` : '찾았다!', 'gold big');
      setTimeout(() => !this.dead && this.say(Fr, Fr.P.found, 1100, '', true), 650);
      const slot = this.slots[Fr.i], img = L.thumbs[`face_${Fr.kind}_happy`], n = this.foundN;
      // the face flies to its slot after "찾았다!" has been read
      setTimeout(() => { if (this.dead) return; const q = ch.root.position, s2 = W.toScreen(V.set(q.x, q.y + .5, q.z)); L.ui.flyImg(img, s2.x, s2.y, slot, { size: 56, dur: 520 }).then(() => { if (this.dead) return; slot.classList.add('got'); slot.querySelector('img').src = img; this.sfx('coin', n); }); }, 500);
      this.punch = 1; this.focus = { x: p.x, z: p.z, t: 0 };
    }
    this.sfx('found'); this.sfx('pop', 3 + this.foundN); this.hs = .14;
    for (const T of this.friends) if (T.state === 'team') { T.ch.pose = 'cheer'; T.cheer = 1.2; }
    L.log({ found: Fr.k, lv: this.lvIdx + 1, at: +this.t.toFixed(1), bat: +this.battery.toFixed(1), from: inSpot ? 'spot' : (Fr.prevState || '?') });
    if (this.hint && this.lv.hint && this.foundN === 1) this.showHint('킥킥 소리 나는 곳을 비춰!', 3800);
    if (this.foundN >= this.friends.length) this.win();
  }
  toTeam(Fr) {
    const slots = this.slotsFor(this.cur); this.teamN = this.teamN || [];
    const n = this.teamN[this.cur] = (this.teamN[this.cur] || 0) + 1, slot = slots[Math.min(n, slots.length) - 1];
    Fr.state = 'toTeam'; Fr.slot = slot; Fr.path = gridPath(this.tileOf(Fr), slot) || [slot];
    Fr.ch.setFace('happy'); Fr.ch.pose = 'cheer';
  }
  spook(Fr) {
    const L = this.L, me = this.me;
    Fr.state = 'spook'; Fr.t = .85; Fr.path = []; Fr.goal = null; Fr.creepCd = 9;
    Fr.ch.faceTo(this.post.x, this.post.y); Fr.ch.setFace('happy'); Fr.ch.pose = 'stretch'; Fr.ch.bump(.5);
    // the scare: a big red "왁!" where it jumped out, 몽글이 leaps and squeals a beat later
    if (!this.sim) { const q = Fr.ch.root.position, s = L.world.toScreen(V.set(q.x, q.y + .9, q.z)); L.ui.floatText(s.x, s.y, Fr.P.spook, 'fl-wak'); }
    this.meJump = .5; me.setFace('wow'); me.pose = 'flail';
    setTimeout(() => !this.dead && !this.result && this.say({ ch: me, sayT: 0 }, '꺄악!', 800, '', true), 380);
    this.spin = .75; this.shake = .4; this.spooks++;
    const cost = Math.min(this.lv.spookCost, this.battery - .5); this.battery -= Math.max(0, cost);
    this.sfx('gasp'); this.sfx('wobble');
    if (!this.sim) {
      const r = this.batEl.getBoundingClientRect(); L.ui.floatText(Math.min(innerWidth - 40, r.right - 18), r.bottom + 78, `-${this.lv.spookCost}초`, 'fl-minus');   // under the battery, clear of the faces row
      this.batEl.classList.remove('hit'); void this.batEl.offsetWidth; this.batEl.classList.add('hit');
      this.vig.style.opacity = '1'; setTimeout(() => { if (this.vig) this.vig.style.opacity = '0'; }, 350);
    }
    L.log({ spook: Fr.k, lv: this.lvIdx + 1, at: +this.t.toFixed(1) });
  }
  stepFriend(Fr, dt) {
    const LV = this.lv, ch = Fr.ch, P = Fr.P;
    Fr.sayT -= dt; Fr.creepCd -= dt; Fr.quiet = Math.max(0, (Fr.quiet || 0) - dt); Fr.dash = Math.max(0, (Fr.dash || 0) - dt);
    if (Fr.state === 'party') return;
    if (Fr.state === 'gloat') { if (Fr.hop) this.stepHop(Fr, dt); return; }
    if (Fr.hop && Fr.state !== 'frozen') this.stepHop(Fr, dt);
    if (Fr.state === 'found') { if (!Fr.hop) { Fr.t -= dt; if (Fr.t <= 0) this.toTeam(Fr); } return; }
    if (Fr.state === 'toTeam') {
      const mv = this.moveAlong(Fr, 2.4, dt); ch.lift = mv ? Math.abs(Math.sin(this.t * 14 + Fr.i)) * .07 : 0;
      if (!Fr.path.length) { Fr.state = 'team'; ch.pose = 'clap'; Fr.cheer = 1; }
      return;
    }
    if (Fr.state === 'team') {
      // they watch where the light goes, and cheer when someone else is found
      const r = ch.root.rotation.y; ch.root.rotation.y = r + wrap(this.beamYaw - r) * Math.min(1, dt * 4); ch.lift = 0;
      Fr.cheer = (Fr.cheer || 0) - dt; if (Fr.cheer <= 0 && ch.pose !== 'idle' && !this.result) ch.pose = 'idle';
      return;
    }
    if (Fr.state === 'popOut') return;
    if (Fr.state === 'spook') { Fr.t -= dt; if (Fr.t <= 0) { ch.pose = 'cover'; this.say(Fr, '히히히!', 800); Fr.quiet = 2; this.goSpot(Fr, this.pickSpot(Fr, true), 1.8); } return; }
    const lit = this.isLit(Fr); Fr.lit = lit;
    if (Fr.state === 'frozen') {
      if (lit) { Fr.unlit = 0; Fr.prog = Math.min(1, Fr.prog + dt / Fr.foundT); if (Fr.prog >= 1) return this.found(Fr); }
      else { Fr.unlit += dt; Fr.prog = Math.max(0, Fr.prog - dt * 1.4); if (Fr.unlit > .25) this.unfreeze(Fr); }
      return;
    }
    Fr.immune = Math.max(0, (Fr.immune || 0) - dt);
    if (lit && this.exposed(Fr) && !(Fr.immune > 0)) {
      // 말썽이 (and 너굴이) keep going a moment after the light hits them
      if (P.slip && !Fr.slipped) { Fr.slipped = true; Fr.slipT = P.slip; this.say(Fr, '히히, 아직~', 700, '', true); }
      if (!(Fr.slipT > 0)) { if (Fr.inSpot) this.popOut(Fr); else this.freeze(Fr); return; }
    }
    if (Fr.slipT > 0) Fr.slipT -= dt; else if (!lit) Fr.slipped = false;
    if (Fr.state === 'run') {
      if (Fr.goal === 'creep') {
        // creeps in little bursts: tiptoe… stop… tiptoe (and follows you up or down the stairs)
        Fr.bt -= dt; if (Fr.bt <= 0) { Fr.go = !Fr.go; Fr.bt = Fr.go ? rnd(1.0, 1.7) : rnd(.35, .8); if (!Fr.go && Math.random() < .3 && this.bubbles < 3) this.say(Fr, '쉿…', 600); }
        const q = ch.root.position, near = Math.hypot(q.x - this.post.x, q.z - this.post.y);
        if (near < .85 && !this.climbing && this.floorOf(q.y) === this.cur) return this.spook(Fr);
        if (!Fr.path.length || Fr.cTo !== this.postTile) { Fr.cTo = this.postTile; Fr.path = this.sneakPath(this.tileOf(Fr), this.postTile, 3) || []; }
        const mv = Fr.go || Fr.dash > 0 ? this.moveAlong(Fr, Fr.speed * (Fr.dash > 0 ? 1.8 : 1), dt) : false;
        ch.pose = 'cover'; ch.lift = mv ? Math.abs(Math.sin(this.t * 9 + Fr.i)) * .035 : ch.lift * .8;
        if (!mv) { const r = ch.root.rotation.y, a = Math.atan2(this.post.x - q.x, this.post.y - q.z); ch.root.rotation.y = r + wrap(a - r) * Math.min(1, dt * 6); }
        return;
      }
      const sp = (Fr.speed || 1) * (Fr.dash > 0 ? 1.5 : 1), mv = this.moveAlong(Fr, sp, dt);
      ch.lift = mv ? Math.abs(Math.sin(this.t * (sp > 1.2 ? 15 : 10) + Fr.i)) * (sp > 1.2 ? .08 : .045) : ch.lift * .8;
      ch.pose = sp > 1.2 ? 'flail' : 'cover';
      if (!Fr.path.length) { if (Fr.goal === 'spot') this.arrive(Fr); else this.goSpot(Fr, this.pickSpot(Fr), 1); }
      return;
    }
    if (Fr.state === 'hid') {
      const S = Fr.spot;
      if (Fr.tellOn > 0) {
        Fr.tellOn -= dt; S.wob = Math.abs(Math.sin(this.t * 18)) * .05;
        if (Fr.tellOn <= 0) { this.endTell(Fr); Fr.tellT = rnd(...LV.tell) * (P.tellRate || 1); }
        return;
      }
      S.wob = 0;
      if (lit) {
        // a light on its hiding place: it holds its breath ("흡…" — so you know someone's in there)
        Fr.nerv += dt;
        if (Fr.nerv > .7 && !Fr.gulped) { Fr.gulped = true; if (this.bubbles < 3) this.sayAt(S.c.x, S.top + .12, S.c.z, '흡…', 650, 'think'); }
        return;
      }
      if (Fr.gulped) { Fr.gulped = false; Fr.tellT = Math.max(Fr.tellT, rnd(1.5, 2.5)); }
      Fr.nerv = 0;
      Fr.tellT -= dt; if (Fr.tellT <= 0) { this.startTell(Fr); return; }
      if (!P.stay) { Fr.moveT -= dt; if (Fr.moveT <= 0) this.leave(Fr); }
    }
  }
  // the lids / doors / blankets of the hiding places
  stepSpots(dt) {
    for (const S of this.spots) {
      S.hold -= dt;
      const want = (S.hold > 0 ? 1 : S.goal) + (S.wob || 0);
      if (Math.abs(want - S.cur) < .002) continue;
      S.cur += (want - S.cur) * Math.min(1, dt * 14);
      for (const pt of S.parts) pt.setOpen(clamp(S.cur, 0, 1));
      this._lidMoved = true;
    }
  }

  // ── per frame
  update(dt) {
    const L = this.L, W = L.world, me = this.me;
    let g = dt; if (this.hs > 0) { this.hs -= dt; g = dt * .08; }
    this.t += g; this.tw.update(dt); this._gig = (this._gig || 0) - dt; this._pt = (this._pt || 0) + dt;
    this.map.update(dt);
    me.update(g);
    for (const Fr of this.friends) if (Fr.state !== 'frozen') Fr.ch.update(g);
    if (this.climbing) this.stepClimb(g);
    // the beam swings toward where you point (quick, but you can see it sweep)
    const prev = this.beamYaw;
    if (this.spin > 0) { this.spin -= dt; this.beamYaw += dt * 13; this.aimYaw = this.beamYaw; }
    else if (!this.result) { const d = wrap(this.aimYaw - this.beamYaw); this.beamYaw += clamp(d * (1 - Math.exp(-dt * 16)), -dt * 9, dt * 9); }
    this.beamYaw = wrap(this.beamYaw);
    me.root.rotation.y = this.beamYaw;
    if (this.meJump > 0) { this.meJump -= dt; const y0 = this.floors[this.cur].y; me.root.position.y = y0 + Math.max(0, Math.sin((1 - this.meJump / .5) * Math.PI) * .45); if (this.meJump <= 0) { me.root.position.y = y0; me.pose = 'push'; me.setFace('sweat'); setTimeout(() => !this.dead && !this.result && me.setFace('normal'), 1200); } }
    this.placeEye();
    if (this.preT > 0 && !this.started) { this.preT -= g; if (this.preT <= 0) this.beginPlay(); }
    if (this.started && !this.result) {
      this.battery -= g;
      // a low battery flickers
      const f = this.battery / this.lv.battery;
      this.dim = f < .2 && Math.sin(this.t * 23) * Math.sin(this.t * 7.1) > .55 ? .35 : 1;
      if (this.battery <= 10 && !this._tense && !this.sim) { this._tense = true; L.audio.music?.('tense'); }
      if (this.battery <= 0) { this.battery = 0; this.fail(); }
    }
    const n = Math.max(1, Math.ceil(g / .034));
    for (let k = 0; k < n; k++) for (const Fr of this.friends) if (!this.result || ['found', 'toTeam', 'team', 'gloat'].includes(Fr.state)) this.stepFriend(Fr, g / n);
    this.stepSpots(dt);
    this.stepSpare(g);
    this.camera(dt);
    if (this.sim) return;
    this.nFrame = (this.nFrame || 0) + 1;
    this.redraw(dt, prev);
    this.hud();
    this.overlays();
  }
  // the visible beam (spotlight + its shadow map + the floor glow) is redrawn only when it has turned past PAINT_YAW,
  // when 몽글이 moves, or when it comes to rest a hair off — and never more than every PAINT_DT. A slow phone (frames
  // well under 40/s for a couple of seconds) gets a coarser floor glow and, at worst, a smaller shadow map.
  redraw(dt, prev) {
    const W = this.L.world, dim = (this.dim ?? 1) * (this.flick ?? 1);
    this.spot.intensity = this.started && !this.result ? this.spotI * dim : this.spot.intensity;
    for (const Fl of this.floors) Fl.ov.mesh.material.opacity = this.result ? Fl.ov.mesh.material.opacity : dim;
    if (!QA_CAPPED) {
      this.fpsE += (1 / Math.max(dt, 1e-3) - this.fpsE) * .05;
      this._slowT = this.fpsE < 40 ? this._slowT + dt : 0; this._fastT = this.fpsE > 54 ? this._fastT + dt : 0;
      if (this._slowT > 2 && this.ovStep < 4) { this.setStep(this.ovStep + 1); this._slowT = 0; }
      if (this._fastT > 6 && this.ovStep > 2) { this.setStep(this.ovStep - 1); this._fastT = 0; }
    }
    const turned = Math.abs(wrap(this.beamYaw - this.litYaw)), resting = Math.abs(wrap(this.beamYaw - prev)) < 1e-3;
    const ek = this.cur + '|' + this.post.x.toFixed(2) + ',' + this.post.y.toFixed(2) + '|' + this.me.root.position.y.toFixed(2);
    if (this._pt >= PAINT_DT && (turned > PAINT_YAW || (resting && turned > 8e-4) || ek !== this._ek || this._force)) {
      this._pt = 0; this.litYaw = this.beamYaw; this._ek = ek; this._force = false;
      this.placeLights(); this.paintBeam(); W.shadowDirty = true;
    } else if (this._lidMoved && this._pt >= PAINT_DT) { W.shadowDirty = true; this._pt = 0; }
    this._lidMoved = false;
  }
  setStep(s) {
    this.ovStep = s; this._force = true;
    const want = s >= 4 ? 512 : 1024, sh = this.spot.shadow;
    if (sh.mapSize.x !== want) { sh.mapSize.set(want, want); sh.map?.dispose(); sh.map = null; }
  }
  stepSpare(dt) {
    const S = this.spare; if (!S || S.got) return;
    S.g.position.y = S.y + .03 + Math.abs(Math.sin(this.t * 3)) * .05; S.g.rotation.y += dt * 1.2;
    if (this.litAt(S.x, S.z, S.f, .15)) { S.t += dt; if (S.t > .45) this.takeSpare(); } else S.t = 0;
  }
  takeSpare() {
    const S = this.spare, L = this.L, W = L.world; S.got = true;
    this.battery = Math.min(this.lv.battery, this.battery + 10);
    this.sfx('coin'); this.sfx('special');
    if (!this.sim) {
      const s = W.toScreen(V.set(S.x, S.y + .3, S.z));
      W.fx.burst(s.x, s.y, { n: 14, speed: 220, size: 9, shape: 'circle', colors: ['#5ad17a', '#ffe36b', '#ffffff'] });
      L.ui.floatText(s.x, s.y - 50, '건전지 발견! +10초', 'gold');
      this.batEl.classList.remove('gain'); void this.batEl.offsetWidth; this.batEl.classList.add('gain');
    }
    this.tw.run(.4, k => { S.g.position.y = S.y + .1 + k * 1.2; S.g.scale.setScalar(1 - k * .9); }).then(() => { S.g.visible = false; });
    L.log({ spare: true, lv: this.lvIdx + 1, at: +this.t.toFixed(1) });
  }
  camera(dt) {
    const W = this.L.world;
    this.shake = Math.max(0, this.shake - dt); this.punch = Math.max(0, this.punch - dt * 3);
    const sh = this.shake * .3, F0 = this.focus;
    // found: a quick close-up on them (a third of the way over, a little zoom), then back
    let fk = 0; if (F0) { F0.t += dt; fk = F0.t < .25 ? ease.outQuint(F0.t / .25) : F0.t < .85 ? 1 : Math.max(0, 1 - (F0.t - .85) / .45); if (F0.t > 1.3) this.focus = null; }
    const fx = F0 ? (F0.x - W.home.x) * .35 * fk : 0, fz = F0 ? (F0.z - W.home.z) * .35 * fk : 0;
    W.target.set(W.home.x + fx + (Math.random() - .5) * sh, W.home.y, W.home.z + fz + (Math.random() - .5) * sh);
    W.zoom = this.zoom0 * (1 + fk * .2 + Math.sin(Math.min(1, this.punch) * Math.PI / 2) * .04);
  }
  // world-anchored bits: glinting eyes, the "found" ring under a frozen friend, the shiver, the aim ring, the stairs badge
  overlays() {
    const L = this.L, W = L.world, h = L.h;
    for (const Fr of this.friends) {
      if (Fr.state === 'frozen' && !Fr.inSpot && Fr.fx0) { const p = Fr.ch.root.position; p.x = Fr.fx0.x + Math.sin(this.t * 70) * .012; p.z = Fr.fx0.z + Math.cos(this.t * 53) * .008; }
      // eyes glint in the dark: peeking out of a hiding place, or creeping about
      const creepEyes = ['run', 'hopIn', 'hopOut', 'popOut'].includes(Fr.state) && !Fr.lit && this.started && !this.result || (Fr.state === 'run' && !this.started);
      const show = (Fr.eyesOn && Fr.inSpot) || creepEyes;
      if (show && !Fr.eyes) { Fr.eyes = h('div', { class: 'fl-eyes' }, h('i'), h('i')); L.ui.wui.append(Fr.eyes); }
      if (Fr.eyes) {
        Fr.eyes.classList.toggle('on', !!show);
        if (show) {
          let s;
          if (Fr.inSpot && Fr.spot) { const S = Fr.spot; s = W.toScreen(V.set(S.c.x, S.fy + Math.min(S.top - S.fy - .08, .75), S.c.z)); s.y += 4; }
          else { const p = Fr.ch.root.position; s = W.toScreen(V.set(p.x, p.y + Fr.ch.headTop() * .62, p.z)); }
          Fr.eyes.style.left = s.x + 'px'; Fr.eyes.style.top = s.y + 'px';
        }
      }
      if (Fr.state === 'frozen') {
        if (!Fr.ring) { Fr.ring = h('div', { class: 'fl-ring on' }); L.ui.wui.append(Fr.ring); }
        Fr.ring.classList.add('on');
        const p = Fr.inSpot && Fr.spot ? V.set(Fr.spot.t.x, Fr.spot.t.y + .02, Fr.spot.t.z) : V.copy(Fr.ch.root.position).setY(Fr.ch.root.position.y + .02);
        const s = W.toScreen(p); Fr.ring.style.left = s.x + 'px'; Fr.ring.style.top = s.y + 'px';
        Fr.ring.style.background = `conic-gradient(#ffe36b ${(Fr.prog * 360).toFixed(0)}deg, rgba(255,255,255,.28) 0)`;
      } else Fr.ring?.classList.remove('on');
    }
    const T = this.touch, ap = this.aimPt;
    this.aimRing.material.opacity = T && ap ? .7 : Math.max(0, this.aimRing.material.opacity - .05);
    if (ap) this.aimRing.position.set(ap.x, ap.y + .04, ap.z);
    if (this.badge) {
      const s = W.toScreen(this.badgeAt); this.badge.style.left = s.x + 'px'; this.badge.style.top = s.y + 'px';
      this.badge.classList.toggle('gone', !this.started || !!this.result);
    }
  }

  // ── speech, sound and effects (silent while the quick simulation runs)
  sfx(n, k) { if (!this.sim) this.L.audio.sfx(n, k); }
  say(Fr, text, ms = 1000, cls = '', must = false) {
    if (this.sim || this.dead) return null;
    if (!must && (this.bubbles >= 3 || Fr.sayT > 0)) return null;
    Fr.bub?.remove(); Fr.sayT = ms / 1000 + .5; this.bubbles++;
    const b = Fr.bub = this.L.say(Fr.ch, text, ms, cls);
    setTimeout(() => { this.bubbles--; if (Fr.bub === b) Fr.bub = null; }, ms);
    return b;
  }
  sayAt(x, y, z, text, ms = 900, cls = 'think') {
    if (this.sim || this.dead) return;
    const L = this.L, b = L.h('div', { class: 'bubble pop ' + cls }, text); L.ui.wui.append(b);
    const P = new THREE.Vector3(x, y, z), upd = () => { const p = L.world.toScreen(P), m = b.offsetWidth / 2 + 6; b.style.left = clamp(p.x, m, innerWidth - m) + 'px'; b.style.top = Math.max(40, p.y) + 'px'; };
    upd(); const iv = setInterval(upd, 30); this.bubbles++;
    setTimeout(() => { clearInterval(iv); b.remove(); this.bubbles--; }, ms);
  }

  // ── the end: the lights come back on
  lightsOn(dur = .6) {
    const W = this.L.world, from = { a: W.hemi.intensity, s: W.sun.intensity };
    W.setLight(this.th.light || null); const to = { a: W.hemi.intensity, s: W.sun.intensity };
    W.hemi.intensity = from.a; W.sun.intensity = from.s;
    const sp = this.spot.intensity, sl = this.spill.intensity;
    this.tw.run(dur, k => { W.hemi.intensity = from.a + (to.a - from.a) * k; W.sun.intensity = from.s + (to.s - from.s) * k; this.spot.intensity = sp * (1 - k); this.spill.intensity = sl * (1 - k); for (const Fl of this.floors) Fl.ov.mesh.material.opacity = 1 - k; }, ease.linear)
      .then(() => { W.sun.castShadow = this._sunCast; W.shadowDirty = true; for (const Fl of this.floors) Fl.ov.mesh.visible = false; });
    for (const Fr of this.friends) { Fr.eyesOn = false; Fr.eyes?.classList.remove('on'); }
  }
  win() {
    if (this.result) return;
    const L = this.L, W = L.world, LV = this.lv; this.result = 'win'; this.touch = null;
    const left = Math.max(0, this.battery), stars = left >= LV.battery * .45 ? 3 : left >= LV.battery * .2 ? 2 : 1;
    this.stars = stars;
    L.log({ result: 'win', lv: this.lvIdx + 1, found: this.foundN, total: this.friends.length, time: +left.toFixed(1), stars, spooks: this.spooks });
    if (this.sim) return;
    setTimeout(() => {
      if (this.dead) return;
      this.sfx('unlock'); this.lightsOn(.5);
      this.say({ ch: this.me, sayT: 0 }, '딸깍! 불 들어왔다!', 1500, '', true);
      setTimeout(() => { if (this.dead) return; this.sfx('win'); W.fx.confetti(110); this.me.setFace('happy'); this.me.pose = 'cheer'; for (const Fr of this.friends) { Fr.ch.pose = 'cheer'; Fr.ch.setFace('happy'); Fr.cheer = 99; } }, 450);
    }, 700);
    setTimeout(() => {
      if (this.dead) return;
      const h = L.h, last = this.lvIdx >= LEVELS.length - 1;
      L.ui.panel({ title: '다 찾았다!', color: 'green', body: [
        h('div', { class: 'fl-stars', html: [0, 1, 2].map(i => i < stars ? ICON.star.replace('<svg', '<svg class="on"') : ICON.starGray).join('') }),
        h('div', { class: 'fl-endfaces' }, ...this.friends.map(Fr => h('div', { class: 'fl-face got' }, h('img', { src: L.thumbs[`face_${Fr.kind}_happy`] })))),
        h('div', { class: 'txt' }, `배터리 ${Math.ceil(left)}초 남기고 ${this.friends.length}명 다 찾았어!`)],
        buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
          this.nextBtn = L.ui.btn(last ? '처음 판부터' : '다음 판', { color: 'green', cls: 'big', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) })] });
    }, 2600);
  }
  fail() {
    if (this.result) return;
    const L = this.L; this.result = 'fail'; this.touch = null;
    L.log({ result: 'fail', lv: this.lvIdx + 1, found: this.foundN, total: this.friends.length, time: 0, spooks: this.spooks });
    if (this.sim) return;
    // the flashlight dies… then the lights come back and everyone still hidden pops out laughing
    this.spot.intensity = 0; this.spill.intensity = 0; for (const Fl of this.floors) Fl.ov.mesh.visible = false;
    this.sfx('lose'); this.me.setFace('sad'); this.me.pose = 'idle';
    this.say({ ch: this.me, sayT: 0 }, '치익… 배터리 끝!', 1300, '', true);
    for (const Fr of this.friends) Fr.ring?.classList.remove('on');
    setTimeout(() => {
      if (this.dead) return;
      this.lightsOn(.5); this.sfx('click');
      let k = 0;
      for (const Fr of this.friends) {
        if (['found', 'toTeam', 'team'].includes(Fr.state)) continue;
        const ch = Fr.ch, S = Fr.inSpot ? Fr.spot : null;
        if (S) { S.goal = 0; S.hold = 99; ch.root.visible = true; ch.root.position.set(S.c.x, S.y0, S.c.z); this.startHop(Fr, S.t.x, S.t.y, S.t.z, .4, .6, null); }
        Fr.inSpot = false; Fr.state = 'gloat'; ch.lean = 0; ch.lift = 0; ch.setFace('happy'); ch.pose = 'cheer';
        const kk = k++; if (kk < 2) setTimeout(() => !this.dead && this.say(Fr, kk ? '메~롱!' : '못 찾았지롱~', 1400, '', true), 250 + kk * 350);
      }
      this.L.world.idsDirty = true;
    }, 1100);
    setTimeout(() => {
      if (this.dead) return;
      const h = L.h, scared = this.spooks >= 2;
      L.ui.panel({ title: '배터리가 다 됐어!', color: 'red', body: [
        h('div', { class: 'fl-endfaces' }, ...this.friends.map(Fr => { const got = ['found', 'toTeam', 'team'].includes(Fr.state); return h('div', { class: 'fl-face' + (got ? ' got' : '') }, h('img', { src: L.thumbs[`face_${Fr.kind}_${got ? 'happy' : 'normal'}`] })); })),
        h('div', { class: 'txt' }, `${this.friends.length}명 중 ${this.foundN}명 찾았어!`),
        h('div', { class: 'fl-tip' }, scared ? '살금살금 다가오는 친구부터 비춰!' : this.posts.length > 1 ? '소리 나는 층으로 계단을 톡!' : '킥킥 소리가 나면 바로 그쪽을 비춰!')],
        buttons: [this.againBtn = L.ui.btn('다시 하기', { color: 'orange', cls: 'big', onClick: () => L.go({ lv: this.lvIdx }) })] });
    }, 2700);
  }
  exit() {
    this.dead = true; const L = this.L, W = L.world, app = document.getElementById('app');
    app.dataset.night = '';
    app.removeEventListener('pointerdown', this._down); removeEventListener('pointermove', this._move); removeEventListener('pointerup', this._up); removeEventListener('pointercancel', this._up);
    removeEventListener('blur', this._blur); clearTimeout(this._hintT);
    for (const o of [this.map?.group, this.me?.root, this.spot, this.spot?.target, this.spill, this.aimRing, this.spare?.g, ...(this.floors || []).map(Fl => Fl.ov?.mesh), ...(this.friends || []).map(Fr => Fr.ch.root)].filter(Boolean)) { W.root.remove(o); disposeTree(o); }
    this.spot?.shadow?.map?.dispose(); this.spot?.dispose?.(); this.spill?.dispose?.();
    for (const Fl of this.floors || []) Fl.ov?.tex.dispose();
    for (const Fr of this.friends || []) { Fr.eyes?.remove(); Fr.ring?.remove(); }
    this.vig?.remove(); this.badge?.removeEventListener('pointerdown', this._badge); this.badge?.remove();
    if (this._sunCast !== undefined) W.sun.castShadow = this._sunCast;
    W.shadowDirty = true; W.camLock = false; W.zoom = 1; W.target.copy(W.home);
    for (const k of this.defs || []) delete CHAR_DEFS[k];
    L.audio.stopMusic?.(); this.tw.clear();
  }

  // ── bots (QA) aim the beam the way a finger does (and tap the stairs badge). smart: holds a frozen friend until it's
  // found, goes for whoever is creeping close, then for any peek / giggle (a beat late), else sweeps slowly; something
  // going on that it can't reach from this floor → the stairs. random: points anywhere, now and then takes the stairs.
  botStep(dt, mode) {
    if (this.result) {
      if (this.sim) return;
      this._endT = (this._endT || 0) + dt;
      if (this._endT > 1.6 && this.L.ui.panelOpen) { this._endT = 0; (this.result === 'win' ? this.nextBtn : this.againBtn)?.press(); }
      return;
    }
    if (!this.started || this.climbing) return;
    this._climbCd = (this._climbCd || 0) - dt;
    if (mode === 'random') {
      this._rt = (this._rt || 0) - dt;
      if (this._rt <= 0) {
        this._rt = rnd(.3, 1.1);
        if (this.posts.length > 1 && Math.random() < .1) { this.climbTo(1 - this.cur); return; }
        const r = this.floors[0].rect; this.aimWorld(rnd(r.x0 + .3, r.x1 - .3), rnd(r.z0 + .3, r.z1 - .3));
      }
      return;
    }
    // 'human': a stand-in for a first-time player (QA only) — slower to notice, looser aim, misses some peeks
    const H = mode === 'human';
    this._bt = (this._bt || 0) - dt;
    if (this._bt <= 0) { this._bt = H ? rnd(.5, .75) : rnd(.3, .42); this.bAim = this.botPick(H); const e = H ? .35 : .2; this._err = [rnd(-e, e), rnd(-e, e)]; }
    if (this.climbing) return;
    const p = this.bAim?.(); if (p) this.aimWorld(p.x + this._err[0], p.z + this._err[1]);
  }
  botPick(H = false) {
    const post = this.post, dist = Fr => { const p = Fr.ch.root.position; return Math.hypot(p.x - post.x, p.z - post.y) + Math.abs(this.floorOf(p.y) - this.cur) * 4; };
    const at = Fr => () => Fr.inSpot && Fr.spot ? { x: Fr.spot.c.x, z: Fr.spot.c.z } : { x: Fr.ch.root.position.x, z: Fr.ch.root.position.z };
    const here = Fr => { if (Fr.inSpot) { const S = Fr.spot; return this.reach(S.c.x, S.c.z, S.f, this.spotH(S), S.rec); } const p = Fr.ch.root.position, fi = this.floorOf(p.y); return this.reach(p.x, p.z, fi, BODY_H + p.y - this.floors[fi].y); };
    const frozen = this.friends.find(Fr => Fr.state === 'frozen'); if (frozen) return at(frozen);
    const late = H ? .7 : .45;
    const runners = this.friends.filter(Fr => ['run', 'hopIn', 'hopOut', 'popOut'].includes(Fr.state));
    const tells = this.friends.filter(Fr => Fr.state === 'hid' && Fr.tellOn > .2 && Fr.tellOn < this.lv.tellDur - late);
    const run = runners.filter(here).sort((a, b) => dist(a) - dist(b))[0], tell = tells.filter(here).sort((a, b) => b.tellOn - a.tellOn)[0];
    if (H && tell && Fr_miss(tell)) return this.bAim;   // didn't notice that one
    if (run && (dist(run) < 2.4 || !tell)) return at(run);
    if (tell) return at(tell);
    // something going on that can't be lit from this floor: up / down the stairs
    if (this.posts.length > 1 && this._climbCd <= 0 && [...runners, ...tells].some(Fr => !here(Fr))) { this._climbCd = H ? 5 : 3; this.climbTo(1 - this.cur); return null; }
    if (this.spare && !this.spare.got && this.spare.f === this.cur && this.battery < this.lv.battery - 8) return () => ({ x: this.spare.x, z: this.spare.z });
    // nothing to go on: sweep slowly over the hiding places it can reach
    const ang = this.spots.filter(S => this.reach(S.c.x, S.c.z, S.f, this.spotH(S), S.rec)).map(S => Math.atan2(S.c.x - post.x, S.c.z - post.y));
    if (!ang.length) return null;
    this._sw = (this._sw || 0) + .35;
    const a = ang[Math.floor(this._sw) % ang.length];
    return () => ({ x: post.x + Math.sin(a) * 2.5, z: post.y + Math.cos(a) * 2.5 });
  }
  // a whole round in one go without drawing (QA): the same update and bot as a real round, fixed 1/30 s steps
  fastForward(mode = 'smart', maxT = 150) {
    this.sim = true; const dt = 1 / 30; let t = 0;
    if (!this.started && !(this.preT > 0)) { this.blackout(true); this.preT = this.lv.scatter || SCATTER; }
    while (!this.result && t < maxT) { this.botStep(dt, mode); this.update(dt); t += dt; }
    this.sim = false;
    const st = this.st, left = this.friends.filter(Fr => !['found', 'toTeam', 'team'].includes(Fr.state)).map(Fr => `${Fr.k}:${Fr.state}${Fr.spot ? '@' + Fr.spot.type + Fr.spot.f : ''}${Fr.goal ? '/' + Fr.goal : ''}`).join(',');
    return { r: this.result || 'timeout', found: this.foundN, total: this.friends.length, left: +this.battery.toFixed(1), spooks: this.spooks, t: +t.toFixed(1), st: `frz${st.frz} esc${st.esc} open${st.open} tell${st.tells} mv${st.moves} cr${st.creeps} up${st.climbs}`, out: left };
  }
  state() { return { scene: 'flashlight', lv: this.lvIdx + 1, result: this.result || null, found: this.foundN || 0, total: this.friends?.length || 0, time: +(this.battery ?? 0).toFixed(1) }; }
  get api() {
    return {
      win: () => { for (const Fr of this.friends) if (!['found', 'toTeam', 'team'].includes(Fr.state)) this.found(Fr); },
      fail: () => { this.battery = .01; },
      aim: (x, z) => this.aimWorld(x, z),
      climb: k => this.climbTo(k ?? 1 - this.cur),
      step: s => this.setStep(s),
      // for screenshots: pull a friend out into the beam and freeze it there
      freezeOne: (i = 0) => {
        const Fr = this.friends[i]; if (!Fr || ['found', 'toTeam', 'team'].includes(Fr.state)) return null;
        if (Fr.inSpot) { Fr.spot.goal = 0; Fr.spot.taken = null; Fr.inSpot = false; Fr.spot = null; }
        const a = this.beamYaw, d = 2.2, t = this.near(this.post.x + Math.sin(a) * d, this.floors[this.cur].y, this.post.y + Math.cos(a) * d, null, this.cur);
        Fr.ch.root.visible = true; Fr.ch.root.position.set(t.x, t.y, t.z); Fr.ch.faceTo(this.post.x, this.post.y); Fr.state = 'run'; Fr.goal = 'spot'; Fr.toSpot = this.pickSpot(Fr); Fr.path = [];
        this.freeze(Fr); Fr.prog = .55; this.L.world.idsDirty = true;
        return { x: t.x, z: t.z, lit: this.isLit(Fr) };
      },
      creep: (i = 0) => { const Fr = this.friends[i]; if (Fr?.state === 'hid') { Fr.creepCd = 0; const b = Fr.P.bold; Fr.P.bold = 1; this.leave(Fr); Fr.P.bold = b; } return Fr?.state + '/' + Fr?.goal; },
      tell: (i = 0) => { const Fr = this.friends[i]; if (Fr?.state === 'hid') { this.startTell(Fr); Fr.tellOn = 5; } return Fr?.state; },
      info: () => ({ spots: this.spots.map(S => S.type + '@' + S.f).join(','), dropped: this.dropped.join(','), tiles: this.grid.length, stairs: this.grid.filter(t => t.stair).length, posts: this.posts.map(P => [P.x, P.z, P.tile.f]), cur: this.cur, step: this.ovStep, paints: this.nPaint || 0, frames: this.nFrame || 0,
        friends: this.friends.map(Fr => `${Fr.k}:${Fr.state}${Fr.spot ? '@' + Fr.spot.type + Fr.spot.f : ''}`).join(',') }),
      ff: (mode, maxT) => this.fastForward(mode, maxT),
    };
  }
}

// the 'human' bot overlooks about a third of the peeks (decided once per peek)
function Fr_miss(Fr) { if (Fr._seenTell === Fr.tellT) return Fr._missed; Fr._seenTell = Fr.tellT; Fr._missed = Math.random() < .3; return Fr._missed; }

// QA helper: n rounds of a level, each simulated in one go (no drawing), back to back
window.__flRes = [];
window.__flTrial = async (lv, mode, n, maxT = 150) => {
  const L = window.L, res = [];
  for (let k = 0; k < n; k++) {
    L.bot = false; await L.go({ lv, quick: true }); await new Promise(r => setTimeout(r, 60));
    const r = L.scene.fastForward(mode, maxT); res.push(r);
    window.__flRes.push(`L${lv + 1} ${mode} ${r.r} ${r.found}/${r.total} left ${r.left} sp ${r.spooks} t ${r.t} | ${r.st}${r.out ? ' | ' + r.out : ''}`);
  }
  return res;
};

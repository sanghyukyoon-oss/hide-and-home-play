// ① 엄마 몰래 야식 — a midnight sneak to the fridge.
//   move:  press and hold anywhere on the floor — 몽글이 tiptoes toward your finger (far away = a scurry, which is noisy);
//          let go and it freezes and crouches. Press the fridge and keep holding: it walks there and grabs snacks.
//   fridge (숨바꼭집, 10/18 — user: "냉장고를 눌러도 아무 변화가 없고… 그 앞에 가서 냉장고 한번 누르면 열리고 그 안에 냉장고
//          누르고 있으면 먹을 거 가져오게끔"): in front of it, tap the fridge = the door opens (tap again = shut); hold the
//          open fridge = take snacks. Holding it from afar walks you to its front. An open door lights up for mom; walk
//          away and it swings shut.
//   lure:  tap a gadget (the robot vacuum, the bluetooth speaker) — it goes off, and mom gets up, walks over to switch
//          it off and walks back. That's your window. Each gadget works once a night.
//   mom:   now and then she says "흠…?" (a red preview of where she's about to look) and glances round (the warm light on
//          the floor). Moving in her eyes fills her suspicion fast, standing still slowly; behind tall furniture, or
//          hugging low furniture while crouched, you're hidden. While she watches TV her eyes are on the screen.
// Bring 1–3 snacks back to your door (= stars).
import * as THREE from 'three';
import { MapRooms } from '../map.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { buildItem, ITEMS } from '../gfx/items.js';
import { walkGrid, gridPath, nearestTile } from '../companion.js';
import { Tweens, clamp } from '../util.js';
import { disposeTree, rbox, cyl, sph, put } from '../gfx/kit.js';
import { ICON } from '../ui.js';
import { tr } from '../i18n.js';
import { YASIK_DO as DO } from '../script.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
const NIGHT = { ambColor: '#8f95dc', amb: 1.08, sunColor: '#dfe4ff', sun: 1.05 };
// one open-plan apartment room (거실 + 주방 corner): x ∈ [-3.5, 3.5], z ∈ [-2.5, 2.5]; tile (i, j) → world
const TW = (i, j) => [-3.5 + i + .5, -2.5 + j + .5];

// three nights. mom: where she sits, which way her busy face points; route: a good way from your door to the fridge
// (the bots follow it; you go where you like); lures: gadgets you can set off (furn = a piece of the room, or a speaker)
const LEVELS = [
  { name: '첫째 밤', sub: '엄마는 TV 보는 중', tel: 1.15, busy: [3.6, 6.0], look: [1.3, 2.0], fake: 0, half: 52, range: 7, tv: { half: 30, range: 4 },
    mom: { at: [-.5, 1.06], y: .3, busyYaw: 0, sit: 'sofa2' },
    furniture: [F('monstera', 0, 0), F('bookshelf', 1, 0, 0, { seed: 7 }), F('recordcab', 2, 0), F('counter', 4, 0, 0, { variant: 'stove' }), F('counter', 5, 0), F('bigfridge', 6, 0),
      F('dryrack', 1, 2, 1), F('plant', 2, 2), F('laundrybasket', 3, 2), F('monstera', 4, 2), F('sofa2', 2, 3), F('tvlow', 2, 4, 2), F('robovac', 0, 3), F('diningset', 4, 4), F('floorlamp', 0, 4), F('plant', 6, 4)],
    lures: [{ furn: 'robovac', name: '로봇청소기', line: '어머, 청소기가 왜 켜졌지?' }],
    route: [TW(0, 1), TW(6, 1)] },
  // 둘째 밤 — mom walks the house ("누가 안 자니~?"): her eyes move with her. The kitchen is on the west wall now, your door
  // on the north wall; you cross the house while she paces between the living room and the dining table
  { name: '둘째 밤', sub: '엄마가 집 안을 순찰 중', mode: 'patrol', half: 46, range: 4.6, tel: .9, busy: [3, 5], look: [1.4, 2.1], fake: 0, tv: { half: 26, range: 1.6 },
    mom: { at: [2.5, 1.0], y: 0, busyYaw: -Math.PI / 2 },
    patrol: { pts: [[2.5, 1.0], [-.9, 1.0]], speed: .72, pause: [1.3, 2.1], lines: ['누가 안 자니~?', '흠흠~ 문단속 했나?', '몽글이 자나…?'] },
    decor: [D('door', 'N', 2.3), D('catclock', 'N', -.4), D('window', 'N', .9), D('wallshelf2', 'W', .5)],
    zones: [{ i: 0, j: 0, w: 2, d: 5, kind: 'checker', a: '#fffaf0', b: '#cfe8d6' }],
    furniture: [F('snackcart', 0, 0, 1), F('counter', 0, 1, 1, { variant: 'stove' }), F('counter', 0, 2, 1), F('kimchifridge', 0, 3, 1), F('bigfridge', 0, 4, 1),
      F('bookshelf', 2, 0, 0, { seed: 9 }), F('recordcab', 3, 0), F('plant', 6, 0),
      F('monstera', 2, 2), F('laundrybasket', 3, 2), F('dryrack', 4, 2, 1), F('plant', 6, 2),
      F('diningset', 2, 4), F('sofa2', 4, 4), F('floorlamp', 6, 4)],
    lures: [{ speaker: TW(6, 3.1), name: '블루투스 스피커', line: '어머, 노래가 왜 나와?' }], moon: { at: [.9, -1.7], s: [1.4, .8] },
    snacks: ['apple', 'cookie', 'donut'],
    route: [[2.3, -2.0], [2.3, -1.05], [-2.0, -1.05], [-2.0, 2.0]] },
  // 셋째 밤 — lights out, mom dozing on the sofa: she can't see you, she HEARS you. A sound gauge fills with every noise
  // (creaky boards, scurrying, the fridge's door alarm, the dog); her snores cover you; full gauge = she wakes and looks
  { name: '셋째 밤', sub: '불 꺼진 거실, 엄마가 소파에서 조는 중', mode: 'doze', half: 62, range: 6.5, tel: .6, busy: [3, 5], look: [2.4, 2.8], fake: 0, tv: { half: 0, range: 0 },
    mom: { at: [-.5, .06], y: .3, busyYaw: 0, sit: 'sofa2' }, dog: { at: [2.0, -.25], yaw: -Math.PI * .75 },
    light: { ambColor: '#6c72b8', amb: .86, sunColor: '#b4bcff', sun: .72 }, bg: ['#2b2a55', '#141327'], tvOff: true, moon: { at: [-2.7, -1.2], s: [.8, 1.5] },
    doze: { snore: 3.6, loud: 1.8, alarm: 1.9, lull: 9 }, creaks: [[-1.6, -1.0], [.4, -1.0], [-2.4, 1.9], [1.6, 1.4]],
    decor: [D('door', 'W', -1.0), D('catclock', 'N', -1.0), D('balconywin', 'W', 1.2), D('wallrack', 'N', 1.5)],
    furniture: [F('monstera', 0, 0), F('bookshelf', 1, 0, 0, { seed: 7 }), F('recordcab', 3, 0), F('counter', 4, 0, 0, { variant: 'stove' }), F('counter', 5, 0), F('bigfridge', 6, 0),
      F('sofa2', 2, 2), F('plant', 1, 2), F('monstera', 5, 3), F('tvlow', 2, 4, 2), F('floorlamp', 0, 4), F('diningset', 4, 4), F('plant', 6, 4)],
    lures: [{ speaker: TW(1.1, 3.6), name: '자장가 스피커', line: '', lullaby: true, card: '톡 하면 자장가 · 엄마가 더 깊이 잠들어요' }],
    snacks: ['snack', 'candy', 'icecream'],
    route: [[-3.0, 1.0], [-2.85, -1.45], [-.6, -1.45], [1.0, -1.45], [3.0, -1.0]] },
];
export const SNACKS = ['milk', 'cupcake', 'icecream'];
export { LEVELS };
const SNEAK = 1.05, SCURRY = 2.2, SCURRY_AT = 2.6;   // units / s; a finger this far ahead breaks into a scurry
const MOM_WALK = 1.15, CHECK_T = 3.4;
const EYE_H = 1.25, BODY_H = .58, CROUCH_H = .3, ME_R = .16;

export function mapFor(lv) {
  const room = { w: 7, d: 5, theme: THEMES.apt, wallH: 2.9, walls: { N: 'wall', W: 'wall' },
    floorZones: lv.zones || [{ i: 4, j: 0, w: 3, d: 2, kind: 'checker', a: '#fffaf0', b: '#cfe8d6' }],
    furniture: lv.furniture, decor: lv.decor || [D('door', 'W', 1.0), D('catclock', 'N', -1.0), D('balconywin', 'W', -1.2), D('wallrack', 'N', 1.5)] };
  return { theme: THEMES.apt, bleed: true, rooms: [{ at: [0, 0], layout: room }] };
}
// a little bluetooth speaker (the house toy style: round boxes, a ring that glows while it plays)
function makeSpeaker() {
  const g = new THREE.Group();
  g.add(put(rbox(.3, .4, .24, '#7a86c9', .08), 0, .2, 0));
  g.add(put(cyl(.1, .1, .03, '#3b3f5c'), 0, .25, .12, Math.PI / 2, 0, 0));
  g.add(put(cyl(.05, .05, .035, '#5a6090'), 0, .25, .125, Math.PI / 2, 0, 0));
  const led = put(sph(.028, '#7dffc4', { emissive: '#7dffc4', ei: .2 }), .09, .36, .1); g.add(led);
  g.add(put(rbox(.32, .03, .26, '#5a6090', .015), 0, .015, 0));
  g.userData.led = led;
  return g;
}

// ── line of sight on the floor plan, with heights: an obstacle hides you if the eye→you line passes below its top
export function segBox(ax, az, bx, bz, o) {
  // slab test of segment A→B against an axis-aligned box: returns [t0, t1] inside, or null
  let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
  for (const [p, d, lo, hi] of [[ax, dx, o.x0, o.x1], [az, dz, o.z0, o.z1]]) {
    if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return null; continue; }
    let u0 = (lo - p) / d, u1 = (hi - p) / d; if (u0 > u1) [u0, u1] = [u1, u0];
    t0 = Math.max(t0, u0); t1 = Math.min(t1, u1); if (t0 > t1) return null;
  }
  return [t0, t1];
}
export function sees(eye, occ, px, pz, ph) {
  for (const o of occ) {
    const r = segBox(eye.x, eye.z, px, pz, o); if (!r) continue;
    if (r[0] < .02 && r[1] < .3) continue;                        // the piece the eye stands in / right beside
    if (r[1] > .985) { if (o.h > ph) return false; continue; }   // you're standing in it (hugging it)
    const hRay = eye.h + (ph - eye.h) * r[1];                     // the line is lowest where it leaves the box
    if (hRay < o.h) return false;
  }
  return true;
}
export const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const AWAY = new Set(['rise', 'walk', 'check', 'walkback', 'sit']);
const DOZING = new Set(['doze', 'stir']);   // night 3: asleep (no eyes), or half awake
const LOOKS = new Set(['look', 'turn', 'patrol', 'pause', 'awake']);   // states whose eyes are open and searching

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; }
  async enter({ lv = 0, practice = null } = {}) {
    const L = this.L, W = L.world, ui = L.ui;
    const LV = this.lv = this.levelFor(lv);
    // 첫째 밤, the first time (scenes/bossgame.js says where to start: 'press' from the top, 'go' with the basics done)
    this.prFrom = practice && this.lvIdx === 0 && !L.bot ? practice : null;
    document.getElementById('app').dataset.night = LV.day ? '' : '1';
    L.setBg(LV.bg || ['#3b3a6e', '#1d1c3a']); W.setLight(LV.light || NIGHT);
    const map = this.map = new MapRooms(W, this.mapDef(LV));
    W.root.add(map.group); map.group.updateMatrixWorld(true);
    const R = this.room = map.rooms[0];
    this.B = { x0: -R.w / 2 + .24, x1: R.w / 2 - .24, z0: -R.d / 2 + .24, z1: R.d / 2 - .24 };
    this.snackTypes = LV.snacks || SNACKS;
    this.prepare?.(LV);
    // gadgets you can set off (a speaker is placed now, so it counts as furniture for sight and bumping)
    this.lures = (LV.lures || []).map(d => {
      let g, rec = null;
      if (d.furn) { rec = map.furns.find(r => r.type === d.furn); g = rec?.f.group; }
      else { g = makeSpeaker(); g.position.set(d.speaker[0], 0, d.speaker[1]); g.rotation.y = Math.atan2(-d.speaker[0], -d.speaker[1]); W.root.add(g); }
      return g ? { ...d, g, rec, used: false, own: !rec } : null;
    }).filter(Boolean);
    this.buildOccluders();
    this.grid = walkGrid([R], .24);
    // the bots' route (and the door / the fridge at its two ends)
    const pts = LV.route.map(([x, z]) => new THREE.Vector2(x, z));
    this.route = pts; this.segLen = []; let acc = 0;
    for (let i = 1; i < pts.length; i++) { const l = pts[i].distanceTo(pts[i - 1]); this.segLen.push(l); acc += l; }
    this.total = acc; this.s = 0; this.dir = 1;
    this.door = pts[0].clone(); this.fridgeAt = pts[pts.length - 1].clone();
    this.fridge = this.goalFurn(map, LV);
    // 몽글이
    const me = this.me = new Char('mong'); W.root.add(me.root);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(.3, .4, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .5, depthWrite: false }));
    this.ring.rotation.x = -Math.PI / 2; W.root.add(this.ring);
    this.aim = new THREE.Mesh(new THREE.RingGeometry(.1, .15, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
    this.aim.rotation.x = -Math.PI / 2; W.root.add(this.aim);
    this.pos = this.door.clone(); this.face = 0; this.placeMe(0);
    // mom (sitting on the sofa, or at the table)
    const mom = this.mom = new Char(LV.guard || 'mom'); W.root.add(mom.root);
    mom.root.position.set(LV.mom.at[0], LV.mom.y, LV.mom.at[1]); mom.root.rotation.y = LV.mom.busyYaw;
    this.seat = new THREE.Vector2(LV.mom.at[0], LV.mom.at[1]);
    this.eye = { x: LV.mom.at[0], z: LV.mom.at[1], h: EYE_H };
    this.momYaw = LV.mom.busyYaw; this.lookYaw = this.yawTo(this.fridgeAt.x, this.fridgeAt.y);
    this.mState = 'busy'; this.mT = LV.busy[0]; this.sus = 0;
    this.momBody = { x: LV.mom.at[0], z: LV.mom.at[1], r: .3 };
    this.bodies = [this.momBody];
    // 첫째 밤 'watch': she sits and looks round now and then · 둘째 밤 'patrol': she walks between her points, eyes
    // ahead · 셋째 밤 'doze': she sleeps on the sofa — no eyes, but she hears (the sound gauge)
    this.mode = LV.mode || 'watch'; this.hear = 0; this.lullT = 0; this.openT = 0; this.mask = 1;
    if (this.mode === 'patrol') { this.wi = 1; this.mState = 'patrol'; this.occ = this.occFull; this.momYaw = this.baseYaw(); mom.root.rotation.y = this.momYaw; }
    if (this.mode === 'doze') { this.mState = 'doze'; this.snT = 0; this.sleepFace(true); }
    if (LV.dog) {
      const dog = this.dog = new Char('shiba'); W.root.add(dog.root);
      dog.root.position.set(LV.dog.at[0], 0, LV.dog.at[1]); dog.root.rotation.y = LV.dog.yaw; dog.setFace('happy'); dog.awake = false;
      this.zzz = L.say(dog, 'Zz…', 1e9, 'think');
      this.bodies.push({ x: LV.dog.at[0], z: LV.dog.at[1], r: .32 });
    }
    // light pools and markers: the fridge light, the vision field, the goal sparkle (fridge, then your door)
    this.buildVision();
    this.fridgeGlow = this.glow(this.fridgeAt.x, this.fridgeAt.y, 1.1, '#fff2b0'); this.fridgeGlow.material.opacity = 0;
    const tv = map.furns.find(r => r.type === 'tvlow');
    if (tv && !LV.tvOff) { const b = new THREE.Box3().setFromObject(tv.f.group); this.tvGlow = this.glow((b.min.x + b.max.x) / 2, b.min.z - .7, 1.0, '#8fc8ff'); this.tvGlow.scale.set(1.4, 1, .8); }
    if (!LV.key) { const M = LV.moon || { at: [-2.7, .9], s: [.8, 1.5] }; this.moon = this.glow(M.at[0], M.at[1], 1.0, '#dfe6ff'); this.moon.scale.set(M.s[0], 1, M.s[1]); this.moon.material.opacity = .16; }
    this.creaks = (LV.creaks || []).map(([x, z]) => ({ x, z, on: false, flash: 0, m: this.creakMark(x, z) }));
    if (this.fridge) { const b = new THREE.Box3().setFromObject(this.fridge.f.group); this.fridgeTop = new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2); }
    this.goal = new THREE.Mesh(new THREE.RingGeometry(.22, .3, 28), new THREE.MeshBasicMaterial({ color: '#ffe36b', transparent: true, opacity: .6, depthWrite: false }));
    this.goal.rotation.x = -Math.PI / 2; this.goal.position.set(this.fridgeAt.x, .03, this.fridgeAt.y); W.root.add(this.goal);
    this.snacks = []; this.grabT = 0; this.fridgeOpen = 0; this.doorOpen = false;
    this.touch = null; this.result = null; this.moving = false; this.noise = 0; this.everMoved = false;
    this.frame();
    this.gk = LV.guard || 'mom';
    L.makeThumbs({ items: this.snackTypes, faces: [[this.gk, 'normal'], [this.gk, 'angry'], ['mong', 'happy'], ...(this.mode === 'doze' ? [[this.gk, 'happy']] : [])] });
    this.buildHud();
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    await ui.banner(LV.name, LV.sub, 1300);
    if (this.dead) return;
    this.started = true;
    if (this.mode === 'patrol') this.msay(LV.patrol.lines[0], 1500, 'think');
    // a new gadget tonight: "새로 얻었다" (that's how the lure is taught)
    const fresh = this.lures.find(d => !(this.lvIdx > 0 && LEVELS[this.lvIdx - 1]?.lures?.some(p => p.name === d.name)));
    if (fresh) this.gotCard(fresh);
    if (this.prFrom) this.startPractice(this.prFrom, fresh ? 2.8 : 0);   // (its first line once the card is gone)
  }
  // hooks a variant overrides (the boss version builds them from any stage map)
  levelFor(lv) { this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); return LEVELS[this.lvIdx]; }
  get levelCount() { return LEVELS.length; }
  mapDef(LV) { return mapFor(LV); }
  goalFurn(map) { return map.furns.find(r => r.type === 'bigfridge'); }
  yawTo(x, z) { return Math.atan2(x - this.eye.x, z - this.eye.z); }
  // her resting state for tonight, and the way she faces in it
  isBase() { return ['busy', 'patrol', 'pause', 'doze', 'stir'].includes(this.mState); }
  baseYaw() {
    if (this.mode !== 'patrol') return this.lv.mom.busyYaw;
    const t = this.lv.patrol.pts[this.wi], p = this.mom.root.position; return Math.atan2(t[0] - p.x, t[1] - p.z);
  }
  toBase() {
    const LV = this.lv; this.slow = 0;
    if (this.mode === 'patrol') { this.mState = 'patrol'; this.mom.setFace('normal'); }
    else if (this.mode === 'doze') { this.mState = 'doze'; this.hear = Math.min(this.hear, .5); this.snT = 0; this.sleepFace(true); this.msay('…꿈이었나', 1200, 'think'); }
    else { this.mState = 'busy'; this.mT = LV.busy[0] + Math.random() * (LV.busy[1] - LV.busy[0]); }
  }
  // asleep: the sleepy eye arcs instead of open eyes
  sleepFace(on) {
    const m = this.mom; m.setFace('normal');
    if (on) { m.eyes.forEach(e => (e.visible = false)); m.eyesSleep.forEach(e => (e.visible = true)); }
    if (this.momImg) this.momImg.src = this.L.thumbs[`face_${this.gk}_${on ? 'happy' : 'normal'}`];
  }
  // mom's speech bubble (a new line replaces the last one)
  msay(t, ms, cls) { this._mb?.remove(); this._mb = this.L.say(this.mom, t, ms, cls); return this._mb; }
  // a loose floorboard: a lighter plank with cracks (you learn it the first time it goes 삐걱)
  creakMark(x, z) {
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 64; const c = cv.getContext('2d');
    c.fillStyle = 'rgba(222,178,126,.8)'; c.beginPath(); c.roundRect(6, 14, 84, 36, 8); c.fill();
    c.strokeStyle = 'rgba(96,58,30,.9)'; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(18, 27); c.lineTo(32, 32); c.lineTo(44, 25); c.moveTo(50, 40); c.lineTo(64, 34); c.lineTo(78, 39); c.stroke();
    c.fillStyle = 'rgba(96,58,30,.9)'; c.beginPath(); c.arc(15, 41, 2.8, 0, 7); c.fill(); c.beginPath(); c.arc(81, 23, 2.8, 0, 7); c.fill();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.66, .44), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, .022, z); this.L.world.root.add(m); return m;
  }
  buildOccluders() {
    // two sets: with mom on her seat (her own sofa hides only behind its back, her own table hides nothing) and with
    // her up and about (everything counts)
    const seat = this.occSeat = [], full = this.occFull = [], LV = this.lv;
    const add = (b, rec, solid) => {
      const h = b.max.y - b.min.y; if (h < .22) return;
      const s = .06, cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
      const o = { x0: b.min.x + s, x1: b.max.x - s, z0: b.min.z + s, z1: b.max.z - s, h: b.max.y, type: rec?.type || 'speaker', solid };
      full.push(o);
      const near = Math.abs(cx - LV.mom.at[0]) < 1.4 && Math.abs(cz - LV.mom.at[1]) < 1.4;
      if (rec && LV.mom.own === rec.type && near) seat.push({ ...o, h: 0 });
      else if (rec && LV.mom.sit === rec.type && near) seat.push({ ...o, z1: o.z0 + .3 });
      else seat.push(o);
    };
    for (const rec of this.map.furns) {
      if (['rug', 'zabuton'].includes(rec.type)) continue;
      const b = new THREE.Box3().setFromObject(rec.f.group);
      // what you bump into: the piece's tiles, a little inside their edges (leaves and cushions overhang them)
      const R = this.room, [fw, fd] = R.footprint(rec.type, rec.rot || 0), tx = -R.w / 2 + rec.i, tz = -R.d / 2 + rec.j, q = .2;
      add(b, rec, rec.i != null ? { x0: tx + q, x1: tx + fw - q, z0: tz + q, z1: tz + fd - q } : { x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z });
    }
    for (const d of this.lures || []) if (d.own) { const b = new THREE.Box3().setFromObject(d.g); add(b, null, { x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z }); }
    this.occ = seat;
  }
  // can 몽글이 stand at (x, z)? (the room, furniture footprints, mom and the dog)
  free(x, z) {
    const B = this.B; if (x < B.x0 || x > B.x1 || z < B.z0 || z > B.z1) return false;
    const R = this.room, ti = Math.floor(x + R.w / 2), tj = Math.floor(z + R.d / 2); if (R.isCut(ti, tj) || R.heightAt(ti, tj)) return false;
    for (const o of this.occFull) { const S = o.solid; if (x > S.x0 - ME_R && x < S.x1 + ME_R && z > S.z0 - ME_R && z < S.z1 + ME_R) return false; }
    for (const b of this.bodies) if (Math.hypot(x - b.x, z - b.z) < b.r + ME_R) return false;
    return true;
  }
  // ── the floor overlay: mom's gaze (warm), her TV gaze (cool), the "about to look" preview (red), one canvas
  buildVision() {
    const Rm = this.room, x0 = -Rm.w / 2 - .2, x1 = Rm.w / 2 + .2, z0 = -Rm.d / 2 - .2, z1 = Rm.d / 2 + .2, R = 24;   // px per unit
    const cv = this.vc = document.createElement('canvas'); cv.width = Math.round((x1 - x0) * R); cv.height = Math.round((z1 - z0) * R);
    this.vctx = cv.getContext('2d'); this.vimg = this.vctx.createImageData(cv.width, cv.height);
    this.vbox = { x0, z0, R, w: cv.width, h: cv.height };
    const tex = this.vtex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 1 }));
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, .025, (z0 + z1) / 2); m.renderOrder = 2;
    this.L.world.root.add(m); this.vmesh = m; this._vKey = '';
  }
  // { half (rad), range, k (how fast she notices) } of her eyes right now
  sight() {
    const LV = this.lv, s = this.mState, D = Math.PI / 180;
    if (this.mode === 'doze' && s !== 'look' && s !== 'turn') return { half: 0, range: 0, k: 0, warm: false };   // eyes shut
    if (this.mode === 'patrol' && !AWAY.has(s) && s !== 'look' && s !== 'turn') return { half: LV.half * D, range: LV.range, k: .9, warm: true };   // eyes ahead as she walks
    if (s === 'look' || s === 'turn') return { half: LV.half * D, range: LV.range, k: this.mode === 'doze' ? .7 : 1, warm: true };
    if (s === 'walk' || s === 'walkback' || s === 'rise') return { half: 48 * D, range: 5, k: .8, warm: true };
    if (s === 'check' || s === 'sit') return { half: 36 * D, range: 2.6, k: .7, warm: true };
    return { half: LV.tv.half * D, range: LV.tv.range, k: .55, warm: false };
  }
  paintVision() {
    const { x0, z0, R, w, h } = this.vbox, d = this.vimg.data, e = this.eye, LV = this.lv;
    const S = this.sight();
    const key = `${this.momYaw.toFixed(3)}|${this.mState}|${this.lookYaw.toFixed(3)}|${e.x.toFixed(2)},${e.z.toFixed(2)}`;
    if (key === this._vKey) return; this._vKey = key;
    d.fill(0);
    const step = 2, layers = [{ yaw: this.momYaw, half: S.half, range: S.range, a: S.warm ? 112 : 60, c: S.warm ? [255, 214, 90] : [150, 190, 255] }];
    if (this.mState === 'hmm') layers.push({ yaw: this.lookYaw, half: LV.half * Math.PI / 180, range: LV.range, a: 70 + 40 * Math.abs(Math.sin(this.t * 12)), c: [255, 92, 110] });
    for (let py = 0; py < h; py += step) for (let px = 0; px < w; px += step) {
      const x = x0 + (px + 1) / R, z = z0 + (py + 1) / R, dx = x - e.x, dz = z - e.z, r = Math.hypot(dx, dz);
      if (r < .2) continue;
      const ang = Math.atan2(dx, dz);
      let best = null;
      for (const Ly of layers) {
        if (r > Ly.range) continue;
        const da = Math.abs(wrap(ang - Ly.yaw));
        if (da > Ly.half) continue;
        if (!sees(e, this.occ, x, z, BODY_H)) continue;
        const a = Ly.a * Math.min(1, (Ly.half - da) / .12) * Math.min(1, (Ly.range - r) / 1.0);
        if (!best || a > best.a) best = { a, c: Ly.c };
      }
      if (!best) continue;
      for (let yy = 0; yy < step; yy++) for (let xx = 0; xx < step; xx++) {
        const k = ((py + yy) * w + (px + xx)) * 4; d[k] = best.c[0]; d[k + 1] = best.c[1]; d[k + 2] = best.c[2]; d[k + 3] = best.a;
      }
    }
    this.vctx.putImageData(this.vimg, 0, 0); this.vtex.needsUpdate = true;
  }
  glow(x, z, r, color) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .4, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, .02, z); this.L.world.root.add(m); return m;
  }
  // route helpers (bots)
  at(s) {
    s = clamp(s, 0, this.total);
    for (let i = 0; i < this.segLen.length; i++) {
      if (s <= this.segLen[i] || i === this.segLen.length - 1) { const k = this.segLen[i] ? clamp(s / this.segLen[i], 0, 1) : 0; return new THREE.Vector2().lerpVectors(this.route[i], this.route[i + 1], k); }
      s -= this.segLen[i];
    }
    return this.route[0].clone();
  }
  sOf(p) {   // the route position nearest to p
    let best = 0, bd = 1e9, acc = 0;
    for (let i = 0; i < this.segLen.length; i++) {
      const a = this.route[i], b = this.route[i + 1], ab = new THREE.Vector2().subVectors(b, a), k = clamp(new THREE.Vector2().subVectors(p, a).dot(ab) / ab.lengthSq(), 0, 1);
      const d = p.distanceTo(new THREE.Vector2().lerpVectors(a, b, k)); if (d < bd) { bd = d; best = acc + k * this.segLen[i]; }
      acc += this.segLen[i];
    }
    return best;
  }
  placeMe(dt) {
    const me = this.me, p = this.pos;
    me.root.position.set(p.x, 0, p.y); this.ring?.position.set(p.x, .035, p.y);
    const r = me.root.rotation.y; me.root.rotation.y = r + wrap(this.face - r) * Math.min(1, dt * 14);
  }
  frame() {
    const W = this.L.world, R = this.room, span = (R.w + R.d) / Math.SQRT2 + .5;
    W.home.set(0, .5, .2); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = .8; W.zoom = 1;
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(span, span * .7, .52);
  }

  // ── input: press and hold on the floor = walk toward the finger; tap a gadget = set it off; keys WASD / arrows
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => {
      if (e.button > 0 || this.result || this.touch || !this.started) return;
      const d = this.lureAt(e.clientX, e.clientY);
      if (d) { this.fireLure(d); return; }
      this.touch = { id: e.pointerId, x: e.clientX, y: e.clientY, fridge: this.onFridge(e.clientX, e.clientY), t0: performance.now() };
    };
    this._move = e => { const T = this.touch; if (T && e.pointerId === T.id) { T.x = e.clientX; T.y = e.clientY; } };
    this._up = e => {
      const T = this.touch; if (!T || (e?.pointerId != null && e.pointerId !== T.id)) return;
      this.touch = null;
      // a tap on the fridge while standing at it opens it (or shuts it again)
      if (T.fridge && performance.now() - T.t0 < 320 && this.atFridge() && !this.result) this.setDoor(!this.doorOpen);
    };
    this.keys = new Set();
    this._kd = e => { if (/^(Arrow|Key[WASD])/.test(e.code) || e.code === 'Space') { this.keys.add(e.code); e.preventDefault(); } };
    this._ku = e => this.keys.delete(e.code);
    app.addEventListener('pointerdown', this._down); addEventListener('pointermove', this._move); addEventListener('pointerup', this._up); addEventListener('pointercancel', this._up);
    this._blur = () => { this._up({}); this.keys.clear(); }; addEventListener('blur', this._blur);
    addEventListener('keydown', this._kd); addEventListener('keyup', this._ku);
  }
  onFridge(x, y) {
    if (!this.fridge) return false;
    const W = this.L.world; if (W.pick(x, y, [this.fridge.f.group])[0]) return true;
    const b = new THREE.Box3().setFromObject(this.fridge.f.group), s = W.toScreen(b.getCenter(new THREE.Vector3()));
    return Math.hypot(s.x - x, s.y - y) < 46;   // a fat finger on the fridge counts too
  }
  atFridge() { return this.pos.distanceTo(this.fridgeAt) < .8; }
  touchFridge() { return !!(this.touch?.fridge || this.botFridge); }
  setDoor(open) {
    if (this.doorOpen === open) return;
    this.doorOpen = open; this.L.audio.sfx(open ? 'open' : 'close');
    if (this.mode === 'doze') this.hear = Math.min(1, this.hear + .04 * this.mask);
  }
  lureAt(x, y) {
    const live = this.lures.filter(d => !d.used); if (!live.length) return null;
    const hit = this.L.world.pick(x, y, live.map(d => d.g))[0];
    if (hit) return live.find(d => { for (let o = hit.object; o; o = o.parent) if (o === d.g) return true; return false; });
    // a fat finger: a press right on top of a gadget's screen spot counts too
    const W = this.L.world, v = new THREE.Vector3();
    return live.find(d => { const s = W.toScreen(d.g.getWorldPosition(v).setY(.25)); return Math.hypot(s.x - x, s.y - y) < 34; }) || null;
  }
  // what the controls ask for this frame: a floor target (finger / bot) or a direction (keys), and whether pressed
  input() {
    const K = this.keys, kx = (K.has('ArrowRight') || K.has('KeyD') ? 1 : 0) - (K.has('ArrowLeft') || K.has('KeyA') ? 1 : 0), ky = (K.has('ArrowDown') || K.has('KeyS') ? 1 : 0) - (K.has('ArrowUp') || K.has('KeyW') ? 1 : 0);
    if (kx || ky) { const y = this.L.world.yaw, rx = Math.cos(y), rz = -Math.sin(y), fx = -Math.sin(y), fz = -Math.cos(y), n = Math.hypot(kx, ky);
      return { down: true, dir: [(rx * kx - fx * ky) / n, (rz * kx - fz * ky) / n], run: K.has('ShiftLeft') }; }
    if (K.has('Space')) return { down: true };
    if (this.touch?.fridge) return { down: true, fridge: true, target: this.atFridge() ? null : this.fridgeAt.clone() };   // held on the fridge: go to its front, then reach in
    if (this.touch) { const g = this.L.world.screenToGround(this.touch.x, this.touch.y, 0); return { down: true, target: g ? new THREE.Vector2(g.x, g.z) : null }; }
    if (this.botDown) return { down: true, target: this.botTarget || null, fridge: !!this.botFridge };
    return { down: false };
  }
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col();
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, this.lv.title || '엄마 몰래 야식', h('small', {}, this.lv.name)));
    this.slots = this.snackTypes.map(t => h('div', { class: 'ys-slot' }, h('img', { src: L.thumbs['item_' + t] })));
    top.append(h('div', { class: 'ys-slots' }, ...this.slots));
    col.append(top);
    this.momIcon = h('div', { class: 'ys-mom' }, this.momImg = h('img', { src: L.thumbs[`face_${this.gk}_${this.mode === 'doze' ? 'happy' : 'normal'}`] }), this.susBar = h('i'));
    col.append(this.momIcon);
    if (this.mode === 'doze') {
      if (!document.getElementById('ys-css-ear')) document.head.append(h('style', { id: 'ys-css-ear' }, `
.ys-ear { position: absolute; left: 10px; top: calc(146px + var(--safeT, 0px)); display: flex; flex-direction: column; align-items: center; gap: 2px; pointer-events: none; font-weight: 800; font-size: 13px; color: #fff; }
.ys-ear b { display: block; width: 62px; height: 10px; border-radius: 6px; background: rgba(20, 16, 40, .6); border: 2px solid rgba(255, 255, 255, .55); overflow: hidden; }
.ys-ear b i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #9fd8ff, #c48bff 60%, #ff5f86); transition: width .12s linear; }
.ys-ear.hot b { border-color: #ff8aa0; animation: ysEar .5s ease-in-out infinite alternate; }
.ys-ear.quiet span::after { content: ' · 드르렁'; color: #9fd8ff; }
.ys-ear.lull span::after { content: ' · 자장가'; color: #9fd8ff; }
@keyframes ysEar { to { transform: scale(1.08); } }`));
      this.ear = h('div', { class: 'ys-ear' }, h('span', { class: 'ol' }, '소리'), h('b', {}, this.earBar = h('i')));
      col.append(this.ear);
    }
    this.hint = h('div', { class: 'ys-hint ol' }, h('span', { class: 'ys-hand' }), this.hintTx = h('span', {}, '가고 싶은 곳을 꾹 누르고 있기'));
    // the fridge gauge (10/18, user: "냉장고 앞에서 꾹 누르고 있으면 문 열리고 프로그레스 게이지 나오는 게 나을 거 같아"): over the
    // fridge while you hold it — fills while the door opens, then once per snack
    this.grabG = h('div', { class: 'ys-grab' }, this.grabI = h('i')); ui.wui.append(this.grabG);
    col.append(this.hint);
    this.vig = h('div', { class: 'ys-vig' }); document.getElementById('app').append(this.vig);
    // a badge over every gadget you can still set off (a note for a speaker, a bolt for a machine; drawn, since the
    // body font draws ♪ as a blank)
    const ICON = { note: '<path d="M9 17.5a3 3 0 1 1-2-2.83V5l11-2v11.5a3 3 0 1 1-2-2.83V6.4l-7 1.27z"/>', bolt: '<path d="M13.5 2 4.5 13.5h6l-1.5 8.5 9.5-12h-6.2z"/>' };
    for (const d of this.lures) { d.badge = h('div', { class: 'ys-lure' }); d.badge.innerHTML = `<svg viewBox="0 0 24 24" width="21" height="21" fill="#2a1a3d">${ICON[d.speaker ? 'note' : 'bolt']}</svg>`; ui.wui.append(d.badge); }
  }
  gotCard(d) {
    const L = this.L, h = L.h;
    const c = h('div', { class: 'ys-get' }, h('div', { class: 'ys-get-t ol' }, '새로 얻었다!'), h('div', { class: 'ys-get-n', style: 'word-break: keep-all' }, `${d.name} 리모컨`), h('div', { class: 'ys-get-s' }, d.card || `톡 하면 ${this.lv.guard && this.lv.guard !== 'mom' ? '술래가' : '엄마가'} 끄러 가요 · 한 번만`));
    document.getElementById('app').append(c); L.audio.sfx('special');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2600);
  }
  setHint(t) { if (this.hintTx.textContent !== t) this.hintTx.textContent = t; }

  // ── mom
  stepMom(dt) {
    const LV = this.lv, L = this.L;
    this.mT -= dt;
    const rnd = ([a, b]) => a + Math.random() * (b - a);
    const turnTo = (goal, k) => { this.momYaw += wrap(goal - this.momYaw) * Math.min(1, k); };
    switch (this.mState) {
      case 'busy':
        turnTo(LV.mom.busyYaw, dt * 6);
        if (this.pr?.calm) this.mT = Math.max(this.mT, .5);   // the practice's first steps: her eyes stay on the TV
        if (this.mT <= 0) this.startHmm();
        break;
      case 'hmm': {
        // her head starts to come round; the preview shows where she'll look
        const k = 1 - this.mT / this.telDur;
        turnTo(this.hmmYaw + wrap(this.lookYaw - this.hmmYaw) * .18 * k, dt * 8);
        if (this.mT <= 0) {
          if (this.fakeOut) { this.toBase(); if (this.mState === 'busy') this.mT *= .6; this.msay('…아닌가', 900); this.mom.setFace('normal'); }
          else { this.mState = 'turn'; this.mT = this.slow ? .8 : .28; L.audio.sfx('swish'); }
        }
        break;
      }
      case 'turn':
        turnTo(this.lookYaw, dt * (this.slow ? 5 : 16));   // (the practice's first look comes round slowly)
        if (this.mT <= 0) { this.mState = 'look'; this.mT = this.slow ? 2.6 : rnd(LV.look); this.sweep0 = this.t; }
        break;
      case 'look':
        turnTo(this.lookYaw + Math.sin((this.t - this.sweep0) * 1.6) * .16, dt * 10);
        if (this.mT <= 0) { this.mState = 'back'; this.mT = .4; this.mom.setFace('normal'); }
        break;
      case 'back':
        turnTo(this.baseYaw(), dt * 9);
        if (this.mT <= 0) this.toBase();
        break;
      // 둘째 밤: walking to her next point, eyes ahead; there she stops and looks round
      case 'patrol': {
        const P = LV.patrol, t = P.pts[this.wi], p = this.mom.root.position, dx = t[0] - p.x, dz = t[1] - p.z, d = Math.hypot(dx, dz), st = P.speed * dt;
        if (d <= st) {
          p.x = t[0]; p.z = t[1]; this.wi = (this.wi + 1) % P.pts.length;
          this.mState = 'pause'; this.mT = rnd(P.pause); this.pauseYaw = this.momYaw; this.sweep0 = this.t;
          if (Math.random() < .35) this.startHmm();   // now and then a real look round (the red preview first)
          else if (Math.random() < .5) this.msay(P.lines[Math.floor(Math.random() * P.lines.length)], 1300, 'think');
        } else { p.x += dx / d * st; p.z += dz / d * st; turnTo(Math.atan2(dx, dz), dt * 7); this.mom.lift = Math.abs(Math.sin(this.t * 8)) * .035; }
        break;
      }
      case 'pause':
        turnTo(this.pauseYaw + Math.sin((this.t - this.sweep0) * 1.7) * .85, dt * 5);
        if (this.mT <= 0) this.mState = 'patrol';
        break;
      // 셋째 밤: asleep (snoring now and then), or stirring a moment when it got noisy
      case 'doze': case 'stir':
        turnTo(LV.mom.busyYaw, dt * 3);
        if (this.mState === 'stir' && this.mT <= 0) { this.mState = 'doze'; this.sleepFace(true); }
        break;
      // lured: up, over to the gadget, a while switching it off, back, down
      case 'rise': {
        const c = this.lure.target; turnTo(Math.atan2(c.x - this.eye.x, c.y - this.eye.z), dt * 8);
        this.mom.root.position.y = LV.mom.y * Math.max(0, this.mT / .6);
        if (this.mT <= 0) { this.mState = 'walk'; this.occ = this.occFull; }
        break;
      }
      case 'walk': case 'walkback': {
        const path = this.lure.path, p = this.mom.root.position;
        if (!path.length) {
          if (this.mState === 'walk') { this.mState = 'check'; this.mT = CHECK_T; this.msay('누가 켰지…?', 1400, 'think'); }
          else if (this.mode === 'patrol') { this.lure = null; this.toBase(); }   // back on her round
          else { this.mState = 'sit'; this.mT = .5; }
          break;
        }
        const t = path[0], dx = t.x - p.x, dz = t.y - p.z, d = Math.hypot(dx, dz), st = MOM_WALK * dt;
        if (d <= st) { p.x = t.x; p.z = t.y; path.shift(); } else { p.x += dx / d * st; p.z += dz / d * st; turnTo(Math.atan2(dx, dz), dt * 10); }
        this.mom.lift = Math.abs(Math.sin(this.t * 9)) * .04;
        break;
      }
      case 'check': {
        const c = this.lure.devAt; turnTo(Math.atan2(c.x - this.eye.x, c.y - this.eye.z), dt * 8);
        if (this.mT < .9 && !this.lure.off) { this.lure.off = true; this.stopGadget(this.lure.d); this.msay('휴, 껐다', 900); L.audio.sfx('click'); }
        if (this.mT <= 0) { this.mState = 'walkback'; this.lure.path = this.lure.back; }
        break;
      }
      case 'sit': {
        const p = this.mom.root.position, k = 1 - Math.max(0, this.mT / .5);
        p.x += (this.seat.x - p.x) * Math.min(1, dt * 10); p.z += (this.seat.y - p.z) * Math.min(1, dt * 10); p.y = LV.mom.y * k;
        turnTo(LV.mom.busyYaw, dt * 8);
        if (this.mT <= 0) { p.set(this.seat.x, LV.mom.y, this.seat.y); this.mState = 'busy'; this.mT = LV.busy[0] + 1; this.occ = this.occSeat; this.lure = null; this.mom.setFace('normal'); }
        break;
      }
    }
    const p = this.mom.root.position; this.eye.x = p.x; this.eye.z = p.z; this.momBody.x = p.x; this.momBody.z = p.z;
    this.mom.root.rotation.y = this.momYaw;
  }
  startHmm(urgent = false) {
    const LV = this.lv, L = this.L;
    if (AWAY.has(this.mState) || this.pr?.calm) return;
    if (!this.isBase() && !urgent) return;
    this.hmmYaw = this.momYaw;
    this.mState = 'hmm'; this.telDur = this.mT = urgent ? Math.min(LV.tel, .55) : LV.tel;
    this.fakeOut = !urgent && Math.random() < LV.fake;
    // she looks toward where the sound came from (roughly where you are), never quite straight at you
    const p = this.pos;
    this.lookYaw = this.yawTo(p.x, p.y) + (Math.random() - .5) * .5;
    if (this.mode === 'doze') this.sleepFace(false);
    this.mom.setFace('sus'); this.msay(this.mode === 'doze' ? '흠냐…?!' : '흠…?', Math.max(700, this.telDur * 1000), 'think');
    L.audio.sfx('hmm');
  }
  // set a gadget off: it plays (notes / a beep and a wiggle) and mom goes to switch it off
  fireLure(d) {
    const L = this.L, LV = this.lv;
    if (d.used) return;
    d.used = true; d.badge?.remove(); d.on = true; L.audio.sfx('pop', 8); L.audio.sfx(d.speaker ? 'special' : 'wobble');
    L.log({ lure: d.name, t: +this.t.toFixed(1), mom: this.mState });
    if (d.lullaby) { this.lullT = LV.doze?.lull || 9; if (DOZING.has(this.mState)) this.msay('쿨… 쿨…', 1500, 'think'); return; }   // she sleeps deeper while it plays
    if (AWAY.has(this.mState)) return;   // she's already up: it just plays until she gets to it
    // her walk: from the floor tile beside her seat to the tile in front of the gadget, and back
    const b = new THREE.Box3().setFromObject(d.g), c = b.getCenter(new THREE.Vector3());
    const home = this.mode === 'patrol' ? new THREE.Vector2(this.eye.x, this.eye.z) : this.seat;   // on patrol she comes back to where she was
    const from = nearestTile(this.grid, home.x, home.y);
    const goals = this.grid.filter(t => Math.hypot(t.x - c.x, t.z - c.z) < 1.1).sort((a, q) => Math.hypot(a.x - home.x, a.z - home.y) - Math.hypot(q.x - home.x, q.z - home.y));
    const to = goals[0] || nearestTile(this.grid, c.x, c.z);
    const tiles = from && to ? [from, ...(gridPath(from, to) || [])] : [];
    const path = tiles.map(t => new THREE.Vector2(t.x, t.z));
    this.lure = { d, path: path.slice(), back: [...path].reverse().concat([home.clone()]), devAt: new THREE.Vector2(c.x, c.z), target: new THREE.Vector2(c.x, c.z), off: false };
    this.mState = 'rise'; this.mT = .6; this.mom.setFace('wow');
    this.msay(d.line, 1400);
  }
  stopGadget(d) { d.on = false; if (d.g.userData.led) d.g.userData.led.material.color?.set('#3b3f5c'); d.g.rotation.z = 0; d.g.position.y = 0; }
  // can mom see a point (x, z) at body height ph right now, with yaw / sight?
  canSee(x, z, ph, yaw = this.momYaw, S = this.sight()) {
    const e = this.eye, dx = x - e.x, dz = z - e.z, r = Math.hypot(dx, dz);
    if (r > S.range) return false;
    if (Math.abs(wrap(Math.atan2(dx, dz) - yaw)) > S.half) return false;
    return sees(e, this.occ, x, z, ph);
  }
  seen() { return this.canSee(this.pos.x, this.pos.y, this.moving || this.grabbing ? BODY_H : CROUCH_H); }
  // would 몽글이 be hidden from her looking straight at it (from her seat) at route position s? (the bots plan with it)
  hiddenAt(s) { const p = this.at(s); return this.hidAt(p.x, p.y); }
  hidAt(x, z) { return !sees({ x: this.seat.x, z: this.seat.y, h: EYE_H }, this.occSeat, x, z, CROUCH_H) || Math.hypot(x - this.seat.x, z - this.seat.y) > this.lv.range; }

  // ── per frame
  update(dt) {
    const L = this.L, W = L.world, me = this.me;
    this.t += dt; this.tw.update(dt);
    this.map.update(dt); me.update(dt); this.mom.update(dt); this.dog?.update(dt);
    const p = this.pos;
    for (const d of this.lures) {
      if (d.badge) { const s = W.toScreen(d.g.getWorldPosition(new THREE.Vector3()).setY(.7)); d.badge.style.left = s.x + 'px'; d.badge.style.top = s.y + 'px'; }
      if (d.on) { d.g.position.y = Math.abs(Math.sin(this.t * 14)) * .03 + (d.own ? 0 : d.g.position.y * 0); d.g.rotation.z = Math.sin(this.t * 22) * .05; if (Math.random() < dt * 2.2) { const s = W.toScreen(d.g.getWorldPosition(new THREE.Vector3()).setY(.15)); L.ui.floatText(s.x + (Math.random() - .5) * 40, s.y + 10, d.lullaby ? '자장~' : d.speaker ? '랄라~' : '삐-', 'gold'); } }
    }
    if (this.camHold) { this.paintVision(); return; }
    // the camera drifts a little toward 몽글이
    W.target.x += ((W.home.x + (p.x - W.home.x) * .3) - W.target.x) * (1 - Math.exp(-dt * 2));
    W.target.z += ((W.home.z + (p.y - W.home.z) * .3) - W.target.z) * (1 - Math.exp(-dt * 2));
    this.fridgeGlow.material.opacity = this.fridgeOpen * .55;
    if (this.tvGlow) this.tvGlow.material.opacity = .16 + Math.max(0, Math.sin(this.t * 7.3) * Math.sin(this.t * 2.1)) * .14;
    for (const [i, x] of this.snacks.entries()) { x.g.rotation.z = Math.sin(this.t * 9 + i) * (this.moving ? .12 : .03) * (i + 1); x.g.position.x = Math.sin(this.t * 9 + i) * (this.moving ? .02 : 0) * (i + 1); }
    this.goal.material.opacity = .35 + Math.sin(this.t * 4) * .25; this.goal.scale.setScalar(1 + Math.sin(this.t * 4) * .1);
    if (!this.started || this.result) { this.paintVision(); return; }
    this.stepMom(dt);
    // you: walk toward the finger (far = scurry), or the key direction
    const I = this.input();
    this.moving = false; this.scurry = false; this.noise = 0;
    let dir = I.dir || null, run = !!I.run;
    if (I.target) { const dx = I.target.x - p.x, dz = I.target.y - p.y, d = Math.hypot(dx, dz); if (d > .14) { dir = [dx / d, dz / d]; run = d > SCURRY_AT; } this.aim.position.set(I.target.x, .04, I.target.y); }
    this.aim.material.opacity = I.target ? .55 : 0;
    this.holdT = I.down ? (this.holdT || 0) + dt : 0;
    if (dir) {
      const carry = 1 - this.snacks.length * .1, v = (run ? SCURRY : SNEAK) * carry * Math.min(1, .35 + this.holdT * 3), st = v * dt;
      const ox = p.x, oz = p.y, [mx, mz] = dir;
      if (this.free(p.x + mx * st, p.y + mz * st)) { p.x += mx * st; p.y += mz * st; }
      else if (this.free(p.x + mx * st, p.y)) p.x += mx * st;
      else if (this.free(p.x, p.y + mz * st)) p.y += mz * st;
      if (Math.hypot(p.x - ox, p.y - oz) > st * .2) {
        this.moving = true; this.everMoved = true; this.scurry = run; this.noise = run ? 1 : 0; this.face = Math.atan2(mx, mz);
        me.lift = Math.abs(Math.sin(this.t * (run ? 16 : 9))) * (run ? .09 : .045);
        me.pose = run ? 'flail' : 'idle'; me.squash = Math.max(me.squash, run ? 0 : .06);
        if (run && Math.random() < dt * 8) L.audio.sfx('tap', 10 + Math.floor(Math.random() * 6));
      }
    }
    if (!this.moving) {
      me.lift *= .8;
      me.pose = this.seen() ? 'cover' : 'idle';
      me.squash = Math.max(me.squash, .22);
    }
    this.placeMe(dt);
    // at the fridge: the door opens with a tap (or after a moment's hold), and holding the open fridge takes snacks
    const nearFridge = this.atFridge() && this.snacks.length < 3;
    if (I.fridge && nearFridge && !this.moving) { this.fHold = (this.fHold || 0) + dt; if (!this.doorOpen && this.fHold > .35) this.setDoor(true); } else this.fHold = 0;
    if (this.doorOpen && p.distanceTo(this.fridgeAt) > 1.1) this.setDoor(false);   // walked off: it swings shut
    this.grabbing = nearFridge && this.doorOpen && I.fridge && I.down && !this.moving;
    this.stepFridge(dt);
    if (this.mode === 'doze') this.stepHear(dt);
    if (this.snacks.length && p.distanceTo(this.door) < .55) return this.win();
    this.goal.position.set(...(this.snacks.length ? [this.door.x, .03, this.door.y] : [this.fridgeAt.x, .03, this.fridgeAt.y]));
    // the dog wakes to a scurry nearby
    if (this.dog && !this.dog.awake && this.noise && Math.hypot(this.dog.root.position.x - p.x, this.dog.root.position.z - p.y) < 1.9) this.wakeDog();
    // a scurry close to mom makes her look at once
    if (this.noise && ['busy', 'patrol', 'pause'].includes(this.mState) && Math.hypot(p.x - this.eye.x, p.y - this.eye.z) < 3.2 && Math.random() < dt * 1.6) { L.say(this.me, '후다닥', 600); this.startHmm(true); }
    // suspicion: moving in her eyes fills it fast (a moment to freeze — she says "어?"), standing still in them slowly
    // (faster up close); an open fridge in her eyes glows
    const S = this.sight(), seen = this.seen(), lookin = this.mState === 'look' || this.mState === 'turn', fridgeLit = this.fridgeOpen > .3 && this.fridgeSeen();
    const r = Math.hypot(p.x - this.eye.x, p.y - this.eye.z);
    if (seen && (this.moving || this.grabbing)) this.sus += dt * 2.3 * S.k;
    else if (fridgeLit) this.sus += dt * 1.2;
    else if (seen) this.sus += dt * (.32 + .8 * (1 - r / S.range)) * S.k;
    else this.sus = Math.max(0, this.sus - dt * .4);
    if (this.sus > .3 && !this._eh) { this._eh = true; L.say(this.mom, '어?', 700, 'think'); L.audio.sfx('gasp'); }
    if (this.sus < .05) this._eh = false;
    if (this.pr && (this.pr.forgive || this.pr.easy)) this.sus = Math.min(this.sus, .9);   // the practice: a scare, not a loss
    this.susBar.style.width = Math.min(100, this.sus * 100) + '%';
    this.momIcon.classList.toggle('alert', this.mState === 'hmm' || lookin || seen);
    this.vig.style.opacity = this.mState === 'hmm' ? '.45' : seen ? String(.25 + this.sus * .5) : '0';
    if (seen && !this.moving && Math.random() < dt * 3) me.setFace('sweat');
    else if (!seen && me.face === 'sweat' && Math.random() < dt) me.setFace('normal');
    if (this.sus >= 1) return this.caught();
    // a heartbeat while you're in her eyes (or she's about to look and you're out in the open)
    if ((seen || (this.mState === 'hmm' && this.canSee(p.x, p.y, CROUCH_H, this.lookYaw, { half: this.lv.half * Math.PI / 180, range: this.lv.range }))) && (this._hb = (this._hb || 0) - dt) <= 0) { this._hb = .42 - Math.min(.2, this.sus * .2); L.audio.sfx(this._hbk = !this._hbk ? 'tick' : 'tock'); }
    // the ring under you: mint = hidden from the coming / current look, orange = in plain sight
    { const watch = this.mState === 'hmm' ? this.lookYaw : (lookin || AWAY.has(this.mState) || this.mode === 'patrol') ? this.momYaw : null, m = this.ring.material;
      const hid = watch == null ? !this.canSee(p.x, p.y, CROUCH_H) : !this.canSee(p.x, p.y, CROUCH_H, watch, this.mState === 'hmm' ? { half: this.lv.half * Math.PI / 180, range: this.lv.range } : S);
      const danger = watch != null || !hid;
      m.color.set(!danger ? '#ffffff' : hid ? '#7dffc4' : '#ff9a3c'); m.opacity = !danger ? .35 : .55 + Math.sin(this.t * 14) * .2;
      this.ring.scale.setScalar(danger && !hid ? 1.15 + Math.sin(this.t * 14) * .08 : 1); }
    this.paintVision();
    // the hint says what a press does right now
    const n = this.snacks.length, live = this.lures.some(d => !d.used);
    if (AWAY.has(this.mState) && this.mState !== 'sit') this.setHint(this.mState === 'check' ? '지금이야! 엄마가 딴 데 봐' : '엄마가 일어났어…');
    else if (nearFridge) this.setHint(this.mode === 'doze' && this.doorOpen && this.openT > 1.1 ? '오래 열어 두면 띠링! 톡 해서 닫기' : this.grabbing ? `꺼내는 중… ${n}/3` : !this.doorOpen ? '냉장고를 톡 하면 열려' : n ? '냉장고를 꾹 누르면 하나 더' : '열린 냉장고를 꾹 누르고 있으면 꺼내요');
    else if (this.mode === 'doze' && DOZING.has(this.mState)) this.setHint(this.scurry ? '후다닥! (다 들려)' : this._snoring ? (this.moving ? '드르렁~ 지금은 안 들려' : '드르렁~ 지금이야!') : this.moving ? '쉿… 발소리 들려' : !this.everMoved ? '가고 싶은 곳을 꾹 누르고 있기' : '코 골 때 움직이면 안 들려');
    else if (n) this.setHint(this.scurry ? '후다닥! (시끄러워)' : this.moving ? '방으로 살금살금…' : '방문으로 돌아가자');
    else this.setHint(this.scurry ? '후다닥! (시끄러워)' : this.moving ? '살금살금…' : !this.everMoved ? '가고 싶은 곳을 꾹 누르고 있기' : live ? `${this.lures.find(d => !d.used).name}를 톡 하면 엄마가 가요` : '멈춤 · 몸을 낮췄어');
    this.hint.classList.toggle('first', !this.everMoved);
    this.stepPractice(dt);
  }
  // 셋째 밤: what mom hears. Every noise fills the gauge (closer to her = louder); her snores and the lullaby cover
  // you; past .6 she stirs (a warning), full = she wakes and looks round
  stepHear(dt) {
    const Z = this.lv.doze, L = this.L, W = L.world, p = this.pos, mom = this.mom, asleep = DOZING.has(this.mState);
    this.snT += dt;
    const snoring = asleep && this.snT % Z.snore < Z.loud;
    if (snoring && !this._snoring) { this.msay('드르렁~', Z.loud * 1000 - 150, 'think'); mom.bump(.15); }
    this._snoring = snoring;
    if (this.lullT > 0 && (this.lullT -= dt) <= 0) { const d = this.lures.find(x => x.lullaby && x.on); if (d) this.stopGadget(d); }
    const lull = this.lullT > 0, mask = this.mask = (snoring ? .22 : 1) * (lull ? .35 : 1);
    const near = clamp(1.3 - Math.hypot(p.x - this.eye.x, p.y - this.eye.z) * .17, .4, 1);
    let add = 0;
    if (this.moving) add += dt * (this.scurry ? .9 : .3) * near;
    for (const c of this.creaks) {   // loose boards
      const on = Math.hypot(p.x - c.x, p.y - c.z) < .3;
      if (on && !c.on) { add += .3 * near; c.flash = 1; L.audio.sfx('drawer'); const s = W.toScreen(new THREE.Vector3(c.x, .25, c.z)); L.ui.floatText(s.x, s.y, '삐걱!', 'red'); L.log({ creak: [c.x, c.z], hear: +this.hear.toFixed(2) }); }
      c.on = on;
      if (c.flash > 0) { c.flash -= dt * 2.5; c.m.scale.setScalar(1 + Math.max(0, c.flash) * .3); }
    }
    // the fridge door left open too long: 띠링!
    if (this.doorOpen) {
      this.openT += dt;
      if (this.openT > Z.alarm && (this._beep = (this._beep || 0) - dt) <= 0) { this._beep = .7; add += .14; L.audio.sfx('pop', 14); const s = W.toScreen(this.fridgeTop || new THREE.Vector3(this.fridgeAt.x, 1.6, this.fridgeAt.y)); L.ui.floatText(s.x, s.y, '띠링!', 'gold'); }
    } else { this.openT = 0; this._beep = 0; }
    this.hear = clamp(this.hear + add * mask, 0, 1); const full = this.hear >= 1;
    this.hear = Math.max(0, this.hear - dt * (lull ? .2 : .06));
    if (asleep) {
      if (full) this.startHmm(true);
      else if (this.hear > .6 && !this._stirred) { this._stirred = true; this.mState = 'stir'; this.mT = 1; this.msay('음냐…', 1000, 'think'); mom.bump(.3); L.audio.sfx('hmm'); }
      if (this.hear < .4) this._stirred = false;
    }
    this.earBar.style.width = Math.min(100, this.hear * 100) + '%';
    this.ear.classList.toggle('quiet', snoring && !lull); this.ear.classList.toggle('lull', lull);
    this.ear.classList.toggle('hot', this.hear > .6);
  }
  fridgeSeen() {
    const S = this.sight(); if (!S.warm) return false;
    const e = this.eye, f = this.fridgeAt, dx = f.x - e.x, dz = f.y - e.z;
    if (Math.hypot(dx, dz) > S.range + 1) return false;
    return Math.abs(wrap(Math.atan2(dx, dz) - this.momYaw)) < S.half + 18 * Math.PI / 180 && sees(e, this.occ, f.x, f.y, 1.2);   // the light spills wider than you
  }
  fridgeLitBy(yaw) { const s = this.mState, y = this.momYaw; this.mState = 'look'; this.momYaw = yaw; const r = this.fridgeSeen(); this.mState = s; this.momYaw = y; return r; }
  stepFridge(dt) {
    const L = this.L, part = this.fridge?.f.parts[0];
    this.fridgeOpen += ((this.doorOpen ? 1 : 0) - this.fridgeOpen) * (1 - Math.exp(-dt * 9));
    part?.setOpen(this.fridgeOpen);
    // the gauge over the fridge: the door's hold, then each snack's
    const holding = this.atFridge() && this.snacks.length < 3 && this.touchFridge();
    const fill = this.grabbing ? this.grabT / .7 : !this.doorOpen && holding ? Math.min(1, (this.fHold || 0) / .35) : 0;
    this.grabG.style.display = holding || this.grabbing ? '' : 'none';
    if (this.grabG.style.display === '') { const s = L.world.toScreen(this.fridgeTop || new THREE.Vector3(this.fridgeAt.x, 1.6, this.fridgeAt.y)); this.grabG.style.left = s.x + 'px'; this.grabG.style.top = (s.y - 18) + 'px'; this.grabI.style.width = Math.round(Math.min(1, fill) * 100) + '%'; this.grabG.classList.toggle('open', this.doorOpen); }
    if (this.grabbing) {
      this.grabT += dt;
      if (this.grabT > .7) { this.grabT = 0; this.takeSnack(); }
      this.me.pose = 'push'; if (this.fridge) { const b = new THREE.Box3().setFromObject(this.fridge.f.group); this.face = Math.atan2((b.min.x + b.max.x) / 2 - this.pos.x, (b.min.z + b.max.z) / 2 - this.pos.y); }
    } else {
      this.grabT = 0;
    }
  }
  takeSnack() {
    const L = this.L, type = this.snackTypes[this.snacks.length], g = buildItem(type);
    const s = .55; g.scale.setScalar(s);
    // stacked on 몽글이's head, wobbling a little
    const y0 = this.me.headTop() + .02 + this.snacks.reduce((a, x) => a + ITEMS[x.type].h * s, 0);
    g.position.set(0, y0, 0); this.me.root.add(g);
    this.snacks.push({ type, g }); L.audio.sfx('pop', 3 + this.snacks.length * 2); this.me.bump(.3);
    this.slots[this.snacks.length - 1].classList.add('got');
    L.say(this.me, `${ITEMS[type].name}${this.snacks.length === 3 ? '까지' : ''}!`, 700);
    this.L.world.idsDirty = true;
  }
  wakeDog() {
    const L = this.L, dog = this.dog; dog.awake = true; this.zzz?.remove();
    dog.setFace('wow'); dog.bump(.5); L.say(dog, '멍! 멍!', 1100, 'red'); L.audio.sfx('gasp');
    setTimeout(() => !this.dead && dog.setFace('normal'), 1200);
    if (this.mode === 'doze') this.hear = Math.min(1, this.hear + .5); else this.startHmm(true);
  }

  // ── 첫째 밤, the first time: a step-by-step practice (user 10/18, having played it: "어케하는지 잘 모르겠어, 어느 타이밍에
  //    가야되는지"; GPT's order). One action at a time, over only when it's really done — never because time passed;
  //    stuck 8 s, the line says more and the spot rings. ① hold the floor ② the glowing spot behind furniture: 안전
  //    ③ her first look, slow: wait behind it ④ whenever you stand still in her eyes: "멈춰도 들켜요" (a scare the first
  //    time, not a loss) ⑤ at the fridge: tap it open ⑥ hold it: a snack ⑦ back to your door. Between them the trip goes
  //    cover to cover: on while she watches TV, wait behind furniture while she looks, off again right after she turns
  //    back. A finger shows each press, a glowing spot where to, a tag under 몽글이 whether she can see you.
  startPractice(from, delay) {
    const L = this.L, W = L.world, h = L.h;
    this.cover = this.coverStretches();
    const c0 = this.cover[0];
    this.prC1 = c0 && c0[1] < this.total - .3 ? Math.max(.6, c0[1] - .2) : Math.min(2, this.total / 3);   // the first cover's far edge
    const fb = this.fridge && new THREE.Box3().setFromObject(this.fridge.f.group);
    this.prFC = fb ? fb.getCenter(new THREE.Vector3()) : new THREE.Vector3(this.fridgeAt.x, 1, this.fridgeAt.y);
    this._pv = new THREE.Vector3();
    const mk = this.prMark = new THREE.Group();
    mk.add(new THREE.Mesh(new THREE.CircleGeometry(.3, 32), new THREE.MeshBasicMaterial({ color: '#fff3a6', transparent: true, opacity: .35, depthWrite: false })));
    mk.add(new THREE.Mesh(new THREE.RingGeometry(.3, .38, 32), new THREE.MeshBasicMaterial({ color: '#ffe36b', transparent: true, opacity: .85, depthWrite: false })));
    for (const m of mk.children) { m.rotation.x = -Math.PI / 2; m.renderOrder = 3; }
    mk.visible = false; W.root.add(mk); W.idsDirty = true;
    this.prTip = h('div', { class: 'tip ys-tip', style: 'display:none' });
    this.prHand = h('div', { class: 'hand hold', html: ICON.hand, style: 'display:none' });
    this.prTag = h('div', { class: 'ys-tag', style: 'display:none' });
    L.ui.tut.append(this.prTip, this.prHand); L.ui.wui.append(this.prTag);
    const basics = from !== 'go';
    this.pr = { step: basics ? 'press' : 'go', t0: this.t + delay, calm: basics, forgive: basics, easy: false, warned: false, looked: false,
      moved: 0, last: this.pos.clone(), key: null, stuck: 0, said: false, ringT: 0, stepT: this.t, backAt: -9, prev: this.mState };
    this.hint.style.display = 'none';
  }
  endPractice() {
    if (!this.pr) return;
    this.pr = null; this.slow = 0;
    for (const el of [this.prTip, this.prHand, this.prTag]) el?.remove();
    if (this.prMark) this.prMark.visible = false;
    this.hint.style.display = '';
  }
  // the stretches of the route she can't see from her seat ([s0, s1] along it)
  coverStretches() {
    const out = [], n = Math.ceil(this.total / .05); let a = null;
    for (let k = 0; k <= n; k++) {
      const s = Math.min(this.total, k * .05), hid = this.hiddenAt(s);
      if (hid && a == null) a = s;
      if (a != null && (!hid || k === n)) { const b = hid ? s : s - .05; if (b - a >= .25) out.push([a, b]); a = null; }
    }
    return out;
  }
  // where to stop next on the way (dir 1 = to the fridge, -1 = home): the far edge of the cover you're in, else the next
  // cover past the open floor (or the goal, if it's in there). edge: you're at the edge, gap: the open floor ahead
  nextStop(dir, s) {
    const C = this.cover, goal = dir > 0 ? this.total : 0, has = c => c[0] - .05 <= goal && goal <= c[1] + .05, edgeOf = c => dir > 0 ? c[1] - .2 : c[0] + .2;
    const cur = C.find(c => s >= c[0] - .05 && s <= c[1] + .05);
    if (cur && has(cur)) return { s: goal, edge: false, gap: 0 };
    if (cur && (edgeOf(cur) - s) * dir > .3) return { s: edgeOf(cur), edge: false, gap: 0 };
    const next = C.filter(c => dir > 0 ? c[0] > s : c[1] < s).sort((a, b) => dir * (a[0] - b[0]))[0];
    const gap = next ? (dir > 0 ? next[0] - s : s - next[1]) : Math.abs(goal - s);
    return { s: !next || has(next) ? goal : edgeOf(next), edge: !!cur, gap: Math.max(0, gap) };
  }
  nearCover(s) {
    let best = null, bd = 1e9;
    for (const [a, b] of this.cover) { const c = clamp(s, a + .15, Math.max(a + .15, b - .15)), d = Math.abs(c - s); if (d < bd) { bd = d; best = c; } }
    return best;
  }
  // a floor spot toward route position t, never more than 2 ahead (a finger farther than that is a noisy scurry)
  leadTo(s, t) { return this.at(Math.abs(t - s) > 2 ? s + Math.sign(t - s) * 2 : t); }
  // her first look round, slow: a long "흠…?", then she comes round slowly, straight at you, and looks a good while
  practiceLook() {
    this.pr.calm = false; this.startHmm();
    if (this.mState !== 'hmm') return;
    this.slow = 1; this.fakeOut = false; this.telDur = this.mT = 2.4; this.lookYaw = this.yawTo(this.pos.x, this.pos.y);
    this.msay('흠…?', 2300, 'think');
  }
  stepPractice(dt) {
    const P = this.pr; if (!P) return;
    if (this.L.bot) return this.endPractice();
    const L = this.L, W = L.world, p = this.pos, st = this.mState;
    P.moved += p.distanceTo(P.last); P.last.copy(p);
    if (this.t < P.t0) { P.moved = 0; return; }   // the gadget card first
    const looking = st === 'hmm' || st === 'turn' || st === 'look' || st === 'back' || st === 'sit', away = AWAY.has(st) && st !== 'sit';
    if (st === 'busy' && P.prev !== 'busy') P.backAt = this.t;
    P.prev = st;
    const coming = (st === 'hmm' || st === 'turn') && this.canSee(p.x, p.y, CROUCH_H, this.lookYaw, { half: this.lv.half * Math.PI / 180, range: this.lv.range });
    const exposed = this.seen() || coming, covered = !away && !exposed && this.hidAt(p.x, p.y);
    const s = this.sOf(p), dir = this.snacks.length ? -1 : 1;
    const step = n => { P.step = n; P.stepT = this.t; };
    // moving on: each step ends when it's done
    if (P.step === 'press' && P.moved >= .45) step('cover');
    if ((P.step === 'press' || P.step === 'cover') && covered && p.distanceTo(this.at(this.prC1)) < .45) {
      step('safe'); L.audio.sfx('special');
      const q = W.toScreen(this._pv.set(p.x, .3, p.y)); W.fx.ring(q.x, q.y, { r: 80, color: '#7dffc4', width: 8 });
    }
    if (P.step === 'safe' && this.t - P.stepT > 1.6 && covered && st === 'busy') { step('look'); this.practiceLook(); return; }
    if (P.step === 'look' && st !== 'busy') P.looked = true;
    if (P.step === 'look' && P.looked && st === 'busy') {
      this.mT = Math.max(this.mT, 6.5); P.forgive = false; P.backAt = this.t;
      L.say(this.me, DO.phew, 1500); L.log({ practice: 1 }); step('go');
    }
    if (this.snacks.length && ['go', 'open', 'grab'].includes(P.step)) step('home');
    if (P.step === 'go' && this.atFridge()) step('open');
    if (P.step === 'open' && !this.atFridge()) step('go');
    if (P.step === 'open' && this.doorOpen) step('grab');
    if (P.step === 'grab' && !this.doorOpen) step(this.atFridge() ? 'open' : 'go');
    // what to do right now: say, more (when stuck), where (a floor spot, or the fridge), how the finger goes, what kind
    let say, more = null, at = null, hand = null, cls = '', kind = 'wait';
    const fridge = 'fridge', toward = t => this.leadTo(s, t);
    if (P.step === 'press') { say = DO.press; more = DO.press2; at = toward(this.prC1); hand = 'hold'; kind = 'move'; }
    else if (P.step === 'cover') { say = DO.cover; more = DO.cover2; at = toward(this.prC1); hand = 'hold'; kind = 'move'; }
    else if (P.step === 'safe' && !exposed && (covered || away)) { say = DO.safe; cls = 'ok'; }
    else if (P.step === 'safe' && !exposed) { say = DO.back; more = DO.cover2; at = toward(this.prC1); hand = 'hold'; kind = 'move'; }
    // ④ in her eyes (or about to be): get behind furniture — standing still won't save you
    else if (exposed) {
      const c = this.nearCover(s); at = c != null ? this.at(c) : null; hand = 'hold'; cls = 'warn';
      if (this.moving) say = DO.hide; else { say = DO.still; if (!P.warned) { P.warned = true; P.easy = true; } }
    }
    // ③ she's looking round: wait behind the furniture (shut the fridge if its light shows)
    else if (looking) {
      if (this.doorOpen && this.fridgeLitBy(st === 'hmm' ? this.lookYaw : this.momYaw)) { say = DO.shut; at = fridge; hand = 'tap'; cls = 'warn'; kind = 'act'; }
      else say = DO.wait;
    }
    else if (P.step === 'open') { say = DO.open; more = DO.open2; at = fridge; hand = 'tap'; kind = 'act'; }
    else if (P.step === 'grab') { say = DO.grab; more = DO.grab2; at = fridge; hand = 'hold'; kind = 'act'; }
    else if (away) { say = DO.away; more = DO.cover2; at = toward(dir > 0 ? this.total : 0); hand = 'hold'; kind = 'move'; }
    else {
      // the trip, while she watches TV: cover to cover; at the edge of cover, go only with time to cross the open floor
      // (the bots' rule: her countdown and most of the "흠…?" against the time to the next cover)
      const n = this.nextStop(dir, s), v = SNEAK * (1 - this.snacks.length * .1), left = st === 'busy' ? this.mT + this.lv.tel * .8 : 9;
      const inCover = !n.edge && n.gap === 0 && n.s !== (dir > 0 ? this.total : 0);
      const ok = left >= (inCover ? Math.abs(n.s - s) + this.nextStop(dir, n.s).gap : n.gap) / v + .3;
      if (n.edge && !ok) say = DO.edge;
      else { say = ok && this.t - P.backAt < 3.5 ? DO.now : P.step === 'home' ? DO.home : DO.go; more = DO.cover2; at = toward(n.s); hand = 'hold'; kind = 'move'; }   // ("지금이야!" just after she turns back: that's the moment)
    }
    if (P.easy && !exposed && (covered || st === 'busy')) P.easy = false;   // (the scare lasts till you're hidden or her look is over)
    // the line (a new one pops in), stuck → more and a ring on the spot
    const tip = this.prTip;
    if (say !== P.key) {
      P.key = say; P.stuck = 0; P.said = false; P.ringT = this.t;
      tip.textContent = tr(say); tip.className = 'tip ys-tip ' + cls; tip.style.display = '';
      tip.style.animation = 'none'; void tip.offsetWidth; tip.style.animation = '';
      if (say === DO.now) L.audio.sfx('special'); else if (cls === 'warn') L.audio.sfx('pop', 6);
    }
    if ((kind === 'move' && this.moving) || kind === 'wait') P.stuck = 0; else P.stuck += dt;
    if (more && P.stuck > 8 && !P.said) { P.said = true; tip.textContent = tr(more); }
    const spot = at === fridge ? W.toScreen(this.prFC) : at ? W.toScreen(this._pv.set(at.x, 0, at.y)) : null;
    if (spot && P.stuck > 8 && this.t - P.ringT > 2) { P.ringT = this.t; W.fx.ring(spot.x, spot.y, { r: P.stuck > 16 ? 110 : 70, color: '#ffe14d', width: 7 }); }
    // the finger, the glowing spot on the floor
    const hd = this.prHand;
    if (hand && spot) { const c = 'hand ' + hand; if (hd.className !== c) hd.className = c; hd.style.display = ''; hd.style.left = spot.x + 'px'; hd.style.top = spot.y + 'px'; }
    else hd.style.display = 'none';
    const mk = this.prMark; mk.visible = !!at && at !== fridge;
    if (mk.visible) { mk.position.set(at.x, .045, at.y); mk.scale.setScalar(1 + Math.sin(this.t * 5) * .08); mk.children[0].material.opacity = .28 + Math.sin(this.t * 5) * .12; }
    // the tag under 몽글이: 보여요 in her eyes; 안전 behind furniture (from ② on), with the ring under you mint
    const tag = exposed ? 'seen' : covered && !['press', 'cover'].includes(P.step) ? 'safe' : null, tg = this.prTag;
    if (tag) {
      const q = W.toScreen(this._pv.set(p.x, 0, p.y)), tx = tag === 'seen' ? DO.seenTag : DO.safeTag;
      if (tg.dataset.k !== tag) { tg.dataset.k = tag; tg.textContent = tr(tx); tg.className = 'ys-tag' + (tag === 'seen' ? ' seen' : ''); }
      tg.style.display = ''; tg.style.left = q.x + 'px'; tg.style.top = q.y + 18 + 'px';
      if (tag === 'safe') { this.ring.material.color.set('#7dffc4'); this.ring.material.opacity = .6; }
    } else tg.style.display = 'none';
  }

  // ── end
  caught() {
    if (this.result) return;
    const L = this.L, me = this.me, mom = this.mom; this.result = 'fail'; this._up({}); this.endPractice();
    L.audio.sfx('angry'); L.world.fx.ring(innerWidth / 2, innerHeight / 2, { r: 120, color: '#ff5d6c', width: 10, life: .5 });
    mom.setFace('angry'); mom.bump(.5); me.setFace('wow'); me.pose = 'flail';
    const p = this.pos; mom.root.rotation.y = this.yawTo(p.x, p.y); this.momYaw = mom.root.rotation.y;
    L.say(mom, this.lv.caughtLine || '몽글아!!!', 1800, 'red'); mom.pose = 'point';
    L.world.flyTo(this.tw, { target: new THREE.Vector3(p.x * .6 + mom.root.position.x * .4, .5, p.y * .6 + mom.root.position.z * .4), zoom: 1.7, dur: .45 });
    this.camHold = true;
    const n = this.snacks.length;
    L.log({ result: 'fail', lv: this.lvIdx + 1, snacks: n, x: +p.x.toFixed(2), z: +p.y.toFixed(2), mom: this.mState });
    this.vig.style.opacity = '.7';
    setTimeout(() => {
      if (this.dead) return;
      const h = L.h;
      L.ui.panel({ title: '들켰다!', color: 'red', body: [h('div', { class: 'ys-endface' }, h('img', { src: L.thumbs[`face_${this.gk}_angry`] })),
        h('div', { class: 'txt' }, this.fridgeOpen > .3 ? (/fridge/.test(this.fridge?.type || '') ? '"냉장고 불빛 다 보여!"' : '"뭐 꺼내는 거야?"') : n ? '"그거 내려놔!"' : '"이 시간에 어디 가?"')],
        buttons: [this.againBtn = L.ui.btn('다시 하기', { color: 'orange', cls: 'big', onClick: () => L.go({ lv: this.lvIdx }) })] });
    }, 1300);
  }
  win() {
    if (this.result) return;
    const L = this.L, n = this.snacks.length; this.result = 'win'; this._up({});
    if (this.pr) { L.log({ practice: 2 }); this.endPractice(); }
    L.audio.sfx('win'); this.me.setFace('happy'); this.me.pose = 'cheer'; L.world.fx.confetti(90);
    L.say(this.me, '냠냠… 성공!', 1500);
    L.log({ result: 'win', lv: this.lvIdx + 1, snacks: n, stars: n, max: 3 });   // (stars: the snacks you brought back; the campaign's reward reads them)
    setTimeout(() => {
      if (this.dead) return;
      const h = L.h, last = this.lvIdx >= this.levelCount - 1;
      L.ui.panel({ title: '야식 성공!', color: 'green', body: [
        h('div', { class: 'ys-endslots' }, ...this.snackTypes.map((t, i) => h('div', { class: 'ys-slot big' + (i < n ? ' got' : '') }, h('img', { src: L.thumbs['item_' + t] })))),
        h('div', { class: 'txt' }, n >= 3 ? '세 개 다! 완벽한 밤이야' : n === 2 ? '두 개! 하나만 더 욕심내 볼까?' : '하나 성공! 더 챙길 수 있었는데…')],
        buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
          this.nextBtn = L.ui.btn(this.lv.nextLabel ? this.lv.nextLabel(last) : last ? '처음 밤부터' : '다음 밤', { color: 'green', cls: 'big', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) })] });
    }, 1200);
  }
  exit() {
    this.grabG?.remove();
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.dataset.night = '';
    app.removeEventListener('pointerdown', this._down); removeEventListener('pointermove', this._move); removeEventListener('pointerup', this._up); removeEventListener('pointercancel', this._up);
    removeEventListener('blur', this._blur); removeEventListener('keydown', this._kd); removeEventListener('keyup', this._ku);
    for (const o of [this.map.group, this.me.root, this.mom.root, this.dog?.root, this.vmesh, this.fridgeGlow, this.ring, this.aim, this.goal, this.tvGlow, this.moon, this.prMark, ...(this.creaks || []).map(c => c.m), ...this.lures.filter(d => d.own).map(d => d.g)].filter(Boolean)) { W.root.remove(o); disposeTree(o); }
    for (const d of this.lures) d.badge?.remove();
    for (const el of [this.prTip, this.prHand, this.prTag]) el?.remove();
    this.vig?.remove(); this.vtex?.dispose(); W.camLock = false;
  }

  // ── bots (QA) press the floor the way a finger would. smart: sets the first gadget off from the door and sneaks
  // while mom is away, otherwise goes while she's busy and the next cover is in reach and stops in cover at "흠";
  // grabs two. random: random presses and stops, now and then a random gadget.
  botGo(tx, tz) { this.botDown = true; this.botFridge = false; this.botTarget = new THREE.Vector2(tx, tz); }
  botStop(down = false) { this.botDown = down; this.botFridge = false; this.botTarget = down ? this.pos.clone() : null; }
  botStep(dt, mode) {
    if (this.result) { this.botStop(); this._endT = (this._endT || 0) + dt; if (this._endT > 1.6 && this.L.ui.panelOpen) { this._endT = 0; (this.result === 'win' ? this.nextBtn : this.againBtn)?.press(); } return; }
    if (!this.started) return;
    if (mode === 'random') {
      this._rt = (this._rt || 0) - dt;
      if (this._rt <= 0) {
        this._rt = .2 + Math.random() * 1.2;
        if (Math.random() < .08) { const d = this.lures.find(x => !x.used); if (d) this.fireLure(d); }
        const B = this.B; if (Math.random() < .4) this.botStop(Math.random() < .5); else this.botGo(B.x0 + Math.random() * (B.x1 - B.x0), B.z0 + Math.random() * (B.z1 - B.z0));
      }
      return;
    }
    if (this.mode === 'patrol') return this.botPatrol();
    if (this.mode === 'doze') return this.botDoze();
    const back = this.snacks.length > 0, dir = back ? -1 : 1, s = this.sOf(this.pos), st = this.mState;
    const danger = st === 'hmm' || st === 'turn' || st === 'look', away = st === 'check' || (st === 'walk' && this.lure?.path.length < 3);
    const v = SNEAK * (1 - this.snacks.length * .1);
    const go = () => { const t = this.at(s + dir * .45); this.botGo(t.x, t.y); };
    // the gadget: set it off from the door while she's settled, then wait for her to get there
    const d = this.lures.find(x => !x.used && x.bot !== false);
    if (d && !back && s < .4 && st === 'busy') { this.fireLure(d); this.botStop(); return; }
    if ((st === 'rise' || (st === 'walk' && !away)) && this.hiddenAt(s)) { this.botStop(); return; }
    if (this.pos.distanceTo(this.fridgeAt) < .5 && this.snacks.length < 2) {
      const lit = this.fridgeLitBy(this.yawTo(this.fridgeAt.x, this.fridgeAt.y)), more = !danger && (away || !lit || (st === 'busy' && this.mT > 1.0));
      if (more) { this.botStop(true); this.botFridge = true; if (!this.doorOpen) this.setDoor(true); return; }   // open it and hold = grab
      if (this.doorOpen) this.setDoor(false);
      if (this.fridgeOpen > .15 || !this.snacks.length) { this.botStop(); return; }   // let it shut / wait for a safe moment
    }
    if (!danger) {
      if (away && st === 'check') { go(); return; }
      // don't start a stretch in the open you can't finish before she's due to look
      let ss = s, ok = false, left = st === 'busy' ? this.mT + this.lv.tel * .8 : 9, out = !this.hiddenAt(ss);
      for (let k = 1; k < 60; k++) { ss += dir * v * .1; if (ss <= 0 || ss >= this.total) { ok = (k * .1) < left || !out && k < 3; break; }
        const hid = this.hiddenAt(ss); if (!hid) out = true; else if (out) { ok = (k * .1) < left; break; } else if (k > 2) { ok = true; break; } }
      if (ok) go(); else this.botStop();
      return;
    }
    if (st === 'hmm') {
      if (this.hiddenAt(s) || !this.canSee(this.pos.x, this.pos.y, CROUCH_H, this.lookYaw, { half: this.lv.half * Math.PI / 180, range: this.lv.range })) { this.botStop(); return; }
      let ss = s, reach = false; for (let k = 0; k < 12; k++) { ss += dir * v * .06; if (this.hiddenAt(ss)) { reach = k * .06 < this.mT + .2; break; } }
      if (reach) go(); else this.botStop();
      return;
    }
    this.botStop();
  }
  // 둘째 밤 bot: moves only where her eyes are not — now, and once she turns at her next point; sets the speaker off
  // when she's heading that way anyway; grabs while her back is turned
  botPatrol() {
    const st = this.mState, back = this.snacks.length > 0, dir = back ? -1 : 1, s = this.sOf(this.pos), P = this.lv.patrol;
    const D = Math.PI / 180, S = { half: this.lv.half * D + .25, range: this.lv.range + .4 }, mp = this.mom.root.position;
    const next = P.pts[this.wi], toNext = Math.hypot(next[0] - mp.x, next[1] - mp.z);
    const yaws = [this.momYaw];
    if (st === 'pause' || (st === 'patrol' && toNext < 1.3)) { const n2 = P.pts[(this.wi + (st === 'pause' ? 0 : 1)) % P.pts.length]; yaws.push(Math.atan2(n2[0] - (st === 'pause' ? mp.x : next[0]), n2[1] - (st === 'pause' ? mp.z : next[1])), this.momYaw + .85, this.momYaw - .85); }
    if (st === 'hmm') yaws.push(this.lookYaw);
    const safe = q => !yaws.some(y => this.canSee(q.x, q.y, BODY_H, y, S));
    const go = () => { const t = this.at(s + dir * .45); this.botGo(t.x, t.y); };
    const d = this.lures.find(x => !x.used);
    if (d && !back && s > 3 && this.wi === 0 && st === 'patrol' && mp.x > .6) { this.fireLure(d); this.botStop(); return; }
    if (this.pos.distanceTo(this.fridgeAt) < .5 && this.snacks.length < 2) {
      const ok = st === 'check' || (AWAY.has(st) && st !== 'walkback') || (this.wi === 0 && st === 'patrol' && mp.x > -.2);
      if (ok && !this.fridgeLitBy(this.momYaw)) { this.botStop(true); this.botFridge = true; if (!this.doorOpen) this.setDoor(true); return; }
      if (this.doorOpen) this.setDoor(false);
      this.botStop(); return;
    }
    if (st === 'check') { go(); return; }
    const ahead = this.at(s + dir * .55), here = this.pos;
    if (safe(ahead) && safe(here)) { go(); return; }
    // caught out in the open: keep going if the next spot is safe, else hold still
    if (!safe(here) && safe(ahead)) { go(); return; }
    this.botStop();
  }
  // 셋째 밤 bot: moves while she snores (or the lullaby plays) or while the gauge is low; freezes while she's awake;
  // the lullaby at the fridge; two snacks before the door alarm
  botDoze() {
    const st = this.mState, back = this.snacks.length > 0, dir = back ? -1 : 1, s = this.sOf(this.pos), Z = this.lv.doze;
    const go = () => { const t = this.at(s + dir * .45); this.botGo(t.x, t.y); };
    if (!DOZING.has(st)) { if (this.doorOpen) this.setDoor(false); this.botStop(); return; }
    const quiet = this._snoring || this.lullT > 0 || this.hear < .28;
    const d = this.lures.find(x => !x.used);
    if (this.pos.distanceTo(this.fridgeAt) < .5 && this.snacks.length < 2) {
      if (d && !back) this.fireLure(d);
      if (this.openT > Z.alarm - .25) { this.setDoor(false); this.botStop(); return; }
      if (this.hear < .7) { this.botStop(true); this.botFridge = true; if (!this.doorOpen) this.setDoor(true); return; }
      if (this.doorOpen) this.setDoor(false);
      this.botStop(); return;
    }
    if (this.doorOpen && back) this.setDoor(false);
    if (quiet && this.hear < .55) go(); else this.botStop();
  }
  state() { return { scene: 'yasik', lv: this.lvIdx + 1, mom: this.mState, x: +this.pos.x.toFixed(2), z: +this.pos.y.toFixed(2), sus: +this.sus.toFixed(2), snacks: this.snacks.length, lures: this.lures.filter(d => d.used).length, mode: this.mode, hear: +(this.hear || 0).toFixed(2), result: this.result || null, pr: this.pr?.step || null, tip: this.pr?.key || null }; }
  get api() { return { win: () => this.win(), caught: () => this.caught(), look: () => this.startHmm(true), lure: i => this.fireLure(this.lures[i || 0]), noise: v => { this.hear = v; } }; }
}

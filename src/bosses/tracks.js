// 발자국 따라 찾기 — a 45-second 쉬어가기 (10/19, picked by this lab for "새 미니게임 하나 더 … 짧고, 한 손가락, 숨바꼭질·찾기
// 코어와 이어지는 것"). It snowed in the night: 몽글이 counted to ten, and every friend left its own footprints on the way to its
// hiding place — 토순이 hops (two long feet side by side), 판다 has big round paws, 햄찌 tiny dots, 펭펭이 webbed feet, 보드킹
// two wheel lines, 다람이 drags its tail… The card says who to find, with that friend's print; follow the prints to the
// hiding place and tap it ("들켰다~!"). 너굴이 hid too (his prints are little hands): tapping his spot = "메롱~".
//   lv 0 첫눈 캠핑장     three friends, gentle trails (the campaign has it after stage 57, in 6장 산길·캠핑)
//   lv 1 엉킨 발자국     four friends, the trails wind round and cross
//   lv 2 눈이 펑펑       four friends, and the snow keeps falling: the prints fade from the start, so read them fast
import * as THREE from 'three';
import { Room } from '../room.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { makeFurniture } from '../gfx/furniture.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree, sph, cyl, put, tor } from '../gfx/kit.js';

const SNOWY = { ambColor: '#eef4ff', amb: 1.6, sunColor: '#ffffff', sun: 2.2 };
// who leaves which print (never two of one kind in a round)
const PRINTS = { bunny: 'hop', panda: 'big', hamster: 'tiny', shiba: 'paw', cheese: 'cat', peng: 'web', frog: 'frog', skater: 'skate', squirrel: 'tail', raccoon: 'hand' };
const FRIENDS = ['bunny', 'panda', 'hamster', 'shiba', 'cheese', 'peng', 'frog', 'skater', 'squirrel'];
const FOUND = { bunny: '들켰다~!', panda: '…벌써?', hamster: '볼 빵빵~ 들켰다!', shiba: '멍! 들켰당', cheese: '냥~ 들켰다', peng: '펭! 들켰다', frog: '개굴! 찾았네?', skater: '보드 자국 봤구나?', squirrel: '꼬리 자국 때문에…' };
const SPOT_TYPES = ['bush', 'tentsmall', 'snowman', 'boxstack', 'pine', 'snowman', 'bush', 'cooler'];
// where hiding places can stand (x, z): the upper part of the yard; 몽글이 counts at the front
const ANCHORS = [[-2.5, -3.1], [0, -3.4], [2.5, -3.1], [-2.9, -1.2], [-.9, -1.5], [1.1, -1.6], [2.9, -1.0], [-1.9, .5], [.2, .2], [2.1, .6]];
const START = [0, 3.0];
const LEVELS = [
  { name: '첫눈 캠핑장', time: 45, n: 3, ask: 2, bend: 1.0, fade: 0, stars: [6, 11, 16], theme: 'camp1', spots: ['tentsmall', 'pine', 'snowman', 'rockpile', 'cooler', 'pine', 'tentsmall', 'firewood'] },
  { name: '엉킨 발자국', time: 45, n: 4, ask: 3, bend: 2.4, fade: 0, stars: [6, 11, 16], card: 'raccoon' },
  { name: '눈이 펑펑', time: 45, n: 4, ask: 3, bend: 2.0, fade: 10, stars: [6, 11, 16], card: 'snow' },
];
// the snow canvas covers this much of the yard (world units), at PX pixels a unit
const GX = [-3.9, 3.9], GZ = [-4.6, 4.0], PX = 90;
const PS = 1.55;   // prints drawn this much bigger than life, so they read on a phone

// ── prints, drawn on the snow canvas: (x, y) in px, a = heading (canvas angle, 0 = +x), s = px per unit
function ell(c, x, y, rx, ry, a) { c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); c.fill(); }
function rot(x, y, a, dx, dy) { return [x + dx * Math.cos(a) - dy * Math.sin(a), y + dx * Math.sin(a) + dy * Math.cos(a)]; }
// a paw: the pad, then toes in an arc ahead of it
function paw(c, x, y, a, s, r, toes = 4, spread = 1) {
  ell(c, x, y, r * s * .9, r * s, a + Math.PI / 2);
  for (let k = 0; k < toes; k++) { const t = (k / (toes - 1) - .5) * 1.5 * spread; const [tx, ty] = rot(x, y, a, r * s * 1.45 * Math.cos(t), r * s * 1.45 * Math.sin(t)); ell(c, tx, ty, r * s * .36, r * s * .3, a + t); }
}
const STRIDE = { hop: .5, big: .42, tiny: .16, paw: .3, cat: .26, web: .3, frog: .55, skate: .08, tail: .26, hand: .28 };
// one print of kind k at the i-th step (side = ±1 alternates)
function stamp(c, k, x, y, a, s, side) {
  const o = (d, w) => rot(x, y, a, d, w * side);
  switch (k) {
    case 'hop': { // bunny: long hind feet side by side, small front feet just behind them
      for (const w of [-1, 1]) { const [px, py] = rot(x, y, a, 0, w * .08 * s); ell(c, px, py, .13 * s, .045 * s, a); }
      const [fx, fy] = rot(x, y, a, -.2 * s, .025 * s); ell(c, fx, fy, .04 * s, .035 * s, a); const [gx, gy] = rot(x, y, a, -.29 * s, -.02 * s); ell(c, gx, gy, .04 * s, .035 * s, a); break; }
    case 'big': { const [px, py] = o(0, .12 * s); paw(c, px, py, a, s, .11, 4); break; }
    case 'tiny': { const [px, py] = o(0, .05 * s); paw(c, px, py, a, s, .028, 4); break; }
    case 'paw': { const [px, py] = o(0, .09 * s); paw(c, px, py, a, s, .062, 4); break; }
    case 'cat': { const [px, py] = o(0, .022 * s); paw(c, px, py, a, s, .05, 4, .8); break; }   // cats step on one line
    case 'web': { const [px, py] = o(0, .11 * s), b = a + side * .35;   // 펭펭이 waddles, toes out
      c.beginPath(); const [t1x, t1y] = rot(px, py, b, .12 * s, -.07 * s), [t2x, t2y] = rot(px, py, b, .14 * s, 0), [t3x, t3y] = rot(px, py, b, .12 * s, .07 * s);
      c.moveTo(px, py); c.lineTo(t1x, t1y); c.lineTo(t2x, t2y); c.lineTo(t3x, t3y); c.closePath(); c.fill(); break; }
    case 'frog': { // two star feet side by side, long thin toes
      for (const w of [-1, 1]) { const [px, py] = rot(x, y, a, 0, w * .1 * s); ell(c, px, py, .035 * s, .03 * s, a);
        for (const t of [-.9, -.3, .3, .9]) { const [tx, ty] = rot(px, py, a + t, .085 * s, 0); c.lineWidth = .022 * s; c.beginPath(); c.moveTo(px, py); c.lineTo(tx, ty); c.stroke(); ell(c, tx, ty, .022 * s, .022 * s, 0); } } break; }
    case 'tail': { const [px, py] = o(0, .05 * s); paw(c, px, py, a, s, .035, 4); break; }   // + the tail line (drawn with the trail)
    case 'hand': { const [px, py] = o(0, .08 * s); ell(c, px, py, .05 * s, .055 * s, a);   // 너굴이: five little fingers
      for (let k = 0; k < 5; k++) { const t = (k / 4 - .5) * 1.9, [tx, ty] = rot(px, py, a + t, .085 * s, 0); ell(c, tx, ty, .018 * s, .03 * s, a + t); } break; }
  }
}
// the card icon of a print (a little square of snow with two steps on it)
function printIcon(k) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 96; const c = cv.getContext('2d');
  c.fillStyle = '#f7fbff'; c.beginPath(); c.roundRect(2, 2, 92, 92, 18); c.fill();
  c.fillStyle = c.strokeStyle = '#5f7fb6'; c.lineCap = 'round';
  const s = k === 'tiny' ? 300 : k === 'hop' || k === 'frog' ? 140 : k === 'big' ? 125 : k === 'cat' ? 200 : 180, a = -Math.PI / 2;
  if (k === 'skate') { c.lineWidth = 6; for (const w of [-14, 14]) { c.beginPath(); c.moveTo(48 + w, 86); c.bezierCurveTo(48 + w + 10, 60, 48 + w - 10, 34, 48 + w, 10); c.stroke(); } }
  else {
    const steps = k === 'hop' || k === 'frog' ? [[48, 66, 1]] : [[48, 70, 1], [48, 30, -1]];
    if (k === 'hop' || k === 'frog') steps[0][1] = 56;
    for (const [x, y, sd] of steps) stamp(c, k, x, y, a, s, sd);
    if (k === 'tail') { c.lineWidth = 5; c.beginPath(); c.moveTo(48, 92); c.bezierCurveTo(30, 70, 66, 40, 48, 6); c.stroke(); }
  }
  return cv.toDataURL();
}

const CSS = `
#app.fp { background: radial-gradient(120% 80% at 50% 25%, #ffffff 0%, #e6f0ff 52%, #cfdcf5 100%); }
.fp-clock { margin-left: auto; position: relative; width: 116px; height: 30px; border-radius: 999px; background: rgba(42, 26, 61, .55); border: 2.5px solid #3a2453; overflow: hidden; pointer-events: none; }
.fp-clock i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: linear-gradient(90deg, #9fd8ff, #5aa9e6); transition: width .2s linear; }
.fp-clock b { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: 17px; }
.fp-clock.hurry i { background: linear-gradient(90deg, #ff9aa8, #ff4f66); animation: fpHurry .5s ease-in-out infinite; }
@keyframes fpHurry { 50% { filter: brightness(1.25); } }
.fp-head { position: absolute; left: 50%; top: calc(64px + var(--safeT, 0px)); transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 4px; pointer-events: none; }
.fp-score { font-family: var(--font-display); font-size: 42px; line-height: 1; color: #fff; }
.fp-score.pop { animation: fpPop .25s cubic-bezier(.2, 1.8, .4, 1); }
@keyframes fpPop { from { transform: scale(1.35); } to { transform: scale(1); } }
.fp-bar { position: relative; width: 200px; height: 12px; border-radius: 999px; background: rgba(42, 26, 61, .35); border: 2px solid #3a2453; }
.fp-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; border-radius: 999px; background: linear-gradient(90deg, #ffe16b, #ffb300); transition: width .25s cubic-bezier(.16, 1, .3, 1); }
.fp-mark { position: absolute; top: 12px; transform: translateX(-50%); font-size: 11px; color: #d99a0b; text-shadow: 0 1px 0 #fff; white-space: nowrap; }
.fp-ask { position: absolute; left: 50%; bottom: calc(22px + var(--safeB, 0px)); transform: translateX(-50%); display: flex; align-items: center; gap: 10px; background: #fffaf2; border: 4px solid #3a2453;
  border-radius: 22px; padding: 8px 14px 8px 8px; box-shadow: 0 5px 0 #3a2453; color: #3a2453; pointer-events: none; white-space: nowrap; transition: transform .25s cubic-bezier(.2, 1.6, .4, 1), opacity .2s; }
.fp-ask.out { transform: translate(-50%, 30px); opacity: 0; }
.fp-ask img.face { width: 58px; height: 58px; }
.fp-ask img.print { width: 52px; height: 52px; border-radius: 12px; border: 2.5px solid #3a2453; }
.fp-ask b { font-size: 19px; }
.fp-ask small { display: block; font-size: 13px; color: #6d6080; }
.fp-get { position: absolute; left: 50%; top: 30%; transform: translate(-50%, -50%); z-index: 30; pointer-events: none; display: flex; align-items: center; gap: 10px; background: #fffaf2; border: 4px solid #3a2453;
  border-radius: 20px; padding: 10px 16px; box-shadow: 0 6px 0 #3a2453; color: #3a2453; animation: fpGet .45s cubic-bezier(.2, 1.7, .4, 1); width: max-content; max-width: 88vw; }
.fp-get img { width: 60px; height: 60px; }
.fp-get-t { font-family: var(--font-display); color: #ffcf3c; font-size: 22px; }
.fp-get-s { font-size: 14px; word-break: keep-all; }
.fp-get.out { opacity: 0; transition: opacity .35s; }
@keyframes fpGet { from { transform: translate(-50%, -50%) scale(.6); } to { transform: translate(-50%, -50%) scale(1); } }
.fp-snow { position: absolute; inset: 0; pointer-events: none; z-index: 4; opacity: 0; transition: opacity .6s;
  background-image: radial-gradient(3px 3px at 20% 30%, #fff 60%, transparent 61%), radial-gradient(2px 2px at 70% 10%, #fff 60%, transparent 61%), radial-gradient(3px 3px at 45% 70%, #fff 60%, transparent 61%), radial-gradient(2px 2px at 85% 55%, #fff 60%, transparent 61%), radial-gradient(2.5px 2.5px at 10% 85%, #fff 60%, transparent 61%);
  background-size: 160px 200px; animation: fpFall 4s linear infinite; }
.fp-snow.on { opacity: .9; }
@keyframes fpFall { from { background-position: 0 0, 20px 0, 40px 0, 60px 0, 80px 0; } to { background-position: 30px 200px, 0 200px, 60px 200px, 40px 200px, 100px 200px; } }
.fp-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; z-index: 6; transition: opacity .35s; }
.fp-flash.on { opacity: 1; }
.fp-stars { display: flex; justify-content: center; gap: 6px; font-size: 40px; color: #d8cfe4; margin-bottom: 4px; }
.fp-stars .on { color: #ffd23f; text-shadow: 0 3px 0 #d99a0b; }
`;

// a snowman (a hiding place of its own): three snowballs, coal eyes, a carrot and a red scarf
function makeSnowman() {
  const g = new THREE.Group();
  g.add(put(sph(.44, '#ffffff'), 0, .4, 0)); g.add(put(sph(.32, '#ffffff'), 0, .98, 0)); g.add(put(sph(.22, '#ffffff'), 0, 1.42, 0));
  for (const x of [-.08, .08]) g.add(put(sph(.032, '#2f2a36'), x, 1.47, .19));
  g.add(put(cyl(0, .045, .2, '#ff8a3c'), 0, 1.41, .29, Math.PI / 2, 0, 0));
  g.add(put(tor(.25, .06, '#ff5d6c'), 0, 1.22, 0, Math.PI / 2, 0, 0));
  for (const y of [.88, 1.06]) g.add(put(sph(.03, '#2f2a36'), 0, y, .31));
  return g;
}

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.objs = []; this.round = []; }
  add(o, round) { this.L.world.root.add(o); (round ? this.round : this.objs).push(o); return o; }
  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx];
    if (!document.getElementById('fp-css')) { const s = document.createElement('style'); s.id = 'fp-css'; s.textContent = CSS; document.head.append(s); }
    const app = document.getElementById('app'); app.dataset.night = ''; app.classList.add('fp');
    L.setBg(['#f4f8ff', '#dfe9fb']); W.setLight(SNOWY);
    // the yard: a park with the snow lying over it (one canvas: the snow and every footprint)
    const T = this.theme = THEMES[LV.theme] || THEMES.park1;
    const layout = { w: 9, d: 10, theme: T, bleed: {}, walls: { N: LV.theme ? 'none' : 'fence', W: 'none', S: 'none', E: 'none' }, furniture: [] };
    const room = this.room = new Room(W, layout); this.add(room.group);
    const cv = this.cv = document.createElement('canvas'); cv.width = Math.round((GX[1] - GX[0]) * PX); cv.height = Math.round((GZ[1] - GZ[0]) * PX);
    this.ctx = cv.getContext('2d');
    const tex = this.tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const snow = new THREE.Mesh(new THREE.PlaneGeometry(GX[1] - GX[0], GZ[1] - GZ[0]), new THREE.MeshBasicMaterial({ map: tex }));
    snow.rotation.x = -Math.PI / 2; snow.position.set((GX[0] + GX[1]) / 2, .021, (GZ[0] + GZ[1]) / 2); this.add(snow);
    this.base = this.snowBase();
    // 몽글이 at the front, where it counted
    const me = this.me = new Char('mong'); me.root.position.set(START[0], 0, START[1] + .55); me.root.scale.setScalar(1.25); this.add(me.root);
    me.faceTo(0, -5);
    this.frame();
    this.icons = {}; for (const k of new Set(Object.values(PRINTS))) this.icons[k] = printIcon(k);
    L.makeThumbs({ faces: [...FRIENDS.map(k => [k, 'normal']), ['raccoon', 'happy']] });
    this.score = 0; this.combo = 0; this.best = 0; this.found = 0; this.wrong = 0; this.left = LV.time; this.result = null; this.phase = 'intro'; this.rounds = 0;
    this.buildHud();
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    me.pose = 'cover'; for (const n of ['여덟', '아홉', '열!']) { if (this.dead) return; L.say(me, n, 520, 'count'); L.audio.sfx('tick'); await this.tw.wait(.5); }
    if (this.dead) return;
    me.pose = 'point'; me.setFace('happy'); L.say(me, '발자국 따라 찾는다~!', 1000); L.audio.sfx('special');
    await this.newRound(true); if (this.dead) return;
    this.phase = 'play';
    if (LV.card) this.gotCard(LV.card);
  }
  frame() {
    const W = this.L.world;
    W.home.set(0, .3, -.2); W.target.copy(W.home); W.yaw = 0; W.pitch = .88; W.zoom = 1;   // nearly over the snow, so the prints read
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(7.7, 8.2, .5);
  }
  // the snow: white with a soft blue grain, a little sparkle
  snowBase() {
    const c = this.ctx, w = this.cv.width, h = this.cv.height;
    c.fillStyle = '#f7fbff'; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 900; k++) { c.fillStyle = Math.random() < .7 ? 'rgba(170,195,230,.10)' : 'rgba(255,255,255,.9)'; const r = 1 + Math.random() * 3; c.beginPath(); c.arc(Math.random() * w, Math.random() * h, r, 0, 7); c.fill(); }
    // the soft edge where the snow meets the grass
    const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .42, w / 2, h / 2, Math.max(w, h) * .62); g.addColorStop(0, 'rgba(247,251,255,0)'); g.addColorStop(1, 'rgba(210,228,250,.7)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    return c.getImageData(0, 0, w, h);
  }
  toPx(x, z) { return [(x - GX[0]) * PX, (z - GZ[0]) * PX]; }
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col(), LV = this.lv;
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, '발자국 따라 찾기', h('small', {}, LV.name)));
    this.clock = h('div', { class: 'fp-clock' }, this.clockI = h('i'), this.clockN = h('b', { class: 'ol' }, String(LV.time)));
    top.append(this.clock); col.append(top);
    const max = this.barMax = LV.stars[2] * 1.15;
    this.scoreEl = h('div', { class: 'fp-score ol' }, '0');
    this.bar = h('div', { class: 'fp-bar' }, this.barI = h('i'), ...LV.stars.map((s, k) => h('span', { class: 'fp-mark', style: `left:${s / max * 100}%` }, '★'.repeat(k + 1))));
    col.append(h('div', { class: 'fp-head' }, this.scoreEl, this.bar));
    this.ask = h('div', { class: 'fp-ask out' }, this.askFace = h('img', { class: 'face', alt: '' }), h('div', {}, this.askT = h('b', {}, ''), h('small', {}, '이 발자국을 따라가!')), this.askPrint = h('img', { class: 'print', alt: '' }));
    col.append(this.ask);
    const app = document.getElementById('app');
    this.snowEl = h('div', { class: 'fp-snow' }); app.append(this.snowEl);
    this.flashEl = h('div', { class: 'fp-flash' }); app.append(this.flashEl);
  }
  gotCard(kind) {
    const L = this.L, h = L.h;
    const [img, s1, s2] = kind === 'raccoon' ? [L.thumbs.face_raccoon_happy, '너굴이도 숨었다!', '작은 손 자국 끝은 너굴이 자리 · 속지 마'] : [L.thumbs.face_peng_normal, '눈이 펑펑!', '발자국이 점점 지워져요 · 빨리 따라가'];
    const c = h('div', { class: 'fp-get' }, h('img', { src: img }), h('div', {}, h('div', { class: 'fp-get-t ol' }, '새로 나왔다!'), h('div', { class: 'fp-get-s' }, s1), h('div', { class: 'fp-get-s' }, s2)));
    document.getElementById('app').append(c); L.audio.sfx('gasp');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2600);
  }
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => { if (e.button > 0 || this.result || this.phase !== 'play' || this.busy) return; this.tapAt(e.clientX, e.clientY); };
    app.addEventListener('pointerdown', this._down);
  }

  // ── a round: hiding places, who hid where, and the trail each one left from 몽글이 to its place
  async newRound(first) {
    const L = this.L, W = L.world, LV = this.lv;
    this.busy = true;
    if (!first) { this.flashEl.classList.add('on'); await this.tw.wait(.38); if (this.dead) return; }
    for (const o of this.round) { W.root.remove(o); disposeTree(o); } this.round = [];
    this.rounds++;
    const nS = LV.n + 1, picks = ANCHORS.slice().sort(() => Math.random() - .5);
    const spots = [];
    for (const a of picks) { if (spots.length >= nS) break; if (spots.every(s => Math.hypot(s.x - a[0], s.z - a[1]) > 1.7)) spots.push({ x: a[0], z: a[1] }); }
    const kinds = FRIENDS.slice().sort(() => Math.random() - .5).slice(0, LV.n);
    // everyone gets a place; 너굴이 the last one
    const who = [...kinds, 'raccoon'];
    this.spots = spots.map((s, i) => {
      const ST = LV.spots || SPOT_TYPES, type = ST[(i + this.rounds * 3) % ST.length];
      const g = type === 'snowman' ? makeSnowman() : makeFurniture(type, this.theme).group;
      g.position.set(s.x, 0, s.z); g.rotation.y = (Math.random() - .5) * .5; if (type === 'bush') g.scale.setScalar(1.35); this.add(g, true);
      const b = new THREE.Box3().setFromObject(g);
      return { ...s, type, g, top: b.max.y, kind: who[i], found: false, c: null };
    });
    // the trails: from 몽글이 to the front of each place, a bend to one side or the other (more bend = more crossing)
    this.trails = this.spots.map(sp => {
      const sx = START[0] + (Math.random() - .5) * .8, sz = START[1] - .3, ex = sp.x, ez = sp.z + .62;
      const dx = ex - sx, dz = ez - sz, L0 = Math.hypot(dx, dz), nx = -dz / L0, nz = dx / L0;
      const b1 = (Math.random() - .5) * 2 * LV.bend, b2 = (Math.random() - .5) * 2 * LV.bend;
      const P = [[sx, sz], [sx + dx * .33 + nx * b1, sz + dz * .33 + nz * b1], [sx + dx * .66 + nx * b2, sz + dz * .66 + nz * b2], [ex, ez]];
      return { sp, P, print: PRINTS[sp.kind], steps: this.walk(P, STRIDE[PRINTS[sp.kind]] * (PRINTS[sp.kind] === 'skate' ? 1 : 1.3)) };
    });
    this.roundT = 0; this.hl = null; this.drawSnow();
    // who to ask this round: some of the friends (never 너굴이)
    this.queue = this.spots.filter(s => s.kind !== 'raccoon').sort(() => Math.random() - .5).slice(0, LV.ask);
    W.idsDirty = true; W.shadowDirty = true;
    if (!first) { this.flashEl.classList.remove('on'); await this.tw.wait(.25); }
    if (this.dead) return;
    this.busy = false; this.nextAsk();
  }
  // points along a cubic bezier every `stride` units: [x, z, heading]
  walk(P, stride) {
    const pt = t => { const u = 1 - t; return [0, 1].map(i => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]); };
    const out = []; let prev = pt(0), acc = 0;
    for (let k = 1; k <= 400; k++) {
      const q = pt(k / 400), d = Math.hypot(q[0] - prev[0], q[1] - prev[1]); acc += d;
      if (acc >= stride) { acc = 0; out.push([q[0], q[1], Math.atan2(q[1] - prev[1], q[0] - prev[0])]); }
      prev = q;
    }
    return out;
  }
  // repaint the snow: every trail (the asked one glowing when a hint is on), fading from the start when it's snowing
  drawSnow() {
    const c = this.ctx, LV = this.lv; c.putImageData(this.base, 0, 0);
    for (const tr of this.trails || []) {
      const hl = this.hl === tr, n = tr.steps.length;
      tr.steps.forEach(([x, z, a], i) => {
        let al = 1;
        if (LV.fade) { const life = LV.fade + (i / n) * LV.fade * .9; al = clamp(1 - (this.roundT - life * .35) / (life * .65), 0, 1); }
        if (al <= .02) return;
        const [px, py] = this.toPx(x, z), side = i % 2 ? 1 : -1;
        if (hl) { c.globalAlpha = .5 * al; c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(px, py, PX * .28, 0, 7); c.fill(); }
        c.globalAlpha = al; c.fillStyle = c.strokeStyle = '#7491c4';
        if (tr.print === 'skate') { if (i) { const [qx, qy] = this.toPx(tr.steps[i - 1][0], tr.steps[i - 1][1]); c.lineWidth = PX * .06; for (const w of [-.1, .1]) { const ox = -Math.sin(a) * w * PX, oy = Math.cos(a) * w * PX; c.beginPath(); c.moveTo(qx + ox, qy + oy); c.lineTo(px + ox, py + oy); c.stroke(); } } }
        else {
          stamp(c, tr.print, px, py, a, PX * PS, side);
          if (tr.print === 'tail' && i) { const [qx, qy] = this.toPx(tr.steps[i - 1][0], tr.steps[i - 1][1]); c.lineWidth = PX * .065; c.beginPath(); c.moveTo(qx, qy); c.quadraticCurveTo((px + qx) / 2 + Math.sin(i) * PX * .1, (py + qy) / 2, px, py); c.stroke(); }
        }
      });
    }
    c.globalAlpha = 1; this.tex.needsUpdate = true;
  }
  nextAsk() {
    const L = this.L;
    const sp = this.cur = this.queue.shift() || null;
    if (!sp) { this.ask.classList.add('out'); return this.endRound(); }
    this.askFace.src = L.thumbs[`face_${sp.kind}_normal`]; this.askPrint.src = this.icons[PRINTS[sp.kind]];
    this.askT.textContent = `${NAMES[sp.kind]} 어디 숨었지?`;
    this.ask.classList.remove('out'); this.misses = 0; this.hl = null; this.drawSnow();
  }
  async endRound() {
    // everyone still hidden pops out laughing, then the snow falls fresh
    this.busy = true;
    for (const [i, sp] of this.spots.entries()) if (!sp.found) setTimeout(() => !this.dead && this.pop(sp, sp.kind === 'raccoon' ? '메롱~' : '여기 있지롱~', 'happy'), i * 90);
    await this.tw.wait(1.1); if (this.dead || this.result) return;
    await this.newRound(false);
  }
  pop(sp, line, face) {
    const L = this.L, W = L.world; if (sp.c) return;
    const c = sp.c = new Char(sp.kind); c.root.scale.setScalar(1.15); this.add(c.root, true);
    const side = sp.x > 0 ? -1 : 1; c.root.position.set(sp.x + side * .55, 0, sp.z + .35); c.faceTo(W.cam.position.x, W.cam.position.z); c.setFace(face); c.pose = 'cheer';
    this.tw.run(.32, k => { c.root.position.y = Math.sin(k * Math.PI) * .8; }, ease.outQuad);
    L.say(c, line, 900); W.idsDirty = true;
    sp.g.rotation.z = .1; this.tw.run(.3, k => { sp.g.rotation.z = .1 * (1 - k) * Math.cos(k * 18); });
  }
  // a tap on a hiding place (the prop, or near its foot)
  tapAt(x, y) {
    const W = this.L.world; let best = null, bd = 1e9;
    for (const sp of this.spots || []) {
      if (sp.found) continue;
      const s = W.toScreen(new THREE.Vector3(sp.x, Math.min(sp.top, 1.3) * .5, sp.z)), d = Math.hypot(s.x - x, s.y - y);
      if (d < bd) { bd = d; best = sp; }
    }
    if (best && bd < 70) this.pick(best);
  }
  pick(sp) {
    const L = this.L, W = L.world, cur = this.cur; if (!cur || this.busy) return;
    const s = W.toScreen(new THREE.Vector3(sp.x, sp.top + .2, sp.z));
    if (sp === cur) {
      sp.found = true; this.found++; this.combo++; this.best = Math.max(this.best, this.combo);
      const pts = 1 + (this.combo >= 3 ? 1 : 0); this.score += pts;
      L.audio.sfx('found'); L.ui.floatText(s.x, s.y, pts > 1 ? `+${pts} 연속!` : '+1', 'gold');
      this.pop(sp, FOUND[sp.kind] || '들켰다~!', 'happy'); L.log({ find: sp.kind, t: +this.t.toFixed(1) });
      this.scoreEl.textContent = String(this.score); this.scoreEl.classList.remove('pop'); void this.scoreEl.offsetWidth; this.scoreEl.classList.add('pop');
      this.barI.style.width = Math.min(100, this.score / this.barMax * 100) + '%';
      this.ask.classList.add('out'); this.busy = true;
      setTimeout(() => { if (this.dead || this.result) return; this.busy = false; this.nextAsk(); }, 650);
    } else {
      this.combo = 0; this.wrong++; this.misses++; this.left = Math.max(.5, this.left - 2);
      L.audio.sfx('miss'); L.ui.floatText(s.x, s.y, '-2초', 'red');
      if (sp.kind === 'raccoon') { this.pop(sp, '메롱~ 나였지롱!', 'happy'); sp.found = true; }
      else { this.pop(sp, '나 아닌데~', 'sus'); const c = sp.c; setTimeout(() => { if (this.dead || !c || sp.found) return; this.L.world.root.remove(c.root); this.round = this.round.filter(o => o !== c.root); disposeTree(c.root); sp.c = null; }, 900); }
      L.log({ wrong: sp.kind, want: cur.kind, t: +this.t.toFixed(1) });
      // two wrong in a row: the asked friend's trail glows (the hint comes by playing)
      if (this.misses >= 2) { this.hl = this.trails.find(t => t.sp === cur); this.drawSnow(); }
    }
  }
  update(dt) {
    const L = this.L;
    this.t += dt; this.tw.update(dt);
    this.me?.update(dt); for (const sp of this.spots || []) sp.c?.update(dt);
    if (this.phase !== 'play' || this.result) return;
    this.roundT += dt;
    if (this.lv.fade) { this.snowEl.classList.add('on'); if ((this._ft = (this._ft || 0) - dt) <= 0) { this._ft = .25; this.drawSnow(); } }
    this.left -= dt;
    this.clockI.style.width = Math.max(0, this.left / this.lv.time * 100) + '%';
    const n = Math.max(0, Math.ceil(this.left)); if (this.clockN.textContent !== String(n)) this.clockN.textContent = String(n);
    this.clock.classList.toggle('hurry', this.left < 10);
    if (this.left <= 0) this.finish();
  }
  async finish() {
    if (this.result) return;
    const L = this.L, LV = this.lv; this.phase = 'end'; this.ask.classList.add('out'); this.snowEl.classList.remove('on');
    const stars = LV.stars.filter(s => this.score >= s).length, win = stars >= 1;
    this.result = win ? 'win' : 'fail';
    L.log({ result: this.result, lv: this.lvIdx, score: this.score, stars, found: this.found, wrong: this.wrong });
    for (const sp of this.spots || []) if (!sp.found) this.pop(sp, sp.kind === 'raccoon' ? '메롱~' : '여기 있지롱~', 'happy');
    if (win) { L.audio.sfx('win'); L.world.fx.confetti(70); this.me.setFace('happy'); this.me.pose = 'cheer'; L.say(this.me, '발자국 탐정 몽글이!', 1400); }
    else { L.audio.sfx('lose'); this.me.setFace('sweat'); L.say(this.me, '못 찾겠다 꾀꼬리~!', 1300); }
    await this.tw.wait(1.3); if (this.dead) return;
    const h = L.h, last = this.lvIdx >= LEVELS.length - 1;
    L.ui.panel({ title: win ? '다 찾았다!' : '아쉽다~', color: win ? 'green' : 'orange', body: [
      h('div', { class: 'fp-stars' }, ...[0, 1, 2].map(k => h('span', { class: k < stars ? 'on' : '' }, '★'))),
      h('div', { class: 'txt' }, `${this.score}점 · 친구 ${this.found}명 찾음 · 최고 ${this.best}연속`),
      h('div', { class: 'txt' }, win ? (stars >= 3 ? '발자국 박사! 하나도 안 놓쳤어' : '세 번 연속 맞히면 +2점!') : `${LV.stars[0]}점부터 성공! 카드의 발자국 모양을 봐`)],
      buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
        this.nextBtn = L.ui.btn(win ? (last ? '처음부터' : '다음 마당') : '다시 하기', { color: win ? 'green' : 'orange', cls: 'big', onClick: () => L.go({ lv: win ? (last ? 0 : this.lvIdx + 1) : this.lvIdx }) })] });
  }
  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.removeEventListener('pointerdown', this._down); app.classList.remove('fp');
    for (const o of [...this.objs, ...this.round]) { W.root.remove(o); disposeTree(o); }
    this.tex?.dispose(); this.snowEl?.remove(); this.flashEl?.remove(); document.querySelectorAll('.fp-get').forEach(e => e.remove());
    W.camLock = false;
  }

  // ── bots (QA): smart taps the asked friend's place after a look; random taps any place
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 2.5 && this.L.ui.panelOpen) { this._endT = 0; this.nextBtn?.press(); } return; }
    if (this.phase !== 'play' || this.busy || !this.cur) return;
    if ((this._bt = (this._bt || 0) - dt) > 0) return; this._bt = mode === 'random' ? .5 + Math.random() * .5 : 1.1;
    const live = this.spots.filter(s => !s.found);
    this.pick(mode === 'random' ? live[Math.floor(Math.random() * live.length)] : this.cur);
  }
  state() { return { scene: 'tracks', lv: this.lvIdx + 1, phase: this.phase, result: this.result || null, score: this.score, found: this.found, wrong: this.wrong, rounds: this.rounds, left: +(this.left || 0).toFixed(1), ask: this.cur?.kind || null }; }
  get api() { return { finish: () => { this.left = 0; }, hint: () => { this.hl = this.trails.find(t => t.sp === this.cur); this.drawSnow(); } }; }
}
const NAMES = { bunny: '토순이', panda: '판다', hamster: '햄찌', shiba: '멍뭉이', cheese: '치즈냥', peng: '펭펭이', frog: '개굴이', skater: '보드킹', squirrel: '다람이', raccoon: '너굴이' };

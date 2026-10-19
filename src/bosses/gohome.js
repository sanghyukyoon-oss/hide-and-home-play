// 다 같이 집으로! — a 쉬어가기 (10/19, user via 숨바꼭집 인수인계: "화살표 빼내기인데 이거 좀 디벨롭시켜보는 방안 필요할듯.
// 물론 우리 소스들로"). 숨바꼭질 is over and it's getting dark: every friend on the lawn goes home the way the arrow under its
// feet points. Tap a friend whose way is clear and it runs straight off the lawn ("내일 또 놀자~"); a friend whose way is
// blocked runs into whoever is in front, bonks and comes back. Send everyone home before the sun goes down.
//   lv 0 놀이터      5×5, seven friends                                     (the rule, nothing else)
//   lv 1 덤불 숲     + rocks and baskets in the way, two friends still hiding in bushes (tap the bush: 찾았다!)
//   lv 2 해 질 녘    6×6 + 빙글 너굴이: his arrow turns a quarter round every time a friend goes home
// Sending a friend never makes the lawn unsolvable (it only opens ways), so there's no undo; stars count the bonks, and
// every bonk costs 3 seconds of daylight.
import * as THREE from 'three';
import { Room } from '../room.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree } from '../gfx/kit.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const DUSK = { ambColor: '#ffe9d6', amb: 1.4, sunColor: '#ffd9b0', sun: 2.1 };
const FRIENDS = ['bunny', 'frog', 'hamster', 'squirrel', 'shiba', 'panda', 'cheese', 'sleepy', 'dj', 'calico', 'peng', 'bear', 'kkamang', 'hayang'];
const BYE = ['내일 또 놀자~', '안녕~!', '다녀올게!', '잘 가~', '내일 봐!', '집에 가야지~'];
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // up (away from you), right, down, left
const ROCKS = ['rock', 'picnic', 'cooler', 'parkbin', 'mushrooms', 'boxstack'];
const SIZE = 1.22;
const BONK_T = 3;                                 // seconds of daylight a bonk costs
const RING = 3;                                   // grass round the grid: one free strip, then trees
const GREEN = ['tree', 'bush', 'pine', 'tree', 'bush', 'mushrooms'], LOW = ['bush', 'mushrooms', 'bush'];
const LEVELS = [
  { name: '놀이터', n: 5, count: 7, rocks: 0, hidden: 0, spin: 0, time: 60 },
  { name: '덤불 숲', n: 5, count: 9, rocks: 3, hidden: 2, spin: 0, time: 75, card: 'bush' },
  { name: '해 질 녘', n: 6, count: 12, rocks: 3, hidden: 2, spin: 1, time: 90, card: 'spin' },
];

// ── the puzzle: cells (x, y), y grows toward you. A friend's way = the cells from it to the edge in its direction.
function wayClear(p, list, rocks, n) {
  const [dx, dy] = DIRS[p.dir]; let x = p.x + dx, y = p.y + dy;
  while (x >= 0 && x < n && y >= 0 && y < n) {
    if (rocks.has(x + ',' + y) || list.some(q => q !== p && q.x === x && q.y === y)) return false;
    x += dx; y += dy;
  }
  return true;
}
// can every friend get home from here (with 빙글 너굴이 turning after each one)? Returns the next friend to send, or null
function solve(list, rocks, n) {
  const seen = new Set();
  const go = (rest) => {
    if (!rest.length) return true;
    const key = rest.map(p => p.id + ':' + p.dir).sort().join('|'); if (seen.has(key)) return false; seen.add(key);
    for (const p of rest) {
      if (!wayClear(p, rest, rocks, n)) continue;
      const next = rest.filter(q => q !== p).map(q => q.spin ? { ...q, dir: (q.dir + 1) % 4 } : q);
      if (go(next)) return p;
    }
    // 빙글 너굴이 left alone and stuck: a tap turns him (no bonk), so that counts as a way on
    if (rest.length === 1 && rest[0].spin && [1, 2, 3].some(k => wayClear({ ...rest[0], dir: (rest[0].dir + k) % 4 }, rest, rocks, n))) return rest[0];
    return false;
  };
  const r = go(list.map(p => ({ ...p })));
  return r ? list.find(p => p.id === r.id) : null;
}
// a lawn that can be solved: friends placed one by one, each with a clear way among those placed before it (so they can
// leave in the reverse order), preferring spots in the way of earlier ones (that's what makes it a puzzle)
function makeLawn(LV, strict = true) {
  const n = LV.n;
  for (let tries = 0; tries < 1500; tries++) {
    const rocks = new Set(), list = [];
    while (rocks.size < LV.rocks) { const x = 1 + Math.floor(Math.random() * (n - 2)), y = 1 + Math.floor(Math.random() * (n - 2)); rocks.add(x + ',' + y); }
    for (let k = 0; k < LV.count; k++) {
      const cands = [];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        if (rocks.has(x + ',' + y) || list.some(q => q.x === x && q.y === y)) continue;
        for (let d = 0; d < 4; d++) {
          const p = { x, y, dir: d }; if (!wayClear(p, list, rocks, n)) continue;
          // how many earlier friends this spot stands in the way of
          let w = 1; for (const q of list) { const [dx, dy] = DIRS[q.dir]; for (let s = 1; s < n; s++) { if (q.x + dx * s === x && q.y + dy * s === y) { w += 12; break; } } }
          cands.push([p, w]);
        }
      }
      if (!cands.length) break;
      let r = Math.random() * cands.reduce((a, c) => a + c[1], 0), pick = cands[0][0];
      for (const [p, w] of cands) { r -= w; if (r <= 0) { pick = p; break; } }
      list.push({ ...pick, id: k });
    }
    if (list.length < LV.count) continue;
    const free0 = list.filter(p => wayClear(p, list, rocks, n)).length;
    if (free0 < 1 || (strict && free0 > (LV.n > 5 ? 3 : 2))) continue;
    // 빙글 너굴이: one friend whose arrow will keep turning (only if the lawn stays solvable)
    if (LV.spin) { const c = list.filter(p => !wayClear(p, list, rocks, n)); const s = c[Math.floor(Math.random() * c.length)]; if (!s) continue; s.spin = true; }
    if (!solve(list, rocks, n)) continue;
    // friends still hiding in bushes (not 너굴이, and never the only way on at the start)
    const hideable = list.filter(p => !p.spin && !wayClear(p, list, rocks, n));
    for (let k = 0; k < LV.hidden && hideable.length; k++) hideable.splice(Math.floor(Math.random() * hideable.length), 1)[0].hid = true;
    return { list, rocks };
  }
  return null;
}

const CSS = `
#app.gh { background: radial-gradient(120% 80% at 50% 25%, #fff6ea 0%, #ffe1cf 50%, #f4c6b8 100%); }
.gh-clock { margin-left: auto; position: relative; width: 116px; height: 30px; border-radius: 999px; background: rgba(42, 26, 61, .55); border: 2.5px solid #3a2453; overflow: hidden; pointer-events: none; }
.gh-clock i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: linear-gradient(90deg, #ffd36b, #ff9a3c); transition: width .25s linear; }
.gh-clock b { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-size: 15px; }
.gh-clock.hurry i { background: linear-gradient(90deg, #ff9aa8, #ff4f66); animation: ghHurry .5s ease-in-out infinite; }
@keyframes ghHurry { 50% { filter: brightness(1.25); } }
.gh-head { position: absolute; left: 50%; top: calc(64px + var(--safeT, 0px)); transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 5px; pointer-events: none; }
.gh-count { font-family: var(--font-display); font-size: 30px; line-height: 1; color: #fff; }
.gh-count small { font-family: var(--font); font-size: 15px; margin-left: 6px; }
.gh-bar { position: relative; width: 200px; height: 12px; border-radius: 999px; background: rgba(42, 26, 61, .35); border: 2px solid #3a2453; overflow: hidden; }
.gh-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: linear-gradient(90deg, #a8ec7a, #4cc62e); transition: width .3s cubic-bezier(.16, 1, .3, 1); }
.gh-hint { position: absolute; left: 50%; bottom: calc(26px + var(--safeB, 0px)); transform: translateX(-50%); color: #fff; font-size: 17px; white-space: nowrap; background: rgba(42, 26, 61, .58); padding: 8px 16px 10px; border-radius: 999px; pointer-events: none; transition: opacity .3s; }
.gh-hint.gone { opacity: 0; }
.gh-get { position: absolute; left: 50%; top: 30%; transform: translate(-50%, -50%); z-index: 30; pointer-events: none; display: flex; align-items: center; gap: 10px; background: #fffaf2; border: 4px solid #3a2453;
  border-radius: 20px; padding: 10px 16px; box-shadow: 0 6px 0 #3a2453; color: #3a2453; animation: ghGet .45s cubic-bezier(.2, 1.7, .4, 1); width: max-content; max-width: 88vw; }
.gh-get img { width: 60px; height: 60px; }
.gh-get-t { font-family: var(--font-display); color: #ffcf3c; font-size: 22px; }
.gh-get-s { font-size: 14px; word-break: keep-all; }
.gh-get.out { opacity: 0; transition: opacity .35s; }
@keyframes ghGet { from { transform: translate(-50%, -50%) scale(.6); } to { transform: translate(-50%, -50%) scale(1); } }
.gh-stars { display: flex; justify-content: center; gap: 6px; font-size: 40px; color: #d8cfe4; margin-bottom: 4px; }
.gh-stars .on { color: #ffd23f; text-shadow: 0 3px 0 #d99a0b; }
#app.gh .bubble.bye { background: #fffaf2; }
`;

// the arrow under a friend's feet: a fat rounded chevron, white with an ink edge (tinted to the friend)
let ARROW_TEX = null, SPIN_TEX = null;
function arrowTex(spin) {
  if (!spin && ARROW_TEX) return ARROW_TEX; if (spin && SPIN_TEX) return SPIN_TEX;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  c.lineJoin = 'round'; c.lineCap = 'round';
  const shape = () => { c.beginPath(); c.moveTo(64, 10); c.lineTo(112, 64); c.lineTo(84, 64); c.lineTo(84, 116); c.lineTo(44, 116); c.lineTo(44, 64); c.lineTo(16, 64); c.closePath(); };
  shape(); c.lineWidth = 18; c.strokeStyle = '#3a2453'; c.stroke(); c.fillStyle = spin ? '#c9a7ff' : '#ffe16b'; c.fill();
  c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(64, 24); c.lineTo(96, 60); c.lineTo(76, 60); c.closePath(); c.fill();
  if (spin) { c.strokeStyle = '#3a2453'; c.lineWidth = 7; c.beginPath(); c.arc(64, 82, 16, -Math.PI * .1, Math.PI * 1.3); c.stroke(); c.beginPath(); c.moveTo(80, 70); c.lineTo(84, 84); c.lineTo(70, 82); c.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return spin ? (SPIN_TEX = t) : (ARROW_TEX = t);
}

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.objs = []; }
  add(o) { this.L.world.root.add(o); this.objs.push(o); return o; }
  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx], n = LV.n;
    if (!document.getElementById('gh-css')) { const s = document.createElement('style'); s.id = 'gh-css'; s.textContent = CSS; document.head.append(s); }
    const app = document.getElementById('app'); app.dataset.night = ''; app.classList.add('gh');
    L.setBg(['#fff3e6', '#ffd9c4']); W.setLight(DUSK);
    const lawn = makeLawn(LV) || makeLawn(LV, false) || makeLawn({ ...LV, spin: 0, hidden: 0 }, false);
    this.rocks = lawn.rocks;
    // the lawn: an open park, a ring of grass round the grid for the friends to run out on
    // (the grid sits in the middle of a bigger park: a free strip round it to run out on, then trees and bushes)
    const R = n + 2 * RING, furniture = [];
    let ri = 0; for (const k of this.rocks) { const [x, y] = k.split(',').map(Number); furniture.push(F(ROCKS[ri++ % ROCKS.length], x + RING, y + RING, Math.floor(Math.random() * 4))); }
    const hidden = lawn.list.filter(p => p.hid);
    for (const p of hidden) furniture.push(F('bush', p.x + RING, p.y + RING));
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
      const out = Math.max(RING - 1 - i, i - (n + RING), RING - 1 - j, j - (n + RING)); if (out < 1 || Math.random() > .42) continue;
      // in front (between the lawn and you) only low things, a row further out: a tree there would stand over the lawn
      const front = j >= n + RING; if (front && j < n + RING + 2) continue;
      furniture.push(F((front ? LOW : GREEN)[Math.floor(Math.random() * (front ? LOW : GREEN).length)], i, j, Math.floor(Math.random() * 4)));
    }
    const layout = { w: R, d: R, theme: THEMES.park2 || THEMES.park1, bleed: {}, walls: { N: 'none', W: 'none', S: 'none', E: 'none' },
      floorZones: [{ i: RING, j: RING, w: n, d: n, kind: 'checker', a: '#c4eba0', b: '#aedf88' }], furniture };
    const room = this.room = new Room(W, layout); this.add(room.group); room.group.updateMatrixWorld(true);
    this.n = n; this.half = R / 2;
    const bushes = room.furns.filter(r => r.type === 'bush' && r.i >= RING && r.i < RING + n && r.j >= RING && r.j < RING + n);
    for (const r of bushes) r.f.group.scale.setScalar(1.25);
    // the friends
    const kinds = FRIENDS.slice().sort(() => Math.random() - .5);
    this.pieces = lawn.list.map((p, k) => {
      const kind = p.spin ? 'raccoon' : kinds[k % kinds.length], c = new Char(kind);
      c.root.scale.setScalar(SIZE); const w = this.cellW(p.x, p.y); c.root.position.set(w.x, 0, w.z); this.add(c.root);
      const arrow = new THREE.Mesh(new THREE.PlaneGeometry(.78, .78), new THREE.MeshBasicMaterial({ map: arrowTex(!!p.spin), transparent: true, depthWrite: false, depthTest: false }));   // drawn over bodies: a friend going up must not hide its arrow
      arrow.rotation.x = -Math.PI / 2; arrow.renderOrder = 5; this.add(arrow);
      const q = { ...p, kind, c, arrow, state: p.hid ? 'hid' : 'idle', bush: null, yaw: 0 };
      if (p.hid) { q.bush = bushes.find(b => b.i === p.x + RING && b.j === p.y + RING) || null; c.root.visible = false; arrow.visible = false; }
      this.aim(q, true);
      return q;
    });
    // 몽글이 (it found everyone) waves from the grass in front, just past where the runners vanish
    const me = this.me = new Char('mong'); const cw = this.cellW((n - 1) / 2, n + 1.15); me.root.position.set(cw.x, 0, cw.z); me.root.scale.setScalar(1.3); this.add(me.root);
    me.faceTo(0, 0);
    this.frame();
    this.home = 0; this.bonks = 0; this.streak = 0; this.left = LV.time; this.result = null; this.phase = 'intro'; this.lock = new Set();
    L.makeThumbs({ faces: [['mong', 'happy'], ['raccoon', 'happy'], ['bunny', 'happy']] });
    this.buildHud();
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    L.say(me, '다 찾았다! 이제 집에 가자~', 1500); me.pose = 'cheer'; me.setFace('happy');
    await this.tw.wait(1.1); if (this.dead) return;
    me.pose = 'idle';
    this.phase = 'play';
    if (LV.card) this.gotCard(LV.card);
    this.glowFree(2.4);
  }
  cellW(x, y) { return { x: -this.half + x + RING + .5, z: -this.half + y + RING + .5 }; }
  // the friend faces its way and the arrow sits just in front of its feet
  aim(q, now) {
    const [dx, dy] = DIRS[q.dir], w = this.cellW(q.x, q.y), yaw = Math.atan2(dx, dy);
    q.arrow.position.set(w.x + dx * .34, .03, w.z + dy * .34);   // in front of the feet (an arrow behind a friend still shows its tip)
    q.arrowYaw = yaw; if (now) q.arrow.rotation.z = yaw + Math.PI;
    if (now) q.c.root.rotation.y = yaw;
    q.goalYaw = yaw;
  }
  frame() {
    const W = this.L.world, R = this.n + 2;   // (the lawn and its run-out strip)
    W.home.set(0, .35, .3); W.target.copy(W.home); W.yaw = 0; W.pitch = .78; W.zoom = 1;   // straight on (so ↑↓←→ are the screen's), low enough to see faces
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(this.n + .9, R * .7, .5);
  }
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col(), LV = this.lv;
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, '다 같이 집으로!', h('small', {}, LV.name)));
    this.clock = h('div', { class: 'gh-clock' }, this.clockI = h('i'), h('b', { class: 'ol' }, '해 지기 전에'));
    top.append(this.clock);
    col.append(top);
    this.countEl = h('div', { class: 'gh-count ol' }, '0', h('small', {}, `/ ${this.pieces.length} 집에 감`));
    this.bar = h('div', { class: 'gh-bar' }, this.barI = h('i'));
    col.append(h('div', { class: 'gh-head' }, this.countEl, this.bar));
    this.hint = h('div', { class: 'gh-hint ol' }, '앞길이 열린 친구부터 톡!'); col.append(this.hint);
  }
  gotCard(kind) {
    const L = this.L, h = L.h;
    const [img, s1, s2] = kind === 'spin' ? [L.thumbs.face_raccoon_happy, '빙글 너굴이!', '친구가 한 명 갈 때마다 화살표가 빙글 돌아요'] : [L.thumbs.face_bunny_happy, '덤불 속 친구!', '흔들리는 덤불을 톡 하면 나와요'];
    const c = h('div', { class: 'gh-get' }, h('img', { src: img }), h('div', {}, h('div', { class: 'gh-get-t ol' }, '새로 나왔다!'), h('div', { class: 'gh-get-s' }, s1), h('div', { class: 'gh-get-s' }, s2)));
    document.getElementById('app').append(c); L.audio.sfx('gasp');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2600);
  }
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => { if (e.button > 0 || this.result || this.phase !== 'play') return; this.tapAt(e.clientX, e.clientY); };
    app.addEventListener('pointerdown', this._down);
  }
  // a tap: the friend (or bush) on the cell under the finger — a fat finger on the friend's body counts too
  tapAt(sx, sy) {
    const W = this.L.world, g = W.screenToGround(sx, sy, 0);
    let best = null, bd = 1e9;
    for (const q of this.pieces) {
      if (q.state === 'home' || q.state === 'run') continue;
      const w = this.cellW(q.x, q.y), s = W.toScreen(new THREE.Vector3(w.x, .45 * SIZE, w.z)), d = Math.hypot(s.x - sx, s.y - sy);
      const onCell = g && Math.abs(g.x - w.x) < .5 && Math.abs(g.z - w.z) < .5;
      const score = onCell ? d * .5 : d;
      if ((onCell || d < 46) && score < bd) { bd = score; best = q; }
    }
    if (best) this.tapPiece(best);
  }
  live() { return this.pieces.filter(q => q.state !== 'home' && q.state !== 'run'); }
  tapPiece(q) {
    if (this.lock.has(q) || this.result) return;
    const L = this.L;
    if (q.state === 'hid') return this.reveal(q);
    const live = this.live(), n = this.n;
    if (q.spin && live.length === 1 && !wayClear(q, live, this.rocks, n)) { this.turn(q); L.say(q.c, '빙글~', 600); return; }
    if (!wayClear(q, live, this.rocks, n)) return this.bonk(q);
    this.send(q);
  }
  reveal(q) {
    const L = this.L, W = L.world; this.lock.add(q);
    q.state = 'idle'; q.c.root.visible = true; q.arrow.visible = true; q.arrow.scale.setScalar(.01);
    const b = q.bush?.f.group, w = this.cellW(q.x, q.y);
    L.audio.sfx('found'); L.say(q.c, '찾았다~!', 800);
    const s = W.toScreen(new THREE.Vector3(w.x, 1, w.z)); L.ui.floatText(s.x, s.y - 30, '찾았다!', 'gold');
    this.tw.run(.3, k => { if (b) { b.scale.setScalar(1.25 * (1 - k)); b.rotation.y = k * 3; } q.c.root.position.y = Math.sin(k * Math.PI) * .7; q.arrow.scale.setScalar(Math.max(.01, k)); }, ease.outQuad)
      .then(() => { if (b) b.visible = false; q.c.root.position.y = 0; this.lock.delete(q); });
    q.c.setFace('happy'); q.c.bump(.4);
    W.idsDirty = true; W.shadowDirty = true;
  }
  turn(q) {
    q.dir = (q.dir + 1) % 4; this.aim(q, false); this.L.audio.sfx('swish');
  }
  // way clear: off it runs, hopping, out over the edge of the lawn and away
  send(q) {
    const L = this.L, W = L.world, [dx, dy] = DIRS[q.dir], n = this.n;
    q.state = 'run'; this.home++; this.streak++; this._bonkRun = 0; L.log({ send: q.kind, t: +this.t.toFixed(1) });
    let steps = 0; { let x = q.x, y = q.y; while (x >= 0 && x < n && y >= 0 && y < n) { x += dx; y += dy; steps++; } }
    const w0 = this.cellW(q.x, q.y), dist = steps + 1.6, dur = .22 + dist * .11;
    L.audio.sfx('hop'); q.c.setFace('happy'); q.c.pose = 'cheer';
    this.tw.run(.18, k => { q.arrow.scale.setScalar(1 - k); }).then(() => { q.arrow.visible = false; });
    this.tw.run(dur, k => {
      const d = dist * k; q.c.root.position.set(w0.x + dx * d, Math.abs(Math.sin(k * dist * 2.2)) * .22, w0.z + dy * d);
      if (k > .75) q.c.root.scale.setScalar(SIZE * (1 - (k - .75) / .25 * .9));
    }, t => t).then(() => { q.state = 'home'; q.c.root.visible = false; });
    setTimeout(() => !this.dead && L.say(q.c, BYE[Math.floor(Math.random() * BYE.length)], 900, 'bye'), 80);
    this.countEl.firstChild.textContent = String(this.home); this.countEl.classList.remove('pop'); void this.countEl.offsetWidth;
    this.barI.style.width = (this.home / this.pieces.length * 100) + '%';
    // 빙글 너굴이 turns every time a friend goes home
    for (const p of this.live()) if (p.spin && p !== q) { this.turn(p); const s = W.toScreen(new THREE.Vector3(this.cellW(p.x, p.y).x, 1.1, this.cellW(p.x, p.y).z)); L.ui.floatText(s.x, s.y, '빙글~', ''); }
    if (this.home >= 2 && !this._hintGone) { this._hintGone = true; this.hint.classList.add('gone'); }
    if (this.home >= this.pieces.length) setTimeout(() => !this.dead && this.finish(true), 650);
  }
  // way blocked: it runs up to whoever (or whatever) is in front, bonks, and walks back
  bonk(q) {
    const L = this.L, [dx, dy] = DIRS[q.dir], n = this.n, live = this.live();
    this.lock.add(q); this.bonks++; this.streak = 0; L.log({ bonk: q.kind, t: +this.t.toFixed(1) });
    // a bonk costs daylight (so tapping everyone at random runs out of sun)
    this.left = Math.max(.5, this.left - BONK_T); { const w = this.cellW(q.x, q.y), s = L.world.toScreen(new THREE.Vector3(w.x, 1.3, w.z)); L.ui.floatText(s.x, s.y, `꽝! -${BONK_T}초`, 'red'); }
    let s = 0, x = q.x + dx, y = q.y + dy, hit = null;
    while (x >= 0 && x < n && y >= 0 && y < n) { if (this.rocks.has(x + ',' + y)) break; hit = live.find(p => p !== q && p.x === x && p.y === y); if (hit) break; s++; x += dx; y += dy; }
    const w0 = this.cellW(q.x, q.y), reach = s + .38, go = .1 + reach * .08;
    L.audio.sfx('hop');
    this.tw.run(go, k => { const d = reach * k; q.c.root.position.set(w0.x + dx * d, Math.abs(Math.sin(k * Math.PI)) * .15, w0.z + dy * d); })
      .then(() => {
        L.audio.sfx('wobble'); q.c.setFace('dizzy'); q.c.bump(.6);
        L.say(q.c, '앗!', 600);
        if (hit) { hit.c.bump(.5); hit.c.setFace('wow'); setTimeout(() => !this.dead && hit.c.setFace('normal'), 700); if (hit.state === 'hid') { const b = hit.bush?.f.group; if (b) this.tw.run(.3, k => { b.rotation.z = Math.sin(k * 20) * .1 * (1 - k); }); } }
        return this.tw.run(go + .12, k => { const d = reach * (1 - k); q.c.root.position.set(w0.x + dx * d, 0, w0.z + dy * d); });
      })
      .then(() => { q.c.setFace('normal'); this.lock.delete(q); });
    // two bonks in a row: the friends who can go glow for a moment (the hint comes by playing)
    this._bonkRun = (this._bonkRun || 0) + 1; if (this._bonkRun >= 2) { this._bonkRun = 0; this.glowFree(1.6); }
  }
  glowFree(t) { this.glowT = t; }
  update(dt) {
    const L = this.L;
    this.t += dt; this.tw.update(dt);
    this.room?.update?.(dt); this.me?.update(dt);
    for (const q of this.pieces) {
      if (q.state === 'home') continue;
      q.c.update(dt);
      // the friend turns to its way; the arrow follows
      const r = q.c.root.rotation.y; if (q.state !== 'run') q.c.root.rotation.y = r + Math.atan2(Math.sin(q.goalYaw - r), Math.cos(q.goalYaw - r)) * Math.min(1, dt * 10);
      const az = q.arrowYaw + Math.PI, a0 = q.arrow.rotation.z; q.arrow.rotation.z = a0 + Math.atan2(Math.sin(az - a0), Math.cos(az - a0)) * Math.min(1, dt * 12);
      // a hidden friend's bush shivers now and then
      if (q.state === 'hid' && q.bush) q.bush.f.group.rotation.z = (this.t + q.id) % 2.2 < .35 ? Math.sin(this.t * 40) * .06 : 0;
    }
    // the friends who can go now glow (at the start, and after two bonks in a row)
    if (this.glowT > 0) this.glowT -= dt;
    const live = this.live();
    for (const q of live) { const free = this.glowT > 0 && q.state === 'idle' && wayClear(q, live, this.rocks, this.n); const s = free ? 1 + Math.abs(Math.sin(this.t * 6)) * .22 : 1; if (!this.lock.has(q)) q.arrow.scale.setScalar(s); }
    if (this.phase !== 'play' || this.result) return;
    this.left -= dt;
    this.clockI.style.width = Math.max(0, this.left / this.lv.time * 100) + '%';
    this.clock.classList.toggle('hurry', this.left < 10);
    // the light goes golden as the sun sets
    if ((this._lt = (this._lt || 0) - dt) <= 0) { this._lt = .5; const k = 1 - Math.max(0, this.left / this.lv.time); L.world.setLight({ ...DUSK, sunColor: new THREE.Color('#ffd9b0').lerp(new THREE.Color('#ff9a6b'), k).getStyle(), amb: 1.4 - .35 * k }); }
    if (this.left <= 0) this.finish(false);
  }
  async finish(done) {
    if (this.result) return;
    const L = this.L, LV = this.lv; this.phase = 'end';
    const stars = done ? (this.bonks === 0 ? 3 : this.bonks <= 2 ? 2 : 1) : 0, win = stars >= 1;
    this.result = win ? 'win' : 'fail';
    L.log({ result: this.result, lv: this.lvIdx, stars, max: 3, home: this.home, bonks: this.bonks });
    if (win) { L.audio.sfx('win'); L.world.fx.confetti(70); this.me.setFace('happy'); this.me.pose = 'cheer'; L.say(this.me, '다들 잘 가~ 내일 또 숨바꼭질!', 1500); }
    else { L.audio.sfx('lose'); this.me.setFace('sweat'); L.say(this.me, '해가 져 버렸다…', 1300); for (const q of this.live()) { q.c.setFace('sad'); } }
    await this.tw.wait(1.3); if (this.dead) return;
    const h = L.h, last = this.lvIdx >= LEVELS.length - 1;
    L.ui.panel({ title: win ? '모두 집에 갔다!' : '해가 졌다~', color: win ? 'green' : 'orange', body: [
      h('div', { class: 'gh-stars' }, ...[0, 1, 2].map(k => h('span', { class: k < stars ? 'on' : '' }, '★'))),
      h('div', { class: 'txt' }, `${this.home}/${this.pieces.length}명 집에 감 · 꽝 ${this.bonks}번`),
      h('div', { class: 'txt' }, win ? (stars >= 3 ? '한 번도 안 부딪혔어! 길 찾기 달인' : '꽝 없이 보내면 별 셋!') : '앞길이 열린 친구부터 보내 봐')],
      buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
        this.nextBtn = L.ui.btn(win ? (last ? '처음부터' : '다음 동네') : '다시 하기', { color: win ? 'green' : 'orange', cls: 'big', onClick: () => L.go({ lv: win ? (last ? 0 : this.lvIdx + 1) : this.lvIdx }) })] });
  }
  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.removeEventListener('pointerdown', this._down); app.classList.remove('gh');
    for (const o of this.objs) { W.root.remove(o); disposeTree(o); }
    document.querySelectorAll('.gh-get').forEach(e => e.remove());
    W.camLock = false;
  }

  // ── bots (QA): smart sends whoever the solver says (finds bush friends first when nobody can go); random taps anyone
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 2.5 && this.L.ui.panelOpen) { this._endT = 0; this.nextBtn?.press(); } return; }
    if (this.phase !== 'play') return;
    if ((this._bt = (this._bt || 0) - dt) > 0) return; this._bt = mode === 'random' ? .45 + Math.random() * .4 : .55;
    const live = this.live().filter(q => !this.lock.has(q)); if (!live.length) return;
    if (mode === 'random') return this.tapPiece(live[Math.floor(Math.random() * live.length)]);
    const all = this.live(), hid = live.find(q => q.state === 'hid');
    const next = solve(all, this.rocks, this.n);
    if (next && next.state === 'idle' && !this.lock.has(next)) return this.tapPiece(next);
    if (hid) return this.tapPiece(hid);
  }
  state() { return { scene: 'gohome', lv: this.lvIdx + 1, phase: this.phase, result: this.result || null, home: this.home, total: this.pieces?.length, bonks: this.bonks, left: +(this.left || 0).toFixed(1), hidden: this.pieces?.filter(q => q.state === 'hid').length }; }
  get api() { return { finish: () => { this.left = 0; }, solve: () => solve(this.live(), this.rocks, this.n)?.kind || null }; }
}

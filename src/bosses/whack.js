// 두더지 숨바꼭질 — a 35-second break between stages. 몽글이 is 술래 in the park: friends pop out of nine bushes (the bush
// rustles first, then splits open); tap the friend — or its bush — and it jumps right out ("들켰다~!") and ducks back.
// Spice: 너굴이 pops up too (tap him = −1, he points and laughs), later in disguise (bunny ears, but the mask and the
// striped tail give him away); two friends stacked in one bush (+2); a rare golden guest (+3); six in a row = 피버타임
// (×2, everything pops); spamming empty bushes makes 몽글이 dizzy; at the end 몽글이 calls "못 찾겠다 꾀꼬리~!" and
// everyone left pops out laughing.
import * as THREE from 'three';
import { Room } from '../room.js';
import { THEMES } from '../stages.js';
import { Char, CHAR_DEFS, defineChar } from '../gfx/chars.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree } from '../gfx/kit.js';
import { tr } from '../i18n.js';
import { WHACK_CARD } from '../script.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const SUNNY = { ambColor: '#fff2e4', amb: 1.55, sunColor: '#fff6e8', sun: 2.4 };
const FRIENDS = ['bunny', 'frog', 'hamster', 'squirrel', 'shiba', 'panda', 'cheese', 'sleepy', 'dj', 'calico', 'peng', 'bear'];
const LINES = {
  bunny: '들켰다~!', frog: '개굴! 찾았네?', hamster: '볼 빵빵~ 들켰다!', squirrel: '도토리 줄게!', shiba: '멍! 들켰당', panda: '…벌써?',
  cheese: '냥~ 들켰다', sleepy: '쿨… 어? 들켰다', dj: '둠칫! 찾았구나', calico: '삼색이 등장~', peng: '펭! 들켰다', bear: '곰돌이 여기!',
};
const TAUNTS = ['메롱~ 나였지롱!', '하나 빼기~!', '속았지? 헤헤', '나는 술래 편이야~'];
const SIZE = 1.4;
const BUSH = 1.45;   // the bushes, scaled up so they read as bushes (not clover) and a friend fits inside   // friends stand a little bigger than in the stages, so the face is a clear target

// 너굴이 in disguise: a friend's ears on top — but the dark mask round the eyes and the striped tail give him away
if (!CHAR_DEFS.raccoon_bunny) defineChar('raccoon_bunny', { ...CHAR_DEFS.raccoon, name: '토끼인 척 너굴이', ear: 'bunny', earC: '#ffb3cd' });
if (!CHAR_DEFS.raccoon_kitty) defineChar('raccoon_kitty', { ...CHAR_DEFS.raccoon, name: '고양이인 척 너굴이', ear: 'kitty', earC: '#ffc2cf' });

// three variants (one is picked each time the break comes round): more raccoons, disguises, stacks and pace
const LEVELS = [
  { name: '공원 수풀', time: 35, bad: .18, disguise: 0, pair: .07, gap: [.6, .9], stay: [1.0, 1.5], stars: [12, 22, 32] },
  { name: '변장한 너굴이', time: 35, bad: .2, disguise: .45, pair: .1, gap: [.55, .85], stay: [.95, 1.4], stars: [12, 22, 32], newBad: true },
  { name: '피버 수풀', time: 35, bad: .22, disguise: .5, pair: .16, gap: [.5, .8], stay: [.85, 1.3], stars: [14, 26, 38] },
];

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; }
  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world, ui = L.ui;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx];
    this.addCss();
    const app = document.getElementById('app'); app.dataset.night = ''; app.classList.add('wh');
    L.setBg(['#eaf8e4', '#d4efd0']); W.setLight(SUNNY);
    // a park lawn with a 3×3 grid of bushes; 몽글이 stands at the front with its hands at its mouth
    const layout = { w: 7, d: 6, theme: THEMES.park2 || THEMES.park1, bleed: {}, walls: { N: 'fence', W: 'hedge', S: 'none', E: 'none' },
      furniture: [F('tree', 0, 0), F('bench', 2, 0), F('planter', 4, 0), F('tree', 6, 0),
        F('bush', 1, 1), F('bush', 3, 1), F('bush', 5, 1), F('bush', 1, 3), F('bush', 3, 3), F('bush', 5, 3), F('bush', 1, 5), F('bush', 3, 5), F('bush', 5, 5)] };
    const room = this.room = new Room(W, layout); W.root.add(room.group);
    for (const r of room.furns) if (r.type === 'bush') r.f.group.scale.setScalar(BUSH);
    room.group.updateMatrixWorld(true);
    this.holes = room.furns.filter(r => r.type === 'bush').map(rec => {
      const b = new THREE.Box3().setFromObject(rec.f.group), c = b.getCenter(new THREE.Vector3());
      return { rec, part: rec.f.parts[0], p: new THREE.Vector3(c.x, 0, c.z), top: b.max.y, who: null, cool: 0, rustle: 0, open: 0 };
    });
    // 몽글이, the seeker, at the front edge
    const me = this.me = new Char('mong'); me.root.position.set(.2, 0, 3.45); me.root.scale.setScalar(1.3); W.root.add(me.root);
    me.faceTo(0, 0); me.pose = 'cover';
    this.score = 0; this.combo = 0; this.best = 0; this.fever = 0; this.found = 0; this.dizzy = 0; this.misses = [];
    this.goldenAt = 8 + Math.random() * 16; this.goldenDone = false; this.spawnT = .6; this.left = LV.time; this.result = null; this.phase = 'count';
    this.frame();
    L.makeThumbs({ faces: [['mong', 'happy'], ['mong', 'dizzy'], ['raccoon', 'happy'], ['raccoon_bunny', 'normal'], ['bunny', 'happy'], ['frog', 'happy'], ['hamster', 'happy']] });
    this.buildHud();
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    // the count: "셋, 둘, 하나… 찾는다!"
    for (const n of ['셋', '둘', '하나']) { if (this.dead) return; L.say(me, n, 520, 'count'); L.audio.sfx('tick'); await this.tw.wait(.55); }
    if (this.dead) return;
    me.pose = 'point'; me.setFace('happy'); L.say(me, '찾는다~!', 900); L.audio.sfx('special');
    this.phase = 'play';
    if (LV.newBad) this.gotCard();
  }
  addCss() {
    if (document.getElementById('wh-css')) return;
    const l = document.createElement('link'); l.id = 'wh-css'; l.rel = 'stylesheet'; l.href = new URL('./whack.css', import.meta.url).href; document.head.append(l);
  }
  frame() {
    const W = this.L.world;
    // (user 10/29 on the phone: "아주 약간 왼쪽으로, 오른쪽 상단 애가 잘려서" and the result card covered the bottom row) the board a
    // touch left and higher, clear of the card
    W.home.set(-.08, .45, .63); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = .95; W.zoom = 1;
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(7.0, 5.6, .45);
  }
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col(), LV = this.lv;
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, '두더지 숨바꼭질', h('small', {}, LV.name)));
    this.clock = h('div', { class: 'wh-clock' }, this.clockI = h('i'), this.clockN = h('b', { class: 'ol' }, String(LV.time)));
    top.append(this.clock);
    col.append(top);
    // the score, big, with the three star marks on a bar under it
    const max = LV.stars[2] * 1.15;
    this.scoreEl = h('div', { class: 'wh-score ol' }, '0');
    this.bar = h('div', { class: 'wh-bar' }, this.barI = h('i'), ...LV.stars.map((s, k) => h('span', { class: 'wh-mark', style: `left:${s / max * 100}%` }, '★'.repeat(k + 1))));
    this.barMax = max;
    col.append(h('div', { class: 'wh-head' }, this.scoreEl, this.bar));
    // 아래 빈 자리 = 규칙 카드 (스토리 룸 10/19 — user, on the empty grass under the bushes: "너구리 안 되는 경고"): it stays the
    // whole game (the old line went at the first point, just as 너굴이 starts coming); pictures first — the friends you tap,
    // 너굴이 you don't (and in the disguise rounds, his mask under bunny ears); his side bounces while he is up, shakes on a miss
    const face = k => h('img', { src: L.thumbs['face_' + k] || '', alt: '' });
    const ban = k => h('span', { class: 'wh-ban' }, face(k));   // (user 10/19: a round 'no' sign over 너굴이's face, not a corner ✕)
    // (10/19 evening, user: "너구리 얼굴만 크게, 밑에 금지 원에 하나 있으면 됨. 다른 눌러도 되는 애 표시 안 할게") just 너굴이 in a big
    // no-entry ring (the disguise rounds add his bunny-eared mask); no friends card, no words
    this.rule = h('div', { class: 'wh-rule' },
      this.ruleBad = h('div', { class: 'wh-rs no solo' }, h('div', { class: 'wh-rf' }, ban('raccoon_happy'), ...(LV.disguise ? [ban('raccoon_bunny_normal')] : []))));
    void WHACK_CARD;
    col.append(this.rule);
    this.feverEl = h('div', { class: 'wh-fever' }); document.getElementById('app').append(this.feverEl);
  }
  gotCard() {
    const L = this.L, h = L.h;
    const c = h('div', { class: 'wh-get' }, h('img', { src: L.thumbs.face_raccoon_bunny_normal }), h('div', {}, h('div', { class: 'wh-get-t ol' }, '새로 나왔다!'), h('div', { class: 'wh-get-s' }, '토끼인 척 너굴이 — 눈가 무늬와 줄무늬 꼬리를 봐!')));
    document.getElementById('app').append(c); L.audio.sfx('gasp');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2600);
  }
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => { if (e.button > 0 || this.result || this.phase !== 'play') return; this.tap(e.clientX, e.clientY); };
    app.addEventListener('pointerdown', this._down);
  }

  // ── pops
  spawn() {
    const LV = this.lv, free = this.holes.filter(o => !o.who && o.cool <= 0); if (!free.length) return;
    const hole = free[Math.floor(Math.random() * free.length)];
    const golden = !this.goldenDone && LV.time - this.left >= this.goldenAt;
    let kind, bad = false, pair = false, disguised = false;
    if (golden) { kind = 'churro'; this.goldenDone = true; }
    else if (Math.random() < LV.bad) { bad = true; disguised = Math.random() < LV.disguise; kind = disguised ? (Math.random() < .5 ? 'raccoon_bunny' : 'raccoon_kitty') : 'raccoon'; }
    else { kind = FRIENDS[Math.floor(Math.random() * FRIENDS.length)]; pair = Math.random() < LV.pair; }
    const W = this.L.world;
    const mk = k => { const c = new Char(k); c.root.scale.setScalar(SIZE); c.root.position.set(hole.p.x, -1.2, hole.p.z); c.faceTo(W.cam.position.x, W.cam.position.z); W.root.add(c.root); return c; };
    const ch = mk(kind), chs = [ch];
    if (pair) { const k2 = FRIENDS.filter(k => k !== kind)[Math.floor(Math.random() * (FRIENDS.length - 1))]; const c2 = mk(k2); chs.push(c2); }
    ch.setFace(bad ? (disguised ? 'normal' : 'sus') : 'happy');
    const stay = (LV.stay[0] + Math.random() * (LV.stay[1] - LV.stay[0])) * (this.left < 10 ? .85 : 1) * (golden ? 1.4 : 1);
    const w = hole.who = { kind, chs, bad, disguised, golden, pair, state: 'rustle', t: .32, stay, hit: false };
    hole.rustle = 1;
    if (golden) { const s = W.toScreen(hole.p.clone().setY(1)); this.L.ui.floatText(s.x, s.y - 40, '반짝!', 'gold'); }
    W.idsDirty = true;
    return w;
  }
  stepHole(o, dt) {
    const w = o.who; o.cool -= dt;
    // the bush: a shiver while someone is about to come up, split open while they're up
    const want = !w ? 0 : w.state === 'rustle' ? .12 + Math.abs(Math.sin(this.t * 40)) * .12 : w.state === 'up' || w.state === 'jump' ? .8 : w.state === 'down' ? .2 : 0;
    o.open += (want - o.open) * (1 - Math.exp(-dt * 18)); o.part?.setOpen(o.open);
    o.rec.f.group.rotation.z = w?.state === 'rustle' ? Math.sin(this.t * 46) * .05 : 0;
    if (!w) return;
    w.t -= dt;
    const set = y => w.chs.forEach((c, i) => { c.root.position.y = i === 0 ? y : y + w.chs[0].headTop() * .9; });
    if (w.state === 'rustle') {
      if (Math.random() < dt * 14) { const s = this.L.world.toScreen(o.p.clone().setY(o.top)); this.L.world.fx.burst(s.x + (Math.random() - .5) * 30, s.y, { n: 2, colors: ['#6fcf68', '#4fae52'], shape: 'circle', size: 6, speed: 90, life: .4, gravity: 300, up: 80 }); }
      if (w.t <= 0) {
        w.state = 'up'; w.t = w.stay; this.L.audio.sfx('hop');
        const y1 = o.top - .32; this.tw.run(.16, k => { if (w.state === 'up') set(-1.2 + (y1 + 1.2) * k); }, ease.outBack);
        w.chs.forEach(c => { c.pose = w.bad ? (w.disguised ? 'wave' : 'hips') : ['wave', 'clap', 'cheer', 'idle'][Math.floor(Math.random() * 4)]; });
        if (w.golden) this.L.say(w.chs[0], '추로님한테 츄르 줄 거야?', 900);
      }
    } else if (w.state === 'up') {
      // peeking: a little look left and right
      w.chs.forEach((c, i) => { c.root.rotation.y += Math.sin(this.t * 5 + i) * dt * .8; });
      if (w.t <= 0) this.sink(o, false);
    }
  }
  sink(o, hit) {
    const w = o.who; if (!w || w.state === 'down') return;
    w.state = 'down';
    const y0 = w.chs[0].root.position.y;
    this.tw.run(.18, k => w.chs.forEach((c, i) => { c.root.position.y = (i === 0 ? y0 : y0 + w.chs[0].headTop() * .9) + (-1.3 - y0) * k; }), ease.inQuad).then(() => {
      for (const c of w.chs) { this.L.world.root.remove(c.root); disposeTree(c.root); }
      if (o.who === w) o.who = null; o.cool = .25;
    });
    if (!hit && !w.bad) { this.combo = 0; this.updCombo(); }   // a friend slipped back in unfound: the run is over
  }
  // the tapped one jumps right out (뿅), spins, and ducks back in
  jumpOut(o, hold) {
    const w = o.who, y0 = w.chs[0].root.position.y, top = o.top + .55, r0 = w.chs.map(c => c.root.rotation.y);
    w.state = 'jump';
    return this.tw.run(.24, k => w.chs.forEach((c, i) => { c.root.position.y = (i === 0 ? y0 : y0 + w.chs[0].headTop() * .9) + (top - y0) * k; c.root.rotation.y = r0[i] + k * Math.PI * 2 * (w.bad ? 0 : 1); }), ease.outBack)
      .then(() => this.tw.wait(hold)).then(() => { if (o.who === w) { w.state = 'up'; this.sink(o, true); } });
  }

  // ── taps: the friend or its bush (a generous circle round the leaves)
  tap(x, y) {
    const L = this.L, W = L.world;
    if (this.dizzy > 0) { L.audio.sfx('dizzy'); return; }
    let best = null, bd = 1e9;
    for (const o of this.holes) {
      const sb = W.toScreen(o.p.clone().setY(o.top * .6)), d1 = Math.hypot(sb.x - x, sb.y - y);
      let d = d1 < 62 ? d1 : 1e9;
      if (o.who && (o.who.state === 'up' || o.who.state === 'rustle')) { const sc = W.toScreen(o.who.chs[0].root.position.clone().setY(o.who.chs[0].root.position.y + .45)); const d2 = Math.hypot(sc.x - x, sc.y - y); if (d2 < 70) d = Math.min(d, d2 * .8); }
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) return;
    const w = best.who;
    if (!w || w.hit || !(w.state === 'up' || (w.state === 'rustle' && w.t < .12))) return this.whiff(best, x, y);
    w.hit = true;
    if (w.state === 'rustle') { w.state = 'up'; w.chs.forEach(c => { c.root.position.y = best.top - .32; }); }
    const s = W.toScreen(w.chs[0].root.position.clone().setY(best.top + .9));
    if (w.bad) {
      // the wrong one: 너굴이 leaps out, points and laughs at you; the screen shakes; the run is broken
      this.score = Math.max(0, this.score - 1); this.combo = 0; this.updCombo();
      L.audio.sfx('locked'); L.audio.sfx('miss');
      const c = w.chs[0]; c.setFace('happy'); c.pose = 'point';
      L.say(c, w.disguised ? '토끼인 줄 알았지? 헤헤' : TAUNTS[Math.floor(Math.random() * TAUNTS.length)], 1100, 'red');
      L.ui.floatText(s.x, s.y - 20, '-1', 'red big');
      this.ruleBad.classList.remove('hit'); void this.ruleBad.offsetWidth; this.ruleBad.classList.add('hit');   // (규칙 카드: that was him)
      W.fx.ring(s.x, s.y + 30, { r: 70, color: '#ff5d6c', width: 8, life: .45 });
      document.getElementById('app').animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 280 });
      this.me.setFace('sad'); setTimeout(() => !this.dead && this.me.setFace('happy'), 700);
      this.jumpOut(best, .7);
      L.log({ tap: 'bad', t: +this.t.toFixed(1) });
    } else {
      const base = w.golden ? 3 : w.pair ? 2 : 1, gain = base * (this.fever > 0 ? 2 : 1);
      this.score += gain; this.found += w.chs.length; this.combo++; this.best = Math.max(this.best, this.combo);
      L.audio.sfx('pop', 2 + Math.min(10, this.combo)); if (w.golden) L.audio.sfx('star');
      w.chs.forEach(c => { c.setFace('wow'); c.pose = 'cheer'; });
      // each friend says its line the first time it's found this round (any more and the screen fills with bubbles)
      this.said = this.said || new Set();
      if (w.golden || !this.said.has(w.kind)) { this.said.add(w.kind); L.say(w.chs[0], w.golden ? '냐앙~ 들켰다! +3' : LINES[w.kind] || '들켰다~!', 750); }
      W.fx.burst(s.x, s.y + 20, { n: w.golden ? 26 : 12, shape: 'star', colors: w.golden ? ['#ffe14d', '#ffd23f', '#ffffff'] : undefined });
      L.ui.floatText(s.x, s.y - 30, `+${gain}`, w.golden || this.fever > 0 ? 'gold big' : 'gold');
      this.updCombo();
      if (this.combo === 8 && this.fever <= 0 && (this.fevers || 0) < 2) this.startFever();
      this.me.pose = 'cheer'; setTimeout(() => !this.dead && (this.me.pose = 'point'), 400);
      this.jumpOut(best, .3);
    }
    this.bump();
  }
  // an empty bush: a rustle and nothing; three in a second and 몽글이's head spins
  whiff(o, x, y) {
    const L = this.L; L.audio.sfx('tap', 4);
    L.ui.floatText(x, y - 20, '부스럭…', '');
    this.misses = this.misses.filter(t => this.t - t < 1.1); this.misses.push(this.t);
    if (this.misses.length >= 3) {
      this.dizzy = 1.1; this.misses = []; this.combo = 0; this.updCombo();
      this.me.setFace('dizzy'); L.say(this.me, '눈이 핑핑~', 900); L.audio.sfx('dizzy');
      setTimeout(() => !this.dead && this.me.setFace('happy'), 1100);
    }
  }
  startFever() {
    const L = this.L; this.fever = 5; this.fevers = (this.fevers || 0) + 1; L.audio.sfx('special'); L.audio.sfx('win');
    this.feverEl.classList.add('on'); L.ui.banner('피버타임!', '점수 두 배 · 다 튀어나와!', 1000);
    for (let k = 0; k < 3; k++) this.spawn();
  }
  updCombo() { this.scoreEl.dataset.combo = this.combo >= 2 ? tr(`${this.combo} 연속`) : ''; }   // (숨바꼭집: shown through CSS attr(), so translated here)
  bump() { this.scoreEl.textContent = String(this.score); this.scoreEl.classList.remove('pop'); void this.scoreEl.offsetWidth; this.scoreEl.classList.add('pop'); this.barI.style.width = Math.min(100, this.score / this.barMax * 100) + '%'; }

  // ── per frame
  update(dt) {
    const L = this.L, LV = this.lv;
    this.t += dt; this.tw.update(dt);
    if (!this.room || !this.me) return;   // (숨바꼭집: frames can run before the park is built)
    this.room.update(dt); this.me.update(dt);
    for (const o of this.holes) { this.stepHole(o, dt); o.who?.chs.forEach(c => c.update(dt)); }
    if (this.phase !== 'play' || this.result) return;
    this.left -= dt; this.dizzy = Math.max(0, this.dizzy - dt);
    if (this.fever > 0 && (this.fever -= dt) <= 0) { this.feverEl.classList.remove('on'); this.combo = 0; this.updCombo(); }
    const k = Math.max(0, this.left) / LV.time;
    this.clockI.style.width = (k * 100) + '%'; this.clockN.textContent = String(Math.max(0, Math.ceil(this.left)));
    this.clock.classList.toggle('hurry', this.left < 6);
    if (this.left < 5.5 && Math.ceil(this.left) !== this._lastN) { this._lastN = Math.ceil(this.left); if (this._lastN > 0) { L.ui.floatText(innerWidth / 2, innerHeight * .42, String(this._lastN), 'big'); L.audio.sfx('tick'); } }
    if (this.left <= 0) return this.finish();
    // pace: a pop every ~0.6–0.9 s, quicker near the end and in a fever; up to 3 at once (5 in a fever)
    const busy = this.holes.filter(o => o.who && o.who.state !== 'down').length, cap = this.fever > 0 ? 5 : this.left < 10 ? 4 : 3;
    if ((this.spawnT -= dt) <= 0 && busy < cap) {
      this.spawnT = (LV.gap[0] + Math.random() * (LV.gap[1] - LV.gap[0])) * (this.fever > 0 ? .45 : this.left < 10 ? .8 : 1);
      this.spawn(); if (this.fever > 0 && Math.random() < .5) this.spawn();
    }
    this.ruleBad.classList.toggle('warn', this.holes.some(o => o.who?.bad && !o.who.hit && (o.who.state === 'up' || o.who.state === 'rustle')));   // (규칙 카드: 너굴이 is out)
  }
  // time's up: "못 찾겠다 꾀꼬리~!" and everybody still hiding pops out laughing
  async finish() {
    if (this.result) return;
    const L = this.L, LV = this.lv; this.phase = 'end';
    const stars = LV.stars.filter(s => this.score >= s).length, win = stars >= 1;
    this.result = win ? 'win' : 'fail';
    this.feverEl.classList.remove('on');
    this.me.pose = 'cover'; this.me.setFace('sweat'); L.say(this.me, '못 찾겠다 꾀꼬리~!', 1300); L.audio.sfx('whoosh');
    await this.tw.wait(.6); if (this.dead) return;
    const pool = FRIENDS.slice().sort(() => Math.random() - .5);
    for (const [i, o] of this.holes.entries()) {
      if (o.who) continue;
      const c = new Char(pool[i % pool.length]); c.root.scale.setScalar(SIZE); c.root.position.set(o.p.x, -1.2, o.p.z); c.faceTo(L.world.cam.position.x, L.world.cam.position.z); c.setFace('happy'); c.pose = 'cheer';
      L.world.root.add(c.root); o.who = { kind: 'end', chs: [c], state: 'up', t: 99, stay: 99 };
      const y1 = o.top - .32; this.tw.run(.2, k => { c.root.position.y = -1.2 + (y1 + 1.2) * k; }, ease.outBack, i * .06);
    }
    L.world.idsDirty = true;
    setTimeout(() => { if (!this.dead) { const o = this.holes[4]; if (o.who) L.say(o.who.chs[0], '여기 있지롱~', 1200); L.audio.laugh(o.who?.chs[0]?.kind); } }, 500);
    L.log({ result: this.result, lv: this.lvIdx, score: this.score, stars, best: this.best, line: `${this.score}점 · 친구 ${this.found}명 찾음 · 최고 ${this.best}연속` });
    if (win) { L.audio.sfx('win'); L.world.fx.confetti(80); this.me.setFace('happy'); this.me.pose = 'cheer'; } else L.audio.sfx('lose');
    await this.tw.wait(1.4); if (this.dead) return;
    if (win && L.campaign) return L.go({});   // the campaign: the reward card (bossgame → gift.js) is the result screen — 10/19, 결과창 한 번만
    const h = L.h, last = this.lvIdx >= LEVELS.length - 1;
    L.ui.panel({ title: win ? '숨바꼭질 끝!' : '아쉽다~', color: win ? 'green' : 'orange', body: [
      h('div', { class: 'wh-stars' }, ...[0, 1, 2].map(k => h('span', { class: k < stars ? 'on' : '' }, '★'))),
      h('div', { class: 'txt' }, `${this.score}점 · 친구 ${this.found}명 찾음 · 최고 ${this.best}연속`),
      h('div', { class: 'txt' }, win ? (stars >= 3 ? '숨바꼭질 달인! 한 명도 못 숨었어' : '잘 찾았어! 8연속이면 피버타임이야') : `${LV.stars[0]}점부터 성공! 너굴이는 꾹 참기`)],
      buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
        this.nextBtn = L.ui.btn(win ? (last ? '처음 수풀부터' : '다음 수풀') : '다시 하기', { color: win ? 'green' : 'orange', cls: 'big', onClick: () => L.go({ lv: win ? (last ? 0 : this.lvIdx + 1) : this.lvIdx }) })] });
  }
  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.removeEventListener('pointerdown', this._down); app.classList.remove('wh');
    for (const o of this.holes) for (const c of o.who?.chs || []) { W.root.remove(c.root); disposeTree(c.root); }
    for (const o of [this.room.group, this.me.root]) { W.root.remove(o); disposeTree(o); }
    this.feverEl?.remove(); document.querySelectorAll('.wh-get').forEach(e => e.remove());
    document.getElementById('wh-css')?.remove(); W.camLock = false;
  }

  // ── bots (QA) tap through the same tap(): smart taps friends (golden and stacks first) a beat after they come up and
  // leaves 너굴이 alone; random taps a random bush now and then
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 2.5 && this.L.ui.panelOpen) { this._endT = 0; this.nextBtn?.press(); } return; }
    if (this.phase !== 'play') return;
    const W = this.L.world;
    if (mode === 'random') {
      if ((this._rt = (this._rt || 0) - dt) > 0) return; this._rt = .25 + Math.random() * .35;
      const o = this.holes[Math.floor(Math.random() * this.holes.length)], s = W.toScreen(o.p.clone().setY(o.top * .6)); this.tap(s.x, s.y); return;
    }
    if ((this._bt = (this._bt || 0) - dt) > 0) return; this._bt = .22;
    const ok = this.holes.filter(o => o.who && !o.who.bad && !o.who.hit && o.who.state === 'up' && o.who.stay - o.who.t > .2)
      .sort((a, b) => (b.who.golden ? 3 : b.who.pair ? 2 : 1) - (a.who.golden ? 3 : a.who.pair ? 2 : 1));
    if (ok[0]) { const s = W.toScreen(ok[0].p.clone().setY(ok[0].top * .6)); this.tap(s.x, s.y); }
  }
  state() { return { scene: 'whack', lv: this.lvIdx + 1, phase: this.phase, result: this.result || null, score: this.score, combo: this.combo, best: this.best, fever: +this.fever.toFixed(1), left: +(this.left || 0).toFixed(1), up: this.holes?.filter(o => o.who && o.who.state === 'up').length }; }
  get api() { return { finish: () => { this.left = 0; } }; }
}

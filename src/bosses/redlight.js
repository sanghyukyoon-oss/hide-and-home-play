// 무궁화 꽃이 피었습니다 — a ~40-second break between stages. 너굴이 is 술래 at the big tree at the top of the schoolyard;
// 몽글이 and three or four friends start at the chalk line. Hold anywhere = 몽글이 runs up the yard; let go = freeze.
// The chant is the whole game: its ten syllables light up one by one at the top with a changing beat (even, a slow drawl
// that suddenly rushes, all rush, a stall on "니……"), and on "다!" 너굴이 spins round — anyone still moving is out
// (three outs and he wins; each one sends 몽글이 three hops back).
// Spice: the friends race too and get caught first in silly ways (토순이 frozen with one leg up, 개굴이 stuck mid-hop,
// 햄찌's sneeze, 졸졸이 dozing then jolting awake, 멍뭉이's wagging tail, 펭펭이's wobble); caught friends stand by 너굴이
// holding hands, and when 몽글이 reaches him a tap on his back ("땡!") frees them all → everyone runs back to the line
// while 너굴이 gives chase. Later set-ups bring a "새로 나왔다!" twist: 킥킥 너굴이 (giggles, then snaps round mid-chant)
// and 두 번 돌아보기 (turns away, then round again before "무" — his hands aren't over his eyes yet).
// Time up: "몽글아~ 밥 먹어라~!".
import * as THREE from 'three';
import { Room } from '../room.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree } from '../gfx/kit.js';
import { LANG } from '../i18n.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const SUNNY = { ambColor: '#fff2e4', amb: 1.55, sunColor: '#fff6e8', sun: 2.4 };
// (숨바꼭집: in English the chant reads in romanized syllables, set here rather than through one-letter dictionary keys)
// the chant is sung in Korean in English too (user 10/20: "걍 한글로 해도 될거같아 영어라도" — known from Squid Game; the romanised
// syllables ran into each other); drawn from data-s so the translator leaves it — the rule is told in the line at the bottom
const SYL = ['무', '궁', '화', '꽃', '이', '피', '었', '습', '니', '다'];
const NAME = { mong: '몽글이', bunny: '토순이', frog: '개굴이', hamster: '햄찌', sleepy: '졸졸이', shiba: '멍뭉이', peng: '펭펭이' };
const PERSONA = { bunny: 'late', frog: 'hop', hamster: 'sneeze', sleepy: 'doze', shiba: 'wag', peng: 'wobble' };
const OUT_LINE = { late: '움직였다!', hop: '공중에 떠 있잖아!', sneeze: '에취 했지?', doze: '졸다 깼지?', wag: '꼬리 흔들었지?', wobble: '뒤뚱거렸지?', kik: '너도 속았지?', dbl: '한 번 더 봤지롱!' };
const CHAIN_LINES = ['몽글아 구해줘~!', '빨리 와~!', '땡 해줘!', '조금만 더!'];
const SIZE = 1.35;
const Z0 = 5.0, SZ = -5.3, REACH = SZ + 1.2, TREE_Z = -6.5, NPC_MIN = SZ + 2.3;
const RUN_V = 1.05, DASH_V = 2.5;
const LANES = { 3: [-1.85, -.92, 1.15], 4: [-1.9, -.95, .95, 1.9] };
const CHAIN = [[-.95, .15], [.95, .15], [-1.8, .35], [1.8, .35]];
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const pickW = o => { let s = 0; for (const k in o) s += o[k]; let r = Math.random() * s; for (const k in o) if ((r -= o[k]) < 0) return k; return Object.keys(o)[0]; };
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));

// three set-ups (one is picked each time the break comes round): more friends, faster chants, and a new trick each
const LEVELS = [
  { name: '운동장', time: 45, friends: ['bunny', 'frog', 'hamster'], mix: { even: 3, drawl: 2, rush: 1, stall: 2 }, grace: .3, kik: 0, dbl: 0, maxCatch: 1, par: 30, chase: 2.0 },
  { name: '킥킥 너굴이', time: 45, friends: ['bunny', 'frog', 'sleepy', 'shiba'], mix: { even: 2, drawl: 2, rush: 2, stall: 2 }, grace: .3, kik: .4, dbl: 0, maxCatch: 1, par: 31, chase: 2.05, card: 'kik' },
  { name: '두 번 돌아보기', time: 48, friends: ['bunny', 'hamster', 'sleepy', 'peng'], mix: { even: 1, drawl: 2, rush: 2, stall: 3 }, grace: .27, kik: .25, dbl: .4, maxCatch: 2, par: 40, chase: 2.1, card: 'dbl' },
];
const CARDS = {
  kik: ['킥킥 너굴이', '외치다 말고 휙! "킥" 소리 나면 바로 멈춰!'],
  dbl: ['두 번 돌아보는 너굴이', '곁눈질하면 또 돌아본다! "무" 소리 전엔 출발 금지!'],
};

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.ready = false; }
  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx];
    this.addCss();
    const app = document.getElementById('app'); app.dataset.night = ''; app.classList.add('rl');
    L.setBg(['#eaf8e4', '#d4efd0']); W.setLight(SUNNY);
    this.buildScene();
    this.frame();
    const faces = [['raccoon', 'happy'], ['raccoon', 'sus'], ['mong', 'happy']];
    for (const k of LV.friends) faces.push([k, 'normal'], [k, 'sad'], [k, 'happy']);
    L.makeThumbs({ faces });
    this.left = LV.time; this.result = null; this.phase = 'intro'; this.hold = false; this.chants = 0; this.close = 0; this.caughtN = 0; this.lastCatch = 'da';
    this.buildHud();
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    this.ready = true;
    // 너굴이 says he's it, then turns to the tree and covers his eyes
    const s = this.sul;
    s.ch.root.rotation.y = 0; s.ch.pose = 'wave'; s.ch.setFace('happy');
    L.say(s.ch, '내가 술래~!', 1000); L.audio.sfx('special');
    await this.tw.wait(1.05); if (this.dead) return;
    this.turnTo(s.ch, Math.PI, .3); s.ch.pose = 'cover';
    L.say(this.friends[0].ch, '가자~!', 800);
    await this.tw.wait(.4); if (this.dead) return;
    this.phase = 'play'; this.H.st = 'play'; s.st = 'pre'; s.t = 0; s.preT = .55; s.dbl = false;
    if (LV.card) this.gotCard(LV.card);
  }
  addCss() {
    if (document.getElementById('rl-css')) return;
    const l = document.createElement('link'); l.id = 'rl-css'; l.rel = 'stylesheet'; l.href = new URL('./redlight.css', import.meta.url).href; document.head.append(l);
  }

  // ── the yard: a long sandy strip up the middle of the park, 너굴이's tree at the top, the chalk line at the bottom
  buildScene() {
    const W = this.L.world, LV = this.lv;
    const layout = { w: 9, d: 14, theme: THEMES.park1, bleed: {}, walls: { N: 'fence', W: 'hedge', S: 'none', E: 'none' },
      floorZones: [{ i: 2, j: 0, w: 5, d: 14, kind: 'sand', a: '#f3dfb4', b: '#e9cf9d' }],
      furniture: [F('tree', 4, 0), F('slidetower', 0, 0), F('swings2', 7, 1), F('bench', 0, 4), F('springrider', 8, 4),
        F('planter', 0, 7), F('streetlamp2', 8, 7), F('tree', 0, 10), F('parkbin', 8, 10), F('bush', 1, 12), F('bush', 8, 12)] };
    const room = this.room = new Room(W, layout); W.root.add(room.group);
    for (const r of room.furns) if (r.type === 'tree' && r.i === 4) r.f.group.scale.setScalar(1.45);
    // chalk: the start line and a ring round the 술래's spot
    const deco = this.deco = new THREE.Group(); W.root.add(deco);
    const chalk = (geo, x, z, op = .85, color = '#ffffff') => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, .03, z); m.layers.set(2); m.renderOrder = 2; deco.add(m); return m; };
    chalk(new THREE.PlaneGeometry(5.2, .14), 0, Z0 + .5);
    chalk(new THREE.RingGeometry(.78, .88, 40), 0, SZ, .7);
    this.meRing = chalk(new THREE.RingGeometry(.4, .53, 36), 0, Z0, .95, '#ffd23f');   // "this one is you"
    this.meRing.position.y = .035;
    // 너굴이, the 술래
    const sc = new Char('raccoon'); sc.root.scale.setScalar(SIZE * 1.08); sc.root.position.set(0, 0, SZ); W.root.add(sc.root);
    this.sul = { ch: sc, st: 'idle', t: 0, si: 0, gaps: [], kind: 'even', next: 0, kikAt: -1, kikT: null, t0: -9, lookT: 0, busyUntil: 0, plan: [], aim: null, why: 'da', x: 0, z: SZ, chainSay: 4 };
    // 몽글이 in the middle lane, friends either side, all facing up the yard
    const hc = new Char('mong'); hc.root.scale.setScalar(SIZE); hc.root.position.set(0, 0, Z0); hc.root.rotation.y = Math.PI; W.root.add(hc.root);
    this.H = { ch: hc, st: 'ready', z: Z0, v: 0, ph: 0, relT: -9, ranAtRel: false, hearts: 3, dust: 0 };
    const lanes = LANES[LV.friends.length] || LANES[4];
    this.friends = LV.friends.map((k, i) => {
      const c = new Char(k); c.root.scale.setScalar(SIZE); c.root.position.set(lanes[i], 0, Z0 + rnd(-.1, .15)); c.root.rotation.y = Math.PI; W.root.add(c.root);
      if (k === 'sleepy') c.setFace('happy');
      return { ch: c, kind: k, p: PERSONA[k] || 'late', x: lanes[i], lane: lanes[i], z: c.root.position.z, st: 'ready', v: k === 'sleepy' ? .75 : rnd(.82, .95), ph: rnd(0, 6), wait: 0, stopAt: 8, late: false, asleep: false, sleepN: 0, stopT: -9, slot: -1 };
    });
    this.chainN = 0;
  }
  frame() {
    const W = this.L.world;
    W.home.set(0, .5, -1.2); W.target.copy(W.home); W.yaw = .1; W.pitch = .68; W.zoom = 1;
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(5.5, 7.7, .5);
  }
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col(), LV = this.lv;
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, '무궁화 꽃이 피었습니다', h('small', {}, LV.name)));
    this.clock = h('div', { class: 'rl-clock' }, this.clockI = h('i'), this.clockN = h('b', { class: 'ol' }, String(LV.time)));
    top.append(this.clock);
    col.append(top);
    this.syls = SYL.map((s, i) => h('span', { class: 'rl-syl ol' + (i === 9 ? ' da' : ''), 'data-s': s }));
    this.chantEl = h('div', { class: 'rl-chant' }, this.sulImg = h('img', { src: L.thumbs.face_raccoon_happy }), ...this.syls, h('div', { class: 'rl-kik ol' }, '킥!'));
    col.append(this.chantEl);
    this.heartEls = [0, 1, 2].map(() => h('span', {}, '♥'));
    this.frEls = this.friends.map(f => { const im = h('img', { src: L.thumbs[`face_${f.kind}_normal`] }); const d = h('div', { class: 'rl-fr' }, im); d.img = im; return d; });
    col.append(h('div', { class: 'rl-row' }, h('div', { class: 'rl-hearts' }, ...this.heartEls), h('div', { class: 'rl-friends' }, ...this.frEls)));
    this.hint = h('div', { class: 'rl-hint ol' }, '꾹 누르면 달리기 · 손 떼면 얼음!'); col.append(this.hint);
    this.tangEl = h('div', { class: 'rl-tang ol3', style: 'display:none' }, '콕! 땡!'); ui.wui.append(this.tangEl);
    this.vig = h('div', { class: 'rl-vig' }); document.getElementById('app').append(this.vig);
  }
  gotCard(key) {
    const L = this.L, h = L.h, [t, s] = CARDS[key];
    const c = h('div', { class: 'rl-get' }, h('img', { src: L.thumbs.face_raccoon_sus }), h('div', {}, h('div', { class: 'rl-get-t ol' }, '새로 나왔다!'), h('div', { class: 'rl-get-s' }, h('b', {}, t), h('br'), s)));
    document.getElementById('app').append(c); L.audio.sfx('gasp');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2700);
  }
  bindInput() {
    const app = document.getElementById('app'); this.ptrs = new Set();
    this._down = e => { if (e.button > 0) return; this.ptrs.add(e.pointerId); this.press(); };
    this._up = e => { this.ptrs.delete(e.pointerId); if (!this.ptrs.size) this.release(); };
    this._blur = () => { this.ptrs.clear(); this.release(); };
    app.addEventListener('pointerdown', this._down); addEventListener('pointerup', this._up); addEventListener('pointercancel', this._up); addEventListener('blur', this._blur);
  }
  // the one input: press = run (or "땡!" once you're at his back), release = freeze
  press() {
    // (QA3 10/19) at his back a second finger's tap is the 땡 too — it used to wait for the first finger to lift
    if (this.H?.st === 'reach' && this.phase === 'play' && !this.result) { this.hold = true; return this.tryTang(); }
    if (this.hold) return; this.hold = true;
  }
  release() {
    if (!this.hold) return; this.hold = false;
    if (this.H) { this.H.relT = this.t; this.H.ranAtRel = this.H.v > .6; }
  }
  danger() { const s = this.sul; return s.st === 'look' && this.t - s.t0 >= this.lv.grace; }

  // ── 너굴이
  turnTo(c, yaw, dur, e = ease.outBack) {
    const r0 = c.root.rotation.y, d = wrapA(yaw - r0); this.tw.kill(c);
    return this.tw.run(dur, k => { c.root.rotation.y = r0 + d * k; }, e, 0, c);
  }
  makeChant() {
    const LV = this.lv, n = this.chants++;
    const kind = n === 0 ? 'even' : pickW(LV.mix);
    let g;
    if (kind === 'even') { const b = n === 0 ? .38 : rnd(.28, .37), exact = n === 0 && this.L.audio.hasFile?.('mugunghwa'); g = SYL.map(() => b * (exact ? 1 : rnd(.9, 1.1))); }   // (the first chant on the beat of a chant file, if there is one — 10/20)
    else if (kind === 'drawl') { const cut = 4 + Math.floor(Math.random() * 3); g = SYL.map((_, i) => i < cut ? rnd(.48, .6) : rnd(.11, .14)); }
    else if (kind === 'rush') g = SYL.map(() => rnd(.13, .17));
    else { const b = rnd(.24, .3); g = SYL.map((_, i) => i === 9 ? rnd(.9, 1.6) : b * rnd(.9, 1.1)); }
    g[0] = 0;
    // 킥킥 너굴이: some chants stop short — a giggle, then he snaps round
    const kikAt = LV.kik && n >= 1 && Math.random() < LV.kik ? 3 + Math.floor(Math.random() * 5) : -1;
    return { kind, gaps: g, kikAt };
  }
  startChant() {
    const s = this.sul, c = this.makeChant();
    Object.assign(s, { st: 'chant', t: 0, si: 0, next: 0, kikT: null, gaps: c.gaps, kind: c.kind, kikAt: c.kikAt });
    s.jingle = this.chants === 1 && !!this.L.audio.hasFile?.('mugunghwa'); if (s.jingle) this.L.audio.sfx('mugunghwa');   // 구호 파일 (audio/gpt/sfx-mugunghwa.mp4)
    s.ch.pose = 'cover'; s.ch.setFace('happy');
    this.chantEl.className = 'rl-chant safe'; this.setSyl(0);
    for (const f of this.friends) this.npcChant(f);
    // a little chatter from the runners now and then
    const run = this.friends.filter(f => f.st === 'run');
    if (run.length && Math.random() < .3) { const f = pick(run); this.L.say(f.ch, f.late ? pick(['내가 1등~!', '쌩~!']) : pick(['살금살금…', '헥헥', '간다~!']), 650); }
  }
  sayNext() {
    const s = this.sul, L = this.L;
    s.si++; s.ch.bump(.14);
    if (!s.jingle) { if (L.audio.voiceOn && L.audio.voice) L.audio.voice(SYL[s.si - 1], 'raccoon', { one: true }); else L.audio.sfx('hop', s.si); }   // 너굴이 says each syllable (목소리 off: the old hop)
    this.setSyl(s.si);
    if (s.si >= SYL.length) return this.turn('da');
    if (s.kikAt === s.si) { s.kikT = s.t + (this.lvIdx >= 2 ? .5 : .58); L.say(s.ch, '킥킥', 500, 'think'); L.audio.sfx('giggle'); this.chantEl.classList.add('kik'); s.ch.rx.fluff = 1; return; }
    s.next += s.gaps[s.si];
    if (s.si === 9 && s.gaps[9] > .6) { this.chantEl.classList.add('stall'); L.say(s.ch, '흐음~', Math.min(900, s.gaps[9] * 800), 'think'); L.audio.sfx('hmm'); }   // the stall: "니……" — wait for it
  }
  setSyl(si) {
    this.syls.forEach((e, i) => { const on = i < si; e.classList.toggle('on', on); if (i === si - 1) { e.classList.remove('now'); void e.offsetWidth; e.classList.add('now'); } else e.classList.remove('now'); });
  }
  turn(why) {
    const s = this.sul, L = this.L;
    Object.assign(s, { st: 'look', why, t: 0, t0: this.t, aim: null, lookT: rnd(1.2, 1.75), checked: false, plan: [], kikT: null, dbl: false });
    s.ch.rx.fluff = 0;
    this.turnTo(s.ch, 0, .18); s.ch.setFace('sus'); s.ch.pose = 'hips';
    L.audio.sfx('whoosh'); L.audio.sfx('tock');
    L.say(s.ch, why === 'da' ? '다!' : why === 'kik' ? '휙~!' : '한 번 더~!', 650, 'red');
    this.chantEl.className = 'rl-chant look'; this.vig.classList.add('on'); this.sulImg.src = L.thumbs.face_raccoon_sus;
    if (why === 'dbl') this.setSyl(0);
    this.planLook(why);
  }
  turnBack() {
    const s = this.sul, LV = this.lv;
    s.st = 'back'; s.t = 0; s.aim = null;
    // 두 번 돌아보기: sometimes he only half turns away — peeking over his shoulder ("흘끔") — and spins round again before "무"
    s.dbl = !!LV.dbl && s.why !== 'dbl' && this.chants >= 2 && Math.random() < LV.dbl;
    this.turnTo(s.ch, s.dbl ? Math.PI - 1.75 : Math.PI, .28, ease.outCubic); s.ch.setFace(s.dbl ? 'sus' : 'happy'); s.ch.pose = s.dbl ? 'hips' : 'cover';
    if (s.dbl) this.L.say(s.ch, '흘끔…', 600, 'think');
    this.chantEl.className = 'rl-chant'; this.vig.classList.remove('on'); this.sulImg.src = this.L.thumbs[s.dbl ? 'face_raccoon_sus' : 'face_raccoon_happy']; this.setSyl(0);
    for (const f of this.friends) if (f.st === 'late') { f.st = 'stop'; }
    // a greedy friend jumps the gun now and then (and gets caught by the second look)
    for (const f of this.friends) { f.early = s.dbl && f.p === 'late' && f.st === 'stop' && !f.asleep && Math.random() < .6; if (f.early) f.late = true; }
    s.si = 0;
  }
  stepSul(dt) {
    const s = this.sul, LV = this.lv; s.t += dt;
    if (s.st === 'pre') {
      if (s.dbl && s.t >= .5) return this.turn('dbl');
      if (!s.dbl && s.t >= s.preT) this.startChant();
    } else if (s.st === 'chant') {
      if (s.kikT != null) { if (s.t >= s.kikT) this.turn('kik'); }
      else while (s.st === 'chant' && s.kikT == null && s.t >= s.next) this.sayNext();
    } else if (s.st === 'look') {
      const c = s.ch;
      // scanning the yard, or pointing at whoever moved
      const goal = s.aim ? Math.atan2(s.aim.x - s.x, s.aim.z - s.z) : Math.sin(s.t * 2.4) * .26;
      if (s.t > .2) c.root.rotation.y += wrapA(goal - c.root.rotation.y) * (1 - Math.exp(-dt * 14));
      if (this.danger()) {
        if (!s.checked) { s.checked = true; this.lookStart(); }
        const H = this.H;
        if (H.st === 'play' && H.v > .15) this.heroCaught(s.why);
        this.runPlan();
      }
      if (s.t >= s.lookT && this.t >= s.busyUntil && !s.plan.length) this.turnBack();
    } else if (s.st === 'back') {
      if (s.t >= .3) { s.st = 'pre'; s.t = 0; s.preT = rnd(.3, .65); }
    }
  }
  // the moment the look "counts": a near miss for 몽글이 gets a cheer
  lookStart() {
    const H = this.H, L = this.L;
    if (H.st === 'play' && H.v <= .15 && H.ranAtRel && this.t - H.relT < .45) {
      this.close++; const p = L.world.toScreen(H.ch.root.position.clone().setY(1.6));
      L.ui.floatText(p.x, p.y, '아슬아슬 세이프!', 'gold'); L.audio.sfx('phew');
    } else if (H.st === 'play' && H.v <= .15 && !this._iceSaid && H.z < Z0 - .3) { this._iceSaid = true; L.say(H.ch, '얼음!', 650); }
    // (the rule line stays at the bottom the whole game now — user 10/20: "룰만 알려주면 될듯 아래쪽 빈곳에")
  }

  // ── the friends: run while he chants, stop (mostly) in time, and get caught in their own silly way
  npcChant(f) {
    if (!['ready', 'stop', 'run'].includes(f.st)) return;
    const c = f.ch;
    if (f.asleep) { if (--f.sleepN > 0) return; f.asleep = false; c.setFace('wow'); this.L.say(c, '어? 나 졸았어?', 800); }
    this.unfreeze(f);
    f.st = 'run'; f.wait = rnd(.05, .35); f.stopAt = pick([7, 8, 8, 9]);
    const first = this.chants === 1;
    f.late = false;
    if (f.p === 'late') f.late = first || Math.random() < .48;   // the first look always catches the greedy one: the rule, shown
    else if (f.p === 'hop') f.late = !first && Math.random() < .35;
    else if (f.p === 'wobble') f.stopAt = pick([8, 9, 9]);
    if (f.late) f.stopAt = 99;
    f.dozeAt = f.p === 'doze' && !first && Math.random() < .4 ? 2 + Math.floor(Math.random() * 5) : 0;
  }
  moveNpc(f, dt, dir = -1, v = f.v) {
    const c = f.ch;
    f.z += dir * v * dt; if (dir < 0 && f.z < NPC_MIN) { f.z = NPC_MIN; if (f.st === 'run') { this.stopNpc(f); return; } }
    c.root.position.z = f.z; c.root.position.x = f.x;
    if (f.p === 'hop' && dir < 0) {
      f.ph += dt * 7.5; c.body.position.y = Math.abs(Math.sin(f.ph)) * .36; c.pose = 'idle'; c.rx.rx = .05;
    } else this.runAnim(c, 1, f.ph += dt * 13);
  }
  runAnim(c, k, ph) {
    c.body.position.y = Math.abs(Math.sin(ph)) * .09 * k;
    c.rx.rx = .2 * k; c.pose = k > .3 ? 'search' : 'idle';
    if (c.feet?.length === 2) { c.feet[0].position.y = .035 + Math.max(0, Math.sin(ph)) * .12 * k; c.feet[1].position.y = .035 + Math.max(0, -Math.sin(ph)) * .12 * k; }
  }
  unfreeze(f) {
    const c = f.ch; c.lean = 0; c.rx.rx = 0; c.rx.wag = 0; c.body.position.y = 0; c.pose = 'idle'; f.frozen = false;
    if (c.feet?.length === 2) c.feet.forEach(ft => { ft.position.y = .035; });
    c.setFace(f.kind === 'sleepy' ? 'happy' : 'normal');
  }
  // a safe stop: frozen in some pose or other (a foot left in the air now and then)
  stopNpc(f) {
    const c = f.ch; f.st = 'stop'; f.stopT = this.t; f.frozen = true;
    c.pose = pick(['count', 'phones', 'hips', 'stretch', 'point', 'cross']); c.lean = rnd(-.14, .14); c.rx.rx = rnd(.04, .16); c.body.position.y = 0; c.bump(.2);
    if (c.feet?.length === 2) { c.feet[0].position.y = .035; c.feet[1].position.y = Math.random() < .35 ? .17 : .035; }
  }
  doze(f) {
    const c = f.ch; this.stopNpc(f); f.asleep = true; f.sleepN = 2 + Math.floor(Math.random() * 2);
    c.pose = 'idle'; c.lean = .12; c.rx.rx = .1; c.setFace('normal');   // 졸졸이's resting face is asleep (Zzz)
    this.L.say(c, '쿨…', 700, 'think');
  }
  // a late runner freezes a beat too late, in the silliest pose
  lateFreeze(f) {
    const c = f.ch; f.frozen = true;
    if (f.p === 'hop') { c.body.position.y = Math.max(c.body.position.y, .32); c.pose = 'flail'; }
    else { c.pose = 'flail'; c.lean = .32 * (f.x < 0 ? 1 : -1); c.rx.rx = .3; if (c.feet?.length === 2) { c.feet[0].position.y = .035; c.feet[1].position.y = .27; } c.body.position.y = 0; }
    c.setFace('wow');
  }
  // at the turn: who's still running gets caught (up to the set-up's limit); then maybe one silly slip mid-look
  planLook(why) {
    const s = this.sul, LV = this.lv; let n = 0;
    for (const f of this.friends) {
      if (f.st !== 'run') continue;
      const moving = !f.frozen && f.wait <= 0 && (s.si >= 1 || f.early);
      const late = moving && (f.late || (why !== 'da' && Math.random() < .55));
      if (late && n < LV.maxCatch) { f.st = 'late'; s.plan.push({ f, at: n * .95, how: why === 'da' ? f.p === 'hop' ? 'hop' : 'late' : why }); n++; }
      else if (f.st === 'run') { this.stopNpc(f); if (moving) f.ch.setFace('sweat'); }
    }
    for (const f of this.friends) f.early = false;
    if (n >= LV.maxCatch) return;
    const slips = this.friends.filter(f => f.st === 'stop' && (
      (f.p === 'sneeze' && Math.random() < .5) || (f.p === 'doze' && f.asleep && Math.random() < .55) ||
      (f.p === 'wag' && Math.random() < .45) || (f.p === 'wobble' && this.t - f.stopT < .9 && Math.random() < .75)));
    if (slips.length) { const f = pick(slips); s.plan.push({ f, at: n * .95 + rnd(.4, .75), how: f.p, prep: false }); }
  }
  runPlan() {
    const s = this.sul, L = this.L, dt0 = this.t - s.t0 - this.lv.grace;
    for (const it of s.plan.slice()) {
      const f = it.f, c = f.ch;
      // the build-up before the slip
      if (!it.prep && dt0 >= it.at - .7) {
        it.prep = true;
        if (it.how === 'sneeze') { c.setFace('sweat'); L.say(c, '에… 에…', 650, 'think'); }
        if (it.how === 'wag') { c.rx.wag = 1; c._fx?.(this.tw, 'heart', { y: .95, s: .8 }); }
      }
      if (it.how === 'wobble') c.lean = Math.sin(this.t * 13) * .22;
      if (dt0 < it.at || this.t < s.busyUntil) continue;
      s.plan.splice(s.plan.indexOf(it), 1);
      if (f.st !== 'late' && f.st !== 'stop') continue;
      this.callOut(f, it.how);
    }
  }
  callOut(f, how) {
    const s = this.sul, L = this.L, c = f.ch;
    f.st = 'out'; s.aim = { x: c.root.position.x, z: c.root.position.z }; s.ch.pose = 'point';
    if (how === 'sneeze') { L.say(c, '에취!', 700); c.bump(.5); L.audio.sfx('pop', 1); }
    else if (how === 'doze') { L.say(c, '헉! 안 잤어!', 800); c.pose = 'flail'; c.setFace('wow'); f.asleep = false; }
    else if (how === 'wag') { c.rx.wag = 1; }
    else if (how === 'late' || how === 'hop' || how === 'kik' || how === 'dbl') { if (!f.frozen) this.lateFreeze(f); }
    L.say(s.ch, `${OUT_LINE[how] || '움직였다!'} ${NAME[f.kind]} 아웃!`, 1100, 'red'); L.audio.sfx('locked');
    s.busyUntil = this.t + 1.0; s.lookT = Math.max(s.lookT, s.t + 1.0);
    f.slot = this.chainN++;
    this.updFriends();
    this.tw.wait(.8).then(() => {
      if (this.dead || f.st !== 'out') return;
      this.unfreeze(f); c.setFace('sad'); if (Math.random() < .6) L.say(c, pick(['히잉~', '들켰다~', '에이~']), 700);
      const [x, dz] = CHAIN[f.slot % CHAIN.length]; f.st = 'walk'; f.tx = x; f.tz = SZ + dz;
    });
  }

  // ── 몽글이
  heroCaught(why) {
    const s = this.sul, H = this.H, L = this.L, c = H.ch;
    H.st = 'stun'; H.v = 0; H.hearts--; this.caughtN++; this.lastCatch = why; this.updHearts();
    s.aim = { x: 0, z: H.z }; s.ch.pose = 'point'; s.ch.setFace('sus');
    const line = why === 'kik' ? '헤헤, 속았지? 몽글이 아웃~!' : why === 'dbl' ? '한 번 더 봤지롱~ 몽글이 아웃!' : '움직였지? 몽글이 아웃~!';
    L.say(s.ch, line, 1200, 'red'); L.audio.sfx('locked'); L.audio.sfx('miss');
    document.getElementById('app').animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 280 });
    this.runAnim(c, 0, 0); c.lean = 0; c.pose = 'flail'; c.setFace('sweat'); c.bump(.4);
    s.busyUntil = this.t + 1.2; s.lookT = Math.max(s.lookT, s.t + 1.3);
    L.log({ caught: why, t: +this.t.toFixed(1), z: +H.z.toFixed(2) });
    if (H.hearts <= 0) return this.finish('fail', 'caught');
    // three hops back down the yard (facing us — the sad face shows), then on again
    const z1 = Math.min(Z0, H.z + 3);
    (async () => {
      await this.tw.wait(.45); if (this.dead) return;
      L.say(c, '으앙~ 세 발짝 뒤로…', 900); c.setFace('sad');
      for (let i = 1; i <= 3; i++) { await c.hopTo(this.tw, 0, H.z + (z1 - H.z) * i / 3, { height: .38, dur: .24, sfx: n => L.audio.sfx(n, 3) }); if (this.dead) return; }
      H.z = z1; c.root.rotation.y = Math.PI; c.pose = 'idle'; c.setFace('normal');
      if (this.phase === 'play' && H.st === 'stun') H.st = 'play';
    })();
  }
  stepHero(dt) {
    const H = this.H, c = H.ch, L = this.L, W = L.world;
    if (H.st === 'stun' || H.st === 'tang') return;
    const want = this.hold && this.phase === 'play' && H.st === 'play' ? RUN_V : this.hold && H.st === 'dash' ? DASH_V : 0;
    H.v += (want - H.v) * (1 - Math.exp(-dt * (want > H.v ? 10 : 24))); if (H.v < .03) H.v = 0;
    const k = H.v / (H.st === 'dash' ? DASH_V : RUN_V);
    if (H.st === 'play') {
      H.z -= H.v * dt;
      if (H.z <= REACH) { H.z = REACH; H.v = 0; this.reach(); }
    } else if (H.st === 'dash') {
      H.z += H.v * dt;
      if (H.z >= Z0 + .25) this.finish('win', 'home');
    }
    c.root.position.z = H.z;
    if (H.v > .05) {
      this.runAnim(c, Math.min(1, k * 1.2), H.ph += dt * 13 * (.6 + k * .5));
      if ((H.dust -= dt) <= 0 && k > .5) { H.dust = .15; const p = W.toScreen(c.root.position.clone().setY(.05)); W.fx.burst(p.x + rnd(-8, 8), p.y, { n: 2, colors: ['#ead7ae', '#d9bf8f'], shape: 'circle', size: 5, speed: 45, life: .35, gravity: 90, up: 30 }); }
    } else if (c.pose === 'search' || c.body.position.y > .001) {
      // the freeze: arms down, a squash, a tiny wobble
      this.runAnim(c, 0, 0); c.pose = 'idle'; c.bump(.22);
    }
    // holding still while he looks: a nervous tremble
    c.lean = this.sul.st === 'look' && H.st !== 'dash' && H.v === 0 ? Math.sin(this.t * 38) * .025 : 0;
  }
  reach() {
    const H = this.H, L = this.L;
    if (H.st !== 'play') return;
    H.st = 'reach'; this.runAnim(H.ch, 0, 0); H.ch.pose = 'push'; H.ch.setFace('happy');
    this.tangEl.style.display = ''; L.audio.sfx('pop', 6);
    this.hint.textContent = '등을 콕! 쳐서 땡! (돌아볼 땐 참기)'; this.hint.classList.remove('gone'); this.hint.classList.add('go');
  }
  tryTang() {
    const H = this.H;
    if (this.danger()) { H.st = 'play'; H.v = 1; this.heroCaught(this.sul.why); this.tangEl.style.display = 'none'; this.hint.classList.remove('go'); this.hint.textContent = '꾹 누르면 달리기 · 손 떼면 얼음!'; return; }
    this.tang();
  }
  // "땡!": the chain breaks, everyone runs for the line, 너굴이 gives chase
  async tang() {
    const L = this.L, W = L.world, H = this.H, s = this.sul, c = H.ch;
    H.st = 'tang'; this.phase = 'tang'; this.tangEl.style.display = 'none';   // a finger kept down after the tap runs straight off
    this.tangAt = this.lv.time - this.left; this.freed = this.friends.filter(f => ['out', 'walk', 'chain'].includes(f.st)).length;
    this.clock.classList.add('stop');
    s.st = 'tanged'; s.plan = []; this.chantEl.className = 'rl-chant'; this.vig.classList.remove('on'); this.setSyl(0);
    await c.hopTo(this.tw, 0, SZ + .78, { height: .3, dur: .18 }); if (this.dead) return;
    c.pose = 'push'; c.bump(.4);
    const p = W.toScreen(s.ch.root.position.clone().setY(1.3));
    L.ui.floatText(p.x, p.y - 20, '땡!', 'gold big'); W.fx.burst(p.x, p.y, { n: 22, shape: 'star' }); W.fx.ring(p.x, p.y + 20, { r: 80, color: '#ffe16b', width: 9, life: .45 });
    L.audio.sfx('special'); L.audio.sfx('pop', 8);
    document.getElementById('app').animate([{ transform: 'translateY(-7px)' }, { transform: 'translateY(5px)' }, { transform: 'none' }], { duration: 240 });
    s.ch.setFace('wow'); s.ch.pose = 'flail'; L.say(s.ch, '으악!', 700);
    for (const f of this.friends) {
      this.unfreeze(f); f.asleep = false; f.st = 'flee'; f.fv = f.kind === 'sleepy' ? 1.8 : rnd(2.0, 2.5); f.flWait = rnd(.1, .45);
      if (f.slot >= 0) { f.ch.setFace('happy'); f.ch.pose = 'cheer'; }
    }
    this.updFriends(true);
    const ch = this.friends.find(f => f.slot >= 0) || this.friends[0];
    L.say(ch.ch, this.freed ? '와아~ 살았다! 도망가~!' : '도망가~!', 900);
    // 너굴이 spins dizzy, then gives chase
    const r0 = s.ch.root.rotation.y;
    this.tw.run(.75, k => { s.ch.root.rotation.y = r0 + k * Math.PI * 2; }, ease.outCubic, 0, s.ch).then(() => {
      if (this.dead || this.result) return;
      s.ch.root.rotation.y = 0; s.ch.setFace('angry'); s.ch.pose = 'hips'; L.say(s.ch, '거기 서~!', 900); L.audio.sfx('angry'); s.st = 'chase'; s.chaseWait = .6;
    });
    await this.tw.wait(.12); if (this.dead) return;
    c.setFace('wow'); await c.hopTo(this.tw, 0, SZ + 1.55, { height: .45, dur: .3 }); if (this.dead) return;   // the 땡 bounces 몽글이 back off his back
    c.root.rotation.y = 0; c.pose = 'idle'; H.z = c.root.position.z; H.v = 0;
    this.phase = 'dash'; H.st = 'dash';
    this.hint.textContent = '꾹! 출발선까지 달려!'; this.hint.classList.add('go'); this.hint.classList.remove('gone');
    L.ui.banner('도망쳐~!', null, 650);
  }
  stepChase(dt) {
    const s = this.sul, H = this.H, c = s.ch;
    if (s.st !== 'chase' || this.result) return;
    if ((s.chaseWait -= dt) > 0) return;
    s.z += this.lv.chase * dt; s.x += (0 - s.x) * (1 - Math.exp(-dt * 4));
    c.root.position.set(s.x, 0, s.z); c.root.rotation.y = 0;
    this.runAnim(c, 1, (s.ph = (s.ph || 0) + dt * 14));
    c.pose = 'flail';
    const gap = H.z - s.z;
    const fc = gap < 1.6 ? 'wow' : 'happy'; if (H.ch.face !== fc) H.ch.setFace(fc);
    if (gap < .62) this.finish('fail', 'tagged');
  }
  stepFriend(f, dt) {
    const c = f.ch, s = this.sul;
    switch (f.st) {
      case 'run': {
        if (s.st !== 'chant' && !(s.st === 'pre' && f.early)) break;
        if (s.st === 'chant' && f.dozeAt && s.si >= f.dozeAt) { this.doze(f); break; }
        if (s.st === 'chant' && s.si >= f.stopAt && s.kikT == null) { this.stopNpc(f); break; }
        if (s.st === 'chant' && s.kikT != null && !f.late) { this.stopNpc(f); c.setFace('sweat'); break; }   // the giggle spooks the careful ones
        if ((f.wait -= dt) > 0 && s.st === 'chant') break;
        this.moveNpc(f, dt);
        break;
      }
      case 'stop': if (f.early && s.st === 'pre' && s.t > .15) { this.unfreeze(f); f.st = 'run'; f.wait = 0; f.stopAt = 99; } break;
      case 'late': if (!f.frozen) { if (this.t - s.t0 < this.lv.grace + .08) this.moveNpc(f, dt); else this.lateFreeze(f); } break;
      case 'walk': {
        const dx = f.tx - f.x, dz = f.tz - f.z, d = Math.hypot(dx, dz);
        if (d < .06) { f.x = f.tx; f.z = f.tz; f.st = 'chain'; c.root.rotation.y = 0; c.pose = 'ride'; c.setFace('sad'); c.body.position.y = 0; c.bump(.3); break; }
        const st = Math.min(d, 1.7 * dt); f.x += dx / d * st; f.z += dz / d * st; f.ph += dt * 11;
        c.root.position.set(f.x, 0, f.z); c.root.rotation.y = Math.atan2(dx, dz); c.body.position.y = Math.abs(Math.sin(f.ph)) * .16;
        break;
      }
      case 'chain': c.rx.rx = 0; break;
      case 'flee': {
        if ((f.flWait -= dt) > 0) break;
        if (c.root.rotation.y !== 0) { c.root.rotation.y = 0; c.setFace(f.slot >= 0 ? 'happy' : 'wow'); }
        f.x += (f.lane - f.x) * (1 - Math.exp(-dt * 2));
        this.moveNpc(f, dt, 1, f.fv);
        if (f.z >= Z0 + .9 + (f.slot % 2) * .3) { f.st = 'home'; this.runAnim(c, 0, 0); c.pose = 'cheer'; c.setFace('happy'); }
        break;
      }
    }
  }

  // ── HUD bits
  updHearts() { this.heartEls.forEach((e, i) => e.classList.toggle('off', i >= this.H.hearts)); }
  updFriends(freed = false) {
    this.friends.forEach((f, i) => {
      const el = this.frEls[i], out = f.slot >= 0;
      el.classList.toggle('out', out && !freed); el.classList.toggle('free', out && freed);
      el.img.src = this.L.thumbs[`face_${f.kind}_${out ? freed ? 'happy' : 'sad' : 'normal'}`];
    });
  }

  // ── per frame
  update(dt) {
    if (!this.ready) return;
    const L = this.L, W = L.world, LV = this.lv;
    this.t += dt; this.tw.update(dt);
    this.room.update(dt);
    const s = this.sul, H = this.H;
    s.ch.update(dt); H.ch.update(dt); for (const f of this.friends) f.ch.update(dt);
    this.meRing.position.x = H.ch.root.position.x; this.meRing.position.z = H.ch.root.position.z;
    // the 땡 prompt rides over 너굴이's head
    if (this.tangEl.style.display !== 'none') {
      const p = W.toScreen(s.ch.root.position.clone().setY(s.ch.headTop() + .9)); this.tangEl.style.left = p.x + 'px'; this.tangEl.style.top = p.y + 'px';
      const wait = s.st === 'look'; if (this.tangEl.classList.contains('wait') !== wait) { this.tangEl.classList.toggle('wait', wait); this.tangEl.textContent = wait ? '꾹 참아…' : '콕! 땡!'; }
    }
    if (this.result) { for (const f of this.friends) if (f.st === 'flee') this.stepFriend(f, dt); return; }
    if (this.phase === 'play') {
      this.left -= dt;
      const k = Math.max(0, this.left) / LV.time;
      this.clockI.style.width = (k * 100) + '%'; this.clockN.textContent = String(Math.max(0, Math.ceil(this.left)));
      this.clock.classList.toggle('hurry', this.left < 8);
      if (this.left <= 0) return this.finish('fail', 'time');
      this.stepSul(dt);
      // the chained friends cheer 몽글이 on now and then
      if (s.st === 'chant' && (s.chainSay -= dt) <= 0) { s.chainSay = rnd(5, 8); const ch = this.friends.filter(f => f.st === 'chain'); if (ch.length) L.say(pick(ch).ch, pick(CHAIN_LINES), 900); }
    }
    if (this.phase === 'play' || this.phase === 'dash') this.stepHero(dt);
    if (this.phase === 'dash') this.stepChase(dt);
    for (const f of this.friends) this.stepFriend(f, dt);
  }

  // ── the end: home safe (stars for friends freed and pace), or caught / out of time — always a light landing
  async finish(result, cause) {
    if (this.result) return;
    const L = this.L, LV = this.lv, H = this.H, s = this.sul;
    this.result = result; this.phase = 'end'; this.cause = cause; this.hold = false;
    this.vig.classList.remove('on'); this.tangEl.style.display = 'none'; this.hint.classList.add('gone');
    const freed = this.freed || 0, win = result === 'win';
    const stars = win ? 1 + (freed >= 2 ? 1 : 0) + (this.tangAt <= LV.par ? 1 : 0) : 0;
    const left = Math.max(0, Math.ceil(this.left));
    const score = win ? freed * 10 + left + H.hearts * 5 + this.close * 3 : freed * 10;
    this.score = score; this.stars = stars;
    L.log({ result, lv: this.lvIdx, score, stars, freed, hearts: H.hearts, cause, t: +(LV.time - this.left).toFixed(1), line: win ? `친구 ${freed}명 구출 · ${Math.round(this.tangAt)}초에 땡${this.close ? ` · 아슬아슬 ${this.close}번` : ''}` : undefined });
    if (win) {
      H.st = 'home'; this.runAnim(H.ch, 0, 0); H.ch.pose = 'cheer'; H.ch.setFace('happy'); H.ch.bump(.4);
      const p = L.world.toScreen(H.ch.root.position.clone().setY(1.6)); L.ui.floatText(p.x, p.y, '세이프~!', 'gold big');
      L.audio.sfx('win'); L.world.fx.confetti(80);
      s.st = 'done'; this.runAnim(s.ch, 0, 0); s.ch.pose = 'idle'; s.ch.setFace('sad'); L.say(s.ch, '에잇~ 또 내가 술래야?', 1300);
    } else if (cause === 'tagged') {
      H.st = 'out'; this.runAnim(H.ch, 0, 0); H.ch.pose = 'flail'; H.ch.setFace('sweat');
      s.st = 'done'; this.runAnim(s.ch, 0, 0); s.ch.pose = 'cheer'; s.ch.setFace('happy'); L.say(s.ch, '잡았다~! 다음 술래는 몽글이!', 1400); L.audio.sfx('lose');
    } else if (cause === 'caught') {
      s.ch.pose = 'cheer'; s.ch.setFace('happy'); L.say(s.ch, '몽글이 잡았다~ 내가 이겼지롱!', 1400); L.audio.sfx('lose');
      H.ch.setFace('sad');
    } else {
      // out of time: mum calls everyone in for dinner
      const mom = this.mom = new Char('mom'); mom.root.scale.setScalar(SIZE * .8); mom.root.position.set(-1.7, 0, Z0 + 1.15); mom.root.rotation.y = Math.PI * .75; mom.pose = 'wave'; mom.setFace('happy'); L.world.root.add(mom.root); L.world.idsDirty = true;
      L.say(mom, '몽글아~ 밥 먹어라~!', 1500); L.audio.sfx('heart');
      s.ch.pose = 'idle'; s.ch.setFace('normal');
      await this.tw.wait(.8); if (this.dead) return;
      H.ch.setFace('sad'); L.say(this.friends.reduce((a, b) => b.x > a.x ? b : a).ch, '벌써~?', 900); L.audio.sfx('lose');
    }
    await this.tw.wait(1.6); if (this.dead) return;
    if (win && L.campaign) return L.go({});   // the campaign: the reward card (bossgame → gift.js) is the result screen — 10/19, 결과창 한 번만
    const h = L.h, last = this.lvIdx >= LEVELS.length - 1;
    const tip = this.lastCatch === 'kik' ? '"킥" 소리가 나면 바로 손을 떼!' : this.lastCatch === 'dbl' ? '곁눈질 중엔 꾹 참고 "무"까지 기다려!' : '"습·니" 쯤에서 미리 손을 떼면 안전해!';
    const sub = win ? (stars >= 3 ? '무궁화 대장! 친구들도 다 구했어' : freed < 2 ? '친구가 둘 이상 잡혀 있을 때 땡 하면 별 하나 더!' : `${LV.par}초 안에 땡 하면 별 하나 더!`)
      : cause === 'time' ? '해가 졌다~ "다!" 직전까지는 과감하게 달려도 돼' : cause === 'tagged' ? '땡까지 성공! 도망칠 땐 끝까지 꾹~' : tip;
    L.ui.panel({ title: win ? '무사 귀환!' : cause === 'time' ? '밥 먹을 시간~' : '아쉽다~', color: win ? 'green' : 'orange', body: [
      h('div', { class: 'rl-stars' }, ...[0, 1, 2].map(k => h('span', { class: k < stars ? 'on' : '' }, '★'))),
      h('div', { class: 'txt' }, win ? `친구 ${freed}명 구출 · ${Math.round(this.tangAt)}초에 땡${this.close ? ` · 아슬아슬 ${this.close}번` : ''}` : `잡힌 횟수 ${this.caughtN}번${this.freed != null ? ` · 친구 ${freed}명 구출` : ''}`),
      h('div', { class: 'txt' }, sub)],
      buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
        this.nextBtn = L.ui.btn(win ? (last ? '처음 운동장부터' : '다음 판') : '다시 하기', { color: win ? 'green' : 'orange', cls: 'big', onClick: () => L.go({ lv: win ? (last ? 0 : this.lvIdx + 1) : this.lvIdx }) })] });
  }
  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.removeEventListener('pointerdown', this._down); removeEventListener('pointerup', this._up); removeEventListener('pointercancel', this._up); removeEventListener('blur', this._blur);
    app.classList.remove('rl'); this.tw.clear();
    const roots = [this.room?.group, this.deco, this.sul?.ch.root, this.H?.ch.root, this.mom?.root, ...(this.friends || []).map(f => f.ch.root)];
    for (const o of roots) if (o) { W.root.remove(o); disposeTree(o); }
    this.vig?.remove(); this.tangEl?.remove(); document.querySelectorAll('.rl-get').forEach(e => e.remove());
    document.getElementById('rl-css')?.remove(); W.camLock = false;
  }

  // ── bots (QA) drive the same press()/release(): smart reads the chant (runs from "무", lets go around "습" — earlier
  // when the beat rushes, at once on a giggle), taps 땡 while he chants, and holds all the way home; random mashes
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 2.5 && this.L.ui.panelOpen) { this._endT = 0; this.nextBtn?.press(); } return; }
    if (!this.ready || this.phase === 'intro') return;
    const s = this.sul, H = this.H;
    if (mode === 'random') {
      if ((this._rt = (this._rt || 0) - dt) > 0) return; this._rt = rnd(.15, .8);
      if (Math.random() < .55) this.press(); else this.release(); return;
    }
    let want = false;
    if (H.st === 'play') {
      if (s.st === 'chant' && s.kikT == null && s.si >= 1) { const fast = (s.gaps[s.si] ?? 1) < .2; want = s.si < (fast ? 6 : 8); }
    } else if (H.st === 'reach') {
      if (this.hold) { this.release(); return; }
      if (s.st === 'chant' && s.kikT == null && s.si >= 1 && s.si <= 6) this.press();
      return;
    } else if (H.st === 'dash') want = true;
    if (want) this.press(); else this.release();
  }
  state() {
    const H = this.H, s = this.sul;
    return { scene: 'redlight', lv: this.lvIdx + 1, phase: this.phase, result: this.result || null, score: this.score ?? 0, stars: this.stars ?? 0,
      progress: H ? +clamp((Z0 - H.z) / (Z0 - REACH), 0, 1).toFixed(2) : 0, hearts: H?.hearts, freed: this.freed ?? null, caught: this.friends?.filter(f => f.slot >= 0).length,
      sul: s?.st, si: s?.si, kind: s?.kind, hero: H?.st, left: +(this.left || 0).toFixed(1), cause: this.cause || null };
  }
  get api() { return { finish: () => { this.left = 0; }, reach: () => { this.H.z = REACH + .05; } }; }
}

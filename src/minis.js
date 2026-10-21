// 보스 미니게임 7종 (2026-10-18). Each one is short (30–75 s), one finger, and plays on a real room of its region.
// Borrowed from the new-game talk (other session, 10/18): '엄마 몰래 야식' (the user liked it — "어느 타이밍에 가야되는지 잘
// 모르겠어" → here the watcher's mood is spelled out in big words and the cover is painted on the floor), '하나만 바뀐 집'
// (spot what changed), and the plain old playground games: 무궁화 꽃이 피었습니다, 야바위, 두더지, 손전등 숨바꼭질.
// A game: constructor(scene, params) · map() → a layout key or object · build() · start() · update(dt) · down/move/up/tap
// (screen px) · bot(dt) · dispose(). The scene (scenes/mini.js) gives char(), add(), frame(), say(), setStatus(), setClock(),
// setHearts(), done(win, text).
import * as THREE from 'three';
import { THEMES, layoutFor } from './stages.js';
import { buildItem } from './gfx/items.js';
import { mat } from './gfx/kit.js';
import { h } from './ui.js';
import { ease } from './util.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
const PI = Math.PI;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const NIGHT = { ambColor: '#a3adff', amb: 1.0, sunColor: '#cfd7ff', sun: .8 };
const heroKind = () => 'mong';   // (always 몽글이: the 도감 pick walks along in stages only — 10/19)
// a flat coloured strip on the floor (no outline, never picked)
function strip(S, x0, x1, z, w, color, op = .35) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(x1 - x0), w), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false }));
  m.rotation.x = -PI / 2; m.position.set((x0 + x1) / 2, .025, z); m.layers.set(2); m.renderOrder = 2; return S.add(m);
}
// the floor area of a stage's rooms (the ground running on past the walls doesn't count)
function roomBox(R) { const b = new THREE.Box3(); for (const q of R.rooms || [R]) { const o = q.group.position; b.expandByPoint(new THREE.Vector3(o.x - q.w / 2, o.y, o.z - q.d / 2)); b.expandByPoint(new THREE.Vector3(o.x + q.w / 2, o.y + 2, o.z + q.d / 2)); } return b; }
const near = (S, p, x, y, r) => { const s = S.screen(p); return Math.hypot(s.x - x, s.y - y) < r ? Math.hypot(s.x - x, s.y - y) : null; };

// ── ① 냥냥이 몰래 야식 (home): hold to tiptoe along the route to the fridge and back; 냥냥이 watches TV, says "흠?" and turns
class Sneak {
  constructor(S, P) {
    this.S = S; this.P = P; this.title = '냥냥이 몰래 야식'; this.face = 'cat';
    this.goal = '꾹 누르면 살금살금, 떼면 얼음! 냉장고 갔다가 문까지 돌아오기';
    this.tip = '냥냥이가 "흠?" 하면 바로 손을 떼! 파란 길(가구 뒤)에서는 움직여도 안 들켜.';
    this.intro = [{ who: 'cat', text: '냐앙… 밤에 몰래 간식 먹는 건 반칙이다냥. 내가 TV 보면서 다 지켜볼 거다냥!' },
      { who: 'mong', text: '꾹 누르고 있으면 살금살금, 손을 떼면 얼음! 냥냥이가 "흠?" 하면 바로 멈춰야 해.' },
      { who: 'mong', text: '파란 길은 가구 뒤라 안 보여. 냉장고에서 간식 챙겨서 문까지 돌아오자!' }];
    this.bg = ['#2b3270', '#4a3f86']; this.light = NIGHT;
    this.Z = -1.0; this.X0 = -3.5; this.X1 = 3.3; this.time = P.time || 75;
  }
  map() {
    return { w: 8, d: 5, theme: { ...THEMES.bear, bg: this.bg }, wallH: 2.9, walls: { N: 'wall', W: 'wall' }, bleed: {},
      furniture: [F('bookshelf', 0, 0, 0, { seed: 5 }), F('drawers', 1, 0), F('plant', 2, 0), F('recordcab', 3, 0), F('counter', 5, 0, 0, { variant: 'stove' }), F('counter', 6, 0), F('fridge', 7, 0),
        F('sofa2', 1, 2), F('plantbig', 4, 2), F('diningset', 5, 2), F('rug', 2, 3), F('zabuton', 3, 3), F('tvlow', 3, 4, 2), F('lamp', 0, 4), F('plant', 7, 4)],
      decor: [D('door', 'W', -1.0), D('catclock', 'N', -.5), D('window', 'W', 1.3)] };
  }
  // hidden from the watcher (on the zabuton) where the line to you crosses a piece of furniture in row 2
  covered(x) { const xc = this.w.x + (x - this.w.x) * .5; return [[-3, -1], [.15, .85], [1, 3]].some(([a, b]) => xc > a - .02 && xc < b + .02); }
  build() {
    const S = this.S;
    this.w = { x: -.5, z: 1.0 };
    this.cat = S.char('cat', this.w.x, this.w.z); this.cat.root.rotation.y = 0;
    this.hero = S.char(heroKind(S), this.X0, this.Z); this.hero.root.rotation.y = PI / 2;
    // the route: blue where furniture hides you, pale where you can be seen
    const N = 70; let run = null;
    for (let i = 0; i <= N; i++) { const x = this.X0 + (this.X1 + .2 - this.X0) * i / N, c = this.covered(x); if (!run || run.c !== c || i === N) { if (run) strip(S, run.x, x, this.Z, .5, run.c ? '#5fb3ff' : '#fff3b0', run.c ? .42 : .3); run = { x, c }; } }
    S.frame({ x: 0, z: -.2, yaw: Math.PI / 4, pitch: .8, zoom: 1.45, w: 7.2, hh: 5 });
    this.x = this.X0; this.dir = 1; this.hold = false; this.moved = 0; this.hearts = 3; this.state = 'tv'; this.st = rnd(2.4, 3.6); this.lastSafe = this.X0; this.stun = 0;
    S.setHearts(3, 3);
  }
  start() { this.left = this.time; this.mood('tv'); }
  mood(s) {
    const S = this.S, c = this.cat; this.state = s;
    if (s === 'tv') { c.root.rotation.y = 0; c.setFace('normal'); c.pose = 'idle'; this.st = rnd(2.2, 3.8) * (this.dir < 0 ? .9 : 1); }
    if (s === 'hmm') { c.root.rotation.y = -PI / 2; c.setFace('sus'); S.say(c, '흠…?', 800); S.G.audio.sfx('wobble'); this.st = .85; }
    if (s === 'look') { c.root.rotation.y = PI; c.setFace('angry'); this.st = rnd(1.3, 2.0); S.G.audio.sfx('tock'); }
  }
  down() { this.hold = true; } up() { this.hold = false; }
  update(dt) {
    const S = this.S;
    this.left -= dt; S.setClock(this.left, this.time);
    if (this.left <= 0) return S.done(false, '시간이 다 됐어… 냥냥이가 잠들 때까지 기다려야겠다');
    // the watcher
    if ((this.st -= dt) <= 0) this.mood(this.state === 'tv' ? (Math.random() < .2 ? 'fake' : 'hmm') === 'fake' ? 'hmm' : 'hmm' : this.state === 'hmm' ? (Math.random() < .22 ? 'tv' : 'look') : 'tv');
    // you
    const h = this.hero, cov = this.covered(this.x);
    if (this.stun > 0) { this.stun -= dt; return; }
    const mv = this.hold ? 1.15 * dt : 0;
    if (mv) { this.x += this.dir * mv; this.moved = .15; h.root.position.y = Math.abs(Math.sin(S.t * 13)) * .05; h.root.scale.y = 1; }
    else { this.moved = Math.max(0, this.moved - dt); h.root.position.y = 0; h.root.scale.y = .86; }
    h.root.position.x = this.x;
    if (cov) this.lastSafe = this.x;
    S.setStatus(this.state === 'look' ? (cov ? '보고 있어! (가구 뒤라 괜찮아)' : '보고 있어! 움직이지 마!') : this.state === 'hmm' ? '흠…? 멈춰!' : '지금이야! 꾹 눌러서 살금살금', this.state === 'look' ? 'red' : this.state === 'hmm' ? 'yellow' : 'green');
    if (this.state === 'look' && this.moved > 0 && !cov) return this.caught();
    if (this.dir > 0 && this.x >= this.X1) {   // the fridge: a snack, then back
      this.x = this.X1; this.dir = -1; h.root.rotation.y = -PI / 2; S.G.audio.sfx('special');
      const snack = buildItem(pick(['cupcake', 'icecream', 'milk'])); snack.scale.setScalar(1.4); snack.position.set(0, h.headTop() + .05, 0); h.root.add(snack);
      S.say(h, '간식 챙겼다! 이제 돌아가자', 1300);
    }
    if (this.dir < 0 && this.x <= this.X0) { this.x = this.X0; S.done(true, `간식 작전 성공! 하트 ${this.hearts}개 남았어`); }
  }
  caught() {
    const S = this.S; this.hearts--; S.setHearts(this.hearts, 3); S.G.audio.sfx('locked'); S.G.world.fx.ring(innerWidth / 2, innerHeight / 2, { r: 140, color: '#ff4f66', width: 10, life: .5 });
    S.say(this.cat, '거기 누구냥!', 1200);
    if (this.hearts <= 0) return S.done(false, '냥냥이한테 들켰다…! "흠?" 소리가 나면 바로 손을 떼 봐');
    this.stun = 1.1; this.hold = false;
    const back = this.dir > 0 ? Math.max(this.X0, this.lastSafe - .1) : Math.min(this.X1, this.lastSafe + .1);
    this.hero.hopTo(S.tw, back, this.Z, { height: .5, dur: .5 }).then(() => { this.x = back; this.hero.root.position.y = 0; });
  }
  bot() {
    const ahead = this.x + this.dir * .35;
    this.hold = this.state === 'tv' ? (this.st > .7 || this.covered(ahead)) : this.covered(this.x) && this.covered(ahead);
  }
}

// ── ② 잉키의 바꿔치기 (apartment): look at the room, blink, find what 잉키 changed
const TINTS = ['#ff8fb8', '#7fd6c0', '#ffd23f', '#9f8fff'];
class Spot {
  constructor(S, P) {
    this.S = S; this.P = P; this.title = '너굴이의 바꿔치기'; this.face = 'raccoon';   // (너굴이, not 먹물이: its name isn't known before 64판 — 검토 H7)
    this.goal = '너굴이가 바꿔 놓은 곳을 터치! (틀리면 3초, 다시 보기는 4초가 줄어)';   // (GPT QA ST-NAME: was 먹물이 — not named before 64판)
    this.tip = '처음 모습을 잘 봐 둬! 색이 바뀐 것, 사라진 것, 돌아간 것, 새로 생긴 것.';
    this.intro = [{ who: 'raccoon', text: '히히, 이 방 내가 몰래 바꿔 놓을 거야. 어디가 바뀌었는지 맞혀 볼래?' },
      { who: 'mong', text: '처음 모습을 잘 봐 두고, 바뀐 곳을 터치! 헷갈리면 "처음 모습"을 잠깐 볼 수 있어.' }];
    this.n = P.n || 3; this.time = P.time || 40;
  }
  map() { return this.P.map || 'apt'; }
  build() {
    const S = this.S, box = roomBox(S.room);
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    S.frame({ x: c.x, z: c.z, yaw: Math.PI / 4, pitch: .72, zoom: 1.1, w: Math.min(10, (sz.x + sz.z) / Math.SQRT2 * .95), hh: 5.6 });
    this.inky = S.char('raccoon', c.x + sz.x * .38, c.z + sz.z * .38); this.inky.faceTo(S.G.world.cam.position.x, S.G.world.cam.position.z);
    this.marks = [];
  }
  start() {
    const S = this.S; this.phase = 'memo'; this.left = 4.5;
    S.setStatus('잘 봐 둬! 5', 'green');
  }
  makeChanges() {
    const S = this.S, W = S.G.world, rooms = S.room.rooms || [S.room], out = [];
    const recs = rooms.flatMap(R => [...R.furns.map(r => ({ r, f: r.f, wall: false })), ...R.decors.filter(d => !d.hidden).map(r => ({ r, f: r.f, wall: true }))])
      .filter(o => !['rug', 'door', 'window', 'balconywin', 'curtainwin'].includes(o.r.type));
    const vis = recs.map(o => { const b = new THREE.Box3().setFromObject(o.f.group); return { ...o, b, c: b.getCenter(new THREE.Vector3()) }; })
      .filter(o => { const s = W.toScreen(o.c); return s.x > 40 && s.x < W.W - 60 && s.y > 150 && s.y < W.H - 200; });
    vis.sort(() => Math.random() - .5);
    const kinds = ['tint', 'hide', 'turn', 'add'].sort(() => Math.random() - .5);
    for (const o of vis) {
      if (out.length >= this.n) break;
      if (out.some(q => q.c.distanceTo(o.c) < 1.1)) continue;
      const big = (o.b.max.x - o.b.min.x) > 1.3 || (o.b.max.z - o.b.min.z) > 1.3;
      let k = kinds[out.length % kinds.length];
      if (k === 'turn' && (big || o.wall)) k = 'tint';
      if (k === 'hide' && big) k = 'add';
      const ch = { o, k, c: o.c.clone(), found: false };
      if (k === 'tint') { const col = new THREE.Color(pick(TINTS)), saved = []; o.f.group.traverse(m => { if (m.isMesh && !m.userData.proxy) saved.push([m, m.material]); }); ch.apply = () => saved.forEach(([m, mt]) => { const c2 = mt.clone(); c2.color = col; m.material = c2; }); ch.revert = () => saved.forEach(([m, mt]) => { m.material = mt; }); }
      if (k === 'hide') { ch.apply = () => { o.f.group.visible = false; }; ch.revert = () => { o.f.group.visible = true; }; }
      if (k === 'turn') { const r0 = o.f.group.rotation.y; ch.apply = () => { o.f.group.rotation.y = r0 + PI / 2; }; ch.revert = () => { o.f.group.rotation.y = r0; }; }
      if (k === 'add') { const it = buildItem(pick(['crown', 'duck', 'teddy', 'star'])); it.scale.setScalar(1.5); it.position.set(o.c.x, o.b.max.y + .02, o.c.z); it.visible = false; S.add(it); ch.c.y = o.b.max.y + .15; ch.apply = () => { it.visible = true; }; ch.revert = () => { it.visible = false; }; }
      out.push(ch);
    }
    return out;
  }
  update(dt) {
    const S = this.S, W = S.G.world;
    if (this.phase === 'memo') {
      this.left -= dt; S.setStatus(`잘 봐 둬! ${Math.max(1, Math.ceil(this.left))}`, 'green'); S.setClock(this.left, 4.5);
      if (this.left <= 0) {
        this.changes = this.makeChanges(); this.changes.forEach(c => c.apply()); W.idsDirty = true; W.shadowDirty = true;
        const f = h('div', { class: 'cutflash' }); document.getElementById('app').append(f); setTimeout(() => f.remove(), 260);
        S.say(this.inky, '히히, 바꿔 놨지롱~', 1400); S.G.audio.sfx('whoosh');
        this.phase = 'find'; this.left = this.time;
        this.peekBtn = S.G.ui.btn('처음 모습 보기', { color: 'blue', cls: 'sm', onClick: () => this.peek() }); S.extraEl.innerHTML = ''; S.extraEl.append(this.peekBtn);
      }
      return;
    }
    this.left -= dt; S.setClock(this.left, this.time);
    const n = this.changes.filter(c => c.found).length;
    if (!this.peeking) S.setStatus(`바뀐 곳 ${n} / ${this.changes.length}`, '');
    for (const m of this.marks) { const s = W.toScreen(m.p); m.el.style.left = s.x + 'px'; m.el.style.top = s.y + 'px'; }
    if (this.left <= 0) return S.done(false, '시간 끝! 너굴이: "히히, 아직 못 찾은 게 있지롱~"');   // (너굴이 says it, as everywhere in this game — 외부 QA 10/20 ST-SPOT-TIMEOUT-ACTOR)
  }
  peek() {
    if (this.peeking || this.phase !== 'find') return;
    const S = this.S; this.peeking = true; this.left -= 4;
    this.changes.filter(c => !c.found).forEach(c => c.revert()); S.setStatus('처음 모습이야!', 'yellow'); S.G.world.idsDirty = true;
    S.tw.wait(1.3).then(() => { if (S.dead) return; this.changes.filter(c => !c.found).forEach(c => c.apply()); this.peeking = false; S.G.world.idsDirty = true; });   // (QA3-mini10: on the scene's clock — stops with 잠깐!, gone with the scene)
  }
  tap(x, y) {
    if (this.phase !== 'find' || this.peeking) return;
    const S = this.S, W = S.G.world;
    let best = null, bd = 80;
    for (const c of this.changes) { if (c.found) continue; const d = near(S, c.c, x, y, 80); if (d != null && d < bd) { bd = d; best = c; } }
    if (best) {
      best.found = true; S.G.audio.sfx('special'); W.fx.ring(x, y, { r: 60, color: '#ffe14d', width: 8 }); W.fx.burst(x, y, { n: 14, shape: 'star' });
      const el = h('div', { class: 'mini-mark' }, '✓'); S.G.ui.wui.append(el); this.marks.push({ el, p: best.c });
      if (this.changes.every(c => c.found)) { S.say(this.inky, '으앗, 다 들켰다!', 1400); return S.done(true, '너굴이의 바꿔치기를 전부 찾아냈어!'); }
    } else { this.left -= 3; S.G.audio.sfx('wobble'); S.G.ui.floatText(x, y - 30, '아니야~ -3초', ''); }
  }
  bot(dt) { if (this.phase !== 'find') return; if ((this._bt = (this._bt || 0) + dt) < 1.4) return; this._bt = 0; const c = this.changes.find(q => !q.found); if (c) { const s = this.S.screen(c.c); this.tap(s.x, s.y); } }
  dispose() { this.marks?.forEach(m => m.el.remove()); this.S.extraEl.innerHTML = ''; }
}

// ── ③ 무궁화 꽃이 피었습니다 (alley): hold to run at 너굴이 while it chants; still when it turns
const SYL = ['무', '궁', '화', '꽃', '이', '피', '었', '습', '니', '다'];
class RedLight {
  constructor(S, P) {
    this.S = S; this.P = P; this.title = '무궁화 꽃이 피었습니다'; this.face = 'raccoon';
    this.goal = '너굴이가 외치는 동안 꾹 눌러서 달리기! "다!" 하면 손 떼기';
    this.tip = '박자가 빨라졌다 느려졌다 해. "니" 쯤에서 미리 손을 떼면 안전해!';
    this.intro = [{ who: 'raccoon', text: '이번엔 무궁화 꽃이 피었습니다! 내가 돌아봤을 때 움직이면 처음부터야~' },
      { who: 'mong', text: '외치는 동안 꾹 눌러서 달리고, "다!" 하면 손 떼고 얼음! 너굴이 등을 찜하면 이겨.' }];
    this.time = P.time || 60;
  }
  map() {
    return { w: 6, d: 9, theme: THEMES.alley1, bleed: {}, walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' },
      furniture: [F('vending', 0, 1), F('trashbags', 0, 3), F('aircon', 5, 1), F('pole', 5, 4), F('daeya', 0, 5), F('streetlamp', 5, 6), F('cones', 0, 7), F('hydrant', 5, 8)],
      decor: [D('mailbox', 'W', 1.5)] };
  }
  build() {
    const S = this.S;
    this.sz = -3.7; this.z0 = 3.8;
    this.seek = S.char('raccoon', 0, this.sz); this.seek.root.rotation.y = PI;
    this.hero = S.char(heroKind(S), 0, this.z0); this.hero.root.rotation.y = PI;
    this.npcs = [['shiba', -1.25], ['skater', 1.25]].map(([k, x]) => ({ ch: S.char(k, x, this.z0), x, z: this.z0, stopAt: 9 }));
    this.npcs.forEach(n => { n.ch.root.rotation.y = PI; });
    strip(S, -2.2, 2.2, this.sz + .8, .08, '#ffffff', .8);
    S.frame({ x: 0, z: 0, yaw: .32, pitch: .86, zoom: 1.3, w: 6.2, hh: 8.6, cy: .5 });
    this.z = this.z0; this.hold = false; this.hearts = 3; S.setHearts(3, 3);
  }
  start() { this.left = this.time; this.chant(); }
  chant() {
    this.state = 'chant'; this.si = 0; this.st = .5; this.seek.root.rotation.y = PI; this.seek.setFace('happy');
    const tempo = pick([.28, .22, .36, .18]); this.gaps = SYL.map((_, i) => tempo * rnd(.75, 1.3) * (i === 5 && Math.random() < .4 ? 2.6 : 1) * (i >= 7 && Math.random() < .3 ? .55 : 1));
    this.npcs.forEach(n => { n.stopAt = Math.random() < .28 ? 10 : 7 + Math.floor(Math.random() * 2); });
  }
  down() { this.hold = true; } up() { this.hold = false; }
  update(dt) {
    const S = this.S;
    this.left -= dt; S.setClock(this.left, this.time);
    if (this.left <= 0) return S.done(false, '시간이 다 됐어…');
    if (this.stun > 0) { this.stun -= dt; return; }
    // the chant
    if (this.state === 'chant') {
      if ((this.st -= dt) <= 0) {
        this.si++; S.G.audio.sfx('tap', 8 + this.si);
        if (this.si >= SYL.length) { this.state = 'look'; this.st = rnd(1.2, 2.0); this.grace = .16; this.seek.root.rotation.y = 0; this.seek.setFace('sus'); S.say(this.seek, '다!', 700); }
        else this.st = this.gaps[this.si];
      }
      S.setStatus(SYL.slice(0, Math.max(1, this.si)).join('').replace('화꽃', '화 꽃').replace('이피', '이 피'), 'green');
    } else if (this.state === 'look') {
      this.grace -= dt; this.st -= dt; S.setStatus('얼음!! 👀', 'red');
      if (this.st <= 0) this.chant();
    }
    // you
    const moving = this.hold;
    if (moving) { this.z -= 1.55 * dt; this.hero.root.position.y = Math.abs(Math.sin(S.t * 14)) * .06; } else this.hero.root.position.y = 0;
    this.hero.root.position.z = this.z;
    if (this.state === 'look' && this.grace <= 0 && moving) return this.caught();
    // the others
    for (const n of this.npcs) {
      if (n.back) continue;
      const go = this.state === 'chant' && this.si < n.stopAt;
      if (go) { n.z -= 1.2 * dt; n.ch.root.position.y = Math.abs(Math.sin(S.t * 12 + n.x)) * .05; } else n.ch.root.position.y = 0;
      if (this.state === 'look' && this.grace <= 0 && n.stopAt >= 10 && !n.caughtThis) { n.caughtThis = true; S.say(n.ch, '앗!', 900); n.back = true; n.ch.hopTo(S.tw, n.x, this.z0, { height: .6, dur: .7 }).then(() => { n.z = this.z0; n.back = false; }); }
      if (this.state === 'chant') n.caughtThis = false;
      n.z = Math.max(this.sz + 1.1, n.z); n.ch.root.position.z = n.z;
    }
    if (this.z <= this.sz + .85) { this.seek.setFace('wow'); S.say(this.hero, '찜!', 1000); S.say(this.seek, '으악, 찜 당했다!', 1400); return S.done(true, '너굴이 등을 찜! 무궁화 꽃 대장이다!'); }
  }
  caught() {
    const S = this.S; this.hearts--; S.setHearts(this.hearts, 3); S.G.audio.sfx('locked'); S.say(this.seek, '움직였지! 처음부터~', 1300);
    if (this.hearts <= 0) return S.done(false, '세 번 들켰어… "니" 쯤에서 미리 멈춰 보자');
    this.stun = .9; this.hold = false;
    this.hero.hopTo(S.tw, 0, this.z0, { height: .7, dur: .75 }).then(() => { this.z = this.z0; this.hero.root.position.y = 0; });
  }
  bot() { this.hold = this.state === 'chant' && this.si < 8; }
}

// ── ④ 햄찌의 야바위 (shop): the hamster hides under a basket, the baskets swap, tap the right one
class Shell {
  constructor(S, P) {
    this.S = S; this.P = P; this.title = '햄찌의 야바위'; this.face = 'hamster';
    this.goal = '햄찌가 숨은 바구니를 눈으로 따라가서 터치!';
    this.tip = '바구니 하나만 눈으로 계속 따라가 봐!';
    this.intro = [{ who: 'hamster', text: '웁웁! 내가 바구니 속에 쏙 숨을게. 섞은 다음에 어디 있는지 맞혀 봐!' },
      { who: 'mong', text: '햄찌가 들어간 바구니만 눈으로 꼭 따라가자!' }];
    this.rounds = P.rounds || 3;
  }
  map() { const L = layoutFor(this.P.map || 'laundry'); return { ...L, furniture: (L.furniture || []).filter(f => f.j < (L.d || 5) - 3) }; }
  build() {
    const S = this.S, R = S.room;
    const cx = 0, cz = (R.d || 5) / 2 - 1.6;
    this.cz = cz;
    // a long low table at the front, three upturned baskets on it
    const tb = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.2, .08, 1.0), mat('#e9b77c')); top.position.y = .5; tb.add(top);
    for (const sx of [-1.45, 1.45]) for (const sz of [-.4, .4]) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .5, 8), mat('#b97a45')); lg.position.set(sx, .25, sz); tb.add(lg); }
    tb.position.set(cx, 0, cz); S.add(tb);
    this.slots = [-1, 0, 1].map(k => new THREE.Vector3(cx + k * 1.0, .54, cz));
    this.cups = this.slots.map(p => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.26, .33, .42, 22, 1, true), mat('#8fd3f4', { side: THREE.DoubleSide })); body.position.y = .21; g.add(body);
      const cap = new THREE.Mesh(new THREE.CircleGeometry(.26, 22), mat('#7fc4e8')); cap.rotation.x = -PI / 2; cap.position.y = .42; g.add(cap);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(.33, .025, 6, 22), mat('#ffffff')); rim.rotation.x = PI / 2; g.add(rim);
      g.position.copy(p); S.add(g); return g;
    });
    this.ham = S.char('hamster', 0, cz, .54); this.ham.root.scale.setScalar(.6); this.ham.faceTo(S.G.world.cam.position.x, S.G.world.cam.position.z);
    S.frame({ x: cx, y: .7, z: cz, yaw: Math.PI / 4, pitch: .62, zoom: 1.4, w: 5.6, hh: 4 });
    this.round = 0; this.hearts = 2; S.setHearts(2, 2); this.phase = 'wait';
  }
  start() { this.play(); }
  async play() {
    const S = this.S, tw = S.tw;
    this.phase = 'show'; S.setStatus(`${this.round + 1}라운드 · 잘 봐!`, 'green');
    this.ans = Math.floor(Math.random() * 3); this.order = [0, 1, 2];   // order[slot] = cup index
    const cup = this.cups[this.ans]; this.ham.root.visible = true; this.ham.root.position.set(this.slots[this.ans].x, .54, this.cz);
    cup.position.y = 1.2; S.say(this.ham, '여기 있지~', 900); await tw.wait(.9);
    await tw.run(.25, k => { cup.position.y = 1.2 - (1.2 - .54) * k; }); this.ham.root.visible = false; S.G.audio.sfx('pop', 2);
    await tw.wait(.35);
    const swaps = [4, 6, 8, 9][Math.min(3, this.round)], dur = [.5, .4, .32, .28][Math.min(3, this.round)];
    S.setStatus('섞는 중…', 'yellow');
    for (let i = 0; i < swaps; i++) {
      if (S.dead) return;
      let a = Math.floor(Math.random() * 3), b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
      const ca = this.cups[this.order[a]], cb = this.cups[this.order[b]], pa = this.slots[a].clone(), pb = this.slots[b].clone();
      S.G.audio.sfx('swish');
      await tw.run(dur, k => { const s = Math.sin(k * PI); ca.position.lerpVectors(pa, pb, k); ca.position.z += s * .35; cb.position.lerpVectors(pb, pa, k); cb.position.z -= s * .35; });
      [this.order[a], this.order[b]] = [this.order[b], this.order[a]];
    }
    this.phase = 'pick'; S.setStatus('어느 바구니일까? 터치!', 'green');
  }
  async tap(x, y) {
    if (this.phase !== 'pick') return;
    const S = this.S; let best = -1, bd = 90;
    this.slots.forEach((p, i) => { const d = near(S, p.clone().setY(.75), x, y, 90); if (d != null && d < bd) { bd = d; best = i; } });
    if (best < 0) return;
    this.phase = 'reveal';
    const cupIdx = this.order[best], ok = cupIdx === this.ans, cup = this.cups[cupIdx];
    if (ok) { this.ham.root.visible = true; this.ham.root.position.set(this.slots[best].x, .54, this.cz); }
    await S.tw.run(.25, k => { cup.position.y = .54 + .7 * k; });
    if (ok) {
      S.G.audio.sfx('special'); S.say(this.ham, '웁! 들켰다~', 1000); this.round++;
      await S.tw.wait(.9); await S.tw.run(.2, k => { cup.position.y = 1.24 - .7 * k; }); this.ham.root.visible = false;
      if (this.round >= this.rounds) return S.done(true, '햄찌의 야바위를 다 맞혔어! 눈이 엄청 좋다');
      return this.play();
    }
    S.G.audio.sfx('locked'); this.hearts--; S.setHearts(this.hearts, 2);
    const right = this.order.indexOf(this.ans), rc = this.cups[this.ans];
    this.ham.root.visible = true; this.ham.root.position.set(this.slots[right].x, .54, this.cz);
    await S.tw.run(.25, k => { rc.position.y = .54 + .7 * k; }); S.say(this.ham, '여기였지롱~', 1000);
    await S.tw.wait(1.0); await S.tw.run(.2, k => { cup.position.y = 1.24 - .7 * k; rc.position.y = 1.24 - .7 * k; }); this.ham.root.visible = false;
    if (this.hearts <= 0) return S.done(false, '햄찌가 너무 빨랐어… 한 바구니만 눈으로 계속 따라가 봐!');
    this.play();
  }
  update() { this.S.setClock(this.rounds - this.round, this.rounds); this.S.setScore(`${this.round}/${this.rounds}`); }
  bot(dt) { if (this.phase !== 'pick') return; if ((this._bt = (this._bt || 0) + dt) < .6) return; this._bt = 0; const s = this.S.screen(this.slots[this.order.indexOf(this.ans)].clone().setY(.75)); this.tap(s.x, s.y); }
}

// ── ⑤ 두더지 숨바꼭질 (park): friends pop up behind the bushes — tap them, not the seeker
const POPPERS = ['bunny', 'frog', 'hamster', 'squirrel', 'shiba', 'panda'];
class Whack {
  constructor(S, P) {
    this.S = S; this.P = P; this.title = '두더지 숨바꼭질'; this.face = 'frog';
    this.goal = '덤불 뒤에서 쏙 나온 친구를 터치! 너굴이는 누르면 안 돼';
    this.tip = '너굴이(술래)가 나오면 꾹 참기! 친구만 터치.';
    this.intro = [{ who: 'frog', text: '개굴! 덤불 뒤에 친구들이 숨었다 나왔다 해. 나올 때 터치하면 찾은 거야!' },
      { who: 'raccoon', text: '나도 가끔 나올 건데… 나를 누르면 하나 빼기다~!' }];
    this.goalN = P.goal || 12; this.time = P.time || 35;
  }
  map() {
    return this.P.map ? layoutFor(this.P.map) : { w: 7, d: 6, theme: THEMES.park2, bleed: {}, walls: { N: 'fence', W: 'hedge', S: 'none', E: 'none' },
      furniture: [F('tree', 0, 0), F('bench', 2, 0), F('tree', 6, 0), F('bush', 1, 2), F('bush', 3, 2), F('bush', 5, 2), F('bush', 1, 4), F('bush', 3, 4), F('bush', 5, 4), F('planter', 4, 0)] };
  }
  build() {
    const S = this.S, R = S.room;
    // (user, 10/18: "수풀 클릭해도 성공으로 쳐 줄래? 캐릭도 좀 더 밖으로 나오게. 클릭하면 캐릭터 뿅 나왔다가 다시 들어가는 걸로.
    // 너구리는 실패니까 연출해 줘") — friends come up in the middle of the bush with the whole face above the leaves, a tap on
    // the bush counts, a found friend pops right out and ducks back, and 너굴이 jumps out to laugh at you when you get it wrong
    let holes = (R.furns || []).filter(r => r.type === 'bush').map(r => new THREE.Box3().setFromObject(r.f.group));
    if (holes.length < 4) holes = [-1, 0, 1].flatMap(k => [new THREE.Box3(new THREE.Vector3(k * 1.6 - .4, 0, -1), new THREE.Vector3(k * 1.6 + .4, .6, -.2)), new THREE.Box3(new THREE.Vector3(k * 1.6 - .4, 0, .8), new THREE.Vector3(k * 1.6 + .4, .6, 1.6))]);
    this.holes = holes.map(b => { const c = b.getCenter(new THREE.Vector3()); return { p: new THREE.Vector3(c.x, 0, c.z), bush: new THREE.Vector3(c.x, b.max.y * .6, c.z), up: Math.max(.2, b.max.y - .22), who: null }; });
    S.frame({ x: 0, z: .3, yaw: Math.PI / 4, pitch: .8, zoom: 1.15, w: 7.2, hh: 5.6 });
    this.score = 0; this.spawnT = .8;
  }
  start() { this.left = this.time; }
  pop() {
    const S = this.S, free = this.holes.filter(o => !o.who); if (!free.length) return;
    const hole = pick(free), bad = Math.random() < .24, kind = bad ? 'raccoon' : pick(POPPERS);
    const ch = S.char(kind, hole.p.x, hole.p.z, -1); ch.faceTo(S.G.world.cam.position.x, S.G.world.cam.position.z); ch.setFace(bad ? 'sus' : 'happy');
    const who = hole.who = { ch, bad, up: 0, stay: rnd(.85, 1.3) * (this.left < 12 ? .8 : 1), hit: false };
    S.tw.run(.15, k => { if (!who.hit) ch.root.position.y = -1 + (1 + hole.up) * k; }, ease.outBack).then(() => { who.up = 1; });
  }
  sink(hole) {
    const w = hole.who; if (!w || w.sinking) return; w.sinking = true; w.up = 0;
    const y0 = w.ch.root.position.y;
    this.S.tw.run(.18, k => { w.ch.root.position.y = y0 + (-1 - y0) * k; }).then(() => { this.S.G.world.root.remove(w.ch.root); hole.who = null; });
  }
  // a tapped one jumps right out of the bush (뿅), stays a beat, and ducks back in
  jumpOut(hole, hold) {
    const S = this.S, w = hole.who, ch = w.ch, y0 = ch.root.position.y, top = hole.up + .75;
    S.tw.run(.2, k => { ch.root.position.y = y0 + (top - y0) * k; }, ease.outBack)
      .then(() => S.tw.wait(hold)).then(() => { if (hole.who === w) this.sink(hole); });
  }
  update(dt) {
    const S = this.S;
    this.left -= dt; S.setClock(this.left, this.time); S.setStatus(`찾은 친구 ${this.score} / ${this.goalN}`, this.score >= this.goalN ? 'green' : '');
    if (this.score >= this.goalN) return S.done(true, `친구 ${this.score}명을 찾았어! 숨바꼭질 달인`);
    if (this.left <= 0) return S.done(false, `${this.score}명 찾았어… ${this.goalN}명까지 조금만 더!`);
    if ((this.spawnT -= dt) <= 0) { this.spawnT = rnd(.5, .85) * (this.left < 12 ? .75 : 1); this.pop(); if (Math.random() < .25) this.pop(); }
    for (const o of this.holes) if (o.who?.up && (o.who.stay -= dt) <= 0) this.sink(o);
  }
  tap(x, y) {
    const S = this.S; let best = null, bd = 95;
    // the friend or the bush it is in (a little more room round the bush: the leaves are what you see)
    for (const o of this.holes) {
      const w = o.who; if (!w || w.hit || w.sinking) continue;
      const d1 = near(S, w.ch.root.position.clone().setY(w.ch.root.position.y + .45), x, y, 80), d2 = near(S, o.bush, x, y, 95);
      const d = Math.min(d1 ?? 1e9, d2 ?? 1e9); if (d < bd) { bd = d; best = o; }
    }
    if (!best) return;
    const w = best.who, ch = w.ch; w.hit = true;
    const s = S.screen(ch.root.position.clone().setY(best.up + .9));
    if (w.bad) {
      // wrong one: 너굴이 leaps out, points and laughs; the screen shakes
      this.score = Math.max(0, this.score - 1);
      S.G.audio.sfx('locked'); S.G.audio.sfx('miss');
      ch.setFace('happy'); ch.pose = 'point';
      S.say(ch, pick(['헤헤, 나는 술래지롱~!', '나 눌렀지? 하나 빼기~!', '메롱~ 나였어!']), 1100);
      S.G.ui.floatText(s.x, s.y - 20, '-1', 'red');
      S.G.world.fx.ring(s.x, s.y + 30, { r: 70, color: '#ff5d6c', width: 8, life: .45 });
      document.getElementById('app').animate([{ transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 260 });
      this.jumpOut(best, .7);
    } else {
      this.score++; S.G.audio.sfx('pop', 2 + this.score % 6);
      ch.setFace('wow'); ch.pose = 'cheer';
      S.G.world.fx.burst(s.x, s.y + 20, { n: 12, shape: 'star' }); S.G.ui.floatText(s.x, s.y - 20, '+1', 'gold');
      this.jumpOut(best, .32);
    }
  }
  bot(dt) { if ((this._bt = (this._bt || 0) + dt) < .35) return; this._bt = 0; const o = this.holes.find(q => q.who?.up && !q.who.bad && !q.who.hit); if (o) { const s = this.S.screen(o.who.ch.root.position.clone().setY(.45)); this.tap(s.x, s.y); } }
}

// ── ⑥ 손전등 술래 (camp): it's dark; move the torch round and tap the friends it lights
class Lamp {
  constructor(S, P) {
    this.S = S; this.P = P; this.title = '손전등 술래'; this.face = 'panda';
    this.goal = '손전등으로 비추고, 보이는 친구를 터치! "킥킥" 소리가 힌트야';
    this.tip = '말풍선 "킥킥"이 뜬 곳 근처를 비춰 봐!';
    this.intro = [{ who: 'panda', text: '캠핑의 꽃은 밤 숨바꼭질! 손전등 하나로 다섯 명 찾아 봐~' },
      { who: 'mong', text: '화면을 문지르면 손전등이 따라와. 불빛에 보이는 친구를 터치!' }];
    this.time = P.time || 50; this.n = P.n || 5; this.decoys = P.decoys || 0;
    this.bg = ['#1d2250', '#2c2a5e']; this.light = { ambColor: '#5a63b8', amb: .7, sunColor: '#9fa9ff', sun: .45 };
    // the boss version (user, 10/18: "손전등 술래를 보스로 키우기" — it was more fun than the flashlight boss): a bigger floor,
    // more friends, and 너굴이 hiding among them — lighting it up and tapping it costs time while it laughs at you
    if (P.boss) {
      this.title = '손전등 술래 · 보스';
      this.goal = `불 꺼진 층에서 친구 ${this.n}명 찾기! 너굴이를 터치하면 시간이 줄어`;
      this.tip = '"킥킥"은 친구, "흐흐흐"는 너굴이야!';
      this.intro = [{ who: 'raccoon', text: '불 다 껐지롱! 친구들 사이에 나도 숨었다~ 나를 비추면 시간 뺏을 거야!' },
        { who: 'mong', text: '"킥킥"은 친구, "흐흐흐"는 너굴이! 손전등으로 잘 보고 터치!' }];
    }
  }
  map() { return this.P.map || 'camp1'; }
  build() {
    const S = this.S, R = S.room, rooms = R.rooms || [R], W = S.G.world;
    const box = roomBox(R), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    S.frame({ x: c.x, z: c.z, yaw: Math.PI / 4, pitch: .78, zoom: 1.05, w: Math.min(10, (sz.x + sz.z) / Math.SQRT2 * .9), hh: 6 });
    const HIDE = ['tent', 'tentsmall', 'pine', 'pine2', 'tree', 'rock', 'rockpile', 'log', 'cooler', 'trunk', 'firewood', 'bush', 'backpack2', 'lantern', 'campchair'];
    const all = rooms.flatMap(q => q.furns).filter(r => r.type !== 'rug');
    let pool = all.filter(r => HIDE.includes(r.type)); if (pool.length < 7) pool = all;   // indoors (a power cut in a flat): any piece will do
    const spots = pool.map(r => new THREE.Box3().setFromObject(r.f.group));
    spots.sort(() => Math.random() - .5);
    const kinds = ['bunny', 'hamster', 'squirrel', 'frog', 'sleepy', 'shiba'].sort(() => Math.random() - .5);
    this.friends = [];
    for (const b of spots) {
      if (this.friends.length >= this.n + this.decoys) break;
      const cc = b.getCenter(new THREE.Vector3()), p = new THREE.Vector3(cc.x + (b.max.x - cc.x) * .7, 0, cc.z - (b.max.z - cc.z) * .55);
      // (10/19 겹침 QA: a friend stood 22 cm into the tent, 7–11 cm into a pine, a camp chair, a rock) the nearest clear floor
      // beside the piece instead, within .9 m — else not this piece
      const onFloor = (x, z) => rooms.some(q => { const o = q.group.position; return Math.abs(x - o.x) < q.w / 2 - .25 && Math.abs(z - o.z) < q.d / 2 - .25; }) && R.clearAt(x, z, .22);   // (clear of furniture and off the walls)
      if (R.clearAt && !onFloor(p.x, p.z)) {
        let q = null;
        for (let dx = -.9; dx <= .91; dx += .1) for (let dz = -.9; dz <= .91; dz += .1) { const d = dx * dx + dz * dz; if ((!q || d < q.d) && onFloor(p.x + dx, p.z + dz)) q = { d, dx, dz }; }
        if (!q) continue;
        p.x += q.dx; p.z += q.dz;
      }
      if (this.friends.some(f => f.p.distanceTo(p) < 1.2)) continue;
      const s = W.toScreen(p); if (s.x < 30 || s.x > W.W - 30 || s.y < 140 || s.y > W.H - 190) continue;
      const bad = this.friends.length >= this.n;   // after the friends: 너굴이 decoys
      const ch = S.char(bad ? 'raccoon' : kinds[this.friends.length % kinds.length], p.x, p.z); ch.root.scale.setScalar(.8); ch.faceTo(W.cam.position.x, W.cam.position.z);
      this.friends.push({ ch, p, found: false, bad });
    }
    this.dark = h('div', { class: 'mini-dark' }); S.G.ui.wui.prepend(this.dark);
    this.lx = W.W / 2; this.ly = W.H / 2; this.setLamp(this.lx, this.ly);
    this.n = this.friends.filter(f => !f.bad).length;
  }
  setLamp(x, y) { this.lx = x; this.ly = y; this.dark.style.setProperty('--lx', x + 'px'); this.dark.style.setProperty('--ly', y + 'px'); }
  start() { this.left = this.time; this.gig = 2.5; }
  down(x, y) { this.setLamp(x, y); } move(x, y) { this.setLamp(x, y); }
  update(dt) {
    const S = this.S; this.left -= dt; S.setClock(this.left, this.time);
    const n = this.friends.filter(f => f.found && !f.bad).length; S.setStatus(`찾은 친구 ${n} / ${this.n}`, '');
    if (this.left <= 0) return S.done(false, `${n}명 찾았어… 남은 친구들이 킥킥 웃고 있어`);
    if ((this.gig -= dt) <= 0) { this.gig = this.decoys ? 2.6 : 3.2; const f = pick(this.friends.filter(q => !q.found) || []); if (f) S.say(f.ch, f.bad ? '흐흐흐' : '킥킥', 900); }
  }
  tap(x, y) {
    const S = this.S; this.setLamp(x, y);
    for (const f of this.friends) {
      if (f.found) continue;
      const d = near(S, f.p.clone().setY(.4), x, y, 70); if (d == null) continue;
      const sp = S.screen(f.p.clone().setY(.4));
      if (f.bad) {
        // 너굴이: it leaps out laughing and takes 6 seconds; then it scurries to another dark spot
        this.left = Math.max(.5, this.left - 6); S.G.audio.sfx('locked');
        f.ch.setFace('happy'); f.ch.pose = 'point'; S.say(f.ch, '메롱~ 나였지롱!', 1100); f.ch.hopTo(S.tw, f.p.x, f.p.z, { height: .6, dur: .45 });
        S.G.ui.floatText(sp.x, sp.y - 30, '-6초', 'red');
        document.getElementById('app').animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], { duration: 220 });
        const to = pick(this.friends.filter(q => q !== f && !q.found)) || f; const np = to.p.clone().add(new THREE.Vector3(.5, 0, .4));
        S.tw.wait(.9).then(() => { if (f.found) return; f.ch.root.position.set(np.x, 0, np.z); f.p.copy(np); f.ch.pose = 'idle'; });
        return;
      }
      f.found = true; S.G.audio.sfx('special'); f.ch.setFace('wow'); S.say(f.ch, '들켰다~!', 1000); f.ch.hopTo(S.tw, f.p.x, f.p.z, { height: .5, dur: .4 });
      S.G.world.fx.burst(sp.x, sp.y, { n: 14, shape: 'star' });
      if (this.friends.every(q => q.found || q.bad)) return S.done(true, this.decoys ? '너굴이를 피해 친구들을 다 찾았어! 손전등 탐정' : '어둠 속 친구들을 다 찾았어! 손전등 탐정');
      return;
    }
  }
  bot(dt) { if ((this._bt = (this._bt || 0) + dt) < 1.0) return; this._bt = 0; const f = this.friends.find(q => !q.found && !q.bad); if (f) { const s = this.S.screen(f.p.clone().setY(.4)); this.tap(s.x, s.y); } }
  dispose() { this.dark?.remove(); }
}

export const GAMES = { sneak: Sneak, spot: Spot, redlight: RedLight, shell: Shell, whack: Whack, lamp: Lamp };
// region boss games: the stage index after which each comes, and how it is presented
// 레벨 디자인 (user, 10/18: "미니게임… 숨은그림찾기 너무 계속 나오면 지겨워서 넣는거야"): a little game about every three
// stages so the searching never runs on too long — each region ends on its own boss game, and in between come lighter
// ones on that region's maps (the same game never twice within ~8 stages). 보물 지키기 (boss.js) adds a mid-boss now and then.
// 판 사이 놀이 (10/18 밤, user: "미니게임과 보스판을 약간 더 늘리는식으로… 막 게임 코어 바뀔정도로 늘리지말고 … 잘 배치해줘"):
// a break after every third stage or so, never two in a row — at least two stages to play between them, the line that
// keeps hidden objects the game — the same games coming back a level up (두더지 3·24, 무궁화 6·63, 바꿔치기 34·52,
// 손전등 15; 10/19: 43 다 같이 집으로 took the second 손전등), the boss games climbing through the campaign (야식 12·40·70, 깨우기 31·46·60, 호텔 21, 보물 지키기
// 18·27·37·49·55 in scenes/boss.js, 손전등 보스 66). Off the campaign but in 놀이 모음: 이불 lv1·2, 무궁화 lv2, 호텔 lv0·1.
export const MINI_AFTER = {
  2: { kind: 'whack', lab: true, lv: 0 },   // 1장: 두더지 숨바꼭질 새 버전 (user: "두더지 되게 재밌네", "두더지는 초반에")
  5: { kind: 'redlight', lab: true, lv: 0 },   // 1장: 무궁화 새 판 운동장 (user, 10/18: "무궁화 꽃이 피었습니다 재밌어")
  8: { kind: 'blanket', lab: true, lv: 0 },   // 1장: 이불 속 누구게? 파자마 파티 — after the night in 토순이네 침실+욕실
  14: { kind: 'gohome', lab: true, lv: 8 },   // 2장: 다 같이 집으로! 첫 두 판 — 4×4 놀이터 → 덤불 (10/19, user: "무궁화보다 이게 더 재밌어", "9판째 이후면 좋겠다")
  22: { kind: 'redlight', lab: true, lv: 2 },   // 3장: 무궁화 두 번 돌아보기 — 23판 뒤 (사용자 10/21 "19 26 미니게임 하나없이 달려서 갑갑", 스토리 룸·② 레벨: 21 호텔 · 23 무궁화 · 27 보물 지키기 · 29 두더지 · 31 깨우기)
  28: { kind: 'whack', lab: true, lv: 1 },  // 3장: 두더지 — 변장한 너굴이 첫 등장 (24판 뒤 → 29판 뒤: 23판 무궁화와 붙지 않게)
  33: { kind: 'spot', p: { map: 'konbini', n: 3, time: 40 } },   // 4장: 먹물이의 바꿔치기
  42: { kind: 'lamp', p: { map: 'park1', time: 45 } },   // 5장: 손전등 술래 (15판 뒤 자리를 다 같이 집으로!에 주고 여기로)
  51: { kind: 'gohome', lab: true, lv: 7 },   // 6장: 다 같이 집으로! 두 판 — 캠핑장 → 졸린 친구 (10/19 — 바꿔치기 두 번째 자리)
  57: { kind: 'whack', lab: true, lv: 2 },   // 6장: 두더지 피버 수풀 (10/19: 발자국 따라 찾기는 놀이 모음에만 — user "화살표만 재밌는거같다", "두더지잡기가 재밌어")
  62: { kind: 'redlight', lab: true, lv: 1 },   // 7장: 무궁화 새 판 킥킥 너굴이
  // 66판 뒤 보스: 손전등 술래를 키운 판 (user, 10/18: 보스 손전등은 "ㅈㄴ 재미없다", "손전등 술래 재밌는데" → "손전등 술래를 보스로 키우기")
  65: { kind: 'lamp', boss: true, p: { map: 'officefloor', time: 80, n: 8, decoys: 2, boss: true } },
};


// 보스전 (10/18): the five games from the new-game session (scenes/bossgame.js) — each region ends on one, the good ones come
// back (user: "보스판은 여러 종류로 갈 거고 재미있는 판은 다시 나올 거"), 엄마 몰래 야식 first and last ("이건 대박"). lv = which
// of the game's three set-ups. 보물 지키기 (boss.js BOSS_AFTER) fills three more boss slots.
export const BOSS_GAMES = {
  11: { kind: 'yasik', lv: 0 },    // 첫 보스: 1장 끝
  20: { kind: 'hotel', lv: 2 },    // 우리 아파트 끝 — 몽글 호텔 3박 4일 (user, 10/18: "실제에서 3박 4일 정도로 하는 거지?")
  30: { kind: 'wakeup', lv: 0 },   // 동네 골목 끝 — 첫째 아침
  39: { kind: 'yasik', lv: 1 },    // 편의점·상가 끝
  45: { kind: 'wakeup', lv: 1 },   // 공원 가운데 — 공 (보스 놀이 하나 더, 10/18 밤)
  59: { kind: 'wakeup', lv: 2 },   // 산길·캠핑 끝 (텐트의 아침) — 자명종
  69: { kind: 'yasik', lv: 2 },    // 마지막 보스
};
export const MINI_INFO = {
  sneak: { name: '냥냥이 몰래 야식', face: 'cat' },
  spot: { name: '너굴이의 바꿔치기', face: 'raccoon' },
  redlight: { name: '무궁화 꽃이 피었습니다', face: 'raccoon' },
  shell: { name: '햄찌의 야바위', face: 'hamster' },
  whack: { name: '두더지 숨바꼭질', face: 'frog' },
  lamp: { name: '손전등 술래', face: 'panda' },
  finale: { name: '숨바꼭질 왕 결정전', face: 'nerd', seq: ['spot', 'shell', 'whack'],
    params: [{ map: 'lobby', n: 3, time: 35 }, { map: 'konbini', rounds: 2 }, { map: 'rooftop', goal: 10, time: 30 }], winLine: '세 판을 모두 이겼어! 진짜 숨바꼭질 왕이다!' },
};

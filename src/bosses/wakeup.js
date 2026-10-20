// ④ 아침 깨우기 장치 — 졸졸이 won't wake up. Build a silly chain reaction out of the things in its room.
// Edit: tap a piece in the tray → the free tiles glow → tap one to put it there (or drag it straight from the tray).
// Tap a placed piece to turn it; drag it to move it, or back onto the tray to take it out. 시작!: 몽글이 kicks the ball
// and the chain plays (sim.js decides everything up front; this file only animates the event list it returns).
// Win: 졸졸이 springs out of bed. Fail: a "?" pops where it stopped, everything snaps back, pieces stay where they were.
import * as THREE from 'three';
import { MapRooms } from '../map.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { buildItem } from '../gfx/items.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree, rbox, sph, cyl, tor, hemi, put, mat, blobShadow, canvasTex } from '../gfx/kit.js';
import { renderThumbs } from '../thumbs.js';
import { ICON } from '../ui.js';
import * as S from './wakeup-sim.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
const MORNING = { ambColor: '#fff3e8', amb: 1.52, sunColor: '#fff1d8', sun: 2.35 };
const THEME = { ...THEMES.peng, name: '졸졸이 방', bg: ['#ffe9d2', '#ffd6c0'], floorKind: 'planks', floor: '#e6bf92', floor2: '#c29463', wallKind: 'star', wall: '#f5f5ff',
  wall2: '#dfe2fb', wainscot: '#b6c2f4', accent: '#8f9cff', accent2: '#ffd36e', accent3: '#ff9fb5', door: '#ffd59a', sheet: '#ffffff', pillow: '#fff3d6', curtain: '#ffd36e' };
const UP = new THREE.Vector3(0, 1, 0), Q = new THREE.Quaternion(), V = new THREE.Vector3();
const YAW = d => Math.atan2(S.DIRS[d][0], S.DIRS[d][1]);
const DV = d => new THREE.Vector3(S.DIRS[d][0], 0, S.DIRS[d][1]);
const BALL_S = 1.6, BALL_R = .12 * BALL_S;
const BOOK_COLS = ['#5fb8ff', '#ff8f6b', '#7fd68f', '#c9a7ff', '#ffcf4a'];

// ── the toy pieces (origin at the bottom centre of their tile; no shadow-map casting: they move, so blob shadows)
function finish(root, r = .34) {
  root.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
  root.add(blobShadow(r, .24));
  return root;
}
function makeBall() {
  const root = new THREE.Group(), spin = new THREE.Group();
  const b = buildItem('ball'); b.position.y = -.12; spin.add(b); spin.scale.setScalar(BALL_S); spin.position.y = BALL_R;
  root.add(spin); finish(root, .2);
  return { root, spin };
}
function makeBook(color) {
  const root = new THREE.Group(), tilt = new THREE.Group(), body = new THREE.Group(); root.add(tilt); tilt.add(body);
  const T = .17, H = .74, Wd = .5;
  body.add(put(rbox(T, H, Wd, color, .035), 0, H / 2, 0));
  body.add(put(rbox(T - .05, H - .07, .05, '#fff6e2', .01), 0, H / 2, Wd / 2 - .012));      // the pages' fore-edge
  body.add(put(rbox(T - .05, .03, Wd - .07, '#fff6e2', .01), 0, H - .02, .01));              // pages on top
  for (const s of [-1, 1]) {                                                                   // a label and a star on both covers
    body.add(put(rbox(.012, .22, .3, '#ffffff', .02), s * (T / 2 + .004), H * .62, 0));
    body.add(put(sph(.06, '#ffd23f', null, 10, 8), s * (T / 2 + .006), H * .3, 0, 0, 0, 0, [.2, 1, 1]));
  }
  body.add(put(rbox(T + .006, .05, .04, '#3a2453', .01), 0, H * .15, -Wd / 2 + .02));        // a spine band
  finish(root, .3);
  return { root, tilt, body, T, H };
}
// the curved guides painted on a 반사판's mat (board-local: the board runs along x; each arc joins the two tile edges
// on one side of it — exactly the turn a ball makes there)
let DEFL_TEX = null;
function deflTex() {
  if (DEFL_TEX) return DEFL_TEX;
  DEFL_TEX = canvasTex(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const k = w / 1.42, R = .5 * k, cx = w / 2;
    for (const [cy, a0] of [[h / 2 - .707 * k, Math.PI * .25], [h / 2 + .707 * k, Math.PI * 1.25]]) {
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(58,36,83,.35)'; c.lineWidth = 22; c.beginPath(); c.arc(cx, cy, R, a0 + .08, a0 + Math.PI / 2 - .08); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 13; c.setLineDash([22, 14]); c.beginPath(); c.arc(cx, cy, R, a0 + .08, a0 + Math.PI / 2 - .08); c.stroke(); c.setLineDash([]);
    }
  });
  return DEFL_TEX;
}
function makeDefl() {
  const root = new THREE.Group(), board = new THREE.Group();
  root.add(put(rbox(.88, .05, .88, '#ffe7c8', .04), 0, .025, 0));
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 1.42), new THREE.MeshBasicMaterial({ map: deflTex(), transparent: true, depthWrite: false }));
  decal.rotation.x = -Math.PI / 2; decal.position.y = .056; decal.renderOrder = 2; board.add(decal);
  board.add(put(rbox(1.04, .22, .22, '#ff7fae', .08), 0, .16, 0));
  board.add(put(rbox(1.07, .08, .27, '#ffe16b', .04), 0, .29, 0));
  for (const s of [-1, 1]) board.add(put(sph(.11, '#ffffff'), s * .53, .17, 0));
  for (const s of [-1, 1]) for (const z of [-1, 1]) board.add(put(sph(.05, '#8fd3ff'), s * .27, .16, z * .11, 0, 0, 0, [1, 1, .4]));
  root.add(board); finish(root, .45);
  return { root, board, decal };
}
function makeFan() {
  const root = new THREE.Group(), head = new THREE.Group(), blades = new THREE.Group();
  root.add(put(cyl(.25, .29, .08, '#7fc8ff'), 0, .04, 0));
  root.add(put(cyl(.04, .045, .5, '#ffffff'), 0, .32, 0));
  head.position.set(0, .64, 0); root.add(head);
  head.add(put(sph(.1, '#7fc8ff'), 0, 0, -.08, 0, 0, 0, [1, 1, .9]));
  head.add(put(tor(.27, .032, '#ffffff'), 0, 0, .03));
  head.add(put(tor(.17, .014, '#ffffff'), 0, 0, .06));
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .3; blades.add(put(sph(.11, '#ffd36e'), Math.cos(a) * .13, Math.sin(a) * .13, 0, 0, 0, a, [1.15, .5, .14])); }
  blades.position.z = .03; head.add(blades);
  head.add(put(sph(.05, '#ff7fae'), 0, 0, .08));
  // an arrow on the floor in front: which way it blows
  const sh = new THREE.Shape(); sh.moveTo(-.13, 0); sh.lineTo(.13, 0); sh.lineTo(0, .2); sh.lineTo(-.13, 0);
  const arrow = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .92, side: THREE.DoubleSide, depthWrite: false }));
  arrow.rotation.x = Math.PI / 2; arrow.position.set(0, .03, .36); arrow.renderOrder = 3; root.add(arrow);
  finish(root, .32);
  return { root, head, blades, arrow };
}
function makeClock() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const R = .23, y0 = .36;
  body.add(put(cyl(R, R, .17, '#ff6f86'), 0, y0, 0, Math.PI / 2, 0, 0));
  body.add(put(cyl(R * .82, R * .82, .02, '#fff6e2'), 0, y0, .088, Math.PI / 2, 0, 0));
  body.add(put(rbox(.03, .13, .012, '#3a2453', .006), .03, y0 + .05, .1, 0, 0, -.6));
  body.add(put(rbox(.026, .16, .012, '#3a2453', .006), -.04, y0 + .06, .104, 0, 0, .7));
  body.add(put(sph(.025, '#ffd23f'), 0, y0, .11));
  for (const s of [-1, 1]) {
    body.add(put(hemi(.1, '#ffd23f'), s * .14, y0 + R - .01, 0, 0, 0, -s * .5));
    body.add(put(cyl(.03, .03, .14, '#3a2453'), s * .14, .06, 0, 0, 0, s * .4));
  }
  body.add(put(cyl(.012, .012, .12, '#a9b2c8'), 0, y0 + R + .06, 0));
  body.add(put(sph(.035, '#ffd23f'), 0, y0 + R + .12, 0));
  finish(root, .26);
  return { root, body };
}

// the story opening and the find phase play only the first time this boss is met (per page; 다시 / later mornings skip it)
let INTRO_SEEN = false;

// HUD icons, rendered once per page (every new morning would otherwise spin up another WebGL context)
let ICONS = null;
function pieceIcons() {
  if (ICONS) return ICONS;
  ICONS = renderThumbs([
    { key: 'defl', build: () => makeDefl().root, dir: [.5, .9, 1] },
    { key: 'fan', build: () => { const f = makeFan(); f.root.rotation.y = .6; return f.root; }, dir: [.6, .45, 1] },
    { key: 'clock', build: () => makeClock().root, dir: [.25, .35, 1] },
    { key: 'ball', build: () => makeBall().root, dir: [.4, .6, 1] },
    { key: 'book', build: () => { const b = makeBook('#5fb8ff'); b.root.rotation.y = -.9; return b.root; }, dir: [.5, .5, 1] },
  ], 128);
  return ICONS;
}

function roomDef(LV) {
  const furniture = [F('bed', LV.bed[0], LV.bed[1], 0), ...LV.furn.map(f => F(f.type, f.i, f.j, f.rot || 0, f.opts))];
  const layout = { w: LV.w, d: LV.d, theme: THEME, wallH: 2.9, walls: { N: 'wall', W: 'wall' }, furniture,
    decor: [D('window', 'N', -.1), D('posterwall', 'N', -1.9), D('door', 'W', -1.3), D('picture', 'W', .9)] };
  return { theme: THEME, bleed: true, rooms: [{ at: [0, 0], layout }] };
}

// small WebAudio voices of our own (the shared kit has no alarm bell, boing, fan or meow)
function synth(A) {
  const ok = () => { if (A.muted) return null; if (!A.ctx) A.unlock?.(); return A.ctx && A.sfxBus ? A.ctx : null; };
  const tone = ({ type = 'sine', f = 440, f2 = null, dur = .12, vol = .3, at = 0, vib = 0, lp = 0 }) => {
    const c = ok(); if (!c) return;
    const t0 = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t0 + dur);
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 16; lg.gain.value = vib; l.connect(lg).connect(o.frequency); l.start(t0); l.stop(t0 + dur + .02); }
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .005); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    let n = o; if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); n = fl; }
    n.connect(g).connect(A.sfxBus); o.start(t0); o.stop(t0 + dur + .03);
  };
  const noise = ({ dur = .15, vol = .25, at = 0, f = 1500, f2 = null, q = 1, type = 'bandpass' }) => {
    const c = ok(); if (!c) return;
    const t0 = c.currentTime + at, len = Math.ceil(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t0); fl.Q.value = q; if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(fl).connect(g).connect(A.sfxBus); s.start(t0);
  };
  return {
    roll: n => tone({ type: 'triangle', f: 180 + n * 22, dur: .05, vol: .07 }),
    boing: () => { tone({ type: 'triangle', f: 260, f2: 640, dur: .1, vol: .26 }); tone({ type: 'sine', f: 620, f2: 380, dur: .22, vol: .16, at: .06, vib: 28 }); },
    clack: () => { noise({ dur: .07, vol: .32, f: 1300, q: 2 }); tone({ type: 'square', f: 190, f2: 110, dur: .08, vol: .1, lp: 1500 }); },
    knock: () => { noise({ dur: .06, vol: .25, f: 700, q: 1.4 }); tone({ type: 'sine', f: 150, f2: 70, dur: .12, vol: .3 }); },
    ring: (dur = 1) => { const n = Math.round(dur / .05); for (let k = 0; k < n; k++) tone({ type: 'square', f: k % 2 ? 1850 : 2280, dur: .045, vol: .06, at: k * .05, lp: 6000 }); tone({ type: 'sine', f: 2600, dur: dur + .3, vol: .05 }); },
    whirr: () => { noise({ dur: 1.1, vol: .12, f: 500, f2: 1100, q: .7 }); tone({ type: 'sine', f: 95, f2: 140, dur: 1.0, vol: .12, vib: 6 }); },
    gust: () => noise({ dur: .5, vol: .16, f: 2600, f2: 900, q: .6 }),
    meow: () => { tone({ type: 'sine', f: 620, f2: 980, dur: .13, vol: .2 }); tone({ type: 'sine', f: 980, f2: 520, dur: .32, vol: .2, at: .12, vib: 22 }); tone({ type: 'triangle', f: 1240, f2: 1040, dur: .3, vol: .05, at: .12 }); },
    wake: () => { tone({ type: 'triangle', f: 300, f2: 1200, dur: .28, vol: .25 }); tone({ type: 'sine', f: 900, f2: 450, dur: .3, vol: .16, at: .25, vib: 40 }); noise({ dur: .3, vol: .18, f: 3000, f2: 1200, at: .02 }); },
    nom: () => { tone({ type: 'sine', f: 520, f2: 300, dur: .08, vol: .22 }); tone({ type: 'sine', f: 560, f2: 320, dur: .08, vol: .2, at: .11 }); },
  };
}

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.objs = {}; this.slots = []; this.phase = 'intro'; this.result = null; this.tries = 0; this.freeze = 0; this.shake = 0; this.shOff = new THREE.Vector3(); this.marks = []; this.bookN = 0; this.focus = new THREE.Vector3(); this.snd = synth(L.audio); this.stars = 0; this.wins = 0; }
  async enter({ lv = 0, intro = null } = {}) {
    const L = this.L, W = L.world, ui = L.ui;
    this.lvIdx = clamp(lv | 0, 0, S.LEVELS.length - 1); const LV = this.LV = S.LEVELS[this.lvIdx];
    this.intro = !!(LV.hide && (intro ?? !INTRO_SEEN));
    const app = document.getElementById('app'); app.dataset.night = ''; app.dataset.morning = '1';
    L.setBg(THEME.bg); W.setLight(MORNING);
    const map = this.map = new MapRooms(W, roomDef(LV));
    W.root.add(map.group); map.group.updateMatrixWorld(true);
    this.bed = map.furns.find(r => r.type === 'bed');
    this.quilt = this.bed?.f.parts.find(p => p.label === '이불') || this.bed?.f.parts[1];
    this.free = new Set(S.freeTiles(LV).map(([i, j]) => i + ',' + j));
    this.frame();
    this.buildBoard();
    this.buildCast();
    this.icons = pieceIcons();
    if (this.intro) this.hideThings();
    L.makeThumbs({ items: ['cookie'], faces: [['sleepy', 'wow'], ['sleepy', 'normal']] });
    this.buildHud();
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    if (this.intro) {
      // 몽글이 drops by to play; 졸졸이 is still asleep → find the ball and the alarm clock → build the contraption
      this.phase = 'story'; this.refresh();
      await this.story(); if (this.dead) return;
      await this.findPhase(); if (this.dead) return;
    } else {
      this.refresh();
      await ui.banner(LV.name, LV.sub, 1500);
      if (this.dead) return;
    }
    this.phase = 'edit';
    this.setTrays();
    this.announceNew();
    this.refresh();
  }

  // ── the opening: three beats, each auto-advances (a tap skips ahead)
  async story() {
    const L = this.L, W = L.world, m = this.mong, tw = this.tw;
    const door = this.map.rooms[0].decors.find(d => d.type === 'door'), dp = door?.f.doorPart || door?.f.parts[0];
    const dz = door ? door.f.group.getWorldPosition(new THREE.Vector3()).z : this.mongHome.z, x0 = -this.LV.w / 2;
    m.root.position.set(x0 - .7, 0, dz); m.root.rotation.y = Math.PI / 2;
    await tw.wait(.35);
    if (dp) { L.audio.sfx('door'); tw.run(.35, k => dp.setOpen(k)); }
    await tw.wait(.3);
    await m.hopTo(tw, x0 + .45, dz, { height: .35, dur: .4, sfx: n => L.audio.sfx(n) });
    await m.walkTo(tw, this.mongHome.x, this.mongHome.z);
    m.root.rotation.y = Math.atan2(this.zz.root.position.x - m.root.position.x, this.zz.root.position.z - m.root.position.z);
    if (dp) tw.run(.35, k => dp.setOpen(1 - k)).then(() => L.audio.sfx('close'));
    m.setFace('happy'); m.pose = 'wave';
    await this.beat(m, '졸졸아~ 놀자!', 1.5);
    m.pose = 'idle';
    W.flyTo(tw, { target: this.zz.root.position.clone().setY(.6), zoom: 1.55, dur: .55 });
    await tw.wait(.45);
    this.zz.bump(.2); L.audio.sfx('hmm');
    await this.beat(this.zz, '드르렁~ 쿨쿨…', 1.5, 'think');
    W.flyTo(tw, { target: W.home.clone(), zoom: 1.06, dur: .55 });
    m.setFace('sweat');
    await this.beat(m, '아직 자네… 깨워야겠다!', 1.7);
    m.setFace('normal'); m.root.rotation.y = YAW(this.LV.mong.dir);
  }
  // one speech beat: shows the bubble, waits (or until a tap), takes it down
  beat(ch, text, dur, cls = '') {
    const b = this.say(ch, text, dur * 1000 + 400, cls);
    return new Promise(res => { const done = () => { if (this._beatRes === done) this._beatRes = null; b.remove(); res(); }; this._beatRes = done; this.tw.wait(dur).then(done); });
  }

  // ── the find phase: the ball and the alarm clock are tucked away in easy spots; tap them (or what hides them)
  hideThings() {
    const W = this.L.world;
    this.hidden = this.LV.hide.map(hd => {
      const o = this.objs[hd.id], host = this.map.furns.find(r => r.type === hd.furn);
      const b = host ? new THREE.Box3().setFromObject(host.f.group) : null, c = b ? b.getCenter(new THREE.Vector3()) : this.tw3(0, 0);
      const pos = hd.top && b ? new THREE.Vector3(c.x, b.max.y - .02, c.z + .08) : new THREE.Vector3(c.x + (hd.dx || 0), 0, c.z + (hd.dz || 0));
      o.root.position.copy(pos);
      return { ...hd, o, host, pos, found: false };
    });
    W.idsDirty = true;
  }
  async findPhase() {
    const L = this.L, ui = L.ui;
    this.phase = 'find'; this.findT = 0; this.found = 0; this.setTrays(); this.refresh();
    this.setHint('공이랑 자명종을 찾아서 콕!');
    await new Promise(res => { this._findDone = res; });
    if (this.dead) return;
    INTRO_SEEN = true;
    this.setHint('');
    await this.tw.wait(.6);
    await this.beat(this.mong, '좋아, 이걸로 깨우자!', 1.2);
    await ui.banner('준비 완료!', '장치를 만들자', 1300);
    if (this.dead) return;
    // the found things hop out of the tray to where the contraption needs them
    for (const it of this.hidden) {
      const o = it.o, r = it.slotEl.getBoundingClientRect(), tgt = this.L.world.toScreen(V.copy(this.tw3(o.home.i, o.home.j)).setY(.3));
      const dot = L.h('div', { style: `position:absolute;left:${tgt.x - 2}px;top:${tgt.y - 2}px;width:4px;height:4px;pointer-events:none` }); document.getElementById('app').append(dot);
      it.slotEl.classList.remove('wk-have');
      L.audio.sfx('whoosh');
      await ui.flyImg(this.icons[it.icon], r.left + r.width / 2, r.top + r.height / 2, dot, { size: 60, dur: 480 });
      dot.remove(); if (this.dead) return;
      this.resetPiece(o); o.root.visible = true; this.pop(o.root, .45); L.audio.sfx('place');
      L.world.fx.burst(tgt.x, tgt.y, { n: 14, speed: 200, size: 9, life: .55 });
      await this.tw.wait(.15);
    }
    this.findTray.classList.add('wk-gone');
  }
  // a tap during the find phase: did it land on (or near) a hidden thing, or on what hides it?
  tapFind(x, y) {
    const W = this.L.world;
    for (const it of this.hidden) {
      if (it.found) continue;
      const s = W.toScreen(V.copy(it.o.root.position).setY(it.o.root.position.y + .25));
      const near = Math.hypot(s.x - x, s.y - y) < 46, hit = W.pick(x, y, [it.o.root, ...(it.host ? [it.host.f.group] : [])]).length > 0;
      if (near || hit) { this.foundIt(it); return true; }
    }
    this.L.audio.sfx('tap');
    return false;
  }
  foundIt(it) {
    const L = this.L, W = L.world, ui = L.ui, o = it.o;
    it.found = true; this.found++; this.findT = 0; if (this.hintIt === it) this.hintIt = null;
    L.audio.sfx('found', this.found * 3); this.freeze = .06;
    const p0 = o.root.position.clone();
    const sp = W.toScreen(V.copy(p0).setY(p0.y + .4));
    W.fx.burst(sp.x, sp.y, { n: 22, speed: 280, size: 11, up: 80 }); W.fx.ring(sp.x, sp.y, { r: 60, color: '#ffe16b', width: 7, life: .5 });
    ui.floatText(sp.x, sp.y - 30, '찾았다!', 'gold big');
    this.mong.setFace('happy'); this.mong.bump(.35); this.say(this.mong, it.line, 1300);
    this.tw.run(.45, k => { o.root.position.set(p0.x, p0.y + Math.sin(k * Math.PI) * .7 + k * .2, p0.z); o.root.scale.setScalar(1 + .45 * Math.sin(k * Math.PI)); o.root.rotation.y += .25; }, ease.linear).then(async () => {
      if (this.dead) return;
      o.root.visible = false; o.root.scale.setScalar(1);
      const s2 = W.toScreen(V.copy(o.root.position).setY(o.root.position.y + .3));
      await ui.flyImg(this.icons[it.icon], s2.x, s2.y, it.slotEl, { size: 70, dur: 600 });
      if (this.dead) return;
      it.slotEl.classList.remove('wk-sil', 'got'); void it.slotEl.offsetWidth; it.slotEl.classList.add('wk-have', 'got');
      L.audio.sfx('pop', 6 + this.found);
      if (this.hidden.every(h => h.found)) { this.mong.setFace('happy'); this._findDone?.(); }
    });
  }
  tw3(i, j) { return new THREE.Vector3(-this.LV.w / 2 + i + .5, 0, -this.LV.d / 2 + j + .5); }
  frame() {
    const W = this.L.world;
    W.home.set(0, .45, .15); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = .8; W.zoom = 1.06;
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(8.4, 6.2, .5);
  }

  // ── the board: a faint tile grid, the glow on free tiles, the dotted path of the first ball, the last try's trail
  buildBoard() {
    const LV = this.LV, W = this.L.world, R = 64;
    const tex = canvasTex(LV.w * R, LV.d * R, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      for (let j = 0; j < LV.d; j++) for (let i = 0; i < LV.w; i++) {
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.fillStyle = 'rgba(255,255,255,.07)';
        const x = i * R + 4, y = j * R + 4, s = R - 8, r = 10;
        c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + s, y, x + s, y + s, r); c.arcTo(x + s, y + s, x, y + s, r); c.arcTo(x, y + s, x, y, r); c.arcTo(x, y, x + s, y, r); c.closePath(); c.fill(); c.stroke();
      }
    });
    const grid = this.grid = new THREE.Mesh(new THREE.PlaneGeometry(LV.w, LV.d), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: .9 }));
    grid.rotation.x = -Math.PI / 2; grid.position.y = .012; grid.renderOrder = 1; W.root.add(grid);
    // glow tiles
    const gt = canvasTex(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.62)'; c.strokeStyle = '#ffffff'; c.lineWidth = 14;
      const r = 26; c.beginPath(); c.moveTo(12 + r, 12); c.arcTo(116, 12, 116, 116, r); c.arcTo(116, 116, 12, 116, r); c.arcTo(12, 116, 12, 12, r); c.arcTo(12, 12, 116, 12, r); c.closePath(); c.fill(); c.stroke(); });
    this.glowMat = new THREE.MeshBasicMaterial({ map: gt, color: '#5cd2ff', transparent: true, depthWrite: false, opacity: .8 });
    this.hoverMat = new THREE.MeshBasicMaterial({ map: gt, color: '#7dffb0', transparent: true, depthWrite: false, opacity: .85 });
    this.glow = new THREE.Group(); this.glowT = {};
    const gg = new THREE.PlaneGeometry(.9, .9);
    for (let j = 0; j < LV.d; j++) for (let i = 0; i < LV.w; i++) {
      const m = new THREE.Mesh(gg, this.glowMat); m.rotation.x = -Math.PI / 2; m.position.copy(this.tw3(i, j)).setY(.024); m.renderOrder = 2; m.visible = false;
      this.glow.add(m); this.glowT[i + ',' + j] = m;
    }
    this.hover = new THREE.Mesh(gg, this.hoverMat); this.hover.rotation.x = -Math.PI / 2; this.hover.renderOrder = 3; this.hover.visible = false;
    W.root.add(this.glow, this.hover);
    this.dotGeo = new THREE.CircleGeometry(.065, 14);
    const dm = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
    this.pathMat = dm('#ffffff', .95); this.trailMat = dm('#ff9a52', .62); this.windMat = dm('#55c3ff', .62);
    this.pathG = new THREE.Group(); this.trailG = new THREE.Group(); W.root.add(this.pathG, this.trailG);
    const ah = new THREE.Shape(); ah.moveTo(-.14, 0); ah.lineTo(.14, 0); ah.lineTo(0, .22); ah.lineTo(-.14, 0);
    this.arrowGeo = new THREE.ShapeGeometry(ah);
  }
  dots(group, pts, mat, { r = 1, gap = .27, arrow = null } = {}) {
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1], b = pts[k], len = a.distanceTo(b);
      for (let s = (k === 1 ? .25 : 0); s < len - 1e-3; s += gap) {
        const m = new THREE.Mesh(this.dotGeo, mat); m.rotation.x = -Math.PI / 2; m.scale.setScalar(r); m.position.lerpVectors(a, b, s / len).setY(.03); m.renderOrder = 3; group.add(m);
      }
    }
    if (arrow != null && pts.length) {
      // a flat arrowhead pointing where the ball runs into something
      const p = pts[pts.length - 1], m = new THREE.Mesh(this.arrowGeo, mat), g = new THREE.Group();
      m.rotation.x = Math.PI / 2; m.renderOrder = 3; g.add(m);
      g.position.copy(p).addScaledVector(DV(arrow), .28).setY(.03); g.rotation.y = YAW(arrow); group.add(g);
    }
  }
  clearGroup(g) { for (const c of [...g.children]) g.remove(c); }
  // the first ball's path (through any 반사판) up to whatever it first runs into
  drawPath() {
    this.clearGroup(this.pathG);
    if (this.phase !== 'edit' && this.phase !== 'intro') return;
    const r = S.simulate(this.LV, this.placedSpecs());
    const pts = [this.tw3(...S.startBall(this.LV))]; let dir = this.LV.mong.dir;
    for (const e of r.events) {
      if (e.e === 'kick' || e.e === 'cookie') continue;
      if (e.e === 'step' && e.id === 'ball0') { pts.push(this.tw3(...e.to)); dir = e.dir; continue; }
      if (e.e === 'bounce' && e.ball === 'ball0') { dir = e.dout; continue; }
      if ((e.e === 'hit' || e.e === 'bump') && e.id === 'ball0') dir = e.dir;
      break;
    }
    this.dots(this.pathG, pts, this.pathMat, { arrow: dir });
  }
  // where everything went last time (balls orange, wind blue)
  drawTrail(r) {
    this.clearGroup(this.trailG);
    const runs = [], cur = {};
    for (const e of r.events) {
      if (e.e !== 'step' && e.e !== 'gust') continue;
      const key = e.e === 'step' ? e.id : 'w' + e.fan;
      let run = cur[key];
      if (!run || run.end !== e.from + '') { run = cur[key] = { pts: [this.tw3(...e.from)], wind: e.e === 'gust', end: '' }; runs.push(run); }
      run.pts.push(this.tw3(...e.to)); run.end = e.to + '';
    }
    for (const run of runs) this.dots(this.trailG, run.pts, run.wind ? this.windMat : this.trailMat, { r: .75, gap: .3 });
    this.trailG.visible = true;
  }

  // ── the cast and the level's own pieces
  buildCast() {
    const LV = this.LV, W = this.L.world;
    const mong = this.mong = new Char('mong'); W.root.add(mong.root);
    mong.root.position.copy(this.tw3(...LV.mong.at)); mong.root.rotation.y = YAW(LV.mong.dir);
    this.mongHome = mong.root.position.clone();
    const zz = this.zz = new Char('sleepy'); W.root.add(zz.root);
    const hp = this.tw3(LV.bed[0], LV.bed[1]);
    zz.root.position.set(hp.x, .5, hp.z + .1); zz.root.rotation.y = .25; this.zzHome = zz.root.position.clone();
    if (LV.ear) { zz.buildAcc('headphones', { color: '#ff6f91' }, zz.def); zz.phones?.traverse(m => { if (m.isMesh) m.castShadow = false; }); }
    zz.setFace('normal');
    const sb = S.startBall(LV);
    this.addPiece({ id: 'ball0', type: 'ball', i: sb[0], j: sb[1], fixed: true });
    LV.fixed.forEach((f, n) => this.addPiece({ ...f, id: 'f' + n, fixed: true }));
    if (LV.cookie) {
      const root = new THREE.Group(), item = buildItem('cookie');
      root.add(put(cyl(.26, .23, .035, '#ffffff'), 0, .018, 0)); item.scale.setScalar(1.7); item.position.y = .04; root.add(item);
      root.position.copy(this.tw3(...LV.cookie)); finish(root, .26); W.root.add(root);
      this.cookie = { root, item, home: item.position.clone() };
    }
  }
  addPiece(p) {
    let o;
    switch (p.type) {
      case 'ball': o = makeBall(); break;
      case 'book': o = makeBook(BOOK_COLS[this.bookN++ % BOOK_COLS.length]); break;
      case 'defl': o = makeDefl(); break;
      case 'fan': o = makeFan(); break;
      case 'clock': o = makeClock(); break;
      case 'cat': { const c = new Char('churro'); o = { root: c.root, char: c }; break; }
      default: throw new Error('piece ' + p.type);
    }
    Object.assign(o, { id: p.id, type: p.type, home: { i: p.i, j: p.j, o: p.o || 0 }, fixed: !!p.fixed, slot: p.slot ?? null, face: p.face || 'x' });
    o.root.traverse(m => { if (m.isMesh) m.userData.piece = o; });
    this.L.world.root.add(o.root);
    this.objs[p.id] = o;
    this.resetPiece(o);
    this.L.world.idsDirty = true;
    return o;
  }
  resetPiece(o) {
    o.root.position.copy(this.tw3(o.home.i, o.home.j)); o.root.scale.setScalar(1); o.root.visible = true;
    switch (o.type) {
      case 'ball': o.spin.quaternion.identity(); break;
      case 'book': o.root.rotation.y = o.face === 'z' ? Math.PI / 2 : 0; o.tilt.quaternion.identity(); o.tilt.position.set(0, 0, 0); o.body.position.set(0, 0, 0); break;
      case 'defl': o.root.rotation.y = 0; o.board.rotation.set(0, o.home.o ? -Math.PI / 4 : Math.PI / 4, 0); o.board.scale.setScalar(1); break;
      case 'fan': o.root.rotation.y = YAW(o.home.o); o.on = false; o.head.rotation.set(0, 0, 0); break;
      case 'clock': o.root.rotation.y = Math.PI / 4; o.body.rotation.set(0, 0, 0); o.body.position.set(0, 0, 0); o.ringing = false; break;
      case 'cat': o.root.rotation.y = Math.PI / 4 + .5; o.char.setFace('normal'); o.char.pose = 'idle'; o.char.body.position.y = 0; o.root.position.y = 0; break;
    }
  }
  removePiece(o) { const W = this.L.world; W.root.remove(o.root); disposeTree(o.root); delete this.objs[o.id]; W.idsDirty = true; }
  placedSpecs() {
    return this.slots.filter(s => s.out && this.objs['p' + s.k]).map(s => { const o = this.objs['p' + s.k]; return { type: s.type, i: o.home.i, j: o.home.j, o: o.home.o, id: o.id, slot: s.k }; });
  }
  pieceAt(i, j) { return Object.values(this.objs).find(o => o.home.i === i && o.home.j === j && o !== this.drag?.o) || null; }
  isFree(i, j, ignore = null) {
    if (!this.free.has(i + ',' + j)) return false;
    return !Object.values(this.objs).some(o => o.slot != null && o !== ignore && o.home.i === i && o.home.j === j && !(this.drag?.o === o && this.drag.fromTray));
  }
  tileAt(x, y) {
    const p = this.L.world.screenToGround(x, y, 0); if (!p) return null;
    const i = Math.floor(p.x + this.LV.w / 2), j = Math.floor(p.z + this.LV.d / 2);
    return i >= 0 && j >= 0 && i < this.LV.w && j < this.LV.d ? [i, j] : null;
  }
  pickPiece(x, y) {
    const roots = Object.values(this.objs).map(o => o.root);
    for (const h of this.L.world.pick(x, y, roots)) { const o = h.object.userData.piece; if (o && this.objs[o.id] === o) return o; }
    return null;
  }

  // ── HUD
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, LV = this.LV, col = ui.col();
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title wk-title ol' }, '아침 깨우기', h('small', {}, `${this.lvIdx + 1}/${S.LEVELS.length} · ${LV.name}`)));
    this.cookieEl = h('div', { class: 'wk-cookie' }, h('img', { src: L.thumbs.item_cookie }));
    if (LV.cookie) top.append(this.cookieEl);
    col.append(top);
    this.comboEl = h('div', { class: 'wk-combo ol3' }, '연쇄', this.comboN = h('b', {}, '0'));
    col.append(this.comboEl);
    this.hintEl = h('div', { class: 'wk-hint ol' }); col.append(this.hintEl);
    const tray = this.trayEl = h('div', { class: 'wk-tray' + (LV.tray.length >= 4 ? ' n4' : '') });
    this.slots = LV.tray.map((type, k) => {
      const el = h('div', { class: 'wk-slot', role: 'button', 'aria-label': S.PIECE_NAME[type] }, h('img', { src: this.icons[type] }));
      if (LV.isNew?.includes(type) && LV.tray.indexOf(type) === k) el.append(h('div', { class: 'new' }, 'NEW'));
      const s = { k, type, el, out: false };
      this.bindSlot(s);
      tray.append(el);
      return s;
    });
    this.goBtn = ui.btn('시작!', { color: 'green', cls: 'big wk-go', onClick: () => this.start() });
    // the find tray (first time only): silhouettes of what to look for
    this.findTray = h('div', { class: 'wk-tray wk-find wk-gone' });
    for (const it of this.hidden || []) { it.slotEl = h('div', { class: 'wk-slot wk-sil' }, h('img', { src: this.icons[it.icon] }), h('div', { class: 'wk-chk', html: ICON.check }), h('span', { class: 'wk-lbl' }, it.name)); this.findTray.append(it.slotEl); }
    col.append(h('div', { class: 'wk-bar' }, this.findTray, tray, this.goBtn));
    this.setTrays();
    this.flashEl = h('div', { class: 'wk-flash' }); document.getElementById('app').append(this.flashEl);
  }
  setTrays() {
    const finding = this.phase === 'story' || this.phase === 'find';
    this.findTray?.classList.toggle('wk-gone', !finding || !this.hidden);
    this.trayEl?.classList.toggle('wk-gone', finding);
    this.goBtn?.classList.toggle('wk-gone', finding);
  }
  announceNew() {
    const L = this.L, W = L.world, LV = this.LV;
    const s = this.slots.find(x => LV.isNew?.includes(x.type)); if (!s) return;
    s.el.classList.remove('got'); void s.el.offsetWidth; s.el.classList.add('got');
    const r = s.el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top;
    W.fx.burst(x, y + r.height / 2, { n: 18, speed: 240, up: 120 });
    L.audio.sfx('special');
    const tag = L.h('div', { class: 'wk-newtag ol', style: `left:${clamp(x, 80, innerWidth - 80)}px;top:${y - 6}px` }, `새 조각! ${S.PIECE_NAME[s.type]}`);
    document.getElementById('app').append(tag); setTimeout(() => tag.remove(), 1900);
  }
  // a speech bubble over a character, kept on screen (the bed stands in the far right corner)
  say(ch, text, ms = 1200, cls = '') {
    const L = this.L, b = L.h('div', { class: 'bubble pop ' + cls }, text); L.ui.wui.append(b);
    const upd = () => { const p = L.world.toScreen(V.copy(ch.root.position).setY(ch.root.position.y + ch.headTop() + .22)), hw = b.offsetWidth / 2 + 6;
      b.style.left = clamp(p.x, hw, innerWidth - hw) + 'px'; b.style.top = Math.max(40, p.y) + 'px'; };
    upd(); const iv = setInterval(upd, 30); setTimeout(() => { clearInterval(iv); b.remove(); }, ms);
    return b;
  }
  setHint(t) { if (this.hintEl.textContent !== t) this.hintEl.textContent = t; }
  // everything that depends on the edit state: slot looks, glow tiles, the path, the hint, the button
  refresh() {
    const edit = this.phase === 'edit';
    this.setTrays();
    for (const s of this.slots) { s.el.classList.toggle('sel', this.sel === s.k); s.el.classList.toggle('out', s.out); }
    this.trayEl?.classList.toggle('off', !edit);
    const anyOut = this.slots.some(s => s.out);
    this.goBtn?.classList.toggle('wait', !edit);
    this.goBtn?.classList.toggle('pulse', edit && anyOut && this.lvIdx === 0 && !this.tries);
    const showGlow = !!(edit && (this.sel != null || this.drag));
    for (const key in this.glowT) { const [i, j] = key.split(',').map(Number); this.glowT[key].visible = showGlow && !!this.isFree(i, j, this.drag?.o); }
    if (this.grid) { this.grid.visible = this.phase !== 'story' && this.phase !== 'find'; this.grid.material.opacity = edit || this.phase === 'intro' ? .9 : .25; }
    this.drawPath();
    // first morning: one short line that follows what to do next
    if (this.lvIdx === 0 && this.hintEl && this.phase !== 'story' && this.phase !== 'find') {
      const first = !this.wins;
      let t = '';
      if (first && edit) {
        if (this.drag) t = '빛나는 칸에 놓기';
        else if (this.sel != null) t = '빛나는 칸을 콕!';
        else if (!anyOut) t = this.tries ? '점선을 보고 다시 놓아 봐' : '아래 조각을 콕 골라 봐';
        else t = this.tries ? '판을 콕 하면 방향이 바뀌어 · 시작!' : '점선이 공 길이야 · 준비되면 시작!';
      }
      this.setHint(t);
      for (const s of this.slots) s.el.classList.toggle('wk-nudge', first && edit && !anyOut && this.sel == null && !this.drag);
    }
  }
  setCombo(n, pop = true) {
    this.comboN.textContent = n;
    if (pop) { this.comboEl.classList.remove('pop'); void this.comboEl.offsetWidth; this.comboEl.classList.add('pop'); }
  }
  addCombo(pos) {
    this.combo++; this.setCombo(this.combo);
    if (pos) { const s = this.L.world.toScreen(V.copy(pos).setY(pos.y + .4)); this.L.world.fx.burst(s.x, s.y, { n: 8, speed: 170, size: 8, life: .5 }); }
  }

  // ── input
  bindInput() {
    const W = this.L.world;
    W.camLock = true;
    W.onTap = (x, y) => this.onTap(x, y);
    W.onDragStart = (x, y) => this.onDragStart(x, y);
  }
  bindSlot(s) {
    s.el.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault();
      if (this.phase !== 'edit') return;
      const x0 = e.clientX, y0 = e.clientY, id = e.pointerId; let dragging = false;
      const mv = ev => {
        if (ev.pointerId !== id) return;
        if (!dragging && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 10 && !s.out) { dragging = true; this.beginDrag(s); }
        if (dragging) this.dragTo(ev.clientX, ev.clientY);
      };
      const up = ev => {
        if (ev.pointerId !== id) return;
        removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', cn);
        if (dragging) this.endDrag(ev.clientX, ev.clientY); else this.selectSlot(s.k);
      };
      const cn = ev => { if (ev.pointerId !== id) return; removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', cn); if (dragging) this.cancelDrag(); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', cn);
    });
  }
  onTap(x, y) {
    if (this.phase === 'story') { this._beatRes?.(); return; }
    if (this.phase === 'find') { this.tapFind(x, y); return; }
    if (this.phase !== 'edit') return;
    const t = this.tileAt(x, y);
    if (this.sel != null && t && this.isFree(t[0], t[1])) { this.tapTile(t[0], t[1]); return; }
    const o = this.pickPiece(x, y) || (t && this.pieceAt(t[0], t[1]));
    if (o) { this.tapPiece(o.id); return; }
    if (this.sel != null) { this.L.audio.sfx('miss'); return; }
    const W = this.L.world;
    if (W.pick(x, y, [this.zz.root]).length) { this.zz.bump(.25); this.L.audio.sfx('hmm'); this.say(this.zz, this.LV.ear ? '♪ 쿨… (안 들려)' : '쿨…쿨… 5분만…', 1200, 'think'); return; }
    if (W.pick(x, y, [this.mong.root]).length) { this.mong.bump(.3); this.L.audio.sfx('giggle'); this.say(this.mong, '내가 공 찰게!', 1000); }
  }
  // the moves the player (and the bots) make
  selectSlot(k) {
    if (this.phase !== 'edit') return;
    const s = this.slots[k];
    if (s.out) { this.recall(k); return; }
    this.sel = this.sel === k ? null : k; this.L.audio.sfx('tap');
    s.el.querySelector('.new')?.remove();
    this.refresh();
  }
  tapTile(i, j) {
    if (this.phase !== 'edit' || this.sel == null || !this.isFree(i, j)) return false;
    const k = this.sel; this.sel = null; this.placePiece(k, i, j, 0);
    return true;
  }
  tapPiece(id) {
    const o = this.objs[id]; if (!o || this.phase !== 'edit') return;
    const L = this.L;
    if (o.fixed) {   // part of the room: a little wobble says "this one stays"
      L.audio.sfx('locked'); const r0 = o.root.rotation.y;
      this.tw.run(.3, k => { o.root.rotation.y = r0 + Math.sin(k * Math.PI * 3) * .12 * (1 - k); }, ease.linear);
      return;
    }
    const n = S.ORIENTS[o.type] || 1;
    if (n <= 1) { L.audio.sfx('tap'); this.pop(o.root, .3); return; }
    o.home.o = (o.home.o + 1) % n;
    L.audio.sfx('click'); this.snd.boing();
    if (o.type === 'defl') { const y0 = o.board.rotation.y, y1 = o.home.o ? -Math.PI / 4 : Math.PI / 4; this.tw.run(.22, k => { o.board.rotation.y = y0 + (y1 - y0) * k; }, ease.outBack); }
    if (o.type === 'fan') { const y0 = o.root.rotation.y; let y1 = YAW(o.home.o); while (y1 - y0 > Math.PI) y1 -= Math.PI * 2; while (y1 - y0 < -Math.PI) y1 += Math.PI * 2; this.tw.run(.22, k => { o.root.rotation.y = y0 + (y1 - y0) * k; }, ease.outBack); }
    this.pop(o.root, .18);
    this.clearMarks(true);
    this.refresh();
  }
  placePiece(k, i, j, or = 0) {
    const s = this.slots[k], L = this.L, W = L.world;
    let o = this.objs['p' + k];
    if (!o) o = this.addPiece({ id: 'p' + k, type: s.type, i, j, o: or, slot: k });
    else { this.tw.kill(o); o.home.i = i; o.home.j = j; this.resetPiece(o); }
    s.out = true;
    o.root.scale.setScalar(.01);
    this.tw.run(.32, kk => o.root.scale.setScalar(Math.max(.01, kk)), ease.outBack);
    L.audio.sfx('place');
    const sp = W.toScreen(V.copy(o.root.position).setY(.2)); W.fx.burst(sp.x, sp.y, { n: 10, speed: 160, size: 7, colors: ['#ffffff', '#ffe9c9', '#ffd36e'], life: .45 });
    this.clearMarks(true);
    this.refresh();
  }
  recall(k) {
    const s = this.slots[k], o = this.objs['p' + k]; if (!o) { s.out = false; this.refresh(); return; }
    this.L.audio.sfx('swish');
    s.out = false; if (this.sel === k) this.sel = null;
    const p0 = o.root.position.clone();
    o.home.i = -99; o.home.j = -99;
    this.tw.run(.22, kk => { o.root.position.set(p0.x, p0.y + kk * .6, p0.z); o.root.scale.setScalar(Math.max(.01, 1 - kk)); }, ease.inCubic, 0, o).then(() => { if (!this.slots[k].out && this.objs['p' + k] === o) this.removePiece(o); });
    s.el.classList.remove('got'); void s.el.offsetWidth; s.el.classList.add('got');
    this.clearMarks(true);
    this.refresh();
  }
  // dragging: from the tray (a new piece) or a placed piece to another tile / back to the tray
  onDragStart(x, y) {
    if (this.phase !== 'edit') return null;
    const t = this.tileAt(x, y), o = this.pickPiece(x, y) || (t && this.pieceAt(t[0], t[1]));
    if (!o || o.fixed) return null;
    return { move: (mx, my) => { if (!this.drag) this.beginDrag(null, o); this.dragTo(mx, my); }, end: (mx, my) => this.endDrag(mx, my), cancel: () => { if (this.drag) this.cancelDrag(); } };
  }
  beginDrag(slot, obj = null) {
    if (this.phase !== 'edit') return;
    let o = obj, fromTray = false;
    if (!o) { o = this.objs['p' + slot.k]; if (o) this.tw.kill(o); else o = this.addPiece({ id: 'p' + slot.k, type: slot.type, i: -99, j: -99, o: 0, slot: slot.k }); fromTray = true; }
    this.sel = null;
    this.slots[o.slot].el.querySelector('.new')?.remove();
    this.drag = { o, fromTray, k: o.slot, home: { ...o.home }, tile: null };
    this.L.audio.sfx('lift');
    this.clearMarks(true);
    this.refresh();
  }
  dragTo(x, y) {
    const d = this.drag; if (!d) return;
    const t = this.tileAt(x, y - 34), o = d.o;
    const ok = t && this.isFree(t[0], t[1], o);
    d.tile = ok ? t : null;
    if (ok) { const p = this.tw3(...t); o.root.position.set(p.x, .32, p.z); this.hover.visible = true; this.hover.position.copy(p).setY(.025); }
    else { const g = this.L.world.screenToGround(x, y - 34, .3); if (g) o.root.position.set(g.x, .32, g.z); this.hover.visible = false; }
    o.root.scale.setScalar(1);
  }
  endDrag(x, y) {
    const d = this.drag; if (!d) return;
    this.drag = null; this.hover.visible = false;
    const tr = this.trayEl.getBoundingClientRect(), overTray = y > tr.top - 12;
    if (d.tile && !overTray) {
      this.slots[d.k].out = true;
      this.placePiece(d.k, d.tile[0], d.tile[1], d.home.o);
    } else if (d.fromTray || overTray) {
      this.slots[d.k].out = true; this.recall(d.k);
    } else { d.o.home = d.home; this.resetPiece(d.o); this.L.audio.sfx('miss'); this.refresh(); }
  }
  cancelDrag() {
    const d = this.drag; if (!d) return; this.drag = null; this.hover.visible = false;
    if (d.fromTray) { this.slots[d.k].out = true; this.recall(d.k); }
    else { d.o.home = d.home; this.resetPiece(d.o); this.refresh(); }
  }
  pop(obj, amt = .25) { this.tw.run(.3, k => { const s = 1 + amt * Math.sin(k * Math.PI) * (1 - k * .5); obj.scale.set(s, 1 / s, s); }, ease.linear).then(() => obj.scale.setScalar(1)); }

  // ── markers that follow a world point (the "?" where a chain stopped)
  mark(pos, cls = '') {
    const el = this.L.h('div', { class: 'wk-q ' + cls }, '?'); this.L.ui.wui.append(el);
    const m = { el, pos: pos.clone() }; this.marks.push(m); this.placeMark(m); return m;
  }
  placeMark(m) { const s = this.L.world.toScreen(V.copy(m.pos)); m.el.style.left = s.x + 'px'; m.el.style.top = s.y + 'px'; }
  clearMarks(trailToo = false) { for (const m of this.marks) m.el.remove(); this.marks = []; if (trailToo && this.trailG) this.trailG.visible = false; }

  // ── the run
  async start() {
    if (this.phase !== 'edit' || this.drag) return;
    const L = this.L, W = L.world;
    this.phase = 'run'; this.tries++; this.result = null; this.sel = null;
    this.clearMarks(true);
    this.refresh();
    const r = this.lastRun = S.simulate(this.LV, this.placedSpecs());
    this.combo = 0; this.setCombo(0, false); this.comboEl.classList.add('on');
    this.cookieEl.classList.remove('got', 'bump');
    this.focus.copy(this.objs.ball0.root.position);
    { const z0 = W.zoom; this.tw.run(.6, k => { W.zoom = z0 + (1.34 - z0) * k; }); }
    this.stepN = {};
    const ev = r.events;
    const hit = r.result === 'win' ? ev.findIndex(e => (e.e === 'ring' && e.wake) || (e.e === 'catjump' && e.land === 'bed') || e.e === 'quilt' || e.e === 'sun') : -1;
    for (let k = 0; k < ev.length && !this.dead; k++) {
      // the last beats before the big hit: a little slow motion, the view leans in
      this.slow = hit >= 0 && k >= hit - 3 && k <= hit ? 1.6 : 1;
      if (this.slow > 1 && !this.leaned) { this.leaned = true; const z0 = W.zoom; this.tw.run(.5, q => { W.zoom = z0 + (1.6 - z0) * q; }); }
      await this.anim(ev[k], ev[k + 1]);
    }
    this.slow = 1; this.leaned = false;
    if (this.dead) return;
    if (r.result === 'win') await this.winSeq(r); else await this.failSeq(r);
  }
  async anim(e, next) {
    const L = this.L, W = L.world, o = this.objs[e.id], tw = this.tw;
    switch (e.e) {
      case 'kick': {
        const m = this.mong, p0 = m.root.position.clone(), dv = DV(e.dir);
        m.pose = 'push'; m.setFace('happy'); this.say(m, '간다~!', 800);
        await tw.run(.22, k => { m.squash = .3 * k; });
        L.audio.sfx('swish');
        await tw.run(.14, k => { m.root.position.copy(p0).addScaledVector(dv, .28 * Math.sin(k * Math.PI)); m.squash = -.15; }, ease.linear);
        m.pose = 'idle'; this.pop(o.root, .25); this.snd.knock();
        break;
      }
      case 'step': {
        const a = this.tw3(...e.from), b = this.tw3(...e.to), n = this.stepN[e.id] = (this.stepN[e.id] || 0) + 1;
        const dur = (n === 1 ? .24 : n === 2 ? .19 : .16) * (this.slow || 1);
        const axis = new THREE.Vector3(S.DIRS[e.dir][1], 0, -S.DIRS[e.dir][0]); let last = 0;
        this.snd.roll(Math.min(n, 10));
        await tw.run(dur, k => { o.root.position.lerpVectors(a, b, k); o.spin.quaternion.premultiply(Q.setFromAxisAngle(axis, (k - last) / BALL_R)); last = k; this.focus.copy(o.root.position); }, ease.linear);
        break;
      }
      case 'bounce': {
        const d = this.objs[e.id], b = e.ball && this.objs[e.ball];
        this.snd.boing(); this.addCombo(d.root.position);
        const s0 = d.board.scale.clone();
        tw.run(.35, k => { const s = Math.sin(k * Math.PI * 2.5) * (1 - k) * .22; d.board.scale.set(s0.x + s, s0.y - s, s0.z + s); }, ease.linear);
        if (b) this.pop(b.root, .3);
        const sp = W.toScreen(V.copy(d.root.position).setY(.3)); W.fx.ring(sp.x, sp.y, { r: 46, color: '#ffffff', width: 5, life: .35 });
        this.freeze = .05;
        break;
      }
      case 'cookie': this.flyCookie(); this.addCombo(this.cookie.root.position); break;
      case 'hit': {
        const p0 = o.root.position.clone(), dv = DV(e.dir), t = this.objs[e.target];
        L.audio.sfx('pop', 4); this.snd.knock();
        await tw.run(.1, k => { o.root.position.copy(p0).addScaledVector(dv, .16 * Math.sin(k * Math.PI)); }, ease.linear);
        if (t && t.type !== 'cat') this.pop(t.root, .22);
        break;
      }
      case 'nudge': { this.addCombo(o.root.position); this.pop(o.root, .3); this.stepN[e.id] = 1; this.focus.copy(o.root.position); break; }
      case 'fall': {
        this.addCombo(o.root.position); this.focus.copy(o.root.position);
        const want = e.dir % 2 ? 0 : Math.PI / 2;
        if (Math.abs(o.root.rotation.y - want) > .01) { const y0 = o.root.rotation.y; await tw.run(.07, k => { o.root.rotation.y = y0 + (want - y0) * k; }); }
        const ld = DV(e.dir).applyAxisAngle(UP, -o.root.rotation.y);
        o.tilt.position.copy(ld).multiplyScalar(o.T / 2); o.body.position.copy(ld).multiplyScalar(-o.T / 2);
        const axis = new THREE.Vector3().crossVectors(UP, ld).normalize();
        const lean = next?.e === 'fall' ? 1.25 : next && ['nudge', 'ring', 'fanon', 'catjump', 'lever', 'thud', 'bedtap'].includes(next.e) ? 1.36 : 1.52;
        await tw.run(.24 * (this.slow || 1), k => { o.tilt.quaternion.setFromAxisAngle(axis, lean * k); }, ease.inCubic);
        this.snd.clack(); this.shake = .12;
        tw.run(.2, k => { o.tilt.quaternion.setFromAxisAngle(axis, lean - Math.sin(k * Math.PI) * .12); }, ease.linear);
        break;
      }
      case 'ring': {
        o.ringing = true; this.addCombo(o.root.position); this.focus.copy(o.root.position);
        this.snd.ring(e.wake ? 1.4 : 1.0);
        const sp = W.toScreen(V.copy(o.root.position).setY(.9)); L.ui.floatText(sp.x, sp.y - 20, '따르릉!', 'gold big');
        this.freeze = .1; this.shake = .3;
        const t0 = this.t;
        if (e.wake) { await tw.wait(.45); break; }
        await tw.wait(.9);
        o.ringing = false;
        if (e.near) { this.zz.bump(.2); this.say(this.zz, '♪… 쿨쿨 (헤드폰)', 1700, 'think'); }
        else this.say(this.zz, '음냐… 멀어서 안 들려…', 1700, 'think');
        void t0;
        break;
      }
      case 'fanon': {
        o.on = true; this.addCombo(o.root.position); this.focus.copy(o.root.position);
        this.snd.whirr(); this.pop(o.root, .2);
        await tw.run(.3, k => { o.head.rotation.z = Math.sin(k * Math.PI * 4) * .12 * (1 - k); });
        this.snd.gust();
        break;
      }
      case 'gust': {
        const a = this.tw3(...e.from), b = this.tw3(...e.to);
        for (let q = 0; q < 2; q++) this.streak(a, b, e.dir, q);
        await tw.run(.075 * (this.slow || 1), k => { this.focus.lerpVectors(a, b, k); }, ease.linear);
        break;
      }
      case 'gustend': {
        if (e.into !== 'bed') { const sp = W.toScreen(V.copy(this.tw3(...e.at)).addScaledVector(DV(e.dir), .5).setY(.5)); W.fx.burst(sp.x, sp.y, { n: 10, colors: ['#ffffff', '#cdeefc'], shape: 'dot', speed: 150, size: 8, life: .4 }); }
        L.audio.sfx('swish');
        break;
      }
      case 'quilt': await this.flyQuilt(); break;
      case 'catjump': await this.catJump(o, e); break;
      case 'bump': {
        const p0 = o.root.position.clone(), dv = DV(e.dir);
        this.snd.knock();
        await tw.run(.16, k => { o.root.position.copy(p0).addScaledVector(dv, .2 * Math.sin(k * Math.PI)); }, ease.linear);
        if (e.into === 'bed') { this.zz.bump(.15); this.say(this.zz, '음냐… 5분만…', 1700, 'think'); }
        else if (e.into === 'mong') { this.mong.setFace('dizzy'); this.say(this.mong, '아야!', 1000); }
        break;
      }
      case 'bedtap': this.zz.bump(.15); this.say(this.zz, '음냐… 5분만…', 1700, 'think'); this.snd.knock(); break;
      case 'thud': { const t = this.objs[e.id]; this.snd.knock(); if (t) this.pop(t.root, .15); break; }
      case 'lever': this.addCombo(); L.audio.sfx('unlock'); await tw.wait(.3); break;
      case 'sun': L.audio.sfx('special'); await tw.wait(.4); break;
      default: break;
    }
  }
  // a few white wind lines flying along a tile
  streak(a, b, dir, q) {
    const W = this.L.world;
    if (!this.streakMat) { this.streakMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .85, depthWrite: false }); this.streakGeo = new THREE.BoxGeometry(.5, .035, .035); }
    const m = new THREE.Mesh(this.streakGeo, this.streakMat.clone()); m.rotation.y = YAW(dir) + Math.PI / 2; m.renderOrder = 4;
    const off = new THREE.Vector3(S.DIRS[dir][1], 0, -S.DIRS[dir][0]).multiplyScalar((q - .5) * .34), y = .45 + q * .18;
    W.root.add(m);
    this.tw.run(.3, k => { m.position.lerpVectors(a, b, k * 1.4 - .2).add(off).setY(y + Math.sin(k * 9 + q) * .04); m.material.opacity = .9 * Math.sin(k * Math.PI); m.scale.x = .6 + k; }, ease.linear)
      .then(() => { W.root.remove(m); m.material.dispose(); });
  }
  flyCookie() {
    const ck = this.cookie, L = this.L, W = L.world, m = this.mong; if (!ck) return;
    const from = new THREE.Vector3(); ck.item.getWorldPosition(from);
    W.root.attach(ck.item);
    L.audio.sfx('pop', 8);
    this.tw.run(.7, k => {
      const to = V.copy(m.root.position).setY(m.headTop() * .55);
      ck.item.position.lerpVectors(from, to, k).setY(from.y + (to.y - from.y) * k + 1.6 * 4 * k * (1 - k)); ck.item.rotation.y += .35; ck.item.rotation.x += .2;
    }, ease.linear).then(() => {
      if (this.dead) return;
      ck.item.visible = false; m.setFace('happy'); m.bump(.45); this.say(m, '냠!', 800); this.snd.nom(); L.audio.sfx('coin');
      this.cookieEl.classList.remove('bump'); void this.cookieEl.offsetWidth; this.cookieEl.classList.add('got', 'bump');
      const sp = W.toScreen(V.copy(m.root.position).setY(m.headTop())); W.fx.burst(sp.x, sp.y, { n: 12, shape: 'heart', colors: ['#ff8fb8', '#ffd23f'], speed: 180, life: .7 });
    });
  }
  async flyQuilt() {
    const q = this.quilt, pv = q?.pivots[0], L = this.L; if (!pv) return;
    this.addCombo(this.zz.root.position); L.audio.sfx('whoosh');
    const p0 = pv.position.clone(), r0 = pv.rotation.clone();
    // the quilt balloons up and sails off toward the camera, out of the room
    this.tw.run(1.1, k => { pv.position.set(p0.x + .6 * k, p0.y + 3.2 * k - 1.2 * k * k, p0.z + 3.4 * k); pv.rotation.set(r0.x - 1.6 * k, r0.y + 1.2 * k, r0.z + Math.sin(k * 9) * .35); pv.scale.set(1 + .25 * Math.sin(k * 7), 1, 1); }, ease.outCubic)
      .then(() => { if (this.phase === 'won') pv.visible = false; });
    this.zz.setFace('sweat'); this.say(this.zz, '으으 추워!', 900);
    await this.tw.wait(.35);
  }
  async catJump(c, e) {
    const L = this.L, ch = c.char, tw = this.tw;
    this.addCombo(c.root.position); this.focus.copy(c.root.position);
    ch.setFace('wow'); this.say(ch, '냐앙!', 900); this.snd.meow();
    ch.root.rotation.y = YAW(e.dir);
    await tw.run(.12, k => { ch.squash = .35 * k; });
    const a = c.root.position.clone();
    if (!e.to) { this.say(ch, '냥?! (막혔다)', 1200); await tw.run(.35, k => { ch.body.position.y = .5 * 4 * k * (1 - k); }, ease.linear); ch.body.position.y = 0; ch.setFace('sus'); return; }
    const bed = e.land === 'bed', b = bed ? this.zz.root.position.clone().setY(this.zz.root.position.y + this.zz.headTop() * .7) : this.tw3(...e.to);
    await tw.run(.55, k => { c.root.position.lerpVectors(a, b, k); ch.body.position.y = 1.4 * 4 * k * (1 - k); ch.squash = -.15; this.focus.copy(c.root.position); }, ease.linear);
    ch.body.position.y = 0; ch.squash = .35;
    if (bed) { this.zz.bump(.5); this.snd.knock(); this.freeze = .12; this.shake = .3; ch.setFace('happy'); }
    else { ch.setFace('normal'); this.say(ch, '냥… (여기서 잘래)', 1500, 'think'); }
  }

  // ── the end of a run
  async winSeq(r) {
    const L = this.L, W = L.world, zz = this.zz, ui = L.ui, tw = this.tw;
    this.phase = 'won'; this.result = 'win'; this.wins++;
    const n = this.placedSpecs().length, stars = this.stars = S.starsOf(this.LV, r, n);
    this.freeze = .16; this.shake = .4;
    this.flashEl.classList.remove('on'); void this.flashEl.offsetWidth; this.flashEl.classList.add('on');
    this.snd.wake(); L.audio.sfx('gasp');
    W.flyTo(tw, { target: zz.root.position.clone().setY(.9), zoom: 1.85, dur: .45 });
    this.focus.copy(zz.root.position);
    zz.setFace('wow'); zz.pose = 'flail';
    if (zz.phones) { const ph = zz.phones, p0 = ph.position.clone(); tw.run(.8, k => { ph.position.set(p0.x + .9 * k, p0.y + 1.4 * Math.sin(k * Math.PI * .7), p0.z + .4 * k); ph.rotation.z = k * 5; }, ease.outCubic); }
    const y0 = zz.root.position.y;
    const sp = W.toScreen(V.copy(zz.root.position).setY(1.2));
    W.fx.burst(sp.x, sp.y, { n: 26, speed: 330, size: 11, up: 140 });
    this.rider = r.how === 'cat' ? Object.values(this.objs).find(o => o.type === 'cat') : null;
    if (this.rider) this.riderDy = this.rider.root.position.y - y0;
    await tw.run(.7, k => { zz.root.position.y = y0 + 1.35 * 4 * k * (1 - k); zz.root.rotation.y = .25 + k * Math.PI * 2; zz.squash = k < .5 ? -.2 : -.2 + (k - .5) * .5; }, ease.linear);
    zz.root.position.y = y0; zz.squash = .4;
    this.snd.knock();
    this.say(zz, '으악! 지각이다!', 2600, 'red');
    const cs = W.toScreen(V.copy(zz.root.position).setY(1.6));
    ui.floatText(cs.x, cs.y - 40, '기상!', 'gold big');
    W.fx.confetti(130); L.audio.sfx('win');
    this.mong.setFace('happy'); this.mong.pose = 'cheer';
    for (const o of Object.values(this.objs)) if (o.char) { o.char.setFace('happy'); o.char.pose = 'cheer'; }
    this.panic = true;
    L.log({ result: 'win', lv: this.lvIdx + 1, stars, tries: this.tries, how: r.how, placed: n, cookie: r.cookie, line: { clock: '따르릉 한 방에 벌떡!', cat: '추로 점프 대성공!', wind: '이불이 날아갔다!', sun: '햇살 공격 성공!' }[r.how] || '기상 성공!' });
    await tw.wait(1.5);
    if (this.dead) return;
    if (L.campaign) return L.go({});   // the campaign: the reward card is the result screen — 10/19, 결과창 한 번만
    this.showResult(stars, r, n);
  }
  showResult(stars, r, n) {
    for (const o of Object.values(this.objs)) if (o.ringing) { o.ringing = false; o.body.rotation.set(0, 0, 0); o.body.position.set(0, 0, 0); }
    const L = this.L, h = L.h, LV = this.LV, last = this.lvIdx >= S.LEVELS.length - 1;
    const list = [['깨웠다', true], ['쿠키 냠', !!r.cookie], [`조각 ${LV.par}개로`, n <= LV.par]];
    const row = h('div', { class: 'wk-stars' }, ...list.map(([t, on]) => h('div', { class: 'wk-star' + (on ? '' : ' off') }, h('div', { class: 'ico', html: on ? ICON.star : ICON.starGray }), h('span', {}, t))));
    const quip = { clock: '따르릉 한 방에 벌떡!', cat: '추로 점프 대성공!', wind: '이불이 날아갔다!', sun: '햇살 공격 성공!' }[r.how] || '기상 성공!';
    const more = !r.cookie && LV.cookie ? '다음엔 쿠키도 거쳐 가게 해 볼까?' : n > LV.par ? `조각 ${LV.par}개로도 돼!` : '완벽한 아침!';
    L.ui.panel({ title: '기상 성공!', color: 'green', body: [h('div', { class: 'wk-endface' }, h('img', { src: L.thumbs.face_sleepy_wow })), row, h('div', { class: 'txt' }, quip + ' ' + more)],
      buttons: [this.againBtn = L.ui.btn('고쳐 보기', { color: 'gray', cls: 'sm', onClick: () => this.backToEdit() }),
        this.nextBtn = L.ui.btn(last ? '처음 아침부터' : '다음 아침', { color: 'green', cls: 'big', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) })] });
    [...row.children].forEach((el, k) => setTimeout(() => { if (this.dead || !el.isConnected) return; el.classList.add('show'); if (list[k][1]) L.audio.sfx('star', k); }, 200 + k * 260));
  }
  async failSeq(r) {
    const L = this.L, W = L.world, tw = this.tw;
    this.result = 'fail'; this.phase = 'fail';
    L.log({ result: 'fail', lv: this.lvIdx + 1, reason: r.reason, tries: this.tries, placed: this.placedSpecs().length });
    L.audio.sfx('miss');
    const at = r.stop ? this.tw3(...r.stop).setY(r.reason === 'bed' ? 1.25 : .95) : this.objs.ball0.root.position.clone().setY(.9);
    this.mark(at);
    await tw.wait(.25);
    L.audio.sfx('hmm');
    if (['wall', 'block', 'empty', 'defl', 'fallen', 'wind', 'loop', 'catstuck'].includes(r.reason)) this.say(this.zz, this.LV.ear ? '♪ 쿨쿨…' : '쿨쿨…', 1300, 'think');
    this.mong.setFace('sweat');
    await tw.wait(1.15);
    if (this.dead) return;
    this.comboEl.classList.remove('on');
    W.flyTo(tw, { target: W.home.clone(), zoom: 1.06, dur: .5 });
    await this.resetRun();
    this.drawTrail(r);
    for (const m of this.marks) m.el.classList.add('old');
    this.plan = null; this.rplan = null;
    this.phase = 'edit';
    this.refresh();
  }
  // everything back where it stood (the placed pieces stay placed)
  async resetRun() {
    const tw = this.tw;
    const moved = Object.values(this.objs).filter(o => o.type !== 'defl');
    await tw.run(.14, k => { for (const o of moved) o.root.scale.setScalar(Math.max(.01, 1 - k)); }, ease.inCubic);
    for (const o of Object.values(this.objs)) this.resetPiece(o);
    for (const o of moved) o.root.scale.setScalar(.01);
    const m = this.mong; m.root.position.copy(this.mongHome); m.root.rotation.y = YAW(this.LV.mong.dir); m.setFace('normal'); m.pose = 'idle';
    const zz = this.zz; zz.root.position.copy(this.zzHome); zz.root.rotation.y = .25; zz.setFace('normal'); zz.pose = 'idle'; this.panic = false; this.rider = null;
    if (zz.phones) { zz.phones.position.set(0, 0, 0); zz.phones.rotation.set(0, 0, 0); }
    const pv = this.quilt?.pivots[0]; if (pv?.userData.base) { const b = pv.userData.base; pv.position.copy(b.p); pv.rotation.copy(b.r); pv.scale.copy(b.s); pv.visible = true; }
    if (this.cookie) { const ck = this.cookie; ck.root.add(ck.item); ck.item.position.copy(ck.home); ck.item.rotation.set(0, 0, 0); ck.item.visible = true; }
    this.cookieEl.classList.remove('got', 'bump');
    this.L.audio.sfx('pop', 2);
    await tw.run(.26, k => { for (const o of moved) o.root.scale.setScalar(Math.max(.01, k)); }, ease.outBack);
    for (const o of moved) o.root.scale.setScalar(1);
  }
  async backToEdit() {
    if (this.phase !== 'won') return;
    this.L.ui.closePanel();
    this.comboEl.classList.remove('on');
    this.L.world.flyTo(this.tw, { target: this.L.world.home.clone(), zoom: 1.06, dur: .5 });
    await this.resetRun();
    this.result = null; this.phase = 'edit'; this.plan = null;
    this.refresh();
  }

  // ── per frame
  update(dt) {
    const L = this.L, W = L.world;
    this.t += dt;
    W.target.sub(this.shOff); this.shOff.set(0, 0, 0);
    if (this.freeze > 0) this.freeze -= dt; else this.tw.update(dt);
    this.map.update(dt);
    this.mong.update(dt); this.zz.update(dt);
    for (const id in this.objs) {
      const o = this.objs[id];
      if (o.char) o.char.update(dt);
      if (o.type === 'fan' && o.on) o.blades.rotation.z -= dt * 26;
      if (o.type === 'clock' && o.ringing) { o.body.rotation.z = Math.sin(this.t * 70) * .2; o.body.position.y = Math.abs(Math.sin(this.t * 35)) * .06;
        if ((this._ringT = (this._ringT || 0) - dt) <= 0) { this._ringT = .16; const s = W.toScreen(V.copy(o.root.position).setY(.55)); W.fx.ring(s.x, s.y, { r: 70, color: '#ffd23f', width: 6, life: .45 }); } }
    }
    if (this.cookie?.item.parent === this.cookie.root) { const it = this.cookie.item; it.position.y = this.cookie.home.y + .05 + Math.abs(Math.sin(this.t * 2.6)) * .07; it.rotation.y += dt * .8; }
    this.glowMat.opacity = .78 + Math.sin(this.t * 6) * .18;
    // the view follows the action while the chain runs
    if (this.phase === 'run') {
      const m = this.mong.root, a = Math.atan2(this.focus.x - m.position.x, this.focus.z - m.position.z), d = Math.atan2(Math.sin(a - m.rotation.y), Math.cos(a - m.rotation.y));
      if (Math.hypot(this.focus.x - m.position.x, this.focus.z - m.position.z) > .6) m.rotation.y += d * (1 - Math.exp(-dt * 6));
      const want = V.copy(W.home).lerp(this.focus, this.leaned ? .85 : .6).setY(.45);
      W.target.lerp(want, 1 - Math.exp(-dt * 4.5));
    }
    if (this.shake > 0) { this.shake -= dt; const a = Math.min(.09, this.shake * .3); this.shOff.set((Math.random() - .5) * a, (Math.random() - .5) * a, (Math.random() - .5) * a); W.target.add(this.shOff); }
    // 졸졸이 panics after waking
    if (this.panic) { this.zz.root.position.y = this.zzHome.y + Math.abs(Math.sin(this.t * 9)) * .16; }
    if (this.rider && (this.panic || this.phase === 'won')) this.rider.root.position.y = this.zz.root.position.y + this.riderDy;
    // a snore now and then while you build
    if (this.phase === 'edit' && !this.LV.ear) { this._snore = (this._snore ?? 3) - dt; if (this._snore <= 0) { this._snore = 6 + Math.random() * 3; this.say(this.zz, '드르렁~', 1100, 'think'); } }
    if (this.phase === 'edit' && this.LV.ear) { this._snore = (this._snore ?? 3) - dt; if (this._snore <= 0) { this._snore = 6 + Math.random() * 3; this.say(this.zz, '♪ 쿨쿨~', 1100, 'think'); } }
    for (const m of this.marks) this.placeMark(m);
    // find phase: after ~5 s without a find, the next hidden thing sparkles (and keeps sparkling until it's found)
    if (this.phase === 'find') {
      this.findT += dt;
      if (!this.hintIt && this.findT > 5) this.hintIt = this.hidden.find(h => !h.found) || null;
      if (this.hintIt) {
        const it = this.hintIt; this._spT = (this._spT || 0) - dt;
        if (this._spT <= 0) { this._spT = .55; const s = W.toScreen(V.copy(it.o.root.position).setY(it.o.root.position.y + .3)); W.fx.burst(s.x, s.y, { n: 7, speed: 120, size: 9, life: .6, colors: ['#ffe16b', '#ffffff'] }); W.fx.ring(s.x, s.y, { r: 44, color: '#ffe16b', width: 5, life: .5 }); }
        it.o.root.position.y = it.pos.y + Math.abs(Math.sin(this.t * 6)) * .08;
      }
    }
  }
  exit() {
    this.dead = true; const W = this.L.world;
    const app = document.getElementById('app'); delete app.dataset.morning;
    this._findDone = null; this._beatRes = null;
    for (const o of Object.values(this.objs)) { W.root.remove(o.root); disposeTree(o.root); }
    for (const o of [this.map.group, this.mong.root, this.zz.root, this.cookie?.root, this.cookie?.item, this.grid, this.glow, this.hover, this.pathG, this.trailG].filter(Boolean)) { W.root.remove(o); disposeTree(o); }
    this.clearMarks(); this.flashEl?.remove();
    this.dotGeo?.dispose(); this.arrowGeo?.dispose(); this.streakGeo?.dispose();
    W.camLock = false;
  }

  // ── bots (QA): they play through the same moves a player has (select a slot, tap a tile, tap a piece, 시작!)
  // smart: the brute-force solver's best arrangement. random: every piece on a random free tile, random turns.
  botStep(dt, mode) {
    if (this.phase === 'won') { this._bt = (this._bt || 0) + dt; if (this._bt > 1.9 && this.L.ui.panelOpen && this.nextBtn) { this._bt = 0; this.nextBtn.press(); } return; }
    if (this.phase === 'story' || this.phase === 'find') {
      this._bt = (this._bt || 0) - dt; if (this._bt > 0) return; this._bt = mode === 'random' ? .3 : .45;
      if (this.phase === 'story') { this.onTap(innerWidth / 2, innerHeight / 2); return; }
      const W = this.L.world, next = this.hidden.find(h => !h.found);
      if (!next) return;
      // smart: taps the next hidden thing; random: taps anywhere on the floor until something sparkles, then that
      let p;
      if (mode === 'random' && this.hintIt !== next) { const t = this.tw3(Math.floor(Math.random() * this.LV.w), Math.floor(Math.random() * this.LV.d)); p = W.toScreen(t); }
      else { p = W.toScreen(V.copy(next.o.root.position).setY(next.o.root.position.y + .25)); }
      this.onTap(p.x, p.y);
      return;
    }
    if (this.phase !== 'edit' || this.drag) return;
    this._bt = (this._bt || 0) - dt; if (this._bt > 0) return; this._bt = .28;
    if (mode === 'random') { if (!this.rplan) this.rplan = S.randomPlacement(this.LV); if (this.execPlan(this.rplan)) this.goBtn.press(); return; }
    if (!this.plan) { const sol = S.solveFast(this.LV); this.plan = sol ? sol.placed : []; this.planStars = sol?.stars || 0; }
    if (this.execPlan(this.plan)) this.goBtn.press();
  }
  // one move toward an arrangement; true once everything stands as planned
  execPlan(plan) {
    for (const s of this.slots) if (s.out && !plan.some(p => p.slot === s.k)) { this.selectSlot(s.k); return false; }
    for (const p of plan) {
      const o = this.objs['p' + p.slot];
      if (!o || !this.slots[p.slot].out) { if (this.sel !== p.slot) this.selectSlot(p.slot); else this.tapTile(p.i, p.j); return false; }
      if (o.home.i !== p.i || o.home.j !== p.j) { this.selectSlot(p.slot); return false; }
      if (o.home.o !== p.o) { this.tapPiece(o.id); return false; }
    }
    return true;
  }
  state() {
    return { scene: 'wakeup', lv: this.lvIdx + 1, phase: this.phase, intro: !!this.intro, found: this.found || 0, result: this.result, placed: this.placedSpecs().length, tries: this.tries, stars: this.stars, combo: this.combo || 0,
      cookie: !!this.lastRun?.cookie && this.result === 'win' };
  }
  get api() {
    return {
      // headless numbers without any animation: random-arrangement win rate, the solver's best, a run with no pieces
      stats: (n = 3000) => S.LEVELS.map((LV, k) => {
        let w = 0; for (let t = 0; t < n; t++) if (S.simulate(LV, S.randomPlacement(LV)).result === 'win') w++;
        const t0 = performance.now(), best = S.solveFast(LV);
        return { lv: k + 1, randomWin: +(w / n * 100).toFixed(2), best: best && { stars: best.stars, pieces: best.placed.length, how: best.r.how }, solveMs: Math.round(performance.now() - t0), empty: S.simulate(LV, []).result };
      }),
      place: list => { for (const p of list) { this.placePiece(p.slot, p.i, p.j, 0); const o = this.objs['p' + p.slot]; while (o.home.o !== (p.o || 0)) this.tapPiece(o.id); } return this.placedSpecs(); },
      select: k => this.selectSlot(k),
      start: () => this.start(),
      solve: () => { const s = S.solveFast(this.LV); return s && { stars: s.stars, placed: s.placed, how: s.r.how }; },
    };
  }
}

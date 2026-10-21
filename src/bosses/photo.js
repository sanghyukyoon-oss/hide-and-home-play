// ⑤ 찰칵! 동네 사진관 — walk out with a film camera and snap the town friends' perfect moments for your album.
// The friends in the park each have their own little "moment": a readable build-up (a crouch, a swelling bubble, a
// wind-up) and then a short peak (≈0.45 s). Tap = shutter at the tapped spot: a flash, a real snapshot of the 3D view
// around the finger drops in as a polaroid, graded by timing against the peak and by whether the friend is in frame.
// Film is short (8 a outing), so "wait for it" matters. A new moment caught → "새 사진!" and it fills its album slot.
import * as THREE from 'three';
import { MapRooms } from '../map.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { ICON } from '../ui.js';
import { Tweens, clamp, lerp, ease, store } from '../util.js';
import { disposeTree, sph, tor, put } from '../gfx/kit.js';

const SQ2 = Math.SQRT1_2, HP = Math.PI / 2, TAU = Math.PI * 2;
// screen-aligned ground placement for the π/4 camera: h runs across the screen (+ right), u into it (+ toward the camera)
const P = (h, u) => ({ x: (u + h) * SQ2, z: (u - h) * SQ2 });
const CAM_YAW = Math.PI / 4;   // a character with rotation.y = CAM_YAW looks straight at the camera
const SC = 1.25;               // the friends stand a little bigger than in 숨바꼭집, so their faces read on a phone
const PHOTO = 150;             // css px: the square the shutter takes around the finger
const DAY = { ambColor: '#fff4ea', amb: 1.55, sunColor: '#fff6e8', sun: 2.4 };
const DUSK = { ambColor: '#ffd9cc', amb: 1.42, sunColor: '#ffbe8c', sun: 2.35 };
const rnd = (a, b) => a + Math.random() * (b - a);
const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const lerpA = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
const lerpXZ = (a, b, k) => ({ x: lerp(a.x, b.x, k), z: lerp(a.z, b.z, k) });
const fc = (c, f) => { if (c.face !== f) c.setFace(f); };
const zeroRx = c => { for (const k in c.rx) c.rx[k] = 0; };
const RANK = { miss: 0, meh: 1, good: 2, perfect: 3 };
const GLABEL = { perfect: '완벽!', good: '좋아!', meh: '아쉬워', miss: '텅…' };

// where everything stands (see P): a 6×6 park seen down its diagonal, so a portrait phone shows a tall strip of it
const SPOT = {
  qp: { ...P(-.85, -2.25), a: HP },          // quarter-pipe against the fence: the ramp faces +x
  dj: P(1.55, -2.1), speaker: P(2.15, -1.7),
  pond: P(1.4, .2),
  cats: P(-1.0, .5),
  shiba: P(.3, 1.35),
  bench: { ...P(-1.15, 2.45), a: Math.PI / 4 },
  ham: P(1.3, 2.1), basket: P(1.9, 1.65),
  bush: P(.1, -3.0), churro: P(.45, -2.2),
};
const META = {
  frog: { name: '개굴이 다이빙', word: '개굴~!', face: ['frog', 'happy'] },
  skate: { name: '보드킹 에어', word: '에어~!', face: ['skater', 'happy'] },
  bubble: { name: '졸졸이 코풍선', word: '뽀오옹', face: ['sleepy', 'normal'] },
  cheeks: { name: '햄찌 볼 빵빵', word: '빵빵!', face: ['hamster', 'happy'] },
  hiss: { name: '냥이들 대치', word: '하악!', face: ['cheese', 'angry'] },
  dizzy: { name: '멍뭉이 어질어질', word: '어질~', face: ['shiba', 'dizzy'] },
  drop: { name: '둠칫이 드랍', word: '드랍!', face: ['dj', 'wow'] },
  yawn: { name: '추로의 하품', word: '하아암~', face: ['churro', 'happy'], rare: true },
};
const ALBUM_ORDER = ['frog', 'skate', 'bubble', 'cheeks', 'hiss', 'dizzy', 'drop', 'yawn'];
const LEVELS = [
  { name: '첫 출사', sub: '아침 공원 · 친구들의 멋진 순간', ms: ['frog', 'skate', 'bubble'], film: 8, time: 50, stars: [1, 3, 5], gap: [1.6, 2.6], overlap: .15, busy: 2,
    light: DAY, bg: ['#eaf7ff', '#e4f3cf'], sky: '#e6f5f6', hint: true, first: 'frog' },
  { name: '점심 출사', sub: '새 친구들이 나왔어', ms: ['frog', 'skate', 'bubble', 'cheeks', 'hiss'], film: 8, time: 60, stars: [2, 4, 6], gap: [1.3, 2.3], overlap: .3, busy: 3,
    light: DAY, bg: ['#eaf7ff', '#e4f3cf'], sky: '#e6f5f6', first: 'cheeks' },
  { name: '노을 출사', sub: '어디선가 추로가 지켜보는 중…', ms: ['skate', 'cheeks', 'hiss', 'dizzy', 'drop', 'yawn'], film: 8, time: 60, stars: [2, 4, 6], gap: [1.1, 2.1], overlap: .4, busy: 3,
    light: DUSK, bg: ['#ffe6d2', '#ffcdb9'], sky: '#ffe2d0', rare: [14, 30], first: 'dizzy' },
];
const ALBUM_KEY = 'lab.photo.album.v1';

// ── a friend's moment: idle → tell (the build-up you can read) → peak (the shot) → after → cooldown
class Moment {
  constructor(G, id, T, Pk, A) {
    this.G = G; this.id = id; this.meta = META[id]; this.T = T; this.P = Pk; this.A = A;
    this.phase = 'idle'; this.t = 0; this.n = 0; this.cool = rnd(.5, 2); this.chars = []; this.last = -99; this.flags = {}; this.cd = [2.2, 4.6];
  }
  get busy() { return this.phase !== 'idle'; }
  get center() { return this.T + this.P / 2; }
  present() { return true; }
  start() {
    this.phase = 'tell'; this.t = 0; this.n++; this.flags = {};
    if (!this.keepIdle) for (const c of this.chars) c.reacting = true;
    this.begin?.(); this.anim(0, 0);
  }
  step(dt) {
    if (this.phase === 'idle') { this.cool -= dt; this.idle(dt); return; }
    this.t += dt;
    const t = this.t, ph = t < this.T ? 'tell' : t < this.T + this.P ? 'peak' : t < this.T + this.P + this.A ? 'after' : 'done';
    if (ph === 'done') { this.finish(); return; }
    if (ph !== this.phase) { this.phase = ph; if (ph === 'peak') this.onPeak?.(); }
    this.anim(t, dt);
  }
  finish() {
    this.phase = 'idle'; this.t = 0; this.cool = rnd(...this.cd);
    for (const c of this.chars) { c.reacting = false; zeroRx(c); c.root.scale.setScalar(SC); c.pose = 'idle'; fc(c, 'normal'); }
    this.reset?.(); this.idle(0);
  }
  // the timing of a shot taken now: inside the peak = perfect, just around it = good, otherwise it's just a friend
  timing() {
    if (!this.busy) return 'meh';
    const e = this.t - this.center, half = this.P / 2;
    if (Math.abs(e) <= half + .07) return 'perfect';
    if (e > -(half + .7) && e < half + .5) return 'good';
    return 'meh';
  }
  early() { return this.busy && this.t < this.center; }
  center3(c, v, y = .42) { c.root.updateMatrixWorld(true); return c.inner.localToWorld(v.set(0, y, 0)); }
  focus(v) { return this.center3(this.chars[0], v); }
  post() {}
}

// 개굴이: crouches on the back rim of the pond (deeper and deeper, trembling) → a huge leap that hangs over the water
// (peak) → splash, gone… → pops up on a lily pad → hops back
class Frog extends Moment {
  constructor(G) {
    super(G, 'frog', 1.3, .45, 1.95);
    const C = this.C = G.spot.pond;
    this.R = { x: C.x - .98, z: C.z - .98 };
    this.Wt = { x: C.x + .05, z: C.z + .12 };
    this.Lp = { x: C.x + .7, z: C.z + .45 };
    const c = this.c = G.mk('frog', this.R.x, this.R.z, yawTo(this.R, C)); this.chars = [c];
    this.H = 1.3 / (c.S * SC);
  }
  idle() { const c = this.c; c.root.visible = true; c.root.position.set(this.R.x, 0, this.R.z); c.root.rotation.y = yawTo(this.R, this.C); }
  anim(t) {
    const G = this.G, c = this.c, rx = c.rx, T = this.T, P = this.P;
    const tL = T - .26, tF = T + P, tW = tF + .26, tU = tW + .6, tP = tU + .5, tE = T + P + this.A;
    c.root.visible = true;
    if (t < tL) {
      const k = t / tL;
      c.root.position.set(this.R.x, 0, this.R.z); c.root.rotation.y = yawTo(this.R, this.Wt);
      c.squash = .06 + .42 * ease.inQuad(k) + Math.sin(t * 42) * .035 * k;
      rx.rx = -.16 * k; rx.y = 0; rx.tongue = 0; c.pose = 'idle'; fc(c, k > .3 ? 'wow' : 'normal');
      if (!this.flags.cue) { this.flags.cue = 1; c._fx(G.tw, 'excl', { x: .38, y: .95, dur: .8 }); G.sfx('hmm'); }
    } else if (t < tW) {
      const k = (t - tL) / (tW - tL), p = lerpXZ(this.R, this.Wt, ease.outQuad(Math.min(1, k * 1.15)));
      c.root.position.set(p.x, 0, p.z);
      let y;
      if (t < T) y = this.H * .86 * ease.outQuad((t - tL) / (T - tL));
      else if (t < tF) y = this.H * (.86 + .14 * Math.sin((t - T) / P * Math.PI));
      else y = this.H * .86 * (1 - ease.inQuad((t - tF) / (tW - tF)));
      rx.y = y; c.squash = t < T ? -.16 : t < tF ? -.1 : -.12; rx.rx = .22; rx.tongue = t >= T && t < tF ? 1 : 0;
      c.pose = 'cheer'; fc(c, 'happy');
      if (!this.flags.jump) { this.flags.jump = 1; G.sfx('hop', 8); G.sfx('whoosh'); }
    } else if (t < tU) {
      if (!this.flags.splash) { this.flags.splash = 1; G.splash(this.Wt.x, this.Wt.z); }
      c.root.visible = false; rx.y = 0; rx.tongue = 0; rx.rx = 0;
    } else if (t < tP) {
      const k = (t - tU) / (tP - tU);
      c.root.position.set(this.Lp.x, 0, this.Lp.z); c.root.rotation.y = CAM_YAW;
      rx.y = .35 * Math.sin(Math.min(1, k * 2) * Math.PI); c.squash = k < .5 ? -.1 : .2 * (1 - k); c.pose = 'idle'; fc(c, 'happy');
      if (!this.flags.up) { this.flags.up = 1; G.sfx('pop', 8); c._fx(G.tw, 'note', { x: .42, y: .9 }); }
    } else {
      const k = clamp((t - tP) / (tE - tP), 0, 1), p = lerpXZ(this.Lp, this.R, ease.inOutSine(k));
      c.root.position.set(p.x, 0, p.z); c.root.rotation.y = lerpA(yawTo(this.Lp, this.R), yawTo(this.R, this.C), k);
      rx.y = Math.sin(k * Math.PI) * .7; c.squash = 0; c.pose = 'idle';
      if (k > .95 && !this.flags.land) { this.flags.land = 1; c.squash = .3; G.sfx('land'); }
    }
  }
  onPeak() { this.c._fx(this.G.tw, 'star', { x: .45, y: .7, dur: .6 }); this.G.sfx('pop', 11); }
  present() { return true; }
  focus(v) { return this.c.root.visible ? this.center3(this.c, v) : v.set(this.Wt.x, .1, this.Wt.z); }
}

// 보드킹: rolls back and forth in front of the quarter-pipe; crouch + push → up the ramp → a kickflip hanging high over
// the coping (peak) → back down and out
class Skate extends Moment {
  constructor(G) {
    super(G, 'skate', 1.45, .45, 1.5);
    this.Q = G.spot.qp; this.zl0 = 1.35;
    const c = this.c = G.mk('skater', 0, 0, 0); this.chars = [c];
    this.bu = c.S * SC; this.it = Math.random() * 6;
  }
  at(zl, h) { const c = this.c; c.root.position.set(this.Q.x + zl, 0, this.Q.z); const hb = h / this.bu; c.rx.y = hb; c.rx.by = hb; }
  idle(dt) {
    const c = this.c; this.it += dt; const zl = this.zl0 + Math.sin(this.it * .9) * .25;
    this.at(zl, 0); c.rx.rz = 0; c.rx.bz = 0; c.rx.bflip = 0; c.root.rotation.y = 0; this.zIdle = zl;
    c.moveLean = -Math.cos(this.it * .9) * .06;
  }
  begin() { this.zs = this.zIdle ?? this.zl0; }
  anim(t) {
    const G = this.G, c = this.c, rx = c.rx, T = this.T, P = this.P, R = .78, H = .62, AIR = .85;
    const tA = .5, tB = T - .36, tC = T - .1, tD = T + P + .24, tE = tD + .26, tEnd = T + P + this.A;
    const curve = u => { const cc = HP * (1 - u); return { zl: -.28 + R * (1 - Math.sin(cc)), h: H * (1 - Math.cos(cc)), a: HP - cc }; };
    let zl, h = 0, tilt = 0; rx.bflip = 0; c.pose = 'idle'; c.moveLean = 0;
    if (t < tA) {
      zl = this.zs + Math.sin(t / tA * Math.PI) * .12; c.squash = .34 * Math.sin(t / tA * Math.PI); fc(c, 'normal');
      if (!this.flags.cue) { this.flags.cue = 1; c._fx(G.tw, 'excl', { x: .4, y: 1.0, dur: .8 }); G.sfx('swish'); }
    } else if (t < tB) {
      const k = (t - tA) / (tB - tA); zl = lerp(this.zs, .5, ease.inQuad(k)); fc(c, 'happy'); c.moveLean = .12 * k;
      if (!this.flags.go) { this.flags.go = 1; G.sfx('whoosh'); }
    } else if (t < tC) {
      const q = curve((t - tB) / (tC - tB)); zl = q.zl; h = q.h; tilt = q.a * .7;
    } else if (t < tD) {
      zl = -.22;
      if (t < T) { const k = (t - tC) / (T - tC); h = H + AIR * .85 * ease.outQuad(k); tilt = HP * .7 * (1 - k); }
      else if (t < T + P) { const u = (t - T) / P; h = H + AIR * (.85 + .15 * Math.sin(u * Math.PI)); rx.bflip = TAU * ease.inOutCubic(u); c.pose = 'cheer'; }
      else { const k = (t - T - P) / (tD - T - P); h = H + AIR * .85 * (1 - ease.inQuad(k)); tilt = HP * .7 * k; }
      fc(c, 'happy');
    } else if (t < tE) {
      const q = curve(1 - (t - tD) / (tE - tD)); zl = q.zl; h = q.h; tilt = q.a * .7;
    } else {
      const k = (t - tE) / (tEnd - tE); zl = lerp(.5, this.zl0, ease.outCubic(k)); c.moveLean = -.1 * (1 - k);
      if (!this.flags.land) { this.flags.land = 1; c.squash = .3; G.sfx('land'); }
    }
    this.at(zl, h); rx.rz = -tilt; rx.bz = -tilt; c.root.rotation.y = 0;
  }
  onPeak() { this.c._fx(this.G.tw, 'star', { x: .5, y: .5, dur: .6 }); this.c._fx(this.G.tw, 'sparkle', { x: -.45, y: .8, dur: .6 }); this.G.sfx('special'); }
}

// 졸졸이: dozing on the bench; its snot bubble swells (trembling, squeaking) → a giant bubble (peak) → POP, "헉!"
class Bubble extends Moment {
  constructor(G) {
    super(G, 'bubble', 1.6, .45, 1.4); this.keepIdle = true;
    const B = G.spot.bench;
    const c = this.c = G.mk('sleepy', B.x + Math.sin(B.a) * .04, B.z + Math.cos(B.a) * .04, B.a); c.root.position.y = .46; this.chars = [c];
    this.s = null;
    // the snot bubble the moment blows up: opaque pale blue with a shine (the built-in one is a faint glass bead)
    const big = this.big = put(sph(.075, '#cdefff', { rim: 0 }, 20, 14), 0, 0, .03); big.add(put(sph(.024, '#ffffff', { rim: 0 }, 10, 8), -.03, .036, .058));
    c.bubble.parent.add(big); big.visible = false; G.L.world.idsDirty = true;
  }
  idle() { this.s = null; }
  anim(t) {
    const G = this.G, c = this.c, rx = c.rx, T = this.T, P = this.P;
    if (t < T) {
      const k = t / T; this.s = 1 + 3.4 * ease.inQuad(k) + Math.sin(t * 30) * .07 * k; rx.rx = .1 * k; fc(c, 'normal'); c.pose = 'idle';
      const n = Math.floor(k * 5); if (n > (this.flags.n ?? -1)) { this.flags.n = n; G.sfx('hop', n * 2); }
    } else if (t < T + P) {
      this.s = 4.7 + Math.sin(t * 55) * .16; rx.rz = Math.sin(t * 40) * .035;
    } else {
      const u = t - T - P;
      if (!this.flags.pop) {
        this.flags.pop = 1; const v = this.focus(new THREE.Vector3());
        G.sfx('pop', 12); G.sfx('gasp'); fc(c, 'wow'); rx.rz = 0;
        c._fx(G.tw, 'puff', { x: .1, y: .35, z: .5, rise: .15, dur: .45, s: 1.8 }); c._fx(G.tw, 'excl', { x: .36, y: 1.0, dur: .8 });
        G.burstAt(v, { colors: ['#ffffff', '#cdeeff', '#9fdcff'], n: 12, shape: 'circle', speed: 200, size: 8 });
      }
      this.s = null; rx.y = u < .4 ? .55 * Math.sin(u / .4 * Math.PI) : 0; c.pose = u < .7 ? 'flail' : 'idle'; rx.rx = 0;
      if (u > .95) fc(c, 'normal');
    }
  }
  reset() { this.s = null; }
  post() {
    const c = this.c, b = c.bubble, big = this.big, s = this.s;
    big.visible = s != null; if (b) b.visible = s == null && c.sleeping;
    if (s != null) { big.scale.setScalar(s); big.position.set(.075 * (s - 1) * .45, -.02 * (s - 1), .03 + .075 * (s - 1) * .75); }
  }
  focus(v) {
    const c = this.c;
    if (this.s != null) { c.root.updateMatrixWorld(true); const b = this.big.getWorldPosition(new THREE.Vector3()); return this.center3(c, v, .55).lerp(b, .55); }   // the bubble and the sleepy face, both in the picture
    return this.center3(c, v, .5);
  }
}

// 햄찌: stuffs seeds one by one (cheeks a size up each time) → cheeks at their maximum (peak) → a long "후우~"
class Cheeks extends Moment {
  constructor(G) {
    super(G, 'cheeks', 1.45, .45, 1.2);
    const S = G.spot.ham; this.S = S; this.goal = 0;
    const c = this.c = G.mk('hamster', S.x, S.z, CAM_YAW); this.chars = [c];
    const g = this.pile = new THREE.Group(); this.seeds = [];
    for (let i = 0; i < 4; i++) { const s = put(sph(.05, '#5d5866', { rough: .6 }, 12, 8), (i - 1.5) * .1, .03, (i % 2) * .06 - .03, 0, i * .7, 0, [.75, .55, 1.25]); g.add(s); this.seeds.push(s); }
    g.position.set(S.x + Math.sin(CAM_YAW) * .5, 0, S.z + Math.cos(CAM_YAW) * .5); g.rotation.y = CAM_YAW;
    G.add(g);
  }
  idle() { }
  begin() { this.goal = 0; }
  reset() { this.goal = 0; this.seeds.forEach(s => (s.visible = true)); }
  anim(t, dt) {
    const G = this.G, c = this.c, rx = c.rx, T = this.T, P = this.P;
    if (t < T) {
      const n = Math.min(3, Math.floor(t / .34)), u = clamp((t - n * .34) / .34, 0, 1);
      c.pose = 'lick'; rx.lick = Math.sin(u * Math.PI); fc(c, 'happy');
      if (u > .5 && (this.flags.n ?? -1) < n) { this.flags.n = n; this.goal = .55 * (n + 1); G.sfx('pop', 2 + n * 2); this.seeds[n].visible = false; c.squash = .14; }
      if (!this.flags.cue) { this.flags.cue = 1; c._fx(G.tw, 'ques', { x: .4, y: .95, dur: .7 }); }
    } else if (t < T + P) {
      this.goal = 2.8; c.pose = 'idle'; rx.lick = 0; fc(c, 'wow'); rx.y = .12 * Math.sin((t - T) / P * Math.PI);
    } else {
      const u = (t - T - P) / this.A; this.goal = u < .15 ? 2.8 : 0; fc(c, u < .25 ? 'wow' : 'happy'); rx.y = 0;
      if (u > .2 && !this.flags.phew) { this.flags.phew = 1; G.sfx('phew'); c._fx(G.tw, 'puff', { x: 0, y: .35, z: .6, rise: .1, dur: .6, s: 1.3 }); }
    }
    rx.cheek += (this.goal - rx.cheek) * (1 - Math.exp(-dt * (t >= T && t < T + P ? 30 : 12)));
  }
  onPeak() { const c = this.c; c.squash = .25; c._fx(this.G.tw, 'sparkle', { x: -.5, y: .55, dur: .6 }); c._fx(this.G.tw, 'sparkle', { x: .5, y: .6, dur: .6, delay: .05 }); this.G.sfx('pop', 12); }
  focus(v) { return this.center3(this.c, v, .38); }
}

// 치즈냥 vs 까망이: they notice each other ("!"), creep closer crouching → both puff up "하악!" (peak) → jump apart
class Hiss extends Moment {
  constructor(G) {
    super(G, 'hiss', 1.4, .45, 1.4);
    this.M = G.spot.cats; this.d = { x: SQ2, z: -SQ2 };
    this.a = G.mk('cheese', 0, 0, 0); this.b = G.mk('kkamang', 0, 0, 0); this.chars = [this.a, this.b];
    this.idleYaw = [CAM_YAW + .3, CAM_YAW - .3]; this.faceYaw = [HP + .25, -.25];
    this.idle(0);
  }
  place(c, off) { c.root.position.set(this.M.x + this.d.x * off, 0, this.M.z + this.d.z * off); }
  idle() { this.place(this.a, -.72); this.place(this.b, .72); this.a.root.rotation.y = this.idleYaw[0]; this.b.root.rotation.y = this.idleYaw[1]; }
  anim(t) {
    const G = this.G, T = this.T, P = this.P, [a, b] = this.chars;
    let off, yk, sc = SC, sq = 0, y = 0, f = 'normal';
    if (t < T) {
      yk = ease.outCubic(clamp(t / .3, 0, 1));
      const k2 = clamp((t - .3) / (T - .4), 0, 1); off = lerp(.72, .47, ease.inOutSine(k2));
      y = k2 > 0 && k2 < 1 ? Math.abs(Math.sin(k2 * Math.PI * 3)) * .12 : 0;
      sq = .17 * k2 + Math.sin(t * 50) * .02 * k2; f = t < .8 ? 'sus' : 'angry';
      a.rx.wag = b.rx.wag = k2;
      if (!this.flags.cue) { this.flags.cue = 1; for (const c of this.chars) c._fx(G.tw, 'excl', { x: .3, y: 1.0, dur: .8 }); G.sfx('gasp'); }
      a.pose = b.pose = 'idle';
    } else if (t < T + P) {
      const u = (t - T) / P; off = .47; yk = 1; sc = SC * (1 + .3 * ease.outBack(Math.min(1, u * 3))); sq = -.2; y = .2 * Math.sin(Math.min(1, u * 2) * HP); f = 'angry';
      a.pose = 'paw'; a.rx.lick = Math.abs(Math.sin(u * Math.PI * 3)); b.pose = 'flail';
    } else {
      const u = (t - T - P) / this.A, k = clamp(u / .35, 0, 1);
      off = lerp(.47, .72, ease.outCubic(k)); y = Math.sin(k * Math.PI) * .5; sc = lerp(SC * 1.3, SC, ease.outCubic(k));
      yk = 1 - clamp((u - .55) / .3, 0, 1); f = u < .5 ? 'angry' : 'normal'; a.pose = b.pose = 'idle'; a.rx.lick = 0; a.rx.wag = b.rx.wag = 0;
      if (k >= 1 && !this.flags.land) { this.flags.land = 1; a.squash = b.squash = .3; G.sfx('land'); }
    }
    this.place(a, -off); this.place(b, off);
    [a, b].forEach((c, i) => { c.root.rotation.y = lerpA(this.idleYaw[i], this.faceYaw[i], yk); c.root.scale.setScalar(sc); if (sq) c.squash = sq; c.rx.y = y; fc(c, f); });
  }
  onPeak() {
    const G = this.G;
    for (const c of this.chars) { c._fx(G.tw, 'anger', { x: .38, y: 1.0, dur: .7 }); G.say(c, '하악!', 650, 'red'); }
    G.sfx('angry'); G.sfx('swish');
  }
  focus(v) { const a = this.a.root.position, b = this.b.root.position; return v.set((a.x + b.x) / 2, .4, (a.z + b.z) / 2); }
}

// 멍뭉이: chases its tail faster and faster → flops over dizzy, stars round its head (peak) → shakes it off
class Dizzy extends Moment {
  constructor(G) {
    super(G, 'dizzy', 1.5, .45, 1.5);
    const S = G.spot.shiba; const c = this.c = G.mk('shiba', S.x, S.z, CAM_YAW); this.chars = [c];
  }
  idle() { }
  anim(t) {
    const G = this.G, c = this.c, rx = c.rx, T = this.T, P = this.P;
    if (t < T) {
      const ang = TAU * (.6 * t + .95 * t * t); rx.ry = ang; rx.y = Math.abs(Math.sin(ang)) * .07; rx.wag = 1; fc(c, 'happy'); rx.rz = 0;
      const rev = Math.floor(ang / TAU); if (rev > (this.flags.rev ?? -1)) { this.flags.rev = rev; G.sfx('hop', 2 + rev * 2); }
      if (!this.flags.cue) { this.flags.cue = 1; c._fx(G.tw, 'heart', { x: .4, y: .9, dur: .7 }); G.sfx(c.kind === 'bunny' ? 'giggleBunny' : 'giggle'); }
      this.ry0 = ang;
    } else if (t < T + P) {
      const u = (t - T) / P; if (this.ry1 == null || this.flags.pk == null) { this.flags.pk = 1; this.ry1 = Math.ceil(this.ry0 / TAU + .15) * TAU; }
      rx.ry = lerp(this.ry0, this.ry1, ease.outCubic(Math.min(1, u * 3))); rx.rz = 1.35 * ease.outBack(Math.min(1, u * 4)); rx.y = 0; rx.wag = 0; fc(c, 'dizzy');
    } else {
      const u = t - T - P; rx.ry = 0;
      rx.rz = u < .7 ? 1.35 + Math.sin(u * 12) * .04 : 1.35 * (1 - ease.outBack(clamp((u - .7) / .4, 0, 1)));
      fc(c, u < 1.05 ? 'dizzy' : 'happy');
      if (u > 1.1 && !this.flags.up) { this.flags.up = 1; c.squash = .25; G.sfx('wobble'); }
    }
  }
  onPeak() { const G = this.G, c = this.c; c.squash = .3; for (let i = 0; i < 3; i++) c._fx(G.tw, 'star', { x: -.45 + i * .45, y: .95 + (i % 2) * .12, dur: .9, spin: 3, delay: i * .05 }); G.sfx('dizzy'); G.sfx('land'); }
  focus(v) { return this.center3(this.c, v, .32); }
}

// 둠칫이: headphones on, the beat speeds up (notes fly faster) → the drop: a big spinning jump (peak) → lands
class Drop extends Moment {
  constructor(G) {
    super(G, 'drop', 1.5, .45, 1.0);
    const S = G.spot.dj; const c = this.c = G.mk('dj', S.x, S.z, CAM_YAW); this.chars = [c]; this.ph = 0;
  }
  idle() { }
  begin() { this.ph = 0; }
  anim(t, dt) {
    const G = this.G, c = this.c, rx = c.rx, T = this.T, P = this.P, tJ = T - .2;
    if (t < tJ) {
      const k = t / T; this.ph += dt * (7 + 20 * k); rx.y = Math.abs(Math.sin(this.ph)) * .1; c.pose = 'phones'; fc(c, 'happy'); rx.ry = 0;
      const b = Math.floor(this.ph / Math.PI);
      if (b > (this.flags.b ?? -1)) { this.flags.b = b; G.sfx('pop', [0, 4, 7, 9, 12][b % 5]); if (b % 2 === 0) c._fx(G.tw, 'note', { x: b % 4 ? .45 : -.45, y: .9, dur: .55 }); }
      if (t > tJ - .18) c.squash = .32;
    } else if (t < T + P) {
      const y1 = .95;
      rx.y = t < T ? y1 * ease.outQuad((t - tJ) / (T - tJ)) : y1 + .12 * Math.sin((t - T) / P * Math.PI);
      rx.ry = t < T ? TAU * ease.inOutCubic((t - tJ) / (T - tJ)) : 0; c.pose = 'cheer'; fc(c, 'wow');
      if (!this.flags.up) { this.flags.up = 1; G.sfx('whoosh'); }
    } else {
      const u = t - T - P; rx.y = u < .22 ? .95 * (1 - ease.inQuad(u / .22)) : 0; rx.ry = 0;
      if (u >= .22 && !this.flags.land) { this.flags.land = 1; c.squash = .35; G.sfx('land'); }
      c.pose = u < .5 ? 'cheer' : 'idle'; fc(c, 'happy');
    }
  }
  onPeak() { const c = this.c; c._fx(this.G.tw, 'star', { x: -.45, y: .9, dur: .6 }); c._fx(this.G.tw, 'star', { x: .45, y: 1.0, dur: .6, delay: .06 }); this.G.sfx('special'); }
}

// 추로 (rare): pokes out of the bush once an outing, sits, a long stretch → the biggest yawn (peak) → back into the bush
class Yawn extends Moment {
  constructor(G) {
    super(G, 'yawn', 1.7, .45, 1.6);
    this.B = G.spot.bush; this.Y = G.spot.churro;
    const c = this.c = G.mk('churro', this.B.x, this.B.z, CAM_YAW); this.chars = [c]; c.root.visible = false;
  }
  present() { return this.busy; }
  idle() { this.c.root.visible = false; }
  anim(t) {
    const G = this.G, c = this.c, rx = c.rx, T = this.T, P = this.P, tO = .65;
    c.root.visible = true;
    if (t < tO) {
      const k = t / tO, p = lerpXZ(this.B, this.Y, ease.outQuad(k)); c.root.position.set(p.x, 0, p.z);
      c.root.rotation.y = lerpA(yawTo(this.B, this.Y), CAM_YAW, k); rx.y = Math.abs(Math.sin(k * TAU)) * .28; fc(c, 'normal'); c.pose = 'idle';
      if (!this.flags.cue) { this.flags.cue = 1; c._fx(G.tw, 'sparkle', { x: .4, y: .9, dur: .8 }); G.sfx('coin', 8); G.say(c, '…냥?', 900, 'think'); }
    } else if (t < T) {
      const k = (t - tO) / (T - tO); c.root.position.set(this.Y.x, 0, this.Y.z); c.root.rotation.y = CAM_YAW; rx.y = 0;
      c.squash = -.3 * ease.inOutSine(k); c.pose = k > .3 ? 'stretch' : 'idle'; rx.rx = -.14 * k; fc(c, 'happy');
    } else if (t < T + P) {
      c.root.position.set(this.Y.x, 0, this.Y.z); c.root.rotation.y = CAM_YAW; rx.y = 0;
      c.squash = -.34 + Math.sin(t * 40) * .02; c.pose = 'stretch'; rx.rx = -.16; fc(c, 'wow');
    } else {
      const u = t - T - P; rx.rx = 0; c.pose = 'idle';
      if (u < .8) { c.root.position.set(this.Y.x, 0, this.Y.z); fc(c, 'happy'); if (!this.flags.h) { this.flags.h = 1; c._fx(G.tw, 'heart', { x: .4, y: .9, dur: .8 }); } }
      else { const k = clamp((u - .8) / .7, 0, 1), p = lerpXZ(this.Y, this.B, ease.inQuad(k)); c.root.position.set(p.x, 0, p.z); c.root.rotation.y = yawTo(this.Y, this.B); rx.y = Math.abs(Math.sin(k * TAU)) * .25; c.root.visible = k < .97; }
    }
  }
  onPeak() { const c = this.c, G = this.G; for (let i = 0; i < 3; i++) c._fx(G.tw, 'sparkle', { x: -.5 + i * .5, y: .95 + (i % 2) * .15, dur: .8, delay: i * .05, spin: 2 }); G.sfx('phew'); G.sfx('special'); }
}

const KINDS = { frog: Frog, skate: Skate, bubble: Bubble, cheeks: Cheeks, hiss: Hiss, dizzy: Dizzy, drop: Drop, yawn: Yawn };

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.spot = SPOT; this.chars = []; this.extra = []; this.bubbles = []; this.polas = []; this.shots = []; this.doms = []; }
  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world, ui = L.ui;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx];
    const app = document.getElementById('app'); app.dataset.night = ''; app.dataset.scene = 'photo';
    L.setBg(LV.bg); W.setLight(LV.light);
    this.map = new MapRooms(W, this.mapDef()); W.root.add(this.map.group); this.map.group.updateMatrixWorld(true);
    this.moments = LV.ms.map(id => new KINDS[id](this));
    for (const m of this.moments) m.idle(0);
    this.byId = Object.fromEntries(this.moments.map(m => [m.id, m]));
    this.film = LV.film; this.timeLeft = LV.time; this.perfects = 0; this.news = 0; this.result = null; this.shotCool = 0; this.slow = 0;
    this.gap = 1.0; this.rareAt = LV.rare ? rnd(...LV.rare) : null; this.rareDone = !LV.rare;
    this.album = this.loadAlbum();
    this.frame();
    L.makeThumbs({ faces: ALBUM_ORDER.map(id => META[id].face) });
    this.buildHud();
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    try { L.audio.music('play'); } catch {}
    await ui.banner(LV.name, LV.sub, 1300);
    if (this.dead) return;
    this.started = true;
  }
  mapDef() {
    const F = (type, s, a = 0, opts) => ({ type, x: s.x, z: s.z, a, opts });
    const furniture = [
      F('quarterpipe', SPOT.qp, SPOT.qp.a), F('pond', SPOT.pond), F('bench', SPOT.bench, SPOT.bench.a), F('speaker', SPOT.speaker, -.3),
      F('picnic', SPOT.basket, -.4), F('bush', SPOT.bush, CAM_YAW), F('tree', P(-2.3, -1.0)), F('tree', P(2.45, -1.35)), F('reeds', { x: 1.3, z: -2.15 }),
    ];
    const room = { w: 6, d: 6, theme: THEMES.park2, walls: { N: 'hedge', W: 'fence', S: 'none', E: 'none' }, furniture, tidy: true, exact: true };
    return { theme: THEMES.park2, bleed: true, rooms: [{ at: [0, 0], layout: room }] };
  }
  frame() {
    const W = this.L.world, c = P(0, -.5);
    W.home.set(c.x, .3, c.z); W.target.copy(W.home); W.yaw = CAM_YAW; W.pitch = .72; W.zoom = 1;
    W.bounds = 99; W.slack = null; W.camLock = true; W.yawGoal = null; W.vYaw = 0;
    W.setFit(4.17, 3, .445);
  }
  // a friend, a bit bigger than life
  mk(kind, x, z, yaw) { const c = new Char(kind); c.root.scale.setScalar(SC); c.root.position.set(x, 0, z); c.root.rotation.y = yaw; this.L.world.root.add(c.root); this.chars.push(c); return c; }
  add(o) { this.L.world.root.add(o); this.extra.push(o); this.L.world.idsDirty = true; return o; }
  sfx(n, p) { this.L.audio.sfx(n, p); }
  // a speech bubble that follows a (scaled) friend's head
  say(c, text, ms = 900, cls = '') {
    const b = this.L.h('div', { class: 'bubble pop ph-say ' + cls }, text); this.L.ui.wui.append(b);
    const rec = { b, c, until: this.t + ms / 1000 }; this.bubbles.push(rec); this.placeBubble(rec); return b;
  }
  placeBubble(r) {
    const c = r.c, s = c.root.scale.y, p = this.L.world.toScreen(new THREE.Vector3(c.root.position.x, c.root.position.y + (c.headTop() + c.rx.y * c.S) * s + .18, c.root.position.z));
    r.b.style.left = p.x + 'px'; r.b.style.top = Math.max(60, p.y) + 'px';
  }
  burstAt(v, o) { const p = this.L.world.toScreen(v); this.L.world.fx.burst(p.x, p.y, o); }
  // a splash on the pond: a ring spreading on the water, drops thrown up, a white flash of foam
  splash(x, z) {
    const G = this, tw = this.tw;
    const ring = put(tor(.18, .018, '#ffffff', { rim: 0, opacity: .85 }, TAU, 6, 32), x, .05, z, HP, 0, 0); this.add(ring);
    const ring2 = put(tor(.12, .014, '#ffffff', { rim: 0, opacity: .7 }, TAU, 6, 28), x, .05, z, HP, 0, 0); this.add(ring2);
    const drops = []; for (let i = 0; i < 6; i++) { const d = put(sph(.06, '#bfeaff', { rim: 0 }, 10, 8), x, .05, z); this.add(d); drops.push({ d, a: i / 6 * TAU + Math.random() * .4, v: rnd(.6, 1.1) }); }
    tw.run(.9, k => {
      ring.scale.setScalar(1 + k * 4); ring.material.opacity = 1; ring.visible = k < .95; ring2.scale.setScalar(1 + ease.outQuad(Math.max(0, k - .15)) * 6); ring2.visible = k > .15 && k < .9;
      for (const o of drops) { const kk = Math.min(1, k * 1.6); o.d.position.set(x + Math.sin(o.a) * o.v * .5 * kk, .05 + o.v * 1.4 * kk * (1 - kk) * 1.6, z + Math.cos(o.a) * o.v * .5 * kk); o.d.visible = kk < 1; }
    }, ease.linear).then(() => { for (const o of [ring, ring2, ...drops.map(q => q.d)]) { this.L.world.root.remove(o); this.extra = this.extra.filter(e => e !== o); } });
    G.sfx('pop', 1); G.sfx('whoosh'); this.burstAt(new THREE.Vector3(x, .1, z), { colors: ['#ffffff', '#9fdcff', '#6fc6f0'], n: 16, shape: 'circle', speed: 240, size: 9, up: 120 });
  }

  // ── HUD: a slim top bar (home · title · film · time) and the album strip at the bottom
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col(), LV = this.lv;
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, '찰칵! 동네 사진관', h('small', {}, `${this.lvIdx + 1}. ${LV.name}`)));
    this.filmEl = h('div', { class: 'ph-pill film', html: `${FILM_SVG}<b>${this.film}</b>` });
    this.timeEl = h('div', { class: 'ph-pill time', html: `${CLOCK_SVG}<b>${this.fmtTime(this.timeLeft)}</b>` });
    top.append(h('div', { class: 'ph-pills' }, this.filmEl, this.timeEl));
    col.append(top);
    // the album: one slot per moment of this outing — a silhouette until you catch it
    this.slots = {};
    const strip = this.strip = h('div', { class: 'ph-strip' });
    for (const m of this.moments) {
      const meta = m.meta, a = this.album[m.id];
      const s = h('div', { class: 'ph-slot' + (meta.rare ? ' rare' : '') },
        h('img', { class: 'face', src: L.thumbs[`face_${meta.face[0]}_${meta.face[1]}`] }), h('img', { class: 'photo' }), h('span', { class: 'q ol' }, '?'), h('i', { class: 'gr' }));
      this.slots[m.id] = s; this.fillSlot(m.id, a, false); strip.append(s);
    }
    col.append(strip);
    if (LV.hint) { this.hint = h('div', { class: 'ph-hint ol' }, h('span', { class: 'ph-hand' }), h('span', {}, '친구의 멋진 순간에 터치! 찰칵')); col.append(this.hint); }
    this.flash = h('div', { class: 'ph-flash' }); document.getElementById('app').append(this.flash); this.doms.push(this.flash);
  }
  fillSlot(id, a, pop = true) {
    const s = this.slots[id]; if (!s) return;
    s.classList.toggle('got', !!a); s.classList.toggle('perfect', a?.g === 'perfect');
    if (a) { s.querySelector('img.photo').src = a.img; s.querySelector('.gr').textContent = a.g === 'perfect' ? '★' : ''; }
    if (pop) { s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); }
  }
  fmtTime(t) { const s = Math.max(0, Math.ceil(t)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  setFilm() { const b = this.filmEl.querySelector('b'); b.textContent = this.film; this.filmEl.classList.toggle('low', this.film <= 2); this.filmEl.classList.remove('bump'); void this.filmEl.offsetWidth; this.filmEl.classList.add('bump'); }

  // ── input: one finger, tap = shutter right there (buttons and panels never shoot)
  bindInput() {
    const app = document.getElementById('app'), W = this.L.world;
    this._down = e => {
      if (e.button > 0) return;
      if (e.target !== W.canvas && e.target.id !== 'fx') return;
      this.tapAt(e.clientX, e.clientY);
    };
    app.addEventListener('pointerdown', this._down);
  }
  tapAt(x, y) {
    if (!this.started || this.result || this.film <= 0 || this.shotCool > 0 || this.L.pending) return false;
    const L = this.L, W = L.world;
    this.shotCool = .32; this.film--; this.setFilm();
    // the photo: draw the frame now and read it back in this same task (the canvas keeps no drawing buffer)
    const j = this.judge(x, y);
    const snap = this.snap(x, y, j);
    const shot = { id: j.m?.id || null, g: j.g, url: snap.url, cx: snap.cx, cy: snap.cy, early: j.early, idle: j.idle, t: +this.t.toFixed(2) };
    this.shots.push(shot);
    // shutter: sound, flash, the viewfinder snapping on the spot
    this.shutterSfx(); this.flashFx(); this.viewfinder(snap.cx, snap.cy, j.g);
    if (j.g === 'perfect') {
      this.perfects++; this.slow = .16; L.audio.sfx('found', 4); setTimeout(() => !this.dead && L.audio.sfx('star', 2), 120);
      j.m.chars.forEach(c => c._fx(this.tw, 'heart', { x: .45, y: 1.05, dur: .7, s: .9 }));
      W.fx.burst(snap.cx, snap.cy, { n: 16, speed: 300, size: 11 });
      this.zoomPunch();
    } else if (j.g === 'good') L.audio.sfx('pop', 6);
    else L.audio.sfx('miss');
    // the album: a new moment, or a better picture of one you had
    let gain = null;
    if (j.m && RANK[j.g] >= RANK.good) {
      const old = this.album[j.m.id];
      if (!old) gain = 'new'; else if (RANK[j.g] > RANK[old.g]) gain = 'better';
      if (gain) { this.album[j.m.id] = { g: j.g, img: snap.url }; this.saveAlbum(); if (gain === 'new') this.news++; }
    }
    shot.gain = gain;
    this.showPolaroid(shot, j);
    if (this.hint) { this.hint.remove(); this.hint = null; }
    L.log({ shot: this.shots.length, lv: this.lvIdx + 1, id: shot.id, g: shot.g, gain });
    if (this.film <= 0) this.endIn = 1.7;
    return true;
  }
  judge(x, y) {
    const W = this.L.world, v = new THREE.Vector3(); let best = null;
    for (const m of this.moments) {
      if (!m.present()) continue;
      const p = W.toScreen(m.focus(v)), d = Math.hypot(p.x - x, p.y - y);
      if (d > PHOTO * .55) continue;
      let g = m.timing(); if (g === 'perfect' && d > PHOTO * .4) g = 'good';
      const s = RANK[g] * 1000 - d;
      if (!best || s > best.s) best = { m, g, d, s, early: m.early(), idle: !m.busy };
    }
    return best || { m: null, g: 'miss' };
  }
  // crop a square around the finger out of a freshly drawn frame, then give it the film-camera look
  snap(x, y, j) {
    const W = this.L.world, cv = W.canvas, r = cv.width / innerWidth, S = PHOTO * r;
    const sx = clamp(x * r - S / 2, 0, cv.width - S), sy = clamp(y * r - S / 2, 0, cv.height - S);
    const N = 256, out = document.createElement('canvas'); out.width = out.height = N;
    const g = out.getContext('2d');
    g.fillStyle = this.lv.sky; g.fillRect(0, 0, N, N);
    W.render();
    g.drawImage(cv, sx, sy, S, S, 0, 0, N, N);
    if (j.g === 'meh' && j.m && !j.idle) { g.globalAlpha = .4; g.drawImage(cv, sx - 7 * r, sy + 2 * r, S, S, 0, 0, N, N); g.globalAlpha = 1; }   // a late / early shot: shaky
    // warm film tone + vignette
    g.fillStyle = 'rgba(255, 196, 140, .08)'; g.fillRect(0, 0, N, N);
    const vg = g.createRadialGradient(N / 2, N / 2, N * .38, N / 2, N / 2, N * .74); vg.addColorStop(0, 'rgba(40,20,50,0)'); vg.addColorStop(1, 'rgba(40,20,50,.32)');
    g.fillStyle = vg; g.fillRect(0, 0, N, N);
    // a perfect shot gets the friend's own sound word, like a comic panel
    if (j.g === 'perfect') this.comicWord(g, j.m.meta.word, N);
    // the orange date stamp in the corner
    g.font = 'bold 15px ui-monospace, Menlo, monospace'; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(255, 120, 40, .95)'; g.shadowColor = 'rgba(255, 90, 20, .8)'; g.shadowBlur = 4; g.fillText("'26 10 18", N - 10, N - 10); g.shadowBlur = 0;
    return { url: out.toDataURL('image/jpeg', .84), cx: sx / r + PHOTO / 2, cy: sy / r + PHOTO / 2 };
  }
  comicWord(g, word, N) {
    g.save(); g.translate(N * .29, N * .13); g.rotate(-.12);
    g.font = '36px BagelFat, Ssurround, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = g.measureText(word).width + 26, hh = 52;
    g.fillStyle = '#ffffff'; g.strokeStyle = '#3a2453'; g.lineWidth = 4;
    g.beginPath(); g.roundRect ? g.roundRect(-w / 2, -hh / 2, w, hh, 18) : g.rect(-w / 2, -hh / 2, w, hh); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-6, hh / 2 - 2); g.lineTo(8, hh / 2 + 14); g.lineTo(12, hh / 2 - 2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(-6, hh / 2 - 6, 18, 6);
    g.lineWidth = 6; g.strokeStyle = '#3a2453'; g.strokeText(word, 0, 2); g.fillStyle = '#ff5d8a'; g.fillText(word, 0, 2);
    g.restore();
  }
  shutterSfx() {
    const A = this.L.audio; if (A.muted) return;
    const c = A.ctx; if (!c || !A.sfxBus) { A.sfx('click'); return; }
    const t0 = c.currentTime;
    const burst = (at, dur, f, vol, q) => {
      const n = Math.ceil(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
      const s = c.createBufferSource(); s.buffer = b; const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
      const g = c.createGain(); g.gain.value = vol; s.connect(fl).connect(g).connect(A.sfxBus); s.start(t0 + at);
    };
    burst(0, .04, 3400, .9, .8); burst(.07, .06, 1700, .8, .9);   // 찰- 칵
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'square'; o.frequency.setValueAtTime(64, t0 + .17); o.frequency.linearRampToValueAtTime(118, t0 + .4);
    g.gain.setValueAtTime(0, t0 + .17); g.gain.linearRampToValueAtTime(.05, t0 + .21); g.gain.linearRampToValueAtTime(0, t0 + .42);
    f.type = 'lowpass'; f.frequency.value = 900; o.connect(f).connect(g).connect(A.sfxBus); o.start(t0 + .17); o.stop(t0 + .45);
  }
  flashFx() { this.flash.getAnimations().forEach(a => a.cancel()); this.flash.animate([{ opacity: .92 }, { opacity: 0 }], { duration: 300, easing: 'ease-out' }); }
  viewfinder(x, y, g) {
    const el = this.L.h('div', { class: 'ph-vf ' + g, style: `left:${x}px;top:${y}px` }, this.L.h('i'), this.L.h('i'), this.L.h('i'), this.L.h('i'));
    document.getElementById('app').append(el); this.doms.push(el);
    el.animate([{ transform: 'translate(-50%,-50%) scale(1.25)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .35 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }], { duration: 520, easing: 'ease-out' }).onfinish = () => el.remove();
  }
  zoomPunch() { const W = this.L.world; this.tw.run(.3, k => { if (!this.dead) W.zoom = 1 + .045 * Math.sin(k * Math.PI); }, ease.linear).then(() => { if (!this.dead) W.zoom = 1; }); }

  // ── the polaroid: it grows out of the spot you shot, develops, gets its grade stamp, then files itself in the album
  showPolaroid(shot, j) {
    const L = this.L, h = L.h, app = document.getElementById('app');
    for (const p of this.polas) p.leave?.();
    const cap = j.m ? (j.g === 'meh' ? (j.idle ? `${j.m.meta.name.split(' ')[0]}… 그냥 서 있네` : j.early ? '앗, 너무 일렀어' : '아쉬워, 조금 늦었어') : j.m.meta.name) : '아무도 없네…';
    const el = h('div', { class: 'ph-pola ' + shot.g },
      h('div', { class: 'ph-img' }, h('img', { src: shot.url }), h('i', { class: 'dev' })),
      h('div', { class: 'cap' }, cap),
      h('div', { class: 'ph-stamp ' + shot.g + ' ol' }, GLABEL[shot.g]));
    if (shot.gain) el.append(h('div', { class: 'ph-new ol' }, shot.gain === 'new' ? '새 사진!' : '더 좋은 사진!'));
    app.append(el); this.doms.push(el);
    const Wd = innerWidth, Ht = innerHeight, pw = 142, ph = 168;
    const cx = shot.cx < Wd / 2 ? Wd * .7 : Wd * .3, cy = shot.cy < Ht * .5 ? Ht - 132 - ph / 2 : 92 + ph / 2;
    el.style.left = (cx - pw / 2) + 'px'; el.style.top = (cy - ph / 2) + 'px';
    const rot = (shot.cx < Wd / 2 ? 1 : -1) * rnd(3, 7), s0 = PHOTO / 128;
    el.animate([{ transform: `translate(${shot.cx - cx}px, ${shot.cy - cy + 12}px) scale(${s0}) rotate(0deg)` }, { transform: `translate(0,0) scale(1) rotate(${rot}deg)` }],
      { duration: 430, easing: 'cubic-bezier(.2, 1.25, .4, 1)', fill: 'forwards' });
    if (shot.gain === 'new') setTimeout(() => { if (this.dead) return; L.audio.sfx('special'); L.world.fx.burst(cx, cy - 60, { n: 18, speed: 260, size: 10 }); }, 330);
    const rec = { el, done: false };
    rec.leave = () => {
      if (rec.done) return; rec.done = true; clearTimeout(rec.timer);
      const slot = shot.gain && this.slots[shot.id];
      el.getAnimations().forEach(a => a.cancel());
      if (slot) {
        const r = slot.getBoundingClientRect(), tx = r.left + r.width / 2 - cx, ty = r.top + r.height / 2 - cy;
        el.animate([{ transform: `rotate(${rot}deg)` }, { transform: `translate(${tx}px, ${ty}px) scale(.3) rotate(0deg)`, opacity: .85 }], { duration: 380, easing: 'cubic-bezier(.5, 0, .75, .4)', fill: 'forwards' })
          .onfinish = () => { el.remove(); if (this.dead) return; this.fillSlot(shot.id, this.album[shot.id]); L.audio.sfx('coin', shot.g === 'perfect' ? 6 : 2); const rr = slot.getBoundingClientRect(); L.world.fx.burst(rr.left + rr.width / 2, rr.top, { n: 10, speed: 180, size: 8 }); };
      } else {
        el.animate([{ transform: `rotate(${rot}deg)`, opacity: 1 }, { transform: `translate(0, 140px) rotate(${rot * 3}deg)`, opacity: 0 }], { duration: 420, easing: 'ease-in', fill: 'forwards' }).onfinish = () => el.remove();
      }
      this.polas = this.polas.filter(p => p !== rec);
    };
    rec.timer = setTimeout(rec.leave, shot.gain ? 1350 : 1050);
    this.polas.push(rec);
  }

  // ── album (kept in this browser; one best photo per moment)
  loadAlbum() { const a = store.get(ALBUM_KEY, {}); return a && typeof a === 'object' ? a : {}; }
  saveAlbum() { store.set(ALBUM_KEY, this.album); }

  // ── per frame
  update(dt) {
    const L = this.L;
    if (this.slow > 0) { this.slow -= dt; dt *= .3; }   // a tiny hit-stop on a perfect shot
    this.t += dt; this.tw.update(dt);
    this.map.update(dt);
    if (this.started && !this.result) this.direct(dt);
    for (const m of this.moments) m.step(dt);
    for (const c of this.chars) c.update(dt);
    for (const m of this.moments) m.post();
    this.bubbles = this.bubbles.filter(r => { if (this.t > r.until) { r.b.remove(); return false; } this.placeBubble(r); return true; });
    if (this.shotCool > 0) this.shotCool -= dt;
    if (!this.started || this.result) return;
    this.timeLeft -= dt;
    const tl = this.fmtTime(this.timeLeft), tb = this.timeEl.querySelector('b'); if (tb.textContent !== tl) { tb.textContent = tl; if (this.timeLeft < 10) L.audio.sfx('tick'); }
    this.timeEl.classList.toggle('low', this.timeLeft < 10);
    if (this.endIn != null) { this.endIn -= dt; if (this.endIn <= 0) return this.end('film'); }
    if (this.timeLeft <= 0) return this.end('time');
  }
  // what happens next: every couple of seconds a friend who's had a rest starts its moment; now and then two overlap
  direct(dt) {
    const LV = this.lv;
    if (!this.rareDone && this.t >= this.rareAt) { const r = this.moments.find(m => m.meta.rare); if (r && !r.busy) { r.start(); this.rareDone = true; } }
    this.gap -= dt; if (this.gap > 0) return;
    const busy = this.moments.filter(m => m.busy && !m.meta.rare).length;
    let ready = this.moments.filter(m => !m.meta.rare && !m.busy && m.cool <= 0);
    if (!ready.length || busy >= LV.busy) { this.gap = .25; return; }
    ready.sort((a, b) => (a.last - b.last) || (Math.random() - .5));
    let m = ready[0];
    if (!this.firstDone) { this.firstDone = true; m = this.byId[LV.first] || m; }
    m.start(); m.last = this.t;
    this.gap = Math.random() < LV.overlap ? rnd(.45, .9) : rnd(...LV.gap);
  }
  stars() { const [a, b, c] = this.lv.stars, n = this.perfects; return n >= c ? 3 : n >= b ? 2 : n >= a ? 1 : 0; }
  end(why) {
    if (this.result) return;
    const L = this.L, st = this.stars();
    this.result = st >= 1 ? 'win' : 'fail'; this.why = why;
    L.log({ result: this.result, lv: this.lvIdx + 1, shots: this.shots.length, perfects: this.perfects, stars: st, news: this.news, why });
    L.audio.sfx(this.result === 'win' ? 'win' : 'lose');
    if (this.result === 'win') L.world.fx.confetti(70);
    L.ui.banner(why === 'film' ? '필름 끝!' : '시간 끝!', null, 900);
    setTimeout(() => { if (!this.dead) this.resultPanel(); }, 1200);
  }
  resultPanel() {
    const L = this.L, h = L.h, st = this.stars(), last = this.lvIdx >= LEVELS.length - 1, [s1, s2, s3] = this.lv.stars;
    const starRow = h('div', { class: 'ph-stars' }, ...[0, 1, 2].map(i => h('span', { class: 'ph-star' + (i < st ? ' on' : ''), style: `animation-delay:${.15 + i * .18}s`, html: i < st ? ICON.star : ICON.starGray })));
    const roll = h('div', { class: 'ph-roll' }, ...this.shots.map((s, i) => h('div', { class: 'ph-mini ' + s.g, style: `--r:${((i * 37) % 9) - 4}deg` }, h('img', { src: s.url }), h('b', { class: 'ol' }, GLABEL[s.g]))));
    const need = st < 3 ? [s1, s2, s3][st] - this.perfects : 0;
    const got = ALBUM_ORDER.filter(id => this.album[id]).length;
    const body = [starRow, roll,
      h('div', { class: 'txt' }, `완벽한 사진 ${this.perfects}장` + (this.news ? ` · 새 사진 ${this.news}장` : '')),
      h('div', { class: 'txt ph-sm' }, st >= 3 ? `앨범 ${got}/${ALBUM_ORDER.length} · 최고의 출사!` : `별 하나 더: 완벽한 사진 ${need}장 더 · 앨범 ${got}/${ALBUM_ORDER.length}`)];
    const win = this.result === 'win';
    L.ui.panel({ title: win ? '출사 성공!' : '아쉬운 출사', color: win ? 'green' : 'orange', cls: 'ph-panel', body,
      buttons: win ? [this.againBtn = L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
        this.nextBtn = L.ui.btn(last ? '처음 출사부터' : '다음 출사', { color: 'green', cls: 'big', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) })]
        : [this.againBtn = L.ui.btn('다시 찍기', { color: 'orange', cls: 'big', onClick: () => L.go({ lv: this.lvIdx }) })] });
  }
  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.removeEventListener('pointerdown', this._down);
    for (const r of this.bubbles) r.b.remove();
    for (const p of this.polas) clearTimeout(p.timer);
    for (const d of this.doms) d.remove();
    for (const o of [this.map.group, ...this.chars.map(c => c.root), ...this.extra]) { W.root.remove(o); disposeTree(o); }
    W.camLock = false; W.zoom = 1;
  }

  // ── bots (QA) — they shoot through tapAt, the same path a finger takes.
  // smart: knows each moment's schedule and shoots at the middle of the peak, aimed at the friend. random: anywhere, any time.
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 1.6 && this.L.ui.panelOpen) { this._endT = 0; (this.result === 'win' ? this.nextBtn : this.againBtn)?.press(); } return; }
    if (!this.started) return;
    if (mode === 'random') {
      this._rt = (this._rt ?? rnd(1, 3)) - dt;
      if (this._rt <= 0) { this._rt = rnd(1.5, 5.5); this.tapAt(20 + Math.random() * (innerWidth - 40), 90 + Math.random() * (innerHeight - 250)); }
      return;
    }
    const W = this.L.world, v = new THREE.Vector3();
    for (const m of this.moments) {
      if (!m.busy || m.botN === m.n) continue;
      if (m.t >= m.center - .05 && m.t <= m.T + m.P) { const p = W.toScreen(m.focus(v)); if (this.tapAt(p.x, p.y)) m.botN = m.n; return; }
    }
  }
  state() {
    return { scene: 'photo', lv: this.lvIdx + 1, result: this.result || null, shots: this.shots.length, perfects: this.perfects, stars: this.stars(), film: this.film,
      time: +Math.max(0, this.timeLeft).toFixed(1), news: this.news, album: ALBUM_ORDER.filter(id => this.album[id]).length,
      grades: this.shots.map(s => ({ perfect: 'P', good: 'g', meh: 'm', miss: 'x' })[s.g]).join(''), busy: this.moments?.filter(m => m.busy).map(m => m.id + ':' + m.phase) };
  }
  get api() {
    return {
      // start a moment (if it isn't running) and jump it to time t — for screenshots
      force: (id, t = null) => { const m = this.byId[id]; if (!m) return null; if (!m.busy) m.start(); if (t != null) { m.t = t - 1e-3; m.step(1e-3); } return { phase: m.phase, t: +m.t.toFixed(2) }; },
      peaks: () => { const out = {}; for (const m of this.moments) { this.api.force(m.id, m.center); out[m.id] = m.phase; } return out; },
      aim: id => { const m = this.byId[id]; const p = this.L.world.toScreen(m.focus(new THREE.Vector3())); return [Math.round(p.x), Math.round(p.y)]; },
      shoot: (x, y) => this.tapAt(x, y),
      shootAt: id => { const m = this.byId[id]; const p = this.L.world.toScreen(m.focus(new THREE.Vector3())); return this.tapAt(p.x, p.y); },
      end: () => this.end('time'),
      clearAlbum: () => { this.album = {}; this.saveAlbum(); },
      times: () => Object.fromEntries(this.moments.map(m => [m.id, { phase: m.phase, t: +m.t.toFixed(2), T: m.T, P: m.P }])),
    };
  }
}

const FILM_SVG = '<svg viewBox="0 0 40 40"><rect x="6" y="9" width="28" height="24" rx="5" fill="#ffd23f" stroke="#3a2453" stroke-width="3"/><rect x="11" y="4" width="10" height="7" rx="2" fill="#ff8fb8" stroke="#3a2453" stroke-width="3"/><circle cx="20" cy="21" r="7" fill="#7fd3ff" stroke="#3a2453" stroke-width="3"/><circle cx="17.5" cy="18.5" r="2" fill="#fff"/></svg>';
const CLOCK_SVG = '<svg viewBox="0 0 40 40"><circle cx="20" cy="21" r="14" fill="#fff" stroke="#3a2453" stroke-width="3"/><path d="M20 12v9l6 4" stroke="#3a2453" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>';

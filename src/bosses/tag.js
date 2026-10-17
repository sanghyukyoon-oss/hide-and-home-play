// ③ 다 잡았다! 술래잡기 — real-time tag. You are 술래 몽글이: press anywhere and drag (a floating stick) to run. The friends
// scatter through the house; when you come close they flee along the floor tiles that keep them farthest from you (and
// away from dead ends), they tire after a few seconds of running (sweat, slower: your chance), and while you're far away
// they wander or tuck themselves into a wardrobe, under a blanket or into a box (the furniture wiggles, a giggle gives
// them away; come close and they burst out). Touch one = caught: it joins the conga line behind you. Catch them all
// before the clock runs out.
import * as THREE from 'three';
import { MapRooms, FLOOR_H } from '../map.js';
import { layoutFor, THEMES } from '../stages.js';
import { Char, CHAR_DEFS, defineChar } from '../gfx/chars.js';
import { ICON } from '../ui.js';
import { Tweens, clamp, ease } from '../util.js';
import { walkGrid, crossOK } from '../companion.js';
import { disposeTree } from '../gfx/kit.js';

const SPEED = 2.6;            // 몽글이's run (units / s) — a sprinting friend is a little quicker, a panting one much slower
const CATCH = .56;            // touch distance
const GAP = .66;              // spacing in the conga line
const CLOCK = '<svg viewBox="0 0 40 40"><circle cx="20" cy="22" r="15" fill="#fff" stroke="#3a2453" stroke-width="3.5"/><path d="M20 13v9l6 4" stroke="#ff6f86" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 4h10" stroke="#3a2453" stroke-width="4" stroke-linecap="round"/></svg>';
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const V = new THREE.Vector3(), V2 = new THREE.Vector3();

// personalities: run / walk speed, how long they can sprint (stam s) and how long they pant (rest s, at slow), how much
// they like hiding, how close you get before they notice (sense) or burst out of a hiding place (burst)
const BASE = { run: 3.35, walk: 1.2, stam: 4.4, rest: 1.6, slow: 1.9, hide: .4, sense: 3.6, burst: 2.0, startle: .22, dumb: 0, flee: ['앗!'], taunt: '메롱~', tired: '헥헥…', caught: '잡혔다!', hid: '킥킥' };
const PERS = {
  bunny: { run: 3.5, walk: 1.4, stam: 3.6, rest: 1.7, hide: .3, flee: ['꺄! 술래다!', '깡총!'], taunt: '깡총~ 못 잡지롱', caught: '앗, 잡혔다!' },
  churro: { run: 3.4, stam: 4.5, rest: 1.6, hide: .8, burst: 1.9, flee: ['냥!?'], taunt: '…냥.', tired: '그르릉…', caught: '냐앙…', hid: '…냥' },
  hamster: { run: 2.95, walk: 1.1, stam: 4.0, rest: 1.8, slow: 1.6, hide: .75, dumb: 3, flee: ['찍!?'], taunt: '찍찍~', tired: '볼이 무거워…', caught: '찍… 잡혔다', hid: '오물오물' },
  shiba: { run: 3.6, walk: 1.5, stam: 5.0, rest: 1.4, slow: 2.0, hide: .1, sense: 3.9, flee: ['멍! 놀자!'], taunt: '멍멍! 이쪽이야~', tired: '헥헥헥', caught: '멍… 졌다!' },
  squirrel: { run: 3.55, walk: 1.4, stam: 3.5, rest: 1.6, hide: .45, flee: ['도토리 지켜!'], taunt: '여기여기~', tired: '숨차…', caught: '으앙!' },
  sleepy: { run: 2.8, walk: .9, stam: 3.0, rest: 2.0, slow: 1.4, hide: .9, sense: 3.0, burst: 1.6, startle: .5, dumb: 4, flee: ['으음… 뭐야?'], taunt: '쿨…', tired: 'zzz…', caught: '잡혔…zz', hid: 'zzz' },
  panda: { run: 2.9, walk: 1.0, stam: 4.0, rest: 1.8, slow: 1.5, hide: .85, dumb: 3, flee: ['대나무 먹던 중!'], taunt: '…냠냠', tired: '헉… 헉…', caught: '판다 잡혔다~', hid: '냠냠' },
  frog: { run: 3.4, walk: 1.3, stam: 4.2, hide: .4, flee: ['개굴!'], taunt: '개굴개굴~', tired: '꾸엑…', caught: '개굴…' },
  skater: { run: 3.8, walk: 1.6, stam: 5.5, rest: 1.6, hide: 0, flee: ['부릉~ 못 잡아!'], taunt: '보드 타는 중~', tired: '바퀴가…', caught: '꽈당!' },
  trickster: { run: 3.5, walk: 1.5, stam: 4.5, rest: 1.5, slow: 2.0, hide: .5, sense: 3.9, burst: 2.4, startle: .15, flee: ['히히 메롱!'], taunt: '메~롱!', tired: '헥… 잠깐만!', caught: '치사해!' },
  coolcat: { run: 3.45, stam: 4.5, rest: 1.6, hide: .7, flee: ['훗.'], taunt: '느려~', tired: '…덥다', caught: '…인정.', hid: '훗' },
  dj: { run: 3.3, walk: 1.3, stam: 4.2, hide: .35, flee: ['둠칫둠칫!'], taunt: '♪ 둠칫~', tired: '음악 꺼졌어…', caught: '둠칫…' },
  peng: { run: 3.0, walk: 1.1, stam: 3.8, rest: 1.8, slow: 1.6, hide: .5, dumb: 2, flee: ['뒤뚱뒤뚱!'], taunt: '펭~', tired: '미끄러워…', caught: '펭… 잡혔다' },
  cat: { run: 3.4, stam: 4.2, hide: .7, flee: ['냐앗!'], taunt: '냥냥~', caught: '냐앙~', hid: '냥' },
};
// furniture a friend can get into (every one of them has a door, lid, blanket or cloth that flies open)
const HIDES = { wardrobe: '옷장', bed: '이불', chest: '장난감 상자', boxes: '상자', kotatsu: '코타츠', diningset: '식탁보', laundrybasket: '빨래 바구니',
  sofa: '소파 쿠션', fridge: '냉장고', bigfridge: '냉장고', parcel: '택배 상자' };

// three houses. start / at: [x, z, level]; hide: the friend starts tucked into that piece
const LEVELS = [
  { map: 'bunny2', name: '1판', sub: '토순이네 침실과 놀이방', time: 60, pitch: .8, fit: 6.6, start: [3.4, 1.6, 0], hint: true,
    friends: [{ k: 'bunny', at: [1.2, -1.0] }, { k: 'churro', hide: 'wardrobe' }, { k: 'hamster', at: [-3.6, 1.4] }] },
  { map: 'aptmap', name: '2판', sub: '우리 아파트 투룸', time: 75, pitch: .8, fit: 7.0, start: [-3.0, 2.2, 0],
    friends: [{ k: 'shiba', at: [3.2, 1.6] }, { k: 'squirrel', at: [-5.2, -1.6] }, { k: 'sleepy', hide: 'kotatsu' }, { k: 'panda', hide: 'diningset' }, { k: 'frog', at: [4.0, -1.5] }] },
  { map: 'house2f', name: '3판', sub: '펭펭이네 2층집 · 계단도 있어!', time: 90, pitch: .62, fit: 7.0, start: [1.6, 2.6, 0],
    friends: [{ k: 'peng', at: [-1.0, 1.0] }, { k: 'skater', at: [2.0, -2.4] }, { k: 'trickster', at: [0.4, -2.0, 1] }, { k: 'coolcat', hide: 'bed' }, { k: 'cat', hide: 'fridge' }, { k: 'dj', at: [-1.5, -2.6] }] },
];

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; }
  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world, ui = L.ui;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx];
    document.getElementById('app').dataset.night = '';
    const layout = layoutFor(LV.map), th = THEMES[LV.map] || layout.theme || THEMES.my;
    L.setBg(th.bg || ['#fff6e6', '#ffe9cc']); W.setLight(th.light || null);
    const map = this.map = new MapRooms(W, layout);
    W.root.add(map.group); map.group.updateMatrixWorld(true);
    this.buildNav();
    this.buildSpots();
    // 몽글이, the 술래 (a red headband says so)
    if (!CHAR_DEFS.mong_tag) defineChar('mong_tag', { ...CHAR_DEFS.mong, name: '술래 몽글이', acc: [['hairband', { color: '#ff4f6d', bow: false, side: 0 }]] });
    const me = this.me = new Char('mong_tag'); W.root.add(me.root);
    const t0 = this.tileNear(LV.start[0], LV.start[1], LV.start[2] || 0);
    me.root.position.set(t0.x, t0.y, t0.z); me.root.rotation.y = Math.PI / 4;
    this.mv = { lvl: LV.start[2] || 0, stair: null, vel: 0, dir: [0, 1] };
    this.myRing = this.ringMesh('#ff5d7a', .3, .4, .55); W.root.add(this.myRing);
    this.trail = [{ x: t0.x, y: t0.y, z: t0.z }];
    this.spawnFriends();
    this.pd = new Int16Array(this.tiles.length); this.pdMe = new Int16Array(this.tiles.length); this.computePd();
    this.frame();
    L.makeThumbs({ faces: [...this.friends.flatMap(F => [[F.k, 'normal'], [F.k, 'happy']]), ['mong', 'happy']] });
    this.buildHud();
    this.bindInput();
    this.time = LV.time; this.caughtN = 0; this.trainN = 0; this.combo = 0; this.lastCatch = -9;
    this.hs = 0; this.slow = 0; this.punch = 0; this.shake = 0; this.pdT = 0; this.result = null; this.moved = 0; this.bubbles = 0;
    W.idsDirty = true; W.shadowDirty = true;
    L.audio.music('play');
    await ui.banner(LV.name, LV.sub, 1150);
    if (this.dead) return;
    // from the whole house down to 몽글이
    const p = me.root.position;
    const g0 = this.camGoal(p.x, p.z);
    await W.flyTo(this.tw, { target: new THREE.Vector3(g0.x, p.y + .5, g0.z), zoom: 1, dur: .65 });
    if (this.dead) return;
    this.camT = W.target.clone(); this.camHold = false;
    this.started = true;
    const shout = this.friends.find(F => F.state !== 'hidden');
    if (shout) this.sayCh(shout, '도망쳐~!', 1000, '', true);
    L.audio.sfx('special');
  }

  // ── the floor: walk tiles (with the stairs), the biggest connected stretch only
  buildNav() {
    const all = walkGrid(this.map.rooms, .24), seen = new Set(); let best = [];
    for (const t of all) { if (seen.has(t)) continue; const comp = [], q = [t]; seen.add(t); while (q.length) { const u = q.pop(); comp.push(u); for (const v of u.nb) if (!seen.has(v)) { seen.add(v); q.push(v); } } if (comp.length > best.length) best = comp; }
    const keep = new Set(best);
    for (const t of best) t.nb = t.nb.filter(u => keep.has(u));
    this.tiles = best; best.forEach((t, i) => { t.id = i; t.y = t.y || 0; });
    // how open the floor is around each tile (3 steps): corners and dead ends score low
    this.open = new Float32Array(best.length); let mx = 1;
    for (const t of best) { const d = new Map([[t, 0]]), q = [t]; for (let qi = 0; qi < q.length; qi++) { const u = q[qi], k = d.get(u); if (k >= 3) continue; for (const v of u.nb) if (!d.has(v)) { d.set(v, k + 1); q.push(v); } } this.open[t.id] = q.length; mx = Math.max(mx, q.length); }
    for (let i = 0; i < this.open.length; i++) this.open[i] /= mx;
    this.stamp = new Uint32Array(best.length); this.stampN = 0; this.fdist = new Int16Array(best.length); this._q = new Array(best.length);
    // stairs for the runner (stairsup rises one storey over its 3 tiles, high end at -z)
    this.stairs = [];
    for (const R of this.map.rooms) for (const rec of R.furns) if (rec.type === 'stairsup' && !rec.rot) {
      const c = R.tileToWorld(rec.i, rec.j, 1, 3), o = R.group.position;
      this.stairs.push({ x: o.x + c.x, zTop: o.z + c.z - 1.5, zFoot: o.z + c.z + 1.5, y0: o.y, lvl: R.level });
    }
  }
  tileNear(x, z, lvl = 0, avoid = null) {
    let b = null, bd = 1e9; const y = lvl * FLOOR_H;
    for (const t of this.tiles) { if (avoid?.has(t)) continue; const d = (t.x - x) ** 2 + (t.z - z) ** 2 + ((t.y - y) * 3) ** 2; if (d < bd) { bd = d; b = t; } }
    return b;
  }
  tileOf(p) {
    let b = null, bd = 1e9;
    for (const t of this.tiles) { const d = (t.x - p.x) ** 2 + (t.z - p.z) ** 2 + ((t.y - p.y) * 2) ** 2; if (d < bd) { bd = d; b = t; } }
    return b;
  }
  // steps from 몽글이 to every tile
  computePd() {
    const s = this.tileOf(this.me.root.position); if (!s) return; this.myTile = s;
    const bfs = (pd, src) => { pd.fill(999); const q = []; for (const t of src) if (pd[t.id]) { pd[t.id] = 0; q.push(t); } for (let qi = 0; qi < q.length; qi++) { const u = q[qi], k = pd[u.id] + 1; for (const v of u.nb) if (pd[v.id] > k) { pd[v.id] = k; q.push(v); } } };
    bfs(this.pdMe, [s]);
    const train = this.friends.filter(F => F.state === 'train').map(F => this.tileOf(F.ch.root.position));
    if (train.length) bfs(this.pd, [s, ...train]); else this.pd.set(this.pdMe);
  }
  bfsPath(from, to) {
    if (!from || !to) return null; if (from === to) return [];
    const prev = new Map([[from, null]]), q = [from];
    for (let qi = 0; qi < q.length; qi++) { const t = q[qi]; if (t === to) break; for (const u of t.nb) if (!prev.has(u)) { prev.set(u, t); q.push(u); } }
    if (!prev.has(to)) return null;
    const out = []; for (let t = to; t && t !== from; t = prev.get(t)) out.unshift(t);
    return out;
  }
  buildSpots() {
    this.spots = [];
    for (const R of this.map.rooms) for (const rec of R.furns) {
      const name = HIDES[rec.type]; if (!name || !rec.f.parts.length) continue;
      const b = new THREE.Box3().setFromObject(rec.f.group), c = b.getCenter(new THREE.Vector3()), y = R.level * FLOOR_H;
      let t = null, bd = 1.5;
      for (const u of this.tiles) { if (u.stair || Math.abs(u.y - y) > .1) continue; const d = Math.hypot(u.x - c.x, u.z - c.z); if (d < bd) { bd = d; t = u; } }
      if (!t) continue;
      const y0 = y + (rec.type === 'bed' ? .4 : rec.type === 'sofa' ? .28 : rec.type === 'chest' || rec.type === 'boxes' || rec.type === 'laundrybasket' || rec.type === 'parcel' ? .12 : 0);
      this.spots.push({ type: rec.type, name, rec, parts: rec.f.parts, c, top: b.max.y, y0, t, taken: null });
    }
  }
  ringMesh(color, r0 = .26, r1 = .36, op = .6) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 3; return m;
  }

  // ── the friends
  spawnFriends() {
    const W = this.L.world, LV = this.lv, used = new Set();
    this.friends = LV.friends.map((d, i) => {
      const P = { ...BASE, ...(PERS[d.k] || {}) }, ch = new Char(d.k); W.root.add(ch.root);
      P.run *= .95; P.slow *= .8; P.walk *= .9;   // a sprint outruns you (~1.25×), a pant is half your pace
      const F = { i, k: d.k, P, ch, state: 'idle', t: rnd(.3, 1.2), path: [], stam: 1, tiredT: 0, spot: null, calmT: 0, planT: 0, tellT: rnd(.8, 2.5), wigT: 0, sayT: 0, bub: null, name: CHAR_DEFS[d.k]?.name || d.k };
      F.ring = this.ringMesh('#ffe36b', .28, .4, .7); F.ring.visible = false; W.root.add(F.ring);
      const S = d.hide && this.spots.find(s => s.type === d.hide && !s.taken);
      if (S) { this.putHidden(F, S); return F; }
      let t = d.at ? this.tileNear(d.at[0], d.at[1], d.at[2] || 0, used) : null;
      if (!t) { const me = this.me.root.position; t = this.tiles.filter(u => !used.has(u) && Math.hypot(u.x - me.x, u.z - me.z) > 4).sort(() => Math.random() - .5)[0] || this.tiles[0]; }
      used.add(t);
      ch.root.position.set(t.x, t.y, t.z); ch.faceTo(this.me.root.position.x, this.me.root.position.z);
      return F;
    });
  }
  putHidden(F, S) {
    F.state = 'hidden'; F.spot = S; S.taken = F; F.path = [];
    F.ch.root.visible = false; F.ch.root.position.set(S.c.x, S.y0, S.c.z);
    F.tellT = rnd(.6, 2);
  }
  sayCh(F, text, ms = 1000, cls = '', must = false) {
    if (!must && (this.bubbles >= 2 || F.sayT > 0)) return;
    F.bub?.remove(); F.sayT = ms / 1000 + .6; this.bubbles++;
    const b = F.bub = this.L.say(F.ch, text, ms, cls);
    setTimeout(() => { this.bubbles--; if (F.bub === b) F.bub = null; }, ms);
  }
  // a bubble over a hiding place (the friend inside is out of sight)
  sayAt(x, y, z, text, ms = 900) {
    const L = this.L, b = L.h('div', { class: 'bubble pop think' }, text); L.ui.wui.append(b);
    const P = new THREE.Vector3(x, y, z), upd = () => { const p = L.world.toScreen(P); b.style.left = p.x + 'px'; b.style.top = Math.max(40, p.y) + 'px'; };
    upd(); const iv = setInterval(upd, 30); this.bubbles++;
    setTimeout(() => { clearInterval(iv); b.remove(); this.bubbles--; }, ms);
  }
  speedOf(F) {
    if (F.state === 'flee') return (F.tiredT > 0 ? F.P.slow : F.P.run * (F.panic > 0 ? .62 : 1)) * (F.dodge > 0 ? 1.15 : 1);
    if (F.state === 'walk') return F.P.walk;
    return 0;
  }
  moveAlong(F, speed, dt) {
    const p = F.ch.root.position; let st = speed * dt, moved = false, hx = 0, hz = 0;
    while (st > 1e-5 && F.path.length) {
      const t = F.path[0], dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
      if (d <= st) { p.x = t.x; p.z = t.z; p.y = t.y; F.path.shift(); st -= d; hx += dx; hz += dz; }
      else { const k = st / d; p.x += dx * k; p.z += dz * k; p.y += (t.y - p.y) * k; hx += dx * k; hz += dz * k; st = 0; }
      moved = true;
    }
    if (moved && Math.hypot(hx, hz) > 1e-4) { const a = Math.atan2(hx, hz), r = F.ch.root.rotation.y; F.ch.root.rotation.y = r + Math.atan2(Math.sin(a - r), Math.cos(a - r)) * Math.min(1, dt * 14); }
    return moved;
  }
  stepFriend(F, dt) {
    const L = this.L, P = F.P, ch = F.ch, p = ch.root.position, me = this.me.root.position;
    F.sayT -= dt;
    if (F.state === 'caught') { F.t -= dt; if (F.t <= 0) { F.state = 'train'; F.slot = this.trainN++; ch.setFace('happy'); } return; }
    if (F.state === 'train' || F.state === 'burst' || F.state === 'enter') return;
    if (F.state === 'hidden') {
      const S = F.spot, d = Math.hypot(S.t.x - me.x, S.t.z - me.z), dc = Math.hypot(S.c.x - me.x, S.c.z - me.z);
      if (Math.min(d, dc) < P.burst && Math.abs(S.t.y - me.y) < 1) { this.burst(F); return; }
      // the tell: the door / lid / blanket wiggles, now and then a giggle
      F.tellT -= dt; F.wigT -= dt;
      if (F.tellT <= 0) {
        F.tellT = rnd(2.2, 3.6); F.wigT = .7;
        const far = Math.hypot(S.c.x - me.x, S.c.z - me.z);
        if (far < 9 && this.bubbles < 2) this.sayAt(S.c.x, S.top + .15, S.c.z, P.hid, 900);
        if (far < 6.5) L.audio.sfx('giggle');
      }
      const w = F.wigT > 0 ? .05 + Math.abs(Math.sin(this.t * 22)) * .07 : 0;
      for (const pt of S.parts) pt.setOpen(w);
      return;
    }
    const pdist = this.pd[this.tileOf(p).id] * .5;
    if (F.state === 'startle') { F.t -= dt; ch.lift = 0; if (F.t <= 0) this.startFlee(F); return; }
    if (F.state === 'idle' || F.state === 'walk') {
      F.stam = Math.min(1, F.stam + dt / 3);
      if (pdist < P.sense) { this.notice(F); return; }
      ch.lift = F.state === 'walk' && !CHAR_DEFS[F.k]?.glide ? Math.abs(Math.sin(this.t * 10 + F.i)) * .05 : ch.lift * .8;
      if (F.state === 'walk') {
        if (!this.moveAlong(F, P.walk, dt) || !F.path.length) {
          if (F.toHide) {
            const S = F.toHide; F.toHide = null;
            if (pdist > 2.6 && !S.taken2) { this.enterHide(F, S); return; }
            S.taken = null;
          }
          F.state = 'idle'; F.t = rnd(.4, 1.4); ch.pose = 'idle';
        }
      } else {
        F.t -= dt;
        if (pdist < P.sense + 3 && pdist > P.sense + .6 && Math.random() < dt * .25) { this.sayCh(F, P.taunt, 900); L.audio.sfx('giggle'); ch.faceTo(me.x, me.z); }
        if (F.t <= 0) this.decide(F);
      }
      return;
    }
    if (F.state === 'flee') {
      // stamina: a sprint lasts a few seconds, then it pants (slow, sweating: your chance)
      if (F.tiredT > 0) {
        F.tiredT -= dt;
        if (F.tiredT <= 0) { F.stam = .7; ch.setFace('normal'); }
      } else {
        F.stam -= dt / P.stam;
        if (F.stam <= 0) { F.tiredT = P.rest; ch.setFace('sweat'); this.sayCh(F, P.tired, 900); L.audio.sfx('phew'); }
      }
      F.planT -= dt; F.dodge = (F.dodge || 0) - dt; F.dodgeCd = (F.dodgeCd || 0) - dt; F.panic = (F.panic || 0) - dt;
      if (F.planT <= 0 || !F.path.length) { F.planT = .2; this.planFlee(F); }
      const sp = this.speedOf(F), mv = this.moveAlong(F, sp, dt);
      ch.lift = mv && !CHAR_DEFS[F.k]?.glide ? Math.abs(Math.sin(this.t * (F.tiredT > 0 ? 8 : 15) + F.i)) * (F.tiredT > 0 ? .04 : .08) : ch.lift * .7;
      ch.pose = F.tiredT > 0 ? 'idle' : 'flail';
      if (pdist > P.sense + 2.4) { F.calmT += dt; if (F.calmT > 1.1) { F.state = 'idle'; F.t = rnd(.3, .9); F.path = []; ch.pose = 'idle'; if (F.tiredT <= 0) ch.setFace('normal'); } }
      else F.calmT = 0;
    }
  }
  notice(F) {
    const ch = F.ch, me = this.me.root.position;
    if (F.toHide) { F.toHide.taken = null; F.toHide = null; }
    F.state = 'startle'; F.t = .22; F.path = []; ch.faceTo(me.x, me.z); ch.setFace('wow'); ch.bump(.35);
    this.sayCh(F, pick(F.P.flee), 800); this.L.audio.sfx('gasp');
  }
  startFlee(F) {
    F.state = 'flee'; F.planT = 0; F.calmT = 0; F.path = [];
    if (F.tiredT <= 0) F.ch.setFace('normal');
    this.planFlee(F);
  }
  // where to run: one step to whichever neighbouring tile leaves it the most floor it reaches before you do (its
  // "own" region, counted over safe tiles only), leaning away from you; a dead end is a small region, so it avoids them.
  // Cornered (almost no region left) and you're close: a dodge — a quick dash sideways / past you.
  safeArea(c, d0, ratio, pd) {
    const st = ++this.stampN, S = this.stamp, D = this.fdist, q = this._q; let n = 0, qn = 0;
    S[c.id] = st; D[c.id] = d0; q[qn++] = c;
    for (let qi = 0; qi < qn; qi++) {
      const t = q[qi], d = D[t.id]; n++;
      if (d >= 22) continue;
      for (const u of t.nb) { if (S[u.id] === st) continue; S[u.id] = st; if ((d + 1) * ratio + 1 >= pd[u.id]) continue; D[u.id] = d + 1; q[qn++] = u; }
    }
    return n;
  }
  planFlee(F) {
    const pd = this.pd, P = F.P, f0 = this.tileOf(F.ch.root.position); if (!f0) return;
    const vf = Math.max(.6, this.speedOf(F) || P.run), ratio = SPEED / vf, me = this.me.root.position;
    if (F.dodge > 0 && F.path.length) return;
    const others = this.friends.filter(o => o !== F && (o.state === 'flee' || o.state === 'idle' || o.state === 'walk'));
    let best = null, bs = -1e9, bestA = 0;
    // standing still only counts when every way out is toward you (on a plateau of equal step counts it would freeze)
    const fp = F.ch.root.position, lastDx = F.lastDx || 0, lastDz = F.lastDz || 0;
    const stay = f0.nb.every(c => pd[c.id] < pd[f0.id]);
    for (const c of stay ? [f0, ...f0.nb] : f0.nb) {
      if (c !== f0 && pd[c.id] <= 1) continue;
      const area = this.safeArea(c, c === f0 ? 0 : 1, ratio, pd);
      let s = Math.min(area, 50) + 1.3 * pd[c.id] + .6 * Math.hypot(c.x - me.x, c.z - me.z) + 2 * this.open[c.id] + (Math.random() - .5) * (P.dumb || 0);
      for (const o of others) { const g = o.ch.root.position; if (Math.hypot(g.x - c.x, g.z - c.z) < .45) s -= 1.5; }
      if ((c.x - fp.x) * lastDx + (c.z - fp.z) * lastDz > 0) s += .5;   // keep going the way it was going
      if (s > bs) { bs = s; best = c; bestA = area; }
    }
    if (best && best !== f0) { F.lastDx = best.x - fp.x; F.lastDz = best.z - fp.z; }
    F.cornered = bestA < 6;
    const near = Math.hypot(me.x - fp.x, me.z - fp.z);
    if ((F.cornered ? near < 2.0 : near < 1.25) && (F.dodgeCd || 0) <= 0) {
      // the dodge: 2-3 steps across your line (sideways to the way you're coming), never into your arms
      const ux = (fp.x - me.x) / (near || 1), uz = (fp.z - me.z) / (near || 1);
      const d = new Map([[f0, 0]]), q = [f0], cand = [];
      for (let qi = 0; qi < q.length; qi++) { const u = q[qi], k = d.get(u); if (k >= 2) cand.push(u); if (k >= 3) continue; for (const v of u.nb) if (!d.has(v)) { d.set(v, k + 1); q.push(v); } }
      const side = F.dodgeSide || (Math.random() < .5 ? 1 : -1);
      const ok = cand.filter(u => Math.hypot(u.x - me.x, u.z - me.z) > .85);
      const g = ok.map(u => { const rx = u.x - fp.x, rz = u.z - fp.z, perp = (rx * uz - rz * ux) * side, along = rx * ux + rz * uz;
        return { u, s: Math.abs(perp) * 1.6 + (perp > 0 ? .6 : 0) + along * .8 + this.open[u.id] * 1.5 + pd[u.id] * .3 + Math.random() }; }).sort((a, b) => b.s - a.s)[0]?.u;
      if (g) {
        F.path = this.bfsPath(f0, g) || []; F.dodge = .5; F.dodgeCd = (F.tiredT > 0 ? 2.4 : 1.5) + Math.random() * .6; F.dodgeSide = -side;
        if (Math.random() < .45) this.sayCh(F, pick(['히익!', '어림없지~', '휙!', '놓쳤지롱!']), 600);
        return;
      }
    }
    F.path = best && best !== f0 ? [best] : [];
  }
  // calm: wander a little, or go and hide somewhere far from you
  decide(F) {
    const P = F.P, me = this.me.root.position, f0 = this.tileOf(F.ch.root.position);
    if (Math.random() < P.hide) {
      const free = this.spots.filter(s => !s.taken && this.pd[s.t.id] > 8 && Math.abs(s.t.y - f0.y) < 3.5);
      if (free.length) {
        const S = free.map(s => ({ s, c: Math.hypot(s.t.x - f0.x, s.t.z - f0.z) + Math.random() * 3 })).sort((a, b) => a.c - b.c)[0].s;
        const path = this.bfsPath(f0, S.t);
        if (path) { S.taken = F; F.toHide = S; F.path = path; F.state = 'walk'; return; }
      }
    }
    // wander: a few steps somewhere not toward you
    const cand = [], d = new Map([[f0, 0]]), q = [f0];
    for (let qi = 0; qi < q.length; qi++) { const u = q[qi], k = d.get(u); if (k >= 2) cand.push(u); if (k >= 6) continue; for (const v of u.nb) if (!d.has(v)) { d.set(v, k + 1); q.push(v); } }
    const ok = cand.filter(u => this.pd[u.id] >= this.pd[f0.id] - 1);
    const goal = pick(ok.length ? ok : cand);
    if (goal) { F.path = this.bfsPath(f0, goal) || []; F.state = 'walk'; }
    else { F.t = rnd(.5, 1.2); }
  }
  async enterHide(F, S) {
    const L = this.L, ch = F.ch, p = ch.root.position;
    F.state = 'enter'; F.spot = S; S.taken = F;
    ch.faceTo(S.c.x, S.c.z);
    for (const pt of S.parts) this.tw.run(.16, k => pt.setOpen(k * .8));
    L.audio.sfx('open');
    const y0 = p.y; this.tw.run(.32, k => { p.y = y0 + (S.y0 - y0) * k; });
    await ch.hopTo(this.tw, S.c.x, S.c.z, { height: .5, dur: .32 });
    if (this.dead || F.state !== 'enter') return;
    ch.root.visible = false; F.state = 'hidden'; F.path = []; F.tellT = rnd(1.2, 2.4);
    this.L.world.idsDirty = true;
    for (const pt of S.parts) this.tw.run(.2, k => pt.setOpen(.8 * (1 - k)));
    L.audio.sfx('close');
  }
  async burst(F, quiet = false) {
    const L = this.L, W = L.world, S = F.spot, ch = F.ch, p = ch.root.position;
    F.state = 'burst'; F.spot = null; S.taken = null;
    // the door / lid / blanket flies open
    for (const pt of S.parts) this.tw.run(.14, k => pt.setOpen(k), ease.outBack);
    L.audio.sfx('door'); L.audio.sfx('pop', 6);
    ch.root.visible = true; ch.setFace('wow'); ch.bump(.5); W.idsDirty = true; W.shadowDirty = true;
    p.set(S.c.x, S.y0, S.c.z);
    const s = W.toScreen(V.set(S.c.x, S.top * .7, S.c.z));
    W.fx.burst(s.x, s.y, { n: 12, speed: 220, size: 8, shape: 'circle', colors: ['#ffffff', '#fff1c9', '#ffd6e6'], gravity: 200, life: .5 });
    this.punch = Math.max(this.punch, .5);
    if (!quiet) this.sayCh(F, `${S.name}에서 들켰다!`, 900, '', true);
    // out the side away from you
    const near = [S.t]; for (const u of S.t.nb) { near.push(u); for (const v of u.nb) near.push(v); }
    const out = near.filter(u => Math.abs(u.y - S.t.y) < .1 && Math.hypot(u.x - S.c.x, u.z - S.c.z) < 1.6).sort((u, v) => this.pd[v.id] - this.pd[u.id])[0] || S.t;
    const y0 = p.y; this.tw.run(.4, k => { if (F.state === 'burst') p.y = y0 + (out.y - y0) * k; });
    await ch.hopTo(this.tw, out.x, out.z, { height: .75, dur: .4 });
    this.tw.wait(1.1).then(() => { if (!this.dead) for (const pt of S.parts) this.tw.run(.4, k => pt.setOpen(1 - k)); W.shadowDirty = true; });
    if (this.dead || F.state !== 'burst') return;
    F.state = 'startle'; F.t = F.P.startle; F.panic = 1.1;
  }

  // ── the conga line: every friend you've caught hops along your trail
  trailAt(dist) {
    const tr = this.trail, p = this.me.root.position;
    let px = p.x, py = p.y, pz = p.z, acc = 0;
    for (let i = tr.length - 1; i >= 0; i--) {
      const q = tr[i], d = Math.hypot(q.x - px, q.z - pz);
      if (acc + d >= dist) { const k = (dist - acc) / (d || 1); return V2.set(px + (q.x - px) * k, py + (q.y - py) * k, pz + (q.z - pz) * k); }
      acc += d; px = q.x; py = q.y; pz = q.z;
    }
    return V2.set(px, py, pz);
  }
  stepTrain(dt) {
    for (const F of this.friends) {
      if (F.state !== 'train') continue;
      const ch = F.ch, p = ch.root.position, g = this.trailAt((F.slot + 1) * GAP), k = 1 - Math.exp(-dt * 11);
      const dx = g.x - p.x, dz = g.z - p.z, d = Math.hypot(dx, dz);
      p.x += dx * k; p.z += dz * k; p.y += (g.y - p.y) * k;
      if (d > .03) { const a = Math.atan2(dx, dz), r = ch.root.rotation.y; ch.root.rotation.y = r + Math.atan2(Math.sin(a - r), Math.cos(a - r)) * Math.min(1, dt * 10); }
      const mv = d > .05;
      ch.lift = mv ? Math.abs(Math.sin(this.t * 13 + F.slot * 1.3)) * .09 : ch.lift * .8;
      ch.pose = this.result === 'win' ? 'cheer' : mv ? 'cheer' : 'clap';
    }
  }

  // ── you
  roomAt(x, z, lvl) { return this.map.rooms.find(R => R.level === lvl && Math.abs(x - R.group.position.x) <= R.w / 2 && Math.abs(z - R.group.position.z) <= R.d / 2) || null; }
  canStand(x, z, lvl) {
    const R = this.roomAt(x, z, lvl); if (!R) return false;
    for (const [dx, dz] of [[.18, 0], [-.18, 0], [0, .18], [0, -.18]]) if (!this.roomAt(x + dx, z + dz, lvl)) return false;
    return R.clearAt(x, z, .18, { raised: true });
  }
  canStep(x0, z0, x1, z1, lvl) { if (!this.canStand(x1, z1, lvl)) return false; const A = this.roomAt(x0, z0, lvl), B = this.roomAt(x1, z1, lvl); return !A || !B || crossOK(A, B, (x0 + x1) / 2, (z0 + z1) / 2); }
  floorY(x, z, lvl) { const R = this.roomAt(x, z, lvl); if (!R) return lvl * FLOOR_H; const o = R.group.position; return o.y + (R.heightAt(Math.floor(x - o.x + R.w / 2), Math.floor(z - o.z + R.d / 2)) || 0); }
  movePlayer(dx, dz) {
    const p = this.me.root.position, M = this.mv;
    const stairY = (s, z) => s.y0 + FLOOR_H * clamp((s.zFoot - z) / 3, 0, 1);
    if (M.stair) {
      const s = M.stair; let nx = clamp(p.x + dx, s.x - .26, s.x + .26), nz = p.z + dz;
      if (nz > s.zFoot) { const z2 = Math.max(nz, s.zFoot + .2); if (this.canStand(nx, z2, s.lvl)) { M.stair = null; M.lvl = s.lvl; p.set(nx, this.floorY(nx, z2, s.lvl), z2); return; } nz = s.zFoot; }
      if (nz < s.zTop) { const z2 = Math.min(nz, s.zTop - .2); if (this.canStand(nx, z2, s.lvl + 1)) { M.stair = null; M.lvl = s.lvl + 1; p.set(nx, this.floorY(nx, z2, s.lvl + 1), z2); return; } nz = s.zTop; }
      p.x = nx; p.z = nz; p.y = stairY(s, nz); return;
    }
    for (const s of this.stairs) {
      const inX = Math.abs(p.x + dx - s.x) <= .34;
      if (inX && M.lvl === s.lvl && dz < 0 && -dz > .4 * Math.abs(dx) && p.z >= s.zFoot - .05 && p.z + dz < s.zFoot + .3) { M.stair = s; p.x = clamp(p.x + dx, s.x - .26, s.x + .26); p.z = Math.min(p.z + dz, s.zFoot - .02); p.y = stairY(s, p.z); return; }
      if (M.lvl === s.lvl && Math.abs(p.x - s.x) > .26 && (p.x - s.x) * dx < 0 && Math.abs(p.x + dx - s.x) < .95 && p.z + dz > s.zFoot - .8 && p.z + dz < s.zFoot + .3 && !this.canStep(p.x, p.z, p.x + dx, p.z + dz, M.lvl)) {
        M.stair = s; p.x = clamp(p.x + dx, s.x - .26, s.x + .26); p.z = Math.min(p.z + dz, s.zFoot - .02); p.y = stairY(s, p.z); return;
      }
      if (inX && M.lvl === s.lvl + 1 && dz > 0 && dz > .4 * Math.abs(dx) && p.z <= s.zTop + .05 && p.z + dz > s.zTop - .3) { M.stair = s; p.x = clamp(p.x + dx, s.x - .26, s.x + .26); p.z = Math.max(p.z + dz, s.zTop + .02); p.y = stairY(s, p.z); return; }
    }
    if (this.canStep(p.x, p.z, p.x + dx, p.z + dz, M.lvl)) { p.x += dx; p.z += dz; }
    else if (this.canStep(p.x, p.z, p.x + dx, p.z, M.lvl)) p.x += dx;
    else if (this.canStep(p.x, p.z, p.x, p.z + dz, M.lvl)) p.z += dz;
    p.y += (this.floorY(p.x, p.z, M.lvl) - p.y) * .5;
  }
  // the stick is in screen space: turn it into a direction on the floor (so "up the screen" runs up the screen)
  stickToWorld(sx, sy) {
    const W = this.L.world, p = this.me.root.position, s0 = W.toScreen(V.copy(p));
    const a = W.screenToGround(s0.x, s0.y, p.y), b = W.screenToGround(s0.x + sx * 60, s0.y + sy * 60, p.y);
    if (!a || !b) return null;
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
    return d > 1e-6 ? [dx / d, dz / d] : null;
  }
  worldToStick(dx, dz) {
    const W = this.L.world, p = this.me.root.position, s0 = W.toScreen(V.copy(p)), s1 = W.toScreen(V.set(p.x + dx, p.y, p.z + dz));
    const x = s1.x - s0.x, y = s1.y - s0.y, d = Math.hypot(x, y);
    return d > 1e-6 ? { x: x / d, y: y / d, v: 1 } : null;
  }
  readInput() {
    if (this.L.bot) return this.botStick || null;
    if (this.joy) {
      const j = this.joy, dx = j.x - j.x0, dy = j.y - j.y0, d = Math.hypot(dx, dy), R = 44;
      if (d < 7) return null;
      return { x: dx / d, y: dy / d, v: clamp((d - 7) / (R - 7), .35, 1) };
    }
    const K = this.L.world.keys;
    const kx = (K.has('ArrowRight') || K.has('KeyD') ? 1 : 0) - (K.has('ArrowLeft') || K.has('KeyA') ? 1 : 0);
    const ky = (K.has('ArrowDown') || K.has('KeyS') ? 1 : 0) - (K.has('ArrowUp') || K.has('KeyW') ? 1 : 0);
    if (kx || ky) { const d = Math.hypot(kx, ky); return { x: kx / d, y: ky / d, v: 1 }; }
    return null;
  }
  stepPlayer(dt) {
    const L = this.L, W = L.world, me = this.me, p = me.root.position, M = this.mv;
    const inp = this.readInput(), dir = inp ? this.stickToWorld(inp.x, inp.y) : null, want = dir ? inp.v : 0;
    M.vel += (want - M.vel) * (1 - Math.exp(-dt * (want > M.vel ? 14 : 18)));
    if (M.vel < .02 && !want) M.vel = 0;
    if (dir) M.dir = dir;
    if (M.vel > 0) {
      const sp = SPEED * M.vel * dt;
      this.movePlayer(M.dir[0] * sp, M.dir[1] * sp);
      const a = Math.atan2(M.dir[0], M.dir[1]), r = me.root.rotation.y; me.root.rotation.y = r + Math.atan2(Math.sin(a - r), Math.cos(a - r)) * Math.min(1, dt * 16);
      this.moved += sp;
      // little puffs of dust behind a sprint
      if (M.vel > .7 && (this._dust = (this._dust || 0) - dt) <= 0) {
        this._dust = .11; const s = W.toScreen(V.set(p.x - M.dir[0] * .2, p.y + .05, p.z - M.dir[1] * .2));
        W.fx.burst(s.x, s.y, { n: 2, speed: 40, size: 7, shape: 'circle', colors: ['#ffffff', '#f4e6d4'], gravity: -60, life: .35 });
      }
    }
    me.lift = M.vel > .1 ? Math.abs(Math.sin(this.t * 15)) * .09 * M.vel : me.lift * .8;
    me.pose = M.vel > .55 ? 'flail' : 'idle';
    const last = this.trail[this.trail.length - 1];
    if (Math.hypot(p.x - last.x, p.z - last.z) + Math.abs(p.y - last.y) > .07) { this.trail.push({ x: p.x, y: p.y, z: p.z }); if (this.trail.length > 700) this.trail.splice(0, 100); }
  }

  // ── catching
  checkCatch() {
    const me = this.me.root.position, train = this.friends.filter(F => F.state === 'train').map(F => F.ch.root.position);
    for (const F of this.friends) {
      if (!['idle', 'walk', 'flee', 'startle', 'enter'].includes(F.state)) continue;
      const p = F.ch.root.position;
      if (Math.hypot(p.x - me.x, p.z - me.z) < CATCH && Math.abs(p.y - me.y) < .8) { this.catchF(F); continue; }
      const by = train.find(q => Math.hypot(p.x - q.x, p.z - q.z) < CATCH * .9 && Math.abs(p.y - q.y) < .8);
      if (by) this.catchF(F, this.friends.find(o => o.ch.root.position === by));
    }
  }
  catchF(F, by = null) {
    const L = this.L, W = L.world, ch = F.ch, p = ch.root.position;
    if (F.spot) { F.spot.taken = null; F.spot = null; }
    if (F.toHide) { F.toHide.taken = null; F.toHide = null; }
    F._was = F.panic > 0 && F.state === 'flee' ? 'panic' : F.cornered && F.state === 'flee' ? 'corner' : F.state; F._wasTired = F.tiredT > 0;
    F.state = 'caught'; F.t = .8; F.path = []; F.tiredT = 0;
    ch.root.visible = true; ch.setFace('dizzy'); ch.bump(.6); ch.pose = 'idle'; ch.lift = 0; W.idsDirty = true;
    this.caughtN++;
    const combo = this.t - this.lastCatch < 3.5 ? ++this.combo : (this.combo = 1); this.lastCatch = this.t;
    this.hs = .12; this.punch = 1; this.shake = .22;
    const s = W.toScreen(V.copy(p).setY(p.y + ch.headTop() * .6));
    W.fx.burst(s.x, s.y, { n: 20, speed: 320, size: 12, shape: 'star' });
    W.fx.ring(s.x, s.y, { r: 80, color: '#ffe36b', width: 9, life: .45 });
    L.audio.sfx('found'); L.audio.sfx('pop', 3 + this.caughtN);
    this.sayCh(F, F.P.caught, 1100, 'red', true);
    if (combo >= 2) { L.ui.floatText(s.x, s.y - 80, combo === 2 ? '더블!' : combo === 3 ? '트리플!' : `${combo}연속!`, 'gold big'); L.audio.sfx('special'); }
    // caught by someone in your line: the first time it happens it says so (that's how you learn the line catches too)
    if (by) {
      by.ch.bump(.4); by.ch.setFace('happy');
      if (!this.trainCaught) { this.trainCaught = true; this.sayCh(by, '내가 잡았다!', 1100, '', true); L.ui.floatText(s.x, s.y - 40, '기차도 잡을 수 있어!', 'green'); L.audio.sfx('unlock'); }
      else if (combo < 2) L.ui.floatText(s.x, s.y - 60, '기차 잡기!', 'gold');
    }
    const slot = this.slots[F.i], img = L.thumbs[`face_${F.k}_happy`];
    L.ui.flyImg(img, s.x, s.y, slot, { size: 56, dur: 560 }).then(() => { if (this.dead) return; slot.classList.add('got'); slot.querySelector('img').src = img; L.audio.sfx('coin', this.caughtN); });
    L.log({ catch: F.k, lv: this.lvIdx + 1, at: +(this.lv.time - this.time).toFixed(1), was: F._was + (by ? '/train' : ''), tired: F._wasTired });
    if (this.caughtN >= this.friends.length) this.allCaught();
  }
  allCaught() {
    if (this.result) return;
    const L = this.L, W = L.world, LV = this.lv; this.result = 'win';
    const left = Math.max(0, this.time), stars = left >= LV.time * .4 ? 3 : left >= LV.time * .18 ? 2 : 1;
    this.stars = stars; this.slow = .7;
    L.log({ result: 'win', lv: this.lvIdx + 1, left: +left.toFixed(1), stars });
    setTimeout(() => {
      if (this.dead) return;
      L.audio.sfx('win'); W.fx.confetti(120); this.me.setFace('happy'); this.me.pose = 'cheer';
      this.sayCh({ ch: this.me, sayT: 0 }, '다 잡았다!', 1500, '', true);
    }, 350);
    setTimeout(() => {
      if (this.dead) return;
      const h = L.h, last = this.lvIdx >= LEVELS.length - 1;
      L.ui.panel({ title: '다 잡았다!', color: 'green', body: [
        h('div', { class: 'tg-stars', html: [0, 1, 2].map(i => i < stars ? ICON.star.replace('<svg', '<svg class="on"') : ICON.starGray).join('') }),
        h('div', { class: 'tg-endfaces' }, ...this.friends.map(F => h('div', { class: 'tg-face got' }, h('img', { src: L.thumbs[`face_${F.k}_happy`] })))),
        h('div', { class: 'txt' }, `${Math.ceil(left)}초 남기고 ${this.friends.length}명 다 잡았어!`)],
        buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
          this.nextBtn = L.ui.btn(last ? '처음 판부터' : '다음 판', { color: 'green', cls: 'big', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) })] });
    }, 1700);
  }
  timeUp() {
    if (this.result) return;
    const L = this.L; this.result = 'fail'; this.time = 0;
    L.audio.sfx('lose');
    const free = this.friends.filter(F => F.state !== 'train' && F.state !== 'caught');
    free.forEach((F, k) => {
      if (F.state === 'hidden') this.burst(F, true);
      F.ch.setFace('happy'); F.ch.pose = 'cheer'; F.path = [];
      if (k < 2) setTimeout(() => !this.dead && this.sayCh(F, k ? '메~롱!' : '못 잡았지롱~', 1400, '', true), 200 + k * 350);
    });
    this.me.setFace('sad');
    L.log({ result: 'fail', lv: this.lvIdx + 1, caught: this.caughtN });
    setTimeout(() => {
      if (this.dead) return;
      const h = L.h;
      L.ui.panel({ title: '시간 끝!', color: 'red', body: [
        h('div', { class: 'tg-endfaces' }, ...this.friends.map(F => { const got = F.state === 'train' || F.state === 'caught'; return h('div', { class: 'tg-face' + (got ? ' got' : '') }, h('img', { src: L.thumbs[`face_${F.k}_${got ? 'happy' : 'normal'}`] })); })),
        h('div', { class: 'txt' }, `${this.friends.length}명 중 ${this.caughtN}명 잡았어!`), h('div', { class: 'tg-tip' }, '땀 흘리는 친구는 느려져')],
        buttons: [this.againBtn = L.ui.btn('다시 하기', { color: 'orange', cls: 'big', onClick: () => L.go({ lv: this.lvIdx }) })] });
    }, 1500);
  }

  // ── per frame
  update(dt) {
    const L = this.L, W = L.world, me = this.me;
    let g = dt;
    if (this.hs > 0) { this.hs -= dt; g = dt * .05; }          // hit-stop on a catch
    else if (this.slow > 0) { this.slow -= dt; g = dt * .3; }  // the last catch in slow motion
    this.t += g; this.tw.update(g);
    this.map.update(dt); me.update(g);
    for (const F of this.friends) F.ch.update(g);
    if (this.started && !this.result) {
      const n = Math.max(1, Math.ceil(g / .034));
      for (let i = 0; i < n && !this.result; i++) this.step(g / n);
    } else if (this.started) {
      const n = Math.max(1, Math.ceil(g / .034)); for (let i = 0; i < n; i++) this.stepTrain(g / n);
    }
    // rings: yours, and a pulsing one under anyone you can catch right now (panting, startled, cornered)
    const p = me.root.position;
    this.myRing.position.set(p.x, p.y + .035, p.z);
    for (const F of this.friends) {
      const on = (F.state === 'flee' && (F.tiredT > 0 || F.cornered || F.panic > 0)) || F.state === 'startle';
      F.ring.visible = on && F.ch.root.visible;
      if (on) { const q = F.ch.root.position; F.ring.position.set(q.x, q.y + .035, q.z); F.ring.scale.setScalar(1 + Math.sin(this.t * 14) * .12); }
      this.slots[F.i]?.classList.toggle('tired', F.state === 'flee' && F.tiredT > 0);
    }
    this.camera(dt);
    this.hud();
  }
  step(dt) {
    this.stepPlayer(dt);
    this.pdT -= dt; if (this.pdT <= 0) { this.pdT = .12; this.computePd(); }
    for (const F of this.friends) this.stepFriend(F, dt);
    this.stepTrain(dt);
    this.checkCatch();
    if (this.result) return;
    this.time -= dt;
    if (this.time <= 0) this.timeUp();
  }
  frame() {
    const W = this.L.world, LV = this.lv, m = this.map, c = m.center;
    W.yaw = Math.PI / 4; W.pitch = LV.pitch; W.bounds = 99; W.slack = null; W.camLock = true; W.minZoom = .3; W.maxZoom = 3;
    W.home.set(c.x, .6, c.z);
    W.setFit(LV.fit, LV.fit * .62, .5);
    // the opening look: the whole house
    const span = (m.w + m.d) / Math.SQRT2;
    W.target.set(c.x, (m.levels.length > 1 ? 1.6 : .4), c.z); W.zoom = clamp(LV.fit / (span + .6), .35, 1);
    this.camHold = true; this.lead = new THREE.Vector3();
  }
  // where the camera looks: right under you across the screen, only partly toward you up / down the screen (a portrait
  // phone has room to spare up and down, so more of the house stays in view)
  camGoal(x, z) {
    const c = this.map.center, ox = x - c.x, oz = z - c.z, fk = .45;
    let r = ox * .7071 - oz * .7071; const f = -ox * .7071 - oz * .7071;   // screen-right / screen-up parts (yaw π/4)
    // sideways: follow you, but not so far that the screen fills up with the ground outside the house
    const W = this.L.world, half = (this.map.w + this.map.d) / (2 * Math.SQRT2), view = W.viewH * (W.W / W.H) / 2, lim = Math.max(0, half - view + .9);
    r = clamp(r, -lim, lim);
    return { x: c.x + r * .7071 - f * fk * .7071, z: c.z - r * .7071 - f * fk * .7071 };
  }
  camera(dt) {
    const W = this.L.world, p = this.me.root.position, M = this.mv;
    if (this.camHold || !this.camT) return;
    const k = 1 - Math.exp(-dt * 5);
    this.lead.x += (M.dir[0] * M.vel * .7 - this.lead.x) * (1 - Math.exp(-dt * 3)); this.lead.z += (M.dir[1] * M.vel * .7 - this.lead.z) * (1 - Math.exp(-dt * 3));
    const g = this.camGoal(p.x + this.lead.x, p.z + this.lead.z);
    this.camT.x += (g.x - this.camT.x) * k; this.camT.y += (p.y + .5 - this.camT.y) * k; this.camT.z += (g.z - this.camT.z) * k;
    this.shake = Math.max(0, this.shake - dt); this.punch = Math.max(0, this.punch - dt * 3.2);
    const sh = this.shake > 0 ? this.shake * .35 : 0;
    W.target.set(this.camT.x + (Math.random() - .5) * sh, this.camT.y, this.camT.z + (Math.random() - .5) * sh);
    W.zoom = 1 + Math.sin(Math.min(1, this.punch) * Math.PI / 2) * .1 + (this.result === 'win' ? .15 : 0);
  }

  // ── HUD: home, the clock, who's still out there
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col();
    const top = h('div', { class: 'topbar tg-top' });
    this.timerEl = h('div', { class: 'tg-timer' }, h('span', { html: CLOCK, style: 'display:flex' }), this.tnum = h('b', { class: 'ol' }, String(this.lv.time)), h('div', { class: 'tg-tbar' }, this.tbar = h('i', { style: 'width:100%' })));
    top.append(L.homeBtn(), this.timerEl, h('div', { class: 'tg-lv ol' }, this.lv.name));
    col.append(top);
    this.slots = this.friends.map(F => h('div', { class: 'tg-face' }, h('img', { src: L.thumbs[`face_${F.k}_normal`] })));
    col.append(h('div', { class: 'tg-faces' }, ...this.slots));
    if (this.lv.hint) col.append(this.hint = h('div', { class: 'tg-hint ol' }, h('span', { class: 'tg-hand' }), h('span', {}, '누른 채로 끌면 달려요')));
    this.joyEl = h('div', { class: 'tg-joy' }, this.knob = h('i'));
    document.getElementById('app').append(this.joyEl);
  }
  hud() {
    const n = Math.max(0, Math.ceil(this.time));
    if (this._tn !== n) {
      this._tn = n; this.tnum.textContent = String(n);
      if (n <= 10 && n > 0 && this.started && !this.result) { this.L.audio.sfx('tick'); if (!this._tense) { this._tense = true; this.L.audio.music('tense'); } }
    }
    this.tbar.style.width = clamp(this.time / this.lv.time * 100, 0, 100) + '%';
    this.timerEl.classList.toggle('danger', this.started && !this.result && this.time <= 10);
    if (this.hint && this.moved > 2.5 && !this.hint.classList.contains('gone')) this.hint.classList.add('gone');
    // the floating stick
    const j = this.joy;
    if (j && !this.L.bot) {
      this.joyEl.classList.add('on'); this.joyEl.style.left = j.x0 + 'px'; this.joyEl.style.top = j.y0 + 'px';
      const dx = j.x - j.x0, dy = j.y - j.y0, d = Math.hypot(dx, dy), m = Math.min(d, 34) / (d || 1);
      this.knob.style.transform = `translate(${dx * m}px, ${dy * m}px)`;
    } else this.joyEl.classList.remove('on');
  }

  // ── input: one finger anywhere = a floating stick (where it first touched is the middle); arrows / WASD too
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => {
      if (this.result || this.joy || this.L.ui.panelOpen) return;
      if (e.pointerType === 'mouse' && e.button > 0) return;
      this.joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
    };
    this._move = e => {
      const j = this.joy; if (!j || e.pointerId !== j.id) return;
      j.x = e.clientX; j.y = e.clientY;
      // drag far and the middle follows the finger (no dead stick when you swing round)
      const dx = j.x - j.x0, dy = j.y - j.y0, d = Math.hypot(dx, dy), R = 56;
      if (d > R) { j.x0 = j.x - dx / d * R; j.y0 = j.y - dy / d * R; }
    };
    this._up = e => { if (this.joy && (e.pointerId === this.joy.id || e.type === 'blur')) this.joy = null; };
    app.addEventListener('pointerdown', this._down); addEventListener('pointermove', this._move);
    addEventListener('pointerup', this._up); addEventListener('pointercancel', this._up); addEventListener('blur', this._up);
  }
  exit() {
    this.dead = true; const L = this.L, W = L.world;
    const app = document.getElementById('app');
    app.removeEventListener('pointerdown', this._down); removeEventListener('pointermove', this._move);
    removeEventListener('pointerup', this._up); removeEventListener('pointercancel', this._up); removeEventListener('blur', this._up);
    for (const o of [this.map.group, this.me.root, this.myRing, ...this.friends.flatMap(F => [F.ch.root, F.ring])]) { W.root.remove(o); disposeTree(o); }
    this.joyEl?.remove(); W.camLock = false; L.audio.stopMusic?.(); this.tw.clear?.();
  }

  // ── bots (QA) — they drive the same stick a finger does. smart: goes for whoever is easiest to catch right now
  // (panting > hiding > close), and heads a runner off at the tile it is running to. random: wiggles the stick.
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 1.8 && this.L.ui.panelOpen) { this._endT = 0; (this.result === 'win' ? this.nextBtn : this.againBtn)?.press(); } return; }
    if (!this.started) { this.botStick = null; return; }
    if (mode === 'random') {
      this._rt = (this._rt || 0) - dt;
      if (this._rt <= 0) { this._rt = rnd(.25, 1.0); const a = Math.random() * Math.PI * 2; this.botStick = Math.random() < .85 ? { x: Math.cos(a), y: Math.sin(a), v: 1 } : null; }
      return;
    }
    // a thumb, not a machine: it looks again every ~0.3 s (so it reacts a beat late to a dodge) and steers a little loosely
    const me = this.me.root.position, my = this.tileOf(me), pd = this.pdMe;
    this._bt = (this._bt || 0) - dt;
    if (this._bt <= 0 || !this.bPath) {
      this._bt = .28 + Math.random() * .08; this._wob = (Math.random() - .5) * .35;
      let best = null, bc = 1e9;
      for (const F of this.friends) {
        if (F.state === 'caught' || F.state === 'train') continue;
        const tt = F.state === 'hidden' ? F.spot.t : this.tileOf(F.ch.root.position), d = pd[tt.id];
        let c = d * (F.state === 'hidden' ? .8 : (F.state === 'flee' && (F.tiredT > 0 || F.panic > 0)) || F.state === 'startle' ? .5 : F.state === 'flee' ? 1.25 : 1);
        if (F === this.bTarget) c *= .75;
        if (c < bc) { bc = c; best = F; }
      }
      this.bTarget = best;
      if (best) {
        let goal;
        if (best.state === 'hidden') goal = best.spot.t;
        else {
          const ft = this.tileOf(best.ch.root.position), d = pd[ft.id];
          // a runner: aim a little ahead of it, along the way it is going
          goal = best.state === 'flee' && best.path.length && d > 3 ? best.path[best.path.length - 1] : ft;
        }
        this.bPath = this.bfsPath(my, goal) || [];
        this.bSeen = best.ch.root.position.clone();
      } else this.bPath = [];
    }
    let tx, tz;
    const T = this.bTarget, tp = this.bSeen;
    if (T && T.state !== 'hidden' && tp && Math.hypot(tp.x - me.x, tp.z - me.z) < 1.2 && Math.abs(tp.y - me.y) < .6) { tx = tp.x; tz = tp.z; }
    else {
      while (this.bPath.length && Math.hypot(this.bPath[0].x - me.x, this.bPath[0].z - me.z) < .22) this.bPath.shift();
      const n = this.bPath[0]; if (!n) { this.botStick = null; return; }
      tx = n.x; tz = n.z;
    }
    let dx = tx - me.x, dz = tz - me.z; const w = this._wob || 0, c = Math.cos(w), sn = Math.sin(w);
    [dx, dz] = [dx * c - dz * sn, dx * sn + dz * c];
    this.botStick = Math.hypot(dx, dz) > .05 ? this.worldToStick(dx, dz) : null;
  }
  state() { return { scene: 'tag', lv: this.lvIdx + 1, result: this.result || null, caught: this.caughtN || 0, total: this.friends?.length || 0, time: +(this.time ?? 0).toFixed(1) }; }
  get api() {
    return {
      win: () => { for (const F of this.friends) if (F.state !== 'train' && F.state !== 'caught') this.catchF(F); },
      fail: () => { this.time = .01; },
      catchOne: () => { const F = this.friends.find(F => F.state !== 'train' && F.state !== 'caught'); if (F) { const me = this.me.root.position; F.ch.root.visible = true; F.ch.root.position.set(me.x + .3, me.y, me.z + .2); this.catchF(F); } },
      tp: (x, z, lvl = 0) => { const t = this.tileNear(x, z, lvl); this.me.root.position.set(t.x, t.y, t.z); this.mv.lvl = lvl; this.mv.stair = null; },
      friends: () => this.friends.map(F => ({ k: F.k, s: F.state, tired: F.tiredT > 0, p: F.ch.root.position.toArray().map(v => +v.toFixed(2)) })),
      info: () => ({ tiles: this.tiles.length, spots: this.spots.map(s => s.type), stairs: this.stairs.length, me: this.me.root.position.toArray().map(v => +v.toFixed(2)), lvl: this.mv.lvl }),
    };
  }
}

// QA helper: n attempts of a level with a bot, each back to back
window.__tagRes = [];
window.__tagTrial = async (lv, mode, n, maxGame = 140) => {
  const L = window.L, res = [];
  for (let k = 0; k < n; k++) {
    L.bot = false; await L.go({ lv }); await new Promise(r => setTimeout(r, 300));
    L.botMode = mode; L.bot = true;
    const S = L.scene, t0 = L.gameTime;
    while (!S.result && L.gameTime - t0 < maxGame) await new Promise(r => setTimeout(r, 100));
    L.bot = false;
    const st = S.state();
    res.push({ r: S.result || 'timeout', left: st.time, caught: st.caught + '/' + st.total });
    window.__tagRes.push(`L${lv + 1} ${mode} ${S.result || 'timeout'} left ${st.time} ${st.caught}/${st.total}`);
  }
  return res;
};

// 🎒 소풍 보물찾기 — a 40-second break between stages. School picnic: 선생님 hid folded 보물 쪽지 around the park.
// "보물찾기 시작~!" (whistle). Tap a hiding place: 몽글이 hops over and searches it (the rock rolls aside, the bush
// splits, the birdhouse roof lifts…). Nothing there? the nearest friend shouts how close you are — 꽁꽁 / 추워 / 따뜻해 /
// 뜨거워!! — and a coloured ring stays on that place (live: it cools off when somebody takes the slip). Triangulate.
// Spice: 너굴이 hunts too (you can see where he's heading; if he gets there first he waves it, "내 거지롱~"); the slip
// unfolds with a prize line (아이스크림 쿠폰, 꽝!, a rare 황금 쪽지 +3); three finds in a row = 보물 레이더 (every place
// shows its heat for a few seconds); later the wind blows a slip to a new place (watch where it lands) and 멍뭉이 sniffs
// one out and digs it up when you're near. Spamming taps makes 몽글이 dizzy. At "모여~!" everyone gathers on the mat
// with their slips for a class photo, then the prize count.
import * as THREE from 'three';
import { Room } from '../room.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { buildItem } from '../gfx/items.js';
import { walkGrid, gridPath, nearestTile } from '../companion.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree, rbox, sph, put, canvasTex } from '../gfx/kit.js';
import { tr } from '../i18n.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const SUNNY = { ambColor: '#fff2e4', amb: 1.55, sunColor: '#fff6e8', sun: 2.4 };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));

// the park: 13 hiding places with something that really opens, kept off the far left/right corners (off screen on a
// phone); the picnic mat (and 선생님) just past the front corner, where the class starts and gathers again
const LAYOUT = [F('tree', 0, 0), F('bush', 2, 0), F('pine', 4, 0), F('tree', 5, 1),
  F('rock', 0, 2), F('log', 2, 2), F('mushrooms', 6, 2), F('rock', 4, 3),
  F('bush', 1, 4), F('campchair', 3, 4), F('bush', 6, 4), F('picnic', 2, 5), F('cooler', 4, 5)];
const PLACE = { tree: '나무', bush: '덤불', pine: '소나무', rock: '바위', log: '통나무', mushrooms: '버섯', campchair: '의자', picnic: '바구니', cooler: '아이스박스' };
const MAT_C = new THREE.Vector3(3.75, 0, 3.3);   // the picnic mat's centre, past the front corner
// a place on the mat in screen terms: sx right, sd toward the camera
const onMat = (sx, sd) => [MAT_C.x + (sx + sd) * .707, MAT_C.z + (sd - sx) * .707];

// hot / cold: distance (world units, the places stand ~1.4–2.2 apart) from a searched place to the nearest slip
const HEAT = [
  { k: 'hot', max: 2.3, chip: '뜨거!', color: '#ff4b3e', sfx: 'gasp', face: 'wow', lines: ['뜨거워!!', '앗 뜨거!', '완전 뜨거워!'] },
  { k: 'warm', max: 3.5, chip: '따뜻', color: '#ffa53a', sfx: 'hmm', face: 'happy', lines: ['따뜻해~', '오~ 따뜻해!', '조금 따뜻~'] },
  { k: 'cold', max: 4.8, chip: '추워', color: '#55a8ff', sfx: 'wobble', face: 'sweat', lines: ['추워~', '쌀쌀해~', '으~ 추워'] },
  { k: 'ice', max: 99, chip: '꽁꽁', color: '#8fdcff', sfx: 'miss', face: 'sweat', lines: ['꽁꽁 얼겠다!', '북극이야~', '완전 추워!'] },
];
const heatAt = d => HEAT.find(h => d <= h.max);
const PRIZES = [
  { t: '아이스크림 쿠폰!', i: 'icecream' }, { t: '사탕 한 봉지!', i: 'candy' }, { t: '새 연필 세트', i: 'pencil' },
  { t: '칭찬 도장 꾹!', i: 'star' }, { t: '김밥 한 줄 더!', i: 'gimbap2' }, { t: '선생님이랑 사진 찍기', f: 'face_nerd_happy' },
  { t: '숙제 하루 면제?!', i: 'heart' }, { t: '꽝! 다음 기회에~', kk: true }, { t: '과자 한 봉지!', i: 'snack' },
];
const GOLD = { t: '황금 쪽지!', i: 'crown', gold: true };
const RIVAL_GOT = ['내 거지롱~', '헤헤 찾았다~', '메롱~ 내 거!', '또 내 거~'];
const MARK_LIFE = 15;   // a heat ring stays this long (live colour), then fades

// three variants (one is picked each time the break comes round): a quicker 너굴이, then the wind, then 멍뭉이
//   pool: slips the teacher hid (two are out at a time; the round ends early when all are found) · stars: points
const LEVELS = [
  { name: '공원 보물찾기', time: 40, pool: 12, active: 2, rival: { speed: 1.5, think: [.8, 1.2], search: 1.1, noise: 3.0 }, wind: null, dog: false, stars: [5, 8, 11] },
  { name: '바람 부는 날', time: 40, pool: 12, active: 2, rival: { speed: 1.6, think: [.7, 1.05], search: 1.05, noise: 2.8 }, wind: [7.5, 10], dog: false, stars: [5, 8, 11], card: 'wind' },
  { name: '멍뭉이랑 소풍', time: 40, pool: 13, active: 2, rival: { speed: 1.65, think: [.7, 1.0], search: 1.0, noise: 2.7 }, wind: [11, 14], dog: true, stars: [5, 9, 12], card: 'dog' },
];
const ME = { speed: 4.0, search: .5 };

// a 보물 쪽지: a note folded in half, standing like a little tent, with a sticker
const PAPERS = ['#fffaf0', '#ffe3ee', '#fff3c4', '#dff5ff', '#e6f9dc'];
function slipMesh(golden, k = Math.floor(Math.random() * PAPERS.length)) {
  const paper = golden ? '#ffd23f' : PAPERS[k % PAPERS.length], g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  for (const s of [-1, 1]) inner.add(put(rbox(.26, .016, .17, paper, .006), 0, .07, s * .05, -s * .62, 0, 0));
  inner.add(put(sph(.034, golden ? '#ff9f1c' : '#ff6f91', null, 12, 9), 0, .1, .086, .6, 0, 0, [1, 1, .4]));
  inner.scale.setScalar(1.25);
  g.userData.og = g;
  return g;
}
const ginghamTex = () => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(80, 170, 255, .42)'; for (let i = 0; i < 8; i++) { c.fillRect(i * 32, 0, 16, h); c.fillRect(0, i * 32, w, 16); }
});

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.ready = false; }
  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx];
    this.addCss();
    const app = document.getElementById('app'); app.dataset.night = ''; app.classList.add('tr');
    L.setBg(['#eef9ff', '#dff3d6']); W.setLight(SUNNY);
    const room = this.room = new Room(W, { w: 7, d: 6, theme: THEMES.park3 || THEMES.park1, bleed: {}, walls: { N: 'hedge', W: 'fence', S: 'none', E: 'none' }, furniture: LAYOUT });
    W.root.add(room.group); room.group.updateMatrixWorld(true);
    this.fx = new THREE.Group(); W.root.add(this.fx);
    this.grid = walkGrid([room], .2);
    this.buildMat();
    this.buildSpots();
    this.buildCast();
    this.frame();
    L.makeThumbs({ faces: [['raccoon', 'happy'], ['shiba', 'happy'], ['nerd', 'happy'], ['mong', 'sad']], items: ['icecream', 'candy', 'pencil', 'star', 'gimbap2', 'heart', 'snack', 'crown', 'note'] });
    // the round
    this.score = 0; this.found = 0; this.rivalN = 0; this.rivalPts = 0; this.streak = 0; this.best = 0; this.radar = 0; this.radars = 0;
    this.left = LV.time; this.result = null; this.phase = 'intro'; this.poolLeft = LV.pool; this.slips = []; this.timers = [];
    this.goldenAt = 3 + Math.floor(Math.random() * (LV.pool - 6)); this.placed = 0; this.prizeBag = [];
    this.windT = LV.wind ? Math.max(5, rnd(LV.wind[0] - 2, LV.wind[1] - 2)) : 1e9; this.dogT = 5.5; this.retaps = []; this.flyers = [];
    for (let k = 0; k < LV.active; k++) this.placeSlip(true);
    this.buildHud();
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    this.ready = true;
    // "쪽지를 숨겨 놨어요~" … whistle … "보물찾기 시작~!"
    await this.tw.wait(.35); if (this.dead) return;
    L.say(this.teacher.ch, '보물 쪽지를 숨겨 놨어요~', 1100);
    await this.tw.wait(1.1); if (this.dead) return;
    this.whistle(); this.teacher.ch.pose = 'cheer'; L.say(this.teacher.ch, '보물찾기 시작~!', 900);
    L.ui.banner('보물찾기 시작!', null, 700);
    this.phase = 'play';
    if (LV.card === 'wind') this.card(L.thumbs.item_note, '새로 나왔다! 바람 쪽지', '휘잉~ 날아간 쪽지, 어디 떨어지나 봐!');
    if (LV.card === 'dog') this.card(L.thumbs.face_shiba_happy, '새로 나왔다! 멍뭉이', '킁킁~ 따라가 봐! 옆에 있으면 파서 줘');
    for (const c of this.kids) c.t = rnd(.1, .6);
    this.rival.t = .35;
    await this.tw.wait(.8); if (this.dead) return;
    this.teacher.ch.pose = 'idle';
  }
  addCss() {
    if (document.getElementById('tr-css')) return;
    const l = document.createElement('link'); l.id = 'tr-css'; l.rel = 'stylesheet'; l.href = new URL('./picnic.css', import.meta.url).href; document.head.append(l);
  }
  frame() {
    const W = this.L.world;
    W.home.set(-.22, .4, -.22); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = .95; W.zoom = 1;
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(6.4, 6.0, .48);
  }
  // the picnic mat with 김밥 and juice, where the class starts and gathers again for the photo
  buildMat() {
    const g = this.mat = new THREE.Group(), tex = this.gTex = ginghamTex();
    g.add(put(rbox(1.75, .03, 1.75, '#ffffff', .01, { map: tex }), 0, .015, 0));
    const deco = [['gimbap2', -.5, -.55, .3], ['juicebox', -.25, -.62, 0], ['cupcake', .55, -.5, 0], ['juicebox', .62, -.25, .8]];
    for (const [t, x, z, r] of deco) { try { const it = buildItem(t); it.scale.setScalar(1.3); put(it, x, .03, z, 0, r, 0); g.add(it); } catch {} }
    g.position.copy(MAT_C); this.L.world.root.add(g);
  }
  // each place: its prop, the part that opens, where 몽글이 (and 너굴이) stand to search it, a ring and a chip
  buildSpots() {
    const used = new Set(), q = new THREE.Quaternion(), f3 = new THREE.Vector3();
    this.spots = this.room.furns.map((rec, idx) => {
      const g = rec.f.group, box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()); c.y = 0;
      g.getWorldQuaternion(q); f3.set(0, 0, 1).applyQuaternion(q);
      const fx = Math.round(f3.x), fz = Math.round(f3.z), ext = Math.abs(fx) * (box.max.x - box.min.x) / 2 + Math.abs(fz) * (box.max.z - box.min.z) / 2;
      // stand in front (toward the camera side when the front runs off the lawn), never on another place's tile
      const want = new THREE.Vector3(c.x + fx * (ext + .32), 0, c.z + fz * (ext + .32));
      let stand = null, bs = 1e9;
      for (const t of this.grid) {
        if (used.has(t)) continue;
        const dd = Math.max(box.min.x - t.x, 0, t.x - box.max.x) + Math.max(box.min.z - t.z, 0, t.z - box.max.z);
        if (dd > .75) continue;
        const sc = Math.hypot(t.x - want.x, t.z - want.z) + dd * .8 - (t.x + t.z - c.x - c.z) * .12;
        if (sc < bs) { bs = sc; stand = t; }
      }
      stand = stand || nearestTile(this.grid, want.x, want.z);
      used.add(stand);
      const W = this.L.world;
      const part = rec.f.parts.slice().sort((a, b) => a.pivots[0].getWorldPosition(new THREE.Vector3()).distanceTo(stand) - b.pivots[0].getWorldPosition(new THREE.Vector3()).distanceTo(stand))[0] || null;
      const top = box.max.y, r = clamp(Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2 + .08, .5, .95);
      // the heat ring on the grass round the place (transparent, so it gets no ink outline)
      const ring = new THREE.Group();
      const rm = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false });
      const dm = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false });
      ring.add(new THREE.Mesh(this.ringGeo || (this.ringGeo = new THREE.RingGeometry(.84, 1, 44)), rm));
      ring.add(new THREE.Mesh(this.discGeo || (this.discGeo = new THREE.CircleGeometry(.84, 44)), dm));
      ring.children.forEach(m => { m.rotation.x = -Math.PI / 2; m.renderOrder = 3; });
      ring.position.set(c.x, .04, c.z); ring.scale.setScalar(r); ring.visible = false; this.fx.add(ring);
      const s = { idx, rec, type: rec.type, name: PLACE[rec.type] || '여기', f: rec.f, part, c, box, top, r, stand, open: 0, openGoal: 0, wig: 0,
        anchor: new THREE.Vector3(c.x, Math.min(top, 1.1) * .5, c.z), chipAt: new THREE.Vector3(c.x, Math.min(top, 1.25) + .12, c.z),
        slip: null, mark: null, ring, rm, dm, lvl: null, pulse: 0, rmark: null };
      s.slipAt = part?.spots?.[0] ? part.spots[0].anchor.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(c.x, Math.min(top * .4, .4), c.z);
      return s;
    });
    // 너굴이's and 멍뭉이's places: a free tile beside 몽글이's
    for (const s of this.spots) {
      const alt = this.grid.filter(t => !used.has(t) && Math.hypot(t.x - s.stand.x, t.z - s.stand.z) > .4 && Math.max(s.box.min.x - t.x, 0, t.x - s.box.max.x) + Math.max(s.box.min.z - t.z, 0, t.z - s.box.max.z) < .8)
        .sort((a, b) => Math.hypot(a.x - s.stand.x, a.z - s.stand.z) - Math.hypot(b.x - s.stand.x, b.z - s.stand.z));
      s.stand2 = alt[0] || s.stand; s.stand3 = alt[1] || alt[0] || s.stand;
    }
    this.byFurn = new Map(this.spots.map(s => [s.f, s]));
  }
  buildCast() {
    const W = this.L.world;
    const mk = (kind, x, z, o = {}) => {
      const ch = new Char(kind); ch.root.position.set(x, 0, z); ch.root.scale.setScalar(o.s || 1.2); W.root.add(ch.root);
      ch.faceTo(x + 3, z + 3);
      const a = { ch, path: [], speed: o.speed || 2, hopH: o.hopH ?? .12, hopLen: o.hopLen || .5, ph: 0, t: 0, state: 'idle' };
      this.actors.push(a); return a;
    };
    this.actors = [];
    this.me = mk('mong', ...onMat(-.05, .02), { s: 1.3, speed: ME.speed, hopH: .16, hopLen: .62 });
    this.me.ch.setFace('happy');
    const R = this.lv.rival;
    this.rival = mk('raccoon', ...onMat(.64, .12), { s: 1.25, speed: R.speed, hopH: .07, hopLen: .38 });
    this.rival.ch.setFace('happy'); this.rival.recent = [];
    this.teacher = mk('nerd', ...onMat(.5, -.62), { s: 1.3 }); this.teacher.ch.faceTo(-1, -1);
    // two classmates stroll about the lanes; whoever stands nearest shouts the hint
    this.kids = [mk('bunny', ...onMat(-.64, -.12), { speed: 1.1, hopH: .1, hopLen: .4 }), mk('hamster', ...onMat(-.5, .58), { speed: 1.1, hopH: .1, hopLen: .4 })];
    // a soft ring under 몽글이, so you always know which one is you
    this.meRing = new THREE.Mesh(new THREE.RingGeometry(.36, .48, 36), new THREE.MeshBasicMaterial({ color: '#fff7b0', transparent: true, opacity: .85, depthWrite: false }));
    this.meRing.rotation.x = -Math.PI / 2; this.meRing.renderOrder = 3; this.fx.add(this.meRing);
    this.kids[0].home = [-3.3, -1.8, -1.0, 2.4]; this.kids[1].home = [1.4, -1.8, 3.3, 2.4];   // the left and right edges, out of the way
    this.kids.forEach(k => { k.t = 99; });
    if (this.lv.dog) { this.dog = mk('shiba', ...onMat(.42, .62), { s: 1.15, speed: 1.35, hopH: .09, hopLen: .36 }); this.dog.ch.setFace('happy'); this.dog.state = 'roam'; this.dog.t = 2; }
  }

  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col(), LV = this.lv;
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, '소풍 보물찾기', h('small', {}, LV.name)));
    this.clock = h('div', { class: 'tr-clock' }, this.clockI = h('i'), this.clockN = h('b', { class: 'ol' }, String(LV.time)));
    top.append(this.clock);
    col.append(top);
    const max = LV.stars[2] * 1.15;
    this.scoreEl = h('div', { class: 'tr-score ol' }, '0');
    this.bar = h('div', { class: 'tr-bar' }, this.barI = h('i'), ...LV.stars.map((s, k) => h('span', { class: 'tr-mark', style: `left:${s / max * 100}%` }, '★'.repeat(k + 1))));
    this.barMax = max;
    this.poolEl = h('div', { class: 'tr-pool' });
    col.append(h('div', { class: 'tr-head' }, this.scoreEl, this.bar, this.poolEl));
    this.rivalEl = h('div', { class: 'tr-rival' }, h('img', { src: L.thumbs.face_raccoon_happy }), this.rivalN_ = h('b', { class: 'ol' }, '0'));
    col.append(this.rivalEl);
    this.hint = h('div', { class: 'tr-hint ol' }, '터치! 뒤져 보기 · 뜨거울수록 가까워'); col.append(this.hint);
    this.feverEl = h('div', { class: 'tr-fever' }); document.getElementById('app').append(this.feverEl);
    // chips over the places: the heat of a searched place, and the paw over where 너굴이 is heading
    for (const s of this.spots) { s.chip = h('div', { class: 'tr-chip' }); ui.wui.append(s.chip); }
    this.rt = h('div', { class: 'tr-rt' }, h('img', { src: L.thumbs.face_raccoon_happy })); ui.wui.append(this.rt);
    this.updPool();
  }
  updPool() { const n = this.poolLeft + this.slips.filter(s => s.state !== 'taken').length; this.poolEl.textContent = `남은 쪽지 ${n}장`; }
  card(img, t, s) {
    const L = this.L, h = L.h;
    const c = h('div', { class: 'tr-get' }, h('img', { src: img }), h('div', {}, h('div', { class: 'tr-get-t ol' }, t), h('div', { class: 'tr-get-s' }, s)));
    document.getElementById('app').append(c); L.audio.sfx('gasp');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2700);
  }
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => { if (e.button > 0 || this.result || this.phase !== 'play') return; this.tap(e.clientX, e.clientY); };
    app.addEventListener('pointerdown', this._down);
  }

  // ── slips
  placeSlip(initial = false) {
    if (this.poolLeft <= 0) return null;
    const me = this.me.ch.root.position, live = this.slips.filter(s => s.state !== 'taken');
    const busy = new Set([this.me.target, this.rival.target, this.me.at, this.rival.at].filter(Boolean));
    let cands = this.spots.filter(s => !s.slip && !s.mark && !busy.has(s));
    if (cands.length < 3) cands = this.spots.filter(s => !s.slip && !busy.has(s));
    // apart from the other slip (so the hints don't blur), and not right under 몽글이's or 너굴이's nose (fair to both)
    const rp = this.rival.ch.root.position, near = (p, s) => Math.hypot(p.x - s.c.x, p.z - s.c.z) < 1.7 ? 2.5 : 0;
    const score = s => Math.min(4, ...live.map(o => Math.hypot(o.spot.c.x - s.c.x, o.spot.c.z - s.c.z))) + Math.random() * 2.2 - (initial ? 0 : near(me, s) + near(rp, s));
    cands.sort((a, b) => score(b) - score(a));
    const spot = cands[0]; if (!spot) return null;
    const golden = this.placed === this.goldenAt;
    const s = { spot, golden, state: 'hidden', mesh: null, t0: this.t };
    spot.slip = s; this.slips.push(s); this.poolLeft--; this.placed++;
    if (spot.mark) this.unmark(spot);
    return s;
  }
  liveSlips() { return this.slips.filter(s => s.state === 'hidden' || s.state === 'dug' || s.state === 'flying'); }
  heatOf(spot) {
    const L = this.liveSlips(); if (!L.length) return null;
    let d = 1e9, gold = false;
    for (const s of L) { const dd = Math.hypot(s.spot.c.x - spot.c.x, s.spot.c.z - spot.c.z); if (dd < d) { d = dd; gold = s.golden; } }
    return { d, h: heatAt(d), gold };
  }

  // ── input: tap a place (its prop, or near it); 너굴이/멍뭉이 taps fall through to the place behind
  spotAt(x, y) {
    const W = this.L.world;
    const hits = W.pick(x, y, [this.room.group]);
    for (const hh of hits) { let o = hh.object; while (o && !o.userData.furn) o = o.parent; const s = o && this.byFurn.get(o.userData.furn); if (s) return s; }
    let best = null, bd = 64;
    for (const s of this.spots) {
      const p = W.toScreen(s.anchor), d = Math.hypot(p.x - x, p.y - y);
      const pb = W.toScreen(s.c), d2 = Math.hypot(pb.x - x, pb.y - y);
      const dd = Math.min(d, d2 * 1.1);
      if (dd < bd) { bd = dd; best = s; }
    }
    return best;
  }
  tap(x, y) {
    const L = this.L, me = this.me;
    if (me.state === 'dizzy') { L.audio.sfx('dizzy'); return; }
    const s = this.spotAt(x, y); if (!s) return;
    L.audio.sfx('tap', 3);
    const p = L.world.toScreen(s.anchor); L.world.fx.ring(p.x, p.y, { r: 34, color: '#ffffff', width: 4, life: .3 });
    if (me.state === 'search' || me.state === 'cheer') { me.queued = s; return; }
    // anti-spam: changing your mind four times in a moment makes 몽글이 dizzy
    if (me.state === 'move' && me.target !== s) {
      this.retaps = this.retaps.filter(t => this.t - t < 1.3); this.retaps.push(this.t);
      if (this.retaps.length >= 4) { this.retaps = []; return this.dizzy(); }
    }
    this.goSearch(me, s);
  }
  dizzy() {
    const me = this.me; me.state = 'dizzy'; me.path = []; me.target = null; me.t = 1.1; me.ch.body.position.y = 0;
    me.ch.setFace('dizzy'); this.L.say(me.ch, '어디였더라~?', 900); this.L.audio.sfx('dizzy');
    this.streak = 0; this.updStreak();
  }
  goSearch(a, s, stand = a === this.me ? s.stand : s.stand2) {
    a.target = s; a.at = null; a.state = 'move';
    this.route(a, stand.x, stand.z);
    if (a === this.me) a.ch.pose = 'idle';
  }
  route(a, x, z) {
    const p = a.ch.root.position, from = nearestTile(this.grid, p.x, p.z), to = nearestTile(this.grid, x, z);
    const path = from && to ? gridPath(from, to) : null;
    a.path = (path || []).map(t => ({ x: t.x, z: t.z }));
    if (!path || !a.path.length || Math.hypot(a.path[a.path.length - 1].x - x, a.path[a.path.length - 1].z - z) > .05) a.path.push({ x, z });
    // a smoother start: skip the first node if it's behind us
    if (a.path.length > 1 && Math.hypot(a.path[0].x - p.x, a.path[0].z - p.z) < .3) a.path.shift();
  }
  move(a, dt) {
    const p = a.ch.root.position; let st = a.speed * dt, hx = 0, hz = 0, moved = false;
    while (st > 1e-5 && a.path.length) {
      const t = a.path[0], dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
      if (d <= st) { p.x = t.x; p.z = t.z; a.path.shift(); st -= d; hx += dx; hz += dz; }
      else { const k = st / d; p.x += dx * k; p.z += dz * k; hx += dx * k; hz += dz * k; st = 0; }
      moved = true;
    }
    if (moved) {
      if (Math.hypot(hx, hz) > 1e-4) { const r = a.ch.root.rotation.y; a.ch.root.rotation.y = r + wrapA(Math.atan2(hx, hz) - r) * Math.min(1, dt * 16); }
      a.ph += a.speed * dt / a.hopLen * Math.PI;
      a.ch.body.position.y = Math.abs(Math.sin(a.ph)) * a.hopH;
    } else if (a.ch.body.position.y > 0) { a.ch.body.position.y = Math.max(0, a.ch.body.position.y - dt * 1.5); a.ph = 0; }
    return moved;
  }
  faceSpot(a, s, dt) { const p = a.ch.root.position, r = a.ch.root.rotation.y; a.ch.root.rotation.y = r + wrapA(Math.atan2(s.c.x - p.x, s.c.z - p.z) - r) * Math.min(1, dt * 12); }

  // ── searching
  startSearch(a, s) {
    a.state = 'search'; a.at = s; a.t = s.slip?.state === 'dug' ? .15 : a === this.me ? ME.search : this.lv.rival.search;
    a.ch.pose = 'search'; s.openGoal = 1; s.wig = .5;
    if (s.slip?.state !== 'dug') this.L.audio.sfx(s.part?.sfx || 'swish');
  }
  endSearch(a) {
    const s = a.at, L = this.L; a.ch.pose = 'idle';
    const sl = s.slip;
    if (sl && sl.state === 'flying') { a.t = .2; a.ch.pose = 'search'; return; }   // it's landing right here: wait for it
    if (sl && (sl.state === 'hidden' || sl.state === 'dug')) { this.take(sl, a); return; }
    this.later(.35, () => { if (!(this.me.at === s && this.me.state === 'search') && !(this.rival.at === s && this.rival.state === 'search')) s.openGoal = 0; });
    if (a === this.me) {
      a.state = 'idle'; this.hint1();
      this.mark(s, true);
    } else {
      a.state = 'think'; a.t = rnd(...this.lv.rival.think);
      if (Math.random() < .3) L.say(a.ch, pick(['없네~?', '여기 아닌가~', '흠…']), 700);
    }
  }
  // a found slip: it pops out of the hiding place, unfolds over the finder's head, prize line, stars
  take(sl, a) {
    const L = this.L, W = L.world, s = sl.spot, mine = a === this.me;
    sl.state = 'taken'; s.slip = null; sl.by = mine ? 'me' : 'rival';
    if (sl.mesh) { this.fx.remove(sl.mesh); disposeTree(sl.mesh); sl.mesh = null; }
    const m = sl.mesh = slipMesh(sl.golden); m.position.copy(sl.dugAt || s.slipAt); this.fx.add(m); W.idsDirty = true;
    const hold = a.ch;
    const p0 = m.position.clone();
    this.tw.run(.38, k => { m.position.set(p0.x, p0.y + k * .9, p0.z); m.rotation.y = k * Math.PI * 3; m.scale.setScalar(1 + k * .4); }, ease.outBack).then(() => {
      if (this.dead) return;
      const q0 = m.position.clone();
      return this.tw.run(.22, k => { const tp = hold.root.position; m.position.set(q0.x + (tp.x - q0.x) * k, q0.y + (tp.y + hold.headTop() + .28 - q0.y) * k, q0.z + (tp.z - q0.z) * k); }, ease.inOutSine);
    }).then(() => {
      if (this.dead) return;
      sl.onHead = hold;
      return this.tw.wait(mine ? .8 : 1.1);
    }).then(() => {
      if (this.dead || sl.mesh !== m) return;
      sl.onHead = null; const sc = m.scale.x;
      this.tw.run(.18, k => m.scale.setScalar(sc * (1 - k)), ease.inQuad).then(() => { if (sl.mesh === m) { this.fx.remove(m); disposeTree(m); sl.mesh = null; } });
    });
    a.state = 'cheer'; a.t = mine ? .42 : .9; a.ch.pose = 'cheer'; a.at = s; a.target = null;
    this.later(.55, () => { if (!(this.me.at === s && this.me.state === 'search') && !(this.rival.at === s && this.rival.state === 'search')) s.openGoal = 0; });
    const scr = W.toScreen(new THREE.Vector3(s.c.x, Math.min(s.top, 1) + .4, s.c.z));
    if (mine) {
      const pts = sl.golden ? 3 : 1;
      this.score += pts; this.found++; this.streak++; this.best = Math.max(this.best, this.streak);
      L.audio.sfx('found'); L.audio.sfx('pop', 3 + Math.min(8, this.streak)); if (sl.golden) L.audio.sfx('star');
      W.fx.burst(scr.x, scr.y, { n: sl.golden ? 28 : 14, shape: 'star', colors: sl.golden ? ['#ffe14d', '#ffd23f', '#ffffff'] : undefined });
      L.ui.floatText(scr.x, scr.y - 26, `+${pts}`, sl.golden ? 'gold big' : 'gold');
      a.ch.setFace('happy'); this.prize(sl);
      // stolen from right under 너굴이's nose
      if (this.rival.target === s && this.rival.state === 'move') { this.rival.ch.setFace('angry'); L.say(this.rival.ch, '앗! 내 건데~!', 900, 'red'); this.later(.9, () => this.rival.ch.setFace('happy')); this.rival.target = null; this.rival.state = 'think'; this.rival.t = .5; this.rival.path = []; }
      if (this.streak === 3 && this.radars < 2 && this.radar <= 0) this.later(.5, () => this.startRadar());
      this.bump(); this.updStreak(); this.hint1(true);
    } else {
      this.rivalN++; this.rivalPts += sl.golden ? 3 : 1; this.rivalN_.textContent = String(this.rivalPts);
      this.rivalEl.classList.remove('pop'); void this.rivalEl.offsetWidth; this.rivalEl.classList.add('pop');
      L.say(a.ch, sl.golden ? '황금 쪽지다~ 헤헤!' : pick(RIVAL_GOT), 1000, 'red'); L.audio.laugh(a.ch?.kind);
      a.ch.pose = 'wave';
      W.fx.burst(scr.x, scr.y, { n: 8, shape: 'circle', colors: ['#b8b2c6', '#4a4458', '#ffffff'], size: 7 });
      if (this.streak > 0) { this.streak = 0; this.updStreak(); }
      if (this.me.target === s && this.me.state === 'move') { this.me.ch.setFace('sad'); this.later(.8, () => this.me.ch.setFace('happy')); }
      a.recent = [];
    }
    if (this.dog && this.dog.slip === sl) { this.dog.slip = null; this.dog.state = 'roam'; this.dog.t = 1; this.dog.ch.pose = 'idle'; }
    sl.dugAt = null;
    // the next slip goes out a moment later; when the teacher's pile is empty and the last is found: "다 찾았다!"
    this.updPool();
    if (this.poolLeft > 0) this.later(rnd(.5, .9), () => { if (this.phase === 'play') { this.placeSlip(); this.updPool(); } });
    else if (!this.liveSlips().length) this.later(.9, () => this.finish('all'));
  }
  // the unfolding paper with its prize line, low on the screen (non-blocking)
  prize(sl) {
    const L = this.L, h = L.h;
    if (!this.prizeBag.length) this.prizeBag = PRIZES.slice().sort(() => Math.random() - .5);
    const P = sl.golden ? GOLD : this.prizeBag.pop();
    const src = P.i ? L.thumbs['item_' + P.i] : P.f ? L.thumbs[P.f] : L.thumbs.face_mong_sad;
    document.querySelectorAll('.tr-slip').forEach(e => e.remove());
    const c = h('div', { class: 'tr-slip' + (P.gold ? ' gold' : '') + (P.kk ? ' kk' : '') },
      h('div', { class: 'tr-slip-p' }, src ? h('img', { src }) : null, h('div', {}, h('div', { class: 'tr-slip-t' }, P.t), h('div', { class: 'tr-slip-s' }, P.gold ? '쪽지 하나에 +3!' : P.kk ? '그래도 쪽지는 쪽지! +1' : '보물 쪽지 +1'))));
    document.getElementById('app').append(c);
    if (P.kk) { L.audio.sfx('wobble'); L.say(this.me.ch, '에이~ 꽝이다!', 800); }
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 350); }, 1500);
  }
  // a searched place keeps a ring (and a little chip) in its heat colour; the colour is live
  mark(s, shout) {
    const L = this.L, W = L.world, H = this.heatOf(s);
    if (!H) { const p = W.toScreen(s.chipAt); L.ui.floatText(p.x, p.y, '텅~', ''); return; }
    s.mark = { t0: this.t }; s.lvl = null; this.paintMark(s, H);
    s.ring.scale.setScalar(s.r * .3); const r = s.r; this.tw.run(.3, k => { s.ring.scale.setScalar(r * (.3 + .7 * k)); }, ease.outBack);
    if (!shout) return;
    // the nearest friend shouts it
    const who = [...this.kids, this.teacher, ...(this.dog ? [] : [])].sort((a, b) => a.ch.root.position.distanceTo(s.c) - b.ch.root.position.distanceTo(s.c))[0];
    const line = H.h.k === 'hot' && H.gold ? '반짝반짝 뜨거워!!' : pick(H.h.lines);
    L.say(who.ch, line, 950, 'tr-b-' + H.h.k); who.ch.setFace(H.h.face); who.ch.bump(.3);
    const wf = who.ch; this.later(1, () => wf.setFace('normal'));
    const p = W.toScreen(s.chipAt);
    L.ui.floatText(p.x, p.y - 18, H.h.chip === '뜨거!' ? '뜨거워!' : H.h.chip === '따뜻' ? '따뜻해' : H.h.chip, 'tr-f-' + H.h.k);
    L.audio.sfx(H.h.sfx);
    if (H.h.k === 'hot') { W.fx.burst(p.x, p.y + 30, { n: 10, shape: 'circle', colors: ['#ff4b3e', '#ffa53a', '#ffe14d'], size: 7, speed: 120, up: 160, gravity: -60, life: .7 }); this.me.ch.setFace('wow'); }
    else if (H.h.k === 'ice') { W.fx.burst(p.x, p.y + 30, { n: 10, shape: 'star', colors: ['#ffffff', '#cdefff', '#8fdcff'], size: 7, speed: 110, up: 40, gravity: 90, life: .9 }); this.me.ch.setFace('sweat'); }
    else this.me.ch.setFace(H.h.k === 'warm' ? 'happy' : 'sweat');
    this.later(.8, () => this.me.ch.setFace('happy'));
  }
  paintMark(s, H) {
    if (s.lvl === H.h.k && s._gold === H.gold) return;
    const changed = s.lvl !== null;
    s.lvl = H.h.k; s._gold = H.gold;
    s.ring.visible = true; s.rm.color.set(H.h.color); s.dm.color.set(H.h.color); s.rm.opacity = .92; s.dm.opacity = .2;
    s.chip.textContent = H.h.chip; s.chip.className = 'tr-chip on ' + H.h.k + (H.gold && H.h.k === 'hot' ? ' gold' : '');
    if (changed) { s.chip.classList.add('flip'); s.pulse = .5; }
  }
  unmark(s) { s.mark = null; s.lvl = null; s.ring.visible = false; s.chip.className = 'tr-chip'; }
  hint1(gone) { if (gone && !this._hintGone) { this._hintGone = true; this.hint.classList.add('gone'); } }

  // ── 보물 레이더: three finds in a row — for a few seconds every place glows its heat, the slips shine gold
  startRadar() {
    if (this.phase !== 'play') return;
    const L = this.L; this.radar = 5; this.radars++;
    L.audio.sfx('special'); L.audio.sfx('win');
    this.feverEl.classList.add('on'); L.ui.banner('보물 레이더!', '반짝이는 곳에 쪽지가 있어!', 1000);
  }
  updStreak() { this.scoreEl.dataset.combo = this.streak >= 2 ? tr(`${this.streak} 연속`) : ''; }
  bump() { this.scoreEl.textContent = String(this.score); this.scoreEl.classList.remove('pop'); void this.scoreEl.offsetWidth; this.scoreEl.classList.add('pop'); this.barI.style.width = Math.min(100, this.score / this.barMax * 100) + '%'; }

  // ── the wind: a gust lifts one slip out of its hiding place and drops it somewhere else (you can watch it land)
  gust() {
    const L = this.L, W = L.world;
    const busy = new Set([this.me.at, this.rival.at].filter(Boolean));
    const sl = this.slips.filter(s => s.state === 'hidden' && !busy.has(s.spot)).sort((a, b) => a.t0 - b.t0)[0]; if (!sl) return;
    const from = sl.spot;
    let cands = this.spots.filter(s => !s.slip && !s.mark && s !== this.me.target && s !== this.me.at && Math.hypot(s.c.x - from.c.x, s.c.z - from.c.z) > 2.8);
    if (!cands.length) cands = this.spots.filter(s => !s.slip && Math.hypot(s.c.x - from.c.x, s.c.z - from.c.z) > 2);
    const to = pick(cands); if (!to) return;
    from.slip = null; to.slip = sl; sl.spot = to; sl.state = 'flying'; sl.t0 = this.t; sl.blown = true;
    if (to.mark) this.unmark(to);
    L.audio.sfx('whoosh'); from.openGoal = 1; from.wig = .6;
    this.later(.4, () => { if (!(this.me.at === from && this.me.state === 'search')) from.openGoal = 0; });
    const m = sl.mesh = slipMesh(sl.golden); this.fx.add(m); W.idsDirty = true;
    const a = from.slipAt.clone(), b = to.slipAt.clone(), dur = 1.7;
    this.flyers.push({ sl, m, a, b, t: 0, dur });
    this.windFx = 1.4;
    // 너굴이 saw it too — usually
    if (Math.random() < .6) this.later(.9, () => { if (sl.state !== 'taken' && this.rival.state !== 'search' && this.rival.state !== 'cheer') { this.goSearch(this.rival, to); L.say(this.rival.ch, '저기 떨어졌다!', 700); } });
  }
  stepFlyers(dt) {
    for (const f of this.flyers) {
      f.t += dt; const k = Math.min(1, f.t / f.dur), e = ease.inOutSine(k);
      f.m.position.set(f.a.x + (f.b.x - f.a.x) * e + Math.sin(k * 9) * .25 * (1 - k), f.a.y + (f.b.y - f.a.y) * e + Math.sin(k * Math.PI) * 2.0, f.a.z + (f.b.z - f.a.z) * e);
      f.m.rotation.set(Math.sin(this.t * 7) * .6, this.t * 6, Math.cos(this.t * 5) * .5);
      if (k >= 1) {
        f.done = true;
        if (f.sl.state === 'flying') f.sl.state = 'hidden';
        if (f.sl.mesh === f.m) { this.fx.remove(f.m); disposeTree(f.m); f.sl.mesh = null; }
        const s = f.sl.spot; s.wig = .7; s.openGoal = 1; this.later(.35, () => { if (!(this.me.at === s && this.me.state === 'search') && !(this.rival.at === s && this.rival.state === 'search')) s.openGoal = 0; });
        this.L.audio.sfx('swish');
        const p = this.L.world.toScreen(s.chipAt); this.L.world.fx.burst(p.x, p.y + 20, { n: 10, shape: 'circle', colors: ['#8be36b', '#ffd23f', '#ffffff'], size: 6, speed: 120, life: .5 });
        this.L.ui.floatText(p.x, p.y - 10, '쏙!', 'gold');
      }
    }
    this.flyers = this.flyers.filter(f => !f.done);
    if (this.windFx > 0) {
      this.windFx -= dt;
      if (Math.random() < dt * 30) this.L.world.fx.burst(-10, innerHeight * rnd(.25, .7), { n: 1, shape: 'circle', colors: ['#8be36b', '#5fc45a', '#ffd23f'], size: rnd(5, 9), speed: rnd(400, 700), life: 1.4, gravity: -20, up: 0 });
    }
  }

  // ── 멍뭉이: wanders; now and then sniffs out a slip ("킁킁…"), trots over and digs it up. Near him? he gives it to you.
  stepDog(dt) {
    const D = this.dog, L = this.L, me = this.me.ch.root.position, p = D.ch.root.position;
    D.t -= dt;
    if (D.state === 'roam') {
      if (!D.path.length && D.t <= 0) {
        D.t = rnd(1.2, 2.4);
        const t = pick(this.grid.filter(g => Math.hypot(g.x - p.x, g.z - p.z) < 2.2 && Math.hypot(g.x - p.x, g.z - p.z) > .8));
        if (t) { D.speed = 1.1; this.route(D, t.x, t.z); }
      }
      if ((this.dogT -= dt) <= 0) {
        const sl = this.slips.filter(s => s.state === 'hidden' && s.spot !== this.me.target && s.spot !== this.rival.target).sort((a, b) => Math.hypot(a.spot.c.x - p.x, a.spot.c.z - p.z) - Math.hypot(b.spot.c.x - p.x, b.spot.c.z - p.z))[0];
        if (sl) {
          D.state = 'go'; D.slip = sl; D.speed = 1.35; this.route(D, sl.spot.stand3.x, sl.spot.stand3.z); D.ch.pose = 'idle';
          L.say(D.ch, '킁킁…', 1000); L.audio.sfx('hmm');
        }
        this.dogT = rnd(8, 10);
      }
    } else if (D.state === 'go') {
      if (D.slip?.state !== 'hidden') { D.state = 'roam'; D.slip = null; D.t = .5; D.path = []; return; }
      if (Math.random() < dt * 1.2) L.say(D.ch, '킁킁', 500);
      if (!D.path.length) { D.state = 'dig'; D.t = 1.1; D.ch.pose = 'paw'; L.say(D.ch, '멍! 멍!', 900); L.audio.sfx('swish'); }
    } else if (D.state === 'dig') {
      const s = D.slip?.spot;
      if (!s || D.slip.state !== 'hidden') { D.state = 'roam'; D.slip = null; D.t = .5; D.ch.pose = 'idle'; return; }
      this.faceSpot(D, s, dt);
      D.ch.body.position.y = Math.abs(Math.sin(this.t * 18)) * .06;
      if (Math.random() < dt * 14) { const q = L.world.toScreen(p.clone().setY(.1)); L.world.fx.burst(q.x, q.y, { n: 2, shape: 'circle', colors: ['#c99a6b', '#a87a4c', '#8fd46a'], size: 6, speed: 140, life: .45, up: 160, gravity: 500 }); }
      if (D.t <= 0) {
        D.ch.pose = 'idle'; D.ch.body.position.y = 0;
        const sl = D.slip;
        if (Math.hypot(me.x - p.x, me.z - p.z) < 2.0 && this.me.state !== 'dizzy') {
          // he hands it to you
          L.say(D.ch, '멍! 줄게!', 900); sl.dugAt = p.clone().setY(.3);
          if (this.me.state === 'search' && this.me.at && this.me.at !== s) this.me.at.openGoal = 0;
          this.me.path = []; this.me.target = null; this.take(sl, this.me);
          D.state = 'roam'; D.t = 1.2; D.slip = null;
        } else {
          sl.state = 'dug'; sl.dugAt = new THREE.Vector3(p.x + .38, .05, p.z + .38);
          const m = sl.mesh = slipMesh(sl.golden); m.scale.setScalar(1.5); m.position.copy(sl.dugAt); this.fx.add(m); L.world.idsDirty = true;
          L.say(D.ch, '멍멍! 여기!', 1100); L.audio.sfx('found');
          D.state = 'wait'; D.t = 4; D.ch.setFace('happy');
          // 너굴이 hears the bark
          this.later(1.0, () => { if (sl.state === 'dug' && this.rival.state !== 'search' && this.rival.state !== 'cheer') { this.goSearch(this.rival, s); } });
        }
      }
    } else if (D.state === 'wait') {
      D.ch.rx.wag = 1;
      if (D.slip?.state !== 'dug' || D.t <= 0) { D.ch.rx.wag = 0; D.state = 'roam'; D.t = 1; D.slip = null; }   // a dug slip stays on the grass until somebody grabs it
    }
    if (D.state === 'roam' || D.state === 'go') this.move(D, dt);
  }

  // ── 너굴이: thinks (picks a place by its own sloppy nose for the slips), walks over, searches; the paw shows where
  stepRival(dt) {
    const R = this.rival, RV = this.lv.rival;
    if (R.state === 'idle') { R.t -= dt; if (R.t <= 0) R.state = 'think'; return; }
    if (R.state === 'think') {
      R.t -= dt; if (R.t > 0) return;
      const dug = this.slips.find(s => s.state === 'dug');
      let s = dug && dug.spot !== this.me.target ? dug.spot : null;
      if (!s) {
        const L = this.liveSlips(), rp = R.ch.root.position;
        const cands = this.spots.filter(q => q !== this.me.target && q !== this.me.at && !R.recent.includes(q));
        const sc = q => { const d = L.length ? Math.min(...L.map(o => Math.hypot(o.spot.c.x - q.c.x, o.spot.c.z - q.c.z))) : 3; return d + Math.random() * RV.noise + Math.hypot(rp.x - q.c.x, rp.z - q.c.z) * .22; };
        s = cands.sort((a, b) => sc(a) - sc(b))[0];
      }
      if (!s) { R.t = .4; return; }
      R.recent.push(s); if (R.recent.length > 4) R.recent.shift();
      this.goSearch(R, s);
      if (Math.random() < .22) this.L.say(R.ch, pick(['저기 같은데~?', '내가 먼저 찾을 거야~', '흐흐흐~']), 800);
      return;
    }
    if (R.state === 'move') {
      // someone already took what he was going for (or it blew away): rethink
      const s = R.target;
      if (!this.move(R, dt)) { if (s) this.startSearch(R, s); else R.state = 'think'; }
      return;
    }
    if (R.state === 'search') { this.faceSpot(R, R.at, dt); R.t -= dt; if (R.t <= 0) this.endSearch(R); return; }
    if (R.state === 'cheer') { R.t -= dt; if (R.t <= 0) { R.ch.pose = 'idle'; R.state = 'think'; R.t = rnd(...RV.think); } }
  }
  stepKids(dt) {
    for (const k of this.kids) {
      if (!this.move(k, dt)) {
        k.t -= dt;
        // stand facing 몽글이 between strolls
        const me = this.me.ch.root.position, p = k.ch.root.position, r = k.ch.root.rotation.y; k.ch.root.rotation.y = r + wrapA(Math.atan2(me.x - p.x, me.z - p.z) - r) * Math.min(1, dt * 4);
        if (k.t <= 0) {
          k.t = rnd(1.6, 3.2);
          const [x0, z0, x1, z1] = k.home, mt = this.me.target?.stand;
          const t = pick(this.grid.filter(g => g.x > x0 && g.x < x1 && g.z > z0 && g.z < z1 && !this.spots.some(s => s.stand === g) && Math.hypot(g.x - me.x, g.z - me.z) > 1.3 && (!mt || Math.hypot(g.x - mt.x, g.z - mt.z) > 1.1)));
          if (t) this.route(k, t.x, t.z);
        }
      }
    }
  }
  later(s, fn) { this.timers.push({ t: s, fn }); }

  // ── per frame
  update(dt) {
    if (!this.ready) return;
    const L = this.L, W = L.world, LV = this.lv;
    this.t += dt; this.tw.update(dt); this.room.update(dt);
    for (const a of this.actors) a.ch.update(dt);
    // timers (game time)
    if (this.timers.length) { const due = this.timers.filter(x => (x.t -= dt) <= 0); this.timers = this.timers.filter(x => x.t > 0); for (const x of due) { if (!this.dead) x.fn(); } }
    // the parts: open while searched, a shiver when touched
    for (const s of this.spots) {
      s.open += (s.openGoal - s.open) * (1 - Math.exp(-dt * 14)); s.part?.setOpen(s.open);
      s.wig = Math.max(0, s.wig - dt);
      s.f.group.rotation.z = s.wig > 0 && s.type !== 'tree' && s.type !== 'pine' ? Math.sin(this.t * 40) * .035 * (s.wig / .6) : 0;
    }
    this.stepFlyers(dt);
    // slips held over heads / lying dug up
    for (const sl of this.slips) {
      if (sl.onHead && sl.mesh) { const p = sl.onHead.root.position; sl.mesh.position.set(p.x, p.y + sl.onHead.headTop() + .28 + Math.sin(this.t * 8) * .04, p.z); sl.mesh.rotation.y += dt * 3; }
      else if (sl.state === 'dug' && sl.mesh) { sl.mesh.position.y = .05 + Math.abs(Math.sin(this.t * 4)) * .12; sl.mesh.rotation.y += dt * 2.5; if (Math.random() < dt * 3) { const p = W.toScreen(sl.mesh.position); W.fx.ring(p.x, p.y, { r: 26, color: '#ffe14d', width: 4, life: .5 }); } }
    }
    this.stepMarks(dt);
    this.placeChips();
    { const p = this.me.ch.root.position; this.meRing.position.set(p.x, .045, p.z); this.meRing.scale.setScalar(1 + Math.sin(this.t * 5) * .05); }
    if (this.held) { const cam = W.cam.position; for (const o of this.held) { const p = o.a.ch.root.position; o.m.position.set(p.x + (o.i - (o.n - 1) / 2) * .3, p.y + o.a.ch.headTop() + .3 + Math.sin(this.t * 6 + o.i) * .04, p.z); o.m.rotation.y = Math.atan2(cam.x - p.x, cam.z - p.z); } }
    if (this.phase === 'end') { for (const a of this.actors) this.move(a, dt); return; }
    if (this.phase !== 'play' || this.result) return;
    // the clock
    this.left -= dt;
    const k = Math.max(0, this.left) / LV.time;
    this.clockI.style.width = (k * 100) + '%'; this.clockN.textContent = String(Math.max(0, Math.ceil(this.left)));
    this.clock.classList.toggle('hurry', this.left < 6);
    if (this.left < 5.5 && Math.ceil(this.left) !== this._lastN) { this._lastN = Math.ceil(this.left); if (this._lastN > 0) { L.ui.floatText(innerWidth / 2, innerHeight * .2, String(this._lastN), 'big'); L.audio.sfx('tick'); } }
    if (this.left <= 0) return this.finish('time');
    // 몽글이
    const me = this.me;
    if (me.state === 'move') {
      if (!this.move(me, dt)) { if (me.target) this.startSearch(me, me.target); else me.state = 'idle'; }
    } else if (me.state === 'search') {
      this.faceSpot(me, me.at, dt); me.t -= dt;
      me.ch.body.position.y = Math.abs(Math.sin(this.t * 16)) * .03;
      if (me.t <= 0) { me.ch.body.position.y = 0; this.endSearch(me); }
    } else if (me.state === 'cheer') {
      me.t -= dt; if (me.t <= 0) { me.state = 'idle'; me.ch.pose = 'idle'; }
    } else if (me.state === 'dizzy') {
      me.t -= dt; me.ch.root.rotation.y += dt * 9; if (me.t <= 0) { me.state = 'idle'; me.ch.setFace('happy'); }
    }
    if (me.state === 'idle' && me.queued) { const q = me.queued; me.queued = null; this.goSearch(me, q); }
    else if (me.state === 'idle') this.move(me, dt);
    this.stepRival(dt);
    this.stepKids(dt);
    if (this.dog) this.stepDog(dt);
    // the wind
    if (LV.wind && (this.windT -= dt) <= 0) { this.windT = rnd(LV.wind[0], LV.wind[1]); this.gust(); }
    // radar
    if (this.radar > 0 && (this.radar -= dt) <= 0) { this.feverEl.classList.remove('on'); for (const s of this.spots) if (!s.mark) { s.ring.visible = false; s.chip.className = 'tr-chip'; s.lvl = null; } }
  }
  stepMarks(dt) {
    for (const s of this.spots) {
      if (s.pulse > 0) s.pulse -= dt;
      const radarOn = this.radar > 0 && this.phase === 'play';
      if (s.mark) {
        const age = this.t - s.mark.t0;
        if (age > MARK_LIFE) { if (radarOn) { s.mark = null; } else { this.unmark(s); continue; } }
        else {
          const H = this.heatOf(s); if (H) this.paintMark(s, H);
          const fade = age > MARK_LIFE - 2 ? (MARK_LIFE - age) / 2 : 1;
          s.rm.opacity = .92 * fade; s.dm.opacity = .2 * fade; s.chip.style.opacity = fade;
        }
      }
      if (radarOn && !s.mark) {
        if (s.slip && s.slip.state !== 'taken') {
          if (s.lvl !== 'here') { s.lvl = 'here'; s.ring.visible = true; s.rm.color.set('#ffe14d'); s.dm.color.set('#fff3a0'); s.rm.opacity = 1; s.dm.opacity = .45; s.chip.textContent = '여기!'; s.chip.className = 'tr-chip on here'; s.chip.style.opacity = 1; }
        } else { const H = this.heatOf(s); if (H) { if (s.lvl === 'here') s.lvl = null; this.paintMark(s, H); s.chip.className = 'tr-chip'; s.rm.opacity = .7; s.dm.opacity = .16; } }
      }
      // hot rings breathe; a ring that just changed colour wobbles
      if (s.ring.visible) {
        const hot = s.lvl === 'hot' || s.lvl === 'here', base = s.r;
        s.ring.scale.setScalar(base * (1 + (hot ? Math.sin(this.t * 7) * .06 : 0) + (s.pulse > 0 ? Math.sin(s.pulse * 30) * .08 : 0)));
      }
    }
  }
  placeChips() {
    const W = this.L.world;
    for (const s of this.spots) if (s.chip.classList.contains('on')) { const p = W.toScreen(s.chipAt); s.chip.style.left = p.x + 'px'; s.chip.style.top = p.y + 'px'; }
    // the paw over where 너굴이 is heading (or digging)
    const R = this.rival, rs = this.phase === 'play' && (R.state === 'move' || R.state === 'search') ? R.target : null;
    this.rt.classList.toggle('on', !!rs); this.rt.classList.toggle('dig', R.state === 'search');
    if (rs) { const p = W.toScreen(rs.chipAt); this.rt.style.left = (p.x + 24) + 'px'; this.rt.style.top = (p.y - 22) + 'px'; }
  }

  // the whistle (a little synth trill: there's no whistle sample in the game's set)
  whistle(long = false) {
    const A = this.L.audio;
    try {
      A.sfx('tick');
      const c = A.ctx; if (!c || A.muted || c.state !== 'running') return;
      const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      o.type = 'sine'; o.frequency.value = 2500; lfo.frequency.value = 26; lg.gain.value = 160; lfo.connect(lg).connect(o.frequency);
      const t = c.currentTime, d = long ? .85 : .5;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .03); g.gain.setValueAtTime(.12, t + d - .07); g.gain.linearRampToValueAtTime(0, t + d);
      o.connect(g).connect(A.sfxBus || A.master); o.start(t); lfo.start(t); o.stop(t + d + .05); lfo.stop(t + d + .05);
    } catch {}
  }

  // "모여~!": the whistle, everyone hops back to the mat holding their slips, a class photo, then the prize count
  async finish(why) {
    if (this.result) return;
    const L = this.L, W = L.world, LV = this.lv; this.phase = 'end';
    const stars = LV.stars.filter(s => this.score >= s).length, win = stars >= 1;
    this.result = win ? 'win' : 'fail';
    L.log({ result: this.result, lv: this.lvIdx, score: this.score, stars, found: this.found, rival: this.rivalPts });
    this.feverEl.classList.remove('on'); this.radar = 0;
    for (const s of this.spots) { this.unmark(s); s.openGoal = 0; }
    this.whistle(true);
    L.say(this.teacher.ch, why === 'all' ? '다 찾았네~ 모여~!' : '삐익~ 모여~!', 1300); this.teacher.ch.pose = 'cheer';
    L.audio.sfx('whoosh');
    // the line-up on the mat: 몽글이 in the middle of the front row
    const slots = [[0, .42], [.62, .05], [-.62, .05], [-.3, -.48], [.25, -.5]];
    const cast = [this.me, this.rival, ...this.kids, ...(this.dog ? [this.dog] : [])];
    for (const a of cast) { a.state = 'gather'; a.path = []; a.target = null; a.at = null; a.ch.pose = 'idle'; a.speed = Math.max(a.speed, 2.6); a.ch.rx.wag = 0; }
    const goal = cast.map((a, i) => onMat(...(slots[i] || [0, 0])));
    cast.forEach((a, i) => this.route(a, ...goal[i]));
    for (const sl of this.slips) if (sl.state !== 'taken' && sl.mesh) { this.fx.remove(sl.mesh); disposeTree(sl.mesh); sl.mesh = null; }
    this.flyers = [];
    for (let k = 0; k < 24 && cast.some(a => a.path.length); k++) { await this.tw.wait(.1); if (this.dead) return; }
    await this.tw.wait(.2); if (this.dead) return;
    const cam = W.cam.position;
    // stragglers just hop into place
    cast.forEach((a, i) => { if (a.path.length) { a.path = []; a.ch.root.position.set(goal[i][0], 0, goal[i][1]); a.ch.bump(.3); } });
    for (const a of [...cast, this.teacher]) { a.ch.faceTo(cam.x, cam.z); a.ch.body.position.y = 0; }
    this.me.ch.pose = 'cheer'; this.me.ch.setFace(win ? 'happy' : 'sweat');
    this.rival.ch.pose = this.rivalPts > this.score ? 'hips' : 'wave'; this.rival.ch.setFace(this.rivalPts > this.score ? 'happy' : 'sad');
    this.kids.forEach(k => { k.ch.pose = 'cheer'; k.ch.setFace('happy'); });
    if (this.dog) this.dog.ch.rx.wag = 1;
    this.teacher.ch.pose = 'point';
    // everybody holds up a slip
    const held = [];
    const hold = (a, n) => { for (let i = 0; i < Math.min(n, 3); i++) { const m = slipMesh(false); m.scale.setScalar(.9); this.fx.add(m); held.push({ m, a, i, n: Math.min(n, 3) }); } };
    hold(this.me, Math.max(1, this.found)); if (this.rivalN) hold(this.rival, this.rivalN);
    this.held = held; W.idsDirty = true;
    W.flyTo(this.tw, { target: new THREE.Vector3(MAT_C.x - .1, .5, MAT_C.z - .1), zoom: 1.6, dur: .8 });
    L.say(this.teacher.ch, '하나, 둘, 셋~ 김치!', 1000);
    await this.tw.wait(1.05); if (this.dead) return;
    // 찰칵!
    L.audio.sfx('pop'); L.audio.sfx('star');
    const h = L.h, app = document.getElementById('app');
    const flash = h('div', { class: 'tr-flash' }); app.append(flash); setTimeout(() => flash.remove(), 700);
    const photo = this.photo = h('div', { class: 'tr-photo' }, h('div', { class: 'tr-photo-c' }, `가을 소풍 · 몽글이 쪽지 ${this.found}장`));
    const pc = W.toScreen(new THREE.Vector3(MAT_C.x, .6, MAT_C.z)); photo.style.top = clamp(pc.y, 220, innerHeight - 220) + 'px';
    app.append(photo);
    if (win) { L.audio.sfx('win'); W.fx.confetti(70); } else L.audio.sfx('lose');
    await this.tw.wait(1.5); if (this.dead) return;
    photo.classList.add('out');
    const last = this.lvIdx >= LEVELS.length - 1, beat = this.score > this.rivalPts;
    L.ui.panel({ title: win ? '보물찾기 끝!' : '아쉽다~', color: win ? 'green' : 'orange', body: [
      h('div', { class: 'tr-stars' }, ...[0, 1, 2].map(k => h('span', { class: k < stars ? 'on' : '' }, '★'))),
      h('div', { class: 'tr-vs' }, h('div', { class: 'tr-vs-me' }, h('b', {}, String(this.score)), h('small', {}, `몽글이 · 쪽지 ${this.found}장`)),
        h('div', { class: 'tr-vs-x' }, beat ? '>' : this.score === this.rivalPts ? '=' : '<'),
        h('div', { class: 'tr-vs-r' }, h('img', { src: L.thumbs.face_raccoon_happy }), h('b', {}, String(this.rivalPts)))),
      h('div', { class: 'txt' }, win ? (stars >= 3 ? '보물찾기 왕! 상품은 다 내 거~' : beat ? '너굴이보다 많이 찾았다!' : '잘 찾았어! 너굴이보다 먼저 가 봐') : `${LV.stars[0]}점부터 성공! "뜨거워~" 쪽 옆을 뒤져 봐`)],
      buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
        this.nextBtn = L.ui.btn(win ? (last ? '처음 공원부터' : '다음 소풍') : '다시 하기', { color: win ? 'green' : 'orange', cls: 'big', onClick: () => L.go({ lv: win ? (last ? 0 : this.lvIdx + 1) : this.lvIdx }) })] });
  }
  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.removeEventListener('pointerdown', this._down); app.classList.remove('tr');
    for (const a of this.actors || []) { W.root.remove(a.ch.root); disposeTree(a.ch.root); }
    for (const o of [this.room?.group, this.fx, this.mat]) if (o) { W.root.remove(o); disposeTree(o); }
    this.ringGeo?.dispose(); this.discGeo?.dispose(); this.gTex?.dispose();
    for (const s of this.spots || []) s.chip?.remove();
    this.rt?.remove(); this.feverEl?.remove(); this.photo?.remove();
    document.querySelectorAll('.tr-get, .tr-slip, .tr-flash, .tr-photo').forEach(e => e.remove());
    document.getElementById('tr-css')?.remove(); W.camLock = false;
  }

  // ── bots (QA) tap through the same tap(): smart reads the heat rings (only what a player sees: rings, the wind's
  // landing place, 멍뭉이's dug slip, the radar glow); random taps a random place whenever 몽글이 stands still
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 2.5 && this.L.ui.panelOpen) { this._endT = 0; this.nextBtn?.press(); } return; }
    if (this.phase !== 'play') return;
    const W = this.L.world, me = this.me;
    const tapAt = s => { const p = W.toScreen(s.anchor); this.tap(p.x, p.y); };
    if (mode === 'random') {
      if (me.state !== 'idle') { this._rt = rnd(.15, .45); return; }
      if ((this._rt = (this._rt ?? .3) - dt) > 0) return;
      this._rt = rnd(.15, .45); tapAt(pick(this.spots)); return;
    }
    // smart: a dug slip or the radar's gold beats everything (even mid-walk); otherwise wait until 몽글이 is free
    const dug = this.slips.find(s => s.state === 'dug');
    const here = this.radar > 0 ? this.spots.filter(s => s.lvl === 'here').sort((a, b) => this.dist(a) - this.dist(b))[0] : null;
    const urgent = dug?.spot || here;
    if (urgent && me.target !== urgent && me.state !== 'search' && me.state !== 'cheer') { tapAt(urgent); return; }
    if (me.state !== 'idle') return;
    if ((this._bt = (this._bt || 0) - dt) > 0) return; this._bt = .12;
    // the wind's landing place, watched
    const landed = this.slips.find(s => (s.state === 'flying' || (s.state === 'hidden' && this.t - s.t0 < 4 && s.blown)) && s.spot !== this.rival.at);
    let best = null, bs = -1e9;
    const marks = this.spots.filter(s => s.mark && s.lvl);
    for (const c of this.spots) {
      if (c.mark || c === this.rival.at) continue;
      let sc = 0;
      for (const m of marks) {
        const d = Math.hypot(c.c.x - m.c.x, c.c.z - m.c.z), i = HEAT.findIndex(h => h.k === m.lvl), lo = i > 0 ? HEAT[i - 1].max : 0, hi = HEAT[i].max;
        if (d < lo - .05) sc -= 6; else if (d <= hi + .05) sc += m.lvl === 'hot' ? 3 : m.lvl === 'warm' ? 1.6 : .6;
      }
      sc -= this.dist(c) * .25;
      if (this.rival.target === c && this.rival.path.length < 3) sc -= 2;
      if (landed && landed.spot === c) sc += 20;
      if (sc > bs) { bs = sc; best = c; }
    }
    if (best) tapAt(best);
  }
  dist(s) { const p = this.me.ch.root.position; return Math.hypot(p.x - s.c.x, p.z - s.c.z); }
  state() { return { scene: 'picnic', lv: this.lvIdx + 1, phase: this.phase, result: this.result || null, found: this.found || 0, score: this.score || 0, rival: this.rivalPts || 0, left: +(this.left || 0).toFixed(1), streak: this.streak || 0, radar: +(this.radar || 0).toFixed(1), pool: this.poolLeft, me: this.me?.state }; }
  get api() { return { finish: () => { this.left = 0; }, gust: () => this.gust(), sniff: () => { this.dogT = 0; }, radar: () => this.startRadar(), slips: () => this.slips.filter(s => s.state !== 'taken').map(s => s.spot.idx) }; }
}

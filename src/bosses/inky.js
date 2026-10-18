// 잉키의 바꿔치기 (remake) — a 35-second break between stages. 먹물이 the colour thief has drained the room (the 흑백판 grey)
// and turns itself into one more household thing — a third chair, an extra lamp, a teddy that wasn't there — "찾아봐~ 메롱".
// Every few seconds the fake gives itself away: two pink eyes blink open, it wiggles, ink drips off it, it giggles; its
// colours are a little off (ink-purple, three paint specks). Tap it: "들켰다~!" — an ink splat, 먹물이 pops out flailing and
// vanishes in a puff, and a burst of ink puffs (only one of them real) hides where it went next. Each find brings a bit of
// colour back. Wrong pick: the real thing talks back ("나 진짜 화분이거든?"), −2 s, the screen shakes and 먹물이 giggles
// somewhere ("메롱~"). Spice: five in a row = 피버타임 (the fake glows, ×2); a golden 먹물이 (+3, quick); two 먹물이 at once
// late on (new card); in the last room it also steals the colour of real things — grey 'fake fakes' (new card); three
// wild taps make 몽글이 dizzy. Finish: "다 들켰네… 색깔 돌려줄게!" and the room bursts back into full colour.
import * as THREE from 'three';
import { Room } from '../room.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { makeFurniture, FURN_INFO } from '../gfx/furniture.js';
import { buildItem, ITEMS } from '../gfx/items.js';
import { Tweens, clamp, lerp, ease } from '../util.js';
import { disposeTree, sph, cyl, put } from '../gfx/kit.js';
import { tr } from '../i18n.js';

const PI = Math.PI;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
const WARM = { ambColor: '#ffeedd', amb: 1.5, sunColor: '#fff4e0', sun: 2.3 };
const INKS = ['#2e2838', '#43355e', '#5b4590', '#2e2838'];
const PAINT = ['#ff7fb0', '#ffd23f', '#7fd6c0', '#8fd3ff', '#b98cff', '#ff9b52'];
const TINT = new THREE.Color('#cdb6ff'), GOLD = new THREE.Color('#ffe066'), WHITE = new THREE.Color('#ffffff');
const ITEM_S = 2.1;            // small things are drawn bigger than in the stages so they read (and take a tap) on a phone
const INKY_S = 1.25;
const GRAY0 = .8, GRAY_MIN = .3, GRAY_STEP = .035;   // a bit stays grey until the finale, so the colour burst always pays off   // how much colour 먹물이 has taken (the engine's 흑백판 post), and what each find brings back
const NAME = { plant: '화분', floorlamp: '조명', lamp: '스탠드', stool: '의자', stool2: '의자', trash: '휴지통', beanbag: '빈백', teddy: '곰인형', books: '책', pot: '화분',
  duck: '오리', mug: '컵', ball: '공', block: '블록', yarn: '털실', laundrybasket: '빨래 바구니', zabuton: '방석', bookshelf: '책장', sofa2: '소파', drawers: '서랍장', table: '탁자',
  recordcab: '레코드장', tvlow: 'TV장', fridge: '냉장고', counter: '찬장', dishcab: '그릇 찬장', kitchentable: '식탁', bed: '침대', wardrobe: '옷장', desk: '책상', chest: '장난감 상자',
  catbowls: '밥그릇', kimchifridge: '김치냉장고', monstera: '화분', plantbig: '큰 화분', apple: '사과', milk: '우유', gift: '선물상자', star: '별', heart: '하트', snackcart: '간식 카트' };
const nameOf = k => NAME[k] || FURN_INFO[k]?.name || ITEMS[k]?.name || '물건';
const jo = w => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? '이' : ''; };   // 화분이거든 / 의자거든
const REAL = [n => `나 진짜 ${n}${jo(n)}거든?`, n => `난 그냥 ${n}${jo(n)}야!`, n => `진짜 ${n}${jo(n)}라니까~`];
const FOUND = ['들켰다~!', '으앗, 들켰다!', '칫, 눈치 빠르네?', '어떻게 알았어?!', '다음엔 못 찾을걸~', '히잉, 또 들켰어'];
const MEH = ['메롱~', '킥킥, 거기 아니지롱~', '틀렸지롱~ 메롱'];
// where the eyes open on each kind (fraction of its height) — on the pot, not in the leaves; on the lamp shade
const EYE_Y = { plant: .5, monstera: .45, floorlamp: .8, lamp: .7, stool: .55, stool2: .5, trash: .55, teddy: .62, duck: .55, books: .9, pot: .38, mug: .6, ball: .55, beanbag: .55, laundrybasket: .55 };
const ITEM_FLOOR = new Set(['teddy', 'ball', 'duck', 'books']);   // things that may sit on the floor; cups and little pots only go on tops
const TOPS = new Set(['table', 'drawers', 'chest', 'recordcab', 'kotatsu', 'counter', 'kitchentable', 'desk', 'sofa2', 'tvlow', 'diningset', 'bed']);

// three rooms (one comes round each break): more lookalikes and quieter tells as they go; two 먹물이 at once late in the
// second; colour-stolen 'fake fakes' in the third
const LEVELS = [
  { name: '곰돌이네 거실', theme: 'bear', time: 35, puffs: 2, first: [.7, 1.05], gap: [1.0, 1.45], eyeDur: .95, two: 0, grey: 0, stars: [5, 10, 16],
    layout: { w: 5, d: 5, wallH: 2.6, walls: { N: 'wall', W: 'wall' },
      furniture: [F('bookshelf', 0, 0, 0, { seed: 11 }), F('sofa2', 1, 0), F('floorlamp', 3, 0), F('recordcab', 4, 0), F('drawers', 0, 2, 1), F('rug', 1, 2), F('table', 2, 2), F('tvlow', 2, 4, 2)],
      decor: [D('window', 'N', -.9), D('picture', 'N', 1.5), D('catclock', 'W', -1.4), D('window', 'W', 1.0)] },
    props: [['plant', 0, 1], ['plant', 4, 2], ['stool', 3, 2, 3], ['teddy', 'on', 0, 2], ['books', 'on', 2, 2], ['teddy', 'on', 1, 0], ['floorlamp', 0, 4]],
    kinds: ['plant', 'stool', 'teddy', 'books', 'floorlamp'] },
  { name: '냥냥이네 부엌', theme: 'cat', time: 35, puffs: 3, first: [.85, 1.25], gap: [1.15, 1.7], eyeDur: .8, two: 13, grey: 0, stars: [6, 13, 20],
    layout: { w: 5, d: 5, wallH: 2.6, walls: { N: 'wall', W: 'wall' },
      furniture: [F('fridge', 0, 0), F('counter', 1, 0, 0, { variant: 'stove' }), F('counter', 2, 0), F('dishcab', 3, 0), F('counter', 0, 2, 1), F('kitchentable', 2, 2), F('catbowls', 4, 4)],
      decor: [D('wallrack', 'N', .2), D('window', 'N', 2.0), D('catclock', 'W', -1.0), D('window', 'W', 1.2)] },
    props: [['plant', 4, 0], ['stool2', 2, 3, 2], ['stool2', 3, 1], ['pot', 'on', 2, 0], ['mug', 'on', 2, 2], ['mug', 'on', 0, 2], ['trash', 0, 4], ['pot', 'on', 3, 2], ['plant', 4, 2]],
    kinds: ['plant', 'stool2', 'pot', 'mug', 'trash'] },
  { name: '토순이네 침실', theme: 'bunny', time: 35, puffs: 3, first: [.95, 1.35], gap: [1.25, 1.8], eyeDur: .7, two: 15, grey: 5, stars: [6, 14, 22],
    layout: { w: 5, d: 5, wallH: 2.6, walls: { N: 'wall', W: 'wall' },
      furniture: [F('bed', 0, 0), F('wardrobe', 1, 0), F('drawers', 2, 0), F('desk', 3, 0), F('rug', 1, 2), F('chest', 0, 3, 1), F('beanbag', 3, 2)],
      decor: [D('window', 'N', .0), D('posterwall', 'N', 1.9), D('catclock', 'W', .2), D('window', 'W', 1.6)] },
    props: [['teddy', 'on', 0, 1], ['duck', 'on', 2, 0], ['books', 'on', 3, 0], ['plant', 4, 1], ['ball', 2, 3], ['teddy', 1, 2], ['duck', 'on', 0, 3], ['teddy', 'on', 4, 0], ['ball', 4, 3]],
    kinds: ['teddy', 'duck', 'books', 'plant', 'ball'] },
];

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.agents = []; this.props = []; this.pool = []; this.cands = []; this.junk = []; }
  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx];
    this.addCss();
    const app = document.getElementById('app'); app.classList.add('ik');
    const T = this.T = THEMES[LV.theme];
    L.setBg(T.bg || ['#fff6e6', '#ffe9cc']); W.setLight(WARM);
    const room = this.room = new Room(W, { ...LV.layout, theme: T }); W.root.add(room.group);
    room.group.updateMatrixWorld(true);
    // 몽글이 the seeker, in the front corner looking into the room
    const R = this.room, mp = R.tileToWorld(R.w - 1, R.d - 1);
    const me = this.me = new Char('mong'); me.root.position.set(mp.x + 1.05, 0, mp.z + 1.05); me.root.scale.setScalar(1.45); me.root.userData.colored = true; W.root.add(me.root);
    me.root.rotation.y = PI / 4 + .45; me.pose = 'search';   // toward the camera (yaw π/4), half turned to the room
    this.buildSlots();
    this.buildProps();
    for (const k of LV.kinds) for (let n = 0; n < 2; n++) this.pool.push(this.buildFake(k));
    this.cands = [...R.furns.filter(r => r.type !== 'rug').map(r => this.cand(r.type, r.f.group, false)), ...this.props];
    this.frame();
    L.makeThumbs({ faces: [['inky', 'happy'], ['inky', 'wow'], ['inky', 'sus']] });
    this.score = 0; this.combo = 0; this.best = 0; this.found = 0; this.fever = 0; this.fevers = 0; this.dizzy = 0; this.misses = [];
    this.left = LV.time; this.result = null; this.phase = 'intro';
    this.goldenAt = rnd(10, 17); this.goldenDone = false; this.nextGrey = LV.grey || 1e9; this.gray = GRAY0;
    if (W.post) W.post.u.gray.value = this.gray;
    this.buildHud();
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    this.ready = true;
    // the dare: 먹물이 in the middle of the room, then "뿅!"
    const a = this.newAgent(), s0 = this.introSpot();
    a.char.root.position.set(s0.x, s0.y, s0.z); a.char.root.visible = true; a.char.root.scale.setScalar(INKY_S); a.char.root.rotation.y = PI / 4;
    a.char.pose = 'hips'; a.char.setFace('happy');
    await this.tw.wait(.35); if (this.dead) return;
    L.say(a.char, '내가 뭘로 변할까~? 찾아봐, 메롱!', 1500); L.audio.sfx('giggle');
    await this.tw.wait(1.45); if (this.dead) return;
    await this.vanish(a); if (this.dead) return;
    this.phase = 'play';
    this.disguise(a);
  }
  addCss() {
    if (document.getElementById('ik-css')) return;
    const l = document.createElement('link'); l.id = 'ik-css'; l.rel = 'stylesheet'; l.href = new URL('./inky.css', import.meta.url).href; document.head.append(l);
  }
  frame() {
    const W = this.L.world;
    W.home.set(.15, .35, .25); W.target.copy(W.home); W.yaw = PI / 4; W.pitch = .9; W.zoom = 1;
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(7.35, 6.4, .5);
  }

  // ── the room: free floor tiles and table tops 먹물이 can stand on, the real things, and its disguises
  buildSlots() {
    const R = this.room, occ = new Set();
    for (const r of R.furns) { if (r.type === 'rug') continue; const [fw, fd] = R.footprint(r.type, r.rot); for (let a = 0; a < fw; a++) for (let b = 0; b < fd; b++) occ.add(`${r.i + a},${r.j + b}`); }
    const slots = this.slots = [];
    for (let j = 0; j < R.d; j++) for (let i = 0; i < R.w; i++) {
      const id = `${i},${j}`; if (occ.has(id) || R.isCut(i, j)) continue;
      const p = R.tileToWorld(i, j); slots.push({ id, i, j, x: p.x, y: 0, z: p.z, top: false, used: null });
    }
    const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), o = new THREE.Vector3();
    for (const r of R.furns) {
      if (!TOPS.has(r.type)) continue;
      const [fw, fd] = R.footprint(r.type, r.rot);
      for (let a = 0; a < fw; a++) for (let b = 0; b < fd; b++) {
        const p = R.tileToWorld(r.i + a, r.j + b); ray.set(o.set(p.x, 4, p.z), down);
        const hit = ray.intersectObject(r.f.group, true).find(h => h.object.visible && !h.object.userData.proxy);
        if (hit && hit.point.y > .2 && hit.point.y < .8) slots.push({ id: `t${r.i + a},${r.j + b}`, i: r.i + a, j: r.j + b, x: p.x, y: hit.point.y, z: p.z, top: true, used: null });
      }
    }
  }
  slotAt(i, j, top) { return this.slots.find(s => s.i === i && s.j === j && s.top === !!top); }
  // a thing in its own outline group (fakes are built the same way, so a fake and the real one read alike)
  makeThing(kind) {
    const holder = new THREE.Group(), body = new THREE.Group(); body.userData.og = body; holder.add(body);
    const item = !!ITEMS[kind] && !FURN_INFO[kind];
    const obj = item ? buildItem(kind, { v: Math.floor(Math.random() * 4) }) : makeFurniture(kind, this.T).group;
    if (item) obj.scale.setScalar(ITEM_S);
    body.add(obj);
    const box = new THREE.Box3(); holder.updateMatrixWorld(true);
    obj.traverse(m => { if (m.isMesh && !m.userData.proxy && m.visible) box.expandByObject(m); });
    return { kind, item, holder, body, obj, box, h: box.max.y };
  }
  faceRot(kind, item) { return item ? PI / 4 + rnd(-.5, .5) : pick([0, -PI / 2]); }
  buildProps() {
    const W = this.L.world;
    for (const [kind, a, b, c] of this.lv.props) {
      const top = a === 'on', s = top ? this.slotAt(b, c, true) : this.slotAt(a, b, false);
      if (!s || s.used) continue;
      const th = this.makeThing(kind);
      th.holder.position.set(s.x, s.y, s.z); th.holder.rotation.y = top || th.item ? PI / 4 + rnd(-.45, .45) : (c != null ? c * PI / 2 : this.faceRot(kind, false));
      W.root.add(th.holder); s.used = 'prop';
      this.props.push(this.cand(kind, th.holder, true, th));
    }
  }
  cand(kind, group, prop, th = null) {
    const box = th ? null : new THREE.Box3().setFromObject(group);
    const c = { kind, name: nameOf(kind), group, prop, th, h: th ? th.h : box.max.y - group.position.y, grey: false };
    group.userData.ikCand = c;
    c.say = { root: group, headTop: () => c.h };
    return c;
  }
  // a pooled disguise: tinted copy + googly eyes + paint specks + an ink drop and its puddle (hidden until used)
  buildFake(kind) {
    const W = this.L.world, th = this.makeThing(kind), f = { ...th, busy: false, mats: [] };
    f.obj.traverse(m => {
      if (!m.isMesh || m.userData.proxy) return;
      const base = m.material; if (Array.isArray(base)) return;
      const c = base.clone(); m.material = c; f.mats.push({ m: c, base: base.color.clone() });
    });
    const eye = sx => {
      const g = new THREE.Group(); g.userData.og = g;
      g.add(put(sph(.125, '#ffffff'), 0, 0, 0, 0, 0, 0, [1, 1.18, .55]));
      const iris = put(sph(.075, '#ff5a8a'), 0, -.014, .062, 0, 0, 0, [1, 1.12, .45]); g.add(iris);
      iris.add(put(sph(.046, '#2e2838'), 0, 0, .035, 0, 0, 0, [1, 1, .6]));
      iris.add(put(sph(.02, '#ffffff'), .026, .03, .06));
      g.position.x = sx * .13; g.userData.iris = iris; return g;
    };
    f.eyes = [eye(-1), eye(1)]; f.eyesG = new THREE.Group(); f.eyesG.add(...f.eyes); f.eyesG.userData.colored = true; f.eyesG.visible = false; f.holder.add(f.eyesG);
    f.specks = new THREE.Group(); f.specks.userData.colored = true; f.holder.add(f.specks);
    for (let k = 0; k < 3; k++) f.specks.add(put(sph(.034, PAINT[k]), 0, 0, 0, 0, 0, 0, [1, .8, .5]));
    f.drop = put(sph(.065, '#3b2a5a'), 0, 0, 0, 0, 0, 0, [1, 1.35, 1]); f.drop.userData.colored = true; f.drop.visible = false; f.holder.add(f.drop);
    f.puddle = put(cyl(.19, .19, .014, '#3b2a5a'), 0, .008, 0); f.puddle.userData.colored = true; f.puddle.visible = false; f.puddleT = 0; f.holder.add(f.puddle);
    f.say = { root: f.holder, headTop: () => f.h };
    f.holder.visible = false; W.root.add(f.holder);
    return f;
  }
  tintFake(f, mode) {
    const col = mode === 'gold' ? GOLD : TINT;
    for (const { m, base } of f.mats) { m.color.copy(base).multiply(col); if (m.emissive) { m.emissive.set(mode === 'gold' ? '#ffb300' : '#000000'); m.emissiveIntensity = mode === 'gold' ? .22 : 0; } }
    const colored = mode === 'gold' || mode === 'glow';
    if (f.body.userData.colored !== colored) { f.body.userData.colored = colored; this.L.world.idsDirty = true; }
  }
  // eyes and specks go on the side that faces the camera (a ray onto the thing itself, so they sit on its surface)
  dressFake(f) {
    const W = this.L.world, hp = f.holder.position;
    f.holder.updateMatrixWorld(true);
    const fw = new THREE.Vector3(); W.cam.getWorldDirection(fw);
    const toCam = new THREE.Vector3(-fw.x, 0, -fw.z).normalize();
    const ray = new THREE.Raycaster(), meshes = []; f.obj.traverse(m => { if (m.isMesh && !m.userData.proxy) meshes.push(m); });
    const c = f.box.getCenter(new THREE.Vector3()), r = Math.max(f.box.max.x - f.box.min.x, f.box.max.z - f.box.min.z);
    const onSurface = (yLocal, side = 0) => {
      const sideV = new THREE.Vector3(-toCam.z, 0, toCam.x).multiplyScalar(side);
      const local = new THREE.Vector3(c.x, yLocal, c.z).applyAxisAngle(Y, f.holder.rotation.y);
      const target = new THREE.Vector3(hp.x + local.x, hp.y + yLocal, hp.z + local.z).add(sideV);
      const from = target.clone().addScaledVector(toCam, r + 1.5).addScaledVector(fw, 0).setY(target.y);
      ray.set(from, toCam.clone().negate());
      const hit = ray.intersectObjects(meshes, false)[0];
      const p = hit ? hit.point : target.clone().addScaledVector(toCam, r * .45);
      return f.holder.worldToLocal(p.clone().addScaledVector(toCam, .04));
    };
    const ey = clamp(f.h * (EYE_Y[f.kind] ?? .58), .13, 1.25);
    f.eyesG.position.copy(onSurface(ey));
    const wp = f.eyesG.getWorldPosition(new THREE.Vector3()); f.eyesG.lookAt(wp.clone().sub(fw));
    const sides = [[-.16, .78], [.17, .5], [-.05, .28]];
    f.specks.children.forEach((s, k) => { const [sd, fy] = sides[k]; s.position.copy(onSurface(clamp(f.h * fy, .06, 1.3), sd * Math.min(1, r))); s.lookAt(s.getWorldPosition(new THREE.Vector3()).sub(fw)); });
    f.dropAt = onSurface(clamp(f.h * .55, .1, 1.1), .12);
    const tl = toCam.clone().applyAxisAngle(Y, -f.holder.rotation.y); f.puddleAt = new THREE.Vector3(f.dropAt.x + tl.x * .14, .008, f.dropAt.z + tl.z * .14);
  }

  // ── 먹물이
  newAgent() {
    const W = this.L.world, c = new Char('inky'); c.root.visible = false; c.root.userData.colored = true; W.root.add(c.root);
    const a = { char: c, state: 'gone', fake: null, slot: null, golden: false, last: [], idx: this.agents.length };
    this.agents.push(a); return a;
  }
  introSpot() { const R = this.room, c = this.slots.filter(s => !s.top && !s.used).sort((p, q) => Math.hypot(p.x, p.z) - Math.hypot(q.x, q.z)); return c[0] || { x: 0, y: 0, z: 0 }; }
  // jump, spin and shrink into a puff
  async vanish(a) {
    const W = this.L.world, c = a.char, r0 = c.root.rotation.y, y0 = c.root.position.y;
    c.pose = 'cheer';
    await this.tw.run(.2, k => { c.body.position.y = .55 * k; c.root.rotation.y = r0 + k * PI * 2; c.root.scale.setScalar(INKY_S * (1 - k * .8)); }, ease.inQuad);
    if (this.dead) return;
    if (this.phase === 'end') { c.root.scale.setScalar(INKY_S); c.body.position.y = 0; c.faceTo(W.cam.position.x, W.cam.position.z); return; }   // time ran out mid-vanish: stay for the finale
    const s = W.toScreen(c.root.position.clone().setY(y0 + .75)); this.puff(s.x, s.y);
    this.L.audio.sfx('pop', 3);
    c.root.visible = false; c.body.position.y = 0; c.root.scale.setScalar(INKY_S);
  }
  // pick the next thing to become: a kind already in the room (so it's a lookalike), somewhere free, never twice in a row
  chooseSpot(a) {
    const taken = new Set(this.agents.filter(o => o !== a && o.slot).map(o => o.slot.id));
    const free = this.slots.filter(s => !s.used && !taken.has(s.id) && !a.last.includes(s.id));
    shuffle(free);
    for (const s of free) {
      const kinds = shuffle(this.pool.filter(f => !f.busy && (s.top ? f.item : !f.item || ITEM_FLOOR.has(f.kind)) && f.kind !== a.lastKind).map(f => f.kind));
      if (!kinds.length) continue;
      const f = this.pool.find(q => !q.busy && q.kind === kinds[0]);
      return { slot: s, fake: f };
    }
    return null;
  }
  disguise(a) {
    const W = this.L.world, LV = this.lv, p = this.chooseSpot(a);
    if (!p) { a.state = 'gone'; a.retry = this.t + .3; return; }
    a.state = 'moving'; a.slot = p.slot; a.fake = p.fake; p.fake.busy = true; p.slot.used = 'ink';
    a.last = [p.slot.id, ...a.last].slice(0, 3); a.lastKind = p.fake.kind;
    // a burst of ink puffs: one is where it went, the others hide it
    const n = this.fever > 0 ? 1 : LV.puffs, others = shuffle(this.slots.filter(s => s !== p.slot && Math.hypot(s.x - p.slot.x, s.z - p.slot.z) > 1.1)).slice(0, n);
    const spots = shuffle([p.slot, ...others]);
    spots.forEach((s, i) => this.tw.wait(i * .07).then(() => {
      if (this.dead) return;
      const sc = W.toScreen(new THREE.Vector3(s.x, s.y + .35, s.z)); this.puff(sc.x, sc.y);
      if (s === p.slot) this.tw.wait(.08).then(() => this.showFake(a));
    }));
    this.L.audio.sfx('whoosh');
  }
  showFake(a) {
    const f = a.fake, s = a.slot, LV = this.lv;
    if (this.dead || !f) return;
    if (this.phase !== 'play') { this.release(a); return; }
    f.holder.position.set(s.x, s.y, s.z); f.holder.rotation.set(0, this.faceRot(f.kind, f.item), 0); f.holder.scale.setScalar(1);
    a.golden = !this.goldenDone && this.goldenPending; if (a.golden) { this.goldenDone = true; this.goldenPending = false; }
    this.tintFake(f, a.golden ? 'gold' : this.fever > 0 ? 'glow' : 'ink');
    this.dressFake(f);
    f.eyesG.visible = false; f.drop.visible = false; f.puddle.visible = false; f.puddleT = 0;
    f.holder.visible = true;
    const W = this.L.world; W.idsDirty = true; W.shadowDirty = true;
    a.state = 'hidden'; a.hiddenAt = this.t; a.firstTell = null; a.tells = 0; a.dirty = false; a.noticeS = null; a.tell = null; a.taunted = false; a.notice = rnd(.35, .6);
    a.nextTell = this.t + rnd(LV.first[0], LV.first[1]) * (this.fever > 0 ? .4 : 1);
    if (a.golden) { const sc = W.toScreen(new THREE.Vector3(s.x, s.y + f.h + .2, s.z)); this.L.ui.floatText(sc.x, sc.y - 10, '반짝!', 'gold'); this.L.audio.sfx('star'); }
  }
  release(a) {
    const f = a.fake;
    if (f) { this.resetTell(a); f.holder.visible = false; f.busy = false; f.holder.rotation.z = 0; f.holder.scale.setScalar(1); }
    if (a.slot) a.slot.used = null;
    a.fake = null; a.slot = null;
  }

  // ── tells: eyes blink open, a wiggle, an ink drip, a giggle; quicker and bolder the longer it stays unfound
  startTell(a) {
    const LV = this.lv, since = this.t - a.hiddenAt;
    let type = pick(['eyes', 'eyes', 'eyes', 'wiggle', 'wiggle', 'drip', 'drip', 'giggle']);
    if (a.tells === 0) type = pick(['eyes', 'eyes', 'wiggle']);
    const bold = since > 4.5;
    if (bold && !a.taunted) { a.taunted = true; type = 'eyes'; this.L.say(a.fake.say, pick(['여기 있는데~', '아직도 몰라?', '히히, 못 찾겠지?']), 900); this.L.audio.sfx('giggle'); }
    const dur = type === 'eyes' ? LV.eyeDur : type === 'wiggle' ? .5 : type === 'drip' ? .75 : .7;
    a.tell = { type, t: 0, dur };
    a.tells++; if (a.firstTell == null) a.firstTell = this.t;
    const g = rnd(LV.gap[0], LV.gap[1]) * (bold ? .55 : 1) * (this.fever > 0 ? .6 : 1);
    a.nextTell = this.t + dur + g;
    if (type === 'giggle') { this.L.say(a.fake.say, pick(['키득', '히히', '킥킥']), 650); this.L.audio.sfx('giggle'); }
    if (type === 'drip') { a.fake.puddleT = 0; }
    if (type === 'wiggle') this.sfxWord(a.fake, '꿈틀', a.fake.h + .15);
  }
  stepTell(a, dt) {
    const f = a.fake, T = a.tell; T.t += dt;
    const k = clamp(T.t / T.dur, 0, 1), env = Math.sin(k * PI);
    if (T.type === 'eyes') {
      const o = T.t < .08 ? T.t / .08 : T.t > T.dur - .08 ? (T.dur - T.t) / .08 : Math.abs(k - .55) < .05 ? .12 : 1;
      this.eyesOpen(f, o, Math.sin(this.t * 7) * .022);
    } else if (T.type === 'wiggle' || T.type === 'giggle') {
      const amp = T.type === 'wiggle' ? 1 : .55;
      f.holder.rotation.z = Math.sin(T.t * 42) * .1 * env * amp; f.holder.scale.set(1, 1 + Math.sin(T.t * 21) * .06 * env * amp, 1);
    } else if (T.type === 'drip') {
      const d = f.drop, p = f.dropAt;
      if (T.t < .15) { d.visible = true; d.position.copy(p); d.scale.set(1, 1.35, 1).multiplyScalar(Math.max(.01, T.t / .15)); }
      else if (T.t < .5) { const q = (T.t - .15) / .35, P = f.puddleAt; d.position.set(lerp(p.x, P.x, q), p.y * (1 - q * q) + .03 * q * q, lerp(p.z, P.z, q)); d.scale.set(.9, 1.6, .9); }
      else {
        if (!T.landed) { T.landed = true; this.sfxWord(f, '뚝', .05); }
        d.visible = false; f.puddle.visible = true; f.puddle.position.copy(f.puddleAt); f.puddleT = 2.4; const q = clamp((T.t - .5) / .15, 0, 1); f.puddle.scale.set(q, 1, q);
      }
    }
    if (T.t >= T.dur) { this.resetTell(a, true); a.tell = null; }
  }
  resetTell(a, keepPuddle = false) {
    const f = a.fake; if (!f) return;
    f.holder.rotation.z = 0; f.holder.scale.setScalar(1); f.drop.visible = false; this.eyesOpen(f, 0);
    if (!keepPuddle) { f.puddle.visible = false; f.puddleT = 0; }
  }
  eyesOpen(f, o, look = 0) {
    f.eyesG.visible = o > .02;
    for (const e of f.eyes) { e.scale.set(1, Math.max(.05, o), 1); e.userData.iris.position.x = look; }
  }
  stepAgent(a, dt) {
    const f = a.fake;
    if (a.state === 'gone' && a.retry && this.t > a.retry && this.phase === 'play') { a.retry = 0; this.disguise(a); }
    if (!f || a.state !== 'hidden') return;
    if (f.puddleT > 0) { f.puddleT -= dt; if (f.puddleT < .3) { const q = Math.max(.01, f.puddleT / .3); f.puddle.scale.set(q, 1, q); if (f.puddleT <= 0) f.puddle.visible = false; } }
    if (this.phase !== 'play') return;
    if (a.tell) this.stepTell(a, dt);
    else if (this.t >= a.nextTell) this.startTell(a);
    // 피버타임: the fake glows and keeps its eyes open
    if (this.fever > 0 && !a.tell) { this.eyesOpen(f, (this.t % 1.1) < .1 ? .15 : 1, Math.sin(this.t * 5) * .02); }
    if (this.fever > 0 && !a.golden) for (const { m } of f.mats) if (m.emissive) { m.emissive.set('#9b6bff'); m.emissiveIntensity = .28 + Math.sin(this.t * 9) * .14; }
    // the golden one sparkles and doesn't stay long
    if (a.golden) {
      if ((a.spark = (a.spark || 0) - dt) <= 0) { a.spark = .4; const s = this.L.world.toScreen(f.holder.position.clone().setY(f.holder.position.y + f.h * .7)); this.L.world.fx.burst(s.x + rnd(-14, 14), s.y + rnd(-10, 10), { n: 3, shape: 'star', colors: ['#ffe14d', '#fff3a8', '#ffffff'], size: 10, speed: 70, life: .5, gravity: -40 }); }
      if (this.t - a.hiddenAt > 3.8) { this.L.say(f.say, '메롱~ 황금은 빠르지롱!', 900); this.L.audio.sfx('giggle'); a.golden = false; this.release(a); this.disguise(a); }
    }
  }

  // ── taps
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => { if (e.button > 0 || this.result || this.phase !== 'play') return; this.tap(e.clientX, e.clientY); };
    app.addEventListener('pointerdown', this._down);
  }
  // the screen box of a hidden fake, a little padded (generous: a near miss on the right thing still counts)
  fakeHit(a, x, y) {
    const W = this.L.world, f = a.fake, b = f.box, v = new THREE.Vector3();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    f.holder.updateMatrixWorld(true);
    for (let i = 0; i < 8; i++) { v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(f.holder.matrixWorld); const s = W.toScreen(v); x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, pad = 12;
    if (x >= x0 - pad && x <= x1 + pad && y >= y0 - pad && y <= y1 + pad) return Math.hypot(x - cx, y - cy);
    const d = Math.hypot(x - cx, y - cy); return d < 46 ? d : null;
  }
  fakeCenter(a) { const f = a.fake, c = f.box.getCenter(new THREE.Vector3()); c.y = Math.max(c.y, .12); f.holder.updateMatrixWorld(true); return this.L.world.toScreen(c.applyMatrix4(f.holder.matrixWorld)); }
  tap(x, y) {
    const L = this.L, W = L.world;
    if (this.dizzy > 0) { L.audio.sfx('dizzy'); this.lastMiss = this.t; return; }
    let best = null, bd = 1e9;
    for (const a of this.agents) { if (a.state !== 'hidden') continue; const d = this.fakeHit(a, x, y); if (d != null && d < bd) { bd = d; best = a; } }
    if (best) return this.hit(best);
    // something real? (the first thing under the finger; a near miss counts as the nearest small thing)
    let c = null;
    for (const h of W.pick(x, y, [this.room.group, ...this.props.map(p => p.group)])) {
      for (let o = h.object; o && !c; o = o.parent) c = o.userData.ikCand || null;
      break;
    }
    if (!c) { let bd2 = 34; for (const p of this.props) { const s = W.toScreen(p.group.position.clone().setY(p.group.position.y + p.h * .5)), d = Math.hypot(s.x - x, s.y - y); if (d < bd2) { bd2 = d; c = p; } } }
    if (c) return this.wrong(c, x, y);
    this.whiff(x, y);
  }
  hit(a) {
    const L = this.L, W = L.world, f = a.fake, LV = this.lv;
    const pos = f.holder.position.clone(), golden = a.golden, sc = this.fakeCenter(a);
    const sharp = a.tells === 0 && !a.dirty && this.t - (this.lastMiss ?? -9) > 2.5 && !golden && this.fever <= 0;   // 눈썰미: spotted the new thing before it gave itself away
    this.release(a); a.state = 'out'; a.golden = false;
    const gain = ((golden ? 3 : 1) + (sharp ? 1 : 0)) * (this.fever > 0 ? 2 : 1);
    this.score += gain; this.found++; this.combo++; this.best = Math.max(this.best, this.combo);
    L.audio.sfx('pop', 2 + Math.min(10, this.combo)); L.audio.sfx(golden ? 'star' : 'found');
    // the ink splat and a little colour coming back
    this.splat(sc.x, sc.y);
    W.fx.burst(sc.x, sc.y, { n: golden ? 26 : 16, shape: 'circle', colors: golden ? ['#ffe14d', '#ffd23f', '#ffffff', '#ffb300'] : [...PAINT, '#2e2838', '#2e2838'], size: 13, speed: 300, life: .7, gravity: 520, up: 120 });
    W.fx.ring(sc.x, sc.y, { r: 70, color: golden ? '#ffd23f' : '#b98cff', width: 8, life: .45 });
    L.ui.floatText(sc.x, sc.y - 46, `+${gain}`, golden || sharp || this.fever > 0 ? 'gold big' : 'gold');
    if (sharp) { L.ui.floatText(sc.x, sc.y - 92, '눈썰미!', 'gold'); L.audio.sfx('star'); }
    this.setGray(Math.max(GRAY_MIN, this.gray - GRAY_STEP * (golden ? 2 : 1)));
    // 먹물이 pops out of it, flailing
    const c = a.char; c.root.visible = true; c.root.position.copy(pos); c.root.scale.setScalar(.01); c.root.rotation.set(0, 0, 0); c.faceTo(W.cam.position.x, W.cam.position.z);
    c.setFace(golden ? 'happy' : 'wow'); c.pose = 'flail';
    this.tw.run(.22, k => { c.root.scale.setScalar(INKY_S * Math.max(.01, k)); c.body.position.y = Math.sin(Math.min(1, k) * PI) * .3; }, ease.outBack);
    this.after(.14, () => L.say(c, golden ? '황금 먹물이다! +3' : pick(FOUND), 750));
    this.updCombo(); this.bump();
    if (this.combo === 5 && this.fever <= 0 && this.fevers < 2) this.startFever();
    this.me.pose = 'cheer'; this.me.setFace('happy'); this.after(.5, () => { this.me.pose = 'search'; this.me.setFace('normal'); });
    if (this.score > 0) this.hint.classList.add('gone');
    // faster each time: it hangs about less before it's off again
    const hold = this.fever > 0 ? .25 : lerp(.6, .3, clamp(this.found / 10, 0, 1));
    this.tw.wait(hold).then(async () => {
      if (this.dead || this.phase !== 'play') return;
      await this.vanish(a); if (this.dead || this.phase !== 'play') return;
      this.disguise(a);
    });
    L.log({ tap: 'hit', t: +this.t.toFixed(1), golden, sharp });
  }
  // the real thing talks back; somewhere, 먹물이 can't help giggling
  wrong(c, x, y) {
    const L = this.L;
    const grey = c.grey;
    this.left -= grey ? 1 : 2; this.combo = 0; this.updCombo();
    L.audio.sfx('locked'); L.audio.sfx('miss');
    L.say(c.say, grey ? `색만 뺏긴 진짜 ${c.name}${jo(c.name)}야 ㅠㅠ` : pick(REAL)(c.name), 1000, 'red');
    L.ui.floatText(x, y + 44, grey ? '-1초' : '-2초', 'red');
    document.getElementById('app').animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 280 });
    if (grey) this.ungrey(c);
    this.me.setFace('sweat'); this.after(.7, () => this.me.setFace('normal'));
    const a = this.agents.find(o => o.state === 'hidden');
    if (a) this.after(.45, () => { if (a.state === 'hidden' && a.fake) { L.say(a.fake.say, pick(MEH), 750); L.audio.sfx('giggle'); if (!a.tell) { a.tell = { type: 'giggle', t: 0, dur: .6 }; } } });
    this.miss();
    L.log({ tap: grey ? 'grey' : 'wrong', t: +this.t.toFixed(1), kind: c.kind });
  }
  whiff(x, y) { this.L.audio.sfx('tap', 4); this.L.ui.floatText(x, y - 20, '톡…', ''); this.miss(); }
  // three wild taps in a moment and 몽글이's head spins
  miss() {
    for (const a of this.agents) a.dirty = true; this.lastMiss = this.t;   // no 눈썰미 bonus for a lucky guess among wild taps
    this.misses = this.misses.filter(t => this.t - t < 1.3); this.misses.push(this.t);
    if (this.misses.length >= 3) {
      this.dizzy = 1.2; this.misses = []; this.combo = 0; this.updCombo();
      this.me.setFace('dizzy'); this.L.say(this.me, '눈이 핑핑~', 900); this.L.audio.sfx('dizzy');
      this.after(1.2, () => this.me.setFace('normal'));
    }
  }
  startFever() {
    const L = this.L; this.fever = 6; this.fevers++; L.audio.sfx('special'); L.audio.sfx('win');
    this.feverEl.classList.add('on'); L.ui.banner('피버타임!', '먹물이가 반짝반짝 · 점수 두 배', 1000);
    for (const a of this.agents) if (a.state === 'hidden' && !a.golden) this.tintFake(a.fake, 'glow');
  }
  endFever() {
    this.feverEl.classList.remove('on'); this.combo = 0; this.updCombo();
    for (const a of this.agents) if (a.fake && !a.golden) this.tintFake(a.fake, 'ink');
  }
  setGray(v) { this.gray = v; const u = this.L.world.post?.u.gray; if (u) this.tw.run(.45, k => { u.value = u.value + (v - u.value) * k; }, ease.outQuad); }

  // ── 'fake fakes' (third room): 먹물이 sucks the colour out of a real thing; grey looks suspicious, but it's real
  stealColour() {
    const L = this.L, W = L.world;
    const pool = this.props.filter(p => !p.grey);
    if (!pool.length || this.props.filter(p => p.grey).length >= 2) return;
    const c = pick(pool);
    this.grey(c);
    const s = W.toScreen(c.group.position.clone().setY(c.group.position.y + c.h * .6));
    W.fx.burst(s.x, s.y, { n: 10, shape: 'circle', colors: ['#8d8799', '#b9b3c4', '#6f6a7a'], size: 9, speed: 120, life: .5, gravity: -60 });
    L.audio.sfx('swish');
    if (!this.greyCard) { this.greyCard = true; this.card('face_inky_sus', '새로 나왔다!', '회색 물건은 진짜야, 속지 마!'); }
  }
  grey(c) {
    c.grey = true;
    if (!c.greyed) {
      c.greyed = [];
      c.th.obj.traverse(m => {
        if (!m.isMesh || m.userData.proxy || Array.isArray(m.material)) return;
        const g0 = m.geometry, m0 = m.material, mg = m0.clone(), l = c => c.r * .299 + c.g * .587 + c.b * .114;
        const lum = l(m0.color) * .9 + .05; mg.color.setRGB(lum, lum, lum);
        let g1 = g0;
        if (g0.attributes.color) { g1 = g0.clone(); const a = g1.attributes.color; for (let i = 0; i < a.count; i++) { const v = a.getX(i) * .299 + a.getY(i) * .587 + a.getZ(i) * .114; a.setXYZ(i, v * .95 + .04, v * .95 + .04, v * .95 + .04); } a.needsUpdate = true; this.junk.push(g1); }
        this.junk.push(mg);
        c.greyed.push({ m, g0, m0, g1, mg });
      });
    }
    for (const q of c.greyed) { q.m.geometry = q.g1; q.m.material = q.mg; }
  }
  ungrey(c) {
    c.grey = false; for (const q of c.greyed || []) { q.m.geometry = q.g0; q.m.material = q.m0; }
    const W = this.L.world, s = W.toScreen(c.group.position.clone().setY(c.group.position.y + c.h * .6));
    W.fx.burst(s.x, s.y, { n: 12, shape: 'circle', colors: PAINT, size: 9, speed: 160, life: .5 });
  }
  // two at once: 먹물이 splits ("분신술!")
  spawnSecond() {
    const L = this.L, a = this.newAgent();
    if (this.lvIdx === 1) this.card('face_inky_happy', '새로 나왔다!', '분신술! 둘이 숨었어', true);
    else L.ui.banner('먹물이가 둘!', '분신술~ 둘 다 찾아!', 900);
    L.audio.sfx('gasp');
    this.disguise(a);
  }
  card(img, t1, t2, two = false) {
    const L = this.L, h = L.h;
    const pics = two ? [h('img', { src: L.thumbs[img] }), h('img', { src: L.thumbs[img], class: 'ik-flip' })] : [h('img', { src: L.thumbs[img] })];
    const c = h('div', { class: 'ik-get' }, h('div', { class: 'ik-get-pics' }, ...pics), h('div', {}, h('div', { class: 'ik-get-t ol' }, t1), h('div', { class: 'ik-get-s' }, t2)));
    document.getElementById('app').append(c); L.audio.sfx('gasp');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2600);
  }

  // ── juice (DOM in the world-label layer, so the HUD stays on top and ui.clear() takes it away)
  puff(x, y) {
    const h = this.L.h, el = h('div', { class: 'ik-puff', style: `left:${x}px;top:${y}px` });
    el.innerHTML = '<svg viewBox="-50 -50 100 100"><g stroke="#2a1a3d" stroke-width="4"><circle cx="-18" cy="6" r="20" fill="#4a3d63"/><circle cx="18" cy="8" r="19" fill="#4a3d63"/><circle cx="0" cy="-12" r="23" fill="#54467a"/><circle cx="-6" cy="16" r="18" fill="#4a3d63"/><circle cx="14" cy="-4" r="16" fill="#54467a"/></g><g fill="#4a3d63"><circle cx="-18" cy="6" r="17"/><circle cx="18" cy="8" r="16"/><circle cx="0" cy="-12" r="20"/><circle cx="-6" cy="16" r="15"/><circle cx="14" cy="-4" r="13"/></g><circle cx="-8" cy="-20" r="6" fill="#8f7fc0"/><circle cx="-30" cy="-14" r="4" fill="#ff7fb0"/><circle cx="32" cy="-12" r="3.5" fill="#ffd23f"/><circle cx="28" cy="24" r="3.5" fill="#7fd6c0"/></svg><b>뿅!</b>';
    this.L.ui.wui.append(el); setTimeout(() => el.remove(), 600);
  }
  splat(x, y) {
    const h = this.L.h, el = h('div', { class: 'ik-splat', style: `left:${x}px;top:${y}px` });
    let d = ''; const n = 11;
    for (let i = 0; i <= n; i++) { const a = i / n * PI * 2, r = i % 2 ? 26 + Math.random() * 6 : 36 + Math.random() * 10, x1 = Math.cos(a) * r, y1 = Math.sin(a) * r; d += (i ? 'L' : 'M') + x1.toFixed(1) + ' ' + y1.toFixed(1); }
    const drops = Array.from({ length: 6 }, (_, i) => { const a = Math.random() * PI * 2, r = 44 + Math.random() * 10; return `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(Math.sin(a) * r).toFixed(1)}" r="${(4 + Math.random() * 4).toFixed(1)}" fill="${i % 2 ? PAINT[i % PAINT.length] : '#2e2838'}"/>`; }).join('');
    el.innerHTML = `<svg viewBox="-60 -60 120 120"><path d="${d}Z" fill="#2e2838" stroke="#2e2838" stroke-width="10" stroke-linejoin="round"/><circle cx="-10" cy="-8" r="7" fill="#ff7fb0"/><circle cx="12" cy="6" r="6" fill="#ffd23f"/><circle cx="-2" cy="14" r="5" fill="#7fd6c0"/>${drops}</svg>`;
    this.L.ui.wui.append(el); setTimeout(() => el.remove(), 750);
  }
  // a little comic sound word by a thing (꿈틀, 뚝)
  sfxWord(f, text, y) {
    const W = this.L.world, s = W.toScreen(f.holder.position.clone().setY(f.holder.position.y + y));
    this.L.ui.floatText(s.x + 22, s.y - 6, text, 'ik-sfx');
  }
  after(s, fn) { this.tw.wait(s).then(() => { if (!this.dead) fn(); }); }

  // ── HUD
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col(), LV = this.lv;
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, '먹물이의 바꿔치기', h('small', {}, LV.name)));
    this.clock = h('div', { class: 'ik-clock' }, this.clockI = h('i'), this.clockN = h('b', { class: 'ol' }, String(LV.time)));
    top.append(this.clock);
    col.append(top);
    const max = LV.stars[2] * 1.15;
    this.scoreEl = h('div', { class: 'ik-score ol' }, '0');
    this.bar = h('div', { class: 'ik-bar' }, this.barI = h('i'), ...LV.stars.map((s, k) => h('span', { class: 'ik-mark', style: `left:${s / max * 100}%` }, '★'.repeat(k + 1))));
    this.barMax = max;
    col.append(h('div', { class: 'ik-head' }, this.scoreEl, this.bar));
    this.hint = h('div', { class: 'ik-hint ol' }, '깜빡·꿈틀하는 물건이 먹물이! 톡!'); col.append(this.hint);
    this.feverEl = h('div', { class: 'ik-fever' }); document.getElementById('app').append(this.feverEl);
  }
  updCombo() { this.scoreEl.dataset.combo = this.combo >= 2 ? tr(`${this.combo} 연속`) : ''; }
  bump() { this.scoreEl.textContent = String(this.score); this.scoreEl.classList.remove('pop'); void this.scoreEl.offsetWidth; this.scoreEl.classList.add('pop'); this.barI.style.width = Math.min(100, this.score / this.barMax * 100) + '%'; }

  // ── per frame
  update(dt) {
    if (!this.ready) return;
    const L = this.L, LV = this.lv;
    this.t += dt; this.tw.update(dt);
    this.room.update(dt); this.me.update(dt);
    for (const a of this.agents) { if (a.char.root.visible) a.char.update(dt); this.stepAgent(a, dt); }
    if (this.phase !== 'play' || this.result) return;
    this.left -= dt; this.dizzy = Math.max(0, this.dizzy - dt);
    if (this.fever > 0 && (this.fever -= dt) <= 0) this.endFever();
    const k = Math.max(0, this.left) / LV.time;
    this.clockI.style.width = (k * 100) + '%'; this.clockN.textContent = String(Math.max(0, Math.ceil(this.left)));
    this.clock.classList.toggle('hurry', this.left < 6);
    if (this.left < 5.5 && Math.ceil(this.left) !== this._lastN) { this._lastN = Math.ceil(this.left); if (this._lastN > 0) { L.ui.floatText(innerWidth / 2, innerHeight * .2, String(this._lastN), 'big'); L.audio.sfx('tick'); } }
    if (this.left <= 0) return this.finish();
    const el = LV.time - this.left;
    if (!this.goldenDone && el >= this.goldenAt) this.goldenPending = true;
    if (LV.two && !this.twoDone && this.left <= LV.two) { this.twoDone = true; this.spawnSecond(); }
    if (el >= this.nextGrey) { this.nextGrey = el + rnd(6, 8); this.stealColour(); }
  }
  // time's up: 먹물이 gives up and gives the colour back
  async finish() {
    if (this.result) return;
    const L = this.L, W = L.world, LV = this.lv; this.phase = 'end';
    const stars = LV.stars.filter(s => this.score >= s).length, win = stars >= 1;
    this.result = win ? 'win' : 'fail';
    if (this.fever > 0) { this.fever = 0; this.feverEl.classList.remove('on'); }
    L.log({ result: this.result, lv: this.lvIdx, score: this.score, stars, best: this.best, found: this.found });
    // everyone out of hiding
    for (const a of this.agents) {
      const c = a.char, pos = a.fake ? a.fake.holder.position.clone() : a.slot ? new THREE.Vector3(a.slot.x, a.slot.y, a.slot.z) : c.root.position.clone();
      this.release(a); a.state = 'out';
      if (!c.root.visible) { c.root.visible = true; c.root.position.copy(pos); c.root.scale.setScalar(INKY_S); c.root.rotation.set(0, 0, 0); c.body.position.y = 0; const s = W.toScreen(pos.clone().setY(pos.y + .4)); this.puff(s.x, s.y); }
      c.faceTo(W.cam.position.x, W.cam.position.z); c.pose = 'flail'; c.setFace(win ? 'sweat' : 'happy');
    }
    W.idsDirty = true; L.audio.sfx('whoosh');
    const boss = this.agents[0].char;
    L.say(boss, win ? '다 들켰네… 색깔 돌려줄게!' : '메롱~ 그래도 색은 돌려줄게!', 1700);
    await this.tw.wait(.8); if (this.dead) return;
    // the room bursts back into full colour
    for (const p of this.props) if (p.grey) this.ungrey(p);
    const u = W.post?.u.gray; if (u) { const g0 = u.value; this.tw.run(1.0, k => { u.value = g0 * (1 - k); }, ease.inOutQuad); }
    const flash = L.h('div', { class: 'ik-flash' }); L.ui.wui.append(flash); setTimeout(() => flash.remove(), 700);
    for (let i = 0; i < 7; i++) this.after(i * .09, () => { const s = pick(this.slots), sc = W.toScreen(new THREE.Vector3(s.x, s.y + .4, s.z)); W.fx.burst(sc.x, sc.y, { n: 14, shape: 'circle', colors: PAINT, size: 12, speed: 260, life: .8, up: 140 }); });
    L.audio.sfx('special');
    for (const a of this.agents) { a.char.pose = 'wave'; a.char.setFace('happy'); }
    if (win) { L.audio.sfx('win'); W.fx.confetti(80); this.me.setFace('happy'); this.me.pose = 'cheer'; } else { L.audio.sfx('lose'); this.me.setFace('sweat'); }
    await this.tw.wait(1.5); if (this.dead) return;
    const h = L.h, last = this.lvIdx >= LEVELS.length - 1;
    L.ui.panel({ title: win ? '바꿔치기 끝!' : '아쉽다~', color: win ? 'green' : 'orange', body: [
      h('div', { class: 'ik-stars' }, ...[0, 1, 2].map(k => h('span', { class: k < stars ? 'on' : '' }, '★'))),
      h('div', { class: 'txt' }, `${this.score}점 · ${this.found}번 찾음 · 최고 ${this.best}연속`),
      h('div', { class: 'txt' }, win ? (stars >= 3 ? '먹물이 탐정! 하나도 못 숨었어' : '잘 찾았어! 5연속이면 피버타임') : `${LV.stars[0]}점이면 성공! 깜빡 눈을 노려봐`)],
      buttons: [L.ui.btn(win ? '다시' : (last ? '처음 방' : '다음 방'), { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: win ? this.lvIdx : (last ? 0 : this.lvIdx + 1) }) }),
        this.nextBtn = L.ui.btn(win ? (last ? '처음 방' : '다음 방') : '다시 하기', { color: win ? 'green' : 'orange', cls: 'big', onClick: () => L.go({ lv: win ? (last ? 0 : this.lvIdx + 1) : this.lvIdx }) })] });
  }
  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.removeEventListener('pointerdown', this._down); app.classList.remove('ik');
    for (const p of this.props) if (p.grey) this.ungrey(p);
    const roots = [this.room?.group, this.me?.root, ...this.props.map(p => p.group), ...this.pool.map(f => f.holder), ...this.agents.map(a => a.char.root)].filter(Boolean);
    for (const o of roots) { W.root.remove(o); disposeTree(o); }
    for (const j of this.junk) j.dispose?.();
    this.feverEl?.remove(); document.querySelectorAll('.ik-get, .ik-puff, .ik-splat, .ik-flash').forEach(e => e.remove());
    document.getElementById('ik-css')?.remove(); W.camLock = false;
    if (W.post) W.post.u.gray.value = 0;
  }

  // ── bots (QA) tap through the same tap(): smart taps a hidden 먹물이 a beat after its first tell (it reads the state);
  // random taps any thing in the room now and then
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 2.5 && this.L.ui.panelOpen) { this._endT = 0; this.nextBtn?.press(); } return; }
    if (this.phase !== 'play') return;
    const W = this.L.world;
    if (mode === 'random') {
      if ((this._rt = (this._rt || 0) - dt) > 0) return; this._rt = .35 + Math.random() * .35;
      const things = [...this.cands.map(c => ({ c })), ...this.agents.filter(a => a.state === 'hidden').map(a => ({ a }))];
      const o = pick(things);
      const s = o.a ? this.fakeCenter(o.a) : W.toScreen(o.c.group.position.clone().setY(o.c.group.position.y + o.c.h * .5));
      this.tap(s.x, s.y); return;
    }
    if ((this._bt = (this._bt || 0) - dt) > 0) return;
    // 'slow' (calibration only): a person — notices about a second after the first tell, now and then picks the wrong thing
    const slow = mode === 'slow';
    for (const a of this.agents) {
      if (a.state !== 'hidden') continue;
      const nt = slow ? (a.noticeS ??= rnd(.9, 1.7)) : a.notice;
      const seen = (a.firstTell != null && this.t - a.firstTell > nt) || ((this.fever > 0 || a.golden) && this.t - a.hiddenAt > (slow ? 1 : .45));
      if (seen && slow && Math.random() < .12) { const c = pick(this.props), s = W.toScreen(c.group.position.clone().setY(c.group.position.y + c.h * .5)); this._bt = .6; this.tap(s.x, s.y); return; }
      if (!seen) continue;
      const s = this.fakeCenter(a); this._bt = .25; this.tap(s.x, s.y); return;
    }
  }
  state() {
    return { scene: 'inky', lv: this.lvIdx + 1, phase: this.phase, result: this.result || null, score: this.score, combo: this.combo, best: this.best, found: this.found,
      fever: +(this.fever || 0).toFixed(1), left: +(this.left || 0).toFixed(1), hidden: this.agents.filter(a => a.state === 'hidden').length, gray: +(this.gray || 0).toFixed(2) };
  }
  get api() {
    return {
      finish: () => { this.left = 0; },
      where: () => this.agents.map(a => ({ state: a.state, kind: a.fake?.kind, slot: a.slot?.id, golden: a.golden, at: a.fake ? this.fakeCenter(a) : null })),
      tell: type => { for (const a of this.agents) if (a.state === 'hidden') { a.tell = { type, t: 0, dur: type === 'eyes' ? 9 : 1.2 }; } },
      fever: () => this.startFever(), grey: () => this.stealColour(), second: () => { if (!this.twoDone) { this.twoDone = true; this.spawnSecond(); } },
      hold: () => { for (const a of this.agents) a.nextTell = 1e9; },
    };
  }
}
const Y = new THREE.Vector3(0, 1, 0);

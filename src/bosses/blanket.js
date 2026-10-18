// 이불 속 누구게? — a 35-second break between stages. A sleepover: friends dive under one big fluffy quilt on the floor
// futon (요) and only something pokes out — ears through the top, a tail out the side, a hat, a skateboard, a book, a fish,
// Z's over a snorer, a frog's eyes — and the size of the lump is a clue too (판다 big, 햄찌 small). A "?" bounces over one
// lump: tap the face card of the friend under it. Right: the quilt is yanked up and drops, the friend jumps out
// "들켰다~!". Wrong: the friend you named pops out of the wardrobe, the toy chest or the laundry basket ("나 아니거든?")
// while the lump giggles, then shows itself (with the tell it had, so you learn it).
// Spice: lumps shuffle under the covers; 너굴이 wearing a friend's ears (his striped tail gives him away, taught by a
// "새로 나왔다!" card) — name the friend he copies and he jumps out "메롱~ 나였지롱!"; 추로 as a golden guest (+3); a snack
// peeking from under the quilt (tap it, +2); five in a row = 피버타임 (×2, quick reveals). At the end 엄마 calls
// "얘들아~ 불 끈다!", the lights go off, giggles in the dark… and everyone tumbles out for a pillow fight.
import * as THREE from 'three';
import { Room } from '../room.js';
import { THEMES } from '../stages.js';
import { Char, CHAR_DEFS, defineChar } from '../gfx/chars.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree, rbox, put, mat, canvasTex, tor } from '../gfx/kit.js';
import { tr } from '../i18n.js';
import { buildItem } from '../gfx/items.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
const COZY = { ambColor: '#ffe8ef', amb: 1.5, sunColor: '#fff3e6', sun: 2.2 };
const DARK = { ambColor: '#565cb4', amb: .5, sunColor: '#8f9bff', sun: .3 };
const SQ = Math.SQRT1_2;
const CS = 1.75;                       // friends under the quilt are scaled up so their ears read on a phone
const C0 = { x: .15, z: .3 };         // the middle of the lumps
const TOP = .16, QB = .045;           // mattress top, quilt thickness
const QX = [C0.x - 1.65, C0.x + 1.42], QZ = [C0.z - 1.65, C0.z + 1.42];   // the quilt
const MX = [QX[0] + .07, QX[1] - .07], MZ = [QZ[0] - .62, QZ[1] - .07];     // the mattress (pillows at the -z end)
// lump spots in screen terms: u = across (right +), w = toward the camera (down +)
const SLOTS = { 1: [[0, .1]], 2: [[-.74, 0], [.74, 0]], 3: [[-.82, -.34], [.82, -.34], [0, .62]] };
const slotXZ = ([u, w]) => ({ x: C0.x + (u + w) * SQ, z: C0.z + (w - u) * SQ });
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pickOne = a => a[Math.floor(Math.random() * a.length)];
const shuffled = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// who can hide, how big their lump is, what they say when found, and the tell (named after a miss, so you learn it)
const WHO = {
  bunny: { line: '들켰다~!', tell: '긴 귀' },
  panda: { size: 1.2, line: '…벌써 찾았어?', tell: '까만 동그란 귀' },
  hamster: { size: .74, line: '볼 빵빵~ 들켰다!', tell: '조그만 이불' },
  shiba: { line: '멍! 들켰당', tell: '말린 꼬리' },
  frog: { size: .95, dome: .8, line: '개굴! 찾았네?', tell: '빼꼼 눈' },
  skater: { line: '보드 때문이지?', tell: '삐죽 보드' },
  sleepy: { line: '쿨… 어? 아침이야?', tell: '쿨쿨 Zzz', snore: true },
  nerd: { line: '흠, 훌륭한 추리군!', tell: '학사모랑 책' },
  squirrel: { size: .92, line: '도토리 줄게!', tell: '커다란 꼬리' },
  grumpy: { dome: .92, line: '…쳇, 들켰네', tell: '삐죽삐죽 가시' },
  dj: { line: '둠칫! 찾았구나', tell: '헤드폰이랑 음표' },
  bear: { size: 1.12, line: '곰돌이 여기!', tell: '갈색 동그란 귀' },
  cheese: { line: '냥~ 들켰다', tell: '주황 귀랑 생선' },
  kkamang: { line: '…냥. 들켰군', tell: '까만 귀' },
  hayang: { size: .95, line: '냐앙~ 찾았다!', tell: '하얀 귀' },
  calico: { line: '삼색이 등장~', tell: '짝짝이 귀' },
  raccoon: { line: '헤헤, 들켰네~', tell: '줄무늬 꼬리' },
  churro: { line: '냐앙~ 츄르 줄 거야?', tell: '살구색 귀' },
};
// 너굴이 in disguise: a friend's ears (or board) on top — but the big striped tail always gives him away
const RC = CHAR_DEFS.raccoon;
if (!CHAR_DEFS.bk_rc_bunny) defineChar('bk_rc_bunny', { ...RC, name: '토끼 귀 쓴 너굴이', ear: 'bunny', earC: '#ffb3cd' });
if (!CHAR_DEFS.bk_rc_cheese) defineChar('bk_rc_cheese', { ...RC, name: '고양이 귀 쓴 너굴이', ear: 'kitty', earC: '#ffc2cf', earSide: ['#ffa449', '#ffa449'] });
if (!CHAR_DEFS.bk_rc_skater) defineChar('bk_rc_skater', { ...RC, name: '보드 탄 너굴이', acc: [['cap', { back: true, color: '#ff5d6c', tilt: .22 }]], prop: 'skateboard', idlePose: 'ride' });
const DISGUISE = { bk_rc_bunny: 'bunny', bk_rc_cheese: 'cheese', bk_rc_skater: 'skater' };
const isRaccoon = k => k === 'raccoon' || !!DISGUISE[k];

// tells poke out a bit more than in the stages (the boost goes back to normal when the quilt comes off)
const EAR_BOOST = { bunny: 1.12, kitty: 1.25, cat: 1.25, shiba: 1.2, squirrel: 1.22, bear: 1.32, panda: 1.32, hamster: 1.45, flop: 1.25 };
const TAIL_BOOST = { cat: 1.5, curl: 1.45, fluffy: .95, short: 1.5 };

const P1 = ['bunny', 'panda', 'hamster', 'shiba', 'frog', 'skater', 'sleepy', 'nerd', 'squirrel', 'dj', 'grumpy'];
const P2 = ['bunny', 'panda', 'hamster', 'shiba', 'frog', 'skater', 'sleepy', 'nerd', 'squirrel', 'dj', 'bear', 'raccoon', 'cheese'];
const P3 = ['bunny', 'panda', 'hamster', 'shiba', 'frog', 'skater', 'sleepy', 'squirrel', 'raccoon', 'cheese', 'kkamang', 'hayang', 'calico', 'bear'];
// three variants (one is picked each time the break comes round)
const LEVELS = [
  { name: '파자마 파티', time: 35, cards: 3, sizes: [1, 1, 2, 2, 3, 2, 3, 3], pool: P1, disguise: 0, shuffle: 0, peek: 0, stars: [10, 18, 26] },
  { name: '변장한 너굴이', time: 35, cards: 4, sizes: [1, 2, 2, 3, 2, 3, 3], pool: P2, disguise: .34, shuffle: .45, peek: 0, stars: [9, 17, 25], intro: 'raccoon' },
  { name: '고양이 친구들', time: 35, cards: 4, sizes: [2, 2, 3, 3, 3], pool: P3, disguise: .3, shuffle: .5, peek: .35, stars: [9, 17, 25], intro: 'cats' },
];

// ── the quilt: one soft heightfield over the futon; every lump is a smooth bump with a flat top and a long flare
function quiltTex() {
  return canvasTex(256, 256, (c, w, h) => {
    const cols = ['#ffc9d9', '#cdeee2', '#fff0b8', '#d4e8ff', '#e6dbff', '#ffdcc4'], n = 4, s = w / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const col = cols[(i + j * 2) % cols.length];
      c.fillStyle = col; c.fillRect(i * s, j * s, s, s);
      c.fillStyle = 'rgba(255,255,255,.75)';
      const m = (i + j) % 3, cx = i * s + s / 2, cy = j * s + s / 2;
      if (m === 0) for (let a = 0; a < 5; a++) { c.beginPath(); c.arc(i * s + 12 + (a % 3) * 20, j * s + 14 + Math.floor(a / 2) * 20, 3.5, 0, 7); c.fill(); }
      else if (m === 1) { c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 6 : 14, an = -Math.PI / 2 + k * Math.PI / 5; c.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); } c.closePath(); c.fill(); }
      else { c.beginPath(); c.moveTo(cx, cy + 10); c.bezierCurveTo(cx - 16, cy - 2, cx - 8, cy - 14, cx, cy - 5); c.bezierCurveTo(cx + 8, cy - 14, cx + 16, cy - 2, cx, cy + 10); c.fill(); }
    }
    // stitching
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.5; c.setLineDash([6, 5]);
    for (let k = 0; k <= n; k++) { c.beginPath(); c.moveTo(k * s, 0); c.lineTo(k * s, h); c.stroke(); c.beginPath(); c.moveTo(0, k * s); c.lineTo(w, k * s); c.stroke(); }
  }, { repeat: [2.2, 2.2] });
}
class Quilt {
  constructor() {
    const w = QX[1] - QX[0], d = QZ[1] - QZ[0], nx = this.nx = 84, nz = this.nz = Math.round(84 * d / w);
    const g = this.g = new THREE.PlaneGeometry(w, d, nx, nz);
    g.rotateX(-Math.PI / 2); g.translate((QX[0] + QX[1]) / 2, 0, (QZ[0] + QZ[1]) / 2);
    const p = g.attributes.position; this.base = new Float32Array(p.count); this.edge = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), out = Math.max(MX[0] - x, x - MX[1], z - MZ[1], 0);
      let y = TOP + QB - (TOP + QB - .025) * smooth(0, .085, out);   // it hangs over the mattress edge
      y += .055 * Math.exp(-((((z - QZ[0]) - .07) / .05) ** 2));          // the turned-down top edge
      y += .006 * Math.sin(x * 10.5) * Math.sin(z * 10.5);             // quilting puffs
      this.base[i] = y; p.setY(i, y); this.edge[i] = 1 - smooth(0, .05, out);
    }
    g.computeVertexNormals();
    this.mesh = new THREE.Mesh(g, mat('#ffffff', { map: quiltTex(), rough: .95 }));
    this.mesh.receiveShadow = true; this.mesh.castShadow = false; this.mesh.frustumCulled = false;
  }
  update(lumps) {
    const p = this.g.attributes.position, a = p.array, B = this.base, nx = this.nx, nz = this.nz;
    const dx = (QX[1] - QX[0]) / nx, dz = (QZ[1] - QZ[0]) / nz;
    for (let i = 0; i < B.length; i++) a[i * 3 + 1] = B[i];
    for (const L of lumps) {
      if (L.k <= .002) continue;
      const H = L.H * L.k * (1 + .9 * L.yank) * L.breath, R = L.R * (1 - .42 * L.yank), rx = L.x + L.ox, rz = L.z + L.oz, reach = R * 2.2;
      const c0 = Math.max(0, Math.floor((rx - reach - QX[0]) / dx)), c1 = Math.min(nx, Math.ceil((rx + reach - QX[0]) / dx));
      const r0 = Math.max(0, Math.floor((rz - reach - QZ[0]) / dz)), r1 = Math.min(nz, Math.ceil((rz + reach - QZ[0]) / dz));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const x = QX[0] + c * dx, z = QZ[0] + r * dz, q = Math.hypot(x - rx, z - rz) / R;
        if (q > 2.2) continue;
        const i = r * (nx + 1) + c, y = B[i] + H * this.edge[i] / (1 + Math.pow(q / .92, 5));
        if (y > a[i * 3 + 1]) a[i * 3 + 1] = y;
      }
    }
    p.needsUpdate = true; this.g.computeVertexNormals();
  }
}

// ── tells: remember each poking part's rest pose, then push it out (b > 0), back to normal (0) or duck it in (b < 0)
function prepTells(c) {
  const T = c._bk = { ears: (c.earObjs || []).map(e => [e, e.scale.clone()]), earB: EAR_BOOST[c.def.ear] ?? 1.25, tailB: TAIL_BOOST[c.def.tail] ?? 1.4 };
  if (c.tail) T.tail = [c.tail, c.tail.position.clone(), c.tail.children.map(m => [m, m.scale.clone()])];
  if (c.hat) T.hat = [c.hat, c.hat.position.clone(), c.hat.scale.clone()];
  if (c.phones) T.phones = [c.phones, c.phones.scale.clone()];
  if (c.board) T.board = [c.board, c.board.scale.clone()];
  if (c.held?.userData.two) T.held = [c.held.userData, c.held.userData.two.slice()];
}
function setTell(c, b) {
  const T = c._bk; if (!T) return;
  const up = Math.max(0, b), dn = Math.min(0, b);
  const ek = (1 + (T.earB - 1) * up) * (1 + .8 * dn);
  for (const [e, s] of T.ears) e.scale.copy(s).multiplyScalar(ek);
  if (T.tail) { const [t, p0, kids] = T.tail, tk = (1 + (T.tailB - 1) * up) * (1 + .85 * dn); t.position.set(p0.x, p0.y + .06 * up, p0.z - .12 * up); for (const [m, s] of kids) m.scale.copy(s).multiplyScalar(tk); }
  if (T.hat) { const [h, p0, s0] = T.hat; h.position.set(p0.x, p0.y + .06 * up + .22 * dn, p0.z); h.scale.copy(s0).multiplyScalar(1 + .05 * up + .2 * dn); }
  if (T.phones) T.phones[0].scale.copy(T.phones[1]).multiplyScalar(1 + .25 * up + .3 * dn);
  if (T.board) T.board[0].scale.copy(T.board[1]).multiplyScalar(1 + .2 * up + .5 * dn);
  if (T.held) { const [u, two] = T.held; u.two[1] = two[1] + .05 * up; u.two[2] = two[2] + .3 * up + .3 * dn; }
}
// 너굴이's tail gets its dark rings (the tell that never lies)
function stripeTail(c) {
  const plume = c.tail?.children[0]; if (!plume) return;
  const curve = new THREE.CatmullRomCurve3([[0, -.02, .02], [-.04, .14, -.22], [-.16, .42, -.34], [-.3, .7, -.3], [-.38, .92, -.14], [-.3, 1.02, .02]].map(q => new THREE.Vector3(...q)));
  const Z = new THREE.Vector3(0, 0, 1);
  for (const k of [.3, .5, .68, .84]) {
    const r = .23 * Math.pow(Math.sin(Math.PI * k), .45) * (1 - .3 * k);
    const ring = tor(+(r * .98).toFixed(3), .052, '#4a4458', { rough: .62 }, Math.PI * 2, 8, 20);
    ring.position.copy(curve.getPointAt(k)); ring.quaternion.setFromUnitVectors(Z, curve.getTangentAt(k));
    ring.userData.char = c; ring.castShadow = false; plume.add(ring);
  }
}

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.objs = new Set(); this.lumps = []; this.live = []; this.extra = new Set(); this.cards = []; }
  add(o) { this.L.world.root.add(o); this.objs.add(o); return o; }
  drop(o) { if (!o || !this.objs.has(o)) return; this.L.world.root.remove(o); this.objs.delete(o); disposeTree(o); for (const c of this.extra) if (c.root === o) this.extra.delete(c); }

  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx];
    this.addCss();
    const app = document.getElementById('app'); app.dataset.night = ''; app.classList.add('bk');
    L.setBg(['#ffeef5', '#ffe2ec']); W.setLight(COZY);
    this.buildRoom(); this.buildFuton(); this.frame();
    const faces = Object.keys(WHO).map(k => [k, 'normal']);
    faces.push(['bk_rc_bunny', 'normal'], ['calico', 'happy']);
    L.makeThumbs({ faces });
    this.score = 0; this.combo = 0; this.best = 0; this.found = 0; this.fever = 0; this.fevers = 0; this.roundN = 0; this.shuffles = 0; this.miss = 0;
    this.left = LV.time; this.result = null; this.phase = 'intro'; this.lock = true; this.cur = null;
    this.goldenAt = LV.time * (.36 + Math.random() * .2); this.goldenDone = false; this.snackT = 7 + Math.random() * 3; this.snacks = 0; this.snack = null;
    this.buildHud(); this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    this.ready = true;
    await this.tw.wait(.3); if (this.dead) return;
    this.phase = 'play';
    if (LV.intro) this.gotCard(LV.intro);
    this.nextRound();
  }
  addCss() {
    if (document.getElementById('bk-css')) return;
    const l = document.createElement('link'); l.id = 'bk-css'; l.rel = 'stylesheet'; l.href = new URL('./blanket.css', import.meta.url).href; document.head.append(l);
  }
  // a pastel bedroom: the wardrobe, the toy chest and the laundry basket are where the wrongly-named friends pop out
  buildRoom() {
    const W = this.L.world, T = { ...THEMES.bunny, name: '파자마 파티' };
    const layout = { w: 5, d: 5, theme: T, wallH: 2.7, bleed: {}, walls: { N: 'wall', W: 'wall', S: 'none', E: 'none' },
      furniture: [F('wardrobe', 0, 0), { type: 'chest', x: -1.86, z: .62, a: Math.PI / 2 }, { type: 'laundrybasket', x: -.85, z: -2.2, a: 0 }, { type: 'floorlamp', x: 1.0, z: -2.1, a: 0 }],
      decor: [D('window', 'N', .3), D('catclock', 'W', -.4)] };
    const room = this.room = new Room(W, layout); this.add(room.group);
    const rec = t => room.furns.find(r => r.type === t);
    const wd = rec('wardrobe'), ch = rec('chest'), lb = rec('laundrybasket');
    // where a named friend appears: [x, z] it stands at, how high it rises from, and the part that opens
    this.spots = [
      { name: 'wardrobe', part: wd?.f.parts[0], from: [-2, -2.05, .25], to: [-1.85, -1.4, 0], scale: .9 },
      { name: 'chest', part: ch?.f.parts[0], from: [-1.86, .62, -.55], to: [-1.86, .62, .12], scale: .85 },
      { name: 'basket', part: null, from: [-.85, -2.2, -.55], to: [-.85, -2.2, .05], scale: .85 },
    ];
  }
  buildFuton() {
    const g = this.futon = new THREE.Group();
    const mw = MX[1] - MX[0], md = MZ[1] - MZ[0], mx = (MX[0] + MX[1]) / 2, mz = (MZ[0] + MZ[1]) / 2;
    g.add(put(rbox(mw, TOP, md, '#fffaf4', .06), mx, TOP / 2, mz));
    g.add(put(rbox(mw + .02, .035, md + .02, '#ffb3c8', .014), mx, .045, mz));
    const pz = MZ[0] + .31, cols = ['#fff3d6', '#ffd6e4', '#d6ecff'];
    this.pillows = [-1, 0, 1].map((k, i) => { const p = put(rbox(.8, .17, .44, cols[i], .08), mx + k * .93, TOP + .075, pz, 0, k * .07, 0); g.add(p); return p; });
    this.add(g);
    this.quilt = new Quilt(); this.add(this.quilt.mesh);
  }
  frame() {
    const W = this.L.world;
    W.home.set(C0.x - .1, .5, C0.z - .1); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = .82; W.zoom = 1;
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(3.4, 4.4, .52);
  }
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col(), LV = this.lv, app = document.getElementById('app');
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, '이불 속 누구게?', h('small', {}, LV.name)));
    this.clock = h('div', { class: 'bk-clock' }, this.clockI = h('i'), this.clockN = h('b', { class: 'ol' }, String(LV.time)));
    top.append(this.clock);
    col.append(top);
    const max = this.barMax = LV.stars[2] * 1.15;
    this.scoreEl = h('div', { class: 'bk-score ol' }, '0');
    this.bar = h('div', { class: 'bk-bar' }, this.barI = h('i'), ...LV.stars.map((s, k) => h('span', { class: 'bk-mark', style: `left:${s / max * 100}%` }, '★'.repeat(k + 1))));
    col.append(h('div', { class: 'bk-head' }, this.scoreEl, this.bar));
    this.hint = h('div', { class: 'bk-hint ol' }, '삐죽 나온 귀·꼬리를 보고 누군지 톡!'); col.append(this.hint);
    this.cardsEl = h('div', { class: 'bk-cards out' }); col.append(this.cardsEl);
    this.qEl = h('div', { class: 'bk-q ol3' }, '?'); this.qEl.style.display = 'none'; ui.wui.append(this.qEl);
    this.feverEl = h('div', { class: 'bk-fever' }); app.append(this.feverEl);
    this.nightEl = h('div', { class: 'bk-night' }); app.append(this.nightEl);
  }
  gotCard(kind) {
    const L = this.L, h = L.h;
    const [img, s, s2] = kind === 'raccoon' ? [L.thumbs.face_bk_rc_bunny_normal, '토끼 귀 쓴 너굴이!', '줄무늬 꼬리를 잘 봐'] : [L.thumbs.face_calico_happy, '고양이 친구들이 왔다!', '귀랑 꼬리 색을 잘 봐'];
    const c = h('div', { class: 'bk-get' }, h('img', { src: img }), h('div', {}, h('div', { class: 'bk-get-t ol' }, '새로 나왔다!'), h('div', { class: 'bk-get-s' }, s), h('div', { class: 'bk-get-s' }, s2)));
    document.getElementById('app').append(c); L.audio.sfx('gasp');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2600);
  }
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => { if (e.button > 0 || this.result || this.phase !== 'play') return; this.tapScene(e.clientX, e.clientY); };
    app.addEventListener('pointerdown', this._down);
  }
  setCards(kinds) {
    const h = this.L.h; this.cardsEl.innerHTML = ''; this.cards = [];
    kinds.forEach((k, i) => {
      const el = h('div', { class: 'bk-card' + (k === 'churro' ? ' gold' : ''), role: 'button', style: `animation-delay:${i * .05}s` },
        h('img', { src: this.L.thumbs[`face_${k}_normal`], alt: '' }), h('b', {}, CHAR_DEFS[k].name));
      el.kind = k;
      el.addEventListener('pointerdown', e => { e.stopPropagation(); el.classList.add('down'); });
      const up = () => el.classList.remove('down');
      el.addEventListener('pointerleave', up); el.addEventListener('pointercancel', up);
      el.addEventListener('pointerup', e => { e.stopPropagation(); if (!el.classList.contains('down')) return; up(); this.answer(k, el); });
      el.press = () => this.answer(k, el);
      this.cardsEl.append(el); this.cards.push(el);
    });
    this.cardsEl.classList.remove('out');
  }

  // ── lumps
  makeLump(kind, slot) {
    const who = isRaccoon(kind) ? 'raccoon' : kind, info = WHO[who] || {};
    const c = new Char(kind), size = (info.size || 1) * CS, sc = c.S * size, p = slotXZ(slot);
    c.root.scale.setScalar(size); c.root.position.set(p.x, TOP - sc, p.z); c.shadow.visible = false;
    if (isRaccoon(kind)) stripeTail(c);
    // turned side-on so a tail sticks out to the outside, not into the next lump
    const side = slot[0] < -.2 ? 1 : slot[0] > .2 ? -1 : (Math.random() < .5 ? 1 : -1);
    c.root.rotation.y = Math.PI / 4 + side * .48;
    if (c.def.prop === 'book' || c.def.prop === 'fish' || c.def.prop === 'seed') c.pose = 'hold';
    c.setFace('normal'); prepTells(c);
    this.add(c.root); this.L.world.idsDirty = true;
    return { kind, who, trap: DISGUISE[kind] || null, c, sc, x: p.x, z: p.z, ox: 0, oz: 0, R: .64 * sc, H: (.84 + (c.lift || 0)) * sc * (info.dome || 1), k: 0, yank: 0, breath: 1,
      tell: -1, tellGoal: 1, side, slot, state: 'hide', golden: kind === 'churro', snore: !!info.snore, peek: false, ph: Math.random() * 6, shake: 0, wigT: 1 + Math.random() * 3, snT: .8 + Math.random(), glT: 0 };
  }
  async nextRound() {
    if (this.dead || this.phase !== 'play') return;
    const L = this.L, LV = this.lv; this.roundN++;
    let n = LV.sizes[Math.min(this.roundN - 1, LV.sizes.length - 1)];
    if (this.fever > 0) n = Math.min(n, 2);
    if (this.left < 4.5) n = 1;
    const used = new Set(), kinds = [];
    let golden = !this.goldenDone && LV.time - this.left >= this.goldenAt && this.roundN > 1;
    let disguise = LV.disguise > 0 && (this.roundN === 1 && LV.intro === 'raccoon' || this.roundN > 1 && Math.random() < LV.disguise);
    const forced = this.forced; this.forced = null;
    if (forced) { n = forced.length; forced.forEach(k => { kinds.push(k); used.add(isRaccoon(k) ? 'raccoon' : k); if (DISGUISE[k]) used.add(DISGUISE[k]); }); }
    else {
      let pool = shuffled(LV.pool);
      if (this.roundN === 1 && LV.intro === 'cats') pool = [...shuffled(['cheese', 'kkamang', 'hayang', 'calico']).slice(0, 2), ...pool];
      for (let i = 0; i < n; i++) {
        let kind = null;
        if (golden) { kind = 'churro'; golden = false; this.goldenDone = true; }
        else if (disguise) {
          const opts = Object.keys(DISGUISE).filter(d => LV.pool.includes(DISGUISE[d]) && !used.has(DISGUISE[d]) && !used.has('raccoon'));
          if (opts.length) { kind = this.roundN === 1 ? 'bk_rc_bunny' : pickOne(opts); used.add(DISGUISE[kind]); }
          disguise = false;
        }
        if (!kind) kind = pool.find(k => !used.has(k) && !(k === 'raccoon' && used.has('raccoon')));
        used.add(isRaccoon(kind) ? 'raccoon' : kind); kinds.push(kind);
      }
    }
    const slots = SLOTS[n];
    this.lumps = kinds.map((k, i) => this.makeLump(k, slots[i]));
    this.live = this.live.filter(l => !l.gone).concat(this.lumps);
    if (LV.peek) this.lumps.forEach(l => { l.peek = Math.random() < LV.peek; });
    // the cards: everyone under the quilt, the friend a disguised 너굴이 copies (the trap), then others to fill up
    const answers = this.lumps.map(l => l.who), traps = this.lumps.filter(l => l.trap).map(l => l.trap);
    const total = Math.max(LV.cards, n + 1), decoys = [...traps];
    for (const k of shuffled(LV.pool)) { if (answers.length + decoys.length >= total) break; if (!answers.includes(k) && !decoys.includes(k)) decoys.push(k); }
    this.setCards(shuffled([...answers, ...decoys]));
    this.lock = true; this.cur = null;
    L.audio.sfx('swish');
    await Promise.all(this.lumps.map((l, i) => this.tw.run(.34, k => { l.k = k; }, ease.outBack, i * .1)));
    if (this.dead || this.phase !== 'play') return;
    if (this.roundN === 1) this.sayL(this.lumps[0], '누구게~?', 1000);
    if (n >= 2 && LV.shuffle && !this.noShuffle && this.fever <= 0 && this.shuffles < 3 && this.roundN > 2 && Math.random() < LV.shuffle) await this.shuffle();
    if (this.dead || this.phase !== 'play') return;
    this.lock = false; this.ask();
  }
  // a quick swap under the covers: tells duck in, the lumps slide round each other, tells pop back out
  async shuffle() {
    const L = this.L, Ls = this.lumps; this.shuffles++; this.shuffling = true;
    await this.tw.wait(.35); if (this.dead) return;
    Ls.forEach(l => { l.tellGoal = -1; });
    L.audio.sfx('wobble');
    await this.tw.wait(.16); if (this.dead) return;
    const n = Ls.length, perm = n === 2 ? [1, 0] : (Math.random() < .5 ? [1, 2, 0] : [2, 0, 1]);
    const from = Ls.map(l => ({ x: l.x, z: l.z })), to = perm.map(j => from[j]);
    const s = L.world.toScreen(new THREE.Vector3(C0.x, TOP + .9, C0.z)); L.ui.floatText(s.x, s.y - 70, '슥삭슥삭~ 자리 바꾸기!', '');
    [0, .22, .44].forEach(d => setTimeout(() => !this.dead && L.audio.sfx('swish'), d * 1000));
    const r0 = Ls.map(l => l.c.root.rotation.y), newSlots = perm.map(j => Ls[j].slot);
    await this.tw.run(.72, k => Ls.forEach((l, i) => {
      const a = from[i], b = to[i], sn = Math.sin(k * Math.PI);
      l.x = a.x + (b.x - a.x) * k + (b.z - a.z) * .55 * sn; l.z = a.z + (b.z - a.z) * k - (b.x - a.x) * .55 * sn; l.shake = .6 * sn;
    }), ease.inOutCubic);
    if (this.dead) return;
    Ls.forEach((l, i) => {
      l.slot = newSlots[i]; const side = l.slot[0] < -.2 ? 1 : l.slot[0] > .2 ? -1 : l.side; l.side = side;
      const r1 = Math.PI / 4 + side * .48, ra = r0[i]; this.tw.run(.2, k => { l.c.root.rotation.y = ra + (r1 - ra) * k; });
      l.tellGoal = 1;
    });
    this.shuffling = false;
    await this.tw.wait(.2);
  }
  // the next question: the left-most lump still hiding
  ask() {
    if (this.phase !== 'play') return;
    const open = this.lumps.filter(l => l.state === 'hide').sort((a, b) => (a.x - a.z) - (b.x - b.z));
    this.cur = open[0] || null; this.askT = 0; this._bt = null;
    if (!this.cur) { this.lock = true; this.qEl.style.display = 'none'; this.roundEnd(); return; }
    const l = this.cur, b = new THREE.Box3().setFromObject(l.c.root); l.qy = Math.min(b.max.y + .1, TOP + l.H + .9 * l.sc);
    this.qEl.style.display = ''; this.qEl.classList.remove('pop'); void this.qEl.offsetWidth; this.qEl.classList.add('pop');
  }
  async roundEnd() {
    this.cardsEl.classList.add('out');
    await this.tw.wait(this.fever > 0 ? .35 : .5); if (this.dead || this.phase !== 'play') return;
    this.nextRound();
  }

  // ── answers (cards, or a bot pressing one)
  answer(kind, card) {
    if (this.phase !== 'play' || this.result || !this.cur || card?.classList.contains('used')) return;
    if (this.lock) { card?.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 160 }); return; }
    const l = this.cur; this.lock = true; this.qEl.style.display = 'none';
    if (kind === l.who) this.right(l, card); else this.wrong(l, kind, card);
  }
  async right(l, card) {
    const L = this.L, W = L.world, fast = this.fever > 0 ? .6 : 1;
    card?.classList.add('used', 'ok');
    const gain = (l.golden ? 3 : 1) * (this.fever > 0 ? 2 : 1);
    this.score += gain; this.found++; this.combo++; this.best = Math.max(this.best, this.combo);
    L.audio.sfx('found');
    const done = this.reveal(l, fast);
    await this.tw.wait(.12 * fast); if (this.dead) return;
    L.audio.sfx('pop', 2 + Math.min(10, this.combo)); if (l.golden) L.audio.sfx('star');
    const s = W.toScreen(new THREE.Vector3(l.x, TOP + l.H + .3, l.z));
    W.fx.burst(s.x, s.y, { n: l.golden ? 26 : 14, shape: 'star', colors: l.golden ? ['#ffe14d', '#ffd23f', '#ffffff'] : undefined });
    L.ui.floatText(s.x, s.y - 40, `+${gain}`, l.golden || this.fever > 0 ? 'gold big' : 'gold');
    this.updCombo(); this.bump();
    if (!this._hintGone) { this._hintGone = true; this.hint.classList.add('gone'); }
    await this.tw.wait(.15 * fast); if (this.dead) return;
    this.sayC(l.c, l.golden ? '냐앙~ 들켰다! +3' : l.trap ? '헉, 꼬리 때문에!' : WHO[l.who]?.line || '들켰다~!', 800);
    if (this.combo > 0 && this.combo % 5 === 0 && this.fever <= 0 && this.fevers < 2) this.startFever();
    done.then(() => this.leave(l, .3 * fast));
    await this.tw.wait(.16 * fast); if (this.dead || this.phase !== 'play') return;
    this.lock = false; this.ask();
  }
  async wrong(l, kind, card) {
    const L = this.L, W = L.world;
    this.combo = 0; this.miss++; this.updCombo();
    L.audio.sfx('miss');
    card?.animate([{ transform: 'translateX(-6px) rotate(-4deg)' }, { transform: 'translateX(6px) rotate(4deg)' }, { transform: 'none' }], { duration: 260 });
    const other = this.lumps.find(o => o !== l && o.state === 'hide' && o.who === kind);
    if (other) {
      // the one you named is under the quilt too, just not there: its lump hops up "나 여기 있는데?"
      other.shake = 1; this.tw.run(.3, k => { other.yank = Math.sin(k * Math.PI) * .35; });
      this.sayL(other, '나 여기 있는데?', 900);
    } else {
      card?.classList.add('used', 'no');
      this.popElsewhere(kind);
    }
    // the asked lump giggles…
    l.shake = 1.2; this.sayL(l, l.trap && kind === l.trap ? '킥킥… 속았지?' : '킥킥', 700); L.audio.sfx('giggle');
    await this.tw.wait(.8); if (this.dead) return;
    // …then shows itself
    const done = this.reveal(l, 1);
    await this.tw.wait(.3); if (this.dead) return;
    const app = document.getElementById('app');
    if (l.trap) {
      // 너굴이 in a friend's ears: the comic fail
      l.c.pose = 'point'; l.c.setFace('happy'); this.sayC(l.c, '메롱~ 나였지롱!', 1000, 'red'); L.audio.sfx('locked');
      app.animate([{ transform: 'translateX(-9px)' }, { transform: 'translateX(9px)' }, { transform: 'translateX(-5px)' }, { transform: 'none' }], { duration: 300 });
    } else { this.sayC(l.c, '히히, 나야~', 800); }
    const s = W.toScreen(new THREE.Vector3(l.x, TOP, l.z));
    L.ui.floatText(s.x, s.y + 58, `${WHO[l.who]?.tell || ''} = ${CHAR_DEFS[l.who].name}`, '');
    this.cards.find(c => c.kind === l.who)?.classList.add('used', 'shown');
    done.then(() => this.leave(l, .55));
    await this.tw.wait(.45); if (this.dead || this.phase !== 'play') return;
    this.lock = false; this.ask();
  }
  // the quilt is yanked up at the lump and drops flat while the friend jumps out and turns round
  async reveal(l, fast = 1) {
    const L = this.L, W = L.world, c = l.c;
    l.state = 'out'; l.tellGoal = 0;
    L.audio.sfx('whoosh');
    await this.tw.run(.1 * fast, k => { l.yank = k; l.k = Math.max(l.k, 1); }, ease.outQuad); if (this.dead) return;
    this.tw.run(.16 * fast, k => { l.yank = 1 - k; l.k = 1 - k; }, ease.inQuad).then(() => { l.k = 0; l.yank = 0; });
    const s = W.toScreen(new THREE.Vector3(l.x, TOP + l.H * 1.5, l.z));
    W.fx.burst(s.x, s.y, { n: 10, colors: ['#ffc9d9', '#cdeee2', '#fff0b8', '#ffffff'], shape: 'circle', size: 7, speed: 200, life: .45, gravity: 320, up: 140 });
    c.setFace('wow'); c.pose = 'cheer';
    const r0 = c.root.rotation.y, r1 = Math.PI / 4 + Math.PI * 2, y0 = c.root.position.y;   // a full spin on the way up
    await this.tw.run(.3 * fast, k => { c.root.position.y = y0 + (TOP + QB - y0) * k + Math.sin(k * Math.PI) * .55; c.root.rotation.y = r0 + (r1 - r0) * ease.outCubic(Math.min(1, k * 1.25)); }, ease.linear);
    if (this.dead) return;
    c.bump(.3); c.setFace('happy'); L.audio.sfx('land');
  }
  // off it goes (a little hop, a puff) so the futon is clear for the next round
  async leave(l, delay) {
    await this.tw.wait(delay); if (this.dead || !this.objs.has(l.c.root)) return;
    const c = l.c, s0 = c.root.scale.x, y0 = c.root.position.y;
    await this.tw.run(.22, k => { c.root.scale.setScalar(s0 * (1 - .85 * k)); c.root.position.y = y0 + Math.sin(k * Math.PI) * .35; }, ease.inQuad);
    if (this.dead) return;
    const s = this.L.world.toScreen(c.root.position.clone().setY(y0 + .3));
    this.L.world.fx.burst(s.x, s.y, { n: 8, colors: ['#ffffff', '#ffe6f0'], shape: 'circle', size: 8, speed: 120, life: .35, gravity: 0 });
    this.drop(c.root); l.gone = true;
  }
  // the named friend wasn't under there at all: it pops out of the wardrobe / toy chest / laundry basket, cross
  async popElsewhere(kind) {
    const L = this.L, W = L.world;
    const free = this.spots.filter(s => !s.busy); if (!free.length) return;
    const sp = free[(this._spotI = ((this._spotI ?? Math.floor(Math.random() * 3)) + 1)) % free.length]; sp.busy = true;
    const c = new Char(kind), size = CS * sp.scale * (WHO[kind]?.size || 1);
    c.root.scale.setScalar(size); c.root.position.set(sp.from[0], sp.from[2], sp.from[1]); c.faceTo(W.cam.position.x, W.cam.position.z);
    if (isRaccoon(kind)) stripeTail(c);
    c.setFace('sus'); c.pose = 'hips'; this.add(c.root); this.extra.add(c); W.idsDirty = true;
    if (sp.part) this.tw.run(.22, k => sp.part.setOpen(k));
    L.audio.sfx(sp.part ? 'open' : 'hop');
    await this.tw.run(.28, k => { c.root.position.set(sp.from[0] + (sp.to[0] - sp.from[0]) * k, sp.from[2] + (sp.to[2] - sp.from[2]) * k + Math.sin(k * Math.PI) * .35, sp.from[1] + (sp.to[1] - sp.from[1]) * k); }, ease.outQuad);
    if (this.dead) return;
    c.bump(.25); this.sayC(c, pickOne(['나 아니거든?', '나 아니거든?', '난 여기 있었는데?']), 1100, 'red'); L.audio.sfx('hmm');
    await this.tw.wait(1.25); if (this.dead) return;
    c.setFace('happy');
    await this.tw.run(.24, k => { c.root.position.set(sp.to[0] + (sp.from[0] - sp.to[0]) * k, sp.to[2] + (sp.from[2] - sp.to[2]) * k + Math.sin(k * Math.PI) * .25, sp.to[1] + (sp.from[1] - sp.to[1]) * k); }, ease.inQuad);
    if (sp.part) this.tw.run(.2, k => sp.part.setOpen(1 - k));
    if (this.dead) return;
    this.drop(c.root); sp.busy = false;
  }
  // speech bubbles: over a lump (its top, wherever it wiggles) or over a standing friend (scaled-up head)
  sayL(l, text, ms, cls) { const P = { get x() { return l.x + l.ox; }, get y() { return TOP + l.H * Math.max(0, l.k) * l.breath + .42 * l.sc; }, get z() { return l.z + l.oz; } }; return this.L.say({ root: { position: P }, headTop: () => 0 }, text, ms, cls); }
  sayC(c, text, ms, cls) { return this.L.say({ root: c.root, headTop: () => c.headTop() * c.root.scale.x + .04 }, text, ms, cls); }
  startFever() {
    if (this.phase !== 'play') return;
    const L = this.L; this.fever = 6; this.fevers++; L.audio.sfx('special'); L.audio.sfx('win');
    this.feverEl.classList.add('on'); L.ui.banner('피버타임!', '점수 두 배 · 휙휙 들춰!', 1000);
  }
  updCombo() { this.scoreEl.dataset.combo = this.combo >= 2 ? tr(`${this.combo} 연속`) : ''; }
  bump() { this.scoreEl.textContent = String(this.score); this.scoreEl.classList.remove('pop'); void this.scoreEl.offsetWidth; this.scoreEl.classList.add('pop'); this.barI.style.width = Math.min(100, this.score / this.barMax * 100) + '%'; }

  // ── a snack peeking out from under the quilt edge: tap it for +2
  spawnSnack() {
    const L = this.L, type = pickOne(['cookie', 'candy', 'donut']), g = buildItem(type, { scale: 1.8 });
    const front = Math.random() < .5, x = front ? QX[1] - .2 : C0.x + (Math.random() - .5) * .8, z = front ? C0.z + (Math.random() - .5) * .8 : QZ[1] - .2;
    g.position.set(x, TOP - .2, z); g.rotation.y = Math.random() * 6; g.userData.item = true;
    this.add(g); L.world.idsDirty = true;
    this.snack = { g, x, z, t: 3.2, type };
    this.tw.run(.3, k => { if (this.snack?.g === g) g.position.y = TOP - .2 + .3 * k; }, ease.outBack);
    L.audio.sfx('pop', 8);
  }
  tapScene(x, y) {
    const sn = this.snack; if (!sn || sn.got) return;
    const s = this.L.world.toScreen(new THREE.Vector3(sn.x, TOP + .15, sn.z));
    if (Math.hypot(s.x - x, s.y - y) > 66) return;
    sn.got = true; const L = this.L, gain = 2 * (this.fever > 0 ? 2 : 1);
    this.score += gain; this.snacks++; this.bump(); L.audio.sfx('coin');
    L.ui.floatText(s.x, s.y - 30, `냠! +${gain}`, 'gold big');
    L.world.fx.burst(s.x, s.y, { n: 12, shape: 'star', colors: ['#ffe14d', '#ffb3cd', '#ffffff'] });
    const g = sn.g, y0 = g.position.y;
    this.tw.run(.3, k => { g.position.y = y0 + k * .8; g.scale.setScalar(1.8 * (1 - k)); }, ease.inQuad).then(() => { this.drop(g); if (this.snack === sn) this.snack = null; });
  }

  // ── per frame
  update(dt) {
    if (!this.ready) return;
    const L = this.L, LV = this.lv, W = L.world;
    this.t += dt; this.tw.update(dt); this.room.update(dt);
    if (this.live.some(l => l.gone)) this.live = this.live.filter(l => !l.gone);
    for (const l of this.live) this.stepLump(l, dt);
    for (const c of this.extra) c.update(dt);
    this.quilt.update(this.live);
    // the "?" over the lump being asked
    if (this.cur && !this.lock && this.qEl.style.display !== 'none') {
      const l = this.cur, s = W.toScreen(new THREE.Vector3(l.x + l.ox, l.qy ?? TOP + l.H + .6 * l.sc, l.z + l.oz));
      this.qEl.style.left = s.x + 'px'; this.qEl.style.top = s.y + 'px';
    }
    if (this.snack && !this.snack.got) {
      const sn = this.snack; sn.g.rotation.z = Math.sin(this.t * 9) * .12;
      if ((sn.t -= dt) <= 0) { sn.got = true; const g = sn.g, y0 = g.position.y; this.tw.run(.25, k => { g.position.y = y0 - .3 * k; }).then(() => { this.drop(g); if (this.snack === sn) this.snack = null; }); }
    }
    if (this.phase !== 'play' || this.result) return;
    if (!this.frozen) this.left -= dt;
    if (this.fever > 0 && (this.fever -= dt) <= 0) this.feverEl.classList.remove('on');
    if (this.cur && !this.lock) this.askT += dt;
    const k = Math.max(0, this.left) / LV.time;
    this.clockI.style.width = (k * 100) + '%'; this.clockN.textContent = String(Math.max(0, Math.ceil(this.left)));
    this.clock.classList.toggle('hurry', this.left < 6);
    if (this.left < 5.5 && Math.ceil(this.left) !== this._lastN) { this._lastN = Math.ceil(this.left); if (this._lastN > 0) L.audio.sfx('tick'); }
    if (this.left <= 0) return this.finish();
    if ((this.snackT -= dt) <= 0 && !this.snack && this.snacks < 3 && this.left > 5) { this.snackT = 8 + Math.random() * 3; this.spawnSnack(); }
  }
  stepLump(l, dt) {
    const c = l.c;
    if (l.state === 'hide') {
      if (l.peek && this.phase === 'play' && l.k > .9 && !this.shuffling) l.tellGoal = ((this.t + l.ph) % 2.3) < 1.35 ? 1 : -1;
      l.breath = 1 + (l.snore ? .075 * Math.sin(this.t * 2.2 + l.ph) : .02 * Math.sin(this.t * 3.3 + l.ph));
      // somebody fidgeting under the covers now and then
      if ((l.wigT -= dt) < 0) { l.wigT = 2 + Math.random() * 3; l.shake = Math.max(l.shake, .45); }
      if (l.snore && this.phase === 'play' && (l.snT -= dt) < 0) { l.snT = 2.6; this.sayL(l, '드르렁~', 800, 'think'); }
      if (l.golden && (l.glT -= dt) < 0) { l.glT = .22; const s = this.L.world.toScreen(new THREE.Vector3(l.x + (Math.random() - .5) * l.R * 1.6, TOP + l.H * (.4 + Math.random() * .7), l.z + (Math.random() - .5) * l.R * 1.6)); this.L.world.fx.burst(s.x, s.y, { n: 2, shape: 'star', colors: ['#ffe14d', '#ffffff'], size: 8, speed: 40, life: .5, gravity: -30 }); }
    }
    l.tell += (l.tellGoal - l.tell) * (1 - Math.exp(-dt * 14));
    l.shake = Math.max(0, l.shake - dt * 1.4);
    l.ox = Math.sin(this.t * 38 + l.ph) * .045 * l.shake; l.oz = Math.cos(this.t * 31 + l.ph) * .03 * l.shake;
    if (l.state === 'hide') {
      const kk = Math.min(1, Math.max(0, l.k));
      c.root.position.set(l.x + l.ox, TOP - (1 - kk) * 1.0 * l.sc + (l.breath - 1) * l.H * .8, l.z + l.oz);
    }
    setTell(c, l.tell);
    c.update(dt);
  }

  // time's up: 엄마 calls lights out, giggles in the dark, then everybody tumbles out for a pillow fight
  async finish() {
    if (this.result) return;
    const L = this.L, LV = this.lv, W = L.world; this.phase = 'end'; this.lock = true; this.cur = null;
    const stars = LV.stars.filter(s => this.score >= s).length, win = stars >= 1;
    this.result = win ? 'win' : 'fail';
    L.log({ result: this.result, lv: this.lvIdx, score: this.score, stars, best: this.best, found: this.found });
    this.qEl.style.display = 'none'; this.cardsEl.classList.add('out'); this.hint.classList.add('gone'); this.feverEl.classList.remove('on'); this.fever = 0;
    if (this.snack) { const sn = this.snack; sn.got = true; this.snack = null; const g = sn.g, y0 = g.position.y; this.tw.run(.2, k => { g.position.y = y0 - .3 * k; }).then(() => this.drop(g)); }
    await this.tw.wait(.5); if (this.dead) return;
    // three fresh lumps for the finale (whoever is still under there stays put)
    const old = this.lumps.filter(l => l.state === 'hide');
    old.forEach(l => { l.state = 'sink'; l.tellGoal = -1; const y0 = l.c.root.position.y; this.tw.run(.22, k => { l.k = 1 - k; l.c.root.position.y = y0 - k * l.sc; }, ease.inQuad).then(() => { this.drop(l.c.root); l.gone = true; l.k = 0; }); });
    if (old.length) { await this.tw.wait(.25); if (this.dead) return; }
    const pool = shuffled(LV.pool.filter(k => k !== 'raccoon'));
    this.lumps = SLOTS[3].map((sl, i) => this.makeLump(pool[i], sl));
    this.live = this.live.filter(l => !l.gone).concat(this.lumps);
    this.lumps.forEach((l, i) => this.tw.run(.3, k => { l.k = k; }, ease.outBack, i * .08));
    // 엄마 at the door
    const mom = this.mom = new Char('mom'); mom.root.scale.setScalar(CS * .6);
    const mp = slotXZ([-1.22, 1.3]); mom.root.position.set(mp.x - 1.2, 0, mp.z + 1.2); mom.faceTo(W.cam.position.x, W.cam.position.z); mom.pose = 'hips';
    this.add(mom.root); this.extra.add(mom); W.idsDirty = true; L.audio.sfx('door');
    await this.tw.run(.45, k => { mom.root.position.set(mp.x - 1.2 * (1 - k), Math.abs(Math.sin(k * Math.PI * 3)) * .1, mp.z + 1.2 * (1 - k)); }, ease.outQuad);
    if (this.dead) return;
    this.sayC(mom, '얘들아~ 이제 불 끈다!', 1300);
    await this.tw.wait(1.1); if (this.dead) return;
    // 딸깍
    L.audio.sfx('click'); W.setLight(DARK); this.nightEl.classList.add('on'); mom.setFace('happy');
    await this.tw.wait(.35); if (this.dead) return;
    this.lumps.forEach((l, i) => setTimeout(() => { if (this.dead) return; l.shake = 1.2; this.sayL(l, ['킥킥…', '쉿!', '키득키득'][i % 3], 700); L.audio.sfx('giggle'); }, i * 260));
    await this.tw.wait(1.1); if (this.dead) return;
    // 베개 싸움!
    W.setLight(COZY); this.nightEl.classList.remove('on'); L.audio.sfx('special');
    L.ui.banner('베개 싸움이다~!', null, 1000);
    this.lumps.forEach((l, i) => { this.tw.wait(i * .07).then(() => !this.dead && this.reveal(l, .8).then(() => { if (!this.dead) { l.c.pose = i % 2 ? 'flail' : 'cheer'; l.c.setFace(i % 2 ? 'wow' : 'happy'); } })); });
    this.pillowFight();
    mom.setFace('sweat'); mom.pose = 'cover';
    await this.tw.wait(.7); if (this.dead) return;
    this.sayC(mom, '어휴~ 못 말려!', 1200);
    if (win) { L.audio.sfx('win'); W.fx.confetti(90); } else L.audio.sfx('giggle');
    await this.tw.wait(1.5); if (this.dead) return;
    const h = L.h, last = this.lvIdx >= LEVELS.length - 1;
    L.ui.panel({ title: win ? (stars >= 3 ? '이불 속 탐정!' : '다 찾았다!') : '아쉽다~', color: win ? 'green' : 'orange', body: [
      h('div', { class: 'bk-stars' }, ...[0, 1, 2].map(k => h('span', { class: k < stars ? 'on' : '' }, '★'))),
      h('div', { class: 'txt' }, `${this.score}점 · 친구 ${this.found}명 찾음 · 최고 ${this.best}연속`),
      h('div', { class: 'txt' }, win ? (stars >= 3 ? '귀만 봐도 다 알아! 이불 속 탐정 인정' : '다섯 번 연속 맞히면 피버타임이야') : `${LV.stars[0]}점부터 성공! 삐죽 나온 귀·꼬리를 잘 봐`)],
      // a break game: a miss never blocks you — retry is the big button, moving on is right next to it
      buttons: win ? [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
        this.nextBtn = L.ui.btn(last ? '처음 이불부터' : '다음 이불', { color: 'green', cls: 'big', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) })]
        : [L.ui.btn('넘어가기', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) }),
          this.nextBtn = L.ui.btn('다시 하기', { color: 'orange', cls: 'big', onClick: () => L.go({ lv: this.lvIdx }) })] });
  }
  // pillows fly back and forth over the futon
  pillowFight() {
    const L = this.L, P = this.pillows, spots = SLOTS[3].map(slotXZ);
    P.forEach((p, i) => {
      const hop = async (n) => {
        if (this.dead || n <= 0) return;
        const a = p.position.clone(), b0 = spots[(i + n) % 3], b = new THREE.Vector3(b0.x + (Math.random() - .5) * .5, TOP + .5 + Math.random() * .4, b0.z + (Math.random() - .5) * .5);
        const r0 = p.rotation.clone(), spin = (Math.random() < .5 ? -1 : 1) * (4 + Math.random() * 3);
        L.audio.sfx('whoosh');
        await this.tw.run(.42, k => { p.position.lerpVectors(a, b, k); p.position.y += Math.sin(k * Math.PI) * 1.0; p.rotation.set(r0.x + spin * k * .6, r0.y + spin * k, r0.z); }, ease.linear);
        if (this.dead) return;
        const s = L.world.toScreen(p.position); L.world.fx.burst(s.x, s.y, { n: 6, colors: ['#ffffff', '#fff3d6'], shape: 'circle', size: 6, speed: 150, life: .4, gravity: 200 }); L.audio.sfx('pop', 3 + i);
        hop(n - 1);
      };
      this.tw.wait(.25 + i * .18).then(() => hop(3));
    });
  }
  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.removeEventListener('pointerdown', this._down); app.classList.remove('bk');
    for (const o of [...this.objs]) { W.root.remove(o); disposeTree(o); }
    this.objs.clear(); this.lumps = []; this.live = []; this.extra.clear();
    this.feverEl?.remove(); this.nightEl?.remove(); this.qEl?.remove(); document.querySelectorAll('.bk-get').forEach(e => e.remove());
    document.getElementById('bk-css')?.remove(); W.camLock = false; W.setLight(null);
  }

  // ── bots (QA) press the same cards a player does: smart knows who is under the asked lump (and grabs snacks),
  // random presses any card that is still up
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 2.5 && this.L.ui.panelOpen) { this._endT = 0; this.nextBtn?.press(); } return; }
    if (this.phase !== 'play') return;
    if (mode !== 'random' && this.snack && !this.snack.got) { const s = this.L.world.toScreen(new THREE.Vector3(this.snack.x, TOP + .15, this.snack.z)); this.tapScene(s.x, s.y); }
    if (!this.cur || this.lock) return;
    if (this._bt == null) this._bt = mode === 'random' ? .35 + Math.random() * .45 : .5 + Math.random() * .2;
    if (this.askT < this._bt) return;
    this._bt = null;
    const up = this.cards.filter(c => !c.classList.contains('used'));
    const card = mode === 'random' ? pickOne(up) : up.find(c => c.kind === this.cur.who);
    card?.press();
  }
  state() {
    return { scene: 'blanket', lv: this.lvIdx + 1, phase: this.phase, result: this.result || null, score: this.score, round: this.roundN, combo: this.combo, best: this.best,
      found: this.found, miss: this.miss, fever: +(this.fever || 0).toFixed(1), left: +(this.left || 0).toFixed(1), cur: this.cur?.who || null,
      hiding: this.lumps.filter(l => l.state === 'hide').map(l => l.kind), cards: this.cards.map(c => c.kind) };
  }
  get api() {
    return {
      finish: () => { this.left = 0; },
      freeze: (on = true) => { this.frozen = on; },
      round: kinds => { this.forced = kinds; },
      shuffle: async () => { if (this.lumps.length < 2) return; this.lock = true; this.qEl.style.display = 'none'; await this.shuffle(); this.lock = false; this.ask(); },
      snack: () => { if (!this.snack) this.spawnSnack(); },
      // QA: replace whatever is under the quilt with these friends right now (no shuffle)
      show: kinds => { for (const l of this.lumps) { this.drop(l.c.root); l.gone = true; l.k = 0; } this.lumps = []; this.forced = kinds; this.noShuffle = true; this.nextRound(); },
    };
  }
}

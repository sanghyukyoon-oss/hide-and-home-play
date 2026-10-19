// 다 같이 집으로! — a 쉬어가기 (10/19, user via 숨바꼭집 인수인계: "화살표 빼내기인데 이거 좀 디벨롭시켜보는 방안 필요할듯. 물론
// 우리 소스들로"; after playing it in the game: "화살표만 재밌는거같다. 근데 디자인이 너무 이상함.. 뷰도 내가 돌려볼수 있게 해주고
// … 이걸 좀 늘려보자"). 숨바꼭질 is over and it's getting late: on a paved square in the neighbourhood every friend stands on
// a slab with a chalk arrow at its feet. Tap a friend whose way is clear and it runs off that way, home ("내일 또 놀자~");
// a friend whose way is blocked runs into whoever is in front, bonks and comes back (the sun sinks 3 seconds).
// Drag the screen to turn the square round (it settles on the game's diagonal views, like the stages).
// Six set-ups, one new thing at a time, so it can come back between stages without going stale:
//   0 놀이터          5×5, six friends                          (the rule)
//   1 골목길          + things in the way (cones, a tub, a postbox…)
//   2 덤불 숨바꼭질    + friends still hiding in bushes (tap the bush: 찾았다!)
//   3 빙글 너굴이      6×6 + 너굴이, whose arrow turns a quarter each time a friend goes home
//   4 졸린 친구들      + friends who fell asleep (one tap wakes them, the next sends them)
//   5 해 질 녘         all of it, at sunset
//   6 / 7 (the campaign, 43판 뒤 / 52판 뒤): two in a row — 놀이터 then a short 덤불 one; a campsite then a short sleepy one
// Sending a friend never makes the square unsolvable (it only opens ways), so there's no undo; stars count the bonks.
import * as THREE from 'three';
import { Room } from '../room.js';
import { THEMES } from '../stages.js';
import { Char } from '../gfx/chars.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree } from '../gfx/kit.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const DAY = { ambColor: '#fff2e4', amb: 1.5, sunColor: '#fff3e0', sun: 2.3 };
const FRIENDS = ['bunny', 'frog', 'hamster', 'squirrel', 'shiba', 'panda', 'cheese', 'dj', 'calico', 'peng', 'bear', 'kkamang', 'hayang', 'skater'];
const BYE = ['내일 또 놀자~', '안녕~!', '다녀올게!', '잘 가~', '내일 봐!', '집에 가야지~'];
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // the four ways along the grid
const SIZE = 1.12;
const BONK_T = 3;                                 // seconds of sun a bonk costs
const RING = 3;                                   // ground round the square: a free strip to run out on, then the street / park
const PLACES = {
  park: { theme: 'park2', walls: { N: 'fence', W: 'hedge', S: 'none', E: 'none' }, rocks: ['rock', 'picnic', 'parkbin', 'mushrooms', 'cooler'], hide: 'bush',
    around: ['tree', 'bush', 'pine', 'tree', 'bush', 'streetlamp'], low: ['bush', 'mushrooms'], floor: 'grass' },
  alley: { theme: 'alley1', walls: { N: 'alleywall', W: 'alleywall', S: 'none', E: 'none' }, rocks: ['cones', 'daeya', 'trashbags', 'hydrant', 'postbox2', 'aircon'], hide: 'boxstack',
    around: ['streetlamp', 'pole', 'vending', 'aircon', 'postbox2', 'trashbags', 'daeya'], low: ['cones', 'trashbags', 'daeya'], floor: 'asphalt',
    decor: [['gate', 'N', 0], ['mailbox', 'N', 1.8], ['gate', 'W', -.4], ['catsign', 'W', 1.9]] },
  camp: { theme: 'camp1', walls: { N: 'none', W: 'none', S: 'none', E: 'none' }, rocks: ['rock', 'cooler', 'rockpile', 'mushrooms', 'lantern'], hide: 'tentsmall',
    around: ['pine', 'pine2', 'tentsmall', 'pine', 'campchair', 'rock'], low: ['mushrooms', 'rock', 'campchair'], floor: 'dirt' },
};
const LEVELS = [
  { name: '놀이터', place: 'park', n: 5, count: 6, rocks: 0, hidden: 0, spin: 0, sleepy: 0, time: 60 },
  { name: '골목길', place: 'alley', n: 5, count: 8, rocks: 3, hidden: 0, spin: 0, sleepy: 0, time: 65 },
  { name: '덤불 숨바꼭질', place: 'park', n: 5, count: 8, rocks: 2, hidden: 2, spin: 0, sleepy: 0, time: 70, card: 'bush' },
  { name: '빙글 너굴이', place: 'alley', n: 6, count: 10, rocks: 2, hidden: 0, spin: 1, sleepy: 0, time: 80, card: 'spin' },
  { name: '졸린 친구들', place: 'park', n: 6, count: 10, rocks: 2, hidden: 1, spin: 0, sleepy: 2, time: 85, card: 'sleepy' },
  { name: '해 질 녘', place: 'alley', n: 6, count: 12, rocks: 3, hidden: 2, spin: 1, sleepy: 1, time: 95, dusk: true },
  // the campaign plays two in a row (user, 10/19: "한판은 좀 아쉬운데 한번 나올때 2판정도 총2번"; the 11~70판 level session:
  // 1:30 at most, the second one short (4×4, four friends, 30 s), one speech line between, no card): 43판 뒤 and 52판 뒤
  { name: '놀이터 + 덤불', set: [0, { name: '덤불 속 친구', place: 'park', n: 4, count: 4, rocks: 0, hidden: 2, spin: 0, sleepy: 0, time: 30, hint: '흔들리는 덤불을 톡!' }],
    lines: ['어? 덤불이 흔들려… 아직 숨은 친구가 있다!', '이제 진짜 다 찾았다~'] },
  { name: '캠핑장 + 졸린 친구', set: [{ name: '캠핑장', place: 'camp', n: 5, count: 7, rocks: 3, hidden: 0, spin: 0, sleepy: 0, time: 60 },
    { name: '텐트 앞 졸린 친구', place: 'camp', n: 4, count: 4, rocks: 1, hidden: 0, spin: 0, sleepy: 2, time: 30, hint: '자는 친구는 톡 해서 깨워요', sleeper: 'sleepy' }],
    lines: ['어? 텐트 앞에서 쿨쿨 소리가…', '이제 진짜 다 갔다~'] },
];
export { LEVELS };

// ── the puzzle: cells (x, y). A friend's way = the cells from it to the edge in its direction.
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
  const go = rest => {
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
  return r && r !== true ? list.find(p => p.id === r.id) : null;
}
// a square that can be solved: friends placed one by one, each with a clear way among those placed before it (so they can
// leave in the reverse order), strongly preferring spots in the way of earlier ones (that's what makes it a puzzle)
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
    if (LV.spin) { const c = list.filter(p => !wayClear(p, list, rocks, n)); const s = c[Math.floor(Math.random() * c.length)]; if (!s) continue; s.spin = true; }
    if (!solve(list, rocks, n)) continue;
    // friends still hiding (never 너굴이, never the only way on at the start), and friends who dozed off
    const hideable = list.filter(p => !p.spin && !wayClear(p, list, rocks, n));
    for (let k = 0; k < LV.hidden && hideable.length; k++) hideable.splice(Math.floor(Math.random() * hideable.length), 1)[0].hid = true;
    const sleepers = list.filter(p => !p.spin && !p.hid);
    for (let k = 0; k < (LV.sleepy || 0) && sleepers.length; k++) sleepers.splice(Math.floor(Math.random() * sleepers.length), 1)[0].sleep = true;
    return { list, rocks };
  }
  return null;
}

const CSS = `
#app.gh { background: radial-gradient(120% 80% at 50% 22%, #fffaf0 0%, #ffe9d4 55%, #f7d3c0 100%); }
#app.gh.dusk { background: radial-gradient(120% 80% at 50% 22%, #ffe9cf 0%, #ffc9a8 50%, #e6a2a8 100%); }
.gh-sun { margin-left: auto; position: relative; width: 112px; height: 26px; border-radius: 999px; background: #fffaf2; border: 3px solid #3a2453; box-shadow: 0 3px 0 #3a2453; overflow: hidden; pointer-events: none; }
.gh-sun i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: linear-gradient(90deg, #ffe7a0, #ffc75a); transition: width .3s linear; }
.gh-sun b { position: absolute; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%; background: #ffcf3c; border: 2.5px solid #3a2453; transition: left .3s linear; }
.gh-sun.hurry i { background: linear-gradient(90deg, #ffb7a8, #ff7a6b); }
.gh-sun.hurry b { background: #ff8a5c; animation: ghBeat .5s ease-in-out infinite; }
@keyframes ghBeat { 50% { transform: scale(1.18); } }
.gh-friends { position: absolute; left: 50%; top: calc(62px + var(--safeT, 0px)); transform: translateX(-50%); display: flex; flex-wrap: wrap; justify-content: center; gap: 3px; max-width: 92vw; pointer-events: none; }
.gh-friends span { position: relative; width: 30px; height: 30px; border-radius: 50%; background: #fffaf2; border: 2.5px solid #3a2453; overflow: hidden; transition: transform .25s cubic-bezier(.2, 1.7, .4, 1); }
.gh-friends span img { width: 100%; height: 100%; display: block; }
.gh-friends span.home { background: #b8f58c; transform: scale(.86); }
.gh-friends span.home img { opacity: .45; }
.gh-friends span.home::after { content: ''; position: absolute; left: 7px; top: 4px; width: 9px; height: 15px; border: solid #2f8a3a; border-width: 0 4px 4px 0; transform: rotate(40deg); }
.gh-friends span.pop { transform: scale(1.25); }
.gh-hint { position: absolute; left: 50%; bottom: calc(24px + var(--safeB, 0px)); transform: translateX(-50%); color: #3a2453; font-size: 16px; white-space: nowrap; background: #fffaf2; border: 3px solid #3a2453; box-shadow: 0 3px 0 #3a2453; padding: 6px 14px 7px; border-radius: 999px; pointer-events: none; transition: opacity .3s; }
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
`;

// the square's slabs: one canvas, a soft-edged paving slab per cell with a thin grout line (so the cells read)
function slabTex(n, place) {
  const P = 64, cv = document.createElement('canvas'); cv.width = cv.height = n * P; const c = cv.getContext('2d');
  const cols = place === 'park' ? ['#f4e6cf', '#efdcc0', '#f7ecd9'] : ['#ece3d6', '#e3d8ca', '#f1e9de'];
  c.fillStyle = place === 'park' ? '#cdb592' : '#bdb1a6'; c.fillRect(0, 0, n * P, n * P);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    c.fillStyle = cols[(x * 7 + y * 3) % cols.length]; c.beginPath(); c.roundRect(x * P + 3, y * P + 3, P - 6, P - 6, 9); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.roundRect(x * P + 6, y * P + 6, P - 12, 10, 5); c.fill();
    c.fillStyle = 'rgba(120,90,60,.08)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x * P + 10 + ((x * 13 + y * 29 + k * 17) % 44), y * P + 18 + ((x * 31 + y * 7 + k * 23) % 36), 2.2, 0, 7); c.fill(); }
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// a chalk arrow on the slab: yellow chalk with a soft grain and a thick ink edge (white chalk vanished on the pale slabs);
// 너굴이's is lilac with a little turn mark, a sleeper's is grey until it wakes, mint = "this one can go" (the hint)
const ARROWS = {};
function arrowTex(kind) {
  if (ARROWS[kind]) return ARROWS[kind];
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 192; const c = cv.getContext('2d');
  c.lineJoin = 'round'; c.lineCap = 'round';
  const shape = () => { c.beginPath(); c.moveTo(64, 10); c.lineTo(118, 76); c.lineTo(86, 76); c.lineTo(86, 182); c.lineTo(42, 182); c.lineTo(42, 76); c.lineTo(10, 76); c.closePath(); };
  shape(); c.lineWidth = 17; c.strokeStyle = '#3a2453'; c.stroke();
  c.fillStyle = kind === 'spin' ? '#c9a7ff' : kind === 'sleep' ? '#c9c3d3' : kind === 'go' ? '#8ff0b8' : '#ffd84a'; c.fill();
  // chalk grain
  c.save(); shape(); c.clip(); c.fillStyle = 'rgba(255,255,255,.4)'; for (let k = 0; k < 90; k++) { c.beginPath(); c.arc(Math.random() * 128, Math.random() * 192, 1 + Math.random() * 2, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(58,36,83,.07)'; for (let k = 0; k < 60; k++) { c.beginPath(); c.arc(Math.random() * 128, Math.random() * 192, 1.5, 0, 7); c.fill(); } c.restore();
  if (kind === 'spin') { c.strokeStyle = '#3a2453'; c.lineWidth = 7; c.beginPath(); c.arc(64, 128, 18, -Math.PI * .15, Math.PI * 1.25); c.stroke(); c.beginPath(); c.moveTo(80, 114); c.lineTo(84, 130); c.lineTo(68, 126); c.stroke(); }
  if (kind === 'sleep') { c.fillStyle = '#3a2453'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.fillText('z', 58, 140); c.font = 'bold 24px sans-serif'; c.fillText('z', 76, 116); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (ARROWS[kind] = t);
}

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.objs = []; }
  add(o) { this.L.world.root.add(o); this.objs.push(o); return o; }
  async enter({ lv = 0, look } = {}) {
    const L = this.L;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const SET = this.set = LEVELS[this.lvIdx];
    this.rounds = (SET.set || [this.lvIdx]).map(r => typeof r === 'number' ? LEVELS[r] : r); this.ri = 0;
    this.look = look || (typeof location !== 'undefined' && new URLSearchParams(location.search).get('ghlook')) || 'a';
    if (!document.getElementById('gh-css')) { const s = document.createElement('style'); s.id = 'gh-css'; s.textContent = CSS; document.head.append(s); }
    document.getElementById('app').dataset.night = '';
    this.home = 0; this.bonks = 0; this.result = null; this.phase = 'intro'; this.lock = new Set();
    L.makeThumbs({ faces: [['mong', 'happy'], ['raccoon', 'happy'], ['bunny', 'happy'], ['sleepy', 'normal'], ...FRIENDS.map(k => [k, 'normal'])] });
    this.buildHud();
    this.bindInput();
    this.buildRound(this.rounds[0]);
    const me = this.me;
    L.say(me, '다 찾았다! 이제 집에 가자~', 1500); me.pose = 'cheer'; me.setFace('happy');
    await this.tw.wait(1.1); if (this.dead) return;
    me.pose = 'idle';
    this.phase = 'play';
    if (this.lv.card) this.gotCard(this.lv.card);
    this.glowT = 2.4;
  }
  // one round's square: the ground and things round it, the slabs, the friends and 몽글이 (a second round rebuilds it all)
  buildRound(LV) {
    const L = this.L, W = L.world, n = LV.n, PL = this.place = PLACES[LV.place];
    this.lv = LV;
    const app = document.getElementById('app'); app.classList.add('gh'); app.classList.toggle('dusk', !!LV.dusk);
    L.setBg(LV.dusk ? ['#ffe2c6', '#f2b9a6'] : ['#fff6ea', '#ffe3cf']);
    W.setLight(LV.dusk ? { ...DAY, sunColor: '#ffbf8a', amb: 1.3 } : DAY);
    const lawn = makeLawn(LV) || makeLawn(LV, false) || makeLawn({ ...LV, spin: 0, hidden: 0, sleepy: 0 }, false);
    this.rocks = lawn.rocks; this.n = n;
    // the square in the middle of the street / park / campsite: a free strip round it to run out on, then the things around
    const R = n + 2 * RING, furniture = [];
    let ri = 0; for (const k of this.rocks) { const [x, y] = k.split(',').map(Number); furniture.push(F(PL.rocks[ri++ % PL.rocks.length], x + RING, y + RING, Math.floor(Math.random() * 4))); }
    for (const p of lawn.list.filter(p => p.hid)) furniture.push(F(PL.hide, p.x + RING, p.y + RING));
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
      const out = Math.max(RING - 1 - i, i - (n + RING), RING - 1 - j, j - (n + RING)); if (out < 1 || Math.random() > .36) continue;
      // nearest you (south and east of the square) only low things, a row further out: tall ones would stand over it
      const front = j >= n + RING || i >= n + RING; if (front && (j < n + RING + 2 && i < n + RING + 2)) continue;
      const set = front ? PL.low : PL.around; furniture.push(F(set[Math.floor(Math.random() * set.length)], i, j, Math.floor(Math.random() * 4)));
    }
    const layout = { w: R, d: R, theme: THEMES[PL.theme] || THEMES.park2, bleed: {}, walls: PL.walls, furniture, decor: (PL.decor || []).map(([type, wall, u]) => ({ type, wall, u })) };
    const room = this.room = new Room(W, layout); this.add(room.group); room.group.updateMatrixWorld(true);
    this.half = R / 2;
    // the slabs (one canvas over the square's cells)
    const slab = new THREE.Mesh(new THREE.PlaneGeometry(n, n), new THREE.MeshLambertMaterial({ map: slabTex(n, LV.place) }));
    slab.rotation.x = -Math.PI / 2; const c0 = this.cellW((n - 1) / 2, (n - 1) / 2); slab.position.set(c0.x, .012, c0.z); slab.receiveShadow = true; this.add(slab);
    const hides = room.furns.filter(r => r.type === PL.hide && r.i >= RING && r.i < RING + n && r.j >= RING && r.j < RING + n);
    for (const r of hides) r.f.group.scale.setScalar(PL.hide === 'bush' ? 1.25 : 1.05);
    // the friends (a round that has sleepers can name who: 졸졸이 at its own tent)
    const kinds = FRIENDS.slice().sort(() => Math.random() - .5);
    let named = LV.sleeper || null;
    this.pieces = lawn.list.map((p, k) => {
      const kind = p.spin ? 'raccoon' : p.sleep && named ? (named = null, LV.sleeper) : kinds[k % kinds.length], c = new Char(kind);
      c.root.scale.setScalar(SIZE); const w = this.cellW(p.x, p.y); c.root.position.set(w.x, 0, w.z); this.add(c.root);
      const arrow = new THREE.Mesh(new THREE.PlaneGeometry(.72, 1.08), new THREE.MeshBasicMaterial({ map: arrowTex(p.spin ? 'spin' : p.sleep ? 'sleep' : 'chalk'), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      arrow.rotation.x = -Math.PI / 2; arrow.renderOrder = 2; this.add(arrow);
      // and a faint copy drawn through bodies: an arrow behind its friend still shows (not a sticker on top of it)
      const ghost = new THREE.Mesh(arrow.geometry, new THREE.MeshBasicMaterial({ map: arrow.material.map, transparent: true, opacity: .42, depthWrite: false, depthTest: false }));
      ghost.renderOrder = 6; arrow.add(ghost);
      const q = { ...p, kind, c, arrow, state: p.hid ? 'hid' : 'idle', box: null, awake: !p.sleep };
      if (p.hid) { q.box = hides.find(b => b.i === p.x + RING && b.j === p.y + RING) || null; c.root.visible = false; arrow.visible = false; }
      if (p.sleep) this.doze(q, true);
      this.aim(q, true);
      return q;
    });
    // 몽글이 (it found everyone) on the ground in front, past where the runners vanish
    const me = this.me = new Char('mong'); const cw = this.cellW(n + 1.2, n + 1.2); me.root.position.set(cw.x, 0, cw.z); me.root.scale.setScalar(1.3); this.add(me.root);
    this.frame();
    me.faceTo(W.cam.position.x, W.cam.position.z);
    this.homeR = 0; this.total = (this.total || 0) + this.pieces.length; this.left = LV.time; this.lock = new Set(); this.glowT = 0;
    this.title.lastChild.textContent = this.set.set ? `${LV.name}${this.rounds.length > 1 ? ` (${this.ri + 1}/${this.rounds.length})` : ''}` : LV.name;
    this.chipsEl.replaceChildren(...this.pieces.map(q => { const s = L.h('span', {}, L.h('img', { src: L.thumbs[`face_${q.kind}_normal`], alt: '' })); q.chip = s; return s; }));
    if (LV.hint) { this.hint.textContent = LV.hint; this.hint.classList.remove('gone'); }
    W.idsDirty = true; W.shadowDirty = true;
  }
  // the first round done: 몽글이 says the one line, the square swaps for the short second one
  async nextRound() {
    const L = this.L, W = L.world; this.phase = 'between';
    const line = this.set.lines?.[0]; if (line) L.say(this.me, line, 1500);
    this.me.pose = 'point'; L.audio.sfx('gasp');
    await this.tw.wait(1.3); if (this.dead) return;
    await L.ui.irisOut?.(); if (this.dead) return;
    for (const q of this.pieces) q.zz?.remove();
    for (const o of this.objs) { W.root.remove(o); disposeTree(o); } this.objs = [];
    this.ri++; this.buildRound(this.rounds[this.ri]);
    await L.ui.irisIn?.(); if (this.dead) return;
    this.phase = 'play'; this.glowT = 2;
  }
  cellW(x, y) { return { x: -this.half + x + RING + .5, z: -this.half + y + RING + .5 }; }
  // the chalk arrow from a friend's feet to the edge of its slab (the tip shows past the friend from any side)
  aim(q, now) {
    const [dx, dy] = DIRS[q.dir], w = this.cellW(q.x, q.y), yaw = Math.atan2(dx, dy);
    q.arrow.position.set(w.x + dx * .1, .03, w.z + dy * .1);
    q.dirYaw = yaw; if (now) q.arrow.rotation.z = yaw + Math.PI;
  }
  // asleep: the sleepy eye arcs, a grey arrow and Zz; awake: a stretch, and the arrow turns white
  doze(q, on) {
    const c = q.c; c.setFace('normal');
    if (on) { c.eyes.forEach(e => (e.visible = false)); c.eyesSleep.forEach(e => (e.visible = true)); q.zz = this.L.say(c, 'Zz…', 1e9, 'think'); }
    else { q.zz?.remove(); q.zz = null; }
  }
  frame() {
    const W = this.L.world, n = this.n;
    this.yaw0 = this.look === 'b' ? 0 : Math.PI / 4;
    W.home.set(0, .35, .2); W.target.copy(W.home); W.yaw = this.yaw0; W.pitch = this.look === 'b' ? .9 : .84; W.zoom = 1;
    W.bounds = 99; W.slack = null; W.camLock = true;
    // the square's diagonal fills the width (whichever way it's turned)
    const span = this.look === 'b' ? n + 1 : n * Math.SQRT2 + .7;
    W.setFit(span, span * .85, .5);
    this.yawGoal = W.yaw;
  }
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col();
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), this.title = h('div', { class: 'lab-title ol' }, '다 같이 집으로!', h('small', {}, '')));
    this.sun = h('div', { class: 'gh-sun' }, this.sunI = h('i'), this.sunB = h('b'));
    top.append(this.sun);
    col.append(top);
    // everyone on the square as a little face; a tick when they're home
    col.append(this.chipsEl = h('div', { class: 'gh-friends' }));   // (filled by each round)
    this.hint = h('div', { class: 'gh-hint' }, '앞길이 열린 친구부터 톡!'); col.append(this.hint);
  }
  gotCard(kind) {
    const L = this.L, h = L.h;
    const C = {
      bush: [L.thumbs.face_bunny_happy, this.place.hide === 'bush' ? '덤불 속 친구!' : '상자 뒤 친구!', '흔들리는 곳을 톡 하면 나와요'],
      spin: [L.thumbs.face_raccoon_happy, '빙글 너굴이!', '친구가 한 명 갈 때마다 화살표가 빙글 돌아요'],
      sleepy: [L.thumbs.face_sleepy_normal, '졸린 친구들!', '한 번 톡 하면 깨고, 한 번 더 톡 하면 가요'],
    }[kind];
    const c = h('div', { class: 'gh-get' }, h('img', { src: C[0] }), h('div', {}, h('div', { class: 'gh-get-t ol' }, '새로 나왔다!'), h('div', { class: 'gh-get-s' }, C[1]), h('div', { class: 'gh-get-s' }, C[2])));
    document.getElementById('app').append(c); L.audio.sfx('gasp');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2600);
  }
  // a tap picks a friend; a drag turns the square round (and settles on a diagonal view when you let go)
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => {
      if (e.button > 0 || this.result || this.phase !== 'play' || this.ptr) return;
      this.ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, t: performance.now(), drag: false, yaw: this.L.world.yaw };
    };
    this._move = e => {
      const P = this.ptr; if (!P || e.pointerId !== P.id) return;
      if (!P.drag && Math.hypot(e.clientX - P.x, e.clientY - P.y) > 10) P.drag = true;
      if (P.drag) { this.L.world.yaw = P.yaw - (e.clientX - P.x0) * Math.PI / (innerWidth * .9); this.yawGoal = null; this.turned = true; }
    };
    this._up = e => {
      const P = this.ptr; if (!P || (e.pointerId != null && e.pointerId !== P.id)) return;
      this.ptr = null;
      if (!P.drag) { if (!this.result && this.phase === 'play') this.tapAt(P.x, P.y); return; }
      // settle on the nearest of the four views the stages use (the square's sides then line up as they do there)
      const W = this.L.world, base = this.yaw0, step = Math.PI / 2;
      this.yawGoal = base + Math.round((W.yaw - base) / step) * step;
    };
    app.addEventListener('pointerdown', this._down); addEventListener('pointermove', this._move); addEventListener('pointerup', this._up); addEventListener('pointercancel', this._up);
  }
  // the friend (or bush / box) on the slab under the finger — a fat finger on the friend's body counts too
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
    if (!q.awake) return this.wake(q);
    const live = this.live(), n = this.n;
    if (q.spin && live.length === 1 && !wayClear(q, live, this.rocks, n)) { this.turn(q); L.say(q.c, '빙글~', 600); return; }
    if (!wayClear(q, live, this.rocks, n)) return this.bonk(q);
    this.send(q);
  }
  reveal(q) {
    const L = this.L, W = L.world; this.lock.add(q);
    q.state = 'idle'; q.c.root.visible = true; q.arrow.visible = true; q.arrow.scale.setScalar(.01);
    const b = q.box?.f.group, w = this.cellW(q.x, q.y), s0 = b ? b.scale.x : 1;
    L.audio.sfx('found'); L.say(q.c, '찾았다~!', 800);
    const s = W.toScreen(new THREE.Vector3(w.x, 1, w.z)); L.ui.floatText(s.x, s.y - 30, '찾았다!', 'gold');
    this.tw.run(.3, k => { if (b) { b.scale.setScalar(s0 * (1 - k)); b.rotation.y = k * 3; } q.c.root.position.y = Math.sin(k * Math.PI) * .7; q.arrow.scale.setScalar(Math.max(.01, k)); }, ease.outQuad)
      .then(() => { if (b) b.visible = false; q.c.root.position.y = 0; this.lock.delete(q); });
    q.c.setFace('happy'); q.c.bump(.4);
    W.idsDirty = true; W.shadowDirty = true;
  }
  wake(q) {
    const L = this.L; this.lock.add(q);
    q.awake = true; this.doze(q, false); q.c.setFace('wow'); q.c.bump(.5); L.say(q.c, '하암~ 깼다!', 800); L.audio.sfx('hop');
    this.setArrow(q, 'chalk');
    setTimeout(() => { if (this.dead) return; q.c.setFace('normal'); this.lock.delete(q); }, 450);
  }
  turn(q) { q.dir = (q.dir + 1) % 4; this.aim(q, false); this.L.audio.sfx('swish'); }
  setArrow(q, kind) { const t = arrowTex(kind); for (const m of [q.arrow, q.arrow.children[0]]) { m.material.map = t; m.material.needsUpdate = true; } }
  // way clear: it turns, runs off over the edge of the square and away
  send(q) {
    const L = this.L, W = L.world, [dx, dy] = DIRS[q.dir], n = this.n;
    q.state = 'run'; this.home++; this.homeR++; this._bonkRun = 0; L.log({ send: q.kind, t: +this.t.toFixed(1) });
    let steps = 0; { let x = q.x, y = q.y; while (x >= 0 && x < n && y >= 0 && y < n) { x += dx; y += dy; steps++; } }
    const w0 = this.cellW(q.x, q.y), dist = steps + 1.6, dur = .22 + dist * .11;
    L.audio.sfx('hop'); q.c.setFace('happy'); q.c.pose = 'cheer'; q.c.root.rotation.y = q.dirYaw;
    this.tw.run(.18, k => { q.arrow.scale.setScalar(1 - k); }).then(() => { q.arrow.visible = false; });
    this.tw.run(dur, k => {
      const d = dist * k; q.c.root.position.set(w0.x + dx * d, Math.abs(Math.sin(k * dist * 2.2)) * .22, w0.z + dy * d);
      if (k > .75) q.c.root.scale.setScalar(SIZE * (1 - (k - .75) / .25 * .9));
    }, t => t).then(() => { q.state = 'home'; q.c.root.visible = false; });
    setTimeout(() => !this.dead && L.say(q.c, BYE[Math.floor(Math.random() * BYE.length)], 900), 80);
    q.chip?.classList.add('home', 'pop'); setTimeout(() => q.chip?.classList.remove('pop'), 260);
    for (const p of this.live()) if (p.spin && p !== q) { this.turn(p); const w = this.cellW(p.x, p.y), s = W.toScreen(new THREE.Vector3(w.x, 1.1, w.z)); L.ui.floatText(s.x, s.y, '빙글~', ''); }
    if (this.home >= 2 && !this._hint2) { this._hint2 = true; if (!this.turned) this.hint.textContent = '화면을 끌면 돌려 볼 수 있어요'; else this.hint.classList.add('gone'); setTimeout(() => !this.dead && this.hint.classList.add('gone'), 2600); }
    if (this.homeR >= this.pieces.length) setTimeout(() => { if (this.dead || this.result) return; if (this.ri < this.rounds.length - 1) this.nextRound(); else this.finish(true); }, 650);
  }
  // way blocked: it runs up to whoever (or whatever) is in front, bonks, and walks back; the sun sinks a little
  bonk(q) {
    const L = this.L, [dx, dy] = DIRS[q.dir], n = this.n, live = this.live();
    this.lock.add(q); this.bonks++; L.log({ bonk: q.kind, t: +this.t.toFixed(1) });
    this.left = Math.max(.5, this.left - BONK_T); { const w = this.cellW(q.x, q.y), s = L.world.toScreen(new THREE.Vector3(w.x, 1.3, w.z)); L.ui.floatText(s.x, s.y, `꽝! -${BONK_T}초`, 'red'); }
    let s = 0, x = q.x + dx, y = q.y + dy, hit = null;
    while (x >= 0 && x < n && y >= 0 && y < n) { if (this.rocks.has(x + ',' + y)) break; hit = live.find(p => p !== q && p.x === x && p.y === y); if (hit) break; s++; x += dx; y += dy; }
    const w0 = this.cellW(q.x, q.y), reach = s + .38, go = .1 + reach * .08;
    L.audio.sfx('hop'); q.c.root.rotation.y = q.dirYaw;
    this.tw.run(go, k => { const d = reach * k; q.c.root.position.set(w0.x + dx * d, Math.abs(Math.sin(k * Math.PI)) * .15, w0.z + dy * d); })
      .then(() => {
        L.audio.sfx('wobble'); q.c.setFace('dizzy'); q.c.bump(.6); L.say(q.c, '앗!', 600);
        if (hit) { hit.c.bump(.5); if (hit.awake && hit.state !== 'hid') { hit.c.setFace('wow'); setTimeout(() => !this.dead && hit.awake && hit.c.setFace('normal'), 700); }
          if (hit.state === 'hid') { const b = hit.box?.f.group; if (b) this.tw.run(.3, k => { b.rotation.z = Math.sin(k * 20) * .1 * (1 - k); }); } }
        return this.tw.run(go + .12, k => { const d = reach * (1 - k); q.c.root.position.set(w0.x + dx * d, 0, w0.z + dy * d); });
      })
      .then(() => { q.c.setFace('normal'); this.lock.delete(q); });
    // two bonks in a row: the friends who can go glow for a moment (the hint comes by playing)
    this._bonkRun = (this._bonkRun || 0) + 1; if (this._bonkRun >= 2) { this._bonkRun = 0; this.glowT = 1.6; }
  }
  update(dt) {
    const L = this.L, W = L.world;
    this.t += dt; this.tw.update(dt);
    // the view settles on a diagonal after a turn
    if (this.yawGoal != null) { const d = Math.atan2(Math.sin(this.yawGoal - W.yaw), Math.cos(this.yawGoal - W.yaw)); W.yaw += d * Math.min(1, dt * 9); if (Math.abs(d) < .002) { W.yaw = this.yawGoal; } }
    this.room?.update?.(dt); this.me?.update(dt);
    const cx = W.cam.position.x, cz = W.cam.position.z;
    if (this.me && this.ptr?.drag) this.me.faceTo(cx, cz);
    // the friends who can go now glow (at the start, and after two bonks in a row)
    if (this.glowT > 0) this.glowT -= dt;
    const live = this.live();
    for (const q of this.pieces) {
      if (q.state === 'home') continue;
      q.c.update(dt);
      // standing: turned mostly to you (faces show) and a little toward its way
      if (q.state !== 'run' && !this.lock.has(q)) {
        const w = this.cellW(q.x, q.y), toCam = Math.atan2(cx - w.x, cz - w.z), dd = Math.atan2(Math.sin(q.dirYaw - toCam), Math.cos(q.dirYaw - toCam));
        const goal = toCam + dd * .35, r = q.c.root.rotation.y; q.c.root.rotation.y = r + Math.atan2(Math.sin(goal - r), Math.cos(goal - r)) * Math.min(1, dt * 8);
      }
      const az = q.dirYaw + Math.PI, a0 = q.arrow.rotation.z; q.arrow.rotation.z = a0 + Math.atan2(Math.sin(az - a0), Math.cos(az - a0)) * Math.min(1, dt * 12);
      if (q.state === 'hid' && q.box) q.box.f.group.rotation.z = (this.t + q.id) % 2.2 < .35 ? Math.sin(this.t * 40) * .06 : 0;
      if (live.includes(q) && !this.lock.has(q)) { const free = this.glowT > 0 && q.state === 'idle' && q.awake && wayClear(q, live, this.rocks, this.n); q.arrow.scale.setScalar(free ? 1 + Math.abs(Math.sin(this.t * 6)) * .18 : 1); if (free !== q._glow) { q._glow = free; this.setArrow(q, free ? 'go' : q.spin ? 'spin' : q.awake ? 'chalk' : 'sleep'); } }
    }
    if (this.phase !== 'play' || this.result) return;
    this.left -= dt;
    const k = Math.max(0, this.left / this.lv.time);
    this.sunI.style.width = k * 100 + '%'; this.sunB.style.left = (8 + k * 84) + '%';
    this.sun.classList.toggle('hurry', this.left < 10);
    if (this.left <= 0) this.finish(false);
  }
  async finish(done) {
    if (this.result) return;
    const L = this.L; this.phase = 'end';
    const stars = done ? (this.bonks === 0 ? 3 : this.bonks <= 2 ? 2 : 1) : 0, win = stars >= 1;
    this.result = win ? 'win' : 'fail';
    L.log({ result: this.result, lv: this.lvIdx, stars, max: 3, home: this.home, bonks: this.bonks });
    if (win) { L.audio.sfx('win'); L.world.fx.confetti(70); this.me.setFace('happy'); this.me.pose = 'cheer'; L.say(this.me, this.set.lines?.[1] || '다들 잘 가~ 내일 또 숨바꼭질!', 1500); }
    else { L.audio.sfx('lose'); this.me.setFace('sweat'); L.say(this.me, '해가 져 버렸다…', 1300); for (const q of this.live()) { if (q.awake) q.c.setFace('sad'); } }
    await this.tw.wait(1.3); if (this.dead) return;
    const h = L.h, last = this.lvIdx >= LEVELS.length - 1;
    L.ui.panel({ title: win ? '모두 집에 갔다!' : '해가 졌다~', color: win ? 'green' : 'orange', body: [
      h('div', { class: 'gh-stars' }, ...[0, 1, 2].map(k => h('span', { class: k < stars ? 'on' : '' }, '★'))),
      h('div', { class: 'txt' }, `${this.home}/${this.total}명 집에 감 · 꽝 ${this.bonks}번`),
      h('div', { class: 'txt' }, win ? (stars >= 3 ? '한 번도 안 부딪혔어! 길 찾기 달인' : '꽝 없이 보내면 별 셋!') : '앞길이 열린 친구부터 보내 봐')],
      buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
        this.nextBtn = L.ui.btn(win ? (last ? '처음부터' : '다음 동네') : '다시 하기', { color: win ? 'green' : 'orange', cls: 'big', onClick: () => L.go({ lv: win ? (last ? 0 : this.lvIdx + 1) : this.lvIdx }) })] });
  }
  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.removeEventListener('pointerdown', this._down); removeEventListener('pointermove', this._move); removeEventListener('pointerup', this._up); removeEventListener('pointercancel', this._up);
    app.classList.remove('gh', 'dusk');
    for (const q of this.pieces || []) q.zz?.remove();
    for (const o of this.objs) { W.root.remove(o); disposeTree(o); }
    document.querySelectorAll('.gh-get').forEach(e => e.remove());
    W.camLock = false;
  }

  // ── bots (QA): smart sends whoever the solver says (wakes a sleeper first, finds hidden ones when nobody can go);
  // random taps anyone
  botStep(dt, mode) {
    if (this.result) { this._endT = (this._endT || 0) + dt; if (this._endT > 2.5 && this.L.ui.panelOpen) { this._endT = 0; this.nextBtn?.press(); } return; }
    if (this.phase !== 'play') return;
    if ((this._bt = (this._bt || 0) - dt) > 0) return; this._bt = mode === 'random' ? .45 + Math.random() * .4 : .55;
    const live = this.live().filter(q => !this.lock.has(q)); if (!live.length) return;
    if (mode === 'random') return this.tapPiece(live[Math.floor(Math.random() * live.length)]);
    const next = solve(this.live(), this.rocks, this.n);
    if (next && next.state === 'idle' && !this.lock.has(next)) return this.tapPiece(next);
    const hid = live.find(q => q.state === 'hid'); if (hid) return this.tapPiece(hid);
  }
  state() { return { scene: 'gohome', lv: this.lvIdx + 1, phase: this.phase, result: this.result || null, home: this.home, total: this.total, round: (this.ri || 0) + 1, bonks: this.bonks, left: +(this.left || 0).toFixed(1), hidden: this.pieces?.filter(q => q.state === 'hid').length, asleep: this.pieces?.filter(q => !q.awake).length, yaw: +this.L.world.yaw.toFixed(2) }; }
  get api() { return { finish: () => { this.left = 0; }, turn: a => { this.L.world.yaw = this.yaw0 + a; this.yawGoal = null; }, settle: () => { const W = this.L.world, s = Math.PI / 2; this.yawGoal = this.yaw0 + Math.round((W.yaw - this.yaw0) / s) * s; } }; }
}

// 이불 속 누구게? — a 35-second break between stages. A sleepover: friends sit in a row under one big patchwork quilt
// on the floor futon (요), right at its front hem. Nothing ever comes through the cloth: ears and hats only shape it
// (two tall soft peaks for 토순이, two round bumps for 판다, a floppy peak for 졸졸이's nightcap, prickles for 삐딱이), and
// tails, feet and props stick out from under the hem onto the mattress (a striped tail, a skateboard, a book, a fish,
// headphones). Now and then the hem lifts and two eyes peek out. The size of the lump is a clue too (판다 big, 햄찌 small).
// A "?" bounces over one lump: tap the face card of the friend under it. Right: the quilt is yanked up and drops, the
// friend jumps out "들켰다~!". Wrong: the friend you named pops out of the wardrobe, the toy chest or the laundry basket
// ("나 아니거든?") while the lump giggles, then shows itself (with the clue it had, so you learn it).
// Spice: lumps shuffle under the covers; 너굴이 in a friend's ears (his striped tail peeking from under the hem gives him
// away, taught by a "새로 나왔다!" card) — name the friend he copies and he jumps out "메롱~ 나였지롱!"; 추로 as a golden
// guest (+3); a snack peeking from under the hem (tap it, +2); five in a row = 피버타임 (×2, quick reveals). At the end
// 엄마 calls "얘들아~ 불 끈다!", the lights go off, giggles in the dark… and everyone tumbles out for a pillow fight.
import * as THREE from 'three';
import { Room } from '../room.js';
import { THEMES } from '../stages.js';
import { Char, CHAR_DEFS, defineChar } from '../gfx/chars.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree, rbox, put, mat, canvasTex, tor } from '../gfx/kit.js';
import { buildItem } from '../gfx/items.js';
import { tr } from '../i18n.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
const COZY = { ambColor: '#ffe8ef', amb: 1.5, sunColor: '#fff3e6', sun: 2.2 };
const DARK = { ambColor: '#565cb4', amb: .5, sunColor: '#8f9bff', sun: .3 };
const SQ = Math.SQRT1_2;
const CS = 1.6;                       // friends under the quilt are scaled up so their shapes read on a phone
const C0 = { x: .1, z: .25 };         // the futon's middle; it lies square to the camera (turned 45° in the room)
const TOP = .16, QB = .045;           // mattress top, quilt thickness
// futon-local coordinates: u across the screen (right +), w toward the camera (down +). The quilt's front hem is QZ[1].
const QX = [-1.78, 1.78], QZ = [-1.2, .42];
const MX = [-1.7, 1.7], MZ = [QZ[0] - .62, QZ[1] + .95];   // the mattress: pillows behind the quilt, a strip in front of the hem
const HEM = .6;                       // a friend sits this far (body units) behind the hem: the face just under it
const FOOT_Y = .1, FOOT_TILT = -2.09;  // a sole standing at the hem: its middle this high, leaning back (toes up) to face the camera
const BEANS = [[0, -.028, .046], [-.047, .05, .02], [0, .062, .021], [.047, .05, .02]];   // toe beans on a sole: x, z, r (foot units)
const SLOTS = { 1: [0], 2: [-.56, .56], 3: [-1.02, 0, 1.02] };
// the hem line for n friends: with three, the middle one sits forward and the outer two further back
const hemFor = n => n === 3 ? u => QZ[1] - .4 * (1 - Math.exp(-((u / .6) ** 2))) : n === 2 ? () => QZ[1] - .32 : () => QZ[1] - .2;
const toW = (u, w) => ({ x: C0.x + (u + w) * SQ, z: C0.z + (w - u) * SQ });
const toL = (x, z) => { const dx = x - C0.x, dz = z - C0.z; return { u: (dx - dz) * SQ, w: (dx + dz) * SQ }; };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * .25; };
const pickOne = a => a[Math.floor(Math.random() * a.length)];
const shuffled = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const V = new THREE.Vector3();
const COMBO_TEXT = n => tr(`${n} 연속`);   // the only place the combo label is written (숨바꼭집: through tr — shown via CSS attr())

// who can hide, how big their lump is, what they say when found, and the clue (named after a miss, so you learn it)
const WHO = {
  bunny: { line: '들켰다~!', tell: '길쭉한 귀 모양' },
  panda: { size: 1.2, line: '…벌써 찾았어?', tell: '까만 발이랑 동그란 귀' },
  hamster: { size: .74, line: '볼 빵빵~ 들켰다!', tell: '조그만 이불' },
  shiba: { line: '멍! 들켰당', tell: '말린 꼬리' },
  frog: { size: .95, line: '개굴! 찾았네?', tell: '동그란 눈 두 개' },
  skater: { line: '보드 때문이지?', tell: '삐죽 나온 보드' },
  sleepy: { line: '쿨… 어? 아침이야?', tell: '쿨쿨 Zzz', snore: true },
  nerd: { line: '흠, 훌륭한 추리군!', tell: '학사모랑 책' },
  squirrel: { size: .92, line: '도토리 줄게!', tell: '커다란 꼬리' },
  grumpy: { line: '…쳇, 들켰네', tell: '삐죽삐죽 가시' },
  dj: { line: '둠칫! 찾았구나', tell: '헤드폰이랑 음표' },
  bear: { size: 1.12, line: '곰돌이 여기!', tell: '동그란 귀, 꼬리는 없음' },
  cheese: { line: '냥~ 들켰다', tell: '주황 꼬리랑 생선' },
  kkamang: { line: '…냥. 들켰군', tell: '까만 꼬리' },
  hayang: { size: .95, line: '냐앙~ 찾았다!', tell: '하얀 꼬리' },
  calico: { line: '삼색이 등장~', tell: '주황 꼬리, 생선은 없음' },
  raccoon: { line: '헤헤, 들켰네~', tell: '줄무늬 꼬리' },
  churro: { line: '냐앙~ 츄르 줄 거야?', tell: '반짝반짝' },
};
// 너굴이 in disguise: a friend's ears (or board) on top — but the big striped tail always gives him away
const RC = CHAR_DEFS.raccoon;
if (!CHAR_DEFS.bk_rc_bunny) defineChar('bk_rc_bunny', { ...RC, name: '토끼 귀 쓴 너굴이', ear: 'bunny', earC: '#ffb3cd' });
if (!CHAR_DEFS.bk_rc_cheese) defineChar('bk_rc_cheese', { ...RC, name: '고양이 귀 쓴 너굴이', ear: 'kitty', earC: '#ffc2cf', earSide: ['#ffa449', '#ffa449'] });
if (!CHAR_DEFS.bk_rc_skater) defineChar('bk_rc_skater', { ...RC, name: '보드 탄 너굴이', acc: [['cap', { back: true, color: '#ff5d6c', tilt: .22 }]], prop: 'skateboard', idlePose: 'ride' });
const DISGUISE = { bk_rc_bunny: 'bunny', bk_rc_cheese: 'cheese', bk_rc_skater: 'skater' };
const isRaccoon = k => k === 'raccoon' || !!DISGUISE[k];

// ears shape the cloth a bit bigger than life (they are hidden under it; only their tips are used)
const EAR_BOOST = { bunny: 1.3, kitty: 1.6, cat: 1.5, shiba: 1.5, squirrel: 1.5, bear: 1.75, panda: 1.75, hamster: 1.9, flop: 1.5 };
const ROUND_EARS = new Set(['bear', 'panda', 'hamster', 'flop']);
const EAR_SLOPE = { bunny: 3, kitty: 2.4, cat: 2.4, shiba: 2.5, squirrel: 2.6 };   // steep enough that two ears stay two peaks
const TAIL_BOOST = { cat: 1.12, curl: 1.3, fluffy: .74, short: 1.35 };
// 삐딱이's spikes (as in chars.js), each one a little peak in the cloth
const SPIKES = [[0, 1.42, .23], [.95, 1.12, .21], [-.95, 1.12, .21], [Math.PI, 1.15, .22], [.42, .86, .19], [-.42, .86, .19], [1.35, .8, .21], [-1.35, .8, .21], [2.15, .82, .22], [-2.15, .82, .22], [Math.PI, .7, .23]];

const P1 = ['bunny', 'panda', 'hamster', 'shiba', 'frog', 'skater', 'sleepy', 'nerd', 'squirrel', 'dj', 'grumpy'];
const P2 = ['bunny', 'panda', 'hamster', 'shiba', 'frog', 'skater', 'sleepy', 'nerd', 'squirrel', 'dj', 'bear', 'raccoon', 'cheese'];
const P3 = ['bunny', 'panda', 'hamster', 'shiba', 'frog', 'skater', 'sleepy', 'squirrel', 'raccoon', 'cheese', 'kkamang', 'hayang', 'calico', 'bear'];
// three variants (one is picked each time the break comes round)
const LEVELS = [
  { name: '파자마 파티', time: 35, cards: 3, sizes: [1, 1, 2, 2, 3, 2, 3, 3], pool: P1, disguise: 0, shuffle: 0, duck: 0, stars: [10, 18, 26] },
  { name: '변장한 너굴이', time: 35, cards: 4, sizes: [1, 2, 2, 3, 2, 3, 3], pool: P2, disguise: .34, shuffle: .45, duck: 0, stars: [9, 17, 25], intro: 'raccoon' },
  { name: '고양이 친구들', time: 35, cards: 4, sizes: [2, 2, 3, 3, 3], pool: P3, disguise: .3, shuffle: .5, duck: .35, stars: [9, 17, 25], intro: 'cats' },
];

// ── the quilt: one soft heightfield over the futon (futon-local), with a hem that drops to the mattress at the front.
// Every lump is a smooth bump; ears and hats under it raise soft peaks; a peeking friend lifts the hem.
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
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.5; c.setLineDash([6, 5]);
    for (let k = 0; k <= n; k++) { c.beginPath(); c.moveTo(k * s, 0); c.lineTo(k * s, h); c.stroke(); c.beginPath(); c.moveTo(0, k * s); c.lineTo(w, k * s); c.stroke(); }
  }, { repeat: [2.4, 1.15] });
}
class Quilt {
  constructor() {
    const w = QX[1] - QX[0], nx = this.nx = 124, nz = this.nz = 58;
    // rows 0..nz-1 run from the top edge (QZ[0]) to the hem, which can sit further back in some columns (hem[c]);
    // the extra row nz is the bottom of the hem, just in front of row nz-1, so the edge drops to the mattress
    const g = this.g = new THREE.PlaneGeometry(w, 1, nx, nz);
    g.rotateX(-Math.PI / 2); g.translate((QX[0] + QX[1]) / 2, 0, 0);
    this.dx = w / nx; this.hem = new Float32Array(nx + 1).fill(QZ[1]); this.hemGoal = this.hem.slice();
    const p = g.attributes.position; this.base = new Float32Array(p.count); this.edge = new Float32Array(p.count); this.xs = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); this.xs[i] = x; this.edge[i] = 1 - smooth(0, .05, Math.max(MX[0] - x, x - MX[1], 0)); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(p.count * 3).fill(1), 3));
    this.layout(1);
    const m = mat('#ffffff', { map: quiltTex(), rough: .95 }).clone(); m.vertexColors = true;
    this.mesh = new THREE.Mesh(g, m);
    this.mesh.receiveShadow = true; this.mesh.castShadow = false; this.mesh.frustumCulled = false;
  }
  // grid z of every vertex and the resting cloth under it, from the hem line
  layout(dt) {
    const p = this.g.attributes.position, a = p.array, nx = this.nx, nz = this.nz, k = 1 - Math.exp(-dt * 9);
    for (let c = 0; c <= nx; c++) this.hem[c] += (this.hemGoal[c] - this.hem[c]) * k;
    for (let r = 0; r <= nz; r++) for (let c = 0; c <= nx; c++) {
      const i = r * (nx + 1) + c, x = this.xs[i], out = Math.max(MX[0] - x, x - MX[1], 0), hz = this.hem[c];
      let y, z;
      if (r === nz) { z = hz + .012; y = out > 0 ? .025 : TOP + .004; }
      else {
        z = QZ[0] + (hz - QZ[0]) * r / (nz - 1);
        y = TOP + QB - (TOP + QB - .025) * smooth(0, .085, out);           // it hangs over the mattress sides
        y += .055 * Math.exp(-((((z - QZ[0]) - .07) / .05) ** 2));          // the turned-down top edge
        y += .006 * Math.sin(x * 10.5) * Math.sin(z * 10.5);                // quilting puffs
      }
      a[i * 3 + 2] = z; this.base[i] = y;
    }
  }
  // where the hem is at u (futon-local)
  hemAt(u) { const f = clamp((u - QX[0]) / this.dx, 0, this.nx), c = Math.floor(f), t = f - c; return this.hem[c] + ((this.hem[Math.min(this.nx, c + 1)] ?? this.hem[c]) - this.hem[c]) * t; }
  setHem(fn) { for (let c = 0; c <= this.nx; c++) this.hemGoal[c] = fn(QX[0] + c * this.dx); }
  // visit the cloth round (u, w) within reach: f(i, x, z, r)
  around(u, w, reach, f) {
    const nx = this.nx, nz = this.nz, a = this.g.attributes.position.array;
    const c0 = Math.max(0, Math.floor((u - reach - QX[0]) / this.dx)), c1 = Math.min(nx, Math.ceil((u + reach - QX[0]) / this.dx));
    for (let c = c0; c <= c1; c++) {
      const dzc = (this.hem[c] - QZ[0]) / (nz - 1), r0 = Math.max(0, Math.floor((w - reach - QZ[0]) / dzc)), r1 = Math.min(nz - 1, Math.ceil((w + reach - QZ[0]) / dzc));
      for (let r = r0; r <= r1; r++) { const i = r * (nx + 1) + c; f(i, this.xs[i], a[i * 3 + 2], r); }
    }
  }
  update(lumps, dt) {
    this.layout(dt);
    const g = this.g, p = g.attributes.position, a = p.array, B = this.base, E = this.edge, nx = this.nx, nz = this.nz;
    for (let i = 0; i < B.length; i++) a[i * 3 + 1] = B[i];
    // 1. the lumps
    for (const L of lumps) {
      if (L.k <= .002) continue;
      const H = L.H * L.k * (1 + .9 * L.yank) * L.breath, R = L.R * (1 - .42 * L.yank), u = L.u + L.ou, w = L.w + L.ow;
      this.around(u, w, R * 2.2, (i, x, z) => {
        const q = Math.hypot(x - u, z - w) / R; if (q > 2.2) return;
        const y = B[i] + H * E[i] / (1 + Math.pow(q / .98, 6));   // a broad top, so a big friend's sides stay under the cloth
        if (y > a[i * 3 + 1]) a[i * 3 + 1] = y;
      });
    }
    // 2. what is under the cloth raises soft peaks: y = tip − s·(√(d² + r0²) − r0), blended into the lump
    for (const L of lumps) {
      if (!L.tents || L.k < .05) continue;
      for (const t of L.tents) {
        this.around(t.u, t.w, Math.max(.05, (t.y - TOP) / t.s + t.r0), (i, x, z) => {
          const d = Math.hypot(x - t.u, z - t.w), yt = t.y - t.s * (Math.sqrt(d * d + t.r0 * t.r0) - t.r0);
          if (yt > B[i]) a[i * 3 + 1] = smax(a[i * 3 + 1], yt, .04);
        });
      }
    }
    // 3. a friend peeking: the hem in front of its face lifts like a held-up edge
    for (const L of lumps) {
      if (!(L.pk > .01) || L.k < .5) continue;
      const u = L.u + L.ou, lift = TOP + .8 * L.sc + .02, wide = .42 * L.sc;
      const c0 = Math.max(0, Math.floor((u - wide - .1 - QX[0]) / this.dx)), c1 = Math.min(nx, Math.ceil((u + wide + .1 - QX[0]) / this.dx));
      for (let c = c0; c <= c1; c++) {
        const x = QX[0] + c * this.dx, fx = (1 - smooth(.16 * L.sc, wide, Math.abs(x - u))) * L.pk;
        if (fx <= 0) continue;
        const hz = this.hem[c], z0 = hz - .5 * L.sc, dzc = (hz - QZ[0]) / (nz - 1);
        for (let r = Math.max(0, Math.floor((z0 - QZ[0]) / dzc)); r < nz; r++) {
          const i = r * (nx + 1) + c, f = fx * smooth(z0, hz, a[i * 3 + 2]), y = a[i * 3 + 1];
          a[i * 3 + 1] = y + (Math.max(y, lift) - y) * f;
        }
        const i = nz * (nx + 1) + c; a[i * 3 + 1] = B[i] + (lift - .03 - B[i]) * fx;
      }
    }
    p.needsUpdate = true; g.computeVertexNormals();
    // soft shading baked into the cloth so every bump reads: lit from the upper left, darker in the hollows and under the hem
    const n = g.attributes.normal.array, col = g.attributes.color, ca = col.array;
    for (let i = 0; i < B.length; i++) {
      const lam = Math.max(0, -.36 * n[i * 3] + .84 * n[i * 3 + 1] - .41 * n[i * 3 + 2]), lift = a[i * 3 + 1] - B[i];
      let v = Math.min(1, (.66 + .42 * lam) * (.74 + .26 * smooth(.02, .4, lift)));
      if (i >= nz * (nx + 1)) v *= .62;
      ca[i * 3] = ca[i * 3 + 1] = ca[i * 3 + 2] = v;
    }
    col.needsUpdate = true;
  }
}

// ── what a friend shows while under the quilt. Ears, hats and anything else on top are hidden and only shape the cloth
// (tents); feet, tails and props move out from under the front hem onto the mattress. b = how far out the clues are
// (1 out, 0 just under the hem, −1 ducked), hid = how hidden the friend is (1 under the quilt, 0 normal again).
function prepHide(c, side) {
  const T = c._bk = { ears: [], tents: [], hide: [], side, earB: EAR_BOOST[c.def.ear] ?? 1.25, tailB: TAIL_BOOST[c.def.tail] ?? 1.4 };
  const r = c.root, P = r.position.clone(), Q = r.quaternion.clone(), S0 = r.scale.clone();
  r.position.set(0, 0, 0); r.quaternion.identity(); r.scale.set(1, 1, 1); r.updateMatrixWorld(true);
  const S = c.S, round = ROUND_EARS.has(c.def.ear);
  for (const e of c.earObjs || []) {
    const b = new THREE.Box3().setFromObject(e), wid = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / S;
    const tip = e.worldToLocal(new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2));
    T.ears.push({ e, s0: e.scale.clone(), tip, r0: round ? wid * .4 : Math.max(.05, wid * .22), s: round ? 1.6 : EAR_SLOPE[c.def.ear] ?? 2.4 });
    T.hide.push(e);
  }
  // anything else standing above the top of the lump: 개굴이's eye bumps, 다람이's bow, a hat, 삐딱이's spikes
  const skip = new Set([c.tail, c.held, c.phones, c.bodyMesh, c.fxRoot, ...(c.earObjs || [])]);
  for (const o of c.inner.children) {
    if (skip.has(o)) continue;
    const b = new THREE.Box3().setFromObject(o); if (b.isEmpty() || b.max.y / S < .86) continue;
    T.hide.push(o);
    const top = c.inner.worldToLocal(new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2)), wid = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / S;
    if (c.def.ear === 'spiky' && wid > .7) {
      for (const [lon, lat, h] of SPIKES) {
        const d = new THREE.Vector3(Math.sin(lon) * Math.cos(lat), Math.sin(lat), Math.cos(lon) * Math.cos(lat)), p = d.clone().multiplyScalar(.55); p.y += .3;
        p.addScaledVector(d.add(new THREE.Vector3(0, .15, -.5)).normalize(), h * 1.05);
        T.tents.push({ o: c.inner, p, r0: .03, s: 2.3 });
      }
    } else if (o === c.hat && c.capTip) {
      T.tents.push({ o: c.capTip, p: new THREE.Vector3(0, .1, 0), r0: .06, s: 1.8 }, { o: c.hat, p: new THREE.Vector3(.21, .4, 0), r0: .08, s: 1.6 });
    } else if (o === c.hat) T.tents.push({ o: c.inner, p: top.setY(top.y + .14), r0: .12, s: 1.5 });
    else T.tents.push({ o: c.inner, p: top.setY(top.y + .14), r0: Math.max(.06, wid * .34), s: 1.6 });   // a little taller than life, so a bump reads
  }
  r.position.copy(P); r.quaternion.copy(Q); r.scale.copy(S0); r.updateMatrixWorld(true);
  // the things that come out from under the hem
  if (c.feet?.length === 2 && !c.board) {
    T.feet = c.feet.map(f => f.position.clone()); T.feetS = c.feet.map(f => f.scale.clone());
    // the soles show (user 10/19: feet lying out on the mattress looked cut off): toe beans on each, seen only while hidden
    const bean = new THREE.MeshBasicMaterial({ color: '#ff8fb0', polygonOffset: true, polygonOffsetFactor: -2 });
    T.beans = c.feet.map(f => {
      const g = new THREE.Group();
      for (const [x, z, r] of BEANS) {
        const m = new THREE.Mesh(new THREE.CircleGeometry(1, 18).rotateX(Math.PI / 2), bean); m.scale.setScalar(r);
        m.position.set(x, -Math.sqrt(Math.max(0, .0121 - x * x - z * z)) - .004, z); g.add(m);
      }
      g.visible = false; f.add(g); return g;
    });
  }
  // the face goes dark under the cloth (a big friend's eyes would show through it) until a peek lifts the hem
  T.face = [...new Set([...(c.eyeSlots || []), ...[...(c.blush || []), ...(c.tears || []), ...(c.brows || []), ...Object.values(c.mouths || {}), c.mouthO].filter(Boolean).map(o => o.parent)])].filter(o => o && o !== c.inner);
  T.arms = c.arms || [];
  if (c.tail) {
    const k = c.def.tail, t = c.tail, curl = k === 'fluffy' ? -1 : k === 'cat' ? 1 : 0;
    const lie = k === 'fluffy' || k === 'cat';   // the long ones lie flat and point out toward you, a little outward
    T.tail = { t, p0: t.position.clone(), r0: t.userData.r0.clone(), kids: t.children.map(m => [m, m.scale.clone()]), lie, flip: curl && curl !== side,
      rot: lie ? new THREE.Euler(Math.PI / 2 + (k === 'fluffy' ? .2 : .1), 0, 0, 'YXZ') : null,
      out: lie ? new THREE.Vector3(side * .26, .03, .42) : new THREE.Vector3(side * .5, .07, HEM + .05), inn: new THREE.Vector3(side * .12, .04, lie ? -.65 : -.25) };   // a short tail peeks out at the side of the hem
  }
  if (c.held?.userData.two) T.held = [c.held, c.held.userData, c.held.userData.two.slice(), c.held.scale.clone()];
  if (c.phones) T.phones = [c.phones, c.phones.position.clone(), c.phones.rotation.clone(), c.phones.scale.clone()];
  if (c.board) T.board = [c.board, c.board.scale.clone()];
}
function setTell(c, b, hid) {
  const T = c._bk; if (!T) return;
  const H = hid > .5, out = Math.max(0, b), dn = Math.min(0, b);
  const ek = H ? (1 + (T.earB - 1) * out) * (1 + .75 * dn) : 1;
  for (const E of T.ears) E.e.scale.copy(E.s0).multiplyScalar(ek);
  for (const o of T.hide) o.visible = !H;
  // feet: standing up at the hem, soles to you and toes up, their tops tucked under the cloth (so they read as the
  // friend's own feet sticking out, not two blobs on the mattress)
  if (T.feet) c.feet.forEach((f, i) => {
    const f0 = T.feet[i];
    if (H) { const k = 1 + .3 * out; f.position.set(f0.x * (1.15 + .1 * out), FOOT_Y * k, (T.hemZ ?? HEM) + .03 + .05 * out); f.rotation.set(FOOT_TILT, 0, 0); f.scale.copy(T.feetS[i]).multiplyScalar(k); }
    else { f.position.copy(f0); f.rotation.set(0, 0, 0); f.scale.copy(T.feetS[i]); }
    T.beans[i].visible = H;
  });
  for (const a of T.arms) a.visible = !H;   // hands stay under the covers
  const face = !H || (T.pk || 0) > .2; for (const o of T.face) o.visible = face;
  if (T.tail) {
    const L = T.tail, t = L.t;
    if (!L.lie) L.out.z = (T.hemSide ?? HEM) + .05;
    if (c.def.tail === 'short') t.visible = !H;   // a little round tail on its own by the hem only read as a stray ball
    if (H) {
      if (L.lie) { t.rotation.order = 'YXZ'; t.userData.r0.copy(L.rot); }
      t.position.lerpVectors(L.inn, L.out, out);
      const k = 1 + (T.tailB - 1) * out; for (const [m, s] of L.kids) m.scale.set(s.x * k * (L.flip ? -1 : 1), s.y * k, s.z * k);
    } else {
      t.rotation.order = 'XYZ'; t.userData.r0.copy(L.r0); t.position.copy(L.p0);
      for (const [m, s] of L.kids) m.scale.copy(s);
    }
  }
  if (T.held) {
    const [h, u, two, s0] = T.held;
    if (H) { u.two[0] = 0; u.two[1] = .03; u.two[2] = (T.hemZ ?? HEM) + .06 + .16 * out; u.two[3] = -1.45; h.scale.copy(s0).multiplyScalar(1 + .3 * out); }
    else { for (let i = 0; i < 4; i++) u.two[i] = two[i]; h.scale.copy(s0); }
  }
  if (T.phones) {
    const [g, p0, r0, s0] = T.phones;
    if (H) { g.rotation.set(Math.PI / 2, 0, 0); g.position.set(0, 0, -.25 + .63 * out); g.scale.copy(s0).multiplyScalar(1.15); }
    else { g.rotation.copy(r0); g.position.copy(p0); g.scale.copy(s0); }
  }
  if (T.board) { c.rx.bspin = H ? Math.PI / 2 : 0; c.rx.bflip = H ? -.15 : 0; T.board[0].scale.copy(T.board[1]).multiplyScalar(H ? (1 + .45 * out) * (1 + .5 * dn) : 1); }
}
// 너굴이's tail gets its dark rings (the clue that never lies)
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
      furniture: [F('wardrobe', 0, 0), { type: 'chest', x: -2.12, z: -.95, a: Math.PI / 2 }, { type: 'laundrybasket', x: -.6, z: -2.2, a: 0 }, { type: 'floorlamp', x: 1.2, z: -2.1, a: 0 }],
      decor: [D('window', 'N', .3), D('catclock', 'W', -.4)] };
    const room = this.room = new Room(W, layout); this.add(room.group);
    const rec = t => room.furns.find(r => r.type === t);
    const wd = rec('wardrobe'), ch = rec('chest');
    // where a named friend appears: from [x, z, y] to [x, z, y], and the part that opens
    this.spots = [
      { name: 'wardrobe', part: wd?.f.parts[0], from: [-2, -2.05, .25], to: [-1.85, -1.42, 0], scale: .95 },
      { name: 'chest', part: ch?.f.parts[0], from: [-2.12, -.95, -.55], to: [-2.12, -.95, .12], scale: .9 },
      { name: 'basket', part: null, from: [-.6, -2.2, -.55], to: [-.6, -2.2, .05], scale: .9 },
    ];
  }
  // the floor futon, square to the camera: mattress, three pillows at the head, the quilt with its hem at the front
  buildFuton() {
    const g = this.bed = new THREE.Group(); g.position.set(C0.x, 0, C0.z); g.rotation.y = Math.PI / 4;
    const mw = MX[1] - MX[0], md = MZ[1] - MZ[0], mx = (MX[0] + MX[1]) / 2, mz = (MZ[0] + MZ[1]) / 2;
    g.add(put(rbox(mw, TOP, md, '#fffaf4', .06), mx, TOP / 2, mz));
    g.add(put(rbox(mw + .02, .035, md + .02, '#ffb3c8', .014), mx, .045, mz));
    const pz = MZ[0] + .31, cols = ['#fff3d6', '#ffd6e4', '#d6ecff'];
    this.pillows = [-1, 0, 1].map((k, i) => { const p = put(rbox(.82, .17, .44, cols[i], .08), mx + k * 1.1, TOP + .075, pz, 0, k * .05, 0); g.add(p); return p; });
    this.quilt = new Quilt(); g.add(this.quilt.mesh);
    this.add(g);
  }
  frame() {
    const W = this.L.world, c = toW(0, -.25);
    W.home.set(c.x, .45, c.z); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = .75; W.zoom = 1.05;   // lower than a room view (user 10/19): the bumps stand up against the wall and the soles face you
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(3.3, 4.2, .56);
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
    this.hint = h('div', { class: 'bk-hint ol' }, '이불 모양이랑 삐죽 나온 걸 보고 톡!'); col.append(this.hint);
    this.cardsEl = h('div', { class: 'bk-cards out' }); col.append(this.cardsEl);
    this.qEl = h('div', { class: 'bk-q ol3' }, '?'); this.qEl.style.display = 'none'; ui.wui.append(this.qEl);
    this.feverEl = h('div', { class: 'bk-fever' }); app.append(this.feverEl);
    this.nightEl = h('div', { class: 'bk-night' }); app.append(this.nightEl);
  }
  gotCard(kind) {
    const L = this.L, h = L.h;
    const [img, s, s2] = kind === 'raccoon' ? [L.thumbs.face_bk_rc_bunny_normal, '토끼 귀 흉내 내는 너굴이!', '삐죽 나온 줄무늬 꼬리를 봐'] : [L.thumbs.face_calico_happy, '고양이 친구들이 왔다!', '꼬리 색이랑 생선을 잘 봐'];
    const c = h('div', { class: 'bk-get' }, h('img', { src: img }), h('div', {}, h('div', { class: 'bk-get-t ol' }, '새로 나왔다!'), h('div', { class: 'bk-get-s' }, s), h('div', { class: 'bk-get-s' }, s2)));
    document.getElementById('app').append(c); L.audio.sfx('gasp');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2600);
  }
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => { if (e.button > 0 || this.result || this.phase !== 'play') return; this.tapScene(e.clientX, e.clientY); };
    app.addEventListener('pointerdown', this._down);
    // number keys 1–4 pick cards 1–4
    this._key = e => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || this.phase !== 'play' || this.result) return;
      const n = '1234'.indexOf(e.key); if (n < 0 || !this.cards[n]) return;
      e.preventDefault(); this.kbMode(); this.cards[n].press();
    };
    document.addEventListener('keydown', this._key);
  }
  setCards(kinds) {
    const h = this.L.h; this.cardsEl.innerHTML = ''; this.cards = [];
    kinds.forEach((k, i) => {
      const el = h('div', { class: 'bk-card' + (k === 'churro' ? ' gold' : ''), role: 'button', tabindex: '0', 'aria-label': `${i + 1}. ${CHAR_DEFS[k].name}`, 'data-key': String(i + 1), style: `animation-delay:${i * .05}s` },
        h('img', { src: this.L.thumbs[`face_${k}_normal`], alt: '' }), h('b', {}, CHAR_DEFS[k].name));
      el.kind = k;
      el.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); e.stopPropagation(); this.kbMode(); this.answer(k, el); });
      el.addEventListener('pointerdown', e => { e.stopPropagation(); el.classList.add('down'); });
      const up = () => el.classList.remove('down');
      el.addEventListener('pointerleave', up); el.addEventListener('pointercancel', up);
      el.addEventListener('pointerup', e => { e.stopPropagation(); if (!el.classList.contains('down')) return; up(); this.answer(k, el); });
      el.press = () => this.answer(k, el);
      this.cardsEl.append(el); this.cards.push(el);
    });
    this.cardsEl.classList.remove('out');
    if (this.kb) this.focusCard();
  }
  // keyboard play: once a key was used, the number badges show and focus follows the next card still up
  kbMode() { if (!this.kb) { this.kb = true; this.cardsEl.classList.add('kb'); } }
  focusCard() { const c = this.cards.find(c => !c.classList.contains('used')); c?.focus({ preventScroll: true }); }

  // ── lumps: a friend sitting just behind the hem, facing you, the quilt over it
  makeLump(kind, u) {
    const who = isRaccoon(kind) ? 'raccoon' : kind, info = WHO[who] || {};
    const c = new Char(kind), size = (info.size || 1) * CS, sc = c.S * size, w = this.seatW(u, sc);
    const side = u < -.2 ? -1 : u > .2 ? 1 : (Math.random() < .5 ? -1 : 1);   // a tail goes out on the outer side
    c.root.scale.setScalar(size); c.root.rotation.y = Math.PI / 4; c.shadow.visible = false;
    if (isRaccoon(kind)) stripeTail(c);
    if (c.def.prop === 'book' || c.def.prop === 'fish' || c.def.prop === 'seed') c.pose = 'hold';
    c.setFace('normal'); prepHide(c, side);
    const l = { kind, who, trap: DISGUISE[kind] || null, c, sc, u, w, ou: 0, ow: 0, x: 0, z: 0, R: .6 * sc, H: (.88 + (c.lift || 0)) * sc, k: 0, yank: 0, breath: 1,
      tell: -1, tellGoal: 1, hid: 1, side, state: 'hide', golden: kind === 'churro', snore: !!info.snore, duck: false, ph: Math.random() * 6, shake: 0, wigT: 1 + Math.random() * 3,
      snT: .8 + Math.random(), glT: 0, pk: 0, pkT: 1.6 + Math.random() * 3.5, tents: null };
    this.place(l); c.root.position.set(l.x, TOP - sc, l.z);
    this.add(c.root); this.L.world.idsDirty = true;
    return l;
  }
  place(l) { const p = toW(l.u + l.ou, l.w + l.ow); l.x = p.x; l.z = p.z; }
  // how far forward a friend at u can sit: HEM behind the hem, where the hem is furthest back across its body (so the
  // curved hem never cuts into its sides)
  seatW(u, sc) { const Q = this.quilt, hw = .4 * sc; return Math.min(Q.hemAt(u - hw), Q.hemAt(u), Q.hemAt(u + hw)) - HEM * sc; }
  // the soft peaks this friend's ears / hat / spikes raise in the cloth, in futon coordinates
  tentsOf(l) {
    const c = l.c, T = c._bk, ws = l.sc, out = [];
    c.root.updateMatrixWorld(true);
    for (const E of T.ears) { E.e.localToWorld(V.copy(E.tip)); const q = toL(V.x, V.z); out.push({ u: q.u, w: q.w, y: V.y + .03, r0: E.r0 * ws, s: E.s }); }
    for (const t of T.tents) { t.o.localToWorld(V.copy(t.p)); const q = toL(V.x, V.z); out.push({ u: q.u, w: q.w, y: V.y + .03, r0: t.r0 * ws, s: t.s }); }
    return out;
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
    this.quilt.setHem(hemFor(n));
    const slots = this.noSlotShuffle ? SLOTS[n] : shuffled(SLOTS[n]);
    this.lumps = kinds.map((k, i) => this.makeLump(k, slots[i]));
    this.live = this.live.filter(l => !l.gone).concat(this.lumps);
    if (LV.duck) this.lumps.forEach(l => { l.duck = Math.random() < LV.duck; });
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
  // a quick swap under the covers: everything ducks in, the lumps slide past each other, then it all comes back out
  async shuffle() {
    const L = this.L, Ls = this.lumps; this.shuffles++; this.shuffling = true;
    await this.tw.wait(.35); if (this.dead) return;
    Ls.forEach(l => { l.tellGoal = -1; l.pk = 0; });
    L.audio.sfx('wobble');
    await this.tw.wait(.16); if (this.dead) return;
    const n = Ls.length, perm = n === 2 ? [1, 0] : (Math.random() < .5 ? [1, 2, 0] : [2, 0, 1]);
    const from = Ls.map(l => l.u), to = perm.map(j => from[j]);
    const s = L.world.toScreen(new THREE.Vector3(toW(0, 0).x, TOP + 1.1, toW(0, 0).z)); L.ui.floatText(s.x, s.y - 40, '슥삭슥삭~ 자리 바꾸기!', '');
    [0, .22, .44].forEach(d => setTimeout(() => !this.dead && L.audio.sfx('swish'), d * 1000));
    await this.tw.run(.72, k => Ls.forEach((l, i) => {
      const sn = Math.sin(k * Math.PI);
      l.u = from[i] + (to[i] - from[i]) * k; l.ow = -(i % 2 ? .1 : .32) * sn; l.shake = .6 * sn;   // they pass behind each other, under the quilt
    }), ease.inOutCubic);
    if (this.dead) return;
    Ls.forEach(l => { l.ow = 0; const side = l.u < -.2 ? -1 : l.u > .2 ? 1 : l.side; if (side !== l.side) { l.side = side; setTell(l.c, l.tell, 0); prepHide(l.c, side); setTell(l.c, l.tell, 1); } l.tellGoal = 1; });
    this.shuffling = false;
    await this.tw.wait(.25);
  }
  // the next question: the left-most lump still hiding
  ask() {
    if (this.phase !== 'play') return;
    const open = this.lumps.filter(l => l.state === 'hide').sort((a, b) => a.u - b.u);
    this.cur = open[0] || null; this.askT = 0; this._bt = null;
    if (!this.cur) { this.lock = true; this.qEl.style.display = 'none'; this.roundEnd(); return; }
    this.qEl.style.display = ''; this.qEl.classList.remove('pop'); void this.qEl.offsetWidth; this.qEl.classList.add('pop');
    if (this.kb) this.focusCard();
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
    L.ui.floatText(s.x, s.y + 92, `${WHO[l.who]?.tell || ''} = ${CHAR_DEFS[l.who].name}`, '');
    this.cards.find(c => c.kind === l.who)?.classList.add('used', 'shown');
    done.then(() => this.leave(l, .55));
    await this.tw.wait(.45); if (this.dead || this.phase !== 'play') return;
    this.lock = false; this.ask();
  }
  // the quilt is yanked up at the lump and drops flat while the friend jumps out, spins and lands facing you
  async reveal(l, fast = 1) {
    const L = this.L, W = L.world, c = l.c;
    l.state = 'out'; l.tellGoal = 0; l.pk = 0; l.tents = null;
    L.audio.sfx('whoosh');
    await this.tw.run(.1 * fast, k => { l.yank = k; l.k = Math.max(l.k, 1); }, ease.outQuad); if (this.dead) return;
    this.tw.run(.16 * fast, k => { l.yank = 1 - k; l.k = 1 - k; }, ease.inQuad).then(() => { l.k = 0; l.yank = 0; });
    const s = W.toScreen(new THREE.Vector3(l.x, TOP + l.H * 1.5, l.z));
    W.fx.burst(s.x, s.y, { n: 10, colors: ['#ffc9d9', '#cdeee2', '#fff0b8', '#ffffff'], shape: 'circle', size: 7, speed: 200, life: .45, gravity: 320, up: 140 });
    c.setFace('wow'); c.pose = 'cheer';
    const r0 = c.root.rotation.y, r1 = Math.PI / 4 + Math.PI * 2, y0 = c.root.position.y;   // a full spin on the way up
    await this.tw.run(.3 * fast, k => { l.hid = 1 - k; c.root.position.y = y0 + (TOP + QB - y0) * k + Math.sin(k * Math.PI) * .55; c.root.rotation.y = r0 + (r1 - r0) * ease.outCubic(Math.min(1, k * 1.25)); }, ease.linear);
    if (this.dead) return;
    l.hid = 0; c.bump(.3); c.setFace('happy'); L.audio.sfx('land');
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
  sayL(l, text, ms, cls) { const P = { get x() { return l.x; }, get y() { return TOP + l.H * Math.max(0, l.k) * l.breath + .5 * l.sc; }, get z() { return l.z; } }; return this.L.say({ root: { position: P }, headTop: () => 0 }, text, ms, cls); }
  sayC(c, text, ms, cls) { return this.L.say({ root: c.root, headTop: () => c.headTop() * c.root.scale.x + .04 }, text, ms, cls); }
  startFever() {
    if (this.phase !== 'play') return;
    const L = this.L; this.fever = 6; this.fevers++; L.audio.sfx('special'); L.audio.sfx('win');
    this.feverEl.classList.add('on'); L.ui.banner('피버타임!', '점수 두 배 · 휙휙 들춰!', 1000);
  }
  updCombo() { this.scoreEl.dataset.combo = this.combo >= 2 ? COMBO_TEXT(this.combo) : ''; }
  bump() { this.scoreEl.textContent = String(this.score); this.scoreEl.classList.remove('pop'); void this.scoreEl.offsetWidth; this.scoreEl.classList.add('pop'); this.barI.style.width = Math.min(100, this.score / this.barMax * 100) + '%'; }

  // ── a snack peeking out from under the hem between two friends (or at the far ends): tap it for +2
  spawnSnack() {
    const L = this.L, type = pickOne(['cookie', 'candy', 'donut']), g = buildItem(type, { scale: 1.6 });
    // the spot along the hem furthest from every friend and every tail
    const busy = this.lumps.filter(l => l.state === 'hide').flatMap(l => [l.u, l.u + l.side * .4]);
    const u = [-1.55, -1, -.5, 0, .5, 1, 1.55].map(u => [u, Math.min(9, ...busy.map(b => Math.abs(b - u)))]).sort((a, b) => b[1] - a[1])[0][0], p = toW(u, this.quilt.hemAt(u) + .1);
    g.position.set(p.x, TOP - .2, p.z); g.rotation.y = Math.random() * 6; g.userData.item = true;
    this.add(g); L.world.idsDirty = true;
    this.snack = { g, x: p.x, z: p.z, t: 3.2, type };
    this.tw.run(.3, k => { if (this.snack?.g === g) g.position.y = TOP - .2 + .26 * k; }, ease.outBack);
    L.audio.sfx('pop', 8);
  }
  tapScene(x, y) {
    const sn = this.snack; if (!sn || sn.got) return;
    const s = this.L.world.toScreen(new THREE.Vector3(sn.x, TOP + .12, sn.z));
    if (Math.hypot(s.x - x, s.y - y) > 66) return;
    sn.got = true; const L = this.L, gain = 2 * (this.fever > 0 ? 2 : 1);
    this.score += gain; this.snacks++; this.bump(); L.audio.sfx('coin');
    L.ui.floatText(s.x, s.y - 30, `냠! +${gain}`, 'gold big');
    L.world.fx.burst(s.x, s.y, { n: 12, shape: 'star', colors: ['#ffe14d', '#ffb3cd', '#ffffff'] });
    const g = sn.g, y0 = g.position.y;
    this.tw.run(.3, k => { g.position.y = y0 + k * .8; g.scale.setScalar(1.6 * (1 - k)); }, ease.inQuad).then(() => { this.drop(g); if (this.snack === sn) this.snack = null; });
  }

  // ── per frame
  update(dt) {
    if (!this.ready) return;
    const L = this.L, LV = this.lv, W = L.world;
    this.t += dt; this.tw.update(dt); this.room.update(dt);
    if (this.live.some(l => l.gone)) this.live = this.live.filter(l => !l.gone);
    for (const l of this.live) this.stepLump(l, dt);
    for (const c of this.extra) c.update(dt);
    this.quilt.update(this.live, dt);
    // the "?" over the lump being asked (above whatever its cloth peaks are)
    if (this.cur && !this.lock && this.qEl.style.display !== 'none') {
      const l = this.cur, top = Math.max(TOP + l.H * l.breath, ...(l.tents || []).map(t => t.y));
      const s = W.toScreen(new THREE.Vector3(l.x, top + .22, l.z));
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
    const c = l.c, hide = l.state === 'hide';
    if (hide) {
      if (l.duck && this.phase === 'play' && l.k > .9 && !this.shuffling) l.tellGoal = ((this.t + l.ph) % 2.3) < 1.35 ? 1 : -1;
      l.breath = 1 + (l.snore ? .075 * Math.sin(this.t * 2.2 + l.ph) : .02 * Math.sin(this.t * 3.3 + l.ph));
      // somebody fidgeting under the covers now and then
      if ((l.wigT -= dt) < 0) { l.wigT = 2 + Math.random() * 3; l.shake = Math.max(l.shake, .45); }
      if (l.snore && this.phase === 'play' && (l.snT -= dt) < 0) { l.snT = 2.6; this.sayL(l, '드르렁~', 800, 'think'); }
      if (l.golden && (l.glT -= dt) < 0) { l.glT = .22; const s = this.L.world.toScreen(new THREE.Vector3(l.x + (Math.random() - .5) * l.R * 1.6, TOP + l.H * (.4 + Math.random() * .7), l.z + (Math.random() - .5) * l.R * 1.6)); this.L.world.fx.burst(s.x, s.y, { n: 2, shape: 'star', colors: ['#ffe14d', '#ffffff'], size: 8, speed: 40, life: .5, gravity: -30 }); }
      // now and then the hem lifts and two eyes peek out
      if (this.phase === 'play' && !this.shuffling && l.k > .95 && l.tell > .6 && !l.peeking && (l.pkT -= dt) < 0) {
        l.peeking = true; l.pkT = (l.kind === 'frog' ? 2.6 : 4) + Math.random() * 3;
        this.tw.run(.2, k => { if (l.state === 'hide') l.pk = k; }, ease.outQuad).then(() => this.tw.wait(.85)).then(() => this.tw.run(.22, k => { if (l.state === 'hide') l.pk = 1 - k; }, ease.inQuad)).then(() => { l.peeking = false; if (l.state === 'hide') l.pk = 0; });
      }
    }
    l.tell += (l.tellGoal - l.tell) * (1 - Math.exp(-dt * 14));
    l.shake = Math.max(0, l.shake - dt * 1.4);
    l.ou = Math.sin(this.t * 38 + l.ph) * .045 * l.shake;
    if (hide) { l.w = this.seatW(l.u, l.sc); const Q = this.quilt, T = c._bk; if (T) { T.hemZ = (Q.hemAt(l.u) - l.w) / l.sc; T.hemSide = (Q.hemAt(l.u + T.side * .5 * l.sc) - l.w) / l.sc; } }
    this.place(l);
    if (hide) {
      const kk = Math.min(1, Math.max(0, l.k));
      c.root.position.set(l.x, TOP - (1 - kk) * 1.0 * l.sc + (l.breath - 1) * l.H * .8, l.z);
    }
    if (c._bk) c._bk.pk = l.pk;
    setTell(c, l.tell, l.hid);
    c.update(dt);
    if (c._bk?.feet && l.hid > .5) c.feet.forEach(f => { f.position.y = FOOT_Y * f.scale.y / c._bk.feetS[0].y; });
    l.tents = hide ? this.tentsOf(l) : null;
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
    // three fresh lumps for the finale (whoever was still under there ducks away first)
    const old = this.lumps.filter(l => l.state === 'hide');
    old.forEach(l => { l.state = 'sink'; l.tellGoal = -1; l.pk = 0; const y0 = l.c.root.position.y; this.tw.run(.22, k => { l.k = 1 - k; l.c.root.position.y = y0 - k * l.sc; }, ease.inQuad).then(() => { this.drop(l.c.root); l.gone = true; l.k = 0; }); });
    if (old.length) { await this.tw.wait(.25); if (this.dead) return; }
    const pool = shuffled(LV.pool.filter(k => k !== 'raccoon'));
    this.quilt.setHem(hemFor(3)); this.lumps = SLOTS[3].map((u, i) => this.makeLump(pool[i], u));
    this.live = this.live.filter(l => !l.gone).concat(this.lumps);
    this.lumps.forEach((l, i) => this.tw.run(.3, k => { l.k = k; }, ease.outBack, i * .08));
    // 엄마 comes in from the left
    const mom = this.mom = new Char('mom'); mom.root.scale.setScalar(CS * .66);
    const mp = toW(-1.12, MZ[1] + .1); mom.root.position.set(mp.x - 1.2, 0, mp.z + 1.2); mom.faceTo(W.cam.position.x, W.cam.position.z); mom.pose = 'hips';
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
      h('div', { class: 'txt' }, win ? (stars >= 3 ? '이불 모양만 봐도 다 알아! 이불 속 탐정 인정' : '다섯 번 연속 맞히면 피버타임이야') : `${LV.stars[0]}점부터 성공! 이불 모양이랑 꼬리를 잘 봐`)],
      // a break game: a miss never blocks you — retry is the big button, moving on is right next to it
      buttons: win ? [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
        this.nextBtn = L.ui.btn(last ? '처음 이불부터' : '다음 이불', { color: 'green', cls: 'big', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) })]
        : [L.ui.btn('넘어가기', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) }),
          this.nextBtn = L.ui.btn('다시 하기', { color: 'orange', cls: 'big', onClick: () => L.go({ lv: this.lvIdx }) })] });
  }
  // pillows fly back and forth over the futon (they live in the futon's own coordinates)
  pillowFight() {
    const L = this.L, P = this.pillows;
    P.forEach((p, i) => {
      const hop = async (n) => {
        if (this.dead || n <= 0) return;
        const a = p.position.clone(), bu = SLOTS[3][(i + n) % 3] + (Math.random() - .5) * .5, b = new THREE.Vector3(bu, TOP + .5 + Math.random() * .4, this.quilt.hemAt(bu) - .7 + (Math.random() - .5) * .5);
        const r0 = p.rotation.clone(), spin = (Math.random() < .5 ? -1 : 1) * (4 + Math.random() * 3);
        L.audio.sfx('whoosh');
        await this.tw.run(.42, k => { p.position.lerpVectors(a, b, k); p.position.y += Math.sin(k * Math.PI) * 1.0; p.rotation.set(r0.x + spin * k * .6, r0.y + spin * k, r0.z); }, ease.linear);
        if (this.dead) return;
        const s = L.world.toScreen(p.getWorldPosition(new THREE.Vector3())); L.world.fx.burst(s.x, s.y, { n: 6, colors: ['#ffffff', '#fff3d6'], shape: 'circle', size: 6, speed: 150, life: .4, gravity: 200 }); L.audio.sfx('pop', 3 + i);
        hop(n - 1);
      };
      this.tw.wait(.25 + i * .18).then(() => hop(3));
    });
  }
  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.removeEventListener('pointerdown', this._down); document.removeEventListener('keydown', this._key); app.classList.remove('bk');
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
    if (mode !== 'random' && this.snack && !this.snack.got) { const s = this.L.world.toScreen(new THREE.Vector3(this.snack.x, TOP + .12, this.snack.z)); this.tapScene(s.x, s.y); }
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
      peek: () => { for (const l of this.lumps) l.pkT = 0; },
      // QA: replace whatever is under the quilt with these friends right now, in this order left to right (no shuffle)
      show: kinds => { for (const l of this.lumps) { this.drop(l.c.root); l.gone = true; l.k = 0; } this.lumps = []; this.forced = kinds; this.noShuffle = true; this.noSlotShuffle = true; this.nextRound(); },
    };
  }
}

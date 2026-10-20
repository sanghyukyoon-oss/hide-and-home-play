// ⑥ 추로야!!! — 새벽, 주인(몽글이)이 책상에서 마감하는 동안 추로가 집안 물건을 앞발로 하나씩 '툭' 떨어뜨린다.
//   move:   press and hold — 추로 goes where your finger is: across the floor, and up / down the furniture with a hop
//           (it finds the way: floor → stool → table, desk → wall shelf …). Let go and 추로 freezes: it sits bolt upright,
//           the picture of innocence.
//   swat:   press (and hold) a thing on a table / shelf / counter / desk — 추로 walks over and pats it toward the edge
//           (톡… 톡…), it teeters and falls: 툭! 쨍그랑! 와장창! Breakable things fill the mischief meter twice as much,
//           but they are loud: the owner hears them and looks round soon. Quick knocks in a row = 콤보 (+1 each).
//   owner:  works with the back to the room (the typing clicks). Now and then the typing stops — "흠…?" (a red preview of
//           where it will look) — and it turns round (the warm light on the floor). Seen walking / jumping / swatting →
//           "추로야!!!" (a strike; the third one and 추로 gets picked up). Sitting still in sight is fine: "…야옹?"
//   애교:   (새로 얻었다! the first time the owner stares at a frozen 추로) tap 추로 while it stares → slow blink, 야옹~♥,
//           the owner melts and goes back to work at once (and stays busy longer). Twice a night.
//   finale: meter full → the 츄르 drawer unlocks. Hold on it: 추로 paws it open (드르륵…) and eats. Night won.
//   nights: 1 the basics · 2 more glass, faster looks, a robot vacuum to ride (moving while riding looks innocent)
//           · 3 멍뭉이 asleep on the floor (walk near it and it barks), the 츄르 drawer right next to the owner.
import * as THREE from 'three';
import { MapRooms } from '../map.js';
import { THEMES } from '../stages.js';
import { Char, CHAR_DEFS, defineChar } from '../gfx/chars.js';
// 추로 with its real green-gold eyes (the user's cat; the stock character has plain dark eyes)
const CAT = 'churro_g';
if (!CHAR_DEFS[CAT]) defineChar(CAT, { ...CHAR_DEFS.churro, eyeC: '#b2d660' });
import { buildItem, ITEMS } from '../gfx/items.js';
import { ICON } from '../ui.js';
import { Tweens, clamp, ease } from '../util.js';
import { disposeTree, rbox, cyl, sph, cone, tor, put, mat } from '../gfx/kit.js';
import { sees, wrap } from './yasik.js';

const F = (type, i, j, rot = 0, opts) => ({ type, i, j, rot, opts });
const D = (type, wall, u, opts) => ({ type, wall, u, opts });
const NIGHT = { ambColor: '#a7abdc', amb: 1.24, sunColor: '#eceeff', sun: 1.1 };
const RW = 6, RD = 5;                                   // the room: x ∈ [-3, 3], z ∈ [-2.5, 2.5]; N (-z) and W (-x) walls
const CAT_S = 1.12, OWNER_S = 1.42;
const WALK = 1.55, JUMP_UP = 1.02, JUMP_GAP = .9, CAT_R = .15, GRAV = 13;
const PAT = .22, PAT_DRAWER = .3, DRAWER_PATS = 4, COMBO_T = 3.2, MAX_STRIKES = 3, VAC_V = .36;
const SEAT = { x: -.35, y: .44, z: -1.26 }, EYE = { x: -.35, z: -1.26, h: .98 }, BUSY_YAW = Math.PI;
const DEG = Math.PI / 180;
const SEEING = new Set(['turn', 'look', 'glare']), DANGER = new Set(['hmm', 'turn', 'look', 'glare']);
const rnd = ([a, b]) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const DECOR = [D('window', 'W', .5), D('catclock', 'N', 1.55)];

// what can be knocked off: points, pats it takes, how loud it lands (0..1: the owner's chance to hear, ×night), the word
const KINDS = {
  mouse: { name: '마우스', mat: 'mouse', pts: 2, pats: 2, loud: .6, word: '달랑!', h: 0.065 },
  mug: { name: '커피잔', mat: 'ceramic', pts: 2, pats: 3, loud: .9, word: '와장창!', h: 0.22, lie: true, puddle: '#6b3a22' },
  pot: { name: '화분', mat: 'ceramic', pts: 2, pats: 3, loud: .95, word: '와장창!', h: 0.34, lie: true, soil: true },
  glass: { name: '유리컵', mat: 'glass', pts: 2, pats: 3, loud: 1, word: '쨍그랑!', h: 0.2, puddle: '#9fd8ff' },
  vase: { name: '꽃병', mat: 'glass', pts: 2, pats: 3, loud: 1, word: '쨍그랑!', h: 0.55, puddle: '#9fd8ff' },
  mandarin: { name: '귤', mat: 'soft', pts: 1, pats: 2, loud: .12, word: '통!', h: 0.17, roll: true },
  ball: { name: '공', mat: 'soft', pts: 1, pats: 2, loud: .15, word: '통통!', h: 0.22, roll: true, bouncy: true },
  yarn: { name: '털실', mat: 'soft', pts: 1, pats: 2, loud: .08, word: '툭!', h: 0.2, roll: true },
  tissue: { name: '휴지', mat: 'soft', pts: 1, pats: 2, loud: .1, word: '툭!', h: 0.2 },
  remote: { name: '리모컨', mat: 'plastic', pts: 1, pats: 2, loud: .45, word: '탁!', h: 0.065 },
  books: { name: '책', mat: 'book', pts: 1, pats: 2, loud: .5, word: '쿵!', h: 0.15 },
  ramen: { name: '컵라면', mat: 'plastic', pts: 1, pats: 2, loud: .35, word: '툭!', h: 0.2, lie: true },
};
const BURST = { glass: ['#ffffff', '#bfeaff', '#8fd3ff'], ceramic: ['#ffffff', '#ffd9b0', '#c98f5a'], soft: ['#ffe14d', '#ff9fb8', '#ffffff'], plastic: ['#ffffff', '#c9cfe0', '#ffe14d'], book: ['#ffd23f', '#ff8f7a', '#ffffff'], mouse: ['#ffffff', '#8fd3ff', '#ffe14d'] };

// three nights (the owner's desk, wall shelf, low cabinet, table, stool and side table are this game's own pieces —
// clean tops for 추로 to walk on; the rest is house furniture). items: [kind, x, z]; churu: the drawers holding the 츄르
const LEVELS = [
  { name: '첫째 밤', sub: '주인은 마감 중 · 몰래 툭!', time: 100, need: 6, tel: 1.3, busy: [4.6, 7.2], look: [1.4, 2.0], fake: 0, half: 50, range: 6.5, grace: .45, hear: .85,
    furniture: [F('cattower', 0, 0), F('bookshelf', 1, 0, 0, { seed: 7 }), F('monstera', 5, 0), F('counter', 0, 1, 1), F('counter', 0, 2, 1), F('drawers', 0, 3, 1), F('plant', 0, 4, 1), F('rug', 3, 2), F('catbed', 3, 4)],
    own: [['desk', 0, -2.08], ['shelf', .52, -2.32], ['lowcab', 1.5, -2.24], ['table', 1.5, .3], ['stool', .68, .98], ['side', -.9, 1.45]],
    items: [['glass', 1.34, .48], ['tissue', 1.72, .08], ['mouse', .24, -1.92], ['mug', .7, -2.0], ['pot', .55, -2.32], ['remote', -2.62, -1.0], ['mandarin', -2.64, .15], ['ball', -2.52, -2.2]],
    churu: 'drawers', start: [.5, 2.0], aegyo: 'get' },
  { name: '둘째 밤', sub: '유리컵이 잔뜩 · 로봇청소기 출동', time: 85, need: 8, tel: 1.12, busy: [3.8, 6.0], look: [1.5, 2.2], fake: .2, half: 52, range: 6.8, grace: .38, hear: 1,
    furniture: [F('cattower', 0, 0), F('bookshelf', 1, 0, 0, { seed: 11 }), F('drawers', 5, 0), F('counter', 0, 1, 1), F('counter', 0, 2, 1), F('bigfridge', 0, 3, 1), F('plant', 0, 4, 1), F('rug', 3, 2), F('catbed', 3, 4)],
    own: [['desk', 0, -2.08], ['shelf', .52, -2.32], ['lowcab', 1.5, -2.24], ['table', 1.5, .3], ['stool', .68, .98], ['side', -.9, 1.45]],
    items: [['mouse', .24, -1.92], ['mug', .72, -2.02], ['vase', .5, -2.32], ['glass', -2.62, -1.15], ['glass', 1.34, .48], ['mandarin', -2.64, .1], ['books', 1.5, -2.2], ['remote', -.9, 1.45], ['yarn', -2.2, -1.92]],
    vac: { path: [[-1.7, -.55], [-1.6, .75], [-.3, .62], [1.15, 1.5], [2.4, 2.0], [2.5, -.5], [.7, -.55]] },
    churu: 'drawers', start: [.5, 2.0] },
  { name: '셋째 밤', sub: '멍뭉이가 자는 중 · 바닥에선 살금살금', time: 95, need: 10, tel: .98, busy: [3.3, 5.3], look: [1.6, 2.4], fake: .25, half: 54, range: 7, grace: .32, hear: 1.1,
    furniture: [F('cattower', 0, 0), F('bookshelf', 1, 0, 0, { seed: 23 }), F('drawers', 4, 0), F('monstera', 5, 0), F('counter', 0, 1, 1), F('counter', 0, 2, 1), F('plant', 0, 4, 1), F('rug', 3, 2), F('catbed', 3, 4)],
    own: [['desk', 0, -2.08], ['shelf', .52, -2.32], ['table', 1.5, .3], ['stool', .68, .98], ['side', -.9, 1.45], ['stool', -1.75, -.3]],
    items: [['mouse', .24, -1.92], ['mug', .72, -2.02], ['pot', .5, -2.32], ['glass', -2.62, -1.15], ['vase', 1.72, .55], ['mandarin', -2.64, .15], ['remote', 1.28, .12], ['tissue', -.9, 1.45], ['ball', -2.52, -2.2], ['ramen', -2.62, -.45]],
    dog: { at: [-.1, .35], yaw: .9, wake: 1.25 },
    churu: 'drawers', start: [.5, 2.0] },
];
export { LEVELS };

// ── surfaces 추로 can walk on, in a piece's own frame (facing +z), and sight blockers that are not the bounding box
const ESURF = {
  counter: [{ name: 'counter', x0: -.48, x1: .48, z0: -.46, z1: .16, h: .935 }],
  cattower: [{ name: 'tower1', x0: -.12, x1: .4, z0: -.28, z1: .18, h: .76 }, { name: 'tower2', x0: -.45, x1: -.05, z0: -.31, z1: .11, h: 1.04 }, { name: 'tower3', x0: -.21, x1: .17, z0: -.39, z1: -.01, h: 1.48 }],
  catbed: [{ name: 'catbed', x0: -.3, x1: .3, z0: -.3, z1: .3, h: .2 }],
};
const EOCC = { cattower: [{ x0: -.13, x1: .41, z0: -.29, z1: .19, h: .76 }], catbed: [] };
function rotRect(r, rot, cx, cz) {
  const P = [[r.x0, r.z0], [r.x1, r.z1]].map(([x, z]) => rot === 1 ? [z, -x] : rot === 2 ? [-x, -z] : rot === 3 ? [-z, x] : [x, z]);
  return { ...r, x0: cx + Math.min(P[0][0], P[1][0]), x1: cx + Math.max(P[0][0], P[1][0]), z0: cz + Math.min(P[0][1], P[1][1]), z1: cz + Math.max(P[0][1], P[1][1]) };
}
const inRect = (r, x, z, m = 0) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
const clampRect = (r, x, z) => ({ x: clamp(x, r.x0, r.x1), z: clamp(z, r.z0, r.z1) });
const union = (a, b) => a && b ? { x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), z0: Math.min(a.z0, b.z0), z1: Math.max(a.z1, b.z1) } : a || b;
function inset(r, m) {
  const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, hx = Math.max(.015, (r.x1 - r.x0) / 2 - m), hz = Math.max(.015, (r.z1 - r.z0) / 2 - m);
  return { x0: cx - hx, x1: cx + hx, z0: cz - hz, z1: cz + hz };
}
function rectGap(a, b) { const dx = Math.max(0, a.x0 - b.x1, b.x0 - a.x1), dz = Math.max(0, a.z0 - b.z1, b.z0 - a.z1); return Math.hypot(dx, dz); }
function axisPair(a0, a1, b0, b1, ref) {
  if (a1 < b0) return [a1, b0];
  if (b1 < a0) return [a0, b1];
  const v = clamp(ref, Math.max(a0, b0), Math.min(a1, b1)); return [v, v];
}
// two counters side by side are one worktop
function mergeSurfs(list) {
  const out = [];
  for (const s of list) {
    const m = out.find(o => o.name === s.name && Math.abs(o.h - s.h) < .01 && (
      (Math.abs(o.real.x0 - s.real.x0) < .03 && Math.abs(o.real.x1 - s.real.x1) < .03 && (Math.abs(o.real.z1 - s.real.z0) < .1 || Math.abs(s.real.z1 - o.real.z0) < .1)) ||
      (Math.abs(o.real.z0 - s.real.z0) < .03 && Math.abs(o.real.z1 - s.real.z1) < .03 && (Math.abs(o.real.x1 - s.real.x0) < .1 || Math.abs(s.real.x1 - o.real.x0) < .1))));
    if (m) { m.real = union(m.real, s.real); m.foot = union(m.foot, s.foot); }
    else out.push({ ...s, real: { ...s.real }, foot: s.foot && { ...s.foot } });
  }
  return out;
}

// ── this game's own furniture (toy-set style: round boxes, warm wood, ink outlines come for free). World coordinates.
const WOOD = '#f2cc9c', WOODD = '#c99a68', CREAM = '#fffaf2', INK = '#3b3f5c';
function ownPiece(kind, x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const R = (x0, x1, z0, z1) => ({ x0: x + x0, x1: x + x1, z0: z + z0, z1: z + z1 });
  switch (kind) {
    case 'desk': {   // 2 wide against the N wall: the owner's monitor, keyboard and lamp on the left, room for 추로 on the right
      g.add(put(rbox(1.94, .06, .74, WOOD, .02), 0, .75, 0));
      for (const sx of [-1, 1]) g.add(put(rbox(.06, .72, .68, CREAM, .02), sx * .91, .36, 0));
      g.add(put(rbox(1.76, .3, .03, CREAM, .01), 0, .56, -.3));
      g.add(put(rbox(.26, .02, .16, INK, .01), -.35, .79, -.2));
      g.add(put(rbox(.05, .24, .04, INK, .01), -.35, .9, -.25));
      g.add(put(rbox(.8, .48, .05, INK, .03), -.35, 1.2, -.25));
      g.add(put(rbox(.72, .4, .012, '#cfeeff', .006, { emissive: '#8fd0ff', ei: 1.1 }), -.35, 1.2, -.222));
      const lines = [[.34, '#ff9fb8', 0], [.22, '#ffe36b', .06], [.4, '#9ff0c8', .06], [.16, '#ffffff', .12], [.3, '#c9a7ff', .06], [.2, '#9ff0c8', 0]];
      lines.forEach(([w, c, ind], i) => g.add(put(rbox(w, .022, .006, c, .004, { emissive: c, ei: .8 }), -.35 - .3 + ind + w / 2, 1.33 - i * .052, -.214)));
      g.add(put(rbox(.5, .025, .16, '#f6f4f0', .01), -.35, .79, .13));
      for (let i = 0; i < 3; i++) g.add(put(rbox(.42, .006, .025, '#d9dbe6', .002), -.35, .805, .08 + i * .045));
      // desk lamp (left end)
      g.add(put(cyl(.07, .08, .025, '#ffc23d'), -.82, .79, -.2));
      g.add(put(cyl(.012, .012, .34, CREAM), -.82, .96, -.2));
      g.add(put(cone(.1, .11, '#ffc23d', null, 18), -.78, 1.12, -.14, Math.PI * .85, 0, .2));
      g.add(put(sph(.035, '#fff3b0', { emissive: '#ffe98a', ei: 1.4 }), -.77, 1.08, -.12));
      return { g, solid: R(-.98, .98, -.4, .38), occ: [{ ...R(-.98, .98, -.37, .36), h: .78 }, { ...R(-.76, .06, -.29, -.2), h: 1.45 }],
        surfs: [{ name: 'desk', real: R(-.97, .97, -.37, .37), walk: R(.1, .86, -.12, .25), h: .78 }], anchor: { x: x + .08, y: .79, z: z - .3 } };
    }
    case 'shelf': {   // a floating wall shelf above the desk
      g.add(put(rbox(.88, .05, .36, WOOD, .015), 0, 1.4, 0));
      for (const sx of [-1, 1]) g.add(put(rbox(.04, .16, .22, WOODD, .01), sx * .34, 1.3, -.06));
      return { g, solid: null, occ: [], surfs: [{ name: 'shelf', real: R(-.44, .44, -.18, .18), walk: R(-.34, .34, -.04, .04), h: 1.425 }] };
    }
    case 'lowcab': {
      g.add(put(rbox(.86, .56, .46, CREAM, .03), 0, .3, 0));
      g.add(put(rbox(.9, .05, .5, WOOD, .015), 0, .6, 0));
      for (const sx of [-1, 1]) { g.add(put(rbox(.4, .44, .012, '#ffd9a8', .01), sx * .21, .31, .232)); g.add(put(sph(.022, '#ffc23d'), sx * .05, .34, .245)); }
      return { g, solid: R(-.45, .45, -.25, .25), occ: [{ ...R(-.43, .43, -.23, .23), h: .63 }], surfs: [{ name: 'lowcab', real: R(-.45, .45, -.25, .25), walk: R(-.33, .33, -.12, .1), h: .625 }] };
    }
    case 'table': {
      g.add(put(rbox(.9, .05, .9, WOOD, .015), 0, .715, 0));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(put(rbox(.06, .7, .06, WOODD, .015), sx * .37, .35, sz * .37));
      g.add(put(rbox(.5, .006, .5, '#ffb3c6', .003), 0, .743, 0));
      return { g, solid: R(-.45, .45, -.45, .45), occ: [{ ...R(-.43, .43, -.43, .43), h: .74 }], surfs: [{ name: 'table', real: R(-.45, .45, -.45, .45), h: .745 }] };
    }
    case 'stool': {
      g.add(put(cyl(.2, .19, .07, '#ff9f8a'), 0, .44, 0));
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + .4; g.add(put(cyl(.022, .018, .42, WOODD), Math.sin(a) * .12, .2, Math.cos(a) * .12, Math.cos(a) * .18, 0, -Math.sin(a) * .18)); }
      return { g, solid: R(-.2, .2, -.2, .2), occ: [{ ...R(-.18, .18, -.18, .18), h: .48 }], surfs: [{ name: 'stool', real: R(-.2, .2, -.2, .2), walk: R(-.05, .05, -.05, .05), h: .475 }] };
    }
    case 'side': {   // a round side table
      g.add(put(cyl(.3, .3, .04, WOOD, null, 30), 0, .56, 0));
      g.add(put(cyl(.04, .05, .54, WOODD), 0, .28, 0));
      g.add(put(cyl(.17, .2, .03, WOODD), 0, .015, 0));
      return { g, solid: R(-.27, .27, -.27, .27), occ: [{ ...R(-.24, .24, -.24, .24), h: .58 }], surfs: [{ name: 'side', real: R(-.27, .27, -.27, .27), walk: R(-.1, .1, -.1, .1), h: .58 }] };
    }
  }
  return { g, solid: null, occ: [], surfs: [] };
}
function makeChair() {   // the owner's swivel chair (turns with the owner)
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(put(rbox(.26, .03, .05, '#5b6386', .015), Math.sin(a) * .12, .04, Math.cos(a) * .12, 0, a - Math.PI / 2, 0)); g.add(put(sph(.028, '#3b3f5c'), Math.sin(a) * .25, .028, Math.cos(a) * .25)); }
  g.add(put(cyl(.035, .035, .32, '#8f9bc4'), 0, .2, 0));
  g.add(put(rbox(.6, .08, .54, '#ff8f86', .035), 0, .4, 0));
  g.add(put(rbox(.56, .32, .07, '#ff8f86', .03), 0, .64, -.3, -.1, 0, 0));
  return g;
}
function makeVac() {
  const g = new THREE.Group();
  g.add(put(cyl(.22, .22, .07, '#ffffff', null, 30), 0, .045, 0));
  g.add(put(cyl(.19, .19, .016, '#eef1f7', null, 30), 0, .086, 0));
  g.add(put(tor(.2, .008, '#7fd6c0', null, Math.PI * 2, 4, 30), 0, .094, 0, Math.PI / 2, 0, 0));
  g.add(put(cyl(.055, .06, .028, '#c9cfe0'), 0, .1, -.09));
  const led = put(sph(.02, '#7dffc4', { emissive: '#7dffc4', ei: .9 }), 0, .1, .13); g.add(led);
  for (const sx of [-1, 1]) g.add(put(sph(.014, '#3b3f5c'), sx * .06, .07, .205, 0, 0, 0, [1, 1, .5]));
  g.userData.led = led;
  return g;
}
function makeChurru() {   // a 츄르 pouch
  const g = new THREE.Group();
  g.add(put(rbox(.075, .028, .26, '#ff7fa8', .012), 0, .014, 0));
  g.add(put(rbox(.077, .03, .08, '#ffffff', .01), 0, .015, .02));
  g.add(put(rbox(.03, .02, .04, '#ffd23f', .008), 0, .014, -.14));
  return g;
}
// item meshes: the house items where they exist, a few made here (the white mouse, a glass, a vase)
function itemMesh(type) {
  const g = new THREE.Group();
  if (type === 'mouse') {
    g.add(put(sph(.06, '#ffffff'), 0, .027, 0, 0, 0, 0, [.8, .46, 1.22]));
    g.add(put(rbox(.012, .012, .028, '#c9cfe0', .005), 0, .052, -.035));
    return g;
  }
  if (type === 'glass') {
    g.add(put(cyl(.055, .046, .15, '#e6f7ff', { rough: .25, side: THREE.DoubleSide }, 22, true), 0, .075, 0));
    g.add(put(cyl(.05, .05, .01, '#8fd3ff'), 0, .1, 0));
    g.add(put(cyl(.046, .046, .006, '#e6f7ff'), 0, .003, 0));
    g.add(put(rbox(.012, .09, .006, '#ffffff', .003), -.028, .08, .042, 0, -.5, 0));
    return g;
  }
  if (type === 'vase') {
    g.add(put(sph(.085, '#9fd8ff', { rough: .3 }), 0, .1, 0, 0, 0, 0, [1, 1.1, 1]));
    g.add(put(cyl(.035, .05, .1, '#9fd8ff', { rough: .3 }), 0, .22, 0));
    g.add(put(tor(.036, .01, '#bfeaff'), 0, .27, 0, Math.PI / 2, 0, 0));
    g.add(put(cyl(.006, .006, .16, '#4ea85a'), 0, .34, 0));
    g.add(put(sph(.03, '#ffd23f'), 0, .42, 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(put(sph(.026, '#ff9fb8'), Math.sin(a) * .04, .42, Math.cos(a) * .04, 0, 0, 0, [1, .6, 1])); }
    return g;
  }
  if (ITEMS[type]) return buildItem(type);
  g.add(put(rbox(.12, .1, .12, '#ffd23f', .03), 0, .05, 0));
  return g;
}

// ── sounds made here (the engine set has no crash, no meow): WebAudio on the engine's own bus, silent when muted
function makeSfx(L) {
  const A = L.audio;
  const C = () => { if (A.muted) return null; if (!A.ctx) { try { A.unlock(); } catch { return null; } } return A.ctx && A.sfxBus ? A.ctx : null; };
  function tone(c, { type = 'sine', f, f2 = null, dur = .12, vol = .3, at = 0, attack = .005, filt = null }) {
    const t0 = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    let n = o; if (filt) { const fl = c.createBiquadFilter(); fl.type = filt.type || 'lowpass'; fl.frequency.value = filt.f; fl.Q.value = filt.q || 1; o.connect(fl); n = fl; }
    n.connect(g).connect(A.sfxBus); o.start(t0); o.stop(t0 + dur + .05);
  }
  function noise(c, { dur = .15, vol = .3, at = 0, type = 'bandpass', f = 1800, f2 = null, q = 1 }) {
    const t0 = c.currentTime + at, len = Math.ceil(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(); s.buffer = buf;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t0); fl.Q.value = q; if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(fl).connect(g).connect(A.sfxBus); s.start(t0);
  }
  const R = Math.random;
  return {
    crash(kind, k = 1) {
      const c = C(); if (!c) return;
      if (kind === 'glass') {
        for (let i = 0; i < 7; i++) noise(c, { dur: .06 + R() * .09, vol: .2 * k, at: i * .03 + R() * .02, type: 'highpass', f: 3200 + R() * 3200, q: 3 });
        for (let i = 0; i < 5; i++) tone(c, { f: 2300 + R() * 2600, dur: .16 + R() * .1, vol: .07 * k, at: .01 + i * .045 });
        tone(c, { f: 190, f2: 90, dur: .1, vol: .22 * k });
      } else if (kind === 'ceramic') {
        tone(c, { f: 250, f2: 85, dur: .15, vol: .42 * k }); noise(c, { dur: .18, vol: .3 * k, f: 1300, q: 1.1 });
        for (let i = 0; i < 4; i++) tone(c, { type: 'triangle', f: 1400 + i * 380 + R() * 200, dur: .07, vol: .09 * k, at: .05 + i * .055 });
      } else if (kind === 'soft') { tone(c, { f: 320, f2: 150, dur: .14, vol: .3 * k }); noise(c, { dur: .08, vol: .1 * k, type: 'lowpass', f: 520 }); }
      else if (kind === 'bounce') tone(c, { type: 'triangle', f: 430, f2: 720, dur: .08, vol: .2 * k });
      else if (kind === 'book') { noise(c, { dur: .11, vol: .45 * k, type: 'lowpass', f: 950 }); tone(c, { f: 135, f2: 70, dur: .13, vol: .36 * k }); }
      else if (kind === 'plastic') { for (let i = 0; i < 3; i++) tone(c, { type: 'square', f: 1250 + R() * 700, dur: .03, vol: .07 * k, at: i * .07, filt: { f: 3000 } }); tone(c, { f: 210, f2: 110, dur: .08, vol: .2 * k }); }
      else if (kind === 'mouse') { tone(c, { type: 'triangle', f: 520, f2: 250, dur: .26, vol: .2 }); for (let i = 0; i < 2; i++) tone(c, { type: 'square', f: 1500, dur: .025, vol: .06, at: .08 + i * .09, filt: { f: 3200 } }); }
    },
    meow(k = 1, happy = false) {   // "야" up, "옹" down: a nasal sawtooth through a band
      const c = C(); if (!c) return; const f0 = happy ? 640 : 560;
      tone(c, { type: 'sawtooth', f: f0, f2: f0 * 1.42, dur: .17, vol: .09 * k, filt: { type: 'bandpass', f: 1400, q: 2 } });
      tone(c, { type: 'sawtooth', f: f0 * 1.42, f2: f0 * .8, dur: .34, vol: .09 * k, at: .15, filt: { type: 'bandpass', f: 1050, q: 2.4 } });
      tone(c, { f: f0 * 2, f2: f0 * 2.7, dur: .15, vol: .035 * k }); tone(c, { f: f0 * 2.7, f2: f0 * 1.6, dur: .32, vol: .035 * k, at: .15 });
    },
    bark() { const c = C(); if (!c) return; for (let i = 0; i < 2; i++) { tone(c, { type: 'square', f: 330, f2: 190, dur: .13, vol: .1, at: i * .22, filt: { f: 1400 } }); noise(c, { dur: .07, vol: .12, at: i * .22, f: 900, q: 1.5 }); } },
    key() { const c = C(); if (!c) return; tone(c, { type: 'square', f: 1800 + R() * 500, dur: .014, vol: .022, filt: { f: 3800 } }); },
    pat() { const c = C(); if (!c) return; tone(c, { f: 540, f2: 380, dur: .05, vol: .13 }); noise(c, { dur: .03, vol: .05, f: 2600 }); },
    rattle() { const c = C(); if (!c) return; noise(c, { dur: .12, vol: .2, f: 700, q: 3 }); tone(c, { type: 'triangle', f: 170, dur: .06, vol: .16, at: .08 }); },
  };
}
const PAW = '<svg viewBox="0 0 40 40"><g fill="#ff9fb8" stroke="#3a2453" stroke-width="2.6"><ellipse cx="20" cy="27" rx="9.5" ry="7.6"/><circle cx="9.2" cy="17.5" r="4.3"/><circle cx="15.8" cy="10.5" r="4.3"/><circle cx="24.2" cy="10.5" r="4.3"/><circle cx="30.8" cy="17.5" r="4.3"/></g></svg>';
const CLOCK = '<svg viewBox="0 0 40 40"><circle cx="20" cy="21" r="15" fill="#fffaf2" stroke="#3a2453" stroke-width="3.2"/><path d="M20 12v9l6 4" fill="none" stroke="#3a2453" stroke-width="3.2" stroke-linecap="round"/></svg>';
const LOCK = '<svg viewBox="0 0 40 40"><rect x="8" y="17" width="24" height="18" rx="4" fill="#ffd23f" stroke="#3a2453" stroke-width="3"/><path d="M13 17v-4a7 7 0 0 1 14 0v4" fill="none" stroke="#3a2453" stroke-width="3"/></svg>';
const fmt = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const CSS_HREF = new URL('./churro.css', import.meta.url).href;

export class Game {
  constructor(L) { this.L = L; this.tw = new Tweens(); this.t = 0; this.jobs = []; this.objs = []; this.sfx = makeSfx(L); }
  after(s, fn) { this.jobs.push({ at: this.t + s, fn }); }
  addObj(o) { this.L.world.root.add(o); this.objs.push(o); return o; }
  ensureCss() {
    if ([...document.querySelectorAll('link[rel="stylesheet"]')].some(l => /churro\/game\.css$/.test(l.getAttribute('href') || ''))) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = CSS_HREF; document.head.append(l); this.cssLink = l;
  }

  async enter({ lv = 0 } = {}) {
    const L = this.L, W = L.world, ui = L.ui;
    this.lvIdx = clamp(lv | 0, 0, LEVELS.length - 1); const LV = this.lv = LEVELS[this.lvIdx];
    this.ensureCss();
    document.getElementById('app').dataset.night = '1';
    L.setBg(['#3b3a6e', '#1d1c3a']); W.setLight(NIGHT);
    const layout = { w: RW, d: RD, theme: THEMES.apt, wallH: 2.9, walls: { N: 'wall', W: 'wall' }, furniture: LV.furniture, decor: LV.decor || DECOR };
    const map = this.map = new MapRooms(W, { theme: THEMES.apt, bleed: true, rooms: [{ at: [0, 0], layout }] });
    W.root.add(map.group); map.group.updateMatrixWorld(true);
    this.room = map.rooms[0];
    this.buildPieces(LV);
    if (LV.dog) this.bodies.push({ x: LV.dog.at[0], z: LV.dog.at[1], r: .32 });
    this.buildNav();
    for (const s of this.surfs) if (!s.floor) s.cands = s.h > 1.1 ? [] : this.candsFor(s);   // high ones: down via something lower
    this.buildItems(LV);
    this.buildDrawer(LV);
    this.buildOwner();
    this.buildCat(LV);
    if (LV.dog) this.buildDog(LV.dog);
    if (LV.vac) this.buildVac(LV.vac);
    this.buildVision();
    this.buildGlows();
    this.frame();
    Object.assign(this, { score: 0, knocked: 0, strikes: 0, timeLeft: LV.time, result: null, combo: 0, lastHit: -9, lastHitPt: null, unlocked: false,
      aegyo: LV.aegyo === 'get' ? 0 : 2, aegyoGot: LV.aegyo !== 'get', immuneT: 0, caughtT: 0, stunT: 0, holdT: 0, touch: null, route: null, jump: null, swat: null, paw: null, shake: 0 });
    L.makeThumbs({ faces: [['mong', 'normal'], ['mong', 'angry'], ['mong', 'happy'], [CAT, 'happy'], [CAT, 'wow']] });
    this.buildHud();
    this.bindInput();
    W.idsDirty = true; W.shadowDirty = true;
    await ui.banner(LV.name, LV.sub, 1300);
    if (this.dead) return;
    this.started = true;
    if (LV.vac) this.gotCard('로봇청소기 타기', '청소기를 꾹 누르면 폴짝 올라타요 · 타고 있으면 움직여도 안 들켜요');
  }

  // ── the world: furniture footprints (walking), sight blockers, surfaces (with the room's height for each)
  buildPieces(LV) {
    const R = this.room;
    this.solids = []; this.occ = []; this.surfs = []; this.bodies = []; this.pieces = [];
    this.floor = { id: 0, name: 'floor', floor: true, h: 0 }; this.surfs.push(this.floor);
    const addSurf = s => { s.id = this.surfs.length; s.walk = s.walk || inset(s.real, .1); this.surfs.push(s); return s; };
    const eng = [];
    for (const rec of this.map.furns) {
      if (rec.type === 'rug') continue;
      const rot = rec.rot || 0, [fw, fd] = R.footprint(rec.type, rot), tx = -RW / 2 + rec.i, tz = -RD / 2 + rec.j, cx = tx + fw / 2, cz = tz + fd / 2;
      const b = new THREE.Box3().setFromObject(rec.f.group);
      const foot = /plant|monstera/.test(rec.type) ? { x0: tx + .26, x1: tx + fw - .26, z0: tz + .26, z1: tz + fd - .26 }
        : { x0: Math.max(tx, b.min.x + .04), x1: Math.min(tx + fw, b.max.x - .04), z0: Math.max(tz, b.min.z + .04), z1: Math.min(tz + fd, b.max.z - .04) };
      this.solids.push(foot);
      if (EOCC[rec.type]) for (const o of EOCC[rec.type]) this.occ.push(rotRect(o, rot, cx, cz));
      else if (b.max.y - b.min.y >= .22) this.occ.push({ x0: b.min.x + .06, x1: b.max.x - .06, z0: b.min.z + .06, z1: b.max.z - .06, h: b.max.y });
      for (const s of ESURF[rec.type] || []) eng.push({ name: s.name, real: rotRect(s, rot, cx, cz), h: s.h, foot, rec });
    }
    for (const s of mergeSurfs(eng)) addSurf(s);
    for (const [kind, x, z] of LV.own) {
      const P = ownPiece(kind, x, z); this.addObj(P.g); this.pieces.push(P); P.kind = kind;
      if (P.solid) this.solids.push(P.solid);
      this.occ.push(...P.occ);
      for (const s of P.surfs) addSurf({ ...s, foot: P.solid });
      if (kind === 'desk') this.deskAnchor = P.anchor;
    }
    this.bodies.push({ x: SEAT.x, z: SEAT.z, r: .42 });
  }
  surf(name, x, z) { return this.surfs.find(s => s.name === name && (x == null || inRect(s.real, x, z, .05))); }
  surfAtPoint(x, z, y) { let best = null; for (const s of this.surfs) if (!s.floor && !s.moving && Math.abs(s.h - y) < .05 && inRect(s.real, x, z, .02)) best = s; return best; }

  // ── floor walking: a .2 grid of free cells, BFS + string pulling
  floorFree(x, z, r = CAT_R) {
    const m = .17;
    if (x < -RW / 2 + m || x > RW / 2 - m || z < -RD / 2 + m || z > RD / 2 - m) return false;
    for (const S of this.solids) if (x > S.x0 - r && x < S.x1 + r && z > S.z0 - r && z < S.z1 + r) return false;
    for (const b of this.bodies) if (Math.hypot(x - b.x, z - b.z) < b.r + r) return false;
    return true;
  }
  buildNav() {
    const s = .2, x0 = -RW / 2, z0 = -RD / 2, nx = Math.round(RW / s), nz = Math.round(RD / s), free = new Uint8Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) free[j * nx + i] = this.floorFree(x0 + (i + .5) * s, z0 + (j + .5) * s) ? 1 : 0;
    this.nav = { s, x0, z0, nx, nz, free };
    const d = this.lv.dog;
    if (d) { const safe = free.slice(); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (Math.hypot(x0 + (i + .5) * s - d.at[0], z0 + (j + .5) * s - d.at[1]) < d.wake + .12) safe[j * nx + i] = 0; this.nav.safe = safe; }
  }
  dogNear(x, z, m = .1) { return this.dog && !this.dogAwake && Math.hypot(x - this.dog.root.position.x, z - this.dog.root.position.z) < this.dogR + m; }
  cellAt(x, z) { const N = this.nav; return [clamp(Math.floor((x - N.x0) / N.s), 0, N.nx - 1), clamp(Math.floor((z - N.z0) / N.s), 0, N.nz - 1)]; }
  cellPt(i, j) { const N = this.nav; return { x: N.x0 + (i + .5) * N.s, z: N.z0 + (j + .5) * N.s }; }
  nearestFree(i, j, F = this.nav.free) {
    const N = this.nav; if (F[j * N.nx + i]) return [i, j];
    for (let r = 1; r < 12; r++) { let best = null, bd = 1e9; for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= N.nx || b >= N.nz || !F[b * N.nx + a]) continue; const d = di * di + dj * dj; if (d < bd) { bd = d; best = [a, b]; } } if (best) return best; }
    return null;
  }
  lineFree(a, b) { const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / .07); for (let k = 1; k < n; k++) if (!this.floorFree(a.x + (b.x - a.x) * k / n, a.z + (b.z - a.z) * k / n, CAT_R - .03)) return false; return true; }
  navPath(ax, az, bx, bz) {
    // around a sleeping dog when there is a way (and the goal isn't right by it)
    if (this.nav.safe && !this.dogAwake && !this.dogNear(bx, bz, .15)) { const p = this.navPathOn(this.nav.safe, ax, az, bx, bz); if (p) return p; }
    return this.navPathOn(this.nav.free, ax, az, bx, bz);
  }
  navPathOn(F, ax, az, bx, bz) {
    const N = this.nav, A = this.nearestFree(...this.cellAt(ax, az), F), B = this.nearestFree(...this.cellAt(bx, bz), F);
    if (!A || !B) return null;
    const idx = (i, j) => j * N.nx + i, prev = new Int32Array(N.nx * N.nz).fill(-1), start = idx(...A), goal = idx(...B);
    prev[start] = start; const q = [start];
    while (q.length) {
      const c = q.shift(); if (c === goal) break; const ci = c % N.nx, cj = (c / N.nx) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue; const a = ci + di, b = cj + dj; if (a < 0 || b < 0 || a >= N.nx || b >= N.nz) continue;
        const k = idx(a, b); if (prev[k] >= 0 || !F[k]) continue;
        if (di && dj && (!F[idx(ci + di, cj)] || !F[idx(ci, cj + dj)])) continue;
        prev[k] = c; q.push(k);
      }
    }
    if (prev[goal] < 0) return null;
    const cells = []; for (let c = goal; c !== start; c = prev[c]) cells.unshift(c);
    const pts = [{ x: ax, z: az }, ...cells.map(c => this.cellPt(c % N.nx, (c / N.nx) | 0))];
    if (this.floorFree(bx, bz)) pts.push({ x: bx, z: bz });
    const out = []; let i = 0;
    while (i < pts.length - 1) { let k = pts.length - 1; while (k > i + 1 && !this.lineFree(pts[i], pts[k])) k--; out.push(pts[k]); i = k; }
    return out;
  }
  // takeoff (floor) ↔ landing (surface) pairs around a surface
  candsFor(S) {
    const e = S.real, out = [];
    const edges = [{ n: [1, 0], fix: e.x1, a: [e.z0, e.z1], ax: 'z' }, { n: [-1, 0], fix: e.x0, a: [e.z0, e.z1], ax: 'z' }, { n: [0, 1], fix: e.z1, a: [e.x0, e.x1], ax: 'x' }, { n: [0, -1], fix: e.z0, a: [e.x0, e.x1], ax: 'x' }];
    for (const E of edges) {
      const len = E.a[1] - E.a[0], k = Math.max(1, Math.round(len / .22));
      for (let i = 0; i <= k; i++) {
        const u = E.a[0] + Math.min(.08, len / 2) + (len - Math.min(.16, len)) * (i / k);
        const ex = E.ax === 'z' ? E.fix : u, ez = E.ax === 'z' ? u : E.fix;
        let f = null;
        for (let d = .22; d <= .62; d += .05) { const fx = ex + E.n[0] * d, fz = ez + E.n[1] * d; if (this.floorFree(fx, fz)) { f = { x: fx, z: fz }; break; } }
        if (f) out.push({ a: f, b: clampRect(S.walk, ex - E.n[0] * .12, ez - E.n[1] * .12) });
      }
    }
    return out;
  }
  vacCands() {
    const V = this.vac, out = []; if (!V) return out;
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; for (const d of [.42, .56]) { const x = V.x + Math.sin(a) * d, z = V.z + Math.cos(a) * d; if (this.floorFree(x, z)) { out.push({ a: { x, z }, b: { x: V.x, z: V.z } }); break; } } }
    return out;
  }
  link(A, B, from, ref) {
    if (A.floor && B.floor) return null;
    const near = (C, fa, fb) => { let best = null, bc = Infinity; for (const c of C) { const k = Math.hypot(c[fa].x - from.x, c[fa].z - from.z) * 1.3 + Math.hypot(c[fb].x - ref.x, c[fb].z - ref.z) + (this.dogNear(c.a.x, c.a.z) ? 3 : 0); if (k < bc) { bc = k; best = c; } } return best; };
    if (A.floor) { if (B.h > JUMP_UP) return null; const c = near(B.moving ? this.vacCands() : B.cands || [], 'a', 'b'); return c && { a: c.a, b: c.b }; }
    if (B.floor) { const c = near(A.moving ? this.vacCands() : A.cands || [], 'b', 'a'); return c && { a: A.moving ? { x: this.vac.x, z: this.vac.z } : c.b, b: c.a }; }
    if (B.h - A.h > JUMP_UP || rectGap(A.real, B.real) > JUMP_GAP) return null;
    const px = axisPair(A.walk.x0, A.walk.x1, B.walk.x0, B.walk.x1, from.x), pz = axisPair(A.walk.z0, A.walk.z1, B.walk.z0, B.walk.z1, from.z);
    const a = { x: px[0], z: pz[0] }, b = { x: px[1], z: pz[1] };
    if (Math.hypot(a.x - b.x, a.z - b.z) < .05) { const cx = (B.walk.x0 + B.walk.x1) / 2, cz = (B.walk.z0 + B.walk.z1) / 2, d = Math.hypot(cx - b.x, cz - b.z) || 1; Object.assign(b, clampRect(B.walk, b.x + (cx - b.x) / d * .14, b.z + (cz - b.z) / d * .14)); }
    return { a, b };
  }
  // the way to a goal: Dijkstra over surfaces (each jump costs a bit), walking legs in between
  plan(goal) {
    const start = this.cs, from = { x: this.p.x, z: this.p.z }, best = new Map([[start.id, { cost: 0, at: from, prev: null, link: null }]]), done = new Set();
    for (let guard = 0; guard < 40; guard++) {
      let S = null, bc = Infinity;
      for (const s of this.surfs) { const n = best.get(s.id); if (n && !done.has(s.id) && n.cost < bc) { bc = n.cost; S = s; } }
      if (!S) break; done.add(S.id); if (S === goal.s) break;
      const N = best.get(S.id);
      for (const B of this.surfs) {
        if (B === S || done.has(B.id)) continue;
        const ref = B === goal.s ? goal : { x: (B.walk?.x0 + B.walk?.x1) / 2 || goal.x, z: (B.walk?.z0 + B.walk?.z1) / 2 || goal.z };
        const Lk = this.link(S, B, N.at, ref); if (!Lk) continue;
        const c = N.cost + Math.hypot(Lk.a.x - N.at.x, Lk.a.z - N.at.z) * (S.floor ? 1.3 : 1) + .55 + Math.abs(B.h - S.h) * .5;
        const old = best.get(B.id); if (!old || c < old.cost) best.set(B.id, { cost: c, at: Lk.b, prev: S, link: Lk });
      }
    }
    if (!best.has(goal.s.id)) return null;
    const steps = []; for (let s = goal.s; s !== start;) { const n = best.get(s.id); steps.unshift({ a: n.link.a, b: n.link.b, to: s }); s = n.prev; }
    return { steps, final: { x: goal.x, z: goal.z }, s: goal.s, path: null, pathFor: null };
  }

  // ── things on top of things
  buildItems(LV) {
    this.items = []; this.debris = [];
    LV.items.forEach(([type, x, z], idx) => {
      const K = KINDS[type];
      const S = this.surfs.filter(s => !s.floor && inRect(s.real, x, z, .02)).sort((a, b) => b.h - a.h)[0];
      if (!S) { console.warn('churro: no surface for', type, x, z); return; }
      const inner = itemMesh(type); const b0 = new THREE.Box3().setFromObject(inner), hh = b0.max.y - b0.min.y || .1, sc = K.h / hh;
      inner.scale.setScalar(sc); inner.position.y = -b0.min.y * sc;
      inner.traverse(o => { if (o.isMesh) { o.castShadow = false; o.userData.crItem = idx; } });
      const g = new THREE.Group(); g.add(inner); g.rotation.y = Math.random() * Math.PI * 2;
      const wrapG = new THREE.Group(); wrapG.add(g); this.addObj(wrapG);
      const sz = new THREE.Box3().setFromObject(inner).getSize(new THREE.Vector3());
      const it = { idx, type, K, s: S, x, z, x0: x, z0: z, y: S.h, g: wrapG, inner, prog: 0, state: 'rest', angle: 0, bump: 0, r: Math.max(sz.x, sz.z) / 2, hh: K.h / 2 };
      it.shadow = this.addObj(this.blob(Math.max(.07, it.r * .95)));
      const rm = new THREE.Mesh(new THREE.RingGeometry(it.r + .035, it.r + .075, 28), new THREE.MeshBasicMaterial({ color: K.pts >= 2 ? '#ffd23f' : '#ffffff', transparent: true, opacity: .6, depthWrite: false }));
      rm.rotation.x = -Math.PI / 2; rm.renderOrder = 3; it.ring = this.addObj(rm);
      this.chooseEdge(it);
      if (type === 'mouse') this.buildCable(it);
      this.items.push(it);
      this.placeItem(it);
    });
  }
  blob(r) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: '#3c1e46', transparent: true, opacity: .22, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 1; return m;
  }
  // which edge it goes over: the nearest one facing the room (so the fall is seen), with free floor where it lands
  chooseEdge(it) {
    const S = it.s, e = S.real, h = S.h;
    const v = 1.0 + .4 * h, vy = .7, tl = (vy + Math.sqrt(vy * vy + 2 * GRAV * h)) / GRAV, land = v * tl + .05;
    const opts = [];
    for (const [nx, nz, ex, ez, d] of [[1, 0, e.x1, it.z, e.x1 - it.x], [-1, 0, e.x0, it.z, it.x - e.x0], [0, 1, it.x, e.z1, e.z1 - it.z], [0, -1, it.x, e.z0, it.z - e.z0]]) {
      if (ex < -RW / 2 + .15 || ez < -RD / 2 + .15) continue;   // against a wall
      const lx = ex + nx * land, lz = ez + nz * land;
      const free = this.floorFree(lx, lz, .05), onSurf = this.surfs.some(s => !s.floor && s !== S && s.h < h && inRect(s.real, lx, lz));
      const spot = clampRect(S.walk, it.x - nx * .3, it.z - nz * .3);
      const reach = Math.hypot(spot.x - it.x, spot.z - it.z);
      const cost = d + (nx > 0 || nz > 0 ? 0 : .5) + (free ? 0 : onSurf ? .6 : 3) + (reach < .12 ? .8 : 0);
      opts.push({ nx, nz, ex, ez, spot, cost, reach });
    }
    opts.sort((a, b) => a.cost - b.cost);
    const o = opts[0] || { nx: 0, nz: 1, ex: it.x, ez: e.z1, spot: clampRect(S.walk, it.x, it.z - .3), reach: .3 };
    it.dir = [o.nx, o.nz]; it.ex = o.ex - o.nx * .02; it.ez = o.ez - o.nz * .02;
    // where 추로 stands to swat: behind it (or beside it, if behind is off the surface)
    let spot = o.spot;
    if (o.reach < .16) { for (const s of [1, -1]) { const c = clampRect(S.walk, it.x + o.nz * .3 * s, it.z - o.nx * .3 * s); if (Math.hypot(c.x - it.x, c.z - it.z) > .16) { spot = c; break; } } }
    it.spot = spot;
  }
  buildCable(it) {
    const m = mat('#9aa0b8');
    it.cable = [0, 1].map(() => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.007, .007, 1, 6), m); c.castShadow = false; this.addObj(c); return c; });
    it.anchor = new THREE.Vector3(this.deskAnchor?.x ?? it.x - .1, (this.deskAnchor?.y ?? it.s.h) + .006, this.deskAnchor?.z ?? it.z - .4);
  }
  placeCable(it) {
    const A = it.anchor, P = it.pivot, M = new THREE.Vector3(it.x, it.y + .03, it.z);
    const seg = (c, a, b) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(); c.visible = L > .01; if (!c.visible) return; c.position.copy(a).addScaledVector(d, .5); c.scale.set(1, L, 1); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };
    if (P) { seg(it.cable[0], A, P); seg(it.cable[1], P, M); } else { seg(it.cable[0], A, M); it.cable[1].visible = false; }
  }
  placeItem(it) {
    const q = it.g.quaternion, ax = new THREE.Vector3(it.dir[1], 0, -it.dir[0]);
    q.setFromAxisAngle(ax, it.angle + it.bump * .25);
    it.g.position.set(it.x, it.y + it.bump * .03, it.z);
    // the soft shadow on whatever is below
    const gy = this.groundAt(it.x, it.z, it.y + .02);
    it.shadow.position.set(it.x, gy + .014, it.z); it.shadow.visible = !it.gone;
    if (it.ring) { const on = it.state === 'rest'; it.ring.visible = on; if (on) { it.ring.position.set(it.x, it.y + .012, it.z); const k = .5 + .5 * Math.sin(this.t * 4 + it.idx); it.ring.material.opacity = .35 + .4 * k; it.ring.scale.setScalar(1 + .08 * k + (this.touch?.item === it || this.swat?.item === it ? .25 : 0)); } }
    const k = clamp(1 - (it.y - gy) * .6, .3, 1); it.shadow.scale.setScalar(k);
    if (it.cable) this.placeCable(it);
  }
  groundAt(x, z, y) {
    let g = 0;
    for (const s of this.surfs) if (!s.floor && !s.moving && s.h <= y && s.h > g && inRect(s.real, x, z)) g = s.h;
    for (const o of this.occ) if (o.h <= y && o.h > g && inRect(o, x, z)) g = o.h;
    return g;
  }
  buildDrawer(LV) {
    const rec = this.map.furns.find(r => r.type === LV.churu), R = this.room;
    const rot = rec.rot || 0, [fw, fd] = R.footprint(rec.type, rot), cx = -RW / 2 + rec.i + fw / 2, cz = -RD / 2 + rec.j + fd / 2;
    const fwd = [Math.sin(rot * Math.PI / 2), Math.cos(rot * Math.PI / 2)];
    let spot = null; for (let d = .6; d < 1.4; d += .05) { const x = cx + fwd[0] * d, z = cz + fwd[1] * d; if (this.floorFree(x, z)) { spot = { x, z }; break; } }
    this.drawer = { rec, part: rec.f.parts[0], spot: spot || { x: cx + fwd[0], z: cz + fwd[1] }, fwd, c: { x: cx, z: cz }, anchor: new THREE.Vector3(cx + fwd[0] * .3, .28, cz + fwd[1] * .3), prog: 0, open: 0, jig: 0 };
  }

  // ── characters
  buildOwner() {
    const o = this.owner = new Char('mong'); o.root.scale.setScalar(OWNER_S); o.root.position.set(SEAT.x, SEAT.y, SEAT.z); o.root.rotation.y = BUSY_YAW; o.pose = 'hold';
    this.addObj(o.root);
    this.chair = this.addObj(makeChair()); this.chair.position.set(SEAT.x, 0, SEAT.z); this.chair.rotation.y = BUSY_YAW;
    this.ow = { s: 'busy', t: rnd(this.lv.busy) + 1.5, yaw: BUSY_YAW, look: BUSY_YAW, noiseAt: null, saw: false };
    this.ownerTag = { root: o.root, headTop: () => o.headTop() * OWNER_S + .02 };
  }
  buildCat(LV) {
    const me = this.me = new Char(CAT); me.root.scale.setScalar(CAT_S); this.addObj(me.root);
    const bed = this.surf('catbed', LV.start[0], LV.start[1]);
    this.cs = bed || this.floor; this.p = { x: LV.start[0], z: LV.start[1] }; this.cy = this.cs.h; this.face = Math.PI / 4;
    me.root.position.set(this.p.x, this.cy, this.p.z); me.root.rotation.y = this.face;
    this.catTag = { root: me.root, headTop: () => me.headTop() * CAT_S };
    const ringM = (a, b, c, o) => { const m = new THREE.Mesh(new THREE.RingGeometry(a, b, 32), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 3; return this.addObj(m); };
    this.ring = ringM(.26, .34, '#ffffff', .4); this.aim = ringM(.08, .13, '#ffffff', 0);
  }
  buildDog(d) {
    const dog = this.dog = new Char('shiba'); dog.root.position.set(d.at[0], 0, d.at[1]); dog.root.rotation.y = d.yaw ?? .8; dog.setFace('happy');
    this.addObj(dog.root); this.dogAwake = false; this.dogR = d.wake;
    this.zzz = this.L.say(dog, 'Zz…', 1e9, 'think');
    const z = new THREE.Mesh(new THREE.RingGeometry(d.wake - .06, d.wake, 48), new THREE.MeshBasicMaterial({ color: '#9fc8ff', transparent: true, opacity: .25, depthWrite: false }));
    z.rotation.x = -Math.PI / 2; z.position.set(d.at[0], .03, d.at[1]); z.renderOrder = 2; this.dogZone = this.addObj(z);
  }
  buildVac(def) {
    const g = this.addObj(makeVac());
    const path = def.path.map(([x, z]) => ({ x, z })).filter(p => this.floorFree(p.x, p.z, .22));
    if (path.length < 2) return;
    const V = this.vac = { g, path, i: 0, x: path[0].x, z: path[0].z, yaw: 0, wait: .8, ridden: false };
    V.surf = { id: this.surfs.length, name: 'vac', moving: true, h: .115, real: {}, walk: {} }; this.surfs.push(V.surf);
    this.syncVac();
  }
  syncVac() {
    const V = this.vac;
    V.surf.real = { x0: V.x - .22, x1: V.x + .22, z0: V.z - .22, z1: V.z + .22 }; V.surf.walk = { x0: V.x - .012, x1: V.x + .012, z0: V.z - .012, z1: V.z + .012 };
    V.g.position.set(V.x, 0, V.z); V.g.rotation.y = V.yaw;
  }
  buildGlows() {
    const glow = (x, y, z, r, c, o) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 36), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 2; return this.addObj(m); };
    this.monGlow = glow(-.35, .786, -2.02, .5, '#9fd8ff', .22); this.monGlow.scale.set(1.3, 1, .8);
    this.lampGlow = glow(-.72, .787, -2.18, .32, '#fff0a0', .3);
    this.moon = glow(-2.0, .02, -.3, .9, '#dfe6ff', .13); this.moon.scale.set(.75, 1, 1.4);
    const wall = new THREE.Mesh(new THREE.CircleGeometry(.75, 36), new THREE.MeshBasicMaterial({ color: '#9fd8ff', transparent: true, opacity: .16, depthWrite: false }));
    wall.position.set(-.35, 1.25, -2.47); this.wallGlow = this.addObj(wall);
  }
  frame() {
    const W = this.L.world, span = (RW + RD) / Math.SQRT2 + .5;
    // close: the room's middle fills the phone's width (its far corners may go off-screen); the view follows 추로 a little
    W.home.set(.1, .5, .05); W.target.copy(W.home); W.yaw = Math.PI / 4; W.pitch = .72; W.zoom = 1;
    W.bounds = 99; W.slack = null; W.camLock = true;
    W.setFit(span * .6, span * .45, .5);
  }

  // ── the owner's gaze painted on the floor (warm = looking now, red = about to look), like 엄마 몰래 야식
  buildVision() {
    const x0 = -RW / 2 - .2, x1 = RW / 2 + .2, z0 = -RD / 2 - .2, z1 = RD / 2 + .2, R = 22;
    const cv = this.vc = document.createElement('canvas'); cv.width = Math.round((x1 - x0) * R); cv.height = Math.round((z1 - z0) * R);
    this.vctx = cv.getContext('2d'); this.vimg = this.vctx.createImageData(cv.width, cv.height); this.vbox = { x0, z0, R, w: cv.width, h: cv.height };
    const tex = this.vtex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, .025, (z0 + z1) / 2); m.renderOrder = 2; this.vmesh = this.addObj(m); this._vKey = '';
  }
  sight() { const s = this.ow.s; return SEEING.has(s) ? { half: this.lv.half * DEG, range: this.lv.range, on: true } : { on: false }; }
  paintVision() {
    const { x0, z0, R, w, h } = this.vbox, d = this.vimg.data, o = this.ow, S = this.sight();
    const red = o.s === 'hmm', key = `${o.yaw.toFixed(3)}|${o.s}|${o.look.toFixed(3)}|${red ? Math.round(this.t * 6) : ''}`;
    if (key === this._vKey) return; this._vKey = key;
    d.fill(0);
    const layers = [];
    if (S.on) layers.push({ yaw: o.yaw, half: S.half, range: S.range, a: 112, c: [255, 214, 90] });
    if (red) layers.push({ yaw: o.look, half: this.lv.half * DEG, range: this.lv.range, a: 70 + 40 * Math.abs(Math.sin(this.t * 12)), c: [255, 92, 110] });
    if (layers.length) for (let py = 0; py < h; py += 2) for (let px = 0; px < w; px += 2) {
      const x = x0 + (px + 1) / R, z = z0 + (py + 1) / R, dx = x - EYE.x, dz = z - EYE.z, r = Math.hypot(dx, dz);
      if (r < .3) continue;
      const ang = Math.atan2(dx, dz); let best = null;
      for (const Ly of layers) {
        if (r > Ly.range) continue; const da = Math.abs(wrap(ang - Ly.yaw)); if (da > Ly.half) continue;
        if (!sees(EYE, this.occ, x, z, .35)) continue;
        const a = Ly.a * Math.min(1, (Ly.half - da) / .12) * Math.min(1, (Ly.range - r) / 1.0);
        if (!best || a > best.a) best = { a, c: Ly.c };
      }
      if (!best) continue;
      for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) { const k = ((py + yy) * w + (px + xx)) * 4; d[k] = best.c[0]; d[k + 1] = best.c[1]; d[k + 2] = best.c[2]; d[k + 3] = best.a; }
    }
    this.vctx.putImageData(this.vimg, 0, 0); this.vtex.needsUpdate = true;
  }
  canSee(x, z, ph, yaw = this.ow.yaw) {
    const dx = x - EYE.x, dz = z - EYE.z, r = Math.hypot(dx, dz);
    if (r > this.lv.range) return false;
    if (Math.abs(wrap(Math.atan2(dx, dz) - yaw)) > this.lv.half * DEG) return false;
    return sees(EYE, this.occ, x, z, ph);
  }
  catPH() { return this.cy + (this.isActive() ? .42 : .3); }
  isActive() { return !!(this.walking || this.jump || this.swat || this.paw); }

  // ── HUD
  buildHud() {
    const L = this.L, ui = L.ui, h = L.h, col = ui.col();
    const top = h('div', { class: 'topbar' });
    top.append(L.homeBtn(), h('div', { class: 'lab-title ol' }, '추로야!!!', h('small', {}, this.lv.name)));
    this.meterTx = h('b', {}, `0/${this.lv.need}`); this.meterFill = h('i');
    this.meterEl = h('div', { class: 'cr-meter' }, h('span', { html: PAW }), this.meterTx, h('div', { class: 'cr-mbar' }, this.meterFill));
    this.clockTx = h('span', {}, fmt(this.timeLeft)); this.clockEl = h('div', { class: 'cr-clock' }, h('span', { html: CLOCK }), this.clockTx);
    top.append(h('div', { class: 'cr-topr' }, this.meterEl, this.clockEl));
    col.append(top);
    this.pips = [0, 1, 2].map(() => h('i'));
    this.ownerEl = h('div', { class: 'cr-owner' }, this.ownerImg = h('img', { src: L.thumbs.face_mong_normal }), h('div', { class: 'cr-strikes' }, ...this.pips));
    col.append(this.ownerEl);
    this.hint = h('div', { class: 'cr-hint ol' }, h('span', { class: 'cr-hand' }), this.hintTx = h('span', {}, ''));
    col.append(this.hint);
    const app = document.getElementById('app');
    this.vig = h('div', { class: 'cr-vig' }); this.flash = h('div', { class: 'cr-flash' }); app.append(this.vig, this.flash);
    this.chuBadge = h('div', { class: 'cr-chu', html: LOCK + '<span>츄르</span>' }); ui.wui.append(this.chuBadge);
    this.aegyoBadge = h('div', { class: 'cr-aegyo' }, '♥ 터치! 애교'); ui.wui.append(this.aegyoBadge);
    if (this.vac) { this.rideBadge = h('div', { class: 'cr-ride' }, '타기!'); ui.wui.append(this.rideBadge); }
    this.badges = [this.chuBadge, this.aegyoBadge, this.rideBadge].filter(Boolean);
  }
  gotCard(name, sub) {
    const L = this.L, h = L.h;
    const c = h('div', { class: 'cr-get' }, h('div', { class: 'cr-get-t' }, '새로 얻었다!'), h('div', { class: 'cr-get-n' }, name), h('div', { class: 'cr-get-s' }, sub));
    document.getElementById('app').append(c); (this.cards ||= []).push(c); L.audio.sfx('special');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => c.remove(), 400); }, 2700);
  }
  setMeter(bump) {
    const need = this.lv.need;
    this.meterTx.textContent = `${Math.min(this.score, need)}/${need}`; this.meterFill.style.width = Math.min(100, this.score / need * 100) + '%';
    if (bump) { this.meterEl.classList.remove('bump'); void this.meterEl.offsetWidth; this.meterEl.classList.add('bump'); }
    this.meterEl.classList.toggle('full', this.unlocked);
  }

  // ── input: press = where 추로 should go (a thing to swat, the drawer, the vacuum, or any spot); let go = freeze
  bindInput() {
    const app = document.getElementById('app');
    this._down = e => {
      if (e.button > 0 || this.result || this.touch || !this.started) return;
      const P = this.pickAt(e.clientX, e.clientY);
      if (P.kind === 'cat') { this.doAegyo(); return; }
      this.touch = { id: e.pointerId, x: e.clientX, y: e.clientY, ...P }; this.everPressed = true; this.holdT = 0;
    };
    this._move = e => { const T = this.touch; if (T && e.pointerId === T.id) { T.x = e.clientX; T.y = e.clientY; } };
    this._up = e => { if (this.touch && (e?.pointerId == null || e.pointerId === this.touch.id)) { this.touch = null; this.pawBlocked = false; } };
    this._blur = () => this._up({});
    app.addEventListener('pointerdown', this._down); addEventListener('pointermove', this._move); addEventListener('pointerup', this._up); addEventListener('pointercancel', this._up); addEventListener('blur', this._blur);
  }
  scr(x, y, z) { return this.L.world.toScreen(new THREE.Vector3(x, y, z)); }
  aegyoUsable() { return this.aegyo > 0 && (this.ow.s === 'look' || this.ow.s === 'turn') && !this.isActive() && this.stunT <= 0 && !this.result; }
  pickAt(cx, cy) {
    const W = this.L.world;
    const cs = this.scr(this.p.x, this.cy + .3, this.p.z);
    if (this.aegyoUsable() && Math.hypot(cs.x - cx, cs.y - cy) < 46) return { kind: 'cat' };
    let best = null, bd = 34;
    for (const it of this.items) if (it.state === 'rest') { const s = this.scr(it.x, it.y + it.hh, it.z), d = Math.hypot(s.x - cx, s.y - cy); if (d < bd) { bd = d; best = it; } }
    if (!best) { const live = this.items.filter(i => i.state === 'rest'), hit = W.pick(cx, cy, live.map(i => i.g))[0]; if (hit) best = live.find(i => { for (let o = hit.object; o; o = o.parent) if (o === i.g) return true; return false; }); }
    if (best) return { kind: 'item', item: best };
    if (this.vac) { const s = this.scr(this.vac.x, .1, this.vac.z); if (Math.hypot(s.x - cx, s.y - cy) < 34) return { kind: 'vac' }; }
    const ds = this.scr(this.drawer.anchor.x, this.drawer.anchor.y, this.drawer.anchor.z);
    if (Math.hypot(ds.x - cx, ds.y - cy) < 42) return { kind: 'drawer' };
    const dh = W.pick(cx, cy, [this.drawer.rec.f.group])[0]; if (dh) return { kind: 'drawer' };
    return { kind: 'point' };
  }
  // a screen point → the surface under it (the topmost one along the ray), or the floor
  surfaceAt(cx, cy) {
    const W = this.L.world; W.raycaster.setFromCamera(W.ndc(cx, cy), W.cam); const r = W.raycaster.ray, o = r.origin, d = r.direction;
    if (Math.abs(d.y) < 1e-5) return null;
    let best = null;
    for (const S of this.surfs) {
      if (S.floor) continue; const t = (S.h - o.y) / d.y; if (t <= 0) continue;
      const x = o.x + d.x * t, z = o.z + d.z * t; if (inRect(S.real, x, z, .08) && (!best || t < best.t)) best = { S, x, z, t };
    }
    const t0 = -o.y / d.y, gx = o.x + d.x * t0, gz = o.z + d.z * t0;
    if (best) return { s: best.S, ...clampRect(best.S.walk, best.x, best.z) };
    for (const S of this.surfs) if (!S.floor && !S.moving && S.foot && inRect(S.foot, gx, gz)) return { s: S, ...clampRect(S.walk, gx, gz) };
    return { s: this.floor, x: clamp(gx, -RW / 2 + .2, RW / 2 - .2), z: clamp(gz, -RD / 2 + .2, RD / 2 - .2) };
  }
  goalNow() {
    const T = this.touch; if (!T) return null;
    if (T.kind === 'item') { const it = T.item; return it.state === 'rest' ? { key: 'i' + it.idx, s: it.s, x: it.spot.x, z: it.spot.z, item: it } : null; }
    if (T.kind === 'drawer') return { key: 'drawer', s: this.floor, x: this.drawer.spot.x, z: this.drawer.spot.z, drawer: true };
    if (T.kind === 'vac' && this.vac) return { key: 'vac', s: this.vac.surf, x: this.vac.x, z: this.vac.z, vac: true };
    const g = this.surfaceAt(T.x, T.y); return g && { key: 'p', ...g };
  }

  // ── per frame
  update(dt) {
    const L = this.L, W = L.world, me = this.me;
    this.t += dt; this.tw.update(dt);
    for (const j of this.jobs.filter(j => this.t >= j.at)) { this.jobs.splice(this.jobs.indexOf(j), 1); j.fn(); }
    this.map.update(dt); me.update(dt); this.owner.update(dt); this.dog?.update(dt);
    if (this.vac && this.started) this.stepVac(dt);
    this.stepItems(dt);
    this.stepDebris(dt);
    this.stepDrawerLook(dt);
    // camera: drifts a little toward 추로, shakes on a crash
    if (!this.camHold) {
      const p = this.p, k = 1 - Math.exp(-dt * 2);
      W.target.x += ((W.home.x + (p.x - W.home.x) * .32) - W.target.x) * k; W.target.z += ((W.home.z + (p.z - W.home.z) * .32) - W.target.z) * k;
    }
    if (this.punch > 0 && !this.camHold) { this.punch -= dt; W.zoom = 1 + .07 * Math.sin(Math.max(0, this.punch) / .22 * Math.PI); } else if (!this.camHold && W.zoom !== 1) W.zoom = 1;
    if (this.shake > 0) { this.shake -= dt; const a = this.shakeA * Math.max(0, this.shake / .3); W.target.x += (Math.random() - .5) * a; W.target.z += (Math.random() - .5) * a; }
    this.monGlow.material.opacity = .18 + Math.sin(this.t * 3.1) * .03;
    if (this.chuGlow) { const k = .5 + .5 * Math.sin(this.t * 5); this.chuGlow.material.opacity = this.result ? 0 : .4 + .4 * k; this.chuGlow.scale.setScalar(1 + .15 * k); }
    if (this.started && !this.result) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.fail('time'); }
      else { this.stepOwner(dt); this.stepCat(dt); this.watch(dt); }
    } else if (this.result) this.stepEnd(dt);
    this.placeCat(dt);
    this.updateHud();
    this.paintVision();
  }

  // ── the owner
  stepOwner(dt) {
    const LV = this.lv, L = this.L, o = this.ow, ow = this.owner;
    o.t -= dt;
    const turnTo = (g, k) => { o.yaw += wrap(g - o.yaw) * Math.min(1, k); };
    switch (o.s) {
      case 'busy':
        turnTo(BUSY_YAW, dt * 6);
        if (o.noiseAt == null) { this._kt = (this._kt ?? 0) - dt; if (this._kt <= 0) { this._kt = Math.random() < .1 ? .5 + Math.random() * .7 : .07 + Math.random() * .1; this.sfx.key(); ow.bump(.025); } }
        if (o.noiseAt != null && this.t >= o.noiseAt) { const n = o.noise; o.noiseAt = null; this.startHmm(n.pt, true, n.line); }
        else if (o.t <= 0 && o.noiseAt == null) this.startHmm(null, false);
        break;
      case 'hmm': {
        const k = 1 - o.t / o.tel;
        turnTo(BUSY_YAW + wrap(o.look - BUSY_YAW) * .2 * k, dt * 8);
        if (o.t <= 0) {
          if (o.fake) { o.s = 'busy'; o.t = rnd(LV.busy) * .6; L.say(this.ownerTag, '…아닌가', 900, 'think'); ow.setFace('normal'); ow.pose = 'hold'; }
          else { o.s = 'turn'; o.t = .3; L.audio.sfx('swish'); ow.pose = 'idle'; }
        }
        break;
      }
      case 'turn': turnTo(o.look, dt * 14); if (o.t <= 0) { o.s = 'look'; o.t = rnd(LV.look); o.sweep0 = this.t; o.saw = false; } break;
      case 'look': turnTo(o.look + Math.sin((this.t - o.sweep0) * 1.6) * .14, dt * 10); if (o.t <= 0) this.ownerBack(); break;
      case 'glare': case 'melt': turnTo(Math.atan2(this.p.x - EYE.x, this.p.z - EYE.z), dt * 10); if (o.t <= 0) this.ownerBack(); break;
      case 'back': turnTo(BUSY_YAW, dt * 9); if (o.t <= 0) { o.s = 'busy'; o.t = o.nextBusy ?? rnd(LV.busy); o.nextBusy = null; ow.setFace('normal'); ow.pose = 'hold'; } break;
    }
    ow.root.rotation.y = o.yaw; this.chair.rotation.y = o.yaw;
  }
  ownerBack() { const o = this.ow; o.s = 'back'; o.t = .4; if (this.owner.face !== 'happy') this.owner.setFace('normal'); }
  startHmm(pt, urgent, line) {
    const o = this.ow, LV = this.lv, L = this.L;
    if (o.s !== 'busy' && !(urgent && o.s === 'hmm')) return;
    const p = pt || this.p;
    o.look = Math.atan2(p.x - EYE.x, p.z - EYE.z) + (Math.random() - .5) * (pt ? .15 : .55);
    if (o.s === 'hmm') { o.t = Math.min(o.t, .55); o.fake = false; return; }
    o.s = 'hmm'; o.tel = o.t = urgent ? Math.max(.62, LV.tel * .72) : LV.tel; o.fake = !urgent && Math.random() < LV.fake;
    this.owner.setFace('sus'); L.say(this.ownerTag, line || pick(['흠…?', '응…?']), Math.max(700, o.tel * 1000), 'think');
    L.audio.sfx('hmm');
  }
  hear(loud, pt, line) {
    const o = this.ow, p = clamp(loud * this.lv.hear, 0, 1);
    if (o.s === 'busy' && o.noiseAt == null && Math.random() < p) { o.noiseAt = this.t + .3 + (1 - Math.min(1, loud)) * .5; o.noise = { pt, line }; }
    else if (o.s === 'hmm' && Math.random() < p) { o.look = Math.atan2(pt.x - EYE.x, pt.z - EYE.z); o.t = Math.min(o.t, .5); o.fake = false; }
  }

  // ── 추로
  stepCat(dt) {
    const me = this.me;
    this.walking = false;
    if (this.stunT > 0) this.stunT -= dt;
    if (this.watchT > 0) this.watchT -= dt;
    if (this.jump) { this.stepJump(dt); return; }
    const goal = this.stunT > 0 ? null : this.goalNow();
    if (this.touch) this.holdT += dt;
    if (!goal) { this.swat = null; this.paw = null; this.aim.material.opacity = 0; return; }
    this.aim.material.opacity = goal.key === 'p' ? .5 : 0; this.aim.position.set(goal.x, goal.s.h + .04, goal.z);
    const R0 = this.route;
    if (!this.swat && !this.paw && (!R0 || R0.key !== goal.key || R0.s !== goal.s || Math.hypot(R0.final.x - goal.x, R0.final.z - goal.z) > .15)) { const r = this.plan(goal); this.route = r && { ...r, key: goal.key }; }
    if (this.swat) { this.stepSwat(dt); return; }
    if (this.paw) { this.stepPaw(dt); return; }
    const R = this.route; if (!R) return;
    const leg = R.steps[0], tgt = leg ? leg.a : R.final;
    let arrived = false;
    if (this.cs.floor) {
      if (R.pathFor !== tgt) { R.path = this.navPath(this.p.x, this.p.z, tgt.x, tgt.z) || []; R.pathFor = tgt; }
      const wp = R.path[0];
      if (wp) { if (this.moveToward(wp.x, wp.z, dt)) R.path.shift(); }
      else arrived = true;
    } else if (this.cs.moving) arrived = true;
    else { const c = clampRect(this.cs.walk, tgt.x, tgt.z); arrived = this.moveToward(c.x, c.z, dt); }
    if (arrived) { if (leg) this.startJump(leg); else this.arrive(goal); }
  }
  moveToward(tx, tz, dt) {
    const p = this.p, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    const st = WALK * Math.min(1, .45 + this.holdT * 2.5) * dt;
    if (d < 1e-4) return true;
    this.face = Math.atan2(dx, dz); this.walking = true;
    if (d <= st) { p.x = tx; p.z = tz; return true; }
    p.x += dx / d * st; p.z += dz / d * st; return false;
  }
  arrive(goal) {
    if (goal.item && goal.item.state === 'rest' && this.cs === goal.item.s) this.startSwat(goal.item);
    else if (goal.drawer && this.cs.floor && !this.pawBlocked) this.startPaw();
  }
  startJump(leg) {
    const a = { x: this.p.x, z: this.p.z, h: this.cy }, b = { x: leg.b.x, z: leg.b.z, h: leg.to.h }, d = Math.hypot(b.x - a.x, b.z - a.z), dh = b.h - a.h;
    this.jump = { a, b, to: leg.to, t: -.1, dur: .3 + d * .16 + Math.abs(dh) * .13, arc: .14 + Math.max(0, dh) * .42 + d * .1 };
    if (d > .02) this.face = Math.atan2(b.x - a.x, b.z - a.z);
    this.L.audio.sfx('hop', Math.round(Math.max(0, dh) * 6));
  }
  stepJump(dt) {
    const J = this.jump, me = this.me; J.t += dt;
    if (J.to.moving && this.vac) { J.b.x = this.vac.x; J.b.z = this.vac.z; }
    if (J.t < 0) { me.squash = .3; return; }
    const k = Math.min(1, J.t / J.dur);
    this.p.x = J.a.x + (J.b.x - J.a.x) * k; this.p.z = J.a.z + (J.b.z - J.a.z) * k; this.cy = J.a.h + (J.b.h - J.a.h) * k + J.arc * 4 * k * (1 - k);
    me.squash = k < .5 ? -.16 : -.16 + (k - .5) * .12;
    if (k >= 1) {
      this.cs = J.to; this.cy = J.to.h; this.jump = null; me.squash = .34; this.L.audio.sfx('land');
      if (this.route) { this.route.steps.shift(); this.route.path = null; this.route.pathFor = null; }
      if (J.to.moving && this.vac && !this.vac.ridden) { this.vac.ridden = true; this.rideBadge?.remove(); this.L.say(this.catTag, '부릉~', 900); }
    }
  }
  // swat: pat, pat, (pat,) over the edge it goes
  startSwat(it) { this.swat = { item: it, t: 0, k: Math.round(it.prog * it.K.pats), hit: false }; this.face = Math.atan2(it.x - this.p.x, it.z - this.p.z); }
  stepSwat(dt) {
    const S = this.swat, it = S.item, n = it.K.pats;
    if (it.state !== 'rest') { this.swat = null; return; }
    this.face = Math.atan2(it.x - this.p.x, it.z - this.p.z);
    S.t += dt; this.patK = S.t / PAT;
    if (!S.hit && S.t >= PAT * .5) {
      S.hit = true; S.k++; it.prog = S.k / n;
      const k = Math.min(1, it.prog) * .97; it.x = it.x0 + (it.ex - it.x0) * k; it.z = it.z0 + (it.ez - it.z0) * k; it.bump = 1;
      this.sfx.pat(); const s = this.scr(it.x, it.y + it.hh * 2 + .05, it.z); this.L.ui.floatText(s.x + (Math.random() - .5) * 34, s.y - S.k * 8, '톡', 'cr-tok');
      if (S.k >= n) { it.state = 'teeter'; it.tt = 0; this.L.audio.sfx('wobble'); this.swat = null; this.watchT = .8; this.L.log({ swat: it.type, t: +this.t.toFixed(1) }); return; }
    }
    if (S.t >= PAT) { S.t -= PAT; S.hit = false; }
  }
  // the 츄르 drawer: pat it open (locked until the meter is full)
  startPaw() { this.paw = { t: 0, k: 0, hit: false }; this.face = Math.atan2(-this.drawer.fwd[0], -this.drawer.fwd[1]); }
  stepPaw(dt) {
    const P = this.paw, Dr = this.drawer, L = this.L;
    this.face = Math.atan2(-Dr.fwd[0], -Dr.fwd[1]);
    P.t += dt; this.patK = P.t / PAT_DRAWER;
    if (!P.hit && P.t >= PAT_DRAWER * .5) {
      P.hit = true; P.k++;
      if (!this.unlocked) {
        L.audio.sfx('locked'); Dr.jig = 1;
        if (P.k === 1) { L.say(this.catTag, '안 열린다냥…', 1000); L.ui.toast(`장난 게이지를 먼저 채우자 (${this.score}/${this.lv.need})`); }
        if (P.k >= 2) { this.paw = null; this.pawBlocked = true; return; }
      } else {
        Dr.prog = Math.min(1, Dr.prog + 1 / DRAWER_PATS); Dr.jig = .6; this.sfx.rattle(); L.audio.sfx('drawer');
        const s = this.scr(Dr.anchor.x, Dr.anchor.y + .3, Dr.anchor.z); L.ui.floatText(s.x + (Math.random() - .5) * 50, s.y - P.k * 12, '드르륵', 'gold');
        this.hear(.3, { x: Dr.anchor.x, z: Dr.anchor.z }, '어? 무슨 소리지?');
        if (Dr.prog >= 1) { this.paw = null; this.winSeq(); return; }
      }
    }
    if (P.t >= PAT_DRAWER) { P.t -= PAT_DRAWER; P.hit = false; }
  }
  stepDrawerLook(dt) {
    const Dr = this.drawer; if (!Dr) return;
    Dr.jig *= Math.exp(-dt * 9);
    const goal = Dr.prog * .55; Dr.open += (goal - Dr.open) * Math.min(1, dt * 10);
    Dr.part.setOpen(clamp(Dr.open + Math.sin(this.t * 40) * .04 * Dr.jig, 0, 1));
  }
  stepVac(dt) {
    const V = this.vac, tgt = V.path[(V.i + 1) % V.path.length], dx = tgt.x - V.x, dz = tgt.z - V.z, d = Math.hypot(dx, dz) || 1e-6, want = Math.atan2(dx, dz);
    const ox = V.x, oz = V.z; this.riding = false;
    if (V.wait > 0) { V.wait -= dt; V.yaw += wrap(want - V.yaw) * Math.min(1, dt * 5); }
    else {
      const ahead = this.cs.floor && !this.jump && Math.hypot(this.p.x - (V.x + dx / d * .3), this.p.z - (V.z + dz / d * .3)) < .36;
      if (!ahead) { const st = Math.min(d, VAC_V * dt); V.x += dx / d * st; V.z += dz / d * st; V.yaw += wrap(want - V.yaw) * Math.min(1, dt * 6); if (d - st < .01) { V.i = (V.i + 1) % V.path.length; V.wait = .7; } }
    }
    this.syncVac();
    if (V.g.userData.led) V.g.userData.led.scale.setScalar(.7 + Math.abs(Math.sin(this.t * 4)) * .5);
    if (this.cs === V.surf && !this.jump) { this.p.x = V.x; this.p.z = V.z; if (V.x !== ox || V.z !== oz) { this.riding = true; this.face = V.yaw; } }
  }
  placeCat(dt) {
    const me = this.me, p = this.p, W = this.L.world;
    // poses: walking bobs, frozen sits bolt upright, the swat paw on top of whatever the pose put there
    if (this.held) return;
    if (this.walking) { me.lift = Math.abs(Math.sin(this.t * 15)) * .05; me.squash = Math.max(me.squash, .04); me.rx.wag = .5; }
    else if (!this.jump) { me.lift *= .8; me.rx.wag = 0; if (!this.swat && !this.paw && !this.eating && this.t - (this.movedAt || 0) > .28) me.squash = Math.min(me.squash, -.07); }
    if (this.walking || this.jump || this.swat || this.paw) this.movedAt = this.t;
    me.rx.rx = 0;
    if ((this.swat || this.paw) && me.arms?.[1]) {
      const k = (this.patK || 0) % 1, a = me.arms[1]; let x, y, z;
      if (k < .45) { const u = k / .45; x = .44 - u * .08; y = .3 + u * .24; z = .18 + u * .06; }
      else if (k < .62) { const u = (k - .45) / .17; x = .36 - u * .2; y = .54 - u * .32; z = .24 + u * .44; }
      else { const u = (k - .62) / .38; x = .16 + u * .28; y = .22 + u * .08; z = .68 - u * .5; }
      a.position.set(x, y, z); me.rx.rx = k > .45 && k < .8 ? .13 : .04;
    }
    // stared at: turn to us, sit up, the picture of innocence ("…야옹?")
    if (!this.isActive() && !this.riding && SEEING.has(this.ow.s) && !this.result) this.face = Math.PI / 4;
    me.root.position.set(p.x, this.cy, p.z);
    const r = me.root.rotation.y; me.root.rotation.y = r + wrap(this.face - r) * Math.min(1, dt * 14);
    const gy = this.jump ? this.groundAt(p.x, p.z, this.cy + .01) : this.cs.h;
    me.shadow.position.y = (gy - this.cy) / CAT_S + .012;
    this.ring.position.set(p.x, gy + .035, p.z);
  }

  // ── what the owner sees (and hears)
  watch(dt) {
    const L = this.L, o = this.ow, LV = this.lv, me = this.me;
    const S = this.sight();
    if (S.on) {
      const vis = this.canSee(this.p.x, this.p.z, this.catPH());
      if (vis && this.isActive() && this.t > this.immuneT) {
        this.caughtT += dt;
        if (!this._eh) { this._eh = true; L.say(this.ownerTag, '어?', 600, 'think'); L.audio.sfx('gasp'); }
        if (this.caughtT >= LV.grace) this.strike();
      } else { this.caughtT = Math.max(0, this.caughtT - dt * 2); if (this.caughtT < .05) this._eh = false; }
      if (vis && !this.isActive() && o.s === 'look' && !o.saw) this.innocent();
    } else { this.caughtT = 0; this._eh = false; }
    // the dog wakes to footsteps nearby
    if (this.dog && !this.dogAwake && this.cs.floor && (this.walking || this.jump) && Math.hypot(this.p.x - this.dog.root.position.x, this.p.z - this.dog.root.position.z) < this.dogR) this.wakeDog();
  }
  innocent() {
    const L = this.L, me = this.me, o = this.ow; o.saw = true;
    me.setFace('happy'); this.after(.5, () => { if (!this.result && me.face === 'happy') me.setFace('normal'); });
    this.after(.12, () => { L.say(this.catTag, '…야옹?', 1100); this.sfx.meow(.85); });
    const near = this.lastHitPt && this.t - this.lastHit < 5 && Math.hypot(this.lastHitPt.x - this.p.x, this.lastHitPt.z - this.p.z) < 1.6;
    const riding = this.vac && this.cs === this.vac.surf;
    this.after(.7, () => { if (this.result || o.s !== 'look') return; L.say(this.ownerTag, riding ? 'ㅋㅋ 또 탔네' : near ? '…너지?' : pick(['…추로?', '…아닌가?', '착하다 우리 추로~']), 1100, 'think'); if (near) me.setFace('sweat'); });
    if (!this.aegyoGot) this.after(.85, () => { if (this.aegyoGot || this.result) return; this.aegyoGot = true; this.aegyo = 2; this.gotCard('애교', '주인이 쳐다볼 때 추로를 터치 · 한 밤에 두 번'); });
  }
  doAegyo() {
    const L = this.L, W = L.world, me = this.me, o = this.ow;
    if (!this.aegyoUsable()) return;
    this.aegyo--; L.log({ aegyo: this.aegyo, t: +this.t.toFixed(1) });
    me.setFace('happy'); me.bump(.4); this.sfx.meow(1.1, true); L.say(this.catTag, '야옹~♥', 1300);
    const s = this.scr(this.p.x, this.cy + .45, this.p.z);
    W.fx.burst(s.x, s.y, { n: 12, shape: 'heart', colors: ['#ff8fb8', '#ffb3d1', '#ff6fa6'], speed: 150, up: 140, size: 15, gravity: 50, life: 1.1 });
    o.s = 'melt'; o.t = 1.15; o.nextBusy = this.lv.busy[1] + 2.5; this.owner.setFace('happy');
    this.after(.35, () => { L.say(this.ownerTag, pick(['아이고 귀여워~', '으이구, 귀여워서 봐준다']), 1200); const q = this.scr(EYE.x, 1.3, EYE.z); W.fx.burst(q.x, q.y, { n: 8, shape: 'heart', colors: ['#ff8fb8', '#ffb3d1'], speed: 120, up: 100, size: 12, gravity: 40, life: 1 }); });
    this.after(.7, () => { if (!this.result) me.setFace('normal'); });
  }
  strike() {
    const L = this.L, W = L.world, me = this.me, o = this.ow;
    this.strikes++; this.immuneT = this.t + 2.2; this.caughtT = 0; this.swat = null; this.paw = null; this.stunT = .9; this.touch = null;
    o.s = 'glare'; o.t = 1.25; this.owner.setFace('angry'); this.owner.bump(.45); this.owner.pose = 'point';
    L.say(this.ownerTag, this.strikes >= MAX_STRIKES ? '추로야!!!' : pick(['추로야!!!', '추로야!!! 내려와!', '추로야!!! 또 너지!']), 1300, 'red');
    L.audio.sfx('angry'); this.sfx.meow(.8);
    me.setFace('wow'); me.bump(.55); L.say(this.catTag, '냥?!', 700);
    this.shake = .3; this.shakeA = .09;
    this.flash.classList.remove('on'); void this.flash.offsetWidth; this.flash.classList.add('on');
    const s = this.scr(this.p.x, this.cy + .3, this.p.z); W.fx.ring(s.x, s.y, { r: 90, color: '#ff5d6c', width: 9, life: .5 });
    this.pips.forEach((p, i) => p.classList.toggle('on', i < this.strikes));
    L.log({ strike: this.strikes, lv: this.lvIdx + 1, t: +this.t.toFixed(1), x: +this.p.x.toFixed(2), z: +this.p.z.toFixed(2), on: this.cs.name });
    this.after(.8, () => { if (!this.result) me.setFace('normal'); });
    if (this.strikes >= MAX_STRIKES) this.after(.6, () => this.fail('caught'));
    else if (!this.cs.floor) this.after(.35, () => this.scoldDown());
  }
  // scolded: 추로 hops straight down to the floor (the climb is lost)
  scoldDown() {
    if (this.result || this.jump || this.cs.floor) return;
    const Lk = this.link(this.cs, this.floor, this.p, { x: this.p.x + 1, z: this.p.z + 1 }); if (!Lk) return;
    this.route = null; this.startJump({ a: { x: this.p.x, z: this.p.z }, b: Lk.b, to: this.floor }); this.jump.t = 0;
    this.L.say(this.catTag, '냥…', 700);
  }
  wakeDog() {
    const L = this.L, dog = this.dog; this.dogAwake = true; this.zzz?.remove(); this.zzz = null;
    dog.setFace('wow'); dog.bump(.5); L.say(dog, '멍! 멍!', 1100, 'red'); this.sfx.bark(); this.dogZone.material.opacity = .5;
    this.ow.noiseAt = null; this.startHmm({ x: dog.root.position.x, z: dog.root.position.z }, true, '멍뭉아 왜 그래?');
    L.log({ dog: 'woke', t: +this.t.toFixed(1) });
    this.after(4.5, () => { if (this.dead || !this.dog) return; this.dogAwake = false; dog.setFace('happy'); this.zzz = L.say(dog, 'Zz…', 1e9, 'think'); this.dogZone.material.opacity = .25; });
  }

  // ── falling things
  stepItems(dt0) {
    for (const it of this.items) {
      if (it.gone) continue;
      // breakables go over in slow motion ("어어어…") until they hit — then everything is loud and fast again
      const dt = (it.state === 'teeter' || it.state === 'fall' && !it.hit) && it.K.pts >= 2 && it.type !== 'mouse' ? dt0 * .55 : dt0;
      if (it.state === 'rest') { it.bump *= Math.exp(-dt * 10); }
      else if (it.state === 'teeter') {
        it.tt += dt; const k = Math.min(1, it.tt / .32);
        it.angle = Math.sin(it.tt * 30) * .2 * (1 - k) + k * .4;
        if (k >= 1) {
          it.state = 'fall'; const v = 1.0 + .4 * it.s.h;
          it.vx = it.dir[0] * v; it.vz = it.dir[1] * v; it.vy = .7; it.spin = (6 + Math.random() * 4); it.nb = 0; it.dropFrom = it.y;
          if (it.type === 'mouse') { it.pivot = new THREE.Vector3(it.ex + it.dir[0] * .02, it.s.h + .01, it.ez + it.dir[1] * .02); it.rope = .46; }
        }
      } else if (it.state === 'fall') this.stepFall(it, dt);
      else if (it.state === 'roll') {
        const sp = Math.hypot(it.vx, it.vz); it.vx *= Math.exp(-dt * 1.6); it.vz *= Math.exp(-dt * 1.6); it.angle += sp * dt / Math.max(.05, it.r);
        const nx = it.x + it.vx * dt, nz = it.z + it.vz * dt;
        if (this.floorFree(nx, nz, it.r * .6) || it.y > .01) { it.x = nx; it.z = nz; } else { it.vx = -it.vx * .4; it.vz = -it.vz * .4; }
        if (sp < .05) it.state = 'down';
      } else if (it.state === 'hang') {
        // the mouse swings on its cable
        this.ropeStep(it, dt);
      }
      if (it.state === 'rest' || it.state === 'teeter' || it.state === 'fall' || it.state === 'roll' || it.state === 'hang') this.placeItem(it);
      else if (it.ring?.visible) it.ring.visible = false;
    }
  }
  ropeStep(it, dt) {
    it.vy -= GRAV * dt; it.vx *= Math.exp(-dt * .6); it.vz *= Math.exp(-dt * .6); it.vy *= Math.exp(-dt * .6);
    it.x += it.vx * dt; it.y += it.vy * dt; it.z += it.vz * dt;
    const P = it.pivot, dx = it.x - P.x, dy = it.y - P.y, dz = it.z - P.z, L = Math.hypot(dx, dy, dz);
    if (L > it.rope) {
      const nx = dx / L, ny = dy / L, nz = dz / L; it.x = P.x + nx * it.rope; it.y = P.y + ny * it.rope; it.z = P.z + nz * it.rope;
      const vn = it.vx * nx + it.vy * ny + it.vz * nz; if (vn > 0) { it.vx -= vn * nx; it.vy -= vn * ny; it.vz -= vn * nz; }
      return true;
    }
    return false;
  }
  stepFall(it, dt) {
    const K = it.K;
    it.angle += it.spin * dt;
    if (it.pivot) {   // the mouse: over the edge it goes — and stops dangling on its cable
      if (this.ropeStep(it, dt) && !it.hit) { it.hit = true; it.state = 'hang'; it.angle = Math.PI * .5; this.impact(it, it.x, it.z, it.y - .1); }
      return;
    }
    it.vy -= GRAV * dt;
    const nx = clamp(it.x + it.vx * dt, -RW / 2 + .12, RW / 2 - .12), nz = clamp(it.z + it.vz * dt, -RD / 2 + .12, RD / 2 - .12), ny = it.y + it.vy * dt;
    const ground = this.groundAt(nx, nz, it.y + .01);
    it.x = nx; it.z = nz;
    if (ny <= ground && it.vy < 0) {
      it.y = ground;
      if (!it.hit) { it.hit = true; this.impact(it, nx, nz, ground); if (it.gone) return; }
      else if (Math.abs(it.vy) > 1.2) this.sfx.crash(K.bouncy ? 'bounce' : 'soft', .5);
      it.nb++; it.vy = -it.vy * (K.bouncy ? .55 : .28); it.vx *= .55; it.vz *= .55; it.spin *= .45;
      if (Math.abs(it.vy) < .75 || it.nb >= (K.bouncy ? 4 : 2)) {
        it.vy = 0; it.spin = 0;
        if (K.lie) { it.angle = Math.PI / 2; it.y = ground + it.r * .9; it.state = 'down'; }
        else if (K.roll && ground < .01) { it.state = 'roll'; it.vx *= 1.4; it.vz *= 1.4; }
        else { it.angle = 0; it.state = 'down'; }
        this.placeItem(it);
      }
    } else it.y = ny;
  }
  impact(it, x, z, gy) {
    const L = this.L, W = L.world, K = it.K;
    const s = this.scr(x, gy + .15, z), big = K.pts >= 2, drop = Math.max(0, (it.dropFrom ?? it.s.h) - gy);
    this.sfx.crash(K.mat, .8 + Math.min(.4, drop * .3));
    if (K.mat !== 'soft') L.audio.sfx('land');
    L.ui.floatText(s.x, s.y - 26, K.word, big ? 'gold big' : 'gold');
    W.fx.burst(s.x, s.y, { n: big ? 18 : 10, colors: BURST[K.mat], speed: big ? 300 : 190, size: big ? 10 : 8, shape: K.mat === 'glass' || K.mat === 'ceramic' ? 'star' : 'dot', up: 120 });
    W.fx.ring(s.x, s.y, { r: big ? 70 : 46, color: '#ffffff', width: 5, life: .35 });
    if (big) { this.shake = .3; this.shakeA = .07; this.punch = .22; }
    if (K.mat === 'glass') this.shatter(it, x, z, gy);
    if (K.puddle && gy < .01) this.puddle(x + it.dir[0] * .1, z + it.dir[1] * .1, K.puddle, K.mat === 'glass' ? .2 : .24);
    if (K.soil) this.soil(x, z, gy);
    // the meter: points + a combo bonus for quick knocks in a row
    this.combo = this.t - this.lastHit < COMBO_T ? this.combo + 1 : 1; this.lastHit = this.t; this.lastHitPt = { x, z };
    const pts = K.pts + (this.combo >= 2 ? 1 : 0);
    this.score += pts; this.knocked++;
    this.after(.18, () => { const q = this.scr(x, gy + .15, z); L.ui.floatText(q.x + 30, q.y + 6, '+' + pts, 'green'); if (this.combo >= 2) { L.ui.floatText(q.x - 10, q.y - 64, `콤보 x${this.combo}!`, 'gold'); L.audio.sfx('star', this.combo); } });
    this.setMeter(true);
    if (!this.unlocked && this.score >= this.lv.need) this.after(.7, () => this.unlock());
    L.log({ knock: it.type, pts, combo: this.combo, score: this.score, t: +this.t.toFixed(1) });
    // did the owner see it come down? hear it?
    const S = this.sight(), catNear = Math.hypot(this.p.x - x, this.p.z - z) < 1.7;
    if (S.on && this.canSee(x, z, gy + .2) && catNear && this.t > this.immuneT) this.strike();
    else this.hear(K.loud * (1 + Math.min(.4, drop * .2)), { x, z }, K.mat === 'mouse' ? '어? 내 마우스…?' : K.loud > .7 ? pick(['뭐야?!', '방금 무슨 소리야?']) : '어? 무슨 소리지?');
    if (this.dog && !this.dogAwake && Math.hypot(x - this.dog.root.position.x, z - this.dog.root.position.z) < this.dogR + .7) this.after(.25, () => !this.result && !this.dogAwake && this.wakeDog());
  }
  shatter(it, x, z, gy) {
    it.gone = true; it.g.visible = false; it.shadow.visible = false; it.state = 'down';
    for (let i = 0; i < 10; i++) {
      const m = cone(.05 + Math.random() * .03, .09 + Math.random() * .05, i % 3 ? '#f2fbff' : '#9fdcff', { emissive: '#bfeaff', ei: .35 }, 3); m.castShadow = false;
      const a = Math.random() * Math.PI * 2, sp = .5 + Math.random() * 1.2;
      const o = this.addObj(m); o.position.set(x, gy + .05, z); o.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      this.debris.push({ o, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: 1 + Math.random() * 1.4, gy, spin: 8 });
    }
    this.L.world.idsDirty = true;
  }
  puddle(x, z, color, r) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, .012, z); m.renderOrder = 1; m.scale.setScalar(.01); this.addObj(m);
    this.tw.run(.6, k => m.scale.set(k, k * .8 + .2 * k, k), ease.outCubic);
  }
  soil(x, z, gy) {
    this.puddle(x, z, '#8a5a3a', .2);
    for (let i = 0; i < 6; i++) {
      const m = sph(.025 + Math.random() * .02, '#7a4a2e'); m.castShadow = false; const a = Math.random() * Math.PI * 2, sp = .4 + Math.random() * .8;
      const o = this.addObj(m); o.position.set(x, gy + .05, z);
      this.debris.push({ o, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: .8 + Math.random(), gy, spin: 0 });
    }
    this.L.world.idsDirty = true;
  }
  stepDebris(dt) {
    for (const d of this.debris) {
      if (d.done) continue;
      d.vy -= GRAV * dt; d.o.position.x += d.vx * dt; d.o.position.z += d.vz * dt; d.o.position.y += d.vy * dt; d.o.rotation.x += d.spin * dt;
      if (d.o.position.y <= d.gy + .03) { d.o.position.y = d.gy + .03; d.vy = -d.vy * .25; d.vx *= .5; d.vz *= .5; d.spin *= .5; if (Math.abs(d.vy) < .3) d.done = true; }
    }
  }
  unlock() {
    if (this.unlocked || this.result) return;
    const L = this.L; this.unlocked = true; this.setMeter(false);
    L.audio.sfx('unlock'); L.ui.toast('장난 게이지 가득! 이제 츄르 털러 가자', 'green');
    this.chuBadge.classList.add('open'); this.chuBadge.innerHTML = '<span>츄르 ♥</span>';
    const g = new THREE.Mesh(new THREE.RingGeometry(.22, .34, 32), new THREE.MeshBasicMaterial({ color: '#ff8fb8', transparent: true, opacity: .7, depthWrite: false }));
    g.rotation.x = -Math.PI / 2; g.position.set(this.drawer.spot.x, .03, this.drawer.spot.z); g.renderOrder = 3; this.chuGlow = this.addObj(g);
    L.say(this.catTag, '츄르 냄새…!', 1100);
    L.log({ unlock: true, t: +this.t.toFixed(1), score: this.score });
  }

  // ── ends
  fail(why) {
    if (this.result) return;
    const L = this.L, W = L.world, o = this.owner, me = this.me;
    this.result = 'fail'; this.endWhy = why; this.touch = null; this.swat = null; this.paw = null;
    L.log({ result: 'fail', lv: this.lvIdx + 1, why, knocked: this.score, items: this.knocked, strikes: this.strikes });
    this.ow.s = 'end'; this.aim.material.opacity = 0;
    if (why === 'caught') {
      const yaw = Math.atan2(this.p.x - EYE.x, this.p.z - EYE.z); this.ow.yaw = yaw; o.root.rotation.y = yaw; this.chair.rotation.y = yaw;
      this.tw.run(.35, k => { o.root.position.y = SEAT.y * (1 - k); });
      o.setFace('angry'); o.pose = 'cheer'; L.say(this.ownerTag, '추로야!!!', 1700, 'red'); L.audio.sfx('angry');
      this.jump = null;
      this.after(.3, () => { this.held = { k: 0, from: { x: this.p.x, y: this.cy, z: this.p.z } }; me.setFace('wow'); this.sfx.meow(1); L.say(this.catTag, '냐앙?!', 900); });
      this.after(1.2, () => me.setFace('sad'));
      this.camHold = true; W.flyTo(this.tw, { target: new THREE.Vector3(SEAT.x + .25, .75, SEAT.z + .45), zoom: 1.6, dur: .6 });
    } else {
      o.pose = 'stretch'; o.setFace('happy'); L.say(this.ownerTag, '다 했다~ 이제 자야지', 1700); me.setFace('sad'); L.audio.sfx('lose');
      this.tw.run(1.2, k => W.setLight({ ambColor: '#8f95dc', amb: 1.1 - .45 * k, sunColor: '#dfe4ff', sun: 1.02 - .5 * k }));
    }
    setTimeout(() => this.failPanel(), 1800);
  }
  winSeq() {
    if (this.result) return;
    const L = this.L, W = L.world, me = this.me, Dr = this.drawer;
    this.result = 'win'; this.touch = null; this.swat = null; this.paw = null; this.aim.material.opacity = 0;
    const stars = [true, this.knocked >= this.items.length, this.strikes === 0];
    this.stars = stars;
    L.log({ result: 'win', lv: this.lvIdx + 1, knocked: this.score, items: this.knocked, strikes: this.strikes, stars: stars.filter(Boolean).length, time: +this.timeLeft.toFixed(1) });
    Dr.prog = 1; L.audio.sfx('unlock'); this.ow.s = 'end';
    // a 츄르 pops out of the drawer and lands in front of 추로
    const ch = this.churru = this.addObj(makeChurru()); ch.scale.setScalar(1.7); W.idsDirty = true;
    this.face = Math.PI / 4;
    const a = Dr.anchor.clone(), b = new THREE.Vector3(this.p.x + .21, this.cy + .005, this.p.z + .21);
    this.tw.run(.55, k => { ch.position.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + Math.sin(k * Math.PI) * .45, a.z + (b.z - a.z) * k); ch.rotation.set(0, this.face + k * 6, k < 1 ? k * 4 : 0); }, ease.linear);
    this.after(.6, () => { ch.rotation.set(0, Math.PI / 4 + Math.PI / 2, 0); me.pose = 'lick'; me.setFace('happy'); L.say(this.catTag, '냠냠냠…', 1900); this.eating = this.t; L.audio.sfx('giggle'); });
    this.after(1.1, () => { const y = Math.atan2(this.p.x - EYE.x, this.p.z - EYE.z); this.tw.run(.4, k => { this.ow.yaw += wrap(y - this.ow.yaw) * k; this.owner.root.rotation.y = this.ow.yaw; this.chair.rotation.y = this.ow.yaw; }); this.owner.setFace('happy'); this.owner.pose = 'idle'; L.say(this.ownerTag, '어휴 추로야~ 맛있어?', 1600); });
    this.after(1.3, () => { L.audio.sfx('win'); W.fx.confetti(90); });
    // frame 추로 and the owner's reaction together
    const mid = new THREE.Vector3(this.p.x * .55 + EYE.x * .45, this.cy * .6 + .55, this.p.z * .55 + EYE.z * .45), far = Math.hypot(this.p.x - EYE.x, this.p.z - EYE.z);
    this.camHold = true; W.flyTo(this.tw, { target: mid, zoom: clamp(1.75 - far * .2, 1.12, 1.55), dur: .7 });
    setTimeout(() => this.winPanel(), 2900);
  }
  stepEnd(dt) {
    const me = this.me;
    if (this.held) {   // up in the owner's arms, dangling
      const H = this.held; H.k = Math.min(1, H.k + dt / .45);
      const o = this.owner.root.position, y = this.ow.yaw, tx = o.x + Math.sin(y) * .42, tz = o.z + Math.cos(y) * .42, ty = .62;
      const k = ease.outCubic(H.k);
      this.p.x = H.from.x + (tx - H.from.x) * k; this.p.z = H.from.z + (tz - H.from.z) * k; this.cy = H.from.y + (ty - H.from.y) * k + Math.sin(k * Math.PI) * .2;
      me.root.position.set(this.p.x, this.cy, this.p.z); me.root.rotation.y = y + Math.PI; me.root.rotation.z = Math.sin(this.t * 3) * .12 * k;
      me.shadow.visible = false; this.ring.visible = false; me.squash = -.12;
    }
    if (this.eating != null) {
      const k = this.t - this.eating; me.squash = Math.sin(k * 14) * .06;
      if (this.churru) this.churru.scale.setScalar(1.7 * Math.max(.25, 1 - k * .28));
      if ((this._ht = (this._ht || 0) - dt) <= 0 && k < 2.2) { this._ht = .32; const s = this.scr(this.p.x, this.cy + .6, this.p.z); this.L.world.fx.burst(s.x, s.y, { n: 3, shape: 'heart', colors: ['#ff8fb8', '#ff6fa6'], speed: 80, up: 120, size: 13, gravity: 30, life: 1 }); }
    }
  }
  winPanel() {
    if (this.dead) return;
    const L = this.L, h = L.h, last = this.lvIdx >= LEVELS.length - 1, st = this.stars, n = st.filter(Boolean).length;
    const row = (ok, t) => h('div', { class: ok ? 'ok' : '' }, h('span', { html: ICON.star }), t);
    L.ui.panel({ title: '츄르 냠냠!', color: 'green', body: [
      h('div', { class: 'stars' }, ...[0, 1, 2].map(k => h('div', { class: 'st' + (k < n ? ' on' : ''), html: k < n ? ICON.star : ICON.starGray }))),
      h('div', { class: 'cr-goals' }, row(true, '츄르 털기'), row(st[1], `물건 전부 툭 (${this.knocked}/${this.items.length})`), row(st[2], '한 번도 안 들킴')),
      h('div', { class: 'txt cr-txt' }, n === 3 ? '완전 범죄냥!' : n === 2 ? '거의 완벽했어!' : '츄르는 먹었다! 다음엔 더 몰래…')],
      buttons: [L.ui.btn('다시', { color: 'gray', cls: 'sm', onClick: () => L.go({ lv: this.lvIdx }) }),
        this.nextBtn = L.ui.btn(last ? '처음 밤부터' : '다음 밤', { color: 'green', cls: 'big', onClick: () => L.go({ lv: last ? 0 : this.lvIdx + 1 }) })] });
  }
  failPanel() {
    if (this.dead) return;
    const L = this.L, h = L.h, caught = this.endWhy === 'caught';
    L.ui.panel({ title: caught ? '추로야!!!' : '시간 끝!', color: caught ? 'red' : 'purple', body: [
      h('div', { class: 'cr-endface' }, h('img', { src: L.thumbs[caught ? 'face_mong_angry' : 'face_mong_happy'] }), h('img', { src: L.thumbs[`face_${CAT}_wow`] })),
      h('div', { class: 'txt cr-txt' }, caught ? '"또 너지? 이리 와!"' : '"다 했다~ 이제 자자"', h('br'), caught ? '번쩍 들려 버렸다…' : '츄르는 내일…'),
      h('div', { class: 'cr-sub' }, caught ? '"흠…?" 하면 손 떼고 얼음! 가만히 있으면 안 들켜' : `장난 게이지 ${this.score}/${this.lv.need} · 깨지는 물건은 2칸`)],
      buttons: [this.againBtn = L.ui.btn('다시 하기', { color: 'orange', cls: 'big', onClick: () => L.go({ lv: this.lvIdx }) })] });
  }

  // ── HUD each frame
  updateHud() {
    const o = this.ow, W = this.L.world;
    if (this.clockTx) { const tx = fmt(this.timeLeft); if (this.clockTx.textContent !== tx) this.clockTx.textContent = tx; this.clockEl.classList.toggle('low', this.timeLeft < 15 && !this.result); }
    const alert = DANGER.has(o.s) || o.noiseAt != null;
    this.ownerEl.classList.toggle('alert', alert && !this.result); this.ownerEl.classList.toggle('melt', o.s === 'melt');
    const want = o.s === 'glare' ? 'face_mong_angry' : o.s === 'melt' ? 'face_mong_happy' : 'face_mong_normal';
    if (this._oImg !== want && this.L.thumbs[want]) { this._oImg = want; this.ownerImg.src = this.L.thumbs[want]; }
    // the vignette: red while it's looking and 추로 is in the open, moving
    const seenNow = this.started && !this.result && this.sight().on && this.canSee(this.p.x, this.p.z, this.catPH());
    this.vig.style.opacity = this.result ? '0' : o.s === 'hmm' ? '.35' : seenNow && this.isActive() ? '.8' : seenNow ? '.25' : '0';
    // the ring under 추로: mint = hidden from the look (coming or now), orange = in plain sight
    const watchYaw = o.s === 'hmm' ? o.look : SEEING.has(o.s) ? o.yaw : null, m = this.ring.material;
    if (watchYaw == null || this.result) { m.color.set('#ffffff'); m.opacity = .35; this.ring.scale.setScalar(1); }
    else { const exp = this.canSee(this.p.x, this.p.z, this.cy + .3, watchYaw); m.color.set(exp ? '#ff9a3c' : '#7dffc4'); m.opacity = .55 + Math.sin(this.t * 14) * .2; this.ring.scale.setScalar(exp ? 1.15 + Math.sin(this.t * 14) * .08 : 1); }
    // hint
    if (this.hintTx && this.started) {
      const [tx, warn] = this.result ? ['', false] : this.hintText();
      if (this.hintTx.textContent !== tx) this.hintTx.textContent = tx;
      this.hint.classList.toggle('warn', !!warn); this.hint.classList.toggle('first', !this.everPressed); this.hint.style.opacity = tx ? '1' : '0';
    } else if (this.hint) this.hint.style.opacity = '0';
    // world badges
    const V = new THREE.Vector3();
    const da = this.drawer.anchor, ds = W.toScreen(V.set(da.x, da.y + .62, da.z)); this.chuBadge.style.left = ds.x + 'px'; this.chuBadge.style.top = ds.y + 'px'; this.chuBadge.style.display = this.result ? 'none' : '';
    const ag = this.aegyoUsable(); this.aegyoBadge.classList.toggle('on', ag);
    if (ag) { const s = W.toScreen(V.set(this.p.x, this.cy - .02, this.p.z)); this.aegyoBadge.style.left = s.x + 'px'; this.aegyoBadge.style.top = s.y + 'px'; }
    if (this.rideBadge && this.vac) { const s = W.toScreen(V.set(this.vac.x, .42, this.vac.z)); this.rideBadge.style.left = s.x + 'px'; this.rideBadge.style.top = s.y + 'px'; }
  }
  hintText() {
    const o = this.ow.s;
    if (this.stunT > 0) return ['들켰다! 잠깐 얼음…', true];
    if (o === 'hmm' || this.ow.noiseAt != null) return ['흠…? 손 떼면 얼음!', true];
    if (o === 'turn' || o === 'look' || o === 'glare') return [this.aegyoUsable() ? '얼음! · 추로를 터치하면 애교' : this.isActive() ? '보고 있어! 손 떼!' : '얼음… 세상 순한 척', true];
    if (o === 'melt') return ['애교 성공! 주인이 녹았다', false];
    if (this.swat) return ['콕… 콕… 툭!', false];
    if (this.paw) return [this.unlocked ? '드르륵… 조금만 더!' : '아직 잠겨 있다냥…', false];
    if (this.vac && this.cs === this.vac.surf) return ['청소기 타는 중~ 움직여도 안 들켜', false];
    if (this.unlocked) return ['츄르 서랍장을 꾹 누르고 있기!', false];
    if (!this.everPressed) return ['물건을 꾹 누르고 있으면 가서 툭!', false];
    if (this.walking || this.jump) return ['살금살금…', false];
    return [this.knocked ? '다음 물건을 꾹!' : '물건을 꾹 누르고 있기', false];
  }

  exit() {
    this.dead = true; const W = this.L.world, app = document.getElementById('app');
    app.dataset.night = '';
    app.removeEventListener('pointerdown', this._down); removeEventListener('pointermove', this._move); removeEventListener('pointerup', this._up); removeEventListener('pointercancel', this._up); removeEventListener('blur', this._blur);
    for (const o of [this.map?.group, ...this.objs].filter(Boolean)) { W.root.remove(o); disposeTree(o); }
    for (const b of this.badges || []) b.remove();
    for (const c of this.cards || []) c.remove();
    this.zzz?.remove(); this.vig?.remove(); this.flash?.remove(); this.vtex?.dispose();
    this.cssLink?.remove();
    W.camLock = false; W.setLight(null);
  }

  // ── bots (QA) press the screen the way a finger does, through the same handlers.
  //   smart: presses the nearest thing (or the drawer once it's open), lets go a beat after "흠…?" / a crash it heard,
  //          and uses 애교 when it's stared at. random: random presses and let-gos anywhere.
  botPress(x, y, key) { this._bKey = key; this._down({ button: 0, pointerId: 77, clientX: x, clientY: y }); }
  botRelease() { if (this.touch?.id === 77) this._up({ pointerId: 77 }); this._bKey = null; }
  botStep(dt, mode) {
    if (this.result) { this.botRelease(); this._endT = (this._endT || 0) + dt; if (this._endT > 1.6 && this.L.ui.panelOpen) { this._endT = 0; (this.result === 'win' ? this.nextBtn : this.againBtn)?.press(); } return; }
    if (!this.started) return;
    if (mode === 'random') {
      this._rt = (this._rt ?? .4) - dt;
      if (this._rt <= 0) {
        this._rt = .3 + Math.random() * 1.4; this.botRelease();
        if (Math.random() > .3) { const W = this.L.world; this.botPress(W.W * (.08 + Math.random() * .84), W.H * (.25 + Math.random() * .55), 'r'); }
      }
      return;
    }
    const o = this.ow, danger = DANGER.has(o.s) || o.noiseAt != null || o.s === 'melt' && false;
    if (danger !== this._bD) { this._bD = danger; this._bDT = this.t; }
    if (danger) {
      if (o.s === 'look' && this.aegyo > 0 && !this.isActive() && o.t > .5 && this.t - this._bDT > .5 && this.canSee(this.p.x, this.p.z, this.catPH())) {
        const s = this.scr(this.p.x, this.cy + .3, this.p.z); this.botRelease(); this._down({ button: 0, pointerId: 78, clientX: s.x, clientY: s.y }); this._up({ pointerId: 78 }); return;
      }
      if (this.t - this._bDT > .2) this.botRelease();
      return;
    }
    if (this.stunT > 0) { this.botRelease(); return; }
    let key, sp;
    if (this.unlocked) { key = 'drawer'; const a = this.drawer.anchor; sp = this.scr(a.x, a.y, a.z); }
    else {
      let it = this.items.find(i => 'i' + i.idx === this._bWant && i.state === 'rest');
      if (!it) {
        const live = this.items.filter(i => i.state === 'rest'); if (!live.length) return;
        const c = i => Math.hypot(i.spot.x - this.p.x, i.spot.z - this.p.z) + Math.abs(i.s.h - this.cy) * .8 - i.prog;
        it = live.sort((a, b) => c(a) - c(b))[0]; this._bWant = 'i' + it.idx;
      }
      key = 'i' + it.idx; sp = this.scr(it.x, it.y + it.hh, it.z);
    }
    if (this._bKey !== key || !this.touch) { this.botRelease(); this.botPress(sp.x, sp.y, key); }
  }
  state() {
    return { scene: 'churro', lv: this.lvIdx + 1, result: this.result || null, knocked: this.score ?? 0, need: this.lv?.need, items: this.knocked ?? 0, strikes: this.strikes ?? 0, time: +(this.timeLeft ?? 0).toFixed(1),
      owner: this.ow?.s, on: this.cs?.name, x: +(this.p?.x ?? 0).toFixed(2), z: +(this.p?.z ?? 0).toFixed(2), aegyo: this.aegyo, unlocked: !!this.unlocked };
  }
  get api() {
    return {
      win: () => { this.unlocked = true; this.winSeq(); }, fail: w => this.fail(w || 'caught'), look: () => this.startHmm(null, true),
      fill: () => { this.score = this.lv.need; this.setMeter(true); this.unlock(); },
      tip: i => { const it = this.items[i | 0]; if (it?.state === 'rest') { it.prog = 1; it.state = 'teeter'; it.tt = 0; } },
      put: (name, x, z) => { const s = name === 'floor' ? this.floor : this.surf(name); if (!s) return null; this.cs = s; const c = s.floor ? { x, z } : clampRect(s.walk, x ?? (s.walk.x0 + s.walk.x1) / 2, z ?? (s.walk.z0 + s.walk.z1) / 2); this.p.x = c.x; this.p.z = c.z; this.cy = s.h; this.route = null; return this.state(); },
      surfs: () => this.surfs.map(s => ({ name: s.name, h: s.h, walk: s.walk && Object.fromEntries(Object.entries(s.walk).map(([k, v]) => [k, +v.toFixed(2)])), cands: s.cands?.length })),
      items: () => this.items.map(i => ({ type: i.type, on: i.s.name, state: i.state, dir: i.dir, spot: { x: +i.spot.x.toFixed(2), z: +i.spot.z.toFixed(2) } })),
      planTo: (name, x, z) => { const s = name === 'floor' ? this.floor : this.surf(name); const r = this.plan({ s, x, z }); return r && r.steps.map(st => st.to.name); },
    };
  }
}

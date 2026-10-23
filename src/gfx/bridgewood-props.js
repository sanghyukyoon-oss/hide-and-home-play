// 58판 흔들다리 숲 — bridgewood (10/23, 스토리 룸 표: 졸졸이 텐트(52와 같음) → 새 맵. 흑백 · 졸졸이, "그 까만 애? 밤마다 혼자 지나가…"
// "…혼자."). 숲 섬이 골짜기로 갈라져 두 언덕이 되고, 그 사이를 출렁이는 흔들다리가 이어 줌. 왼쪽 언덕엔 큰 고목과 나무 위 쉼터(작은
// 승강기 바구니), 오른쪽 언덕엔 숲길·이정표·오르골 그루터기·버섯 고리. 흑백 판이라 회색에서도 모양이 읽히게 — 밝은 길·짙은 침엽수·
// 굵은 실루엣, 결(나무껍질·널판·돌)로 면을 나눔.
//   bw_land       두 언덕 받침(골짜기 쪽 절벽 면이 보임) + 골짜기 바닥 개울 + 숲길 — 바닥 노릇(layout.hideFloor)
//   bw_bridge     흔들다리: 널판·밧줄 난간·양 끝 기둥(부품 0: 다리가 출렁 — 건너는 연출용, 끝까지 움직이면 제자리)
//   bw_bigtree    큰 고목 + 나무 위 쉼터 + 도르래 바구니(부품 0: 바구니가 줄 타고 내려옴 — 작은 승강기 장치 20)
//   bw_musicstump 오르골 그루터기(부품 0: 뚜껑이 열리고 인형이 빙글 — 오르골 장치 30)
//   bw_signpost   숲길 이정표(부품 0: 화살표 판이 빙글 돌아 뒷면 — 뒤집는 판 17)
//   bw_lamppost   숲길 등불 기둥(밤 그림자 장치 28 자리) · bw_logtunnel 쓰러진 통나무 굴 · bw_ferns 고사리 덤불
import * as THREE from 'three';
import { mat, mesh } from './kit.js';
import { G, mc, mt, TX, PI, HP, island, blobOutline, tuft, flower, bush, fern, pine } from './pc-kit.js';
import { EN } from '../i18n-en-dict.js';

const WORDS = { '흔들다리 숲': 'Swaying Bridge Woods', '흔들다리': 'Rope bridge', '다리 널판 밑': 'Under the bridge planks', '다리 기둥 옆': 'By the bridge post',
  '고목 구멍 안': 'Inside the old tree hollow', '고목 뿌리 사이': 'Between the old roots', '나무 위 쉼터': 'Up in the tree perch', '바구니 안': 'In the basket', '도르래 바구니': 'Pulley basket',
  '오르골 안': 'Inside the music box', '그루터기 옆': 'Beside the stump', '오르골 뚜껑': 'Music box lid', '이정표 뒤': 'Behind the signpost', '화살표 판': 'Arrow sign',
  '등불 기둥 밑': 'At the foot of the lamp post', '통나무 굴 안': 'Inside the log tunnel', '통나무 위': 'On the log', '고사리 덤불 속': 'In the ferns', '골짜기 돌 위': 'On the ravine stone' };
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

const B = {};
// grey-friendly palette: a pale path, mid greens, dark pines, warm-grey stone — values far apart
const P = { grass: '#a9d58a', lip: '#94c878', earth: '#9c7458', earthD: '#6f5240', band: '#c4bcc8', stone: '#d4cfd8', stone2: '#a8a1b4', moss: '#8fcf6a',
  path: '#efdcbc', water: '#8fd2ea', bark: '#8a5e40', barkD: '#5e3f2c', wood: '#e8b47a', woodD: '#9a6238', rope: '#f2d8a2', pine: '#3d8a56', pine2: '#2c7048',
  leaf: '#6cbf5a', leaf2: '#4f9f4c', red: '#ff6b5a', cream: '#fff4e2', navy: '#4a5a8a', yellow: '#ffd23f' };

// the room is 8 × 7 (x -4..4, z -3.5..3.5); the ravine runs from the back (x .2) to the front (x 1.0), 1.5 m across
export const BW = { a: [.2, -4.6], b: [1.0, 4.6], half: .95, gap: [-.62, .12] };
const lineX = z => BW.a[0] + (BW.b[0] - BW.a[0]) * (z - BW.a[1]) / (BW.b[1] - BW.a[1]);
// a polygon clipped to one side of the ravine (side -1: left, +1: right), its cut edge given a little wobble
function lobe(pts, side) {
  const inside = ([x, z]) => side * (x - lineX(z)) >= BW.half, cut = (p, q) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2, r = [p[0] + (q[0] - p[0]) * m, p[1] + (q[1] - p[1]) * m]; if (inside(r) === inside(p)) lo = m; else hi = m; } return [p[0] + (q[0] - p[0]) * lo, p[1] + (q[1] - p[1]) * lo]; };
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length], ip = inside(p), iq = inside(q);
    if (ip) out.push(p);
    if (ip !== iq) {
      const c = cut(p, q); out.push(c);
      if (ip && !iq) {
        // walk along the cut to where the polygon comes back in (the next crossing): add wobbly points down the ravine edge
        let j = (i + 1) % pts.length; while (inside(pts[j]) === false) j = (j + 1) % pts.length;
        const c2 = cut(pts[(j - 1 + pts.length) % pts.length], pts[j]), n = 14;
        for (let k = 1; k < n; k++) { const t = k / n, z = c[1] + (c2[1] - c[1]) * t, w = Math.sin(z * 2.3 + side) * .1 + Math.sin(z * 5.1) * .05; out.push([lineX(z) + side * (BW.half + w), z]); }
      }
    }
  }
  return out;
}
const OUT = blobOutline(4, 3.5, { pad: .7, round: 1.8, amp: .24, seed: 58, bulge: [[-2.9, .3, .5], [.9, .25, .5]] });
const LEFT = lobe(OUT, -1), RIGHT = lobe(OUT, 1);

B.bw_land = f => {
  const sides = [{ h: .22, color: P.earth, k: 0 }, { h: .34, color: P.band, k: -.03, stones: true }, { h: .3, color: P.earthD, k: -.12 }];
  const decor = side => ({ add }) => {
    if (side < 0) {
      bush(add, -4.4, .2, .9); fern(add, -4.3, 1.8, 1.1); pine(add, -4.5, -2.4, 1.25, P.pine, P.pine2); pine(add, -3.6, -4.1, 1.05, P.pine2, P.pine); pine(add, -1.9, 4.05, .9, P.pine, P.pine2);
      pine(add, -4.6, -.9, 1.4, P.pine2, P.pine); pine(add, -2.3, -4.2, 1.35, P.pine, P.pine2); pine(add, -1.0, -4.15, 1.0, P.pine2, P.pine); pine(add, -4.55, 3.0, 1.1, P.pine, P.pine2); bush(add, -3.0, 4.1, .8);
      for (const [x, z] of [[-3.5, 1.2], [-1.0, 2.7], [-2.2, -.6], [-.7, -2.8]]) tuft(add, x, z, 1);
      for (const [x, z, c] of [[-3.0, 2.6, '#ffffff'], [-1.4, 1.2, '#ffd23f'], [-3.6, -1.1, '#ffffff']]) flower(add, x, z, c);
    } else {
      pine(add, 4.5, -1.6, 1.3, P.pine2, P.pine); pine(add, 3.4, -4.1, 1.1, P.pine, P.pine2); pine(add, 2.0, -4.2, 1.35, P.pine2, P.pine); pine(add, 4.6, -3.2, 1.0, P.pine, P.pine2); pine(add, 4.55, .4, 1.15, P.pine2, P.pine); bush(add, 4.45, 1.6, 1); fern(add, 3.6, 4.0, 1); pine(add, 4.3, 3.4, .9, P.pine, P.pine2);
      for (const [x, z] of [[3.6, -.6], [2.3, 2.9], [3.2, 2.0]]) tuft(add, x, z, 1);
      for (const [x, z, c] of [[3.5, .9, '#ffffff'], [2.0, -2.2, '#b9a6ff']]) flower(add, x, z, c);
    }
  };
  // the forest path on each side (pale earth: it reads as the lightest grey), meeting the bridge
  const paths = side => ({ add }) => {
    const L = side < 0 ? [[-3.3, 2.9, .6, .45, .5], [-2.6, 1.9, .55, .42, .7], [-1.75, 1.0, .5, .4, .8], [-.85, .35, .5, .42, .5]]
      : [[2.65, .15, .5, .42, .3], [3.25, -.75, .5, .4, .9], [3.35, -1.85, .5, .42, .2], [2.8, -2.8, .55, .45, .6]];
    for (const [x, z, sx, sz, ry] of L) add(G.cyl(1, 1, .012, 18), P.path, x, .006, z, 0, ry, 0, [sx, 1, sz], { w: 1.2 });
  };
  island(f, { key: 'bw-left', pts: LEFT, top: P.grass, lip: P.lip, layers: sides, seed: 58, tuft: '#5faa52', pebble: P.stone, decor: decor(-1), decorTex: paths(-1) });
  island(f, { key: 'bw-right', pts: RIGHT, top: P.grass, lip: P.lip, layers: sides, seed: 59, tuft: '#5faa52', pebble: P.stone, decor: decor(1), decorTex: paths(1) });
  // the ravine's floor deep down: a stream between boulders, ferns on the ledges
  f.add(mt('bw-ravine-floor', TX.stone(), ({ add }) => {
    for (let k = 0; k < 18; k++) { const z = -4.2 + k * .5, x = lineX(z) + Math.sin(k * 1.9) * .35, s = .16 + (k % 3) * .06; add(G.rock(k + 60, .22, 10, 7), k % 2 ? P.stone : P.stone2, x, -.82, z, 0, k, 0, [s * 1.5, s, s * 1.2], { w: .4 }); }
    add(G.box(1.6, .1, 9.2, .04), P.earthD, (BW.a[0] + BW.b[0]) / 2, -.94, 0, 0, Math.atan2(BW.b[0] - BW.a[0], BW.b[1] - BW.a[1]), 0, 1, { w: .6 });
  }));
  f.add(mt('bw-ravine-water', TX.water(), ({ add }) => add(G.box(.55, .02, 9.0, .01), P.water, (BW.a[0] + BW.b[0]) / 2, -.86, 0, 0, Math.atan2(BW.b[0] - BW.a[0], BW.b[1] - BW.a[1]), 0, 1, { w: .7 })));
  f.add(mc('bw-ravine-ferns', ({ add }) => { for (const [z, s] of [[-2.6, -1], [-.9, 1], [1.6, -1], [2.9, 1]]) fern(add, lineX(z) + s * .55, z, .8, '#4f9f4c', '#6cbf5a', -.42); }));
  // nobody walks into the ravine: an invisible body along it (the bridge's deck is the gap in it)
  const segs = [];
  for (let z = -3.5; z < 3.5; z += .25) { const x = lineX(z + .125); if (z + .25 > BW.gap[0] && z < BW.gap[1]) continue; segs.push([x - BW.half + .05, 0, z, x + BW.half - .05, .6, z + .25]); }
  f.walkSolids = segs; f.noSolid = false;
};

B.bw_bridge = f => {
  // a 2.6 m rope bridge: planks hung on two ropes, rope hand rails with uprights, two log posts at each end
  const L = 3.0, N = 15, deck = new THREE.Group(); f.add(deck);
  deck.add(mt('bw-planks', TX.plank(), ({ add }) => {
    for (let k = 0; k < N; k++) { const x = -L / 2 + (k + .5) * L / N, sag = -.12 * (1 - Math.pow(2 * x / L, 2)); add(G.box(L / N - .07, .045, .84, .01), k % 3 ? P.wood : '#dca46a', x, .04 + sag, 0, 0, (k % 2 - .5) * .04, 0, 1, { w: .4 }); }
  }));
  deck.add(mc('bw-deck-under', ({ add }) => { for (let k = 0; k <= 12; k++) { const x = -L / 2 + k * L / 12, sag = -.12 * (1 - Math.pow(2 * x / L, 2)); add(G.box(.05, .03, .9, .006), '#6f4a30', x, .0 + sag, 0); } }));
  deck.add(mc('bw-ropes', ({ add, tube }) => {
    const pts = (y0, z, sagK) => { const out = []; for (let k = 0; k <= 12; k++) { const x = -L / 2 + k * L / 12; out.push([x, y0 - sagK * (1 - Math.pow(2 * x / L, 2)), z]); } return out; };
    for (const z of [-.44, .44]) {
      const lo = pts(.04, z, .12), hi = pts(.62, z, .08);
      for (let k = 0; k < 12; k++) { tube(lo[k], lo[k + 1], .022, P.rope, 6); tube(hi[k], hi[k + 1], .034, P.rope, 6); }
      // (검토 10/23 '흔들다리로 읽히게'): uprights at every step and a criss-cross rope net between the hand rope and the deck rope
      for (let k = 1; k < 12; k++) tube(lo[k], hi[k], .012, P.rope, 4);
      for (let k = 0; k < 12; k++) { tube(lo[k], hi[k + 1], .007, '#e8c88a', 3); tube(hi[k], lo[k + 1], .007, '#e8c88a', 3); }
      for (const p of hi) add(G.sph(.04, 6, 4), '#c9a46a', ...p);
    }
  }));
  f.add(mt('bw-posts', TX.bark(), ({ add }) => { for (const x of [-L / 2 - .1, L / 2 + .1]) for (const z of [-.46, .46]) add(G.cyl(.07, .08, .9, 9), P.bark, x, .45, z, 0, 0, 0, 1, [1, 1]); }));
  f.add(mc('bw-post-caps', ({ add }) => { for (const x of [-L / 2 - .1, L / 2 + .1]) for (const z of [-.46, .46]) { add(G.sph(.08, 8, 6), P.barkD, x, .92, z); add(G.tor(.08, .016, PI * 2, 4, 12), P.rope, x, .62, z, HP); } }));
  // a sway: the deck rocks side to side and settles (t 0 → 1 and back to rest)
  const p = f.part('lift', deck, t => { deck.rotation.x = Math.sin(t * PI * 3) * .09 * (1 - t); deck.position.y = -Math.sin(t * PI) * .04; }, { label: '흔들다리', sfx: 'creak', dur: 1.2 });
  f.spot('under', null, .9, -.1, .38, { maxH: .12, label: '다리 널판 밑', scale: .5 });
  f.spot('on', null, -L / 2 - .3, 0, .5, { maxH: .4, label: '다리 기둥 옆', scale: .7 });
  f.walkSolids = [[-L / 2 - .2, 0, -.52, L / 2 + .2, .9, -.42], [-L / 2 - .2, 0, .42, L / 2 + .2, .9, .52]];
};

B.bw_bigtree = f => {
  // an old wide tree with a perch (a round platform on the trunk, a little rail), a pulley arm and the basket on its rope
  f.add(mt('bw-tree-bark', TX.bark(), ({ add, tube }) => {
    add(G.cyl(.36, .5, 2.4, 14), P.bark, 0, 1.2, 0, 0, 0, 0, 1, [1, 1]);
    for (let k = 0; k < 6; k++) { const a = k * 1.05 + .2; tube([Math.cos(a) * .3, .4, Math.sin(a) * .3], [Math.cos(a) * .78, .03, Math.sin(a) * .78], .13, P.bark, 7, .05); }
    tube([.2, 2.1, .1], [1.0, 2.55, .2], .12, P.bark, 7, .07); tube([-.2, 2.2, -.1], [-.85, 2.75, -.25], .12, P.bark, 7, .08);
  }));
  f.add(mt('bw-tree-leaf', TX.leaf(), ({ add }) => {
    for (const [x, y, z, r, c] of [[0, 3.05, 0, .95, P.leaf2], [.75, 2.8, .2, .65, P.leaf], [-.75, 2.95, -.2, .7, P.leaf], [.1, 3.6, -.1, .6, P.leaf2], [-.2, 2.7, .65, .55, '#7fcf6a']]) add(G.sph(r, 16, 12), c, x, y, z, 0, 0, 0, [1, .8, 1], { w: .7 });
  }));
  f.add(mt('bw-perch', TX.plank(), ({ add }) => {
    add(G.cyl(.85, .85, .07, 20), P.wood, .15, 1.55, .25, 0, 0, 0, 1, { w: .5 });
  }));
  f.add(mc('bw-tree-bits', ({ add, tube }) => {
    // perch rail, its braces, a tiny lantern and a blanket roll up there
    for (let k = 0; k < 9; k++) { const a = -.9 + k * .32, x = .15 + Math.cos(a) * .8, z = .25 + Math.sin(a) * .8; add(G.cyl(.022, .022, .36, 6), P.woodD, x, 1.76, z); }
    for (let k = 0; k < 8; k++) { const a0 = -.9 + k * .32, a1 = a0 + .32; tube([.15 + Math.cos(a0) * .8, 1.94, .25 + Math.sin(a0) * .8], [.15 + Math.cos(a1) * .8, 1.94, .25 + Math.sin(a1) * .8], .02, P.wood, 5); }
    for (const a of [.3, 1.8]) tube([Math.cos(a) * .4, 1.0, Math.sin(a) * .4], [.15 + Math.cos(a) * .72, 1.52, .25 + Math.sin(a) * .72], .035, P.woodD, 6);
    add(G.cap(.1, .3, 2, 8), '#7f9cff', -.25, 1.66, .55, 0, .3, HP); add(G.cyl(.05, .06, .14, 8), '#fff2b8', .55, 1.66, .7);
    // the pulley arm over the front edge and its wheel
    tube([.6, 1.6, .5], [1.05, 2.25, .75], .04, P.woodD, 6); add(G.tor(.08, .02, PI * 2, 5, 14), '#7a7f96', 1.05, 2.18, .75); add(G.cyl(.03, .03, .05, 8), '#4a4f66', 1.05, 2.18, .75, HP, 0, 0);
    // the hollow at the foot, roots' moss, a little door painted on it (졸졸이's sign "ㅈㅈ")
    add(G.cyl(.17, .17, .04, 14), '#3d2a20', 0, .5, .44, HP, 0, 0, [1, 1, 1.3]);
    add(G.sph(.2, 10, 6), P.moss, .45, .12, -.5, 0, 0, 0, [1.4, .35, 1]); add(G.sph(.16, 10, 6), P.moss, -.6, .1, .35, 0, 0, 0, [1.3, .35, 1]);
  }));
  // the basket: comes down its rope from the pulley (t 0: up at the perch, 1: on the ground)
  // (②b 10/23: the basket was 25×33 px at the start view — half as big again, the thing in it sits up at the rim, half showing)
  const bk = new THREE.Group(); bk.position.set(1.05, 1.65, .75); bk.scale.setScalar(1.5); f.add(bk);
  bk.add(mt('bw-basket', TX.cloth(), ({ add }) => { add(G.cyl(.17, .13, .2, 12), '#e2b070', 0, 0, 0, 0, 0, 0, 1, [2, 1]); }));
  bk.add(mc('bw-basket-rim', ({ add, tube }) => { add(G.tor(.17, .02, PI * 2, 4, 14), '#c48a4a', 0, .1, 0, HP); tube([-.16, .1, 0], [0, .3, 0], .008, P.rope, 4); tube([.16, .1, 0], [0, .3, 0], .008, P.rope, 4); }));
  const rope = mesh(G.cyl(.008, .008, 1, 4), mat(P.rope)); rope.userData.noMerge = true; f.add(rope);
  const setRope = () => { const top = 2.1, y = bk.position.y + .45; rope.position.set(1.05, (top + y) / 2, .75); rope.scale.y = Math.max(.02, top - y); };
  setRope();
  const p = f.part('lift', [bk, rope], t => { bk.position.y = 1.65 - 1.48 * t; setRope(); }, { label: '도르래 바구니', sfx: 'ratchet', dur: 1.4 });
  f.spot('inside', bk, 0, .06, 0, { part: p, maxH: .24, label: '바구니 안', scale: .65 });
  f.spot('on', null, -.2, 1.6, .2, { maxH: .3, label: '나무 위 쉼터', scale: .6 });
  f.spot('behind', null, -.2, 0, -.7, { maxH: .5, label: '고목 뿌리 사이', scale: .75 });
  f.spot('inside', null, 0, .4, .38, { maxH: .2, label: '고목 구멍 안', scale: .55 });
  f.walkSolids = [[-.55, 0, -.55, .55, 2.4, .55]];
};

B.bw_musicstump = f => {
  // a short stump with a wooden music box on it; the lid lifts and a little dancer turns (t 0 → 1)
  f.add(mt('bw-mstump', TX.bark(), ({ add, tube }) => { add(G.cyl(.28, .34, .36, 14), P.bark, 0, .18, 0, 0, 0, 0, 1, [1.5, .8]); for (let k = 0; k < 3; k++) { const a = k * 2.1; tube([Math.cos(a) * .22, .12, Math.sin(a) * .22], [Math.cos(a) * .42, .02, Math.sin(a) * .42], .06, P.bark, 6, .03); } }));
  f.add(mc('bw-mstump-top', ({ add }) => {
    add(G.cyl(.275, .275, .01, 18), '#f0cf9e', 0, .365, 0); for (const r of [.2, .12]) add(G.tor(r, .005, PI * 2, 3, 20), '#c99a66', 0, .37, 0, HP);
    add(G.box(.3, .14, .22, .02), '#c7684a', 0, .44, 0); add(G.box(.31, .02, .23, .006), '#ffd23f', 0, .5, 0);
    add(G.cyl(.012, .012, .08, 6), '#9aa3ad', .19, .45, 0, 0, 0, HP); add(G.box(.02, .06, .015, .004), '#9aa3ad', .23, .47, 0);
    fern(add, -.35, -.3, .6);
  }));
  const lid = new THREE.Group(); lid.position.set(0, .51, -.11); f.add(lid);
  lid.add(mc('bw-mlid', ({ add }) => { add(G.box(.3, .04, .22, .015), '#d4775a', 0, .02, .11); add(G.box(.26, .006, .18, .003), '#fff4e2', 0, -.002, .11); for (let k = 0; k < 5; k++) add(G.sph(.012, 5, 4), '#ffd23f', -.1 + k * .05, .045, .11); }));
  const doll = new THREE.Group(); doll.position.set(0, .5, 0); f.add(doll);
  doll.add(mc('bw-mdoll', ({ add }) => { add(G.cyl(.012, .012, .05, 6), '#c9cfe0', 0, .025, 0); add(G.cone(.05, .09, 10), '#ffb3cf', 0, .09, 0); add(G.sph(.03, 10, 8), '#fff4e2', 0, .16, 0); }));
  doll.scale.setScalar(.01);
  const p = f.part('lid', [lid, doll], t => { lid.rotation.x = -1.6 * t; doll.scale.setScalar(Math.max(.01, Math.min(1, t * 1.5))); doll.rotation.y = t * PI * 4; }, { label: '오르골 뚜껑', sfx: 'open', dur: 1.2 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: 0, y: .44, z: .13 };
  f.spot('inside', null, -.06, .51, 0, { part: p, maxH: .12, label: '오르골 안', scale: .45 });
  f.spot('on', null, .4, 0, .3, { maxH: .4, label: '그루터기 옆', scale: .7 });
  f.walkSolids = [[-.34, 0, -.34, .34, .5, .34]];
};

B.bw_signpost = f => {
  // a forest signpost: a post with three arrow boards; the top one flips round (its back has a drawing)
  f.add(mt('bw-sign-post', TX.bark(), ({ add }) => add(G.cyl(.06, .07, 1.5, 8), P.barkD, 0, .75, 0, 0, 0, 0, 1, [1, 2])));
  f.add(mt('bw-sign-boards', TX.plank(), ({ add }) => {
    for (const [y, ry, w] of [[1.05, .4, .62], [.8, -.5, .55]]) { add(G.box(w, .14, .035, .015), '#f0d2a0', w / 2 - .05, y, 0, 0, ry, 0, 1, { w: .4 }); add(G.cone(.09, .12, 3), '#f0d2a0', w - .02, y, 0, 0, ry, -HP, [1, 1, .4]); }
  }));
  f.add(mc('bw-sign-bits', ({ add }) => { add(G.cone(.09, .12, 8), '#6f5240', 0, 1.56, 0); tuft(add, .2, .15, 1); add(G.rock(71, .2, 8, 6), P.stone2, -.2, .05, .15, 0, 0, 0, [.14, .08, .12]); }));
  // (②b 10/23: the flip board was 22×18 px — bigger, a fatter arrow)
  const pv = new THREE.Group(); pv.position.set(0, 1.3, 0); pv.scale.setScalar(1.8); f.add(pv);
  pv.add(mt('bw-sign-top', TX.plank(), ({ add }) => { add(G.box(.6, .16, .035, .015), '#ffe3b0', -.25, 0, 0, 0, 0, 0, 1, { w: .4 }); add(G.cone(.1, .12, 3), '#ffe3b0', -.58, 0, 0, 0, 0, HP, [1, 1, .4]); }));
  pv.add(mc('bw-sign-top-ink', ({ add }) => { for (let k = 0; k < 4; k++) add(G.box(.06, .02, .004, .002), '#6f5240', -.42 + k * .1, 0, .02); add(G.sph(.04, 8, 6), '#3a3550', -.2, 0, -.022, 0, 0, 0, [1, 1, .3]); }));
  const p = f.part('flip', pv, t => { pv.rotation.y = PI * t; }, { label: '화살표 판', sfx: 'flip', dur: .5 });
  f.spot('behind', null, 0, 0, -.35, { maxH: .45, label: '이정표 뒤', scale: .7 });
  f.walkSolids = [[-.12, 0, -.12, .12, 1.5, .12]];
};

B.bw_lamppost = f => {
  // a wooden lamp post with a lantern hook; a pale stone at its foot
  f.add(mt('bw-lamp-post', TX.bark(), ({ add, tube }) => { add(G.cyl(.06, .08, 1.7, 8), P.barkD, 0, .85, 0, 0, 0, 0, 1, [1, 2]); tube([0, 1.6, 0], [.35, 1.7, 0], .035, P.barkD, 6); }));
  f.add(mc('bw-lamp', ({ add, tube }) => {
    tube([.33, 1.68, 0], [.33, 1.55, 0], .006, '#4a4f66', 4);
    add(G.box(.16, .2, .16, .02), '#3a3f55', .33, 1.42, 0); add(G.box(.12, .15, .12, .01), '#fff2b8', .33, 1.42, 0); add(G.cone(.12, .08, 4), '#3a3f55', .33, 1.56, 0, 0, PI / 4, 0);
    add(G.rock(72, .2, 9, 6), P.stone, -.1, .05, .2, 0, 0, 0, [.2, .1, .16]); flower(add, .25, .25, '#ffffff');
  }));
  f.spot('on', null, .15, 0, .25, { maxH: .4, label: '등불 기둥 밑', scale: .7 });
  f.walkSolids = [[-.1, 0, -.1, .1, 1.7, .1]];
};

B.bw_logtunnel = f => {
  // a fallen hollow log you could crawl through, moss on top, a mushroom shelf on its side
  f.add(mt('bw-log', TX.bark(), ({ add }) => { add(G.cyl(.32, .34, 1.6, 14, true), P.bark, 0, .33, 0, 0, 0, HP, 1, [2, 1.5]); add(G.cyl(.25, .27, 1.6, 14, true), '#5a3e2c', 0, .33, 0, 0, 0, HP, 1, [2, 1.5]); }));
  f.add(mc('bw-log-ends', ({ add }) => {
    for (const x of [-.8, .8]) add(G.tor(.29, .045, PI * 2, 5, 18), '#f0cf9e', x, .33, 0, 0, HP, 0);
    add(G.sph(.3, 10, 6), P.moss, -.2, .62, 0, 0, 0, 0, [1.6, .3, .8]); add(G.sph(.2, 10, 6), P.moss, .45, .6, .05, 0, 0, 0, [1.3, .3, .7]);
    for (const [x, y] of [[-.4, .45], [-.25, .38], [.2, .5]]) add(G.cyl(.07, .06, .02, 10), '#f6e2b8', x, y, .33, HP * .9, 0, 0);
    tuft(add, .9, .35, 1); fern(add, -.95, -.3, .7);
  }));
  f.spot('inside', null, .6, .1, 0, { maxH: .4, label: '통나무 굴 안', scale: .7 });
  f.spot('on', null, .1, .63, 0, { maxH: .3, label: '통나무 위', scale: .6 });
  f.walkSolids = [[-.82, 0, -.35, .82, .66, .35]];
};

B.bw_ferns = f => {
  f.add(mc('bw-ferns', ({ add }) => { fern(add, 0, 0, 1.2); fern(add, .28, .18, .9, '#5cae55', '#3f8f44'); fern(add, -.25, .2, .8); }));
  f.spot('behind', null, 0, 0, -.25, { maxH: .35, label: '고사리 덤불 속', scale: .65 });
  f.walkSolids = [[-.3, 0, -.25, .3, .4, .25]];
};

export const BW_BUILDERS = B;
const H = { hidden: true, price: 0 };
export const BW_INFO = {
  bw_land: { w: .1, d: .1, name: '흔들다리 숲', ...H, floor: true },
  bw_bridge: { w: 3, d: 1, name: '흔들다리', ...H },
  bw_bigtree: { w: 2, d: 2, name: '큰 고목', ...H },
  bw_musicstump: { w: 1, d: 1, name: '오르골 그루터기', ...H },
  bw_signpost: { w: 1, d: 1, name: '숲길 이정표', ...H },
  bw_lamppost: { w: 1, d: 1, name: '숲길 등불', ...H },
  bw_logtunnel: { w: 2, d: 1, name: '통나무 굴', ...H },
  bw_ferns: { w: 1, d: 1, name: '고사리 덤불', ...H },
};

// 55판 반딧불 계곡 — fireflyvalley (10/23, 스토리 룸 표 redo-34to70-order-1023.md: 산길(50과 같음) → 새 맵. 숨은그림 · 밤 · 졸졸이,
// "밤이 되니 말똥말똥. …별이 엄청 많아."). 둥글고 울퉁불퉁한 작은 계곡 섬을 개울이 대각선으로 가르고, 뒤 왼쪽 바위 턱에서 작은 폭포,
// 뒤 오른쪽에 큰 참나무, 개울 건너 별 보기 바위(망원경), 왼쪽엔 졸졸이 잠자리, 앞쪽 그루터기에 반딧불 병.
//   vl_island     섬 받침(풀 윗면·층진 흙·돌 띠) + 개울(물결 질감, 자갈 둑) + 흙길 — 바닥 노릇(layout.hideFloor)
//   vl_falls      바위 턱과 작은 폭포·물웅덩이 (숨김: 바위 틈·웅덩이 가·바위 뒤)
//   vl_oak        큰 참나무: 둥근 덩어리 잎, 뿌리, 줄기 구멍(뚜껑 part 0 — 다람쥐 구멍 판자), 가지에 매단 등
//   vl_scope      별 보기 바위: 평평한 바위 위 담요·망원경(part 0: 망원경이 하늘로 고개 듦 — 장치 29), 별자리 판
//   vl_sleepmat   졸졸이 잠자리: 매트·베개(part 0: 베개 들기)·자명종·슬리퍼·작은 랜턴
//   vl_jarstump   그루터기 위 반딧불 병 셋(part 0: 뚜껑 열면 병이 환해짐 — 반딧불 병 장치)
//   vl_reeds      개울가 부들·갈대 무리(숨김: 갈대 뒤)
//   vl_stepstones 개울 징검다리(part 0: 돌이 물 위로 올라옴 — 레버 장치 15)
//   vl_logbridge  통나무 외나무다리(숨김: 다리 밑)
// 장치 연결은 ② 레벨(gpt-chains 표)이 — 부품은 t 0..1로 끝까지 움직이게만 만들어 둠.
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, texCache } from './kit.js';
import { G, mc, mt, TX, PI, HP, island, blobOutline, ribbon, tuft, flower, bush, fern, pine, fireflies } from './pc-kit.js';
import { EN } from '../i18n-en-dict.js';

const WORDS = { '폭포 바위 틈': 'In the crack by the falls', '폭포 웅덩이 가': 'By the falls pool', '폭포 바위 뒤': 'Behind the falls rock', '이끼 바위 위': 'On the mossy rock',
  '참나무 구멍 안': 'Inside the oak hollow', '참나무 뿌리 사이': 'Between the oak roots', '참나무 뒤': 'Behind the oak', '나뭇가지 위': 'Up on the branch', '등불 아래 풀밭': 'On the grass under the lantern',
  '담요 밑': 'Under the blanket', '별 보기 바위 위': 'On the stargazing rock', '망원경 가방 안': 'In the telescope bag', '별자리 판 뒤': 'Behind the star chart',
  '베개 밑': 'Under the pillow', '슬리퍼 옆': 'Beside the slippers', '매트 끝': 'At the end of the mat', '자명종 옆': 'Beside the alarm clock',
  '반딧불 병 안': 'In the firefly jar', '그루터기 뒤': 'Behind the stump', '그루터기 위': 'On the stump', '갈대 뒤': 'Behind the reeds', '연잎 위': 'On the lily pad',
  '징검다리 끝': 'At the end of the stepping stones', '외나무다리 밑': 'Under the log bridge', '통나무 위': 'On the log',
  '참나무 구멍 판자': 'Oak hollow board', '망원경': 'Telescope', '베개': 'Pillow', '반딧불 병 뚜껑': 'Firefly jar lid', '징검다리': 'Stepping stones', '반딧불 계곡': 'Firefly Valley' };
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

const B = {};
// palette: soft night-friendly greens, lilac-grey stones, warm woods; bright colour only on small things
const P = { grass: '#9fd47c', grassD: '#86c066', lip: '#8fcc6e', earth: '#a8785a', earthD: '#7f5a42', band: '#c7bfcf', stone: '#cdc6d8', stone2: '#b2aac4', moss: '#8fcf6a',
  water: '#8fd2ea', waterD: '#6fb6d6', pebble: '#ddd6e2', dirt: '#d9b894', wood: '#e2a96c', woodD: '#a8693e', bark: '#9a6a48', barkD: '#7a5238', leaf: '#6cbf5a', leaf2: '#56a84e', leaf3: '#8fd47a',
  cream: '#fff4e2', navy: '#4a5a8a', blanket: '#7f9cff', blanket2: '#ffd23f', jar: '#dff4ff', lid: '#e8a24a', glow: '#f4ff9a', red: '#ff7a6a' };

// the room is 8 × 7 (x -4..4, z -3.5..3.5); the creek runs from the falls pool (back left) to the front right edge
export const VL_CREEK = [[-2.35, -2.05], [-1.9, -1.2], [-1.05, -.55], [-.1, .05], [.9, .55], [1.85, 1.15], [2.7, 1.85], [3.55, 2.55], [4.6, 3.3]];
const OUT = blobOutline(4, 3.5, { pad: .75, round: 1.9, amp: .26, seed: 55, bulge: [[-2.4, .35, .5], [.6, .3, .45], [2.4, -.15, .4]] });

B.vl_island = f => {
  const water = ribbon(VL_CREEK, .78, .006), bank = ribbon(VL_CREEK, 1.08, .003);
  island(f, { key: 'vl-island', pts: OUT, top: P.grass, lip: P.lip, seed: 55,
    layers: [{ h: .2, color: P.earth, k: 0 }, { h: .3, color: P.band, k: -.04, stones: true }, { h: .24, color: P.earthD, k: -.14 }],
    tuft: '#5faa52', tuft2: '#7fc46a', pebble: P.pebble, skip: [[4.2, 3.0, .7]],
    // the dirt path from the sleeping spot (left) over the log bridge to the stargazing rock (right), soft edged
    decorTex: ({ add }) => {
      for (const [x, z, sx, sz, ry] of [[-2.9, 2.6, .9, .55, .3], [-2.2, 1.45, .7, .45, .5], [-1.35, .55, .6, .4, .8], [.25, -.85, .55, .38, .4], [1.15, -1.0, .6, .4, .1], [2.05, -.75, .65, .45, -.3]])
        add(G.cyl(1, 1, .012, 18), P.dirt, x, .006, z, 0, ry, 0, [sx, 1, sz], { w: 1.2 });
      add(bank.g, '#cfc3b2', 0, 0, 0, 0, 0, 0, 1, { w: .9 });
    },
    decor: ({ add }) => {
      // pebbles along both banks, a few lily pads, reeds at the far end
      const r = (i => () => (i = (i * 16807) % 2147483647) / 2147483647)(55);
      for (const side of [water.L, water.R]) side.forEach(([x, z], i) => { if (i % 2) return; const s = .06 + r() * .05; add(G.rock(i % 6 + 1, .25, 8, 6), r() < .5 ? P.pebble : P.stone2, x, .03, z, 0, r() * 3, 0, [s * 1.3, s * .8, s]); });
      for (const [x, z] of [[-.6, -.2], [2.3, 1.45], [3.2, 2.2]]) { add(G.cyl(.15, .15, .012, 14, false), P.leaf, x, .016, z, 0, .4, 0, [1, 1, .9]); add(G.sph(.04, 8, 6), '#ffc2d6', x + .04, .04, z - .02, 0, 0, 0, [1, .7, 1]); }
      // little tufts and white flowers sprinkled on the grass (calm: a few, not a carpet)
      for (const [x, z] of [[-3.6, -.6], [-1.2, 2.4], [.6, -1.8], [3.6, -.2], [1.6, 2.9], [-.4, 3.1], [3.3, 3.0], [-3.7, 3.0]]) tuft(add, x, z, 1);
      for (const [x, z, c] of [[-3.3, -.2, '#ffffff'], [-.9, 2.9, '#ffd23f'], [1.0, -2.2, '#ffffff'], [3.7, .5, '#b9a6ff'], [2.0, 3.2, '#ffffff']]) flower(add, x, z, c);
      // the shore's own bushes and ferns just outside the map (calm frame — not on anyone's spot)
      bush(add, -4.35, -.4, .9); bush(add, 4.45, -1.3, 1.0); fern(add, -4.25, 1.6, 1.1); fern(add, 4.3, .4, 1); bush(add, -1.4, 3.95, .8); fern(add, 1.2, 3.9, .9);
      pine(add, -4.45, -2.6, 1.1); pine(add, 3.1, -4.15, .9); pine(add, 4.5, -3.0, 1.2);
    } });
  // the water itself (its own texture, a hair above the bank)
  f.add(mt('vl-water', TX.water(), ({ addM }) => addM(water.g, new THREE.Matrix4(), P.water, { w: .8 })));
  f.walkSolids = [];   // (the creek is shallow: the friend wades; nothing on the island is solid but its pieces)
};

B.vl_falls = f => {
  // a rocky ledge 1.3 m high across the back-left corner, water falling down two steps into a round pool
  f.add(mt('vl-falls-rock', TX.stone(), ({ add }) => {
    for (const [x, y, z, sx, sy, sz, sd, c] of [[-1.1, .45, -.35, .75, .55, .55, 1, P.stone2], [-.35, .6, -.55, .6, .7, .5, 2, P.stone], [.55, .5, -.5, .55, .55, .5, 3, P.stone2], [1.15, .32, -.25, .45, .36, .42, 4, P.stone],
      [-.45, 1.1, -.65, .45, .35, .4, 5, P.stone], [.35, 1.05, -.7, .42, .32, .38, 6, P.stone2], [-1.25, .2, .25, .32, .22, .3, 7, P.stone], [1.05, .14, .45, .26, .16, .24, 8, P.stone2]])
      add(G.rock(sd, .22, 14, 10), c, x, y, z, 0, sd, 0, [sx, sy, sz], { w: .5 });
  }));
  f.add(mc('vl-falls', ({ add }) => {
    // moss caps and ferns on the ledge
    for (const [x, y, z, s] of [[-.4, 1.4, -.6, .3], [.4, 1.33, -.68, .26], [-1.1, .95, -.3, .32], [1.2, .62, -.22, .22]]) add(G.sph(s, 10, 6), P.moss, x, y, z, 0, 0, 0, [1.2, .35, 1]);
    fern(add, -1.35, -.6, .9, '#4fa64f', '#6cbf5a', .55); fern(add, 1.4, -.65, .8, '#4fa64f', '#6cbf5a', .4);
    // the fall: a glassy sheet over the lip in two steps, foam at its foot
    add(G.box(.42, .5, .06, .02), '#bfe8f6', .05, 1.0, -.28, -.15, 0, 0);
    add(G.box(.48, .48, .06, .02), '#cdeef8', .08, .52, -.06, -.25, 0, 0);
    for (let k = 0; k < 7; k++) add(G.sph(.07 + (k % 3) * .02, 8, 6), '#ffffff', -.12 + k * .06, .1 + (k % 2) * .03, .2 + (k % 3) * .04, 0, 0, 0, [1, .6, 1]);
    // the pool's stone ring
    for (let k = 0; k < 11; k++) { const a = -.3 + k / 10 * (PI + .6), s = .09 + (k % 3) * .03; add(G.rock(k + 11, .25, 8, 6), k % 2 ? P.stone : P.stone2, .05 + Math.cos(a) * .7, .05, .45 + Math.sin(a) * .42, 0, k, 0, [s * 1.4, s * .8, s]); }
  }));
  // the pool's water and its streaks
  f.add(mt('vl-falls-pool', TX.water(), ({ add }) => { add(G.cyl(.62, .62, .02, 22), P.water, .05, .012, .48, 0, 0, 0, [1, 1, .62], { w: .6 });
    for (const [y, z, w, h] of [[1.0, -.245, .38, .46], [.52, -.025, .44, .44]]) add(G.pbox(w, h, .01), '#e9f8ff', .06, y, z, -.18, 0, 0, 1, { w: .5 }); }));
  f.spot('behind', null, -.9, .52, -.55, { maxH: .3, label: '폭포 바위 틈', scale: .7 });
  f.spot('on', null, .7, .12, .62, { maxH: .35, label: '폭포 웅덩이 가', scale: .75 });
  f.spot('behind', null, 1.3, 0, -.6, { maxH: .4, label: '폭포 바위 뒤', scale: .75 });
  f.spot('on', null, -1.25, .42, .25, { maxH: .3, label: '이끼 바위 위', scale: .7 });
  f.walkSolids = [[-1.5, 0, -.9, 1.45, 1.4, .1], [-1.55, 0, 0, -.9, .4, .55]];
};

B.vl_oak = f => {
  // trunk with flared roots, a round chunky crown of four leaf balls, one low branch with a hanging lantern
  f.add(mt('vl-oak-bark', TX.bark(), ({ add, tube }) => {
    add(G.cyl(.26, .36, 1.5, 12), P.bark, 0, .75, 0, 0, 0, 0, 1, [1, 1]);
    for (let k = 0; k < 5; k++) { const a = k * 1.26 + .3; tube([Math.cos(a) * .18, .3, Math.sin(a) * .18], [Math.cos(a) * .55, .03, Math.sin(a) * .55], .1, P.bark, 7, .05); }
    tube([.1, 1.25, .05], [.85, 1.55, .35], .09, P.bark, 7, .06);
    tube([-.1, 1.35, -.05], [-.7, 1.75, -.3], .1, P.bark, 7, .07);
  }));
  f.add(mt('vl-oak-leaf', TX.leaf(), ({ add }) => {
    for (const [x, y, z, r, c] of [[0, 2.15, 0, .85, P.leaf], [.6, 1.95, .25, .6, P.leaf3], [-.62, 2.0, -.15, .62, P.leaf2], [.1, 2.65, -.1, .55, P.leaf3], [-.2, 1.85, .5, .5, P.leaf]])
      add(G.sph(r, 16, 12), c, x, y, z, 0, 0, 0, [1, .82, 1], { w: .7 });
  }));
  f.add(mc('vl-oak-bits', ({ add, tube }) => {
    // the hollow's dark mouth (its board is the part), a little sign nailed on, acorns on the roots
    add(G.cyl(.15, .15, .04, 14), '#4a3428', 0, .62, .29, HP, 0, 0, [1, 1, 1.25]);
    add(G.box(.26, .12, .02, .01), '#f6e2b8', -.06, 1.05, .3, 0, 0, .08); add(G.box(.18, .02, .01, .004), '#a8693e', -.06, 1.06, .312, 0, 0, .08);
    for (const [x, z] of [[.42, .3], [-.38, .4], [.5, -.2]]) { add(G.sph(.04, 8, 6), '#c98445', x, .05, z, 0, 0, 0, [1, 1.2, 1]); add(G.dome(.042, 8, 4), '#7a5238', x, .07, z, 0, 0, 0, [1, .6, 1]); }
    // a paper lantern hung from the branch on a cord
    tube([.75, 1.5, .3], [.75, 1.2, .3], .006, '#5a4434', 4);
    add(G.sph(.12, 12, 10), '#ffcf7a', .75, 1.1, .3, 0, 0, 0, [1, 1.2, 1]); add(G.cyl(.06, .06, .03, 10), '#a8693e', .75, 1.25, .3); add(G.cyl(.06, .06, .03, 10), '#a8693e', .75, .955, .3);
    // mushrooms at the foot
    for (const [x, z, s] of [[-.45, -.35, 1], [-.55, -.2, .7]]) { add(G.cyl(.025 * s, .03 * s, .08 * s, 6), P.cream, x, .04 * s, z); add(G.dome(.07 * s, 10, 4), P.red, x, .08 * s, z); add(G.sph(.012, 4, 3), '#ffffff', x + .03 * s, .12 * s, z); }
  }));
  // the hollow's board: swings open on its top edge
  const pv = new THREE.Group(); pv.position.set(0, .78, .3); f.add(pv);
  pv.add(mt('vl-oak-board', TX.plank(), ({ add }) => { add(G.box(.32, .3, .03, .01), P.wood, 0, -.15, .015, 0, 0, 0, 1, { w: .4 }); }));
  pv.add(mc('vl-oak-knob', ({ add }) => { add(G.sph(.025, 8, 6), '#e8a24a', 0, -.24, .04); }));
  const p = f.part('lid', pv, t => { pv.rotation.x = -1.4 * t; }, { label: '참나무 구멍 판자', sfx: 'open', dur: .3 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: -.22, z: .05, parent: pv };
  // (the hollow is a niche in the bark: the thing sits in its mouth, in front of the trunk, under the board)
  f.spot('inside', null, 0, .5, .36, { part: p, maxH: .22, label: '참나무 구멍 안', scale: .6 });
  f.spot('under', null, .45, 0, .45, { maxH: .3, label: '참나무 뿌리 사이', scale: .7 });
  f.spot('behind', null, -.1, 0, -.6, { maxH: .5, label: '참나무 뒤', scale: .8 });
  // (봇 10/23: a branch spot under the crown was hidden by the leaves — the lantern's side of the roots instead)
  f.spot('on', null, .62, 0, .62, { maxH: .35, label: '등불 아래 풀밭', scale: .7 });
  f.walkSolids = [[-.4, 0, -.4, .4, 2, .4]];
};

B.vl_scope = f => {
  // a wide flat rock, a striped blanket thrown on it, the telescope on a tripod and a star-chart board leaning on it
  f.add(mt('vl-scope-rock', TX.stone(), ({ add }) => {
    add(G.rock(31, .12, 16, 8), P.stone, 0, .14, 0, 0, .3, 0, [.95, .3, .7], { w: .6 });
    add(G.rock(32, .2, 10, 6), P.stone2, -.75, .08, .45, 0, 1, 0, [.28, .18, .24], { w: .4 });
  }));
  f.add(mt('vl-scope-blanket', TX.check(), ({ add }) => { add(G.box(.9, .03, .6, .012), P.blanket, -.15, .44, .05, 0, .2, .05, 1, { w: .25 }); }));
  f.add(mc('vl-scope', ({ add, tube }) => {
    // tripod
    for (const a of [0, 2.1, 4.2]) tube([.42, .44, -.05], [.42 + Math.cos(a) * .25, .38, -.05 + Math.sin(a) * .2], .015, '#4a4f66', 5);
    add(G.sph(.05, 8, 6), '#4a4f66', .42, 1.0, -.05);
    for (const a of [0, 2.1, 4.2]) tube([.42, 1.0, -.05], [.42 + Math.cos(a) * .25, .44, -.05 + Math.sin(a) * .2], .016, '#5a6078', 5);
    // a mug of cocoa and a little star book on the blanket
    add(G.cyl(.045, .04, .08, 10), '#ffffff', -.45, .5, .2); add(G.cyl(.038, .038, .01, 10), '#7a4a32', -.45, .54, .2); add(G.tor(.025, .008, PI, 4, 8), '#ffffff', -.4, .5, .2, 0, 0, -HP);
    add(G.box(.2, .03, .15, .006), P.navy, -.05, .475, .25, 0, .4, 0); add(G.box(.18, .005, .13, .003), '#ffd23f', -.05, .492, .25, 0, .4, 0);
    // the star chart board, propped on the rock's back
    add(G.box(.5, .4, .03, .015), '#2f3d6e', -.35, .62, -.42, -.3, 0, 0);
    for (const [x, y] of [[-.5, .7], [-.38, .76], [-.25, .66], [-.3, .55], [-.45, .52], [-.18, .74]]) add(G.sph(.016, 6, 4), '#ffe27a', x, y, -.39 + (y - .62) * .3);
  }));
  // the telescope: turns up toward the sky (t 0 → 1)
  const pv = new THREE.Group(); pv.position.set(.42, 1.0, -.05); f.add(pv);
  pv.add(mc('vl-scope-tube', ({ add }) => {
    add(G.cyl(.06, .075, .7, 14), '#e8eef8', 0, 0, 0, 0, 0, HP); add(G.cyl(.08, .08, .08, 14), '#ff9f6b', .32, 0, 0, 0, 0, HP);
    add(G.cyl(.035, .035, .1, 10), '#4a4f66', -.38, 0, 0, 0, 0, HP); add(G.cyl(.02, .02, .14, 8), '#4a4f66', .05, .08, 0, 0, 0, HP);
  }));
  pv.rotation.set(0, .5, .15);
  const p = f.part('lift', pv, t => { pv.rotation.z = .15 + .75 * t; pv.rotation.y = .5 - .9 * t; }, { label: '망원경', sfx: 'swish', dur: .8 });
  f.spot('under', null, -.3, .46, .1, { maxH: .12, label: '담요 밑', scale: .55 });
  f.spot('on', null, .05, .46, .2, { maxH: .35, label: '별 보기 바위 위', scale: .7 });
  f.spot('behind', null, -.35, .3, -.6, { maxH: .3, label: '별자리 판 뒤', scale: .65 });
  f.walkSolids = [[-.95, 0, -.6, .95, .45, .6]];
};

B.vl_sleepmat = f => {
  // 졸졸이's bed under the sky: a rolled-out mat, a fat pillow, a quilt kicked aside, an alarm clock and fuzzy slippers
  f.add(mt('vl-mat', TX.cloth(), ({ add }) => {
    add(G.box(.7, .06, 1.15, .03), '#9fb7ff', 0, .03, 0, 0, 0, 0, 1, { w: .2 });
    add(G.box(.62, .07, .5, .035), P.blanket2, .02, .09, .25, 0, .12, .03, 1, { w: .2 });
  }));
  f.add(mc('vl-mat-bits', ({ add, tube }) => {
    // the quilt's stars, a moon-shaped cushion
    for (const [x, z] of [[-.12, .15], [.12, .3], [-.05, .4], [.16, .12]]) add(G.sph(.025, 6, 4), '#ffffff', x, .13, z, 0, 0, 0, [1, .4, 1]);
    // alarm clock (two bells), slippers, a small lantern
    add(G.cyl(.07, .07, .05, 14), '#ff9f6b', .52, .08, -.32, HP, 0, 0); add(G.cyl(.055, .055, .052, 14), '#ffffff', .52, .08, -.31, HP, 0, 0);
    for (const s of [-1, 1]) add(G.dome(.03, 8, 4), '#ffd23f', .52 + s * .045, .15, -.32, 0, 0, s * .5);
    add(G.box(.006, .04, .003, .001), '#3b3550', .52, .085, -.282); add(G.box(.03, .006, .003, .001), '#3b3550', .53, .08, -.282);
    for (const s of [-1, 1]) { add(G.cap(.045, .12, 2, 8), '#c9b6ff', -.5 + s * .06, .045, .45, HP, .1 * s, 0); add(G.sph(.035, 8, 6), '#ffffff', -.5 + s * .06, .06, .38); }
    add(G.cyl(.06, .07, .02, 10), '#5a6078', .5, .01, .45); add(G.cyl(.05, .05, .13, 10), '#fff2b8', .5, .085, .45); add(G.cyl(.06, .06, .02, 10), '#5a6078', .5, .16, .45); add(G.tor(.035, .006, PI, 4, 8), '#5a6078', .5, .19, .45);
  }));
  // the pillow: lifts and tips back (t 0 → 1)
  const pv = new THREE.Group(); pv.position.set(0, .07, -.38); f.add(pv);
  pv.add(mt('vl-pillow', TX.cloth(), ({ add }) => { add(G.box(.52, .14, .3, .07), '#ffffff', 0, .07, 0, 0, 0, 0, 1, { w: .2 }); }));
  pv.add(mc('vl-pillow-moon', ({ add }) => { add(G.tor(.05, .018, PI * 1.3, 5, 12), '#ffd23f', .12, .1, .152, 0, 0, .6); }));
  const p = f.part('lift', pv, t => { pv.position.y = .07 + .22 * t; pv.rotation.x = -.6 * t; }, { label: '베개', sfx: 'open', dur: .3 });
  f.spot('inside', null, -.05, .075, -.38, { part: p, maxH: .14, label: '베개 밑', scale: .55 });
  f.spot('on', null, -.38, 0, .62, { maxH: .35, label: '슬리퍼 옆', scale: .7 });
  f.spot('on', null, .05, .13, .5, { maxH: .3, label: '매트 끝', scale: .65 });
  f.spot('on', null, .4, 0, -.55, { maxH: .3, label: '자명종 옆', scale: .6 });
  // (a mat on the grass: anyone may step on it — only the clock stands)
  f.walkSolids = [[.42, 0, -.42, .62, .2, -.22]];
};

B.vl_jarstump = f => {
  // a wide sawn stump with rings on top, three glass jars of fireflies; the middle jar's lid twists off (the glow part)
  f.add(mt('vl-stump', TX.bark(), ({ add, tube }) => {
    add(G.cyl(.32, .38, .42, 14), P.bark, 0, .21, 0, 0, 0, 0, 1, [1.5, .8]);
    for (let k = 0; k < 4; k++) { const a = k * 1.6 + .4; tube([Math.cos(a) * .25, .15, Math.sin(a) * .25], [Math.cos(a) * .48, .02, Math.sin(a) * .48], .07, P.bark, 6, .035); }
  }));
  f.add(mc('vl-stump-top', ({ add }) => {
    add(G.cyl(.315, .315, .01, 20), '#f0cf9e', 0, .425, 0);
    for (const r of [.24, .16, .08]) add(G.tor(r, .006, PI * 2, 3, 24), '#c99a66', 0, .43, 0, HP);
    // two jars at the sides (their fireflies glow through)
    for (const [x, z] of [[-.17, .05], [.18, -.06]]) {
      add(G.cyl(.075, .075, .2, 12), P.jar, x, .53, z); add(G.cyl(.068, .068, .03, 12), P.lid, x, .645, z);
      for (let k = 0; k < 3; k++) add(G.sph(.018, 6, 4), P.glow, x + Math.cos(k * 2) * .03, .5 + k * .05, z + Math.sin(k * 2) * .03);
    }
    fern(add, .38, -.35, .7); add(G.rock(41, .2, 8, 6), P.stone2, -.42, .06, .3, 0, 0, 0, [.14, .09, .12]);
  }));
  // the middle jar: its lid lifts off and the jar's fireflies brighten (t 0 → 1)
  const jar = new THREE.Group(); jar.position.set(0, .43, .14); f.add(jar);
  const glass = mesh(G.cyl(.085, .085, .24, 14), mat('#e6f6ff', { rough: .3 })); glass.position.y = .12; jar.add(glass);
  const glowM = new THREE.MeshBasicMaterial({ color: '#f4ff9a', transparent: true, opacity: .35, depthWrite: false });
  const glow = new THREE.Mesh(G.sph(.07, 10, 8), glowM); glow.position.y = .12; glow.userData.noMerge = true; glow.layers.set(2); glow.castShadow = false; jar.add(glow);
  const dots = mc('vl-jar-dots', ({ add }) => { for (let k = 0; k < 4; k++) add(G.sph(.02, 6, 4), P.glow, Math.cos(k * 1.6) * .04, .07 + k * .04, Math.sin(k * 1.6) * .04); }); jar.add(dots);
  const lid = new THREE.Group(); lid.position.y = .25; jar.add(lid);
  lid.add(mc('vl-jar-lid', ({ add }) => { add(G.cyl(.078, .078, .035, 14), P.lid, 0, 0, 0); add(G.box(.12, .012, .02, .004), '#ffffff', 0, .02, 0); }));
  const p = f.part('lid', [lid, glow], (t, bl) => { lid.position.y = bl.p.y + .12 * t; lid.rotation.z = .5 * t; lid.position.x = .06 * t; glow.scale.setScalar(1 + 2.2 * t); glowM.opacity = .35 + .45 * t; }, { label: '반딧불 병 뚜껑', sfx: 'pop', dur: .5 });
  f.pullOut(p, f.spot('inside', jar, 0, .02, 0, { part: p, maxH: .18, label: '반딧불 병 안', scale: .5 }), 0, { w: .12, d: .12, color: '#e6f6ff', up: .26 });
  f.spot('behind', null, 0, 0, -.5, { maxH: .4, label: '그루터기 뒤', scale: .75 });
  f.spot('on', null, -.12, .43, -.16, { maxH: .2, label: '그루터기 위', scale: .55 });
  f.walkSolids = [[-.38, 0, -.38, .38, .45, .38]];
};

B.vl_reeds = f => {
  // cattails and long reeds leaning a little over the water, a lily pad with a frog-green leaf
  f.add(mc('vl-reeds', ({ add, tube }) => {
    for (let k = 0; k < 14; k++) {
      const x = (k % 5 - 2) * .14 + (k % 3) * .03, z = (Math.floor(k / 5) - 1) * .16, h = .7 + (k % 4) * .14, lean = (k % 3 - 1) * .1;
      tube([x, 0, z], [x + lean, h, z + .05], .014, k % 2 ? '#6aa85a' : '#7fbf62', 5, .02);
      if (k % 3 === 0) add(G.cap(.035, .14, 2, 6), '#8b5e3c', x + lean * .9, h - .05, z + .05);
      else { const g = G.cone(.03, .45, 4); add(g, '#5c9a4c', x + lean, h * .6, z, .1, k, .25 * (k % 2 ? 1 : -1), [1, 1, .3]); }
    }
    tuft(add, .3, .25, 1.2); tuft(add, -.32, .22, 1);
  }));
  f.spot('behind', null, 0, 0, -.32, { maxH: .5, label: '갈대 뒤', scale: .75 });
  f.walkSolids = [[-.35, 0, -.3, .35, .8, .3]];
};

B.vl_stepstones = f => {
  // four flat stones across the creek; the part raises them out of the water (t 0: just under the surface)
  const stones = [];
  for (const [x, z, s] of [[-.5, -.35, 1], [-.15, -.05, .9], [.2, .22, 1.05], [.52, .5, .85]]) {
    const g = new THREE.Group(); g.position.set(x, -.06, z); f.add(g); stones.push(g);
    g.add(mt('vl-step|' + s, TX.stone(), ({ add }) => { add(G.rock(Math.round(s * 30), .1, 12, 6), P.stone, 0, 0, 0, 0, s * 3, 0, [.19 * s, .09, .16 * s], { w: .3 }); }));
    g.add(mc('vl-step-moss|' + s, ({ add }) => { add(G.sph(.07 * s, 8, 5), P.moss, -.03, .07, .02, 0, 0, 0, [1.2, .3, 1]); }));
  }
  const p = f.part('lift', stones, t => { stones.forEach((g, i) => { const k = Math.max(0, Math.min(1, t * 1.6 - i * .2)); g.position.y = -.06 + .1 * k; }); }, { label: '징검다리', sfx: 'thunk', dur: 1.0 });
  f.spot('on', null, .75, 0, .72, { maxH: .35, label: '징검다리 끝', scale: .7 });
  f.walkSolids = [];
};

B.vl_logbridge = f => {
  // a split log laid across the creek with a rope rail on two posts
  f.add(mt('vl-log', TX.bark(), ({ add }) => {
    add(G.cyl(.16, .17, 1.5, 12), P.bark, 0, .1, 0, 0, 0, HP, 1, [1.4, 1.2]);
    for (const x of [-.72, .72]) add(G.cyl(.15, .15, .02, 12), '#f0cf9e', x, .1, 0, 0, 0, HP);
  }));
  f.add(mt('vl-log-top', TX.plank(), ({ add }) => { add(G.box(1.45, .03, .24, .01), P.wood, 0, .22, 0, 0, 0, 0, 1, { w: .5 }); }));
  f.add(mc('vl-log-rail', ({ add, tube }) => {
    for (const x of [-.65, .65]) { add(G.cyl(.035, .04, .6, 8), P.woodD, x, .3, -.2); add(G.sph(.04, 8, 6), P.woodD, x, .6, -.2); }
    tube([-.65, .55, -.2], [0, .48, -.2], .012, '#e2c088', 5); tube([0, .48, -.2], [.65, .55, -.2], .012, '#e2c088', 5);
    add(G.rock(51, .2, 8, 6), P.stone2, -.85, .05, .2, 0, 0, 0, [.14, .09, .12]); add(G.rock(52, .2, 8, 6), P.stone, .82, .05, -.15, 0, 0, 0, [.12, .08, .1]);
  }));
  f.spot('under', null, .25, 0, .22, { maxH: .12, label: '외나무다리 밑', scale: .55 });
  f.spot('on', null, -.35, .235, 0, { maxH: .3, label: '통나무 위', scale: .6 });
  // (the log is the way across: only the rope rail's posts stand)
  f.walkSolids = [[-.72, 0, -.26, -.58, .6, -.14], [.58, 0, -.26, .72, .6, -.14]];
};

// the night's fireflies (one piece so the map can place it; nothing to tap)
B.vl_fireflies = f => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];
  fireflies(f, [[-1.6, -1.4, .7, .8], [.3, .1, .9, .6], [2.6, 1.6, .8, .7], [-2.6, 1.2, .7, .9], [1.8, -1.6, .6, 1.4], [3.0, -.5, .6, .9]], { n: 26, seed: 55 });
};

export const VL_BUILDERS = B;
const H = { hidden: true, price: 0 };
export const VL_INFO = {
  vl_island: { w: .1, d: .1, name: '반딧불 계곡', ...H, floor: true },
  vl_falls: { w: 3, d: 2, name: '폭포 바위', ...H },
  vl_oak: { w: 1, d: 1, name: '큰 참나무', ...H },
  vl_scope: { w: 2, d: 1, name: '별 보기 바위', ...H },
  vl_sleepmat: { w: 1, d: 1, name: '졸졸이 잠자리', ...H },
  vl_jarstump: { w: 1, d: 1, name: '반딧불 병 그루터기', ...H },
  vl_reeds: { w: 1, d: 1, name: '갈대', ...H },
  vl_stepstones: { w: 1, d: 1, name: '징검다리', ...H },
  vl_logbridge: { w: 2, d: 1, name: '외나무다리', ...H },
  vl_fireflies: { w: .1, d: .1, name: '반딧불', ...H },
};

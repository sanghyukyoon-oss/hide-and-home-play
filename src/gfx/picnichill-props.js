// 49판 소풍 잔디 언덕 — picnichill (10/23, 스토리 룸 표: 놀이터 광장 → 새 맵. 보스 · 다람이·개굴이, "도시락을 너무 꼭꼭 숨겨서 자기도
// 못 찾아요"). 섬 뒤쪽이 둥근 잔디 언덕으로 솟고 꼭대기에 그늘 큰 나무(연이 걸림), 앞 평평한 잔디엔 체크무늬 돗자리와 3단 도시락,
// 파라솔, 레버로 물을 뿜는 작은 분수, 다람이네 도토리 집. 보스라 자물쇠 넷(pad·code·color·lever)이 다 들어갈 상자들을 둠.
//   ph_land     섬 받침 + 뒤 언덕(나무·연·꽃·흙 계단) — 바닥 노릇(layout.hideFloor). 언덕은 걷는 칸 밖(뒤 가장자리 너머)
//   ph_mat      돗자리: 3단 도시락(부품 0: 뚜껑이 열림 — 보스 끝 도시락)·주먹밥·보온병·과일 접시·컵
//   ph_parasol  파라솔과 접이 의자 둘
//   ph_fountain 작은 돌 분수(부품 0: 옆 레버를 내리면 물줄기 — 분수 레버 장치 15)
//   ph_acornhouse 다람이네 도토리 집(기둥 위 새집, 지붕 뚜껑 부품 0 — 자물쇠 자리)
import * as THREE from 'three';
import { mat, mesh } from './kit.js';
import { G, mc, mt, TX, PI, HP, island, blobOutline, tuft, flower, bush, fern } from './pc-kit.js';
import { EN } from '../i18n-en-dict.js';

const WORDS = { '소풍 잔디 언덕': 'Picnic Hill', '도시락 뚜껑': 'Lunchbox lid', '도시락 안': 'In the lunchbox', '돗자리 밑': 'Under the picnic mat', '돗자리 위': 'On the picnic mat', '보온병 옆': 'Beside the flask',
  '파라솔 밑': 'Under the parasol', '접이 의자 위': 'On the folding stool', '분수 레버': 'Fountain lever', '분수 가': 'By the fountain', '분수 뒤': 'Behind the fountain',
  '도토리 집 지붕': 'Acorn house roof', '도토리 집 안': 'Inside the acorn house', '도토리 집 기둥 밑': 'At the foot of the acorn house', '언덕 계단 옆': 'By the hill steps', '큰 도시락 바구니': 'Big picnic hamper', '큰 바구니 안': 'In the big hamper', '큰 바구니 뒤': 'Behind the big hamper', '연 얼레 옆': 'By the kite reel', '비눗방울 의자 밑': 'Under the bubble stool', '파란 돗자리 밑': 'Under the blue mat', '파란 돗자리 위': 'On the blue mat', '언덕 꽃밭': 'In the hill flowers' };
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

const B = {};
const P = { grass: '#a8da80', grass2: '#94cf6e', lip: '#8fcc6e', hill: '#9fd477', hill2: '#8cc866', earth: '#a8785a', earthD: '#7f5a42', band: '#d2c8bd', path: '#ecd6b0',
  bark: '#9a6a48', leaf: '#6cbf5a', leaf2: '#56a84e', leaf3: '#8fd47a', mat: '#ff9f8f', mat2: '#ffffff', box1: '#ff8f6b', box2: '#ffd23f', box3: '#7fd6c0', rice: '#fffaf0', nori: '#2f3a2c',
  stone: '#e1dbe4', stone2: '#c4bccf', water: '#8fd2ea', wood: '#e8b47a', woodD: '#a8693e', navy: '#4a5a8a', red: '#ff6b5a', yellow: '#ffd23f', cream: '#fff4e2', kite: '#ff8fb8', kite2: '#8fd3f4' };

const OUT = blobOutline(4, 3.5, { pad: .7, round: 1.9, amp: .22, seed: 49, bulge: [[-HP, 1.3, .9], [-HP - .9, .6, .5], [-HP + .9, .6, .5], [PI - .3, .55, .45], [-.45, .5, .4], [PI * .78, .4, .35]] });
// the hill: a half ellipsoid behind the map (its foot just past the back edge)
const HILL = { z: -5.0, rx: 4.4, rz: 1.5, h: 1.75 };
const hillY = (x, z) => HILL.h * Math.sqrt(Math.max(0, 1 - (x / HILL.rx) ** 2 - ((z - HILL.z) / HILL.rz) ** 2));

B.ph_land = f => {
  island(f, { key: 'ph-land', pts: OUT, top: P.grass, lip: P.lip, seed: 49,
    layers: [{ h: .2, color: P.earth, k: 0 }, { h: .3, color: P.band, k: -.04, stones: true }, { h: .24, color: P.earthD, k: -.14 }],
    tuft: '#5faa52', tuft2: '#7fc46a', pebble: '#ddd6cc', skip: [[0, -4.3, 2.4]],
    decorTex: ({ add }) => {
      // a worn path up to the hill's steps and round to the mat
      for (const [x, z, sx, sz, ry] of [[-.2, -2.95, .55, .4, .1], [.15, -2.2, .5, .38, .4], [.5, -1.3, .5, .4, .2], [.3, -.4, .45, .35, .5], [-1.4, 2.95, .55, .4, .3], [2.6, 2.6, .5, .38, .6]])
        add(G.cyl(1, 1, .012, 18), P.path, x, .006, z, 0, ry, 0, [sx, 1, sz], { w: 1.2 });
    },
    decor: ({ add }) => {
      for (const [x, z] of [[-3.7, .2], [3.7, -.5], [-.9, 3.3], [1.8, 3.4], [-3.4, 3.0], [3.4, 2.9]]) tuft(add, x, z, 1);
      for (const [x, z, c] of [[-3.5, -1.0, '#ffffff'], [3.6, .9, '#ffd23f'], [-2.0, 3.2, '#ffb3cf'], [2.4, -1.3, '#ffffff'], [.9, 3.3, '#b9a6ff']]) flower(add, x, z, c);
      bush(add, -4.4, 1.2, .95); bush(add, 4.4, .4, .9); fern(add, 4.3, 2.6, 1); bush(add, -4.2, 3.0, .8);
    } });
  // the hill: a soft green mound behind the map (its front foot just at the back edge), a big shade tree on top, a kite in it,
  // flowers on the slope and earth steps cut up the middle
  f.add(mt('ph-hill', TX.grass(), ({ add }) => {
    add(G.dome(1, 32, 10), P.hill, 0, -.03, HILL.z, 0, 0, 0, [HILL.rx, HILL.h, HILL.rz], { w: 1.3 });
    add(G.dome(1, 24, 8), P.hill2, -3.1, -.03, -5.0, 0, 0, 0, [1.7, 1.25, 1.3], { w: 1.3 });
    // knolls round the sides, outside the walking map: the lawn rolls up and down instead of lying flat
    add(G.dome(1, 20, 7), P.hill2, -5.0, -.03, -1.6, 0, 0, 0, [.9, .55, 1.4], { w: 1.3 }); add(G.dome(1, 20, 7), P.hill, 4.9, -.03, -2.4, 0, 0, 0, [.8, .6, 1.2], { w: 1.3 }); add(G.dome(1, 18, 6), P.hill2, -4.6, -.03, 2.6, 0, 0, 0, [.7, .35, .9], { w: 1.3 });
    add(G.dome(1, 24, 8), P.hill2, 3.15, -.03, -5.05, 0, 0, 0, [1.7, 1.1, 1.3], { w: 1.3 });
  }));
  f.add(mt('ph-steps', TX.plank(), ({ add }) => { for (let k = 0; k < 7; k++) { const z = -3.6 - k * .2, y = hillY(-.2, z) - .01; add(G.box(.9, .07, .2, .02), P.wood, -.2, y, z, 0, 0, 0, 1, { w: .4 }); } }));
  // (the tree's foot sits on the hill's crest: its pieces are drawn for a 1.6 m crest and set to the hill)
  f.add(mt('ph-hilltree-bark', TX.bark(), ({ add, tube }) => { add(G.cyl(.24, .32, 1.6, 12), P.bark, .6, 2.4, -5.3, 0, 0, 0, 1, [1, 1]); tube([.6, 2.9, -5.3], [1.4, 3.4, -5.0], .1, P.bark, 7, .06); tube([.6, 3.0, -5.3], [-.2, 3.5, -5.5], .1, P.bark, 7, .06); })).position.y = .1;
  f.add(mt('ph-hilltree-leaf', TX.leaf(), ({ add }) => {
    for (const [x, y, z, r, c] of [[.6, 3.9, -5.3, 1.25, P.leaf], [1.5, 3.6, -5.0, .8, P.leaf3], [-.3, 3.7, -5.4, .85, P.leaf2], [.7, 4.5, -5.5, .8, P.leaf3]]) add(G.sph(r, 18, 12), c, x, y, z, 0, 0, 0, [1, .82, 1], { w: .8 });
  })).position.y = .1;
  f.add(mc('ph-hill-bits', ({ add, tube }) => {
    // the kite caught in the crown, its tail hanging; flowers on the slope; a little flag on a stick
    add(G.box(.55, .7, .02, .01), P.kite, 1.75, 3.55, -4.35, 0, .3, .7); add(G.box(.04, .7, .025, .004), '#ffffff', 1.75, 3.55, -4.34, 0, .3, .7); add(G.box(.55, .04, .025, .004), '#ffffff', 1.75, 3.55, -4.34, 0, .3, .7);
    for (let k = 0; k < 6; k++) add(G.box(.08, .05, .015, .005), k % 2 ? P.kite2 : P.yellow, 1.6 - k * .04, 3.0 - k * .18, -4.3, 0, 0, k * .4);
    tube([1.75, 3.2, -4.3], [1.6, 2.0, -4.2], .004, '#ffffff', 3);
    for (let k = 0; k < 26; k++) { const x = -3.6 + (k * 7.3 % 7.2), z = HILL.z + HILL.rz * (.4 + (k * .37 % .45)); if (Math.abs(x + .2) < .6) continue; add(G.sph(.04, 6, 4), ['#ffffff', '#ffd23f', '#ffb3cf'][k % 3], x, hillY(x, z) + .03, z); }
    tube([-2.6, .6, -4.6], [-2.6, 1.4, -4.6], .015, P.woodD, 4); add(G.box(.3, .18, .01, .004), P.red, -2.45, 1.32, -4.6);
  }));
  f.walkSolids = [];
};

B.ph_mat = f => {
  // a 1.8 × 1.4 gingham mat with its corners held by stones, a three-tier lunchbox in the middle, rice balls, a flask, fruit
  f.add(mt('ph-mat', TX.check(), ({ add }) => { add(G.box(1.8, .015, 1.4, .006), P.mat, 0, .008, 0, 0, 0, 0, 1, { w: .3 }); }));
  f.add(mc('ph-mat-bits', ({ add, tube }) => {
    for (const [x, z] of [[-.88, -.68], [.88, -.68], [-.88, .68], [.88, .68]]) add(G.rock(Math.round(x * 10 + z * 3 + 50), .2, 8, 6), P.stone2, x, .04, z, 0, 0, 0, [.08, .05, .07]);
    // the lunchbox's lower tiers (the top tier is the lid part)
    add(G.box(.42, .12, .32, .03), P.box3, 0, .075, 0); add(G.box(.42, .12, .32, .03), P.box2, 0, .195, 0); add(G.box(.44, .02, .34, .01), '#ffffff', 0, .136, 0);
    tube([-.23, .32, 0], [.23, .32, 0], .012, '#f2d8a2', 5); for (const s of [-1, 1]) tube([s * .23, .02, 0], [s * .23, .32, 0], .012, '#f2d8a2', 5);
    // rice balls on a plate, a flask, two cups, a plate of strawberries and apple bunnies
    add(G.cyl(.18, .16, .02, 18), '#ffffff', -.55, .025, .3);
    for (const [x, z] of [[-.6, .25], [-.48, .36]]) { add(G.cone(.065, .09, 3), P.rice, x, .08, z, 0, .3, 0, [1, 1, .55]); add(G.box(.06, .04, .07, .01), P.nori, x, .055, z + .015); }
    add(G.cyl(.06, .06, .3, 14), '#5fa8e8', .58, .16, -.3); add(G.cyl(.065, .065, .06, 14), '#ffffff', .58, .33, -.3);
    for (const [x, c] of [[.45, '#ffffff'], [.72, '#ffd23f']]) add(G.cyl(.04, .035, .07, 10), c, x, .05, -.05);
    add(G.cyl(.16, .14, .02, 18), '#ffffff', .5, .025, .35); for (let k = 0; k < 5; k++) add(G.sph(.03, 8, 6), P.red, .45 + (k % 3) * .05, .055, .3 + Math.floor(k / 3) * .07, 0, 0, 0, [1, 1.2, 1]);
    // a napkin, chopsticks, a ladybird
    add(G.box(.2, .006, .2, .002), '#ffe3b0', -.3, .02, -.45, 0, .3, 0); for (const s of [-1, 1]) add(G.box(.2, .008, .01, .003), '#c48a4a', -.3 + s * .01, .03, -.45 + s * .02, 0, .3, 0);
    add(G.dome(.025, 8, 4), P.red, .8, .02, .55);
  }));
  // the lunchbox's top tier: lifts off and tips (t 0 → 1)
  const lid = new THREE.Group(); lid.position.set(0, .26, 0); f.add(lid);
  lid.add(mc('ph-lunch-lid', ({ add }) => { add(G.box(.42, .1, .32, .03), P.box1, 0, .05, 0); add(G.box(.44, .02, .34, .01), '#ffffff', 0, .1, 0); add(G.sph(.03, 8, 6), '#ffffff', 0, .12, 0); }));
  const p = f.part('lid', lid, t => { lid.position.y = .26 + .2 * t; lid.position.x = .25 * t; lid.rotation.z = -.5 * t; }, { label: '도시락 뚜껑', sfx: 'open', dur: .4 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: 0, y: .05, z: .17, parent: lid };
  f.spot('inside', null, 0, .25, 0, { part: p, maxH: .12, label: '도시락 안', scale: .5 });
  f.spot('under', null, -.5, .01, -.3, { maxH: .06, label: '돗자리 밑', scale: .4 });
  f.spot('on', null, -.15, .016, .45, { maxH: .35, label: '돗자리 위', scale: .7 });
  f.spot('on', null, .78, .016, -.15, { maxH: .3, label: '보온병 옆', scale: .6 });
  f.walkSolids = [[-.24, 0, -.18, .24, .45, .18], [.5, 0, -.38, .66, .35, -.22]];
};

B.ph_parasol = f => {
  // a striped parasol over two folding stools
  f.add(mc('ph-parasol', ({ add, tube }) => {
    tube([0, 0, 0], [.05, 2.0, 0], .025, '#f2f2f2', 6); add(G.cyl(.18, .22, .06, 12), '#a9b2c8', 0, .03, 0);
    for (let k = 0; k < 8; k++) { add(new THREE.ConeGeometry(1.05, .42, 8, 1, true, k * PI / 4, PI / 4), k % 2 ? '#ffffff' : '#ff8f6b', .05, 1.95, 0); }
    add(G.sph(.05, 8, 6), '#ffd23f', .05, 2.18, 0);
    for (const [x, z, a] of [[-.55, .35, .4], [.55, .4, -.4]]) {
      for (const s of [-1, 1]) { tube([x + s * .15, 0, z - .15], [x - s * .15, .38, z + .15], .012, '#a9b2c8', 4); }
      add(G.box(.34, .03, .3, .01), '#7fd6c0', x, .39, z, 0, a, 0);
    }
  }));
  f.spot('under', null, -.1, 0, -.35, { maxH: .5, label: '파라솔 밑', scale: .8 });
  f.spot('on', null, .55, .405, .4, { maxH: .3, label: '접이 의자 위', scale: .6 });
  f.walkSolids = [[-.06, 0, -.06, .1, 2, .06], [-.75, 0, .15, -.35, .4, .55], [.35, 0, .2, .75, .4, .6]];
};

B.ph_fountain = f => {
  // a round stone basin on a short stem, a frog spout in the middle; a lever on its side starts the jet
  f.add(mt('ph-fountain-stone', TX.stone(), ({ add }) => {
    add(G.cyl(.62, .66, .32, 24), P.stone, 0, .16, 0, 0, 0, 0, 1, { w: .4 }); add(G.cyl(.18, .24, .3, 14), P.stone2, 0, .45, 0, 0, 0, 0, 1, { w: .3 }); add(G.cyl(.32, .28, .1, 18), P.stone, 0, .63, 0, 0, 0, 0, 1, { w: .3 });
  }));
  f.add(mt('ph-fountain-water', TX.water(), ({ add }) => { add(G.cyl(.55, .55, .02, 24), P.water, 0, .3, 0, 0, 0, 0, 1, { w: .5 }); add(G.cyl(.27, .27, .02, 18), P.water, 0, .67, 0, 0, 0, 0, 1, { w: .5 }); }));
  f.add(mc('ph-fountain-frog', ({ add }) => {
    add(G.sph(.1, 12, 10), '#7fcf6a', 0, .74, 0, 0, 0, 0, [1.1, .8, 1]); for (const s of [-1, 1]) { add(G.sph(.04, 8, 6), '#7fcf6a', s * .05, .82, .04); add(G.sph(.018, 6, 4), '#2a2a3a', s * .05, .83, .075); }
    add(G.box(.12, .1, .06, .02), '#9aa3ad', .66, .2, 0); add(G.sph(.03, 8, 6), '#4a4f66', .7, .2, 0);
    for (const [x, z] of [[-.4, .3], [.2, -.45]]) add(G.cyl(.08, .08, .01, 10), '#7fcf6a', x, .312, z);
  }));
  // the lever (t: pushed down) and the jet from the frog's mouth
  const lv = new THREE.Group(); lv.position.set(.7, .22, 0); f.add(lv);
  lv.add(mc('ph-fountain-lever', ({ add, tube }) => { tube([0, 0, 0], [.05, .32, 0], .018, '#4a4f66', 5); add(G.sph(.045, 10, 8), P.red, .05, .34, 0); }));
  const jetM = new THREE.MeshStandardMaterial({ color: '#d4f2fb', transparent: true, opacity: .85, roughness: .2 });
  const jet = new THREE.Mesh(G.cyl(.03, .05, .6, 10, true), jetM); jet.position.set(0, .9, 0); jet.userData.noMerge = true; jet.layers.set(2); jet.scale.y = .01; f.add(jet);
  const drops = mc('ph-fountain-drops', ({ add }) => { for (let k = 0; k < 8; k++) { const a = k * PI / 4; add(G.sph(.025, 6, 4), '#d4f2fb', Math.cos(a) * .3, .2, Math.sin(a) * .3); } }); drops.position.y = 1; drops.visible = false; f.add(drops);
  const p = f.part('lever', [lv, jet, drops], t => { lv.rotation.z = -1.1 * t; jet.scale.y = Math.max(.01, t); jet.position.y = .8 + .3 * t; drops.visible = t > .6; }, { label: '분수 레버', sfx: 'whoosh', dur: .7 });
  f.spot('on', null, -.5, .32, .2, { maxH: .25, label: '분수 가', scale: .55 });
  f.spot('behind', null, 0, 0, -.8, { maxH: .45, label: '분수 뒤', scale: .75 });
  f.walkSolids = [[-.66, 0, -.66, .66, .7, .66]];
};

B.ph_acornhouse = f => {
  // a little round-roofed box house on a post with an acorn sign, a ladder of twigs, acorns piled at its foot
  f.add(mt('ph-acorn-post', TX.bark(), ({ add }) => { add(G.cyl(.06, .08, 1.0, 8), P.bark, 0, .5, 0, 0, 0, 0, 1, [1, 2]); }));
  f.add(mt('ph-acorn-box', TX.plank(), ({ add }) => { add(G.box(.44, .36, .36, .03), '#f0c890', 0, 1.18, 0, 0, 0, 0, 1, { w: .3 }); }));
  f.add(mc('ph-acorn-bits', ({ add, tube }) => {
    add(G.cyl(.08, .08, .02, 14), '#5a3e2c', 0, 1.2, .185, HP, 0, 0); add(G.box(.12, .02, .06, .01), P.woodD, 0, 1.08, .21);
    for (let k = 0; k < 4; k++) tube([-.15, .2 + k * .2, .12], [.15, .2 + k * .2, .12], .012, P.woodD, 4);
    for (const [x, z] of [[.2, .2], [.28, .1], [.15, .3], [-.2, .25]]) { add(G.sph(.035, 8, 6), '#c98445', x, .035, z, 0, 0, 0, [1, 1.2, 1]); add(G.dome(.036, 8, 4), '#7a5238', x, .055, z, 0, 0, 0, [1, .6, 1]); }
    add(G.sph(.05, 8, 6), '#c98445', .26, 1.25, .19, 0, 0, 0, [1, 1.2, .4]); add(G.dome(.05, 8, 4), '#7a5238', .26, 1.29, .19, 0, 0, 0, [1, .6, .4]);
  }));
  const roof = new THREE.Group(); roof.position.set(0, 1.36, -.2); f.add(roof);
  roof.add(mc('ph-acorn-roof', ({ add }) => { add(G.cyl(.25, .25, .52, 14, false), '#c7684a', 0, 0, .2, 0, 0, HP, [1, 1, .9]); add(G.box(.54, .02, .04, .01), '#ffd23f', 0, .02, .42); }));
  const p = f.part('lid', roof, t => { roof.rotation.x = -1.3 * t; }, { label: '도토리 집 지붕', sfx: 'open', dur: .35 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: .0, z: .45, parent: roof };
  f.pullOut(p, f.spot('inside', null, 0, 1.02, 0, { part: p, maxH: .22, label: '도토리 집 안', scale: .55 }), 0, { w: .34, d: .28, color: '#f0c890', up: .3 });
  f.spot('on', null, -.25, 0, -.15, { maxH: .4, label: '도토리 집 기둥 밑', scale: .65 });
  f.walkSolids = [[-.1, 0, -.1, .1, 1, .1]];
};

B.ph_bigbasket = f => {
  // a big wicker hamper (the boss's lunch): a woven body, a red-check cloth peeking out, a baguette and apples on top of the lid
  f.add(mt('ph-hamper', TX.cloth(), ({ add }) => { add(G.box(.62, .38, .44, .05), '#d9a464', 0, .19, 0, 0, 0, 0, 1, { w: .12 }); }));
  f.add(mc('ph-hamper-bits', ({ add, tube }) => {
    for (let k = 0; k < 5; k++) add(G.box(.64, .02, .46, .01), '#b98547', 0, .05 + k * .075, 0);
    for (const s of [-1, 1]) { add(G.box(.04, .08, .03, .01), '#7a5238', s * .2, .3, .235); }
    tube([-.22, .42, 0], [0, .62, 0], .025, '#b98547', 6); tube([0, .62, 0], [.22, .42, 0], .025, '#b98547', 6);
    add(G.box(.2, .06, .18, .02), P.red, .33, .1, .15, 0, .4, .3);
  }));
  const lid = new THREE.Group(); lid.position.set(0, .38, -.22); f.add(lid);
  lid.add(mt('ph-hamper-lid', TX.cloth(), ({ add }) => add(G.box(.64, .05, .46, .03), '#e2b070', 0, .025, .22, 0, 0, 0, 1, { w: .12 })));
  lid.add(mc('ph-hamper-top', ({ add }) => { add(G.cap(.045, .4, 2, 8), '#e8b46a', -.05, .09, .2, 0, .4, HP); for (const [x, z] of [[.18, .12], [.22, .3]]) add(G.sph(.05, 10, 8), P.red, x, .1, z); }));
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.3 * t; }, { label: '큰 도시락 바구니', sfx: 'open', dur: .35 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: .0, z: .45, parent: lid };
  // (봇 10/23: deep inside the hamper the thing hid below the rim — a tray lifts it up to the rim as the lid opens)
  f.pullOut(p, f.spot('inside', null, 0, .06, 0, { part: p, maxH: .28, label: '큰 바구니 안', scale: .65 }), 0, { w: .5, d: .34, color: '#e2b070', up: .3 });
  f.spot('behind', null, 0, 0, -.38, { maxH: .4, label: '큰 바구니 뒤', scale: .7 });
  f.walkSolids = [[-.33, 0, -.24, .33, .45, .24]];
};

B.ph_kite = f => {
  // a kite flying high on a long string from a stake with a reel, its tail of bows trailing (calm: it only bobs a little)
  f.add(mc('ph-kite-stake', ({ add, tube }) => { tube([0, 0, 0], [0, .35, 0], .02, P.woodD, 5); add(G.cyl(.07, .07, .06, 12), P.yellow, 0, .3, .04, HP, 0, 0); add(G.cyl(.03, .03, .1, 8), P.woodD, 0, .3, .04, HP, 0, 0); tuft(add, .15, .1, 1); }));
  const k = new THREE.Group(); k.position.set(-.9, 3.3, -1.4); f.add(k);
  k.add(mc('ph-kite', ({ add }) => {
    const sh = new THREE.Shape(); sh.moveTo(0, .45); sh.lineTo(.3, 0); sh.lineTo(0, -.55); sh.lineTo(-.3, 0); sh.closePath();
    add(new THREE.ExtrudeGeometry(sh, { depth: .02, bevelEnabled: false }), P.kite, 0, 0, 0, 0, .5, 0);
    add(G.box(.02, 1.0, .03, .005), '#ffffff', 0, -.05, .015, 0, .5, 0); add(G.box(.6, .02, .03, .005), '#ffffff', 0, 0, .015, 0, .5, 0);
    for (let i = 0; i < 6; i++) add(G.box(.1, .06, .015, .01), i % 2 ? P.kite2 : P.yellow, .02 * i, -.62 - i * .16, 0, 0, .5, i * .5 - 1);
  }));
  const line = new THREE.Mesh(G.cyl(.004, .004, 1, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  const a = new THREE.Vector3(0, .32, .04), b = new THREE.Vector3(-.9, 3.05, -1.4), d = b.clone().sub(a);
  line.position.copy(a.clone().add(b).multiplyScalar(.5)); line.scale.y = d.length(); line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); line.userData.noMerge = true; f.add(line);
  let last = -1;
  f.tick = t => { const s = Math.floor(t * 4); if (s === last) return; last = s; k.rotation.z = Math.sin(s * .9) * .08; k.position.y = 3.3 + Math.sin(s * .6) * .05; };
  f.live = [k];
  f.spot('on', null, .2, 0, .25, { maxH: .35, label: '연 얼레 옆', scale: .65 });
  f.walkSolids = [[-.05, 0, -.05, .05, .4, .05]];
};

B.ph_bubbles = f => {
  // a bubble bottle on a tiny stool and bubbles hanging in the air (soft, see-through)
  f.add(mc('ph-bubble-stool', ({ add }) => {
    add(G.cyl(.16, .16, .04, 14), '#7fd6c0', 0, .3, 0); for (const a of [0, 2.1, 4.2]) add(G.cyl(.02, .02, .3, 6), '#5cbfa8', Math.cos(a) * .12, .15, Math.sin(a) * .12);
    add(G.cyl(.05, .05, .14, 12), '#ffb3cf', 0, .39, 0); add(G.cyl(.03, .03, .03, 10), '#ffffff', 0, .475, 0); add(G.tor(.035, .006, PI * 2, 4, 12), '#ff8f6b', .08, .52, 0, 0, .3, 0);
  }));
  const bm = new THREE.MeshStandardMaterial({ color: '#dff4ff', transparent: true, opacity: .45, roughness: .1, depthWrite: false });
  for (const [x, y, z, r] of [[.2, .9, .1, .07], [.35, 1.2, -.05, .1], [.1, 1.45, .2, .06], [.5, 1.6, .15, .08], [.3, 1.9, -.1, .05], [-.1, 1.1, -.15, .05]]) { const m = new THREE.Mesh(G.sph(r, 14, 10), bm); m.position.set(x, y, z); m.userData.noMerge = true; m.layers.set(2); m.castShadow = false; f.add(m); }
  f.spot('under', null, 0, 0, .05, { maxH: .26, label: '비눗방울 의자 밑', scale: .6 });
  f.walkSolids = [[-.18, 0, -.18, .18, .45, .18]];
};

B.ph_blanket = (f, T, o = {}) => {
  // a second, smaller mat: a sky-blue one with a ball, a picture book and a sun hat
  f.add(mt('ph-blanket', TX.check(), ({ add }) => { add(G.box(1.2, .015, .9, .006), '#8fc8f2', 0, .008, 0, 0, 0, 0, 1, { w: .25 }); }));
  f.add(mc('ph-blanket-bits', ({ add }) => {
    add(G.sph(.12, 14, 10), '#ff8f6b', .35, .12, .2); add(G.box(.03, .24, .24, .01), '#ffffff', .35, .12, .2, 0, .5, 0);
    add(G.box(.26, .03, .2, .01), '#4a5a8a', -.3, .025, -.15, 0, .3, 0); add(G.box(.24, .006, .18, .003), '#ffd23f', -.3, .042, -.15, 0, .3, 0);
    add(G.cyl(.18, .2, .02, 18), '#f4e2b8', -.2, .02, .25); add(G.cyl(.09, .1, .08, 14), '#f4e2b8', -.2, .06, .25); add(G.tor(.095, .01, PI * 2, 4, 16), P.red, -.2, .07, .25, HP);
  }));
  f.spot('under', null, .2, .005, -.25, { maxH: .06, label: '파란 돗자리 밑', scale: .4 });
  f.spot('on', null, .05, .016, .0, { maxH: .35, label: '파란 돗자리 위', scale: .7 });
  f.walkSolids = [];
};

export const PH_BUILDERS = B;
const H = { hidden: true, price: 0 };
export const PH_INFO = {
  ph_land: { w: .1, d: .1, name: '소풍 잔디 언덕', ...H, floor: true },
  ph_mat: { w: 2, d: 2, name: '소풍 돗자리', ...H },
  ph_parasol: { w: 1, d: 1, name: '파라솔', ...H },
  ph_fountain: { w: 1, d: 1, name: '작은 분수', ...H },
  ph_acornhouse: { w: 1, d: 1, name: '도토리 집', ...H },
  ph_bigbasket: { w: 1, d: 1, name: '큰 도시락 바구니', ...H },
  ph_kite: { w: 1, d: 1, name: '연', ...H },
  ph_bubbles: { w: 1, d: 1, name: '비눗방울', ...H },
  ph_blanket: { w: 1, d: 1, name: '파란 돗자리', ...H },
};

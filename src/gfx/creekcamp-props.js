// 56판 개울가 징검다리 캠핑 — creekcamp (10/23, 스토리 룸 표: 캠핑장(51과 같음) → 새 맵. 시간제 · 너굴이, "너굴이가 캠핑장까지 따라와 시합").
// 둥근 섬의 왼쪽 앞을 개울이 휘감아 흐르고, 징검다리 건너 자갈 물가엔 카누와 낚싯대, 이쪽엔 흙 다진 캠프 자리: 큰 돔 텐트, 해먹,
// 버너 올린 캠핑 테이블, 손 펌프, 빨랫줄.
//   ck_land     섬 받침(풀·다진 흙 캠프 자리·자갈 물가) + 개울 — 바닥 노릇(layout.hideFloor)
//   ck_tent     큰 돔 텐트(부품 0: 앞문 걷기 — 안이 숨김 자리), 줄·말뚝, 문 앞 신발
//   ck_kitchen  접이식 캠핑 테이블 + 버너·주전자(부품 0: 주전자 뚜껑)·냄비·컵·도마·물통
//   ck_pump     손 펌프(부품 0: 손잡이를 내리면 물줄기 — 물펌프 레버 장치 15) + 양동이
//   ck_hammock  나무 두 그루 사이 해먹(부품 0: 해먹이 출렁 내려옴 — 해먹 레버 보조)
//   ck_line     빨랫줄(수건·양말·모자) · ck_canoe 뒤집어 둔 카누 · ck_rod 낚싯대 거치대와 통
import * as THREE from 'three';
import { mat, mesh } from './kit.js';
import { G, mc, mt, TX, PI, HP, island, blobOutline, ribbon, tuft, flower, bush, fern, pine } from './pc-kit.js';
import { EN } from '../i18n-en-dict.js';

const WORDS = { '개울가 징검다리 캠핑': 'Creekside Camp', '텐트 안': 'Inside the tent', '텐트 문': 'Tent door', '텐트 뒤': 'Behind the tent', '신발 옆': 'Beside the shoes',
  '캠핑 테이블 밑': 'Under the camp table', '캠핑 테이블 위': 'On the camp table', '주전자 안': 'Inside the kettle', '주전자 뚜껑': 'Kettle lid', '물통 뒤': 'Behind the water jug',
  '펌프 손잡이': 'Pump handle', '양동이 안': 'In the bucket', '펌프 뒤': 'Behind the pump', '해먹 위': 'In the hammock', '해먹 밑': 'Under the hammock', '해먹': 'Hammock', '나무 뒤': 'Behind the tree',
  '수건 속': 'In the towel', '빨랫줄 밑': 'Under the washing line', '카누 밑': 'Under the canoe', '카누 옆': 'Beside the canoe', '낚시 통 안': 'In the fishing tub', '자갈 물가': 'On the pebble beach' };
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

const B = {};
const P = { grass: '#a3d77e', lip: '#8fcc6e', camp: '#e3c69a', gravel: '#e6ded2', earth: '#a8785a', earthD: '#7f5a42', band: '#cfc6bf', stone: '#d8d2dc', stone2: '#b6aec4',
  water: '#8fd2ea', wood: '#e8b47a', woodD: '#a8693e', bark: '#9a6a48', leaf: '#6cbf5a', leaf2: '#56a84e', tent: '#ff9b4a', tent2: '#3fb6a0', tentIn: '#ffe0b8',
  steel: '#c9cfe0', steel2: '#8f97ab', navy: '#4a5a8a', red: '#ff6b5a', yellow: '#ffd23f', cream: '#fff4e2', rope: '#f2d8a2' };

// the room is 8 × 7 (x -4..4, z -3.5..3.5); the creek curls round the front left
export const CK_CREEK = [[-4.8, -1.7], [-3.7, -1.15], [-2.8, -.25], [-2.25, .85], [-1.9, 2.0], [-1.55, 3.2], [-1.3, 4.6]];
const OUT = blobOutline(4, 3.5, { pad: .75, round: 1.9, amp: .24, seed: 56, bulge: [[2.3, .35, .5], [-.4, .25, .5]] });

B.ck_land = f => {
  const water = ribbon(CK_CREEK, .85, .006), bank = ribbon(CK_CREEK, 1.25, .003);
  island(f, { key: 'ck-land', pts: OUT, top: P.grass, lip: P.lip, seed: 56,
    layers: [{ h: .2, color: P.earth, k: 0 }, { h: .3, color: P.band, k: -.04, stones: true }, { h: .24, color: P.earthD, k: -.14 }],
    tuft: '#5faa52', tuft2: '#7fc46a', pebble: P.stone,
    decorTex: ({ add }) => {
      // the packed-earth camp pad in the middle and the path to the stepping stones
      add(G.cyl(1, 1, .012, 28), P.camp, 1.05, .006, -.15, 0, .2, 0, [2.55, 1, 2.1], { w: 1.4 });
      for (const [x, z, sx, sz] of [[-1.2, .55, .55, .4], [-.55, .4, .45, .35]]) add(G.cyl(1, 1, .012, 18), P.camp, x, .007, z, 0, .3, 0, [sx, 1, sz], { w: 1.2 });
      // the pebble beach on the far side of the creek
      add(G.cyl(1, 1, .012, 22), P.gravel, -3.55, .005, 2.0, 0, .5, 0, [1.05, 1, 1.85], { w: .6 });
      add(bank.g, '#d9cfc2', 0, 0, 0, 0, 0, 0, 1, { w: .9 });
    },
    decor: ({ add }) => {
      const r = (i => () => (i = (i * 16807) % 2147483647) / 2147483647)(56);
      for (const side of [water.L, water.R]) side.forEach(([x, z], i) => { if (i % 2) return; const s = .06 + r() * .05; add(G.rock(i % 6 + 1, .25, 8, 6), r() < .5 ? P.stone : P.stone2, x, .03, z, 0, r() * 3, 0, [s * 1.3, s * .8, s]); });
      for (let k = 0; k < 26; k++) add(G.rock(k % 7 + 20, .25, 7, 5), k % 3 ? '#cfc6bb' : '#b9b0a6', -3.55 + (r() - .5) * 1.6, .02, 2.0 + (r() - .5) * 3.2, 0, r() * 3, 0, [.05, .03, .045]);
      // the fire ring (cold — the burner does the cooking) with three logs to sit on
      for (let k = 0; k < 9; k++) { const a = k / 9 * PI * 2; add(G.rock(k + 31, .22, 8, 6), k % 2 ? P.stone : P.stone2, 2.75 + Math.cos(a) * .32, .05, 1.4 + Math.sin(a) * .32, 0, k, 0, [.1, .08, .09]); }
      for (const [x, z, ry] of [[2.6, 1.35, .4], [2.9, 1.45, -.5]]) add(G.cyl(.04, .045, .4, 7), '#8a5a3a', x, .06, z, 0, ry, HP);
      add(G.sph(.08, 8, 6), '#4a4040', 2.75, .04, 1.4, 0, 0, 0, [1.4, .4, 1.4]);
      for (const [x, z] of [[-3.7, -.4], [.4, 3.1], [3.6, -.3], [3.2, 3.0], [-.6, -2.9], [2.0, -3.2]]) tuft(add, x, z, 1);
      for (const [x, z, c] of [[-.8, 3.2, '#ffffff'], [3.7, .4, '#ffd23f'], [-.2, -3.1, '#ffb3cf'], [3.4, 2.6, '#ffffff']]) flower(add, x, z, c);
      bush(add, 4.4, .6, .95); fern(add, -4.4, .7, 1); pine(add, -3.4, -4.0, 1.1); pine(add, 4.55, -2.2, 1.2); pine(add, 1.1, -4.3, .95); bush(add, 2.4, 4.1, .85); fern(add, -4.0, -2.9, 1);
    } });
  f.add(mt('ck-water', TX.water(), ({ addM }) => addM(water.g, new THREE.Matrix4(), P.water, { w: .8 })));
  f.walkSolids = [];
};

B.ck_tent = f => {
  // a fat dome tent: two crossing poles under an orange fly, a teal floor band, the front door's flap rolled by the part
  f.add(mt('ck-tent-fly', TX.cloth(), ({ add }) => {
    add(G.dome(.95, 20, 8), P.tent, 0, 0, 0, 0, 0, 0, [1.05, .95, .9], { w: .25 });
    add(G.cyl(.99, 1.0, .12, 20, true), P.tent2, 0, .06, 0, 0, 0, 0, [1.05, 1, .9], { w: .25 });
  }));
  f.add(mc('ck-tent-bits', ({ add, tube }) => {
    // poles crossing over the top, the door's dark opening, guy ropes and stakes, shoes, a doormat
    for (const a of [.75, -.75]) for (let k = 0; k < 10; k++) { const t0 = k / 10 * PI, t1 = (k + 1) / 10 * PI; tube([Math.cos(t0) * 1.0 * Math.cos(a), Math.sin(t0) * .91, Math.cos(t0) * .91 * Math.sin(a)], [Math.cos(t1) * 1.0 * Math.cos(a), Math.sin(t1) * .91, Math.cos(t1) * .91 * Math.sin(a)], .018, '#4a4f66', 5); }
    add(G.dome(.48, 14, 6), '#5a3e3a', 0, 0, .7, 0, 0, 0, [.9, 1.05, .35]);
    for (const [x, z] of [[-1.25, .7], [1.25, .7], [-1.25, -.75], [1.25, -.75]]) { tube([x * .62, .55, z * .62], [x, .02, z], .006, P.rope, 4); add(G.cyl(.012, .006, .14, 5), '#e8e8f0', x, .05, z, 0, 0, x > 0 ? -.3 : .3); }
    add(G.box(.7, .015, .4, .01), '#8fb7a0', 0, .008, 1.05);
    for (const s of [-1, 1]) { add(G.box(.11, .07, .24, .03), s > 0 ? '#ff6b5a' : '#4a5a8a', .2 * s + .3, .04, 1.1, 0, .2 * s, 0); add(G.box(.09, .02, .16, .01), '#ffffff', .2 * s + .3, .085, 1.08, 0, .2 * s, 0); }
    add(G.box(.28, .08, .18, .02), '#ffd23f', .55, .5, -.05, 0, .2, 0);
  }));
  // the door flap: rolls up (t 0: closed over the opening, 1: rolled at the top)
  const flap = new THREE.Group(); flap.position.set(0, .9, .74); f.add(flap);
  flap.add(mt('ck-tent-flap', TX.cloth(), ({ add }) => add(G.box(.86, .9, .03, .02), '#ffb070', 0, -.45, 0, -.18, 0, 0, 1, { w: .25 })));
  const roll = new THREE.Group(); roll.position.set(0, .9, .76); f.add(roll); roll.add(mc('ck-tent-roll', ({ add }) => add(G.cyl(.06, .06, .9, 10), '#ffb070', 0, 0, 0, 0, 0, HP)));
  roll.scale.setScalar(.01);
  const p = f.part('curtain', [flap, roll], t => { flap.scale.y = 1 - .92 * t; roll.scale.setScalar(Math.max(.01, t)); }, { label: '텐트 문', sfx: 'zip', dur: .5 });
  f.spot('inside', null, -.1, .02, .6, { part: p, maxH: .4, label: '텐트 안', scale: .8 });
  f.spot('behind', null, .3, 0, -1.05, { maxH: .5, label: '텐트 뒤', scale: .8 });
  f.spot('on', null, -.25, 0, 1.15, { maxH: .35, label: '신발 옆', scale: .65 });
  f.walkSolids = [[-1.0, 0, -.9, 1.0, .9, .85]];
};

B.ck_kitchen = f => {
  // a slatted folding table: burner, kettle, pot, two enamel cups, a chopping board with carrots, a water jug at its foot
  f.add(mt('ck-table', TX.plank(), ({ add }) => { for (let k = 0; k < 6; k++) add(G.box(.15, .03, .62, .008), P.wood, -.44 + k * .176, .62, 0, 0, 0, 0, 1, { w: .4 }); }));
  f.add(mc('ck-table-bits', ({ add, tube }) => {
    for (const sx of [-1, 1]) { tube([sx * .45, .6, -.25], [sx * .35, 0, .25], .014, P.steel2, 5); tube([sx * .45, .6, .25], [sx * .35, 0, -.25], .014, P.steel2, 5); }
    // burner: a squat steel box, black grate, blue flame ring, a gas can beside it
    add(G.box(.32, .08, .26, .02), P.steel, -.22, .675, 0); add(G.cyl(.09, .09, .01, 14), '#3a3a4a', -.22, .72, 0); add(G.tor(.06, .012, PI * 2, 4, 14), '#7fb8ff', -.22, .73, 0, HP);
    add(G.cyl(.05, .05, .16, 12), '#ff6b5a', -.42, .7, .16); add(G.cyl(.02, .02, .03, 8), '#3a3a4a', -.42, .795, .16);
    // the pot and cups, the chopping board
    add(G.cyl(.11, .1, .1, 16), P.steel, .2, .69, -.1); add(G.tor(.11, .008, PI * 2, 4, 16), P.steel2, .2, .74, -.1, HP); for (const s of [-1, 1]) add(G.box(.05, .015, .02, .005), '#3a3a4a', .2 + s * .13, .73, -.1);
    for (const [x, c] of [[.05, '#ffffff'], [.42, '#7fd6c0']]) { add(G.cyl(.045, .04, .08, 12), c, x, .675, .2); add(G.tor(.03, .009, PI, 4, 8), c, x + .05, .68, .2, 0, 0, -HP); add(G.tor(.044, .005, PI * 2, 3, 12), '#4a5a8a', x, .714, .2, HP); }
    add(G.box(.3, .02, .18, .01), '#f0cf9e', .32, .645, .14, 0, .3, 0); for (let k = 0; k < 3; k++) add(G.cone(.022, .12, 6), '#ff9f40', .27 + k * .05, .67, .12, 0, .3, HP);
    // the water jug (blue, tap at the front) and a crate under the table
    add(G.box(.28, .34, .2, .06), '#5fa8e8', .5, .17, .42); add(G.cyl(.02, .02, .05, 8), '#ffffff', .5, .08, .53, HP, 0, 0); add(G.box(.12, .03, .03, .01), '#ffffff', .5, .35, .42);
    add(G.box(.42, .24, .3, .02), '#8fb7a0', -.15, .12, -.05); add(G.box(.38, .02, .26, .01), '#ffd23f', -.15, .25, -.05);
  }));
  // the kettle on the burner: its lid lifts (t 0 → 1)
  f.add(mc('ck-kettle', ({ add, tube }) => { add(G.sph(.1, 14, 10), '#ffd23f', -.22, .8, 0, 0, 0, 0, [1, .85, 1]); tube([-.12, .8, 0], [-.04, .88, 0], .018, '#ffd23f', 6); tube([-.3, .88, 0], [-.14, .88, 0], .01, '#3a3a4a', 4); }));
  const lid = new THREE.Group(); lid.position.set(-.22, .88, 0); f.add(lid);
  lid.add(mc('ck-kettle-lid', ({ add }) => { add(G.dome(.055, 12, 4), '#ffc02a', 0, 0, 0); add(G.sph(.018, 8, 6), '#3a3a4a', 0, .055, 0); }));
  const p = f.part('lid', lid, t => { lid.position.y = .88 + .1 * t; lid.rotation.z = .6 * t; }, { label: '주전자 뚜껑', sfx: 'clink', dur: .3 });
  f.pullOut(p, f.spot('inside', null, -.22, .77, 0, { part: p, maxH: .1, label: '주전자 안', scale: .4 }), 0, { w: .08, d: .08, color: '#ffd23f', up: .14 });
  f.spot('under', null, .2, 0, .05, { maxH: .5, label: '캠핑 테이블 밑', scale: .8 });
  f.spot('on', null, .4, .64, -.15, { maxH: .3, label: '캠핑 테이블 위', scale: .65 });
  f.spot('behind', null, .5, 0, .2, { maxH: .35, label: '물통 뒤', scale: .6 });
  f.walkSolids = [[-.5, 0, -.32, .5, .8, .32], [.34, 0, .3, .66, .35, .54]];
};

B.ck_pump = f => {
  // a red cast-iron hand pump on a stone block, a spout, the long handle; a tin bucket under the spout
  f.add(mt('ck-pump-base', TX.stone(), ({ add }) => { add(G.box(.55, .3, .45, .05), P.stone, 0, .15, 0, 0, 0, 0, 1, { w: .3 }); add(G.box(.4, .03, .3, .02), '#c4bcc8', .05, .315, .05, 0, 0, 0, 1, { w: .3 }); }));
  f.add(mc('ck-pump', ({ add, tube }) => {
    add(G.cyl(.075, .09, .7, 14), '#e8574a', -.08, .66, -.05); add(G.cyl(.09, .09, .05, 14), '#c4473c', -.08, 1.03, -.05); add(G.sph(.06, 10, 8), '#c4473c', -.08, 1.08, -.05);
    tube([-.08, .82, -.05], [.12, .78, -.05], .035, '#e8574a', 8); tube([.12, .78, -.05], [.16, .7, -.05], .03, '#e8574a', 8);
    add(G.cyl(.15, .12, .2, 14, true), '#c9cfe0', .17, .42, -.02); add(G.tor(.15, .012, PI * 2, 4, 16), '#a9b2c8', .17, .52, -.02, HP); add(G.cyl(.14, .14, .01, 14), '#8fd2ea', .17, .48, -.02);
    tube([.04, .52, -.02], [.17, .66, -.02], .006, '#a9b2c8', 4); tube([.3, .52, -.02], [.17, .66, -.02], .006, '#a9b2c8', 4);
    tuft(add, -.3, .25, 1); add(G.rock(81, .2, 8, 6), P.stone2, .32, .05, .3, 0, 0, 0, [.12, .07, .1]);
  }));
  // the handle: swings down (t 0: up, 1: pressed) and a stream of water falls from the spout
  const hd = new THREE.Group(); hd.position.set(-.08, 1.0, -.05); f.add(hd);
  hd.add(mc('ck-pump-handle', ({ add, tube }) => { tube([0, 0, 0], [-.45, .2, 0], .022, '#4a4f66', 6); add(G.sph(.04, 8, 6), '#4a4f66', -.46, .2, 0); add(G.cyl(.03, .03, .1, 8), '#ffd23f', -.46, .2, 0, HP, 0, 0); }));
  hd.rotation.z = .35;
  const stream = mesh(G.cyl(.022, .03, .2, 8), mat('#bfe8f6', { opacity: .85 })); stream.position.set(.16, .58, -.05); stream.userData.noMerge = true; stream.scale.y = .01; f.add(stream);
  const p = f.part('lever', [hd, stream], t => { hd.rotation.z = .35 - .7 * t; stream.scale.y = Math.max(.01, t > .4 ? (t - .4) / .6 : 0); }, { label: '펌프 손잡이', sfx: 'creak', dur: .6 });
  f.spot('inside', null, .17, .34, -.02, { maxH: .14, label: '양동이 안', scale: .5 });
  f.spot('behind', null, -.05, 0, -.42, { maxH: .5, label: '펌프 뒤', scale: .75 });
  f.walkSolids = [[-.3, 0, -.25, .3, 1.1, .25]];
};

B.ck_hammock = f => {
  // two slim trees 2.2 m apart and a striped hammock slung between them (t: it dips and swings, then settles)
  f.add(mt('ck-hm-bark', TX.bark(), ({ add }) => { for (const x of [-1.1, 1.1]) add(G.cyl(.1, .14, 2.0, 10), P.bark, x, 1.0, 0, 0, 0, 0, 1, [1, 2]); }));
  f.add(mt('ck-hm-leaf', TX.leaf(), ({ add }) => { for (const [x, s] of [[-1.1, 1], [1.1, .9]]) { add(G.sph(.6 * s, 14, 10), P.leaf, x, 2.2, 0, 0, 0, 0, [1, .85, 1], { w: .7 }); add(G.sph(.42 * s, 12, 9), P.leaf2, x + .3, 2.0, .2, 0, 0, 0, 1, { w: .7 }); } }));
  const hm = new THREE.Group(); hm.position.set(0, 0, 0); f.add(hm);
  hm.add(mt('ck-hm-cloth', TX.cloth(), ({ add }) => {
    for (let k = 0; k < 9; k++) { const x = -.8 + k * .2, y = .95 - .45 * (1 - Math.pow(x / .85, 2)); add(G.box(.21, .03, .62, .01), k % 2 ? '#7fd6c0' : '#ffffff', x, y, 0, 0, 0, Math.atan(1.1 * x), 1, { w: .2 }); }
  }));
  hm.add(mc('ck-hm-ropes', ({ tube, add }) => { for (const s of [-1, 1]) { tube([s * 1.02, 1.2, 0], [s * .82, .96, .25], .008, P.rope, 4); tube([s * 1.02, 1.2, 0], [s * .82, .96, -.25], .008, P.rope, 4); } add(G.cap(.07, .3, 2, 8), '#ffd23f', -.35, .6, 0, 0, 0, HP); }));
  const p = f.part('lift', hm, t => { hm.rotation.x = Math.sin(t * PI * 2) * .14 * (1 - t * .7); hm.position.y = -.1 * Math.sin(t * PI); }, { label: '해먹', sfx: 'creak', dur: 1.0 });
  f.spot('on', hm, .2, .55, 0, { maxH: .3, label: '해먹 위', scale: .65 });
  f.spot('under', null, -.1, 0, .1, { maxH: .45, label: '해먹 밑', scale: .75 });
  f.spot('behind', null, 1.1, 0, -.35, { maxH: .5, label: '나무 뒤', scale: .75 });
  f.walkSolids = [[-1.25, 0, -.18, -.95, 2, .18], [.95, 0, -.18, 1.25, 2, .18]];
};

B.ck_line = f => {
  // a washing line on two poles: a big towel, socks, a cap, pegs
  f.add(mc('ck-line', ({ add, tube }) => {
    for (const x of [-.8, .8]) { add(G.cyl(.03, .035, 1.4, 8), P.woodD, x, .7, 0); add(G.sph(.04, 8, 6), P.woodD, x, 1.41, 0); }
    tube([-.8, 1.32, 0], [0, 1.26, 0], .006, '#ffffff', 4); tube([0, 1.26, 0], [.8, 1.32, 0], .006, '#ffffff', 4);
    for (const [x, c] of [[-.45, '#ff6b5a'], [-.3, '#ffffff']]) { add(G.box(.08, .2, .015, .01), c, x, 1.15, 0); add(G.box(.11, .06, .015, .01), c, x + .03, 1.06, 0); }
    add(G.dome(.1, 12, 5), '#4a5a8a', .55, 1.18, 0, HP, 0, 0, [1, .6, 1]); add(G.box(.12, .015, .07, .01), '#4a5a8a', .55, 1.13, .08);
    for (const x of [-.45, -.3, .05, .3, .55]) add(G.box(.015, .05, .02, .004), '#ffd23f', x, 1.28, 0);
  }));
  f.add(mt('ck-towel', TX.cloth(), ({ add }) => add(G.box(.5, .62, .025, .012), '#7fd6c0', .17, .97, 0, 0, 0, 0, 1, { w: .2 })));
  f.spot('behind', null, .17, .7, -.05, { maxH: .3, label: '수건 속', scale: .6 });
  f.spot('under', null, -.2, 0, .05, { maxH: .4, label: '빨랫줄 밑', scale: .7 });
  f.walkSolids = [[-.85, 0, -.06, -.75, 1.4, .06], [.75, 0, -.06, .85, 1.4, .06]];
};

B.ck_canoe = f => {
  // an upturned red canoe on the pebbles, a paddle leaning on it
  f.add(mt('ck-canoe', TX.plank(), ({ add }) => { add(G.sph(.5, 18, 10), '#ff7a5a', 0, .05, 0, 0, 0, 0, [2.0, .5, .55], { w: .4 }); }));
  f.add(mc('ck-canoe-bits', ({ add, tube }) => {
    add(G.tor(.5, .02, PI * 2, 4, 24), '#ffe3b0', 0, .05, 0, HP, 0, 0, [2.0, .55, 1]);
    tube([.6, .02, .4], [.1, .4, .25], .022, P.wood, 6); add(G.box(.12, .28, .03, .03), P.wood, .66, .05, .42, 0, .5, 1.2);
    add(G.box(.18, .14, .01, .004), '#ffffff', -.35, .22, .26, -.5, 0, 0);
  }));
  f.spot('under', null, -.2, 0, .1, { maxH: .2, label: '카누 밑', scale: .6 });
  f.spot('on', null, .3, 0, .55, { maxH: .4, label: '카누 옆', scale: .7 });
  f.walkSolids = [[-1.0, 0, -.3, 1.0, .3, .3]];
};

B.ck_rod = f => {
  // a fishing rod on a forked stick, its line in the water, a tub and a little stool
  f.add(mc('ck-rod', ({ add, tube }) => {
    tube([0, 0, 0], [0, .45, 0], .02, P.woodD, 5); tube([0, .4, 0], [-.06, .55, 0], .012, P.woodD, 4); tube([0, .4, 0], [.06, .55, 0], .012, P.woodD, 4);
    tube([.4, .1, .15], [-.9, 1.1, -.35], .012, '#4a4f66', 5); add(G.cyl(.04, .04, .05, 10), '#ffd23f', .28, .2, .1, 0, 0, HP);
    tube([-.9, 1.1, -.35], [-1.1, .02, -.5], .003, '#ffffff', 3); add(G.sph(.03, 8, 6), '#ff6b5a', -1.1, .03, -.5);
    add(G.cyl(.16, .14, .18, 14), '#5fa8e8', .45, .09, -.25); add(G.cyl(.15, .15, .01, 14), '#8fd2ea', .45, .17, -.25);
    add(G.cyl(.14, .14, .04, 12), P.wood, -.35, .3, .3); for (const a of [0, 2.1, 4.2]) tube([-.35, .28, .3], [-.35 + Math.cos(a) * .13, 0, .3 + Math.sin(a) * .13], .012, P.steel2, 4);
  }));
  f.spot('inside', null, .45, .06, -.25, { maxH: .14, label: '낚시 통 안', scale: .5 });
  f.spot('on', null, -.1, 0, .45, { maxH: .4, label: '자갈 물가', scale: .7 });
  f.walkSolids = [[.25, 0, -.45, .65, .2, -.05], [-.5, 0, .15, -.2, .32, .45]];
};

export const CK_BUILDERS = B;
const H = { hidden: true, price: 0 };
export const CK_INFO = {
  ck_land: { w: .1, d: .1, name: '개울가 캠핑장', ...H, floor: true },
  ck_tent: { w: 2, d: 2, name: '큰 돔 텐트', ...H },
  ck_kitchen: { w: 1, d: 1, name: '캠핑 테이블', ...H },
  ck_pump: { w: 1, d: 1, name: '손 펌프', ...H },
  ck_hammock: { w: 3, d: 1, name: '해먹', ...H },
  ck_line: { w: 2, d: 1, name: '빨랫줄', ...H },
  ck_canoe: { w: 2, d: 1, name: '카누', ...H },
  ck_rod: { w: 1, d: 1, name: '낚싯대', ...H },
};

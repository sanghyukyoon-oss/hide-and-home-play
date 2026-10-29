// 3판 B안 다시 — fishisle 「개굴이네 낚시 섬」 (10/24, 사용자 "새 낚시터 너무 실망… 셋 다 싱그럽고 깨끗한 느낌").
// 1차 B(fishing2)에서 스스로 짚은 실망 포인트와 고친 방향:
//   ① 섬이 넓은데 소품이 작고 듬성 → 섬을 7×6으로 줄이고 줌 1.3, 주인공들을 크게(큰 나무·개구리 지붕 가게·잔교)
//   ② 물이 진한 청록에 거친 줄무늬로 칙칙 → 맑은 민트빛 물, 결은 아주 옅게, 반짝임 몇 개, 가장자리는 하늘빛으로 스며듦
//   ③ 섬 테두리가 밋밋한 둥근 네모 → 앞 왼쪽은 하얀 모래사장, 나머지는 꽃·풀이 물 위로 늘어진 둔덕과 이끼 바위
//   ④ 싱그러움 부족 → 수국 덤불·꽃 무리·연한 연두 잔디, 흰·크림 포인트, 연한 그림자
// 부품은 원래 3판 그대로(옛 type + opts.gptHero): 나무 tree(새집 부품·나무 밑동·나무 뒤), 좌대 fishdock(릴), 덤불·갈대·도구함·미끼통·
// 간판·파라솔은 A안(fs3_*) 빌더를 같이 씀. 새 조각: fi_land(섬·물), fi_tree(큰 나무+그네, tree의 새 모양), fi_shop(개구리 지붕 미끼 가게),
// fi_pier(잔교·나룻배·통발).
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, fadeDisc, texCache, shade, cutFace, liner } from './kit.js';
import { G, mc, mt, TX, PI, HP, blobOutline, scaleOutline, shapeOf, tuft, flower } from './pc-kit.js';
import { fitText } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';
import { rng } from '../util.js';

const WORDS = { '개굴이네 낚시 섬': "Froggy's Fishing Isle", '그네 위': 'On the swing', '얼음 상자 안': 'In the ice box', '얼음 상자 뚜껑': 'Ice box lid', '가게 창가': 'On the shop window sill',
  '가게 처마 밑': 'Under the shop eaves', '가게 뒤': 'Behind the shop', '잔교 끝': 'At the end of the pier', '나룻배 안': 'In the rowboat', '통발 안': 'Inside the fish trap', '통발 줄': 'Fish trap rope',
  '모래사장 조개 옆': 'By the shells on the sand', '미끼': 'BAIT' };
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

const B = {}, TEX = texCache();
const P = { grass: '#a9e083', lip: '#97d673', sand: '#fbefcf', sand2: '#f1e0b4', water: '#8fe1e3', shallow: '#c9f3ec', rock: '#e2dce8', rock2: '#cbc3d8', moss: '#93d67a',
  bark: '#a26f4a', leaf: '#86d46c', leaf2: '#6cc35e', leaf3: '#b2e68c', wood: '#eab87e', woodD: '#b07848', plank: '#f2c68e', frog: '#6fcd6a', frog2: '#4fb35a',
  cream: '#fffaf0', white: '#ffffff', red: '#ff7a6a', yellow: '#ffd54a', navy: '#4a5878', lily: '#6cc05e', lotus: '#ffb8d2', hydra: ['#a9c2ff', '#c9a8ff', '#ffb8d8', '#9ad8ff'] };

// a softer water print than the shared one: faint ripple arcs and a few bright glints (the lake must read clean, not streaky)
const softWater = () => TEX.get('fi-water', () => { const t = canvasTex(256, 256, (x, w, h) => {
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); const r = rng(77);
  for (let i = 0; i < 18; i++) { const px = r() * w, py = r() * h, L = 8 + r() * 30, a0 = PI * (1.1 + r() * .3); x.strokeStyle = `rgba(70,140,160,${.04 + r() * .05})`; x.lineWidth = 1.5; x.beginPath(); x.arc(px, py, L, a0, a0 + .4 + r() * .5); x.stroke(); }
  for (let i = 0; i < 14; i++) { const px = r() * w, py = r() * h; x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 6 + r() * 8, py); x.stroke(); }
}); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t; });

// the island: a 7 × 6 map (x -3.5..3.5, z -3..3); the shore ~.65 m past it, a bay of sand at the front left
const OUT = blobOutline(3.5, 3, { pad: .65, round: 2.0, amp: .2, seed: 31, bulge: [[2.3, .5, .55], [-.6, .3, .5], [-2.1, .25, .5]] });

B.fi_land = f => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];
  // the lake: clear mint water, paler in the shallows, fading into the sky at its edge
  const lakeTex = TEX.get('fi-lake-map', () => { const t = softWater().clone(); t.needsUpdate = true; t.repeat.set(5, 5); return t; });
  const lakeM = new THREE.MeshStandardMaterial({ color: P.water, map: lakeTex, alphaMap: TEX.get('fi-lake-fade', () => fadeDisc(128, '#ffffff', r => r < .42 ? 1 : Math.max(0, 1 - (r - .42) / .58) ** 1.5)), transparent: true, depthWrite: false, roughness: .45 });
  const lake = new THREE.Mesh(new THREE.CircleGeometry(10, 64), lakeM); lake.rotation.x = -HP; lake.position.y = -.12; lake.renderOrder = -1; lake.receiveShadow = true; lake.userData.noMerge = true; f.add(lake);
  f.add(mt('fi-shallow', softWater(), ({ add }) => { add(G.slab(scaleOutline(OUT, .95), .02, 0), P.shallow, 0, -.115, 0, 0, 0, 0, 1, { w: 1.4 }); }));
  // under the lawn: the sand shelf just over the water all round, wider at the front-left bay
  f.add(mt('fi-sand', TX.dirt(), ({ add }) => {
    add(G.slab(scaleOutline(OUT, .3), .1, 0), P.sand, 0, -.19, 0, 0, 0, 0, 1, { w: 1.6 });
    add(G.cyl(1, 1, .1, 28), P.sand, -2.4, -.165, 2.35, 0, .6, 0, [1.9, 1, 1.25], { w: 1.6 });
  }));
  // the lawn: a soft rounded cap (no strata) that dips toward the bay
  const capG = () => { const pts = OUT.filter(([x, z]) => !(x < -1.0 && z > 1.3 && Math.hypot(x + 2.4, z - 2.35) < 1.75)); const g = new THREE.ExtrudeGeometry(shapeOf(scaleOutline(pts, -.1)), { depth: .12, bevelEnabled: true, bevelThickness: .1, bevelSize: .26, bevelSegments: 4, curveSegments: 4 }); g.rotateX(-HP); return g; };
  const cap = mt('fi-top', TX.grass(), ({ add }) => { add(capG(), P.grass, 0, -.22, 0, 0, 0, 0, 1, { w: 1.5 }); });
  cap.userData.floor = true; cap.receiveShadow = true; f.add(cap);
  // the bay's sand top inside the map (walkable), with shells and a starfish
  const bay = mt('fi-bay', TX.dirt(), ({ add }) => { add(G.cyl(1, 1, .02, 28), P.sand, -2.35, -.005, 2.3, 0, .6, 0, [1.35, 1, .9], { w: 1.6 }); }); bay.userData.floor = true; f.add(bay);
  f.add(mc('fi-shore', ({ add, tube }) => {
    const r = rng(31);
    // mossy rounded rocks half in the water, a few on the bay
    for (const [x, z, s, c] of [[3.9, -1.1, .32, P.rock], [4.1, -.55, .22, P.rock2], [-1.0, -3.85, .3, P.rock], [-.5, -4.0, .2, P.rock2], [3.0, 3.35, .26, P.rock], [-4.15, -1.6, .28, P.rock2], [-3.95, -1.1, .18, P.rock]]) {
      add(G.rock(Math.round(x * 7 + z * 3 + 40), .18, 12, 8), c, x, -.06, z, 0, x, 0, [s * 1.4, s * .8, s * 1.1]);
      add(G.sph(s * .9, 10, 6), P.moss, x, -.06 + s * .62, z, 0, 0, 0, [1.2, .3, 1]);
    }
    for (const [x, z, a] of [[-2.9, 2.6, .3], [-1.9, 2.75, 1.2], [-2.6, 1.9, 2.0]]) { add(G.cone(.07, .02, 7), '#ffd0c4', x, .02, z, 0, a, 0); add(G.box(.004, .004, .07, .001), '#f0a898', x, .032, z, 0, a, 0); }
    for (let k = 0; k < 5; k++) add(G.cap(.012, .06, 2, 4), '#ff9f6b', -1.6 + Math.cos(k * 1.256) * .04, .018, 2.05 + Math.sin(k * 1.256) * .04, HP, -k * 1.256, 0);
    // the lawn's edge rolling over the water: tufts, little flowers, the odd fern, skipping the sand bay
    OUT.forEach(([x, z], i) => {
      const L = Math.hypot(x, z) || 1, ix = x - x / L * .3, iz = z - z / L * .3;
      if (x < -1.0 && z > 1.3 && Math.hypot(x + 2.4, z - 2.35) < 1.9) return;
      if (i % 2 === 0) tuft(add, ix, iz, 1, '#6cc35e', '#93d977', -.02);
      else if (i % 5 === 1) flower(add, ix, iz, ['#ffffff', '#ffd54a', '#ffb8d2'][i % 3], .9, -.02);
    });
    // lily pads and lotus round the shore, sparkles on the open water, two fish shadows
    for (const [x, z, s, lotus] of [[-4.3, .9, 1, 1], [-4.5, 1.5, .75, 0], [4.25, 1.4, .9, 1], [4.4, 2.0, .7, 0], [1.2, -4.0, .85, 1], [.5, -4.2, .7, 0], [-.6, 4.1, .9, 0]]) {
      add(G.cyl(.25 * s, .25 * s, .012, 18, false), P.lily, x, -.1, z, 0, x * 3, 0, [1, 1, .92]); add(G.box(.14 * s, .014, .022, .003), '#57a84e', x + .09 * s, -.093, z, 0, x * 3, 0);
      if (lotus) { for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2; add(G.sph(.055, 8, 6), k % 2 ? P.lotus : '#ffd6e6', x + Math.cos(a) * .05, -.05, z + Math.sin(a) * .05, .55, -a, 0, [.7, 1, 1.45]); } add(G.sph(.035, 8, 6), '#ffe27a', x, -.03, z); }
    }
    for (const [x, z] of [[-5.2, -1.0], [5.0, -2.6], [2.5, -5.0], [-3.4, 4.6], [5.3, 3.5], [-1.8, -5.4]]) add(G.box(.22, .006, .03, .002), '#ffffff', x, -.098, z, 0, .3, 0);
    for (const [x, z, a] of [[-4.9, 2.6, .5], [-5.3, 3.0, .8]]) { add(G.sph(.17, 10, 6), '#5fb6c9', x, -.105, z, 0, a, 0, [1.6, .05, .7]); add(G.cone(.08, .15, 4), '#5fb6c9', x - Math.cos(a) * .3, -.105, z + Math.sin(a) * .3, 0, a, HP, [1, 1, .1]); }
    // clover patches and flower drifts on the lawn
    for (const [cx, cz] of [[1.0, 2.2], [-.4, -2.3], [2.8, .9], [-2.9, -.3]]) for (let k = 0; k < 7; k++) { const a = k * 2.4, rr = .08 + k * .05; add(G.sph(.045, 6, 4), k % 2 ? '#86cf6c' : '#9ddb80', cx + Math.cos(a) * rr, .012, cz + Math.sin(a) * rr, 0, 0, 0, [1, .2, 1]); }
    for (const [cx, cz, c] of [[.9, 2.5, '#ffffff'], [-.6, -2.55, '#ffd54a'], [3.0, 1.2, '#ffb8d2'], [-3.0, -.1, '#ffffff']]) for (let k = 0; k < 5; k++) flower(add, cx + Math.cos(k * 2.4) * (.1 + k * .05), cz + Math.sin(k * 2.4) * (.1 + k * .05), k % 2 ? c : '#ffffff', .85);
    // stepping stones from the pier up to the shop and over to the dock
    for (const [x, z, s] of [[1.95, 2.35, 1], [1.7, 1.75, .9], [1.9, 1.1, 1], [2.05, .45, .9], [.9, 2.0, .9], [.1, 1.65, 1], [-.7, 1.35, .9], [-1.5, 1.05, 1]]) { add(G.cyl(.2 * s, .22 * s, .05, 10), '#e7e1d6', x, .012, z, 0, x * 2, 0, [1, 1, .8]); add(G.cyl(.16 * s, .16 * s, .052, 10), '#f3eee6', x - .02, .014, z - .02, 0, x * 2, 0, [1, 1, .8]); }
    // bunting from the tree to the shop
    const A0 = [-1.6, 2.25, -1.4], A1 = [1.1, 1.75, -1.75]; tube(A0, A1, .006, '#ffffff', 3);
    for (let k = 1; k < 10; k++) { const t = k / 10, x = A0[0] + (A1[0] - A0[0]) * t, y = A0[1] + (A1[1] - A0[1]) * t - Math.sin(t * PI) * .25, z = A0[2] + (A1[2] - A0[2]) * t; add(G.cone(.07, .14, 3), [P.yellow, '#ffffff', P.frog, '#ffb8d2'][k % 4], x, y - .07, z, PI, .3, 0, [1, 1, .15]); }
  }));
  f.walkSolids = [];
};

// ── 큰 나무 (tree의 새 모양): a big lush tree, a rope swing from its low bough; the birdhouse part and places are the park tree's ──
B.fi_tree = f => {
  const S = 1.35;
  f.add(mt('fi-tree-bark', TX.bark(), ({ add, tube }) => {
    add(G.cyl(.15 * S, .24 * S, 1.3 * S, 16), P.bark, 0, .65 * S, 0, 0, 0, 0, 1, [1.4, 1.2]);
    for (let i = 0; i < 5; i++) { const a = i * 1.25 + .7; tube([Math.sin(a) * .12, .22, Math.cos(a) * .12], [Math.sin(a) * .45, .02, Math.cos(a) * .45], .1, P.bark, 10, .035); }
    tube([.05, 1.15 * S, 0], [.75, 1.2 * S + .15, .25], .08, P.bark, 8, .05); tube([-.04, 1.2 * S, .02], [-.4, 1.5 * S, .12], .07, P.bark, 8, .05);
  }));
  f.add(put(new THREE.Mesh(G.sph(.12, 14, 10), mat('#3b2a33')), 0, .12, .2, 0, 0, 0, [1, 1.25, .38]));
  f.spot('behind', null, 0, 0, .38, { maxH: .25, label: '나무 밑동', scale: .7 });
  f.add(mt('fi-tree-crown', TX.leaf(), ({ add }) => {
    for (const [x, y, z, r, c] of [[0, 2.35, 0, .85, P.leaf], [-.55, 2.1, .1, .58, P.leaf2], [.6, 2.15, -.05, .6, P.leaf3], [.05, 2.85, -.08, .58, P.leaf3], [.18, 2.15, .48, .5, P.leaf], [-.18, 2.25, -.48, .52, P.leaf2], [.75, 2.55, .35, .4, P.leaf]])
      add(G.sph(r, 18, 12), c, x, y, z, 0, 0, 0, [1, .9, 1], { w: .7 });
  }));
  f.add(mc('fi-tree-bits', ({ add, tube }) => {
    for (const [x, y, z] of [[-.3, 2.6, .55], [.45, 2.5, .55], [-.66, 2.25, .45], [.15, 3.25, .2], [.75, 2.3, .4], [-.08, 2.25, .9], [-.6, 2.7, -.1], [.4, 2.95, .45], [-.35, 3.0, .35], [.8, 2.6, -.2], [.25, 2.0, .85]]) {
      for (let k = 0; k < 5; k++) { const a = k * 1.256; add(G.sph(.034, 6, 4), '#ffffff', x + Math.cos(a) * .035, y, z + Math.sin(a) * .035, 0, 0, 0, [1, .5, 1]); }
      add(G.sph(.018, 6, 4), P.yellow, x, y + .01, z);
    }
    // the swing: two ropes from the bough, a cream seat
    for (const dz of [-.18, .18]) tube([.62, 1.78, .2 + dz], [.62, .42, .2 + dz], .01, '#f0d8a2', 4);
    add(G.box(.22, .04, .5, .015), P.cream, .62, .4, .2); add(G.box(.23, .015, .51, .005), '#f0b8a8', .62, .425, .2);
  }));
  f.spot('on', null, .62, .43, .2, { maxH: .3, label: '그네 위', scale: .65 });
  const hx = 0, hy = .78, hz = .3;
  f.add(mt('fi-birdhouse', TX.plank(), ({ add }) => {
    add(G.box(.22, .03, .2, .006), '#ffd56a', hx, hy - .185, hz); for (const sx of [-1, 1]) add(G.box(.02, .2, .2, .006), '#ffd56a', hx + sx * .1, hy - .1, hz);
    add(G.box(.22, .2, .02, .006), '#ffd56a', hx, hy - .1, hz - .09); add(G.box(.22, .05, .02, .008), '#ffd56a', hx, hy - .125, hz + .09); add(G.box(.22, .04, .02, .008), '#ffd56a', hx, hy - .02, hz + .09);
  }));
  const roof = grp(put(mc('fi-bh-roof', ({ add }) => { add(G.box(.16, .025, .26, .008), P.red, -.06, .03, 0, 0, 0, .6); add(G.box(.16, .025, .26, .008), P.red, .06, .03, 0, 0, 0, -.6); add(G.sph(.022, 6, 4), '#ffffff', 0, .09, 0); }), 0, 0, 0));
  put(roof, hx, hy + .1, hz); f.add(roof);
  const p = f.part('lift', roof, (t, b) => { roof.position.y = b.p.y + .2 * t; roof.position.x = b.p.x + .12 * t; roof.rotation.z = -.5 * t; }, { label: '새집 지붕', sfx: 'lift' });
  f.spot('inside', null, hx, hy - .08, hz, { part: p, maxH: .18, label: '새집 안', scale: .55 });
  f.spot('behind', null, 0, 0, -.42, { maxH: .45, label: '나무 뒤', scale: .85 });
  f.walkSolids = [[-.32, 0, -.32, .32, 2, .32]];
};

// ── 개구리 지붕 미끼 가게 (2×2): a cream plank hut whose green roof wears two big frog eyes; a striped awning over the counter ──
const shopSign = () => TEX.get('fi-shop-sign', () => canvasTex(256, 80, c => { c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 256, 80); fitText(c, '미끼', 128, 42, 220, 54, '#3f8a4a'); }));
B.fi_shop = f => {
  f.add(mt('fi-shop-walls', TX.plank(), ({ add }) => {
    add(G.box(1.9, 1.3, 1.3, .04), P.cream, 0, .65, -.15, 0, 0, 0, 1, { w: .5 });
    add(G.box(1.7, .55, .32, .03), P.wood, 0, .275, .62, 0, 0, 0, 1, { w: .45 });
  }));
  f.add(mc('fi-shop', ({ add, tube }) => {
    // the frog roof: a rounded green dome-ish roof, two eyes on top, a rosy cheek each side
    add(G.sph(1, 24, 14), P.frog, 0, 1.3, -.15, 0, 0, 0, [1.12, .5, .82]);
    add(G.box(2.05, .06, 1.45, .03), P.frog2, 0, 1.3, -.15);
    for (const s of [-1, 1]) { add(G.sph(.26, 16, 12), P.frog, s * .5, 1.78, .1); add(G.sph(.17, 14, 10), '#ffffff', s * .5, 1.84, .24); add(G.sph(.08, 10, 8), '#2a2a3a', s * .5, 1.85, .38); add(G.sph(.025, 6, 4), '#ffffff', s * .5 + .03, 1.88, .44); add(G.sph(.12, 10, 6), '#ffb3b3', s * .92, 1.45, .48, 0, 0, 0, [1, .5, .3]); }
    tube([-.25, 1.62, .55], [.25, 1.62, .55], .02, '#3f8a4a', 5);
    // window, counter, awning, jars of worms, a scale, the door with a round window
    add(G.box(1.0, .5, .04, .02), '#5f8fa8', -.25, .82, .52); add(G.box(1.04, .04, .06, .01), P.white, -.25, 1.08, .53); add(G.box(1.1, .05, .22, .01), P.woodD, -.25, .56, .66);
    for (let k = 0; k < 7; k++) add(G.box(1.2 / 7, .03, .52, .006), k % 2 ? P.white : P.frog, -.76 + k * (1.2 / 7), 1.14, .78, -.45, 0, 0);
    for (const [x, c] of [[-.6, '#c9a46a'], [-.4, '#a8c46a']]) { add(G.cyl(.06, .06, .12, 10), '#e6f6ff', x, .64, .64); add(G.cyl(.05, .05, .08, 10), c, x, .63, .64); add(G.cyl(.062, .062, .02, 10), P.red, x, .71, .64); }
    add(G.box(.2, .04, .14, .01), '#c9cfe0', .05, .6, .65); add(G.cyl(.05, .05, .1, 10), '#9aa3ad', .05, .65, .65);
    add(G.box(.42, .9, .04, .02), '#7fcf9a', .65, .45, .51); add(G.cyl(.09, .09, .02, 14), '#e6f6ff', .65, .7, .535, HP, 0, 0); add(G.sph(.03, 8, 6), P.yellow, .52, .45, .54);
    // a rod rack and a flower box under the window, a little frog mailbox
    for (let k = 0; k < 3; k++) tube([1.0 + k * .08, 0, .25], [1.1 + k * .12, 1.35, .3], .01, k === 1 ? P.frog2 : P.navy, 4);
    add(G.box(.34, .06, .1, .01), P.woodD, 1.07, .45, .27);
    add(G.box(.7, .14, .16, .02), '#e8a87a', -.25, .44, .54); for (let k = 0; k < 6; k++) { add(G.sph(.045, 8, 6), ['#ffb8d2', '#ffffff', P.yellow][k % 3], -.52 + k * .11, .55, .56); add(G.sph(.04, 8, 6), P.leaf2, -.5 + k * .11, .5, .5); }
    add(G.cyl(.03, .03, .7, 6), P.woodD, -1.15, .35, .55); add(G.box(.22, .16, .26, .05), P.frog, -1.15, .76, .55); for (const s of [-1, 1]) add(G.sph(.04, 8, 6), '#ffffff', -1.15 + s * .06, .86, .62);
  }));
  const sign = mesh(new THREE.PlaneGeometry(.6, .18), mat('#ffffff', { map: shopSign() })); sign.position.set(-.25, 1.22, .54); f.add(sign);
  // the ice box on the counter end: its lid lifts (the thing inside comes up with it)
  f.add(mc('fi-icebox', ({ add }) => { add(cutFace(G.box(.42, .3, .3, .03)), '#5fa8e8', -1.25, .15, .9); add(liner(.36, .22, .24), shade('#5fa8e8', -.15), -1.25, .19, .9); add(G.box(.44, .03, .03, .01), '#ffffff', -1.25, .2, 1.06); }));
  const lid = new THREE.Group(); lid.position.set(-1.25, .3, .75); f.add(lid);
  lid.add(mc('fi-icebox-lid', ({ add }) => { add(G.box(.44, .05, .32, .02), '#ffffff', 0, .025, .15); }));
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.3 * t; }, { label: '얼음 상자 뚜껑', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, -1.25, .08, .9, { part: p, maxH: .2, label: '얼음 상자 안', scale: .55 }), 0, { w: .22, d: .15, color: '#e6f6ff', up: .2 });
  f.spot('on', null, -.05, .59, .66, { maxH: .25, label: '가게 창가', scale: .55 });
  f.spot('under', null, .95, 0, .95, { maxH: .4, label: '가게 처마 밑', scale: .7 });
  f.spot('behind', null, -.4, 0, -1.0, { maxH: .5, label: '가게 뒤', scale: .75 });
  f.walkSolids = [[-.98, 0, -.82, .98, 1.8, .8], [-1.48, 0, .73, -1.02, .35, 1.07]];
};

// ── 잔교 (1×1, off the shore): planks out over the water, the green rowboat tied alongside, a fish trap off its end ──
B.fi_pier = f => {
  f.noOccupied = true;
  const L = 2.4;
  f.add(mt('fi-pier-deck', TX.plank(), ({ add }) => { for (let k = 0; k < 12; k++) add(G.box(1.0, .05, L / 12 - .03, .01), k % 4 ? P.plank : '#e3b77d', 0, .02, .15 + k * L / 12, 0, (k % 2 - .5) * .03, 0, 1, { w: .45 }); }));
  f.add(mt('fi-pier-posts', TX.bark(), ({ add }) => { for (const z of [.2, 1.3, L]) for (const x of [-.52, .52]) add(G.cyl(.065, .075, .72, 9), P.woodD, x, -.04, z, 0, 0, 0, 1, [1, 1]); }));
  f.add(mc('fi-pier-bits', ({ add, tube }) => {
    tube([.52, .32, .2], [.52, .28, L], .016, '#f0d8a2', 5); for (const z of [.2, 1.3, L]) add(G.sph(.08, 8, 6), P.woodD, .52, .32, z);
    // the boat in frog green with a cream band, seats and oars
    add(G.sph(.55, 18, 10), P.frog, -1.15, -.05, 1.45, 0, 0, 0, [.66, .38, 1.6]); add(G.sph(.5, 18, 10), '#3f8a4a', -1.15, .02, 1.45, 0, 0, 0, [.58, .25, 1.48]);
    add(G.tor(.55, .035, PI * 2, 4, 24), P.cream, -1.15, .06, 1.45, HP, 0, 0, [.66, 1.6, 1]);
    for (const z of [1.0, 1.85]) add(G.box(.66, .04, .17, .01), P.wood, -1.15, .1, z);
    for (const s of [-1, 1]) { tube([-1.15 + s * .34, .14, 1.4], [-1.15 + s * .8, -.1, 1.1], .02, P.wood, 5); add(G.box(.11, .015, .26, .01), P.wood, -1.15 + s * .85, -.11, 1.03); }
    tube([-.55, .22, 1.35], [-.8, .1, 1.4], .01, '#f0d8a2', 4);
    // a tin bucket and a coiled rope on the planks, a little white flag on the last post
    add(G.cyl(.12, .1, .18, 12), '#d6dce6', .2, .14, .7); add(G.tor(.1, .006, PI, 3, 10), '#9aa3ad', .2, .23, .7);
    add(G.tor(.11, .03, PI * 2, 5, 14), '#f0d8a2', -.22, .07, 1.85, HP, 0, 0);
    tube([-.52, .3, L], [-.52, .85, L], .012, '#ffffff', 4); add(G.box(.2, .12, .006, .003), P.frog, -.42, .78, L);
  }));
  const tr = new THREE.Group(); tr.position.set(.52, -.3, L + .25); f.add(tr);
  tr.add(mt('fi-trap', TX.cloth(), ({ add }) => { add(G.cyl(.17, .21, .46, 12, true), '#e0b878', 0, 0, 0, HP, 0, 0, 1, [3, 1]); add(G.cone(.17, .18, 12, true), '#e0b878', 0, 0, -.32, -HP, 0, 0, 1, [3, 1]); }));
  tr.add(mc('fi-trap-rings', ({ add }) => { for (const z of [-.2, 0, .2]) add(G.tor(.19, .012, PI * 2, 3, 14), '#a8733f', 0, 0, z); }));
  const rope = mesh(G.cyl(.008, .008, 1, 4), mat('#f0d8a2')); rope.userData.noMerge = true; f.add(rope);
  const setRope = () => { const top = .3, y = tr.position.y + .19; rope.position.set(.52, (top + y) / 2, L + .15); rope.scale.y = Math.max(.02, top - y); };
  setRope();
  const p = f.part('lift', [tr, rope], t => { tr.position.y = -.3 + .52 * t; tr.rotation.x = -.6 * t; setRope(); }, { label: '통발 줄', sfx: 'blub', dur: .9 });
  f.pullOut(p, f.spot('inside', tr, 0, -.08, .05, { part: p, maxH: .18, label: '통발 안', scale: .5 }), 0, { w: .2, d: .26, color: '#e0b878', up: .1 });
  f.spot('on', null, -.1, .045, 2.1, { maxH: .35, label: '잔교 끝', scale: .7 });
  f.spot('on', null, -1.15, .02, 1.75, { maxH: .26, label: '나룻배 안', scale: .6 });
  f.walkSolids = [];
};

export const FI_BUILDERS = B;
const H = { hidden: true, price: 0 };
export const FI_INFO = {
  fi_land: { w: .1, d: .1, name: '개굴이네 낚시 섬', ...H, floor: true },
  fi_shop: { w: 2, d: 2, name: '개구리 지붕 미끼 가게', ...H },
  fi_pier: { w: 1, d: 1, name: '잔교', ...H, floor: true },
};

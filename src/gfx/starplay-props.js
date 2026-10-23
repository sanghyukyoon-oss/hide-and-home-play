// 45판 별 지붕 밤 놀이터 — starplay (10/23, 스토리 룸 표: 놀이터(43과 같이 씀) → 새 맵. 숨은그림 · 밤 · 개굴이, 밤 탐험,
// "다음엔 큰 공원에서! 내가 숨을 거야."). GPT 후보 gptplaynight(전망대 돔·그네·뒤 단지 집)를 골격만 참고해 우리 덩어리 모델로:
// 둥근 섬 위 말랑한 고무 바닥 놀이터, 별 모양 지붕을 얹은 놀이탑(미끄럼틀), 둥근 정글짐 돔, 그네, 뺑뺑이, 가로등 둘(빛 웅덩이),
// 뒤로 불 켜진 단지 아파트 두 동이 낮게 서 있음.
//   sp_land      섬 받침 + 고무 바닥(파스텔 두 색)·보도블록 길·잔디 테 + 뒤 담장·아파트 실루엣 — 바닥 노릇(layout.hideFloor)
//   sp_startower 별 지붕 놀이탑: 계단·난간·미끄럼틀, 지붕 위 큰 별(부품 0: 별이 빙글 돌며 반짝 — 별 등불)
//   sp_dome      둥근 정글짐 돔(달 쿠션이 안에)
//   sp_swings    그네 두 개(부품 0: 그네가 흔들)
//   sp_spinner   뺑뺑이(부품 0: 빙글)
//   sp_lamp      놀이터 가로등(부품 0: 등을 끄면 바닥에 그림자 그림이 나타남 — 그림자 장치 28)
import * as THREE from 'three';
import { mat, mesh, starShape, canvasTex } from './kit.js';
import { G, mc, mt, TX, PI, HP, island, blobOutline, tuft, flower, bush } from './pc-kit.js';
import { EN } from '../i18n-en-dict.js';
import { fitText } from './gpt-paper.js';

const WORDS = { '별 지붕 밤 놀이터': 'Star-Roof Night Playground', '놀이탑 밑': 'Under the play tower', '놀이탑 위': 'Up on the play tower', '미끄럼틀 끝': 'At the foot of the slide', '별 등불 상자': 'Star lamp box',
  '별 등불': 'Star lamp', '정글짐 돔 안': 'Inside the climbing dome', '달 쿠션 밑': 'Under the moon cushion', '정글짐 돔 뒤': 'Behind the climbing dome', '그네': 'Swings', '그네 밑': 'Under the swings',
  '그네 기둥 뒤': 'Behind the swing post', '뺑뺑이': 'Merry-go-round', '뺑뺑이 위': 'On the merry-go-round', '뺑뺑이 밑': 'Under the merry-go-round', '가로등': 'Lamp post', '가로등 밑': 'Under the lamp post',
  '담장 앞': 'By the fence', '화단 속': 'In the flower bed' };
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

const B = {};
const P = { grass: '#a5d482', lip: '#8fcc6e', mat1: '#f7c9b8', mat2: '#c9d9f2', pave: '#efe2cf', paveJ: '#d8c8b2', earth: '#a8785a', earthD: '#7f5a42', band: '#d6cdc2',
  star: '#ffd23f', starD: '#f0b52a', post: '#5fa8e8', post2: '#ff8f6b', deck: '#f2c48c', slide: '#7fd6c0', slideD: '#5cbfa8', steel: '#c9cfe0', steel2: '#8f97ab',
  apt: '#efe6f2', apt2: '#d9cde0', roof: '#7d7fa6', win: '#ffe7a6', fence: '#f5e6cc', navy: '#4a5a8a', red: '#ff6b5a', cream: '#fff4e2', moon: '#fff1b8' };

const OUT = blobOutline(4, 3.5, { pad: .7, round: 1.9, amp: .2, seed: 45, bulge: [[-1.6, .25, .5], [2.6, .2, .4]] });

B.sp_land = f => {
  island(f, { key: 'sp-land', pts: OUT, top: P.grass, lip: P.lip, seed: 45,
    layers: [{ h: .18, color: '#d9c4a5', k: 0 }, { h: .28, color: P.band, k: -.03, stones: true }, { h: .24, color: P.earthD, k: -.13 }],
    pebble: '#e6ddd0',
    // the soft rubber play floor in two pastel patches, a brick path round them
    decorTex: ({ add }) => {
      add(G.slab([[-3.6, -2.2], [-.3, -2.6], [.4, .2], [-1.2, 1.6], [-3.5, 1.4]], .012, 0), P.mat1, 0, .004, 0, 0, 0, 0, 1, { w: 1.6 });
      add(G.slab([[.6, -2.8], [3.6, -2.4], [3.7, .6], [1.0, .9], [.2, -.6]], .012, 0), P.mat2, 0, .004, 0, 0, 0, 0, 1, { w: 1.6 });
      add(G.slab([[-3.8, 1.9], [3.8, 1.3], [3.9, 2.6], [-3.8, 3.1]], .01, 0), P.pave, 0, .003, 0, 0, 0, 0, 1, { w: .5 });
    },
    decorTexMap: TX.dirt(),
    decor: ({ add, tube }) => {
      // stars painted on the rubber, a hopscotch, the path's kerb
      for (const [x, z, s, c] of [[-2.2, -.6, 1, '#ffffff'], [1.9, -1.0, .8, '#ffd23f'], [-.6, -1.6, .7, '#ffffff'], [2.8, .1, .6, '#ffffff']]) add(new THREE.ExtrudeGeometry(starShape(.22 * s, .1 * s), { depth: .006, bevelEnabled: false }), c, x, .018, z, -HP, 0, 0);
      for (let k = 0; k < 6; k++) add(G.box(.32, .006, .32, .004), k % 2 ? '#ffffff' : '#ffe2a8', -1.0 + (k % 2) * .34, .016, 2.0 + Math.floor(k / 2) * .34 - .2);
      // the low fence along the back, the apartments' lit windows beyond it (a calm frame — nobody goes there)
      for (let k = 0; k < 16; k++) { const x = -3.9 + k * .52; add(G.box(.06, .5, .05, .015), P.fence, x, .25, -3.85 - Math.sin(x * .4) * .1); }
      for (const z of [.18, .4]) tube([-3.9, z, -3.85], [3.9, z, -3.85 - Math.sin(3.9 * .4) * .1], .02, P.fence, 5);
      for (const [x, z, w, h] of [[-2.2, -4.8, 2.2, 2.6], [1.6, -4.9, 2.6, 2.2]]) {
        add(G.box(w, h, 1.0, .05), P.apt, x, h / 2 - .3, z); add(G.box(w + .1, .12, 1.1, .03), P.roof, x, h - .24, z);
        for (let r = 0; r < Math.floor(h / .55); r++) for (let c = 0; c < Math.floor(w / .5); c++) { const lit = (r * 7 + c * 3 + (x > 0 ? 1 : 0)) % 3 !== 0; add(G.box(.26, .3, .02, .01), lit ? P.win : '#8f8fb0', x - w / 2 + .3 + c * .5, .05 + r * .55, z + .51); }
      }
      bush(add, -4.35, -1.2, .9); bush(add, 4.4, -.6, .9); bush(add, -4.3, 2.4, .8); bush(add, 4.35, 2.6, .85);
      for (const [x, z] of [[-3.9, .4], [3.9, 1.0], [.3, 3.7], [-2.0, 3.6], [2.4, 3.5]]) tuft(add, x, z, 1);
      for (const [x, z, c] of [[-3.8, 3.2, '#ffffff'], [3.7, -1.6, '#ffb3cf'], [.9, 3.6, '#ffd23f']]) flower(add, x, z, c);
    } });
  f.walkSolids = [];
};

B.sp_startower = f => {
  // the hero (검토 10/23 "'별 지붕'이 주인공이 되게 크게"): a 1.3 m deck on four posts under a big five-point star roof (2.7 m across,
  // little bulbs on its tips), a ladder up the back, a long wavy slide down the front; on the deck a small star box and a crank on
  // the post — the part turns the crank, the little star lamp on the roof spins and glows and the box's lid pops up (②b 45판 연쇄)
  const DY = 1.3, RY = 2.75;
  f.add(mt('sp-deck', TX.plank(), ({ add }) => { add(G.box(1.7, .1, 1.7, .02), P.deck, 0, DY, 0, 0, 0, 0, 1, { w: .4 }); for (let k = 0; k < 7; k++) add(G.box(.08, .55, .03, .01), P.deck, -.6 + k * .2, DY + .33, -.85, 0, 0, 0, 1, { w: .3 }); }));
  f.add(mc('sp-tower', ({ add, tube }) => {
    for (const [x, z] of [[-.8, -.8], [.8, -.8], [-.8, .8], [.8, .8]]) { add(G.cyl(.08, .08, RY, 12), P.post, x, RY / 2, z); add(G.sph(.1, 10, 8), P.post2, x, DY - .05, z); }
    tube([-.8, DY + .55, .8], [-.25, DY + .55, .8], .035, P.post2, 6); tube([-.8, DY + .55, -.8], [-.8, DY + .55, .8], .035, P.post2, 6); tube([.8, DY + .55, -.8], [.8, DY + .55, .8], .035, P.post2, 6);
    // ladder at the back left
    for (const s of [-1, 1]) tube([-1.0 + s * .2, 0, -1.25], [-1.0 + s * .2, DY, -.82], .035, P.post2, 6);
    for (let k = 1; k < 7; k++) tube([-1.2, k * .19, -1.25 + k * .062], [-.8, k * .19, -1.25 + k * .062], .022, P.steel, 5);
    // the slide: a long wavy chute from the deck's front edge down to the right
    for (let k = 0; k < 12; k++) { const t0 = k / 12, t1 = (k + 1) / 12, y0 = DY - 1.2 * t0 + Math.sin(t0 * PI * 2) * .07, y1 = DY - 1.2 * t1 + Math.sin(t1 * PI * 2) * .07;
      const x0 = .35 + t0 * .45, x1 = .35 + t1 * .45, z0 = .85 + t0 * 1.6, z1 = .85 + t1 * 1.6, L = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
      const m = new THREE.Matrix4().lookAt(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1), new THREE.Vector3(0, 1, 0));
      const g = G.box(.6, .05, L + .02, .015); g.applyMatrix4(m); add(g, P.slide, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      for (const s of [-1, 1]) { const gg = G.box(.05, .14, L + .02, .015); gg.applyMatrix4(m); add(gg, P.slideD, (x0 + x1) / 2 + s * .3, (y0 + y1) / 2 + .07, (z0 + z1) / 2); } }
    // the star roof: a thick five-point star with a paler top and bulbs on its tips
    const sg = new THREE.ExtrudeGeometry(starShape(1.4, .66), { depth: .16, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 2 }); sg.rotateX(-HP); add(sg, P.star, 0, RY, 0, 0, .3, 0);
    const sg2 = new THREE.ExtrudeGeometry(starShape(1.05, .5), { depth: .02, bevelEnabled: false }); sg2.rotateX(-HP); add(sg2, '#fff1a8', 0, RY + .2, 0, 0, .3, 0);
    for (let k = 0; k < 5; k++) { const a = .3 + PI / 2 + k * PI * 2 / 5; add(G.sph(.07, 8, 6), '#fff7d6', Math.cos(a) * 1.35, RY + .12, -Math.sin(a) * 1.35); }
    add(G.cyl(.04, .04, .4, 8), P.steel2, 0, RY + .38, 0);
    // a sign plate on the deck front, a little sandpit under it with a bucket
    add(G.box(.6, .22, .025, .02), '#ffffff', -.2, DY - .12, .86); for (let k = 0; k < 3; k++) add(new THREE.ExtrudeGeometry(starShape(.05, .022), { depth: .006, bevelEnabled: false }), P.star, -.38 + k * .18, DY - .12, .875);
    add(G.cyl(.7, .72, .05, 20), '#f3dca6', -.1, .025, -.05); add(G.cyl(.08, .06, .1, 10), '#ff8f6b', .25, .08, -.3); add(G.box(.18, .02, .06, .01), '#5fa8e8', -.35, .06, .2, 0, .5, 0);
  }));
  // the little star lamp on the roof: turns and glows
  const st = new THREE.Group(); st.position.set(0, RY + .78, 0); f.add(st);
  st.add(mc('sp-star', ({ add }) => {
    const g = new THREE.ExtrudeGeometry(starShape(.36, .17), { depth: .12, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2 }); g.center(); add(g, '#fff07a', 0, 0, 0);
  }));
  const glowM = new THREE.MeshBasicMaterial({ color: '#fff2a0', transparent: true, opacity: 0, depthWrite: false });
  const glow = new THREE.Mesh(G.sph(.5, 14, 10), glowM); glow.userData.noMerge = true; glow.layers.set(2); glow.castShadow = false; st.add(glow);
  // the crank on the front-right post (it is the handle) and the star box on the deck
  const cr = new THREE.Group(); cr.position.set(.8, DY + .35, .92); f.add(cr);
  cr.add(mc('sp-crank', ({ add, tube }) => { add(G.cyl(.09, .09, .05, 14), P.post2, 0, 0, 0, HP, 0, 0); tube([0, 0, .03], [0, .16, .03], .02, P.steel2, 5); add(G.cyl(.03, .03, .1, 8), P.star, 0, .16, .08, HP, 0, 0); }));
  f.add(mt('sp-starbox', TX.plank(), ({ add }) => add(G.box(.42, .2, .3, .02), '#ff9f6b', .25, DY + .15, -.3, 0, 0, 0, 1, { w: .3 })));
  const lid = new THREE.Group(); lid.position.set(.25, DY + .25, -.45); f.add(lid);
  lid.add(mc('sp-starbox-lid', ({ add }) => { add(G.box(.44, .05, .32, .015), '#ffb08f', 0, .025, .15); add(new THREE.ExtrudeGeometry(starShape(.07, .03), { depth: .01, bevelEnabled: false }), P.star, 0, .05, .15, -HP, 0, 0); }));
  const p = f.part('lift', [st, cr, lid, glow], t => {
    cr.rotation.z = -PI * 4 * Math.min(1, t * 1.3); st.rotation.y = PI * 2 * t; glowM.opacity = .3 * Math.min(1, t * 2); lid.rotation.x = -1.4 * Math.max(0, (t - .55) / .45);
  }, { label: '별 등불', sfx: 'special', dur: 1.6 });
  f.pullOut(p, f.spot('inside', null, .25, DY + .07, -.3, { part: p, maxH: .22, label: '별 등불 상자', scale: .55 }), 0, { w: .34, d: .24, color: '#ffb08f', up: .2 });
  f.spot('under', null, .1, 0, .2, { maxH: .5, label: '놀이탑 밑', scale: .8 });
  f.spot('on', null, -.35, DY + .05, .25, { maxH: .4, label: '놀이탑 위', scale: .7 });
  f.spot('on', null, 1.0, 0, 2.6, { maxH: .4, label: '미끄럼틀 끝', scale: .7 });
  f.walkSolids = [[-.9, 0, -.9, -.7, RY, -.7], [.7, 0, -.9, .9, RY, -.7], [-.9, 0, .7, -.7, RY, .9], [.7, 0, .7, .9, RY, .9], [-1.25, 0, -1.3, -.75, DY, -.8], [.3, 0, .85, 1.1, 1.0, 1.9]];
};

B.sp_dome = f => {
  // a half-sphere climbing frame of curved bars (a few colours), a moon-shaped cushion inside
  f.add(mc('sp-dome', ({ add }) => {
    const R = 1.05, cols = ['#ff8f6b', '#5fa8e8', '#ffd23f', '#7fd6c0'];
    for (let k = 0; k < 8; k++) add(G.tor(R, .028, PI, 5, 20), cols[k % 4], 0, 0, 0, 0, k * PI / 8, 0);
    for (const y of [.3, .58]) { const r = Math.sqrt(R * R - y * y); add(G.tor(r, .026, PI * 2, 5, 28), P.steel, 0, y, 0, HP); }
    add(G.cyl(1.06, 1.1, .04, 24), '#e7dcef', 0, .02, 0);
    add(G.tor(.2, .09, PI * 1.35, 8, 16), P.moon, 0, .12, .05, HP, 0, .9);
  }));
  f.spot('inside', null, .15, .04, -.15, { maxH: .4, label: '정글짐 돔 안', scale: .7 });
  f.spot('under', null, -.05, .2, .1, { maxH: .1, label: '달 쿠션 밑', scale: .45 });
  f.spot('behind', null, 0, 0, -1.2, { maxH: .45, label: '정글짐 돔 뒤', scale: .75 });
  f.walkSolids = [[-1.05, 0, -1.05, 1.05, 1.0, 1.05]];
};

B.sp_swings = f => {
  // an A-frame with two swings
  f.add(mc('sp-swing-frame', ({ add, tube }) => {
    for (const s of [-1, 1]) { tube([s * 1.0, 0, -.45], [s * 1.0, 1.8, 0], .045, P.post, 7); tube([s * 1.0, 0, .45], [s * 1.0, 1.8, 0], .045, P.post, 7); add(G.sph(.07, 10, 8), P.post2, s * 1.0, 1.8, 0); }
    tube([-1.0, 1.8, 0], [1.0, 1.8, 0], .05, P.post2, 8);
  }));
  const seats = [];
  for (const [x, c] of [[-.45, '#ff8f6b'], [.45, '#ffd23f']]) {
    const g = new THREE.Group(); g.position.set(x, 1.78, 0); f.add(g); seats.push(g);
    g.add(mc('sp-swing|' + c, ({ add, tube }) => { for (const s of [-1, 1]) tube([s * .17, 0, 0], [s * .17, -1.3, 0], .008, P.steel2, 4); add(G.box(.42, .05, .2, .02), c, 0, -1.32, 0); }));
  }
  const p = f.part('lift', seats, t => { seats.forEach((g, i) => { g.rotation.x = Math.sin(t * PI * 3 + i) * .5 * (1 - t); }); }, { label: '그네', sfx: 'creak', dur: 1.4 });
  f.spot('under', null, .45, 0, .1, { maxH: .35, label: '그네 밑', scale: .7 });
  f.spot('behind', null, 1.1, 0, -.6, { maxH: .45, label: '그네 기둥 뒤', scale: .7 });
  f.walkSolids = [[-1.1, 0, -.55, -.9, 1.8, .55], [.9, 0, -.55, 1.1, 1.8, .55]];
};

B.sp_spinner = f => {
  // a round merry-go-round: a striped plate, a centre post with a wheel, handle bars
  const pl = new THREE.Group(); f.add(pl);
  pl.add(mc('sp-spinner', ({ add, tube }) => {
    add(G.cyl(.72, .72, .07, 24), '#ffb08f', 0, .19, 0);
    for (let k = 0; k < 6; k++) add(G.box(.62, .006, .16, .003), '#ffffff', Math.cos(k * PI / 3) * .34, .227, Math.sin(k * PI / 3) * .34, 0, -k * PI / 3, 0);
    add(G.cyl(.05, .05, .5, 10), P.steel, 0, .45, 0); add(G.tor(.16, .025, PI * 2, 5, 16), P.post, 0, .7, 0, HP);
    for (let k = 0; k < 4; k++) { const a = k * HP; tube([Math.cos(a) * .6, .23, Math.sin(a) * .6], [Math.cos(a) * .55, .62, Math.sin(a) * .55], .022, P.post, 5); tube([Math.cos(a) * .55, .62, Math.sin(a) * .55], [0, .62, 0], .02, P.post, 5); }
  }));
  f.add(mc('sp-spinner-base', ({ add }) => add(G.cyl(.25, .3, .16, 14), P.steel2, 0, .08, 0)));
  const p = f.part('lift', pl, t => { pl.rotation.y = t * PI * 4; }, { label: '뺑뺑이', sfx: 'gearUp', dur: 1.6 });
  f.spot('on', pl, .35, .23, .2, { maxH: .3, label: '뺑뺑이 위', scale: .65 });
  f.spot('under', null, -.45, 0, .45, { maxH: .12, label: '뺑뺑이 밑', scale: .5 });
  f.walkSolids = [[-.72, 0, -.72, .72, .7, .72]];
};

B.sp_lamp = (f, T, o = {}) => {
  // a tall park lamp: a navy post, a round warm globe; the part turns it off and a shadow picture shows on the ground
  f.add(mc('sp-lamp', ({ add }) => {
    add(G.cyl(.08, .1, .1, 12), P.navy, 0, .05, 0); add(G.cyl(.04, .05, 2.3, 10), P.navy, 0, 1.2, 0);
    add(G.cyl(.12, .08, .08, 12), P.navy, 0, 2.35, 0); add(G.cyl(.06, .06, .06, 10), P.navy, 0, 2.62, 0);
    add(G.box(.18, .12, .02, .02), '#ffffff', 0, 1.2, .045); add(G.sph(.025, 6, 4), '#ffd23f', 0, 1.2, .06);
  }));
  const globeM = new THREE.MeshBasicMaterial({ color: '#fff0b8' });
  const globe = new THREE.Mesh(G.sph(.16, 16, 12), globeM); globe.position.set(0, 2.5, 0); globe.userData.noMerge = true; f.add(globe);
  // the shadow picture (개굴이's game, ②b 45판 연쇄): when the lamp goes off a frog's shadow shows on the ground beside it, a time on
  // its belly — f.gptShadow.setCode('725') writes 7:25 (36판 gpt_nightshadow와 같은 약속)
  let code = '725';
  const draw = c => {
    c.clearRect(0, 0, 256, 256); c.fillStyle = 'rgba(30,24,52,.82)';
    c.beginPath(); c.ellipse(128, 150, 96, 74, 0, 0, 7); c.fill();
    for (const x of [78, 178]) { c.beginPath(); c.arc(x, 78, 34, 0, 7); c.fill(); }
    for (const [x, y] of [[44, 214], [212, 214]]) { c.beginPath(); c.ellipse(x, y, 34, 18, 0, 0, 7); c.fill(); }
    const t = code.length === 3 ? code[0] + ':' + code.slice(1) : code;
    fitText(c, t, 128, 156, 160, 66, '#fff3c4');
  };
  const tex = canvasTex(256, 256, draw);
  const shM = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), shM); sh.rotation.x = -HP; sh.position.set(.15, .016, .95); sh.userData.noMerge = true; sh.userData.noOcclude = true; sh.layers.set(2); sh.castShadow = false; f.add(sh);
  f.gptShadow = { g: sh, setCode(c) { code = String(c); draw(tex.image.getContext('2d')); tex.needsUpdate = true; }, setVisible(on) { shM.opacity = on ? 1 : 0; } };
  const p = f.part('flip', [globe, sh], t => { globeM.color.set(t > .5 ? '#7d7a99' : '#fff0b8'); shM.opacity = t; }, { label: '가로등', sfx: 'click', dur: .3 });
  f.spot('on', null, -.25, 0, .25, { maxH: .4, label: '가로등 밑', scale: .7 });
  f.walkSolids = [[-.1, 0, -.1, .1, 2.6, .1]];
};

export const SP_BUILDERS = B;
const H = { hidden: true, price: 0 };
export const SP_INFO = {
  sp_land: { w: .1, d: .1, name: '별 지붕 밤 놀이터', ...H, floor: true },
  sp_startower: { w: 3, d: 3, name: '별 지붕 놀이탑', ...H },
  sp_dome: { w: 2, d: 2, name: '정글짐 돔', ...H },
  sp_swings: { w: 2, d: 1, name: '그네', ...H },
  sp_spinner: { w: 1, d: 1, name: '뺑뺑이', ...H },
  sp_lamp: { w: 1, d: 1, name: '놀이터 가로등', ...H },
};

// 3판 개굴이의 낚시터 A안 레벨업 — fishing3 (10/24, 사용자 "A는 지금 정본 오리지널 베이스로 디테일과 느낌, 전체 레벨 올린 판…
// 셋 다 싱그럽고 깨끗한 느낌"). 원래 3판(fishing)의 구도·배치·부품은 그대로 두고 모델만 다시: 가구 type은 옛 그대로(pond·fishdock·
// tree·bench·fishsign·tacklebox·baitbucket·reeds·parasol·bush)이고 layout의 opts.gptHero로 이 빌더를 끼움 — 릴(reelcatch: type
// 'fishdock', 첫 spot이 그물망)·자리표(affinity PLACE.fishing)·대본이 그대로 돌아감. 부품·숨김 자리의 위치·종류·이름도 옛 빌더와 같음.
// 결: 1~10판처럼 덩어리 크고 귀엽게, 큰 면은 순하고 깨끗하게(크림·흰 포인트), 결(풀·돌·나무·물결)은 회색 질감으로.
//   fs3_pond    연못: 이끼 낀 둥근 돌 테두리, 물결·하늘 반사·물고기 그림자, 연잎(잎맥)·연꽃·부들
//   fs3_dock    낚시 좌대: 나뭇결 널판, 말뚝, 코르크 손잡이 낚싯대·초록 깃발, 릴·그물망(옛 좌대와 같은 부품)
//   fs3_tree    둥근 큰 나무: 결 있는 줄기·뿌리, 잎 덩어리와 흰 꽃, 노란 새집(지붕 부품)
//   fs3_bench   공원 벤치: 초록 철 다리, 나뭇결 판, 신문지(부품), 비둘기
//   fs3_sign    낚시터 간판: 크림 판에 물고기 그림·'낚시터' 글씨·개굴이 얼굴
//   fs3_tackle · fs3_bait · fs3_reeds · fs3_parasol · fs3_bush — 같은 부품, 더 고운 모델
//   fs3_hedge · fs3_fence — 북쪽 산울타리(꽃), 서쪽 하얀 울타리(덩굴꽃) — 원래 판의 벽 자리(layout walls는 none)
//   fs3_meadow  풀밭의 작은 것들: 클로버·들꽃 무리, 징검돌, 나비 둘·잠자리 하나(바닥 노릇 아님)
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, texCache } from './kit.js';
import { G, mc, mt, TX, PI, HP, tuft, flower } from './pc-kit.js';
import { fitText } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';

if (EN['낚시터'] == null) EN['낚시터'] = 'Fishing';
const B = {}, TEX = texCache();
const P = { water: '#76d0ea', water2: '#b5ecf8', deep: '#4fb6dc', stone: '#d9d3e2', stone2: '#c2bad2', moss: '#8fd27a', wood: '#eab87e', woodD: '#b07848', plank: '#f2c68e',
  bark: '#a26f4a', leaf: '#7fd06a', leaf2: '#62bb58', leaf3: '#a3de7e', lily: '#6cc05e', lotus: '#ffb8d2', cream: '#fffaf0', white: '#ffffff', iron: '#3f8a6a',
  red: '#ff7a6a', yellow: '#ffd54a', blue: '#7fbfff', teal: '#46b98f', orange: '#ff9a5a', frog: '#6cc96a', navy: '#4a5878' };

// ── 연못 (3×3) ──────────────────────────────────────────────────────────────────────────────────────────────
B.fs3_pond = f => {
  const R = 1.32;
  // the water: a deep ring, the lighter middle with the ripple print, the sky's soft reflection streaks
  f.add(mt('fs3-pond-water', TX.water(), ({ add }) => {
    add(G.cyl(R, R, .03, 48), P.deep, 0, .012, 0, 0, 0, 0, 1, { w: .9 });
    add(G.cyl(R - .14, R - .14, .034, 48), P.water, 0, .018, 0, 0, 0, 0, 1, { w: .7 });
  }));
  f.add(mc('fs3-pond-shine', ({ add }) => {
    for (const [x, z, s] of [[-.35, -.35, 1], [.15, -.6, .6], [-.6, .05, .5]]) add(G.sph(.22 * s, 14, 6), P.water2, x, .037, z, 0, .7, 0, [1.6, .02, .35]);
    for (const [r, c] of [[.95, '#c6f0fa'], [.58, '#c6f0fa']]) add(G.tor(r, .007, PI * 1.5, 4, 40), c, 0, .038, 0, HP, 0, .4);
    // two koi shadows and a little one
    for (const [x, z, a, s, c] of [[.35, .25, .6, 1, '#f39a5a'], [.05, .55, 2.3, .85, '#f6b07a'], [-.45, -.15, 4.1, .6, '#5aa9c9']]) {
      add(G.sph(.12 * s, 12, 6), c, x, .03, z, 0, a, 0, [1.7, .05, .7]); add(G.cone(.07 * s, .12 * s, 4), c, x - Math.cos(a) * .22 * s, .03, z + Math.sin(a) * .22 * s, 0, a, HP, [1, 1, .1]);
    }
  }));
  // the rim: round stones of a few sizes, a little uneven, moss on some tops
  f.add(mt('fs3-pond-stones', TX.stone(), ({ add }) => {
    for (let k = 0; k < 24; k++) {
      const a = k / 24 * PI * 2 + (k % 3) * .04, rr = R + .02 + (k % 2) * .05, s = .13 + (k * 37 % 5) * .022;
      add(G.rock(k % 9 + 3, .2, 12, 8), k % 3 ? P.stone : P.stone2, Math.cos(a) * rr, s * .32, Math.sin(a) * rr, 0, a, 0, [s * 1.35, s * .62, s], { w: .3 });
    }
  }));
  f.add(mc('fs3-pond-rim', ({ add, tube }) => {
    for (let k = 0; k < 24; k += 3) { const a = k / 24 * PI * 2 + .1, rr = R + .04, s = .13 + (k * 37 % 5) * .022; add(G.sph(s * .8, 10, 6), P.moss, Math.cos(a) * rr, s * .55, Math.sin(a) * rr, 0, a, 0, [1.1, .3, .8]); }
    // a lotus flower and a bud
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; add(G.sph(.055, 8, 6), k % 2 ? P.lotus : '#ffd0e2', -.5 + Math.cos(a) * .05, .075, .35 + Math.sin(a) * .05, .55, a, 0, [.7, 1, 1.45]); }
    add(G.sph(.035, 8, 6), '#ffe27a', -.5, .1, .35);
    tube([.85, .02, -.75], [.82, .32, -.78], .01, '#5fae52', 4); add(G.sph(.04, 8, 6), '#ffb8d2', .82, .34, -.78, 0, 0, 0, [.8, 1.4, .8]);
    // cattails on the far side of the rim
    for (let k = 0; k < 6; k++) { const a = -2.1 + k * .14, x = Math.cos(a) * (R + .05), z = Math.sin(a) * (R + .05), h = .45 + (k % 3) * .12; tube([x, 0, z], [x + .03 * (k % 2 ? 1 : -1), h, z], .011, k % 2 ? '#7fbf5a' : '#5aa84a', 4); if (k % 2 === 0) add(G.cap(.022, .1, 2, 6), '#8a5a3a', x + .03 * (k % 2 ? 1 : -1), h, z); }
  }));
  const pad = (x, z, r, rot) => {
    const m = f.add(mc('fs3-lily|' + r, ({ add }) => {
      const s = new THREE.Shape(); s.absarc(0, 0, r, .35, PI * 2 - .1, false); s.lineTo(0, 0);
      add(G.ext(s, .02, 0, 20), P.lily, 0, .045, 0, -HP, 0, 0);
      for (let k = 0; k < 5; k++) { const a = .6 + k * 1.15; add(G.box(r * .8, .004, .008, .002), '#8fd27a', Math.cos(a) * r * .4, .066, -Math.sin(a) * r * .4, 0, a, 0); }
    }));
    m.rotation.y = rot; m.position.set(x, 0, z);
    f.spot('on', null, x, .065, z, { maxH: .28, label: '연잎 위', scale: .7 });
  };
  pad(.45, -.4, .25, .4); pad(-.35, -.55, .21, 2.1); pad(.7, .45, .23, 4.4);
  f.spot('behind', null, -1.15, 0, -.55, { maxH: .25, label: '연못가 돌 뒤', scale: .7 });
};

// ── 낚시 좌대 (2×1) — the reel and keep-net work exactly as the old dock's (reelcatch: the first spot is the net) ──
B.fs3_dock = f => {
  const D = .9, Y = .28;
  f.add(mt('fs3-dock-planks', TX.plank(), ({ add }) => {
    add(G.box(1.92, .06, D, .02), P.woodD, 0, Y - .01, 0, 0, 0, 0, 1, { w: .5 });
    for (let k = 0; k < 9; k++) { const x = -.85 + k * .2125; add(G.box(.19, .03, D - .02, .008), k % 3 ? P.plank : '#e9ba80', x, Y + .035, 0, 0, (k % 2 - .5) * .02, 0, 1, { w: .45 }); }
  }));
  f.add(mt('fs3-dock-posts', TX.bark(), ({ add }) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.055, .06, Y + .12, 10), P.woodD, sx * .86, Y / 2 - .04, sz * (D / 2 - .06), 0, 0, 0, 1, [1, 1]); }));
  f.add(mc('fs3-dock', ({ add, tube }) => {
    // nail heads, a rope coil, the rod holder with a cork-handled rod and a little frog-green flag on its tip
    for (let k = 0; k < 9; k++) for (const z of [-.33, .33]) add(G.cyl(.012, .012, .006, 6), '#8f7a66', -.85 + k * .2125, Y + .052, z);
    add(G.tor(.11, .028, PI * 2, 5, 16), '#f0d8a2', .25, Y + .07, -.25, HP, 0, 0); add(G.tor(.06, .025, PI * 2, 5, 12), '#f0d8a2', .25, Y + .1, -.25, HP, 0, 0);
    add(G.cyl(.045, .045, .45, 10), P.woodD, .55, Y + .22, .2);
    tube([.55, Y + .4, .2], [.75, Y + 1.25, 1.25], .018, P.navy, 6); tube([.55, Y + .4, .2], [.6, Y + .58, .45], .026, '#e8c48e', 6);
    add(G.sph(.03, 8, 6), P.red, .75, Y + 1.26, 1.26); add(G.box(.12, .08, .006, .003), P.frog, .82, Y + 1.24, 1.26, 0, .5, 0);
    // the low blue stool with a cushion, a bait tin, a small towel over the edge
    add(G.cyl(.16, .14, .22, 16), P.blue, -.45, Y + .15, -.1); add(G.cyl(.17, .17, .03, 16), '#5fa3e8', -.45, Y + .27, -.1);
    add(G.cyl(.08, .08, .07, 14), '#dde2ec', -.05, Y + .07, .25); add(G.cyl(.07, .07, .01, 14), '#c9a46a', -.05, Y + .105, .25);
    add(G.box(.22, .01, .3, .005), '#ffffff', -.88, Y + .05, .15, 0, 0, .02); add(G.box(.22, .14, .01, .005), '#ffffff', -.98, Y - .02, .15, 0, 0, HP * .9); for (const z of [.05, .25]) add(G.box(.23, .012, .02, .003), '#7fc8ff', -.88, Y + .057, z);
  }));
  // the reel on the holder: a part with the line and the keep-net
  const reel = grp(); put(reel, .62, Y + .38, .2); f.add(reel);
  reel.add(mc('fs3-reel', ({ add }) => { add(G.cyl(.075, .075, .05, 18), P.yellow, 0, 0, 0, 0, 0, HP); add(G.cyl(.04, .04, .055, 12), '#ffffff', 0, 0, 0, 0, 0, HP); add(G.box(.025, .1, .025, .008), '#5b5672', .04, -.05, 0); add(G.sph(.022, 8, 6), P.red, .05, -.1, 0); }));
  const NET = { x: .75, z: 1.25 }, yLo = -.35, yHi = Y + .55;
  const net = grp(); put(net, NET.x, yLo, NET.z); f.add(net);
  net.add(mc('fs3-keepnet', ({ add, tube }) => {
    add(G.cyl(.2, .16, .04, 18), '#3f8f6a', 0, 0, 0);
    for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; tube([Math.cos(a) * .16, 0, Math.sin(a) * .16], [Math.cos(a) * .2, .26, Math.sin(a) * .2], .006, '#3f8f6a', 4); }
    for (const y of [.09, .18]) add(G.tor(.18 + y * .08, .005, PI * 2, 3, 22), '#3f8f6a', 0, y, 0, HP, 0, 0);
    add(G.tor(.2, .018, PI * 2, 6, 22), P.yellow, 0, .26, 0, HP, 0, 0);
    for (const [x, z] of [[.2, 0], [-.2, 0], [0, .2], [0, -.2]]) tube([x, .26, z], [0, .55, 0], .004, '#e8e8f0', 3);
  }));
  const line = grp(); put(line, NET.x, Y + 1.25, NET.z); f.add(line);
  line.add(mc('fs3-line', ({ add }) => add(G.cyl(.004, .004, 1, 4), '#f4f4fa', 0, -.5, 0)));
  const setLine = ny => { line.scale.y = Math.max(.05, Y + 1.25 - (ny + .55)); };
  setLine(yLo);
  const p = f.part('lift', [net, reel, line], (t, bN, bR) => {
    net.position.y = bN.p.y + (yHi - yLo) * t; net.rotation.y = t * 1.2;
    reel.rotation.x = -t * PI * 8; setLine(net.position.y);
  }, { label: '낚싯대 릴', sfx: 'swish', dur: .9 });
  f.spot('inside', net, 0, .05, 0, { part: p, maxH: .24, label: '물속 그물망', scale: .75 });
  f.spot('on', null, -.45, Y + .29, -.1, { maxH: .3, label: '좌대 의자 위', scale: .7 });
  f.spot('under', null, -.2, 0, -.3, { maxH: .2, label: '좌대 밑', scale: .7 });
};

// ── 나무 (1×1) — the same birdhouse part and places as the park tree ──
B.fs3_tree = f => {
  f.add(mt('fs3-tree-bark', TX.bark(), ({ add, tube }) => {
    add(G.cyl(.14, .22, 1.3, 16), P.bark, 0, .65, 0, 0, 0, 0, 1, [1.4, 1.2]);
    for (let i = 0; i < 5; i++) { const a = i * 1.25 + .7; tube([Math.sin(a) * .1, .22, Math.cos(a) * .1], [Math.sin(a) * .36, .02, Math.cos(a) * .36], .095, P.bark, 10, .035); }
    tube([.05, 1.1, 0], [.36, 1.42, -.05], .06, P.bark, 8, .045); tube([-.04, 1.15, .02], [-.3, 1.45, .1], .055, P.bark, 8, .04);
  }));
  f.add(put(new THREE.Mesh(G.sph(.12, 14, 10), mat('#3b2a33')), 0, .12, .17, 0, 0, 0, [1, 1.25, .38]));
  f.spot('behind', null, 0, 0, .33, { maxH: .25, label: '나무 밑동', scale: .7 });
  f.add(mt('fs3-tree-crown', TX.leaf(), ({ add }) => {
    for (const [x, y, z, r, c] of [[0, 1.68, 0, .6, P.leaf], [-.38, 1.48, .08, .42, P.leaf2], [.4, 1.52, -.04, .44, P.leaf3], [.04, 2.08, -.06, .42, P.leaf3], [.12, 1.55, .34, .36, P.leaf], [-.14, 1.62, -.34, .38, P.leaf2]])
      add(G.sph(r, 18, 12), c, x, y, z, 0, 0, 0, [1, .92, 1], { w: .6 });
  }));
  f.add(mc('fs3-tree-flowers', ({ add }) => {
    for (const [x, y, z] of [[-.2, 1.95, .38], [.3, 1.82, .38], [-.46, 1.62, .32], [.12, 2.38, .12], [.5, 1.66, .26], [-.05, 1.66, .62], [-.4, 1.98, -.05], [.28, 2.15, .3], [-.25, 2.2, .25], [.55, 1.9, -.1]]) {
      for (let k = 0; k < 5; k++) { const a = k * 1.256; add(G.sph(.028, 6, 4), '#ffffff', x + Math.cos(a) * .03, y, z + Math.sin(a) * .03, 0, 0, 0, [1, .5, 1]); }
      add(G.sph(.016, 6, 4), P.yellow, x, y + .01, z);
    }
  }));
  const hx = 0, hy = .66, hz = .27;
  f.add(mt('fs3-birdhouse', TX.plank(), ({ add }) => {
    add(G.box(.2, .03, .18, .006), '#ffd56a', hx, hy - .185, hz); add(G.box(.02, .2, .18, .006), '#ffd56a', hx - .09, hy - .1, hz); add(G.box(.02, .2, .18, .006), '#ffd56a', hx + .09, hy - .1, hz);
    add(G.box(.2, .2, .02, .006), '#ffd56a', hx, hy - .1, hz - .08); add(G.box(.2, .05, .02, .008), '#ffd56a', hx, hy - .075 - .05, hz + .08); add(G.box(.2, .04, .02, .008), '#ffd56a', hx, hy + .08 - .1, hz + .08);
  }));
  f.add(mc('fs3-birdhouse-perch', ({ add }) => { add(G.cyl(.012, .012, .08, 6), P.woodD, hx, hy - .17, hz + .12, HP, 0, 0); add(G.cyl(.012, .012, .2, 6), '#e8e0d8', hx, hy + .17, hz - .02); }));
  const roof = grp(put(mc('fs3-bh-roof', ({ add }) => { add(G.box(.15, .025, .25, .008), P.red, -.055, .03, 0, 0, 0, .6); add(G.box(.15, .025, .25, .008), P.red, .055, .03, 0, 0, 0, -.6); add(G.sph(.02, 6, 4), '#ffffff', 0, .085, 0); }), 0, 0, 0));
  put(roof, hx, hy + .1, hz); f.add(roof);
  const p = f.part('lift', roof, (t, b) => { roof.position.y = b.p.y + .2 * t; roof.position.x = b.p.x + .12 * t; roof.rotation.z = -.5 * t; }, { label: '새집 지붕', sfx: 'lift' });
  f.spot('inside', null, hx, hy - .08, hz, { part: p, maxH: .18, label: '새집 안', scale: .55 });
  f.spot('behind', null, 0, 0, -.34, { maxH: .45, label: '나무 뒤', scale: .85 });
};

// ── 벤치 (2×1) ──
const newsTex = () => TEX.get('fs3-news', () => canvasTex(128, 96, x => {
  x.fillStyle = '#f7f4ec'; x.fillRect(0, 0, 128, 96); x.fillStyle = '#4a4a5a'; x.fillRect(8, 8, 112, 12);
  for (let r = 0; r < 7; r++) for (const c of [0, 1]) { x.fillStyle = 'rgba(70,70,90,.45)'; x.fillRect(8 + c * 58, 28 + r * 9, 50, 3); }
  x.fillStyle = '#9fd0ef'; x.fillRect(66, 28, 50, 26);
}));
B.fs3_bench = f => {
  const sy = .42;
  f.add(mc('fs3-bench-iron', ({ tube, add }) => {
    for (const sx of [-1, 1]) {
      const x = sx * .78;
      tube([x, 0, .16], [x, sy, .14], .03, P.iron, 8); tube([x, 0, -.18], [x, sy, -.16], .03, P.iron, 8); tube([x, sy, -.16], [x, .88, -.28], .03, P.iron, 8);
      tube([x, sy - .03, .19], [x, sy - .03, -.2], .03, P.iron, 8); tube([x, .62, .2], [x, .62, -.2], .028, P.iron, 8); tube([x, .62, .2], [x, sy, .15], .028, P.iron, 8);
      add(G.sph(.04, 8, 6), P.iron, x, .62, .2); add(G.cyl(.05, .06, .02, 10), P.iron, x, .01, .16); add(G.cyl(.05, .06, .02, 10), P.iron, x, .01, -.18);
    }
  }));
  f.add(mt('fs3-bench-slats', TX.plank(), ({ add }) => {
    for (const z of [.12, 0, -.12]) add(G.box(1.8, .045, .1, .02), P.wood, 0, sy + .02, z, 0, 0, 0, 1, { w: .45 });
    for (const [y, z] of [[.62, -.21], [.79, -.25]]) add(G.box(1.8, .1, .035, .02), P.wood, 0, y, z, -.22, 0, 0, 1, { w: .45 });
  }));
  const np = grp(put(new THREE.Mesh(G.box(.44, .025, .3, .008), mat('#ffffff', { map: newsTex() })), 0, 0, 0)); put(np, .45, sy + .056, 0, 0, .22, 0); f.add(np);
  const p = f.part('lift', np, (t, b) => { np.position.y = b.p.y + .3 * t; np.rotation.x = -.38 * t; np.rotation.z = .15 * t; }, { label: '신문지', sfx: 'swish' });
  f.spot('inside', null, .45, sy + .045, 0, { part: p, maxH: .3, label: '신문지 밑', scale: .82 });
  f.spot('on', null, -.42, sy + .045, 0, { maxH: .45, label: '벤치 위', scale: .85 });
  f.spot('under', null, 0, 0, -.02, { maxH: .35, label: '벤치 밑', scale: .85 });
  f.add(put(mc('fs3-pigeon', ({ add }) => { add(G.sph(.09, 12, 9), '#b2b7cf', 0, .09, 0, 0, 0, .15, [1.3, .9, .9]); add(G.sph(.055, 12, 9), '#b2b7cf', .1, .19, 0); add(G.box(.1, .03, .07, .01), '#9aa0bb', -.13, .1, 0, 0, 0, .3); add(G.cone(.022, .06, 8), P.orange, .17, .19, 0, 0, 0, -HP); add(G.sph(.012, 6, 4), '#2a2a3a', .13, .21, .035); add(G.sph(.03, 8, 6), '#9fd0b8', .06, .14, 0, 0, 0, 0, [1, 1, 1.4]); }), -.64, 0, .34, 0, .5, 0));
};

// ── 간판 (1×1): a cream board on two legs — a fish, the word and 개굴이's face ──
const signTex = () => TEX.get('fs3-sign', () => canvasTex(256, 136, x => {
  x.fillStyle = '#fffaf0'; x.fillRect(0, 0, 256, 136);
  x.strokeStyle = '#e8d6b4'; x.lineWidth = 6; x.strokeRect(5, 5, 246, 126);
  x.fillStyle = '#5ab9df'; x.beginPath(); x.ellipse(70, 84, 38, 20, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(104, 84); x.lineTo(126, 66); x.lineTo(126, 102); x.closePath(); x.fill();
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(52, 80, 6, 0, 7); x.fill(); x.fillStyle = '#2a2a3a'; x.beginPath(); x.arc(52, 80, 3, 0, 7); x.fill();
  fitText(x, '낚시터', 186, 52, 120, 40, '#3f7f4a');
  x.fillStyle = '#7fd06a'; x.beginPath(); x.ellipse(190, 100, 24, 18, 0, 0, 7); x.fill();
  for (const dx of [-10, 10]) { x.fillStyle = '#ffffff'; x.beginPath(); x.arc(190 + dx, 86, 6, 0, 7); x.fill(); x.fillStyle = '#2a2a3a'; x.beginPath(); x.arc(190 + dx, 86, 3, 0, 7); x.fill(); }
  x.strokeStyle = '#3f7f4a'; x.lineWidth = 2; x.beginPath(); x.arc(190, 101, 7, .2, PI - .2); x.stroke();
}));
B.fs3_sign = f => {
  f.add(mt('fs3-sign-legs', TX.bark(), ({ add }) => { for (const sx of [-1, 1]) add(G.box(.06, .9, .06, .015), P.woodD, sx * .32, .45, -.05, 0, 0, 0, 1, { w: .4 }); }));
  f.add(mc('fs3-sign-frame', ({ add }) => { add(G.box(.84, .46, .05, .03), P.wood, 0, .78, -.03); add(G.box(.88, .05, .08, .015), P.woodD, 0, 1.02, -.02); tuft(add, .25, .1, 1); flower(add, -.28, .12, '#ffffff'); }));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(.78, .4), mat('#ffffff', { map: signTex() })); board.position.set(0, .78, .0); f.add(board);
  f.spot('behind', null, 0, 0, -.25, { maxH: .3, label: '간판 뒤', scale: .7 });
  f.spot('on', null, 0, 1.05, -.02, { maxH: .2, label: '간판 위', scale: .55 });
};

// ── 낚시 도구함 (1×1) ──
B.fs3_tackle = f => {
  f.add(mc('fs3-tackle', ({ add }) => {
    add(G.box(.62, .26, .38, .04), P.teal, 0, .13, 0); add(G.box(.64, .03, .4, .01), '#36997a', 0, .2, 0);
    add(G.box(.16, .06, .06, .02), '#2f8a68', 0, .14, .2); add(G.box(.05, .05, .02, .01), '#e8e8f0', 0, .14, .235);
    for (const sx of [-1, 1]) add(G.box(.04, .2, .02, .01), '#36997a', sx * .26, .13, .195);
  }));
  const lid = grp(); put(lid, 0, .26, -.19); f.add(lid);
  lid.add(mc('fs3-tacklelid', ({ add, tube }) => { add(G.box(.62, .06, .38, .025), '#5cd0a4', 0, .03, .19); tube([-.12, .07, .19], [-.08, .12, .19], .015, P.yellow, 5); tube([-.08, .12, .19], [.08, .12, .19], .015, P.yellow, 5); tube([.08, .12, .19], [.12, .07, .19], .015, P.yellow, 5); add(G.sph(.03, 8, 6), P.red, .22, .07, .3); }));
  const p = f.part('lid', lid, (t, b) => { lid.rotation.x = -1.6 * t; }, { label: '도구함 뚜껑', sfx: 'open' });
  f.add(mc('fs3-tacklein', ({ add }) => {
    add(G.box(.58, .02, .34, .005), '#2f8a68', 0, .245, 0);
    for (const [x, c] of [[-.2, P.red], [-.05, P.yellow], [.1, P.blue], [.22, '#ff9ec2']]) { add(G.cap(.025, .07, 2, 6), c, x, .27, .02, 0, 0, HP); add(G.sph(.012, 6, 4), '#ffffff', x + .04, .275, .03); }
  }));
  f.spot('inside', null, 0, .25, 0, { part: p, maxH: .14, label: '도구함 안', scale: .6 });
  f.spot('on', lid, 0, .06, .19, { maxH: .3, label: '도구함 위', scale: .7 });
};

// ── 미끼통 (1×1) ──
B.fs3_bait = f => {
  f.add(mc('fs3-bait', ({ add, tube }) => {
    add(G.cyl(.2, .16, .3, 20), P.orange, 0, .15, 0); add(G.cyl(.205, .205, .05, 20), '#ffffff', 0, .21, 0);
    add(G.tor(.2, .018, PI * 2, 5, 22), '#ff7a3a', 0, .3, 0, HP, 0, 0); add(G.cyl(.18, .18, .02, 18), '#9a6a40', 0, .27, 0);
    for (let k = 0; k < 4; k++) add(G.tor(.03, .008, PI * 1.4, 3, 8), '#e88a7a', -.06 + k * .04, .285, (k % 2 ? .03 : -.03), HP, 0, k);
    tube([-.2, .3, 0], [0, .48, 0], .008, '#c9cfe0', 4); tube([0, .48, 0], [.2, .3, 0], .008, '#c9cfe0', 4);
    add(G.cyl(.04, .05, .06, 10), '#7fbfff', .26, .03, .12); tube([.26, .06, .12], [.4, .1, .2], .01, '#7fbfff', 4);
  }));
  f.spot('inside', null, 0, .28, 0, { maxH: .2, label: '미끼통 안', scale: .6 });
  f.spot('behind', null, 0, 0, -.3, { maxH: .25, label: '미끼통 뒤', scale: .7 });
};

// ── 갈대 (1×1) ──
B.fs3_reeds = f => {
  f.add(mc('fs3-reeds', ({ add, tube }) => {
    for (let k = 0; k < 13; k++) {
      const a = k * 2.4, r = .08 + (k % 4) * .06, x = Math.cos(a) * r, z = Math.sin(a) * r, h = .55 + (k % 5) * .1, lean = (k % 3 - 1) * .08;
      tube([x, 0, z], [x + lean, h, z + lean * .5], .012, k % 2 ? '#86c862' : '#5fae52', 4);
      if (k % 3 === 0) add(G.cap(.026, .12, 2, 6), '#8a5a3a', x + lean, h + .02, z + lean * .5);
      else if (k % 3 === 1) { const g = G.cone(.03, .42, 4); add(g, '#6cbf5a', x + lean * .6, h * .55, z, .1, k, .2 * (k % 2 ? 1 : -1), [1, 1, .3]); }
    }
    tuft(add, .25, .22, 1.1); tuft(add, -.26, .18, .9);
  }));
  f.spot('inside', null, 0, 0, .05, { maxH: .26, label: '갈대 속', scale: .7 });
};

// ── 파라솔 의자 (1×1) ──
B.fs3_parasol = f => {
  f.add(mc('fs3-parasol', ({ add, tube }) => {
    tube([0, 0, -.1], [0, 1.45, -.1], .025, '#f4f4fa', 6);
    for (let k = 0; k < 8; k++) add(new THREE.ConeGeometry(.74, .32, 8, 1, true, k * PI / 4, PI / 4), k % 2 ? '#ffffff' : '#ff8a96', 0, 1.42, -.1);
    add(G.tor(.74, .012, PI * 2, 3, 24), '#ffffff', 0, 1.26, -.1, HP, 0, 0);
    add(G.sph(.045, 8, 6), P.red, 0, 1.6, -.1);
    // folding chair: a striped canvas seat and back, white frame
    for (let k = 0; k < 4; k++) { add(G.box(.105, .04, .36, .006), k % 2 ? '#ffffff' : '#7fc4ef', -.157 + k * .105, .3, .12); add(G.box(.105, .36, .04, .006), k % 2 ? '#ffffff' : '#7fc4ef', -.157 + k * .105, .5, -.05, -.25, 0, 0); }
    for (const sx of [-1, 1]) { tube([sx * .21, 0, .3], [sx * .21, .3, -.02], .015, '#e8ecf4', 4); tube([sx * .21, 0, -.05], [sx * .21, .3, .28], .015, '#e8ecf4', 4); tube([sx * .21, .3, -.05], [sx * .21, .68, -.13], .014, '#e8ecf4', 4); }
    add(G.cyl(.04, .04, .1, 10), '#ffe08a', .3, .05, .3); add(G.tor(.025, .006, PI, 3, 8), '#ffe08a', .34, .06, .3, 0, 0, -HP);
  }));
  f.spot('on', null, 0, .32, .12, { maxH: .3, label: '파라솔 의자 위', scale: .75 });
  f.spot('under', null, 0, 0, .12, { maxH: .22, label: '파라솔 의자 밑', scale: .7 });
  // (the canopy overhead doesn't block: only the pole and the chair)
  f.walkSolids = [[-.05, 0, -.15, .05, 1.5, -.05], [-.25, 0, -.12, .25, .7, .34]];
};

// ── 덤불 (1×1) — the same two halves that part ──
B.fs3_bush = f => {
  const half = sx => {
    const pv = new THREE.Group(); put(pv, sx * .46, 0, 0, 0, sx > 0 ? PI : 0, 0);
    pv.add(mt('fs3-bush-half', TX.leaf(), ({ add }) => { for (const [x, y, z, r, c] of [[.24, .28, 0, .3, P.leaf2], [.14, .22, .2, .22, P.leaf], [.14, .22, -.2, .22, P.leaf2], [.3, .5, .05, .22, P.leaf], [.12, .46, -.04, .2, P.leaf3]]) add(G.sph(r, 16, 11), c, x, y, z, 0, 0, 0, 1, { w: .5 }); }));
    pv.add(mc('fs3-bush-flowers', ({ add }) => { for (const [x, y, z, c] of [[.2, .46, .26, '#ffb8d2'], [.34, .64, .14, '#ffffff'], [.08, .36, .3, '#ffb8d2'], [.4, .34, .22, '#ffffff'], [.26, .2, -.32, '#ffb8d2'], [.3, .58, -.16, '#ffffff']]) { add(G.sph(.042, 8, 6), c, x, y, z); add(G.sph(.016, 6, 4), P.yellow, x + .01, y + .02, z + .02); } }));
    f.add(pv); return pv;
  };
  const L = half(-1), R = half(1);
  const p = f.part('lift', [L, R], (t, bl, br) => { L.rotation.z = .55 * t; L.position.x = bl.p.x - .08 * t; R.rotation.z = .55 * t; R.position.x = br.p.x + .08 * t; }, { label: '덤불', sfx: 'swish' });
  f.spot('inside', null, 0, 0, .04, { part: p, maxH: .4, label: '덤불 속', scale: .9 });
  f.spot('behind', null, 0, 0, -.4, { maxH: .4, label: '덤불 뒤', scale: .8 });
  f.spot('on', L, .3, .7, .05, { maxH: .3, label: '덤불 위', scale: .7 });
};

// ── the old walls' places: a flowering hedge along the north, a white picket fence along the west ──
B.fs3_hedge = (f, T, o = {}) => {
  f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];
  const L = o.len || 7;
  f.add(mt('fs3-hedge', TX.leaf(), ({ add }) => {
    add(G.box(L + .2, .62, .5, .2), P.leaf2, 0, .34, 0, 0, 0, 0, 1, { w: .5 });
    for (let k = 0; k <= L * 2; k++) add(G.sph(.27, 12, 8), k % 2 ? P.leaf : P.leaf3, -L / 2 + k * .5, .66, (k % 3 - 1) * .04, 0, 0, 0, [1, .55, 1], { w: .5 });
  }));
  f.add(mc('fs3-hedge-flowers', ({ add }) => {
    for (let k = 0; k < L * 4; k++) { const x = -L / 2 + .12 + k * .25 + (k % 3) * .03, y = .25 + (k * 7 % 5) * .1, c = k % 3 ? '#ffb8d2' : '#ffffff'; add(G.sph(.038, 8, 6), c, x, y, .26); add(G.sph(.014, 6, 4), P.yellow, x, y + .01, .29); }
  }));
  f.walkSolids = [];
};
B.fs3_fence = (f, T, o = {}) => {
  f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];
  const L = o.len || 6, n = Math.round(L / .22);
  f.add(mt('fs3-fence', TX.plank(), ({ add }) => {
    for (let k = 0; k <= n; k++) { const z = -L / 2 + k * L / n; add(G.box(.06, .62, .1, .02), '#fffaf2', 0, .31, z, 0, 0, 0, 1, { w: .3 }); add(G.cone(.07, .1, 4), '#fffaf2', 0, .66, z, 0, PI / 4, 0, [.9, 1, 1.4]); }
    for (const y of [.18, .48]) add(G.box(.05, .06, L + .05, .015), '#f4ece0', -.05, y, 0, 0, 0, 0, 1, { w: .4 });
  }));
  f.add(mc('fs3-fence-vine', ({ add }) => {
    for (let k = 0; k < L * 3; k++) { const z = -L / 2 + .15 + k * .33, y = .2 + (k * 5 % 4) * .12; add(G.sph(.06, 8, 6), k % 2 ? P.leaf : P.leaf2, .06, y, z, 0, 0, 0, [.5, 1, 1.2]); if (k % 3 === 0) { add(G.sph(.035, 8, 6), '#b9a6ff', .09, y + .06, z + .04); add(G.sph(.013, 6, 4), P.yellow, .11, y + .07, z + .04); } }
  }));
  f.walkSolids = [];
};

// ── the lawn's small things: clover patches, wild flowers, stepping stones to the dock, two butterflies, a dragonfly ──
B.fs3_meadow = f => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];
  f.add(mc('fs3-meadow', ({ add }) => {
    for (const [cx, cz] of [[-2.9, 2.3], [2.2, -2.0], [2.9, 2.6], [-1.2, -2.3], [.6, 2.7]]) for (let k = 0; k < 7; k++) { const a = k * 2.4, r = .08 + k * .05; add(G.sph(.045, 6, 4), k % 2 ? '#7fc965' : '#93d677', cx + Math.cos(a) * r, .012, cz + Math.sin(a) * r, 0, 0, 0, [1, .2, 1]); }
    for (const [x, z, c] of [[-3.0, 2.0, '#ffffff'], [-2.75, 2.5, '#ffd54a'], [2.4, -2.2, '#ffffff'], [3.1, 2.4, '#ffb8d2'], [2.7, 2.75, '#ffffff'], [-1.35, -2.1, '#b9a6ff'], [.75, 2.55, '#ffffff'], [-.3, 2.9, '#ffd54a'], [3.2, -.4, '#ffffff'], [-3.2, -.6, '#ffffff']]) flower(add, x, z, c, .9);
    for (const [x, z] of [[-3.25, 1.1], [1.8, 2.95], [3.25, .9], [-.6, -2.9], [.9, -2.6], [-2.2, 2.95]]) tuft(add, x, z, 1);
    for (const [x, z, s] of [[-.2, 2.35, 1], [-.65, 1.85, .9], [-1.15, 1.5, 1]]) { add(G.cyl(.2 * s, .22 * s, .04, 10), '#e6dfd4', x, .012, z, 0, x * 3, 0, [1, 1, .8]); add(G.cyl(.16 * s, .16 * s, .042, 10), '#f0ebe2', x - .02, .014, z - .02, 0, x * 3, 0, [1, 1, .8]); }
  }));
  // butterflies and a dragonfly over the pond: they bob a little (four times a second — one small box redraws)
  const flies = [];
  const fly = (x, y, z, c, dragon) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.userData.noMerge = true; f.add(g);
    g.add(mc('fs3-fly|' + c + (dragon ? 'd' : ''), ({ add }) => {
      if (dragon) { add(G.cap(.012, .16, 2, 6), '#4fb6dc', 0, 0, 0, 0, 0, HP); for (const s of [-1, 1]) for (const dz of [-.03, .03]) add(G.sph(.06, 8, 4), '#e6f6ff', s * .01, .005, dz, 0, 0, 0, [.25, .05, 1.2]); }
      else { add(G.cap(.01, .05, 2, 6), '#3a3550', 0, 0, 0, HP, 0, 0); for (const s of [-1, 1]) { add(G.sph(.045, 8, 4), c, s * .04, .01, -.01, 0, 0, s * .4, [1, .1, .8]); add(G.sph(.03, 8, 4), c, s * .035, 0, .035, 0, 0, s * .4, [1, .1, .8]); } }
    }));
    flies.push({ g, y, ph: x * 3 });
  };
  fly(.7, .85, -.6, '#ffd54a'); fly(-2.2, .7, 2.4, '#ffffff'); fly(-.6, .55, .3, null, true);
  let last = -1;
  f.tick = t => { const k = Math.floor(t * 4); if (k === last) return; last = k; for (const q of flies) { q.g.position.y = q.y + Math.sin(k * .9 + q.ph) * .04; q.g.rotation.y = Math.sin(k * .5 + q.ph) * .5; } };
  f.live = flies.map(q => q.g);
};

export const FS3_BUILDERS = B;
const H = { hidden: true, price: 0 };
export const FS3_INFO = {
  fs3_hedge: { w: .1, d: .1, name: '꽃 산울타리', ...H },
  fs3_fence: { w: .1, d: .1, name: '하얀 울타리', ...H },
  fs3_meadow: { w: .1, d: .1, name: '풀밭', ...H, floor: true },
};

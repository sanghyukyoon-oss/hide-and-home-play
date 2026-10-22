// 빌라 옥상 정원 (10/21, 18판 새 맵 — 고른 그림 rooftop-a; id villaroof: 'rooftop' is the building chapter's roof): a
// villa's rooftop at sunset — green waterproof floor, a cream parapet with ivy and flowers spilling over it, string
// lights on posts, styrofoam boxes of lettuce and chillies, a tarp over a stack of boxes. The pyeongsang, the jars, the
// water tank and the drying rack are the existing pieces.
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { clothBend, clothWave, clothSlab } from './clothbend.js';

const PI = Math.PI, HP = PI / 2;
const CREAM = '#f3eadc', LEAF = '#6cbf5a', LEAF2 = '#4fa64f', WOOD = '#c99a62', WOODD = '#8f6440', FOAM = '#f4f4f0', DARK = '#3a3048';
const B = {};

// 덩굴 난간 (2×1): a stretch of low cream parapet along the roof's edge, ivy and little white flowers spilling over it, a pot
// on top
B.parapet = (f, T, o = {}) => {
  const s = o.seed || 1, rnd = k => ((Math.sin((k + s * 13) * 91.7) * 43758.5) % 1 + 1) % 1;
  // (20판 3차 10/21, user: "옥상은 테두리 더 좀 이상함.. 식물 막 벽 뚫고"): the parapet IS the roof's edge now (20판 has no S / E
  // wall behind it), so its outer face is the building's face and the ivy hangs down outside it. extL / extR stretch a stretch
  // past its cells (negative: stop short) so the runs meet at the corners — the front run reaches the side run's inner face,
  // the side run reaches the 옥탑방 — and the cap is exactly as long as the body: two caps never lie on top of each other
  // The body and its cap are sharp-ended so runs butt together flush; a rounded post stands at the start of each run (and at
  // its far end with o.postR), so every join and corner is a finished pillar, not a notch
  const eL = o.extL || 0, eR = o.extR || 0, L = 2 + eL + eR, X0 = (eR - eL) / 2, PW = .3;
  f.add(mc('parapet4|' + s + '|' + eL + '|' + eR + '|' + (o.postR ? 1 : 0), ({ add }) => {
    add(G.pbox(L, .62, .26), CREAM, X0, .31, .37);
    add(G.pbox(L, .06, .3), shade(CREAM, -.06), X0, .64, .37);
    for (const end of o.postR ? [-1, 1] : [-1]) {
      const px = end < 0 ? -1 - eL + PW / 2 : 1 + eR - PW / 2;
      add(G.box(PW, .7, .3, .03), shade(CREAM, -.02), px, .35, .37);
      add(G.box(PW + .04, .06, .34, .02), shade(CREAM, -.08), px, .73, .37);
    }
    // (옥상 3차 10/21, 확대하면 "이상해" — dots and coins): ivy that grows — three or four leafy clumps along the top, strands of
    // flat leaves hanging down the outside face on a thin stem (clear of the cap's lip), a few small flowers
    const n = 3 + (s % 2) + (L > 2.4 ? 1 : 0);
    for (let c = 0; c < n; c++) {
      const cx = X0 - L / 2 + PW + .12 + (c + .5) * (L - 2 * PW - .24) / n + (rnd(c) - .5) * .12;
      for (let k = 0; k < 7; k++) { const a = k * 2.3 + rnd(c * 9 + k) * .8, r = .05 + (k % 3) * .04;
        add(G.sph(.075, 8, 6), k % 2 ? LEAF : LEAF2, cx + Math.cos(a) * r, .68 + (k % 2) * .03, .39 + Math.sin(a) * r * .8, rnd(k) * .6, a, 0, [1.25, .4, .9]); }
      for (let t = 0; t < 2; t++) {
        const sx = cx + (t ? .12 : -.08), len = 3 + Math.floor(rnd(c * 5 + t) * 4);
        add(G.cyl(.008, .008, len * .09 + .05, 5), '#4f8f45', sx, .64 - (len * .09) / 2, .535);
        for (let k = 0; k < len; k++) { const yy = .6 - k * .09, side = k % 2 ? 1 : -1;
          add(G.sph(.06 - k * .004, 8, 6), (k + t) % 2 ? LEAF : LEAF2, sx + side * .035, yy, .54, 0, 0, side * .5, [1.1, .85, .32]); }
      }
      if (rnd(c * 3) < .7) for (let k = 0; k < 2; k++) add(G.sph(.028, 6, 5), k ? '#ffffff' : '#ffb3cf', cx + (k - .5) * .1, .74, .42 + k * .04);
    }
    if (s % 2) { add(G.cyl(.1, .08, .14, 12), '#d98b5f', .55, .74, .37); add(G.sph(.12, 9, 7), LEAF, .55, .87, .37); add(G.sph(.04, 6, 5), '#ffffff', .6, .92, .42); }
  }));
  f.spot('behind', null, -.4, 0, .1, { maxH: .4, label: '난간 아래', scale: .75 });
};


// 스티로폼 텃밭 (1×1): a white styrofoam box of soil, lettuces or chilli plants with red chillies
B.foambox = (f, T, o = {}) => {
  const chili = o.kind === 'chili';
  f.add(mc('foambox|' + (chili ? 'c' : 'l'), ({ add }) => {
    add(G.box(.7, .32, .46, .02), FOAM, 0, .16, 0); add(G.box(.64, .02, .4, .01), '#7a5a40', 0, .31, 0);
    if (chili) for (let k = 0; k < 3; k++) { const x = -.2 + k * .2; add(G.cyl(.012, .015, .35, 5), LEAF2, x, .48, 0); for (let m = 0; m < 4; m++) add(G.sph(.06, 7, 5), LEAF, x + Math.cos(m * 1.6) * .07, .55 + m * .05, Math.sin(m * 1.6) * .07); for (let m = 0; m < 3; m++) add(G.cone(.022, .11, 6), '#e5483a', x + (m - 1) * .05, .5, .06, PI, 0, (m - 1) * .3); }
    else for (let k = 0; k < 3; k++) for (let m = 0; m < 5; m++) { const a = m * 1.26; add(G.sph(.07, 7, 5), m % 2 ? '#8fd46a' : LEAF, -.2 + k * .2 + Math.cos(a) * .05, .38, Math.sin(a) * .06, 0, a, 0, [1.2, .6, .9]); }
  }));
  f.spot('beside', null, .3, 0, .32, { maxH: .26, label: '텃밭 상자 옆', scale: .65 });
};

// 방수포 짐 (1×1, 3차 10/21 — user "확대해서 보면 이상해"): two boxes and a red crate under a blue tarp that drapes over them —
// folds down its sides, sagging corners, a rope tied round with a knot, a brick on top to hold it; the front flap lifts
const TARP = '#3f7fd8', TARP2 = '#3570c4', TARPL = '#5a96e4', ROPE = '#e9d9b8';
B.tarppile = (f, T) => {
  f.add(mc('tarppile2', ({ add }) => {
    add(G.box(.62, .34, .5, .02), '#d9a466', -.04, .17, -.08); add(G.box(.42, .26, .36, .02), '#e9c28e', .1, .47, -.06);
    add(G.box(.22, .2, .22, .02), '#e5483a', -.26, .1, .26); for (let k = 0; k < 3; k++) add(G.pbox(.23, .02, .23), '#c23a2e', -.26, .04 + k * .07, .26);
    // the tarp over the back: a draped top, folds hanging down the back and the sides, sagging corners, a rope and a brick
    add(G.box(.7, .05, .55, .04), TARP, .02, .62, -.12, 0, 0, -.06);
    for (const [x, rz] of [[-.36, .25], [.38, -.3]]) { add(G.box(.06, .5, .56, .03), TARP2, x, .38, -.12, 0, 0, rz); for (let k = 0; k < 3; k++) add(G.box(.025, .48, .05, .01), TARPL, x + (x < 0 ? -.02 : .02), .38, -.32 + k * .2, 0, 0, rz); }
    add(G.box(.72, .55, .05, .03), TARP2, .02, .36, -.4, -.08, 0, 0); for (let k = 0; k < 4; k++) add(G.box(.04, .52, .02, .01), TARPL, -.24 + k * .17, .36, -.38, -.08, 0, 0);
    for (const sx of [-1, 1]) add(G.cone(.08, .14, 6), TARP2, sx * .37, .08, -.38, PI, 0, 0);
    add(G.tor(.33, .014, PI * 2, 5, 24), ROPE, .02, .5, -.12, HP, 0, 0, [1.05, .85, 1]); add(G.sph(.035, 8, 6), ROPE, .3, .52, .08); add(G.cyl(.012, .012, .12, 5), ROPE, .32, .44, .1, .4, 0, 0);
    add(G.box(.2, .07, .1, .015), '#c9744e', -.1, .68, -.15, 0, .4, 0);
  }));
  const tp = grp(); put(tp, -.36, .62, .14); f.add(tp);
  tp.add(mc('tarppile-flap2', ({ add }) => {
    add(G.box(.72, .04, .3, .03), TARP, .38, -.005, .1, -.15, 0, 0); add(G.box(.72, .3, .04, .03), TARP2, .38, -.15, .25, 0, 0, 0);
    for (let k = 0; k < 4; k++) add(G.box(.03, .28, .02, .01), TARPL, .12 + k * .17, -.15, .27);
    for (const x of [.06, .7]) add(G.tor(.025, .008, PI * 2, 4, 10), '#c9cfe0', x, -.27, .27);
  }));
  const p = f.part('lift', tp, t => { tp.rotation.x = -1.1 * t; }, { label: '방수포', sfx: 'lift', dur: .32 });
  f.spot('inside', null, -.26, .21, .26, { part: p, maxH: .18, label: '방수포 밑', scale: .65 });
};

// 전구 줄 (2×1): two wooden posts wound with ivy and a line of warm bulbs strung between them
B.lightline = (f, T, o = {}) => {
  // (o.party, 20판 토순이네 집들이 10/21): a string of paper pennants under the bulbs — pink, butter, mint
  if (o.party) f.add(mc('lightline-party', ({ add, tube }) => {
    const N = 10, tri = new THREE.Shape(); tri.moveTo(-.06, 0); tri.lineTo(.06, 0); tri.lineTo(0, -.13); tri.lineTo(-.06, 0);
    let prev = null;
    for (let k = 0; k <= N; k++) { const t = k / N, x = -.85 + 1.7 * t, y = 1.6 - Math.sin(t * PI) * .2, p = [x, y, -.28]; if (prev) tube(prev, p, .005, '#e8d6a8', 3); prev = p;
      if (k && k < N) add(G.ext(tri, .008, 0, 3), ['#ff9fb8', '#ffd86b', '#9fdcc8'][k % 3], x, y, -.28); }
  }));
  f.add(mc('lightline', ({ add, tube }) => {
    for (const x of [-.85, .85]) { add(G.box(.08, 1.9, .08, .01), WOODD, x, .95, -.3); for (let k = 0; k < 6; k++) add(G.sph(.07, 7, 5), k % 2 ? LEAF : LEAF2, x + Math.sin(k * 1.7) * .06, .3 + k * .26, -.26 + Math.cos(k * 1.7) * .05, 0, 0, 0, [1.1, .9, .8]); add(G.sph(.03, 6, 5), '#ffffff', x + .05, 1.0, -.2); }
    const N = 9; let prev = null;
    for (let k = 0; k <= N; k++) { const t = k / N, x = -.85 + 1.7 * t, y = 1.85 - Math.sin(t * PI) * .25, p = [x, y, -.3]; if (prev) tube(prev, p, .006, DARK, 3); prev = p; if (k && k < N) { add(G.cyl(.008, .008, .05, 4), DARK, x, y - .03, -.3); add(G.sph(.045, 8, 6), '#ffe08a', x, y - .08, -.3); } }
  }));
  f.spot('behind', null, -.85, 0, -.1, { maxH: .3, label: '전구 기둥 밑', scale: .65 });
};

// 상 위 간식 (1×1, small): a low round table with a jug of juice, a plate of tangerines, a plate of rice cakes, two cushions
// (집들이 3차 10/21, user: "탁자 위 케이크·컵·귤·선물이 서로 파묻혀 겹쳐"): every dish has its own place round the table, none
// touching — the party table drops the rice cakes for the cake in the middle and the present
B.snacktable = (f, T, o = {}) => {
  const party = !!o.party;
  // [x, z] of each thing on the top (table radius .32, a doily of .2 under the middle)
  const JUG = party ? [-.2, -.09] : [-.1, -.08], TAN = party ? [.17, .13] : [.1, .08], CUPA = party ? [.19, -.15] : [.14, -.12], CUPB = party ? [-.03, .23] : [-.17, -.02];
  if (party) f.add(mc('snacktable-party2', ({ add }) => {
    add(G.cyl(.09, .09, .08, 16), '#fff4e8', 0, .37, -.03); add(G.cyl(.092, .092, .02, 16), '#ff9fb8', 0, .41, -.03);
    for (let k = 0; k < 6; k++) add(G.sph(.016, 6, 5), '#e8414e', Math.cos(k) * .06, .425, -.03 + Math.sin(k) * .06);
    add(G.cyl(.008, .008, .06, 6), '#9fdcc8', 0, .45, -.03); add(G.sph(.014, 6, 5), '#ffcf4a', 0, .49, -.03);
    const PX = -.17, PZ = .14;
    add(G.box(.11, .09, .11, .02), '#9fc8ff', PX, .355, PZ, 0, .3, 0); add(G.pbox(.12, .092, .022), '#ff9fb8', PX, .355, PZ, 0, .3, 0); add(G.pbox(.022, .092, .12), '#ff9fb8', PX, .355, PZ, 0, .3, 0);
    add(G.sph(.028, 6, 5), '#ff9fb8', PX, .41, PZ, 0, .3, 0, [1.4, .6, .8]);
  }));
  f.add(mc(party ? 'snacktable-p2' : 'snacktable', ({ add }) => {
    add(G.cyl(.32, .32, .05, 18), WOOD, 0, .28, 0); for (const a of [.6, 2.2, 3.8, 5.3]) add(G.box(.04, .26, .04, .01), WOODD, Math.cos(a) * .2, .13, Math.sin(a) * .2);
    add(G.cyl(.06, .07, .16, 12), '#ffd27a', JUG[0], .39, JUG[1]); add(G.tor(.04, .01, PI, 4, 8), '#ffd27a', JUG[0] - .07, .42, JUG[1], 0, PI, 0);
    add(G.cyl(.1, .1, .015, 14), '#ffffff', TAN[0], .31, TAN[1]); for (let k = 0; k < 4; k++) add(G.sph(.032, 8, 6), '#ff9b3a', TAN[0] + Math.cos(k * 1.6) * .045, .34, TAN[1] + Math.sin(k * 1.6) * .045);
    if (!party) { add(G.cyl(.09, .09, .015, 14), '#ffffff', -.12, .31, .14); for (let k = 0; k < 3; k++) add(G.box(.06, .03, .03, .01), '#f3dce6', -.12 + (k - 1) * .04, .33, .14); }
    for (const [x, z, c] of [[-.48, -.15, '#bfe0b8'], [.45, .3, '#ffb3c4']]) { add(G.box(.32, .07, .32, .05), c, x, .035, z); for (let k = 0; k < 3; k++) add(G.pbox(.32, .004, .02), '#ffffff', x, .072, z - .1 + k * .1); }
    add(G.cyl(party ? .13 : .2, party ? .13 : .2, .012, 18), '#fff4e2', 0, .31, party ? -.03 : 0);
    add(G.cyl(.035, .03, .07, 10), '#9fd6c8', CUPA[0], .345, CUPA[1]); add(G.cyl(.035, .03, .07, 10), '#ffb3c4', CUPB[0], .345, CUPB[1]);
  }));
  f.spot('under', null, 0, 0, 0, { maxH: .22, label: '상 밑', scale: .6 });
};

export const VILLAROOF_BUILDERS = B;
// 풍선 (1×1, 집들이): three balloons on long strings tied to a little sandbag — pink, butter and mint
B.balloons = (f, T) => {
  f.add(mc('balloons', ({ add, tube }) => {
    add(G.box(.16, .1, .12, .04), '#c9a98a', 0, .05, 0); add(G.pbox(.17, .02, .13), '#a8875f', 0, .08, 0);
    for (const [x, z, h, c] of [[-.16, -.05, 1.25, '#ff9fb8'], [.12, -.1, 1.45, '#ffd86b'], [.02, .14, 1.12, '#9fdcc8']]) {
      tube([0, .1, 0], [x * .7, h * .5, z * .7], .004, '#f4ecdc', 3); tube([x * .7, h * .5, z * .7], [x, h - .17, z], .004, '#f4ecdc', 3);
      add(G.sph(.17, 14, 10), c, x, h, z, 0, 0, 0, [1, 1.18, 1]); add(G.cone(.03, .05, 8), c, x, h - .21, z, PI, 0, 0); add(G.sph(.04, 6, 5), '#ffffff', x - .06, h + .07, z + .1);
    }
  }));
};

// ── 20판 옥상 2차 (10/21, 레퍼런스 보드 villaroof-refs-1021: "디테일하고 한국적인") ──
// 옥탑방 (2×2): a little red-brick room on the roof's corner — a green steel door with a keypad lock (a part, lockable) and a
// tin awning, blue three-stripe slippers on the step, a barred window with a pot on the sill, the AC unit and a steel ladder
// on the side, and the yellow water tank up on its roof. The room behind the door is shallow: what is in it shows from the door.
const BRICK = '#c06c55', BRICK2 = '#ad5f4a', MORTAR = '#e6cdb8', SLAB = '#ddd5c8', STEELG = '#8a93a3', TANKY = '#f4c23e';
B.oktap = (f, T) => {
  const X0 = -.95, X1 = .6, Z0 = -.94, Z1 = .42, H = 1.72, TW = .08, DX = -.48, DW = .58, DH = 1.28;
  f.add(mc('oktap', ({ add, tube }) => {
    // walls: back, two sides, the front around the door; the floor and a dim inside
    add(G.pbox(X1 - X0, H, TW), BRICK, 0, H / 2, Z0 + TW / 2);
    for (const x of [X0 + TW / 2, X1 - TW / 2]) add(G.pbox(TW, H, Z1 - Z0), BRICK, x, H / 2, (Z0 + Z1) / 2);
    const dl = DX - DW / 2, dr = DX + DW / 2;
    add(G.pbox(dl - X0, H, TW), BRICK, (X0 + dl) / 2, H / 2, Z1 - TW / 2);
    add(G.pbox(X1 - dr, H, TW), BRICK, (dr + X1) / 2, H / 2, Z1 - TW / 2);
    add(G.pbox(DW, H - DH, TW), BRICK, DX, DH + (H - DH) / 2, Z1 - TW / 2);
    add(G.pbox(X1 - X0 - TW * 2, .02, Z1 - Z0 - TW * 2), '#cfc3b0', 0, .01, (Z0 + Z1) / 2);
    add(G.pbox(X1 - X0 - TW * 2, H - .02, .02), '#8a6e62', 0, H / 2, Z0 + TW + .01);
    // brick courses on the front and the right side (staggered, two tones, mortar showing between)
    for (let r = 0; r < 14; r++) { const y = .08 + r * .118, off = r % 2 ? .12 : 0;
      for (let x = X0 + .05 + off; x < X1 - .1; x += .24) { if (x + .1 > dl - .02 && x - .1 < dr + .02 && y < DH + .04) continue;
        add(G.pbox(.21, .095, .012), (r * 3 + Math.round(x * 7)) % 4 ? BRICK : BRICK2, x + .1, y, Z1 + .006); }
      for (let z = Z0 + .06 + off; z < Z1 - .1; z += .24) add(G.pbox(.012, .095, .21), (r * 5 + Math.round(z * 7)) % 4 ? BRICK : BRICK2, X1 + .006, y, z + .1); }
    add(G.pbox(X1 - X0 + .02, .05, .012), MORTAR, 0, .025, Z1 + .008);
    // the roof slab with a lip, painted green on top like the floor
    add(G.box(X1 - X0 + .16, .1, Z1 - Z0 + .16, .015), SLAB, 0, H + .05, (Z0 + Z1) / 2);
    add(G.pbox(X1 - X0 + .08, .012, Z1 - Z0 + .08), '#7fb48a', 0, H + .106, (Z0 + Z1) / 2);
    // door frame, tin awning over the door, the step
    for (const x of [dl - .02, dr + .02]) add(G.pbox(.04, DH + .04, .05), '#e9e2d6', x, (DH + .04) / 2, Z1 + .01);
    add(G.pbox(DW + .08, .04, .05), '#e9e2d6', DX, DH + .02, Z1 + .01);
    add(G.box(DW + .3, .03, .3, .01), '#e8e4dc', DX, DH + .2, Z1 + .13, -.28, 0, 0);
    for (const x of [DX - DW / 2 - .1, DX + DW / 2 + .1]) tube([x, DH + .22, Z1 + .01], [x, DH + .14, Z1 + .27], .008, STEELG, 4);
    add(G.box(DW + .2, .07, .26, .015), '#d8d0c2', DX, .035, Z1 + .13);
    for (const [sx, a] of [[-.08, -.15], [.08, .2]]) { add(G.box(.09, .025, .2, .02), '#3b6fd6', DX + sx, .085, Z1 + .16, 0, a, 0);
      for (let k = 0; k < 3; k++) add(G.pbox(.095, .006, .018), '#ffffff', DX + sx - Math.sin(a) * (k - 1) * .03, .1, Z1 + .12 + (k - 1) * .03); }
    // the barred window, a pot on the sill
    const WX = .18, WY = 1.0, WW = .5, WH = .46;
    add(G.pbox(WW, WH, .02), '#bfe0ec', WX, WY, Z1 + .005); add(G.pbox(.01, WH, .025), '#ffffff', WX, WY, Z1 + .01);
    add(G.pbox(WW + .06, .04, .05), '#ffffff', WX, WY + WH / 2 + .02, Z1 + .02); add(G.pbox(WW + .1, .04, .12), '#e9e2d6', WX, WY - WH / 2 - .02, Z1 + .05);
    for (let k = 0; k < 5; k++) add(G.cyl(.008, .008, WH + .06, 5), '#55606e', WX - WW / 2 + .05 + k * (WW - .1) / 4, WY, Z1 + .07);
    for (const y of [WY - WH / 2 - .02, WY + WH / 2 + .02]) add(G.pbox(WW + .04, .016, .016), '#55606e', WX, y, Z1 + .07);
    add(G.cyl(.06, .045, .1, 12), '#d98b5f', WX + .14, WY - WH / 2 + .05, Z1 + .06); for (let k = 0; k < 4; k++) add(G.sph(.045, 8, 6), k % 2 ? LEAF : LEAF2, WX + .14 + Math.cos(k * 1.6) * .03, WY - WH / 2 + .14 + (k % 2) * .03, Z1 + .06 + Math.sin(k * 1.6) * .03);
    // the AC unit on the side and its pipe, the ladder up to the roof
    add(G.box(.24, .4, .52, .02), '#f1f2ee', X1 + .14, .22, -.42); add(G.cyl(.14, .14, .01, 18), '#c9ccd2', X1 + .265, .24, -.42, 0, 0, HP);
    for (let k = 0; k < 4; k++) add(G.tor(.03 + k * .028, .005, PI * 2, 3, 16), '#9aa0aa', X1 + .27, .24, -.42, 0, HP, 0);
    for (const z of [-.02, .22]) tube([X1 + .06, 0, z], [X1 + .06, H + .3, z], .014, STEELG, 6);
    for (let y = .2; y < H + .2; y += .22) tube([X1 + .06, y, -.02], [X1 + .06, y, .22], .01, STEELG, 5);
    // the yellow tank on a short steel stand up on the roof, its pipe coming down the back
    const TY = H + .11, TR = .3, TX = .12, TZ = -.4;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.pbox(.04, .18, .04), STEELG, TX + sx * .2, TY + .09, TZ + sz * .2);
    add(G.pbox(.48, .03, .48), STEELG, TX, TY + .19, TZ);
    add(G.cyl(TR, TR * .94, .5, 24), TANKY, TX, TY + .45, TZ);
    for (const y of [.3, .45, .6]) add(G.tor(TR + .004, .014, PI * 2, 4, 24), '#e2ac2a', TX, TY + y, TZ, HP, 0, 0);
    add(G.sph(TR, 24, 10), TANKY, TX, TY + .7, TZ, 0, 0, 0, [1, .32, 1]); add(G.cyl(.1, .1, .05, 14), '#ffd768', TX, TY + .8, TZ);
    tube([TX - .2, TY + .3, TZ - .2], [X0 + .3, TY + .3, TZ - .2], .02, '#cfd3da', 6); tube([X0 + .3, TY + .3, TZ - .2], [X0 + .3, .5, Z0 - .04], .02, '#cfd3da', 6);
    // a little satellite dish on the roof's front corner
    add(G.cyl(.012, .012, .2, 5), STEELG, X0 + .22, H + .2, Z1 - .15); add(G.sph(.13, 12, 6), '#f3f3f0', X0 + .22, H + .33, Z1 - .1, -.9, 0, .3, [1, .3, 1]);
  }));
  // the door: green steel, a keypad lock and a lever handle; it swings out
  const dv = grp(); put(dv, DX - DW / 2, 0, Z1 + .005); f.add(dv);
  dv.add(mc('oktap-door', ({ add }) => {
    add(G.box(DW - .02, DH - .02, .04, .01), '#4f8f6a', DW / 2, DH / 2, 0); add(G.box(DW - .14, DH * .38, .01, .005), '#5ea079', DW / 2, DH * .7, .022);
    add(G.box(DW - .14, DH * .38, .01, .005), '#5ea079', DW / 2, DH * .27, .022);
    add(G.box(.07, .16, .025, .008), '#2c2f36', DW - .1, DH * .55, .03); add(G.pbox(.045, .05, .006), '#8fd3f4', DW - .1, DH * .58, .044);
    add(G.box(.1, .025, .025, .01), '#c9cfd8', DW - .12, DH * .45, .04);
  }));
  const p = f.part('door', dv, (t, b) => { dv.rotation.y = -1.5 * t; }, { label: '옥탑방 문', sfx: 'door', dur: .34 });
  p.lockable = true; p.lockKind = 'code'; p.lockAt = { x: DW - .1, y: DH * .52, z: .06, parent: dv };
  f.spot('inside', null, DX, .02, Z1 - .32, { part: p, maxH: .32, label: '옥탑방 문 안', scale: .85 });
  f.spot('on', null, .18 - .1, 1.0 - .23 + .02, Z1 + .07, { maxH: .14, label: '옥탑방 창턱', scale: .6 });
  f.spot('on', null, .12, H + .12, -.4 + .3, { maxH: .18, label: '물탱크 밑', scale: .65 });
};

// 고무 대야 텃밭 (1×1): a big round rubber tub of soil — red with a frill of lettuce, or black with green onions and chillies
B.rubbertub = (f, T, o = {}) => {
  const black = o.kind === 'onion', c = black ? '#3a3a40' : '#d8473b', c2 = black ? '#2a2a30' : '#b93a30';
  f.add(mc('rubbertub|' + (black ? 'o' : 'l'), ({ add }) => {
    add(G.cyl(.34, .29, .3, 22), c, 0, .15, 0); add(G.tor(.335, .028, PI * 2, 6, 26), c2, 0, .3, 0, HP, 0, 0);
    add(G.cyl(.315, .315, .02, 22), '#6e4e36', 0, .27, 0);
    if (black) {
      for (let k = 0; k < 9; k++) { const a = k * 2.4, r = .06 + (k % 3) * .07; for (let m = 0; m < 3; m++) add(G.cyl(.012, .016, .34 - m * .06, 5), m ? '#6cbf5a' : '#4fa64f', Math.cos(a) * r + (m - 1) * .015, .44 - m * .03, Math.sin(a) * r - .08, (m - 1) * .15, 0, (m - 1) * .12); add(G.cyl(.018, .018, .05, 6), '#f4f0e0', Math.cos(a) * r, .3, Math.sin(a) * r - .08); }
      for (let k = 0; k < 2; k++) { const x = -.12 + k * .26, z = .14; add(G.cyl(.012, .015, .3, 5), LEAF2, x, .43, z); for (let m = 0; m < 4; m++) add(G.sph(.055, 7, 5), LEAF, x + Math.cos(m * 1.6) * .06, .48 + m * .04, z + Math.sin(m * 1.6) * .06);
        for (let m = 0; m < 3; m++) add(G.cone(.02, .1, 6), m % 2 ? '#3f9e44' : '#e5483a', x + (m - 1) * .05, .45, z + .06, PI, 0, (m - 1) * .3); }
    } else for (let k = 0; k < 5; k++) { const a = k * 1.26 + .3, cx = Math.cos(a) * .22, cz = Math.sin(a) * .22;
      for (let m = 0; m < 5; m++) { const b = m * 1.26; add(G.sph(.06, 8, 5), m % 2 ? '#8fd46a' : (k % 2 ? '#a8475a' : LEAF), cx + Math.cos(b) * .04, .32 + (m % 2) * .03, cz + Math.sin(b) * .04, 0, b, .5, [1.2, .5, .9]); } }
  }));
  f.spot('beside', null, black ? .34 : -.34, 0, .34, { maxH: .26, label: black ? '까만 대야 옆' : '빨간 대야 옆', scale: .65 });
};

// 빨랫줄과 이불 (2×1): two wooden posts set in cement-filled paint pails, a line sagging between them; a pink flowered quilt folded
// over the line (its front half flips up — a part), a towel and two socks pegged at the end. (10/22 밤 사용자 "이불이 판자처럼
// 빳빳하고 평평, 회색 쇠기둥": the quilt, its back half and the towel are cloth now — soft folds deepening toward the hem, the
// flowers riding on them — and the line sags; wooden posts)
const QUILT = '#ffb3c4', QUILT2 = '#f7a0b4';
// (① 10/21: 'roofline', not 'clothesline' — that name is outdoor.js's alley clothesline, and this one, registered later,
// took its place in every alley and yard stage from 1.0.147)
B.roofline = (f, T) => {
  const LY = 1.38, QX = -.25, QW = 1.12, sag = x => LY - .06 * (1 - (x / .9) ** 2), QY = sag(QX);
  const zt = clothWave(.32, .44, 2, .016), zb = clothWave(QW, .86, 3, .022);
  f.add(mc('clothesline2', ({ add, tube }) => {
    for (const x of [-.9, .9]) { add(G.cyl(.13, .11, .22, 14), '#e9e4d8', x, .11, 0); add(G.cyl(.12, .12, .01, 14), '#a9a49a', x, .215, 0); tube([x, .2, 0], [x, LY + .06, 0], .024, '#c98f58', 8); add(G.sph(.034, 8, 6), '#b97c45', x, LY + .08, 0); }
    for (let k = 0; k < 4; k++) { const a = -.9 + k * .45, b = a + .45; tube([a, sag(a), 0], [b, sag(b), 0], .006, '#e8e2d2', 3); }
    // the back half of the quilt (hangs a little shorter), its fold over the line
    add(clothSlab(QW, .86, .03, zb), QUILT2, QX, QY, -.04); add(G.cyl(.04, .04, QW, 10), QUILT, QX, QY + .005, 0, 0, 0, HP);
    // the towel and the socks at the right end, wooden pegs
    add(clothSlab(.32, .44, .02, zt), '#9fdcc8', .58, sag(.58), 0); for (let k = 0; k < 3; k++) add(clothSlab(.32, .02, .022, zt, -.09 - k * .12), '#ffffff', .58, sag(.58), .002);
    for (const [x, c] of [[.22, '#ffd86b'], [.3, '#9fc8ff']]) { add(G.box(.06, .18, .015, .01), c, x, sag(x) - .1, 0); add(G.box(.09, .05, .015, .01), c, x + .02, sag(x) - .18, 0); }
    for (const x of [.24, .3, .45, .71]) add(G.pbox(.014, .05, .02), '#d9a466', x, sag(x) + .01, .005);
  }));
  // the front half of the quilt (20판 3차 10/21, user: "이불 올라가는 것도 카펫처럼 벤딩. 약간 페이지턴처럼 말려서 살짝 올라가는
  // 정도"; ③ #97 "25 이불도 벤딩으로": the six stiff strips still read as boards — now one cloth that bends, gfx/clothbend.js):
  // lifted, the bottom edge curls up and back first and the curl climbs, the top staying on the line. keyAt: a hook on the
  // inside near the bottom where something can hang until the quilt lifts (② 레벨: f.quiltKeyAt, parent the key to it)
  const QH = .96, root = grp(), zq = clothWave(QW, QH, 3, .045); put(root, QX, QY, .03); f.add(root);
  root.add(mc('clothesline-quilt5', ({ add }) => {
    add(clothSlab(QW, QH, .03, zq), QUILT, 0, 0, .01);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const x = -.42 + c * .28 + (r % 2) * .14, y = -.14 - r * .22;
      if (x > .5) continue;
      for (let m = 0; m < 5; m++) { const px = x + Math.cos(m * 1.26) * .03, py = y + Math.sin(m * 1.26) * .03; add(G.sph(.026, 6, 4), '#ffffff', px, py, .03 + zq(px, py), 0, 0, 0, [1, 1, .3]); }
      add(G.sph(.016, 6, 4), '#ffd86b', x, y, .034 + zq(x, y), 0, 0, 0, [1, 1, .3]);
    }
    add(clothSlab(QW, .03, .035, zq, -QH + .03), '#ffffff', 0, 0, .012);
  }));
  const keyAt = grp(); put(keyAt, .22, -QH + .1, -.01); root.add(keyAt);
  // the bend: the bottom curls first, the curl climbs; a little past at the end, then back (③ ui69 timing — the page-turn
  // sound, a touch longer so the roll is seen)
  const p = f.part('lift', root, clothBend(f, root, { along: [0, -1, 0], toward: [0, 0, 1], len: QH, turn: 4.4, bias: 3, tip: .15, follow: [keyAt] }), { label: '이불', sfx: 'flip', dur: .72 });
  f.quiltKeyAt = keyAt;
  f.spot('inside', null, QX, 0, 0, { part: p, maxH: .36, label: '이불 뒤', scale: .8 });
  // (② 레벨 10/21, user "이불 들추면 열쇠가 차릉 아래로 떨어지게"): the hook inside the quilt — a stage's key hangs here (clueHang) and drops
  // onto '이불 뒤' when the quilt lifts (stage.js dropHung)
  f.spot('on', keyAt, 0, 0, 0, { maxH: .24, label: '이불 속', scale: .8 }).hang = p;
  f.spot('beside', null, .9, .22, 0, { maxH: .18, label: '빨래 기둥 깡통 위', scale: .55 });
};

// 파라솔과 빨간 의자 (2×1): a white plastic table under a green-and-cream parasol, two red plastic chairs, a spare stack of
// red stools at the end; barley tea and two paper cups, a round paper fan on the table
const PRED = '#e2403a', PRED2 = '#c8352f';
B.parasolset = (f, T) => {
  const TX = -.2, TY = .58, PY = 1.92, PR = .82;
  const chair = (add, x, z, ry) => {
    const m = new THREE.Matrix4().makeRotationY(ry), P = (px, py, pz) => { const v = new THREE.Vector3(px, py, pz).applyMatrix4(m); return [x + v.x, py, z + v.z]; };
    let q = P(0, .4, 0); add(G.box(.38, .045, .36, .02), PRED, q[0], q[1], q[2], 0, ry, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { q = P(sx * .15, .2, sz * .14); add(G.cyl(.022, .03, .4, 6), PRED2, q[0], q[1], q[2], sz * .06, ry, -sx * .06); }
    q = P(0, .66, -.18); add(G.box(.36, .26, .035, .02), PRED, q[0], q[1], q[2], -.14, ry, 0);
    q = P(0, .7, -.165); add(G.box(.16, .05, .04, .02), '#f2efe8', q[0], q[1], q[2], -.14, ry, 0);
  };
  f.add(mc('parasolset', ({ add, tube }) => {
    add(G.cyl(.3, .3, .03, 22), '#f6f4ef', TX, TY, 0); add(G.tor(.3, .015, PI * 2, 4, 22), '#e3e0d8', TX, TY - .005, 0, HP, 0, 0);
    for (let k = 0; k < 4; k++) { const a = k * HP + .4; tube([TX + Math.cos(a) * .22, TY - .02, Math.sin(a) * .22], [TX + Math.cos(a) * .27, 0, Math.sin(a) * .27], .02, '#e9e6de', 6); }
    tube([TX, 0, 0], [TX, PY, 0], .018, '#f2efe8', 6); add(G.cyl(.12, .14, .06, 14), '#c9c4b8', TX, .03, 0);
    for (let k = 0; k < 8; k++) { const g = new THREE.ConeGeometry(PR, .34, 3, 1, true, k * PI / 4, PI / 4); add(g, k % 2 ? '#f4ecd8' : '#6fbf8e', TX, PY - .17, 0); }
    for (let k = 0; k < 8; k++) { const a = (k + .5) * PI / 4; add(G.sph(.05, 8, 5), k % 2 ? '#6fbf8e' : '#f4ecd8', TX + Math.sin(a) * PR * .93, PY - .35, Math.cos(a) * PR * .93, 0, 0, 0, [1, .6, 1]); }
    add(G.sph(.04, 8, 6), '#f4ecd8', TX, PY + .01, 0);
    chair(add, TX - .52, .04, HP + .2); chair(add, TX + .5, -.08, -HP - .25);
    for (let k = 0; k < 3; k++) { add(G.cyl(.17, .15, .04, 16), PRED, .82, .34 + k * .035, .18); }
    for (const a of [.4, 1.97, 3.54, 5.1]) add(G.cyl(.02, .028, .32, 6), PRED2, .82 + Math.cos(a) * .12, .16, .18 + Math.sin(a) * .12);
    add(G.cyl(.05, .055, .2, 12), '#e8c784', TX - .08, TY + .115, -.08); add(G.cyl(.03, .03, .03, 10), '#3b6fd6', TX - .08, TY + .23, -.08);
    for (const [x, z] of [[.06, .06], [.1, -.12]]) add(G.cyl(.032, .025, .08, 10), '#ffffff', TX + x, TY + .055, z);
    add(G.cyl(.11, .11, .008, 16), '#ffd86b', TX - .02, TY + .02, .14, HP - .1, 0, .4); add(G.cyl(.008, .008, .12, 5), '#c99a62', TX - .02, TY + .02, .27, HP, 0, 0);
  }));
  f.spot('under', null, TX + .14, 0, .14, { maxH: .4, label: '파라솔 탁자 밑', scale: .75 });
  f.spot('on', null, .82, .45, .18, { maxH: .2, label: '빨간 의자 더미 위', scale: .6 });
};

// ── 20판 옥상 3차 (10/21, user on the phone: "대체 저 파란 건 대체 뭘까 … 디테일 잡자") — the blue tarp goes; things a Korean
// rooftop really has, each reading at a glance: chillies drying on a straw mat, the rooftop tap with its hose, pots on the deck
// 고추 말리기 (1×1): a straw mat with rows of red chillies drying in the sun, two green plastic 소쿠리 stacked upside down on its
// corner (the top one lifts — a part), pink rubber gloves on the edge
const STRAW = '#ecd59a', STRAW2 = '#d9bd78', CHILI = '#e2392f', CHILI2 = '#c92d25', SOKURI = '#5cc08a', SOKURI2 = '#45a875';
B.chilimat = (f, T) => {
  f.add(mc('chilimat', ({ add }) => {
    add(G.box(.86, .02, .8, .01), STRAW, 0, .01, 0);
    for (let k = 0; k < 9; k++) add(G.pbox(.86, .004, .012), STRAW2, 0, .021, -.36 + k * .09);
    add(G.pbox(.88, .012, .03), '#5a8fd0', 0, .016, .4); add(G.pbox(.88, .012, .03), '#5a8fd0', 0, .016, -.4);
    let n = 0;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
      const x = -.34 + c * .12 + (r % 2) * .05, z = -.3 + r * .1;
      if (x > .08 && z < -.02) continue;   // (the baskets' corner)
      const a = ((n++ * 2.39) % 1) * .9 - .45;
      add(G.cap(.017, .07, 2, 5), n % 3 ? CHILI : CHILI2, x, .036, z, HP, a, 0);
      add(G.cyl(.006, .008, .025, 4), '#4f9a3f', x + Math.sin(a) * .055, .036, z + Math.cos(a) * .055, HP, a, 0);
    }
    add(G.cyl(.21, .17, .13, 16, true), SOKURI, .22, .065, -.2); add(G.cyl(.17, .17, .01, 16), SOKURI2, .22, .13, -.2);
    add(G.tor(.205, .014, PI * 2, 4, 20), SOKURI2, .22, .005, -.2, HP, 0, 0);
    for (let k = 0; k < 2; k++) add(G.box(.11, .022, .2, .01), '#ff9fb8', -.24 + k * .06, .03, .33, 0, .3 + k * .25, 0);
  }));
  const sk = grp(); put(sk, .22, .13, -.2); f.add(sk);
  sk.add(mc('chilimat-sokuri', ({ add }) => {
    add(G.cyl(.205, .165, .13, 16, true), SOKURI, 0, .065, 0); add(G.cyl(.165, .165, .01, 16), SOKURI2, 0, .13, 0);
    add(G.tor(.2, .014, PI * 2, 4, 20), SOKURI2, 0, .005, 0, HP, 0, 0);
    for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; add(G.cyl(.012, .012, .006, 5), '#2f7a52', Math.cos(a) * .185, .07, Math.sin(a) * .185, 0, 0, 0); }
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; add(G.cyl(.014, .014, .012, 6), '#2f7a52', Math.cos(a) * .08, .136, Math.sin(a) * .08); }
  }));
  const p = f.part('lift', sk, (t, b) => { sk.position.y = b.p.y + .28 * t; sk.rotation.x = -.5 * t; sk.rotation.z = .2 * t; }, { label: '소쿠리', sfx: 'lift', dur: .28 });
  f.spot('inside', null, .22, .14, -.2, { part: p, maxH: .12, label: '소쿠리 밑', scale: .5 });
  f.spot('beside', null, -.3, 0, .38, { maxH: .2, label: '고추 돗자리 앞', scale: .6 });
};

// 옥상 수도 (1×1): the rooftop tap on its standing pipe, a green hose coiled on the floor, a blue bucket under the tap with a
// scrubber, a broom and dustpan leaning on the pipe
B.rooftap = (f, T) => {
  const PX = -.28, PZ = -.25;
  f.add(mc('rooftap', ({ add, tube }) => {
    add(G.box(.2, .06, .2, .02), '#d9d2c4', PX, .03, PZ);
    tube([PX, .05, PZ], [PX, .66, PZ], .03, '#9aa3b2', 8);
    tube([PX, .62, PZ], [PX + .1, .62, PZ], .024, '#9aa3b2', 8); add(G.cone(.03, .07, 8), '#9aa3b2', PX + .12, .585, PZ, PI, 0, 0);
    add(G.cyl(.012, .012, .06, 6), '#e2403a', PX + .06, .68, PZ); add(G.box(.08, .016, .02, .006), '#e2403a', PX + .06, .71, PZ);
    for (let k = 0; k < 4; k++) add(G.tor(.17 - k * .04, .022, PI * 2, 5, 18), k % 2 ? '#4fb06a' : '#5cc278', .12, .022 + (k % 2) * .012, .14, HP, 0, 0);
    tube([PX + .12, .56, PZ], [PX + .2, .1, PZ + .2], .02, '#5cc278', 6); tube([PX + .2, .1, PZ + .2], [.0, .03, .14], .02, '#5cc278', 6);
    add(G.cyl(.15, .12, .26, 16, true), '#4a8fe0', PX + .13, .13, PZ + .12); add(G.cyl(.12, .12, .01, 16), '#3a78c8', PX + .13, .012, PZ + .12);
    add(G.tor(.15, .012, PI * 2, 4, 18), '#3a78c8', PX + .13, .26, PZ + .12, HP, 0, 0);
    add(G.box(.09, .04, .06, .015), '#ffd86b', PX + .1, .27, PZ + .2, .3, 0, 0);
    tube([PX - .1, 0, PZ + .14], [PX - .02, .92, PZ + .02], .014, '#c99a62', 5);
    add(G.cone(.08, .22, 8), '#e9c47a', PX - .11, .1, PZ + .16, -.09, 0, .09, [1, 1, .45]);
    add(G.box(.2, .02, .16, .01), '#e2403a', PX - .02, .12, PZ - .1, -1.25, 0, 0); tube([PX - .02, .2, PZ - .16], [PX - .02, .4, PZ - .2], .01, '#e2403a', 5);
  }));
  f.spot('inside', null, PX + .13, .02, PZ + .12, { maxH: .18, label: '파란 양동이 안', scale: .5 });
  f.spot('beside', null, .25, 0, -.25, { maxH: .26, label: '수도 옆', scale: .6 });
};

// 데크 화분 줄 (2×1): a line of pots along the deck's edge — a big lettuce pot, a tomato on a stick with red cherries, a jade
// plant, marigolds in a long planter, a little watering can
B.potrow = (f, T) => {
  f.add(mc('potrow', ({ add, tube }) => {
    add(G.cyl(.15, .12, .2, 14), '#d98b5f', -.66, .1, 0); for (let m = 0; m < 6; m++) { const b = m * 1.05; add(G.sph(.07, 8, 5), m % 2 ? '#8fd46a' : LEAF, -.66 + Math.cos(b) * .06, .23 + (m % 2) * .03, Math.sin(b) * .06, 0, b, .5, [1.2, .55, .9]); }
    add(G.cyl(.12, .1, .18, 14), '#f1ece2', -.3, .09, -.05); tube([-.3, .18, -.05], [-.3, .66, -.05], .008, '#c99a62', 4);
    for (let m = 0; m < 6; m++) add(G.sph(.06, 7, 5), m % 2 ? LEAF : LEAF2, -.3 + Math.cos(m * 2.1) * .07, .26 + m * .065, -.05 + Math.sin(m * 2.1) * .06, 0, 0, 0, [1.2, .7, 1]);
    for (const [x, y, z] of [[-.24, .36, .02], [-.36, .45, .0], [-.25, .55, -.1], [-.33, .3, .03]]) add(G.sph(.026, 7, 5), '#e8414e', x, y, z);
    add(G.box(.62, .16, .2, .03), '#9a6a4a', .2, .08, 0);
    for (let k = 0; k < 6; k++) { const x = -.04 + k * .1; add(G.sph(.05, 7, 5), LEAF2, x, .2, (k % 2 - .5) * .05, 0, 0, 0, [1.2, .6, 1]); add(G.sph(.04, 7, 5), k % 2 ? '#ffb43a' : '#ff8a2a', x + .01, .25, (k % 2 - .5) * .05); }
    add(G.cyl(.08, .07, .1, 12), '#3b6fd6', .64, .05, .04); for (let k = 0; k < 4; k++) add(G.cap(.025, .07, 2, 6), '#7cc46a', .64 + Math.cos(k * 1.6) * .03, .14, .04 + Math.sin(k * 1.6) * .03, (k - 1.5) * .25, 0, 0);
  }));
  f.spot('beside', null, .5, 0, .2, { maxH: .2, label: '화분 줄 앞', scale: .6 });
};

export const VILLAROOF_INFO = {
  oktap: { w: 2, d: 2, name: '옥탑방', hidden: true },
  chilimat: { w: 1, d: 1, name: '고추 말리기', hidden: true },
  rooftap: { w: 1, d: 1, name: '옥상 수도', hidden: true },
  potrow: { w: 2, d: 1, name: '데크 화분 줄', hidden: true },
  rubbertub: { w: 1, d: 1, name: '고무 대야 텃밭', hidden: true },
  roofline: { w: 2, d: 1, name: '빨랫줄', hidden: true },
  parasolset: { w: 2, d: 1, name: '파라솔 자리', hidden: true },
  balloons: { w: 1, d: 1, name: '풍선', hidden: true },
  parapet: { w: 2, d: 1, name: '덩굴 난간', price: 140, region: 'apt' },
  foambox: { w: 1, d: 1, name: '스티로폼 텃밭', price: 80, region: 'apt' },
  tarppile: { w: 1, d: 1, name: '방수포 짐', price: 90, region: 'apt' },
  lightline: { w: 2, d: 1, name: '전구 줄', price: 160, region: 'apt' },
  snacktable: { w: 1, d: 1, name: '간식 상', price: 90, region: 'apt' },
};

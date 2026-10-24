// 내 방 새 물건 (⑥ 10/24 밤 — 사용자 "내방꾸미기 놀러가기 숨기기 이것도 업데이트해줄래? 지붕이랑 아이템들 새로 추가해주고"): eighteen new
// models for the home shop, each a theme of its own with everyday detail you can look at, most of them a place to hide
// something (a door, a lid, a curtain, a drawer, a flap) for 숨기기 and 털기.
//   가구 8 (shop 가구 tab): 화장대 · 미니 오븐 카트 · 다육이 계단 선반 · 보드게임 장 · 벽난로 · 미싱 책상 · 햄스터 집 · 인형집
//   스페셜 4 (specials.js): 가챠 머신 · 고무 풀장 · 붕어빵 포장마차 · 즉석사진 부스
//   물건 6 (shop 물건 tab, things to hide): 종이학 · 달고나 · 오뚝이 · 다마고치 · 즉석 사진 · 털모자
// None repeats a theme the shop already sells (어항·빨래·컵라면·TV장·텐트·오르골·기차·나무집 are there: checked 10/24).
// Ink-outlined cel shading like the rest; big faces soft, small things the point colours.
import * as THREE from 'three';
import { put, grp, mat, mesh, geo, shade, heartShape, starShape, canvasTex, texCache, rbox, sph, cyl, tor, cone } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { EN } from '../i18n-en-dict.js';

const PI = Math.PI, HP = PI / 2;
const K = (ko, en) => { EN[ko] = en; return ko; };
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', WOOD = '#d9a466', WOODD = '#a8733f', STEEL = '#c9cfe0', STEEL2 = '#a9b2c8',
  PINK = '#ff9fb5', MINT = '#7fd6c0', SKY = '#8fd3f4', LEAF = '#6cc46a', LEAF2 = '#4ea85a', TOMATO = '#ff6b57', LILAC = '#b9a6ff', HONEY = '#ffcf5c';
const GLOSS = { rough: .38 };
const TEX = texCache();
const tex = (key, w, h, draw) => TEX.get(key, () => canvasTex(w, h, draw));
const live = (f, parent = null) => { const g = grp(); (parent || f.group).add(g); (f.live ||= []).push(g); return g; };
const B = {};
// a cabinet body open at the front (back, two sides, floor, top): what sits inside shows when its door opens
// (the back and the floor sit between the sides, under the top: no two panels of different colours share a face, or bake.js's
// deFlush pushes them apart — it moved a whole top 5 cm, 10/24)
const shell = (add, w, h, d, x, y, z, c, ci, t = .025) => {
  for (const s of [-1, 1]) add(G.box(t, h, d, .008), c, x + s * (w / 2 - t / 2), y + h / 2, z);
  add(G.box(w, t, d, .008), c, x, y + h - t / 2, z);
  add(G.box(w - 2 * t, h - 2 * t, t, .006), ci, x, y + h / 2, z - d / 2 + t / 2); add(G.box(w - 2 * t, t, d - t, .006), ci, x, y + t / 2, z + t / 2);
};

// ═══ 가구 ════════════════════════════════════════════════════════════════════════════════════════════════════════════

// 화장대 (1×1): a white vanity with a round mirror ringed by bulbs, a lipstick, a perfume bottle, a jar of brushes, a little
// dish of rings and a hair dryer hung on its side; one drawer slides out; a pink tufted stool in front
B.hm_vanity = f => {
  const TY = .74, W = .82, D = .42, z0 = -.18, VW = '#fdfaf6';
  f.add(mc('hm-vanity', ({ add, tube }) => {
    add(G.box(W, .04, D, .015), VW, 0, TY - .02, z0);
    for (const sx of [-1, 1]) { add(G.box(.05, TY - .04, .05, .01), VW, sx * (W / 2 - .04), (TY - .04) / 2, z0 + .15); add(G.box(.05, TY - .04, .05, .01), VW, sx * (W / 2 - .04), (TY - .04) / 2, z0 - .15); add(G.sph(.02, 8, 6), '#e2c070', sx * (W / 2 - .04), .02, z0 + .15); }
    add(G.box(W - .1, .12, D - .04, .01), shade(VW, -.04), 0, TY - .1, z0);
    // the mirror: a frame ring, glass, bulbs round it
    const my = TY + .38; add(G.cyl(.3, .3, .04, 32), '#f4d6dc', 0, my, z0 - .14, HP, 0, 0); add(G.cyl(.25, .25, .045, 32), '#cfe6f2', 0, my, z0 - .14, HP, 0, 0);
    add(G.box(.06, .2, .04, .01), '#f4d6dc', 0, TY + .08, z0 - .15);
    for (let k = 0; k < 10; k++) { const a = k / 10 * PI * 2; add(G.sph(.026, 8, 6), '#fff6d8', Math.cos(a) * .28, my + Math.sin(a) * .28, z0 - .11); }
    add(G.box(.12, .26, .005, .002), '#eaf6fb', -.08, my + .04, z0 - .115, 0, 0, .5);
    // things on top
    add(G.cyl(.018, .018, .07, 10), '#d9534f', -.3, TY + .035, z0 + .06); add(G.cyl(.016, .016, .025, 10), '#ff6f7a', -.3, TY + .08, z0 + .06);
    add(G.box(.07, .09, .05, .015), '#ffc9d6', -.2, TY + .045, z0 + .02); add(G.cyl(.012, .012, .03, 8), '#e2c070', -.2, TY + .105, z0 + .02); add(G.sph(.018, 8, 6), '#ffb3cc', -.2, TY + .13, z0 + .02);
    add(G.cyl(.04, .035, .1, 12), '#b8e0d6', .26, TY + .05, z0 + .02); for (const [dx, c] of [[-.01, '#4a4458'], [.012, '#c98a52'], [0, '#ff9fb5']]) tube([.26 + dx, TY + .08, z0 + .02], [.26 + dx * 2.5, TY + .22, z0 + .02 + dx], .006, c, 4);
    add(G.cyl(.05, .04, .015, 14), WHITE, .14, TY + .008, z0 + .1); add(G.tor(.015, .004, PI * 2, 4, 10), '#e2c070', .13, TY + .02, z0 + .1, HP, 0, 0); add(G.tor(.013, .004, PI * 2, 4, 10), '#c9cfe0', .155, TY + .02, z0 + .11, HP, 0, 0);
    // the hair dryer on its side hook
    add(G.box(.02, .04, .02, .005), STEEL2, W / 2 + .01, TY - .06, z0); add(G.cyl(.04, .04, .12, 12), LILAC, W / 2 + .04, TY - .14, z0, HP, 0, 0); add(G.cyl(.018, .022, .12, 10), LILAC, W / 2 + .04, TY - .22, z0 - .03);
    // the stool
    add(G.cyl(.17, .17, .1, 18), '#ffb3c6', 0, .48, .26); for (const [x, z] of [[-.08, .2], [.08, .2], [-.08, .32], [.08, .32], [0, .26]]) add(G.sph(.012, 6, 5), shade('#ffb3c6', -.15), x, .53, z, 0, 0, 0, [1, .5, 1]);
    for (let k = 0; k < 4; k++) { const a = k * HP + PI / 4; tube([Math.cos(a) * .12, .43, .26 + Math.sin(a) * .12], [Math.cos(a) * .14, 0, .26 + Math.sin(a) * .14], .014, '#e2c070', 5); }
  }));
  const dr = grp(); put(dr, .2, TY - .1, z0 + D / 2); f.add(dr);
  dr.add(mc('hm-vanity-drawer', ({ add }) => {
    add(G.box(.32, .1, .02, .008), '#fdf0f2', 0, 0, .01); add(G.sph(.016, 8, 6), '#e2c070', 0, 0, .03);
    add(G.pbox(.28, .01, .3), '#f4e8e0', 0, -.04, -.15); for (const s of [-1, 1]) add(G.pbox(.01, .07, .3), '#f4e8e0', s * .14, -.01, -.15);
  }));
  const p = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .28 * t; }, { label: K('화장대 서랍', 'Vanity drawer'), sfx: 'drawer', dur: .26 });
  f.spot('inside', dr, 0, -.035, -.15, { part: p, maxH: .08, label: K('화장대 서랍 안', 'In the vanity drawer'), scale: .55 });
  f.spot('under', null, -.1, 0, z0, { maxH: .5, label: K('화장대 밑', 'Under the vanity'), scale: .85 });
  f.spot('on', null, 0, .53, .26, { maxH: .3, label: K('화장대 의자 위', 'On the vanity stool'), scale: .7 });
};

// 미니 오븐 카트 (1×1): a mint kitchen cart on castors with a toaster oven on top (its glass door drops open, a glowing coil
// and a tray inside), a basket of bread on the shelf below, an oven mitt on a hook, a kitchen timer and a jar of jam
B.hm_oven = f => {
  const W = .64, D = .44, TY = .66, z0 = -.15, CT = '#a8dccb';
  f.add(mc('hm-oven', ({ add, tube }) => {
    for (const y of [TY, .3]) add(G.box(W, .035, D, .012), CT, 0, y - .0175, z0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(G.cyl(.016, .016, TY - .05, 8), STEEL2, sx * (W / 2 - .03), TY / 2, z0 + sz * (D / 2 - .03)); add(G.sph(.028, 8, 6), '#4a4458', sx * (W / 2 - .03), .028, z0 + sz * (D / 2 - .03)); }
    // the oven body
    shell(add, .36, .26, .34, -.09, TY, z0 - .02, '#f4efe6', '#3a3a48', .03); add(G.box(.1, .26, .34, .02), '#f4efe6', .14, TY + .13, z0 - .02);
    for (let k = 0; k < 2; k++) add(G.box(.28, .008, .26, .003), '#e05a3a', -.08, TY + .06 + k * .14, z0 - .03);
    add(G.box(.26, .01, .24, .004), STEEL, -.08, TY + .09, z0 - .03); add(G.box(.08, .025, .07, .012), '#e8b06a', -.2, TY + .105, z0 - .08);
    for (const y of [.18, .1]) add(G.cyl(.025, .025, .02, 12), STEEL2, .14, TY + y, z0 + .15, HP, 0, 0); add(G.box(.02, .014, .006, .003), '#ff6b57', .14, TY + .055, z0 + .152);
    for (let k = 0; k < 4; k++) add(G.box(.004, .2, .02, .002), '#d6cfc2', .195, TY + .13, z0 - .15 + k * .05);
    // bread basket below, a mitt, a timer, jam
    add(G.cyl(.2, .16, .12, 16), '#c9a26a', 0, .36, z0); add(G.tor(.2, .015, PI * 2, 5, 20), '#b08a52', 0, .42, z0, HP, 0, 0);
    for (const [x, z, r] of [[-.08, -.03, .4], [.06, .04, -.3], [.0, -.08, 1.2]]) add(G.cap(.05, .12, 3, 8), '#e8b06a', x, .44, z0 + z, 0, r, HP);
    add(G.box(.02, .03, .02, .006), STEEL2, W / 2 + .01, TY - .08, z0 + .1); add(G.box(.1, .16, .03, .03), '#ff9eb0', W / 2 + .04, TY - .18, z0 + .1); add(G.box(.04, .07, .031, .015), '#ff9eb0', W / 2 + .07, TY - .13, z0 + .1, 0, 0, -.4);
    add(G.sph(.045, 12, 10), '#ff6b57', .24, TY + .04, z0 + .12, 0, 0, 0, [1, .9, 1]); add(G.cyl(.012, .012, .02, 8), '#4a4458', .24, TY + .085, z0 + .12);
    add(G.cyl(.035, .035, .07, 12), '#e8f4f8', .24, TY + .035, z0 - .1); add(G.cyl(.03, .03, .05, 12), '#d9455a', .24, TY + .03, z0 - .1); add(G.cyl(.038, .038, .02, 12), '#ff9eb0', .24, TY + .08, z0 - .1);
  }));
  const dv = grp(); put(dv, -.08, TY + .03, z0 + .15); f.add(dv);
  dv.add(mc('hm-oven-door', ({ add }) => { add(G.box(.34, .22, .02, .01), '#f4efe6', 0, .11, 0); add(G.box(.26, .14, .006, .006), '#7a8090', 0, .11, .012); add(G.box(.2, .02, .03, .01), STEEL2, 0, .2, .025); }));
  const p = f.part('flip', dv, t => { dv.rotation.x = 1.4 * t; }, { label: K('오븐 문', 'Oven door'), sfx: 'open', dur: .3 });
  f.spot('inside', null, -.06, TY + .1, z0 + .06, { part: p, maxH: .14, label: K('오븐 안', 'In the oven'), scale: .55 });
  f.spot('on', null, 0, .45, z0, { maxH: .22, label: K('빵 바구니 위', 'On the bread basket'), scale: .6 });
};

// 다육이 계단 선반 (1×1): a three-step wooden plant stand crowded with little succulents in different pots (a jade, an aloe, a
// round cactus with a pink flower, an echeveria rosette), tiny name sticks, a mini watering can and a sleeping cat figurine
B.hm_succulent = f => {
  const W = .78, z0 = -.15, steps = [[.22, .12], [.46, -.05], [.7, -.22]];
  f.add(mc('hm-succulent', ({ add, tube }) => {
    for (const [y, z] of steps) add(G.box(W, .035, .2, .012), WOOD, 0, y, z0 + z);
    for (const sx of [-1, 1]) { tube([sx * W / 2, 0, z0 + .2], [sx * W / 2, .72, z0 - .3], .022, WOODD, 6); tube([sx * W / 2, 0, z0 - .32], [sx * W / 2, .72, z0 - .3], .02, WOODD, 6); }
    const pot = (x, y, z, c, k) => {
      add(G.cyl(.06, .045, .08, 12), c, x, y + .055, z); add(G.cyl(.062, .062, .015, 12), shade(c, .1), x, y + .095, z); add(G.cyl(.052, .052, .006, 12), '#7a5a3e', x, y + .1, z);
      if (k === 0) for (let n = 0; n < 6; n++) { const a = n * 1.05; add(G.sph(.03, 8, 6), '#7cbf8a', x + Math.cos(a) * .03, y + .12, z + Math.sin(a) * .03, 0, -a, .9, [1, .45, .7]); }
      else if (k === 1) for (let n = 0; n < 5; n++) { const a = n * 1.25; add(G.cone(.018, .14, 5), '#8cc49a', x + Math.cos(a) * .015, y + .16, z + Math.sin(a) * .015, Math.sin(a) * .3, 0, -Math.cos(a) * .3); }
      else if (k === 2) { add(G.sph(.045, 10, 8), '#6fae7a', x, y + .14, z); add(G.sph(.016, 8, 6), '#ff8fb8', x, y + .19, z); }
      else { for (let n = 0; n < 8; n++) { const a = n * .8; add(G.sph(.025, 6, 5), '#a8c8b4', x + Math.cos(a) * .028, y + .115, z + Math.sin(a) * .028, 0, -a, 1.1, [1, .5, .8]); } add(G.sph(.015, 6, 5), '#c8e0d0', x, y + .12, z); }
    };
    const cols = ['#e8b089', '#f4efe6', '#b8d8f0', '#ffd0dc', '#e2d0f0'];
    steps.forEach(([y, z], i) => { for (let k = 0; k < 4 - (i === 2 ? 1 : 0); k++) pot(-W / 2 + .12 + k * .18, y + .0175, z0 + z, cols[(k + i) % 5], (k + i) % 4); });
    for (const [x, y, z] of [[-.27, .3, .17], [.09, .54, 0]]) { add(G.box(.004, .06, .004, .001), WOODD, x + .04, y + .07, z0 + z - .05); add(G.box(.03, .015, .003, .002), CREAM, x + .04, y + .1, z0 + z - .05); }
    add(G.cyl(.05, .055, .07, 12), '#7fb5ff', .27, .73, z0 - .22); tube([.31, .74, z0 - .22], [.39, .8, z0 - .22], .008, '#7fb5ff', 5); add(G.tor(.035, .008, PI, 4, 10), '#7fb5ff', .24, .77, z0 - .22, 0, 0, HP);
    add(G.sph(.05, 10, 8), '#ffb84a', .28, .26, z0 + .12, 0, 0, 0, [1.4, .7, 1]); add(G.sph(.035, 10, 8), '#ffb84a', .22, .27, z0 + .13); for (const s of [-1, 1]) add(G.cone(.012, .025, 4), '#ffb84a', .22 + s * .02, .3, z0 + .13); add(G.tor(.03, .01, PI, 4, 8), '#ffb84a', .34, .25, z0 + .12, HP, 0, 0);
  }));
  f.spot('behind', null, 0, 0, -.38, { maxH: .4, label: K('다육이 선반 뒤', 'Behind the succulent stand'), scale: .75 });
  f.spot('under', null, 0, 0, z0 + .05, { maxH: .18, label: K('다육이 선반 밑', 'Under the succulent stand'), scale: .7 });
};

// 보드게임 장 (1×1): a low open shelf of four cubbies crammed with board game boxes (stacked flat, stood on end), a dice cup and
// a deck of cards; on top a wobbly block tower, a chess board mid-game and a jigsaw puzzle half done; the big game box in the
// bottom-right cubby lifts its lid
B.hm_boardgame = f => {
  const W = .9, H = .74, D = .38, z0 = -.17, M = H / 2, SH = '#e9c08a';
  const box = (add, w, h, d, x, y, z, c, ry = 0) => { add(G.box(w, h, d, .01), c, x, y + h / 2, z, 0, ry, 0); add(G.box(w + .004, h * .35, d + .004, .006), shade(c, -.18), x, y + h * .2, z, 0, ry, 0); add(G.box(w * .5, .004, d * .4, .002), '#fff6ee', x - w * .12, y + h + .001, z + d * .1, 0, ry, 0); };
  f.add(mc('hm-boardgame', ({ add }) => {
    shell(add, W, H, D, 0, 0, z0, SH, shade(SH, -.2), .03); add(G.box(W - .04, .025, D - .02, .006), SH, 0, M, z0); add(G.box(.025, H - .04, D - .02, .006), SH, .05, H / 2, z0);
    // top-left cubby: four boxes stacked flat
    [['#ff8f6b', .3], ['#7fb5ff', .28], ['#ffcf5c', .3], ['#9ed88a', .26]].forEach(([c, w], k) => box(add, w, .06, .26, -.2 + (k % 2) * .015, M + .0125 + k * .062, z0 + .01, c, (k % 2 - .5) * .08));
    // top-right cubby: boxes stood on end, the last one leaning
    ['#c9a7ff', '#ff9fb5', '#7fd6c0', '#ffb84a', '#8fa8e8'].forEach((c, k) => add(G.box(.05, .26 - (k % 2) * .03, .26, .008), c, .1 + k * .056 + (k === 4 ? .02 : 0), M + .0125 + (.26 - (k % 2) * .03) / 2, z0 + .01, 0, 0, k === 4 ? -.3 : 0));
    // bottom-left cubby: three boxes, a dice cup and a deck of cards
    [['#ffe27a', .32], ['#ff8f6b', .3], ['#7fb5ff', .34]].forEach(([c, w], k) => box(add, w, .055, .27, -.22, .03 + k * .057, z0 + .005, c, (k - 1) * .05));
    add(G.cyl(.04, .035, .08, 12), '#a8733f', -.07, .21, z0 + .1); for (const [x, z, c] of [[-.05, .12, '#ffffff'], [-.08, .09, '#ff6b57']]) add(G.box(.025, .025, .025, .006), c, x, .265, z0 + z, .3, .5, 0);
    add(G.box(.06, .02, .085, .006), '#ffffff', -.3, .225, z0 + .14, 0, .3, 0); add(G.box(.05, .002, .07, .001), '#ff6b57', -.3, .236, z0 + .14, 0, .3, 0);
    // on top: a block tower, a chess board, a puzzle tray
    for (let l = 0; l < 9; l++) for (let k = 0; k < 3; k++) if (!(l === 5 && k === 1) && !(l === 7 && k === 0)) { const a = l % 2 ? HP : 0, o = (k - 1) * .027; add(G.box(.025, .016, .08, .003), shade('#e8c48e', l % 3 * .04 - .04), -.3 + (a ? 0 : o), H + .008 + l * .0165, z0 + (a ? o : 0), 0, a + (l > 6 ? .06 : 0), 0); }
    add(G.box(.22, .016, .22, .004), '#4a4458', .02, H + .008, z0 - .02, 0, .25, 0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) add(G.box(.05, .003, .05, .001), '#fff6ee', .02 + Math.cos(.25) * (i - 1.5) * .05 + Math.sin(.25) * (j - 1.5) * .05, H + .017, z0 - .02 - Math.sin(.25) * (i - 1.5) * .05 + Math.cos(.25) * (j - 1.5) * .05);
    for (const [x, z, c, k] of [[-.03, -.06, '#ffffff', 0], [.05, .02, '#3a3a48', 1], [.07, -.08, '#ffffff', 1], [-.02, .05, '#3a3a48', 0]]) { add(G.cyl(.012, .016, .03, 8), c, x, H + .033, z0 + z); add(k ? G.cone(.014, .03, 6) : G.sph(.013, 8, 6), c, x, H + .06, z0 + z); }
    add(G.box(.26, .012, .2, .004), '#c98a52', .29, H + .006, z0 - .01, 0, -.15, 0);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) if ((i * 3 + j * 2) % 5 > 1) add(G.box(.042, .006, .042, .002), ['#8fd3f4', '#9ed88a', '#ffe27a', '#ffb3c6'][(i + j) % 4], .29 + Math.cos(-.15) * (i - 2) * .045 - Math.sin(-.15) * (j - 1.5) * .045, H + .015, z0 - .01 + Math.sin(.15) * (i - 2) * .045 + Math.cos(-.15) * (j - 1.5) * .045, 0, -.15, 0);
    for (const [x, z] of [[.42, .1], [.38, .13]]) add(G.box(.04, .006, .04, .002), '#9ed88a', x, H + .003, z0 + z, 0, x * 7, 0);
  }));
  // the big game box (bottom right) and its lid
  const BX = .25, BY = .03, BW = .3, BH = .17, BD = .28;
  f.add(mc('hm-boardgame-bigbox', ({ add }) => { add(G.box(BW, .01, BD, .004), '#e8f4ff', BX, BY + .005, z0 + .01); for (const s of [-1, 1]) { add(G.box(.01, BH, BD, .004), '#e8f4ff', BX + s * (BW / 2 - .005), BY + BH / 2, z0 + .01); add(G.box(BW, BH, .01, .004), '#e8f4ff', BX, BY + BH / 2, z0 + .01 + s * (BD / 2 - .005)); } }));
  const lid = grp(); put(lid, BX, BY + BH, z0 + .01 - BD / 2); f.add(lid);
  lid.add(mc('hm-boardgame-lid', ({ add }) => {
    add(G.box(BW + .014, .035, BD + .014, .008), '#5f7fd8', 0, .0, BD / 2); add(G.box(BW * .7, .004, BD * .5, .002), '#ffe27a', 0, .019, BD / 2);
    add(G.box(BW * .3, .005, .03, .002), '#ff6b57', -.06, .02, BD / 2 + .08); for (let k = 0; k < 3; k++) add(G.sph(.016, 8, 6), ['#ff6b57', '#7fd6c0', '#ffffff'][k], -.08 + k * .07, .022, BD / 2 - .04, 0, 0, 0, [1, .3, 1]);
  }));
  const p = f.part('lift', lid, (t, b) => { lid.position.y = b.p.y + .05 * t; lid.rotation.x = -1.25 * t; }, { label: K('보드게임 상자 뚜껑', 'Board game box lid'), sfx: 'open', dur: .3 });
  f.spot('inside', null, BX, BY + .012, z0 + .01, { part: p, maxH: .15, label: K('보드게임 상자 안', 'In the board game box'), scale: .75 });
  f.spot('on', null, -.05, H + .001, z0 + .12, { maxH: .3, label: K('보드게임 장 위', 'On the game shelf'), scale: .7 });
};

// 벽난로 (1×1): a little brick fireplace — a cream mantel shelf with two framed photos, a candle and a small clock, a pine
// garland with three stockings hung from it, logs with flickering flames in the firebox, a poker set at its side; the wood
// store under the fire has a door
B.hm_fireplace = f => {
  const W = .92, H = .96, D = .32, z0 = -.2, FX = .22, F0 = .34, F1 = .72, ZF = z0 + D / 2, BR = '#e59b7a', BR2 = '#cf8566', MANT = '#fff4e2';
  f.add(mc('hm-fireplace', ({ add, tube }) => {
    shell(add, W - .02, H, D - .02, 0, 0, z0, BR, '#3a2a30', .03);
    // the face: pillars, a lintel, the band between fire and wood store, a hearth slab
    for (const s of [-1, 1]) add(G.box(W / 2 - FX, H, .04, .01), BR, s * (FX + (W / 2 - FX) / 2), H / 2, ZF);
    add(G.box(FX * 2, H - F1, .04, .01), BR, 0, (F1 + H) / 2, ZF); add(G.box(FX * 2, F0 - .3, .04, .006), BR, 0, (F0 + .3) / 2, ZF);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 2; c++) for (const s of [-1, 1]) add(G.box(.1, .045, .006, .004), (r + c) % 3 ? BR2 : shade(BR, .06), s * (FX + .06 + c * .11 + (r % 2) * .03), .07 + r * .1, ZF + .022);
    for (let c = 0; c < 4; c++) add(G.box(.1, .045, .006, .004), c % 2 ? BR2 : shade(BR, .06), -.16 + c * .107, F1 + .1, ZF + .022);
    add(G.box(W + .1, .05, D + .1, .015), MANT, 0, H + .025, z0 + .03); add(G.box(W + .06, .04, .02, .008), shade(MANT, -.08), 0, H - .01, ZF + .06);
    add(G.box(W + .2, .04, .22, .012), '#c9c2b6', 0, .02, ZF + .1);
    // logs and the grate
    for (const [x, ry] of [[-.06, .3], [.06, -.3]]) add(G.cyl(.035, .035, .26, 10), '#8a5a3e', x, F0 + .06, z0 + .02, 0, ry, HP);
    add(G.cyl(.032, .032, .24, 10), '#a06a48', 0, F0 + .11, z0 + .03, 0, 0, HP); add(G.box(.3, .015, .015, .004), '#4a4458', 0, F0 + .02, z0 + .1);
    for (const [x, z] of [[-.06, .1], [.06, .1], [-.06, -.02], [.06, -.02]]) add(G.cyl(.006, .006, .03, 5), '#4a4458', x * 2, F0 + .01, z0 + z);
    // on the mantel: two framed photos, a candle, a little clock
    for (const [x, w, h, c, p] of [[-.32, .12, .15, '#e2c070', '#9fd8f4'], [-.15, .1, .12, '#ffffff', '#ffd0dc']]) { add(G.box(w, h, .02, .006), c, x, H + .05 + h / 2, z0 - .02, -.12, 0, 0); add(G.box(w - .03, h - .03, .004, .002), p, x, H + .05 + h / 2, z0 - .008, -.12, 0, 0); add(G.sph(.018, 8, 6), '#fff6ee', x, H + .05 + h * .45, z0 - .004); }
    add(G.cyl(.022, .022, .1, 10), '#fff6ee', .12, H + .1, z0 + .02); add(G.sph(.012, 8, 6), '#ffcf5c', .12, H + .165, z0 + .02, 0, 0, 0, [1, 1.6, 1]); add(G.cyl(.04, .045, .015, 12), '#e2c070', .12, H + .057, z0 + .02);
    add(G.cyl(.06, .06, .035, 16), '#7fb5ff', .3, H + .11, z0 - .01, HP, 0, 0); add(G.cyl(.05, .05, .037, 16), '#fff6ee', .3, H + .11, z0 - .01, HP, 0, 0); add(G.box(.004, .035, .002, .001), INK, .3, H + .123, z0 + .009); add(G.box(.025, .004, .002, .001), INK, .31, H + .11, z0 + .009);
    for (const s of [-1, 1]) add(G.sph(.016, 8, 6), '#7fb5ff', .3 + s * .045, H + .16, z0 - .01); add(G.box(.08, .04, .05, .01), '#7fb5ff', .3, H + .07, z0 - .01);
    // the garland and the stockings
    for (let k = 0; k < 15; k++) { const x = -W / 2 + .02 + k * (W - .04) / 14; add(G.sph(.028, 8, 6), k % 2 ? LEAF2 : '#3f8f52', x, H - .025 - Math.sin(k / 14 * PI) * .035, ZF + .085); if (k % 4 === 2) add(G.sph(.014, 8, 6), TOMATO, x, H - .05 - Math.sin(k / 14 * PI) * .035, ZF + .11); }
    [[-.3, TOMATO], [0, '#5fae7a'], [.3, '#7fb5ff']].forEach(([x, c]) => { add(G.box(.08, .03, .04, .012), WHITE, x, H - .07, ZF + .09); add(G.box(.06, .14, .035, .015), c, x, H - .16, ZF + .09); add(G.box(.1, .05, .036, .02), c, x + .022, H - .235, ZF + .09); for (let k = 0; k < 3; k++) add(G.box(.062, .01, .037, .003), WHITE, x, H - .12 - k * .04, ZF + .09); });
    // a poker set on a stand
    add(G.cyl(.05, .06, .02, 12), '#4a4458', W / 2 + .1, .03, ZF + .02); tube([W / 2 + .1, .03, ZF + .02], [W / 2 + .1, .5, ZF + .02], .008, '#4a4458', 5); add(G.tor(.03, .007, PI * 2, 4, 12), '#e2c070', W / 2 + .1, .52, ZF + .02);
    for (const dx of [-.025, .025]) { tube([W / 2 + .1 + dx, .06, ZF + .04], [W / 2 + .1 + dx * .4, .46, ZF + .03], .006, '#4a4458', 4); add(G.box(.035, .05, .006, .003), '#4a4458', W / 2 + .1 + dx, .07, ZF + .04); }
    // the wood store: split logs stacked inside
    for (let k = 0; k < 5; k++) add(G.cyl(.028, .028, .18, 7), k % 2 ? '#a06a48' : '#c08a5e', -.12 + (k % 3) * .06, .08 + Math.floor(k / 3) * .05, z0 + .02, HP, (k - 2) * .1, 0);
  }));
  // the flames, flickering (room.js calls f.idle with the time)
  const fire = live(f); put(fire, 0, F0 + .08, z0 + .03);
  fire.add(mc('hm-fireplace-fire', ({ add }) => { add(G.cone(.09, .22, 8), '#ff8a3c', 0, .1, 0); for (const s of [-1, 1]) add(G.cone(.06, .16, 8), '#ff6b3c', s * .08, .07, .01); add(G.cone(.05, .14, 8), '#ffd84a', 0, .08, .03); add(G.sph(.03, 8, 6), '#fff2a8', 0, .03, .04); }));
  f.idle = t => { fire.scale.set(1 + .06 * Math.sin(t * 9), .9 + .14 * Math.sin(t * 7.3) * Math.sin(t * 3.1), 1); fire.rotation.y = .1 * Math.sin(t * 2.3); };
  const dv = grp(); put(dv, -FX, .045, ZF + .02); f.add(dv);
  dv.add(mc('hm-fireplace-door', ({ add }) => { add(G.box(FX * 2, .24, .025, .01), '#c08a5e', FX, .12, 0); for (let k = 0; k < 4; k++) add(G.box(FX * 2 - .02, .004, .027, .002), '#a06a48', FX, .03 + k * .06, 0); add(G.sph(.016, 8, 6), '#e2c070', FX * 2 - .05, .12, .02); }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.5 * t; }, { label: K('장작 칸 문', 'Log store door'), sfx: 'door', dur: .3 });
  f.spot('inside', null, .1, .06, z0 + .04, { part: p, maxH: .2, label: K('벽난로 장작 칸', 'In the log store'), scale: .7 });
  f.spot('on', null, -.02, H + .05, z0 + .04, { maxH: .26, label: K('벽난로 선반 위', 'On the mantel'), scale: .6 });
};

// 미싱 책상 (1×1): an old treadle sewing table — iron legs with curly sides, a treadle plate, a mint sewing machine with a
// spool on top and flowered cloth under the needle; a tomato pincushion bristling with pins, scissors, a coiled tape measure
// and a half-sewn bunny doll; a drawer slides out of the table, and a basket of scraps waits under it
B.hm_sewing = f => {
  const W = .82, TY = .74, D = .46, z0 = -.15, TOP = '#d9a466', IRON = '#4a4458', SEW = '#9ed8c8';
  f.add(mc('hm-sewing', ({ add, tube }) => {
    add(G.box(W, .04, D, .015), TOP, 0, TY - .02, z0); add(G.box(W - .08, .1, D - .06, .01), shade(TOP, -.08), -.06, TY - .09, z0);
    for (const s of [-1, 1]) {
      const x = s * (W / 2 - .06);
      tube([x, .02, z0 - .16], [x, TY - .04, z0 - .16], .016, IRON, 6); tube([x, .02, z0 + .16], [x, TY - .04, z0 + .16], .016, IRON, 6); tube([x, .02, z0 - .2], [x, .02, z0 + .2], .02, IRON, 6);
      add(G.tor(.1, .012, PI * 1.5, 5, 18), IRON, x, .38, z0, 0, HP, 0); add(G.tor(.05, .01, PI * 1.6, 5, 14), IRON, x, .52, z0 + .04, 0, HP, 1.2); add(G.tor(.05, .01, PI * 1.6, 5, 14), IRON, x, .24, z0 - .05, 0, HP, -1.8);
    }
    tube([-W / 2 + .06, .32, z0], [W / 2 - .06, .32, z0], .012, IRON, 5);
    add(G.box(.42, .02, .2, .008), IRON, 0, .1, z0 + .05, -.18, 0, 0); for (let k = 0; k < 6; k++) add(G.box(.02, .022, .16, .004), shade(IRON, .15), -.15 + k * .06, .102, z0 + .05, -.18, 0, 0);
    add(G.cyl(.12, .12, .02, 18), IRON, W / 2 - .09, .3, z0, 0, 0, HP); for (let k = 0; k < 6; k++) add(G.box(.004, .2, .01, .002), IRON, W / 2 - .09, .3, z0, k * PI / 6, 0, 0);
    // the machine
    const my = TY; add(G.box(.4, .04, .18, .015), SEW, -.02, my + .02, z0 - .02);
    add(G.box(.09, .2, .14, .03), SEW, .13, my + .14, z0 - .03); add(G.box(.36, .07, .12, .03), SEW, -.02, my + .26, z0 - .03); add(G.box(.08, .1, .1, .02), SEW, -.17, my + .2, z0 - .03);
    add(G.cyl(.008, .008, .07, 6), STEEL2, -.17, my + .11, z0 - .01); add(G.box(.03, .01, .03, .004), STEEL2, -.17, my + .075, z0 - .01);
    add(G.cyl(.06, .06, .03, 16), shade(SEW, -.2), .2, my + .2, z0 - .03, 0, 0, HP); add(G.cyl(.015, .015, .04, 8), '#e2c070', .22, my + .2, z0 - .03, 0, 0, HP);
    add(G.box(.2, .015, .002, .002), '#fff6ee', -.03, my + .27, z0 + .031); add(G.box(.06, .015, .002, .001), '#ff6b57', .09, my + .27, z0 + .031);
    add(G.cyl(.006, .006, .06, 5), STEEL2, .06, my + .32, z0 - .03); add(G.cyl(.022, .022, .04, 12), '#ff6f8a', .06, my + .33, z0 - .03); tube([.06, my + .33, z0 - .01], [-.17, my + .16, z0], .002, '#ff6f8a', 3);
    // flowered cloth under the needle, draped over the front edge
    add(G.box(.3, .006, .24, .003), '#fff0d8', -.14, TY + .045, z0 + .05, 0, .15, 0); add(G.box(.26, .12, .006, .003), '#fff0d8', -.16, TY - .02, z0 + D / 2 + .01, .08, .15, 0);
    for (let k = 0; k < 9; k++) add(G.sph(.012, 6, 5), ['#ff9fb5', '#ffcf5c', '#7fb5ff'][k % 3], -.26 + (k % 3) * .09, TY + .05, z0 - .05 + Math.floor(k / 3) * .08, 0, 0, 0, [1, .3, 1]);
    // pincushion, scissors, tape measure, a half-sewn bunny
    add(G.sph(.045, 12, 10), '#ff6b57', .27, TY + .04, z0 + .1, 0, 0, 0, [1, .8, 1]); add(G.cone(.03, .02, 5), LEAF2, .27, TY + .08, z0 + .1); for (let k = 0; k < 6; k++) { const a = k * 1.05; tube([.27 + Math.cos(a) * .03, TY + .06, z0 + .1 + Math.sin(a) * .03], [.27 + Math.cos(a) * .05, TY + .1, z0 + .1 + Math.sin(a) * .05], .002, STEEL, 3); add(G.sph(.007, 6, 5), ['#ffcf5c', '#7fb5ff', '#ffffff'][k % 3], .27 + Math.cos(a) * .05, TY + .1, z0 + .1 + Math.sin(a) * .05); }
    for (const s of [-1, 1]) { add(G.box(.09, .005, .015, .003), STEEL, .16, TY + .003, z0 + .17 + s * .01, 0, s * .25, 0); add(G.tor(.016, .005, PI * 2, 4, 10), '#ff9a3c', .1, TY + .005, z0 + .17 + s * .025, HP, 0, 0); }
    add(G.cyl(.04, .04, .015, 14), '#ffe27a', .32, TY + .008, z0 - .1); add(G.box(.12, .002, .015, .001), '#ffe27a', .37, TY + .002, z0 - .04, 0, -.7, 0);
    add(G.sph(.045, 10, 8), '#fff6ee', -.3, TY + .04, z0 + .15, 0, 0, 0, [1, .8, .9]); add(G.sph(.035, 10, 8), '#fff6ee', -.3, TY + .1, z0 + .15); add(G.cap(.012, .05, 2, 6), '#fff6ee', -.31, TY + .155, z0 + .15, 0, 0, .2); add(G.sph(.006, 6, 5), INK, -.29, TY + .105, z0 + .18);
    tube([-.27, TY + .07, z0 + .16], [-.24, TY + .02, z0 + .2], .002, '#ff6f8a', 3);
    // the scrap basket under the table
    add(G.cyl(.15, .12, .14, 14, true), '#d9b885', -.12, .07, z0 + .02); add(G.cyl(.14, .11, .135, 14, true), '#c4a06a', -.12, .072, z0 + .02, 0, 0, 0, [-1, 1, 1]); add(G.cyl(.12, .12, .01, 14), '#c4a06a', -.12, .005, z0 + .02);
    for (const [x, z, c] of [[-.16, .0, '#ffb3c6'], [-.08, .05, '#9fd8f4'], [-.1, -.04, '#ffe27a']]) add(G.box(.09, .03, .07, .02), c, x, .11, z0 + z, .3, x * 9, .2);
  }));
  const dr = grp(); put(dr, .16, TY - .09, z0 + D / 2 - .02); f.add(dr);
  dr.add(mc('hm-sewing-drawer', ({ add }) => {
    add(G.box(.3, .085, .02, .008), shade(TOP, .05), 0, 0, .01); add(G.box(.06, .015, .02, .006), '#e2c070', 0, 0, .025);
    add(G.pbox(.27, .01, .3), '#f4e8e0', 0, -.035, -.15); for (const s of [-1, 1]) add(G.pbox(.01, .06, .3), '#e8d4c0', s * .135, -.01, -.15);
    for (const [x, c] of [[-.08, '#ff6f8a'], [-.04, '#7fb5ff'], [0, '#ffcf5c']]) { add(G.cyl(.014, .014, .03, 8), c, x, -.012, -.22, HP, 0, 0); add(G.cyl(.018, .018, .004, 8), '#e8c48e', x, -.012, -.205, HP, 0, 0); }
  }));
  const p = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .26 * t; }, { label: K('미싱 책상 서랍', 'Sewing table drawer'), sfx: 'drawer', dur: .26 });
  f.spot('inside', dr, .06, -.03, -.1, { part: p, maxH: .1, label: K('미싱 책상 서랍 안', 'In the sewing drawer'), scale: .55 });
  f.spot('under', null, .15, .02, z0 + .03, { maxH: .26, label: K('미싱 책상 밑', 'Under the sewing table'), scale: .75 });
};

// 햄스터 집 (1×1): a white low cabinet with a door, and on it a hamster's cage — a lilac tray of wood shavings, wire bars, a
// running wheel that turns, a little dome house with the hamster asleep in its doorway, a water bottle, a dish of sunflower seeds;
// a bag of hamster food and spare bedding inside the cabinet
B.hm_hamster = f => {
  const W = .8, CH = .5, D = .42, z0 = -.17, CB = '#fdfaf6', CY = CH + .03, CW = .7, CD = .36, BH = .36;
  f.add(mc('hm-hamster', ({ add, tube }) => {
    shell(add, W, CH, D, 0, 0, z0, CB, shade(CB, -.14)); add(G.box(W + .03, .03, D + .03, .01), shade(CB, -.06), 0, CH + .015, z0);
    for (const sx of [-1, 1]) add(G.cyl(.02, .016, .04, 8), '#e2c070', sx * (W / 2 - .06), -.0, z0 + D / 2 - .06);
    add(G.box(.2, .16, .12, .02), '#ffd84a', -.18, .1, z0 - .02, 0, .2, 0); add(G.box(.14, .05, .002, .002), '#ff8a3c', -.18, .13, z0 + .04, 0, .2, 0); add(G.box(.18, .1, .14, .04), '#f4e2c8', .2, .07, z0 - .04);
    add(G.box(W - .04, .02, D - .04, .006), shade(CB, -.06), 0, CH * .55, z0 - .02);
    // the cage
    add(G.box(CW, .08, CD, .02), '#c9a7ff', 0, CY + .04, z0); add(G.box(CW - .04, .02, CD - .04, .006), '#f4d8a8', 0, CY + .07, z0);
    for (let k = 0; k < 40; k++) add(G.sph(.016, 5, 4), k % 3 ? '#f2d29a' : '#e8c080', -CW / 2 + .05 + (k * .113) % (CW - .1), CY + .085, z0 - CD / 2 + .04 + (k * .071) % (CD - .08), 0, k, 0, [1.4, .5, 1]);
    for (let k = 0; k <= 14; k++) { const x = -CW / 2 + .01 + k * (CW - .02) / 14; tube([x, CY + .08, z0 + CD / 2 - .01], [x, CY + .08 + BH, z0 + CD / 2 - .01], .003, '#d6dbe8', 3); tube([x, CY + .08, z0 - CD / 2 + .01], [x, CY + .08 + BH, z0 - CD / 2 + .01], .003, '#d6dbe8', 3); }
    for (let k = 0; k <= 8; k++) for (const s of [-1, 1]) { const z = z0 - CD / 2 + .01 + k * (CD - .02) / 8; tube([s * (CW / 2 - .01), CY + .08, z], [s * (CW / 2 - .01), CY + .08 + BH, z], .003, '#d6dbe8', 3); }
    for (const y of [CY + .08 + BH]) { add(G.box(CW, .012, CD, .004), '#d6dbe8', 0, y, z0); for (const s of [-1, 1]) add(G.box(CW, .01, .01, .003), '#d6dbe8', 0, CY + .08 + BH * .5, z0 + s * (CD / 2 - .01)); }
    add(G.tor(.06, .01, PI, 5, 12), '#c9a7ff', 0, CY + .08 + BH + .012, z0, 0, 0, 0);
    // house, hamster, bottle, seed dish
    add(new THREE.SphereGeometry(.1, 16, 10, 0, PI * 2, 0, HP), '#ffb3c6', -.2, CY + .08, z0 - .04); add(G.cyl(.045, .045, .02, 14), '#5a3a4a', -.2, CY + .12, z0 + .045, HP, 0, 0);
    add(G.sph(.045, 12, 10), '#f2b06a', -.2, CY + .12, z0 + .07, 0, 0, 0, [1.15, .85, 1]); add(G.sph(.03, 10, 8), '#fff4e2', -.2, CY + .11, z0 + .1, 0, 0, 0, [1.2, .8, .6]);
    for (const s of [-1, 1]) { add(G.sph(.014, 8, 6), '#f2b06a', -.2 + s * .03, CY + .16, z0 + .06); add(G.box(.014, .003, .003, .001), INK, -.2 + s * .016, CY + .135, z0 + .113); }
    add(G.sph(.008, 6, 5), '#ff8fa8', -.2, CY + .125, z0 + .118);
    add(G.cyl(.025, .025, .14, 10), '#cfeaf8', CW / 2 - .05, CY + .27, z0 + CD / 2 + .015); add(G.cyl(.026, .026, .03, 10), '#7fb5ff', CW / 2 - .05, CY + .33, z0 + CD / 2 + .015); tube([CW / 2 - .05, CY + .2, z0 + CD / 2 + .015], [CW / 2 - .05, CY + .14, z0 + CD / 2 - .03], .005, STEEL2, 4);
    add(G.cyl(.05, .04, .025, 14), '#7fd6c0', .02, CY + .09, z0 + .1); for (let k = 0; k < 7; k++) add(G.box(.012, .004, .022, .002), k % 2 ? '#4a4458' : '#e8e2d8', .02 + Math.cos(k) * .025, CY + .104, z0 + .1 + Math.sin(k) * .025, 0, k, 0);
    for (const s of [-1, 1]) add(G.box(.03, .2, .03, .008), '#7fb5ff', .2, CY + .18, z0 - .05 + s * .07); add(G.cyl(.02, .02, .17, 8), '#7fb5ff', .2, CY + .26, z0 - .05, HP, 0, 0);
  }));
  // the wheel turns
  const wh = live(f); put(wh, .2, CY + .26, z0 - .05);
  wh.add(mc('hm-hamster-wheel', ({ add }) => { add(G.tor(.11, .01, PI * 2, 5, 22), '#ff9fb5', 0, 0, -.045); add(G.tor(.11, .01, PI * 2, 5, 22), '#ff9fb5', 0, 0, .045); for (let k = 0; k < 14; k++) { const a = k / 14 * PI * 2; add(G.cyl(.005, .005, .09, 4), '#ffd0dc', Math.cos(a) * .11, Math.sin(a) * .11, 0, HP, 0, 0); } for (let k = 0; k < 4; k++) add(G.box(.006, .22, .006, .002), '#ff9fb5', 0, 0, .045, 0, 0, k * PI / 4); }));
  f.idle = t => { wh.rotation.z = -t * 2.2; };
  const dv = grp(); put(dv, -W / 2 + .015, .03, z0 + D / 2 + .005); f.add(dv);
  dv.add(mc('hm-hamster-door', ({ add }) => { add(G.box(W - .03, CH - .06, .02, .01), shade(CB, .02), (W - .03) / 2, (CH - .06) / 2, 0); add(G.box(W - .12, CH - .16, .006, .006), shade(CB, -.05), (W - .03) / 2, (CH - .06) / 2, .012); const pw = new THREE.Shape(); pw.absarc(0, 0, .03, 0, PI * 2); add(G.ext(pw, .006, 0, 10), '#ffb3c6', (W - .03) / 2, (CH - .06) / 2 + .02, .015); for (let k = 0; k < 4; k++) add(G.sph(.012, 6, 5), '#ffb3c6', (W - .03) / 2 + (k - 1.5) * .022, (CH - .06) / 2 + .065 - Math.abs(k - 1.5) * .01, .02); add(G.sph(.016, 8, 6), '#e2c070', W - .1, (CH - .06) / 2, .02); }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.5 * t; }, { label: K('햄스터 장 문', 'Hamster cabinet door'), sfx: 'door', dur: .32 });
  f.spot('inside', null, .02, .03, z0 + .03, { part: p, maxH: .22, label: K('햄스터 장 안', 'In the hamster cabinet'), scale: .75 });
};

// 인형집 (1×1): a two-storey dollhouse on a low stand — a pink roof with a chimney, wallpapered rooms with tiny furniture (a bed,
// a table and chairs, a lamp, a staircase, a bathtub); its whole front with windows, flower boxes and a door swings open
B.hm_dollhouse = f => {
  const W = .7, D = .4, z0 = -.16, SY = .3, FH = .3, HY = SY + .02, WALL = '#fff0e0', ROOF = '#ff9fb5';
  f.add(mc('hm-dollhouse', ({ add }) => {
    add(G.box(W + .08, .04, D + .06, .012), WOODD, 0, SY, z0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.022, .018, SY, 8), WOODD, sx * (W / 2), SY / 2, z0 + sz * (D / 2 - .02));
    add(G.box(W - .04, .02, D - .04, .006), WOOD, 0, .1, z0); for (let k = 0; k < 3; k++) add(G.box(.12, .14, .1, .02), ['#ffcf5c', '#7fb5ff', '#9ed88a'][k], -.2 + k * .2, .18, z0 - .03, 0, k * .2 - .2, 0);
    shell(add, W, FH * 2 + .02, D, 0, HY, z0, WALL, '#ffe0e8', .02); add(G.box(W - .02, .02, D - .02, .006), '#e8c48e', 0, HY + FH + .01, z0);
    for (let k = 0; k < 7; k++) add(G.box(.004, FH * 2 - .02, .004, .001), '#ffd0dc', -W / 2 + .06 + k * .1, HY + FH + .01, z0 - D / 2 + .022);
    add(G.box(.06, FH - .02, .004, .002), '#c9e6f2', .03, HY + FH / 2, z0 - D / 2 + .023); add(G.box(.004, FH - .02, D - .04, .002), '#ffd0dc', .05, HY + FH * 1.5, z0);
    // the roof
    const r = new THREE.Shape(); r.moveTo(-W / 2 - .06, 0); r.lineTo(W / 2 + .06, 0); r.lineTo(0, .26); r.closePath(); add(G.ext(r, D + .06, .01, 2), ROOF, 0, HY + FH * 2 + .02, z0 - D / 2 - .03);
    for (let k = 1; k < 4; k++) for (const sx of [-1, 1]) add(G.box(.012, .012, D + .04, .004), shade(ROOF, -.12), sx * .1 * k, HY + FH * 2 + .02 + .26 * (1 - .1 * k / (W / 2 + .06)) + .006, z0);
    add(G.box(.07, .14, .07, .01), '#e59b7a', .18, HY + FH * 2 + .2, z0 - .05); add(G.box(.09, .02, .09, .006), shade('#e59b7a', -.15), .18, HY + FH * 2 + .27, z0 - .05);
    // ground floor: a table, two chairs, a lamp; a staircase up
    const g0 = HY + .02;
    add(G.cyl(.06, .06, .01, 14), '#ffffff', -.15, g0 + .08, z0 + .02); add(G.cyl(.008, .01, .08, 6), WOODD, -.15, g0 + .04, z0 + .02); for (const s of [-1, 1]) { add(G.box(.045, .008, .045, .003), '#ff9fb5', -.15 + s * .09, g0 + .045, z0 + .02); add(G.box(.045, .05, .008, .003), '#ff9fb5', -.15 + s * .09, g0 + .07, z0 + .02 - .02); add(G.cyl(.004, .004, .045, 4), WOODD, -.15 + s * .09, g0 + .022, z0 + .02); }
    add(G.cyl(.012, .012, .006, 8), '#ff6b57', -.15, g0 + .09, z0 + .02); add(G.cyl(.003, .003, .12, 4), INK, -.28, g0 + .06, z0 - .12); add(G.cone(.03, .035, 10), '#ffe27a', -.28, g0 + .13, z0 - .12);
    for (let k = 0; k < 6; k++) add(G.box(.08, .012 + k * .045, .04, .003), '#e8c48e', .22, g0 + (.012 + k * .045) / 2, z0 - .12 + k * .04);
    // upstairs: a bed with a quilt and pillow, a bathtub with a duck
    const g1 = HY + FH + .02;
    add(G.box(.2, .04, .12, .01), '#ffffff', -.18, g1 + .03, z0 - .06); add(G.box(.18, .02, .1, .01), '#7fb5ff', -.16, g1 + .055, z0 - .06); add(G.box(.05, .02, .08, .01), '#fff6ee', -.26, g1 + .06, z0 - .06); add(G.box(.015, .08, .12, .004), WOODD, -.285, g1 + .05, z0 - .06);
    add(G.cap(.04, .1, 3, 8), '#ffffff', .18, g1 + .04, z0 - .04, 0, 0, HP); add(G.box(.12, .004, .05, .002), '#bfe6f2', .18, g1 + .065, z0 - .04); add(G.sph(.014, 8, 6), '#ffd84a', .17, g1 + .075, z0 - .04);
    add(G.box(.06, .06, .004, .002), '#9fd8f4', .02, g1 + .17, z0 - D / 2 + .023); add(G.tor(.04, .006, PI * 2, 4, 12), '#e2c070', -.15, g1 + .19, z0 - D / 2 + .025);
  }));
  const fr = grp(); put(fr, -W / 2, HY, z0 + D / 2); f.add(fr);
  fr.add(mc('hm-dollhouse-front', ({ add }) => {
    add(G.box(W, FH * 2 + .02, .02, .006), WALL, W / 2, FH + .01, 0); add(G.box(W + .01, .025, .025, .006), '#ffd0dc', W / 2, FH + .01, .002);
    for (const [x, y] of [[.16, FH * .55], [.54, FH * .55], [.16, FH * 1.55], [.54, FH * 1.55]]) { add(G.box(.12, .12, .012, .004), '#9fd8f4', x, y, .008); add(G.box(.14, .014, .016, .004), WHITE, x, y, .012); add(G.box(.014, .14, .016, .004), WHITE, x, y, .012); add(G.box(.14, .025, .04, .008), WOODD, x, y - .075, .02); for (let k = 0; k < 4; k++) add(G.sph(.014, 6, 5), [TOMATO, HONEY, PINK, '#ffffff'][k], x - .045 + k * .03, y - .055, .025); }
    const d = new THREE.Shape(); d.moveTo(0, 0); d.lineTo(.09, 0); d.lineTo(.09, .11); d.absarc(.045, .11, .045, 0, PI); d.closePath(); add(G.ext(d, .012, .003, 8), '#7fb5ff', .305, .0, .008); add(G.sph(.008, 6, 5), '#e2c070', .38, .07, .024);
    add(G.box(.13, .015, .05, .006), '#ffffff', .35, .17, .025);
  }));
  const p = f.part('door', fr, t => { fr.rotation.y = -1.7 * t; }, { label: K('인형집 앞벽', 'Dollhouse front'), sfx: 'door', dur: .36 });
  f.spot('inside', null, .06, HY + .022, z0 + .06, { part: p, maxH: .26, label: K('인형집 1층', 'Dollhouse ground floor'), scale: .6 });
  f.spot('inside', null, .02, HY + FH + .032, z0 + .08, { part: p, maxH: .24, label: K('인형집 2층', 'Dollhouse upstairs'), scale: .55 });
  f.spot('under', null, 0, .11, z0 + .04, { maxH: .18, label: K('인형집 받침 아래', 'Under the dollhouse'), scale: .6 });
};

// ═══ 스페셜 ═══════════════════════════════════════════════════════════════════════════════════════════════════════════

// 가챠 머신 (1×1): a big capsule toy machine — a red body on short legs, a clear globe heaped with two-tone capsules that
// jiggle, a chrome crank that turns, a coin slot and a price card, a sign on top; the capsule chute's flap swings up
B.sp3_gacha = f => {
  const W = .62, D = .5, BH = .62, GR = .3, GY = BH + GR - .02, RED = '#ff6b6b', CAPS = [['#ff9fb5', '#ffffff'], ['#7fb5ff', '#ffffff'], ['#ffe27a', '#ffffff'], ['#9ed88a', '#ffffff'], ['#c9a7ff', '#ffffff'], ['#ffb84a', '#ffffff']];
  const sign = tex('hm-gachasign', 256, 64, (c, w, h) => { c.fillStyle = '#fff6d8'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff6b6b'; c.font = 'bold 40px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GACHA', w / 2, h / 2 + 2); c.fillStyle = '#7fb5ff'; for (const x of [18, w - 18]) { c.beginPath(); c.arc(x, h / 2, 10, 0, PI * 2); c.fill(); } });
  f.add(mc('sp3-gacha', ({ add }) => {
    add(G.box(W, BH, D, .05), RED, 0, BH / 2 + .05, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.03, .035, .06, 10), '#4a4458', sx * (W / 2 - .07), .03, sz * (D / 2 - .07));
    add(G.box(W + .02, .03, D + .02, .012), '#ffffff', 0, BH + .065, 0); add(G.cyl(GR + .02, GR + .04, .05, 28), '#ffffff', 0, BH + .09, 0);
    add(G.cyl(.09, .09, .03, 18), STEEL, 0, BH * .62 + .05, D / 2 + .01, HP, 0, 0); add(G.box(.04, .012, .006, .003), INK, 0, BH * .62 + .1, D / 2 + .028);
    add(G.box(.18, .1, .006, .01), '#fff6d8', 0, BH * .9 + .05, D / 2 + .004); for (let k = 0; k < 3; k++) add(G.cyl(.016, .016, .006, 10), '#ffcf5c', -.05 + k * .05, BH * .9 + .05, D / 2 + .009, HP, 0, 0);
    add(G.box(.2, .14, .03, .02), '#4a4458', 0, .17, D / 2 - .005); add(G.box(.2, .02, .1, .006), '#3a3a48', 0, .1, D / 2 + .04); for (const s of [-1, 1]) add(G.box(.015, .14, .1, .006), RED, s * .1, .17, D / 2 + .04);
    // a capsule that already came out, on the floor beside it
    add(new THREE.SphereGeometry(.05, 14, 8, 0, PI * 2, 0, HP), '#ff9fb5', W / 2 + .12, .0, .2, PI, 0, 0); add(new THREE.SphereGeometry(.05, 14, 8, 0, PI * 2, 0, HP), '#ffffff', W / 2 + .12, .0, .2);
    add(G.box(.1, .08, .004, .004), '#ffffff', 0, GY + GR + .14, 0); add(G.cyl(.03, .04, .06, 12), '#ffffff', 0, GY + GR + .03, 0); add(G.box(.42, .12, .03, .02), RED, 0, GY + GR + .11, 0);
  }));
  f.add(put(mesh(geo('hm-gachasign-q', () => new THREE.PlaneGeometry(.38, .095)), mat('#ffffff', { map: sign })), 0, GY + GR + .11, .0155));
  // the capsules, heaped in the globe (they jiggle a little)
  const heap = live(f); put(heap, 0, BH + .1, 0);
  heap.add(mc('sp3-gacha-caps', ({ add }) => {
    let n = 0; for (let l = 0; l < 5; l++) { const rr = GR - .05 - Math.max(0, l - 2) * .05, m = Math.max(4, Math.round(rr * 30)); for (let k = 0; k < m; k++) { const a = k / m * PI * 2 + l * .5, x = Math.cos(a) * rr * (.4 + (k % 3) * .25), z = Math.sin(a) * rr * (.4 + (k % 3) * .25), y = .05 + l * .07, c = CAPS[n++ % CAPS.length]; add(new THREE.SphereGeometry(.045, 12, 6, 0, PI * 2, 0, HP), c[1], x, y, z, 0, a, 0); add(new THREE.SphereGeometry(.045, 12, 6, 0, PI * 2, 0, HP), c[0], x, y, z, PI, a, 0); } }
  }));
  f.add(put(mesh(geo('hm-gacha-globe', () => new THREE.SphereGeometry(GR, 28, 18)), mat('#e8f6ff', { opacity: .28, rough: .15 })), 0, GY, 0));
  f.add(mc('sp3-gacha-rim', ({ add }) => { add(G.tor(GR, .012, PI * 2, 5, 32), '#ffffff', 0, GY, 0, HP, 0, 0); add(G.box(.12, .1, .004, .002), '#fff6ee', -.14, GY + .05, GR - .06, 0, -.45, 0); }));
  const crank = live(f); put(crank, 0, BH * .62 + .05, D / 2 + .03);
  crank.add(mc('sp3-gacha-crank', ({ add }) => { add(G.box(.16, .035, .03, .012), '#e8ecf4', 0, 0, 0); for (const s of [-1, 1]) add(G.sph(.022, 8, 6), '#ffffff', s * .075, 0, .01); }));
  f.idle = t => { crank.rotation.z = Math.floor(t / 3) * HP + HP * Math.min(1, (t % 3) * 2); heap.rotation.y = .03 * Math.sin(t * 1.3); heap.position.y = BH + .1 + .004 * Math.abs(Math.sin(t * 4)); };
  const fl = grp(); put(fl, 0, .24, D / 2 + .095); f.add(fl);
  fl.add(mc('sp3-gacha-flap', ({ add }) => { add(G.box(.16, .11, .012, .01), '#e8ecf4', 0, -.055, 0); add(G.box(.06, .015, .02, .006), STEEL2, 0, -.1, .012); }));
  const p = f.part('flip', fl, t => { fl.rotation.x = -1.3 * t; }, { label: K('가챠 캡슐 문', 'Gacha capsule flap'), sfx: 'open', dur: .26 });
  f.spot('inside', null, 0, .11, D / 2 + .04, { part: p, maxH: .1, label: K('가챠 캡슐 나오는 곳', 'Gacha capsule chute'), scale: .55 });
};

// 고무 풀장 (1×1): a little blow-up paddling pool on the floor — three striped rings, water with rubber ducks bobbing on it, a
// beach ball; beside it a flamingo float ring lying on the floor (it lifts), a sand bucket with a spade and a folded towel
B.sp3_pool = f => {
  const R = .38, PX = -.1, PZ = -.1, RINGS = ['#7fb5ff', '#ffffff', '#7fb5ff'];
  f.add(mc('sp3-pool', ({ add, tube }) => {
    add(G.cyl(R, R, .02, 28), '#bfe0f8', PX, .01, PZ);
    RINGS.forEach((c, k) => add(G.tor(R, .045, PI * 2, 8, 32), c, PX, .045 + k * .08, PZ, HP, 0, 0));
    for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; add(G.sph(.008, 6, 5), '#ffffff', PX + Math.cos(a) * (R + .045), .14, PZ + Math.sin(a) * (R + .045)); }
    add(G.cyl(.02, .02, .03, 8), '#ffffff', PX + R + .02, .06, PZ, 0, 0, HP);
    // the bucket, spade, towel
    add(G.cyl(.07, .055, .12, 14, true), '#ffcf5c', .32, .06, -.32); add(G.cyl(.065, .05, .115, 14, true), '#f2b84a', .32, .062, -.32, 0, 0, 0, [-1, 1, 1]); add(G.cyl(.055, .055, .01, 14), '#f2b84a', .32, .005, -.32); add(G.tor(.07, .006, PI * 2, 4, 16), '#ffe27a', .32, .12, -.32, HP, 0, 0); add(G.tor(.06, .006, PI, 4, 10), '#ff8a3c', .32, .12, -.32, 0, .4, 0); tube([.36, .02, -.28], [.42, .22, -.26], .007, '#7fb5ff', 4); add(G.box(.06, .07, .01, .01), '#7fb5ff', .43, .25, -.255, 0, .3, .1);
    add(G.box(.26, .05, .18, .02), '#ff9fb5', .3, .025, .38, 0, .2, 0); for (let k = 0; k < 3; k++) add(G.box(.262, .052, .025, .004), '#ffffff', .3, .025, .32 + k * .05, 0, .2, 0);
  }));
  f.add(put(mesh(geo('hm-pool-water', () => new THREE.CylinderGeometry(R - .03, R - .03, .02, 28)), mat('#7fd0f4', { opacity: .55, rough: .1 })), PX, .18, PZ));
  const bob = [];
  for (const [x, z, s, c] of [[-.12, .05, 1, '#ffd84a'], [.1, -.1, .8, '#ffd84a'], [0, .14, .7, '#ff9fb5']]) {
    const d = live(f); put(d, PX + x, .2, PZ + z, 0, x * 8, 0, s); bob.push(d);
    d.add(mc('sp3-pool-duck' + c, ({ add }) => { add(G.sph(.06, 12, 10), c, 0, .02, 0, 0, 0, 0, [1.25, .75, 1]); add(G.sph(.04, 12, 10), c, .05, .08, 0); add(G.cone(.018, .04, 6), '#ff8a3c', .095, .075, 0, 0, 0, -HP); for (const s of [-1, 1]) add(G.sph(.007, 6, 5), INK, .075, .09, s * .02); add(G.cone(.03, .05, 5), c, -.07, .05, 0, 0, 0, .9); }));
  }
  const ball = live(f); put(ball, PX + .16, .25, PZ + .1); bob.push(ball);
  ball.add(mc('sp3-pool-ball', ({ add }) => { for (let k = 0; k < 6; k++) add(new THREE.SphereGeometry(.08, 12, 10, k * PI / 3, PI / 3), ['#ff6b57', '#ffffff', '#ffd84a', '#ffffff', '#7fb5ff', '#ffffff'][k], 0, 0, 0); add(G.sph(.02, 6, 5), '#ffffff', 0, .078, 0); }));
  f.idle = t => { bob.forEach((d, k) => { d.position.y = (k === 3 ? .25 : .2) + .012 * Math.sin(t * 2 + k * 1.7); d.rotation.z = .08 * Math.sin(t * 1.6 + k); }); };
  // the flamingo float (lifts)
  const fl = grp(); put(fl, .3, .0, .12); f.add(fl);
  fl.add(mc('sp3-pool-flamingo', ({ add, tube }) => {
    add(G.tor(.13, .055, PI * 2, 8, 24), '#ff9fb5', 0, .055, 0, HP, 0, 0); for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; add(G.box(.02, .002, .11, .002), '#ffd0dc', Math.cos(a) * .13, .11, Math.sin(a) * .13, 0, -a, 0); }
    tube([-.13, .08, 0], [-.18, .2, 0], .025, '#ff9fb5', 8); tube([-.18, .2, 0], [-.13, .28, 0], .025, '#ff9fb5', 8); add(G.sph(.04, 10, 8), '#ff9fb5', -.12, .3, 0); add(G.cone(.015, .05, 6), '#4a4458', -.08, .29, 0, 0, 0, -2); for (const s of [-1, 1]) add(G.sph(.006, 6, 5), INK, -.11, .31, s * .03);
  }));
  const p = f.part('lift', fl, (t, b) => { fl.position.y = b.p.y + .18 * t; fl.rotation.x = .5 * t; fl.rotation.z = -.4 * t; }, { label: K('홍학 튜브', 'Flamingo float'), sfx: 'lift', dur: .3 });
  f.spot('under', null, .3, .002, .12, { part: p, maxH: .2, label: K('홍학 튜브 밑', 'Under the flamingo float'), scale: .7 });
  f.spot('inside', null, .32, .012, -.32, { maxH: .1, label: K('모래 양동이 안', 'In the sand bucket'), scale: .5 });
};

// 붕어빵 포장마차 (2×1): a little street-food cart — wooden body on bicycle wheels, a striped awning on poles, a cast-iron
// fish-mould plate whose lids flip open and shut, golden fish breads cooling on a wire rack, a kettle of batter, a bowl of red
// bean, paper bags and a menu board with a fish on it; steam rises; the warming drawer in the front pulls out
B.sp3_bungeo = f => {
  const W = 1.6, D = .62, TY = .8, z0 = -.04, CW = '#e8b880', AWN = ['#ff6b6b', '#ffffff'];
  const fish = (add, x, y, z, ry, c = '#e8a24a') => { add(G.sph(.05, 12, 8), c, x, y, z, 0, ry, 0, [1.5, .45, .9]); add(G.cone(.035, .05, 5), c, x - Math.cos(ry) * .085, y, z + Math.sin(ry) * .085, 0, ry, HP, [1, 1, .4]); add(G.sph(.007, 6, 5), shade(c, -.35), x + Math.cos(ry) * .045, y + .02, z - Math.sin(ry) * .045); for (let k = 0; k < 3; k++) add(G.box(.004, .003, .04, .001), shade(c, -.18), x - Math.cos(ry) * (k * .02 - .01), y + .022, z + Math.sin(ry) * (k * .02 - .01), 0, ry, 0); };
  const menu = tex('hm-bungeomenu', 128, 160, (c, w, h) => { c.fillStyle = '#3a3a48'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff6d8'; c.fillRect(6, 6, w - 12, h - 12); c.fillStyle = '#e8a24a'; c.beginPath(); c.ellipse(56, 52, 34, 20, 0, 0, PI * 2); c.fill(); c.beginPath(); c.moveTo(88, 52); c.lineTo(114, 34); c.lineTo(114, 70); c.fill(); c.fillStyle = '#2a1d33'; c.beginPath(); c.arc(38, 46, 4, 0, PI * 2); c.fill(); c.font = 'bold 30px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ff6b6b'; c.fillText('3 = 1000', w / 2, 116); c.fillStyle = '#7fb5ff'; c.fillRect(20, 136, w - 40, 6); });
  f.add(mc('sp3-bungeo', ({ add, tube }) => {
    add(G.box(W, TY - .2, D, .03), CW, 0, .2 + (TY - .2) / 2, z0); add(G.box(W + .06, .04, D + .06, .015), shade(CW, -.18), 0, TY, z0);
    for (let k = 0; k < 7; k++) add(G.box(.005, TY - .26, .006, .002), shade(CW, -.12), -W / 2 + .1 + k * (W - .2) / 6, .2 + (TY - .2) / 2, z0 + D / 2 + .002);
    for (const s of [-1, 1]) { add(G.tor(.17, .022, PI * 2, 6, 22), '#4a4458', s * (W / 2 - .3), .18, z0 + D / 2 + .03); for (let k = 0; k < 6; k++) add(G.box(.006, .32, .006, .002), STEEL2, s * (W / 2 - .3), .18, z0 + D / 2 + .03, 0, 0, k * PI / 6); add(G.cyl(.03, .03, .04, 10), STEEL2, s * (W / 2 - .3), .18, z0 + D / 2 + .03, HP, 0, 0); }
    add(G.cyl(.02, .02, .2, 6), '#4a4458', -W / 2 + .1, .1, z0 - D / 2 + .08); add(G.cyl(.02, .02, .2, 6), '#4a4458', W / 2 - .1, .1, z0 - D / 2 + .08);
    tube([W / 2, TY - .1, z0 + .2], [W / 2 + .2, TY - .1, z0 + .2], .014, '#4a4458', 5); tube([W / 2, TY - .1, z0 - .2], [W / 2 + .2, TY - .1, z0 - .2], .014, '#4a4458', 5); tube([W / 2 + .2, TY - .1, z0 - .2], [W / 2 + .2, TY - .1, z0 + .2], .016, '#4a4458', 5);
    // the awning
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.015, .015, .78, 6), '#e8e2d8', sx * (W / 2 - .04), TY + .39, z0 + sz * (D / 2 - .04));
    for (let k = 0; k < 10; k++) { add(G.box(W / 10 + .005, .02, D + .2, .006), AWN[k % 2], -W / 2 - .04 + (k + .5) * (W + .08) / 10, TY + .8, z0 + .02, -.12, 0, 0); add(G.cone(.08, .07, 3), AWN[k % 2], -W / 2 - .04 + (k + .5) * (W + .08) / 10, TY + .75, z0 + D / 2 + .13, 0, PI / 6, PI); }
    // the mould plate
    const MX = -.32; add(G.box(.56, .05, .36, .012), '#3a3a48', MX, TY + .045, z0 - .02); add(G.box(.6, .01, .4, .004), '#4a4458', MX, TY + .02, z0 - .02);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { add(G.sph(.055, 10, 8), '#2a2a36', MX - .17 + i * .17, TY + .072, z0 - .1 + j * .16, 0, 0, 0, [1.5, .2, .9]); if ((i + j) % 2) fish(add, MX - .17 + i * .17, TY + .08, z0 - .1 + j * .16, 0); }
    // the rack of finished ones, bags, kettle, bean bowl
    add(G.box(.38, .015, .26, .004), STEEL, .22, TY + .06, z0 - .04); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.006, .006, .04, 4), STEEL2, .22 + sx * .17, TY + .035, z0 - .04 + sz * .11);
    for (let k = 0; k < 5; k++) fish(add, .1 + (k % 3) * .12, TY + .085, z0 - .1 + Math.floor(k / 3) * .12, (k % 2 - .5) * .4);
    for (let k = 0; k < 4; k++) add(G.box(.12, .004, .16, .002), '#f2e2c4', .55, TY + .025 + k * .006, z0 + .1, 0, k * .08, 0); add(G.box(.1, .14, .06, .01), '#f2e2c4', .58, TY + .09, z0 - .12); add(G.box(.06, .03, .062, .004), '#ff6b6b', .58, TY + .11, z0 - .12);
    add(G.cyl(.06, .07, .14, 14), STEEL, -.68, TY + .09, z0 - .15); add(G.cyl(.03, .03, .03, 10), '#4a4458', -.68, TY + .175, z0 - .15); tube([-.62, TY + .1, z0 - .15], [-.56, TY + .15, z0 - .15], .012, STEEL, 5);
    add(G.cyl(.08, .06, .06, 14), '#ffffff', -.68, TY + .05, z0 + .1); add(G.cyl(.07, .07, .01, 14), '#8a3a3a', -.68, TY + .075, z0 + .1); add(G.cyl(.008, .008, .16, 5), '#e8c48e', -.66, TY + .12, z0 + .1, .5, 0, .3);
    add(G.box(.04, .26, .03, .006), '#4a4458', W / 2 - .08, TY + .13, z0 + D / 2 - .02);
  }));
  f.add(put(mesh(geo('hm-bungeomenu-q', () => new THREE.PlaneGeometry(.22, .275)), mat('#ffffff', { map: menu })), W / 2 - .08, TY + .3, z0 + D / 2 + .0));
  // mould lids flip open and shut, steam puffs rise
  const lids = [];
  for (let i = 0; i < 3; i++) { const l = live(f); put(l, -.32 - .17 + i * .17, TY + .075, z0 - .2); lids.push(l); l.add(mc('sp3-bungeo-lid', ({ add }) => { add(G.box(.15, .02, .34, .006), '#4a4458', 0, 0, .17); add(G.cyl(.012, .012, .1, 6), '#c98a52', 0, .0, .38, HP, 0, 0); })); }
  const steam = [];
  for (let k = 0; k < 3; k++) { const s = live(f); put(s, -.4 + k * .14, TY + .2, z0 - .02); steam.push(s); s.add(mc('sp3-bungeo-steam', ({ add }) => { add(G.sph(.045, 10, 8), '#ffffff', 0, 0, 0); add(G.sph(.032, 10, 8), '#ffffff', .03, .04, 0); })); }
  f.idle = t => { lids.forEach((l, i) => { const k = (t * .35 + i / 3) % 1; l.rotation.x = -(k < .5 ? Math.sin(k * 2 * PI) * 1.1 : 0); }); steam.forEach((s, k) => { const u = (t * .3 + k / 3) % 1; s.position.y = TY + .15 + u * .35; s.scale.setScalar(.6 + u * .8); s.visible = u < .85; }); };
  const dr = grp(); put(dr, -.1, TY - .2, z0 + D / 2); f.add(dr);
  dr.add(mc('sp3-bungeo-drawer', ({ add }) => {
    add(G.box(.5, .16, .025, .01), shade(CW, .08), 0, 0, .012); add(G.box(.12, .02, .025, .008), '#e2c070', 0, .03, .03); add(G.box(.2, .04, .004, .002), '#ff6b6b', 0, -.03, .026);
    add(G.pbox(.46, .01, .42), '#c9c2b6', 0, -.07, -.21); for (const s of [-1, 1]) add(G.pbox(.01, .14, .42), shade(CW, -.1), s * .23, 0, -.21); add(G.pbox(.46, .14, .01), shade(CW, -.1), 0, 0, -.42);
  }));
  const p = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .36 * t; }, { label: K('붕어빵 보온 서랍', 'Warming drawer'), sfx: 'drawer', dur: .3 });
  f.spot('inside', dr, .08, -.065, -.18, { part: p, maxH: .13, label: K('붕어빵 보온 서랍 안', 'In the warming drawer'), scale: .7 });
  f.spot('under', null, .35, 0, z0 - .05, { maxH: .2, label: K('포장마차 아래', 'Under the cart'), scale: .7 });
};

// 즉석사진 부스 (1×1): a little photo booth — a pink cabin with a striped curtain over its doorway (it draws aside), a lit
// 'PHOTO' sign, a slot with a fresh strip of photos sticking out, a stool and a mirror inside
B.sp3_photobooth = f => {
  const W = .78, D = .7, H = 1.65, BC = '#ffb3c6';
  const sign = tex('hm-photosign', 256, 64, (c, w, h) => { c.fillStyle = '#2b3a6e'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff6d8'; c.font = 'bold 42px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PHOTO', w / 2, h / 2 + 2); });
  const strip = tex('hm-photostrip', 64, 192, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); for (let k = 0; k < 4; k++) { const y = 6 + k * 46; c.fillStyle = ['#ffd0dc', '#c4e6f4', '#ffe7a8', '#d8f0d0'][k]; c.fillRect(6, y, w - 12, 40); c.fillStyle = '#fff6ee'; c.beginPath(); c.arc(w / 2, y + 22, 13, 0, PI * 2); c.fill(); c.fillStyle = '#2a1d33'; for (const s of [-1, 1]) { c.beginPath(); c.arc(w / 2 + s * 5, y + 20, 2, 0, PI * 2); c.fill(); } } });
  f.add(mc('sp3-photobooth', ({ add }) => {
    add(G.box(W, H, .04, .02), BC, 0, H / 2, -D / 2 + .02); for (const sx of [-1, 1]) add(G.box(.04, H, D, .02), BC, sx * (W / 2 - .02), H / 2, 0);
    add(G.box(W + .06, .08, D + .06, .03), shade(BC, -.15), 0, H + .04, 0); add(G.box(W, .03, D, .01), '#e8e2ec', 0, .015, 0);
    add(G.box(.06, .5, .04, .01), BC, W / 2 - .05, H - .3, D / 2 - .02); add(G.box(.06, .5, .04, .01), BC, -W / 2 + .05, H - .3, D / 2 - .02);
    add(G.cyl(.14, .14, .04, 14), '#7fb5ff', 0, .44, -.1); add(G.cyl(.02, .02, .42, 8), STEEL2, 0, .22, -.1); add(G.cyl(.12, .12, .02, 12), STEEL2, 0, .01, -.1);
    add(G.cyl(.14, .14, .02, 18), '#cfe6f2', 0, 1.15, -D / 2 + .045, HP, 0, 0); add(G.tor(.14, .015, PI * 2, 4, 18), '#ffffff', 0, 1.15, -D / 2 + .05);
    add(G.box(.12, .03, .03, .008), '#4a4458', W / 2 + .005, .9, .15, 0, HP, 0);
    for (let k = 0; k < 6; k++) add(G.sph(.025, 8, 6), '#fff6d8', -W / 2 + .1 + k * (W - .2) / 5, H + .09, D / 2 + .02);
  }));
  f.add(put(mesh(geo('hm-photosign-q', () => new THREE.PlaneGeometry(.6, .15)), mat('#ffffff', { map: sign, emissive: '#fff6d8', ei: .25 })), 0, H - .08, D / 2 + .012));
  f.add(put(mesh(geo('hm-photostrip-q', () => new THREE.PlaneGeometry(.06, .18)), mat('#ffffff', { map: strip, side: THREE.DoubleSide })), W / 2 + .02, .79, .15, 0, HP, .08));
  const cur = grp(); put(cur, 0, H - .06, D / 2 - .01); f.add(cur);
  const st = tex('hm-booth-curtain', 64, 64, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff8fb0'; for (let k = 0; k < 4; k++) c.fillRect(k * 16, 0, 8, h); });
  cur.add(put(mesh(geo('hm-booth-cur', () => { const g = new THREE.PlaneGeometry(W - .12, H - .2, 16, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, .02 * Math.sin(p.getX(i) * 30)); g.computeVertexNormals(); return g; }), mat('#ffffff', { map: st, side: THREE.DoubleSide })), 0, -(H - .2) / 2, 0));
  cur.add(mc('sp3-booth-rod', ({ add }) => add(G.cyl(.012, .012, W - .08, 8), STEEL2, 0, 0, 0, 0, 0, HP)));
  const p = f.part('curtain', cur, t => { cur.scale.x = 1 - .7 * t; cur.position.x = cur.userData.base.p.x - (W - .12) * .35 * t; }, { label: K('사진 부스 커튼', 'Photo booth curtain'), sfx: 'swish', dur: .4 });
  f.spot('inside', null, .18, .03, .05, { part: p, maxH: .5, label: K('사진 부스 안', 'In the photo booth'), scale: .8 });
  f.spot('on', null, 0, .46, -.1, { part: p, maxH: .3, label: K('사진 부스 의자 위', 'On the booth stool'), scale: .65 });
};

export const MYHOME_BUILDERS = B;
export const MYHOME_INFO = {
  hm_vanity: { w: 1, d: 1, name: K('화장대', 'Vanity Table'), price: 240 },
  hm_oven: { w: 1, d: 1, name: K('미니 오븐 카트', 'Toaster Oven Cart'), price: 220 },
  hm_succulent: { w: 1, d: 1, name: K('다육이 계단 선반', 'Succulent Stand'), price: 170 },
  hm_boardgame: { w: 1, d: 1, name: K('보드게임 장', 'Board Game Shelf'), price: 200 },
  hm_fireplace: { w: 1, d: 1, name: K('벽난로', 'Fireplace'), price: 320 },
  hm_sewing: { w: 1, d: 1, name: K('미싱 책상', 'Sewing Table'), price: 260 },
  hm_hamster: { w: 1, d: 1, name: K('햄스터 집', 'Hamster Cage'), price: 240 },
  hm_dollhouse: { w: 1, d: 1, name: K('인형집', 'Dollhouse'), price: 280 },
  sp3_gacha: { w: 1, d: 1, name: K('가챠 머신', 'Gacha Machine'), price: 440 },
  sp3_pool: { w: 1, d: 1, name: K('고무 풀장', 'Paddling Pool'), price: 520 },
  sp3_bungeo: { w: 2, d: 1, name: K('붕어빵 포장마차', 'Fish Bread Cart'), price: 640 },
  sp3_photobooth: { w: 1, d: 1, name: K('즉석사진 부스', 'Photo Booth'), price: 760 },
};
// the eight for the 가구 tab (the sp3_ ones are 스페셜: specials.js)
export const MYHOME_SHOP = Object.fromEntries(Object.entries(MYHOME_INFO).filter(([k]) => k.startsWith('hm_')));

// ═══ 물건 (things to hide) ══════════════════════════════════════════════════════════════════════════════════════════════
export const MYHOME_ITEMS = {
  // 종이학: a folded paper crane — a pale pink body, two wings out, a long neck and a pointed tail, the fold lines a shade darker
  papercrane: { name: K('종이학', 'Paper crane'), h: .16, build() {
    const g = grp(), c = '#ffc9d6', d = shade('#ffc9d6', -.12), tri = (a, b, e) => { const s = new THREE.Shape(); s.moveTo(a[0], a[1]); s.lineTo(b[0], b[1]); s.lineTo(e[0], e[1]); s.closePath(); return s; };
    g.add(put(mesh(geo('pc-body', () => new THREE.ExtrudeGeometry(tri([-.06, 0], [.06, 0], [0, .07]), { depth: .05, bevelEnabled: false })), mat(c)), 0, .02, -.025));
    for (const s of [-1, 1]) g.add(put(mesh(geo('pc-wing', () => new THREE.ExtrudeGeometry(tri([0, 0], [.16, .02], [.05, .09]), { depth: .004, bevelEnabled: false })), mat(s > 0 ? c : d, { side: THREE.DoubleSide })), 0, .07, 0, -HP + .3, s > 0 ? -HP : HP, 0));
    g.add(put(cone(.012, .14, c, null, 4), .09, .12, 0, 0, 0, -.5)); g.add(put(cone(.012, .05, d, null, 4), .14, .17, 0, 0, 0, -2.2));
    g.add(put(cone(.012, .12, c, null, 4), -.09, .1, 0, 0, 0, .7));
    return g;
  } },
  // 달고나: a round amber honeycomb toffee pressed flat with a star stamped in it, on its square of baking paper, a little stick
  dalgona: { name: K('달고나', 'Dalgona candy'), h: .05, flat: true, build() {
    const g = grp();
    g.add(put(rbox(.2, .006, .2, '#fbf6ec', .004), 0, .003, 0));
    g.add(put(cyl(.08, .085, .018, '#e0a24a', GLOSS, 24), 0, .015, 0)); g.add(put(tor(.08, .008, '#c9822e', null, PI * 2, 6, 24), 0, .02, 0, HP, 0, 0));
    g.add(put(mesh(geo('dg-star', () => new THREE.ExtrudeGeometry(starShape(.04, .018), { depth: .003, bevelEnabled: false }).rotateX(-HP)), mat('#b8701e')), 0, .025, 0));
    for (let k = 0; k < 6; k++) g.add(put(sph(.006, '#f2c06a', null, 6, 5), Math.cos(k) * .055, .025, Math.sin(k) * .055));
    g.add(put(cyl(.005, .005, .14, '#e8c48e', null, 6), .09, .03, .03, HP, .5, 0));
    return g;
  } },
  // 오뚝이: a roly-poly doll — a round red body weighted at the bottom, a cream face with rosy cheeks and a smile, a little hat
  // knot, gold buttons; it leans and rights itself
  rolypoly: { name: K('오뚝이', 'Roly-poly doll'), h: .15, build() {
    const g = grp(), c = '#ff6b6b';
    g.add(put(sph(.065, c, GLOSS, 18, 14), 0, .062, 0, 0, 0, 0, [1, .95, 1])); g.add(put(sph(.045, c, GLOSS, 16, 12), 0, .125, 0));
    g.add(put(sph(.034, '#fff4e2', null, 14, 10), 0, .122, .018, 0, 0, 0, [1, 1, .7]));
    for (const s of [-1, 1]) { g.add(put(sph(.006, INK, null, 6, 5), s * .013, .128, .042)); g.add(put(sph(.008, '#ffb3c6', null, 6, 5), s * .022, .116, .038, 0, 0, 0, [1, .6, .4])); }
    g.add(put(tor(.008, .0025, INK, null, PI, 4, 8), 0, .113, .044, 0, 0, PI));
    g.add(put(sph(.012, '#ffd84a', GLOSS, 8, 6), 0, .172, 0)); for (const y of [.07, .045]) g.add(put(sph(.008, '#ffd84a', GLOSS, 8, 6), 0, y, .063));
    g.add(put(tor(.05, .006, '#ffd84a', null, PI * 2, 4, 18), 0, .1, 0, HP, 0, 0));
    return g;
  } },
  // 다마고치: an egg-shaped pocket pet — a lilac shell with a little screen (a pixel chick on it), three buttons, a ball chain
  eggtoy: { name: K('다마고치', 'Pocket pet egg'), h: .14, build() {
    const g = grp();
    g.add(put(sph(.06, '#c9b8ff', GLOSS, 18, 14), 0, .065, 0, 0, 0, 0, [.95, 1.12, .55]));
    g.add(put(rbox(.06, .05, .01, '#e8f0d8', .008), 0, .075, .03));
    const px = tex('hm-eggpx', 16, 16, (c, w, h) => { c.fillStyle = '#e8f0d8'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a3a48'; for (const [x, y] of [[6, 5], [7, 5], [8, 5], [5, 6], [9, 6], [5, 7], [7, 7], [9, 7], [5, 8], [9, 8], [6, 9], [7, 9], [8, 9], [10, 7]]) c.fillRect(x, y, 1, 1); });
    px.magFilter = THREE.NearestFilter; px.needsUpdate = true;
    g.add(put(mesh(geo('egg-px', () => new THREE.PlaneGeometry(.05, .04)), mat('#ffffff', { map: px })), 0, .075, .0356));
    for (const [x, c] of [[-.022, '#ff9fb5'], [0, '#ffe27a'], [.022, '#7fd6c0']]) g.add(put(sph(.008, c, GLOSS, 8, 6), x, .035, .028, 0, 0, 0, [1, 1, .5]));
    for (let k = 0; k < 7; k++) g.add(put(sph(.005, '#c9cfe0', { metal: .4 }, 6, 5), Math.sin(k * .5) * .02, .135 + k * .008, -.005));
    return g;
  } },
  // 즉석 사진: an instant photo — the white frame thicker at the bottom, a sunny picture of two friends at the sea, a doodled heart
  instaphoto: { name: K('즉석 사진', 'Instant photo'), h: .02, flat: true, build() {
    const g = grp();
    g.add(put(rbox(.15, .006, .18, '#ffffff', .003), 0, .003, 0));
    const pic = tex('hm-instapic', 96, 96, (c, w, h) => {
      const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#9fd8f4'); sky.addColorStop(.6, '#cdeefc'); sky.addColorStop(.6, '#5fb7e8'); sky.addColorStop(1, '#f6e0b0'); c.fillStyle = sky; c.fillRect(0, 0, w, h);
      for (const [x, col] of [[34, '#fff6ee'], [62, '#ffd9a8']]) { c.fillStyle = col; c.beginPath(); c.arc(x, 66, 15, 0, PI * 2); c.fill(); c.fillStyle = '#2a1d33'; for (const s of [-1, 1]) { c.beginPath(); c.arc(x + s * 5, 63, 2, 0, PI * 2); c.fill(); } }
      c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(78, 18, 9, 0, PI * 2); c.fill();
    });
    g.add(put(mesh(geo('ip-pic', () => new THREE.PlaneGeometry(.125, .125)), mat('#ffffff', { map: pic })), 0, .0065, -.015, -HP, 0, 0));
    g.add(put(mesh(geo('ip-heart', () => new THREE.ExtrudeGeometry(heartShape(.012), { depth: .001, bevelEnabled: false }).rotateX(-HP)), mat('#ff6f8a')), .04, .007, .07));
    return g;
  } },
  // 털모자: a knitted beanie — ribbed brim turned up, a cable-knit crown in mint, a fluffy cream pompom on top
  knithat: { name: K('털모자', 'Knit beanie'), h: .16, build() {
    const g = grp(), c = '#8fd8c4', d = shade('#8fd8c4', -.12);
    g.add(put(sph(.085, c, null, 18, 12), 0, .05, 0, 0, 0, 0, [1, 1.05, 1]));
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; g.add(put(cyl(.01, .01, .1, d, null, 6), Math.cos(a) * .082, .09, Math.sin(a) * .082)); }
    g.add(put(cyl(.09, .092, .045, d, null, 20), 0, .03, 0));
    for (let k = 0; k < 20; k++) { const a = k / 20 * PI * 2; g.add(put(cyl(.006, .006, .044, '#7cc8b4', null, 4), Math.cos(a) * .092, .03, Math.sin(a) * .092)); }
    g.add(put(sph(.04, '#fff4e2', null, 12, 10), 0, .145, 0)); for (let k = 0; k < 6; k++) g.add(put(sph(.018, '#fff8ee', null, 8, 6), Math.cos(k) * .03, .145 + Math.sin(k * 2) * .02, Math.sin(k) * .03));
    return g;
  } },
};
export const MYHOME_ITEM_KEYS = Object.keys(MYHOME_ITEMS);

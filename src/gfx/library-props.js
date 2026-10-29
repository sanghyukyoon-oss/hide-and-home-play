// 동네 도서관 (10/21, 17판 새 맵 — 고른 그림 library-a, 흑백 판): a split-level library. Up a short stair at the back left,
// a reading nook on a platform with cushions and a railing; below, low bookshelves, a reading table under green
// banker's lamps, the librarian's desk, a book drop and a book cart. Warm wood, cream and a dusty blue.
import * as THREE from 'three';
import { put, grp, shade, cutFace, liner, minusRect, windowFace } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const WOOD = '#d9a466', WOODD = '#a8733f', BLUE = '#5f7fae', BLUE2 = '#8fa9d4', CREAM = '#fbf3e4', GREEN = '#4f9a6a', LEAF = '#6cbf5a', LEAF2 = '#4fa64f', DARK = '#3a3048';
const SPINES = ['#d9534f', '#4f7fc7', '#e8b04a', '#5aa88a', '#8f6cc4', '#e88a5c', '#f2e2c4'];
const B = {};
// a row of book spines along x from x0, n books, on a shelf at y, depth z
// (⑥ 10/24 사용자 37판 "디테일이 떨어지네"): each spine with a cream title label, every other one two gold lines, now and then
// a book leaning on its neighbour
const books = (add, x0, y, z, n, seed = 1, h = .22) => {
  let x = x0;
  for (let k = 0; k < n; k++) {
    const w = .045 + ((k * 7 + seed) % 3) * .012, hh = h * (.82 + ((k * 5 + seed) % 4) * .06), c = SPINES[(k + seed) % SPINES.length], lean = (k + seed) % 6 === 5 ? -.14 : 0;
    const cx = x + w / 2 + (lean ? hh * .07 : 0), cy = y + hh / 2 - (lean ? hh * .005 : 0);
    add(G.box(w, hh, .17, .006), c, cx, cy, z, 0, 0, lean);
    add(G.box(w * .7, hh * .2, .004, .002), '#fbf3e4', cx - Math.sin(lean) * hh * .1, cy + hh * .1, z + .086, 0, 0, lean);
    if ((k + seed) % 2) for (const f of [.38, -.36]) add(G.box(w * .9, .006, .004, .001), '#e2c070', cx - Math.sin(lean) * hh * f, cy + hh * f, z + .086, 0, 0, lean);
    x += w + .006 + (lean ? hh * .14 : 0);
  }
};

// 독서 다락 (2×3): a wooden platform along the back-left wall up a short stair — cushions, a stool with a cup, a basket of
// books, a railing round its open sides; the stair comes down at its front
B.readingnook = (f, T) => {
  const h = .5, x0 = -1, x1 = 1, z0 = -1.5, z1 = .55;
  f.add(mc('readingnook', ({ add }) => {
    add(G.box(x1 - x0, h, z1 - z0, .03), WOODD, 0, h / 2, (z0 + z1) / 2);
    add(G.box(x1 - x0 - .02, .04, z1 - z0 - .02, .01), WOOD, 0, h + .02, (z0 + z1) / 2);
    for (let k = 0; k < 5; k++) add(G.pbox(.012, .005, z1 - z0 - .04), shade(WOOD, -.08), x0 + .2 + k * .4, h + .042, (z0 + z1) / 2);
    add(G.box(x1 - x0, h - .08, .03, .01), BLUE, 0, h / 2, z1 + .01);   // the blue panel on its front
    // the stair down at the front left
    for (let k = 0; k < 3; k++) add(G.box(.7, h * (3 - k) / 3, .3, .02), WOOD, x0 + .4, h * (3 - k) / 6, z1 + .15 + k * .3);
    // railing round the east and south edges (gap over the stair)
    const post = (x, z) => add(G.box(.06, .5, .06, .01), WOODD, x, h + .25, z);
    for (const z of [z0 + .05, -.5, z1 - .05]) post(x1 - .05, z);
    for (const x of [.2, x1 - .05]) post(x, z1 - .05);
    add(G.box(.06, .05, z1 - z0, .01), WOOD, x1 - .05, h + .5, (z0 + z1) / 2);
    add(G.box(x1 - .2, .05, .06, .01), WOOD, (.2 + x1) / 2, h + .5, z1 - .05);
    for (let k = 0; k < 6; k++) add(G.box(.03, .44, .03, .005), WOOD, x1 - .05, h + .24, z0 + .2 + k * .34);
    // cushions, a stool with a cup, a basket of books
    for (const [x, z, c] of [[-.45, -.9, BLUE2], [-.1, -.55, '#ffd27a'], [.35, -1.0, '#ffb3c4']]) { add(G.cyl(.24, .26, .1, 16), c, x, h + .09, z); add(G.cyl(.18, .18, .02, 16), shade(c, .12), x, h + .145, z); }
    add(G.cyl(.14, .12, .3, 12), WOOD, .55, h + .19, -.2); add(G.cyl(.15, .15, .04, 12), WOODD, .55, h + .36, -.2);
    add(G.cyl(.04, .035, .07, 10), '#ffffff', .55, h + .415, -.2);
    add(G.box(.32, .16, .22, .03), '#d9a466', -.65, h + .1, -.25); books(add, -.78, h + .15, -.25, 4, 3, .14);
    for (const [x, z, c] of [[-.45, -.9, BLUE2], [-.1, -.55, '#ffd27a'], [.35, -1.0, '#ffb3c4']]) add(G.sph(.02, 6, 5), shade(c, -.15), x, h + .157, z, 0, 0, 0, [1, .5, 1]);
    add(G.box(.5, .025, .34, .02), '#c9e0a8', -.55, h + .053, -.25 - .3, 0, .4, 0); for (const k of [-1, 0, 1]) add(G.box(.5, .004, .03, .002), '#a8c88a', -.55 + k * .02, h + .067, -.55 + k * .1, 0, .4, 0);
    add(G.cyl(.06, .07, .03, 12), '#c9a24a', -.85, h + .055, -1.3); add(G.cyl(.01, .01, .3, 6), '#c9a24a', -.85, h + .2, -1.3); add(G.cyl(.05, .13, .14, 14, true), '#ffe08a', -.85, h + .4, -1.3);
  }));
  f.spot('under', null, -.1, h + .06, -.55, { maxH: .1, label: '방석 밑', scale: .55 });
  f.spot('on', null, .55, h + .38, -.2, { maxH: .2, label: '다락 의자 위', scale: .55 });
  f.spot('behind', null, -.45, h + .04, -1.25, { maxH: .3, label: '다락 구석', scale: .7 });
  f.spot('under', null, x0 + .4, 0, z1 + .62, { maxH: .15, label: '계단 밑', scale: .55 });
};

// 아치 창 (wall piece, span 2): a tall round-topped window with a wooden frame, ivy hanging over it — set high, over the
// reading nook
B.archwindow = f => {
  f.add(mc('archwindow', ({ add }) => {
    const y0 = 1.0, W = 1.1, H = 1.2;
    add(G.box(W, H, .03, .01), '#cfe9f2', 0, y0 + H / 2, .02);
    add(G.cyl(W / 2, W / 2, .03, 20, false), '#cfe9f2', 0, y0 + H, .02, HP, 0, 0, [1, 1, 1]);
    for (const s of [-1, 1]) add(G.box(.07, H, .06, .01), WOODD, s * W / 2, y0 + H / 2, .04);
    add(G.tor(W / 2, .035, PI, 6, 20), WOODD, 0, y0 + H, .04);
    add(G.box(.04, H + .5, .05, .005), WOODD, 0, y0 + (H + .5) / 2, .05); add(G.box(W, .04, .05, .005), WOODD, 0, y0 + H * .55, .05);
    add(G.box(W + .2, .06, .18, .01), WOOD, 0, y0 - .03, .09);
    for (let k = 0; k < 10; k++) add(G.sph(.07 + (k % 3) * .015, 8, 6), k % 2 ? LEAF : LEAF2, -W / 2 + .05 + Math.sin(k) * .05, y0 + H + .25 - k * .15, .09, 0, 0, 0, [1.2, .8, .6]);
    for (let k = 0; k < 6; k++) add(G.sph(.07, 8, 6), k % 2 ? LEAF : LEAF2, -W / 2 + .1 + k * .14, y0 + H + .5 - Math.sin(k * .5) * .1, .07, 0, 0, 0, [1.2, .7, .7]);
    // (3차 10/21 — the library's hero, user "도서관 평범"): tied-back curtains, three pots on the sill, a brass sconce each side
    for (const sx of [-1, 1]) { add(G.box(.18, H + .2, .05, .04), '#e9c28e', sx * (W / 2 + .14), y0 + H / 2 + .1, .09); add(G.box(.2, .06, .07, .02), '#c99a62', sx * (W / 2 + .14), y0 + H * .4, .11); add(G.cyl(.012, .012, W + .5, 6), '#c9a24a', 0, y0 + H + .62, .1, 0, 0, HP); }
    for (const [x, c] of [[-.3, '#ff9ec2'], [0, '#ffe27a'], [.3, '#bfe0f5']]) { add(G.cyl(.06, .05, .1, 10), '#d98b5f', x, y0 + .05, .12); add(G.sph(.07, 8, 6), LEAF, x, y0 + .14, .12); add(G.sph(.035, 6, 5), c, x + .03, y0 + .19, .14); }
    for (const sx of [-1, 1]) { add(G.box(.06, .12, .06, .02), '#c9a24a', sx * (W / 2 + .45), y0 + H * .8, .05); add(G.cyl(.06, .04, .12, 10, true), '#ffe08a', sx * (W / 2 + .45), y0 + H * .8 + .1, .1); }
  }));
};

// 낮은 책장 (1×1): a waist-high open bookcase, books on two shelves, a pot or a framed print on top
// (type 'libshelf', not 'lowshelf': that is the attic's own low shelf)
B.libshelf = (f, T, o = {}) => {
  const s = o.seed || 1;
  f.add(mc('libshelf|' + s, ({ add }) => {
    add(G.box(.86, .04, .38, .01), WOODD, 0, .02, 0); add(G.box(.86, .04, .38, .01), WOODD, 0, .44, 0); add(G.box(.9, .05, .42, .015), WOOD, 0, .88, 0);
    for (const x of [-.42, .42]) add(G.box(.04, .9, .38, .01), WOOD, x, .45, 0);
    add(G.box(.86, .86, .02, .005), shade(WOODD, -.1), 0, .45, -.18);
    books(add, -.36, .04, .02, 8, s); books(add, -.36, .46, .02, 7, s + 3);
    for (const y of [.04, .46]) { add(G.box(.008, .14, .1, .003), '#8f9bb8', .3, y + .07, .02); add(G.box(.06, .008, .1, .003), '#8f9bb8', .33, y + .004, .02); }
    add(G.box(.22, .06, .008, .004), '#fbf3e4', 0, .88, .215); add(G.box(.16, .008, .004, .002), DARK, 0, .885, .22); add(G.box(.1, .006, .004, .002), DARK, 0, .868, .22);
    if (s % 2) { add(G.cyl(.1, .08, .14, 12), '#f6f1ea', .2, .97, 0); add(G.sph(.14, 10, 7), LEAF, .2, 1.1, 0); add(G.sph(.1, 8, 6), LEAF2, .28, 1.15, .06); }
    else { add(G.box(.28, .22, .03, .01), WOODD, -.15, 1.0, -.08, -.2, 0, 0); add(G.box(.22, .16, .01, .005), '#cfe8b8', -.15, 1.0, -.065, -.2, 0, 0); }
  }));
  f.spot('on', null, .0, .46, .1, { maxH: .36, label: '낮은 책장 칸', scale: .7 });
  f.spot('behind', null, 0, 0, -.32, { maxH: .3, label: '책장 뒤', scale: .7 });
};

// 열람 책상 (2×1): a long reading table, two green banker's lamps, an open book, a vase of daisies, four chairs
B.readtable = (f, T) => {
  f.add(mc('readtable', ({ add }) => {
    add(G.box(1.7, .06, .76, .02), WOOD, 0, .72, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.06, .7, .06, .01), WOODD, sx * .78, .35, sz * .32);
    for (const x of [-.5, .5]) { add(G.cyl(.08, .1, .04, 12), '#c9a24a', x, .77, -.1); add(G.cyl(.012, .012, .2, 6), '#c9a24a', x, .87, -.1); add(G.cyl(.02, .14, .1, 14, true), GREEN, x, 1.0, -.08, .25, 0, 0); add(G.sph(.03, 8, 6), '#ffe9a8', x, .96, -.06); }
    add(G.box(.3, .02, .2, .005), '#fffaf0', .05, .76, .15, 0, .3, 0); add(G.pbox(.01, .025, .2), shade('#fffaf0', -.1), .05, .765, .15);
    add(G.cyl(.06, .05, .12, 10), BLUE2, -.1, .82, -.15); for (let k = 0; k < 5; k++) add(G.sph(.035, 6, 5), k % 2 ? '#ffffff' : '#ffe27a', -.1 + Math.cos(k) * .05, .92, -.15 + Math.sin(k) * .05);
    // two stacks of books, round glasses on the open book, a pencil, a little '쉿' tent card, seat cushions on the chairs
    for (const [x, z, n] of [[-.65, .1, 3], [.7, -.15, 2]]) for (let k = 0; k < n; k++) add(G.box(.24 - k * .02, .04, .17, .006), SPINES[(k * 2 + n) % SPINES.length], x, .77 + k * .04, z, 0, k * .25 - .1, 0);
    for (const s of [-1, 1]) add(G.tor(.022, .004, PI * 2, 4, 12), DARK, .05 + s * .03, .772, .15, HP, 0, 0); add(G.box(.03, .003, .003, .001), DARK, .05, .772, .15);
    add(G.cyl(.005, .005, .14, 6), '#ffd23f', .26, .757, .06, HP, .8, 0);
    for (const s of [-1, 1]) add(G.box(.12, .07, .004, .002), '#fbf3e4', -.3, .785, .05 + s * .018, s * .3, 0, 0); add(G.box(.05, .02, .002, .001), '#d9534f', -.3, .79, .075, .3, 0, 0);
    for (const [x, z, r] of [[-.45, -.6, 0], [.45, -.6, 0], [-.45, .6, PI], [.45, .6, PI]]) {
      add(G.box(.38, .05, .36, .01), WOOD, x, .45, z);
      add(G.box(.32, .04, .3, .02), r ? '#ffd27a' : BLUE2, x, .49, z);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.04, .44, .04, .005), WOODD, x + sx * .15, .22, z + sz * .14);
      add(G.box(.38, .45, .05, .01), WOOD, x, .7, z + (r ? .17 : -.17));
    }
  }));
  f.spot('under', null, -.2, 0, 0, { maxH: .6, label: '열람 책상 밑', scale: .9 });
  f.spot('on', null, .45, .75, .2, { maxH: .25, label: '열람 책상 위', scale: .7 });
};

// 사서 책상 (2×1): the librarian's counter — a blue front panel, a reading lamp, a pen cup, a stack of returns, a stamp,
// a chair behind it; a drawer that slides out
B.libdesk = (f, T) => {
  f.add(mc('libdesk', ({ add }) => {
    add(G.box(1.7, .78, .5, .02), WOOD, 0, .39, .05); add(G.box(1.62, .6, .02, .01), BLUE, 0, .38, .31);
    add(G.box(1.78, .05, .6, .01), WOODD, 0, .8, .03);
    add(G.cyl(.1, .12, .04, 12), '#c9a24a', -.55, .84, -.05); add(G.cyl(.012, .012, .26, 6), '#c9a24a', -.55, .97, -.05); add(G.cyl(.04, .18, .16, 16, true), '#ffe08a', -.55, 1.12, -.03);
    add(G.cyl(.05, .045, .12, 10), '#e88a5c', .55, .88, -.12); for (const x of [.53, .57]) add(G.cyl(.008, .008, .16, 5), DARK, x, .96, -.12);
    for (let k = 0; k < 4; k++) add(G.box(.32, .05, .24, .005), SPINES[k + 1], .1, .855 + k * .05, -.05, 0, k * .2, 0);
    add(G.cyl(.04, .05, .07, 10), '#d9534f', -.2, .86, .12);
    // a little computer for the loans, a date stamp on its ink pad, a counter bell, a '대출 · 반납' plate on the front, a plant
    add(G.box(.32, .24, .03, .02), '#e9e4ec', -.15, 1.0, -.2); add(G.box(.28, .19, .006, .004), '#5f7fae', -.15, 1.0, -.183); add(G.box(.04, .14, .03, .01), '#c9cfe0', -.15, .89, -.22); add(G.box(.12, .015, .1, .006), '#c9cfe0', -.15, .83, -.22);
    add(G.box(.26, .016, .09, .006), '#e9e4ec', -.22, .833, -.02);
    add(G.box(.12, .012, .08, .004), DARK, .32, .832, -.22); add(G.cyl(.022, .026, .05, 10), '#4a4458', .32, .86, -.22); add(G.sph(.026, 8, 6), '#c9a24a', .32, .9, -.22);
    add(G.cyl(.045, .05, .015, 14), '#c9cfe0', -.72, .832, .17); add(G.sph(.035, 10, 8), '#e2c070', -.72, .845, .17, 0, 0, 0, [1, .8, 1]); add(G.sph(.008, 6, 5), '#c9cfe0', -.72, .88, .17);
    add(G.box(.5, .1, .012, .006), '#fbf3e4', 0, .55, .325); for (const [x, w] of [[-.12, .14], [.12, .14]]) add(G.box(w, .025, .004, .002), DARK, x, .56, .333); add(G.sph(.008, 6, 5), DARK, 0, .56, .333);
    add(G.cyl(.06, .05, .09, 10), '#d98b5f', .75, .87, -.1); add(G.sph(.08, 8, 6), LEAF, .75, .97, -.1); add(G.sph(.05, 8, 6), LEAF2, .79, 1.0, -.06);
    // the chair behind
    add(G.box(.42, .06, .42, .03), BLUE, .1, .48, -.55); add(G.box(.42, .44, .06, .03), BLUE, .1, .74, -.76); add(G.cyl(.03, .03, .45, 8), '#4a4458', .1, .23, -.55); add(G.cyl(.2, .2, .03, 12), '#4a4458', .1, .03, -.55);
  }));
  const dr = grp(); put(dr, .45, .6, .3); f.add(dr);
  dr.add(mc('libdesk-drawer', ({ add }) => { add(G.box(.5, .16, .03, .01), WOOD, 0, 0, .015); add(G.pbox(.46, .02, .4), WOODD, 0, -.07, -.2); for (const s of [-1, 1]) add(G.pbox(.02, .13, .4), WOODD, s * .23, -.01, -.2); add(G.box(.1, .03, .03, .01), '#c9a24a', 0, .02, .04); }));
  const p = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .32 * t; }, { label: '사서 책상 서랍', sfx: 'drawer', dur: .3 });
  f.spot('inside', dr, 0, -.06, -.2, { part: p, maxH: .1, label: '사서 책상 서랍 안', scale: .6 });
  f.spot('on', null, .45, .83, .1, { maxH: .25, label: '사서 책상 위', scale: .65 });
  f.spot('under', null, .1, 0, -.55, { maxH: .4, label: '사서 의자 밑', scale: .7 });
};

// 반납함 (1×1): a white book-drop box with a slot and a red sign; its front door opens
B.bookdrop = (f, T) => {
  f.add(mc('bookdrop', ({ add }) => {
    add(cutFace(G.box(.62, 1.0, .5, .05), 'z'), '#f4efe6', 0, .5, -.02);
    add(windowFace(.52, .9, [-.24, .24, -.38, -.02]), '#f4efe6', 0, .5, .23);
    add(liner(.48, .36, .43, 'z'), shade('#f4efe6', -.18), 0, .3, -.005);
    add(G.box(.42, .05, .02, .005), DARK, 0, .82, .235);
    add(G.box(.66, .05, .54, .02), shade('#f4efe6', -.08), 0, 1.02, -.02);
    // (⑥ 10/23 31~70판 훑기: a plain white box with a red patch, nothing said what it was — now a book half pushed into the
    // slot, a red sign with a white open book and an arrow down into the box, a blue band and little feet: a book drop)
    add(G.box(.2, .05, .13, .006), '#4f86c6', .03, .86, .2, -.5, .1, 0); add(G.box(.19, .04, .005, .002), '#ffffff', .03, .86, .265, -.5, .1, 0);
    add(G.box(.24, .17, .02, .01), '#d9534f', 0, .63, .235);
    for (const sx of [-1, 1]) add(G.box(.075, .06, .01, .004), '#ffffff', sx * .04, .665, .248, 0, 0, sx * -.18);
    add(G.box(.012, .04, .01, .003), '#ffffff', 0, .6, .248); add(G.cone(.026, .03, 3), '#ffffff', 0, .57, .248, PI, 0, 0);
    for (const [a, b] of minusRect([-.32, .32, .315, .365], [-.24, .24, .12, .48])) add(G.box(b - a, .05, .01, .004), '#4f86c6', (a + b) / 2, .34, .233);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.06, .05, .06, .015), DARK, sx * .26, .0, -.02 + sz * .19);
  }));
  const dv = grp(); put(dv, -.27, .1, .24); f.add(dv);
  dv.add(mc('bookdrop-door', ({ add }) => { add(G.box(.54, .4, .025, .01), '#e9e3d8', .27, .2, 0); add(G.box(.08, .03, .03, .01), '#a9b0c2', .48, .2, .02); }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.5 * t; }, { label: '반납함 문', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, 0, .13, 0, { part: p, maxH: .3, label: '반납함 안', scale: .7 }), .26, { w: .28 });
};

// 책 수레 (1×1): a white wire book cart on castors, two shelves of returned books
B.bookcart = (f, T) => {
  f.add(mc('bookcart', ({ add, tube }) => {
    for (const y of [.2, .55]) add(G.box(.6, .03, .36, .01), '#e9e4ec', 0, y, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { tube([sx * .29, .06, sz * .17], [sx * .29, .78, sz * .17], .015, '#c9cfe0', 6); add(G.sph(.04, 8, 6), '#4a4458', sx * .29, .04, sz * .17); }
    tube([-.29, .78, -.17], [.29, .78, -.17], .015, '#c9cfe0', 6); tube([-.29, .78, .17], [.29, .78, .17], .015, '#c9cfe0', 6);
    books(add, -.26, .215, 0, 8, 2); books(add, -.26, .565, 0, 7, 5);
    // a push handle, a hanging '반납 도서' card, castor forks
    for (const sz of [-1, 1]) tube([.29, .78, sz * .17], [.36, .86, sz * .1], .015, '#c9cfe0', 6); tube([.36, .86, -.1], [.36, .86, .1], .02, '#4a4458', 6);
    tube([-.1, .78, .17], [-.1, .72, .19], .004, DARK, 4); tube([.1, .78, .17], [.1, .72, .19], .004, DARK, 4); add(G.box(.26, .1, .006, .004), '#fbf3e4', 0, .68, .195); add(G.box(.18, .02, .002, .001), '#d9534f', 0, .69, .199); add(G.box(.12, .012, .002, .001), DARK, 0, .66, .199);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.03, .04, .05, .008), '#a9b2c8', sx * .29, .07, sz * .17);
  }));
  f.spot('on', null, 0, .22, .02, { maxH: .26, label: '책 수레 아래 칸', scale: .6 });
};

// 책장 사다리 (1×1, 3차): a rolling library ladder leaning on the tall shelves, a brass rail along the top, a stool at its foot
B.libladder = (f, T) => {
  // (⑥ 10/24 사용자 37판 "사다리 떠있다": its top leant on the air 65 cm in front of the shelves — the shelves' face is at z −1.0
  // from this tile's centre) the ladder now runs from its casters on the floor to brass hooks over a brass rail fixed to the
  // shelf fronts on brackets; rubber-capped rails, a footrest stool beside it
  const Z0 = -.22, Z1 = -.96, H = 1.95;
  f.add(mc('libladder2', ({ add, tube }) => {
    add(G.cyl(.018, .018, 1.0, 8), '#c9a24a', 0, H, Z1 - .04, 0, 0, HP);
    for (const sx of [-.45, 0, .45]) { add(G.box(.03, .05, .06, .01), '#a8822f', sx, H, Z1 - .07); add(G.sph(.024, 8, 6), '#c9a24a', sx, H, Z1 - .04); }
    for (const sx of [-1, 1]) {
      tube([sx * .2, .07, Z0], [sx * .2, H - .04, Z1 + .02], .028, WOODD, 6);
      add(G.tor(.03, .01, PI, 4, 8), DARK, sx * .2, H - .005, Z1 - .02, 0, HP, 0);
      add(G.box(.05, .06, .06, .012), DARK, sx * .2, .06, Z0);
      add(G.cyl(.03, .03, .03, 10), '#5b5672', sx * .2, .03, Z0 + .03, 0, 0, HP);
    }
    for (let k = 1; k < 8; k++) { const t = k / 8; add(G.box(.42, .035, .07, .01), WOOD, 0, .07 + (H - .1) * t, Z0 + (Z1 - Z0) * t); add(G.box(.43, .008, .02, .003), '#a8733f', 0, .09 + (H - .1) * t, Z0 + (Z1 - Z0) * t + .03); }
    add(G.cyl(.15, .15, .05, 14), WOOD, .3, .35, .32); for (const a of [0, 2.1, 4.2]) add(G.box(.03, .34, .03, .01), WOODD, .3 + Math.cos(a) * .1, .17, .32 + Math.sin(a) * .1);
    add(G.cyl(.13, .13, .012, 14), '#c95a4a', .3, .38, .32);
  }));
  f.spot('beside', null, -.3, 0, .3, { maxH: .3, label: '사다리 옆', scale: .7 });
};

// ── fix1029 32~40판 허접한 모델 다시 (19판 이상) ──
// (fix1029 허브 10/29 사용자 "1~18판은 완벽하니 건들지 말고 19부터": 아래 새 모양은 19판 이상에서만 — scenes/stage.js가 방을 짓기 전에
// 판 번호를 globalThis.__sbkStage에 둠(⑩ gate19 패치). 1~18판은 원래 빌더 그대로)
const late19 = () => (globalThis.__sbkStage ?? -1) >= 18;
const readingnookLate = (f, T) => {
  const h = .5, x0 = -1, x1 = 1, z0 = -1.5, z1 = .55;
  // (fix1029 32~40 훑기 — 37판: 방석이 납작한 원판, 바구니가 상자, 단 앞판·계단이 민 덩어리) the platform's front in framed
  // panels with a painted row of book spines, plank ends and a pale nosing; the stair with nosed treads and a blue runner; turned
  // balusters and a round handrail with ball-capped newels; plump square floor cushions with piping and a tufting button, a knit
  // throw over the rail, a wicker basket of books, a stack of books with a mug on top, a reading lamp with a pleated shade
  f.add(mc('readingnook2', ({ add, tube }) => {
    const NOSE = '#f0d3a8', RUN = BLUE2;
    add(G.box(x1 - x0, h, z1 - z0, .03), WOODD, 0, h / 2, (z0 + z1) / 2);
    add(G.box(x1 - x0 - .02, .04, z1 - z0 - .02, .01), WOOD, 0, h + .02, (z0 + z1) / 2);
    for (let k = 0; k < 5; k++) add(G.pbox(.012, .005, z1 - z0 - .04), shade(WOOD, -.08), x0 + .2 + k * .4, h + .042, (z0 + z1) / 2);
    add(G.box(x1 - x0 + .04, .05, .07, .015), NOSE, 0, h + .015, z1 + .01);
    add(G.box(.07, .05, z1 - z0 + .04, .015), NOSE, x1 + .01, h + .015, (z0 + z1) / 2);
    add(G.box(x1 - x0 - .7, h - .1, .03, .01), BLUE, .35, h / 2 - .02, z1 + .01);
    for (const [cx, w] of [[-.02, .5], [.6, .5]]) {
      add(G.box(w, h - .2, .015, .008), shade(BLUE, .12), cx, h / 2 - .03, z1 + .03);
      let x = cx - w / 2 + .04;
      for (let k = 0; x < cx + w / 2 - .06; k++) { const bw = .04 + (k % 3) * .012, bh = .16 + ((k * 5) % 4) * .025; add(G.box(bw, bh, .008, .003), SPINES[(k + (cx > 0 ? 3 : 0)) % SPINES.length], x + bw / 2, .14 + bh / 2, z1 + .04); x += bw + .012; }
    }
    add(G.box(.04, h - .1, .03, .008), WOODD, -.3, h / 2 - .02, z1 + .025);
    add(G.box(.03, h - .1, z1 - z0 - .08, .01), BLUE, x1 + .01, h / 2 - .02, (z0 + z1) / 2);
    for (const z of [-1.0, -.2]) add(G.box(.015, h - .2, .55, .008), shade(BLUE, .12), x1 + .03, h / 2 - .03, z);
    for (let k = 0; k < 3; k++) {
      const sh = h * (3 - k) / 3, sz = z1 + .15 + k * .3;
      add(G.box(.7, sh, .3, .02), WOOD, x0 + .4, sh / 2, sz);
      add(G.box(.74, .035, .06, .012), NOSE, x0 + .4, sh - .005, sz + .13);
      add(G.box(.36, .012, .28, .004), RUN, x0 + .4, sh + .003, sz);
      add(G.box(.36, sh - .06, .008, .003), RUN, x0 + .4, (sh - .06) / 2 + .02, sz + .153);
      for (const sx of [-1, 1]) add(G.cyl(.008, .008, .38, 6), '#c9a24a', x0 + .4 + sx * .19, sh + .012, sz + .12, 0, 0, HP);
    }
    const BAL = (x, z) => { add(G.cyl(.016, .016, .4, 8), WOOD, x, h + .25, z); add(G.sph(.026, 8, 6), WOOD, x, h + .16, z); add(G.sph(.022, 8, 6), WOOD, x, h + .36, z); };
    const NEWEL = (x, z) => { add(G.box(.08, .56, .08, .015), WOODD, x, h + .28, z); add(G.sph(.055, 10, 8), WOOD, x, h + .6, z); add(G.box(.1, .03, .1, .01), WOODD, x, h + .54, z); };
    for (const z of [z0 + .05, z1 - .05]) NEWEL(x1 - .05, z);
    NEWEL(.2, z1 - .05);
    tube([x1 - .05, h + .5, z0 + .05], [x1 - .05, h + .5, z1 - .05], .028, WOOD, 10);
    tube([.2, h + .5, z1 - .05], [x1 - .05, h + .5, z1 - .05], .028, WOOD, 10);
    tube([x1 - .05, h + .07, z0 + .05], [x1 - .05, h + .07, z1 - .05], .018, WOODD, 6);
    tube([.2, h + .07, z1 - .05], [x1 - .05, h + .07, z1 - .05], .018, WOODD, 6);
    for (let k = 0; k < 8; k++) BAL(x1 - .05, z0 + .27 + k * .23);
    for (let k = 0; k < 3; k++) BAL(.38 + k * .18, z1 - .05);
    // a knit throw folded over the east rail, its fringe hanging down
    add(G.box(.06, .05, .5, .02), '#ffb3c4', x1 - .05, h + .53, -.95);
    for (const sx of [-1, 1]) { add(G.box(.025, .3, .5, .012), '#ffb3c4', x1 - .05 + sx * .045, h + .38, -.95); for (let k = 0; k < 4; k++) add(G.pbox(.026, .02, .5), k % 2 ? '#ffffff' : '#ff9fb5', x1 - .05 + sx * .046, h + .26 + k * .07, -.95); for (let k = 0; k < 7; k++) add(G.box(.01, .05, .01, .002), '#ffb3c4', x1 - .05 + sx * .05, h + .21, -1.17 + k * .073); }
    // the green rug, fringed
    add(G.box(.5, .025, .34, .02), '#c9e0a8', -.55, h + .053, -.55, 0, .4, 0); for (const k of [-1, 0, 1]) add(G.box(.5, .004, .03, .002), '#a8c88a', -.55 + k * .02, h + .067, -.55 + k * .1, 0, .4, 0);
    // plump square floor cushions: piping round the edge, a tufting button, a little dent
    for (const [x, z, c, r] of [[-.45, -.9, BLUE2, .3], [-.1, -.55, '#ffd27a', -.2], [.35, -1.0, '#ffb3c4', .5]]) {
      add(G.box(.46, .13, .46, .06, 3), c, x, h + .105, z, 0, r, 0);
      add(G.tor(.25, .012, PI * 2, 4, 4), shade(c, -.12), x, h + .105, z, HP, 0, PI / 4 - r, [1.31, 1.31, 1]);
      add(G.sph(.022, 8, 6), shade(c, -.2), x, h + .172, z, 0, 0, 0, [1, .5, 1]);
    }
    // the stool with a mug (handle, steam-less) and a book on it
    add(G.cyl(.14, .12, .3, 12), WOOD, .55, h + .19, -.2); add(G.cyl(.15, .15, .04, 12), WOODD, .55, h + .36, -.2);
    for (const a of [0, 2.1, 4.2]) add(G.box(.03, .3, .03, .008), WOODD, .55 + Math.cos(a) * .12, h + .17, -.2 + Math.sin(a) * .12);
    add(G.cyl(.04, .035, .07, 10), '#ffffff', .62, h + .415, -.26); add(G.tor(.022, .007, PI * 2, 4, 10), '#ffffff', .665, h + .415, -.26, 0, 0, 0);
    add(G.cyl(.032, .032, .005, 10), '#a8733f', .62, h + .447, -.26);
    // a wicker basket of books (woven bands, two handles), books standing in it
    add(G.cyl(.17, .14, .17, 14), '#d9a466', -.65, h + .1, -.25);
    for (const y of [.05, .1, .15]) add(G.tor(.155 + y * .1, .01, PI * 2, 4, 16), '#b98a4f', -.65, h + .02 + y, -.25, HP, 0, 0);
    for (const sx of [-1, 1]) add(G.tor(.05, .012, PI, 4, 8), '#b98a4f', -.65 + sx * .17, h + .19, -.25, 0, HP, 0);
    books(add, -.76, h + .12, -.25, 4, 3, .16);
    // a stack of books by the wall, a pencil on top
    for (let k = 0; k < 4; k++) add(G.box(.26 - k * .02, .045, .19, .008), SPINES[(k * 3 + 1) % SPINES.length], .55, h + .06 + k * .046, -1.3, 0, k * .2 - .15, 0);
    add(G.cyl(.006, .006, .16, 6), '#ffd23f', .55, h + .25, -1.3, HP, .7, 0);
    // the reading lamp: a weighted foot, a brass stem with an elbow, a pleated cream shade glowing
    add(G.cyl(.08, .09, .03, 14), '#c9a24a', -.85, h + .055, -1.3); add(G.cyl(.012, .012, .5, 6), '#c9a24a', -.85, h + .32, -1.3);
    tube([-.85, h + .57, -1.3], [-.7, h + .66, -1.2], .011, '#c9a24a', 6);
    add(G.cyl(.06, .13, .15, 12, true), '#ffe08a', -.66, h + .62, -1.17); add(G.sph(.035, 8, 6), '#fff6cf', -.66, h + .58, -1.17);
    for (const [y, r] of [[.545, .13], [.695, .06]]) add(G.tor(r, .01, PI * 2, 4, 16), '#f2c45a', -.66, h + y, -1.17, HP, 0, 0);
  }));
  f.spot('under', null, -.1, h + .06, -.55, { maxH: .1, label: '방석 밑', scale: .55 });
  f.spot('on', null, .55, h + .38, -.2, { maxH: .2, label: '다락 의자 위', scale: .55 });
  f.spot('behind', null, -.45, h + .04, -1.25, { maxH: .3, label: '다락 구석', scale: .7 });
  f.spot('under', null, x0 + .4, 0, z1 + .62, { maxH: .15, label: '계단 밑', scale: .55 });
};
{ const old = B.readingnook; B.readingnook = (f, T, o) => (late19() ? readingnookLate(f, T, o) : old(f, T, o)); }

// (fix1029 3차 — 37판 돌려 보면 낮은 책장 뒤·사서 책상 뒤가 민 판) the low shelves' backs: plank seams, a call-number card in a brass
// holder, a child's drawing taped on; the desk's back: three cubbies (stamped return slips in a tray, a tote bag, a box of
// labels) and a kick plate
{ const old = B.libshelf; B.libshelf = (f, T, o = {}) => {
  old(f, T, o);
  if (!late19()) return;
  const s = o.seed || 1, ART = ['#ffd27a', '#bfe0f5', '#ffb3c4'][s % 3];
  f.add(mc('libshelf-back|' + s, ({ add }) => {
    const z = -.196;
    for (const x of [-.21, 0, .21]) add(G.box(.008, .82, .006, .002), shade(WOODD, -.2), x, .45, z);
    add(G.box(.2, .09, .008, .004), '#c9a24a', 0, .74, z - .002); add(G.box(.17, .065, .006, .002), '#fbf3e4', 0, .74, z - .006);
    for (const [y, w] of [[.755, .12], [.73, .08]]) add(G.pbox(w, .008, .003), DARK, 0, y, z - .01);
    add(G.box(.26, .2, .004, .002), '#fbf3e4', (s % 2 ? -.2 : .2), .4, z - .002, 0, 0, (s % 2 ? .06 : -.05));
    add(G.box(.12, .1, .003, .001), ART, (s % 2 ? -.2 : .2), .4, z - .006, 0, 0, (s % 2 ? .06 : -.05));
    add(G.sph(.03, 8, 6), '#ffe27a', (s % 2 ? -.17 : .23), .44, z - .008, 0, 0, 0, [1, 1, .2]);
    for (const sx of [-1, 1]) add(G.box(.06, .02, .004, .002), '#f2e2b0', (s % 2 ? -.2 : .2) + sx * .11, .5, z - .006, 0, 0, sx * .5);
  }));
}; }
{ const old = B.libdesk; B.libdesk = (f, T, o) => {
  old(f, T, o);
  if (!late19()) return;
  f.add(mc('libdesk-back', ({ add }) => {
    const z = -.2;
    add(G.box(1.7, .06, .02, .01), WOODD, 0, .05, z - .005);
    for (const x of [-.78, -.3, .2, .78]) add(G.box(.04, .5, .03, .008), WOODD, x, .4, z - .01);
    add(G.box(1.6, .03, .03, .008), WOODD, 0, .66, z - .01); add(G.box(1.6, .03, .03, .008), WOODD, 0, .15, z - .01);
    add(G.box(.44, .48, .01, .004), shade(WOOD, -.18), -.54, .4, z - .002); add(G.box(.46, .48, .01, .004), shade(WOOD, -.18), -.05, .4, z - .002); add(G.box(.54, .48, .01, .004), shade(WOOD, -.18), .49, .4, z - .002);
    add(G.box(.34, .05, .2, .008), '#8fa9d4', -.54, .2, z - .1); for (let k = 0; k < 5; k++) add(G.box(.28, .006, .16, .002), k % 2 ? '#fbf3e4' : '#ffe9c2', -.54, .23 + k * .008, z - .1, 0, k * .04, 0);
    add(G.box(.3, .3, .1, .04), '#e88a5c', -.05, .32, z - .06); for (const sx of [-1, 1]) add(G.tor(.06, .012, PI, 4, 10), '#c96a40', -.05 + sx * .08, .47, z - .06); add(G.box(.12, .1, .006, .003), '#fbf3e4', -.05, .3, z - .113);
    add(G.box(.3, .18, .26, .015), '#d7b07c', .49, .25, z - .14); add(G.pbox(.31, .03, .27), '#f1d79e', .49, .3, z - .14);
    for (let k = 0; k < 3; k++) add(G.box(.08, .05, .02, .004), ['#d9534f', '#5aa88a', '#e8b04a'][k], .4 + k * .09, .36, z - .2, -.3, 0, 0);
  }));
}; }
export const LIBRARY_BUILDERS = B;
export const LIBRARY_INFO = {
  readingnook: { w: 2, d: 3, name: '독서 다락', price: 520, region: 'apt' },
  archwindow: { wall: true, span: 2, name: '아치 창', price: 220, region: 'apt' },
  libshelf: { w: 1, d: 1, name: '낮은 책장', price: 140, region: 'apt' },
  readtable: { w: 2, d: 1, name: '열람 책상', price: 260, region: 'apt' },
  libdesk: { w: 2, d: 1, name: '사서 책상', price: 280, region: 'apt' },
  bookdrop: { w: 1, d: 1, name: '반납함', price: 160, region: 'apt' },
  bookcart: { w: 1, d: 1, name: '책 수레', price: 120, region: 'apt' },
  libladder: { w: 1, d: 1, name: '책장 사다리', price: 160, region: 'apt' },
};

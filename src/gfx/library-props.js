// 동네 도서관 (10/21, 17판 새 맵 — 고른 그림 library-a, 흑백 판): a split-level library. Up a short stair at the back left,
// a reading nook on a platform with cushions and a railing; below, low bookshelves, a reading table under green
// banker's lamps, the librarian's desk, a book drop and a book cart. Warm wood, cream and a dusty blue.
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const WOOD = '#d9a466', WOODD = '#a8733f', BLUE = '#5f7fae', BLUE2 = '#8fa9d4', CREAM = '#fbf3e4', GREEN = '#4f9a6a', LEAF = '#6cbf5a', LEAF2 = '#4fa64f', DARK = '#3a3048';
const SPINES = ['#d9534f', '#4f7fc7', '#e8b04a', '#5aa88a', '#8f6cc4', '#e88a5c', '#f2e2c4'];
const B = {};
// a row of book spines along x from x0, n books, on a shelf at y, depth z
const books = (add, x0, y, z, n, seed = 1, h = .22) => { let x = x0; for (let k = 0; k < n; k++) { const w = .045 + ((k * 7 + seed) % 3) * .012, hh = h * (.82 + ((k * 5 + seed) % 4) * .06); add(G.box(w, hh, .17, .006), SPINES[(k + seed) % SPINES.length], x + w / 2, y + hh / 2, z); x += w + .006; } };

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
    books(add, -.38, .04, .02, 9, s); books(add, -.38, .46, .02, 8, s + 3);
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
    for (const [x, z, r] of [[-.45, -.6, 0], [.45, -.6, 0], [-.45, .6, PI], [.45, .6, PI]]) {
      add(G.box(.38, .05, .36, .01), WOOD, x, .45, z);
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
    add(G.box(.62, 1.0, .5, .05), '#f4efe6', 0, .5, -.02);
    add(G.box(.42, .05, .02, .005), DARK, 0, .82, .235); add(G.box(.2, .12, .02, .005), '#d9534f', 0, .66, .235);
    add(G.box(.66, .05, .54, .02), shade('#f4efe6', -.08), 0, 1.02, -.02);
  }));
  const dv = grp(); put(dv, -.27, .1, .24); f.add(dv);
  dv.add(mc('bookdrop-door', ({ add }) => { add(G.box(.54, .4, .025, .01), '#e9e3d8', .27, .2, 0); add(G.box(.08, .03, .03, .01), '#a9b0c2', .48, .2, .02); }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.5 * t; }, { label: '반납함 문', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, 0, .12, 0, { part: p, maxH: .3, label: '반납함 안', scale: .7 }), .26, { w: .28 });
};

// 책 수레 (1×1): a white wire book cart on castors, two shelves of returned books
B.bookcart = (f, T) => {
  f.add(mc('bookcart', ({ add, tube }) => {
    for (const y of [.2, .55]) add(G.box(.6, .03, .36, .01), '#e9e4ec', 0, y, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { tube([sx * .29, .06, sz * .17], [sx * .29, .78, sz * .17], .015, '#c9cfe0', 6); add(G.sph(.04, 8, 6), '#4a4458', sx * .29, .04, sz * .17); }
    tube([-.29, .78, -.17], [.29, .78, -.17], .015, '#c9cfe0', 6); tube([-.29, .78, .17], [.29, .78, .17], .015, '#c9cfe0', 6);
    books(add, -.26, .215, 0, 9, 2); books(add, -.26, .565, 0, 8, 5);
  }));
  f.spot('on', null, 0, .22, .02, { maxH: .26, label: '책 수레 아래 칸', scale: .6 });
};

// 책장 사다리 (1×1, 3차): a rolling library ladder leaning on the tall shelves, a brass rail along the top, a stool at its foot
B.libladder = (f, T) => {
  f.add(mc('libladder', ({ add, tube }) => {
    add(G.cyl(.018, .018, 1.0, 8), '#c9a24a', 0, 1.95, -.38, 0, 0, HP);
    for (const sx of [-1, 1]) tube([sx * .2, .05, .3], [sx * .2, 1.95, -.32], .028, WOODD, 6);
    for (let k = 1; k < 8; k++) { const t = k / 8; add(G.box(.42, .035, .06, .01), WOOD, 0, .05 + 1.9 * t, .3 - .62 * t); }
    for (const sx of [-1, 1]) add(G.cyl(.04, .04, .04, 10), DARK, sx * .2, .03, .3, HP, 0, 0);
    add(G.cyl(.15, .15, .05, 14), WOOD, .3, .35, .32); for (const a of [0, 2.1, 4.2]) add(G.box(.03, .34, .03, .01), WOODD, .3 + Math.cos(a) * .1, .17, .32 + Math.sin(a) * .1);
  }));
  f.spot('beside', null, -.3, 0, .3, { maxH: .3, label: '사다리 옆', scale: .7 });
};

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

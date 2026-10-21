// 호수 섬 낚시터 (10/20, the new 4판 — 레벨 plan-stages-1to20-v2: 3판's fishing ground made again as a little island in a
// lake, the second half of 개굴이's train trip). What is new here: the big tree (roots, a hollow with a round door), the
// deck that runs out over the water with 개굴이's champion chair at its end, a rowboat pulled up on the sand, a pile of
// rocks. The rod, tackle box, bait, cooler and reeds are the fishing ground's own (fishing-props.js).
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const WOOD = '#d9a466', WOODD = '#a8733f', BARK = '#8b5e4a', BARKD = '#6e4636', LEAF = '#7fcf6a', LEAF2 = '#5cb45a', LEAF3 = '#9fdc7a',
  STONE = '#c9c2d8', STONE2 = '#b1a9c4', DARK = '#3a3048', YEL = '#ffd23f', RED = '#ff5d6c';
const B = {};

// 큰 나무 (2×2): a wide old tree — roots spread on the grass, a hollow in the trunk behind a little round door, a broad
// canopy in three greens
B.bigtree = (f, T) => {
  const tx = -.15, tz = -.25;
  f.add(mc('bigtree-trunk', ({ add, tube }) => {
    add(G.cyl(.26, .4, 1.7, 18), BARK, tx, .85, tz);
    tube([tx, 1.4, tz], [tx - .7, 2.05, tz + .1], .12, BARK, 8, .07); tube([tx, 1.5, tz], [tx + .65, 2.15, tz - .1], .12, BARK, 8, .07);
    tube([tx, 1.6, tz], [tx + .1, 2.35, tz + .45], .1, BARK, 8, .06);
    for (const [a, L] of [[.3, .8], [1.4, .7], [2.6, .75], [3.8, .6], [5.0, .8]]) tube([tx + Math.sin(a) * .2, .3, tz + Math.cos(a) * .2], [tx + Math.sin(a) * L, .02, tz + Math.cos(a) * L], .13, BARK, 8, .05);
    // bark lines
    for (const a of [-.5, .1, .6]) add(G.box(.025, .5, .02, .008), BARKD, tx + Math.sin(a) * .3, 1.1 + a * .2, tz + Math.cos(a) * .3, 0, a, 0);
    // the hollow's dark mouth on the front
    add(G.cyl(.15, .15, .06, 18), '#2b2233', tx, .62, tz + .33, HP, 0, 0, [1, 1, 1.25]);
    add(G.tor(.15, .03, PI * 2, 6, 20), BARKD, tx, .62, tz + .36, 0, 0, 0, [1, 1.25, 1]);
  }));
  // the crown: a big cauliflower of greens (island C안 — it takes the top of the picture), a lighter top on each lump
  // the crown (수정 10/21, island C안): many smaller flattened lumps in three greens — deeper underneath, pale on top — so it
  // reads as leafy clusters like the picture, not a few balls
  f.add(mc('bigtree-canopy2', ({ add }) => {
    const R = n => ((Math.sin(n * 77.3) * 4375.5) % 1 + 1) % 1, F = [1.25, .75, 1.15];
    const centers = [[0, 2.85, -.25, 1.0], [-1.0, 2.6, .05, .75], [1.0, 2.7, -.35, .8], [.1, 3.5, -.3, .8], [-.6, 3.2, .45, .6], [.7, 3.3, .35, .6], [.35, 2.5, .7, .55], [-1.1, 3.0, -.45, .5]];
    let k = 0;
    for (const [cx, cy, cz, cr] of centers) for (let q = 0; q < 8; q++, k++) {
      const a = R(k) * PI * 2, rr = cr * (.2 + R(k + 7) * .7), x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, y = cy + (R(k + 3) - .45) * cr * .5, r = .26 + R(k + 5) * .14;
      add(G.sph(r * 1.05, 10, 7), LEAF2, x, y - r * .22, z, 0, 0, 0, F); add(G.sph(r, 10, 7), LEAF, x, y, z, 0, 0, 0, F); add(G.sph(r * .66, 8, 6), LEAF3, x + r * .12, y + r * .26, z + r * .12, 0, 0, 0, F);
    }
  }));
  // a branch out to the right with a rope swing under it
  f.add(mc('bigtree-swing', ({ add, tube }) => {
    tube([tx + .2, 1.75, tz + .1], [tx + 1.25, 1.95, tz + .45], .09, BARK, 8, .06);
    for (const dz of [-.14, .14]) { tube([tx + .95, 1.9, tz + .38 + dz], [tx + .95, .55, tz + .38 + dz], .012, '#e9d9b8', 4); add(G.tor(.04, .015, PI * 2, 4, 10), '#e9d9b8', tx + .95, 1.9, tz + .38 + dz, 0, HP, 0); }
    add(G.box(.22, .045, .42, .012), WOOD, tx + .95, .53, tz + .38);
  }));
  f.spot('on', null, tx + .95, .56, tz + .38, { maxH: .24, label: '그네 위', scale: .7 });
  // the round door of the hollow, hinged on its left
  const dv = grp(); put(dv, tx - .15, .62, tz + .39); f.add(dv);
  dv.add(mc('bigtree-door', ({ add }) => {
    add(G.cyl(.14, .14, .04, 18), WOOD, .15, 0, 0, HP, 0, 0, [1, 1, 1.25]);
    for (const x of [.08, .15, .22]) add(G.pbox(.012, .3, .012), WOODD, x, 0, .022);
    add(G.sph(.022, 8, 6), YEL, .25, 0, .03);
  }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.6 * t; }, { label: '나무 구멍 문', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, tx, .5, tz + .22, { part: p, maxH: .22, label: '나무 구멍 안', scale: .6 }), tz + .39, { w: .24, d: .2 });
  f.spot('behind', null, tx + .55, 0, tz + .5, { maxH: .22, label: '큰 나무 뿌리 사이', scale: .7 });
  f.spot('behind', null, tx - .3, 0, tz - .6, { maxH: .45, label: '큰 나무 뒤', scale: .85 });
};

// 데크 (2×1): planks on posts running out over the water past the island's edge, rope round the posts; at its far end
// the champion seat — a wooden chair with a green check cushion — a picnic blanket with a basket, and the rowboat tied
// alongside, floating (island C안)
B.lakedeck = (f, T) => {
  const x0 = -.95, x1 = 2.25, y = .14, L = x1 - x0, xc = (x0 + x1) / 2;
  f.add(mc('lakedeck', ({ add }) => {
    for (let k = 0; k < 6; k++) add(G.box(L, .05, .15, .01), k % 2 ? WOOD : shade(WOOD, .05), xc, y, -.4 + k * .16);
    add(G.box(L, .06, .06, .01), WOODD, xc, y - .05, -.44); add(G.box(L, .06, .06, .01), WOODD, xc, y - .05, .44);
    for (const x of [.4, 1.3, 2.2]) for (const z of [-.44, .44]) {
      add(G.cyl(.065, .065, x > 1 ? 1.0 : .7, 10), WOODD, x, y - .3 + (x > 1 ? .15 : 0), z);
      if (x > 1) add(G.tor(.07, .018, PI * 2, 6, 14), '#e9d9b8', x, y + .2, z, HP, 0, 0);
    }
  }));
  f.add(mc('lakedeck-chair', ({ add, tube }) => {
    const cx = 1.75, cz = -.2, CK = '#bfe0b8';
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.024, .024, .3, 6), WOODD, cx + sx * .17, y + .16, cz + sz * .16);
    add(G.box(.44, .05, .42, .015), WOOD, cx, y + .32, cz);
    add(G.box(.4, .05, .38, .03), CK, cx, y + .37, cz);
    for (let k = 0; k < 3; k++) add(G.pbox(.4, .006, .03), '#ffffff', cx, y + .4, cz - .12 + k * .12);
    add(G.box(.05, .5, .42, .015), WOOD, cx - .21, y + .6, cz); add(G.box(.03, .36, .32, .02), CK, cx - .18, y + .62, cz);
    tube([cx - .23, y + .82, cz + .19], [cx - .23, y + 1.25, cz + .19], .012, DARK, 6);
    add(G.cone(.09, .2, 3), YEL, cx - .23, y + 1.17, cz + .28, HP, 0, 0, [1, 1, .3]);
    // the picnic blanket
    add(G.box(.62, .015, .5, .005), '#ff9fb0', .9, y + .035, .1);
    for (let k = 0; k < 4; k++) { add(G.pbox(.62, .004, .04), '#ffffff', .9, y + .045, -.08 + k * .12); add(G.pbox(.04, .004, .5), '#ffffff', .66 + k * .16, y + .046, .1); }
  }));
  // the basket: its lid lifts
  f.add(mc('lakedeck-basket', ({ add }) => {
    add(G.box(.3, .18, .22, .03), '#d9a466', .95, y + .12, .12);
    for (let k = 0; k < 3; k++) add(G.pbox(.31, .012, .23), '#b98a4e', .95, y + .06 + k * .05, .12);
    add(G.tor(.12, .014, PI, 4, 12), '#b98a4e', .95, y + .21, .12, 0, 0, 0);
  }));
  const lid = grp(); put(lid, .95, y + .215, .01); f.add(lid);
  lid.add(mc('lakedeck-basket-lid', ({ add }) => add(G.box(.31, .03, .23, .015), '#e9b97c', 0, .015, .11)));
  const p = f.part('lift', lid, t => { lid.rotation.x = -1.3 * t; }, { label: '피크닉 바구니', sfx: 'lift', dur: .28 });
  f.pullOut(p, f.spot('inside', null, .95, y + .06, .12, { part: p, maxH: .14, label: '피크닉 바구니 안', scale: .6 }), 0, { w: .24, d: .18, up: .16 });
  // the boat, tied at the deck's end, afloat (the lake is .3 down)
  f.add(mc('lakedeck-boat', ({ add, tube }) => {
    const bx = 1.55, bz = 1.05, by = -.3, HULL = '#c9844e';
    const bowl = r => new THREE.SphereGeometry(r, 20, 8, 0, PI * 2, HP, HP);
    add(bowl(.5), HULL, bx, by + .22, bz, 0, 0, 0, [1.7, .7, .6]);
    add(G.cyl(.46, .46, .03, 24), shade(HULL, .3), bx, by + .12, bz, 0, 0, 0, [1.6, 1, .53]);
    add(G.cyl(.47, .47, .08, 24, true), shade(HULL, .15), bx, by + .18, bz, 0, 0, 0, [1.66, 1, .57]);
    add(G.tor(.5, .03, PI * 2, 6, 28), shade(HULL, -.15), bx, by + .22, bz, HP, 0, 0, [1.7, .6, 1]);
    add(G.box(.08, .04, .5, .01), WOOD, bx - .15, by + .17, bz); add(G.box(.08, .04, .5, .01), WOOD, bx + .35, by + .17, bz);
    add(G.cyl(.016, .016, 1.1, 6), WOODD, bx - .1, by + .26, bz + .1, 0, .4, HP); add(G.box(.24, .02, .09, .01), WOOD, bx - .58, by + .26, bz + .3, 0, .4, 0);
    tube([2.2, y + .1, .44], [bx + .75, by + .24, bz - .05], .012, '#e9d9b8', 4);
    add(G.box(.08, .12, .08, .02), YEL, bx + .75, by + .32, bz); add(G.box(.1, .02, .1, .01), DARK, bx + .75, by + .39, bz);
  }));
  f.spot('beside', null, 1.75, y + .03, -.2, { maxH: .2, label: '챔피언 의자 밑', scale: .7 });
  f.spot('on', null, 2.05, y + .03, .25, { maxH: .35, label: '데크 끝', scale: .75 });
  f.spot('inside', null, 1.55, -.17, 1.05, { maxH: .2, label: '보트 안', scale: .75 });
};

// 작은 보트 (2×1): a rowboat pulled up on the sand, two oars across it, a canvas cover over its bow that lifts
B.rowboat = (f, T) => {
  const HULL = '#5fa8e0', HULL2 = '#ffffff';
  f.add(mc('rowboat', ({ add }) => {
    // the hull: the lower half of a long round bowl, a darker bowl inside it, a white rim, two seats, the oars across
    const bowl = r => new THREE.SphereGeometry(r, 20, 8, 0, PI * 2, HP, HP);
    add(bowl(.5), HULL, 0, .36, 0, 0, 0, 0, [1.85, .7, .62]);
    add(G.cyl(.46, .46, .03, 24), shade(HULL, .35), 0, .25, 0, 0, 0, 0, [1.75, 1, .55]);   // its floor (a bowl is seen from outside only)
    add(G.cyl(.47, .47, .1, 24, true), shade(HULL, .2), 0, .31, 0, 0, 0, 0, [1.8, 1, .58]);
    add(G.tor(.5, .028, PI * 2, 6, 28), HULL2, 0, .37, 0, HP, 0, 0, [1.85, .62, 1]);
    add(G.box(.08, .04, .5, .01), WOOD, -.25, .3, 0); add(G.box(.08, .04, .5, .01), WOOD, .3, .3, 0);
    for (const s of [-1, 1]) { add(G.cyl(.018, .018, 1.3, 6), WOODD, -.15, .4, s * .1, 0, s * .25, HP); add(G.box(.26, .02, .1, .01), WOOD, -.76, .4, s * .1 - s * .16, 0, s * .25, 0); }
    add(G.box(.5, .06, .02, .01), WOODD, .3, .06, .3, 0, 0, .1);   // a wedge of wood under it on the sand
  }));
  // the bow cover: a canvas sheet over the front half, lifts back
  const cv = grp(); put(cv, .1, .39, 0); f.add(cv);
  cv.add(mc('rowboat-cover', ({ add }) => {
    add(new THREE.SphereGeometry(.5, 16, 6, -HP, PI, 0, .5), '#f0c869', .0, -.05, 0, 0, 0, 0, [1.55, .5, .62]);
    add(G.tor(.3, .012, PI, 4, 14), shade('#f0c869', .25), .35, .0, 0, HP, 0, HP);
  }));
  const p = f.part('lift', cv, t => { cv.rotation.z = 1.4 * t; }, { label: '보트 덮개', sfx: 'lift', dur: .32 });
  f.spot('inside', null, .45, .14, 0, { part: p, maxH: .2, label: '보트 안', scale: .75 });
};

// 바위 (1×1): three stones leaning together, a dark gap between them
B.rocks = (f, T) => {
  f.add(mc('rocks', ({ add }) => {
    add(G.sph(.32, 12, 9), STONE, -.12, .2, -.1, 0, .4, 0, [1.2, .75, 1]);
    add(G.sph(.24, 12, 9), STONE2, .22, .15, -.05, 0, 1.1, 0, [1.1, .8, 1]);
    add(G.sph(.18, 10, 8), STONE, .02, .11, .25, 0, .2, 0, [1.3, .7, 1]);
    add(G.sph(.08, 8, 6), '#2b2233', .08, .1, .1, 0, 0, 0, [1, .9, .6]);
    for (const [x, z] of [[-.3, .2], [.3, .3]]) add(G.sph(.06, 8, 6), LEAF2, x, .05, z, 0, 0, 0, [1.3, .6, 1]);
  }));
  f.spot('behind', null, .08, .02, .12, { maxH: .18, label: '바위 틈', scale: .6 });
};

// 오두막 (2×2): a little cream cottage under a red tiled roof (island C안) — a chimney, ivy with white flowers up its front
// corner, a warm window with green shutters and a flower box, a round-topped wooden door that opens, a lantern, a
// doormat, pots and two watering cans by the door
B.cottage = (f, T) => {
  const W = 1.45, D = 1.15, H = 1.15, x0 = -.05, z0 = -.3, zf = z0 + D / 2, y0 = .1, CR = '#fbf0dc', RED2 = '#e5674f';
  f.add(mc('cottage', ({ add }) => {
    add(G.box(W + .12, .12, D + .12, .03), '#c9c2d8', x0, .06, z0);                                // stone footing
    add(G.box(W, H, D, .03), CR, x0, y0 + H / 2, z0);
    // the roof: two tiled slopes, a ridge, the gable ends
    const rh = .62, half = D / 2 + .16, slope = Math.atan2(rh, half), len = Math.hypot(rh, half);
    for (const s of [-1, 1]) {
      add(G.box(W + .3, .07, len + .05, .02), RED2, x0, y0 + H + rh / 2, z0 + s * half / 2, s * slope, 0, 0);
      for (let k = 1; k < 4; k++) add(G.box(W + .31, .025, .04, .01), shade(RED2, -.14), x0, y0 + H + rh * (1 - k / 4) + .045, z0 + s * half * k / 4, s * slope, 0, 0);
    }
    add(G.box(W + .34, .08, .1, .03), shade(RED2, -.2), x0, y0 + H + rh + .02, z0);
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const h = rh * (1 - k / 5), wz = (D / 2) * (1 - k / 5) * 2; add(G.pbox(.04, rh / 5, wz), CR, x0 + s * (W / 2 - .02), y0 + H + (k + .5) * rh / 5, z0); }
    // chimney
    add(G.box(.24, .55, .24, .02), '#f2ece6', x0 + .45, y0 + H + .5, z0 - .1); add(G.box(.3, .07, .3, .02), '#d9d2e2', x0 + .45, y0 + H + .8, z0 - .1); add(G.pbox(.14, .02, .14), DARK, x0 + .45, y0 + H + .84, z0 - .1);
    // the window with shutters, a flower box under it
    add(G.box(.36, .36, .03, .02), '#ffd98a', x0 + .38, y0 + .62, zf + .01); add(G.pbox(.02, .34, .02), WOODD, x0 + .38, y0 + .62, zf + .03); add(G.pbox(.34, .02, .02), WOODD, x0 + .38, y0 + .62, zf + .03);
    for (const s of [-1, 1]) add(G.box(.14, .4, .03, .015), '#5aa88a', x0 + .38 + s * .27, y0 + .62, zf + .02);
    add(G.box(.44, .1, .12, .02), WOODD, x0 + .38, y0 + .38, zf + .07);
    for (let k = 0; k < 5; k++) add(G.sph(.05, 8, 6), k % 2 ? '#ffffff' : '#ff9ec2', x0 + .2 + k * .09, y0 + .46, zf + .08);
    // (섬 3차 10/21, 사용자 확대 화면 "디테일 부족"): the sides are not bare any more — a shuttered window on the east wall with a
    // pot on its sill, a small round window high in the back wall
    add(G.box(.03, .34, .32, .02), '#ffd98a', x0 + W / 2 + .01, y0 + .66, z0 + .05); add(G.pbox(.02, .32, .02), WOODD, x0 + W / 2 + .03, y0 + .66, z0 + .05); add(G.pbox(.02, .02, .3), WOODD, x0 + W / 2 + .03, y0 + .66, z0 + .05);
    for (const s of [-1, 1]) add(G.box(.03, .38, .12, .015), '#5aa88a', x0 + W / 2 + .02, y0 + .66, z0 + .05 + s * .24);
    add(G.box(.12, .06, .4, .02), WOODD, x0 + W / 2 + .07, y0 + .45, z0 + .05); add(G.cyl(.06, .05, .08, 10), '#d98b5f', x0 + W / 2 + .08, y0 + .52, z0 + .12); add(G.sph(.065, 8, 6), LEAF2, x0 + W / 2 + .08, y0 + .59, z0 + .12);
    add(G.cyl(.13, .13, .03, 16), '#ffd98a', x0 - .25, y0 + H - .25, z0 - D / 2 - .01, HP, 0, 0); add(G.tor(.13, .022, PI * 2, 4, 18), WOODD, x0 - .25, y0 + H - .25, z0 - D / 2 - .02);
    // the door: a dark arch behind it, a doormat, a lantern
    add(G.box(.42, .64, .02, .02), '#3a2f3e', x0 - .3, y0 + .32, zf + .005); add(G.cyl(.21, .21, .02, 16, false), '#3a2f3e', x0 - .3, y0 + .64, zf + .005, HP, 0, 0);
    add(G.box(.42, .02, .26, .01), '#c9a46a', x0 - .3, .13, zf + .18);
    add(G.box(.04, .12, .12, .01), DARK, x0 + .02, y0 + .85, zf + .07); add(G.box(.1, .14, .1, .03), YEL, x0 + .02, y0 + .76, zf + .14);
    // ivy up the front-left corner, white flowers in it
    for (let k = 0; k < 11; k++) { const yy = y0 + .1 + k * .13, xx = x0 - W / 2 + .06 + Math.sin(k * 1.7) * .05; add(G.sph(.075, 8, 6), k % 2 ? LEAF : LEAF2, xx, yy, zf + .04, 0, 0, 0, [1.2, .8, .6]); if (k % 3 === 1) add(G.sph(.03, 6, 5), '#ffffff', xx + .04, yy + .03, zf + .09); }
    for (let k = 0; k < 4; k++) add(G.sph(.07, 8, 6), LEAF, x0 - W / 2 + .15 + k * .12, y0 + H + .08 + k * .05, zf + .04 - k * .07, 0, 0, 0, [1.2, .7, 1]);
    // pots and two watering cans by the door
    for (const [x, z, r] of [[.82, .15, .1], [.82, -.12, .08]]) { add(G.cyl(r, r * .8, r * 1.3, 12), '#d98b5f', x0 + x, .1 + r * .65, zf + z); add(G.sph(r * 1.1, 10, 7), LEAF2, x0 + x, .1 + r * 1.5, zf + z); }
    for (const [x, c] of [[.55, '#b9a27f'], [.38, '#d9a466']]) { add(G.cyl(.08, .09, .16, 12), c, x0 + x, .18, zf + .35); add(G.cyl(.012, .02, .16, 6), c, x0 + x + .12, .24, zf + .35, 0, 0, -.9); }
  }));
  const dv = grp(); put(dv, x0 - .51, y0, zf + .02); f.add(dv);
  dv.add(mc('cottage-door', ({ add }) => {
    add(G.box(.42, .62, .04, .02), '#b97f4c', .21, .31, 0); add(G.cyl(.21, .21, .04, 16, false, ), '#b97f4c', .21, .62, 0, HP, 0, 0, [1, 1, 1]);
    for (const x of [.11, .21, .31]) add(G.pbox(.012, .7, .012), '#8f5f35', x, .38, .022);
    add(G.sph(.03, 8, 6), YEL, .35, .36, .03);
  }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.6 * t; }, { label: '오두막 문', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, x0 - .3, .12, z0 + .05, { part: p, maxH: .4, label: '오두막 안', scale: .85 }), zf);
  f.spot('beside', null, x0 + .82, .1, zf + .4, { maxH: .22, label: '화분 옆', scale: .65 });
  f.spot('on', null, x0 + .38, y0 + .44, zf + .08, { maxH: .12, label: '창가 꽃상자', scale: .5 });
};

// 등대 작은 섬 (1×1 at the shore, island D안): a wooden rope bridge from this cell out over the water to a little rock islet
// with a white lighthouse (its lamp lit, a red cap, a round door that opens), a barrel, a pot of hydrangeas, a lantern post
B.islet = (f, T) => {
  const ix = -2.5, iz = -.55, BR = '#c8a074';
  f.add(mc('islet', ({ add, tube }) => {
    // the bridge: planks on a gentle arch, rope rails on posts
    for (let k = 0; k <= 8; k++) { const t = k / 8, x = -.3 + (ix + .8 + .3) * t, y = .1 + Math.sin(t * PI) * .14; add(G.box(.18, .05, .6, .01), k % 2 ? WOOD : shade(WOOD, .05), x, y, iz * t, 0, 0, 0); }
    for (const t of [0, .5, 1]) for (const s of [-1, 1]) { const x = -.3 + (ix + 1.1) * t, z = iz * t + s * .3; add(G.cyl(.04, .04, .5, 8), WOODD, x, .2 + Math.sin(t * PI) * .14, z); }
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const t0 = k / 2, t1 = (k + 1) / 2; tube([-.3 + (ix + 1.1) * t0, .42 + Math.sin(t0 * PI) * .14, iz * t0 + s * .3], [-.3 + (ix + 1.1) * t1, .42 + Math.sin(t1 * PI) * .14, iz * t1 + s * .3], .014, '#e9d9b8', 4); }
    // the islet: a ring of boulders round a green top
    add(G.cyl(.85, .9, .5, 18), '#a98060', ix, -.25, iz);
    add(G.cyl(.86, .86, .06, 18), '#8fd46a', ix, .02, iz);
    for (let k = 0; k < 11; k++) { const a = k / 11 * PI * 2, s = .26 + (k % 3) * .06; add(G.sph(1, 10, 7), k % 2 ? STONE : STONE2, ix + Math.cos(a) * .85, -.12, iz + Math.sin(a) * .85, 0, a, 0, [s * 1.3, s, s * 1.1]); if (k % 3 === 0) add(G.sph(1, 8, 5), '#8fcf6a', ix + Math.cos(a) * .85, -.12 + s * .7, iz + Math.sin(a) * .85, 0, 0, 0, [s, s * .35, s]); }
    // the lighthouse
    const lx = ix - .15, lz = iz - .15;
    add(G.cyl(.26, .33, 1.2, 18), '#fbf6ee', lx, .65, lz);
    for (const y of [.45, .9]) add(G.cyl(.3, .31, .07, 18), '#e5674f', lx, y, lz);
    add(G.cyl(.32, .32, .07, 18), '#e5674f', lx, 1.26, lz);
    add(G.cyl(.2, .2, .3, 14), '#ffd98a', lx, 1.45, lz); for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; add(G.pbox(.02, .3, .02), '#e5674f', lx + Math.cos(a) * .2, 1.45, lz + Math.sin(a) * .2); }
    add(G.cone(.28, .3, 18), '#e5674f', lx, 1.75, lz); add(G.sph(.06, 8, 6), '#e5674f', lx, 1.93, lz);
    add(G.box(.18, .26, .02, .02), '#3a2f3e', lx + .18, .22, lz + .25, 0, .6, 0);
    // a barrel, a hydrangea pot, a lantern post, cattails
    add(G.cyl(.12, .11, .26, 12), WOODD, ix + .45, .16, iz - .15); add(G.tor(.12, .01, PI * 2, 4, 14), '#6e5a4e', ix + .45, .25, iz - .15, HP, 0, 0);
    add(G.cyl(.11, .09, .14, 12), '#d98b5f', ix - .35, .1, iz + .45); for (let k = 0; k < 6; k++) add(G.sph(.06, 7, 5), k % 2 ? '#9fb3ff' : '#c39bff', ix - .35 + Math.cos(k) * .06, .24, iz + .45 + Math.sin(k) * .06);
    add(G.box(.08, .5, .08, .02), WOODD, ix + .55, .28, iz + .35); add(G.box(.12, .14, .12, .03), YEL, ix + .55, .6, iz + .35);
    for (let k = 0; k < 3; k++) { add(G.cyl(.012, .015, .6, 5), '#6aa85a', ix - .7 + k * .08, .1, iz - .5); add(G.cap(.03, .12, 2, 6), '#8b5e3c', ix - .7 + k * .08, .4, iz - .5); }
  }));
  const dv = grp(); put(dv, ix - .15 + .1, .09, iz - .15 + .29); dv.rotation.y = .6; f.add(dv);
  dv.add(mc('islet-door', ({ add }) => { add(G.box(.18, .26, .03, .02), '#ff8f7a', .09, .13, 0); add(G.sph(.02, 6, 5), YEL, .15, .13, .02); }));
  const p = f.part('door', dv, t => { dv.rotation.y = .6 - 1.4 * t; }, { label: '등대 문', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, ix - .1, .1, iz - .1, { part: p, maxH: .22, label: '등대 안', scale: .55 }), iz + .16, { w: .24, d: .2 });
  f.spot('beside', null, ix + .45, .03, iz + .1, { maxH: .22, label: '등대 섬 통 옆', scale: .6 });
  f.spot('under', null, -1.2, -.2, -.25, { maxH: .2, label: '다리 밑', scale: .6 });
};

// 피크닉 (2×2, island D안): a red-check blanket with two cushions, a mint-striped parasol, a picnic basket (its lid lifts)
// and a tree stump for a table
B.picnicset = (f, T) => {
  f.add(mc('picnicset', ({ add }) => {
    add(G.box(1.3, .015, 1.0, .005), '#ffb0a8', -.1, .01, .1);
    for (let k = 0; k < 6; k++) { add(G.pbox(1.3, .004, .06), '#ffffff', -.1, .02, -.3 + k * .17); add(G.pbox(.06, .004, 1.0), '#ffffff', -.65 + k * .22, .021, .1); }
    add(G.box(.32, .08, .28, .04), '#ffe08a', -.45, .06, -.1); add(G.box(.32, .08, .28, .04), '#9fd6c8', .05, .06, .35);
    add(G.cyl(.022, .022, 1.6, 8), '#8b5e3c', .45, .8, -.3, 0, 0, -.12);
    for (let k = 0; k < 8; k++) add(new THREE.ConeGeometry(.75, .32, 3, 1, false, k * PI / 4, PI / 4), k % 2 ? '#ffffff' : '#9fd6c8', .35, 1.6, -.3, 0, 0, -.12);
    add(G.cyl(.18, .2, .3, 14), '#c8a074', .7, .15, .55); add(G.cyl(.18, .18, .02, 14), '#e9c28e', .7, .3, .55); add(G.tor(.1, .01, PI * 2, 4, 14), '#b9895a', .7, .315, .55, HP, 0, 0);
  }));
  f.add(mc('picnicset-basket', ({ add }) => {
    add(G.box(.32, .18, .24, .03), '#d9a466', .35, .1, .05);
    for (let k = 0; k < 3; k++) add(G.pbox(.33, .012, .25), '#b98a4e', .35, .04 + k * .05, .05);
    add(G.tor(.13, .014, PI, 4, 12), '#b98a4e', .35, .2, .05);
  }));
  const lid = grp(); put(lid, .35, .195, -.07); f.add(lid);
  lid.add(mc('picnicset-lid', ({ add }) => add(G.box(.33, .03, .25, .015), '#e9b97c', 0, .015, .12)));
  const p = f.part('lift', lid, t => { lid.rotation.x = -1.3 * t; }, { label: '피크닉 바구니', sfx: 'lift', dur: .28 });
  f.pullOut(p, f.spot('inside', null, .35, .06, .05, { part: p, maxH: .14, label: '피크닉 바구니 안', scale: .6 }), 0, { w: .24, d: .18, up: .16 });
  f.spot('under', null, -.45, .02, -.1, { maxH: .1, label: '방석 밑', scale: .55 });
  f.spot('behind', null, .7, 0, .85, { maxH: .25, label: '그루터기 옆', scale: .65 });
};

export const ISLAND_BUILDERS = B;
export const ISLAND_INFO = {
  bigtree: { w: 2, d: 2, name: '큰 나무', price: 480, region: 'park' },
  lakedeck: { w: 2, d: 1, name: '호수 데크', price: 260, region: 'park' },
  rowboat: { w: 2, d: 1, name: '작은 보트', price: 300, region: 'park' },
  rocks: { w: 1, d: 1, name: '바위', price: 60, region: 'park' },
  cottage: { w: 2, d: 2, name: '호숫가 오두막', price: 560, region: 'park' },
  islet: { w: 1, d: 1, name: '등대 작은 섬', price: 600, region: 'park' },
  picnicset: { w: 2, d: 2, name: '피크닉 세트', price: 240, region: 'park' },
};

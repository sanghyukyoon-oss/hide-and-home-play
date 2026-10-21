// 개굴이의 기차역 (10/20, user: 기차역 "꼭" — 레벨 plan-stages-1to20-v2: the new 3판, "개굴이 기차 낚시 원정": 개굴이's fishing
// bag burst open on the platform, find it all before the train goes). A small country platform: the stopped train at the
// back on its track, the level crossing beside it, the ticket window and coin lockers against the station wall, a
// cherry tree over a bench, the platform tap and a timetable. Calm: a handful of motifs, room to look. Built from the
// shared toy kit (one merged mesh per piece) like the fishing ground.
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const CREAM = '#fff4e2', GREEN = '#6cc28e', GREEND = '#4f9f74', ROOF = '#cfc9dc', GLASS = '#3d4b70', GLASS2 = '#9cc9ee', STEEL = '#b9bfcf',
  STEEL2 = '#8f95a8', DARK = '#3a3048', WOOD = '#d9a466', WOODD = '#a8733f', CONC = '#ddd8e2', CONC2 = '#c5bfcd', YEL = '#ffd23f', RED = '#ff5d6c',
  PINK = '#ffc4d8', PINK2 = '#ff9ec2', BARK = '#8b5e4a';
const B = {};

// 기차 (5×1): one rounded commuter car along x, its cab at +x, the doors and windows on the platform side (+z). Under it
// the track runs on past both ends of the platform (rails, sleepers, a gravel bed), and the platform's edge — a low
// kerb with the yellow tactile strip — runs along its +z side
B.train = (f, T, o = {}) => {
  const L = 4.7, Hb = 1.3, y0 = .34, D = .86, zf = D / 2, KERB = o.kerb !== false;   // (C안: the platform is its own raised floor — no kerb)
  f.add(mc('station-track' + (KERB ? '' : '-nk'), ({ add }) => {
    const x0 = -3.6, x1 = 6.6, len = x1 - x0, xc = (x0 + x1) / 2;   // (to the map's edges on a 10-wide map, train at i 1)
    add(G.pbox(len, .03, 1.0), '#b7aea4', xc, .015, -.02);                       // gravel bed
    for (let x = x0 + .2; x < x1; x += .45) add(G.box(.14, .035, .86, .006), WOODD, x, .045, -.02);   // sleepers
    for (const z of [-.3, .26]) { add(G.pbox(len, .05, .045), STEEL2, xc, .085, z); add(G.pbox(len, .012, .06), STEEL, xc, .116, z); }
    // the platform edge: a kerb a step up from the track, white line, yellow dotted strip
    if (KERB) add(G.box(len - 1, .14, .16, .01), CONC, xc - .5, .07, .58);
    if (KERB) { add(G.pbox(len - 1, .012, .03), '#ffffff', xc - .5, .146, .52); add(G.pbox(len - 1, .012, .11), YEL, xc - .5, .146, .6);
      for (let x = x0 + .1; x < x1 - 1; x += .12) add(G.cyl(.016, .016, .01, 6), shade(YEL, .12), x, .155, .6); }
  }));
  f.add(mc('train-car', ({ add }) => {
    const xc = -.1;
    // body: green below the windows, cream above, a rounded roof
    add(G.box(L, .42, D, .08), GREEN, xc, y0 + .21, 0);
    add(G.box(L, .06, D + .02, .02), GREEND, xc, y0 + .44, 0);
    add(G.box(L + .01, .07, D + .025, .02), PINK2, xc, y0 + .58, 0);   // the pink line under the windows (the refs' pastel train)
    add(G.box(L, Hb - .5, D, .08), CREAM, xc, y0 + .47 + (Hb - .5) / 2, 0);
    add(G.box(L - .06, .16, D - .04, .08), '#efe8da', xc, y0 + Hb + .04, 0);
    for (const x of [-1.4, .2, 1.4]) add(G.box(.42, .12, .36, .04), '#bcb6c4', xc + x, y0 + Hb + .17, 0);
    add(G.box(L * .5, .05, .3, .02), STEEL2, xc - .3, y0 + Hb + .14, 0);          // roof box
    // pantograph
    add(G.box(.04, .3, .04, .01), DARK, xc - 1.2, y0 + Hb + .3, 0, 0, 0, .5); add(G.box(.04, .3, .04, .01), DARK, xc - 1.2, y0 + Hb + .3, 0, 0, 0, -.5);
    add(G.box(.6, .03, .05, .01), DARK, xc - 1.2, y0 + Hb + .38, 0);
    // windows on the platform side: rounded dark glass (no light streak — 10/21 "리플렉션 꼴보기 싫다"); two sliding doors
    const win = x => { add(G.box(.5, .4, .02, .05), GLASS, x, y0 + .86, zf + .005); };
    for (const x of [-2.05, -1.45, -.15, .45, 1.05]) win(x);
    for (const x of [-.8, 1.65]) {
      add(G.box(.52, 1.0, .02, .03), GREEND, x, y0 + .56, zf + .006);
      for (const s of [-1, 1]) add(G.box(.18, .34, .01, .03), GLASS, x + s * .12, y0 + .82, zf + .018);
      add(G.pbox(.012, .96, .012), DARK, x, y0 + .56, zf + .02);
    }
    // the cab nose at +x: a big windscreen, round headlights, a little bumper; a number plate
    const xn = xc + L / 2;
    add(G.box(.12, Hb - .1, D - .04, .06), CREAM, xn - .02, y0 + Hb / 2 + .02, 0);
    add(G.box(.04, .46, D - .22, .06), GLASS, xn + .045, y0 + .92, 0);
    for (const s of [-1, 1]) add(G.sph(.065, 12, 9), '#fff3b0', xn + .05, y0 + .3, s * .26);
    add(G.box(.06, .1, D - .1, .03), DARK, xn + .05, y0 + .08, 0);
    add(G.box(.03, .16, .3, .02), '#ffffff', xn + .06, y0 + .55, 0);
    add(G.box(.032, .05, .05, .01), GREEND, xn + .075, y0 + .55, 0);
    // the back end, plain
    add(G.box(.08, Hb - .1, D - .06, .05), CREAM, xc - L / 2 + .02, y0 + Hb / 2 + .02, 0);
    // bogies and wheels
    for (const bx of [-1.6, 1.4]) {
      add(G.box(.9, .14, D - .14, .03), DARK, bx, y0 - .04, 0);
      for (const wx of [-.28, .28]) for (const z of [-.3, .26]) add(G.cyl(.13, .13, .06, 16), '#4a4256', bx + wx, .21, z, HP, 0, 0);
    }
  }));
  // the overhead line: two masts at the ends of the platform, a wire over the track at the pantograph's height
  f.add(mc('train-catenary', ({ add }) => {
    for (const x of [-2.3, 6.1]) { add(G.cyl(.05, .06, 2.5, 10), '#9ea5b8', x, 1.25, -.62); add(G.box(.05, .05, .7, .01), '#9ea5b8', x, 2.32, -.3); }
    add(G.cyl(.01, .01, 8.4, 4), DARK, 1.9, 2.12, -.02, 0, 0, HP);
    add(G.cyl(.008, .008, 8.4, 4), DARK, 1.9, 2.3, -.02, 0, 0, HP);
    for (let x = -2; x < 6; x += 1) add(G.cyl(.006, .006, .18, 4), DARK, x, 2.21, -.02);
  }));
  // a small black paw print on the window glass by the second door (먹물이 was here — no line, just a trace)
  f.add(mc('train-paw', ({ add }) => {
    const x = 1.05 - .1, y = .34 + .8, z = .43 + .02;
    add(G.cyl(.05, .05, .006, 12), '#2a2233', x, y, z, HP, 0, 0);
    for (const [dx, dy] of [[-.05, .055], [0, .075], [.05, .055]]) add(G.cyl(.02, .02, .006, 8), '#2a2233', x + dx, y + dy, z, HP, 0, 0);
  }));
  f.spot('under', null, -2.3, 0, .36, { maxH: .2, label: '기차 앞 선로', scale: .7 });
};

// 건널목 차단기 (1×1): a striped post, the crossed warning sign, two red lamps that blink in turn, the arm lowered along
// the crossing road (the train is in), a grey signal box at its foot
B.crossing = (f, T, o = {}) => {
  const FL = o.flip ? -1 : 1, px = .28 * FL, pz = -.12;   // (flip: the arm goes west instead)
  f.add(mc('crossing-post' + (FL < 0 ? '-w' : ''), ({ add }) => {
    add(G.box(.32, .06, .32, .02), CONC2, px, .03, pz);
    for (let i = 0; i < 9; i++) add(G.cyl(.045, .045, .18, 10), i % 2 ? DARK : YEL, px, .1 + i * .18 + .09, pz);
    // crossed boards
    for (const r of [.6, -.6]) { add(G.box(.62, .1, .025, .015), YEL, px, 1.86, pz + .03, 0, 0, r); add(G.box(.56, .04, .03, .01), DARK, px, 1.86, pz + .035, 0, 0, r); }
    // lamp bar
    add(G.box(.62, .06, .06, .02), DARK, px, 1.42, pz + .02);
    for (const s of [-1, 1]) { add(G.cyl(.1, .1, .05, 16), DARK, px + s * .26, 1.42, pz + .05, HP, 0, 0); add(G.cyl(.11, .11, .015, 16, true), DARK, px + s * .26, 1.42, pz + .095, HP, 0, 0); }
    // the signal box and the arm's counterweight housing
    add(G.box(.3, .5, .26, .03), '#d9d6e2', px - .02, .25, pz + .3);
    add(G.box(.2, .06, .01, .01), YEL, px - .02, .38, pz + .432);
    add(G.box(.22, .22, .18, .03), DARK, px, .86, pz + .14);
  }));
  // the lamps: their own material each, so they can take turns (Ambient calls f.tick)
  const lens = [-1, 1].map(s => {
    const m = new THREE.MeshBasicMaterial({ color: '#7a2a33' });
    const l = new THREE.Mesh(G.cyl(.075, .075, .02, 18), m); l.rotation.x = HP; l.position.set(px + s * .26, 1.42, pz + .085); l.userData.noMerge = true; f.add(l);
    return m;
  });
  const ON = new THREE.Color('#ff3b4a'), OFF = new THREE.Color('#7a2a33');
  let last = -1;
  f.tick = t => { const k = Math.floor(t * 1.6) % 2; if (k === last) return; last = k; lens[0].color.copy(k ? ON : OFF); lens[1].color.copy(k ? OFF : ON); };
  // the arm, lowered east across the road
  f.add(mc('crossing-arm' + (FL < 0 ? '-w' : ''), ({ add }) => {
    const y = .86, L = 1.3;   // (across the crossing road, east of the post)
    for (let i = 0; i < 6; i++) add(G.box(L / 6, .07, .05, .015), i % 2 ? '#ffffff' : RED, px + FL * (.12 + (i + .5) * L / 6), y, pz + .26);
  }));
  f.spot('beside', null, -.08 * FL, 0, .32, { maxH: .3, label: '차단기 아래', scale: .8 });
};

// 벚나무 (1×1): the tree, its canopy in two pinks, a few petals fallen round it, roots you can tuck something between
B.treesakura = (f, T, o = {}) => {
  const K = o.big ? 2.0 : 1;   // (C안: the huge tree over the platform roof)
  // (자물쇠·뚜껑 10/21): only the trunk is in the way when a lid or door nearby opens — not the box round the whole crown
  f.collideBox = [-.45, 0, -.45, .45, 1.6 * K, .45];
  if (K === 1) f.add(mc('sakura-trunk', ({ add, tube }) => {
    add(G.cyl(.12 * K, .19 * K, 1.35 + (K - 1) * .8, 14), BARK, 0, (1.35 + (K - 1) * .8) / 2, 0);
    tube([0, 1.1, 0], [-.42, 1.55, .1], .06, BARK, 8, .04); tube([0, 1.15, 0], [.4, 1.62, -.05], .06, BARK, 8, .04);
    for (const a of [.5, 2.0, 3.6, 5.0]) tube([Math.sin(a) * .1, .2, Math.cos(a) * .1], [Math.sin(a) * .38, .02, Math.cos(a) * .38], .085, BARK, 8, .03);
  }));
  // the hero tree (수정 10/21, the C안 picture): a gnarled trunk that splits into four limbs, a wide crown leaning out over
  // the platform — under-lumps a shade deeper, top lumps paler, a few white highlights; lumps small and many so it reads
  // as blossom, not balls
  if (K > 1) f.add(mc('sakura-hero', ({ add, tube }) => {
    const D2 = '#7a4a38';
    add(G.cyl(.2, .34, 1.6, 12), BARK, 0, .8, 0, 0, 0, .06);
    for (const [a, L] of [[.4, .6], [2.0, .5], [3.5, .55], [5.0, .5]]) tube([Math.sin(a) * .2, .25, Math.cos(a) * .2], [Math.sin(a) * L, .02, Math.cos(a) * L], .13, BARK, 8, .05);
    const limbs = [[[.05, 1.4, 0], [-1.0, 2.35, .2], .15], [[.05, 1.45, 0], [.6, 2.45, .5], .14], [[0, 1.5, 0], [0, 2.75, -.4], .13], [[-.5, 1.9, .1], [-1.8, 2.2, -.1], .1], [[-1.0, 2.3, .2], [-2.2, 2.1, .3], .07], [[.4, 2.0, .3], [1.3, 2.35, .9], .08]];
    for (const [p0, p1, r] of limbs) tube(p0, p1, r, BARK, 8, r * .6);
    add(G.box(.04, .5, .03, .01), D2, .12, .9, .3, 0, 0, .1); add(G.box(.04, .4, .03, .01), D2, -.15, 1.1, .28, 0, 0, -.1);
    let k = 0; const R = n => ((Math.sin(n * 91.7) * 4375.5) % 1 + 1) % 1;
    // a wide, low dome leaning west over the shelter (the picture's crown is broader than tall)
    const centers = [[-1.0, 2.55, .2, .8], [.6, 2.65, .5, .75], [.0, 2.95, -.4, .8], [-.4, 3.15, .25, .7], [1.3, 2.5, .9, .55], [-1.8, 2.35, -.1, .6], [.2, 2.45, 1.05, .55], [-.9, 2.7, -.75, .55], [-2.3, 2.2, .3, .45]];
    for (const [cx, cy, cz, cr] of centers) for (let q = 0; q < 9; q++, k++) {
      const a = R(k) * PI * 2, rr = cr * (.25 + R(k + 7) * .75), x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, y = cy + (R(k + 3) - .45) * cr * .45, r = .22 + R(k + 5) * .12, F = [1.25, .72, 1.15];
      add(G.sph(r * 1.05, 10, 8), '#f08fb4', x, y - r * .2, z, 0, 0, 0, F); add(G.sph(r, 10, 8), PINK2, x, y, z, 0, 0, 0, F); add(G.sph(r * .72, 9, 7), PINK, x + r * .1, y + r * .25, z + r * .12, 0, 0, 0, F);
      if (k % 3 === 0) add(G.sph(.045, 6, 5), '#ffffff', x + r * .4, y + r * .5, z + r * .3);
    }
    // a few petals on the ground round it (big, few)
    for (let q = 0; q < 10; q++) add(G.cyl(.05, .05, .008, 7), q % 2 ? PINK : '#ffffff', Math.cos(q * 2.4) * (.9 + q * .12), .012, Math.sin(q * 2.4) * (.6 + q * .1), 0, 0, 0, [1, 1, .6]);
  }));
  else if (false) f.add(mc('sakura-canopy-cloud', ({ add }) => {
    // (big: a cloud of blossom lumps, each a pink ball with a paler top and a few white dots — the C안 tree)
    const lumps = [[0, 2.7, -.1, .8], [-.8, 2.45, .1, .58], [.8, 2.55, -.25, .6], [.15, 3.3, -.2, .62], [-.5, 3.05, .35, .45], [.6, 3.1, .3, .45], [.3, 2.3, .55, .45], [-.3, 2.6, .6, .38], [-1.0, 2.85, -.35, .4], [1.05, 2.9, .05, .38]];
    for (const [x, y, z, r] of lumps) { add(G.sph(r, 14, 10), PINK2, x, y, z); add(G.sph(r * .74, 12, 8), PINK, x + r * .12, y + r * .3, z + r * .12); add(G.sph(r * .4, 10, 7), '#ffe1ea', x + r * .22, y + r * .6, z + r * .2);
      for (let k = 0; k < 3; k++) add(G.sph(.035, 6, 5), '#ffffff', x + Math.cos(k * 2.1) * r * .8, y + r * .2, z + Math.sin(k * 2.1) * r * .8); }
  }));
  if (K === 1) f.add(mc('sakura-canopy', ({ add }) => {
    for (const [x0, y0, z0, r0, c] of [[0, 1.72, 0, .55, PINK], [-.42, 1.56, .1, .38, PINK], [.42, 1.62, -.05, .4, PINK], [.05, 2.1, -.05, .36, PINK],
      [.15, 1.58, .34, .32, PINK2], [-.18, 1.95, .3, .2, PINK2], [.33, 1.9, .28, .16, '#ffffff'], [-.45, 1.75, .28, .14, '#ffffff']]) { const x = x0 * K, y = 1.1 + (y0 - 1.1) * K + (K - 1) * .5, z = z0 * K, r = r0 * K; add(G.sph(r, 12, 9), c, x, y, z); }
  }));
  f.spot('behind', null, .05, 0, .3, { maxH: .22, label: '벚나무 뿌리 사이', scale: .7 });
  f.spot('behind', null, 0, 0, -.34, { maxH: .45, label: '벚나무 뒤', scale: .85 });
};

// 매표 창구 (2×1, against the station wall): the office front — a window with a rounded opening, a counter ledge, a
// drawer under it that slides out, a ticket sign over it
B.ticketwin = (f, T) => {
  const W = 1.92, H = 2.25, z0 = -.32, zf = z0 + .2;
  f.add(mc('ticketwin', ({ add }) => {
    add(G.box(W, H, .4, .03), CREAM, 0, H / 2, z0);
    add(G.box(W + .06, .14, .5, .03), GREEN, 0, H + .02, z0 + .02);                        // eave
    add(G.box(W, .5, .02, .02), GREEND, 0, .25, zf + .005);                                  // skirting
    // the window: frame, glass, the rounded speaking opening at its foot
    add(G.box(1.3, .8, .04, .03), WOODD, 0, 1.32, zf + .01);
    add(G.box(1.2, .7, .02, .02), GLASS, 0, 1.32, zf + .03);
    add(G.cyl(.16, .16, .03, 16, false), '#2b2438', 0, .98, zf + .03, HP, 0, 0);
    // the counter ledge
    add(G.box(1.4, .05, .3, .015), WOOD, 0, .9, zf + .14);
    for (const s of [-1, 1]) add(G.box(.04, .1, .2, .01), WOODD, s * .6, .84, zf + .1);
    // the sign: a ticket on a green board
    add(G.box(.9, .26, .03, .03), GREEN, 0, 1.92, zf + .02);
    add(G.box(.42, .14, .01, .02), '#fffaf0', 0, 1.92, zf + .04); add(G.cyl(.025, .025, .012, 10), GREEN, -.21, 1.92, zf + .045, HP, 0, 0); add(G.cyl(.025, .025, .012, 10), GREEN, .21, 1.92, zf + .045, HP, 0, 0);
    // ivy creeping down from the eave at one side, a pot of flowers at the other end of the ledge
    for (let k = 0; k < 9; k++) add(G.sph(.075 + (k % 3) * .015, 8, 6), k % 2 ? '#7fcf6a' : '#5cb45a', -.82 + (k % 3) * .07, H - .05 - k * .14, zf + .03 + (k % 2) * .02, 0, 0, 0, [1.2, .8, .7]);
    for (let k = 0; k < 6; k++) add(G.sph(.07, 8, 6), k % 2 ? '#7fcf6a' : '#5cb45a', -.55 + k * .12, H - .02, zf + .05, 0, 0, 0, [1.2, .75, .8]);
    add(G.cyl(.08, .06, .12, 10), '#d98b5f', .58, .99, zf + .16);
    for (const [x, c] of [[-.04, '#ff9ec2'], [.03, '#ffd23f'], [0, '#ffffff']]) add(G.sph(.04, 8, 6), c, .58 + x, 1.08, zf + .16 + x);
    // a bell on the ledge
    add(G.sph(.05, 10, 6), YEL, .48, .95, zf + .16, 0, 0, 0, [1, .7, 1]); add(G.cyl(.012, .012, .03, 6), DARK, .48, .99, zf + .16);
  }));
  // the drawer, under the ledge
  const dr = grp(); put(dr, 0, .62, zf); f.add(dr);
  dr.add(mc('ticketwin-drawer', ({ add }) => {
    add(G.box(.7, .2, .04, .02), WOOD, 0, 0, .02);
    add(G.pbox(.66, .02, .34), WOODD, 0, -.09, -.15); for (const s of [-1, 1]) add(G.pbox(.02, .16, .34), WOODD, s * .33, -.02, -.15);
    add(G.box(.16, .04, .04, .015), STEEL2, 0, .02, .05);
  }));
  const p = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .3 * t; }, { label: '창구 서랍', sfx: 'drawer', dur: .3 });
  f.spot('inside', dr, 0, -.08, -.14, { part: p, maxH: .12, label: '창구 서랍 안', scale: .7 });
  f.spot('on', null, -.4, .925, zf + .16, { maxH: .3, label: '창구 선반', scale: .8 });
};

// 코인 로커 (1×1): nine small numbered doors; the middle one opens
B.coinlocker = (f, T) => {
  const W = .9, H = 1.56, D = .5, z0 = -.2, zf = z0 + D / 2, cw = (W - .08) / 3, ch = (H - .3) / 3, MINT = '#8fd3c6';
  f.add(mc('coinlocker', ({ add }) => {
    add(G.pbox(W, H, .03), MINT, 0, H / 2, z0 - D / 2 + .015);
    for (const s of [-1, 1]) add(G.pbox(.03, H, D), MINT, s * (W / 2 - .015), H / 2, z0);
    add(G.pbox(W, .16, D), shade(MINT, .25), 0, .08, z0); add(G.box(W + .04, .05, D + .04, .015), shade(MINT, .25), 0, H, z0);
    add(G.pbox(cw - .02, ch - .02, .02), '#3e5a66', 0, .2 + ch * 1.5, z0 - D / 2 + .04);   // the dark inside of the middle box
    add(G.pbox(cw, .02, D - .04), MINT, 0, .2 + ch, z0); add(G.pbox(cw, .02, D - .04), MINT, 0, .2 + ch * 2, z0);
    for (const s of [-1, 1]) add(G.pbox(.02, ch, D - .04), MINT, s * cw / 2, .2 + ch * 1.5, z0);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      if (r === 1 && c === 1) continue;
      const x = (c - 1) * cw, y = .2 + ch * (r + .5);
      add(G.box(cw - .03, ch - .03, .025, .01), '#e9f6f2', x, y, zf);
      add(G.box(.06, .04, .01, .005), DARK, x + cw * .28, y + .06, zf + .015);
      add(G.cyl(.018, .018, .02, 8), STEEL2, x + cw * .28, y - .02, zf + .015, HP, 0, 0);
    }
  }));
  const dv = grp(); put(dv, -cw / 2 + .015, .2 + ch * 1.5, zf); f.add(dv);
  dv.add(mc('coinlocker-door', ({ add }) => {
    add(G.box(cw - .03, ch - .03, .025, .01), '#e9f6f2', cw / 2 - .015, 0, 0);
    add(G.box(.06, .04, .01, .005), RED, cw * .78, .06, .015);
    add(G.cyl(.018, .018, .02, 8), STEEL2, cw * .78, -.02, .015, HP, 0, 0);
  }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.7 * t; }, { label: '코인 로커', sfx: 'open', dur: .3 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: cw * .78, y: -.08, z: .04, parent: dv };
  f.spot('inside', null, 0, .2 + ch + .02, z0 + .02, { part: p, maxH: .26, label: '코인 로커 칸', scale: .75 });
};

// 시간표 판 (1×1): a board on two legs — the day's trains as coloured rows, a clock on top
B.timetable = (f, T) => {
  f.add(mc('timetable', ({ add }) => {
    for (const s of [-1, 1]) add(G.cyl(.03, .03, 1.5, 8), STEEL2, s * .4, .75, -.05);
    add(G.box(.92, .82, .05, .03), GREEN, 0, 1.08, -.05);
    add(G.box(.84, .72, .02, .02), '#fffaf0', 0, 1.08, -.02);
    for (let r = 0; r < 6; r++) {
      const y = 1.36 - r * .11;
      add(G.pbox(.12, .045, .01), r % 2 ? GREEN : '#ff9b6b', -.3, y, -.005);
      add(G.pbox(.42 - (r * 17 % 4) * .06, .03, .01), '#9a93a8', .06, y, -.005);
    }
    add(G.cyl(.15, .15, .05, 18), '#ffffff', 0, 1.62, -.05, HP, 0, 0); add(G.tor(.15, .02, PI * 2, 6, 20), GREEN, 0, 1.62, -.02);
    add(G.pbox(.012, .1, .01), DARK, 0, 1.66, -.02); add(G.pbox(.08, .012, .01), DARK, .03, 1.62, -.018);
  }));
  f.spot('behind', null, 0, 0, -.32, { maxH: .4, label: '시간표 판 뒤', scale: .8 });
};

// 우산꽂이 (1×1, small): a round stand with two closed umbrellas — room for something small inside
B.umbrellastand = (f, T) => {
  f.add(mc('umbrellastand', ({ add }) => {
    add(G.cyl(.17, .15, .42, 18, true), '#7fa8e8', 0, .21, 0);
    add(G.tor(.17, .018, PI * 2, 6, 20), shade('#7fa8e8', .2), 0, .42, 0, HP, 0, 0);
    add(G.cyl(.15, .15, .02, 18), shade('#7fa8e8', .3), 0, .02, 0);
    for (const [x, z, c, r] of [[-.06, -.06, '#ff8fb8', .12], [.07, -.03, YEL, -.1]]) {
      add(G.cone(.07, .55, 10), c, x, .62, z, r, 0, r * .5);
      add(G.cyl(.012, .012, .2, 6), DARK, x + r * .4, .98, z - r * .1);
      add(G.tor(.04, .012, PI, 6, 10), DARK, x + r * .4 + .04, 1.08, z - r * .1, 0, 0, 0);
    }
  }));
  f.spot('inside', null, .02, .04, .07, { maxH: .3, label: '우산꽂이 안', scale: .6 });
};

// 수돗가 (1×1): a small concrete basin on legs with two taps, a bucket under it, a damp patch on the ground
B.watertap = (f, T) => {
  f.add(mc('watertap', ({ add }) => {
    add(G.box(.78, .14, .42, .03), CONC, 0, .7, -.05);
    add(G.box(.68, .05, .32, .02), '#a9c7d8', 0, .76, -.05);
    for (const s of [-1, 1]) add(G.box(.12, .63, .3, .02), CONC2, s * .3, .32, -.05);
    add(G.box(.78, .5, .06, .02), CONC2, 0, 1.0, -.23);
    for (const s of [-1, 1]) { add(G.cyl(.025, .025, .12, 8), STEEL, s * .18, 1.02, -.15, HP, 0, 0); add(G.cyl(.02, .02, .08, 8), STEEL, s * .18, .97, -.09); add(G.box(.08, .02, .02, .008), RED, s * .18, 1.1, -.17); }
    add(G.cyl(.4, .4, .006, 20), '#b9cfe0', .05, .006, .16, 0, 0, 0, [1, 1, .6]);
  }));
  f.add(mc('watertap-bucket', ({ add }) => {
    add(G.cyl(.14, .11, .26, 14, true), '#ffb547', 0, .13, .02); add(G.cyl(.11, .11, .02, 14), shade('#ffb547', .3), 0, .02, .02);
    add(G.tor(.14, .014, PI * 2, 6, 18), shade('#ffb547', .2), 0, .26, .02, HP, 0, 0);
    add(G.tor(.13, .008, PI, 4, 12), DARK, 0, .26, .02, 0, 0, 0);
  }));
  f.spot('inside', null, 0, .04, .02, { maxH: .22, label: '수돗가 양동이 안', scale: .6 });
  f.spot('beside', null, .3, 0, .28, { maxH: .3, label: '수돗가 옆', scale: .75 });
};

// 개굴이 낚시 가방 (1×1): a green canvas bag with a rod strapped on top; its flap lifts open (it burst on the platform)
B.tripbag = (f, T) => {
  const W = .62, H = .32, D = .36, CANV = '#7cc47a';
  f.add(mc('tripbag', ({ add }) => {
    add(G.pbox(W, .03, D), shade(CANV, .25), 0, .015, 0);
    for (const s of [-1, 1]) { add(G.box(W, H, .03, .02), CANV, 0, H / 2, s * (D / 2 - .015)); add(G.box(.03, H, D, .02), CANV, s * (W / 2 - .015), H / 2, 0); }
    for (const s of [-1, 1]) add(G.box(.06, H + .01, D + .02, .02), shade(CANV, .2), s * .18, H / 2, 0);
    add(G.box(.18, .14, .03, .02), shade(CANV, .12), 0, .14, D / 2 + .01);
    add(G.cyl(.008, .008, .5, 6), DARK, .1, .31, -D / 2 - .03, 0, 0, HP);   // the shoulder strap, slack behind
  }));
  const lid = grp(); put(lid, 0, H, -D / 2); f.add(lid);
  lid.add(mc('tripbag-flap', ({ add }) => {
    add(G.box(W + .02, .04, D + .02, .02), CANV, 0, .02, D / 2);
    add(G.cyl(.012, .012, W * .9, 6), '#ffd23f', 0, .045, D * .85, 0, 0, HP);
    // the rod strapped on top: a stick with a reel and a red-white float tied to it
    add(G.cyl(.012, .016, 1.0, 8), WOODD, .1, .07, D / 2, 0, 0, HP);
    add(G.cyl(.04, .04, .03, 12), STEEL2, -.18, .1, D / 2 + .03, HP, 0, 0);
  }));
  const p = f.part('lift', lid, t => { lid.rotation.x = -1.9 * t; }, { label: '낚시 가방', sfx: 'lift', dur: .32 });
  f.spot('inside', null, 0, .03, 0, { part: p, maxH: .22, label: '낚시 가방 안', scale: .7 });
};

// 물뿌리개 (1×1, small): a yellow watering can by a little stack of pots — beside the flower bed
B.wcan = (f, T) => {
  f.add(mc('wcan', ({ add, tube }) => {
    add(G.cyl(.14, .16, .26, 16), YEL, -.08, .13, .02);
    add(G.cyl(.14, .14, .02, 16), shade(YEL, .2), -.08, .265, .02);
    tube([.02, .08, .02], [.26, .3, .02], .022, shade(YEL, .1), 8, .03);
    add(G.cyl(.05, .03, .04, 10), shade(YEL, .2), .27, .31, .02, 0, 0, -.8);
    add(G.tor(.1, .016, PI, 6, 12), shade(YEL, .15), -.12, .3, .02, 0, 0, 0);
    for (const [x, z, y] of [[.22, -.2, 0], [.22, -.2, .1]]) { add(G.cyl(.09, .07, .1, 12), '#d98b5f', x, y + .05, z); add(G.tor(.09, .012, PI * 2, 4, 14), shade('#d98b5f', .2), x, y + .1, z, HP, 0, 0); }
  }));
  f.spot('beside', null, .06, 0, .28, { maxH: .25, label: '물뿌리개 옆', scale: .7 });
};

// 전봇대 (1×1): a grey concrete pole, a crossarm with insulators, a transformer can, and the wires running off both
// ways out of the map (the refs' Japanese street: every corner has one)
B.denchu = (f, T) => {
  f.add(mc('denchu', ({ add, tube }) => {
    add(G.cyl(.09, .12, 3.4, 12), '#bdb6c6', 0, 1.7, -.1);
    for (const y of [.9, 1.6]) add(G.box(.2, .05, .02, .01), '#ffffff', 0, y, -.0);
    add(G.box(.2, .05, .02, .01), '#e05a5a', 0, 1.25, 0);
    add(G.box(1.1, .06, .08, .02), '#8f95a8', 0, 3.1, -.1);
    for (const x of [-.45, -.15, .15, .45]) add(G.cyl(.03, .03, .08, 8), '#ffffff', x, 3.18, -.1);
    add(G.cyl(.13, .13, .36, 14), '#9ea5b8', -.22, 2.6, -.1); add(G.cyl(.14, .14, .03, 14), '#7e859a', -.22, 2.79, -.1);
    for (const [x, sag] of [[-.45, .18], [.15, .24], [.45, .2]]) { tube([x, 3.2, -.1], [x - 3.2, 3.2 - sag, -.1], .008, DARK, 4); tube([x, 3.2, -.1], [x + 3.2, 3.2 - sag * .8, -.1], .008, DARK, 4); }
    add(G.box(.2, .3, .02, .02), '#ffffff', 0, 2.05, .02); add(G.box(.16, .08, .01, .01), GREEN, 0, 2.12, .035);
  }));
  f.spot('behind', null, 0, 0, -.38, { maxH: .35, label: '전봇대 뒤', scale: .75 });
};

// 플랫폼 의자 (2×1): four orange shell seats on one steel rail, the platform kind
B.platseats = (f, T) => {
  const SEAT = '#ff9b6b';
  f.add(mc('platseats', ({ add }) => {
    add(G.box(1.7, .05, .06, .02), STEEL2, 0, .32, -.05);
    for (const x of [-.7, .7]) { add(G.cyl(.03, .03, .32, 8), STEEL2, x, .16, -.05); add(G.box(.3, .03, .2, .01), STEEL2, x, .015, -.05); }
    for (const x of [-.6, -.2, .2, .6]) {
      add(G.box(.34, .05, .32, .05), SEAT, x, .38, .02);
      add(G.box(.34, .34, .05, .05), SEAT, x, .58, -.13, -.15, 0, 0);
    }
  }));
  // the platform roof over them: two posts at the back, a shallow pitched roof in the station's green (the refs' covered
  // platform), a little hanging station sign under its front edge
  f.add(mc('platseats-roof', ({ add }) => {
    for (const x of [-.85, .85]) add(G.cyl(.04, .04, 2.3, 10), '#ffffff', x, 1.15, -.38);
    add(G.box(2.1, .05, .95, .02), '#ffffff', 0, 2.3, -.02, -.08, 0, 0);
    add(G.box(2.16, .06, 1.0, .02), GREEN, 0, 2.36, -.02, -.08, 0, 0);
    add(G.box(2.16, .1, .04, .01), GREEND, 0, 2.31, .47);
    for (const x of [-.3, .3]) add(G.cyl(.008, .008, .25, 4), DARK, x, 2.15, .3);
    add(G.box(.8, .18, .04, .02), '#ffffff', 0, 1.99, .3); add(G.box(.7, .05, .045, .01), GREEN, 0, 1.99, .3);
  }));
  f.spot('under', null, -.4, 0, .02, { maxH: .26, label: '의자 밑', scale: .75 });
  f.spot('on', null, .6, .41, .03, { maxH: .3, label: '의자 위', scale: .75 });
};

// 승강장 쉼터 (2×1, C안): four cream posts under a teal roof that curves at its ends, two lanterns hanging from it, a
// wooden bench with pink check cushions, pots of flowers at the posts
B.platshelter = (f, T) => {
  // (수정 10/21, the C안 picture): a thick teal tile roof that runs flat and sweeps down at its east end, cream posts with
  // arched brackets, a lantern hung under each end, the bench with pink check cushions, two flower boxes between the posts
  const TEAL = '#6fc2b4', TEAL2 = '#5aa99c', CRM = '#fbf0dc', CRM2 = '#e9dcc4', PINKC = '#ffb3c4';
  f.add(mc('platshelter2', ({ add, tube }) => {
    for (const x of [-.85, .85]) for (const z of [-.35, .3]) { add(G.box(.13, 1.95, .13, .03), CRM, x, .975, z); add(G.box(.2, .1, .2, .02), CRM2, x, .05, z); add(G.box(.18, .08, .18, .02), CRM2, x, 1.92, z); }
    for (const z of [-.35, .3]) add(G.box(1.9, .12, .12, .03), CRM, 0, 2.0, z);
    // arched brackets under the beams
    for (const x of [-.85, .85]) for (const z of [-.35, .3]) for (const sx of [-1, 1]) if (Math.abs(x + sx * .25) < .95) add(G.tor(.22, .035, HP, 5, 10), CRM, x + sx * .22, 1.78, z, 0, 0, sx < 0 ? 0 : HP);
    // the roof: a slab of tiles, flat, then curving down at +x
    const N = 12;
    for (let k = 0; k < N; k++) { const t = k / (N - 1), x = -1.05 + t * 2.25, curve = t > .7 ? Math.pow((t - .7) / .3, 1.6) : 0, y = 2.14 - curve * .4, rz = -curve * .9;
      add(G.box(.22, .1, 1.1, .03), k % 2 ? TEAL : shade(TEAL, .05), x, y, -.02, 0, 0, rz);
      for (let r = 0; r < 4; r++) add(G.box(.2, .02, .02, .005), TEAL2, x, y + .055, -.45 + r * .28, 0, 0, rz); }
    add(G.box(1.75, .06, .05, .02), TEAL2, -.2, 2.12, .55);
    // lanterns
    for (const x of [-.6, .65]) { add(G.cyl(.008, .008, .2, 4), DARK, x, 1.85, .32); add(G.box(.14, .04, .14, .01), DARK, x, 1.75, .32); add(G.box(.11, .16, .11, .02), '#ffd98a', x, 1.65, .32); add(G.box(.14, .03, .14, .01), DARK, x, 1.56, .32); }
    // bench
    add(G.box(1.2, .07, .38, .02), WOODD, 0, .44, -.1); for (const x of [-.5, .5]) add(G.box(.06, .44, .32, .015), DARK, x, .22, -.1);
    for (let k = 0; k < 3; k++) add(G.box(1.2, .06, .03, .01), WOODD, 0, .58 + k * .1, -.28, -.12, 0, 0);
    for (const x of [-.3, .3]) { add(G.box(.42, .08, .32, .05), PINKC, x, .52, -.08); add(G.box(.36, .3, .1, .05), PINKC, x, .7, -.22, -.15, 0, 0); for (let k = 0; k < 3; k++) { add(G.pbox(.42, .004, .025), '#ffffff', x, .565, -.18 + k * .1); add(G.pbox(.025, .004, .32), '#ffffff', x - .14 + k * .14, .566, -.08); } }
    // flower boxes between the back posts
    for (const x of [-.55, .55]) { add(G.box(.42, .2, .22, .02), WOODD, x, .1, -.4); for (let k = 0; k < 5; k++) add(G.sph(.07, 7, 5), k % 2 ? '#7fcf6a' : ['#ff9ec2', '#ffe27a', '#c39bff'][k % 3], x - .16 + k * .08, .25, -.4); }
  }));
  f.spot('under', null, .2, 0, -.1, { maxH: .3, label: '벤치 밑', scale: .8 });
  f.spot('on', null, -.3, .56, -.08, { maxH: .3, label: '벤치 위', scale: .75 });
  f.spot('beside', null, .55, .2, -.4, { maxH: .2, label: '꽃상자 사이', scale: .6 });
};

// 가방 더미 (1×1, C안): two old trunks stacked with a picnic basket on top — its lid lifts
B.suitcases = (f, T) => {
  f.add(mc('suitcases', ({ add }) => {
    add(G.box(.62, .3, .4, .04), '#b97f4c', 0, .15, 0); add(G.box(.64, .04, .42, .02), '#8a5a33', 0, .27, 0);
    for (const x of [-.18, .18]) add(G.box(.04, .31, .41, .01), '#e0b46a', x, .155, 0);
    add(G.box(.46, .24, .32, .04), '#d98b5f', -.02, .42, -.02, 0, .15, 0); add(G.box(.12, .04, .04, .01), '#e0b46a', -.02, .56, -.02, 0, .15, 0);
    add(G.box(.26, .14, .2, .03), '#e9c28e', .05, .61, .02);
    for (let k = 0; k < 3; k++) add(G.pbox(.27, .008, .21), '#c99a62', .05, .56 + k * .04, .02);
  }));
  const lid = grp(); put(lid, .05, .68, -.08); f.add(lid);
  lid.add(mc('suitcases-lid', ({ add }) => { add(G.box(.27, .03, .21, .015), '#ffb3c4', 0, .015, .1); add(G.box(.27, .004, .03, .002), '#ffffff', 0, .032, .1); }));
  const p = f.part('lift', lid, t => { lid.rotation.x = -1.3 * t; }, { label: '바구니 뚜껑', sfx: 'lift', dur: .28 });
  f.spot('inside', null, .05, .57, .02, { part: p, maxH: .12, label: '가방 위 바구니 안', scale: .5 });
  f.spot('beside', null, .34, 0, .28, { maxH: .26, label: '가방 옆', scale: .7 });
};

// 꽃 울타리 (1×1, C안): a white-and-wood fence panel along the track with flowering bushes in front of it
B.flowerfence = (f, T) => {
  f.add(mc('flowerfence', ({ add }) => {
    for (const x of [-.45, .45]) add(G.box(.08, .6, .08, .02), WOOD, x, .3, -.3);
    for (const y of [.25, .48]) add(G.box(1.0, .06, .04, .015), '#fbf0dc', 0, y, -.3);
    for (const [x, c, r] of [[-.25, '#ff9ec2', .2], [.15, '#ffffff', .17], [.35, '#ffe27a', .14]]) {
      add(G.sph(r, 10, 7), '#7fcf6a', x, r * .7, -.05);
      for (let k = 0; k < 6; k++) { const a = k * 1.1; add(G.sph(.035, 6, 5), c, x + Math.cos(a) * r * .7, r * .9 + Math.sin(k) * .05, -.05 + Math.sin(a) * r * .6); }
    }
  }));
  f.spot('behind', null, 0, 0, -.42, { maxH: .3, label: '울타리 뒤', scale: .75 });
};

export const STATION_BUILDERS = B;
export const STATION_INFO = {
  train: { w: 5, d: 1, name: '기차', price: 900, region: 'park' },
  crossing: { w: 1, d: 1, name: '건널목 차단기', price: 160, region: 'park' },
  treesakura: { w: 1, d: 1, name: '벚나무', price: 200, region: 'park' },
  ticketwin: { w: 2, d: 1, name: '매표 창구', price: 320, region: 'park' },
  coinlocker: { w: 1, d: 1, name: '코인 로커', price: 220, region: 'park' },
  timetable: { w: 1, d: 1, name: '시간표 판', price: 90, region: 'park' },
  umbrellastand: { w: 1, d: 1, name: '우산꽂이', price: 50, region: 'park' },
  watertap: { w: 1, d: 1, name: '수돗가', price: 140, region: 'park' },
  tripbag: { w: 1, d: 1, name: '낚시 가방', price: 80, region: 'park' },
  wcan: { w: 1, d: 1, name: '물뿌리개', price: 40, region: 'park' },
  denchu: { w: 1, d: 1, name: '전봇대', price: 120, region: 'alley' },
  platseats: { w: 2, d: 1, name: '플랫폼 의자', price: 160, region: 'park' },
  platshelter: { w: 2, d: 1, name: '승강장 쉼터', price: 380, region: 'park' },
  suitcases: { w: 1, d: 1, name: '가방 더미', price: 120, region: 'park' },
  flowerfence: { w: 1, d: 1, name: '꽃 울타리', price: 70, region: 'park' },
};

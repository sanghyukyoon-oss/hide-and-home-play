// 내 방 복층·오르는 길·지붕 (③ 10/22, user: "꾸미기는 복층도 지을 수 있게 해 주고 지붕도 주고 계단도 옵션 주고 미끄럼틀도
// 주고"): not a building system — pieces you buy and place like furniture. A 복층 판 is a deck on four posts with a railing;
// small things can stand on it (room.js STACK_TOP) and something can hide on it. The way up is part of the piece: a ladder,
// stairs or a slide (몽글이 slides down it: lobby.js slideMong).
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const B = {};
const HP = Math.PI / 2;
export const LOFT_Y = 1.3;
const col = (T, k, d) => T?.[k] || d;

// the deck itself: w × d metres, centred on the piece, at LOFT_Y; rails on every side but the one the way up comes from
function deck(f, P, T, w, d, open) {
  const wood = col(T, 'wood', '#f3cf9c'), woodD = col(T, 'woodD', '#d29c62'), Y = LOFT_Y;
  P.add(mc('loftdeck|' + [w, d, open, wood, woodD].join(','), ({ add }) => {
    add(G.box(w, .16, d, .03), woodD, 0, Y - .08, 0);
    add(G.box(w - .08, .03, d - .08, .01), shade(wood, .08), 0, Y + .012, 0);
    for (let k = -w / 2 + .25; k < w / 2 - .1; k += .25) add(G.pbox(.012, .006, d - .1), shade(wood, -.08), k, Y + .03, 0);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(G.box(.12, Y, .12, .03), woodD, x * (w / 2 - .07), Y / 2, z * (d / 2 - .07));
    // the railing (a gap of .6 m where the way up arrives, in the middle of that side)
    const rail = (ax, az, bx, bz) => {
      const L = Math.hypot(bx - ax, bz - az); if (L < .08) return; const ang = Math.atan2(bz - az, bx - ax);
      add(G.box(L, .06, .06, .02), wood, (ax + bx) / 2, Y + .5, (az + bz) / 2, 0, -ang, 0);
      for (let t = .12; t < L - .05; t += .24) add(G.box(.045, .46, .045, .012), wood, ax + (bx - ax) * t / L, Y + .26, az + (bz - az) * t / L);
    };
    const hw = w / 2 - .03, hd = d / 2 - .03, gp = .32;
    const side = (s, a, b) => s === open ? (rail(...a, ...mid(a, b, -gp)), rail(...mid(a, b, gp), ...b)) : rail(...a, ...b);
    const mid = (a, b, o) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), t = .5 + o / L; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
    side('S', [-hw, hd], [hw, hd]); side('N', [-hw, -hd], [hw, -hd]); side('E', [hw, -hd], [hw, hd]); side('W', [-hw, -hd], [-hw, hd]);
  }));
  f.spot('on', P, -w / 4, Y + .03, -d / 4, { maxH: .4, label: '복층 위', scale: .85 });
  f.spot('on', P, w / 4, Y + .03, -d / 4, { maxH: .4, label: '복층 위', scale: .85 });
  f.spot('under', P, 0, 0, 0, { maxH: .5, label: '복층 밑', scale: .9 });
}
// the slide: from the deck's open side down to the floor, curving out (steep, then easing onto the floor)
function slide(f, P, T, w, d) {
  const red = col(T, 'slide', '#ff6b5a'), red2 = shade(red, -.18), Y = LOFT_Y, z0 = d / 2, L = 1.55;
  // the path: [z, y] at k 0..1
  const at = k => [z0 + L * k, Y * (1 - k) * (1 - k * .35) + .06 * k];
  P.add(mc('loftslide|' + red, ({ add }) => {
    const N = 14;
    for (let i = 0; i < N; i++) {
      const [za, ya] = at(i / N), [zb, yb] = at((i + 1) / N), L2 = Math.hypot(zb - za, yb - ya), ang = Math.atan2(ya - yb, zb - za);
      add(G.box(.5, .05, L2 + .02, .02), red, 0, (ya + yb) / 2, (za + zb) / 2, ang, 0, 0);
      for (const s of [-1, 1]) add(G.box(.05, .14, L2 + .02, .02), red2, s * .26, (ya + yb) / 2 + .06, (za + zb) / 2, ang, 0, 0);
    }
    // a step up from the floor at the deck's end of the slide (the rungs), and the slide's foot lip
    for (let y = .3; y < Y - .1; y += .3) add(G.box(.55, .05, .08, .015), shade(red, .2), 0, y, z0 - .05);
    add(G.box(.5, .06, .1, .02), red2, 0, .06, z0 + L + .02);
  }));
  f.slidePath = k => { const [z, y] = at(k); return P.localToWorld(new THREE.Vector3(0, y + .05, z)); };
}
function ladder(f, P, T, w, d) {
  const wood = col(T, 'wood', '#f3cf9c'), woodD = col(T, 'woodD', '#d29c62'), Y = LOFT_Y, z0 = d / 2 + .35, tilt = Math.atan2(.35, Y);
  P.add(mc('loftladder|' + wood, ({ add }) => {
    for (const s of [-.22, .22]) add(G.box(.06, Y + .2, .06, .015), woodD, s, (Y + .2) / 2, z0 - .18, -tilt, 0, 0);
    for (let y = .28; y < Y; y += .28) add(G.box(.44, .05, .06, .015), wood, 0, y, z0 - y * Math.tan(tilt));
  }));
}
function stairs(f, P, T, w, d) {
  const wood = col(T, 'wood', '#f3cf9c'), woodD = col(T, 'woodD', '#d29c62'), Y = LOFT_Y, n = 5, st = Y / n, run = .26;
  P.add(mc('loftstairs|' + wood, ({ add }) => {
    for (let i = 0; i < n; i++) { const h = st * (i + 1), z = d / 2 + (n - i) * run - run / 2; add(G.box(.62, h, run + .01, .02), i % 2 ? wood : shade(wood, -.04), 0, h / 2, z); }
  }));
}
// (the piece's footprint is the deck plus the way up in front: the deck sits at its back — P shifted back by half the extra)
const piece = (w, d, way, D) => (f, T) => {
  const P = grp(); put(P, 0, 0, -(D - d) / 2 + .05); f.add(P);
  deck(f, P, T, w, d, 'S'); ({ slide, ladder, stairs })[way](f, P, T, w, d); f.loft = { w, d, way, y: LOFT_Y, P };
  // small things stand on the deck only (room.js stackSpot), not out over the way up: the deck's part of the footprint
  f.stackArea = { u: w / 2 - .12, v0: P.position.z - d / 2 + .12, v1: P.position.z + d / 2 - .12 };
};
// sizes: 2×2 and 3×2 metres of deck; the way up takes one more tile in front (the footprint below)
for (const [k, w] of [['2', 2], ['3', 3]]) for (const way of ['ladder', 'stairs', 'slide']) B[`loft${k}_${way}`] = piece(w - .1, 1.9, way, way === 'slide' ? 4 : 3);

const N = { ladder: '사다리', stairs: '계단', slide: '미끄럼틀' };
export const LOFT_INFO = {};
for (const [k, w] of [['2', 2], ['3', 3]]) for (const way of ['ladder', 'stairs', 'slide'])
  LOFT_INFO[`loft${k}_${way}`] = { w, d: way === 'slide' ? 4 : 3, name: `복층 ${w === 2 ? '작은' : '큰'} 판 · ${N[way]}`, price: (w === 2 ? 600 : 850) + (way === 'slide' ? 250 : way === 'stairs' ? 100 : 0), region: 'home' };
export const LOFT_BUILDERS = B;

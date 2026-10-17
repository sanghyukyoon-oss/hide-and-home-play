// 보드킹의 스케이트 파크 (2026-10-17, user must-have: "스케이트보드 파크"; layout idea from Codex skatepark-game-v1).
// Ramps, a rail, a fun box, a painted wall (original shapes, not anyone's tag) and a board rack. The one moving
// thing: a board parked on the quarter-pipe deck — tap it and it rolls down the ramp and away, and whatever it was
// hiding on the deck shows. Shared toy kit, one merged mesh per piece.
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const CONC = '#d9d4e3', CONC2 = '#bfb8cf', STEEL = '#c9cfe0', STEEL2 = '#8f97b2', WOOD = '#e2b27a', INK = '#2a1d33';
const B = {};
// 쿼터파이프 (2×1): a ramp curving up to a deck with a steel coping; a skateboard waits on the deck
B.quarterpipe = f => {
  const W = 1.9, R = .78, H = .62, D = .2;   // ramp runs from z=+.5 (floor) up to the deck at z=-.28
  f.add(mc('qpipe', ({ add }) => {
    // side profile (x along the ramp, y up): the concave curve from the floor at x=R up to vertical under the coping
    const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0, H);
    for (let k = 1; k <= 16; k++) { const b = HP * (1 - k / 16); s.lineTo(R * (1 - Math.sin(b)), H * (1 - Math.cos(b))); }
    s.lineTo(0, 0);
    add(G.ext(s, W, 0, 2), '#9fb8e8', W / 2, 0, -.28, 0, -HP, 0);   // profile x → world +z, extruded across x
    add(G.box(W, .06, D + .1, .02), WOOD, 0, H + .03, -.28 - (D + .1) / 2 + .02);
    add(G.cyl(.03, .03, W, 10), STEEL, 0, H + .01, -.26, 0, 0, HP);
    for (const sx of [-1, 1]) add(G.box(.06, H, D + .08, .01), shade('#9fb8e8', -.15), sx * (W / 2 - .03), H / 2, -.28 - (D + .08) / 2);
    // painted stripe on the ramp face
    add(G.box(W - .1, .01, .06, .005), '#ffcf3c', 0, .02, .46);
  }));
  // the board on the deck (a part): it rolls off down the ramp and out across the floor
  const board = grp(); put(board, .3, H + .07, -.36); f.add(board);
  board.add(mc('skateboard', ({ add }) => {
    add(G.box(.62, .03, .2, .015), '#ff6a8a', 0, .04, 0);
    add(G.box(.5, .005, .16, .002), '#ffe27a', 0, .058, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.03, .03, .025, 10), '#fff4dc', sx * .2, .015, sz * .08, HP, 0, 0);
  }));
  const p = f.part('lift', board, (t, b) => {
    // slide to the coping, drop down the curve, roll away across the floor
    const z0 = b.p.z, y0 = b.p.y;
    if (t < .15) { const u = t / .15; board.position.set(b.p.x, y0, z0 + (-.28 - z0) * u); board.rotation.set(0, 0, 0); return; }
    if (t < .7) { const u = (t - .15) / .55, c = HP * (1 - u); board.position.set(b.p.x, H * (1 - Math.cos(c)) + .07, -.28 + R * (1 - Math.sin(c))); board.rotation.set(c * .85, 0, 0); return; }
    const u = (t - .7) / .3; board.position.set(b.p.x + .1 * u, .07, -.28 + R + .55 * u); board.rotation.set(0, .4 * u, 0);
  }, { label: '쿼터파이프 보드', sfx: 'swish', dur: .8 });
  f.spot('inside', null, .3, H + .065, -.36, { part: p, maxH: .22, label: '보드 밑', scale: .65 });
  f.spot('on', null, -.55, H + .065, -.36, { maxH: .3, label: '램프 꼭대기', scale: .7 });
  f.spot('behind', null, -W / 2 + .1, 0, .38, { maxH: .3, label: '램프 옆', scale: .7 });   // its back is against the wall: beside it instead
};

// 그라인드 레일 (2×1): a round steel rail on two legs
B.grindrail = f => {
  f.add(mc('grindrail', ({ add, tube }) => {
    add(G.cyl(.035, .035, 1.8, 12), STEEL, 0, .42, 0, 0, 0, HP);
    for (const sx of [-1, 1]) { tube([sx * .7, 0, 0], [sx * .7, .42, 0], .028, STEEL2, 8); add(G.box(.22, .03, .22, .01), STEEL2, sx * .7, .015, 0); }
    for (const sx of [-1, 1]) add(G.sph(.04, 10, 8), '#ffcf3c', sx * .9, .42, 0);
  }));
  f.spot('under', null, 0, 0, 0, { maxH: .35, label: '레일 밑', scale: .75 });
};

// 펀박스 (2×1): a concrete box with a ledge and a painted top
B.funbox = f => {
  f.add(mc('funbox', ({ add }) => {
    add(G.box(1.7, .32, .7, .04), CONC, 0, .16, 0);
    add(G.box(1.72, .04, .72, .015), CONC2, 0, .32, 0);
    add(G.box(1.6, .005, .5, .002), '#7fd6c0', 0, .345, 0);
    add(G.cyl(.02, .02, 1.7, 8), STEEL, 0, .33, .35, 0, 0, HP);
    for (const [x, c] of [[-.5, '#ff6a8a'], [0, '#ffcf3c'], [.5, '#6fb8e8']]) add(G.sph(.07, 12, 8), c, x, .345, 0, 0, 0, 0, [1, .15, 1]);
  }));
  f.spot('on', null, .55, .35, -.1, { maxH: .35, label: '펀박스 위', scale: .75 });
  f.spot('behind', null, -.6, 0, -.42, { maxH: .28, label: '펀박스 뒤', scale: .7 });
};

// 그래피티 벽 (2×1): a low wall painted with big friendly shapes (stars, a wave, dots) — no real tag copied
B.graffitiwall = f => {
  f.add(mc('graffiti', ({ add }) => {
    add(G.box(1.9, 1.2, .2, .03), '#f4efe6', 0, .6, -.3);
    add(G.box(1.94, .06, .24, .02), CONC2, 0, 1.22, -.3);
    const Z = -.195;
    add(G.sph(.32, 16, 10), '#ff8fb8', -.5, .62, Z, 0, 0, 0, [1.4, 1, .05]);
    add(G.sph(.22, 16, 10), '#7fd6c0', .25, .75, Z + .005, 0, 0, 0, [1.6, .8, .05]);
    add(G.sph(.18, 16, 10), '#ffcf3c', .62, .42, Z + .01, 0, 0, 0, [1, 1, .05]);
    for (let k = 0; k < 6; k++) add(G.sph(.05, 8, 6), ['#6fb8e8', '#ff6a8a', '#ffffff'][k % 3], -.85 + k * .3, .2 + (k % 2) * .08, Z + .015, 0, 0, 0, [1, 1, .1]);
    add(G.tor(.16, .03, PI, 6, 16), INK, -.5, .62, Z + .012, 0, 0, PI);   // a smile on the pink blob
    for (const sx of [-1, 1]) add(G.sph(.03, 8, 6), INK, -.5 + sx * .1, .72, Z + .014, 0, 0, 0, [1, 1, .2]);
  }));
  f.spot('behind', null, .92, 0, -.05, { maxH: .5, label: '그래피티 벽 끝', scale: .75 });
  f.spot('on', null, .6, 1.25, -.3, { maxH: .25, label: '벽 위', scale: .6 });
};

// 보드 거치대 (1×1): a rack of three boards and a helmet hook
B.boardrack = f => {
  f.add(mc('boardrack', ({ add }) => {
    add(G.box(.7, .08, .3, .02), WOOD, 0, .04, -.1);
    for (const sx of [-1, 1]) add(G.box(.06, .9, .06, .015), shade(WOOD, -.15), sx * .32, .45, -.2);
    add(G.box(.7, .06, .06, .015), shade(WOOD, -.15), 0, .9, -.2);
    [['#6fb8e8', -.18], ['#ffcf3c', 0], ['#7fd6c0', .18]].forEach(([c, x]) => { add(G.box(.18, .62, .03, .015), c, x, .42, -.12, -.25, 0, 0); });
    add(G.sph(.12, 14, 10), '#ff6a8a', .28, .82, -.08, 0, 0, 0, [1, .8, 1]);
  }));
  f.spot('under', null, 0, 0, .1, { maxH: .28, label: '거치대 밑', scale: .7 });
  f.spot('on', null, -.22, .94, -.2, { maxH: .2, label: '거치대 꼭대기', scale: .5 });
};

export const SKATE_BUILDERS = B;
export const SKATE_INFO = {
  quarterpipe: { w: 2, d: 1, name: '쿼터파이프', price: 360, region: 'alley' },
  grindrail: { w: 2, d: 1, name: '그라인드 레일', price: 160, region: 'alley' },
  funbox: { w: 2, d: 1, name: '펀박스', price: 220, region: 'alley' },
  graffitiwall: { w: 2, d: 1, name: '그래피티 벽', price: 200, region: 'alley' },
  boardrack: { w: 1, d: 1, name: '보드 거치대', price: 140, region: 'alley' },
};

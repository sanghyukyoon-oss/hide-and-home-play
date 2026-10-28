// 둠칫이의 K-POP 무대 (2026-10-17, user must-have: "케이팝"; idea from Codex kpop-game-v1). A small outdoor stage — an
// original concert of the town's own friends, no real group, song or album copied. A light truss and an LED wall
// over a raised floor; the front curtain is the lock (a colour lock: the fans' light-stick colours in order) and
// backstage is what it hides. Speakers, a mic stand, a merch table, a photo-zone heart and rows of fan stools.
import * as THREE from 'three';
import { put, grp, heartShape, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { clothBend } from './clothbend.js';

const PI = Math.PI, HP = PI / 2;
const DARK = '#3b3556', DARK2 = '#2c2744', STEEL = '#c9cfe0', PINK = '#ff7fb0', MINT = '#7fe0c8', LEMON = '#ffe27a', SKY = '#8fc8ff', LILAC = '#c9a7ff';
const B = {};
// (②b 10/29 사용자 "1~18판은 완벽하니 건들지 말고 19부터" — ⑩ outdoor.js와 같은 문): the reworked models below only from 19판
// (scenes/stage.js puts the stage number in globalThis.__sbkStage); 1~18판 and scenes outside a stage keep the old ones
const late19 = () => (globalThis.__sbkStage ?? -1) >= 18;

// 무대 (3×2): a raised floor, a truss with coloured lights, an LED wall of bright squares, and a two-leaf curtain at
// the back of the stage (it hides the backstage nook; it carries the colour lock)
B.kpopstage = f => {
  const W = 2.9, D = 1.9, H = .34;
  // (②b 10/29 사용자 "허접한 오브젝트 계속 디벨롭" 62·68판: a flat navy slab, two solid steel bars and a grid of bright squares
  // whose bare backs faced the room from behind) — a plank deck with a gold nosing, a skirt of panels, can lights, lattice truss
  // towers and bar with yoke-hung par cans and bunting, the LED wall in a dark frame with a braced back panel, a railed step
  const DECK = '#5a5280', SKIRT = '#4a4368', SEAM = '#353050', TZ = -D / 2 + .1;
  if (late19()) f.add(mc('kstage2', ({ add, tube }) => {
    add(G.box(W, H - .04, D, .03), SKIRT, 0, (H - .04) / 2, 0);
    add(G.box(W + .04, .05, D + .04, .015), DECK, 0, H - .015, 0);
    for (let k = 1; k < 6; k++) add(G.pbox(W, .004, .008), SEAM, 0, H + .012, -D / 2 + k * D / 6);
    add(G.box(W + .06, .03, .04, .01), '#e8c26a', 0, H, D / 2 + .02);
    for (let k = -2; k <= 2; k++) add(G.pbox(.012, H - .1, .006), SEAM, k * .58, (H - .04) / 2, D / 2 + .002);
    for (const sx of [-1, 1]) for (let k = -1; k <= 1; k++) add(G.pbox(.006, H - .1, .012), SEAM, sx * (W / 2 + .002), (H - .04) / 2, k * .6);
    add(G.box(W + .02, .04, D + .02, .012), SEAM, 0, .02, 0);
    for (let k = 0; k < 7; k++) { const x = -1.2 + k * .4; add(G.cyl(.045, .05, .05, 12), DARK2, x, H + .045, D / 2 - .06, -.5, 0, 0); add(G.cyl(.032, .032, .012, 12), [PINK, MINT, LEMON, SKY][k % 4], x, H + .06, D / 2 - .035, HP - .5, 0, 0); }
    for (const s of [-1, 1]) add(G.box(.46, .012, .07, .004), '#ff5a8a', 0, H + .018, .2, 0, s * .55, 0);
    add(G.box(.18, .004, .24, .002), '#fbf6ee', .62, H + .022, .62, 0, .3, 0); for (let k = 0; k < 4; k++) add(G.pbox(.11, .003, .01), '#8a83a8', .62 - .01, H + .026, .54 + k * .045, 0, .3, 0);
    // steps at the front corner, each with a gold nosing, and a little rail
    for (let k = 0; k < 2; k++) { add(G.box(.5, .12 * (k + 1), .2, .02), SKIRT, W / 2 - .3, .06 * (k + 1), D / 2 + .1 - k * .2); add(G.box(.52, .022, .03, .008), '#e8c26a', W / 2 - .3, .12 * (k + 1), D / 2 + .19 - k * .2); }
    tube([W / 2 - .04, 0, D / 2 + .19], [W / 2 - .04, .62, D / 2 + .19], .014, STEEL, 6); tube([W / 2 - .04, .62, D / 2 + .19], [W / 2 - .04, .62 + H, D / 2 - .2], .014, STEEL, 6); tube([W / 2 - .04, .62 + H, D / 2 - .2], [W / 2 - .04, H, D / 2 - .2], .014, STEEL, 6);
    // truss: two lattice towers on base plates and a lattice bar across
    const C = .07, ST = '#d7dcea';
    for (const sx of [-1, 1]) {
      const x0 = sx * (W / 2 - .08);
      add(G.box(.26, .03, .26, .008), SEAM, x0, H + .015, TZ);
      for (const cx of [-1, 1]) for (const cz of [-1, 1]) tube([x0 + cx * C, H, TZ + cz * C], [x0 + cx * C, 2.16, TZ + cz * C], .011, ST, 6);
      for (let k = 0; k < 9; k++) { const y0 = H + .04 + k * .2, y1 = y0 + .2; tube([x0 - C, y0, TZ + C], [x0 + C, y1, TZ + C], .006, ST, 4); tube([x0 + sx * C, y0, TZ - C], [x0 + sx * C, y1, TZ + C], .006, ST, 4); }
    }
    for (const cy of [-1, 1]) for (const cz of [-1, 1]) tube([-W / 2 + .01, 2.1 + cy * C, TZ + cz * C], [W / 2 - .01, 2.1 + cy * C, TZ + cz * C], .011, ST, 6);
    for (let k = 0; k < 14; k++) { const x0 = -W / 2 + .08 + k * .2, x1 = x0 + .2; tube([x0, 2.1 - C, TZ + C], [x1, 2.1 + C, TZ + C], .006, ST, 4); tube([x0, 2.1 + C, TZ - C], [x1, 2.1 + C, TZ + C], .006, ST, 4); }
    // par cans on yokes under the bar, a coloured lens at the front of each
    [PINK, LEMON, MINT, SKY, LILAC].forEach((c, k) => {
      const x = -1.1 + k * .55, y = 1.9, z = TZ + .12;
      add(G.box(.03, .05, .03, .006), SEAM, x, 2.1 - C - .03, TZ + .04); tube([x - .08, 1.98, z - .02], [x + .08, 1.98, z - .02], .008, SEAM, 4);
      for (const s of [-1, 1]) tube([x + s * .08, 1.98, z - .02], [x + s * .08, y - .02, z], .008, SEAM, 4);
      add(G.cyl(.065, .075, .17, 14), DARK2, x, y, z, .55, 0, 0); add(G.tor(.07, .01, PI * 2, 5, 16), SEAM, x, y - .07, z + .05, .55 + HP, 0, 0);
      add(G.cyl(.06, .06, .012, 14), c, x, y - .075, z + .055, .55, 0, 0); add(G.sph(.022, 8, 6), '#ffffff', x + .02, y - .08, z + .07);
    });
    // bunting along the bar: small triangles in the stick colours
    for (let k = 0; k < 13; k++) { const x = -1.3 + k * .217; add(G.cone(.045, .1, 3), [PINK, MINT, LEMON, SKY, LILAC][k % 5], x, 2.1 - C - .06 - Math.sin(k / 12 * PI) * .05, TZ + C + .01, PI, 0, 0, [1, 1, .2]); }
    // LED wall: bright squares in a dark frame, a braced back panel behind (what shows from behind the stage)
    const LW = 9 * .275 + .08, LH = 4 * .3 + .08, LY = H + .55 + .45, LZ = -D / 2 + .06;
    add(G.box(LW, LH, .05, .015), SEAM, 0, LY, LZ - .035);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) add(G.box(.262, .285, .02, .006), [PINK, LILAC, SKY, MINT, LEMON][(i + j * 2) % 5], -1.1 + i * .275, H + .55 + j * .3, LZ);
    for (const sx of [-1, 1]) { add(G.box(.06, LY - LH / 2 - H + .02, .06, .01), SEAM, sx * (LW / 2 - .1), H + (LY - LH / 2 - H) / 2, LZ - .04); tube([sx * (LW / 2 - .1), H, LZ - .32], [sx * (LW / 2 - .1), LY + LH / 2 - .1, LZ - .07], .014, SEAM, 6); }
    for (const y of [LY - LH / 4, LY + LH / 4]) add(G.box(LW - .1, .03, .02, .006), '#433c5e', 0, y, LZ - .07);
    add(G.box(.22, .14, .03, .01), '#433c5e', .7, LY - .2, LZ - .08); add(G.sph(.012, 6, 5), MINT, .64, LY - .17, LZ - .1);
  }));
  else f.add(mc('kstage', ({ add, tube }) => {
    add(G.box(W, H, D, .04), DARK, 0, H / 2, 0);
    add(G.box(W + .02, .05, D + .02, .015), DARK2, 0, H, 0);
    for (let k = 0; k < 7; k++) add(G.box(.2, .02, .04, .01), [PINK, MINT, LEMON, SKY][k % 4], -1.2 + k * .4, H + .03, D / 2 - .04);   // footlights
    add(G.box(.7, .02, .3, .01), '#ff5a8a', 0, H + .03, .2);   // a little pink "X" mark for the singer
    // steps at the front corner
    for (let k = 0; k < 2; k++) add(G.box(.5, .12 * (k + 1), .2, .02), DARK2, W / 2 - .3, .06 * (k + 1), D / 2 + .1 - k * .2);
    // truss: two towers and a bar across, lights hanging on it
    for (const sx of [-1, 1]) { add(G.box(.12, 2.1, .12, .02), STEEL, sx * (W / 2 - .08), 1.05 + H * 0, -D / 2 + .1); }
    add(G.box(W, .12, .12, .02), STEEL, 0, 2.1, -D / 2 + .1);
    [PINK, LEMON, MINT, SKY, LILAC].forEach((c, k) => { const x = -1.1 + k * .55; add(G.cyl(.07, .09, .16, 12), DARK2, x, 1.96, -D / 2 + .2, .5, 0, 0); add(G.sph(.06, 10, 8), c, x, 1.9, -D / 2 + .28); });
    // LED wall: a grid of bright squares behind the curtain line
    for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) add(G.box(.27, .27, .03, .006), [PINK, LILAC, SKY, MINT, LEMON][(i + j * 2) % 5], -1.1 + i * .275, H + .55 + j * .3, -D / 2 + .06);
  }));
  // the curtain: two leaves that slide apart (a part, the colour lock sits on its front)
  const leaves = [-1, 1].map(sx => { const g = grp(); put(g, sx * .36, H, -.35); f.add(g); g.add(mc('kcurtain', ({ add }) => {
    for (let k = 0; k < 5; k++) add(G.cyl(.075, .075, 1.25, 10), k % 2 ? '#d94a7a' : '#e85a8a', -.28 + k * .14, .62, 0);
    add(G.box(.76, .08, .1, .02), '#ffcf3c', 0, 1.27, 0);
  })); return g; });
  const p = f.part('door', leaves, (t, bL, bR) => { leaves[0].position.x = bL.p.x - .55 * t; leaves[1].position.x = bR.p.x + .55 * t; leaves.forEach(g => g.scale.x = 1 - .45 * t); }, { label: '무대 커튼', sfx: 'swish', dur: .5 });
  p.lockable = true; p.lockKind = 'color'; f.lockAt = { x: 0, y: H + .7, z: -.27 };
  f.spot('inside', null, 0, H, -.6, { part: p, maxH: .45, label: '무대 뒤 커튼 안', scale: .85 });
  f.spot('on', null, -.9, H + .02, .55, { maxH: .35, label: '무대 위', scale: .8 });
  f.spot('on', null, .95, H + .02, .45, { maxH: .3, label: '무대 오른쪽', scale: .75 });
};

// 스피커 (1×1): a tall stack of two cabinets
B.speaker = f => {
  // (②b 10/29 62·68판 "허접한 오브젝트": two dark boxes with a flat disc each) — two rounded cabinets on rubber feet with
  // steel corner caps, a woofer with a surround and a cone, a horn tweeter up top, a recessed handle each side, a pink badge
  const CAB = '#4a4468', CAB2 = '#3c3656', RIM = '#2c2744';
  if (late19()) f.add(mc('speaker2', ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.035, .04, .03, 10), RIM, sx * .25, .015, -.05 + sz * .19);
    for (const [y, h, big] of [[.03, .6, 1], [.65, .45, 0]]) {
      const cy = y + h / 2;
      add(G.box(.62, h, .5, .05), CAB, 0, cy, -.05);
      add(G.box(.54, h - .08, .02, .02), CAB2, 0, cy, .2);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(G.box(.07, .07, .07, .015), STEEL, sx * .285, cy + sy * (h / 2 - .03), .18);
      for (const sx of [-1, 1]) { add(G.box(.012, .05, .16, .01), RIM, sx * .312, cy + h * .18, -.05); add(G.box(.014, .014, .12, .006), STEEL, sx * .32, cy + h * .18 + .012, -.05); }
      if (big) {
        add(G.tor(.19, .022, PI * 2, 6, 28), RIM, 0, cy - .03, .215); add(G.cone(.17, .07, 24), '#5b5478', 0, cy - .03, .2, -HP, 0, 0);
        add(G.sph(.06, 14, 10), '#6e6890', 0, cy - .03, .23, 0, 0, 0, [1, 1, .5]); add(G.sph(.02, 8, 6), '#ffffff', -.04, cy + .01, .25);
        add(G.box(.1, .028, .012, .006), PINK, .17, cy - h / 2 + .06, .215);
      } else {
        add(G.tor(.12, .016, PI * 2, 6, 24), RIM, 0, cy - .04, .215); add(G.cone(.11, .05, 20), '#5b5478', 0, cy - .04, .205, -HP, 0, 0); add(G.sph(.035, 10, 8), '#6e6890', 0, cy - .04, .225, 0, 0, 0, [1, 1, .5]);
        add(G.box(.2, .07, .03, .012), RIM, 0, cy + .14, .21); add(G.box(.16, .04, .02, .008), '#5b5478', 0, cy + .14, .225);
      }
    }
    tube([.2, .03, -.3], [.24, .02, -.5], .012, RIM, 5);
  }));
  else f.add(mc('speaker', ({ add }) => {
    for (const [y, h] of [[0, .6], [.6, .5]]) {
      add(G.box(.62, h, .5, .03), DARK, 0, y + h / 2, -.05);
      add(G.cyl(.18, .18, .02, 20), DARK2, 0, y + h / 2, .21, HP, 0, 0);
      add(G.cyl(.07, .07, .03, 14), STEEL, 0, y + h / 2, .22, HP, 0, 0);
    }
  }));
  f.spot('on', null, 0, 1.1, -.05, { maxH: .3, label: '스피커 위', scale: .7 });
  f.spot('behind', null, .4, 0, .1, { maxH: .35, label: '스피커 옆', scale: .7 });
};

// 마이크 스탠드 (1×1)
B.micstand = f => {
  f.add(mc('mic', ({ add, tube }) => {
    add(G.cyl(.18, .2, .03, 16), DARK, 0, .015, 0);
    tube([0, 0, 0], [0, 1.15, 0], .015, STEEL, 6);
    tube([0, 1.15, 0], [0, 1.25, .12], .012, STEEL, 6);
    add(G.cap(.04, .07, 2, 8), '#5b5672', 0, 1.3, .16, .6, 0, 0);
    add(G.sph(.045, 10, 8), STEEL, 0, 1.36, .2);
  }));
  f.spot('on', null, 0, .03, .1, { maxH: .2, label: '스탠드 받침', scale: .6 });
};

// 굿즈 테이블 (2×1): a table under a sparkly cloth (lift it) with albums, light-sticks and keyrings on top
B.merchtable = f => {
  const TH = .68;
  // (②b 10/29 62·68판 "허접한 오브젝트": colour squares, a cup and a bare stick on a plain top) — a folding table with
  // cross-braced legs; albums leaning on little stands with a cover drawing each, a stack of photocards, light-sticks in a
  // cup, a keyring stand with charms hanging, a cash tin and a little heart sign on a stick
  if (late19()) f.add(mc('merch2', ({ add, tube }) => {
    add(G.box(1.7, .045, .62, .02), '#f4efe6', 0, TH, 0);
    add(G.box(1.66, .02, .58, .008), '#ddd6ca', 0, TH - .03, 0);
    for (const sx of [-1, 1]) { for (const sz of [-1, 1]) { tube([sx * .78, 0, sz * .26], [sx * .78, TH - .03, sz * .26], .02, STEEL, 6); add(G.cyl(.028, .028, .02, 8), DARK2, sx * .78, .01, sz * .26); } tube([sx * .78, .08, -.26], [sx * .78, TH - .06, .26], .01, STEEL, 4); tube([sx * .78, .08, .26], [sx * .78, TH - .06, -.26], .01, STEEL, 4); }
    [[PINK, -.66, '#fff4f8'], [SKY, -.46, '#eef7ff'], [LILAC, -.26, '#f7f0ff']].forEach(([c, x, c2]) => {
      add(G.box(.18, .18, .02, .005), c, x, TH + .11, -.16, -.2, 0, 0); add(G.box(.11, .11, .022, .004), c2, x, TH + .115, -.152, -.2, 0, 0);
      add(G.sph(.028, 8, 6), c, x, TH + .12, -.14, 0, 0, 0, [1, .9, .4]); add(G.box(.04, .008, .02, .002), '#ffffff', x + .05, TH + .05, -.14, -.2, 0, 0);
      tube([x, TH + .02, -.2], [x, TH + .1, -.24], .006, DARK2, 4); add(G.box(.08, .012, .05, .004), DARK2, x, TH + .028, -.18);
    });
    for (let k = 0; k < 4; k++) add(G.box(.09, .012, .13, .004), [PINK, '#ffffff', MINT, LEMON][k], -.04 + k * .004, TH + .03 + k * .013, -.17, 0, k * .12 - .15, 0);
    add(G.cyl(.075, .065, .12, 16), '#ffffff', .25, TH + .085, -.12); add(G.tor(.075, .008, PI * 2, 5, 18), PINK, .25, TH + .14, -.12, HP, 0, 0);
    [PINK, MINT, LEMON].forEach((c, k) => { tube([.25 + (k - 1) * .03, TH + .1, -.12], [.25 + (k - 1) * .06, TH + .3, -.12], .012, '#e8e8f0', 5); add(G.sph(.032, 10, 8), c, .25 + (k - 1) * .06, TH + .32, -.12); add(G.cyl(.016, .016, .03, 8), '#ffffff', .25 + (k - 1) * .06, TH + .35, -.12); });
    add(G.cyl(.06, .07, .02, 14), DARK2, .62, TH + .035, -.2); tube([.62, TH + .04, -.2], [.62, TH + .32, -.2], .009, STEEL, 5); tube([.5, TH + .32, -.2], [.74, TH + .32, -.2], .008, STEEL, 5);
    [[PINK, .53], [SKY, .6], [LEMON, .67], [MINT, .73]].forEach(([c, x], k) => { tube([x, TH + .32, -.2], [x, TH + .26 - (k % 2) * .03, -.2], .003, '#e8e8f0', 3); add(G.ext(heartShape(.03), .012, .004, 3), c, x, TH + .22 - (k % 2) * .03, -.206); });
    add(G.box(.13, .06, .1, .012), '#7fb8a8', .44, TH + .05, -.2); add(G.box(.13, .01, .1, .004), '#6a9f90', .44, TH + .085, -.2);
    tube([-.8, TH + .02, -.26], [-.8, TH + .42, -.26], .008, STEEL, 4); add(G.ext(heartShape(.07), .02, .006, 4), PINK, -.8, TH + .38, -.27); add(G.box(.09, .03, .006, .003), '#ffffff', -.8, TH + .45, -.248);
  }));
  else f.add(mc('merch', ({ add, tube }) => {
    add(G.box(1.7, .05, .62, .02), '#f4efe6', 0, TH, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tube([sx * .78, 0, sz * .26], [sx * .78, TH, sz * .26], .02, STEEL, 6);
    // goods: original "albums" (just colour blocks), light-sticks in a cup, a stand of keyrings
    [[PINK, -.62], [SKY, -.42], [LILAC, -.22]].forEach(([c, x]) => { add(G.box(.18, .18, .02, .005), c, x, TH + .1, -.15, -.2, 0, 0); add(G.box(.12, .12, .022, .004), '#ffffff', x, TH + .1, -.142, -.2, 0, 0); });
    add(G.cyl(.08, .07, .12, 14), '#ffffff', .25, TH + .085, -.1);
    [PINK, MINT, LEMON].forEach((c, k) => { tube([.25 + (k - 1) * .03, TH + .1, -.1], [.25 + (k - 1) * .06, TH + .3, -.1], .012, '#e8e8f0', 5); add(G.sph(.03, 8, 6), c, .25 + (k - 1) * .06, TH + .32, -.1); });
    tube([.62, TH, -.2], [.62, TH + .3, -.2], .01, STEEL, 4); add(G.box(.22, .01, .01, .003), STEEL, .62, TH + .3, -.2);
  }));
  const cloth = grp(); put(cloth, 0, TH, .12); f.add(cloth);
  cloth.add(mc('merchcloth', ({ add }) => { add(G.box(1.74, .012, .4, .006), PINK, 0, .01, 0); add(G.box(1.74, .45, .012, .006), PINK, 0, -.21, .2); for (let k = 0; k < 9; k++) add(G.sph(.025, 6, 4), LEMON, -.8 + k * .2, -.1, .21); }));
  // (⑩ 10/29 사용자 "들출 때 제발 벤딩 좀": 19판부터 테이블 천 앞자락이 말려 올라감 — 판 밖(1~18판 없음)은 그대로)
  const p = f.part('lift', cloth, (globalThis.__sbkStage ?? -1) >= 18 ? clothBend(f, cloth, { hinge: [0, .01, -.2], along: [0, 0, 1], toward: [0, 1, 0], len: .4, turn: 1.7, tip: .1, rise: .05 })
    : (t, b) => { cloth.position.y = b.p.y + .2 * t; cloth.rotation.x = -.9 * t; cloth.position.z = b.p.z - .1 * t; }, { label: '굿즈 테이블 천', sfx: 'lift', dur: .5 });
  f.spot('inside', null, 0, 0, .1, { part: p, maxH: .45, label: '굿즈 테이블 밑', scale: .8 });
  f.spot('on', null, -.05, TH + .03, .12, { maxH: .3, label: '굿즈 테이블 위', scale: .7 });
};

// 포토존 하트 (2×1): a big heart frame on a stand with balloons
B.photoheart = f => {
  // (②b 10/29 62·68판: the balloon strings started in mid-air beside the heart and the stand was a bare square) — bulbs round
  // the frame, a round weighted base, the balloons tied down to it
  if (late19()) f.add(mc('photoheart2', ({ add, tube }) => {
    const s = new THREE.Shape();
    s.moveTo(0, -.55); s.bezierCurveTo(-.7, -.05, -.45, .55, 0, .25); s.bezierCurveTo(.45, .55, .7, -.05, 0, -.55);
    const hole = new THREE.Path(); hole.moveTo(0, -.4); hole.bezierCurveTo(-.5, -.03, -.32, .4, 0, .16); hole.bezierCurveTo(.32, .4, .5, -.03, 0, -.4); s.holes.push(hole);
    add(G.ext(s, .08, .01, 12), PINK, 0, 1.0, -.2, 0, 0, 0, [1.3, 1.3, 1]);
    s.getPoints(8).slice(0, -1).forEach(([x, y], k) => { if (k % 2) return; add(G.sph(.028, 8, 6), k % 4 ? '#ffffff' : LEMON, x * 1.3, 1.0 + y * 1.3, -.1); });
    tube([0, .04, -.2], [0, .3, -.2], .03, STEEL, 6); add(G.cyl(.24, .26, .04, 24), DARK, 0, .02, -.2); add(G.cyl(.2, .2, .012, 24), '#5b5478', 0, .045, -.2); add(G.cyl(.05, .05, .03, 12), STEEL, 0, .06, -.2);
    [[-.75, 1.5, LEMON, -1], [-.6, 1.75, SKY, -1], [.7, 1.6, MINT, 1], [.85, 1.35, LILAC, 1]].forEach(([x, y, c, sd]) => { tube([sd * .16, .06, -.28], [x, y - .13, -.28], .004, '#e8e8f0', 3); add(G.sph(.12, 12, 10), c, x, y, -.28, 0, 0, 0, [1, 1.2, 1]); add(G.cone(.02, .03, 6), c, x, y - .145, -.28, PI, 0, 0); add(G.sph(.025, 6, 5), '#ffffff', x - .04, y + .05, -.19); });
  }));
  else f.add(mc('photoheart', ({ add, tube }) => {
    const s = new THREE.Shape();
    s.moveTo(0, -.55); s.bezierCurveTo(-.7, -.05, -.45, .55, 0, .25); s.bezierCurveTo(.45, .55, .7, -.05, 0, -.55);
    const hole = new THREE.Path(); hole.moveTo(0, -.4); hole.bezierCurveTo(-.5, -.03, -.32, .4, 0, .16); hole.bezierCurveTo(.32, .4, .5, -.03, 0, -.4); s.holes.push(hole);
    add(G.ext(s, .08, .01, 12), PINK, 0, 1.0, -.2, 0, 0, 0, [1.3, 1.3, 1]);
    tube([0, 0, -.2], [0, .3, -.2], .03, STEEL, 6); add(G.box(.5, .04, .3, .01), DARK, 0, .02, -.2);
    [[-.75, 1.5, LEMON], [-.6, 1.75, SKY], [.7, 1.6, MINT], [.85, 1.35, LILAC]].forEach(([x, y, c]) => { tube([x * .9, .6, -.2], [x, y - .1, -.2], .004, '#e8e8f0', 3); add(G.sph(.12, 12, 10), c, x, y, -.2, 0, 0, 0, [1, 1.2, 1]); });
  }));
  f.spot('behind', null, .4, 0, -.42, { maxH: .35, label: '포토존 뒤', scale: .75 });
};

// 팬 스툴 (1×1): a little stool row seat with a light-stick left on it
B.fanstool = f => {
  // (① 모델 품질 10/22: the light stick the note promised was never there — a bare disc on legs; now a padded seat, a foot ring
  // and the fan's heart light stick leaning on a leg)
  f.add(mc('fanstool2', ({ add, tube }) => {
    // (⑥ 10/24 GPT QA ART-21 "다리 선·작은 점 장식이 늘어나 객석 덩어리가 약함"): a chunkier stool that reads at phone size —
    // a thick padded seat with a piped edge, three stout legs with rubber feet, a solid foot ring; and no clutter left on it
    add(G.cyl(.185, .175, .07, 18), LILAC, 0, .375, 0); add(G.cyl(.165, .165, .028, 18), '#e2d4ff', 0, .418, 0); add(G.tor(.18, .012, PI * 2, 6, 24), shade(LILAC, -.15), 0, .41, 0, HP, 0, 0);
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + .5; tube([Math.cos(a) * .15, .02, Math.sin(a) * .15], [Math.cos(a) * .1, .35, Math.sin(a) * .1], .026, STEEL, 8); add(G.cyl(.032, .032, .03, 10), '#5b5672', Math.cos(a) * .15, .015, Math.sin(a) * .15); }
    add(G.tor(.13, .02, PI * 2, 6, 22), STEEL, 0, .15, 0, HP, 0, 0);
    tube([.34, .01, .17], [.255, .4, .115], .016, '#f4f4f8', 6);
    add(G.ext(heartShape(.07), .032, .008, 3), PINK, .245, .4, .095, 0, -.6, .2);
    add(G.sph(.018, 6, 5), '#ffd6ea', .25, .45, .13);
  }));
  f.spot('on', null, 0, .432, 0, { maxH: .3, label: '팬 의자 위', scale: .7 }).noDecoy = true;   // (a thing to find may sit here; no clutter)
  f.spot('under', null, 0, 0, 0, { maxH: .25, label: '팬 의자 밑', scale: .65 });
};

export const KPOP_BUILDERS = B;
export const KPOP_INFO = {
  kpopstage: { w: 3, d: 2, name: '무대', price: 600, region: 'building' },
  speaker: { w: 1, d: 1, name: '스피커', price: 160, region: 'building' },
  micstand: { w: 1, d: 1, name: '마이크 스탠드', price: 90, region: 'building' },
  merchtable: { w: 2, d: 1, name: '굿즈 테이블', price: 220, region: 'building' },
  photoheart: { w: 2, d: 1, name: '포토존 하트', price: 240, region: 'building' },
  fanstool: { w: 1, d: 1, name: '팬 의자', price: 60, region: 'building' },
};

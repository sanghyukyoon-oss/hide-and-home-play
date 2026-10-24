// 둠칫이의 K-POP 무대 (2026-10-17, user must-have: "케이팝"; idea from Codex kpop-game-v1). A small outdoor stage — an
// original concert of the town's own friends, no real group, song or album copied. A light truss and an LED wall
// over a raised floor; the front curtain is the lock (a colour lock: the fans' light-stick colours in order) and
// backstage is what it hides. Speakers, a mic stand, a merch table, a photo-zone heart and rows of fan stools.
import * as THREE from 'three';
import { put, grp, heartShape, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const DARK = '#3b3556', DARK2 = '#2c2744', STEEL = '#c9cfe0', PINK = '#ff7fb0', MINT = '#7fe0c8', LEMON = '#ffe27a', SKY = '#8fc8ff', LILAC = '#c9a7ff';
const B = {};

// 무대 (3×2): a raised floor, a truss with coloured lights, an LED wall of bright squares, and a two-leaf curtain at
// the back of the stage (it hides the backstage nook; it carries the colour lock)
B.kpopstage = f => {
  const W = 2.9, D = 1.9, H = .34;
  f.add(mc('kstage', ({ add, tube }) => {
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
  f.add(mc('speaker', ({ add }) => {
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
  f.add(mc('merch', ({ add, tube }) => {
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
  const p = f.part('lift', cloth, (t, b) => { cloth.position.y = b.p.y + .2 * t; cloth.rotation.x = -.9 * t; cloth.position.z = b.p.z - .1 * t; }, { label: '굿즈 테이블 천', sfx: 'lift' });
  f.spot('inside', null, 0, 0, .1, { part: p, maxH: .45, label: '굿즈 테이블 밑', scale: .8 });
  f.spot('on', null, -.05, TH + .03, .12, { maxH: .3, label: '굿즈 테이블 위', scale: .7 });
};

// 포토존 하트 (2×1): a big heart frame on a stand with balloons
B.photoheart = f => {
  f.add(mc('photoheart', ({ add, tube }) => {
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

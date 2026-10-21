// 아파트 1층 현관 (10/21, 13판 새 맵 — 고른 그림 aptlobby-a): moving day in a cream marble lobby. The glass entrance with
// its door standing open, the red moving truck's open back outside it, a teal hand truck, a low cream ledge along the
// front, a big box with a padlock. The elevator, mailboxes, bench, plant and boxes are the existing pieces.
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const STEEL = '#a9b0c2', STEEL2 = '#7d8498', GLASS = '#cfe9f2', CREAM = '#f3eadc', CARD = '#d9a466', CARD2 = '#c08a4e', TAPE = '#f3dca8', DARK = '#3a3048', RED = '#ef6b5b';
const B = {};

// 유리 현관 (1×4): a glass wall along the cell's west edge in dark steel frames, the doorway at its south end with the
// door swung open outward, a grey doormat inside it
B.glassentry = (f, T) => {
  const x = -.46, H = 2.6;
  f.add(mc('glassentry', ({ add }) => {
    // (the panes themselves are see-through, below; here only a white glint on each)
    for (const [z0, z1] of [[-2.0, -.9], [-.9, .2]]) { const zc = (z0 + z1) / 2, L = z1 - z0; add(G.box(.02, .6, .05, .01), '#ffffff', x + .03, H * .7, zc - L * .2, .3, 0, 0); }
    for (const z of [-2.0, -.9, .2, 1.4]) add(G.box(.1, H, .1, .02), STEEL2, x, H / 2, z);
    add(G.box(.12, .1, 3.5, .02), STEEL2, x, H, -.3); add(G.box(.12, .08, 3.5, .02), STEEL2, x, .04, -.3);
    add(G.box(.08, .06, 2.2, .01), STEEL, x, H * .78, -.9);
    // the doormat inside the doorway
    add(G.box(.9, .02, 1.0, .01), '#6f6a7a', x - .55, .01, .8);
    for (let k = 0; k < 8; k++) add(G.pbox(.9, .006, .03), '#5b5668', x - .55, .022, .38 + k * .12);
  }));
  const glass = new THREE.MeshStandardMaterial({ color: '#bfe6f2', transparent: true, opacity: .32, roughness: .1, depthWrite: false });
  const pane = (L, x0, y0, z0, parent) => { const m = new THREE.Mesh(new THREE.BoxGeometry(.03, H - .14, L), glass); m.position.set(x0, y0, z0); m.userData.noMerge = true; m.layers.set(2); m.renderOrder = 2; (parent || f.group).add(m); return m; };
  for (const [z0, z1] of [[-2.0, -.9], [-.9, .2]]) pane(z1 - z0 - .08, x, H / 2, (z0 + z1) / 2);
  // the door: a glass leaf on the doorway's south post, swung out (toward +x) — it opens further for a look behind it
  const dv = grp(); put(dv, x, 0, 1.4); f.add(dv);
  dv.add(mc('glassentry-door', ({ add }) => {
    for (const z of [-.03, -1.07]) add(G.box(.06, H - .2, .06, .01), STEEL, 0, (H - .2) / 2 + .05, z);
    for (const y of [.08, H - .18]) add(G.box(.06, .08, 1.1, .01), STEEL, 0, y, -.55);
    add(G.cyl(.02, .02, .5, 8), '#c9cfe0', .06, 1.1, -.95);
  }));
  pane(.96, 0, (H - .2) / 2 + .05, -.55, dv);
  dv.rotation.y = -1.1;
  const p = f.part('door', dv, (t, b) => { dv.rotation.y = -1.1 - .45 * t; }, { label: '유리문', sfx: 'open', dur: .3 });
  f.spot('behind', null, x + .45, 0, .9, { part: p, maxH: .4, label: '유리문 뒤', scale: .8 });
  f.spot('on', null, x - .55, .02, .8, { maxH: .12, label: '발판 위', scale: .55 });
};

// 이삿짐 트럭 (2×1, the cab running on north out of the map): the red box truck's open back faces the lobby side (+z), boxes
// stacked inside where you can see them, a ramp down to the pavement
B.movetruck = (f, T) => {
  const W = 1.7, H = 1.9, L = 2.4, z1 = .35, zc = z1 - L / 2;
  f.add(mc('movetruck', ({ add }) => {
    add(G.box(W, .08, L, .02), '#d6d0cc', 0, .5, zc);
    for (const s of [-1, 1]) add(G.box(.06, H - .5, L, .02), RED, s * W / 2, .5 + (H - .5) / 2, zc);
    add(G.box(W + .04, .08, L, .02), shade(RED, .15), 0, H, zc);
    add(G.box(W, H - .5, .06, .02), shade(RED, -.1), 0, .5 + (H - .5) / 2, z1 - L);
    for (const s of [-1, 1]) add(G.box(.1, H - .45, .06, .02), '#e9e4ec', s * (W / 2 - .03), .5 + (H - .5) / 2, z1);
    add(G.box(W, .12, .08, .02), '#e9e4ec', 0, H - .05, z1);
    for (const s of [-1, 1]) add(G.box(.065, .05, L, .01), '#ffffff', s * (W / 2 + .02), 1.15, zc);
    // the cab, further north
    add(G.box(W - .1, 1.2, .9, .1), RED, 0, .9, z1 - L - .45); add(G.box(W - .3, .4, .05, .04), '#cfe9f2', 0, 1.2, z1 - L - .9);
    for (const x of [-.6, .6]) for (const z of [z1 - .5, z1 - L - .4]) add(G.cyl(.26, .26, .2, 16), '#3a3446', x, .26, z, 0, 0, HP);
    add(G.box(W, .14, .12, .02), '#4a4458', 0, .42, z1 + .02);
    for (const x of [-.7, .7]) add(G.box(.12, .1, .04, .01), '#ffb04a', x, .62, z1 + .05);
    // boxes inside, stacked toward the open back
    for (const [bx, by, bz, s] of [[-.4, .55, -.4, .5], [.35, .55, -.35, .48], [-.35, 1.05, -.45, .42], [.3, 1.03, -.4, .44], [0, .55, -1.1, .55], [-.45, .55, -1.2, .45]]) { add(G.box(s, s * .8, s, .02), CARD, bx, by + s * .4, bz); add(G.pbox(s + .005, .05, .06), TAPE, bx, by + s * .8, bz); }
    // the ramp down to the pavement
    add(G.box(.7, .04, .9, .01), STEEL, .35, .26, z1 + .42, .52, 0, 0);
  }));
  f.spot('under', null, 0, 0, -.4, { maxH: .22, label: '트럭 밑', scale: .7 });
  f.spot('on', null, -.4, .54, .1, { maxH: .3, label: '트럭 짐칸 입구', scale: .7 });
};

// 상자 더미 (1×1): a big moving box with two smaller ones on and against it, taped, one marked with a red arrow
B.boxpile = (f, T) => {
  f.add(mc('boxpile', ({ add }) => {
    add(G.box(.72, .56, .62, .02), CARD, -.05, .28, -.05); add(G.pbox(.73, .06, .07), TAPE, -.05, .56, -.05);
    add(G.box(.44, .36, .42, .02), CARD2, -.08, .74, -.08); add(G.pbox(.45, .05, .06), TAPE, -.08, .92, -.08);
    add(G.box(.34, .3, .32, .02), '#efe6da', .3, .15, .3); add(G.box(.12, .04, .005, .005), RED, .3, .22, .462);
  }));
  f.spot('behind', null, -.05, 0, -.42, { maxH: .35, label: '상자 더미 뒤', scale: .75 });
  f.spot('on', null, -.08, .94, -.08, { maxH: .25, label: '상자 더미 위', scale: .6 });
};

// 손수레 (1×1): a teal hand truck — a deck on four wheels, a bent steel handle
B.dolly = (f, T) => {
  const TEAL = '#3fa59a';
  f.add(mc('dolly', ({ add, tube }) => {
    add(G.box(.6, .06, .42, .02), TEAL, 0, .16, .05);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.06, .06, .05, 12), '#3a3446', sx * .23, .06, .05 + sz * .15, HP, 0, 0);
    tube([-.28, .2, -.1], [-.28, .75, -.1], .02, STEEL, 8); tube([-.28, .2, .2], [-.28, .75, .2], .02, STEEL, 8); tube([-.28, .75, -.1], [-.28, .75, .2], .02, STEEL, 8);
  }));
  f.spot('on', null, .05, .19, .05, { maxH: .35, label: '손수레 위', scale: .8 });
  f.spot('under', null, .05, 0, .05, { maxH: .1, label: '손수레 밑', scale: .5 });
};

// 낮은 턱 (2×1): a low cream ledge along the front edge of the lobby, its top a shelf
B.lowwall = (f, T) => {
  f.add(mc('lowwall', ({ add }) => {
    add(G.box(1.96, .55, .3, .05), CREAM, 0, .275, .3);
    add(G.box(2.0, .06, .34, .03), shade(CREAM, -.06), 0, .58, .3);
  }));
  f.spot('behind', null, -.4, 0, .05, { maxH: .4, label: '턱 안쪽', scale: .8 });
  f.spot('on', null, .5, .61, .3, { maxH: .3, label: '턱 위', scale: .7 });
};

// 자물쇠 상자 (1×1): a big moving box taped shut, a small padlock through a strap — its flaps open once it's unlocked
B.lockbox = (f, T) => {
  f.add(mc('lockbox', ({ add }) => {
    add(G.box(.7, .55, .6, .02), CARD, 0, .275, 0);
    add(G.pbox(.08, .552, .605), TAPE, 0, .276, 0);
    add(G.box(.18, .1, .02, .01), CARD2, .2, .35, .305);
    for (const [x, z, s] of [[.4, .38, .3], [-.36, .32, .26]]) { add(G.box(s, s * .8, s, .02), CARD, x - .02, s * .4, z - .05); add(G.pbox(s + .005, .04, .05), TAPE, x - .02, s * .8, z - .05); }
  }));
  const lid = grp(); put(lid, -.35, .55, 0); f.add(lid);
  lid.add(mc('lockbox-flap', ({ add }) => { add(G.box(.35, .02, .6, .01), CARD2, .175, .01, 0); add(G.pbox(.04, .025, .6), TAPE, .33, .012, 0); }));
  // packing paper inside under the flap that comes up as it opens — deep in the box nothing was seen (69판's padlock, 레벨 10/21)
  const up = grp(); put(up, -.17, .26, 0); f.add(up);
  up.add(mc('lockbox-paper', ({ add }) => { for (let k = 0; k < 4; k++) add(G.sph(.09, 7, 5), k % 2 ? '#f4efe6' : '#e6ddcf', (k % 2 - .5) * .12, .02, (k > 1 ? .5 : -.5) * .16, 0, 0, 0, [1, .45, 1]); }));
  const p = f.part('lift', [lid, up], (t, bl, bu) => { lid.rotation.z = 1.9 * t; up.position.y = bu.p.y + .3 * t; }, { label: '이삿짐 상자', sfx: 'lift', dur: .3 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: .2, y: .3, z: .32 };
  f.spot('inside', up, 0, .05, .02, { part: p, maxH: .24, label: '이삿짐 상자 안', scale: .85 });
};

export const APTLOBBY_BUILDERS = B;
// 소화전함 (wall, 현관 2차 10/21): the red fire-hose cabinet every apartment lobby has — a red box with a glass front, the white
// hose coiled inside, a round red lamp over it and a label strip
B.firebox = (f, T) => {
  f.add(mc('firebox', ({ add }) => {
    const W = .56, H = .78, D = .16, y = .95;
    add(G.box(W, H, D, .02), '#e2483d', 0, y, D / 2);
    add(G.box(W - .1, H - .26, .02, .01), '#f7f3ee', 0, y + .04, D + .005);
    for (let k = 0; k < 4; k++) add(G.tor(.13 - k * .025, .018, PI * 2, 6, 18), '#ffffff', 0, y + .06, D + .02);
    add(G.box(W - .14, .08, .02, .01), '#ffffff', 0, y - .3, D + .006);
    add(G.box(W - .3, .03, .022, .006), '#e2483d', 0, y - .3, D + .01);
    add(G.sph(.07, 12, 8), '#ff5a4a', 0, y + H / 2 + .1, .07, 0, 0, 0, [1, 1, .6]); add(G.cyl(.04, .04, .06, 10), '#b9b2a8', 0, y + H / 2 + .03, .05);
    add(G.box(.02, .1, .03, .006), '#b9b2a8', W / 2 - .05, y, D + .015);
  }));
};

export const APTLOBBY_INFO = {
  firebox: { wall: true, span: 1, name: '소화전함', hidden: true },
  glassentry: { w: 1, d: 4, name: '유리 현관', price: 420, region: 'apt' },
  movetruck: { w: 2, d: 1, name: '이삿짐 트럭', price: 700, region: 'apt' },
  boxpile: { w: 1, d: 1, name: '상자 더미', price: 120, region: 'apt' },
  dolly: { w: 1, d: 1, name: '손수레', price: 90, region: 'apt' },
  lowwall: { w: 2, d: 1, name: '낮은 턱', price: 120, region: 'apt' },
  lockbox: { w: 1, d: 1, name: '자물쇠 상자', price: 100, region: 'apt' },
};

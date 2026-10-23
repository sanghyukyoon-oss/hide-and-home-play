// 해변 도착역 소품 — 선로 바닥·항구 물·부두·역명판·바닷풀 (GPT 작업장 gpt-station gptseastation-props.js, fix-1022 — ① 10/22 들여옴:
// 빌더 그대로, 역명판 글자는 우리 fitText로).
// Umimachi: a compact arrival station and harbor, built with the same cached/toon kit as the station props.
import * as THREE from 'three';
import { put, mat, mesh, canvasTex, texCache } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { sign, addWords } from './gptst-kit.js';

const PI = Math.PI, HP = PI / 2, B = {};
const C = { water: '#58bdd4', deep: '#48aaba', foam: '#e6f5f4', cream: '#fbf7f0',
  sand: '#d8cebb', stone: '#e8e5df', wood: '#d59b59', woodD: '#6f4b30',
  blue: '#4389c7', steel: '#c2d6d6', dark: '#6f4b30', coral: '#e56f86', grass: '#55b98a', grassD: '#348b70' };
addWords({ '바닷마을': 'Seaside Town', '도착역': 'Arrival' });
const label = (parent, text, w, h, x, y, z, bg = C.cream, fg = C.blue) => sign(parent, text, w, h, x, y, z, bg, fg);

// Separate track bed: unlike the Sakura kit's railway, there is no road or plaza drain in the sea.
B.gpt_searailbed = f => {
  f.noSolid = true;
  f.collideBox = [-4.5, -.4, -3.5, 4.5, -.02, -.02];
  f.add(mc('gpt-searailbed-v1', ({ add }) => {
    add(G.box(9, .065, 1.18, .03), C.sand, 0, .0375, -2.65);
    for (let x = -4.3; x < 4.4; x += .37) {
      add(G.box(.13, .065, 1.0, .018), '#c67f2a', x, .0925, -2.65);
      if (Math.round((x + 4.3) / .37) % 2 === 0) add(G.sph(.065, 5, 4), C.stone, x + .1, .075, -3.17, 0, 0, 0, [1.3, .55, 1]);
    }
    for (const z of [-2.98, -2.32]) {
      add(G.box(9, .075, .055, .012), C.woodD, 0, .145, z);
      add(G.box(9, .022, .075, .006), C.stone, 0, .1895, z); // Rail top .2005 matches train wheel bottom (.12 + .0805).
    }
    // Rail-side edge sits on the map's actual .34-high platform.
    add(G.box(8.78, .014, .045, .004), C.cream, 0, .354, -1.955);
    add(G.box(8.78, .014, .17, .004), '#feb53d', 0, .354, -1.83);
    for (let x = -4.2; x < 4.3; x += .22) for (const z of [-1.865, -1.8]) add(G.cyl(.018, .018, .012, 5), '#c67f2a', x, .367, z);
    // A 90cm shore stair replaces the old 45cm step outside the west map edge.
    // It belongs to this nonsolid terrain mesh: the raised platform's broad navigation box stays at its real edge.
  }));
  const stair = mc('gpt-seastation-shore-stair', ({ add }) => {
    add(G.box(9, .025, .07, .012), C.cream, 0, .345, .2);
    add(G.box(.9, .17, .28, .025), C.stone, -1.8, .085, .33);
    add(G.box(.94, .035, .065, .015), C.cream, -1.8, .1875, .425);
  });
  stair.userData.noMerge = true; // Keep the sampled support attached to the same rendered world transform.
  f.add(stair); f.navigationFloor = stair;
  // (① 10/22 — the workshop's walking rule (publicBounds z ≥ -2) as our walk box: the track is seen, not walked; the bed takes no floor tiles)
  f.walkBoxes = [[-4.7, 0, -3.8, 4.7, 1.2, -2.0]]; f.noOccupied = true;
};

// Harbor basin over the same cake block as the station. Low opaque aqua geometry hides the tiled floor below it;
// the model never contributes a giant collision box across the open water. The quay has a real gap for the pier.
B.gpt_seawater = f => {
  f.noSolid = true; f.noOccupied = true;
  f.collideBox = [0, -.4, 0, 0, -.02, 0];
  f.add(mc('gpt-seawater-v1', ({ add }) => {
    add(G.box(8.76, .08, 2.26, .025), C.water, 0, .07, 2.26);
    // Solid pale outer basin walls sit beside, rather than through, the water's sides.
    for (const x of [-4.43, 4.43]) add(G.box(.1, .14, 2.26, .025), C.sand, x, .07, 2.26);
    add(G.box(8.96, .14, .1, .025), C.sand, 0, .07, 3.44);
    for (const [x, w] of [[-1.825, 5.31], [3.225, 2.51]]) {
      add(G.box(w, .22, .12, .025), C.stone, x, .11, 1.07);
      add(G.box(w, .06, .17, .022), C.cream, x, .25, 1.07);
    }
    // A few masonry joints and tide marks give the harbor edge weight without dense clutter.
    for (let x = -4.12; x < 4.2; x += .7) {
      if (x > .72 && x < 2.05) continue;
      add(G.box(.022, .13, .012, .004), '#c67f2a', x, .11, 1.139);
    }
    // Large, sparse pale ripples, always above the water plane by more than the game's decal offset.
    for (const [x, z, r, a] of [[-3.75, 1.55, .24, .2], [-2.5, 2.2, .3, -.1], [-3.5, 2.9, .25, .3],
      [-1.15, 1.48, .24, -.2], [-.6, 2.85, .29, .15], [.15, 2.12, .23, -.15],
      [2.95, 1.65, .26, .1], [3.7, 2.55, .28, -.2], [2.85, 3.05, .23, .15]]) {
      add(G.tor(r, .012, PI * .8, 4, 14), C.foam, x, .133, z, HP, 0, a);
      add(G.tor(r * .7, .012, PI * .65, 4, 12), C.foam, x - .03, .133, z - .11, HP, 0, a);
    }
  }));
};

// Timber T-pier: thick planks on beams and piles. Stem reaches the gap in the quay; two steps join it to land.
// Local z=0 is the shore, and z=2.21 is the pier end. Intended placement is x=1.4,z=.76.
B.gpt_seapier = f => {
  // Only the low deck obstructs a neighboring furniture door. The life-ring post is far out over the water;
  // using its full height across the T's whole bounding box would wrongly block a suitcase on shore.
  f.collideBox = [-1.25, .005, -.4, 1.25, .31, 2.22];
  f.add(mc('gpt-seapier-v1', ({ add, tube }) => {
    // Concrete shore steps. Each tread joins the next riser and the timber deck.
    add(G.box(1.1, .09, .19, .02), C.stone, 0, .045, -.305);
    add(G.box(1.1, .21, .21, .02), C.sand, 0, .105, -.105);
    for (const x of [-.36, .36]) {
      add(G.box(.11, .09, 1.54, .018), C.woodD, x, .18, .77);
      for (const z of [.14, .84, 1.47]) add(G.cyl(.065, .075, .24, 9), C.woodD, x, .125, z);
    }
    for (const x of [-1.06, 0, 1.06]) {
      add(G.box(.11, .09, .7, .018), C.woodD, x, .18, 1.87);
      for (const z of [1.63, 2.1]) add(G.cyl(.065, .075, .24, 9), C.woodD, x, .125, z);
    }
    // End-to-end rows share no overlapping deck faces. Plank gaps remain broad and regular.
    for (let j = 0; j < 9; j++) add(G.box(1.0, .11, .16, .018), j % 3 === 0 ? '#d7b58d' : C.wood, 0, .25, .085 + j * .17);
    for (let j = 0; j < 4; j++) add(G.box(2.5, .11, .16, .018), j % 2 ? '#d7b58d' : C.wood, 0, .25, 1.615 + j * .17);
    // Two chunky mooring bollards with a real crossbar, supported directly by the deck.
    for (const x of [-1.02, 1.02]) {
      add(G.cyl(.105, .105, .025, 12), C.dark, x, .32, 1.94);
      add(G.cyl(.065, .08, .18, 10), C.blue, x, .4125, 1.94);
      add(G.box(.23, .055, .075, .022), C.blue, x, .475, 1.94);
    }
    // Rope coil rests on the outer head; one unobtrusive mooring line leads to its bollard.
    for (let j = 0; j < 3; j++) add(G.tor(.085 + j * .027, .012, PI * 2, 5, 18), C.sand, -.78, .327 + j * .006, 1.77, HP);
    tube([-.85, .34, 1.83], [-1.02, .36, 1.92], .012, C.sand, 6);
    // A large white/coral life ring hangs off a timber post, in front of the post with no coplanar faces.
    add(G.box(.075, .68, .075, .018), C.woodD, -.43, .645, 1.14);
    add(G.box(.12, .06, .12, .018), C.cream, -.43, 1.015, 1.14);
    add(G.tor(.17, .045, PI * 2, 7, 22), C.cream, -.43, .75, 1.225);
    for (const s of [-1, 1]) {
      add(G.box(.075, .1, .06, .022), C.coral, -.43 + s * .17, .75, 1.265);
      add(G.box(.1, .075, .06, .022), C.coral, -.43, .75 + s * .17, 1.265);
    }
    tube([-.43, .94, 1.18], [-.43, .9, 1.225], .014, C.dark, 6);
  }));
  f.spot('on', null, .45, .314, 1.83, { maxH: .48, scale: 1, label: '바닷가 부두 위' });
};

// A station name sign kept broad enough to read at the stage camera. Canvas is mapped only to its front faces.
B.gpt_seasign = f => {
  f.add(mc('gpt-seasign-v1', ({ add }) => {
    for (const x of [-.74, .74]) {
      add(G.box(.25, .08, .28, .025), C.stone, x, .04, 0);
      add(G.box(.075, 1.76, .075, .018), C.woodD, x, .96, 0);
      add(G.box(.13, .055, .13, .015), C.cream, x, 1.8675, 0);
    }
    add(G.box(1.8, .68, .09, .035), C.blue, 0, 1.38, .025);
    add(G.box(1.7, .57, .022, .025), C.cream, 0, 1.4, .087);
    add(G.box(1.6, .055, .02, .008), C.blue, 0, 1.185, .115);
    add(G.cyl(.055, .055, .026, 12), C.cream, 0, 1.185, .13, HP);
    add(G.cyl(.025, .025, .028, 10), C.coral, 0, 1.185, .145, HP);
    for (const x of [-.67, .67]) add(G.sph(.018, 6, 4), C.steel, x, 1.62, .116, 0, 0, 0, [1, 1, .5]);
  }));
  label(f.group, '바닷마을', 1.22, .22, 0, 1.54, .108);
  label(f.group, '도착역', 1.26, .15, 0, 1.325, .108);
  f.spot('behind', null, 0, .02, -.2, { maxH: .45, scale: .9, label: '바닷가 역명판 뒤' });
};

// Two restrained coastal-grass tussocks; the pale seed heads and sandy base distinguish these from a hedge.
B.gpt_seagrass = f => {
  f.collideBox = [-.46, 0, -.29, .46, .8, .29];
  f.add(mc('gpt-seagrass-v1', ({ add, tube }) => {
    add(G.box(.87, .08, .5, .07), C.sand, 0, .04, 0);
    for (const [x, z, r] of [[-.32, -.07, .13], [.33, .1, .11], [.13, -.15, .1]]) add(G.sph(r, 7, 5), C.stone, x, r * .45, z, 0, 0, 0, [1.2, .55, 1]);
    for (const side of [-1, 1]) {
      const cx = side * .19;
      for (let k = 0; k < 5; k++) {
        const a = k * 2.4, h = .36 + (k % 3) * .09;
        add(G.sph(.095, 6, 4), k % 2 ? C.grass : C.grassD, cx + Math.cos(a) * .07, .08 + h * .5, Math.sin(a) * .07,
          0, a, (k - 2) * .2, [.35, h / (.095 * 2), .5]);
      }
      for (const [dx, dz, h] of [[-.04, -.03, .64], [.07, .02, .71]]) {
        tube([cx, .08, 0], [cx + dx, h, dz], .012, C.grassD, 5);
        add(G.sph(.045, 6, 4), '#eecfa3', cx + dx, h, dz, 0, 0, -.1, [.6, 1.8, .6]);
      }
    }
  }));
};

export const GPTST_SEA_BUILDERS = B;
export const GPTST_SEA_INFO = {
  gpt_searailbed: { w: 1, d: 1, name: '해변역 선로 바닥', price: 0, hidden: true, region: 'park' },
  gpt_seawater: { w: 1, d: 1, name: '잔잔한 항구 수면', price: 0, hidden: true, region: 'park' },
  gpt_seapier: { w: 3, d: 3, name: '작은 나무 부두', price: 320, hidden: true },
  gpt_seasign: { w: 2, d: 1, name: '바닷마을 역명판', price: 120, hidden: true },
  gpt_seagrass: { w: 1, d: 1, name: '바닷바람 풀밭', price: 80, hidden: true },
};

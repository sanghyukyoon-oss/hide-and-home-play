// 27판 봄 아침 기차역의 첫 역 소품 (GPT 작업장 gpt-station gptstation-props.js, fix-1022 — ① 10/22 들여옴: 빌더 그대로, 간판 글자만 우리 fitText로).
// GPT station kit. All solid colours go through the game's shared vertex-colour toon kit.
// Origin is on the floor; fronts face +z. Lettering is on individual face planes, never box-wrapped.
import * as THREE from 'three';
import { sign, stretchCabin } from './gptst-kit.js';
import { grp, put, mat, mesh, canvasTex, texCache } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { ChibiCat } from './cat.js';

const B = {}, PI = Math.PI, HP = PI / 2;
// Evening look match: paint has several clear hues; neutral trim and some natural timber stay quiet.
const C = { cream: '#f4f2f0', green: '#52b89b', mint: '#8ad1b6', dark: '#6f4b30', wood: '#cf9b6b', woodD: '#976d4e',
  steel: '#a5bdc6', stone: '#dfd4de', pink: '#e876aa', rose: '#dc628f', yellow: '#feb53d', coral: '#ed876f', white: '#fbf7f0', sky: '#61b8d8' };

function flowers(add, x, y, z, count = 5) {
  for (let k = 0; k < count; k++) {
    const dx = Math.sin(k * 2.4) * .12, dz = Math.cos(k * 2.4) * .1, yy = y + .06 + (k % 2) * .05;
    add(G.cyl(.014, .014, .19, 5), C.green, x + dx, yy - .04, z + dz);
    for (let j = 0; j < 4; j++) add(G.sph(.042, 6, 4), [C.pink, C.yellow, C.white][k % 3], x + dx + Math.sin(j * HP) * .036, yy + .06, z + dz + Math.cos(j * HP) * .036, 0, 0, 0, [1, .6, 1]);
    add(G.sph(.024, 6, 4), C.coral, x + dx, yy + .08, z + dz);
  }
}

// Rail bed and the road actually meet. The platform's raised stone structure belongs to the layout.
B.gpt_railway = f => {
  f.noSolid = true;
  f.collideBox = [-4.5, -.5, -3.5, 4.5, -.05, 3.5];
  f.add(mc('gpt-railway-v1', ({ add }) => {
    add(G.box(9, .06, 1.27, .025), '#c6c393', 0, .035, -2.65);
    for (let x = -4.3; x < 4.4; x += .35) {
      add(G.box(.14, .07, .98, .018), '#a09769', x, .09, -2.65);
      // Only a few large stones beside the ties: a readable gravel edge at phone scale.
      add(G.sph(.065, 5, 4), '#e8d7b7', x + .09, .075, -3.21, 0, 0, 0, [1.4, .6, 1]);
    }
    for (const z of [-2.98, -2.32]) {
      add(G.box(9, .09, .055, .01), '#a09769', 0, .13, z);
      add(G.box(9, .018, .075, .005), '#f2dcbc', 0, .184, z);
    }
    // The crossing deck lies between the rails, with flangeway gaps left alongside each rail.
    for (const [z, d] of [[-3.25, .42], [-2.65, .53], [-2.05, .42]]) add(G.box(1.28, .16, d, .015), '#b99e79', 3.72, .08, z);
    add(G.box(1.28, .075, 5.0, .02), '#e2c79e', 3.72, .045, .25);
    for (const x of [3.13, 4.31]) add(G.box(.035, .016, 5, .004), C.white, x, .092, .25);
    // Platform edge toward the rails, including chunky tactile pips.
    add(G.box(7.35, .012, .18, .004), C.yellow, -.75, .397, -1.82);
    add(G.box(7.35, .012, .045, .004), C.white, -.75, .397, -1.96);
    for (let x = -4.25; x < 2.9; x += .19) for (const z of [-1.86, -1.79]) add(G.cyl(.018, .018, .013, 5), '#d4ad4c', x, .41, z);
    // A small station forecourt: drain, planted kerb, paving joints carried by the normal floor.
    add(G.box(1.05, .025, .26, .018), '#c6c393', -.6, .024, 2.95);
    for (let x = -1.04; x < -.1; x += .11) add(G.box(.035, .012, .2, .004), '#6f4b30', x, .043, 2.95);
    for (let x = -4.05; x < 2.9; x += 1.0) add(G.box(.88, .08, .14, .025), '#dad1bc', x, .04, 3.25);
  }));
};

// A short local train: chunky cab, separate glazing, undercarriage firmly on the rails.
B.gpt_localtrain = f => {
  const cabin = mc('gpt-localtrain-metric-v2', ({ add, tube }) => {
    const L = 5.75, D = 1.02, R = L / 2;
    add(G.box(L, .19, D - .05, .06), C.dark, 0, .37, 0);
    add(G.box(L, .57, D, .09), C.green, 0, .71, 0);
    add(G.box(L, .74, D, .09), C.sky, 0, 1.34, 0);
    add(G.box(L + .015, .065, D + .012, .012), C.coral, 0, 1.01, 0);
    add(G.box(L - .02, .18, D + .06, .075), '#feebc8', 0, 1.8, 0);
    for (const x of [-2.35, -1.65, -.85, .75, 1.5, 2.2]) {
      add(G.box(.55, .48, .035, .035), C.dark, x, 1.36, .512);
      add(G.box(.46, .37, .016, .025), '#79c6de', x, 1.385, .536);
      add(G.box(.46, .022, .025, .005), C.steel, x, 1.26, .551);
    }
    // Sliding-door pair with proper frames and step.
    for (const x of [-.16, .17]) {
      add(G.box(.31, 2.05 / 1.55, .045, .018), C.mint, x, .43 + 2.05 / 1.55 / 2, .535);
      add(G.box(.23, .4, .015, .022), '#84ae9d', x, 1.28, .565);
      add(G.box(.018, .18, .02, .005), C.steel, x + (x < 0 ? .11 : -.11), .93, .57);
    }
    add(G.box(.8, .07, .16, .02), C.steel, 0, .43, .56);
    // Cab end at +x, faces the crossing without obstructing it.
    add(G.box(.055, .53, .79, .05), C.dark, R + .012, 1.36, 0);
    add(G.box(.016, .42, .66, .03), '#79c6de', R + .046, 1.38, 0);
    for (const z of [-.34, .34]) {
      add(G.cyl(.095, .095, .05, 12), C.dark, R + .018, .82, z, 0, 0, HP);
      add(G.cyl(.07, .07, .015, 12), '#ffe6a3', R + .051, .82, z, 0, 0, HP);
    }
    add(G.box(.12, .1, .86, .025), '#6f4b30', R + .025, .46, 0);
    for (const bx of [-1.95, 1.85]) {
      add(G.box(.85, .17, .78, .03), C.dark, bx, .3, 0);
      for (const xx of [-.25, .25]) for (const z of [-.34, .34]) {
        add(G.cyl(.16, .16, .08, 12), '#4c4c58', bx + xx, .28, z, HP, 0, 0);
        add(G.cyl(.075, .075, .088, 10), C.steel, bx + xx, .28, z, HP, 0, 0);
      }
    }
    for (const x of [-1.5, 1.5]) {
      add(G.box(.7, .14, .58, .04), '#c0c5c4', x, 1.95, 0);
      for (let xx = -.23; xx <= .24; xx += .115) add(G.box(.03, .01, .36, .003), '#929c9e', x + xx, 2.027, 0);
    }
    tube([-.7, 1.9, 0], [-.4, 2.18, 0], .024, C.dark); tube([-.4, 2.18, 0], [-.05, 1.92, 0], .024, C.dark);
    add(G.box(.64, .035, .08, .008), C.dark, -.4, 2.2, 0);
  });
  stretchCabin(cabin, .43, 1.55); f.add(cabin);
  f.doorClearHeight = 2.05;
  sign(f.group, '봄빛 27', 1.1, .17, 1.48, .926, .528, C.green, C.dark);
};

// The shelter roof is deliberately shallow: it shades the rear of the bench, leaving the seat readable.
B.gpt_platformroof = f => {
  f.collideBox = [-1.86, 0, -.65, 1.86, 2.34, -.45];
  f.add(mc('gpt-platformroof-v1', ({ add, tube }) => {
    for (const x of [-1.62, 1.62]) {
      add(G.box(.18, .12, .23, .02), '#e8d7b7', x, .06, -.48);
      add(G.box(.1, 2.28, .1, .025), C.woodD, x, 1.24, -.48);
      tube([x, 1.94, -.48], [x + (x < 0 ? .32 : -.32), 2.22, -.48], .036, C.woodD);
    }
    add(G.box(3.7, .15, .13, .025), C.woodD, 0, 2.22, -.48);
    add(G.box(3.95, .11, .93, .03), C.sky, 0, 2.39, -.59, -.1);
    add(G.box(4.02, .08, .09, .022), C.mint, 0, 2.36, -.12);
    for (let x = -1.82; x < 1.9; x += .26) add(G.box(.025, .025, .88, .006), '#338fae', x, 2.46, -.59, -.1);
    // Trim only the rear roof edge: clear the train hood while retaining front fascia/posts.
    // Rain gutter and downpipe stay connected along that corrected rear edge.
    add(G.box(4.04, .09, .1, .028), C.green, 0, 2.38, -1.10);
    tube([1.7, 2.35, -1.10], [1.7, .025, -1.10], .028, C.green);
    tube([1.7, .025, -1.10], [1.86, .025, -1.10], .028, C.green);
    for (const x of [-.73, .73]) {
      add(G.cyl(.012, .012, .22, 5), C.dark, x, 2.1, -.38);
      add(G.box(.27, .12, .16, .025), C.cream, x, 1.95, -.38);
    }
    add(G.box(1.55, .32, .075, .025), C.cream, 0, 1.93, -.39);
  }));
  sign(f.group, '벚꽃마을역', 1.45, .25, 0, 1.93, -.345, C.cream, C.dark);
  // (① 10/22: our walk grid would take the whole roof's box as a wall — under it is platform; only the posts and the downpipe stand)
  f.noSolid = true; f.walkBoxes = [[-1.72, 0, -.6, -1.52, 2.3, -.36], [1.52, 0, -.6, 1.72, 2.3, -.36], [1.64, 0, -1.16, 1.9, 2.4, -1.04]];
};

// Open-front ticket office with a true recess, shelves, worktop and an openable hollow drawer.
B.gpt_ticketoffice = f => {
  f.add(mc('gpt-ticketoffice-v1', ({ add }) => {
    const W = 2.12, D = 1.25;
    add(G.box(W, .09, D, .025), C.woodD, 0, .045, -.16);
    add(G.box(W, 1.85, .1, .02), C.mint, 0, .96, -.74);
    for (const x of [-1.01, 1.01]) add(G.box(.1, 1.85, D, .025), C.mint, x, .96, -.16);
    for (let y = .3; y < 1.8; y += .24) add(G.box(1.9, .018, .015, .004), '#ded2b9', 0, y, -.678);
    add(G.box(W + .18, .14, .86, .035), C.green, 0, 1.98, -.42, -.06);
    for (let x = -.96; x < 1.1; x += .2) add(G.box(.025, .025, .84, .004), '#a2c8bb', x, 2.06, -.42, -.06);
    // Hollow counter: base, side cheeks and top, with no solid filler in the drawer cavity.
    add(G.box(2, .11, .76, .02), C.woodD, 0, .15, .05);
    for (const x of [-.95, .95]) add(G.box(.1, .68, .76, .02), C.wood, x, .52, .05);
    add(G.box(2.18, .1, .96, .035), C.wood, 0, .89, .11);
    add(G.box(1.85, .18, .07, .015), C.mint, 0, .31, .45);
    for (const x of [-.84, .84]) add(G.box(.1, .81, .09, .02), C.woodD, x, 1.37, .4);
    add(G.box(1.78, .11, .1, .02), C.woodD, 0, 1.78, .4);
    // A shelf on the rear wall with tickets and binders: visible through the actual opening.
    for (const y of [1.17, 1.53]) add(G.box(1.6, .055, .25, .012), C.wood, 0, y, -.53);
    for (let k = 0; k < 6; k++) add(G.box(.12, .23 + .02 * (k % 2), .17, .008), [C.coral, C.green, C.yellow][k % 3], -.61 + k * .19, 1.31, -.54);
    add(G.box(.38, .19, .29, .035), '#a09769', -.42, 1.035, .11);
    add(G.box(.31, .045, .18, .01), C.cream, -.42, 1.15, .14, -.16);
    for (let k = 0; k < 3; k++) add(G.box(.26, .016, .16, .006), '#f6e5bd', .08, .951 + k * .022, .2);
    add(G.cyl(.095, .11, .13, 10), C.coral, .67, 1.005, .1); flowers(add, .67, 1.10, .1, 3);
    // A chunky station clock mounted on the side wall, front facing.
    add(G.cyl(.25, .25, .07, 20), C.woodD, -.57, 1.62, -.65, HP);
    add(G.cyl(.215, .215, .015, 20), C.white, -.57, 1.62, -.605, HP);
    add(G.box(.024, .14, .012, .004), C.dark, -.57, 1.67, -.59);
    add(G.box(.12, .024, .012, .004), C.dark, -.52, 1.62, -.59);
  }));
  sign(f.group, '기차표', 1.68, .23, 0, 1.78, .46, C.green, C.dark);
  sign(f.group, '27', .28, .25, .68, .54, .503, C.cream, C.dark);
  const dr = grp(); put(dr, -.18, .65, .45); f.add(dr);
  dr.add(mc('gpt-ticketdrawer-v1', ({ add }) => {
    add(G.box(1.31, .36, .065, .02), C.mint, 0, 0, 0);
    add(G.box(1.22, .045, .58, .012), '#c4a476', 0, -.16, -.3);
    add(G.box(1.22, .27, .035, .008), C.wood, 0, -.01, -.59);
    for (const x of [-.62, .62]) add(G.box(.035, .27, .58, .008), C.wood, x, -.01, -.3);
    add(G.box(.24, .045, .07, .015), C.woodD, 0, .03, .055);
    add(G.box(.29, .08, .14, .01), C.cream, -.35, -.1, -.32);
  }));
  const p = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + t * .59; }, { label: '매표소 표 서랍', sfx: 'drawer' });
  f.spot('inside', dr, .24, -.125, -.28, { part: p, maxH: .29, scale: .9, label: '매표소 서랍 안' });
  f.spot('on', null, .31, .95, .27, { maxH: .42, scale: 1, label: '매표소 카운터' });
};

B.gpt_ticketgate = f => {
  f.add(mc('gpt-ticketgate-v1', ({ add }) => {
    for (const x of [-.54, .54]) {
      add(G.box(.3, .82, .83, .055), C.green, x, .41, 0);
      add(G.box(.32, .08, .87, .035), C.cream, x, .86, 0);
      add(G.box(.14, .025, .22, .008), C.dark, x, .914, .16);
      add(G.box(.12, .012, .1, .005), C.yellow, x, .935, .17);
      add(G.box(.13, .1, .025, .01), '#a2c8bb', x, .69, .428);
    }
    // Two short reader flaps leave the central passage open.
    add(G.box(.15, .34, .1, .025), C.coral, -.3, .55, 0);
    add(G.box(.15, .34, .1, .025), C.coral, .3, .55, 0);
  }));
};

// The vending facade stays shut. Its pickup hatch opens onto a stocked, modelled delivery bay.
B.gpt_drinkmachine = f => {
  // Closed cabinet is exactly the 1.72 m vending reference; hatch follows it.
  f.group.scale.y = 1.72 / 1.88;
  f.add(mc('gpt-drinkmachine-v1', ({ add }) => {
    add(G.box(.98, .1, .72, .035), C.dark, 0, .05, 0);
    add(G.box(.98, 1.7, .1, .03), C.coral, 0, .94, -.31);
    for (const x of [-.44, .44]) add(G.box(.1, 1.7, .7, .025), C.coral, x, .94, 0);
    add(G.box(.98, .1, .7, .025), C.coral, 0, 1.83, 0);
    add(G.box(.98, .1, .7, .02), C.coral, 0, .12, 0);
    // Full-front product panel over the pickup compartment, not a texture on the box.
    add(G.box(.77, 1.02, .055, .025), C.cream, -.025, 1.2, .36);
    add(G.box(.58, .72, .025, .018), '#a2c8bb', -.08, 1.29, .402);
    for (const y of [1.03, 1.36]) {
      add(G.box(.56, .045, .14, .008), C.white, -.08, y - .1, .45);
      for (let k = 0; k < 3; k++) {
        const x = -.26 + k * .18;
        add(G.cyl(.055, .055, .2, 10), [C.green, C.yellow, C.coral][k], x, y + .045, .468);
        add(G.cyl(.057, .057, .018, 10), C.steel, x, y + .154, .468);
        add(G.box(.07, .045, .008, .004), C.white, x, y + .04, .524);
        add(G.box(.09, .025, .02, .006), C.green, x, y - .15, .503);
      }
    }
    add(G.box(.12, .24, .045, .012), C.dark, .32, .95, .408);
    add(G.box(.035, .12, .012, .004), C.steel, .32, .98, .437);
    // Delivery bay: bottom, back and side walls, a real can waiting inside.
    add(G.box(.75, .055, .59, .01), C.dark, 0, .2, .02);
    add(G.box(.75, .45, .045, .008), '#a09769', 0, .43, -.21);
    for (const x of [-.36, .36]) add(G.box(.04, .44, .6, .008), '#a09769', x, .43, .04);
    add(G.cyl(.065, .065, .23, 10), C.yellow, -.21, .34, .08);
    add(G.cyl(.067, .067, .018, 10), C.steel, -.21, .465, .08);
  }));
  sign(f.group, '시원한 음료', .73, .16, 0, 1.69, .4, C.coral, C.dark);
  const hatch = grp(); put(hatch, 0, .65, .39); f.add(hatch);
  hatch.add(mc('gpt-drinkhatch-v1', ({ add }) => {
    add(G.box(.73, .4, .045, .018), C.cream, 0, -.2, 0);
    add(G.box(.25, .035, .03, .01), C.dark, 0, -.32, .04);
  }));
  const p = f.part('lid', hatch, t => { hatch.rotation.x = -1.9 * t; }, { label: '자판기 음료 꺼내는 곳' });
  f.spot('inside', null, .16, .23, .1, { part: p, maxH: .32 * 1.72 / 1.88, scale: .85, label: '자판기 배출함 안' });
};

B.gpt_timetable = f => {
  f.add(mc('gpt-timetable-v1', ({ add }) => {
    for (const x of [-.51, .51]) {
      add(G.box(.09, 1.8, .11, .018), C.woodD, x, .9, 0);
      add(G.box(.24, .06, .32, .025), C.stone, x, .03, 0);
    }
    add(G.box(1.3, 1.05, .12, .035), C.green, 0, 1.35, 0);
    add(G.box(1.15, .74, .025, .012), C.cream, 0, 1.27, .08);
    for (let k = 0; k < 4; k++) {
      add(G.box(.85, .022, .016, .003), '#d4c6aa', .04, 1.03 + k * .15, .104);
      add(G.box(.1, .06, .016, .004), k % 2 ? C.coral : C.green, -.42, 1.08 + k * .15, .106);
    }
    add(G.box(1.43, .09, .32, .03), C.green, 0, 1.91, 0);
  }));
  sign(f.group, '기차 시간표', 1.16, .18, 0, 1.75, .076, C.green, C.dark);
  sign(f.group, '08:12   08:35', .82, .13, .02, 1.43, .112, C.cream, C.dark);
  sign(f.group, '09:06   09:28', .82, .13, .02, 1.14, .112, C.cream, C.dark);
};

B.gpt_crossing = (f, T, o = {}) => {
  const flip = o.flip ? -1 : 1;
  f.add(mc('gpt-crossing|' + flip, ({ add }) => {
    add(G.box(.33, .11, .38, .03), C.stone, 0, .055, 0);
    for (let k = 0; k < 9; k++) add(G.cyl(.046, .046, .16, 8), k % 2 ? C.dark : C.yellow, 0, .2 + k * .16, 0);
    for (const a of [-.65, .65]) add(G.box(.65, .09, .06, .015), C.yellow, 0, 1.8, 0, 0, 0, a);
    add(G.box(.61, .07, .07, .012), C.dark, 0, 1.42, .035);
    for (const x of [-.23, .23]) add(G.cyl(.12, .12, .09, 12), C.dark, x, 1.42, .075, HP);
    add(G.box(.25, .36, .28, .025), '#c6c393', 0, .26, .18);
    add(G.box(.24, .23, .19, .03), C.dark, 0, .8, .1);
    for (let k = 0; k < 8; k++) add(G.box(.18, .085, .07, .012), k % 2 ? C.dark : C.yellow, flip * (.12 + k * .18), .8, .22);
  }));
  const lens = [-.23, .23].map(x => {
    const m = new THREE.MeshBasicMaterial({ color: '#be6464' });
    const l = new THREE.Mesh(G.cyl(.082, .082, .022, 12), m); put(l, x, 1.42, .132, HP); l.userData.noMerge = true; f.add(l); return m;
  });
  const on = new THREE.Color('#f27774'), off = new THREE.Color('#874c54'); let last = -1;
  f.tick = t => { const k = Math.floor(t * 1.4) % 2; if (k === last) return; last = k; lens[0].color.copy(k ? on : off); lens[1].color.copy(k ? off : on); };
};

B.gpt_sakura = (f, T, o = {}) => {
  const small = !!o.small, k = small ? .72 : 1;
  // One trackside instance may narrow only its blossom crown; trunk/roots/height stay native.
  const crownDepth = Math.max(.5, Math.min(1, o.crownDepth ?? 1));
  f.collideBox = [-.36, 0, -.34, .36, 1.5 * k, .34];
  f.add(mc('gpt-sakura|' + k + '|' + crownDepth, ({ add, tube }) => {
    add(G.cyl(.16 * k, .26 * k, 1.62 * k, 10), '#c67f2a', 0, .81 * k, 0);
    for (const [x, y, z] of [[-.65, 2.01, 0], [.59, 2.12, .1], [.08, 2.42, -.27]]) tube([0, 1.24 * k, 0], [x * k, y * k, z * k], .082 * k, '#c67f2a', 7, .05 * k);
    // A filled, asymmetric crown with smaller scallops; no circular arrangement or flattened ring of highlights.
    const clouds = [[0, 2.3, 0, .52], [-.55, 2.05, .08, .42], [.5, 2.18, 0, .45], [-.28, 2.42, -.25, .43],
      [.23, 2.57, .1, .4], [-.3, 2.11, .52, .38], [.45, 2.25, .48, .34], [-.7, 2.3, -.32, .3], [.72, 2.09, -.3, .3]];
    for (const [j, [x, y, z, r]] of clouds.entries()) {
      add(G.sph(r * k, 10, 7), j % 3 ? C.pink : C.rose, x * k, y * k, z * k * crownDepth, 0, 0, 0, [1.12, .93, crownDepth]);
      add(G.sph(r * .66 * k, 8, 6), '#f4afd0', (x + r * .13) * k, (y + r * .37) * k, (z + r * .15) * k * crownDepth, 0, 0, 0, [1.1, .8, crownDepth]);
      // A few explicit five-petal blossoms on the sunlit face, rather than white painted blobs.
      if (j % 2 === 0) for (let b = 0; b < 5; b++) {
        const a = b * PI * .4, fx = x + r * .3 + Math.cos(a) * .055, fy = y + r * .5 + Math.sin(a) * .055;
        add(G.sph(.042 * k, 6, 4), C.white, fx * k, fy * k, (z + r * .7) * k * crownDepth, 0, 0, 0, [1, 1, .48 * crownDepth]);
      }
    }
    for (let j = 0; j < 9; j++) add(G.sph(.043, 5, 4), C.pink, Math.sin(j * 2.4) * .65, .018, Math.cos(j * 2.4) * .6, 0, 0, 0, [1.5, .18, 1]);
    add(G.box(.74, .08, .74, .08), '#e8d7b7', 0, .04, 0);
  }));
  // (① 10/22: walkers go round the trunk and its stone, not round the whole crown)
  f.noSolid = true; f.walkBoxes = [[-.37, 0, -.37, .37, 1.2 * k, .37]];
};

// The shared game cat keeps the native face, ears and idle; its envelope is ~.60 m.
B.gpt_stationcat = f => {
  const actor = f.catActor = new ChibiCat({ scale: .44 });
  actor.root.traverse(o => { if (o.isMesh) { o.userData.noMerge = true; delete o.userData.char; } });
  f.add(actor.root); f.live = [actor.root]; actor.update(0);
  let last = null;
  f.tick = t => { const dt = last == null ? 0 : Math.max(0, Math.min(.1, t - last)); last = t; actor.update(dt); };
};

export const GPTST_V1_BUILDERS = B;
export const GPTST_V1_INFO = {
  gpt_railway: { w: 9, d: 7, name: '벚꽃역 선로와 광장 마감', floor: true, hidden: true },
  gpt_localtrain: { w: 6, d: 1, name: '봄빛 로컬 열차', hidden: true },
  gpt_platformroof: { w: 4, d: 2, name: '벚꽃역 승강장 지붕', hidden: true },
  gpt_ticketoffice: { w: 2, d: 2, name: '작은 역 매표 창구', hidden: true },
  gpt_ticketgate: { w: 2, d: 1, name: '동네 역 개찰구', hidden: true },
  gpt_drinkmachine: { w: 1, d: 1, name: '승강장 음료 자판기', hidden: true },
  gpt_timetable: { w: 2, d: 1, name: '벚꽃역 시간표', hidden: true },
  gpt_crossing: { w: 1, d: 1, name: '건널목 차단기와 경보등', hidden: true },
  gpt_sakura: { w: 2, d: 2, name: '동네 역 벚나무', hidden: true },
  gpt_stationcat: { w: 1, d: 1, name: '역을 지키는 고양이', hidden: true },
};

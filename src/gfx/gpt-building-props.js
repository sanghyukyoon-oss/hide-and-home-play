// 내 방 건축 가구: 방을 막지 않는 창·아치·실내 발코니와 실제 수납이 있는 창가 벤치.
// Every builder is centred on its integer footprint and faces +z. Openings remain empty geometry;
// the bay seat's upholstered lid is the only moving piece, and exposes a real lined storage box.
import * as THREE from 'three';
import { grp, put, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const B = {}, PI = Math.PI;
const palette = T => ({ wood: T?.fwood || '#eecfa3', edge: T?.fwoodD || '#c58f59', cream: '#f6e8d0',
  sage: '#a2c8bb', sageD: '#79a58e', soil: '#886346', leaf: '#92b58d', leafD: '#648d73', coral: '#e6a18a' });
const key = P => Object.values(P).join(',');

// A substantial timber between points in the horizontal plane. All the rail pieces meet their posts.
function bar(add, a, b, y, h, d, color) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  add(G.box(Math.hypot(dx, dz), h, d, .025), color, (a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, 0, -Math.atan2(dz, dx), 0);
}
function sprig(add, tube, x, y, z, P, s = 1) {
  tube([x, y, z], [x, y + .3 * s, z], .017 * s, P.leafD, 6);
  for (const [dx, dy, dz, rz] of [[-.08, .12, 0, -.65], [.09, .2, .015, .6], [-.04, .28, .015, -.3]])
    add(G.sph(.085, 8, 6), dy > .15 ? P.leaf : P.leafD, x + dx * s, y + dy * s, z + dz * s, 0, 0, rz, [.95 * s, 1.35 * s, .48 * s]);
}
function planter(add, tube, x, y, z, P, w = .65) {
  add(G.box(w, .25, .31, .055), P.cream, x, y + .125, z);
  add(G.box(w + .04, .055, .35, .018), P.edge, x, y + .25, z);
  add(G.box(w - .075, .012, .245, .005), P.soil, x, y + .28, z);
  for (const dx of [-w * .28, w * .22]) sprig(add, tube, x + dx, y + .28, z, P, .78);
}

// A half-height wall and a broad OPEN serving window. There is no hidden glass or wall in the opening.
B.gpt_window_partition = (f, T) => {
  const P = palette(T);
  f.add(mc('gptWindowPartition|' + key(P), ({ add, tube }) => {
    add(G.box(2.72, .13, .48, .035), P.edge, 0, .065, 0);
    add(G.box(2.58, .68, .19, .035), P.cream, 0, .46, -.05);
    for (const x of [-.83, 0, .83]) {
      add(G.box(.72, .47, .045, .025), P.sage, x, .46, .067);
      add(G.box(.61, .36, .026, .02), shade(P.sage, .055), x, .46, .099);
    }
    // Two feet let this be placed freely in a room, rather than pretending to be an exterior wall.
    for (const s of [-1, 1]) {
      add(G.box(.24, 1.81, .24, .045), P.wood, s * 1.22, .965, -.05);
      add(G.box(.42, .13, .73, .045), P.edge, s * 1.22, .065, -.05);
      add(G.box(.29, .085, .29, .02), P.edge, s * 1.22, 1.76, -.05);
    }
    add(G.box(2.83, .17, .32, .05), P.wood, 0, 1.87, -.05);
    add(G.box(2.78, .13, .53, .045), P.wood, 0, .86, .035);
    // Short uprights frame the large window without dividing its usable centre.
    for (const s of [-1, 1]) add(G.box(.075, .86, .1, .018), P.edge, s * .98, 1.34, -.05);
    add(G.box(.5, .065, .29, .02), P.cream, -.69, .96, .02);
    add(G.box(.4, .075, .26, .018), P.coral, -.71, 1.03, .02);
    add(G.box(.42, .04, .27, .01), P.cream, -.71, 1.087, .02);
    // A little potted sprig balances the books; the centre sill stays clear for a findable.
    add(G.cyl(.105, .075, .18, 10), P.coral, .84, 1.01, .01);
    add(G.cyl(.09, .09, .018, 10), P.soil, .84, 1.105, .01);
    sprig(add, tube, .84, 1.11, .01, P, .82);
  }));
  f.spot('on', null, .03, .931, .035, { maxH: .55, scale: .82, label: '칸막이 열린 창턱' });
  f.spot('behind', null, -.3, 0, -.29, { maxH: .5, scale: .8, label: '칸막이 뒤' });
};

// Three-sided bay frame, soft seat, and a lift lid over an actual four-sided storage compartment.
B.gpt_bay_window_seat = (f, T) => {
  const P = palette(T);
  f.add(mc('gptBaySeat|' + key(P), ({ add, tube }) => {
    // The base is assembled as a box with an empty interior, never a solid block behind an opening lid.
    add(G.box(2.38, .13, 1.27, .045), P.edge, 0, .065, -.025);
    add(G.box(2.14, .075, 1.02, .018), P.cream, 0, .17, -.025);
    for (const s of [-1, 1]) add(G.box(.105, .43, 1.08, .025), P.wood, s * 1.07, .39, -.025);
    for (const z of [-.54, .49]) add(G.box(2.09, .43, .105, .025), P.wood, 0, .39, z);
    add(G.box(1.99, .29, .033, .025), P.cream, 0, .39, .55);
    for (const x of [-.67, 0, .67]) add(G.box(.56, .21, .026, .015), P.sage, x, .39, .58);
    // Folded linen lives in the left half; the right compartment is reserved for the hiding spot.
    for (let i = 0; i < 3; i++) add(G.box(.6 - i * .025, .075, .55, .035), i % 2 ? P.cream : P.sage, -.61, .245 + i * .075, -.06);
    add(G.box(.025, .23, .57, .008), P.coral, -.69, .32, -.06);
    // The bay opens to the room behind: three real empty frames, with chunky painted mullions.
    const pts = [[-1.25, -.2], [-.88, -.83], [.88, -.83], [1.25, -.2]];
    for (let i = 0; i < pts.length - 1; i++) {
      bar(add, pts[i], pts[i + 1], .75, .13, .17, P.wood);
      bar(add, pts[i], pts[i + 1], 2.1, .15, .19, P.wood);
      bar(add, pts[i], pts[i + 1], 1.46, .05, .07, P.edge);
    }
    for (const [x, z] of pts) add(G.box(.13, 1.43, .13, .035), P.wood, x, 1.4, z);
    for (const x of [-.3, .3]) add(G.box(.065, 1.2, .065, .018), P.edge, x, 1.42, -.83);
    // Fixed corner bolsters flank, rather than cover, the window and the moving cushion.
    for (const s of [-1, 1]) {
      add(G.box(.12, .51, .88, .035), P.wood, s * 1.19, .77, -.03);
      add(G.box(.2, .13, .94, .05), P.cream, s * 1.19, 1.04, -.03);
    }
    // A pair of visible brass-colour hinge barrels at the back of the seat.
    for (const x of [-.72, .72]) add(G.cyl(.045, .045, .2, 10), '#d5ad66', x, .64, -.57, 0, 0, PI / 2);
  }));
  const lid = grp(); put(lid, 0, .63, -.57); f.add(lid);
  lid.add(mc('gptBayLid|' + key(P), ({ add }) => {
    add(G.box(2.21, .105, 1.12, .035), P.wood, 0, 0, .555);
    add(G.box(2.02, .13, .94, .06), P.sage, 0, .105, .565);
    add(G.box(1.94, .032, .87, .016), shade(P.sage, .065), 0, .18, .565);
    // Piping is geometry, not a stretched box texture.
    for (const s of [-1, 1]) add(G.box(.035, .03, .83, .01), P.cream, s * .952, .183, .565);
    add(G.box(1.89, .03, .035, .01), P.cream, 0, .183, 1.0);
    add(G.box(.55, .21, .34, .085), P.cream, -.58, .29, .78, -.18, -.12, .04);
    add(G.box(.055, .225, .35, .018), P.coral, -.58, .302, .78, -.18, -.12, .04);
    // A raised front lip can be tapped comfortably at phone size.
    add(G.box(.32, .08, .09, .025), P.edge, .02, -.025, 1.135);
  }));
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.22 * t; }, { label: '창가 벤치 수납 뚜껑', sfx: 'open', dur: .42 });
  f.spot('inside', null, .43, .211, -.025, { part: p, maxH: .36, scale: .72, label: '창가 벤치 수납 안' });
  f.spot('on', lid, .42, .202, .62, { maxH: .45, scale: .75, label: '창가 벤치 방석 위' });
};

// A freestanding indoor balcony: a chunky raised deck, one honest step, planted rails and an open entry.
B.gpt_indoor_balcony = (f, T) => {
  const P = palette(T), top = .45;
  f.add(mc('gptIndoorBalcony|' + key(P), ({ add, tube }) => {
    add(G.box(2.76, .18, 1.33, .045), P.edge, 0, top - .09, -.29);
    for (let i = 0; i < 9; i++) add(G.box(.282, .055, 1.22, .015), i % 2 ? P.wood : shade(P.wood, .045), -1.192 + i * .298, top + .0275, -.29);
    for (const x of [-1.2, 1.2]) for (const z of [-.79, .21]) add(G.box(.2, .3, .2, .04), P.edge, x, .15, z);
    add(G.box(.91, .22, .49, .045), P.wood, 0, .11, .68);
    add(G.box(.97, .055, .51, .018), P.cream, 0, .2475, .68);
    // Two front rails stop beside the step; the approach and landing remain clear.
    const rails = [[[-1.28, -.86], [1.28, -.86]], [[-1.28, -.86], [-1.28, .31]],
      [[1.28, -.86], [1.28, .31]], [[-1.28, .31], [-.56, .31]], [[.56, .31], [1.28, .31]]];
    for (const [a, b] of rails) {
      bar(add, a, b, 1.25, .095, .105, P.wood);
      bar(add, a, b, .61, .06, .075, P.wood);
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let d = .25; d < L - .12; d += .27) {
        const t = d / L;
        add(G.box(.065, .59, .065, .017), P.sage, a[0] + (b[0] - a[0]) * t, .93, a[1] + (b[1] - a[1]) * t);
      }
    }
    for (const [x, z] of [[-1.28, -.86], [1.28, -.86], [-1.28, .31], [1.28, .31], [-.56, .31], [.56, .31]]) {
      add(G.box(.15, .91, .15, .035), P.edge, x, .92, z);
      add(G.sph(.09, 10, 8), P.wood, x, 1.41, z);
    }
    // Planter boxes sit inside the back rail, leaving both the step and the main deck usable.
    planter(add, tube, -.8, top + .055, -.65, P, .67);
    planter(add, tube, .8, top + .055, -.65, P, .67);
    // One trailing stem and broad leaves make the planter readable without a cloud of tiny dots.
    tube([-.96, .83, -.8], [-1.04, .6, -.89], .017, P.leafD, 6);
    for (let i = 0; i < 3; i++) add(G.sph(.085, 8, 6), i % 2 ? P.leaf : P.leafD, -1.02 + (i % 2) * .08, .76 - i * .1, -.89, 0, 0, -.4, [1.1, .7, .5]);
  }));
  f.spot('on', null, .04, top + .059, -.2, { maxH: .55, scale: .85, label: '실내 발코니 마루' });
  f.spot('under', null, -.38, 0, -.2, { maxH: .26, scale: .6, label: '실내 발코니 마루 밑' });
  // Native companion/boss walking metadata. Areas are conservative usable floor patches; after the walk grid's
  // body-radius inset they stay clear of both planter rims and the rails, including this piece's own obstacles.
  // The low space below the deck is a hiding place only: its .27 m headroom is not a walking route.
  f.walk = {
    areas: [
      { x0: -1.2, x1: 1.2, z0: -.46, z1: .1, y: .505 },
      { x0: -.44, x1: .44, z0: -.76, z1: .37, y: .505 },
      { x0: -.485, x1: .485, z0: .425, z1: .935, y: .275 },
    ],
    paths: [
      { width: .65, points: [[0, 0, 1.35], [0, .275, .68]] },
      { width: .65, points: [[0, .275, .68], [0, .505, .1]] },
    ],
  };
  f.walkSolids = [
    [-1.38, 0, -.955, 1.38, .505, .375],             // supported deck: no character underneath
    [-.485, 0, .425, .485, .275, .935],             // actual entry step
    [-1.37, .45, -.95, 1.37, 1.5, -.77],           // rear rail/newels
    [-1.37, .45, -.95, -1.19, 1.5, .4],            // side rails
    [1.19, .45, -.95, 1.37, 1.5, .4],
    [-1.37, .45, .22, -.47, 1.5, .4],              // split front rail: .94 m clear opening
    [.47, .45, .22, 1.37, 1.5, .4],
    [-1.16, .505, -.83, -.44, 1.17, -.47],          // real planter rims and foliage
    [.44, .505, -.83, 1.16, 1.17, -.47],
  ];
};

// A U-shaped extruded profile gives the arch a real doorway all the way down to the floor.
function archProfile(ro, ri, spring = 1.18) {
  const s = new THREE.Shape();
  s.moveTo(-ro, .08); s.lineTo(-ro, spring); s.absarc(0, spring, ro, PI, 0, true);
  s.lineTo(ro, .08); s.lineTo(ri, .08); s.lineTo(ri, spring); s.absarc(0, spring, ri, 0, PI, false);
  s.lineTo(-ri, .08); s.closePath(); return s;
}
B.gpt_cream_arch = (f, T) => {
  const P = palette(T);
  f.add(mc('gptCreamArch|' + key(P), ({ add, tube }) => {
    add(G.ext(archProfile(.94, .64), .31, .025, 16), P.cream, 0, 0, -.155);
    add(G.ext(archProfile(.865, .79), .045, .012, 16), P.wood, 0, 0, .182);
    for (const s of [-1, 1]) {
      add(G.box(.42, .13, .72, .045), P.wood, s * .79, .065, 0);
      add(G.box(.3, .11, .39, .025), P.sage, s * .79, .22, 0);
    }
    // A side shelf makes a usable hiding place without crossing the doorway opening.
    add(G.box(.38, .09, .41, .025), P.wood, -.8, .83, .25);
    tube([-.92, .62, .17], [-.92, .78, .39], .025, P.edge, 6);
    add(G.box(.19, .075, .13, .025), P.sage, .8, 1.03, .233);
    add(G.sph(.045, 8, 6), P.coral, .8, 1.08, .305);
  }));
  f.spot('on', null, -.8, .877, .27, { maxH: .36, scale: .6, label: '아치 옆 작은 선반' });
  f.spot('behind', null, 0, 0, -.06, { maxH: .6, scale: .88, label: '아치의 열린 통로' });
  // The real feet leave a 1.16 m opening. Keep only the two column volumes solid at ground level;
  // a bounding box around the whole arch would incorrectly turn its doorway into an invisible wall.
  f.walkSolids = [[-1, 0, -.36, -.58, 1.2, .47], [.58, 0, -.36, 1, 1.2, .36]];
};

// Two turned wooden columns and a pegged lintel: an airy threshold for a reading or dining corner.
B.gpt_timber_portal = (f, T) => {
  const P = palette(T);
  f.add(mc('gptTimberPortal|' + key(P), ({ add, tube }) => {
    for (const s of [-1, 1]) {
      const x = s * 1.1;
      add(G.box(.52, .13, .64, .045), P.edge, x, .065, 0);
      add(G.box(.4, .105, .42, .025), P.cream, x, .18, 0);
      add(G.cyl(.13, .15, 1.56, 12), P.wood, x, 1.015, 0);
      add(G.box(.36, .14, .36, .03), P.cream, x, 1.86, 0);
      for (const y of [.32, .43, 1.7]) add(G.cyl(.175, .175, .08, 12), P.edge, x, y, 0);
      // A short knee brace terminates at the post and the beam, clear of the centre passage.
      tube([x, 1.48, 0], [x - s * .4, 1.94, 0], .065, P.edge, 8);
      add(G.cyl(.035, .035, .032, 8), P.edge, x, 1.99, .155, PI / 2, 0, 0);
    }
    add(G.box(2.77, .23, .33, .055), P.wood, 0, 2, 0);
    add(G.box(2.86, .075, .4, .025), P.cream, 0, 2.15, 0);
    // A tiny trailing plant is kept at one end, so a cushion-sized findable fits on the lintel centre.
    add(G.cyl(.105, .08, .18, 10), P.coral, -.98, 2.278, 0);
    add(G.cyl(.09, .09, .018, 10), P.soil, -.98, 2.374, 0);
    sprig(add, tube, -.98, 2.38, 0, P, .72);
    tube([-1.04, 2.4, .06], [-1.23, 2.08, .18], .018, P.leafD, 6);
    for (let i = 0; i < 3; i++) add(G.sph(.08, 8, 6), P.leaf, -1.12 - .05 * i, 2.32 - i * .105, .16, 0, 0, -.5, [1, .8, .5]);
  }));
  f.spot('on', null, .04, 2.189, 0, { maxH: .42, scale: .7, label: '나무 기둥 들보 위' });
  f.spot('behind', null, .02, 0, -.08, { maxH: .6, scale: .88, label: '나무 기둥 사이' });
  // Base feet are the widest ground obstruction; the 1.68 m centre remains a real traversable passage.
  // The high braces and lintel sit above a ground character's head and do not close that passage.
  f.walkSolids = [[-1.36, 0, -.32, -.84, 1.94, .32], [.84, 0, -.32, 1.36, 1.94, .32]];
};

export const GPT_BUILDING_BUILDERS = B;
export const GPT_BUILDING_INFO = {
  gpt_window_partition: { w: 3, d: 1, name: '열린 창 칸막이', price: 480, ch: 1, region: 'home' },
  gpt_bay_window_seat: { w: 3, d: 2, name: '햇살 수납 창가', price: 980, ch: 2, region: 'home' },
  gpt_indoor_balcony: { w: 3, d: 2, name: '작은 정원 발코니', price: 890, ch: 2, region: 'home' },
  gpt_cream_arch: { w: 2, d: 1, name: '크림 아치 통로', price: 620, ch: 1, region: 'home' },
  gpt_timber_portal: { w: 3, d: 1, name: '나무 기둥과 들보', price: 540, ch: 1, region: 'home' },
};

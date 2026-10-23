// Corner-shop home's upstairs belongings. Builder origin is the footprint centre,
// on its own floor, facing +z; the map supplies the upstairs floor height.
// HG/hmc is the existing kit STYLE/toon pipeline, with one cached static mesh.
import { grp, put } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const C = {
  wood: '#eecfa3', honey: '#eaa440', edge: '#c67f2a', dark: '#6f4b30',
  cream: '#fef2e1', paper: '#fefde9', sage: '#a2c8bb', green: '#84ae9d',
  olive: '#c6c393', orange: '#f8b15b', clay: '#ee9d4c', sky: '#b0e5e8',
};
const B = {};

// A wooden futon bed, softly rumpled quilt and one narrow bedside shelf.
// Quilt hinge is along its back seam: opening folds the foot fully upward,
// leaving a phone-readable .8-wide target volume on the real mattress.
B.gpt_homebed = f => {
  f.add(mc('gpt-homebed-body-v1', ({ add }) => {
    for (const x of [-.62, .62]) for (const z of [-.74, .74])
      add(G.box(.11, .2, .11, .02), C.edge, x - .12, .1, z);
    add(G.box(1.46, .14, 1.76, .035), C.edge, -.12, .22, 0);
    add(G.box(1.4, .07, 1.7, .025), C.wood, -.12, .31, 0);
    add(G.box(1.34, .11, 1.63, .05), C.cream, -.12, .39, -.015);
    add(G.box(1.46, .42, .1, .03), C.wood, -.12, .52, -.84);
    add(G.box(1.49, .07, .13, .025), C.honey, -.12, .75, -.84);
    for (const x of [-.67, -.12, .43])
      add(G.box(.035, .28, .035, .015), C.edge, x, .53, -.774);
    add(G.box(.92, .16, .37, .065), C.paper, -.12, .515, -.59, 0, .045, 0);
    add(G.box(.79, .035, .027, .012), C.wood, -.12, .596, -.59, 0, .045, 0);
    // Bedside shelf is part of this footprint, not another floor slab.
    add(G.box(.28, .36, .39, .025), C.wood, .82, .18, -.52);
    add(G.box(.31, .055, .42, .02), C.honey, .82, .39, -.52);
    add(G.box(.19, .055, .24, .02), C.sage, .82, .445, -.53, 0, -.1, 0);
    add(G.box(.15, .024, .2, .01), C.paper, .82, .48, -.53, 0, -.1, 0);
    add(G.cyl(.063, .055, .12, 10), C.clay, .81, .55, -.53);
    add(G.sph(.075, 8, 6), C.green, .81, .65, -.53, 0, 0, 0, [1.1, .8, .9]);
    add(G.sph(.045, 8, 6), C.olive, .86, .69, -.52);
    // A pair of house slippers just beside the foot of the low bed.
    for (const x of [.12, .3]) {
      add(G.box(.12, .035, .24, .025), C.edge, x, .025, 1.06);
      add(G.box(.12, .07, .135, .035), C.orange, x, .07, 1.11);
      add(G.box(.09, .03, .045, .015), C.cream, x, .11, 1.07);
    }
  }));
  const quilt = put(grp(), -.12, .445, -.385); f.add(quilt);
  quilt.add(mc('gpt-homebed-quilt-v1', ({ add }) => {
    add(G.box(1.34, .11, 1.17, .045), C.sage, 0, .02, .585);
    add(G.box(1.36, .075, .22, .03), C.cream, 0, .105, .11);
    add(G.box(1.35, .035, .12, .015), C.orange, 0, .092, .95);
    for (const x of [-.42, 0, .42])
      add(G.box(.03, .022, .71, .01), C.green, x, .086, .56);
    add(G.box(.41, .05, .25, .025), C.olive, .34, .111, .43, 0, -.12, 0);
  }));
  let targetSpot;
  const p = f.part('cushion', quilt, (t, b) => {
    quilt.rotation.x = -1.45 * t;
    quilt.position.y = b.p.y;
    // The hidden belonging unfolds after the fabric has cleared its volume.
    if (targetSpot) targetSpot.anchor.scale.setScalar(Math.max(.001, Math.min(1, (t - .4) / .6)));
  }, { label: '접어 올리는 이불', sfx: 'lift_fabric', dur: .42 });
  targetSpot = f.spot('inside', null, -.12, .482, .3,
    { part: p, maxH: .68, scale: 1.7, label: '이불 속' });
  targetSpot.anchor.scale.setScalar(.001);
  f.gptTargetSpot = targetSpot;
  f.spot('under', null, -.12, .025, .14,
    { maxH: .13, scale: .55, label: '낮은 침대 아래' });
};

// An occupied desk: large readable monitor, noodles, notebook, lamp, cable
// and a fully modelled open-top drawer rather than a facade on a solid box.
B.gpt_homedesk = f => {
  f.add(mc('gpt-homedesk-body-v1', ({ add, tube }) => {
    add(G.box(1.86, .085, .74, .03), C.wood, 0, .755, -.07);
    add(G.box(1.74, .06, .08, .02), C.edge, 0, .663, -.37);
    for (const z of [-.35, .22]) add(G.box(.075, .7, .075, .02), C.edge, -.82, .35, z);
    // Right cabinet shell, open towards +z.
    for (const x of [.31, .84]) add(G.box(.05, .67, .64, .02), C.wood, x, .36, -.075);
    add(G.box(.53, .62, .045, .02), C.edge, .575, .35, -.375);
    add(G.box(.53, .045, .62, .02), C.edge, .575, .05, -.06);
    add(G.box(.53, .045, .62, .02), C.wood, .575, .45, -.06);
    // Books and a file box in the lower open cubby.
    add(G.box(.2, .24, .32, .02), C.cream, .69, .19, -.13);
    add(G.box(.13, .06, .027, .012), C.orange, .69, .23, .047);
    for (let i = 0; i < 3; i++) {
      add(G.box(.065, .27 + i * .025, .3, .015), [C.sage, C.orange, C.olive][i], .38 + i * .077, .23 + i * .0125, -.12);
      add(G.box(.035, .025, .026, .01), C.paper, .38 + i * .077, .29, .042);
    }
    // Monitor with a pale desktop and two chunky application cards.
    add(G.box(.31, .035, .16, .015), C.edge, -.17, .815, -.19);
    add(G.box(.065, .16, .065, .02), C.edge, -.17, .9, -.22);
    add(G.box(.68, .42, .065, .03), C.dark, -.17, 1.125, -.245);
    add(G.box(.61, .345, .025, .02), C.sky, -.17, 1.133, -.197);
    add(G.box(.24, .205, .02, .015), C.paper, -.29, 1.148, -.173);
    add(G.box(.19, .14, .02, .015), C.sage, -.025, 1.12, -.172);
    add(G.box(.24, .035, .024, .01), C.orange, -.29, 1.233, -.156);
    add(G.box(.43, .045, .17, .02), C.cream, -.2, .826, .14);
    for (let i = 0; i < 3; i++) add(G.box(.35, .018, .025, .008), C.olive, -.2, .856, .091 + i * .046);
    add(G.box(.1, .045, .135, .025), C.sage, .13, .826, .14);
    // A 15 cm noodle cup, with its lid and chopsticks scaled together from
    // the tabletop contact point. Keep everyday stock smaller than furniture.
    const cupPoint = a => [.69 + (a[0] - .69) * .8, .805 + (a[1] - .805) * .8, .1 + (a[2] - .1) * .8];
    const cupAdd = (geometry, color, x, y, z, ...angles) => add(geometry.scale(.8, .8, .8), color, ...cupPoint([x, y, z]), ...angles);
    cupAdd(G.cyl(.095, .073, .17, 12), C.cream, .69, .89, .1);
    cupAdd(G.cyl(.097, .096, .055, 12), C.orange, .69, .886, .1);
    cupAdd(G.cyl(.079, .079, .015, 12), '#e8d7b7', .69, .985, .1);
    cupAdd(G.box(.14, .025, .1, .015), C.paper, .69, 1.006, .025, -.42, 0, 0);
    tube(cupPoint([.59, .999, .095]), cupPoint([.79, 1.035, .15]), .01, C.edge, 6);
    tube(cupPoint([.6, 1.005, .14]), cupPoint([.78, 1.032, .055]), .01, C.edge, 6);
    // Two books beside the screen and an open notebook near the left edge.
    for (let i = 0; i < 2; i++) add(G.box(.24, .045, .2, .015), i ? C.orange : C.sage, .63, .827 + i * .055, -.245, 0, i ? .08 : -.05, 0);
    add(G.box(.29, .035, .22, .02), C.paper, -.67, .818, .13, 0, -.1, 0);
    add(G.box(.025, .042, .21, .01), C.edge, -.67, .825, .13, 0, -.1, 0);
    // A friendly pale-sage desk lamp, no emissive/bloom material.
    add(G.cyl(.11, .12, .045, 12), C.green, -.68, .824, -.235);
    tube([-.68, .847, -.235], [-.68, 1.1, -.235], .022, C.edge, 8);
    tube([-.68, 1.1, -.235], [-.57, 1.21, -.18], .022, C.edge, 8);
    add(G.cyl(.045, .13, .11, 12, true), C.sage, -.55, 1.22, -.16, .25, 0, -.25);
    add(G.sph(.035, 8, 6), C.paper, -.55, 1.17, -.15);
    // The real cable follows the rear leg down to a warm cream power strip.
    tube([-.17, 1.0, -.29], [-.32, .86, -.37], .014, C.dark, 6);
    tube([-.32, .86, -.37], [-.7, .69, -.4], .014, C.dark, 6);
    tube([-.7, .69, -.4], [-.73, .08, -.37], .014, C.dark, 6);
    tube([-.73, .08, -.37], [-.47, .055, -.22], .014, C.dark, 6);
    add(G.box(.25, .055, .09, .02), C.cream, -.43, .04, -.19, 0, .2, 0);
    // A stool tucked below the work-tray; tray and stool have a clear gap.
    add(G.cyl(.2, .2, .07, 12), C.sage, -.37, .425, .15);
    for (const [x, z] of [[-.51, .04], [-.23, .04], [-.51, .26], [-.23, .26]])
      add(G.box(.05, .39, .05, .02), C.edge, x, .2, z);
  }));
  // A broad pull-out work tray under the left half. Its raised inner board
  // supports a .8-wide cup; shallow edges stay below that cup's base.
  f.add(mc('gpt-homedesk-trayrails-v2', ({ add }) => {
    for (const x of [-.73, .23]) add(G.box(.035, .045, .68, .015), C.edge, x, .68, -.065);
  }));
  const drawer = put(grp(), -.25, .6, .32); f.add(drawer);
  drawer.add(mc('gpt-homedesk-drawer-v2', ({ add }) => {
    add(G.box(.92, .11, .055, .02), C.sage, 0, -.025, 0);
    add(G.box(.9, .035, .78, .015), C.wood, 0, -.079, -.39);
    for (const x of [-.438, .438]) add(G.box(.035, .09, .76, .015), C.edge, x, -.035, -.39);
    add(G.box(.89, .09, .035, .015), C.edge, 0, -.035, -.765);
    add(G.box(.82, .065, .72, .025), C.cream, 0, -.006, -.39);
    add(G.box(.2, .045, .05, .02), C.orange, 0, -.02, .05);
  }));
  let targetSpot;
  const p = f.part('drawer', drawer, (t, b) => {
    drawer.position.z = b.p.z + .85 * t;
    // Grow the belonging only after the tray has emerged beyond the desktop.
    if (targetSpot) targetSpot.anchor.scale.setScalar(Math.max(.001, Math.min(1, (t - .65) / .35)));
  }, { label: '책상 넓은 작업 트레이', sfx: 'drawer', dur: .42 });
  targetSpot = f.spot('inside', drawer, 0, .035, -.39,
    { part: p, maxH: .78, scale: 1.5, label: '펼친 책상 작업 트레이' });
  targetSpot.anchor.scale.setScalar(.001);
  f.gptTargetSpot = targetSpot;
  f.spot('under', null, -.08, .035, -.24,
    { maxH: .24, scale: .65, label: '책상 아래' });
};

// One-burner kitchenette. The front is a real two-bay cupboard with a sliding
// right door; the open left bay, bowl shelf and kettle remain visibly occupied.
B.gpt_homelife = f => {
  // Keep the footprint and sliding-door anchors; the counter surface is 0.92 m.
  f.group.scale.y = .92 / .8825;
  f.add(mc('gpt-homelife-body-v1', ({ add, tube }) => {
    for (const x of [-.35, .35]) for (const z of [-.26, .25])
      add(G.box(.07, .13, .07, .02), C.edge, x, .065, z);
    add(G.box(.84, .065, .65, .025), C.edge, 0, .155, -.02);
    for (const x of [-.395, 0, .395])
      add(G.box(.05, .63, .65, .02), C.wood, x, .485, -.02);
    add(G.box(.81, .63, .045, .02), C.edge, 0, .485, -.325);
    add(G.box(.8, .045, .62, .02), C.wood, 0, .455, -.02);
    add(G.box(.9, .085, .73, .03), C.cream, 0, .84, -.025);
    add(G.box(.88, .68, .065, .025), C.cream, 0, 1.21, -.355);
    // A substantial upper shelf and two brackets, entirely inside the footprint.
    add(G.box(.88, .06, .28, .02), C.wood, 0, 1.52, -.18);
    for (const x of [-.32, .32]) {
      add(G.box(.055, .25, .055, .02), C.edge, x, 1.385, -.29);
      tube([x, 1.27, -.29], [x, 1.49, -.08], .02, C.edge, 6);
    }
    // Stacked bowls are open, not capped cylinders.
    for (let i = 0; i < 3; i++) {
      add(G.cyl(.12, .075, .07, 12, true), i === 1 ? C.sage : C.paper, -.2, 1.59 + i * .045, -.17);
      add(G.cyl(.075, .075, .02, 12), C.cream, -.2, 1.56 + i * .045, -.17);
    }
    add(G.cyl(.075, .075, .18, 10), C.orange, .16, 1.64, -.19);
    add(G.cyl(.082, .082, .035, 10), C.wood, .16, 1.745, -.19);
    add(G.box(.11, .07, .025, .012), C.paper, .16, 1.65, -.102);
    // A shallow sink/dish basin on the left: actual bottom plus raised walls.
    add(G.box(.34, .035, .28, .02), C.green, -.22, .898, .025);
    for (const x of [-.375, -.065]) add(G.box(.03, .065, .28, .012), C.sage, x, .937, .025);
    for (const z of [-.1, .15]) add(G.box(.34, .065, .03, .012), C.sage, -.22, .937, z);
    tube([-.24, .89, -.2], [-.24, 1.11, -.2], .025, C.edge, 8);
    tube([-.24, 1.11, -.2], [-.24, 1.11, -.065], .025, C.edge, 8);
    tube([-.24, 1.11, -.065], [-.24, 1.055, -.065], .025, C.edge, 8);
    // Kettle and a one-ring hotplate.
    add(G.box(.31, .06, .32, .025), C.sage, .205, .91, .02);
    add(G.cyl(.12, .12, .022, 14), C.edge, .205, .953, .01);
    add(G.sph(.135, 12, 8), C.cream, .19, 1.055, .01, 0, 0, 0, [1, .9, 1]);
    add(G.cyl(.09, .095, .035, 12), C.orange, .19, 1.172, .01);
    add(G.sph(.033, 8, 6), C.edge, .19, 1.211, .01);
    tube([.295, 1.065, .01], [.395, 1.14, .01], .034, C.cream, 8, .026);
    add(G.tor(.108, .023, PI * 1.65, 6, 16), C.edge, .09, 1.1, .01, 0, HP, .2);
    add(G.cyl(.028, .028, .035, 10), C.orange, .295, .914, .195, HP, 0, 0);
    // Cupboard goods are set back, leaving a generous empty hiding bay on right.
    for (let i = 0; i < 2; i++) add(G.cyl(.105, .08, .075, 12, true), i ? C.sage : C.cream, -.2, .525 + i * .055, -.11);
    add(G.box(.23, .085, .3, .025), C.cream, -.2, .25, -.09);
    add(G.box(.23, .055, .3, .02), C.orange, -.2, .325, -.09);
    // Thick folded tea towel on the side, with one broad accent stripe.
    add(G.box(.035, .29, .18, .015), C.paper, -.439, .65, .09);
    add(G.box(.022, .045, .185, .01), C.orange, -.461, .565, .09);
  }));
  const door = put(grp(), .203, .487, .325); f.add(door);
  door.add(mc('gpt-homelife-door-v1', ({ add }) => {
    add(G.box(.36, .58, .05, .02), C.sage, 0, 0, 0);
    add(G.box(.105, .045, .055, .02), C.orange, .07, .17, .045);
  }));
  const p = f.part('door', door, (t, b) => {
    door.position.x = b.p.x - .385 * t;
  }, { label: '주방 미닫이 수납문', sfx: 'slide', dur: .34 });
  f.spot('inside', null, .2, .197, -.015,
    { part: p, maxH: .23, scale: .65, label: '주방 수납장 아래칸' });
};

// Slatted laundry hamper with a complete bottom and a heap that lifts to show
// the inside. Generous moving cloth area doubles as the touchable handle.
B.gpt_homelaundry = f => {
  f.add(mc('gpt-homelaundry-body-v1', ({ add }) => {
    add(G.box(.69, .07, .59, .03), C.olive, 0, .065, 0);
    for (const y of [.13, .49]) {
      for (const z of [-.29, .29]) add(G.box(.75, .055, .055, .02), C.wood, 0, y, z);
      for (const x of [-.35, .35]) add(G.box(.055, .055, .58, .02), C.wood, x, y, 0);
    }
    for (const z of [-.29, .29]) for (let i = 0; i < 7; i++)
      add(G.box(.055, .35, .045, .02), C.olive, -.3 + i * .1, .305, z);
    for (const x of [-.35, .35]) for (let i = 0; i < 5; i++)
      add(G.box(.045, .35, .055, .02), C.olive, x, .305, -.22 + i * .11);
    for (const x of [-.35, .35]) {
      add(G.box(.055, .075, .16, .02), C.edge, x, .525, 0);
      add(G.box(.035, .04, .09, .015), C.wood, x, .565, 0);
    }
    add(G.box(.47, .065, .18, .025), C.sage, 0, .13, -.16);
    add(G.box(.37, .065, .18, .025), C.cream, 0, .19, -.16);
  }));
  const laundry = put(grp(), 0, .52, .005); f.add(laundry);
  laundry.add(mc('gpt-homelaundry-cloth-v1', ({ add }) => {
    add(G.box(.61, .085, .47, .04), C.cream, 0, -.015, 0);
    // Folded orange T-shirt: shoulders, sleeves and a wide visible collar.
    add(G.box(.35, .075, .38, .035), C.orange, -.03, .058, .01, 0, -.08, 0);
    for (const x of [-.24, .18]) add(G.box(.15, .065, .16, .03), C.orange, x, .055, -.08, 0, x < 0 ? -.3 : .3, 0);
    add(G.box(.13, .03, .06, .015), C.cream, -.03, .108, -.105);
    add(G.box(.2, .065, .24, .025), C.sage, .13, .14, .03, 0, .16, 0);
    // One little sock visibly caught over the near edge.
    add(G.box(.09, .17, .065, .025), C.paper, .2, -.055, .23, -.2, 0, -.12);
    add(G.box(.14, .06, .09, .025), C.paper, .225, -.13, .255);
    add(G.box(.095, .035, .075, .015), C.green, .2, .015, .23);
  }));
  const p = f.part('lift', laundry, (t, b) => {
    laundry.position.y = b.p.y + .16 * t;
    laundry.rotation.z = -.13 * t;
  }, { label: '빨랫감 들추기', sfx: 'lift_fabric', dur: .35 });
  f.spot('inside', null, 0, .112, .075,
    { part: p, maxH: .29, scale: .72, label: '빨래 바구니 속' });
};

export const GPT_HOME_BUILDERS = B;
export const GPT_HOME_INFO = {
  gpt_homebed: { w: 2, d: 2, name: '가게집 낮은 침대', price: 320, region: 'home', hidden: true },
  gpt_homedesk: { w: 2, d: 1, name: '컵라면 컴퓨터 책상', price: 300, region: 'home', hidden: true },
  gpt_homelife: { w: 1, d: 1, name: '가게집 미니 주방', price: 270, region: 'home', hidden: true },
  gpt_homelaundry: { w: 1, d: 1, name: '들추는 빨래 바구니', price: 100, region: 'home', hidden: true },
};

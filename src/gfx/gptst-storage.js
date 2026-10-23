// 27판 역 보관함·벤치·짐수레·꽃상자 (GPT 작업장 gpt-station gptstation-storage.js, fix-1022 — ① 10/22 들여옴: 빌더 그대로).
// Neighborhood station storage. Origins are footprint centres, backs face -z, doors face +z.
// These use the game's shared cached vertex-colour/toon kit; every opening has a real panel-built interior.
import { put, grp } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const CREAM = '#f4f2f0', PALE = '#fbf7f0', MINT = '#70c8ad', MINTD = '#329f99',
  WOOD = '#cf9b6b', WOODD = '#976d4e', CORAL = '#ed876f', CORALD = '#cc6758',
  STEEL = '#a5bdc6', INK = '#6f4b30', LINEN = '#e7e6e2', LEAF = '#58b88b', LEAFD = '#378e7c', SKY = '#67b6d2';
const B = {};

// Raised door furniture (coordinates relative to a door centre); handles never rely on a printed texture.
function lockerFace(add, x, y, z, accent = MINTD, number = 1) {
  add(G.box(.15, .085, .014, .012), PALE, x - .19, y + .205, z);
  // One or two broad strokes are sufficient for an enamel number badge at the phone camera distance.
  add(G.box(.016, .042, .012, .003), INK, x - .21, y + .205, z + .014);
  if (number % 2 === 0) {
    add(G.box(.028, .011, .012, .003), INK, x - .175, y + .222, z + .014);
    add(G.box(.028, .011, .012, .003), INK, x - .175, y + .188, z + .014);
  } else add(G.box(.014, .042, .012, .003), INK, x - .175, y + .205, z + .014);
  add(G.box(.11, .035, .018, .008), INK, x + .22, y + .08, z + .004); // coin slot
  add(G.box(.045, .16, .04, .014), accent, x + .225, y - .065, z + .022);
  add(G.cyl(.022, .022, .016, 10), STEEL, x + .225, y - .105, z + .05, HP);
  for (const dy of [-.21, -.17]) add(G.box(.21, .016, .012, .004), MINTD, x - .13, y + dy, z + .002);
}

// 2x2 large lockers in a 2x1 footprint. The lower-left door swings outward into free platform space.
B.gpt_locker = f => {
  const D = .64, Z = -.06, FRONT = .29;
  f.collideBox = [-.92, 0, -.4, .92, 1.88, .32];
  f.add(mc('gptstation-locker-body-v1', ({ add }) => {
    // Feet / plinth, panel-built casing and the four real compartment floors.
    for (const x of [-.72, .72]) add(G.box(.18, .12, .44, .025), MINTD, x, .06, Z);
    add(G.box(1.82, .13, D, .035), MINTD, 0, .165, Z);
    add(G.box(1.8, 1.52, .055, .018), MINT, 0, .98, Z - D / 2 + .0275);
    for (const x of [-.87, .87]) add(G.box(.06, 1.52, D, .018), MINT, x, .98, Z);
    add(G.box(.05, 1.52, D - .055, .012), MINT, 0, .98, Z + .0275);
    add(G.box(1.68, .055, D - .06, .012), MINT, 0, .95, Z + .03);
    add(G.box(1.68, .035, D - .08, .008), LINEN, 0, .2375, Z + .02);
    add(G.box(1.68, .035, D - .08, .008), LINEN, 0, .995, Z + .02);
    add(G.box(1.85, .14, D + .035, .03), MINT, 0, 1.81, Z);
    // Open cell back has a softer enamel colour, not a dark false hole on a solid box.
    add(G.box(.77, .66, .012, .006), '#a2c8bb', -.43, .59, -.347);
    add(G.box(.68, .018, .43, .006), '#e7e6e2', -.43, .265, -.02);
    // The three doors that stay closed still have their own inset margins.
    for (const [x, y, n] of [[.43, .585, 2], [-.43, 1.34, 3], [.43, 1.34, 4]]) {
      add(G.box(.765, .675, .045, .025), SKY, x, y, FRONT);
      lockerFace(add, x, y, FRONT + .032, MINTD, n);
    }
    // Small familiar key emblem on the header, with a coral stripe to distinguish this station bank.
    add(G.box(.73, .075, .018, .015), PALE, 0, 1.81, .288);
    add(G.tor(.023, .009, PI * 2, 5, 12), MINTD, -.18, 1.812, .309);
    add(G.box(.11, .014, .015, .004), MINTD, -.11, 1.812, .309);
    add(G.box(.014, .029, .015, .004), MINTD, -.075, 1.803, .309);
    add(G.box(.22, .018, .014, .005), CORAL, .15, 1.81, .307);
    for (const y of [.38, .79]) add(G.cyl(.026, .026, .075, 10), STEEL, -.82, y, FRONT, 0, 0, 0);
  }));
  const door = grp(); put(door, -.8125, .585, FRONT); f.add(door);
  door.add(mc('gptstation-locker-door-v1', ({ add }) => {
    add(G.box(.765, .675, .045, .025), SKY, .3825, 0, 0);
    add(G.box(.66, .56, .018, .012), LINEN, .3825, 0, -.037);
    lockerFace(add, .3825, 0, .032, CORALD, 1);
  }));
  const p = f.part('door', door, t => { door.rotation.y = -1.72 * t; }, { label: '여행 짐 보관함', sfx: 'open', dur: .36 });
  p.lockable = true; p.lockKind = 'code';
  f.lockAt = { x: .605, y: -.09, z: .08, parent: door };
  f.spot('inside', null, -.43, .278, .035, { part: p, maxH: .53, scale: .95, label: '넉넉한 로커 안' });
};

// A timber platform bench: the right seat opens, the other seat keeps its little woven cushion.
B.gpt_storagebench = f => {
  // The seat/cushion, box, lid and hiding anchors move together to a .50 m seat.
  const seatScale = .50 / .6695; f.group.scale.y = seatScale;
  const HINGE_Z = -.235;
  f.collideBox = [-1, 0, -.385, 1, 1.13, .37];
  f.add(mc('gptstation-storagebench-body-v1', ({ add, tube }) => {
    // Broad feet, steel legs, actual wooden storage box under the right seat.
    for (const x of [-.9, .9]) {
      add(G.box(.18, .055, .67, .022), MINTD, x, .0275, .01);
      for (const z of [-.24, .25]) add(G.box(.075, .5, .075, .018), MINTD, x, .29, z);
      add(G.box(.07, .65, .075, .018), MINTD, x, .805, -.32);
      // The arms are supported by the outer legs and stay outside the opening seat's x extent.
      tube([x, .49, .25], [x, .73, .25], .034, MINTD, 8);
      tube([x, .73, .25], [x, .73, -.24], .034, MINTD, 8);
      tube([x, .73, -.24], [x, .49, -.24], .034, MINTD, 8);
    }
    for (const z of [-.24, .25]) add(G.box(1.88, .085, .07, .015), WOODD, 0, .27, z);
    for (const y of [.78, .98]) add(G.box(1.85, .16, .065, .022), SKY, 0, y, -.32);
    for (const x of [-.75, .75]) for (const y of [.78, .98]) add(G.cyl(.015, .015, .014, 8), WOODD, x, y, -.278, HP);
    // Left seat: five chunky timber slats, followed by one low coral cushion.
    for (const z of [-.19, -.07, .05, .17, .29]) add(G.box(.84, .07, .105, .02), SKY, -.45, .56, z);
    add(G.box(.65, .065, .44, .055), CORAL, -.45, .6275, .05);
    for (const x of [-.62, -.34]) add(G.box(.055, .008, .4, .004), '#f4c4d8', x, .664, .05);
    add(G.box(.61, .009, .045, .004), '#f4c4d8', -.45, .665, .04);
    // The openable half's bottom and four walls leave a .72 x .48 x .265 cavity.
    add(G.box(.8, .055, .58, .014), WOODD, .435, .2475, .035);
    add(G.box(.76, .02, .52, .006), LINEN, .435, .285, .035);
    for (const x of [.025, .845]) add(G.box(.045, .245, .58, .01), SKY, x, .3975, .035);
    for (const z of [-.235, .305]) add(G.box(.78, .245, .04, .01), SKY, .435, .3975, z);
    // A flush front rail and a proper brass pull make the storage seam readable from above.
    add(G.box(.25, .055, .025, .012), WOODD, .435, .46, .338);
    add(G.box(.14, .026, .03, .01), STEEL, .435, .46, .365);
    for (const x of [.16, .71]) add(G.cyl(.025, .025, .09, 8), STEEL, x, .53, HINGE_Z, 0, 0, HP);
    // One enamel route tile on the back rest; no fine print needed to read the bench.
    add(G.box(.31, .1, .018, .018), CREAM, -.5, .98, -.275);
    add(G.cyl(.026, .026, .012, 10), MINTD, -.58, .98, -.254, HP);
    add(G.box(.11, .018, .012, .004), MINTD, -.46, .98, -.253);
  }));
  const lid = grp(); put(lid, .435, .56, HINGE_Z); f.add(lid);
  lid.add(mc('gptstation-storagebench-lid-v1', ({ add }) => {
    add(G.box(.81, .07, .58, .025), SKY, 0, 0, .29);
    for (const z of [.13, .27, .41]) add(G.box(.76, .012, .018, .004), WOODD, 0, .043, z);
    add(G.box(.69, .018, .45, .008), LINEN, 0, -.045, .29);
    add(G.box(.16, .022, .045, .01), STEEL, 0, .048, .52);
  }));
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.4 * t; }, { label: '벤치 수납 좌판', sfx: 'open', dur: .4 });
  f.spot('inside', null, .435, .303, .075, { part: p, maxH: .205 * seatScale, scale: .95, label: '벤치 수납함 안' });
  f.spot('under', null, -.43, .025, .08, { maxH: .2 * seatScale, scale: .85, label: '대기 벤치 아래' });
};

// A four-wheeled station luggage trolley and one big, hinged, ribbed travelling case.
// The case door swings toward +z, so neither the trolley handle nor a wall behind it can be pierced.
B.gpt_luggagecart = f => {
  const FRONT = .267;
  f.collideBox = [-.46, 0, -.385, .46, 1.32, .4];
  f.add(mc('gptstation-luggagecart-body-v1', ({ add, tube }) => {
    add(G.box(.84, .075, .74, .04), MINTD, 0, .225, 0);
    for (const x of [-.32, .32]) for (const z of [-.25, .25]) {
      add(G.box(.065, .1, .07, .015), STEEL, x, .16, z);
      add(G.cyl(.095, .095, .065, 12), INK, x, .095, z, 0, 0, HP);
      add(G.cyl(.037, .037, .074, 10), STEEL, x, .095, z, 0, 0, HP);
    }
    for (const x of [-.34, .34]) {
      tube([x, .245, -.31], [x, 1.18, -.31], .028, STEEL, 8);
      tube([x, 1.18, -.31], [x * .85, 1.28, -.31], .028, STEEL, 8);
    }
    tube([-.29, 1.28, -.31], [.29, 1.28, -.31], .042, MINTD, 10);
    for (const x of [-.27, 0, .27]) add(G.box(.026, .022, .6, .007), STEEL, x, .274, .01);
    // A hollow upright suitcase: back, floor, top and sides, with an ivory lining.
    add(G.box(.68, .66, .055, .025), CORALD, 0, .625, -.2025);
    add(G.box(.58, .56, .015, .01), LINEN, 0, .625, -.166);
    for (const x of [-.3125, .3125]) add(G.box(.055, .66, .42, .022), CORAL, x, .625, .015);
    for (const y of [.3125, .9375]) add(G.box(.57, .055, .42, .02), CORAL, 0, y, .015);
    add(G.box(.56, .018, .32, .006), LINEN, 0, .35, .03);
    // Fabric retaining straps sit against the real back panel and leave the centre free for a findable item.
    for (const x of [-.18, .18]) add(G.box(.035, .45, .018, .006), CORALD, x, .62, -.148, 0, 0, x < 0 ? -.16 : .16);
    // Carry handle and two little case feet tell the same travel story as the trolley silhouette.
    for (const x of [-.1, .1]) add(G.box(.035, .065, .045, .01), INK, x, 1.0, .015);
    add(G.box(.23, .035, .055, .018), INK, 0, 1.04, .015);
    for (const x of [-.23, .23]) add(G.box(.095, .035, .12, .014), INK, x, .2775, .02);
    for (const y of [.42, .82]) add(G.cyl(.025, .025, .07, 8), STEEL, -.318, y, FRONT);
  }));
  const flap = grp(); put(flap, -.312, .625, FRONT); f.add(flap);
  flap.add(mc('gptstation-luggagecart-flap-v1', ({ add }) => {
    add(G.box(.625, .635, .06, .055), CORALD, .312, 0, 0);
    add(G.box(.575, .58, .025, .05), CORAL, .312, 0, .045);
    add(G.box(.53, .52, .018, .025), LINEN, .312, 0, -.045);
    // Three wide moulded ribs, cream corners and a paper destination label.
    for (const x of [.16, .31, .46]) add(G.box(.025, .43, .025, .012), '#ee9d4c', x, 0, .07);
    for (const x of [.07, .555]) for (const y of [-.25, .25]) add(G.box(.09, .085, .03, .025), CREAM, x, y, .065);
    add(G.box(.2, .135, .02, .018), PALE, .22, .13, .087, 0, 0, -.12);
    // Tape across the top and a lifted lower corner keep the destination tag papery.
    add(G.box(.075, .026, .018, .005), CREAM, .22, .197, .105, 0, 0, .12);
    add(G.box(.045, .035, .018, .005), CREAM, .302, .074, .111, 0, .22, -.12);
    add(G.cyl(.037, .037, .012, 10), MINTD, .205, .135, .106, HP);
    add(G.box(.065, .012, .012, .004), CORALD, .25, .102, .107, 0, 0, -.12);
    add(G.box(.055, .1, .025, .012), STEEL, .56, -.02, .083);
    add(G.box(.025, .05, .035, .008), INK, .56, -.02, .108);
  }));
  const p = f.part('door', flap, t => { flap.rotation.y = -1.8 * t; }, { label: '여행 캐리어 열기', sfx: 'open', dur: .38 });
  f.spot('inside', null, .015, .368, .065, { part: p, maxH: .47, scale: .9, label: '큰 여행 캐리어 안' });
};

// A real timber planter. Two flowering end clumps deliberately leave a broad cushion-sized middle pocket.
B.gpt_flowerbox = f => {
  f.collideBox = [-.98, 0, -.39, .98, .93, .39];
  f.add(mc('gptstation-flowerbox-v1', ({ add, tube }) => {
    for (const x of [-.72, .72]) add(G.box(.2, .12, .5, .025), WOODD, x, .06, 0);
    add(G.box(1.78, .055, .62, .018), WOODD, 0, .155, 0);
    for (const z of [-.325, .325]) {
      add(G.box(1.84, .32, .065, .022), WOOD, 0, .3, z);
      for (const y of [.23, .36]) add(G.box(1.77, .018, .014, .004), WOODD, 0, y, z + Math.sign(z) * .04);
      add(G.box(1.92, .065, .085, .025), CREAM, 0, .48, z);
      for (const x of [-.79, .79]) add(G.box(.085, .37, .028, .012), WOODD, x, .31, z + Math.sign(z) * .05);
    }
    for (const x of [-.89, .89]) {
      add(G.box(.06, .32, .59, .018), WOOD, x, .3, 0);
      add(G.box(.085, .065, .73, .025), CREAM, x, .48, 0);
    }
    add(G.box(1.7, .1, .56, .018), '#6f4b30', 0, .36, 0);
    // Low foliage at the ends; the clear centre spans x=-.35..+.35.
    for (const side of [-1, 1]) {
      for (const [dx, y, z, r] of [[-.12, .5, -.1, .16], [.12, .52, .05, .17], [0, .54, .17, .15]]) {
        add(G.sph(r, 8, 6), dx < 0 ? LEAFD : LEAF, side * .66 + dx, y, z, 0, 0, 0, [1, .68, 1]);
      }
    }
    const flowers = [[-.76, .8, -.08, CORAL], [-.54, .7, .14, PALE], [.56, .8, -.08, PALE], [.78, .73, .15, CORAL], [.75, .88, -.16, '#feb53d']];
    for (const [x, y, z, c] of flowers) {
      tube([x, .4, z], [x, y, z], .018, LEAFD, 6);
      // Five chunky petals face upward, for a clean flower read at the high isometric game camera.
      for (let i = 0; i < 5; i++) {
        const a = i * PI * .4;
        add(G.sph(.068, 7, 5), c, x + Math.cos(a) * .075, y, z + Math.sin(a) * .075, 0, 0, 0, [1, .55, 1]);
      }
      add(G.sph(.045, 8, 6), '#feb53d', x, y + .025, z, 0, 0, 0, [1, .65, 1]);
    }
    // A small ivory garden label sits off to one side, leaving the middle hiding pocket usable.
    add(G.box(.17, .1, .022, .015), PALE, -.68, .33, .38);
    add(G.box(.09, .016, .014, .004), MINTD, -.68, .33, .399);
  }));
  f.spot('behind', null, 0, .415, -.02, { maxH: .48, scale: .95, label: '꽃상자 꽃 사이' });
};

export const GPTST_STORAGE_BUILDERS = B;
export const GPTST_STORAGE_INFO = {
  gpt_locker: { w: 2, d: 1, name: '여행길 코인 로커', price: 320, hidden: true },
  gpt_storagebench: { w: 2, d: 1, name: '수납 대기 벤치', price: 250, hidden: true },
  gpt_luggagecart: { w: 1, d: 1, name: '여행 짐 손수레', price: 190, hidden: true },
  gpt_flowerbox: { w: 2, d: 1, name: '봄꽃 나무 상자', price: 120, hidden: true },
};

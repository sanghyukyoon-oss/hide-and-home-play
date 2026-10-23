// Corner-shop furniture. All pieces face +z; every moving front has a built interior.
// Painted package details are shallow geometry on the face, never a box-wrapped texture.
import { rbox, sph, cyl, tor, put, grp, geo, mesh, mat } from './kit.js';
import { HG as G } from './house-props.js';

const C = {
  cream: '#fef2e1', paper: '#fefde9', honey: '#eecfa3', wood: '#eaa440',
  edge: '#c67f2a', brown: '#6f4b30', sage: '#84ae9d', mint: '#a2c8bb',
  olive: '#a09769', leaf: '#84ae9d', orange: '#f8b15b', coral: '#ee8264',
  glass: '#d4e2e5', blue: '#b0e5e8', soil: '#6f4b30',
};
const B = {};
const GOODS_Y = 2.05 / 1.75, COOLER_Y = 2.05 / 1.9, TILL_Y = .92 / .86;
// Shelves and product anchors follow their taller cabinets. Stock groups undo
// that Y stretch so a bottle, tin or packet keeps its everyday proportions.
// One bevel segment keeps the chunky silhouette without the shared kit's
// denser subdivisions on every package, rail and shelf in this stocked shop.
const box = (g, w, h, d, color, x, y, z, r = .025, ry = 0, rz = 0) =>
  g.add(put(mesh(geo(`gptcorner-shop-box|${w}|${h}|${d}|${r}`,
    () => G.box(w, h, d, r, 1)), mat(color)), x, y, z, 0, ry, rz));
const ball = (g, radius, color, x, y, z, scale = null) => {
  const m = put(sph(radius, color, null, 10, 8), x, y, z, 0, 0, 0, scale); g.add(m); return m;
};
const cylinder = (g, rt, rb, h, color, x, y, z, seg = 12) =>
  g.add(put(cyl(rt, rb, h, color, null, seg), x, y, z));

// A snack packet: heat-sealed ends, cream face label and two chunky crackers.
function packet(g, x, y, z, color, h = .28, w = .23, tilt = 0) {
  const p = put(grp(), x, y, z, 0, 0, tilt); g.add(p);
  p.scale.y = 1 / GOODS_Y;
  box(p, w, h, .13, color, 0, h / 2, 0, .035);
  box(p, w + .018, .025, .135, C.honey, 0, h - .014, 0, .008);
  box(p, w + .008, .025, .135, C.honey, 0, .014, 0, .008);
  box(p, w * .72, h * .42, .016, C.paper, 0, h * .57, .076, .014);
  ball(p, .036, C.orange, -.032, h * .56, .092, [1, .65, .25]);
  ball(p, .029, C.edge, .034, h * .53, .095, [1, .75, .25]);
  box(p, w * .48, .018, .013, C.brown, 0, h * .78, .077, .005);
}

// Cup-noodle tubs are tapered and carry a raised colour band plus a lid lip.
function noodles(g, x, y, z, band = C.orange) {
  const p = put(grp(), x, y, z); g.add(p);
  p.scale.set(.75, .75 / GOODS_Y, .75);
  cylinder(p, .10, .076, .18, C.paper, 0, .09, 0);
  cylinder(p, .096, .084, .075, band, 0, .092, 0);
  cylinder(p, .107, .107, .025, C.honey, 0, .192, 0);
  box(p, .075, .035, .012, C.paper, 0, .10, .096, .008);
}

function tin(g, x, y, z, color = C.mint) {
  const p = put(grp(), x, y, z); g.add(p);
  p.scale.y = 1 / GOODS_Y;
  cylinder(p, .068, .068, .17, color, 0, .085, 0);
  cylinder(p, .072, .072, .018, C.cream, 0, .174, 0);
  box(p, .077, .065, .012, C.paper, 0, .085, .067, .009);
  ball(p, .022, C.orange, 0, .085, .08, [1, 1, .25]);
}

function bottle(g, x, y, z, color = C.mint) {
  const p = put(grp(), x, y, z); g.add(p);
  p.scale.y = 1 / COOLER_Y;
  cylinder(p, .055, .061, .175, color, 0, .0875, 0);
  cylinder(p, .029, .052, .05, color, 0, .20, 0);
  cylinder(p, .028, .028, .043, color, 0, .246, 0);
  cylinder(p, .033, .033, .025, C.cream, 0, .278, 0);
  box(p, .082, .075, .012, C.paper, 0, .10, .058, .01);
  box(p, .045, .022, .012, C.orange, 0, .102, .072, .004);
}

function carton(g, x, y, z, color = C.orange) {
  const p = put(grp(), x, y, z); g.add(p);
  p.scale.y = 1 / COOLER_Y;
  box(p, .145, .235, .14, C.paper, 0, .118, 0, .016);
  box(p, .145, .098, .153, color, 0, .112, 0, .01);
  box(p, .145, .055, .11, C.cream, 0, .257, 0, .015);
  box(p, .145, .025, .028, color, 0, .293, 0, .006);
  ball(p, .033, C.paper, 0, .115, .084, [1, 1, .22]);
}

B.gpt_goods = f => {
  const g = f.group;
  // Warm timber uprights and a painted back; the deeper foot houses a proper pull-out tray.
  box(g, 1.90, .09, .86, C.edge, 0, .055, .04, .03);
  box(g, 1.73, 1.59, .055, C.cream, 0, .88, -.355, .015);
  for (const x of [-.895, .895]) box(g, .095, 1.65, .86, C.honey, x, .895, .04, .025);
  box(g, 1.90, .085, .86, C.honey, 0, 1.7075, .04, .025);
  for (const y of [.58, .985, 1.365]) {
    const lower = y === .58, front = lower ? .45 : .365;
    box(g, 1.73, .055, lower ? .82 : .70, C.honey, 0, y, lower ? .04 : .015, .012);
    box(g, 1.73, .055, .055, C.edge, 0, y - .007, front, .012);
    // Shelf ticket rail: one unobtrusive cream price chip at either end.
    for (const x of [-.62, .62]) box(g, .14, .045, .018, C.paper, x, y - .003, front + .038, .006);
  }
  // Bottom cupboards really have a floor and a recessed back. One door slides on a front track.
  box(g, 1.71, .035, .76, C.cream, 0, .115, .045, .008);
  box(g, .83, .38, .045, C.sage, .435, .338, .393, .022);
  const slider = put(grp(), -.435, .338, .45); f.add(slider);
  box(slider, .83, .38, .045, C.mint, 0, 0, 0, .022);
  box(slider, .075, .055, .03, C.brown, .23, 0, .042, .014);
  // A broad biscuit tray rolls forward as the door clears it. Its rim stays below a flat target's face.
  const biscuitTray = put(grp(), -.4175, .151, .045); f.add(biscuitTray);
  box(biscuitTray, .85, .04, .72, C.honey, 0, 0, 0, .012);
  for (const x of [-.411, .411]) box(biscuitTray, .028, .065, .72, C.cream, x, .035, 0, .009);
  box(biscuitTray, .794, .065, .028, C.cream, 0, .035, -.346, .009);
  box(biscuitTray, .85, .055, .04, C.edge, 0, .015, .345, .012);
  const cupboard = f.part('drawer', [slider, biscuitTray], (t, b, bt) => {
    slider.position.x = b.p.x + .87 * Math.min(1, t / .45);
    biscuitTray.position.z = bt.p.z + .72 * Math.max(0, (t - .45) / .55);
  },
    { label: '과자장 미닫이', sfx: 'slide', dur: .65 });
  f.gptTargetSpot = f.spot('inside', biscuitTray, 0, .028, 0,
    { part: cupboard, maxH: .34, scale: 1.02, label: '앞으로 나오는 과자 쟁반' });
  // A tied flour sack and a little tin are tucked on the permanently closed half.
  box(g, .23, .25, .23, C.paper, .43, .26, -.06, .055);
  box(g, .17, .03, .15, C.honey, .43, .40, -.06, .012);
  tin(g, .70, .134, .02, C.olive);
  // Three clearly different product rows: snacks, cup noodles and household tins.
  packet(g, -.67, .612, .11, C.orange, .29, .24, -.05);
  packet(g, -.34, .612, .10, C.mint, .27, .22, .035);
  noodles(g, .01, .615, .12, C.coral);
  noodles(g, .30, .615, .12, C.orange);
  tin(g, .63, .615, .12, C.mint);
  for (const [x, color, tilt] of [[-.66, C.coral, -.035], [-.33, C.honey, .02], [0, C.mint, -.025], [.33, C.orange, .025], [.65, C.cream, .035]])
    packet(g, x, 1.018, .105, color, .265, .225, tilt);
  for (const x of [-.67, -.39, -.11]) noodles(g, x, 1.398, .10, x < -.4 ? C.orange : C.sage);
  tin(g, .25, 1.398, .10, C.olive); tin(g, .56, 1.398, .10, C.orange);
  f.group.scale.y = GOODS_Y;
};

B.gpt_cooler = f => {
  const g = f.group;
  // An actual cream-lined cavity, not a solid body hiding behind a transparent door.
  box(g, .93, .16, .82, C.sage, 0, .095, 0, .04);
  box(g, .79, 1.49, .045, C.cream, 0, .965, -.36, .015);
  for (const x of [-.425, .425]) box(g, .08, 1.54, .79, C.sage, x, .96, 0, .022);
  box(g, .93, .17, .82, C.sage, 0, 1.815, 0, .035);
  box(g, .58, .082, .028, C.cream, 0, 1.815, .426, .018);
  // A small orange sun logo distinguishes this independent shop's fridge.
  ball(g, .027, C.orange, 0, 1.815, .449, [1, 1, .25]);
  for (const y of [.255, 1.015, 1.38]) {
    box(g, .78, .038, .68, C.paper, 0, y, -.015, .009);
    box(g, .78, .045, .045, C.mint, 0, y - .003, .333, .007);
  }
  // The whole lower compartment is a generous 74 cm clear bay for the findable milk carton.
  // Ordinary stock remains on the two real upper shelves rather than crowding the reward.
  carton(g, -.24, 1.036, -.01, C.mint); bottle(g, .01, 1.036, -.02, C.orange); bottle(g, .24, 1.036, -.02, C.sage);
  bottle(g, -.24, 1.401, -.005, C.mint); carton(g, .24, 1.401, -.01, C.orange);
  // A real sliding glass door clears the stock without swinging into the entrance.
  const door = put(grp(), -.395, .955, .398); f.add(door);
  for (const x of [.027, .763]) box(door, .054, 1.55, .075, C.honey, x, 0, 0, .014);
  for (const y of [-.749, .749]) box(door, .79, .052, .075, C.honey, .395, y, 0, .014);
  const glass = put(rbox(.682, 1.438, .018, C.glass, .008, { opacity: .23 }), .395, 0, .006); door.add(glass);
  box(door, .035, .35, .048, C.brown, .69, .10, .065, .015);
  const p = f.part('door', door, (t,b) => { door.position.x = b.p.x + .60 * t; },
    { label: '음료 냉장고 미닫이', sfx: 'slide', dur: .42 });
  f.gptTargetSpot = f.spot('inside', null, 0, .282, .05,
    { part: p, maxH: .68, scale: 1.4, label: '냉장고 아래 넓은 칸' });
  f.spot('inside', null, 0, 1.405, .16, { part: p, maxH: .28, scale: .7, label: '냉장고 위 빈 칸' });
  f.group.scale.y = COOLER_Y;
};

B.gpt_till = f => {
  const g = f.group;
  box(g, 1.89, .09, .83, C.edge, 0, .055, 0, .025);
  box(g, 1.73, .67, .055, C.honey, 0, .425, -.36, .018);
  for (const x of [-.89, 0, .89]) box(g, .09, .69, .76, C.honey, x, .425, 0, .022);
  for (const x of [-.445, .445]) box(g, .79, .36, .055, C.mint, x, .29, .36, .025);
  box(g, .79, .22, .055, C.cream, .445, .625, .36, .022);
  box(g, 1.90, .10, .88, C.honey, 0, .81, 0, .035);
  box(g, 1.90, .035, .065, C.edge, 0, .786, .425, .009);
  // The left till drawer is a shallow open tray with a floor, side walls and two empty pockets.
  const tray = put(grp(), -.445, .62, .075); f.add(tray);
  box(tray, .79, .028, .53, C.cream, 0, -.095, 0, .007);
  for (const x of [-.378, .378]) box(tray, .035, .17, .53, C.honey, x, -.02, 0, .007);
  box(tray, .73, .17, .035, C.honey, 0, -.02, -.247, .007);
  box(tray, .82, .215, .06, C.sage, 0, 0, .292, .018);
  box(tray, .17, .035, .04, C.brown, 0, .015, .341, .012);
  box(tray, .025, .08, .40, C.honey, .12, -.04, 0, .005);
  // Rolled notes in the narrow pocket, leaving a generous spot in the other pocket.
  for (const x of [.23, .31]) box(tray, .055, .035, .18, C.mint, x, -.06, -.025, .009);
  const p = f.part('drawer', tray, (t, b) => { tray.position.z = b.p.z + .30 * t; },
    { label: '계산대 서랍', sfx: 'drawer', dur: .36 });
  f.spot('inside', tray, -.15, -.073, .02, { part: p, maxH: .17, scale: .7, label: '잔돈 서랍 안' });
  p.lockable = true;   // (② 10/22: 25판 '가게 시계 → 계산대 서랍' — the stage's code lock, the shutter's crank handle inside)
  // A compact retro cash register: cream body, sage screen hood and large orange keys.
  box(g, .44, .095, .34, C.cream, -.47, .909, .015, .03);
  box(g, .33, .19, .095, C.sage, -.47, 1.055, -.09, .028);
  box(g, .245, .105, .018, C.brown, -.47, 1.065, -.031, .012);
  for (let i = 0; i < 3; i++) box(g, .043, .044, .014, C.mint, -.535 + i * .064, 1.069, -.015, .005);
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++)
    box(g, .065, .028, .06, row ? C.orange : C.honey, -.56 + col * .09, .972, .065 + row * .082, .008);
  box(g, .085, .070, .027, C.paper, -.47, 1.165, -.074, .009);
  // A folded paper grocery bag with a thick handle, and an opaque biscuit jar.
  box(g, .25, .235, .20, C.cream, .30, .983, -.075, .03);
  box(g, .27, .035, .21, C.honey, .30, 1.109, -.075, .01);
  g.add(put(tor(.052, .012, C.brown, null, Math.PI, 5, 12), .30, 1.13, -.075));
  cylinder(g, .097, .085, .21, C.cream, .71, .965, .03);
  cylinder(g, .103, .103, .035, C.orange, .71, 1.088, .03);
  box(g, .105, .065, .014, C.honey, .71, .978, .127, .012);
  ball(g, .023, C.edge, .71, .978, .142, [1, 1, .25]);
  f.spot('behind', null, .25, .105, -.30, { maxH: .28, scale: .7, label: '계산대 안쪽' }).reserved = true;   // (② 10/22 봇: seen from nowhere)
  f.group.scale.y = TILL_Y;
};

B.gpt_planter = f => {
  const g = f.group;
  // A proper hollow flower box with end boards and warm slatted fronts.
  for (const x of [-.31, .31]) box(g, .10, .06, .45, C.edge, x, .035, 0, .015);
  box(g, .82, .045, .49, C.honey, 0, .085, 0, .012);
  for (const x of [-.405, .405]) box(g, .07, .23, .54, C.honey, x, .195, 0, .018);
  for (const z of [-.245, .245]) {
    box(g, .82, .23, .06, C.honey, 0, .195, z, .015);
    for (const x of [-.28, -.14, 0, .14, .28]) box(g, .014, .19, .012, C.edge, x, .19, z + Math.sign(z) * .037, .005);
  }
  box(g, .71, .022, .40, C.soil, 0, .284, 0, .02);
  for (const x of [-.27, 0, .27]) {
    cylinder(g, .012, .012, .22, C.olive, x, .402, 0, 8);
    const ll = ball(g, .095, C.sage, x - .045, .382, .055, [1.25, .43, .75]); ll.rotation.z = -.42;
    const lr = ball(g, .095, C.leaf, x + .048, .417, -.025, [1.12, .43, .83]); lr.rotation.z = .45;
    const back = ball(g, .085, C.mint, x, .455, -.085, [.65, 1.0, .45]); back.rotation.x = -.25;
    const fy = x === 0 ? .58 : .54;
    cylinder(g, .012, .012, fy - .42, C.olive, x, (.42 + fy) / 2, .015, 8);
    for (let n = 0; n < 5; n++) {
      const a = n * Math.PI * 2 / 5;
      ball(g, .034, x === 0 ? C.paper : C.orange, x + Math.cos(a) * .035, fy + Math.sin(a) * .035, .026, [1, 1, .48]);
    }
    ball(g, .024, C.honey, x, fy, .049, [1, 1, .45]);
  }
  f.spot('behind', null, 0, .02, -.34, { maxH: .28, scale: .72, label: '나무 꽃상자 뒤' });
};

export const GPT_SHOP_BUILDERS = B;
export const GPT_SHOP_INFO = {
  gpt_goods: { w: 2, d: 1, name: '모퉁이 가게 과자장', price: 320, region: 'shop', hidden: true },
  gpt_cooler: { w: 1, d: 1, name: '모퉁이 음료 냉장고', price: 400, region: 'shop', hidden: true },
  gpt_till: { w: 2, d: 1, name: '나무 계산대', price: 350, region: 'shop', hidden: true },
  gpt_planter: { w: 1, d: 1, name: '나무 꽃상자', price: 120, region: 'shop', hidden: true },
};

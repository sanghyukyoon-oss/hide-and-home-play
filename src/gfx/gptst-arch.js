// 기차 여행 2차 소품 — 역 건물·차양·찻집·짐 의자·꽃밭 (GPT 작업장 gpt-station gptstation2-architecture.js, fix-1022 — ① 10/22 들여옴:
// 빌더 그대로, 가구로만 등록(hidden). 간판 글자는 우리 fitText로).
// Wider spring-station architecture, kept separate from the director-approved gptstation kit.
// Floor origin, +z fronts. Shared HG/hmc keeps toon shades and the game's single ink outline.
// Open structures are modelled as rims / walls / floors; no solid filler behind movable parts.
import * as THREE from 'three';
import { sign, addWords } from './gptst-kit.js';
import { grp, put, mesh, mat, canvasTex, texCache } from './kit.js';
import { HG as SHAPES, hmc as mc } from './house-props.js';

const B = {}, PI = Math.PI, HP = PI / 2;
// Fine trim is square-edged at phone scale; reserve bevels for chunky silhouette pieces.
const G = { ...SHAPES, box: (w,h,d,r=.02,seg=1) => Math.min(w,h,d)<.08 ? SHAPES.pbox(w,h,d) : SHAPES.box(w,h,d,r,seg) };
const C = { cream: '#f4f2f0', ivory: '#fbf7f0', pale: '#d1e9ec', sand: '#e8d2df', honey: '#cf9b6b',
  timber: '#976d4e', brown: '#6f4b30', sage: '#69b8c7', mint: '#68bca5', leaf: '#4eaf8e',
  orange: '#f8b15b', coral: '#e777a1', blue: '#75bfdc', lilac: '#cba6d5', olive: '#72a58f' };
addWords({ '벚꽃마을 매표소': 'Sakura Town Tickets', '아침 여덟 시': '8 AM', '차와 간식': 'Tea & Snacks', '따뜻한 차': 'Hot Tea' });
const label = (f, text, w, h, x, y, z, bg = C.cream, fg = C.brown, ry = 0) => sign(f.group, text, w, h, x, y, z, bg, fg, ry);
function pot(add, x, y, z, s = 1, flowers = false) {
  add(G.cyl(.13 * s, .095 * s, .19 * s, 10), C.honey, x, y + .095 * s, z);
  add(G.cyl(.145 * s, .145 * s, .045 * s, 10), C.timber, x, y + .18 * s, z);
  add(G.cyl(.118 * s, .118 * s, .018 * s, 10), C.brown, x, y + .206 * s, z);
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4, dx = Math.sin(a) * .09 * s, dz = Math.cos(a) * .08 * s, yy = y + (.26 + .035 * (i % 3)) * s;
    add(G.sph(.085 * s, 6, 5), i % 2 ? C.mint : C.leaf, x + dx, yy, z + dz, -.3, a, .3, [1.25, .8, .6]);
    if (flowers && i % 2 === 0) {
      add(G.cyl(.016 * s, .016 * s, .14 * s, 5), C.leaf, x + dx, yy + .04 * s, z + dz);
      for (let p = 0; p < 5; p++) add(G.sph(.037 * s, 6, 4), i === 0 ? C.coral : C.ivory,
        x + dx + Math.sin(p * PI * .4) * .036 * s, yy + .12 * s, z + dz + Math.cos(p * PI * .4) * .036 * s, 0, 0, 0, [1, .6, 1]);
      add(G.sph(.022 * s, 6, 4), C.orange, x + dx, yy + .13 * s, z + dz);
    }
  }
}
function cup(add, x, y, z, color = C.ivory, s = 1) {
  // Visible hollow rim: a ring, warm tea recessed below it, and a loop handle.
  add(G.cyl(.065 * s, .055 * s, .11 * s, 10, true), color, x, y + .055 * s, z);
  add(G.tor(.061 * s, .013 * s, PI * 2, 5, 12), color, x, y + .11 * s, z, HP);
  add(G.cyl(.048 * s, .048 * s, .012 * s, 10), C.timber, x, y + .087 * s, z);
  add(G.tor(.035 * s, .012 * s, PI * 1.7, 5, 10), color, x + .07 * s, y + .065 * s, z, 0, PI / 2, -.8);
}
function caseOn(add, tube, x, y, z, s = 1, color = C.sage) {
  add(G.box(.53 * s, .39 * s, .31 * s, .06 * s), color, x, y + .195 * s, z);
  for (const dx of [-.16, .16]) add(G.box(.037 * s, .396 * s, .32 * s, .008), C.timber, x + dx * s, y + .2 * s, z);
  for (const dx of [-.075, .075]) tube([x + dx * s, y + .4 * s, z], [x + dx * s, y + .46 * s, z], .018 * s, C.brown);
  tube([x - .075 * s, y + .46 * s, z], [x + .075 * s, y + .46 * s, z], .018 * s, C.brown);
  add(G.box(.09 * s, .1 * s, .018, .01), C.ivory, x + .1 * s, y + .23 * s, z + .17 * s, 0, 0, -.16);
}

// Ticket room and a stepped clerestory / stationmaster's tea loft form one little building.
// The high rear roof and short right return leave the deep service window and real office visible.
B.gpt2_stationhouse = f => {
  f.collideBox = [-1.8, 0, -.94, 1.8, 2.7, 1.03];
  f.add(mc('gpt2-stationhouse-scale2', ({ add, tube }) => {
    add(G.box(3.6, .16, 1.98, .055), C.honey, 0, .08, .02);
    add(G.box(3.65, .065, 2.02, .025), C.pale, 0, .18, .02);
    for (let x = -1.66; x < 1.8; x += .28) add(G.box(.012, .012, 1.82, .005), C.sand, x, .218, .02);
    // Back wall, wide left pier, shorter right cutaway wall. All dimensions leave a genuine room void.
    add(G.box(3.6, 2.03, .12, .025), C.cream, 0, 1.23, -.91);
    add(G.box(.13, 1.97, 1.5, .025), C.cream, -1.735, 1.2, -.15);
    add(G.box(.13, .9, 1.5, .025), C.cream, 1.735, .66, -.15);
    add(G.box(.15, 2.05, .15, .02), C.honey, -1.71, 1.24, .61);
    for (const x of [-1.68, .68, 1.69]) add(G.box(.1, 2.06, .1, .015), C.timber, x, 1.24, -.83);
    for (const y of [.48, 1.06, 1.63]) add(G.box(3.35, .025, .025, .006), C.honey, 0, y, -.835);
    // Upper clerestory: warm sky panes between real uprights, under an overhanging little sage cap.
    add(G.box(2.47, .12, .83, .035), C.honey, -.52, 2.28, -.62);
    for (const x of [-1.36, -.58, .2]) {
      add(G.box(.69, .3, .055, .024), C.blue, x, 2.49, -.29);
      for (const dx of [-.37, .37]) add(G.box(.06, .4, .09, .012), C.honey, x + dx, 2.49, -.28);
      add(G.box(.03, .29, .018, .005), C.ivory, x, 2.49, -.248);
    }
    add(G.box(2.7, .13, .96, .045), C.sage, -.56, 2.74, -.6, -.045);
    add(G.box(2.75, .07, .1, .02), C.honey, -.56, 2.69, -.12);
    for (let x = -1.8; x <= .75; x += .25) add(G.box(.028, .022, .84, .008), C.olive, x, 2.813, -.6, -.045);
    // Lower right wing is an open loft alcove, with a short roof over the rear only.
    add(G.box(1.06, .11, .77, .025), C.honey, 1.19, 1.66, -.47);
    add(G.box(1.17, .12, .83, .025), C.sage, 1.21, 2.24, -.49);
    for (const x of [.69, 1.7]) add(G.box(.075, .53, .075, .015), C.timber, x, 1.95, -.16);
    for (const x of [.8, 1.06, 1.32, 1.58]) add(G.box(.04, .24, .04, .01), C.honey, x, 1.82, -.09);
    add(G.box(1.05, .05, .07, .015), C.timber, 1.2, 1.94, -.08);
    // A little two-step ladder fixed to the loft edge; no floating upper platform.
    for (const x of [.83, 1.22]) tube([x, .23, .2], [x, 1.65, -.06], .036, C.timber);
    for (let y = .46; y < 1.6; y += .29) tube([.83, y, .2 - (y - .23) * .183], [1.22, y, .2 - (y - .23) * .183], .03, C.honey);
    add(G.box(.36, .09, .24, .035), C.cream, 1.29, 1.76, -.49, 0, -.12);
    add(G.box(.26, .13, .18, .025), C.mint, 1.29, 1.86, -.49, 0, -.12);
    cup(add, .93, 1.72, -.5, C.ivory, .85);
    // Counter carcass: side cheeks and a back; two real open cavities underneath the thick counter.
    // A .92 m service counter, with the real cabinet opening and worktop objects carried up.
    add(G.box(2.28, .08, .66, .025), C.honey, -.46, .255, .56);
    add(G.box(2.28, .485, .07, .015), C.honey, -.46, .5375, .25);
    for (const x of [-1.57, -.6, .64]) add(G.box(.075, .485, .66, .018), C.honey, x, .5375, .56);
    add(G.box(2.48, .1, .87, .04), C.timber, -.46, .83, .59);
    add(G.box(2.42, .04, .85, .02), C.honey, -.46, .90, .59);
    // Deep service window: chunky window jambs, a high beam, cut-open sill. No glass or wall across the opening.
    for (const x of [-1.62, .72]) add(G.box(.12, 1.185, .15, .022), C.timber, x, 1.5125, .62);
    add(G.box(2.46, .18, .19, .025), C.honey, -.45, 2.11, .62);
    add(G.box(2.2, .21, .055, .012), C.sage, -.45, 2.11, .747);
    // Office shelving, tickets in pigeonholes, neatly bound passbooks, an old radio and stamp desk.
    for (const y of [1.15, 1.54, 1.94]) add(G.box(1.78, .065, .31, .015), C.honey, -.48, y, -.64);
    for (const x of [-1.34, -.92, -.5, -.08, .34]) add(G.box(.045, .74, .31, .009), C.honey, x, 1.57, -.64);
    for (let i = 0; i < 4; i++) {
      add(G.box(.27, .09 + .025 * (i % 2), .19, .012), i % 2 ? C.ivory : C.pale, -1.12 + i * .42, 1.235, -.62);
      add(G.box(.17, .23, .19, .012), i % 2 ? C.mint : C.sage, -1.13 + i * .42, 1.69, -.62, 0, 0, i === 3 ? -.08 : 0);
      add(G.box(.018, .13, .016, .005), C.ivory, -1.13 + i * .42, 1.69, -.514);
    }
    add(G.box(.49, .26, .21, .035), C.sage, -.96, 1.06, .38);
    add(G.box(.25, .13, .018, .012), C.honey, -1.04, 1.07, .496);
    for (let x = -1.14; x < -.91; x += .055) add(G.box(.012, .1, .016, .004), C.brown, x, 1.07, .51);
    add(G.cyl(.04, .04, .02, 10), C.brown, -.8, 1.05, .513, HP);
    tube([-.79, 1.20, .36], [-.74, 1.56, .34], .013, C.brown);
    for (let i = 0; i < 3; i++) add(G.box(.34, .027, .22, .008), i % 2 ? C.pale : C.ivory, -.22, .94 + i * .031, .66, 0, -.1);
    add(G.box(.11, .06, .1, .012), C.brown, .3, .95, .56);
    add(G.cyl(.035, .044, .13, 8), C.timber, .3, 1.05, .56);
    add(G.sph(.052, 8, 5), C.brown, .3, 1.13, .56, 0, 0, 0, [1, .65, 1]);
    // A bulbous teapot and cup on the office shelf; mop and umbrella live in their own corner.
    add(G.sph(.12, 10, 7), C.ivory, 1.48, .62, -.39, 0, 0, 0, [1, .88, 1]);
    add(G.cyl(.065, .09, .035, 10), C.honey, 1.48, .742, -.39);
    tube([1.55, .67, -.39], [1.68, .74, -.39], .038, C.ivory);
    add(G.tor(.082, .022, PI * 1.6, 5, 12), C.ivory, 1.36, .66, -.39, 0, 0, -.8);
    add(G.box(.61, .07, .55, .018), C.honey, 1.4, .49, -.6);
    tube([1.19, .33, -.83], [1.19, .455, -.39], .026, C.timber);
    tube([1.61, .33, -.83], [1.61, .455, -.39], .026, C.timber);
    cup(add, 1.18, .53, -.38, C.mint);
    tube([-1.44, .33, -.42], [-1.27, 1.5, -.64], .024, C.timber);
    add(G.box(.29, .08, .16, .03), C.ivory, -1.44, .29, -.42);
    add(G.cyl(.12, .105, .26, 10, true), C.sage, 1.48, .35, .38);
    tube([1.46, .27, .37], [1.41, 1.19, .31], .024, C.brown);
    add(G.cone(.115, .6, 8), C.mint, 1.46, .7, .37, 0, 0, -.07);
    add(G.tor(.06, .018, PI, 5, 10), C.brown, 1.47, 1.2, .31, 0, 0, PI);
    // Exterior ledge details, paper notice and attached drainpipe make the building lived in.
    pot(add, -1.47, .22, .91, .8, true);
    add(G.box(.46, .57, .045, .018), C.honey, -1.725, 1.31, .14, 0, HP);
    add(G.box(.027, .45, .34, .012), C.ivory, -1.755, 1.31, .14);
    add(G.box(.035, .075, .08, .009), C.cream, -1.783, 1.115, .263, 0, 0, -.28);
    // Two tiny thumbtacks attach the off-white notice to its frame, clear of the paper face.
    for (const z of [-.003, .283]) add(G.sph(.022, 7, 5), C.timber, -1.777, 1.507, z, 0, 0, 0, [.65, 1, 1]);
    tube([-1.77, .24, -.78], [-1.77, 2.5, -.78], .035, C.olive);
    tube([-1.77, 2.5, -.78], [-1.67, 2.7, -.78], .035, C.olive);
    add(G.box(.59, .16, .18, .03), C.sand, -1.41, .08, 1.08);
  }));
  label(f, '벚꽃마을 매표소', 2.08, .165, -.45, 2.11, .779, C.sage);
  label(f, '아침 여덟 시', .55, .135, .28, 1.53, -.468, C.cream);
  // Drawer has four walls, a bottom, a divider and tickets; it travels into open space in front.
  const drawer = grp(); put(drawer, -.03, .54, .918); drawer.scale.y = 1.1; f.add(drawer);
  drawer.add(mc('gpt2-office-drawer-v1', ({ add }) => {
    add(G.box(1.08, .36, .07, .02), C.sage, 0, 0, 0);
    add(G.box(.99, .045, .56, .012), C.honey, 0, -.145, -.29);
    for (const x of [-.505, .505]) add(G.box(.04, .26, .56, .009), C.honey, x, -.01, -.29);
    add(G.box(1.02, .26, .04, .009), C.honey, 0, -.01, -.56);
    add(G.box(.035, .22, .5, .008), C.timber, -.16, -.025, -.28);
    add(G.box(.22, .045, .075, .015), C.brown, 0, .025, .06);
    for (let i = 0; i < 3; i++) add(G.box(.23, .02, .2, .006), C.ivory, -.33, -.105 + i * .025, -.28);
    add(G.box(.21, .08, .17, .012), C.coral, .3, -.08, -.34);
  }));
  const p = f.part('drawer', drawer, (t, b) => { drawer.position.z = b.p.z + .58 * t; }, { label: '역무실 기차표 서랍', sfx: 'drawer' });
  f.spot('inside', drawer, .1, -.115, -.28, { part: p, maxH: .29 * 1.1, scale: .8, label: '역무실 표 서랍 안' });
  f.spot('on', null, -.43, .93, .79, { maxH: .4, scale: .9, label: '매표소 깊은 창구' });
};

// A long pale-sage platform shelter with a high, deliberately rear-biased roof.
B.gpt2_canopy = f => {
  f.collideBox = [-2.48, 0, -.71, 2.48, 2.68, -.47];
  f.add(mc('gpt2-canopy-v1', ({ add, tube }) => {
    for (const x of [-2.31, 2.31]) {
      add(G.box(.27, .14, .31, .035), C.sand, x, .07, -.58);
      add(G.box(.13, 2.36, .13, .025), C.timber, x, 1.3, -.58);
      tube([x, 1.94, -.58], [x + (x < 0 ? .47 : -.47), 2.4, -.58], .05, C.honey);
      tube([x, 2.04, -.58], [x, 2.4, -.11], .045, C.honey);
    }
    add(G.box(4.94, .16, .16, .025), C.honey, 0, 2.36, -.58);
    // The eave stops at z=.26: a bench centred at z=.4 stays readable from the mobile camera.
    add(G.box(5.2, .14, 1.6, .045), C.sage, 0, 2.61, -.52, -.065);
    add(G.box(5.25, .075, .13, .025), C.honey, 0, 2.53, .27);
    add(G.box(5.24, .09, .13, .03), C.mint, 0, 2.68, -1.31);
    for (let x = -2.42; x < 2.6; x += .34) add(G.box(.028, .024, 1.54, .008), C.olive, x, 2.692, -.52, -.065);
    for (const x of [-1.55, -.52, .52, 1.55]) add(G.box(.07, .1, 1.38, .015), C.honey, x, 2.48, -.51, -.065);
    // Downpipe attached to post and continuous gutter; the little drain is on the ground.
    tube([2.31, .2, -.67], [2.31, 2.35, -.67], .035, C.olive);
    tube([2.31, 2.35, -.67], [2.31, 2.62, -1.29], .035, C.olive);
    add(G.box(.32, .035, .33, .028), C.honey, 2.31, .027, -.69);
    for (let x = 2.2; x < 2.44; x += .07) add(G.box(.022, .014, .23, .004), C.brown, x, .051, -.69);
    // Pendant lamps read as painted warm shades, not bloom / dynamic lights.
    for (const x of [-1.36, 1.36]) {
      add(G.cyl(.022, .022, .31, 7), C.brown, x, 2.29, -.55);
      add(G.cyl(.055, .2, .12, 12), C.ivory, x, 2.1, -.55);
      add(G.cyl(.15, .15, .025, 12), C.pale, x, 2.03, -.55);
      add(G.sph(.045, 8, 5), C.orange, x, 2.005, -.55);
    }
    // Double-sided station clock, brown frame, short minute strokes on the face.
    add(G.box(.08, .27, .08, .015), C.brown, -.48, 2.26, -.3);
    add(G.cyl(.255, .255, .105, 20), C.timber, -.48, 1.91, -.3, HP);
    for (const sign of [-1, 1]) {
      add(G.cyl(.217, .217, .018, 20), C.ivory, -.48, 1.91, -.3 + sign * .065, HP);
      for (let a = 0; a < 12; a++) add(G.box(.019, a % 3 ? .035 : .055, .014, .004), C.brown,
        -.48 + Math.sin(a * PI / 6) * .175, 1.91 + Math.cos(a * PI / 6) * .175, -.3 + sign * .083, 0, 0, -a * PI / 6);
      add(G.box(.02, .145, .016, .006), C.brown, -.48, 1.97, -.3 + sign * .101);
      add(G.box(.115, .025, .016, .006), C.brown, -.43, 1.91, -.3 + sign * .104);
    }
    add(G.box(1.72, .28, .075, .025), C.cream, .8, 2.24, .035);
    pot(add, -2.2, .02, -.25, 1.15, true); pot(add, 2.19, .02, -.22, .9, false);
    // A little coiled cleaning hose on the rear post and a boxed spare lamp.
    add(G.tor(.14, .033, PI * 1.8, 6, 18), C.mint, -2.32, .67, -.49, 0, 0, -.4);
    add(G.box(.32, .22, .28, .025), C.honey, 1.86, .13, -.38);
    add(G.box(.18, .055, .018, .006), C.ivory, 1.86, .17, -.228);
  }));
  label(f, '벚꽃마을역', 1.56, .19, .8, 2.24, .084, C.cream);
};

// A warm tea kiosk. Individually striped awning geometry and shutters expose an actual stocked shop.
B.gpt2_teakiosk = f => {
  f.add(mc('gpt2-teakiosk-scale2', ({ add, tube }) => {
    add(G.box(2.05, .14, 1.37, .055), C.honey, 0, .07, -.02);
    add(G.box(1.94, 1.69, .1, .025), C.cream, 0, .98, -.61);
    for (const x of [-.92, .92]) add(G.box(.105, 1.7, 1.19, .025), C.cream, x, .98, -.02);
    // Lower front and worktop below the service opening; no filled solid body above it.
    add(G.box(1.77, .68, .1, .025), C.sage, 0, .48, .57);
    for (let x = -.76; x < .85; x += .22) add(G.box(.014, .58, .018, .005), C.olive, x, .48, .632);
    add(G.box(2.03, .1, .49, .035), C.honey, 0, .87, .54);
    for (const x of [-.9, .9]) add(G.box(.1, .98, .1, .018), C.timber, x, 1.41, .59);
    add(G.box(1.91, .13, .11, .025), C.honey, 0, 1.93, .59);
    for (const y of [1.18, 1.59]) add(G.box(1.69, .065, .39, .015), C.honey, 0, y, -.34);
    // Boxed sweets on the upper shelf and tea jars on the lower shelf, visible after opening.
    for (let i = 0; i < 4; i++) {
      add(G.box(.3, .2, .26, .025), i % 2 ? C.pale : C.mint, -.61 + .4 * i, 1.72, -.33);
      add(G.box(.31, .045, .27, .014), C.ivory, -.61 + .4 * i, 1.84, -.33);
      add(G.box(.14, .075, .02, .006), C.cream, -.61 + .4 * i, 1.73, -.183);
      add(G.cyl(.088, .088, .21, 10), C.sage, -.63 + .4 * i, 1.32, -.32);
      add(G.cyl(.095, .095, .035, 10), C.timber, -.63 + .4 * i, 1.44, -.32);
    }
    add(G.box(2.16, .13, 1.55, .04), C.ivory, 0, 2.05, -.02, -.1);
    // Separate broad awning stripes follow the roof angle. The cream is the dominant area.
    for (let i = 0; i < 8; i++) add(G.box(.261, .035, 1.5, .009), i % 3 === 0 ? C.sage : C.cream,
      -.918 + i * .262, 2.13, -.02, -.1);
    for (let i = 0; i < 8; i++) add(G.box(.261, .17, .085, .03), i % 3 === 0 ? C.sage : C.cream,
      -.918 + i * .262, 1.98, .76);
    // Wooden hinge blocks connect the lift-up shutters to the awning fascia.
    for (const x of [-.434, .434]) add(G.box(.18, .08, .15, .012), C.honey, x, 1.87, .71);
    add(G.box(1.45, .25, .09, .025), C.honey, 0, 2.25, -.05);
    // Counter tray, tea kettle, cups and folded cloth have physical thickness and distinct silhouettes.
    add(G.box(.61, .035, .31, .022), C.timber, -.42, .939, .57);
    cup(add, -.59, .96, .49, C.ivory, 1.15); cup(add, -.27, .96, .49, C.mint, 1.15);
    add(G.cyl(.09, .09, .03, 10), C.ivory, .38, .935, .4);
    add(G.sph(.17, 10, 7), C.ivory, .38, 1.10, .4, 0, 0, 0, [1, .9, 1]);
    add(G.cyl(.09, .12, .04, 10), C.honey, .38, 1.27, .4);
    add(G.sph(.038, 7, 5), C.brown, .38, 1.315, .4);
    tube([.5, 1.13, .4], [.68, 1.23, .4], .048, C.ivory);
    add(G.tor(.145, .026, PI, 6, 14), C.brown, .38, 1.29, .4);
    add(G.box(.25, .04, .19, .01), C.cream, .76, .94, .57, 0, -.12);
    pot(add, -.79, .02, .92, .9, true);
  }));
  label(f, '차와 간식', 1.3, .17, 0, 2.25, .005, C.honey);
  label(f, '따뜻한 차', .62, .21, .31, .39, .64, C.sage);
  // Top-hinged shutters lift over the nearby flower border instead of swinging through its fence.
  const L = grp(), R = grp(); put(L, -.857, 1.84, .66); put(R, .857, 1.84, .66);
  // Keep a .13 m gap above the corrected .92 m serving counter.
  L.scale.y = R.scale.y = .79 / .72; f.add(L); f.add(R);
  for (const [j, shutter] of [L, R].entries()) {
    const side = j ? -1 : 1;
    const panel = grp(); panel.position.y = -.36; shutter.add(panel);
    panel.add(mc('gpt2-teakiosk-shutter-' + j, ({ add }) => {
      add(G.box(.846, .72, .065, .02), C.sage, side * .423, 0, 0);
      for (let y = -.27; y < .36; y += .12) add(G.box(.75, .025, .022, .006), C.honey, side * .423, y, .044);
      for (const y of [-.29, .29]) add(G.box(.71, .05, .025, .008), C.timber, side * .423, y, -.045);
      add(G.box(.055, .14, .05, .012), C.brown, side * .74, -.04, .066);
    }));
  }
  const p = f.part('door', [L, R], t => { L.rotation.x = R.rotation.x = -1.45 * t; }, { label: '찻집 덧문', sfx: 'door', dur: .36 });
  f.spot('inside', null, .02, 1.22, -.08, { part: p, maxH: .32, scale: .8, label: '찻집 진열대 안' });
  f.spot('on', null, .06, .935, .62, { maxH: .32, scale: .8, label: '차와 간식 카운터' });
};

// Native-character bench height: .46 m slats, with the lid, contents and hiding anchor scaled together.
B.gpt2_luggagebench = f => {
  f.group.scale.y = .66;
  f.add(mc('gpt2-luggagebench-v1', ({ add, tube }) => {
    for (const x of [-1.07, 1.07]) {
      add(G.box(.13, .56, .14, .025), C.brown, x, .28, -.18);
      add(G.box(.13, .56, .14, .025), C.brown, x, .28, .31);
      add(G.box(.21, .06, .72, .02), C.timber, x, .07, .05);
      add(G.box(.1, .69, .12, .02), C.timber, x, .92, -.34);
      add(G.box(.12, .12, .65, .035), C.honey, x, .84, .02);
    }
    add(G.box(2.38, .07, .77, .025), C.honey, 0, .22, .03);
    add(G.box(2.38, .34, .065, .015), C.honey, 0, .42, -.32);
    add(G.box(2.38, .34, .065, .015), C.honey, 0, .42, .38);
    for (const x of [-1.155, .32, 1.155]) add(G.box(.07, .34, .67, .015), C.honey, x, .42, .03);
    for (let x = -1.05; x < 1.14; x += .24) add(G.box(.018, .24, .018, .005), C.timber, x, .42, .422);
    for (const y of [.92, 1.16]) add(G.box(2.39, .18, .1, .03), C.honey, 0, y, -.33, -.07);
    add(G.box(.82, .09, .79, .025), C.honey, .75, .64, .03);
    add(G.box(.18, .09, .79, .025), C.honey, -1.09, .64, .03);
    add(G.box(1.38, .09, .13, .02), C.honey, -.335, .64, -.295);
    // The small bag has a real rounded body, stitched straps and a readable luggage tag.
    caseOn(add, tube, .79, .695, .02, .86, C.sage);
    // A folded picnic blanket is stored in one end of the genuine hollow seat box.
    add(G.box(.39, .11, .42, .025), C.mint, -.87, .315, -.02);
    add(G.box(.4, .04, .43, .015), C.cream, -.87, .39, -.02);
    cup(add, .49, .69, .29, C.cream, .9);
  }));
  const lid = grp(); put(lid, -.335, .64, -.23); f.add(lid);
  lid.add(mc('gpt2-luggagebench-seat-v1', ({ add }) => {
    add(G.box(1.29, .09, .67, .028), C.honey, 0, 0, .335);
    for (const z of [.12, .34, .56]) add(G.box(1.17, .02, .025, .006), C.timber, 0, .054, z);
    add(G.box(.21, .04, .045, .012), C.brown, 0, -.055, .69);
    // The folded newspaper follows the opening seat, so it never hangs in empty air.
    add(G.box(.26, .025, .3, .008), C.ivory, -.4, .06, .42, 0, -.14);
    for (let i = 0; i < 3; i++) add(G.box(.16, .009, .014, .003), C.sand, -.4, .079, .36 + i * .064, 0, -.14);
    add(G.box(.22, .014, .055, .006), C.cream, -.4, .0685, .54, -.28, -.14);
  }));
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.35 * t; }, { label: '대합실 수납 의자', sfx: 'creak', dur: .35 });
  f.spot('inside', null, -.27, .265, .06, { part: p, maxH: .33 * .66, scale: .85, label: '의자 속 빈 수납함' });
};

// A contained border of mixed heights: flowers sit at the edges, leaving a little path and watering can.
B.gpt2_garden = f => {
  f.add(mc('gpt2-garden-v1', ({ add, tube }) => {
    add(G.box(2.02, .16, 1.2, .19), C.honey, 0, .08, 0);
    add(G.box(1.92, .08, 1.1, .16), C.sand, 0, .19, 0);
    // Back picket fence with a foot rail and a generously rounded cap to each post.
    for (let x = -.85; x < .94; x += .28) {
      add(G.box(.09, .58, .08, .035), C.cream, x, .48, -.48);
      add(G.sph(.053, 7, 5), C.cream, x, .79, -.48, 0, 0, 0, [1, .7, 1]);
    }
    for (const y of [.38, .64]) add(G.box(1.88, .07, .07, .018), C.honey, 0, y, -.48);
    for (const x of [-.8, -.34, .2, .7]) {
      const s = x === -.34 ? 1.55 : x === .7 ? 1.18 : .95;
      // Dark soil appears only in small inset pockets rather than making a large brown rectangle.
      add(G.cyl(.24, .22, .04, 10), C.olive, x, .245, -.17);
      pot(add, x, .24, -.18, s, true);
    }
    // A low front border of clover leaves / daisies, restrained coral and creamy petals.
    for (let i = 0; i < 11; i++) {
      const x = -.86 + i * .169, z = .37 + Math.sin(i * 2.1) * .055;
      add(G.sph(.1, 6, 5), i % 2 ? C.mint : C.leaf, x, .285, z, 0, i * .7, 0, [1.25, .55, .9]);
      if (i % 3 === 0) {
        tube([x, .27, z], [x, .45, z], .016, C.leaf);
        for (let p = 0; p < 5; p++) add(G.sph(.041, 6, 4), C.ivory,
          x + Math.sin(p * PI * .4) * .04, .46, z + Math.cos(p * PI * .4) * .04, 0, 0, 0, [1, .65, 1]);
        add(G.sph(.022, 6, 4), C.orange, x, .48, z);
      }
    }
    // Three stone stepping pads lead to a real little watering can in the open middle.
    for (const [x, z, a] of [[-.22, .2, -.13], [.16, .1, .14], [.52, .26, -.13]]) add(G.box(.27, .045, .21, .045), C.cream, x, .262, z, 0, a);
    add(G.cyl(.14, .12, .23, 10), C.mint, .47, .41, .04);
    add(G.cyl(.105, .105, .02, 10), C.olive, .47, .535, .04);
    add(G.tor(.13, .025, PI * 1.5, 5, 12), C.mint, .34, .45, .04, 0, 0, -.8);
    tube([.57, .41, .04], [.8, .56, .04], .035, C.mint);
    add(G.cyl(.065, .05, .05, 9), C.honey, .81, .575, .04, 0, 0, -.75);
    // A discreet hand-written seed marker, not a forest of text labels.
    add(G.box(.035, .3, .035, .01), C.timber, -.73, .39, .1, 0, 0, -.08);
    add(G.box(.23, .13, .035, .018), C.ivory, -.72, .56, .1, 0, 0, -.08);
    for (let i = 0; i < 3; i++) add(G.box(.04, .015, .01, .004), C.olive, -.79 + i * .068, .56, .127, 0, 0, -.08);
  }));
};

export const GPTST_ARCH_BUILDERS = B;
export const GPTST_ARCH_INFO = {
  gpt2_stationhouse: { w: 3.65, d: 2.1, name: '봄빛 역무실과 찻자리 다락', price: 720 },
  gpt2_canopy: { w: 5.25, d: 1.65, name: '넓은 세이지 승강장 차양', price: 480 },
  gpt2_teakiosk: { w: 2.16, d: 1.75, name: '덧문이 열리는 작은 역 찻집', price: 480 },
  gpt2_luggagebench: { w: 2.4, d: .95, name: '여행 가방과 수납 의자', price: 320 },
  gpt2_garden: { w: 2.02, d: 1.2, name: '물뿌리개가 있는 봄 꽃밭', price: 260 },
};

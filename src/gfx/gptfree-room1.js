// 64판 햇살 책방 다락 (gpt-free gptroom1, fix-1022 반영 — ① 10/22 들여옴: 빌더와 배치만, 작업장의 장치·걷기 엔진·넓힌판(1w)은 뺌).
// 포스터 글자는 우리 fitText(게임 글꼴·칸 맞춤·영어 tr)로.
// All furniture faces +z. Static pieces use the game's merged vertex-colour toon geometry;
// doors/drawer/cushion are independent pivots and every closed front has a constructed interior.
import * as THREE from 'three';
import { grp, put, mesh, mat, plane, canvasTex, texCache } from './kit.js';
import { fitText, textTex } from './gpt-paper.js';
import { HG as HG, hmc as baseMc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const LEGACY_COLORS = {
  cream: '#fff3df', paper: '#fffaec', honey: '#d5a268', wood: '#b77d46', edge: '#90623e',
  sage: '#96b39a', sageD: '#6d8d76', pale: '#dce6cd', rust: '#c97b5f', rose: '#dfa28c',
  blue: '#accdd6', blueD: '#7fa9b6', gold: '#d3ae60', ink: '#4e5148', soil: '#8f664c',
};
const COLORS = {   // (gpt-free fix-1022 원색 그대로 — 색상은 64판 배색 PAL.room1로 모음, gpt-palettes.js)
  cream: '#fef2e1', paper: '#fefde9', honey: '#eaa440', wood: '#c67f2a', edge: '#6f4b30',
  sage: '#84ae9d', sageD: '#508d70', pale: '#c6c393', rust: '#e4755c', rose: '#f3a18b',
  blue: '#b0e5e8', blueD: '#68aaca', gold: '#feb53d', ink: '#6f4b30', soil: '#644936',
};

// Wider maps reuse the original art. Their frozen palette, proportions, texture and
// geometry keys stay in the same factory; only gptroom1 opts into the corrected set.
function createBuilders(fixed) {
const C = fixed ? COLORS : LEGACY_COLORS;
const paint = (updated, previous) => fixed ? updated : previous;
// Tiny trim/flat panels need no bevel tessellation; broad outer silhouettes stay round.
const G = fixed ? { ...HG, box: (w, h, d, r = .02, seg = 1) =>
  Math.min(w, h, d) <= .055 ? HG.pbox(w, h, d) : HG.box(w, h, d, r, seg) } : HG;
const mc = (key, draw) => baseMc(key + (fixed ? '|fix1022' : ''), draw);

const SPINES = fixed ? ['#e4755c', '#84ae9d', '#feb53d', '#68aaca', '#f3a18b', '#c6c393', '#f6e0bf']
  : ['#b86f56', '#8eac96', '#e8c076', '#9db4c6', '#d5a99d', '#b5bd8e', '#e8d9b6'];
const B = {};
const POSTERS = texCache();
const groupAt = (f, x, y, z) => { const g = grp(); put(g, x, y, z); f.add(g); return g; };
const live = (f, g) => { (f.live ||= []).push(g); return g; };

// Thin triangular paper prism: crease endpoints stay on the sheet, free corner lifts.
function liftedCorner(size, lift = .025) {
  const A = [0, 0, 0], B = [size, 0, lift], D = [size, size, 0];
  const bottom = p => [p[0], p[1], p[2] - .004], a = bottom(A), b = bottom(B), d = bottom(D);
  const points = [A,B,D, d,b,a, A,a,b, A,b,B, B,b,d, B,d,D, D,d,a, D,a,A];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3)); g.computeVertexNormals(); return g;
}

// Actual page block between two covers, with a visible spine and small title bands.
function book(add, x, y, z, w = .08, h = .32, d = .24, color = C.rust, tilt = 0) {
  add(G.box(w, h, d, .008), color, x, y + h / 2, z, 0, 0, tilt);
  add(G.pbox(w * .65, h - .035, .012), C.paper, x, y + h / 2, z - d / 2 - .004, 0, 0, tilt);
  for (const yy of [.075, h - .065]) if (yy < h - .01)
    add(G.box(w * .72, .018, .012, .004), paint('#feebc8', '#efdfad'), x, y + yy, z + d / 2 + .006, 0, 0, tilt);
}
function row(add, x, y, z, n, seed = 0, h = .31, d = .24) {
  for (let k = 0; k < n; k++) {
    const w = .065 + ((k + seed) % 3) * .018;
    book(add, x + w / 2, y, z, w, h + ((k * 5 + seed) % 4) * .025, d, SPINES[(k + seed) % SPINES.length]);
    x += w + .008;
  }
}
function stack(add, x, y, z, n = 3, s = 1) {
  for (let k = 0; k < n; k++) {
    add(G.box(.35 * s, .052 * s, .25 * s, .01), SPINES[(k + 2) % SPINES.length], x, y + (.026 + k * .058) * s, z, 0, (k % 2 ? -.08 : .05), 0);
    add(G.box(.29 * s, .024 * s, .014, .003), C.paper, x, y + (.026 + k * .058) * s, z + .126 * s, 0, (k % 2 ? -.08 : .05), 0);
  }
}
function pot(add, x, y, z, s = 1) {
  add(G.cyl(.12 * s, .09 * s, .18 * s, 10), C.rust, x, y + .09 * s, z);
  add(G.cyl(.133 * s, .133 * s, .045 * s, 10), paint('#ee9d4c', '#dca080'), x, y + .17 * s, z);
  add(G.cyl(.108 * s, .108 * s, .016 * s, 10), C.soil, x, y + .194 * s, z);
}
function sprigs(add, tube, x, y, z, s = 1) {
  for (let k = 0; k < 6; k++) {
    const a = k * 2.4, ex = x + Math.cos(a) * .15 * s, ey = y + (.22 + (k % 3) * .09) * s, ez = z + Math.sin(a) * .12 * s;
    tube([x, y, z], [ex, ey, ez], .01 * s, C.sageD, 5);
    add(G.sph(.085 * s, 8, 5), k % 2 ? C.sageD : C.sage, ex, ey, ez, .2, a, -.45, [1.4, .45, .85]);
  }
}
function cup(add, x, y, z, color = C.cream, s = 1) {
  add(G.cyl(.10 * s, .10 * s, .024 * s, 12), color, x, y + .012 * s, z);
  add(G.cyl(.064 * s, .052 * s, .105 * s, 12, true), color, x, y + .077 * s, z);
  add(G.cyl(.055 * s, .055 * s, .012 * s, 12), paint('#6f4b30', '#9c6843'), x, y + .124 * s, z);
  add(G.tor(.042 * s, .012 * s, PI * 1.65, 5, 12), color, x + .074 * s, y + .079 * s, z, 0, 0, -.8);
}
function openBook(add, x, y, z, s = 1) {
  for (const sx of [-1, 1]) {
    add(G.box(.22 * s, .028 * s, .30 * s, .01), C.rust, x + sx * .105 * s, y + .014 * s, z, 0, 0, sx * .12);
    add(G.box(.20 * s, .028 * s, .28 * s, .008), C.paper, x + sx * .103 * s, y + .041 * s, z, 0, 0, sx * .12);
    for (let k = 0; k < 3; k++) add(G.pbox(.13 * s, .006, .008), paint('#e8d7b7', '#cbbb9d'), x + sx * .105 * s, y + .063 * s, z - .075 * s + k * .052 * s, 0, 0, sx * .12);
  }
  add(G.box(.018 * s, .01, .21 * s, .003), C.sageD, x + .075 * s, y + .071 * s, z + .055 * s);
}
function arch(w, bottom, shoulder, peak) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, bottom); s.lineTo(w / 2, bottom); s.lineTo(w / 2, shoulder);
  s.bezierCurveTo(w / 2, peak, -w / 2, peak, -w / 2, shoulder); s.closePath();
  return s;
}

// A supported reading loft, not a thin floating slab: oak posts, hollow storage,
// paneled return walls, a broad sill and four continuous block steps.
B.gpt_sunloft = f => {
  const H = .93;
  f.add(mc('gptroom1|sunloft-v3', ({ add, tube }) => {
    // Hollow plinth: base, back, ends and one divider. The two doors below really reveal this cavity.
    add(G.box(2.95, .10, 1.65, .035), C.edge, 0, .05, -.51);
    add(G.box(2.95, .13, 1.65, .035), C.honey, 0, H - .065, -.51);
    add(G.box(2.95, .78, .075, .015), C.honey, 0, .48, -1.30);
    for (const x of [-1.44, .30]) add(G.box(.07, .78, 1.58, .014), C.wood, x, .48, -.51);
    // The upper right shelf opens through the side, clear of the solid stair in front.
    // A low return panel and two end posts still support the loft's right-hand edge.
    add(G.box(.07, .33, 1.58, .014), C.wood, 1.44, .265, -.51);
    for (const z of [-1.23, .22]) add(G.box(.07, .45, .13, .014), C.wood, 1.44, .645, z);
    add(G.box(1.68, .055, 1.56, .01), C.honey, -.57, .48, -.51);
    // The right part under the landing is a visible bookshelf, with an intentional broad empty bay.
    add(G.box(1.06, .05, 1.50, .01), C.honey, .88, .45, -.52);
    // A supported rounded shelf nose, 31 cm beyond the old side; neither it nor its
    // contents occupies the steps or asks the player to see through a solid riser.
    add(G.box(.31, .05, .98, .022), C.honey, 1.565, .45, -.42);
    add(G.box(.315, .075, .055, .018), C.wood, 1.565, .431, .045);
    for (const z of [-.77, -.10]) tube([1.465, .14, z], [1.675, .425, z], .024, C.wood, 6);
    row(add, .36, .49, .12, 4, 2, .26, .23);
    stack(add, .95, .11, .08, 2, .85);
    // Upper floor planks, rich front fascia and tiny joinery pegs.
    for (let k = 0; k < 8; k++) add(G.pbox(.014, .006, 1.58), paint('#c67f2a', '#b68a56'), -1.28 + k * .36, H + .004, -.51);
    add(G.box(2.99, .12, .09, .025), C.wood, 0, H - .08, .34);
    for (const x of [-1.39, -.53, .32, 1.39]) add(G.cyl(.027, .027, .012, 8), C.gold, x, H - .08, .391, HP);
    // Four steps, each meets the next; risers are solid and the nosing is a different timber.
    for (let k = 0; k < 4; k++) {
      const sh = H * (4 - k) / 4, last = k === 3, z = .45 + k * .26 + (last ? .035 : 0), w = last ? 1.0 : .82, d = last ? .33 : .26;
      add(G.box(w, sh, d, last ? .055 : .018), C.honey, .98, sh / 2, z);
      add(G.box(w + .04, .045, d + .025, last ? .035 : .014), C.wood, .98, sh - .022, z + .009);
      add(G.box(last ? .81 : .65, .012, last ? .24 : .19, .004), C.pale, .98, sh + .007, z + .025);
    }
    // Small, safe, airy rail; the stair landing is left completely open.
    for (const x of [-1.40, -.52, .40]) {
      add(G.box(.075, .62, .075, .016), C.wood, x, H + .31, .26);
      add(G.sph(.055, 8, 6), C.honey, x, H + .65, .26);
    }
    add(G.box(1.85, .065, .085, .023), C.wood, -.50, H + .59, .26);
    for (let x = -1.18; x < .3; x += .23) add(G.box(.028, .48, .028, .006), C.honey, x, H + .29, .26);
    for (const z of [-1.24, -.50, .26]) add(G.box(.065, .61, .065, .014), C.wood, 1.43, H + .30, z);
    add(G.box(.07, .06, 1.55, .02), C.wood, 1.43, H + .60, -.50);
    for (let z = -1.07; z < .2; z += .25) add(G.box(.028, .49, .028, .006), C.honey, 1.43, H + .29, z);
    tube([.54, H + .57, .40], [.54, .62, 1.25], .031, C.wood, 7);
    for (const [y, z, h] of [[H, .42, .58], [.2325, 1.23, .41]]) add(G.box(.065, h, .065, .015), C.wood, .54, y + h / 2, z);
    // Deep arched bay. Glass, frame and window bars are individual geometric surfaces.
    add(G.ext(arch(2.48, 1.00, 2.02, 3.00), .10, .012), C.wood, -.08, 0, -1.26);
    add(G.ext(arch(2.30, 1.10, 2.02, 2.86), .025, 0), C.blue, -.08, 0, -1.145);
    add(G.box(.055, 1.53, .07, .012), C.cream, -.08, 1.87, -1.087);
    add(G.box(2.28, .055, .07, .012), C.cream, -.08, 1.67, -1.085);
    for (const x of [-.80, .64]) add(G.box(.035, 1.03, .06, .008), C.cream, x, 1.64, -1.08);
    add(G.box(2.63, .105, .44, .035), C.honey, -.08, 1.055, -1.12);
    add(G.box(2.68, .055, .46, .02), C.cream, -.08, 1.12, -1.10);
    // Outdoor light reads as a sunny window, rather than an unlabelled blue panel.
    add(G.cyl(.18, .18, .014, 16), paint('#feb53d', '#f4d88b'), .43, 2.19, -1.118, HP);
    for (let k = 0; k < 8; k++) {
      const a = k * PI / 4;
      add(G.box(.026, .10, .015, .008), paint('#feb53d', '#f4d88b'), .43 + Math.sin(a) * .26, 2.19 + Math.cos(a) * .26, -1.105, 0, 0, -a);
    }
    for (const [x, y, r] of [[-.74, 2.19, .12], [-.61, 2.24, .15], [-.47, 2.18, .10]])
      add(G.sph(r, 10, 6), paint('#fefde9', '#ecf0dc'), x, y, -1.10, 0, 0, 0, [1.35, .65, .13]);
    // Tied-back linen curtains and their brass rod remain clear of the sitting surface.
    tube([-1.40, 2.67, -1.02], [1.23, 2.67, -1.02], .023, C.gold, 7);
    for (const sx of [-1, 1]) {
      const x = -.08 + sx * 1.13;
      add(G.box(.22, 1.42, .11, .07), C.pale, x, 1.92, -.99);
      for (let k = 0; k < 3; k++) {
        add(G.box(.035, 1.36, .025, .012), paint('#a2c8bb', '#c5d2b5'), x - .065 + k * .065, 1.92, -.925);
        add(G.tor(.043, .010, PI * 2, 5, 10), C.gold, x - .067 + k * .067, 2.65, -1.02, 0, HP);
      }
      add(G.box(.24, .075, .14, .02), C.sageD, x, 1.53, -.98);
    }
    // Upholstered window back and a little tea stool, no objects placed in the cushion's reveal volume.
    add(G.box(1.23, .38, .15, .12), C.pale, -.65, H + .24, -.93, -.08);
    add(G.cyl(.22, .25, .055, 14), C.honey, .83, H + .30, -.58);
    for (const a of [0, 2.1, 4.2]) tube([.83 + Math.cos(a) * .13, H, -.58 + Math.sin(a) * .13], [.83 + Math.cos(a) * .11, H + .28, -.58 + Math.sin(a) * .11], .026, C.wood, 6);
    cup(add, .82, H + .33, -.56, C.rust, .85);
    openBook(add, .03, H + .016, -.48, .77);
    pot(add, -.97, 1.15, -1.02, .75);
    // A folded terracotta throw lies over the reading bench's far left arm.
    add(G.box(.25, .035, .47, .025), C.rose, -1.25, H + .055, -.56);
    for (let k = 0; k < 5; k++) add(G.box(.028, .014, .10, .004), paint('#f6e0bf', '#f1c4ac'), -1.34 + k * .045, H + .075, -.29);
  }));

  const L = groupAt(f, -1.395, .12, .337), R = groupAt(f, .255, .12, .337);
  for (const [g, sign] of [[L, 1], [R, -1]]) g.add(mc('gptroom1|loft-door|' + sign, ({ add }) => {
    add(G.box(.805, .65, .060, .025), C.sageD, sign * .4025, .325, 0);
    add(G.box(.675, .50, .023, .025), C.sage, sign * .4025, .325, .044);
    for (const yy of [.12, .54]) add(G.box(.046, .075, .020, .007), C.gold, sign * .065, yy, .045);
    add(G.sph(.040, 8, 6), C.gold, sign * .69, .34, .076);
  }));
  const doors = f.part('door', [L, R], t => { L.rotation.y = -1.72 * t; R.rotation.y = 1.72 * t; }, { label: '다락 아래 책 수납장', dur: .36 });
  // The cupboards reserve the whole front half for a full-size object. Stored books sit at the back-left.
  f.add(mc('gptroom1|loft-stored', ({ add }) => { row(add, -1.26, .115, -.78, 4, 4, .27); stack(add, -.83, .51, -.80, 3, .85); }));
  f.spot('inside', null, -.45, .108, -.02, { part: doors, maxH: .34, scale: .95, label: '다락 수납장 아래칸' });
  f.spot('inside', null, -.44, .515, -.02, { part: doors, maxH: .27, scale: .92, label: '다락 수납장 위칸' });

  const cushion = groupAt(f, -.63, H + .11, -.47);
  cushion.add(mc('gptroom1|loft-cushion', ({ add }) => {
    add(G.box(1.05, .18, .69, .13), C.sage, 0, 0, 0);
    add(G.box(.94, .025, .59, .09), paint('#a2c8bb', '#afc5a7'), 0, .09, 0);
    for (const x of [-.27, .27]) add(G.sph(.028, 8, 6), C.sageD, x, .108, 0, 0, 0, 0, [1, .3, 1]);
    add(G.box(.11, .13, .055, .02), C.cream, .51, -.01, .19);
  }));
  const cp = f.part('lift', cushion, (t, b) => { cushion.position.y = b.p.y + .53 * t; cushion.rotation.x = -.55 * t; }, { label: '다락 큰 방석', sfx: 'lift', dur: .38 });
  f.spot('inside', null, -.67, H + .012, -.40, { part: cp, maxH: .42, label: '다락 방석 밑', scale: 1 });
  f.spot('on', null, 1.49, .49, -.42, { maxH: .28, label: '계단 옆 책꽂이', scale: .85 });

  const plant = live(f, groupAt(f, -.97, 1.295, -1.02));
  plant.add(mc('gptroom1|bay-leaves', ({ add, tube }) => sprigs(add, tube, 0, 0, 0, .75)));
  f.tick = t => { plant.rotation.z = Math.sin(t * .85) * .035; plant.rotation.x = Math.sin(t * .7 + 1) * .02; };
};

// Sage book cabinet: chunky shaped crown, open shelving above, two real lower storage compartments.
B.gpt_storycabinet = f => {
  f.add(mc('gptroom1|storycabinet-v1', ({ add }) => {
    add(G.box(1.78, .12, .69, .035), C.wood, 0, .06, -.005);
    for (const x of [-.84, .84]) add(G.box(.10, fixed ? 1.77 : 1.94, .65, .025), C.sageD, x, fixed ? .975 : 1.06, -.01);
    add(G.box(1.60, fixed ? 1.72 : 1.89, .055, .015), C.pale, 0, fixed ? .99 : 1.075, -.305);
    for (const y of (fixed ? [.13, .60, 1.10, 1.50, 1.87] : [.13, .60, 1.10, 1.58, 2.04])) add(G.box(1.63, .055, .64, .012), C.honey, 0, y, -.005);
    add(G.box(1.88, .10, .74, .035), C.wood, 0, fixed ? 1.91 : 2.08, -.005);
    // Low, friendly crown: a shaped profile instead of a rectangular box stuck on top.
    add(G.ext((fixed ? arch(1.75, 1.93, 1.95, 2.195) : arch(1.75, 2.10, 2.12, 2.52)), .12, .015), C.sage, 0, 0, -.03);
    add(G.box(.47, fixed ? .13 : .25, .025, .03), C.cream, 0, fixed ? 2.035 : 2.235, .113);
    // Book-and-sun shop emblem, modelled as a readable icon.
    for (const sx of [-1, 1]) add(G.box(.14, .085, .015, .012), C.rust, sx * .073, fixed ? 2.01 : 2.21, .139, 0, 0, -sx * .11);
    add(G.cyl(.047, .047, .018, 10), C.gold, 0, fixed ? 2.09 : 2.30, .143, HP);
    row(add, -.73, 1.13, .025, 6, 0, fixed ? .26 : .30, .28);
    stack(add, .50, 1.13, .04, 3, 1.0);
    row(add, -.06, fixed ? 1.53 : 1.61, .025, 8, 3, fixed ? .23 : .29, .28);
    // One leaning display book faces forward beside the upper row.
    add(G.box(.36, fixed ? .30 : .32, .08, .018), C.rust, -.52, fixed ? 1.685 : 1.80, .04, -.12);
    add(G.box(.25, .21, .015, .014), C.paper, -.52, fixed ? 1.685 : 1.80, .091, -.12);
    add(G.cyl(.06, .06, .015, 10), C.gold, -.52, fixed ? 1.705 : 1.82, .108, HP);
    add(G.box(.03, .47, .58, .008), C.wood, 0, .36, -.01);
    row(add, -.71, .165, -.13, 3, 4, .28, .20);
    stack(add, -.54, .635, -.11, 2, .8);
    // Card catalogue labels and an old hanging key at the side are large enough to read as details.
    add(G.box(.12, .20, .025, .015), C.cream, .89, 1.69, .20, 0, .15, -.16);
  }));
  const L = groupAt(f, -.785, .17, .345), R = groupAt(f, .785, .17, .345);
  for (const [g, sx] of [[L, 1], [R, -1]]) g.add(mc('gptroom1|storydoor|' + sx, ({ add }) => {
    add(G.box(.765, .86, .06, .022), C.sageD, sx * .3825, .43, 0);
    add(G.box(.64, .71, .028, .025), C.sage, sx * .3825, .43, .044);
    add(G.box(.27, .085, .022, .015), C.gold, sx * .3825, .67, .068);
    add(G.box(.20, .045, .012, .007), C.paper, sx * .3825, .67, .085);
    add(G.sph(.042, 10, 6), C.gold, sx * .64, .39, .092);
  }));
  const p = f.part('door', [L, R], t => { L.rotation.y = -1.77 * t; R.rotation.y = 1.77 * t; }, { label: '책방 아래 수납문', dur: .35 });
  f.spot('inside', null, .40, .165, .10, { part: p, maxH: .40, label: '책장 아래 넓은칸', scale: .95 });
  f.spot('inside', null, .40, .635, .10, { part: p, maxH: .40, label: '책장 가운데 넓은칸', scale: .95 });
  f.spot('on', null, .17, 1.13, .12, { maxH: fixed ? .33 : .40, label: '진열 책 사이', scale: .9 });
};

// A working bookbinder's table. The drawer is a complete wooden tray, not a front panel over a solid desk.
B.gpt_bindertable = f => {
  const topY = y => fixed ? y - .28 : y;
  f.add(mc('gptroom1|bindertable-v1', ({ add, tube }) => {
    add(G.box(1.88, .10, .92, .045), C.honey, 0, topY(1.01), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      add(G.box(.10, fixed ? .68 : .96, .10, .025), C.wood, sx * .80, fixed ? .34 : .48, sz * .34);
      add(G.box(.13, .06, .13, .02), C.edge, sx * .80, .04, sz * .34);
    }
    add(G.box(1.65, .16, .07, .015), C.wood, 0, fixed ? .60 : .87, -.38);
    for (const x of [-.80, .80]) add(G.box(.065, .16, .68, .015), C.wood, x, fixed ? .60 : .87, 0);
    // Left-hand book press: two platens, guide rods, central screw and a cross handle.
    add(G.box(.56, .065, .40, .025), C.edge, -.48, topY(1.095), -.03);
    stack(add, -.48, topY(1.13), -.03, 2, .96);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.018, .018, .37, 7), C.ink, -.48 + sx * .23, topY(1.29), -.03 + sz * .15);
    add(G.box(.56, .07, .40, .025), C.wood, -.48, topY(1.39), -.03);
    add(G.cyl(.037, .037, .24, 9), C.ink, -.48, topY(1.52), -.03);
    for (let k = 0; k < 4; k++) add(G.tor(.039, .009, PI * 2, 4, 10), C.gold, -.48, topY(1.46) + k * .045, -.03, HP);
    add(G.box(.36, .04, .04, .016), C.ink, -.48, topY(1.64), -.03);
    for (const sx of [-1, 1]) add(G.sph(.035, 8, 6), C.wood, -.48 + sx * .18, topY(1.64), -.03);
    // Cutting mat, open repaired book and loose sheet with hand-drawn lines.
    add(G.box(.66, .018, .49, .018), C.sageD, .43, topY(1.07), .02);
    for (let k = 0; k < 4; k++) add(G.pbox(.57, .004, .006), paint('#c6c393', '#b4c7a8'), .43, topY(1.082), -.16 + k * .11);
    for (let k = 0; k < 5; k++) add(G.pbox(.006, .004, .40), paint('#c6c393', '#b4c7a8'), .18 + k * .12, topY(1.082), .02);
    openBook(add, .45, topY(1.09), .08, .93);
    add(G.box(.19, .009, .14, .004), C.paper, .70, topY(1.095), -.23, 0, .2);
    for (let k = 0; k < 3; k++) add(G.pbox(.12, .005, .007), paint('#a09769', '#b6a98b'), .69, topY(1.105), -.26 + k * .029, 0, .2);
    // Brush jar, awl, cotton thread spool and a brown paper parcel, all recognisable silhouettes.
    add(G.cyl(.075, .065, .17, 12, true), C.rust, -.02, topY(1.15), -.29);
    for (const [x, r] of [[-.045, -.16], [.003, .12], [.032, .20]]) {
      add(G.cyl(.008, .008, .29, 5), C.wood, x, topY(1.32), -.29, 0, 0, r);
      add(G.box(.034, .060, .025, .007), C.paper, x - r * .13, topY(1.48), -.29, 0, 0, r);
    }
    add(G.cyl(.065, .065, .11, 10), C.cream, .16, topY(1.13), -.31);
    for (const y of (fixed ? [.795, .905] : [1.075, 1.185])) add(G.cyl(.079, .079, .017, 12), C.wood, .16, y, -.31);
    add(G.box(.035, .014, .26, .008), C.wood, .28, topY(1.10), -.25, 0, -.4);
    // Cloth tote hangs from the table end; its loop visibly meets the bag.
    add(G.box(.09, .37, .28, .04), C.cream, .91, fixed ? .54 : .65, -.04);
    add(G.tor(.11, .018, PI, 5, 14), C.rust, .96, fixed ? .74 : .85, -.04, 0, HP);
    add(G.box(.018, .13, .16, .012), C.rust, .965, fixed ? .53 : .64, -.04);
    // A tucked-in three-leg stool, clear of the moving drawer's base.
    add(G.cyl(.22, .24, .055, 12), C.rust, -.48, .445, -.12);
    for (const a of [0, 2.1, 4.2]) tube([-.48 + Math.cos(a) * .19, .02, -.12 + Math.sin(a) * .19], [-.48 + Math.cos(a) * .12, .42, -.12 + Math.sin(a) * .12], .035, C.wood, 6);
    // Used paper and a neatly rolled packing tube by the table leg.
    add(G.box(.25, .04, .33, .02), C.cream, -.64, .045, -.26, 0, .08);
    add(G.cyl(.065, .065, .57, 10), paint('#eecfa3', '#d9bb8c'), -.75, .30, fixed ? -.43 : -.24, 0, 0, -.09);
    add(G.cyl(.037, .037, .012, 10), paint('#6f4b30', '#9d815e'), -.776, .585, fixed ? -.43 : -.24);
  }));
  const drawer = groupAt(f, fixed ? .30 : .14, fixed ? .53 : .71, .46);
  drawer.add(mc('gptroom1|binder-drawer', ({ add }) => {
    add(G.box(fixed ? .92 : 1.22, fixed ? .27 : .40, .065, .02), C.sageD, 0, 0, .014);
    add(G.box(fixed ? .78 : 1.06, fixed ? .17 : .27, .023, .018), C.sage, 0, 0, .060);
    add(G.box(fixed ? .82 : 1.12, .035, .67, .008), C.honey, 0, fixed ? -.113 : -.178, -.32);
    for (const sx of [-1, 1]) add(G.box(.04, fixed ? .18 : .31, .67, .01), C.wood, sx * (fixed ? .39 : .54), -.02, -.32);
    add(G.box(fixed ? .77 : 1.07, fixed ? .18 : .31, .04, .01), C.wood, 0, -.02, -.635);
    add(G.box(.23, .045, .045, .013), C.gold, 0, .02, .10);
    // Thread and ribbon live at the back. The front half is left open for a large target.
    for (const x of (fixed ? [-.25, -.08] : [-.35, -.18])) {
      add(G.cyl(.058, .058, .10, 10), x < -.2 ? C.rose : C.pale, x, fixed ? -.035 : -.10, -.51);
      for (const y of (fixed ? [-.088, .018] : [-.153, -.047])) add(G.cyl(.069, .069, .015, 10), C.wood, x, y, -.51);
    }
    add(G.box(.27, .06, .11, .015), C.paper, fixed ? .20 : .25, fixed ? -.06 : -.125, -.53);
  }));
  const p = f.part('drawer', drawer, (t, b) => { drawer.position.z = b.p.z + .54 * t; }, { label: '제본 작업대 큰 서랍', sfx: 'drawer', dur: .36 });
  f.spot('inside', drawer, .12, fixed ? -.085 : -.15, -.22, { part: p, maxH: fixed ? .21 : .39, label: '제본 도구 서랍', scale: .98 });
  f.spot('under', null, .53, .025, -.02, { maxH: fixed ? .34 : .47, label: '제본 작업대 밑', scale: .92 });
};

// A self-contained tea station: real cupboard on the left, open crockery bay on the right,
// a counter, cups on pegs and a tea shelf. The back is a return wall, not an inaccessible fake door.
B.gpt_teacupboard = f => {
  const counterY = y => fixed ? y - .235 : y;
  f.add(mc('gptroom1|teacupboard-v1', ({ add, tube }) => {
    add(G.box(1.30, .10, .70, .035), C.wood, 0, .05, 0);
    for (const x of [-.61, .22, .61]) add(G.box(.065, fixed ? .765 : 1.00, .66, .015), C.sageD, x, fixed ? .4525 : .57, -.01);
    add(G.box(1.21, fixed ? .785 : 1.02, .05, .012), C.pale, 0, fixed ? .4525 : .57, -.31);
    for (const y of (fixed ? [.13, .46] : [.13, .58])) add(G.box(1.18, .05, .63, .012), C.honey, 0, y, -.005);
    add(G.box(1.40, .09, .79, .035), C.honey, 0, counterY(1.12), .01);
    // Open right-hand crockery: bowls, a folded tea towel, a little tin.
    for (let k = 0; k < 3; k++) add(G.cyl(.125, .10, .065, 12), k % 2 ? C.pale : C.cream, .425, .19 + k * .055, .02);
    add(G.box(.27, .05, .27, .015), C.cream, .425, fixed ? .52 : .64, .01);
    add(G.box(.25, .025, .24, .012), C.rose, .425, fixed ? .56 : .68, .01);
    add(G.cyl(.075, .075, .15, 10), C.rust, .43, fixed ? .66 : .78, -.08);
    add(G.cyl(.081, .081, .02, 10), C.gold, .43, fixed ? .745 : .865, -.08);
    // Backboard and shelf, with generous negative space between the kettles and cups.
    for (const x of [-.57, .57]) add(G.box(.055, fixed ? .985 : .75, .055, .015), C.wood, x, fixed ? 1.3925 : 1.51, -.29);
    add(G.box(1.23, .06, .28, .02), C.honey, 0, 1.87, -.235);
    add(G.box(1.20, .10, .045, .012), C.sageD, 0, 1.65, -.30);
    for (const x of [-.40, -.12, .16]) {
      tube([x, 1.66, -.265], [x, 1.60, -.19], .013, C.gold, 6);
      add(G.cyl(.064, .052, .12, 10, true), C.cream, x, 1.51, -.17, .14);
      add(G.tor(.038, .012, PI * 1.6, 5, 12), C.cream, x + .070, 1.53, -.17);
    }
    for (const [x, color] of [[-.36, C.rust], [0, C.sage], [.36, paint('#feb53d', '#e5c37f')]]) {
      add(G.cyl(.105, .105, .22, 10), color, x, 2.01, -.23);
      add(G.cyl(.113, .113, .028, 10), C.gold, x, 2.135, -.23);
      add(G.box(.105, .095, .018, .01), C.paper, x, 2.02, -.118);
      add(G.box(.066, .012, .009, .003), C.wood, x, 2.02, -.103);
    }
    // The small ceramic teapot has a real curved spout, closed lid, knob and ring handle.
    add(G.sph(.18, 14, 8), C.rust, -.22, counterY(1.31), -.04, 0, 0, 0, [1, .78, 1]);
    add(G.cyl(.125, .15, .04, 14), C.rose, -.22, counterY(1.445), -.04);
    add(G.sph(.035, 8, 6), C.gold, -.22, counterY(1.485), -.04);
    add(G.tor(.105, .028, PI * 1.7, 6, 16), C.rust, -.40, counterY(1.33), -.04, 0, 0, -.6);
    tube([-.09, counterY(1.29), -.04], [.03, counterY(1.35), -.04], .052, C.rust, 9, .042);
    tube([.03, counterY(1.35), -.04], [.08, counterY(1.43), -.04], .043, C.rust, 9, .031);
    add(G.cyl(.027, .027, .012, 9), paint('#6f4b30', '#885a43'), .08, counterY(1.436), -.04);
    cup(add, .35, counterY(1.17), .14, C.cream, 1.15);
    // A biscuit on the saucer and a folded cloth are quiet signs of someone having just left.
    add(G.cyl(.055, .055, .023, 9), paint('#eaa440', '#d3ad72'), .50, counterY(1.199), .15);
    add(G.box(.28, .025, .20, .015), C.cream, -.48, counterY(1.18), .20, 0, -.10);
    for (let k = 0; k < 3; k++) add(G.box(.016, .008, .20, .003), C.rust, -.55 + k * .065, counterY(1.198), .20, 0, -.10);
    // The cabinet's stored tins are at the rear, leaving both hiding spots clear.
    add(G.cyl(.09, .09, .20, 10), paint('#eaa440', '#d7b478'), -.42, .26, -.17);
    add(G.cyl(.10, .10, .03, 10), C.gold, -.42, .375, -.17);
    stack(add, -.31, fixed ? .495 : .615, -.17, 2, .60);
  }));
  const door = groupAt(f, -.575, .17, .355);
  door.add(mc('gptroom1|teadoor', ({ add }) => {
    add(G.box(.745, fixed ? .625 : .86, .065, .024), C.sageD, .3725, fixed ? .3125 : .43, 0);
    add(G.box(.61, fixed ? .50 : .71, .025, .025), C.sage, .3725, fixed ? .3125 : .43, .046);
    add(G.sph(.040, 8, 6), C.gold, .63, fixed ? .33 : .45, .09);
  }));
  const p = f.part('door', door, t => { door.rotation.y = -1.75 * t; }, { label: '차 찬장 문', dur: .33 });
  f.spot('inside', null, -.12, .165, .08, { part: p, maxH: fixed ? .26 : .38, label: '차 찬장 아래칸', scale: .92 });
  f.spot('inside', null, -.13, fixed ? .495 : .615, .09, { part: p, maxH: fixed ? .30 : .43, label: '차 찬장 위칸', scale: .92 });

  // Three lightweight puffs, animated independently of baked geometry and the shadow map.
  const puffs = [];
  for (let i = 0; i < 3; i++) {
    const m = mesh(G.sph(.046, 8, 6), mat(paint('#fefde9', '#ffffff'), { opacity: .25, rim: 0 }));
    m.material = m.material.clone(); m.material.depthWrite = false;
    m.castShadow = m.receiveShadow = false; m.userData.noOcclude = true; m.layers.set(2);
    f.add(m); live(f, m); puffs.push(m);
  }
  f.tick = t => puffs.forEach((m, i) => {
    const k = (t / 3.2 + i / 3) % 1;
    m.position.set(.35 + Math.sin(k * 5 + i) * .035, counterY(1.32) + k * .32, .14);
    m.scale.setScalar(.55 + k * .75); m.material.opacity = Math.sin(k * PI) * .38;
  });
  f.tick(0);
};

// Mobile two-tier book trolley: a broad empty lower bay, castors, returns above and a clipped return card.
B.gpt_booktrolley = f => {
  f.add(mc('gptroom1|booktrolley-v1', ({ add, tube }) => {
    for (const y of [.17, .70]) {
      add(G.box(.78, .055, .49, .02), C.honey, 0, y, 0);
      for (const x of [-.37, .37]) add(G.box(.045, .12, .46, .012), C.sageD, x, y + .055, 0);
      add(G.box(.72, .10, .035, .01), C.sageD, 0, y + .045, -.23);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      tube([sx * .35, .08, sz * .21], [sx * .35, .91, sz * .21], .024, C.sageD, 7);
      add(G.cyl(.065, .065, .045, 10), C.ink, sx * .35, .065, sz * .21, HP);
      add(G.cyl(.022, .022, .052, 8), C.gold, sx * .35, .065, sz * .21, HP);
    }
    for (const sx of [-1, 1]) tube([sx * .35, .91, -.21], [sx * .35, .91, .21], .028, C.sageD, 7);
    row(add, -.31, .74, 0, 4, 3, .27, .23);
    stack(add, .22, .74, .02, 3, .60);
    stack(add, -.25, .205, -.09, 2, .60);
    // Clipped pale card on the end is a proper geometric label, no stretched canvas texture.
    if (!fixed) add(G.box(.045, .23, .20, .012), C.paper, .408, .53, .025, 0, 0, -.08);
    else {
      const card = new THREE.Shape(); card.moveTo(-.10,-.115); card.lineTo(.065,-.115); card.lineTo(.10,-.080); card.lineTo(.10,.115); card.lineTo(-.10,.115); card.closePath();
      add(G.ext(card, .014), C.paper, .42, .53, .025, 0, HP, -.08);
      add(liftedCorner(.035, .018).translate(.065,-.115,0), C.paper, .434, .53, .025, 0, HP, -.08);
    }
    add(G.box(.055, .04, .06, .008), C.gold, .42, .645, .025);
    for (let k = 0; k < 3; k++) add(G.box(.01, .009, .12, .003), C.wood, .438, .59 - k * .045, .025);
  }));
  f.spot('on', null, .15, .205, .075, { maxH: .43, label: '책 수레 아래칸', scale: .90 });
};

// A working wall above the binder's table. The poster is mapped only to its paper face
// at its native aspect ratio; the wall, frame, pins and hanging tools remain real geometry.
B.gpt_bookbindnotes = f => {
  f.add(mc('gptroom1|bookbind-wall-v1', ({ add, tube }) => {
    // Main pinned workshop poster, and one smaller personal reminder beside it.
    add(G.box(fixed ? .66 : .87, fixed ? .85 : 1.13, .027, .018), paint('#eecfa3', '#e4d1ac'), -.27, 1.98, fixed ? .0585 : .041);
    if (!fixed) add(G.box(.81, 1.075, .015, .009), C.paper, -.27, 1.98, .065);
    else {
      // Six centimetres of the bottom-right corner lifts off the cream backing.
      add(liftedCorner(.065), C.paper, -.035, 1.58625, .080);
    }
    for (const x of (fixed ? [-.52, -.02] : [-.61, .07])) add(G.sph(.025, 8, 5), C.rust, x, fixed ? 2.31 : 2.46, .093, 0, 0, 0, [1, 1, .55]);
    if (!fixed) add(G.box(.28, .35, .018, .012), '#eee2be', .40, 2.15, .057, 0, 0, -.10);
    else {
      const note = new THREE.Shape(); note.moveTo(-.14,-.175); note.lineTo(.095,-.175); note.lineTo(.14,-.13); note.lineTo(.14,.175); note.lineTo(-.14,.175); note.closePath();
      add(G.ext(note, .014), C.paper, .40, 2.15, .057, 0, 0, -.10);
      add(liftedCorner(.045, .018).translate(.095,-.175,0), C.paper, .40, 2.15, .071, 0, 0, -.10);
    }
    add(G.box(.11, .055, .018, .008), C.rose, .42, 2.32, .079, 0, 0, -.10);
    for (let k = 0; k < 3; k++) add(G.box(.17 - k * .025, .013, .012, .004), C.wood, .40, 2.20 - k * .065, .075, 0, 0, -.10);
    add(G.box(.13, .14, .018, .01), C.sage, .36, 1.77, .058, 0, 0, .09);
    add(G.box(.11, .025, .012, .004), C.cream, .36, 1.80, .077, 0, 0, .09);
    // Oak tool rail with three pegs. Each loop actually meets its peg.
    add(G.box(1.08, .075, .08, .02), C.honey, -.12, 1.405, .065);
    for (const x of [-.46, -.12, .24]) {
      add(G.cyl(.020, .020, .17, 7), C.gold, x, 1.40, .17, HP);
      add(G.sph(.027, 8, 5), C.gold, x, 1.40, .255);
    }
    // Bookbinding knife: wooden handle, hanging loop, broad short steel blade.
    add(G.tor(.033, .010, PI * 2, 5, 12), C.edge, -.46, 1.37, .18);
    add(G.box(.070, .15, .046, .018), C.wood, -.46, 1.27, .19);
    add(G.box(.080, .18, .020, .006), paint('#a2c8bb', '#a9b6b3'), -.46, 1.105, .19, 0, 0, .025);
    add(G.box(.015, .14, .010, .003), C.cream, -.495, 1.105, .207, 0, 0, .025);
    // Cotton book tape: a hollow ring with its visible cardboard core.
    add(G.tor(.068, .025, PI * 2, 6, 16), C.cream, -.12, 1.31, .19);
    add(G.tor(.041, .009, PI * 2, 5, 14), paint('#eecfa3', '#c8ab79'), -.12, 1.31, .211);
    add(G.box(.065, .095, .015, .01), C.cream, -.10, 1.21, .205, 0, 0, -.15);
    // Scissors, with two open finger rings, a hinge and two separate blades.
    for (const sx of [-1, 1]) {
      add(G.tor(.041, .011, PI * 2, 5, 14), C.sageD, .24 + sx * .045, 1.33, .18);
      tube([.24 + sx * .035, 1.30, .18], [.24, 1.245, .18], .012, C.sageD, 6);
      tube([.24, 1.245, .18], [.24 - sx * .045, 1.025, .18], .012, paint('#a2c8bb', '#a9b6b3'), 6, .006);
    }
    add(G.cyl(.022, .022, .025, 9), C.gold, .24, 1.245, .195, HP);
  }));
  function fixedPoster() {
    return POSTERS.get('gpt-book-repair-fix1022', () => textTex(512, 672, c => {
      c.fillStyle = C.paper; c.fillRect(0, 0, 256, 336);
      const line = (text, y, size, color) => fitText(c, text, 128, y, 256 * .80, size, color, { weight: '700' });
      line('책 고치는 날', 44, 28, C.edge);
      line('제본 교실', 77, 19, C.sageD);
      c.fillStyle = C.sage; c.beginPath(); c.moveTo(38, 124); c.lineTo(115, 140); c.lineTo(115, 251); c.lineTo(38, 233); c.closePath(); c.fill();
      c.fillStyle = C.gold; c.beginPath(); c.moveTo(141, 140); c.lineTo(218, 124); c.lineTo(218, 233); c.lineTo(141, 251); c.closePath(); c.fill();
      c.strokeStyle = C.edge; c.lineWidth = 3; c.beginPath(); c.moveTo(128, 135); c.lineTo(128, 255); c.stroke();
      for (let y = 150; y < 240; y += 22) { c.beginPath(); c.moveTo(117, y); c.lineTo(139, y + 10); c.moveTo(139, y); c.lineTo(117, y + 10); c.stroke(); }
      c.strokeStyle = C.paper;
      for (let y = 158; y < 230; y += 20) { c.beginPath(); c.moveTo(51, y); c.lineTo(101, y + 10); c.moveTo(155, y + 10); c.lineTo(205, y); c.stroke(); }
      line('토요일 두 시', 301, 20, C.edge);
    }));
  }
  const texture = fixedPoster();
  if (fixed) {
    // Clip the paper face to match its folded corner; UVs preserve native aspect.
    const w = .60, h = .7875, shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2); shape.lineTo(w / 2 - .065, -h / 2);
    shape.lineTo(w / 2, -h / 2 + .065); shape.lineTo(w / 2, h / 2); shape.lineTo(-w / 2, h / 2); shape.closePath();
    const geo = new THREE.ShapeGeometry(shape), pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + .5, pos.getY(i) / h + .5);
    f.add(put(mesh(geo, mat('#ffffff', { map: texture, rim: 0 })), -.27, 1.98, .080));
  } else f.add(put(plane(.79, 1.037, mat('#ffffff', { map: texture, rim: 0 })), -.27, 1.98, .080));
};

// A pair taken off before climbing to the reading bench, kept beside the stair rather than in its path.
B.gpt_readingslippers = f => {
  f.noSolid = true;
  f.add(mc('gptroom1|reading-slippers-v1', ({ add }) => {
    for (const sx of [-1, 1]) {
      const x = sx * .112;
      add(G.box(.175, .027, .34, .04), C.cream, x, .0185, 0);
      add(G.box(.17, .085, .22, .047), C.sage, x, .066, .052);
      add(G.box(.12, .012, .042, .014), paint('#c6c393', '#d7e0c8'), x, .112, -.015);
      add(G.box(.11, .008, .075, .018), paint('#f6e0bf', '#d8c7a7'), x, .037, -.095);
    }
  }));
};

return B;
}
export const GPT_ROOM1_BUILDERS = createBuilders(true);
export const GPT_ROOM1_INFO = {
  gpt_sunloft: { w: 3.45, d: 2.95, name: '햇살 독서 다락', hidden: true },
  gpt_storycabinet: { w: 1.95, d: .9, name: '이야기 책장', hidden: true },
  gpt_bindertable: { w: 1.95, d: 1.1, name: '제본 작업대', hidden: true },
  gpt_teacupboard: { w: 1.4, d: .95, name: '책방 차 찬장', hidden: true },
  gpt_booktrolley: { w: .86, d: .58, name: '반납 책 수레', hidden: true },
  gpt_bookbindnotes: { w: 1.4, d: .28, wall: true, span: 1.5, name: '제본 교실 포스터와 도구걸이', hidden: true },
  gpt_readingslippers: { w: .42, d: .36, name: '다락 앞 실내화', hidden: true },
};

export function createGptRoom1(baseTheme) {
  const C = COLORS;
  // (GPT 테마 그대로, 벽 크림만 아주 옅은 중성으로; friend: the old 64판 map's)
  const theme = {
    ...baseTheme, name: '햇살 책방 다락', friend: baseTheme?.friend ?? 'cat', bg: ['#f8f3ec', '#dfd8cc'],
    base: '#dfd2c1', floorKind: 'planks', floor: '#ebe2d5', floor2: '#dfd2c1',
    wallKind: 'plain', wall: '#f4f2f0', wall2: '#e8e5e2', wainscot: '#c2c1af',
    trim: '#f8f7f5', wallEdge: '#f8f7f5', wood: C.honey, woodD: C.wood,
    body: C.cream, accent: C.sage, accent2: C.rust, accent3: '#feb53d',
    fwood: C.honey, fwoodD: C.wood, fabric: C.sage, fabric2: C.pale, pot: C.rust,
  };
  return {
    theme, bleed: false, fitAll: true, friendAt: [.74, .38], nBonus: 3,
    rooms: [{ at: [0, 0], level: 0, layout: {
      w: 6, d: 5, exact: true, wallH: 2.78, panels: true, theme,
      walls: { N: 'wall', W: 'wall', S: 'none', E: 'none' },
      furniture: [
        { type: 'gpt_sunloft', x: -1.35, z: -1.10, a: 0 },
        { type: 'gpt_storycabinet', x: 1.65, z: -1.94, a: 0 },
        { type: 'gpt_bindertable', x: -1.76, z: 1.40, a: 0 },
        { type: 'gpt_teacupboard', x: 2.14, z: .50, a: 0 },
        { type: 'gpt_booktrolley', x: .30, z: 1.48, a: -.07 },
        { type: 'gpt_readingslippers', x: -1.25, z: .48, a: .08 },
      ], decor: [{ type: 'gpt_bookbindnotes', wall: 'W', u: -1.12 }],
    } }],
  };
}

// GPT workshop vehicles. +x is the nose, +z is the presentation/driver side.
// Separate panels around real empty cabins; glass is a thin transparent pane, never a solid tinted box.
import * as THREE from 'three';
import { put, grp, mesh, mat, geo, canvasTex, texCache, roundRect } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';   // 글자·종이 손질 (① 10/22)

const PI = Math.PI, HP = PI / 2;
const C = {
  red: '#dd5d4d', redD: '#af4238', redLight: '#f28b6a', lensRed: '#ec5345', cream: '#fdf6da', white: '#fefde9',
  navy: '#273c81', blue: '#2a75e8', yellow: '#ffc134', ink: '#482f1d', tyre: '#472e1d',
  steel: '#e8d7b7', steelD: '#a7a595', pale: '#feebc8', inner: '#695443', seat: '#3f6880',
  orange: '#f39029', glass: '#84c1e5', brass: '#feb53d', hose: '#fae6ae', hoseD: '#d4c498',
};
const B = {}, TEX = texCache();
const addBox = (add, w, h, d, color, x, y, z, r = .025, rx = 0, ry = 0, rz = 0) => add(G.box(w, h, d, r, 1), color, x, y, z, rx, ry, rz);
// Round the horizontal silhouette independently of panel thickness (a thin rounded box clamps its radius).
function roundPlan(w, d, h, r) {
  const a = -w / 2, b = -d / 2, s = new THREE.Shape();
  s.moveTo(a + r, b); s.lineTo(a + w - r, b); s.quadraticCurveTo(a + w, b, a + w, b + r);
  s.lineTo(a + w, b + d - r); s.quadraticCurveTo(a + w, b + d, a + w - r, b + d);
  s.lineTo(a + r, b + d); s.quadraticCurveTo(a, b + d, a, b + d - r);
  s.lineTo(a, b + r); s.quadraticCurveTo(a, b, a + r, b); s.closePath();
  const g = G.ext(s, h, .012, 6); g.translate(0, 0, -h / 2); g.rotateX(-HP); return g;
}
// A softly rounded pane fitted to four corners (bottom left, bottom right, top right, top left).
function pane(key, corners, opacity = .25, color = C.glass, curve = .065, inkLayer = false) {
  const g = geo('gpt-pane|' + key, () => {
    const s = new THREE.Shape(), r = curve;
    s.moveTo(r, 0); s.lineTo(1 - r, 0); s.quadraticCurveTo(1, 0, 1, r); s.lineTo(1, 1 - r);
    s.quadraticCurveTo(1, 1, 1 - r, 1); s.lineTo(r, 1); s.quadraticCurveTo(0, 1, 0, 1 - r);
    s.lineTo(0, r); s.quadraticCurveTo(0, 0, r, 0);
    const out = new THREE.ShapeGeometry(s, 4), p = out.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i), v = p.getY(i);
      const q = [0, 1, 2].map(k => corners[0][k] * (1 - u) * (1 - v) + corners[1][k] * u * (1 - v) + corners[2][k] * u * v + corners[3][k] * (1 - u) * v);
      p.setXYZ(i, ...q);
    }
    out.computeVertexNormals(); return out;
  });
  const m = mesh(g, mat(color, { opacity, side: THREE.DoubleSide, rough: .3, rim: 0 }), { cast: false, recv: false });
  m.renderOrder = 2; m.userData.gptGlass = true; if (inkLayer) m.userData.inkLayer = true; return m;
}
function glassGlint(key, corners, opacity = .35) {
  const g = geo('gpt-glint|' + key, () => {
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(corners.flat(), 3));
    out.setIndex([0, 1, 2, 0, 2, 3]); out.computeVertexNormals(); return out;
  });
  const m = mesh(g, mat('#fefde9', { opacity, side: THREE.DoubleSide, rim: 0 }), { cast: false, recv: false });
  m.renderOrder = 3; return m;
}
function numberTexture(key, text, color = C.navy) {
  return TEX.get('gpt-vehicle-' + key, () => textTex(256, 80, (c, w, h) => {
    c.fillStyle = C.white; c.fillRect(0, 0, w, h); c.strokeStyle = color; c.lineWidth = 2; roundRect(c, 3, 3, w - 6, h - 6, 6); c.stroke();
    fitText(c, text, w / 2, h / 2 + 1, w * .82, Math.round(h * .62), color);
  }));
}
function label(w, h, key, text, color) {
  return mesh(new THREE.PlaneGeometry(w, h), mat(C.white, { map: numberTexture(key, text, color), side: THREE.DoubleSide }), { cast: false });
}
function wheelGeo(r, d) {
  const pts = [[0, -d / 2], [r * .78, -d / 2], [r * .94, -d * .43], [r, -d * .27], [r, d * .27], [r * .94, d * .43], [r * .78, d / 2], [0, d / 2]];
  return new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(...p)), 22);
}
function wheels(add, { axles, r, z, d }) {
  for (const x of axles) for (const side of [-1, 1]) {
    add(wheelGeo(r, d), C.tyre, x, r, side * z, HP, 0, 0);
    const face = side * (z + d / 2 + .004);
    add(G.tor(r * .72, .011, PI * 2, 4, 22), '#644936', x, r, face);
    add(G.cyl(r * .47, r * .47, .025, 18), C.steel, x, r, face + side * .007, HP, 0, 0);
    add(G.tor(r * .42, .014, PI * 2, 5, 18), '#fdf6da', x, r, face + side * .025);
    add(G.cyl(r * .18, r * .18, .037, 12), C.steelD, x, r, face + side * .018, HP, 0, 0);
    for (let k = 0; k < 4; k++) {
      const a = k * HP + PI / 4;
      add(G.cyl(r * .035, r * .035, .031, 6), '#fdf6da', x + Math.cos(a) * r * .29, r + Math.sin(a) * r * .29, face + side * .018, HP, 0, 0);
    }
  }
}
function arch(add, x, r, z, color, width = .045, extra = .075) {
  const s = new THREE.Shape(), ro = r + extra, ri = r + .022;
  s.moveTo(-ro, 0); s.absarc(0, 0, ro, PI, 0, true); s.lineTo(ri, 0); s.absarc(0, 0, ri, 0, PI, false); s.closePath();
  const g = G.ext(s, width, .01, 12); g.translate(0, 0, -width / 2);
  add(g, color, x, r, z);
}
// Lower painted quarter panel follows the wheel opening, so its solid geometry clears the tyre.
function wheelPanel(x0, x1, xc, r, top, bottom, depth = .04, cy = .25) {
  const a = Math.asin((bottom - cy) / r), dx = Math.cos(a) * r, s = new THREE.Shape();
  s.moveTo(x0, bottom); s.lineTo(x0, top); s.lineTo(x1, top); s.lineTo(x1, bottom);
  s.lineTo(xc + dx, bottom); s.absarc(xc, cy, r, a, PI - a, false); s.lineTo(x0, bottom); s.closePath();
  const g = G.ext(s, depth, .006, 14); g.translate(0, 0, -depth / 2); return g;
}
function seats(add, { x, y, z, scale = 1, width = .28, floor = null }) {
  for (const side of [-1, 1]) {
    if (floor != null) {
      const h = y - .0375 * scale - floor + .006;
      addBox(add, .20 * scale, h, width * .78, C.ink, x, floor + h / 2 - .001, side * z, .012);
    }
    addBox(add, .28 * scale, .075 * scale, width, C.seat, x, y, side * z, .035);
    addBox(add, .075 * scale, .28 * scale, width, C.seat, x - .13 * scale, y + .16 * scale, side * z, .04, 0, 0, -.10);
    addBox(add, .065 * scale, .10 * scale, width * .70, '#4f86b0', x - .15 * scale, y + .34 * scale, side * z, .025);
    addBox(add, .15 * scale, .018 * scale, width * .90, '#4f86b0', x + .025 * scale, y + .045 * scale, side * z, .009);
  }
}
function steering(add, tube, x, y, z, r) {
  tube([x + .05, y - .12, z], [x, y, z], r * .17, C.ink, 8);
  add(G.tor(r, r * .16, PI * 2, 6, 18), C.ink, x, y, z, 0, HP, -.25);
  add(G.cyl(r * .25, r * .25, r * .25, 10), C.steelD, x, y, z, 0, 0, HP);
  for (const a of [0, PI * .67, PI * 1.33]) tube([x, y, z], [x, y + Math.cos(a) * r * .86, z + Math.sin(a) * r * .86], r * .09, C.ink, 6);
}
function helmet(add, x, y, z, s = 1) {
  add(new THREE.SphereGeometry(.125 * s, 14, 7, 0, PI * 2, 0, HP), C.yellow, x, y + .022 * s, z, 0, 0, 0, [1, 1, 1.08]);
  addBox(add, .31 * s, .025 * s, .29 * s, C.yellow, x, y + .012 * s, z, .05);
  addBox(add, .045 * s, .06 * s, .012 * s, C.navy, x, y + .073 * s, z + .126 * s, .008);
  addBox(add, .018 * s, .012 * s, .13 * s, '#fce795', x, y + .143 * s, z, .005);
}
function extinguisher(add, tube, x, y, z, s = 1) {
  add(G.cyl(.060 * s, .060 * s, .020 * s, 12), C.redD, x, y + .008 * s, z);
  add(G.cyl(.058 * s, .058 * s, .21 * s, 12), C.red, x, y + .12 * s, z);
  add(new THREE.SphereGeometry(.058 * s, 12, 6, 0, PI * 2, 0, HP), C.red, x, y + .225 * s, z);
  addBox(add, .056 * s, .09 * s, .008 * s, C.white, x, y + .13 * s, z + .058 * s, .006);
  addBox(add, .09 * s, .022 * s, .034 * s, C.brass, x + .012 * s, y + .29 * s, z, .006);
  tube([x - .04 * s, y + .265 * s, z], [x - .085 * s, y + .22 * s, z], .013 * s, C.ink, 6);
  tube([x - .085 * s, y + .22 * s, z], [x - .085 * s, y + .07 * s, z], .013 * s, C.ink, 6);
}
function cone(add, x, y, z, s = 1) {
  addBox(add, .18 * s, .025 * s, .18 * s, C.orange, x, y + .0125 * s, z, .02);
  add(G.cyl(.018 * s, .073 * s, .23 * s, 12), C.orange, x, y + .14 * s, z);
  add(G.cyl(.039 * s, .049 * s, .046 * s, 12), C.white, x, y + .145 * s, z);
}

B.gpt_firetruck = f => {
  const rear = -1.20, nose = 1.20, half = .64, bodyTop = 1.45, floor = .77, axle = [-.80, .82], wr = .345;
  f.add(mc('gpt-firetruck-static-v1', ({ add, tube }) => {
    // Chassis and shallow floor; wheels have real arch clearance instead of sinking into a red box.
    addBox(add, 2.32, .12, .83, C.ink, 0, .40, 0, .035);
    for (const x of axle) add(G.cyl(.045, .045, 1.12, 10), C.steelD, x, wr, 0, HP, 0, 0);
    addBox(add, 2.36, .08, 1.20, C.redD, 0, floor, 0, .03);
    wheels(add, { axles: axle, r: wr, z: .57, d: .23 });
    for (const side of [-1, 1]) for (const x of axle) arch(add, x, wr, side * .68, C.ink, .065);
    // Equipment body: a floor, roof, back and dividers around two actual cavities on the near side.
    add(roundPlan(1.54, 1.28, .10, .10), C.red, -.43, bodyTop - .05, 0);
    addBox(add, .075, .63, 1.24, C.red, rear + .035, 1.08, 0, .025);
    addBox(add, .075, .63, 1.24, C.red, .32, 1.08, 0, .025);
    addBox(add, 1.40, .58, .065, C.redD, -.43, 1.07, -.02, .015);
    for (const x of [-.57, -.045]) addBox(add, .055, .59, .60, C.red, x, 1.075, .33, .012);
    // The inside faces are separate, recessed panels, with shelves and large readable equipment.
    for (const [x, w] of [[-.865, .52], [-.305, .44]]) {
      addBox(add, w, .53, .026, C.inner, x, 1.075, .052, .008);
      addBox(add, w, .035, .58, C.steelD, x, .802, .365, .008);
      addBox(add, w, .027, .56, C.steel, x, 1.168, .355, .007);
      addBox(add, w, .025, .46, C.steelD, x, 1.325, .305, .007);
    }
    helmet(add, -.87, 1.183, .51, .84);
    extinguisher(add, tube, -1.065, .821, .42, .62);
    // A cream rescue rope on the bottom shelf, no stretched picture of equipment.
    for (const r of [.085, .062, .038]) add(G.tor(r, .014, PI * 2, 5, 18), C.hose, -.75, .919, .18);
    addBox(add, .21, .115, .19, '#e0a85a', -.30, .877, .19, .018);
    addBox(add, .21, .022, .20, C.cream, -.30, .946, .19, .007);
    addBox(add, .08, .055, .014, C.red, -.30, .872, .294, .006);
    addBox(add, .018, .09, .016, C.red, -.30, .872, .296, .004);
    // Glove pair on the upper shelf.
    for (const x of [-.39, -.25]) {
      addBox(add, .09, .045, .13, C.yellow, x, 1.204, .52, .02);
      addBox(add, .07, .018, .06, C.redD, x, 1.194, .435, .007);
    }
    // Far side service panel and cream stripe; the recess is a genuine framed panel, not an image.
    addBox(add, 1.43, .55, .045, C.red, -.43, 1.07, -.62, .035);
    addBox(add, 1.12, .34, .025, C.redD, -.52, 1.12, -.653, .025);
    addBox(add, 1.00, .25, .02, '#c75a2f', -.52, 1.12, -.676, .02);
    for (const x of [-.89, -.52, -.15]) addBox(add, .19, .022, .02, C.steelD, x, 1.12, -.692, .006);
    for (const side of [-1, 1]) {
      addBox(add, 1.45, .095, .025, C.cream, -.43, .78, side * .65, .01);
      addBox(add, .085, .055, .025, C.yellow, -1.09, .67, side * .65, .012);
      addBox(add, .22, .075, .25, C.steelD, .49, .70, side * .61, .025);
      addBox(add, .19, .014, .20, C.steel, .49, .745, side * .63, .007);
    }
    // Hollow cab: lower front, back bulkhead, narrow sills and a rounded roof. Empty space connects all windows.
    addBox(add, .78, .09, 1.16, C.inner, .80, .79, 0, .025);
    addBox(add, .07, .75, 1.15, C.red, .405, 1.15, 0, .025);
    addBox(add, .17, .38, 1.18, C.red, 1.14, .90, 0, .075);
    add(roundPlan(.76, 1.24, .145, .16), C.red, .79, 1.555, 0);
    // Thick windshield pillars follow its slight rake.
    for (const side of [-1, 1]) {
      tube([1.205, 1.06, side * .535], [1.075, 1.49, side * .53], .048, C.red, 10);
      addBox(add, .08, .49, .09, C.red, .44, 1.235, side * .565, .025);
      addBox(add, .64, .045, .08, C.red, .77, 1.49, side * .56, .02);
      addBox(add, .66, .055, .075, C.redD, .77, .805, side * .59, .02);
    }
    tube([1.205, 1.06, -.535], [1.205, 1.06, .535], .034, C.redD, 10);
    // Interior upholstered seats, steering wheel and dashboard can be seen through panes or the open door.
    seats(add, { x: .67, y: .875, z: .27, scale: 1, width: .32 });
    addBox(add, .18, .09, .99, C.seat, 1.025, 1.07, 0, .035);
    addBox(add, .045, .06, .22, C.ink, .923, 1.11, .27, .012);
    for (const z of [.20, .30]) add(G.cyl(.026, .026, .012, 12), C.pale, .897, 1.112, z, 0, 0, HP);
    steering(add, tube, .93, 1.105, .27, .104);
    addBox(add, .08, .05, .12, C.ink, .81, .89, 0, .014);
    tube([.81, .91, 0], [.81, 1.01, 0], .012, C.ink, 6); add(G.sph(.025, 8, 6), C.ink, .81, 1.01, 0);
    // Front face: thick bumper, grey grille with separated slats and circular lamp bowls.
    addBox(add, .19, .19, 1.34, C.steelD, 1.245, .465, 0, .072);
    addBox(add, .025, .095, .89, C.cream, 1.236, .775, 0, .009);
    addBox(add, .025, .205, .43, C.steel, 1.237, .87, 0, .022);
    for (const y of [.805, .87, .935]) addBox(add, .017, .025, .35, C.inner, 1.256, y, 0, .007);
    for (const side of [-1, 1]) {
      add(G.cyl(.122, .122, .042, 20), C.steelD, 1.243, .89, side * .425, 0, 0, HP);
      add(G.cyl(.096, .096, .047, 20), '#feedc1', 1.258, .89, side * .425, 0, 0, HP);
      add(G.tor(.100, .014, PI * 2, 5, 20), C.cream, 1.286, .89, side * .425, 0, HP, 0);
      addBox(add, .026, .048, .10, C.orange, 1.346, .49, side * .51, .014);
      tube([1.05, 1.18, side * .62], [1.12, 1.21, side * .73], .018, C.ink, 7);
      addBox(add, .085, .175, .105, C.ink, 1.12, 1.20, side * .755, .035);
      addBox(add, .025, .125, .074, C.steelD, 1.073, 1.20, side * .755, .018);
      // Cream stripe carries across the rear corner.
      addBox(add, .025, .095, .14, C.cream, rear - .012, .78, side * .53, .009);
      addBox(add, .025, .11, .12, C.redD, rear - .018, .99, side * .50, .025);
      addBox(add, .028, .04, .10, C.orange, rear - .024, .94, side * .50, .008);
    }
    // Pair of dark wipers are on the windscreen surface, with a safe separation from the pane.
    tube([1.224, 1.087, -.42], [1.203, 1.16, -.13], .012, C.ink, 7);
    tube([1.224, 1.087, .08], [1.203, 1.16, .39], .012, C.ink, 7);
    addBox(add, .13, .15, 1.28, C.steelD, -1.225, .46, 0, .045);
    addBox(add, .16, .10, .24, C.steel, -.99, .46, 0, .025);
    // Two nested ladder sections, chunky rails, inset rungs and dark roof saddles.
    for (const x of [-1.04, .13]) for (const side of [-1, 1]) addBox(add, .105, .11, .105, C.ink, x, 1.49, side * .245, .022);
    for (const side of [-1, 1]) {
      addBox(add, 1.44, .075, .065, C.steel, -.45, 1.59, side * .245, .024);
      addBox(add, 1.24, .055, .045, '#feebc8', -.51, 1.65, side * .195, .018);
    }
    for (let k = 0; k < 7; k++) addBox(add, .045, .045, .43, C.steelD, -1.09 + k * .20, 1.59, 0, .014);
    for (let k = 0; k < 6; k++) addBox(add, .035, .035, .34, C.steel, -1.08 + k * .20, 1.65, 0, .012);
    // Cream hose, wound on the side-mounted reel behind the cab. Brass nozzle hangs beside it.
    const rx = .135, ry = 1.135;
    add(G.cyl(.225, .225, .045, 22), C.redD, rx, ry, .66, HP, 0, 0);
    add(G.cyl(.195, .195, .12, 20), C.hoseD, rx, ry, .716, HP, 0, 0);
    for (let k = 0; k < 4; k++) add(G.tor(.162, .027, PI * 2, 6, 22), k % 2 ? C.hose : '#feedc1', rx, ry, .672 + k * .032);
    add(G.cyl(.09, .09, .022, 14), C.red, rx, ry, .805, HP, 0, 0);
    add(G.cyl(.042, .042, .028, 12), C.steelD, rx, ry, .823, HP, 0, 0);
    tube([rx + .18, ry + .02, .75], [rx + .18, ry - .27, .75], .027, C.hose, 8);
    add(G.cyl(.032, .024, .11, 10), C.brass, rx + .18, ry - .32, .75);
    addBox(add, .07, .025, .07, C.ink, rx + .18, ry - .255, .75, .006);
    // Red beacon on its charcoal mount, a small silver siren behind it.
    add(G.cyl(.13, .145, .05, 18), C.ink, .84, 1.65, 0);
    add(new THREE.SphereGeometry(.13, 18, 8, 0, PI * 2, 0, HP), C.lensRed, .84, 1.678, 0, 0, 0, 0, [1, .96, 1]);
    add(G.sph(.025, 8, 6), '#fcba80', .9, 1.754, .06);
    add(G.cyl(.055, .075, .12, 14), C.steel, .58, 1.66, -.27, 0, 0, HP);
    add(G.cyl(.046, .046, .012, 12), C.inner, .514, 1.66, -.27, 0, 0, HP);
  }));
  // Actual front windscreen, with no opaque volume behind it.
  f.add(pane('fire-wind-v1', [[1.211, 1.095, .497], [1.211, 1.095, -.497], [1.091, 1.473, -.497], [1.091, 1.473, .497]], .23));
  f.add(glassGlint('fire-wind-v1', [[1.163, 1.25, -.39], [1.153, 1.28, -.29], [1.101, 1.445, -.08], [1.101, 1.445, -.18]]));
  f.add(put(label(.23, .075, 'fire119', '119', C.redD), 1.348, .47, 0, 0, HP, 0));
  // Shutters roll up into the top rail; each reveals stocked shelves and usable empty space.
  for (const [idx, x, w] of [[0, -.865, .52], [1, -.305, .44]]) {
    const sh = grp(); put(sh, x, 1.35, .666); f.add(sh);
    sh.add(mc('gpt-fire-shutter-' + idx + '-v1', ({ add }) => {
      addBox(add, w + .015, .525, .038, C.steel, 0, -.2625, 0, .015);
      for (let k = 0; k < 7; k++) addBox(add, w - .015, .012, .012, C.steelD, 0, -.045 - k * .072, .025, .004);
      addBox(add, .15, .037, .04, C.ink, 0, -.475, .035, .01);
    }));
    const p = f.part('curtain', sh, t => { sh.scale.y = 1 - .92 * t; sh.position.y = 1.35 + .055 * t; sh.position.z = .666 + .025 * t; }, { label: idx ? '소방차 구급 장비칸' : '소방차 헬멧 장비칸', sfx: 'swish', dur: .38 });
    if (!idx) { p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: -.46, z: .05, parent: sh }; }
    f.spot('inside', null, x, .823, .49, { part: p, maxH: .33, label: idx ? '소방차 구급칸 빈자리' : '소방차 장비칸 빈자리', scale: .8 });
  }
  // Both cab doors are real hollow-window doors hinged at the front.
  const seatsToSpot = [];
  for (const side of [1, -1]) {
    const d = grp(); put(d, 1.205, .805, side * .597); f.add(d);
    d.add(mc('gpt-fire-door-' + side + '-v1', ({ add, tube }) => {
      addBox(add, .72, .255, .055, C.red, -.36, .135, 0, .035);
      addBox(add, .71, .09, .014, C.cream, -.36, .014, side * .035, .01);
      addBox(add, .64, .035, .035, C.redD, -.365, .29, 0, .012);
      // Only narrow posts border the transparent opening.
      addBox(add, .052, .39, .055, C.red, -.702, .485, 0, .019);
      tube([-.02, .29, 0], [-.13, .675, 0], .029, C.red, 8);
      addBox(add, .58, .047, .055, C.red, -.415, .68, 0, .018);
      addBox(add, .12, .028, .026, C.ink, -.58, .205, side * .043, .009);
      addBox(add, .62, .18, .02, C.inner, -.365, .13, -side * .037, .022);
      addBox(add, .22, .04, .04, C.ink, -.375, .18, -side * .06, .01);
    }));
    d.add(pane('fire-door-' + side + '-v1', [[-.666, .325, side * .005], [-.058, .325, side * .005], [-.154, .65, side * .005], [-.666, .65, side * .005]], .19));
    const p = f.part('door', d, t => { d.rotation.y = side * 1.1 * t; }, { label: side === 1 ? '소방차 운전석 문' : '소방차 조수석 문', sfx: 'door', dur: .35 });
    seatsToSpot.push({ side, part: p });
  }
  f.spot('on', null, .57, 1.633, .25, { maxH: .22, label: '소방차 지붕 위', scale: .6 });
  f.spot('under', null, .0, .02, .1, { maxH: .24, label: '소방차 차체 밑', scale: .7 });
  // Keep original stage indices 0/1 equipment, 2 roof, 3 under. New seats follow them.
  for (const { side, part } of seatsToSpot) f.spot('inside', null, .68, .925, side * .27, { part, maxH: .24, label: side === 1 ? '소방차 운전석' : '소방차 조수석', scale: .68 });
};

// A smooth, full 3D roof cap. Its sides curl down into the pillars instead of forming a flat lid.
function bubbleRoof() {
  const rings = [
    [.98, .82, .985, .22], [.98, .82, 1.005, .22],
    [.93, .78, 1.057, .22], [.80, .67, 1.098, .22], [.61, .48, 1.116, .18],
  ], pos = [], idx = [], n = 28;
  for (const [w, d, y, r] of rings) for (let corner = 0; corner < 4; corner++) {
    const centers = [[w / 2 - r, d / 2 - r], [-w / 2 + r, d / 2 - r], [-w / 2 + r, -d / 2 + r], [w / 2 - r, -d / 2 + r]];
    for (let k = 0; k <= 6; k++) { const a = corner * HP + k * HP / 6; pos.push(centers[corner][0] + Math.cos(a) * r, y, centers[corner][1] + Math.sin(a) * r); }
  }
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < n; i++) {
    const a = j * n + i, b = j * n + (i + 1) % n, c = b + n, d = a + n; idx.push(a, c, b, a, d, c);
  }
  const bottom = pos.length / 3; pos.push(0, rings[0][2], 0);
  const top = pos.length / 3; pos.push(0, rings.at(-1)[2], 0);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(bottom, i, j, top, (rings.length - 1) * n + j, (rings.length - 1) * n + i); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// Painted lower car panels follow both actual wheel wells, including the door's two curved corners.
function policePanel(x0, x1, top, bottom, depth, pivotX = 0, pivotY = 0) {
  const s = new THREE.Shape(); s.moveTo(x0, top); s.lineTo(x1, top);
  for (let i = 0; i <= 36; i++) {
    const x = x1 + (x0 - x1) * i / 36; let y = bottom;
    for (const xc of [-.45, .45]) { const dx = x - xc; if (Math.abs(dx) < .262) y = Math.max(y, .235 + Math.sqrt(.262 ** 2 - dx ** 2)); }
    s.lineTo(x, y);
  }
  s.closePath(); const g = G.ext(s, depth, .006, 4); g.translate(-pivotX, -pivotY, -depth / 2); return g;
}

B.gpt_policecar = f => {
  const wr = .235, PGLASS = '#29575f';
  f.add(mc('gpt-police-static-v3', ({ add, tube }) => {
    // Compact toy hatchback underbody: a floor, separate bonnet and rear quarter walls.
    addBox(add, 1.40, .10, .50, C.ink, 0, .265, 0, .03);
    addBox(add, .35, .075, .77, C.inner, 0, .365, 0, .015);
    for (const x of [-.4375, .4375]) addBox(add, .525, .075, .50, C.inner, x, .365, 0, .015);
    wheels(add, { axles: [-.45, .45], r: wr, z: .372, d: .19 });
    for (const side of [-1, 1]) for (const x of [-.45, .45]) arch(add, x, wr, side * .463, C.white, .028, .047);
    // Gently rounded short bonnet and front face. The passenger compartment stays empty behind them.
    add(G.box(.37, .17, .90, .075, 3), C.white, .622, .61, 0);
    add(G.box(.20, .26, .89, .085, 3), C.white, .715, .54, 0);
    for (const side of [-1, 1]) add(policePanel(.435, .79, .64, .29, .04), C.white, 0, 0, side * .425);
    addBox(add, .075, .245, .78, C.white, .16, .525, 0, .025);
    addBox(add, .15, .055, .72, C.white, .24, .639, 0, .022);
    for (const side of [-1, 1]) {
      // rear quarter panel and narrow sill below the door opening
      add(policePanel(-.80, -.23, .64, .29, .04), C.white, 0, 0, side * .425);
      addBox(add, .35, .10, .055, C.white, .015, .31, side * .425, .022);
      add(policePanel(-.77, -.23, .608, .50, .015), C.navy, 0, 0, side * .462);
      addBox(add, .36, .025, .017, C.yellow, -.52, .622, side * .463, .006);
      add(policePanel(.435, .79, .608, .50, .015), C.navy, 0, 0, side * .453);
      addBox(add, .35, .025, .017, C.yellow, .6125, .622, side * .455, .006);
      // Front bonnet racing stripes, geometry only.
      addBox(add, .21, .013, .12, C.navy, .622, .708, side * .225, .005);
      addBox(add, .21, .014, .025, C.yellow, .622, .7085, side * .14, .004);
    }
    // Cabin roof and four posts; the rear window/hatch is an independent moving piece.
    add(bubbleRoof(), C.white, -.04, 0, 0);
    for (const side of [-1, 1]) {
      tube([.45, .69, side * .369], [.30, 1.0, side * .344], .045, C.white, 12);
      tube([-.70, .65, side * .37], [-.47, .99, side * .344], .040, C.white, 12);
      tube([-.655, .689, side * .381], [-.438, .974, side * .355], .012, C.ink, 8);
      tube([-.273, .689, side * .381], [-.273, .974, side * .355], .012, C.ink, 8);
      tube([-.655, .689, side * .381], [-.273, .689, side * .381], .012, C.ink, 8);
      tube([-.438, .974, side * .355], [-.273, .974, side * .355], .012, C.ink, 8);
      addBox(add, .042, .31, .045, C.ink, -.245, .837, side * .371, .017);
      addBox(add, .78, .04, .048, C.white, -.085, .996, side * .347, .016);
      addBox(add, .25, .045, .05, C.white, -.37, .656, side * .38, .016);
    }
    // A deep boot behind the seats: stock lives in the rear row, leaving the front half clear for a hidden item.
    addBox(add, .56, .055, .51, C.ink, -.47, .397, 0, .014);
    addBox(add, .04, .22, .51, C.seat, -.18, .53, 0, .015);
    for (const side of [-1, 1]) addBox(add, .19, .25, .020, C.inner, -.62, .53, side * .263, .008);
    cone(add, -.62, .425, -.14, .72);
    // A small supported wheel-well ledge keeps the cap above flat targets, clear of the shut hatch and inner lining.
    addBox(add, .17, .08, .020, C.inner, -.59, .4645, .235, .008);
    addBox(add, .17, .020, .172, C.inner, -.59, .5145, .16, .008);
    add(G.cyl(.087, .077, .048, 14), C.navy, -.59, .555, .16);
    addBox(add, .115, .019, .145, C.navy, -.59, .535, .125, .025);
    addBox(add, .052, .022, .012, C.yellow, -.59, .558, .074, .005);
    // Two full seats, floor mats, dashboard and the steering wheel: visible through the glass.
    seats(add, { x: 0, y: .465, z: .198, scale: .66, width: .235, floor: .4025 });
    for (const side of [-1, 1]) addBox(add, .15, .012, .21, '#644936', .085, .4085, side * .19, .015);
    addBox(add, .145, .075, .66, C.seat, .345, .69, 0, .026);
    addBox(add, .028, .044, .14, C.ink, .264, .714, .18, .009);
    for (const z of [.145, .205]) add(G.cyl(.018, .018, .009, 10), C.pale, .247, .717, z, 0, 0, HP);
    steering(add, tube, .25, .731, .195, .073);
    addBox(add, .12, .08, .09, C.ink, .06, .46, 0, .017);
    tube([.06, .50, 0], [.06, .57, 0], .01, C.ink, 6); add(G.sph(.018, 8, 6), C.steelD, .06, .574, 0);
    // A substantial bumper and round headlights with cream lenses and raised bezels.
    addBox(add, .12, .145, .94, C.ink, .80, .32, 0, .055);
    addBox(add, .12, .145, .91, C.ink, -.80, .32, 0, .055);
    for (const side of [-1, 1]) {
      add(G.cyl(.101, .101, .038, 20), C.steelD, .787, .52, side * .285, 0, 0, HP);
      add(G.cyl(.077, .077, .041, 18), '#feedc1', .808, .52, side * .285, 0, 0, HP);
      add(G.tor(.081, .012, PI * 2, 5, 18), C.cream, .833, .52, side * .285, 0, HP, 0);
      add(G.cyl(.032, .032, .019, 12), C.orange, .858, .333, side * .365, 0, 0, HP);
      addBox(add, .033, .105, .09, C.lensRed, -.79, .56, side * .37, .027);
      addBox(add, .037, .025, .07, '#f8b15b', -.811, .535, side * .37, .009);
      add(G.cyl(.029, .029, .015, 12), C.orange, -.857, .323, side * .35, 0, 0, HP);
      tube([.388, .778, side * .39], [.42, .798, side * .473], .013, C.white, 7);
      add(G.sph(.061, 12, 8), C.white, .424, .805, side * .495, 0, 0, 0, [.68, 1, 1]);
      add(G.sph(.045, 10, 6), C.steelD, .395, .807, side * .495, 0, 0, 0, [.22, 1, 1]);
    }
    addBox(add, .026, .066, .24, C.ink, .835, .525, 0, .025);
    addBox(add, .010, .012, .16, C.steelD, .859, .528, 0, .004);
    // Charcoal window seal and paired windscreen wipers.
    tube([.455, .695, -.34], [.455, .695, .34], .016, C.ink, 10);
    tube([.455, .695, -.34], [.307, .989, -.317], .018, C.ink, 10);
    tube([.455, .695, .34], [.307, .989, .317], .018, C.ink, 10);
    tube([.307, .989, -.317], [.307, .989, .317], .018, C.ink, 10);
    tube([.458, .704, -.29], [.431, .755, -.075], .009, C.ink, 6);
    tube([.458, .704, .035], [.431, .755, .25], .009, C.ink, 6);
    // Roof bar, blue-white-red, on a dark plinth. Lens tops are softly rounded.
    addBox(add, .18, .055, .57, C.ink, -.01, 1.135, 0, .022);
    addBox(add, .17, .085, .19, C.blue, -.01, 1.185, -.19, .033);
    addBox(add, .17, .080, .15, C.white, -.01, 1.183, 0, .026);
    addBox(add, .17, .085, .19, C.lensRed, -.01, 1.185, .19, .033);
    addBox(add, .11, .012, .12, '#81b9e8', -.01, 1.232, -.19, .005);
    addBox(add, .11, .012, .12, '#f89278', -.01, 1.232, .19, .005);
  }));
  f.add(pane('police-wind-v2', [[.451, .706, .335], [.451, .706, -.335], [.313, .980, -.312], [.313, .980, .312]], .62, PGLASS, .12, true));
  // Keep the broad glass reflection below the roof overhang, .008 normal distance off the actual pane.
  const windAt = (y, z) => [.451 - (y - .706) * (.138 / .274) + .009, y, z];
  f.add(glassGlint('police-wind-v3', [windAt(.744, -.280), windAt(.744, -.180), windAt(.858, -.010), windAt(.858, -.110)], .52));
  // Fixed little rear quarter lights, with actual air between the two sides.
  for (const side of [-1, 1]) f.add(pane('police-quarter-' + side + '-v3', [[-.66, .686, side * .377], [-.273, .686, side * .377], [-.273, .974, side * .351], [-.438, .974, side * .351]], .62, PGLASS, .13, true));
  f.add(put(label(.29, .077, 'policeplate', '경찰', C.navy), .872, .322, 0, 0, HP, 0));
  f.add(put(label(.20, .063, 'policerear', '경찰', C.navy), -.872, .32, 0, 0, -HP, 0));
  // Rear hatch opens the whole boot, including its window. It is not a lid on a solid car body.
  const hatch = grp(); put(hatch, -.49, 1.005, 0); f.add(hatch);
  hatch.add(mc('gpt-police-hatch-v2', ({ add, tube }) => {
    addBox(add, .07, .055, .65, C.white, -.011, -.015, 0, .023);
    // Rear glazing frame runs down to a thick painted lower hatch.
    for (const side of [-1, 1]) tube([-.02, -.04, side * .313], [-.218, -.374, side * .333], .026, C.white, 8);
    tube([-.216, -.372, -.332], [-.216, -.372, .332], .027, C.white, 8);
    addBox(add, .070, .205, .69, C.white, -.246, -.47, 0, .037);
    addBox(add, .019, .085, .68, C.navy, -.291, -.456, 0, .008);
    addBox(add, .02, .023, .68, C.yellow, -.293, -.400, 0, .005);
    addBox(add, .026, .025, .14, C.ink, -.290, -.496, 0, .008);
    addBox(add, .017, .10, .48, C.inner, -.202, -.46, 0, .015);
    tube([-.241, -.355, .22], [-.199, -.304, -.02], .009, C.ink, 6);
  }));
  hatch.add(pane('police-hatch-v2', [[-.200, -.343, .292], [-.200, -.343, -.292], [-.033, -.057, -.287], [-.033, -.057, .287]], .62, PGLASS, .12, true));
  const hp = f.part('lift', hatch, t => { hatch.rotation.z = -1.53 * t; }, { label: '순찰차 트렁크', sfx: 'open', dur: .38 });
  f.spot('inside', null, -.35, .438, 0, { part: hp, maxH: .19, label: '순찰차 트렁크 빈자리', scale: .60 });
  // Front doors have a narrow frame, transparent window and a separate inner door card.
  let passengerSpot;
  for (const side of [1, -1]) {
    const door = grp(); put(door, .435, .401, side * .425); f.add(door);
    door.add(mc('gpt-police-door-' + side + '-v3', ({ add, tube }) => {
      add(policePanel(-.23, .435, .672, .315, .046, .435, .401), C.white, 0, 0, 0);
      add(policePanel(-.23, .435, .608, .50, .014, .435, .401), C.navy, 0, 0, side * .036);
      addBox(add, .65, .025, .016, C.yellow, -.3325, .221, side * .045, .006);
      addBox(add, .65, .035, .038, C.white, -.325, .278, -side * .012, .012);
      // A dark B pillar and a round white outer frame surround one actual tinted window.
      addBox(add, .043, .302, .043, C.ink, -.665, .447, -side * .045, .015);
      tube([0, .29, -side * .025], [-.135, .60, -side * .075], .022, C.ink, 10);
      tube([-.655, .60, -side * .075], [-.135, .60, -side * .075], .022, C.ink, 10);
      tube([-.642, .300, -side * .020], [-.025, .300, -side * .020], .010, C.ink, 8);
      tube([-.642, .300, -side * .020], [-.642, .584, -side * .070], .010, C.ink, 8);
      tube([-.642, .584, -side * .070], [-.154, .584, -side * .070], .010, C.ink, 8);
      tube([-.025, .300, -side * .020], [-.154, .584, -side * .070], .010, C.ink, 8);
      addBox(add, .093, .023, .022, C.steelD, -.45, .25, side * .055, .008);
      add(policePanel(-.17, .29, .61, .45, .018, .435, .401), C.inner, 0, 0, -side * .039);
      addBox(add, .17, .026, .032, C.ink, -.37, .17, -side * .061, .009);
    }));
    door.add(pane('police-door-' + side + '-v3', [[-.632, .306, -side * .022], [-.036, .306, -side * .022], [-.163, .575, -side * .070], [-.632, .575, -side * .070]], .62, PGLASS, .13, true));
    const sideAt = (x, y) => [x, y, -side * (.022 + (y - .306) * (.048 / .269)) + side * .008];
    door.add(glassGlint('police-door-reflection-' + side + '-v1', [sideAt(-.57, .350), sideAt(-.50, .350), sideAt(-.40, .490), sideAt(-.47, .490)], .26));
    const p = f.part('door', door, t => { door.rotation.y = side * 1.15 * t; }, { label: side === 1 ? '순찰차 운전석 문' : '순찰차 조수석 문', sfx: 'door', dur: .35 });
    if (side === 1) { p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: -.45, y: .21, z: .055, parent: door }; }
    if (side === 1) f.spot('inside', null, 0, .513, .198, { part: p, maxH: .19, label: '순찰차 운전석', scale: .64 });
    else passengerSpot = p;
  }
  f.spot('on', null, -.27, 1.123, -.18, { maxH: .17, label: '순찰차 지붕 위', scale: .53 });
  f.spot('under', null, 0, .015, 0, { maxH: .15, label: '순찰차 차체 밑', scale: .65 });
  // Original indices: 0 boot, 1 driver, 2 roof, 3 under. New passenger seat is 4.
  f.spot('inside', null, 0, .513, -.198, { part: passengerSpot, maxH: .19, label: '순찰차 조수석', scale: .64 });
};

export const GPT_VEHICLE_BUILDERS = B;
export const GPT_VEHICLE_INFO = {
  gpt_firetruck: { w: 3, d: 2, name: 'GPT 장비가 든 소방차', price: 0, hidden: true, theme: 'station', category: 'vehicle' },
  gpt_policecar: { w: 2, d: 1, name: 'GPT 내부가 보이는 순찰차', price: 0, hidden: true, theme: 'station', category: 'vehicle' },
};
export const GPT_VEHICLE_META = {
  gpt_firetruck: {
    theme: 'station', category: 'vehicle', oldKey: 'firetruck', concept: 'concept-firetruck-1021.png / middle',
    size: [2.649, 1.803, 1.645], facing: '+x', footprint: [3, 2],
    parts: ['헬멧 장비칸 셔터', '구급 장비칸 셔터', '운전석 문', '조수석 문'],
    inside: '빈 운전실, 좌석 2개, 계기판·핸들·기어봉, 헬멧·소화기·로프·구급함·장갑 선반, 크림 호스 릴',
    note: '기존 소방차와 같은 3×2 슬롯, 본넷 없는 가운데 컨셉. 투명 유리는 얇은 개별 창판. vivid() 후에도 주황·갈색 반사색이 남도록 무광 도장색을 낮춤.',
  },
  gpt_policecar: {
    theme: 'station', category: 'vehicle', oldKey: 'patrolcar', concept: 'concept-policecar-1021.png / left',
    size: [1.744, 1.238, 1.112], facing: '+x', footprint: [2, 1],
    parts: ['트렁크 해치', '운전석 문', '조수석 문'],
    inside: '빈 운전실, 좌석 2개, 계기판·핸들·기어봉, 깊이 .56 트렁크의 교통콘·경찰모 선반과 앞쪽 빈 숨기기 자리',
    note: '기존 순찰차와 같은 2×1 슬롯. 짧은 둥근 보닛과 입체 버블 지붕, .235 반지름 타이어 위 두꺼운 차체, 실내가 비치는 .62 청회색 개별 유리창(기존 inkLayer 정책으로 창 뒤 잉크만 가림), 반사띠. 해치가 열리면 실제 트렁크와 적재품이 보임.',
  },
};

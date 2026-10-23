// 26판 멍뭉이네 — new cadet props. All coordinates are furniture local, facing +z.
// (gpt2-c 작업장 gptdoghouse-cadet.js, fix-1022 a83e02b — ① 10/22 그대로 들여옴: GPT 원색, 부품은 우리 f.part 꼴)
// makeFurniture supplies Furn and bakes the static body and each independent moving part.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { put, mat, mesh, geo, sph, cyl, tor, cone, extrude, starShape } from './kit.js';

const B = {}, PI = Math.PI, HP = PI / 2;
const C = { honey: '#eaa440', darkwood: '#c67f2a', cream: '#fef2e1', white: '#fefde9', teal: '#4c99da',
  tealD: '#357eb7', navy: '#e87eae', brass: '#feb53d', ink: '#6f4b30', orange: '#ed6670', paper: '#fefde9' };

// A single bevel segment and low radial counts keep the detailed props inexpensive after baking.
function box(w, h, d, c, r = .015) {
  r = Math.min(r, Math.min(w, h, d) * .4);
  return mesh(geo(`gptcadetbox|${w}|${h}|${d}|${r}`, () => r > .004
    ? new RoundedBoxGeometry(w, h, d, 1, r) : new THREE.BoxGeometry(w, h, d)), mat(c));
}
function add(g, o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  g.add(put(o, x, y, z, rx, ry, rz)); return o;
}
function rod(g, a, b, r, c, seg = 8) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), dv = bv.clone().sub(av);
  const o = cyl(r, r, dv.length(), c, null, seg);
  o.position.copy(av.add(bv).multiplyScalar(.5));
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.normalize()); g.add(o); return o;
}
function check(g, x, y, z, s = 1) {
  rod(g, [x - .042 * s, y + .003 * s, z], [x - .008 * s, y - .03 * s, z], .012 * s, C.teal, 6);
  rod(g, [x - .008 * s, y - .03 * s, z], [x + .06 * s, y + .044 * s, z], .012 * s, C.teal, 6);
}
// Raised badge geometry, deliberately confined to a front face; no box-wide canvas mapping.
function badge(g, x, y, z, s = 1) {
  add(g, extrude('gptcadet-star-' + s, starShape(.11 * s, .053 * s, 6), .018 * s, C.brass), x, y, z);
  add(g, cyl(.037 * s, .037 * s, .025 * s, C.cream, null, 12), x, y, z + .022 * s, HP);
  add(g, sph(.017 * s, C.tealD, null, 8, 6), x, y, z + .039 * s);
}
function poster(g, x, y, z, s = 1) {
  add(g, box(.44 * s, .57 * s, .045 * s, C.navy, .015), x, y, z);
  // The sheet loses its lower-right triangle to a small lifted fold, with real cream tape.
  const pw = .385 * s, ph = .515 * s, fold = .065 * s;
  const paper = geo('gptcadet-paper-curl|' + s, () => {
    const sheet = new THREE.Shape();
    sheet.moveTo(-pw / 2, -ph / 2); sheet.lineTo(pw / 2 - fold, -ph / 2);
    sheet.lineTo(pw / 2, -ph / 2 + fold); sheet.lineTo(pw / 2, ph / 2);
    sheet.lineTo(-pw / 2, ph / 2); sheet.closePath();
    return new THREE.ExtrudeGeometry(sheet, { depth: .014 * s, bevelEnabled: false });
  });
  add(g, mesh(paper, mat(C.paper)), x, y, z + .027 * s);
  const curl = geo('gptcadet-paper-corner|' + s, () => {
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute([
      pw / 2 - fold, -ph / 2, 0, pw / 2, -ph / 2 + fold, 0,
      pw / 2 - fold * .12, -ph / 2 + fold * .12, .028 * s,
    ], 3));
    gg.computeVertexNormals(); return gg;
  });
  add(g, mesh(curl, mat(C.cream, { side: THREE.DoubleSide })), x, y, z + .042 * s);
  for (const sx of [-1, 1]) add(g, box(.095 * s, .030 * s, .014 * s, C.cream, .004 * s),
    x + sx * .115 * s, y + .244 * s, z + .049 * s, 0, 0, sx * .15);
  add(g, box(.29 * s, .025 * s, .012 * s, C.teal, .004), x, y + .215 * s, z + .049 * s);
  badge(g, x, y + .08 * s, z + .06 * s, .8 * s);
  for (let i = 0; i < 3; i++) {
    const yy = y - .065 * s - i * .064 * s;
    check(g, x - .105 * s, yy, z + .055 * s, .52 * s);
    add(g, box(.17 * s, .014 * s, .012 * s, C.navy, .003), x + .045 * s, yy + .004 * s, z + .055 * s);
  }
}
function mug(g, x, y, z) {
  // Actual hollow wall, recessed drink and a connected handle.
  add(g, cyl(.078, .068, .15, C.teal, { side: THREE.DoubleSide }, 14, true), x, y + .075, z);
  add(g, cyl(.062, .062, .014, '#6f4b30', null, 14), x, y + .125, z);
  add(g, tor(.072, .009, C.cream, null, PI * 2, 5, 18), x, y + .15, z, HP);
  add(g, tor(.047, .013, C.teal, null, PI * 2, 5, 14), x + .093, y + .085, z);
}
function noodles(g, x, y, z) {
  add(g, cyl(.095, .069, .17, C.cream, null, 14), x, y + .085, z);
  add(g, cyl(.091, .084, .067, C.orange, null, 14), x, y + .093, z);
  add(g, cyl(.081, .081, .012, '#c67f2a', null, 14), x, y + .164, z);
  add(g, tor(.09, .01, C.white, null, PI * 2, 5, 18), x, y + .174, z, HP);
  for (let i = 0; i < 3; i++) {
    add(g, tor(.038, .006, '#feebc8', null, PI * 1.4, 4, 11), x + (i - 1) * .019, y + .176, z + (i % 2) * .02, HP, 0, i * .7);
  }
  // A peeled foil lid and two chopsticks make the cup read at the isometric camera.
  add(g, box(.13, .012, .10, C.paper, .01), x - .034, y + .201, z - .075, -.55, 0, -.1);
  for (const dx of [-.018, .018]) rod(g, [x + dx, y + .172, z - .025], [x + dx + .035, y + .35, z - .09], .007, C.honey, 6);
}

B.gptcadetdesk = (f) => {
  const g = f.group, H = .745, W = 1.80, D = .78;
  // Real knee space and wooden joinery: no solid box pretending to be a desk.
  add(g, box(W, .09, D, C.honey, .035), 0, H, 0);
  add(g, box(W - .12, .075, .07, C.darkwood), 0, H - .1, -.30);
  for (const x of [-.79, .79]) for (const z of [-.27, .27]) {
    add(g, box(.075, H - .10, .075, C.honey), x, (H - .10) / 2, z);
    add(g, box(.085, .05, .085, C.tealD), x, .035, z);
  }
  // The small upright study panel carries the badge, a clip, and the whistle hook.
  add(g, box(W - .12, .60, .065, C.cream, .025), 0, H + .32, -.345);
  for (const x of [-.82, .82]) add(g, box(.045, .65, .07, C.honey), x, H + .32, -.345);
  add(g, box(W - .1, .04, .09, C.honey), 0, H + .64, -.345);
  poster(g, .10, H + .33, -.289, .80);
  add(g, box(.11, .04, .035, C.brass), .10, H + .58, -.25);

  // Drawer cabinet is made from separate cheeks, a back and a floor. Its hollow drawer actually slides out.
  const dx = .50, dz = -.025, dw = .48, dd = .59, dy = .470;
  for (const x of [dx - dw / 2 - .025, dx + dw / 2 + .025]) add(g, box(.05, .31, dd, C.honey), x, dy + .07, dz);
  add(g, box(dw, .05, dd, C.darkwood), dx, dy - .095, dz);
  add(g, box(dw, .27, .035, C.honey), dx, dy + .055, dz - dd / 2 + .015);
  // Visibly separate horizontal rails are outside the travel path.
  for (const x of [dx - .215, dx + .215]) add(g, box(.025, .022, dd - .06, C.brass, .004), x, dy - .045, dz);
  const dr = new THREE.Group(); add(g, dr, dx, dy - .055, dz);
  add(dr, box(dw - .045, .035, dd - .06, C.cream), 0, 0, 0);
  for (const x of [-(dw - .07) / 2, (dw - .07) / 2]) add(dr, box(.025, .165, dd - .07, C.cream, .008), x, .092, 0);
  add(dr, box(dw - .06, .165, .025, C.cream, .008), 0, .092, -dd / 2 + .044);
  add(dr, box(dw + .06, .255, .05, C.teal, .018), 0, .075, dd / 2 + .012);
  for (const x of [-.065, .065]) add(dr, cyl(.013, .013, .025, C.brass, null, 8), x, .09, dd / 2 + .05, HP);
  rod(dr, [-.065, .09, dd / 2 + .069], [.065, .09, dd / 2 + .069], .014, C.brass);
  // A real pencil tray occupies the back of the drawer, leaving a broad clear hiding surface in front.
  add(dr, box(.30, .025, .085, C.honey, .01), 0, .031, -.17);
  for (let i = 0; i < 2; i++) add(dr, cyl(.008, .008, .22, [C.orange, C.teal][i], null, 6), 0, .054, -.183 + i * .028, 0, 0, HP);
  const p = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .46 * t; }, { label: '순경 시험 책상 서랍', sfx: 'drawer', dur: .38 });
  f.spot('inside', dr, 0, .035, .07, { part: p, maxH: .16, scale: .68, label: '시험 책상 서랍 안' });
  f.spot('under', null, -.36, .025, .02, { maxH: .475, scale: .95, label: '시험 책상 아래' });

  // Open notebook: two independent thick page blocks, spine, page lines and a pencil.
  const book = new THREE.Group(); add(g, book, -.27, H + .0584, .115, 0, -.12, 0);
  book.scale.setScalar(.70);
  add(book, box(.64, .024, .38, C.navy, .015), 0, 0, 0);
  for (const sx of [-1, 1]) {
    add(book, box(.294, .035, .34, C.paper, .007), sx * .157, .027, 0, 0, 0, sx * -.035);
    for (let i = 0; i < 4; i++) add(book, box(.22 - (i % 2) * .035, .004, .008, '#70caa9', .001), sx * .16, .048, -.102 + i * .058);
  }
  add(book, box(.012, .014, .32, C.honey, .003), 0, .041, 0);
  rod(g, [-.6075, H + .0586, .1755], [-.5025, H + .0614, .0145], .012, C.orange, 6);
  rod(g, [-.6145, H + .0586, .186], [-.6075, H + .0586, .1755], .014, C.cream, 6);
  noodles(g, .47, H + .05, -.10);
  mug(g, .67, H + .05, .20);
  // Brass study lamp with a proper shallow shade and cream light disc.
  add(g, cyl(.115, .125, .038, C.tealD, null, 14), -.69, H + .069, -.21);
  rod(g, [-.69, H + .09, -.21], [-.69, H + .37, -.21], .018, C.brass);
  rod(g, [-.69, H + .37, -.21], [-.56, H + .47, -.17], .018, C.brass);
  add(g, sph(.03, C.brass, null, 8, 6), -.69, H + .37, -.21);
  add(g, cyl(.052, .125, .115, C.teal, null, 14), -.56, H + .445, -.17, -.12, 0, -.12);
  add(g, cyl(.105, .105, .012, '#feebc8', null, 14), -.553, H + .386, -.163, -.12, 0, -.12);
  // Whistle = neck ring, round pea chamber, short mouthpiece and a dark sound slot.
  add(g, tor(.041, .008, C.brass, null, PI * 2, 5, 14), .64, H + .49, -.286);
  add(g, tor(.055, .011, C.navy, null, PI * 2, 5, 16), .64, H + .41, -.267);
  add(g, sph(.064, C.brass, null, 12, 8), .64, H + .32, -.247);
  add(g, cyl(.029, .035, .14, C.brass, null, 10), .73, H + .32, -.247, 0, 0, HP);
  add(g, box(.045, .012, .035, C.ink, .003), .706, H + .352, -.236);
  f.spot('on', null, .29, H + .051, .24, { maxH: .33, scale: .8, label: '시험 노트 옆' });
};

B.gptentrydoor = (f) => {
  const g = f.group, W = 1.06, H = 2.10, zw = 0;
  // Only a portal frame. Nothing spans the opening behind the moving door.
  for (const x of [-.487, .487]) {
    add(g, box(.086, H, .16, C.cream, .018), x, H / 2, zw);
    add(g, box(.04, H - .10, .035, C.honey, .009), x, H / 2, .095);
  }
  add(g, box(W, .04, .16, C.cream, .018), 0, H - .02, zw);
  add(g, box(W, .035, .29, C.honey, .01), 0, .025, .005);
  // Right-hand basket sits behind the door plane and outside the centre passage and leaf's swing.
  const bx = .335, bz = -.31;
  add(g, box(.235, .035, .29, C.honey, .008), bx, .075, bz);
  for (const x of [bx - .104, bx + .104]) add(g, box(.027, .24, .29, C.honey, .006), x, .18, bz);
  add(g, box(.235, .22, .025, C.honey, .006), bx, .17, bz - .134);
  add(g, box(.235, .055, .025, C.honey, .006), bx, .107, bz + .134);
  // Open slatted front gives a clear, real basket interior rather than a solid labelled cube.
  for (const x of [-.072, 0, .072]) add(g, box(.018, .09, .025, C.darkwood, .004), bx + x, .175, bz + .134);
  add(g, box(.24, .022, .032, C.honey, .006), bx, .225, bz + .134);
  const leaf = new THREE.Group(); add(g, leaf, -.435, .05, .045);
  add(leaf, box(.858, 2.0, .065, C.teal, .02), .429, 1.0, 0);
  // Two genuinely raised panels with a separate brass handle, mail slot and badge plaque.
  for (const [y, h] of [[.42, .55], [1.29, .75]]) {
    add(leaf, box(.69, h, .026, C.tealD, .022), .429, y, .046);
    add(leaf, box(.60, h - .09, .022, C.teal, .018), .429, y, .071);
  }
  add(leaf, box(.28, .075, .025, C.brass, .012), .429, .83, .049);
  add(leaf, box(.205, .015, .01, C.ink, .003), .429, .834, .067);
  add(leaf, box(.055, .15, .018, C.brass, .012), .75, .96, .048);
  add(leaf, sph(.032, C.brass, null, 10, 8), .75, .98, .091);
  rod(leaf, [.75, .98, .11], [.65, .98, .11], .018, C.brass);
  badge(leaf, .429, 1.42, .10, .76);
  // Interior also has mouldings and a handle, so the open leaf has a finished back.
  for (const y of [.42, 1.29]) add(leaf, box(.67, .48, .025, C.tealD, .018), .429, y, -.045);
  add(leaf, sph(.03, C.brass, null, 10, 8), .75, .98, -.075);
  for (const y of [.3, 1.6]) add(g, cyl(.018, .018, .10, C.brass, null, 8), -.438, y, .05);
  const p = f.part('door', leaf, t => { leaf.rotation.y = -1.78 * t; }, { label: '진짜 통로가 있는 현관문', sfx: 'door', dur: .5 });
  f.spot('inside', null, bx, .096, bz, { part: p, maxH: .28, scale: .6, label: '현관 바구니' });
};

B.gpttraining = (f) => {
  const g = f.group;
  // A staggered row of cones stays separate from the low hurdle, with a clear passage between.
  for (const [x, z] of [[-.76, -.23], [-.69, .22], [-.27, -.20]]) {
    add(g, box(.24, .04, .24, C.orange, .025), x, .026, z);
    // Three frusta form continuous stripes with no coincident cap faces.
    add(g, cyl(.068, .104, .135, C.orange, null, 12), x, .1135, z);
    add(g, cyl(.046, .068, .082, C.white, null, 12), x, .222, z);
    add(g, cyl(.012, .046, .126, C.orange, null, 12), x, .326, z);
    add(g, cyl(.014, .014, .018, C.orange, null, 10), x, .394, z);
  }
  for (const x of [.18, .76]) {
    add(g, box(.20, .045, .38, C.tealD, .02), x, .03, .08);
    add(g, cyl(.025, .025, .47, C.cream, null, 10), x, .278, .08);
    add(g, sph(.031, C.brass, null, 10, 6), x, .522, .08);
    add(g, box(.065, .04, .065, C.teal, .008), x, .34, .08);
  }
  rod(g, [.18, .36, .08], [.76, .36, .08], .026, C.white, 10);
  for (const x of [.31, .49, .67]) add(g, cyl(.027, .027, .075, C.orange, null, 10), x, .36, .08, 0, 0, HP);
  // Training gear is fixed decor; it is deliberately not a coin-sized findable.
};

B.gptbadgeboard = (f) => {
  const g = f.group, py = 1.53;
  add(g, box(.73, .91, .055, C.honey, .02), 0, py, .045);
  add(g, box(.64, .82, .02, C.tealD, .012), 0, py, .088);
  // The poster is a hinged front; behind it is a shallow real keepsake recess.
  add(g, box(.54, .68, .022, C.cream, .008), 0, py, .115);
  for (const x of [-.285, .285]) add(g, box(.035, .73, .12, C.honey, .008), x, py, .16);
  add(g, box(.59, .035, .12, C.honey, .008), 0, py - .35, .16);
  const flap = new THREE.Group(); add(g, flap, -.32, py, .244);
  poster(flap, .32, 0, 0, 1.35);
  add(flap, sph(.022, C.brass, null, 8, 6), .57, -.30, .035);
  const p = f.part('picture', flap, t => { flap.rotation.y = -1.72 * t; }, { label: '명예 순경 시험표', sfx: 'open', dur: .4 });
  f.spot('inside', null, 0, py - .30, .17, { part: p, maxH: .50, scale: .72, label: '순경 시험표 뒤', wallFace: true });
};

export const GPTCADET_BUILDERS = B;
export const GPTCADET_INFO = {
  gptcadetdesk: { w: 2, d: 1, name: '명예 순경 시험 책상', price: 0, hidden: true },
  gptentrydoor: { w: 1, d: 1, name: '멍뭉이네 현관문', price: 0, hidden: true },
  gpttraining: { w: 2, d: 1, name: '눈썰미 훈련 장애물', price: 0, hidden: true },
  gptbadgeboard: { wall: true, span: 1, w: 1, d: 1, name: '명예 순경 시험표', price: 0, hidden: true },
};

// New workshop pieces for gptdoghouse. Existing furniture keys stay untouched.
// (gpt2-c 작업장 gptdoghouse-devices.js, fix-1022 a83e02b — ① 10/22 그대로 들여옴: GPT 원색, 부품은 우리 f.part 꼴)
// All geometry goes through the game's shared vertex-colour / toon / bake path.
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { clothBend } from './clothbend.js';

const PI = Math.PI, HP = PI / 2;
const C = { cream: '#fef2e1', creamD: '#eecfa3', teal: '#47b6a3', tealD: '#2f9386', terra: '#ed6670', terraL: '#f598a0',
  wood: '#eaa440', woodD: '#c67f2a', ink: '#6f4b30', gold: '#feb53d', linen: '#fef2e1', steel: '#4c99da' };
const B = {};

function gable(w, h) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); return s;
}

function archWall() {
  const s = new THREE.Shape();
  s.moveTo(-.79, .14); s.lineTo(.79, .14); s.lineTo(.79, 1.22); s.lineTo(-.79, 1.22); s.closePath();
  // A true opening, including a rounded crown; there is no dark patch covering a solid box.
  const hole = new THREE.Path(); hole.moveTo(-.48, .14); hole.lineTo(-.48, .63);
  hole.absarc(0, .63, .48, PI, 0, true); hole.lineTo(.48, .14); hole.closePath();
  s.holes.push(hole); return s;
}

// 2 x 2 doghouse: open arch, plank interior, liftable gabled roof and a real lidded toy chest.
// Only the chest is lockable. The split lid clears the roof even if it is opened first.
B.gptdogkennel = (f, T = {}) => {
  const cream = T.gptCream || C.cream, roof = T.gptTerra || C.terra, trim = T.gptTeal || C.teal;
  const key = [cream, roof, trim].join('|'), W = 1.58, D = 1.58, FY = .16;
  f.add(mc('gptdogkennel-shell|' + key, ({ add, tube }) => {
    // Raised timber sill and five stout floorboards, rather than a solid kennel body.
    add(G.box(1.7, .1, 1.7, .035), C.woodD, 0, .07, 0);
    for (let k = 0; k < 5; k++) add(G.box(.298, .065, 1.53, .012), k % 2 ? C.wood : '#eecfa3', -.612 + k * .306, .1325, 0);
    for (const sx of [-1, 1]) {
      add(G.box(.105, 1.06, D, .018), cream, sx * (W / 2 - .0525), .69, 0);
      add(G.box(.07, 1.07, .07, .014), trim, sx * .76, .69, .735);
      add(G.box(.07, 1.07, .07, .014), trim, sx * .76, .69, -.735);
      // Exterior horizontal plank joints are narrow inset shadow lines, always off the face.
      for (let k = 0; k < 5; k++) add(G.pbox(.008, .012, 1.4), C.creamD, sx * .795, .31 + k * .17, 0);
    }
    add(G.box(W - .21, 1.06, .095, .016), cream, 0, .69, -.7425);
    for (let k = 0; k < 5; k++) add(G.pbox(W - .23, .012, .009), C.creamD, 0, .31 + k * .17, -.794);
    add(G.ext(archWall(), .1, .008, 12), cream, 0, 0, .69);
    // Rounded edging describes the arch silhouette from the phone camera.
    tube([-.495, FY, .805], [-.495, .63, .805], .035, trim, 8);
    tube([.495, FY, .805], [.495, .63, .805], .035, trim, 8);
    for (let k = 0; k < 16; k++) {
      const a = PI * k / 16, b = PI * (k + 1) / 16;
      tube([Math.cos(a) * .495, .63 + Math.sin(a) * .495, .805], [Math.cos(b) * .495, .63 + Math.sin(b) * .495, .805], .035, trim, 7);
    }
    // A bone-shaped name badge, fixed over the opening; its entire silhouette is physical.
    add(G.box(.22, .065, .035, .024), C.gold, 0, 1.17, .82);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(G.sph(.036, 8, 6), C.gold, sx * .105, 1.17 + sy * .024, .82, 0, 0, 0, [1, 1, .55]);
    // A soft bed at the doorway; the chest stands farther back, leaving a clear entrance.
    add(G.box(.79, .075, .33, .035), '#66bde0', 0, .2025, .56);
    add(G.box(.65, .016, .24, .008), '#ed9fbf', 0, .248, .56);
  }));

  // All roof pieces travel together, including gables, bargeboards and ridge.
  const roofPivot = grp(); put(roofPivot, 0, 1.22, -.84); f.add(roofPivot);
  const rise = .5, half = .9, slope = Math.atan2(rise, half), panel = Math.hypot(half, rise);
  roofPivot.add(mc('gptdogkennel-roof|' + key, ({ add, tube }) => {
    for (const z of [.015, 1.665]) add(G.ext(gable(1.58, .45), .07, .006, 3), cream, 0, 0, z);
    for (const sx of [-1, 1]) {
      add(G.box(panel, .085, 1.85, .025), roof, sx * half / 2, rise / 2 + .025, .84, 0, 0, -sx * slope);
      // Chunky seam battens give the roof a useful scale without a stretched texture.
      for (let k = 0; k < 6; k++) {
        const t = (k + .5) / 6, x = sx * half * t, y = rise * (1 - t) + .075;
        add(G.box(.027, .025, 1.83, .007), shade(roof, .11), x, y, .84, 0, 0, -sx * slope);
      }
      for (const z of [-.065, 1.745]) tube([0, rise + .09, z], [sx * .94, -.008, z], .04, C.terraL, 7);
    }
    add(G.cyl(.055, .055, 1.92, 12), shade(roof, -.08), 0, rise + .09, .84, HP, 0, 0);
    for (const z of [-.13, 1.81]) add(G.sph(.058, 9, 6), C.terraL, 0, rise + .09, z);
  }));
  const rp = f.part('lift', roofPivot, (t, base) => {
    roofPivot.position.y = base.p.y + .12 * t; roofPivot.rotation.x = -1.0 * t;
  }, { label: '개집 지붕', sfx: 'lift', dur: .5 });
  rp.noHide = true;
  f.spot('inside', null, 0, .26, .56, { part: rp, maxH: .62, label: '개집 앞 쿠션', scale: 1 });

  // Toy chest: hollow bottom, four walls and two side-hinged lid halves.
  const CW = .91, CD = .74, CH = .58, CY = .17, CZ = -.16, CT = CY + CH;
  f.add(mc('gptdogkennel-chest|' + key, ({ add }) => {
    add(G.box(CW, .045, CD, .012), C.woodD, 0, CY + .0225, CZ);
    for (const sx of [-1, 1]) add(G.box(.045, CH - .045, CD, .01), trim, sx * (CW / 2 - .0225), CY + CH / 2 + .0225, CZ);
    for (const sz of [-1, 1]) add(G.box(CW - .09, CH - .045, .045, .01), trim, 0, CY + CH / 2 + .0225, CZ + sz * (CD / 2 - .0225));
    // Warm lining is the inside face, behind the clear volume of the chest.
    add(G.box(CW - .1, .01, CD - .1, .004), C.linen, 0, CY + .051, CZ);
    for (const sx of [-1, 1]) add(G.box(.055, CH + .015, .045, .008), C.wood, sx * (CW / 2 - .06), CY + CH / 2, CZ + CD / 2 + .012);
    add(G.box(.19, .09, .018, .012), C.gold, 0, CT - .1, CZ + CD / 2 + .03);
  }));
  const lids = [-1, 1].map(sx => {
    const pivot = grp(); put(pivot, sx * (CW / 2 - .02), CT, CZ); f.add(pivot);
    pivot.add(mc('gptdogkennel-chestlid|' + key + '|' + sx, ({ add }) => {
      add(G.box(CW / 2 + .025, .055, CD + .045, .018), trim, -sx * CW / 4, .0275, 0);
      add(G.box(CW / 2 - .045, .012, CD - .05, .01), shade(trim, .1), -sx * CW / 4, .061, 0);
      for (const z of [-.22, .22]) add(G.cyl(.026, .026, .085, 8), C.gold, 0, .015, z, HP, 0, 0);
    }));
    return pivot;
  });
  const cp = f.part('lid', lids, t => { lids[0].rotation.z = 1.72 * t; lids[1].rotation.z = -1.72 * t; }, { label: '개집 보물상자', sfx: 'open', dur: .4 });
  cp.lockable = true; cp.lockKind = 'color';
  cp.lockAt = { x: 0, y: CT - .1, z: CZ + CD / 2 + .05 };
  f.lockAt = cp.lockAt;
  f.spot('inside', null, 0, CY + .06, CZ + .04, { part: cp, maxH: .52, label: '개집 보물상자 안', scale: 1 });
  f.spot('beside', null, -.8, .04, .86, { maxH: .55, label: '개집 현관 옆', scale: 1 });
  cp.afterOpen = S => { if (rp.t < .5) S.togglePart(rp, true); };   // (② 10/22: the chest stands under the roof — open, the roof lifts too, or what's inside never shows)
  f.gptStory = { roof: rp, box: cp };
};

// 2 x 1 freestanding garden gate. It owns no wall or backdrop, so the passage is real.
B.gptyardgate = (f, T = {}) => {
  const cream = T.gptCream || C.cream, teal = T.gptTeal || C.teal, key = cream + '|' + teal;
  const HX = .72, PY = 1.56, LH = 1.12;
  f.add(mc('gptyardgate-posts|' + key, ({ add }) => {
    for (const sx of [-1, 1]) {
      add(G.box(.25, PY, .32, .035), cream, sx * .86, PY / 2, 0);
      add(G.box(.31, .08, .38, .025), C.creamD, sx * .86, PY + .04, 0);
      add(G.box(.29, .09, .36, .022), C.terraL, sx * .86, .1, 0);
      for (let k = 0; k < 4; k++) add(G.pbox(.255, .009, .008), C.creamD, sx * .86, .34 + k * .27, .164);
      for (const y of [.39, 1.25]) add(G.cyl(.028, .028, .12, 8), C.gold, sx * HX, y, .04);
    }
    add(G.box(.09, .12, .045, .012), teal, .86, 1.17, .19);
    add(G.sph(.025, 8, 6), C.gold, .86, 1.17, .22, 0, 0, 0, [1, 1, .5]);
    add(G.box(.17, .085, .025, .015), teal, -.86, 1.3, .185);
    // Individual pavers continue the garden route on both sides of the gate.
    for (const z of [-.32, .3]) add(G.box(1.33, .045, .31, .018), '#e8d7b7', 0, .0125, z);
  }));
  const leaves = [-1, 1].map(sx => {
    const p = grp(); put(p, sx * HX, .15, .04); f.add(p);
    p.add(mc('gptyardgate-leaf|' + key + '|' + sx, ({ add }) => {
      const cx = -sx * .35;
      for (const y of [.17, .94]) add(G.box(.69, .075, .065, .02), shade(teal, -.1), cx, y, 0);
      for (let k = 0; k < 5; k++) {
        const x = -sx * (.07 + k * .14), ht = LH - .055 * Math.abs(k - 2);
        add(G.box(.115, ht, .055, .025), k % 2 ? shade(teal, .045) : teal, x, ht / 2, .012);
      }
      add(G.tor(.047, .012, PI * 2, 5, 16), C.gold, -sx * .62, .61, .07);
      add(G.box(.035, .085, .025, .008), C.gold, -sx * .62, .6, .04);
    })); return p;
  });
  leaves.forEach((leaf, i) => {
    const sx = i ? 1 : -1;
    const p = f.part('door', leaf, t => { leaf.rotation.y = sx * 1.58 * t; }, { label: i ? '마당 대문 오른쪽' : '마당 대문 왼쪽', sfx: 'door', dur: .42 });
    f.spot('inside', null, sx * .34, .04, -.28, { part: p, maxH: .62, label: '열린 대문 안쪽', scale: 1 });
  });
};

// 2 x 1 quilt line. Concrete disks finish below the pail rims; no coplanar bucket tops.
B.gptquiltline = (f, T = {}) => {
  const terra = T.gptTerra || C.terra, cream = T.gptCream || C.cream, key = terra + '|' + cream;
  const LY = 1.66, QX = -.15, QW = 1.15, QH = 1.19;
  f.add(mc('gptquiltline-frame|' + key, ({ add, tube }) => {
    for (const x of [-.87, .87]) {
      // The rim's highest point is .285; concrete ends at .257, a visible 28 mm recess.
      add(G.cyl(.145, .115, .25, 16, true), '#f2dcbc', x, .125, 0);
      add(G.cyl(.112, .112, .025, 16), C.creamD, x, .0125, 0);
      add(G.tor(.143, .015, PI * 2, 5, 20), cream, x, .27, 0, HP, 0, 0);
      add(G.cyl(.126, .126, .025, 16), '#a09769', x, .2445, 0);
      tube([x, .25, 0], [x, LY + .06, 0], .025, C.steel, 8);
      add(G.sph(.035, 9, 6), C.steel, x, LY + .08, 0);
    }
    tube([-.87, LY, 0], [.87, LY, 0], .008, C.linen, 5);
    // The shorter rear drape is separate from the front cloth, as a real doubled quilt is.
    add(G.box(QW, .84, .025, .01), shade(terra, .06), QX, LY - .42, -.055);
    add(G.cyl(.037, .037, QW + .015, 12), terra, QX, LY + .008, -.005, 0, 0, HP);
    // A tea towel and two substantial wooden pegs at the spare end of the line.
    add(G.box(.27, .46, .025, .012), '#70caa9', .62, LY - .23, 0);
    for (const y of [.14, .23, .32]) add(G.box(.27, .025, .012, .004), cream, .62, LY - y, .018);
    for (const x of [-.64, .34, .53, .73]) add(G.box(.025, .065, .035, .009), C.wood, x, LY + .005, .028);
    // Hollow laundry basket behind the quilt: floor and slats surround a usable volume.
    const BW = .79, BD = .38, BZ = -.26;
    add(G.box(BW, .045, BD, .018), C.woodD, -.12, .05, BZ);
    for (const z of [BZ - BD / 2, BZ + BD / 2]) {
      add(G.box(BW, .04, .035, .01), C.wood, -.12, .32, z);
      for (let k = 0; k < 7; k++) add(G.box(.065, .25, .025, .012), C.wood, -.45 + k * .11, .185, z);
    }
    for (const x of [-.12 - BW / 2, -.12 + BW / 2]) {
      add(G.box(.035, .04, BD, .01), C.wood, x, .32, BZ);
      for (let k = 0; k < 3; k++) add(G.box(.025, .25, .065, .012), C.wood, x, .185, BZ - .11 + k * .11);
    }
    add(G.box(.63, .045, .27, .02), '#fef2e1', -.12, .093, BZ);
  }));
  const cloth = grp(); put(cloth, QX, LY, .035); f.add(cloth);
  cloth.add(mc('gptquiltline-cloth|' + key, ({ add }) => {
    add(G.box(QW, QH, .035, .012), cream, 0, -QH / 2, 0);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const x = -.43 + c * .287, y = -.15 - r * .292;
      add(G.box(.271, .276, .012, .008), (r + c) % 3 === 0 ? '#4c99da' : (r + c) % 2 ? terra : '#e980b2', x, y, .025);
      if ((r + c) % 2 === 0) {
        for (let k = 0; k < 5; k++) { const a = k * PI * 2 / 5; add(G.sph(.025, 6, 4), cream, x + Math.cos(a) * .031, y + Math.sin(a) * .031, .043, 0, 0, 0, [1, 1, .32]); }
        add(G.sph(.018, 6, 4), C.gold, x, y, .047, 0, 0, 0, [1, 1, .4]);
      }
    }
    add(G.box(QW + .01, .035, .055, .01), terra, 0, -QH + .012, .008);
  }));
  const p = f.part('lift', cloth, clothBend(f, cloth, { along: [0, -1, 0], toward: [0, 0, 1], len: QH, turn: 4.4, bias: 3, tip: .15, segs: 36 }), { label: '이불', sfx: 'flip', dur: .76 });
  f.spot('inside', null, -.12, .12, -.26, { part: p, maxH: .62, label: '이불 뒤 빨래 바구니', scale: 1 });
  f.spot('beside', null, .68, .02, .32, { maxH: .55, label: '빨랫줄 옆', scale: 1 });
};

// A second, additive laundry device. Its rectangular head rotates as one assembly,
// while the front quilt has its own nested bending part. The post never turns.
B.gptrotaryline = (f, T = {}) => {
  const cream = T.gptCream || C.cream, teal = T.gptTeal || C.teal, terra = T.gptTerra || C.terra;
  const key = [cream, teal, terra].join('|'), LY = 1.59, QX = -.12, QW = 1.02, QH = 1.10;
  f.add(mc('gptrotaryline-base|' + key, ({ add, tube }) => {
    // A heavy concrete-filled paint pail, with a visible 29 mm recess under its rim.
    add(G.cyl(.185, .145, .25, 18, true), '#f2dcbc', 0, .125, 0);
    add(G.cyl(.145, .145, .025, 18), C.creamD, 0, .0125, 0);
    add(G.tor(.18, .016, PI * 2, 6, 22), cream, 0, .265, 0, HP, 0, 0);
    add(G.cyl(.16, .16, .022, 18), '#a09769', 0, .241, 0);
    add(G.box(.12, .065, .012, .01), teal, 0, .12, .175);
    tube([0, .25, 0], [0, LY + .035, 0], .034, C.steel, 9);
    add(G.cyl(.062, .062, .085, 14), teal, 0, LY - .045, 0);
    add(G.tor(.065, .012, PI * 2, 5, 18), C.gold, 0, LY - .005, 0, HP, 0, 0);
    // The latch tab and arrow are physical parts of the swivel collar, not a label.
    add(G.box(.16, .035, .06, .012), C.gold, .075, LY - .055, .055, 0, 0, -.12);
  }));

  const head = grp(); put(head, 0, LY, 0); head.rotation.y = -.5; f.add(head);
  head.add(mc('gptrotaryline-rack|' + key, ({ add, tube }) => {
    // A real rectangle carried by two cross arms and a stout central hub.
    const X = .62, Z = .285, Y = .035;
    for (const z of [-Z, Z]) tube([-X, Y, z], [X, Y, z], .026, C.wood, 8);
    for (const x of [-X, X]) tube([x, Y, -Z], [x, Y, Z], .026, C.wood, 8);
    for (const x of [-.40, .40]) tube([x, Y, -Z], [x, Y, Z], .018, C.steel, 7);
    tube([-X, Y, 0], [X, Y, 0], .026, teal, 8);
    tube([0, Y, -Z], [0, Y, Z], .026, teal, 8);
    add(G.cyl(.085, .085, .11, 16), teal, 0, .025, 0);
    add(G.cyl(.045, .045, .025, 12), C.gold, 0, .093, 0);
    // The back half hangs from the same front rail and turns with the whole head.
    add(G.box(QW, .76, .025, .009), shade(terra, .08), QX, -.38, .22);
    add(G.cyl(.036, .036, QW + .02, 12), terra, QX, .014, .25, 0, 0, HP);
    // One short striped towel on the rear rail keeps the rack visually balanced.
    add(G.box(.30, .51, .025, .012), '#70caa9', .37, -.22, -.285);
    for (let k = 0; k < 3; k++) add(G.box(.30, .025, .012, .005), cream, .37, -.11 - k * .13, -.265);
    for (const x of [-.55, .31]) add(G.box(.035, .075, .045, .008), C.woodD, x, .023, .285);
    for (const x of [.26, .47]) add(G.box(.035, .075, .045, .008), C.woodD, x, .023, -.285);
  }));
  const rotate = f.part('door', head, t => { head.rotation.y = -.5 + 1.2 * t; }, { label: '회전 빨래건조대', sfx: 'ratchet', dur: 1.4 });

  const cloth = grp(); put(cloth, QX, .012, .275); head.add(cloth);
  cloth.add(mc('gptrotaryline-quilt|' + key, ({ add }) => {
    add(G.box(QW, QH, .032, .01), cream, 0, -QH / 2, 0);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const x = -.335 + c * .335, y = -.14 - r * .273;
      add(G.box(.318, .255, .012, .008), (r + c) % 3 === 0 ? '#4c99da' : (r + c) % 2 ? terra : '#e980b2', x, y, .024);
      if ((r + c) % 2 === 0) {
        for (let k = 0; k < 5; k++) { const a = k * PI * 2 / 5; add(G.sph(.025, 6, 4), cream, x + Math.cos(a) * .029, y + Math.sin(a) * .029, .04, 0, 0, 0, [1, 1, .3]); }
        add(G.sph(.016, 6, 4), C.gold, x, y, .043, 0, 0, 0, [1, 1, .35]);
      }
    }
    add(G.box(QW + .01, .032, .05, .009), terra, 0, -QH + .012, .009);
  }));
  const quilt = f.part('lift', cloth, clothBend(f, cloth, { along: [0, -1, 0], toward: [0, 0, 1], len: QH, turn: 4.4, bias: 3, tip: .15, segs: 36 }), { label: '회전 건조대 이불', sfx: 'flip', dur: .76 });
  // Bonus hiding places remain on the actual ground; turning a drying rack never drags
  // ground items around with it. The cloth, towels and pegs all remain attached overhead.
  f.spot('behind', null, .50, .025, -.18, { part: rotate, maxH: .50, label: '회전 건조대 뒤 빈 자리', scale: 1 });
  f.spot('inside', null, -.48, .025, .30, { part: quilt, maxH: .50, label: '조각 이불 뒤 빈 자리', scale: 1 });
  f.gptRotary = { rotate, quilt, head, cloth, startYaw: -.5, endYaw: .7 };
};

export const GPTDOG_BUILDERS = B;
export const GPTDOG_INFO = {
  gptdogkennel: { w: 2, d: 2, name: '멍뭉이의 보물 개집', price: 0, hidden: true },
  gptyardgate: { w: 2, d: 1, name: '마당으로 열리는 대문', price: 0, hidden: true },
  gptquiltline: { w: 2, d: 1, name: '포근한 조각 이불 빨랫줄', price: 0, hidden: true },
  gptrotaryline: { w: 2, d: 1, name: '빙글 회전 조각 이불 건조대', price: 0, hidden: true },
};

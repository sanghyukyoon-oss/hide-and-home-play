// 47판 흑백: pond pavilion and a small wisteria walk. New registry only; original park2 is untouched.
// Furniture uses the game's Furn/kit materials, picking, sound and bakeStatic pipeline (makeFurniture bakes it).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { geo, mat, mesh, cyl, sph, tor, cone, put, grp } from './kit.js';

const PI = Math.PI, HP = PI / 2;
const C = { chalk: '#fef2e1', pale: '#f6e0bf', stone: '#e8d7b7', joint: '#a09769',
  wood: '#eaa440', dark: '#6f4b30', ink: '#644936', pond: '#a2c8bb', water: '#b0e5e8',
  leaf: '#c6c393', leafD: '#84ae9d', flower: '#e88c94', flowerL: '#f3b8b2', brass: '#feb53d' };
const B = {};
const box = (g, w, h, d, c, x = 0, y = 0, z = 0, r = .025) => {
  // Existing outdoor props use one bevel segment: same soft edges with substantially less mobile vertex work.
  r = Math.min(r, w * .45, h * .45, d * .45);
  const shape = geo(`gptp2box|${w}|${h}|${d}|${r.toFixed(4)}`, () => r > .004 ? new RoundedBoxGeometry(w, h, d, 1, r) : new THREE.BoxGeometry(w, h, d));
  const o = put(mesh(shape, mat(c)), x, y, z); g.add(o); return o;
};
const cylinder = (g, r, h, c, x = 0, y = 0, z = 0, rx = 0, rz = 0, seg = 12) => {
  const o = put(cyl(r, r, h, c, null, seg), x, y, z, rx, 0, rz); g.add(o); return o;
};
const ball = (g, r, c, x, y, z, scale = [1, 1, 1]) => {
  const o = put(sph(r, c, null, 8, 6), x, y, z, 0, 0, 0, scale); g.add(o); return o;
};
const tube = (g, a, b, r, c) => {
  const A = new THREE.Vector3(...a), V = new THREE.Vector3(...b).sub(A), o = cyl(r, r, V.length(), c, null, 8);
  o.position.copy(A).addScaledVector(V, .5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), V.normalize()); g.add(o); return o;
};
// Transform a physical moving sub-box into furniture-local space; item children do not become solid walls.
const movingWalkBox = (f, pivot, b) => {
  const m = f.group.matrixWorld.clone().invert().multiply(pivot.matrixWorld);
  const q = new THREE.Box3(new THREE.Vector3(...b.slice(0, 3)), new THREE.Vector3(...b.slice(3, 6))).applyMatrix4(m);
  return [...q.min.toArray(), ...q.max.toArray()];
};
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
function shelfShell(g, w, h, d, y, c = C.wood) {
  box(g, w, .08, d, c, 0, y + .04, 0);
  box(g, w, .07, d, c, 0, y + h - .035, 0);
  box(g, .07, h - .12, d, c, -w / 2 + .035, y + h / 2, 0);
  box(g, .07, h - .12, d, c, w / 2 - .035, y + h / 2, 0);
  box(g, w - .12, h - .12, .045, C.dark, 0, y + h / 2, -d / 2 + .023);
}
function drawer(f, x, y, z, w, d, label, lock = false) {
  const g = grp(); put(g, x, y, z); f.add(g);
  box(g, w, .075, d, C.pale, 0, .037, -d / 2);
  box(g, .055, .22, d, C.wood, -w / 2 + .027, .15, -d / 2);
  box(g, .055, .22, d, C.wood, w / 2 - .027, .15, -d / 2);
  box(g, w, .23, .055, C.wood, 0, .15, -d);
  box(g, w + .08, .3, .08, C.chalk, 0, .15, .015);
  box(g, .24, .065, .08, C.dark, 0, .17, .09);
  const p = f.part('drawer', g, (t, b) => { g.position.z = b.p.z + (d * .9) * t; }, { label, sfx: 'drawer', dur: .45 });
  if (lock) { p.lockable = true; p.lockKind = 'lever'; f.lockAt = { x: .25, y: .14, z: .08, parent: g }; }
  f.spot('inside', g, 0, .08, -d * .48, { part: p, maxH: .5, label: label + ' 안', scale: 1 });
  return p;
}

// The visible courses sit under the shell's own rounded top slab. A small logical footprint leaves planner tiles free.
B.gpt_p2foundation = f => {
  f.noSolid = true; f.collideBox = [-4.3, -.98, -3.8, 4.3, -.14, 3.8];
  box(f.group, 8.5, .33, 7.5, '#c69b6b', 0, -.815, 0, .1);
  box(f.group, 8.56, .16, 7.56, '#e8d7b7', 0, -.57, 0, .045);
  box(f.group, 8.58, .13, 7.58, '#f6e0bf', 0, -.205, 0, .045);
  // Brick band, with short corners and distinct mortar. No coplanar faces.
  for (let k = 0; k < 14; k++) for (const s of [-1, 1]) {
    box(f.group, .55, .12, .032, k % 3 ? '#d8b27d' : '#eecfa3', -3.9 + k * .6, -.57, s * 3.797, .012);
  }
  for (let k = 0; k < 12; k++) for (const s of [-1, 1]) {
    box(f.group, .032, .12, .55, k % 3 ? '#d8b27d' : '#eecfa3', s * 4.297, -.57, -3.3 + k * .6, .012);
  }
  for (const s of [-1, 1]) {
    box(f.group, 8.2, .055, .035, '#a97746', 0, -.77, s * 3.76, .008);
    box(f.group, .035, .055, 7.2, '#a97746', s * 4.26, -.77, 0, .008);
  }
};

// Open-sided pavilion: the back half of the roof remains, so the seat/drawer are visible at the default phone view.
B.gpt_p2pavilion = f => {
  const g = f.group, roofRise = .2; // 2.01 m clear under the beam, measured from the .3755 m deck.
  box(g, 3.08, .26, 2.24, C.dark, 0, .13, .1, .07);
  box(g, 3.14, .09, 2.3, C.chalk, 0, .305, .1, .04);
  for (let k = 0; k < 11; k++) box(g, .255, .025, 2.15, k % 2 ? '#eecfa3' : '#feebc8', -1.35 + .27 * k, .363, .1, .007);
  // Actual side entrance: two steps meet the right edge, no gate painted over a wall.
  box(g, .54, .23, .9, C.stone, 1.84, .115, .03, .025);
  box(g, .54, .115, .94, C.pale, 2.38, .0575, .03, .025);
  for (const z of [-.82, .82]) for (const x of z < 0 ? [-1.36, 1.36] : [-1.92, 1.92]) {
    if (z > 0) box(g, .24, .5, .24, C.stone, x, .25, z, .035);
    box(g, .22, .12, .22, C.pale, x, .43, z, .035);
    box(g, .145, 1.76 + roofRise, .145, C.dark, x, 1.34 + roofRise / 2, z, .03);
    box(g, .23, .11, .23, C.wood, x, 2.2 + roofRise, z, .025);
  }
  for (const z of [-.82, .82]) box(g, z < 0 ? 2.95 : 4.08, .15, .18, C.wood, 0, 2.26 + roofRise, z);
  for (const s of [-1, 1]) { const beam = box(g, .18, .15, 1.8, C.wood, s * 1.64, 2.26 + roofRise, 0); beam.rotation.y = s * Math.atan2(.56, 1.64); }
  // A pitched, ridged tile half roof, thick eaves. The front is intentionally cut away, supported by the front beam.
  const roof = box(g, 3.32, .15, 1.1, C.dark, 0, 2.43 + roofRise, -.5, .035); roof.rotation.x = -.2;
  for (let i = 0; i < 13; i++) {
    const tile = box(g, .07, .055, 1.08, i % 2 ? '#c6c393' : '#a09769', -1.5 + i * .25, 2.53 + roofRise, -.49, .018); tile.rotation.x = -.2;
  }
  cylinder(g, .09, 3.36, C.chalk, 0, 2.64 + roofRise, -.99, 0, HP, 10);
  box(g, 3.35, .09, .12, C.chalk, 0, 2.36 + roofRise, .02);
  // Waist-high rear rail, with ordinary bench structure and space beneath its seat.
  for (const x of [-1.12, -.75, -.38, 0, .38, .75, 1.12]) box(g, .055, .38, .055, C.wood, x, .7, -.86, .012);
  box(g, 2.7, .09, .12, C.chalk, 0, .94, -.86);
  // The real deeper drawer accommodates a phone-size cookie, with air around its circular edge.
  shelfShell(g, 1.75, .38, 1.02, .38);
  const benchDrawer = drawer(f, 0, .47, .5, 1.51, .85, '정자 벤치 서랍', true);
  benchDrawer.spots[0].scale = 1.6;
  box(g, 1.88, .1, 1.13, C.dark, 0, .823, -.03, .04);
  // A 5 cm cushion keeps the usable seat at .548 m above the deck rather than .638 m.
  const cu = grp(); put(cu, -.43, .898, -.04); f.add(cu);
  box(cu, .69, .05, .61, C.chalk, 0, 0, 0, .022);
  for (const x of [-.23, 0, .23]) box(cu, .035, .008, .52, C.dark, x, .029, 0, .004);
  const p = f.part('lift', cu, (t, b) => { cu.position.y = b.p.y + .46 * t; cu.position.x = b.p.x - .2 * t; cu.rotation.z = -.55 * t; }, { label: '줄무늬 정자 방석', sfx: 'lift', dur: .38 });
  f.spot('under', null, -.43, .878, -.04, { part: p, maxH: .03, label: '정자 방석 아래', scale: 1 });
  f.spot('on', null, .47, .878, -.03, { maxH: .65, label: '정자 벤치', scale: 1.2 });
  f.spot('behind', null, -1.12, .37, .55, { maxH: .5, label: '정자 기둥 옆', scale: 1 });
  // Floors and steps are supported tops, while posts/bench/rail remain real obstructions.
  const solid = [[-1.57, 0, -1.05, 1.57, .35, 1.25], [-1.4775, .35, -.975, 1.4775, .3755, 1.175],
    [1.57, 0, -.42, 2.11, .23, .48], [2.11, 0, -.44, 2.65, .115, .5],
    [-.94, .38, -.595, .94, .873, .535], [-1.35, .51, -.92, 1.35, .985, -.8]];
  for (const z of [-.82, .82]) for (const x of z < 0 ? [-1.36, 1.36] : [-1.92, 1.92]) {
    if (z > 0) solid.push([x - .12, 0, z - .12, x + .12, .5, z + .12]);
    solid.push([x - .11, .37, z - .11, x + .11, .49, z + .11], [x - .073, .46, z - .073, x + .073, 2.22 + roofRise, z + .073]);
  }
  f.walkBoxes = () => [...solid, movingWalkBox(f, benchDrawer.pivots[0], [-.795, 0, -.905, .795, .3, .13])];
  f.walkSurfaces = [{ box: [-1.57, -1.05, 1.57, 1.25], y: .35 }, { box: [-1.4775, -.975, 1.4775, 1.175], y: .3755 },
    { box: [1.57, -.42, 2.11, .48], y: .23 }, { box: [2.11, -.44, 2.65, .5], y: .115 }];
  f.walkSteps = [{ x: 2.94, y: 0, z: .03 }, { x: 2.38, y: .115, z: .03 }, { x: 1.84, y: .23, z: .03 }, { x: 1.29, y: .3755, z: .03 },
    { x: 1.27, y: .3755, z: .5 }, { x: 1.24, y: .3755, z: .9 },
    { x: -1.5, y: .35, z: 1.02 }, { x: -1.5, y: .175, z: 1.52 }];
  f.walkDoorways = [{ x: 1.55, y: .35, z: .03, width: .84, label: '정자 오른쪽 계단 입구' }];
};

B.gpt_p2exitstep = f => {
  // Separate floor furniture keeps the pavilion's diagonal empty AABB corner out of fitParts.
  box(f.group, .54, .175, .54, C.stone, 0, .0875, 0, .025);
  f.walkBoxes = [[-.27, 0, -.27, .27, .175, .27]];
  f.walkSurfaces = [{ box: [-.245, -.245, .245, .245], y: .175 }];
};

// A shallow masonry pond and a real, supported hump-back bridge. Waterwheel chain has one t, staged for clear causality.
B.gpt_p2pond = f => {
  const g = f.group;
  box(g, 3.9, .15, 2.78, C.dark, 0, .075, 0, .18);
  box(g, 3.53, .07, 2.4, C.pond, 0, .17, 0, .16);
  for (const z of [-1.28, 1.28]) {
    box(g, 3.9, .21, .22, C.stone, 0, .24, z, .05);
    // A recessed continuous coping supports the 5cm mortar gaps between individual capstones.
    box(g, 3.9, .075, .27, C.stone, 0, .3825, z, .01);
    for (let k = 0; k < 10; k++) box(g, .35, .08, .27, k % 2 ? C.pale : C.chalk, -1.71 + k * .38, .385, z, .027);
  }
  for (const x of [-1.84, 1.84]) {
    box(g, .22, .21, 2.4, C.stone, x, .24, 0, .05);
    box(g, .27, .075, 2.4, C.stone, x, .3825, 0, .01);
    for (let k = 0; k < 6; k++) box(g, .27, .08, .35, k % 2 ? C.pale : C.chalk, x, .385, -1.0 + .4 * k, .027);
  }
  const water = grp(); put(water, 0, .24, 0); f.add(water);
  box(water, 3.5, .025, 2.36, C.water, 0, 0, 0, .14);
  // Pale ripple strokes. The game supplies all living animals; no custom fish are modelled here.
  for (const [x, z] of [[-.9, .7], [.8, -.8], [-1.25, -.8]]) {
    box(water, .32, .009, .023, C.chalk, x, .02, z, .01);
    box(water, .14, .009, .023, C.chalk, x + .22, .02, z + .07, .01);
  }
  // Bridge crosses behind the foreground mechanism: thick steps, two beams, four stone footings, rail connections.
  const bz = -.38;
  for (const x of [-1.5, 1.5]) for (const z of [bz - .42, bz + .42]) cylinder(g, .14, .4, C.stone, x, .23, z, 0, 0, 8);
  const bridgeY = x => .46 + .29 * (1 - (x / 1.65) ** 2);
  const solid = [[-1.95, 0, -1.39, 1.95, .15, 1.39], [-1.75, .15, -1.18, 1.75, .253, 1.18],
    [-1.95, .135, -1.415, 1.95, .425, -1.145], [-1.95, .135, 1.145, 1.95, .425, 1.415],
    [-1.975, .135, -1.175, -1.705, .425, 1.175], [1.705, .135, -1.175, 1.975, .425, 1.175],
    [-1.44, .18, 1.18, -.36, 1.43, 1.62],
    [-.48, .31, 1.18, .88, 1.19, 1.67]];
  f.walkSurfaces = [{ box: [-1.95, -1.415, 1.95, -1.145], y: .425 }, { box: [-1.95, 1.145, 1.95, 1.415], y: .425 },
    { box: [-1.975, -1.175, -1.705, 1.175], y: .425 }, { box: [1.705, -1.175, 1.975, 1.175], y: .425 }];
  f.walkSteps = [];
  for (const s of [-1, 1]) for (const [x, top, w] of [[2.44, .145, .54], [2.1, .285, .54], [1.81, .425, .56]]) {
    // Three chunky 14cm risers, with full-width stone support down to the plinth.
    box(g, w, top + .14, 1.04, top > .4 ? C.pale : C.stone, s * x, (top - .14) / 2, bz, .035);
    solid.push([s * x - w / 2, -.14, bz - .52, s * x + w / 2, top, bz + .52]);
    f.walkSurfaces.push({ box: [s * x - w / 2 + .025, bz - .495, s * x + w / 2 - .025, bz + .495], y: top });
  }
  f.walkSteps.push({ x: -2.44, y: .145, z: bz }, { x: -2.1, y: .285, z: bz }, { x: -1.81, y: .425, z: bz });
  // A low turning tread gives the west entrance a safe route down the narrow outer garden walk.
  box(g, .54, .14, .8, C.stone, -2.37, .07, .54, .025);
  solid.push([-2.64, 0, .14, -2.1, .14, .94]);
  f.walkSurfaces.push({ box: [-2.615, .165, -2.125, .915], y: .14 });
  f.walkSteps.push({ x: -2.37, y: .14, z: .54 });
  // Two real front treads connect the short near-bank ledge with the courtyard.
  for (const [z, top] of [[1.96, .145], [1.66, .285]]) {
    box(g, .56, top, .54, C.pale, 1.63, top / 2, z, .025);
    solid.push([1.35, 0, z - .27, 1.91, top, z + .27]);
    f.walkSurfaces.push({ box: [1.375, z - .245, 1.885, z + .245], y: top });
    f.walkSteps.push({ x: 1.63, y: top, z });
  }
  f.walkSteps.push({ x: 1.63, y: .425, z: 1.28 });
  for (let i = 0; i < 11; i++) {
    const x = -1.5 + i * .3, y = bridgeY(x);
    box(g, .285, .1, .98, i % 2 ? C.chalk : C.pale, x, y, bz, .025);
    solid.push([x - .1425, y - .05, bz - .49, x + .1425, y + .05, bz + .49]);
    f.walkSurfaces.push({ box: [x - .1425, bz - .49, x + .1425, bz + .49], y: y + .05 });
    f.walkSteps.push({ x, y: y + .05, z: bz });
    for (const s of [-1, 1]) {
      if (i < 10) tube(g, [x, y - .12, bz + s * .34], [x + .3, bridgeY(x + .3) - .12, bz + s * .34], .055, C.dark);
      if (i % 2 === 0) {
        box(g, .07, .53, .07, C.dark, x, y + .3, bz + s * .47, .02);
        ball(g, .065, C.chalk, x, y + .61, bz + s * .47);
        solid.push([x - .035, y + .035, bz + s * .47 - .035, x + .035, y + .675, bz + s * .47 + .035]);
      }
      if (i < 10) tube(g, [x, y + .55, bz + s * .47], [x + .3, bridgeY(x + .3) + .55, bz + s * .47], .035, C.dark);
    }
  }
  f.walkSteps.push({ x: 1.81, y: .425, z: bz }, { x: 2.1, y: .285, z: bz }, { x: 2.44, y: .145, z: bz });
  for (const s of [-1, 1]) solid.push([-1.535, .975, bz + s * .47 - .035, 1.535, 1.335, bz + s * .47 + .035]);
  f.walkBoxes = solid;
  f.walkDoorways = [{ x: -1.84, y: .425, z: bz, width: .87, label: '돌다리 서쪽 입구' }, { x: 1.84, y: .425, z: bz, width: .87, label: '돌다리 동쪽 입구' }];
  // Chain machinery on the near bank, with a waterwheel on a visible axle and a toothed drive gear beside it.
  const wheel = grp(); put(wheel, -.9, .88, 1.48); f.add(wheel);
  wheel.add(tor(.43, .055, C.dark, null, PI * 2, 5, 18));
  cylinder(wheel, .13, .17, C.chalk, 0, 0, 0, HP);
  for (let i = 0; i < 8; i++) {
    const a = i * PI / 4;
    tube(wheel, [0, 0, 0], [Math.cos(a) * .43, Math.sin(a) * .43, 0], .027, C.wood);
    const paddle = box(wheel, .23, .105, .24, C.chalk, Math.cos(a) * .44, Math.sin(a) * .44, 0, .02); paddle.rotation.z = a;
  }
  for (const x of [-1.13, -.67]) box(g, .1, .77, .2, C.stone, x, .57, 1.28);
  cylinder(g, .065, .52, C.dark, -.9, .88, 1.26, HP);
  const gear = grp(); put(gear, -.2, .88, 1.49); f.add(gear);
  cylinder(gear, .235, .12, C.wood, 0, 0, 0, HP, 0, 12);
  for (let i = 0; i < 10; i++) { const a = i * PI / 5, o = box(gear, .1, .11, .14, C.dark, Math.cos(a) * .25, Math.sin(a) * .25, 0, .014); o.rotation.z = a; }
  cylinder(gear, .06, .16, C.chalk, 0, 0, .04, HP);
  box(g, .18, .55, .2, C.stone, -.2, .59, 1.3);
  const crank = grp(); put(crank, .41, .89, 1.52); f.add(crank);
  cylinder(crank, .19, .07, C.dark, 0, 0, 0, HP);
  box(crank, .13, .13, .035, C.brass, 0, 0, .06, .012);
  box(crank, .07, .07, .025, C.dark, 0, 0, .084, .008); // visibly empty square socket
  const handle = grp(); crank.add(handle);
  box(handle, .27, .07, .08, C.brass, .12, 0, .12);
  cylinder(handle, .065, .17, C.chalk, .25, 0, .21, HP);
  box(g, .8, .13, .55, C.pale, .4, .37, 1.35, .04);
  for (const x of [.08, .73]) box(g, .085, .64, .12, C.dark, x, .7, 1.3);
  tube(g, [-.2, 1.11, 1.43], [.41, 1.07, 1.43], .024, C.dark);
  tube(g, [-.2, .65, 1.43], [.41, .71, 1.43], .024, C.dark);
  // Gate, rack and the dry clue bay: gate really clears the mouth between its stone posts.
  for (const x of [.92, 1.62]) box(g, .15, 1.1, .23, C.stone, x, .85, .63, .03);
  box(g, .9, .1, .3, C.chalk, 1.27, 1.43, .63);
  const gate = grp(); put(gate, 1.27, .46, .63); f.add(gate);
  box(gate, .58, .48, .12, C.dark, 0, .24, 0);
  for (const x of [-.18, 0, .18]) box(gate, .025, .42, .025, C.pale, x, .24, .075, .005);
  box(gate, .055, .66, .07, C.brass, 0, .76, -.02, .012);
  // The lifting bay is wholly in FRONT of the bridge; the rising tablet cannot pass through a deck board.
  const tray = grp(); put(tray, .33, -.45, .65); f.add(tray);
  box(tray, .84, .06, .68, C.dark, 0, 0, 0, .035);
  box(tray, .7, .06, .55, C.chalk, 0, .06, 0, .035);
  // One funny, believable catch: an abandoned rain boot stands beside the actual runtime key/clue place.
  const boot = grp(); put(boot, -.24, .09, -.05); tray.add(boot);
  box(boot, .23, .1, .36, C.dark, 0, .05, .06, .045);
  box(boot, .22, .14, .31, C.brass, 0, .13, .07, .06);
  box(boot, .2, .31, .2, C.brass, 0, .255, -.025, .045);
  cylinder(boot, .125, .065, C.chalk, 0, .41, -.025, 0, 0, 10);
  cylinder(boot, .08, .012, C.dark, 0, .45, -.025, 0, 0, 10);
  const p = f.part('wheel', [crank, gear, wheel, gate, tray, water], t => {
    const drive = smooth(t / .36), spin = smooth((t - .15) / .57), lift = smooth((t - .47) / .37), reveal = smooth((t - .67) / .33);
    crank.rotation.z = -drive * PI * 3; gear.rotation.z = spin * PI * 4; wheel.rotation.z = -spin * PI * 2;
    gate.position.y = .46 + lift * .62; water.position.y = .24 - lift * .18;
    tray.position.y = -.45 + reveal * .98;
  }, { label: '연못 크랭크 · 수차 · 수문', sfx: 'ratchet', dur: 2.8 });
  // Recipe 47 reserves the main chain for the acorn pulley and squirrel-house scale.
  // This pond lever is an optional, freely tappable toy; it asks for no tool and gates no progression.
  p.gptChain = false;
  // Model motion only. Ordinary togglePart drives it; never mark an unrecognised p.device/isGadget.
  const clueSpot = f.spot('inside', tray, .19, .12, .14, { part: p, maxH: .6, label: '수문이 올리는 트레이', scale: 1 });
  f.pondTraySpot = clueSpot;
  f.spot('on', null, 1.45, .43, 1.28, { maxH: .55, label: '연못 돌턱', scale: 1 });
  f.spot('behind', null, -1.7, .01, -1.52, { maxH: .5, label: '연못 뒤', scale: 1 });
};

B.gpt_p2wisteria = f => {
  const g = f.group;
  box(g, 2.82, .08, 1.8, C.pale, 0, .04, 0, .09);
  // Three frames, short roof slats, tapered individual wisteria bunches. Open path remains between them.
  for (const x of [-1.22, 1.22]) for (const z of [-.7, .7]) {
    box(g, .23, .14, .23, C.stone, x, .15, z, .04);
    box(g, .14, 1.98, .14, C.dark, x, 1.2, z, .035);
  }
  for (const z of [-.73, .73]) box(g, 2.94, .18, .16, C.dark, 0, 2.19, z, .035);
  for (let k = 0; k < 7; k++) box(g, .12, .14, 1.92, C.wood, -1.32 + .44 * k, 2.32, 0, .025);
  for (let k = 0; k < 8; k++) {
    const x = -1.27 + .36 * k, z = k % 2 ? -.62 : .58, drop = .34 + (k % 3) * .1;
    ball(g, .19, k % 2 ? C.leafD : C.leaf, x, 2.39, z, [1.65, .43, 1]);
    tube(g, [x, 2.31, z], [x, 2.31 - drop, z], .018, C.leafD);
    for (let j = 0; j < 4; j++) ball(g, .105 - j * .018, j % 2 ? C.flowerL : C.flower, x + (j % 2 ? .035 : -.025), 2.2 - j * drop / 3, z, [1, .84, .95]);
  }
  // Potting ledge at the back is a real cupboard: rear panel, bottom, middle shelf, side stiles.
  const cabinet = grp(); put(cabinet, 0, .08, -.46); g.add(cabinet); shelfShell(cabinet, 1.67, .9, .48, 0, C.dark);
  box(cabinet, 1.53, .04, .43, C.chalk, 0, .34, .015, .015);
  const curtain = grp(); put(curtain, -.73, .56, -.17); f.add(curtain);
  box(curtain, 1.46, .73, .065, C.pale, .73, 0, 0, .025);
  for (let k = 0; k < 9; k++) box(curtain, .045, .67, .018, C.dark, .08 + .16 * k, 0, .043, .007);
  const p = f.part('curtain', curtain, t => { curtain.scale.x = 1 - .85 * t; }, { label: '등나무 선반 줄무늬 가림막', sfx: 'swish', dur: .6 });
  f.spot('inside', null, .3, .47, -.4, { part: p, maxH: .4, label: '등나무 선반 윗칸', scale: 1 });
  f.spot('inside', null, .31, .17, -.32, { part: p, maxH: .22, label: '등나무 선반 아랫칸', scale: 1 });
  // A recognisable watering can and empty flower pot on the ledge; handles attach on both ends.
  cylinder(g, .13, .24, C.wood, -.67, 1.1, -.46);
  g.add(put(tor(.12, .024, C.dark, null, PI * 1.6, 5, 16), -.82, 1.15, -.46, 0, HP, .2));
  tube(g, [-.58, 1.12, -.46], [-.38, 1.23, -.46], .035, C.wood);
  g.add(put(cyl(.13, .09, .2, C.pale, null, 10, true), .51, 1.09, -.46));
  cylinder(g, .105, .015, C.dark, .51, 1.17, -.46);
  box(g, .8, .04, .66, C.pale, .02, 1, -.45, .025);
  f.spot('on', null, .02, 1.04, -.45, { maxH: .3, label: '등나무 선반 위', scale: 3.1 });
  // The required flip sign faces the walk. Its back depicts a leaf, a basket and a house: physical observations.
  const sign = grp(); put(sign, 0, 1.66, .79); f.add(sign);
  box(sign, 1.12, .4, .09, C.chalk, 0, 0, 0, .045);
  for (const x of [-.4, .4]) tube(g, [x, 2.16, .76], [x, 1.88, .79], .025, C.dark);
  // Front: one leaf, back: the basket and the little house toward the foreground.
  const sgLeaf = ball(sign, .11, C.leafD, 0, 0, .065, [.65, 1.3, .22]); sgLeaf.rotation.z = -.5;
  box(sign, .22, .13, .025, C.dark, -.25, -.025, -.06, .02);
  sign.add(put(tor(.09, .018, C.dark, null, PI, 4, 12), -.25, .04, -.06));
  box(sign, .19, .16, .025, C.dark, .22, -.025, -.06, .015);
  const roofIcon = box(sign, .18, .18, .025, C.dark, .22, .08, -.061, .008); roofIcon.rotation.z = PI / 4;
  const signPart = f.part('flip', sign, t => { sign.rotation.y = PI * t; }, { label: '등나무길 뒤집는 안내판', sfx: 'flip', dur: .45 });
  signPart.gptClue = ['basket', 'squirrelhouse'];
  f.walkBoxes = [[-1.41, 0, -.9, 1.41, .08, .9], [-.835, .08, -.7, .835, .98, -.22]];
  for (const x of [-1.22, 1.22]) for (const z of [-.7, .7]) f.walkBoxes.push([x - .115, .08, z - .115, x + .115, .22, z + .115],
    [x - .07, .21, z - .07, x + .07, 2.19, z + .07]);
  f.walkSurfaces = [{ box: [-1.41, -.9, 1.41, .9], y: .08 }];
  f.walkDoorways = [{ x: 0, y: .08, z: .7, width: 2.21, label: '등나무길 앞 입구' }];
};

B.gpt_p2readingbench = f => {
  const g = f.group;
  shelfShell(g, 1.86, .385, .73, 0, C.dark);
  box(g, 1.96, .11, .83, C.wood, 0, .45, 0, .045);
  const drawerPart = drawer(f, 0, .085, .4, 1.6, .58, '연못 관찰대 서랍');
  drawerPart.spots.forEach(s => { s.reserved = true; });
  // The drawer first looks empty; tapping its real second floor raises the tray underneath.
  const dg = drawerPart.pivots[0], floor = grp(), insert = grp();
  put(floor, 0, .14, -.48); dg.add(floor);
  box(floor, 1.43, .025, .42, C.pale, 0, 0, .21, .018);
  box(floor, .18, .025, .05, C.dark, 0, .024, .35, .008);
  put(insert, 0, .09, -.28); dg.add(insert); box(insert, 1.28, .025, .38, C.chalk, 0, 0, 0, .015);
  const falsePart = f.part('lid', [floor, insert], t => { floor.rotation.x = -1.55 * t; insert.position.y = .09 + .42 * smooth(t); }, { label: '벤치 서랍 비밀 바닥', sfx: 'thunk', dur: .55 });
  f.spot('inside', insert, 0, .025, .02, { part: falsePart, maxH: .6, label: '벤치 비밀 바닥 안', scale: 1 });
  for (const x of [-.77, .77]) box(g, .09, .76, .09, C.dark, x, .665, -.32);
  const back = grp(); put(back, 0, .585, -.32); f.add(back);
  box(back, 1.83, .47, .09, C.chalk, 0, .24, 0, .045);
  // Simple engraved pond/bridge motif, made from geometry instead of a stretched box texture.
  box(back, 1.38, .24, .013, C.dark, 0, .25, .055, .06);
  for (const x of [-.36, 0, .36]) box(back, .15, .035, .016, C.chalk, x, .26, .068, .006);
  f.spot('on', null, .46, .51, .1, { maxH: .55, label: '연못 관찰대', scale: 1 });
  f.walkBoxes = () => [[-.98, 0, -.415, .98, 1.06, .455],
    movingWalkBox(f, dg, [-.84, 0, -.635, .84, .3, .13]),
    movingWalkBox(f, floor, [-.715, -.013, 0, .715, .037, .42]),
    movingWalkBox(f, insert, [-.64, -.013, -.19, .64, .013, .19])];
};

// Recipe 47: two actual operations. Collect the acorn from the lowered tree basket, then put it on the scale.
// Both parts expose their own reserved payout spot to the common device planner; no new UI or story is defined here.
B.gpt_p2acornhouse = f => {
  const g = f.group;
  box(g, 2.32, .13, 2.48, C.pale, 0, .065, .19, .12);
  cylinder(g, .19, 1.92, C.wood, -.72, 1.09, -.35, 0, 0, 10);
  cylinder(g, .28, .17, C.dark, -.72, .21, -.35, 0, 0, 10);
  tube(g, [-.72, 1.45, -.35], [-1.05, 2.17, -.43], .095, C.wood);
  tube(g, [-.72, 1.6, -.35], [-.28, 2.18, -.37], .085, C.wood);
  for (const [x, y, z, s] of [[-.93, 2.31, -.46, 1.2], [-.43, 2.38, -.43, 1.15], [-.72, 2.62, -.46, 1]]) {
    ball(g, .4, y > 2.5 ? C.leaf : C.leafD, x, y, z, [s, .86, 1]);
  }
  // The pulley beam is bolted into the trunk; its wheel, rope, basket and crank are visibly connected.
  box(g, .8, .13, .14, C.dark, -.61, 2.05, -.06, .03);
  tube(g, [-.72, 1.98, -.35], [-.57, 2.07, .34], .07, C.dark);
  const pulley = grp(); put(pulley, -.57, 2.07, .36); f.add(pulley);
  pulley.add(tor(.15, .035, C.chalk, null, PI * 2, 5, 16));
  cylinder(pulley, .05, .14, C.dark, 0, 0, 0, HP, 0, 10);
  tube(g, [-.91, .98, .01], [-.91, 2.07, .01], .022, C.dark);
  tube(g, [-.91, 2.07, .01], [-.72, 2.07, .36], .022, C.dark);
  g.add(put(tor(.15, .018, C.dark, null, PI, 4, 16), -.57, 2.07, .36));
  const crank = grp(); put(crank, -.93, .95, .09); f.add(crank);
  cylinder(crank, .18, .08, C.dark, 0, 0, 0, HP);
  box(crank, .12, .12, .04, C.brass, 0, 0, .065, .012);
  box(crank, .065, .065, .025, C.dark, 0, 0, .095, .006);
  const handle = grp(); crank.add(handle); handle.visible = false;
  box(handle, .25, .065, .07, C.brass, .11, 0, .12);
  cylinder(handle, .06, .17, C.chalk, .23, 0, .2, HP, 0, 10);
  f.gptToolHandle = f.handle = handle;
  const basket = grp(); put(basket, -.42, 1.34, .36); f.add(basket);
  box(basket, .88, .065, .74, C.wood, 0, .035, 0, .05);
  for (const x of [-.405, .405]) box(basket, .07, .26, .74, C.chalk, x, .18, 0, .025);
  for (const z of [-.335, .335]) box(basket, .74, .26, .07, C.chalk, 0, .18, z, .025);
  for (const x of [-.3, 0, .3]) box(basket, .055, .22, .025, C.dark, x, .18, .379, .006);
  basket.add(put(tor(.38, .028, C.dark, null, PI, 5, 16), 0, .28, 0));
  const rope = cylinder(g, .022, 1, C.dark, -.42, 1.98, .36, 0, 0, 8);
  const setRope = y => { const a = y + .69, b = 2.07; rope.position.y = (a + b) / 2; rope.scale.y = Math.max(.03, b - a); };
  setRope(1.34);
  const first = f.part('slide', [crank, pulley, basket, rope], t => {
    const v = smooth(t); crank.rotation.z = -PI * 3 * v; pulley.rotation.z = PI * 3 * v;
    basket.position.y = 1.34 - .87 * v; basket.rotation.z = Math.sin(t * PI * 3) * .035 * (1 - t); setRope(basket.position.y);
  }, { label: '나무 위 도토리 바구니 도르래', sfx: 'ratchet', dur: 1.45 });
  first.gptChain = true; first.gptTool = 'pulleyhandle'; first.gptStage = 'gptacornpulley'; first.gptSequence = 1;
  first.gptToolHandle = handle; first.gptTell = '…도토리가 달그락!';
  first.gptSteps = [{ at: 0, sfx: 'ratchet' }, { at: .86, sfx: 'land' }];
  first.needMsg = '…손잡이가 쏙 빠졌네?';
  const acornSpot = f.spot('inside', basket, 0, .08, .02, { part: first, maxH: .6, label: '내려온 도토리 바구니', scale: 2.7 });
  acornSpot.reserved = true; first.gptClueSpot = acornSpot;
  // A tiny garden squirrel house with a real interior and a raised door frame.
  const hx = .51, hz = .07;
  box(g, .99, .1, .88, C.dark, hx, .19, hz, .055);
  box(g, .87, .05, .75, C.chalk, hx, .265, hz, .025);
  for (const x of [hx - .455, hx + .455]) box(g, .08, .83, .82, C.chalk, x, .69, hz, .025);
  box(g, .83, .83, .075, C.pale, hx, .69, hz - .375, .025);
  box(g, .99, .08, .84, C.wood, hx, 1.135, hz, .025);
  for (const s of [-1, 1]) {
    const roof = box(g, .63, .11, 1.06, C.wood, hx + s * .235, 1.31, hz, .035); roof.rotation.z = -s * .48;
  }
  cylinder(g, .055, 1.08, C.dark, hx, 1.46, hz, HP, 0, 10);
  // High window, offset in front of the backing board. A real hole is unnecessary on the open cut-away interior.
  box(g, .21, .2, .025, C.dark, hx, .89, hz - .324, .04);
  box(g, .018, .16, .025, C.chalk, hx, .89, hz - .307, .005);
  const door = grp(); put(door, .935, .27, .51); f.add(door);
  box(door, .83, .79, .08, C.pale, -.415, .395, 0, .035);
  for (const x of [-.65, -.4, -.15]) box(door, .025, .68, .025, C.wood, x, .395, .052, .006);
  cylinder(door, .06, .07, C.dark, -.66, .4, .09, HP, 0, 10);
  // The scale stands LEFT of the door's swing, so the pan never intersects its open leaf.
  const sx = -.46, sz = 1.0;
  box(g, .83, .08, .48, C.dark, sx, .2, sz, .04);
  const post = put(cone(.13, .39, C.wood, null, 4), sx, .43, sz); g.add(post);
  const scale = grp(); put(scale, sx, .64, sz); f.add(scale);
  box(scale, .85, .075, .09, C.dark, 0, 0, 0, .025);
  for (const x of [-.36, .36]) {
    box(scale, .31, .055, .32, C.chalk, x, .065, 0, .025);
    box(scale, .33, .055, .035, C.wood, x, .11, .14, .012);
  }
  const acorn = grp(); put(acorn, -.36, .38, 0); scale.add(acorn); acorn.visible = false;
  ball(acorn, .14, C.wood, 0, .11, 0, [.8, 1.15, .8]);
  cylinder(acorn, .145, .075, C.dark, 0, .23, 0, 0, 0, 10);
  box(acorn, .035, .09, .035, C.wood, 0, .3, 0, .01);
  // A little cord runs from the rising right pan to the latch at the door jamb.
  tube(g, [-.1, .72, sz], [.11, .94, .54], .019, C.dark);
  const second = f.part('door', [scale, door], t => {
    acorn.visible = t > .002; acorn.position.y = .38 - .23 * smooth(t / .35);
    scale.rotation.z = .29 * smooth((t - .18) / .45);
    door.rotation.y = 1.65 * smooth((t - .5) / .5);
  }, { label: '도토리 다람쥐 집 저울', sfx: 'thunk', dur: 1.45 });
  second.gptChain = true; second.gptTool = 'acorn'; second.gptStage = 'gptacornscale'; second.gptSequence = 2;
  second.gptTell = '…도토리 하나에 집이 열려?!';
  second.gptSteps = [{ at: 0, sfx: 'place' }, { at: .25, sfx: 'thunk' }, { at: .6, sfx: 'latch' }, { at: .95, sfx: 'special' }];
  second.needMsg = '…저울이 한쪽으로 기울었네?';
  const reward = f.spot('inside', null, hx, .3, .12, { part: second, maxH: .7, label: '다람쥐 집 색 조각', scale: 1 });
  reward.reserved = true; second.gptClueSpot = f.gptChainSpot = reward;
  // Visibility-changing subgroups must survive bakeStatic even though their parent is already a moving part.
  f.live = [handle, acorn];
  f.spot('behind', null, -.85, .135, -.78, { maxH: .7, label: '도토리 나무 뒤', scale: 2 });
  // The canopy is overhead; only the trunk/root, actual low machinery and toy house obstruct feet.
  const solid = [[-1.16, 0, -1.05, 1.16, .13, 1.43], [-1, .125, -.63, -.44, .295, -.07],
    [-.91, .13, -.54, -.53, 2.05, -.16], [.015, .14, -.37, 1.005, 1.175, .51],
    [-.875, .16, .76, -.045, .64, 1.24]];
  f.walkBoxes = () => [...solid, movingWalkBox(f, basket, [-.44, 0, -.37, .44, .708, .392]),
    movingWalkBox(f, door, [-.83, 0, -.04, 0, .79, .125]),
    movingWalkBox(f, scale, [-.525, -.038, -.16, .525, .14, .175])];
  f.walkSurfaces = [{ box: [-1.16, -1.05, 1.16, 1.43], y: .13 }];
};

B.gpt_p2picnic = f => {
  const g = f.group;
  // Hollow picnic chest, brass corners, woven front strips. Nothing opens onto a solid block.
  box(g, 1.08, .08, .83, C.wood, 0, .1, 0);
  for (const x of [-.505, .505]) box(g, .07, .49, .83, C.wood, x, .38, 0);
  for (const z of [-.38, .38]) box(g, .94, .49, .07, C.wood, 0, .38, z);
  // Narrow rim around a real open cavity, with a separate hinged lid.
  for (const x of [-.51, .51]) box(g, .08, .05, .86, C.dark, x, .64, 0, .015);
  for (const z of [-.39, .39]) box(g, .96, .05, .08, C.dark, 0, .64, z, .015);
  const lid = grp(); put(lid, 0, .7, -.43); f.add(lid);
  box(lid, 1.18, .11, .92, C.chalk, 0, .025, .43, .055);
  for (const x of [-.36, .36]) box(lid, .09, .013, .89, C.dark, x, .089, .43, .008);
  for (const x of [-.4, -.2, 0, .2, .4]) box(g, .05, .37, .016, C.chalk, x, .33, .425, .005);
  box(g, .14, .12, .06, C.dark, 0, .54, .45, .015);
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.65 * t; }, { label: '피크닉 도시락 상자', sfx: 'open', dur: .5 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: .51, z: .49 };
  // A rising insert lifts the findable above the rim, with a compartmented tray rather than grey emptiness.
  const tray = grp(); put(tray, 0, .16, 0); f.add(tray);
  box(tray, .84, .05, .59, C.chalk, 0, 0, 0, .025);
  const ap = p.apply; p.apply = (t, ...b) => { ap(t, ...b); tray.position.y = .16 + .5 * t; };
  // Add tray as a pivot as well so bakeStatic preserves its moving geometry.
  p.pivots.push(tray); tray.userData.base = { p: tray.position.clone(), r: tray.rotation.clone(), s: tray.scale.clone() };
  f.spot('inside', tray, 0, .045, 0, { part: p, maxH: .6, label: '피크닉 상자 안', scale: 1 });
  f.spot('behind', null, -.56, .01, -.1, { maxH: .5, label: '피크닉 상자 옆', scale: 1 });
};

B.gpt_p2scope = f => {
  const g = f.group;
  // The card cabinet hangs high behind the post; its empty lower bounding-box corner must not limit a low drawer.
  f.collideBox = [-.36, 0, -.36, .36, 1.3, .42];
  cylinder(g, .35, .1, C.pale, 0, .05, 0, 0, 0, 12);
  cylinder(g, .09, .93, C.dark, 0, .53, 0, 0, 0, 10);
  for (let k = 0; k < 3; k++) { const a = k * PI * 2 / 3; tube(g, [0, .6, 0], [Math.cos(a) * .3, .12, Math.sin(a) * .3], .035, C.wood); }
  const head = grp(); put(head, 0, 1.08, 0); f.add(head);
  cylinder(head, .15, .7, C.chalk, 0, 0, 0, HP);
  cylinder(head, .18, .09, C.dark, 0, 0, .36, HP);
  cylinder(head, .13, .012, '#84ae9d', 0, 0, .414, HP);
  cylinder(head, .09, .11, C.dark, 0, 0, -.38, HP);
  box(g, 1.03, .46, .14, C.dark, 0, .94, -.65, .045);
  tube(g, [0, .6, 0], [0, .88, -.65], .045, C.dark);
  // A chunky hidden observation card slides up when the telescope turns toward the pond.
  const card = grp(); put(card, 0, .73, -.64); f.add(card);
  box(card, .92, .41, .05, C.chalk, 0, .205, 0, .03);
  // Leaf / bridge / boot: three physical observations, never a fake numeric combination.
  const leaf = ball(card, .09, C.leafD, -.29, .23, .04, [.7, 1.3, .18]); leaf.rotation.z = -.45;
  box(card, .018, .14, .018, C.dark, -.29, .17, .055, .004);
  box(card, .23, .035, .025, C.dark, 0, .18, .042, .008);
  for (const x of [-.08, .08]) box(card, .035, .11, .025, C.dark, x, .13, .042, .007);
  card.add(put(tor(.09, .018, C.dark, null, PI, 4, 12), 0, .2, .043));
  box(card, .12, .17, .025, C.dark, .27, .24, .042, .02);
  box(card, .2, .065, .025, C.dark, .3, .13, .042, .02);
  box(card, .15, .035, .025, C.brass, .27, .33, .062, .006);
  const p = f.part('flip', [head, card], t => { head.rotation.y = -.95 * t; head.rotation.x = -.25 * t; card.position.y = .73 + .43 * smooth((t - .35) / .65); }, { label: '연못 쪽으로 돌리는 망원경', sfx: 'swish', dur: .9 });
  p.gptClue = ['leaf', 'bridge', 'boot'];
  f.spot('behind', null, 0, .93, -.57, { part: p, maxH: .5, label: '망원경 관측 카드 뒤', scale: 1 });
};

export const GPT_PARK2_BUILDERS = B;
export const GPT_PARK2_INFO = {
  gpt_p2foundation: { w: 1, d: 1, floor: true, hidden: true, name: '연못 공원 지층' },
  gpt_p2pavilion: { w: 3, d: 2, name: '반지붕 연못 정자', price: 0 },
  gpt_p2exitstep: { w: 1, d: 1, name: '정자 왼쪽 디딤돌', price: 0 },
  gpt_p2pond: { w: 4, d: 3, name: '수차와 돌다리 연못', price: 0 },
  gpt_p2wisteria: { w: 3, d: 2, name: '등나무 산책길', price: 0 },
  gpt_p2readingbench: { w: 2, d: 1, name: '연못 관찰 벤치', price: 0 },
  gpt_p2picnic: { w: 1, d: 1, name: '피크닉 상자', price: 0 },
  gpt_p2scope: { w: 1, d: 1, name: '연못 망원경', price: 0 },
  gpt_p2acornhouse: { w: 2, d: 2, name: '도토리 도르래와 다람쥐 집 저울', price: 0 },
};

export function makePark2Map(theme) {
  const F = (type, x, z, a = 0) => ({ type, x, z, a });
  return { theme, bleed: false, fitAll: true, friendAt: [2.7, 2.65], rooms: [
    { at: [0, 0], layout: { w: 8, d: 7, theme, exact: true, bleed: false,
      walls: { N: 'none', W: 'none', E: 'none', S: 'none' },
      floorZones: [
        { i: .1, j: .1, w: 7.8, d: 1.05, kind: 'brickpave', a: '#fef2e1', b: '#e8d7b7' },
        { i: 4.35, j: 1.15, w: 3.55, d: 5.75, kind: 'brickpave', a: '#f6e0bf', b: '#eecfa3' },
        { i: .1, j: 5.48, w: 4.15, d: 1.42, kind: 'brickpave', a: '#f6e0bf', b: '#eecfa3' },
      ], furniture: [F('gpt_p2foundation', 0, 0), F('gpt_p2pavilion', -2.25, -2.45), F('gpt_p2exitstep', -3.75, -.93),
        F('gpt_p2wisteria', 2.32, -2.35), F('gpt_p2pond', -1.38, .36),
        F('gpt_p2acornhouse', 2.7, .21), F('gpt_p2readingbench', -2.62, 2.77),
        F('leverpost', 1.72, 2.2)], decor: [] } },
  ] };
}

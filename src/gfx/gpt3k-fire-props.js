// 19판 몽글 119 안전센터 gptfirestation (gpt3-k, fix-1022 반영 — ① 10/22 들여옴): 빌더와 배치만. 작업장의 장치 엔진(gptAction은 표시만 남음)·
// 보행 그래프(FIRE_WALK)·맵 등록·미리보기·키트(gptfiretruck2)·자기 바닥(gptOwnFloor)은 뺌. 색은 GPT 원색 그대로(사용자 10/22: 18판 다시 칠한 것보다 원색이 낫다),
// 테마의 벽 크림만 옅은 중성으로. 간판·안내판 글자는 우리 fitText/textTex(게임 글꼴·칸 맞춤·영어 tr).
// GPT neighbourhood 119 station — a real, open garage below a lived-in dormitory.
// New registrations only. Native gearrack / lockers retain the story route;
// the architecture is a hollow floor object, never a hide box.
import * as THREE from 'three';
import { put, grp, mat, mesh, texCache, roundRect } from './kit.js';
import { HG as G, hmc as rawMc, hxf as xf, hleaves as leaves } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';
import { GPT_FIRETRUCK2_BUILDERS, GPT_FIRETRUCK2_INFO } from './gpt3k-firetruck2-props.js';
import { Char } from './chars.js';
import { reindexExact } from './bake.js';

// 새 글자 한·영 (간판·안내판·번호판, 맵 이름) — i18n 사전에 없을 때만 더함
const WORDS = {
  '몽글 안전센터': 'Mongle Fire Station', '몽글 119 안전센터': 'Mongle 119 Station', '쉬어 가요': 'Rest Room',
  '오늘의 훈련': "Today's Drill", '물! 불! 안전!': 'Water! Fire! Safety!', '출동 준비!': 'Ready to roll!', '경찰': 'POLICE',
};
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

// These singleton meshes bypass bakeUnder's multi-mesh buckets. Share exact
// corners locally while retaining all normals, colours, triangles and pivots.
const indexed = new WeakMap();
function mc(key, ...args) {
  const m = rawMc('gpt3k|' + key, ...args), source = m.geometry;
  if (!indexed.has(source)) {
    const g = reindexExact(source.clone()); g.name = source.name;
    indexed.set(source, g);
  }
  m.geometry = indexed.get(source);
  return m;
}

const PI = Math.PI, HP = PI / 2;
const C = {
  cream: '#f6e0bf', pale: '#fef2e1', plaster: '#fbf7f0', brick: '#f8b15b', brickD: '#c67f2a',
  coral: '#ef795f', red: '#e45f4d', redD: '#a95b3b', sage: '#84ae9d', sageD: '#528f83',
  wood: '#eaa440', woodD: '#6f4b30', dark: '#6f4b30', brass: '#eaa440', brassD: '#c67f2a',
  steel: '#c5bda9', steelD: '#a7a595', sky: '#b0e5e8', blue: '#79b7cf', blanket: '#79b7cf',
  yellow: '#feb53d', ink: '#644936', leaf: '#84ae9d', leafD: '#729764', soil: '#78481d',
};
const B = {}, TEX = texCache();
// (textTex draws at 2x and again once the game font has come; .5 scale: the drawings below keep their own canvas units)
const tex = (key, w, h, draw) => TEX.get('gpt3k-fire|' + key, () => textTex(w, h, c => { c.scale(.5, .5); draw(c, w, h); }));
function fitLine(c, text, x, y, maxWidth, size, color) {
  fitText(c, text, x, y, maxWidth, size, color, { weight: '800' });
}
const decal = (w, h, t) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: t }), { cast: false });
const action = (p, id, role = 'aux', o = {}) => { p.gptAction = { id, role, ...o }; return p; };
function nativeResident(kind, pose, face) {
  const ch = new Char(kind);
  ch.shadow.removeFromParent(); ch.pose = pose; ch.setFace(face); ch.update(0);
  // Keep the native face/limb rig intact when furniture static meshes are baked.
  ch.root.traverse(o => { if (o.isMesh) o.userData.noMerge = true; });
  return ch;
}

const stationSign = () => tex('station-sign', 768, 152, (c, w, h) => {
  c.fillStyle = C.pale; roundRect(c, 5, 5, w - 10, h - 10, 25); c.fill();
  c.strokeStyle = C.red; c.lineWidth = 9; roundRect(c, 10, 10, w - 20, h - 20, 20); c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle';
  fitLine(c, '119', 143, h / 2 + 5, 160, 88, C.red);
  fitLine(c, '몽글 안전센터', 478, h / 2 + 5, 424, 49, C.dark);
});
const dormSign = () => tex('dorm', 256, 80, (c, w, h) => {
  c.fillStyle = C.sageD; roundRect(c, 1, 1, w - 2, h - 2, 14); c.fill();
  c.textAlign = 'center'; c.textBaseline = 'middle'; fitLine(c, '쉬어 가요', w / 2, h / 2 + 3, w * .8, 43, C.pale);
});
const chalkSign = side => tex('yard-sign-' + side, 256, 256, (c, w, h) => {
  c.fillStyle = side ? C.pale : C.sageD; roundRect(c, 7, 7, w - 14, h - 14, 20); c.fill();
  c.fillStyle = side ? C.red : C.pale; c.textAlign = 'center'; c.textBaseline = 'middle';
  fitLine(c, side ? '1·1·9' : '오늘의 훈련', w / 2, side ? 111 : 69, w * .8, side ? 77 : 40, side ? C.red : C.pale);
  fitLine(c, side ? '출동 준비!' : '물! 불! 안전!', w / 2, 184, w * .8, 29, side ? C.red : C.pale);
  if (!side) { c.strokeStyle = C.yellow; c.lineWidth = 8; c.beginPath(); c.moveTo(48, 121); c.lineTo(206, 121); c.stroke(); }
});

// A pavement island with broad clipped corners, rather than a square floor slab.
// Coordinates in the Shape use -z as y so the top points up after rotating -PI/2.
function islandShape(scale = 1) {
  const s = new THREE.Shape(), M = (x, z) => s.moveTo(x * scale, -z * scale),
    L = (x, z) => s.lineTo(x * scale, -z * scale),
    Q = (cx, cz, x, z) => s.quadraticCurveTo(cx * scale, -cz * scale, x * scale, -z * scale);
  M(-4.57, -4); L(4.57, -4); Q(5, -4, 5, -3.57); L(5, 2.12);
  Q(5, 2.42, 4.79, 2.63); L(3.61, 3.8); Q(3.46, 3.96, 3.2, 3.96);
  L(-3.2, 3.96); Q(-3.46, 3.96, -3.61, 3.8); L(-4.79, 2.63);
  Q(-5, 2.42, -5, 2.12); L(-5, -3.57); Q(-5, -4, -4.57, -4); return s;
}
B.gpt_firebase = f => {
  f.noSolid = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];
  f.add(mc('gpt-fire-plinth-v1', ({ add }) => {
    add(G.ext(islandShape(1.018), .17, .045, 7), '#a57850', 0, -.59, 0, -HP, 0, 0);
    add(G.ext(islandShape(1.009), .24, .035, 7), '#e8d7b7', 0, -.43, 0, -HP, 0, 0);
    add(G.ext(islandShape(), .11, .035, 7), '#fbf7f0', 0, -.16, 0, -HP, 0, 0);
    add(G.ext(islandShape(.976), .018, .015, 7), C.blue, 0, -.027, 0, -HP, 0, 0);
    // Cool blue paving separates the outdoor apron from the honey-wood loft.
    // Subtle joints stop at the clipped corners; the physical island is unchanged.
    for (let z = -3.5; z <= 3.51; z += .7) {
      const hw = z > 2.1 ? 4.78 - (z - 2.1) * 1.02 : 4.77;
      add(G.box(hw * 2, .006, .012, .002), '#7b9f9e', 0, .009, z);
    }
    for (let x = -4.2; x <= 4.21; x += .7) {
      const ze = Math.abs(x) > 3.1 ? 3.65 - (Math.abs(x) - 3.1) : 3.66;
      add(G.box(.012, .006, ze + 3.72, .002), '#7b9f9e', x, .009, (ze - 3.72) / 2);
    }
    // The visible strata have a narrow, quiet masonry rhythm, not a paper edge.
    for (let x = -3.0; x < 3.1; x += .42) add(G.box(.018, .17, .016, .002), '#feebc8', x, -.28, 4.0);
    for (let z = -3.3; z < 2.2; z += .42) add(G.box(.016, .17, .018, .002), '#feebc8', 5.04, -.28, z);
    add(G.box(6.29, .022, .025, .004), '#eecfa3', 0, -.38, 4.0);
  }));
};

function window(add, x, y, z, w = 1.15, h = .78, ry = 0) {
  const m = xf(x, y, z, 0, ry, 0);
  const place = (geo, color, xx, yy, zz) => {
    const p = new THREE.Vector3(xx, yy, zz).applyMatrix4(m);
    add(geo, color, p.x, p.y, p.z, 0, ry, 0);
  };
  place(G.box(w + .16, h + .14, .11, .035), C.sageD, 0, 0, 0);
  place(G.box(w, h, .025, .015), C.sky, 0, 0, .065);
  place(G.box(.055, h, .045, .012), C.pale, 0, 0, .09);
  place(G.box(w, .045, .045, .012), C.pale, 0, -.04, .09);
  place(G.box(w + .23, .09, .22, .025), C.pale, 0, -h / 2 - .08, .045);
}

// Main cutaway. Local x -3..3, z -2.1..2.1. Upstairs at y 2.55.
B.gpt_firehouse = f => {
  const FH = 2.55, back = -1.96, front = 1.75, doorLift = .35;
  f.noSolid = true; f.collideBox = [0, -.55, 0, .01, -.5, .01];
  f.add(mc('gpt-firehouse-v5-high-door', ({ add, tube }) => {
    // A substantial stone threshold and warm cream masonry. Nothing fills the bay.
    add(G.box(6.05, .18, 4.02, .07), '#e8d7b7', 0, .05, 0);
    add(G.box(5.88, .05, 3.85, .025), '#fef2e1', 0, .16, 0);
    // Equipment terrace joins the bay threshold, under both canon gear fixtures.
    add(G.box(3.15, .16, 1.45, .055), '#e8d7b7', 3.4, .065, -.95);
    add(G.box(3.09, .035, 1.39, .02), '#fef2e1', 3.4, .167, -.95);
    add(G.box(6.02, 4.17, .18, .045), C.plaster, 0, 2.25, back);
    add(G.box(.18, 4.17, 3.95, .045), C.plaster, -2.92, 2.25, -.02);
    // Brick socks and individual offset quoins keep the corner-shop character.
    add(G.box(5.92, .65, .08, .015), C.brick, 0, .51, back + .13);
    add(G.box(.08, .65, 3.85, .015), C.brick, -2.79, .51, -.03);
    for (const y of [.32, .54, .76]) {
      add(G.box(5.9, .016, .012, .002), '#feebc8', 0, y, back + .18);
      add(G.box(.012, .016, 3.82, .002), '#feebc8', -2.738, y, -.03);
      for (let x = -2.65 + (y === .54 ? .28 : 0); x < 2.8; x += .57) add(G.pbox(.015, .2, .012), '#feebc8', x, y + .11, back + .18);
    }
    for (let y = .3; y < 4.2; y += .34) {
      add(G.box(.32, .23, .22, .025), y < 2.5 ? C.brick : C.cream, -2.87, y, 1.82);
      add(G.box(.32, .23, .22, .025), y < 2.5 ? C.brick : C.cream, -2.87, y, back + .06);
    }
    // Oversized garage arch: truck, side mirrors and ladder fit underneath it.
    for (const x of [-2.65, 1.28]) {
      add(G.box(.25, 2.19 + doorLift, .3, .05), C.coral, x, 1.27 + doorLift / 2, front);
      add(G.box(.36, .15, .42, .035), C.pale, x, .24, front);
      add(G.box(.34, .17, .39, .035), C.pale, x, 2.33 + doorLift, front);
      add(G.box(.055, 1.96 + doorLift, .085, .015), C.steel, x + (x < 0 ? .15 : -.15), 1.26 + doorLift / 2, front + .02);
    }
    add(G.box(4.24, .36, .4, .06), C.coral, -.685, 2.49 + doorLift, front);
    add(G.box(4.34, .095, .48, .03), C.pale, -.685, 2.7 + doorLift, front);
    // A genuine roll at the head of the shutter, and threshold/parking lines.
    add(G.cyl(.14, .14, 3.65, 18), C.redD, -.685, 2.32 + doorLift, front - .12, 0, 0, HP);
    add(G.box(3.57, .025, .12, .01), C.brass, -.685, .202, front + .11);
    for (const x of [-2.2, .8]) add(G.box(.045, .012, 2.55, .005), '#edc56c', x, .196, .02);
    for (let z = -.98; z < 1.4; z += .36) add(G.box(.07, .012, .18, .005), C.pale, -.7, .198, z);
    // Loft: back dormitory plus a little right balcony. Open space over the bay.
    add(G.box(5.73, .18, 2.88, .045), C.woodD, 0, FH - .09, -.475);
    add(G.box(5.7, .055, 2.85, .02), C.wood, 0, FH + .025, -.475);
    for (let x = -2.7; x < 2.8; x += .36) add(G.pbox(.012, .008, 2.81), '#cf9f6a', x, FH + .057, -.475);
    // Walkway to the pole: the square opening is built from four frame pieces.
    add(G.box(.21, .18, .95, .03), C.woodD, 1.81, FH - .09, 1.4);
    add(G.box(.21, .18, .95, .03), C.woodD, 2.69, FH - .09, 1.4);
    for (const z of [1.05, 1.8]) add(G.box(.7, .18, .2, .03), C.woodD, 2.25, FH - .09, z);
    // Low front dorm rail, with an open access at the right and generous room views.
    for (const x of [-1.65, -.85, -.05, .75, 1.5]) add(G.box(.065, .49, .065, .015), C.sageD, x, FH + .28, 1.02);
    add(G.box(3.28, .07, .075, .02), C.sageD, -.1, FH + .55, 1.02);
    add(G.box(3.28, .04, .06, .015), C.sage, -.1, FH + .15, 1.02);
    // The narrow pole balcony is visibly carried by posts, not a floating slab.
    for (const z of [-.2, 1.8]) add(G.box(.13, 2.33, .13, .025), C.woodD, 2.82, 1.35, z);
    for (const z of [.2, .7, 1.15, 1.8]) add(G.box(.07, .55, .07, .018), C.sageD, 2.82, FH + .32, z);
    add(G.box(.07, .07, 1.9, .02), C.sageD, 2.82, FH + .63, .87);
    // Cut roof: shallow teal tiles along the back and left, never above the dorm.
    add(G.box(6.28, .14, .93, .055), C.sageD, 0, 4.43, -1.74, .22, 0, 0);
    for (let x = -2.93; x <= 3.0; x += .37) add(G.box(.34, .065, .98, .025), C.sage, x, 4.51, -1.74, .22, 0, 0);
    add(G.box(6.31, .1, .13, .035), C.sageD, 0, 4.39, -1.23);
    add(G.box(.58, .12, 3.0, .04), C.sageD, -2.94, 4.38, -.08, 0, 0, -.12);
    add(G.box(.1, .1, 3.01, .03), C.sage, -2.62, 4.36, -.08);
    // Cream horizontal upper cladding and two framed window bays.
    for (const y of [2.83, 3.17, 3.51, 3.85, 4.19]) add(G.pbox(5.86, .023, .012), '#eecfa3', 0, y, back + .101);
    window(add, -1.65, 3.53, back + .15, 1.3, .8);
    window(add, .47, 3.53, back + .15, 1.1, .8);
    // Dorm bed: framed, pillow, folded blanket, mug and slippers. A liftable duvet below.
    const bx = -1.25, bz = -.95;
    add(G.box(1.43, .19, 1.45, .06), C.woodD, bx, FH + .2, bz);
    add(G.box(1.3, .16, 1.32, .07), C.pale, bx, FH + .36, bz);
    add(G.box(1.47, .54, .1, .035), C.wood, bx, FH + .37, -1.67);
    for (const x of [-1.88, -.62]) add(G.cyl(.045, .045, .58, 10), C.woodD, x, FH + .27, -.25);
    add(G.box(.72, .15, .33, .07), '#fef2e1', bx, FH + .51, -1.44, 0, -.04, 0);
    // Bedside table has an open shelf with a real cup, book and little reading lamp.
    add(G.box(.54, .06, .49, .025), C.wood, -.2, FH + .56, -1.21);
    for (const x of [-.43, .03]) add(G.box(.045, .5, .42, .012), C.woodD, x, FH + .28, -1.21);
    add(G.box(.47, .04, .42, .012), C.wood, -.2, FH + .14, -1.21);
    // A 24×18 cm hardback, with thin covers around its actual page block.
    add(G.box(.24, .006, .18, .002), C.coral, -.22, FH + .163, -1.15, 0, -.08, 0);
    add(G.box(.23, .022, .17, .004), C.pale, -.22, FH + .177, -1.15, 0, -.08, 0);
    add(G.box(.24, .006, .18, .002), C.coral, -.22, FH + .191, -1.15, 0, -.08, 0);
    add(G.cyl(.075, .075, .035, 14), C.brassD, -.21, FH + .6, -1.26);
    add(G.cyl(.016, .016, .24, 8), C.brass, -.21, FH + .74, -1.26);
    add(G.cone(.13, .18, 14), C.yellow, -.21, FH + .92, -1.26);
    for (const x of [-1.5, -1.23]) add(G.box(.14, .07, .28, .04), C.coral, x, FH + .0875, -.12, 0, .12, 0);
    // Linen cabinet at the right, hollow cubbies full of towels.
    const cx = 1.25;
    add(G.box(1.26, .07, .5, .02), C.woodD, cx, FH + .04, -1.57);
    for (const x of [.65, 1.25, 1.85]) add(G.box(.055, .78, .5, .015), C.woodD, x, FH + .45, -1.57);
    for (const y of [.42, .83]) add(G.box(1.26, .055, .5, .015), C.blue, cx, FH + y, -1.57);
    add(G.box(1.25, .8, .035, .01), C.woodD, cx, FH + .45, -1.82);
    for (const x of [.95, 1.55]) for (let k = 0; k < 3; k++) add(G.box(.43, .07, .3, .025), k % 2 ? C.pale : C.blue, x, FH + .12 + k * .08, -1.48);
    // Native mugs are about 9 cm across; this friendly 11 cm mug sits on top.
    add(G.cyl(.055, .052, .11, 12), C.coral, .97, FH + .9135, -1.52);
    add(G.cyl(.045, .045, .004, 12), C.dark, .97, FH + .9705, -1.52);
    add(G.tor(.035, .011, PI * 2, 5, 12), C.coral, 1.035, FH + .919, -1.52);
    // A safe chunky ladder is outside the truck's left flank, reaching the loft.
    for (const x of [-2.76, -1.83]) tube([x, .06, 2.4], [x, FH + .46, .4], .04, C.woodD, 8);
    for (let k = 0; k < 10; k++) { const s = k / 9; add(G.box(1.01, .065, .23, .018), C.wood, -2.295, .16 + s * 2.39, 2.33 - s * 1.93); }
    // Kit assembly mat at world (-2.6, .5), kept off the full truck's wheels.
    add(G.box(1.03, .035, .83, .055), '#c67f2a', -.95, .033, 2.25);
    add(G.box(.92, .018, .72, .035), '#feebc8', -.95, .06, 2.25);
    for (const x of [-1.29, -.61]) for (const z of [1.99, 2.51]) add(G.box(.1, .01, .045, .004), '#6f4b30', x, .074, z);
    // Ground-floor working detail stays on the edges: tool board, kettle shelf, hose couplings.
    add(G.box(1.05, .82, .045, .025), C.sage, 1.9, 1.64, back + .15);
    for (const x of [1.5, 1.86, 2.23]) { add(G.cyl(.018, .018, .36, 6), C.steelD, x, 1.57, back + .2); add(G.box(.15, .06, .045, .018), C.brass, x, 1.78, back + .2); }
    add(G.box(1.05, .09, .4, .03), C.woodD, 1.9, .96, back + .3);
    add(G.cyl(.1, .12, .19, 12), C.red, 1.63, 1.09, back + .28);
    add(G.tor(.065, .022, PI * 2, 5, 14), C.ink, 1.63, 1.24, back + .28);
    add(G.cyl(.06, .06, .12, 12), C.pale, 2.0, 1.07, back + .22);
    for (const x of [-1.9, .45]) {
      tube([x, 2.43, .45], [x, 2.08, .45], .012, C.dark, 6);
      add(G.cone(.14, .12, 12), C.pale, x, 2.03, .45);
      add(G.sph(.065, 10, 6), '#feb53d', x, 1.985, .45, 0, 0, 0, [1, .45, 1]);
    }
  }));
  f.add(put(decal(3.4, .66, stationSign()), -.68, 2.55 + doorLift, front + .218));
  f.add(put(decal(.93, .29, dormSign()), .43, 4.02, back + .195));
  // Roll-up shutter: every lamella rises and curls around the real header drum.
  const slats = [], N = 15, SH = (2.06 + doorLift) / N, Y0 = .23, Y1 = 2.29 + doorLift, Z = front - .105;
  for (let k = 0; k < N; k++) {
    const g = grp();
    g.add(mc('gpt-fire-shutter-slat-v2-' + (k === 0 ? 'handle' : 'plain'), ({ add }) => {
      add(G.box(3.62, SH - .009, .055, .018), C.coral, 0, 0, 0);
      add(G.box(3.52, .018, .014, .004), C.redD, 0, -SH / 2 + .014, .034);
      if (k === 0) { add(G.box(.5, .045, .07, .018), C.pale, 0, -.015, .075); add(G.box(.38, .025, .075, .01), C.dark, 0, -.01, .115); }
    })); f.add(g); slats.push(g);
  }
  const shutter = f.part('shutter', slats, t => {
    // Starts three-quarters up so the built truck reads immediately. The rest of
    // the travel is still large and visibly curls every remaining slat away.
    const lift = .77 + .23 * t;
    slats.forEach((g, k) => {
      const y = Y0 + SH * (k + .5) + lift * (2.16 + doorLift);
      if (y < Y1) { g.visible = true; g.position.set(-.685, y, Z); g.rotation.x = 0; }
      else { const a = (y - Y1) / .17; g.visible = a < PI * 1.63; g.position.set(-.685, Y1 + Math.sin(a) * .17, Z - .17 + Math.cos(a) * .17); g.rotation.x = -a; }
    });
  }, { label: '차고 셔터 올리기', sfx: 'open_metal', dur: .95 });
  action(shutter, 'fire_shutter', 'step', { chain: 'fire_dispatch', next: 'fire_pole', sound: 'ratchet', endSound: 'latch', gesture: 'dragUp' });
  shutter.setOpen(0);
  const quilt = grp(); put(quilt, -1.25, FH + .47, -.95); f.add(quilt);
  quilt.add(put(mc('gpt-dorm-quilt', ({ add }) => {
    add(G.box(1.34, .12, .92, .065), C.blanket, 0, 0, 0);
    for (const x of [-.48, -.16, .16, .48]) add(G.box(.065, .014, .86, .008), '#fef2e1', x, .067, 0);
    for (const z of [-.3, 0, .3]) add(G.box(1.28, .014, .065, .008), '#fef2e1', 0, .069, z);
    add(G.box(1.29, .05, .17, .018), '#fef2e1', 0, .08, -.38);
  }), 0, 0, .52));
  const qp = f.part('lift', quilt, t => { quilt.rotation.x = -.95 * t; quilt.position.y = FH + .47 + .04 * t; }, { label: '당직실 이불', sfx: 'rustle' });
  f.spot('inside', null, -1.25, FH + .44, -.73, { part: qp, maxH: .4, label: '당직실 이불 아래', scale: .95 });
  f.spot('under', null, -.2, FH + .19, -.95, { maxH: .26, label: '당직실 협탁 아래', scale: .9 });
  f.spot('on', null, 1.55, FH + .87, -1.4, { maxH: .3, label: '수건 장 위', scale: .85 });
  f.spot('on', null, -.95, .085, 2.25, { maxH: .9, label: '조립 작업 매트', scale: 1 });
};

// Brass pole, cutaway landing ring, and the game's native bear that really slides.
B.gpt_firepole = f => {
  f.add(mc('gpt-fire-pole-base', ({ add }) => {
    add(G.cyl(.55, .58, .1, 28), C.redD, 0, .06, 0);
    add(G.cyl(.48, .48, .035, 28), C.coral, 0, .125, 0);
    add(G.tor(.37, .025, PI * 2, 6, 24), '#feebc8', 0, .15, 0, HP, 0, 0);
    add(G.cyl(.052, .052, 3.25, 14), C.brass, 0, 1.75, 0);
    add(G.cyl(.07, .07, .13, 14), C.brassD, 0, .28, 0);
    add(G.tor(.38, .035, PI * 1.6, 6, 24), C.brass, 0, 2.7, 0, HP, 0, -.15);
    for (const x of [-.33, .33]) add(G.cyl(.035, .035, .42, 8), C.brass, x, 2.83, -.18);
  }));
  const rider = grp(); f.add(rider);
  const bear = nativeResident('bear', 'hold', 'happy');
  bear.root.position.set(.12, 0, -.24); bear.root.rotation.y = -.3; rider.add(bear.root);
  f.gptChars = [bear];
  const p = f.part('slide', rider, t => {
    rider.position.y = 2.55 - 2.4 * t; rider.rotation.y = .15 * Math.sin(t * PI);
    bear.update(0);
  }, { label: '소방봉 타고 내려오기', sfx: 'slide', dur: 1.1 });
  action(p, 'fire_pole', 'step', { chain: 'fire_dispatch', next: 'fire_doghouse', sound: 'swish', endSound: 'land' }); p.setOpen(0);
  f.spot('on', null, -.26, .21, .25, { maxH: .35, label: '소방봉 안전 매트', scale: .9 });
};

// Open-front hose drying tower: no opaque box in place of an interior.
B.gpt_hosetower = f => {
  f.add(mc('gpt-hose-tower', ({ add, tube }) => {
    add(G.box(1.62, .32, 1.55, .08), C.brickD, 0, .17, 0);
    add(G.box(1.48, .12, 1.43, .04), C.pale, 0, .34, 0);
    add(G.box(1.44, 3.94, .16, .035), C.plaster, 0, 2.38, -.64);
    for (const x of [-.66, .66]) {
      add(G.box(.18, 3.94, 1.28, .035), C.cream, x, 2.38, -.06);
      for (let y = .54; y < 4.1; y += .4) add(G.box(.23, .23, .21, .02), C.brick, x, y, .58);
    }
    add(G.box(1.58, .2, 1.5, .04), C.brick, 0, 3.82, 0);
    add(G.box(1.68, .13, 1.64, .04), C.pale, 0, 4.36, 0);
    add(G.box(1.82, .16, 1.8, .06), C.sageD, 0, 4.5, 0);
    for (let x = -.72; x < .9; x += .32) add(G.box(.28, .08, 1.81, .03), C.sage, x, 4.61, 0);
    // Open slit at the top and a real spar spanning the front opening.
    for (const x of [-.36, 0, .36]) add(G.box(.055, .44, .06, .012), C.sageD, x, 4.08, .64);
    add(G.cyl(.08, .08, 1.15, 14), C.brass, 0, 3.59, .14, 0, 0, HP);
    add(G.tor(.21, .032, PI * 2, 6, 18), C.red, .55, 3.59, .14, 0, HP, 0);
    // Fixed ladder on the outer side, up to the ventilation slit.
    for (const z of [-.34, .3]) tube([.81, .4, z], [.81, 4.22, z], .028, C.steelD, 7);
    for (let y = .55; y < 4.1; y += .28) tube([.82, y, -.34], [.82, y, .3], .025, C.steel, 7);
    // A low boot shelf, .195 m above the raised tower floor; not a seat.
    add(G.box(1.04, .09, .65, .025), C.wood, 0, .55, -.17);
    for (const x of [-.43, .43]) add(G.box(.08, .15, .5, .018), C.woodD, x, .44, -.17);
    for (const x of [-.3, -.08]) add(G.box(.18, .27, .28, .045), C.brassD, x, .73, -.27);
  }));
  const hose = grp(); f.add(hose);
  hose.add(mc('gpt-drying-hose', ({ add }) => {
    // Broad flat hose: two vertical strips connected by a round folded bottom.
    for (const x of [-.27, .2]) { add(G.box(.22, 2.25, .075, .035), '#eecfa3', x, 2.39, .16); add(G.box(.045, 2.16, .015, .008), '#feebc8', x - .065, 2.39, .205); }
    add(G.tor(.235, .105, PI, 6, 18), '#eecfa3', -.035, 1.26, .16, 0, 0, PI, [1, 1, .4]);
    add(G.cyl(.12, .12, .18, 14), C.brassD, .2, 1.2, .16);
    add(G.tor(.12, .025, PI * 2, 5, 16), C.brass, .2, 1.12, .16, HP, 0, 0);
    for (const x of [-.27, .2]) add(G.box(.28, .11, .12, .02), C.brass, x, 3.5, .16);
  }));
  const reel = grp(); put(reel, .88, 1.18, .38); f.add(reel);
  reel.add(mc('gpt-hose-handwheel', ({ add, tube }) => {
    add(G.tor(.27, .045, PI * 2, 7, 22), C.red, 0, 0, 0, 0, HP, 0);
    for (const a of [0, PI / 3, PI * 2 / 3]) tube([0, Math.cos(a) * .22, Math.sin(a) * .22], [0, -Math.cos(a) * .22, -Math.sin(a) * .22], .025, C.redD, 7);
    add(G.cyl(.06, .06, .14, 12), C.brass, 0, 0, 0, 0, 0, HP);
    add(G.cyl(.04, .04, .19, 10), C.woodD, .1, .21, 0, 0, 0, HP);
  }));
  const p = f.part('crank', [reel, hose], t => { reel.rotation.x = -t * PI * 4; hose.position.y = .7 * t; hose.scale.y = 1 - .2 * t; }, { label: '호스 건조탑 손잡이', sfx: 'ratchet', dur: 1.05 });
  action(p, 'fire_hose', 'aux', { sound: 'ratchet', endSound: 'clink' });
  const s = f.spot('inside', null, .28, .61, .22, { part: p, maxH: .4, label: '건조 호스 아래', scale: .95 });
  f.pullOut(p, s, .65, { w: .45, d: .33, color: C.wood });
  f.spot('on', null, 0, .025, 1.3, { maxH: .8, label: '건조탑 앞 바닥', scale: 1 });
};

B.gpt_firebell = f => {
  // The 2.42 m bell frame is already full size; no presentation multiplier.
  f.add(mc('gpt-fire-bell-stand-v2', ({ add }) => {
    add(G.box(.88, .18, .75, .05), C.brickD, 0, .1, 0);
    for (const x of [-.31, .31]) add(G.box(.095, 2.0, .095, .025), C.sageD, x, 1.15, -.15);
    add(G.box(.82, .11, .24, .03), C.sageD, 0, 2.16, -.15);
    add(G.box(.74, .12, .62, .035), C.pale, 0, 2.27, -.1);
    add(G.box(.88, .12, .76, .035), C.sage, 0, 2.37, -.1);
    add(G.box(.68, .14, .09, .025), C.coral, 0, .51, -.15);
  }));
  const handle = grp(); put(handle, 0, .75, .25); f.add(handle);
  handle.add(mc('gpt-fire-bell-pull-ring-v2', ({ add }) => {
    add(G.tor(.1, .025, PI * 2, 6, 16), C.brass, 0, 0, 0);
    add(G.cyl(.032, .032, .17, 10), C.woodD, 0, 0, 0, 0, 0, HP);
  }));
  const rope = grp(); put(rope, .23, 1.55, -.1); f.add(rope);
  rope.add(mc('gpt-fire-bell-pull-cord', ({ tube }) => tube([0, 0, 0], [-.23, -.69, .3], .025, C.brassD, 7)));
  const bell = grp(); put(bell, 0, 1.96, -.13); f.add(bell);
  bell.add(mc('gpt-brass-bell', ({ add }) => {
    const lathe = new THREE.LatheGeometry([[.07, .01], [.095, -.02], [.13, -.11], [.16, -.3], [.24, -.42], [.27, -.44], [.27, -.49], [.22, -.51], [.18, -.43], [.12, -.26], [.09, -.1], [.055, -.06]].map(([x, y]) => new THREE.Vector2(x, y)), 20);
    add(lathe, C.brass, 0, 0, 0);
    add(G.sph(.07, 10, 8), C.brassD, 0, -.48, 0);
    add(G.tor(.065, .022, PI * 2, 6, 14), C.brassD, 0, .055, 0);
  }));
  const p = f.part('pull', [bell, handle, rope], t => {
    const pull = .1 * Math.sin(t * PI);
    handle.position.y = .75 - pull; rope.scale.y = 1 + pull / .69;
    bell.rotation.x = .65 * Math.sin(t * PI * 3) * (1 - .35 * t);
  }, { label: '출동 벨 당기기', sfx: 'clink', dur: .8 });
  p.handle = handle;
  action(p, 'fire_bell', 'start', { chain: 'fire_dispatch', next: 'fire_shutter', sound: 'clink', endSound: 'doorBell' });
  f.spot('behind', null, -.22, .17, .15, { maxH: .3, label: '출동 벨 받침 뒤', scale: .8 });
};

// A broad practice patch rather than scattered cones: valve, moving stream and target.
B.gpt_firetraining = f => {
  f.add(mc('gpt-fire-training', ({ add, tube }) => {
    add(G.box(2.42, .08, 1.53, .16), '#c6c393', 0, .06, 0);
    for (const x of [-.98, .98]) add(G.box(.035, .015, 1.2, .007), '#fef2e1', x, .11, 0);
    add(G.box(1.95, .015, .035, .007), '#fef2e1', 0, .11, .58);
    // Iconic hydrant with two brass hose outlets, cap chains and a real nozzle.
    add(G.cyl(.18, .21, .1, 18), C.redD, -.7, .18, .24);
    add(G.cyl(.12, .14, .55, 16), C.coral, -.7, .48, .24);
    add(G.sph(.15, 14, 8), C.red, -.7, .77, .24, 0, 0, 0, [1, .5, 1]);
    for (const x of [-.9, -.5]) add(G.cyl(.075, .075, .12, 12), C.brass, x, .59, .24, 0, 0, HP);
    add(G.cyl(.035, .035, .1, 8), C.brassD, -.7, .87, .24);
    // Laid hose is one smooth, unmistakable tube with a brass nozzle.
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.5, .5, .24), new THREE.Vector3(-.25, .24, .42), new THREE.Vector3(-.32, .16, .1), new THREE.Vector3(.05, .16, -.14), new THREE.Vector3(.1, .41, -.12)]);
    add(new THREE.TubeGeometry(curve, 18, .045, 6, false), '#eecfa3', 0, 0, 0);
    tube([.1, .41, -.12], [.27, .52, -.12], .065, C.brass, 10, .04);
    // Two neighbouring cones set a readable little practice lane.
    for (const [x, z] of [[-.95, -.5], [.95, .5]]) {
      add(G.box(.32, .04, .32, .025), C.redD, x, .14, z);
      add(G.cone(.13, .38, 12), '#ee9d4c', x, .34, z);
      add(G.cyl(.064, .085, .06, 12), C.pale, x, .34, z);
    }
    add(G.box(.67, .08, .45, .03), C.woodD, .81, .18, -.28);
    for (const x of [.55, 1.06]) add(G.cyl(.035, .035, .72, 8), C.sageD, x, .54, -.28);
  }));
  const valve = grp(); put(valve, -.7, .91, .24); f.add(valve);
  valve.add(mc('gpt-hydrant-valve', ({ add, tube }) => {
    add(G.tor(.16, .033, PI * 2, 6, 18), C.redD, 0, 0, 0, HP, 0, 0);
    tube([-.14, 0, 0], [.14, 0, 0], .025, C.redD); tube([0, 0, -.14], [0, 0, .14], .025, C.redD);
  }));
  const target = grp(); put(target, .81, .9, -.28); f.add(target);
  target.add(mc('gpt-water-target', ({ add }) => {
    add(G.cyl(.3, .3, .055, 24), C.pale, 0, 0, 0, HP, 0, 0);
    add(G.tor(.21, .035, PI * 2, 6, 20), C.red, 0, 0, .033);
    add(G.cyl(.085, .085, .01, 16), C.red, 0, 0, .035, HP, 0, 0);
  }));
  const stream = grp(); f.add(stream);
  stream.add(mc('gpt-training-water', ({ add }) => {
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(.25, .53, -.12), new THREE.Vector3(.5, 1.25, -.12), new THREE.Vector3(.8, .9, -.27));
    add(new THREE.TubeGeometry(c, 16, .035, 6, false), '#79b7cf', 0, 0, 0);
    for (const [x, y, z] of [[.78, .83, -.17], [.9, .94, -.15], [.93, .78, -.29]]) add(G.sph(.045, 8, 6), '#b0e5e8', x, y, z, 0, 0, 0, [.7, 1.25, .7]);
  }));
  const p = f.part('crank', [valve, target, stream], t => { valve.rotation.y = t * PI * 2; target.rotation.x = -.67 * t; stream.visible = t > .1; stream.scale.y = .95 + .05 * Math.sin(t * PI * 4); }, { label: '훈련 소화전 밸브', sfx: 'ratchet', dur: .65 });
  p.handle = valve;
  action(p, 'fire_training', 'aux', { sound: 'ratchet', endSound: 'blub' }); p.setOpen(0);
  f.spot('behind', null, .83, .22, -.2, { maxH: .3, label: '훈련 표적 받침', scale: .85 });
  f.spot('on', null, .25, .125, .45, { maxH: .8, label: '훈련 마당 빈자리', scale: 1 });
};

B.gpt_firedoghouse = f => {
  f.add(mc('gpt-station-doghouse', ({ add }) => {
    // Hollow dog house: two sides, back and a thick wooden floor. Front opens fully.
    add(G.box(1.53, .26, 1.3, .06), C.woodD, 0, .14, 0);
    add(G.box(1.37, .07, 1.17, .025), C.wood, 0, .25, 0);
    for (const x of [-.65, .65]) add(G.box(.1, .83, 1.15, .025), C.cream, x, .67, -.015);
    add(G.box(1.36, .83, .09, .025), C.cream, 0, .67, -.58);
    for (const x of [-.52, .52]) add(G.box(.27, .78, .1, .025), C.coral, x, .65, .55);
    add(G.box(1.31, .15, .1, .025), C.coral, 0, 1.01, .55);
    for (const x of [-.36, .36]) add(G.box(.065, .7, .12, .02), C.pale, x, .6, .6);
    add(G.box(.79, .065, .13, .02), C.pale, 0, .96, .6);
    // The cushion is a prop; the resident below is the existing native shiba.
    add(G.box(.93, .12, .72, .09), C.sage, 0, .35, -.03);
    // Bowl and bone are large enough to read; the reward platform sits inside.
    add(G.cyl(.18, .22, .11, 18), C.coral, .72, .15, .68);
    add(G.cyl(.14, .14, .016, 18), '#e8d7b7', .72, .211, .68);
    add(G.box(.26, .05, .07, .02), '#f6e0bf', .1, .13, .95, 0, -.2, 0);
    for (const x of [-.025, .225]) for (const z of [.925, .98]) add(G.sph(.045, 8, 6), '#f6e0bf', x, .13, z);
  }));
  const dog = nativeResident('shiba', 'cross', 'happy');
  dog.root.position.set(-.18, .415, -.05); dog.root.rotation.y = .12; f.add(dog.root);
  f.gptChars = [dog];
  const roof = grp(); put(roof, 0, 1.08, -.55); f.add(roof);
  roof.add(mc('gpt-doghouse-lifting-roof', ({ add }) => {
    for (const sx of [-1, 1]) { add(G.box(.87, .13, 1.43, .045), C.sageD, sx * .37, .17, .56, 0, 0, -sx * .42); for (let z = -.03; z < 1.2; z += .25) add(G.box(.88, .04, .07, .018), C.sage, sx * .37, .25, z, 0, 0, -sx * .42); }
    add(G.box(.18, .14, 1.48, .05), C.sage, 0, .39, .56);
    add(G.box(.46, .2, .045, .025), C.pale, 0, .1, 1.29);
    add(G.sph(.055, 8, 6), C.red, -.12, .1, 1.32); add(G.sph(.055, 8, 6), C.red, .12, .1, 1.32); add(G.box(.24, .055, .025, .015), C.red, 0, .1, 1.325);
  }));
  const p = f.part('lid', roof, t => { roof.rotation.x = -1.22 * t; dog.update(0); }, { label: '소방견 집 지붕', sfx: 'creak', dur: .6 });
  action(p, 'fire_doghouse', 'reward', { chain: 'fire_dispatch', sound: 'creak', endSound: 'giggle' });
  const s = f.spot('inside', null, .29, .37, -.05, { part: p, maxH: .35, label: '소방견 방석 옆', scale: .95 });
  f.pullOut(p, s, .67, { w: .38, d: .3, color: C.wood });
  f.spot('on', null, -.5, .025, 1.2, { maxH: .8, label: '개집 앞 바닥', scale: 1 });
};

B.gpt_fireflipsign = f => {
  // A 1.53 m training sign beside the 0.56–0.81 m native characters.
  f.add(mc('gpt-fire-flip-stand', ({ add, tube }) => {
    add(G.box(.98, .2, .73, .05), C.woodD, 0, .11, 0);
    for (const x of [-.4, .4]) tube([x, .16, .16], [x, 1.49, -.05], .045, C.sageD, 8);
    add(G.box(1.0, .075, .12, .025), C.sageD, 0, 1.5, -.05);
  }));
  const sign = grp(); put(sign, 0, .99, 0); f.add(sign);
  sign.add(mc('gpt-fire-flip-board', ({ add }) => add(G.box(.8, .8, .1, .035), C.wood, 0, 0, 0)));
  sign.add(put(decal(.72, .72, chalkSign(0)), 0, 0, .057));
  sign.add(put(decal(.72, .72, chalkSign(1)), 0, 0, -.057, 0, PI, 0));
  const p = f.part('picture', sign, t => { sign.rotation.y = PI * t; }, { label: '훈련 안내판 뒤집기', sfx: 'flip', dur: .45 });
  action(p, 'fire_flipsign', 'clue', { sound: 'flip', endSound: 'pop' });
  f.spot('behind', null, 0, .2, .2, { maxH: .35, label: '훈련 안내판 받침', scale: .85 });
};

// Low yard edge, a warm bench, tidy hedge planters, lunch and coiled spare hose.
B.gpt_fireyard = f => {
  f.add(mc('gpt-fireyard', ({ add, tube }) => {
    add(G.box(3.4, .74, .22, .045), C.plaster, 0, .38, -.38);
    add(G.box(3.5, .09, .31, .03), C.cream, 0, .66, -.38);
    for (const x of [-1.62, 1.62]) add(G.box(.3, .7, .34, .04), C.brick, x, .43, -.38);
    // Slatted bench facing the yard, enough open space beneath it for a cat-sized item.
    for (let k = 0; k < 4; k++) add(G.box(1.55, .06, .1, .02), C.wood, -.15, .47, -.03 + k * .115);
    for (const x of [-.78, .48]) { add(G.box(.065, .47, .44, .015), C.sageD, x, .245, .13); add(G.box(.06, .65, .06, .015), C.sageD, x, .60, -.1); }
    for (const y of [.70, .85]) add(G.box(1.57, .1, .07, .025), C.wood, -.15, y, -.1);
    // A red lunch tin, thermos and cloth tie the yard to the upstairs dorm.
    add(G.box(.24, .11, .18, .03), C.coral, -.55, .555, .14);
    add(G.box(.25, .025, .19, .012), C.redD, -.55, .6225, .14);
    add(G.cyl(.055, .055, .28, 12), C.sage, -.21, .64, .09);
    add(G.cyl(.059, .059, .06, 12), C.pale, -.21, .81, .09);
    // Deep planter at one end with a soft, compact hedge.
    add(G.box(.64, .66, .62, .045), C.brickD, 1.23, .34, .09);
    add(G.box(.72, .09, .69, .025), C.brick, 1.23, .62, .09);
    add(G.box(.6, .022, .57, .01), C.soil, 1.23, .674, .09);
    for (const [x, z] of [[1.05, -.03], [1.4, .01], [1.23, .22]]) add(G.sph(.25, 12, 8), C.leaf, x, .83, z, 0, 0, 0, [1, .8, 1]);
    leaves(add, 1.3, .94, .15, 7, C.leaf, C.leafD, 1.3);
    for (const r of [.23, .29, .35]) add(G.tor(r, .035, PI * 2, 5, 24), '#eecfa3', -1.29, .055, .28, HP, 0, 0);
    tube([-1.42, .055, .54], [-1.6, .055, .7], .055, C.brass, 10, .045);
  }));
  f.spot('under', null, .18, .18, .26, { maxH: .3, label: '쉼터 의자 아래', scale: .95 });
  // The right half of the seat stays clear: campaign kit parts can be found
  // without touching the optional hose / training / sign toys.
  f.spot('on', null, .28, .51, .19, { maxH: .5, label: '쉼터 의자 빈자리', scale: 1 });
  f.spot('behind', null, 1.17, .69, .2, { maxH: .3, label: '화분 잎 뒤', scale: .85 });
};

export const GPT_FIRE_BUILDERS = { ...B, ...GPT_FIRETRUCK2_BUILDERS };
export const GPT_FIRE_INFO = {
  ...GPT_FIRETRUCK2_INFO,
  gpt_firebase: { w: 10, d: 8, name: '안전센터 포장섬', price: 0, hidden: true, floor: true },
  gpt_firehouse: { w: 6, d: 4, name: '몽글 119 안전센터', price: 0, hidden: true, floor: true },
  gpt_firepole: { w: 1, d: 1, name: '소방봉과 곰돌이', price: 0, hidden: true },
  gpt_hosetower: { w: 2, d: 2, name: '호스 건조탑', price: 0, hidden: true },
  gpt_firebell: { w: 1, d: 1, name: '출동 종', price: 0, hidden: true },
  gpt_firetraining: { w: 3, d: 2, name: '소화전 훈련 마당', price: 0, hidden: true },
  gpt_firedoghouse: { w: 2, d: 2, name: '졸린 소방견 집', price: 0, hidden: true },
  gpt_fireflipsign: { w: 1, d: 1, name: '훈련 안내판', price: 0, hidden: true },
  gpt_fireyard: { w: 4, d: 1, name: '안전센터 쉼터', price: 0, hidden: true },
};

export const GPT_FIRE_LAYOUT = {
  // (bleed: null — no apron running past the island; 작업장 gpt-maps.js의 fitW·셋 자리·뒷줄 칸을 여기로 옮김)
  w: 10, d: 8, exact: true, noEntry: true, slab: 'none', bleed: null, fitW: 12.8,
  // Navigation only: the custom island draws the surface. The left and rear
  // rows keep ground-floor characters out of the hollow building's masonry;
  // upper furniture spots and the apron kit mat remain independent of these.
  cut: [
    { i: 0, j: 7, w: 1, d: 1 }, { i: 9, j: 7, w: 1, d: 1 },
    { i: 0, j: 0, w: 1, d: 4 }, { i: 0, j: 0, w: 6, d: 1 }, { i: 6, j: 0, w: 2, d: 1 },
  ],
  wallH: 0, walls: { N: 'none', W: 'none', E: 'none', S: 'none' },
  furniture: [
    { type: 'gpt_firebase', x: 0, z: 0 },
    { type: 'gpt_firehouse', x: -1.65, z: -1.75 },
    { type: 'gpt_firetruck2', x: -1.8, z: -1.65, y: .2, a: -Math.PI / 2 },
    { type: 'gearrack', x: 1.25, z: -2.65, y: .2 },
    { type: 'lockers', x: 2.75, z: -2.65, y: .2 },
    { type: 'gpt_hosetower', x: 4.07, z: -2.85 },
    { type: 'gpt_firepole', x: .6, z: -.35 },
    { type: 'gpt_firebell', x: 2.85, z: -.75 },
    { type: 'gpt_firetraining', x: -.05, z: 1.2 },   // (z 1.5 → 1.2, ① 10/22 보행 섬 0: the yard's left half joins the rest along the bench)
    { type: 'gpt_firedoghouse', x: 3.55, z: 1.45 },
    { type: 'gpt_fireflipsign', x: -3.48, z: 2.65 },
    { type: 'gpt_fireyard', x: -.9, z: 3.1 },
  ], decor: [], friendAt: [1.6, 1.6],
};

export const GPT_FIRE_THEME = {
  // (① 10/22: 벽 크림 → 옅은 중성. 우리 방은 바닥판을 깐다(작업장은 지웠음) — 섬 포장이 그 위 5 mm라 바닥판은 섬의 흰 테두리와
  // 깎인 앞 모서리에만 보임: 그 테두리 색 한 가지로(carpet에 두 색 같게 = 무늬 없음; 옛 테마의 asphalt는 차선·글자가 그려짐))
  name: '몽글 119 안전센터', wall: '#f4efe8', wall2: '#ece6de', wallEdge: '#fbf8f2',
  // Cool morning blue opens into a mint horizon and a soft pink dawn.
  sky: Object.assign(['#6295df', '#86d6cc', '#edb1c7'], { clouds: true }),
  bg: ['#86d6cc', '#edb1c7'],
  floorKind: 'carpet', floor: '#fbf7f0', floor2: '#fbf7f0', base: '#e8d7b7', edge: '#c67f2a', wood: C.wood,
  fwood: C.wood, fwoodD: C.woodD, trim: '#fbf8f2', accent: C.coral, locker: '#84ae9d',
};

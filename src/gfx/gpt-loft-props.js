// 내 방 건축 가구: six complete lofts. Origin = footprint centre, front = +z.
// Deck paint is deliberately pale, while the deep fascia and feet keep these from reading as floating slabs.
// Only the narrow perimeter is decorated: the upper floor stays available for the player's own furniture.
import * as THREE from 'three';
import { grp, put, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2, Y = 1.3, TOP = 1.33;
const C = { wood: '#eecfa3', honey: '#d5a16a', edge: '#b78251', cream: '#fef2e1',
  sage: '#a2c8bb', sageD: '#719a89', coral: '#e99079', rope: '#e8d7b7', leaf: '#a3bd8d', book: '#d8b16c', lilac: '#d2bfd1' };
const B = {};

// Shared low-poly, vertex-coloured construction: the same hmc/HG toon and outline pipeline as the shipped furniture.
function rail({ add, tube }, a, b, c = C.honey, y = Y, h = .43, style = 'wood') {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < .07) return;
  tube([a[0], y + h, a[1]], [b[0], y + h, b[1]], .033, c, 7);
  tube([a[0], y + .08, a[1]], [b[0], y + .08, b[1]], .022, c, 6);
  const N = Math.max(1, Math.ceil(L / .3));
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
    add(G.box(i === 0 || i === N ? .07 : .037, h, .055, .012), c, x, y + h / 2, z);
    if (style === 'wood' && (i === 0 || i === N)) add(G.box(.09, .035, .085, .013), C.cream, x, y + h + .035, z);
  }
}

function deck(o, { x0, x1, z0, z1, posts = true, color = C.wood, frame = C.honey }) {
  const { add } = o, w = x1 - x0, d = z1 - z0, x = (x0 + x1) / 2, z = (z0 + z1) / 2;
  add(G.box(w, .17, d, .025), frame, x, Y - .065, z);
  add(G.box(w - .05, .035, d - .05, .01), color, x, Y + .013, z);
  // Separate boards have shallow relief, no coincident wood-grain overlays.
  const N = Math.ceil(w / .25), bw = (w - .1) / N;
  for (let i = 0; i < N; i++) add(G.box(bw - .012, .014, d - .1, .004), i % 3 === 0 ? shade(color, .035) : color, x0 + .05 + bw * (i + .5), Y + .025, z);
  if (posts) for (const px of [x0 + .075, x1 - .075]) for (const pz of [z0 + .075, z1 - .075]) {
    add(G.box(.13, Y - .13, .13, .025), frame, px, (Y - .13) / 2, pz);
    add(G.box(.19, .07, .19, .02), shade(frame, -.07), px, .035, pz);
    // Visible joinery and a lower apron make the supports read as a real frame.
    add(G.cyl(.018, .018, .013, 8), C.edge, px, Y - .1, pz + .071, HP);
  }
}

function rectangleRails(o, x0, x1, z0, z1, { gap = 0, gw = .62, side = 'S', color = C.honey, style = 'wood' } = {}) {
  const draw = (s, a, b, g) => {
    if (s !== side) { rail(o, a, b, color, Y, .43, style); return; }
    if (s === 'S' || s === 'N') {
      rail(o, a, [g - gw / 2, a[1]], color, Y, .43, style);
      rail(o, [g + gw / 2, b[1]], b, color, Y, .43, style);
    } else {
      rail(o, a, [a[0], g - gw / 2], color, Y, .43, style);
      rail(o, [b[0], g + gw / 2], b, color, Y, .43, style);
    }
  };
  draw('N', [x0 + .04, z0 + .04], [x1 - .04, z0 + .04], gap);
  draw('S', [x0 + .04, z1 - .04], [x1 - .04, z1 - .04], gap);
  draw('W', [x0 + .04, z0 + .04], [x0 + .04, z1 - .04], gap);
  draw('E', [x1 - .04, z0 + .04], [x1 - .04, z1 - .04], gap);
}

function book(o, x, y, z, w, h, color, lean = 0) {
  o.add(G.box(w, h, .18, .007), color, x, y + h / 2, z, 0, 0, lean);
  o.add(G.box(w * .7, .012, .012, .003), C.cream, x, y + h * .72, z + .097, 0, 0, lean);
}

function finish(f, P, way, areas, spots = []) {
  f.loft = { w: f.w, d: f.d, way, y: Y, P };
  f.stackAreas = areas.map(a => ({ u0: a[0], u1: a[1], v0: a[2], v1: a[3] }));
  walkSurfaces(f, way, areas);
  for (const [x, z] of spots) f.spot('on', P, x, TOP, z, { maxH: .48, label: '복층 위', scale: .9 });
}

// Native walkGrid input, rebuilt even when the cached render mesh is reused. Coordinates are furniture-local;
// Room transforms them with f.group so turning or moving a loft turns its deck, routes and collision bodies together.
// Area rectangles are already inside the rail; the walker still applies its own body-radius inset.
// Real floor slabs, stair carcasses and rungs also block ground cells underneath/inside them. Native authored climb
// nodes ignore their own furniture while traversing it; ordinary deck cells still respect its rails and cabinets.
function walkSurfaces(f, way, areas) {
  const solids = f.walkSolids = [], paths = [];
  const box = (x0, y0, z0, x1, y1, z1) => solids.push([x0, y0, z0, x1, y1, z1]);
  const post = (x, z, r = .075) => box(x - r, 0, z - r, x + r, Y - .13, z + r);
  const edge = (a, b, h = .055) => box(Math.min(a[0], b[0]) - h, Y, Math.min(a[1], b[1]) - h,
    Math.max(a[0], b[0]) + h, Y + .51, Math.max(a[1], b[1]) + h);
  const floor = (x0, x1, z0, z1, posts = true) => {
    box(x0, Y - .15, z0, x1, TOP + .003, z1);
    if (posts) for (const x of [x0 + .075, x1 - .075]) for (const z of [z0 + .075, z1 - .075]) post(x, z);
  };
  const sides = (x0, x1, z0, z1, gap, width, side = 'S') => {
    const q = { N: [[x0 + .04, z0 + .04], [x1 - .04, z0 + .04]], S: [[x0 + .04, z1 - .04], [x1 - .04, z1 - .04]],
      W: [[x0 + .04, z0 + .04], [x0 + .04, z1 - .04]], E: [[x1 - .04, z0 + .04], [x1 - .04, z1 - .04]] };
    for (const [k, [a, b]] of Object.entries(q)) {
      if (k !== side) { edge(a, b); continue; }
      const ax = k === 'S' || k === 'N' ? 0 : 1, lo = gap - width / 2, hi = gap + width / 2;
      if (lo > a[ax]) { const end = [...a]; end[ax] = lo; edge(a, end); }
      if (hi < b[ax]) { const start = [...b]; start[ax] = hi; edge(start, b); }
    }
  };
  const route = (kind, width, points) => paths.push({ kind, width, points });
  const ladderPath = (x, zFoot, zBottom, zTop, railTop, endZ, bottomY = .035) => {
    const points = [[x, 0, zFoot]];
    while (points[points.length - 1][2] - (zBottom + .29) > .45) points.push([x, 0, points[points.length - 1][2] - .4]);
    points.push([x, 0, zBottom + .29]);
    for (let i = 1; i <= 5; i++) {
      const y = i * .25, z = zBottom - (y - bottomY) * (zBottom - zTop) / railTop;
      points.push([x, y + .03, z]); box(x - .28, y - .03, z - .045, x + .28, y + .03, z + .045);
    }
    points.push([x, TOP, endZ + .22], [x, TOP, endZ]); route('ladder', .51, points);
    for (const s of [-1, 1]) box(x + s * .29 - .035, 0, zTop - .04, x + s * .29 + .035, railTop + .035, zBottom + .04);
  };
  if (way === 'ladder') {
    floor(-.91, .91, -1.37, .45); sides(-.91, .91, -1.37, .45, .44, .7);
    ladderPath(.44, 1.85, 1.17, .34, Y + .205, -.03, .045);
    box(-.76, .68, -1.27, .76, .9, -.84);
    for (const x of [-.62, .62]) box(x - .033, 0, -1.063, x + .033, .69, -.997);
  } else if (way === 'stairs') {
    floor(-1.4, 1.4, -1.4, .25); sides(-1.4, 1.4, -1.4, .25, .91, .68);
    const points = [[.91, 0, 1.85], [.91, 0, 1.59]];
    for (let i = 0; i < 6; i++) {
      const y = (i + 1) * Y / 6, z = .25 + (5.5 - i) * .18;
      points.push([.91, y + .015, z]); box(.6, y - .075, z - .108, 1.22, y + .015, z + .108);
    }
    points.push([.91, TOP, .06], [.91, TOP, -.18]); route('stairs', .55, points);
    for (const x of [.60, 1.22]) box(x - .029, .2, .24, x + .029, Y + .46, 1.35);
    box(-1.2, 0, -1.33, -.1, .65, -1.02);
  } else if (way === 'storage') {
    floor(-1.9, 1.9, -1.4, -.05); floor(-1.9, -.55, -.045, 1.35, false);
    post(-1.825, 1.275); post(-.625, 1.275);
    for (const [a, b] of [[[-1.86, -1.36], [1.86, -1.36]], [[-1.86, -1.36], [-1.86, 1.31]],
      [[-1.86, 1.31], [-.59, 1.31]], [[-.59, -.01], [-.59, 1.31]], [[-.55, -.09], [1.03, -.09]],
      [[1.77, -.09], [1.86, -.09]], [[1.86, -1.36], [1.86, -.09]]]) edge(a, b);
    const points = [[1.4, 0, 1.85], [1.4, 0, 1.66]];
    for (let i = 0; i < 6; i++) {
      const y = (i + 1) * Y / 6, z = -.05 + (5.5 - i) * (1.4 / 6);
      points.push([1.4, y + .003, z]); box(1.065, 0, z - 1.4 / 12 - .008, 1.735, y, z + 1.4 / 12 + .008);
    }
    points.push([1.4, TOP, -.2], [1.4, TOP, -.48]); route('storage-stairs', .58, points);
    box(1.746, .2, -.06, 1.804, Y + .43, 1.36); box(-1.23, .44, -1.34, -.63, .93, -1.2);
  } else if (way === 'spiral') {
    floor(-1.4, .18, -1.4, .8); sides(-1.4, .18, -1.4, .8, .49, .7, 'E');
    box(.15, Y - .055, .01, .65, Y + .01, .56);
    // A small union follows the round pole. One full-height square would falsely block diagonal stair treads.
    box(.795, 0, .585, .865, Y + .48, .715); box(.765, 0, .615, .895, Y + .48, .685);
    for (const sx of [-1, 1]) for (const sz of [-1, 1])
      box(.83 + sx * .045 - .01, 0, .65 + sz * .045 - .01, .83 + sx * .045 + .01, Y + .48, .65 + sz * .045 + .01);
    box(.76, Y + .45, .58, .90, Y + .59, .72);
    const points = [[.52, 0, 1.85], [.52, 0, 1.42], [.52, 0, .99], [.52, 0, .56], [.52, 0, .13]];
    for (let i = 0; i < 10; i++) {
      const theta = -HP + (i + .5) * (PI * 1.5 / 10), y = (i + 1) * Y / 10;
      points.push([.83 + Math.cos(theta) * .32, y, .65 + Math.sin(theta) * .32]);
      // Three small annular strips bound each real tread without filling the empty centre around the pole.
      for (let j = 0; j < 3; j++) {
        const a = -HP + (i + j / 3) * (PI * 1.5 / 10), b = -HP + (i + (j + 1) / 3) * (PI * 1.5 / 10);
        const p = [a, b].flatMap(t => [.075, .62].map(r => [.83 + Math.cos(t) * r, .65 + Math.sin(t) * r]));
        box(Math.min(...p.map(v => v[0])), y - .07, Math.min(...p.map(v => v[1])), Math.max(...p.map(v => v[0])), y, Math.max(...p.map(v => v[1])));
      }
      const x = .83 + Math.cos(theta) * .625, z = .65 + Math.sin(theta) * .625;
      box(x - .023, y, z - .023, x + .023, y + .44, z + .023);
    }
    points.push([.43, Y + .02, .45], [.1, TOP, .45], [-.2, TOP, .45], [-.25, TOP, .3]); route('spiral-stairs', .5, points);
    box(-1.35, 0, -1.31, -.91, 1.1, -.99); box(-.92, 0, -1.03, .24, .63, -.28);
    box(-1.3, .11, .64, .274, 1.12, .78);
    // The closed curtain makes this a hiding cabinet, not an NPC spawn room. Reserving its hollow interior keeps
    // companions from appearing behind the curtain; the native inside hiding anchor remains fully usable.
    box(-1.3, 0, -1.3, .274, 1.12, .78);
  } else if (way === 'slide') {
    floor(-1.3, 1.3, -1.85, -.05, false);
    for (const x of [-1.16, 1.16]) for (const z of [-1.71, -.19]) post(x, z, .12);
    for (const [a, b] of [[[-1.25, -1.8], [1.25, -1.8]], [[-1.25, -1.8], [-1.25, -.09]], [[1.25, -1.8], [1.25, -.09]],
      [[-1.25, -.09], [-1.02, -.09]], [[-.42, -.09], [.21, -.09]], [[.93, -.09], [1.25, -.09]]]) edge(a, b);
    ladderPath(-.72, 2.35, .51, -.13, Y + .145, -.5);
    const points = [[.57, 0, 2.35], [.57, .0775, 1.8]];
    for (let i = 0; i <= 14; i++) {
      const k = 1 - i / 14, dy = -1.716 + .962 * k, len = Math.hypot(1.78, dy);
      points.push([.57, Y * (1 - k) * (1 - .37 * k) + .065 * k + .0275 * 1.78 / len, -.05 + 1.78 * k - .0275 * dy / len]);
      if (i < 14) {
        const j = 1 - (i + 1) / 14, ya = Y * (1 - k) * (1 - .37 * k) + .065 * k, yb = Y * (1 - j) * (1 - .37 * j) + .065 * j;
        box(.24, Math.min(ya, yb) - .03, -.05 + 1.78 * j - .03, .9, Math.max(ya, yb) + .18, -.05 + 1.78 * k + .1);
      }
    }
    points.push([.57, TOP, -.26], [.57, TOP, -.5]); route('slide-ramp', .51, points);
    box(-.9, 0, -1.6, -.25, .32, -1.2);
    for (const x of [-1.18, 1.18]) box(x - .06, Y, -1.79, x + .06, 2.13, -1.67);
  } else if (way === 'net') {
    floor(-.91, .91, -1.37, .45); sides(-.91, .91, -1.37, .45, 0, 1.25);
    const points = [[0, 0, 1.85], [0, .05, 1.5]];
    for (let i = 0; i <= 7; i++) {
      const t = i / 7, y = .07 + 1.23 * t, z = 1.31 - .88 * t;
      points.push([0, y + .03, z]); box(-.63, y - .025, z - .035, .63, y + .035, z + .035);
    }
    points.push([0, TOP, .2], [0, TOP, -.03]); route('climbing-net', .7, points);
    for (const x of [-.65, .65]) box(x - .046, 0, .3, x + .046, Y + .23, 1.36);
    box(-.51, 0, -1.12, .53, .3, -.64);
  }
  f.walk = { areas: areas.map(a => ({ x0: a[0], x1: a[1], z0: a[2], z1: a[3], y: TOP })), paths };
}

// Sweep one continuous moulded U-section along the ride path. Normals are shared along each ribbon,
// so the slide is smooth instead of looking like a flight of little coral steps.
function trough(at, segments = 28) {
  const profile = [[-.33, -.013], [-.315, -.028], [.315, -.028], [.33, -.013], [.33, .151], [.315, .17],
    [.29, .17], [.275, .151], [.275, .04], [.26, .0275], [-.26, .0275], [-.275, .04], [-.275, .151], [-.29, .17], [-.315, .17], [-.33, .151]];
  const pos = [], indices = [], atProfile = (t, p) => {
    const a = at(t), l = at(Math.max(0, t - .001)), r = at(Math.min(1, t + .001));
    const dy = r[1] - l[1], dz = r[2] - l[2], len = Math.hypot(dy, dz);
    return [a[0] + p[0], a[1] + p[1] * dz / len, a[2] - p[1] * dy / len];
  };
  for (let j = 0; j < profile.length; j++) {
    const base = pos.length / 3;
    for (let i = 0; i <= segments; i++) for (const p of [profile[j], profile[(j + 1) % profile.length]]) pos.push(...atProfile(i / segments, p));
    for (let i = 0; i < segments; i++) { const a = base + i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const faces = THREE.ShapeUtils.triangulateShape(profile.map(p => new THREE.Vector2(...p)), []);
  for (const t of [0, 1]) {
    const base = pos.length / 3; profile.forEach(p => pos.push(...atProfile(t, p)));
    for (const q of faces) indices.push(...(t ? q : [...q].reverse()).map(i => base + i));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
}

// A warm timber bed-frame loft, open below with a shallow study shelf and a tied blanket over the side rail.
B.gpt_loft_oak = f => {
  const P = f.add(grp()), x0 = -.91, x1 = .91, z0 = -1.37, z1 = .45, lx = .44;
  P.add(mc('gpt-oak-loft-v2', o => {
    const { add, tube } = o;
    deck(o, { x0, x1, z0, z1 });
    rectangleRails(o, x0, x1, z0, z1, { gap: lx, gw: .7 });
    // A real diagonal ladder: both rails and every rung lie on the same slope and meet the deck opening.
    for (const s of [-1, 1]) tube([lx + s * .29, .045, 1.17], [lx + s * .29, Y + .25, .34], .035, C.honey, 7);
    for (let i = 1; i <= 5; i++) {
      const y = i * .25, z = 1.17 - (y - .045) * .83 / (Y + .205);
      add(G.box(.56, .06, .09, .018), C.wood, lx, y, z);
    }
    add(G.box(1.52, .075, .4, .025), C.wood, 0, .72, -1.06);
    for (const x of [-.62, .62]) add(G.box(.065, .69, .065, .015), C.honey, x, .345, -1.03);
    add(G.box(.54, .045, .26, .015), C.sage, -.32, .782, -1.08);
    add(G.box(.32, .025, .23, .005), C.cream, -.32, .816, -1.08, 0, -.08);
    add(G.cyl(.055, .052, .1, 12), C.coral, .43, .815, -1.02);
    add(G.tor(.036, .011, PI * 1.6, 5, 12), C.coral, .49, .82, -1.02, 0, HP);
    // The textile folds over the left rail, outside the player's usable floor.
    add(G.box(.07, .4, .38, .025), C.sage, -.91, Y + .27, -.6);
    add(G.box(.09, .035, .4, .014), C.cream, -.91, Y + .48, -.6);
    for (let i = 0; i < 4; i++) add(G.box(.076, .035, .035, .009), C.cream, -.91, Y + .12, -.74 + i * .09);
    // Empty underfloor remains a full hiding space; the little slipper pair stays at the rear edge.
    for (const x of [-.54, -.33]) add(G.box(.15, .075, .25, .04), C.cream, x, .04, -.72);
  }));
  f.spot('under', P, -.18, 0, -.02, { maxH: .65, label: '원목 복층 아래', scale: 1 });
  finish(f, P, 'ladder', [[-.76, .76, -1.22, .3]], [[-.36, -.65], [.38, -.65]]);
};

// Open sage steel mezzanine: six wood-capped treads, paired stringers and an uninterrupted handrail.
B.gpt_loft_sage = f => {
  const P = f.add(grp()), x0 = -1.4, x1 = 1.4, z0 = -1.4, z1 = .25, sx = .91, N = 6, run = .18;
  P.add(mc('gpt-sage-loft-v1', o => {
    const { add, tube } = o;
    deck(o, { x0, x1, z0, z1, frame: C.sageD, color: C.cream });
    rectangleRails(o, x0, x1, z0, z1, { gap: sx, gw: .68, color: C.sageD, style: 'steel' });
    // Diagonal bracing is tucked into the back edge, keeping the underfloor visibly open.
    tube([x0 + .08, .14, z0 + .09], [x0 + .45, Y - .16, z0 + .09], .027, C.sageD, 6);
    tube([x1 - .08, .14, z0 + .09], [x1 - .45, Y - .16, z0 + .09], .027, C.sageD, 6);
    for (let i = 0; i < N; i++) {
      const y = (i + 1) * Y / N, z = z1 + (N - i - .5) * run;
      add(G.box(.62, .075, run + .035, .018), C.honey, sx, y - .0375, z);
      add(G.box(.52, .018, .08, .006), C.wood, sx, y + .006, z - .025);
      for (const side of [-1, 1]) {
        const px = sx + side * .31;
        tube([px, y, z], [px, y + .43, z], .023, C.sageD, 6);
        if (i < N - 1) tube([px, y + .43, z], [px, y + Y / N + .43, z - run], .028, C.sageD, 7);
      }
    }
    for (const side of [-1, 1]) {
      const px = sx + side * .26;
      tube([px, .12, 1.33], [px, Y - .09, .29], .038, C.sageD, 7);
      tube([sx + side * .31, Y + .43, z1 + run / 2], [sx + side * .31, Y + .43, z1 - .04], .028, C.sageD, 7);
    }
    // A skinny underfloor shelf with a canvas basket and three books.
    add(G.box(1.06, .055, .28, .017), C.wood, -.64, .32, -1.18);
    for (const x of [-1.13, -.15]) add(G.box(.055, .32, .22, .012), C.sageD, x, .16, -1.18);
    for (let i = 0; i < 3; i++) book(o, -.98 + i * .11, .35, -1.17, .085, .24 + i * .025, [C.coral, C.cream, C.book][i]);
    add(G.box(.32, .23, .24, .035), C.cream, -.38, .47, -1.17);
    add(G.box(.12, .035, .014, .01), C.honey, -.38, .52, -1.039);
  }));
  f.spot('under', P, -.4, 0, -.12, { maxH: .7, label: '세이지 복층 아래', scale: 1 });
  finish(f, P, 'stairs', [[-1.24, 1.24, -1.24, .09]], [[-.67, -.65], [.4, -.65]]);
};

// An L-shaped floor around an open central courtyard; six drawer stairs land precisely on the back arm.
B.gpt_loft_corner = f => {
  const P = f.add(grp()), sx = 1.4, zTop = -.05, run = .2333333333, N = 6;
  P.add(mc('gpt-corner-loft-v1', o => {
    const { add, tube } = o;
    deck(o, { x0: -1.9, x1: 1.9, z0: -1.4, z1: -.05 });
    deck(o, { x0: -1.9, x1: -.55, z0: -.045, z1: 1.35, posts: false });
    for (const px of [-1.825, -.625]) {
      add(G.box(.13, Y - .13, .13, .02), C.honey, px, (Y - .13) / 2, 1.275);
      add(G.box(.19, .07, .19, .02), C.edge, px, .035, 1.275);
    }
    rail(o, [-1.86, -1.36], [1.86, -1.36]); rail(o, [-1.86, -1.36], [-1.86, 1.31]);
    rail(o, [-1.86, 1.31], [-.59, 1.31]); rail(o, [-.59, -.01], [-.59, 1.31]);
    rail(o, [-.55, -.09], [1.03, -.09]); rail(o, [1.77, -.09], [1.86, -.09]);
    rail(o, [1.86, -1.36], [1.86, -.09]);
    for (let i = 0; i < N; i++) {
      const h = (i + 1) * Y / N, z = zTop + (N - i - .5) * run, front = z + run / 2;
      // Hollow carcass: floor, tall sides, back, and lower face. The top drawer opens onto its real box.
      add(G.box(.67, .055, run + .016, .014), C.wood, sx, h - .0275, z);
      for (const s of [-1, 1]) add(G.box(.038, h - .055, run - .012, .009), C.honey, sx + s * .311, (h - .055) / 2, z);
      add(G.box(.59, Math.max(.025, h - .07), .025, .005), C.honey, sx, (h - .07) / 2, z - run / 2 + .018);
      if (h > .26) add(G.box(.59, h - .245, .028, .007), C.honey, sx, (h - .245) / 2, front - .015);
      add(G.box(.58, .014, run - .05, .005), C.cream, sx, Math.max(.008, h - .217), z);
      if (i < N - 1) {
        tube([1.775, h + .39, z], [1.775, h + Y / N + .39, z - run], .029, C.sageD, 7);
        tube([1.775, h, z], [1.775, h + .39, z], .023, C.sageD, 6);
      }
    }
    tube([1.775, Y, zTop + run / 2], [1.775, Y + .4, zTop + run / 2], .024, C.sageD, 6);
    // A quiet back-edge peg rail underneath the L, with a canvas tote.
    add(G.box(.58, .1, .045, .015), C.wood, -.92, .87, -1.305);
    add(G.tor(.07, .015, PI, 5, 14), C.honey, -.94, .8, -1.25);
    add(G.box(.26, .29, .065, .04), C.sage, -.94, .6, -1.245);
  }));
  for (let i = 0; i < N; i++) {
    const h = (i + 1) * Y / N, z = zTop + (N - i) * run, dv = grp();
    put(dv, sx, h - .135, z); P.add(dv);
    dv.add(mc('gpt-corner-step-drawer-v1|' + i, ({ add }) => {
      add(G.box(.584, .163, .026, .011), i % 2 ? C.sage : C.cream, 0, 0, 0);
      add(G.box(.55, .017, .18, .004), C.wood, 0, -.072, -.1);
      for (const s of [-1, 1]) add(G.box(.017, .117, .18, .004), C.wood, s * .27, -.02, -.1);
      add(G.box(.55, .117, .017, .004), C.wood, 0, -.02, -.184);
      add(G.box(.15, .029, .035, .01), C.honey, 0, .025, .028);
      // Folded tea towels stay to one side of the hiding place.
      add(G.box(.12, .025, .1, .008), i % 2 ? C.cream : C.coral, .17, -.045, -.12);
    }));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .21 * t; }, { label: `복층 계단 서랍 ${i + 1}`, sfx: 'drawer', dur: .26 });
    f.spot('inside', dv, -.07, -.058, -.11, { part: p, maxH: .12, label: `계단 ${i + 1}번째 서랍`, scale: .72 });
  }
  f.spot('under', P, -1.14, 0, .3, { maxH: .7, label: 'ㄱ자 복층 아래', scale: 1 });
  finish(f, P, 'storage', [[-1.75, 1.75, -1.25, -.2], [-1.75, -.7, -1.25, 1.2]], [[-1.16, -.78], [.57, -.78], [-1.17, .55]]);
};

// An airy spiral stair to a library floor. The curtains gather to expose a genuinely furnished reading alcove.
B.gpt_loft_library = f => {
  const P = f.add(grp()), x0 = -1.4, x1 = .18, z0 = -1.4, z1 = .8, cx = .83, cz = .65, R = .62, N = 10;
  P.add(mc('gpt-library-loft-v2', o => {
    const { add, tube } = o;
    deck(o, { x0, x1, z0, z1, color: C.cream });
    rectangleRails(o, x0, x1, z0, z1, { side: 'E', gap: .49, gw: .7 });
    // Ten annular treads turn 270 degrees. Their height, outer handrail and final landing match exactly.
    add(G.cyl(.047, .065, Y + .48, 10), C.sageD, cx, (Y + .48) / 2, cz);
    add(G.sph(.07, 10, 7), C.wood, cx, Y + .52, cz);
    let prev = null;
    for (let i = 0; i < N; i++) {
      const a = -HP + i * (PI * 1.5 / N), b = a + PI * 1.5 / N + .012, y = (i + 1) * Y / N;
      const s = new THREE.Shape(); s.moveTo(Math.cos(a) * .075, Math.sin(a) * .075);
      s.lineTo(Math.cos(a) * R, Math.sin(a) * R); s.absarc(0, 0, R, a, b, false);
      s.lineTo(Math.cos(b) * .075, Math.sin(b) * .075); s.absarc(0, 0, .075, b, a, true); s.closePath();
      add(G.ext(s, .065, .005, 3), i % 2 ? C.wood : C.cream, cx, y, cz, HP);
      const theta = (a + b) / 2, x = cx + Math.cos(theta) * (R + .005), z = cz + Math.sin(theta) * (R + .005);
      tube([x, y, z], [x, y + .41, z], .022, C.sageD, 6);
      const point = [x, y + .41, z]; if (prev) tube(prev, point, .028, C.sageD, 7); prev = point;
    }
    // The narrow bridge clears the pole and enters the gap in the mezzanine's east rail.
    add(G.box(.5, .065, .55, .012), C.wood, .4, Y - .0225, .285);
    // Real bookcase at the rear left, with small alternating open cubbies.
    const bx = -1.13, bz = -1.15;
    for (const x of [bx - .19, bx + .19]) add(G.box(.045, 1.08, .29, .013), C.honey, x, .54, bz);
    add(G.box(.42, 1.08, .035, .01), C.wood, bx, .54, bz - .135);
    for (const y of [.055, .39, .73, 1.065]) add(G.box(.42, .045, .29, .01), C.honey, bx, y, bz);
    for (let k = 0; k < 3; k++) book(o, bx - .11 + k * .102, .414, bz + .025, .077, .235 - k * .025, [C.coral, C.book, C.sage][k]);
    for (let k = 0; k < 2; k++) book(o, bx - .09 + k * .12, .755, bz + .025, .085, .23, [C.lilac, C.cream][k]);
    add(G.box(.2, .15, .22, .025), C.sage, bx, .155, bz);
    // A built-in padded bench with a back cushion and a folded throw.
    add(G.box(1.15, .18, .73, .035), C.honey, -.34, .1, -.65);
    add(G.box(1.12, .12, .72, .05), C.sage, -.34, .25, -.65);
    add(G.box(.44, .32, .14, .065), C.cream, -.53, .46, -.91, -.17, -.06);
    add(G.box(.31, .045, .4, .025), C.coral, -.01, .335, -.61);
    for (let i = 0; i < 3; i++) add(G.box(.31, .012, .025, .004), C.cream, -.01, .36, -.74 + i * .1);
    // The curtain track is part of the frame, underneath the fascia rather than crossing the upper floor.
    tube([-1.29, 1.12, .67], [.27, 1.12, .67], .023, C.honey, 7);
  }));
  const curtains = [-1, 1].map(side => {
    const q = grp(); put(q, -.51 + side * .385, .61, .68); P.add(q);
    q.add(mc('gpt-reading-curtain-v1|' + side, ({ add }) => {
      for (let i = 0; i < 7; i++) {
        const x = -.335 + i * .112;
        add(G.box(.123, .98, .065, .023), i % 2 ? C.cream : '#f2dcbc', x, 0, (i % 2) * .03);
        add(G.tor(.025, .009, PI * 2, 4, 10), C.honey, x, .51, 0, 0, HP);
        add(G.box(.115, .048, .075, .015), C.sage, x, -.43, (i % 2) * .03);
      }
    })); return q;
  });
  const p = f.part('curtain', curtains, (t, l, r) => {
    curtains[0].position.x = l.p.x - .24 * t; curtains[1].position.x = r.p.x + .24 * t;
    curtains.forEach(q => { q.scale.x = 1 - .63 * t; });
  }, { label: '책방 복층 커튼', sfx: 'swish', dur: .42 });
  f.spot('inside', P, -.53, 0, .3, { part: p, maxH: .6, label: '커튼 안 독서 아지트', scale: 1 });
  f.spot('under', P, -.26, .32, -.44, { maxH: .42, label: '독서 벤치 위', scale: .85 });
  finish(f, P, 'spiral', [[-1.24, .02, -1.24, .64]], [[-.57, -.75], [-.57, .17]]);
};

// Treehouse play loft: a coral slide with a fully continuous ride path, plus a little ladder beside it.
B.gpt_loft_treehouse = f => {
  const P = f.add(grp()), x0 = -1.3, x1 = 1.3, z0 = -1.85, z1 = -.05, sx = .57, L = 1.78;
  const at = k => [sx, Y * (1 - k) * (1 - .37 * k) + .065 * k, z1 + L * k];
  P.add(mc('gpt-treehouse-slide-v3', o => {
    const { add, tube } = o;
    deck(o, { x0, x1, z0, z1, posts: false });
    // Round trunks branch into the deck; cream end grain avoids sombre bark.
    for (const x of [-1.16, 1.16]) for (const z of [-1.71, -.19]) {
      add(G.cyl(.085, .12, Y - .1, 9), C.honey, x, (Y - .1) / 2, z);
      tube([x, .76, z], [x * .82, Y - .1, z], .045, C.honey, 7);
      add(G.cyl(.14, .16, .07, 10), C.edge, x, .035, z);
    }
    rail(o, [x0 + .05, z0 + .05], [x1 - .05, z0 + .05]);
    rail(o, [x0 + .05, z0 + .05], [x0 + .05, z1 - .04]); rail(o, [x1 - .05, z0 + .05], [x1 - .05, z1 - .04]);
    rail(o, [-1.25, z1 - .04], [-1.02, z1 - .04]); rail(o, [-.42, z1 - .04], [.21, z1 - .04]); rail(o, [.93, z1 - .04], [1.25, z1 - .04]);
    // A handful of leaves at the outer back corners, never over the usable upper floor.
    for (const side of [-1, 1]) {
      tube([side * 1.18, Y, -1.73], [side * 1.18, 2.12, -1.73], .055, C.honey, 8);
      for (const [x, y, z, r] of [[1.1, 2.22, -1.73, .23], [1.19, 2.36, -1.69, .2], [.98, 2.32, -1.74, .2]])
        add(G.sph(r, 9, 7), y < 2.3 ? C.sage : C.leaf, side * x, y, z, 0, 0, 0, [1, .7, .8]);
    }
    add(trough(at), C.coral, 0, 0, 0);
    add(G.box(.66, .065, .18, .03), C.cream, sx, .045, 1.79);
    // Left-hand ladder has its own opening, clear of the slide's entrance.
    for (const side of [-1, 1]) tube([-.72 + side * .29, .035, .51], [-.72 + side * .29, Y + .18, -.13], .033, C.honey, 7);
    for (let i = 1; i <= 5; i++) {
      const y = .25 * i; add(G.box(.56, .06, .09, .015), C.wood, -.72, y, .51 - (y - .035) * .64 / (Y + .145));
    }
    // A low open toy crate under the back of the loft.
    add(G.box(.6, .04, .36, .014), C.sage, -.57, .045, -1.4);
    for (const side of [-1, 1]) add(G.box(.045, .25, .36, .013), C.sage, -.57 + side * .278, .17, -1.4);
    for (const z of [-1.56, -1.24]) for (const y of [.13, .23]) add(G.box(.6, .065, .035, .01), C.sage, -.57, y, z);
    add(G.sph(.1, 10, 7), C.cream, -.7, .17, -1.4);
    add(G.box(.17, .16, .16, .025), C.book, -.41, .16, -1.4, 0, .2);
  }));
  f.slidePath = k => { const p = at(Math.max(0, Math.min(1, k))); return P.localToWorld(new THREE.Vector3(p[0], p[1] + .05, p[2])); };
  f.spot('under', P, .3, 0, -.72, { maxH: .7, label: '나무집 아래', scale: 1 });
  finish(f, P, 'slide', [[-1.11, 1.11, -1.64, -.22]], [[-.62, -.98], [.57, -.98]]);
};

// Small adventure loft with a taut climbing net: every knot lies on the same sloping plane as the wooden side frames.
B.gpt_loft_net = f => {
  const P = f.add(grp()), x0 = -.91, x1 = .91, z0 = -1.37, z1 = .45;
  P.add(mc('gpt-net-loft-v1', o => {
    const { add, tube } = o;
    deck(o, { x0, x1, z0, z1, frame: C.sageD });
    rectangleRails(o, x0, x1, z0, z1, { gap: 0, gw: 1.25, color: C.sageD });
    const at = (x, t) => [x, .07 + (Y - .07) * t, 1.31 + (.43 - 1.31) * t];
    for (const side of [-1, 1]) tube(at(side * .65, 0), at(side * .65, 1.12), .045, C.honey, 8);
    for (let i = 0; i <= 6; i++) tube(at(-.6 + i * .2, 0), at(-.6 + i * .2, 1), .017, C.rope, 6);
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      tube(at(-.62, t), at(.62, t), .021, i === 0 || i === 7 ? C.honey : C.rope, 6);
      for (let j = 0; j <= 6; j++) {
        const a = at(-.6 + j * .2, t);
        add(G.sph(.025, 6, 5), C.cream, a[0], a[1] + .006, a[2]);
      }
    }
    // Coral lashings are bold enough to read, while the rope stays a calm natural colour.
    for (const side of [-1, 1]) for (let k = 0; k < 3; k++) add(G.box(.1, .032, .095, .012), C.coral, side * .65, Y - .06 + k * .042, .45);
    add(G.box(1.25, .035, .52, .05), C.cream, 0, .025, -.79);
    add(G.box(.42, .09, .32, .045), C.sage, -.28, .085, -.8);
    // A large folded blanket and a tiny lantern make the space an indoor den, without filling its central hiding place.
    add(G.box(.32, .075, .3, .025), C.coral, .35, .085, -.94);
    add(G.box(.32, .018, .045, .006), C.cream, .35, .13, -.91);
    add(G.cyl(.065, .075, .18, 10), C.cream, -.64, .12, -1.03);
    add(G.cyl(.084, .084, .035, 10), C.honey, -.64, .22, -1.03);
    add(G.tor(.055, .012, PI, 5, 12), C.honey, -.64, .26, -1.03);
  }));
  f.spot('under', P, .03, 0, -.1, { maxH: .65, label: '그물 복층 아지트', scale: 1 });
  finish(f, P, 'net', [[-.75, .75, -1.21, .29]], [[-.35, -.66], [.35, -.66]]);
};

export const GPT_LOFT_INFO = {
  gpt_loft_oak: { w: 2, d: 3, name: '원목 로프트 · 사다리', price: 600, ch: 1, region: 'home' },
  gpt_loft_sage: { w: 3, d: 3, name: '세이지 철제 복층 · 계단', price: 900, ch: 2, region: 'home' },
  gpt_loft_corner: { w: 4, d: 3, name: 'ㄱ자 수납 복층 · 서랍 계단', price: 1250, ch: 3, region: 'home' },
  gpt_loft_library: { w: 3, d: 3, name: '책방 아지트 · 나선 계단', price: 1400, ch: 4, region: 'home' },
  gpt_loft_treehouse: { w: 3, d: 4, name: '나무집 복층 · 미끄럼틀', price: 1500, ch: 5, region: 'home' },
  gpt_loft_net: { w: 2, d: 3, name: '모험 아지트 · 오르기 그물', price: 1000, ch: 2, region: 'home' },
};
export const GPT_LOFT_TOP = Object.fromEntries(Object.keys(GPT_LOFT_INFO).map(k => [k, TOP]));
export const GPT_LOFT_BUILDERS = B;

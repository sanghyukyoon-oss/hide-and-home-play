// 몽글 꼬마 소방차 2 · 미니 조립 모형 (gpt3-k vehicles2, fix-1022 반영 — ① 10/22 들여옴: 빌더만, 색은 GPT 원색 그대로;
// 작업장의 키트 등록(gpt-kit.js KITS.gptfiretruck2)·장치 엔진은 뺌 — 미니 모형은 숨은 가구로만, 조립판 연결은 ② 몫).
// Concept #1 rebuilt as a soft, cab-over neighbourhood fire engine. The wheel
// openings are real notches in the body profile. All seven kit parts reuse this
// exact full-size model, uniformly scaled, so its little assembled toy matches.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { grp, put, mesh, mat } from './kit.js';
import { HG, hmc, hxf as xf } from './house-props.js';

// Tiny trim is a flat painted strip; a sub-centimetre bevel only adds triangles
// at phone size. Keep the rounded silhouette on the body, wheels and handles.
const G = { ...HG, box: (w, h, d, r = .02, seg = 1) => Math.min(w, h, d) < .028 ? HG.pbox(w, h, d) : HG.box(w, h, d, r, seg) };
const compact = new WeakMap();
const mc = (key, build) => {
  const m = hmc('gpt3k|' + key, build), src = m.geometry;
  if (!compact.has(src)) compact.set(src, mergeVertices(src, 1e-6));
  m.geometry = compact.get(src); return m;
};

const PI = Math.PI, HP = PI / 2;
const C = { red: '#e65d4d', redD: '#bc493e', redL: '#f07b62', cream: '#fef2e1', silver: '#e8d7b7',
  silverD: '#a09769', tyre: '#644936', tread: '#78481d', hub: '#eecfa3', dark: '#6f4b30',
  seat: '#84ae9d', dash: '#a09769', glass: '#b0e5e8', brass: '#eaa440', hose: '#eecfa3',
  helmet: '#feb53d', light: '#e84d42', paper: '#fef2e1' };
const B = {}, WX = [-.82, .84], WZ = .6;

const rr = (x, y, w, h, r, Type = THREE.Shape) => {
  const s = new Type(); s.moveTo(x + r, y); s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
};
const slab = (shape, d, bevel = .018) => {
  const b = Math.min(bevel, d / 4), depth = d - 2 * b;
  const g = G.ext(shape, depth, b, 5); g.translate(0, 0, -depth / 2); return g;
};
// A mudguard is a hollow, shoulder-wide shell. Its inner edge stays at least
// .025 m beyond the .35 m tyre, including the bevel; no disc fills the well.
const mudguard = () => {
  const s = new THREE.Shape();
  s.absarc(0, 0, .425, 0, PI, false); s.lineTo(-.39, 0);
  s.absarc(0, 0, .39, PI, 0, true); s.closePath();
  return slab(s, .34, .008);
};
function wheelNotch(s, cx, y = .3, r = .41) {
  const cy = .36, a = Math.asin((y - cy) / r), dx = Math.sqrt(r * r - (y - cy) ** 2);
  s.lineTo(cx + dx, y); s.absarc(cx, cy, r, a, PI - a, false); return s;
}
function bodySide(far = false) {
  const s = new THREE.Shape();
  s.moveTo(-1.3, .3); s.lineTo(-1.3, 1.5); s.quadraticCurveTo(-1.3, 1.65, -1.14, 1.65);
  s.lineTo(.23, 1.65); s.lineTo(.23, .3); wheelNotch(s, WX[0]); s.lineTo(-1.3, .3);
  s.holes.push(rr(-1.21, .86, .67, .66, .035, THREE.Path));
  if (!far) s.holes.push(rr(-.48, .96, .61, .56, .035, THREE.Path));
  return s;
}
function cabSide() {
  const s = new THREE.Shape(); s.moveTo(.27, .3); s.lineTo(.27, 1.69);
  s.quadraticCurveTo(.27, 1.87, .48, 1.87); s.lineTo(.98, 1.87);
  s.quadraticCurveTo(1.22, 1.87, 1.3, 1.6); s.lineTo(1.35, 1.06); s.lineTo(1.35, .3);
  wheelNotch(s, WX[1]); s.lineTo(.27, .3);
  s.holes.push(rr(.42, 1.09, .69, .59, .13, THREE.Path)); return s;
}

function helmet(add, x, y, z, color = C.helmet, sz = 1) {
  add(G.sph(.115, 14, 9), color, x, y + .075, z, 0, 0, 0, [1.06, .73, .78]);
  add(G.box(.28, .035, .18, .045), color, x, y + .025, z + sz * .015);
  add(G.box(.05, .065, .035, .009), C.dark, x, y + .07, z + sz * .088);
  add(G.box(.022, .035, .012, .004), C.brass, x, y + .077, z + sz * .111);
}
function extinguisher(add, tube, x, y, z, sz = 1, q = 1) {
  add(G.cyl(.067 * q, .067 * q, .27 * q, 14), C.red, x, y + .155 * q, z);
  add(G.sph(.067 * q, 12, 6), C.red, x, y + .295 * q, z, 0, 0, 0, [1, .55, 1]);
  add(G.cyl(.025 * q, .025 * q, .055 * q, 10), C.brass, x, y + .335 * q, z);
  add(G.box(.08 * q, .025 * q, .045 * q, .008 * q), C.dark, x + .012 * q, y + .37 * q, z);
  add(G.box(.075 * q, .12 * q, .008 * q, .009 * q), C.paper, x, y + .16 * q, z + sz * .068 * q);
  tube([x + .03 * q, y + .37 * q, z], [x + .1 * q, y + .29 * q, z], .012 * q, C.dark, 6);
  tube([x + .1 * q, y + .29 * q, z], [x + .1 * q, y + .11 * q, z + sz * .025 * q], .014 * q, C.dark, 6);
}

function chassis(g, closed = false) {
  g.add(mc('gpt-ft2-chassis', ({ add, addM, tube }) => {
    // Narrow central spine leaves actual empty space for all four tyres.
    add(G.box(2.55, .16, .82, .055), C.dark, -.01, .37, 0);
    add(G.box(1.52, 1.14, .61, .07), C.red, -.53, 1.01, 0);
    add(G.box(1.58, .16, 1.28, .055), C.red, -.53, 1.59, 0);
    for (const sz of [-1, 1]) {
      addM(slab(bodySide(sz < 0), .10, .018), xf(0, 0, sz * .6), C.red);
      // Pale stripe sits above the arch's high point, never across a tyre.
      add(G.box(1.46, .075, .025, .012), C.cream, -.54, .85, sz * .668);
      add(G.box(.09, .08, .028, .012), C.brass, -1.15, .63, sz * .665);
      // Real lockers: floor, inner back, upper shelf and contents.
      add(G.box(.64, .035, .34, .008), C.silverD, -.885, .88, sz * .48);
      add(G.box(.63, .61, .022, .006), C.silverD, -.885, 1.19, sz * .32);
      add(G.box(.25, .027, .23, .008), C.silver, -1.045, 1.19, sz * .46);
      helmet(add, -1.045, 1.21, sz * .55, C.helmet, sz);
      extinguisher(add, tube, -1.11, .895, sz * .48, sz, .7);
    }
    // Rear face: bumper, step, tail lamps, towing loop.
    add(G.box(.15, .2, 1.42, .075, 2), C.silverD, -1.33, .31, 0);
    add(G.box(.26, .055, .64, .025), C.silver, -1.33, .46, 0);
    for (const sz of [-1, 1]) {
      add(G.box(.035, .13, .12, .025), C.redD, -1.325, .72, sz * .47);
      add(G.box(.018, .06, .1, .015), C.light, -1.35, .75, sz * .47);
      add(G.box(.018, .045, .1, .01), C.brass, -1.35, .69, sz * .47);
    }
    add(G.tor(.06, .019, PI * 2, 6, 16), C.dark, -1.42, .25, 0, 0, HP, 0);
    // Couplings, the far hose rack, and two short roof ladder brackets.
    for (const x of [-1.08, .08]) add(G.box(.12, .17, .69, .035), C.dark, x, 1.73, 0);
    for (const x of [-.35, -.08]) { add(G.cyl(.055, .055, .04, 12), C.brass, x, .99, -.67, HP, 0, 0); add(G.tor(.04, .012, PI * 2, 5, 12), C.silver, x, .99, -.697); }
  }));
  if (closed) for (const sz of [-1, 1]) g.add(put(lockerFace(sz), -.885, 1.19, sz * .673));
}
function wheelPair(g, key, x) {
  g.add(mc('gpt-ft2-wheel-' + key, ({ add }) => {
    add(G.cyl(.04, .04, 1.24, 10), C.dark, x, .36, 0, HP, 0, 0);
    for (const sz of [-1, 1]) {
      add(G.tor(.245, .105, PI * 2, 10, 24), C.tyre, x, .36, sz * WZ, 0, 0, 0, [1, 1, 1.35]);
      add(G.cyl(.245, .245, .24, 20), C.tyre, x, .36, sz * WZ, HP, 0, 0);
      add(G.sph(.195, 16, 10), C.hub, x, .36, sz * .73, 0, 0, 0, [1, 1, .36]);
      add(G.sph(.068, 10, 8), C.brass, x, .36, sz * .799, 0, 0, 0, [1, 1, .22]);
      // Tyre shoulder treads are sparse and broad enough to read as rubber.
      for (let k = 0; k < 12; k++) { const a = k * PI / 6; add(G.box(.055, .025, .16, .01), C.tread, x + Math.cos(a) * .327, .36 + Math.sin(a) * .327, sz * .635, 0, 0, a - HP); }
    }
  }));
}
function fenders(g) {
  g.add(mc('gpt-ft2-wheel-arches', ({ add, addM }) => {
    for (const x of WX) for (const sz of [-1, 1]) {
      addM(mudguard(), xf(x, .36, sz * .62), C.redD);
      // Stubby fender ends follow the notched panel down to the step line.
      for (const sx of [-1, 1]) add(G.box(.06, .12, .34, .02), C.redD, x + sx * .415, .32, sz * .62);
    }
  }));
}
function cab(g) {
  g.add(mc('gpt-ft2-cab', ({ add, addM, tube }) => {
    add(G.box(.96, .43, .82, .1, 2), C.red, .8, .75, 0);
    for (const sz of [-1, 1]) addM(slab(cabSide(), .10, .021), xf(0, 0, sz * .6), C.red);
    // Broad, gently domed cab roof and visible cream band across the nose.
    add(G.box(1.02, .16, 1.24, .079, 2), C.red, .77, 1.8, 0);
    add(G.box(.095, .09, 1.13, .035), C.red, 1.2, 1.681, 0, 0, 0, -.2);
    add(G.box(.065, .39, 1.25, .08, 2), C.red, 1.322, .8, 0);
    add(G.box(.018, .1, 1.23, .02), C.cream, 1.361, .84, 0);
    add(G.box(.1, .68, 1.22, .045), C.redD, .3, 1.32, 0);
    for (const sz of [-1, 1]) {
      tube([1.335, 1.0, sz * .575], [1.17, 1.705, sz * .552], .052, C.red, 9);
      add(G.box(.87, .075, .025, .012), C.cream, .8, .85, sz * .668);
      add(G.box(.14, .035, .035, .012), C.dark, .47, 1.03, sz * .675);
      // Rounded warm-brown mirrors, distinct from the pale glass.
      tube([1.19, 1.16, sz * .65], [1.32, 1.12, sz * .8], .025, C.dark, 7);
      add(G.box(.11, .23, .14, .045, 2), C.dark, 1.32, 1.13, sz * .81);
      add(G.box(.025, .17, .1, .03), C.silverD, 1.38, 1.13, sz * .81);
    }
    // Actual open cabin: floor, separate seats, dashboard, steering wheel.
    add(G.box(.88, .065, 1.02, .03), C.dark, .78, .972, 0);
    for (const sz of [-1, 1]) {
      add(G.box(.31, .1, .34, .055), C.seat, .61, 1.055, sz * .29);
      add(G.box(.11, .4, .35, .055), C.seat, .46, 1.24, sz * .29, 0, 0, .1);
      add(G.box(.1, .12, .23, .035), C.seat, .45, 1.48, sz * .29);
    }
    add(G.box(.22, .14, 1.04, .045), C.dash, 1.13, 1.12, 0);
    add(G.box(.05, .085, .28, .015), C.cream, 1.245, 1.19, -.24, 0, 0, .2);
    for (const z of [-.33, -.22]) add(G.sph(.027, 8, 6), C.cream, 1.274, 1.195, z, 0, 0, 0, [.3, 1, 1]);
    add(G.tor(.11, .02, PI * 2, 6, 20), C.dark, 1.02, 1.29, -.29, 0, HP, -.4);
    tube([1.12, 1.16, -.29], [1.02, 1.29, -.29], .022, C.silverD, 7);
    // Two wipers rest on the lower edge; no painted reflections hide the seats.
    for (const z of [-.3, .26]) { add(G.box(.025, .025, .34, .008), C.dark, 1.372, 1.06, z, .12, 0, 0); add(G.sph(.025, 8, 6), C.dark, 1.375, 1.065, z - .12); }
    // Chunky bumper, separate grille, round lamps in deep cream rings.
    add(G.box(.22, .22, 1.46, .1, 2), C.silverD, 1.36, .32, 0);
    add(G.box(.045, .29, .52, .045), C.silver, 1.374, .66, 0);
    for (let k = 0; k < 4; k++) add(G.box(.02, .027, .4, .01), C.dark, 1.404, .56 + k * .065, 0);
    for (const sz of [-1, 1]) {
      add(G.cyl(.143, .143, .045, 22), C.dark, 1.369, .71, sz * .43, 0, 0, HP);
      add(G.tor(.121, .024, PI * 2, 7, 22), C.cream, 1.401, .71, sz * .43, 0, HP, 0);
      add(G.sph(.11, 16, 10), C.cream, 1.399, .71, sz * .43, 0, 0, 0, [.34, 1, 1]);
      add(G.box(.025, .07, .15, .024), C.brass, 1.476, .35, sz * .5);
    }
  }));
  // Side windows are the exact rounded hole shape. Transparency leaves all
  // seats / wheel visible instead of printing them on an opaque blue square.
  const sideGlass = slab(rr(.42, 1.09, .69, .59, .13), .012, .006);
  for (const sz of [-1, 1]) {
    const pane = mesh(sideGlass, mat(C.glass, { opacity: .32, rough: .7, rim: 0 }));
    pane.position.z = sz * .654; pane.castShadow = false; g.add(pane);
  }
  const wind = slab(rr(-.56, -.31, 1.12, .62, .145), .012, .006), a = wind.attributes.position;
  for (let i = 0; i < a.count; i++) { const u = a.getX(i), v = a.getY(i), d = a.getZ(i); a.setXYZ(i, 1.325 - (v + .31) * .23 - .045 * (u / .56) ** 2 + d, v + 1.36, u); }
  wind.computeVertexNormals();
  const pane = mesh(wind, mat(C.glass, { opacity: .34, rough: .7, rim: 0, side: THREE.DoubleSide })); pane.castShadow = false; g.add(pane);
}
function ladder(g) {
  g.add(mc('gpt-ft2-ladder', ({ add }) => {
    for (const z of [-.26, .26]) add(G.box(1.57, .095, .095, .035), C.silverD, -.44, 1.86, z);
    for (const z of [-.255, .255]) add(G.box(1.51, .045, .055, .02), C.silver, -.44, 1.925, z);
    for (let k = 0; k < 8; k++) add(G.cyl(.027, .027, .49, 8), C.silver, -1.12 + k * .19, 1.87, 0, HP, 0, 0);
  }));
}
function hose(g) {
  g.add(mc('gpt-ft2-hose-reel', ({ add, tube }) => {
    // Strong spool in its own open framed bay, matching the chosen concept.
    add(G.cyl(.235, .235, .035, 22), C.redD, -.175, 1.245, .36, HP, 0, 0);
    // Front flange is an open ring, so the cream hose is visible at once.
    add(G.tor(.213, .025, PI * 2, 6, 24), C.redD, -.175, 1.245, .647);
    add(G.cyl(.183, .183, .23, 22), C.hose, -.175, 1.245, .495, HP, 0, 0);
    for (const z of [.414, .465, .516, .567]) add(G.tor(.185, .026, PI * 2, 5, 18), C.cream, -.175, 1.245, z);
    for (const r of [.075, .115, .155, .185]) add(G.tor(r, .014, PI * 2, 5, 18), C.cream, -.175, 1.245, .628);
    add(G.cyl(.065, .065, .08, 14), C.dark, -.175, 1.245, .687, HP, 0, 0);
    tube([.025, 1.29, .625], [.13, 1.13, .65], .035, C.hose, 7);
    tube([.13, 1.13, .65], [.13, .94, .65], .035, C.hose, 7);
    add(G.cyl(.055, .04, .17, 12), C.brass, .13, .89, .65);
    add(G.box(.095, .055, .1, .02), C.dark, .13, .99, .65);
  }));
}
function beacon(g) {
  g.add(mc('gpt-ft2-beacon', ({ add }) => {
    add(G.cyl(.16, .18, .07, 20), C.dark, .83, 1.929, 0);
    add(G.dome ? G.dome(.145, 20, 8) : new THREE.SphereGeometry(.145, 20, 8, 0, PI * 2, 0, HP), C.light, .83, 1.96, 0);
    add(G.sph(.043, 10, 6), '#f6a18b', .875, 2.045, .08, 0, 0, 0, [.75, .7, .35]);
  }));
}
function lockerFace(sz) {
  return mc('gpt-ft2-locker-face-' + sz, ({ add }) => {
    add(G.box(.7, .635, .042, .023), C.silver, 0, 0, 0);
    for (let k = 0; k < 7; k++) add(G.box(.65, .015, .016, .005), C.silverD, 0, -.265 + k * .083, sz * .027);
    add(G.box(.2, .04, .045, .012), C.dark, 0, -.23, sz * .044);
  });
}

B.gpt_firetruck2 = f => {
  // fitParts uses one static box per furniture. The beacon at the centre of
  // the roof must not fill the empty air beside the mirrors and falsely stop
  // the station's high rolling shutter. The occupied lower body is the box.
  f.collideBox = [-1.36, .01, -.71, 1.45, 1.5, .71];
  const body = grp(); chassis(body); cab(body); wheelPair(body, 'rear', WX[0]); wheelPair(body, 'front', WX[1]); fenders(body); ladder(body); hose(body); beacon(body); f.add(body);
  for (const [idx, sz] of [[0, 1], [1, -1]]) {
    const slats = [], N = 8, sh = .64 / N, Y0 = .86, Y1 = 1.50;
    for (let k = 0; k < N; k++) {
      const p = grp(); p.add(mc('gpt-ft2-moving-slat-' + sz + '-' + (k === 0 ? 'handle' : 'plain'), ({ add }) => {
        add(G.box(.7, sh - .008, .038, .012), C.silver, 0, 0, 0);
        add(G.box(.65, .011, .014, .004), C.silverD, 0, -sh / 2 + .012, sz * .026);
        if (!k) add(G.box(.2, .035, .04, .012), C.dark, 0, -.015, sz * .045);
      })); f.add(p); slats.push(p);
    }
    const part = f.part('curtain', slats, t => slats.forEach((g, k) => {
      const y = Y0 + (k + .5) * sh + .67 * t;
      if (y <= Y1) { g.visible = true; g.position.set(-.885, y, sz * .677); g.rotation.x = 0; }
      else {
        const a = (y - Y1) / .075, q = a - HP;
        g.visible = a < PI * 1.6;
        // Enter at the bottom of the drum, then stay above the aperture. A
        // rolled slat must never hang down in front of the helmet shelf.
        g.position.set(-.885, Y1 + .075 + Math.sin(q) * .075, sz * (.677 - Math.cos(q) * .075));
        g.rotation.x = -sz * a;
      }
    }), { label: idx ? '소방차 오른쪽 수납함' : '소방차 왼쪽 수납함', sfx: 'open_metal', dur: .45 });
    // The aisle-side compartment remains reachable under the station's loft.
    // Its padlock faces outwards on the real rolling door.
    if (idx) {
      const mount = grp(); put(mount, .22, 0, -.065, 0, PI, 0); slats[0].add(mount);
      part.lockable = true; part.lockKind = 'pad';
      part.lockAt = { x: 0, y: 0, z: 0, parent: mount }; f.lockAt = part.lockAt;
    }
    const s = f.spot('inside', null, -.72, .918, sz * .52, { part, maxH: .4, label: idx ? '소방차 오른쪽 수납함 안' : '소방차 왼쪽 수납함 안', scale: .95 });
    // The near tray slides straight out; the aisle-side loading shelf swings
    // forward and down so its real contents clear the station's upper floor.
    if (!idx) {
      const tray = f.pullOut(part, s, .82, { w: .28, d: .26, color: C.silverD });
      (f.live ||= []).push(tray);
    } else {
      const tray = grp(); tray.position.copy(s.anchor.position); f.add(tray);
      s.anchor.parent.remove(s.anchor); s.anchor.position.set(0, .012, 0); tray.add(s.anchor);
      tray.add(mc('gpt-ft2-far-tray', ({ add }) => add(G.box(.28, .02, .26, .008), C.silverD, 0, 0, 0)));
      // A swing-down loading shelf comes out into the open aisle. Two actual
      // hinged stays support it; it never passes through the truck's side.
      const links = [-.11, .11].map(dx => {
        const link = grp(); put(link, -.72 + dx, .895, -.68); f.add(link);
        link.add(mc('gpt-ft2-loading-shelf-stay', ({ add }) => add(G.cyl(.016, .016, 1, 8), C.silverD, 0, .5, 0)));
        link.userData.base = { p: link.position.clone(), r: link.rotation.clone(), s: link.scale.clone() };
        return link;
      });
      part.pivots = [...part.pivots, ...links];
      const x0 = tray.position.x, y0 = tray.position.y, z0 = tray.position.z, apply = part.apply, v = new THREE.Vector3();
      part.apply = (t, ...base) => {
        apply(t, ...base); tray.position.set(x0 + .7 * t, y0 - .35 * t, z0 - .47 * t);
        v.set(tray.position.x + .72, tray.position.y - .018 - .895, tray.position.z + .68);
        const length = v.length(); v.normalize();
        for (const link of links) {
          link.visible = t > .01; link.scale.y = length;
          link.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
        }
      };
      (f.live ||= []).push(tray);
    }
    part.setOpen(0);
  }
  f.spot('on', null, .69, 1.115, .29, { maxH: .3, label: '소방차 조수석', scale: .85 });
  f.spot('behind', null, -1.4, .04, -.1, { maxH: .35, label: '소방차 뒤 범퍼', scale: .85 });
};

// Kit runtime applies K.scale=1.35: raw .501m -> assembled .677m wide.
const MINI = .17;
const pieces = {
  chassis: { name: '소방차 몸통', color: C.red, joint: [-.45, 1, 0], nub: [[-1.1, 1.6, .65], [0, 0, 1]], build(g) { chassis(g, true); fenders(g); } },
  wheelsB: { name: '소방차 뒷바퀴', color: C.tyre, joint: [WX[0], .36, 0], nub: [[WX[0], .68, .7], [0, 1, 0]], build(g) { wheelPair(g, 'rear', WX[0]); } },
  wheelsF: { name: '소방차 앞바퀴', color: C.tyre, joint: [WX[1], .36, 0], nub: [[WX[1], .68, .7], [0, 1, 0]], build(g) { wheelPair(g, 'front', WX[1]); } },
  cab: { name: '소방차 운전석', color: C.red, joint: [.8, 1.25, 0], nub: [[.8, 1.87, 0], [0, 1, 0]], build: cab },
  ladder: { name: '소방차 사다리', color: C.silver, joint: [-.44, 1.86, 0], nub: [[-.44, 1.9, .26], [0, 0, 1]], build: ladder },
  cannon: { name: '소방차 호스 릴', color: C.hose, joint: [-.175, 1.245, .5], nub: [[-.175, 1.45, .65], [0, 0, 1]], build: hose },
  light: { name: '소방차 경광등', color: C.light, joint: [.83, 1.96, 0], nub: [[.83, 2.09, 0], [0, 1, 0]], build: beacon },
};
const miniParts = Object.fromEntries(Object.entries(pieces).map(([key, p]) => [key, {
  ...p, joint: p.joint.map(x => x * MINI), nub: [p.nub[0].map(x => x * MINI), p.nub[1]],
  build(g) { const q = grp(); p.build(q); q.scale.setScalar(MINI); g.add(q); },
}]));

export const GPT_FIRETRUCK2_KIT = {
  id: 'gptfiretruck2', name: '몽글 미니 소방차', furn: 'gpt_kitfiretruck2', type: 'model', skin: 'runner', intro: 'box',
  parts: miniParts, order: ['chassis', 'wheelsB', 'wheelsF', 'cab', 'ladder', 'cannon', 'light'], locked: 'light',
  build: { ordered: true, glow: true, ghost: false }, scale: 1.35, runner: '#efc7b2', color: C.red, lid: 'kraft',
  short: { chassis: '몸통', wheelsB: '뒷바퀴', wheelsF: '앞바퀴', cab: '운전석', ladder: '사다리', cannon: '호스 릴', light: '경광등' },
  frame: { areas: ['chassis chassis cab cannon light', 'wheelsB wheelsF ladder ladder ladder'], cols: [1, 1, 1, .8, .8] },
};
B.gpt_kitfiretruck2 = f => {
  f.add(mc('gpt-ft2-mini-stand', ({ add }) => {
    add(G.box(.88, .075, .65, .07), '#eaa440', 0, .05, 0);
    add(G.box(.82, .025, .59, .05), C.cream, 0, .1, 0);
  }));
  const model = grp(); for (const key of GPT_FIRETRUCK2_KIT.order) miniParts[key].build(model);
  model.position.y = .115; f.add(model);
};
export const GPT_FIRETRUCK2_BUILDERS = B;
export const GPT_FIRETRUCK2_INFO = {
  gpt_firetruck2: { w: 3, d: 2, name: '몽글 꼬마 소방차', price: 0, hidden: true },
  gpt_kitfiretruck2: { w: 1, d: 1, name: '몽글 미니 소방차', price: 0, hidden: true },
};

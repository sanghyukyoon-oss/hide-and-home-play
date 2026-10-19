// 이어진 집 (10/19, user: "맵 구조도 더 아트적이고 재미있게… 도르레도 있는데 잘 써먹지도 못하는거같아 유기적으로"): pieces
// that join one floor to another, so a house reads as one playful machine instead of rooms stacked on a grid.
//   tubeslide — a yellow slide from a balcony's rail gap down to the floor below (footprint 1 × 2, its top lip at the
//               upper floor's front edge, local z −1, FLOOR_H up); a spot under its high end
//   ballpit   — a low rimmed pit of coloured balls (2 × 2) where a slide lands; things hide among the balls
//   loftpole  — a brass pole from the floor up through hatches to a loft, a cushion at its foot (the fire station's
//               one-storey 'firepole' is town-props')
import * as THREE from 'three';
import { put } from './kit.js';
import { HG as G, hmc as mc, FLOOR_H } from './house-props.js';

const B = {};
const SLIDE_Y = '#ffcf3a', SLIDE_IN = '#ffe27a', POST = '#fff3e2';

// a trough along a path: half-circle cross-section opening upward, inner + outer skin and the two rims
function troughGeo(pts, R = .27, th = .045, seg = 28, n = 10) {
  const curve = new THREE.CatmullRomCurve3(pts), P = curve.getSpacedPoints(seg), S = new THREE.Vector3(1, 0, 0);
  const pos = [], idx = [], T = new THREE.Vector3(), U = new THREE.Vector3();
  const ring = (k, r) => {
    const t = Math.min(seg, k); curve.getTangentAt(t / seg, T); U.crossVectors(T, S).normalize(); if (U.y < 0) U.negate();
    const out = [];
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI; out.push(P[k].clone().addScaledVector(S, Math.cos(a) * r).addScaledVector(U, -Math.sin(a) * r + R * .25)); }
    return out;
  };
  const rings = P.map((_, k) => [ring(k, R), ring(k, R + th)]);
  const vid = (k, layer, i) => (k * 2 + layer) * (n + 1) + i;
  for (const [a, b] of rings) for (const v of [...a, ...b]) pos.push(v.x, v.y, v.z);
  for (let k = 0; k < P.length - 1; k++) for (let i = 0; i < n; i++) {
    for (const L of [0, 1]) {   // inner skin faces up/in, outer skin faces down/out
      const a = vid(k, L, i), b = vid(k, L, i + 1), c = vid(k + 1, L, i + 1), d = vid(k + 1, L, i);
      if (L === 0) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d);
    }
  }
  for (let k = 0; k < P.length - 1; k++) for (const i of [0, n]) {   // the rims: inner edge to outer edge
    const a = vid(k, 0, i), b = vid(k, 1, i), c = vid(k + 1, 1, i), d = vid(k + 1, 0, i);
    if (i === 0) idx.push(a, b, c, a, c, d); else idx.push(a, d, c, a, c, b);
  }
  for (const k of [0, P.length - 1]) for (let i = 0; i < n; i++) {   // the two open ends
    const a = vid(k, 0, i), b = vid(k, 0, i + 1), c = vid(k, 1, i + 1), d = vid(k, 1, i);
    if (k === 0) idx.push(a, b, c, a, c, d); else idx.push(a, d, c, a, c, b);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

B.tubeslide = (f) => {
  const H = FLOOR_H;
  // the lip sits just inside the balcony's rail gap, then a steep middle, then a run-out over the pit's rim
  // (10/19 user, phone: "스테이지 7에서 미끄럼틀 벽에 막혀 있다" — the trough hangs ~.25 below its path, so the top third ran
  // inside the balcony's slab (front edge at z −.75, top H − .02) and the run-out through the pit's rim (top .4): measured,
  // 겹침 QA. Now the trough rests on the balcony floor, clears the slab's edge, then dives; the legs follow the curve)
  const path = [new THREE.Vector3(0, H + .3, -1.32), new THREE.Vector3(0, H + .31, -1.0), new THREE.Vector3(0, H + .29, -.7),
    new THREE.Vector3(0, H * .52, .05), new THREE.Vector3(0, .8, .8), new THREE.Vector3(0, .7, 1.25)];
  const curve = new THREE.CatmullRomCurve3(path), under = z => { let b = null; for (let i = 0; i <= 80; i++) { const p = curve.getPoint(i / 80); if (!b || Math.abs(p.z - z) < Math.abs(b.z - z)) b = p; } return b.y - .24; };
  f.add(mc('tubeslide|' + H, ({ addM, add }) => {
    addM(troughGeo(path), new THREE.Matrix4(), SLIDE_Y);
    addM(troughGeo(path, .225, .012), new THREE.Matrix4().makeTranslation(0, .004, 0), SLIDE_IN);
    // two white legs under the steep part and a little foot under the run-out
    for (const z of [-.5, .2]) { const top = under(z); add(G.cyl(.04, .05, top, 10), POST, .2, top / 2, z); add(G.cyl(.04, .05, top, 10), POST, -.2, top / 2, z); add(G.box(.5, .05, .07, .02), POST, 0, top - .05, z); }
    { const top = under(.84); add(G.cyl(.05, .06, top, 10), POST, 0, top / 2, .84); }   // (in front of the pit's rim, not on it)
  }));
  f.spot('under', null, 0, 0, -.55, { maxH: .8, label: '미끄럼틀 밑', scale: .9 });
};

B.ballpit = (f) => {
  const C = ['#ff6b8a', '#ffd23f', '#5fc4f0', '#7fdc8a', '#ffffff', '#b99cff'];
  f.add(mc('ballpit', ({ add }) => {
    const h = .34, t = .12;
    for (const [x, z, w, d] of [[0, -.94, 2, t], [0, .94, 2, t], [-.94, 0, t, 1.76], [.94, 0, t, 1.76]]) {
      add(G.box(w, h, d, .04), '#7fc8f0', x, h / 2, z); add(G.box(w + .02, .06, d + .02, .025), '#ffffff', x, h + .02, z);
    }
    add(G.box(1.8, .04, 1.8, .01), '#5aa9d6', 0, .02, 0);
    let s = 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 64; i++) { const r = .085 + R() * .02; add(G.sph(r, 9, 7), C[i % C.length], (R() - .5) * 1.66, .1 + R() * .17, (R() - .5) * 1.66); }
  }));
  for (const [x, z] of [[-.45, -.4], [.5, .3], [-.3, .5]]) f.spot('in', null, x, .26, z, { maxH: .3, label: '공 속', scale: .85 });
};

// a brass fire pole from the floor up through a hatch to a loft (o.h: how high it reaches, default a floor and a loft
// above); a red landing cushion at its foot, collars where it passes each floor
B.loftpole = (f, T, o = {}) => {
  const H = o.h ?? FLOOR_H + 1.45 + 1.1, BRASS = '#ffd84a', BRASS_D = '#e0a92e';
  f.add(mc('loftpole|' + H, ({ add }) => {
    add(G.cyl(.068, .068, H, 16), BRASS, 0, H / 2, 0);
    add(G.sph(.1, 14, 10), BRASS_D, 0, H, 0);
    for (const y of [FLOOR_H + .03, FLOOR_H + 1.48]) if (y < H - .1) add(G.cyl(.11, .11, .06, 16), BRASS_D, 0, y, 0);
    add(G.cyl(.36, .38, .1, 24), '#ff6b6b', 0, .05, 0); add(G.tor(.36, .035, Math.PI * 2, 6, 24), '#ffffff', 0, .1, 0, Math.PI / 2, 0, 0);
  }));
  f.spot('base', null, .22, .1, .2, { maxH: .3, label: '소방봉 쿠션 위', scale: .8 });
};

export const ORGANIC_BUILDERS = B;
export const ORGANIC_INFO = {
  tubeslide: { w: 1, d: 2, name: '미끄럼틀', price: 0, hidden: true },
  ballpit: { w: 2, d: 2, name: '볼풀', price: 0, hidden: true },
  loftpole: { w: 1, d: 1, name: '소방봉', price: 0, hidden: true },   // ('firepole' is the fire station's own)
};

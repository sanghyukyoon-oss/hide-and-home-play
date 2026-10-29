// 곰돌이 빵 굽는 부엌 (6판 bearbakery, 10/20 — 사용자 "그냥 보기에 ㅈㄴ 이쁘면 됨"; GPT 컨셉 bearbakery-a·b): a little bakery
// kitchen — a red-brick dome oven with its fire and a tiled hob where the pancakes cook (type 'stove': 6판's pancake smoke
// rises from it), a tall honey bread cabinet with paned doors that locks (the key lesson), a sage work counter with dough and a
// rolling pin, a sink with a dish rack, a peninsula counter with a bun stand and a baguette basket, a café table in red
// gingham with two stools, bread baskets, flour sacks, a jar shelf, a pan rail, a gingham-curtained window and a chalk menu.
// Same contract as house-props.js: origin = footprint centre on the floor, the piece faces +z, back toward -z, 1 tile = 1;
// wall pieces hang on a wall's inner face. Static decor is ONE vertex-coloured mesh per piece (hmc); cloth that carries a
// print (gingham, bricks) is a planar-mapped textured mesh; every moving part its own mesh. Nothing here is sold (hidden).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, mat, mesh, geo, canvasTex, texCache, shade, cutFace, liner, minusRect, windowFace } from './kit.js';
import { clothBend, clothWave, clothSlab } from './clothbend.js';
import { HG as G, hxf as xf, hmc as mc, hleaves as leaves } from './house-props.js';
import { textTex, fitText } from './gpt-paper.js';

const PI = Math.PI, HP = PI / 2;
const K = { wood: '#efc07f', woodD: '#c4874d', body: '#fffaf0', sage: '#a9c9a0', sage2: '#8fb787', brick: '#d97a5c', brick2: '#b95f45',
  cloth: '#e8574a', top: '#f6dfb6', accent3: '#ffd25c' };
const col = (T, k) => (T && T[k]) || K[k];
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', SKY2 = '#d9f1fb', HONEY = '#ffcf5c', LEAF = '#6cc46a', LEAF2 = '#4ea85a',
  LEAF3 = '#8fd47a', BRASS = '#e8b84a', COPPER = '#e08a5a', IRON = '#4a4458', STEEL = '#c9cfe0', SOIL = '#8a5a3c', WICKER = '#e3b27a',
  WICKER2 = '#c98f52', CRUST = '#d9893c', CRUST2 = '#b8692c', CRUMB = '#ffe2a8', FLOUR = '#fffaf0', BURLAP = '#e9d2a6', BURLAP2 = '#cfb17e',
  JAM = '#e0455a', BERRY = '#9b3b6b', FIRE = '#ff8a3c', FIRE2 = '#ffd25c', CHALK = '#3f4a46', BEAR = '#c98a52';
const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

// ── prints: red gingham, bricks (canvas, mapped in world units) ──────────────────────────────────────────────────────
const TEX = texCache();
function gingham(c = '#e8574a') {
  return TEX.get('g' + c, () => { const t = canvasTex(128, 128, (x, W) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, W); x.globalAlpha = .55; x.fillStyle = c;
    for (let i = 0; i < 4; i++) { x.fillRect(i * 32, 0, 16, W); x.fillRect(0, i * 32, W, 16); }
    x.globalAlpha = 1; x.fillStyle = c; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) x.fillRect(i * 32, j * 32, 16, 16);
  }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; });
}
// a cloth lying over something (⑥ 10/23 31~70판 훑기 "판자 같은 천"): a thin sheet w × d whose height is h(x, z) — a dome over what
// it covers, edges that droop, small folds — instead of a flat board
function drape(w, d, h, t = .012) {
  const g = new THREE.BoxGeometry(w, t, d, 16, 1, 14), q = g.attributes.position;
  for (let i = 0; i < q.count; i++) q.setY(i, q.getY(i) + h(q.getX(i), q.getZ(i)));
  g.computeVertexNormals(); return g;
}
function bricks(a, b) {
  return TEX.get('b' + a + b, () => { const t = canvasTex(256, 256, (x, W) => {
    x.fillStyle = '#f3e3cf'; x.fillRect(0, 0, W, W);
    for (let r = 0; r < 8; r++) for (let k = -1; k < 4; k++) { x.fillStyle = (r * 3 + k * 5) % 7 < 2 ? b : a; x.fillRect(k * 64 + (r % 2) * 32 + 3, r * 32 + 3, 58, 26); }
  }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; });
}
// box-mapped uvs in world units (s metres a repeat)
function planarUV(g, s) {
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v; if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else { u = ax >= az ? p.getZ(i) : p.getX(i); v = p.getY(i); }
    uv[i * 2] = u / s; uv[i * 2 + 1] = v / s;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}
// one textured mesh from many pieces: fn({ add(geometry, x, y, z, rx, ry, rz, s) }), uvs planar in world units
function pm(key, m, s, fn) {
  const g = geo('bbpm|' + key, () => {
    const list = [];
    const add = (src, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sc = 1) => {
      const c = src.index ? src.toNonIndexed() : src.clone();
      for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal') c.deleteAttribute(k);
      c.applyMatrix4(xf(x, y, z, rx, ry, rz, sc)); list.push(planarUV(c, s));
    };
    fn({ add });
    const out = mergeGeometries(list, false); out.name = key; return out;
  });
  return mesh(g, m);
}

// breads (into an mc): a round bun, a baguette, a croissant, a loaf
function bread(add, kind, x, y, z, ry = 0, s = 1) {
  const M = xf(x, y, z, 0, ry, 0, s), A = (g, c, px, py, pz, rx = 0, r2 = 0, rz = 0, sc = 1) => add(g, c, 0, 0, 0, 0, 0, 0, 1, M.clone().multiply(xf(px, py, pz, rx, r2, rz, sc)));
  if (kind === 'bun') { A(G.sph(.075, 12, 8), CRUST, 0, .03, 0, 0, 0, 0, [1, .62, 1]); A(G.sph(.05, 10, 6), shade(CRUST, .12), 0, .055, 0, 0, 0, 0, [1, .3, 1]); }
  else if (kind === 'baguette') { A(G.cap(.045, .4, 3, 10), CRUST, 0, .045, 0, 0, 0, HP, [1, 1, .85]); for (let k = -1; k <= 1; k++) A(G.box(.06, .012, .02, .006), CRUMB, k * .12, .085, 0, 0, .5, 0); }
  else if (kind === 'croissant') { A(G.tor(.06, .035, PI * 1.25, 8, 14), CRUST, 0, .03, 0, HP, 0, -PI * .12, [1, 1, .8]); A(G.sph(.04, 10, 6), CRUST2, 0, .035, -.06, 0, 0, 0, [1.3, .75, 1]); }
  else { A(G.box(.24, .12, .14, .05), CRUST, 0, .06, 0); A(G.box(.2, .02, .1, .01), CRUMB, 0, .12, 0); }
}
function mcx(key, fn) {
  return mc(key, ({ add, addM, tube }) => fn({ add: (src, color, x, y, z, rx, ry, rz, s, M) => (M ? addM(src, M, color) : add(src, color, x, y, z, rx, ry, rz, s)), addM, tube }));
}
// a cupboard door that swings on its left (dir 1) or right (dir -1) edge: returns the pivot
function door(f, key, x, y, z, w, h, c, knob, dir = 1) {
  const pv = new THREE.Group(); put(pv, x - dir * w / 2, y, z);
  pv.add(mc(key, ({ add }) => {
    add(G.box(w - .01, h, .03, .012), c, dir * w / 2, 0, .015);
    add(G.box(w - .1, h - .1, .012, .006), shade(c, .07), dir * w / 2, 0, .034);
    add(G.sph(.022, 10, 8), knob, dir * (w - .07), 0, .05);
  }));
  f.add(pv); return pv;
}
function drawer(f, key, x, y, z, w, h, c, knob, inner) {
  const pv = new THREE.Group(); put(pv, x, y, z);
  pv.add(mc(key, ({ add }) => {
    add(G.box(w - .01, h, .03, .012), c, 0, 0, .015); add(G.box(w - .1, h - .07, .012, .006), shade(c, .07), 0, 0, .034);
    add(G.cap(.012, .08, 2, 6), knob, 0, 0, .05, 0, 0, HP);
    add(G.pbox(w - .06, .015, .4), inner, 0, -h / 2 + .02, -.2);
    for (const sx of [-1, 1]) add(G.pbox(.015, h - .04, .4), inner, sx * (w / 2 - .04), 0, -.2);
    add(G.pbox(w - .06, h - .04, .015), inner, 0, 0, -.4);
  }));
  f.add(pv); return pv;
}

const B = {};

// 벽돌 화덕 (2×1, type 'stove'): a red-brick dome oven on a brick base — its arched mouth glowing, two loaves on a peel inside,
// a black chimney pipe up to the ceiling, a firewood niche below; at its right a tiled hob with a cast-iron griddle of
// pancakes (butter, syrup) and a copper kettle, a sage cupboard under it.
B.stove = (f, T) => {
  const brick = col(T, 'brick'), brick2 = col(T, 'brick2'), sage = col(T, 'sage'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), body = col(T, 'body'), top = col(T, 'top');
  const tk = [brick, brick2, sage, wood, woodD, body, top].join(',');
  const OX = -.32, BW = 1.3, BH = .62, BD = .86, R = .56, z0 = -.04;
  const bm = mat('#ffffff', { map: bricks(brick, brick2), rough: .9, rim: .12 });
  // the oven's porch: an arched brick front standing out of the dome, its mouth open
  const MZ = z0 + BD / 2 + .1, AR = .22, AY = .1;
  const po = new THREE.Shape(); po.moveTo(-.36, 0); po.lineTo(.36, 0); po.lineTo(.36, AY + .04); po.absarc(0, AY + .04, .36, 0, PI, false); po.lineTo(-.36, 0);
  const ho = new THREE.Path(); ho.moveTo(-AR, 0); ho.lineTo(AR, 0); ho.lineTo(AR, AY); ho.absarc(0, AY, AR, 0, PI, false); ho.lineTo(-AR, 0); po.holes.push(ho);
  f.add(pm('stove-brick|' + tk, bm, .5, ({ add }) => {
    add(G.box(BW, BH - .34, BD, .03), OX, .34 + (BH - .34) / 2, z0);   // the hearth, over a niche for the firewood
    for (const sx of [-1, 1]) add(G.box(.16, .35, BD, .02), OX + sx * (BW / 2 - .08), .175, z0);
    add(G.box(BW - .3, .35, .08, .01), OX, .175, z0 - BD / 2 + .04);
    add(new THREE.SphereGeometry(R, 22, 10, 0, PI * 2, 0, HP), OX, BH, z0 - .02, 0, 0, 0, [1, .92, 1]);
    add(G.ext(po, .3, 0, 14), OX, BH, MZ - .3);
  }));
  f.add(mcx('stove|' + tk, ({ add, tube }) => {
    // the mouth: a cream stone arch, the dark inside, logs, a peel with a loaf and a bun on the ledge
    add(G.tor(AR + .04, .045, PI, 8, 20), CREAM, OX, BH + AY, MZ + .01);
    for (const sx of [-1, 1]) add(G.box(.09, AY, .09, .02), CREAM, OX + sx * (AR + .04), BH + AY / 2, MZ + .01);
    const ms = new THREE.Shape(); ms.moveTo(-AR, 0); ms.lineTo(AR, 0); ms.lineTo(AR, AY); ms.absarc(0, AY, AR, 0, PI, false); ms.lineTo(-AR, 0);
    add(G.ext(ms, .02, 0, 12), '#3b2730', OX, BH, MZ - .28);
    for (const [x, rz] of [[-.08, .3], [.06, -.25], [0, 0]]) add(G.cyl(.028, .028, .24, 8), SOIL, OX + x, BH + .04, MZ - .18, HP, rz, 0);
    add(G.box(BW + .06, .06, .14, .02), CREAM, OX, BH, MZ + .02);   // the ledge in front of the mouth
    add(G.box(.3, .015, .28, .006), wood, OX + .02, BH + .035, MZ - .02);
    add(G.box(.05, .015, .22, .006), woodD, OX + .1, BH + .035, MZ + .14, 0, -.25, 0);
    bread(add, 'loaf', OX - .04, BH + .045, MZ - .04, .2, .75); bread(add, 'bun', OX + .08, BH + .045, MZ + .05, 0, .9);
    // the chimney pipe and its collar, a little copper band
    add(G.cyl(.09, .1, .1, 14), IRON, OX, BH + R * .92 - .02, z0 - .02);
    add(G.cyl(.075, .075, 2.95 - BH - R * .9, 14), IRON, OX, (2.95 + BH + R * .9) / 2, z0 - .02);
    add(G.cyl(.085, .085, .06, 14), COPPER, OX, 2.05, z0 - .02);
    // the firewood niche under the hearth: a dark inside, logs stacked at the left, room at the right
    add(G.pbox(BW - .3, .33, .01), '#5a3a34', OX, .17, z0 - BD / 2 + .085);
    add(G.pbox(BW - .3, .01, BD - .1), '#6a4a40', OX, .005, z0);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 3 - r; k++) { const x = OX - .38 + k * .14 + r * .07, y = .07 + r * .12;
      add(G.cyl(.06, .06, .3, 10), shade(SOIL, (k + r) % 2 ? .06 : 0), x, y, z0 + .12, HP, 0, 0); add(G.cyl(.046, .046, .01, 10), '#f2cf9a', x, y, z0 + .272, HP, 0, 0); }
    // the hob at the right: a cream-tiled body, a honey top, the griddle of pancakes, a copper kettle
    const HX = .66, HW = .66, HT = .86;
    add(cutFace(G.box(HW, HT - .05, .62, .02), 'z'), body, HX, (HT - .05) / 2, -.1);
    add(windowFace(HW - .04, HT - .09, [-.2, .2, -.185, .205]), body, HX, (HT - .05) / 2, .21);
    add(liner(.4, .39, .56, 'z'), shade(body, -.16), HX, .415, -.09);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) for (const [a, b, c, d] of minusRect([HX - .31 + k * .21, HX - .11 + k * .21, r * .21, .2 + r * .21], [.46, .86, .22, .61])) add(G.pbox(b - a, d - c, .006), r % 2 === k % 2 ? '#e9f2e4' : WHITE, (a + b) / 2, (c + d) / 2, .215);
    add(G.box(HW + .04, .05, .66, .02), top, HX, HT - .025, -.1);
    add(G.box(.5, .02, .4, .01), IRON, HX, HT + .01, -.14);
    for (const x of [-.12, .12]) add(G.tor(.08, .008, PI * 2, 3, 20), '#8e88a8', HX + x, HT + .022, -.14, HP, 0, 0);
    add(G.cyl(.15, .15, .03, 20), IRON, HX - .1, HT + .04, -.1);
    tube([HX - .1 + .15, HT + .05, -.1], [HX + .2, HT + .07, -.02], .016, IRON, 8);
    for (let k = 0; k < 3; k++) add(G.cyl(.085 - k * .003, .085 - k * .003, .022, 18), k % 2 ? '#f3b85e' : '#e9a24c', HX - .1, HT + .065 + k * .022, -.1);
    add(G.box(.04, .025, .04, .006), '#fff3b0', HX - .1, HT + .135, -.1);
    add(G.sph(.06, 12, 8), '#b9692c', HX - .08, HT + .121, -.1, 0, 0, 0, [1.3, .12, 1.1]);
    add(lathe([[0, 0], [.07, 0], [.08, .05], [.07, .11], [.04, .14], [0, .145]], 14), COPPER, HX + .14, HT + .03, -.24);
    tube([HX + .19, HT + .08, -.24], [HX + .25, HT + .14, -.22], .012, COPPER, 6);
    add(G.tor(.045, .01, PI, 4, 10), IRON, HX + .14, HT + .18, -.24, 0, HP, 0);
  }));
  // the hob's cupboard (a door), the spots
  const dp = door(f, 'stove-door|' + tk, .66, .42, .21 + .015, .5, .5, sage, BRASS, -1);
  const p = f.part('door', dp, t => { dp.rotation.y = 1.7 * t; }, { label: '화구 아래 찬장', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, .62, .23, -.1, { part: p, maxH: .4, label: '화구 아래 찬장', scale: .9 }), z0 + BD / 2, { w: .26 });
  f.spot('under', null, OX + .27, .01, z0 + .14, { maxH: .28, label: '화덕 밑 장작 옆', scale: .75 });
  f.spot('on', null, .84, .86, .1, { maxH: .3, label: '팬케이크 옆', scale: .7 });
};

// 빵 진열장 (1×1, 높다): a tall honey cabinet with a scalloped crown — two paned doors (milky glass, white glints), shelves of
// bread inside, a drawer below, a gingham cloth over the top with a basket of rolls. The doors lock (the key lesson).
B.breadcab = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), sage = col(T, 'sage'), tk = [wood, woodD, sage].join(',');
  const W = .9, D = .48, z0 = -.24, H = 1.95, FZ = z0 + D / 2, S1 = .62, S2 = 1.08, S3 = 1.5, DY0 = .52 + (H - .62) / 2;
  f.add(mcx('breadcab|' + tk, ({ add }) => {
    add(cutFace(G.box(W, H, D, .03), 'z'), wood, 0, H / 2, z0);
    add(windowFace(W - .06, H - .06, [-.4, .4, -.435, .855]), wood, 0, H / 2, FZ);
    add(liner(.8, 1.29, .42, 'z'), shade(wood, -.15), 0, DY0, z0 + .01);
    add(G.pbox(W - .1, H - .55, .02), shade(wood, .1), 0, (H + .5) / 2, z0 - D / 2 + .04);
    add(G.box(W + .08, .08, D + .06, .02), woodD, 0, H + .02, z0);
    for (let k = 0; k < 5; k++) add(G.sph(.07, 10, 6), woodD, -.32 + k * .16, H + .05, FZ + .01, 0, 0, 0, [1, .7, .4]);
    add(G.box(W + .04, .08, D + .04, .02), woodD, 0, .04, z0);
    // inside: shelves with breads
    for (const y of [S1, S2, S3]) add(G.box(W - .08, .03, D - .08, .008), shade(wood, .06), 0, y, z0);
    const ad = (g, c, a, b, c2, d, e, ff, s, M) => add(g, c, a, b, c2, d, e, ff, s, M);
    bread(ad, 'loaf', -.18, S1 + .015, z0 - .02, .1); bread(ad, 'bun', .14, S1 + .015, z0 - .06); bread(ad, 'bun', .25, S1 + .015, z0 + .04);
    bread(ad, 'croissant', -.2, S2 + .015, z0, .3); bread(ad, 'croissant', .02, S2 + .015, z0 - .05, -.2);
    bread(ad, 'baguette', 0, S3 + .015, z0 - .04, .1, .9);
    // a gingham cloth on top (vertex stripes) and a basket of rolls on it
    add(G.box(.6, .02, .4, .01), WHITE, 0, H + .07, z0 + .02, 0, .1, 0);
    for (let k = 0; k < 5; k++) add(G.box(.6, .022, .05, .004), JAM, 0, H + .072, z0 - .15 + k * .085, 0, .1, 0);
    add(G.box(.12, .14, .02, .01), JAM, .26, H - .01, FZ + .02, 0, 0, .1);
    add(lathe([[0, 0], [.13, 0], [.16, .1], [.15, .11], [0, .1]], 16), WICKER, -.05, H + .085, z0);
    bread(ad, 'bun', -.09, H + .15, z0 - .02, 0, .9); bread(ad, 'bun', .02, H + .15, z0 + .03, 0, .9);
  }));
  // the drawer under the doors
  const dw = drawer(f, 'breadcab-dw|' + tk, 0, .3, FZ, W - .1, .3, sage, BRASS, shade(wood, -.08));
  const pd = f.part('drawer', dw, (t, b) => { dw.position.z = b.p.z + .32 * t; }, { label: '빵 진열장 서랍', sfx: 'drawer', dur: .26 });
  // (the lock is on this drawer — 35판's code lock, 레벨 10/21: the shelves behind the glass doors can't be seen into)
  pd.lockable = true; pd.lockKind = 'code'; pd.lockAt = { x: .24, y: 0, z: .06, parent: dw };
  f.spot('inside', dw, -.1, -.13, -.2, { part: pd, maxH: .22, label: '빵 진열장 서랍', scale: .85 });
  // the two paned doors (one part, lockable)
  const DH = H - .62, DY = .52 + DH / 2;
  const pane = (dir, key) => {
    const pv = new THREE.Group(); put(pv, -dir * (W / 2 - .03), DY, FZ + .005);
    pv.add(mc('breadcab-door' + key + '|' + tk, ({ add }) => {
      const w = W / 2 - .04, cx = dir * w / 2;
      add(G.box(w, DH, .03, .01), wood, cx, 0, .015);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
        const px = cx + (c - .5) * (w / 2 - .02), py = (r - 1) * (DH / 3 - .02);
        add(G.pbox(w / 2 - .07, DH / 3 - .1, .012), '#cfe6ef', px, py, .028);
      }
      add(G.cap(.012, .1, 2, 6), BRASS, dir * (w - .05), -.05, .05);
    }));
    f.add(pv); return pv;
  };
  const L = pane(1, 'l'), Rr = pane(-1, 'r');
  const p = f.part('door', [L, Rr], t => { L.rotation.y = -1.7 * t; Rr.rotation.y = 1.7 * t; }, { label: '빵 진열장 문', sfx: 'open', dur: .32 });
  f.lockAt = { x: 0, y: DY - .05, z: FZ + .08 };
  f.pullOut(p, f.spot('inside', null, -.02, S1 + .015, z0 + .1, { part: p, maxH: .36, label: '빵 진열장 아래 칸', scale: .85 }), FZ, { w: .3 });
  f.pullOut(p, f.spot('inside', null, .2, S2 + .015, z0 + .08, { part: p, maxH: .36, label: '빵 진열장 가운데 칸', scale: .85 }), FZ, { w: .3 });
  f.spot('on', null, .24, H + .09, z0 + .04, { maxH: .3, label: '빵 진열장 위', scale: .75 });
};

// 반죽대 (1×1): a sage counter — a drawer over a cupboard, a thick butcher-block top dusted with flour, a ball of dough on a
// board, a rolling pin, a cream mixing bowl with a whisk, a little flour shaker.
B.bakecounter = (f, T) => {
  const sage = col(T, 'sage'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), body = col(T, 'body'), tk = [sage, wood, woodD, body].join(',');
  const W = .96, D = .62, z0 = -.18, H = .88, FZ = z0 + D / 2;
  f.add(mcx('bakecounter|' + tk, ({ add }) => {
    add(cutFace(G.box(W - .04, H - .06, D - .04, .02), 'z'), sage, 0, (H - .06) / 2, z0);
    add(windowFace(W - .08, H - .1, [-.37, .37, -.23, .14]), sage, 0, (H - .06) / 2, z0 + D / 2 - .02);
    add(liner(.74, .37, .52, 'z'), shade(sage, -.2), 0, .365, z0 + .01);
    add(G.box(W - .1, .07, .03, .01), shade(sage, -.25), 0, .035, FZ - .01);
    add(G.box(W + .02, .08, D + .02, .02), wood, 0, H - .04, z0);
    for (let k = 0; k < 5; k++) add(G.pbox(.012, .081, D + .021), shade(wood, -.08), -.4 + k * .2, H - .04, z0);
    add(G.box(.42, .025, .3, .01), woodD, -.14, H + .012, z0 + .02, 0, .1, 0);
    for (let k = 0; k < 7; k++) add(G.sph(.03, 6, 4), FLOUR, -.3 + k * .05, H + .026, z0 + .1 - (k % 3) * .06, 0, 0, 0, [1.4, .12, 1]);
    add(G.sph(.1, 14, 10), '#fff2d6', -.16, H + .065, z0 + .02, 0, 0, 0, [1.1, .62, 1]);
    add(G.cyl(.035, .035, .34, 12), wood, .05, H + .06, z0 + .2, 0, .3, HP);
    for (const s of [-1, 1]) add(G.cyl(.015, .015, .07, 8), woodD, .05 + Math.cos(.3) * s * .2, H + .06, z0 + .2 - Math.sin(.3) * s * .2, 0, .3, HP);
    add(lathe([[0, 0], [.07, 0], [.13, .1], [.14, .12], [0, .12]], 18), CREAM, .28, H + .025, z0 - .12);
    add(G.cyl(.12, .12, .01, 16), '#fff6dc', .28, H + .12, z0 - .12);
    add(G.cyl(.008, .008, .2, 6), STEEL, .33, H + .2, z0 - .12, 0, 0, .4);
    add(G.sph(.035, 8, 6), STEEL, .29, H + .12, z0 - .12, 0, 0, .4, [1, 1.6, 1]);
    add(G.cyl(.035, .035, .1, 10), WHITE, .38, H + .05, z0 + .14); add(G.sph(.036, 10, 6), STEEL, .38, H + .1, z0 + .14, 0, 0, 0, [1, .6, 1]);
  }));
  const dw = drawer(f, 'bakecounter-dw|' + tk, 0, H - .17, FZ, W - .1, .16, shade(sage, .04), BRASS, shade(body, -.1));
  const pd = f.part('drawer', dw, (t, b) => { dw.position.z = b.p.z + .32 * t; }, { label: '반죽대 서랍', sfx: 'drawer', dur: .26 });
  f.spot('inside', dw, -.12, -.06, -.2, { part: pd, maxH: .12, label: '반죽대 서랍', scale: .8 });
  const dp = door(f, 'bakecounter-door|' + tk, 0, .37, FZ + .002, W - .1, .5, sage, BRASS, 1);
  const p = f.part('door', dp, t => { dp.rotation.y = -1.6 * t; }, { label: '반죽대 찬장', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, .05, .19, z0 + .04, { part: p, maxH: .4, label: '반죽대 찬장', scale: .9 }), FZ);
  f.spot('on', null, .14, H + .005, z0 + .06, { maxH: .4, label: '반죽대 위', scale: .85 });
};

// 개수대 (1×1): a sage cabinet with a white sink, a brass gooseneck tap, a wooden dish rack of plates, a gingham tea towel
// hung on the front; a cupboard under it.
B.bakesink = (f, T) => {
  const sage = col(T, 'sage'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), body = col(T, 'body'), top = col(T, 'top'), tk = [sage, wood, woodD, body, top].join(',');
  const W = .96, D = .62, z0 = -.18, H = .88, FZ = z0 + D / 2;
  f.add(mcx('bakesink|' + tk, ({ add, tube }) => {
    add(cutFace(G.box(W - .04, H - .06, D - .04, .02), 'z'), sage, 0, (H - .06) / 2, z0);
    add(windowFace(W - .08, H - .1, [-.39, -.01, -.25, .19]), sage, 0, (H - .06) / 2, z0 + D / 2 - .02);
    add(liner(.38, .44, .52, 'z'), shade(sage, -.2), -.2, .38, z0 + .01);
    add(G.box(W - .1, .07, .03, .01), shade(sage, -.25), 0, .035, FZ - .01);
    add(G.box(W + .02, .06, D + .02, .02), top, 0, H - .03, z0);
    add(G.box(.46, .03, .36, .02), WHITE, -.12, H + .005, z0 + .02);
    add(G.pbox(.4, .01, .3), '#d9e3ea', -.12, H + .022, z0 + .02);
    add(G.cyl(.025, .03, .03, 12), BRASS, -.12, H, z0 - .22);
    tube([-.12, H, z0 - .22], [-.12, H + .26, z0 - .22], .014, BRASS, 8);
    add(G.tor(.07, .014, PI, 6, 12), BRASS, -.12, H + .26, z0 - .15, 0, HP, 0);
    for (const s of [-1, 1]) add(G.cyl(.022, .022, .03, 8), WHITE, -.12 + s * .07, H + .04, z0 - .24);
    // a dish rack: plates on edge, a cup
    add(G.box(.26, .04, .26, .01), woodD, .3, H + .02, z0 - .02);
    for (let k = 0; k < 4; k++) add(G.cyl(.1, .1, .014, 18), k % 2 ? WHITE : '#e9f2e4', .3, H + .12, z0 - .1 + k * .055, HP, 0, 0);
    add(G.cyl(.04, .035, .07, 12), JAM, .32, H + .075, z0 + .12); add(G.tor(.025, .008, PI * 2, 4, 10), JAM, .36, H + .08, z0 + .12, 0, HP, 0);
  }));
  // the tea towel over the cupboard door's top (fixed; it rides on the door? no — hung on a rail on the counter front)
  f.add(pm('bakesink-towel|' + tk, mat('#ffffff', { map: gingham(), rough: .9, rim: .1 }), .12, ({ add }) => add(G.box(.2, .3, .015, .006), .3, H - .26, FZ + .035)));
  f.add(mc('bakesink-rail|' + tk, ({ add }) => add(G.cyl(.01, .01, .34, 6), BRASS, .3, H - .12, FZ + .03, 0, 0, HP)));
  const dp = door(f, 'bakesink-door|' + tk, -.2, .4, FZ + .002, .5, .6, sage, BRASS, 1);
  const p = f.part('door', dp, t => { dp.rotation.y = -1.6 * t; }, { label: '개수대 밑 찬장', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, -.18, .17, z0 + .04, { part: p, maxH: .4, label: '개수대 밑 찬장', scale: .9 }), FZ);
  f.spot('on', null, .12, H + .005, z0 + .16, { maxH: .35, label: '개수대 옆', scale: .8 });
};

// 아일랜드 조리대 (2×1): the peninsula — a honey top over sage panels facing the room (two drawers, a cupboard), a cake stand
// piled with buns, a board of croissants, a jug of daisies, a tall basket of baguettes at the right end.
B.bakeisland = (f, T) => {
  const sage = col(T, 'sage'), sage2 = col(T, 'sage2'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), body = col(T, 'body'), tk = [sage, sage2, wood, woodD, body].join(',');
  const W = 1.9, D = .7, z0 = 0, H = .9, FZ = z0 + D / 2;
  f.add(mcx('bakeisland|' + tk, ({ add, tube }) => {
    add(cutFace(G.box(W - .06, H - .07, D - .06, .02), 'z'), sage, 0, (H - .07) / 2, z0);
    add(windowFace(W - .1, H - .11, [.4, .84, -.245, .145]), sage, 0, (H - .07) / 2, z0 + D / 2 - .03);
    add(liner(.44, .39, .58, 'z'), shade(sage, -.2), .62, .365, z0 + .01);
    for (let k = 0; k < 9; k++) add(G.pbox(.05, H - .2, .012), sage2, -.86 + k * .215, (H - .07) / 2, z0 - D / 2 + .024);
    add(G.box(W - .12, .07, .03, .01), shade(sage, -.25), 0, .035, FZ - .02);
    add(G.box(W + .06, .07, D + .08, .025), wood, 0, H - .035, z0);
    // the cake stand of buns, a board of croissants, a jug of daisies
    add(lathe([[0, 0], [.07, 0], [.03, .02], [.03, .14], [.22, .15], [.22, .17], [0, .17]], 20), CREAM, -.55, H, z0 - .05);
    const ad = (g, c, a, b, c2, d, e, ff, s, M) => add(g, c, a, b, c2, d, e, ff, s, M);
    for (const [x, z, y] of [[-.62, -.1, 0], [-.48, -.08, 0], [-.56, .03, 0], [-.54, -.05, .07]]) bread(ad, 'bun', x, H + .17 + y, z0 + z, 0, 1);
    add(G.box(.4, .03, .24, .01), woodD, -.05, H + .015, z0 + .06, 0, -.1, 0);
    bread(ad, 'croissant', -.14, H + .03, z0 + .06, .4); bread(ad, 'croissant', .04, H + .03, z0 + .04, -.3);
    add(lathe([[0, 0], [.06, 0], [.07, .1], [.045, .17], [.05, .2], [0, .2]], 14), '#eaf3fb', .32, H, z0 - .18);
    for (let i = 0; i < 7; i++) { const an = i * .9, r = .05 + (i % 2) * .04, x = .32 + Math.cos(an) * r, z = z0 - .18 + Math.sin(an) * r * .7, y = H + .3 + (i % 3) * .05;
      tube([.32, H + .18, z0 - .18], [x, y, z], .006, LEAF2, 4); add(G.cyl(.03, .03, .01, 10), WHITE, x, y, z, .3, 0, 0); add(G.sph(.013, 8, 6), HONEY, x, y + .007, z); }
    // the baguette basket at the right end
    add(lathe([[0, 0], [.13, 0], [.15, .3], [.16, .32], [0, .3]], 16), WICKER, .72, H, z0 - .1);
    for (let k = 0; k < 3; k++) add(G.tor(.145, .01, PI * 2, 4, 20), WICKER2, .72, H + .08 + k * .09, z0 - .1, HP, 0, 0);
    for (const [dx, dz, a] of [[-.05, 0, .25], [.04, .04, -.2], [0, -.05, .05], [.06, -.03, .35]]) add(G.cap(.04, .4, 3, 10), CRUST, .72 + dx, H + .38, z0 - .1 + dz, a, 0, a * .6);
  }));
  // a gingham napkin in the baguette basket
  f.add(pm('bakeisland-cloth|' + tk, mat('#ffffff', { map: gingham(), rough: .9, rim: .1 }), .12, ({ add }) => add(G.box(.32, .16, .02, .01), .72, H + .26, z0 + .06, -.3, 0, .1)));
  const inner = shade(body, -.1);
  [-.6, .02].forEach((x, i) => {
    const dw = drawer(f, 'bakeisland-dw' + i + '|' + tk, x, H - .19, FZ, .58, .2, shade(sage, .04), BRASS, inner);
    const pd = f.part('drawer', dw, (t, b) => { dw.position.z = b.p.z + .34 * t; }, { label: i ? '조리대 오른쪽 서랍' : '조리대 왼쪽 서랍', sfx: 'drawer', dur: .26 });
    f.spot('inside', dw, -.1, -.08, -.2, { part: pd, maxH: .15, label: i ? '조리대 오른쪽 서랍' : '조리대 왼쪽 서랍', scale: .8 });
  });
  const dp = door(f, 'bakeisland-door|' + tk, .62, .37, FZ + .002, .56, .52, sage, BRASS, -1);
  const p = f.part('door', dp, t => { dp.rotation.y = 1.6 * t; }, { label: '조리대 찬장', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, .6, .18, z0 + .02, { part: p, maxH: .42, label: '조리대 찬장', scale: .9 }), FZ);
  f.spot('on', null, .3, H + .005, z0 + .14, { maxH: .4, label: '조리대 위', scale: .85 });
};

// 카페 식탁 (2×1): a round honey table in a red gingham cloth (the cloth's hem drops over the edge), a teapot, a cup on a
// saucer, a jug of daisies; two honey stools with cream cushions at its sides; a round cream rug under it all.
B.cafeset = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), cl = col(T, 'cloth'), tk = [wood, woodD, cl].join(',');
  const H = .74, R = .42;
  f.add(mcx('cafeset|' + tk, ({ add, tube }) => {
    add(G.cyl(.85, .85, .012, 32), '#fff3dc', 0, .006, 0, 0, 0, 0, [1.1, 1, .58]);
    add(G.tor(.78, .018, PI * 2, 4, 40), '#f6d99e', 0, .014, 0, HP, 0, 0, [1.1, .58, 1]);
    add(G.cyl(.05, .07, H - .04, 12), woodD, 0, (H - .04) / 2, 0);
    add(G.cyl(.2, .22, .04, 18), woodD, 0, .02, 0);
    add(G.cyl(R, R, .04, 28), wood, 0, H - .02, 0);
    // the teapot, a cup, the daisy jug
    add(lathe([[0, 0], [.07, 0], [.095, .05], [.085, .11], [.04, .13], [0, .135]], 16), WHITE, -.14, H + .04, -.08);
    add(G.sph(.02, 8, 6), JAM, -.14, H + .18, -.08); tube([-.06, H + .1, -.08], [.0, H + .15, -.06], .014, WHITE, 6);
    add(G.tor(.04, .012, PI * 2, 4, 10), WHITE, -.23, H + .1, -.08, 0, 0, 0);
    add(G.cyl(.07, .07, .01, 16), WHITE, .12, H + .045, .1); add(G.cyl(.04, .035, .06, 12), JAM, .12, H + .08, .1); add(G.cyl(.033, .033, .005, 12), '#8a5a3c', .12, H + .11, .1);
    add(lathe([[0, 0], [.04, 0], [.05, .08], [.03, .12], [0, .12]], 12), '#eaf3fb', .1, H + .04, -.14);
    for (let i = 0; i < 5; i++) { const an = i * 1.3, x = .1 + Math.cos(an) * .04, z = -.14 + Math.sin(an) * .03, y = H + .22 + (i % 2) * .04;
      tube([.1, H + .16, -.14], [x, y, z], .005, LEAF2, 4); add(G.cyl(.025, .025, .008, 10), WHITE, x, y, z, .3, 0, 0); add(G.sph(.011, 8, 6), HONEY, x, y + .006, z); }
    // the stools
    for (const sx of [-1, 1]) {
      const x = sx * .74;
      for (let k = 0; k < 3; k++) { const an = k / 3 * PI * 2 + .5; tube([x + Math.cos(an) * .15, 0, Math.sin(an) * .15], [x + Math.cos(an) * .1, .44, Math.sin(an) * .1], .02, woodD, 6); }
      add(G.tor(.125, .012, PI * 2, 4, 18), woodD, x, .2, 0, HP, 0, 0);
      add(G.cyl(.17, .17, .05, 20), wood, x, .46, 0);
      add(G.cyl(.15, .16, .06, 20), '#fff3dc', x, .51, 0);
      add(G.tor(.15, .015, PI * 2, 4, 20), '#f6d99e', x, .51, 0, HP, 0, 0);
    }
  }));
  // the cloth: a top and a scalloped drop, printed
  f.add(pm('cafeset-cloth|' + tk, mat('#ffffff', { map: gingham(cl), rough: .9, rim: .1 }), .16, ({ add }) => {
    add(new THREE.CylinderGeometry(R + .04, R + .04, .012, 32), 0, H + .006, 0);
    add(new THREE.CylinderGeometry(R + .04, R + .08, .2, 32, 1, true), 0, H - .1, 0);
  }));
  f.spot('under', null, .02, 0, .1, { maxH: .6, label: '식탁 밑', scale: .9 });
  f.spot('on', null, -.02, H + .012, .14, { maxH: .4, label: '식탁 위', scale: .85 });
  f.spot('on', null, .74, .54, 0, { maxH: .4, label: '오른쪽 의자 위', scale: .8 });
  f.spot('on', null, -.74, .54, 0, { maxH: .4, label: '왼쪽 의자 위', scale: .8 });
};

// 빵 바구니 (1×1): v 0 — a tall basket of baguettes with a gingham cloth over the front; v 1 — a wide low basket of round
// buns and croissants under a gingham cloth that lifts.
B.breadbasket = (f, T, o = {}) => {
  const v = o.v || 0, cl = col(T, 'cloth'), tk = [v, cl].join(',');
  const ad = add => (g, c, a, b, c2, d, e, ff, s, M) => add(g, c, a, b, c2, d, e, ff, s, M);
  if (!v) {
    f.add(mcx('breadbasket0|' + tk, ({ add }) => {
      add(lathe([[0, 0], [.2, 0], [.24, .44], [.26, .46], [.23, .46], [.2, .05], [0, .05]], 20), WICKER, 0, 0, -.05);
      for (let k = 0; k < 4; k++) add(G.tor(.205 + k * .011, .012, PI * 2, 4, 24), WICKER2, 0, .08 + k * .11, -.05, HP, 0, 0);
      for (const sx of [-1, 1]) add(G.tor(.06, .014, PI, 4, 10), WICKER2, sx * .25, .44, -.05, 0, HP, 0);
      for (const [dx, dz, a, b] of [[-.07, 0, .18, .1], [.06, .05, -.15, -.1], [0, -.08, .05, .2], [.09, -.05, .3, 0], [-.1, -.07, -.05, -.3]]) add(G.cap(.045, .55, 3, 10), CRUST, dx, .62, -.05 + dz, a, 0, b);
      for (const [dx, dz] of [[-.07, 0], [.06, .05], [0, -.08]]) for (let k = 0; k < 3; k++) add(G.box(.05, .01, .02, .005), CRUMB, dx, .62 + (k - 1) * .15, -.05 + dz + .045, 0, 0, .3);
    }));
    const cl0 = new THREE.Group(); put(cl0, 0, .28, .14);
    // (⑥ 10/23 31~70판 훑기 "판자 같은 천": a flat board on the basket — now a cloth that wraps round the basket's front, tucked
    // under the rim, with soft folds and a hem that waves)
    const zc0 = clothWave(.44, .3, 3, .012);
    cl0.add(pm('breadbasket0-cloth2|' + tk, mat('#ffffff', { map: gingham(cl), rough: .9, rim: .1 }), .12, ({ add }) => add(clothSlab(.44, .3, .016, (x, y) => zc0(x, y) - 1.9 * x * x, .15).rotateX(-.12))));
    f.add(cl0);
    // (⑩ 10/29 사용자 "들출 때 제발 벤딩 좀": 19판부터 천이 아래 단부터 말려 올라감 — 1~18판은 그대로 통째로)
    const p = f.part('lift', cl0, (globalThis.__sbkStage ?? -1) >= 18 ? clothBend(f, cl0, { hinge: [0, .15, 0], along: [0, -1, 0], toward: [0, 0, 1], len: .3, turn: 2.2, tip: .2, rise: .04 })
      : (t, b) => { cl0.position.y = b.p.y + .22 * t; cl0.position.z = b.p.z + .08 * t; cl0.rotation.x = .9 * t; }, { label: '바게트 바구니 천', sfx: 'lift', dur: .5 });
    f.spot('inside', null, .02, .05, .02, { part: p, maxH: .36, label: '바게트 바구니 안', scale: .8 });
    return;
  }
  f.add(mcx('breadbasket1|' + tk, ({ add }) => {
    add(lathe([[0, 0], [.3, 0], [.36, .16], [.38, .18], [.35, .18], [.3, .04], [0, .04]], 24), WICKER, 0, 0, 0, 0, 0, 0, [1, 1, .8]);
    for (let k = 0; k < 2; k++) add(G.tor(.33 + k * .02, .012, PI * 2, 4, 28), WICKER2, 0, .06 + k * .07, 0, HP, 0, 0, [1, .8, 1]);
    for (const sx of [-1, 1]) add(G.tor(.07, .016, PI, 4, 10), WICKER2, sx * .37, .18, 0, 0, HP, 0);
    const a = ad(add);
    bread(a, 'bun', -.18, .1, -.08); bread(a, 'bun', .17, .1, -.1); bread(a, 'croissant', .2, .1, .08, .6);
  }));
  const cl1 = new THREE.Group(); put(cl1, -.02, .16, .04);
  cl1.add(pm('breadbasket1-cloth|' + tk, mat('#ffffff', { map: gingham(cl), rough: .9, rim: .1 }), .12, ({ add }) => {
    // (⑥ 10/23: was a 3 cm board — now a thin cloth that domes over the buns and droops over the rim, one corner hanging)
    add(drape(.5, .42, (x, z) => .05 * Math.max(0, 1 - (x * x / .045 + z * z / .03)) - .09 * Math.max(0, Math.hypot(x / .25, z / .21) - .78) ** 1.5 * 3 + .006 * Math.sin(x * 30 + z * 9)), 0, .03, 0, .06, .2, 0);
  }));
  f.add(cl1);
  // (⑩ 10/29: 19판부터 오른쪽 끝을 잡고 젖히듯 천이 휘어 넘어감 — 1~18판은 그대로)
  const p = f.part('lift', cl1, (globalThis.__sbkStage ?? -1) >= 18 ? clothBend(f, cl1, { hinge: [.25, .03, 0], along: [-1, 0, 0], toward: [0, 1, 0], len: .5, turn: 2.4, tip: .2, rise: .1 })
    : (t, b) => { cl1.position.y = b.p.y + .26 * t; cl1.position.x = b.p.x - .12 * t; cl1.rotation.z = .6 * t; }, { label: '빵 바구니 천', sfx: 'lift', dur: .5 });
  f.spot('inside', null, -.02, .05, .04, { part: p, maxH: .22, label: '빵 바구니 안', scale: .8 });
};

// 밀가루 포대 (1×1): three burlap flour sacks (tied necks, a wheat stamp, one slumped open with a scoop in it) and a little
// crate of red apples.
B.floursacks = (f, T) => {
  const woodD = col(T, 'woodD'), wood = col(T, 'wood'), tk = [wood, woodD].join(',');
  f.add(mcx('floursacks|' + tk, ({ add }) => {
    const sack = (x, z, h, ry, open) => {
      add(G.box(.34, h, .26, .12), BURLAP, x, h / 2, z, 0, ry, 0);
      if (open) { add(G.cyl(.13, .15, .06, 14), BURLAP2, x, h + .01, z, 0, ry, 0); add(G.cyl(.11, .11, .02, 14), FLOUR, x, h + .035, z); add(G.sph(.06, 10, 6), STEEL, x + .03, h + .07, z, .6, ry, 0, [1, .6, 1.4]); }
      else { add(G.cyl(.05, .1, .1, 10), BURLAP2, x, h + .03, z); add(G.tor(.05, .014, PI * 2, 4, 12), WICKER2, x, h + .02, z, HP, 0, 0); add(G.cone(.07, .1, 8), BURLAP, x, h + .12, z, PI, 0, 0); }
      const M = xf(x, h * .5, z, 0, ry, 0);
      for (let k = 0; k < 5; k++) add(G.sph(.016, 6, 5), '#c98a3c', 0, 0, 0, 0, 0, 0, 1, M.clone().multiply(xf((k % 2 ? .02 : -.02), -.05 + k * .025, .135, 0, 0, (k % 2 ? -.5 : .5), [1, 1.6, .5])));
      add(G.cyl(.004, .004, .16, 4), '#c98a3c', 0, 0, 0, 0, 0, 0, 1, M.clone().multiply(xf(0, -.06, .133)));
    };
    sack(-.2, -.2, .5, .2, false); sack(.18, -.22, .44, -.15, true); sack(-.05, .12, .32, .5, false);
    add(G.box(.3, .16, .24, .015), wood, .25, .08, .22, 0, -.3, 0);
    for (let k = 0; k < 4; k++) add(G.sph(.05, 10, 8), JAM, .2 + (k % 2) * .08, .18, .18 + (k >> 1) * .08); add(G.cap(.006, .02, 2, 4), SOIL, .2, .24, .18);
  }));
  f.spot('behind', null, .02, 0, -.42, { maxH: .5, label: '밀가루 포대 뒤', scale: .8 });
  f.spot('on', null, .3, .16, .26, { maxH: .3, label: '사과 상자 위', scale: .75 });
};

// 병 선반 (wall, span 2): two honey shelves on brackets — jam, honey and flour jars with gingham lids, a bear cookie jar, a loaf,
// a little pot of herbs; ivy trailing from the top shelf.
B.bakejars = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), cl = col(T, 'cloth'), tk = [wood, woodD, cl].join(',');
  const Y1 = 1.42, Y2 = 1.86;
  f.add(mcx('bakejars|' + tk, ({ add }) => {
    for (const y of [Y1, Y2]) { add(G.box(1.6, .05, .26, .015), wood, 0, y, .13); for (const x of [-.6, .6]) add(G.box(.04, .16, .2, .01), woodD, x, y - .1, .1, 0, 0, 0); }
    const jar = (x, y, c, h = .16, lid = cl) => { add(G.cyl(.065, .065, h, 14), '#eef7fb', x, y + h / 2 + .025, .13); add(G.cyl(.058, .058, h * .8, 14), c, x, y + h * .42 + .025, .13); add(G.cyl(.075, .07, .03, 14), lid, x, y + h + .04, .13); add(G.sph(.02, 6, 5), WHITE, x, y + h + .06, .13); };
    jar(-.66, Y1, JAM); jar(-.48, Y1, HONEY, .14); jar(-.3, Y1, FLOUR, .2, WHITE); jar(.42, Y1, BERRY, .13);
    bread((g, c, a, b, c2, d, e, ff, s, M) => add(g, c, a, b, c2, d, e, ff, s, M), 'loaf', .66, Y1 + .025, .13, -.2, .9);
    // the bear cookie jar
    add(G.cyl(.1, .1, .18, 16), BEAR, -.45, Y2 + .115, .13); add(G.sph(.1, 14, 8), BEAR, -.45, Y2 + .2, .13, 0, 0, 0, [1, .6, 1]);
    for (const sx of [-1, 1]) add(G.sph(.035, 8, 6), BEAR, -.45 + sx * .07, Y2 + .27, .13);
    add(G.sph(.04, 8, 6), '#f6dcb6', -.45, Y2 + .12, .225, 0, 0, 0, [1, .8, .5]);
    for (const sx of [-1, 1]) add(G.sph(.01, 6, 5), INK, -.45 + sx * .035, Y2 + .17, .23);
    // herbs, a cream jug, ivy
    add(lathe([[0, 0], [.06, 0], [.07, .1], [0, .1]], 14), '#f3a272', .1, Y2 + .025, .13);
    for (let i = 0; i < 6; i++) add(G.sph(.04, 8, 6), i % 2 ? LEAF : LEAF3, .1 + Math.cos(i) * .04, Y2 + .15 + (i % 3) * .03, .13 + Math.sin(i) * .03);
    add(lathe([[0, 0], [.05, 0], [.06, .1], [.04, .14], [0, .14]], 14), CREAM, .38, Y2 + .025, .13);
    leaves(add, .62, Y2 + .02, .22, 7, LEAF, LEAF2, 1, .45);
  }));
  f.spot('on', null, .14, Y1 + .025, .14, { maxH: .36, label: '아래 병 선반', scale: .75, wallFace: false });
  f.spot('on', null, -.12, Y2 + .025, .14, { maxH: .36, label: '위 병 선반', scale: .75 });
};

// 냄비 걸이 (wall, span 1): a brass rail on two pegs with S-hooks — a cast-iron pan, a copper pot, a ladle, a whisk — and a
// gingham towel.
B.potrail = (f, T) => {
  const cl = col(T, 'cloth'), tk = cl;
  f.add(mcx('potrail|' + tk, ({ add, tube }) => {
    add(G.cyl(.014, .014, .82, 8), BRASS, 0, 1.78, .1, 0, 0, HP);
    for (const x of [-.4, .4]) add(G.cyl(.02, .02, .1, 8), BRASS, x, 1.78, .05, HP, 0, 0);
    const hook = x => add(G.tor(.03, .006, PI * 1.5, 4, 10), STEEL, x, 1.75, .1, 0, HP, 0);
    hook(-.28); add(G.cyl(.15, .14, .025, 22), IRON, -.28, 1.5, .1, HP, 0, 0); add(G.cyl(.016, .016, .2, 6), IRON, -.28, 1.66, .1);
    hook(-.02); add(G.cyl(.1, .1, .16, 18), COPPER, -.02, 1.55, .13); tube([-.02, 1.68, .1], [-.02, 1.74, .1], .01, COPPER, 6); add(G.cyl(.1, .1, .01, 18), shade(COPPER, -.1), -.02, 1.63, .13);
    hook(.18); add(G.cyl(.01, .01, .32, 6), STEEL, .18, 1.6, .1); add(G.sph(.045, 10, 6), STEEL, .18, 1.44, .12, 0, 0, 0, [1, .5, 1]);
    hook(.32); tube([.32, 1.74, .1], [.32, 1.6, .1], .008, wood(T), 6); add(G.sph(.04, 8, 6), STEEL, .32, 1.55, .1, 0, 0, 0, [.8, 1.4, .8]);
  }));
  // (⑥ 10/23: the towel was a board — now it hangs off the rail's end in two folds)
  const zt = clothWave(.18, .32, 2, .012);
  f.add(pm('potrail-towel2|' + tk, mat('#ffffff', { map: gingham(cl), rough: .9, rim: .1 }), .12, ({ add }) => add(clothSlab(.18, .32, .014, zt), .42, 1.79, .12)));
};
const wood = T => col(T, 'woodD');

// 깅엄 커튼 창 (wall, span 2): a sage-framed window (four panes, a garden with a round tree outside), red gingham café curtains
// tied back on a brass rod, a deep sill with a pot of daisies and a bear cookie.
B.ginghamwin = (f, T) => {
  const sage = col(T, 'sage'), sage2 = col(T, 'sage2'), cl = col(T, 'cloth'), tk = [sage, sage2, cl].join(',');
  const cy = 1.6, W = 1.0, H = 1.04;
  f.add(mcx('ginghamwin|' + tk, ({ add, tube }) => {
    add(G.pbox(W, H, .01), SKY2, 0, cy, .01);
    add(G.sph(.34, 14, 10), LEAF3, -.18, cy - .3, .015, 0, 0, 0, [1, .9, .05]); add(G.sph(.26, 14, 10), LEAF, .22, cy - .38, .02, 0, 0, 0, [1, 1, .05]);
    add(G.box(.06, .3, .02, .01), SOIL, -.18, cy - .45, .012);
    for (const [x, y, w, h] of [[0, cy + H / 2, W + .1, .08], [0, cy - H / 2, W + .1, .08], [-W / 2, cy, .08, H + .1], [W / 2, cy, .08, H + .1], [0, cy, .05, H], [0, cy + .05, W, .05]]) add(G.box(w, h, .08, .015), sage, x, y, .05);
    add(G.box(W + .3, .07, .28, .02), sage2, 0, cy - H / 2 - .06, .12);
    add(lathe([[0, 0], [.07, 0], [.085, .11], [.095, .12], [.095, .135], [0, .135]], 16), '#f3a272', -.3, cy - H / 2 - .025, .14);
    for (let i = 0; i < 6; i++) { const an = i * 1.1, r = .04 + (i % 2) * .03, x = -.3 + Math.cos(an) * r, z = .14 + Math.sin(an) * r * .6, y = cy - H / 2 + .18 + (i % 3) * .04;
      tube([-.3, cy - H / 2 + .1, .14], [x, y, z], .006, LEAF2, 4); add(G.cyl(.03, .03, .01, 10), WHITE, x, y, z, .3, 0, 0); add(G.sph(.013, 8, 6), HONEY, x, y + .007, z); }
    add(G.cyl(.012, .012, W + .5, 8), BRASS, 0, cy + H / 2 + .1, .14, 0, 0, HP);
    for (const x of [-(W + .5) / 2, (W + .5) / 2]) add(G.sph(.026, 8, 6), BRASS, x, cy + H / 2 + .1, .14);
  }));
  // the curtains: gathered panels tied back at each side, and a short valance
  f.add(pm('ginghamwin-cl|' + tk, mat('#ffffff', { map: gingham(cl), rough: .9, rim: .1 }), .14, ({ add }) => {
    add(G.box(W + .4, .16, .03, .012), 0, cy + H / 2 + .02, .15);
    for (const sx of [-1, 1]) {
      add(G.box(.22, .9, .04, .03), sx * (W / 2 + .06), cy + .08, .16, 0, 0, -sx * .06);
      add(G.box(.28, .3, .045, .04), sx * (W / 2 + .1), cy - .5, .16, 0, 0, sx * .1);
    }
  }));
  f.add(mc('ginghamwin-tie|' + tk, ({ add }) => { for (const sx of [-1, 1]) add(G.tor(.07, .016, PI * 2, 4, 14), '#fff3dc', sx * (W / 2 + .08), cy - .32, .17, HP, 0, 0, [1.4, 1, 1]); }));
  f.spot('on', null, .22, cy - H / 2 - .025, .14, { maxH: .3, label: '창틀 위', scale: .75 });
};

// 오늘의 빵 메뉴판 (wall, span 1): a little chalkboard in a honey frame on a string — chalk drawings of a loaf, a croissant and
// a heart, and two lines of chalk writing.
B.chalkmenu = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [wood, woodD].join(',');
  f.add(mcx('chalkmenu|' + tk, ({ add, tube }) => {
    add(G.box(.56, .44, .03, .012), wood, 0, 1.65, .02); add(G.pbox(.48, .36, .012), CHALK, 0, 1.65, .04);
    tube([-.2, 1.87, .03], [0, 2.0, .03], .006, woodD, 4); tube([.2, 1.87, .03], [0, 2.0, .03], .006, woodD, 4); add(G.sph(.02, 6, 5), BRASS, 0, 2.0, .035);
  }));
  // (⑥ 10/23 31~70판 훑기: two chalk arcs over rows of dashes read as a face, not a menu — now chalk drawings of a loaf, a
  // croissant and a bun, each with its price, and a heart: numbers and pictures, nothing to translate)
  f.add(put(mesh(geo('chalkmenu-plane', () => new THREE.PlaneGeometry(.46, .34)), mat('#ffffff', { map: chalkMenuTex(), rough: .95 })), 0, 1.65, .0475));
};
function chalkMenuTex() {
  return TEX.get('chalkmenu', () => canvasTex(512, 380, (x, W, H) => {
    x.fillStyle = CHALK; x.fillRect(0, 0, W, H);
    x.lineCap = x.lineJoin = 'round'; x.strokeStyle = '#f4f1e8'; x.fillStyle = '#f4f1e8'; x.lineWidth = 7;
    const row = (y, draw, price, c) => { x.save(); x.translate(70, y); draw(); x.restore(); x.font = 'bold 54px sans-serif'; x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillStyle = c; x.fillText(price, W - 40, y + 4); x.fillStyle = '#f4f1e8'; x.setLineDash([3, 14]); x.beginPath(); x.moveTo(130, y + 10); x.lineTo(W - 200, y + 10); x.stroke(); x.setLineDash([]); };
    row(80, () => { x.beginPath(); x.moveTo(-38, 22); x.quadraticCurveTo(-44, -26, 0, -28); x.quadraticCurveTo(44, -26, 38, 22); x.closePath(); x.stroke(); for (const d of [-16, 0, 16]) { x.beginPath(); x.moveTo(d - 6, -6); x.lineTo(d + 6, -16); x.stroke(); } }, '3,000', '#ffd9a8');
    row(190, () => { x.beginPath(); x.arc(0, 18, 40, PI * 1.08, PI * 1.92); x.stroke(); for (const d of [-24, 0, 24]) { x.beginPath(); x.moveTo(d, -18 + Math.abs(d) * .5); x.lineTo(d, 12); x.stroke(); } }, '2,500', '#f4f1e8');
    row(300, () => { x.beginPath(); x.ellipse(0, 6, 36, 24, 0, PI, 0); x.lineTo(36, 18); x.lineTo(-36, 18); x.closePath(); x.stroke(); x.beginPath(); x.arc(-8, 0, 5, 0, PI * 2); x.arc(12, -4, 5, 0, PI * 2); x.fill(); }, '1,500', '#ffd9a8');
    x.fillStyle = JAM; x.beginPath(); x.moveTo(W - 46, 52); x.bezierCurveTo(W - 46, 30, W - 14, 30, W - 14, 52); x.bezierCurveTo(W - 14, 66, W - 30, 74, W - 30, 82); x.bezierCurveTo(W - 30, 74, W - 46, 66, W - 46, 52); x.fill();
  }));
}

// 빵 식힘 수레 (1×1): a honey trolley on little casters with four trays — buns, croissants, loaves, a tray of cooling cookies
// — and a gingham cloth over the top tray. Things go between the breads on two trays.
B.breadcart = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), cl = col(T, 'cloth'), tk = [wood, woodD, cl].join(',');
  const W = .7, D = .5, YS = [.2, .5, .8, 1.1], TOP = 1.3;
  f.add(mcx('breadcart|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      add(G.box(.05, TOP, .05, .015), wood, sx * (W / 2 - .025), TOP / 2 + .06, sz * (D / 2 - .025));
      add(G.cyl(.035, .035, .03, 10), IRON, sx * (W / 2 - .025), .03, sz * (D / 2 - .025), 0, 0, HP);
    }
    for (const sx of [-1, 1]) for (const y of YS) add(G.box(.03, .025, D - .04, .008), woodD, sx * (W / 2 - .05), y - .02, 0);
    add(G.box(W, .04, D, .012), wood, 0, TOP + .06, 0);
    YS.forEach((y, i) => {
      add(G.box(W - .1, .015, D - .06, .006), STEEL, 0, y, 0);
      for (const sx of [-1, 1]) add(G.pbox(.012, .03, D - .06), STEEL, sx * (W / 2 - .055), y + .015, 0);
      if (i === 0) [[-.18, -.1], [0, -.1], [.18, -.1], [-.18, .1], [.18, .1]].forEach(([x, z]) => bread(add, 'loaf', x, y + .008, z, 0, .55));
      if (i === 1) [[-.18, -.1], [.18, -.1], [0, .1]].forEach(([x, z], k) => bread(add, 'croissant', x, y + .008, z, k * .7, 1));
      if (i === 2) [[-.18, -.1], [0, -.1], [-.18, .1], [.18, .1]].forEach(([x, z]) => bread(add, 'bun', x, y + .008, z, 0, 1));
      if (i === 3) for (let k = 0; k < 8; k++) { const x = -.2 + (k % 4) * .13, z = -.1 + (k >> 2) * .18; add(G.cyl(.04, .04, .015, 12), k % 3 ? '#e9b06a' : BEAR, x, y + .016, z); add(G.sph(.008, 6, 4), '#6a3a2a', x + .01, y + .026, z); }
    });
  }));
  f.add(pm('breadcart-cloth|' + tk, mat('#ffffff', { map: gingham(cl), rough: .9, rim: .1 }), .12, ({ add }) => {
    // (⑥ 10/23 31~70판 훑기 "판자 같은 천": the front drop was a board — now it hangs in folds, its hem waving)
    add(G.box(W + .02, .015, D * .6, .007), 0, TOP + .088, -.06);
    const zc = clothWave(W + .02, .22, 4, .014); add(clothSlab(W + .02, .22, .014, zc), 0, TOP + .095, D / 2 - .04);
  }));
  f.spot('on', null, .18, YS[1] + .008, .1, { maxH: .26, label: '식힘 수레 둘째 칸', scale: .75 });
  f.spot('on', null, .18, YS[2] + .008, -.1, { maxH: .26, label: '식힘 수레 셋째 칸', scale: .75 });
};

// ── 곰제과 앞마당 (10/20 밤, 사용자가 보낸 '바닷가 가게' 그림에서 예쁜 점만: 흰 판자 · 줄무늬 차양 · 앞마당 좌판 · 파라솔) ──
const NAVY = '#3f5f9e', NAVY2 = '#2f4a80', SKYB = '#8fc4ea', PAINT = '#fbf8f2', PAINT2 = '#ece6db';
// (10/24 아트 점검 2차 35: the strips were tilted the wrong way — up at the front and down into the wall behind; now they slope down
// from the wall to the valance)
// a striped awning: a sloped canvas (stripes as separate strips) and a scalloped valance; w wide, reaching d out, at height y
function awning(add, x, y, w, d, c1, c2, z0 = 0) {
  const n = Math.max(4, Math.round(w / .16)), sw = w / n, ang = .5;
  for (let k = 0; k < n; k++) add(G.box(sw + .004, .02, d, .004), k % 2 ? c2 : c1, x - w / 2 + sw * (k + .5), y - Math.sin(ang) * d / 2, z0 + Math.cos(ang) * d / 2, -ang, 0, 0);
  const fz = z0 + Math.cos(ang) * d, fy = y - Math.sin(ang) * d;
  for (let k = 0; k < n; k++) add(new THREE.CylinderGeometry(sw / 2, sw / 2, .02, 10, 1, false, 0, PI), k % 2 ? c2 : c1, x - w / 2 + sw * (k + .5), fy - .005, fz, HP, 0, 0, [1, 1, 1.6]);
  add(G.cyl(.012, .012, w + .04, 6), PAINT2, x, y + .01, z0 + .02, 0, 0, HP);
}
const SIGN_TEX = texCache();
function signTex(txt, bg, fg) {
  return SIGN_TEX.get(txt + bg + fg, () => canvasTex(512, 128, (c, W, H) => {
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.fillStyle = fg; c.font = '700 74px "Apple SD Gothic Neo", "Noto Sans KR", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, W / 2 + 34, H / 2 + 4);
    c.beginPath(); c.arc(78, 64, 34, 0, 7); c.fill(); for (const sx of [-1, 1]) { c.beginPath(); c.arc(78 + sx * 26, 38, 13, 0, 7); c.fill(); }
    c.fillStyle = bg; for (const sx of [-1, 1]) { c.beginPath(); c.arc(78 + sx * 12, 60, 4.5, 0, 7); c.fill(); } c.beginPath(); c.ellipse(78, 76, 11, 8, 0, 0, 7); c.fill();
  }));
}

// 곰제과 가게 정면 (wall, span 3): white clapboard over the whole wall — lapped boards, corner trims — a navy tiled eave, a
// '곰제과' signboard with a bear, a paned door (a round window, an OPEN tag) under a small awning, a wide shop window full of
// bread under a navy-and-white striped awning, a flower box, a wall lantern and a little round clock.
B.bkfacade = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [wood, woodD].join(',');
  const W = 3, H = 2.9, DX = -.92, WX = .62;
  f.collideBox = [-W / 2, 0, 0, W / 2, H, .2];   // (the wall face only: its eave over the kitchen next door never stopped a drawer — map.js, 10/21)
  f.add(mcx('bkfacade|' + tk, ({ add, tube }) => {
    for (let r = 0; r < 14; r++) add(G.pbox(W - .04, .215, .03), r % 2 ? PAINT : '#f6f2ea', 0, .12 + r * .2, .02 + (r % 2) * .002, -.06, 0, 0);
    for (const sx of [-1, 1]) add(G.box(.09, H, .06, .01), WHITE, sx * (W / 2 - .045), H / 2, .04);
    // the navy eave and its tiles, a gutter
    add(G.box(W + .3, .06, .62, .02), NAVY, 0, H + .12, .2, .32, 0, 0);
    for (let k = 0; k < 4; k++) add(G.box(W + .3, .025, .03, .008), NAVY2, 0, H + .2 - k * .06 + .024, .02 + k * .17 + .008, .32, 0, 0);   // (on the eave, not sunk flush in it — ① 10/21 겹친 면)
    add(G.cyl(.035, .035, W + .32, 10), '#d9dee8', 0, H - .02, .5, 0, 0, HP);
    // the signboard
    add(G.box(1.5, .4, .05, .015), woodD, .2, 2.62, .07);
    // the door: frame, panes, a round window, a brass knob, the OPEN tag, a step
    add(G.box(.8, 2.08, .06, .015), WHITE, DX, 1.04, .05);
    add(G.box(.66, 1.98, .04, .012), SKYB, DX, 1.0, .08);
    add(G.cyl(.16, .16, .02, 18), '#e9f6fd', DX, 1.45, .105, HP, 0, 0); add(G.tor(.16, .02, PI * 2, 4, 20), WHITE, DX, 1.45, .11);
    for (const y of [.42, .72]) add(G.box(.5, .2, .015, .006), shade(SKYB, .1), DX, y, .105);
    add(G.sph(.03, 8, 6), BRASS, DX + .24, 1.0, .12);
    add(G.box(.22, .1, .01, .004), WHITE, DX, 1.12, .112); tube([DX - .08, 1.17, .112], [DX, 1.25, .11], .004, woodD, 4); tube([DX + .08, 1.17, .112], [DX, 1.25, .11], .004, woodD, 4);
    add(G.box(.9, .06, .28, .02), '#d6d0c6', DX, .03, .14);
    awning(add, DX, 2.2, .9, .42, NAVY, WHITE, .08);
    // the shop window: a honey frame, three panes, a bread shelf behind the glass, the awning, a flower box
    add(G.box(1.4, 1.1, .06, .015), WHITE, WX, 1.45, .05);
    add(G.pbox(1.28, .98, .01), '#dff1fa', WX, 1.45, .07);
    for (const x of [-.22, .22]) add(G.box(.04, 1.0, .04, .01), WHITE, WX + x, 1.45, .085);
    add(G.box(1.28, .04, .1, .01), wood, WX, 1.12, .1);
    bread(add, 'loaf', WX - .4, 1.14, .1, 0, .7); bread(add, 'baguette', WX, 1.14, .1, .2, .7); bread(add, 'bun', WX + .38, 1.14, .1, 0, 1); bread(add, 'croissant', WX + .48, 1.14, .1, .4, .9);
    awning(add, WX, 2.2, 1.56, .62, NAVY, WHITE, .08);
    add(G.box(1.3, .18, .2, .02), woodD, WX, .8, .14);
    for (let i = 0; i < 9; i++) { const x = WX - .55 + i * .14; add(G.sph(.07, 8, 6), i % 2 ? LEAF : LEAF3, x, .93, .15); add(G.sph(.03, 6, 5), [JAM, WHITE, HONEY][i % 3], x + .03, .99, .2); }
    // a wall lantern by the door, a round clock up on the boards
    add(G.box(.04, .2, .12, .01), IRON, DX + .55, 1.9, .07); add(G.box(.14, .2, .14, .03), IRON, DX + .55, 1.82, .18);   // (its glass is the glowing box below — drawn twice it flickered)
    add(G.cyl(.15, .15, .05, 20), WHITE, 1.25, 2.64, .07, HP, 0, 0); add(G.tor(.15, .02, PI * 2, 4, 20), NAVY, 1.25, 2.64, .1);
    add(G.box(.015, .1, .01, .004), INK, 1.25, 2.68, .1); add(G.box(.07, .015, .01, .004), INK, 1.28, 2.64, .1);
  }));
  f.add(put(mesh(G.pbox(1.4, .34, .01), mat('#ffffff', { map: signTex('곰제과', '#fff4dc', '#7a4a2a'), rough: .8 })), .2, 2.62, .1));
  f.add(put(mesh(G.box(.1, .13, .1, .02), mat('#fff3c6', { emissive: '#ffd27a', ei: .8 }), { cast: false }), DX + .55, 1.82, .18));
  f.spot('on', null, WX + .1, .89, .17, { maxH: .3, label: '창 화분 상자', scale: .75 });
  f.spot('on', null, DX + .2, .06, .2, { maxH: .4, label: '가게 문 앞 계단', scale: .8 });
};

// 빵 좌판 (2×1): a honey table with three tilted crates of bread — baguettes, round loaves, croissants — little price flags on
// sticks, a red gingham skirt round the front that lifts (a thing under the table).
B.bkstall = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), cl = col(T, 'cloth'), tk = [wood, woodD, cl].join(',');
  const W = 1.8, D = .7, H = .72;
  f.add(mcx('bkstall|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.06, H, .06, .015), woodD, sx * (W / 2 - .05), H / 2, sz * (D / 2 - .05));
    add(G.box(W, .05, D, .015), wood, 0, H, 0);
    add(G.box(W - .1, .03, D - .1, .01), shade(wood, -.1), 0, .16, 0);
    for (const [x, kind, c] of [[-.58, 'baguette', 0], [0, 'loaf', 1], [.58, 'croissant', 2]]) {
      const M = xf(x, H + .025, -.04, -.35, 0, 0);
      add(G.box(.52, .05, .5, .012), wood, 0, 0, 0, 0, 0, 0, 1, M.clone().multiply(xf(0, .025, 0)));
      for (const sx of [-1, 1]) add(G.box(.03, .14, .5, .008), woodD, 0, 0, 0, 0, 0, 0, 1, M.clone().multiply(xf(sx * .245, .09, 0)));
      add(G.box(.5, .14, .03, .008), woodD, 0, 0, 0, 0, 0, 0, 1, M.clone().multiply(xf(0, .09, .235)));
      add(G.box(.5, .2, .03, .008), woodD, 0, 0, 0, 0, 0, 0, 1, M.clone().multiply(xf(0, .12, -.235)));
      const pts = kind === 'baguette' ? [[-.1, -.1], [.08, -.06], [0, .1]] : kind === 'loaf' ? [[-.11, -.1], [.11, -.08], [0, .11]] : [[-.12, -.1], [.1, -.1], [-.08, .1], [.12, .1]];
      for (const [px, pz] of pts) bread((g, cc, a, b, c2, d, e, ff, sc, MM) => add(g, cc, 0, 0, 0, 0, 0, 0, 1, M.clone().multiply(MM || xf(a, b, c2, d, e, ff, sc))), kind, px, .05, pz, kind === 'baguette' ? .3 : 0, kind === 'loaf' ? .7 : 1);
      tube([x + .2, H + .05, .2], [x + .2, H + .32, .2], .006, woodD, 4);
      add(G.box(.12, .08, .01, .004), [HONEY, WHITE, '#ffe0d6'][c], x + .2, H + .34, .2);
    }
  }));
  const sk = new THREE.Group(); put(sk, 0, H - .02, D / 2 + .01);
  sk.add(pm('bkstall-skirt|' + tk, mat('#ffffff', { map: gingham(cl), rough: .9, rim: .1 }), .14, ({ add }) => add(G.box(W + .02, .5, .02, .01), 0, -.25, 0)));
  f.add(sk);
  // (⑩ 10/29: 19판부터 늘어진 천이 아래 단부터 말려 올라감 — 1~18판은 그대로 판처럼)
  const p = f.part('lift', sk, (globalThis.__sbkStage ?? -1) >= 18 ? clothBend(f, sk, { along: [0, -1, 0], toward: [0, 0, 1], len: .5, turn: 2.6, bias: 2.5, tip: .15 })
    : (t) => { sk.rotation.x = -1.35 * t; }, { label: '좌판 천', sfx: 'lift', dur: .5 });
  f.spot('inside', null, -.3, .18, .05, { part: p, maxH: .48, label: '빵 좌판 밑', scale: .9 });
  f.spot('on', null, .3, H + .04, .22, { maxH: .3, label: '빵 상자 사이', scale: .75 });
};

// 파라솔 테이블 (1×1): a little round white café table under a navy-and-white parasol, two folding chairs, a cup and a plate of
// a croissant.
B.bkparasol = (f, T) => {
  const woodD = col(T, 'woodD'), tk = woodD;
  const H = .7;
  f.add(mcx('bkparasol|' + tk, ({ add, tube }) => {
    add(G.cyl(.32, .32, .03, 22), WHITE, 0, H, 0); add(G.cyl(.03, .03, H, 8), '#d9dee8', 0, H / 2, 0); add(G.cyl(.16, .2, .03, 16), '#d9dee8', 0, .015, 0);
    add(G.cyl(.022, .022, 2.2, 8), WHITE, 0, 1.1, 0);
    const n = 8;
    for (let k = 0; k < n; k++) {
      const a0 = k / n * PI * 2, g = new THREE.ConeGeometry(.78, .3, 2, 1, true, a0, PI * 2 / n); g.translate(0, 0, 0);
      add(g, k % 2 ? WHITE : NAVY, 0, 2.05, 0);
      add(new THREE.CylinderGeometry(.06, .06, .012, 8, 1, false, 0, PI), k % 2 ? WHITE : NAVY, Math.sin(a0 + PI / n) * .74, 1.9, Math.cos(a0 + PI / n) * .74, HP, a0 + PI / n + HP, 0);
    }
    add(G.sph(.04, 8, 6), WHITE, 0, 2.22, 0);
    for (const s of [-1, 1]) {
      const x = s * .44;
      tube([x - .14 * s, 0, -.14], [x + .14 * s, .44, .12], .014, woodD, 5); tube([x - .14 * s, 0, .14], [x + .14 * s, .44, -.12], .014, woodD, 5);
      add(G.box(.34, .03, .3, .01), '#f6dfb6', x, .45, 0);
      add(G.box(.04, .38, .3, .01), '#f6dfb6', x + s * .17, .66, 0, 0, 0, -s * .12);
    }
    add(G.cyl(.05, .04, .07, 12), WHITE, -.1, H + .05, .08); add(G.cyl(.08, .08, .01, 14), WHITE, .1, H + .02, -.06);
    bread(add, 'croissant', .1, H + .025, -.06, .4, .9);
  }));
  f.spot('under', null, 0, 0, .12, { maxH: .55, label: '파라솔 테이블 밑', scale: .85 });
  f.spot('on', null, .12, H + .015, .12, { maxH: .35, label: '파라솔 테이블 위', scale: .8 });
  f.spot('on', null, -.44, .465, 0, { maxH: .35, label: '접이식 의자 위', scale: .75 });
};

// 나무 상자 더미 (1×1): crates stacked by the door — milk bottles, flour, a milk can, a crate of oranges — one crate's lid lifts.
B.bkcrates = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [wood, woodD].join(',');
  // (⑥ 10/23 31~70판 훑기: a crate was a solid block with two bands, a stack of slabs — now a dark inside, three slats a
  // side with gaps, corner posts and a hand-hole: a fruit crate)
  const crate = (add, x, y, z, w, h, d, ry = 0, hollow = false) => {
    const c = Math.cos(ry), sn = Math.sin(ry), at = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
    add(hollow ? liner(w - .03, h - .02, d - .03) : G.box(w - .03, h - .02, d - .03, .006), shade(woodD, -.25), x, y + h / 2, z, 0, ry, 0);
    for (const k of [0, 1, 2]) { const yy = y + h * (.2 + k * .3); if (!hollow) { add(G.box(w, h * .22, d, .008), wood, x, yy, z, 0, ry, 0); continue; }
      for (const s of [-1, 1]) { const [px, pz] = at(0, s * (d / 2 - .01)), [qx, qz] = at(s * (w / 2 - .01), 0); add(G.box(w, h * .22, .02, .008), wood, px, yy, pz, 0, ry, 0); add(G.box(.02, h * .22, d - .04, .008), wood, qx, yy, qz, 0, ry, 0); } }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const [px, pz] = at(sx * (w / 2 - .02), sz * (d / 2 - .02)); add(G.box(.045, h, .045, .01), woodD, px, y + h / 2, pz, 0, ry, 0); }
    for (const sx of [-1, 1]) { const [px, pz] = at(sx * (w / 2 + .002), 0); add(G.box(.008, .035, .11, .006), shade(woodD, -.35), px, y + h * .8, pz, 0, ry, 0); }
  };
  f.add(mcx('bkcrates|' + tk, ({ add }) => {
    crate(add, -.12, 0, -.1, .5, .3, .4, .1, true);
    for (let k = 0; k < 6; k++) { const x = -.28 + (k % 3) * .1, z = -.18 + (k >> 1 & 1) * .12; add(G.cyl(.035, .035, .16, 10), WHITE, x + .02, .38, z); add(G.cyl(.037, .037, .02, 10), SKYB, x + .02, .46, z); }
    crate(add, .2, 0, .18, .4, .26, .36, -.2);
    for (let k = 0; k < 5; k++) add(G.sph(.055, 10, 8), '#ffa13c', .12 + (k % 3) * .09, .3, .12 + (k >> 1) * .1);
    add(lathe([[0, 0], [.1, 0], [.11, .26], [.06, .32], [.06, .38], [.08, .4], [0, .4]], 14), '#d9dee8', .26, 0, -.24);
  }));
  const lid = new THREE.Group(); put(lid, -.12, .3, -.1);
  lid.add(mc('bkcrates-lid|' + tk, ({ add }) => { add(G.box(.52, .03, .42, .01), wood, 0, .015, 0, 0, .1, 0); add(G.box(.2, .02, .14, .006), BURLAP, .05, .04, 0, 0, .3, 0); }));
  f.add(lid);
  const p = f.part('lid', lid, (t, b) => { lid.position.y = b.p.y + .28 * t; lid.rotation.x = -.9 * t; lid.position.z = b.p.z - .1 * t; }, { label: '나무 상자 뚜껑', sfx: 'open' });
  f.pullOut(p, f.spot('inside', null, -.12, .03, -.1, { part: p, maxH: .24, label: '나무 상자 안', scale: .8 }), 0, { w: .3, d: .22, up: .3 });
};

// 등불 기둥 (1×1): a black lamp post with a hanging lantern, a little '빵' flag and a pot of geraniums at its foot.
B.bklamp = (f, T) => {
  const tk = col(T, 'cloth');
  f.add(mcx('bklamp|' + tk, ({ add, tube }) => {
    add(G.cyl(.12, .14, .08, 14), IRON, 0, .04, 0); add(G.cyl(.04, .05, 2.1, 10), IRON, 0, 1.1, 0);
    tube([0, 2.0, 0], [.32, 2.0, 0], .02, IRON, 6); add(G.tor(.08, .012, PI, 4, 10), IRON, .24, 2.06, 0);
    add(G.cone(.12, .1, 4), IRON, .32, 1.92, 0, 0, PI / 4, 0); add(G.box(.14, .18, .14, .02), IRON, .32, 1.78, 0); add(G.cyl(.04, .04, .05, 6), IRON, .32, 1.66, 0);
    add(G.box(.26, .16, .015, .004), tk, -.15, 1.55, 0); tube([0, 1.63, 0], [-.28, 1.63, 0], .008, IRON, 4);
    add(lathe([[0, 0], [.13, 0], [.15, .16], [0, .16]], 14), '#f3a272', .22, 0, .2);
    for (let i = 0; i < 6; i++) add(G.sph(.06, 8, 6), i % 2 ? LEAF : LEAF2, .22 + Math.cos(i) * .07, .22 + (i % 2) * .05, .2 + Math.sin(i) * .07);
    for (let i = 0; i < 4; i++) add(G.sph(.035, 6, 5), '#ff5d6c', .22 + Math.cos(i * 1.6) * .06, .3, .2 + Math.sin(i * 1.6) * .06);
  }));
  f.add(put(mesh(G.box(.1, .13, .1, .02), mat('#fff3c6', { emissive: '#ffd27a', ei: .8 }), { cast: false }), .32, 1.78, 0));
  f.spot('behind', null, -.18, 0, -.25, { maxH: .5, label: '등불 기둥 뒤', scale: .8 });
};

// 큰 화분 (1×1): a big terracotta pot with a bushy olive tree and a little bench-step beside it.
B.bkplanter = (f, T) => {
  const woodD = col(T, 'woodD'), tk = woodD;
  f.add(mcx('bkplanter|' + tk, ({ add, tube }) => {
    add(lathe([[0, 0], [.2, 0], [.27, .4], [.3, .42], [.3, .46], [0, .46]], 18), '#e08a5a', 0, 0, -.06);
    add(G.cyl(.27, .27, .01, 18), SOIL, 0, .44, -.06);
    tube([0, .44, -.06], [0, 1.1, -.06], .035, woodD, 6); tube([0, .9, -.06], [.15, 1.2, -.02], .025, woodD, 6);
    for (let i = 0; i < 14; i++) { const a = i * 2.3, r = .14 + (i % 3) * .08; add(G.sph(.13, 10, 8), i % 2 ? '#7fb06a' : '#6a9e5c', Math.cos(a) * r, 1.2 + (i % 4) * .1, -.06 + Math.sin(a) * r * .8); }
    for (let i = 0; i < 5; i++) add(G.sph(.025, 6, 5), '#3f5f3a', Math.cos(i * 1.3) * .24, 1.25 + i * .03, -.06 + Math.sin(i * 1.3) * .2);
  }));
  f.spot('behind', null, .1, 0, -.4, { maxH: .5, label: '큰 화분 뒤', scale: .8 });
};

// ── 곰제과 v2 (10/21, 사용자 "단차 … 깔끔하고 디테일해야"; 기준 GPT bearbakery-c): big, finished pieces that carry the detail ──
// 빵 진열대 (2×1): the shop's centrepiece — a sage base with a honey top and a moulded plinth, a curved glass front (milky panes
// with white glints, honey mullions), three tiers of bread inside (croissants, buns, loaves), a glass cake dome and a jug of
// daisies on top. The case's back slides open (the baker's side): two shelves to hide things on.
B.bkcase = (f, T) => {
  const sage = col(T, 'sage'), sage2 = col(T, 'sage2'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [sage, sage2, wood, woodD].join(',');
  const W = 1.86, D = .7, H = .82, GH = .42;
  f.add(mcx('bkcase|' + tk, ({ add, tube }) => {
    add(G.box(W, .08, D, .02), woodD, 0, .04, 0);
    add(cutFace(G.box(W - .06, H - .1, D - .1, .02), 'z', -1), sage, 0, .08 + (H - .1) / 2, -.02);
    add(windowFace(W - .1, H - .14, [-.84, .84, -.2, .32]), sage, 0, .08 + (H - .1) / 2, -D / 2 + .03, 0, PI, 0);
    add(liner(1.68, .66, .54, 'z', -1), shade(sage, -.2), 0, .43, -.03);
    add(G.pbox(1.68, .02, .54), shade(sage, -.12), 0, .465, -.03);
    for (let k = 0; k < 8; k++) add(G.pbox(.04, H - .26, .012), sage2, -.78 + k * .223, .5, D / 2 - .065);
    add(G.box(W + .06, .05, D + .06, .02), wood, 0, H, 0);
    // the glass: a sloped front of milky panes, honey frame, end panes
    for (let k = 0; k < 4; k++) {
      const x = -.69 + k * .46;
      add(G.pbox(.42, GH, .01), '#e4f3fa', x, H + GH / 2 + .02, D / 2 - .14, -.35, 0, 0);
    }
    for (let k = 0; k <= 4; k++) add(G.box(.035, GH + .02, .035, .01), wood, -.92 + k * .46, H + GH / 2 + .02, D / 2 - .14, -.35, 0, 0);
    add(G.box(W + .02, .04, .3, .015), wood, 0, H + GH + .04, -.05);
    for (const sx of [-1, 1]) add(G.pbox(.012, GH, D - .2), '#e4f3fa', sx * (W / 2 - .02), H + GH / 2 + .02, -.05);
    // bread inside on two tiers
    add(G.box(W - .12, .02, .3, .006), shade(wood, .1), 0, H + .2, -.12);
    for (let k = 0; k < 6; k++) bread(add, 'croissant', -.72 + k * .29, H + .025, .05, k * .5, 1);
    for (let k = 0; k < 7; k++) bread(add, 'bun', -.75 + k * .25, H + .215, -.12, 0, .9);
    // on top: a cake stand under a glass dome, daisies, a price card
    add(lathe([[0, 0], [.05, 0], [.03, .02], [.03, .08], [.16, .09], [.16, .1], [0, .1]], 16), CREAM, -.5, H + GH + .06, -.05);
    add(G.cyl(.12, .14, .07, 16), '#f6b8c4', -.5, H + GH + .2, -.05); add(G.cyl(.12, .12, .015, 16), WHITE, -.5, H + GH + .24, -.05);
    add(new THREE.SphereGeometry(.17, 16, 8, 0, PI * 2, 0, HP), '#eef7fb', -.5, H + GH + .16, -.05, 0, 0, 0, [1, 1.15, 1]);
    add(G.sph(.025, 8, 6), BRASS, -.5, H + GH + .37, -.05);
    add(lathe([[0, 0], [.05, 0], [.06, .09], [.035, .14], [0, .14]], 12), '#eaf3fb', .55, H + GH + .06, -.08);
    for (let i = 0; i < 6; i++) { const an = i * 1.1, x = .55 + Math.cos(an) * .05, z = -.08 + Math.sin(an) * .04, y = H + GH + .28 + (i % 2) * .05;
      tube([.55, H + GH + .18, -.08], [x, y, z], .005, LEAF2, 4); add(G.cyl(.028, .028, .008, 10), WHITE, x, y, z, .3, 0, 0); add(G.sph(.012, 8, 6), HONEY, x, y + .006, z); }
    add(G.box(.12, .08, .01, .004), WHITE, .1, H + GH + .1, .08, -.3, 0, 0);
  }));
  // the baker's side: a sliding back panel
  const bp = new THREE.Group(); put(bp, 0, .5, -D / 2 + .02);
  bp.add(mc('bkcase-back|' + tk, ({ add }) => { add(G.box(W - .14, .56, .03, .01), shade(sage, -.05), 0, 0, 0); add(G.cap(.012, .1, 2, 6), BRASS, .5, 0, -.025, 0, 0, HP); }));
  f.add(bp);
  const p = f.part('door', bp, (t, b) => { bp.position.x = b.p.x - .85 * t; }, { label: '진열대 뒤 미닫이', sfx: 'drawer', dur: .3 });
  f.spot('inside', null, .4, .11, -.05, { part: p, maxH: .3, label: '진열대 아래 칸', scale: .85 });
  f.spot('inside', null, -.3, .48, -.05, { part: p, maxH: .26, label: '진열대 위 칸', scale: .8 });
  f.spot('on', null, .12, H + GH + .06, -.08, { maxH: .3, label: '진열대 위', scale: .75 });
};

// 계산대 (1×1): a honey counter with a sage panel front — a brass cash register, a little bell, a stack of paper bags, a
// jar of cookies, a basket of rolls at its foot; a drawer behind.
B.bkregister = (f, T) => {
  const sage = col(T, 'sage'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), tk = [sage, wood, woodD].join(',');
  const H = .92, D = .6, z0 = -.05;
  f.add(mcx('bkregister|' + tk, ({ add }) => {
    add(G.box(.92, .08, D, .02), woodD, 0, .04, z0);
    add(G.box(.88, H - .1, D - .06, .02), wood, 0, .08 + (H - .1) / 2, z0);
    add(G.box(.7, .5, .02, .02), sage, 0, .45, z0 + D / 2 - .02);
    add(G.box(.6, .4, .012, .01), shade(sage, .08), 0, .45, z0 + D / 2 - .008);
    add(G.box(.98, .05, D + .06, .02), woodD, 0, H, z0);
    // the register: body, keys, the drawer, a little sign
    add(G.box(.32, .14, .26, .03), BRASS, -.16, H + .1, z0 - .05);
    add(G.box(.3, .12, .16, .03), BRASS, -.16, H + .2, z0 - .12, -.4, 0, 0);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) add(G.cyl(.018, .018, .02, 8), WHITE, -.27 + k * .07, H + .19 + r * .03, z0 - .04 - r * .04, -.6, 0, 0);
    add(G.box(.2, .07, .02, .01), '#3b4b3a', -.16, H + .3, z0 - .2);
    add(G.cyl(.04, .05, .03, 12), BRASS, .2, H + .04, z0 + .12); add(G.sph(.04, 10, 6), BRASS, .2, H + .06, z0 + .12, 0, 0, 0, [1, .8, 1]); add(G.sph(.012, 6, 5), BRASS, .2, H + .11, z0 + .12);
    for (let k = 0; k < 3; k++) add(G.box(.18, .02, .12, .004), k % 2 ? '#e8cfa6' : '#f2dcb6', .24, H + .035 + k * .02, z0 - .12, 0, k * .1, 0);
    add(G.cyl(.06, .06, .16, 12), '#eef7fb', .32, H + .105, z0 + .05); add(G.cyl(.065, .065, .03, 12), col(T, 'cloth'), .32, H + .2, z0 + .05);
    for (let k = 0; k < 3; k++) add(G.cyl(.04, .04, .012, 10), BEAR, .32, H + .06 + k * .04, z0 + .05);
  }));
  const dw = drawer(f, 'bkregister-dw|' + tk, 0, H - .14, z0 - D / 2 + .01, .6, .14, sage, BRASS, shade(wood, -.1));
  dw.rotation.y = PI;
  const p = f.part('drawer', dw, (t, b) => { dw.position.z = b.p.z - .3 * t; }, { label: '계산대 서랍', sfx: 'drawer', dur: .26 });
  f.spot('inside', dw, .1, -.05, -.2, { part: p, maxH: .1, label: '계산대 서랍', scale: .75 });
  f.spot('on', null, .05, H + .025, z0 + .14, { maxH: .35, label: '계산대 위', scale: .8 });
  f.spot('behind', null, .1, 0, z0 - D / 2 - .14, { maxH: .5, label: '계산대 뒤', scale: .85 });
};

// 창가 부스 (2×2): a round-cornered booth on the little platform — a curved back with button cushions in sage gingham, a round
// honey table with a cup and a croissant, two scatter pillows, a tall plant at the open end.
B.bkbooth = (f, T) => {
  const sage = col(T, 'sage'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), cl = col(T, 'cloth'), tk = [sage, wood, woodD, cl].join(',');
  f.add(mcx('bkbooth|' + tk, ({ add }) => {
    // the bench: back row along -z, a side run along +x, a quarter-round corner
    const seat = (x, z, w, d, ry) => { add(G.box(w, .4, d, .03), wood, x, .2, z, 0, ry, 0); add(G.box(w - .04, .1, d - .04, .05), '#fff3dc', x, .45, z, 0, ry, 0); };
    seat(-.3, -.72, 1.2, .5, 0); seat(.72, .1, 1.0, .5, HP);
    add(new THREE.CylinderGeometry(.5, .5, .4, 16, 1, false, 0, HP), wood, .48, .2, -.48);
    add(new THREE.CylinderGeometry(.48, .48, .1, 16, 1, false, 0, HP), '#fff3dc', .48, .45, -.48);
    add(G.box(1.2, .55, .12, .05), sage, -.3, .76, -.92); add(G.box(.12, .55, 1.0, .05), sage, .92, .76, .1);
    add(new THREE.CylinderGeometry(.67, .67, .55, 16, 1, true, 0, HP), sage, .3, .76, -.32);
    for (let k = 0; k < 4; k++) add(G.sph(.02, 6, 5), shade(sage, -.25), -.75 + k * .3, .8, -.855);
    for (let k = 0; k < 3; k++) add(G.sph(.02, 6, 5), shade(sage, -.25), .855, .8, -.25 + k * .3);
    add(G.box(1.3, .04, .16, .02), woodD, -.3, 1.05, -.92); add(G.box(.16, .04, 1.1, .02), woodD, .92, 1.05, .1);
    // pillows, table, cup, croissant
    add(G.box(.3, .28, .1, .06), cl, -.6, .62, -.78, -.2, .2, 0); add(G.box(.28, .26, .1, .06), HONEY, .78, .62, .3, -.2, -HP + .3, 0);
    add(G.cyl(.06, .08, .7, 10), woodD, -.05, .35, .05); add(G.cyl(.22, .25, .03, 16), woodD, -.05, .015, .05);
    add(G.cyl(.4, .4, .045, 24), wood, -.05, .72, .05);
    add(G.cyl(.05, .04, .07, 12), WHITE, -.15, .78, .12); add(G.cyl(.08, .08, .01, 14), WHITE, .1, .75, -.05); bread(add, 'croissant', .1, .755, -.05, .5, .9);
    add(lathe([[0, 0], [.04, 0], [.05, .08], [.03, .12], [0, .12]], 12), '#eaf3fb', -.2, .74, -.15);
    for (let i = 0; i < 4; i++) add(G.sph(.03, 8, 6), [JAM, WHITE, HONEY, JAM][i], -.2 + Math.cos(i * 1.6) * .04, .9 + (i % 2) * .03, -.15 + Math.sin(i * 1.6) * .03);
  }));
  f.spot('under', null, -.05, 0, .25, { maxH: .55, label: '부스 테이블 밑', scale: .85 });
  f.spot('on', null, -.25, .735, .2, { maxH: .35, label: '부스 테이블 위', scale: .8 });
  f.spot('on', null, .72, .5, .45, { maxH: .35, label: '부스 의자 위', scale: .8 });
};

// 빵 벽 선반 (1×1): a tall honey rack against the wall with a scalloped top — four slanted shelves of wicker baskets (baguettes,
// loaves, buns, croissants), little chalk price tags, a gingham cloth on top.
B.bkrack = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), cl = col(T, 'cloth'), tk = [wood, woodD, cl].join(',');
  const W = .9, D = .44, z0 = -.26, H = 1.9, YS = [.12, .56, 1.0, 1.44];
  f.add(mcx('bkrack|' + tk, ({ add, tube }) => {
    for (const sx of [-1, 1]) add(G.box(.06, H, D, .015), wood, sx * (W / 2 - .03), H / 2, z0);
    add(G.pbox(W - .06, H - .1, .02), shade(wood, .08), 0, H / 2, z0 - D / 2 + .02);
    add(G.box(W + .06, .06, D + .04, .02), woodD, 0, H + .03, z0);
    for (let k = 0; k < 4; k++) add(G.sph(.08, 10, 6), woodD, -.33 + k * .22, H + .04, z0 + D / 2 - .02, 0, 0, 0, [1, .7, .4]);
    YS.forEach((y, i) => {
      add(G.box(W - .06, .03, D - .02, .008), wood, 0, y, z0, .12, 0, 0);
      add(G.box(W - .06, .06, .02, .006), woodD, 0, y + .05, z0 + D / 2 - .02);
      for (const x of [-.2, .2]) {
        add(G.box(.36, .12, .3, .03), i % 2 ? WICKER : WICKER2, x, y + .08, z0 + .02, .12, 0, 0);
        const kind = ['baguette', 'loaf', 'bun', 'croissant'][i];
        if (kind === 'baguette') for (const dz of [-.06, .04]) bread(add, 'baguette', x, y + .1, z0 + dz, .1, .7);
        else if (kind === 'loaf') bread(add, 'loaf', x, y + .12, z0, 0, .8);
        else for (const dx of [-.08, .08]) bread(add, kind, x + dx, y + .12, z0 + .02, dx * 4, .9);
        add(G.box(.1, .06, .01, .004), CHALK, x, y + .02, z0 + D / 2 + .005);
        add(G.box(.06, .008, .004, .002), WHITE, x, y + .025, z0 + D / 2 + .012);
      }
    });
  }));
  f.add(pm('bkrack-cloth|' + tk, mat('#ffffff', { map: gingham(cl), rough: .9, rim: .1 }), .12, ({ add }) => add(G.box(W - .1, .015, D * .7, .006), 0, H + .065, z0)));
  f.spot('on', null, .2, YS[1] + .02, z0 + .12, { maxH: .26, label: '빵 선반 둘째 칸', scale: .75 });
  f.spot('on', null, -.2, YS[2] + .02, z0 + .12, { maxH: .26, label: '빵 선반 셋째 칸', scale: .75 });
};

// 가게 앞 창 (2×1, the room's front edge; faces +z = outside, toward the camera): the shop front cut away low like the walls —
// white clapboard outside, a honey-framed display window full of bread, a short striped awning, a flower box spilling
// daisies and ivy, a stone plinth; inside it reads as a deep window seat.
B.bkfront = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), sage = col(T, 'sage'), tk = [wood, woodD, sage].join(',');
  const W = 2, H = 1.25, z0 = .3, TH = .18;
  f.add(mcx('bkfront|' + tk, ({ add }) => {
    add(G.box(W, .22, TH + .06, .02), '#d6cfc2', 0, .11, z0);
    for (let k = 0; k < 4; k++) add(G.box(W / 4 - .02, .2, .02, .01), shade('#d6cfc2', (k % 2) * -.06), -W * 3 / 8 + k * W / 4, .11, z0 + TH / 2 + .035);
    // the wall, clapboard outside, a cream inside face, a chunky cap
    add(G.box(W, H - .22, TH, .02), PAINT, 0, .22 + (H - .22) / 2, z0);
    for (let r = 0; r < 5; r++) add(G.pbox(W - .02, .2, .02), r % 2 ? PAINT : '#f2ede4', 0, .32 + r * .19, z0 + TH / 2 + .01, -.06, 0, 0);
    add(G.box(W + .08, .07, TH + .1, .025), woodD, 0, H + .02, z0);
    // the display window (a bay through the wall), bread on its shelf
    add(G.box(1.1, .62, TH + .06, .02), wood, -.3, .78, z0);
    add(G.pbox(.98, .5, TH + .07), '#f6e7c8', -.3, .78, z0);
    for (const x of [-.6, -.3, 0]) bread(add, x === -.3 ? 'loaf' : 'bun', x, .53, z0, 0, x === -.3 ? .7 : 1);
    add(G.pbox(.98, .5, .008), '#e4f3fa', -.3, .78, z0 + TH / 2 + .04);
    add(G.box(.04, .5, .03, .01), wood, -.3, .78, z0 + TH / 2 + .05);
    // the awning, low over the window, and the flower box below it
    awning(add, -.3, 1.2, 1.3, .38, sage, WHITE, z0 + TH / 2);
    add(G.box(1.2, .16, .2, .02), woodD, -.3, .38, z0 + TH / 2 + .1);
    for (let i = 0; i < 9; i++) { const x = -.84 + i * .135; add(G.sph(.075, 8, 6), i % 2 ? LEAF : LEAF3, x, .5, z0 + TH / 2 + .12); add(G.sph(.032, 6, 5), [WHITE, '#ffb3c6', HONEY][i % 3], x + .03, .56, z0 + TH / 2 + .18); }
    leaves(add, -.88, .45, z0 + TH / 2 + .2, 6, LEAF, LEAF2, .9, .35);
    // the right part: a little wall lantern and a brass house number
    add(G.box(.04, .16, .1, .01), IRON, .62, .95, z0 + TH / 2 + .03); add(G.box(.12, .16, .12, .03), IRON, .62, .88, z0 + TH / 2 + .1);
    add(G.cyl(.07, .07, .015, 16), BRASS, .35, .7, z0 + TH / 2 + .02, HP, 0, 0);
  }));
  f.add(put(mesh(G.box(.08, .1, .08, .02), mat('#fff3c6', { emissive: '#ffd27a', ei: .8 }), { cast: false }), .62, .88, z0 + .2));
  f.spot('on', null, -.3, .525, z0 - .04, { maxH: .26, label: '진열 창 안', scale: .75 });
  f.spot('on', null, .45, H + .055, z0, { maxH: .3, label: '창 턱 위', scale: .75 });
};

// ── fix1029 32~40판 허접한 모델 다시 (19판 이상) ──
// (fix1029 허브 10/29 사용자 "1~18판은 완벽하니 건들지 말고 19부터": 아래 새 모양은 19판 이상에서만 — scenes/stage.js가 방을 짓기 전에
// 판 번호를 globalThis.__sbkStage에 둠(⑩ gate19 패치). 1~18판은 원래 빌더 그대로)
const late19 = () => (globalThis.__sbkStage ?? -1) >= 18;
const FLOUR_LABEL = () => TEX.get('flourlabel', () => textTex(160, 120, (c, w, h) => {
  c.fillStyle = '#f7ead0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b8692c'; c.lineWidth = 4; c.strokeRect(4, 4, w - 8, h - 8);
  c.strokeStyle = '#c98a3c'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2, h * .62); c.lineTo(w / 2, h * .18); c.stroke();
  c.fillStyle = '#c98a3c'; for (let k = 0; k < 4; k++) for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(w / 2 + sx * 6, h * .24 + k * 9, 5, 3, sx * .6, 0, Math.PI * 2); c.fill(); }
  fitText(c, '밀가루', w / 2, h * .8, w * .84, 26, '#8a4a22');
}));
const floursacksLate = (f, T) => {
  const woodD = col(T, 'woodD'), wood = col(T, 'wood'), tk = [wood, woodD].join(',');
  const SQ = .72;
  f.add(mcx('floursacks2|' + tk, ({ add, tube }) => {
    const sack = (x, z, h, ry, open, tilt = 0) => {
      const M = xf(x, 0, z, 0, ry, tilt);
      const at = (g, c, px, py, pz, rx = 0, rry = 0, rz = 0, s = 1) => add(g, c, 0, 0, 0, 0, 0, 0, 1, M.clone().multiply(xf(px, py, pz, rx, rry, rz, s)));
      const R = .2;
      if (open) {
        at(lathe([[0, 0], [R * .78, 0], [R * .96, h * .1], [R, h * .45], [R * .95, h * .8], [R * .9, h]], 18), BURLAP, 0, 0, 0, 0, 0, 0, [1, 1, SQ]);
        at(G.tor(R * .92, .035, PI * 2, 6, 18), BURLAP2, 0, h - .01, 0, HP, 0, 0, [1, SQ, 1]);
        at(G.cyl(R * .86, R * .86, .02, 18), FLOUR, 0, h - .03, 0, 0, 0, 0, [1, 1, SQ]);
        at(G.sph(R * .8, 14, 8), FLOUR, 0, h - .03, 0, 0, 0, 0, [1, .42, SQ]);
        at(G.cyl(.05, .045, .05, 12), WICKER2, .06, h + .05, .0, 0, 0, .5);
        at(G.cap(.014, .16, 2, 6), WICKER2, .15, h + .12, -.02, 0, 0, -1.0);
      } else {
        at(lathe([[0, 0], [R * .8, 0], [R * .98, h * .1], [R, h * .42], [R * .9, h * .7], [R * .45, h * .9], [R * .2, h * .97], [0, h * .97]], 18), BURLAP, 0, 0, 0, 0, 0, 0, [1, 1, SQ]);
        at(G.cyl(R * .2, R * .26, h * .1, 12), BURLAP2, 0, h * .99, 0);
        at(G.tor(R * .22, .014, PI * 2, 4, 14), WICKER2, 0, h * .99, 0, HP, 0, 0);
        for (let k = 0; k < 7; k++) { const a = k / 7 * PI * 2; at(G.sph(.04, 7, 5), k % 2 ? BURLAP : BURLAP2, Math.cos(a) * .045, h * 1.06, Math.sin(a) * .045, Math.sin(a) * .7, 0, -Math.cos(a) * .7, [.7, 1.2, .5]); }
        at(G.cap(.006, .07, 2, 4), WICKER2, .05, h * .94, .03, .3, 0, .9);
      }
      for (let k = 0; k < 5; k++) at(G.box(.012, .022, .006, .002), BURLAP2, R * .97, h * (.1 + k * .1), 0, 0, 0, .04);
    };
    sack(-.2, -.2, .5, .2, false, .04); sack(.18, -.22, .44, -.15, true); sack(-.05, .12, .34, .5, false, -.08);
    for (const [x, z, s] of [[.02, .3, .09], [-.28, .1, .06], [.32, -.02, .07]]) add(G.sph(s, 10, 6), FLOUR, x, .004, z, 0, 0, 0, [1.4, .08, 1]);
    const CX = .25, CZ = .22;
    for (const [dx, dz, w, d] of [[0, -.11, .3, .02], [0, .11, .3, .02], [-.14, 0, .02, .22], [.14, 0, .02, .22]]) for (let k = 0; k < 3; k++) add(G.box(w, .04, d, .006), k % 2 ? wood : shade(wood, -.05), CX + dx, .025 + k * .05, CZ + dz, 0, -.3, 0);
    add(G.pbox(.27, .02, .2), woodD, CX, .012, CZ, 0, -.3, 0);
    for (let k = 0; k < 5; k++) add(G.sph(.048, 10, 8), JAM, CX - .08 + (k % 3) * .08 * Math.cos(.3), .15 + (k > 2 ? .03 : 0), CZ - .04 + (k > 2 ? .07 : 0) + (k % 3) * .08 * Math.sin(.3));
    for (let k = 0; k < 5; k++) add(G.cap(.005, .016, 2, 4), SOIL, CX - .08 + (k % 3) * .08 * Math.cos(.3), .2 + (k > 2 ? .03 : 0), CZ - .04 + (k > 2 ? .07 : 0) + (k % 3) * .08 * Math.sin(.3));
    add(G.sph(.03, 8, 6), LEAF, CX + .02, .2, CZ - .02, 0, 0, .6, [1.3, .4, .8]);
  }));
  for (const [x, z, h, ry, tilt] of [[-.2, -.2, .5, .2, .04], [-.05, .12, .34, .5, -.08]]) {
    const lab = mesh(geo('flourlabel-q', () => new THREE.PlaneGeometry(.15, .11)), mat('#ffffff', { map: FLOUR_LABEL(), rim: 0 }), { cast: false });
    const g = new THREE.Group(); put(g, x, 0, z, 0, ry, tilt); g.add(put(lab, 0, h * .38, .2 * SQ + .004)); f.add(g);
  }
  f.spot('behind', null, .02, 0, -.42, { maxH: .5, label: '밀가루 포대 뒤', scale: .8 });
  f.spot('on', null, .3, .16, .26, { maxH: .3, label: '사과 상자 위', scale: .75 });
};
{ const old = B.floursacks; B.floursacks = (f, T, o) => (late19() ? floursacksLate(f, T, o) : old(f, T, o)); }

export const BAKERY_BUILDERS = B;
export const BAKERY_INFO = {
  stove: { w: 2, d: 1, name: '벽돌 화덕', price: 0, hidden: true },
  breadcab: { w: 1, d: 1, name: '빵 진열장', price: 0, hidden: true },
  bakecounter: { w: 1, d: 1, name: '반죽대', price: 0, hidden: true },
  bakesink: { w: 1, d: 1, name: '개수대', price: 0, hidden: true },
  bakeisland: { w: 2, d: 1, name: '아일랜드 조리대', price: 0, hidden: true },
  cafeset: { w: 2, d: 1, name: '카페 식탁', price: 0, hidden: true },
  breadbasket: { w: 1, d: 1, name: '빵 바구니', price: 0, hidden: true },
  floursacks: { w: 1, d: 1, name: '밀가루 포대', price: 0, hidden: true },
  bakejars: { wall: true, span: 2, name: '병 선반', price: 0, hidden: true },
  potrail: { wall: true, span: 1, name: '냄비 걸이', price: 0, hidden: true },
  ginghamwin: { wall: true, span: 2, name: '깅엄 커튼 창', price: 0, hidden: true },
  chalkmenu: { wall: true, span: 1, name: '오늘의 빵 메뉴판', price: 0, hidden: true },
  breadcart: { w: 1, d: 1, name: '빵 식힘 수레', price: 0, hidden: true },
  bkcase: { w: 2, d: 1, name: '빵 진열대', price: 0, hidden: true },
  bkregister: { w: 1, d: 1, name: '계산대', price: 0, hidden: true },
  bkbooth: { w: 2, d: 2, name: '창가 부스', price: 0, hidden: true },
  bkrack: { w: 1, d: 1, name: '빵 벽 선반', price: 0, hidden: true },
  bkfront: { w: 2, d: 1, name: '가게 앞 창', price: 0, hidden: true },
  bkfacade: { wall: true, span: 3, name: '곰제과 가게 정면', price: 0, hidden: true },
  bkstall: { w: 2, d: 1, name: '빵 좌판', price: 0, hidden: true },
  bkparasol: { w: 1, d: 1, name: '파라솔 테이블', price: 0, hidden: true },
  bkcrates: { w: 1, d: 1, name: '나무 상자 더미', price: 0, hidden: true },
  bklamp: { w: 1, d: 1, name: '등불 기둥', price: 0, hidden: true },
  bkplanter: { w: 1, d: 1, name: '큰 화분', price: 0, hidden: true },
};

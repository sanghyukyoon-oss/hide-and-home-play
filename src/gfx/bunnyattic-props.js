// 토순이 다락 놀이방 (2판 bunnyattic, 10/20 — 사용자 "그냥 보기에 ㅈㄴ 이쁘면 됨"; GPT 컨셉 bunnyattic-a·b): a playroom up under
// the roof. The walls' tops slope down from the back corner like a roof seen from inside (atticTop, hung on each wall so it
// folds with it), chunky timber along them; a round window with a deep sill and a window seat under it (two drawers — the
// drawer lesson), a front-facing picture-book rack, a teepee with a star pillow, a green toy trunk and a low shelf with a
// bunny lamp under the loft bed, a wicker toy basket, a cloud rug with a wooden train, a dollhouse, a pile of floor cushions,
// pennant bunting and little frames. The loft and its bed are room.js's (lofts + futon).
// Same contract as house-props.js: origin = footprint centre on the floor, the piece faces +z, back toward -z, 1 tile = 1;
// wall pieces hang on a wall's inner face (origin at the face, floor height, +z into the room). Static decor is ONE
// vertex-coloured mesh per piece (hmc), every moving part its own mesh. Nothing here is sold (hidden: true).
import * as THREE from 'three';
import { put, mat, mesh, canvasTex, texCache, shade, extrude, starShape, heartShape } from './kit.js';
import { HG as G, hxf as xf, hmc as mc, hleaves as leaves } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const K = { wood: '#f2c48c', woodD: '#c98d55', body: '#fff8f1', accent: '#ff9fb0', accent2: '#9ed3b4', accent3: '#ffb347', knob: '#ffd84a',
  fabric: '#ffc2cc', fabric2: '#ffe4e8', rug: '#fff6ea', rug2: '#ffc2cc', lilac: '#c9b6f2', sage: '#a9cf9c', beam: '#b97a48' };
const col = (T, k) => (T && T[k]) || K[k];
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', SKY = '#8fd3f4', SKY2 = '#d9f1fb', HONEY = '#ffcf5c', CARROT = '#ff9a3c',
  LEAF = '#6cc46a', LEAF2 = '#4ea85a', LEAF3 = '#8fd47a', BLUSH = '#ff9fb5', BRASS = '#e8b84a', TOMATO = '#ff6b57', LILAC = '#c9b6f2',
  MINT = '#9fe0c8', BUTTER = '#ffe58a', SOIL = '#8a5a3c', WICKER = '#e3b27a', WICKER2 = '#c98f52', PLUSH = '#fffaf6';
const lathe = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
const dome = (r, ws = 16, hs = 6) => new THREE.SphereGeometry(r, ws, hs, 0, PI * 2, 0, HP);

// a tiny bunny (plush, figurine): body, head, two ears, pink inner ears, eyes — added into an mc at (x, y, z), turned ry
function bunny(add, x, y, z, s = 1, c = PLUSH, ry = 0) {
  const M = xf(x, y, z, 0, ry, 0, s), A = (g, cc, px, py, pz, rx = 0, ry2 = 0, rz = 0, sc = 1) => add(g, cc, 0, 0, 0, 0, 0, 0, 1, M.clone().multiply(xf(px, py, pz, rx, ry2, rz, sc)));
  A(G.sph(.1, 14, 10), c, 0, .09, 0, 0, 0, 0, [1, .9, .9]);
  A(G.sph(.085, 14, 10), c, 0, .22, .02);
  for (const sx of [-1, 1]) { A(G.cap(.028, .1, 2, 8), c, sx * .035, .33, 0, 0, 0, sx * -.18); A(G.cap(.014, .07, 2, 6), BLUSH, sx * .035, .33, .016, 0, 0, sx * -.18); }
  for (const sx of [-1, 1]) A(G.sph(.011, 6, 5), INK, sx * .032, .23, .095);
  A(G.sph(.012, 6, 5), BLUSH, 0, .205, .103);
  for (const sx of [-1, 1]) A(G.sph(.035, 8, 6), c, sx * .06, .02, .06, 0, 0, 0, [1, .6, 1.3]);
}
// mc's add with an optional full matrix (bunny() and friends build in their own frame)
function mcx(key, fn) {
  return mc(key, ({ add, addM, tube }) => {
    const add2 = (src, color, x, y, z, rx, ry, rz, s, M) => (M ? addM(src, M, color) : add(src, color, x, y, z, rx, ry, rz, s));
    fn({ add: add2, addM, tube });
  });
}

// ── 다락 지붕 경사 (room.js buildWall, L.attic): the wall's top goes up toward the room's back corner (-x, -z) like the
// underside of a roof — the room's tops lie on one tilted plane, h = WH + rise · ((½ − x/w) + (½ − z/d)) / 2, so the four
// walls meet at their corners. A wallpapered wedge (the wall's own paper, the same scale), its white edge, a chunky barge
// beam along the slope with a little overhang, a tie beam at the wall's old top and two struts.
//   k: the wall · len: its length · WH: its height · w, d: the room · tex: the wall's paper (a clone is made) · o.rise
export function atticTop(k, len, WH, w, d, T, tex, o = {}) {
  if (o.gable) return gableTop(k, len, WH, w, d, T, tex, o);
  const rise = o.rise ?? 1.6, WT = .16;
  // local x along the wall → world (x, z), as room.js turns its walls
  const at = u => (k === 'N' ? [u, -d / 2] : k === 'S' ? [-u, d / 2] : k === 'W' ? [-w / 2, -u] : [w / 2, u]);
  const h = u => { const [x, z] = at(u); return WH + rise * ((.5 - x / w) + (.5 - z / d)) / 2; };
  const a = -len / 2, b = len / 2, ha = h(a), hb = h(b);
  const g = new THREE.Group();
  if (Math.max(ha, hb) - WH < .05) return g;
  const wood = col(T, 'woodD'), beam = col(T, 'beam'), edge = T.wallEdge || '#fff6ee';
  // the wedge: an extruded quad (the wall's thickness), the paper on its room side
  const sh = new THREE.Shape(); sh.moveTo(a, WH - .02); sh.lineTo(b, WH - .02); sh.lineTo(b, hb); sh.lineTo(a, ha); sh.lineTo(a, WH - .02);
  const body = new THREE.ExtrudeGeometry(sh, { depth: WT, bevelEnabled: false }); body.translate(0, 0, -WT);
  g.add(mesh(body, mat(edge, { rough: .9, rim: .1 })));
  const pg = new THREE.ShapeGeometry(sh), P = pg.attributes.position, uv = new Float32Array(P.count * 2);
  const kv = .62 * 2.5 / (2.5 - .86) / 1.6;   // room.js's wallpaper scale: 1.6 m across, squashed the same way up the wall
  for (let i = 0; i < P.count; i++) { uv[i * 2] = (P.getX(i) - a) / 1.6; uv[i * 2 + 1] = (P.getY(i) - .86) * kv; }
  pg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const pt = tex.clone(); pt.needsUpdate = true; pt.repeat.set(1, 1);
  g.add(put(mesh(pg, mat('#ffffff', { map: pt, rough: .9, rim: .1 }), { cast: false }), 0, 0, .003));
  // timber: the barge beam on the slope (over the wall's top, out past its low end), a tie beam, two struts
  const L = Math.hypot(b - a, hb - ha), ang = Math.atan2(hb - ha, b - a), ov = .22;
  g.add(mc('atticbeam|' + [k, len, WH, rise, w, d, beam, wood].join(','), ({ add }) => {
    const cx = (a + b) / 2, cy = (ha + hb) / 2;
    add(G.box(L + ov * 2, .2, WT + .16, .03), beam, cx, cy + .07, -WT / 2 + .02, 0, 0, ang);
    add(G.box(len, .14, .14, .025), wood, cx, WH + .02, .06);
    // struts from the tie beam up to the slope, a third of the way along from each end, and little pegs
    for (const t of [.3, .7]) {
      const u = a + (b - a) * t, top = ha + (hb - ha) * t;
      if (top - WH < .25) continue;
      add(G.box(.11, top - WH, .1, .02), wood, u, (WH + top) / 2, .05);
      add(G.sph(.022, 8, 6), shade(wood, -.15), u, WH + .02, .135);
    }
    // the high end's rafter foot: a bracket under the beam where two walls meet
    const hiU = ha > hb ? a + .08 : b - .08, hiY = Math.max(ha, hb);
    add(G.box(.14, .5, .12, .02), wood, hiU, hiY - .3, .04);
  }));
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return g;
}

// a proper gable (다락 3차 10/21, user "모양이 이상해. 지붕까지 일부 그려 주던가"): the back wall rises to a peak over the room's
// middle like the end of a pitched roof; the side wall stays a low knee wall and carries the roof's skeleton — a ridge beam
// from the peak toward the front, rafters from the knee wall up to it, and the first boards of the roof between the first
// rafters — so it reads as under a roof while the room stays open to the camera
function gableTop(k, len, WH, w, d, T, tex, o) {
  const rise = o.rise ?? 1.4, WT = .16, g = new THREE.Group(), wood = col(T, 'woodD'), beam = col(T, 'beam'), edge = T.wallEdge || '#fff6ee';
  if (k === 'N') {
    const a = -len / 2, b = len / 2, px = 0;
    const sh = new THREE.Shape(); sh.moveTo(a, WH - .02); sh.lineTo(b, WH - .02); sh.lineTo(px, WH + rise); sh.lineTo(a, WH - .02);
    const body = new THREE.ExtrudeGeometry(sh, { depth: WT, bevelEnabled: false }); body.translate(0, 0, -WT);
    g.add(mesh(body, mat(edge, { rough: .9, rim: .1 })));
    const pg = new THREE.ShapeGeometry(sh), P = pg.attributes.position, uv = new Float32Array(P.count * 2), kv = .62 * 2.5 / (2.5 - .86) / 1.6;
    for (let i = 0; i < P.count; i++) { uv[i * 2] = (P.getX(i) - a) / 1.6; uv[i * 2 + 1] = (P.getY(i) - .86) * kv; }
    pg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const pt = tex.clone(); pt.needsUpdate = true; pt.repeat.set(1, 1);
    g.add(put(mesh(pg, mat('#ffffff', { map: pt, rough: .9, rim: .1 }), { cast: false }), 0, 0, .003));
    const L = Math.hypot(len / 2, rise), ang = Math.atan2(rise, len / 2);
    g.add(mc('gableN|' + [len, WH, rise, beam, wood].join(','), ({ add }) => {
      for (const s of [-1, 1]) add(G.box(L + .3, .2, WT + .16, .03), beam, s * len / 4, WH + rise / 2 + .08, -WT / 2 + .02, 0, 0, -s * ang);
      add(G.box(len, .14, .14, .025), wood, 0, WH + .02, .06);
      add(G.box(.13, rise - .05, .1, .02), wood, 0, WH + rise / 2, .05);
      for (const s of [-1, 1]) add(G.box(.09, rise * .55, .08, .02), wood, s * len * .17, WH + rise * .3, .05, 0, 0, s * .55);
    }));
  } else if (k === 'W') {
    // the roof's skeleton, in the W wall's own frame (x along the wall, +z into the room): rafters from the knee wall's top up
    // to the ridge over the room's middle, the ridge itself, and boards between the two rafters nearest the back
    const zr = w / 2, n = Math.max(3, Math.round(len / .9));
    const L = Math.hypot(zr, rise), ang = Math.atan2(rise, zr);
    // (the skeleton meets the back gable: it goes whenever either wall folds, so it never hangs in the air — room.js roofBits)
    const sk = mc('gableW|' + [len, WH, rise, w, beam, wood].join(','), ({ add }) => {
      add(G.box(len + .2, .18, .18, .03), beam, 0, WH + rise + .02, zr);
      for (let q = 0; q <= n; q++) { const u = -len / 2 + len * q / n; add(G.box(.12, .14, L + .2, .02), beam, u, WH + rise / 2 + .05, zr / 2, -ang, 0, 0); }
      add(G.box(len, .12, .14, .02), wood, 0, WH + .04, .08);
      // roof boards over the back bay (toward the gable): the room's sky stays open at the front
      const u0 = len / 2 - len / n, u1 = len / 2;
      for (let r = 0; r < 6; r++) { const t = (r + .5) / 6; add(G.box(u1 - u0, .035, L / 6 - .02, .01), r % 2 ? shade(wood, .12) : shade(wood, .06), (u0 + u1) / 2, WH + rise * t + .14, zr * t, -ang, 0, 0); }
    });
    sk.userData.needs = ['N', 'W']; g.add(sk);
  }
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  return g;
}

const B = {};

// 동그란 다락 창 (wall, span 2): a big round window — a thick honey frame and its deep reveal, four panes, a soft sky with the
// garden's trees outside, a deep sill with a pot of daisies and a tiny bunny figurine, ivy trailing down from the frame.
B.roundwin = (f, T, o = {}) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc = col(T, 'accent'), tk = [wood, woodD, acc].join(',');
  const R = .6, cy = o.cy ?? 1.76;
  f.add(mcx('roundwin|' + tk, ({ add, tube }) => {
    add(G.cyl(R + .02, R + .02, .14, 36, true), shade(wood, -.08), 0, cy, .08, HP, 0, 0);   // the reveal
    add(G.tor(R + .02, .075, PI * 2, 8, 40), wood, 0, cy, .15);
    add(G.tor(R + .14, .03, PI * 2, 6, 40), shade(wood, .06), 0, cy, .1);
    add(G.cyl(R + .01, R + .01, .01, 36), SKY2, 0, cy, .016, HP, 0, 0);
    // outside (in front of the paper, inside the circle): two round trees, a cloud
    add(G.cyl(.3, .3, .01, 20), LEAF3, -.24, cy - .3, .024, HP, 0, 0, [1, 1, .8]);
    add(G.cyl(.24, .24, .01, 20), LEAF, .26, cy - .36, .028, HP, 0, 0, [1, 1, .7]);
    add(G.cyl(.36, .36, .01, 24), LEAF2, 0, cy - .55, .032, HP, 0, 0, [1.3, 1, .32]);
    add(G.cyl(.08, .08, .01, 14), WHITE, -.2, cy + .3, .026, HP, 0, 0, [1.6, 1, .8]); add(G.cyl(.06, .06, .01, 14), WHITE, -.1, cy + .33, .028, HP, 0, 0, [1.4, 1, .8]);
    add(G.box(.06, R * 2, .06, .015), wood, 0, cy, .1); add(G.box(R * 2, .06, .06, .015), wood, 0, cy, .1);
    // the sill and what stands on it
    add(G.box(1.32, .07, .3, .02), wood, 0, cy - R - .03, .12);
    add(G.box(1.2, .05, .06, .015), woodD, 0, cy - R - .09, .24);
    const sy = cy - R + .005;
    add(lathe([[0, 0], [.07, 0], [.085, .11], [.095, .12], [.095, .135], [0, .135]], 16), '#f3a272', -.38, sy, .1);
    add(G.cyl(.08, .08, .01, 14), SOIL, -.38, sy + .13, .1);
    for (let i = 0; i < 6; i++) { const an = i * 1.1, r = .05 + (i % 2) * .03, x = -.38 + Math.cos(an) * r, z = .1 + Math.sin(an) * r * .6, y = sy + .2 + (i % 3) * .04;
      tube([-.38, sy + .13, .1], [x, y, z], .006, LEAF2, 4);
      add(G.cyl(.032, .032, .01, 10), WHITE, x, y, z, .3, 0, 0); add(G.sph(.014, 8, 6), HONEY, x, y + .007, z); }
    bunny(add, .36, sy, .12, .55, PLUSH, -.4);
    // ivy from the top left, trailing down past the frame
    leaves(add, -.5, cy + .5, .2, 7, LEAF, LEAF2, 1.1, .5);
    leaves(add, -.62, cy + .15, .2, 6, LEAF2, LEAF3, 1, .45);
    leaves(add, .52, cy + .46, .2, 4, LEAF3, LEAF, .9, .2);
  }));
  f.spot('on', null, .08, cy - R + .005, .12, { maxH: .3, label: '동그란 창틀 위', scale: .8 });
};

// 창가 의자 (2×1): a window seat — a low honey bench with two sage drawers (carrot knobs), a pink cushion pad with piping and
// three pillows against the wall (a heart, a round and a bunny-eared one). The drawers are the drawer lesson's.
B.windowseat = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), sage = col(T, 'accent2'), pink = col(T, 'fabric'), pink2 = col(T, 'fabric2'), knob = col(T, 'accent3'), body = col(T, 'body');
  const tk = [wood, woodD, sage, pink, pink2, knob, body].join(',');
  const W = 1.86, D = .62, z0 = -.17, H = .44, FZ = z0 + D / 2;
  f.add(mcx('windowseat|' + tk, ({ add }) => {
    add(G.box(W, .06, D - .04, .01), shade(woodD, -.1), 0, .03, z0);   // plinth
    add(G.box(W, H - .06, D, .03), body, 0, (H + .06) / 2, z0);
    for (const sx of [-1, 1]) add(G.box(.07, H, D + .02, .02), wood, sx * (W / 2 - .03), H / 2, z0);
    add(G.box(.06, H - .1, .03, .01), wood, 0, H / 2, FZ + .01);
    add(G.box(W + .04, .05, D + .04, .02), wood, 0, H + .025, z0);
    // the pad, its piping, the pillows
    add(G.box(W - .1, .11, D - .06, .05), pink, 0, H + .1, z0 + .01);
    add(G.box(W - .06, .025, .03, .012), WHITE, 0, H + .06, FZ - .02);
    add(G.box(.42, .34, .14, .07), pink2, -.6, H + .32, z0 - .2, -.18, .12, 0);
    for (let k = 0; k < 9; k++) add(G.sph(.018, 6, 5), pink, -.6 - .16 + k * .04, H + .32 + Math.sin(k) * .1, z0 - .12, 0, 0, 0, [1, 1, .4]);
    const hs = new THREE.Shape(); hs.moveTo(0, -.15); hs.bezierCurveTo(-.24, .02, -.1, .2, 0, .07); hs.bezierCurveTo(.1, .2, .24, .02, 0, -.15);
    add(G.ext(hs, .09, .03, 8), HONEY, .02, H + .33, z0 - .2, -.15, 0, 0);
    add(G.sph(.17, 14, 10), sage, .58, H + .27, z0 - .16, 0, 0, 0, [1, 1, .55]);
    for (const sx of [-1, 1]) add(G.cap(.04, .1, 2, 8), sage, .58 + sx * .07, H + .46, z0 - .2, 0, 0, sx * -.3);
  }));
  // two drawers
  [-.46, .46].forEach((x, i) => {
    const pv = new THREE.Group(); put(pv, x, .22, FZ);
    pv.add(mc('windowseat-d' + i + '|' + tk, ({ add }) => {
      add(G.box(.82, .27, .04, .02), sage, 0, 0, .02);
      add(G.box(.7, .17, .012, .01), shade(sage, .08), 0, 0, .042);
      add(G.cone(.03, .09, 8), knob, 0, 0, .075, HP, 0, 0); add(G.cap(.008, .03, 2, 5), LEAF2, 0, 0, .03, HP, 0, 0);
      const inner = shade(body, -.1);
      add(G.pbox(.76, .02, .48), inner, 0, -.115, -.25);
      for (const sx of [-1, 1]) add(G.pbox(.02, .2, .48), inner, sx * .37, -.03, -.25);
      add(G.pbox(.76, .2, .02), inner, 0, -.03, -.48);
      add(G.box(.14, .04, .14, .02), i ? BLUSH : BUTTER, .24, -.085, -.36);
    }));
    f.add(pv);
    const p = f.part('drawer', pv, (t, b) => { pv.position.z = b.p.z + .36 * t; }, { label: i ? '창가 의자 오른쪽 서랍' : '창가 의자 왼쪽 서랍', sfx: 'drawer', dur: .26 });
    f.spot('inside', pv, -.08, -.105, -.22, { part: p, maxH: .18, label: i ? '창가 의자 오른쪽 서랍' : '창가 의자 왼쪽 서랍', scale: .85 });
    if (!i) { p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: .2, y: .02, z: .06, parent: pv }; }
  });
  // the round pillow lifts off a spot on the pad; and on the pad in plain sight
  const pil = new THREE.Group(); put(pil, .2, H + .16, z0 + .06);
  pil.add(mc('windowseat-pil|' + tk, ({ add }) => { add(G.sph(.16, 14, 10), pink2, 0, .06, 0, 0, 0, 0, [1.2, .5, 1]); add(G.tor(.1, .012, PI * 2, 4, 20), WHITE, 0, .1, 0, HP, 0, 0); }));
  f.add(pil);
  const pp = f.part('lift', pil, (t, b) => { pil.position.y = b.p.y + .28 * t; pil.rotation.z = .4 * t; pil.position.x = b.p.x + .1 * t; }, { label: '방석', sfx: 'lift' });
  f.spot('inside', null, .2, H + .155, z0 + .06, { part: pp, maxH: .18, label: '방석 밑', scale: .8 });
  f.spot('on', null, -.3, H + .155, z0 + .1, { maxH: .35, label: '창가 의자 위', scale: .85 });
};

// 그림책 꽂이 (1×1): a low front-facing rack of picture books (two slanted tiers), little covers showing — a carrot, a moon,
// a bunny, a star — and a stack lying on top. A thing goes behind the front row or on top.
B.bookrack = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc = col(T, 'accent'), acc2 = col(T, 'accent2'), acc3 = col(T, 'accent3');
  const tk = [wood, woodD, acc, acc2, acc3].join(',');
  const W = .86;
  f.add(mcx('bookrack|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) {
      const s = new THREE.Shape(); s.moveTo(-.2, 0); s.lineTo(.18, 0); s.lineTo(.18, .32); s.lineTo(-.02, .72); s.quadraticCurveTo(-.08, .78, -.14, .72); s.lineTo(-.2, .6); s.lineTo(-.2, 0);
      const g = G.ext(s, .05, .01, 6); g.rotateY(-HP);
      add(g, wood, sx * (W / 2) + (sx < 0 ? .05 : 0), 0, -.02);
    }
    add(G.box(W - .04, .04, .4, .01), woodD, 0, .03, -.02);
    // two slanted tiers with lips
    for (const [y, z] of [[.06, .1], [.4, -.06]]) {
      add(G.box(W - .06, .03, .2, .01), wood, 0, y + .03, z, -.35, 0, 0);
      add(G.box(W - .06, .07, .025, .01), woodD, 0, y + .08, z + .1);
    }
    const covers = [[acc, CARROT], [acc2, WHITE], [HONEY, acc], [LILAC, BUTTER], [SKY, WHITE], [acc3, LEAF]];
    covers.forEach(([c, d], i) => {
      const tier = i < 3 ? 0 : 1, x = -.27 + (i % 3) * .27, y = tier ? .56 : .22, z = tier ? -.08 : .07;
      add(G.box(.22, .28, .025, .006), c, x, y, z, -.3, 0, 0);
      add(G.box(.2, .26, .02, .004), WHITE, x, y - .002, z - .012, -.3, 0, 0);   // pages
      add(G.sph(.05, 10, 8), d, x, y + .01, z + .016, -.3, 0, 0, [1, 1, .25]);
      add(G.box(.12, .025, .005, .002), shade(c, -.3), x, y + .1, z + .03, -.3, 0, 0);
    });
    // a stack lying on top of the rack's ends
    [[HONEY, .06], [acc2, .045], [acc, .05]].forEach(([c, h], i) => add(G.box(.26 - i * .02, h, .2, .01), c, .2, .74 + [0, .055, .105][i], -.12, 0, .1 * (i - 1), 0));
  }));
  f.spot('behind', null, -.18, .07, -.12, { maxH: .26, label: '그림책 뒤', scale: .75 });
  f.spot('on', null, -.18, .74, -.12, { maxH: .35, label: '그림책 꽂이 위', scale: .8 });
};

// 티피 텐트 (1×1): five poles tied at the top with bunting, a cream canvas with pink dots open at the front, its two flaps
// (one part) drawn shut or tied back; inside a pink mat, a star pillow and a carrot cushion.
const TENT_TEX = texCache();
function dotTex(a, b) {
  return TENT_TEX.get(a + b, () => { const t = canvasTex(256, 256, (c, W) => { c.fillStyle = a; c.fillRect(0, 0, W, W); c.fillStyle = b;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.beginPath(); c.arc((x + (y % 2) * .5) * 32 + 8, y * 32 + 16, 6, 0, 7); c.fill(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; });
}
B.bunnytent = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), pink = col(T, 'fabric'), acc2 = col(T, 'accent2'), acc3 = col(T, 'accent3');
  const tk = [wood, woodD, pink, acc2, acc3].join(',');
  const R = .5, H = 1.32, g2 = .56;   // the opening: ±g2 round from +z (a cylinder's angle 0 points at +z)
  // the canvas: a cone with its front open, both sides drawn (seen inside through the opening)
  const tex = dotTex('#fffaf0', '#ffd3db'); const tm = tex.clone(); tm.needsUpdate = true; tm.repeat.set(3, 2);
  const cg = new THREE.ConeGeometry(R, H, 18, 1, true, g2, PI * 2 - g2 * 2); cg.translate(0, H / 2, 0);
  f.add(mesh(cg, mat('#ffffff', { map: tm, rough: .9, rim: .15, side: THREE.DoubleSide })));
  f.add(mcx('bunnytent|' + tk, ({ add, tube }) => {
    for (let i = 0; i < 5; i++) { const an = g2 + i * (PI * 2 - g2 * 2) / 4, x = Math.sin(an) * (R + .02), z = Math.cos(an) * (R + .02);
      tube([x, 0, z], [-x * .22, H + .2, -z * .22], .018, wood, 6); }
    add(G.tor(.05, .02, PI * 2, 4, 12), acc3, 0, H - .1, 0, HP, 0, 0);
    // bunting round the top
    for (let i = 0; i < 7; i++) { const an = i / 7 * PI * 2, x = Math.sin(an) * .19, z = Math.cos(an) * .19;
      add(G.cone(.045, .09, 3), [pink, acc2, acc3, LILAC][i % 4], x, H - .36, z, PI, -an, 0, [1, 1, .3]); }
    // inside: the mat, a little blanket, a star pillow, a carrot cushion
    add(G.box(.78, .06, .7, .03), pink, 0, .03, 0);
    add(G.box(.5, .04, .26, .02), WHITE, -.04, .07, -.2, 0, .2, 0);
    const sg = G.ext(starShape(.16, .085), .07, .03, 4); sg.rotateX(-HP + .35); add(sg, HONEY, -.14, .1, -.12);
    const cs = new THREE.Shape(); cs.moveTo(0, -.16); cs.quadraticCurveTo(.09, .05, .05, .14); cs.lineTo(-.05, .14); cs.quadraticCurveTo(-.09, .05, 0, -.16);
    add(G.ext(cs, .08, .03, 6), CARROT, .18, .16, -.08, -1.35, .6, 0);
    for (const s of [-1, 0, 1]) add(G.cap(.018, .06, 2, 6), LEAF2, .1 + s * .025, .19, -.16 + s * .01, 1.1, .6, s * .4);
  }));
  // the front flaps (one part): drawn nearly shut at rest, a pink slit between them; open, tied back to the sides. Each flap
  // is a triangle from its pole's foot, up the pole, across to the middle.
  const flap = sx => {
    const bx = sx * Math.sin(g2) * R, bz = Math.cos(g2) * R, ty = H * .8, tx = sx * Math.sin(g2) * R * .2, tz = Math.cos(g2) * R * .2, dz = sx > 0 ? .012 : .024;
    const pv = new THREE.Group(); put(pv, bx, 0, bz);
    const v = [0, 0, dz, tx - bx, ty, tz - bz + dz, -sx * .3, 0, .04 + dz, -sx * .16, ty * .5, .03 + dz];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, .1, 2, 1.2, 0, .8, 1], 2));
    g.setIndex(sx > 0 ? [0, 3, 1, 0, 2, 3] : [0, 1, 3, 0, 3, 2]); g.computeVertexNormals();
    const t2 = tex.clone(); t2.needsUpdate = true;
    pv.add(mesh(g, mat('#ffffff', { map: t2, rough: .9, rim: .15, side: THREE.DoubleSide })));
    pv.add(put(mesh(G.tor(.03, .01, PI * 2, 4, 10), mat(acc2)), -sx * .1, .5, .05));
    f.add(pv); return pv;
  };
  const fl = flap(-1), fr = flap(1);
  const fp = f.part('curtain', [fl, fr], (t, b0, b1) => { fl.rotation.y = b0.r.y - 1.25 * t; fr.rotation.y = b1.r.y + 1.25 * t; }, { label: '텐트 문', sfx: 'open', dur: .35 });
  f.spot('inside', null, .12, .065, -.05, { part: fp, maxH: .4, label: '텐트 안', scale: .85 });
  f.spot('behind', null, .38, 0, -.42, { maxH: .45, label: '텐트 뒤', scale: .8 });
};

// 장난감 상자 (1×1): a green wooden trunk with a rounded lid, honey straps and brass corners, a pink gingham blanket hanging
// over its edge and a plush bunny that pops up when the lid opens.
B.toytrunk = (f, T) => {
  const sage = col(T, 'sage'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), pink = col(T, 'fabric');
  const tk = [sage, wood, woodD, pink].join(',');
  const W = .86, D = .56, H = .48, z0 = -.12;
  f.add(mcx('toytrunk|' + tk, ({ add }) => {
    add(G.box(W, H, D, .04), sage, 0, H / 2 + .02, z0);
    add(G.box(W - .1, .02, D - .1, .01), shade(sage, -.25), 0, H + .015, z0);
    for (const sx of [-1, 1]) add(G.box(.08, H + .01, D + .02, .015), wood, sx * .26, H / 2 + .02, z0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.07, .07, .07, .015), BRASS, sx * (W / 2 - .02), .06, z0 + sz * (D / 2 - .02));
    add(G.box(.14, .1, .03, .015), BRASS, 0, H - .06, z0 + D / 2 + .01);
    for (const sx of [-1, 1]) add(G.sph(.03, 8, 6), woodD, sx * (W / 2 + .01), H * .6, z0, 0, 0, 0, [.6, 1, 1.6]);
    // a heart cut-out on the front, the blanket hanging over the right edge
    const hs = new THREE.Shape(); hs.moveTo(0, -.06); hs.bezierCurveTo(-.1, .01, -.04, .08, 0, .03); hs.bezierCurveTo(.04, .08, .1, .01, 0, -.06);
    add(G.ext(hs, .01, 0, 6), shade(sage, .15), 0, H * .45, z0 + D / 2 + .004);
    add(G.box(.26, .3, .02, .01), pink, .34, H - .1, z0 + D / 2 + .02, .05, 0, .05);
    for (let k = 0; k < 3; k++) add(G.box(.26, .025, .022, .005), WHITE, .34, H - .2 + k * .09, z0 + D / 2 + .022, .05, 0, .05);
  }));
  // the lid (rounded top), hinged at the back
  const lid = new THREE.Group(); put(lid, 0, H + .02, z0 - D / 2);
  lid.add(mc('toytrunk-lid|' + tk, ({ add }) => {
    const g = new THREE.CylinderGeometry(D / 2, D / 2, W, 20, 1, false, 0, PI); g.rotateZ(HP); g.scale(1, .42, 1);
    add(g, sage, 0, 0, D / 2);
    for (const sx of [-1, 1]) { const s = new THREE.CylinderGeometry(D / 2 + .012, D / 2 + .012, .08, 20, 1, false, 0, PI); s.rotateZ(HP); s.scale(1, .44, 1); add(s, wood, sx * .26, 0, D / 2); }
    add(G.box(.1, .06, .04, .015), BRASS, 0, -.01, D + .005);
  }));
  f.add(lid);
  const pop = new THREE.Group(); put(pop, -.18, H - .2, z0 + .02);
  pop.add(mcx('toytrunk-bun', ({ add }) => bunny(add, 0, 0, 0, 1.1, PLUSH, .3)));
  f.add(pop);
  const p = f.part('lid', [lid, pop], (t, bl, bp) => { lid.rotation.x = -1.85 * t; pop.position.y = bp.p.y + .22 * t; pop.rotation.z = .2 * t; }, { label: '장난감 상자', sfx: 'open', dur: .32 });
  f.lockAt = { x: 0, y: H - .06, z: z0 + D / 2 + .05 };
  f.spot('inside', null, .16, .06, z0, { part: p, maxH: .36, label: '장난감 상자 안', scale: .9 });
};

// 낮은 선반 (1×1): a low three-tier shelf (open both sides) with a bunny lamp glowing on top, a jar of buttons, small books,
// a little pot of herbs, a wooden stacking ring toy.
B.lowshelf = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc = col(T, 'accent'), acc2 = col(T, 'accent2'), acc3 = col(T, 'accent3');
  const tk = [wood, woodD, acc, acc2, acc3].join(',');
  const W = .8, D = .38, z0 = -.25, ys = [.06, .38, .7];
  f.add(mcx('lowshelf|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.05, .78, D, .015), wood, sx * (W / 2 - .025), .39, z0);
    for (const y of ys) add(G.box(W, .04, D, .012), wood, 0, y + .02, z0);
    add(G.pbox(W - .1, .7, .015), shade(wood, .06), 0, .4, z0 - D / 2 + .01);
    // bottom: a basket of blocks; middle: books leaning, a ring toy
    add(G.box(.3, .18, .26, .03), WICKER, -.18, ys[0] + .13, z0);
    [[acc, 0], [HONEY, .07], [acc2, .14], [SKY, .21]].forEach(([c, o], i) => add(G.box(.06, .06, .06, .01), c, -.26 + o, ys[0] + .25, z0 - .03 + (i % 2) * .05, 0, i * .4, 0));
    [[acc, .22], [acc2, .2], [HONEY, .24], [LILAC, .21]].forEach(([c, h], i) => add(G.box(.04, h, .18, .006), c, -.25 + i * .045, ys[1] + .04 + h / 2, z0, 0, 0, i === 3 ? -.25 : 0));
    add(G.cyl(.015, .015, .2, 8), woodD, .2, ys[1] + .14, z0);
    [acc, acc3, HONEY, acc2].forEach((c, i) => add(G.tor(.06 - i * .01, .022, PI * 2, 6, 14), c, .2, ys[1] + .065 + i * .04, z0, HP, 0, 0));
    // top: the bunny lamp and a jar of buttons
    add(lathe([[0, 0], [.065, 0], [.07, .03], [0, .03]], 14), woodD, .14, ys[2] + .04, z0 - .02);
    add(G.sph(.1, 14, 10), '#fff6ea', .14, ys[2] + .16, z0 - .02, 0, 0, 0, [1, 1.1, 1]);
    for (const sx of [-1, 1]) add(G.cap(.028, .08, 2, 8), '#fff6ea', .14 + sx * .045, ys[2] + .3, z0 - .02, 0, 0, sx * -.2);
    for (const sx of [-1, 1]) add(G.sph(.01, 6, 5), INK, .14 + sx * .03, ys[2] + .17, z0 + .075);
    add(G.cyl(.05, .05, .1, 12), '#e9f6fb', -.22, ys[2] + .09, z0);
    [acc, HONEY, acc2, SKY].forEach((c, i) => add(G.cyl(.016, .016, .008, 8), c, -.24 + (i % 2) * .035, ys[2] + .07 + (i >> 1) * .03, z0 + .02, HP, 0, 0));
    add(G.cyl(.052, .052, .02, 12), acc3, -.22, ys[2] + .15, z0);
  }));
  // the lamp's glow (its own mesh: emissive)
  f.add(put(mesh(G.sph(.075, 12, 10), mat('#fff3d6', { emissive: '#ffdca0', ei: .9, rough: .6 }), { cast: false }), .14, ys[2] + .16, z0 + .03, 0, 0, 0, [1, 1, .4]));
  f.spot('on', null, .17, ys[0] + .04, z0 + .04, { maxH: .28, label: '낮은 선반 아래칸', scale: .8 });
  f.spot('on', null, .02, ys[1] + .04, z0 + .04, { maxH: .26, label: '낮은 선반 가운데칸', scale: .8 });
  f.spot('on', null, -.08, ys[2] + .04, z0 + .02, { maxH: .35, label: '낮은 선반 위', scale: .8 });
};

// 장난감 바구니 (1×1): a round wicker basket with rope handles, toys poking out — a teddy's ears, a ball, a toy carrot — and a
// soft knitted blanket on top that lifts.
B.toybasket = (f, T) => {
  const acc = col(T, 'accent'), acc2 = col(T, 'accent2'), acc3 = col(T, 'accent3'), tk = [acc, acc2, acc3].join(',');
  const R = .3, H = .36;
  f.add(mcx('toybasket|' + tk, ({ add }) => {
    add(lathe([[0, 0], [R - .04, 0], [R, .05], [R + .03, H], [R + .01, H + .02], [R - .02, H], [R - .05, .06], [0, .06]], 24), WICKER, 0, 0, 0);
    for (let k = 0; k < 4; k++) add(G.tor(R + .005 + k * .008, .012, PI * 2, 4, 28), WICKER2, 0, .08 + k * .08, 0, HP, 0, 0);
    add(G.tor(R + .03, .022, PI * 2, 5, 28), WICKER2, 0, H + .01, 0, HP, 0, 0);
    for (const sx of [-1, 1]) add(G.tor(.07, .016, PI, 4, 10), '#f6e2b0', sx * (R + .02), H, 0, 0, HP, 0);
    // the toys
    add(G.sph(.12, 14, 10), '#c98a52', -.1, H - .02, -.08);
    for (const sx of [-1, 1]) add(G.sph(.045, 8, 6), '#c98a52', -.1 + sx * .08, H + .08, -.08);
    add(G.sph(.1, 14, 10), acc, .12, H - .02, -.1);
    add(G.tor(.1, .012, PI * 2, 4, 20), WHITE, .12, H - .02, -.1, .4, 0, 0);
    add(G.cone(.035, .22, 8), CARROT, .16, H + .08, .08, -.6, 0, .4);
    for (const s of [-1, 1]) add(G.cap(.012, .05, 2, 5), LEAF2, .07 + s * .015, H + .17, .03, -.6, 0, .4 + s * .3);
  }));
  const bl = new THREE.Group(); put(bl, 0, H - .01, .04);
  bl.add(mc('toybasket-bl|' + acc2, ({ add }) => {
    add(G.box(.42, .05, .3, .025), acc2, 0, .02, 0, .1, .3, 0);
    for (let k = 0; k < 5; k++) add(G.box(.43, .012, .02, .006), WHITE, 0, .045, -.12 + k * .06, .1, .3, 0);
  }));
  f.add(bl);
  const p = f.part('lift', bl, (t, b) => { bl.position.y = b.p.y + .25 * t; bl.position.z = b.p.z + .1 * t; bl.rotation.x = .5 * t; }, { label: '바구니 담요', sfx: 'lift' });
  f.spot('inside', null, .02, .07, .06, { part: p, maxH: .28, label: '장난감 바구니 안', scale: .85 });
};

// 구름 러그 (2×2): a cloud-shaped fluffy rug with little pink flowers; on it a wooden train (engine, two cars, track), a
// striped beach ball, stacked ABC blocks — and a big plush bunny hugging a carrot that lifts (a thing underneath).
B.cloudrug = (f, T) => {
  const rug = col(T, 'rug'), rug2 = col(T, 'rug2'), acc = col(T, 'accent'), acc2 = col(T, 'accent2'), acc3 = col(T, 'accent3'), wood = col(T, 'wood');
  const tk = [rug, rug2, acc, acc2, acc3, wood].join(',');
  f.add(mcx('cloudrug|' + tk, ({ add, tube }) => {
    const s = new THREE.Shape(), N = 11;
    for (let i = 0; i <= N * 8; i++) { const an = i / (N * 8) * PI * 2, bump = 1 + .07 * Math.max(0, Math.sin(an * N)), r = bump; const x = Math.cos(an) * .82 * r, y = Math.sin(an) * .7 * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
    const g = G.ext(s, .03, .012, 4); g.rotateX(-HP);
    add(g, rug, 0, 0, 0);
    const g2 = G.ext(s, .01, 0, 4); g2.rotateX(-HP); g2.scale(.84, 1, .84);
    add(g2, shade(rug2, .1), 0, .03, 0);
    for (let i = 0; i < 14; i++) { const an = i * 2.4, r = .3 + (i % 3) * .14, x = Math.cos(an) * r * .95, z = Math.sin(an) * r * .8;
      for (let p = 0; p < 4; p++) add(G.sph(.022, 6, 5), i % 2 ? rug2 : acc2, x + Math.cos(p * HP) * .025, .045, z + Math.sin(p * HP) * .025, 0, 0, 0, [1, .3, 1]);
      add(G.sph(.016, 6, 5), WHITE, x, .048, z, 0, 0, 0, [1, .3, 1]); }
    // a wooden train on a little oval of track at the front right
    const tx = .35, tz = .28;
    add(G.tor(.26, .012, PI * 2, 3, 32), shade(wood, -.15), tx, .05, tz, HP, 0, 0, [1, 1.4, 1]);
    const car = (x, z, c, eng) => {
      add(G.box(.16, .08, .1, .02), c, x, .1, z); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.026, .026, .02, 10), INK, x + sx * .05, .07, z + sz * .055, HP, 0, 0);
      if (eng) { add(G.box(.08, .1, .1, .02), c, x - .05, .18, z); add(G.cyl(.02, .025, .07, 8), INK, x + .05, .17, z); add(G.box(.11, .02, .12, .01), acc, x - .05, .24, z); }
      else add(G.box(.06, .06, .06, .01), [HONEY, acc2][Math.round(x * 10) % 2 ? 0 : 1], x, .17, z, 0, .4, 0);
    };
    car(tx + .1, tz + .17, acc3, true); car(tx - .1, tz + .19, acc2); car(tx - .28, tz + .14, HONEY);
    // the beach ball and ABC blocks
    add(G.sph(.11, 16, 12), WHITE, -.45, .14, .3);
    for (let k = 0; k < 3; k++) add(new THREE.SphereGeometry(.112, 16, 12, k * PI * 2 / 3, PI / 3), [acc, SKY, HONEY][k], -.45, .14, .3);
    [[acc, 0], [acc2, .1], [HONEY, .2]].forEach(([c, y], i) => add(G.box(.1, .1, .1, .015), c, -.62 + (i === 2 ? .04 : 0), .09 + y, -.15, 0, i * .3, 0));
    add(G.box(.1, .1, .1, .015), SKY, -.5, .09, -.25, 0, .5, 0);
  }));
  // the plush bunny (a part: it lifts, a thing under it)
  const pb = new THREE.Group(); put(pb, -.05, .04, -.12);
  pb.add(mc('cloudrug-bun|' + acc3, ({ add }) => {
    add(G.sph(.17, 16, 12), PLUSH, 0, .15, 0, 0, 0, 0, [1.15, .95, 1]);
    add(G.sph(.14, 16, 12), PLUSH, 0, .36, .03);
    for (const sx of [-1, 1]) { add(G.cap(.045, .18, 2, 8), PLUSH, sx * .06, .56, 0, -.2, 0, sx * -.35); add(G.cap(.022, .12, 2, 6), BLUSH, sx * .06, .56, .03, -.2, 0, sx * -.35); }
    for (const sx of [-1, 1]) add(G.sph(.018, 8, 6), INK, sx * .05, .38, .15);
    for (const sx of [-1, 1]) add(G.sph(.026, 8, 6), BLUSH, sx * .08, .34, .14, 0, 0, 0, [1, .6, .4]);
    add(G.cone(.05, .24, 8), CARROT, .02, .2, .16, 1.1, 0, -.6);
    for (const s of [-1, 1]) add(G.cap(.016, .06, 2, 5), LEAF2, -.08 + s * .02, .14, .24, 1.1, 0, -.6 + s * .3);
    for (const sx of [-1, 1]) add(G.sph(.06, 10, 8), PLUSH, sx * .13, .2, .1, 0, 0, 0, [.8, .8, 1.2]);
  }));
  f.add(pb);
  const p = f.part('lift', pb, (t, b) => { pb.position.y = b.p.y + .35 * t; pb.position.x = b.p.x - .15 * t; pb.rotation.z = .35 * t; }, { label: '토끼 인형', sfx: 'lift' });
  f.spot('inside', null, -.05, .04, -.12, { part: p, maxH: .3, label: '토끼 인형 밑', scale: .85 });
  f.spot('on', null, .12, .045, -.28, { maxH: .45, label: '놀잇감 사이', scale: .85 });
  f.spot('on', null, -.4, .045, .02, { maxH: .45, label: '공과 블록 사이', scale: .85 });
};

// 인형의 집 (1×1): a little two-storey house on short legs — a lilac roof, a cream front with windows and a heart door, a
// flower box; the ground floor open at the front (a tiny kitchen and a sofa), the upstairs behind a front that swings open
// (a tiny bed and a lamp).
B.dollhouse = (f, T) => {
  const lilac = col(T, 'lilac'), wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc = col(T, 'accent'), acc2 = col(T, 'accent2'), body = col(T, 'body');
  const tk = [lilac, wood, woodD, acc, acc2, body].join(',');
  const W = .72, D = .42, z0 = -.2, F1 = .14, F2 = .52, TOP = .9;
  f.add(mcx('dollhouse|' + tk, ({ add }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.022, .018, .12, 8), woodD, sx * (W / 2 - .05), .06, z0 + sz * (D / 2 - .05));
    add(G.box(W + .04, .04, D + .04, .012), wood, 0, F1 - .02, z0);
    add(G.box(W, .03, D, .01), wood, 0, F2 - .015, z0);
    add(G.box(W, .03, D, .01), wood, 0, TOP - .015, z0);
    for (const sx of [-1, 1]) add(G.box(.03, TOP - F1, D, .01), body, sx * (W / 2 - .015), (F1 + TOP) / 2, z0);
    add(G.pbox(W - .04, TOP - F1, .02), '#fde7ef', 0, (F1 + TOP) / 2, z0 - D / 2 + .01);
    add(G.box(.025, F2 - F1 - .03, D - .04, .005), body, .06, (F1 + F2) / 2, z0);
    // the roof: two slabs and a chimney
    for (const sx of [-1, 1]) add(G.box(W * .62, .04, D + .1, .015), lilac, sx * W * .24, TOP + .17, z0, 0, 0, -sx * .62);
    add(G.box(.06, .09, .06, .01), '#d9886a', .18, TOP + .27, z0 - .05);
    add(G.pbox(.02, .3, D - .04), body, 0, TOP + .1, z0, 0, 0, 0);
    const tri = new THREE.Shape(); tri.moveTo(-W / 2 + .03, 0); tri.lineTo(W / 2 - .03, 0); tri.lineTo(0, .3); tri.lineTo(-W / 2 + .03, 0);
    add(G.ext(tri, .02, 0, 2), body, 0, TOP, z0 - D / 2 + .005); add(G.ext(tri, .02, 0, 2), body, 0, TOP, z0 + D / 2 - .03);
    add(G.cyl(.05, .05, .012, 14), acc2, 0, TOP + .1, z0 + D / 2 - .005, HP, 0, 0);
    // downstairs: a tiny kitchen at left (a stove, a pot), a sofa and a rug at right
    add(G.box(.18, .14, .12, .01), WHITE, -.2, F1 + .07, z0 - .1); add(G.cyl(.03, .03, .03, 10), acc, -.2, F1 + .155, z0 - .1);
    add(G.box(.08, .2, .1, .01), acc2, -.04, F1 + .1, z0 - .1);
    add(G.box(.2, .07, .1, .02), acc, .2, F1 + .045, z0 - .1); add(G.box(.2, .1, .03, .015), acc, .2, F1 + .1, z0 - .145);
    add(G.cyl(.08, .08, .006, 14), HONEY, .2, F1 + .005, z0 + .03);
  }));
  // upstairs front (a part): cream with two round windows and a flower box; behind it a tiny bed and a lamp
  f.add(mc('dollhouse-up|' + tk, ({ add }) => {
    add(G.box(.26, .05, .14, .015), WHITE, -.14, F2 + .04, z0 - .08); add(G.box(.26, .04, .1, .015), acc, -.14, F2 + .08, z0 - .06); add(G.box(.08, .04, .1, .015), WHITE, -.23, F2 + .1, z0 - .1);
    add(G.cyl(.012, .012, .14, 6), woodD, .2, F2 + .07, z0 - .1); add(G.cone(.05, .06, 10), HONEY, .2, F2 + .16, z0 - .1);
  }));
  const fr = new THREE.Group(); put(fr, -W / 2, F2, z0 + D / 2 + .012);
  fr.add(mc('dollhouse-front|' + tk, ({ add }) => {
    add(G.box(W, TOP - F2 - .02, .024, .008), body, W / 2, (TOP - F2) / 2, 0);
    for (const x of [.2, .52]) { add(G.cyl(.065, .065, .03, 16), SKY2, x, .2, .004, HP, 0, 0); add(G.tor(.065, .012, PI * 2, 4, 18), woodD, x, .2, .016); add(G.box(.012, .13, .01, .003), woodD, x, .2, .02); }
    add(G.box(.2, .05, .06, .012), woodD, .36, .06, .03);
    for (let k = 0; k < 5; k++) add(G.sph(.018, 6, 5), [acc, HONEY, WHITE][k % 3], .28 + k * .04, .1, .04);
    add(G.sph(.016, 6, 5), BRASS, W - .05, .18, .02);
  }));
  f.add(fr);
  const p = f.part('door', fr, (t) => { fr.rotation.y = -1.9 * t; }, { label: '인형의 집 2층', sfx: 'open', dur: .3 });
  p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: W - .1, y: .16, z: .05, parent: fr };
  f.spot('inside', null, .12, F2 + .005, z0 + .02, { part: p, maxH: .3, label: '인형의 집 2층', scale: .75 });
  f.spot('on', null, .08, F1 + .01, z0 + .1, { maxH: .3, label: '인형의 집 1층', scale: .7 });
};

// 쿠션 더미 (1×1): two big squishy floor cushions — a flower-shaped butter one, a round lilac one on it — and a little throw.
// The top one lifts (a thing tucked under it peeks out).
B.cushionpile = (f, T) => {
  const acc2 = col(T, 'accent2'), lilac = col(T, 'lilac'), pink = col(T, 'fabric'), tk = [acc2, lilac, pink].join(',');
  f.add(mcx('cushionpile|' + tk, ({ add }) => {
    for (let k = 0; k < 6; k++) { const an = k / 6 * PI * 2; add(G.sph(.17, 12, 8), BUTTER, Math.cos(an) * .17, .08, Math.sin(an) * .17, 0, 0, 0, [1, .5, 1]); }
    add(G.sph(.2, 14, 10), BUTTER, 0, .1, 0, 0, 0, 0, [1, .5, 1]);
    add(G.sph(.05, 10, 8), HONEY, 0, .2, 0, 0, 0, 0, [1, .5, 1]);
    add(G.box(.5, .03, .36, .015), acc2, .14, .02, .26, 0, -.3, 0);
    for (let k = 0; k < 4; k++) add(G.box(.5, .008, .03, .004), WHITE, .14, .037, .16 + k * .07, 0, -.3, 0);
  }));
  const top = new THREE.Group(); put(top, -.04, .19, -.04);
  top.add(mc('cushionpile-top|' + tk, ({ add }) => {
    add(G.sph(.27, 16, 12), lilac, 0, .07, 0, 0, 0, 0, [1, .42, 1]);
    add(G.tor(.15, .014, PI * 2, 4, 24), shade(lilac, .1), 0, .14, 0, HP, 0, 0);
    add(G.sph(.03, 8, 6), shade(lilac, -.15), 0, .17, 0);
  }));
  f.add(top);
  const p = f.part('lift', top, (t, b) => { top.position.y = b.p.y + .3 * t; top.rotation.x = -.45 * t; top.position.z = b.p.z - .12 * t; }, { label: '큰 쿠션', sfx: 'lift' });
  f.spot('inside', null, .06, .2, .02, { part: p, maxH: .2, label: '큰 쿠션 밑', scale: .8 });
};

// 깃발 가랜드 (wall, span 2): a sagging string of pennants (pink, sage, butter, lilac) with little warm bulbs between them.
B.bunting = (f, T) => {
  const acc = col(T, 'accent'), acc2 = col(T, 'accent2'), lilac = col(T, 'lilac'), tk = [acc, acc2, lilac].join(',');
  const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([-.95 + u * 1.9, 2.05 - Math.sin(u * PI) * .22, .06 + Math.sin(u * PI) * .1]); }
  f.add(mcx('bunting|' + tk, ({ add, tube }) => {
    for (let i = 0; i < 12; i++) tube(pts[i], pts[i + 1], .006, '#e8d6a8', 4);
    for (const [x, y] of [[-.95, 2.05], [.95, 2.05]]) add(G.sph(.02, 6, 5), BRASS, x, y, .05);
    for (let i = 1; i < 12; i += 1) {
      const [x, y, z] = pts[i];
      if (i % 2) add(G.cone(.07, .15, 3), [acc, acc2, BUTTER, lilac][(i >> 1) % 4], x, y - .085, z, PI, 0, 0, [1, 1, .15]);
    }
  }));
  const bulbs = []; for (let i = 2; i < 12; i += 2) bulbs.push(pts[i]);
  for (const [x, y, z] of bulbs) f.add(put(mesh(G.sph(.026, 8, 6), mat('#fff3c6', { emissive: '#ffd27a', ei: .9 }), { cast: false }), x, y - .03, z));
};

// 작은 액자 둘 (wall, span 1): two little frames hung on ribbons — a carrot and a flower — with a paper star between them.
B.bunnyframes = (f, T) => {
  const wood = col(T, 'wood'), acc = col(T, 'accent'), acc2 = col(T, 'accent2'), tk = [wood, acc, acc2].join(',');
  f.add(mcx('bunnyframes|' + tk, ({ add, tube }) => {
    for (const [x, y, s, c] of [[-.2, 1.72, .32, acc2], [.2, 1.55, .26, acc]]) {
      add(G.box(s, s * 1.2, .03, .01), wood, x, y, .02);
      add(G.box(s - .06, s * 1.2 - .06, .01, .004), '#fffaf2', x, y, .04);
      tube([x - s * .3, y + s * .6, .03], [x, y + s * .6 + .1, .03], .006, c, 4); tube([x + s * .3, y + s * .6, .03], [x, y + s * .6 + .1, .03], .006, c, 4);
      add(G.sph(.02, 6, 5), c, x, y + s * .6 + .1, .035);
    }
    add(G.cone(.03, .12, 8), CARROT, -.2, 1.71, .05, 0, 0, .5); add(G.cap(.01, .03, 2, 5), LEAF2, -.235, 1.77, .05, 0, 0, .5);
    for (let k = 0; k < 5; k++) { const an = k / 5 * PI * 2; add(G.sph(.022, 6, 5), acc, .2 + Math.cos(an) * .03, 1.55 + Math.sin(an) * .03, .05, 0, 0, 0, [1, 1, .4]); }
    add(G.sph(.018, 6, 5), HONEY, .2, 1.55, .055);
    const sg = G.ext(starShape(.06, .028), .015, 0, 2); add(sg, HONEY, .02, 1.95, .03);
  }));
};

// 흔들 목마 (1×1): a little rocking horse — honey rockers, a cream horse with a pink yarn mane and tail, a sage saddle, a red
// bridle and two peg handles. A thing rides on the saddle or sits between the rockers.
B.rockhorse = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), acc = col(T, 'accent'), acc2 = col(T, 'accent2'), tk = [wood, woodD, acc, acc2].join(',');
  f.add(mcx('rockhorse|' + tk, ({ add, tube }) => {
    for (const sz of [-1, 1]) {
      add(G.tor(.9, .03, .9, 6, 20), wood, 0, .93, sz * .17, 0, 0, -HP - .45, [1, 1, 1.4]);
      for (const sx of [-1, 1]) tube([sx * .22, .07, sz * .17], [sx * .12, .36, sz * .09], .022, woodD, 6);
    }
    for (const x of [-.32, .32]) add(G.cyl(.018, .018, .38, 8), woodD, x, .06, 0, HP, 0, 0);
    const C = '#fff6ea';
    add(G.cap(.12, .3, 4, 12), C, 0, .44, 0, 0, 0, HP);
    add(G.cap(.065, .16, 3, 10), C, .2, .58, 0, 0, 0, -.6);
    add(G.cap(.07, .14, 3, 10), C, .3, .7, 0, 0, 0, HP + .25);
    add(G.sph(.04, 8, 6), '#ffd9cf', .4, .68, 0, 0, 0, 0, [1, .8, 1]);
    for (const sz of [-1, 1]) { add(G.sph(.014, 6, 5), INK, .3, .74, sz * .055); add(G.cone(.025, .07, 6), C, .25, .8, sz * .04, 0, 0, .2); }
    for (let k = 0; k < 6; k++) add(G.sph(.035, 8, 6), acc, .2 - k * .03 + .08, .76 - k * .045, 0, 0, 0, 0, [1, 1, .7]);
    for (let k = 0; k < 4; k++) add(G.sph(.03, 8, 6), acc, -.26 - k * .025, .48 - k * .05, 0);
    add(G.box(.22, .05, .26, .03), acc2, -.02, .56, 0);
    for (const sz of [-1, 1]) add(G.box(.03, .14, .02, .008), acc2, -.02, .48, sz * .13);
    add(G.tor(.07, .012, PI * 2, 4, 14), TOMATO, .32, .7, 0, 0, HP, .3);
    add(G.cyl(.014, .014, .2, 6), woodD, .18, .66, 0, HP, 0, 0);
  }));
  f.spot('on', null, -.04, .585, 0, { maxH: .35, label: '흔들 목마 안장', scale: .75 });
  f.spot('under', null, -.05, .02, .02, { maxH: .26, label: '흔들 목마 밑', scale: .75 });
};

// 들보 그네 (1×1, 10/21 — 기준 GPT bunnyattic-b): a rafter reaching out from the back wall with a swing on two ropes — a honey
// board with a lilac cushion, a sprig of ivy round one rope. A thing sits on the cushion.
B.atticswing = (f, T) => {
  const wood = col(T, 'wood'), woodD = col(T, 'woodD'), lilac = col(T, 'lilac'), beam = col(T, 'beam'), tk = [wood, woodD, lilac, beam].join(',');
  const BY = 2.75, SY = .48;
  f.add(mcx('atticswing|' + tk, ({ add, tube }) => {
    add(G.box(.16, .18, 2.0, .03), beam, 0, BY, -.55);
    add(G.box(.12, .5, .12, .02), woodD, 0, BY - .3, -1.5);
    tube([0, BY - .5, -1.5], [0, BY - .08, -1.0], .035, woodD, 6);
    for (const sx of [-1, 1]) { add(G.tor(.035, .012, PI * 2, 4, 10), '#e8d6a8', sx * .2, BY - .1, .2, 0, HP, 0); tube([sx * .2, BY - .12, .2], [sx * .2, SY + .03, .2], .013, '#e8d6a8', 5); }
    add(G.box(.56, .05, .26, .015), wood, 0, SY, .2);
    add(G.box(.48, .07, .22, .035), lilac, 0, SY + .055, .2);
    for (let k = 0; k < 3; k++) add(G.sph(.012, 6, 5), shade(lilac, -.2), -.15 + k * .15, SY + .09, .2);
    leaves(add, -.2, BY - .4, .2, 5, LEAF, LEAF2, .7, .9);
    for (let k = 0; k < 3; k++) add(G.cyl(.022, .022, .01, 8), WHITE, -.2 + (k - 1) * .04, BY - .6 - k * .25, .23, HP, 0, 0);
  }));
  f.spot('on', null, .05, SY + .09, .2, { maxH: .3, label: '그네 위', scale: .75 });
};

export const ATTIC_BUILDERS = B;
export const ATTIC_INFO = {
  roundwin: { wall: true, span: 2, name: '동그란 다락 창', price: 0, hidden: true },
  windowseat: { w: 2, d: 1, name: '창가 의자', price: 0, hidden: true },
  bookrack: { w: 1, d: 1, name: '그림책 꽂이', price: 0, hidden: true },
  bunnytent: { w: 1, d: 1, name: '티피 텐트', price: 0, hidden: true },
  toytrunk: { w: 1, d: 1, name: '장난감 상자', price: 0, hidden: true },
  lowshelf: { w: 1, d: 1, name: '낮은 선반', price: 0, hidden: true },
  toybasket: { w: 1, d: 1, name: '장난감 바구니', price: 0, hidden: true },
  cloudrug: { w: 2, d: 2, name: '구름 러그', price: 0, hidden: true },
  dollhouse: { w: 1, d: 1, name: '인형의 집', price: 0, hidden: true },
  cushionpile: { w: 1, d: 1, name: '쿠션 더미', price: 0, hidden: true },
  bunting: { wall: true, span: 2, name: '깃발 가랜드', price: 0, hidden: true },
  bunnyframes: { wall: true, span: 1, name: '작은 액자', price: 0, hidden: true },
  rockhorse: { w: 1, d: 1, name: '흔들 목마', price: 0, hidden: true },
  atticswing: { w: 1, d: 1, name: '들보 그네', price: 0, hidden: true },
};

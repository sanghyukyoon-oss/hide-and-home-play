// 상점 '스페셜' 가구 13개 (디자인 10/20, user: "스페셜 꽤 많이 줘 봐. 오토바이라던지 BMX라던지. 램프 좋네. 기타라던지"):
// special pieces you buy once a condition is met (list, conditions and prices: specials.js SPECIALS). Only the look lives
// here; registered in main.js, they show up in the 스페셜 tab by themselves (not in the furniture tab).
// Look: chunky toy shapes in calm colours (cream, oat, wood, ink) and ONE point colour per piece, so it reads at phone size
// under the ink outline. Static decor is one vertex-coloured mesh per piece (mc, welded: shared corners are one vertex);
// lights are their own glowing mesh; moving parts their own group. Origin = footprint centre on the floor, faces +z.
// Budget: 1×1 under 2k vertices, 2×1 under 3k. sp_neonlamp, sp_rocket, sp_skate are small and low (room.js STACK_SMALL:
// they go on a drawer or a desk).
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mesh, geo, mat, starShape, heartShape, STYLE } from './kit.js';
import { HG as G } from './house-props.js';
import { EN } from '../i18n-en-dict.js';

const PI = Math.PI, HP = PI / 2;
const K = (ko, en) => { EN[ko] ??= en; return ko; };
const INK = '#3b3556', INK2 = '#2c2744', CREAM = '#fbf3e6', OAT = '#eadcc6', WOOD = '#e3b27c', WOODD = '#b9844f', WALNUT = '#8e5d3f',
  STEEL = '#cfd4e2', STEEL2 = '#9aa1b8', TIRE = '#3a3346', BONE = '#f3e8d0', BRASS = '#e2b54e';

// ── one welded, vertex-coloured mesh per piece ─────────────────────────────────────────────────────────────────────
const xf = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s));
const tint = hex => (STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(hex) : hex);
const VM = {};
const vmat = () => VM[STYLE.mode] || (VM[STYLE.mode] = STYLE.mode !== 'std'
  ? new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: STYLE.grad })
  : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .82 }));
function merged(key, fn) {
  return geo('spc|' + STYLE.mode + '|' + key, () => {
    const list = [];
    // add(geometry, colour, x, y, z, rx, ry, rz, s) · in(M): the same add inside a frame M (a tilted board, a leaning guitar)
    const addM = (src, m, color) => {
      const c = src.index ? src.toNonIndexed() : src.clone();
      for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal') c.deleteAttribute(k);
      c.applyMatrix4(m);
      const cc = new THREE.Color(tint(color)), n = c.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = cc.r; a[i * 3 + 1] = cc.g; a[i * 3 + 2] = cc.b; }
      c.setAttribute('color', new THREE.BufferAttribute(a, 3));
      list.push(c);
    };
    const api = M => ({
      add: (src, color, x, y, z, rx, ry, rz, s) => addM(src, M.clone().multiply(xf(x, y, z, rx, ry, rz, s)), color),
      tube: (a, b, r, color, seg = 6, r2 = r) => {
        const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length();
        const m = new THREE.Matrix4().compose(A.clone().add(Bv).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1));
        addM(new THREE.CylinderGeometry(r2, r, L, seg), M.clone().multiply(m), color);
      },
      in: (x, y, z, rx, ry, rz, s) => api(M.clone().multiply(xf(x, y, z, rx, ry, rz, s))),
    });
    fn(api(new THREE.Matrix4()));
    const out = mergeVertices(mergeGeometries(list, false)); out.name = key;
    return out;
  });
}
const mc = (key, fn) => mesh(merged(key, fn), vmat());
// a light: its own mesh that glows (not merged into the body, so it keeps its glow)
const glow = (key, c, e, fn, ei = .9) => mesh(merged('glow|' + key, fn), mat(c, { emissive: e, ei }));
// half a cylinder (an arch top), axis along z
const halfCyl = (r, h, seg = 14) => new THREE.CylinderGeometry(r, r, h, seg, 1, false, -HP, PI);
// a box whose top sags (the hammock's bed): nx × nz cells, y += f(u, v) with u, v in -1..1
function sagBox(w, h, d, nx, nz, f) {
  const g = new THREE.BoxGeometry(w, h, d, nx, 1, nz), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + f(p.getX(i) / (w / 2), p.getZ(i) / (d / 2)));
  g.computeVertexNormals(); return g;
}

const B = {};

// ── 네온 램프 (1×1, low): a crescent moon and a star of pink neon tube on a small dark base
const NEON = '#ff6fae';
B.sp_neonlamp = f => {
  const root = grp(); root.scale.setScalar(1.3); f.add(root);
  root.add(mc('neonlamp', ({ add, tube }) => {
    add(G.box(.36, .07, .17, .025), INK, 0, .035, -.04);
    add(G.box(.3, .012, .12, .004), INK2, 0, .074, -.04);
    for (const x of [-.09, .07]) tube([x, .07, -.04], [x, .15, -.04], .008, STEEL, 6);   // clear clips that hold the tube
    add(G.box(.06, .02, .012, .004), STEEL2, .12, .035, .05);                             // the little switch
  }));
  root.add(glow('neonlamp', '#ff9cc8', NEON, ({ add }) => {
    add(G.tor(.12, .022, PI * 1.4, 6, 22), '#ffffff', -.02, .22, -.04, 0, 0, PI * .55);
    add(G.ext(starShape(.05, .022), .02, .004), '#ffffff', .1, .3, -.05, 0, 0, .2);
  }));
  f.spot('behind', null, .05, 0, -.34, { maxH: .22, label: K('네온 램프 뒤', 'Behind the neon lamp'), scale: .6 });
};

// ── 스케이트보드 (1×1, low): a board left upside down on the floor — wheels and trucks up, the mint deck art showing —
// and a cream helmet beside it; lift the helmet and something may be under it (헬멧 밑). Wheels-up is the outline that says
// "skateboard" from above.
const MINT = '#4fcfae';
B.sp_skate = f => {
  f.add(mc('skate', ({ in: inn }) => {
    const bd = inn(.02, 0, -.12, 0, .5, 0);   // the board's frame: x along the board, y up (the deck's bottom faces up)
    bd.add(G.box(.54, .026, .2, .012), MINT, 0, .05, 0);
    for (const s of [-1, 1]) bd.add(G.box(.12, .026, .2, .012), MINT, s * .32, .03, 0, 0, 0, -s * .3);   // tails, dipping to the floor
    bd.add(G.box(.13, .006, .2, .003), CREAM, 0, .064, 0);                                  // deck art: a cream band…
    bd.add(G.box(.04, .006, .2, .003), INK, -.1, .064, 0);                                  // …between two ink stripes
    bd.add(G.box(.04, .006, .2, .003), INK, .1, .064, 0);
    bd.add(G.box(.56, .008, .202, .003), INK, 0, .036, 0);                                   // grip tape (the side you stand on, now down)
    for (const sx of [-1, 1]) {
      bd.add(G.box(.05, .028, .07, .008), STEEL2, sx * .2, .076, 0);                        // trucks: base…
      bd.add(G.box(.035, .024, .17, .008), STEEL, sx * .2, .1, 0);                         // …and axle
      for (const sz of [-1, 1]) bd.add(G.cyl(.036, .036, .036, 12), CREAM, sx * .2, .1, sz * .1, HP, 0, 0);   // wheels
    }
  }));
  // the helmet: a cream dome with a mint stripe and a little visor; it lifts
  const HX = -.26, HZ = .26;
  const hm = grp(); put(hm, HX, 0, HZ, 0, .7, 0); f.add(hm);
  hm.add(mc('skate-helmet', ({ add }) => {
    add(new THREE.SphereGeometry(.13, 16, 8, 0, PI * 2, 0, HP), CREAM, 0, 0, 0);
    add(new THREE.SphereGeometry(.133, 16, 6, -.28, .56, 0, HP), MINT, 0, 0, 0);            // the stripe over the top
    add(G.box(.11, .012, .05, .006), MINT, 0, .025, .13, .25, 0, 0);                        // visor
  }));
  const p = f.part('lift', hm, (t, b) => { hm.position.y = b.p.y + .18 * t; hm.rotation.x = -.45 * t; hm.rotation.z = .25 * t; }, { label: K('헬멧', 'Helmet'), sfx: 'lift', dur: .26 });
  f.spot('inside', null, HX, 0, HZ, { part: p, maxH: .11, label: K('헬멧 밑', 'Under the helmet'), scale: .5 });
};

// ── 통기타 (1×1): a cherry-red acoustic guitar leaning in a dark A-frame stand
const CHERRY = '#e65d4f';
B.sp_guitar = f => {
  f.add(mc('guitar', ({ add, tube, in: inn }) => {
    // stand
    for (const sx of [-1, 1]) tube([sx * .2, 0, .14], [sx * .05, .3, -.06], .016, INK, 6);
    tube([0, 0, -.28], [0, .86, -.14], .016, INK, 6);
    tube([-.2, .12, .1], [.2, .12, .1], .016, INK, 6);                                      // the cradle
    for (const sx of [-1, 1]) add(G.cap(.022, .05, 2, 6), INK2, sx * .17, .15, .1);         // …its rubber arms
    add(G.box(.12, .03, .05, .01), INK2, 0, .87, -.13);                                      // the neck yoke
    for (const sx of [-1, 1]) add(G.sph(.022, 8, 6), INK2, sx * .2, .012, .14, 0, 0, 0, [1, .6, 1]);
    add(G.sph(.022, 8, 6), INK2, 0, .012, -.28, 0, 0, 0, [1, .6, 1]);
    // the guitar, leaning back on the yoke
    const gt = inn(0, .05, .02, -.16, 0, 0);
    gt.add(G.sph(.2, 16, 10), CHERRY, 0, .26, 0, 0, 0, 0, [1, 1.05, .32]);                 // lower bout
    gt.add(G.sph(.155, 16, 10), CHERRY, 0, .52, 0, 0, 0, 0, [1, 1, .32]);                  // upper bout
    gt.add(G.cyl(.205, .205, .05, 20), WOODD, 0, .26, -.005, HP, 0, 0, [1, 1, 1.04]);      // the sides (a darker band)
    gt.add(G.cyl(.16, .16, .05, 18), WOODD, 0, .52, -.005, HP, 0, 0);
    gt.add(G.cyl(.05, .05, .012, 16), INK2, 0, .42, .044, HP, 0, 0);                      // sound hole
    gt.add(G.tor(.06, .008, PI * 2, 4, 18), CREAM, 0, .42, .046);                            // …its rosette
    gt.add(G.box(.13, .026, .02, .008), INK, 0, .19, .066);                                  // bridge
    gt.add(G.box(.06, .4, .035, .012), WOOD, 0, .84, .0);                                    // neck
    gt.add(G.box(.046, .4, .008, .003), INK, 0, .84, .02);                                   // fretboard
    gt.add(G.box(.09, .14, .035, .015), WOODD, 0, 1.1, -.01, -.15, 0, 0);                    // headstock
    for (const sx of [-1, 1]) for (const y of [1.06, 1.13]) gt.add(G.cyl(.012, .012, .03, 8), CREAM, sx * .055, y, -.01, 0, 0, HP);
    for (const sx of [-1, 1]) gt.tube([sx * .008, .19, .05], [sx * .008, 1.03, .026], .0035, CREAM, 3);   // two strings, no more
  }));
  f.spot('behind', null, .22, 0, -.3, { maxH: .4, label: K('기타 뒤', 'Behind the guitar'), scale: .7 });
};

// ── BMX (2×1): a small stunt bike — chunky orange frame, fat tyres on cream mag wheels, tall cross-braced bars and axle
// pegs (the shop bike is a tall, thin city bike with a basket; this one is low and stocky)
const ORANGE = '#ff8a2a';
B.sp_bmx = f => {
  f.add(mc('bmx', ({ add, tube, in: inn }) => {
    const R = [-.48, .25, 0], F = [.48, .25, 0], BB = [-.04, .24, 0], SC = [-.18, .58, 0], HT = [.32, .66, 0], HB = [.36, .5, 0];
    for (const p of [R, F]) {
      add(G.tor(.2, .055, PI * 2, 8, 22), TIRE, ...p);                                     // fat tyres
      add(G.cyl(.05, .05, .1, 12), CREAM, ...p, HP, 0, 0);                                  // hub
      for (let k = 0; k < 5; k++) inn(...p, 0, 0, k / 5 * PI * 2).add(G.box(.036, .11, .03, .008), CREAM, 0, .095, 0);   // five fat mag spokes…
      add(G.tor(.15, .016, PI * 2, 4, 20), CREAM, ...p);                                    // …into the rim
      for (const sz of [-1, 1]) add(G.cyl(.026, .026, .09, 10), STEEL, p[0], p[1], sz * .1, HP, 0, 0);   // pegs
    }
    const r = .036;
    tube(R, BB, r, ORANGE, 8); tube(R, SC, r * .85, ORANGE, 8); tube(BB, SC, r, ORANGE, 8);
    tube(SC, HT, r * 1.1, ORANGE, 8); tube(BB, HB, r * 1.15, ORANGE, 8); tube(HB, HT, r * 1.25, ORANGE, 8);
    for (const sz of [-1, 1]) tube([HB[0], HB[1], sz * .05], [F[0], F[1], sz * .05], .022, ORANGE, 6);   // fork
    add(G.cap(.03, .14, 2, 8), INK, -.2, .66, 0, 0, 0, HP - .1);                             // a little seat
    tube(SC, [-.2, .64, 0], .02, STEEL2, 6);
    // tall bars with a cross brace, grips sticking out sideways
    tube(HT, [.31, .74, 0], .022, STEEL2, 6);
    for (const sz of [-1, 1]) tube([.31, .74, sz * .05], [.26, .96, sz * .22], .016, STEEL2, 6);
    tube([.28, .87, -.15], [.28, .87, .15], .013, STEEL2, 6);
    tube([.26, .96, -.22], [.26, .96, .22], .016, STEEL2, 6);
    for (const sz of [-1, 1]) add(G.cap(.026, .08, 2, 8), INK, .26, .96, sz * .27, HP, 0, 0);
    // chainring, cranks, pedals
    add(G.cyl(.075, .075, .015, 16), STEEL, BB[0], BB[1], .06, HP, 0, 0);
    tube([BB[0], BB[1], .075], [BB[0] + .08, BB[1] - .12, .075], .014, STEEL2, 6);
    tube([BB[0], BB[1], -.07], [BB[0] - .08, BB[1] + .12, -.07], .014, STEEL2, 6);
    add(G.box(.08, .02, .06, .006), INK, BB[0] + .08, BB[1] - .12, .11);
    add(G.box(.08, .02, .06, .006), INK, BB[0] - .08, BB[1] + .12, -.11);
    tube([R[0], R[1] - .03, .06], [BB[0], BB[1] - .07, .06], .008, INK2, 4);                 // the chain, top and bottom run
    tube([R[0], R[1] + .03, .06], [BB[0], BB[1] + .07, .06], .008, INK2, 4);
  }));
  f.spot('behind', null, .05, 0, -.32, { maxH: .35, label: K('BMX 옆', 'Beside the BMX'), scale: .7 });
};

// ── 주크박스 (1×1): a wooden jukebox with a round top, an amber neon arch, a record window and a grille
const AMBER = '#ffb347';
B.sp_jukebox = f => {
  const Z = -.08, D = .42, FZ = Z + D / 2;
  f.add(mc('jukebox', ({ add }) => {
    add(G.box(.64, .86, D, .04), WOOD, 0, .43, Z);
    add(halfCyl(.32, D, 18), WOOD, 0, .86, Z, -HP, 0, 0);
    add(G.box(.68, .05, D + .04, .015), WOODD, 0, .025, Z);                                  // plinth
    add(G.box(.46, .26, .02, .01), INK, 0, .3, FZ + .006);                                   // grille…
    for (let k = 0; k < 5; k++) add(G.box(.4, .016, .012, .004), OAT, 0, .2 + k * .05, FZ + .018);
    add(G.box(.46, .08, .03, .012), CREAM, 0, .52, FZ + .01, -.25, 0, 0);                   // the song-picker panel
    for (let k = 0; k < 5; k++) add(G.box(.05, .022, .02, .006), k === 2 ? INK : STEEL2, -.16 + k * .08, .54, FZ + .03, -.25, 0, 0);
    add(halfCyl(.21, .02, 16), INK, 0, .7, FZ + .006, -HP, 0, 0);                             // the record window…
    add(G.box(.42, .1, .02, .004), INK, 0, .65, FZ + .006);
    add(G.cyl(.11, .11, .012, 18), INK2, 0, .72, FZ + .02, HP, 0, 0);                        // …a record in it
    add(G.cyl(.035, .035, .016, 12), CREAM, 0, .72, FZ + .024, HP, 0, 0);
  }));
  f.add(glow('jukebox', '#ffc46b', AMBER, ({ add }) => {
    add(G.tor(.27, .026, PI, 6, 20), '#ffffff', 0, .86, FZ + .016);                          // the neon arch over the window…
    for (const sx of [-1, 1]) add(G.cyl(.026, .026, .76, 8), '#ffffff', sx * .27, .48, FZ + .016);   // …and down both sides
  }));
  f.spot('behind', null, .4, 0, -.3, { maxH: .45, label: K('주크박스 옆', 'Beside the jukebox'), scale: .75 });
};

// ── 우주선 모형 (1×1, low): a toy rocket on a stand, nose up and a little tilted, as if just taking off
const RED = '#ff5a5f';
B.sp_rocket = f => {
  const root = grp(); root.scale.setScalar(1.15); f.add(root);
  root.add(mc('rocket', ({ add, tube, in: inn }) => {
    add(G.cyl(.13, .15, .04, 18), INK, 0, .02, 0);
    add(G.cyl(.1, .1, .008, 18), INK2, 0, .043, 0);
    tube([0, .04, 0], [.025, .11, 0], .012, STEEL2, 6);
    const rk = inn(.03, .12, 0, 0, 0, -.28);
    rk.add(G.cap(.06, .12, 3, 12), CREAM, 0, .12, 0);                                        // body
    rk.add(G.cone(.062, .1, 12), RED, 0, .27, 0);                                              // nose
    rk.add(G.cyl(.052, .06, .03, 12), RED, 0, .03, 0);                                        // tail band
    rk.add(G.cyl(.03, .042, .04, 10), STEEL2, 0, -.005, 0);                                   // nozzle
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + .5; rk.add(G.box(.012, .09, .06, .004), RED, Math.sin(a) * .06, .05, Math.cos(a) * .06, 0, a, 0); }
    rk.add(G.cyl(.026, .026, .012, 14), CREAM, 0, .14, .056, HP, 0, 0);                       // window: a cream ring…
    rk.add(G.cyl(.018, .018, .014, 14), INK, 0, .14, .058, HP, 0, 0);                         // …dark glass
  }));
  f.spot('behind', null, -.05, 0, -.28, { maxH: .18, label: K('로켓 받침 뒤', 'Behind the rocket stand'), scale: .55 });
};

// ── 아케이드 게임기 (1×1): an arcade cabinet — oat body, lilac side panels, a glowing screen and marquee, a stick and
// buttons; the lower front door opens on a niche (동전함). The body's profile has the niche cut in; the side panels don't,
// so it is closed at both sides.
const LILAC = '#8f73f0';
B.sp_arcade = f => {
  const W = .6, ZO = -.02, NZ = .1, NY0 = .2, NY1 = .52;   // profile x = depth toward the front (world z = x + ZO), y = up
  const side = niche => {
    const s = new THREE.Shape();
    s.moveTo(-.3, 0); s.lineTo(.26, 0);
    if (niche) { s.lineTo(.26, NY0); s.lineTo(NZ, NY0); s.lineTo(NZ, NY1); s.lineTo(.26, NY1); }
    s.lineTo(.26, .72); s.lineTo(.33, .8); s.lineTo(.3, .86); s.lineTo(.16, .9);
    s.lineTo(.1, 1.24); s.lineTo(.2, 1.3); s.lineTo(.2, 1.5); s.lineTo(-.3, 1.5); s.lineTo(-.3, 0);
    return s;
  };
  const panel = (z, y) => .86 + (.31 - z) / .17 * .04;   // the control panel's top, sloping down to the front
  f.add(mc('arcade', ({ add }) => {
    add(G.ext(side(true), W - .04, 0, 2), OAT, (W - .04) / 2, 0, ZO, 0, -HP, 0);
    for (const sx of [-1, 1]) add(G.ext(side(false), .03, 0, 2), LILAC, sx > 0 ? W / 2 + .01 : -W / 2 + .02, 0, ZO, 0, -HP, 0);
    add(G.box(W - .06, NY1 - NY0 - .01, .01, .003), INK2, 0, (NY0 + NY1) / 2, NZ + ZO + .006);   // the niche's dark back
    add(G.box(W - .04, .3, .02, .004), INK, 0, 1.07, .12, -.175, 0, 0);                      // the screen's bezel
    add(G.box(W - .04, .16, .02, .004), INK, 0, 1.4, .186);                                   // the marquee's frame
    add(G.cyl(.04, .04, .012, 12), INK, -.12, panel(.22) + .004, .22, .23, 0, 0);            // joystick
    add(G.cyl(.012, .012, .08, 8), INK, -.12, panel(.22) + .04, .22);
    add(G.sph(.032, 10, 8), LILAC, -.12, panel(.22) + .085, .22);
    for (let k = 0; k < 3; k++) add(G.cyl(.022, .022, .02, 12), k === 1 ? CREAM : LILAC, .02 + k * .07, panel(.24) + .008, .24, .23, 0, 0);
  }));
  f.add(glow('arcade', '#e9e1ff', '#b9a6ff', ({ add }) => {
    add(G.box(W - .12, .24, .01, .004), '#ffffff', 0, 1.07, .133, -.175, 0, 0);              // the screen
    add(G.box(W - .1, .1, .01, .003), '#ffffff', 0, 1.4, .198);                              // the marquee
  }, .7));
  // the door: hinged on its left edge, two coin slots and a handle
  const DW = W - .04, DH = NY1 - NY0 + .02, FZ = .26 + ZO;
  const door = grp(); put(door, -DW / 2, (NY0 + NY1) / 2, FZ + .011); f.add(door);
  door.add(mc('arcade-door', ({ add }) => {
    add(G.box(DW, DH, .02, .006), STEEL2, DW / 2, 0, 0);
    for (const x of [DW / 2 - .07, DW / 2 + .07]) { add(G.box(.06, .08, .012, .004), INK, x, .05, .012); add(G.box(.012, .045, .014, .002), BRASS, x, .05, .016); }
    add(G.box(.14, .022, .014, .004), STEEL, DW / 2, -.09, .012);
  }));
  const p = f.part('door', door, t => { door.rotation.y = -1.9 * t; }, { label: K('동전함', 'Coin box'), sfx: 'open', dur: .28 });
  f.spot('inside', null, .04, NY0, (NZ + .26) / 2 + ZO, { part: p, maxH: NY1 - NY0 - .02, label: K('동전함', 'Coin box'), scale: .6 });
  f.spot('behind', null, .44, 0, -.25, { maxH: .45, label: K('게임기 옆', 'Beside the arcade machine'), scale: .75 });
};

// ── 망원경 (1×1): a navy telescope with cream rings on a wooden tripod, looking up at the sky
const NAVY = '#4767c9';
B.sp_scope = f => {
  f.add(mc('scope', ({ add, tube, in: inn }) => {
    const H = [0, .82, 0];
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + PI / 6; tube([Math.sin(a) * .3, 0, Math.cos(a) * .3], H, .02, WOOD, 6, .015); add(G.sph(.024, 8, 6), WOODD, Math.sin(a) * .3, .012, Math.cos(a) * .3, 0, 0, 0, [1, .6, 1]); }
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + PI / 6; tube([Math.sin(a) * .15, .42, Math.cos(a) * .15], [0, .4, 0], .008, WOODD, 4); }   // the spreader
    add(G.cyl(.05, .06, .07, 12), WOODD, 0, .83, 0);
    add(G.box(.05, .08, .06, .01), STEEL2, 0, .89, 0);
    const tb = inn(0, .93, 0, 0, .78, .55);   // the tube's frame: x along the tube, eyepiece at -x
    tb.add(G.cyl(.075, .058, .66, 16), NAVY, .02, 0, 0, 0, 0, -HP);
    tb.add(G.cyl(.085, .085, .12, 16), NAVY, .34, 0, 0, 0, 0, -HP);                          // dew shield
    tb.add(G.cyl(.068, .068, .012, 16), '#bfe3f2', .405, 0, 0, 0, 0, -HP);                    // the lens
    for (const x of [-.12, .18]) tb.add(G.cyl(.078, .078, .03, 16), CREAM, x, 0, 0, 0, 0, -HP);   // cream rings
    tb.add(G.cyl(.024, .024, .12, 10), INK, -.36, 0, 0, 0, 0, -HP);                           // focuser and eyepiece
    tb.add(G.cyl(.03, .03, .05, 10), INK2, -.44, 0, 0, 0, 0, -HP);
    tb.add(G.cyl(.018, .018, .2, 8), CREAM, .0, .1, 0, 0, 0, -HP);                           // finder scope
    for (const x of [-.06, .06]) tb.add(G.box(.014, .03, .014, .003), STEEL2, x, .075, 0);
  }));
  f.spot('under', null, 0, 0, .02, { maxH: .38, label: K('망원경 밑', 'Under the telescope'), scale: .75 });
};

// ── 드럼 세트 (2×1): a small kit — a bass drum with a cream front head, a snare, a floor tom, a rack tom, a hi-hat and a
// crash, and the drummer's stool behind. Shells in one blue; the cymbals in a quiet brass. The bass drum's front head lifts
// off: the drum is a hollow shell (큰북 안).
const BLUE = '#3f86e0', CYM = '#dcc27a';
B.sp_drums = f => {
  const BZ = .02, BY = .27, BR = .26, BD = .3;   // the bass drum: lying on its side, axis along z, front at BZ + BD / 2
  f.add(mc('drums', ({ add, tube, in: inn }) => {
    const bass = inn(0, BY, BZ, HP, 0, 0);   // its frame: y along the drum's axis toward the back… (rx = +90°: y → +z)
    bass.add(G.cyl(BR, BR, BD, 22, true), BLUE, 0, 0, 0);
    bass.add(G.cyl(BR - .012, BR - .012, BD, 22, true), INK2, 0, 0, 0, 0, 0, 0, [-1, 1, 1]);   // the inside (mirrored: faces in)
    bass.add(G.cyl(BR - .006, BR - .006, .01, 22), CREAM, 0, -BD / 2 + .005, 0);                 // the back (batter) head
    for (const e of [-1, 1]) bass.add(G.tor(BR - .006, .02, PI * 2, 4, 26), STEEL, 0, e * BD / 2, 0, HP, 0, 0);   // hoops
    for (const sx of [-1, 1]) tube([sx * .2, BY - .12, BZ + .06], [sx * .3, 0, BZ + .14], .012, STEEL2, 6);   // spurs
    add(G.box(.12, .04, .14, .01), INK, 0, .02, BZ - .3);                                     // the pedal
    // a drum stood up (axis y): shell, cream head, a steel hoop round the head
    const drum = (x, y, z, r, h, rx = 0, rz = 0) => {
      const d = inn(x, y, z, rx, 0, rz);
      d.add(G.cyl(r, r, h, 20), BLUE, 0, 0, 0);
      d.add(G.cyl(r - .006, r - .006, .01, 20), CREAM, 0, h / 2 + .002, 0);
      d.add(G.tor(r, .012, PI * 2, 4, 22), STEEL, 0, h / 2, 0, HP, 0, 0);
    };
    drum(-.5, .5, .14, .14, .12, .15);                                                        // snare on a tripod
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; tube([-.5, .44, .14], [-.5 + Math.sin(a) * .16, 0, .14 + Math.cos(a) * .16], .01, STEEL2, 4); }
    drum(.5, .36, .12, .16, .26);                                                             // floor tom on three legs
    for (const [dx, dz] of [[-.12, .1], [.12, .1], [0, -.13]]) tube([.5 + dx, .3, .12 + dz], [.5 + dx * 1.2, 0, .12 + dz * 1.2], .01, STEEL2, 4);
    drum(.14, .63, 0, .11, .13, .35, -.2);                                                    // rack tom on the bass drum
    tube([.08, BY + BR - .02, BZ], [.12, .57, 0], .012, STEEL2, 4);
    // hi-hat (left back) and crash (right back) on stands
    tube([-.78, 0, -.12], [-.78, .88, -.12], .012, STEEL2, 6);
    add(G.cyl(.15, .15, .012, 20), CYM, -.78, .84, -.12); add(G.cyl(.15, .15, .012, 20), CYM, -.78, .87, -.12);
    tube([.8, 0, -.22], [.76, 1.0, -.2], .012, STEEL2, 6);
    add(G.cyl(.18, .18, .012, 20), CYM, .76, 1.02, -.2, .3, 0, -.2);
    for (const [x, z] of [[-.78, -.12], [.8, -.22]]) for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; tube([x, .1, z], [x + Math.sin(a) * .13, 0, z + Math.cos(a) * .13], .008, STEEL2, 4); }
    // the stool behind
    add(G.cyl(.14, .15, .06, 16), INK, -.12, .42, -.34);
    tube([-.12, .4, -.34], [-.12, .1, -.34], .02, STEEL2, 6);
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + .4; tube([-.12, .12, -.34], [-.12 + Math.sin(a) * .14, 0, -.34 + Math.cos(a) * .1], .01, STEEL2, 4); }
  }));
  // the front head: a cream skin with a blue ring and a star, in its own hoop; it lifts off
  const head = grp(); put(head, 0, BY, BZ + BD / 2 + .008); f.add(head);
  head.add(mc('drums-head', ({ add }) => {
    add(G.cyl(BR - .006, BR - .006, .012, 22), CREAM, 0, 0, 0, HP, 0, 0);
    add(G.tor(BR - .006, .022, PI * 2, 4, 26), STEEL, 0, 0, .004);
    add(G.tor(.15, .012, PI * 2, 4, 22), BLUE, 0, 0, .008);
    add(G.ext(starShape(.07, .03), .006, 0), BLUE, 0, 0, .007);
  }));
  const p = f.part('lift', head, (t, b) => { head.position.z = b.p.z + .2 * t; head.position.y = b.p.y + .3 * t; head.rotation.x = -.7 * t; }, { label: K('큰북 앞판', 'Bass drum head'), sfx: 'lift', dur: .3 });
  f.spot('inside', null, 0, BY - BR + .02, BZ + .03, { part: p, maxH: .3, label: K('큰북 안', 'Inside the bass drum'), scale: .7 });
  f.spot('under', null, -.12, 0, -.34, { maxH: .3, label: K('드럼 의자 밑', 'Under the drum stool'), scale: .65 });
};

// ── 해먹 (2×1): a cream-and-yellow striped hammock slung between two wooden posts, a pillow at one end
const YELLOW = '#ffc93c';
B.sp_hammock = f => {
  const L = 1.36, Wd = .6, Y0 = .62, SAG = .26;
  const sag = (u, v) => -SAG * (1 - u * u) - .05 * (1 - v * v) * (1 - u * u);
  f.add(mc('hammock', ({ add, tube }) => {
    for (const sx of [-1, 1]) {
      add(G.box(.09, 1.02, .09, .02), WOOD, sx * .88, .51, 0);
      add(G.box(.1, .06, .5, .02), WOODD, sx * .88, .03, 0);
      add(G.sph(.055, 10, 8), WOODD, sx * .88, 1.05, 0);
      add(G.cyl(.022, .022, Wd + .06, 8), WOODD, sx * L / 2, Y0, 0, HP, 0, 0);                // spreader bars
      for (const sz of [-1, 1]) tube([sx * L / 2, Y0, sz * Wd / 2], [sx * .86, .96, 0], .008, OAT, 4);   // ropes
    }
    // the bed: five strips across, cream / yellow, each sagging the same way (a deformed box: solid from both sides)
    for (let k = 0; k < 5; k++) {
      const w = Wd / 5, z = -Wd / 2 + w * (k + .5);
      const g = sagBox(L, .026, w, 12, 2, (u, v) => sag(u, (z + v * w / 2) / (Wd / 2)));
      add(g, k % 2 ? YELLOW : CREAM, 0, Y0, z);
    }
    add(G.sph(.13, 12, 8), CREAM, -.5, Y0 - .11, 0, 0, 0, .25, [1, .55, 1.4]);              // pillow
    add(G.tor(.06, .008, PI * 2, 4, 14), YELLOW, -.5, Y0 - .06, 0, HP, 0, .25);
  }));
  f.spot('on', null, .18, Y0 + sag(.18 / (L / 2), 0) + .013, 0, { maxH: .3, label: K('해먹 위', 'In the hammock'), scale: .75 });
  f.spot('under', null, -.05, 0, .05, { maxH: .25, label: K('해먹 밑', 'Under the hammock'), scale: .75 });
};

// ── 피아노 (2×1): a walnut upright piano with cream keys and a coral-cushioned bench in front; a coral metronome on top
const CORAL = '#ff7a64';
B.sp_piano = f => {
  const BK = -.27, KY = .7;
  f.add(mc('piano', ({ add }) => {
    add(G.box(1.44, 1.16, .44, .03), WALNUT, 0, .58, BK);                                     // case
    add(G.box(1.5, .05, .5, .015), WALNUT, 0, 1.185, BK + .01);                               // top lid
    add(G.box(1.24, .4, .02, .01), '#a2704f', 0, .28, BK + .225);                              // lower front panel
    add(G.box(1.38, .08, .26, .015), WALNUT, 0, KY - .045, .0);                               // the keybed
    add(G.box(1.26, .028, .16, .004), CREAM, 0, KY, .03);                                      // white keys…
    for (let k = 1; k < 21; k++) add(G.box(.004, .03, .15, .001), OAT, -.63 + k * .06, KY + .001, .035);   // …and their gaps
    const BL = [1, 1, 0, 1, 1, 1, 0];
    for (let k = 0; k < 20; k++) if (BL[k % 7]) add(G.box(.032, .022, .09, .004), INK, -.63 + (k + 1) * .06, KY + .024, -.0);
    for (const sx of [-1, 1]) {
      add(G.box(.06, .14, .26, .012), WALNUT, sx * .66, KY + .02, .0);                       // cheek blocks
      add(G.box(.07, .62, .07, .015), WALNUT, sx * .62, .31, .08);                            // legs
      add(G.box(.09, .04, .1, .01), '#a2704f', sx * .62, .02, .1);
    }
    add(G.box(1.26, .13, .025, .006), WALNUT, 0, KY + .1, -.035);                              // fallboard (open)
    add(G.box(.8, .26, .025, .008), '#a2704f', 0, .93, BK + .235, -.18, 0, 0);               // music desk…
    add(G.box(.32, .22, .006, .002), CREAM, -.14, .94, BK + .252, -.18, 0, 0);               // …with a sheet of music
    for (const x of [-.06, .06]) add(G.box(.04, .015, .1, .004), BRASS, x, .03, BK + .26);    // pedals
    // metronome on the lid
    add(G.cone(.07, .2, 4), CORAL, .48, 1.31, BK, 0, PI / 4, 0);
    add(G.box(.008, .14, .008, .002), CREAM, .48, 1.33, BK + .052, 0, 0, .25);
    // the bench
    add(G.box(.72, .05, .28, .015), WALNUT, 0, .44, .36);
    add(G.box(.68, .06, .26, .025), CORAL, 0, .495, .36);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.045, .42, .045, .01), WALNUT, sx * .31, .21, .36 + sz * .1);
  }));
  f.spot('under', null, .12, 0, .36, { maxH: .35, label: K('피아노 의자 밑', 'Under the piano bench'), scale: .75 });
  f.spot('on', null, -.38, 1.21, BK + .02, { maxH: .35, label: K('피아노 위', 'On top of the piano'), scale: .7 });
};

// ── 오토바이 (2×1): a round little sky-blue scooter, front to +x. The seat lifts: a storage tub under it (시트 밑).
const SKY = '#7cc4f2';
B.sp_moto = f => {
  const S = 1.12, RX = -.32, TOP = .52;   // the rear body: a tub open on top, the seat its lid
  const root = grp(); root.scale.setScalar(S); f.add(root);
  root.add(mc('moto', ({ add, tube }) => {
    for (const x of [-.5, .5]) {
      add(G.tor(.135, .05, PI * 2, 8, 20), TIRE, x, .19, 0);
      add(G.cyl(.09, .09, .1, 16), CREAM, x, .19, 0, HP, 0, 0);
      add(G.cyl(.035, .035, .12, 10), STEEL2, x, .19, 0, HP, 0, 0);
    }
    add(G.box(.54, .17, .36, .07), SKY, RX, .29, 0);                                         // the rear body…
    for (const sz of [-1, 1]) add(G.box(.52, .15, .03, .014), SKY, RX, TOP - .075, sz * .165);  // …its tub walls
    for (const sx of [-1, 1]) add(G.box(.03, .15, .3, .012), SKY, RX + sx * .245, TOP - .075, 0);
    add(G.box(.46, .02, .3, .004), INK2, RX, .36, 0);                                          // the tub's floor
    add(G.sph(.2, 14, 10), SKY, -.5, .26, 0, 0, 0, 0, [1, .55, .95]);                          // round rear cowl over the wheel
    add(G.box(.5, .06, .3, .02), INK, .08, .2, 0);                                              // floorboard
    add(G.sph(.18, 14, 10), SKY, .36, .44, 0, 0, 0, 0, [.42, 1.35, 1]);                        // leg shield
    add(G.sph(.17, 14, 8), SKY, .5, .33, 0, 0, 0, 0, [1, .45, .7]);                            // front fender
    tube([.42, .5, 0], [.38, .84, 0], .025, STEEL2, 8);                                        // steering column
    add(G.box(.13, .1, .15, .04), SKY, .38, .88, 0);                                           // the headset…
    add(G.cyl(.05, .05, .03, 14), CREAM, .45, .89, 0, 0, 0, HP);                               // …its round headlight
    add(G.cap(.018, .48, 2, 8), STEEL2, .36, .92, 0, HP, 0, 0);                                // bars
    for (const sz of [-1, 1]) {
      add(G.cap(.026, .08, 2, 8), INK, .36, .92, sz * .26, HP, 0, 0);                          // grips
      tube([.36, .93, sz * .16], [.34, 1.06, sz * .2], .007, STEEL2, 4);                       // mirrors
      add(G.cyl(.04, .04, .012, 12), STEEL, .34, 1.08, sz * .2, 0, 0, HP);
    }
    add(G.box(.08, .03, .07, .01), '#ffd27a', -.71, .4, 0);                                    // tail light
  }));
  // the seat, hinged at its front edge
  const seat = grp(); put(seat, RX + .25, TOP, 0); root.add(seat);
  seat.add(mc('moto-seat', ({ add }) => {
    add(G.box(.54, .05, .36, .02), SKY, -.25, .025, 0);                                         // the lid, flush with the body…
    add(G.box(.52, .1, .34, .05), '#9a6a4a', -.25, .09, 0);                                    // …and the brown cushion on it
    add(G.box(.44, .012, .03, .004), '#c79a6c', -.25, .14, 0);                                  // a stitched seam
  }));
  const p = f.part('lid', seat, t => { seat.rotation.z = -1.25 * t; }, { label: K('오토바이 시트', 'Scooter seat'), sfx: 'open', dur: .28 });
  f.spot('inside', null, RX * S, .37 * S, 0, { part: p, maxH: .14 * S, label: K('시트 밑', 'Under the seat'), scale: .55 });
  f.spot('behind', null, .1, 0, -.32, { maxH: .35, label: K('오토바이 옆', 'Beside the scooter'), scale: .7 });
};

// ── 공룡 뼈 모형 (2×1): a museum fossil — a little long-necked dinosaur in cream bone on a slate plinth with a brass plaque,
// held up on two brass rods
const SLATE = '#a9a1bf', SLATE2 = '#8c84a6';
B.sp_dino = f => {
  f.add(mc('dino', ({ add, tube }) => {
    add(G.box(1.74, .2, .66, .03), SLATE, 0, .12, 0);
    add(G.box(1.84, .04, .76, .015), SLATE2, 0, .02, 0);                                       // a foot…
    add(G.box(1.8, .03, .72, .012), SLATE2, 0, .235, 0);                                       // …and a top edge
    add(G.box(.34, .09, .012, .008), BRASS, .5, .12, .336);                                    // the plaque
    add(G.box(.24, .012, .006, .002), WALNUT, .5, .135, .344); add(G.box(.18, .012, .006, .002), WALNUT, .5, .11, .344);
    for (const x of [-.18, .24]) tube([x, .25, 0], [x, .62, 0], .016, BRASS, 6);
    // spine: tail tip → hips → back → shoulders → neck → head, a bead of bone every few cm
    const P = [[-.86, .3], [-.7, .4], [-.52, .52], [-.32, .62], [-.1, .66], [.12, .65], [.3, .64], [.44, .74], [.54, .9], [.6, 1.04]];
    const pts = new THREE.CatmullRomCurve3(P.map(([x, y]) => new THREE.Vector3(x, y, 0))).getSpacedPoints(22);
    pts.forEach((q, i) => { const u = i / 22, r = .03 + .028 * Math.sin(Math.min(1, u * 1.6) * PI * .5) * (u > .8 ? .8 : 1); add(G.sph(r, 8, 6), BONE, q.x, q.y, 0); });
    // ribs: hoops hanging from the back
    for (let k = 0; k < 5; k++) { const x = -.22 + k * .1, r = .15 - Math.abs(k - 2) * .018; add(G.tor(r, .02, PI * .82, 4, 12), BONE, x, .64 + r * .28, 0, 0, HP, -HP - PI * .41); }
    // hips and shoulders
    add(G.sph(.1, 10, 8), BONE, -.32, .6, 0, 0, 0, 0, [1.2, .7, 1.1]);
    add(G.sph(.07, 10, 8), BONE, .28, .62, 0, 0, 0, 0, [1, .7, 1.1]);
    // legs (thigh + shin + foot), standing on the plinth
    for (const [hx, kx] of [[-.32, -.26], [.28, .32]]) for (const sz of [-1, 1]) {
      const z = sz * .12;
      tube([hx, .58, z], [kx, .4, z], .042, BONE, 8, .036);
      tube([kx, .4, z], [kx - .03, .27, z], .034, BONE, 8, .028);
      add(G.sph(.045, 8, 6), BONE, kx, .4, z);
      add(G.box(.13, .045, .08, .018), BONE, kx, .27, z);
    }
    // skull, jaw, eye sockets
    add(G.box(.2, .1, .12, .04), BONE, .69, 1.08, 0, 0, 0, -.25);
    add(G.box(.15, .035, .09, .014), BONE, .71, 1.02, 0, 0, 0, -.35);
    for (const sz of [-1, 1]) add(G.sph(.02, 8, 6), INK, .68, 1.11, sz * .055);
  }));
  f.spot('under', null, -.02, .25, .02, { maxH: .28, label: K('공룡 갈비뼈 밑', 'Under the dinosaur ribs'), scale: .75 });
  f.spot('on', null, -.7, .25, .2, { maxH: .3, label: K('공룡 받침 위', 'On the fossil stand'), scale: .7 });
};

export const SPECIAL_BUILDERS = B;
// names in Korean (EN beside them); sizes and prices as specials.js SPECIALS (the price that counts is the SPECIALS one)
export const SPECIAL_INFO = {
  sp_neonlamp: { w: 1, d: 1, name: K('네온 램프', 'Neon Lamp'), price: 220 },
  sp_skate: { w: 1, d: 1, name: K('스케이트보드', 'Skateboard'), price: 260 },
  sp_guitar: { w: 1, d: 1, name: K('통기타', 'Acoustic Guitar'), price: 320 },
  sp_bmx: { w: 2, d: 1, name: K('BMX', 'BMX Bike'), price: 420 },
  sp_jukebox: { w: 1, d: 1, name: K('주크박스', 'Jukebox'), price: 450 },
  sp_rocket: { w: 1, d: 1, name: K('우주선 모형', 'Model Rocket'), price: 380 },
  sp_arcade: { w: 1, d: 1, name: K('아케이드 게임기', 'Arcade Machine'), price: 400 },
  sp_scope: { w: 1, d: 1, name: K('망원경', 'Telescope'), price: 400 },
  sp_drums: { w: 2, d: 1, name: K('드럼 세트', 'Drum Kit'), price: 500 },
  sp_hammock: { w: 2, d: 1, name: K('해먹', 'Hammock'), price: 480 },
  sp_piano: { w: 2, d: 1, name: K('피아노', 'Piano'), price: 600 },
  sp_moto: { w: 2, d: 1, name: K('오토바이', 'Scooter'), price: 700 },
  sp_dino: { w: 2, d: 1, name: K('공룡 뼈 모형', 'Dinosaur Fossil'), price: 800 },
};

// ════ 스페셜 2차 (⑥ 스페셜 물건 세션 10/21, user: "스페셜 물건도 잔뜩 해줘") ═════════════════════════════════════════
// More pieces you hardly ever see in a stage — fairground, music, space, garden — in the same look: calm cream / oat / wood /
// ink bodies, one point colour (a fairground piece may carry a few pastels), lights as their own glowing mesh. Keys sp2_.
const PINK = '#ff7eb6', MINT2 = '#5fd3b8', LEAF = '#6cc46a', LEAF2 = '#4fa85a', SKY2 = '#8fd0ff', AQUA = '#7fe0f0', TERRA = '#d9785a',
  CARAMEL = '#d39a62', VIOLET = '#9d7bff', LIME = '#a3d94b', SAGE = '#86c49a', TOMATO = '#ff6b5b', GOLD = '#ffcc4d', OCEAN = '#4f9de8';
const PASTEL = [PINK, MINT2, GOLD, '#b9a6ff', SKY2, '#ffa36b'];
// a cone (or a cylinder) cut in n wedges, every other one in the second colour: canopies and tent stripes
const wedges = (add, r0, r1, h, n, c1, c2, x, y, z, open = false) => {
  for (let k = 0; k < n; k++) add(new THREE.CylinderGeometry(r0, r1, h, Math.max(2, Math.round(24 / n)), 1, open, k / n * PI * 2, PI * 2 / n), k % 2 ? c2 : c1, x, y, z);
};

// ── 미니 관람차 (1×1): a little Ferris wheel on two A-frames, six pastel cabins and warm bulbs round the rim
B.sp2_ferris = f => {
  const CY = .74, R = .46;
  f.add(mc('sp2-ferris', ({ add, tube }) => {
    add(G.box(.86, .07, .52, .025), OAT, 0, .035, 0);
    add(G.box(.8, .012, .46, .005), WOODD, 0, .074, 0);
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) tube([sx * .34, .07, sz * .16], [0, CY, sz * .1], .024, CREAM, 6);
    add(G.cyl(.05, .05, .26, 12), STEEL2, 0, CY, 0, HP, 0, 0);
    for (const sz of [-1, 1]) {
      add(G.tor(R, .02, PI * 2, 4, 32), CREAM, 0, CY, sz * .07);
      for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2; tube([0, CY, sz * .07], [Math.cos(a) * R, CY + Math.sin(a) * R, sz * .07], .009, CREAM, 3); }
    }
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * PI * 2 + .26, x = Math.cos(a) * R, y = CY + Math.sin(a) * R;
      tube([x, y, -.08], [x, y, .08], .01, STEEL2, 4);
      tube([x, y, 0], [x, y - .05, 0], .008, STEEL2, 3);
      add(G.box(.12, .1, .13, .03), PASTEL[k], x, y - .1, 0);
      add(G.box(.09, .04, .135, .01), CREAM, x, y - .085, 0);
      add(G.cyl(.02, .085, .045, 10), PASTEL[k], x, y - .03, 0);
    }
  }));
  f.add(glow('sp2-ferris', '#fff1b8', GOLD, ({ add }) => {
    for (let k = 0; k < 10; k++) { const a = k / 10 * PI * 2 + PI / 10; add(G.sph(.028, 6, 4), '#ffffff', Math.cos(a) * R, CY + Math.sin(a) * R, .07); }
    add(G.sph(.04, 8, 6), '#ffffff', 0, CY, .14);
  }, .8));
  f.spot('on', null, .26, .08, .17, { maxH: .26, label: K('관람차 받침 위', 'On the Ferris wheel base'), scale: .55 });
};

// ── 솜사탕 기계 (1×1): a fairground cart — cream body with pink stripes, a steel pan heaped with pink floss, a striped canopy
B.sp2_cotton = f => {
  f.add(mc('sp2-cotton', ({ add, tube }) => {
    add(G.box(.62, .5, .42, .04), CREAM, 0, .3, 0);
    for (const x of [-.2, 0, .2]) add(G.box(.08, .46, .012, .004), PINK, x, .3, .213);
    add(G.box(.66, .04, .46, .015), WOODD, 0, .56, 0);
    for (const sx of [-1, 1]) { add(G.cyl(.1, .1, .04, 16), INK, sx * .33, .1, .08, 0, 0, HP); add(G.cyl(.04, .04, .05, 10), CREAM, sx * .34, .1, .08, 0, 0, HP); }
    add(G.box(.06, .05, .06, .015), WOODD, -.24, .025, -.14);
    add(G.cyl(.2, .14, .12, 20, true), STEEL, .02, .64, 0);
    add(G.cyl(.14, .14, .01, 20), STEEL2, .02, .585, 0);
    for (const [x, y, z, r] of [[0, .72, 0, .14], [.1, .7, .06, .1], [-.08, .71, -.05, .11], [.06, .79, -.04, .09], [-.04, .78, .06, .08]]) add(G.sph(r, 12, 8), '#ffc4de', x + .02, y, z);
    for (const sx of [-1, 1]) tube([sx * .28, .58, -.17], [sx * .28, 1.18, -.17], .016, STEEL2, 6);
    wedges(add, .02, .42, .2, 8, PINK, CREAM, 0, 1.28, -.05);
    add(G.sph(.04, 10, 8), PINK, 0, 1.39, -.05);
    add(G.box(.12, .1, .1, .02), WOOD, -.22, .63, .1);
    for (const [x, z, c] of [[-.25, .08, '#ffc4de'], [-.19, .12, '#c9e8ff']]) { tube([x, .66, z], [x, .82, z], .006, CREAM, 4); add(G.sph(.055, 10, 8), c, x, .86, z); }
  }));
  f.spot('behind', null, .38, 0, -.3, { maxH: .4, label: K('솜사탕 수레 옆', 'Beside the candy floss cart'), scale: .7 });
};

// ── 왕 지구본 (1×1): a big globe on a wooden tripod — ocean blue, mint continents, a brass meridian, tilted on its axis
B.sp2_globe = f => {
  const CY = .82, R = .3, T = .41;
  f.add(mc('sp2-globe', ({ add, tube, in: inn }) => {
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + PI / 6; tube([Math.sin(a) * .3, 0, Math.cos(a) * .3], [0, .42, 0], .028, WOOD, 6, .02); add(G.sph(.03, 8, 6), WOODD, Math.sin(a) * .3, .015, Math.cos(a) * .3, 0, 0, 0, [1, .6, 1]); }
    add(G.cyl(.08, .1, .08, 14), WOODD, 0, .44, 0);
    tube([0, .48, 0], [0, CY - R - .03, 0], .02, BRASS, 6);
    const g = inn(0, CY, 0, 0, 0, T);
    g.add(G.tor(R + .04, .018, PI * 1.1, 4, 30), BRASS, 0, 0, 0, 0, 0, -PI * .55);
    g.add(G.cyl(.012, .012, R * 2 + .12, 6), BRASS, 0, 0, 0);
    const s = inn(0, CY, 0, 0, .4, T);
    s.add(G.sph(R, 24, 16), OCEAN, 0, 0, 0);
    for (const [la, lo, w, h] of [[.6, .3, .16, .12], [.2, .6, .1, .16], [-.3, .5, .08, .12], [.4, 2.2, .18, .1], [.05, 2.5, .1, .14], [-.5, 2.1, .07, .08], [.55, 3.9, .14, .1], [-.2, 4.3, .1, .14], [.1, 5.3, .09, .06]]) {
      const q = new THREE.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)).multiplyScalar(R - .01);
      const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), q, new THREE.Vector3(0, 1, 0));
      const e = new THREE.Euler().setFromRotationMatrix(m);
      s.add(G.sph(1, 10, 6), MINT2, q.x, q.y, q.z, e.x, e.y, e.z, [w, h, .035]);
    }
    add(G.sph(.025, 8, 6), BRASS, ...new THREE.Vector3(0, R + .06, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), T).add(new THREE.Vector3(0, CY, 0)).toArray());
  }));
  f.spot('under', null, 0, 0, 0, { maxH: .36, label: K('지구본 밑', 'Under the globe'), scale: .7 });
};

// ── 아쿠아리움 수조 (2×1): a long tank on a wooden cabinet — aqua back and sides, sand, weed, a little castle, orange fish
B.sp2_aquarium = f => {
  const W = 1.5, D = .46, Y0 = .56, H = .52, Z = -.02, FZ = Z + D / 2;
  f.add(mc('sp2-aquarium', ({ add, tube }) => {
    add(G.box(W + .04, Y0 - .04, D + .04, .03), WOOD, 0, (Y0 - .04) / 2, Z);
    for (const sx of [-1, 1]) { add(G.box(W / 2 - .06, Y0 - .16, .02, .01), WOODD, sx * W / 4, (Y0 - .04) / 2, FZ + .025); add(G.cyl(.018, .018, .02, 10), BRASS, sx * .06, .3, FZ + .04, HP, 0, 0); }
    add(G.box(W, .03, D, .006), INK2, 0, Y0 - .025, Z);
    add(G.box(W - .04, .08, D - .04, .03), OAT, 0, Y0 + .04, Z);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.025, H, .025, .006), INK2, sx * (W / 2 - .012), Y0 + H / 2, Z + sz * (D / 2 - .012));
    for (const sz of [-1, 1]) add(G.box(W, .025, .025, .006), INK2, 0, Y0 + H, Z + sz * (D / 2 - .012));
    for (const sx of [-1, 1]) add(G.box(.025, .025, D, .006), INK2, sx * (W / 2 - .012), Y0 + H, Z);
    add(G.box(W - .04, .04, D - .1, .01), INK2, 0, Y0 + H + .02, Z - .02);
    for (const [x, h] of [[-.6, .32], [-.52, .4], [-.44, .26], [.38, .36], [.5, .3], [.6, .42], [-.05, .2]]) tube([x, Y0 + .06, Z - .1], [x + .03, Y0 + .06 + h, Z - .12], .022, LEAF, 5, .012);
    add(G.box(.2, .18, .14, .01), CREAM, .16, Y0 + .17, Z - .05);
    for (const sx of [-1, 1]) { add(G.cyl(.05, .05, .26, 10), CREAM, .16 + sx * .1, Y0 + .21, Z - .05); add(G.cone(.065, .1, 10), '#b9a6ff', .16 + sx * .1, Y0 + .39, Z - .05); }
    add(G.box(.06, .08, .02, .01), INK2, .16, Y0 + .12, Z + .025);
    for (const [x, z] of [[-.3, .08], [.42, .1], [-.15, -.12]]) add(G.sph(.035, 8, 6), STEEL2, x, Y0 + .085, Z + z, 0, 0, 0, [1, .6, 1]);
    for (const [x, y, z, s, d] of [[-.38, .3, .06, 1, 1], [.0, .38, .1, .8, -1], [.42, .22, .04, .9, -1], [-.15, .2, .12, .7, 1]]) {
      add(G.sph(.06, 12, 8), '#ff9f43', x, Y0 + y, Z + z, 0, 0, 0, [s * 1.1, s * .75, s * .5]);
      add(G.cone(.04 * s, .06 * s, 4), '#ff9f43', x - d * .08 * s, Y0 + y, Z + z, 0, 0, d * HP);
      add(G.sph(.012, 6, 4), INK, x + d * .035 * s, Y0 + y + .012, Z + z + .02 * s);
    }
    for (const [y, r] of [[.3, .014], [.38, .02], [.45, .012]]) add(G.sph(r, 6, 4), CREAM, .02 + y * .1, Y0 + y, Z + .12);
  }));
  f.add(glow('sp2-aquarium', '#c8f4fa', AQUA, ({ add }) => {
    add(G.box(W - .05, H - .06, .01, .004), '#ffffff', 0, Y0 + H / 2 + .02, Z - D / 2 + .02);
    for (const sx of [-1, 1]) add(G.box(.01, H - .06, D - .05, .004), '#ffffff', sx * (W / 2 - .02), Y0 + H / 2 + .02, Z);
  }, .35));
  f.spot('behind', null, .82, 0, -.3, { maxH: .5, label: K('수조 옆', 'Beside the aquarium'), scale: .75 });
};

// ── 핀볼 기계 (1×1): the other old arcade game — a pink pinball table on legs, a lit backbox, bumpers, flippers and a ball
B.sp2_pinball = f => {
  const TY = .74, TL = .82, TW = .54, TILT = .07;
  f.add(mc('sp2-pinball', ({ add, in: inn }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.05, TY - (sz > 0 ? .03 : -.03), .05, .012), STEEL2, sx * .22, (TY - (sz > 0 ? .03 : -.03)) / 2, sz * .32);
    const t = inn(0, TY, .03, TILT, 0, 0);
    t.add(G.box(TW, .16, TL, .03), PINK, 0, 0, 0);
    t.add(G.box(TW - .06, .01, TL - .06, .004), CREAM, 0, .081, 0);
    for (const sx of [-1, 1]) t.add(G.box(.03, .03, TL - .02, .01), INK, sx * (TW / 2 - .02), .095, 0);
    for (const [x, z, c] of [[-.12, -.2, GOLD], [.1, -.24, MINT2], [0, -.08, '#b9a6ff']]) { t.add(G.cyl(.05, .05, .05, 14), c, x, .11, z); t.add(G.cyl(.06, .06, .012, 14), CREAM, x, .14, z); }
    for (const sx of [-1, 1]) t.add(G.box(.13, .025, .03, .01), INK, sx * .07, .1, .26, 0, sx * .45, 0);
    t.add(G.sph(.022, 10, 8), STEEL, .05, .11, .08);
    t.add(G.ext(starShape(.06, .028), .006, 0), GOLD, -.02, .087, .02, -HP, 0, 0);
    t.add(G.cyl(.012, .012, .08, 8), STEEL, .2, .03, TL / 2 + .03, HP, 0, 0);
    t.add(G.sph(.022, 8, 6), INK, .2, .03, TL / 2 + .075);
    add(G.box(TW, .52, .12, .03), PINK, 0, TY + .36, -.4);
    add(G.box(TW - .06, .4, .02, .01), INK, 0, TY + .37, -.335);
    for (const sx of [-1, 1]) add(G.box(.05, .3, .05, .012), STEEL2, sx * .2, TY + .1, -.4);
  }));
  f.add(glow('sp2-pinball', '#ffe0ef', PINK, ({ add }) => {
    add(G.box(TW - .12, .32, .01, .004), '#ffffff', 0, TY + .37, -.32);
  }, .55));
  f.add(glow('sp2-pinball-star', '#fff1b8', GOLD, ({ add }) => { add(G.ext(starShape(.08, .036), .012, 0), '#ffffff', 0, TY + .37, -.31); }, .9));
  f.spot('under', null, 0, 0, .05, { maxH: .5, label: K('핀볼 기계 밑', 'Under the pinball table'), scale: .75 });
};

// ── 티피 텐트 (1×1): a kids' play tent — five wooden poles, a cream cone with mint stripes, open at the front, a star cushion in
B.sp2_teepee = f => {
  const H = 1.22, R = .44, GAP = .95;
  f.add(mc('sp2-teepee', ({ add, tube }) => {
    for (let k = 0; k < 5; k++) { const a = PI + (k / 5 - .5) * (PI * 2 - GAP) * .98 + 0, x = Math.sin(a) * (R + .02), z = Math.cos(a) * (R + .02); tube([x, 0, z], [-x * .08, H + .14, -z * .08], .016, WOOD, 6); }
    for (const sx of [-1, 1]) { const a = sx * GAP / 2; tube([Math.sin(a) * (R + .02), 0, Math.cos(a) * (R + .02)], [0, H + .14, 0], .016, WOOD, 6); }
    const len = PI * 2 - GAP, st = GAP / 2;
    const cone = (r0, r1, h, y, c, inner) => add(new THREE.CylinderGeometry(r0, r1, h, 24, 1, true, st, len), c, 0, y, 0, 0, 0, 0, inner ? [-1, 1, 1] : 1);
    cone(.03, R, H * .74, H * .37, CREAM); cone(.03 * .98, R * .98, H * .74, H * .37, OAT, true);
    for (const [y0, y1] of [[.1, .16], [.24, .28]]) { const r = y => R * (1 - y / (H * .74)) + .03 * (y / (H * .74)); add(new THREE.CylinderGeometry(r(y1) + .004, r(y0) + .004, y1 - y0, 24, 1, true, st, len), MINT2, 0, (y0 + y1) / 2, 0); }
    add(G.cyl(.34, .34, .02, 24), INK2, 0, .01, 0);
    add(G.ext(starShape(.13, .07), .06, .015), GOLD, -.04, .1, .05, -HP + .3, 0, .2);
    for (let k = 0; k < 7; k++) { const x = -.24 + k * .08, y = .64 - Math.sin(k / 6 * PI) * .06; add(G.cone(.03, .06, 3), PASTEL[k % 6], x, y, .25 - Math.abs(x) * .3, PI, 0, 0); }
  }));
  f.spot('inside', null, .06, 0, -.06, { maxH: .5, label: K('텐트 안', 'Inside the tent'), scale: .75 });
};

// ── 범퍼카 (2×1): a fairground bumper car — a round tomato tub on a fat black bumper, a cream seat, a wheel, the pole up behind
B.sp2_bumper = f => {
  f.add(mc('sp2-bumper', ({ add, tube }) => {
    add(G.tor(.42, .07, PI * 2, 8, 30), TIRE, 0, .1, 0, HP, 0, 0, [1.5, .95, 1]);
    add(G.box(1.18, .2, .78, .1), TOMATO, 0, .2, 0);
    add(G.box(.4, .16, .7, .08), TOMATO, .36, .36, 0);
    add(G.box(.4, .02, .6, .008), CREAM, .36, .44, 0);
    for (const sz of [-1, 1]) add(G.sph(.045, 10, 8), '#fff1b8', .58, .32, sz * .22);
    add(G.box(.18, .04, .58, .015), INK2, .02, .3, 0);
    add(G.box(.34, .1, .52, .04), CREAM, -.2, .34, 0);
    add(G.box(.1, .36, .6, .04), TOMATO, -.44, .44, 0, 0, 0, .18);
    add(G.box(.06, .26, .5, .03), CREAM, -.38, .46, 0, 0, 0, .18);
    tube([.16, .36, 0], [.06, .52, 0], .016, STEEL2, 6);
    add(G.tor(.08, .016, PI * 2, 5, 16), INK, .05, .53, 0, 0, HP, .5);
    tube([-.52, .45, 0], [-.6, 1.55, 0], .016, STEEL2, 6);
    add(G.ext(starShape(.06, .028), .012, 0), CREAM, .0, .3, .395);
    for (const sz of [-1, 1]) add(G.box(.46, .04, .02, .01), CREAM, -.06, .26, sz * .395);
  }));
  f.add(glow('sp2-bumper', '#fff1b8', GOLD, ({ add }) => { add(G.ext(starShape(.07, .032), .012, 0), '#ffffff', -.6, 1.6, 0); add(G.sph(.025, 8, 6), '#ffffff', -.6, 1.55, 0); }, .9));
  f.spot('on', null, -.2, .39, 0, { maxH: .28, label: K('범퍼카 자리', 'In the bumper car seat'), scale: .6 });
  f.spot('behind', null, .1, 0, -.42, { maxH: .3, label: K('범퍼카 옆', 'Beside the bumper car'), scale: .65 });
};

// ── 우주 헬멧 진열장 (1×1): a white space helmet with a gold visor in a glass case on a navy-banded plinth
B.sp2_helmet = f => {
  const PY = .66, HY = PY + .22;
  f.add(mc('sp2-helmet', ({ add }) => {
    add(G.box(.52, PY, .52, .03), CREAM, 0, PY / 2, 0);
    add(G.box(.54, .08, .54, .02), NAVY, 0, PY - .1, 0);
    add(G.box(.56, .04, .56, .015), OAT, 0, .02, 0);
    add(G.box(.16, .05, .01, .005), BRASS, 0, .3, .262);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.022, .5, .022, .006), STEEL, sx * .24, PY + .25, sz * .24);
    for (const sz of [-1, 1]) add(G.box(.5, .022, .022, .006), STEEL, 0, PY + .5, sz * .24);
    for (const sx of [-1, 1]) add(G.box(.022, .022, .5, .006), STEEL, sx * .24, PY + .5, 0);
    add(G.box(.5, .015, .5, .005), '#e6ebf5', 0, PY + .51, 0);
    add(G.cyl(.12, .14, .05, 18), STEEL2, 0, PY + .03, 0);
    add(G.sph(.17, 20, 14), '#f7f5fb', 0, HY, 0);
    add(G.tor(.13, .025, PI * 2, 6, 20), STEEL, 0, HY - .13, 0, HP, 0, 0);
    add(G.box(.05, .04, .03, .01), '#ff9f43', .15, HY + .02, .02, 0, .5, 0);
    add(G.cyl(.008, .008, .12, 6), STEEL2, -.1, HY + .19, -.04, 0, 0, .3);
    add(G.sph(.016, 6, 4), '#ff9f43', -.13, HY + .25, -.04);
    add(G.cyl(.03, .03, .01, 12), NAVY, -.12, HY - .02, .12, HP, -.7, 0);
  }));
  f.add(glow('sp2-helmet', '#ffe3a0', GOLD, ({ add }) => { add(new THREE.SphereGeometry(.174, 18, 10, HP - .9, 1.8, .7, .95), '#ffffff', 0, HY + .01, 0); }, .55));
  f.spot('behind', null, .34, 0, -.28, { maxH: .45, label: K('헬멧 진열장 옆', 'Beside the helmet case'), scale: .7 });
};

// ── 왕 곰인형 (1×1): a huge caramel teddy sitting on the floor, cream muzzle and belly, a pink bow
B.sp2_bigbear = f => {
  f.add(mc('sp2-bigbear', ({ add, tube }) => {
    add(G.sph(.3, 16, 10), CARAMEL, 0, .32, -.04, 0, 0, 0, [1, 1.08, .9]);
    add(G.sph(.2, 12, 8), CREAM, 0, .3, .12, 0, 0, 0, [1, 1.1, .5]);
    for (const sx of [-1, 1]) {
      add(G.cap(.11, .2, 3, 10), CARAMEL, sx * .17, .14, .2, HP - .15, sx * -.25, 0);
      add(G.sph(.075, 12, 8), CREAM, sx * .2, .14, .37, 0, 0, 0, [1, 1, .4]);
      add(G.cap(.085, .18, 3, 10), CARAMEL, sx * .3, .36, .1, .5, 0, sx * .7);
    }
    add(G.sph(.22, 16, 10), CARAMEL, 0, .76, .0);
    for (const sx of [-1, 1]) { add(G.sph(.085, 12, 8), CARAMEL, sx * .17, .94, -.02); add(G.sph(.05, 10, 8), CREAM, sx * .17, .94, .02, 0, 0, 0, [1, 1, .5]); }
    add(G.sph(.1, 14, 10), CREAM, 0, .72, .17, 0, 0, 0, [1.1, .8, .7]);
    add(G.sph(.03, 10, 8), INK, 0, .76, .24, 0, 0, 0, [1.3, 1, 1]);
    for (const sx of [-1, 1]) add(G.sph(.026, 10, 8), INK, sx * .085, .82, .19);
    tube([-.02, .71, .235], [.02, .71, .235], .006, INK, 4);
    for (const sx of [-1, 1]) add(G.cone(.07, .14, 4), PINK, sx * .08, .57, .16, 0, 0, sx * HP);
    add(G.sph(.035, 8, 6), PINK, 0, .57, .17);
  }));
  f.spot('behind', null, .3, 0, -.3, { maxH: .45, label: K('곰인형 뒤', 'Behind the big teddy'), scale: .7 });
};

// ── 꽃 수레 (2×1): a wooden flower cart on two big wheels, crates of potted blooms, a blank wooden sign
B.sp2_flowercart = f => {
  f.add(mc('sp2-flowercart', ({ add, tube }) => {
    add(G.box(1.1, .3, .56, .03), WOOD, .05, .5, 0);
    for (const x of [-.3, .05, .4]) add(G.box(.02, .26, .57, .004), WOODD, x, .5, 0);
    for (const sz of [-1, 1]) {
      add(G.tor(.27, .03, PI * 2, 6, 24), WOODD, -.15, .28, sz * .31);
      add(G.cyl(.04, .04, .05, 10), INK, -.15, .28, sz * .31, HP, 0, 0);
      for (let k = 0; k < 4; k++) { const a = k / 4 * PI; tube([-.15 - Math.cos(a) * .26, .28 - Math.sin(a) * .26, sz * .31], [-.15 + Math.cos(a) * .26, .28 + Math.sin(a) * .26, sz * .31], .01, WOODD, 4); }
      tube([.55, .38, sz * .24], [.56, 0, sz * .24], .022, WOODD, 6);
      tube([-.45, .62, sz * .24], [-.9, .74, sz * .26], .02, WOODD, 6);
    }
    for (const [x, z, c] of [[-.32, -.12, PINK], [-.1, .12, GOLD], [.12, -.12, '#b9a6ff'], [.34, .12, PINK], [-.32, .14, '#ffa36b'], [.36, -.13, GOLD], [.12, .14, CREAM], [-.1, -.14, '#ffa36b']]) {
      add(G.cyl(.08, .06, .12, 10), TERRA, x, .71, z);
      for (let k = 0; k < 4; k++) { const a = k / 4 * PI * 2 + x * 9; add(G.sph(.052, 7, 5), c, x + Math.cos(a) * .045, .82 + (k % 2) * .03, z + Math.sin(a) * .045); }
      add(G.sph(.07, 8, 4), LEAF, x, .78, z, 0, 0, 0, [1, .5, 1]);
      add(G.sph(.03, 6, 4), CREAM, x, .86, z);
    }
    tube([.62, .6, 0], [.62, 1.02, 0], .016, WOODD, 6);
    add(G.box(.04, .2, .34, .02), CREAM, .64, 1.0, 0, 0, 0, -.1);
  }));
  f.spot('under', null, .2, 0, 0, { maxH: .3, label: K('꽃 수레 밑', 'Under the flower cart'), scale: .7 });
};

// ── 빈티지 라디오 (1×1, low): a round-shouldered mint radio — cream cloth grille, an amber dial, two wooden knobs
B.sp2_radio = f => {
  const root = grp(); root.scale.setScalar(1.25); f.add(root);
  root.add(mc('sp2-radio', ({ add }) => {
    add(G.box(.44, .2, .2, .05), MINT2, 0, .12, -.02);
    add(halfCyl(.22, .2, 18), MINT2, 0, .22, -.02, -HP, 0, 0, [1, .55, 1]);
    add(G.box(.46, .02, .22, .008), WOOD, 0, .02, -.02);
    for (const sx of [-1, 1]) add(G.box(.04, .02, .04, .008), WOODD, sx * .18, .006, -.02);
    add(halfCyl(.13, .012, 14), CREAM, -.06, .2, .082, -HP, 0, 0);
    add(G.box(.26, .1, .012, .004), CREAM, -.06, .15, .082);
    for (let k = 0; k < 4; k++) add(G.box(.22, .008, .006, .002), OAT, -.06, .12 + k * .035, .09);
    for (const y of [.2, .12]) add(G.cyl(.026, .026, .03, 12), WOODD, .14, y, .09, HP, 0, 0);
    add(G.cyl(.008, .008, .2, 6), STEEL, .16, .42, -.08, 0, 0, -.3);
  }));
  root.add(glow('sp2-radio', '#ffe2a8', AMBER, ({ add }) => { add(G.box(.08, .04, .01, .004), '#ffffff', .14, .28, .086); }, .7));
  f.spot('behind', null, .02, 0, -.3, { maxH: .2, label: K('라디오 뒤', 'Behind the radio'), scale: .55 });
};

// ── 레코드 턴테이블 (1×1): a walnut record cabinet on peg legs — a turntable with a tangerine-labelled record, crates of
// records on the shelf below, a sleeve leaning on the side
const TANGO = '#ff9447';
B.sp2_turntable = f => {
  f.add(mc('sp2-turntable', ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tube([sx * .3, 0, sz * .17], [sx * .27, .14, sz * .15], .018, WALNUT, 6);
    add(G.box(.72, .04, .44, .012), WALNUT, 0, .16, 0);
    add(G.box(.72, .04, .44, .012), WALNUT, 0, .56, 0);
    for (const sx of [-1, 1]) add(G.box(.04, .44, .44, .012), WALNUT, sx * .34, .36, 0);
    add(G.box(.7, .4, .02, .006), '#a2704f', 0, .36, -.21);
    for (let k = 0; k < 14; k++) add(G.box(.018, .3, .3, .004), [INK, PINK, CREAM, MINT2, INK2, GOLD, TANGO][k % 7], -.3 + k * .043, .33, .02, 0, 0, (k % 3 - 1) * .04);
    add(G.box(.5, .08, .36, .02), CREAM, -.05, .62, 0);
    add(G.cyl(.15, .15, .02, 24), STEEL2, -.08, .67, 0);
    add(G.cyl(.14, .14, .012, 24), INK, -.08, .684, 0);
    add(G.cyl(.05, .05, .014, 16), TANGO, -.08, .686, 0);
    add(G.cyl(.02, .02, .05, 8), STEEL2, .14, .69, -.1);
    tube([.14, .71, -.1], [.04, .71, .08], .008, STEEL, 4);
    add(G.box(.04, .015, .03, .005), INK, .035, .7, .09);
    for (const x of [.1, .16]) add(G.cyl(.02, .02, .015, 10), INK2, x, .67, .12);
    add(G.box(.04, .34, .34, .006), TANGO, .4, .19, .08, 0, 0, -.18);
    add(G.cyl(.08, .08, .006, 16), CREAM, .375, .22, .08, 0, 0, HP - .18);
  }));
  f.spot('on', null, .14, .18, .02, { maxH: .3, label: K('레코드 칸', 'In the record shelf'), scale: .6 });
};

// ── 네온 하트 간판 (1×1): no words — a big pink neon heart, a gold star and a small heart on a dark board on two feet
B.sp2_neonheart = f => {
  f.add(mc('sp2-neonheart', ({ add }) => {
    add(G.box(.76, .82, .05, .05), INK2, 0, .64, -.06);
    add(G.box(.7, .76, .01, .03), INK, 0, .64, -.03);
    for (const sx of [-1, 1]) { add(G.box(.05, .26, .05, .012), STEEL2, sx * .28, .13, -.06); add(G.box(.08, .03, .3, .01), STEEL2, sx * .28, .015, -.06); }
    for (const [x, y] of [[-.28, .98], [.28, .98], [-.28, .3], [.28, .3]]) add(G.cyl(.012, .012, .03, 8), STEEL, x, y, -.02, HP, 0, 0);
  }));
  const ring = (sh, sz) => { const pts = sh.getSpacedPoints(48).map(p => new THREE.Vector3(p.x, p.y, 0)); return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 64, sz, 6, true); };
  f.add(glow('sp2-neonheart', '#ffb3d6', NEON, ({ add }) => {
    add(ring(heartShape(.26), .022), '#ffffff', -.04, .64, .0);
    add(ring(heartShape(.07), .012), '#ffffff', .24, .38, .0, 0, 0, -.3);
  }));
  f.add(glow('sp2-neonheart-star', '#fff1b8', GOLD, ({ add }) => {
    const s = starShape(.08, .036), pts = s.getPoints().map(p => new THREE.Vector3(p.x, p.y, 0));
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0), 50, .012, 5, true), '#ffffff', .22, .9, .0, 0, 0, .2);
  }));
  f.spot('behind', null, .1, 0, -.32, { maxH: .5, label: K('네온 간판 뒤', 'Behind the neon sign'), scale: .7 });
};

// ── 구름 소파 (2×1): a sofa of white puffs on a sky-blue cloud base, a gold star cushion (it lifts: something under it)
B.sp2_cloudsofa = f => {
  f.add(mc('sp2-cloudsofa', ({ add }) => {
    for (const [x, y, z, r] of [[-.6, .14, .1, .2], [-.25, .13, .16, .2], [.12, .13, .16, .2], [.5, .14, .1, .2], [-.4, .12, -.12, .2], [.3, .12, -.12, .2], [0, .12, -.05, .22]]) add(G.sph(r, 12, 8), SKY2, x, y, z, 0, 0, 0, [1.2, .8, 1]);
    for (const [x, z, r] of [[-.45, .08, .22], [-.05, .1, .23], [.38, .08, .22]]) add(G.sph(r, 14, 9), '#ffffff', x, .33, z, 0, 0, 0, [1.25, .55, 1]);
    for (const [x, y, r] of [[-.66, .62, .22], [-.34, .78, .26], [0, .84, .28], [.34, .78, .26], [.66, .62, .22], [-.2, .56, .24], [.2, .56, .24], [-.5, .48, .2], [.5, .48, .2]]) add(G.sph(r, 14, 10), '#eef4ff', x, y, -.24, 0, 0, 0, [1, 1, .7]);
    for (const sx of [-1, 1]) for (const [z, y, r] of [[-.08, .46, .19], [.14, .42, .17]]) add(G.sph(r, 12, 9), '#ffffff', sx * .74, y, z);
    add(G.sph(.1, 12, 8), '#ffe7a0', -.5, .5, -.06, 0, 0, 0, [1, .6, .5]);
  }));
  const cu = grp(); put(cu, .32, .42, .02, -.35, 0, .15); f.add(cu);
  cu.add(mc('sp2-cloudsofa-star', ({ add }) => { add(G.ext(starShape(.15, .08), .06, .025), GOLD, 0, 0, -.03); }));
  const p = f.part('lift', cu, (t, b) => { cu.position.y = b.p.y + .3 * t; cu.rotation.x = b.r.x - .3 * t; cu.rotation.z = b.r.z + .2 * t; }, { label: K('별 쿠션', 'Star cushion'), sfx: 'lift', dur: .26 });
  f.spot('inside', null, .32, .4, .04, { part: p, maxH: .14, label: K('별 쿠션 밑', 'Under the star cushion'), scale: .5 });
};

// ── 버섯 램프 (1×1): a giant red toadstool lamp — a cream stem, a red cap with cream spots, a warm glow under it, two little ones
B.sp2_mushlamp = f => {
  const CY = 1.0, CR = .42;
  f.add(mc('sp2-mushlamp', ({ add, tube }) => {
    tube([0, 0, 0], [.03, CY - .05, 0], .12, CREAM, 14, .09);
    add(G.cyl(.18, .2, .05, 16), OAT, 0, .025, 0);
    add(new THREE.SphereGeometry(CR, 24, 12, 0, PI * 2, 0, HP), RED, .03, CY - .02, 0, 0, 0, 0, [1, .62, 1]);
    for (const [la, lo, s] of [[.5, 0, .07], [.9, 1.2, .05], [.4, 2.1, .06], [.6, 3.2, .07], [.3, 4.2, .05], [.7, 5.1, .06], [1.3, .6, .05]]) {
      const q = new THREE.Vector3(Math.cos(la) * Math.sin(lo) * CR, Math.sin(la) * CR * .62, Math.cos(la) * Math.cos(lo) * CR);
      add(G.sph(s, 10, 6), CREAM, .03 + q.x, CY - .02 + q.y, q.z, 0, 0, 0, [1, .45, 1]);
    }
    for (const [x, z, h, r] of [[.26, .22, .14, .1], [-.24, .2, .1, .08]]) { add(G.cyl(.03, .035, h, 10), CREAM, x, h / 2, z); add(new THREE.SphereGeometry(r, 14, 6, 0, PI * 2, 0, HP), RED, x, h - .01, z, 0, 0, 0, [1, .6, 1]); add(G.sph(.018, 6, 4), CREAM, x + r * .4, h + .03, z + r * .2); }
  }));
  f.add(glow('sp2-mushlamp', '#ffe8b0', '#ffc46b', ({ add }) => { add(G.cyl(CR - .03, .12, .06, 24), '#ffffff', .03, CY - .05, 0); }, .85));
  f.spot('behind', null, -.06, 0, -.32, { maxH: .5, label: K('버섯 램프 뒤', 'Behind the mushroom lamp'), scale: .7 });
};

// ── 피자 화덕 (1×1): a terracotta dome oven with a glowing mouth on a brick stand; logs stored underneath, a peel with a pizza
B.sp2_pizza = f => {
  const BY = .5;
  f.add(mc('sp2-pizza', ({ add, tube }) => {
    add(G.box(.72, BY, .62, .03), '#e8a184', 0, BY / 2, -.04);
    add(G.box(.5, .26, .3, .02), INK2, 0, .19, .14);
    for (let k = 0; k < 3; k++) add(G.cyl(.05, .05, .44, 10), WOODD, 0, .1 + (k === 2 ? .085 : 0), .14 + (k === 2 ? 0 : -.05 + k * .1) * 1 - .02, 0, 0, HP, [1, 1, 1]);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) add(G.box(.2, .008, .005, .002), '#c86e52', -.23 + c * .23 + (r % 2) * .1 - .05, .4 + r * .028 - .02, .27);
    add(G.box(.76, .04, .66, .012), OAT, 0, BY + .02, -.04);
    add(new THREE.SphereGeometry(.34, 22, 12, 0, PI * 2, 0, HP), TERRA, 0, BY + .04, -.06, 0, 0, 0, [1, .95, 1]);
    add(halfCyl(.15, .1, 14), INK2, 0, BY + .04, .24, -HP, 0, 0, [1, 1.05, 1]);
    add(G.tor(.17, .03, PI, 6, 16), '#c86e52', 0, BY + .04, .29);
    tube([.12, BY + .28, -.14], [.14, BY + .58, -.16], .045, STEEL2, 10);
    add(G.cyl(.07, .07, .04, 12), INK, .14, BY + .6, -.16);
    tube([.4, 0, .22], [.36, .72, .26], .018, WOOD, 6);
    add(G.box(.04, .26, .24, .012), WOOD, .35, .82, .27, 0, 0, -.06);
    add(G.cyl(.1, .1, .02, 18), '#ffd27a', .37, .82, .27, 0, 0, HP - .06);
    for (const [y, z] of [[.86, .3], [.8, .22], [.78, .32]]) add(G.cyl(.022, .022, .008, 8), '#ff5a5f', .385, y, z, 0, 0, HP - .06);
  }));
  f.add(glow('sp2-pizza', '#ffd27a', '#ff8a2a', ({ add }) => { add(halfCyl(.12, .02, 12), '#ffffff', 0, BY + .04, .22, -HP, 0, 0); }));
  f.spot('inside', null, -.12, .06, .12, { maxH: .22, label: K('장작 칸', 'In the log store'), scale: .55 });
};

// ── DJ 부스 (2×1): a desk with a glowing striped front, two decks and a mixer, headphones on top, tall speakers both ends
B.sp2_dj = f => {
  const DY = .82;
  f.add(mc('sp2-dj', ({ add }) => {
    add(G.box(1.1, DY, .48, .03), INK2, 0, DY / 2, 0);
    add(G.box(1.16, .04, .52, .012), INK, 0, DY + .02, 0);
    for (const sx of [-1, 1]) {
      add(G.box(.26, .1, .26, .02), STEEL2, sx * .3, DY + .09, -.02);
      add(G.cyl(.1, .1, .014, 20), INK, sx * .3, DY + .15, -.02);
      add(G.cyl(.032, .032, .016, 12), VIOLET, sx * .3, DY + .155, -.02);
      add(G.box(.32, 1.0, .32, .03), INK, sx * .78, .5, -.04);
      for (const [y, r] of [[.32, .11], [.7, .07]]) { add(G.cyl(r + .02, r + .02, .02, 18), STEEL2, sx * .78, y, .125, HP, 0, 0); add(G.cyl(r, r, .03, 18), INK2, sx * .78, y, .125, HP, 0, 0); add(G.cyl(.03, .03, .035, 10), STEEL2, sx * .78, y, .13, HP, 0, 0); }
    }
    add(G.box(.2, .06, .26, .015), INK, 0, DY + .07, -.02);
    for (const [x, z] of [[-.05, -.08], [.05, -.08], [-.05, 0], [.05, 0]]) add(G.cyl(.015, .015, .02, 8), CREAM, x, DY + .11, z);
    add(G.box(.12, .012, .02, .004), CREAM, 0, DY + .105, .08);
    add(G.tor(.08, .016, PI, 5, 14), VIOLET, .12, DY + .14, .16, 0, .3, 0);
    for (const sx of [-1, 1]) add(G.cyl(.035, .035, .03, 12), VIOLET, .12 + sx * .077, DY + .14, .16 + sx * -.024, 0, .3, HP);
  }));
  f.add(glow('sp2-dj', '#e3d8ff', VIOLET, ({ add }) => {
    for (let k = 0; k < 4; k++) add(G.box(1.0, .045, .01, .004), '#ffffff', 0, .18 + k * .16, .245);
  }, .8));
  f.spot('behind', null, 0, 0, -.32, { maxH: .5, label: K('DJ 부스 뒤', 'Behind the DJ booth'), scale: .75 });
};

// ── 천체 투영기 (1×1): a navy star ball pricked with glowing stars, a gold ring round it, on a brass tripod
B.sp2_planet = f => {
  const CY = .72, R = .24;
  f.add(mc('sp2-planet', ({ add, tube }) => {
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; tube([Math.sin(a) * .28, 0, Math.cos(a) * .28], [0, .46, 0], .018, BRASS, 6); add(G.sph(.026, 8, 6), WOODD, Math.sin(a) * .28, .013, Math.cos(a) * .28, 0, 0, 0, [1, .6, 1]); }
    add(G.cyl(.06, .08, .1, 12), BRASS, 0, .48, 0);
    add(G.sph(R, 24, 16), NAVY, 0, CY, 0);
    add(G.tor(R + .1, .018, PI * 2, 4, 36), GOLD, 0, CY, 0, HP + .35, 0, .25, [1, 1, 1]);
    add(G.sph(.06, 10, 8), '#b9a6ff', .32, .9, .12);
    tube([.25, .82, .1], [.32, .9, .12], .006, BRASS, 4);
  }));
  f.add(glow('sp2-planet', '#fff4c4', GOLD, ({ add }) => {
    const n = 40;
    for (let k = 0; k < n; k++) {
      const y = 1 - (k + .5) / n * 2, r = Math.sqrt(1 - y * y), a = k * 2.399;
      if (y < -.55) continue;
      add(G.sph(k % 5 ? .014 : .022, 6, 4), '#ffffff', Math.cos(a) * r * R, CY + y * R, Math.sin(a) * r * R);
    }
  }, .95));
  f.spot('under', null, 0, 0, 0, { maxH: .36, label: K('투영기 밑', 'Under the star projector'), scale: .7 });
};

// ── 작은 분수대 (1×1): a round stone fountain, two tiers, glowing water and three arcs of spray; coins in the bottom
B.sp2_fountain = f => {
  const STONE = '#d8d1e4', STONE2 = '#b3aac8';
  f.add(mc('sp2-fountain', ({ add, tube }) => {
    add(G.cyl(.44, .46, .24, 28), STONE, 0, .12, 0);
    add(G.tor(.44, .035, PI * 2, 6, 32), STONE2, 0, .24, 0, HP, 0, 0);
    tube([0, .2, 0], [0, .62, 0], .06, STONE2, 12, .08);
    add(G.cyl(.2, .1, .08, 20), STONE, 0, .62, 0);
    add(G.tor(.2, .022, PI * 2, 6, 24), STONE2, 0, .66, 0, HP, 0, 0);
    add(G.cyl(.04, .05, .14, 10), STONE2, 0, .72, 0);
    add(G.sph(.05, 10, 8), STONE, 0, .81, 0);
    for (const [x, z] of [[.18, .14], [-.2, .06], [.05, -.24], [-.1, .24]]) add(G.cyl(.02, .02, .006, 10), BRASS, x, .215, z);
  }));
  f.add(glow('sp2-fountain', '#8fe0f2', '#5cc8e8', ({ add }) => {
    add(G.cyl(.4, .4, .01, 28), '#ffffff', 0, .246, 0);
    add(G.cyl(.18, .18, .01, 20), '#ffffff', 0, .655, 0);
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + .5; add(G.tor(.1, .02, PI * .9, 4, 12), '#ffffff', Math.cos(a) * .12, .78, Math.sin(a) * .12, 0, -a, 0); }
    for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; add(G.cyl(.018, .018, .4, 5), '#ffffff', Math.cos(a) * .2, .44, Math.sin(a) * .2); }
  }, .45));
  f.spot('behind', null, .38, 0, -.36, { maxH: .35, label: K('분수대 옆', 'Beside the fountain'), scale: .65 });
};

// ── 미니 등대 (1×1): a red-and-cream striped lighthouse on a heap of rocks, a gallery, a glowing lamp room and a red cap
B.sp2_lighthouse = f => {
  f.add(mc('sp2-lighthouse', ({ add, tube }) => {
    for (const [x, z, r, s] of [[0, 0, .3, [1.3, .45, 1.2]], [.25, .15, .14, [1, .7, 1]], [-.26, .14, .12, [1.1, .6, 1]], [.18, -.22, .12, [1, .7, 1]], [-.2, -.2, .14, [1, .6, 1]]]) add(G.sph(r, 10, 7), '#b8b2c8', x, r * s[1] * .7, z, 0, x * 3, 0, s);
    const segs = 5, H = .9, y0 = .16;
    for (let k = 0; k < segs; k++) { const a = y0 + k * H / segs, b = a + H / segs, r = y => .2 - (y - y0) / H * .07; add(G.cyl(r(b), r(a), H / segs, 18), k % 2 ? CREAM : RED, 0, (a + b) / 2, 0); }
    add(G.box(.08, .14, .03, .02), INK2, 0, .25, .2);
    for (const y of [.5, .78]) add(G.box(.05, .07, .02, .01), INK2, 0, y, .17 - (y - .16) * .07);
    add(G.cyl(.21, .21, .03, 18), INK2, 0, y0 + H + .015, 0);
    for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; tube([Math.cos(a) * .19, y0 + H + .03, Math.sin(a) * .19], [Math.cos(a) * .19, y0 + H + .1, Math.sin(a) * .19], .006, INK2, 3); }
    add(G.tor(.19, .008, PI * 2, 3, 24), INK2, 0, y0 + H + .1, 0, HP, 0, 0);
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; tube([Math.cos(a) * .1, y0 + H + .03, Math.sin(a) * .1], [Math.cos(a) * .1, y0 + H + .2, Math.sin(a) * .1], .01, INK2, 3); }
    add(G.cone(.15, .14, 16), RED, 0, y0 + H + .27, 0);
    add(G.sph(.03, 8, 6), INK2, 0, y0 + H + .35, 0);
  }));
  f.add(glow('sp2-lighthouse', '#fff1b8', GOLD, ({ add }) => { add(G.cyl(.09, .09, .16, 14), '#ffffff', 0, .16 + .9 + .11, 0); }));
  f.spot('behind', null, .3, 0, -.32, { maxH: .35, label: K('등대 바위 뒤', 'Behind the lighthouse rocks'), scale: .65 });
};

// ── 인형 뽑기 기계 (1×1): a pink claw machine — a glass box full of pastel plush balls, a claw on its gantry, a lit top, a
// stick and a button; the prize flap at the bottom opens (상품 나오는 곳)
B.sp2_claw = f => {
  const W = .62, BY = .62, GY = BY + .62, FZ = .29;
  f.add(mc('sp2-claw', ({ add, tube }) => {
    add(G.box(W, BY, .58, .04), PINK, 0, BY / 2, 0);
    add(G.box(W + .02, .05, .6, .015), CREAM, 0, BY, 0);
    add(G.box(.2, .2, .02, .01), INK2, -.12, .26, FZ + .002);
    add(G.cyl(.035, .035, .015, 12), INK, .12, BY - .01, FZ - .04, 0, 0, 0);
    add(G.cyl(.01, .01, .07, 6), INK, .12, BY + .03, FZ - .04);
    add(G.sph(.026, 8, 6), GOLD, .12, BY + .07, FZ - .04);
    add(G.cyl(.026, .026, .025, 12), MINT2, .2, BY + .02, FZ - .04);
    add(G.box(.06, .03, .012, .004), INK, .2, .42, FZ + .004);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.03, GY - BY, .03, .008), PINK, sx * (W / 2 - .015), (BY + GY) / 2, sz * .275);
    add(G.box(W, .2, .58, .04), PINK, 0, GY + .1, 0);
    add(G.box(W - .04, .02, .5, .005), INK2, 0, GY - .01, 0);
    for (let k = 0; k < 14; k++) { const x = -.2 + (k * .37 % .42), z = -.18 + (k * .23 % .36), y = BY + .07 + (k % 3) * .05; add(G.sph(.065, 9, 6), PASTEL[k % 6], x, y, z); if (k % 3 === 2) for (const sx of [-1, 1]) add(G.sph(.008, 4, 3), INK, x + sx * .018, y + .01, z + .056); }
    tube([-.04, GY - .02, -.04], [-.04, GY - .2, -.04], .005, STEEL2, 3);
    add(G.cyl(.03, .04, .04, 10), STEEL, -.04, GY - .22, -.04);
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; tube([-.04, GY - .24, -.04], [-.04 + Math.cos(a) * .06, GY - .32, -.04 + Math.sin(a) * .06], .008, STEEL, 4); }
  }));
  f.add(glow('sp2-claw', '#fff1b8', GOLD, ({ add }) => {
    add(G.box(W - .1, .1, .01, .004), '#ffffff', 0, GY + .1, .292);
    for (let k = 0; k < 7; k++) add(G.sph(.016, 6, 4), '#ffffff', -.24 + k * .08, GY + .1, .3);
  }, .5));
  const flap = grp(); put(flap, -.12, .36, FZ + .012); f.add(flap);
  flap.add(mc('sp2-claw-flap', ({ add }) => { add(G.box(.2, .2, .016, .006), STEEL2, 0, -.1, 0); add(G.box(.08, .016, .016, .004), INK, 0, -.04, .01); }));
  const p = f.part('door', flap, t => { flap.rotation.x = 1.3 * t; }, { label: K('상품 나오는 곳', 'Prize flap'), sfx: 'open', dur: .24 });
  f.spot('inside', null, -.12, .16, FZ - .1, { part: p, maxH: .18, label: K('상품 나오는 곳', 'Prize flap'), scale: .5 });
};

// ── 그네 의자 (1×1): a rattan egg chair hung from a dark arched stand, a sage cushion in it
B.sp2_eggchair = f => {
  const HY = .5;
  f.add(mc('sp2-eggchair', ({ add, tube }) => {
    add(G.cyl(.3, .32, .05, 24), INK, 0, .025, -.04);
    const P = [[0, .05, -.28], [0, .9, -.4], [0, 1.5, -.28], [0, 1.68, -.06], [0, 1.6, .02]];
    const c = new THREE.CatmullRomCurve3(P.map(p => new THREE.Vector3(...p)));
    add(new THREE.TubeGeometry(c, 24, .03, 6), INK, 0, 0, 0);
    tube([0, 1.6, .02], [0, 1.42, .02], .008, STEEL2, 4);
    add(new THREE.SphereGeometry(.345, 18, 12, HP + 1.05, PI * 2 - 2.1, .18, PI - .5), OAT, 0, HY + .36, .02, 0, 0, 0, [-1, 1.15, 1]);
    add(new THREE.SphereGeometry(.36, 18, 12, HP + 1.05, PI * 2 - 2.1, .18, PI - .5), WOOD, 0, HY + .36, .02, 0, 0, 0, [1, 1.15, 1]);
    add(G.cap(.15, .14, 3, 10), SAGE, 0, HY + .2, .08, HP, 0, HP);
    add(G.sph(.17, 12, 8), SAGE, 0, HY + .42, -.12, 0, 0, 0, [1.1, 1.1, .45]);
    add(G.sph(.08, 10, 8), CREAM, .12, HY + .3, .06, 0, .4, 0, [1, 1, .55]);
  }));
  f.spot('on', null, -.06, HY + .14, .1, { maxH: .26, label: K('그네 의자 위', 'In the egg chair'), scale: .6 });
};

// ── 트램펄린 (1×1): a little round trampoline with a lime pad, cream legs and a net on poles
B.sp2_trampoline = f => {
  const MY = .3, R = .42;
  f.add(mc('sp2-trampoline', ({ add, tube }) => {
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; tube([Math.cos(a) * R, 0, Math.sin(a) * R], [Math.cos(a) * R, MY, Math.sin(a) * R], .02, CREAM, 6); tube([Math.cos(a) * R, MY, Math.sin(a) * R], [Math.cos(a) * R, 1.08, Math.sin(a) * R], .016, CREAM, 6); add(G.sph(.026, 8, 6), LIME, Math.cos(a) * R, 1.09, Math.sin(a) * R); }
    add(G.cyl(R - .06, R - .06, .02, 30), INK2, 0, MY - .01, 0);
    add(G.tor(R - .02, .05, PI * 2, 8, 32), LIME, 0, MY, 0, HP, 0, 0, [1, 1, .8]);
    add(G.tor(R, .01, PI * 2, 3, 30), CREAM, 0, 1.0, 0, HP, 0, 0);
    for (let k = 0; k < 24; k++) { if (k >= 10 && k <= 13) continue; const a = (k + .5) / 24 * PI * 2; tube([Math.cos(a) * R, MY + .04, Math.sin(a) * R], [Math.cos(a) * R, 1.0, Math.sin(a) * R], .0035, CREAM, 3); }
    for (const y of [.55, .8]) add(G.tor(R, .004, PI * 2 - .9, 3, 30), CREAM, 0, y, 0, HP, 0, -1.25 - .45);
  }));
  f.spot('under', null, .02, 0, .04, { maxH: .22, label: K('트램펄린 밑', 'Under the trampoline'), scale: .6 });
};

// ── 빨간 전화부스 (1×1): a tall red phone box, a glowing blank sign band, glazed door (it opens) and a phone inside
B.sp2_phonebox = f => {
  const W = .64, H = 1.72, FZ = W / 2;
  f.add(mc('sp2-phonebox', ({ add }) => {
    add(G.box(W + .06, .06, W + .06, .015), INK2, 0, .03, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.06, H, .06, .015), RED, sx * (W / 2 - .03), H / 2 + .06, sz * (W / 2 - .03));
    add(G.box(W, H, .03, .01), RED, 0, H / 2 + .06, -W / 2 + .015);
    for (const sx of [-1, 1]) add(G.box(.03, H, W, .01), RED, sx * (W / 2 - .015), H / 2 + .06, 0);
    for (const sx of [-1, 1]) for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) add(G.box(.004, .22, .2, .002), '#cfe9f5', sx * (W / 2 + .001), .78 + r * .25, -.11 + c * .22);
    add(G.box(W + .04, .14, W + .04, .02), RED, 0, H + .1, 0);
    add(G.box(W - .04, .06, W - .04, .02), RED, 0, H + .2, 0);
    add(halfCyl(.24, W - .06, 16), RED, 0, H + .22, 0, 0, HP, 0, [1, .4, 1]);
    add(G.box(.18, .22, .1, .02), INK, 0, 1.18, -W / 2 + .08);
    add(G.cap(.025, .12, 2, 6), INK2, 0, 1.3, -W / 2 + .14, 0, 0, HP);
    add(G.box(.2, .02, .14, .006), CREAM, 0, .98, -W / 2 + .1);
  }));
  f.add(glow('sp2-phonebox', '#ffffff', '#fff6dc', ({ add }) => { for (const [x, z, ry] of [[0, FZ + .022, 0], [0, -FZ - .022, 0], [FZ + .022, 0, HP], [-FZ - .022, 0, HP]]) add(G.box(W - .14, .07, .01, .003), '#ffffff', x, H + .1, z, 0, ry, 0); }, .6));
  const door = grp(); put(door, -W / 2 + .04, H / 2 + .06, FZ - .01); f.add(door);
  door.add(mc('sp2-phonebox-door', ({ add }) => {
    add(G.box(W - .08, H - .04, .03, .01), RED, (W - .08) / 2, 0, 0);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) add(G.box(.14, .2, .006, .002), '#cfe9f5', .1 + c * .18, -.38 + r * .24, .018);
    add(G.box(.08, .02, .03, .008), BRASS, W - .16, -.1, .03);
  }));
  const p = f.part('door', door, t => { door.rotation.y = -1.6 * t; }, { label: K('전화부스 문', 'Phone box door'), sfx: 'open', dur: .3 });
  f.spot('inside', null, 0, .06, 0, { part: p, maxH: .7, label: K('전화부스 안', 'Inside the phone box'), scale: .8 });
};

// ── 온실 유리장 (1×1): a cream-framed glass cabinet with a pitched glass roof, two shelves of potted plants; the door opens
B.sp2_greenhouse = f => {
  const W = .7, D = .44, H = 1.2, FZ = D / 2;
  f.add(mc('sp2-greenhouse', ({ add, tube }) => {
    add(G.box(W, .08, D, .02), WOOD, 0, .04, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.035, H, .035, .008), CREAM, sx * (W / 2 - .018), H / 2 + .08, sz * (D / 2 - .018));
    for (const sz of [-1, 1]) add(G.box(W, .03, .03, .008), CREAM, 0, H + .08, sz * (D / 2 - .018));
    for (const sx of [-1, 1]) { tube([sx * (W / 2 - .018), H + .08, -D / 2 + .018], [0, H + .3, -D / 2 + .018], .016, CREAM, 4); tube([sx * (W / 2 - .018), H + .08, D / 2 - .018], [0, H + .3, D / 2 - .018], .016, CREAM, 4); }
    add(G.box(.03, .03, D, .008), CREAM, 0, H + .3, 0);
    for (const sx of [-1, 1]) add(G.box(.008, .36, D - .04, .003), '#d8f0e8', sx * W / 4, H + .19, 0, 0, 0, sx * (HP - .55));
    add(G.box(W - .04, H - .02, .008, .003), '#e4f4ee', 0, H / 2 + .08, -D / 2 + .01);
    for (const y of [.5, .9]) add(G.box(W - .06, .025, D - .06, .006), WOOD, 0, y, 0);
    for (const [x, y, c] of [[-.2, .12, TERRA], [.05, .12, CREAM], [.2, .12, TERRA], [-.18, .52, CREAM], [.1, .52, TERRA], [-.05, .92, TERRA], [.2, .92, CREAM]]) {
      add(G.cyl(.06, .045, .09, 10), c, x, y + .045, 0);
      for (let k = 0; k < 3; k++) add(G.sph(.055, 7, 5), k % 2 ? LEAF : LEAF2, x + Math.cos(k * 2.1) * .04, y + .13 + (k % 2) * .05, Math.sin(k * 2.1) * .04, 0, 0, 0, [1, 1.4, 1]);
    }
    add(G.sph(.03, 6, 4), PINK, .1, .72, .02); add(G.sph(.03, 6, 4), GOLD, -.18, .7, .03);
  }));
  const door = grp(); put(door, -W / 2 + .02, H / 2 + .08, FZ + .005); f.add(door);
  door.add(mc('sp2-greenhouse-door', ({ add }) => {
    for (const x of [0, W - .04]) add(G.box(.03, H - .04, .02, .006), CREAM, x + .015, 0, 0);
    for (const y of [-(H - .04) / 2, 0, (H - .04) / 2]) add(G.box(W - .04, .03, .02, .006), CREAM, (W - .04) / 2, y, 0);
    add(G.cyl(.015, .015, .03, 8), BRASS, W - .08, 0, .02, HP, 0, 0);
  }));
  const p = f.part('door', door, t => { door.rotation.y = -1.7 * t; }, { label: K('온실 유리문', 'Glass door'), sfx: 'open', dur: .3 });
  f.spot('on', null, -.05, .515, .02, { part: p, maxH: .3, label: K('온실 가운데 칸', 'On the middle shelf'), scale: .6 });
};

// names in Korean (EN beside them); price and the condition that opens one are specials.js SPECIALS
Object.assign(SPECIAL_INFO, {
  sp2_ferris: { w: 1, d: 1, name: K('미니 관람차', 'Mini Ferris Wheel'), price: 850 },
  sp2_cotton: { w: 1, d: 1, name: K('솜사탕 기계', 'Candy Floss Cart'), price: 400 },
  sp2_globe: { w: 1, d: 1, name: K('왕 지구본', 'Giant Globe'), price: 380 },
  sp2_aquarium: { w: 2, d: 1, name: K('아쿠아리움 수조', 'Aquarium'), price: 680 },
  sp2_pinball: { w: 1, d: 1, name: K('핀볼 기계', 'Pinball Machine'), price: 600 },
  sp2_teepee: { w: 1, d: 1, name: K('티피 텐트', 'Teepee Tent'), price: 340 },
  sp2_bumper: { w: 2, d: 1, name: K('범퍼카', 'Bumper Car'), price: 950 },
  sp2_helmet: { w: 1, d: 1, name: K('우주 헬멧 진열장', 'Space Helmet Case'), price: 560 },
  sp2_bigbear: { w: 1, d: 1, name: K('왕 곰인형', 'Giant Teddy'), price: 360 },
  sp2_flowercart: { w: 2, d: 1, name: K('꽃 수레', 'Flower Cart'), price: 620 },
  sp2_radio: { w: 1, d: 1, name: K('빈티지 라디오', 'Vintage Radio'), price: 300 },
  sp2_turntable: { w: 1, d: 1, name: K('레코드 턴테이블', 'Record Player'), price: 420 },
  sp2_neonheart: { w: 1, d: 1, name: K('네온 하트 간판', 'Neon Heart Sign'), price: 340 },
  sp2_cloudsofa: { w: 2, d: 1, name: K('구름 소파', 'Cloud Sofa'), price: 650 },
  sp2_mushlamp: { w: 1, d: 1, name: K('버섯 램프', 'Mushroom Lamp'), price: 320 },
  sp2_pizza: { w: 1, d: 1, name: K('피자 화덕', 'Pizza Oven'), price: 480 },
  sp2_dj: { w: 2, d: 1, name: K('DJ 부스', 'DJ Booth'), price: 740 },
  sp2_planet: { w: 1, d: 1, name: K('천체 투영기', 'Star Projector'), price: 460 },
  sp2_fountain: { w: 1, d: 1, name: K('작은 분수대', 'Little Fountain'), price: 500 },
  sp2_lighthouse: { w: 1, d: 1, name: K('미니 등대', 'Mini Lighthouse'), price: 540 },
  sp2_claw: { w: 1, d: 1, name: K('인형 뽑기 기계', 'Claw Machine'), price: 700 },
  sp2_eggchair: { w: 1, d: 1, name: K('그네 의자', 'Hanging Egg Chair'), price: 440 },
  sp2_trampoline: { w: 1, d: 1, name: K('트램펄린', 'Trampoline'), price: 580 },
  sp2_phonebox: { w: 1, d: 1, name: K('빨간 전화부스', 'Red Phone Box'), price: 780 },
  sp2_greenhouse: { w: 1, d: 1, name: K('온실 유리장', 'Greenhouse Cabinet'), price: 520 },
});

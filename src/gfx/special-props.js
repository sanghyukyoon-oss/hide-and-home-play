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
import { put, grp, mesh, geo, mat, starShape, STYLE } from './kit.js';
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

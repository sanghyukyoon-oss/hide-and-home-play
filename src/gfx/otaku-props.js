// 너굴이네 복층 (18판 otakuloft, 10/21 — 사용자 "현실적인 복층 … 방구조 약간 특이하고 장치도 좀 있고 … 원룸같이 디테일한 방"; 15판 원룸의
// 결): a real Korean duplex studio on a rainy night, 너굴이's — comics to the ceiling, retro arcade cabinets, a CRT with old
// consoles and tangled pads, a glass case of figures, drawer stairs up to a mezzanine on posts. Four things that move:
//   arcade3 o.prize: the prize chute's flap is padlocked — the arcade token is its key on a time stage; on a ★ stage the token
//     goes in the slot, the screen flashes and the flap pops (p.device 'arcadeprize' — devices.js)
//   drawerstairs: four step drawers and a code-lockable cubby in the side; all four drawers open → the cubby springs by itself
//   mangashelf o.secret: one part — the red volume comes out and the shelf's back panel swings to a hidden niche
//   loftpulley: 7판 liftbasket's way — the crank sends the basket up to the mezzanine, a thing on the top hook drops into it
// (② 10/21: the four work from a stage's spec alone — clueIn/clueHang, locks — no special rules on a time stage)
// Same toy contract as oneroom-props.js (origin = footprint centre on the floor, faces +z; wall pieces on the wall's face).
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, shade, cutFace, liner, windowFace, holeFace } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { clothBend } from './clothbend.js';

const PI = Math.PI, HP = PI / 2;
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', WOOD = '#d9a46a', WOODD = '#9c6a42', WALNUT = '#8a5f42', STEEL = '#c9cfd8', STEEL2 = '#a9b2c8',
  DARK = '#3b3550', CHAR = '#2f2b3d', PLASTIC = '#eef1f6', TOMATO = '#ff6b57', MUSTARD = '#ffc23d', SKY = '#8fd3f4', MINT = '#7fd6c0', LILAC = '#b9a6ff',
  PINK = '#ff9fb8', KRAFT = '#e2b07a', KRAFT2 = '#c99358', TAPE = '#f3dfb0', LEAF = '#6cc46a', LEAF2 = '#4ea85a';
const B = {};
const basic = tex => { const m = new THREE.MeshBasicMaterial({ map: tex }); m.toneMapped = false; return m; };
const lit = (tex, o = {}) => mat('#ffffff', { map: tex, rough: .8, ...o });
const rnd = s => { let a = s * 9301 + 49297; return () => ((a = (a * 9301 + 49297) % 233280) / 233280); };

// ── textures ─────────────────────────────────────────────────────────────────────────────────────────────
// comic spines: rows of volumes in series colours, a band and a number on each (no real titles); tall and short ones
const SPINES = {};
const spineTex = seed => SPINES[seed] || (SPINES[seed] = canvasTex(256, 128, (c, W, H) => {
  const r = rnd(seed), series = ['#e8414e', '#3a7bd5', '#ffc23d', '#4caf7a', '#ff8fb8', '#8a5ad8', '#f2f2f2', '#2f2b3d', '#ff8f3a', '#5ec6d6'];
  c.fillStyle = '#3a3048'; c.fillRect(0, 0, W, H);
  let x = 0;
  while (x < W) {
    const col = series[Math.floor(r() * series.length)], run = 3 + Math.floor(r() * 7);
    for (let k = 0; k < run && x < W; k++) {
      const w = 7 + Math.floor(r() * 3), h = H - 6 - Math.floor(r() * 18);
      c.fillStyle = col; c.fillRect(x, H - h, w - 1, h);
      c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(x + 1, H - h + 6, w - 3, 5);
      c.fillStyle = col === '#f2f2f2' ? '#2f2b3d' : '#ffffff'; c.fillRect(x + 2, H - 16, w - 5, 4);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + w - 2, H - h, 1, h);
      x += w;
    }
    x += r() < .15 ? 4 : 0;
  }
}));
// a CRT's picture: a little platformer level, and the arcade attract screens
const SCREENS = {};
const screenTex = k => SCREENS[k] || (SCREENS[k] = canvasTex(160, 120, (c, W, H) => {
  const pal = [['#2a3f8f', '#6ec3ff', '#ffd23c', '#ff6b57'], ['#1d1442', '#ff4fb0', '#7cf0ff', '#ffe14d'], ['#0f3b2e', '#7cf08f', '#ffd23c', '#ffffff'], ['#3b1f4f', '#ffb03a', '#7cd0ff', '#ff6b9a']][k % 4];
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal[0]); g.addColorStop(1, shade(pal[0], .25)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = pal[1]; for (let i = 0; i < 6; i++) c.fillRect(i * 28 + 4, H - 22 - (i % 3) * 14, 22, 8);
  c.fillStyle = pal[2]; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(12 + i * 17, 26 + (i % 2) * 8, 3, 0, PI * 2); c.fill(); }
  c.fillStyle = pal[3]; c.fillRect(70, H - 44, 12, 14); c.fillStyle = '#ffffff'; c.fillRect(73, H - 40, 3, 3);
  c.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 6; i++) c.fillRect(10 + i * 9, 8, 6, 6);
  c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
}));
// arcade side art: a big star burst and stripes in the cabinet's colours
const SIDES = {};
const sideTex = (a, b) => SIDES[a + b] || (SIDES[a + b] = canvasTex(128, 192, (c, W, H) => {
  c.fillStyle = a; c.fillRect(0, 0, W, H);
  c.fillStyle = b; for (let k = 0; k < 5; k++) { c.save(); c.translate(W / 2, H * .62); c.rotate(-.5); c.fillRect(-W, -60 + k * 26, W * 2, 11); c.restore(); }
  c.fillStyle = '#ffe14d'; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 14 : 34, t = -HP + i * PI / 5; c.lineTo(W / 2 + Math.cos(t) * r, 52 + Math.sin(t) * r); } c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(W / 2, 52, 9, 0, PI * 2); c.fill();
}));
// posters: a mecha, a magical girl, a game logo — shapes only
const POSTERS = {};
const posterTex = k => POSTERS[k] || (POSTERS[k] = canvasTex(96, 136, (c, W, H) => {
  const bg = ['#2f3f8f', '#ffd6e6', '#1f2a3a'][k % 3]; c.fillStyle = bg; c.fillRect(0, 0, W, H);
  if (k % 3 === 0) { c.fillStyle = '#e8414e'; c.fillRect(30, 30, 36, 50); c.fillStyle = '#f2f2f2'; c.fillRect(36, 18, 24, 18); c.fillRect(22, 40, 10, 34); c.fillRect(64, 40, 10, 34); c.fillStyle = '#ffd23c'; c.fillRect(42, 24, 12, 5); c.fillRect(30, 84, 14, 30); c.fillRect(52, 84, 14, 30); }
  else if (k % 3 === 1) { c.fillStyle = '#ff6fa8'; c.beginPath(); c.arc(48, 46, 22, 0, PI * 2); c.fill(); c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(48, 50, 14, 0, PI * 2); c.fill(); c.fillStyle = '#8a5ad8'; c.beginPath(); c.moveTo(26, 120); c.lineTo(48, 66); c.lineTo(70, 120); c.fill(); c.fillStyle = '#ffe14d'; c.fillRect(66, 70, 4, 34); }
  else { c.fillStyle = '#7cf0ff'; c.font = 'bold 30px sans-serif'; c.fillRect(14, 40, 68, 14); c.fillStyle = '#ff4fb0'; c.fillRect(20, 60, 56, 10); c.fillStyle = '#ffe14d'; for (let i = 0; i < 5; i++) c.fillRect(18 + i * 13, 90, 8, 8); }
  c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(8, H - 18, W - 16, 4); c.fillRect(8, H - 11, W - 40, 3);
}));
// rain on the glass and the city lights through it
let RAINWIN = null;
const rainTex = () => RAINWIN || (RAINWIN = canvasTex(256, 192, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d2540'); g.addColorStop(1, '#34406a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = rnd(7);
  for (let i = 0; i < 9; i++) { const x = i * 30 - 6, h = 60 + r() * 80; c.fillStyle = '#141a2e'; c.fillRect(x, H - h, 26, h); for (let k = 0; k < 10; k++) if (r() < .5) { c.fillStyle = r() < .5 ? '#ffd98a' : '#9fd8ff'; c.fillRect(x + 4 + (k % 3) * 7, H - h + 8 + Math.floor(k / 3) * 14, 4, 5); } }
  c.globalAlpha = .35; c.fillStyle = '#ffffff'; for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H; c.fillRect(x, y, 1, 10 + r() * 14); } c.globalAlpha = 1;
  for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, s = 2 + r() * 3; c.fillStyle = 'rgba(220,235,255,.55)'; c.beginPath(); c.arc(x, y, s, 0, PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(x - 1, y - 1, 1, 1); }
}));

// ── 레트로 오락기 (1×1): a big upright cabinet — side art, a lit marquee, a deep CRT screen behind a bezel, a sloped panel
// with a stick and six buttons, coin slots that glow, a kick plate; a round stool in front. o.prize: a prize chute with
// a flap under the panel (the device: a coin in and the flap pops). Its back hatch opens (a shelf slides out).
B.arcade3 = (f, T, o = {}) => {
  const k = o.kind || 0, cols = [['#e8414e', '#ffc23d'], ['#3a7bd5', '#7cf0ff'], ['#2f2b3d', '#ff4fb0']][k % 3], body = cols[0], acc = cols[1];
  const W = .7, D = .66, z0 = -.14, H = 1.82;
  f.add(mc('arcade3|' + k + (o.prize ? 'p' : ''), ({ add }) => {
    const side = new THREE.Shape(); side.moveTo(-D / 2, 0); side.lineTo(D / 2, 0); side.lineTo(D / 2, .88); side.lineTo(D / 2 - .14, 1.0); side.lineTo(D / 2 - .2, 1.42); side.lineTo(-D / 2 + .1, H); side.lineTo(-D / 2, H); side.lineTo(-D / 2, 0);
    for (const sx of [-1, 1]) add(G.ext(side, .04, .01, 2), shade(body, -.1), sx * W / 2 + (sx > 0 ? .04 : 0), 0, z0, 0, -HP, 0);
    const hx = o.prize ? .02 : -.2;
    add(cutFace(G.box(W - .06, .88, D - .04, .02), 'z'), body, 0, .44, z0);
    add(windowFace(W - .1, .84, [hx + .025, hx + .195, -.275, -.065]), body, 0, .44, z0 + D / 2 - .02);
    add(liner(.17, .21, .4, 'z'), shade(body, -.25), hx + .11, .27, z0 + D / 2 - .22 - .02);
    add(G.box(W - .06, .42, D * .5, .02), body, 0, 1.6, z0 - D * .22);
    add(G.box(W, .2, .1, .03), DARK, 0, 1.72, z0 + .04); add(G.box(W - .1, .12, .02, .02), acc, 0, 1.72, z0 + .1);
    add(G.box(W - .08, .5, .1, .03), CHAR, 0, 1.2, z0 + .02, -.18, 0, 0);
    add(G.box(W + .02, .1, .32, .03), shade(body, -.15), 0, .95, z0 + D / 2 - .06, -.32, 0, 0);
    add(G.cyl(.012, .016, .1, 6), INK, -.17, 1.04, z0 + D / 2 - .06); add(G.sph(.04, 10, 8), TOMATO, -.17, 1.1, z0 + D / 2 - .06);
    for (let i = 0; i < 6; i++) add(G.cyl(.026, .026, .03, 12), ['#ffe14d', '#7cf0ff', '#ff6b9a', '#ffe14d', '#7cf0ff', '#ff6b9a'][i], .02 + (i % 3) * .08, 1.0 + Math.floor(i / 3) * .03, z0 + D / 2 - .08 + Math.floor(i / 3) * .06, -.32, 0, 0);
    add(G.box(.28, .22, .02, .02), DARK, 0, .55, z0 + D / 2 - .01); for (const x of [-.06, .06]) add(G.box(.035, .07, .012, .01), '#ff5a3c', x, .58, z0 + D / 2 + .005);
    add(G.box(W - .06, .12, .02, .01), DARK, 0, .07, z0 + D / 2 - .01);
    // the stool
    const sz = z0 + D / 2 + .42, sx0 = o.prize ? .16 : 0;   // (the prize one's stool stands aside: it hid the chute)
    add(G.cyl(.18, .18, .07, 18), TOMATO, sx0, .56, sz); add(G.tor(.18, .02, PI * 2, 5, 20), '#c8352f', sx0, .56, sz, HP, 0, 0);
    add(G.cyl(.025, .035, .52, 8), STEEL, sx0, .27, sz); add(G.tor(.13, .012, PI * 2, 4, 16), STEEL, sx0, .22, sz, HP, 0, 0); add(G.cyl(.16, .2, .03, 16), STEEL2, sx0, .015, sz);
    if (o.prize) { const pz = z0 + D / 2 + .05; add(G.box(.2, .03, .14, .01), CHAR, -.22, .385, pz); for (const sx of [-1, 1]) add(G.box(.02, .18, .14, .005), CHAR, -.22 + sx * .09, .3, pz); add(G.box(.17, .02, .14, .01), MUSTARD, -.22, .21, pz + .01); add(G.box(.16, .16, .01, .005), '#1c1828', -.22, .3, pz - .065); }
  }));
  for (const sx of [-1, 1]) { const art = mesh(new THREE.PlaneGeometry(.5, .78), lit(sideTex(body, acc)), { cast: false }); put(art, sx * (W / 2 + .045), .92, z0 + .03); art.rotation.y = sx * HP; f.add(art); }
  const scr = mesh(new THREE.PlaneGeometry(W - .2, .36), basic(screenTex(k)), { cast: false }); put(scr, 0, 1.2, z0 + .085); scr.rotation.x = -.18; f.add(scr);
  f.screen = scr;
  // the back hatch (a shelf slides out of the cabinet's belly)
  const hv = grp(); put(hv, o.prize ? .02 : -.2, .14, z0 + D / 2 + .005); f.add(hv);
  hv.add(mc('arcade3-hatch|' + k, ({ add }) => { add(G.box(.22, .26, .02, .01), shade(body, -.08), .11, .13, 0); add(G.cyl(.012, .012, .02, 8), STEEL, .19, .16, .015, HP, 0, 0); }));
  const ph = f.part('door', hv, t => { hv.rotation.y = -1.5 * t; }, { label: '오락기 아래 문', sfx: 'open', dur: .28 });
  ph.lockable = true; ph.lockKind = 'pad'; ph.lockAt = { x: .17, y: .14, z: .04, parent: hv };
  f.pullOut(ph, f.spot('inside', null, o.prize ? .13 : -.09, .175, z0 + .02, { part: ph, maxH: .22, label: '오락기 아래 칸', scale: .7 }), z0 + D / 2, { w: .22, d: .2, color: '#efe3c8' });
  if (o.prize) {
    const fl = grp(); put(fl, -.22, .4, z0 + D / 2 + .125); f.add(fl);
    fl.add(mc('arcade3-flap', ({ add }) => { add(G.box(.16, .12, .02, .01), '#ffe14d', 0, -.06, 0); add(G.box(.08, .02, .02, .005), CHAR, 0, -.1, .012); }));
    const pf = f.part('lift', fl, t => { fl.rotation.x = 1.35 * t; }, { label: '경품 나오는 곳', sfx: 'lift', dur: .26 });   // (it swings in, a pet-door flap: up and out it hid the tray from above)
    pf.device = 'arcadeprize';
    pf.lockable = true; pf.lockKind = 'pad'; pf.lockAt = { x: .0, y: -.12, z: .04, parent: fl };   // (a time stage locks it like any box: the token is its key — ② 10/21)
    f.spot('inside', null, -.22, .225, z0 + D / 2 + .06, { part: pf, maxH: .15, label: '경품 나오는 곳', scale: .55 });
    f.prizeAt = new THREE.Vector3(-.22, .3, z0 + D / 2);
  }
  const sBack = o.tilt ? o.gap !== false && f.spot('behind', null, .47, 0, -.12, { maxH: .5, label: '오락기 옆 틈', scale: .8 }) : f.spot('behind', null, .22, 0, z0 - D / 2 - .14, { maxH: .5, label: '오락기 뒤', scale: .8 });   // (turned in its row: the wedge at its side, not the slot at the wall; o.gap false: the end of the row has none)
  f.spot('under', null, o.prize ? .16 : 0, 0, z0 + D / 2 + .42, { maxH: .4, label: '오락기 의자 밑', scale: .7 });
  // o.tilt: turned a little in its row, its side art showing past the next cabinet (검토 10/21); it stands a hair off the wall
  if (o.tilt) {
    const rg = grp(); [...f.group.children].forEach(c => c !== sBack?.anchor && rg.add(c)); rg.rotation.y = o.tilt; rg.position.z = .05; f.add(rg);
    if (f.prizeAt) f.prizeAt.applyAxisAngle(new THREE.Vector3(0, 1, 0), o.tilt).z += .05;
  }
};

// ── 브라운관 TV 세트 (2×1): a low wooden stand with a deep CRT TV on it (a little platformer on screen), two old consoles under
// it, a stack of cartridges, two pads with their cables in a tangle on the floor in front, a cup of noodles and a can; the
// stand's drawer slides out
B.crtset = (f, T) => {
  const z0 = -.1;
  f.add(mc('crtset', ({ add, tube }) => {
    // (10/29 사용자 "책상 서랍 열리는 데 구멍 좀 뚫어라": the drawer ran into the solid body — a hole behind it, lined; the drawer front covers it shut)
    add(holeFace(G.box(1.7, .42, .48, .02), [[.175, .785, -.1795, -.03]]), WALNUT, 0, .21, z0); add(liner(.61, .1495, .42, 'z'), shade(WALNUT, -.05), .48, .10525, z0 + .03);
    add(G.box(1.66, .02, .44, .005), shade(WALNUT, .12), 0, .43, z0);
    add(G.box(1.6, .03, .44, .005), shade(WALNUT, -.15), 0, .2, z0);
    // the CRT: a deep body, a rounded bezel, buttons and a speaker grille
    add(G.box(.78, .6, .56, .08), '#d8d2c6', -.28, .74, z0 - .04); add(G.box(.7, .52, .3, .06), '#c9c2b4', -.28, .74, z0 - .38);
    add(G.box(.62, .46, .03, .06), CHAR, -.28, .76, z0 + .24);
    for (let k = 0; k < 4; k++) add(G.cyl(.012, .012, .02, 8), DARK, -.06 + k * .045, .5, z0 + .245, HP, 0, 0);
    for (let k = 0; k < 5; k++) add(G.box(.12, .008, .01, .002), DARK, .08, .56 + k * .03, z0 + .245);
    add(G.cyl(.006, .006, .3, 5), STEEL, -.12, 1.16, z0 - .08, 0, 0, .5); add(G.cyl(.006, .006, .3, 5), STEEL, -.44, 1.16, z0 - .08, 0, 0, -.5);
    // consoles in the open shelf and the cartridges
    add(G.box(.34, .07, .24, .02), '#bdb8c4', -.4, .27, z0 + .02); add(G.box(.1, .015, .06, .005), '#e8414e', -.47, .31, z0 + .1);
    add(G.box(.3, .08, .22, .03), CHAR, .02, .28, z0 + .02); add(G.cyl(.02, .02, .01, 10), '#7cf0ff', .12, .32, z0 + .12);
    for (let k = 0; k < 7; k++) add(G.box(.09, .02, .12, .004), ['#e8414e', '#3a7bd5', '#ffc23d', '#4caf7a', '#8a5ad8', '#ff8fb8', '#f2f2f2'][k], .5 + (k % 2) * .02, .45 + k * .021, z0 - .02, 0, (k % 3 - 1) * .2, 0);
    add(G.box(.18, .26, .14, .01), '#f2f2f2', .3, .56, z0 - .08); add(G.box(.16, .2, .01, .005), '#3a7bd5', .3, .58, z0 - .005);
    // the pads and the tangle of cables on the floor
    // (검토 10/21: bigger — at the start view's distance the little ones read as specks)
    for (const [x, zz, c, r] of [[-.35, .45, '#bdb8c4', .3], [.15, .5, CHAR, -.5]]) {
      add(G.box(.27, .045, .13, .04), c, x, .025, zz, 0, r, 0); add(G.box(.06, .015, .06, .015), DARK, x - .07 * Math.cos(r), .052, zz + .07 * Math.sin(r), 0, r, 0);
      for (let i = 0; i < 2; i++) add(G.cyl(.018, .018, .014, 8), '#e8414e', x + .06 + i * .035, .052, zz, 0, r, 0);
    }
    for (const [x, zz, c, r] of [[-.62, .5, '#3a7bd5', .5], [.5, .42, '#e8414e', -.2], [.62, .58, '#ffc23d', .9]]) { add(G.box(.15, .025, .2, .006), c, x, .013, zz, 0, r, 0); add(G.box(.11, .004, .07, .003), WHITE, x, .027, zz, 0, r, 0); }
    let prev = [-.35, .02, .4];
    for (const p of [[-.2, .015, .32], [-.05, .015, .44], [.1, .015, .3], [.25, .015, .4], [.1, .015, .48], [-.05, .015, .36], [-.25, .3, z0 + .1]]) { tube(prev, p, .01, DARK, 4); prev = p; }
    prev = [.15, .02, .46]; for (const p of [[.3, .015, .36], [.42, .015, .46], [.3, .015, .52], [.05, .3, z0 + .1]]) { tube(prev, p, .01, '#5b5672', 4); prev = p; }
    // noodles and a can on the stand's corner, a remote
    add(G.cyl(.07, .055, .1, 14), WHITE, .72, .49, z0 + .1); add(G.cyl(.072, .072, .025, 14), '#e8414e', .72, .52, z0 + .1); add(G.cyl(.004, .004, .2, 5), '#e9d9b8', .76, .58, z0 + .12, .3, 0, .3);
    add(G.cyl(.035, .035, .12, 12), '#5ec6d6', .58, .5, z0 + .16); add(G.cyl(.03, .03, .01, 12), STEEL, .58, .565, z0 + .16);
  }));
  const tv = mesh(new THREE.PlaneGeometry(.54, .4), basic(screenTex(0)), { cast: false }); put(tv, -.28, .76, z0 + .26); f.add(tv);
  f.screen = tv;
  const dv = grp(); put(dv, .48, .11, z0 + .24); f.add(dv);
  dv.add(mc('crtset-drawer', ({ add }) => { add(G.box(.62, .16, .02, .01), WALNUT, 0, 0, .01); add(G.box(.58, .02, .38, .005), shade(WALNUT, .15), 0, -.07, -.19); for (const sx of [-1, 1]) add(G.box(.02, .14, .38, .005), shade(WALNUT, .15), sx * .29, 0, -.19); add(G.box(.12, .025, .025, .008), STEEL, 0, 0, .03); }));
  const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .36 * t; }, { label: 'TV장 서랍', sfx: 'drawer', dur: .26 });
  f.spot('inside', dv, 0, -.06, -.18, { part: p, maxH: .12, label: 'TV장 서랍 안', scale: .7 });
  f.spot('behind', null, .1, 0, z0 - .42, { maxH: .4, label: 'TV 뒤', scale: .75 });
  f.spot('on', null, .52, .44, z0 + .12, { maxH: .2, label: 'TV장 위 게임 사이', scale: .6 });
};

// ── 만화책장 (1×1): a deep bookcase packed with comic volumes in series, piles laid flat on top; o.h its height (to the
// ceiling); o.secret: one bright red volume pulls out, and the shelf's middle back swings in to a niche (one part)
B.mangashelf = (f, T, o = {}) => {
  const W = .9, D = .36, z0 = -.3, H = o.h || 2.3, seed = o.seed || 3, n = Math.max(3, Math.round((H - .12) / .38));
  const step = (H - .1) / n;
  f.add(mc('mangashelf|' + H + '|' + seed, ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.04, H, D, .01), WOOD, sx * (W / 2 - .02), H / 2, z0);
    add(G.box(W, .04, D, .01), WOOD, 0, H - .02, z0); add(G.box(W, .06, D, .01), WOODD, 0, .03, z0); add(G.box(W, H, .02, .005), shade(WOOD, -.2), 0, H / 2, z0 - D / 2 + .01);
    for (let k = 1; k < n; k++) add(G.box(W - .06, .025, D - .02, .005), WOOD, 0, .06 + k * step, z0);
    const r = rnd(seed);
    for (let k = 0; k < 4; k++) add(G.box(.16, .025, .12, .005), ['#e8414e', '#3a7bd5', '#ffc23d', '#f2f2f2'][k], -.15 + (k % 2) * .05, H + .015 + k * .026, z0 + .03, 0, (r() - .5) * .4, 0);
    if (r() < .7) for (let k = 0; k < 3; k++) add(G.box(.15, .025, .11, .005), ['#4caf7a', '#ff8fb8', '#8a5ad8'][k], .22, H + .015 + k * .026, z0, 0, (r() - .5) * .5, 0);
  }));
  const tex = spineTex(seed), kSec = o.secret ? Math.floor(n / 2) : -1;
  for (let k = 0; k < n; k++) { if (k === kSec) continue; const pl = mesh(new THREE.PlaneGeometry(W - .08, step - .05), lit(tex), { cast: false }); put(pl, 0, .08 + k * step + (step - .05) / 2, z0 + D / 2 - .05); f.add(pl); }
  f.spot('on', null, .22, H + .02, z0 + .04, { maxH: .22, label: '만화책장 위', scale: .7 });
  f.spot('behind', null, 0, 0, z0 + D / 2 + .12, { maxH: .3, label: '만화책장 앞 쌓인 책 뒤', scale: .7 });
  f.add(mc('mangashelf-pile|' + seed, ({ add }) => { for (let k = 0; k < 5; k++) add(G.box(.16, .025, .12, .005), ['#e8414e', '#ffc23d', '#3a7bd5', '#f2f2f2', '#4caf7a'][k], .02 + (k % 2) * .03, .015 + k * .026, z0 + D / 2 + .22, 0, k * .25, 0); }));
  if (o.secret) {
    const ky = .06 + Math.floor(n / 2) * step;
    const bk = grp(); put(bk, .12, ky + .02, z0 + D / 2 - .06); f.add(bk);
    bk.add(mc('mangashelf-red', ({ add }) => { add(G.box(.06, step - .08, .2, .005), '#ff2d3c', 0, (step - .08) / 2, -.06); add(G.box(.05, .03, .005, .002), '#ffffff', 0, step * .6, .043); add(G.box(.05, .012, .005, .002), '#ffe14d', 0, step * .3, .043); }));
    // the hidden niche (one part — ② 10/21): with the red volume out, that whole row of books swings out like a little door on
    // a hinge at its left, and behind it is a dark cubby in the shelf
    const row = grp(); put(row, -(W - .08) / 2, ky + .03, z0 + D / 2 - .04); f.add(row);
    const rp = mesh(new THREE.PlaneGeometry(W - .08, step - .05), lit(tex), { cast: false }); put(rp, (W - .08) / 2, (step - .05) / 2, 0); row.add(rp);
    row.add(mc('mangashelf-rowback', ({ add }) => { add(G.box(W - .08, step - .05, .03, .005), shade(WOOD, -.25), (W - .08) / 2, (step - .05) / 2, -.02); }));
    f.add(mc('mangashelf-cubby|' + seed, ({ add }) => { add(G.box(W - .1, step - .06, .02, .005), '#4a3a30', 0, ky + .03 + (step - .06) / 2, z0 - D / 2 + .03); add(G.box(.04, .06, .04, .01), '#ffe14d', .3, ky + .06, z0 - .08); }));
    bk.parent.remove(bk); row.add(bk); bk.position.set((W - .08) / 2 + .12, -.01, -.02);
    const ps = f.part('lift', [bk, row], (t, b, r) => { bk.position.z = b.p.z + .16 * Math.min(1, t * 2); bk.rotation.x = -.35 * Math.min(1, t * 2); row.rotation.y = -1.35 * Math.max(0, t * 2 - 1); }, { label: '빨간 만화책', sfx: 'creak', dur: .6 });
    f.spot('behind', null, -.05, ky + .04, z0 - .02, { part: ps, maxH: step - .1, label: '책장 뒤 비밀 칸', scale: .7 });   // (behind a door in the books, not under a lid)
    f.secretPart = ps;
  }
};

// ── 피규어 진열장 (1×1): a tall glass cabinet with a light strip, three glass shelves of figures (little robots, a magical
// girl, a monster, a car), boxed ones on top; the glass doors open
B.figurecase = (f, T, o = {}) => {
  const W = .78, D = .42, z0 = -.26, H = o.h || 1.9, NS = H > 1.6 ? 3 : 2;   // (o.h: a low one fits the mezzanine)
  f.add(mc('figurecase|' + H, ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.04, H, D, .01), CHAR, sx * (W / 2 - .02), H / 2, z0);
    add(G.box(W, .05, D, .01), CHAR, 0, H - .025, z0); add(G.box(W, .1, D, .01), CHAR, 0, .05, z0); add(G.box(W - .04, H, .02, .005), '#3b3550', 0, H / 2, z0 - D / 2 + .01);
    add(G.box(W - .1, .02, .02, .01), '#fff6d6', 0, H - .07, z0 + .1);
    const r = rnd(5), cols = ['#e8414e', '#3a7bd5', '#ffc23d', '#ff8fb8', '#7cf0ff', '#8a5ad8', '#f2f2f2', '#4caf7a'];
    for (let s = 0; s < NS; s++) {
      const y = .4 + s * (H - .5) / NS; add(G.box(W - .08, .015, D - .04, .005), '#dff3fb', 0, y, z0);
      for (let k = 0; k < 4; k++) { const x = -.27 + k * .18, c = cols[(s * 4 + k) % cols.length];
        if ((s + k) % 3 === 0) { add(G.box(.07, .1, .05, .015), c, x, y + .07, z0 + .02); add(G.box(.05, .05, .05, .015), c, x, y + .15, z0 + .02); add(G.box(.03, .01, .01, .004), '#7cf0ff', x, y + .16, z0 + .046); add(G.cyl(.008, .008, .05, 5), STEEL, x + .02, y + .2, z0 + .02); }
        else if ((s + k) % 3 === 1) { add(G.cone(.05, .12, 10), c, x, y + .07, z0 + .02); add(G.sph(.035, 10, 8), '#ffe8d2', x, y + .16, z0 + .02); add(G.sph(.037, 10, 8), cols[(k + 3) % 8], x, y + .175, z0 + .015, 0, 0, 0, [1, .7, 1]); }
        else { add(G.sph(.055, 10, 8), c, x, y + .06, z0 + .02, 0, 0, 0, [1, .9, 1]); add(G.sph(.012, 6, 5), INK, x - .02, y + .08, z0 + .07); add(G.sph(.012, 6, 5), INK, x + .02, y + .08, z0 + .07); } }
    }
    for (let k = 0; k < 3; k++) add(G.box(.2, .26, .14, .01), cols[k + 2], -.24 + k * .24, H + .13, z0 + .02, 0, (r() - .5) * .3, 0);
  }));
  const glassM = mat('#dff3fb', { opacity: .28, rough: .1 });
  const doors = [-1, 1].map(s => { const dv = grp(); put(dv, s * (W / 2 - .03), .1, z0 + D / 2); f.add(dv);
    const fr = mc('figurecase-door|' + H, ({ add }) => { add(G.box(.025, H - .16, .025, .005), CHAR, 0, (H - .16) / 2, 0); add(G.box(W / 2 - .04, .025, .025, .005), CHAR, -(W / 4 - .02), H - .17, 0); add(G.box(W / 2 - .04, .025, .025, .005), CHAR, -(W / 4 - .02), .0, 0); add(G.box(.012, .12, .02, .004), STEEL, -(W / 2 - .07), (H - .16) / 2, .02); });
    fr.scale.x = s; dv.add(fr);
    const gl = mesh(new THREE.PlaneGeometry(W / 2 - .05, H - .2), glassM, { cast: false }); put(gl, -s * (W / 4 - .02), (H - .16) / 2, .005); dv.add(gl);
    return [dv, s]; });
  const p = f.part('door', doors.map(d => d[0]), t => doors.forEach(([dv, s]) => { dv.rotation.y = s * 1.4 * t; }), { label: '피규어 진열장 문', sfx: 'open', dur: .32 });
  f.spot('inside', null, -.15, .4 + (H - .5) / NS + .02, z0 + .06, { part: p, maxH: .28, label: '피규어 진열장 가운데 칸', scale: .7 });
  f.spot('inside', null, .2, .4 + .02, z0 + .06, { part: p, maxH: .28, label: '피규어 진열장 아래 칸', scale: .7 });
  f.spot('on', null, .3, H + .01, z0 + .08, { maxH: .26, label: '피규어 진열장 위', scale: .7 });
};

// ── 서랍 계단 (1×2, the high end at -z up to the mezzanine): four boxy steps, each a drawer with a round pull, a handrail on
// posts on the open side; a cubby in its side under the top steps (lockable), which also springs once all four drawers are open
B.drawerstairs = (f, T, o = {}) => {
  const Y = o.y || 1.65, N = 4, R = Y / N, RUN = 2 / N, Wd = .86;
  f.add(mc('drawerstairs|' + Y, ({ add, tube }) => {
    // (the top two steps stand on a hollow: the cubby under them, its open side on +x behind a door)
    const CY = R * 1.7;
    for (let i = 0; i < N; i++) {
      const zc = 1 - (i + .5) * RUN, h = (i + 1) * R, y0 = zc < 0 ? CY : 0;
      // (10/29 사용자 "책상 서랍 열리는 데 구멍 좀 뚫어라": the drawer ran into the solid body — a hole behind it, lined; the drawer front covers it shut)
      const dy = i * R + R / 2 - (y0 + (h - y0) / 2);
      add(holeFace(G.box(Wd, h - y0, RUN, .015), [[-.02 - (Wd - .12) / 2, -.02 + (Wd - .12) / 2, dy - (R - .06) / 2 + .005, dy + (R - .06) / 2 - .008]]), WOOD, 0, y0 + (h - y0) / 2, zc);
      add(liner(Wd - .12, R - .073, RUN - .04, 'z'), shade(WOOD, -.3), -.02, i * R + R / 2 - .0015, zc + .02);
      add(G.box(Wd + .02, .03, RUN + .02, .01), shade(WOOD, .12), 0, h + .015, zc);
      add(G.box(Wd - .2, .01, RUN - .06, .004), '#c9e7d6', 0, h + .032, zc);
    }
    add(G.box(.03, CY, 1, .01), shade(WOOD, -.08), -Wd / 2 + .015, CY / 2, -.5); add(G.box(Wd, .02, 1, .005), '#7a5a40', 0, .01, -.5); add(G.box(Wd, CY, .03, .01), shade(WOOD, -.25), 0, CY / 2, -.985);
    add(G.box(Wd - .04, .03, .98, .01), shade(WOOD, -.15), 0, CY - .015, -.5);
    const x = Wd / 2 + .03;
    for (let i = 0; i <= N; i++) add(G.cyl(.02, .02, .85, 8), WOODD, x, (i ? i * R : 0) + .43, 1 - i * RUN);
    tube([x, .85, 1], [x, Y + .85, -1], .025, WOODD, 8);
  }));
  const drawers = [];
  for (let i = 0; i < N; i++) {
    const zc = 1 - (i + .5) * RUN, dv = grp(); put(dv, -.02, i * R + R / 2, zc + RUN / 2 + .005); f.add(dv);
    dv.add(mc('drawerstairs-drawer|' + R.toFixed(2), ({ add }) => {
      add(G.box(Wd - .1, R - .06, .025, .01), shade(WOOD, -.05), 0, 0, .012); add(G.cyl(.03, .03, .03, 12), ['#ffc23d', '#7fd6c0', '#ff9fb8', '#8fd3f4'][i], 0, 0, .035, HP, 0, 0);
      add(G.box(Wd - .14, .02, RUN - .1, .005), shade(WOOD, .2), 0, -R / 2 + .05, -(RUN - .1) / 2);
    }));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + RUN * .7 * t; }, { label: `계단 서랍 ${i + 1}`, sfx: 'drawer', dur: .24 });
    f.spot('inside', dv, 0, -R / 2 + .06, -(RUN - .1) / 2, { part: p, maxH: Math.min(.22, R - .1), label: `계단 서랍 ${i + 1}칸`, scale: .7 });
    drawers.push(p);
  }
  // the secret cubby in the stairs' side, under the top steps
  const sv = grp(); put(sv, Wd / 2 + .005, 0, -.99); f.add(sv);
  sv.add(mc('drawerstairs-panel', ({ add }) => { add(G.box(.02, R * 1.7 - .02, .96, .01), shade(WOOD, -.1), 0, R * .85, .48); add(G.box(.01, .14, .14, .02), '#ffe14d', .012, R * .9, .8); }));
  const ps = f.part('door', sv, t => { sv.rotation.y = 1.4 * t; }, { label: '계단 옆 숨은 칸', sfx: 'creak', dur: .45 });
  ps.lockable = true; ps.lockKind = 'code'; ps.lockAt = { x: .03, y: R * .9, z: .8, parent: sv };
  f.spot('inside', null, .12, .03, -.45, { part: ps, maxH: .4, label: '계단 옆 숨은 칸', scale: .8 });
  // (and the trick of it: open all four drawers and it springs by itself, unless it is locked — ② 10/21: an ordinary place too)
  const check = S => { if (ps.t > .5 || ps.lock || drawers.some(d => d.t < .5)) return; S.G.audio.sfx('special'); setTimeout(() => !S.dead && S.togglePart(ps, true), 400); };
  drawers.forEach(d => { d.afterOpen = check; });
  f.secretPart = ps;
};

// ── 다락 바구니 도르래 (1×1, at the mezzanine's front edge — 7판 liftbasket's way, ② 10/21): a post up past the rail with an arm
// and a pulley, the crank on the post; the basket waits on the floor and the crank sends it up to the mezzanine. A little
// hook under the arm holds a thing out of reach (spot.hang) that drops into the basket as it comes up (stage.js dropHung)
B.loftpulley = (f, T, o = {}) => {
  const Y = o.y || 1.65, TOP = Y + 1.0, bx = .0, bz = .1, yB = .02, yT = Y + .06;
  f.add(mc('loftpulley|' + Y, ({ add, tube }) => {
    add(G.box(.08, TOP, .08, .015), WOODD, .38, TOP / 2, -.42); add(G.box(.5, .06, .06, .015), WOODD, .16, TOP - .05, -.42); add(G.box(.06, .06, .58, .015), WOODD, bx, TOP - .05, -.15);
    add(G.cyl(.08, .08, .04, 16), STEEL, bx, TOP - .14, bz, 0, 0, HP); add(G.tor(.08, .012, PI * 2, 5, 18), STEEL2, bx, TOP - .14, bz, 0, HP, 0);
    add(G.cyl(.06, .06, .05, 14), STEEL, .38, 1.0, -.36, HP, 0, 0);
    tube([.17, TOP - .1, bz], [.17, TOP - .22, bz], .006, '#a87a34', 5); add(G.tor(.03, .009, PI * 1.45, 6, 14), '#e0b04a', .165, TOP - .25, bz, 0, 0, PI); add(G.sph(.013, 8, 6), '#e0b04a', .135, TOP - .25, bz);
  }));
  const crank = grp(); put(crank, .38, 1.0, -.33); f.add(crank);
  crank.add(mc('loftpulley-crank', ({ add }) => { add(G.box(.14, .025, .025, .008), STEEL2, .06, 0, .02); add(G.cyl(.02, .02, .07, 10), TOMATO, .13, 0, .05, HP, 0, 0); }));
  const bk = grp(); put(bk, bx, yB, bz); f.add(bk);
  bk.add(mc('loftpulley-basket', ({ add }) => {
    add(G.box(.42, .24, .3, .04), SKY, 0, .12, 0); for (let k = 0; k < 4; k++) add(G.box(.43, .02, .31, .005), shade(SKY, -.15), 0, .05 + k * .05, 0);
    for (const sx of [-1, 1]) add(G.tor(.06, .012, PI, 4, 10), shade(SKY, -.2), sx * .14, .26, 0);
    add(G.box(.36, .04, .24, .02), '#f2dc9a', 0, .2, 0);
  }));
  const rope = mesh(new THREE.CylinderGeometry(.006, .006, 1, 5), mat('#e8d6a8')); f.add(rope);
  const setRope = () => { const y0 = TOP - .22, y1 = bk.position.y + .3, L = Math.max(.02, y0 - y1); rope.scale.y = L; rope.position.set(bx, y1 + L / 2, bz); };
  setRope();
  const p = f.part('slide', [bk, crank], (t, b) => { bk.position.y = b.p.y + (yT - yB) * t; bk.rotation.z = Math.sin(t * PI * 3) * .04 * (1 - t); crank.rotation.z = -t * PI * 6; setRope(); }, { label: '도르래 바구니', sfx: 'swish', dur: 1.2 });
  p.handle = crank;
  f.spot('inside', bk, 0, .23, 0, { part: p, maxH: .26, label: '도르래 바구니 안', scale: .85 });
  f.spot('on', null, .17, TOP - .56, bz, { maxH: .24, label: '도르래 꼭대기 고리', scale: .8, wallFace: true }).hang = p;
  f.spot('behind', null, .3, 0, -.25, { maxH: .3, label: '도르래 기둥 옆', scale: .7 });
};

// ── 플라스틱 서랍장 (1×1): a clear three-tier drawer tower on castors, things showing through, a fan and a tissue box on top
B.pdrawers = (f, T) => {
  const W = .46, D = .42, z0 = -.25;
  f.add(mc('pdrawers', ({ add }) => {
    // (10/29 사용자 "책상 서랍 열리는 데 구멍 좀 뚫어라": the drawer ran into the solid body — a hole behind it, lined; the drawer front covers it shut)
    add(holeFace(G.box(W, .9, D, .03), [[-.2, .2, -.357, -.125], [-.2, .2, -.077, .155], [-.2, .2, .203, .41]]), PLASTIC, 0, .5, z0);
    for (const [y, h] of [[.259, .232], [.539, .232], [.8065, .207]]) add(liner(.4, h, .37, 'z'), shade(PLASTIC, -.3), 0, y, z0 + .025);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.sph(.025, 8, 6), DARK, sx * (W / 2 - .04), .025, z0 + sz * (D / 2 - .04));
    add(G.box(.22, .1, .14, .02), '#f2f2f2', -.08, 1.0, z0); add(G.box(.08, .02, .02, .01), '#ff9fb8', -.08, 1.06, z0);
    add(G.cyl(.1, .12, .04, 16), WHITE, .12, .97, z0); add(G.cyl(.015, .015, .26, 6), WHITE, .12, 1.12, z0); add(G.cyl(.14, .14, .04, 20), '#dff3fb', .12, 1.3, z0 + .02, HP, 0, 0); add(G.tor(.14, .01, PI * 2, 4, 20), WHITE, .12, 1.3, z0 + .02);
  }));
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const dv = grp(); put(dv, 0, .14 + i * .28, z0 + D / 2 + .004); f.add(dv);
    dv.add(mc('pdrawers-dr|' + i, ({ add }) => { add(G.box(W - .04, .25, .02, .02), '#e8eef6', 0, .12, 0); add(G.box(.14, .03, .02, .01), '#c9cfe0', 0, .2, .015); add(G.box(W - .08, .12, D - .08, .01), ['#ff9fb8', '#8fd3f4', '#ffc23d'][i], 0, .07, -(D - .08) / 2 - .01); }));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .3 * t; }, { label: `플라스틱 서랍 ${3 - i}칸`, sfx: 'drawer', dur: .22 });
    f.spot('inside', dv, 0, .14, -(D - .08) / 2, { part: p, maxH: .1, label: `플라스틱 서랍 ${3 - i}칸`, scale: .6 });
    parts.push(p);
  }
};

// ── 게임 상자 선반 (1×1): a low cube shelf crammed with boxed games and a handheld charger, a stack of discs
B.gamerack = (f, T) => {
  const W = .9, D = .36, z0 = -.3;
  f.add(mc('gamerack', ({ add }) => {
    add(G.box(W, .78, D, .02), WHITE, 0, .39, z0); add(G.box(W - .06, .02, D - .02, .005), '#ece6dc', 0, .4, z0);
    const cols = ['#e8414e', '#3a7bd5', '#ffc23d', '#4caf7a', '#8a5ad8', '#ff8fb8', '#2f2b3d', '#f2f2f2', '#ff8f3a', '#5ec6d6'];
    for (const y of [.05, .42]) for (let k = 0; k < 11; k++) add(G.box(.06, .3 - (k % 3) * .02, .24, .005), cols[(k + (y > .1 ? 4 : 0)) % 10], -.36 + k * .072, y + .15 - (k % 3) * .01, z0 + .03);
    for (let k = 0; k < 5; k++) add(G.cyl(.08, .08, .01, 18), k % 2 ? '#dfe6f6' : '#c9d1e6', .2, .79 + k * .012, z0);
    add(G.box(.22, .1, .08, .03), CHAR, -.18, .84, z0); add(G.box(.12, .07, .01, .01), '#7cf0ff', -.18, .85, z0 + .045);
  }));
  f.spot('on', null, -.05, .79, z0 + .06, { maxH: .26, label: '게임 선반 위', scale: .7 });
  f.spot('behind', null, 0, 0, z0 + D / 2 + .1, { maxH: .26, label: '게임 선반 앞', scale: .6 });
};

// ── 벗어 둔 것들 (1×1, small, no footprint for walking): a hoodie in a heap, a snack bag, an empty can, a phone on its cable
B.floormess = (f, T, o = {}) => {
  const k = o.kind || 0;
  const fm = f.add(mc('floormess|' + k, ({ add, tube }) => {
    if (k === 0) { add(G.sph(.22, 12, 8), '#6a86c9', 0, .07, 0, 0, .3, 0, [1.3, .35, 1]); add(G.sph(.12, 10, 7), '#5b78bd', .12, .1, .08, 0, 0, 0, [1, .5, 1]); add(G.tor(.07, .02, PI * 2, 5, 12), '#4f6db0', -.15, .13, -.02, HP, 0, 0); for (const sx of [-1, 1]) add(G.cyl(.006, .006, .14, 5), WHITE, -.08 + sx * .03, .12, .12, .6, 0, 0); }
    else {
      // (10/22 밤 사용자 "뭔지 모를 덩어리": the snack bag was a flat yellow board with a red square — now a puffed bag crimped
      // shut at both ends, its red label, a few chips spilled out of it; the can has its rim)
      const ry = .4, ex = Math.sin(ry) * .19, ez = Math.cos(ry) * .19;
      add(G.sph(.14, 14, 10), '#ffc23d', -.1, .045, 0, 0, ry, 0, [1, .3, 1.35]);
      for (const s of [-1, 1]) add(G.box(.2, .022, .035, .008), '#f2a91c', -.1 + s * ex, .03, s * ez, 0, ry, 0);
      add(G.sph(.06, 10, 7), '#e8414e', -.1, .083, 0, 0, ry, 0, [1.15, .14, .85]);
      for (const [x, z, a] of [[.06, .15, .3], [.12, .2, 1.2], [.02, .23, 2.1], [.15, .27, .7]]) add(G.sph(.028, 8, 6), '#f7d774', x, .012, z, .3, a, 0, [1.2, .3, 1]);
      add(G.cyl(.035, .035, .12, 12), '#7fd6c0', .15, .035, .1, HP, .8, 0); add(G.tor(.031, .006, PI * 2, 4, 14), '#d9dee6', .15 + Math.sin(.8) * .06, .035, .1 + Math.cos(.8) * .06, 0, .8, 0); add(G.box(.08, .01, .15, .015), CHAR, .1, .01, -.15, 0, -.3, 0); tube([.1, .01, -.08], [.25, .01, -.25], .005, WHITE, 3); }
  }));
  fm.scale.setScalar(1.5);   // (검토 10/21: at the start view's distance the little ones read as specks)
  f.spot('under', null, k ? .02 : .22, 0, k ? .16 : .1, { maxH: .2, label: k ? '과자 봉지 밑' : '벗어 둔 후드티 밑', scale: .65 });   // (at the edge: it peeks out)
};

// a string of warm fairy lights hung along the mezzanine's handrail (its top at .585 over the loft floor), on the room side
// of it, from x0 to x1 at z (검토 2차 마무리 10/22: from the first view the mezzanine read as bars over a bed)
const railLights = (add, tube, x0, x1, z) => {
  let prev = null; const N = Math.max(3, Math.round((x1 - x0) / .12));
  for (let i = 0; i <= N; i++) { const t = i / N, x = x0 + (x1 - x0) * t, y = .5 - Math.sin(t * PI * Math.max(1, Math.round((x1 - x0) / .5))) * .07, p = [x, y, z];
    if (prev) tube(prev, p, .005, '#5b5672', 3); prev = p; if (i % 2) add(G.sph(.032, 6, 5), ['#fff1b8', '#ffd98a', '#ffe9c9'][i % 3], x, y - .035, z + .006); }
};

// ── 너굴이 이불 (1×2, the mezzanine's bed, head at -z): a mattress on the floor in a grey-blue sheet, a puffy mustard duvet
// kicked half down with a fold, a long body pillow by the wall, a raccoon plush sitting at the foot, comics stacked on the
// mattress, a phone face up on its cable by the pillow; the pillow and the duvet lift (2판 futon's way)
// (o.noRail: no mezzanine handrail in front of it — 18판 otakuloft5's room floor — so no fairy lights hung on one)
B.otakufuton = (f, T, o = {}) => {
  const SHEET = '#dfe6f2', DUV = '#f4a259', DUV2 = '#fff1d6';
  f.add(mc('otakufuton' + (o.noRail ? '|nr' : ''), ({ add, tube }) => {
    add(G.box(.9, .16, 1.86, .05), SHEET, 0, .08, 0); add(G.box(.914, .02, 1.874, .008), '#9fb0cc', 0, .03, 0);
    // the body pillow along the wall side
    add(G.cyl(.1, .1, 1.0, 14), '#ffd6e6', -.33, .25, -.15, HP, 0, 0); for (const z of [-.64, .34]) add(G.sph(.1, 12, 8), '#ffd6e6', -.33, .25, z, 0, 0, 0, [1, 1, .5]);
    add(G.box(.012, .1, .3, .004), '#ff8fb8', -.23, .27, -.15);
    // comics on the mattress' foot
    for (let k = 0; k < 6; k++) add(G.box(.13, .028, .19, .004), ['#e8414e', '#3a7bd5', '#ffc23d', '#f2f2f2', '#4caf7a', '#8a5ad8'][k], -.24, .175 + k * .029, .74, 0, (k % 3 - 1) * .18, 0);
    for (let k = 0; k < 3; k++) add(G.box(.13, .028, .19, .004), ['#ff8fb8', '#f2f2f2', '#3a7bd5'][k], -.06, .175 + k * .029, .8, 0, .5 + k * .2, 0);
    // the raccoon plush at the foot corner, facing out
    const px = .27, pz = .78, py = .16;
    add(G.sph(.13, 14, 10), '#a89a8c', px, py + .12, pz, 0, 0, 0, [1, .95, .9]); add(G.sph(.08, 12, 8), '#efe6da', px, py + .1, pz + .07, 0, 0, 0, [1, 1, .6]);
    add(G.sph(.11, 14, 10), '#a89a8c', px, py + .3, pz + .01); add(G.box(.2, .05, .06, .02), '#4a4048', px, py + .31, pz + .08);
    for (const sx of [-1, 1]) { add(G.sph(.018, 8, 6), '#ffffff', px + sx * .045, py + .315, pz + .11); add(G.cone(.04, .06, 8), '#4a4048', px + sx * .07, py + .41, pz, 0, 0, sx * -.3); add(G.sph(.04, 8, 6), '#a89a8c', px + sx * .12, py + .1, pz + .08); }
    add(G.sph(.02, 8, 6), INK, px, py + .29, pz + .115);
    for (let k = 0; k < 3; k++) add(G.cyl(.045 - k * .006, .05 - k * .006, .07, 10), k % 2 ? '#4a4048' : '#a89a8c', px + .13, py + .05 + k * .06, pz - .1, .4, 0, -.6);
    // the phone on its cable by the pillow
    add(G.box(.075, .012, .15, .012), CHAR, .3, .166, -.42, 0, .3, 0); add(G.box(.06, .004, .12, .004), '#7cf0ff', .3, .174, -.42, 0, .3, 0);
    // (out past the handrail's face, hanging under it)
    if (!o.noRail) railLights(add, tube, -.46, .5, 1.075);
    tube([.28, .165, -.5], [.4, .14, -.62], .006, WHITE, 3); tube([.4, .14, -.62], [.44, .02, -.85], .006, WHITE, 3); tube([.44, .02, -.85], [.44, .02, -.98], .006, WHITE, 3);
  }));
  const pil = grp(mc('otakufuton-pillow', ({ add }) => { add(G.box(.52, .12, .3, .05, 2), '#ffffff', 0, 0, 0); add(G.box(.3, .005, .2, .004), '#8fd3f4', .04, .062, .02); }));
  put(pil, .05, .22, -.72); f.add(pil);
  const pp = f.part('lift', pil, (t, b) => { pil.position.y = b.p.y + .34 * t; pil.rotation.x = -.35 * t; pil.rotation.z = .12 * t; }, { label: '베개', sfx: 'lift' });
  f.spot('inside', null, .05, .17, -.72, { part: pp, maxH: .22, label: '베개 밑' });
  const bl = grp(); put(bl, 0, .3, .02); f.add(bl);
  bl.add(mc('otakufuton-duvet', ({ add }) => {
    add(G.box(.88, .06, .9, .03), DUV, 0, .02, 0); for (const sx of [-1, 1]) add(G.box(.04, .13, .86, .02), DUV, sx * .42, -.04, 0, 0, 0, sx * .1);
    add(G.box(.86, .14, .04, .02), DUV, 0, -.04, .44, -.12, 0, 0); add(G.cyl(.065, .065, .86, 12), DUV2, 0, .02, -.45, 0, 0, HP);
    for (const [x, z] of [[-.25, -.2], [.15, .05], [-.05, .28], [.28, -.28], [.3, .26]]) add(G.ext(new THREE.Shape([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => new THREE.Vector2(Math.cos(-HP + k * PI / 5) * (k % 2 ? .02 : .045), Math.sin(-HP + k * PI / 5) * (k % 2 ? .02 : .045)))), .004, 0, 1), DUV2, x, .052, z, -HP, 0, 0);
    // an open comic face down and a crisp bag on the duvet
    add(G.box(.13, .012, .2, .004), '#3a7bd5', -.12, .08, .12, 0, .3, -.35); add(G.box(.13, .012, .2, .004), '#3a7bd5', -.01, .08, .16, 0, .3, .35);
    add(G.box(.2, .04, .26, .03), '#ff4f6a', .22, .08, .22, 0, -.5, 0); add(G.box(.1, .005, .12, .005), '#ffe14d', .22, .103, .22, 0, -.5, 0);
  }));
  // (③ 10/22: the duvet bends and curls back from its foot like every 이불 — gfx/clothbend.js; the pillow end stays)
  const bp = f.part('lift', bl, clothBend(f, bl, { hinge: [0, 0, -.4], along: [0, 0, 1], toward: [0, 1, 0], len: .9, turn: 2.3, rise: .08, flaps: true }), { label: '이불', sfx: 'lift', dur: .6 });
  f.spot('under', null, 0, .17, .0, { part: bp, maxH: .12, label: '이불 속' });   // (a hollow under the duvet's tent — not a box: its height is the cap)
  f.spot('behind', null, .16, .16, .58, { maxH: .26, label: '너굴이 인형 뒤', scale: .75 });   // (between the duvet's edge and the plush: it peeks past the plush's side)
  f.spot('behind', null, -.3, .16, .56, { maxH: .22, label: '만화책 더미 뒤', scale: .7 });
};

// ── 다락 둥지 (1×1, small, by the bed): a floor cushion with a handheld on it, a tower of comics in three piles, a reading
// lamp with a warm shade, a big snack bag and a can, the hoodie in a heap (o.noRail: no handrail — no lights or towel on one)
B.loftnest = (f, T, o = {}) => {
  const cu = grp(); put(cu, -.1, .045, .16); f.add(cu);
  cu.add(mc('loftnest-cushion', ({ add }) => {
    add(G.box(.5, .09, .5, .04), '#5f8fd0', 0, 0, 0, 0, .25, 0); add(G.box(.42, .01, .42, .01), '#7fb8e6', 0, .047, 0, 0, .25, 0);
    add(G.box(.16, .025, .08, .02), WHITE, 0, .065, .02, 0, -.3, 0); add(G.box(.07, .006, .05, .004), '#7cf0ff', 0, .08, .02, 0, -.3, 0);
  }));
  const pc = f.part('lift', cu, (t, b) => { cu.position.y = b.p.y + .2 * t; cu.position.x = b.p.x + .08 * t; cu.rotation.z = -.5 * t; }, { label: '방석', sfx: 'lift', dur: .25 });
  f.spot('inside', null, -.12, .0, .16, { part: pc, maxH: .2, label: '방석 밑', scale: .7 });
  const hd = grp(); put(hd, -.16, .0, -.12); f.add(hd);
  hd.add(mc('loftnest-hoodie', ({ add }) => { add(G.sph(.26, 12, 8), '#6a86c9', 0, .08, 0, 0, -.4, 0, [1.2, .32, .8]); add(G.tor(.08, .025, PI * 2, 5, 12), '#4f6db0', -.14, .13, -.05, HP, 0, 0); for (const sx of [-1, 1]) add(G.cyl(.006, .006, .14, 5), WHITE, .05 + sx * .03, .12, .14, .6, 0, 0); }));
  const ph = f.part('lift', hd, (t, b) => { hd.position.y = b.p.y + .3 * t; hd.rotation.x = -.5 * t; hd.rotation.z = .3 * t; }, { label: '후드티', sfx: 'lift', dur: .25 });
  f.spot('under', null, -.16, .0, -.1, { part: ph, maxH: .18, label: '벗어 둔 후드티 밑', scale: .7 });
  f.collideBox = [-.44, 0, -.5, .5, .32, .5];   // (low: the comic shelf's secret row swings out over it; the bed's duvet beside it)
  f.add(mc('loftnest' + (o.noRail ? '|nr' : ''), ({ add, tube }) => {
    for (const [x, z, n, r] of [[.16, -.12, 9, .1], [.02, -.16, 6, -.25], [.3, .06, 4, .5]]) for (let k = 0; k < n; k++) add(G.box(.14, .03, .2, .004), ['#e8414e', '#3a7bd5', '#ffc23d', '#f2f2f2', '#4caf7a', '#8a5ad8', '#ff8fb8'][(k + n) % 7], x, .015 + k * .031, z, 0, r + (k % 3 - 1) * .08, 0);
    // the lamp
    add(G.cyl(.12, .14, .03, 16), CHAR, .36, .015, -.34); add(G.cyl(.012, .012, .82, 6), STEEL, .36, .43, -.34); add(G.cyl(.08, .15, .16, 16), '#ffe0a6', .36, .88, -.34); add(G.sph(.04, 8, 6), '#fff6d6', .36, .82, -.34);
    // the snack bag, a can, the hoodie
    add(G.box(.3, .06, .4, .045), '#e8414e', .18, .03, .3, 0, .6, 0); add(G.box(.16, .006, .18, .006), '#ffe14d', .18, .062, .3, 0, .6, 0);
    add(G.cyl(.04, .04, .13, 12), '#7fd6c0', .38, .065, .36); add(G.cyl(.035, .035, .01, 12), STEEL, .38, .133, .36);
    if (!o.noRail) {
      railLights(add, tube, -.5, .5, .575);
      // a striped towel thrown over the handrail
      for (const [z, y, h] of [[.47, .45, .26], [.53, .44, .3]]) { add(G.box(.26, h, .014, .006), '#ff9fb8', .12, y, z); for (const dy of [-.06, .04]) add(G.box(.262, .02, .016, .004), WHITE, .12, y + dy, z); }
      add(G.cyl(.024, .024, .262, 8), '#ff9fb8', .12, .6, .5, 0, 0, HP);
    }
  }));
  f.spot('behind', null, .12, 0, -.3, { maxH: .26, label: '만화책 탑 뒤', scale: .7 });
};

// ── 벽 선반 (wall, span 1): two short floating boards, comics standing between bookends, a little robot, a cactus, a framed
// photo leaning; o.y its height
B.otakushelf = (f, T, o = {}) => {
  const y = o.y || 2.3;
  f.add(mc('otakushelf|' + y, ({ add }) => {
    for (const [dy, w] of [[0, .8], [.36, .62]]) { add(G.box(w, .03, .2, .01), WOOD, 0, y + dy, .1); for (const sx of [-1, 1]) add(G.box(.02, .1, .14, .005), WOODD, sx * (w / 2 - .08), y + dy - .06, .06); }
    for (let k = 0; k < 8; k++) add(G.box(.035, .17 - (k % 3) * .015, .13, .004), ['#e8414e', '#3a7bd5', '#ffc23d', '#4caf7a', '#f2f2f2', '#8a5ad8', '#ff8fb8', '#2f2b3d'][k], -.3 + k * .038, y + .1 - (k % 3) * .008, .11);
    add(G.box(.08, .1, .06, .015), '#c9cfd8', .17, y + .065, .12); add(G.box(.06, .06, .06, .015), '#c9cfd8', .17, y + .15, .12); add(G.box(.04, .01, .01, .004), '#7cf0ff', .17, y + .16, .152);
    add(G.cyl(.04, .03, .06, 10), '#d98b5f', .31, y + .045, .12); add(G.sph(.035, 8, 6), LEAF2, .31, y + .1, .12, 0, 0, 0, [1, 1.4, 1]);
    add(G.box(.18, .14, .015, .005), WHITE, -.12, y + .45, .08, -.2, 0, 0); add(G.box(.15, .11, .005, .004), '#8fd3f4', -.12, y + .45, .09, -.2, 0, 0);
    for (let k = 0; k < 3; k++) add(G.sph(.04, 8, 6), ['#ff9fb8', '#ffe14d', '#7fd6c0'][k], .08 + k * .08, y + .4, .1, 0, 0, 0, [1, .9, 1]);
  }));
  f.spot('on', null, .1, y + .38, .1, { maxH: .18, label: '벽 선반 위', scale: .85, wallFace: true });
};

// ── 액자 모음 (wall, span 1): three small frames hung at odd heights — a game screenshot, a photo of friends, a ticket — and a
// felt pennant; o.y its height
B.otakuframes = (f, T, o = {}) => {
  const y = o.y || 2.2;
  f.add(mc('otakuframes|' + y, ({ add }) => {
    for (const [x, dy, w, h, c, c2] of [[-.22, .1, .3, .24, CHAR, '#3a7bd5'], [.14, .2, .22, .28, WOOD, '#ffd98a'], [.08, -.18, .3, .18, WHITE, '#ff9fb8']]) {
      add(G.box(w, h, .025, .006), c, x, y + dy, .015); add(G.box(w - .05, h - .05, .006, .003), c2, x, y + dy, .03);
      add(G.box(w * .4, h * .3, .004, .002), WHITE, x - w * .12, y + dy + h * .1, .035);
    }
    const pen = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(.36, -.06), new THREE.Vector2(0, -.13)]);
    add(G.ext(pen, .006, 0, 1), '#e8414e', -.38, y - .08, .02, 0, 0, -.15); add(G.box(.015, .15, .015, .004), WOODD, -.38, y - .13, .025, 0, 0, -.15);
  }));
};

// ── 꼬마전구 (wall, span 4): a strand of warm fairy lights looping along the wall high up, little paper stars on it
B.fairylights = (f, T, o = {}) => {
  const L = o.len || 4, Y = o.y || 2.6;
  f.add(mc('fairylights|' + L + '|' + Y, ({ add, tube }) => {
    let prev = null; const N = Math.round(L * 5);
    for (let i = 0; i <= N; i++) { const t = i / N, x = -L / 2 + L * t, y = Y - Math.abs(Math.sin(t * PI * 3)) * .22, p = [x, y, .06]; if (prev) tube(prev, p, .004, '#5b5672', 3); prev = p;
      if (i % 2) add(G.sph(.028, 8, 6), ['#fff1b8', '#ffd98a', '#ffe9c9'][i % 3], x, y - .04, .07); }
    for (let i = 0; i < 4; i++) add(G.ext(new THREE.Shape([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => new THREE.Vector2(Math.cos(-HP + k * PI / 5) * (k % 2 ? .02 : .05), Math.sin(-HP + k * PI / 5) * (k % 2 ? .02 : .05)))), .005, 0, 1), ['#ffe14d', '#ff9fb8', '#7cf0ff', '#ffe14d'][i], -L / 2 + (i + .5) * L / 4, Y - .3, .07);
  }));
};

// ── 비 오는 창 (wall, span 2): a sash window — rain on the glass over the city's lit windows at night, a sill with a cactus and
// a can, a half-drawn roll blind, a hand towel on the latch; o.y lifts it (the mezzanine's window)
B.rainwin = (f, T, o = {}) => {
  const W = 1.4, H = 1.0, cy = (o.y || 0) + 1.55;
  f.add(mc('rainwin|' + cy, ({ add }) => {
    for (const sy of [-1, 1]) add(G.box(W + .14, .07, .1, .02), WHITE, 0, cy + sy * (H / 2 + .035), .05);
    for (const sx of [-1, 1]) add(G.box(.07, H + .14, .1, .02), WHITE, sx * (W / 2 + .035), cy, .05);
    add(G.box(.04, H, .06, .01), WHITE, 0, cy, .04);
    add(G.box(W + .24, .05, .2, .015), WHITE, 0, cy - H / 2 - .06, .1);
    add(G.cyl(.05, .04, .08, 10), '#d98b5f', -.45, cy - H / 2 - .0, .12); add(G.cyl(.03, .035, .12, 8), LEAF2, -.45, cy - H / 2 + .1, .12);
    add(G.cyl(.03, .03, .1, 10), '#e8414e', .4, cy - H / 2 - .0, .13);
    add(G.cyl(.04, .04, W + .1, 12), '#e9e2d4', 0, cy + H / 2 + .06, .12, 0, 0, HP); add(G.box(W, .32, .01, .004), '#eae4d8', 0, cy + H / 2 - .12, .13);
  }));
  const gl = mesh(new THREE.PlaneGeometry(W, H), basic(rainTex()), { cast: false }); put(gl, 0, cy, .02); f.add(gl);
  f.spot('on', null, .1, cy - H / 2 - .03, .14, { maxH: .2, label: '비 오는 창턱', scale: .65 });
};

// ── 포스터 (wall, span 1): a framed print, slightly crooked, with a sticky note on its corner
B.otakuposter = (f, T, o = {}) => {
  const k = o.kind || 0, y = o.y || 1.75;
  f.add(mc('otakuposter|' + k + '|' + y, ({ add }) => { add(G.box(.6, .82, .02, .01), WHITE, 0, y, .012, 0, 0, (k - 1) * .04); add(G.box(.1, .1, .006, .004), ['#ffe14d', '#ff9fb8', '#8fd3f4'][k % 3], .25, y + .36, .03, 0, 0, .2); }));
  const pl = mesh(new THREE.PlaneGeometry(.54, .76), lit(posterTex(k)), { cast: false }); put(pl, 0, y, .025); pl.rotation.z = (k - 1) * .04; f.add(pl);
};

// the token for the prize arcade (a gadget: picked up, it goes into the cabinet's slot)
export const OTAKU_ITEMS = { gametoken: { name: '오락실 코인', h: .03, flat: true, noCollect: true, build() {
  const g = grp();
  g.add(mesh(new THREE.CylinderGeometry(.05, .05, .012, 22), mat('#d9b25c', { metal: .5, rough: .35 }))); g.children[0].position.y = .006;
  g.add(put(mesh(new THREE.TorusGeometry(.038, .004, 4, 22), mat('#b8903a')), 0, .013, 0, HP, 0, 0));
  g.add(put(mesh(new THREE.BoxGeometry(.03, .003, .012), mat('#8a6a2a')), 0, .013, 0)); g.add(put(mesh(new THREE.BoxGeometry(.012, .003, .03), mat('#8a6a2a')), 0, .013, 0));
  return g;
} } };
export const OTAKU_BUILDERS = B;
export const OTAKU_INFO = {
  arcade3: { w: 1, d: 1, name: '레트로 오락기', price: 380, region: 'apt' },
  crtset: { w: 2, d: 1, name: '브라운관 TV 세트', price: 300, region: 'apt' },
  mangashelf: { w: 1, d: 1, name: '만화책장', price: 240, region: 'apt' },
  figurecase: { w: 1, d: 1, name: '피규어 진열장', price: 320, region: 'apt' },
  drawerstairs: { w: 1, d: 2, name: '서랍 계단', hidden: true },
  loftpulley: { w: 1, d: 1, name: '다락 바구니 도르래', hidden: true },
  pdrawers: { w: 1, d: 1, name: '플라스틱 서랍장', price: 90, region: 'apt' },
  gamerack: { w: 1, d: 1, name: '게임 상자 선반', price: 160, region: 'apt' },
  floormess: { w: 1, d: 1, name: '벗어 둔 것들', hidden: true, small: true },
  otakufuton: { w: 1, d: 2, name: '너굴이 이불', hidden: true },
  loftnest: { w: 1, d: 1, name: '다락 둥지', hidden: true, small: true },
  otakushelf: { wall: true, span: 1, name: '만화 벽 선반', price: 90, region: 'apt' },
  otakuframes: { wall: true, span: 1, name: '액자 모음', price: 70, region: 'apt' },
  fairylights: { wall: true, span: 4, name: '꼬마전구', price: 80, region: 'apt' },
  rainwin: { wall: true, span: 2, name: '비 오는 창', hidden: true },
  otakuposter: { wall: true, span: 1, name: '애니 포스터', price: 60, region: 'apt' },
};

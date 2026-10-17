// 박사님의 비밀 서재 — the showcase incident room (2026-10-18; plan agreed with the user 10/17: "책등 그림 맞추기 → 책장 이동
// → 구슬 굴러감 → 비밀 공간 → 친구"). One piece of furniture carries the whole chain:
//   secretshelf (2×1): a tall honey bookcase standing on a brass floor rail over the left tile. Its middle shelf holds five
//     picture books whose spines make one rainbow when they stand in the right order — one of them is missing (it is
//     somewhere in the room). Put it back, set the spines right, and the case rolls along the rail to the right tile.
//     Behind it: a built-in arched cupboard in the wall with a marble run above it. The marble rolls down the zigzag,
//     drops into a cup on the latch, the latch flips and the little door swings open — that's where the friend hid.
// Parts: [0] the case (kind 'slide', lock 'spine'), [1] the arched door (kind 'door', lock 'marble').
// f.spines = { draw(order, missing, glow) } repaints the five spines; f.marbleRun(tw, sfx) plays the run (a promise).
import * as THREE from 'three';
import { put, grp, mat, mesh } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const WOOD = '#e9b77c', WOODD = '#b97a45', BACK = '#ffe9c9', BRASS = '#e2b448', BRASS2 = '#b98a2e', DARK = '#3a2a40';
const B = {};

// ── the rainbow picture across five spines ──────────────────────────────────────────────────────────────────────────
// slice k of the picture is book k; order[slot] = which book stands in that slot
export const SPINE_N = 5;
const PW = 320, PH = 200;
let PIC = null;
export function spinePicture() {
  if (PIC) return PIC;
  const c = document.createElement('canvas'); c.width = PW; c.height = PH;
  const x = c.getContext('2d');
  x.fillStyle = '#fff6e6'; x.fillRect(0, 0, PW, PH);
  // the rainbow: one big arc over all five books
  const bands = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'];
  const cx = PW / 2, cy = PH * 1.02, R0 = PW * .47;
  bands.forEach((col, i) => { x.strokeStyle = col; x.lineWidth = 15; x.beginPath(); x.arc(cx, cy, R0 - i * 14, PI, 0); x.stroke(); });
  // clouds at the feet, a smiling sun in the middle
  const cloud = (px, py, s) => { x.fillStyle = '#ffffff'; for (const [dx, dy, r] of [[-18, 4, 16], [0, -6, 20], [18, 4, 16], [0, 8, 16]]) { x.beginPath(); x.arc(px + dx * s, py + dy * s, r * s, 0, 7); x.fill(); } };
  cloud(36, PH - 22, 1.15); cloud(PW - 36, PH - 22, 1.15);
  x.fillStyle = '#ffd43b'; x.beginPath(); x.arc(cx, PH * .62, 22, 0, 7); x.fill();
  x.strokeStyle = '#ffd43b'; x.lineWidth = 4; for (let k = 0; k < 8; k++) { const a = k * PI / 4; x.beginPath(); x.moveTo(cx + Math.cos(a) * 28, PH * .62 + Math.sin(a) * 28); x.lineTo(cx + Math.cos(a) * 36, PH * .62 + Math.sin(a) * 36); x.stroke(); }
  x.fillStyle = '#5a3d2e'; for (const s of [-1, 1]) { x.beginPath(); x.arc(cx + s * 7, PH * .6, 2.6, 0, 7); x.fill(); }
  x.strokeStyle = '#5a3d2e'; x.lineWidth = 2.4; x.beginPath(); x.arc(cx, PH * .63, 7, .2, PI - .2); x.stroke();
  // little stars between the bands' ends
  x.fillStyle = '#ffd43b'; for (const [px, py] of [[60, 40], [262, 46], [150, 22], [104, 70], [214, 74]]) { x.beginPath(); for (let k = 0; k < 10; k++) { const a = -HP + k * PI / 5, r = k % 2 ? 3 : 7; x.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r); } x.fill(); }
  PIC = c;
  return c;
}
// paint the spines: each slot a book — cloth edge, gold bands, the picture slice in between; an empty slot is the shelf's
// shadowy back
function paintSpines(x, w, h, order, missing, glow) {
  const pic = spinePicture(), sw = w / SPINE_N, ps = PW / SPINE_N;
  x.clearRect(0, 0, w, h);
  for (let s = 0; s < SPINE_N; s++) {
    const id = order[s], X = s * sw;
    if (id === missing) { x.fillStyle = '#6b4a3a'; x.fillRect(X, 0, sw, h); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(X, 0, sw, h * .12); continue; }
    x.drawImage(pic, id * ps, 0, ps, PH, X + 3, h * .1, sw - 6, h * .8);
    x.fillStyle = '#c0504d'; x.fillRect(X, 0, sw, h * .1); x.fillRect(X, h * .9, sw, h * .1);   // cloth top and bottom
    x.fillStyle = '#ffd43b'; x.fillRect(X + 4, h * .1 - 5, sw - 8, 3); x.fillRect(X + 4, h * .9 + 2, sw - 8, 3);
    x.fillStyle = 'rgba(60,30,30,.55)'; x.fillRect(X, 0, 2, h); x.fillRect(X + sw - 2, 0, 2, h);   // the gap between books
  }
  if (glow) { x.fillStyle = 'rgba(255,240,170,.35)'; x.fillRect(0, 0, w, h); }
}

// 비밀 책장 (2×1)
B.secretshelf = (f, T) => {
  const W = .94, H = 2.0, D = .38, ZW = -.5, z0 = ZW + .26 + D / 2;   // the case stands just in front of the cupboard
  const back = z0 - D / 2, levels = [.08, .55, 1.02, 1.5];
  // ── the brass rail along both tiles (it's on the floor in plain sight: a hint that the case goes somewhere)
  f.add(mc('secretshelf-rail', ({ add }) => {
    for (const dz of [-.12, .12]) add(G.box(1.96, .025, .04, .008), BRASS, 0, .0125, z0 + dz);
    for (const sx of [-.98, .98]) add(G.box(.05, .05, .32, .01), BRASS2, sx, .025, z0);
    for (let k = -4; k <= 4; k++) add(G.box(.02, .012, .3, .004), BRASS2, k * .22, .006, z0);
  }));
  // ── the cupboard in the wall behind the case (fixed)
  const AW = .8, AH = 1.22, AD = .24, ax = -.5, az = ZW + AD / 2;
  f.add(mc('secretshelf-nook', ({ add }) => {
    add(G.box(AW + .12, AH + .1, AD, .02), '#d9a066', ax, (AH + .1) / 2, az);
    add(G.pbox(AW - .04, AH - .06, .02), DARK, ax, AH / 2, az + AD / 2 - .01);   // seen through the open door
    add(G.box(AW + .2, .06, AD + .06, .015), WOODD, ax, AH + .12, az + .02);
  }));
  // a soft cushion and a lantern inside: somebody has been hiding here before
  f.add(mc('secretshelf-den', ({ add }) => {
    add(G.box(.5, .08, .16, .03), '#ff9fb5', ax, .06, az + .02);
    add(G.cyl(.04, .05, .1, 10), BRASS, ax + .28, .07, az, 0, 0, 0);
    add(G.sph(.035, 10, 8), '#fff3b0', ax + .28, .14, az);
  }));
  // the arched door (hinged on the left)
  const DW = AW - .06, DH = AH - .08, dz = ZW + AD + .012;
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(DW, 0); sh.lineTo(DW, DH - DW / 2); sh.absarc(DW / 2, DH - DW / 2, DW / 2, 0, PI, false); sh.lineTo(0, 0);
  const dv = grp(); put(dv, ax - DW / 2, .04, dz); f.add(dv);
  dv.add(mc('secretshelf-door', ({ add }) => {
    add(G.ext(sh, .04, .008, 14), '#8fd6bd', 0, 0, -.02);
    for (const yy of [.3, .62]) add(G.box(DW * .7, .02, .012, .004), '#6cbfa3', DW / 2, yy, .026);
    add(G.sph(.035, 12, 10), BRASS, DW - .1, .5, .04);
    // a little star window
    add(G.cyl(.09, .09, .02, 16), '#fff3b0', DW / 2, DH - DW / 2, .02, HP, 0, 0);
  }));
  const pd = f.part('door', dv, t => { dv.rotation.y = -1.9 * t; }, { label: '비밀 문', sfx: 'door', dur: .45 });
  pd.secret = true;
  const sd = f.spot('inside', null, ax, .12, az + .02, { part: pd, maxH: .8, label: '비밀 공간 안', scale: .8 });
  sd.reserved = true;   // only the friend hides here
  // ── the marble run on the wall above the cupboard (fixed), ending in a cup on the latch
  const RUN = [[-.9, 1.92], [-.14, 1.78], [-.86, 1.62], [-.22, 1.47]], rz = ZW + .05;
  f.add(mc('secretshelf-run', ({ add, tube }) => {
    for (let i = 0; i < RUN.length - 1; i++) {
      const [x1, y1] = RUN[i], [x2, y2] = RUN[i + 1];
      tube([x1, y1 - .03, rz], [x2, y2 - .03, rz], .012, WOODD, 6);
      tube([x1, y1 - .03, rz + .04], [x2, y2 - .03, rz + .04], .012, WOODD, 6);
      add(G.box(.03, .05, .06, .008), WOOD, x2, y2 - .05, rz + .02);
    }
    add(G.box(.08, .05, .07, .01), WOOD, RUN[0][0] - .04, RUN[0][1] - .04, rz + .02);
    tube([-.07, 1.32, rz + .03], [-.07, .66, ZW + AD + .03], .008, BRASS2, 6);   // the rod from the cup down to the latch
  }));
  const marble = mesh(new THREE.SphereGeometry(.05, 16, 12), mat('#3d8bff', { rough: .2, emissive: '#3d8bff', ei: .35 }));
  marble.userData.noMerge = true; put(marble, RUN[0][0], RUN[0][1] + .01, rz + .02); f.add(marble);
  const cupPv = grp(); put(cupPv, -.1, 1.36, rz + .03); f.add(cupPv);
  const cup = mesh(new THREE.CylinderGeometry(.055, .04, .07, 14, 1, true), mat(BRASS, { side: THREE.DoubleSide }));
  cup.userData.noMerge = true; put(cup, 0, 0, 0); cupPv.add(cup);
  const latch = mesh(new THREE.BoxGeometry(.18, .03, .03), mat(BRASS2)); latch.userData.noMerge = true;
  // a bolt across the door's right edge; it swings up when the cup tips
  const latchPv = grp(); put(latchPv, -.07, .62, dz + .03); latchPv.add(put(latch, -.08, 0, 0)); f.add(latchPv);
  // ── the case itself: one moving part, sliding right along the rail
  const sv = grp(); put(sv, -.5, 0, 0); f.add(sv);
  sv.add(mc('secretshelf-case', ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.045, H, D, .01), WOOD, sx * (W / 2 - .0225), H / 2, z0);
    add(G.pbox(W - .09, H - .08, .015), BACK, 0, H / 2, back + .01);
    for (const y of levels) add(G.box(W - .09, .035, D - .03, .006), WOOD, 0, y - .0175, z0 + .01);
    add(G.box(W + .05, .05, D + .04, .012), WOODD, 0, H + .025, z0 + .01);
    for (const sx of [-1, 1]) add(G.cyl(.035, .035, .03, 12), BRASS2, sx * .34, .03, z0, HP, 0, 0);   // wheels on the rail
    // ordinary books on the other shelves
    const cols = ['#ff8f7a', '#8fd3f4', '#ffd23f', '#9be38f', '#c9a7ff', '#ffb07a', '#7fb7ff', '#ff9fb5'];
    let k = 0;
    for (const li of [0, 1, 3]) {
      let x0 = -.4;
      while (x0 < .38) {
        if (li !== 3 && x0 > .02 && x0 < .3) { x0 = .32; continue; }   // a gap where something can sit
        const w = .06 + ((k * 37) % 5) * .01, h = .22 + ((k * 53) % 7) * .02;
        if (x0 + w > .41) break;
        add(G.box(w, h, .22, .008), cols[k % cols.length], x0 + w / 2, levels[li] + h / 2, back + .14);
        x0 += w + .008; k++;
      }
    }
    // a globe and an owl lamp on top
    add(G.sph(.12, 16, 12), '#7fb7ff', -.22, H + .2, z0); add(G.cyl(.03, .07, .08, 12), WOODD, -.22, H + .09, z0);
    add(G.sph(.09, 12, 10), '#d9a066', .24, H + .14, z0); add(G.sph(.03, 8, 6), '#ffffff', .2, H + .17, z0 + .08); add(G.sph(.03, 8, 6), '#ffffff', .28, H + .17, z0 + .08);
  }));
  // the five picture books on the middle shelf: boxes plus one painted strip for the spines
  const BW = .14, BH = .3, BD = .22, y0 = levels[2], bx0 = -BW * 2;
  const books = [];
  for (let s = 0; s < SPINE_N; s++) {
    const b = mesh(new THREE.BoxGeometry(BW - .008, BH, BD), mat('#c0504d'));
    b.userData.noMerge = true; put(b, bx0 + s * BW, y0 + BH / 2, back + .03 + BD / 2); sv.add(b); books.push(b);
  }
  const cw = 320, ch = 96;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const strip = mesh(new THREE.PlaneGeometry(BW * SPINE_N, BH), mat('#ffffff', { map: tex }), { cast: false });
  strip.userData.noMerge = true; put(strip, 0, y0 + BH / 2, back + .03 + BD + .004); sv.add(strip);
  f.spines = {
    draw(order, missing = -1, glow = false) {
      paintSpines(cv.getContext('2d'), cw, ch, order, missing, glow); tex.needsUpdate = true;
      order.forEach((id, s) => { books[s].visible = id !== missing; });
    },
  };
  const ps = f.part('slide', sv, t => { sv.position.x = -.5 + t; }, { label: '비밀 책장', sfx: 'door', dur: .9 });
  ps.secretShelf = true;
  f.spot('on', sv, .17, levels[0], z0 + .03, { maxH: .4, label: '책장 아래칸', scale: .8 });
  f.spot('on', sv, .17, levels[1], z0 + .03, { maxH: .4, label: '책장 둘째 칸', scale: .8 });
  f.spot('on', sv, .2, H + .05, z0, { maxH: .3, label: '책장 위', scale: .7 });
  // ── the run: the marble rolls the zigzag, drops into the cup, the cup tips the latch
  f.marbleRun = async (tw, sfx) => {
    for (let i = 0; i < RUN.length - 1; i++) {
      const [x1, y1] = RUN[i], [x2, y2] = RUN[i + 1], len = Math.hypot(x2 - x1, y2 - y1);
      await tw.run(.18 + len * .55, k => { marble.position.set(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k + .01, rz + .02); marble.rotation.z -= .3; }, k => k * k * (1.6 - .6 * k));
      sfx('tock', 2 + i);
    }
    const [xe, ye] = RUN[RUN.length - 1];
    await tw.run(.3, k => { marble.position.set(xe + (-.1 - xe) * k, ye - (ye - 1.38) * k * k, rz + .02 + .01 * k); });
    sfx('pop', 3);
    await tw.run(.3, k => { cupPv.rotation.z = -.5 * k; cupPv.position.y = 1.36 - .05 * k; latchPv.rotation.z = -1.3 * k; marble.position.y = 1.38 - .07 * k; });
    sfx('unlock');
  };
};

// ── 아파트 장치판 '로봇청소기 대소동' (2026-10-18, user: "아파트 장치판도 만들어주고") ─────────────────────────────────
// robovacgo (1×1): the living room's robot vacuum, but the robot is its own moving part — with its remote it sets off, goes
//   under the sofa and comes back out with the key on its lid (part kind 'robot', p.robotVac; f.robot is the robot group,
//   f.keySpot the spot on its lid where the key rides).
// ceilrack (1×1, against a wall): a 천장 빨래건조대 — two bars hung on cords from ceiling brackets, laundry and a big
//   striped blanket over them; a crank box on the wall. With the crank it winds down (part kind 'rack', p.dryRack) and
//   whoever is wrapped in the blanket tumbles out.
const INK = '#2a1d33', WHITE = '#ffffff', STEEL = '#c9cfe0', STEEL2 = '#a9b2c8', MINT = '#7fd6c0', DARKG = '#5b5672';
B.robovacgo = (f, T) => {
  const acc = (T && T.accent) || '#a9d8b8', R = .22, cz = .05;
  f.add(mc('robovacgo-dock|' + acc, ({ add }) => {
    add(G.box(.34, .17, .08, .035), WHITE, 0, .085, -.42);
    add(G.box(.34, .02, .12, .008), '#e2e6ee', 0, .01, -.33);
    add(G.sph(.014, 8, 6), MINT, 0, .13, -.38 + .006, 0, 0, 0, [1, 1, .5]);
    add(G.pbox(.1, .012, .006), STEEL2, 0, .06, -.38 + .007);
  }));
  const rb = grp(); put(rb, 0, 0, cz); f.add(rb);
  rb.add(mc('robovacgo-bot|' + acc, ({ add }) => {
    add(G.cyl(R - .012, R - .02, .012, 30), DARKG, 0, .006, 0);
    add(G.cyl(R, R, .06, 32), WHITE, 0, .042, 0);
    add(G.tor(R + .004, .016, PI, 5, 22), '#d4d9e6', 0, .038, 0, HP, 0, 0);
    add(G.cyl(R - .03, R - .03, .016, 32), '#eef1f7', 0, .078, 0);
    add(G.tor(R - .03, .007, PI * 2, 4, 32), acc, 0, .086, 0, HP, 0, 0);
    add(G.cyl(.055, .06, .028, 20), STEEL2, 0, .1, -.1);
    // sleepy face on the sensor, looking forward (+z)
    for (const sx of [-1, 1]) add(G.sph(.012, 8, 6), INK, sx * .03, .102, -.1 + .05, 0, 0, 0, [1, 1.2, .45]);
    add(G.tor(.012, .004, PI, 3, 8), INK, 0, .094, -.1 + .055, 0, 0, PI);
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + .3; add(G.pbox(.08, .004, .012), WHITE, .17 + Math.cos(a) * .035, .006, .15 + Math.sin(a) * .035, 0, -a, 0); }
  }));
  // a blinking light that shows it is awake
  const led = mesh(new THREE.SphereGeometry(.018, 10, 8), mat('#ff6b6b', { emissive: '#ff6b6b', ei: .6 })); led.userData.noMerge = true; put(led, -.09, .09, .09); rb.add(led);
  const p = f.part('robot', rb, () => {}, { label: '로봇청소기', sfx: 'tap', dur: .2 });
  p.robotVac = true; p.isGadget = true;
  f.robot = rb; f.robotLed = led;
  f.keySpot = f.spot('on', rb, .05, .086, .02, { maxH: .3, label: '로봇청소기 위', scale: .85 });
  f.keySpot.reserved = true;
};
B.ceilrack = (f, T) => {
  const top = 2.66, hang = 2.42, drop = 1.0, z0 = -.18, L = 1.3;
  const wood = (T && T.wood) || '#eebf86';
  // ceiling brackets on the wall and the crank box
  f.add(mc('ceilrack-fix', ({ add }) => {
    for (const sx of [-1, 1]) { add(G.box(.08, .06, .44, .015), STEEL, sx * L / 2.4, top + .03, -.28); add(G.cyl(.03, .03, .05, 12), STEEL2, sx * L / 2.4, top - .01, z0); }
    add(G.box(.16, .22, .07, .02), '#e8ecf4', .62, 1.25, -.46); add(G.cyl(.03, .03, .03, 14), DARKG, .62, 1.25, -.42, HP, 0, 0);
  }));
  const rk = grp(); put(rk, 0, hang, z0); f.add(rk);
  rk.add(mc('ceilrack-rack|' + wood, ({ add }) => {
    for (const dz of [-.09, .09]) add(G.cyl(.018, .018, L, 12), STEEL, 0, 0, dz, 0, 0, HP);
    for (const sx of [-1, 1]) add(G.box(.04, .04, .22, .01), STEEL2, sx * L / 2.4, .0, 0);
    // laundry: a sage towel, a sky T-shirt, a mustard sock pair
    add(G.box(.26, .4, .02, .01), '#9fd3b0', -.42, -.2, -.09); add(G.box(.26, .02, .2, .006), '#9fd3b0', -.42, 0, 0);
    add(G.box(.28, .3, .02, .01), '#8fd3f4', .44, -.17, .09); add(G.box(.42, .08, .02, .01), '#8fd3f4', .44, -.05, .09);
    add(G.box(.06, .16, .02, .01), '#ffc23d', .2, -.1, -.09); add(G.box(.06, .16, .02, .01), '#ffc23d', .28, -.1, -.09);
    // the big striped blanket over both bars (someone small fits behind it)
    add(G.box(.5, .02, .22, .01), '#ff9fb5', 0, .02, 0);
    for (const dz of [-.11, .11]) add(G.box(.5, .56, .03, .015), '#ff9fb5', 0, -.27, dz);
    for (const dz of [-.128, .128]) for (let k = 0; k < 4; k++) add(G.box(.5, .035, .006, .003), '#ffffff', 0, -.08 - k * .13, dz);
  }));
  // the cords from the brackets to the rack (they stretch as it comes down)
  const cords = [];
  for (const sx of [-1, 1]) { const c = mesh(new THREE.CylinderGeometry(.006, .006, 1, 6), mat('#f4f4f4')); c.userData.noMerge = true; f.add(c); cords.push({ c, x: sx * L / 2.4 }); }
  const setCords = () => { for (const { c, x } of cords) { const len = top - .02 - rk.position.y; c.scale.y = Math.max(.01, len); c.position.set(x, rk.position.y + len / 2, z0); } };
  setCords();
  // the crank, put in once you have found it (hidden till then); it turns while the rack comes down
  const crank = grp(); put(crank, .62, 1.25, -.4); f.add(crank); crank.visible = false;
  const cm = mc('ceilrack-crank', ({ add }) => { add(G.cyl(.012, .012, .1, 8), STEEL2, 0, 0, .05, HP, 0, 0); add(G.box(.12, .02, .02, .006), STEEL2, .05, 0, .1); add(G.cyl(.018, .018, .06, 10), '#ff6b6b', .1, 0, .13, HP, 0, 0); });
  cm.userData.noMerge = true; crank.add(cm);
  f.crank = crank;
  const p = f.part('rack', rk, t => { rk.position.y = hang - drop * t; rk.rotation.z = Math.sin(t * PI) * .04; setCords(); }, { label: '천장 빨래건조대', sfx: 'swish', dur: 1.1 });
  p.dryRack = true;
  const sp = f.spot('inside', rk, 0, -.5, 0, { part: p, maxH: .5, label: '이불 속', scale: .8 });
  sp.reserved = true;
};

export const SHOWCASE_BUILDERS = B;
export const SHOWCASE_INFO = {
  secretshelf: { w: 2, d: 1, name: '비밀 책장', price: 0, hidden: true },
  robovacgo: { w: 1, d: 1, name: '로봇청소기', price: 0, hidden: true },
  ceilrack: { w: 1, d: 1, name: '천장 빨래건조대', price: 0, hidden: true },
};

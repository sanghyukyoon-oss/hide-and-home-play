// 바닷가 가게 (10/20 밤, user ref "이것도 좋다" — "저 맵도 해줘"): a little seaside shop on a cobbled square — a white
// clapboard house under a blue roof with striped awnings and a balcony, a deck on stilts out over the shallows with a
// display counter and a boat alongside, seafood stalls, barrels, parasol tables, a chalkboard and a life-ring clock post.
// Clean and bright: white, sky blue and sand, red and green for accents. Shared toy kit, one merged mesh per piece.
import * as THREE from 'three';
import { put, grp, shade, mat, mesh, geo, canvasTex, texCache, roundRect } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const WHITE = '#fbf8f2', CLAP = '#f1ece4', BLUE = '#3f6fae', BLUE2 = '#5b8fcf', SKY = '#8fd0f0', SAND = '#efd9ae', WOOD = '#d9a466', WOODD = '#a8733f',
  RED = '#ff5d5d', DARK = '#3a3048', GREEN = '#6cbf5a', YEL = '#ffd23f';
const B = {};

// 바닷가 가게 (3×2): two storeys of white clapboard, a steep blue roof with a dormer, blue-and-white awnings over the shop
// window and the door, a balcony with pots on the first floor, a lantern; the door opens
B.seashop = (f, T) => {
  const W = 2.5, D = 1.5, H1 = 1.25, H2 = 1.05, x0 = 0, z0 = -.2, zf = z0 + D / 2, Ht = H1 + H2;
  f.add(mc('seashop', ({ add }) => {
    add(G.box(W + .1, .1, D + .1, .02), '#d6d0c8', x0, .05, z0);
    add(G.box(W, Ht, D, .02), WHITE, x0, .1 + Ht / 2, z0);
    for (let k = 0; k < 14; k++) add(G.pbox(W + .012, .012, D + .012), shade(CLAP, -.05), x0, .22 + k * .16, z0);   // clapboard lines
    for (const s of [-1, 1]) add(G.box(.08, Ht + .02, .08, .01), '#ffffff', x0 + s * W / 2, .1 + Ht / 2, zf);
    // the roof: steep, blue slate, overhanging; ridge along x; a dormer on the front slope
    const rh = 1.0, half = D / 2 + .2, slope = Math.atan2(rh, half), len = Math.hypot(rh, half), y1 = .1 + Ht;
    for (const s of [-1, 1]) {
      add(G.box(W + .3, .08, len + .05, .02), BLUE, x0, y1 + rh / 2, z0 + s * half / 2, s * slope, 0, 0);
      for (let k = 1; k < 5; k++) add(G.box(W + .31, .02, .03, .01), shade(BLUE, -.18), x0, y1 + rh * (1 - k / 5) + .05, z0 + s * half * k / 5, s * slope, 0, 0);
    }
    add(G.box(W + .34, .08, .1, .02), shade(BLUE, -.25), x0, y1 + rh + .02, z0);
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { const wz = D * (1 - k / 6); add(G.pbox(.05, rh / 6, wz), WHITE, x0 + s * (W / 2 - .025), y1 + (k + .5) * rh / 6, z0); }
    // dormer
    add(G.box(.55, .5, .5, .02), WHITE, x0 - .45, y1 + .38, z0 + .35); add(G.box(.32, .3, .02, .02), SKY, x0 - .45, y1 + .38, z0 + .61); add(G.pbox(.02, .3, .02), '#ffffff', x0 - .45, y1 + .38, z0 + .63);
    for (const s of [-1, 1]) add(G.box(.36, .05, .45, .02), BLUE2, x0 - .45 + s * .15, y1 + .72, z0 + .35, 0, 0, -s * .7);
    // a chimney
    add(G.box(.22, .5, .22, .02), WHITE, x0 + .85, y1 + .85, z0 - .2); add(G.box(.28, .06, .28, .02), '#d6d0c8', x0 + .85, y1 + 1.1, z0 - .2);
    // ground floor: a big shop window on the left, the door on the right
    add(G.box(1.0, .75, .03, .02), SKY, x0 - .6, .62, zf + .01); add(G.pbox(.02, .75, .02), '#ffffff', x0 - .6, .62, zf + .03); add(G.box(1.06, .06, .08, .01), '#ffffff', x0 - .6, .25, zf + .04);
    add(G.box(.5, .9, .02, .02), '#3a2f3e', x0 + .65, .55, zf + .005);
    add(G.box(.06, .14, .1, .02), DARK, x0 + .3, 1.15, zf + .06); add(G.box(.1, .14, .1, .03), YEL, x0 + .3, 1.04, zf + .12);
    // awnings: blue-and-white stripes, sloping out over the window and the door
    const awn = (cx, w) => { const n = Math.round(w / .16); for (let k = 0; k < n; k++) add(G.box(w / n, .04, .55, .006), k % 2 ? '#ffffff' : BLUE2, cx - w / 2 + (k + .5) * w / n, 1.3, zf + .27, .45, 0, 0);
      for (let k = 0; k < n; k++) add(G.cone(w / n * .55, .08, 3), k % 2 ? '#ffffff' : BLUE2, cx - w / 2 + (k + .5) * w / n, 1.15, zf + .52, PI, 0, 0, [1, 1, .15]); };
    awn(x0 - .6, 1.15); awn(x0 + .65, .7);
    // first floor: two windows and a balcony with pots
    for (const x of [-.6, .65]) { add(G.box(.42, .5, .03, .02), SKY, x0 + x, 1.95, zf + .01); add(G.pbox(.42, .02, .02), '#ffffff', x0 + x, 1.95, zf + .03); add(G.pbox(.02, .5, .02), '#ffffff', x0 + x, 1.95, zf + .03); }
    add(G.box(1.5, .05, .42, .01), WOOD, x0 - .2, 1.55, zf + .21);
    add(G.box(1.5, .04, .04, .01), '#ffffff', x0 - .2, 1.85, zf + .41);
    for (let k = 0; k <= 10; k++) add(G.pbox(.025, .28, .025), '#ffffff', x0 - .95 + k * .15, 1.71, zf + .41);
    for (const [x, c] of [[-.75, RED], [-.35, GREEN], [.1, '#ffb3cf'], [.4, GREEN]]) { add(G.cyl(.07, .055, .1, 10), '#d98b5f', x0 + x, 1.63, zf + .25); add(G.sph(.08, 8, 6), c, x0 + x, 1.73, zf + .25); }
  }));
  const dv = grp(); put(dv, x0 + .4, .1, zf + .02); f.add(dv);
  dv.add(mc('seashop-door', ({ add }) => {
    add(G.box(.48, .88, .04, .02), BLUE2, .24, .44, 0);
    add(G.box(.3, .34, .01, .02), SKY, .24, .62, .025); add(G.sph(.025, 8, 6), YEL, .42, .42, .03);
  }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.6 * t; }, { label: '가게 문', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, x0 + .65, .12, z0 + .2, { part: p, maxH: .4, label: '가게 안', scale: .85 }), zf);
  f.spot('on', null, x0 - .6, .3, zf + .06, { maxH: .2, label: '진열창 앞 턱', scale: .55 });
  f.spot('on', null, x0 + .2, 1.58, zf + .25, { maxH: .25, label: '발코니 화분 사이', scale: .6 });
};

// 데크 (3×2): a wooden deck on stilts out over the shallows — a glass display counter (its lid lifts), a till, a barrel of
// lemons, a pot of herbs; steps down to the sand at its front; bunting on a pole; a rowboat tied alongside
B.seadeck = (f, T, o = {}) => {
  const y = .4, dev = !!o.device;   // (o.device: 30판 ★ — flagdeck brings its own flagpole and boat)
  f.add(mc('seadeck', ({ add, tube }) => {
    for (let k = 0; k < 11; k++) add(G.box(.27, .05, 2.0, .01), k % 2 ? WOOD : shade(WOOD, .05), -1.35 + k * .27, y, 0);
    add(G.box(3.0, .08, .08, .01), WOODD, 0, y - .06, -.98); add(G.box(3.0, .08, .08, .01), WOODD, 0, y - .06, .98);
    for (const x of [-1.4, -.3, .8]) for (const z of [-.95, .95]) add(G.cyl(.06, .06, y + .2, 10), WOODD, x, (y - .2) / 2, z);
    // the steps down at the front right
    // the steps down (3차 10/21: solid treads on two stringers, posts with a rope rail — the white side boards read as loose
    // panels floating on the water)
    for (let k = 0; k < 3; k++) { add(G.box(.62, .05, .24, .01), k % 2 ? WOOD : shade(WOOD, .05), 1.2, y - .1 - k * .13, 1.1 + k * .22); add(G.box(.6, .1, .03, .01), WOODD, 1.2, y - .15 - k * .13, 1.22 + k * .22); }
    for (const sx of [-1, 1]) { add(G.box(.05, .1, .78, .01), WOODD, 1.2 + sx * .32, y - .2, 1.31, -.52, 0, 0);
      for (const t of [0, 1]) add(G.cyl(.03, .03, .5, 8), WOODD, 1.2 + sx * .32, y + .15 - t * .38, 1.05 + t * .62);
      tube([1.2 + sx * .32, y + .4, 1.05], [1.2 + sx * .32, y + .02, 1.67], .012, '#e9d9b8', 4); }
    // the bunting pole at the back left
    if (!dev) add(G.cyl(.03, .03, 1.6, 8), '#ffffff', -1.4, y + .8, -.9);
    if (!dev) for (let k = 0; k < 6; k++) { const t = (k + .5) / 6; tube([-1.4 + t * 1.4, y + 1.5 - Math.sin(t * PI) * .15, -.9], [-1.4 + t * 1.4, y + 1.5 - Math.sin(t * PI) * .15 - .001, -.9], .002, DARK, 3);
      add(G.cone(.06, .12, 3), [RED, YEL, BLUE2, '#ffffff'][k % 4], -1.4 + t * 1.4, y + 1.42 - Math.sin(t * PI) * .15, -.9, PI, 0, 0, [1, 1, .2]); }
    if (!dev) tube([-1.4, y + 1.55, -.9], [0, y + 1.5, -.9], .006, DARK, 4);
    // the counter and till
    add(G.box(1.1, .55, .45, .02), WHITE, -.6, y + .3, -.35); add(G.box(1.14, .05, .5, .01), BLUE2, -.6, y + .58, -.35);
    add(G.box(.26, .16, .2, .02), '#cfd6e4', .1, y + .66, -.38); add(G.box(.2, .08, .02, .01), DARK, .1, y + .72, -.27);
    // a barrel of lemons, a pot of herbs
    add(G.cyl(.18, .16, .4, 14), WOODD, .55, y + .2, .3); for (let k = 0; k < 6; k++) add(G.sph(.055, 8, 6), YEL, .55 + Math.cos(k) * .09, y + .43, .3 + Math.sin(k) * .09);
    add(G.cyl(.12, .1, .2, 12), '#d98b5f', -1.2, y + .1, .6); add(G.sph(.15, 10, 7), GREEN, -1.2, y + .28, .6);
  }));
  // the display case on the counter: a glass lid that lifts over red and orange things on ice
  f.add(mc('seadeck-case', ({ add }) => {
    add(G.box(.9, .06, .38, .01), '#e9f4fa', -.6, y + .63, -.35);
    for (const [x, c] of [[-.9, RED], [-.7, '#ff9b6b'], [-.5, RED], [-.3, '#ffb3c4']]) add(G.cap(.04, .12, 2, 6), c, x - .0, y + .69, -.35, 0, 0, HP);
  }));
  const lid = grp(); put(lid, -.6, y + .66, -.54); f.add(lid);
  lid.add(mc('seadeck-case-lid', ({ add }) => { add(G.box(.92, .2, .02, .01), '#cfe9f5', 0, .1, .0); add(G.box(.92, .02, .4, .01), '#cfe9f5', 0, .2, .2); }));
  const p = f.part('lift', lid, t => { lid.rotation.x = -1.1 * t; }, { label: '진열 쇼케이스', sfx: 'lift', dur: .3 });
  f.spot('inside', null, -.6, y + .66, -.35, { part: p, maxH: .12, label: '쇼케이스 안', scale: .55 });
  f.spot('under', null, -.3, y - .38, .4, { maxH: .3, label: '데크 밑', scale: .8 });
  f.spot('beside', null, .82, y + .03, .3, { maxH: .3, label: '레몬 통 옆', scale: .7 });
  if (dev) return;
  // the rowboat tied alongside, afloat at the deck's left (it lies over the shallows)
  f.add(mc('seadeck-boat', ({ add, tube }) => {
    const bx = -.55, bz = 1.75, by = 0, HULL = '#c9844e';   // (in the shallows in front of the deck)
    const bowl = r => new THREE.SphereGeometry(r, 20, 8, 0, PI * 2, HP, HP);
    add(bowl(.5), HULL, bx, by + .24, bz, 0, 0, 0, [1.7, .7, .6]);
    add(G.cyl(.46, .46, .03, 24), shade(HULL, .3), bx, by + .12, bz, 0, 0, 0, [1.6, 1, .53]);
    add(G.cyl(.47, .47, .08, 24, true), shade(HULL, .15), bx, by + .2, bz, 0, 0, 0, [1.66, 1, .57]);
    add(G.tor(.5, .03, PI * 2, 6, 28), shade(HULL, -.15), bx, by + .24, bz, HP, 0, 0, [1.7, .6, 1]);
    add(G.box(.08, .04, .5, .01), WOOD, bx - .2, by + .19, bz); add(G.box(.08, .04, .5, .01), WOOD, bx + .35, by + .19, bz);
    add(G.box(.26, .2, .26, .03), '#4a4256', bx - .62, by + .3, bz); add(G.cyl(.05, .05, .2, 8), '#4a4256', bx - .62, by + .34, bz + .15, HP, 0, 0);
    tube([-.3, y, .98], [bx + .5, by + .26, bz - .1], .012, '#e9d9b8', 4);
  }));
  f.spot('inside', null, -.5, .14, 1.75, { maxH: .2, label: '보트 안', scale: .75 });
};

// hand-drawn boards (10/22 밤 사용자 "뭔지 모를": the price board and the chalk menu were bare bars) — doodles and digits only, so
// they read the same in both languages
const TXS = texCache();
const fishDoodle = (c, x, y, s, col) => { c.strokeStyle = col; c.lineWidth = 2.2; c.beginPath(); c.ellipse(x, y, 14 * s, 7 * s, 0, 0, 7); c.moveTo(x + 13 * s, y); c.lineTo(x + 22 * s, y - 6 * s); c.lineTo(x + 22 * s, y + 6 * s); c.closePath(); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(x - 7 * s, y - 1.5 * s, 1.6 * s, 0, 7); c.fill(); };
const priceTex = () => TXS.get('fishprice', () => canvasTex(192, 144, (c, w, h) => {
  c.fillStyle = '#fffaf0'; roundRect(c, 3, 3, w - 6, h - 6, 10); c.fill(); c.strokeStyle = '#e8414e'; c.lineWidth = 4; c.stroke();
  fishDoodle(c, 62, 46, 1.6, '#3a7bd5'); c.fillStyle = '#e8414e'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('3,000', w / 2, 102); c.fillStyle = '#ffc23d'; c.beginPath(); c.arc(150, 42, 14, 0, 7); c.fill();
}));
const chalkTex = () => TXS.get('chalkmenu', () => canvasTex(256, 352, (c, w, h) => {
  c.fillStyle = '#2f3a36'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.55)'; c.setLineDash([8, 6]); c.lineWidth = 3; c.strokeRect(12, 12, w - 24, h - 24); c.setLineDash([]);
  fishDoodle(c, 96, 70, 2.2, '#ffffff'); c.strokeStyle = '#ffd86b'; c.lineWidth = 4; c.beginPath(); for (let x = 40; x <= 216; x += 8) c.lineTo(x, 118 + Math.sin(x / 9) * 4); c.stroke();
  c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.strokeRect(70, 160, 46, 44); c.beginPath(); c.arc(116, 182, 11, -1.4, 1.4); c.stroke();
  for (const x of [82, 96, 108]) { c.beginPath(); c.moveTo(x, 152); c.quadraticCurveTo(x + 6, 140, x, 130); c.stroke(); }
  c.fillStyle = '#ffb3c4'; c.font = 'bold 30px sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('1,500', 132, 184);
  c.fillStyle = '#ffffff'; c.fillText('5,000', 132, 76);
  c.fillStyle = '#ffd86b'; for (const [x, y] of [[48, 268], [128, 290], [204, 262]]) { c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 6 : 14, a = k * Math.PI / 5 - Math.PI / 2; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); }
}));

// 해산물 좌판 (2×1): two white crate tables on legs, ice and fish and shrimps in them, a small price board
B.fishstall = (f, T) => {
  f.add(mc('fishstall', ({ add }) => {
    for (const [x, rows] of [[-.48, [[RED, 4], ['#ff9b6b', 4]]], [.48, [['#ff9b6b', 3], [GREEN, 3]]]]) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.05, .48, .05, .01), '#ffffff', x + sx * .38, .24, sz * .26);
      add(G.box(.86, .14, .62, .02), '#ffffff', x, .55, 0, -.15, 0, 0);
      add(G.box(.8, .04, .56, .01), '#e9f4fa', x, .6, 0, -.15, 0, 0);
      // fish lie on their sides: a long body with a darker back, a fan tail, a fin, an eye; the coral rows are curled shrimps
      rows.forEach(([c, n], r) => { for (let k = 0; k < n; k++) {
        const fx = x - .28 + k * .19, fz = -.12 + r * .24, fy = .647 + fz * .149;   // (the ice leans toward the front: rows follow its top)
        if (c === '#ff9b6b') {
          add(G.tor(.045, .022, PI * 1.35, 6, 10), c, fx, fy + .01, fz, HP - .15, 0, .4);
          add(G.cone(.03, .05, 8), shade(c, -.12), fx + .05, fy + .012, fz - .03, 0, 0, -HP, [.3, 1, 1]);
          add(G.sph(.008, 5, 4), '#3b2a2a', fx - .03, fy + .03, fz + .03);
        } else {
          add(G.sph(.06, 12, 8), c, fx, fy, fz, -.15, 0, 0, [1.55, .42, .75]);
          add(G.sph(.06, 10, 6), shade(c, -.2), fx, fy + .008, fz - .022, -.15, 0, 0, [1.35, .4, .42]);
          add(G.cone(.05, .07, 10), shade(c, -.1), fx + .12, fy, fz, -.15, 0, HP, [.28, 1, 1]);
          add(G.cone(.022, .045, 6), shade(c, -.1), fx + .01, fy + .006, fz - .045, -.15, 0, 0, [1.4, 1, .3]);
          add(G.sph(.013, 8, 6), '#ffffff', fx - .065, fy + .022, fz + .01); add(G.sph(.007, 6, 4), '#2a2230', fx - .068, fy + .03, fz + .012);
        }
      } });
      for (const [ix, iz] of [[-.32, .2], [.3, .22], [.05, -.2], [-.12, .23], [.33, -.18]]) add(G.box(.045, .04, .045, .012), '#f5fbff', x + ix, .64 + iz * .149, iz, .3, ix * 4, 0);
    }
    add(G.box(.26, .2, .02, .01), DARK, 0, .85, .22, -.3, 0, 0);
  }));
  // the price card on its stick: a fish and 3,000
  f.add(put(mesh(geo('fishprice-card', () => new THREE.PlaneGeometry(.24, .18)), mat('#ffffff', { map: priceTex() })), 0, .853, .232, -.3, 0, 0));
  f.spot('under', null, -.48, 0, 0, { maxH: .36, label: '좌판 밑', scale: .8 });
  f.spot('under', null, .48, 0, 0, { maxH: .36, label: '좌판 밑', scale: .8 });
};

// 나무 통 (1×1): three barrels, one with a lid that lifts
B.barrels = (f, T) => {
  f.add(mc('barrels', ({ add }) => {
    for (const [x, z, h] of [[-.2, -.15, .5], [.22, -.12, .42]]) { add(G.cyl(.17, .15, h, 14), WOODD, x, h / 2, z); for (const y of [.1, h - .1]) add(G.tor(.165, .012, PI * 2, 4, 16), '#6e5a4e', x, y, z, HP, 0, 0); add(G.cyl(.16, .16, .02, 14), WOOD, x, h, z); }
    add(G.cyl(.15, .13, .38, 14), WOODD, 0, .19, .24); for (const y of [.08, .3]) add(G.tor(.15, .012, PI * 2, 4, 16), '#6e5a4e', 0, y, .24, HP, 0, 0);
  }));
  const lid = grp(); put(lid, 0, .38, .1); f.add(lid);
  lid.add(mc('barrels-lid', ({ add }) => add(G.cyl(.15, .15, .03, 14), WOOD, 0, .015, .14)));
  // a heap of straw inside that comes up to the rim as the lid lifts — a narrow barrel can't be seen into from the side
  // (the front barrel locks: 33판's padlock, 레벨 10/21)
  const up = grp(); put(up, 0, .2, .24); f.add(up);
  up.add(mc('barrels-straw', ({ add }) => { add(G.cyl(.13, .12, .03, 12), '#e8c97a', 0, .015, 0); for (let k = 0; k < 5; k++) add(G.sph(.05, 7, 5), k % 2 ? '#f0d58c' : '#dcb766', Math.cos(k * 1.3) * .07, .03, Math.sin(k * 1.3) * .07, 0, 0, 0, [1, .4, 1]); }));
  const p = f.part('lift', [lid, up], (t, bl, bu) => { lid.rotation.x = -1.3 * t; up.position.y = bu.p.y + .3 * t; }, { label: '나무 통 뚜껑', sfx: 'lift', dur: .28 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: .27, z: .4 };
  f.spot('inside', up, 0, .04, 0, { part: p, maxH: .14, label: '나무 통 안', scale: .55 });
};

// 파라솔 테이블 (1×1): a round café table under a striped parasol, two little stools
B.cafeumbrella = (f, T) => {
  f.add(mc('cafeumbrella', ({ add }) => {
    add(G.cyl(.3, .3, .04, 18), WOOD, 0, .58, 0); add(G.cyl(.03, .04, .58, 8), WOODD, 0, .29, 0); add(G.cyl(.18, .2, .03, 14), WOODD, 0, .015, 0);
    add(G.cyl(.02, .02, 1.5, 8), '#ffffff', 0, 1.1, 0);
    for (let k = 0; k < 8; k++) add(new THREE.ConeGeometry(.62, .32, 3, 1, false, k * PI / 4, PI / 4), k % 2 ? '#ffffff' : SKY, 0, 1.78, 0);   // (eight wedges: the stripes)
    add(G.sph(.04, 8, 6), '#ffffff', 0, 1.96, 0);
    for (const a of [.6, 3.6]) { const x = Math.cos(a) * .42, z = Math.sin(a) * .42; add(G.cyl(.13, .13, .05, 12), RED, x, .38, z); add(G.cyl(.025, .025, .36, 6), WOODD, x, .18, z); }
    add(G.cyl(.06, .05, .08, 10), '#ffffff', .1, .64, .05); add(G.cyl(.05, .05, .02, 10), '#c98a52', .1, .68, .05);
  }));
  f.spot('under', null, 0, 0, 0, { maxH: .5, label: '파라솔 테이블 밑', scale: .8 });
};

// 칠판 메뉴판 (1×1, small): an A-frame chalkboard with doodles
B.chalksign = (f, T) => {
  f.add(mc('chalksign', ({ add }) => {
    for (const s of [-1, 1]) add(G.box(.5, .7, .04, .01), WOOD, 0, .33, s * .12, s * .18, 0, 0);
    add(G.box(.42, .58, .01, .01), '#2f3a36', 0, .35, .145, .18, 0, 0);
  }));
  // the menu in chalk: a fish 5,000, a cup of coffee 1,500, a wavy underline, stars
  f.add(put(mesh(geo('chalkmenu-face', () => new THREE.PlaneGeometry(.4, .55)), mat('#ffffff', { map: chalkTex() })), 0, .35, .151, .18, 0, 0));
  f.spot('behind', null, 0, 0, -.32, { maxH: .3, label: '칠판 뒤', scale: .7 });
};

// 구명 튜브 시계 기둥 (1×1): a white post with a clock on a bracket, a red-and-white life ring hung under it, a lantern
B.ringpost = (f, T) => {
  f.add(mc('ringpost', ({ add, tube }) => {
    add(G.cyl(.06, .07, 2.4, 10), '#ffffff', 0, 1.2, -.1); add(G.cyl(.14, .16, .1, 12), '#d6d0c8', 0, .05, -.1);
    tube([0, 2.2, -.1], [.45, 2.2, -.1], .02, DARK, 6);
    add(G.cyl(.18, .18, .07, 18), '#ffffff', .4, 2.0, -.1, HP, 0, 0); add(G.tor(.18, .025, PI * 2, 6, 18), DARK, .4, 2.0, -.06);
    add(G.pbox(.012, .1, .01), DARK, .4, 2.03, -.04); add(G.pbox(.07, .012, .01), DARK, .43, 2.0, -.04);
    for (let k = 0; k < 8; k++) add(G.tor(.2, .065, PI / 4, 6, 4), k % 2 ? '#ffffff' : RED, 0, 1.45, .0, 0, 0, k * PI / 4);
    add(G.box(.08, .14, .08, .02), DARK, -.3, 1.0, -.1); add(G.box(.06, .1, .06, .02), YEL, -.3, .99, -.1); tube([0, 1.12, -.1], [-.3, 1.12, -.1], .012, DARK, 4);
  }));
  f.spot('behind', null, 0, 0, -.38, { maxH: .35, label: '기둥 뒤', scale: .75 });
};

export const SEASIDE_BUILDERS = B;
export const SEASIDE_INFO = {
  seashop: { w: 3, d: 2, name: '바닷가 가게', price: 900, region: 'shop' },
  seadeck: { w: 3, d: 2, name: '물 위 데크', price: 480, region: 'shop' },
  fishstall: { w: 2, d: 1, name: '해산물 좌판', price: 220, region: 'shop' },
  barrels: { w: 1, d: 1, name: '나무 통', price: 90, region: 'shop' },
  cafeumbrella: { w: 1, d: 1, name: '파라솔 테이블', price: 200, region: 'shop' },
  chalksign: { w: 1, d: 1, name: '칠판 메뉴판', price: 50, region: 'shop' },
  ringpost: { w: 1, d: 1, name: '구명 튜브 시계', price: 160, region: 'shop' },
};

// 기차 객실 (10/21, 28판 '기차 여행' ★장치판 — 고른 그림 gpt-FINAL-B2+B1): half a carriage seen from the open side. Long navy
// benches down both sides (a heater grille under them, one with a drawer), the window wall with three sea-and-mountain windows
// (one under a yellow roll blind), an orange grab rail with hanging handles and a rope-net luggage rack over the benches, a
// ceiling fan near the far end, the end wall with a grey sliding door to the next car, a display board and buttons over it, an
// umbrella on the rail, a lidded snack cart (eggs, cider, banana milk), a newspaper and a cup of noodles on the bench.
import * as THREE from 'three';
import { put, grp, shade, mat, mesh, canvasTex, cutFace, liner } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const NAVY = '#2f4f9a', NAVY2 = '#243d7a', CREAM = '#f6ecd8', CREAM2 = '#eadcc0', GREY = '#a9adb7', GREY2 = '#7d828f', ORANGE = '#f08a3c', ORANGE2 = '#d9702a',
  WHITE = '#ffffff', DARK = '#3a3048', STEEL = '#c3c7d0', YEL = '#f4cf6a', YEL2 = '#e3b247', GREEN = '#3d8a52', BLUE = '#3a7bd5';
const B = {};

// the view through a window: sky, a green headland, the sea with a white village on its shore (one texture, made once)
let VIEW = null;
const viewTex = () => VIEW || (VIEW = canvasTex(256, 160, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9fd3f2'); g.addColorStop(.55, '#d7eefa'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#ffffff'; for (const [x, y, r] of [[40, 30, 14], [56, 26, 18], [74, 32, 12], [190, 22, 12], [204, 18, 15]]) { c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); }
  c.fillStyle = '#8fbf8a'; c.beginPath(); c.moveTo(0, 90); c.quadraticCurveTo(70, 52, 150, 84); c.lineTo(256, 92); c.lineTo(256, 100); c.lineTo(0, 100); c.fill();
  c.fillStyle = '#5fa36a'; c.beginPath(); c.moveTo(0, 100); c.quadraticCurveTo(50, 70, 110, 96); c.lineTo(0, 104); c.fill();
  c.fillStyle = '#3f8fd0'; c.fillRect(0, 100, W, 60); c.fillStyle = '#5aa6e0'; for (let y = 108; y < 160; y += 9) c.fillRect(((y * 37) % 60) - 20, y, 90, 2);
  for (const [x, cl] of [[150, '#fff6ea'], [166, '#ffffff'], [182, '#fff1e2'], [198, '#ffffff']]) { c.fillStyle = cl; c.fillRect(x, 88, 12, 10); c.fillStyle = '#e8724f'; c.fillRect(x - 1, 84, 14, 5); }
  c.fillStyle = '#f2e3c2'; c.fillRect(120, 98, 136, 4);
}));

// (staging.js 28판 '창밖이 흐른다': the one view texture every window shows — null until a window is built)
export const trainView = () => VIEW;

// ── 기차 안 손잡이·봉·우산 (10/22 사용자 실폰 28판: "기차 안 이런 저퀄 모델링들은 좀 변경해 주라" — flat white triangles on
// strips, a plain orange stick, a yellow cone): a steel grab rail on wall brackets, leather straps with a buckle and a round
// ring, a folded umbrella hooked on the rail by its crook. Both cars' racks (trailrack, trailrack2) use these.
const RAIL = '#aab4c4', RAIL2 = '#8590a3', STRAP = '#6b4a3a', RING = '#f5f1e8';   // (a bluish steel: a pale one vanished against the cream walls)
const grabRail = (add, tube, x0, x1, RY, RZ, posts) => {
  tube([x0, RY, RZ], [x1, RY, RZ], .034, RAIL, 12);
  for (const x of [x0, x1]) add(G.sph(.036, 10, 8), RAIL2, x, RY, RZ);
  for (const x of posts) {
    add(G.tor(.036, .01, PI * 2, 6, 14), RAIL2, x, RY, RZ, 0, HP, 0);                     // the collar round the rail
    tube([x, RY + .01, RZ - .02], [x, RY + .2, .14], .018, RAIL2, 8);                     // the arm back to the wall
    tube([x, RY + .2, .14], [x, RY + .26, .05], .018, RAIL2, 8);
    add(G.cyl(.055, .055, .025, 14), RAIL2, x, RY + .27, .02, HP, 0, 0); add(G.cyl(.012, .012, .012, 6), '#7d8696', x, RY + .27, .036, HP, 0, 0);   // the plate on the wall, its bolt
  }
};
const strapHandle = (add, tube, x, RY, RZ, tag) => {
  add(G.tor(.034, .011, PI * 2, 5, 12), STRAP, x, RY, RZ, 0, HP, 0);                     // the strap's loop round the rail
  add(G.box(.034, .28, .009, .004), STRAP, x, RY - .17, RZ + .036);
  add(G.box(.04, .034, .016, .004), RAIL, x, RY - .1, RZ + .038);                          // the buckle
  add(G.box(.022, .012, .018, .002), RAIL2, x, RY - .1, RZ + .045);
  add(G.tor(.062, .015, PI * 2, 8, 18), RING, x, RY - .372, RZ + .036);                   // the round ring
  if (tag) add(G.box(.075, .05, .006, .006), tag, x, RY - .22, RZ + .044);
};
const hungUmbrella = (add, tube, x, RY, RZ, col = '#ffc93a') => {
  add(G.tor(.044, .013, PI, 6, 10), '#8a5a34', x, RY, RZ, 0, HP, 0);                     // the crook over the rail
  tube([x, RY, RZ + .044], [x, RY - .12, RZ + .044], .011, '#8a5a34', 6);
  add(G.cyl(.016, .016, .05, 8), '#8a5a34', x, RY - .14, RZ + .044);
  const P = [[.006, -.6], [.018, -.56], [.036, -.45], [.05, -.3], [.052, -.15], [.032, -.05], [.012, 0]].map(([r, y]) => new THREE.Vector2(r, y));   // (bottom up)
  add(new THREE.LatheGeometry(P, 8), col, x, RY - .16, RZ + .044);
  for (const [dy, a] of [[-.22, .4], [-.3, 2.2], [-.38, 4.1], [-.26, 5.5], [-.44, 1.2]]) add(G.sph(.011, 5, 3), '#ffffff', x + Math.cos(a) * .047, RY - .16 + dy, RZ + .044 + Math.sin(a) * .047);
  add(G.tor(.05, .008, PI * 2, 4, 12), shade(col, -.25), x, RY - .16 - .24, RZ + .044, HP, 0, 0);   // the strap round its folds
  add(G.cone(.007, .05, 6), RAIL, x, RY - .16 - .62, RZ + .044, PI, 0, 0);                  // the steel tip
};

// 긴 벤치 (2×1): a long navy seat with a back against the wall, a grey base with a heater grille; o.drawer: the right half of
// the base is a drawer (the one 너굴이 squeezes into); o.stuff: a newspaper and a cup of noodles on the seat
B.tbench = (f, T, o = {}) => {
  const W = 1.92, D = .62, z0 = -.04, SH = .44;
  f.add(mc('tbench', ({ add }) => {
    add(G.box(W, SH - .12, D - .1, .02), GREY, 0, (SH - .12) / 2, z0 - .02);
    add(G.box(W - .06, .02, .02, .005), GREY2, 0, .04, z0 + D / 2 - .06);
    for (const x of [-.48, .48]) { add(G.box(.7, .12, .02, .006), shade(GREY, -.15), x, .19, z0 + D / 2 - .06); for (let k = 0; k < 5; k++) add(G.box(.62, .012, .01, .003), GREY2, x, .15 + k * .02, z0 + D / 2 - .05); }
    for (const s of [-1, 1]) add(G.box(W / 2 - .03, .14, D, .06), NAVY, s * W / 4, SH - .05, z0);
    add(G.box(W, .5, .14, .06), NAVY2, 0, SH + .2, z0 - D / 2 + .06, -.12, 0, 0);
    add(G.box(W + .04, .05, .18, .02), CREAM2, 0, SH + .47, z0 - D / 2 + .05);
  }));
  if (o.stuff) f.add(mc('tbench-stuff', ({ add }) => {
    add(G.box(.42, .02, .3, .005), '#f4f1ea', .45, SH + .03, z0 - .02, 0, .3, 0); for (let k = 0; k < 4; k++) add(G.box(.3, .005, .015, .002), '#9aa0aa', .45, SH + .042, z0 - .1 + k * .05, 0, .3, 0);
    add(G.cyl(.075, .06, .12, 14), '#ffffff', .82, SH + .08, z0 + .02); add(G.cyl(.077, .077, .03, 14), '#e8574a', .82, SH + .1, z0 + .02); add(G.cyl(.07, .07, .01, 14), '#f2c46a', .82, SH + .145, z0 + .02);
    add(G.cyl(.006, .006, .16, 5), '#e8d9b5', .86, SH + .2, z0 + .04, .3, 0, .2);
  }));
  f.spot('under', null, -.5, .01, z0 + D / 2 + .06, { maxH: .2, label: '벤치 밑', scale: .75 });   // (in front of the base, under the seat's lip — ② 10/21: the old place was inside the base)
  f.spot('on', null, -.2, SH + .02, z0 + .06, { maxH: .35, label: '벤치 위', scale: .85 });
  if (o.drawer) {
    const dv = grp(); put(dv, .48, .17, z0 + D / 2 - .06); f.add(dv);
    dv.add(mc('tbench-drawer', ({ add }) => {
      add(G.box(.72, .2, .03, .01), CREAM, 0, 0, .015); add(G.box(.7, .02, .44, .005), CREAM2, 0, -.09, -.2); for (const sx of [-1, 1]) add(G.box(.02, .18, .44, .005), CREAM2, sx * .34, 0, -.2);
      add(G.cyl(.035, .035, .03, 12), ORANGE, 0, 0, .04, HP, 0, 0);
    }));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .42 * t; }, { label: '벤치 서랍', sfx: 'drawer', dur: .26 });
    p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: .22, y: 0, z: .06, parent: dv };
    f.spot('inside', dv, 0, -.08, -.2, { part: p, maxH: .17, label: '벤치 서랍 안', scale: .85 });
  }
};

// 기차 창 (wall, span 2): a deep window with rounded corners, the sea and hills outside; o.blind: a yellow roll blind that comes
// down (a part — the 'blind' device) with a pull ring; the sill catches small things
B.twindow = (f, T, o = {}) => {
  const W = 1.7, H = .92, cy = 1.42;
  f.add(mc('twindow', ({ add }) => {
    for (const sy of [-1, 1]) add(G.box(W + .16, .08, .1, .03), STEEL, 0, cy + sy * (H / 2 + .04), .05);
    for (const sx of [-1, 1]) add(G.box(.08, H + .16, .1, .03), STEEL, sx * (W / 2 + .04), cy, .05);
    add(G.box(.04, H, .05, .01), STEEL, 0, cy, .04);
    add(G.box(W + .3, .06, .22, .02), CREAM2, 0, cy - H / 2 - .08, .11);
  }));
  const gl = mesh(new THREE.PlaneGeometry(W, H), mat('#ffffff', { map: viewTex(), rough: .5 }), { cast: false }); put(gl, 0, cy, .02); f.add(gl);
  if (!o.blind) f.spot('on', null, .45, cy - H / 2 - .05, .14, { maxH: .22, label: '창턱', scale: .7 });   // (behind a blind the sill is the blind's)
  if (o.blind) {
    f.add(mc('twindow-roll', ({ add }) => { add(G.cyl(.06, .06, W + .1, 14), YEL2, 0, cy + H / 2 + .1, .16, 0, 0, HP); for (const s of [-1, 1]) add(G.box(.04, .14, .1, .01), STEEL, s * (W / 2 + .07), cy + H / 2 + .1, .14); }));
    const bl = grp(); put(bl, 0, cy + H / 2 + .1, .17); f.add(bl);
    bl.add(mc('twindow-blind', ({ add, tube }) => {
      add(G.box(W, 1, .012, .004), YEL, 0, -.5, 0); add(G.box(W + .02, .035, .03, .01), YEL2, 0, -1, 0);
      tube([0, -1, .01], [0, -1.08, .02], .006, '#e0d6c0', 4); add(G.tor(.035, .01, PI * 2, 6, 14), '#ffffff', 0, -1.12, .02);
    }));
    // down = 1 (as drawn), rolled up = 0: the part opens by rolling the blind up
    const p = f.part('lift', bl, (t, b) => { bl.scale.y = Math.max(.06, 1 - .94 * t); }, { label: '롤 블라인드', sfx: 'swish', dur: .4 });
    // (1차: no place behind this blind — too tight to see, ② 10/21; 2차 twindow2 keeps one)
  }
};

// 손잡이 봉·짐 선반 (wall, span 8): the orange grab rail along the whole wall on posts, hanging triangle handles, the rope-net
// luggage rack over the middle with a duffel bag on it (the net lifts — 'net' device), a ceiling fan near the far end and an
// umbrella hooked on the rail
B.trailrack = (f, T) => {
  const L = 7.6, RY = 2.15, RZ = .62;
  // only the rail and the rack are in the way of a lid opening below them — not the box round the fan and the umbrella
  f.collideBox = [-L / 2, RY - .05, 0, L / 2, RY + .5, .7];
  f.add(mc('trailrack|3', ({ add, tube }) => {
    grabRail(add, tube, -L / 2, L / 2, RY, RZ, [-L / 2 + .2, -1.25, 1.25, L / 2 - .2]);
    for (let k = 0; k < 9; k++) { const x = -L / 2 + .55 + k * .82; if (Math.abs(x) < 1.0) continue; strapHandle(add, tube, x, RY, RZ); }
    add(G.cyl(.02, .02, .3, 8), STEEL, L / 2 - .9, RY + .2, RZ + .25); add(G.cyl(.08, .08, .06, 14), STEEL, L / 2 - .9, RY + .03, RZ + .25);
  }));
  // the roof's curve along the top of the wall (the carriage, not a room): a cream quarter-round lip and a blue outer edge
  f.add(mc('trailrack-roof', ({ add }) => {
    const g = new THREE.CylinderGeometry(.38, .38, L + .4, 16, 1, true, 0, HP); g.rotateZ(HP); g.rotateY(PI);
    add(g, CREAM2, 0, 2.42, .0); add(G.box(L + .4, .06, .5, .02), '#5072b0', 0, 2.83, .2);
  }));
  // the fan: blades on a hub (they turn slowly — Ambient f.tick)
  const fan = grp(); put(fan, L / 2 - .9, RY - .02, RZ + .25); f.add(fan);
  fan.add(mc('trailrack-fan', ({ add }) => { for (let k = 0; k < 3; k++) { const a = k * PI * 2 / 3; add(G.box(.42, .015, .14, .03), BLUE, Math.cos(a) * .24, 0, Math.sin(a) * .24, 0, -a, 0); } add(G.sph(.06, 10, 8), STEEL, 0, 0, 0); }));
  f.tick = t => { fan.rotation.y = t * 1.6; };
  // the umbrella hooked on the rail
  f.add(mc('trailrack-umb2', ({ add, tube }) => hungUmbrella(add, tube, L / 2 - 1.6, RY, RZ)));
  // the luggage rack: a steel frame on two brackets and a rope net that lifts at the front
  f.add(mc('trailrack-rack', ({ add, tube }) => {
    for (const x of [-.95, .95]) { add(G.box(.04, .04, .5, .01), STEEL, x, RY + .32, .3); tube([x, RY + .32, .05], [x, RY + .12, .05], .02, STEEL, 6); }
    add(G.box(1.95, .03, .03, .01), STEEL, 0, RY + .32, .54); add(G.box(1.95, .02, .46, .005), shade(STEEL, -.1), 0, RY + .31, .3);
  }));
  const net = grp(); put(net, 0, RY + .33, .55); f.add(net);
  net.add(mc('trailrack-net', ({ tube }) => { for (let k = 0; k <= 8; k++) tube([-.95 + k * .2375, 0, 0], [-.95 + k * .2375, -.16, .02], .006, DARK, 3); for (let k = 0; k < 3; k++) tube([-.95, -.05 * k, 0], [.95, -.05 * k, 0], .006, DARK, 3); }));
  const p = f.part('lift', net, (t, b) => { net.rotation.x = -1.1 * t; }, { label: '그물 짐 선반', sfx: 'rustle', dur: .3 });
  f.add(mc('trailrack-bag', ({ add }) => { add(G.cyl(.15, .15, .62, 16), '#f3e6c8', -.3, RY + .48, .3, 0, 0, HP); for (const x of [-.52, -.08]) add(G.cyl(.155, .155, .05, 16), NAVY, x, RY + .48, .3, 0, 0, HP); add(G.tor(.1, .015, PI, 6, 10), NAVY, -.3, RY + .62, .3); }));
  f.spot('on', null, .45, RY + .35, .3, { part: p, maxH: .3, label: '짐 선반 위', scale: .85 });
};

// 연결문 벽 (wall, span 2): the end wall — a grey sliding door to the next car with a window, a display board with a lamp row
// over it, a grab bar and the door button; the door slides aside (the 'door' device)
B.tdoorend = (f, T) => {
  const DW = .8, DH = 1.9;
  f.add(mc('tdoorend', ({ add }) => {
    add(G.box(DW + .2, DH + .1, .06, .02), STEEL, -.1, DH / 2, .03); add(G.box(DW, DH, .02, .01), '#3d4250', -.1, DH / 2, .06);
    add(G.box(.86, .2, .06, .03), '#363b48', -.1, DH + .25, .05); add(G.box(.7, .1, .02, .02), '#ffb347', -.1, DH + .25, .085);
    for (let k = 0; k < 5; k++) add(G.sph(.03, 8, 6), ['#3a7bd5', '#4caf50', '#ffc23d', '#ff8f3a', '#e8414e'][k], -.42 + k * .16, DH + .48, .06);
    add(G.cyl(.02, .02, .5, 8), ORANGE, .62, 1.1, .1); for (const y of [.86, 1.34]) add(G.box(.04, .03, .06, .01), STEEL, .62, y, .07);
    add(G.box(.12, .18, .04, .02), CREAM2, .62, .74, .05); add(G.cyl(.04, .04, .03, 14), '#e8574a', .62, .74, .08, HP, 0, 0);
  }));
  const dv = grp(); put(dv, -.1, 0, .09); f.add(dv);
  dv.add(mc('tdoorend-door', ({ add }) => {
    add(G.box(DW - .04, DH - .04, .05, .02), GREY, 0, DH / 2, 0); add(G.box(.32, .52, .02, .04), '#bfe3f2', 0, 1.3, .03); add(G.box(.36, .56, .02, .04), GREY2, 0, 1.3, .02);
    add(G.box(.03, .3, .04, .01), STEEL, DW / 2 - .12, .95, .04);
  }));
  const p = f.part('door', dv, (t, b) => { dv.position.x = b.p.x - .72 * t; }, { label: '연결문', sfx: 'slide', dur: .4 });
  f.spot('inside', null, -.1, .02, -.25, { part: p, maxH: .5, label: '연결문 너머', scale: .85 });
};

// 간식 카트 (1×1): a steel trolley on castors with a yellow tray whose lid opens (the 'cart' device) — boiled eggs in a net,
// cider, banana milk; a shelf below
B.tcart = (f, T) => {
  const W = .64, D = .44, TY = .66;
  f.add(mc('tcart', ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(G.cyl(.018, .018, TY, 8), STEEL, sx * W / 2, TY / 2 + .06, sz * D / 2); add(G.sph(.04, 8, 6), DARK, sx * W / 2, .04, sz * D / 2); }
    add(G.box(W, .02, D, .01), STEEL, 0, .26, 0); tube([-W / 2, TY + .12, D / 2], [-W / 2 - .12, TY + .2, D / 2], .015, STEEL, 6); tube([-W / 2, TY + .12, -D / 2], [-W / 2 - .12, TY + .2, -D / 2], .015, STEEL, 6); tube([-W / 2 - .12, TY + .2, -D / 2], [-W / 2 - .12, TY + .2, D / 2], .015, STEEL, 6);
    add(cutFace(G.box(W + .02, .18, D + .02, .03)), YEL, 0, TY + .09, 0); add(liner(W - .04, .08, D - .04), shade(YEL, -.2), 0, TY + .14, 0);
    for (const [x, z, c, h] of [[.14, -.06, GREEN, .26], [.24, .08, GREEN, .22], [.05, .1, '#f6e3a1', .18], [.2, -.14, '#f6e3a1', .16]]) { add(G.cyl(.045, .05, h, 12), c, x, TY + .1 + h / 2, z); add(G.cyl(.022, .022, .05, 8), c === GREEN ? '#2d6b3f' : '#e8b84a', x, TY + .12 + h, z); }
    for (let k = 0; k < 6; k++) add(G.sph(.045, 10, 8), '#fff8ee', -.16 + (k % 3) * .07, TY + .2 + Math.floor(k / 3) * .05, -.04 + (k % 2) * .05, 0, 0, 0, [1, 1.25, 1]);
    add(G.box(.22, .015, .08, .004), '#e8574a', -.12, TY + .3, .0);
    add(G.box(.3, .1, .24, .02), '#e9dcc2', .05, .32, .02);
  }));
  const lid = grp(); put(lid, 0, TY + .18, -D / 2); f.add(lid);
  lid.add(mc('tcart-lid', ({ add }) => { add(G.box(W + .04, .04, D + .04, .02), YEL2, 0, .02, D / 2); add(G.box(.12, .03, .03, .01), ORANGE, 0, .04, D + .02); }));
  const p = f.part('lid', lid, (t, b) => { lid.rotation.x = -1.6 * t; }, { label: '간식 카트 뚜껑', sfx: 'open', dur: .3 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: 0, y: TY + .09, z: D / 2 + .03 };
  f.pullOut(p, f.spot('inside', null, -.05, TY + .1, .04, { part: p, maxH: .2, label: '간식 카트 안', scale: .8 }), 0, { w: .22, d: .18, up: .3, color: '#fff3c8' });   // (a little tray rises over the bottles — ② 10/21; up .3: clear of the eggs and the tall bottles too, 10/22)
  f.spot('on', null, -.12, .275, -.06, { maxH: .3, label: '카트 아래 칸', scale: .8 });
};

// ═════════════ 2차 (10/21 검토 "그림과 차이가 커서" + 사용자 "원룸에 했던것처럼 디테일 … 지하철 광고도 좀 빼곡하게") ═════════════
// traincar2: a shorter, wider car seen side-on like the picture (the start view looks at the window wall — L.yaw), thick
// benches, big bright windows, the car body's cut ends and wheels, big hero props, and the walls and the top crowded with
// little real-life things (ads in a row over the windows, a route strip, stickers, the intercom, the fire box, a light strip,
// vents) while the floor stays clear.
const NAVY_B = '#2f56b0', NAVY_B2 = '#25458e', SKY2 = '#6fb8ec';
let VIEW2 = null;
const viewTex2 = () => VIEW2 || (VIEW2 = canvasTex(512, 320, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7cc4f2'); g.addColorStop(.5, '#cfeafb'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#ffffff'; for (const [x, y, r] of [[70, 50, 22], [98, 42, 28], [128, 54, 18], [360, 36, 18], [384, 30, 24], [410, 40, 16]]) { c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); }
  c.fillStyle = '#9cc8a4'; c.beginPath(); c.moveTo(0, 170); c.quadraticCurveTo(120, 96, 250, 150); c.quadraticCurveTo(360, 110, 512, 160); c.lineTo(512, 200); c.lineTo(0, 200); c.fill();
  c.fillStyle = '#5fa36a'; c.beginPath(); c.moveTo(0, 196); c.quadraticCurveTo(90, 140, 210, 190); c.lineTo(0, 205); c.fill();
  c.fillStyle = '#2f86cc'; c.fillRect(0, 196, W, H - 196); c.fillStyle = '#5aa6e0'; for (let y = 208; y < H; y += 12) c.fillRect(((y * 37) % 120) - 30, y, 160, 3);
  for (let k = 0; k < 9; k++) { const x = 250 + k * 26, h = 16 + (k % 3) * 6; c.fillStyle = ['#fff6ea', '#ffffff', '#fff1e2'][k % 3]; c.fillRect(x, 186 - h, 20, h); c.fillStyle = ['#e8724f', '#4f86c6', '#e8724f'][k % 3]; c.fillRect(x - 2, 182 - h, 24, 6); }
  c.fillStyle = '#f2e3c2'; c.fillRect(230, 194, 282, 5); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(150, 250); c.lineTo(190, 250); c.lineTo(178, 262); c.lineTo(156, 262); c.fill();
}));
// the ads over the windows: a row of framed posters with pictures only (no words, no real brands) — a heart, a bowl of noodles,
// a character's face, a sun over a beach, a milk carton, a star, a phone, a cake, a dog, an ice cream
let ADS = null;
const adTex = () => ADS || (ADS = canvasTex(1024, 96, (c, W, H) => {
  c.fillStyle = '#e9e4da'; c.fillRect(0, 0, W, H);
  const cols = ['#ffd6e0', '#fff1b8', '#d9f2e6', '#d6e8ff', '#ffe2c4', '#efe0ff', '#ffe6ea', '#e2f6ff', '#fff4d6', '#e6f7d9'];
  for (let k = 0; k < 10; k++) {
    const x = 6 + k * 101.6, w = 90, cx = x + w / 2, cy = 48;
    c.fillStyle = '#c9c2b4'; c.fillRect(x - 3, 5, w + 6, 86); c.fillStyle = cols[k]; c.fillRect(x, 8, w, 80);
    c.fillStyle = ['#e8414e', '#e8a33c', '#3f9e6a', '#3a7bd5', '#f08a3c', '#8a5ad8', '#ff8fb8', '#4fb0e0', '#c9853a', '#5cbf5a'][k];
    if (k === 0) { c.beginPath(); c.moveTo(cx, cy + 18); c.bezierCurveTo(cx + 34, cy - 4, cx + 14, cy - 30, cx, cy - 12); c.bezierCurveTo(cx - 14, cy - 30, cx - 34, cy - 4, cx, cy + 18); c.fill(); }
    else if (k === 1) { c.beginPath(); c.arc(cx, cy, 24, 0, PI); c.fill(); c.fillStyle = '#fff6d6'; for (let i = 0; i < 4; i++) c.fillRect(cx - 18 + i * 10, cy - 14, 3, 14); }
    else if (k === 2) { c.beginPath(); c.arc(cx, cy, 24, 0, PI * 2); c.fill(); c.fillStyle = '#2a1d33'; c.fillRect(cx - 10, cy - 6, 5, 7); c.fillRect(cx + 5, cy - 6, 5, 7); c.fillStyle = '#ffb3c4'; c.fillRect(cx - 18, cy + 4, 7, 4); c.fillRect(cx + 11, cy + 4, 7, 4); }
    else if (k === 3) { c.fillStyle = '#ffd23c'; c.beginPath(); c.arc(cx, cy - 6, 14, 0, PI * 2); c.fill(); c.fillStyle = '#3a7bd5'; c.fillRect(x + 6, cy + 14, w - 12, 18); c.fillStyle = '#f2e3c2'; c.fillRect(x + 6, cy + 10, w - 12, 5); }
    else if (k === 4) { c.fillRect(cx - 14, cy - 18, 28, 40); c.fillStyle = '#ffffff'; c.fillRect(cx - 10, cy - 4, 20, 14); c.fillStyle = '#f08a3c'; c.beginPath(); c.moveTo(cx - 14, cy - 18); c.lineTo(cx, cy - 30); c.lineTo(cx + 14, cy - 18); c.fill(); }
    else if (k === 5) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -HP + i * PI / 5, r = i % 2 ? 11 : 26; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.fill(); }
    else if (k === 6) { c.fillRect(cx - 14, cy - 26, 28, 50); c.fillStyle = '#ffffff'; c.fillRect(cx - 10, cy - 20, 20, 34); }
    else if (k === 7) { c.fillRect(cx - 24, cy, 48, 22); c.fillStyle = '#ffffff'; c.fillRect(cx - 24, cy - 6, 48, 8); c.fillStyle = '#e8414e'; c.beginPath(); c.arc(cx, cy - 12, 6, 0, PI * 2); c.fill(); }
    else if (k === 8) { c.beginPath(); c.arc(cx, cy + 4, 20, 0, PI * 2); c.fill(); c.beginPath(); c.arc(cx - 16, cy - 14, 8, 0, PI * 2); c.arc(cx + 16, cy - 14, 8, 0, PI * 2); c.fill(); c.fillStyle = '#2a1d33'; c.fillRect(cx - 8, cy, 4, 5); c.fillRect(cx + 4, cy, 4, 5); }
    else { c.beginPath(); c.moveTo(cx - 14, cy - 4); c.lineTo(cx + 14, cy - 4); c.lineTo(cx, cy + 28); c.fill(); c.fillStyle = '#ffb3cf'; c.beginPath(); c.arc(cx, cy - 10, 15, 0, PI * 2); c.fill(); }
    c.fillStyle = 'rgba(42,29,51,.55)'; c.fillRect(x + 10, 78, w - 40, 4); c.fillRect(x + 10, 70, w - 56, 3);
  }
}));
const basic = (tex) => { const m = new THREE.MeshBasicMaterial({ map: tex }); m.toneMapped = false; return m; };

// ── 흐르는 창밖 (28판 3차 traincar3, 사용자 10/22 "창문으로 풍경은 계속 앞으로 가는 것처럼"): three see-through strips that tile
// sideways — far blue ridges and the sea, the fields with little houses and trees, the near telegraph poles — over a still
// sky; each window shows its own stretch of one landscape (windows side by side agree), sliding by at three speeds
const tile = (w, h, draw) => { const t = canvasTex(w, h, draw); t.wrapS = THREE.RepeatWrapping; return t; };
let FLOW = null;
const flowTex = () => FLOW || (FLOW = {
  sky: canvasTex(256, 256, (c, W, H) => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8fcdf3'); g.addColorStop(.62, '#d8f0fd'); g.addColorStop(1, '#eef9ff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.9)'; for (const [x, y, r] of [[48, 46, 18], [70, 40, 24], [96, 50, 16], [176, 70, 14], [196, 64, 20], [214, 72, 12]]) { c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); }
  }),
  // (every curve below repeats exactly across the tile's width, so the strip runs on without a seam)
  far: tile(512, 256, (c, W, H) => {
    const ridge = (base, amp, col, ph) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) { const a = x / W * PI * 2; c.lineTo(x, base - amp * (.55 * Math.sin(a * 2 + ph) + .3 * Math.sin(a * 5 + ph * 2) + .15 * Math.sin(a * 9 + ph))); }
      c.lineTo(W, H); c.fill(); };
    ridge(H * .5, H * .16, '#a9bfe0', 0); ridge(H * .58, H * .12, '#8eaed6', 1.7);
    c.fillStyle = '#6fb8e2'; c.fillRect(0, H * .66, W, H * .1); c.fillStyle = 'rgba(255,255,255,.75)'; for (let k = 0; k < 14; k++) c.fillRect((k * 37 + 11) % W, H * (.68 + (k % 3) * .025), 14, 2);
    c.clearRect(0, H * .76, W, H);
  }),
  mid: tile(512, 256, (c, W, H) => {
    c.fillStyle = '#9ed27c'; c.fillRect(0, H * .72, W, H * .28); c.fillStyle = '#8cc56c'; for (let k = 0; k < 8; k++) c.fillRect(0, H * (.76 + k * .03), W, H * .012);
    const house = (x, w, h, roof) => { const y = H * .74; c.fillStyle = '#fff6e8'; c.fillRect(x, y - h, w, h); c.fillStyle = roof; c.beginPath(); c.moveTo(x - 5, y - h); c.lineTo(x + w / 2, y - h - h * .55); c.lineTo(x + w + 5, y - h); c.fill(); c.fillStyle = '#7fb8e6'; c.fillRect(x + w * .3, y - h * .62, w * .25, h * .28); };
    const tree = (x, r) => { c.fillStyle = '#8a5a34'; c.fillRect(x - 2, H * .74 - r, 4, r); c.fillStyle = '#5fae55'; c.beginPath(); c.arc(x, H * .74 - r * 1.4, r, 0, PI * 2); c.fill(); c.fillStyle = '#7cc56a'; c.beginPath(); c.arc(x - r * .3, H * .74 - r * 1.6, r * .5, 0, PI * 2); c.fill(); };
    house(40, 34, 26, '#e8574a'); house(84, 28, 22, '#3a7bd5'); tree(140, 14); tree(162, 10); house(250, 40, 30, '#ff9a3c'); tree(320, 16); house(372, 30, 24, '#8a5ad8'); tree(430, 12); tree(452, 15);
  }),
  near: tile(512, 256, (c, W, H) => {
    const poles = [W * .22, W * .72];
    c.strokeStyle = '#3a3346'; c.lineWidth = 2.5;
    for (const dy of [26, 38]) for (let i = 0; i < poles.length; i++) {   // wires sag pole to pole, the last one on round the seam
      const a = poles[i], b = i + 1 < poles.length ? poles[i + 1] : poles[0] + W;
      for (const sh of [0, -W]) { c.beginPath(); c.moveTo(a + sh, dy); c.quadraticCurveTo((a + b) / 2 + sh, dy + 22, b + sh, dy); c.stroke(); }
    }
    // (they pass fast: drawn smeared sideways, the way a pole whips past a train window)
    for (const x of poles) {
      const g = c.createLinearGradient(x - 26, 0, x + 26, 0); g.addColorStop(0, 'rgba(90,70,54,0)'); g.addColorStop(.35, 'rgba(90,70,54,.75)'); g.addColorStop(.5, 'rgba(90,70,54,1)'); g.addColorStop(.65, 'rgba(90,70,54,.75)'); g.addColorStop(1, 'rgba(90,70,54,0)');
      c.fillStyle = g; c.fillRect(x - 26, 14, 52, H);
      const g2 = c.createLinearGradient(x - 40, 0, x + 40, 0); g2.addColorStop(0, 'rgba(58,51,70,0)'); g2.addColorStop(.5, 'rgba(58,51,70,.9)'); g2.addColorStop(1, 'rgba(58,51,70,0)'); c.fillStyle = g2; c.fillRect(x - 40, 22, 80, 7);
    }
    c.fillStyle = 'rgba(78,154,74,.95)'; c.fillRect(0, H - 22, W, 22); c.fillStyle = 'rgba(110,186,96,.8)'; for (let k = 0; k < 9; k++) c.fillRect((k * 61) % W, H - 30 + (k % 3) * 4, 46, 3);
  }),
});

// 긴 벤치 2 (2×1): thicker, plumper — a deep navy seat in two cushions, a tall padded back, a grey base with the heater grille;
// o.drawer: the right half is a drawer (lockable); o.stuff: left-behind things — 'paper' (a newspaper, a cup of noodles),
// 'bag' (a shopping bag, a folded umbrella), 'toy' (a little robot toy, an empty banana milk bottle)
B.tbench2 = (f, T, o = {}) => {
  const W = 1.94, D = .74, z0 = -.02, SH = .5, pri = !!o.priority, C1 = pri ? '#ef9fb6' : NAVY_B, C2 = pri ? '#db86a0' : NAVY_B2;   // (o.priority: the pink seats — 노약자석)
  f.add(mc('tbench2b' + (pri ? '|p' : ''), ({ add }) => {
    add(G.box(W, SH - .16, D - .12, .02), GREY, 0, (SH - .16) / 2, z0 - .03);
    for (const x of [-.48, .48]) { add(G.box(.76, .16, .02, .006), shade(GREY, -.15), x, .18, z0 + D / 2 - .08); for (let k = 0; k < 6; k++) add(G.box(.68, .012, .01, .003), GREY2, x, .12 + k * .022, z0 + D / 2 - .07); }
    for (const s of [-1, 1]) { add(G.box(W / 2 - .02, .2, D, .09), C1, s * W / 4, SH - .06, z0); add(G.box(W / 2 - .1, .012, .02, .004), C2, s * W / 4, SH + .04, z0 + D / 2 - .02); }
    add(G.box(W, .62, .2, .09), C2, 0, SH + .3, z0 - D / 2 + .08, -.1, 0, 0);
    for (const s of [-1, 1]) add(G.box(.012, .5, .02, .004), C1, s * W / 4, SH + .3, z0 - D / 2 + .19, -.1, 0, 0);
    if (pri) { add(G.box(.22, .22, .01, .02), '#ffffff', 0, SH + .42, z0 - D / 2 + .2, -.1, 0, 0); add(G.sph(.05, 10, 8), '#e86a92', 0, SH + .44, z0 - D / 2 + .21, 0, 0, 0, [1, 1, .2]); }
    add(G.box(W + .04, .06, .22, .02), CREAM2, 0, SH + .62, z0 - D / 2 + .06);
    // (10/22 사용자 "디테일 좀 올려 주고") six seats: a seam between each on the cushion and up the back; at each end a steel
    // armrest frame with a frosted panel
    for (const x of [-.643, -.327, .327, .643]) { add(G.box(.014, .008, D - .1, .003), C2, x, SH + .043, z0 + .02); add(G.box(.012, .46, .02, .004), C1, x, SH + .3, z0 - D / 2 + .19, -.1, 0, 0); }
  }));
  f.add(mc('tbench2-arms', ({ add, tube }) => {
    for (const sx of [-1, 1]) {
      const x = sx * (W / 2 + .025), zf = z0 + D / 2 - .07, zb = z0 - D / 2 + .22;
      tube([x, .02, zf], [x, SH + .3, zf], .02, RAIL, 8); tube([x, SH + .3, zf], [x, SH + .44, zb], .02, RAIL, 8); tube([x, SH + .44, zb], [x, SH + .1, zb], .02, RAIL, 8);
      add(G.box(.012, .3, zf - zb - .08, .006), '#dfe9f2', x, SH + .18, (zf + zb) / 2);
    }
  }));
  const st = o.stuff;
  if (st) f.add(mc('tbench2-stuff|' + st, ({ add, tube }) => {
    if (st === 'paper' || st === true) {
      add(G.box(.44, .02, .32, .005), '#f4f1ea', .45, SH + .05, z0 - .02, 0, .3, 0); for (let k = 0; k < 4; k++) add(G.box(.32, .005, .015, .002), '#9aa0aa', .45, SH + .062, z0 - .1 + k * .05, 0, .3, 0);
      add(G.cyl(.08, .065, .13, 14), '#ffffff', .82, SH + .1, z0 + .02); add(G.cyl(.082, .082, .035, 14), '#e8574a', .82, SH + .12, z0 + .02); add(G.cyl(.075, .075, .01, 14), '#f2c46a', .82, SH + .17, z0 + .02);
    } else if (st === 'bag') {
      add(G.box(.3, .3, .14, .02), '#f6d7e2', -.5, SH + .19, z0 - .05, 0, .2, 0); tube([-.6, SH + .34, z0 - .05], [-.5, SH + .44, z0 - .05], .01, '#e8a2b8', 4); tube([-.5, SH + .44, z0 - .05], [-.4, SH + .34, z0 - .05], .01, '#e8a2b8', 4);
      add(G.cyl(.04, .04, .5, 10), '#3a7bd5', .5, SH + .06, z0 + .05, 0, 0, HP); add(G.tor(.05, .012, PI, 5, 10), '#2a1d33', .25, SH + .06, z0 + .05, 0, HP, 0);
    } else {
      add(G.box(.14, .16, .1, .03), '#c3c9d6', -.3, SH + .12, z0); add(G.box(.12, .1, .1, .03), '#c3c9d6', -.3, SH + .26, z0); for (const s of [-1, 1]) add(G.sph(.016, 6, 5), '#2a1d33', -.3 + s * .03, SH + .27, z0 + .05); add(G.cyl(.006, .006, .06, 4), '#e8574a', -.3, SH + .34, z0);
      add(G.cyl(.04, .05, .14, 12), '#fff3b0', .55, SH + .11, z0 + .1); add(G.cyl(.02, .025, .04, 10), '#ffd23c', .55, SH + .2, z0 + .1);
    }
  }));
  f.spot('under', null, -.5, .01, z0 + D / 2 + .08, { maxH: .22, label: '벤치 밑', scale: .8 });
  f.spot('on', null, st === 'bag' ? .1 : -.2, SH + .05, z0 + .08, { maxH: .35, label: '벤치 위', scale: .9 });
  if (o.drawer) {
    // (② 10/21: shut, it sat 4 cm behind the seat's front lip — from most sides a tap on it took the bench; now its front stands
    // proud of the seat, a little taller)
    const dv = grp(); put(dv, .48, .19, z0 + D / 2 - .01); f.add(dv);
    dv.add(mc('tbench2-drawer2', ({ add }) => {
      add(G.box(.8, .26, .035, .01), CREAM, 0, 0, .017); add(G.box(.74, .02, .46, .005), CREAM2, 0, -.1, -.21); for (const sx of [-1, 1]) add(G.box(.02, .2, .46, .005), CREAM2, sx * .36, 0, -.21);
      add(G.cyl(.045, .045, .035, 12), ORANGE, 0, 0, .045, HP, 0, 0);
    }));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .44 * t; }, { label: '벤치 서랍', sfx: 'drawer', dur: .26 });
    p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: .24, y: 0, z: .06, parent: dv };
    f.spot('inside', dv, 0, -.09, -.18, { part: p, maxH: .18, label: '벤치 서랍 안', scale: .85 });
  }
};

// 큰 기차 창 (wall, span 2): a big window, more than half the wall — rounded frame, the bright sea-and-village view (lit by
// itself, so it reads), two little stickers on the glass; o.blind: the yellow roll blind (a part); o.paw: a tiny black paw print
B.twindow2 = (f, T, o = {}) => {
  const W = 1.86, H = 1.24, cy = 1.62;
  f.add(mc('twindow2b', ({ add }) => {
    for (const sy of [-1, 1]) add(G.box(W + .18, .09, .12, .035), STEEL, 0, cy + sy * (H / 2 + .045), .06);
    for (const sx of [-1, 1]) add(G.box(.09, H + .18, .12, .035), STEEL, sx * (W / 2 + .045), cy, .06);
    add(G.box(.045, H, .06, .01), STEEL, .25, cy, .05); add(G.box(W - .1, .04, .06, .01), STEEL, 0, cy + H * .22, .05);
    add(G.box(W + .34, .07, .26, .02), CREAM2, 0, cy - H / 2 - .09, .13);
    // (10/22) the dark rubber seal round the glass and two latches on the bottom rail
    for (const sy of [-1, 1]) add(G.box(W + .02, .026, .02, .006), '#3a3f4c', 0, cy + sy * (H / 2 - .005), .045);
    for (const sx of [-1, 1]) add(G.box(.026, H - .02, .02, .006), '#3a3f4c', sx * (W / 2 - .005), cy, .045);
    for (const sx of [-1, 1]) { add(G.box(.08, .03, .04, .01), RAIL, sx * .45, cy - H / 2 - .02, .1); add(G.box(.03, .045, .03, .008), RAIL2, sx * .45 + .03, cy - H / 2, .12); }
    add(G.cyl(.05, .05, .006, 14), '#ffd23c', -.7, cy - .42, .047, HP, 0, 0); add(G.box(.08, .06, .006, .01), '#8fd3f4', .7, cy + .48, .047);
    if (o.paw) { add(G.sph(.03, 8, 6), '#2a1d33', -.2, cy - .2, .045, 0, 0, 0, [1, 1.1, .2]); for (let k = 0; k < 3; k++) add(G.sph(.012, 6, 5), '#2a1d33', -.2 + (k - 1) * .028, cy - .16, .045, 0, 0, 0, [1, 1, .2]); }
  }));
  if (o.flow) {
    // (traincar3) the still sky behind, then the three strips, each its own copy of the shared picture so that each window can
    // sit at its own place along the landscape; colour only (layer 2: no ink lines round the strips' clear parts)
    const F = flowTex(), gl = mesh(new THREE.PlaneGeometry(W, H), basic(F.sky), { cast: false }); put(gl, 0, cy, .022); f.add(gl);
    const lays = [['far', 8, .9], ['mid', 4.5, 3.4], ['near', 3, 10]].map(([k, Lm, v], i) => {   // (10/22 사용자 "뒤에 배경 움직이는 거 더 빠르게": a train at speed)
      const tex = F[k].clone(); tex.repeat.set(W / Lm, 1);
      const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }); m.toneMapped = false;
      const pl = mesh(new THREE.PlaneGeometry(W, H), m, { cast: false }); put(pl, 0, cy, .024 + i * .002); pl.layers.set(2); pl.renderOrder = 1 + i; pl.userData.noOcclude = true; f.add(pl);
      return { tex, Lm, v };
    });
    // (the still view redraws only what changed, in at most three boxes: five windows sliding on the same frame merged into
    // one box over most of the screen and every frame was drawn whole) — the windows take turns, two of five each frame, so
    // each one moves about 24 times a second and only two small boxes are drawn again
    let last = -1;
    f.tick = t => {
      const fr = Math.floor(t * 60); if (fr === last) return;
      const slot = Math.round(f.group.position.x / 2.3) + 2, m = ((fr - slot) % 5 + 5) % 5; if (m === 1 || m === 3) return;   // (three of five each frame: ~36 a second)
      last = fr;
      const u = f.group.position.x - W / 2;
      for (const L of lays) { const x = (u + t * L.v) / L.Lm; L.tex.offset.x = x - Math.floor(x); }
    };
  } else { const gl = mesh(new THREE.PlaneGeometry(W, H), basic(viewTex2()), { cast: false }); put(gl, 0, cy, .025); f.add(gl); }
  if (!o.blind) f.spot('on', null, .5, cy - H / 2 - .06, .16, { maxH: .22, label: '창턱', scale: .75 });   // (behind the blind the sill is the blind's — ② 10/21: 0 of 24)
  if (o.blind) {
    // (② 10/21: hung behind the sill's front edge and inside the frame it was hard to tap from most sides — it hangs in front of
    // both now, wider than the frame)
    const BZ = .29, BW = W + .14;
    f.add(mc('twindow2-roll2', ({ add }) => { add(G.cyl(.065, .065, BW + .06, 14), YEL2, 0, cy + H / 2 + .1, BZ - .01, 0, 0, HP); for (const s of [-1, 1]) add(G.box(.04, .15, BZ - .02, .01), STEEL, s * (BW / 2 + .05), cy + H / 2 + .1, (BZ - .02) / 2 + .02); }));
    const bl = grp(); put(bl, 0, cy + H / 2 + .1, BZ); f.add(bl);
    bl.add(mc('twindow2-blind2', ({ add, tube }) => {
      add(G.box(BW, 1, .012, .004), YEL, 0, -.5, 0); add(G.box(BW + .02, .04, .03, .01), YEL2, 0, -1, 0);
      tube([0, -1, .01], [0, -1.08, .02], .006, '#e0d6c0', 4); add(G.tor(.04, .011, PI * 2, 6, 14), '#ffffff', 0, -1.12, .02);
    }));
    bl.scale.y = H / 1.0 * .55;
    const p = f.part('lift', bl, (t, b) => { bl.scale.y = Math.max(.05, H * .55 * (1 - .92 * t)); }, { label: '롤 블라인드', sfx: 'swish', dur: .4 });
    f.spot('inside', null, -.4, cy - H / 2 - .06, .16, { part: p, maxH: .25, label: '블라인드 뒤 창턱', scale: .75 });
  }
};

// 광고 띠·봉·짐 선반 2 (wall, span 7): along the window wall's top — a row of picture ads in a frame, the light strip and two
// vents under the roof's curve; the orange grab rail on posts with hanging handles (a little ad tag on every other one), a
// big rope-net rack with several bags (its net lifts), a big ceiling fan and a long umbrella hooked on the rail
B.trailrack2 = (f, T, o = {}) => {
  const L = o.len || 6.8, RY = 2.24, RZ = .66, LK = L === 6.8 ? '' : '|' + L;   // (o.len: a longer car — traincar3)
  f.collideBox = [-L / 2, RY - .05, .5, L / 2, RY + .55, .75];   // (the rail only: the blind's roll under the rack rolls up freely)
  f.add(mc('trailrack2c' + LK, ({ add, tube }) => {
    const posts = [-L / 2 + .2, -1.15, 1.15, L / 2 - .2]; if (L > 9) posts.push(-L / 2 + 3.3, L / 2 - 3.3);
    grabRail(add, tube, -L / 2, L / 2, RY, RZ, posts);
    for (let k = 0; k < Math.round((L - 1) / .75) + 1; k++) { const x = -L / 2 + .5 + k * .75; if (x > L / 2 - .3) break; if (Math.abs(x) < 1.05) continue;
      strapHandle(add, tube, x, RY, RZ, k % 2 ? ['#ff8fb8', '#8fd3f4', '#ffd23c', '#9be38f'][k % 4] : null); }
    add(G.cyl(.022, .022, .32, 8), STEEL, L / 2 - .95, RY + .22, RZ + .3); add(G.cyl(.1, .1, .07, 14), STEEL, L / 2 - .95, RY + .04, RZ + .3);
  }));
  // the roof's curve over the wall, the ad row on it, the light strip and the vents
  f.add(mc('trailrack2-roof2' + LK, ({ add }) => {
    const g = new THREE.CylinderGeometry(.5, .5, L + .5, 18, 1, true, 0, HP); g.rotateZ(HP); g.rotateY(PI);
    add(g, CREAM2, 0, 2.58, .0); add(G.box(L + .5, .07, .64, .02), NAVY_B, 0, 3.1, .26);
    add(G.box(L - .38, .02, .12, .01), STEEL, 0, 3.01, .62);
    for (let x = -L / 2 + .3; x < L / 2 - .4; x += 1.0) { add(G.box(.86, .05, .09, .02), '#fffdf0', x + .43, 2.98, .62); add(G.box(.88, .012, .1, .004), RAIL2, x + .43, 2.952, .62); }   // (a row of light panels, not one strip — 10/22)
    for (const x of [-1.7, 1.7]) { add(G.box(.6, .03, .14, .01), STEEL, x, 3.0, .45); for (let k = 0; k < 5; k++) add(G.box(.54, .008, .015, .002), GREY2, x, 2.985, .4 + k * .025); }
  }));
  let at = adTex(); if (LK) { at = at.clone(); at.wrapS = THREE.RepeatWrapping; at.repeat.set((L - .2) / 6.6, 1); }   // (the same ads, again, along a longer car)
  const ad = mesh(new THREE.PlaneGeometry(L - .2, .3), basic(at), { cast: false }); put(ad, 0, 2.47, .1); ad.rotation.x = -.5; f.add(ad);
  const fan = grp(); put(fan, L / 2 - .95, RY - .02, RZ + .3); f.add(fan);
  fan.add(mc('trailrack2-fan', ({ add }) => { for (let k = 0; k < 3; k++) { const a = k * PI * 2 / 3; add(G.box(.56, .018, .17, .04), BLUE, Math.cos(a) * .32, 0, Math.sin(a) * .32, 0, -a, 0); } add(G.sph(.1, 12, 8), STEEL, 0, 0, 0, 0, 0, 0, [1, .6, 1]); }));
  f.tick = t => { fan.rotation.y = t * 1.6; };
  f.add(mc('trailrack2-umb2' + LK, ({ add, tube }) => hungUmbrella(add, tube, L / 2 - 1.75, RY, RZ)));
  f.add(mc('trailrack2-rack', ({ add, tube }) => {
    for (const x of [-1.05, 1.05]) { add(G.box(.05, .05, .58, .012), STEEL, x, RY + .36, .32); tube([x, RY + .36, .06], [x, RY + .14, .06], .022, STEEL, 6); }
    add(G.box(2.15, .035, .035, .01), STEEL, 0, RY + .36, .6); add(G.box(2.15, .02, .54, .005), shade(STEEL, -.1), 0, RY + .35, .33);
  }));
  const net = grp(); put(net, 0, RY + .37, .61); f.add(net);
  net.add(mc('trailrack2-net', ({ tube }) => { for (let k = 0; k <= 9; k++) tube([-1.05 + k * .2333, 0, 0], [-1.05 + k * .2333, -.18, .02], .007, DARK, 3); for (let k = 0; k < 3; k++) tube([-1.05, -.06 * k, .01 * k], [1.05, -.06 * k, .01 * k], .007, DARK, 3); }));
  const p = f.part('lift', net, (t, b) => { net.rotation.x = -1.1 * t; }, { label: '그물 짐 선반', sfx: 'rustle', dur: .3 });
  f.add(mc('trailrack2-bags', ({ add }) => {
    add(G.cyl(.18, .18, .7, 16), '#f3e6c8', -.45, RY + .55, .33, 0, 0, HP); for (const x of [-.71, -.19]) add(G.cyl(.185, .185, .06, 16), NAVY_B, x, RY + .55, .33, 0, 0, HP);
    add(G.box(.38, .26, .3, .05), '#e8574a', .55, RY + .5, .32); add(G.box(.1, .04, .04, .01), '#2a1d33', .55, RY + .65, .32);
    add(G.box(.26, .18, .2, .05), '#9be38f', .9, RY + .46, .36);
  }));
  f.spot('on', null, .2, RY + .38, .34, { part: p, maxH: .3, label: '짐 선반 위', scale: .85 });
  // (a long car: more racks along it, bags on them — only the middle one's net lifts)
  if (L > 9) f.add(mc('trailrack2-more' + LK, ({ add, tube }) => {
    for (const cx of [-L / 2 + 2.1, L / 2 - 2.6]) {
      for (const x of [cx - 1.05, cx + 1.05]) { add(G.box(.05, .05, .58, .012), STEEL, x, RY + .36, .32); tube([x, RY + .36, .06], [x, RY + .14, .06], .022, STEEL, 6); }
      add(G.box(2.15, .035, .035, .01), STEEL, cx, RY + .36, .6); add(G.box(2.15, .02, .54, .005), shade(STEEL, -.1), cx, RY + .35, .33);
      for (let k = 0; k <= 9; k++) tube([cx - 1.05 + k * .2333, RY + .37, .61], [cx - 1.05 + k * .2333, RY + .19, .63], .007, DARK, 3);
      add(G.box(.42, .24, .3, .05), cx < 0 ? '#3a7bd5' : '#ff9f8a', cx - .5, RY + .49, .32); add(G.cyl(.15, .15, .55, 14), cx < 0 ? '#ffd23c' : '#9be38f', cx + .45, RY + .53, .33, 0, 0, HP);
    }
  }));
};

let NEXTCAR = null;
const nextCarTex = () => NEXTCAR || (NEXTCAR = canvasTex(128, 200, (c, W, H) => {
  // the next car through the door's window: its floor running away to a far door, navy seats both sides, light panels above
  c.fillStyle = '#efe6d2'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#e2d6bc'; c.beginPath(); c.moveTo(0, H); c.lineTo(W, H); c.lineTo(W * .62, H * .55); c.lineTo(W * .38, H * .55); c.fill();
  c.fillStyle = '#2f56b0'; c.beginPath(); c.moveTo(0, H * .95); c.lineTo(W * .3, H * .6); c.lineTo(W * .3, H * .5); c.lineTo(0, H * .7); c.fill();
  c.beginPath(); c.moveTo(W, H * .95); c.lineTo(W * .7, H * .6); c.lineTo(W * .7, H * .5); c.lineTo(W, H * .7); c.fill();
  c.fillStyle = '#9aa3b4'; c.fillRect(W * .4, H * .3, W * .2, H * .25); c.fillStyle = '#bfe3f2'; c.fillRect(W * .44, H * .34, W * .12, H * .08);
  c.fillStyle = '#fffdf0'; for (let k = 0; k < 3; k++) c.fillRect(W * (.2 + k * .06), H * (.08 + k * .07), W * (.6 - k * .12), H * .025);
}));

// 연결문 벽 2 (wall, span 5): the end wall — a big grey sliding door to the next car (its part), the display board with its lamp
// row over it, a route strip (lines and dots, no words) beside it, the emergency intercom and the door button, a red fire box
// lower down, a grab bar; the yellow safety line and two door marks on the floor in front
B.tdoorend2 = (f, T) => {
  const DW = 1.0, DH = 2.1;
  f.add(mc('tdoorend2', ({ add }) => {
    add(G.box(DW + .26, DH + .12, .07, .02), STEEL, 0, DH / 2, .035); add(G.box(DW, DH, .02, .01), '#3d4250', 0, DH / 2, .07);
    add(G.box(.06, DH + .1, .26, .02), STEEL, DW / 2 + .1, DH / 2, .15); add(G.box(DW + .26, .06, .26, .02), STEEL, 0, DH + .06, .15);
    add(G.box(1.1, .26, .07, .03), '#363b48', 0, DH + .3, .06); add(G.box(.92, .13, .02, .02), '#ffb347', 0, DH + .3, .1);
    for (let k = 0; k < 6; k++) add(G.sph(.035, 8, 6), ['#3a7bd5', '#4caf50', '#ffc23d', '#ff8f3a', '#e8414e', '#8a5ad8'][k], -.45 + k * .18, DH + .56, .07);
    add(G.box(1.5, .2, .02, .02), '#ffffff', -1.45, 2.15, .02); add(G.box(1.36, .025, .022, .01), '#3a7bd5', -1.45, 2.15, .035); for (let k = 0; k < 8; k++) add(G.cyl(.022, .022, .02, 10), k === 4 ? '#e8414e' : '#ffffff', -2.08 + k * .18, 2.15, .04, HP, 0, 0);
    add(G.box(1.3, .02, .02, .01), '#4caf50', -1.45, 2.1, .035);
    add(G.cyl(.024, .024, .7, 8), ORANGE, .82, 1.15, .12); for (const y of [.82, 1.48]) add(G.box(.05, .035, .08, .01), STEEL, .82, y, .08);
    add(G.box(.16, .24, .05, .03), CREAM2, .82, .64, .05); add(G.cyl(.05, .05, .03, 14), '#e8574a', .82, .64, .09, HP, 0, 0);
    add(G.box(.22, .3, .06, .03), '#d9dde6', 1.25, 1.35, .05); add(G.box(.14, .1, .02, .02), '#2a1d33', 1.25, 1.42, .085); add(G.cyl(.03, .03, .02, 12), '#ffd23c', 1.25, 1.27, .085, HP, 0, 0);
    add(G.box(.42, .55, .14, .03), '#e8414e', -1.75, .55, .07); add(G.box(.32, .4, .02, .02), '#ffffff', -1.75, .58, .145); add(G.cyl(.07, .07, .3, 12), '#e8414e', -1.75, .55, .1);
    for (const sx of [-1, 1]) add(G.box(.05, .006, 1.2, .003), '#ffd23c', sx * (DW / 2 + .25), .006, .7);
    add(G.box(DW + .55, .006, .05, .003), '#ffd23c', 0, .006, 1.3);
    for (const sx of [-1, 1]) { add(G.box(.12, .006, .2, .04), '#f2c94c', sx * .2, .006, .55, 0, sx * .2, 0); add(G.box(.08, .006, .08, .03), '#f2c94c', sx * .2, .006, .4); }
  }));
  const dv = grp(); put(dv, 0, 0, .24); f.add(dv);
  dv.add(mc('tdoorend2-door2', ({ add }) => {
    add(G.box(DW - .04, DH - .04, .06, .02), GREY, 0, DH / 2, 0); add(G.box(.44, .66, .02, .05), GREY2, 0, 1.42, .025);
    add(G.box(.035, .36, .05, .01), STEEL, DW / 2 - .14, 1.0, .045); add(G.cyl(.04, .04, .006, 12), '#ffd23c', -.2, 1.0, .035, HP, 0, 0);
  }));
  const nw = mesh(new THREE.PlaneGeometry(.4, .62), basic(nextCarTex()), { cast: false }); put(nw, 0, 1.42, .037); dv.add(nw);   // (the next car through its window — 10/22)
  const p = f.part('door', dv, (t, b) => { dv.position.x = b.p.x - .9 * t; }, { label: '연결문', sfx: 'slide', dur: .4 });
  f.spot('inside', null, 0, .02, .09, { part: p, maxH: .5, label: '연결문 너머', scale: .7 });
  f.spot('on', null, -1.75, 1.0, .14, { maxH: .16, label: '소화기함 위', scale: .55 });
};

// 차체 (wall, span 7 — the window wall's own): the car body round the cut — a thick navy end frame at each end of the car (cream
// inside, an orange stripe, the roof's rounded corner and a short stub of roof), and under the floor the bogies, two wheels
// each and a little brake box, on both ends
B.tshell = (f, T, o = {}) => {
  const L = o.len || 7, CW = o.width || 5;
  // o.jolt (traincar3, 사용자 10/22 "살짝 덜컹"): every few seconds the whole car gives a short little rock and a bump — the room
  // tilts a hair round its long axis for half a second (only then is the whole picture drawn again)
  if (o.jolt) {
    let root = null, z0 = 0, y0 = 0, next = 3, on = false;
    f.tick = t => {
      if (!root) { root = f.group; while (root.parent && !root.parent.isScene) root = root.parent; z0 = root.rotation.z; y0 = root.position.y; }
      if (t < next) { if (on) { root.rotation.z = z0; root.position.y = y0; on = false; } return; }
      const k = (t - next) / .55; if (k >= 1) { next = t + 5 + Math.random() * 4; return; }
      on = true; const e = Math.sin(k * PI * 3) * (1 - k);
      root.rotation.z = z0 + e * .0035; root.position.y = y0 + Math.abs(e) * .006;
    };
  }
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];   // (round the car, under the floor: never in anyone's way — room.js clearAt, fitParts)
  const prof = new THREE.Shape();
  // the cross-section in (into the room, up): up the wall's thickness, round the roof corner, a stub of roof
  prof.moveTo(-.28, -.75); prof.lineTo(-.28, 2.7); prof.quadraticCurveTo(-.28, 3.32, .35, 3.32); prof.lineTo(1.2, 3.32); prof.lineTo(1.2, 3.08);
  prof.lineTo(.35, 3.08); prof.quadraticCurveTo(-.04, 3.08, -.04, 2.7); prof.lineTo(-.04, 0); prof.lineTo(CW + .12, 0); prof.lineTo(CW + .12, -.75); prof.lineTo(-.28, -.75);
  const ring = new THREE.ExtrudeGeometry(prof, { depth: .2, bevelEnabled: false, curveSegments: 10 }); ring.rotateY(-HP);
  f.add(mc('tshell|' + L + '|' + CW, ({ add }) => {
    for (const u of [-L / 2 - .02, L / 2 + .22]) {
      add(ring, NAVY_B, u, 0, 0);
      add(G.box(.22, .14, .3, .01), ORANGE, u - .1, .12, -.14); add(G.box(.22, .1, CW + .38, .01), ORANGE, u - .1, -.2, CW / 2 - .04);
      add(G.box(.23, .05, CW, .01), CREAM, u - .1, .02, CW / 2 + .06);
    }
    for (const u of [-L / 2 + 1.1, L / 2 - 1.1]) {
      add(G.box(1.3, .22, CW - .9, .03), '#2f3440', u, -.95, CW / 2);
      for (const du of [-.38, .38]) for (const z of [.55, CW - .55]) { add(G.cyl(.3, .3, .14, 22), '#3a3f4c', u + du, -1.05, z, HP, 0, 0); add(G.cyl(.12, .12, .16, 14), '#c3c7d0', u + du, -1.05, z, HP, 0, 0); }
      add(G.box(.3, .2, .2, .03), '#55606e', u, -.8, CW - .3);
    }
  }));
};

// 간식 카트 2 (1×1): the same trolley, bigger, so it reads at once
B.tcart2 = (f, T) => {
  B.tcart(f, T);
  // (scaled as one group, not child by child: the tray that rises from inside kept its unscaled height and stayed down in the
  // cart when the lid opened — ② 10/22, the bot never once saw the note in it)
  const rg = grp(); [...f.group.children].forEach(c => rg.add(c)); rg.scale.setScalar(1.3); f.add(rg);
  if (f.lockAt) f.lockAt = { x: f.lockAt.x * 1.3, y: f.lockAt.y * 1.3, z: f.lockAt.z * 1.3 };
};

export const TRAINCAR_BUILDERS = B;
export const TRAINCAR_INFO = {
  tbench: { w: 2, d: 1, name: '긴 벤치', hidden: true },
  twindow: { wall: true, span: 2, name: '기차 창', hidden: true },
  trailrack: { wall: true, span: 8, name: '손잡이 봉과 짐 선반', hidden: true },
  tdoorend: { wall: true, span: 2, name: '연결문', hidden: true },
  tcart: { w: 1, d: 1, name: '간식 카트', hidden: true },
  tbench2: { w: 2, d: 1, name: '긴 벤치', hidden: true },
  twindow2: { wall: true, span: 2, name: '기차 창', hidden: true },
  trailrack2: { wall: true, span: 7, name: '손잡이 봉과 짐 선반', hidden: true },
  tdoorend2: { wall: true, span: 5, name: '연결문', hidden: true },
  tshell: { wall: true, span: 1, name: '차체', hidden: true },
  tcart2: { w: 1, d: 1, name: '간식 카트', hidden: true },
};

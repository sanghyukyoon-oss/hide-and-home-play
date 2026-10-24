// 내 방 지붕 (⑥ 10/24 밤 — 사용자 "지붕 좀 별로라서 니가 완전 새롭게 다시 만들어주면 좋겠어"): eight new roofs, each a house with a
// theme you read at once — 빨간 기와, 북유럽 판자, 일본 기와, 버섯 초가, 온실 유리, 캔디 줄무늬, 별 관측 돔, 옥상 정원. Same rules as
// before (the room stays open): a canopy over only the rear 28% of the room on four timber posts, never a lid; local north is
// -Z, +Z the open cut-away. Ink-outlined cel shading, big faces soft, small things the point colours.
// The four old GPT roofs' ids carry on as aliases (a save that bought one keeps a roof — the new one in its place).
import * as THREE from 'three';
import { shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { EN } from '../i18n-en-dict.js';

const PI = Math.PI, HP = PI / 2;
const K = (ko, en) => { EN[ko] = en; return ko; };
export const GPT_ROOFS = [
  { id: 'gpt_roof_none', name: K('지붕 없음', 'No roof'), price: 0, ch: 1, sw: ['#f6e0bf', '#e1d5e3'] },
  { id: 'roof_redtile', name: K('빨간 기와 지붕', 'Red Tile Roof'), price: 900, ch: 1, sw: ['#d9765a', '#f6eee4'] },
  { id: 'roof_nordic', name: K('북유럽 판자 지붕', 'Nordic Plank Roof'), price: 950, ch: 1, sw: ['#6f86a0', '#f4efe6'] },
  { id: 'roof_kawara', name: K('일본 기와 지붕', 'Japanese Tile Roof'), price: 1050, ch: 2, sw: ['#7d8a9c', '#f3efe6'] },
  { id: 'roof_candy', name: K('캔디 줄무늬 지붕', 'Candy Stripe Roof'), price: 1100, ch: 2, sw: ['#f59ab4', '#fff6f8'] },
  { id: 'roof_mushroom', name: K('버섯 초가 지붕', 'Mushroom Thatch Roof'), price: 1150, ch: 3, sw: ['#e2685a', '#e8cf98'] },
  { id: 'roof_glass', name: K('온실 유리 지붕', 'Greenhouse Glass Roof'), price: 1250, ch: 3, sw: ['#cfeae4', '#ffffff'] },
  { id: 'roof_garden', name: K('옥상 정원', 'Rooftop Garden'), price: 1450, ch: 4, sw: ['#c9a87a', '#8fc07a'] },
  { id: 'roof_observatory', name: K('별 관측 돔', 'Stargazing Dome'), price: 1600, ch: 4, sw: ['#f2f0ec', '#5d6fa8'] },
];
// the old roofs (GPT 10/22) → the new one that takes their place (bought ones stay owned, rooms keep a roof)
export const ROOF_ALIAS = { gpt_roof_shingle: 'roof_redtile', gpt_roof_tile: 'roof_kawara', gpt_roof_storybook: 'roof_mushroom', gpt_roof_garden: 'roof_garden' };
export const roofId = id => ROOF_ALIAS[id] || id;

// shared timber and trims
const WOOD = '#c9976a', WOODD = '#9c7350', TRIM = '#f4ebdc';
const band = (W, D, H) => {
  const B = Math.min(1.9, D * .28), zBack = -D / 2 - .12, zFront = -D / 2 + B;
  return { B, zBack, zFront, zc: (zBack + zFront) / 2, half: (zFront - zBack) / 2, totalW: W + .3 };
};
// four posts inboard of the walls (their feet are the roof's only footprint — room.js roofConflicts), beams front and back
function frame(add, tube, W, zBack, zFront, H, wood = WOOD, foot = TRIM) {
  const x = W / 2 - .14;
  for (const sx of [-1, 1]) for (const z of [zBack + .16, zFront - .16]) {
    add(G.box(.15, H, .15, .025), wood, sx * x, H / 2, z);
    add(G.box(.22, .1, .22, .025), foot, sx * x, .05, z);
    add(G.box(.2, .1, .2, .02), foot, sx * x, H - .05, z);
    tube([sx * x, H - .42, z], [sx * (x - .3), H - .06, z], .042, wood, 6);
  }
  for (const z of [zFront - .16, zBack + .16]) add(G.box(W - .12, .15, .17, .025), wood, 0, H - .025, z);
}
// a point on a gable slope: u 0 at the ridge → half at the eave; side +1 the front slope, -1 the back
const onSlope = (ridge, rise, half, zc, side, u) => [ridge - rise * u / half, zc + side * u];
// a little weathervane: a post, crossed arms, an arrow and a cockerel cut-out on top
function vane(add, tube, x, y, z, c = '#4a4458', bird = '#e2685a') {
  tube([x, y, z], [x, y + .5, z], .015, c, 5);
  add(G.box(.26, .014, .014, .004), c, x, y + .22, z); add(G.box(.014, .014, .26, .004), c, x, y + .22, z);
  add(G.box(.32, .018, .018, .004), c, x, y + .4, z); add(G.cone(.04, .07, 4), c, x + .17, y + .4, z, 0, 0, -HP);
  const s = new THREE.Shape(); s.moveTo(-.07, 0); s.lineTo(.06, 0); s.quadraticCurveTo(.1, .05, .08, .1); s.lineTo(.05, .07); s.quadraticCurveTo(.02, .12, -.02, .08); s.quadraticCurveTo(-.09, .1, -.1, .03); s.closePath();
  add(G.ext(s, .012, .003, 4), bird, x - .01, y + .45, z - .006);
}

// ── 빨간 기와: a Mediterranean gable of rounded terracotta barrel tiles, white stucco gable ends with a round vent, a white
// chimney with a little tiled cap, a cockerel weathervane on the ridge and a flower box of geraniums under the front eave
function redtile(add, tube, W, D, H) {
  const { zBack, zFront, zc, half, totalW } = band(W, D, H), rise = Math.min(.66, .38 + half * .22), ridge = H + rise + .1, ang = Math.atan2(rise, half), len = Math.hypot(half, rise);
  const T1 = '#d98a70', T2 = '#c97a63', ST = '#f6eee4';
  frame(add, tube, W, zBack, zFront, H);
  for (const side of [-1, 1]) {
    add(G.box(totalW, .08, len + .05, .02), shade(T2, -.12), 0, ridge - rise / 2 - .04, zc + side * half / 2, side * ang);
    const n = Math.max(10, Math.round(totalW / .19)), tw = totalW / n, rows = 4;
    for (let r = 0; r < rows; r++) {
      const u = half * (r + .5) / rows, [y, z] = onSlope(ridge, rise, half, zc, side, u), L = len / rows + .05;
      for (let c = 0; c < n; c++) {
        const x = -totalW / 2 + (c + .5) * tw, col = (c + r * 2) % 5 === 0 ? shade(T1, .05) : c % 2 ? T2 : T1;
        add(new THREE.CylinderGeometry(tw * .55, tw * .55, L, 8, 1, true, HP, PI), col, x, y + .01 + (c % 2 ? .02 : 0), z, HP + side * ang, 0, 0);
      }
    }
    add(G.box(totalW + .08, .1, .1, .03), WOOD, 0, H + .02, zc + side * (half + .03));
  }
  const caps = Math.max(10, Math.round(totalW / .26));
  for (let k = 0; k < caps; k++) add(new THREE.CylinderGeometry(.09, .09, totalW / caps + .03, 10, 1, false, HP, PI), k % 2 ? T1 : T2, -totalW / 2 + (k + .5) * totalW / caps, ridge + .045, zc, 0, 0, HP);
  // stucco gable ends with a round vent
  for (const sx of [-1, 1]) {
    const s = new THREE.Shape(); s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, rise); s.closePath();
    add(G.ext(s, .06, .01, 2), ST, sx * (totalW / 2 - .02) - (sx > 0 ? .06 : 0), H + .05, zc, 0, HP, 0);
    add(G.cyl(.09, .09, .07, 14), shade(ST, -.08), sx * (totalW / 2 + .02), H + .05 + rise * .4, zc, 0, 0, HP);
    for (let k = -1; k <= 1; k++) add(G.box(.075, .012, .012, .003), WOODD, sx * (totalW / 2 + .055), H + .05 + rise * .4 + k * .03, zc);
  }
  // chimney
  { const cx = W * .28, [cy, cz] = onSlope(ridge, rise, half, zc, -1, half * .35);
    add(G.box(.32, .7, .3, .03), ST, cx, cy + .22, cz); add(G.box(.4, .06, .38, .02), shade(ST, -.1), cx, cy + .58, cz);
    add(new THREE.CylinderGeometry(.13, .13, .4, 8, 1, false, HP, PI), T1, cx, cy + .66, cz, 0, 0, HP); }
  vane(add, tube, -W * .28, ridge + .1, zc);
  // a flower box of geraniums under the front eave
  { const fz = zFront + .05, fy = H - .38;
    add(G.box(1.1, .16, .2, .03), T2, -W * .12, fy, fz); add(G.box(1.06, .03, .16, .01), '#7a5a3e', -W * .12, fy + .08, fz);
    for (let k = 0; k < 7; k++) { const x = -W * .12 - .45 + k * .15; add(G.sph(.065, 8, 6), '#6fae6a', x, fy + .14, fz, 0, k, 0, [1.1, .8, 1]); add(G.sph(.04, 8, 6), k % 2 ? '#ff6f7a' : '#ff9eb0', x + .02, fy + .2, fz + .03); }
    for (const s of [-1, 1]) tube([-W * .12 + s * .45, fy - .06, fz - .02], [-W * .12 + s * .45, H - .08, zFront - .1], .015, '#4a4458', 4); }
  return { ridge };
}

// ── 북유럽 판자: a steep gable of slate-blue boards with raised seams, white scalloped bargeboards, a pale timber gable end with
// a little cross window, a black stove pipe with a hat, and a birdhouse on a post at the side
function nordic(add, tube, W, D, H) {
  const { zBack, zFront, zc, half, totalW } = band(W, D, H), rise = Math.min(.95, .55 + half * .3), ridge = H + rise + .1, ang = Math.atan2(rise, half), len = Math.hypot(half, rise);
  const R1 = '#6f86a0', R2 = '#5f7690', WH = '#f8f4ec', PL = '#e9d6b6';
  frame(add, tube, W, zBack, zFront, H, '#b98e66');
  for (const side of [-1, 1]) {
    const [y, z] = onSlope(ridge, rise, half, zc, side, half / 2);
    add(G.box(totalW, .09, len + .08, .02), R1, 0, y, z, side * ang);
    const n = Math.max(8, Math.round(totalW / .32));
    for (let k = 0; k <= n; k++) add(G.box(.035, .05, len + .06, .012), R2, -totalW / 2 + k * totalW / n, y + .06, z, side * ang);
    // the scalloped white bargeboard along the eave
    add(G.box(totalW + .1, .1, .07, .02), WH, 0, H + .03, zc + side * (half + .04));
    for (let k = 0; k < Math.round(totalW / .18); k++) add(G.sph(.055, 8, 6), WH, -totalW / 2 + .09 + k * .18, H - .02, zc + side * (half + .05), 0, 0, 0, [1, .8, .5]);
  }
  add(G.box(totalW + .06, .1, .16, .03), WH, 0, ridge + .06, zc);
  for (const sx of [-1, 1]) {
    // pale vertical boards on the gable end, white barge along its slopes, a cross window
    const s = new THREE.Shape(); s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, rise); s.closePath();
    const xg = sx * (totalW / 2 - .03);
    add(G.ext(s, .05, .006, 2), PL, xg - (sx > 0 ? .05 : 0), H + .04, zc, 0, HP, 0);
    for (let k = -3; k <= 3; k++) { const h = rise * (1 - Math.abs(k) / 4) * .95; add(G.box(.012, h, .012, .003), shade(PL, -.12), xg + sx * .03, H + .04 + h / 2, zc + k * half / 4); }
    for (const sd of [-1, 1]) add(G.box(.06, .07, len + .1, .02), WH, xg + sx * .04, ridge - rise / 2, zc + sd * half / 2, sd * ang);
    add(G.box(.06, .3, .26, .02), WH, xg + sx * .045, H + .04 + rise * .36, zc); add(G.box(.06, .24, .2, .01), '#9cc0d6', xg + sx * .055, H + .04 + rise * .36, zc);
    add(G.box(.07, .24, .02, .004), WH, xg + sx * .065, H + .04 + rise * .36, zc); add(G.box(.07, .02, .2, .004), WH, xg + sx * .065, H + .04 + rise * .36, zc);
  }
  // stove pipe with a hat
  { const [y, z] = onSlope(ridge, rise, half, zc, -1, half * .4); tube([W * .3, y - .05, z], [W * .3, y + .6, z], .07, '#3a3a48', 10); add(G.cone(.13, .1, 10), '#3a3a48', W * .3, y + .68, z); add(G.cyl(.09, .09, .03, 10), '#5b5672', W * .3, y + .6, z); }
  // a birdhouse on a post beside the front posts
  { const bx = -W / 2 + .12, bz = zFront + .1, by = H - .2;
    add(G.box(.24, .22, .2, .02), '#e2685a', bx, by, bz); const r = new THREE.Shape(); r.moveTo(-.16, 0); r.lineTo(.16, 0); r.lineTo(0, .13); r.closePath();
    add(G.ext(r, .24, .01, 2), R1, bx, by + .11, bz - .12); add(G.cyl(.04, .04, .022, 12), '#3a3a48', bx, by + .02, bz + .102, HP, 0, 0); add(G.cyl(.01, .01, .06, 6), WOODD, bx, by - .05, bz + .13, HP, 0, 0); }
  return { ridge };
}

// ── 일본 기와: a gently curved (sagging) gable of blue-grey round tiles in lines down the slope, a white-plastered ridge with
// dark end tiles, eave ends that curl up, a glass wind chime with its paper strip and a red paper lantern
function kawara(add, tube, W, D, H) {
  const { zBack, zFront, zc, half, totalW } = band(W, D, H), rise = Math.min(.72, .42 + half * .24), ridge = H + rise + .14;
  const KW = '#98a6b8', KD = '#7c8a9e', PLA = '#f3efe6';
  frame(add, tube, W, zBack, zFront, H, '#a8775a');
  const SEG = 4, prof = u => ridge - rise * (u / half) ** 1.35;   // a concave pitch: steep at the ridge, flattening to the eave
  for (const side of [-1, 1]) {
    for (let s = 0; s < SEG; s++) {
      const u0 = half * s / SEG, u1 = half * (s + 1) / SEG, y0 = prof(u0), y1 = prof(u1), L = Math.hypot(u1 - u0, y0 - y1) + .03, a = Math.atan2(y0 - y1, u1 - u0);
      const ym = (y0 + y1) / 2, zm = zc + side * (u0 + u1) / 2;
      add(G.box(totalW, .07, L, .01), KD, 0, ym - .03, zm, side * a);
      const n = Math.max(12, Math.round(totalW / .17));
      for (let c = 0; c < n; c++) add(new THREE.CylinderGeometry(.045, .045, L, 7, 1, true, HP, PI), (c + s) % 6 === 0 ? shade(KW, .06) : KW, -totalW / 2 + (c + .5) * totalW / n, ym + .015, zm, HP + side * a, 0, 0);
    }
    // the eave: a row of round tile ends, and corners curling up
    const ey = prof(half), ez = zc + side * (half + .02), n = Math.max(12, Math.round(totalW / .17));
    for (let c = 0; c < n; c++) add(G.cyl(.05, .05, .03, 10), KD, -totalW / 2 + (c + .5) * totalW / n, ey + .01, ez, HP, 0, 0);
    for (const sx of [-1, 1]) add(G.box(.22, .06, .14, .02), KD, sx * (totalW / 2 - .05), ey + .08, ez, 0, 0, sx * .5);
    add(G.box(totalW + .05, .09, .09, .02), '#a8775a', 0, H + .02, zc + side * (half - .05));
  }
  add(G.box(totalW + .06, .16, .22, .03), PLA, 0, ridge + .04, zc); add(G.box(totalW + .1, .06, .26, .02), KD, 0, ridge + .14, zc);
  for (const sx of [-1, 1]) { add(G.box(.12, .26, .3, .03), KD, sx * (totalW / 2 + .04), ridge + .12, zc); add(G.cyl(.05, .05, .04, 10), PLA, sx * (totalW / 2 + .1), ridge + .14, zc, 0, 0, HP); }
  // the wind chime and the lantern hang from the front beam
  const hy = H - .1, hz = zFront - .16;
  { const x = W * .2; tube([x, hy, hz], [x, hy - .2, hz], .004, '#c9c2b6', 3); add(G.sph(.07, 10, 8, ), '#bfe6f0', x, hy - .25, hz, 0, 0, 0, [1, .8, 1]); add(G.cyl(.065, .065, .01, 10), '#e2685a', x, hy - .28, hz); tube([x, hy - .29, hz], [x, hy - .42, hz], .003, '#c9c2b6', 3); add(G.box(.05, .12, .004, .002), '#fbf6ec', x, hy - .48, hz); }
  { const x = -W * .22; tube([x, hy, hz], [x, hy - .12, hz], .006, '#3a3a48', 3); add(G.cyl(.1, .1, .03, 12), '#3a3a48', x, hy - .14, hz); add(G.sph(.13, 12, 10), '#e5544a', x, hy - .3, hz, 0, 0, 0, [1, 1.25, 1]); for (const y of [-.24, -.3, -.36]) add(G.tor(.12, .006, PI * 2, 4, 16), '#b8433a', x, hy + y, hz, HP, 0, 0); add(G.cyl(.08, .08, .03, 12), '#3a3a48', x, hy - .47, hz); }
  return { ridge };
}

// ── 버섯 초가: a big red toadstool cap with white spots spread over the rear band, a straw thatch fringe hanging under its rim,
// a round window with a green shutter peeping out of the cap, little mushrooms and a snail on top
function mushroom(add, tube, W, D, H) {
  const { zBack, zFront, zc, half } = band(W, D, H), R = W / 2 + .2, cy = H + .02;
  const CAP = '#e8806e', DOT = '#fff8ee', STRAW = '#e8cf98', STRAW2 = '#d4b67a', CH = 1.25;
  frame(add, tube, W, zBack, zFront, H, '#b68a62');
  add(new THREE.SphereGeometry(1, 30, 12, 0, PI * 2, 0, HP), CAP, 0, cy, zc, 0, 0, 0, [R, CH, half + .32]);
  add(G.cyl(R, R, .06, 30), shade(CAP, -.12), 0, cy + .01, zc, 0, 0, 0, [1, 1, (half + .32) / R]);
  // white spots on the cap (each a flattened bead sunk into the surface)
  for (const [a, e, s] of [[.3, .55, .13], [1.2, .35, .1], [2.1, .62, .12], [2.9, .3, .09], [-.6, .4, .11], [-1.5, .58, .1], [-2.4, .32, .12], [0, .85, .09], [1.6, .82, .08], [-2.2, .8, .08]]) {
    const x = Math.cos(a) * Math.cos(e) * R, y = Math.sin(e) * CH, z = Math.sin(a) * Math.cos(e) * (half + .32);
    add(G.sph(1, 10, 8), DOT, x, cy + y - .02, zc + z, 0, -a, e - HP, [s * 1.4, s * .5, s * 1.4]);
  }
  // thatch fringe under the rim
  const n = Math.round(PI * 2 * R / .1);
  for (let k = 0; k < n; k++) { const a = k / n * PI * 2, x = Math.cos(a) * (R - .04), z = Math.sin(a) * (half + .28); add(G.cone(.07, .22 + (k % 3) * .04, 5), k % 2 ? STRAW : STRAW2, x, cy - .1, zc + z, PI, 0, 0); }
  // a round window in the cap with a little green shutter and a flower box
  { const wx = -W * .18, wy = cy + .55, wz = zc + (half + .32) * .78;
    add(G.cyl(.17, .17, .1, 18), '#f4ebdc', wx, wy, wz, HP, 0, 0); add(G.cyl(.13, .13, .11, 18), '#9cc0d6', wx, wy, wz, HP, 0, 0);
    add(G.box(.26, .02, .02, .004), '#f4ebdc', wx, wy, wz + .06); add(G.box(.02, .26, .02, .004), '#f4ebdc', wx, wy, wz + .06);
    add(G.box(.14, .28, .03, .02), '#6fae6a', wx + .22, wy, wz - .02, 0, -.5, 0); add(G.box(.32, .07, .1, .02), '#b68a62', wx, wy - .2, wz + .04);
    for (let k = 0; k < 4; k++) add(G.sph(.035, 8, 6), ['#ff9eb0', '#ffe27a', '#fff8ee', '#bda7ff'][k], wx - .11 + k * .075, wy - .14, wz + .05); }
  // little mushrooms and a snail on top
  for (const [x, z, s] of [[W * .2, .1, 1], [W * .27, .25, .7], [-W * .32, -.1, .8]]) { add(G.cyl(.035 * s, .045 * s, .12 * s, 8), DOT, x, cy + (CH - .06) * (1 - (x / R) ** 2) ** .5 + .04, zc + z); add(G.sph(.09 * s, 10, 6), '#ffb84a', x, cy + (CH - .06) * (1 - (x / R) ** 2) ** .5 + .12 * s, zc + z, 0, 0, 0, [1, .55, 1]); }
  { const sx = W * .05, sy = cy + CH - .02, sz = zc + .1; add(G.tor(.045, .025, PI * 2, 6, 14), '#c98a52', sx, sy + .06, sz, 0, 0, 0); add(G.cap(.025, .14, 2, 6), '#e8d9b8', sx + .05, sy + .01, sz, 0, 0, HP); for (const s of [-1, 1]) tube([sx + .11, sy + .03, sz + s * .012], [sx + .14, sy + .08, sz + s * .02], .005, '#e8d9b8', 3); }
  return { ridge: cy + CH };
}

// ── 온실 유리: a white-framed glass gable — pale mint panes between slim white glazing bars, one roof light propped open, a
// gutter, pots of herbs on a shelf under the front beam and a trailing ivy basket
function glass(add, tube, W, D, H) {
  const { zBack, zFront, zc, half, totalW } = band(W, D, H), rise = Math.min(.7, .4 + half * .25), ridge = H + rise + .08, ang = Math.atan2(rise, half), len = Math.hypot(half, rise);
  const GL = '#d9f0ea', GL2 = '#c4e6df', FR = '#ffffff';
  frame(add, tube, W, zBack, zFront, H, '#f4f2ee', '#e2ddd4');
  const n = Math.max(6, Math.round(totalW / .45)), pw = totalW / n;
  for (const side of [-1, 1]) {
    const [y, z] = onSlope(ridge, rise, half, zc, side, half / 2);
    for (let k = 0; k < n; k++) {
      const x = -totalW / 2 + (k + .5) * pw, open = side > 0 && k === Math.floor(n * .7);
      if (open) { const [oy, oz] = onSlope(ridge, rise, half, zc, side, half * .25); add(G.box(pw - .04, .025, len * .5, .01), GL2, x, oy + .12, oz, side * ang - .35); add(G.box(.02, .14, .02, .004), FR, x, oy + .05, oz + .12); continue; }
      add(G.box(pw - .03, .02, len, .006), k % 2 ? GL : GL2, x, y, z, side * ang);
      add(G.box(pw * .3, .022, len * .7, .004), '#f4fffb', x - pw * .2, y + .005, z, side * ang, 0, .02);
    }
    for (let k = 0; k <= n; k++) add(G.box(.045, .05, len + .04, .01), FR, -totalW / 2 + k * pw, y + .02, z, side * ang);
    add(G.box(totalW + .06, .06, .06, .015), FR, 0, H + .02, zc + side * (half + .02));
    tube([-totalW / 2, H - .03, zc + side * (half + .08)], [totalW / 2, H - .03, zc + side * (half + .08)], .035, '#c9cfd6', 8);
  }
  add(G.box(totalW + .06, .07, .08, .02), FR, 0, ridge + .02, zc);
  for (const sx of [-1, 1]) {
    const s = new THREE.Shape(); s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, rise); s.closePath();
    add(G.ext(s, .02, 0, 2), GL, sx * (totalW / 2 - .01) - (sx > 0 ? .02 : 0), H + .02, zc, 0, HP, 0);
    for (let k = -2; k <= 2; k++) { const h = rise * (1 - Math.abs(k) / 3); add(G.box(.03, h, .03, .006), FR, sx * (totalW / 2), H + .02 + h / 2, zc + k * half / 3); }
  }
  // a shelf of herb pots under the front beam, an ivy basket hanging at the corner
  { const sy = H - .48, sz = zFront - .08;
    add(G.box(W * .6, .04, .2, .01), '#e2ddd4', 0, sy, sz); for (const s of [-1, 1]) add(G.box(.04, .2, .14, .01), '#e2ddd4', s * W * .28, sy + .1, sz - .04);
    for (let k = 0; k < 5; k++) { const x = -W * .24 + k * W * .12; add(G.cyl(.065, .05, .11, 10), k % 2 ? '#d98b5f' : '#e8b089', x, sy + .075, sz); add(G.sph(.08, 8, 6), ['#6fae6a', '#8fc07a', '#5aa65e'][k % 3], x, sy + .17, sz, 0, k, 0, [1, .9, 1]); }
    const ix = W / 2 - .45, iy = H - .45; for (const s of [-1, 1]) tube([ix, H - .1, sz - .02], [ix + s * .1, iy + .05, sz], .004, '#c9c2b6', 3);
    add(G.sph(.13, 12, 8, ), '#c98a52', ix, iy, sz, 0, 0, 0, [1, .5, 1]); for (let k = 0; k < 6; k++) add(G.sph(.05, 8, 6), '#6fae6a', ix + Math.cos(k) * .12, iy - .05 - (k % 3) * .07, sz + Math.sin(k) * .08); }
  return { ridge };
}

// ── 캔디 줄무늬: a candy-shop awning roof — wide pink and white stripes, a scalloped valance, white icing drips along the ridge
// with sprinkles, gumdrops on top, lollipops on the posts and a candy cane hooked on the beam
function candy(add, tube, W, D, H) {
  const { zBack, zFront, zc, half, totalW } = band(W, D, H), rise = Math.min(.6, .34 + half * .22), ridge = H + rise + .08, ang = Math.atan2(rise, half), len = Math.hypot(half, rise);
  const PK = '#f59ab4', WT = '#fff6f8', MINT = '#8fdccb';
  frame(add, tube, W, zBack, zFront, H, '#f4c9d8', WT);
  const n = Math.max(8, Math.round(totalW / .34)), sw = totalW / n;
  for (const side of [-1, 1]) {
    const [y, z] = onSlope(ridge, rise, half, zc, side, half / 2);
    for (let k = 0; k < n; k++) add(G.box(sw + .004, .07, len + .04, .015), k % 2 ? WT : PK, -totalW / 2 + (k + .5) * sw, y, z, side * ang);
    // the scalloped valance
    for (let k = 0; k < n; k++) add(new THREE.CylinderGeometry(sw / 2, sw / 2, .03, 12, 1, false, 0, PI), k % 2 ? WT : PK, -totalW / 2 + (k + .5) * sw, H - .02, zc + side * (half + .04), HP, 0, side > 0 ? PI : 0);
    add(G.box(totalW + .06, .08, .06, .02), MINT, 0, H + .04, zc + side * (half + .03));
  }
  // icing along the ridge, drips, sprinkles, gumdrops
  add(G.cyl(.1, .1, totalW + .1, 12), WT, 0, ridge + .03, zc, 0, 0, HP);
  for (let k = 0; k < Math.round(totalW / .22); k++) { const x = -totalW / 2 + .11 + k * .22; for (const side of [-1, 1]) { const d = .08 + (k * 7 % 3) * .05, [y, z] = onSlope(ridge, rise, half, zc, side, d); add(G.cap(.035, d * .9, 2, 6), WT, x, y + .06, z, side * (HP - ang), 0, 0); } }
  for (let k = 0; k < 14; k++) add(G.box(.04, .012, .012, .003), ['#ff6f7a', '#7fb5ff', '#ffe27a', MINT][k % 4], -totalW / 2 + .15 + k * totalW / 14, ridge + .13, zc + (k % 2 ? .04 : -.04), 0, k, 0);
  for (const [x, c] of [[-W * .3, '#ff6f7a'], [-W * .05, MINT], [W * .22, '#bda7ff']]) add(G.sph(.1, 12, 8), c, x, ridge + .17, zc, 0, 0, 0, [1, .8, 1]);
  // lollipops on the front posts, a candy cane on the beam
  for (const sx of [-1, 1]) { const x = sx * (W / 2 - .14), z = zFront - .16; add(G.cyl(.16, .16, .05, 18), WT, x, H + .32, z + .1, HP, 0, 0); for (let k = 0; k < 4; k++) add(G.tor(.04 + k * .03, .012, PI * 2, 4, 18), k % 2 ? PK : MINT, x, H + .32, z + .13); tube([x, H + .06, z + .1], [x, H + .18, z + .1], .015, WT, 5); }
  { const x = W * .1, y = H - .2, z = zFront - .06; for (let k = 0; k < 6; k++) add(G.cyl(.025, .025, .06, 8), k % 2 ? WT : '#ff6f7a', x, y - .2 + k * .06, z); add(G.tor(.06, .025, PI, 6, 10), '#ff6f7a', x + .06, y + .17, z); }
  return { ridge };
}

// ── 별 관측 돔: a flat roof deck with a white dome — its slit open on the night, a telescope poking out — a star pennant, a
// little antenna with a red light and a deck rail; the front of the deck is free to stand things on
function observatory(add, tube, W, D, H) {
  const { B, zBack, zFront, zc } = band(W, D, H), deckY = H + .2, DM = '#f2f0ec', NV = '#5d6fa8';
  frame(add, tube, W, zBack, zFront, H, '#8f9bb8', '#d6dbe2');
  add(G.box(W + .3, .22, B + .2, .04), '#d6dbe2', 0, H + .02, zc); add(G.box(W + .36, .06, B + .26, .02), '#a9b2c4', 0, H + .14, zc);
  for (let k = 0; k < Math.round((W + .2) / .4); k++) add(G.box(.38, .02, B + .05, .006), k % 2 ? '#c9cfe0' : '#d6dbe2', -W / 2 - .1 + .2 + k * .4, deckY - .03, zc);
  // the dome on a drum, with its slit and the telescope
  const dx = -W * .18, dr = Math.min(.85, B * .5), dz = zBack + dr + .12;
  add(G.cyl(dr + .04, dr + .06, .24, 24), '#e2ddd4', dx, deckY + .1, dz);
  add(new THREE.SphereGeometry(dr, 24, 12, 0, PI * 2, 0, HP), DM, dx, deckY + .22, dz);
  for (let k = 0; k < 8; k++) add(new THREE.TorusGeometry(dr + .004, .008, 4, 24, PI), '#c9cfe0', dx, deckY + .22, dz, 0, k * PI / 8, 0);
  add(G.box(.22, dr * 1.02, .06, .02), '#2b3a6e', dx, deckY + .22 + dr * .5, dz + dr * .62, -.62, 0, 0);
  tube([dx, deckY + .5, dz + .2], [dx + .1, deckY + .95, dz + .75], .07, NV, 10, .09); add(G.cyl(.1, .1, .06, 12), '#e2b448', dx + .1, deckY + .95, dz + .75, .9, 0, -.2);
  for (let k = 0; k < 3; k++) { const a = k * 2.1; add(G.sph(.035, 6, 5), '#ffe27a', dx + Math.cos(a) * .3, deckY + dr + .35 + k * .08, dz + Math.sin(a) * .2, 0, 0, 0, [1, 1, .3]); }
  // a pennant with a star, an antenna with a red light, a deck rail
  { const px = W * .32, pz = zBack + .25; tube([px, deckY, pz], [px, deckY + 1.1, pz], .018, '#c9cfe0', 5); const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(.42, .12); s.lineTo(0, .24); s.closePath(); add(G.ext(s, .01, 0, 2), NV, px, deckY + .82, pz); add(G.sph(.03, 6, 5), '#ffe27a', px + .13, deckY + .94, pz + .01, 0, 0, 0, [1, 1, .4]); }
  { const ax = W * .12, az = zBack + .2; tube([ax, deckY, az], [ax, deckY + .7, az], .012, '#a9b2c4', 4); for (const y of [.35, .5]) add(G.box(.3, .012, .012, .003), '#a9b2c4', ax, deckY + y, az); add(G.sph(.03, 8, 6), '#ff5a5a', ax, deckY + .72, az); }
  for (const sx of [-1, 1]) { for (let k = 0; k < 5; k++) add(G.cyl(.016, .016, .4, 6), '#a9b2c4', sx * (W / 2 + .08), deckY + .2, zBack + .1 + k * (B / 4)); add(G.cyl(.02, .02, B, 6), '#a9b2c4', sx * (W / 2 + .08), deckY + .4, zc, HP, 0, 0); }
  add(G.cyl(.02, .02, W + .16, 6), '#a9b2c4', 0, deckY + .4, zBack + .08, 0, 0, HP);
  return { deckY };
}

// ── 옥상 정원: a timber deck on the canopy with a low parapet, a raised vegetable bed (lettuces, tomatoes on canes, a
// scarecrow mochi), a string of little lights on two poles, a round table with two stools and a birdbath
function garden(add, tube, W, D, H) {
  const { B, zBack, zFront, zc } = band(W, D, H), deckY = H + .17, P = '#e9d9b9';
  frame(add, tube, W, zBack, zFront, H);
  add(G.box(W + .3, .22, B + .22, .045), WOOD, 0, H + .015, zc); add(G.box(W + .36, .09, B + .28, .03), TRIM, 0, H + .11, zc);
  for (let k = 0; k < Math.round((W + .2) / .3); k++) add(G.box(.28, .025, B + .09, .008), k % 3 ? '#dcc49d' : '#e8d5b0', -W / 2 - .1 + .15 + k * .3, deckY, zc);
  add(G.box(W + .22, .32, .14, .035), P, 0, deckY + .15, zBack - .02); add(G.box(W + .28, .06, .2, .025), TRIM, 0, deckY + .33, zBack - .02);
  for (const sx of [-1, 1]) { add(G.box(.14, .32, B + .12, .035), P, sx * (W / 2 + .07), deckY + .15, zc); add(G.box(.2, .06, B + .16, .025), TRIM, sx * (W / 2 + .07), deckY + .33, zc); }
  // the raised bed of vegetables
  const bx = -W * .22, bz = zBack + .4, bw = Math.min(1.5, W * .36);
  add(G.box(bw, .28, .5, .03), '#b98e66', bx, deckY + .14, bz); add(G.box(bw - .08, .03, .42, .01), '#7a5a3e', bx, deckY + .27, bz);
  for (let k = 0; k < 4; k++) { const x = bx - bw / 2 + .2 + k * (bw - .4) / 3; for (let n = 0; n < 5; n++) add(G.sph(.055, 8, 6), n % 2 ? '#8fc07a' : '#a8d48a', x + Math.cos(n * 1.3) * .05, deckY + .32, bz - .1 + Math.sin(n * 1.3) * .05, 0, n, .4, [1, .7, 1]); }
  for (let k = 0; k < 3; k++) { const x = bx - bw / 2 + .25 + k * (bw - .5) / 2, z = bz + .13; tube([x, deckY + .27, z], [x, deckY + .8, z], .012, '#c9a26a', 4); for (let n = 0; n < 4; n++) add(G.sph(.05, 8, 6), '#6fae6a', x + (n % 2 ? .04 : -.04), deckY + .42 + n * .09, z, 0, 0, 0, [1, .7, .8]); for (const y of [.5, .65]) add(G.sph(.035, 8, 6), '#ff6f5a', x + .04, deckY + y, z + .03); }
  { const sx = bx + bw / 2 - .1, sz = bz - .08; tube([sx, deckY + .27, sz], [sx, deckY + .8, sz], .014, '#c9a26a', 4); add(G.box(.32, .03, .03, .006), '#c9a26a', sx, deckY + .62, sz); add(G.sph(.1, 12, 8), '#fff6ee', sx, deckY + .82, sz); add(G.cone(.14, .1, 10), '#e8cf98', sx, deckY + .93, sz); for (const s of [-1, 1]) add(G.sph(.012, 6, 5), '#2a1d33', sx + s * .035, deckY + .83, sz + .09); }
  // the string of lights
  { const z = zFront - .1; for (const sx of [-1, 1]) tube([sx * (W / 2 - .05), deckY, z], [sx * (W / 2 - .05), deckY + .95, z], .02, WOODD, 5);
    const n = 9; for (let k = 0; k < n; k++) { const t = k / (n - 1), x = -(W / 2 - .05) + t * (W - .1), y = deckY + .93 - .22 * 4 * t * (1 - t); add(G.sph(.035, 8, 6), ['#ffe27a', '#ff9eb0', '#bfe6f0'][k % 3], x, y - .05, z); if (k < n - 1) { const t2 = (k + 1) / (n - 1); tube([x, y, z], [-(W / 2 - .05) + t2 * (W - .1), deckY + .93 - .22 * 4 * t2 * (1 - t2), z], .004, '#4a4458', 3); } } }
  // a round table, two stools, a birdbath
  { const tx = W * .2, tz = zc + .05; add(G.cyl(.3, .3, .04, 18), '#f4ebdc', tx, deckY + .45, tz); add(G.cyl(.03, .04, .43, 8), WOODD, tx, deckY + .22, tz); add(G.cyl(.15, .17, .03, 12), WOODD, tx, deckY + .015, tz);
    add(G.cyl(.05, .04, .1, 10), '#e8b089', tx + .08, deckY + .52, tz); add(G.sph(.06, 8, 6), '#ff9eb0', tx + .08, deckY + .6, tz);
    for (const s of [-1, 1]) { add(G.cyl(.14, .14, .04, 12), '#8fc07a', tx + s * .42, deckY + .3, tz); for (const k of [0, 1, 2]) { const a = k * 2.1; tube([tx + s * .42 + Math.cos(a) * .1, deckY, tz + Math.sin(a) * .1], [tx + s * .42 + Math.cos(a) * .07, deckY + .28, tz + Math.sin(a) * .07], .012, WOODD, 4); } } }
  { const x = W * .38, z = zBack + .3; add(G.cyl(.06, .1, .35, 10), '#d6cfc2', x, deckY + .17, z); add(G.cyl(.2, .14, .06, 14), '#d6cfc2', x, deckY + .37, z); add(G.cyl(.16, .16, .01, 14), '#9cd0e4', x, deckY + .395, z); add(G.sph(.04, 8, 6), '#7fb5ff', x + .1, deckY + .44, z, 0, 0, 0, [1.3, 1, 1]); }
  return { deckY };
}

const BUILD = { roof_redtile: redtile, roof_nordic: nordic, roof_kawara: kawara, roof_mushroom: mushroom, roof_glass: glass, roof_candy: candy, roof_observatory: observatory, roof_garden: garden };
const DECKS = { roof_garden: [.17, 0], roof_observatory: [.2, .22] };   // (a roof you can stand things on: its deck height over the wall top, and where on it — a fraction of W)

/**
 * Full-room coordinates, at floor y=0. turn is a quarter turn (same +Y convention as furniture).
 * Width/depth swap BEFORE construction at odd turns, so rectangular rooms still get a full-width rear band.
 * theme.wallH may override room.js's default 2.5 m wall top.
 * userData.gptRoofSpots is in this group's LOCAL coordinates: f.spot(s.kind, roof, s.x,s.y,s.z, s).
 * userData.gptRoofColumns contains local floor rectangles; transform through this group for placement/collision.
 */
export function makeGptRoof(id, w, d, theme = {}, turn = 0) {
  id = roofId(id);
  if (!id || id === 'gpt_roof_none') return null;
  const root = new THREE.Group(); root.name = id;
  const n = ((Math.round(turn) % 4) + 4) % 4;
  root.rotation.y = n * HP;
  root.userData.gptRoof = id;
  root.userData.gptRoofSpots = [];
  root.userData.gptRoofColumns = [];
  if (!BUILD[id] || !Number.isFinite(w) || !Number.isFinite(d) || w < 2 || d < 2) return root;
  const W = n % 2 ? d : w, D = n % 2 ? w : d, H = Number.isFinite(theme.wallH) ? theme.wallH : 2.5;
  // every input affecting geometry is in the key: a new room size or wall height can't reuse a stale roof
  const key = ['homeroof-v1', id, W, D, H].join('|');
  root.add(mc(key, ({ add, tube }) => { BUILD[id](add, tube, W, D, H); }));
  // (mc's closure does not run on a cache hit: the metadata is worked out here, apart from the geometry)
  const { B, zFront, zc } = band(W, D, H);
  for (const sx of [-1, 1]) for (const z of [-D / 2 - .12 + .16, zFront - .16]) root.userData.gptRoofColumns.push({ x: sx * (W / 2 - .14), z, w: .22, d: .22 });
  root.userData.gptRoofSpots.push({ x: W * .24, y: .025, z: zc + .12, kind: 'under', label: K('지붕 아래', 'Under the roof'), maxH: .62, scale: 1 });
  if (DECKS[id]) root.userData.gptRoofSpots.push({ x: W * DECKS[id][1], y: H + DECKS[id][0], z: zFront - .4, kind: 'on', label: K('옥상 데크 위', 'On the roof deck'), maxH: .45, scale: .9 });
  root.userData.gptRoofCoverage = { depth: B, fraction: B / D, front: zFront, wallHeight: H };
  return root;
}

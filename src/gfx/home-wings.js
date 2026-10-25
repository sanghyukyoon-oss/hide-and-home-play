// 내 방 곁 공간 (⑥ 10/26 — 사용자 "방 넓히는 거 위주로 약간 더 추가해주고"): pieces of home built onto the outside of the room, bought
// in 상점 · 방 크기 after the size steps. Each stands on its own little slab level with the room's floor, outside one wall, so nothing
// inside the room moves and no furniture has to make way:
//   veranda    베란다   — a timber deck along the front (S) wall: white rail, planters, a folding chair, a bench whose lid lifts
//   greenhouse 온실 칸   — a white-framed glass lean-to on the back half of the right (E) wall: seedling shelves, a lemon tree, a door
//   flowerbed  꽃마당   — a grassy patch on the front half of the right (E) wall: a picket fence, flower beds, a birdbath, a doghouse
// Room coordinates (the room's centre at 0, floor y 0, walls at x ±w/2 and z ±d/2). room.js builds them before the roof, so a
// room with no wings keeps the decor numbers it always had; their prepared spots have keys of their own ('w<id>:n', room.js
// indexSpots), so they hold whatever else changes.
import * as THREE from 'three';
import { put, grp, mat, mesh, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { EN } from '../i18n-en-dict.js';

const PI = Math.PI, HP = PI / 2;
const K = (ko, en) => { EN[ko] = en; return ko; };
const BASE = '#e8c49a';
// need: the room size step it asks for (catalog.js ZONE_SIZES index)
export const WINGS = [
  { id: 'veranda', name: K('베란다', 'Veranda'), sub: K('앞 벽 밖 나무 데크', 'A timber deck outside the front wall'), price: 600, need: 1, sw: ['#d9a466', '#ffffff'] },
  { id: 'flowerbed', name: K('꽃마당', 'Flower Yard'), sub: K('오른쪽 앞 잔디 마당', 'A little lawn by the right wall'), price: 900, need: 2, sw: ['#8fc07a', '#ff9eb0'] },
  { id: 'greenhouse', name: K('온실 칸', 'Greenhouse Nook'), sub: K('오른쪽 뒤 유리 온실', 'A glass lean-to by the right wall'), price: 1300, need: 3, sw: ['#cfeae4', '#ffffff'] },
];
export const WING_IDS = WINGS.map(w => w.id);
K('곁 공간이 이상해요', 'A side space is invalid'); K('곁 공간', 'Side spaces'); K('붙이기', 'Add'); K('떼기', 'Remove');
// the ground each wing covers, room coords — the home's camera frames it (myhome.js mapBox)
// (each starts a hand inside the room's own slab — room.js 'cake', w + .5 — so the two read as one base; with the veranda and the
// flower yard both on, the veranda runs on across the corner between them)
export function wingBox(id, w, d, on = []) {
  if (id === 'veranda') return { x0: -w / 2 - .25, x1: w / 2 + (on.includes('flowerbed') ? 1.35 : .25), z0: d / 2 - .1, z1: d / 2 + 1.15 };
  if (id === 'greenhouse') return { x0: w / 2 - .1, x1: w / 2 + 1.35, z0: -d / 2 - .25, z1: -.05 };
  if (id === 'flowerbed') return { x0: w / 2 - .1, x1: w / 2 + 1.35, z0: .05, z1: d / 2 + (on.includes('veranda') ? -.1 : .25) };
  return null;
}
// a slab like the room's own (room.js 'cake'), for a wing's ground
function slab(add, b, top, c = BASE) { add(G.box(b.x1 - b.x0, .35, b.z1 - b.z0, .12), c, (b.x0 + b.x1) / 2, -.205, (b.z0 + b.z1) / 2); add(G.box(b.x1 - b.x0 + .06, .19, b.z1 - b.z0 + .06, .08), shade(c, -.08), (b.x0 + b.x1) / 2, -.405, (b.z0 + b.z1) / 2); if (top) add(G.box(b.x1 - b.x0 - .04, .03, b.z1 - b.z0 - .04, .01), top, (b.x0 + b.x1) / 2, .0, (b.z0 + b.z1) / 2); }

const B = {};
// ── 베란다: deck boards running out from the wall, a white rail with turned posts round the open sides, three planters of
// geraniums and herbs, a folding chair with a striped cushion, a watering can, a wind chime under a little eave, and a storage
// bench whose lid lifts (spot inside); a mat by the door
B.veranda = (f, w, d, T, on = []) => {
  const b = wingBox('veranda', w, d, on), z0 = d / 2 + .08, z1 = b.z1, zc = (z0 + z1) / 2, L = b.x1 - b.x0;
  f.add(mc('wing-veranda|' + w + '|' + d + '|' + b.x1, ({ add, tube }) => {
    slab(add, b, null, T?.base || BASE);
    for (let k = 0; k < Math.round(L / .16); k++) add(G.box(.15, .05, z1 - z0 - .04, .012), k % 3 ? '#d9a466' : '#e3b47a', b.x0 + .08 + k * .16, .025, zc);
    add(G.box(L, .06, .06, .02), '#a8733f', 0, .02, z1 - .03);
    const rail = (ax, az, bx, bz) => { const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bz - az, bx - ax);
      add(G.box(len, .06, .08, .02), '#ffffff', (ax + bx) / 2, .58, (az + bz) / 2, 0, -ang, 0); add(G.box(len, .04, .05, .01), '#ffffff', (ax + bx) / 2, .22, (az + bz) / 2, 0, -ang, 0);
      for (let t = 0; t <= len + .001; t += .18) { const x = ax + (bx - ax) * t / len, z = az + (bz - az) * t / len; add(G.cyl(.022, .022, .5, 6), '#ffffff', x, .32, z); } };
    rail(b.x0 + .05, z1 - .06, b.x1 - .05, z1 - .06); rail(b.x0 + .05, z0 + .05, b.x0 + .05, z1 - .06); rail(b.x1 - .05, z0 + .05, b.x1 - .05, z1 - .06);
    for (const x of [b.x0 + .05, b.x1 - .05]) add(G.box(.1, .62, .1, .02), '#ffffff', x, .31, z1 - .06);
    // planters along the rail
    for (const [k, x] of [-w * .32, -w * .12, w * .28].entries()) {
      add(G.box(.42, .18, .18, .03), k === 1 ? '#7fb5ff' : '#e8b089', x, .14, z1 - .22); add(G.box(.38, .02, .14, .006), '#6a4a34', x, .23, z1 - .22);
      for (let n = 0; n < 6; n++) add(G.sph(.06, 8, 6), n % 2 ? '#6fae6a' : '#8fc07a', x - .15 + n * .06, .28 + (n % 3) * .02, z1 - .22, 0, n, 0, [1, .8, 1]);
      for (let n = 0; n < 4; n++) add(G.sph(.03, 6, 5), ['#ff6f7a', '#ff9eb0', '#fff8ee', '#ff6f7a'][(n + k) % 4], x - .12 + n * .08, .35, z1 - .2);
    }
    // a folding chair with a striped cushion, a watering can, a door mat
    { const cx = w * .1, cz = zc + .05; for (const s of [-1, 1]) { tube([cx + s * .17, .02, cz - .16], [cx + s * .17, .42, cz + .14], .015, '#5aa86a', 5); tube([cx + s * .17, .02, cz + .16], [cx + s * .17, .72, cz - .2], .015, '#5aa86a', 5); }
      add(G.box(.36, .05, .34, .02), '#fff6ee', cx, .42, cz); for (let k = 0; k < 4; k++) add(G.box(.362, .052, .04, .006), '#ff9eb0', cx, .42, cz - .12 + k * .08); add(G.box(.36, .3, .04, .02), '#fff6ee', cx, .6, cz - .17, -.35, 0, 0); }
    add(G.cyl(.07, .08, .14, 12), '#7fd6c0', w * .38, .09, zc - .05); tube([w * .38 + .06, .1, zc - .05], [w * .38 + .18, .2, zc - .05], .012, '#7fd6c0', 5); add(G.tor(.05, .01, PI, 4, 10), '#7fd6c0', w * .38 - .04, .17, zc - .05, 0, 0, HP);
    add(G.box(.6, .015, .34, .01), '#c9a26a', w * .32, .055, z0 + .22); for (let k = 0; k < 6; k++) add(G.box(.6, .017, .02, .004), '#b08a52', w * .32, .056, z0 + .08 + k * .055);
    // a wind chime hanging off a little eave bracket on the corner post
    { const x = b.x1 - .05, z = z1 - .06; tube([x, .62, z], [x - .25, .9, z], .015, '#ffffff', 5); for (let k = 0; k < 4; k++) tube([x - .2 + k * .03, .88, z], [x - .2 + k * .03, .72 - k * .03, z], .006, '#c9cfe0', 4); add(G.cyl(.04, .04, .02, 10), '#ff9eb0', x - .16, .89, z); }
    // the bench (the body; its lid is a part)
    { const bx = -w * .28, bz = zc + .02, c = '#c98a52', ci = '#8a5a3e';
      for (const sx of [-1, 1]) add(G.box(.03, .32, .34, .008), c, bx + sx * .335, .18, bz); for (const sz of [-1, 1]) add(G.box(.64, .32, .03, .008), c, bx, .18, bz + sz * .155);
      add(G.box(.64, .03, .28, .006), ci, bx, .035, bz); for (const sx of [-1, 1]) add(G.box(.06, .04, .3, .01), '#a8733f', bx + sx * .28, .01, bz); }
  }));
  const lid = grp(); put(lid, -w * .28, .34, zc + .02 - .17); f.add(lid);
  lid.add(mc('wing-veranda-lid', ({ add }) => { add(G.box(.74, .05, .36, .015), '#e3b47a', 0, .025, .17); add(G.box(.7, .06, .32, .03), '#ffd0dc', 0, .08, .17); for (let k = 0; k < 3; k++) add(G.sph(.02, 6, 5), '#ffb3c6', -.2 + k * .2, .11, .17); }));
  const p = f.part('lift', lid, t => { lid.rotation.x = -1.3 * t; }, { label: K('베란다 의자 뚜껑', 'Veranda bench lid'), sfx: 'open', dur: .3 });
  f.spot('inside', null, -w * .28, .2, zc + .02, { part: p, maxH: .14, label: K('베란다 의자 속', 'Inside the veranda bench'), scale: .75 });
  f.spot('on', null, w * .38 + .25, .05, zc + .1, { maxH: .35, label: K('베란다 물뿌리개 옆', 'By the veranda watering can'), scale: .7 });
  f.spot('behind', null, w * .28, .05, z1 - .45, { maxH: .3, label: K('베란다 화분 뒤', 'Behind the veranda planter'), scale: .7 });
  return { stand: [0, 0, d / 2 - .4] };
};

// ── 온실 칸: a lean-to of glass against the room's right wall — white glazing bars, pale mint panes, the roof sloping down from the
// wall, a door with a brass knob (it opens; things can sit on the bottom shelf inside), slatted shelves of seedlings in pots, a
// lemon tree in a big pot, a hose reel and a sack of soil
B.greenhouse = (f, w, d, T, on = []) => {
  const b = wingBox('greenhouse', w, d, on), x0 = w / 2 + .08, x1 = b.x1, z0 = -d / 2 + .08, z1 = b.z1, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2, HW = 2.0, HO = 1.35, FR = '#ffffff', GL = '#d9f0ea';
  f.add(mc('wing-greenhouse|' + w + '|' + d, ({ add, tube }) => {
    slab(add, b, null, T?.base || BASE); add(G.box(x1 - x0, .03, z1 - z0, .01), '#d6d1c8', (x0 + x1) / 2, 0, (z0 + z1) / 2);
    for (let k = 0; k < Math.round((z1 - z0) / .3); k++) for (let j = 0; j < 4; j++) add(G.box(.28, .012, .28, .006), (k + j) % 2 ? '#e2ddd4' : '#cfc9bd', x0 + .17 + j * .3, .02, z0 + .17 + k * .3);
    // frame: posts at the outer corners, sills, the sloping roof bars
    for (const z of [z0, z1]) { add(G.box(.06, HO, .06, .015), FR, x1 - .03, HO / 2, z); tube([x0, HW, z], [x1 - .03, HO, z], .03, FR, 6); }
    add(G.box(.06, .06, z1 - z0, .015), FR, x1 - .03, HO, zc); add(G.box(.06, .06, z1 - z0, .015), FR, x0 + .03, HW, zc); add(G.box(.06, .12, z1 - z0, .02), FR, x1 - .03, .06, zc);
    for (let k = 1; k < 4; k++) { const z = z0 + k * (z1 - z0) / 4; tube([x0, HW, z], [x1 - .03, HO, z], .018, FR, 5); add(G.box(.04, HO, .04, .01), FR, x1 - .03, HO / 2, z); }
    for (const y of [.5, .95]) add(G.box(.04, .04, z1 - z0, .01), FR, x1 - .03, y, zc);
    const ang = Math.atan2(HW - HO, x1 - x0); for (let k = 0; k < 4; k++) add(G.box(Math.hypot(x1 - x0, HW - HO) - .04, .015, (z1 - z0) / 4 - .04, .004), k % 2 ? GL : '#c4e6df', xc, (HW + HO) / 2 + .01, z0 + (k + .5) * (z1 - z0) / 4, 0, 0, -ang);
    // the back end (z0) glazed, with bars
    { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(x1 - x0, 0); s.lineTo(x1 - x0, HO); s.lineTo(0, HW); s.closePath(); add(G.ext(s, .015, 0, 2), GL, x0, 0, z0 - .008); for (const u of [.33, .66]) add(G.box(.03, HW - (HW - HO) * u, .03, .006), FR, x0 + u * (x1 - x0), (HW - (HW - HO) * u) / 2, z0); }
    // shelves of seedlings along the outer glass
    for (const [k, y] of [.42, .85].entries()) { add(G.box(.32, .03, z1 - z0 - .5, .008), '#c9a26a', x1 - .22, y, zc - .18); for (let n = 0; n < 5; n++) { const z = z0 + .2 + n * (z1 - z0 - .6) / 4; add(G.cyl(.05, .04, .08, 10), n % 2 ? '#e8b089' : '#d98b5f', x1 - .22, y + .055, z); add(G.sph(.045, 8, 6), ['#8fc07a', '#6fae6a', '#a8d48a'][(n + k) % 3], x1 - .22, y + .12, z, 0, n, 0, [1, .8, 1]); if ((n + k) % 3 === 0) add(G.sph(.018, 6, 5), '#ff6f7a', x1 - .2, y + .15, z + .02); } }
    // the lemon tree, the hose reel, the soil sack
    { const lx = x0 + .35, lz = z0 + .4; add(G.cyl(.2, .16, .28, 14), '#e8b089', lx, .14, lz); add(G.cyl(.18, .18, .02, 14), '#6a4a34', lx, .27, lz); tube([lx, .27, lz], [lx, .85, lz], .03, '#9a6a45', 6);
      for (let n = 0; n < 7; n++) { const a = n * .9; add(G.sph(.17, 10, 8), n % 2 ? '#6fae6a' : '#5a9a5c', lx + Math.cos(a) * .14, 1.0 + (n % 3) * .08, lz + Math.sin(a) * .14, 0, 0, 0, [1, .8, 1]); }
      for (let n = 0; n < 5; n++) { const a = n * 1.3 + .4; add(G.sph(.04, 8, 6), '#ffe14d', lx + Math.cos(a) * .22, .92 + (n % 3) * .1, lz + Math.sin(a) * .22, 0, 0, 0, [1.2, 1, 1]); } }
    { const hx = x0 + .3, hz = z1 - .35; add(G.cyl(.14, .14, .05, 16), '#5aa86a', hx, .3, hz, 0, 0, HP); add(G.tor(.11, .03, PI * 2, 6, 16), '#7fd6c0', hx, .3, hz, 0, HP, 0); add(G.box(.08, .3, .04, .01), '#5aa86a', hx, .15, hz); }
    add(G.box(.26, .3, .16, .06), '#c9b48a', x0 + .7, .15, z1 - .25, 0, .3, 0); add(G.box(.2, .06, .006, .004), '#6a8a4a', x0 + .7, .2, z1 - .17, 0, .3, 0);
  }));
  // the glass door on the front end (z1), hinged at its outer edge
  const dw = .55, dv = grp(); put(dv, x1 - .06, 0, z1 + .01); f.add(dv);
  dv.add(mc('wing-greenhouse-door', ({ add }) => { add(G.box(.05, HO, .04, .01), FR, -.025, HO / 2, 0); add(G.box(.05, HO, .04, .01), FR, -dw + .025, HO / 2, 0); add(G.box(dw, .05, .04, .01), FR, -dw / 2, HO - .025, 0); add(G.box(dw, .08, .04, .01), FR, -dw / 2, .04, 0); add(G.box(dw, .04, .04, .01), FR, -dw / 2, .7, 0);
    add(G.box(dw - .08, HO - .2, .01, .004), GL, -dw / 2, HO / 2, 0); add(G.sph(.025, 8, 6), '#e2c070', -dw + .08, .7, .03); }));
  const p = f.part('door', dv, t => { dv.rotation.y = 1.5 * t; }, { label: K('온실 문', 'Greenhouse door'), sfx: 'door', dur: .32 });
  f.spot('inside', null, xc + .1, .03, z1 - .45, { part: p, maxH: .4, label: K('온실 안', 'Inside the greenhouse'), scale: .8 });
  f.spot('on', null, x1 - .22, .885, zc - .05, { part: p, maxH: .22, label: K('온실 선반 위', 'On the greenhouse shelf'), scale: .6 });
  return { stand: [w / 2 - .45, 0, -d * .22] };
};

// ── 꽃마당: a lawn with a white picket fence round its open sides and a little gate, two beds of tulips and daisies edged with
// stones, stepping stones from the room, a birdbath, a doghouse with a red roof (its door flap lifts; a bone inside), a
// butterfly and a garden gnome mochi
B.flowerbed = (f, w, d, T, on = []) => {
  const b = wingBox('flowerbed', w, d, on), x0 = w / 2 + .08, x1 = b.x1, z0 = b.z0, z1 = on.includes('veranda') ? d / 2 + .02 : b.z1 - .25, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2;
  f.add(mc('wing-flowerbed|' + w + '|' + d + '|' + z1, ({ add, tube }) => {
    slab(add, b, null, T?.base || BASE); add(G.box(x1 - x0, .03, z1 - z0, .01), '#8fd06f', (x0 + x1) / 2, 0, (z0 + z1) / 2);
    for (let k = 0; k < 40; k++) add(G.cone(.012, .05, 3), k % 2 ? '#6fbf5a' : '#7fcf6a', x0 + .1 + (k * .618 % 1) * (x1 - x0 - .2), .03, z0 + .1 + (k * .382 % 1) * (z1 - z0 - .2));
    // picket fence on the outer side and the front, a gate gap in the front
    const picket = (x, z, ry) => { add(G.box(.07, .42, .025, .01), '#ffffff', x, .23, z, 0, ry, 0); add(G.cone(.05, .06, 4), '#ffffff', x, .47, z, 0, ry + PI / 4, 0); };
    for (let z = z0 + .1; z < z1 - .05; z += .13) picket(x1 - .05, z, HP);
    for (let x = x0 + .1; x < x1 - .05; x += .13) if (Math.abs(x - xc) > .2) picket(x, z1 - .05, 0);
    add(G.box(.03, .04, z1 - z0 - .1, .01), '#ffffff', x1 - .05, .32, zc); add(G.box(.03, .04, z1 - z0 - .1, .01), '#ffffff', x1 - .05, .16, zc);
    for (const [ax, bx] of [[x0 + .08, xc - .22], [xc + .22, x1 - .05]]) { add(G.box(bx - ax, .04, .03, .01), '#ffffff', (ax + bx) / 2, .32, z1 - .05); add(G.box(bx - ax, .04, .03, .01), '#ffffff', (ax + bx) / 2, .16, z1 - .05); }
    // two flower beds
    for (const [bz, cols] of [[z0 + .35, ['#ff6f7a', '#ffe27a', '#ff9eb0']], [zc + .3, ['#bda7ff', '#ffffff', '#ff9a3c']]]) {
      add(G.box(.5, .06, .36, .03), '#7a5a3e', xc + .1, .05, bz); for (let k = 0; k < 10; k++) { const a = k / 10 * PI * 2; add(G.sph(.04, 6, 5), '#c9c4bd', xc + .1 + Math.cos(a) * .3, .05, bz + Math.sin(a) * .22, 0, 0, 0, [1, .6, 1]); }
      for (let k = 0; k < 9; k++) { const x = xc - .08 + (k % 3) * .14, z = bz - .1 + Math.floor(k / 3) * .1; tube([x, .08, z], [x, .22 + (k % 2) * .05, z], .006, '#5aa65e', 3); add(G.sph(.035, 8, 6), cols[k % 3], x, .24 + (k % 2) * .05, z, 0, 0, 0, [1, 1.2, 1]); add(G.sph(.02, 6, 5), '#6fae6a', x + .02, .13, z, 0, 0, 0, [1.4, .5, 1]); }
    }
    // stepping stones from the room's wall, the birdbath, the gnome
    for (let k = 0; k < 3; k++) add(G.cyl(.11, .12, .03, 10), '#d6cfc2', x0 + .15 + k * .26, .025, z1 - .3 - k * .05);
    { const bx = x1 - .3, bz = z0 + .3; add(G.cyl(.05, .09, .32, 10), '#d6cfc2', bx, .17, bz); add(G.cyl(.17, .12, .06, 14), '#d6cfc2', bx, .36, bz); add(G.cyl(.14, .14, .01, 14), '#9cd0e4', bx, .385, bz); add(G.sph(.035, 8, 6), '#7fb5ff', bx + .08, .43, bz, 0, 0, 0, [1.3, 1, 1]); add(G.cone(.02, .03, 4), '#ffb23a', bx + .12, .43, bz, 0, 0, -HP); }
    { const gx = x0 + .25, gz = zc - .1; add(G.sph(.07, 10, 8), '#fff6ee', gx, .09, gz, 0, 0, 0, [1, .9, 1]); add(G.cone(.07, .14, 10), '#ff6f7a', gx, .22, gz); add(G.sph(.04, 8, 6), '#ffffff', gx + .05, .06, gz + .03, 0, 0, 0, [1.3, .6, 1]); for (const s of [-1, 1]) add(G.sph(.008, 5, 4), '#2a1d33', gx + .06, .11, gz + s * .025); }
    // the doghouse body (its flap is a part)
    { const hx = xc + .05, hz = z1 - .55; for (const sx of [-1, 1]) add(G.box(.03, .36, .4, .008), '#e8c49a', hx + sx * .195, .2, hz); add(G.box(.42, .36, .03, .008), '#e8c49a', hx, .2, hz - .185); for (const sx of [-1, 1]) add(G.box(.12, .36, .03, .008), '#e8c49a', hx + sx * .15, .2, hz + .185); add(G.box(.42, .08, .03, .008), '#e8c49a', hx, .34, hz + .185); add(G.box(.36, .02, .34, .006), '#c9a26a', hx, .03, hz); const r = new THREE.Shape(); r.moveTo(-.28, 0); r.lineTo(.28, 0); r.lineTo(0, .2); r.closePath(); add(G.ext(r, .48, .02, 2), '#e2685a', hx, .38, hz - .24, 0, 0, 0); add(G.box(.12, .04, .02, .01), '#7fb5ff', hx, .33, hz + .205); add(G.cyl(.06, .06, .03, 12), '#c9c4bd', hx + .26, .02, hz + .15); }
    // a butterfly over the beds
    { const bx = xc + .2, by = .55, bz = zc; for (const s of [-1, 1]) add(G.sph(.04, 8, 6), '#ffb3c6', bx, by, bz + s * .03, 0, 0, s * .4, [1, .3, 1]); add(G.cap(.006, .04, 2, 4), '#4a4458', bx, by, bz, 0, 0, HP); }
  }));
  const hx = xc + .05, hz = z1 - .55, fl = grp(); put(fl, hx, .26, hz + .215); f.add(fl);
  fl.add(mc('wing-doghouse-flap', ({ add }) => { add(G.box(.2, .22, .015, .01), '#c98a52', 0, -.11, 0); add(G.sph(.016, 6, 5), '#4a4458', 0, -.04, .012); }));
  const p = f.part('flip', fl, t => { fl.rotation.x = -1.3 * t; }, { label: K('개집 문', 'Doghouse flap'), sfx: 'open', dur: .26 });
  f.spot('inside', null, hx, .03, hz, { part: p, maxH: .28, label: K('개집 안', 'Inside the doghouse'), scale: .7 });
  f.spot('on', null, xc + .1, .04, z0 + .75, { maxH: .35, label: K('꽃밭 사이', 'Between the flower beds'), scale: .7 });
  f.spot('behind', null, x1 - .3, .04, z0 + .6, { maxH: .3, label: K('새 물통 뒤', 'Behind the birdbath'), scale: .7 });
  return { stand: [w / 2 - .45, 0, d * .25] };
};

export const WING_BUILD = B;

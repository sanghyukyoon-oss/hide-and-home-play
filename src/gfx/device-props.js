// 장치판 소품 (R6, 2026-10-18 — level-design-report-20261018.md): one piece of furniture per region's ★ stage that carries
// its whole device. Each is swapped in for the map's plain piece only on that stage (devices.js deviceLayout), so the
// ordinary stages on the same map stay as they were. Same toy kit as showcase-props (one merged mesh per piece).
//   sluicepond (3×3, 48판 큰 공원): a raised stone pond with a 수문 on its near rim. The gate wheel has lost its handle;
//     with it the wheel turns, the gate lifts and the pond drains — on the bottom a sunken treasure chest (colour lock),
//     the colour card for it and two surprised fish. 개굴이 hides in the chest; bubbles rise while the water is in.
//     Parts: [0] the wheel (kind 'wheel', p.device 'sluice': gate, water and surface ride on it), [1] the chest lid.
//   changergo (1×1, 39판 빨래방): the coin changer, its front panel now the device (p.device 'changer'): put the 1000원
//     bill in and two 500원 coins drop into the cup (one is yours to pick up). The panel no longer opens.
//   dryergo (1×1, 39판 빨래방): the stacked washer + dryer, the dryer door the device (p.device 'dryer'): it is locked
//     '건조 중' — a coin runs one cycle (the drum tumbles the laundry, and someone pink in it), "딩!", the door pops open.
import * as THREE from 'three';
import { put, grp, mat, mesh, cyl, tor, rbox } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { SHOP_BUILDERS } from './shop-props.js';

const PI = Math.PI, HP = PI / 2;
const STONE = '#c9c2d8', STONE2 = '#b1a9c4', STONE3 = '#ddd7e8', WATER = '#7fd2ef', WATER2 = '#a9e4f6', SAND = '#dcc99a', SAND2 = '#c8b07c',
  WOOD = '#d9a466', WOODD = '#a8733f', GOLD = '#ffc93c', LEAF2 = '#5cb45a', STEEL2 = '#a9b2c8';
const B = {};
const smooth = t => t * t * (3 - 2 * t), clamp01 = t => Math.max(0, Math.min(1, t));
const live = m => { m.userData.noMerge = true; return m; };   // moves on its own (not a part): keep it out of the room's static merge

B.sluicepond = f => {
  const R = 1.3, WH = .44, IN = 1.15, L0 = .4, FL = .03, A = .05;   // wall radius and height, water radius, full level, floor; gate angle
  const gx = Math.cos(A) * R, gz = Math.sin(A) * R;
  // the stone ring, open where the gate stands; a sandy floor with pebbles under the water
  f.add(mc('sluicepond-basin', ({ add }) => {
    const N = 28;
    for (let k = 0; k < N; k++) {
      const a = k / N * PI * 2; let da = Math.abs(a - A) % (PI * 2); if (da > PI) da = PI * 2 - da;
      if (da < .2) continue;
      const h = WH - (k % 3) * .02;
      add(G.box(.32, h, .24, .07), k % 3 ? STONE : STONE2, Math.cos(a) * R, h / 2, Math.sin(a) * R, 0, -a - HP, 0);
      add(G.box(.3, .05, .27, .025), STONE3, Math.cos(a) * R, h + .015, Math.sin(a) * R, 0, -a - HP, 0);
    }
    add(G.cyl(IN + .05, IN + .05, FL, 40), SAND, 0, FL / 2, 0);
    for (let k = 0; k < 16; k++) { const a = k * 2.39, r = .25 + (k * 53 % 9) / 10; if (Math.hypot(Math.cos(a) * r + .3, Math.sin(a) * r + .3) < .45) continue; add(G.sph(.035 + (k % 3) * .015, 8, 6), k % 2 ? STONE : SAND2, Math.cos(a) * r, FL + .01, Math.sin(a) * r, 0, a, 0, [1.3, .55, 1]); }
    // reeds by the far rim
    for (let k = 0; k < 5; k++) add(G.cyl(.012, .016, .5 + (k % 2) * .15, 5), LEAF2, -.9 + k * .07, WH + .25, -.8 + (k % 2) * .06);
  }));
  // the 수문: two stone posts, a beam, the wooden gate between them and the wheel on top (facing outward, to the camera)
  const gf = grp(); put(gf, gx, 0, gz); gf.rotation.y = HP - A; f.add(gf);
  gf.add(mc('sluicepond-gateframe', ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.16, .86, .26, .04), STONE2, sx * .27, .43, 0);
    add(G.box(.72, .1, .2, .03), WOODD, 0, .9, 0);
    add(G.cyl(.025, .025, .5, 8), STEEL2, 0, .72, .02);                       // the screw rod
    add(G.box(.3, .05, .26, .015), STONE, 0, .03, .2);                        // the spout lip outside
    add(G.box(.06, .2, .06, .015), WOODD, 0, 1.03, .04);                      // the wheel's post
  }));
  const gate = grp(); put(gate, 0, .21, -.01); gf.add(gate);
  gate.add(mc('sluicepond-gate', ({ add }) => {
    add(G.box(.4, .42, .07, .015), WOOD, 0, 0, 0);
    for (const y of [-.12, .12]) add(G.box(.42, .05, .08, .01), WOODD, 0, y, 0);
  }));
  const wheel = grp(); put(wheel, 0, 1.12, .1); gf.add(wheel);
  wheel.add(mc('sluicepond-wheel', ({ add }) => {
    add(G.tor(.2, .025, PI * 2, 6, 24), '#ff6b6b', 0, 0, 0);
    for (let k = 0; k < 4; k++) add(G.box(.4, .03, .03, .01), '#e05555', 0, 0, 0, 0, 0, k * PI / 4);
    add(G.cyl(.05, .05, .06, 14), GOLD, 0, 0, 0, HP, 0, 0);
  }));
  // the handle, put on once you have found it (hidden till then)
  const handle = grp(); put(handle, .2, 0, .03); wheel.add(handle); handle.visible = false;
  const hm = mc('sluicepond-handle', ({ add }) => { add(G.cyl(.014, .014, .1, 8), STEEL2, 0, 0, .04, HP, 0, 0); add(G.cyl(.028, .028, .07, 12), GOLD, 0, 0, .1, HP, 0, 0); });
  hm.userData.noMerge = true; handle.add(hm);
  // the water: one column from the floor to the surface, and the surface things (ripples, lily pads, a lotus) on top
  const water = mesh(new THREE.CylinderGeometry(IN, IN, 1, 44), mat(WATER, { rough: .3 })); water.userData.noMerge = true; f.add(water);
  const surf = grp(); f.add(surf);
  surf.add(mc('sluicepond-surface', ({ add }) => {
    for (const r of [.95, .55]) add(G.tor(r, .008, PI * 2, 4, 40), WATER2, 0, .002, 0, HP, 0, 0);
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; add(G.sph(.05, 8, 6), '#ffb3cf', -.55 + Math.cos(a) * .05, .05, .3 + Math.sin(a) * .05, .5, a, 0, [.7, 1, 1.4]); }
    add(G.sph(.035, 8, 6), '#ffe27a', -.55, .07, .3);
    for (const [x, z, r] of [[.5, -.45, .22], [-.3, .65, .2], [.75, .3, .2]]) { const s = new THREE.Shape(); s.absarc(0, 0, r, .35, PI * 2 - .1, false); s.lineTo(0, 0); add(G.ext(s, .02, 0, 16), LEAF2, x, .02, z, -HP, 0, 0); }
  }));
  // (the last of it pulls in to a puddle in the middle, so the sand and what lies on it show)
  const setLevel = (h, d = 0) => { water.scale.y = Math.max(.004, h); water.position.y = FL + water.scale.y / 2; surf.position.y = FL + h; const k = 1 - .7 * smooth(clamp01((d - .55) / .45)); water.scale.x = water.scale.z = k; surf.scale.set(k, 1, k); };
  setLevel(L0 - FL);
  // the sunken chest (facing the camera), and the two fish that end up on the dry floor
  const ch = grp(); put(ch, -.3, FL, -.3); ch.rotation.y = PI / 4; f.add(ch);
  ch.add(mc('sluicepond-chest', ({ add }) => {
    add(G.box(.56, .24, .4, .03), '#b97a45', 0, .12, 0);
    for (const sx of [-1, 1]) add(G.box(.05, .245, .41, .01), GOLD, sx * .2, .12, 0);
    add(G.box(.57, .03, .41, .01), '#8a5530', 0, .02, 0);
    for (let k = 0; k < 3; k++) add(G.sph(.02, 6, 5), '#7fcf6a', -.22 + k * .2, .22, .19, 0, 0, 0, [1.4, .5, .6]);   // a little pond weed on it
  }));
  const lid = grp(); put(lid, 0, .24, -.2); ch.add(lid);
  lid.add(mc('sluicepond-lid', ({ add }) => {
    add(G.box(.58, .1, .42, .04), '#c98a52', 0, .05, .21);
    for (const sx of [-1, 1]) add(G.box(.05, .105, .43, .01), GOLD, sx * .2, .05, .21);
  }));
  const fish = [];
  for (const [x, z, ry, c] of [[.45, .05, .6, '#ff9a4c'], [-.05, .5, 2.4, '#ffd23f']]) {
    const g = grp(); put(g, x, FL + .03, z); g.rotation.y = ry; f.add(g);
    g.add(live(mc('sluicepond-fish|' + c, ({ add }) => {
      add(G.sph(.07, 10, 8), c, 0, 0, 0, 0, 0, 0, [1.6, .8, .7]);
      add(G.cone(.05, .08, 6), c, -.14, 0, 0, 0, 0, HP);
      for (const sz of [-1, 1]) add(G.sph(.012, 6, 5), '#2a1d33', .07, .02, sz * .04);
    })));
    fish.push(g);
  }
  // the stream out of the gate while it drains (shown by the device, devices.js)
  const stream = mesh(new THREE.BoxGeometry(.22, .34, .05), mat(WATER2, { rough: .3 })); stream.userData.noMerge = true;
  put(stream, 0, .17, .3); stream.rotation.x = -.35; stream.visible = false; gf.add(stream);
  const p = f.part('wheel', [wheel, gate, water, surf], t => {
    wheel.rotation.z = -t * PI * 6;
    gate.position.y = .21 + .36 * smooth(clamp01(t * 4));
    const d = clamp01((t - .2) / .8);
    setLevel(Math.max(.012, (L0 - FL) * (1 - smooth(d))), d);
  }, { label: '수문 바퀴', sfx: 'creak', dur: 2.8 });
  p.device = 'sluice'; p.isGadget = true;
  const lp = f.part('lid', lid, (t, b) => { lid.rotation.x = b.r.x - t * 1.95; }, { label: '보물상자', sfx: 'creak', dur: .5 });
  lp.lockKind = 'color'; f.lockAt = { x: 0, y: .15, z: .21, parent: ch };
  Object.assign(f, { handle, wheel, fish, stream, chest: ch, water, surf, waterTop: () => new THREE.Vector3(-.3, surf.position.y + .02, -.3) });
  // what waits on the bottom: the friend in the chest, the colour card beside it (both only reachable once it's dry)
  const cs = f.spot('inside', ch, 0, .03, 0, { part: lp, maxH: .3, label: '보물상자 안', scale: .8 }); cs.reserved = true;
  const fs = f.spot('on', null, .3, FL + .004, -.38, { part: p, maxH: .08, label: '연못 바닥', scale: .95 }); fs.reserved = true;
  f.floorSpot = fs;
  // the ordinary places round it
  f.spot('behind', null, -1.42, 0, -.45, { maxH: .3, label: '연못 돌담 뒤', scale: .75 });
  f.spot('on', null, Math.cos(2.6) * R, WH + .04, Math.sin(2.6) * R, { maxH: .3, label: '연못 돌담 위', scale: .7 });
  f.spot('on', null, Math.cos(-1.3) * R, WH + .04, Math.sin(-1.3) * R, { maxH: .3, label: '연못 돌담 위', scale: .7 });
};

// ── 39판 빨래방 ──────────────────────────────────────────────────────────────────────────────────────────────────
B.changergo = (f, T) => {
  SHOP_BUILDERS.vendcoin(f, T);
  const p = f.parts[0], pv = p.pivots[0], cx = (.58 - .01) / 2;
  p.lockable = false; p.spots.forEach(s => { s.reserved = true; });
  // the bill that goes in (shown while it slides into the slot) and the coins that come out into the cup
  const bill = grp(); put(bill, cx, -.2, .1); bill.visible = false; pv.add(bill);
  bill.add(live(mc('changergo-bill', ({ add }) => { add(G.pbox(.16, .004, .11), '#9fe3a6', 0, 0, 0); add(G.cyl(.025, .025, .006, 14), '#5cb46a', .03, .002, .02); })));
  const cup = grp(); put(cup, cx, -.58, .07); pv.add(cup);
  const spare = grp(); cup.add(spare);
  spare.add(live(mc('changergo-coin', ({ add }) => { add(G.cyl(.03, .03, .008, 16), GOLD, -.04, .01, 0, .3, 0, .2); })));
  const ca = f.spot('on', pv, cx + .03, -.6, .075, { part: p, maxH: .08, label: '동전 컵', scale: .8 }); ca.reserved = true;
  const set = t => { const k = smooth(clamp01((t - .5) / .5)); ca.anchor.scale.setScalar(Math.max(.001, k)); spare.scale.setScalar(Math.max(.001, k)); };
  set(0);
  p.apply = t => set(t); p.label = '동전 교환기'; p.sfx = 'clink'; p.dur = .9;
  p.device = 'changer'; p.isGadget = true;
  Object.assign(f, { bill, cupSpot: ca, slotAt: new THREE.Vector3(cx, -.2, .06), slotParent: pv });
};
B.dryergo = (f, T) => {
  SHOP_BUILDERS.washer3(f, T);
  const dd = f.parts[1];
  dd.spots.forEach(s => { s.reserved = true; });
  dd.device = 'dryer'; dd.dur = .45;
  // what tumbles in the drum while it runs: the laundry, and a pink swirl with a cherry that is not laundry
  const cy = .05 + .9 + .4, cz = -.01;
  const tb = grp(); put(tb, 0, cy, cz); tb.visible = false; f.add(tb);
  tb.add(live(mc('dryergo-tumble', ({ add }) => {
    // (close behind the glass, so they show through the round window from above)
    for (const [a, c, s] of [[0, '#9fd3b0', .08], [1.3, '#ffc23d', .07], [3.4, '#8fd3f4', .085], [4.7, '#ffffff', .075]]) add(G.sph(s, 10, 8), c, Math.cos(a) * .1, Math.sin(a) * .1, .14, 0, a, 0, [1.3, .85, .9]);
    const sx = Math.cos(2.35) * .1, sy = Math.sin(2.35) * .1;
    add(G.sph(.085, 12, 10), '#ffb3cf', sx, sy, .15);
    add(G.sph(.06, 12, 10), '#fff4e2', sx, sy + .07, .15);
    add(G.sph(.028, 8, 6), '#ff5a6a', sx, sy + .135, .15);
  })));
  Object.assign(f, { tumble: tb, dryerAt: new THREE.Vector3(0, cy, .25), slotAt: new THREE.Vector3(.28, .05 + .9 + .145, .23) });
};

// the tools of the devices: found, fitted, never collected
export const DEVICE_ITEMS = {
  sluicehandle: { name: '수문 손잡이', h: .06, flat: true, noCollect: true, build() {
    const g = grp();
    g.add(put(cyl(.014, .014, .14, STEEL2, null, 8), 0, .016, 0, HP, 0, 0));
    g.add(put(cyl(.03, .03, .08, GOLD, null, 12), 0, .03, .08, HP, 0, 0));
    g.add(put(tor(.035, .01, '#ff6b6b', null, PI * 2, 6, 14), 0, .016, -.07, HP, 0, 0));
    return g;
  } },
};
DEVICE_ITEMS.bill1000 = { name: '천 원 지폐', h: .03, flat: true, noCollect: true, build() {
  const g = grp();
  g.add(put(rbox(.24, .006, .12, '#9fe3a6', .003), 0, .003, 0));
  g.add(put(rbox(.2, .002, .09, '#c8f2cc', .002), 0, .007, 0));
  g.add(put(cyl(.03, .03, .004, '#5cb46a', null, 16), .05, .009, 0));
  g.add(put(rbox(.06, .003, .014, '#5cb46a', .001), -.06, .009, -.02));
  return g;
} };
DEVICE_ITEMS.coin500 = { name: '500원 동전', h: .03, flat: true, noCollect: true, build() {
  const g = grp();
  g.add(put(cyl(.05, .05, .012, GOLD, null, 22), 0, .006, 0));
  g.add(put(tor(.04, .004, '#e0a92e', null, PI * 2, 4, 22), 0, .013, 0, HP, 0, 0));
  g.add(put(rbox(.03, .003, .012, '#e0a92e', .001), 0, .013, 0));
  return g;
} };
export const DEVICE_BUILDERS = B;
export const DEVICE_INFO = {
  sluicepond: { w: 3, d: 3, name: '수문 연못', price: 0, hidden: true },
  changergo: { w: 1, d: 1, name: '동전 교환기', price: 0, hidden: true },
  dryergo: { w: 1, d: 1, name: '코인 세탁기', price: 0, hidden: true },
};

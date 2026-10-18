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
//   pulleyjang (2×1, 30판 마당 2층집): the 장독대 under a wooden 도르래 frame. A heavy 누름돌 sits on the big jar's lid;
//     with the crank's handle the pulley hoists it off and the lid pops — the frame, crank, rope and stone ride on the big
//     lid's part (p.device 'pulley'), so a tap on any of them is a tap on the jar. A curly tail pokes out to wag (tell).
//   liftstage (3×2, 68판 K-pop 무대): the stage with a lift in the floor where the pink X was, and a lighting console at
//     the front-left corner with a holder for a light-stick. Stick in → the lights sweep, smoke, the lift rises with
//     whoever was hiding under the stage (p.device 'stagelift').
//   starloft (1×1, against the north wall, 59판 통나무 오두막 다락): a tin star-lantern on a crate under an attic hatch
//     with a folded ladder. Light the lantern (matches) → its stars land on the wall round the hatch as a constellation,
//     twinkle and run into the star latch → the hatch swings open and the ladder slides down (p.device 'starloft'; the
//     lantern rides on the hatch's part for taps).
import * as THREE from 'three';
import { put, grp, mat, mesh, cyl, tor, rbox, starShape } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { SHOP_BUILDERS } from './shop-props.js';
import { OUTDOOR_BUILDERS } from './outdoor.js';
import { KPOP_BUILDERS } from './kpop-props.js';

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
  const set = t => { const k = smooth(clamp01((t - .5) / .5)); ca.anchor.scale.setScalar(Math.max(.05, k)); spare.visible = k > .01; spare.scale.setScalar(Math.max(.05, k)); };
  spare.visible = false; ca.anchor.scale.setScalar(.05);   // (no near-0 scale at build: see liftstage)
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

// ── 30판 마당 2층집 ───────────────────────────────────────────────────────────────────────────────────────────────
B.pulleyjang = (f, T) => {
  OUTDOOR_BUILDERS.jangdok(f, T);
  const big = f.parts[0], JX = -.52, JZ = -.06, LID = 1.0;   // the big jar (jangdok: x -.52, platform .2 + height .8)
  big.spots.forEach(s => { s.reserved = true; });
  const wood = (T && T.wood) || '#d9a466', woodD = (T && T.woodD) || '#a8733f';
  const pg = grp(); f.add(pg);
  // the frame: two posts behind the jars, a beam, an arm out over the big jar with the pulley wheel; the crank box
  pg.add(mc('pulleyjang-frame|' + wood, ({ add }) => {
    for (const x of [-.94, -.1]) { add(G.box(.09, 2.0, .09, .02), woodD, x, 1.0, -.36); add(G.box(.18, .05, .18, .015), woodD, x, .225, -.36); }
    add(G.box(.96, .09, .1, .02), wood, -.52, 1.98, -.36);
    add(G.box(.08, .08, .4, .02), wood, JX, 1.94, -.2);
    add(G.cyl(.09, .09, .04, 18), '#c9cfe0', JX, 1.84, JZ, 0, 0, HP);
    add(G.tor(.09, .014, PI * 2, 5, 18), woodD, JX, 1.84, JZ, 0, HP, 0);
    add(G.box(.16, .2, .12, .03), '#c9cfe0', -.1, 1.05, -.27);
    tube3(add, [JX + .09, 1.84, JZ], [-.1, 1.12, -.25], .008, '#e8d8b8');
  }));
  // the crank, put in once found; the rope from the wheel to the stone (it shortens as the stone comes up)
  const crank = grp(); put(crank, -.1, 1.05, -.2); crank.visible = false; pg.add(crank);
  crank.add(live(mc('pulleyjang-crank', ({ add }) => { add(G.cyl(.016, .016, .1, 8), '#a9b2c8', 0, 0, .03, HP, 0, 0); add(G.box(.12, .025, .025, .008), '#a9b2c8', .05, 0, .08); add(G.cyl(.022, .022, .07, 10), '#ff6b6b', .1, 0, .1, HP, 0, 0); })));
  const stone = grp(); put(stone, JX, LID + .1, JZ); pg.add(stone);
  stone.add(live(mc('pulleyjang-stone', ({ add }) => {
    add(G.sph(.2, 14, 10), '#b1a9c4', 0, .05, 0, 0, .4, 0, [1.15, .5, 1]);
    add(G.sph(.12, 12, 8), '#c9c2d8', .04, .1, -.03, 0, .2, 0, [1, .45, .9]);
    for (const a of [0, HP]) add(G.tor(.15, .012, PI * 2, 4, 18), '#e8d8b8', 0, .06, 0, HP, a, 0, [1, 1, .5]);   // the rope round it
    add(G.tor(.03, .008, PI * 2, 4, 10), '#a9b2c8', 0, .2, 0);                                                    // the hook
  })));
  const rope = live(mesh(new THREE.CylinderGeometry(.009, .009, 1, 6), mat('#e8d8b8'))); pg.add(rope);
  const setRope = () => { const y0 = 1.84 - .09, y1 = stone.position.y + .21, L = Math.max(.02, y0 - y1); rope.scale.y = L; rope.position.set(JX, y1 + L / 2, JZ); };
  setRope();
  // a curly 시바 tail that pokes out from under the lid for the tell
  const tail = grp(); put(tail, JX + .16, LID - .04, JZ + .26); tail.rotation.y = PI / 4; tail.visible = false; f.add(tail);
  tail.add(live(mc('pulleyjang-tail', ({ add }) => { add(G.tor(.1, .042, PI * 1.4, 6, 16), '#f2a65a', 0, .09, 0, 0, 0, -.6); add(G.sph(.048, 8, 6), '#fff4e2', .08, .17, 0); })));
  big.pivots.push(pg);   // (taps on the frame, crank, rope or stone go to the jar)
  big.device = 'pulley';
  Object.assign(f, { crank, stone, setRope, tail, jarAt: new THREE.Vector3(JX, 1.3, JZ) });
};
// ── 68판 K-pop 무대 ───────────────────────────────────────────────────────────────────────────────────────────────
B.liftstage = (f, T) => {
  KPOP_BUILDERS.kpopstage(f, T);
  const H = .34, LZ = .15, UP = .85;
  // the lift: a pink star platform flush with the floor, a striped column that grows under it as it rises
  const lift = grp(); put(lift, 0, H + .02, LZ); f.add(lift);
  lift.add(mc('liftstage-top', ({ add }) => {
    add(G.box(.84, .06, .56, .02), '#ff5a8a', 0, .0, 0);
    add(G.box(.86, .02, .58, .008), '#ffcf3c', 0, -.03, 0);
    for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2 - HP; add(G.sph(.035, 8, 6), '#fff4e2', Math.cos(a) * .16, .035, Math.sin(a) * .16, 0, 0, 0, [1, .4, 1]); }
    add(G.sph(.06, 10, 8), '#ffe27a', 0, .035, 0, 0, 0, 0, [1, .4, 1]);
  }));
  // (built at full height and hidden, never scaled near 0 at build: the bake's coplanar lift works in mesh space)
  const col = grp(); put(col, 0, H, LZ); col.visible = false; f.add(col);
  col.add(live(mc('liftstage-column', ({ add }) => {
    add(G.box(.6, 1, .4, .02), '#3b3556', 0, .5, 0);
    for (let k = 0; k < 5; k++) add(G.box(.62, .05, .42, .01), k % 2 ? '#ff7fb0' : '#7fe0c8', 0, .1 + k * .2, 0);
  })));
  // the console: a little podium with a row of coloured buttons and a holder for the light-stick
  const con = grp(); put(con, -1.18, H, .68); f.add(con);
  con.add(mc('liftstage-console', ({ add }) => {
    add(G.box(.26, .46, .2, .03), '#3b3556', 0, .23, 0);
    add(G.box(.3, .04, .24, .015), '#2c2744', 0, .48, .01, -.35, 0, 0);
    ['#ff7fb0', '#ffe27a', '#7fe0c8', '#8fc8ff'].forEach((c, k) => add(G.cyl(.022, .022, .02, 10), c, -.09 + k * .06, .5, .04, -.35, 0, 0));
    add(G.cyl(.035, .035, .1, 12), '#c9cfe0', .1, .5, -.06);
  }));
  const stick = grp(); put(stick, .1, .55, -.06); stick.visible = false; con.add(stick);
  stick.add(live(mc('liftstage-stick', ({ add }) => { add(G.cyl(.018, .018, .22, 8), '#ffffff', 0, .11, 0); add(G.sph(.055, 12, 10), '#ff7fb0', 0, .25, 0); add(G.sph(.03, 8, 6), '#ffffff', .02, .27, .03); })));
  // three spot beams that sweep the stage during the show (see-through, hidden till then)
  const beams = [];
  ['#ff7fb0', '#7fe0c8', '#ffe27a'].forEach((c, k) => {
    const pv = grp(); put(pv, -1.1 + k * 1.1, 1.95, -.6); pv.visible = false; f.add(pv);
    const m = live(mesh(new THREE.ConeGeometry(.32, 1.7, 18, 1, true), mat(c, { opacity: .32, side: THREE.DoubleSide }), { cast: false, recv: false }));
    m.position.y = -.85; pv.add(m); beams.push(pv);
  });
  const p = f.part('lift', [lift, col], (t, bL) => {   // (not the console: the friend pops out of the middle of the part)
    const k = smooth(t); lift.position.y = bL.p.y + UP * k; col.visible = k > .01; col.scale.y = Math.max(.02, UP * k);
  }, { label: '무대 리프트', sfx: 'lift', dur: 1.2 });
  p.device = 'stagelift';
  const ls = f.spot('inside', lift, 0, .03, 0, { part: p, maxH: .5, label: '무대 리프트', scale: .8 }); ls.reserved = true;
  Object.assign(f, { lift, stick, beams, centerAt: new THREE.Vector3(0, H + .5, LZ) });
};
// ── 59판 통나무 오두막 ───────────────────────────────────────────────────────────────────────────────────────────
B.starloft = (f, T) => {
  const wood = (T && T.wood) || '#d9a466', woodD = (T && T.woodD) || '#a8733f', BZ = -.47, HY = 1.95, HS = .62;
  // the crate and the tin lantern on it (the glow inside shows once lit)
  f.add(mc('starloft-crate|' + wood, ({ add }) => {
    add(G.box(.5, .36, .38, .02), woodD, -.05, .18, -.2);
    for (const y of [.08, .26]) add(G.box(.52, .05, .4, .01), wood, -.05, y, -.2);
  }));
  const lan = grp(); put(lan, -.05, .36, -.2); f.add(lan);
  lan.add(mc('starloft-lantern', ({ add }) => {
    add(G.cyl(.11, .12, .03, 16), '#8a6a4a', 0, .015, 0);
    add(G.cyl(.1, .1, .24, 16, true), '#c9b48a', 0, .15, 0);
    for (let k = 0; k < 10; k++) { const a = k * 1.3, y = .07 + (k % 4) * .045; add(G.sph(.012, 6, 5), '#5b4a3a', Math.cos(a) * .1, y, Math.sin(a) * .1); }   // the punched star holes
    add(G.cone(.13, .1, 16), '#8a6a4a', 0, .32, 0);
    add(G.tor(.04, .008, PI * 2, 4, 10), '#5b4a3a', 0, .4, 0);
  }));
  const glow = live(mesh(new THREE.SphereGeometry(.07, 12, 10), mat('#ffd36b', { emissive: '#ffb347', ei: 1.4 }), { cast: false, recv: false }));
  put(glow, 0, .15, 0); glow.visible = false; lan.add(glow);
  // the attic hatch high on the wall, a star latch on it, and the ladder folded up under it
  f.add(mc('starloft-frame|' + woodD, ({ add }) => {
    add(G.box(HS + .1, .06, .06, .015), woodD, 0, HY + HS / 2 + .03, BZ + .03);
    add(G.box(HS + .1, .06, .06, .015), woodD, 0, HY - HS / 2 - .03, BZ + .03);
    for (const sx of [-1, 1]) add(G.box(.06, HS + .12, .06, .015), woodD, sx * (HS / 2 + .03), HY, BZ + .03);
    add(G.box(HS, HS, .02, .005), '#2a1d33', 0, HY, BZ + .005);   // the dark inside behind the door
  }));
  const door = grp(); put(door, 0, HY - HS / 2, BZ + .04); f.add(door);   // hinged at the bottom: it swings down and out
  // (painted the cabin roof's green, so it doesn't melt into the log wall)
  door.add(mc('starloft-door', ({ add }) => {
    add(G.box(HS - .02, HS - .02, .04, .015), '#5e9a6e', 0, HS / 2, 0);
    for (const x of [-.15, 0, .15]) add(G.box(.014, HS - .06, .045, .004), '#4a7f59', x, HS / 2, 0);
    add(G.cyl(.075, .075, .012, 18), '#2f4f3a', 0, HS - .14, .022, HP, 0, 0);
  }));
  const latch = live(mesh(geoStar(), mat('#ffcf3c', { emissive: '#ffcf3c', ei: .25 })));
  put(latch, 0, HS - .14, .035); latch.scale.setScalar(1.25); door.add(latch);
  const lad = grp(); put(lad, 0, HY - HS / 2, BZ + .1); f.add(lad);
  lad.add(mc('starloft-ladder|' + woodD, ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.04, 1.75, .04, .01), woodD, sx * .2, -.875, 0);
    for (let k = 0; k < 7; k++) add(G.box(.4, .03, .05, .008), wood, 0, -.15 - k * .24, 0);
  }));
  lad.scale.y = .32;   // folded up under the hatch (not near 0: see liftstage)
  // the stars the lantern throws on the wall round the hatch, and the lines between them
  const sky = grp(); sky.visible = false; f.add(sky);
  const SP = [[-.95, 1.45], [-.7, 1.9], [-.45, 2.35], [-.15, 2.62], [.3, 2.55], [.55, 2.25], [.85, 2.45], [1.0, 1.95], [.75, 1.55], [-.85, 2.6]];
  // (unlit, so they read as light thrown on the wall, each with a soft halo)
  const SM = new THREE.MeshBasicMaterial({ color: '#fff27a' }), HM = new THREE.MeshBasicMaterial({ color: '#fff6c0', transparent: true, opacity: .4, depthWrite: false });
  const HG2 = new THREE.CircleGeometry(.11, 20);
  const stars = SP.map(([x, y], i) => {
    const m = grp(); put(m, x, y, BZ + .025); m.scale.setScalar(i % 3 ? 1.0 : 1.4); sky.add(m);
    const st = live(mesh(geoStar(), SM, { cast: false, recv: false })); m.add(st);
    const hl = live(mesh(HG2, HM, { cast: false, recv: false })); hl.position.z = -.006; m.add(hl);
    return m;
  });
  const lines = live(mesh(lineGeo(SP, BZ + .02), new THREE.MeshBasicMaterial({ color: '#fff6c0', transparent: true, opacity: .75, depthWrite: false }), { cast: false, recv: false }));
  sky.add(lines);
  const p = f.part('hatch', [door, lad, lan], (t, bD, bL) => {
    door.rotation.x = smooth(clamp01(t * 1.6)) * 1.75;
    const k = smooth(clamp01((t - .35) / .65));
    lad.scale.y = .32 + .68 * k; lad.position.z = bL.p.z + .45 * k; lad.rotation.x = -.42 * k;
  }, { label: '다락 문', sfx: 'creak', dur: 1.2 });
  p.device = 'starloft';
  const hs = f.spot('inside', null, 0, HY - HS / 2 + .02, BZ - .12, { part: p, maxH: .5, label: '다락 안', scale: .8 }); hs.reserved = true;
  f.spot('on', null, .28, .02, .1, { maxH: .35, label: '사다리 옆', scale: .75 });
  Object.assign(f, { glow, sky, stars, latch, hatchAt: new THREE.Vector3(0, HY, BZ + .1), unitAt: new THREE.Vector3(0, 1.4, 0) });
};
// flat strips from star to star on the wall (z), the constellation's lines
function lineGeo(P, z) {
  const pos = [], idx = [];
  for (let i = 0; i < P.length - 2; i++) {
    const [ax, ay] = P[i], [bx, by] = P[i + 1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L * .012, ny = dx / L * .012, b = pos.length / 3;
    pos.push(ax + nx, ay + ny, z, ax - nx, ay - ny, z, bx + nx, by + ny, z, bx - nx, by - ny, z);
    idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
let STAR_G = null;
function geoStar() {
  if (STAR_G) return STAR_G;
  STAR_G = new THREE.ExtrudeGeometry(starShape(.075, .035, 5), { depth: .01, bevelEnabled: false });
  STAR_G.center();
  return STAR_G;
}
function tube3(add, a, b, r, color) {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()), e = new THREE.Euler().setFromQuaternion(q);
  const m = A.clone().add(Bv).multiplyScalar(.5);
  add(new THREE.CylinderGeometry(r, r, L, 5), color, m.x, m.y, m.z, e.x, e.y, e.z);
}

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
DEVICE_ITEMS.pulleyhandle = { name: '도르래 손잡이', h: .06, flat: true, noCollect: true, build() {
  const g = grp();
  g.add(put(cyl(.014, .014, .12, '#a9b2c8', null, 8), 0, .016, 0, HP, 0, 0));
  g.add(put(rbox(.13, .024, .024, '#a9b2c8', .008), .055, .016, .06));
  g.add(put(cyl(.024, .024, .07, '#ff6b6b', null, 12), .11, .045, .06));
  return g;
} };
DEVICE_ITEMS.lightstick = { name: '응원봉', h: .08, flat: true, noCollect: true, build() {
  const g = grp();
  g.add(put(cyl(.018, .018, .2, '#ffffff', null, 8), 0, .02, 0, HP, 0, 0));
  g.add(put(cyl(.022, .022, .05, '#5b5672', null, 8), 0, .02, .1, HP, 0, 0));
  g.add(put(mesh(new THREE.SphereGeometry(.05, 14, 10), mat('#ff7fb0', { emissive: '#ff7fb0', ei: .5 })), 0, .045, -.12));
  return g;
} };
DEVICE_ITEMS.matches = { name: '성냥', h: .04, flat: true, noCollect: true, build() {
  const g = grp();
  g.add(put(rbox(.14, .035, .09, '#ff5a5a', .006), 0, .0175, 0));
  g.add(put(rbox(.1, .036, .06, '#fff3e2', .004), 0, .018, 0));
  for (let k = 0; k < 3; k++) { g.add(put(cyl(.004, .004, .11, '#f0d9a8', null, 5), -.02 + k * .02, .045, .02, Math.PI / 2, 0, .3)); g.add(put(mesh(new THREE.SphereGeometry(.009, 6, 5), mat('#c8382f')), -.02 + k * .02 + .016, .045, .075)); }
  return g;
} };
export const DEVICE_BUILDERS = B;
export const DEVICE_INFO = {
  sluicepond: { w: 3, d: 3, name: '수문 연못', price: 0, hidden: true },
  changergo: { w: 1, d: 1, name: '동전 교환기', price: 0, hidden: true },
  dryergo: { w: 1, d: 1, name: '코인 세탁기', price: 0, hidden: true },
  pulleyjang: { w: 2, d: 1, name: '도르래 장독대', price: 0, hidden: true },
  liftstage: { w: 3, d: 2, name: '리프트 무대', price: 0, hidden: true },
  starloft: { w: 1, d: 1, name: '다락 사다리', price: 0, hidden: true },
};

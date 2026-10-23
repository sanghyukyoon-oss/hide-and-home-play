// 27판 역의 장치 일곱 (GPT 작업장 gpt-station gptstation2-devices.js, fix-1022 — ① 10/22 들여옴: 빌더와 부품(f.part)만, 작업장의 장치 엔진·
// 연쇄는 뺌 — 잇는 건 ② 몫. 간판 글자는 우리 fitText로, 바구니 고양이는 이미 우리 ChibiCat).
// Sakura station 2: seven tactile escape-room toys. All moving solids use Furn.part;
// the shared HG/hmc pipeline supplies the same three-tone paint and ink as the game.
import * as THREE from 'three';
import { sign } from './gptst-kit.js';
import { grp, put, mesh, mat, canvasTex, texCache } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { ChibiCat } from './cat.js';

const B = {}, PI = Math.PI, HP = PI / 2;
const C = { cream: '#f4f2f0', pale: '#a2cedc', honey: '#e5aa45', sage: '#4ab59a', brown: '#6f4b30', coral: '#ed876f', rope: '#cfa978', steel: '#a5bdc6', paper: '#fbf7f0', olive: '#7eb45e' };
const label = (g, text, w, h, x, y, z, bg = C.cream, fg = C.brown, ry = 0) => sign(g, text, w, h, x, y, z, bg, fg, ry);
function device(f, kind, pivots, apply, name, sfx = 'click') {
  const p = f.part(kind === 'drawer' ? 'drawer' : 'device', pivots, apply, { label: name, sfx, dur: .34 });
  p.gpt2Device = kind; p.lockable = false; p.noSearch = true;
  // Room.fitParts must not shorten a rope/rotation just because its rest box touches the frame.
  p.gpt2Reach = true; return p;
}
function tapAnchor(p, parent, x = 0, y = 0, z = 0) {
  const a = new THREE.Object3D(); a.position.set(x, y, z); parent.add(a); p.gpt2Anchor = a; return a;
}
function live(f, g) { (f.live ||= []).push(g); return g; }
function brassCrank(key = 'loose') {
  return mc('gpt2-brasscrank|' + key, ({ add, tube }) => {
    add(G.cyl(.075, .075, .15, 10), C.honey, 0, 0, 0, HP);
    tube([0, 0, .07], [.28, 0, .07], .045, C.honey, 8);
    tube([.28, 0, .07], [.28, 0, .23], .045, C.honey, 8);
    add(G.cyl(.075, .075, .22, 10), C.coral, .28, 0, .27, HP);
    add(G.cyl(.083, .083, .025, 10), C.brown, .28, 0, .38, HP);
  });
}
function keyModel() {
  return mc('gpt2-hat-key', ({ add, tube }) => {
    add(G.tor(.12, .037, PI * 2, 5, 16), C.honey, -.12, .02, 0, HP);
    add(G.box(.30, .055, .07, .014), C.honey, .09, .02, 0);
    for (const x of [.15, .23]) add(G.box(.052, .06, .12, .012), C.honey, x, .02, .06);
    add(G.box(.18, .045, .13, .02), C.sage, -.12, .02, -.21);
    tube([-.12, .02, -.26], [-.12, .02, -.52], .027, C.sage, 6);
  });
}

// A two-faced board: the reverse is real, with a readable mechanical pictogram.
B.gpt2_flipsign = f => {
  f.collideBox = [-.83, 0, -.30, .83, 2.0, .30];
  f.add(mc('gpt2-flipsign-frame', ({ add, tube }) => {
    for (const x of [-.76, .76]) {
      add(G.box(.10, 1.99, .13, .023), C.brown, x, .995, 0);
      add(G.box(.37, .08, .51, .04), C.pale, x, .04, 0);
      add(G.sph(.085, 8, 6), C.honey, x, 2.03, 0);
    }
    add(G.box(1.74, .12, .32, .04), C.sage, 0, 2.0, 0);
    tube([-.79, 1.32, 0], [.79, 1.32, 0], .035, C.honey);
    add(G.box(.24, .17, .13, .022), C.sage, .77, 1.32, .02);
  }));
  const board = grp(); put(board, 0, 1.34, 0); f.add(board);
  board.add(mc('gpt2-flipsign-board', ({ add, tube }) => {
    add(G.box(1.40, .91, .115, .045), C.pale, 0, 0, 0);
    add(G.box(1.25, .72, .025, .025), C.cream, 0, 0, .072);
    add(G.box(1.25, .72, .025, .025), C.cream, 0, 0, -.072);
    for (const x of [-.43, -.17, .09, .35]) add(G.box(.14, .045, .016, .005), C.sage, x, -.19, .094);
    // Reverse icons read left-to-right once the board turns: crank → barrier → cat.
    add(G.tor(.11, .025, PI * 1.7, 5, 16), C.honey, .41, .02, -.096, 0, PI);
    tube([.41, -.10, -.11], [.27, -.17, -.11], .024, C.brown);
    tube([.14, .09, -.10], [-.09, -.11, -.10], .029, C.coral);
    add(G.box(.055, .26, .025, .008), C.brown, .14, -.12, -.105);
    add(G.sph(.13, 10, 7), C.honey, -.42, -.02, -.104, 0, 0, 0, [1, .9, .22]);
    for (const x of [-.51, -.33]) add(G.cone(.064, .12, 4), C.honey, x, .10, -.11, 0, PI / 4);
    for (const x of [-.47, -.38]) add(G.sph(.016, 6, 4), C.brown, x, -.01, -.141);
  }));
  label(board, '벚꽃마을역', 1.15, .30, 0, .14, .096, C.cream, C.brown);
  label(board, '봄기차 27', 1.13, .15, 0, -.04, .096, C.cream, C.brown);
  label(board, '08:35   →   27', 1.16, .16, 0, -.29, -.097, C.cream, C.brown, PI);
  const handle = grp(); put(handle, .79, 1.32, .19); f.add(handle);
  handle.add(mc('gpt2-flipsign-handle', ({ add }) => { add(G.sph(.14, 10, 7), C.honey, 0, 0, 0); }));
  const p = device(f, 'flipsign', [board, handle], t => { board.rotation.y = PI * t; handle.rotation.z = PI * t; }, '뒤집는 역 간판', 'flip');
  tapAnchor(p, handle);
  p.handle = handle; p.handlePad = 24; Object.assign(f, { board, handle, gpt2Part: p });
};

// The cabinet is an actual empty shell; the tray has five walls and a hinged false floor.
B.gpt2_falsebottom = f => {
  f.collideBox = [-.70, 0, -.47, .70, 1.15, .47];
  f.add(mc('gpt2-lostproperty-cabinet', ({ add }) => {
    add(G.box(1.42, .10, .94, .035), C.brown, 0, .05, 0);
    add(G.box(1.42, .12, 1.00, .04), C.pale, 0, 1.11, 0);
    add(G.box(1.25, .91, .07, .02), C.pale, 0, .59, -.43);
    for (const x of [-.66, .66]) add(G.box(.10, .96, .94, .025), C.sage, x, .60, 0);
    add(G.box(1.20, .07, .82, .015), C.pale, 0, .31, -.01);
    add(G.box(1.22, .26, .06, .018), C.sage, 0, .20, .44);
    // A real shallow shelf with everyday lost property above the drawer.
    add(G.box(1.20, .045, .79, .012), C.pale, 0, .91, -.01);
    add(G.box(.31, .11, .28, .026), C.coral, -.36, 1.215, -.17);
    add(G.tor(.10, .025, PI, 5, 12), C.brown, -.36, 1.30, -.17);
    add(G.cyl(.10, .07, .13, 12), C.cream, .39, 1.24, -.10);
    for (const x of [-.59, .59]) add(G.box(.12, .11, .12, .025), C.brown, x, .08, .32);
  }));
  label(f.group, '분실물', .73, .14, -.13, .20, .482, C.sage, C.brown);
  const tray = grp(); put(tray, 0, .57, .41); f.add(tray);
  tray.add(mc('gpt2-lostproperty-tray', ({ add }) => {
    add(G.box(1.19, .50, .07, .024), C.sage, 0, 0, 0);
    add(G.box(1.12, .045, .73, .014), C.pale, 0, -.23, -.37);
    for (const x of [-.56, .56]) add(G.box(.045, .37, .73, .012), C.pale, x, -.025, -.37);
    add(G.box(1.12, .37, .045, .012), C.pale, 0, -.025, -.72);
    add(G.box(.31, .075, .11, .026), C.honey, 0, .03, .072);
    add(G.box(.19, .035, .024, .007), C.brown, 0, .035, .137);
  }));
  // Full extension takes the rear false-floor hinge beyond the counter lip,
  // so the panel can stand up without cutting through the cabinet's solid top.
  const drawer = device(f, 'drawer', tray, (t, b) => { tray.position.z = b.p.z + .91 * t; }, '분실물 서랍', 'drawer');
  tapAnchor(drawer, tray, 0, .03, .13);
  const floor = grp(); put(floor, 0, .02, -.69); tray.add(floor);
  floor.add(mc('gpt2-false-floor', ({ add }) => {
    add(G.box(1.05, .045, .61, .012), C.pale, 0, 0, .30);
    for (const x of [-.33, 0, .33]) add(G.box(.012, .008, .57, .004), '#e3c9a3', x, .027, .30);
    add(G.tor(.055, .016, PI * 2, 5, 12), C.honey, .28, .032, .43, HP);
  }));
  // Opening the false bottom raises a little spring tray: the crank comes up
  // above the deep drawer's front lip, instead of remaining invisible below it.
  const lift = grp(); put(lift, -.15, -.19, -.46); tray.add(lift);
  lift.add(mc('gpt2-crank-lift-tray', ({ add }) => {
    add(G.box(.55, .035, .52, .025), C.cream, .10, 0, .15);
  }));
  const struts = [-.23, .17].map(x => { const r = mesh(G.cyl(.037, .037, 1, 8), mat(C.honey)); tray.add(r); r.userData.strutX = x; return r; });
  let tool;
  const fp = device(f, 'falsebottom', [floor, lift, ...struts], t => {
    floor.rotation.x = -1.55 * t; lift.position.y = -.19 + .58 * t; lift.position.z = -.46 + .18 * t;
    if (tool) { tool.position.y = -.088 + .58 * t; tool.position.z = -.46 + .18 * t; tool.rotation.x = -.40 * t; }
    for (const r of struts) {
      const a = new THREE.Vector3(r.userData.strutX, -.22, -.31), b = new THREE.Vector3(r.userData.strutX, lift.position.y - .0175, lift.position.z + .15), d = b.clone().sub(a);
      r.position.copy(a).add(b).multiplyScalar(.5); r.scale.y = Math.max(.005, d.length()); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    }
  }, '서랍의 비밀 바닥', 'thunk');
  tapAnchor(fp, floor, .28, .032, .43);
  tool = grp(); put(tool, -.15, -.088, -.46, 0, -.25, 0); tool.scale.setScalar(1.10); tray.add(tool); tool.add(brassCrank());
  // (② 10/22: the brass crank rides up as a picture of the false bottom's secret, not a part — the pulley keeps its own crank)
  // Dedicated spots are reserved: normal hide-and-seek items must not plug this mechanism.
  f.spot('inside', tray, .29, -.13, -.37, { part: fp, maxH: .20, label: '서랍 비밀칸', scale: .85 });   // (② 10/22: a hiding place of the stage — '빈 서랍도 다시 보게')
  fp.setOpen(0);
  Object.assign(f, { tray, falseFloor: floor, tool, crankLift: lift, drawerPart: drawer, floorPart: fp, gpt2Part: drawer });
};

// Oversized removable crank and a lever. The empty brass socket is visible before the tool is found.
B.gpt2_signal = f => {
  f.collideBox = [-.53, 0, -.38, .53, 1.48, .38];
  f.add(mc('gpt2-station-signal', ({ add, tube }) => {
    add(G.box(.94, .11, .71, .05), C.pale, 0, .055, 0);
    add(G.box(.57, .81, .52, .05), C.sage, 0, .52, -.03);
    add(G.box(.69, .11, .62, .04), C.pale, 0, .97, -.03);
    add(G.box(.48, .26, .055, .02), C.cream, 0, .73, .263);
    for (const x of [-.14, .14]) add(G.cyl(.055, .055, .023, 10), x < 0 ? C.coral : C.honey, x, .74, .301, HP);
    add(G.cyl(.11, .11, .048, 12), C.honey, .20, .41, .281, HP);
    add(G.cyl(.058, .058, .022, 10), C.brown, .20, .41, .316, HP);
    add(G.box(.11, .34, .12, .022), C.brown, -.24, 1.16, -.04, 0, 0, -.25);
    // The rod meets the trackside linkage; it is never a disconnected floating lever.
    tube([-.24, 1.05, -.04], [-.24, .18, -.04], .035, C.honey);
    tube([-.24, .18, -.04], [.49, .18, -.04], .035, C.honey);
  }));
  label(f.group, '기차 신호', .47, .10, 0, .87, .268, C.cream, C.brown);
  const lever = grp(); put(lever, -.23, 1.08, .025); f.add(lever);
  lever.add(mc('gpt2-signal-lever', ({ add, tube }) => {
    add(G.cyl(.10, .10, .12, 12), C.honey, 0, 0, 0, HP);
    tube([0, 0, .08], [0, .42, .08], .045, C.honey);
    add(G.cap(.13, .14, 2, 8), C.coral, 0, .42, .08, 0, 0, HP);
  }));
  const crank = live(f, grp()); put(crank, .20, .41, .34); f.add(crank); crank.add(brassCrank('installed')); crank.visible = false;
  const p = device(f, 'signal', lever, t => { lever.rotation.x = 1.18 * t; crank.rotation.z = -PI * 2 * t; }, '건널목 신호 레버', 'latch');
  tapAnchor(p, lever, 0, .42, .08); p.needMsg = '크랭크가 빠져 있네…';
  p.handle = lever; p.handlePad = 28;
  Object.assign(f, { lever, crank, gpt2Part: p });
};

// A true hinge with a counterweight: horizontal arm at t=1, upright at t=0.
B.gpt2_crossing = (f, T, o = {}) => {
  const dir = o.flip ? -1 : 1;
  f.collideBox = [-.24, 0, -.30, .24, 1.78, .30];
  f.add(mc('gpt2-crossing-post|' + dir, ({ add }) => {
    add(G.box(.42, .12, .48, .045), C.pale, 0, .06, 0);
    add(G.cyl(.066, .08, 1.43, 10), C.honey, 0, .80, 0);
    for (let j = 0; j < 4; j++) add(G.cyl(.068, .068, .13, 10), C.brown, 0, .31 + j * .28, 0);
    add(G.box(.66, .10, .09, .02), C.pale, 0, 1.67, 0, 0, 0, .54);
    add(G.box(.66, .10, .09, .02), C.pale, 0, 1.67, 0, 0, 0, -.54);
    add(G.box(.61, .09, .10, .022), C.brown, 0, 1.36, .04);
    for (const x of [-.23, .23]) {
      add(G.cyl(.12, .12, .09, 12), C.brown, x, 1.36, .08, HP);
      add(G.cyl(.083, .083, .025, 12), C.coral, x, 1.36, .14, HP);
    }
    add(G.box(.29, .40, .30, .03), C.sage, 0, .36, .15);
    add(G.cyl(.11, .11, .13, 12), C.honey, 0, .91, .12, HP);
  }));
  const arm = grp(); put(arm, 0, .91, .22); f.add(arm);
  arm.add(mc('gpt2-crossing-arm|' + dir, ({ add }) => {
    const L = 1.75;
    add(G.box(L, .13, .13, .025), C.cream, dir * L / 2, 0, 0);
    for (let k = 0; k < 5; k++) add(G.box(.16, .136, .139, .016), C.coral, dir * (.18 + k * .33), 0, 0);
    add(G.box(.28, .24, .22, .035), C.sage, -dir * .21, 0, 0);
    add(G.cyl(.10, .10, .17, 12), C.honey, 0, 0, 0, HP);
  }));
  const button = grp(); put(button, 0, .40, .33); f.add(button);
  button.add(mc('gpt2-crossing-button', ({ add }) => {
    add(G.cyl(.15, .15, .035, 14), C.cream, 0, 0, 0, HP);
    add(G.cyl(.105, .105, .075, 14), C.coral, 0, 0, .045, HP);
    add(G.box(.08, .02, .012, .005), C.cream, 0, 0, .089);
  }));
  const p = device(f, 'crossing', [arm, button], t => { arm.rotation.z = dir * HP * (1 - t); button.position.z = .33 - .035 * t; }, '꽃길 건널목 버튼과 차단기', 'crossingNear');
  tapAnchor(p, button, 0, 0, .085);
  p.crossing = true;   // (② 10/22: the stage's crossing — staging.js stagingCrossing lowers it, runs the freight train, blows the roof hat down)
  p.setOpen(0); Object.assign(f, { arm, button, barrierPart: p, gpt2Part: p });
};

// A basket with a real open interior, visible reeved rope, wheel, drum and counterweight.
B.gpt2_pulley = f => {
  f.collideBox = [-.91, 0, -.55, 1.18, 2.89, .55];
  f.add(mc('gpt2-pulley-gantry', ({ add, tube }) => {
    for (const x of [-.76, .72]) {
      add(G.box(.13, 2.72, .17, .03), C.brown, x, 1.36, -.20);
      add(G.box(.34, .10, .48, .04), C.pale, x, .05, -.20);
    }
    add(G.box(1.81, .16, .23, .04), C.honey, 0, 2.77, -.20);
    add(G.box(.13, .12, .50, .025), C.honey, -.15, 2.73, -.01);
    for (const z of [-.035, .095]) add(G.box(.045, .25, .045, .012), C.brown, -.15, 2.59, z);
    add(G.cyl(.04, .04, .27, 10), C.honey, -.15, 2.56, .03, HP);
    add(G.box(.30, .32, .23, .04), C.sage, .70, 1.16, -.04);
    // Rope returns continuously from the right rim of the wheel to the winch drum.
    tube([.06, 2.56, .03], [.70, 1.28, .03], .023, C.rope, 6);
    add(G.cyl(.11, .11, .25, 12), C.honey, .70, 1.17, .10, HP);
    add(G.box(.18, 2.25, .13, .025), C.pale, 1.04, 1.24, -.15);
    add(G.box(.33, .07, .32, .025), C.pale, 1.04, .08, -.15);
    add(G.box(.36, .21, .05, .015), C.cream, -.05, 2.76, -.061);
  }));
  label(f.group, '고양이 짐차', .33, .13, -.05, 2.76, -.027, C.cream, C.brown);
  const wheel = live(f, grp()); put(wheel, -.15, 2.56, .03); f.add(wheel);
  wheel.add(mc('gpt2-pulley-wheel', ({ add }) => {
    add(G.tor(.21, .045, PI * 2, 6, 18), C.honey, 0, 0, 0);
    for (let i = 0; i < 4; i++) add(G.box(.36, .045, .045, .012), C.pale, 0, 0, 0, 0, 0, i * PI / 4);
    add(G.cyl(.071, .071, .11, 12), C.brown, 0, 0, .02, HP);
  }));
  const crank = grp(); put(crank, .70, 1.17, .30); f.add(crank); crank.add(brassCrank('pulley'));
  const basket = grp(); put(basket, -.36, 1.03, .03); f.add(basket);
  basket.add(mc('gpt2-pulley-basket', ({ add, tube }) => {
    add(G.box(.93, .08, .73, .045), C.pale, 0, .04, 0);
    for (const x of [-.445, .445]) add(G.box(.055, .35, .73, .025), C.pale, x, .24, 0);
    for (const z of [-.34, .34]) add(G.box(.91, .35, .055, .025), C.pale, 0, .24, z);
    for (const y of [.14, .26, .39]) {
      for (const z of [-.374, .374]) add(G.box(.94, .035, .025, .007), C.honey, 0, y, z);
      for (const x of [-.477, .477]) add(G.box(.025, .035, .70, .007), C.honey, x, y, 0);
    }
    for (let x = -.35; x <= .36; x += .14) add(G.box(.025, .29, .023, .006), '#dfc494', x, .25, .375);
    for (const x of [-.39, .39]) tube([x, .43, 0], [0, .79, 0], .027, C.rope, 6);
    add(G.tor(.05, .018, PI * 2, 5, 12), C.honey, 0, .80, 0);
    add(G.box(.37, .08, .28, .035), C.sage, .18, .12, -.12);
  }));
  // Reuse the approved game cat without an additional body/root scale or any
  // replacement ears, face, tail or costume. Preserve its animation nodes.
  const catActor = new ChibiCat({ scale: .44 }), cat = live(f, catActor.root);
  cat.traverse(o => { if (o.isMesh) { o.userData.noMerge = true; delete o.userData.char; } });
  catActor.shadow.visible = false; catActor.update(0);
  put(cat, -.02, .083, .07); basket.add(cat);
  cat.visible = false;
  let previousCatTime = null;
  f.tick = time => { const dt = previousCatTime == null ? 0 : Math.max(0, Math.min(.1, time - previousCatTime)); previousCatTime = time; catActor.update(dt); };
  // The oversize key hangs from the cat's collar in front of the basket, rather
  // than lying underneath the solid cat body where it could never be seen/tapped.
  const key = grp(); put(key, 0, .31, .46, HP, 0, -.12); basket.add(key); key.add(keyModel()); key.visible = false;
  const rope = live(f, grp()); f.add(rope);
  const strand = mesh(G.cyl(.023, .023, 1, 6), mat(C.rope)); rope.add(strand);
  const weight = live(f, grp()); put(weight, 1.04, .40, -.02); f.add(weight);
  weight.add(mc('gpt2-pulley-weight', ({ add }) => {
    add(G.box(.26, .34, .23, .04), C.sage, 0, 0, 0);
    add(G.box(.28, .045, .25, .012), C.honey, 0, .11, 0);
  }));
  const p = device(f, 'pulley', [basket, crank], t => {
    basket.position.y = 1.03 - .86 * t; crank.rotation.z = -PI * 3 * t; wheel.rotation.z = PI * 2 * t;
    const low = basket.position.y + .83, high = 2.56; strand.position.set(-.36, (low + high) / 2, .03); strand.scale.y = high - low;
    weight.position.y = .40 + .86 * t;
    cat.visible = t > .48; cat.position.y = .083; key.visible = false;   // (② 10/22: the locker key is the stage's own key — in the straw hat that lands in the basket, staging.js)
  }, '도르래 고양이 바구니', 'ratchet');
  p.handle = crank; p.handlePad = 28; p.setOpen(0);
  tapAnchor(p, crank, .28, 0, .27);
  const sp = f.spot('inside', basket, .20, .10, -.15, { part: p, maxH: .25, label: '고양이 바구니 안' }); sp.reserved = true;
  Object.assign(f, { basket, crank, wheel, rope, strand, counterweight: weight, catActor, cat, catKey: key, pulleyPart: p, gpt2Part: p });
};

// The parcel runs on a short, visibly connected roller ramp and trips the brass catch.
B.gpt2_parcelrack = f => {
  f.collideBox = [-1.1, 0, -.41, 1.1, 1.12, .41];
  f.add(mc('gpt2-parcel-ramp', ({ add, tube }) => {
    for (const x of [-.91, .91]) for (const z of [-.30, .30]) add(G.box(.09, .74, .09, .02), C.brown, x, .37, z);
    for (const z of [-.32, .32]) add(G.box(2.15, .10, .10, .025), C.pale, 0, .78, z, 0, 0, -.08);
    for (let x = -.92; x <= .93; x += .17) add(G.cyl(.065, .065, .59, 10), C.pale, x, .82 - x * .08, 0, HP);
    tube([-.96, .17, -.3], [.96, .17, -.3], .035, C.honey);
    add(G.box(.22, .18, .65, .03), C.sage, 1.06, .76, 0);
    add(G.box(.14, .06, .62, .015), C.honey, -.98, .94, 0);
    add(G.box(.46, .12, .40, .025), C.pale, -.47, .10, 0);
    add(G.box(.28, .05, .31, .012), C.cream, -.43, .20, .05);
    add(G.box(.11, .16, .22, .015), C.coral, .17, .13, .10, 0, .13);
  }));
  const parcel = grp(); put(parcel, -.70, 1.13, 0); f.add(parcel);
  parcel.add(mc('gpt2-rolling-parcel', ({ add }) => {
    add(G.box(.52, .43, .46, .05), C.pale, 0, 0, 0);
    for (const x of [-.15, .15]) add(G.box(.053, .438, .47, .008), C.honey, x, 0, 0);
    add(G.box(.53, .055, .47, .008), C.honey, 0, .02, 0);
    add(G.box(.25, .13, .016, .006), C.cream, -.01, .10, .24);
    for (let i = 0; i < 4; i++) add(G.box(.018, .075, .01, .003), C.brown, -.09 + i * .04, .10, .253);
  }));
  const catchArm = live(f, grp()); put(catchArm, 1.03, .84, .33); f.add(catchArm);
  catchArm.add(mc('gpt2-parcel-catch', ({ add, tube }) => {
    add(G.cyl(.055, .055, .10, 10), C.honey, 0, 0, 0, HP);
    tube([0, 0, .06], [.20, -.17, .06], .04, C.honey);
    add(G.sph(.085, 8, 6), C.coral, .20, -.17, .06);
  }));
  const p = device(f, 'parcelrack', parcel, t => {
    parcel.position.x = -.70 + 1.53 * t; parcel.position.y = 1.13 - .13 * t + Math.sin(t * PI * 5) * .027;
    parcel.rotation.z = -.08 - t * .10; catchArm.rotation.z = t > .87 ? -1.15 * (t - .87) / .13 : 0;
  }, '소포 롤러 선반', 'slide');
  tapAnchor(p, parcel, 0, .12, .09);
  label(f.group, '여행 짐', .60, .15, 0, .60, .377, C.cream, C.brown);
  Object.assign(f, { parcel, catchArm, parcelPart: p, gpt2Part: p });
};

// The main recipe's final destination: a genuine coin-locker shell, with a
// hinged full-height door and the frog traveller's fishing bag inside.
B.gpt2_locker = f => {
  f.collideBox = [-.60, 0, -.43, .60, 2.01, .43];
  f.add(mc('gpt2-fishing-coin-locker', ({ add }) => {
    add(G.box(1.20, .10, .85, .035), C.brown, 0, .05, 0);
    add(G.box(1.20, .10, .85, .035), C.pale, 0, 1.95, 0);
    for (const x of [-.55, .55]) add(G.box(.10, 1.80, .85, .025), C.sage, x, 1.0, 0);
    add(G.box(1.00, 1.80, .065, .015), C.pale, 0, 1.0, -.391);
    add(G.box(1.00, .065, .73, .015), C.pale, 0, .17, -.005);
    add(G.box(.96, .045, .66, .012), C.cream, 0, 1.71, -.015);
    // Upper shelf: a folded rain towel, a thermos and an unused train ticket.
    for (let j = 0; j < 2; j++) add(G.box(.29, .055, .22, .018), j ? C.cream : C.olive, -.25, 1.77 + j * .05, -.13);
    add(G.cyl(.07, .075, .14, 10), C.honey, .26, 1.81, -.14);
    add(G.cyl(.072, .072, .03, 10), C.brown, .26, 1.875, -.14);
  }));
  const door = grp(); put(door, -.51, .19, .445); f.add(door);
  door.add(mc('gpt2-fishing-locker-door', ({ add }) => {
    add(G.box(1.02, 1.69, .075, .035), C.sage, .51, .845, 0);
    add(G.box(.86, .22, .025, .018), C.cream, .51, 1.47, .052);
    for (let y = .18; y < .37; y += .065) add(G.box(.62, .025, .025, .007), C.brown, .51, y, .052);
    add(G.box(.14, .35, .04, .025), C.pale, .85, .89, .058);
    add(G.cyl(.065, .065, .025, 10), C.honey, .85, .91, .093, HP);
    add(G.box(.025, .046, .014, .005), C.brown, .85, .90, .111);
    add(G.box(.085, .16, .085, .02), C.honey, .85, 1.08, .10);
    for (const y of [.16, 1.34]) add(G.cyl(.045, .045, .17, 10), C.honey, -.006, y, -.01);
  }));
  label(door, '27번 보관함', .80, .15, .51, 1.47, .071, C.cream, C.brown);
  const present = grp(); put(present, .03, .2275, -.04); f.add(present);
  present.add(mc('gpt2-locker-presentation-tray', ({ add }) => {
    add(G.box(.84, .035, .63, .025), C.pale, 0, 0, 0);
    add(G.box(.84, .065, .06, .015), C.honey, 0, .01, .30);
  }));
  f.add(mc('gpt2-locker-tray-runners', ({ add }) => {
    for (const x of [-.32, .38]) add(G.box(.045, .02, .68, .008), C.brown, x, .20, -.02);
  }));
  let bag;
  const dp = device(f, 'locker', [door, present], t => {
    door.rotation.y = -1.62 * t; present.position.z = -.04 + .72 * t;
    if (bag) bag.position.z = -.04 + .72 * t;
  }, '코인 로커 27번', 'door_metal');
  tapAnchor(dp, door, .85, 1.0, .14); dp.needMsg = '로커 열쇠가 어디 갔지…';
  dp.lockable = true; dp.noSearch = false;   // (② 10/22: 27판 방탈출 — the padlock goes on locker 27, its key in the straw hat)
  bag = grp(); put(bag, .03, .22, -.04); f.add(bag);
  bag.add(mc('gpt2-frog-fishing-bag', ({ add, tube }) => {
    add(G.box(.67, .45, .37, .09), C.olive, 0, .25, 0);
    add(G.box(.71, .15, .41, .055), C.sage, 0, .47, .015);
    for (const x of [-.23, .23]) {
      add(G.box(.06, .45, .032, .012), C.pale, x, .27, .205);
      add(G.box(.095, .10, .035, .016), C.honey, x, .27, .23);
    }
    add(G.tor(.14, .034, PI, 5, 14), C.brown, 0, .56, 0);
    add(G.box(.34, .22, .055, .04), C.cream, 0, .24, .219);
    add(G.sph(.073, 9, 6), C.sage, -.07, .29, .254, 0, 0, 0, [1, .9, .32]);
    add(G.sph(.073, 9, 6), C.sage, .07, .29, .254, 0, 0, 0, [1, .9, .32]);
    add(G.box(.18, .12, .025, .035), C.sage, 0, .23, .264);
    for (const x of [-.07, .07]) add(G.sph(.015, 6, 4), C.brown, x, .31, .282);
    // A full-sized rod tube and bobber make it instantly a fishing bag.
    tube([-.31, .08, -.10], [-.31, .98, -.10], .045, C.honey, 8);
    tube([-.31, .95, -.10], [-.10, 1.08, -.10], .027, C.brown, 6);
    tube([-.10, 1.08, -.10], [.02, .83, -.10], .018, C.pale, 5);
    add(G.sph(.065, 8, 6), C.coral, .02, .81, -.10, 0, 0, 0, [.85, 1.3, .85]);
    add(G.box(.13, .11, .11, .03), C.brown, -.31, .42, -.10);
  }));
  const bp = device(f, 'fishingbag', bag, (t, b) => { bag.position.y = b.p.y + .15 * t; bag.scale.setScalar(1 - .12 * t); }, '개굴이 낚시 가방', 'found');
  tapAnchor(bp, bag, 0, .38, .25);
  f.spot('inside', null, .03, .22, -.04, { part: dp, maxH: 1.12, label: '27번 코인 로커 안' });   // (② 10/22: the padlocked locker holds the last thing of the bag)
  Object.assign(f, { lockerDoor: door, fishingBag: bag, bagTray: present, lockerPart: dp, bagPart: bp, gpt2Part: dp });
};

export const GPTST_DEVICE_BUILDERS = B;
export const GPTST_DEVICE_INFO = {
  gpt2_flipsign: { w: 2, d: 1, name: '뒤집는 벚꽃역 간판', hidden: true },
  gpt2_falsebottom: { w: 2, d: 1, name: '비밀 바닥 분실물 서랍', hidden: true },
  gpt2_signal: { w: 1, d: 1, name: '황동 크랭크 신호 레버', hidden: true },
  gpt2_crossing: { w: 1, d: 1, name: '꽃길 건널목 차단기', hidden: true },
  gpt2_pulley: { w: 2, d: 2, name: '역 고양이 도르래 바구니', hidden: true },
  gpt2_parcelrack: { w: 3, d: 1, name: '소포 롤러 선반', hidden: true },
  gpt2_locker: { w: 1.2, d: .85, name: '개굴이 낚시 가방 코인 로커', hidden: true },
};

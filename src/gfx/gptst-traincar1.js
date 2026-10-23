// 28판 두 량 객차가 빌려 쓰는 첫 객실 조각들 (GPT 작업장 gpt-station gpttraincar-props.js, fix-1022 — ① 10/22 들여옴: 빌더 그대로,
// 노선도 글자는 우리 fitText로).
// GPT train-car study, 2026-10-22. Static geometry uses the game's merged vertex-colour / toon material pipeline.
// A connected thick chassis, actual under-seat cubbies, a sliding inter-car door with a real vestibule behind it,
// stocked snack trolley, and three individually mapped flat scenic window inserts. Existing builders stay untouched.
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, texCache } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';

const PI = Math.PI, HP = PI / 2;
const C = { teal: '#50b99c', tealD: '#318fa3', mint: '#6bc7b0', blue: '#63aeda', blueD: '#3f8db1', pink: '#e575a3',
  pale: '#e9f0ed', cream: '#fbf7f0', maple: '#bc9168', woodD: '#6f4b30', silver: '#c8d8db', dark: '#644936',
  ochre: '#f8b15b', coral: '#ee7b72', white: '#fbf7f0', floor: '#d1ae90', window: '#9dcde8' };
const B = {}, scenic = texCache(), labels = texCache();
const plane = (f, w, h, tex, x, y, z) => { const p = mesh(new THREE.PlaneGeometry(w, h), mat(C.white, { map: tex, rim: 0 }), { cast: false }); put(p, x, y, z); f.add(p); return p; };
const suitcase = (add, tube, x, y, z, color, s = 1) => {
  add(G.box(.57 * s, .39 * s, .33 * s, .065 * s), color, x, y + .195 * s, z);
  for (const dx of [-.17, .17]) add(G.box(.045 * s, .40 * s, .344 * s, .01), C.woodD, x + dx * s, y + .20 * s, z);
  tube([x - .09 * s, y + .4 * s, z], [x - .09 * s, y + .47 * s, z], .017 * s, C.dark, 6);
  tube([x + .09 * s, y + .4 * s, z], [x + .09 * s, y + .47 * s, z], .017 * s, C.dark, 6);
  tube([x - .09 * s, y + .47 * s, z], [x + .09 * s, y + .47 * s, z], .017 * s, C.dark, 6);
  add(G.box(.09 * s, .1 * s, .015, .01), C.cream, x + .1 * s, y + .25 * s, z + .176 * s, 0, 0, -.15);
  add(G.cyl(.012*s,.012*s,.018,6),C.maple,x+.1*s,y+.285*s,z+.190*s,HP);
  add(G.box(.026*s,.028*s,.014,.003),C.white,x+.13*s,y+.215*s,z+.19*s,0,.25,-.15);
};

// floor-centred, never attached to a folding wall: the plinth and running gear remain connected in rotated views.
B.gpt_tc_shell = f => {
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  f.add(mc('gpt-tc-shell-v1', ({ add, tube }) => {
    add(G.box(5.38, .53, 7.43, .15), C.tealD, 0, -.275, 0);
    add(G.box(5.46, .12, 7.5, .055), C.maple, 0, -.08, 0);
    add(G.box(5.42, .075, 7.47, .03), C.cream, 0, -.185, 0);
    // The low outer side and the cut end reveal the seat interiors and feel like an actual cut-away carriage.
    add(G.box(.16, .34, 7.42, .055), C.cream, 2.62, .14, 0);
    add(G.box(.178, .08, 7.4, .025), C.maple, 2.62, .35, 0);
    add(G.box(.175, .1, 7.36, .025), C.teal, 2.63, .11, 0);
    add(G.box(5.26, .28, .17, .05), C.cream, 0, .11, 3.62);
    add(G.box(5.32, .07, .195, .025), C.maple, 0, .285, 3.62);
    for (const z of [-2.25, 2.25]) {
      add(G.box(4.8, .22, 1.18, .04), C.dark, 0, -.67, z);
      for (const x of [-2.08, 2.08]) for (const dz of [-.32, .32]) {
        add(G.cyl(.285, .285, .17, 18), '#644936', x, -.83, z + dz, 0, 0, HP);
        add(G.cyl(.12, .12, .185, 12), C.silver, x, -.83, z + dz, 0, 0, HP);
      }
      for (const dx of [-.8, .8]) add(G.box(.72, .17, .85, .04), '#a09769', dx, -.59, z);
    }
    // Two lower running rails make the train's purpose legible without adding a broad floor slab.
    for (const x of [-2.08, 2.08]) {
      add(G.box(.14, .1, 7.5, .02), '#a09769', x, -1.14, 0);
      add(G.box(.26, .055, 7.5, .02), '#c6c393', x, -1.09, 0);
    }
    for (let i = 0; i < 10; i++) add(G.box(4.8, .09, .2, .025), '#a09769', 0, -1.22, -3.25 + i * .72);
    // Rounded back eave, retained as a short curved lip rather than a ceiling over the room.
    for (const z of [-3.58, 3.58]) {
      add(G.box(.2, 2.98, .18, .04), C.teal, -2.61, 1.47, z);
      for (let k = 0; k < 6; k++) { const a = k / 5 * HP; add(G.box(.22, .16, .2, .035), C.cream, -2.55 + .45 * (1 - Math.cos(a)), 2.95 + .45 * Math.sin(a), z, 0, 0, -a); }
    }
    add(G.box(.62, .14, 7.43, .05), C.teal, -2.3, 3.31, 0);
    add(G.box(.12, .08, 7.2, .02), C.maple, -2.02, 3.25, 0);
    // Small embossed carriage badge on the exposed side.
    add(G.box(.035, .17, .48, .025), C.tealD, 2.722, -.34, 1.25);
    for (let k = 0; k < 3; k++) add(G.box(.04, .065, .045, .006), C.cream, 2.746, -.34, 1.12 + k * .12);
  }));
};

B.gpt_tc_bench = (f, T, o = {}) => {
  const seat = o.light ? C.blue : C.teal, back = o.light ? C.blueD : C.tealD;
  f.add(mc('gpt-tc-bench-v1|' + !!o.light + '|' + (o.arms || 'both'), ({ add, tube }) => {
    // Open carcass: bottom, back, three posts, actual empty cavities. No solid block behind the drawer.
    add(G.box(1.94, .07, .74, .02), C.maple, 0, .075, -.02);
    add(G.box(1.94, .4, .055, .02), C.woodD, 0, .29, -.34);
    for (const x of [-.925, 0, .925]) add(G.box(.07, .44, .76, .025), C.maple, x, .31, -.02);
    add(G.box(1.94, .065, .8, .025), C.maple, 0, .54, -.02);
    for (const x of [-.475, .475]) {
      add(G.box(.91, .22, .79, .075), seat, x, .665, -.02);
      add(G.box(.87, .5, .19, .07), back, x, .995, -.32, -.08);
      add(G.box(.012, .34, .015, .004), seat, x, 1.00, -.205, -.08);
      add(G.box(.84, .017, .018, .004), '#c6c393', x, .744, .343);
    }
    add(G.box(1.97, .055, .16, .022), C.maple, 0, 1.27, -.34);
    for (const x of o.arms === 'left' ? [-.975] : o.arms === 'right' ? [.975] : [-.975, .975]) {
      tube([x, .57, -.22], [x, .86, -.22], .025, C.silver, 7);
      tube([x, .86, -.22], [x, .86, .30], .025, C.silver, 7);
      add(G.box(.1, .07, .53, .025), C.maple, x, .89, .02);
    }
    // A woven tote and rolled travelling blanket occupy only part of the open left cubby.
    add(G.box(.32, .22, .29, .035), '#eecfa3', -.62, .22, -.12);
    for (let i = 0; i < 4; i++) add(G.box(.31, .012, .012, .003), '#c67f2a', -.62, .16 + i * .04, .031);
    add(G.cyl(.095, .095, .27, 10), '#f6e0bf', -.28, .2, -.14, HP, 0, 0);
    add(G.tor(.062, .015, PI * 2, 4, 10), '#c6c393', -.28, .2, .003);
  }));
  const dr = grp(); put(dr, .475, .28, .345); f.add(dr);
  dr.add(mc('gpt-tc-bench-drawer-v1', ({ add }) => {
    add(G.box(.81, .33, .055, .025), C.cream, 0, .005, 0);
    add(G.box(.78, .035, .60, .01), '#eecfa3', 0, -.145, -.28);
    for (const x of [-.375, .375]) add(G.box(.035, .28, .6, .01), '#feebc8', x, -.015, -.28);
    add(G.box(.78, .28, .035, .01), '#feebc8', 0, -.015, -.565);
    add(G.box(.2, .055, .06, .02), C.tealD, 0, .045, .047);
    add(G.box(.17, .025, .07, .01), C.maple, 0, .047, .065);
  }));
  const p = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .57 * t; }, { label: '좌석 아래 서랍', sfx: 'drawer', dur: .3 });
  f.spot('inside', dr, 0, -.117, -.26, { part: p, maxH: .25, label: '좌석 서랍 안', scale: .85 });
  f.spot('under', null, -.42, .12, .04, { maxH: .3, label: '좌석 아래 열린 칸', scale: .8 });
  f.spot('on', null, o.stuff ? -.35 : .1, .78, .06, { maxH: .4, label: '폭신한 좌석 위', scale: .9 });
  if (o.stuff) f.add(mc('gpt-tc-seat-stuff-v1|' + o.stuff, ({ add, tube }) => {
    if (o.stuff === 'paper') {
      add(G.box(.4, .025, .3, .008), '#fefde9', .36, .79, .04, 0, .2);
      add(G.box(.10, .018, .045, .005), '#feebc8', .20, .81, -.07, 0, .2, -.12);
      add(G.box(.09, .018, .075, .006), C.white, .51, .826, .13, -.28, .2, -.1);
      for (let k = 0; k < 5; k++) add(G.box(.28 - (k % 2) * .08, .007, .017, .003), '#84ae9d', .36, .808, -.05 + k * .045, 0, .2);
      add(G.cyl(.065, .055, .14, 12), C.cream, .78, .85, .11); add(G.cyl(.066, .066, .018, 12), C.tealD, .78, .93, .11);
    } else if (o.stuff === 'bag') {
      add(G.box(.35, .34, .21, .025), C.coral, .37, .95, -.04, 0, -.15);
      for (const z of [-.11, .04]) {
        tube([.27, 1.1, z], [.28, 1.22, z], .014, C.cream, 6); tube([.28, 1.22, z], [.47, 1.22, z], .014, C.cream, 6); tube([.47, 1.22, z], [.48, 1.1, z], .014, C.cream, 6);
      }
      add(G.box(.13, .12, .012, .02), C.cream, .38, .97, .079, 0, -.15);
    } else {
      add(G.box(.47, .08, .4, .03), '#ee9d4c', .35, .80, -.02, 0, .12);
      for (let k = 0; k < 5; k++) add(G.box(.45, .009, .014, .003), C.cream, .35, .845, -.17 + k * .07, 0, .12);
      add(G.sph(.105, 10, 8), C.coral, .7, .86, .13, 0, 0, 0, [1, .8, 1]);
    }
  }));
};

function scenicTexture(variant) {
  return scenic.get('gpt-tc-view|' + variant, () => canvasTex(512, 320, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9fd5e3'); g.addColorStop(1, '#f0edd3'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fcf9ec';
    for (const [x, y] of [[65, 55], [310, 37]]) { c.beginPath(); c.ellipse(x, y, 41, 14, 0, 0, PI * 2); c.ellipse(x + 31, y + 3, 32, 13, 0, 0, PI * 2); c.fill(); }
    c.fillStyle = '#b1cfb6'; c.beginPath(); c.moveTo(0, 170); c.quadraticCurveTo(115, 70, 235, 165); c.quadraticCurveTo(340, 82, 512, 155); c.lineTo(512, h); c.lineTo(0, h); c.fill();
    c.fillStyle = '#7eac91'; c.beginPath(); c.moveTo(0, 202); c.quadraticCurveTo(100, 129, 230, 203); c.quadraticCurveTo(390, 145, 512, 201); c.lineTo(512, h); c.lineTo(0, h); c.fill();
    if (variant === 2) { c.fillStyle = '#70b8c3'; c.fillRect(0, 205, 512, 115); c.fillStyle = '#a4d4d3'; for (let i = 0; i < 6; i++) c.fillRect((i * 83) % 210, 222 + i * 17, 140, 3); }
    else { c.fillStyle = '#bdd29e'; c.fillRect(0, 219, 512, 101); c.fillStyle = '#dce0a8'; for (let i = 0; i < 5; i++) c.fillRect(0, 235 + i * 17, 512, 5); }
    // Little village and a visible blossom tree: a calm, spring-morning landscape instead of an all-face box texture.
    for (let i = 0; i < 5; i++) { const x = 180 + i * 53, y = 204 - (i % 2) * 5; c.fillStyle = '#fff0cf'; c.fillRect(x, y - 22, 35, 28); c.fillStyle = i % 2 ? '#b68872' : '#bb8f7a'; c.beginPath(); c.moveTo(x - 5, y - 21); c.lineTo(x + 16, y - 38); c.lineTo(x + 39, y - 21); c.fill(); c.fillStyle = '#6a9c99'; c.fillRect(x + 7, y - 13, 8, 10); c.fillRect(x + 21, y - 13, 8, 10); }
    c.fillStyle = '#8f9370'; c.fillRect(52, 176, 8, 83); c.fillRect(41, 211, 28, 5);
    for (let i = 0; i < 9; i++) { c.fillStyle = ['#edc5c1', '#f8dcd2', '#e8b5b8'][i % 3]; c.beginPath(); c.arc(54 + Math.cos(i * 2.4) * 39, 161 + Math.sin(i * 2.4) * 22, 24, 0, PI * 2); c.fill(); }
    c.fillStyle = '#e8d4ab'; c.fillRect(0, 272, 512, 12);
  }));
}

B.gpt_tc_window = (f, T, o = {}) => {
  const W = 1.84, H = 1.18, Y = 1.75;
  f.add(mc('gpt-tc-window-v1', ({ add }) => {
    for (const x of [-1, 1]) add(G.box(.1, H + .19, .13, .04), C.maple, x * (W / 2 + .045), Y, .065);
    for (const y of [-1, 1]) add(G.box(W + .12, .1, .13, .04), C.maple, 0, Y + y * (H / 2 + .045), .065);
    add(G.box(.04, H, .09, .008), C.cream, .32, Y, .102);
    add(G.box(W, .035, .09, .008), C.cream, 0, Y + .22, .102);
    add(G.box(W + .24, .09, .25, .035), C.maple, 0, Y - H / 2 - .08, .105);
    add(G.box(W + .16, .035, .23, .01), C.cream, 0, Y - H / 2 - .02, .11);
    for (const x of [-.72, .72]) add(G.box(.15, .025, .06, .008), C.silver, x, Y + .26, .15);
    // A small safety decal and a green window-release tab, both real geometry set clear of the glass plane.
    add(G.box(.16, .08, .012, .01), C.cream, .67, Y - .41, .07);
    add(G.box(.09, .025, .014, .003), C.tealD, .67, Y - .41, .079);
    add(G.box(.07, .04, .04, .009), C.teal, -.74, Y - .59, .145);
  }));
  plane(f, W, H, scenicTexture(o.view || 0), 0, Y, .035);
  f.spot('on', null, -.4, Y - H / 2 + .005, .14, { maxH: .25, scale: .75, label: '넓은 기차 창턱' });
};

B.gpt_tc_rack = f => {
  f.noSolid = true; f.collideBox = [-3.48, 2.27, .08, 3.48, 3.03, .95];
  f.add(mc('gpt-tc-rack-v1', ({ add, tube }) => {
    // Tubular brackets and individual rack slats; the rail carries five easily read hanging hand straps.
    tube([-3.32, 2.35, .88], [3.32, 2.35, .88], .034, C.maple, 8);
    for (const x of [-3.2, -1.05, 1.05, 3.2]) {
      tube([x, 2.35, .88], [x, 2.77, .08], .026, C.silver, 7);
      add(G.box(.12, .17, .05, .02), C.silver, x, 2.76, .025);
    }
    for (const x of [-2.9, -1.9, -.8, .75, 1.8, 2.9]) {
      tube([x, 2.35, .88], [x, 2.15, .88], .014, C.cream, 5);
      add(G.tor(.085, .02, PI * 2, 5, 16), C.cream, x, 2.075, .88);
    }
    for (const cx of [-2.22, 1.88]) {
      for (const dz of [.17, .68]) tube([cx - .91, 2.64, dz], [cx + .91, 2.64, dz], .025, C.silver, 7);
      for (let i = 0; i < 9; i++) tube([cx - .87 + i * .218, 2.64, .17], [cx - .87 + i * .218, 2.64, .68], .012, '#84ae9d', 5);
      for (const dx of [-.88, .88]) tube([cx + dx, 2.64, .68], [cx + dx, 2.79, .06], .023, C.silver, 6);
    }
    suitcase(add, tube, 1.6, 2.66, .42, C.pink, .8);
    // A proper duffel: two end caps, straps around its barrel, and twin carry handles.
    add(G.cyl(.16, .16, .59, 12), '#a2c8bb', -1.72, 2.83, .43, 0, 0, HP);
    for (const dx of [-.2, .2]) add(G.cyl(.164, .164, .035, 12), C.tealD, -1.72 + dx, 2.83, .43, 0, 0, HP);
    for (const z of [.37, .49]) { tube([-1.82, 2.96, z], [-1.79, 3.07, z], .015, C.tealD, 6); tube([-1.79, 3.07, z], [-1.65, 3.07, z], .015, C.tealD, 6); tube([-1.65, 3.07, z], [-1.62, 2.96, z], .015, C.tealD, 6); }
    // Soft backpack on the second rack: front pocket, seams and handle.
    add(G.box(.36, .36, .3, .08), C.pink, 2.42, 2.84, .4);
    add(G.box(.27, .15, .07, .03), C.coral, 2.42, 2.76, .575);
    add(G.box(.2, .015, .015, .004), C.cream, 2.42, 2.82, .618);
    add(G.tor(.06, .015, PI, 5, 10), C.woodD, 2.42, 3.03, .4);
    // A warm ceiling light and two compact framed pictorial ads in the centre gap.
    add(G.box(6.4, .055, .11, .02), C.silver, 0, 3.09, .37);
    add(G.box(6.27, .045, .105, .015), '#ffefd0', 0, 3.055, .38);
    for (const [x, color] of [[-.46, '#a2c8bb'], [.46, '#feebc8']]) {
      add(G.box(.72, .32, .045, .02), C.maple, x, 2.82, .055);
      add(G.box(.65, .25, .02, .012), color, x, 2.82, .09);
      add(G.cyl(.075, .075, .025, 12), x < 0 ? C.teal : '#ee9d4c', x - .12, 2.83, .108, HP);
      add(G.box(.19, .025, .025, .005), C.cream, x + .13, 2.85, .108);
      add(G.box(.15, .018, .025, .005), C.cream, x + .11, 2.79, .108);
    }
  }));
  // (② 10/22: 28판 '…선반 위는 반칙 아니거든?!' — the blue case on the rack comes forward off it: 너굴이 hides behind it, and its
  // combination lock is the stage's)
  const bag = grp(); put(bag, -2.55, 2.66, .42); f.add(bag);
  bag.add(mc('gpt-tc-rack-bluecase', ({ add, tube }) => suitcase(add, tube, 0, 0, 0, C.blue, .94)));
  const p = f.part('lift', bag, (t, b) => { bag.position.z = b.p.z + .32 * t; bag.position.y = b.p.y + .04 * Math.sin(t * Math.PI); bag.rotation.x = .35 * t; }, { label: '선반 위 여행 가방', sfx: 'lift_fabric', dur: .45 });
  p.lockable = true;
  f.spot('on', null, -2.55, 2.66, .2, { part: p, maxH: .4, label: '짐 선반 가방 뒤', scale: .9 });
};

function routeTexture() {
  // (① 10/22: the line name and the six stops in our fitText — the game font, each in its own box, English on an English screen)
  return labels.get('gpt-tc-route-fit', () => textTex(768, 180, (c, w, h) => {
    c.fillStyle = C.cream; c.fillRect(0, 0, w, h);
    fitText(c, '봄빛 열차', w / 2, h * .217, w * .80, Math.round(h * .22), C.tealD, { weight: '700' });
    const x0 = w * .15, dx = w * .70 / 5, ry = h * .5;
    c.fillStyle = C.teal; c.fillRect(x0, ry - h * .025, dx * 5, h * .05);
    for (let i = 0; i < 6; i++) {
      const x = x0 + i * dx;
      c.fillStyle = i === 2 ? C.coral : C.cream; c.beginPath(); c.arc(x, ry, h * .067, 0, PI * 2); c.fill();
      c.strokeStyle = C.tealD; c.lineWidth = h * .022; c.stroke();
      fitText(c, ['집', '공원', '꽃길', '언덕', '강가', '바다'][i], x, h * .772, dx * .76, Math.round(h * .15), C.tealD, { weight: '700' });
    }
  }));
}

B.gpt_tc_end = f => {
  // The N wall uses the engine's actual doorway gap. Two leaves slide to the side in front of the wall.
  f.add(mc('gpt-tc-end-v1', ({ add, tube }) => {
    for (const x of [-.585, .585]) add(G.box(.1, 2.16, .18, .025), C.maple, x, 1.08, .02);
    add(G.box(1.26, .12, .18, .025), C.maple, 0, 2.18, .02);
    add(G.box(1.19, .035, .4, .01), C.silver, 0, .018, -.06);
    // A three-dimensional little vestibule extends behind the opening, with floor, ceiling, ribs and far glazing.
    add(G.box(1.16, .07, .86, .02), C.floor, 0, -.025, -.49);
    for (const x of [-.59, .59]) add(G.box(.075, 2.12, .83, .025), '#f6e0bf', x, 1.05, -.48);
    add(G.box(1.2, .08, .88, .02), '#feebc8', 0, 2.11, -.48);
    add(G.box(1.14, 2.09, .08, .02), '#84ae9d', 0, 1.04, -.94);
    add(G.box(.69, .71, .025, .04), '#b0e5e8', 0, 1.43, -.884);
    add(G.box(.08, .71, .035, .01), C.cream, 0, 1.43, -.865);
    for (const x of [-.48, .48]) tube([x, .09, -.16], [x, 2.01, -.16], .022, '#6f4b30', 7);
    for (const z of [-.18, -.33, -.48]) add(G.box(1.08, .012, .025, .003), '#a09769', 0, .02, z);
    // Route panel and a practical intercom / emergency hammer box flank the doorway.
    add(G.box(1.7, .49, .075, .025), C.maple, -1.55, 2.42, .055);
    add(G.box(.34, .45, .1, .03), C.cream, 1.03, 1.44, .07);
    add(G.box(.23, .13, .02, .015), C.dark, 1.03, 1.52, .13);
    for (let k = 0; k < 3; k++) add(G.box(.19, .012, .025, .003), '#84ae9d', 1.03, 1.49 + k * .03, .147);
    add(G.cyl(.045, .045, .026, 10), C.ochre, 1.03, 1.32, .14, HP);
    add(G.box(.41, .59, .12, .035), '#ed927d', 1.93, .72, .07);
    add(G.box(.29, .41, .02, .025), '#feebc8', 1.93, .75, .142);
    add(G.box(.13, .035, .035, .01), '#bb6650', 1.93, .85, .17);
    add(G.box(.035, .19, .035, .01), '#bb6650', 1.93, .75, .17);
    for (const x of [-.88, .88]) { tube([x, .77, .11], [x, 1.25, .11], .024, C.maple, 8); for (const y of [.77, 1.25]) add(G.box(.06, .06, .1, .015), C.silver, x, y, .065); }
    add(G.box(1.25, .24, .08, .025), C.tealD, 0, 2.53, .055);
    add(G.box(.85, .06, .02, .01), C.cream, -.1, 2.53, .108);
    add(G.cyl(.04, .04, .025, 10), C.ochre, .48, 2.53, .11, HP);
    // Narrow door safety line, ending inside the carriage rather than running through the wall.
    add(G.box(1.26, .012, .045, .004), C.ochre, 0, .012, .58);
  }));
  plane(f, 1.57, .37, routeTexture(), -1.55, 2.42, .099);
  const leaves = [-1, 1].map(s => {
    const g = grp(); put(g, s * .278, 0, .145); f.add(g);
    g.add(mc('gpt-tc-door-leaf-v1|' + s, ({ add }) => {
      add(G.box(.548, 2.075, .075, .025), C.mint, 0, 1.04, 0);
      add(G.box(.34, .68, .026, .045), C.cream, 0, 1.46, .052);
      add(G.box(.27, .59, .026, .035), '#b0e5e8', 0, 1.46, .07);
      add(G.box(.026, .29, .05, .008), C.silver, -s * .19, .92, .067);
      add(G.box(.08, .045, .015, .008), C.cream, 0, .68, .052);
    }));
    return g;
  });
  const p = f.part('door', leaves, (t, a, b) => { leaves[0].position.x = a.p.x - .50 * t; leaves[1].position.x = b.p.x + .50 * t; }, { label: '다음 칸 연결문', sfx: 'slide', dur: .4 });
  f.spot('inside', null, 0, .035, -.42, { part: p, maxH: .6, label: '연결 통로 안', scale: .85 });
};

B.gpt_tc_cart = f => {
  const TY = .95;
  f.add(mc('gpt-tc-cart-v1', ({ add, tube }) => {
    for (const x of [-.36, .36]) for (const z of [-.25, .25]) {
      tube([x, .13, z], [x, 1.07, z], .026, C.silver, 7);
      add(G.cyl(.075, .075, .055, 10), C.dark, x, .085, z, 0, 0, HP);
      add(G.box(.07, .1, .055, .012), C.silver, x, .13, z);
    }
    add(G.box(.78, .065, .59, .025), C.maple, 0, .33, 0);
    add(G.box(.8, .085, .61, .03), C.ochre, 0, TY, 0);
    for (const x of [-.4, .4]) add(G.box(.045, .17, .62, .015), C.cream, x, TY + .11, 0);
    for (const z of [-.29, .29]) add(G.box(.8, .17, .04, .012), C.cream, 0, TY + .11, z);
    add(G.box(.04, .15, .56, .01), C.maple, -.05, TY + .11, 0);
    for (const z of [-.24, .24]) tube([-.37, 1.01, z], [-.56, 1.22, z], .024, C.silver, 7);
    tube([-.56, 1.22, -.24], [-.56, 1.22, .24], .03, C.maple, 8);
    // Lower shelf: wrapped bento boxes and a rolled napkin bundle are visible through the open frame.
    add(G.box(.39, .16, .36, .025), '#a2c8bb', .10, .445, -.01);
    add(G.box(.42, .035, .38, .015), C.cream, .10, .54, -.01);
    add(G.box(.065, .19, .39, .005), C.coral, .10, .45, -.01);
    add(G.cyl(.075, .075, .26, 10), C.cream, -.25, .425, .03, HP);
    // Right-hand drinks tray supports the bottles on the service surface.
    add(G.box(.35, .035, .51, .015), C.cream, .19, TY + .0475, 0);
    for (const [x, z, h] of [[.08, -.15, .29], [.25, -.14, .25], [.27, .06, .25]]) {
      add(G.cyl(.053, .058, h, 10), '#84ae9d', x, TY + .06 + h / 2, z);
      add(G.cyl(.026, .028, .075, 8), '#84ae9d', x, TY + .07 + h, z);
      add(G.cyl(.029, .029, .022, 8), C.ochre, x, TY + .115 + h, z);
      add(G.box(.075, .10, .018, .008), C.cream, x, TY + .17, z + .052);
    }
    add(G.box(.13, .22, .13, .01), '#feebc8', .10, TY + .16, .16);
    add(G.box(.13, .055, .14, .01), C.cream, .10, TY + .30, .16, 0, 0, .2);
    add(G.box(.09, .075, .018, .008), C.teal, .10, TY + .17, .232);
    // Left tray below a hinged lid: real rice balls with nori, plus two buns in a low open divider.
    for (const [x, z] of [[-.28, -.13], [-.15, -.12]]) {
      add(G.sph(.073, 8, 6), C.white, x, TY + .12, z, 0, 0, 0, [1, 1, .8]);
      add(G.box(.055, .065, .034, .005), C.tealD, x, TY + .09, z + .05);
    }
    for (const x of [-.28, -.15]) { add(G.sph(.07, 10, 6), '#eaa440', x, TY + .095, .11, 0, 0, 0, [1, .67, 1]); add(G.box(.04, .008, .015, .003), C.cream, x, TY + .14, .11, 0, 0, -.3); }
    // The front banner is a readable food symbol made from geometry.
    add(G.box(.35, .2, .025, .02), C.teal, 0, .77, .325);
    add(G.cyl(.055, .055, .025, 12), C.cream, -.07, .77, .348, HP);
    for (let i = 0; i < 2; i++) add(G.box(.1, .02, .025, .004), C.cream, .08, .74 + i * .06, .349);
  }));
  const lid = grp(); put(lid, -.225, TY + .2, -.30); f.add(lid);
  lid.add(mc('gpt-tc-cart-lid-v1', ({ add }) => {
    add(G.box(.38, .045, .64, .018), C.ochre, 0, .02, .30);
    add(G.box(.12, .035, .055, .012), C.tealD, 0, .058, .49);
  }));
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.75 * t; }, { label: '간식 상자 뚜껑', sfx: 'open', dur: .3 });
  f.spot('inside', null, -.23, TY + .06, 0, { part: p, maxH: .23, scale: .8, label: '간식 상자 안' });
  f.spot('on', null, -.18, .37, .02, { maxH: .27, scale: .75, label: '간식 카트 아래 선반' });
};

B.gpt_tc_luggage = f => {
  f.add(mc('gpt-tc-luggage-v1', ({ add, tube }) => {
    // A standing carry-on and a separate open picnic basket: two recognisable objects at phone size.
    suitcase(add, tube, -.16, .07, -.08, C.blue, 1.1);
    for (const x of [-.36, .04]) add(G.sph(.045, 8, 6), C.dark, x, .05, -.08);
    add(G.box(.37, .055, .32, .02), C.maple, .19, .10, .25);
    for (const x of [.005, .375]) add(G.box(.035, .25, .32, .012), '#f6e0bf', x, .235, .25);
    for (const z of [.09, .41]) add(G.box(.37, .25, .035, .012), '#f6e0bf', .19, .235, z);
    for (let k = 0; k < 4; k++) add(G.box(.37, .012, .012, .003), C.woodD, .19, .15 + k * .05, .435);
    tube([.01, .36, .25], [.19, .55, .25], .018, C.woodD, 6); tube([.19, .55, .25], [.37, .36, .25], .018, C.woodD, 6);
    add(G.box(.25, .06, .2, .018), '#a2c8bb', .19, .16, .25);
  }));
  f.spot('inside', null, .19, .205, .25, { maxH: .27, label: '피크닉 바구니 안', scale: .8 });
};

export const GPTST_CAR1_BUILDERS = B;
export const GPTST_CAR1_INFO = {
  gpt_tc_shell: { w: 5, d: 7, name: '봄빛 열차 차체', hidden: true },
  gpt_tc_bench: { w: 2, d: 1, name: '서랍과 열린 칸이 있는 기차 좌석', hidden: true },
  gpt_tc_cart: { w: 1, d: 1, name: '간식 판매 카트', hidden: true },
  gpt_tc_luggage: { w: 1, d: 1, name: '여행 가방과 피크닉 바구니', hidden: true },
  gpt_tc_window: { wall: true, span: 2, name: '봄 풍경 기차 창', hidden: true },
  gpt_tc_rack: { wall: true, span: 7, name: '짐 선반과 손잡이', hidden: true },
  gpt_tc_end: { wall: true, span: 5, name: '노선도와 객실 연결문', hidden: true },
};

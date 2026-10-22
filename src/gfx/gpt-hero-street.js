// GPT hero props, stages 24 / 25 / 31. New keys only; the original builders remain available.
// Same HG / hmc materials and merged static geometry as the game's house and skate props.
// Parts and spot capacity/order match boardrack, shopfront and stairs respectively.
import * as THREE from 'three';
import { put, grp, mat, plane, canvasTex, texCache, roundRect, starShape } from './kit.js';
import { HG as G, hmc as mc, hxf } from './house-props.js';
import { tr } from '../i18n.js';

const PI = Math.PI, HP = PI / 2;
const C = { cream: '#fdf6da', light: '#fdf6da', wood: '#eecfa3', honey: '#eaa440', brown: '#78481d',
  steel: '#d4c498', steelD: '#a7a595', sage: '#84ae9d', mint: '#a2c8bb', coral: '#f28b6a',
  yellow: '#feb53d', blue: '#7fb6d6', lilac: '#e7a7b2', leaf: '#84ac88', soil: '#84552b' };
// 24판 보드 정비대 (사용자 10/22 밤 "너무 빨노초, 색 수정"): mint posts, honey wood, and the three decks and the helmet in soft
// coral, sky blue and lilac — the rest of the street's pieces keep their colours
const K24 = { ...C, cream: '#fff1d8', wood: '#e0a46e', honey: '#f0a030', brown: '#7a4a2c', steel: '#cfd6df', steelD: '#55657e',
  sage: '#5bb8a4', coral: '#ef8f80', blue: '#7fb2e6', yellow: '#b5a3ea' };
const B = {}, TX = texCache();
function paint(key, w, h, draw) { return TX.get('gpt-street|' + key, () => canvasTex(w, h, draw)); }
function front(w, h, tex, x, y, z) { return put(plane(w, h, mat('#ffffff', { map: tex })), x, y, z); }
function framed(add, addM, x, y, z, rx = 0, ry = 0, rz = 0, scale = 1) {
  const M = hxf(x, y, z, rx, ry, rz, scale);
  return (g, c, a = 0, b = 0, d = 0, e = 0, f = 0, h = 0, sc) => addM(g, M.clone().multiply(hxf(a, b, d, e, f, h, sc)), c);
}
// (⑥ 10/22 우리 룩: Korean words in the game's font, through tr() so an English screen reads English)
function labelTex(key, title, sub, accent = C.sage, ink = C.brown, board = C.light) {
  title = tr(title); sub = tr(sub);
  return paint(key + '|' + title, 640, 160, (c, w, h) => {
    c.fillStyle = accent; c.fillRect(0, 0, w, h);
    c.fillStyle = board; roundRect(c, 14, 14, w - 28, h - 28, 13); c.fill();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = ink;
    let titleSize = 66;
    do { c.font = `700 ${titleSize}px "Ssurround", "Jua", sans-serif`; titleSize--; } while (c.measureText(title).width > w * .80 && titleSize > 16);
    c.fillText(title, w / 2, 63);
    c.fillStyle = accent;
    let subSize = 25;
    do { c.font = `700 ${subSize}px "Ssurround", "Jua", sans-serif`; subSize--; } while (c.measureText(sub).width > w * .80 && subSize > 10);
    c.fillText(sub, w / 2, 116);
  });
}
function basket(add, tube, x, y, z, w = .56, d = .4, h = .21) {
  add(G.box(w, .04, d, .014), '#dc9949', x, y + .02, z);
  // Real open wicker sides: the foreground rim is low enough to show the contents.
  for (const sz of [-1, 1]) for (let j = 0; j < 3; j++) add(G.box(w, .032, .028, .008), j % 2 ? C.wood : '#ecb165', x, y + .07 + j * .06, z + sz * (d / 2 - .014));
  for (const sx of [-1, 1]) for (let j = 0; j < 3; j++) add(G.box(.028, .032, d, .008), j % 2 ? C.wood : '#ecb165', x + sx * (w / 2 - .014), y + .07 + j * .06, z);
  for (let j = 0; j < 7; j++) for (const sz of [-1, 1]) add(G.box(.018, h - .02, .032, .006), '#c67f2a', x - w / 2 + .045 + j * (w - .09) / 6, y + h / 2 + .02, z + sz * (d / 2 - .014));
  for (const sz of [-1, 1]) add(G.box(w + .025, .045, .045, .015), C.wood, x, y + h, z + sz * (d / 2 - .014));
  for (const sx of [-1, 1]) add(G.box(.045, .045, d, .015), C.wood, x + sx * (w / 2 - .014), y + h, z);
}
function sunflower(add, tube, x, y, z, s = 1) {
  tube([x, y, z], [x, y + .36 * s, z], .018 * s, C.leaf, 6);
  add(G.sph(.055 * s, 8, 6), C.leaf, x - .04 * s, y + .16 * s, z, 0, 0, -.5, [1.5, .65, .45]);
  add(G.sph(.055 * s, 8, 6), '#afc287', x + .04 * s, y + .23 * s, z, 0, 0, .5, [1.5, .65, .45]);
  for (let j = 0; j < 8; j++) { const a = j * PI / 4; add(G.sph(.047 * s, 8, 6), j % 2 ? '#fcc35e' : C.yellow, x + Math.cos(a) * .065 * s, y + .37 * s + Math.sin(a) * .065 * s, z, 0, 0, a, [1.15, .65, .35]); }
  add(G.sph(.052 * s, 10, 6), C.brown, x, y + .37 * s, z + .012 * s, 0, 0, 0, [1, 1, .38]);
  for (const a of [-.5, .8, 2.2]) add(G.sph(.006 * s, 5, 4), '#eaa440', x + Math.cos(a) * .025 * s, y + (.37 + Math.sin(a) * .025) * s, z + .034 * s);
}

// 24판: a wheeled board-care station. Its three decks, two trucks / four wheels each,
// helmet and hose reel belong to the park; the open knee space retains the under spot.
B.gpt_hero_boardstation = f => {
  f.add(mc('gpt-boardstation-v1', ({ add, addM, tube }) => {
    for (const x of [-.36, .36]) for (const z of [-.37, .13]) {
      add(G.box(.065, .32, .065, .018), K24.sage, x, .16, z);
      add(G.box(.1, .035, .12, .012), K24.steelD, x, .018, z);
    }
    add(G.box(.87, .06, .62, .025), K24.wood, 0, .35, -.12);
    add(G.box(.84, .5, .05, .02), K24.cream, 0, .63, -.39);
    for (const x of [-.4, .4]) add(G.box(.065, .56, .065, .018), K24.sage, x, .65, -.36);
    add(G.box(.92, .06, .4, .025), K24.cream, 0, .93, -.22);
    add(G.box(.86, .06, .055, .015), K24.sage, 0, .93, -.015);
    // Three readable decks: warm underside, bold geometry motifs, and complete trucks.
    for (let j = 0; j < 3; j++) {
      const col = [K24.coral, K24.blue, K24.yellow][j], x = -.27 + j * .27;
      const d = framed(add, addM, x, .64, -.16, -.16, 0, (j - 1) * -.035, [1, .8, 1]);
      d(G.box(.195, .47, .034, .015), K24.wood);
      d(G.box(.184, .46, .012, .01), col, 0, 0, .024);
      for (const e of [-1, 1]) { d(G.box(.188, .085, .036, .018), col, 0, e * .26, -.008, -e * .25); }
      d(G.box(.175, .49, .008, .006), '#726e65', 0, 0, -.023);
      if (j === 0) d(G.ext(starShape(.067, .032), .008, 0), K24.cream, 0, .025, .036);
      if (j === 1) { d(G.tor(.057, .012, PI, 5, 14), K24.cream, 0, .01, .035, 0, 0, PI); for (const sx of [-1, 1]) d(G.sph(.013, 6, 4), K24.brown, sx * .035, .052, .038, 0, 0, 0, [1, 1, .4]); }
      if (j === 2) for (let q = 0; q < 3; q++) d(G.box(.13, .025, .008, .004), K24.cream, 0, -.06 + q * .06, .036, 0, 0, -.25);
      for (const e of [-1, 1]) {
        d(G.box(.07, .04, .032, .008), K24.steelD, 0, e * .18, .055);
        d(G.cyl(.014, .014, .19, 8), K24.steel, 0, e * .18, .085, 0, 0, HP);
        for (const sx of [-1, 1]) { d(G.cyl(.036, .036, .035, 12), K24.cream, sx * .085, e * .18, .085, 0, 0, HP); d(G.cyl(.012, .012, .039, 8), K24.honey, sx * .085, e * .18, .085, 0, 0, HP); }
      }
    }
    // A proper open helmet, with a thick brow, vents and two chin straps.
    add(new THREE.SphereGeometry(.13, 16, 8, 0, PI * 2, 0, HP), K24.coral, .25, .975, -.19, 0, 0, 0, [1, .84, 1.1]);
    add(G.tor(.12, .016, PI * 2, 5, 20), '#dc6b55', .25, .98, -.19, HP, 0, 0, [1, 1.1, 1]);
    for (const x of [.2, .3]) add(G.box(.023, .012, .085, .008), K24.brown, x, 1.076, -.18);
    for (const x of [.16, .34]) tube([x, .98, -.15], [.25, .92, -.1], .011, K24.brown, 5);
    // The coiled garden hose is attached to a metal axle, with a brass tap and nozzle.
    add(G.cyl(.027, .027, .12, 10), K24.steelD, .39, .49, .17, HP);
    for (let j = 0; j < 3; j++) add(G.tor(.09 - j * .018, .014, PI * 2, 5, 18), K24.sage, .36, .49, .22 + j * .012);
    tube([.4, .43, .24], [.43, .38, .24], .014, K24.sage, 5);
    tube([.43, .38, .24], [.42, .3, .28], .014, K24.sage, 5);
    tube([.42, .3, .28], [.36, .28, .29], .02, K24.honey, 6);
    add(G.box(.08, .025, .035, .01), K24.coral, .34, .3, .29, 0, 0, -.3);
    // A wheel spanner and two spare wheels kept at the foot, clear of the hiding bay.
    add(G.box(.1, .06, .16, .012), K24.cream, -.37, .41, .09);
    for (const z of [.055, .125]) add(G.cyl(.035, .035, .035, 10), K24.coral, -.37, .46, z);
    tube([-.39, .48, .04], [-.34, .51, .11], .01, K24.steelD, 5);
  }));
  f.add(front(.74, .05, labelTex('board-sign', '보드 정비', '타고 · 고치고 · 또 타고'), 0, .93, .019));
  f.spot('under', null, 0, 0, .1, { maxH: .28, label: '거치대 밑', scale: .7 });
  f.spot('on', null, -.22, .96, -.32, { maxH: .2, label: '거치대 꼭대기', scale: .5 });
};

// 25판: the neighbourhood store has a working stock basket driven by its shutter crank.
// It keeps the original ONE code-lockable shutter and three spots; no chain, rule or story changes.
B.gpt_hero_superpulley = f => {
  const W = 1.92, H = 1.66, D = .74, z0 = -.13, fz = .24, oy = 1.32;
  f.add(mc('gpt-superpulley-shell-v1', ({ add, tube }) => {
    add(G.box(W, H, .075, .02), C.cream, 0, H / 2, -.465);
    for (const x of [-.91, .91]) {
      add(G.box(.1, H, D, .025), C.cream, x, H / 2, z0);
      add(G.box(.065, 1.29, .065, .015), C.sage, x - Math.sign(x) * .06, .645, fz + .025);
    }
    add(G.box(1.78, .055, .65, .015), '#e8d7b7', 0, .0275, -.12);
    add(G.box(2, .095, .84, .03), C.cream, 0, 1.7, -.1);
    add(G.box(1.96, .3, .11, .025), C.cream, 0, 1.49, fz + .04);
    // Modest striped canvas awning and softly rounded scallops.
    for (let j = 0; j < 9; j++) {
      const x = -.88 + j * .22;
      add(G.box(.218, .04, .27, .013), j % 2 ? C.cream : C.mint, x, 1.335, .28, -.16);
      add(G.box(.218, .075, .04, .017), j % 2 ? C.cream : C.mint, x, 1.29, .405);
    }
    // The lower shelf's underside is .5375 m: the floor slot at .055 m retains its full .45 m headroom.
    // Existing daily-goods bottles sit forward on that shelf so the open view shows a stocked shop.
    add(G.box(.79, .045, .44, .012), C.wood, -.43, .56, -.21);
    add(G.box(.79, .045, .32, .012), C.wood, -.43, .87, -.27);
    for (const x of [-.78, -.06]) add(G.box(.045, 1.12, .29, .01), '#dc9949', x, .56, -.28);
    for (let j = 0; j < 4; j++) {
      const x = -.68 + j * .155;
      add(G.box(.115, .19 + (j % 2) * .04, .12, .015), j % 2 ? C.coral : C.yellow, x, 1.0, -.29);
      add(G.box(.09, .06, .014, .004), C.cream, x, 1.02, -.22);
      add(G.cyl(.042, .038, .16, 10), j % 2 ? C.mint : C.cream, x, .663, -.075);
      add(G.cyl(.028, .028, .025, 10), C.sage, x, .7555, -.075);
    }
    // Pulley frame is anchored to the store structure, never a floating basket.
    for (const x of [.13, .78]) add(G.box(.055, 1.26, .055, .015), C.sage, x, .66, -.25);
    add(G.box(.78, .07, .085, .02), C.sage, .455, 1.26, -.21);
    add(G.cyl(.095, .095, .045, 18), C.wood, .45, 1.18, -.13, HP);
    add(G.tor(.082, .014, PI * 2, 5, 18), C.honey, .45, 1.18, -.102);
    tube([.45, 1.18, -.13], [.76, .62, -.11], .012, '#d4c498', 5);
    add(G.box(.15, .17, .12, .02), C.cream, .76, .57, -.03);
    // A red return crate outside keeps the original on-top slot clear — wholly in front of the shutter (⑥ 10/22, user:
    // "바구니 셔터에 뚫려있다": its back half stood inside the shutter's plane at z .305)
    add(G.box(.43, .04, .2, .012), '#e8604c', -.62, .02, .44);
    for (const z of [.352, .528]) for (let j = 0; j < 3; j++) add(G.box(.43, .04, .025, .008), '#e8604c', -.62, .08 + j * .065, z);
    for (const x of [-.82, -.42]) add(G.box(.03, .22, .2, .008), '#e8604c', x, .13, .44);
    for (const x of [-.76, -.62, -.48]) for (const z of [.352, .528]) add(G.box(.025, .22, .03, .008), '#d4503e', x, .13, z);
    // Small scale and two apples communicate groceries, not an unrelated vending gimmick.
    add(G.box(.19, .04, .18, .015), C.mint, -.72, 1.77, -.16);
    add(G.box(.14, .09, .11, .025), C.cream, -.72, 1.83, -.16);
    add(G.cyl(.115, .1, .025, 14), C.steel, -.72, 1.89, -.16);
    for (const x of [-.78, -.67]) { add(G.sph(.055, 10, 8), C.coral, x, 1.955, -.15, 0, 0, 0, [1, .9, 1]); tube([x, 1.995, -.15], [x + .006, 2.02, -.15], .008, C.brown, 5); }
  }));
  f.add(front(1.79, .24, labelTex('super-sign', '행복슈퍼', '과일 · 생활용품 · 1988년부터', '#4f86b0', '#e8604c', '#fffdf6'), 0, 1.49, .342));
  // Fixed roller, then the original shutter pivot (first, still code-lockable).
  const shutter = grp(); put(shutter, 0, oy - .08, fz + .065); f.add(shutter);
  shutter.add(mc('gpt-superpulley-shutter-v1', ({ add }) => {
    const SH = oy - .1;
    add(G.box(1.72, SH, .035, .012), '#f8e1c2', 0, -SH / 2, 0);
    for (let j = 0; j < 15; j++) add(G.box(1.7, .018, .014, .005), '#e8d7b7', 0, -.045 - j * .08, .027);
    add(G.box(1.7, .055, .06, .015), C.sage, 0, -SH + .028, .008);
    add(G.box(.2, .035, .045, .01), C.brown, .32, -SH + .1, .043);
  }));
  const lift = grp(); put(lift, .45, .77, -.105); f.add(lift);
  lift.add(mc('gpt-superpulley-basket-v1', ({ add, tube }) => {
    basket(add, tube, 0, 0, 0, .56, .38, .21);
    for (const sx of [-1, 1]) tube([sx * .245, .2, 0], [0, .35, 0], .013, '#d4c498', 6);
    // Tied empty shopping bags are kept at the back; the broad middle is a real item bay.
    for (const x of [-.18, .18]) { add(G.box(.1, .13, .08, .02), C.cream, x, .105, -.08); add(G.tor(.035, .009, PI, 4, 10), C.wood, x, .19, -.08); }
  }));
  const rope = grp(); put(rope, .45, 1.18, -.105); f.add(rope);
  rope.add(mc('gpt-superpulley-rope', ({ add }) => add(G.cyl(.012, .012, 1, 6), '#d4c498', 0, -.5, 0)));
  const crank = grp(); put(crank, .76, .57, .065); f.add(crank);
  crank.add(mc('gpt-superpulley-crank', ({ add, tube }) => { add(G.cyl(.045, .045, .05, 12), C.honey, 0, 0, 0, HP); tube([0, 0, .03], [.095, -.075, .03], .018, C.honey, 6); add(G.cyl(.028, .028, .09, 10), C.coral, .095, -.075, .07, HP); }));
  const setRope = () => { rope.scale.y = Math.max(.04, 1.18 - lift.position.y - .35); }; setRope();
  const p = f.part('shutter', [shutter, lift, rope, crank], (t, bS, bL) => {
    shutter.scale.y = 1 - .9 * t;
    lift.position.y = bL.p.y - .48 * t;
    crank.rotation.z = -t * PI * 4;
    setRope();
  }, { label: '셔터와 선반 바구니', sfx: 'drawer', dur: .42 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: .25, y: -(oy - .1) + .12, z: .045, parent: shutter };
  f.spot('inside', lift, 0, .045, 0, { part: p, maxH: .34, label: '가게 선반 바구니', scale: .85 });
  f.spot('inside', null, -.4, .055, .06, { part: p, maxH: .45, label: '가게 안' });
  f.spot('on', null, -.62, .24, .44, { maxH: .45, label: '플라스틱 상자 위', scale: .85 });
};

function whaleTex() {
  return paint('whale-mural-v2', 1024, 768, (c, w, h) => {
    c.fillStyle = '#fef2e1'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#b0e5e8'; c.fillRect(0, h * .64, w, h * .36);
    // Handmade paint, a restrained sea-blue rather than a large navy panel.
    c.fillStyle = '#f6e0bf'; c.beginPath(); c.moveTo(0, 515);
    for (let x = 0; x <= w; x += 16) c.lineTo(x, 515 + Math.sin(x / 95) * 18); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    const rainbow = ['#f1977b', '#eecfa3', '#f4d28d', '#bbc78c', '#a2c8bb', '#eaa9b5'];
    rainbow.forEach((col, j) => { c.strokeStyle = col; c.lineWidth = 28; c.beginPath(); c.arc(250, 380, 244 - j * 27, PI, 0); c.stroke(); });
    const cloud = (x, y, s) => { c.fillStyle = '#fdf6da'; for (const [a, b, r] of [[0, 0, 35], [37, -12, 45], [84, 0, 34]]) { c.beginPath(); c.ellipse(x + a * s, y + b * s, r * s, r * .7 * s, 0, 0, 2 * PI); c.fill(); } };
    cloud(45, 385, 1.05); cloud(380, 385, 1.05); cloud(730, 155, .9);
    // Whale: one clear soft silhouette, flukes, pale belly, pectoral fin and a two-prong spout.
    c.fillStyle = '#7fb6d6'; c.beginPath(); c.moveTo(380, 425);
    c.bezierCurveTo(390, 310, 630, 287, 738, 376); c.bezierCurveTo(774, 405, 791, 431, 818, 433);
    c.bezierCurveTo(835, 425, 857, 395, 871, 367); c.bezierCurveTo(907, 373, 913, 424, 881, 456);
    c.bezierCurveTo(932, 443, 966, 469, 969, 490); c.bezierCurveTo(899, 514, 847, 490, 822, 470);
    c.bezierCurveTo(739, 558, 475, 558, 401, 476); c.bezierCurveTo(385, 458, 378, 441, 380, 425); c.fill();
    c.fillStyle = '#feebc8'; c.beginPath(); c.moveTo(389, 452); c.bezierCurveTo(514, 489, 686, 482, 804, 464); c.bezierCurveTo(712, 546, 461, 539, 404, 478); c.closePath(); c.fill();
    c.fillStyle = '#5294b6'; c.beginPath(); c.moveTo(573, 451); c.bezierCurveTo(563, 499, 599, 540, 640, 538); c.bezierCurveTo(646, 512, 620, 471, 600, 451); c.fill();
    c.fillStyle = '#695443'; c.beginPath(); c.ellipse(445, 410, 10, 13, -.12, 0, 2 * PI); c.fill();
    c.strokeStyle = '#695443'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(405, 449); c.quadraticCurveTo(433, 460, 455, 448); c.stroke();
    c.fillStyle = '#f7a8b8'; c.beginPath(); c.ellipse(471, 440, 22, 10, 0, 0, 2 * PI); c.fill();
    c.strokeStyle = '#7fb6d6'; c.lineWidth = 15; c.beginPath(); c.moveTo(531, 319); c.bezierCurveTo(515, 275, 499, 260, 482, 270); c.moveTo(531, 319); c.bezierCurveTo(541, 266, 566, 256, 581, 275); c.stroke();
    // Oversized little fish and wave marks remain readable at the game camera.
    for (const [x, y, s] of [[155, 584, 1], [277, 637, .8], [735, 643, .75]]) {
      c.fillStyle = '#f9bb68'; c.beginPath(); c.ellipse(x, y, 31 * s, 14 * s, 0, 0, 2 * PI); c.fill(); c.beginPath(); c.moveTo(x + 24 * s, y); c.lineTo(x + 48 * s, y - 18 * s); c.lineTo(x + 48 * s, y + 18 * s); c.fill();
      c.fillStyle = '#786a54'; c.beginPath(); c.arc(x - 13 * s, y - 2 * s, 3 * s, 0, 2 * PI); c.fill();
    }
    c.strokeStyle = '#7fb6d6'; c.lineWidth = 8;
    for (const [x, y] of [[70, 525], [340, 577], [560, 642], [863, 575]]) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 22, y - 13, x + 44, y); c.quadraticCurveTo(x + 66, y + 13, x + 88, y); c.stroke(); }
    // Sparse repaired paint chips; this is a loved neighbourhood mural, not a pristine billboard.
    c.fillStyle = '#feebc8'; for (const [x, y, ww, hh] of [[22, 37, 30, 9], [962, 73, 20, 12], [983, 330, 21, 8], [35, 702, 25, 9], [919, 727, 45, 7]]) c.fillRect(x, y, ww, hh);
  });
}

// 31판: the liked rainbow steps, sunflower garden and sea-whale mural, rebuilt as one
// believable piece of alley architecture. The original tarp lift / inside / under / on contracts survive.
B.gpt_hero_rainbowstairs = f => {
  const n = 6, run = .27, rise = .2, x0 = -.86, D = .58, z0 = -.2, top = 1.2;
  const colors = [C.coral, '#f9bb68', '#f4d28d', '#bbc78c', '#a2c8bb', '#e8a7b2'];
  f.add(mc('gpt-rainbowstairs-body-v1', ({ add, tube }) => {
    // Open underside: only a 25 cm sloping stair waist, so both hiding bays are real space.
    const sh = new THREE.Shape(), k = rise / run;
    sh.moveTo(x0, 0);
    for (let j = 0; j < n; j++) { sh.lineTo(x0 + j * run, (j + 1) * rise); sh.lineTo(x0 + (j + 1) * run, (j + 1) * rise); }
    sh.lineTo(.86, top); sh.lineTo(.86, 0); sh.lineTo(.72, 0); sh.lineTo(.72, k * (.72 - x0) - .25); sh.lineTo(x0 + .25 / k, 0); sh.closePath();
    add(G.ext(sh, D - .03, .012, 2), C.cream, 0, 0, z0 - D / 2 + .015);
    for (let j = 0; j < n; j++) {
      const x = x0 + (j + .5) * run, y = (j + 1) * rise;
      add(G.box(run - .012, .034, D - .055, .012), colors[j], x, y + .02, z0);
      // Thick painted nosing and its front side end make the rainbow read in the start view.
      add(G.box(.055, .048, D - .035, .01), colors[j], x0 + j * run + .027, y + .012, z0);
      add(G.box(run - .018, .11, .014, .006), colors[j], x, y - .062, z0 + D / 2 + .003);
      for (const z of [-.36, -.05]) add(G.cyl(.008, .008, .008, 6), '#d4c498', x + .07, y + .04, z);
    }
    // A taller mural pier keeps the whale visible above the top stair from the game camera.
    add(G.box(1.9, 2.08, .024, .01), '#f6e0bf', 0, 1.12, -.492);
    add(G.box(1.93, .06, .05, .015), C.cream, 0, 2.19, -.492);
    // Exposed cream brick below the mural ties this taller painted pier to the alley wall.
    for (let row = 0; row < 4; row++) for (let j = 0; j < 6; j++) {
      const x = -.83 + j * .32 + (row % 2) * .13;
      if (x < .91) add(G.box(.28, .11, .014, .005), row % 2 ? '#f6e0bf' : '#f8e1c2', x, .16 + row * .135, -.472);
    }
    // Pale sage handrail with real foot plates, three stout balusters and spherical end caps.
    const pts = [1, 3, 5].map(j => [x0 + run * (j + .5), rise * (j + 1), .085]);
    for (const [x, y, z] of pts) { add(G.box(.09, .03, .09, .008), C.sage, x, y + .045, z); tube([x, y + .05, z], [x, y + .5, z], .025, C.sage, 8); }
    const a = [pts[0][0] - .12, pts[0][1] + .41, .085], b = [pts[2][0] + .07, pts[2][1] + .55, .085];
    tube(a, b, .032, C.sage, 8); add(G.sph(.036, 8, 6), C.sage, ...a); add(G.sph(.036, 8, 6), C.sage, ...b);
    // Two real shelf brackets carry the planter outside the rail. All support stays in z>=.067,
    // clear of the preserved stair corridor z=-.21 +/- .25. No floating planter after relocation.
    for (const x of [.60, .78]) {
      add(G.box(.04, .04, .35, .008), C.sage, x, 1.21, .255);
      tube([x, 1.02, .085], [x, 1.19, .34], .013, C.sage, 6);
    }
    // A sunflower box on the highest landing, and smaller flowers at the stair foot.
    add(G.box(.3, .14, .24, .025), C.wood, .69, 1.3, .30);
    add(G.box(.265, .018, .205, .007), C.soil, .69, 1.38, .30);
    sunflower(add, tube, .62, 1.38, .31, .58); sunflower(add, tube, .76, 1.38, .29, .47);
    add(G.cyl(.105, .085, .14, 14), '#e8a466', .88, .07, .30);
    add(G.cyl(.09, .09, .012, 12), C.soil, .88, .144, .30);
    sunflower(add, tube, .88, .15, .30, .7);
    // Sunflower paintings along the stringer, kept away from the two open bays.
    for (const [x, y, s] of [[-.47, .23, .6], [-.21, .4, .68], [.11, .61, .64], [.48, .87, .68]]) {
      const z = .101;
      tube([x, y - .07, z], [x, y + .02, z], .008, C.leaf, 5);
      for (let j = 0; j < 7; j++) { const a = j / 7 * PI * 2; add(G.sph(.025 * s, 6, 4), C.yellow, x + Math.cos(a) * .042 * s, y + .055 + Math.sin(a) * .042 * s, z, 0, 0, 0, [1, 1, .25]); }
      add(G.sph(.027 * s, 8, 6), C.brown, x, y + .055, z + .008, 0, 0, 0, [1, 1, .3]);
    }
  }));
  f.add(front(1.81, 1.41, whaleTex(), 0, 1.4, -.474));
  // Folded turquoise waterproof cover over the same hiding place. Its motion stays in the footprint.
  const tarp = grp(); put(tarp, .43, 0, z0); f.add(tarp);
  tarp.add(mc('gpt-rainbowstairs-tarp-v1', ({ add, tube }) => {
    add(new THREE.SphereGeometry(.28, 16, 8, 0, PI * 2, 0, HP), '#a2c8bb', 0, .018, 0, 0, 0, 0, [1, .85, .76]);
    for (const x of [-.16, -.06, .06, .16]) tube([x, .05, .13], [x * .5, .22, 0], .012, '#bdd0d2', 5);
    add(G.tor(.19, .015, PI * 2, 5, 18), C.cream, 0, .13, 0, HP, 0, 0, [1, .7, 1]);
  }));
  const p = f.part('lift', tarp, (t, b) => { tarp.position.z = b.p.z + .44 * t; tarp.scale.y = 1 - .55 * t; tarp.rotation.x = .2 * t; }, { label: '벽화 계단 방수포', sfx: 'swish', dur: .3 });
  f.spot('inside', null, .43, 0, z0, { part: p, maxH: .36, label: '계단 밑 방수포', scale: .85 });
  f.spot('under', null, -.05, 0, z0 + .04, { maxH: .26, label: '계단 밑', scale: .8 });
  f.spot('on', null, x0 + run * 1.5, rise * 2 + .04, z0 - .05, { maxH: .45, label: '계단 위', scale: .8 });
};

export const GPT_STREET_BUILDERS = B;
export const GPT_STREET_INFO = {
  gpt_hero_boardstation: { w: 1, d: 1, name: '보드킹의 보드 정비 거치대', price: 140, region: 'alley' },
  gpt_hero_superpulley: { w: 2, d: 1, name: '행복슈퍼 선반 바구니 도르래', price: 380, region: 'alley' },
  gpt_hero_rainbowstairs: { w: 2, d: 1, name: '해바라기 고래 무지개 계단', price: 220, region: 'alley' },
};

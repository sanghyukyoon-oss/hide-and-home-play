// GPT 캠프파이어 선풍기·연기 신호·나무 바구니를 원본 캠프장으로 (②b 10/22 저녁 — 사용자 "원본 유지 + GPT 장치 이식", 57판 ★캠프파이어).
// 모델은 GPT 작업장(gpt3-g 별빛 캠프파이어 언덕) 빌더 그대로(색은 작업장 fix-1022 판), 부품 id(fire-fan …)도 그대로.
import * as THREE from 'three';
import { calmAll } from './gpt-calm.js';
import { HG as G, hmc } from './house-props.js';
import { Char } from './chars.js';
import { bakeItem } from './bake.js';
import { STYLE } from './kit.js';

const PI = Math.PI, HP = PI / 2;
// (⑥ 10/22 들여오기 — "누래": greens for the pines and grass, a teal tent, a sky-blue telescope, a red-brown for the dark wood,
// a pink that reads as pink — the camp at night is no longer one sand colour)
const C = { cream: '#fef2e1', canvas: '#f6e0bf', peach: '#ee8a6a', teal: '#4fb39a', pine: '#5fae6a', pine2: '#3f9a5a',
  wood: '#f2dfc4', woodD: '#9a5a3e', bark: '#8a5a44', steel: '#8fa3c4', ink: '#6f4b30', rope: '#f2dcbc',
  yellow: '#f2c14e', pink: '#f28fb0', soil: '#bca88a', sage: '#8cc070', navy: '#5d86c8', blue: '#7cc3ea' };
const mc = (key, fn) => hmc('gptff|' + key, fn);
const group = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
const staticPart = (f, key, fn) => f.add(mc(key, fn));
// Only the selected campfire hill gets the 10/22 palette. Forest/valley builders
// retain their original cached geometry, including when their parts are reused here.
const FIRE_COLORS = {
  '#eb9d5c': '#ee9d4c', '#67e0b6': '#56dca6', '#76e067': '#e0d967',
  '#d68436': '#d4872b', '#d68537': '#6f4b30', '#c4c6bb': '#dbdcde',
  '#f7ab4f': '#feb53d', '#e08d67': '#ea785c', '#e0af66': '#e0b667',
  '#67e0c1': '#56dca6', '#67e0cd': '#67d9e0', '#c5c4bb': '#e0b667',
  '#e0a866': '#d4872b', '#a8e067': '#e0d967', '#e0ad67': '#e2ae64',
  '#d99948': '#d4872b', '#e0b567': '#e0b667', '#e0b967': '#e8b15e',
  '#e0ac67': '#e1af65', '#b4b6af': '#d5bb34', '#e0cd67': '#e0b667',
  '#e9b35d': '#e2ae64', '#7ee067': '#fef2e1', '#db9e52': '#eaa440',
  '#d47e2b': '#6f4b30', '#ec955a': '#ee9d4c', '#f6c451': '#feb53d',
  '#e09167': '#ee9d4c', '#e57f62': '#ea785c', '#6795e0': '#67d9e0',
  '#e0b567': '#fef2e1', '#65df85': '#56dca6', '#9ae067': '#e0d967',
  '#dce7e3': '#fef2e1', '#d8e7dc': '#67d9e0', '#d96143': '#ea785c',
  '#e0a867': '#e2ae64', '#e5b462': '#eaa440', '#67e0b6': '#56dca6',
  '#e08c67': '#ee9d4c', '#e3b464': '#eaa440', '#d7813a': '#d4872b',
  '#e5ae62': '#e2ae64', '#db9652': '#d4872b', '#eeac58': '#f7ab4f',
  '#67e06c': '#56dca6', '#67e088': '#67e0b6', '#67e0be': '#56dca6',
  '#67e0b4': '#67e0b6', '#67e0ba': '#56dca6', '#d4832b': '#6f4b30',
  '#d6bc35': '#d5bb34', '#e0ba67': '#e1af65',
};
const hsl = {};
function earth(hex) {   // (②b 10/22 밤 허브 "캠프 소품처럼 갈색·초록 계열로": 민트·청록·파랑 → 풀색, 노랑 → 나무 갈색, 분홍 → 흙빛)
  if (typeof hex !== 'string' || hex[0] !== '#') return hex;
  const c = new THREE.Color(hex); c.getHSL(hsl, THREE.SRGBColorSpace); const h = hsl.h * 360;
  if (hsl.s < .18 || hsl.l < .3) return hex;
  if (h >= 140 && h < 260) c.setHSL(95 / 360, .32, Math.min(.62, hsl.l), THREE.SRGBColorSpace);
  else if (h >= 38 && h < 75) c.setHSL(30 / 360, .42, Math.min(.6, hsl.l * .85), THREE.SRGBColorSpace);
  else if (h >= 280 || h < 12) c.setHSL(20 / 360, .38, Math.min(.6, hsl.l), THREE.SRGBColorSpace);
  else return hex;
  return '#' + c.getHexString(THREE.SRGBColorSpace);
}
const fireColor = color => earth(FIRE_COLORS[color] || color);
calmAll(C, .55); calmAll(FIRE_COLORS, .55);   // (원본 캠프장 배색에 맞춰 차분하게 — gpt-calm.js)
const fireMc = (key, fn) => mc('fire-fix-1022|' + key, ({ add, tube }) => fn({
  add: (geometry, color, ...args) => add(geometry, fireColor(color), ...args),
  tube: (a, b, radius, color, ...args) => tube(a, b, radius, fireColor(color), ...args),
}));
const fireStatic = (f, key, fn) => f.add(fireMc(key, fn));
const fireGeometry = new WeakMap();
function fireRecolor(root) {
  // The small tent and hammock share source builders with dropped maps. Copy a
  // reused mesh before recolouring its vertex paint; never mutate that shared cache.
  const tint = color => new THREE.Color(STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(color) : color);
  const colors = Object.entries(FIRE_COLORS).map(([from, to]) => [tint(from), tint(to)]);
  root.traverse(o => {
    if (!o.isMesh || !o.geometry.attributes.color) return;
    let geometry = fireGeometry.get(o.geometry);
    if (!geometry) {
      geometry = o.geometry.clone(); const paint = geometry.attributes.color;
      for (let i = 0; i < paint.count; i++) {
        const match = colors.find(([from]) => Math.abs(paint.getX(i) - from.r) + Math.abs(paint.getY(i) - from.g) + Math.abs(paint.getZ(i) - from.b) < .00001);
        if (match) paint.setXYZ(i, match[1].r, match[1].g, match[1].b);
      }
      paint.needsUpdate = true; fireGeometry.set(o.geometry, geometry);
    }
    o.geometry = geometry;
  });
}
const mech = (f, kind, pivots, apply, id, label, dur = .65) => {
  const p = f.part(kind, pivots, apply, { label, sfx: kind === 'drawer' ? 'open' : 'swish', dur });
  p.gptId = id; p.lockable = false; return p;
};
const scenery = f => { f.noSolid = true; f.collideBox = [-.05, -2, -.05, .05, -1, .05]; };

// Canonical characters, frozen as furniture cameos. Geometry, faces and colours come from chars.js.
function canonicalFigure(kind, scale = 1, marshmallow = false) {
  const ch = new Char(kind); ch.pose = marshmallow ? 'hold' : 'idle'; ch.t = 0; ch.update(0);
  ch.shadow.removeFromParent();
  if (marshmallow) {
    const grip = group(ch.inner); grip.position.copy(ch.arms[1].position);
    grip.add(fireMc('canonical-panda-marshmallow', ({ add, tube }) => {
      tube([0, -.04, .035], [.46, .66, .035], .02, C.woodD, 6);
      add(G.box(.105, .125, .105, .032), C.cream, .46, .66, .035, 0, -.12, .08);
      add(G.box(.09, .022, .018, .007), C.peach, .46, .625, .096, 0, 0, .08);
    }));
  }
  // A frozen figure never switches expression: remove hidden alternatives before the ordinary item bake.
  const prune = o => { for (const c of [...o.children]) { if (!c.visible) o.remove(c); else prune(c); } };
  prune(ch.root); ch.root.scale.setScalar(scale);
  ch.root.traverse(o => { if (o.isMesh) delete o.userData.char; });
  bakeItem(ch.root, 'gptff-canonical|' + kind + '|' + scale + '|' + marshmallow);
  return ch.root;
}

function plankDeck(add, w, d, y, color = C.wood, x = 0, z = 0) {
  add(G.box(w, .24, d, .08), C.woodD, x, y - .12, z);
  const n = Math.ceil(d / .27), pd = d / n;
  for (let i = 0; i < n; i++) add(G.box(w - .05, .06, pd - .014, .014), i % 3 === 0 ? C.canvas : color, x, y + .023, z - d / 2 + pd * (i + .5));
}
function pine(add, tube, x, z, s = 1, y = 0, pale = false) {
  const a = pale ? '#60dfa3' : C.pine, b = pale ? '#40d884' : C.pine2;
  add(G.cyl(.12 * s, .17 * s, 1.2 * s, 7), C.bark, x, y + .6 * s, z);
  for (const [h, r, yy] of [[1.18, .78, 1.17], [1.03, .62, 1.67], [.85, .43, 2.13]]) {
    add(G.cone(r * s, h * s, 9), yy > 2 ? a : b, x, y + yy * s, z);
    // Lighter tips are broad whole needle tiers, not little noisy spheres.
    add(G.cone(r * s * .84, h * s * .72, 9), a, x, y + (yy + h * .13) * s, z);
  }
  for (const a0 of [.4, 2.6, 4.5]) tube([x, y + .12, z], [x + Math.cos(a0) * .3 * s, y + .035, z + Math.sin(a0) * .3 * s], .06 * s, C.bark, 5, .12 * s);
}
function tuft(add, x, z, s = 1, y = 0) {
  for (let i = -1; i <= 1; i++) add(G.box(.035 * s, (.18 - Math.abs(i) * .035) * s, .04 * s, .012), C.pine2, x + i * .055 * s, y + .075 * s, z, 0, i * .6, -i * .32);
}
function stone(add, x, z, s = .2, y = 0, color = '#c5c4bb') {
  add(G.sph(s, 7, 5), color, x, y + s * .38, z, 0, x + z, .1, [1.2, .6, .9]);
}
function mug(add, x, y, z, color = C.teal) {
  add(G.cyl(.075, .065, .14, 10), color, x, y + .07, z);
  add(G.cyl(.057, .057, .012, 10), '#79614e', x, y + .147, z);
  add(G.tor(.052, .018, PI * 1.55, 4, 10), color, x + .075, y + .08, z, 0, 0, -.75);
}
function wicker(add, tube, w = .72, d = .58, slings = true) {
  add(G.box(w, .065, d, .025), C.woodD, 0, .032, 0);
  for (const x of [-w / 2 + .03, w / 2 - .03]) add(G.box(.06, .24, d, .02), C.canvas, x, .16, 0);
  for (const z of [-d / 2 + .03, d / 2 - .03]) {
    add(G.box(w, .24, .06, .02), C.canvas, 0, .16, z);
    for (let y = .09; y < .25; y += .065) add(G.box(w + .012, .018, .018, .006), C.woodD, 0, y, z + Math.sign(z) * .035);
    add(G.box(w + .06, .055, .08, .02), C.wood, 0, .29, z);
  }
  for (const x of [-w / 2, w / 2]) add(G.box(.08, .055, d, .02), C.wood, x, .29, 0);
  if (slings) for (const x of [-w * .42, w * .42]) for (const z of [-d * .4, d * .4]) tube([x, .29, z], [0, .8, 0], .018, C.rope, 5);
  add(G.tor(.06, .019, PI * 2, 5, 12), C.steel, 0, .83, 0);
  // Thick inner cushion brings the hidden friend/item above the front lip when lowered.
  add(G.box(w - .14, .12, d - .14, .045), '#eac85d', 0, .13, 0);
}
function boxBody(add, w, d, h, color, inside, x = 0, y = 0, z = 0) {
  const t = .075;
  add(G.box(w, t, d, .025), inside, x, y + t / 2, z);
  for (const sx of [-1, 1]) add(G.box(t, h, d, .025), color, x + sx * (w / 2 - t / 2), y + h / 2, z);
  for (const sz of [-1, 1]) add(G.box(w - t * 2, h, t, .02), color, x, y + h / 2, z + sz * (d / 2 - t / 2));
}
function star(add, x, y, z, r = .13, color = C.yellow) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = HP + i * PI / 5, rr = i % 2 ? r * .46 : r; if (!i) sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  sh.closePath(); add(G.ext(sh, .045, .012, 1), color, x, y, z);
}
function number(add, value, x, y, z, size = .18, color = C.cream, mirror = false) {
  const segments = { 0: 'abcedf', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgecd', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd' };
  const at = { a: [0, .5, 0], b: [.3, .26, 1], c: [.3, -.26, 1], d: [0, -.5, 0], e: [-.3, -.26, 1], f: [-.3, .26, 1], g: [0, 0, 0] };
  for (const key of segments[value] || '') { const [dx, dy, vert] = at[key]; add(G.box((vert ? .12 : .61) * size, (vert ? .43 : .12) * size, .025, .008), color, x + dx * size * (mirror ? -1 : 1), y + dy * size, z); }
}

const B = {};

B.gptfire_fan = (f, T, o = {}) => {
  fireStatic(f, 'fire-fan-base', ({ add, tube }) => {
    add(G.cyl(.93, 1.02, .11, 14), '#e0ac67', .32, .055, .02);
    for (let i = 0; i < 10; i++) {
      const a = i * PI * 2 / 10;
      add(G.sph(.19, 7, 5), i % 2 ? '#b4b6af' : '#e0cd67', .32 + Math.cos(a) * .83, .17, .02 + Math.sin(a) * .83, 0, a, 0, [1.1, .75, 1]);
    }
    for (const a of [.4, 2.5, 4.3]) {
      const dx = Math.cos(a) * .12, dz = Math.sin(a) * .12;
      tube([.32 - Math.cos(a) * .55, .2, .02 - Math.sin(a) * .55], [.32 + Math.cos(a) * .55, .26, .02 + Math.sin(a) * .55], .115, C.woodD, 7);
      add(G.cyl(.1, .1, .02, 7), '#e9b35d', .32 + Math.cos(a) * .56, .26, .02 + Math.sin(a) * .56, HP, a, 0);
    }
    // Green iron fan, broad wooden crank and solid support feet, connected to the fire by a short bellows nozzle.
    add(G.box(.7, .13, .66, .05), C.woodD, -1.15, .07, .04);
    add(G.box(.14, .66, .14, .035), C.teal, -1.15, .45, .04);
    add(G.cyl(.36, .36, .13, 16), C.teal, -1.15, .88, .04, HP, 0, 0);
    add(G.cyl(.29, .29, .015, 16), '#7ee067', -1.15, .88, .115, HP, 0, 0);
    tube([-.92, .7, .04], [-.42, .4, .04], .105, '#db9e52', 9, .16);
    for (let i = 0; i < 4; i++) add(G.tor(.125 - i * .008, .016, PI * 2, 4, 12), '#d47e2b', -.9 + i * .09, .67 - i * .055, .04, 0, 0, -.98);
    // Blanket trivet outside the fire ring; when tilted it reveals the smoke signal instead of crossing through the flame.
    for (const x of [-.25, .95]) tube([x, .08, -.76], [x, 1.33, -.76], .045, C.woodD, 6);
    tube([-.32, 1.33, -.76], [1.02, 1.33, -.76], .05, C.woodD, 6);
  });
  const flame = group(f.group, 0, .24, 0);
  flame.add(fireMc('fire-growing-embers', ({ add }) => {
    for (const [x, z, h, r] of [[.32, 0, .86, .28], [.06, -.05, .56, .19], [.57, .13, .63, .18], [.3, .25, .5, .17]]) {
      add(G.cone(r, h, 7), '#ec955a', x, h / 2, z);
      add(G.cone(r * .55, h * .7, 7), '#f6c451', x, h * .35, z + .045);
    }
  }));
  flame.scale.y = .35;
  const blades = group(f.group, -1.15, .88, .15);
  blades.add(fireMc('fire-fan-blades', ({ add }) => {
    for (let i = 0; i < 4; i++) { const a = i * HP; add(G.box(.17, .32, .04, .06), C.yellow, Math.sin(a) * .13, Math.cos(a) * .13, 0, 0, 0, -a - .3); }
    add(G.cyl(.075, .075, .08, 10), '#e09167', 0, 0, .03, HP, 0, 0);
  }));
  const crank = group(f.group, -1.15, .88, -.08);
  crank.add(fireMc('fire-fan-crank', ({ add }) => {
    add(G.box(.07, .4, .07, .02), C.woodD, 0, -.14, 0);
    add(G.cyl(.065, .065, .22, 9), '#e57f62', 0, -.32, -.08, HP, 0, 0);
  }));
  const fan = mech(f, 'lever', [blades, crank, flame], t => { blades.rotation.z = -t * PI * 8; crank.rotation.z = -t * PI * 4; flame.scale.y = .35 + .65 * t; }, 'fire-fan', '불을 부치는 수동 선풍기', .8);
  fan.gptChain = ['fire-smoke', 'fire-basket'];
  fan.sfx = 'gearUp'; fan.gptEndSfx = 'click';
  const blanket = group(f.group, .32, 1.3, -.76);
  blanket.add(fireMc('fire-smoke-blanket', ({ add }) => {
    add(G.box(1.3, .62, .065, .035), C.navy, 0, -.28, .015);
    for (const x of [-.42, -.21, 0, .21, .42]) add(G.box(.085, .58, .014, .01), '#6795e0', x, -.28, .055);
    add(G.box(1.29, .07, .11, .025), C.wood, 0, -.61, .015);
  }));
  const smoke = group(f.group, .3, 1.15, -.1);
  smoke.add(fireMc('fire-smoke-signal', ({ add }) => {
    for (const [x, y, z, s] of [[0, 0, 0, .16], [.05, .28, -.02, .21], [-.02, .59, -.03, .25], [.12, .9, -.02, .27]]) add(G.sph(s, 9, 6), '#e0b567', x, y, z, 0, 0, 0, [1.1, .75, 1]);
    add(G.cyl(.29, .29, .06, 16), C.cream, .14, 1.18, 0, HP, 0, 0);
    star(add, .14, 1.18, .035, .21, C.peach);
  }));
  smoke.scale.setScalar(.001);
  const p = mech(f, 'lever', [blanket, smoke], t => {
    blanket.rotation.x = -1.4 * t; smoke.scale.setScalar(.001 + t * .999); smoke.position.y = 1.0 + t * .15;
    // The signal drifts out of the sightline to Panda's basket at the starting 45° camera.
    smoke.position.x = .3 + ((o.gptStage || 57) === 57 ? .9 * t : 0);
  }, 'fire-smoke', '젖은 덮개와 별 모양 연기 신호', .8);
  p.gptRequires = 'fire-fan';
  p.sfx = 'whoosh'; p.gptEndSfx = 'pop';
  if (o.gptStage === 60) {
    // Boss stages have just a few optional toys. The entire campfire is ONE tap, rather than a second main chain.
    const fanApply = fan.apply, smokeApply = p.apply;
    fan.pivots.push(blanket, smoke); fan.apply = t => { fanApply(t); smokeApply(t); };
    delete fan.gptChain; fan.label = '캠프파이어 미니 스위치'; fan.gptReaction = '마시멜로 굽는 불 준비 완료!';
    f.parts.splice(f.parts.indexOf(p), 1);
  }
};

// C: a crooked hill tree carries a conspicuous orange pulley. The entire open basket descends along a real rope.
B.gptfire_treebasket = (f, T, o = {}) => {
  fireStatic(f, 'fire-tree-frame', ({ add, tube }) => {
    tube([-.42, .04, -.22], [-.5, 1.5, -.18], .16, C.bark, 8, .23);
    tube([-.5, 1.45, -.18], [-.25, 2.9, -.16], .12, C.bark, 8, .16);
    // (57판 아트 점검 ⑪ 10/23, 허브: "납작한 원반 잎 나무에 사람 손이 달려 바구니를 듦, 기괴하고 뭔지 모름" — ② 다시: 가늘게 휜 가지,
    // 그 밑에 매단 나무 도르래 바퀴(살색 원반 X), 둥글게 겹친 잎 덩어리)
    tube([-.38, 2.2, -.17], [.2, 2.62, -.04], .085, C.bark, 7, .11);
    tube([.2, 2.62, -.04], [.86, 2.78, .06], .06, C.bark, 6, .08);
    tube([.45, 2.68, 0], [.62, 2.98, -.06], .035, C.bark, 5, .05);
    tube([-.41, 2.1, -.16], [-1.0, 2.64, -.35], .075, C.bark, 7, .11);
    for (const [x, y, z, r, c] of [[-.7, 2.9, -.3, .52, '#5fcf7c'], [-.15, 3.12, -.38, .5, '#8fd86a'], [-.4, 3.32, -.2, .42, '#6fdc86'], [.15, 2.88, -.16, .36, '#7fd46f'], [-.95, 2.7, -.1, .34, '#8fd86a']])
      add(G.sph(r, 12, 9), c, x, y, z, 0, 0, 0, [1.05, .88, 1]);
    tube([.74, 2.76, .1], [.74, 2.64, .1], .018, C.steel, 5);
    add(G.cyl(.15, .15, .07, 16), C.woodD, .74, 2.52, .12, HP, 0, 0);
    add(G.tor(.15, .022, PI * 2, 5, 18), C.bark, .74, 2.52, .16);
    add(G.cyl(.04, .04, .1, 8), C.steel, .74, 2.52, .12, HP, 0, 0);
    tube([-.34, .7, .05], [.6, 2.5, .14], .022, C.rope, 5);
    add(G.box(.3, .26, .15, .04), C.navy, -.3, .74, .08);
    // A star weather-vane is scenery; every animal uses the game's canonical character builders.
    star(add, -.85, 2.66, -.21, .18, C.yellow);
    tube([-.85, 2.39, -.21], [-.85, 2.66, -.21], .025, C.woodD, 6);
    for (const a of [0, 2, 4]) tube([-.42, .1, -.22], [-.42 + Math.cos(a) * .4, .03, -.22 + Math.sin(a) * .4], .065, C.bark, 6, .14);
  });
  if (o.gptStage === 60) return;
  const basket = group(f.group, .74, 1.46, .16);   // (② 10/23: hung just under the pulley wheel)
  basket.add(fireMc('fire-tree-basket-panda-cameo', ({ add, tube }) => {
    wicker(add, tube, 1.25, .9, false);
    // Route the rear slings above Panda's ears instead of running diagonally through the head.
    for (const x of [-.525, .525]) {
      tube([x, .29, -.36], [x, .86, -.36], .021, C.rope, 5);
      tube([x, .86, -.36], [0, .83, 0], .021, C.rope, 5);
      // Front attachments travel along the rigid rim into the rear slings, leaving the face unobstructed.
      tube([x, .29, .36], [x, .29, -.36], .021, C.rope, 5);
    }

  }));
  // (②b 10/22 밤 허브: 처음부터 보이는 판다는 뺌 — 바구니엔 준비물만)
  const rope = group(f.group, .74, 2.37, .16);   // (② 10/23: from under the pulley wheel)
  rope.add(fireMc('fire-tree-rope', ({ add }) => add(G.cyl(.022, .022, 1, 5), C.rope, 0, -.5, 0)));
  const latch = group(f.group, -.3, .74, .19);
  latch.add(fireMc('fire-tree-latch', ({ add }) => {
    add(G.box(.075, .3, .075, .025), C.yellow, 0, .1, .02);
    add(G.sph(.075, 9, 6), C.woodD, 0, .28, .02);   // (② 10/23: a wooden cleat knob, not a peach ball that read as a hand)
  }));
  const update = t => { basket.position.y = 1.46 - 1.06 * t; basket.rotation.z = Math.sin(t * PI * 4) * .035; rope.scale.y = Math.max(.02, 2.37 - basket.position.y - .84); latch.rotation.x = -1.0 * t; };
  update(0);
  const p = mech(f, 'lift', [basket, rope, latch], update, 'fire-basket', '연기 신호를 받고 내려오는 나무 바구니', 1.0);
  p.gptRequires = 'fire-smoke';
  p.sfx = 'ratchet'; p.gptEndSfx = 'land'; p.gptReaction = '판다는 마시멜로 굽다가 들켰네!';
  f.spot('inside', basket, .31, .2, .16, { part: p, maxH: .5, scale: 1.16, label: '판다 옆 앞쪽 준비물 자리' });
};

// 원본 캠프장에선 소품 크기로(가운데를 비우게 — 허브 10/22 밤)
for (const k of ['gptfire_fan', 'gptfire_treebasket']) { const b = B[k]; B[k] = (f, T, o = {}) => { b(f, T, o); f.group.scale.setScalar(o.scale || .72); }; }
export const GPT_CAMP_DEVICE_BUILDERS = B;
export const GPT_CAMP_DEVICE_INFO = { gptfire_fan: { w: 2, d: 2, name: '선풍기와 연기 신호 모닥불', hidden: true }, gptfire_treebasket: { w: 2, d: 1, name: '신호 나무 구조 바구니', hidden: true } };

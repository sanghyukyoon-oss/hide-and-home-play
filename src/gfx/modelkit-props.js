// 프라모델 조립판 (시제품 10/18, user: "프라모델 조립판도 하나 넣으면 어때.. 부품 다 모아서 조립하는거야 완성하면"): the things to
// find in the room are the pieces of a plastic model kit, and once every piece is found they fly together into the
// finished model. This file is only the look: the pieces as things to find (ITEMS), the pieces in their place on the
// model (for the 설계도 HUD and the assembly), and the finished model as a piece of furniture for my home.
//
// Every piece is built in the MODEL's frame (feet at the origin, facing +z), so the same build is
//   · the piece in its place on the model (assembly, the 설계도 pictures),
//   · the thing to find: the same piece, laid down if it lies better that way, sat on the floor (y = 0), with a stub of
//     the plastic runner (sprue) still on it — that's what makes it read as a model-kit piece, not a toy.
// One bright plastic colour per piece, so each piece reads at phone size by its colour and its outline.
import * as THREE from 'three';
import { rbox, sph, cyl, tor, cone, cap, put, grp, extrude, starShape } from './kit.js';

const WHITE = '#f6f7ff', BLUE = '#3d7bff', GREEN = '#4cc62e', RED = '#ff4f5e', YELLOW = '#ffc93c', ORANGE = '#ff9a3c',
  CYAN = '#63dcff', PEG = '#d5d9ea', DARK = '#2a2440';
const GLOSS = { rough: .35 };

// a stub of the runner left on a piece: a short rod and the little square tab where it was cut (only on the loose piece)
function sprue(g, color, x, y, z, dir = [1, 0, 0]) {
  const d = new THREE.Vector3(...dir).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
  const rod = cyl(.009, .009, .05, color, null, 8); rod.quaternion.copy(q); rod.position.set(x + d.x * .025, y + d.y * .025, z + d.z * .025); g.add(rod);
  const tab = rbox(.026, .026, .026, color, .006); tab.quaternion.copy(q); tab.position.set(x + d.x * .058, y + d.y * .058, z + d.z * .058); g.add(tab);
}

// ── 꼬마 로봇 (the first kit): 7 pieces, built bottom-up. joint = where the piece pivots once it is on (an arm waves round
// its shoulder); lay = how the loose piece lies; nub = where its runner stub sticks out
const ROBOT = {
  legs: { name: '로봇 다리', color: GREEN, joint: [0, .2, 0], nub: [[.085, .2, 0], [1, 0, 0]], build(g) {
    g.add(put(rbox(.17, .06, .1, GREEN, .025), 0, .2, 0));                                   // hips
    g.add(put(cyl(.024, .024, .02, PEG, null, 14), 0, .24, 0));                               // the peg the body goes on
    for (const sx of [-1, 1]) {
      g.add(put(cap(.034, .08, WHITE), sx * .052, .115, 0));                                  // legs
      g.add(put(rbox(.078, .062, .112, GREEN, .022), sx * .052, .031, .012));                // boots
      g.add(put(rbox(.05, .012, .02, YELLOW, .004), sx * .052, .05, .069));                   // a stripe on each toe
    }
  } },
  body: { name: '로봇 몸통', color: BLUE, joint: [0, .32, 0], nub: [[.105, .27, 0], [1, -.3, 0]], build(g) {
    g.add(put(rbox(.13, .03, .09, PEG, .01), 0, .238, 0));                                    // waist
    g.add(put(rbox(.21, .17, .14, BLUE, .04), 0, .325, 0));                                   // chest
    g.add(put(cyl(.045, .055, .022, WHITE, null, 16), 0, .418, 0));                           // collar
    g.add(put(extrude('kitstar', starShape(.042, .019), .016, YELLOW, GLOSS), 0, .335, .074));   // the star on the chest
    g.add(put(sph(.013, RED, GLOSS, 10, 8), -.065, .268, .071)); g.add(put(sph(.013, YELLOW, GLOSS, 10, 8), .065, .268, .071));
    for (const sx of [-1, 1]) g.add(put(sph(.028, PEG, null, 12, 10), sx * .112, .37, 0));   // shoulder sockets
  } },
  jet: { name: '로봇 제트팩', color: ORANGE, joint: [0, .33, -.105], nub: [[0, .41, -.105], [0, 1, -.4]], build(g) {
    g.add(put(rbox(.16, .15, .07, ORANGE, .03), 0, .33, -.105));
    g.add(put(rbox(.12, .024, .05, WHITE, .01), 0, .412, -.105));
    for (const sx of [-1, 1]) {
      g.add(put(rbox(.022, .085, .05, ORANGE, .008), sx * .09, .3, -.105));                  // fins
      g.add(put(cyl(.026, .036, .045, PEG, null, 14), sx * .045, .238, -.105));               // nozzles
      g.add(put(cone(.027, .065, YELLOW, GLOSS, 12), sx * .045, .182, -.105, Math.PI, 0, 0));   // plastic flames
      g.add(put(rbox(.03, .03, .04, PEG, .008), sx * .05, .37, -.06));                       // clips onto the back
    }
  } },
  claw: { name: '로봇 집게팔', color: YELLOW, joint: [-.135, .37, 0], lay: [0, 0, -Math.PI / 2], nub: [[-.14, .3, .03], [0, 0, 1]], build(g) {
    g.add(put(sph(.034, YELLOW, null, 14, 12), -.135, .37, 0));
    g.add(put(cap(.029, .07, YELLOW), -.142, .3, 0));
    g.add(put(cyl(.036, .036, .022, PEG, null, 14), -.142, .235, 0));                        // wrist
    // a C-shaped claw, open at the bottom
    const arc = Math.PI * 1.35;
    g.add(put(tor(.044, .015, YELLOW, null, arc, 10, 22), -.142, .186, 0, 0, 0, Math.PI * 1.5 - (arc + (Math.PI * 2 - arc) / 2)));
    g.add(put(sph(.017, YELLOW, null, 10, 8), -.142 + Math.cos(-.32 * Math.PI) * .044, .186 + Math.sin(-.32 * Math.PI) * .044, 0));
    g.add(put(sph(.017, YELLOW, null, 10, 8), -.142 - Math.cos(-.32 * Math.PI) * .044, .186 + Math.sin(-.32 * Math.PI) * .044, 0));
  } },
  fist: { name: '로봇 주먹팔', color: RED, joint: [.135, .37, 0], lay: [0, 0, Math.PI / 2], nub: [[.14, .3, .03], [0, 0, 1]], build(g) {
    g.add(put(sph(.034, RED, null, 14, 12), .135, .37, 0));
    g.add(put(cap(.029, .07, RED), .142, .3, 0));
    g.add(put(cyl(.04, .04, .024, WHITE, null, 16), .142, .232, 0));                         // cuff
    g.add(put(sph(.052, RED, null, 16, 12), .142, .182, .004, 0, 0, 0, [1, .92, 1.08]));      // fist
    g.add(put(sph(.02, RED, null, 10, 8), .118, .196, .046));                                // thumb
    for (const k of [-1, 0, 1]) g.add(put(rbox(.016, .012, .01, WHITE, .004), .142 + k * .022, .2, .058));   // knuckles
  } },
  head: { name: '로봇 머리', color: WHITE, joint: [0, .43, 0], nub: [[0, .47, -.068], [0, -.2, -1]], build(g) {
    g.add(put(cyl(.022, .022, .02, PEG, null, 12), 0, .425, 0));                              // neck peg
    g.add(put(rbox(.17, .13, .14, WHITE, .045), 0, .49, 0));
    g.add(put(rbox(.136, .054, .02, CYAN, .018, GLOSS), 0, .5, .071));                        // visor
    for (const sx of [-1, 1]) {
      g.add(put(sph(.016, DARK, GLOSS, 10, 8), sx * .032, .5, .083, 0, 0, 0, [1, 1, .5]));   // eyes
      g.add(put(cyl(.032, .032, .022, RED, null, 16), sx * .093, .49, 0, 0, 0, Math.PI / 2));   // ear bolts
    }
    g.add(put(rbox(.05, .009, .006, DARK, .003), 0, .452, .072));                             // mouth
    // the antenna, moulded on (one piece fewer to find: 6, 레벨 세션 10/19)
    g.add(put(cyl(.032, .038, .022, YELLOW, null, 16), 0, .567, 0));
    g.add(put(cyl(.014, .014, .07, YELLOW, null, 10), 0, .61, 0));
    g.add(put(tor(.028, .008, YELLOW, null, Math.PI * 2, 8, 18), 0, .602, 0, Math.PI / 2, 0, 0));
    g.add(put(sph(.036, RED, GLOSS, 16, 12), 0, .658, 0));
  } },
};

// the kits (one for now). order = the runner's order (1, 2, 3…)
export const KITS = {
  // order = the runner's numbers = the build order (user 10/19 picked 순서 맞추기, e.g. 몸통 → 다리 → 팔 → 머리)
  // build: how the build plays (modelkit.js kitBuild) — the knobs for later, harder kits:
  //   ordered  pieces go on in the runner's order (off: any order)
  //   glow     the next number glows on the runner (off: read the numbers yourself)
  //   ghost    the see-through model shows where each piece goes (off: only the box art to go by)
  robot: { id: 'robot', name: '꼬마 로봇', furn: 'kitrobot', parts: ROBOT, order: ['body', 'legs', 'claw', 'fist', 'jet', 'head'],
    build: { ordered: true, glow: true, ghost: false },   // (no see-through model: user 10/19 「그림자로 하지 말고」 — the runner on the mat shows the parts)
    // the runner card: each piece's short name, and the plastic the runner is moulded in
    short: { legs: '다리', body: '몸통', jet: '제트팩', claw: '집게팔', fist: '주먹팔', head: '머리' }, runner: '#a9d8ff', color: '#3d7bff',
    // the runner's windows (modelkit.js kitRunner): the body big on the left, legs over the jetpack, the two arms tall and thin,
    // the head tall (its antenna) at the end — read left to right, about the build's order
    frame: { areas: ['body legs claw fist head', 'body jet claw fist head'], cols: [1.7, 1, .72, .72, 1] },
    type: 'model', skin: 'runner', intro: 'box', boxArt: 'art/kits/robot-box.jpg',   // (the lid: GPT's box art, 10/19 — 640 px JPEG, 86 KB)
    locked: 'head' },   // the piece a padlock guards on a campaign stage (8판: the face comes last, out of the locked chest)
};
// ── 13판 이삿짐 풀기 and 34판 파르페 쌓기 (10/19, user: "새아이디어는 1,2" — the story room's ideas on the same card): the
// same hunt and card, a different end (modelkit.js):
//   place  things out of the moving boxes: each find folds a box in the room; all found → the room is home (13판)
//   stack  parfait toppings: each find goes onto the big parfait, on its own layer; the cherry waits and goes on top last
// order: the card's cells (things to find: ITEMS types); locked: the one the stage's first lock guards (13판: the code safe)
// 10/20 (user on the phone: every kit stage like the robot's — the box and 콕, the runner card): each has its box (a kraft
// moving box; a parfait kit with the parfait on its lid), the runner with windows of its own sizes, and 파르페 is put
// together at the end like the robot, topping by topping in its order (the moving things have nothing to build: its end stays)
// — and 13판's card its own (10/20, user: "이삿짐 풀기 UI는 왜 또 프라모델로 한 거야?"): 'labels' little labelled moving boxes
// that get a 완료 stamp, or 'list' a kraft checklist that gets ticked (the user picks; ?kitskin= shows either)
KITS.moving = { id: 'moving', type: 'place', skin: 'labels', intro: 'box', lid: 'kraft', countWord: '짐', numbers: false, name: '이삿짐 풀기', furn: 'kitmovebox',
  short: { teddy: '곰인형', slipper: '슬리퍼', remote: '리모컨', glasses: '안경', console: '게임기', duck: '오리', umbrella: '우산' },   // (the checklist's words: short, one line each)
  frame: { areas: ['teddy slipper slipper remote umbrella', 'teddy glasses console duck umbrella'], cols: [1.5, 1, 1, .8, .7] },
  order: ['teddy', 'slipper', 'remote', 'glasses', 'console', 'duck', 'umbrella'], locked: 'teddy', runner: '#e8c28a', color: '#c98a4b' };   // (8 → 7, no toothbrush: 22 px on a phone, and the first code lock comes on this stage too — 11~20판 레벨 점검 10/20)
KITS.parfait = { id: 'parfait', type: 'stack', skin: 'runner', intro: 'box', lid: 'pic', countWord: '토핑', name: '파르페 쌓기', furn: 'kitparfait',
  build: { ordered: true, glow: true },
  frame: { areas: ['pf_cereal pf_icecream pf_banana pf_banana pf_wafer', 'pf_cereal pf_strawberry pf_cream pf_cherry pf_wafer'], cols: [1.5, 1, 1, 1, .7] },
  order: ['pf_cereal', 'pf_icecream', 'pf_banana', 'pf_strawberry', 'pf_cream', 'pf_wafer', 'pf_cherry'], last: 'pf_cherry', runner: '#ffc9dc', color: '#ff6fa6' };
export const kitItem = (kit, key) => KITS[kit].type === 'model' ? 'kit_' + kit + '_' + key : key;

// a piece in its place on the model (model frame)
export function buildKitPart(kit, key) {
  const g = grp();
  KITS[kit].parts[key].build(g);
  return g;
}
// the whole model, every piece in its place (one group per piece, in snap order)
export function buildKitModel(kit) {
  const g = grp();
  for (const k of KITS[kit].order) { const p = buildKitPart(kit, k); p.userData.kitPart = k; g.add(p); }
  return g;
}
// the little work mat the robot is built on (a green cutting mat with its grid)
export function buildMat(w = 1.5, d = 1.25) {
  const g = grp();
  g.add(put(rbox(w, .012, d, '#3fae6a', .006), 0, .006, 0));
  for (let x = -w / 2 + .1; x < w / 2 - .01; x += .1) g.add(put(rbox(.006, .002, d - .06, '#bfe8cc', .001), x, .013, 0));
  for (let z = -d / 2 + .1; z < d / 2 - .01; z += .1) g.add(put(rbox(w - .06, .002, .006, '#bfe8cc', .001), 0, .013, z));
  return g;
}
// the robot's eyes lighting up when it comes alive: two glowing dots over the visor, on the head (model frame)
export function buildKitGlow(kit) {
  const g = grp();
  if (kit === 'robot') for (const sx of [-1, 1]) g.add(put(sph(.019, '#ffffff', { emissive: '#bff4ff', ei: 1.5 }, 10, 8), sx * .032, .5, .087, 0, 0, 0, [1, 1, .5]));
  return { part: 'head', g };
}
// the loose piece as a thing to find: laid down if it lies better, the runner stub on, sitting on the floor — a size
// bigger than on the model (LOOSE), so a piece reads at phone size like the other things to find
export const LOOSE = 1.25;
function loosePiece(kit, key) {
  const P = KITS[kit].parts[key], inner = buildKitPart(kit, key);
  if (P.nub) sprue(inner, P.color, ...P.nub[0], P.nub[1]);
  const lay = grp(inner);
  if (P.lay) lay.rotation.set(...P.lay);
  lay.scale.setScalar(LOOSE);
  const out = grp(lay); out.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(out), c = b.getCenter(new THREE.Vector3());
  lay.position.set(-c.x, -b.min.y, -c.z);
  return out;
}

// the pieces join the things you can find (main.js: Object.assign(ITEMS, KIT_ITEMS)); h is measured from the build.
// noCollect: never in 내 집 숨기기; kit: kept out of the 도감's item cards (they come back as the finished model)
export const KIT_ITEMS = {};
for (const kit in KITS) if (KITS[kit].type === 'model') for (const key of KITS[kit].order) {
  let h = null;   // measured the first time it's asked for (by then the cartoon style is on, so no stray materials)
  KIT_ITEMS[kitItem(kit, key)] = { name: KITS[kit].parts[key].name, noCollect: true, kit, build: () => loosePiece(kit, key),
    get h() { return h ??= +new THREE.Box3().setFromObject(loosePiece(kit, key)).getSize(new THREE.Vector3()).y.toFixed(3); } };
}

// ── the finished model on a little display stand: a piece of furniture for my home (the reward)
const B = {};
B.kitrobot = f => {
  f.add(put(cyl(.26, .29, .06, '#fff3e0', null, 28), 0, .03, 0));
  f.add(put(cyl(.27, .27, .014, BLUE, null, 28), 0, .066, 0));
  f.add(put(rbox(.16, .05, .02, YELLOW, .01), 0, .035, .275, -.2, 0, 0));   // a name plate on the front
  const m = buildKitModel('robot'); m.scale.setScalar(1.25); m.position.y = .073; f.add(m);
};
export const KIT_BUILDERS = B;
export const KIT_INFO = { kitrobot: { w: 1, d: 1, name: '조립 로봇', price: 0 } };
Object.assign(KIT_INFO, { kitmovebox: { w: 1, d: 1, name: '이삿짐 상자', price: 0 }, kitparfait: { w: 1, d: 1, name: '큰 파르페', price: 0 } });

// ── 13판: a moving box (kraft card, a strip of tape, the flaps' seams) — a dozen sit about the room, one folds flat for
// every thing found; and the one 몽글이 keeps ("…상자 하나는 남겨 둬. 숨기 좋겠다.") is the reward
const KRAFT = '#e2b77c', KRAFT2 = '#c9955a', TAPE = '#f6e3b8';
export function buildMoveBox(seed = 0) {
  const g = grp(), w = .34 + (seed % 3) * .03, hh = .24 + (seed % 2) * .05, d = .3;
  g.add(put(rbox(w, hh, d, KRAFT, .018), 0, hh / 2, 0));
  g.add(put(rbox(w + .004, .006, .004, KRAFT2, .002), 0, hh - .002, 0));            // the seam of the flaps
  g.add(put(rbox(.07, .008, d + .006, TAPE, .003), 0, hh + .001, 0));               // tape over it
  g.add(put(rbox(.07, .09, .006, TAPE, .003), 0, hh - .045, d / 2 + .002));          // …down the front
  if (seed % 2) g.add(put(extrude('kitheart', heartShape(.032), .006, '#ff8fa8'), w * .28, hh * .45, d / 2 + .004));   // a sticker
  return g;
}
function heartShape(r) {
  const sh = new THREE.Shape();
  sh.moveTo(0, -r); sh.bezierCurveTo(r * 1.4, -r * .1, r * .9, r * 1.1, 0, r * .45); sh.bezierCurveTo(-r * .9, r * 1.1, -r * 1.4, -r * .1, 0, -r);
  return sh;
}
B.kitmovebox = f => { const b = buildMoveBox(1); b.scale.setScalar(1.6); f.add(b); };

// ── 34판: the toppings (things to find) and the big parfait they go on. Bottom to top: cereal, ice cream, banana,
// strawberry, cream, wafer, cherry. Each topping is a little dish of it as a thing to find; on the parfait it is a layer.
const CREAM = '#fffaf3', PINK = '#ffb3cc', CHOCO = '#8a5a3c', CEREAL = '#d9964f', BAN = '#ffe27a', STRAW = '#ff5a72', LEAF = '#5cc93a', WAF = '#f0c27a', CHERRY = '#e8233a';
const dish = (g, c = '#ffffff') => { g.add(put(cyl(.06, .045, .03, c, null, 18), 0, .015, 0)); g.add(put(tor(.058, .006, '#ffd0de', null, Math.PI * 2, 8, 22), 0, .03, 0, Math.PI / 2, 0, 0)); };
const TOP = {
  pf_cereal: { name: '시리얼', build(g) { dish(g); for (let i = 0; i < 9; i++) { const a = i * 2.4, r = i ? .028 : 0; g.add(put(rbox(.026, .016, .022, i % 3 ? CEREAL : '#b8743a', .006), Math.cos(a) * r, .04 + (i % 3) * .01, Math.sin(a) * r, i, i * .7, 0)); } } },
  pf_icecream: { name: '아이스크림', build(g) { dish(g); g.add(put(sph(.05, PINK, GLOSS, 18, 14), 0, .07, 0)); g.add(put(tor(.045, .012, PINK, null, Math.PI * 2, 8, 20), 0, .04, 0, Math.PI / 2, 0, 0)); } },
  pf_banana: { name: '바나나', build(g) { g.add(put(tor(.06, .02, BAN, null, Math.PI * .9, 10, 20), 0, .02, 0, Math.PI / 2, 0, .2)); g.add(put(sph(.012, '#8a6a3a', null, 8, 6), .06, .02, .01)); } },
  pf_strawberry: { name: '딸기', build(g) { g.add(put(cone(.04, .075, STRAW, GLOSS, 16), 0, .04, 0, Math.PI, 0, 0)); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(put(cone(.016, .03, LEAF, null, 6), Math.cos(a) * .022, .08, Math.sin(a) * .022, Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3)); } } },
  pf_cream: { name: '생크림', build(g) { dish(g); g.add(put(tor(.04, .02, CREAM, null, Math.PI * 2, 10, 22), 0, .045, 0, Math.PI / 2, 0, 0)); g.add(put(tor(.026, .017, CREAM, null, Math.PI * 2, 10, 20), 0, .07, 0, Math.PI / 2, 0, 0)); g.add(put(cone(.02, .04, CREAM, null, 12), 0, .095, 0)); } },
  pf_wafer: { name: '웨하스', build(g) { for (const [x, rz] of [[-.015, .25], [.015, -.2]]) { const w = put(rbox(.032, .13, .018, WAF, .006), x, .065, 0, 0, 0, rz); g.add(w); } g.add(put(rbox(.034, .006, .02, '#d9a65c', .002), -.015, .09, .006, 0, 0, .25)); } },
  pf_cherry: { name: '체리', build(g) { g.add(put(sph(.032, CHERRY, GLOSS, 16, 12), 0, .032, 0)); g.add(put(tor(.04, .004, '#5a8a2a', null, Math.PI * .45, 6, 12), -.034, .062, 0, 0, 0, .1)); g.add(put(cone(.012, .03, LEAF, null, 6), .005, .1, 0, 0, 0, -1.2)); } },
};
for (const [k, T] of Object.entries(TOP)) {
  let h = null;
  const build = () => { const g = grp(); T.build(g); return g; };
  KIT_ITEMS[k] = { name: T.name, noCollect: true, kit: 'parfait', build, get h() { return h ??= +new THREE.Box3().setFromObject(build()).getSize(new THREE.Vector3()).y.toFixed(3); } };
}
// the big parfait: a tall glass on a stem; every layer its own group (hidden until its topping is found)
export function buildParfait() {
  const g = grp(), layers = {}, glass = { opacity: .28 };
  g.add(put(cyl(.15, .17, .035, '#eaf6ff', null, 26), 0, .018, 0));                      // foot
  g.add(put(cyl(.032, .04, .16, '#eaf6ff', null, 14), 0, .11, 0));                        // stem
  g.add(put(cyl(.13, .05, .05, '#eaf6ff', null, 22), 0, .205, 0));                        // the bowl's bottom
  g.add(put(cyl(.21, .13, .44, '#d8f0ff', glass, 28, true), 0, .45, 0));                  // the glass (see-through)
  g.add(put(tor(.21, .012, '#ffffff', null, Math.PI * 2, 8, 36), 0, .67, 0, Math.PI / 2, 0, 0));   // rim
  const L = (key, f) => { const l = grp(); f(l); l.visible = false; g.add(l); layers[key] = l; };
  const band = (y0, h, r0, r1, c) => put(cyl(r1, r0, h, c, null, 26), 0, y0 + h / 2, 0);   // a layer filling the glass from y0
  const rAt = y => .13 + (.21 - .13) * (y - .23) / .44;
  L('pf_cereal', l => { l.add(band(.23, .09, rAt(.23) - .006, rAt(.32) - .006, CEREAL)); for (let i = 0; i < 10; i++) { const a = i * .63; l.add(put(rbox(.03, .018, .026, i % 2 ? CEREAL : '#b8743a', .006), Math.cos(a) * .13, .29, Math.sin(a) * .13, i, a, 0)); } });
  L('pf_icecream', l => { l.add(band(.32, .1, rAt(.32) - .006, rAt(.42) - .006, PINK)); l.add(put(sph(.07, PINK, GLOSS, 18, 12), .04, .43, .03, 0, 0, 0, [1, .55, 1])); });
  L('pf_banana', l => { l.add(band(.42, .07, rAt(.42) - .006, rAt(.49) - .006, '#fff3b8')); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .3; l.add(put(cyl(.04, .04, .014, BAN, null, 14), Math.cos(a) * (rAt(.47) - .012), .46, Math.sin(a) * (rAt(.47) - .012), 0, -a, Math.PI / 2)); } });
  L('pf_strawberry', l => { l.add(band(.49, .1, rAt(.49) - .006, rAt(.59) - .006, '#ff9fb2')); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; l.add(put(cone(.045, .08, STRAW, GLOSS, 14), Math.cos(a) * .12, .64, Math.sin(a) * .12, Math.PI + Math.sin(a) * .5, 0, Math.cos(a) * .5)); } });
  L('pf_cream', l => { l.add(band(.59, .08, rAt(.59) - .006, .2, CREAM)); l.add(put(tor(.13, .055, CREAM, null, Math.PI * 2, 12, 30), 0, .7, 0, Math.PI / 2, 0, 0)); l.add(put(tor(.08, .045, CREAM, null, Math.PI * 2, 12, 26), 0, .77, 0, Math.PI / 2, 0, 0)); l.add(put(cone(.05, .09, CREAM, null, 16), 0, .84, 0)); });
  L('pf_wafer', l => { for (const [x, rz] of [[-.07, .3], [.09, -.25]]) l.add(put(rbox(.05, .24, .026, WAF, .008), x, .8, -.04, 0, 0, rz)); l.add(put(sph(.02, CHOCO, null, 10, 8), .02, .79, .1)); l.add(put(sph(.016, CHOCO, null, 10, 8), -.05, .76, .11)); });
  L('pf_cherry', l => { l.add(put(sph(.05, CHERRY, GLOSS, 18, 14), 0, .92, .01)); l.add(put(tor(.05, .006, '#5a8a2a', null, Math.PI * .45, 6, 12), -.045, .965, 0, 0, 0, .15)); });
  return { g, layers };
}
B.kitparfait = f => { const p = buildParfait(); for (const k in p.layers) p.layers[k].visible = true; p.g.scale.setScalar(1.3); f.add(p.g); };

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
    build: { ordered: true, glow: true, ghost: true },
    // the runner card: each piece's short name, and the plastic the runner is moulded in
    short: { legs: '다리', body: '몸통', jet: '제트팩', claw: '집게팔', fist: '주먹팔', head: '머리' }, runner: '#a9d8ff', box: '#3d7bff',
    locked: 'head' },   // the piece a padlock guards on a campaign stage (8판: the face comes last, out of the locked chest)
};
export const kitItem = (kit, key) => 'kit_' + kit + '_' + key;

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
for (const kit in KITS) for (const key of KITS[kit].order) {
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

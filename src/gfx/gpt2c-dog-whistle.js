// Stage 26's visible main chain: whistle -> rolling ball -> tipping flowerpot -> cadet cap.
// (gpt2-c 작업장 gptdoghouse-whistle.js, fix-1022 a83e02b — ① 10/22 그대로 들여옴: GPT 원색, 부품은 우리 f.part 꼴)
// A single ordinary Furn part coordinates the four pivots, so RUN can time sounds and skip the scene.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { put, mat, mesh, geo, cyl, sph, tor, extrude, starShape } from './kit.js';

const B = {}, PI = Math.PI, HP = PI / 2;
const C = { cream: '#fef2e1', teal: '#47b6a3', tealD: '#2f9386', brass: '#feb53d', honey: '#eaa440',
  edge: '#c67f2a', clay: '#ed6670', soil: '#6f4b30', leaf: '#47b6a3', orange: '#4c99da', navy: '#6f4b30' };
const ease = t => { const u = THREE.MathUtils.clamp(t, 0, 1); return u * u * (3 - 2 * u); };
function box(w, h, d, c, r = .015) {
  r = Math.min(r, Math.min(w, h, d) * .4);
  return mesh(geo(`gptwhistlebox|${w}|${h}|${d}|${r}`, () => r > .004
    ? new RoundedBoxGeometry(w, h, d, 1, r) : new THREE.BoxGeometry(w, h, d)), mat(c));
}
function add(g, o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  g.add(put(o, x, y, z, rx, ry, rz)); return o;
}
function rod(g, a, b, r, c, seg = 8) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), v = bv.clone().sub(av);
  const o = cyl(r, r, v.length(), c, null, seg);
  o.position.copy(av.add(bv).multiplyScalar(.5));
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); g.add(o); return o;
}
function beam(g, a, b, w, h, c) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), v = bv.clone().sub(av);
  const o = box(v.length(), h, w, c, .012);
  o.position.copy(av.add(bv).multiplyScalar(.5));
  o.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), v.normalize()); g.add(o); return o;
}

function cadetHat() {
  const g = new THREE.Group();
  // A thick, clearly projecting visor, sage band, cream crown and a raised brass badge.
  const brim = new THREE.Shape();
  brim.moveTo(-.20, -.055); brim.quadraticCurveTo(-.28, .10, -.18, .22);
  brim.quadraticCurveTo(0, .31, .18, .22); brim.quadraticCurveTo(.28, .10, .20, -.055); brim.closePath();
  const bg = geo('gpt-cadet-hat-visor', () => {
    const gg = new THREE.ExtrudeGeometry(brim, { depth: .026, bevelEnabled: true,
      bevelSize: .007, bevelThickness: .005, bevelSegments: 1, curveSegments: 7 });
    gg.rotateX(HP); gg.translate(0, .026, 0); return gg;
  });
  add(g, mesh(bg, mat(C.tealD)), 0, .01, -.055);
  add(g, cyl(.215, .225, .073, C.teal, null, 18), 0, .079, -.018, 0, 0, 0).scale.z = .80;
  const crown = mesh(geo('gpt-cadet-hat-crown', () => new THREE.SphereGeometry(.235, 18, 8, 0, PI * 2, 0, HP)), mat(C.cream));
  add(g, crown, 0, .115, -.018); crown.scale.set(1, .66, .78);
  const band = add(g, tor(.216, .010, C.brass, null, PI * 2, 4, 24), 0, .115, -.018, HP); band.scale.y = .80;
  add(g, box(.13, .085, .024, C.tealD, .018), 0, .098, .165, -.06);
  add(g, extrude('gpt-cadet-cap-badge', starShape(.040, .019, 6), .012, C.brass), 0, .10, .188, -.06);
  add(g, cyl(.013, .013, .015, C.cream, null, 8), 0, .10, .203, HP);
  for (const x of [-.145, .145]) add(g, sph(.011, C.brass, null, 6, 5), x, .084, .122);
  // Slightly oval in depth, as a soft cadet cap; preserve this transform inside buildItem's root.
  const out = new THREE.Group(); g.scale.z = .85; out.add(g); return out;
}

B.gptwhistlecourse = f => {
  const g = f.group;
  // This short, grounded chute begins just beyond the kennel's cushion. No large floor slab.
  const start = new THREE.Vector3(-.10, .22, -.42), end = new THREE.Vector3(-.375, .20, -.02);
  const path = end.clone().sub(start), flat = new THREE.Vector3(path.x, 0, path.z).normalize();
  const side = new THREE.Vector3(-flat.z, 0, flat.x);
  const a = new THREE.Vector3(start.x, start.y - .127, start.z);
  const b = new THREE.Vector3(end.x, end.y - .127, end.z);
  beam(g, a.toArray(), b.toArray(), .195, .05, C.honey);
  // Rails start a little after the chute mouth, leaving the overall rear edge inside z=-.52.
  for (const sign of [-1, 1]) {
    const aa = a.clone().lerp(b, .13).addScaledVector(side, sign * .108); aa.y += .035;
    const bb = b.clone().addScaledVector(side, sign * .108); bb.y += .035;
    beam(g, aa.toArray(), bb.toArray(), .022, .042, C.edge);
  }
  for (const t of [.12, .62]) {
    const p = a.clone().lerp(b, t);
    add(g, box(.15, p.y - .022, .15, C.cream), p.x, (p.y - .022) / 2, p.z);
  }
  // Big whistle on a little pedestal: a round chamber, mouthpiece, sound slot and neck loop.
  add(g, cyl(.11, .125, .045, C.honey, null, 14), .70, .025, .10);
  add(g, cyl(.042, .052, .32, C.teal, null, 10), .70, .20, .10);
  add(g, cyl(.077, .065, .035, C.brass, null, 12), .70, .365, .10);
  const button = new THREE.Group(); add(g, button, .70, .45, .10);
  add(button, sph(.105, C.brass, null, 14, 10));
  add(button, cyl(.041, .052, .19, C.brass, null, 12), .17, 0, 0, 0, 0, HP);
  add(button, box(.07, .014, .055, C.navy, .004), .12, .046, .015);
  add(button, tor(.052, .012, C.tealD, null, PI * 2, 5, 16), -.015, .125, 0);
  add(button, box(.045, .025, .05, C.brass, .008), -.015, .085, 0);
  // Four adjacent sphere wedges create an actual striped rolling ball without overlapping decals.
  const ball = new THREE.Group(); add(g, ball, start.x, start.y, start.z);
  for (let k = 0; k < 4; k++) add(ball, mesh(geo('gpt-whistle-ball-quarter-' + k,
    () => new THREE.SphereGeometry(.10, 6, 8, k * HP, HP)), mat(k % 2 ? C.orange : C.cream)));

  // A hollow terracotta sleeve conceals the platform; the soil sits well below its rounded rim.
  // Rear-foot hinge tips the whole planter backwards, leaving the cap's foreground pad clear.
  const pot = new THREE.Group(); add(g, pot, -.65, .052, -.105);
  add(g, box(.12, .05, .09, C.tealD, .012), -.65, .025, -.105);
  const potZ = .165;
  const pg = geo('gpt-whistle-planter-wall', () => new THREE.LatheGeometry([
    [.145, 0], [.163, .022], [.187, .30], [.20, .345], [.20, .368],
    [.181, .375], [.171, .352], [.155, .039], [.145, 0],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 18));
  add(pot, mesh(pg, mat(C.clay)), 0, 0, potZ);
  add(pot, tor(.189, .011, '#f598a0', null, PI * 2, 5, 22), 0, .365, potZ, HP);
  add(pot, cyl(.171, .17, .018, C.soil, null, 18), 0, .323, potZ);
  // An oversized bone blossom supplies a deliberately dog-shaped, readable joke.
  rod(pot, [0, .33, potZ], [0, .437, potZ], .015, C.leaf);
  for (const sx of [-1, 1]) {
    const leaf = add(pot, sph(.045, C.leaf, null, 8, 6), sx * .036, .375, potZ, 0, 0, sx * -.5);
    leaf.scale.set(1.2, .42, .5);
  }
  rod(pot, [-.07, .437, potZ], [.07, .437, potZ], .025, C.cream);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(pot, sph(.042, C.cream, null, 10, 6), sx * .075, .437, potZ + sz * .022);
  add(pot, sph(.023, C.brass, null, 8, 6), 0, .437, potZ + .025);
  // The revealed pad is separate from the planter and physically supports the reward.
  const platform = new THREE.Group(); add(g, platform, -.55, .0375, .13);
  const pad = add(platform, cyl(.24, .24, .025, C.honey, null, 18)); pad.scale.z = .82;
  // Two rigid leaves telescope from under the round tray after it is clear of the planter.
  // Their broad final span supports the deliberately oversized cap without scaling its geometry in motion.
  const leftWing = new THREE.Group(), rightWing = new THREE.Group();
  add(platform, leftWing, -.18, -.0235, 0); add(platform, rightWing, .18, -.0235, 0);
  for (const wing of [leftWing, rightWing]) {
    add(wing, box(.40, .018, .36, C.honey, .008));
    add(wing, box(.34, .009, .025, C.edge, .004), 0, .012, .16);
  }
  for (const x of [-.15, .15]) add(g, box(.045, .04, .14, C.tealD, .008), -.55 + x, .022, .13);
  const rollAxis = new THREE.Vector3(path.z, 0, -path.x).normalize(), distance = path.length();
  const p = f.part('lever', [button, ball, pot, platform, leftWing, rightWing], (t, bt, bl, pt, pl, lw, rw) => {
    const press = Math.sin(PI * THREE.MathUtils.clamp(t / .12, 0, 1));
    const roll = ease((t - .12) / .52), tip = ease((t - .64) / .21), rise = ease((t - .85) / .15);
    const prepare = ease((t - .76) / .09);
    const impact = Math.sin(PI * THREE.MathUtils.clamp((t - .64) / .12, 0, 1));
    button.position.y = bt.p.y - .035 * press; button.rotation.z = bt.r.z - .11 * press;
    ball.position.copy(start).lerp(end, roll); ball.position.x += .024 * impact;
    ball.quaternion.setFromAxisAngle(rollAxis, distance * roll / .10);
    pot.rotation.x = pt.r.x - 1.25 * tip;
    // The empty tray clears the pot before revealAt=.85; only then does the large reward appear.
    platform.position.z = pl.p.z + .38 * prepare + .04 * rise;
    platform.position.y = pl.p.y + .035 * rise;
    leftWing.position.x = lw.p.x - .19 * rise; rightWing.position.x = rw.p.x + .19 * rise;
    leftWing.position.y = lw.p.y + .0235 * rise; rightWing.position.y = rw.p.y + .0235 * rise;
  }, { label: '개집 앞 호루라기', sfx: 'whistle', dur: 2.8 });
  const capSpot = f.spot('inside', platform, 0, .0125, 0, { part: p, maxH: .75, scale: 1, label: '화분 밑 명예 순경 모자 받침' });
  f.gptWhistle = { handleAt: [.70, .45, .10], ballStart: start.toArray(), ballEnd: end.toArray(),
    rewardAt: [-.55, .085, .55], rewardScale: 2.4, revealAt: .85, capSpot, part: p,
    phases: { whistle: [0, .12], rolling: [.12, .64], impact: [.64, .85], reward: [.85, 1] },
    chain: ['호루라기 반응', '개집 앞 공 굴러감', '화분 접촉 후 뒤로 기울기', '명예 순경 모자 받침 상승'] };
};

export const GPTWHISTLE_BUILDERS = B;
export const GPTWHISTLE_INFO = {
  gptwhistlecourse: { w: 2, d: 1, name: '호루라기와 뼈다귀 화분 연쇄', price: 0, hidden: true },
};
export const GPTWHISTLE_ITEMS = {
  gptcadethat: { name: '명예 순경 모자', h: .27, build: cadetHat },
};

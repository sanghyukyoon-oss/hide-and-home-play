// New 26판 mechanical hiding places. One Furn part coordinates every stage of each mechanism.
// (gpt2-c 작업장 gptdoghouse-puzzles.js, fix-1022 a83e02b — ① 10/22 그대로 들여옴: GPT 원색, 부품은 우리 f.part 꼴)
// No standalone animation loop: the game's ordinary 0..1 opening tween drives the visible chain.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { put, mat, mesh, geo, cyl, sph, tor } from './kit.js';

const B = {}, PI = Math.PI, HP = PI / 2;
const C = { wood: '#eaa440', edge: '#c67f2a', cream: '#fef2e1', teal: '#47b6a3', tealD: '#2f9386',
  brass: '#feb53d', red: '#ed6670', ink: '#6f4b30', steel: '#4c99da', paper: '#fefde9' };
const ease = t => { const x = THREE.MathUtils.clamp(t, 0, 1); return x * x * (3 - 2 * x); };
function box(w, h, d, c, r = .015) {
  r = Math.min(r, Math.min(w, h, d) * .4);
  return mesh(geo(`gptpuzzlebox|${w}|${h}|${d}|${r}`, () => r > .004
    ? new RoundedBoxGeometry(w, h, d, 1, r) : new THREE.BoxGeometry(w, h, d)), mat(c));
}
function add(g, o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  g.add(put(o, x, y, z, rx, ry, rz)); return o;
}
function rod(g, a, b, r, c, seg = 8) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), v = bv.clone().sub(av);
  const m = cyl(r, r, v.length(), c, null, seg);
  m.position.copy(av.add(bv).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); g.add(m); return m;
}
function gear(c) {
  const teeth = 10, step = PI * 2 / teeth;
  const shape = new THREE.Shape();
  // The root gaps are wider than the opposite tips. At a .405 shaft distance the complete
  // counter-rotating profiles stay clear, including their .004 bevel, throughout one tooth cycle.
  for (let i = 0; i < teeth; i++) for (const [a, r] of [[-.28, .163], [-.13, .221], [.13, .221], [.28, .163]]) {
    const theta = (i + a) * step, x = Math.cos(theta) * r, y = Math.sin(theta) * r;
    i === 0 && a === -.28 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  shape.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, .105, 0, PI * 2, true); shape.holes.push(hole);
  const geoKey = 'gpt-gear-ten-teeth';
  const out = mesh(geo(geoKey, () => {
    const gg = new THREE.ExtrudeGeometry(shape, { depth: .065, bevelEnabled: true,
      bevelThickness: .005, bevelSize: .004, bevelSegments: 1, curveSegments: 12 });
    gg.translate(0, 0, -.0325); return gg;
  }), mat(c));
  const g = new THREE.Group(); g.add(out);
  for (let i = 0; i < 3; i++) add(g, box(.225, .032, .045, c, .006), 0, 0, 0, 0, 0, i * PI / 3);
  add(g, cyl(.047, .047, .09, C.brass, null, 12), 0, 0, .012, HP);
  add(g, sph(.022, C.ink, null, 8, 6), 0, 0, .067);
  return g;
}
function bone(g, x, y, z, len, c, r = .055) {
  rod(g, [x - len / 2 + r, y, z], [x + len / 2 - r, y, z], r * .6, c, 8);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, sph(r, c, null, 10, 6), x + sx * (len / 2 - r * .55), y, z + sz * r * .49);
}

B.gptgearcabinet = f => {
  const g = f.group;
  // A real .58-high lower recess, framed separately from the moving front.
  add(g, box(.94, .075, .64, C.wood, .025), 0, .055, .015);
  for (const x of [-.425, .425]) add(g, box(.065, .64, .60, C.wood), x, .405, 0);
  add(g, box(.80, .055, .60, C.edge), 0, .72, 0);
  add(g, box(.80, .60, .035, C.tealD), 0, .405, -.282);
  add(g, box(.79, .025, .54, C.cream, .006), 0, .108, .01);
  // Upper mechanism board is a shaped piece of furniture, with exposed shafts and teeth.
  add(g, box(.94, .58, .075, C.cream, .03), 0, 1.005, -.245);
  for (const x of [-.43, .43]) add(g, box(.045, .59, .095, C.wood), x, 1.005, -.235);
  add(g, box(.96, .045, .10, C.wood), 0, 1.315, -.235);
  for (const x of [-.2025, .2025]) {
    add(g, cyl(.024, .024, .50, C.steel, null, 10), x, 1.025, .025, HP);
    add(g, cyl(.058, .058, .035, C.tealD, null, 12), x, 1.025, -.185, HP);
  }
  const left = gear(C.teal), right = gear(C.brass);
  add(g, left, -.2025, 1.025, .30);
  add(g, right, .2025, 1.025, .30, 0, 0, PI / 10);
  // Red hand crank attaches physically to the brass gear's hub and travels with it.
  add(right, box(.19, .055, .045, C.red, .015), .075, 0, .088);
  add(right, cyl(.023, .023, .09, C.brass, null, 10), .16, 0, .136, HP);
  add(right, cyl(.036, .036, .08, C.red, null, 10), .16, 0, .183, HP);
  // Wood panel slides to the left along an exposed rack; keep its left side clear in a layout.
  const panel = new THREE.Group(); add(g, panel, 0, .401, .335);
  add(panel, box(.79, .585, .055, C.wood, .018), 0, 0, 0);
  for (const x of [-.25, .25]) add(panel, box(.025, .53, .012, C.edge, .003), x, 0, .039);
  for (const y of [-.21, .21]) add(panel, box(.76, .035, .026, C.edge, .005), 0, y, .045);
  bone(panel, 0, 0, .054, .28, C.cream, .032);
  add(panel, box(.79, .035, .065, C.brass, .005), 0, .336, -.035);
  for (let i = 0; i < 12; i++) add(panel, box(.031, .04, .055, C.brass, .003), -.355 + i * .064, .37, -.035);
  // Front bearing rollers remain fixed. The lower one sits below the door's travel edge.
  for (const x of [-.43, .43]) for (const y of [.105, .755]) add(g, cyl(.028, .028, .055, C.tealD, null, 10), x, y, .365, HP);
  const p = f.part('drawer', [left, right, panel], (t, a, b, c) => {
    const drive = ease(t);
    left.rotation.z = a.r.z + PI * 2.5 * drive;
    right.rotation.z = b.r.z - PI * 2.5 * drive;
    panel.position.x = c.p.x - .80 * ease((t - .18) / .82);
  }, { label: '크랭크 톱니 비밀장', sfx: 'open', dur: 1.15 });
  f.spot('inside', null, .06, .126, .045, { part: p, maxH: .50, scale: .95, label: '톱니 장치 뒤 비밀칸' });
  f.gptMechanism = { input: '빨간 크랭크', chain: ['크랭크 회전', '두 톱니 역회전', '랙과 목재 판 이동', '비밀칸 공개'] };
};

B.gptweightbench = f => {
  const g = f.group;
  // Low cabinet with an open, cat-sized cavity. Its side cheeks carry the balance above.
  add(g, box(.94, .075, .64, C.wood, .025), 0, .055, 0);
  for (const x of [-.425, .425]) add(g, box(.065, .645, .60, C.wood), x, .4225, 0);
  add(g, box(.80, .045, .60, C.tealD), 0, .7675, 0);
  add(g, box(.80, .61, .035, C.cream), 0, .4225, -.282);
  // A triangular fulcrum and a brass pin make the seesaw pivot easy to understand.
  const tri = new THREE.Shape(); tri.moveTo(-.12, 0); tri.lineTo(.12, 0); tri.lineTo(0, .10); tri.closePath();
  const pivot = mesh(geo('gpt-scale-fulcrum', () => new THREE.ExtrudeGeometry(tri, { depth: .15, bevelEnabled: false })), mat(C.teal));
  add(g, pivot, 0, .79, -.20);
  add(g, cyl(.037, .037, .24, C.brass, null, 12), 0, .87, -.135, HP);
  const beam = new THREE.Group(); add(g, beam, 0, .87, -.135, 0, 0, .08);
  // White dog-bone beam; two fixed dumbbell bones on its left serve as a comic counterweight.
  bone(beam, 0, 0, 0, .76, C.cream, .065);
  for (const [x, z] of [[-.25, -.045], [-.25, .07]]) {
    bone(beam, x, .065, z, .19, C.brass, .038);
    for (const sx of [-1, 1]) add(beam, cyl(.040, .040, .035, C.tealD, null, 10), x + sx * .065, .065, z, 0, 0, HP);
  }
  add(beam, box(.13, .025, .17, C.teal, .01), .27, .052, 0);
  // Bent pickup arm reaches from the bone beam to the front brass connecting rod.
  rod(beam, [-.285, -.045, 0], [-.285, -.045, .39], .014, C.brass);
  add(beam, sph(.024, C.brass, null, 8, 6), -.285, -.045, .39);
  // Big red lever on the right, separated in depth from the seesaw's moving bone.
  add(g, box(.10, .095, .12, C.teal, .015), .36, .79, .19);
  const lever = new THREE.Group(); add(g, lever, .36, .805, .19);
  // Front-right placement projects lower than the back bone; this tall control stays readable at the phone start view.
  add(lever, cyl(.022, .022, .62, C.brass, null, 8), 0, .31, 0);
  add(lever, sph(.062, C.red, null, 12, 8), 0, .64, 0);
  add(g, cyl(.027, .027, .13, C.brass, null, 10), .36, .805, .19, 0, 0, HP);
  // The bright linkage is anchored to the balance and reaches down to the sliding tray's front.
  // Its y-scale follows the beam, then the tray comes out: A lever -> B seesaw -> C hidden drawer.
  const link = new THREE.Group(); add(g, link, -.285, .66, .255);
  add(link, box(.025, .25, .025, C.brass, .006), 0, 0, 0);
  add(link, sph(.025, C.brass, null, 8, 6), 0, -.125, 0);
  const tray = new THREE.Group(); add(g, tray, 0, .135, .005);
  add(tray, box(.745, .025, .53, C.cream, .008), 0, 0, 0);
  for (const x of [-.36, .36]) add(tray, box(.025, .105, .53, C.cream, .006), x, .065, 0);
  add(tray, box(.72, .105, .025, C.cream, .006), 0, .065, -.255);
  add(tray, box(.79, .60, .055, C.teal, .02), 0, .28, .325);
  add(tray, box(.22, .045, .035, C.brass, .012), 0, .30, .373);
  // A brass connecting tongue emerges with the tray, making the transmission visible.
  add(tray, box(.032, .04, .42, C.brass, .006), -.285, .40, .10);
  const p = f.part('drawer', [lever, beam, link, tray], (t, a, b, c, d) => {
    const push = ease(t / .48), slide = ease((t - .32) / .68);
    lever.rotation.x = a.r.x + .72 * push;
    beam.rotation.z = b.r.z - .28 * push;
    link.position.y = c.p.y + .074 * push;
    link.scale.y = c.s.y * (1 + .14 * push);
    tray.position.z = d.p.z + .55 * slide;
  }, { label: '뼈다귀 저울 비밀 서랍', sfx: 'open', dur: 1.1 });
  f.spot('inside', tray, 0, .018, .035, { part: p, maxH: .55, scale: .95, label: '뼈다귀 저울 아래 비밀 서랍' });
  f.gptMechanism = { input: '빨간 저울 레버', chain: ['레버 누름', '뼈다귀 시소 기울기', '황동 연결대 당김', '비밀 서랍 인출'] };
};

export const GPTPUZZLE_BUILDERS = B;
export const GPTPUZZLE_INFO = {
  gptgearcabinet: { w: 1, d: 1, name: '크랭크 톱니 비밀장', price: 0, hidden: true },
  gptweightbench: { w: 1, d: 1, name: '뼈다귀 저울 비밀 서랍', price: 0, hidden: true },
};

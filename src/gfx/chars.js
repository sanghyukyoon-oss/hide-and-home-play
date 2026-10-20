// 몽글몽글 mochi characters: squishy body, glossy eyes, blush, tiny limbs, sticker outline.
// Everyone is the same mochi base + parts, so new personalities stay in the family. A CHAR_DEFS entry picks:
//   ear       flop | bunny | bear | cat | peng | mom (the original six) | none | shiba | kitty | squirrel | hamster | panda | frog | spiky
//   look      { lids: { cover, tilt }, brows: 'grumpy', mouth: 'frown'|'smirk'|'smile'|'wide'|'teeth'|'o', eyes: 'sleep', bubble }
//   pattern   [[color, [lon, lat, ra, rb, rot], ...], ...]   flat colour patches hugging the body (belly, mask, eye patches, stripes, spots)
//   acc       cap | beanie | hairband | bow | glasses | sunglasses | scarf | bandaid | nightcap | headphones | mortarboard   (name or [name, opts])
//   tail      curl | fluffy | short | cat              prop   skateboard (under the feet) | book | lollipop | seed (held)
//   idlePose  cross | hold | ride (arms while pose === 'idle')     idle  personality idle     react  reaction set     glide  roam on wheels
//   shape     can | mug | cone | cube | tv | sundae | carton | toast | onigiri | pot — object characters: a plain geometric body, face on its front panel
//   eyeC      iris colour (or [right, left]) for coloured eyes   eyeInk / faceInk  light ink for eyes / mouth on dark coats   earSide  [right, left] ear colours
//   whisk     whiskers   tailC  tail colour   acc also: bell | bowtie   prop also: fish
//   v2 look knobs (art test 2026-10-16, all optional): faceF { ex, ey, my, by, bx, bly, s } overrides the face layout,
//   squish [wide, tall] reshapes the mochi body, gloss adds a soft vinyl-toy highlight, bodyO { rough, rim } the body material
// Faces (setFace): normal | happy | wow | sad | angry | sus | dizzy | sweat — every one a different eye + mouth shape so it reads at phone size.
// Every face is the same sticker kit laid on the body surface (buildFace); parts and personality looks only apply to entries with face2.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { sph, cap, cone, tor, put, grp, mat, mesh, geo, blobShadow, rbox, cyl, extrude, heartShape, starShape, shade, STYLE } from './kit.js';
import { ease } from '../util.js';
import { ART } from './style.js';

function mochiGeo() {
  return geo('mochi', () => {
    const g = new THREE.SphereGeometry(0.5, 44, 32);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (y < 0) { const k = -y / 0.5; y *= 0.6; x *= 1 + 0.07 * k; z *= 1 + 0.07 * k; }
      else { const k = y / 0.5; x *= 1 - 0.04 * k; z *= 1 - 0.04 * k; }
      p.setXYZ(i, x, y + 0.3, z);
    }
    g.computeVertexNormals();
    return g;
  });
}

// ── body-hugging geometry: the same squash as mochiGeo, so patches, caps, shells and mouths sit snug on the body
const Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
function deform(v) {
  let { x, y, z } = v;
  if (y < 0) { const k = -y / .5; y *= .6; x *= 1 + .07 * k; z *= 1 + .07 * k; }
  else { const k = y / .5; x *= 1 - .04 * k; z *= 1 - .04 * k; }
  return v.set(x, y + .3, z);
}
// lon: around the body (0 = front, + = the character's left); lat: up from the widest line
const dirOf = (lon, lat, out = new THREE.Vector3()) => out.set(Math.sin(lon) * Math.cos(lat), Math.sin(lat), Math.cos(lon) * Math.cos(lat));
const surf = (lon, lat, lift = 0) => deform(dirOf(lon, lat).multiplyScalar(.5 * (1 + lift)));
function normalAt(lon, lat) { const n = dirOf(lon, lat); if (n.y < 0) n.y /= .6; return n.normalize(); }
// stick an object onto the body surface, +z along the surface normal
function onBody(o, lon, lat, lift = 0, spin = 0) {
  o.position.copy(surf(lon, lat, lift));
  o.quaternion.setFromUnitVectors(Z, normalAt(lon, lat));
  if (spin) o.rotateZ(spin);
  return o;
}
function conform(g, scale = 1) {
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { deform(v.fromBufferAttribute(p, i).multiplyScalar(scale)); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  return g;
}
// elliptic patch on the body: [lon, lat, ra, rb, rot] in radians (ra across, rb up)
function patchGeo([lon, lat, ra, rb, rot = 0], lift) {
  const big = Math.max(ra, rb), RINGS = Math.max(6, Math.ceil(big / .07)), SEG = Math.max(28, Math.ceil(Math.PI * 2 * big / .06)), C = dirOf(lon, lat), E = new THREE.Vector3(Math.cos(lon), 0, -Math.sin(lon)), N = new THREE.Vector3().crossVectors(C, E);
  const pos = [], idx = [], d = new THREE.Vector3(), T = new THREE.Vector3(), cr = Math.cos(rot), sr = Math.sin(rot);
  const pt = (u, v) => {
    const uu = u * cr - v * sr, vv = u * sr + v * cr, th = Math.hypot(uu, vv);
    if (th < 1e-6) d.copy(C); else { T.copy(E).multiplyScalar(uu / th).addScaledVector(N, vv / th); d.copy(C).multiplyScalar(Math.cos(th)).addScaledVector(T, Math.sin(th)); }
    deform(d.multiplyScalar(.5 * (1 + lift))); pos.push(d.x, d.y, d.z);
  };
  pt(0, 0);
  for (let r = 1; r <= RINGS; r++) for (let s = 0; s < SEG; s++) { const a = s / SEG * Math.PI * 2, f = r / RINGS; pt(Math.cos(a) * ra * f, Math.sin(a) * rb * f); }
  for (let s = 0; s < SEG; s++) idx.push(0, 1 + s, 1 + (s + 1) % SEG);
  for (let r = 1; r < RINGS; r++) for (let s = 0; s < SEG; s++) {
    const a = 1 + (r - 1) * SEG + s, b = 1 + (r - 1) * SEG + (s + 1) % SEG;
    idx.push(a, a + SEG, b + SEG, a, b + SEG, b);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function patchMesh(color, list, lift = .012) {
  return mesh(geo('pt|' + lift + '|' + JSON.stringify(list), () => mergeGeometries(list.map(p => patchGeo(p, lift)))), mat(color, { rough: .62 }));
}
// a chunky ink stroke drawn on the body through [lon, lat] points (mouths), with round ends
function inkLine(key, pts, r = .015, color = '#2a1d33') {
  return mesh(geo('ln|' + key, () => {
    const P = pts.map(([lo, la]) => surf(lo, la, .01));
    const parts = [new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), 28, r, 6, false)];
    for (const e of [P[0], P[P.length - 1]]) parts.push(new THREE.SphereGeometry(r, 8, 6).translate(e.x, e.y, e.z));
    return mergeGeometries(parts);
  }), mat(color, { rim: 0 }));
}
const arcLL = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
// a soft tube through points whose radius follows rf(t), t = 0..1 (tails); ends taper closed
function plumeGeo(key, pts, rf, seg = 30, rad = 12) {
  return geo('pl|' + key, () => {
    const curve = new THREE.CatmullRomCurve3(pts.map(q => new THREE.Vector3(...q)));
    const g = new THREE.TubeGeometry(curve, seg, 1, rad, false), p = g.attributes.position, c = new THREE.Vector3(), v = new THREE.Vector3();
    for (let i = 0; i <= seg; i++) {
      curve.getPointAt(i / seg, c); const r = rf(i / seg);
      for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; v.fromBufferAttribute(p, k).sub(c).multiplyScalar(r).add(c); p.setXYZ(k, v.x, v.y, v.z); }
    }
    g.computeVertexNormals();
    return g;
  });
}
const roundEnds = (t, k = .5) => Math.pow(Math.max(0, Math.sin(Math.PI * t)), k);
// a solid of revolution from [radius, y] points, bottom to top (object bodies)
function latheGeo(key, prof, seg = 40) { return geo('la|' + key, () => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg)); }
// a cap of the body sphere (hair, hats), tilted back by tilt, hugging the squashed body
function shellGeo(theta, tilt, scale) {
  return geo(`sh|${theta}|${tilt}|${scale}`, () => {
    const g = new THREE.SphereGeometry(.5, 36, 14, 0, Math.PI * 2, 0, theta);
    g.rotateX(tilt);
    return conform(g, scale);
  });
}
// hedgehog: a shell over the crown and back, with chunky spikes leaning backwards (one mesh)
function spikyGeo() {
  return geo('chr-spiky', () => {
    const parts = [shellGeo(Math.PI * .47, -.55, 1.06).clone()];
    const spots = [[0, 1.42, .23], [.95, 1.12, .21], [-.95, 1.12, .21], [Math.PI, 1.15, .22],
      [.42, .86, .19], [-.42, .86, .19], [1.35, .8, .21], [-1.35, .8, .21], [2.15, .82, .22], [-2.15, .82, .22], [Math.PI, .7, .23],
      [1.62, .32, .2], [-1.62, .32, .2], [2.3, .35, .22], [-2.3, .35, .22], [2.85, .3, .22], [-2.85, .3, .22],
      [2.05, -.12, .17], [-2.05, -.12, .17], [2.65, -.15, .18], [-2.65, -.15, .18], [Math.PI, -.12, .18]];
    const q = new THREE.Quaternion();
    for (const [lon, lat, h] of spots) {
      const c = new THREE.ConeGeometry(.088, h, 10, 1);
      c.translate(0, h / 2 - .02, 0);
      c.applyQuaternion(q.setFromUnitVectors(Y, normalAt(lon, lat).add(new THREE.Vector3(0, .15, -.5)).normalize()));
      const p = surf(lon, lat, .05); c.translate(p.x, p.y, p.z);
      parts.push(c);
    }
    return mergeGeometries(parts);
  });
}
// skateboard deck: a rounded board seen from above (stadium), kicked up at both tails
function deckGeo() {
  return geo('chr-deck', () => {
    const L = .68, W = .17, pts = [];
    for (let i = 0; i <= 16; i++) pts.push([-L + W + 2 * (L - W) * i / 16, -W]);
    for (let i = 1; i < 12; i++) { const a = -Math.PI / 2 + Math.PI * i / 12; pts.push([L - W + Math.cos(a) * W, Math.sin(a) * W]); }
    for (let i = 0; i <= 16; i++) pts.push([L - W - 2 * (L - W) * i / 16, W]);
    for (let i = 1; i < 12; i++) { const a = Math.PI / 2 + Math.PI * i / 12; pts.push([-L + W + Math.cos(a) * W, Math.sin(a) * W]); }
    const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
    const g = new THREE.ExtrudeGeometry(s, { depth: .035, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2, curveSegments: 4 });
    g.rotateX(-Math.PI / 2); g.translate(0, -.0175, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setY(i, p.getY(i) + Math.max(0, Math.abs(x) - .4) ** 2 * 1.5); }
    g.computeVertexNormals();
    return g;
  });
}
// a cone bent over to one side (+x): nightcap. Base at the origin, length h, total bend in radians.
function bentConeGeo(r, h, bend) {
  return geo(`bc|${r}|${h}|${bend}`, () => {
    const g = new THREE.CylinderGeometry(.015, r, h, 22, 14).translate(0, h / 2, 0), p = g.attributes.position, R = h / bend;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), th = y / R; p.setXYZ(i, R - (R - x) * Math.cos(th), (R - x) * Math.sin(th), p.getZ(i)); }
    g.computeVertexNormals();
    return g;
  });
}

// ── face kit. Every face part is a thin sticker (or a glossy bead) laid flat on the surface at face coordinates
// (x across, y up from the eye line), so expressions read from the iso camera that looks down on everyone. On mochi
// bodies the eye line sits a little above the widest line (FACE_LAT), turned up toward that camera.
const FACE_LAT = .26;
const _ax = new THREE.Vector3(), _ay = new THREE.Vector3(), _am = new THREE.Matrix4();
// orient a holder at p: +z along the surface normal n, +y up the surface (no roll, so mirrored parts stay mirrored)
function frameAt(h, p, n) {
  _ax.crossVectors(Y, n); if (_ax.lengthSq() < 1e-6) _ax.set(1, 0, 0); _ax.normalize();
  _ay.crossVectors(n, _ax).normalize();
  h.position.copy(p); h.quaternion.setFromRotationMatrix(_am.makeBasis(_ax, _ay, n));
  return h;
}
const faceLL = (x, y) => { const lat = FACE_LAT + y / .5; return [x / (.5 * Math.cos(lat)), lat]; };
const ellShape = (rx, ry, x = 0, y = 0) => { const s = new THREE.Shape(); s.absellipse(x, y, rx, ry, 0, Math.PI * 2, false, 0); return s; };
// a stroke with round ends
const lineShapes = (pts, w) => [strokeShape(pts, w), dotShape(pts[0][0], pts[0][1], w), dotShape(pts[pts.length - 1][0], pts[pts.length - 1][1], w)];
const spiralPts = (r0, r1, turns, n) => Array.from({ length: n + 1 }, (_, i) => { const k = i / n, a = k * turns * Math.PI * 2, r = r0 + (r1 - r0) * k; return [Math.cos(a) * r, Math.sin(a) * r]; });
function dropShape(r) {
  const s = new THREE.Shape(); s.moveTo(0, r * 2.2);
  s.quadraticCurveTo(r * .95, r * .75, r, 0); s.absarc(0, 0, r, 0, Math.PI, true); s.quadraticCurveTo(-r * .95, r * .75, 0, r * 2.2);
  return s;
}
// a sticker: a 2D shape extruded a hair thick (no bevel: cheap, and crisp at phone size)
function decal(key, make, color, o = {}) {
  return mesh(geo('dc|' + key, () => new THREE.ExtrudeGeometry(make(), { depth: .006, bevelEnabled: false, curveSegments: 10 })), mat(color, { rim: 0, rough: .5, ...o }), { cast: false });
}
// a glossy eye: an ink (or coloured iris + ink pupil) bead with one big and one small catch-light
const SHINE = { rim: 0, emissive: '#ffffff', ei: .9 };
// pk: pupil size (1 = the usual ring of iris round it; bigger reads softer and cuter on a coloured or white eye)
function eyeBead(r, iris, pk = 1) {
  const g = grp(put(sph(r, iris || INK, { rough: .2, rim: 0 }, 18, 14), 0, 0, 0, 0, 0, 0, [.92, 1.2, .42]));
  if (iris) g.add(put(sph(r, INK, { rough: .2, rim: 0 }, 16, 12), 0, -r * .05 * pk, r * .1, 0, 0, 0, [.56 * pk, .84 * pk, .42]));
  g.add(put(sph(r * .4, '#ffffff', SHINE, 12, 10), -r * .34, r * .5, r * .34, 0, 0, 0, [1, 1, .5]));
  g.add(put(sph(r * .2, '#ffffff', SHINE, 8, 6), r * .36, -r * .48, r * .33, 0, 0, 0, [1, 1, .5]));
  return g;
}
// a rounded polygon (corners = circles of radius R round the points, counter-clockwise): onigiri
function roundPolyShape(C, R, n = 10) {
  const s = new THREE.Shape(), N = C.length, pts = [];
  for (let i = 0; i < N; i++) {
    const p = C[(i + N - 1) % N], c = C[i], q = C[(i + 1) % N];
    const a0 = Math.atan2(-(c[0] - p[0]), c[1] - p[1]); let a1 = Math.atan2(-(q[0] - c[0]), q[1] - c[1]);
    while (a1 < a0) a1 += Math.PI * 2;
    for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R]); }
  }
  pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
  return s;
}
// what each expression shows: eyes open | half | closed (^^) | spin (@@); es = eye scale; which mouth; brows; extras
const FACE_SET = {
  normal: { eyes: 'open', mouth: 'w' },
  happy: { eyes: 'closed', mouth: 'D', blush: 'hot' },
  wow: { eyes: 'open', es: 1.22, mouth: 'O', brows: 'up' },
  sad: { eyes: 'open', es: 1.08, mouth: 'frown', brows: 'worry', tears: true, ear: .55 },
  angry: { eyes: 'open', es: .92, mouth: 'frown', brows: 'angry', blush: 'red', ear: -.12 },
  sus: { eyes: 'half', mouth: 'flat', brows: 'sus', ear: .12 },
  dizzy: { eyes: 'spin', mouth: 'wavy', ear: .35 },
  sweat: { eyes: 'open', mouth: 'wavy', brows: 'worry', sweat: true, ear: .22 },
};
// brow [tilt of the brow on the character's left (sx = 1), lift]; the other one mirrors
const BROW = { up: [-.08, .045], angry: [.5, -.016], worry: [-.42, .012], calm: [-.1, .02], grumpy: [.42, -.006] };

// ── little 2D shapes for reaction effects (extruded, chunky, ink-outlined like everything else)
function strokeShape(pts, w) {
  const L = [], R = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    L.push([p[0] - ty * w, p[1] + tx * w]); R.push([p[0] + ty * w, p[1] - tx * w]);
  });
  const s = new THREE.Shape(); s.moveTo(...L[0]); L.slice(1).forEach(q => s.lineTo(...q)); R.reverse().forEach(q => s.lineTo(...q)); s.closePath();
  return s;
}
const arcPts = (cx, cy, r, a0, a1, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const dotShape = (x, y, r) => { const s = new THREE.Shape(); s.absarc(x, y, r, 0, Math.PI * 2, false); return s; };
function zShape(k = .1) {
  const s = new THREE.Shape(), P = [[-1, 1], [1, 1], [1, .62], [-.42, -.62], [1, -.62], [1, -1], [-1, -1], [-1, -.62], [.42, .62], [-1, .62]];
  P.forEach(([x, y], i) => i ? s.lineTo(x * k, y * k) : s.moveTo(x * k, y * k)); s.closePath();
  return s;
}
function ext(key, shapes, depth, color, bevel = .008) {
  return mesh(geo('ex2|' + key, () => {
    const g = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 10 });
    g.center(); return g;
  }), mat(color));
}
const FX = {
  heart: () => extrude('chr-heart', heartShape(.1), .045, '#ff6f91'),
  star: () => extrude('chr-star', starShape(.12, .055), .045, '#ffd23f'),
  sparkle: () => extrude('chr-sparkle', starShape(.12, .035, 4), .04, '#fff3a0'),
  anger: () => ext('chr-anger', [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([qx, qy]) => { const a = Math.atan2(-qy, -qx); return strokeShape(arcPts(qx * .075, qy * .075, .055, a - .8, a + .8, 8), .02); }), .04, '#ff4f66'),
  excl: () => ext('chr-excl', [strokeShape([[0, .02], [0, .13]], .03), dotShape(0, -.05, .034)], .045, '#ff5d6c'),
  ques: () => ext('chr-ques', [strokeShape(arcPts(0, .08, .055, 2.7, -1.5, 12).concat([[0, -.005]]), .026), dotShape(0, -.065, .03)], .045, '#8a74ff'),
  z: () => ext('chr-z', zShape(.09), .04, '#8f9dff', .006),
  note: () => ext('chr-note', [dotShape(-.04, -.07, .045), strokeShape([[0, -.07], [0, .1]], .018), strokeShape([[0, .1], [.07, .06], [.07, .01]], .018)], .04, '#7c6cff'),
  puff: () => sph(.09, '#ffffff', null, 14, 10),
  drop: () => grp(put(sph(.05, '#8fd3ff', null, 12, 10), 0, 0, 0, 0, 0, 0, [.8, 1.25, .8])),
};

// ── the cast. The first six are the originals (unchanged); the rest are built from parts.
const P = (lon, lat, ra, rb, rot = 0) => [lon, lat, ra, rb, rot];
export const CHAR_DEFS = {
  mong: { name: '몽글이', body: '#fff6ee', ear: 'flop', earC: '#ffcfae', scale: .62 },
  bunny: { name: '토순이', body: '#ffe6f0', ear: 'bunny', earC: '#ffb3cd', scale: .6 },
  bear: { name: '곰돌이', body: '#e9bf94', ear: 'bear', earC: '#c98a52', scale: .62 },
  cat: { name: '냥냥이', body: '#ffd9a3', ear: 'cat', earC: '#ffb26b', scale: .6 },
  peng: { name: '펭펭이', body: '#6f7fb3', ear: 'peng', earC: '#ffffff', scale: .62 },
  mom: { name: '엄마', body: '#ffd3e6', ear: 'mom', earC: '#9a6248', scale: .95 },
  // hedgehog: prickly outside, soft inside
  grumpy: { name: '삐딱이', body: '#f8e2c6', ear: 'spiky', earC: '#8b5a4a', limbC: '#e6b48a', scale: .6, tilt: .1, nose: '#4a2c35',
    look: { lids: { cover: .55, tilt: .3 }, brows: 'grumpy', mouth: 'frown' }, acc: ['bandaid'], idlePose: 'cross', idle: 'grumpy', react: 'grumpy' },
  skater: { name: '보드킹', body: '#bfe4ff', ear: 'none', scale: .6, look: { mouth: 'smirk' },
    acc: [['cap', { back: true, color: '#ff5d6c', tilt: .22 }]], prop: 'skateboard', idlePose: 'ride', idle: 'skate', glide: true, react: 'skater' },
  sleepy: { name: '졸졸이', body: '#e6ddff', ear: 'none', scale: .6, look: { eyes: 'sleep', mouth: 'o', bubble: true },
    acc: [['nightcap', { color: '#7f8ff2' }]], idle: 'sleepy', react: 'sleepy' },
  nerd: { name: '박사', body: '#fff1b0', ear: 'none', scale: .6, acc: ['mortarboard', 'glasses'], prop: 'book', idlePose: 'hold', idle: 'nerd', react: 'nerd' },
  shiba: { name: '멍뭉이', body: '#f6a660', ear: 'shiba', earC: '#fff1dc', limbC: '#fff1dc', scale: .6, nose: '#3a2430', tail: 'curl', twitch: true,
    pattern: [['#fff1dc', P(.3, .02, .36, .22, -.25), P(-.3, .02, .36, .22, .25), P(0, -.62, .55, .4), P(.3, .57, .07, .052), P(-.3, .57, .07, .052)]], idle: 'wag', react: 'shiba' },
  hamster: { name: '햄찌', body: '#f5bf7a', ear: 'hamster', earC: '#ff9fb4', scale: .56, nose: '#ff8fa8', look: { mouth: 'teeth' }, cheeks: '#fff4e6',
    pattern: [['#fff6ea', P(0, -.3, 1.3, .44)]], prop: 'seed', idlePose: 'hold', twitch: true, idle: 'nibble', react: 'hamster' },
  frog: { name: '개굴이', body: '#93d86e', ear: 'frog', scale: .6, eyeAt: [.2, .852, .172], look: { mouth: 'wide' }, tongue: true,
    pattern: [['#e9f7b8', P(0, -.6, .62, .38)], ['#6cbf4f', P(.55, .95, .1, .085), P(-.3, 1.15, .085, .075), P(1.25, .55, .1, .085), P(-1.2, .6, .09, .08), P(2.4, .5, .1, .09)]], idle: 'frog', react: 'frog' },
  raccoon: { name: '너굴이', body: '#b8b2c6', ear: 'panda', earC: '#4a4458', limbC: '#4a4458', scale: .62, nose: '#2f2a36', tail: 'fluffy', twitch: true, eyeC: '#ffffff', eyeInk: '#fff4fb',
    pattern: [['#f6f3fa', P(0, .0, .52, .2), P(.3, .53, .14, .06, -.2), P(-.3, .53, .14, .06, .2)], ['#4a4458', P(.31, .27, .25, .19, -.25), P(-.31, .27, .25, .19, .25)]],
    look: { mouth: 'smile' }, idle: 'panda', react: 'raccoon' },
  panda: { name: '판다', body: '#fdfbf7', ear: 'panda', earC: '#2f2a36', limbC: '#2f2a36', scale: .64, nose: '#2f2a36', eyeC: '#ffffff', eyeInk: '#fff4fb',
    pattern: [['#2f2a36', P(.33, .25, .25, .2, -.5), P(-.33, .25, .25, .2, .5)]], tail: 'short', idle: 'panda', react: 'panda' },
  coolcat: { name: '쿨냥', body: '#a7aed3', ear: 'kitty', earC: '#ffb6c8', scale: .6, nose: '#ff8fa8', look: { mouth: 'smirk' }, tail: 'cat', twitch: true,
    pattern: [['#ffffff', P(.1, .02, .15, .1), P(-.1, .02, .15, .1), P(0, -.62, .45, .34)], ['#8790bd', P(0, .72, .05, .14), P(.22, .68, .045, .12, -.3), P(-.22, .68, .045, .12, .3)]],
    acc: ['sunglasses'], idle: 'cool', react: 'coolcat' },
  squirrel: { name: '다람이', body: '#e3a06e', ear: 'squirrel', earC: '#ffd9c2', scale: .58, nose: '#5a3440', tail: 'fluffy', twitch: true,
    pattern: [['#fff0dc', P(0, -.45, .6, .42), P(.32, .04, .3, .2, -.2), P(-.32, .04, .3, .2, .2)]],
    acc: [['hairband', { color: '#ff7fae', bow: true, side: 0 }]], prop: 'lollipop', idle: 'squirrel', react: 'squirrel' },
  // 말썽이 (2026-10-17): the prankster who barges into a stage, grabs something you haven't found yet and hides it
  // somewhere else — catch it on the run and you get the thing back at once
  trickster: { name: '말썽이', body: '#b9a2ff', ear: 'squirrel', earC: '#ffe0f2', scale: .52, nose: '#4a3266', tail: 'fluffy', twitch: true,
    pattern: [['#fff4fb', P(0, -.45, .6, .42), P(.32, .04, .3, .2, -.2), P(-.32, .04, .3, .2, .2)]],
    acc: [['cap', { back: true, color: '#ffcf3c', tilt: .3 }]], look: { mouth: 'smile' }, idle: 'squirrel', react: 'squirrel' },
  // 먹물이 (2026-10-17, user: "빌런느낌의 검정색 캐릭터. 귀엽게 생기긴하게"): the colour thief of the 흑백판 — an ink-black mochi
  // with kitty ears, a purple scarf and a smirk. It hands you a pair of "special shades" and dares you to find everything.
  // 10/18: the colour spots are gone and the pink-ringed eyes became big white eyes with big pupils (user: "동그라미들 너무
  // 많으니까 빼고 눈만 좀더 이쁘게… 징그러워", picked draft A 흰 눈)
  inky: { name: '먹물이', body: '#2e2838', ear: 'kitty', earC: '#b98cff', scale: .58, nose: '#ff8fb0', eyeC: '#ffffff', pupil: 1.32, eyeInk: '#ffe3ee', faceInk: '#ffe3ee', blushC: '#ff7fa8',
    tail: 'cat', tailC: '#2e2838', twitch: true, faceF: { ex: .18, s: 1.18 },
    acc: [['scarf', { color: '#8a5cf0' }]], look: { mouth: 'smirk' }, idle: 'cool', react: 'kkamang' },   // it hands the shades out rather than wearing them
  dj: { name: '둠칫이', body: '#b9ecd8', ear: 'none', scale: .6, look: { mouth: 'smile' }, acc: [['headphones', { color: '#ff6f91' }]], idle: 'groove', react: 'dj' },
  snowy: { name: '눈송이', body: '#f3f7ff', ear: 'none', scale: .6, carrot: '#ff8a3d', look: { mouth: 'smile' },
    acc: [['beanie', { color: '#ff5d6c', band: '#e8445a', pom: '#ffffff' }], ['scarf', { color: '#3fbf9f' }]], idle: 'sway', react: 'snowy' },
  // the cat gang: one kitty base, told apart by coat, eyes and one thing each
  cheese: { name: '치즈냥', body: '#ffa449', ear: 'kitty', earC: '#ffc2cf', limbC: '#fff3e0', scale: .6, nose: '#ff7f9c', tail: 'cat', tailC: '#f08a2c', whisk: true, twitch: true,
    pattern: [['#fff3e0', P(.1, .02, .16, .1), P(-.1, .02, .16, .1), P(0, -.6, .5, .36)],
      ['#e8781f', P(0, .74, .055, .16), P(.24, .7, .05, .14, -.3), P(-.24, .7, .05, .14, .3), P(1.3, .25, .07, .27), P(-1.3, .25, .07, .27), P(1.9, .3, .075, .3), P(-1.9, .3, .075, .3), P(2.55, .38, .075, .3), P(-2.55, .38, .075, .3), P(Math.PI, .5, .08, .28)]],
    prop: 'fish', idlePose: 'hold', idle: 'cat', react: 'cheese' },
  godeung: { name: '고등어', body: '#aab2c1', ear: 'kitty', earC: '#ffc2cf', limbC: '#f4f6fa', scale: .6, nose: '#ff8fa8', tail: 'cat', tailC: '#7d8698', whisk: true, twitch: true,
    pattern: [['#f4f6fa', P(.1, .02, .16, .1), P(-.1, .02, .16, .1), P(0, -.55, .55, .4)],
      ['#6b7487', P(0, .74, .05, .17), P(.16, .73, .045, .15, -.15), P(-.16, .73, .045, .15, .15), P(.32, .66, .04, .12, -.4), P(-.32, .66, .04, .12, .4),
        P(.95, .2, .05, .16, .5), P(-.95, .2, .05, .16, -.5), P(1.45, .3, .07, .3), P(-1.45, .3, .07, .3), P(2.05, .35, .07, .32), P(-2.05, .35, .07, .32), P(2.65, .4, .07, .32), P(-2.65, .4, .07, .32), P(Math.PI, .55, .09, .3)]],
    acc: [['bell', { color: '#4f9dff' }]], look: { mouth: 'smile' }, idle: 'cat', react: 'godeung' },
  calico: { name: '삼색이', body: '#fffaf2', ear: 'kitty', earC: '#ffc2cf', earSide: ['#3e3645', '#ffa24f'], scale: .6, nose: '#ff8fa8', tail: 'cat', tailC: '#ffa24f', whisk: true, twitch: true,
    pattern: [['#ffa24f', P(.68, .78, .42, .36, .35), P(2.45, .2, .55, .45), P(-1.5, -.35, .3, .25)], ['#3e3645', P(-.72, .8, .36, .3, -.35), P(-2.35, .1, .42, .36), P(1.55, -.2, .22, .2)]],
    acc: [['scarf', { color: '#ff7f9e' }]], idle: 'sway', react: 'calico' },
  kkamang: { name: '까망이', body: '#3f3852', ear: 'kitty', earC: '#ff9fbf', scale: .6, nose: '#ff8fb0', eyeC: '#ffd23f', eyeInk: '#ffe3ee', faceInk: '#ffe3ee', blushC: '#ff7fa8',
    tail: 'cat', whisk: true, twitch: true, look: { mouth: 'smirk' }, idle: 'cool', react: 'kkamang' },
  hayang: { name: '하양이', body: '#fdfbff', ear: 'kitty', earC: '#ffb3c6', scale: .58, nose: '#ff9fb4', eyeC: ['#6ec3ff', '#ffc23a'], tail: 'cat', tailC: '#f3eefb', whisk: true,
    acc: [['bell', { color: '#ff8fb0' }]], idle: 'sway', react: 'hayang' },
  tuxedo: { name: '턱시도', body: '#3a3446', ear: 'kitty', earC: '#ff9fbf', limbC: '#ffffff', scale: .62, nose: '#ff8fb0', eyeC: '#9be8a8', eyeInk: '#ffe3ee', tail: 'cat', whisk: true, twitch: true,
    pattern: [['#ffffff', P(0, -.02, .4, .22), P(0, .42, .07, .24), P(0, -.6, .42, .38)]], acc: [['bowtie', { color: '#ff4f6d' }]], look: { mouth: 'smile' }, idle: 'cat', react: 'tuxedo' },
  // 추로: the owner's own cat (photo 2026-10-16) — a blue-grey dilute calico: peach blaze up the forehead and peach
  // cheeks, white muzzle, chin, chest and socks, pink nose, big peach-lined ears, green-gold eyes, a cool half-lidded stare
  // eyeC: the real 추로's round green-gold eyes (the 추로야!!! boss had them first, 10/18)
  churro: { name: '추로', body: '#b3b7cb', ear: 'kitty', earC: '#f6bd98', earSide: ['#b3b7cb', '#f7c09a'], limbC: '#fbf7f2', scale: .62, nose: '#f7a9b2', tail: 'cat', tailC: '#959ab0', twitch: true, eyeC: '#b2d660',
    pattern: [['#fffaf4', P(0, -.03, .4, .2), P(0, -.55, .5, .46)], ['#f7c09a', P(-.4, .68, .3, .24, .3), P(-2.3, .3, .2, .16)]],
    look: { mouth: 'smile' }, faceF: { ex: .2, s: 1.25 }, squish: [1.08, .95], idle: 'cat', react: 'churro' },
};
// object characters: simple geometric bodies with a face on the front panel (same API as everyone else)
Object.assign(CHAR_DEFS, {
  paint: { name: '페인트통', shape: 'can', body: '#e9edf2', label: '#8fd0ff', lid: '#c6cedb', paint: '#ff6fa6', scale: .58, idle: 'paint', react: 'paint' },
  mug: { name: '컵돌이', shape: 'mug', body: '#fffaf3', band: '#7fc8ff', drink: '#8a5a44', scale: .58, look: { mouth: 'smile' }, idle: 'mug', react: 'mug' },
  cone: { name: '꼬깔이', shape: 'cone', body: '#ff8a3d', base: '#4b3f55', scale: .56, idle: 'cone', react: 'cone' },
  robot: { name: '큐브봇', shape: 'cube', body: '#a9d6ff', panel: '#f2fbff', bolt: '#ffcf4a', scale: .55, idle: 'robot', react: 'robot' },
  tv: { name: '티비군', shape: 'tv', body: '#ffcf6b', screen: '#e6fbff', shirt: '#ff9fbd', knob: '#ff6f91', scale: .52, look: { mouth: 'smile' }, idle: 'tv', react: 'tv' },
  sundae: { name: '파르페', shape: 'sundae', cup: '#cfeaff', scoop: '#ffb3cf', body: '#ffb3cf', scale: .56, idle: 'sundae', react: 'sundae' },
  milk: { name: '우유팩', shape: 'carton', body: '#ffffff', roof: '#6fbcff', scale: .56, idle: 'milk', react: 'milk' },
  toast: { name: '식빵이', shape: 'toast', body: '#fff0cc', crust: '#c98f5a', scale: .56, look: { mouth: 'smile' }, idle: 'toast', react: 'toast' },
  onigiri: { name: '주먹밥', shape: 'onigiri', body: '#fffdf6', nori: '#2e4a3c', scale: .56, idle: 'onigiri', react: 'onigiri' },
  pot: { name: '새싹이', shape: 'pot', body: '#f08a5d', leaf: '#7fd36b', scale: .56, idle: 'pot', react: 'pot' },
});
const ORIGINAL = ['mong', 'bunny', 'bear', 'cat', 'peng', 'mom'];
for (const k in CHAR_DEFS) if (!ORIGINAL.includes(k)) CHAR_DEFS[k].face2 = true;
// add a character at runtime from the same parts, e.g. defineChar('mint', { name: '민트', body: '#bdf0e0', ear: 'kitty', acc: ['scarf'] })
export function defineChar(key, def) { CHAR_DEFS[key] = { scale: .6, ear: 'none', face2: true, ...def }; return CHAR_DEFS[key]; }
export const PART_NAMES = {
  ear: ['flop', 'bunny', 'bear', 'cat', 'peng', 'mom', 'none', 'shiba', 'kitty', 'squirrel', 'hamster', 'panda', 'frog', 'spiky'],
  acc: ['cap', 'beanie', 'hairband', 'bow', 'glasses', 'sunglasses', 'scarf', 'bandaid', 'nightcap', 'headphones', 'mortarboard', 'bell', 'bowtie'],
  tail: ['curl', 'fluffy', 'short', 'cat'], prop: ['skateboard', 'book', 'lollipop', 'seed', 'fish'], shape: ['can', 'mug', 'cone', 'cube', 'tv', 'sundae', 'carton', 'toast', 'onigiri', 'pot'],
  mouth: ['frown', 'smirk', 'smile', 'wide', 'teeth', 'o'], face: Object.keys(FACE_SET),
  pose: ['idle', 'count', 'wave', 'cheer', 'search', 'cross', 'hold', 'ride', 'hips', 'push', 'cover', 'stretch', 'point', 'clap', 'flail', 'phones', 'paw', 'lick'],
};

const INK = '#2a1d33';
const ARM_S = [.75, .95, .75];
const BUSY2 = new Set(['count', 'cover', 'clap', 'phones', 'stretch']), BUSY1 = new Set(['push', 'point', 'paw', 'wave']);
const CANCEL = Symbol('cancel');
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const rnd = (a, b) => a + Math.random() * (b - a);
const _v = new THREE.Vector3(), _w = new THREE.Vector3();

const FLOOR_PTS = new WeakMap(), _fl = new THREE.Vector3();   // (Char._floorLift: a few hundred points of the body's shape)
export class Char {
  constructor(kind) {
    const d = CHAR_DEFS[kind];
    this.kind = kind; this.def = d;
    this.root = new THREE.Group();          // position on floor, rotation.y = facing
    this.body = new THREE.Group();          // squash pivot (bottom)
    this.root.add(this.body);
    this.shadow = blobShadow(.42, .3); this.root.add(this.shadow);
    this.t = Math.random() * 10; this.blinkT = 1 + Math.random() * 2;
    this.face = 'normal'; this.pose = 'idle'; this.hopping = false; this.squash = 0; this.lean = 0;
    // personality layers (all zero for the original six): idle motion, reaction offsets, movement lean
    this.tilt = d.tilt || 0; this.lift = 0; this.moveLean = 0;
    this.idl = { lean: 0, nod: 0, x: 0, y: 0, sq: 0 };
    this.rx = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, by: 0, bflip: 0, bspin: 0, bz: 0, gy: 0, cheek: 0, wag: 0, ear: 0, tongue: 0, lick: 0, fluff: 0, lid: 0, drip: 0, ant: 0, screen: 0, cherry: 0, leaf: 0, toast: 0 };
    this._earF = 0; this._earGoal = 0; this._eyeS = 1; this._eyeSY = 1;
    this.reacting = false; this._rxN = 0; this._fxPool = [];
    this.top = .8; this.fxDy = 0; this.sweatY = .52; this.armMap = null;
    this.extra = !!d.face2;
    const S = d.scale; this.body.scale.setScalar(S); this.S = S;
    this.inner = new THREE.Group(); this.body.add(this.inner);
    if (d.shape) this.buildObject(d);
    else {
      const bodyMat = mat(d.body, { rough: .62, rim: .5, ...(d.bodyO || {}) });
      const bm = mesh(mochiGeo(), bodyMat); this.inner.add(bm); this.bodyMesh = bm;
      const ol = new THREE.Mesh(mochiGeo(), new THREE.MeshBasicMaterial({ color: '#5b3b5e', side: THREE.BackSide }));
      ol.scale.setScalar(1.035); ol.position.y = -0.008; if (STYLE.mode === 'std') this.inner.add(ol);
      // 펭펭이: a white face and tummy, so its eyes and mouth read against white instead of navy
      if (kind === 'peng') this.inner.add(patchMesh('#ffffff', [P(.3, .27, .33, .29), P(-.3, .27, .33, .29), P(0, -.12, .68, .52)], .006));
      // the face, on the body surface at face coordinates (see buildFace)
      this._slot = (x, y, lift = 0) => {
        const [lon, lat] = faceLL(x, y), n = normalAt(lon, lat);
        const h = frameAt(new THREE.Group(), surf(lon, lat).addScaledVector(n, lift), n); this.inner.add(h); return h;
      };
      const nosed = d.ear === 'bear' || (this.extra && (d.nose || d.carrot));
      this.buildFace({ ex: .158, my: kind === 'peng' ? -.128 : nosed ? -.102 : -.088, by: .108, bx: .272, bly: -.05, ...(d.faceF || {}) });
      if (d.squish) this.inner.scale.set(d.squish[0], d.squish[1], d.squish[0]);
      // vinyl-toy sheen: a soft white highlight up on the left of the head (drawn, not lit, so it reads in the toon look)
      const gloss = d.gloss ?? ART.gloss;   // per character, or the 세팅 switch for everyone
      if (gloss) { const [lon, lat] = [-.62, .78], n = normalAt(lon, lat); const hl = frameAt(new THREE.Group(), surf(lon, lat).addScaledVector(n, .004), n); hl.add(put(decal('gloss', () => ellShape(.07, .04), '#ffffff', { opacity: gloss, emissive: '#ffffff', ei: 1 }), 0, 0, 0, 0, 0, .5)); this.inner.add(hl); }
      // limbs
      const limbC = d.limbC || (kind === 'peng' ? '#55638f' : d.body);
      this.arms = [];
      for (const sx of [-1, 1]) { const a = put(sph(.1, limbC, { rough: .62 }), sx * .47, .2, .05, 0, 0, 0, [.75, .95, .75]); this.inner.add(a); this.arms.push(a); a.userData.base = a.position.clone(); }
      const footC = d.footC || d.limbC || (kind === 'peng' ? '#ffab3d' : d.body);
      this.feet = [];
      for (const sx of [-1, 1]) { const f = put(sph(.11, footC, { rough: .62 }), sx * .19, .035, .2, 0, 0, 0, [1, .5, 1.15]); this.inner.add(f); this.feet.push(f); }
      this.earObjs = [];
      this.ears(kind, d);
      this.sweat = put(sph(.062, '#8fd3ff', { rough: .2, opacity: .9, rim: 0 }), .38, .55, .3, 0, 0, -.4, [.8, 1.3, .8]); this.sweat.visible = false; this.inner.add(this.sweat);
    }
    // effects float above the head, outside the squash (hearts don't wobble with the body)
    this.fxRoot = new THREE.Group(); this.body.add(this.fxRoot);
    if (this.extra && !d.shape) this.buildParts(d);
    this.root.traverse(o => { if (o.isMesh) { o.castShadow = false; o.userData.char = this; } });
    this.setFace('normal');
  }
  // a holder laid on the face (see _slot) with o inside it
  _at(o, x, y, lift = 0) { this._slot(x, y, lift).add(o); return o; }
  // a holder at a fixed point facing forward and up (개굴이's eyes sit on its eye bumps)
  _fixedSlot(x, y, z, up) { const h = frameAt(new THREE.Group(), new THREE.Vector3(x, y, z), new THREE.Vector3(0, up, 1).normalize()); this.inner.add(h); return h; }
  // ── the face: glossy eyes (open, half, ^^ closed, ‿‿ asleep, @@ dizzy), brows, every mouth, blush, tears.
  // F: { ex: eye half-spacing, my: mouth y, by: brow y, bx/bly: blush x/y, s: size } in face coordinates
  buildFace(F) {
    const d = this.def, s = F.s || 1, K = '|' + s.toFixed(3), ex = F.ex, er = .064 * s * (d.eyeK || 1);
    const eyeInk = d.eyeInk || INK, ink = d.faceInk || INK, iris = d.eyeC, DK = '#6b2440', dk = { rim: 0, rough: .5 };
    const into = (h, o) => { h.add(o); return o; };
    this.eyes = []; this.eyesClosed = []; this.eyesSleep = []; this.eyesSpin = []; this.eyeSlots = []; this.brows = []; this.blush = []; this.tears = [];
    for (const sx of [-1, 1]) {
      const h = d.eyeAt ? this._fixedSlot(sx * d.eyeAt[0], d.eyeAt[1], d.eyeAt[2], .34) : this._slot(sx * ex, F.ey || 0, -.004 * s);
      this.eyeSlots.push(h);
      const e = into(h, eyeBead(er, Array.isArray(iris) ? iris[sx < 0 ? 0 : 1] : iris, d.pupil)); e.userData.x0 = 0; this.eyes.push(e);
      this.eyesClosed.push(into(h, put(decal('eyc' + K, () => lineShapes(arcPts(0, -.03 * s, .05 * s, Math.PI * .12, Math.PI * .88, 12), .0135 * s), eyeInk), 0, 0, .006)));
      this.eyesSleep.push(into(h, put(decal('eys' + K, () => lineShapes(arcPts(0, .032 * s, .05 * s, Math.PI * 1.13, Math.PI * 1.87, 12), .0125 * s), eyeInk), 0, 0, .006)));
      this.eyesSpin.push(into(h, put(decal('eyz' + K, () => lineShapes(spiralPts(.012 * s, .056 * s, 1.7, 44), .0075 * s), eyeInk), 0, 0, .006, 0, 0, sx * 1.3)));
      // brows only show when the face needs them (mom and 삐딱이 always)
      const bh = d.eyeAt ? h : this._slot(sx * ex, F.by * s, 0);
      const b = into(bh, put(decal('eyb' + K, () => lineShapes(arcPts(0, -.07 * s, .075 * s, Math.PI * .37, Math.PI * .63, 8), .0135 * s), this.kind === 'mom' ? '#7a5240' : eyeInk), 0, d.eyeAt ? .105 : 0, .006));
      b.userData.y0 = b.position.y; this.brows.push(b);
      this.blush.push(into(this._slot(sx * F.bx, F.bly, 0), put(decal('blu' + K, () => [ellShape(.066 * s, .04 * s)], d.blushC || '#ff9fb8', { opacity: .85 }), 0, 0, .002)));
      this.tears.push(into(this._slot(sx * (ex + .022 * s), -.105 * s, 0), put(decal('tea' + K, () => [dropShape(.021 * s)], '#7fd3ff', { emissive: '#7fd3ff', ei: .5 }), 0, 0, .004)));
    }
    // mouths: ω (normal), D with a tongue (happy), O (wow), ∩ (angry, sad), ~ (dizzy, sweat), — (sus) + the personality one
    const mh = this.mouthSlot = this._slot(0, F.my, 0), M = this.mouths = {};
    const mk = (key, make, color = ink) => into(mh, put(decal(key + K, make, color), 0, 0, .005));
    const omega = () => [...lineShapes(arcPts(-.031 * s, .009 * s, .031 * s, Math.PI, Math.PI * 2, 10), .0125 * s), ...lineShapes(arcPts(.031 * s, .009 * s, .031 * s, Math.PI, Math.PI * 2, 10), .0125 * s)];
    M.w = this.mouth = mk('mw', omega);
    M.D = this.mouthD = into(mh, grp(
      put(decal('mD' + K, () => { const q = new THREE.Shape(); q.moveTo(-.075 * s, .034 * s); q.lineTo(.075 * s, .034 * s); q.absellipse(0, .034 * s, .075 * s, .096 * s, 0, -Math.PI, true); return [q]; }, DK, dk), 0, 0, .005),
      put(decal('mDt' + K, () => [ellShape(.04 * s, .024 * s, 0, -.03 * s)], '#ff7b9c', dk), 0, 0, .0065)));
    M.O = this.mouthO = into(mh, grp(put(decal('mO' + K, () => [ellShape(.041 * s, .053 * s)], DK, dk), 0, 0, .005), put(decal('mOt' + K, () => [ellShape(.023 * s, .013 * s, 0, -.034 * s)], '#ff7b9c', dk), 0, 0, .0065)));
    M.frown = this.mouthFrown = mk('mf', () => lineShapes(arcPts(0, -.05 * s, .052 * s, Math.PI * .2, Math.PI * .8, 10), .0125 * s));
    M.wavy = this.mouthWavy = mk('mv', () => lineShapes(Array.from({ length: 15 }, (_, i) => { const u = i / 14; return [(u - .5) * .13 * s, Math.sin(u * Math.PI * 3) * .012 * s]; }), .011 * s));
    M.flat = this.mouthFlat = mk('mfl', () => lineShapes([[-.032 * s, .004 * s], [.042 * s, -.004 * s]], .0115 * s));
    // personality mouth (shown while calm)
    const lm = this.extra ? d.look?.mouth : null;
    if (lm === 'frown') M.alt = mk('mf', () => lineShapes(arcPts(0, -.05 * s, .052 * s, Math.PI * .2, Math.PI * .8, 10), .0125 * s));
    else if (lm === 'smirk') M.alt = mk('msk', () => lineShapes(arcPts(.006 * s, .05 * s, .055 * s, Math.PI * 1.25, Math.PI * 1.92, 12), .0125 * s));
    else if (lm === 'smile') M.alt = mk('msm', () => lineShapes(arcPts(0, .044 * s, .062 * s, Math.PI * 1.18, Math.PI * 1.82, 12), .0125 * s));
    else if (lm === 'o') M.alt = mk('mo', () => [ellShape(.024 * s, .03 * s)], DK);
    else if (lm === 'teeth') { M.alt = into(mh, grp(put(decal('mw' + K, omega, ink), 0, 0, .005), put(rbox(.032, .042, .014, '#ffffff', .006), -.017, -.032, .008), put(rbox(.032, .042, .014, '#ffffff', .006), .017, -.032, .008))); this.teeth = M.alt; }
    else if (lm === 'wide') { M.alt = inkLine('wide2', arcLL(16, k => { const a = Math.PI * (1 + k); return [.34 * Math.cos(a), .14 + .1 * Math.sin(a)]; }), .017, ink); this.inner.add(M.alt); }
    this.mouthAlt = M.alt || null;
  }
  // cat whiskers: two each side, drawn on the body past the cheeks
  _whiskers(c) {
    for (const sx of [-1, 1]) for (const k of [0, 1]) {
      const pts = [[.25, -.06 + k * .03], [.33, -.065 + k * .045], [.41, -.075 + k * .065]].map(([x, y]) => { const [lon, lat] = faceLL(sx * x, y); return [lon, lat]; });
      this.inner.add(inkLine(`wh|${sx}|${k}|${c}`, pts, .0075, c));
    }
  }
  ears(kind, d) {
    const add = o => { this.inner.add(o); return o; };
    const e = d.ear, B = { rough: .62 }, side = sx => (d.earSide ? d.earSide[sx < 0 ? 0 : 1] : d.body);
    // every ear is a group pivoting where it meets the head, so it can twitch, perk up (wow) and droop (sad) with the face.
    // droop: how far it follows the face (long bunny ears all the way, round bear ears barely)
    const ear = (sx, x, y, z, rz, rx, droop, ...kids) => { const g = grp(...kids); add(put(g, sx * x, y, z, rx, 0, -sx * rz)); this.earObjs.push(g); g.userData.rz = g.rotation.z; g.userData.droop = droop; return g; };
    if (e === 'bunny') {
      // long, a little flattened so the pink inside shows on the front
      for (const sx of [-1, 1]) ear(sx, .15, .63, -.04, .26, -.14, 1, put(cap(.1, .44, side(sx), B), 0, .3, 0, 0, 0, 0, [1, 1, .62]), put(cap(.054, .34, d.earC, { rim: 0 }), 0, .3, .05, 0, 0, 0, [1, 1, .5]));
    } else if (e === 'bear') {
      for (const sx of [-1, 1]) ear(sx, .3, .64, -.04, .42, -.1, .15, put(sph(.165, side(sx), B), 0, .09, 0, 0, 0, 0, [1, 1, .7]), put(sph(.095, d.earC), 0, .095, .08, 0, 0, 0, [1, 1, .45]));
      // muzzle and nose (the mouth sits on the muzzle)
      this._at(put(decal('muz', () => [ellShape(.118, .086)], '#f7dcbc', { rim: 0, rough: .62 }), 0, 0, .001), 0, -.074);
      this._at(put(sph(.04, INK, { rough: .3 }), 0, 0, .006, 0, 0, 0, [1.3, .9, .55]), 0, -.038);
    } else if (e === 'cat') {
      for (const sx of [-1, 1]) ear(sx, .26, .62, -.04, .4, -.1, .45, put(cone(.155, .33, side(sx), B, 14), 0, .15, 0, 0, 0, 0, [1, 1, .62]), put(cone(.09, .2, d.earC, null, 12), 0, .12, .058, 0, 0, 0, [1, 1, .45]));
      this._whiskers(INK);
      [[-.1, .78, '#ffb26b'], [.05, .79, '#ffb26b']].forEach(([x, y, c]) => add(put(sph(.06, c), x, y, .1, 0, 0, 0, [1, .4, 1])));
    } else if (e === 'peng') {
      this._at(put(cone(.072, .14, '#ffab3d', { rough: .4 }, 12), 0, 0, .055, Math.PI / 2, 0, 0, [1.15, 1, .78]), 0, -.048);
    } else if (e === 'mom') {
      // short bob haircut: a cap on the back/top with a soft fringe, so the pink face still reads from above
      add(put(mesh(geo('momhair', () => new THREE.SphereGeometry(.5, 30, 16, 0, Math.PI * 2, 0, Math.PI * .2)), mat(d.earC, { rough: .7, side: THREE.DoubleSide })), 0, .3, -.03, -.5, 0, 0, 1.05));
      for (const sx of [-1, 1]) add(put(sph(.13, d.earC, { rough: .7 }), sx * .16, .7, .3, 0, 0, sx * .5, [1.1, .55, .7]));
      add(put(sph(.15, d.earC, { rough: .7 }), 0, .8, -.22));
      add(put(tor(.07, .035, '#ff5d6c', { rough: .5 }), -.1, .86, -.15, 0, .6, .4)); add(put(tor(.07, .035, '#ff5d6c', { rough: .5 }), .1, .86, -.15, 0, -.6, -.4));
      add(put(sph(.035, '#ff5d6c', { rough: .5 }), 0, .86, -.13));
      // apron
      const ap = mesh(geo('apron', () => new THREE.CylinderGeometry(.47, .52, .36, 30, 1, true, -1.05, 2.1)), mat('#ffffff', { side: THREE.DoubleSide, rough: .7 }));
      add(put(ap, 0, .13, .02));
      add(put(rbox(.18, .1, .04, '#ffd1e0', .02), 0, .1, .49));
      add(put(sph(.04, '#ff5d6c'), 0, .22, .49, 0, 0, 0, [1.4, .8, .5]));
    } else if (e === 'flop') {
      // 몽글이: round ears tipped out at the top of the head, plus the little tuft
      for (const sx of [-1, 1]) ear(sx, .35, .46, -.02, .64, -.06, .3, put(cap(.152, .07, d.earC, { rough: .6 }), 0, .21, 0, 0, 0, 0, [1, 1, .8]));
      add(put(sph(.092, d.earC), 0, .785, .02, 0, 0, 0, [1, .7, 1]));
    }
    // ── the newer ear types, 1.3–1.5× the first cut so they read at phone size
    const inner = (r, h, c, y, z) => put(cone(r, h, c, null, 12), 0, y, z, 0, 0, 0, [1, 1, .45]);
    const big = (g, k) => { if (Array.isArray(k)) g.scale.set(...k); else g.scale.setScalar(k); };
    if (e === 'shiba') {
      for (const sx of [-1, 1]) big(ear(sx, .27, .62, 0, .32, .1, .45, put(cone(.14, .27, side(sx), B, 14), 0, .12, 0), inner(.08, .16, d.earC, .1, .07)), 1.35);
    } else if (e === 'kitty') {
      for (const sx of [-1, 1]) big(ear(sx, .26, .63, -.03, .36, -.04, .45, put(cone(.135, .26, side(sx), B, 14), 0, .11, 0), inner(.075, .15, d.earC, .09, .065)), [1.32, 1.45, 1.32]);
    } else if (e === 'squirrel') {
      for (const sx of [-1, 1]) big(ear(sx, .24, .66, -.04, .22, .05, .4, put(cone(.1, .3, side(sx), B, 12), 0, .13, 0), inner(.055, .17, d.earC, .1, .05)), 1.35);
    } else if (e === 'hamster') {
      for (const sx of [-1, 1]) big(ear(sx, .29, .64, -.02, .45, 0, .15, put(sph(.1, side(sx), B), 0, .05, 0, 0, 0, 0, [1, 1, .55]), put(sph(.06, d.earC), 0, .05, .035, 0, 0, 0, [1, 1, .4])), 1.42);
    } else if (e === 'panda') {
      for (const sx of [-1, 1]) big(ear(sx, .3, .64, -.03, .32, 0, .12, put(sph(.135, d.earC, B), 0, .04, 0, 0, 0, 0, [1, 1, .72])), 1.3);
    } else if (e === 'frog') {
      for (const sx of [-1, 1]) { add(put(sph(.17, d.body, { rough: .62 }), sx * .2, .78, .02)); add(put(sph(.105, '#ffffff', { rough: .5 }), sx * .2, .826, .108, 0, 0, 0, [1, 1, .72])); }
    } else if (e === 'spiky') {
      add(mesh(spikyGeo(), mat(d.earC, { rough: .7 })));
    }
  }
  // ── object characters: a plain geometric body with the face on a flat (or gently curved) front panel
  buildObject(d) {
    const add = (o, to = this.inner) => { to.add(o); return o; };
    const sh = d.shape, C = d.body, O = this.obj = {};
    let fp, fy = .3, ex = .13, dx = 0;
    // surfaces the face can sit on: a lathe profile (cans, mugs, cones, cups) or a flat box front
    const onLathe = prof => (x, y) => {
      let k = 1; while (k < prof.length - 1 && prof[k][1] < y) k++;
      const [r0, y0] = prof[k - 1], [r1, y1] = prof[k], u = (y - y0) / Math.max(1e-6, y1 - y0), r = r0 + (r1 - r0) * u, dr = (r1 - r0) / Math.max(1e-6, y1 - y0);
      const a = Math.asin(Math.max(-1, Math.min(1, x / r)));
      return { p: new THREE.Vector3(r * Math.sin(a), y, r * Math.cos(a)), n: new THREE.Vector3(Math.sin(a), -dr, Math.cos(a)).normalize() };
    };
    const onFlat = zf => (x, y) => ({ p: new THREE.Vector3(x, y, zf), n: new THREE.Vector3(0, 0, 1) });
    const feet = (c, x = .17, y = .03, z = .14, r = .1) => { this.feet = [-1, 1].map(sx => add(put(sph(r, c, { rough: .62 }), sx * x, y, z, 0, 0, 0, [1, .55, 1.15]))); };
    const arms = (c, x, y, z, map, r = .085) => {
      this.arms = [-1, 1].map(sx => { const a = add(put(sph(r, c, { rough: .62 }), sx * x, y, z, 0, 0, 0, [.75, .95, .75])); a.userData.base = a.position.clone(); return a; });
      this.armMap = map;
    };
    this.arms = []; this.feet = [];
    if (sh === 'can') {
      // 페인트통: paint can, label band, pink paint over the rim, lid worn as a hat
      const prof = [[0, 0], [.35, 0], [.4, .05], [.4, .57], [.37, .62], [0, .62]];
      this.bodyMesh = add(mesh(latheGeo('can', prof), mat(C, { rough: .5 })));
      add(mesh(geo('can-label', () => new THREE.CylinderGeometry(.408, .408, .34, 40, 1, true)), mat(d.label || '#bfe6ff', { rough: .6 }))).position.y = .3;
      add(put(tor(.385, .035, d.paint || '#ff6fa6', { rough: .45 }, Math.PI * 2, 8, 36), 0, .6, 0, Math.PI / 2, 0, 0));
      [[-.2, .14, .5], [-.06, .09, .53], [.17, .12, .5]].forEach(([x, len, y]) => { const a = Math.asin(x / .41); add(put(cap(.045, len, d.paint || '#ff6fa6', { rough: .45 }), .412 * Math.sin(a), y, .412 * Math.cos(a), 0, a, 0)); });
      O.drip = add(put(cap(.045, .1, d.paint || '#ff6fa6', { rough: .45 }), .412 * Math.sin(.75), .48, .412 * Math.cos(.75), 0, .75, 0));   // the one that keeps dripping
      O.lid = add(put(mesh(latheGeo('lid', [[0, 0], [.43, 0], [.46, .03], [.43, .07], [0, .07]]), mat(d.lid || shade(C, -.06), { rough: .5 })), .03, .64, 0, -.08, 0, -.16));
      O.lid.add(put(sph(.05, d.paint || '#ff6fa6', { rough: .45 }), -.12, .07, .12, 0, 0, 0, [1.6, .5, 1.2]));
      fp = onLathe([[.408, 0], [.408, .62]]); fy = .3; feet(shade(C, -.08), .17, .02, .2, .09);
      this.top = .72;
    } else if (sh === 'mug') {
      // 컵돌이: a mug of cocoa with marshmallows; steam curls up while idle
      const prof = [[0, 0], [.33, 0], [.38, .05], [.4, .56], [.38, .6], [.34, .6], [.34, .52], [0, .52]];
      this.bodyMesh = add(mesh(latheGeo('mug', prof), mat(C, { rough: .5 })));
      add(mesh(geo('mug-band', () => new THREE.CylinderGeometry(.402, .399, .07, 40, 1, true)), mat(d.band || '#7fc8ff', { rough: .55 }))).position.y = .47;
      add(put(cyl(.35, .35, .03, d.drink || '#8a5a44', null, 32), 0, .57, 0));
      O.mallow = add(grp(put(rbox(.12, .08, .12, '#ffffff', .035), -.08, 0, .02, 0, .4, .1), put(rbox(.11, .08, .11, '#ffd1e0', .035), .1, .01, -.06, 0, -.3, -.1)));
      O.mallow.position.y = .6;
      add(put(tor(.14, .052, C, { rough: .5 }, Math.PI * 1.55, 10, 20), .43, .32, 0, 0, 0, -Math.PI * .78));
      O.steam = [0, 1, 2].map(() => add(sph(.07, '#ffffff', { rough: .8 }, 12, 8)));
      fp = onLathe([[.38, .05], [.4, .56]]); fy = .28; feet(shade(C, -.06), .16, .02, .18, .085);
      this.top = .64;
    } else if (sh === 'cone') {
      // 꼬깔이: traffic cone with two white bands on a dark base
      add(put(rbox(.84, .08, .84, d.base || '#4b3f55', .035), 0, .04, 0));
      const prof = [[0, .06], [.36, .06], [.365, .1], [.09, .86], [.05, .92], [0, .93]];
      this.bodyMesh = add(mesh(latheGeo('cone', prof), mat(C, { rough: .5 })));
      const band = (y0, y1) => { const r = y => .365 + (.09 - .365) * (y - .1) / .76 + .006; return mesh(geo(`cone-band|${y0}`, () => new THREE.CylinderGeometry(r(y1), r(y0), y1 - y0, 36, 1, true)), mat('#ffffff', { rough: .5 })); };
      add(band(.5, .6)).position.y = .55; add(band(.68, .76)).position.y = .72;
      fp = onLathe([[.365, .1], [.09, .86]]); fy = .27; ex = .11;
      arms(C, .33, .3, .02, { sx: .72, dy: -.08, dz: -.12 }, .08);
      this.top = .93;
    } else if (sh === 'cube') {
      // 큐브봇: cube robot with a face screen, ear bolts and an antenna that blinks
      for (const sx of [-1, 1]) add(put(cyl(.08, .08, .12, '#6b7290', null, 14), sx * .18, .06, 0));
      this.bodyMesh = add(put(rbox(.8, .7, .72, C, .13), 0, .47, 0));
      add(put(rbox(.6, .42, .04, d.panel || '#f2fbff', .07), 0, .49, .36));
      for (const sx of [-1, 1]) add(put(cyl(.09, .09, .07, d.bolt || '#ffcf4a', null, 16), sx * .425, .5, 0, 0, 0, Math.PI / 2));
      add(put(cap(.026, .14, '#6b7290'), 0, .9, 0));
      O.bulb = add(put(sph(.075, '#ff5d6c', { rough: .4 }), 0, 1.02, 0));
      fp = onFlat(.385); fy = .49; ex = .13;
      arms(shade(C, -.08), .46, .32, .02, { sx: 1, dy: .1, dz: -.06 });
      this.top = 1.06;
    } else if (sh === 'tv') {
      // 티비군: retro TV head (screen face + knobs + rabbit ears) on a tiny body
      feet('#5a4a63', .12, .025, .08, .075);
      add(put(sph(.24, d.shirt || '#ff9fbd', { rough: .62 }), 0, .2, 0, 0, 0, 0, [1, .78, .9]));
      this.bodyMesh = add(put(rbox(.84, .6, .56, C, .11), 0, .62, 0));
      O.screen = add(put(rbox(.56, .42, .04, d.screen || '#e6fbff', .07), -.07, .62, .28));
      for (const y of [.71, .55]) add(put(cyl(.052, .052, .05, '#7a5240', null, 14), .3, y, .29, Math.PI / 2, 0, 0));
      O.ears = [-1, 1].map(sx => { const g = add(grp(put(cap(.022, .24, '#5a4a63'), 0, .13, 0), put(sph(.05, d.knob || '#ff6f91'), 0, .29, 0))); put(g, sx * .08, .9, -.05, 0, 0, -sx * .5); g.userData.rz = g.rotation.z; return g; });
      fp = onFlat(.305); fy = .63; ex = .12; dx = -.07;
      arms(d.shirt || '#ff9fbd', .26, .2, .02, { sx: .62, dy: .26, dz: -.13 }, .075);
      this.top = 1.2; this.sweatY = .95;
    } else if (sh === 'sundae') {
      // 파르페: sundae glass with a strawberry scoop, drips, a wafer and a cherry
      add(put(cyl(.2, .24, .05, d.cup || '#cfeaff', null, 28), 0, .025, 0));
      add(put(cyl(.06, .06, .1, d.cup || '#cfeaff', null, 14), 0, .1, 0));
      const prof = [[0, .14], [.2, .14], [.3, .19], [.39, .29], [.44, .42], [.46, .55], [.45, .6], [0, .6]];
      this.bodyMesh = add(mesh(latheGeo('sundae', prof), mat(d.cup || '#cfeaff', { rough: .45 })));
      const sc = d.scoop || '#ffb3cf';
      add(put(sph(.36, sc, { rough: .6 }), 0, .73, -.03, 0, 0, 0, [1, .72, 1]));
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + .3; add(put(sph(.07, sc, { rough: .6 }), Math.sin(a) * .41, .635 - (i % 2) * .02, Math.cos(a) * .41 - .02, 0, 0, 0, [1, 1.15, 1])); }
      add(put(rbox(.09, .32, .05, '#f0c27a', .02), -.2, .92, -.08, 0, .3, .45));
      O.cherry = add(grp(put(sph(.08, '#ff3b5c', { rough: .35 }), 0, 0, 0), put(cap(.016, .08, '#5aa04a'), .02, .1, 0, 0, 0, -.3)));
      O.cherry.position.set(.03, 1.02, .04);
      fp = onLathe(prof.slice(1, 7).map(([r, y]) => [r, y])); fy = .41; ex = .14;
      this.top = 1.1;
    } else if (sh === 'carton') {
      // 우유팩: a milk carton with a blue gable roof and stripe; face on the white front
      const R = d.roof || '#6fbcff';
      this.bodyMesh = add(put(rbox(.66, .64, .56, C, .07), 0, .38, 0));
      add(put(rbox(.68, .12, .58, R, .05), 0, .15, 0));
      // the gable faces front, so even straight on it reads as a carton (a pointed top with the fold on it)
      add(put(mesh(geo('carton-roof', () => {
        const q = new THREE.Shape(); q.moveTo(-.32, 0); q.lineTo(.32, 0); q.lineTo(0, .27); q.closePath();
        const g = new THREE.ExtrudeGeometry(q, { depth: .5, bevelEnabled: true, bevelThickness: .025, bevelSize: .02, bevelSegments: 2 }); g.translate(0, 0, -.25); return g;
      }), mat(R, { rough: .5 })), 0, .69, 0));
      add(put(rbox(.05, .09, .56, shade(R, .1), .02), 0, .98, 0));
      fp = onFlat(.28); fy = .42; ex = .14;
      feet(shade(C, -.12), .17, .02, .16, .085);
      arms(C, .37, .3, .02, { sx: .8, dy: .02, dz: -.08 }, .08);
      this.top = 1.05;
    } else if (sh === 'toast') {
      // 식빵이: a thick slice of bread, golden crust all round, soft crumb on both faces, a pat of butter on top
      const slice = () => { const q = new THREE.Shape(); q.moveTo(-.3, 0); q.lineTo(.3, 0); q.quadraticCurveTo(.36, 0, .36, .07); q.lineTo(.36, .44); q.bezierCurveTo(.52, .5, .5, .82, .22, .82); q.lineTo(-.22, .82); q.bezierCurveTo(-.5, .82, -.52, .5, -.36, .44); q.lineTo(-.36, .07); q.quadraticCurveTo(-.36, 0, -.3, 0); return q; };
      this.bodyMesh = add(put(mesh(geo('toast-crust', () => { const g = new THREE.ExtrudeGeometry(slice(), { depth: .26, bevelEnabled: true, bevelThickness: .05, bevelSize: .045, bevelSegments: 3, curveSegments: 14 }); g.translate(0, 0, -.13); return g; }), mat(d.crust || '#e0954f', { rough: .6 })), 0, .07, 0));
      const crumb = () => mesh(geo('toast-crumb', () => { const g = new THREE.ShapeGeometry(slice(), 14); g.scale(.86, .86, 1); g.translate(0, .05, 0); return g; }), mat(C, { rough: .7 }));
      add(put(crumb(), 0, .07, .181)); add(put(crumb(), 0, .07, -.181, 0, Math.PI, 0));
      O.butter = add(put(rbox(.17, .05, .13, '#ffe27a', .02), .06, .94, 0, 0, .3, .05));
      fp = onFlat(.183); fy = .45; ex = .13;
      feet(shade(d.crust || '#e0954f', -.08), .16, .02, .1, .085);
      arms(d.crust || '#e0954f', .45, .32, 0, { sx: .95, dy: .02, dz: -.1 }, .08);
      this.top = .98;
    } else if (sh === 'onigiri') {
      // 주먹밥: a rounded triangle of rice with a strip of nori round its bottom
      this.bodyMesh = add(put(mesh(geo('onigiri', () => { const g = new THREE.ExtrudeGeometry(roundPolyShape([[-.25, .2], [.25, .2], [0, .6]], .17), { depth: .22, bevelEnabled: true, bevelThickness: .07, bevelSize: .05, bevelSegments: 4, curveSegments: 12 }); g.translate(0, 0, -.11); return g; }), mat(C, { rough: .75 })), 0, .03, 0));
      add(put(rbox(.36, .24, .42, d.nori || '#2e4a3c', .04), 0, .15, 0));
      fp = onFlat(.183); fy = .48; ex = .11;
      feet(shade(C, -.14), .15, .02, .1, .08);
      arms(C, .44, .3, 0, { sx: .92, dy: 0, dz: -.1 }, .08);
      this.top = .88;
    } else if (sh === 'pot') {
      // 새싹이: a terracotta pot with a sprout; the leaves sway, droop when thirsty and perk up when happy
      const prof = [[0, 0], [.27, 0], [.3, .03], [.36, .5], [0, .5]];
      this.bodyMesh = add(mesh(latheGeo('pot', prof), mat(C, { rough: .6 })));
      add(mesh(latheGeo('pot-rim', [[.33, .45], [.42, .47], [.44, .52], [.43, .62], [.4, .64], [.34, .64], [.34, .5]]), mat(shade(C, -.06), { rough: .6 })));
      add(put(cyl(.35, .35, .03, '#6b4a3a', null, 28), 0, .6, 0));
      const lf = d.leaf || '#7fd36b';
      O.leaves = [-1, 1].map(sx => { const g = grp(put(sph(.17, lf, { rough: .55 }, 16, 10), sx * .15, 0, 0, 0, 0, 0, [1.1, .42, .66])); put(g, sx * .015, .25, 0, 0, 0, sx * .42); g.userData.rz = g.rotation.z; return g; });
      O.sprout = add(grp(put(cap(.032, .2, shade(lf, -.12), { rough: .55 }), 0, .12, 0), ...O.leaves));
      O.sprout.position.set(0, .6, 0);
      fp = onLathe([[.3, .03], [.36, .5]]); fy = .27; ex = .125;
      feet(shade(C, -.1), .15, .02, .16, .08);
      arms(C, .4, .3, .02, { sx: .85, dy: .02, dz: -.1 }, .08);
      this.top = 1.02;
    }
    this.fxDy = this.top - .8;
    // the face: the same sticker kit as everyone, on the front panel
    const fs = d.faceS || (sh === 'cone' ? 1 : 1.08);
    this._slot = (x, y, lift = 0) => { const { p, n } = fp(x + dx, fy + y); const h = frameAt(new THREE.Group(), p.addScaledVector(n, lift + .006), n); this.inner.add(h); return h; };
    this.buildFace({ ex, my: -.1 * fs, by: .118, bx: ex + .1 * fs, bly: -.07 * fs, s: fs });
    this.sweat = put(sph(.06, '#8fd3ff', { rough: .2, opacity: .9, rim: 0 }), .36, this.sweatY, .3, 0, 0, -.4, [.8, 1.3, .8]); this.sweat.visible = false; this.inner.add(this.sweat);
    this.earObjs = [];
  }
  // object parts that move: lid, steam, antenna bulb, screen, cherry
  _objPost(t) {
    const O = this.obj, rx = this.rx;
    if (O.lid) { O.lid.position.y = .64 + rx.lid * .4; O.lid.rotation.set(-.08 + Math.sin(t * 1.3) * .03, rx.lid * Math.PI * 2, -.16 + Math.sin(t * 1.7) * .04); }
    if (O.drip) { const k = Math.sin(t * .9) * .5 + .5; O.drip.scale.set(1, .6 + Math.max(k, rx.drip) * 1.2, 1); O.drip.position.y = .48 - Math.max(k, rx.drip) * .06; }
    if (O.steam) O.steam.forEach((m, i) => { const p = (t * .45 + i / 3) % 1, b = rx.lid; m.position.set(Math.sin(p * 6 + i * 2) * .07 + (i - 1) * .08, .68 + p * (.45 + b * .3), -.02); m.scale.setScalar(Math.max(.001, Math.sin(p * Math.PI) * (.8 + b * .8))); });
    if (O.mallow) O.mallow.position.y = .6 + rx.lid * .35;
    if (O.bulb) { const c = rx.ant > 0 ? (Math.floor(t * 12) % 2 ? '#ffd23f' : '#7cf0ff') : (Math.floor(t * 1.6) % 2 ? '#ff5d6c' : '#ff9aa6'); if (O.bulbC !== c) { O.bulbC = c; O.bulb.material = mat(c, { rough: .4 }); } }
    if (O.screen) { const c = rx.screen > 0 ? ['#ffe3f0', '#d9ffe9', '#fff6c9', '#e0e6ff'][Math.floor(t * 14) % 4] : (this.def.screen || '#e6fbff'); if (O.screenC !== c) { O.screenC = c; O.screen.material = mat(c, { rough: .6 }); } }
    if (O.ears) O.ears.forEach((e, i) => { e.rotation.z = e.userData.rz + Math.sin(t * 2.2 + i) * .08 + (i ? 1 : -1) * rx.ear; });
    if (O.cherry) { O.cherry.position.y = 1.02 + rx.cherry * .45; O.cherry.rotation.z = Math.sin(t * 2.4) * .12 + rx.cherry * Math.PI * 2; }
    if (O.sprout) {
      const k = rx.leaf, droop = Math.max(0, -k) * 1.1;
      O.sprout.rotation.z = Math.sin(t * 1.4) * .07; O.sprout.scale.setScalar(1 + Math.max(0, k) * .4);
      O.leaves.forEach((l, i) => { const sx = i ? 1 : -1; l.rotation.z = l.userData.rz - sx * droop + Math.sin(t * 2.2 + i * 1.7) * .06; });
    }
    if (O.butter) O.butter.scale.set(1 + rx.toast * .4, 1 - rx.toast * .55, 1 + rx.toast * .4);
  }
  // ── parts for the new characters
  buildParts(d) {
    const add = (o, to = this.inner) => { to.add(o); return o; };
    const L = d.look || {};
    // nose (or carrot) between the eyes and the mouth; the mouth already sits lower for these (see the constructor)
    if (d.nose) this._at(put(sph(.036, d.nose, { rough: .3 }), 0, 0, .004, 0, 0, 0, [1.35, .95, .55]), 0, -.042);
    if (d.carrot) this._at(put(cone(.048, .18, d.carrot, { rough: .5 }, 12), 0, 0, .065, Math.PI / 2 - .1, 0, 0), 0, -.04);
    (d.pattern || []).forEach(([color, ...list], i) => add(patchMesh(color, list, .006 + i * .004)));
    if (d.whisk) this._whiskers(d.faceInk || INK);
    // half-closed lids (body coloured, tilted) for the grumpy look, inside each eye's holder
    if (L.lids) {
      const c = L.lids.cover ?? .5;
      this.lids = this.eyeSlots.map((h, i) => { const l = put(sph(.085, d.body, { rough: .62 }, 16, 12), 0, .077 - c * .154 + .064, .014, 0, 0, (i ? 1 : -1) * (L.lids.tilt || 0), [1.3, .75, .5]); h.add(l); return l; });
    }
    if (L.bubble) this.bubble = this._at(put(sph(.075, '#cdeeff', { opacity: .55, rim: 0 }, 14, 10), 0, 0, .03), .07, -.06);
    if (d.cheeks) this.cheeks = [-1, 1].map(sx => add(put(sph(.15, d.cheeks, { rough: .62 }), sx * .36, .23, .28, 0, 0, 0, [1, .85, .8])));
    if (d.tongue) { this.tongue = put(grp(put(cap(.035, .26, '#ff6f91', { rough: .5 }), 0, .15, 0), put(sph(.06, '#ff6f91', { rough: .5 }), 0, .3, 0)), 0, 0, .01, Math.PI / 2 - .3, 0, 0); this.mouthSlot.add(this.tongue); this.tongue.visible = false; }
    if (d.tail) this.buildTail(d);
    for (const a of d.acc || []) { const [name, o] = Array.isArray(a) ? a : [a, {}]; this.buildAcc(name, o, d); }
    if (d.prop) this.buildProp(d.prop, d);
    if (d.idle === 'sleepy') this.zs = [0, 1, 2].map(() => add(FX.z(), this.fxRoot));
    if (d.idle === 'groove') this.notes = [0, 1].map(() => add(FX.note(), this.fxRoot));
    this._gT = 2 + Math.random() * 2; this._gD = 0; this._gS = 1; this._tw = 1 + Math.random() * 3; this._twK = null; this._twE = -1; this._hop = 2 + Math.random() * 3;
  }
  buildTail(d) {
    const t = this.tail = new THREE.Group(), body = d.tailC || d.body;
    if (d.tail === 'curl') {
      put(t, .1, .5, -.42);
      t.add(put(tor(.1, .058, body, { rough: .62 }, Math.PI * 1.7, 10, 22), 0, .1, 0, -.35, 0, .3));
      t.add(put(sph(.06, d.earC || shade(body, .2)), -.07, .19, .02));
    } else if (d.tail === 'fluffy') {
      // a big plume: up the back, curling forward over the head
      put(t, 0, .2, -.34);
      t.add(mesh(plumeGeo('fluffy', [[0, -.02, .02], [-.04, .14, -.22], [-.16, .42, -.34], [-.3, .7, -.3], [-.38, .92, -.14], [-.3, 1.02, .02]], k => .23 * roundEnds(k, .45) * (1 - .3 * k)), mat(shade(body, -.04), { rough: .62 })));
    } else if (d.tail === 'cat') {
      put(t, .2, .12, -.36);
      t.add(mesh(plumeGeo('cat', [[0, 0, 0], [.12, .1, -.08], [.22, .36, -.1], [.2, .58, -.04], [.09, .66, .02]], k => .058 * roundEnds(k, .22)), mat(shade(body, -.04), { rough: .62 })));
    } else {
      put(t, 0, .2, -.46); t.add(sph(.11, body, { rough: .62 }));
    }
    t.userData.r0 = t.rotation.clone();
    this.inner.add(t);
  }
  buildAcc(name, o, d) {
    const add = (x, to = this.inner) => { to.add(x); return x; };
    const C = o.color;
    if (name === 'cap') {
      // baseball cap; back: true turns it around (brim out the back). Pivots at the head centre so it can sit askew.
      const c = C || '#ff5d6c', b = o.back ? -1 : 1, h = this.hat = add(new THREE.Group());
      put(h, 0, .3, 0, 0, 0, o.tilt || 0);
      h.add(put(mesh(shellGeo(Math.PI * .28, -.2 * b, 1.07), mat(c, { rough: .6 })), 0, -.3, 0));
      h.add(put(mesh(geo('chr-brim', () => new THREE.CylinderGeometry(.24, .24, .04, 24, 1, false, -Math.PI / 2, Math.PI)), mat(c, { rough: .6 })), 0, .4, b * .33, b * .3, b > 0 ? 0 : Math.PI, 0, [1, 1, 1.05]));
      h.add(put(sph(.05, shade(c, -.15)), 0, .535, -.06 * b));
    } else if (name === 'beanie') {
      const c = C || '#ffcf4a', g = this.hat = add(new THREE.Group());
      g.add(mesh(shellGeo(Math.PI * .3, -.1, 1.07), mat(c, { rough: .7 })));
      g.add(put(tor(.43, .062, o.band || shade(c, -.1), { rough: .7 }, Math.PI * 2, 10, 32), 0, .6, -.035, Math.PI / 2 + .1, 0, 0));
      g.add(put(sph(.1, o.pom || o.band || '#ffffff', { rough: .7 }), 0, .88, -.04));
    } else if (name === 'hairband' || name === 'bow') {
      const c = C || '#ff7fae';
      if (name === 'hairband') add(put(tor(.44, .045, c, { rough: .5 }, Math.PI, 8, 28), 0, .36, -.06));
      if (name === 'bow' || o.bow) {
        const b = add(grp(put(sph(.1, c, { rough: .5 }), -.1, 0, 0, 0, 0, -.25, [1.15, .8, .55]), put(sph(.1, c, { rough: .5 }), .1, 0, 0, 0, 0, .25, [1.15, .8, .55]), put(sph(.05, shade(c, -.1), { rough: .5 }), 0, 0, .02)));
        const sd = o.side ?? 1; put(b, sd * .27, sd ? .74 : .8, sd ? .12 : .03, sd ? -.2 : -.5, sd * .3, -sd * .55);
      }
    } else if (name === 'glasses') {
      // round frames in front of each eye (the eye holders give the spot and the angle)
      const g = this.glasses = add(new THREE.Group()), c = C || '#3b2a3f';
      [-1, 1].forEach(sx => {
        const h = this._slot(sx * .158, 0, 0); g.add(h);
        h.add(put(tor(.112, .024, c, { rough: .4 }, Math.PI * 2, 8, 24), 0, 0, .034));
        h.add(put(cyl(.094, .094, .01, '#cfeaff', { opacity: .35, rim: 0 }, 20), 0, 0, .04, Math.PI / 2, 0, 0));
        if (sx < 0) { this.glint = put(FX.sparkle(), -.05, .06, .07, 0, 0, 0, .001); h.add(this.glint); }
      });
      const br = this._slot(0, .012, 0); g.add(br); br.add(put(cap(.02, .05, c, { rough: .4 }), 0, 0, .05, 0, 0, Math.PI / 2));
    } else if (name === 'sunglasses') {
      const g = this.shades = add(new THREE.Group());
      [-1, 1].forEach(sx => {
        const h = this._slot(sx * .158, .016, 0); g.add(h);
        const lens = put(rbox(.215, .16, .05, o.lens || '#2a2238', .05), 0, 0, .03);
        lens.add(put(sph(.028, '#ffffff', { rim: 0 }, 10, 8), -.058, .036, .024, 0, 0, 0, [1, 1, .4])); h.add(lens);
      });
      const br = this._slot(0, .05, 0); g.add(br); br.add(put(rbox(.16, .04, .04, o.lens || '#2a2238', .015), 0, 0, .04));
    } else if (name === 'bell') {
      // a collar with a little gold bell (cats)
      const c = C || '#ff6f91';
      add(put(tor(.476, .03, c, { rough: .5 }, Math.PI * 2, 8, 40), 0, .19, 0, Math.PI / 2 - .08, 0, 0));
      this.bell = add(grp(put(sph(.066, '#ffd23f', { rough: .3 }, 14, 10), 0, 0, 0), put(cap(.009, .05, '#b98a1e', { rim: 0 }), 0, -.02, .062, 0, 0, Math.PI / 2)));
      this.bell.position.set(0, .17, .49);
    } else if (name === 'bowtie') {
      const c = C || '#ff4f6d', b = add(grp(
        put(cone(.075, .13, c, { rough: .5 }, 10), -.075, 0, 0, 0, 0, -Math.PI / 2, [1, 1, .45]), put(cone(.075, .13, c, { rough: .5 }, 10), .075, 0, 0, 0, 0, Math.PI / 2, [1, 1, .45]),
        put(sph(.04, shade(c, -.1), { rough: .5 }), 0, 0, .01, 0, 0, 0, [1, 1, .7])));
      onBody(b, 0, -.3, .03);
    } else if (name === 'scarf') {
      const c = C || '#ff7f9e';
      add(put(tor(.47, .07, c, { rough: .7 }, Math.PI * 2, 10, 32), 0, .19, .0, Math.PI / 2 - .16, 0, 0));
      add(put(rbox(.12, .3, .055, c, .027), -.22, .06, .5, -.35, -.3, -.12)); add(put(rbox(.12, .24, .055, shade(c, -.06), .027), -.1, .05, .53, -.35, -.2, .15));
    } else if (name === 'bandaid') {
      const b = add(grp(put(rbox(.17, .062, .022, '#ffd7a8', .028), 0, 0, 0), put(rbox(.06, .05, .03, '#f1b07a', .012), 0, 0, 0)));
      onBody(b, o.lon ?? .74, o.lat ?? .1, .02, o.spin ?? .55);
    } else if (name === 'nightcap') {
      const c = C || '#7f8ff2', g = this.hat = add(new THREE.Group()); put(g, -.06, .6, -.04, -.12, 0, .12);
      g.add(put(tor(.355, .075, '#ffffff', { rough: .7 }, Math.PI * 2, 10, 28), 0, 0, 0, Math.PI / 2));
      g.add(put(mesh(bentConeGeo(.34, .82, 2.3), mat(c, { rough: .7 })), 0, .02, 0));
      const R = .82 / 2.3;
      this.capTip = put(sph(.1, '#ffffff', { rough: .7 }), R * (1 - Math.cos(2.3)), R * Math.sin(2.3) + .02, 0); g.add(this.capTip);
    } else if (name === 'headphones') {
      const g = this.phones = add(new THREE.Group());
      g.add(put(tor(.5, .055, '#3e3a55', { rough: .4 }, Math.PI, 8, 28), 0, .4, -.06));
      for (const sx of [-1, 1]) { g.add(put(sph(.17, C || '#ff6f91', { rough: .5 }), sx * .49, .4, -.03, 0, 0, 0, [.6, 1, 1])); g.add(put(sph(.09, '#3e3a55', { rough: .5 }), sx * .56, .4, -.03, 0, 0, 0, [.5, 1, 1])); }
    } else if (name === 'mortarboard') {
      const g = this.hat = add(new THREE.Group()); put(g, 0, .72, -.02, -.12, 0, .06);
      g.add(put(cyl(.27, .3, .14, '#3d3657', { rough: .6 }, 24), 0, .02, 0));
      g.add(put(rbox(.64, .05, .64, '#3d3657', .02), 0, .11, 0, 0, Math.PI / 4, 0));
      g.add(put(sph(.04, '#ffc94a'), 0, .15, 0));
      const tas = this.tassel = grp(put(cap(.022, .2, '#ffc94a'), 0, -.1, 0), put(cyl(.04, .065, .1, '#ffc94a', null, 10), 0, -.25, 0));
      put(tas, .4, .12, .06, 0, 0, .1); g.add(tas);
    }
  }
  buildProp(name) {
    if (name === 'skateboard') {
      const b = this.board = new THREE.Group();
      b.add(mesh(deckGeo(), mat('#ffb547', { rough: .5 })));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(put(sph(.068, '#ff6f91', { rough: .5 }, 14, 10), sx * .34, -.075, sz * .12, 0, 0, 0, [1, 1, .75]));
      put(b, 0, .14, 0); this.body.add(b);
      this.lift = .19;
      this.shadow.scale.set(1.05, .75, 1);
      return;
    }
    const h = this.held = new THREE.Group();
    // two: [x, y, z, tiltX] held in both hands (pose 'hold'); one: offset from the right hand; lick: brought to the mouth
    if (name === 'book') {
      h.add(put(rbox(.36, .28, .026, '#ff6b6b', .012), 0, 0, .042));
      h.add(put(rbox(.36, .28, .026, '#ff6b6b', .012), 0, 0, -.042));
      h.add(put(rbox(.33, .26, .07, '#fffaf0', .01), .012, 0, 0));
      h.add(put(rbox(.03, .28, .11, '#e84f5c', .012), -.17, 0, 0));
      h.add(put(rbox(.15, .06, .02, '#ffd23f', .01), .01, .04, .058));
      h.userData = { two: [0, .15, .55, -.42], one: [-.04, .05, .12, -.2], grip: .2, gy: .17 };
    } else if (name === 'lollipop') {
      h.add(put(cap(.022, .24, '#ffffff'), 0, .02, 0));
      h.add(put(cyl(.13, .13, .06, '#ff6fa6', { rough: .45 }, 22), 0, .24, 0, Math.PI / 2, 0, 0));
      h.add(put(tor(.075, .022, '#ffffff', { rough: .45 }, Math.PI * 1.6, 6, 18), 0, .24, .032));
      h.userData = { one: [0, .1, .06, 0], lick: [.1, .06, .55] };
    } else if (name === 'seed') {
      h.add(put(sph(.07, '#5d5866', { rough: .6 }, 14, 10), 0, 0, 0, 0, 0, 0, [.78, 1.3, .55]));
      h.add(put(cap(.014, .1, '#ece4d6'), 0, 0, .035));
      h.userData = { two: [0, .16, .5, -.3], one: [-.02, .08, .06, 0], lick: [0, .23, .54], grip: .1, gy: .16 };
    } else if (name === 'fish') {
      // a little blue fish, held across the tummy
      h.add(put(sph(.1, '#7fb8ff', { rough: .4 }, 16, 12), 0, 0, 0, 0, 0, 0, [1.3, .72, .5]));
      h.add(put(cone(.075, .11, '#7fb8ff', { rough: .4 }, 10), -.17, 0, 0, 0, 0, -Math.PI / 2, [1, 1, .45]));
      h.add(put(sph(.02, INK, { rim: 0 }, 8, 6), .085, .022, .045));
      h.add(put(cap(.01, .03, '#5a8fe0', { rim: 0 }), .0, .0, .05, 0, 0, Math.PI / 2));
      h.userData = { two: [0, .17, .52, -.15], one: [-.02, .08, .08, 0], lick: [0, .25, .56], grip: .16, gy: .17 };
    }
    this.inner.add(h);
  }

  // normal | happy | wow | sad | angry | sus | dizzy | sweat (anything else shows normal). Each one changes the eye shape
  // AND the mouth shape, so they stay apart at phone size; personality looks (lids, grumpy brows, own mouth) layer on top.
  setFace(f) {
    this.face = f;
    const d = this.def, L = this.extra ? d.look || {} : {}, X = FACE_SET[f] || FACE_SET.normal, calm = f === 'normal' || f === 'sweat';
    this.sleeping = L.eyes === 'sleep' && f === 'normal';
    const ev = this.sleeping ? 'sleep' : X.eyes;
    this._eyeS = X.es || 1; this._eyeSY = ev === 'half' ? .46 : 1;
    this.eyes.forEach(e => { e.visible = ev === 'open' || ev === 'half'; e.scale.set(this._eyeS, this._eyeS * this._eyeSY, 1); e.position.y = ev === 'half' ? -.014 : 0; });
    this.eyesClosed.forEach(e => (e.visible = ev === 'closed'));
    this.eyesSleep.forEach(e => (e.visible = ev === 'sleep'));
    this.eyesSpin.forEach(e => (e.visible = ev === 'spin'));
    // mouth: the personality mouth while calm (a sleepy 'o' only while asleep); 펭펭이's beak is its resting mouth
    let m = X.mouth;
    if (this.mouthAlt && (L.mouth === 'o' ? this.sleeping : calm)) m = 'alt';
    if (this.kind === 'peng' && m === 'w') m = null;
    for (const k in this.mouths) this.mouths[k].visible = k === m;
    this.mouthO.scale.set(1, 1, 1);
    // brows
    let bw = X.brows || (this.kind === 'mom' ? 'calm' : null);
    if (L.brows === 'grumpy' && (calm || f === 'angry')) bw = f === 'angry' ? 'angry' : 'grumpy';
    this.brows.forEach((b, i) => {
      const sx = i ? 1 : -1; b.visible = !!bw;
      if (bw === 'sus') { b.rotation.z = i ? -.22 : .12; b.position.y = b.userData.y0 + (i ? .04 : -.012); }
      else if (bw) { const [rz, dy] = BROW[bw]; b.rotation.z = sx * rz; b.position.y = b.userData.y0 + dy; }
    });
    const bc = X.blush === 'red' ? '#ff5d6c' : X.blush === 'hot' ? '#ff86a8' : (d.blushC || '#ff9fb8');
    this.blush.forEach(b => { b.material = mat(bc, { opacity: X.blush ? .92 : .85, rim: 0, rough: .5 }); b.scale.setScalar(X.blush === 'hot' ? 1.15 : 1); });
    this.tears.forEach(t => (t.visible = !!X.tears));
    this.sweat.visible = !!X.sweat;
    this._earGoal = X.ear || 0;
    if (this.lids) this.lids.forEach(l => { l.visible = !this.sleeping && (calm || f === 'angry'); });
    if (this.bubble) this.bubble.visible = this.sleeping;
  }
  // how far the body's lowest point is under its base as it is turned and squashed now (body units; 0 when it isn't)
  _floorLift() {
    const g = this.bodyMesh.geometry;
    let pts = FLOOR_PTS.get(g);
    if (!pts) { const p = g.attributes.position, st = Math.max(1, Math.floor(p.count / 240)); pts = []; for (let i = 0; i < p.count; i += st) pts.push(new THREE.Vector3().fromBufferAttribute(p, i)); FLOOR_PTS.set(g, pts); }
    const q = this.inner.quaternion, s = this.inner.scale, bp = this.bodyMesh.position;
    let lo = 0;
    for (const p of pts) { _fl.copy(p).add(bp).multiply(s).applyQuaternion(q); if (_fl.y < lo) lo = _fl.y; }
    return -lo;
  }
  update(dt) {
    this.t += dt;
    const t = this.t, I = this.idl, rx = this.rx;
    if (this.extra) this._idle(dt, t);
    // idle breathing squash (bottom-anchored)
    const br = Math.sin(t * 3.6) * .035;
    const sq = this.squash + I.sq;
    this.inner.scale.set(1 - br * .6 + sq * .5, 1 + br - sq, 1 - br * .6 + sq * .5);
    this.squash *= Math.exp(-dt * 10);
    this.inner.rotation.z = this.lean + (this.face === 'dizzy' ? Math.sin(t * 9) * .12 : 0) + this.tilt + I.lean + rx.rz + this.moveLean;
    this.inner.rotation.x = I.nod + rx.rx; this.inner.rotation.y = rx.ry;
    this.inner.position.set(I.x + rx.x, this.lift + I.y + rx.y, rx.z);
    // a body tipped far over rests on its edge instead of going through the floor (겹침 QA 10/20, phone: 2판 토순이's 벌러덩,
    // tipped 69° back round the middle of its base, had its back half down in the floor). Small sways stay as they were: the
    // lift comes in between 20° and 34° of tip
    const tip = Math.abs(this.inner.rotation.x) + Math.abs(this.inner.rotation.z);
    if (tip > .35 && this.bodyMesh) { const need = this._floorLift() - this.inner.position.y; if (need > 0) this.inner.position.y += need * Math.min(1, (tip - .35) / .25); }
    // blink
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blinkT = 2 + Math.random() * 2.5; this._blink = .13; }
    if (this._blink > 0) { this._blink -= dt; const k = this._blink > 0 ? .12 : 1; this.eyes.forEach(e => e.scale.y = this._eyeS * this._eyeSY * k); }
    // arms by pose (a personality may hold its own idle pose)
    const P = this.pose === 'idle' && this.def.idlePose ? this.def.idlePose : this.pose;
    const M = this.armMap;
    this.arms.forEach((a, i) => {
      const sx = i ? 1 : -1, b = a.userData.base;
      let rz = 0, s = ARM_S, rest = false;
      if (P === 'count') { a.position.set(sx * .17, .4, .44); }
      else if (P === 'wave' && i === 1) { a.position.set(.48, .5 + Math.sin(t * 12) * .06, .1); }
      else if (P === 'cheer') { a.position.set(sx * .45, .55 + Math.sin(t * 14 + i) * .05, .05); }
      else if (P === 'search') { a.position.set(sx * .4, .3 + Math.sin(t * 10 + i * 2) * .08, .3); }
      else if (P === 'cross') { a.position.set(sx * .13, .1 + i * .055, .43 + i * .035); rz = sx * (i ? .3 : -.12); s = [1.95, .95, .95]; }
      else if (P === 'hold') { const u = this.held?.userData; a.position.set(sx * (u?.grip ?? .2), (u?.gy ?? .25) + Math.sin(t * 3.6 + i) * .01, .44); }
      else if (P === 'ride') { a.position.set(sx * .52, .3 + Math.sin(t * 1.7 + i * Math.PI) * .035, .02); }
      else if (P === 'hips') { a.position.set(sx * .49, .17, .06); rz = -sx * .7; s = [.7, 1.15, .7]; }
      else if (P === 'push' && i === 1) { a.position.set(.21, .44, .46); }
      else if (P === 'cover') { a.position.set(sx * .14, .38, .49); }
      else if (P === 'stretch') { a.position.set(sx * .36, .74 + Math.sin(t * 6 + i) * .02, 0); }
      else if (P === 'point' && i === 1) { a.position.set(.46, .4, .3); rz = .9; s = [.7, 1.2, .7]; }
      else if (P === 'clap') { a.position.set(sx * (.05 + Math.abs(Math.sin(t * 15)) * .08), .32, .47); }
      else if (P === 'flail') { a.position.set(sx * .52, .6 + Math.sin(t * 22 + i * 2) * .07, .05); }
      else if (P === 'phones') { a.position.set(sx * .5, .52, .08); }
      else if (P === 'paw' && i === 1) { const k = rx.lick; a.position.set(.3 - k * .25, .3 + k * .25, .4 + k * .1); }
      else if (P === 'lick' && i === 1) { a.position.set(.12, .27, .48); }
      else { a.position.set(b.x, b.y + Math.sin(t * 3.6 + i) * .015, b.z); rest = true; }
      if (M) { if (!rest) a.position.set(a.position.x * M.sx, a.position.y + M.dy, a.position.z + M.dz); s = M.s || s; }
      a.rotation.z = rz; a.scale.set(s[0], s[1], s[2]);
    });
    if (this.sweat.visible) this.sweat.position.y = this.sweatY - ((t * .6) % .25);
    this._post(dt, t, P);
  }
  // props, tails, ears, effects (for the original six this only re-applies their ear pose, unchanged at rest)
  _post(dt, t, P) {
    const rx = this.rx, I = this.idl;
    // ears follow the face: perk up for wow/angry, droop for sad, sag a little when worried or dizzy
    this._earF += (this._earGoal - this._earF) * (1 - Math.exp(-dt * 12));
    this.earObjs.forEach((e, i) => { const sx = i ? 1 : -1; e.rotation.z = e.userData.rz + (this._twE === i ? -sx * .45 * Math.sin(this._twK * Math.PI) : 0) - sx * (rx.ear + this._earF * (e.userData.droop ?? 1)); });
    if (!this.extra) return;
    if (this.board) { this.board.position.set(I.x + rx.x, .14 + rx.by, rx.z); this.board.rotation.set(rx.bflip, rx.bspin, I.lean * .7 + rx.bz + this.moveLean * .5); }
    const h = this.held;
    if (h) {
      const u = h.userData;
      // both hands busy (covering eyes, clapping…) → the prop is set down; right hand busy → it moves to the left hand
      h.visible = !BUSY2.has(P);
      if (u.two && P === 'hold') { h.position.set(u.two[0], u.two[1] + Math.sin(t * 3.6) * .01, u.two[2]); h.rotation.set(u.two[3], 0, 0); }
      else { const left = BUSY1.has(P), a = this.arms[left ? 0 : 1].position, o = u.one; h.position.set(a.x + (left ? -o[0] : o[0]), a.y + o[1], a.z + o[2]); h.rotation.set(o[3], 0, P === 'cheer' || P === 'wave' ? (left ? .3 : -.3) : 0); }
      if (rx.lick && u.lick) { h.position.lerp(_w.set(u.lick[0], u.lick[1], u.lick[2]), rx.lick); h.rotation.z = -.4 * rx.lick; }
    }
    if (this.tail) {
      const r0 = this.tail.userData.r0, k = this.def.tail;
      if (k === 'curl') this.tail.rotation.set(r0.x, r0.y + Math.sin(t * (9 + rx.wag * 20)) * (.3 + rx.wag * .3), r0.z);
      else if (k === 'fluffy') { this.tail.rotation.set(r0.x + Math.sin(t * 1.8) * .1 - rx.fluff * .2, r0.y, r0.z + Math.sin(t * 1.1) * .06); this.tail.scale.setScalar(1 + rx.fluff * .25); }
      else if (k === 'cat') this.tail.rotation.set(r0.x, r0.y, r0.z + Math.sin(t * 1.6) * .25 + rx.wag * Math.sin(t * 18) * .3);
      else this.tail.rotation.set(r0.x, r0.y + Math.sin(t * 6 + rx.wag * 20) * .15 * (1 + rx.wag * 3), r0.z);
    }
    if (this.def.shape) this._objPost(t);
    if (this.shades) this.shades.position.y = rx.gy;
    if (this.glasses) this.glasses.position.y = rx.gy;
    if (this.cheeks) this.cheeks.forEach(c => c.scale.set(1 + rx.cheek * .4, .85 + rx.cheek * .35, .8 + rx.cheek * .45));
    if (this.tongue) { this.tongue.visible = rx.tongue > .02; this.tongue.scale.set(1, Math.max(.01, rx.tongue), 1); }
    if (this.bubble && this.bubble.visible) this.bubble.scale.setScalar(.45 + .55 * (Math.sin(t * 1.8) * .5 + .5));
    if (this.zs) this.zs.forEach((z, i) => {
      const p = (t * .3 + i / 3) % 1; z.visible = this.sleeping && !this.reacting;
      z.position.set(-.28 - p * .22 + Math.sin(p * 6 + i) * .04, .8 + p * .5, .2); z.scale.setScalar(Math.max(.001, Math.sin(p * Math.PI) * (.7 + i * .12))); z.rotation.z = -.25 + Math.sin(p * 5) * .2;
    });
    if (this.notes) this.notes.forEach((n, i) => {
      const p = (t * .4 + i / 2) % 1; n.position.set((i ? .4 : -.42) + Math.sin(p * 7) * .04, .7 + p * .45, .1); n.scale.setScalar(Math.max(.001, Math.sin(p * Math.PI) * .8)); n.rotation.z = Math.sin(p * 6) * .3;
    });
    // effects face the camera when one is registered (Char.camera = cam)
    const cam = Char.camera;
    if (cam) { cam.getWorldDirection(_v); this.fxRoot.rotation.y = wrapA(Math.atan2(-_v.x, -_v.z) - this.root.rotation.y); }
  }
  // personality idles, layered on top of breathing
  _idle(dt, t) {
    const I = this.idl, d = this.def, rs = this.reacting;
    I.lean = 0; I.nod = 0; I.x = 0; I.y = 0; I.sq = 0;
    // ear twitch: one ear flicks now and then
    if (d.twitch) {
      this._tw -= dt; if (this._tw < 0) { this._tw = rnd(1.8, 4.5); this._twE = Math.random() < .5 ? 0 : 1; this._twK = 0; }
      if (this._twK != null) { this._twK += dt / .22; if (this._twK >= 1) { this._twK = null; this._twE = -1; } }
    }
    switch (d.idle) {
      case 'skate': I.x = Math.sin(t * .9) * .06; I.lean = Math.sin(t * 1.8) * .045; break;
      case 'sleepy': if (this.sleeping && !rs) { I.nod = .12 + Math.sin(t * 1.1) * .07; I.lean = Math.sin(t * .55) * .05; } break;
      case 'grumpy': {
        // sideways glance + impatient foot tap
        this._gT -= dt; if (this._gT < 0) { this._gT = rnd(2.5, 5); this._gD = 1.1; this._gS = Math.random() < .5 ? -1 : 1; }
        this._gD -= dt; const g = this._gD > 0 && !rs ? this._gS * .028 : 0;
        this.eyes.forEach(e => { e.position.x = e.userData.x0 + g; });
        const ph = t % 3.4; this.feet[1].position.y = .035 + (ph < .5 && !rs ? Math.max(0, Math.sin(ph * 6 * Math.PI)) * .05 : 0);
        break;
      }
      case 'nerd': if (this.glint) { const ph = t % 4.2; this.glint.scale.setScalar(ph < .5 ? Math.max(.001, Math.sin(ph / .5 * Math.PI)) : .001); this.glint.rotation.z = ph * 3; } break;
      case 'nibble': { const ph = t % 3; if (ph < .45 && !rs) I.sq = Math.sin(ph * 40) * .035; break; }
      case 'frog': {
        this._hop -= dt; if (this._hop < 0) this._hop = rnd(3, 5.5);
        const p = this._hop; if (p < .32 && !rs && !this.hopping) { I.y = Math.sin(p / .32 * Math.PI) * .09; if (p < .05) this.squash = Math.max(this.squash, .12); }
        break;
      }
      case 'panda': case 'sway': I.lean = Math.sin(t * 1.2) * .05; break;
      case 'cool': I.lean = Math.sin(t * 4.4) * .025; I.y = Math.abs(Math.sin(t * 4.4)) * .012; break;
      case 'groove': I.y = Math.abs(Math.sin(t * 4.6)) * .035; I.lean = Math.sin(t * 2.3) * .06; break;
      case 'cone': I.lean = Math.sin(t * 1.5) * .04; break;
      case 'robot': { const k = Math.floor(t * 2) % 4; I.lean = [0, .03, 0, -.03][k]; break; }
      case 'tv': I.lean = Math.sin(t * 2) * .03; I.y = Math.abs(Math.sin(t * 4)) * .012; break;
      case 'sundae': I.lean = Math.sin(t * .9) * .04; break;
      case 'paint': case 'mug': I.lean = Math.sin(t * 1.1) * .025; break;
      // cats: a lazy sway and, every few seconds, a long stretch up
      case 'cat': { I.lean = Math.sin(t * .8) * .04; const ph = t % 6.5; if (ph < .7 && !rs) I.sq = -Math.sin(ph / .7 * Math.PI) * .07; break; }
      case 'milk': case 'onigiri': case 'pot': I.lean = Math.sin(t * 1.2) * .03; break;
      case 'toast': I.y = Math.abs(Math.sin(t * 2.2)) * .015; I.lean = Math.sin(t * 1.1) * .025; break;
    }
  }

  // ── effects pool (made on first use; joins the character's outline group straight away)
  _fxGet(type) {
    let f = this._fxPool.find(x => x.type === type && !x.busy);
    if (!f) {
      if (this._fxPool.length >= 6) return null;
      const o = FX[type](); o.visible = false;
      o.traverse(m => {
        if (!m.isMesh) return;
        m.castShadow = false; m.userData.char = this;
        const b = this.bodyMesh; if (b.userData.oid != null) { m.userData.oid = b.userData.oid; m.onBeforeRender = b.onBeforeRender; }
        if (m.material.transparent) m.layers.set(2);
      });
      this.fxRoot.add(o); f = { type, o, busy: false }; this._fxPool.push(f);
    }
    f.busy = true;
    return f;
  }
  // pop an effect: grows in, floats up, shrinks away. Fire and forget.
  _fx(tw, type, { x = 0, y = .95, z = .25, rise = .3, dur = .8, s = 1, spin = 0, rz = 0, delay = 0, drift = 0 } = {}) {
    const f = this._fxGet(type); if (!f) return Promise.resolve();
    const o = f.o;
    return tw.run(dur, k => {
      o.visible = true;
      const pop = k < .25 ? ease.outBack(k / .25) : k > .72 ? 1 - ease.inQuad((k - .72) / .28) : 1;
      o.scale.setScalar(Math.max(.001, pop * s));
      o.position.set(x + drift * k, y + this.fxDy + rise * ease.outQuad(k), z);
      o.rotation.set(0, 0, rz + spin * k);
    }, ease.linear, delay).then(() => { o.visible = false; f.busy = false; });
  }

  // ── tap reaction (≤1.2 s, cycles through 2–3 variations per personality). Returns a promise that also carries the line:
  //   const r = ch.react(tw, (name, pitch) => audio.sfx(name, pitch)); say(ch, r.line); await r;   // resolves { line, kind, variant }
  // A new tap while one is playing cuts over cleanly; the face and pose come back to what the scene had set.
  react(tw, sfx = null) {
    const set = REACTS[this.def.react || this.kind] || REACTS.mong;
    const i = this._rxN++ % set.length, v = set[i];
    const tok = {}; this._rxTok = tok;
    const alive = () => this._rxTok === tok;
    if (this.reacting) this._rxRestore(); else { this._face0 = this.face; this._pose0 = this.pose; }
    this.reacting = true; this._rxClear();
    const line = v.line;
    const p = (async () => {
      try { await v.run(this, runner(this, tw, sfx, alive)); }
      catch (e) { if (e !== CANCEL) console.error(e); }
      if (alive()) { this._rxClear(); this._rxRestore(); this.reacting = false; }
      return { line, kind: this.kind, variant: i };
    })();
    p.line = line; p.variant = i;
    return p;
  }
  _rxClear() { for (const k in this.rx) this.rx[k] = 0; }
  _rxRestore() {
    if (this._rxFace != null && this.face === this._rxFace) this.setFace(this._face0);
    else if (this._rxBlush) this.setFace(this.face);
    if (this._rxPose != null && this.pose === this._rxPose) this.pose = this._pose0;
    this._rxFace = this._rxPose = null; this._rxBlush = false;
  }
  _shy(on) { this._rxBlush = on; this.blush.forEach(b => { b.material = mat(on ? '#ff6f96' : '#ff9fb8', { opacity: .9, rim: 0 }); }); }

  bump(amount = .25) { this.squash = amount; }
  async hopTo(tw, x, z, { height = .45, dur = .42, sfx = null } = {}) {
    const sx = this.root.position.x, sz = this.root.position.z;
    const dx = x - sx, dz = z - sz;
    if (Math.hypot(dx, dz) > .02) this.root.rotation.y = Math.atan2(dx, dz);
    this.squash = .25; this.hopping = true;
    sfx?.('hop');
    await tw.run(dur, k => {
      this.root.position.x = sx + dx * k; this.root.position.z = sz + dz * k;
      this.body.position.y = height * 4 * k * (1 - k);
      this.squash = k < .5 ? -.12 : -.12 + (k - .5) * .2;
    }, ease.linear);
    this.body.position.y = 0; this.squash = .3; this.hopping = false;
    sfx?.('land');
  }
  async walkTo(tw, x, z, opts = {}) {
    const sx = this.root.position.x, sz = this.root.position.z;
    const dist = Math.hypot(x - sx, z - sz);
    const n = Math.max(1, Math.round(dist / .6));
    for (let i = 1; i <= n; i++) await this.hopTo(tw, sx + (x - sx) * i / n, sz + (z - sz) * i / n, { height: .22, dur: .24, ...opts });
  }
  // ride the skateboard to (x, z): push off, roll with the board's long side along the path, lean into it
  async glideTo(tw, x, z, { speed = 1.2, sfx = null, faceYaw = null } = {}) {
    const sx = this.root.position.x, sz = this.root.position.z, dx = x - sx, dz = z - sz, d = Math.hypot(dx, dz);
    if (d < .02) return;
    const mv = Math.atan2(dx, dz), ref = faceYaw ?? this.root.rotation.y;
    const a1 = mv - Math.PI / 2, a2 = mv + Math.PI / 2;
    const goal = Math.abs(wrapA(a1 - ref)) < Math.abs(wrapA(a2 - ref)) ? a1 : a2;
    const r0 = this.root.rotation.y, dr = wrapA(goal - r0);
    const side = Math.sign(dx * Math.cos(goal) - dz * Math.sin(goal)) || 1;   // +1 when local +x points along the path
    this.hopping = true; this.squash = .22; sfx?.('swish');
    await tw.run(Math.max(.6, d / speed), k => {
      this.root.position.x = sx + dx * k; this.root.position.z = sz + dz * k;
      this.root.rotation.y = r0 + dr * Math.min(1, k * 3);
      this.moveLean = -side * Math.sin(k * Math.PI) * .14;
    }, ease.inOutSine);
    this.moveLean = 0; this.hopping = false;
  }
  // roam inside a rectangle until stopped; returns { stop() }. 보드킹 (glide: true) rolls, everyone else hops.
  //   area: { x0, x1, z0, z1 } | { minX, maxX, minZ, maxZ } | [x0, z0, x1, z1]
  //   opts: sfx(name), pause [min, max] s, others (chars to keep clear of), faceYaw (yaw or () => yaw to turn to while resting)
  wander(tw, area, { sfx = null, pause = [.9, 2.6], others = null, faceYaw = null, maxStep = 1.6, clear = null, radius = .32 } = {}) {
    const A = Array.isArray(area) ? { x0: area[0], z0: area[1], x1: area[2], z1: area[3] }
      : { x0: area.x0 ?? area.minX, x1: area.x1 ?? area.maxX, z0: area.z0 ?? area.minZ, z1: area.z1 ?? area.maxZ };
    this._wander?.stop();
    const h = { on: true, stop: () => { h.on = false; } };
    this._wander = h;
    const live = () => h.on && this._wander === h;
    (async () => {
      await tw.wait(rnd(.1, 1.2));
      while (live()) {
        while (this.reacting && live()) await tw.wait(.2);
        if (!live()) break;
        const p = this.root.position;
        let x = p.x, z = p.z;
        for (let k = 0; k < 10; k++) {
          const a = Math.random() * Math.PI * 2, r = rnd(.6, maxStep);
          const cx = Math.min(A.x1, Math.max(A.x0, p.x + Math.sin(a) * r)), cz = Math.min(A.z1, Math.max(A.z0, p.z + Math.cos(a) * r));
          if (Math.hypot(cx - p.x, cz - p.z) < .4) continue;
          if (others && others.some(o => o !== this && Math.hypot(o.root.position.x - cx, o.root.position.z - cz) < .75)) continue;
          if (clear) { let ok = true; for (let s = 1; s <= 6 && ok; s++) ok = clear(p.x + (cx - p.x) * s / 6, p.z + (cz - p.z) * s / 6, radius); if (!ok) continue; }
          x = cx; z = cz; break;
        }
        const fy = typeof faceYaw === 'function' ? faceYaw() : faceYaw;
        if (x !== p.x || z !== p.z) {
          if (this.def.glide) await this.glideTo(tw, x, z, { sfx, faceYaw: fy });
          else {
            const x0 = p.x, z0 = p.z, n = Math.max(1, Math.round(Math.hypot(x - x0, z - z0) / .45));
            for (let i = 1; i <= n && live(); i++) await this.hopTo(tw, x0 + (x - x0) * i / n, z0 + (z - z0) * i / n, { height: .2, dur: .26, sfx: i === 1 ? sfx : null });
          }
        }
        if (!live()) break;
        if (fy != null) { const r0 = this.root.rotation.y, dr = wrapA(fy - r0); await tw.run(.35, k => { if (live()) this.root.rotation.y = r0 + dr * k; }); }
        await tw.wait(rnd(pause[0], pause[1]));
      }
    })();
    return h;
  }
  stopWander() { this._wander?.stop(); this._wander = null; }
  // height of the top of the head above root.position (world units): put speech bubbles at headTop() + ~.2
  headTop() { return this.S * (this.top + this.lift); }
  faceTo(x, z) { this.root.rotation.y = Math.atan2(x - this.root.position.x, z - this.root.position.z); }
}
Char.camera = null;   // optional: set to the scene camera so reaction effects always face it

// ── reactions: short, non-blocking, cancel-safe. R.t / R.wait throw CANCEL once a newer tap has taken over.
function runner(c, tw, sfx, alive) {
  const R = {
    t: async (dur, fn, e = ease.outCubic) => { await tw.run(dur, k => { if (alive()) fn(k); }, e); if (!alive()) throw CANCEL; },
    wait: async s => { await tw.wait(s); if (!alive()) throw CANCEL; },
    sfx: (n, p = 0, delay = 0) => { if (!sfx) return; if (!delay) sfx(n, p); else tw.wait(delay).then(() => { if (alive()) sfx(n, p); }); },
    face: f => { c.setFace(f); c._rxFace = f; },
    pose: p => { c.pose = p; c._rxPose = p; },
    shy: on => c._shy(on),
    fx: (type, o) => c._fx(tw, type, o),
    jump: (h = .35, dur = .4) => R.t(dur, k => { c.rx.y = h * 4 * k * (1 - k); }, ease.linear).then(() => { c.rx.y = 0; c.squash = .3; }),
    spin: (turns = 1, dur = .6, e = ease.inOutCubic) => R.t(dur, k => { c.rx.ry = turns * Math.PI * 2 * k; }, e).then(() => { c.rx.ry = 0; }),
    wobble: (amp = .2, dur = .6, f = 3) => R.t(dur, k => { c.rx.rz = Math.sin(k * Math.PI * 2 * f) * amp * (1 - k); }, ease.linear).then(() => { c.rx.rz = 0; }),
    to: (key, v, dur, e = ease.outCubic) => { const v0 = c.rx[key]; return R.t(dur, k => { c.rx[key] = v0 + (v - v0) * k; }, e); },
    hearts: (n = 3, o = {}) => { for (let i = 0; i < n; i++) c._fx(tw, 'heart', { x: (i - (n - 1) / 2) * .26, y: .9 + (i % 2) * .08, delay: i * .1, rz: (i - (n - 1) / 2) * .25, ...o }); },
  };
  return R;
}
const all = ps => Promise.all(ps);
// a character's signature line (the first of its reactions), for the card book
export const charLine = k => { const d = CHAR_DEFS[k]; return (REACTS[d?.react || k] || REACTS[k] || [])[0]?.line || ''; };
const REACTS = {
  mong: [
    { line: '헤헤, 좋아!', run: async (c, R) => { R.face('happy'); R.sfx('giggle'); R.hearts(3); await R.jump(.35, .34); await R.jump(.2, .26); await R.wait(.3); } },
    { line: '몽글몽글~', run: async (c, R) => { R.face('happy'); R.sfx('swish'); R.fx('sparkle', { x: -.4, y: .7 }); R.fx('sparkle', { x: .42, y: .85, delay: .15 }); await all([R.spin(1, .6), R.jump(.3, .6)]); R.sfx('pop', 4); await R.wait(.35); } },
    { line: '말랑말랑하지?', run: async (c, R) => { R.face('wow'); R.sfx('wobble'); c.squash = .5; await R.wait(.12); R.face('happy'); await R.t(.8, k => { c.squash = Math.sin(k * Math.PI * 5) * .28 * (1 - k); }, ease.linear); } },
  ],
  bunny: [
    { line: '깡총깡총!', run: async (c, R) => { R.face('happy'); R.sfx('hop'); await all([R.jump(.32, .3), R.to('ear', .35, .15)]); R.sfx('hop', 3); await all([R.jump(.32, .3), R.to('ear', -.2, .3)]); await R.to('ear', 0, .2); } },
    { line: '부끄러워…', run: async (c, R) => { R.pose('cover'); R.shy(true); R.sfx('giggle'); R.fx('heart', { y: .9, s: .8 }); await R.wobble(.12, .9, 2.5); } },
    { line: '토순이 최고지?', run: async (c, R) => { R.pose('cheer'); R.face('happy'); R.sfx('pop', 5); R.fx('star', { x: -.35, y: .85 }); R.fx('star', { x: .38, y: .95, delay: .12 }); await R.jump(.28, .38); await R.wait(.5); } },
  ],
  bear: [
    { line: '꿀… 없어?', run: async (c, R) => { R.face('sus'); R.sfx('hmm'); R.fx('ques', { x: .35, y: .9 }); await R.t(.9, k => { c.squash = Math.sin(k * Math.PI * 4) * .14 * (1 - k); c.rx.rz = Math.sin(k * Math.PI * 2) * .1; }, ease.linear); } },
    { line: '안녕! 곰돌이야', run: async (c, R) => { R.pose('wave'); R.face('happy'); R.sfx('pop', 2); await R.jump(.22, .3); await R.wait(.75); } },
    { line: '하아암~', run: async (c, R) => { R.pose('stretch'); R.face('wow'); R.sfx('phew'); await R.t(.5, k => { c.rx.rx = -.25 * k; c.squash = -.15 * k; }); await R.wait(.25); R.face('happy'); await R.t(.35, k => { c.rx.rx = -.25 * (1 - k); }); } },
  ],
  cat: [
    { line: '냥냥!', run: async (c, R) => { R.pose('paw'); R.sfx('swish'); await R.t(.18, k => { c.rx.lick = k; c.rx.rz = -.12 * k; }); await R.t(.16, k => { c.rx.lick = 1 - k; }); R.sfx('swish'); await R.t(.18, k => { c.rx.lick = k; }); await R.t(.3, k => { c.rx.lick = 1 - k; c.rx.rz = -.12 * (1 - k); }); } },
    { line: '그릉그릉~', run: async (c, R) => { R.face('happy'); R.sfx('wobble'); R.fx('heart', { y: .95, s: .9 }); await R.t(1, k => { c.rx.rz = Math.sin(k * 60) * .03; c.squash = Math.sin(k * 40) * .03; }, ease.linear); } },
    { line: '앗, 깜짝이야!', run: async (c, R) => { R.face('wow'); R.sfx('gasp'); R.fx('excl', { x: .3, y: .95 }); await R.jump(.5, .38); R.pose('flail'); await R.wait(.45); } },
  ],
  peng: [
    { line: '뒤뚱뒤뚱~', run: async (c, R) => { R.face('happy'); R.pose('cheer'); for (let i = 0; i < 4; i++) { R.sfx('hop', i * 2); await R.t(.24, k => { c.rx.rz = (i % 2 ? 1 : -1) * Math.sin(k * Math.PI) * .22; c.rx.y = Math.sin(k * Math.PI) * .06; }, ease.linear); } } },
    { line: '펭!', run: async (c, R) => { R.pose('flail'); R.face('wow'); R.sfx('pop', 6); await R.jump(.3, .32); await R.wait(.5); } },
    { line: '쭈욱~ 미끄럼!', run: async (c, R) => { R.face('happy'); R.sfx('whoosh'); R.fx('sparkle', { x: .4, y: .6 }); await all([R.spin(1, .8), R.t(.8, k => { c.rx.rx = Math.sin(k * Math.PI) * .35; }, ease.linear)]); } },
  ],
  mom: [
    { line: '몽글아, 숙제는?', run: async (c, R) => { R.pose('hips'); R.face('sus'); R.sfx('hmm'); await R.t(.3, k => { c.rx.rx = -.12 * k; }); await R.wait(.6); await R.t(.25, k => { c.rx.rx = -.12 * (1 - k); }); } },
    { line: '우리 몽글이~', run: async (c, R) => { R.face('happy'); R.sfx('giggle'); R.hearts(3, { y: 1.0 }); await R.wobble(.1, .9, 2); } },
    { line: '방 정리했어?!', run: async (c, R) => { R.pose('hips'); R.face('angry'); R.sfx('angry'); R.fx('anger', { x: .35, y: .95 }); c.squash = .3; await R.wait(.25); c.squash = .3; R.sfx('land'); await R.wait(.65); } },
  ],
  grumpy: [
    { line: '뭘 봐?', run: async (c, R) => {
      R.sfx('angry'); R.fx('puff', { x: -.3, y: .55, rise: .2, dur: .5, s: 1.1 }); R.fx('puff', { x: -.45, y: .45, rise: .15, dur: .45, delay: .08 });
      c.squash = .25; await R.to('ry', 2.6, .26);
      await R.wait(.3);
      R.face('normal'); c.lids?.forEach(l => (l.visible = false)); R.shy(true);
      await R.to('ry', .75, .3, ease.outBack); R.fx('heart', { x: .35, y: .85, s: .75, dur: .6 }); R.sfx('pop', 7);
      await R.wait(.3);
    } },
    { line: '흥! 관심 없거든?', run: async (c, R) => {
      R.face('angry'); R.sfx('angry'); R.fx('anger', { x: .38, y: .95 });
      for (let i = 0; i < 2; i++) { c.squash = .32; R.sfx('land', 0, .02); await R.t(.2, k => { c.rx.y = Math.sin(k * Math.PI) * .06; }, ease.linear); }
      await R.to('ry', -.5, .2); R.fx('heart', { x: -.45, y: .7, s: .6, dur: .55 }); await R.wait(.35);
    } },
    { line: '…딱히 고마운 건 아냐.', run: async (c, R) => {
      R.shy(true); R.sfx('hmm');
      await R.t(.3, k => { c.rx.rx = .22 * k; c.rx.ry = -.35 * k; });
      R.fx('drop', { x: .4, y: .75, rise: -.12, dur: .6 });
      await R.t(.6, k => { c.rx.x = Math.sin(k * Math.PI * 2) * .03; }, ease.linear);
      await R.t(.25, k => { c.rx.rx = .22 * (1 - k); c.rx.ry = -.35 * (1 - k); });
    } },
  ],
  skater: [
    { line: '킥플립!', run: async (c, R) => {
      c.squash = .3; await R.wait(.08); R.sfx('whoosh'); R.face('happy');
      await R.t(.62, k => { const a = 4 * k * (1 - k); c.rx.y = .6 * a; c.rx.by = .42 * a; c.rx.bflip = Math.PI * 2 * ease.inOutCubic(k); }, ease.linear);
      c.rx.bflip = 0; c.squash = .38; R.sfx('land'); R.fx('star', { x: .5, y: .35, rise: .2, dur: .5, s: .8 });
      await R.wait(.35);
    } },
    { line: '360 쇼빗~', run: async (c, R) => {
      R.sfx('swish'); c.squash = .25;
      await R.t(.55, k => { const a = 4 * k * (1 - k); c.rx.y = .38 * a; c.rx.by = .22 * a; c.rx.bspin = Math.PI * 2 * ease.inOutQuad(k); }, ease.linear);
      c.rx.bspin = 0; c.squash = .3; R.sfx('land'); R.face('happy'); await R.wait(.45);
    } },
    { line: '요! 보드킹 등장~', run: async (c, R) => {
      R.face('happy'); R.sfx('swish'); R.fx('sparkle', { x: -.45, y: .8 });
      await R.t(.9, k => { const a = Math.sin(k * Math.PI); c.rx.bz = .2 * a; c.rx.rz = .14 * a; c.rx.x = Math.sin(k * Math.PI * 2) * .12; c.rx.y = .04 * a; }, ease.inOutSine);
      await R.wait(.15);
    } },
  ],
  sleepy: [
    { line: '헉! 안 잤어…', run: async (c, R) => {
      R.face('wow'); R.sfx('gasp'); R.fx('excl', { x: .32, y: .95, dur: .6 }); R.pose('flail');
      await R.jump(.32, .3); R.pose('idle');
      await R.wait(.25); R.face('sus'); R.sfx('phew');
      await R.t(.45, k => { c.rx.rx = .2 * k; c.rx.rz = .08 * k; });
    } },
    { line: '하아아암… 5분만…', run: async (c, R) => {
      R.pose('stretch'); R.face('happy'); c.mouthD.visible = false; c.mouthO.visible = true; c.mouthO.scale.set(1.3, 1.5, 1); R.sfx('phew');
      await R.t(.55, k => { c.rx.rx = -.22 * k; c.squash = -.16 * k; });
      await R.wait(.25); await R.t(.35, k => { c.rx.rx = -.22 * (1 - k); });
    } },
    { line: '음냐음냐… 케이크…', run: async (c, R) => {
      R.sfx('hmm'); R.fx('heart', { x: .38, y: .9, s: .8, dur: 1 }); R.fx('z', { x: -.35, y: .85, dur: 1 });
      await R.t(1.05, k => { c.rx.rz = Math.sin(k * Math.PI * 2) * .12; c.squash = Math.abs(Math.sin(k * Math.PI * 6)) * .06; }, ease.linear);
    } },
  ],
  nerd: [
    { line: '흠, 흥미롭군.', run: async (c, R) => {
      R.pose('push'); R.sfx('tap');
      await R.to('gy', .045, .16); R.sfx('coin'); R.fx('sparkle', { x: -.18, y: .45, z: .56, rise: .05, dur: .55, s: 1.1, spin: 2 });
      await R.wait(.3); await R.to('gy', 0, .2); await R.wait(.25);
    } },
    { line: '유레카!', run: async (c, R) => {
      R.face('wow'); R.pose('cheer'); R.sfx('special'); R.fx('excl', { x: .35, y: 1.05 }); R.fx('star', { x: -.35, y: .95, delay: .1 });
      await R.jump(.38, .4); await R.wait(.5);
    } },
    { line: '이론상 완벽해!', run: async (c, R) => {
      R.face('happy'); R.sfx('pop', 5);
      for (let i = 0; i < 2; i++) await R.t(.28, k => { c.rx.rx = Math.sin(k * Math.PI) * .22; }, ease.linear);
      R.fx('sparkle', { x: .4, y: .85 }); await R.wait(.4);
    } },
  ],
  shiba: [
    { line: '멍멍! 놀자!', run: async (c, R) => { R.face('happy'); R.sfx('giggle'); c.rx.wag = 1; await all([R.spin(1, .75), R.t(.75, k => { c.rx.y = Math.abs(Math.sin(k * Math.PI * 3)) * .12; }, ease.linear)]); await R.wait(.3); } },
    { line: '산책 가요?!', run: async (c, R) => { R.face('wow'); c.rx.wag = 1; R.sfx('hop', 4); await R.jump(.35, .32); R.face('happy'); R.hearts(2); R.sfx('hop', 6); await R.jump(.3, .3); await R.wait(.35); } },
    { line: '멍?', run: async (c, R) => { R.sfx('hmm'); R.fx('ques', { x: .38, y: .95 }); await all([R.to('rz', .3, .25, ease.outBack), R.to('ear', -.35, .2)]); await R.wait(.55); await all([R.to('rz', 0, .25), R.to('ear', 0, .25)]); } },
  ],
  hamster: [
    { line: '볼 빵빵!', run: async (c, R) => { R.face('happy'); R.sfx('pop', 3); await R.to('cheek', 1, .25, ease.outBack); R.sfx('pop', 6); await R.wait(.55); await R.to('cheek', 0, .3); } },
    { line: '쪼르르르!', run: async (c, R) => { R.face('wow'); for (let i = 0; i < 5; i++) { R.sfx('tap', i); await R.t(.13, k => { c.rx.y = Math.sin(k * Math.PI) * .09; c.rx.ry = Math.sin((i + k) / 5 * Math.PI * 2) * .5; }, ease.linear); } c.rx.ry = 0; await R.wait(.3); } },
    { line: '냠냠냠', run: async (c, R) => { R.face('happy'); R.pose('lick'); await R.to('lick', 1, .2); for (let i = 0; i < 4; i++) { R.sfx('tap', 8); await R.t(.15, k => { c.squash = Math.sin(k * Math.PI) * .1; }, ease.linear); } await R.to('lick', 0, .2); } },
  ],
  frog: [
    { line: '개굴!', run: async (c, R) => { c.squash = .35; await R.wait(.1); R.sfx('hop', 2); R.face('happy'); await R.jump(.65, .5); R.sfx('land'); await R.wait(.4); } },
    { line: '날름!', run: async (c, R) => { R.face('wow'); R.sfx('swish'); await R.to('tongue', 1, .12); await R.wait(.12); await R.to('tongue', 0, .14); R.face('happy'); R.sfx('pop', 8); await R.wait(.5); } },
    { line: '개굴개굴~♪', run: async (c, R) => { R.face('happy'); R.sfx('pop', 2); R.fx('note', { x: -.38, y: .8 }); R.fx('note', { x: .4, y: .9, delay: .25 }); R.sfx('pop', 5, .25); await R.wobble(.15, 1, 2); } },
  ],
  raccoon: [
    { line: '숨바꼭질 하자!', run: async (c, R) => { R.pose('wave'); R.face('happy'); R.sfx('pop', 6); await R.jump(.3, .32); await R.wait(.6); } },
    { line: '꼭꼭 숨어라~ 머리카락 보일라!', run: async (c, R) => { R.pose('cover'); R.face('happy'); R.sfx('giggle'); await R.wobble(.12, .9, 2.5); } },
    { line: '찾았다! …아직 아니구나', run: async (c, R) => { R.pose('point'); R.face('wow'); R.sfx('gasp'); R.fx('excl', { x: .35, y: .95 }); await R.jump(.25, .3); await R.wait(.5); } },
  ],
  panda: [
    { line: '데굴데굴~', run: async (c, R) => {
      R.face('happy'); R.sfx('whoosh'); const h = .4;
      await R.t(.75, k => { const a = Math.PI * 2 * k; c.rx.rx = a; c.rx.y = h * (1 - Math.cos(a)) * .5 + Math.sin(k * Math.PI) * .25; c.rx.z = h * Math.sin(a) * .5; }, ease.inOutCubic);
      c.rx.rx = 0; c.rx.z = 0; c.squash = .3; R.sfx('land'); await R.wait(.35);
    } },
    { line: '대나무 있어?', run: async (c, R) => { R.face('sus'); R.sfx('hmm'); R.fx('ques', { x: .38, y: 1 }); await R.t(.35, k => { c.rx.rz = .18 * k; }); await R.wait(.42); await R.t(.3, k => { c.rx.rz = .18 * (1 - k); }); } },
    { line: '판다 최고!', run: async (c, R) => { R.pose('clap'); R.face('happy'); R.sfx('pop', 4); R.sfx('pop', 7, .2); R.fx('star', { x: -.38, y: .9 }); R.fx('star', { x: .4, y: 1, delay: .15 }); await R.jump(.2, .3); await R.wait(.7); } },
  ],
  coolcat: [
    { line: '…뭐야, 너였어?', run: async (c, R) => { R.sfx('swish'); await R.to('gy', -.13, .2); R.face('sus'); await R.wait(.5); await R.to('gy', 0, .2); R.face('normal'); await R.wait(.12); } },
    { line: '훗, 쿨하게 패스.', run: async (c, R) => { R.sfx('coin'); R.fx('sparkle', { x: .2, y: .5, z: .56, rise: .05, dur: .6, spin: 2 }); await R.t(.35, k => { c.rx.rz = -.16 * k; c.rx.rx = -.1 * k; }, ease.outBack); await R.wait(.45); await R.t(.3, k => { c.rx.rz = -.16 * (1 - k); c.rx.rx = -.1 * (1 - k); }); } },
    { line: '난 원래 멋져.', run: async (c, R) => { R.pose('point'); R.sfx('pop', 9); c.rx.wag = 1; R.fx('star', { x: .55, y: .7 }); await R.t(.2, k => { c.rx.rz = -.1 * Math.sin(k * Math.PI); }); await R.wait(.75); } },
  ],
  squirrel: [
    { line: '달콤해~', run: async (c, R) => { R.face('happy'); R.pose('lick'); R.sfx('giggle'); await R.to('lick', 1, .2); R.hearts(2, { y: .95 }); await R.t(.5, k => { c.squash = Math.sin(k * Math.PI * 3) * .06; }, ease.linear); await R.to('lick', 0, .2); } },
    { line: '쪼르르!', run: async (c, R) => { R.sfx('swish'); R.face('wow'); await all([R.spin(1, .6), R.to('fluff', 1, .3)]); R.face('happy'); await R.to('fluff', 0, .35); await R.wait(.2); } },
    { line: '반가워!', run: async (c, R) => { R.pose('wave'); R.face('happy'); R.sfx('pop', 6); await R.jump(.28, .32); await R.wait(.7); } },
  ],
  snowy: [
    { line: '으슬으슬~', run: async (c, R) => { R.face('sweat'); R.sfx('wobble'); await R.t(.9, k => { c.rx.x = Math.sin(k * 90) * .018; c.squash = Math.sin(k * 70) * .03; }, ease.linear); c.rx.x = 0; } },
    { line: '에… 에취!', run: async (c, R) => { R.face('sus'); await R.t(.4, k => { c.rx.rx = -.18 * k; }); R.face('wow'); R.sfx('pop', 1); R.fx('puff', { x: 0, y: .35, z: .7, rise: .1, dur: .5, s: 1.3 }); await R.t(.14, k => { c.rx.rx = -.18 + .4 * k; }); c.squash = .3; await R.t(.35, k => { c.rx.rx = .22 * (1 - k); }); } },
    { line: '눈 온다!', run: async (c, R) => { R.face('happy'); R.sfx('special'); R.fx('sparkle', { x: -.4, y: 1 }); R.fx('sparkle', { x: .35, y: 1.1, delay: .15 }); R.fx('sparkle', { x: 0, y: 1.2, delay: .3 }); await all([R.spin(1, .7), R.jump(.25, .7)]); await R.wait(.3); } },
  ],
  paint: [
    { line: '뚜껑 열렸다!', run: async (c, R) => { R.face('wow'); R.sfx('pop', 3); c.squash = .3; await R.to('lid', 1, .28, ease.outQuad); R.fx('heart', { x: -.35, y: .8 }); R.fx('star', { x: .38, y: .85, delay: .1 }); await R.to('lid', 0, .3, ease.inQuad); R.sfx('land'); c.squash = .3; R.face('happy'); await R.wait(.35); } },
    { line: '알록달록~', run: async (c, R) => { R.face('happy'); R.sfx('swish'); R.fx('sparkle', { x: -.4, y: .7 }); R.fx('star', { x: .4, y: .8, delay: .15 }); await all([R.spin(1, .65), R.jump(.25, .65)]); R.sfx('pop', 6); await R.wait(.3); } },
    { line: '앗, 흘렸다…', run: async (c, R) => { R.face('sweat'); R.sfx('wobble'); await all([R.to('drip', 1, .5), R.wobble(.12, .9, 2)]); await R.to('drip', 0, .2); } },
  ],
  mug: [
    { line: '따끈따끈~', run: async (c, R) => { R.face('happy'); R.sfx('phew'); R.fx('puff', { x: -.15, y: .75, rise: .4, dur: .9 }); R.fx('puff', { x: .15, y: .8, rise: .45, dur: .9, delay: .15 }); R.fx('heart', { x: .4, y: .7, delay: .3 }); await R.wobble(.1, 1, 2); } },
    { line: '딸꾹!', run: async (c, R) => { R.face('wow'); R.sfx('pop', 8); await all([R.jump(.22, .26), R.t(.26, k => { c.rx.lid = Math.sin(k * Math.PI); }, ease.linear)]); R.face('sus'); await R.wait(.3); R.sfx('pop', 9); await all([R.jump(.16, .22), R.t(.22, k => { c.rx.lid = Math.sin(k * Math.PI) * .7; }, ease.linear)]); await R.wait(.15); } },
    { line: '한 모금 할래?', run: async (c, R) => { R.face('happy'); R.sfx('hmm'); await R.to('rz', -.3, .3, ease.outBack); R.fx('heart', { x: .3, y: .75 }); await R.wait(.45); await R.to('rz', 0, .3); } },
  ],
  cone: [
    { line: '삐뽀삐뽀!', run: async (c, R) => { R.face('wow'); R.sfx('whoosh'); R.fx('excl', { x: .35, y: .85 }); await all([R.spin(2, .85, ease.inOutQuad), R.jump(.22, .85)]); R.face('happy'); await R.wait(.2); } },
    { line: '여긴 출입금지!', run: async (c, R) => { R.face('angry'); R.pose('flail'); R.sfx('angry'); R.fx('anger', { x: .35, y: .85 }); for (let i = 0; i < 3; i++) await R.t(.2, k => { c.rx.rz = (i % 2 ? 1 : -1) * Math.sin(k * Math.PI) * .15; }, ease.linear); await R.wait(.3); } },
    { line: '꼬깔 점프!', run: async (c, R) => { c.squash = .35; await R.wait(.1); R.sfx('hop', 3); R.face('happy'); await R.jump(.55, .5); R.sfx('land'); R.fx('star', { x: .4, y: .5, rise: .2, dur: .5 }); await R.wait(.35); } },
  ],
  robot: [
    { line: '삐빅! 분석 완료', run: async (c, R) => { R.face('sus'); R.sfx('coin'); c.rx.ant = 1; await R.to('ry', .5, .2); await R.to('ry', -.5, .3); await R.to('ry', 0, .2); R.face('happy'); R.sfx('coin', 4); R.fx('sparkle', { x: .38, y: .85 }); await R.wait(.35); } },
    { line: '로봇 댄스!', run: async (c, R) => { R.face('happy'); R.pose('cheer'); c.rx.ant = 1; for (let i = 0; i < 4; i++) { R.sfx('tap', [0, 4, 7, 12][i]); c.rx.rz = (i % 2 ? 1 : -1) * .14; c.rx.y = .05; c.squash = .12; await R.wait(.22); } c.rx.rz = 0; c.rx.y = 0; } },
    { line: '오류… 오류…', run: async (c, R) => { R.face('dizzy'); R.sfx('wobble'); c.rx.ant = 1; R.fx('ques', { x: .38, y: .85 }); await R.wobble(.16, 1, 3); } },
  ],
  tv: [
    { line: '채널 돌리는 중~', run: async (c, R) => { c.rx.screen = 1; for (const f of ['wow', 'happy', 'sus', 'happy']) { R.face(f); R.sfx('tap', 6); await R.wait(.22); } c.rx.screen = 0; R.face('happy'); await R.wait(.2); } },
    { line: '지지직…', run: async (c, R) => { R.face('dizzy'); c.rx.screen = 1; R.sfx('wobble'); await R.t(.9, k => { c.rx.x = Math.sin(k * 70) * .02; c.rx.ear = Math.sin(k * 30) * .25; }, ease.linear); c.rx.x = 0; c.rx.ear = 0; } },
    { line: '오늘의 날씨는 맑음!', run: async (c, R) => { R.face('happy'); R.pose('cheer'); R.sfx('special'); R.fx('star', { x: -.4, y: .85 }); R.fx('sparkle', { x: .4, y: .95, delay: .15 }); await R.jump(.3, .4); await R.wait(.6); } },
  ],
  sundae: [
    { line: '달콤 한 입!', run: async (c, R) => { R.face('happy'); R.sfx('pop', 5); await R.t(.55, k => { c.rx.cherry = Math.sin(k * Math.PI); }, ease.linear); c.rx.cherry = 0; R.sfx('land'); R.hearts(2, { y: .85 }); await R.wait(.45); } },
    { line: '녹는다 녹아~', run: async (c, R) => { R.face('sweat'); R.sfx('wobble'); await R.t(.6, k => { c.squash = .28 * k; c.rx.rz = Math.sin(k * Math.PI * 2) * .06; }); R.face('happy'); await R.t(.35, k => { c.squash = .28 * (1 - k); }); } },
    { line: '체리 뿅!', run: async (c, R) => { R.face('wow'); R.sfx('special'); R.fx('sparkle', { x: -.4, y: .8 }); R.fx('sparkle', { x: .4, y: .9, delay: .12 }); await all([R.spin(1, .7), R.t(.7, k => { c.rx.cherry = Math.sin(k * Math.PI) * .6; }, ease.linear)]); c.rx.cherry = 0; await R.wait(.3); } },
  ],
  dj: [
    { line: '둠칫둠칫~', run: async (c, R) => { R.face('happy'); for (let i = 0; i < 4; i++) { R.sfx('pop', [0, 4, 7, 4][i]); if (i % 2 === 0) R.fx('note', { x: i ? .42 : -.42, y: .85 }); await R.t(.25, k => { c.squash = Math.sin(k * Math.PI) * .18; c.rx.rz = (i % 2 ? .1 : -.1) * Math.sin(k * Math.PI); }, ease.linear); } } },
    { line: '이 노래 좋지?', run: async (c, R) => { R.pose('phones'); R.face('happy'); R.sfx('pop', 9); R.fx('note', { x: .45, y: .9 }); await R.wobble(.12, .9, 2); } },
    { line: '드랍 더 비트!', run: async (c, R) => { R.sfx('whoosh'); R.pose('cheer'); R.face('wow'); await all([R.spin(1, .6), R.jump(.4, .6)]); R.sfx('special'); R.fx('star', { x: -.4, y: .9 }); R.fx('star', { x: .4, y: .95, delay: .1 }); await R.wait(.4); } },
  ],
  // ── the cat gang
  cheese: [
    { line: '생선 최고냥!', run: async (c, R) => { R.face('happy'); R.pose('lick'); R.sfx('giggle'); await R.to('lick', 1, .2); R.hearts(2, { y: .95 }); await R.t(.5, k => { c.squash = Math.sin(k * Math.PI * 3) * .06; }, ease.linear); await R.to('lick', 0, .2); } },
    { line: '냥냥 펀치!', run: async (c, R) => { R.pose('paw'); R.face('angry'); R.sfx('swish'); await R.t(.16, k => { c.rx.lick = k; c.rx.rz = -.12 * k; }); R.fx('star', { x: .42, y: .7, rise: .15, dur: .45, s: .8 }); await R.t(.14, k => { c.rx.lick = 1 - k; }); R.sfx('swish'); await R.t(.16, k => { c.rx.lick = k; }); await R.t(.25, k => { c.rx.lick = 1 - k; c.rx.rz = -.12 * (1 - k); }); R.face('happy'); await R.wait(.2); } },
    { line: '골골골~', run: async (c, R) => { R.face('happy'); R.sfx('wobble'); c.rx.wag = 1; R.fx('heart', { y: .95, s: .9 }); await R.t(1, k => { c.rx.rz = Math.sin(k * 60) * .03; c.squash = Math.sin(k * 40) * .03; }, ease.linear); } },
  ],
  godeung: [
    { line: '고등어 아니고 고양이거든?', run: async (c, R) => { R.face('angry'); R.sfx('angry'); R.fx('anger', { x: .38, y: .95 }); c.squash = .3; await R.wait(.45); R.face('happy'); R.sfx('pop', 6); R.fx('heart', { x: -.35, y: .85, s: .8 }); await R.jump(.2, .3); await R.wait(.2); } },
    { line: '딸랑딸랑~', run: async (c, R) => { R.face('happy'); for (let i = 0; i < 4; i++) { R.sfx('tap', [7, 11, 7, 11][i]); await R.t(.2, k => { c.rx.rz = (i % 2 ? 1 : -1) * Math.sin(k * Math.PI) * .16; }, ease.linear); } R.fx('note', { x: .4, y: .85 }); await R.wait(.25); } },
    { line: '하암… 낮잠 잘 시간인데.', run: async (c, R) => { R.face('sus'); R.sfx('phew'); await R.t(.45, k => { c.squash = .2 * k; c.rx.rx = .15 * k; }); R.fx('z', { x: -.35, y: .85, dur: .8 }); await R.wait(.35); await R.t(.3, k => { c.squash = .2 * (1 - k); c.rx.rx = .15 * (1 - k); }); } },
  ],
  calico: [
    { line: '삼색이 왔다냥!', run: async (c, R) => { R.pose('wave'); R.face('happy'); R.sfx('pop', 5); R.fx('star', { x: -.38, y: .9 }); await R.jump(.3, .32); await R.wait(.6); } },
    { line: '꾹꾹이~ 꾹꾹~', run: async (c, R) => { R.face('happy'); R.pose('clap'); for (let i = 0; i < 4; i++) { R.sfx('tap', 4 + (i % 2) * 3); await R.t(.22, k => { c.squash = Math.sin(k * Math.PI) * .12; }, ease.linear); } R.hearts(2); await R.wait(.2); } },
    { line: '숨는 건 내가 최고야!', run: async (c, R) => { R.pose('cover'); R.face('happy'); R.sfx('giggle'); await R.wobble(.12, .9, 2.5); } },
  ],
  kkamang: [
    { line: '어둠 속에서… 짠!', run: async (c, R) => { R.face('sus'); R.sfx('hmm'); await R.t(.3, k => { c.squash = .25 * k; }); R.face('wow'); R.sfx('special'); R.fx('sparkle', { x: -.4, y: .8 }); R.fx('sparkle', { x: .4, y: .9, delay: .1 }); await R.jump(.4, .4); await R.wait(.3); } },
    { line: '까만 건 멋진 거야.', run: async (c, R) => { R.pose('point'); R.sfx('pop', 9); c.rx.wag = 1; R.fx('star', { x: .55, y: .7 }); await R.t(.2, k => { c.rx.rz = -.1 * Math.sin(k * Math.PI); }); await R.wait(.7); } },
    { line: '냐아~?', run: async (c, R) => { R.sfx('hmm'); R.fx('ques', { x: .38, y: .95 }); await all([R.to('rz', .3, .25, ease.outBack), R.to('ear', -.3, .2)]); await R.wait(.55); await all([R.to('rz', 0, .25), R.to('ear', 0, .25)]); } },
  ],
  hayang: [
    { line: '부, 부끄러워…', run: async (c, R) => { R.pose('cover'); R.shy(true); R.sfx('giggle'); R.fx('heart', { y: .9, s: .8 }); await R.wobble(.12, .9, 2.5); } },
    { line: '눈 색이 달라서 특별해!', run: async (c, R) => { R.face('wow'); R.sfx('special'); R.fx('sparkle', { x: -.38, y: .85 }); R.fx('sparkle', { x: .38, y: .9, delay: .12 }); await R.jump(.25, .35); R.face('happy'); await R.wait(.5); } },
    { line: '하양하양~', run: async (c, R) => { R.face('happy'); R.sfx('swish'); await all([R.spin(1, .7), R.jump(.25, .7)]); R.hearts(2, { y: .9 }); await R.wait(.3); } },
  ],
  tuxedo: [
    { line: '반가워요. 신사 고양이랍니다.', run: async (c, R) => { R.face('happy'); R.sfx('pop', 4); await R.t(.3, k => { c.rx.rx = .3 * k; }); R.fx('sparkle', { x: .35, y: .7 }); await R.wait(.35); await R.t(.3, k => { c.rx.rx = .3 * (1 - k); }); } },
    { line: '파티 시작이다냥!', run: async (c, R) => { R.pose('cheer'); R.face('wow'); R.sfx('special'); R.fx('note', { x: -.4, y: .85 }); R.fx('star', { x: .4, y: .95, delay: .1 }); await R.jump(.35, .4); await R.wait(.45); } },
    { line: '흠흠, 넥타이 삐뚤어졌나?', run: async (c, R) => { R.face('sus'); R.pose('push'); R.sfx('hmm'); await R.t(.3, k => { c.rx.rz = -.12 * k; }); await R.wait(.4); await R.t(.25, k => { c.rx.rz = -.12 * (1 - k); }); R.face('happy'); await R.wait(.2); } },
  ],
  churro: [
    { line: '이건 추로님의 책상이다.', run: async (c, R) => { R.face('sus'); R.sfx('hmm'); await R.t(.35, k => { c.squash = .18 * k; }); await R.wait(.4); await R.t(.25, k => { c.squash = .18 * (1 - k); }); R.face('happy'); R.fx('heart', { x: .35, y: .9, s: .8 }); await R.wait(.3); } },
    { line: '추로님이 왔다. 쓰다듬어도 좋다.', run: async (c, R) => { R.face('happy'); R.sfx('pop', 6); c.rx.wag = 1; R.hearts(2, { y: .95 }); await R.jump(.25, .32); await R.wait(.4); } },
    { line: '…마우스 위는 추로님 자리다.', run: async (c, R) => { R.face('happy'); R.sfx('wobble'); await R.t(.9, k => { c.rx.rz = Math.sin(k * 50) * .025; c.squash = Math.sin(k * 36) * .03; }, ease.linear); R.fx('z', { x: -.35, y: .85, dur: .8 }); await R.wait(.3); } },
  ],
  // ── object friends
  milk: [
    { line: '우유 마시고 쑥쑥!', run: async (c, R) => { R.face('happy'); R.pose('cheer'); R.sfx('pop', 4); await R.t(.3, k => { c.squash = -.25 * Math.sin(k * Math.PI); }); R.fx('star', { x: .4, y: .9 }); await R.jump(.3, .35); await R.wait(.3); } },
    { line: '흔들지 마~ 거품 난다!', run: async (c, R) => { R.face('dizzy'); R.sfx('wobble'); R.fx('puff', { x: -.2, y: .95, rise: .3, dur: .7 }); R.fx('puff', { x: .2, y: 1, rise: .35, dur: .7, delay: .15 }); await R.wobble(.18, 1, 3); } },
    { line: '빨대 꽂아 줄래?', run: async (c, R) => { R.face('wow'); R.sfx('hmm'); await R.to('rz', .2, .25, ease.outBack); R.face('happy'); R.hearts(2, { y: .95 }); await R.wait(.45); await R.to('rz', 0, .25); } },
  ],
  toast: [
    { line: '토스터에서 뿅!', run: async (c, R) => { c.squash = .35; await R.wait(.1); R.sfx('pop', 7); R.face('wow'); await all([R.jump(.7, .55), R.spin(1, .55)]); R.sfx('land'); R.face('happy'); R.fx('star', { x: .4, y: .5, rise: .2, dur: .5 }); await R.wait(.3); } },
    { line: '바삭바삭~', run: async (c, R) => { R.face('happy'); for (let i = 0; i < 3; i++) { R.sfx('tap', 5 + i * 2); await R.t(.2, k => { c.rx.y = Math.sin(k * Math.PI) * .08; c.rx.rz = (i % 2 ? .08 : -.08) * Math.sin(k * Math.PI); }, ease.linear); } R.fx('sparkle', { x: .38, y: .85 }); await R.wait(.25); } },
    { line: '버터 녹는다~', run: async (c, R) => { R.face('sweat'); R.sfx('wobble'); await R.t(.6, k => { c.squash = .25 * k; c.rx.toast = k; }); R.face('happy'); await R.t(.35, k => { c.squash = .25 * (1 - k); c.rx.toast = 1 - k; }); } },
  ],
  onigiri: [
    { line: '밥 먹었어?', run: async (c, R) => { R.pose('wave'); R.face('happy'); R.sfx('pop', 5); await R.jump(.25, .3); await R.wait(.65); } },
    { line: '꼭꼭 뭉쳤다!', run: async (c, R) => { R.face('angry'); R.sfx('tap', 2); for (let i = 0; i < 3; i++) { c.squash = .3; R.sfx('land', 0, .02); await R.wait(.2); } R.face('happy'); R.fx('star', { x: .38, y: .85 }); await R.wait(.3); } },
    { line: '김이 바삭해~', run: async (c, R) => { R.face('happy'); R.sfx('swish'); await all([R.spin(1, .65), R.jump(.22, .65)]); R.hearts(2, { y: .85 }); await R.wait(.3); } },
  ],
  pot: [
    { line: '물 주세요~', run: async (c, R) => { R.face('sad'); R.sfx('phew'); await R.to('leaf', -1, .35); await R.wait(.25); R.fx('drop', { x: 0, y: 1.05, rise: -.25, dur: .5 }); R.sfx('pop', 6, .3); await R.wait(.35); R.face('happy'); await R.to('leaf', 0, .3, ease.outBack); } },
    { line: '쑥쑥 자란다!', run: async (c, R) => { R.face('wow'); R.sfx('special'); await R.to('leaf', 1, .35, ease.outBack); R.fx('sparkle', { x: -.35, y: 1 }); R.fx('sparkle', { x: .38, y: 1.1, delay: .12 }); await R.wait(.35); R.face('happy'); await R.to('leaf', 0, .3); } },
    { line: '햇볕 좋다~', run: async (c, R) => { R.face('happy'); R.sfx('giggle'); R.hearts(2, { y: .95 }); await R.wobble(.12, 1, 2); } },
  ],
};

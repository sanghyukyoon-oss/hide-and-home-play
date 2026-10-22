// 지키기 도구 모델 (털기 지키기 — ② 기획 _handoff/defense-items-plan-1022.md, ① 10/22): three small pieces, each read at a
// glance at 28 px, in the house's ink-outline toon like everything else.
//   alarmBell()   경보 벨 — a padlock-sized brass bell on a steel clip, its clapper under the rim; hung on a drawer or a door
//                 the way a padlock is (attachBell), ring(t) shakes it (t: seconds since it went off)
//   bananaPeel()  바나나 껍질 — a peel lying flat, three yellow strips opened out from the stem, cream inside, brown freckles;
//                 B.bananapeel places it on the floor as a small piece (no places to hide, nothing in the way)
//   springFace()  미끼 상자 얼굴 — 몽글이's head on a coiled spring with a wink and its tongue out ("메롱!"), sitting folded in a
//                 box; pop(k) springs it up (k 0 → 1, with an overshoot), attachSpringFace(parcel) puts it in a parcel
// Same toy contract as the other *-props.js: origin on the floor (or at the hook), facing +z.
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const BRASS = '#ffc93c', BRASS2 = '#e0a020', STEEL = '#c9cfd8', STEEL2 = '#9aa3b2', RED = '#e8414e';
const BAN = '#ffe27a', BAN2 = '#f2c94c', BANIN = '#fff4d0', BROWN = '#8a6a3a';
const MONG = '#fff6ee', MONGEAR = '#ffcfae', INK = '#2a1d33', BLUSH = '#ffb3c4', TONGUE = '#ff7a96';

// ── 경보 벨: the clip at the origin (where it hangs from), the bell swinging under it
export function alarmBell() {
  const g = grp(), sw = grp();
  g.add(mc('def-bell-clip', ({ add }) => {
    add(G.tor(.024, .007, PI * 2, 5, 14), STEEL, 0, 0, 0);                     // the ring it hangs by
    add(G.box(.034, .024, .014, .005), STEEL2, 0, -.032, 0);                    // the clip block
    add(G.box(.05, .018, .008, .004), RED, 0, -.026, .01, 0, 0, .25); add(G.box(.05, .018, .008, .004), RED, 0, -.026, .01, 0, 0, -.25);   // a red bow on it
    add(G.sph(.009, 6, 5), RED, 0, -.026, .016);
  }));
  put(sw, 0, -.044, 0); g.add(sw);
  sw.add(mc('def-bell', ({ add }) => {
    const P = [[.062, -.112], [.064, -.104], [.054, -.094], [.046, -.07], [.038, -.04], [.026, -.018], [.012, -.006], [0, 0]].map(([r, y]) => new THREE.Vector2(r, y));
    add(new THREE.LatheGeometry(P, 16), BRASS, 0, 0, 0);
    add(G.tor(.06, .007, PI * 2, 5, 18), BRASS2, 0, -.104, 0, HP, 0, 0);          // the rim's lip
    add(G.tor(.042, .004, PI * 2, 4, 16), BRASS2, 0, -.07, 0, HP, 0, 0);          // a band round its waist
    add(G.sph(.012, 8, 6), BRASS2, 0, .004, 0);                                    // the knob on top
    add(G.cyl(.003, .003, .03, 5), STEEL2, 0, -.11, 0); add(G.sph(.016, 8, 6), '#6b5a4a', 0, -.128, 0);   // the clapper
    add(G.box(.02, .03, .004, .002), '#fff3c4', -.02, -.05, .043, 0, .4, -.2);   // a shine on it
  }));
  const ring = t => {
    const k = Math.max(0, 1 - t / 1.4);
    sw.rotation.z = Math.sin(t * 38) * .55 * k; sw.rotation.x = Math.sin(t * 29 + 1) * .2 * k;
  };
  return { g, sw, ring };
}
// hang a bell where a padlock would go on this part (beside it when the part is padlocked too — the plan lets both share one
// drawer); returns the bell, its meshes taking taps as the part's
export function attachBell(furn, part) {
  const L = part.lockAt || furn.lockAt; if (!L) return null;
  const b = alarmBell(); put(b.g, L.x + (part.lock ? .12 : 0), L.y + .05, L.z + .012);
  b.g.traverse(o => { if (o.isMesh) { o.userData.part = part; o.userData.furn = furn; } });
  (L.parent || furn.group).add(b.g); part.bellMesh = b.g;
  return b;
}

// ── 바나나 껍질: three strips opened out round the stem, lying on the floor
// a strip of peel, drawn already turned to its angle a in the floor's plane (the shape is laid flat afterwards)
const strip = (L, W, a) => {
  const c = Math.cos(a), sn = Math.sin(a), r = (x, y) => [x * c - y * sn, x * sn + y * c];
  const s = new THREE.Shape(); s.moveTo(...r(0, -W * .5)); s.quadraticCurveTo(...r(L * .55, -W * .75), ...r(L, 0)); s.quadraticCurveTo(...r(L * .55, W * .75), ...r(0, W * .5)); s.closePath(); return s;
};
export function bananaPeel() {
  const g = grp();
  g.add(mc('def-peel', ({ add }) => {
    for (const [a, L] of [[.25, .17], [2.35, .15], [4.25, .16]]) {
      // each strip: yellow outside (a darker rim under it), the cream inside on top, its tip browned
      add(G.ext(strip(L * 1.03, .092, a), .006, .002, 4), BAN2, 0, .003, 0, -HP, 0, 0);
      add(G.ext(strip(L, .084, a), .008, .003, 4), BAN, 0, .007, 0, -HP, 0, 0);
      add(G.ext(strip(L * .86, .056, a), .004, 0, 4), BANIN, Math.cos(a) * .008, .019, -Math.sin(a) * .008, -HP, 0, 0);
      const tx = Math.cos(a) * L, tz = -Math.sin(a) * L;
      add(G.sph(.018, 8, 6), '#b98a3a', tx * .97, .016, tz * .97, 0, 0, 0, [1.1, .5, 1.1]);
      for (const f of [.4, .62, .8]) add(G.sph(.008, 5, 3), BROWN, Math.cos(a + .1) * L * f, .0165, -Math.sin(a + .1) * L * f, 0, 0, 0, [1, .4, 1]);
    }
    // the stem where the strips meet, and the bit of fruit-end in the middle
    add(G.sph(.034, 10, 8), BAN, 0, .02, 0, 0, 0, 0, [1, .7, 1]);
    add(G.cyl(.016, .02, .06, 8), BAN2, -.03, .046, .02, 0, .4, HP - .5); add(G.cyl(.017, .017, .012, 8), '#5a4632', -.058, .06, .03, 0, .4, HP - .5);   // the stem and its dark end
  }));
  return g;
}
export const DEFENSE_BUILDERS = {
  // a peel on the floor as a small piece: nothing hides under it, nobody walks round it
  bananapeel: f => { f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0]; f.add(bananaPeel()); },
};
export const DEFENSE_INFO = { bananapeel: { w: 1, d: 1, name: '바나나 껍질', hidden: true, small: true } };

// ── 미끼 상자 얼굴: the spring standing at the origin, 몽글이's head on top
export function springFace() {
  const g = grp(), sp = grp(), head = grp();
  g.add(sp); g.add(head);
  // the coil: one tube round a helix (scaled in y to spring it)
  const SL = .3, pts = []; for (let i = 0; i <= 56; i++) { const t = i / 56, a = t * PI * 2 * 7; pts.push(new THREE.Vector3(Math.cos(a) * .03, t * SL, Math.sin(a) * .03)); }
  sp.add(mc('def-spring2', ({ add }) => { add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 112, .005, 4), STEEL, 0, 0, 0); add(G.cyl(.036, .036, .008, 10), STEEL2, 0, .004, 0); }));
  head.add(mc('def-mong', ({ add }) => {
    add(G.sph(.075, 14, 10), MONG, 0, .062, 0, 0, 0, 0, [1.12, .9, 1]);                                  // the round mochi head
    for (const sx of [-1, 1]) add(G.sph(.028, 8, 6), MONGEAR, sx * .082, .07, -.01, 0, 0, sx * -.5, [.7, 1.4, .6]);   // floppy ears hanging at its sides
    add(G.sph(.012, 8, 6), INK, .028, .072, .066, 0, 0, 0, [1, 1.2, .6]);                                // one eye open
    add(G.tor(.011, .0035, PI, 4, 10), INK, -.03, .07, .066, 0, 0, 0);                                    // the other winking (^)
    for (const sx of [-1, 1]) add(G.sph(.014, 8, 6), BLUSH, sx * .052, .05, .058, 0, 0, 0, [1.2, .7, .4]);
    add(G.tor(.012, .003, PI, 4, 10), INK, 0, .048, .07, 0, 0, PI);                                       // the mouth
    add(G.sph(.013, 8, 6), TONGUE, .004, .03, .068, 0, 0, -.2, [1, 1.3, .6]);                            // the tongue out: 메롱
  }));
  const pop = k => {
    // k 0: folded down in the box; k 1: up, after a springy overshoot
    const e = k <= 0 ? 0 : k >= 1 ? 1 : 1 - Math.cos(k * PI * 2.5) * Math.exp(-k * 4.5);
    sp.scale.y = .1 + .9 * e; head.position.y = SL * sp.scale.y - .01; head.rotation.z = Math.sin(k * PI * 4) * .25 * (1 - k);
  };
  pop(1);
  return { g, pop, head, spring: sp };
}
// in a parcel (apt-props parcel: its two flaps open from the middle): the face sits folded at the box's floor
export function attachSpringFace(parcel) {
  const s = springFace(); s.pop(0); put(s.g, 0, .03, 0); s.g.scale.setScalar(1.2); parcel.group.add(s.g);   // (up, the head clears the box's rim; down, it sits inside)
  return s;
}

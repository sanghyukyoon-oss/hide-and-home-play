// 특별 선물 (10/20, user: "모델링 막 만들어도 되면 선물들 모델링 좀 만들어 봐. ㅎㅎ"): the free gifts of 1~50판 are three (8판's
// robot, then one after 31판 and one after 49판, and about one in 17 past 50판 — econ.js GIFT_AT). These are the candidates
// for the special piece among them: things the shop never sells, a treasure to show off in my room. Each is one tile, a
// few chunky shapes under the ink line, and has
//   · one little motion of its own (f.live: groups that move; f.idle(t) moves them — room.js calls it every frame, bake.js
//     merges inside each live group instead of into the body, so it stays one mesh that can turn)
//   · a place to hide something (a drawer, a door, a lid that lifts)
// Origin = footprint centre on the floor, faces +z (same as furniture.js). The user picks; the econ session puts the pick
// in the gift table.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { sph, cyl, tor, cone, put, grp, mesh, mat, geo, starShape, heartShape } from './kit.js';

// light shapes (a gift stays under 2k vertices): kit.js's rounded box (2 segments), capsule and bevelled extrusion cost
// 150 / 390 / 470 vertices each; these are 56 (one bevel) / 90 / ~80
const rb = (w, h, d, c, r = .02, o) => { r = Math.min(r, Math.min(w, h, d) * .45);
  return mesh(geo(`grb|${w}|${h}|${d}|${r.toFixed(4)}`, () => r > .006 ? new RoundedBoxGeometry(w, h, d, 1, r) : new THREE.BoxGeometry(w, h, d)), mat(c, o)); };
const pill = (r, len, c, o) => mesh(geo(`gpl|${r}|${len}`, () => new THREE.CapsuleGeometry(r, len, 2, 8)), mat(c, o));
const flat = (shape, depth, c, o) => { const k = 'gfl|' + depth + '|' + shape.getPoints(5).map(p => p.x.toFixed(3) + ',' + p.y.toFixed(3)).join(';');
  return mesh(geo(k, () => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 5 }); g.center(); return g; }), mat(c, o)); };

const PI = Math.PI, HP = PI / 2;
const INK = '#2a1d33', WHITE = '#ffffff', CREAM = '#fff4e2', GOLD = '#ffc93c', GOLD2 = '#e8a72c', GOLDL = '#ffe48a',
  WOOD = '#e9b77c', WOODD = '#b97a45', PINK = '#ffb3cc', PINK2 = '#ff8fb0', MINT = '#7fd6c0', SKY = '#8fd3f4', NAVY = '#46559e',
  LEAF = '#6cc46a', LEAF2 = '#4ea85a', RED = '#ff6b6b', BUTTER = '#ffe27a', LILAC = '#b9a6ff', BLUSH = '#ff9fb5';
const MONG = '#fff6ee', MONGE = '#ffcfae';   // 몽글이's body and ears (chars.js)
const GLOW = c => ({ emissive: c, ei: 1.2 });
const GLASS = { opacity: .34 };

// a group that moves on its own (see the top); returns it so the builder can fill it
function live(f, parent = null) { const g = grp(); if (parent) parent.add(g); else f.add(g); (f.live ||= []).push(g); return g; }
// a tiny 몽글이 (the figurine on the music box, the friend in the photo): a squashy mochi, flop ears, eyes and blush
function mochi(g, body = MONG, ear = MONGE, kind = 'flop', s = 1) {
  g.add(put(sph(.07 * s, body, null, 10, 8), 0, .062 * s, 0, 0, 0, 0, [1, .88, .92]));
  if (kind === 'flop') for (const sx of [-1, 1]) g.add(put(sph(.03 * s, ear, null, 8, 6), sx * .058 * s, .1 * s, 0, 0, 0, sx * .6, [1, .62, .8]));
  if (kind === 'bunny') for (const sx of [-1, 1]) g.add(put(pill(.017 * s, .07 * s, ear), sx * .03 * s, .16 * s, -.005, 0, 0, -sx * .18));
  if (kind === 'bear') for (const sx of [-1, 1]) g.add(put(sph(.024 * s, ear, null, 8, 6), sx * .05 * s, .118 * s, 0));
  for (const sx of [-1, 1]) {
    g.add(put(sph(.0105 * s, INK, null, 6, 4), sx * .024 * s, .07 * s, .06 * s, 0, 0, 0, [1, 1.2, .6]));
    g.add(put(sph(.012 * s, BLUSH, null, 6, 4), sx * .044 * s, .05 * s, .054 * s, 0, 0, 0, [1.3, .7, .4]));
  }
}

const B = {};

// ── 1. 반짝 오르골 (music box): a pink lacquer box on gold feet, the lid propped open at the back with a mirror and a gold
// star in it; on top a little 몽글이 in a tutu turns round and round on its pin, the side crank turns with it.
// Hiding: the drawer in the front.
B.gf_musicbox = f => {
  const W = .58, H = .34, D = .42, y0 = .05;
  f.add(put(rb(W, H, D, PINK, .04), 0, y0 + H / 2, 0));
  f.add(put(rb(W + .03, .03, D + .03, GOLD, .012), 0, y0 + H, 0));                       // gold rim
  f.add(put(rb(W + .03, .03, D + .03, GOLD, .012), 0, y0 + .015, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.add(put(sph(.04, GOLD, null, 8, 5), sx * (W / 2 - .04), .035, sz * (D / 2 - .04)));
  for (const sx of [-1, 1]) f.add(put(flat(heartShape(.045), .012, WHITE), sx * .19, y0 + H * .62, D / 2 + .006));
  // the lid, propped open at the back: a mirror inside it and a star
  const lid = grp(); put(lid, 0, y0 + H + .015, -D / 2 + .01, -.38, 0, 0); f.add(lid);
  lid.add(put(rb(W, .38, .035, PINK2, .015), 0, .19, 0));
  lid.add(put(rb(W - .1, .28, .01, '#d8f2ff', .004), 0, .19, .02));
  lid.add(put(flat(starShape(.06, .027), .012, GOLD), 0, .3, .03));
  // the stage on top: a mirror disc and the dancer on its pin
  f.add(put(cyl(.15, .16, .025, '#d8f2ff', null, 20), 0, y0 + H + .028, .03));
  const spin = live(f); put(spin, 0, y0 + H + .04, .03);
  spin.add(put(cyl(.012, .012, .05, GOLD, null, 8), 0, .025, 0));
  spin.add(put(cone(.085, .05, PINK, null, 12), 0, .07, 0, PI, 0, 0));                     // the tutu
  const doll = live(f, spin); put(doll, 0, .07, 0); mochi(doll);
  doll.add(put(flat(starShape(.025, .011), .008, GOLD), 0, .145, 0));       // a star on her head
  // the side crank
  const crank = live(f); put(crank, W / 2 + .02, y0 + H * .55, 0);
  crank.add(put(cyl(.016, .016, .05, GOLD, null, 8), .02, 0, 0, 0, 0, HP));
  crank.add(put(rb(.016, .11, .02, GOLD, .006), .045, .045, 0));
  crank.add(put(sph(.026, WHITE, null, 10, 8), .06, .095, 0));
  // the drawer
  const dr = grp(); put(dr, 0, y0 + .1, D / 2 - .01); f.add(dr);
  dr.add(put(rb(.42, .13, .03, CREAM, .012), 0, 0, 0));
  dr.add(put(sph(.022, GOLD, null, 10, 8), 0, 0, .025));
  dr.add(put(rb(.38, .012, .32, PINK2, .004), 0, -.055, -.17));
  for (const sx of [-1, 1]) dr.add(put(rb(.012, .1, .32, PINK2, .004), sx * .19, -.01, -.17));
  dr.add(put(rb(.38, .1, .012, PINK2, .004), 0, -.01, -.33));
  const p = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .3 * t; }, { label: '오르골 서랍', sfx: 'drawer', dur: .26 });
  f.spot('inside', dr, 0, -.048, -.17, { part: p, maxH: .14, scale: .6, label: '오르골 서랍 안' });
  f.idle = t => { spin.rotation.y = t * 1.4; doll.position.y = .07 + Math.abs(Math.sin(t * 2.8)) * .012; crank.rotation.x = -t * 1.4; };
};

// ── 2. 회전목마 램프 (carousel lamp): a striped canopy with glowing bulbs round its edge, four little horses on gold poles
// going round and up and down. Hiding: the drawer in the drum it stands on.
B.gf_carousel = f => {
  f.add(put(cyl(.33, .35, .2, CREAM, null, 16), 0, .1, 0));
  f.add(put(cyl(.345, .345, .035, MINT, null, 16), 0, .18, 0));
  f.add(put(tor(.338, .014, GOLD, null, PI * 2, 3, 24), 0, .07, 0, HP, 0, 0));             // a gold band round the drum
  const ride = live(f); put(ride, 0, .2, 0);
  ride.add(put(cyl(.3, .3, .035, PINK, null, 18), 0, .018, 0));
  ride.add(put(cyl(.03, .03, .58, GOLD, null, 10), 0, .3, 0));
  ride.add(put(cone(.38, .2, MINT, null, 8), 0, .7, 0));
  ride.add(put(cone(.385, .2, WHITE, null, 8), 0, .695, 0, 0, PI / 8, 0, [1, .985, 1]));   // the stripes: a white cone turned half a panel
  ride.add(put(sph(.04, GOLD, null, 8, 6), 0, .82, 0));
  ride.add(put(flat(starShape(.05, .022), .012, GOLD), 0, .9, 0));
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; ride.add(put(sph(.028, GOLDL, GLOW('#ffd36b'), 6, 4), Math.sin(a) * .35, .6, Math.cos(a) * .35)); }
  ride.add(put(sph(.06, '#fff2c4', GLOW('#ffe9a8'), 6, 5), 0, .57, 0));                    // the lamp under the canopy
  const HC = [WHITE, PINK, SKY, BUTTER], horses = [];
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * PI * 2 + PI / 4, x = Math.sin(a) * .22, z = Math.cos(a) * .22;
    ride.add(put(cyl(.01, .01, .56, GOLD, null, 6), x, .3, z));
    const hg = live(f, ride); put(hg, x, .26, z, 0, a + HP, 0, 1.35); horses.push(hg);       // (faces along the way round)
    hg.add(put(sph(.05, HC[i], null, 8, 6), 0, 0, 0, 0, 0, 0, [1.5, .85, .8]));
    hg.add(put(sph(.038, HC[i], null, 8, 6), .085, .05, 0, 0, 0, 0, [1.15, 1, .9]));
    hg.add(put(cone(.012, .03, HC[i], null, 4), .085, .095, .018)); hg.add(put(cone(.012, .03, HC[i], null, 4), .085, .095, -.018));
    hg.add(put(rb(.06, .03, .012, i % 2 ? GOLD : PINK2, .006), .065, .085, 0, 0, 0, -.6));  // mane
    hg.add(put(cone(.02, .06, i % 2 ? GOLD : PINK2, null, 6), -.085, .01, 0, 0, 0, 1.9));     // tail
    hg.add(put(rb(.06, .012, .085, RED, .004), 0, .04, 0));                                // saddle
  }
  const dr = grp(); put(dr, 0, .085, .33); f.add(dr);
  dr.add(put(rb(.28, .11, .07, PINK, .014), 0, 0, 0));
  dr.add(put(sph(.02, GOLD, null, 8, 6), 0, 0, .04));
  dr.add(put(rb(.26, .01, .3, PINK2, .004), 0, -.048, -.18));
  for (const sx of [-1, 1]) dr.add(put(rb(.01, .08, .3, PINK2, .004), sx * .13, -.01, -.18));
  const p = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .28 * t; }, { label: '회전목마 서랍', sfx: 'drawer', dur: .26 });
  f.spot('inside', dr, 0, -.043, -.18, { part: p, maxH: .12, scale: .55, label: '회전목마 서랍 안' });
  f.idle = t => { ride.rotation.y = t * .55; horses.forEach((h, i) => { h.position.y = .26 + Math.sin(t * 2.2 + i * HP) * .045; }); };
};

// ── 3. 몽글이 얼굴 시계 (mochi clock): 몽글이's head on a little clock cabinet, tipping side to side — tick, tock — while
// the hands go round on the round clock face below. Hiding: the clock face is a little round door; the cabinet behind it.
B.gf_mongclock = f => {
  const W = .44, H = .44, D = .3, y0 = .05, fz = D / 2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.add(put(rb(.06, .06, .06, WOODD, .02), sx * (W / 2 - .05), .03, sz * (D / 2 - .05)));
  f.add(put(rb(W, .04, D, WOOD, .015), 0, y0 + .02, 0));                                 // floor of the cabinet
  f.add(put(rb(W + .03, .05, D + .03, WOODD, .02), 0, y0 + H - .02, 0));                 // roof
  for (const sx of [-1, 1]) f.add(put(rb(.05, H - .04, D, WOOD, .015), sx * (W / 2 - .025), y0 + H / 2, 0));
  f.add(put(rb(W - .06, H - .06, .02, '#ffe3c2', .006), 0, y0 + H / 2, -D / 2 + .02));   // back
  f.add(put(rb(W - .1, .1, .02, WOOD, .006), 0, y0 + .08, fz - .01));                     // the front, below the face
  f.add(put(rb(W - .1, .04, .02, WOOD, .006), 0, y0 + H - .06, fz - .01));
  // the round clock face: a door hinged on its left
  const R = .15, door = grp(); put(door, -R, y0 + H / 2 + .03, fz + .005); f.add(door);
  door.add(put(cyl(R, R, .025, CREAM, null, 20), R, 0, 0, HP, 0, 0));
  door.add(put(tor(R, .016, GOLD, null, PI * 2, 4, 22), R, 0, .012));
  for (const [x, y] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) door.add(put(sph(.014, PINK2, null, 6, 4), R + x * .11, y * .11, .016));
  door.add(put(sph(.016, GOLD2, null, 6, 5), R, 0, .018));
  const hour = live(f, door), min = live(f, door); put(hour, R, 0, .016); put(min, R, 0, .02);
  hour.add(put(rb(.014, .06, .006, INK, .003), 0, .028, 0));
  min.add(put(rb(.01, .095, .006, INK, .003), 0, .045, 0));
  const p = f.part('door', door, t => { door.rotation.y = -1.9 * t; }, { label: '시계 문', sfx: 'open', dur: .3 });
  f.spot('inside', null, 0, y0 + .04, -.01, { part: p, maxH: .18, scale: .7, label: '시계 안' });
  // 몽글이's head, tipping from its chin
  const head = live(f); put(head, 0, y0 + H, .01);
  const hy = .19;
  head.add(put(sph(.22, MONG, null, 16, 11), 0, hy, 0, 0, 0, 0, [1.05, .9, .85]));
  for (const sx of [-1, 1]) head.add(put(sph(.09, MONGE, null, 10, 7), sx * .19, hy + .12, -.01, 0, 0, sx * .65, [1, .6, .75]));
  head.add(put(sph(.04, MONGE, null, 8, 5), .02, hy + .195, 0, 0, 0, -.3, [1.3, .7, .9]));   // the tuft
  for (const sx of [-1, 1]) {
    head.add(put(sph(.026, INK, null, 8, 6), sx * .08, hy + .03, .168, 0, 0, 0, [1, 1.25, .5]));
    head.add(put(sph(.009, WHITE, null, 6, 4), sx * .08 + .007, hy + .042, .179));
    head.add(put(sph(.034, BLUSH, null, 8, 5), sx * .14, hy - .04, .138, 0, sx * .6, 0, [1.25, .7, .3]));
  }
  head.add(put(tor(.02, .006, INK, null, PI, 4, 10), 0, hy - .055, .172, PI, 0, 0));        // smile
  f.idle = t => { head.rotation.z = Math.sin(t * 2.4) * .1; min.rotation.z = -t * .35; hour.rotation.z = -t * .35 / 12 - 1.1; };
};

// ── 4. 유리 돔 미니 정원 (garden under a glass dome): on a wooden pedestal, a round bit of lawn with a little tree, two
// mushrooms and a pond; a butterfly flies round the tree. Hiding: lift the dome off — the lawn in front of the tree.
B.gf_terrarium = f => {
  f.add(put(cyl(.22, .26, .05, WOODD, null, 20), 0, .025, 0));
  f.add(put(cyl(.13, .16, .3, WOOD, null, 16), 0, .2, 0));
  f.add(put(cyl(.32, .3, .07, WOOD, null, 22), 0, .385, 0));
  f.add(put(tor(.31, .014, GOLD, null, PI * 2, 4, 28), 0, .42, 0, HP, 0, 0));
  const g0 = .42;
  f.add(put(cyl(.29, .29, .03, LEAF, null, 22), 0, g0 + .015, 0));
  f.add(put(cyl(.012, .016, .2, WOODD, null, 6), -.04, g0 + .11, -.08));                    // the tree
  f.add(put(sph(.085, LEAF2, null, 10, 7), -.04, g0 + .24, -.08));
  f.add(put(sph(.06, LEAF, null, 8, 6), .02, g0 + .2, -.06));
  f.add(put(sph(.05, '#8fd47a', null, 8, 6), -.1, g0 + .19, -.04));
  for (const [x, z, s, c] of [[.13, -.06, 1, RED], [.17, .02, .7, '#ff9a3c']]) {          // mushrooms
    f.add(put(cyl(.014 * s, .018 * s, .05 * s, CREAM, null, 6), x, g0 + .03 + .025 * s, z));
    f.add(put(sph(.04 * s, c, null, 10, 6), x, g0 + .03 + .05 * s, z, 0, 0, 0, [1, .6, 1]));
    f.add(put(sph(.009 * s, WHITE, null, 6, 4), x + .015 * s, g0 + .03 + .07 * s, z + .015 * s));
  }
  f.add(put(cyl(.08, .08, .006, '#7fc8f8', null, 16), -.13, g0 + .032, .1, 0, 0, 0, [1.2, 1, .8]));   // pond
  for (const [x, z] of [[-.22, .02], [-.04, .2], [.22, -.14]]) f.add(put(sph(.025, '#d9d3e6', null, 8, 6), x, g0 + .035, z, 0, 0, 0, [1, .6, 1]));
  // the butterfly, round the tree
  const fly = live(f); put(fly, -.04, g0 + .17, -.08);
  const bf = grp(); put(bf, .15, 0, 0); fly.add(bf);
  bf.add(put(pill(.006, .025, INK), 0, 0, 0, HP, 0, 0));
  const wl = grp(), wr = grp(); bf.add(wl); bf.add(wr);
  wl.add(put(sph(.026, PINK2, null, 8, 6), -.024, 0, 0, 0, 0, 0, [1, .2, .8])); wr.add(put(sph(.026, PINK2, null, 8, 6), .024, 0, 0, 0, 0, 0, [1, .2, .8]));
  // the dome (lifts off)
  const dome = grp(); put(dome, 0, g0, 0); f.add(dome);
  dome.add(put(sph(.3, '#e6f6ff', GLASS, 18, 10), 0, 0, 0, 0, 0, 0, [1, 1.15, 1]));
  dome.add(put(tor(.3, .016, GOLD, null, PI * 2, 4, 28), 0, .01, 0, HP, 0, 0));
  dome.add(put(sph(.035, GOLD, null, 10, 8), 0, .355, 0));
  dome.add(put(sph(.05, WHITE, { opacity: .7 }, 6, 4), -.15, .22, .18, 0, -.6, .5, [.35, 1.4, .2]));   // a shine on the glass
  const p = f.part('lid', dome, t => { dome.position.y = g0 + .42 * t; dome.rotation.x = -.35 * t; }, { label: '유리 돔', sfx: 'open', dur: .32 });
  f.spot('inside', null, .08, g0 + .03, .14, { part: p, maxH: .16, scale: .65, label: '유리 돔 안' });
  f.idle = t => { fly.rotation.y = t * .9; bf.position.y = Math.sin(t * 3.1) * .03; const w = Math.sin(t * 16) * .7; wl.rotation.z = w; wr.rotation.z = -w; };
};

// ── 5. 금빛 숨바꼭질 트로피 (gold hide-and-seek trophy): a gold cup with two handles and a lid, a red ribbon on its stem, on
// a two-step plinth with a gold plate; a gold star spins on the lid. Hiding: inside the cup (the lid tips open).
B.gf_trophy = f => {
  f.add(put(rb(.46, .12, .46, '#8a5a3c', .03), 0, .06, 0));
  f.add(put(rb(.36, .1, .36, '#a8714a', .025), 0, .17, 0));
  f.add(put(rb(.2, .055, .012, GOLD, .006), 0, .065, .232));
  f.add(put(flat(starShape(.022, .01), .006, '#8a5a3c'), 0, .065, .242));
  f.add(put(cyl(.1, .12, .03, GOLD, null, 18), 0, .235, 0));
  f.add(put(cyl(.035, .06, .12, GOLD, null, 12), 0, .31, 0));
  f.add(put(sph(.05, GOLD2, null, 12, 8), 0, .37, 0, 0, 0, 0, [1, .7, 1]));
  for (const sx of [-1, 1]) f.add(put(cone(.035, .07, RED, null, 6), sx * .045, .33, .045, 0, 0, sx * -HP));   // ribbon bow
  f.add(put(sph(.02, RED, null, 8, 6), 0, .33, .05));
  const y1 = .39, CH = .3;
  f.add(put(cyl(.22, .1, CH, GOLD, null, 20), 0, y1 + CH / 2, 0));
  f.add(put(tor(.215, .018, GOLDL, null, PI * 2, 4, 26), 0, y1 + CH, 0, HP, 0, 0));
  f.add(put(tor(.165, .012, GOLD2, null, PI * 2, 4, 24), 0, y1 + CH * .45, 0, HP, 0, 0));
  for (const sx of [-1, 1]) f.add(put(tor(.085, .022, GOLD, null, PI, 6, 12), sx * .19, y1 + CH * .6, 0, 0, 0, -sx * HP));
  // a little 몽글이 peeking out round the side of the cup (it's a hide-and-seek trophy)
  const pk = grp(); put(pk, .17, .22, .09, 0, .5, -.25); mochi(pk, GOLDL, GOLD, 'flop', .9); f.add(pk);
  // the lid, hinged at the back
  const lid = grp(); put(lid, 0, y1 + CH, -.2); f.add(lid);
  lid.add(put(cyl(.225, .225, .03, GOLD, null, 20), 0, .015, .2));
  lid.add(put(sph(.13, GOLD, null, 16, 8), 0, .03, .2, 0, 0, 0, [1, .4, 1]));
  lid.add(put(cyl(.012, .012, .08, GOLD2, null, 6), 0, .1, .2));
  const star = live(f, lid); put(star, 0, .17, .2);
  star.add(put(flat(starShape(.075, .033), .022, GOLDL), 0, 0, 0));
  const p = f.part('lid', lid, t => { lid.rotation.x = -1.5 * t; }, { label: '트로피 뚜껑', sfx: 'open', dur: .3 });
  f.spot('inside', null, 0, y1 + .04, 0, { part: p, maxH: .2, scale: .7, label: '트로피 안' });
  f.idle = t => { star.rotation.y = t * 1.6; star.position.y = .17 + Math.sin(t * 2) * .012; };
};

// ── 6. 별자리 무드등 (constellation night light): a navy globe dotted with glowing stars and two constellations, turning
// slowly inside a gold ring, a crescent moon on top. Hiding: the drawer in its round wooden base.
B.gf_starlamp = f => {
  f.add(put(cyl(.24, .27, .22, WOOD, null, 20), 0, .11, 0));
  f.add(put(cyl(.255, .255, .03, WOODD, null, 20), 0, .225, 0));
  f.add(put(cyl(.06, .09, .08, GOLD, null, 12), 0, .28, 0));
  const cy = .58, R = .26;
  f.add(put(tor(R + .04, .014, GOLD, null, PI * 1.5, 4, 26), 0, cy, 0, 0, 0, -PI * .25));  // the ring holding it
  f.add(put(sph(.022, GOLD, null, 8, 6), 0, cy + R + .04, 0));
  // the moon on top
  const moon = new THREE.Shape(), mr = .11;   // a flat crescent standing on the ring, opening to the right
  moon.absarc(0, 0, mr, PI * .35, PI * 1.65, false); moon.absarc(mr * .45, 0, mr * .89, PI * 1.5, PI * .5, true);
  f.add(put(flat(moon, .04, BUTTER, GLOW('#ffe9a0')), -.02, cy + R + .14, 0, 0, 0, -.25));
  const globe = live(f); put(globe, 0, cy, 0, .35, 0, 0);
  globe.add(put(sph(R, NAVY, { emissive: '#2b3a86', ei: .35 }, 18, 12), 0, 0, 0));
  const dot = (lat, lon) => new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)).multiplyScalar(R + .004);
  const starAt = (v, s = 1) => globe.add(put(sph(.017 * s, GOLDL, GLOW('#fff2a8'), 6, 5), v.x, v.y, v.z));
  const line = (a, b) => { const m = cyl(.0045, .0045, a.distanceTo(b), '#fff2c0', GLOW('#fff2c0'), 4); m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); globe.add(m); };
  for (const C of [[[.5, 0], [.62, .3], [.55, .62], [.32, .7], [.2, .45]], [[-.2, 2.6], [-.05, 2.95], [-.32, 3.25], [-.12, 3.55]]]) {
    const v = C.map(([la, lo]) => dot(la, lo)); v.forEach((p, i) => { starAt(p, i ? 1 : 1.35); if (i) line(v[i - 1], p); });
  }
  for (const [la, lo] of [[.05, 1.3], [-.45, .4], [.85, 2.2], [-.6, 1.9], [.3, 4.3], [-.3, 5.1], [.6, 5.5], [-.8, 4.6]]) starAt(dot(la, lo), .8);
  const dr = grp(); put(dr, 0, .1, .25); f.add(dr);
  dr.add(put(rb(.24, .1, .08, CREAM, .014), 0, 0, 0));
  dr.add(put(flat(starShape(.022, .01), .006, GOLD), 0, 0, .044));
  dr.add(put(rb(.22, .01, .26, WOODD, .004), 0, -.042, -.17));
  for (const sx of [-1, 1]) dr.add(put(rb(.01, .07, .26, WOODD, .004), sx * .11, -.01, -.17));
  const p = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .24 * t; }, { label: '무드등 서랍', sfx: 'drawer', dur: .26 });
  f.spot('inside', dr, 0, -.037, -.17, { part: p, maxH: .1, scale: .5, label: '무드등 서랍 안' });
  f.idle = t => { globe.rotation.y = t * .35; };
};

// ── 7. 친구들 사진 액자 (friends' picture frame): a big wooden frame on a little cabinet; in it, the sky, a cloud and three
// friends' faces (몽글이, 토순이, 곰돌이) side by side, bobbing one after another. Hiding: the cabinet's two doors (sky and pink).
B.gf_photoframe = f => {
  const W = .64, H = .3, D = .32;
  f.add(put(rb(W, .04, D, WOODD, .015), 0, H, 0));
  for (const sx of [-1, 1]) f.add(put(rb(.04, H - .04, D, WOOD, .012), sx * (W / 2 - .02), (H - .04) / 2 + .02, 0));
  f.add(put(rb(W, .03, D, WOOD, .012), 0, .035, 0));
  f.add(put(rb(W - .06, H - .06, .02, '#ffe3c2', .006), 0, H / 2, -D / 2 + .02));
  const doors = [];
  for (const sx of [-1, 1]) {
    const d = grp(); put(d, sx * (W / 2 - .04), H / 2 + .01, D / 2 - .005); f.add(d); doors.push(d);
    d.add(put(rb(.28, .22, .025, sx < 0 ? SKY : PINK, .012), -sx * .14, 0, 0));
    d.add(put(sph(.017, GOLD, null, 8, 6), -sx * .26, 0, .02));
  }
  const p = f.part('door', doors, (t) => { doors[0].rotation.y = -1.8 * t; doors[1].rotation.y = 1.8 * t; }, { label: '액자 수납장', sfx: 'open', dur: .3 });
  f.spot('inside', null, 0, .05, 0, { part: p, maxH: .2, scale: .7, label: '액자 수납장 안' });
  // the frame, leaning back a little on top
  const fr = grp(); put(fr, 0, H + .02, -.04, -.12, 0, 0); f.add(fr);
  const FW = .62, FH = .5;
  for (const [w, h, x, y] of [[FW, .06, 0, FH - .03], [FW, .06, 0, .03], [.06, FH, -FW / 2 + .03, FH / 2], [.06, FH, FW / 2 - .03, FH / 2]]) fr.add(put(rb(w, h, .06, GOLD, .015), x, y, 0));
  fr.add(put(rb(FW - .1, FH - .1, .02, '#bfe6ff', .005), 0, FH / 2, -.02));
  fr.add(put(sph(.05, WHITE, null, 8, 5), .16, FH - .12, -.005, 0, 0, 0, [1.6, .8, .4]));   // a cloud
  fr.add(put(rb(FW - .1, .07, .03, LEAF, .01), 0, .085, -.005));                          // grass along the bottom
  const heads = [];
  for (const [i, [body, ear, kind]] of [[MONG, MONGE, 'flop'], ['#ffe6f0', '#ffb3cd', 'bunny'], ['#e9bf94', '#c98a52', 'bear']].entries()) {
    const hd = live(f, fr); put(hd, (i - 1) * .16, .1, .01); mochi(hd, body, ear, kind, 1.05); heads.push(hd);
  }
  f.idle = t => heads.forEach((hd, i) => { const k = Math.max(0, Math.sin(t * 2.2 - i * 1.1)); hd.position.y = .1 + k * k * .03; hd.rotation.z = (i - 1) * .05 + Math.sin(t * 2.2 - i * 1.1) * .06; });
};

// ── 8. 나무 기차 세트 (wooden train set): a round wooden track on a green board, a red engine and two wagons going round it,
// through a hill tunnel at the back, a pine in the corner. Hiding: the little station house in the middle (its roof lifts).
B.gf_train = f => {
  f.add(put(rb(.9, .05, .9, WOOD, .02), 0, .025, 0));
  f.add(put(rb(.84, .012, .84, '#a6dc8a', .005), 0, .054, 0));
  const R = .3, y0 = .06;
  f.add(put(tor(R, .042, '#f3cd96', null, PI * 2, 4, 32), 0, y0 + .006, 0, HP, 0, 0, [1, 1, .3]));
  for (const r of [R - .018, R + .018]) f.add(put(tor(r, .006, WOODD, null, PI * 2, 3, 32), 0, y0 + .018, 0, HP, 0, 0));
  // the tunnel (a grassy hill over the track at the back)
  const tz = -R;
  for (const sx of [-1, 1]) f.add(put(rb(.06, .13, .2, LEAF2, .02), sx * .08, y0 + .065, tz));
  f.add(put(rb(.24, .07, .2, LEAF, .035), 0, y0 + .155, tz));
  f.add(put(sph(.06, '#8fd47a', null, 8, 6), .06, y0 + .19, tz, 0, 0, 0, [1, .6, 1]));
  // a pine in the corner, a tree and a bench in the others
  f.add(put(cyl(.02, .02, .06, WOODD, null, 6), .35, y0 + .03, .35));
  f.add(put(cone(.08, .14, LEAF2, null, 8), .35, y0 + .12, .35)); f.add(put(cone(.06, .1, LEAF, null, 8), .35, y0 + .2, .35));
  f.add(put(sph(.05, '#ff9fb5', null, 8, 6), -.36, y0 + .07, -.36)); f.add(put(cyl(.012, .012, .04, WOODD, null, 6), -.36, y0 + .02, -.36));
  // the train
  const run = live(f); put(run, 0, y0 + .02, 0);
  const car = (a, build) => { const g = grp(); put(g, Math.sin(a) * R, 0, Math.cos(a) * R, 0, a, 0); run.add(g); build(g);
    for (const sx of [-1, 1]) g.add(put(cyl(.022, .022, .084, INK, null, 8), sx * .035, .022, 0, HP, 0, 0)); };   // (an axle with its two wheels: one roller)
  car(0, g => {
    g.add(put(rb(.13, .06, .07, RED, .015), 0, .05, 0));
    g.add(put(cyl(.032, .032, .08, RED, null, 12), .02, .085, 0, 0, 0, HP));
    g.add(put(rb(.055, .085, .075, '#4f6db0', .012), -.04, .1, 0));
    g.add(put(rb(.07, .015, .085, BUTTER, .006), -.04, .148, 0));
    g.add(put(cyl(.012, .018, .04, INK, null, 8), .045, .135, 0));
    g.add(put(sph(.016, BUTTER, null, 8, 6), .066, .085, 0));
  });
  for (const [k, c] of [[1, SKY], [2, BUTTER]]) car(-k * .46, g => {
    g.add(put(rb(.11, .05, .07, c, .014), 0, .05, 0));
    g.add(put(sph(.022, k === 1 ? PINK : RED, null, 8, 6), -.02, .085, 0)); g.add(put(sph(.02, LILAC, null, 8, 6), .022, .083, .01));
  });
  // the station house in the middle (the roof lifts off)
  f.add(put(rb(.24, .14, .18, CREAM, .012), 0, y0 + .07, .02));
  f.add(put(rb(.06, .08, .01, WOODD, .004), 0, y0 + .04, .113));
  for (const sx of [-1, 1]) f.add(put(rb(.045, .045, .01, SKY, .004), sx * .075, y0 + .085, .113));
  const roof = grp(); put(roof, 0, y0 + .14, -.07); f.add(roof);
  for (const s of [-1, 1]) roof.add(put(rb(.28, .02, .13, RED, .008), 0, .045, .09 + s * .05, s * .62, 0, 0));
  roof.add(put(rb(.03, .05, .03, CREAM, .006), .07, .09, .07));
  const p = f.part('lid', roof, t => { roof.rotation.x = -1.4 * t; }, { label: '기차역 지붕', sfx: 'open', dur: .3 });
  f.spot('inside', null, 0, y0 + .01, .02, { part: p, maxH: .13, scale: .55, label: '기차역 안' });
  f.idle = t => { run.rotation.y = t * .7; };
};

// Each is drawn at its real toy size above and shown a size up in the room, so a treasure reads next to a chest of drawers
// (a music box 76 cm → 99 cm): the build goes into one scaled group. A thing hidden in it keeps its own size (spot.scale ÷ k).
const SIZE = { gf_musicbox: 1.3, gf_carousel: 1.15, gf_mongclock: 1.35, gf_terrarium: 1.3, gf_trophy: 1.35, gf_starlamp: 1.25, gf_photoframe: 1.35, gf_train: 1.05 };
for (const [t, k] of Object.entries(SIZE)) {
  const build = B[t];
  B[t] = (f, T, o) => {
    const root = grp(); root.scale.setScalar(k); f.group.add(root);
    const spot = f.spot;
    f.add = x => root.add(x);
    f.spot = (kind, parent, x, y, z, op = {}) => spot.call(f, kind, parent || root, x, y, z, { ...op, scale: (op.scale ?? 1) / k });
    try { build(f, T, o); } finally { delete f.add; delete f.spot; }
  };
}

export const GIFT_BUILDERS = B;
// region: none (not a chapter's furniture); price 0 = never in the shop. gift: true marks them for the econ session's table
export const GIFT_INFO = {
  gf_musicbox: { w: 1, d: 1, name: '반짝 오르골', price: 0, gift: true },
  gf_carousel: { w: 1, d: 1, name: '회전목마 램프', price: 0, gift: true },
  gf_mongclock: { w: 1, d: 1, name: '몽글이 얼굴 시계', price: 0, gift: true },
  gf_terrarium: { w: 1, d: 1, name: '유리 돔 미니 정원', price: 0, gift: true },
  gf_trophy: { w: 1, d: 1, name: '금빛 숨바꼭질 트로피', price: 0, gift: true },
  gf_starlamp: { w: 1, d: 1, name: '별자리 무드등', price: 0, gift: true },
  gf_photoframe: { w: 1, d: 1, name: '친구들 사진 액자', price: 0, gift: true },
  gf_train: { w: 1, d: 1, name: '나무 기차 세트', price: 0, gift: true },
};

// 몽글 순찰차 2 (gpt3-k vehicles2, fix-1022 반영 — ① 10/22 들여옴: 빌더만, 색은 GPT 원색 그대로; 번호판 글자는 우리 fitText).
// A new, additive 2×1 patrol car, based on the director's round #1 concept.
// Real wheel notches and a hollow cabin replace solid blocks hidden behind drawn-on arches/windows.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mesh, mat, texCache } from './kit.js';
import { HG, hmc, hxf as xf } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';

const G = { ...HG, box: (w, h, d, r = .02, seg = 1) => Math.min(w, h, d) < .028 ? HG.pbox(w, h, d) : HG.box(w, h, d, r, seg) };
// The hmc helper emits separate triangle corners. Sharing equal position,
// normal and colour attributes keeps the same toon surfaces at fewer vertices.
const compact = new WeakMap();
const mc = (key, build) => {
  const m = hmc('gpt3k|' + key, build), src = m.geometry;
  if (!compact.has(src)) compact.set(src, mergeVertices(src, 1e-6));
  m.geometry = compact.get(src); return m;
};

const PI = Math.PI, HP = PI / 2;
const C = { body: '#fef2e1', frame: '#eecfa3', blue: '#84ae9d', stripe: '#eaa440', tyre: '#644936', side: '#6f4b30', hub: '#e8d7b7',
  bumper: '#6f4b30', seat: '#a2c8bb', seatD: '#84ae9d', lining: '#a09769', glass: '#b0e5e8', orange: '#feb53d', red: '#e65d4d', lightBlue: '#75b9cf', cream: '#fefde9' };
const TX = texCache(), B = {};
const profile = pts => {
  const sh = new THREE.Shape(); sh.moveTo(...pts[0]);
  for (const p of pts.slice(1)) p.length === 2 ? sh.lineTo(...p) : sh.quadraticCurveTo(...p);
  sh.closePath(); return sh;
};
const slab = (sh, d, bevel = .012) => {
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(.008, d - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * bevel) / 2); return g;
};
const pathOf = sh => new THREE.Path(sh.getPoints(7));
const mudguard = () => {
  const s = new THREE.Shape();
  s.absarc(0, 0, .305, 0, PI, false); s.lineTo(-.28, 0);
  s.absarc(0, 0, .28, PI, 0, true); s.closePath();
  return slab(s, .25, .006);
};
const rearPane = () => profile([[-.51, .77], [-.28, .77], [-.28, 1.07], [-.38, 1.07], [-.5, 1.065, -.51, .96], [-.51, .77]]);
const frontPane = () => profile([[-.17, .77], [.265, .77], [.235, .91], [.195, 1.055, .08, 1.075], [-.17, 1.075], [-.17, .77]]);
const fullSide = () => {
  const s = new THREE.Shape(); s.moveTo(-.89, .245); s.lineTo(-.89, .5); s.quadraticCurveTo(-.89, .66, -.73, .685); s.lineTo(.56, .685); s.quadraticCurveTo(.89, .68, .91, .48); s.lineTo(.91, .245);
  // Replace the lower edge with two true semicircular openings; nothing remains behind the tyres at either side.
  s.lineTo(.83, .245); s.absarc(.54, .245, .29, 0, PI, false); s.lineTo(-.25, .245); s.absarc(-.54, .245, .29, 0, PI, false); s.lineTo(-.89, .245); s.closePath(); return s;
};
const rearSide = () => {
  const s = new THREE.Shape(); s.moveTo(-.89, .245); s.lineTo(-.89, .5); s.quadraticCurveTo(-.89, .66, -.73, .685); s.lineTo(-.25, .685); s.lineTo(-.25, .245);
  s.absarc(-.54, .245, .29, 0, PI, false); s.lineTo(-.89, .245); s.closePath(); return s;
};
const frontSide = () => {
  const s = new THREE.Shape(); s.moveTo(.25, .685); s.lineTo(.56, .685); s.quadraticCurveTo(.89, .68, .91, .48); s.lineTo(.91, .245); s.lineTo(.83, .245);
  s.absarc(.54, .245, .29, 0, PI, false); s.lineTo(.25, .685); s.closePath(); return s;
};
const transparent = (key, build) => {
  const m = mc(key, build); m.material = mat(C.glass, { opacity: .17, rough: .55, rim: .02, side: THREE.DoubleSide }); m.castShadow = false; return m;
};
function windscreen() {
  const v = [], idx = [], n = 6, m = 8;
  for (let j = 0; j <= n; j++) for (let i = 0; i <= m; i++) {
    const t = j / n, u = i / m * 2 - 1;
    v.push(.422 - .19 * t - .027 * Math.sin(PI * t) + .018 * u * u, .725 + .345 * t, u * (.349 - .028 * t));
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < m; i++) { const a = j * (m + 1) + i, b = a + m + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function hoodStripe(z0, z1) {
  const p = [], ix = [], n = 10;
  for (let k = 0; k <= n; k++) {
    const t = .035 + .57 * k / n, q = 1 - t, x = q * q * .43 + 2 * q * t * .81 + t * t * .9, y = q * q * .705 + 2 * q * t * .715 + t * t * .49 + .007;
    p.push(x, y, z0, x, y, z1);
  }
  for (let k = 0; k < n; k++) { const a = k * 2; ix.push(a, a + 3, a + 2, a, a + 1, a + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); g.computeVertexNormals(); return g;
}
const plate = () => TX.get('gpt3k-policecar2-plate', () => textTex(320, 96, (c, w, h) => {
  c.scale(.5, .5); w *= 2; h *= 2;   // (textTex draws at 2x: back to the plate's own 320×96 units)
  c.fillStyle = C.body; c.fillRect(0, 0, w, h); c.strokeStyle = C.blue; c.lineWidth = 5; c.strokeRect(8, 8, w - 16, h - 16);
  fitText(c, '경찰', w / 2, h * .51, w * .8, 56, C.blue, { weight: '800' });
}));

B.gpt_policecar2 = f => {
  f.collideBox = [-.98, .02, -.54, .98, 1.37, .54];
  // Small soap-bar body and a broad, softly curved bubble cabin; front is +x, the operable door is +z.
  f.add(mc('gpt-policecar2-body-v1', ({ add, addM, tube }) => {
    // Underbody and cabin floor stay BETWEEN the tyre inner faces (±.33), rather than passing through them.
    add(G.box(1.58, .11, .59, .045, 2), C.bumper, -.01, .255, 0);
    add(G.box(.91, .07, .62, .035), C.lining, -.04, .405, 0);
    add(G.box(.55, .055, .3, .022), C.frame, 0, .365, .35); // real doorway step
    addM(slab(fullSide(), .065, .014), xf(0, 0, -.435), C.body);
    addM(slab(rearSide(), .065, .014), xf(0, 0, .435), C.body);
    addM(slab(frontSide(), .065, .014), xf(0, 0, .435), C.body);
    // A rounded sill below the open doorway, above the underbody and clear of both circular wheel wells.
    add(G.box(.48, .1, .065, .025), C.body, 0, .34, .435);
    // Hollow boot: floor, back and cabin bulkhead, with a dark warm interior.
    add(G.box(.3, .045, .62, .018), C.lining, -.735, .35, 0);
    add(G.box(.06, .31, .76, .028), C.body, -.87, .5, 0);
    // The cabin bulkhead stays inboard of the rear tyre's inner face (.336 m).
    add(G.box(.055, .31, .62, .02), C.lining, -.59, .5, 0);
    // Hood is a curved skin above the wheel-opening tops, never a block through the wheel centre.
    const hood = profile([[.29, .56], [.3, .68, .43, .705], [.81, .715, .9, .49], [.9, .38], [.83, .38], [.78, .555], [.29, .56]]);
    addM(slab(hood, .86, .035), xf(), C.body);
    // Bonnet's teal patch and two narrow honey stripes follow its slope.
    addM(hoodStripe(-.245, .245), xf(), C.blue);
    addM(hoodStripe(-.245, -.21), xf(0, .002, 0), C.stripe); addM(hoodStripe(.21, .245), xf(0, .002, 0), C.stripe);
    // Far side bubble frame, with two actual empty window holes.
    const far = profile([[-.61, .67], [-.6, .95], [-.57, 1.17, -.34, 1.175], [.06, 1.175], [.22, 1.17, .3, 1.0], [.425, .69], [-.61, .67]]);
    far.holes.push(pathOf(rearPane())); far.holes.push(pathOf(frontPane())); addM(slab(far, .065, .018), xf(0, 0, -.395), C.body);
    // Near rear quarter frame. The whole front window and lower door are a separate moving shell.
    const near = profile([[-.61, .67], [-.6, .95], [-.57, 1.17, -.34, 1.175], [-.215, 1.175], [-.215, .685], [-.61, .67]]);
    near.holes.push(pathOf(rearPane())); addM(slab(near, .065, .018), xf(0, 0, .395), C.body);
    // Broad curved roof joins the rounded side corners, instead of a detached rectangular roof plank.
    const roof = profile([[-.6, .96], [-.57, 1.17, -.34, 1.175], [.06, 1.175], [.22, 1.17, .3, 1.0], [.24, .98], [.17, 1.08, .04, 1.095], [-.34, 1.095], [-.5, 1.08, -.52, .95], [-.6, .96]]);
    addM(slab(roof, .76, .025), xf(), C.body);
    // Curved windscreen pillars, rounded lower seal and rear-window frame.
    for (const z of [-.365, .365]) {
      const P = [[.44, .70, z], [.415, .81, z], [.35, .96, z * .97], [.25, 1.09, z * .92]];
      for (let k = 0; k < P.length - 1; k++) tube(P[k], P[k + 1], .033, C.body, 10);
    }
    add(G.box(.055, .045, .75, .018), C.frame, .433, .708, 0);
    add(G.box(.055, .035, .66, .014), C.body, .242, 1.09, 0);
    for (const z of [-.32, .32]) tube([-.596, .71, z], [-.565, 1.025, z], .03, C.body, 10);
    add(G.box(.055, .045, .67, .018), C.body, -.6, .715, 0);
    // Seats, headrests and dashboard are distinct, softly upholstered shapes visible through the open window.
    add(G.box(.12, .12, .63, .04), C.seatD, .335, .73, 0);
    for (const z of [-.17, .17]) {
      // .52 m seat top matches the game's chairs and leaves real cabin room.
      add(G.box(.42, .095, .255, .045), C.seat, -.07, .4725, z);
      add(G.box(.09, .32, .255, .045), C.seatD, -.315, .6325, z, 0, 0, -.11);
      add(G.box(.09, .09, .16, .035), C.seat, -.335, .8175, z);
    }
    tube([.29, .71, -.17], [.15, .8, -.17], .018, C.bumper, 8);
    add(G.tor(.085, .018, PI * 2, 6, 18), C.bumper, .13, .82, -.17, 0, HP, .35);
    for (const a of [0, PI * 2 / 3, PI * 4 / 3]) tube([.13, .82, -.17], [.13, .82 + Math.cos(a) * .07, -.17 + Math.sin(a) * .07], .012, C.bumper, 6);
    add(G.box(.06, .035, .1, .012), C.stripe, .335, .8, -.17);
    // Side band has a clean door gap; it is kept above each actual wheel arch.
    add(G.box(1.51, .075, .014, .006), C.blue, -.035, .61, -.477);
    add(G.box(1.48, .022, .016, .006), C.stripe, -.04, .669, -.478);
    for (const [x, w] of [[-.57, .48], [.52, .4]]) {
      add(G.box(w, .075, .014, .006), C.blue, x, .61, .477);
      add(G.box(w, .022, .016, .006), C.stripe, x, .669, .478);
    }
    // The hollow mudguard covers the full rubber shoulder (.336–.524 m in z)
    // with .029 m radial clearance, including its bevel. Hubs remain visible.
    for (const x of [-.54, .54]) for (const s of [-1, 1]) {
      const z = s * .43;
      add(G.tor(.193, .052, PI * 2, 8, 22), C.tyre, x, .245, z, 0, 0, 0, [1, 1, 1.8]);
      add(G.cyl(.19, .19, .17, 18), C.side, x, .245, z, HP);
      add(G.sph(.141, 16, 9), C.hub, x, .245, z + s * .093, 0, 0, 0, [1, 1, .35]);
      add(G.sph(.045, 10, 7), C.stripe, x, .245, z + s * .142, 0, 0, 0, [1, 1, .3]);
      addM(mudguard(), xf(x, .245, s * .43), C.body);
    }
    // Soft bumpers, inset round lamps and round mirrors instead of skinny disjoint sticks.
    for (const [x, w] of [[.9, .94], [-.915, .91]]) add(G.box(.14, .16, w, .065, 2), C.bumper, x, .265, 0);
    for (const s of [-1, 1]) {
      add(G.cyl(.108, .108, .055, 20), C.frame, .862, .49, s * .27, 0, 0, HP);
      add(G.sph(.085, 16, 10), C.cream, .895, .49, s * .27, 0, 0, 0, [.43, 1, 1]);
      add(G.sph(.041, 10, 7), C.orange, .967, .29, s * .36, 0, 0, 0, [.5, 1, 1]);
      add(G.sph(.06, 12, 8), C.red, -.923, .51, s * .345, 0, 0, 0, [.45, 1.2, 1]);
      tube([.29, .76, s * .39], [.34, .79, s * .49], .022, C.body, 8);
      add(G.sph(.077, 14, 9), C.body, .35, .8, s * .515, 0, 0, 0, [.55, 1, 1]);
    }
    add(G.box(.06, .075, .24, .028), C.bumper, .917, .405, 0);
    // Rounded blue/cream/red bar mounted on four little feet.
    for (const z of [-.24, .24]) add(G.box(.08, .04, .08, .012), C.bumper, -.1, 1.19, z);
    add(G.box(.23, .045, .79, .02), C.bumper, -.1, 1.225, 0);
    for (const [z, col, w] of [[-.26, C.lightBlue, .27], [0, C.body, .24], [.26, C.red, .27]]) add(G.box(.21, .13, w, .055, 2), col, -.1, 1.3, z);
    // Boot contents: cone and cap stay on the floor, leaving the near/front quarter clear for an actual hidden item.
    add(G.box(.16, .025, .16, .012), C.orange, -.74, .39, -.22);
    add(G.cone(.068, .23, 12), C.orange, -.74, .515, -.22);
    add(G.cyl(.043, .053, .04, 12), C.body, -.74, .515, -.22);
    add(G.cyl(.08, .069, .055, 14), C.blue, -.73, .41, -.04);
    add(G.box(.1, .025, .13, .02), C.bumper, -.665, .395, -.04);
    add(G.sph(.022, 9, 6), C.stripe, -.665, .435, -.04, 0, 0, 0, [.4, 1, 1]);
  }));
  f.add(transparent('gpt-policecar2-glass', ({ add, addM }) => {
    addM(windscreen(), xf(), '#ffffff');
    addM(slab(rearPane(), .008, 0), xf(0, 0, -.397), '#ffffff'); addM(slab(frontPane(), .008, 0), xf(0, 0, -.397), '#ffffff');
    addM(slab(rearPane(), .008, 0), xf(0, 0, .397), '#ffffff');
    add(G.box(.014, .26, .61, .006), '#ffffff', -.584, .865, 0, 0, 0, -.1);
  }));
  f.add(put(mesh(new THREE.PlaneGeometry(.32, .095), mat('#ffffff', { map: plate() }), { cast: false }), .978, .265, 0, 0, HP));
  const trunk = grp(); put(trunk, -.59, .685, 0); f.add(trunk);
  trunk.add(mc('gpt-policecar2-trunk', ({ add }) => {
    add(G.box(.32, .075, .91, .035, 2), C.body, -.16, .008, 0);
    add(G.box(.13, .026, .14, .014), C.bumper, -.25, .055, 0);
  }));
  const tp = f.part('lift', trunk, t => { trunk.rotation.z = -1.25 * t; }, { label: '순찰차 트렁크', sfx: 'open', dur: .55 });
  f.spot('inside', null, -.74, .38, .2, { part: tp, maxH: .3, label: '순찰차 트렁크 안', scale: .65 });
  // A real front door: its lower panel, inner lining and open window frame all move together.
  const door = grp(); put(door, .3, .4, .453); f.add(door);
  door.add(mc('gpt-policecar2-door', ({ add, addM }) => {
    // The low front corner is chamfered above/back from the wheel well. As
    // this front-hinged door swings out, the corner clears the full-width
    // mudguard rather than cutting through its outer shoulder.
    const ds = profile([[-.25, .4], [.22, .47], [.36, .74], [.24, 1.0], [.2, 1.115, .07, 1.12], [-.215, 1.12], [-.25, .4]]);
    ds.holes.push(pathOf(frontPane()));
    const skin = slab(ds, .055, .012), pos = skin.attributes.position;
    // The top of the window leans into the bubble roof. Its lower door still meets the body belt exactly.
    for (let k = 0; k < pos.count; k++) pos.setZ(k, pos.getZ(k) - Math.max(0, pos.getY(k) - .4) * .08);
    skin.computeVertexNormals(); addM(skin, xf(-.3, -.4, 0), C.body);
    add(G.box(.44, .19, .023, .025), C.frame, -.31, .17, -.033);
    add(G.box(.48, .075, .016, .007), C.blue, -.3, .21, .019);
    add(G.box(.47, .022, .017, .006), C.stripe, -.3, .269, .015);
    add(G.box(.04, .028, .05, .009), C.hub, -.43, .3, .025);
    add(G.box(.12, .035, .04, .014), C.hub, -.43, .3, .055);
    add(G.box(.13, .035, .032, .012), C.seatD, -.36, .2, -.058);
  }));
  const dp = f.part('door', door, t => { door.rotation.y = 1.15 * t; }, { label: '순찰차 문', sfx: 'door', dur: .55 });
  dp.lockable = true; dp.lockKind = 'pad'; f.lockAt = { x: -.44, y: .24, z: .085, parent: door };
  f.spot('inside', null, -.005, .532, .045, { part: dp, maxH: .35, label: '순찰차 조수석', scale: 1.4 });
  f.spot('on', null, -.36, 1.205, -.1, { maxH: .2, label: '순찰차 지붕 위', scale: .6 });
  f.spot('under', null, 0, 0, 0, { maxH: .16, label: '순찰차 밑', scale: .7 });
};

export const GPT_POLICECAR2_BUILDERS = B;
export const GPT_POLICECAR2_INFO = { gpt_policecar2: { w: 2, d: 1, name: '몽글 순찰차', price: 0, hidden: true } };

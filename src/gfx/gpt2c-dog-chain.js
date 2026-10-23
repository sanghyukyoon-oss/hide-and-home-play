// Self-contained cadet exam machine: lever -> meshing gears -> rope basket -> secret drawer.
// (gpt2-c 작업장 gptdoghouse-chain.js, fix-1022 a83e02b — ① 10/22 그대로 들여옴: GPT 원색, 부품은 우리 f.part 꼴)
// The three main moving meshes survive the normal furniture bake as part pivots. Motion IDs
// let gears, lever, pulleys and ropes share a draw call; the optional crank and tail stay live.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mesh, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { reindexExact } from './bake.js';

const PI = Math.PI, HP = PI / 2;
const C = { cream: '#fef2e1', wood: '#eaa440', woodD: '#c67f2a', teal: '#47b6a3', tealD: '#2f9386',
  terra: '#ed6670', gold: '#feb53d', metal: '#4c99da', rope: '#feebc8', ink: '#6f4b30' };
const smooth = v => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
const phase = (t, a, b) => smooth((t - a) / (b - a));
const B = {};

function cogShape(root, outer, teeth, angle = 0, holeRadius = 0) {
  const s = new THREE.Shape(), step = PI * 2 / teeth;
  for (let k = 0; k < teeth; k++) for (const [u, r] of [[-.5, root], [-.3, root], [-.2, outer], [.2, outer], [.3, root], [.5, root]]) {
    const a = angle + (k + u) * step, x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (!k && u === -.5) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  if (holeRadius) { const hole = new THREE.Path(); hole.absarc(0, 0, holeRadius, 0, PI * 2, true); s.holes.push(hole); }
  return s;
}

// Build once in the same vertex-colour material as the house kit; the single scalar
// motion attribute is retained by bake.js and is never consulted by a shader.
function movingTransmission(key, chunks) {
  const geometries = [], parts = [];
  for (const [id, draw] of chunks) {
    const m = mc(key + '|' + id, draw), g = m.geometry.clone(), count = g.attributes.position.count;
    g.setAttribute('gptMotion', new THREE.Float32BufferAttribute(new Float32Array(count).fill(id), 1));
    geometries.push(g); parts.push(m);
  }
  const g = mergeGeometries(geometries, false); geometries.forEach(x => x.dispose());
  return mesh(g, parts[0].material);
}

B.gptcadetlift = (f, T = {}) => {
  const cream = T.gptCream || C.cream, teal = T.gptTeal || C.teal;
  const key = 'gptcadetlift|' + cream + '|' + teal;
  const TOP = 2.32, BX = -.12, BZ = -.105, BY = .18, TRAVEL = 1.24, ROPE_BOTTOM = BY + .31;

  f.add(mc(key + '|frame', ({ add, tube }) => {
    // Thick rails are joined to individual feet; there is no floating display slab.
    for (const x of [-.37, .37]) {
      add(G.box(.08, 2.44, .09, .018), C.woodD, x, 1.24, -.32);
      add(G.box(.1, 2.44, .035, .01), cream, x, 1.24, -.258);
      add(G.box(.14, .065, .38, .018), C.woodD, x, .0325, -.23);
      add(G.box(.045, .18, .045, .01), C.gold, x, .2, -.247);
    }
    add(G.box(.89, .12, .20, .025), cream, 0, 2.48, -.22);
    add(G.box(.84, .045, .235, .014), C.terra, 0, 2.5575, -.22);
    add(G.box(.76, .08, .11, .018), C.woodD, 0, .12, -.32);
    // The front gear axles and their small mounting bridge.
    add(G.box(.65, .10, .12, .02), teal, -.045, 1.03, .20);
    add(G.cyl(.025, .025, .24, 10), C.metal, -.12, 1.03, .265, HP, 0, 0);
    // The small gear has a genuine empty square-tool socket, with a recessed hollow sleeve.
    const sleeve = new THREE.Shape(); sleeve.absarc(0, 0, .05, 0, PI * 2, false);
    const bore = new THREE.Path(); bore.absarc(0, 0, .038, 0, PI * 2, true); sleeve.holes.push(bore);
    add(G.ext(sleeve, .10, .002, 12), C.metal, .145, 1.03, .235);
    // Two top pulley journals. The rope meets each wheel at an actual tangent.
    for (const x of [-.265, .025]) {
      tube([x, 2.47, -.22], [x, TOP, -.22], .028, teal, 8);
      add(G.cyl(.02, .02, .17, 10), C.metal, x, TOP, -.16, HP, 0, 0);
      add(G.tor(.085, .008, PI, 5, 18), C.rope, x, TOP, -.16);
    }
    // Return strands run from the far tangent of each pulley to the winding drum.
    for (const x of [-.18, -.06]) {
      tube([x, TOP, -.16], [x, TOP, -.405], .008, C.rope, 5);
      tube([x, TOP, -.405], [.145, 1.03, -.405], .008, C.rope, 5);
    }
    tube([.145, 1.03, -.405], [.145, 1.03, .24], .008, C.rope, 5);
    // Right-side drawer housing: five separate boards leave a real hollow cavity.
    const DX = .285, DZ = -.16, DW = .255, DD = .46, DY = .48, DH = .39;
    add(G.box(DW + .055, .045, DD, .01), C.woodD, DX, DY, DZ);
    for (const sx of [-1, 1]) add(G.box(.035, DH, DD, .01), cream, DX + sx * (DW / 2 + .008), DY + DH / 2, DZ);
    add(G.box(DW, DH, .035, .01), cream, DX, DY + DH / 2, DZ - DD / 2 + .0175);
    add(G.box(DW + .055, .045, DD, .012), teal, DX, DY + DH, DZ);
    for (const x of [DX - .103, DX + .103]) add(G.box(.018, .025, DD - .025, .005), C.gold, x, DY + .04, DZ);
    // A two-step test diagram: lever, basket, then an open box; solid relief only.
    add(G.box(.13, .20, .035, .014), teal, -.37, 1.66, -.24);
    for (const y of [1.61, 1.7]) add(G.box(.075, .018, .014, .004), cream, -.37, y, -.214);
    // The funny reward flag reads as a paw, separate from all usable hiding volumes.
    add(G.box(.18, .18, .035, .016), C.terra, .31, 2.15, -.245);
    add(G.sph(.035, 8, 5), cream, .31, 2.135, -.222, 0, 0, 0, [1, .8, .25]);
    for (const x of [.27, .31, .35]) add(G.sph(.016, 6, 4), cream, x, 2.18, -.222, 0, 0, 0, [1, 1, .3]);
  }));

  const transmission = movingTransmission(key + '|transmission', [
    [1, ({ add }) => {
      add(G.ext(cogShape(.14, .175, 18), .045, .003, 2), C.gold, -.12, 1.03, .295);
      add(G.cyl(.055, .055, .035, 14), teal, -.12, 1.03, .358, HP, 0, 0);
      for (let k = 0; k < 3; k++) { const a = k * PI * 2 / 3; add(G.cyl(.022, .022, .014, 8), cream, -.12 + Math.cos(a) * .092, 1.03 + Math.sin(a) * .092, .349, HP, 0, 0); }
    }],
    [2, ({ add }) => {
      add(G.ext(cogShape(.088, .122, 12, PI / 12, .053), .045, .003, 8), C.terra, .145, 1.03, .295);
      add(G.tor(.066, .014, PI * 2, 6, 20), C.gold, .145, 1.03, .355);
      // Four broad teeth say "a tool goes here" without a label or an initial sparkle.
      for (let k = 0; k < 4; k++) {
        const a = k * HP; add(G.box(.019, .015, .02, .004), cream, .145 + Math.cos(a) * .049, 1.03 + Math.sin(a) * .049, .356, 0, 0, a);
      }
    }],
    ...[-.265, .025].map((x, n) => [3 + n, ({ add }) => {
      add(G.cyl(.085, .085, .065, 18), teal, x, TOP, -.16, HP, 0, 0);
      add(G.tor(.083, .012, PI * 2, 5, 18), C.gold, x, TOP, -.12);
      for (let k = 0; k < 3; k++) add(G.box(.018, .11, .014, .005), cream, x, TOP, -.113, 0, 0, k * PI / 3);
    }]),
    ...[-.35, .11].map((x, n) => [5 + n, ({ add }) => {
      add(G.cyl(.009, .009, TOP - ROPE_BOTTOM, 6), C.rope, x, (TOP + ROPE_BOTTOM) / 2, -.16);
    }]),
    [7, ({ add, tube }) => {
      // A separate lever hub turns only in the first phase while its gear keeps winding.
      tube([-.12, 1.03, .37], [-.33, .84, .37], .028, C.metal, 8);
      add(G.cyl(.036, .036, .045, 12), C.gold, -.12, 1.03, .37, HP, 0, 0);
      add(G.sph(.06, 12, 8), C.terra, -.33, .84, .37);
      add(G.sph(.022, 7, 5), '#feebc8', -.35, .86, .418, 0, 0, 0, [1, 1, .35]);
    }],
    [8, ({ add, tube }) => {
      // The basket's top lug pushes this release sideways, drawing the drawer's pin.
      tube([-.40, 1.685, -.12], [-.28, 1.685, -.12], .022, C.terra, 7);
      tube([-.28, 1.685, -.12], [-.28, 1.685, -.37], .016, C.gold, 6);
      tube([-.28, 1.685, -.37], [-.28, .925, -.37], .013, C.gold, 6);
      tube([-.28, .925, -.37], [.31, .925, -.37], .013, C.gold, 6);
      add(G.box(.095, .045, .035, .009), C.gold, .275, .895, -.37);
    }],
  ]);
  f.add(transmission);

  const basket = grp(); put(basket, BX, BY, BZ); f.add(basket);
  basket.add(mc(key + '|basket', ({ add, tube }) => {
    const BW = .46, BD = .46;
    add(G.box(BW, .045, BD, .015), C.woodD, 0, .0225, 0);
    // Open slatted sides, with a full clear centre and no permanent goods.
    for (const z of [-BD / 2 + .015, BD / 2 - .015]) {
      for (let k = 0; k < 5; k++) add(G.box(.055, .20, .025, .009), C.wood, -.19 + k * .095, .14, z);
      add(G.box(BW + .02, .035, .04, .01), teal, 0, .25, z);
    }
    for (const x of [-BW / 2 + .015, BW / 2 - .015]) {
      for (let k = 0; k < 4; k++) add(G.box(.025, .20, .055, .009), C.wood, x, .14, -.16 + k * .107);
      add(G.box(.04, .035, BD, .01), teal, x, .25, 0);
      tube([x, .25, -.055], [x, .31, -.055], .012, C.gold, 6);
      add(G.tor(.021, .008, PI * 2, 4, 10), C.gold, x, .30, -.055);
    }
    // This little projecting lug is what physically trips the high release arm.
    add(G.box(.09, .04, .065, .01), C.terra, -.255, .265, -.015);
  }));

  const drawer = grp(); put(drawer, .285, .515, -.16); f.add(drawer);
  drawer.add(mc(key + '|drawer', ({ add, tube }) => {
    const DW = .225, DD = .405;
    add(G.box(DW, .025, DD, .008), C.wood, 0, .0125, 0);
    for (const x of [-DW / 2 + .012, DW / 2 - .012]) add(G.box(.024, .265, DD, .008), cream, x, .15, 0);
    add(G.box(DW, .265, .024, .008), cream, 0, .15, -DD / 2 + .012);
    add(G.box(.28, .32, .045, .014), teal, 0, .15, DD / 2 + .014);
    for (const x of [-.045, .045]) add(G.cyl(.012, .012, .035, 8), C.gold, x, .15, DD / 2 + .055, HP, 0, 0);
    tube([-.045, .15, DD / 2 + .073], [.045, .15, DD / 2 + .073], .013, C.gold, 7);
  }));

  // Runtime supplies the found crank. Keeping this group live preserves visible=false
  // through bakeStatic; otherwise a hidden tool would be merged into the fixed frame.
  const installed = grp(); put(installed, .145, 1.03, .355); installed.visible = false; f.add(installed);
  installed.add(mc(key + '|installed-crank', ({ add, tube }) => {
    add(G.cyl(.028, .028, .115, 10), C.metal, 0, 0, -.045, HP, 0, 0);
    add(G.cyl(.049, .049, .025, 14), C.gold, 0, 0, .015, HP, 0, 0);
    tube([0, 0, .033], [.13, -.07, .033], .022, C.metal, 8);
    add(G.cyl(.032, .032, .045, 12), C.terra, .14, -.075, .045, HP, 0, 0);
    add(G.cyl(.02, .02, .008, 10), cream, .14, -.075, .071, HP, 0, 0);
  }));

  // A spring-loaded toy tail is the little anticlimax in the secret drawer. Its mount
  // rides the front lip fully out of the housing before it uncoils in the last 10%.
  const joke = grp(); put(joke, -.015, .29, .19); drawer.add(joke);
  joke.scale.y = .12; joke.visible = false;
  joke.add(mc(key + '|spring-tail', ({ add, tube }) => {
    add(G.box(.09, .025, .055, .01), C.terra, 0, .0125, 0);
    for (let k = 0; k < 3; k++) add(G.tor(.025, .006, PI * 2, 4, 10), C.gold, 0, .04 + k * .025, 0, HP, 0, 0);
    tube([0, .10, 0], [0, .18, 0], .027, cream, 8);
    add(G.tor(.066, .027, PI * 1.72, 7, 20), cream, 0, .235, 0, 0, 0, -.72);
    add(G.sph(.034, 10, 7), '#eecfa3', .055, .182, 0);
  }));
  f.live = [...(f.live || []), installed, joke];

  // Lazy capture follows the shared clothBend convention: room fitting first calls apply
  // after bakeStatic, so deFlush edits and reindexing have already happened.
  let original = null, normals = null, motion = null;
  const spinPoint = (pa, na, i, x, y, a) => {
    const c = Math.cos(a), s = Math.sin(a), dx = original[i] - x, dy = original[i + 1] - y;
    pa[i] = x + dx * c - dy * s; pa[i + 1] = y + dx * s + dy * c;
    if (na) { na[i] = normals[i] * c - normals[i + 1] * s; na[i + 1] = normals[i] * s + normals[i + 1] * c; }
  };
  const p = f.part('lift', [transmission, basket, drawer], (t, driveBase, basketBase, drawerBase) => {
    const lever = phase(t, 0, .20), hoist = phase(t, .20, .80), release = phase(t, .79, .89), reveal = phase(t, .82, 1);
    basket.position.y = basketBase.p.y + TRAVEL * hoist;
    drawer.position.z = drawerBase.p.z + .265 * reveal;
    const surprise = phase(t, .90, 1);
    joke.visible = t > .90; joke.scale.y = .12 + .88 * surprise;
    joke.rotation.z = Math.sin(surprise * PI * 3) * .16 * surprise;
    installed.rotation.z = (.8 * lever + PI * 4 * hoist) * 1.5;
    if (!original) {
      if (t <= 0) return;
      transmission.geometry = transmission.geometry.clone();
      transmission.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
      transmission.geometry.attributes.normal?.setUsage(THREE.DynamicDrawUsage);
      original = transmission.geometry.attributes.position.array.slice();
      normals = transmission.geometry.attributes.normal?.array.slice();
      motion = transmission.geometry.attributes.gptMotion.array;
    }
    const g = transmission.geometry, pa = g.attributes.position.array, na = g.attributes.normal?.array;
    pa.set(original); if (na) na.set(normals);
    const angle = -.8 * lever - PI * 4 * hoist, ropeRatio = (TOP - (ROPE_BOTTOM + TRAVEL * hoist)) / (TOP - ROPE_BOTTOM);
    for (let v = 0; v < motion.length; v++) {
      const i = v * 3, id = motion[v];
      if (id === 1) spinPoint(pa, na, i, -.12, 1.03, angle);
      else if (id === 2) spinPoint(pa, na, i, .145, 1.03, -angle * 1.5);
      else if (id === 3 || id === 4) spinPoint(pa, na, i, id === 3 ? -.265 : .025, TOP, -TRAVEL / .085 * hoist);
      else if (id === 5 || id === 6) pa[i + 1] = TOP - (TOP - original[i + 1]) * ropeRatio;
      else if (id === 7) spinPoint(pa, na, i, -.12, 1.03, .9 * lever);
      else if (id === 8) pa[i] = original[i] + .045 * release;
    }
    g.attributes.position.needsUpdate = true; if (na) g.attributes.normal.needsUpdate = true;
    g.computeBoundingBox(); g.computeBoundingSphere();
  }, { label: '레버 · 톱니 · 도르래 · 비밀 서랍', sfx: 'ratchet', dur: 2.2 });

  // The generic stage can use either place. A placed clue rides the moving basket or drawer.
  f.spot('inside', basket, 0, .052, .005, { part: p, maxH: .55, scale: 1, label: '순경 시험 도르래 바구니' });
  f.spot('inside', drawer, 0, .033, -.055, { part: p, maxH: .27, scale: .85, label: '도르래가 연 비밀 서랍' });
  p.afterOpen = S => S.G.audio.sfx('clink');
  p.gptCues = [{ t: 0, sfx: 'ratchet' }, { t: .2, sfx: 'swish' }, { t: .82, sfx: 'drawer' }];
  installed.traverse(o => { if (o.isMesh) o.userData.part = p; });
  f.gptChain = { part: p, installed, joke, socketAt: [.145, 1.03, .355], handleAt: [-.33, .84, .37],
    sequence: 'crank -> lever -> gears -> basket -> drawer -> spring tail' };
  // hmc already merges each assembly, so generic baking cannot index these single meshes.
  // Share only bit-identical corners, including gptMotion IDs; animation and triangle order stay intact.
  gptIndexLift(f.group);
};
function gptIndexLift(root) {
  root.traverse(o => {
    if (o.isMesh && o.geometry && !o.geometry.index) o.geometry = reindexExact(o.geometry);
  });
}

export const GPTCHAIN_BUILDERS = B;
export const GPTCHAIN_INFO = { gptcadetlift: { w: 1, d: 1, name: '명예 순경 도르래 시험기', hidden: true, price: 0 } };

// GPT workshop · 20판 빌라 옥상 집들이, canonical 1.0.173 kept intact.
// Every static colour uses the shared hmc vertex-colour/toon/ink pipeline.
import * as THREE from 'three';
import { grp, put, mesh, mat, canvasTex, plane, geo } from './kit.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { HG as G, hmc as roofMesh } from './house-props.js';
import { DEVICE_BUILDERS } from './device-props.js';
import { tr } from '../i18n.js';
import './gpt-paper.js';   // (그 글자들의 영어 사전 WORDS)

const PI = Math.PI, HP = PI / 2;
const C = {
  cream: '#fef2e1', cap: '#fefde9', stone: '#e8d7b7', mortar: '#f6e0bf', brick: '#df9f7d', brick2: '#eead82',
  wood: '#eecfa3', woodD: '#6f4b30', green: '#84ae9d', greenD: '#64977e', leaf: '#84ae9d', leaf2: '#6f9a69',
  ink: '#6f4b30', metal: '#a09769', white: '#fefde9', soil: '#6f4b30', coral: '#e98774', yellow: '#feb53d',
};
const B = {};

// Keep identical paint/normal boundaries, but index repeated triangle vertices. This affects only this workshop's
// roof meshes; the canonical house/pulley builders retain their own cached geometry and devices.
function mc(key, build) {
  const m = roofMesh(key + '|fix1022', build);
  const source = m.geometry;
  m.geometry = geo('gptroof-indexed|' + source.uuid, () => mergeVertices(source, 1e-5));
  return m;
}

// Fit the actual glyph bounds with 10% margins, then redraw after Ssurround arrives on a first visit.
function housewarmingSignTexture() {
  let fitted; const T = tr('집들이');   // (영어 화면에선 영어)
  const draw = (c, w, h) => {
    c.clearRect(0, 0, w, h); c.fillStyle = C.cream; c.fillRect(0, 0, w, h);
    c.fillStyle = C.ink; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    let px = 96, m, width, height;
    do {
      c.font = `700 ${px}px Ssurround, Jua, sans-serif`;
      m = c.measureText(T);
      width = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width);
      height = (m.actualBoundingBoxAscent || px * .8) + (m.actualBoundingBoxDescent || px * .2);
      if (width <= w * .8 && height <= h * .8) break;
      px--;
    } while (px > 12);
    const left = m.actualBoundingBoxLeft || 0, ascent = m.actualBoundingBoxAscent || px * .8;
    const x = (w - width) / 2 + left, y = (h - height) / 2 + ascent;
    c.fillText(T, x, y);
    fitted = { text: T, font: c.font, fontSize: px, margin: .1, bounds: [(w - width) / 2, (h - height) / 2, width, height] };
  };
  const tex = canvasTex(384, 192, draw); tex.userData.gptTextFit = fitted;
  if (document.fonts && !document.fonts.check('700 96px Ssurround')) {
    document.fonts.load('700 96px Ssurround').then(() => {
      draw(tex.image.getContext('2d'), tex.image.width, tex.image.height);
      tex.userData.gptTextFit = fitted; tex.needsUpdate = true;
    }).catch(() => {});
  }
  return tex;
}

// A small leaf with a stem, rather than unidentified balls of greenery.
function leaf(add, x, y, z, a, size = 1, color = C.leaf) {
  add(G.sph(.09, 6, 4), color, x, y, z, 0, a, .32, [1.15 * size, .28 * size, .55 * size]);
}
function flower(add, x, y, z, size = 1, color = '#fefde9') {
  for (let k = 0; k < 5; k++) {
    const a = k * PI * 2 / 5;
    add(G.sph(.045 * size, 6, 4), color, x + Math.cos(a) * .045 * size, y + Math.sin(a) * .045 * size, z, 0, 0, a, [1, 1, .45]);
  }
  add(G.sph(.027 * size, 6, 4), '#feb53d', x, y, z + .019 * size, 0, 0, 0, [1, 1, .5]);
}
function pot(add, x, y, z, r = .17, h = .24, color = C.coral) {
  // Four-sided wall/rim is not used: lathe gives an actual round mouth with soil set below its lip.
  const pts = [[r * .7, 0], [r, h * .92], [r, h], [r * .82, h], [r * .79, h * .9], [r * .64, .035], [0, .035]];
  add(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(...p)), 14), color, x, y, z);
  add(G.cyl(r * .79, r * .79, .018, 14), C.soil, x, y + h - .045, z);
}
function plant(add, tube, x, y, z, size = 1, color = C.coral) {
  const h = .23 * size, r = .17 * size;
  pot(add, x, y, z, r, h, color);
  for (let k = 0; k < 5; k++) {
    const a = k * 2.4, px = x + Math.cos(a) * .13 * size, pz = z + Math.sin(a) * .1 * size;
    tube([x, y + h - .04, z], [px, y + h + .2 * size + (k % 2) * .08 * size, pz], .01 * size, C.leaf2, 5);
    leaf(add, px, y + h + .18 * size + (k % 2) * .08 * size, pz, a, size * 1.1, k % 2 ? C.leaf : C.leaf2);
  }
}

// Exposed chunky gears share a visible axle and stay cheap: one merged mesh per rotating gear.
function gearGroup(r, teeth, color, key) {
  const g = grp();
  g.add(mc('gptroof-gear-v1|' + key, ({ add }) => {
    add(G.cyl(r * .82, r * .82, .045, teeth * 2), color, 0, 0, 0, HP);
    for (let k = 0; k < teeth; k++) {
      const a = k / teeth * PI * 2;
      add(G.box(r * .33, r * .26, .05, .006), color, Math.cos(a) * r * .91, Math.sin(a) * r * .91, 0, 0, 0, a);
    }
    add(G.cyl(r * .32, r * .32, .065, 12), '#e8d7b7', 0, 0, .015, HP);
    add(G.cyl(r * .12, r * .12, .073, 10), C.ink, 0, 0, .018, HP);
  }));
  return g;
}
const phase = (t, a, b) => { const u = Math.max(0, Math.min(1, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
function linkRod(rod, a, b) {
  const A = new THREE.Vector3(...a), V = new THREE.Vector3(...b).sub(A), L = V.length();
  rod.position.copy(A).addScaledVector(V, .5);
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), V.divideScalar(L || 1));
  rod.scale.set(1, L, 1);
}

// One connected parapet around an actual two-storey villa. The building facade continues down to the surrounding
// street at -3.45; there is no tabletop plinth. Front planting lives OUTSIDE the wall, never inside a second wall.
B.gptroofshell = (f, T, o = {}) => {
  const drop = o.drop || 3.45;
  // A shell is scenery, not a 7×6 solid furniture obstacle. fitParts() explicitly supports a local collideBox.
  f.noSolid = true; f.noOccupied = true; f.collideBox = [100, 100, 100, 100.01, 100.01, 100.01];
  // Explicit perimeter boxes let walkers respect the parapet without treating the whole building as occupied.
  f.walkBoxes = [
    [-3.62, 0, -3.13, 3.62, .8, -2.84], [-3.62, 0, 2.84, 3.62, .8, 3.13],
    [-3.62, 0, -2.84, -3.28, .8, 2.84], [3.28, 0, -2.84, 3.62, .8, 2.84],
  ];
  f.add(mc('gptroof-shell-v2|' + drop, ({ add, tube }) => {
    add(G.pbox(7.02, drop - .16, 6.02), '#f2dcbc', 0, -(drop + .16) / 2, 0);
    // A shallow cornice belongs to the facade; the waterproof roof remains the game's own floor at y=0.
    add(G.box(7.15, .16, 6.15, .025), '#f6e0bf', 0, -.18, 0);
    for (const [z, h] of [[-3, .56], [3, .43]]) {
      add(G.pbox(7.08, h, .2), C.cream, 0, h / 2, z);
      add(G.box(7.16, .075, .27, .022), C.cap, 0, h + .0375, z);
      add(G.pbox(7.08, .045, .016), C.stone, 0, .065, z + (z > 0 ? -.108 : .108));
    }
    for (const x of [-3.44, 3.44]) {
      add(G.pbox(.2, .5, 5.8), C.cream, x, .25, 0);
      add(G.box(.27, .075, 5.73, .022), C.cap, x, .5375, 0);
      add(G.pbox(.016, .045, 5.8), C.stone, x + (x > 0 ? -.108 : .108), .065, 0);
    }
    // Finished corner piers, and only two intermediate piers: a quiet continuous edge.
    for (const [x, z, h] of [[-3.44, -3, .66], [3.44, -3, .66], [-3.44, 3, .57], [3.44, 3, .57], [-.25, 3, .57], [-3.44, .3, .59]]) {
      add(G.box(.31, h, .31, .025), C.cream, x, h / 2, z);
      add(G.box(.36, .07, .36, .025), C.cap, x, h + .035, z);
    }
    // Inset teal window pairs and cream lintels on all four sides; nothing is textured across a box.
    for (const y of [-1.05, -2.55]) for (const x of [-2.25, -.72, .88, 2.4]) for (const side of [-1, 1]) {
      const z = side * 3.025;
      add(G.box(1.05, .78, .055, .015), '#c6c393', x, y, z);
      add(G.pbox(.86, .6, .026), '#a2c8bb', x, y + .015, z + side * .04);
      add(G.pbox(.035, .62, .035), C.white, x, y + .015, z + side * .062);
      add(G.pbox(.88, .035, .035), C.white, x, y + .015, z + side * .062);
      add(G.box(1.15, .08, .18, .015), '#f6e0bf', x, y - .43, z + side * .075);
      add(G.pbox(.22, .03, .015), '#d4e2e5', x - .22, y + .2, z + side * .06);
    }
    for (const y of [-1.05, -2.55]) for (const z of [-1.8, 0, 1.8]) for (const side of [-1, 1]) {
      const x = side * 3.525;
      add(G.box(.055, .78, 1.05, .015), '#c6c393', x, y, z);
      add(G.pbox(.026, .6, .86), '#84ae9d', x + side * .04, y + .015, z);
      add(G.pbox(.035, .62, .035), C.white, x + side * .062, y + .015, z);
      add(G.pbox(.035, .035, .88), C.white, x + side * .062, y + .015, z);
      add(G.box(.18, .08, 1.15, .015), '#f6e0bf', x + side * .075, y - .43, z);
    }
    for (const z of [-2.7, 2.7]) {
      tube([3.62, -.12, z], [3.62, -drop + .12, z], .035, '#a09769', 7);
      for (const y of [-.75, -2.25]) add(G.pbox(.025, .06, .14), '#84ae9d', 3.65, y, z);
    }
    // A real supply hose continues from the hut tank's outlet to the kitchen garden, along the right parapet.
    // It belongs to noSolid architecture so its long, thin bounds do not block the whole hut-to-garden aisle.
    for (const [a, b] of [
      [[3.21, .26, -1.63], [3.15, .26, -1.45]], [[3.15, .26, -1.45], [3.15, .26, .68]],
      [[3.15, .26, .68], [2.95, .26, .82]], [[2.95, .26, .82], [2.95, .35, .82]],
    ]) tube(a, b, .026, '#84ae9d', 7);
    for (const z of [-.8, .15]) add(G.cyl(.038, .038, .08, 10), '#eecfa3', 3.15, .26, z, HP);
    // Sparing ivy is attached to the OUTER front surface. Every leaf is clear of the cap's outer face.
    for (const x of [-2.1, 1.3]) {
      tube([x, .5, 3.16], [x + .07, -.55, 3.16], .012, C.leaf2, 5);
      tube([x, .5, 3.16], [x - .16, -.24, 3.18], .01, C.leaf2, 5);
      for (let k = 0; k < 7; k++) {
        const yy = .44 - k * .14, xx = x + .07 * k / 7 + (k % 2 ? -.06 : .07);
        add(G.sph(.085, 6, 4), k % 2 ? C.leaf : C.leaf2, xx, yy, 3.17, .25, 0, (k % 2 ? -.6 : .6), [1, .8, .28]);
      }
    }
  }));
};

// Warm timber lounge deck. The whole piece is below feet; separate existing pyeongsang remains a working device.
B.gptroofdeck = f => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [100, 100, 100, 100.01, 100.01, 100.01];
  // NPCs remain on the waterproof roof rather than walking through the raised wooden top.
  f.walkBoxes = [[-1.075, 0, -1.025, 1.075, .145, 1.26], [-1.03, .1, -1.01, -.89, 2.25, -.86], [.89, .1, -1.01, 1.03, 2.25, -.86]];
  f.add(mc('gptroof-deck-v2', ({ add, tube }) => {
    add(G.box(2.15, .1, 2.05, .025), C.woodD, 0, .05, 0);
    for (let k = 0; k < 8; k++) add(G.box(.25375, .045, 2.02, .008), k % 3 === 1 ? '#f6e0bf' : C.wood, -.940625 + k * .26875, .1225, 0);
    add(G.box(2.07, .075, .24, .018), '#eecfa3', 0, .0375, 1.14);
    // Two real fixed poles support both ends of the sunny party garland.
    for (const x of [-.96, .96]) {
      add(G.box(.09, 2.05, .09, .016), C.woodD, x, 1.155, -.93);
      add(G.box(.18, .06, .18, .015), '#c67f2a', x, .17, -.93);
      add(G.sph(.065, 7, 5), C.wood, x, 2.22, -.93);
    }
    let prev = null;
    for (let k = 0; k <= 10; k++) {
      const t = k / 10, x = -.96 + 1.92 * t, y = 2.16 - Math.sin(t * PI) * .28, p = [x, y, -.93];
      if (prev) tube(prev, p, .009, '#6f4b30', 5); prev = p;
      if (k && k < 10 && k % 2 === 0) {
        tube([x, y, -.93], [x, y - .07, -.93], .009, C.ink, 5);
        add(G.sph(.052, 8, 6), '#f8b15b', x, y - .11, -.93, 0, 0, 0, [1, 1.15, 1]);
      }
      if (k && k < 10 && k % 2) {
        const tri = new THREE.Shape(); tri.moveTo(-.07, 0); tri.lineTo(.07, 0); tri.lineTo(0, -.16); tri.closePath();
        add(G.ext(tri, .015), ['#e98774', '#f8b15b', '#84ae9d'][k % 3], x, y - .055, -.925);
      }
    }
    // One modest pot at the front corner leaves the compact lounge clear.
    plant(add, tube, -.85, .075, 1.14, .85, '#ee9d4c');
  }));
};

// A table with an intentionally legible colour/size observation clue. Each dish has its own place on the front half.
// Size-order code 0/1/2 uses exactly the canonical LOCK_COLORS. Row order is medium, small, tall.
B.gptroofpartytable = f => {
  // The table stands on the .145 m deck: use its support plane, not the lower rooftop, for the .78 m height.
  const top = .78, rise = top - .62;
  f.add(mc('gptroof-partytable-v1', ({ add }) => {
    add(G.box(1.88, .075, .8, .045), '#eecfa3', 0, top - .0375, 0);
    add(G.box(1.71, .08, .66, .02), C.woodD, 0, top - .12, 0);
    for (const x of [-.74, .74]) for (const z of [-.25, .25]) add(G.box(.09, top - .12, .09, .018), C.woodD, x, (top - .12) / 2, z);
    // A cream runner is thick enough to read as cloth, with no coplanar faces on the tabletop.
    add(G.box(1.7, .016, .3, .006), '#fef2e1', 0, top + .008, -.17);
    for (const x of [-.68, .68]) add(G.pbox(.027, .019, .3), '#84ae9d', x, top + .01, -.17);
    // Cake left, tea cup centre, mandarin plate right, at least 0.12 between their silhouettes.
    add(G.cyl(.15, .15, .025, 18), C.white, -.6, top + .014, .2);
    add(G.cyl(.105, .11, .12, 18), '#f6e0bf', -.6, top + .087, .2);
    add(G.cyl(.11, .11, .025, 18), '#e98774', -.6, top + .16, .2);
    for (const a of [0, 2.1, 4.2]) add(G.sph(.025, 8, 6), '#dc6757', -.6 + Math.cos(a) * .055, top + .19, .2 + Math.sin(a) * .055);
    add(G.cyl(.11, .11, .018, 16), C.white, -.05, top + .01, .2);
    add(G.cyl(.067, .058, .105, 14), '#a2c8bb', -.05, top + .073, .2);
    add(G.cyl(.055, .055, .012, 14), '#6f4b30', -.05, top + .13, .2);
    add(G.tor(.045, .014, PI * 1.6, 5, 14), '#a2c8bb', .04, top + .08, .2, 0, .2, .2);
    add(G.cyl(.15, .15, .025, 18), C.white, .3, top + .014, .2);
    for (const [x, z] of [[.25, .18], [.35, .18], [.3, .27]]) {
      add(G.sph(.053, 10, 7), '#feb53d', x, top + .07, z, 0, 0, 0, [1, .9, 1]);
      add(G.sph(.012, 6, 4), C.leaf2, x, top + .12, z, 0, 0, 0, [1, .4, 1]);
    }
  }));
  // The public observation note sits on a separate cream card tray; no auxiliary mechanism guards this clue.
  f.add(mc('gptroof-publicnotetray-v1', ({ add }) => {
    add(G.box(.41, .025, .3, .014), '#c67f2a', .73, top + .0125, .23);
    add(G.box(.385, .012, .275, .009), '#fef2e1', .73, top + .031, .23);
  }));
  // The housewarming sign turns over to point at the jars; its linkage slides the drawer out,
  // then lifts its false bottom. This is the compact secret floor beside the pyeongsang, with a real space below.
  f.add(mc('gptroof-tabledrawercase-v1', ({ add }) => {
    for (const x of [-.53, .53]) add(G.box(.045, .18, .59, .009), '#c67f2a', x, .37 + rise, .025);
    add(G.box(1.1, .18, .035, .009), '#c67f2a', 0, .37 + rise, -.25);
    for (const x of [-.5, .5]) add(G.box(.035, .025, .52, .006), '#eecfa3', x, .28 + rise, .015);
  }));
  const drawer = grp(); put(drawer, 0, .285 + rise, -.1); f.add(drawer);
  drawer.add(mc('gptroof-tabledrawer-v1', ({ add }) => {
    add(G.box(.95, .025, .5, .008), '#f6e0bf', 0, .0125, .15);
    for (const x of [-.46, .46]) add(G.box(.035, .12, .5, .008), '#eecfa3', x, .085, .15);
    add(G.box(.95, .12, .035, .008), '#eecfa3', 0, .085, -.085);
    add(G.box(1.08, .18, .05, .012), '#eaa440', 0, .08, .42);
    add(G.box(.19, .045, .055, .012), '#feebc8', 0, .1, .465);
    // A folded recipe book lives beside the empty clue position inside the drawer.
    add(G.box(.19, .035, .25, .009), '#84ae9d', -.31, .043, .17);
    add(G.pbox(.16, .022, .24), '#fef2e1', -.31, .043, .178);
  }));
  f.add(mc('gptroof-signstand-v1', ({ add, tube }) => {
    add(G.box(.14, .025, .12, .008), '#c67f2a', -.75, top + .014, .34);
    tube([-.75, top + .025, .34], [-.75, top + .17, .43], .018, '#a09769', 7);
    tube([-.75, top + .17, .43], [-.75, top + .41, .43], .018, '#a09769', 7);
  }));
  const sign = grp(); put(sign, -.75, top + .41, .43); f.add(sign);
  sign.add(mc('gptroof-flipsign-v1', ({ add }) => {
    add(G.box(.5, .26, .05, .025), '#84ae9d');
    // An off-white paper sheet with a real missing corner, a lifted tip and two short tape strips.
    const paper = new THREE.Shape();
    paper.moveTo(-.225, -.1075); paper.lineTo(.18, -.1075); paper.lineTo(.225, -.0625);
    paper.lineTo(.225, .1075); paper.lineTo(-.225, .1075); paper.closePath();
    add(G.ext(paper, .008), C.cream, 0, 0, .029);
    const curl = new THREE.BufferGeometry();
    curl.setAttribute('position', new THREE.Float32BufferAttribute([.18, -.1075, .038, .225, -.1075, .073, .225, -.0625, .038], 3));
    curl.computeVertexNormals(); add(curl, '#feebc8');
    for (const [x, a] of [[-.15, -.16], [.14, .14]]) add(G.box(.09, .035, .012, .004), '#f6e0bf', x, .096, .047, 0, 0, a);
    // Back-face arrow is mirrored before the half turn: open, it points up/right toward the actual jars.
    const dx = -3 / Math.hypot(3, 1.65), dy = 1.65 / Math.hypot(3, 1.65), angle = Math.atan2(dy, dx);
    add(G.box(.22, .035, .025, .007), '#c67f2a', 0, -.006, -.043, 0, 0, angle);
    add(G.cone(.065, .12, 3), '#c67f2a', dx * .13, dy * .13, -.043, 0, 0, angle - HP, [1, 1, .24]);
  }));
  const signFace = housewarmingSignTexture();
  sign.add(put(plane(.36, .15, mat('#ffffff', { map: signFace })), -.005, .003, .039));
  const falseFloor = grp(); put(falseFloor, 0, .075, -.06); drawer.add(falseFloor);
  falseFloor.add(mc('gptroof-secretfloor-v1', ({ add }) => {
    add(G.box(.88, .024, .4, .009), '#eecfa3', 0, .012, .2);
    for (let k = 0; k < 4; k++) add(G.pbox(.016, .006, .38), '#f6e0bf', -.3 + k * .2, .027, .2);
    add(G.tor(.035, .011, PI * 2, 5, 12), '#c67f2a', .26, .033, .31, HP);
  }));
  const drawerPart = f.part('drawer', [sign, drawer, falseFloor], (t, bs, bd) => {
    const flip = phase(t, 0, .6), slide = phase(t, .25, .75), reveal = phase(t, .7, 1);
    sign.rotation.y = PI * flip; drawer.position.z = bd.p.z + .58 * slide;
    falseFloor.rotation.x = -1.15 * reveal;
  }, { label: '집들이 뒤집는 간판과 비밀 바닥', sfx: 'drawer', dur: 1.0 });
  drawerPart.gptDevice = 'roofTable'; drawerPart.gptHandle = sign;
  drawerPart.gptAction = 'touch'; drawerPart.gptReaction = '이쪽이었어?!';
  drawerPart.gptArrowTarget = 'gptroofjars'; drawerPart.gptArrowDirection = [3.0, -1.65];
  const secretSpot = f.spot('inside', drawer, .08, .03, .17, { part: drawerPart, maxH: .035, label: '평상 앞 상 비밀 바닥 밑', scale: .85 });
  // Flat correspondence only; ordinary targets must never be shrunk to fit this shallow comic reveal.
  secretSpot.reserved = true; secretSpot.gptClueOnly = true;
  f.gptSecretDrawer = drawerPart;
  const vases = grp(); f.add(vases);
  // Keep the existing clue group addressable through bakeStatic's body merge for tap/focus.
  (f.live ||= []).push(vases);
  const order = [1, 0, 2], heights = [.25, .34, .43], colors = ['#ff4f66', '#ffc93c', '#3fb6ff'];
  for (let slot = 0; slot < 3; slot++) {
    const k = order[slot], hh = heights[k], rr = .115 + .018 * k, x = -.57 + slot * .57;
    const vase = grp(); put(vase, x, top + .018, -.18); vases.add(vase);
    vase.userData.gptVase = { size: k, colorIndex: k, height: hh };
    vase.add(mc('gptroof-vase-v1|' + k, ({ add, tube }) => {
      const pts = [[0, 0], [rr * .66, 0], [rr, hh * .2], [rr * .97, hh * .53], [rr * .48, hh * .73], [rr * .44, hh], [rr * .3, hh], [rr * .32, hh * .74], [0, hh * .7]];
      add(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(...p)), 18), colors[k]);
      add(G.tor(rr * .37, .012, PI * 2, 5, 16), C.white, 0, hh, 0, HP);
      // Clear white vertical highlight, with a modest single flower rather than a cluttered bouquet.
      add(G.sph(.027, 7, 5), '#fef2e1', -rr * .46, hh * .41, rr * .8, 0, 0, -.2, [.45, 1.8, .3]);
      tube([0, hh * .76, 0], [.025, hh + .17, 0], .008, C.leaf2, 5);
      leaf(add, -.035, hh + .065, 0, 0, .55, C.leaf);
      flower(add, .025, hh + .19, .012, .85, k === 1 ? '#e98774' : '#fefde9');
    }));
  }
  // A dedicated existing-clue hook avoids obslock.js placing a second tiny trio on top of these vases.
  const clueSpot = f.spot('on', null, 0, top + .025, -.18, { maxH: .75, label: '집들이 꽃병 세 개' });
  clueSpot.reserved = true;
  f.vaseClue = { code: '012', order, g: vases, spot: clueSpot };
  f.spot('under', null, 0, 0, .12, { maxH: .42 + rise, label: '집들이 상 밑', scale: .9 });
  f.spot('on', null, .73, top + .04, .23, { maxH: .4, label: '꽃병 관찰 쪽지 받침', scale: 1.2 });
};

// The canonical pulley device, with its two ordinary lids explicitly available to the existing pad/colour chain.
// Geometry, crank/rope, big-jar device and hiding spots stay exactly those of DEVICE_BUILDERS.pulleyjang.
B.gptroofjars = (f, T, o = {}) => {
  DEVICE_BUILDERS.pulleyjang(f, T, o);
  // Reveal-only comic prop: a clean copy of the same clay lid becomes a tiny tilted hat. The real jar lid stays put.
  const storyLid = f.parts[0].pivots[0];
  f.gptDressFriend = ch => {
    if (!ch || !(ch.inner || ch.body)) return null;
    if (ch.gptRoofLidHat) return ch.gptRoofLidHat;
    storyLid.updateMatrixWorld(true);
    const inv = storyLid.matrixWorld.clone().invert(), hat = grp(); hat.name = 'gpt-clay-lid-hat';
    storyLid.traverse(src => {
      if (!src.isMesh || src.userData.proxy) return;
      // Object3D.clone would JSON-copy circular furniture/part userData, so copy only render data and transforms.
      const copy = new THREE.Mesh(src.geometry, src.material);
      copy.applyMatrix4(inv.clone().multiply(src.matrixWorld));
      copy.castShadow = false; copy.receiveShadow = true; copy.userData = { char: ch }; hat.add(copy);
    });
    hat.userData.char = ch; hat.scale.setScalar(.55);
    put(hat, 0, (ch.top || .8) + .023, -.035, -.06, .08, -.11);
    (ch.inner || ch.body).add(hat); ch.gptRoofLidHat = hat;
    return hat;
  };
  for (const [i, kind, z] of [[1, 'pad', .225], [2, 'color', .18]]) {
    const p = f.parts[i], lid = p.pivots[0];
    p.lockable = true; p.lockKind = kind;
    p.lockAt = { x: 0, y: -.015, z: z + .032, parent: lid };
    lid.add(mc('gptroof-jarclasp-v1|' + i, ({ add }) => {
      add(G.box(.065, .13, .035, .009), '#a09769', 0, -.025, z);
      add(G.sph(.012, 6, 4), '#f6e0bf', 0, .019, z + .023);
    }));
    const spot = p.spots[0], old = spot.anchor.position.clone(), R = i === 1 ? .27 : .21;
    const tray = grp(); put(tray, old.x, old.y - .1, old.z); f.add(tray);
    tray.add(mc('gptroof-jartraycore-v2|' + i, ({ add }) => {
      add(G.box(.12, .025, .16, .009), '#eecfa3', 0, .0125, 0);
    }));
    const left = grp(), right = grp(); put(left, -.06, 0, 0); put(right, .06, 0, 0); tray.add(left, right);
    left.add(mc('gptroof-jartraywing-l-v2', ({ add }) => { add(G.box(.24, .025, .16, .009), '#eecfa3', -.12, .0125, 0); }));
    right.add(mc('gptroof-jartraywing-r-v2', ({ add }) => { add(G.box(.24, .025, .16, .009), '#eecfa3', .12, .0125, 0); }));
    // Each end is a two-leaf accordion: .11 m folded depth becomes .22 m. All three columns together open to
    // .60 × .60 m, while the closed .12 × .16 m bundle still passes the original small jar's .1134 m neck.
    const leaves = [];
    for (const [parent, x, width, column] of [[tray, 0, .12, 0], [left, -.12, .24, 1], [right, .12, .24, 2]]) {
      for (const side of [-1, 1]) {
        const flap = grp(), tip = grp(), foldedY = column === 0 ? (side < 0 ? .052 : .112) : (side < 0 ? -.027 : -.087);
        put(flap, x, foldedY, side * .08); parent.add(flap);
        flap.add(mc('gptroof-jartrayleaf-v2|' + column + '|' + side, ({ add }) => {
          add(G.box(width, .025, .11, .007), '#eecfa3', 0, .0125, side * .055);
        }));
        put(tip, 0, -.004, side * .11); flap.add(tip);
        tip.add(mc('gptroof-jartrayleaf-v2|' + column + '|' + side, ({ add }) => {
          add(G.box(width, .025, .11, .007), '#eecfa3', 0, .0125, side * .055);
        }));
        leaves.push({ flap, tip, side, foldedY });
      }
    }
    const anchorAt = [old.x, old.y - .03, old.z + R * .78];
    f.add(mc('gptroof-jartraymount-v1|' + i, ({ add }) => { add(G.box(.065, .075, .045, .01), '#c67f2a', ...anchorAt); }));
    const arm = mesh(G.cyl(.016, .016, 1, 7), mat('#c67f2a')); f.add(arm);
    spot.anchor.parent.remove(spot.anchor); spot.anchor.position.set(0, .03, 0); tray.add(spot.anchor);
    // A narrow folded shelf fits the closed jar. Opening lifts it above the neck, slides it forward, and unfolds wings.
    const baseY = old.y - .1, endZ = old.z + R + .42;
    const pose = t => {
      const lift = phase(t, .30, .55), slide = phase(t, .56, .72), unfold = phase(t, .74, .86);
      tray.position.x = old.x + (i === 2 ? .205 : 0) * slide;
      tray.position.y = baseY + .47 * lift; tray.position.z = old.z + (endZ - old.z) * slide;
      left.rotation.z = HP * (1 - unfold); right.rotation.z = -HP * (1 - unfold);
      for (const { flap, tip, side, foldedY } of leaves) {
        const open = phase(t, .86, .95), end = phase(t, .95, 1);
        flap.position.y = foldedY * (1 - open); flap.rotation.x = side * PI * (1 - open);
        tip.position.y = -.004 * (1 - end); tip.rotation.x = -side * PI * (1 - end);
      }
      linkRod(arm, anchorAt, [tray.position.x, tray.position.y, tray.position.z - .08]);
    };
    pose(0);
    for (const pv of [tray, left, right, ...leaves.flatMap(q => [q.flap, q.tip]), arm]) { pv.userData.base = { p: pv.position.clone(), r: pv.rotation.clone(), s: pv.scale.clone() }; p.pivots.push(pv); }
    const applyLid = p.apply;
    p.apply = (t, ...base) => { const opened = phase(t, 0, .28); applyLid(opened, ...base); lid.position.x += .18 * opened; pose(t); };
    p.dur = 1.5; p.gptSounds = ['creak', 'slide', 'clink', 'pop']; p.gptFoldOutTray = tray; spot.gptOpenCapacity = .6;
  }
};

// Preview-only postconfiguration: keep canonical roofline, its bending cloth and hanging hook untouched. Its existing
// drop spot lands on a .45 m clear patch of real roof in front of the quilt, away from the posts and parapet.
export function configureGptRoofLanding(room) {
  const f = room?.furns?.find(r => r.type === 'roofline')?.f;
  const s = f?.spots.find(q => q.kind === 'inside' && q.part?.label === '이불');
  if (!s) return null;
  s.anchor.position.set(-.25, .015, .30); s.maxH = .4; s.scale = 1.1;
  s.gptRevealLanding = true; s.gptLandingClearance = .45;
  delete s._clr; delete s._probe;
  const p = s.part, cloth = p.pivots[0];
  if (!p.gptHandle) {
    const handle = new THREE.Object3D(); handle.name = 'gpt-roof-quilt-touch'; cloth.add(handle);
    // Follow the real deforming quilt's mesh bounds. The root pivot itself stays at the fixed clothesline.
    const ms = []; cloth.traverse(o => { if (o.isMesh && !o.userData.proxy) ms.push(o); });
    const box = new THREE.Box3(), one = new THREE.Box3(), inv = new THREE.Matrix4(), local = new THREE.Matrix4();
    const followCloth = () => {
      cloth.updateWorldMatrix(true, true); inv.copy(cloth.matrixWorld).invert(); box.makeEmpty();
      for (const m of ms) {
        m.geometry.boundingBox || m.geometry.computeBoundingBox();
        box.union(one.copy(m.geometry.boundingBox).applyMatrix4(local.copy(inv).multiply(m.matrixWorld)));
      }
      if (!box.isEmpty()) box.getCenter(handle.position); else handle.position.set(0, -.48, .035);
    };
    const bend = p.apply;
    p.apply = (...args) => { bend(...args); followCloth(); }; p.apply.cloth = true;
    p.gptHandle = handle; followCloth();
  }
  return s;
}

// Coral brick stair hut: the opened door reveals a seven-step stair flight, a landing and a handrail. The flight
// reaches a real roof maintenance hatch. The hatch is separated from the yellow tank, so opening either part never
// leaves the tank floating. The stairwell is not a textured panel or a door placed on a solid box.
B.gptroofstairhut = f => {
  const x0 = -.86, x1 = .86, z0 = -.82, z1 = .79, H = 2.38, t = .09;
  // The 2.06 m door panel and .075 m weather step leave 2.0725 m clear below the header.
  // Raising the roof by .13 m also keeps the attached awning clear of its underside.
  const dx = -.2, dw = .86, dl = dx - dw / 2, dr = dx + dw / 2, dh = 2.15, doorY = (dh - .09) / 1.38;
  f.collideBox = [x0, 0, z0, x1, H + .93, z1];
  // A separate stair chain uses the actual hollow entry; ordinary floor nodes stay outside the hut footprint so
  // nobody stands under the solid risers. These wall/rail boxes validate that elevated route in local coordinates.
  f.walkBoxes = [
    [x0 - t / 2, 0, z0 - t / 2, x1 + t / 2, H, z0 + t / 2],
    [x0 - t / 2, 0, z0, x0 + t / 2, H, z1 + t / 2],
    [x1 - t / 2, 0, z0, x1 + t / 2, H, z1 + t / 2],
    [x0 - t / 2, 0, z1 - .06, dl + .0095, H, z1 + .072],
    [dr - .0095, 0, z1 - .06, x1 + t / 2, H, z1 + .072],
    [.238, .1, -.72, .282, 1.6, .66],
  ];
  f.add(mc('gptroof-stairhut-v3|' + H + '|' + dh, ({ add, tube }) => {
    add(G.pbox(x1 - x0, H, t), C.brick, 0, H / 2, z0);
    for (const x of [x0, x1]) add(G.pbox(t, H, z1 - z0 + t), C.brick, x, H / 2, (z0 + z1) / 2);
    add(G.pbox(dl - x0, H, t), C.brick, (x0 + dl) / 2, H / 2, z1);
    add(G.pbox(x1 - dr, H, t), C.brick, (dr + x1) / 2, H / 2, z1);
    add(G.pbox(dw, H - dh, t), C.brick, dx, dh + (H - dh) / 2, z1);
    // Cream inner lining brightens the stairwell; inset from exterior corners, not a dark dead end.
    add(G.pbox(x1 - x0 - t, H - .08, .02), '#feebc8', 0, H / 2, z0 + t / 2 + .013);
    add(G.pbox(.02, H - .08, z1 - z0 - t), '#fef2e1', x0 + t / 2 + .013, H / 2, -.015);
    add(G.pbox(.02, H - .08, z1 - z0 - t), '#fef2e1', x1 - t / 2 - .013, H / 2, -.015);
    // Every front brick is outside the doorway opening, with soft mortar gaps.
    for (let row = 0; row < Math.ceil((H - .075) / .133); row++) {
      const y = .075 + row * .133, bh = Math.min(.108, (H - .015 - y) * 2);
      for (let col = 0; col < 7; col++) {
        const x = -.75 + col * .25 + (row % 2 ? .125 : 0), bw = Math.min(.221, x1 - .04 - (x - .11));
        if (bw < .045 || (x + .11 > dl - .02 && x - .11 < dr + .02 && y < dh + .05)) continue;
        add(G.pbox(bw, bh, .014), (row + col) % 4 ? C.brick2 : '#c67f2a', x - (.221 - bw) / 2, y, z1 + .052);
      }
      // Brick courses on the east side: a restrained brick pattern, no whole-box texture stretch.
      for (let k = 0; k < 6; k++) {
        const z = -.68 + k * .25 + (row % 2 ? .125 : 0);
        if (z > .7) continue;
        add(G.pbox(.014, bh, .22), (row + k) % 4 ? C.brick2 : '#c67f2a', x1 + .052, y, z);
      }
    }
    // Door jambs stop at their opening. The weather step sits out in the open roof.
    for (const x of [dl - .028, dr + .028]) add(G.box(.075, dh + .04, .12, .01), '#f6e0bf', x, dh / 2, z1 + .012);
    add(G.box(dw + .13, .075, .13, .01), '#f6e0bf', dx, dh + .035, z1 + .012);
    add(G.box(dw + .16, .075, .32, .012), '#e8d7b7', dx, .0375, z1 + .13);
    // Internal flight rises to the hatch: seven separate pale risers / treads, all the way to the rear landing.
    add(G.pbox(1.48, .04, 1.39), '#e8d7b7', 0, .02, -.015);
    for (let k = 0; k < 7; k++) {
      const h = .15 * (k + 1), z = .6 - k * .19;
      add(G.pbox(.74, h, .19), k % 2 ? '#f6e0bf' : '#eecfa3', dx, h / 2 + .04, z);
      add(G.box(.75, .026, .205, .006), '#fef2e1', dx, h + .053, z + .004);
    }
    add(G.pbox(.74, 1.05, .36), '#eecfa3', dx, .565, -.585);
    add(G.box(.75, .026, .36, .006), '#fef2e1', dx, 1.103, -.585);
    // Attached steel handrail follows the flight on the right.
    tube([.26, .52, .63], [.26, 1.58, -.69], .022, '#84ae9d', 7);
    for (const [y, z] of [[.3, .5], [.7, -.05], [1.07, -.59]]) tube([.26, y, z], [.26, y + .35, z], .018, '#84ae9d', 6);
    // Roof split round an actual hatch opening x[-.61,.21], z[-.76,.02].
    add(G.box(1.91, .1, .79, .015), '#feebc8', 0, H + .05, .47);
    add(G.box(.36, .1, .93, .015), '#feebc8', -.78, H + .05, -.395);
    add(G.box(.7, .1, .93, .015), '#feebc8', .605, H + .05, -.395);
    add(G.box(.82, .1, .13, .015), '#feebc8', dx, H + .05, -.825);
    add(G.pbox(1.83, .018, .72), C.green, 0, H + .108, .47);
    add(G.pbox(.29, .018, .86), C.green, -.78, H + .108, -.395);
    add(G.pbox(.63, .018, .86), C.green, .605, H + .108, -.395);
    // Small green rain awning: braces meet the brick, and the top never blocks the door's sweep.
    add(G.box(dw + .3, .065, .35, .02), '#84ae9d', dx, dh + .16, z1 + .13, -.08);
    for (const x of [dl - .07, dr + .07]) tube([x, dh + .04, z1 + .07], [x, dh + .14, z1 + .28], .016, '#a2c8bb', 5);
    // A pair of large blue-striped slippers, separated, at the right of the stair entrance.
    for (const x of [.52, .7]) {
      add(G.box(.14, .035, .25, .024), '#fef2e1', x, .0175, .97);
      add(G.box(.145, .07, .12, .025), '#6baebd', x, .065, 1.015);
      for (const z of [.99, 1.025, 1.06]) add(G.pbox(.14, .012, .012), C.white, x, .103, z);
    }
    // The villa's yellow water tank on a steel support, with connected supply and overflow pipes — 1.6× the workshop's
    // (사용자 10/22 "옥상 수조 좀 더 크게": a real rooftop tank reads at a glance)
    for (const x of [.24, .88]) for (const z of [-.66, -.02]) add(G.box(.06, .13, .06, .01), C.metal, x, H + .18, z);
    add(G.box(.86, .05, .86, .014), '#a09769', .56, H + .27, -.34);
    add(G.cyl(.4, .43, .85, 24), '#feb53d', .56, H + .72, -.34);
    for (const y of [H + .38, H + .62, H + .9, H + 1.08]) add(G.tor(.405, .024, PI * 2, 5, 24), '#eaa440', .56, y, -.34, HP);
    add(G.cyl(.34, .38, .07, 24), '#f8b15b', .56, H + 1.18, -.34);
    add(G.cyl(.09, .09, .035, 12), '#a09769', .56, H + 1.235, -.34);
    tube([.99, H + .42, -.34], [1.1, H + .42, -.34], .028, '#a09769', 7);
    tube([1.1, H + .42, -.34], [1.1, .26, -.34], .028, '#a09769', 7);
    tube([1.1, .26, -.34], [1.1, .26, .2], .028, '#a09769', 7);
    add(G.cyl(.042, .042, .045, 10), '#ee9d4c', 1.1, .26, .2, HP);
  }));
  const door = grp(); put(door, dr, .075, z1 + .06); f.add(door);
  door.add(mc('gptroof-stairdoor-v2|' + dh, ({ add }) => {
    add(G.box(dw - .045, dh - .09, .065, .018), '#84ae9d', -(dw - .045) / 2, (dh - .09) / 2, 0);
    add(G.box(dw - .14, .43 * doorY, .026, .012), '#a2c8bb', -(dw - .045) / 2, .3 * doorY, .045);
    add(G.box(.36, .32 * doorY, .028, .025), '#feebc8', -.42, 1.04 * doorY, .046);
    add(G.box(.29, .25 * doorY, .025, .018), '#a2c8bb', -.42, 1.04 * doorY, .066);
    add(G.pbox(.025, .26 * doorY, .018), C.white, -.42, 1.04 * doorY, .088);
    add(G.box(.045, .15, .04, .012), '#eaa440', -.72, .69 * doorY, .061);
    add(G.box(.13, .035, .05, .012), '#feebc8', -.68, .75 * doorY, .095);
    for (const y of [.24, 1.16]) add(G.cyl(.027, .027, .12, 10), '#a09769', .005, y * doorY, 0);
    // Ventilation bars are attached to the lower green panel.
    for (let k = 0; k < 4; k++) add(G.box(.25, .017, .018, .005), '#64977e', -.42, (.19 + k * .06) * doorY, .065);
  }));
  const p = f.part('door', door, t => { door.rotation.y = 1.48 * t; }, { label: '옥탑 계단문', sfx: 'open', dur: .38 });
  // Foot → weather step → seven actual tread tops → a .36 m deep top landing. The same doorway gates both ways.
  f.walkSteps = [{
    label: '옥탑 일곱 계단', width: .74, headroom: H - 1.116, door: p, minOpen: .98, stairsOnly: true,
    points: [[dx, 0, 2.02], [dx, 0, 1.48], [dx, .075, 1.02], [dx, .075, .81], ...Array.from({ length: 7 }, (_, k) => [dx, .15 * (k + 1) + .066, k === 6 ? -.50 : .6 - k * .19]), [dx, 1.116, -.49]],
    treads: Array.from({ length: 7 }, (_, k) => [dx - .375, .04, .6 - k * .19 - .1025, dx + .375, .15 * (k + 1) + .066, .6 - k * .19 + .1065]),
    landing: [dx - .375, 1.09, -.765, dx + .375, 1.116, -.405],
    doorway: [dl + .0095, .075, z1 + .06, dr - .0095, dh, z1 + .06],
  }];
  p.lockAt = { x: -.65, y: .77 * doorY, z: .1, parent: door };
  f.spot('inside', null, dx, .223, .58, { part: p, maxH: .38, label: '계단 첫 칸', scale: .95 });
  const hatch = grp(); put(hatch, dx, H + .115, -.77); f.add(hatch);
  hatch.add(mc('gptroof-stairhatch-v1', ({ add }) => {
    add(G.box(.8, .055, .78, .016), '#84ae9d', 0, .0275, .39);
    add(G.box(.69, .022, .65, .012), '#a2c8bb', 0, .065, .39);
    add(G.box(.17, .045, .04, .01), '#e8d7b7', 0, .105, .63);
    for (const x of [-.29, .29]) add(G.cyl(.025, .025, .12, 10), '#a09769', x, .025, -.004, 0, 0, HP);
  }));
  // A short downward lever drives two exposed gears and a rising rack. The two circular inputs on this roof are
  // already the canonical pulley and garden crank; this third mechanism deliberately has a different gesture.
  f.add(mc('gptroof-hutmechanismcase-v1', ({ add }) => {
    add(G.box(.38, .55, .04, .015), '#eecfa3', .59, 1.48, .875);
    for (const [x, y] of [[.48, 1.34], [.61, 1.56]]) add(G.cyl(.025, .025, .11, 10), '#a09769', x, y, .91, HP);
    add(G.box(.065, .61, .065, .012), '#c6c393', .76, 1.83, .945);
    for (const y of [1.57, 1.94]) add(G.box(.115, .065, .1, .012), '#a09769', .76, y, .95);
    add(G.box(.065, .44, .045, .01), '#c67f2a', .48, 1.4, .945);
  }));
  const hw = grp(); put(hw, .48, 1.34, .99); f.add(hw);
  hw.add(mc('gptroof-hutlever-v1', ({ add }) => {
    add(G.cyl(.065, .065, .06, 12), '#c67f2a', 0, 0, 0, HP);
    add(G.box(.04, .24, .045, .009), '#eaa440', 0, .12, .035);
    add(G.box(.25, .07, .085, .024), '#ee9d4c', 0, .25, .06);
    add(G.box(.17, .025, .09, .009), '#feebc8', 0, .265, .065);
  }));
  const hgA = gearGroup(.126, 8, '#c67f2a', 'hut-a'), hgB = gearGroup(.096, 7, '#84ae9d', 'hut-b');
  put(hgA, .48, 1.34, .92); put(hgB, .61, 1.56, .92); f.add(hgA); f.add(hgB);
  const hr = grp(); put(hr, .76, 1.77, .96); f.add(hr);
  hr.add(mc('gptroof-hutrack-v1', ({ add }) => {
    add(G.box(.035, .96, .04, .006), '#a09769', 0, -.13, 0);
    for (let k = 0; k < 18; k++) add(G.box(.045, .026, .045, .005), '#eecfa3', -.02, -.61 + k * .05, 0);
    add(G.sph(.04, 8, 6), '#feebc8', 0, .31, 0);
  }));
  const rod = mesh(G.cyl(.012, .012, 1, 7), mat('#a09769')); f.add(rod);
  const updateRod = () => {
    const end = new THREE.Vector3(0, .105, .63).applyEuler(hatch.rotation).add(hatch.position);
    linkRod(rod, [.76, hr.position.y + .31, .96], end.toArray());
  };
  updateRod();
  const hp = f.part('lift', [hw, hgA, hgB, hr, hatch, rod], (t, bw, ba, bb, br) => {
    const spin = phase(t, .03, .78), raise = phase(t, .2, .85), opening = phase(t, .32, 1);
    hw.rotation.z = -.95 * phase(t, 0, .4); hgA.rotation.z = -PI * 3 * spin; hgB.rotation.z = PI * 4 * spin;
    hr.position.y = br.p.y + .38 * raise; hatch.rotation.x = -1.35 * opening; updateRod();
  }, { label: '옥탑 내림 손잡이 · 기어 · 점검문', sfx: 'lift', dur: .9 });
  hp.gptDevice = 'roofHatch'; hp.gptHandle = hw;
  hp.gptAction = 'pull'; hp.gptReaction = '어라, 지붕까지 들썩?!';
  hp.gptWaterInput = 'roofGarden';
  hp.afterOpen = async S => {
    if (S.dead) return;
    const garden = S.room.parts.find(q => q.gptDevice === 'roofGarden');
    const sayOnce = line => { if (!S.dead && S.friend && !hp._gptReacted) { hp._gptReacted = true; S.say(S.friend, line, 1400); } };
    if (garden && !garden.busy && garden.t < .5) {
      garden._gptReacted = true; // The automatic water/flower chain gets one final reaction, without a second toast.
      await S.togglePart(garden, true);
      sayOnce(garden.gptReaction);
    } else sayOnce(hp.gptReaction);
  };
  f.gptHatchChain = { part: hp, wheel: hw, gearA: hgA, gearB: hgB, rack: hr, hatch, rod };

  f.spot('inside', null, dx, 1.12, -.52, { part: hp, maxH: .34, label: '계단 위쪽', scale: .8 });
  f.spot('beside', null, -.79, 0, 1.03, { maxH: .36, label: '계단문 옆', scale: .85 });
  f.stairDoor = p; f.stairHatch = hp;
};

// A coherent garden cluster: foam lettuces, a rubber chilli pot, a bamboo drying mat and a clear watering can.
B.gptroofgarden = f => {
  f.add(mc('gptroof-garden-v1', ({ add, tube }) => {
    // Timber bench beneath the planters, separate from the waterproof floor.
    add(G.box(1.87, .09, .81, .022), '#eaa440', 0, .15, -.38);
    for (const x of [-.78, .78]) for (const z of [-.62, -.14]) add(G.box(.065, .11, .065, .014), '#6f4b30', x, .055, z);
    // The foam planter is a real hollow box. Its soil insert and hidden seed tray are driven below.
    add(G.box(.82, .035, .59, .012), '#fef2e1', -.47, .2125, -.38);
    for (const x of [-.86, -.08]) add(G.box(.04, .42, .59, .012), '#fef2e1', x, .44, -.38);
    for (const z of [-.655, -.105]) add(G.box(.74, .42, .04, .012), '#fef2e1', -.47, .44, z);
    for (const z of [-.655, -.105]) add(G.box(.81, .035, .055, .01), '#fefde9', -.47, .6575, z);
    // Visible axle/backplate and lift guides belong to the front of the garden bench.
    add(G.box(.69, .23, .04, .015), '#eaa440', -.48, .8, .022);
    for (const x of [-.84, -.1]) add(G.box(.025, 1.02, .025, .006), '#a09769', x, .71, -.08);
    add(G.box(.055, 1.0, .045, .009), '#eecfa3', -.22, .7, .085);
    add(G.box(.055, .61, .055, .01), '#a09769', -.65, .505, .015);
    tube([-.65, .8, -.04], [-.65, .8, .23], .025, '#a09769', 8);
    tube([-.375, .8, .012], [-.375, .8, .12], .024, '#a09769', 8);
    // Garden tap is physically connected to the villa's tank hose at world (2.95,.35,.82).
    tube([.95, .35, -.63], [.95, .79, -.63], .026, '#84ae9d', 7);
    tube([.95, .79, -.63], [.75, .79, -.63], .026, '#84ae9d', 7);
    tube([.75, .79, -.63], [.75, .79, -.47], .026, '#84ae9d', 7);
    add(G.cyl(.042, .042, .045, 10), '#eecfa3', .75, .79, -.47, HP);
    add(G.sph(.042, 8, 6), C.leaf2, .64, 1.04, -.38, 0, 0, 0, [1, 1.2, 1]);
    // A real black rubber tub, with rolled rim and individual staked pepper stems.
    pot(add, .52, .195, -.38, .33, .32, '#6f4b30');
    add(G.tor(.33, .025, PI * 2, 5, 20), '#a09769', .52, .51, -.38, HP);
    for (const x of [.39, .64]) {
      tube([x, .46, -.38], [x, 1.05, -.38], .011, C.leaf2, 5);
      tube([x + .045, .49, -.4], [x + .045, 1.12, -.4], .009, '#eecfa3', 5);
      for (let k = 0; k < 4; k++) {
        const a = k * 2.2, y = .67 + k * .09, px = x + Math.cos(a) * .13, pz = -.38 + Math.sin(a) * .11;
        tube([x, y - .03, -.38], [px, y, pz], .006, C.leaf2, 4);
        leaf(add, px, y, pz, a, .85, k % 2 ? C.leaf : C.leaf2);
        if (k < 3) add(G.cap(.027, .09, 2, 6), '#dc6757', px, y - .08, pz, .2, a, .3);
      }
    }
    // A loose bamboo mat on the sunny floor, with peppers lying on it instead of penetrating its surface.
    add(G.box(1.12, .025, .62, .018), '#eecfa3', -.16, .0175, .55);
    for (let k = 0; k < 15; k++) add(G.pbox(.035, .012, .58), k % 2 ? '#c67f2a' : '#f6e0bf', -.68 + k * .074, .036, .55);
    for (const z of [.31, .79]) add(G.pbox(1.08, .016, .025), '#6f4b30', -.16, .043, z);
    for (let k = 0; k < 9; k++) {
      const x = -.53 + (k % 5) * .185, z = .41 + Math.floor(k / 5) * .23;
      add(G.cap(.026, .095, 2, 6), k % 3 ? '#dc6757' : '#ee9d4c', x, .074, z, HP, 0, (k % 3 - 1) * .18);
      tube([x, .075, z - .07], [x + .02, .08, z - .1], .007, '#6f9a69', 5);
    }
    // Cream watering can: handle, spout, rose and filling mouth all visibly belong to the body.
    add(G.cyl(.12, .105, .23, 14), '#f8b15b', .72, .115, .52);
    add(G.tor(.12, .022, PI * 1.4, 5, 16), '#eaa440', .82, .19, .52, 0, HP, -.6);
    tube([.63, .11, .52], [.43, .28, .52], .025, '#f8b15b', 7, .035);
    add(G.cyl(.055, .035, .045, 12), '#eaa440', .42, .29, .52, 0, 0, .65);
    add(G.cyl(.071, .071, .012, 12), '#a09769', .72, .237, .52);
  }));
  const wheel = grp(); put(wheel, -.65, .8, .205); f.add(wheel);
  wheel.add(mc('gptroof-gardenwheel-v1', ({ add }) => {
    add(G.tor(.23, .027, PI * 2, 6, 20), '#c67f2a', 0, 0, 0);
    for (const a of [0, PI / 3, PI * 2 / 3]) add(G.box(.44, .025, .035, .007), '#eecfa3', 0, 0, 0, 0, 0, a);
    add(G.cyl(.031, .031, .12, 10), '#feb53d', .195, 0, .06, HP);
  }));
  const gearA = gearGroup(.154, 9, '#c67f2a', 'garden-a'), gearB = gearGroup(.112, 7, '#84ae9d', 'garden-b');
  put(gearA, -.65, .8, .08); put(gearB, -.375, .8, .08); f.add(gearA); f.add(gearB);
  const rack = grp(); put(rack, -.225, .4, .087); f.add(rack);
  rack.add(mc('gptroof-gardenrack-v1', ({ add }) => {
    add(G.box(.035, .9, .04, .006), '#a09769', 0, .25, 0);
    for (let k = 0; k < 15; k++) add(G.box(.045, .026, .045, .005), '#eecfa3', -.02, -.18 + k * .06, 0);
    add(G.box(.05, .045, .25, .007), '#a09769', 0, .25, -.12);
  }));
  const bed = grp(); put(bed, -.47, .65, -.38); f.add(bed);
  bed.add(mc('gptroof-gardeninsert-v1', ({ add, tube }) => {
    add(G.box(.72, .035, .49, .012), '#6f4b30', 0, 0, 0);
    add(G.box(.69, .018, .46, .007), C.soil, 0, .025, 0);
    for (let k = 0; k < 3; k++) {
      const xx = -.24 + k * .24;
      for (let j = 0; j < 5; j++) { const a = j * 1.26;
        add(G.sph(.1, 7, 5), j % 2 ? '#a2c88c' : '#76ac6b', xx + Math.cos(a) * .055, .075 + (j % 2) * .015, Math.sin(a) * .07, .1, a, .2, [1, .55, .8]);
      }
      add(G.sph(.065, 7, 5), '#c6c393', xx, .1, 0, 0, 0, 0, [1, .75, 1]);
    }
    tube([-.16, .025, .23], [-.16, .21, .23], .009, '#c67f2a', 5);
    add(G.box(.13, .095, .025, .01), '#f6e0bf', -.16, .2, .23);
    add(G.pbox(.07, .012, .008), '#6f9a69', -.16, .22, .247);
    add(G.pbox(.05, .012, .008), '#6f9a69', -.16, .187, .247);
  }));
  const seedTray = grp(); put(seedTray, -.47, .232, -.38); f.add(seedTray);
  seedTray.add(mc('gptroof-seedtray-v1', ({ add }) => {
    add(G.box(.67, .025, .43, .008), '#feebc8', 0, .0125, 0);
    for (const x of [-.32, .32]) add(G.box(.025, .065, .43, .006), '#c67f2a', x, .045, 0);
    for (const z of [-.2, .2]) add(G.box(.64, .065, .025, .006), '#c67f2a', 0, .045, z);
    // The corners guide the tray; the centre stays empty for the game's actual observation note.
    for (const x of [-.27, .27]) add(G.cyl(.018, .018, .22, 6), '#a09769', x, -.1, -.15);
  }));
  const water = grp(); put(water, .75, .79, -.47); f.add(water);
  water.add(mc('gptroof-gardenwater-v1', ({ add }) => {
    add(G.cyl(.018, .018, .29, 7), '#b0e5e8', 0, -.145, 0);
    add(G.sph(.027, 8, 6), '#b0e5e8', .006, -.3, -.004, 0, 0, 0, [.85, 1.25, .85]);
  }));
  water.visible = false;
  const blossom = grp(); put(blossom, .64, 1.04, -.38); f.add(blossom);
  blossom.add(mc('gptroof-chilliblossom-v1', ({ add }) => { flower(add, 0, 0, .025, 1.2, '#fefde9'); }));
  blossom.scale.setScalar(.18);
  const gp = f.part('lift', [wheel, gearA, gearB, rack, bed, seedTray, water, blossom], (t, bw, ba, bb, br, bi, bs) => {
    const gears = phase(t, .04, .75), lift = phase(t, .22, .85), reveal = phase(t, .52, 1);
    wheel.rotation.z = -PI * 3.5 * t; gearA.rotation.z = -PI * 3.5 * gears;
    gearB.rotation.z = PI * 4.8 * gears;
    rack.position.y = br.p.y + .52 * lift; bed.position.y = bi.p.y + .52 * lift;
    seedTray.position.y = bs.p.y + .3 * reveal;
    water.visible = t > .06 && t < .98; water.scale.y = .9 + .1 * Math.sin(t * 32);
    blossom.scale.setScalar(.18 + .82 * phase(t, .5, 1));
  }, { label: '텃밭 손잡이 · 기어 · 씨앗 상자', sfx: 'lift', dur: .95 });
  gp.gptDevice = 'roofGarden'; gp.gptHandle = wheel;
  gp.gptAction = 'turn'; gp.gptReaction = '꽃까지 피었네?!';
  f.gptGardenChain = { part: gp, wheel, gearA, gearB, rack, bed, seedTray, water, blossom };
  f.spot('inside', seedTray, 0, .03, 0, { part: gp, maxH: .35, label: '기어로 올라오는 텃밭 씨앗함', scale: 1 });
  f.spot('behind', null, -.34, 0, -.83, { maxH: .36, label: '텃밭 뒤', scale: .8 });
  f.spot('beside', null, .79, 0, .91, { maxH: .36, label: '물뿌리개 옆', scale: .8 });
};

// Laundry basket with a real cavity under the lifted towel. Only the towel moves; its contents sit in the basket.
B.gptrooflaundry = f => {
  f.add(mc('gptroof-laundry-v1', ({ add, tube }) => {
    add(G.box(.63, .05, .49, .035), '#c67f2a', -.07, .025, 0);
    for (const z of [-.235, .235]) {
      add(G.box(.62, .44, .035, .012), '#eecfa3', -.07, .26, z);
      for (let k = 0; k < 7; k++) add(G.pbox(.035, .39, .012), '#c67f2a', -.33 + k * .086, .26, z + (z > 0 ? .024 : -.024));
      for (let k = 0; k < 4; k++) add(G.pbox(.61, .02, .015), '#f6e0bf', -.07, .11 + k * .095, z + (z > 0 ? .032 : -.032));
    }
    for (const x of [-.37, .23]) {
      add(G.box(.035, .44, .45, .012), '#eecfa3', x, .26, 0);
      add(G.box(.045, .045, .5, .015), '#6f4b30', x, .5, 0);
    }
    for (const z of [-.235, .235]) add(G.box(.64, .045, .05, .015), '#6f4b30', -.07, .5, z);
    // Folded towels are low in the interior and cannot pass through the slatted sides.
    add(G.box(.43, .07, .3, .025), '#84ae9d', -.07, .095, -.015);
    add(G.box(.42, .07, .29, .025), '#f6e0bf', -.07, .165, -.015);
    // A little green wash basin and soap bottle beside it are readily identifiable.
    pot(add, .45, 0, -.05, .18, .11, '#84ae9d');
    add(G.cyl(.13, .13, .01, 16), '#a2c8bb', .45, .062, -.05);
    add(G.box(.13, .22, .1, .025), '#feebc8', .45, .11, .24);
    add(G.box(.09, .04, .08, .014), '#84ae9d', .45, .24, .24);
    add(G.pbox(.1, .09, .01), C.white, .45, .12, .296);
    add(G.pbox(.045, .016, .012), '#84ae9d', .45, .14, .307);
  }));
  const towel = grp(); put(towel, -.34, .525, -.19); f.add(towel);
  towel.add(mc('gptroof-laundrytowel-v1', ({ add }) => {
    add(G.box(.6, .055, .43, .023), '#e98774', .28, .005, .2, 0, 0, -.06);
    add(G.box(.6, .12, .04, .018), '#e87562', .28, -.06, .4, -.08, 0, -.06);
    for (const x of [.12, .22, .32, .42]) add(G.pbox(.025, .008, .41), '#fef2e1', x, .038, .2, 0, 0, -.06);
  }));
  const p = f.part('lift', towel, (t, b) => { towel.position.y = b.p.y + .36 * t; towel.rotation.z = -.5 * t; }, { label: '빨래 바구니 수건', sfx: 'lift', dur: .34 });
  f.spot('inside', null, -.07, .225, 0, { part: p, maxH: .27, label: '빨래 바구니 안', scale: .8 });
  f.spot('beside', null, -.1, 0, .45, { maxH: .35, label: '빨래 바구니 앞', scale: .85 });
};

export const GPT_ROOF_BUILDERS = B;
export const GPT_ROOF_INFO = {
  gptroofshell: { w: 7, d: 6, name: '빌라 옥상 난간과 외벽', hidden: true, floor: true },
  gptroofdeck: { w: 2.15, d: 2, name: '집들이 나무 데크', hidden: true, floor: true },
  gptroofpartytable: { w: 2, d: 1, name: '집들이 꽃병 상', hidden: true },
  gptroofjars: { w: 2, d: 1, name: '도르래 집들이 장독대', hidden: true },
  gptroofstairhut: { w: 2, d: 2, name: '계단이 있는 옥탑', hidden: true },
  gptroofgarden: { w: 2, d: 2, name: '고추와 상추 텃밭', hidden: true },
  gptrooflaundry: { w: 1, d: 1, name: '빨래 바구니', hidden: true },
};

// GPT 36 — a compact, warm night-shopping diorama. All geometry uses the existing
// house/kit toon palette and makeFurniture's bakeStatic/finalize path. Each moving
// assembly is a Furn.part pivot, so baking never freezes its motion or hit target.
import * as THREE from 'three';
import { grp, put, mat, mesh, geo, canvasTex, texCache } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const C = { cream: '#fef2e1', white: '#fefde9', wall: '#f6e0bf', green: '#84ae9d', mint: '#a2c8bb', coral: '#e8735a',
  peach: '#feebc8', gold: '#feb53d', light: '#ffe6a0', ink: '#6f4b30', roof: '#3a4ea6', roof2: '#6b89bf', wood: '#eaa440',
  woodD: '#6f4b30', lilac: '#f3b8b2', paving: '#f2dcbc', leaf: '#84ae9d', leaf2: '#c6c393', soil: '#c67f2a' };
const B = {};
const tex = texCache();
const stage = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
const body = (f, key, fn) => f.add(mc('gpt-night-' + key, fn));
function moving(f, key, x, y, z, fn) { const p = grp(); put(p, x, y, z); p.add(mc('gpt-night-' + key, fn)); f.add(p); return p; }
function fittedText(c, word, w, h, startSize) {
  // The game's Korean font, measured before drawing, with a 9% safe margin.
  let size = startSize, m, ascent, descent;
  for (let k = 0; k < 48; k++) {
    c.font = `bold ${size}px Ssurround, Jua, "Apple SD Gothic Neo", sans-serif`;
    m = c.measureText(word); ascent = m.actualBoundingBoxAscent ?? size * .8; descent = m.actualBoundingBoxDescent ?? size * .2;
    if (m.width <= w * .82 && ascent + descent <= h * .82) break;
    size *= .94;
  }
  c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(word, w / 2, h / 2 + (ascent - descent) / 2);
}
function print(parent, key, word, w, h, x, y, z, color = C.ink, bg = C.cream) {
  // Preserve the sign's physical aspect ratio instead of stretching Korean glyphs.
  const ch = Math.max(64, Math.round(512 * h / w));
  const t = tex.get('gpt-night-sign-' + key, () => canvasTex(512, ch, c => {
    c.fillStyle = bg; c.fillRect(0, 0, 512, ch); c.fillStyle = color;
    fittedText(c, word, 512, ch, ch * .78);
  }));
  const p = mesh(geo(`gpt-night-label-${w}-${h}`, () => new THREE.PlaneGeometry(w, h)), mat('#ffffff', { map: t }));
  put(p, x, y, z); parent.add(p); return p;
}
function pot(add, x, y, z, s = 1, flowers = false) {
  add(G.cyl(.14 * s, .105 * s, .22 * s, 10), C.coral, x, y + .11 * s, z);
  add(G.cyl(.15 * s, .15 * s, .045 * s, 10), C.peach, x, y + .23 * s, z);
  for (let k = 0; k < 5; k++) { const a = k * 2.4;
    add(G.sph(.105 * s, 8, 5), k % 2 ? C.leaf : C.leaf2, x + Math.cos(a) * .09 * s, y + (.34 + (k % 2) * .07) * s, z + Math.sin(a) * .09 * s, 0, a, .2, [1, .55, 1.4]);
    if (flowers && k % 2) add(G.sph(.055 * s, 7, 5), C.light, x + Math.cos(a) * .13 * s, y + .45 * s, z + Math.sin(a) * .13 * s);
  }
}
function bun(add, x, y, z, s = 1) {
  add(G.sph(.12 * s, 8, 6), '#c67f2a', x, y, z, 0, 0, 0, [1.1, .65, .8]);
  for (let k = -1; k <= 1; k++) add(G.pbox(.018 * s, .014 * s, .09 * s), C.cream, x + k * .06 * s, y + .07 * s, z, 0, 0, -.25);
}
function book(add, x, y, z, color, w = .08, h = .3) {
  add(G.box(w, h, .22, .009), color, x, y + h / 2, z);
  add(G.pbox(w * .65, .02, .01), C.cream, x, y + h * .7, z + .116);
}
function gear(add, x, y, z, r, color) {
  add(G.cyl(r * .8, r * .8, .075, 12), color, x, y, z, HP, 0, 0);
  for (let k = 0; k < 10; k++) { const a = k * PI / 5; add(G.box(r * .31, r * .3, .08, .01), color, x + Math.sin(a) * r * .88, y + Math.cos(a) * r * .88, z, 0, 0, -a); }
  add(G.cyl(r * .28, r * .28, .09, 10), C.cream, x, y, z + .01, HP, 0, 0);
}

// Layered stone, brick and earth, with a supported two-step shop pavement. The
// collision box deliberately covers only the foundation: scenery is passable.
B.gpt_nightbase = f => {
  f.collideBox = [-4.08, -.94, -3.58, 4.08, -.14, 3.58];
  // Character collision is the actual posts/pots, not the whole diorama AABB.
  f.walkBoxes = [-3.48, 3.42].map(x => [x - .2, 0, 1.7, x + .2, 2.3, 2.1]);
  f.walkBoxes.push([-3.88, .16, -1.16, -3.42, .73, -.69], [3.04, .16, -1.22, 3.52, .76, -.72], [3.31, .16, -3.5, 3.73, .44, -1.1]);
  for (const x of [-3.96, 3.96]) f.walkBoxes.push([x - .045, .16, -1.245, x + .045, 4.32, -1.155]);
  f.walkSurfaces = [{ box: [-3.84, -3.42, 3.84, -.62], y: .16 }, { box: [-3.86, -.71, 3.86, -.57], y: .23 }];
  f.walkSteps = [];
  for (const x of [-1.79, 2.21]) {
    f.walkSurfaces.push({ box: [x - .47, -.48, x + .47, -.18], y: .08 }, { box: [x - .47, -.71, x + .47, -.43], y: .16 });
    f.walkSteps.push({ x, y: .08, z: -.32 }, { x, y: .16, z: -.55 });
  }
  body(f, 'base', ({ add, tube }) => {
    add(G.box(8.12, .16, 7.12, .12), C.woodD, 0, -.86, 0);
    add(G.box(8.08, .47, 7.08, .09), C.soil, 0, -.545, 0);
    add(G.box(8.14, .20, 7.14, .045), '#eecfa3', 0, -.24, 0);
    // Brick bond on each exposed face, separated from the lower soil stratum.
    for (const side of [-1, 1]) {
      for (let k = 0; k < 19; k++) add(G.pbox(.39, .08, .025), k % 3 ? '#f6e0bf' : '#c67f2a', -3.78 + k * .42, -.23, side * 3.582);
      for (let k = 0; k < 17; k++) add(G.pbox(.025, .08, .39), k % 3 ? '#f6e0bf' : '#c67f2a', side * 4.083, -.23, -3.36 + k * .42);
      add(G.box(8.07, .035, .03, .008), C.woodD, 0, -.4, side * 3.55);
    }
    // Shop stoop, curb and full-depth steps (no hovering thin paving slabs).
    add(G.box(7.68, .16, 2.8, .05), '#f2dcbc', 0, .08, -2.02);
    add(G.box(7.72, .07, .14, .025), C.cream, 0, .195, -.64);
    for (const x of [-2.5, 1.5]) {
      add(G.box(.94, .08, .30, .025), '#e8d7b7', x + .71, .04, -.33);
      add(G.box(.94, .08, .28, .025), C.cream, x + .71, .12, -.57);
    }
    // A quiet lane: inset manhole ring, stone setts and two curb drains.
    for (const side of [-1, 1]) for (let k = 0; k < 11; k++) add(G.pbox(.48, .025, .16), '#e8d7b7', -2.75 + k * .52, .018, side > 0 ? 2.95 : -.37);
    add(G.cyl(.31, .31, .025, 20), '#a09769', -.1, .023, 2.4);
    add(G.tor(.25, .016, PI * 2, 4, 18), C.ink, -.1, .04, 2.4, HP, 0, 0);
    for (const x of [-3.38, 3.36]) { add(G.box(.38, .028, .22, .025), '#a09769', x, .024, -.36); for (let k = 0; k < 4; k++) add(G.pbox(.035, .006, .15), C.ink, x - .12 + k * .08, .042, -.36); }
    // Lighting is modeled, with warm solid-colour lantern panes: no bloom.
    for (const x of [-3.48, 3.42]) {
      add(G.cyl(.17, .2, .12, 12), C.cream, x, .06, 1.9); add(G.cyl(.055, .07, 2.15, 10), C.ink, x, 1.18, 1.9);
      tube([x, 2.23, 1.9], [x + (x < 0 ? .26 : -.26), 2.23, 1.9], .045, C.ink);
      const lx = x + (x < 0 ? .26 : -.26);
      add(G.box(.26, .32, .23, .04), C.light, lx, 2.03, 1.9);
      add(G.box(.33, .07, .3, .04), C.ink, lx, 2.23, 1.9); add(G.box(.28, .05, .25, .02), C.ink, lx, 1.85, 1.9);
      for (const sx of [-1, 1]) add(G.pbox(.025, .3, .025), C.ink, lx + sx * .11, 2.04, 2.015);
    }
    // Neighbouring lower yard edge, terracotta pots and a little evening vine.
    add(G.box(.42, .28, 2.4, .035), C.wall, 3.52, .30, -2.3);
    for (let k = 0; k < 4; k++) add(G.box(.45, .055, .28, .02), C.cream, 3.52, .455, -3.2 + k * .58);
    pot(add, -3.65, .16, -.92, 1.15, true); pot(add, 3.28, .16, -.98, 1.2, true);
    // The supported star wire clears the full-size shop roofs on entry.
    for (const x of [-3.96, 3.96]) {
      add(G.box(.18, .12, .18, .035), C.cream, x, .22, -1.2);
      add(G.cyl(.04, .045, 4.1, 8), C.woodD, x, 2.27, -1.2);
      add(G.sph(.075, 8, 6), C.gold, x, 4.33, -1.2);
    }
    tube([-3.96, 4.28, -1.2], [3.96, 4.28, -1.2], .025, C.ink, 6);
    for (const x of [-.7, .1, .9]) {
      tube([x, 4.28, -1.2], [x, 4.05, -1.2], .016, C.ink, 5);
      add(G.sph(.105, 8, 6), C.light, x, 3.99, -1.2, 0, 0, 0, [1, 1.25, .7]);
      add(G.box(.04, .3, .035, .008), C.gold, x, 3.99, -1.19, 0, 0, PI / 4);
      add(G.box(.04, .3, .035, .008), C.gold, x, 3.99, -1.19, 0, 0, -PI / 4);
    }
    tube([-2.6, 4.28, -1.2], [-2.6, 4.15, -1.2], .016, C.ink, 5);
    add(G.tor(.16, .055, PI * 1.55, 7, 18), C.cream, -2.6, 3.98, -1.2, 0, 0, PI * .23);
  });
  // Supported everyday finding places; these remain open, so the hidden-object
  // planner can preserve its plain-sight quota rather than dropping most targets.
  f.spot('on', null, 1.1, .012, .7, { label: '금고 앞 넓은 포장도로', maxH: 1.0, scale: 2.4 });
  f.spot('on', null, -2.65, .17, -.78, { label: '빵집 앞 높은 보도', maxH: .75, scale: 1.5 });
  f.spot('on', null, -2.85, .012, 2.3, { label: '가로등 옆 보도 위 분실물', maxH: .8, scale: 1.75 });
  f.spot('on', null, .85, .012, 2.85, { label: '앞쪽 포장도로 위 분실물', maxH: .8, scale: 1.85 });
  f.spot('on', null, 1.1, .012, 2.0, { label: '간판 옆 빈 포장도로', maxH: .8, scale: 1.8 });
};

// Both houses have a hollow ground floor, a real shop-door passage, an upstairs
// window box and separate shallow roofs. The front doesn't hide a solid box.
function shop(f, books, passive = false) {
  const key = books ? 'bookshop' : 'bakery', accent = books ? C.coral : C.green;
  const shellWalk = [
    [-1.365, .16, -.84, 1.365, 3.38, -.72],
    [-1.375, .16, -.805, -1.225, 3.38, .745], [1.225, .16, -.805, 1.375, 3.38, .745],
    [-1.25, .16, -.03, .38, 1.5, .9], // display counter and its deep stocked shelves
    [.54, .16, -.62, 1.08, 1.10, .43], // .91 m parcel counter above the inset entry floor
    [.33, .18, .68, .43, 2.4, .84], [1.2, .18, .68, 1.3, 2.4, .84],
  ];
  f.walkBoxes = () => shellWalk;
  f.walkSurfaces = [{ box: [-1.375, -.875, 1.375, .875], y: .16 }, { box: [.445, -.655, 1.135, .695], y: .193 }];
  body(f, key, ({ add, tube }) => {
    add(G.box(2.75, .16, 1.75, .035), '#eecfa3', 0, .08, 0);
    add(G.box(2.73, 3.22, .12, .035), books ? C.peach : C.cream, 0, 1.77, -.78);
    for (const x of [-1.3, 1.3]) add(G.box(.15, 3.22, 1.55, .025), books ? C.peach : C.wall, x, 1.77, -.03);
    // Upper floor and cornice; open air beneath with a bright interior back wall.
    add(G.box(2.66, .13, 1.52, .025), C.wood, 0, 2.48, -.02);
    add(G.box(2.64, .83, 1.5, .03), books ? C.peach : C.cream, 0, 2.96, -.04);
    add(G.box(2.85, .12, 1.72, .035), C.cream, 0, 3.4, -.02);
    // Shallow gable, ridge and five slate rows.
    for (const side of [-1, 1]) {
      add(G.box(2.96, .12, 1.0, .035), books ? C.roof2 : C.roof, 0, 3.64, side * .43 - .02, side * .42, 0, 0);
      for (let k = 1; k < 4; k++) add(G.pbox(2.96, .025, .03), books ? C.roof : C.ink, 0, 3.83 - k * .095, side * k * .21 - .02, side * .42, 0, 0);
    }
    add(G.box(2.99, .12, .14, .035), books ? C.roof : C.ink, 0, 3.85, -.02);
    // Clear shopfront opening with separate jambs, lower sill and fascia.
    for (const x of [-1.25, .38, 1.25]) add(G.box(.1, 2.21, .16, .02), accent, x, 1.29, .76);
    add(G.box(1.63, .4, .17, .02), accent, -.43, .38, .76);
    add(G.box(2.72, .27, .18, .025), accent, 0, 2.34, .76);
    add(G.box(1.63, .07, .25, .02), C.cream, -.43, .6, .8);
    // Two upper windows with thick frames, asymmetric linen curtains and planters.
    for (const x of [-.77, .73]) {
      add(G.box(.65, .61, .055, .02), accent, x, 2.94, .741);
      add(G.box(.53, .49, .04, .015), C.light, x, 2.94, .78);
      add(G.pbox(.035, .5, .025), C.cream, x, 2.94, .816);
      add(G.pbox(.55, .035, .025), C.cream, x, 2.94, .816);
      add(G.pbox(.12, .49, .025), C.cream, x - .2, 2.94, .824);
      add(G.box(.7, .09, .24, .025), C.cream, x, 2.61, .83);
    }
    add(G.box(.72, .17, .25, .025), accent, -.77, 2.7, .91);
    for (let k = 0; k < 4; k++) add(G.sph(.12, 7, 5), k % 2 ? C.leaf : C.leaf2, -1.03 + k * .17, 2.84, .95, 0, 0, 0, [1, .7, .8]);
    // Rounded striped canopy, thick scalloped valance and real iron support rods.
    // The lowest valance clears the 2 m door; the rear edge clears the upper-floor slab.
    if (books) for (let k = 0; k < 10; k++) {
      add(G.box(.27, .07, .66, .025), k % 2 ? C.cream : accent, -1.215 + k * .27, 2.43, 1.08, .3, 0, 0);
      add(G.box(.265, .15, .07, .035), k % 2 ? C.cream : accent, -1.215 + k * .27, 2.27, 1.39);
    }
    for (const x of [-1.2, 1.2]) tube([x, 2.12, .83], [x, 2.38, 1.35], .022, C.woodD);
    // Deep interior display. The shelves hold bread or upright books, never grey voids.
    for (const y of [.42, .84, 1.2]) {
      add(G.box(1.42, .065, .4, .02), C.wood, -.46, y, .21);
      for (let k = 0; k < 6; k++) {
        if (books) book(add, -1.05 + k * .22, y + .04, .25, [C.green, C.gold, C.coral, C.roof, C.mint, C.peach][k], .08, .25 + (k % 3) * .035);
        else bun(add, -.99 + k * .21, y + .11, .27, .82);
      }
    }
    // Door passage has a tiled floor, rug and rear parcel nook, no solid facade.
    add(G.box(.69, .025, 1.35, .015), '#e8d7b7', .79, .18, .02);
    add(G.box(.44, .018, .42, .02), books ? C.mint : C.coral, .79, .201, .3);
    add(G.box(.54, .88, 1.05, .025), C.woodD, .81, .60, -.095);
    add(G.box(.54, .06, 1.05, .015), C.cream, .81, 1.07, -.095);
    // A believable loose flour bag/book parcel and a wall clock inside.
    add(G.box(.25, .32, .22, .04), books ? C.coral : C.cream, .77, 1.26, -.47);
    add(G.pbox(.04, .29, .225), C.gold, .77, 1.26, -.47);
    add(G.cyl(.16, .16, .04, 18), C.cream, .79, 1.62, -.69, HP, 0, 0);
    add(G.pbox(.025, .115, .015), C.ink, .79, 1.66, -.657);
    add(G.pbox(.1, .02, .015), C.ink, .83, 1.62, -.65);
    // Downpipe on the side, utility meter, tiny lamps and doorstep mat.
    add(G.cyl(.035, .035, 3.14, 8), C.woodD, -1.39, 1.74, .31);
    add(G.box(.18, .26, .12, .035), C.mint, -1.38, .54, .52);
    add(G.box(.17, .23, .16, .025), C.light, 1.22, 1.85, 1.0);
    add(G.box(.23, .05, .21, .025), C.ink, 1.22, 1.99, 1.0);
  });
  print(f.group, key, books ? '새벽서점' : '달빛빵집', 1.37, .19, -.42, 2.345, .86, C.cream, accent);
  if (!books) {
    const awning = moving(f, 'bakery-awning', 0, 2.50, .79, ({ add }) => {
      for (let k = 0; k < 10; k++) {
        add(G.box(.27, .07, .66, .025), k % 2 ? C.cream : accent, -1.215 + k * .27, -.07, .29, .3, 0, 0);
        add(G.box(.265, .15, .07, .035), k % 2 ? C.cream : accent, -1.215 + k * .27, -.23, .6);
      }
    });
    const ap = f.part('lift', awning, t => { awning.rotation.x = -.42 * t; }, { label: '빵집 차양 접기', sfx: 'rustle', dur: .6 }); ap.gptEndSfx = 'thump';
  }
  if (passive) return;
  const door = moving(f, key + '-door', .38, .18, .86, ({ add }) => {
    add(G.box(.71, 2.0, .07, .025), accent, .355, 1.0, 0);
    add(G.box(.53, .94, .025, .02), C.light, .355, 1.43, .05);
    add(G.pbox(.04, .97, .025), C.cream, .355, 1.43, .07);
    add(G.pbox(.54, .04, .025), C.cream, .355, 1.43, .07);
    add(G.box(.055, .17, .075, .02), C.gold, .6, .76, .075);
    add(G.box(.17, .035, .025, .008), C.cream, .355, .24, .05);
  });
  const dp = f.part('door', door, t => { door.rotation.y = -1.48 * t; }, { label: books ? '서점 출입문' : '빵집 출입문', sfx: 'door', dur: .45 });
  f.walkBoxes = () => {
    const b = new THREE.Box3(new THREE.Vector3(0, 0, -.035), new THREE.Vector3(.71, 2.0, .035)).applyMatrix4(door.matrix);
    return [...shellWalk, [...b.min.toArray(), ...b.max.toArray()]];
  };
  f.walkDoorways = [{ label: '가게 실제 출입구', x: .815, z: .76, width: .77, part: dp }];
  dp.lockable = true; dp.lockKind = 'pad'; dp.lockAt = { parent: door, x: .58, y: .82, z: .12 };
  f.spot('inside', null, .79, 1.11, .26, { part: dp, label: '가게 안 포장대 위', maxH: .43, scale: .95 });
  const sash = moving(f, key + '-display', -.43, .63, .9, ({ add }) => {
    for (const x of [-.75, .75]) add(G.box(.06, 1.52, .055, .016), accent, x, .76, 0);
    for (const y of [0, 1.52]) add(G.box(1.56, .06, .055, .016), accent, 0, y, 0);
    add(G.box(.04, 1.52, .055, .01), C.cream, 0, .76, 0);
    add(G.box(.28, .065, .09, .02), C.gold, 0, .1, .055);
  });
  let sp;
  if (books) sp = f.part('flip', sash, t => { sash.rotation.x = -1.15 * t; }, { label: '서점 진열창 덮개', sfx: 'lift', dur: .5 });
  else sp = f.part('slide', sash, (t, b) => { sash.position.y = b.p.y + 1.23 * t; sash.scale.y = 1 - .84 * t; }, { label: '빵집 접어 올리는 서비스창', sfx: 'drawer', dur: .5 });
  f.spot('inside', null, -.43, .68, .6, { part: sp, label: books ? '책 진열창 안' : '따뜻한 빵 진열대', maxH: .4, scale: .95 });
}
B.gpt_nightbakery = f => shop(f, false);
B.gpt_nightbooks = f => shop(f, true);

// A staged, visible escape-room chain. Tap the large crank: it turns the toothed
// wheel, lifts the wicker basket on two guided ropes, then opens a clue hatch.
B.gpt_nightpulley = f => {
  body(f, 'pulley', ({ add, tube }) => {
    add(G.box(1.6, .14, 1.25, .055), C.cream, 0, .07, 0);
    for (const x of [-.66, .66]) { add(G.box(.13, 2.5, .14, .025), C.green, x, 1.4, -.32); add(G.box(.27, .06, .28, .025), C.woodD, x, .18, -.32); }
    add(G.box(1.55, .15, .64, .035), C.green, 0, 2.65, -.1);
    add(G.box(1.25, .08, .42, .025), C.wood, 0, 1.59, -.46);
    for (const x of [-.51, .51]) tube([x, .24, -.35], [x, 2.5, -.35], .016, C.ink);
    // The cabinet behind the final hatch is a hollow box with a broad shelf.
    add(G.box(.82, .09, .57, .025), C.cream, 0, .28, .08);
    add(G.box(.82, .57, .08, .025), C.woodD, 0, .58, -.18);
    for (const x of [-.37, .37]) add(G.box(.08, .57, .48, .02), C.woodD, x, .58, .05);
    add(G.box(.82, .08, .55, .025), C.cream, 0, .9, .08);
    add(G.box(.66, .03, .36, .02), C.mint, 0, .355, .11);
    // Track rollers and a parcel rack communicate purpose before interaction.
    for (const x of [-.34, .34]) add(G.cyl(.11, .11, .08, 12), C.gold, x, 2.5, .11, HP, 0, 0);
    tube([-.66, 1.1, -.18], [-.66, 2.5, -.18], .018, C.ink);
    tube([-.66, 2.5, -.18], [-.34, 2.5, .11], .018, C.ink);
    for (let k = 0; k < 3; k++) add(G.box(.32, .23 + k * .02, .29, .025), [C.peach, C.mint, C.lilac][k], -.48 + k * .48, 1.78, -.39);
  });
  const wheel = moving(f, 'pulley-wheel', -.66, 1.1, .02, ({ add }) => { gear(add, 0, 0, 0, .28, C.gold); add(G.cyl(.065, .065, .055, 8), C.ink, 0, 0, .075, HP, 0, 0); });
  const handle = moving(f, 'pulley-tool-grip', 0, 0, 0, ({ add }) => { add(G.box(.1, .31, .1, .02), C.ink, 0, -.17, .12); add(G.cyl(.07, .07, .2, 10), C.coral, 0, -.34, .18, HP, 0, 0); });
  f.group.remove(handle); wheel.add(handle); handle.visible = false; f.live = [handle];
  const basket = moving(f, 'pulley-basket', 0, .99, .11, ({ add, tube }) => {
    add(G.box(.8, .08, .58, .035), C.woodD, 0, 0, 0);
    for (const side of [-1, 1]) {
      add(G.box(.8, .3, .06, .025), C.wood, 0, .17, side * .27);
      for (let k = 0; k < 5; k++) add(G.pbox(.025, .25, .012), C.cream, -.32 + k * .16, .17, side * .308);
      add(G.box(.06, .3, .55, .025), C.wood, side * .37, .17, 0);
      tube([side * .34, .28, -.2], [side * .34, .61, 0], .022, C.woodD);
    }
    add(G.box(.44, .23, .32, .035), C.peach, 0, .2, 0); add(G.pbox(.04, .22, .325), C.cream, 0, .2, 0);
  });
  // Dynamic rope cylinders anchor at the fixed top and change length, so they
  // stay attached throughout the basket travel (no detached/floating assembly).
  const ropes = [];
  for (const x of [-.34, .34]) {
    const rope = moving(f, 'pulley-rope-' + x, x, 2.5, .11, ({ add }) => add(G.cyl(.014, .014, 1, 6), C.ink, 0, -.5, 0)); ropes.push(rope);
  }
  const hatch = moving(f, 'pulley-hatch', -.39, .33, .39, ({ add }) => {
    add(G.box(.79, .55, .07, .025), C.green, .395, .275, 0);
    add(G.box(.34, .07, .03, .015), C.cream, .395, .33, .053);
    add(G.sph(.045, 9, 6), C.gold, .67, .22, .072);
  });
  // A big, readable key plaque rides out of the real cabinet during step 3.
  const key = moving(f, 'pulley-clue', 0, .4, .01, ({ add }) => {
    add(G.box(.57, .42, .045, .035), C.cream, 0, .23, -.18);
    add(G.tor(.09, .027, PI * 2, 5, 14), C.gold, -.1, .27, -.135);
    add(G.box(.23, .055, .04, .015), C.gold, .06, .19, -.135, 0, 0, -.5);
    add(G.box(.055, .1, .04, .012), C.gold, .13, .15, -.135);
    add(G.box(.27, .2, .21, .025), C.peach, -.16, .13, -.025);
    add(G.box(.035, .21, .22, .008), C.cream, -.16, .13, -.025);
  });
  const p = f.part('wheel', [wheel, basket, ...ropes, hatch, key], (t, bw, bb, br1, br2, bh, bk) => {
    const a = stage(t, 0, .30), b = stage(t, .2, .62), c = stage(t, .58, .84), d = stage(t, .78, 1);
    wheel.rotation.z = -PI * 2.6 * a;
    basket.position.y = bb.p.y + .72 * b;
    for (const rope of ropes) rope.scale.y = Math.max(.10, 2.5 - (basket.position.y + .61));
    hatch.rotation.y = -1.6 * c;
    key.position.z = bk.p.z + .62 * d;
  }, { label: '배달 도르래: 손잡이 → 바구니 → 비밀 서랍', sfx: 'ratchet', dur: 2.8 });
  p.gptChain = true; p.gptTool = 'pulleyhandle'; p.gptToolMesh = handle;
  p.gptSteps = [{ at: 0, sfx: 'ratchet' }, { at: .3, sfx: 'lift' }, { at: .65, sfx: 'thunk' }, { at: .95, sfx: 'latch' }];
  p.gptTell = '…빵이 자고 있네?'; p.setOpen(0);
  const s = f.spot('inside', key, .16, .04, .09, { part: p, label: '도르래 아래 비밀 칸', maxH: .44, scale: 1 }); s.reserved = true;
  print(f.group, 'delivery', '배달함', .69, .17, 0, 2.66, .232, C.cream, C.green);
};

// A lift-seat bench exposes a real cavity and a large felt lining, not a block.
B.gpt_nightbench = f => {
  f.walkBoxes = [[-.91, 0, -.49, .91, .95, .45]];
  body(f, 'bench', ({ add }) => {
    for (const x of [-.71, .71]) for (const z of [-.23, .23]) add(G.box(.1, .05, .1, .015), C.ink, x, .025, z);
    add(G.box(1.62, .07, .78, .025), C.woodD, 0, .05, 0);
    for (const x of [-.78, .78]) add(G.box(.08, .31, .78, .025), C.green, x, .22, 0);
    for (const z of [-.36, .36]) add(G.box(1.58, .3, .06, .02), C.green, 0, .22, z);
    add(G.box(1.42, .03, .43, .02), C.lilac, 0, .103, 0);
    for (const x of [-.73, .73]) add(G.box(.07, .76, .07, .02), C.green, x, .47, -.36);
    for (const y of [.54, .74]) add(G.box(1.55, .15, .06, .025), C.mint, 0, y, -.36);
  });
  const seat = moving(f, 'bench-seat', 0, .39, -.36, ({ add }) => {
    add(G.box(1.7, .09, .86, .035), C.wood, 0, .045, .43);
    for (const z of [.07, .26, .45]) add(G.pbox(1.57, .012, .014), C.woodD, 0, .097, z);
    add(G.box(.34, .07, .09, .02), C.gold, 0, .02, .83);
  });
  const p = f.part('lid', seat, t => { seat.rotation.x = -1.32 * t; }, { label: '수납 벤치 좌판', sfx: 'creak', dur: .55 });
  p.lockable = true; p.lockKind = 'code'; p.lockAt = { x: .57, y: .29, z: .33 };
  f.spot('inside', null, 0, .14, 0, { part: p, label: '벤치 속 담요 칸', maxH: .4, scale: 1 });
  f.spot('under', null, -.55, .01, .05, { label: '벤치 다리 사이', maxH: .08, scale: .8 });
  for (const x of [-.42, .42]) f.spot('on', seat, x, .103, .5, { label: x < 0 ? '벤치 왼쪽 좌판' : '벤치 오른쪽 좌판', maxH: .65, scale: x < 0 ? 1.4 : 2.2 });
};

B.gpt_nightpost = f => {
  body(f, 'post', ({ add }) => {
    add(G.box(.47, .12, .42, .045), C.cream, 0, .06, 0); add(G.box(.16, .58, .15, .025), C.green, 0, .39, -.03);
    // Four actual walls and a floor, with a front opening.
    add(G.box(.6, .08, .47, .025), C.coral, 0, .72, -.02);
    add(G.box(.6, .54, .07, .025), C.coral, 0, .99, -.22);
    for (const x of [-.27, .27]) add(G.box(.06, .54, .42, .025), C.coral, x, .99, -.01);
    add(G.box(.68, .13, .54, .06), C.coral, 0, 1.31, -.02);
    add(G.box(.42, .035, .25, .02), C.cream, 0, .783, -.02);
    for (let k = 0; k < 3; k++) {
      const x = -.035 + k * .025, y = .81 + k * .018;
      add(G.box(.27, .012, .17, .005), C.cream, x, y, -.03, 0, k * .13, 0);
      add(G.pbox(.065, .012, .045), C.white, x + .087, y + .011, .02, -.32, k * .13, 0);
    }
    add(G.pbox(.07, .012, .045), C.gold, -.04, .858, -.09, 0, -.1, 0);
  });
  const flap = moving(f, 'post-flap', 0, .76, .235, ({ add }) => {
    add(G.box(.53, .5, .065, .025), C.coral, 0, .25, 0);
    add(G.box(.35, .055, .025, .012), C.ink, 0, .37, .045); add(G.box(.15, .045, .08, .016), C.gold, 0, .13, .06);
  });
  const p = f.part('flip', flap, t => { flap.rotation.x = 1.38 * t; }, { label: '밤우체통 앞문', sfx: 'open', dur: .42 });
  f.spot('inside', null, 0, .86, .04, { part: p, label: '편지 위', maxH: .36, scale: .95 });
};

B.gpt_nightsign = f => {
  body(f, 'sign', ({ add }) => {
    for (const x of [-.36, .36]) { add(G.box(.08, 1.17, .09, .025), C.woodD, x, .59, 0); add(G.box(.24, .09, .58, .03), C.green, x, .045, 0); }
    add(G.box(.86, .09, .1, .025), C.woodD, 0, 1.18, 0);
    add(G.cyl(.07, .07, .91, 10), C.gold, 0, .72, .035, 0, 0, HP);
  });
  const sign = moving(f, 'sign-board', 0, .73, .04, ({ add }) => {
    add(G.box(.74, .68, .09, .035), C.green, 0, 0, 0);
    add(G.box(.62, .55, .025, .025), C.cream, 0, 0, .066);
    // reverse side is a large clue: three clear pictograms, not tiny texture noise
    for (let k = 0; k < 3; k++) add(G.cyl(.065, .065, .02, 12), [C.gold, C.coral, C.roof][k], -.2 + k * .2, .03, -.062, HP, 0, 0);
    add(G.box(.42, .045, .025, .014), C.cream, 0, -.2, -.065);
  });
  print(sign, 'sign-open', '영업 중', .56, .23, 0, .03, .084, C.green, C.cream);
  const p = f.part('flip', sign, t => { sign.rotation.x = -PI * t; }, { label: '뒤집는 영업 간판', sfx: 'flip', dur: .65 });
  p.gptClue = { kind: 'color', colors: [C.gold, C.coral, C.roof], order: [0, 1, 2] }; p.gptEndSfx = 'pop';
  f.spot('behind', null, 0, .32, -.06, { part: p, label: '영업 간판 뒤의 색 단서', maxH: .3, scale: .9 });
};

B.gpt_nighttable = f => {
  f.walkBoxes = [[-.18, 0, -.24, .18, .675, .24]];
  for (const x of [-.72, .72]) f.walkBoxes.push([x - .23, .01, -.03, x + .23, .91, .43]);
  body(f, 'table', ({ add }) => {
    add(G.cyl(.18, .24, .08, 14), C.ink, 0, .04, 0); add(G.cyl(.045, .05, .64, 10), C.ink, 0, .37, 0);
    add(G.cyl(.62, .62, .09, 20), C.wood, 0, .72, 0);
    for (const x of [-.72, .72]) {
      for (const side of [-1, 1]) add(G.box(.055, .43, .055, .016), C.green, x + side * .13, .215, .2);
      add(G.cyl(.23, .23, .07, 14), C.mint, x, .46, .2);
      for (const side of [-1, 1]) add(G.box(.045, .37, .045, .016), C.green, x + side * .15, .64, .4);
      add(G.box(.4, .2, .06, .03), C.mint, x, .81, .4);
    }
    add(G.cyl(.085, .075, .12, 12), C.cream, -.29, .825, -.17);
    add(G.cyl(.065, .065, .012, 12), C.woodD, -.29, .883, -.17);
    add(G.tor(.048, .02, PI * 2, 5, 12), C.cream, -.38, .825, -.17, 0, HP, 0);
    // Cream paper is taped against the evening breeze, with a lifted folded corner.
    add(G.box(.31, .016, .22, .008), C.cream, .05, .785, -.26, 0, -.2, 0);
    for (let k = 0; k < 3; k++) add(G.pbox(.22, .004, .012), C.ink, .05, .798, -.31 + k * .04, 0, -.2, 0);
    add(G.pbox(.08, .012, .065), C.white, .153, .799, -.172, -.32, -.2, 0);
    add(G.pbox(.075, .012, .04), C.gold, -.055, .802, -.315, 0, -.35, 0);
  });
  f.spot('under', null, .3, .025, .22, { label: '카페 테이블 다리 옆', maxH: .48, scale: 1.2 });
  f.spot('on', null, .04, .78, .23, { label: '찻잔 옆 빈 테이블', maxH: .65, scale: 1.8 });
};


// Stage 36 recipe: lamp/shadow observation → code safe → shutter actuator →
// rolling shutter and a real collectible shop key. Projection rides the shutter.
B.gpt_nightshadow = f => {
  shop(f, true, true);
  const shellWalk = f.walkBoxes();
  f.walkBoxes = () => [...shellWalk,
    [-1.34, .14, 1.49, -1.24, 2.26, 1.63], [1.24, .14, 1.49, 1.36, 2.26, 1.77],
    [1.32, 0, 2.05, 1.74, 2.3, 2.47],
    [-1.24, .16, .84, 1.24, 1.08, 1.51],
    ...(f.gptShutterPart?.t < .65 ? [[-1.24, .19, 1.525, 1.24, 2.19, 1.595]] : []),
    [.26, 1.17, -.05 + 1.6 * (f.gptShutterPart?.t > .7 ? stage(f.gptShutterPart.t, .7, 1) : 0), 1.22, 1.35, .65 + 1.6 * (f.gptShutterPart?.t > .7 ? stage(f.gptShutterPart.t, .7, 1) : 0)]
  ];
  body(f, 'shadow-street-hardware', ({ add, tube }) => {
    add(G.box(2.73, .22, .24, .045), C.green, 0, 2.32, 1.56);
    for (const x of [-1.29, 1.29]) add(G.box(.1, 2.12, .14, .025), C.green, x, 1.2, 1.56);
    add(G.box(.27, .44, .22, .03), C.green, 1.31, .65, 1.64);
    add(G.cyl(.055, .055, .075, 8), C.ink, 1.31, .73, 1.79, HP);
    // A full-height street lamp and visibly separate wall switch.
    add(G.cyl(.17, .21, .1, 12), C.cream, 1.53, .05, 2.26);
    add(G.cyl(.055, .07, 2.25, 10), C.woodD, 1.53, 1.18, 2.26);
    tube([1.53, 2.29, 2.26], [1.15, 2.29, 2.26], .04, C.woodD);
    add(G.box(.3, .34, .28, .045), C.light, 1.15, 2.08, 2.26);
    add(G.box(.39, .07, .36, .035), C.woodD, 1.15, 2.29, 2.26);
    add(G.box(.33, .06, .31, .025), C.woodD, 1.15, 1.88, 2.26);
    add(G.box(.28, .34, .16, .04), C.cream, 1.53, .91, 2.33);
    // Real parcel counter and guide brackets keep the private shop nook stocked,
    // while the waist-height key tray clears the walking route and its stairs.
    add(G.box(2.48, .86, .67, .035), C.wood, 0, .59, 1.175);
    add(G.box(2.5, .06, .7, .025), C.cream, 0, 1.05, 1.175);
    add(G.box(.32, .2, .24, .025), C.peach, -.65, 1.19, 1.17);
    add(G.box(.04, .21, .25, .008), C.cream, -.65, 1.19, 1.17);
    for (const x of [.5, 1.08]) { add(G.box(.04, .06, 1.72, .01), C.woodD, x, 1.14, .97); add(G.box(.055, .31, .14, .015), C.woodD, x, .955, 1.13); }
  });
  const shutter = moving(f, 'rolling-shop-shutter', 0, .19, 1.56, ({ add }) => {
    add(G.box(2.48, 2.0, .07, .025), '#eecfa3', 0, 1.0, 0);
    for (let k = 0; k < 18; k++) add(G.pbox(2.43, .025, .025), '#c67f2a', 0, .1 + k * .105, .049);
    add(G.box(.44, .08, .11, .025), C.green, 0, .1, .068);
  });
  const shadow = grp(); put(shadow, -.07, .68, .075); shutter.add(shadow);
  let shadowCode = '315';
  const drawCode = c => { c.clearRect(0, 0, 512, 160); c.fillStyle = '#ffe8ab'; c.fillRect(0, 0, 512, 160); c.fillStyle = '#6f4b30'; const text = shadowCode.length === 3 ? shadowCode[0] + ':' + shadowCode.slice(1) : shadowCode; fittedText(c, text, 512, 160, 110); };
  const shadowTex = canvasTex(512, 160, drawCode);
  const numbers = mesh(geo('gpt-shadow-projection', () => new THREE.PlaneGeometry(1.62, .5)), mat('#ffffff', { map: shadowTex })); shadow.add(numbers);
  shadow.visible = false; f.live = [shadow];
  f.gptShadow = { g: shadow, setCode(code) { shadowCode = String(code); drawCode(shadowTex.image.getContext('2d')); shadowTex.needsUpdate = true; }, setVisible(on) { shadow.visible = !!on; } };
  const sw = moving(f, 'shadow-switch', 1.53, .91, 2.43, ({ add }) => { add(G.box(.075, .19, .09, .025), C.coral, 0, 0, 0); add(G.sph(.065, 9, 6), C.gold, 0, -.11, .04); });
  const lampPart = f.part('lever', sw, t => { sw.rotation.x = .6 * t; f.gptShadow.setVisible(t > .25); }, { label: '가로등 그림자 스위치', sfx: 'click', dur: .32 });
  lampPart.gptShadowSwitch = true; lampPart.gptEndSfx = 'pop';
  const arm = moving(f, 'shutter-actuator', 1.31, .73, 1.79, ({ add }) => { add(G.box(.06, .26, .08, .018), C.woodD, 0, .13, .04); add(G.sph(.09, 10, 7), C.coral, 0, .3, .05); });
  const gearPivot = moving(f, 'shutter-gear', 1.25, 1.24, 1.72, ({ add }) => gear(add, 0, 0, 0, .19, C.gold));
  const tray = moving(f, 'actual-shopkey-tray', .74, 1.20, .3, ({ add }) => {
    add(G.box(.96, .06, .7, .025), C.wood, 0, 0, 0);
    add(G.box(.96, .13, .055, .02), C.green, 0, .05, .325);
  });
  const p = f.part('lever', [arm, gearPivot, shutter, tray], (t, ba, bg, bs, bt) => {
    const a = stage(t, 0, .28), b = stage(t, .18, .76), c = stage(t, .7, 1);
    arm.rotation.x = .95 * a; gearPivot.rotation.z = -PI * 3 * b;
    shutter.scale.y = 1 - .9 * b; shutter.position.y = bs.p.y + 1.8 * b;
    tray.position.z = bt.p.z + 1.6 * c;
  }, { label: '셔터 레버 · 톱니 → 셔터 상승 → 가게 열쇠', sfx: 'ratchet', dur: 2.8 });
  p.gptChain = true; p.gptTool = 'pulleyhandle'; p.gptRole = 'shopShutter';
  p.gptSteps = [{ at: 0, sfx: 'latch' }, { at: .2, sfx: 'ratchet' }, { at: .7, sfx: 'lift_metal' }, { at: .96, sfx: 'clink' }];
  p.gptTell = '…열쇠도 야근하네?';
  const actualKey = f.spot('inside', tray, 0, .045, -.04, { part: p, maxH: .4, scale: 2.2, label: '셔터 뒤 가게 열쇠 트레이' }); actualKey.reserved = true; actualKey.gptRole = 'shopkey';
  f.gptShutterPart = p; lampPart.setOpen(0); p.setOpen(0);
};

B.gpt_nightsafe = f => {
  body(f, 'shop-safe-body', ({ add }) => {
    add(G.box(1.22, .16, .94, .055), C.cream, 0, .08, 0);
    add(G.box(1.13, .11, .84, .025), C.green, 0, 1.18, 0);
    for (const x of [-.52, .52]) add(G.box(.1, 1.01, .84, .025), C.green, x, .67, 0);
    add(G.box(.95, 1.01, .09, .02), C.green, 0, .67, -.38);
    add(G.box(.95, .08, .75, .02), C.wood, 0, .2, 0);
    add(G.box(.95, .07, .75, .02), C.wood, 0, .73, 0);
    add(G.box(.53, .22, .34, .025), C.cream, 0, .88, -.05);
    add(G.box(.06, .23, .35, .008), C.coral, 0, .88, -.05);
  });
  const door = moving(f, 'shop-safe-door', -.54, .19, .46, ({ add }) => {
    add(G.box(1.08, .94, .11, .045), C.mint, .54, .47, 0);
    add(G.box(.91, .76, .035, .03), C.green, .54, .47, .075);
    add(G.cyl(.15, .15, .075, 18), C.cream, .45, .54, .12, HP);
    for (let k = 0; k < 8; k++) { const a = k * PI / 4; add(G.box(.025, .055, .02, .006), C.ink, .45 + Math.sin(a) * .11, .54 + Math.cos(a) * .11, .17, 0, 0, -a); }
    add(G.box(.07, .32, .08, .02), C.gold, .82, .46, .12);
  });
  const p = f.part('door', door, t => { door.rotation.y = -1.65 * t; }, { label: '그림자 숫자 금고', sfx: 'door_metal', dur: .55 });
  f.walkBoxes = () => {
    const b = new THREE.Box3(new THREE.Vector3(0, 0, -.055), new THREE.Vector3(1.08, .94, .055)).applyMatrix4(door.matrix);
    return [[-.61, 0, -.47, .61, 1.235, .47], [...b.min.toArray(), ...b.max.toArray()]];
  };
  p.lockable = true; p.lockKind = 'code'; p.gptRole = 'shadowSafe'; p.lockAt = { parent: door, x: .81, y: .47, z: .19 };
  const tool = f.spot('inside', null, 0, .26, .04, { part: p, maxH: .42, scale: 3, label: '금고 안 셔터 손잡이' }); tool.reserved = true; tool.gptRole = 'shutterTool';
};

B.gpt_nightvending = f => {
  body(f, 'night-snack-vending', ({ add }) => {
    add(G.box(.92, .11, .72, .035), C.cream, 0, .055, 0);
    for (const x of [-.41, .41]) add(G.box(.1, 1.54, .66, .035), C.coral, x, .87, 0);
    add(G.box(.76, 1.54, .07, .025), C.coral, 0, .87, -.3);
    add(G.box(.9, .14, .69, .04), C.coral, 0, 1.65, 0);
    add(G.box(.75, .08, .59, .02), C.cream, 0, .65, 0);
    add(G.box(.75, .06, .59, .02), C.cream, 0, .22, 0);
    for (let k = 0; k < 3; k++) { add(G.cyl(.075, .075, .25, 12), [C.mint, C.light, C.peach][k], -.24 + k * .24, .815, .17); add(G.cyl(.075, .075, .25, 12), [C.peach, C.mint, C.light][k], -.24 + k * .24, 1.34, .17); }
    add(G.box(.73, .045, .59, .015), C.cream, 0, 1.1925, 0);
    add(G.box(.32, .06, .055, .018), C.ink, .12, .58, .36);
  });
  const flap = moving(f, 'vending-delivery-flap', 0, .62, .36, ({ add }) => { add(G.box(.72, .34, .06, .025), C.mint, 0, -.17, 0); add(G.box(.25, .05, .055, .014), C.gold, 0, -.23, .06); });
  const p = f.part('flip', flap, t => { flap.rotation.x = -1.3 * t; }, { label: '밤 자판기 배출구', sfx: 'open_metal', dur: .42 }); p.gptEndSfx = 'clink';
  f.spot('inside', null, 0, .27, .12, { part: p, maxH: .3, scale: 1.1, label: '자판기 안 간식 칸' });
};

export const GPT_SHOPNIGHT_BUILDERS = B;
export const GPT_SHOPNIGHT_INFO = {
  gpt_nightbase: { w: 8, d: 7, name: '층층 밤거리 기반', price: 0, hidden: true, floor: true },
  gpt_nightbakery: { w: 3, d: 2, name: '달빛빵집', price: 0, hidden: true },
  gpt_nightbooks: { w: 3, d: 2, name: '새벽서점', price: 0, hidden: true },
  gpt_nightpulley: { w: 2, d: 2, name: '배달 도르래 비밀함', price: 0, hidden: true },
  gpt_nightbench: { w: 2, d: 1, name: '수납 벤치', price: 0, hidden: true },
  gpt_nightpost: { w: 1, d: 1, name: '밤우체통', price: 0, hidden: true },
  gpt_nightsign: { w: 1, d: 1, name: '회전 영업간판', price: 0, hidden: true },
  gpt_nightshadow: { w: 3, d: 2, name: '숫자 그림자 가게와 셔터', price: 0, hidden: true },
  gpt_nightsafe: { w: 2, d: 1, name: '그림자 관찰 금고', price: 0, hidden: true },
  gpt_nightvending: { w: 1, d: 1, name: '밤거리 간식 자판기', price: 0, hidden: true },
  gpt_nighttable: { w: 2, d: 2, name: '골목 카페 자리', price: 0, hidden: true },
};

// Fresh specs each call; no shared room arrays. Replacing map 36 does not mutate
// canonical shopmap or any furniture registry key.
export function makeShopnightMap(theme) {
  const F = (type, i, j, opts = {}) => ({ type, i, j, rot: 0, opts });
  return { theme, friendAt: [0, 1.15], nBonus: 3, fitAll: true, rooms: [{ at: [0, 0], layout: {
    w: 8, d: 7, theme, bleed: false, walls: { N: 'none', W: 'none', E: 'none', S: 'none' },
    furniture: [F('gpt_nightbase', 0, 0), F('gpt_nightbakery', 0, 0), F('gpt_nightshadow', 4, 0),
      { ...F('gpt_nightvending', 0, 3), dz: -.2 }, { type: 'gpt_nightsign', x: .4, z: 1.2 }, { type: 'gpt_nightsafe', x: 2.65, z: 1.35 }, { type: 'gpt_nighttable', x: -1.75, z: .55 }, F('gpt_nightbench', 2, 6)],
    decor: [],
  } }] };
}

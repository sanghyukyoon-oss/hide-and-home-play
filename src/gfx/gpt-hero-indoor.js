// Stage-specific indoor centrepieces. The original builders and hiding contracts are left intact.
// These use the house kit's merged vertex-colour meshes and the same toon/ink material pipeline.
import * as THREE from 'three';
import { put, grp, mesh, mat, geo, canvasTex, texCache, roundRect } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { rng } from '../util.js';
import { tr } from '../i18n.js';

const PI = Math.PI, HP = PI / 2;
const CREAM = '#fdf6da', IVORY = '#fdf6da', WOOD = '#eecfa3', HONEY = '#eaa440', WOODD = '#aa864e';
const SAGE = '#84ae9d', MINT = '#a2c8bb', PALE = '#f8e1c2', BRASS = '#dda54a', BROWN = '#6f4b30';
const CORAL = '#f28b6a', PINK = '#f7a8b8', ICE = '#f8e1c2', BLUE = '#9acccf';
const RAINBOW = ['#f28b6a', '#f8b15b', '#f4d28d', '#bbc78c', '#80bdd2', '#e99281'];
const B = {};
const labels = texCache();

// A face-sized print, never a canvas wrapped over a box. The small words are ornament; silhouette carries recognition.
// (⑥ 10/22 우리 룩: Korean words in the game's font, through tr())
function printFace(text, w, h, color = BROWN, bg = CREAM) {
  text = tr(text);
  const tex = labels.get('gpt-indoor-label|' + text + color + bg, () => canvasTex(512, 192, (ctx, W, H) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = color; ctx.lineWidth = 5; roundRect(ctx, 15, 15, W - 30, H - 30, 24); ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let size = 68;
    do { ctx.font = `700 ${size}px "Ssurround", "Jua", sans-serif`; size--; } while (ctx.measureText(text).width > W * .80 && size > 16);
    ctx.fillText(text, W / 2, H / 2 + 2);
  }));
  const m = mesh(geo('gpt-indoor-label-geo|' + w + '|' + h, () => new THREE.PlaneGeometry(w, h)), mat(IVORY, { map: tex }), { cast: false, recv: true });
  return m;
}
function glass(w, h) {
  const m = mesh(geo('gpt-indoor-glass|' + w + '|' + h, () => new THREE.PlaneGeometry(w, h)), mat('#f8e1c2', { opacity: .13, side: THREE.DoubleSide }), { cast: false, recv: false });
  return m;
}
function strawberry(add, x, y, z, s = 1) {
  add(G.sph(.037 * s, 9, 6), CORAL, x, y + .026 * s, z, 0, 0, 0, [1, 1.13, .9]);
  for (let k = 0; k < 4; k++) add(G.sph(.015 * s, 5, 4), SAGE, x + Math.cos(k * HP) * .015 * s, y + .061 * s, z + Math.sin(k * HP) * .015 * s, 0, k * HP, 0, [1.4, .35, 1]);
}
function cake(add, x, y, z, r = .13) {
  add(G.cyl(r + .025, r + .025, .014, 20), IVORY, x, y + .007, z);
  add(G.cyl(r, r, .125, 20), '#eecfa3', x, y + .078, z);
  for (const dy of [.047, .103]) add(G.cyl(r + .002, r + .002, .018, 20), PINK, x, y + dy, z);
  add(G.cyl(r + .009, r + .006, .031, 20), IVORY, x, y + .155, z);
  for (let k = 0; k < 7; k++) add(G.sph(.018, 7, 5), IVORY, x + Math.cos(k * PI * 2 / 7) * r * .79, y + .179, z + Math.sin(k * PI * 2 / 7) * r * .79, 0, 0, 0, [1, 1.1, 1]);
  strawberry(add, x, y + .175, z, .9);
}

// 32: the freezer in the device recipe, given a readable clock dial, a real basket interior and a vintage ice-cream crest.
// One original 'slide' part, one original inside anchor. The dial and glass are two handles on the same existing action.
B.gpt_hero_dialfreezer = f => {
  const W = .92, D = .64, Z = -.04, H = .78, FB = .58, PW = .49, PD = .62;
  f.add(mc('gpt-hero-dialfreezer-body-v2', ({ add, tube }) => {
    // Separate shell walls keep the open view honest; the rim has a recessed pale-blue insulated liner.
    add(G.box(.86, .055, .58, .02), WOODD, 0, .04, Z);
    for (const x of [-.37, .37]) for (const z of [Z - .23, Z + .23]) add(G.cyl(.035, .035, .07, 10), BROWN, x, .035, z, HP, 0, 0);
    for (const z of [Z - D / 2 + .029, Z + D / 2 - .029]) add(G.box(W, .69, .058, .025), CREAM, 0, .415, z);
    for (const x of [-W / 2 + .029, W / 2 - .029]) add(G.box(.058, .69, D - .116, .024), CREAM, x, .415, Z);
    add(G.box(.812, .04, .532, .014), ICE, 0, FB - .04, Z);
    for (const x of [-.405, .405]) add(G.box(.018, .18, .51, .007), ICE, x, .68, Z);
    for (const z of [Z - .256, Z + .256]) add(G.box(.79, .18, .018, .007), ICE, 0, .68, z);
    for (const z of [Z - .302, Z + .302]) add(G.box(.94, .06, .035, .012), MINT, 0, .735, z);
    for (const x of [-.452, .452]) add(G.box(.035, .06, .57, .012), MINT, x, .735, Z);
    // Hollow, inset top rim. Four rails, rather than a solid slab above the contents.
    for (const z of [Z - .295, Z + .295]) add(G.box(.94, .055, .05, .017), SAGE, 0, H + .013, z);
    for (const x of [-.445, .445]) add(G.box(.05, .055, .54, .017), SAGE, x, H + .013, Z);
    // Front enamel fascia: stripes, a cone emblem and the clock/dial recess.
    add(G.box(.84, .07, .018, .008), MINT, 0, .19, .288);
    add(G.box(.84, .025, .022, .006), HONEY, 0, .235, .29);
    add(G.box(.23, .28, .018, .025), PALE, -.29, .455, .292);
    add(G.cone(.067, .13, 12), '#f8b15b', -.29, .425, .313, PI, 0, 0, [1, 1, .28]);
    add(G.sph(.072, 12, 8), PINK, -.29, .51, .317, 0, 0, 0, [1, .82, .31]);
    add(G.sph(.052, 10, 7), IVORY, -.324, .555, .316, 0, 0, 0, [1, .8, .33]);
    add(G.cyl(.155, .155, .025, 32), SAGE, .115, .455, .304, HP, 0, 0);
    add(G.cyl(.13, .13, .02, 32), IVORY, .115, .455, .323, HP, 0, 0);
    for (let k = 0; k < 12; k++) { const a = k * PI / 6; add(G.box(.012, k % 3 ? .02 : .033, .008, .003), k % 3 ? BRASS : BROWN, .115 + Math.sin(a) * .108, .455 + Math.cos(a) * .108, .338, 0, 0, -a); }
    // A vent and service cover on both ends are visible from rotated inspection views.
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 5; k++) add(G.box(.009, .012, .24, .004), MINT, sx * .465, .29 + k * .04, -.06);
      add(G.box(.01, .095, .13, .009), PALE, sx * .466, .57, -.1);
    }
    // Baskets and goods stay clear of the original right-front hiding volume.
    for (const [x, w] of [[-.26, .30], [.16, .48]]) {
      add(G.box(w, .02, .45, .008), IVORY, x, FB - .01, Z - .005);
      for (const z of [Z - .22, Z + .21]) tube([x - w / 2, FB + .025, z], [x + w / 2, FB + .025, z], .009, BLUE);
      for (const dx of [-w / 2, w / 2]) tube([x + dx, FB + .025, Z - .22], [x + dx, FB + .025, Z + .21], .009, BLUE);
    }
    for (let k = 0; k < 5; k++) {
      const x = -.31 + k % 2 * .13, z = -.2 + Math.floor(k / 2) * .13, c = k % 2 ? CORAL : BLUE;
      add(G.box(.113, .036, .095, .013), c, x, FB + .044, z, 0, (k % 2 ? 1 : -1) * .1, 0);
      add(G.box(.073, .007, .065, .007), IVORY, x, FB + .066, z);
      add(G.box(.013, .012, .065, .004), '#d4c498', x, FB + .036, z + .06);
    }
    for (const x of [.11, .30]) {
      add(G.cyl(.065, .057, .08, 14), IVORY, x, FB + .055, -.21);
      add(G.cyl(.07, .07, .017, 14), x < .2 ? PINK : MINT, x, FB + .104, -.21);
      add(G.cyl(.035, .035, .004, 12), CREAM, x, FB + .116, -.21);
    }
    // A compact, well-supported backboard: an ice-cream sign, never a floating roof.
    for (const x of [-.32, .32]) add(G.box(.035, .26, .035, .009), SAGE, x, .93, -.315);
    add(G.box(.75, .21, .065, .06), CREAM, 0, 1.055, -.315);
    add(G.box(.68, .13, .02, .035), MINT, 0, 1.055, -.274);
    for (let k = 0; k < 7; k++) add(G.sph(.018, 7, 5), IVORY, -.285 + k * .095, .966, -.271, 0, 0, 0, [1, 1, .5]);
  }));
  f.add(put(printFace('아이스크림', .57, .11, BROWN, MINT), 0, 1.055, -.256));
  const pane = key => {
    const g = grp();
    g.add(mc('gpt-hero-dialfreezer-pane-' + key, ({ add }) => {
      for (const z of [-PD / 2 + .014, PD / 2 - .014]) add(G.box(PW, .025, .028, .009), CREAM, 0, 0, z);
      for (const x of [-PW / 2 + .014, PW / 2 - .014]) add(G.box(.028, .025, PD - .055, .009), CREAM, x, 0, 0);
      add(G.box(.035, .035, .18, .015), SAGE, -PW / 2 + .075, .024, .02);
      for (const z of [-.21, -.15]) add(G.box(.14, .007, .018, .006), IVORY, .045, .008, z, 0, -.32, 0);
    }));
    g.add(put(glass(PW - .055, PD - .055), 0, .003, 0, -HP)); f.add(g); return g;
  };
  const left = pane('L'), right = pane('R');
  put(left, -.215, H + .04, Z); put(right, .215, H + .066, Z);
  const dial = grp(); put(dial, .115, .455, .345);
  dial.add(mc('gpt-hero-dialfreezer-hand', ({ add }) => {
    add(G.box(.028, .102, .016, .01), HONEY, 0, .035, 0, 0, 0, -.2);
    add(G.box(.06, .021, .018, .008), BRASS, -.02, -.012, .004);
    add(G.cyl(.032, .032, .022, 14), SAGE, 0, 0, .01, HP, 0, 0);
  })); f.add(dial);
  const p = f.part('slide', [right, dial], (t, base) => { right.position.x = base.p.x - .42 * t; dial.rotation.z = -PI * 1.55 * t; }, { label: '시계 다이얼 냉동고', sfx: 'drawer', dur: .3 });
  f.spot('inside', null, .1, FB, Z + .12, { part: p, maxH: .21, label: '아이스크림 냉동고 안', scale: .7 });
};

// 34: a patisserie carousel with actual layered cakes, a parfait and a glass lift door. Its original door also turns the
// display a small amount, so the existing action makes the hero's construction legible without introducing a rule.
B.gpt_hero_parfaitcase = f => {
  const Z = -.08, BH = .74, TOP = 1.3, T0 = .772, T1 = 1.0375, FRONT = .235, DH = .54;
  f.add(mc('gpt-hero-parfaitcarousel-body-v2', ({ add }) => {
    add(G.box(.85, .055, .55, .018), WOODD, 0, .035, Z);
    add(G.box(.9, .64, .6, .055), WOOD, 0, .39, Z);
    add(G.box(.81, .48, .025, .04), CREAM, 0, .398, .237);
    for (let k = 0; k < 9; k++) add(G.box(.035, .47, .014, .007), '#fdebc3', -.35 + k * .0875, .398, .257);
    for (const x of [-.405, .405]) add(G.box(.036, .53, .03, .012), HONEY, x, .398, .245);
    add(G.box(.93, .065, .64, .025), SAGE, 0, BH - .0325, Z);
    add(G.box(.85, .015, .54, .006), IVORY, 0, BH + .0075, Z);
    // A glazed canopy lets the game camera see the desserts; the original top spot still rests on this roof.
    for (const z of [Z-.30,Z+.30]) add(G.box(.93,.045,.04,.012), SAGE, 0, TOP+.0075, z);
    for (const x of [-.445,.445]) add(G.box(.04,.045,.56,.012), SAGE, x, TOP+.0075, Z);
    add(G.box(.025,.012,.56,.004), BRASS, .17, TOP+.031, Z);
    for (const sx of [-1, 1]) for (const z of [Z - .265, Z + .265]) add(G.box(.035, .55, .035, .012), BRASS, sx * .416, 1.025, z);
    add(G.box(.80, .50, .025, .012), PALE, 0, 1.025, -.363);
    // Narrow reflected strokes, leaving the view of the food clear.
    for (const sx of [-1, 1]) add(G.box(.012, .31, .012, .005), IVORY, sx * .422, 1.05, -.12, -.15, 0, 0);
    // Crown at the back leaves the original top hiding position unobstructed.
    add(G.box(.44, .16, .045, .055), CREAM, -.08, 1.44, -.328);
    add(G.box(.34, .073, .022, .025), SAGE, -.08, 1.44, -.294);
    for (const x of [-.27, .11]) add(G.sph(.035, 9, 6), HONEY, x, 1.516, -.325);
    // Scalloped valance in the familiar café green, with a warm brass edge.
    for (let k = 0; k < 9; k++) add(G.sph(.043, 10, 6), CREAM, -.36 + k * .09, 1.276, .218, 0, 0, 0, [1, .72, .35]);
    add(G.box(.57, .018, .015, .006), BRASS, -.03, .285, .282);
    for (const x of [-.29, .29]) add(G.cyl(.019, .019, .015, 10), BRASS, x, .285, .287, HP, 0, 0);
  }));
  f.add(put(printFace('파르페', .36, .13, BROWN, CREAM), 0, .438, .281));
  f.add(put(printFace('카페', .28, .063, IVORY, SAGE), -.08, 1.44, -.277));
  f.add(put(glass(.83,.55),0,TOP+.035,Z,-HP));
  for (const sx of [-1, 1]) f.add(put(glass(.50, .49), sx * .422, 1.025, Z, 0, HP));
  // The rotating platter is one merged moving mesh. Food never crosses the original lower-right hiding gap.
  const carousel = grp(); put(carousel, 0, 0, Z);
  carousel.add(mc('gpt-hero-parfaitcarousel-platters-v3', ({ add }) => {
    for (const y of [BH + .023, 1.0285]) {
      add(G.cyl(.38, .38, .018, 32), IVORY, 0, y, 0, 0, 0, 0, [1, 1, .63]);
      add(G.tor(.375, .009, PI * 2, 5, 32), BRASS, 0, y + .006, 0, HP, 0, 0, [1, .63, 1]);
    }
    add(G.cyl(.016, .019, .48, 10), BRASS, 0, 1.006, 0);
    add(G.cyl(.055, .073, .025, 14), BRASS, 0, .78, 0);
    cake(add, -.225, T0 - .002, -.075, .10);
    cake(add, -.18, T1 - .001, .055, .105);
    // Large strawberry parfait at upper right: glass bowl, fruit band, whipped cream and wafer.
    add(G.cyl(.063, .048, .019, 14), CREAM, .21, T1 + .01, -.08);
    add(G.cyl(.017, .02, .045, 10), ICE, .21, T1 + .04, -.08);
    add(G.cyl(.076, .036, .105, 18), PALE, .21, T1 + .11, -.08);
    add(G.cyl(.072, .061, .035, 18), PINK, .21, T1 + .14, -.08);
    for (let k = 0; k < 6; k++) add(G.sph(.028, 8, 6), IVORY, .21 + Math.cos(k * PI / 3) * .038, T1 + .175, -.08 + Math.sin(k * PI / 3) * .038);
    strawberry(add, .21, T1 + .188, -.08, .8);
    add(G.box(.029, .13, .017, .005), '#f8b15b', .247, T1 + .19, -.10, 0, 0, -.2);
    // Two macarons sit behind the lower shelf's clear hiding space.
    for (const [x, z, c] of [[.05, -.18, PINK], [.25, -.18, MINT]]) {
      add(G.cyl(.055, .06, .023, 14), c, x, T0 + .013, z);
      add(G.cyl(.058, .058, .012, 14), IVORY, x, T0 + .03, z);
      add(G.cyl(.06, .052, .023, 14), c, x, T0 + .046, z);
    }
  })); f.add(carousel);
  const door = grp(); put(door, 0, TOP, FRONT);
  door.add(mc('gpt-hero-parfaitcarousel-door', ({ add }) => {
    for (const y of [-.018, -DH + .025]) add(G.box(.87, .035, .035, .012), SAGE, 0, y, 0);
    for (const x of [-.418, .418]) add(G.box(.035, DH, .035, .012), SAGE, x, -DH / 2, 0);
    add(G.box(.21, .026, .034, .012), BRASS, 0, -DH + .09, .034);
    for (const x of [-.09, .09]) add(G.box(.024, .026, .035, .007), BRASS, x, -DH + .09, .014);
    add(G.box(.015, .19, .006, .003), IVORY, -.31, -.22, .022, 0, 0, -.27);
  }));
  door.add(put(glass(.79, .455), 0, -DH / 2, 0)); f.add(door);
  // Turn the right-hand dessert toward the room: the opposite direction crossed the existing window's curtain bay.
  const p = f.part('door', [door, carousel], t => { door.rotation.x = -1.25 * t; carousel.rotation.y = -.50 * t; }, { label: '파르페 회전 진열장', sfx: 'open', dur: .32 });
  f.spot('inside', null, .17, T0, .03, { part: p, maxH: .24, label: '빵 진열장 안', scale: .7 });
  f.spot('on', null, .17, TOP + .04, -.1, { maxH: .45, label: '빵 진열장 위', scale: .8 });
};

// Reproduce the core bookshelf's seeded gap decisions exactly, including its RNG consumption per book. Only the mesh
// changes: stage 37 keeps all three original 'on' anchors, their order, height, scale and maximum item height.
function shelfContents(seed) {
  const r = rng((seed || 7) * 97 + 3), r2 = rng((seed || 7) * 31 + 5), gaps = [], books = [];
  for (const y of [.085, .64, 1.2]) {
    const gap = r() < .5 ? -.2 : .2; gaps.push(gap); let x = -.4;
    while (x < .4) {
      if (x > gap - .17 && x < gap + .17) { x = gap + .18; continue; }
      const w = .06 + r() * .05, h = .24 + r() * .14;
      if (x + w > .41) break;
      r(); const lean = r() < .12, d = .22 + r2() * .06, band = r2();
      books.push({ x: x + w / 2, y, w, h, lean, d, band }); x += w + .006;
    }
  }
  return { gaps, books };
}

// 37: a rainbow secret archive. The turntable bearings, a fine door seam, an inset storybook alcove and crayon cup tie
// it to the picture-book rainbow and the drawing left by Inky. Static display, as the replaced bookshelf has no parts.
B.gpt_hero_rainbowshelf = (f, T, o = {}) => {
  const seed = o.seed || 7, { gaps, books } = shelfContents(seed), Z = -.3, H = 1.84;
  f.add(mc('gpt-hero-rainbowarchive-v2|' + seed, ({ add, tube }) => {
    // A warm cabinet on a chunky swivel plinth, open on the front, with real thickness to every shelf.
    add(G.box(.94, .05, .41, .018), WOODD, 0, .025, Z);
    add(G.cyl(.16, .18, .018, 18), BRASS, 0, .059, Z, 0, 0, 0, [1, 1, .65]);
    add(G.box(.88, .017, .37, .006), WOOD, 0, .0765, Z);
    for (const sx of [-1, 1]) {
      add(G.box(.059, H - .05, .36, .015), WOOD, sx * .42, .94, Z);
      add(G.box(.022, H - .22, .021, .007), IVORY, sx * .422, .96, -.106);
      add(G.box(.085, .075, .40, .014), HONEY, sx * .418, .13, Z);
      add(G.box(.085, .072, .40, .014), HONEY, sx * .418, 1.80, Z);
      // Small brass hinge straps visually explain the secret-shelf construction.
      for (const y of [.36, 1.56]) {
        add(G.box(.044, .07, .018, .008), BRASS, sx * .424, y, -.104);
        add(G.sph(.009, 6, 4), BROWN, sx * .424, y, -.09, 0, 0, 0, [1, 1, .35]);
      }
    }
    add(G.box(.79, 1.715, .02, .008), PALE, 0, .965, -.47);
    // The thin central seam reads as an actual inset secret door, never as a dark void through the room wall.
    for (const sx of [-1, 1]) add(G.box(.375, 1.66, .015, .015), '#e8d7b7', sx * .195, .975, -.451);
    add(G.box(.012, 1.65, .012, .003), SAGE, 0, .97, -.437);
    for (const y of [.64, 1.2]) add(G.box(.79, .04, .34, .012), WOOD, 0, y - .02, Z + .005);
    for (const y of [.085, .64, 1.2]) {
      add(G.box(.785, .017, .035, .006), HONEY, 0, y - .0085, -.126);
      // A circular badge on each shelf back, visible through its intentionally empty hiding gap.
      const gap = gaps[[.085, .64, 1.2].indexOf(y)];
      add(G.cyl(.105, .105, .013, 20), CREAM, gap, y + .245, -.432, HP, 0, 0);
      add(G.box(.11, .085, .015, .012), WOOD, gap, y + .24, -.417);
      add(G.box(.045, .055, .009, .006), IVORY, gap - .027, y + .24, -.403, 0, -.1, .10);
      add(G.box(.045, .055, .009, .006), IVORY, gap + .027, y + .24, -.403, 0, .1, -.10);
    }
    // Rainbow runs across thick, individual spines; spine bands and title plates remain geometry, not stretched maps.
    books.forEach((b, i) => {
      const c = RAINBOW[i % RAINBOW.length], rz = b.lean ? .10 : 0, yc = b.y + b.h / 2 - (b.lean ? .004 : 0), zc = -.45 + b.d / 2;
      add(G.box(b.w, b.h, b.d, .009), c, b.x, yc, zc, 0, 0, rz);
      const front = zc + b.d / 2 + .008;
      for (const dy of [-b.h / 2 + .043, b.h / 2 - .04]) add(G.box(b.w * .76, .014, .009, .003), IVORY, b.x - Math.sin(rz) * dy, yc + Math.cos(rz) * dy, front, 0, 0, rz);
      add(G.box(b.w * .57, .034, .01, .004), BROWN, b.x, yc + .025, front + .002, 0, 0, rz);
    });
    // Rounded cornice and rainbow crest. Low contrast behind it keeps the top readable at phone size.
    add(G.box(.95, .07, .42, .02), WOODD, 0, 1.855, Z);
    add(G.box(.9, .035, .38, .013), CREAM, 0, 1.902, Z);
    add(G.box(.53, .18, .055, .06), CREAM, 0, 1.985, -.323);
    for (let k = 0; k < 6; k++) add(G.tor(.182 - k * .022, .009, PI, 5, 24), RAINBOW[k], 0, 1.944, -.283);
    for (const x of [-.16, .16]) for (const dx of [-.025, .025]) add(G.sph(.029, 7, 5), IVORY, x + dx, 1.943, -.281, 0, 0, 0, [1, .6, .5]);
    add(G.cyl(.055, .055, .028, 14), BRASS, 0, 1.938, -.35);
    // A crayon cup and an open picture book on top connect to the story's final crayon drawing.
    add(G.cyl(.058, .047, .095, 12), MINT, -.30, 1.963, -.30);
    for (let k = 0; k < 4; k++) {
      const x = -.327 + k * .018, y = 2.025 + (k % 2) * .017;
      add(G.cyl(.009, .009, .10, 6), RAINBOW[k], x, y, -.30, 0, 0, .07 - k * .05);
      add(G.cone(.009, .022, 6), '#d4c498', x, y + .061, -.30);
    }
    add(G.box(.18, .018, .13, .007), CORAL, .28, 1.932, -.29, 0, -.15, 0);
    for (const sx of [-1, 1]) add(G.box(.075, .013, .113, .004), IVORY, .28 + sx * .039, 1.948, -.29, 0, -.15, sx * -.12);
    // Visible turning bearing and little brass handle are construction detail, not a new interactive puzzle.
    tube([.36, .89, -.094], [.36, .99, -.094], .012, BRASS, 8);
    add(G.sph(.022, 8, 6), BRASS, .36, .89, -.094); add(G.sph(.022, 8, 6), BRASS, .36, .99, -.094);
  }));
  gaps.forEach((gap, li) => f.spot('on', null, gap, [.085, .64, 1.2][li], Z + .03, { maxH: .5, label: `책장 ${3 - li}층`, scale: .85 }));
};

export const GPT_INDOOR_BUILDERS = B;
export const GPT_INDOOR_INFO = {
  gpt_hero_dialfreezer: { w: 1, d: 1, name: '시계 다이얼 냉동고', price: 360, region: 'shop' },
  gpt_hero_parfaitcase: { w: 1, d: 1, name: '파르페 회전 진열장', price: 380, region: 'shop' },
  gpt_hero_rainbowshelf: { w: 1, d: 1, name: '무지개 비밀 서가', price: 160 },
};

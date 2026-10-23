// Static, additive dressing for the three home maps. Nothing here is furniture,
// a device, a hiding place or a walking obstacle. Paint is sampled from the room.
import { createDetailKit } from './gpt-detail-kit.js';

const PI = Math.PI, HP = PI / 2;
const O = { wood: '#d6ae7c', dark: '#a67c52', ink: '#35394d', cream: '#fff5df', paper: '#f9e9c8',
  red: '#d77464', blue: '#85a9ba', green: '#7faaa6', leaf: '#90af96', gold: '#f0d38c' };
const R = { wood: '#eecfa3', dark: '#6f4b30', cream: '#fef2e1', paper: '#fefde9', stone: '#e8d7b7',
  red: '#e98774', blue: '#6baebd', green: '#84ae9d', leaf: '#6f9a69', gold: '#feb53d', soil: '#6f4b30' };
const D = { wood: '#eaa440', dark: '#6f4b30', cream: '#fef2e1', paper: '#fefde9',
  red: '#ed6670', blue: '#4c99da', green: '#47b6a3', leaf: '#409a62', gold: '#feb53d', pink: '#e87eae' };

// The silhouette does the reading: no text labels and no new texture atlases.
function mug(k, C, color = C.blue) {
  k.cylinder(.14, .14, .028, C.paper, 0, .014, 0, 12);
  k.cylinder(.086, .073, .16, color, 0, .104, 0, 12);
  k.cylinder(.069, .069, .025, C.dark, 0, .181, 0, 12);
  for (let i = 0; i < 8; i++) {
    const a = i * PI / 4;
    const rim = k.box(.06, .025, .025, color, Math.cos(a) * .078, .194, Math.sin(a) * .078);
    rim.rotation.y = -a + HP;
  }
  k.rod([.075, .158, 0], [.143, .158, 0], .022, color);
  k.rod([.143, .158, 0], [.143, .075, 0], .022, color);
  k.rod([.143, .075, 0], [.075, .075, 0], .022, color);
}

function openCrate(k, C, w = .44, d = .34, h = .30) {
  k.box(w, .04, d, C.dark, 0, .02, 0);
  for (const x of [-w / 2 + .025, w / 2 - .025]) for (const z of [-d / 2 + .025, d / 2 - .025])
    k.box(.045, h, .045, C.wood, x, h / 2 + .025, z);
  for (const y of [.105, h - .025]) {
    for (const z of [-d / 2, d / 2]) k.box(w, .07, .028, C.wood, 0, y, z);
    for (const x of [-w / 2, w / 2]) k.box(.028, .07, d, C.wood, x, y, 0);
  }
  for (const x of [-w * .25, w * .25]) k.box(.025, h - .08, .031, C.dark, x, h / 2 + .02, d / 2 + .017);
}

function basket(k, C, color = C.wood, w = .43, d = .33) {
  k.box(w, .035, d, C.dark, 0, .018, 0);
  for (const z of [-d / 2, d / 2]) {
    for (let i = 0; i < 6; i++) k.box(.033, .27, .035, color, -w / 2 + .035 + i * (w - .07) / 5, .165, z);
    for (const y of [.08, .17, .29]) k.box(w + .025, .035, .038, color, 0, y, z);
  }
  for (const x of [-w / 2, w / 2]) {
    for (const z of [-d * .27, 0, d * .27]) k.box(.035, .27, .033, color, x, .165, z);
    for (const y of [.08, .17, .29]) k.box(.038, .035, d, color, x, y, 0);
  }
}

function boots(k, C, color = C.blue) {
  for (const x of [-.115, .115]) {
    k.box(.17, .035, .32, C.dark, x, .018, .025);
    k.sphere(.10, color, x, .085, .08, [.86, .62, 1.55]);
    k.cylinder(.071, .078, .28, color, x, .18, -.035, 10);
    k.cylinder(.057, .057, .025, C.dark, x, .325, -.035, 10);
    k.box(.035, .17, .028, C.paper, x, .18, .045);
  }
}

function slippers(k, C, color = C.red) {
  for (const x of [-.105, .105]) {
    k.sphere(.10, C.paper, x, .045, 0, [.83, .38, 1.65]);
    k.sphere(.095, color, x, .085, .055, [.87, .65, 1.00]);
    for (const z of [.025, .080]) k.box(.155, .025, .025, C.paper, x, .141, z);
  }
}

function plant(k, C, color = C.red, flowers = false) {
  k.cylinder(.15, .105, .21, color, 0, .105, 0, 10);
  k.cylinder(.161, .161, .045, color, 0, .223, 0, 10);
  k.cylinder(.128, .128, .025, C.dark, 0, .244, 0, 10);
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4, x = Math.cos(a) * .12, z = Math.sin(a) * .11, y = .39 + (i % 2) * .10;
    k.rod([0, .25, 0], [x, y, z], .018, C.leaf);
    const leaf = k.sphere(.09, i % 2 ? C.green : C.leaf, x, y, z, [1.10, .35, .68]); leaf.rotation.y = -a;
    if (flowers && i < 3) {
      for (let j = 0; j < 4; j++) {
        const b = j * HP;
        k.sphere(.033, C.paper, x + Math.cos(b) * .035, y + .055, z + Math.sin(b) * .035, [1, .65, 1]);
      }
      k.sphere(.024, C.gold, x, y + .072, z);
    }
  }
}

function leafPicture(k, C) {
  k.box(.47, .58, .065, C.wood, 0, 0, 0);
  k.paper(.39, .49, C.paper, 0, 0, .043);
  k.rod([-.09, -.17, .076], [.06, .15, .076], .018, C.dark);
  for (const [x, y, r] of [[-.085, -.06, -.7], [.035, .015, .6], [-.025, .08, -.7], [.06, .14, .5]]) {
    const leaf = k.sphere(.085, C.green, x, y, .093, [1, .45, .24]); leaf.rotation.z = r;
  }
}

function pegTowel(k, C, color = C.red) {
  k.box(.52, .07, .08, C.wood, 0, .53, 0);
  for (const x of [-.17, .17]) {
    k.rod([x, .53, .025], [x, .53, .13], .025, C.dark);
    k.sphere(.034, C.gold, x, .53, .14);
  }
  k.box(.31, .42, .045, color, -.09, .26, .14, .012);
  k.box(.31, .10, .07, color, -.09, .49, .13);
  for (const x of [-.18, -.11, -.04]) k.box(.028, .38, .03, C.paper, x, .26, .18);
  k.box(.30, .035, .035, C.paper, -.09, .08, .18);
}

function seedCard(k, C) {
  k.box(.39, .43, .055, C.wood, 0, 0, 0);
  k.paper(.32, .35, C.paper, 0, 0, .045);
  k.rod([0, -.09, .09], [0, .07, .09], .018, C.leaf);
  k.sphere(.075, C.green, -.045, .02, .10, [.8, .4, .28]);
  k.sphere(.075, C.leaf, .045, .065, .10, [.8, .4, .28]);
  k.box(.13, .04, .035, C.gold, 0, .19, .075);
}

// Match an existing static body's placement, but keep all additions under our
// own scene group so its parts, spots and cached collision bounds are untouched.
function atFurniture(room, k, type, name, build, occurrence = 0) {
  const rec = room.furns.filter(r => r.type === type)[occurrence];
  if (!rec) return;
  const p = rec.f.group.position;
  const g = k.prop(name, p.x, p.y, p.z, build, rec.f.group.rotation.y);
  g.scale.copy(rec.f.group.scale);
  return g;
}

function otaku(room, k) {
  // Fine base rails, a finished fascia and end-grain joints on the cutaway rim.
  k.box(6.82, .075, .045, O.dark, 0, .105, -2.91);
  k.box(.045, .075, 5.78, O.dark, -3.41, .105, 0);
  k.box(3.82, .035, .03, O.dark, -1.40, 2.015, -.432);
  for (let i = 0; i < 9; i++) {
    const x = -3.20 + i * .44;
    k.box(.026, .105, .035, O.dark, x, 2.02, -.43);
    if (i % 2 === 0) { const nail = k.cylinder(.016, .016, .025, O.cream, x + .08, 2.02, -.409, 6); nail.rotation.x = HP; }
  }
  for (let i = 0; i < 7; i++) k.box(.025, .065, .035, O.dark, -3.0 + i, -.035, 3.016);
  // The upper wall has one large, quiet calendar instead of more text posters.
  k.prop('otaku-lunar-calendar', -1.38, 3.65, -2.902, q => {
    q.box(.54, .52, .055, O.blue, 0, 0, 0);
    q.paper(.47, .44, O.paper, 0, -.015, .04);
    q.cylinder(.10, .10, .035, O.gold, -.10, .075, .088, 12).rotation.x = HP;
    for (let i = 0; i < 7; i++) for (let row = 0; row < 2; row++) q.box(.032, .03, .026, (i + row) % 6 === 0 ? O.red : O.blue, -.18 + i * .06, -.075 - row * .06, .092);
    for (const x of [-.16, .16]) q.box(.035, .09, .05, O.dark, x, .245, .035);
  });
  k.prop('otaku-loft-linen-bin', -1.48, 2.205, -.81, q => {
    basket(q, O, O.blue, .40, .29);
    q.box(.29, .07, .21, O.cream, 0, .10, 0);
    q.box(.29, .055, .20, O.red, 0, .166, 0);
    q.box(.07, .028, .20, O.paper, -.065, .204, 0);
  });
  k.prop('otaku-open-manga', -1.08, 2.208, -.64, q => {
    q.box(.38, .035, .26, O.red, 0, .018, 0);
    for (const x of [-.09, .09]) {
      const page = q.box(.17, .035, .23, O.paper, x, .05, 0); page.rotation.z = x < 0 ? -.06 : .06;
      for (const z of [-.065, 0, .065]) q.box(.12, .023, .025, O.blue, x, .079, z);
    }
    q.box(.025, .055, .26, O.dark, 0, .05, 0);
  }, -.13);
  atFurniture(room, k, 'gpt_mangashelf', 'otaku-cassette-carrier', q => {
    q.box(.35, .23, .26, O.blue, -.36, 2.08, 0, .015);
    q.box(.31, .045, .28, O.cream, -.36, 2.217, 0);
    q.box(.12, .075, .025, O.paper, -.36, 2.10, .15);
    q.rod([-.46, 2.25, 0], [-.46, 2.33, 0], .022, O.dark);
    q.rod([-.46, 2.33, 0], [-.26, 2.33, 0], .022, O.dark);
    q.rod([-.26, 2.33, 0], [-.26, 2.25, 0], .022, O.dark);
  }, 1);
  // The low upper shelf is occurrence 0; the two lower tall shelves follow it.
  // Their left halves are clear of the pre-existing on-shelf hiding anchors.
  atFurniture(room, k, 'gpt_mangashelf', 'otaku-bookshop-bag', q => {
    q.box(.29, .28, .20, O.paper, -.37, 2.105, 0);
    q.box(.17, .10, .025, O.red, -.37, 2.115, .115);
    q.rod([-.46, 2.25, 0], [-.46, 2.34, 0], .022, O.dark);
    q.rod([-.46, 2.34, 0], [-.28, 2.34, 0], .022, O.dark);
    q.rod([-.28, 2.34, 0], [-.28, 2.25, 0], .022, O.dark);
  }, 2);
  // One small rocket stands on the left end of the upper bookcase.
  atFurniture(room, k, 'gpt_mangashelf', 'otaku-rocket-bookend', q => {
    q.box(.24, .035, .24, O.dark, -.36, 1.2525, 0);
    q.cylinder(.065, .065, .16, O.cream, -.36, 1.35, 0, 10);
    q.cylinder(0, .065, .09, O.red, -.36, 1.475, 0, 10);
    q.sphere(.035, O.blue, -.36, 1.375, .065, [1, 1, .35]);
    for (const x of [-.44, -.28]) q.box(.035, .075, .08, O.red, x, 1.315, 0);
  }, 0);
  k.prop('otaku-hooked-rain-scarf', -3.405, 1.10, 2.43, q => pegTowel(q, O, O.blue), HP);
  k.prop('otaku-framed-leaf', -3.405, 2.36, 2.46, q => leafPicture(q, O), HP);
  // A real wall bracket holds this pot above the cat bed's toy mouse and cushion.
  k.box(.47, .04, .36, O.wood, -3.17, .53, 2.75);
  for (const z of [2.62, 2.88]) k.rod([-3.405, .36, z], [-3.015, .50, z], .022, O.dark);
  k.prop('otaku-front-flowers', -3.15, .55, 2.75, q => plant(q, O, O.red, true));
  k.prop('otaku-striped-slippers', -2.12, 0, 2.62, q => slippers(q, O, O.blue), -.15);
  k.prop('otaku-game-carry-case', -2.25, 0, -.85, q => {
    q.box(.42, .25, .30, O.green, 0, .15, 0, .022);
    q.box(.43, .04, .31, O.cream, 0, .26, 0);
    for (const x of [-.14, .14]) q.box(.035, .10, .035, O.gold, x, .225, .168);
    q.rod([-.08, .31, 0], [-.08, .38, 0], .024, O.dark);
    q.rod([-.08, .38, 0], [.08, .38, 0], .024, O.dark);
    q.rod([.08, .38, 0], [.08, .31, 0], .024, O.dark);
  });
  atFurniture(room, k, 'pcdesk', 'otaku-desk-tea', q => {
    q.prop('small-desk-mug', .35, .72, -.10, r => mug(r, O, O.red)).scale.setScalar(.62);
  });
}

function roof(room, k) {
  // Sparse shallow plaster joints stop inside the cap edges. They borrow the
  // cap's paint and ink ID below, so they never become little black fence bars.
  const capJoints = k.prop('roof-cap-joints', 0, 0, 0, q => {
    for (let i = 0; i < 7; i++) {
      const x = -3.15 + i * 1.05;
      q.box(.024, .004, .23, R.paper, x, .507, 3.0);
      q.box(.024, .004, .23, R.paper, x, .637, -3.0);
    }
    for (const x of [-3.44, 3.44]) for (let i = 0; i < 5; i++) q.box(.23, .004, .024, R.paper, x, .577, -2.3 + i * 1.15);
  });
  delete capJoints.userData.gptDetailProp; // Architectural relief, not an extra loose prop.
  for (let i = 0; i < 14; i++) {
    const x = -3.16 + i * .48;
    k.box(.42, .10, .026, i % 3 ? R.cream : R.stone, x, .18, 2.885);
    k.box(.42, .10, .026, R.cream, x - .12, .31, 2.885);
  }
  k.prop('roof-corner-drain', -3.10, .005, 2.66, q => {
    q.box(.36, .035, .43, R.dark, 0, .018, 0);
    for (let i = 0; i < 6; i++) q.box(.028, .025, .37, R.stone, -.145 + i * .058, .048, 0);
    for (const z of [-.19, .19]) q.box(.36, .025, .025, R.stone, 0, .048, z);
  });
  k.prop('roof-garden-broom', -3.12, 0, 2.21, q => {
    q.box(.31, .14, .14, R.wood, 0, .09, 0);
    for (let i = 0; i < 7; i++) q.box(.026, .13, .15, R.dark, -.125 + i * .0417, .075, .018);
    q.rod([0, .16, 0], [.12, .94, -.04], .025, R.wood);
    q.box(.28, .045, .16, R.green, 0, .155, .005);
  });
  k.prop('roof-laundry-boots', -2.66, 0, 2.62, q => boots(q, R, R.red), -.28);
  k.prop('roof-peg-pot', -2.98, 0, 1.33, q => {
    q.cylinder(.14, .115, .23, R.blue, 0, .115, 0, 10);
    q.cylinder(.117, .117, .025, R.dark, 0, .24, 0, 10);
    for (let i = 0; i < 5; i++) {
      const x = -.07 + i * .035, p = q.box(.03, .16, .045, i % 2 ? R.red : R.wood, x, .27 + (i % 2) * .025, 0);
      p.rotation.z = (i - 2) * -.12;
    }
    q.rod([-.13, .16, 0], [-.2, .32, 0], .018, R.wood);
    q.rod([-.2, .32, 0], [.14, .32, 0], .018, R.wood);
  });
  k.prop('roof-towel-stool', -3.02, 0, .63, q => {
    for (const x of [-.14, .14]) for (const z of [-.12, .12]) q.box(.045, .28, .045, R.dark, x, .14, z);
    q.box(.38, .055, .33, R.wood, 0, .308, 0);
    for (let i = 0; i < 3; i++) {
      q.box(.30, .055, .26, i % 2 ? R.cream : R.red, 0, .363 + i * .059, 0);
      q.box(.032, .026, .26, R.paper, -.09, .401 + i * .059, 0);
    }
  });
  k.prop('roof-clover-pot', -3.06, 0, -.13, q => plant(q, R, R.red));
  k.prop('roof-parapet-flowerbox', -1.20, .635, -3.0, q => {
    q.box(.68, .18, .23, R.red, 0, .09, 0);
    q.box(.59, .026, .17, R.dark, 0, .194, 0);
    for (const x of [-.22, 0, .22]) {
      q.rod([x, .20, 0], [x, .39, 0], .018, R.leaf);
      q.sphere(.09, R.green, x - .035, .29, 0, [.9, .4, .7]);
      q.sphere(.07, R.paper, x, .40, 0);
      q.sphere(.03, R.gold, x, .45, .025);
    }
    for (const x of [-.24, .24]) q.box(.04, .07, .27, R.wood, x, -.02, 0);
  });
  k.prop('roof-harvest-crate', .72, 0, 2.64, q => {
    openCrate(q, R, .46, .34, .26);
    for (let i = 0; i < 4; i++) {
      const x = (i % 2 - .5) * .19, z = (Math.floor(i / 2) - .5) * .13;
      q.sphere(.09, R.red, x, .16, z, [1, .95, 1]);
      q.box(.04, .025, .05, R.leaf, x, .25, z);
    }
  });
  k.prop('roof-garden-tool-caddy', 3.12, 0, 2.65, q => {
    openCrate(q, R, .31, .34, .27);
    q.box(.045, .48, .045, R.dark, -.07, .35, 0);
    q.box(.13, .16, .035, R.stone, -.07, .58, 0);
    q.box(.04, .025, .055, R.dark, -.07, .58, .033);
    q.rod([.07, .16, 0], [.10, .57, -.035], .023, R.wood);
    for (const x of [.05, .10, .15]) q.rod([x, .55, -.035], [x, .65, -.035], .018, R.stone);
    q.rod([.045, .55, -.035], [.155, .55, -.035], .018, R.stone);
  });
  k.prop('roof-seed-clipboard', -3.312, .31, .02, q => seedCard(q, R), HP);
  k.prop('roof-parapet-picnic-roll', 1.13, .505, 3.0, q => {
    q.box(.58, .075, .22, R.red, 0, .038, 0);
    q.box(.58, .065, .22, R.cream, .02, .108, 0);
    const roll = q.cylinder(.085, .085, .40, R.green, 0, .21, 0, 12); roll.rotation.z = HP;
    for (const x of [-.13, .13]) q.box(.035, .16, .20, R.paper, x, .21, 0);
  });
  k.prop('roof-bird-water-dish', -.38, .505, 3.0, q => {
    q.cylinder(.14, .11, .07, R.wood, 0, .035, 0, 12);
    q.cylinder(.115, .115, .026, R.blue, 0, .078, 0, 12);
    q.sphere(.075, R.paper, .13, .17, 0, [1.2, .9, .8]);
    q.sphere(.045, R.paper, .17, .245, .02);
    q.sphere(.012, R.dark, .19, .255, .055);
    q.cylinder(0, .025, .06, R.gold, .205, .239, .035, 6).rotation.z = -HP;
    q.rod([.10, .11, 0], [.12, .13, 0], .018, R.gold);
    q.rod([.16, .11, 0], [.15, .13, 0], .018, R.gold);
  });
  return capJoints;
}

function dogYard(room, k) {
  // Low border edging and individual kerb joints stay beside the existing route.
  for (let i = 0; i < 10; i++) {
    k.box(.13, .08, .34, D.cream, -2.34, .04, -3.94 + i * .78);
    if (i % 2 === 0) k.box(.035, .026, .16, D.dark, -2.32, .093, -3.94 + i * .78);
  }
  k.prop('dog-tennis-ball-basket', -2.04, 0, 2.74, q => {
    basket(q, D, D.wood, .42, .35);
    for (const [x, y, z] of [[-.09, .13, -.06], [.10, .13, .05], [0, .26, -.025]]) {
      q.sphere(.09, D.gold, x, y, z);
      q.box(.13, .025, .035, D.paper, x, y + .075, z);
    }
  });
  k.prop('dog-coiled-garden-hose', -2.05, 0, 1.79, q => {
    q.box(.43, .05, .39, D.wood, 0, .025, 0);
    for (let n = 0; n < 2; n++) {
      const rad = .14 - n * .045;
      for (let i = 0; i < 12; i++) {
        const a = i * PI / 6, b = (i + 1) * PI / 6;
        q.rod([Math.cos(a) * rad, .085, Math.sin(a) * rad], [Math.cos(b) * rad, .085, Math.sin(b) * rad], .025, D.green);
      }
    }
    q.rod([.13, .085, 0], [.24, .09, .07], .026, D.green);
    q.rod([.24, .09, .07], [.28, .09, .13], .03, D.gold);
  });
  k.prop('dog-muddy-boot-brush', -2.10, 0, -2.11, q => {
    q.box(.40, .075, .29, D.wood, 0, .038, 0);
    for (let i = 0; i < 6; i++) for (const z of [-.075, 0, .075]) q.box(.028, .07, .035, D.dark, -.15 + i * .06, .105, z);
    q.rod([-.22, .03, 0], [-.22, .35, 0], .025, D.wood);
    q.rod([.22, .03, 0], [.22, .35, 0], .025, D.wood);
  });
  k.prop('dog-enamel-water-bowl', 1.83, 0, -2.69, q => {
    q.cylinder(.21, .16, .10, D.blue, 0, .05, 0, 12);
    q.cylinder(.175, .175, .025, D.cream, 0, .115, 0, 12);
    q.cylinder(.14, .14, .025, D.green, 0, .139, 0, 12);
    for (const x of [-.09, .09]) q.sphere(.03, D.paper, x, .155, 0, [1, .25, 1]);
    q.box(.13, .055, .025, D.paper, 0, .06, .192);
  });
  k.prop('dog-bone-toy-tray', 1.67, 0, -3.72, q => {
    q.box(.48, .055, .34, D.red, 0, .028, 0);
    q.box(.39, .026, .26, D.cream, 0, .068, 0);
    for (const z of [-.065, .065]) {
      q.rod([-.11, .12, z], [.11, .12, z], .035, D.paper);
      for (const x of [-.11, .11]) for (const zz of [-.028, .028]) q.sphere(.045, D.paper, x, .12, z + zz);
    }
  });
  k.prop('dog-yard-towel-hooks', -1.25, .13, -4.465, q => pegTowel(q, D, D.pink));
}

function dogGround(room, k) {
  k.box(6.21, .085, .055, D.wood, 0, -.045, 4.39);
  k.box(6.12, .065, .04, D.dark, 0, .105, -4.28);
  for (let i = 0; i < 12; i++) k.box(.025, .08, .045, D.dark, -2.86 + i * .52, -.04, 4.416);
  k.prop('dog-market-canvas-bag', -2.72, 0, 3.80, q => {
    basket(q, D, D.green, .41, .32);
    q.rod([-.13, .29, 0], [-.13, .50, 0], .025, D.wood);
    q.rod([-.13, .50, 0], [.13, .50, 0], .025, D.wood);
    q.rod([.13, .50, 0], [.13, .29, 0], .025, D.wood);
    q.sphere(.10, D.gold, -.09, .32, 0, [.7, 1.35, .7]);
    q.sphere(.09, D.red, .09, .32, 0);
    q.box(.15, .17, .13, D.cream, 0, .20, .055);
  });
  k.prop('dog-doorstep-slippers', -2.11, 0, 3.90, q => slippers(q, D, D.pink), .16);
  k.prop('dog-umbrella-crock', 2.78, 0, 3.75, q => {
    q.cylinder(.15, .12, .35, D.blue, 0, .175, 0, 10);
    q.cylinder(.12, .12, .025, D.dark, 0, .365, 0, 10);
    for (const x of [-.055, .055]) {
      q.rod([x, .13, 0], [x + .045, .78, 0], .025, x < 0 ? D.red : D.green);
      q.rod([x + .045, .78, 0], [x + .10, .84, 0], .023, D.wood);
      q.rod([x + .10, .84, 0], [x + .16, .80, 0], .023, D.wood);
    }
    for (const x of [-.055, .055]) q.box(.07, .35, .09, x < 0 ? D.red : D.green, x + .015, .45, 0);
    q.box(.27, .045, .035, D.paper, 0, .19, .13);
  });
  k.prop('dog-kitchen-pegboard', -.70, 1.89, -4.282, q => {
    q.box(.65, .47, .055, D.wood, 0, 0, 0);
    for (let i = 0; i < 5; i++) for (const y of [-.15, 0, .15]) q.cylinder(.015, .015, .025, D.dark, -.24 + i * .12, y, .043, 6).rotation.x = HP;
    for (const x of [-.17, .17]) q.rod([x, .13, .05], [x, .13, .13], .022, D.dark);
    q.rod([-.17, .12, .13], [-.17, -.10, .13], .025, D.blue);
    q.sphere(.075, D.blue, -.17, -.13, .13, [.85, 1.1, .38]);
    q.box(.20, .23, .035, D.cream, .17, -.015, .13);
    for (const x of [.115, .175, .235]) q.box(.025, .18, .025, D.red, x, -.015, .162);
  });
  atFurniture(room, k, 'counter', 'dog-kitchen-tea-caddy', q => {
    q.box(.24, .035, .25, D.wood, .27, .953, -.28);
    q.prop('tea-cup', .27, .974, -.28, r => mug(r, D, D.blue)).scale.setScalar(.63);
  }, 1);
}

function dogLoft(room, k) {
  // Fascia beads and small scarf joints enrich the balcony without filling it.
  k.box(6.21, .07, .04, D.wood, 0, -.13, 1.951);
  k.box(6.21, .035, .04, D.dark, 0, -.19, 1.952);
  for (let i = 0; i < 10; i++) k.box(.028, .12, .04, D.dark, -2.92 + i * .64, -.13, 1.977);
  k.prop('dog-bedside-alarm-clock', -1.88, 0, -.68, q => {
    openCrate(q, D, .28, .30, .31);
    q.box(.31, .04, .32, D.wood, 0, .33, 0);
    q.sphere(.125, D.red, 0, .49, 0, [1, 1, .53]);
    const face = q.cylinder(.095, .095, .03, D.paper, 0, .49, .077, 12); face.rotation.x = HP;
    q.rod([0, .49, .10], [0, .55, .10], .014, D.dark);
    q.rod([0, .49, .10], [.05, .46, .10], .014, D.dark);
    for (const x of [-.085, .085]) {
      q.sphere(.056, D.gold, x, .61, 0, [1, .6, 1]);
      q.rod([x, .39, 0], [x * 1.15, .355, 0], .02, D.dark);
    }
  });
  k.prop('dog-loft-blanket-basket', 2.72, 0, 1.43, q => {
    basket(q, D, D.wood, .44, .34);
    q.box(.34, .07, .26, D.blue, 0, .10, 0);
    q.box(.34, .07, .26, D.pink, 0, .18, 0);
    q.box(.34, .07, .26, D.cream, 0, .26, 0);
    for (const x of [-.11, .04]) q.box(.035, .025, .26, D.blue, x, .307, 0);
  });
  k.prop('dog-loft-wall-succulent', 3.015, 1.1, -.12, q => {
    q.box(.54, .045, .27, D.wood, 0, 0, .035);
    for (const x of [-.20, .20]) q.rod([x, -.16, -.065], [x, -.025, .14], .022, D.dark);
    q.prop('succulent', 0, .024, .035, r => plant(r, D, D.pink)).scale.setScalar(.75);
  }, -HP);
  k.prop('dog-loft-moon-postcard', 1.34, 2.05, -1.778, q => {
    q.box(.54, .64, .045, D.red, 0, 0, 0);
    q.paper(.46, .56, D.paper, 0, 0, .035);
    q.box(.36, .30, .028, D.blue, 0, .045, .075);
    q.sphere(.09, D.gold, -.075, .10, .098, [1, 1, .20]);
    for (const [x, y] of [[.09, .13], [.12, -.03], [-.14, -.025]]) {
      q.box(.055, .023, .025, D.paper, x, y, .103);
      q.box(.023, .055, .025, D.paper, x, y, .104);
    }
    for (const y of [-.17, -.23]) q.box(.28, .025, .025, D.wood, 0, y, .078);
  });
}

export function addHomeDetails(room, key, index = 0) {
  if (!['gptotakumix', 'gptvillaroof', 'gptdoghouse'].includes(key)) return null;
  const k = createDetailKit(room);
  let capJoints;
  if (key === 'gptotakumix') otaku(room, k);
  else if (key === 'gptvillaroof') capJoints = roof(room, k);
  else if (index === 0) dogYard(room, k);
  else if (index === 1) dogGround(room, k);
  else if (index === 2) dogLoft(room, k);
  const root = k.finish();
  if (capJoints) {
    let capInk;
    room.furns.find(r => r.type === 'gptroofshell')?.f.group.traverse(o => {
      if (!capInk && o.isMesh && o.userData.og) capInk = o.userData.og;
    });
    // Only the new meshes join the existing architecture's outline identity.
    if (capInk) capJoints.traverse(o => { if (o.isMesh) o.userData.og = capInk; });
  }
  return root;
}

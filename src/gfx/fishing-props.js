// 개굴이의 낚시터 (2026-10-17, user must-have: "낚시터"; layout idea from Codex fishing-game-v1). A small pond in the
// park: round stones, lily pads you can look on, a wooden fishing platform whose reel winds a keep-net up out of the
// water (the scene changes before you find what's in it), reeds, a tackle box, a bait bucket, a parasol seat and a
// hand-painted sign. Built from the shared toy kit (one merged mesh per piece) so the stage stays light.
import * as THREE from 'three';
import { put, grp, shade } from './kit.js';
import { HG as G, hmc as mc, hleaves as leaves } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
// (water 10/19: a touch clearer and deeper — 3판 back to the first, "아주 약간만 다듬어")
const WATER = '#68cdea', WATER2 = '#a9e4f6', DEEP = '#45b3dc', STONE = '#c9c2d8', STONE2 = '#b1a9c4', WOOD = '#d9a466', WOODD = '#a8733f', LEAF = '#7fcf6a', LEAF2 = '#5cb45a';
const B = {};

// 연못 (3×3): a round pond ringed with stones; three lily pads (something small can sit on one), a lotus, ripples
B.pond = f => {
  const R = 1.32;
  f.add(mc('pond', ({ add }) => {
    add(G.cyl(R, R, .03, 40), DEEP, 0, .012, 0);
    add(G.cyl(R - .12, R - .12, .034, 40), WATER, 0, .018, 0);
    for (const [r, c] of [[.95, WATER2], [.55, WATER2]]) add(G.tor(r, .008, PI * 2, 4, 40), c, 0, .037, 0, HP, 0, 0);
    // stones round the rim, a little uneven
    for (let k = 0; k < 22; k++) {
      const a = k / 22 * PI * 2 + (k % 3) * .05, rr = R + .02 + (k % 2) * .05, s = .14 + (k * 37 % 5) * .02;
      add(G.sph(s, 10, 7), k % 3 ? STONE : STONE2, Math.cos(a) * rr, s * .3, Math.sin(a) * rr, 0, a, 0, [1.3, .6, 1]);
    }
    // a lotus flower
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; add(G.sph(.05, 8, 6), '#ffb3cf', -.5 + Math.cos(a) * .05, .07, .35 + Math.sin(a) * .05, .5, a, 0, [.7, 1, 1.4]); }
    add(G.sph(.035, 8, 6), '#ffe27a', -.5, .09, .35);
  }));
  const pad = (x, z, r, rot) => {
    const m = f.add(mc('lilypad|' + r, ({ add }) => {
      const s = new THREE.Shape(); s.absarc(0, 0, r, .35, PI * 2 - .1, false); s.lineTo(0, 0);
      add(G.ext(s, .02, 0, 16), LEAF2, 0, .045, 0, -HP, 0, 0);
      add(G.tor(r * .55, .005, PI * 1.4, 3, 16), shade(LEAF2, .15), 0, .066, 0, HP, 0, 0);
    }));
    m.rotation.y = rot; m.position.set(x, 0, z);
    f.spot('on', null, x, .065, z, { maxH: .28, label: '연잎 위', scale: .7 });
  };
  pad(.45, -.4, .24, .4); pad(-.35, -.55, .2, 2.1); pad(.7, .45, .22, 4.4);
  f.spot('behind', null, -1.15, 0, -.55, { maxH: .25, label: '연못가 돌 뒤', scale: .7 });
};

// 낚시 좌대 (2×1): a plank platform on posts, a rod in its holder reaching out over the water, a reel you crank —
// winding it pulls the keep-net up out of the pond (a part: what is inside shows once it's up)
B.fishdock = f => {
  const D = .9, Y = .28;
  f.add(mc('fishdock', ({ add, tube }) => {
    add(G.box(1.9, .06, D, .02), WOOD, 0, Y, 0);
    for (let x = -.85; x <= .86; x += .19) add(G.box(.17, .02, D - .04, .006), shade(WOOD, (x * 10 | 0) % 2 ? .06 : -.03), x, Y + .035, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.05, .05, Y + .05, 10), WOODD, sx * .85, Y / 2 - .02, sz * (D / 2 - .06));
    // rod holder post and the rod
    add(G.cyl(.04, .04, .45, 10), WOODD, .55, Y + .22, .2);
    tube([.55, Y + .4, .2], [.75, Y + 1.25, 1.25], .018, '#3a3f5c', 6);
    add(G.sph(.03, 8, 6), '#ff5a6a', .75, Y + 1.26, 1.26);
    // a low stool and a small bait tin on the planks
    add(G.cyl(.16, .14, .22, 16), '#7fb5ff', -.45, Y + .15, -.1);
    add(G.cyl(.17, .17, .03, 16), shade('#7fb5ff', -.15), -.45, Y + .27, -.1);
    add(G.cyl(.08, .08, .07, 14), '#d9dde8', -.05, Y + .07, .25);
  }));
  // the reel on the holder: a part with the line and the keep-net
  const reel = grp(); put(reel, .62, Y + .38, .2); f.add(reel);
  reel.add(mc('fishreel', ({ add }) => { add(G.cyl(.07, .07, .05, 16), '#ffcf3c', 0, 0, 0, 0, 0, HP); add(G.box(.025, .1, .025, .008), '#5b5672', .04, -.05, 0); add(G.sph(.022, 8, 6), '#ff5a6a', .05, -.1, 0); }));
  const NET = { x: .75, z: 1.25 }, yLo = -.35, yHi = Y + .55;
  const net = grp(); put(net, NET.x, yLo, NET.z); f.add(net);
  net.add(mc('keepnet', ({ add, tube }) => {
    add(G.cyl(.2, .16, .04, 18), '#3f7f6a', 0, 0, 0);
    for (let k = 0; k < 10; k++) { const a = k / 10 * PI * 2; tube([Math.cos(a) * .16, 0, Math.sin(a) * .16], [Math.cos(a) * .2, .26, Math.sin(a) * .2], .006, '#3f7f6a', 4); }
    add(G.tor(.2, .016, PI * 2, 6, 22), '#ffcf3c', 0, .26, 0, HP, 0, 0);
    for (const [x, z] of [[.2, 0], [-.2, 0], [0, .2], [0, -.2]]) tube([x, .26, z], [0, .55, 0], .004, '#e8e8f0', 3);
  }));
  const line = grp(); put(line, NET.x, Y + 1.25, NET.z); f.add(line);
  line.add(mc('fishline', ({ add }) => add(G.cyl(.004, .004, 1, 4), '#e8e8f0', 0, -.5, 0)));
  const setLine = ny => { line.scale.y = Math.max(.05, Y + 1.25 - (ny + .55)); };
  setLine(yLo);
  const p = f.part('lift', [net, reel, line], (t, bN, bR) => {
    net.position.y = bN.p.y + (yHi - yLo) * t; net.rotation.y = t * 1.2;
    reel.rotation.x = -t * PI * 8; setLine(net.position.y);
  }, { label: '낚싯대 릴', sfx: 'swish', dur: .9 });
  f.spot('inside', net, 0, .05, 0, { part: p, maxH: .24, label: '물속 그물망', scale: .75 });
  f.spot('on', null, -.45, Y + .29, -.1, { maxH: .3, label: '좌대 의자 위', scale: .7 });
  f.spot('under', null, -.2, 0, -.3, { maxH: .2, label: '좌대 밑', scale: .7 });
};

// 갈대 (1×1): a clump of reeds and cattails at the water's edge — something can hide among them
B.reeds = f => {
  f.add(mc('reeds', ({ add, tube }) => {
    for (let k = 0; k < 11; k++) {
      const a = k * 2.4, r = .08 + (k % 4) * .06, x = Math.cos(a) * r, z = Math.sin(a) * r, h = .55 + (k % 5) * .1, lean = (k % 3 - 1) * .08;
      tube([x, 0, z], [x + lean, h, z + lean * .5], .012, k % 2 ? '#7fbf5a' : '#5aa84a', 4);
      if (k % 3 === 0) add(G.cap(.025, .12, 2, 6), '#8a5a3a', x + lean, h + .02, z + lean * .5);
    }
  }));
  f.spot('inside', null, 0, 0, .05, { maxH: .26, label: '갈대 속', scale: .7 });
};

// 낚시 도구함 (1×1): a two-tier tackle box; the lid lifts on trays of lures and floats
B.tacklebox = f => {
  f.add(mc('tackle', ({ add }) => {
    add(G.box(.62, .26, .38, .03), '#3fae86', 0, .13, 0);
    add(G.box(.64, .03, .4, .01), shade('#3fae86', -.15), 0, .2, 0);
    add(G.box(.16, .06, .06, .02), '#2f8a68', 0, .14, .2);
  }));
  const lid = grp(); put(lid, 0, .26, -.19); f.add(lid);
  lid.add(mc('tacklelid', ({ add }) => { add(G.box(.62, .06, .38, .02), '#4fc59a', 0, .03, .19); add(G.box(.2, .04, .05, .015), '#ffcf3c', 0, .08, .19); }));
  const p = f.part('lid', lid, (t, b) => { lid.rotation.x = -1.6 * t; }, { label: '도구함 뚜껑', sfx: 'open' });
  f.add(mc('tacklein', ({ add }) => {
    for (const [x, c] of [[-.2, '#ff5a6a'], [-.05, '#ffcf3c'], [.1, '#7fb5ff'], [.22, '#ff9ec2']]) add(G.cap(.025, .07, 2, 6), c, x, .25, .02, 0, 0, HP);
  }));
  f.spot('inside', null, 0, .25, 0, { part: p, maxH: .14, label: '도구함 안', scale: .6 });
  f.spot('on', lid, 0, .06, .19, { maxH: .3, label: '도구함 위', scale: .7 });
};

// 미끼통 (1×1): a bait bucket with a little scoop
B.baitbucket = f => {
  f.add(mc('baitbucket', ({ add, tube }) => {
    add(G.cyl(.2, .16, .3, 18), '#ff8a5a', 0, .15, 0);
    add(G.tor(.2, .016, PI * 2, 5, 20), '#ff6a3a', 0, .3, 0, HP, 0, 0);
    add(G.cyl(.18, .18, .02, 18), '#8a5a3a', 0, .27, 0);
    tube([-.2, .3, 0], [0, .48, 0], .008, '#c9cfe0', 4); tube([0, .48, 0], [.2, .3, 0], .008, '#c9cfe0', 4);
  }));
  f.spot('inside', null, 0, .28, 0, { maxH: .2, label: '미끼통 안', scale: .6 });
  f.spot('behind', null, 0, 0, -.3, { maxH: .25, label: '미끼통 뒤', scale: .7 });
};

// 파라솔 의자 (1×1): a striped beach umbrella over a folding chair
B.parasol = f => {
  f.add(mc('parasol', ({ add, tube }) => {
    tube([0, 0, -.1], [0, 1.45, -.1], .025, '#e8e8f0', 6);
    add(G.cone(.72, .32, 16), '#ff7a8a', 0, 1.42, -.1); add(G.cone(.4, .18, 16), '#ffffff', 0, 1.5, -.1);
    add(G.sph(.04, 8, 6), '#ff5a6a', 0, 1.62, -.1);
    // folding chair
    add(G.box(.42, .04, .36, .01), '#6fb8e8', 0, .3, .12);
    add(G.box(.42, .36, .04, .01), '#6fb8e8', 0, .5, -.05, -.25, 0, 0);
    for (const sx of [-1, 1]) { tube([sx * .2, 0, .3], [sx * .2, .3, -.02], .015, '#c9cfe0', 4); tube([sx * .2, 0, -.05], [sx * .2, .3, .28], .015, '#c9cfe0', 4); }
  }));
  f.spot('on', null, 0, .32, .12, { maxH: .3, label: '파라솔 의자 위', scale: .75 });
  f.spot('under', null, 0, 0, .12, { maxH: .22, label: '파라솔 의자 밑', scale: .7 });
};

// 낚시터 간판 (1×1): a painted board on two legs, a fish drawn on it
B.fishsign = f => {
  f.add(mc('fishsign', ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.06, .9, .06, .015), WOODD, sx * .32, .45, -.05);
    add(G.box(.8, .42, .05, .03), '#fff4dc', 0, .78, -.02);
    add(G.box(.84, .04, .07, .015), WOODD, 0, 1.01, -.02);
    add(G.sph(.1, 12, 8), '#5ab9df', -.05, .78, .02, 0, 0, 0, [1.6, .8, .3]);
    add(G.cone(.08, .12, 3), '#5ab9df', .15, .78, .02, 0, 0, -HP, [1, 1, .3]);
  }));
  f.spot('behind', null, 0, 0, -.25, { maxH: .3, label: '간판 뒤', scale: .7 });
  f.spot('on', null, 0, 1.04, -.02, { maxH: .2, label: '간판 위', scale: .55 });
};

export const FISH_BUILDERS = B;
export const FISH_INFO = {
  pond: { w: 3, d: 3, name: '연못', price: 420, region: 'park' },
  fishdock: { w: 2, d: 1, name: '낚시 좌대', price: 300, region: 'park' },
  reeds: { w: 1, d: 1, name: '갈대', price: 70, region: 'park' },
  tacklebox: { w: 1, d: 1, name: '낚시 도구함', price: 120, region: 'park' },
  baitbucket: { w: 1, d: 1, name: '미끼통', price: 60, region: 'park' },
  parasol: { w: 1, d: 1, name: '파라솔 의자', price: 180, region: 'park' },
  fishsign: { w: 1, d: 1, name: '낚시터 간판', price: 90, region: 'park' },
};

// Wall blocks for the outdoor boss mazes (2026-10-17, user: "미로같이 코너랑 사각이 많은 맵"). One tile each and a little taller
// than a mochi, so a row of them reads as a wall, hides you from the seeker, and the camera still sees over it. Boss maps
// only (hidden from the shop and the thumbnails); the boss scene lets you crouch behind them.
import { HG as G, hmc as mc } from './house-props.js';

const B = {};
// 생울타리: a clipped hedge block with a lighter top, leaf tufts and a few flowers
B.hedgeblock = f => {
  // everything stays inside ±.45 so the doorway tile between two blocks keeps room for a body
  f.add(mc('hedgeblock', ({ add }) => {
    add(G.box(.9, .86, .9, .16), '#4fae52', 0, .43, 0);
    for (let k = 0; k < 6; k++) add(G.sph(.17, 10, 8), k % 2 ? '#5cbd5c' : '#6fcf68', -.25 + (k % 3) * .25, .86, k < 3 ? -.2 : .2, 0, 0, 0, [1, .5, 1]);
    for (const [x, z, c] of [[-.26, .44, '#ff9ec2'], [.2, .44, '#ffe27a'], [.44, -.16, '#ff9ec2'], [-.44, .12, '#ffffff'], [.44, .28, '#ffffff']])
      add(G.sph(.04, 8, 6), c, x, .52 + (Math.abs(x * 7) % 3) * .08, z);
  }));
};
// 나무 상자 더미: two crates stacked crooked with a rope round them
B.crateblock = f => {
  f.add(mc('crateblock', ({ add }) => {
    for (const [y, h, r, s, c] of [[0, .62, 0, .9, '#d9a56a'], [.62, .5, .2, .7, '#e6b67c']]) {
      add(G.box(s, h, s, .03), c, 0, y + h / 2, 0, 0, r, 0);
      for (const sy of [.18, .5, .82]) add(G.box(s + .01, .035, s + .01, .01), '#b9834e', 0, y + h * sy, 0, 0, r, 0);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(G.box(.06, h, .06, .01), '#a8733f', (Math.cos(r) * sx - Math.sin(r) * sz) * (s / 2 - .02), y + h / 2, (Math.sin(r) * sx + Math.cos(r) * sz) * (s / 2 - .02), 0, r, 0);
    }
    add(G.box(.52, .02, .3, .01), '#fff4dc', 0, .63 + .5, 0, 0, .2, 0);   // a shipping label on top
  }));
};
// 바위 더미: three chunky boulders with a patch of moss
B.rockblock = f => {
  f.add(mc('rockblock', ({ add }) => {
    add(G.sph(.38, 7, 5), '#a9a3b8', -.08, .3, .04, .3, .5, 0, [1.05, .85, 1]);
    add(G.sph(.3, 7, 5), '#958ea6', .16, .27, -.12, 0, 1.2, .2, [1, .9, 1.05]);
    add(G.sph(.24, 6, 5), '#b8b2c6', .1, .66, .08, .4, 0, .3, [1, .8, 1]);
    add(G.sph(.17, 8, 6), '#7fbf5a', -.16, .58, .1, 0, 0, 0, [1.3, .35, 1.1]);
  }));
};

export const MAZE_BUILDERS = B;
export const MAZE_INFO = {
  hedgeblock: { w: 1, d: 1, name: '생울타리', price: 0, region: 'park', hidden: true },
  crateblock: { w: 1, d: 1, name: '나무 상자 더미', price: 0, region: 'alley', hidden: true },
  rockblock: { w: 1, d: 1, name: '바위 더미', price: 0, region: 'camp', hidden: true },
};

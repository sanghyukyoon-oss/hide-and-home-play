// 3판 B안 「개굴이의 호수 낚시터」 (fishing2b, 10/24): 맑은 호수 위 둥근 섬 하나 — 큰 나무(그네), 작은 미끼 가게, 물 위로 뻗은 잔교와
// 매어 둔 나룻배, 물가 연잎. 섬 물가는 풀 → 모래가 물속으로 비스듬히 잠김(지층 받침·얇은 띠 X), 물은 얕은 옥빛에서 하늘빛으로.
// 숨김 자리·부품은 3판과 같게: 조각 종류 이름은 정본(pond·fishdock·tree·fishsign …), 그림만 바꿔 끼움(opts.gptHero).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, shade, mesh, mat } from './kit.js';
import { groundTex } from './outdoor.js';
import { blobOutline, scaleOutline, ribbon } from './pc-kit.js';
import { G, mc, mt, TX, PI, HP, mix, texMat, paintTex, stone, lily, lotus, cattails, daisy, tuft, crown, butterfly, dragonfly, scenery, lakeWater } from './s3-kit.js';

const B = {};
const WOOD = '#e6b47a', WOODD = '#b98552', WOODL = '#f2cf9c';
export const ISLAND_B = blobOutline(3.4, 3.0, { pad: .5, round: 2.4, amp: .15, seed: 6, n: 120, bulge: [[.08, .3, .45], [1.75, .22, .5]] });

// the island's ground as ONE mesh (one outline id: no line between grass and sand): the grass top (meadow) and round it a
// sand beach sloping down to the waterline (sand texture), so the only ink line is the shoreline itself
function slabUV(g, span) { const p = g.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) / span; uv[i * 2 + 1] = -p.getZ(i) / span; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g; }
export function beachGeo(pts, out, y0, y1, span = 5) {
  const n = pts.length, pos = [], idx = [], K = 4;
  for (let k = 0; k <= K; k++) { const t = k / K, d = out * t, y = y0 + (y1 - y0) * (t * t * .35 + t * .65);
    for (let i = 0; i < n; i++) { const [x, z] = pts[i], L = Math.hypot(x, z) || 1; pos.push(x + x / L * d, y, z + z / L * d); } }
  for (let k = 0; k < K; k++) for (let i = 0; i < n; i++) { const a = k * n + i, b = k * n + (i + 1) % n; idx.push(a, b, a + n, b, b + n, a + n); }
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g = g.toNonIndexed(); g.computeVertexNormals();
  return slabUV(g, span);
}
export function groundMesh(pts, beach, T, o = {}) {
  const top = G.slab(pts, .05, 0); top.translate(0, -.05, 0); slabUV(top, 5);
  const t2 = top.toNonIndexed(); for (const k of Object.keys(t2.attributes)) if (!['position', 'normal', 'uv'].includes(k)) t2.deleteAttribute(k);
  const g = mergeGeometries([t2, beach], true);
  const sand = groundTex('sand', { sand: o.sand || '#f2e2bd' });
  const m = mesh(g, [texMat(groundTex(o.kind || 'meadow', T)), texMat(sand)], { cast: false, recv: true });
  m.userData.floor = true; return m;
}
// ── 섬 (판 바닥): 풀밭 윗면(meadow 무늬) + 모래 물가 + 호수 + 물가 풀포기·조약돌·작은 꽃 + 가게에서 잔교까지 디딤돌 ─────────────
B.s3b_island = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];
  const pts = ISLAND_B;
  f.add(groundMesh(pts, beachGeo(pts, .55, 0, -.085), { ...T, grass: T.grass || '#8bce6f', clover: 14, daisies: 14 }));
  lakeWater(f, { pts: scaleOutline(pts, .5), y: -.075, R: 26, near: '#a6e6df', mid: '#76d3e2', far: '#7ccbe6', sky: '#d4eef3' });
  f.add(mc('s3b-shore', ({ add }) => {
    const r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(29);
    for (let i = 0; i < pts.length; i += 2) {
      const [x, z] = pts[i], L = Math.hypot(x, z) || 1, ix = x - x / L * .1, iz = z - z / L * .1;
      if (Math.hypot(x - 3.8, z - .3) < .9 || Math.hypot(x + .55, z - 3.5) < 1.1) continue;   // the jetty's foot and the lily cove
      if (i % 6 === 0) tuft(add, ix, iz, .85, '#5fae5a', '#86c96a');
      else if (i % 10 === 4) stone(add, x + x / L * .22, z + z / L * .22, .07 + r() * .05, i, '#e6dfd4', -.06, .5);
      else if (i % 14 === 8) daisy(add, ix, iz, .9);
    }
    // stepping stones: the shop's door to the jetty, and from the picnic down to the lily cove
    for (const [x, z, sz, a] of [[1.6, -1.1, .17, .3], [2.1, -.72, .16, 1.1], [2.6, -.38, .17, .5], [3.05, -.05, .15, 1.4], [.65, -.55, .16, .8], [.1, .05, .15, .2], [-.5, 1.7, .16, 1.0], [-.45, 2.25, .15, .4], [-.5, 2.8, .14, 1.3]])
      stone(add, x, z, sz, Math.round(x * 13 + z * 5) & 15, '#eae4da', -.045, .28, a);
    // the back rim: round bushes and flower clumps along the shore behind the tree and the shop, so the island reads lush, not bare
    const bushC = (x, z, s) => { for (const [dx, dz, rr, c] of [[0, 0, .3, '#62b262'], [.24, .08, .22, '#4fa55a'], [-.22, .1, .21, '#579f5a'], [.04, .22, .19, '#79c56b'], [-.05, -.16, .2, '#62b262']]) add(G.sph(rr * s, 14, 10), c, x + dx * s, rr * s * .85, z + dz * s, 0, 0, 0, [1, .88, 1]); };
    bushC(-3.0, -2.2, 1.0); bushC(-.55, -3.15, .85); bushC(2.75, -2.6, .9); bushC(-3.55, .25, .75);
    for (const [x, z, c] of [[-1.5, -2.85, '#ffffff'], [.55, -3.05, '#ffc6dc'], [2.0, -2.95, '#ffffff'], [-2.6, -2.7, '#ffe14d'], [3.35, -1.7, '#ffffff']]) for (let k = 0; k < 5; k++) { const a = k * 1.26 + x; daisy(add, x + Math.cos(a) * .13, z + Math.sin(a) * .1, .95, c, c === '#ffe14d' ? '#ffb300' : '#ffcf3a'); }
  }));
};

// ── 물가 연잎 (정본 '연못' 자리 — 3×3): 섬 쪽엔 매끈한 돌 몇 개와 납작 바위, 물 위엔 연잎 셋·연꽃·작은 잎 ─────────────────────────
// (판에서 남쪽 물가에 놓음: 이 조각의 -z가 섬 쪽)
B.s3b_cove = f => {
  const W = -.05;   // the lake's surface in this piece's frame (the island top is 0, the lake sits 7.5 cm under it)
  f.add(mc('s3b-cove', ({ add, tube }) => {
    for (const [x, z, s, k] of [[-1.25, -.95, .2, 2], [-.85, -1.1, .16, 5], [-.4, -1.18, .14, 7], [.3, -1.2, .13, 3], [.85, -1.08, .17, 9], [1.3, -.85, .15, 4]]) stone(add, x, z, s, k, undefined, -.05, .5);
    // the flat rock at the cove's corner (something can sit behind the boulders on it)
    add(G.rock(6, .12, 14, 10), '#cbc4ba', -1.15, -.06, -.55, 0, .4, 0, [.24, .08, .2]);
    stone(add, -1.38, -.35, .17, 8, '#cdc6bd', -.04, .7); stone(add, -.92, -.32, .12, 2, '#e3ddd5', -.04, .6);
    lily(add, -.5, .35, .16, 2.6, W + .006, '#58ad5c', '#7cc86c'); lotus(add, -.5, .35, 1, W + .03);
    lily(add, .15, .85, .1, 1.1, W + .004); lily(add, 1.15, .1, .12, 3.3, W + .004); lily(add, -.95, .7, .09, .2, W + .004);
    lotus(add, 1.15, .1, .7, W + .025, '#ffffff', '#fff2f6');
    cattails(add, tube, 1.35, -.6, .9, 7, 8);
  }));
  const pad = (x, z, r, rot) => {
    put(f.add(mc('s3b-lily|' + r + '|' + rot, ({ add }) => lily(add, 0, 0, r, rot, W + .008))), x, 0, z);
    f.spot('on', null, x, W + .035, z, { maxH: .28, label: '연잎 위', scale: .7, noDecoy: true });
  };
  pad(.45, -.4, .25, .4); pad(-.35, -.55, .21, 2.1); pad(.7, .45, .23, 4.4);
  f.spot('behind', null, -1.15, -.01, -.55, { maxH: .25, label: '연못가 돌 뒤', scale: .7 });
};

// ── 잔교 (정본 '낚시 좌대' 자리): 섬에서 물 위로 뻗은 판자 다리(+x), 끝에 낚싯대·릴·구명 튜브·작은 등, 물속 그물망이 감겨 올라옴 ───────
B.s3b_jetty = f => {
  const D = .82, Y = .16, X0 = -1.05, X1 = 2.25;
  f.add(mt('s3b-jetty-planks', TX.plank(), ({ add }) => {
    let k = 0; for (let x = X0 + .11; x < X1; x += .215, k++) add(G.box(.2, .05, D, .014), k % 3 === 1 ? WOODL : k % 3 === 2 ? shade(WOOD, -.05) : WOOD, x, Y, (k % 2 ? .012 : -.012), 0, (k % 5 - 2) * .012, 0, 1, { w: .45 });
  }));
  f.add(mc('s3b-jetty-frame', ({ add, tube }) => {
    for (const sz of [-1, 1]) add(G.box(X1 - X0 + .04, .06, .07, .015), WOODD, (X0 + X1) / 2, Y - .045, sz * (D / 2 - .04));
    for (const x of [X0 + .15, .2, 1.25, X1 - .08]) for (const sz of [-1, 1]) { const tall = x > 1 && sz > 0; add(G.cyl(.05, .055, Y + .5 + (tall ? .28 : 0), 10), WOODD, x, (Y + .5 + (tall ? .28 : 0)) / 2 - .5, sz * (D / 2 - .02)); }
    // a rope rail along the water side, on two tall posts
    for (const x of [1.25, X1 - .08]) { add(G.sph(.058, 10, 8), shade(WOODD, .1), x, Y + .28, D / 2 - .02, 0, 0, 0, [1, .55, 1]); add(G.tor(.06, .014, PI * 2, 6, 14), '#efe0c0', x, Y + .2, D / 2 - .02, HP, 0, 0); }
    tube([1.25, Y + .22, D / 2 - .02], [X1 - .08, Y + .22, D / 2 - .02], .012, '#efe0c0', 5);
    // a white-and-coral life ring hung on the rail post, a little lamp on the end post
    for (let k = 0; k < 8; k++) add(G.tor(.13, .045, PI / 4 + .02, 8, 6), k % 2 ? '#ff8f8a' : '#ffffff', 1.72, Y + .12, D / 2 + .06, 0, 0, k * PI / 4);
    add(G.cyl(.03, .03, .4, 8), WOODD, X1 - .08, Y + .48, -(D / 2 - .02)); add(G.box(.12, .14, .12, .03), '#fff4d6', X1 - .08, Y + .74, -(D / 2 - .02)); add(G.cone(.1, .08, 4), '#4fa9a0', X1 - .08, Y + .85, -(D / 2 - .02), 0, PI / 4, 0);
    // rod holder and the bamboo rod reaching out over the lake
    add(G.cyl(.04, .044, .42, 12), WOODD, 1.85, Y + .2, .12);
    const A = [1.85, Y + .38, .12], Bq = [2.95, Y + 1.25, .28];
    for (let k = 0; k < 5; k++) { const t0 = k / 5, t1 = (k + 1) / 5, p0 = A.map((v, i) => v + (Bq[i] - v) * t0), p1 = A.map((v, i) => v + (Bq[i] - v) * t1); tube(p0, p1, .016 - k * .002, k % 2 ? '#e9d48a' : '#dcc472', 6); }
    for (let k = 1; k < 5; k++) { const p = A.map((v, i) => v + (Bq[i] - v) * k / 5); add(G.sph(.019 - k * .002, 8, 6), '#c9a95a', ...p); }
    add(G.sph(.03, 8, 6), '#ff6a6a', ...Bq);
    // the round stool with a mint cushion, a little bait tin, a coiled rope
    add(G.cyl(.15, .15, .05, 18), WOODL, .7, Y + .2, -.1);
    for (const a of [0, 2.09, 4.19]) tube([.7 + Math.cos(a) * .11, Y + .02, -.1 + Math.sin(a) * .11], [.7 + Math.cos(a) * .08, Y + .2, -.1 + Math.sin(a) * .08], .018, WOODD, 6);
    add(G.cyl(.145, .15, .05, 18), '#8fdcc4', .7, Y + .25, -.1);
    add(G.cyl(.07, .07, .08, 14), '#e9edf2', 1.3, Y + .065, -.22); add(G.cyl(.072, .072, .02, 14), '#6fb6e6', 1.3, Y + .09, -.22);
    for (let k = 0; k < 4; k++) add(G.tor(.075 - k * .012, .016, PI * 2, 6, 18), '#e9d8b6', -.55, Y + .04 + k * .012, .22, HP, 0, 0);
  }));
  const reel = grp(); put(reel, 1.92, Y + .36, .12); f.add(reel);
  reel.add(mc('s3a-reel', ({ add }) => { add(G.cyl(.075, .075, .055, 18), '#ffcf3c', 0, 0, 0, 0, 0, HP); add(G.cyl(.04, .04, .06, 14), '#ffffff', 0, 0, 0, 0, 0, HP); add(G.box(.025, .11, .025, .008), '#5b6a8a', .04, -.05, 0); add(G.sph(.025, 8, 6), '#ff6a6a', .05, -.11, 0); }));
  const NET = { x: 2.95, z: .28 }, yLo = -.5, yHi = Y + .55;
  const net = grp(); put(net, NET.x, yLo, NET.z); f.add(net);
  net.add(mc('s3a-keepnet', ({ add, tube }) => {
    add(G.cyl(.2, .16, .04, 20), '#3f8f78', 0, 0, 0);
    for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; tube([Math.cos(a) * .16, 0, Math.sin(a) * .16], [Math.cos(a) * .2, .26, Math.sin(a) * .2], .006, '#3f8f78', 4); }
    for (const y of [.09, .18]) add(G.tor(.18 + y * .08, .006, PI * 2, 4, 24), '#3f8f78', 0, y, 0, HP, 0, 0);
    add(G.tor(.2, .018, PI * 2, 6, 24), '#ffcf3c', 0, .26, 0, HP, 0, 0);
    for (const [x, z] of [[.2, 0], [-.2, 0], [0, .2], [0, -.2]]) tube([x, .26, z], [0, .55, 0], .004, '#f2f2f6', 3);
  }));
  const line = grp(); put(line, NET.x, Y + 1.25, NET.z); f.add(line);
  line.add(mc('s3a-line', ({ add }) => add(G.cyl(.004, .004, 1, 4), '#f2f2f6', 0, -.5, 0)));
  const setLine = ny => { line.scale.y = Math.max(.05, Y + 1.25 - (ny + .55)); };
  setLine(yLo);
  const p = f.part('lift', [net, reel, line], (t, bN, bR) => {
    net.position.y = bN.p.y + (yHi - yLo) * t; net.rotation.y = t * 1.2;
    reel.rotation.x = -t * PI * 8; setLine(net.position.y);
  }, { label: '낚싯대 릴', sfx: 'swish', dur: .9 });
  f.spot('inside', net, 0, .05, 0, { part: p, maxH: .24, label: '물속 그물망', scale: .75 });
  f.spot('on', null, .7, Y + .29, -.1, { maxH: .3, label: '좌대 의자 위', scale: .7 });
  f.spot('under', null, -.62, .005, -.12, { maxH: .14, label: '좌대 밑', scale: .7 });
  f.collideBox = [X0, 0, -D / 2, X1, Y + .3, D / 2];
};

// ── 나룻배 (숨김 자리 없음): 잔교 옆에 매어 둔 민트 나룻배 — 흰 테, 나무 좌판 둘, 노 한 쌍, 잔교 기둥까지 밧줄 ─────────────────
B.s3b_boat = f => {
  f.noSolid = true; f.noOccupied = true;
  const hull = new THREE.SphereGeometry(1, 28, 12, 0, PI * 2, HP, HP);
  f.add(mc('s3b-boat', ({ add, tube }) => {
    add(hull, '#7fd6c8', 0, .02, 0, 0, 0, 0, [.95, .34, .42]);
    add(G.tor(1, .03, PI * 2, 6, 40), '#ffffff', 0, .02, 0, HP, 0, 0, [.95, .42, 1]);
    add(G.sph(.94, 24, 8, ), '#e8c08a', 0, -.055, 0, 0, 0, 0, [.92, .05, .39]);
    for (const x of [-.4, .35]) add(G.box(.16, .035, .74, .01), '#d9a466', x, .02, 0);
    tube([-.1, .08, .38], [.75, -.06, .62], .016, WOODD, 6); add(G.box(.2, .015, .07, .01), WOODD, .82, -.07, .65, 0, -.35, 0);
    tube([-.1, .08, -.38], [.55, .05, -.55], .016, WOODD, 6); add(G.box(.2, .015, .07, .01), WOODD, .62, .05, -.58, 0, .3, 0);
    tube([-.9, .06, 0], [-1.55, .14, -.25], .01, '#efe0c0', 5);
    add(G.sph(.06, 10, 8), '#ffcf3c', .1, .07, .1);
  }));
  f.group.children.at(-1).rotation.z = .03;
};

// ── 나무 (판의 얼굴): 크고 둥근 잎 덩어리, 굵은 가지에 매단 그네, 크림 새집(지붕 들림), 밑동 구멍 ─────────────────────────────
B.s3b_tree = f => {
  f.collideBox = [-.3, 0, -.3, .3, 1.8, .3];
  f.add(mt('s3b-tree-trunk', TX.bark(), ({ add, tube }) => {
    add(G.cyl(.19, .28, 1.75, 18), '#a8734a', 0, .87, 0, 0, 0, .02, 1, .25);
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + .3; tube([Math.sin(a) * .12, .3, Math.cos(a) * .12], [Math.sin(a) * .46, .02, Math.cos(a) * .46], .1, '#9c6a43', 10, .04); }
    tube([.02, 1.45, 0], [-.5, 2.05, .12], .1, '#a8734a', 10, .06); tube([.02, 1.5, 0], [.45, 2.15, -.15], .095, '#a8734a', 10, .055);
    tube([.05, 1.35, .05], [.95, 1.62, .28], .07, '#a8734a', 10, .045);
  }));
  f.add(mc('s3b-tree-hollow', ({ add }) => { add(G.sph(.13, 14, 10), '#3d2a2a', 0, .15, .22, 0, 0, 0, [1, 1.3, .4]); add(G.tor(.13, .028, PI * 2, 6, 18), '#8a5a38', 0, .15, .225, 0, 0, 0, [1, 1.3, 1]); }));
  f.spot('behind', null, 0, 0, .4, { maxH: .25, label: '나무 밑동', scale: .7 });
  f.add(mc('s3b-tree-crown', ({ add }) => crown(add, .05, 2.42, 0, .98, '#6fc46a', '#54ab5c', '#a2dc80', 7, { n: 20, c: ['#ffd1df', '#ffffff', '#ffc1d4'] })));
  // the swing on the long branch
  f.add(mc('s3b-swing', ({ add, tube }) => { for (const z of [.12, .44]) tube([.85, 1.6, z], [.85, .42, z], .009, '#efe0c0', 4); add(G.box(.2, .035, .44, .012), '#ff9f8a', .85, .41, .28); }));
  const hx = 0, hy = .78, hz = .31;
  f.add(mc('s3a-birdhouse', ({ add }) => {
    add(G.box(.22, .025, .2, .006), '#fff3dc', hx, hy - .1, hz);
    add(G.box(.22, .22, .025, .006), '#fff3dc', hx, hy, hz - .09);
    for (const sx of [-1, 1]) add(G.box(.025, .22, .2, .006), '#fff3dc', hx + sx * .1, hy, hz);
    add(G.box(.22, .05, .025, .006), '#fff3dc', hx, hy - .075, hz + .09); add(G.box(.22, .045, .025, .006), '#fff3dc', hx, hy + .085, hz + .09);
    add(G.cyl(.011, .011, .08, 6), '#a8734a', hx, hy - .07, hz + .13, HP);
    add(G.box(.06, .3, .03, .008), '#a8734a', hx, hy - .2, hz - .12);
    add(G.sph(.016, 8, 6), '#7fc8a8', hx - .07, hy + .085, hz + .105); add(G.sph(.016, 8, 6), '#ffb6c8', hx + .07, hy + .085, hz + .105);
  }));
  const roof = grp(mc('s3a-bh-roof', ({ add }) => { add(G.box(.16, .028, .26, .01), '#ff8a7a', -.06, .03, 0, 0, 0, .62); add(G.box(.16, .028, .26, .01), '#ff8a7a', .06, .03, 0, 0, 0, -.62); add(G.sph(.022, 8, 6), '#ffffff', 0, .085, 0); }));
  put(roof, hx, hy + .11, hz); f.add(roof);
  const p = f.part('lift', roof, (t, b) => { roof.position.y = b.p.y + .2 * t; roof.position.x = b.p.x + .12 * t; roof.rotation.z = -.5 * t; }, { label: '새집 지붕', sfx: 'lift' });
  f.spot('inside', null, hx, hy - .08, hz, { part: p, maxH: .18, label: '새집 안', scale: .55 });
  f.spot('behind', null, 0, 0, -.42, { maxH: .45, label: '나무 뒤', scale: .85 });
};

// ── 미끼 가게 (정본 '낚시터 간판' 자리): 크림 판자 오두막에 민트·흰 줄무늬 차양, 미끼 병이 놓인 계산대, 지붕 위 물고기 풍향계;
// 옆에 서 있는 물고기 간판(간판 뒤·간판 위)
const awningTex = () => paintTex('s3b-awning', 256, 64, (c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#ffffff' : '#5fc4ae'; c.fillRect(k * w / 8, 0, w / 8 + 1, h); } c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(0, h - 10, w, 10); });
const fishBoardTex = () => paintTex('s3b-fishboard', 512, 256, (c, w, h) => {
  c.fillStyle = '#fff6e4'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffb36b'; c.beginPath(); c.ellipse(250, 128, 120, 64, 0, 0, PI * 2); c.fill();
  c.beginPath(); c.moveTo(140, 128); c.lineTo(68, 70); c.quadraticCurveTo(92, 128, 68, 186); c.closePath(); c.fill();
  c.fillStyle = '#ffd6a8'; c.beginPath(); c.ellipse(262, 146, 80, 28, 0, 0, PI * 2); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(318, 110, 17, 0, PI * 2); c.fill(); c.fillStyle = '#2a1d33'; c.beginPath(); c.arc(322, 110, 9, 0, PI * 2); c.fill();
  c.strokeStyle = '#2a1d33'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.arc(336, 142, 13, .2, 1.4); c.stroke();
  c.strokeStyle = '#7fc6ef'; c.lineWidth = 9; for (const y of [222, 240]) { c.beginPath(); for (let x = 30; x <= w - 30; x += 6) { const yy = y + Math.sin(x / 24 + y) * 6; x === 30 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
  c.strokeStyle = '#8a95a8'; c.lineWidth = 6; c.beginPath(); c.moveTo(420, 30); c.lineTo(420, 120); c.arc(406, 120, 14, 0, PI * .9); c.stroke();
});
B.s3b_shop = f => {
  f.collideBox = [-.75, 0, -.85, .75, 1.6, .2];
  const SZ = -.4;   // the hut's middle (it stands at the back of its cell; the counter faces +z)
  f.add(mt('s3b-shop-walls', TX.plank(), ({ add }) => {
    add(G.box(1.36, 1.02, .82, .03), '#fff4e2', 0, .51, SZ, 0, 0, 0, 1, { w: .55 });
    add(G.box(1.42, .08, .88, .02), '#e9d6b8', 0, .04, SZ, 0, 0, 0, 1, { w: .55 });
  }));
  f.add(mc('s3b-shop', ({ add, tube }) => {
    // the counter window: a dark opening with a shelf of bait jars, a little counter board
    add(G.box(.92, .42, .04, .01), '#6b4f42', 0, .7, SZ + .41);
    for (const [x, c] of [[-.3, '#ffcf7a'], [-.1, '#9fdcc4'], [.1, '#ffb3c6'], [.3, '#a9c8ff']]) { add(G.cyl(.055, .055, .12, 12), mix(c, '#ffffff', .3), x, .6, SZ + .36); add(G.cyl(.058, .058, .03, 12), c, x, .675, SZ + .36); }
    add(G.box(1.06, .05, .26, .015), WOOD, 0, .5, SZ + .52);
    for (const sx of [-1, 1]) add(G.box(.05, .5, .05, .01), WOODD, sx * .5, .25, SZ + .6);
    // the roof: two pale-coral slopes, a ridge, a fish weathervane
    // the gable fills the wall up to the ridge, two thick coral slopes overhang it all round, a darker ridge cap
    for (const sz of [-1, 1]) add(G.ext((() => { const s = new THREE.Shape(); s.moveTo(-.68, 0); s.lineTo(0, .32); s.lineTo(.68, 0); s.closePath(); return s; })(), .82, 0), '#fff4e2', 0, 1.02, SZ - .41);
    for (const sx of [-1, 1]) add(G.box(.86, .07, 1.06, .025), '#ff9f8a', sx * .37, 1.19, SZ, 0, 0, -sx * .44);
    add(G.cyl(.05, .05, 1.08, 10), '#e9786a', 0, 1.37, SZ, HP, 0, 0);
    tube([0, 1.4, SZ - .2], [0, 1.66, SZ - .2], .012, '#8a95a8', 5); add(G.sph(.05, 10, 8), '#ffb36b', .02, 1.66, SZ - .2, 0, 0, 0, [1.6, .8, .4]); add(G.cone(.04, .07, 3), '#ffb36b', -.08, 1.66, SZ - .2, 0, 0, HP, [1, 1, .4]);
    // a little round window on the side, a potted fern, a crate of floats by the door
    add(G.cyl(.1, .1, .02, 16), '#bfe6f6', .69, .7, SZ, 0, 0, HP); add(G.tor(.1, .02, PI * 2, 6, 16), '#ffffff', .69, .7, SZ, 0, HP, 0);
    add(G.cyl(.09, .07, .14, 12), '#e9845a', -.82, .07, SZ + .3); for (let k = 0; k < 6; k++) { const a = k * 1.05; add(G.sph(.08, 8, 6), k % 2 ? '#5fae5a' : '#79c26a', -.82 + Math.cos(a) * .06, .2, SZ + .3 + Math.sin(a) * .06, 0, -a, .7, [1.4, .45, .7]); }
    add(G.box(.3, .16, .22, .015), WOODL, .78, .08, SZ + .35); for (const [x, c] of [[.7, '#ff6a6a'], [.79, '#ffffff'], [.87, '#ffcf3c']]) add(G.sph(.04, 8, 6), c, x, .18, SZ + .35);
  }));
  // the awning over the counter (striped cloth)
  const aw = new THREE.Mesh(new THREE.BoxGeometry(1.2, .02, .4), texMat(awningTex())); aw.position.set(0, .9, SZ + .6); aw.rotation.x = .38; f.add(aw);
  f.add(mc('s3b-awning-edge', ({ add }) => { for (let k = 0; k < 8; k++) add(G.sph(.075, 10, 6), k % 2 ? '#ffffff' : '#5fc4ae', -.525 + k * .15, .82, SZ + .79, 0, 0, 0, [1, .5, .4]); }));
  // the standing fish sign beside the counter (the old sign's two places)
  const SX = .62, SZz = .3;
  f.add(mc('s3b-sign', ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.05, .7, .05, .015), WOODD, SX + sx * .2, .35, SZz);
    add(G.box(.54, .3, .04, .02), WOOD, SX, .58, SZz + .01); add(G.box(.58, .035, .06, .012), WOODD, SX, .745, SZz + .01);
    tuft(add, SX + .25, SZz + .1, .8); daisy(add, SX - .24, SZz + .12, .85);
  }));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(.5, .26), texMat(fishBoardTex())); board.position.set(SX, .58, SZz + .033); f.add(board);
  f.spot('behind', null, SX, 0, SZz - .2, { maxH: .3, label: '간판 뒤', scale: .7 });
  f.spot('on', null, SX, .765, SZz + .01, { maxH: .2, label: '간판 위', scale: .55 });
};

// ── 호수의 작은 생활 (숨김 자리 없음): 연잎 무리, 작은 부표, 잠자리 하나, 나비 둘 ────────────────────────────────────────────
B.s3b_lakelife = f => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];   // (lilies and flies far out are no obstacle to a lid — 10/24)
  const W = -.07;
  const m = mc('s3b-lakelife', ({ add, tube }) => {
    for (const [x, z, n, s] of [[-4.4, -1.1, 4, 1], [-2.5, 4.3, 3, .9], [4.8, -2.4, 3, .9], [2.4, 4.2, 3, .8]]) for (let k = 0; k < n; k++) { const a = k * 2.3 + x; lily(add, x + Math.cos(a) * .32 * s, z + Math.sin(a) * .26 * s, (.12 + (k % 3) * .04) * s, a, W); if (k === 1) lotus(add, x + Math.cos(a) * .32 * s, z + Math.sin(a) * .26 * s, .7, W + .02, k % 2 ? '#ffffff' : '#ffc6d6', '#fff2f6'); }
    add(G.sph(.12, 14, 10), '#ff8f8a', 5.7, W + .02, 2.2, 0, 0, 0, [1, .9, 1]); add(G.cyl(.125, .125, .05, 14), '#ffffff', 5.7, W + .05, 2.2); add(G.cyl(.012, .012, .2, 5), '#8a95a8', 5.7, W + .2, 2.2);
    dragonfly(add, -1.0, .8, 4.0, .5); butterfly(add, -1.8, .75, -.5, '#ffd3e4', .3, .9); butterfly(add, 1.4, .9, 2.2, '#fff2a8', 2.0, .85);
  });
  f.add(scenery(m));
};

export const S3B_BUILDERS = B;
export const S3B_INFO = {
  s3b_island: { w: 1, d: 1, name: '호수 섬', price: 0, hidden: true },
  s3b_boat: { w: 1, d: 1, name: '나룻배', price: 0, hidden: true },
  s3b_lakelife: { w: 1, d: 1, name: '호수', price: 0, hidden: true },
};

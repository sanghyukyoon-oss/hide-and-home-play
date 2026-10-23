// 27판 '벚꽃마을역' station4 (⑧ 10/24 — 사용자 "역도… 완전 새롭게 다시. 완전 디테일하고 좋아 보이게", 허브가 블록아웃 A를 고름).
// 일본 동네 무인역 하나: 선로 한 줄이 앞을 가로지르고, 단식 승강장 뒤에 나무 역사(갈색 판자·흰 회벽·청회색 기와 박공지붕·창살),
// 오른쪽 찻길 건널목, 벚나무 한 그루, 앞 잔디 띠에 꽃밭·자전거 거치대·역 이름판. 큰 면은 순하게, 쨍한 색은 작은 것에만
// (빨간 우체통·자판기·건널목 노랑검정·벚꽃 분홍·파스텔 전철). 섬 받침은 pc-kit island(두께 있는 층진 둥근 섬).
// 연출이 찾는 옛 type은 그대로 두고 opts.gptHero로 이 파일의 빌더를 끼움(staging·HAT_KEY·HAT_LAND 표가 그대로 맞음):
//   train ← s4_train (f.car · f.doors +z, 선로는 s4_land) · crossing ← s4_crossing (f.arm = part.crossing, f.ringing 등 깜빡)
//   platshelter ← s4_shelter (모자가 얹히는 지붕) · tripbag ← s4_tripbag · suitcases ← s4_cart (짐 카트 — 모자·열쇠가 내려앉는 짐, HAT_LAND)
//   coinlocker ← s4_locker (pad 자물쇠 문) · ticketoffice (새 type — HAT_KEY 27 code 목록의 이름; 창구 서랍 code 자물쇠)
// 시간표는 틀만(숫자 X — 단서 시간표는 obslock.js가 놓음).
import * as THREE from 'three';
import { grp, put, mat, plane, canvasTex, texCache } from './kit.js';
import { G, mc, mt, TX, HP, island, blobOutline, tuft, flower, bush } from './pc-kit.js';
import { textTex, fitText, FONT } from './gpt-paper.js';
import { addI18n, tr } from '../i18n.js';

addI18n({ '벚꽃마을역': 'Sakura Town', '벚꽃마을': 'Sakura Town', '몽글동': 'Mongle-dong', '바닷가': 'Seaside', '노선도': 'Route map', '시간표': 'Timetable',
  '역사 처마 밑': 'Under the station eaves', '문 옆 화분': 'By the door plant', '창구 서랍': 'Ticket drawer', '창구 서랍 안': 'In the ticket drawer', '창구 선반': 'Ticket window ledge',
  '물품 보관함': 'Coin lockers', '물품 보관함 안': 'In the coin locker', '물품 보관함 위': 'On the coin lockers', '승강장 의자 밑': 'Under the platform bench', '승강장 의자 위': 'On the platform bench',
  '승강장 지붕 위': 'On the platform roof', '낚시 가방': 'Fishing bag', '낚시 가방 안': 'In the fishing bag', '낚시 가방 옆': 'By the fishing bag', '여행 가방': 'Suitcase',
  '여행 가방 위': 'On the suitcase', '여행 가방 옆': 'By the suitcase', '자판기 옆': 'Beside the vending machine', '자판기 위': 'On the vending machine', '우체통 뒤': 'Behind the postbox',
  '벚나무 뿌리 사이': 'Between the cherry roots', '벚나무 밑': 'Under the cherry tree', '전봇대 밑': 'At the foot of the pole', '역 이름판 밑': 'Under the station sign',
  '자전거 바구니': 'Bike basket', '자전거 옆': 'By the bikes', '개찰기 옆': 'By the ticket gate', '꽃밭 속': 'In the flower bed', '울타리 밑': 'Under the fence',
  '선로 옆': 'Beside the track', '쓰레기통 옆': 'By the bins', '쓰레기통 위': 'On the bins', '짐 카트 위': 'On the luggage cart', '짐 카트 옆': 'By the luggage cart', '◀ 몽글동': '◀ Mongle-dong', '바닷가 ▶': 'Seaside ▶', '차단기 아래': 'Under the crossing gate', '건널목 차단기': 'Crossing gate', '파스텔 전철': 'Pastel train' });

const C = {
  grass: '#a9d888', lip: '#93cc74', ballast: '#bfb8af', sleeper: '#8a6a52', rail: '#9aa0ae', asphalt: '#9a9ea8', line: '#ffffff', kerb: '#e3ded6', pave: '#e6dfd3',
  plinth: '#cfc8bd', siding: '#b58257', post: '#6b4a33', plaster: '#f8f6f1', roof: '#66748f', roofD: '#525e78', glass: '#3d4b70', glass2: '#a9d2f0',
  strip: '#f2c94c', white: '#ffffff', dark: '#3a3048', yel: '#ffd23f', red: '#e8473f', blue: '#4a8fd8', pink: '#ffcadb', pink2: '#ffa6c6', pink3: '#ffe0ea',
  bark: '#8b5e4a', cream: '#fbf6ee', mint: '#9ed8c4', mintD: '#6fbfa6', steel: '#c9cdd6', steel2: '#8f97ab', pole: '#c9c7c2', wire: '#3a3048',
  earth: '#a07a58', band: '#cfc4b6', earthD: '#8a6648', fence: '#f4efe6', wood: '#d9a466', woodD: '#a8733f',
};
export const PY = .37;

// ── greyscale textures: kawara roof rows, a fine window lattice look ─────────────────────────────────────────────
const TEXC = texCache();
const gtex = (key, N, draw) => TEXC.get('s4|' + key, () => { const t = canvasTex(N, N, (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); draw(x, w, h); }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t; });
// rows along u (the ridge), each row's tiles rounded at the lower edge
const kawara = () => gtex('kawara', 128, (x, w, h) => {
  const rows = 4, rh = h / rows, cols = 6, cw = w / cols;
  for (let r = 0; r < rows; r++) {
    x.fillStyle = 'rgba(30,35,60,.35)'; x.fillRect(0, r * rh + rh - 4, w, 4);
    for (let c = 0; c < cols; c++) { const cx = c * cw + (r % 2) * cw / 2; x.strokeStyle = 'rgba(30,35,60,.28)'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(cx, r * rh + 2); x.lineTo(cx, r * rh + rh - 4); x.stroke();
      x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(cx + 4, r * rh + 4, cw * .35, 3); }
  }
});

// a gable roof, ridge along x, printed with kawara: two thick sloped panels, the gable prism under them, a ridge with end tiles
function gableRoof(f, key, x, y, z, L, D, h, over = .3) {
  const hd = D / 2 + over, ph = Math.atan2(h, D / 2), s = hd / Math.cos(ph), t = .1;
  f.add(mt(key + '-tiles', kawara(), ({ add }) => {
    for (const k of [1, -1]) add(G.box(L + over * 2, t, s, .03), C.roof, x, y + h - (hd / 2) * Math.tan(ph) + .03, z + k * hd / 2, k * ph, 0, 0, 1, { w: .55 });
  }));
  f.add(mc(key + '-ridge', ({ add }) => {
    const sh = new THREE.Shape(); sh.moveTo(-D / 2, 0); sh.lineTo(D / 2, 0); sh.lineTo(0, h); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false }); g.translate(0, 0, -L / 2); g.rotateY(HP);
    add(g, C.plaster, x, y, z);
    add(G.box(L + over * 2 + .06, .12, .16, .05), C.roofD, x, y + h + .06, z);
    for (const sx of [-1, 1]) add(G.box(.14, .22, .2, .05), C.roofD, x + sx * (L / 2 + over + .02), y + h + .1, z);
    // the barge boards along the gable ends
    for (const sx of [-1, 1]) for (const k of [1, -1]) add(G.box(.06, .08, s, .02), C.post, x + sx * (L / 2 + over - .01), y + h - (hd / 2) * Math.tan(ph) - .02, z + k * hd / 2, k * ph, 0, 0);
  }));
}
// a lettering board (plane, front +z)
function board(f, w, h, px, draw, x, y, z, ry = 0) {
  const tex = textTex(px, Math.round(px * h / w), draw);
  const m = plane(w, h, mat('#ffffff', { map: tex, rim: 0 })); put(m, x, y, z, 0, ry, 0); f.add(m); return m;
}
const B = {};

// ── the island: grass, the track bed and rails, the road, the platform's edge lines, waiting marks, the front bank, wires, petals ──
// (마지막 패스 10/24 허브: 앞뒤로 긴 섬 — 선로가 화면을 대각선으로 지나고 승강장이 그 옆으로 길게; 카메라는 승강장 가까이)
const OUT = blobOutline(5, 3.5, { pad: .7, round: 2.0, amp: .14, seed: 27 });
// the track along x at z TZ; the road along z at x 3.55..4.85; the platform x -5..3, z -1.5..0.5
export const TZ = 1.05;
export const POLES = [[5.05, -2.45], [3.2, 3.6]];
const RX0 = 3.55, RX1 = 4.85, RXC = (RX0 + RX1) / 2;
B.s4_land = f => {
  island(f, { key: 's4-land2', pts: OUT, top: C.grass, lip: C.lip, seed: 27,
    layers: [{ h: .2, color: C.earth, k: 0 }, { h: .3, color: C.band, k: -.03, stones: true }, { h: .26, color: C.earthD, k: -.13 }],
    pebble: '#e6ddd0', skip: [[RXC, -4.1, .9], [RXC, 4.1, .9]],
    decorTex: ({ add }) => {
      add(G.slab([[-5.6, TZ - .55], [5.6, TZ - .55], [5.6, TZ + .62], [-5.6, TZ + .62]], .014, 0), C.ballast, 0, .002, 0, 0, 0, 0, 1, { w: .45 });
      add(G.slab([[RX0, -4.15], [RX1, -4.15], [RX1, 4.15], [RX0, 4.15]], .02, 0), C.asphalt, 0, .004, 0, 0, 0, 0, 1, { w: .6 });
      // the paving by the bikes
      add(G.slab([[-4.6, 2.25], [-2.5, 2.25], [-2.5, 3.45], [-4.6, 3.45]], .012, 0), C.pave, 0, .003, 0, 0, 0, 0, 1, { w: .5 });
    },
    decorTexMap: TX.stone(),
    decor: ({ add, tube }) => {
      // sleepers and rails, the length of the island
      for (let s = -5.5; s < 5.6; s += .42) add(G.box(.14, .045, .9, .008), C.sleeper, s, .035, TZ);
      for (const k of [-.33, .33]) { tube([-5.65, .09, TZ + k], [5.65, .09, TZ + k], .032, C.rail, 6); tube([-5.65, .125, TZ + k], [5.65, .125, TZ + k], .02, '#d7dbe3', 6); }
      // the crossing: rubber boards between and beside the rails, the road's white lines and kerbs
      add(G.box(1.3, .05, 1.15, .012), '#6f6a66', RXC, .03, TZ);
      for (let k = -2; k <= 2; k++) add(G.box(.02, .052, 1.1, .004), '#5b5652', RXC + k * .26, .031, TZ);
      for (let z = -3.8; z < 4.0; z += .85) if (Math.abs(z + .2 - TZ) > .8) add(G.box(.07, .006, .45, .002), C.line, RXC, .026, z + .2);
      for (const x of [RX0 - .05, RX1 + .05]) for (const [z0, z1] of [[-4.0, TZ - .7], [TZ + .7, 4.0]]) add(G.box(.1, .08, z1 - z0, .02), C.kerb, x, .04, (z0 + z1) / 2);
      // the platform's edge: the white line and the yellow dotted tactile strip (on the raised platform)
      add(G.box(8.0, .012, .05, .004), C.white, -1, PY + .006, .38);
      add(G.box(8.0, .012, .26, .006), C.strip, -1, PY + .006, .14);
      for (let x = -4.92; x < 2.95; x += .14) for (const z of [.07, .21]) add(G.cyl(.018, .018, .012, 6), '#e7b93a', x, PY + .016, z);
      // the waiting marks (대기선) where the train's doors stop: two white bars and a green arrow each
      for (const x of [-1.95, .15]) {
        for (const s of [-1, 1]) add(G.box(.05, .008, .5, .003), C.white, x + s * .32, PY + .007, -.25);
        add(G.box(.42, .008, .05, .003), C.white, x, PY + .007, -.52);
        add(G.cone(.09, .16, 3), '#5fae8a', x, PY + .01, -.12, -HP, 0, 0, [1, 1, .1]);
      }
      // the low wooden fence between the track and the front bank (a gap for the crossing), hydrangeas and a flower bed behind it
      for (let x = -5.2; x < 3.05; x += .45) add(G.box(.06, .48, .06, .015), C.fence, x, .24, TZ + .82);
      for (const y of [.18, .38]) add(G.box(8.3, .04, .03, .01), C.fence, -1.05, y, TZ + .82);
      add(G.box(3.2, .14, .55, .03), C.woodD, -.4, .07, TZ + 1.4);
      add(G.box(3.1, .03, .48, .02), '#8b6a4e', -.4, .145, TZ + 1.4);
      for (let k = 0; k < 14; k++) flower(add, -1.85 + k * .22, TZ + 1.3 + (k % 2) * .18, ['#ffffff', '#ffd23f', '#ffb3cf', '#b9a6ff'][k % 4], 1.1, .14);
      bush(add, -2.3, TZ + 1.45, .55, '#a9b8f0', '#8f9fe0'); bush(add, 1.5, TZ + 1.45, .5, '#c9b0ea', '#b49ce0'); bush(add, -5.0, TZ + 1.5, .5, '#7cc46a', '#5fae5a');
      // the overhead wires between the two poles (they run on past the island's edge)
      const [p, q] = POLES;
      const dl = Math.hypot(q[0] - p[0], q[1] - p[1]), ux = (q[0] - p[0]) / dl * 1.4, uz = (q[1] - p[1]) / dl * 1.4;
      for (const dy of [3.08, 2.88]) tube([p[0] - ux, dy, p[1] - uz], [q[0], dy, q[1]], .008, C.wire, 4);
      // fallen petals: round the tree and over the platform under it (not many)
      const pet = [[.2, -2.0], [.9, -2.2], [1.6, -1.9], [2.2, -2.3], [-.4, -2.2], [1.2, -3.0], [.5, -.9], [1.1, -.4], [-.3, -.6], [1.9, -.8], [2.6, -.2], [-.9, -.3], [.3, .1], [2.2, .2], [-1.4, -.9], [1.5, .3]];
      pet.forEach(([x, z], i) => add(G.cyl(.04, .04, .005, 6), i % 3 ? C.pink : C.pink2, x, (x < 3 && z > -1.5 ? PY : 0) + .01, z, 0, i, 0, [1, 1, .7]));
      for (const [x, z] of [[-4.6, 3.7], [2.6, 3.6], [-1.0, 3.8], [5.3, -3.2], [-5.3, -2.6]]) tuft(add, x, z, 1);
    } });
  // a couple of places in the front bed
  f.spot('in', null, -1.1, .14, TZ + 1.42, { maxH: .22, label: '꽃밭 속', scale: .55 });
  f.spot('in', null, .5, .14, TZ + 1.38, { maxH: .22, label: '꽃밭 속', scale: .55 });
  f.spot('beside', null, -3.9, 0, TZ + 1.05, { maxH: .3, label: '울타리 밑', scale: .55 });
  f.walkSolids = [[-5.25, 0, TZ + .78, 3.1, .5, TZ + .86], [-2.0, 0, TZ + 1.1, 1.2, .2, TZ + 1.7]];
};

// ── the station house: plank skirt, white plaster, kawara gable roof; door, latticed window, the station's name, the route
// map and an empty timetable frame on the wall (the ticket window is its own piece, left of the door)
B.s4_station = f => {
  const W = 3.4, D = 2.0, H = 1.95, y0 = .12, zf = D / 2, dx = .45, wx = 1.22;
  f.add(mt('s4-st2-planks', TX.plank(), ({ add }) => {
    add(G.box(W, .8, D, .02), C.siding, 0, y0 + .4, 0, 0, 0, 0, 1, { w: .3 });
  }));
  f.add(mc('s4-st2-body', ({ add }) => {
    add(G.box(W + .16, .12, D + .16, .02), C.plinth, 0, .06, 0);
    add(G.box(W - .02, H - .8, D - .02, .02), C.plaster, 0, y0 + .8 + (H - .8) / 2, 0);
    add(G.box(W + .04, .08, D + .04, .02), C.post, 0, y0 + .82, 0);
    add(G.box(W + .04, .09, D + .04, .02), C.post, 0, y0 + H - .02, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.13, H, .13, .02), C.post, sx * (W / 2 - .02), y0 + H / 2, sz * (D / 2 - .02));
    // the doorway: a sliding glass door in a dark frame, its lattice
    add(G.box(.9, 1.4, .05, .02), C.post, dx, y0 + .7, zf + .01);
    add(G.box(.8, 1.3, .02, .01), C.glass2, dx, y0 + .67, zf + .03);
    for (const u of [-.2, 0, .2]) add(G.box(.025, 1.3, .02, .005), C.post, dx + u, y0 + .67, zf + .04);
    for (const v of [.33, .67, 1.0]) add(G.box(.8, .025, .02, .005), C.post, dx, y0 + v, zf + .04);
    // a latticed window (right)
    add(G.box(.62, .6, .05, .02), C.post, wx, y0 + 1.22, zf + .01); add(G.box(.54, .52, .02, .01), C.glass, wx, y0 + 1.22, zf + .03);
    for (const u of [-.13, 0, .13]) add(G.box(.02, .52, .02, .005), C.white, wx + u, y0 + 1.22, zf + .045);
    add(G.box(.54, .02, .02, .005), C.white, wx, y0 + 1.22, zf + .045);
    // the timetable frame (empty — the clue one is set by the stage) left of the door, the route map on the east wall
    add(G.box(.46, .44, .04, .02), C.post, -.42, 1.22, zf + .02);
    add(G.box(.04, .36, .68, .02), C.post, W / 2 + .02, 1.3, .3);
    // a potted plant by the door
    add(G.cyl(.15, .12, .26, 12), '#d98b5f', dx + .62, PY + .13, zf + .3);
    for (let k = 0; k < 6; k++) add(G.sph(.12, 8, 6), k % 2 ? '#6cbf5a' : '#4fa64f', dx + .62 + Math.cos(k * 1.1) * .08, PY + .36 + (k % 2) * .07, zf + .3 + Math.sin(k * 1.1) * .07);
  }));
  gableRoof(f, 's4-st2', 0, y0 + H, 0, W, D, .85, .34);
  // the station's name over the eave: 벚꽃마을역 / Sakura Town
  board(f, 1.7, .4, 640, (c, w, h) => {
    c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#6b4a33'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
    fitText(c, '벚꽃마을역', w / 2, h * .4, w * .82, h * .46, '#3a3048');
    const other = tr('벚꽃마을역') === '벚꽃마을역' ? 'Sakura Town' : '벚꽃마을역';
    c.font = FONT(Math.round(h * .2)); c.fillStyle = '#6b6478'; c.textAlign = 'center'; c.fillText(other, w / 2, h * .8, w * .8);
  }, .1, y0 + H + .32, zf + .38, 0).rotation.x = -.2;
  // the route map: one green line, five stops, ours in red
  board(f, .62, .3, 256, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    fitText(c, '노선도', w / 2, h * .2, w * .8, h * .2, '#3a3048');
    c.strokeStyle = '#5fae8a'; c.lineWidth = 5; c.beginPath(); c.moveTo(w * .1, h * .62); c.lineTo(w * .9, h * .62); c.stroke();
    for (let k = 0; k < 5; k++) { c.fillStyle = k === 2 ? '#e8473f' : '#ffffff'; c.strokeStyle = '#3a3048'; c.lineWidth = 2; c.beginPath(); c.arc(w * (.1 + k * .2), h * .62, 6, 0, 7); c.fill(); c.stroke(); }
  }, W / 2 + .045, 1.3, .3, HP);
  // the empty timetable frame
  board(f, .4, .38, 128, (c, w, h) => {
    c.fillStyle = '#fffdf6'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a5f8a'; c.fillRect(0, 0, w, h * .2);
    c.strokeStyle = 'rgba(58,48,72,.25)'; c.lineWidth = 1; for (let r = 1; r < 5; r++) { c.beginPath(); c.moveTo(w * .08, h * (.2 + r * .16)); c.lineTo(w * .92, h * (.2 + r * .16)); c.stroke(); }
  }, -.42, 1.22, zf + .045, 0);
  f.spot('beside', null, -W / 2 + .1, PY, zf + .4, { maxH: .4, label: '역사 처마 밑', scale: .7 });
  f.spot('beside', null, wx + .2, PY, zf + .3, { maxH: .4, label: '역사 처마 밑', scale: .7 });
  f.spot('beside', null, dx + .62, PY, zf + .62, { maxH: .3, label: '문 옆 화분', scale: .6 });
  f.walkSolids = [[-W / 2 - .08, 0, -D / 2 - .08, W / 2 + .08, 2.9, D / 2 + .08]];
  // (doors next to it swing by its walls, not by the box round its eaves and name board — room.js fitParts)
  f.collideBox = [-W / 2 - .08, 0, -D / 2 - .08, W / 2 + .08, y0 + H, D / 2 + .08];
};

// ── the ticket window (type ticketoffice — HAT_KEY 27 'code'): a window in the station's wall, a ledge, and under the ledge
// a hollow wooden cupboard whose door takes the code lock (the timetable's ★ time opens it)
B.ticketoffice = f => {
  const CW = .8, CH = .62, CD = .34, y0 = .14;
  f.add(mc('s4-ticket', ({ add }) => {
    add(G.box(.86, .62, .06, .02), C.post, 0, 1.12, 0);
    add(G.box(.76, .5, .02, .01), C.glass2, 0, 1.13, .03);
    add(G.box(.76, .1, .025, .01), C.white, 0, 1.43, .035);
    add(G.cyl(.09, .09, .02, 14), C.dark, 0, .93, .035, HP, 0, 0);
    add(G.box(.92, .05, CD + .06, .015), C.wood, 0, y0 + CH + .025, CD / 2);
    // the cupboard: back, sides, floor — open at the front for the door
    add(G.pbox(CW, CH, .03), C.woodD, 0, y0 + CH / 2, .015);
    for (const s of [-1, 1]) add(G.pbox(.03, CH, CD), C.woodD, s * (CW / 2 - .015), y0 + CH / 2, CD / 2);
    add(G.pbox(CW, .03, CD), C.woodD, 0, y0 + .015, CD / 2); add(G.box(CW + .04, y0, CD + .04, .02), C.plinth, 0, y0 / 2, CD / 2);
    add(G.sph(.045, 10, 6), C.yel, .3, y0 + CH + .07, CD / 2, 0, 0, 0, [1, .7, 1]); add(G.cyl(.04, .035, .08, 10), '#5fa8e8', -.32, y0 + CH + .09, CD / 2);
  }));
  const dv = grp(); put(dv, -CW / 2 + .02, y0 + CH / 2, CD + .005); f.add(dv);
  dv.add(mc('s4-ticket-door', ({ add }) => {
    add(G.box(CW - .04, CH - .04, .03, .02), C.wood, CW / 2 - .02, 0, 0);
    add(G.box(CW - .2, CH - .2, .01, .01), '#c98f58', CW / 2 - .02, 0, .018);
    add(G.cyl(.022, .022, .03, 8), C.steel2, CW - .12, 0, .03, HP, 0, 0);
  }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.6 * t; }, { label: '창구 서랍', sfx: 'open', dur: .3 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: CW - .12, y: -.08, z: .04, parent: dv };
  f.spot('inside', null, 0, y0 + .03, CD / 2, { part: p, maxH: CH - .1, label: '창구 서랍 안', scale: .8 });
  f.spot('on', null, -.12, y0 + CH + .05, CD / 2 + .02, { maxH: .28, label: '창구 선반', scale: .7 });
  f.walkSolids = [[-.46, 0, -.05, .46, 1.5, CD + .05]];
};

// ── the platform roof (type platshelter): two posts, a kawara roof sloping back, a bench under it with someone's tote bag
// and a folded newspaper, the station clock and a name sign hanging under the front edge ─────────────────────────────
B.s4_shelter = f => {
  const L = 2.1, D = 1.25;
  f.add(mc('s4-shelter2', ({ add }) => {
    for (const sx of [-1, 1]) { add(G.box(.12, 1.85, .12, .02), C.post, sx * (L / 2 - .25), .925, -.3); add(G.box(.07, .07, .6, .01), C.post, sx * (L / 2 - .25), 1.68, -.05, -.45, 0, 0); }
    add(G.box(L - .24, .09, .12, .02), C.post, 0, 1.82, -.3);
    // the bench: blue seats on a dark frame
    add(G.box(1.4, .08, .4, .02), '#5fa8e8', 0, .44, -.15); add(G.box(1.4, .32, .07, .02), '#5fa8e8', 0, .68, -.34, -.1, 0, 0);
    for (const x of [-.6, .6]) add(G.box(.07, .44, .32, .01), C.dark, x, .22, -.15);
    // on the bench: a tote bag (mustard, its handles up) and a folded newspaper
    add(G.box(.32, .26, .14, .04), '#f2c14e', .38, .61, -.18); for (const s of [-1, 1]) add(G.tor(.07, .012, Math.PI, 4, 8), '#d9a53a', .38 + s * .07, .74, -.18);
    add(G.box(.34, .03, .24, .01), '#f4f1ea', -.35, .5, -.1, 0, .25, 0); for (let k = 0; k < 3; k++) add(G.box(.22, .004, .02, .002), '#9a93a8', -.38 + k * .02, .518, -.16 + k * .05, 0, .25, 0);
    // the station clock: a round white face in a dark rim, hung under the front beam; the name sign beside it
    add(G.cyl(.008, .008, .2, 4), C.dark, -.45, 1.82, .42); add(G.cyl(.17, .17, .07, 18), C.dark, -.45, 1.62, .42, HP, 0, 0); add(G.cyl(.145, .145, .075, 18), C.white, -.45, 1.62, .42, HP, 0, 0);
    add(G.box(.015, .1, .01, .003), C.dark, -.45, 1.66, .462); add(G.box(.08, .015, .01, .003), C.dark, -.42, 1.62, .462);
    for (const x of [.15, .75]) add(G.cyl(.008, .008, .22, 4), C.dark, x, 1.8, .42);
    add(G.box(.75, .22, .04, .02), C.white, .45, 1.62, .42); add(G.box(.75, .045, .045, .01), C.mintD, .45, 1.53, .42);
  }));
  f.add(mt('s4-shelter2-roof', kawara(), ({ add }) => { add(G.box(L + .24, .1, D, .03), C.roof, 0, 1.96, 0, -.14, 0, 0, 1, { w: .55 }); }));
  f.add(mc('s4-shelter2-trim', ({ add }) => { add(G.box(L + .26, .05, .06, .01), C.roofD, 0, 1.9, D / 2 + .02); }));
  f.spot('under', null, .25, 0, -.12, { maxH: .3, label: '승강장 의자 밑', scale: .65 });
  f.spot('on', null, -.05, .48, -.12, { maxH: .3, label: '승강장 의자 위', scale: .65 });
  f.spot('on', null, .45, 2.05, -.05, { maxH: .25, label: '승강장 지붕 위', scale: .55 });
  f.walkSolids = [[-.75, 0, -.37, .75, .8, .07], [-L / 2 + .18, 0, -.37, -L / 2 + .32, 1.9, -.23], [L / 2 - .32, 0, -.37, L / 2 - .18, 1.9, -.23]];
  f.collideBox = [-L / 2 + .15, 0, -.4, L / 2 - .15, .85, .08];
};

// ── recycling bins (cans · bottles · paper), facing +z ─────────────────────────────────────────────────────────────
B.s4_bins = f => {
  f.add(mc('s4-bins', ({ add }) => {
    [['#5fa8e8', 'can'], ['#7fcf8a', 'bottle'], ['#f2c14e', 'paper']].forEach(([c, k], i) => {
      const x = (i - 1) * .28;
      add(G.box(.26, .62, .3, .04), c, x, .31, 0); add(G.box(.27, .06, .31, .02), '#ffffff', x, .63, 0);
      if (k === 'paper') add(G.box(.16, .02, .04, .01), C.dark, x, .665, .02); else add(G.cyl(.06, .06, .02, 12), C.dark, x, .665, .02);
      add(G.box(.18, .1, .01, .01), '#ffffff', x, .45, .155);
    });
  }));
  f.spot('beside', null, .55, 0, .05, { maxH: .35, label: '쓰레기통 옆', scale: .6 });
  f.spot('on', null, .28, .68, 0, { maxH: .25, label: '쓰레기통 위', scale: .55 });
  f.walkSolids = [[-.43, 0, -.16, .43, .7, .16]];
};
// ── the luggage cart (type suitcases — where the blown hat and the locker key come down): a flat trolley with a handle,
// a rose suitcase standing on it, a cardboard box and a cloth bundle ───────────────────────────────────────────────────
B.s4_cart = f => {
  f.add(mc('s4-cart', ({ add, tube }) => {
    add(G.box(.95, .06, .55, .02), '#8f97ab', 0, .14, 0);
    for (const x of [-.36, .36]) for (const z of [-.22, .22]) add(G.cyl(.06, .06, .05, 10), C.dark, x, .06, z, HP, 0, 0);
    tube([-.47, .17, -.24], [-.47, .82, -.24], .02, C.steel2, 6); tube([-.47, .17, .24], [-.47, .82, .24], .02, C.steel2, 6); tube([-.47, .82, -.24], [-.47, .82, .24], .025, '#e8473f', 6);
    add(G.box(.3, .5, .48, .06), '#f2a7a0', -.22, .42, 0); add(G.box(.32, .05, .5, .02), '#d98a84', -.22, .52, 0); add(G.box(.04, .04, .2, .01), C.steel2, -.22, .69, 0);
    add(G.box(.3, .26, .3, .02), '#d9b07a', .22, .3, -.08); add(G.box(.31, .02, .04, .005), '#c9a26a', .22, .435, -.08);
    add(G.sph(.15, 12, 9), '#7fb8e6', .26, .25, .17, 0, 0, 0, [1, .75, 1]); add(G.sph(.06, 8, 6), '#6aa4d4', .26, .37, .17);
  }));
  f.spot('on', null, .22, .45, -.08, { maxH: .28, label: '짐 카트 위', scale: .6 });
  f.spot('beside', null, .65, 0, .1, { maxH: .3, label: '짐 카트 옆', scale: .6 });
  f.walkSolids = [[-.5, 0, -.28, .5, .85, .28]];
};

// ── the pastel local train (type train), one car along x, cab at +x; its doors on +z (trainIn opens one) ────────
B.s4_train = f => {
  const L = 4.3, D = .92, y0 = .3, Hb = 1.28;
  const car = grp(); f.add(car); (f.live ||= []).push(car); f.car = car;
  car.add(mc('s4-train', ({ add }) => {
    add(G.box(L, .46, D, .12), C.mint, 0, y0 + .23, 0);
    add(G.box(L + .01, .06, D + .02, .02), C.pink2, 0, y0 + .49, 0);
    add(G.box(L, Hb - .52, D, .12), C.cream, 0, y0 + .52 + (Hb - .52) / 2, 0);
    add(G.box(L - .12, .18, D - .08, .09), C.steel, 0, y0 + Hb + .06, 0);
    add(G.box(L * .4, .08, .34, .03), C.steel2, -.3, y0 + Hb + .18, 0);
    // pantograph
    for (const s of [-1, 1]) add(G.box(.04, .32, .04, .01), C.dark, -1.1, y0 + Hb + .36, 0, 0, 0, s * .5);
    add(G.box(.62, .03, .05, .01), C.dark, -1.1, y0 + Hb + .46, 0);
    // windows on both sides (rounded dark glass), the cab's big windscreen, headlights, the destination board
    for (const z of [D / 2 + .005, -D / 2 - .005]) for (const x of [-1.55, -.3, .45]) add(G.box(.5, .4, .02, .06), C.glass, x, y0 + .88, z);
    add(G.box(.06, .52, D - .2, .08), C.glass, L / 2 + .015, y0 + .92, 0);
    add(G.box(.05, .1, .4, .02), C.dark, L / 2 + .02, y0 + 1.22, 0); add(G.box(.052, .06, .3, .02), '#ffe7a6', L / 2 + .025, y0 + 1.22, 0);
    for (const s of [-1, 1]) add(G.sph(.06, 10, 8), '#fff3b0', L / 2 + .03, y0 + .3, s * .3);
    add(G.box(.06, .1, D - .1, .03), C.dark, L / 2 + .03, y0 + .08, 0);
    add(G.box(.06, .52, D - .2, .08), C.glass, -L / 2 - .015, y0 + .92, 0);
    for (const bx of [-1.45, 1.45]) { add(G.box(.95, .15, D - .16, .03), C.dark, bx, y0 - .05, 0); for (const wx of [-.28, .28]) for (const z of [-.33, .33]) add(G.cyl(.12, .12, .06, 14), '#4a4256', bx + wx, .2, z, HP, 0, 0); }
  }));
  f.doors = [-.95, 1.15].map(x => { const d = grp(); put(d, x, y0 + .52, D / 2 + .008); car.add(d); f.live.push(d); d.add(mc('s4-train-door', ({ add }) => { add(G.box(.5, .98, .02, .03), C.mintD, 0, 0, 0); for (const s of [-1, 1]) add(G.box(.16, .32, .01, .03), C.glass, s * .11, .22, .012); })); return d; });
  f.spot('under', null, -L / 2 - .5, 0, -.48, { maxH: .2, label: '선로 옆', scale: .6 });
  f.walkSolids = [];
};

// ── the level crossing (type crossing): yellow-black post, the X sign, two red lamps that take turns while it rings,
// the speaker, the yellow-black arm on its hinge — up (t 0), lowered across the road toward +x (t 1); f.arm = part.crossing
B.s4_crossing = f => {
  f.add(mc('s4-crossing', ({ add }) => {
    add(G.box(.32, .07, .32, .02), C.plinth, 0, .035, 0);
    for (let i = 0; i < 10; i++) add(G.cyl(.05, .05, .2, 10), i % 2 ? C.dark : C.yel, 0, .07 + i * .2 + .1, 0);
    for (const r of [.62, -.62]) { add(G.box(.66, .12, .03, .02), C.yel, 0, 2.05, .05, 0, 0, r); add(G.box(.6, .04, .035, .01), C.dark, 0, 2.05, .055, 0, 0, r); }
    add(G.cone(.09, .14, 10), C.dark, 0, 2.32, .02, HP, 0, 0);
    add(G.box(.66, .06, .06, .02), C.dark, 0, 1.55, .03);
    for (const s of [-1, 1]) { add(G.cyl(.11, .11, .05, 14), C.dark, s * .27, 1.55, .07, HP, 0, 0); add(G.cyl(.12, .12, .015, 14, true), C.dark, s * .27, 1.55, .12, HP, 0, 0); }
    add(G.box(.16, .12, .04, .02), C.dark, 0, 1.3, .05); add(G.box(.12, .04, .045, .01), C.white, 0, 1.3, .055);
    add(G.box(.28, .28, .22, .03), C.dark, .1, .9, .16);
    add(G.box(.3, .5, .26, .03), '#d9d6e2', -.08, .25, .26); add(G.box(.2, .06, .01, .01), C.yel, -.08, .38, .39);
  }));
  const lens = [-1, 1].map(s => {
    const m = new THREE.MeshBasicMaterial({ color: '#7a2a33' });
    const l = new THREE.Mesh(G.cyl(.08, .08, .02, 18), m); l.rotation.x = HP; l.position.set(s * .27, 1.55, .1); l.userData.noMerge = true; f.add(l);
    return m;
  });
  const ON = new THREE.Color('#ff3b4a'), OFF = new THREE.Color('#7a2a33');
  let last = -1;
  f.tick = t => { const k = f.ringing ? Math.floor(t * 3.2) % 2 : -1; if (k === last) return; last = k; lens[0].color.copy(k === 1 ? ON : OFF); lens[1].color.copy(k === 0 ? ON : OFF); };
  const arm = grp(); put(arm, .22, .9, .28); f.add(arm);
  arm.add(mc('s4-crossing-arm', ({ add }) => { const n = 8, L = 1.55; for (let i = 0; i < n; i++) add(G.box(L / n, .07, .05, .015), i % 2 ? C.dark : C.yel, (i + .5) * L / n, 0, 0); add(G.box(.08, .1, .07, .02), C.dark, 0, 0, 0); }));
  const ap = f.part('lift', arm, t => { arm.rotation.z = (HP - .08) * (1 - t); }, { label: '건널목 차단기', sfx: 'tock', dur: .5 });
  ap.setOpen(0); ap.crossing = true; f.arm = ap;
  f.spot('beside', null, -.18, 0, .34, { maxH: .3, label: '차단기 아래', scale: .7 });
  f.walkSolids = [[-.17, 0, -.17, .17, 2.4, .17], [-.24, 0, .12, .08, .5, .4]];
};

// ── 개굴이's fishing bag (type tripbag): green canvas, a flap that lifts, the rod strapped on ────────────────────
B.s4_tripbag = f => {
  const W = .62, H = .32, D = .36, CANV = '#7cc47a';
  f.add(mc('s4-tripbag', ({ add }) => {
    add(G.box(W, H, D, .06), CANV, 0, H / 2, 0);
    for (const s of [-1, 1]) add(G.box(.06, H + .01, D + .02, .02), '#5fae5a', s * .18, H / 2, 0);
    add(G.box(.2, .14, .04, .02), '#6cbb6a', 0, .14, D / 2 + .01);
    add(G.cyl(.008, .008, .5, 6), C.dark, .1, .31, -D / 2 - .03, 0, 0, HP);
  }));
  const lid = grp(); put(lid, 0, H, -D / 2); f.add(lid);
  lid.add(mc('s4-tripbag-flap', ({ add }) => {
    add(G.box(W + .02, .04, D + .02, .02), CANV, 0, .02, D / 2);
    add(G.cyl(.012, .016, 1.0, 8), C.woodD, .1, .07, D / 2, 0, 0, HP); add(G.cyl(.04, .04, .03, 12), C.steel2, -.18, .1, D / 2 + .03, HP, 0, 0);
    add(G.sph(.04, 8, 6), C.red, .55, .08, D / 2); add(G.sph(.04, 8, 6), C.white, .55, .12, D / 2, 0, 0, 0, [1, .6, 1]);
  }));
  const p = f.part('lift', lid, t => { lid.rotation.x = -1.9 * t; }, { label: '낚시 가방', sfx: 'lift', dur: .32 });
  f.spot('inside', null, 0, .03, 0, { part: p, maxH: .22, label: '낚시 가방 안', scale: .7 });
  f.spot('beside', null, .5, 0, .12, { maxH: .3, label: '낚시 가방 옆', scale: .6 });
  f.walkSolids = [[-.32, 0, -.19, .32, .34, .19]];
};
// ── coin lockers (type coinlocker — HAT_KEY 27 'pad'): two by three soft blue doors, the lower middle one opens ───
B.s4_locker = f => {
  // (rows from the floor: one tall row of big boxes, two rows of small ones; the big lower-left box opens)
  const W = .9, H = 1.42, D = .46, cw = (W - .06) / 2, RY = [.14, .66, 1.02, 1.38], BL = '#aebfd6', zb = -D / 2 - .02;
  f.add(mc('s4-locker2', ({ add }) => {
    add(G.pbox(W, H, .03), BL, 0, H / 2, zb + .015);
    for (const s of [-1, 1]) add(G.pbox(.03, H, D), BL, s * (W / 2 - .015), H / 2, -.02);
    add(G.box(W + .04, .06, D + .04, .015), '#93a6c2', 0, H, -.02); add(G.pbox(W, .14, D), '#93a6c2', 0, .07, -.02);
    for (const y of RY.slice(1, 3)) add(G.pbox(W - .06, .02, D - .02), BL, 0, y, -.02);
    add(G.pbox(.02, H - .14, D - .02), BL, 0, .14 + (H - .14) / 2, -.02);
    add(G.pbox(cw - .02, RY[1] - RY[0] - .02, .01), '#3e5066', -cw / 2, (RY[0] + RY[1]) / 2, zb + .035);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
      if (r === 0 && c === 0) continue;
      const x = (c - .5) * cw, y = (RY[r] + RY[r + 1]) / 2, ch = RY[r + 1] - RY[r];
      add(G.box(cw - .03, ch - .03, .025, .01), '#e3ebf4', x, y, D / 2 - .03);
      add(G.box(.06, .04, .01, .005), C.dark, x + cw * .3, y + .06, D / 2 - .015); add(G.cyl(.018, .018, .02, 8), C.steel2, x + cw * .3, y - .02, D / 2 - .015, HP, 0, 0);
    }
  }));
  const ch0 = RY[1] - RY[0], dv = grp(); put(dv, -cw + .015, (RY[0] + RY[1]) / 2, D / 2 - .03); f.add(dv);
  dv.add(mc('s4-locker2-door', ({ add }) => { add(G.box(cw - .03, ch0 - .03, .025, .01), '#e3ebf4', cw / 2 - .015, 0, 0); add(G.box(.06, .04, .01, .005), C.red, cw * .8, .08, .015); add(G.cyl(.018, .018, .02, 8), C.steel2, cw * .8, 0, .015, HP, 0, 0); }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.7 * t; }, { label: '물품 보관함', sfx: 'open', dur: .3 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: cw * .8, y: -.06, z: .04, parent: dv };
  f.spot('inside', null, -cw / 2, RY[0] + .015, -.04, { part: p, maxH: ch0 - .06, label: '물품 보관함 안', scale: .8 });
  f.spot('on', null, .1, H + .03, -.02, { maxH: .3, label: '물품 보관함 위', scale: .6 });
  f.walkSolids = [[-W / 2, 0, -D / 2 - .02, W / 2, H, D / 2]];
};

// ── small things ─────────────────────────────────────────────────────────────────────────────────────────────
// two vending machines (red, blue), facing +z: a window of little bottles, the buttons, the slot
B.s4_vend = f => {
  f.add(mc('s4-vend', ({ add }) => {
    [[-.34, C.red], [.34, C.blue]].forEach(([x, c], n) => {
      add(G.box(.64, 1.6, .58, .05), c, x, .8, 0); add(G.box(.66, .06, .6, .02), '#ffffff', x, 1.6, 0);
      add(G.box(.54, .66, .02, .02), '#f4f7fb', x, 1.14, .29);
      for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) add(G.cyl(.035, .035, .13, 8), ['#ffd23f', '#7fd6c0', '#ff8f6b', '#ffffff', '#9fc4ff'][(r * 4 + k + n) % 5], x - .19 + k * .125, .9 + r * .2, .27);
      for (let k = 0; k < 4; k++) add(G.box(.06, .03, .02, .01), C.white, x - .19 + k * .125, .78, .3);
      add(G.box(.42, .14, .04, .02), C.dark, x, .3, .28); add(G.box(.08, .14, .03, .01), '#cfd3dc', x + .2, .62, .3);
    });
  }));
  f.spot('beside', null, .82, 0, .1, { maxH: .45, label: '자판기 옆', scale: .7 });
  f.spot('on', null, .3, 1.63, 0, { maxH: .3, label: '자판기 위', scale: .6 });
  f.walkSolids = [[-.69, 0, -.31, .69, 1.65, .31]];
};
// the round red postbox
B.s4_post = f => {
  f.add(mc('s4-post', ({ add }) => {
    add(G.cyl(.21, .21, .84, 18), C.red, 0, .52, 0); add(G.sph(.21, 18, 8), C.red, 0, .94, 0, 0, 0, 0, [1, .55, 1]);
    add(G.cyl(.23, .23, .05, 18), '#c93a33', 0, .96, 0);
    add(G.cyl(.13, .15, .1, 12), '#4a4256', 0, .05, 0); add(G.box(.2, .04, .06, .01), C.dark, 0, .76, .19);
    add(G.box(.16, .12, .02, .01), C.white, 0, .55, .21);
  }));
  f.spot('behind', null, -.1, 0, -.38, { maxH: .35, label: '우체통 뒤', scale: .6 });
  f.walkSolids = [[-.22, 0, -.22, .22, 1.05, .22]];
};
// the cherry tree — the stage's face (opts.s: its size): a thick leaning trunk, a big soft crown in three pinks
B.s4_sakura = (f, T, o = {}) => {
  const k = o.s || 1;
  f.add(mt('s4-sakura-trunk|' + k, TX.bark(), ({ add }) => {
    add(G.cyl(.16 * k, .26 * k, 1.6 * k, 10), C.bark, 0, .8 * k, 0, 0, 0, .06, 1, { w: .4 });
    add(G.cyl(.08 * k, .12 * k, .9 * k, 8), C.bark, .35 * k, 1.5 * k, .12 * k, 0, 0, -.65, 1, { w: .4 }); add(G.cyl(.07 * k, .1 * k, .8 * k, 8), C.bark, -.3 * k, 1.55 * k, -.1 * k, .2, 0, .6, 1, { w: .4 });
    for (const a of [0, 2.1, 4.2]) add(G.cyl(.05 * k, .12 * k, .45 * k, 6), C.bark, Math.cos(a) * .25 * k, .08 * k, Math.sin(a) * .25 * k, Math.sin(a) * .9, 0, -Math.cos(a) * .9, 1, { w: .4 });
  }));
  f.add(mt('s4-sakura-crown|' + k, TX.leaf(), ({ add }) => {
    for (const [dx, dy, dz, r, c] of [[0, 2.2, 0, 1.0, C.pink], [.8, 2.0, .25, .72, C.pink2], [-.75, 2.05, -.1, .75, C.pink], [.15, 2.55, -.55, .72, C.pink3],
      [-.25, 1.9, .65, .62, C.pink2], [.45, 2.7, .35, .6, C.pink], [-.6, 2.6, .25, .55, C.pink3], [.9, 2.45, -.4, .5, C.pink], [-.9, 2.2, .55, .5, C.pink], [.6, 2.0, .8, .5, C.pink3]])
      add(G.sph(r * k, 16, 12), c, dx * k, dy * k, dz * k, 0, 0, 0, [1, .84, 1], { w: .5 });
  }));
  f.spot('beside', null, .38 * k, 0, .3 * k, { maxH: .35, label: '벚나무 뿌리 사이', scale: .6 });
  f.spot('beside', null, -.35 * k, 0, .32 * k, { maxH: .35, label: '벚나무 밑', scale: .6 });
  f.walkSolids = [[-.26 * k, 0, -.26 * k, .26 * k, 1.6 * k, .26 * k]];
  f.collideBox = [-.3 * k, 0, -.3 * k, .3 * k, 1.5 * k, .3 * k];
};
// a concrete utility pole: crossarm, insulators, a transformer can, the yellow-black guard at its foot
B.s4_pole = f => {
  f.add(mc('s4-pole', ({ add }) => {
    add(G.cyl(.075, .11, 3.4, 10), C.pole, 0, 1.7, 0); add(G.box(.09, .09, 1.0, .02), C.steel2, 0, 3.0, 0);
    for (const z of [-.4, 0, .4]) add(G.cyl(.035, .03, .1, 8), '#ffffff', 0, 3.1, z);
    add(G.cyl(.17, .17, .48, 12), '#a7adbb', .22, 2.45, 0); add(G.box(.12, .04, .04, .01), C.steel2, .12, 2.6, 0);
    for (let i = 0; i < 4; i++) add(G.cyl(.118, .118, .12, 10), i % 2 ? C.dark : C.yel, 0, .3 + i * .12, 0);
    add(G.box(.2, .3, .02, .01), C.white, 0, 1.5, .1); add(G.box(.16, .04, .025, .005), C.blue, 0, 1.58, .105);
  }));
  f.spot('beside', null, .24, 0, .2, { maxH: .3, label: '전봇대 밑', scale: .6 });
  f.walkSolids = [[-.12, 0, -.12, .12, 3.4, .12]];
};
// the station-name board (駅名標): white, our name big in the middle, the stations either side under arrows
B.s4_namesign = f => {
  f.add(mc('s4-namesign', ({ add }) => {
    for (const x of [-.62, .62]) add(G.cyl(.04, .045, 1.25, 8), C.steel2, x, .62, -.03);
    add(G.box(1.46, .62, .05, .03), '#e8edf2', 0, 1.0, -.03);
  }));
  board(f, 1.38, .54, 700, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    fitText(c, '벚꽃마을', w / 2, h * .3, w * .6, h * .3, '#3a3048');
    const other = tr('벚꽃마을') === '벚꽃마을' ? 'Sakura Town' : '벚꽃마을';
    c.font = FONT(Math.round(h * .12)); c.fillStyle = '#6b6478'; c.textAlign = 'center'; c.fillText(other, w / 2, h * .54, w * .6);
    c.fillStyle = '#5fae8a'; c.fillRect(0, h * .66, w, h * .12);
    fitText(c, '◀ 몽글동', w * .2, h * .87, w * .36, h * .13, '#3a3048'); fitText(c, '바닷가 ▶', w * .8, h * .87, w * .36, h * .13, '#3a3048');
  }, 0, 1.0, .0, 0);
  f.spot('under', null, .2, 0, .15, { maxH: .35, label: '역 이름판 밑', scale: .6 });
  f.walkSolids = [[-.7, 0, -.08, .7, 1.35, .04]];
};
// the bike rack with three bicycles (mint, pink, white), two with front baskets
B.s4_bikes = f => {
  f.add(mc('s4-bikes', ({ add, tube }) => {
    tube([-.95, .3, -.25], [.95, .3, -.25], .025, C.steel2, 6);
    for (const x of [-.95, .95]) add(G.box(.04, .3, .04, .01), C.steel2, x, .15, -.25);
    [[-.6, '#8fd3c0'], [0, '#ffa6c6'], [.6, '#f4f4f0']].forEach(([x, c], n) => {
      const tw = (zc) => add(G.tor(.2, .025, Math.PI * 2, 6, 18), C.dark, x, .22, zc, 0, HP, 0);
      tw(-.35); tw(.35);
      tube([x, .22, -.35], [x, .48, -.05], .02, c, 5); tube([x, .48, -.05], [x, .5, .25], .02, c, 5); tube([x, .22, .35], [x, .5, .25], .02, c, 5); tube([x, .22, -.35], [x, .3, .02], .02, c, 5); tube([x, .3, .02], [x, .48, -.05], .02, c, 5);
      add(G.box(.08, .03, .16, .02), C.dark, x, .55, -.08);
      tube([x - .14, .66, .3], [x + .14, .66, .3], .015, C.dark, 4); tube([x, .5, .25], [x, .66, .3], .018, c, 4);
      if (n < 2) { add(G.box(.22, .14, .18, .03), '#c9a273', x, .66, .43); add(G.box(.18, .02, .14, .01), '#8b6a4e', x, .6, .43); }
    });
  }));
  f.spot('inside', null, -.6, .61, .43, { maxH: .14, label: '자전거 바구니', scale: .55 });
  f.spot('inside', null, 0, .61, .43, { maxH: .14, label: '자전거 바구니', scale: .55 });
  f.spot('beside', null, 1.15, 0, .1, { maxH: .35, label: '자전거 옆', scale: .6 });
  f.walkSolids = [[-1.0, 0, -.6, 1.0, .7, .6]];
};
// the simple IC ticket gate: a short post with a card reader
B.s4_icgate = f => {
  f.add(mc('s4-icgate', ({ add }) => {
    add(G.box(.2, .9, .2, .04), '#e8edf2', 0, .45, 0); add(G.box(.22, .06, .24, .02), C.steel2, 0, .92, 0);
    add(G.box(.16, .03, .16, .02), '#5fa8e8', 0, .96, .02); add(G.box(.1, .015, .1, .01), '#bfe3ff', 0, .98, .02);
    add(G.box(.12, .08, .02, .01), '#7fd6a0', 0, .7, .105);
  }));
  f.spot('beside', null, .25, 0, .1, { maxH: .3, label: '개찰기 옆', scale: .55 });
  f.walkSolids = [[-.11, 0, -.11, .11, 1.0, .11]];
};

export const S4_BUILDERS = B;
const H = { hidden: true, price: 0 };
export const S4_INFO = {
  s4_land: { w: .1, d: .1, name: '벚꽃마을역', ...H, floor: true },
  s4_station: { w: 3, d: 2, name: '나무 역사', ...H }, ticketoffice: { w: 1, d: 1, name: '매표 창구', ...H },
  s4_shelter: { w: 2, d: 1, name: '승강장 지붕', ...H }, s4_train: { w: 5, d: 1, name: '파스텔 전철', ...H }, s4_crossing: { w: 1, d: 1, name: '건널목 차단기', ...H },
  s4_tripbag: { w: 1, d: 1, name: '낚시 가방', ...H }, s4_locker: { w: 1, d: 1, name: '물품 보관함', ...H },
  s4_vend: { w: 1, d: 1, name: '자판기', ...H }, s4_post: { w: 1, d: 1, name: '우체통', ...H }, s4_sakura: { w: 1, d: 1, name: '벚나무', ...H },
  s4_pole: { w: 1, d: 1, name: '전봇대', ...H }, s4_namesign: { w: 2, d: 1, name: '역 이름판', ...H }, s4_bikes: { w: 2, d: 1, name: '자전거 거치대', ...H },
  s4_icgate: { w: 1, d: 1, name: '간이 개찰기', ...H }, s4_bins: { w: 1, d: 1, name: '분리수거함', ...H }, s4_cart: { w: 1, d: 1, name: '짐 카트', ...H },
};

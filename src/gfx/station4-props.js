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
import { grp, put, mat, plane, canvasTex, texCache, shade } from './kit.js';
import { G, mc, mt, TX, HP, island, blobOutline, scaleOutline, tuft, flower, bush } from './pc-kit.js';
import { textTex, fitText, FONT } from './gpt-paper.js';
import { addI18n, tr } from '../i18n.js';

addI18n({ '벚꽃마을역': 'Sakura Town', '벚꽃마을': 'Sakura Town', '몽글동': 'Mongle-dong', '바닷가': 'Seaside', '노선도': 'Route map', '시간표': 'Timetable',
  '역사 처마 밑': 'Under the station eaves', '문 옆 화분': 'By the door plant', '창구 서랍': 'Ticket drawer', '창구 서랍 안': 'In the ticket drawer', '창구 선반': 'Ticket window ledge',
  '물품 보관함': 'Coin lockers', '물품 보관함 안': 'In the coin locker', '물품 보관함 위': 'On the coin lockers', '승강장 의자 밑': 'Under the platform bench', '승강장 의자 위': 'On the platform bench',
  '승강장 지붕 위': 'On the platform roof', '낚시 가방': 'Fishing bag', '낚시 가방 안': 'In the fishing bag', '낚시 가방 옆': 'By the fishing bag', '여행 가방': 'Suitcase',
  '여행 가방 위': 'On the suitcase', '여행 가방 옆': 'By the suitcase', '자판기 옆': 'Beside the vending machine', '자판기 위': 'On the vending machine', '우체통 뒤': 'Behind the postbox',
  '벚나무 뿌리 사이': 'Between the cherry roots', '벚나무 밑': 'Under the cherry tree', '전봇대 밑': 'At the foot of the pole', '역 이름판 밑': 'Under the station sign',
  '자전거 바구니': 'Bike basket', '자전거 옆': 'By the bikes', '개찰기 옆': 'By the ticket gate', '꽃밭 속': 'In the flower bed', '울타리 밑': 'Under the fence',
  '선로 옆': 'Beside the track', '매표소': 'Tickets', '창 밑 화분': 'By the window plant', '쓰레기통 앞': 'In front of the bins', '나무 역사': 'Wooden station house', '매표 창구': 'Ticket window', '승강장 지붕': 'Platform roof', '우체통': 'Postbox', '벚나무': 'Cherry tree', '역 이름판': 'Station sign', '간이 개찰기': 'IC card reader', '짐 카트': 'Luggage cart', '쓰레기통 옆': 'By the bins', '쓰레기통 위': 'On the bins', '짐 카트 위': 'On the luggage cart', '짐 카트 옆': 'By the luggage cart', '◀ 몽글동': '◀ Mongle-dong', '바닷가 ▶': 'Seaside ▶', '차단기 아래': 'Under the crossing gate', '건널목 차단기': 'Crossing gate', '파스텔 전철': 'Pastel train' });

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

// blossom: little five-petal flowers packed into clumps, pink-grey petal edges and deeper centres (white = the crown's colour)
const blossomTex = () => gtex('blossom', 256, (x, w, h) => {
  let q = 11; const r = () => (q = (q * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(150,60,95,.10)'; x.beginPath(); x.arc(r() * w, r() * h, 10 + r() * 16, 0, 7); x.fill(); }
  for (let i = 0; i < 210; i++) {
    const px = r() * w, py = r() * h, pr = 4 + r() * 5, a0 = r() * 6.3;
    for (let k = 0; k < 5; k++) { const a = a0 + k * 1.2566; x.fillStyle = 'rgba(255,255,255,.9)'; x.strokeStyle = 'rgba(170,70,110,.32)'; x.lineWidth = 1;
      x.beginPath(); x.ellipse(px + Math.cos(a) * pr * .55, py + Math.sin(a) * pr * .55, pr * .5, pr * .34, a, 0, 7); x.fill(); x.stroke(); }
    x.fillStyle = 'rgba(205,80,120,.55)'; x.beginPath(); x.arc(px, py, pr * .22, 0, 7); x.fill();
  }
});
// asphalt: fine light and dark grit, a few hairline cracks and one darker patch
const asphaltTex = () => gtex('asphalt', 256, (x, w, h) => {
  let q = 5; const r = () => (q = (q * 16807) % 2147483647) / 2147483647;
  x.fillStyle = 'rgba(40,40,55,.08)'; x.fillRect(w * .55, h * .1, w * .3, h * .22);
  for (let i = 0; i < 1600; i++) { x.fillStyle = r() < .5 ? 'rgba(255,255,255,.28)' : 'rgba(30,30,45,.22)'; x.fillRect(r() * w, r() * h, 1 + r() * 1.6, 1 + r() * 1.6); }
  for (let i = 0; i < 5; i++) { x.strokeStyle = 'rgba(30,30,45,.3)'; x.lineWidth = 1; x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (r() - .5) * 30; py += (r() - .5) * 30; x.lineTo(px, py); } x.stroke(); }
});
// the island outline cut to the strip x0..x1 (Sutherland–Hodgman on two vertical edges): the road follows the shore
function clipStrip(pts, x0, x1) {
  const cut = (P, keep, X) => { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], ia = keep(a[0]), ib = keep(b[0]);
    if (ia) out.push(a); if (ia !== ib) { const t = (X - a[0]) / (b[0] - a[0]); out.push([X, a[1] + (b[1] - a[1]) * t]); } } return out; };
  return cut(cut(pts, x => x >= x0, x0), x => x <= x1, x1);
}
// where the shore crosses x (its two z's)
// (x must lie inside the outline's x range — the kerbs stand just outside the road's strip, so they ask the island's shore, not the road's)
function shoreZ(pts, x) { const zs = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) zs.push(a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])); } return [Math.min(...zs), Math.max(...zs)]; }
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
// a leafy shrub: a darker core with flat pointed leaves fanned round and up it, the leaves reading one by one; with `head`, a
// hydrangea's flower heads of small florets on top (아트 점검 10/24: the front bed's ball bushes — one neon green, two lilac —
// looked like slime)
function leafBush(add, x, z, s, c1, c2, head = null, y0 = 0) {
  if (y0) { const a0 = add; add = (g, c, X, Y, ...r) => a0(g, c, X, Y + y0, ...r); }
  add(G.sph(.2 * s, 10, 8), c2, x, .18 * s, z, 0, 0, 0, [1.1, .8, 1.1]);
  for (let k = 0; k < 26; k++) {
    const t = k / 26, a = k * 2.399, r = (.26 - .2 * t) * s;
    add(G.sph(1, 6, 3), k % 3 ? c1 : c2, x + Math.cos(a) * r, (.08 + .38 * t) * s, z + Math.sin(a) * r, 0, -a, .3 + .5 * (1 - t), [.13 * s, .026 * s, .065 * s]);
  }
  if (!head) return;
  for (let h = 0; h < 4; h++) {
    const a = h * 1.7 + .4, hx = x + Math.cos(a) * .13 * s, hz = z + Math.sin(a) * .13 * s, hy = (.44 + (h % 2) * .06) * s;
    for (let k = 0; k < 9; k++) { const b = k * 2.4, rr = k ? .07 * s : 0; add(G.sph(.036 * s, 6, 4), k % 2 ? head[0] : head[1], hx + Math.cos(b) * rr, hy + (k ? 0 : .03 * s), hz + Math.sin(b) * rr, 0, 0, 0, [1, .7, 1]); }
  }
}
const OUT = blobOutline(5, 3.5, { pad: .7, round: 2.0, amp: .14, seed: 27 });
// the track along x at z TZ; the road along z at x 3.55..4.85; the platform x -5..3, z -1.5..0.5
export const TZ = 1.05;
export const POLES = [[5.05, -2.45], [3.2, 3.6]];
const RX0 = 3.55, RX1 = 4.85, RXC = (RX0 + RX1) / 2;
// the road's shape: the island cut to its strip, a hair inside the shore so it never hangs over the side
const SHORE = scaleOutline(OUT, -.05), ROADP = clipStrip(SHORE, RX0, RX1);
B.s4_land = f => {
  island(f, { key: 's4-land2', pts: OUT, top: C.grass, lip: C.lip, seed: 27,
    layers: [{ h: .2, color: C.earth, k: 0 }, { h: .3, color: C.band, k: -.03, stones: true }, { h: .26, color: C.earthD, k: -.13 }],
    pebble: '#e6ddd0', skip: [[RXC, -4.1, .9], [RXC, 4.1, .9]],
    decorTex: ({ add }) => {
      add(G.slab([[-5.6, TZ - .55], [5.6, TZ - .55], [5.6, TZ + .62], [-5.6, TZ + .62]], .014, 0), C.ballast, 0, .002, 0, 0, 0, 0, 1, { w: .45 });
      // the paving by the bikes
      add(G.slab([[-4.6, 2.25], [-2.5, 2.25], [-2.5, 3.45], [-4.6, 3.45]], .012, 0), C.pave, 0, .003, 0, 0, 0, 0, 1, { w: .5 });
    },
    decorTexMap: TX.stone(),
    decor: ({ add, tube }) => {
      // the road's kerbs: from just inside the shore to the crossing, both sides, their ends rounded
      for (const x of [RX0 - .06, RX1 + .06]) {
        const [za, zb] = shoreZ(SHORE, x);
        for (const [z0, z1] of [[za + .08, TZ - .72], [TZ + .72, zb - .08]]) { add(G.box(.12, .1, z1 - z0, .04), C.kerb, x, .05, (z0 + z1) / 2); add(G.box(.13, .02, z1 - z0 - .04, .01), '#f4f0ea', x, .1, (z0 + z1) / 2); }
      }
      // the road's cut at the shore: a dark asphalt band and its gravel bed in the island's side, under the road's two ends
      for (let i = 0; i < OUT.length; i++) {
        const a = OUT[i], b = OUT[(i + 1) % OUT.length]; if (a[0] < RX0 || a[0] > RX1 || b[0] < RX0 || b[0] > RX1) continue;
        tube([a[0], -.035, a[1]], [b[0], -.035, b[1]], .035, '#7c808a', 5); tube([a[0], -.1, a[1]], [b[0], -.1, b[1]], .04, '#b9b0a4', 5);
      }
      // sleepers and rails, the length of the island
      for (let s = -5.5; s < 5.6; s += .42) add(G.box(.14, .045, .9, .008), C.sleeper, s, .035, TZ);
      for (const k of [-.33, .33]) { tube([-5.65, .09, TZ + k], [5.65, .09, TZ + k], .032, C.rail, 6); tube([-5.65, .125, TZ + k], [5.65, .125, TZ + k], .02, '#d7dbe3', 6); }
      // the crossing: rubber boards between and beside the rails, the road's white lines and kerbs
      add(G.box(1.3, .05, 1.15, .012), '#6f6a66', RXC, .03, TZ);
      for (let k = -2; k <= 2; k++) add(G.box(.02, .052, 1.1, .004), '#5b5652', RXC + k * .26, .031, TZ);
      // lane paint: the dashed centre line, solid edge lines, a stop line each side of the crossing; a manhole and two drain grates
      { const [za, zb] = shoreZ(SHORE, RXC);
        for (let z = za + .35; z < zb - .3; z += .8) if (Math.abs(z + .2 - TZ) > .85) add(G.box(.07, .006, .42, .002), C.line, RXC, .032, z + .2);
        for (const x of [RX0 + .1, RX1 - .1]) for (const [z0, z1] of [[za + .25, TZ - .75], [TZ + .75, zb - .25]]) add(G.box(.04, .006, z1 - z0, .002), C.line, x, .032, (z0 + z1) / 2);
        for (const z of [TZ - .95, TZ + .95]) add(G.box(1.1, .006, .1, .002), C.line, RXC, .032, z);
        add(G.cyl(.2, .2, .012, 18), '#6d6f78', RXC + .3, .034, TZ + 2.0); add(G.cyl(.16, .16, .014, 18), '#83868f', RXC + .3, .036, TZ + 2.0);
        for (let k = -2; k <= 2; k++) add(G.box(.26, .016, .015, .003), '#5e6068', RXC + .3, .044, TZ + 2.0 + k * .055);
        for (const [x, z] of [[RX0 + .14, TZ - 1.9], [RX1 - .14, TZ + 2.7]]) { add(G.box(.18, .012, .34, .004), '#5e6068', x, .034, z); for (let k = -3; k <= 3; k++) add(G.box(.15, .016, .012, .002), '#3f4049', x, .04, z + k * .045); } }
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
      leafBush(add, -2.3, TZ + 1.45, .75, '#5fae5a', '#3f8f4f', ['#a9b8f0', '#8f9fe0']); leafBush(add, 1.5, TZ + 1.45, .7, '#5fae5a', '#3f8f4f', ['#c9b0ea', '#b49ce0']);
      leafBush(add, -5.0, TZ + 1.5, .7, '#6cb85c', '#468f48');
      // the overhead wires between the two poles (they run on past the island's edge)
      const [p, q] = POLES;
      const dl = Math.hypot(q[0] - p[0], q[1] - p[1]), ux = (q[0] - p[0]) / dl * 1.4, uz = (q[1] - p[1]) / dl * 1.4;
      for (const dy of [3.08, 2.88]) tube([p[0] - ux, dy, p[1] - uz], [q[0], dy, q[1]], .008, C.wire, 4);
      // fallen petals: round the tree and over the platform under it (not many)
      const pet = [[.2, -2.0], [.9, -2.2], [1.6, -1.9], [2.2, -2.3], [-.4, -2.2], [1.2, -3.0], [.5, -.9], [1.1, -.4], [-.3, -.6], [1.9, -.8], [2.6, -.2], [-.9, -.3], [.3, .1], [2.2, .2], [-1.4, -.9], [1.5, .3]];
      pet.forEach(([x, z], i) => add(G.cyl(.04, .04, .005, 6), i % 3 ? C.pink : C.pink2, x, (x < 3 && z > -1.5 ? PY : 0) + .01, z, 0, i, 0, [1, 1, .7]));
      for (const [x, z] of [[-4.6, 3.7], [2.6, 3.6], [-1.0, 3.8], [5.3, -3.2], [-5.3, -2.6]]) tuft(add, x, z, 1);
    } });
  f.add(mt('s4-road', asphaltTex(), ({ add }) => { add(G.slab(ROADP, .025, 0), C.asphalt, 0, .004, 0, 0, 0, 0, 1, { w: .9 }); }));
  // a couple of places in the front bed
  f.spot('in', null, -1.1, .14, TZ + 1.42, { maxH: .22, label: '꽃밭 속', scale: .55 });
  f.spot('in', null, .5, .14, TZ + 1.38, { maxH: .22, label: '꽃밭 속', scale: .55 });
  f.spot('beside', null, -3.9, 0, TZ + 1.05, { maxH: .3, label: '울타리 밑', scale: .55 });
  // (the flower bed as tall as the fence: at .2 it was a step up, and 개굴이 — moved to where the start view sees him — stood in it, 아트 점검 10/24)
  // (the bed and its three shrubs as solid as the fence: 개굴이 wandered onto the bed's west end and stood in the hydrangea — 사용자 메모
  // '개구리 꽃에 뚫림', still there after the friendAt move)
  f.walkSolids = [[-5.25, 0, TZ + .78, 3.1, .5, TZ + .86], [-2.75, 0, TZ + 1.05, 1.85, .5, TZ + 1.85], [-5.4, 0, TZ + 1.1, -4.6, .5, TZ + 1.9]];
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
    // the entrance (사용자 메모 '출입구인지 창문인지'): a deep doorway — a thick frame with a lintel, two sliding doors (wood kick
    // panel below, glass above, one in front of the other), their bar handles, a stone threshold at the platform's height and a
    // little tiled canopy over it
    const D0 = PY, DH = 1.34, DW = .96;
    add(G.box(DW + .2, DH + .14, .07, .02), C.post, dx, D0 + (DH + .14) / 2, zf + .02);
    add(G.box(DW + .3, .12, .1, .02), C.post, dx, D0 + DH + .12, zf + .04);
    add(G.box(DW, DH, .02, .005), '#4a3f52', dx, D0 + DH / 2, zf + .03);
    [[-1, .05], [1, .085]].forEach(([sd, z]) => {
      const cx = dx + sd * DW / 4;
      add(G.box(DW / 2 + .02, DH, .035, .015), C.post, cx, D0 + DH / 2, zf + z);
      add(G.box(DW / 2 - .06, .34, .02, .01), C.siding, cx, D0 + .22, zf + z + .02);
      add(G.box(DW / 2 - .06, DH - .52, .015, .008), C.glass2, cx, D0 + .44 + (DH - .52) / 2, zf + z + .02);
      add(G.box(.02, DH - .52, .02, .004), C.post, cx, D0 + .44 + (DH - .52) / 2, zf + z + .03);
      add(G.box(DW / 2 - .06, .02, .02, .004), C.post, cx, D0 + .44 + (DH - .52) * .55, zf + z + .03);
      add(G.box(.025, .22, .03, .01), C.steel2, cx - sd * (DW / 4 - .06), D0 + .66, zf + z + .04);
    });
    add(G.box(DW + .3, .05, .3, .02), C.plinth, dx, D0 + .025, zf + .15);
    add(G.box(.7, .012, .4, .01), '#8a6a52', dx, D0 + .056, zf + .48); for (let k = 0; k < 5; k++) add(G.box(.62, .004, .03, .002), '#6f5543', dx, D0 + .063, zf + .33 + k * .075);
    add(G.box(DW + .5, .07, .42, .02), C.roofD, dx, D0 + DH + .36, zf + .2, .32, 0, 0);
    for (const sd of [-1, 1]) add(G.box(.05, .05, .3, .01), C.post, dx + sd * (DW / 2 + .12), D0 + DH + .24, zf + .15, -.6, 0, 0);
    // a latticed window (right) — a window, plainly: high on the wall, a sill board under it, a header over it, lattice
    add(G.box(.66, .62, .05, .02), C.post, wx, y0 + 1.28, zf + .01); add(G.box(.56, .52, .02, .01), C.glass, wx, y0 + 1.28, zf + .03);
    for (const u of [-.14, 0, .14]) add(G.box(.02, .52, .02, .005), C.white, wx + u, y0 + 1.28, zf + .045);
    add(G.box(.56, .02, .02, .005), C.white, wx, y0 + 1.28, zf + .045);
    add(G.box(.78, .05, .14, .015), C.wood, wx, y0 + .95, zf + .07); add(G.box(.74, .05, .06, .015), C.post, wx, y0 + 1.62, zf + .04);
    // the timetable frame (empty — the clue one is set by the stage) left of the door, the route map on the east wall
    add(G.box(.46, .44, .04, .02), C.post, -.42, 1.22, zf + .02);
    add(G.box(.04, .36, .68, .02), C.post, W / 2 + .02, 1.3, .3);
    // a potted plant under the window (사용자 메모: it stood in the IC gate — moved clear of it): a terracotta pot with a rim, soil, a leafy plant
    { const px = wx + .2, pz = zf + .3;
      add(G.cyl(.16, .12, .28, 14), '#d98b5f', px, PY + .14, pz); add(G.cyl(.18, .18, .06, 14), '#c97a4f', px, PY + .28, pz); add(G.cyl(.15, .15, .02, 12), '#6b4a33', px, PY + .3, pz);
      leafBush(add, px, pz, .75, '#5fae5a', '#3f8f4f', null, PY + .29); }
  }));
  // the back and the west end (19판~ 다듬기 10/29: bare plaster over planks when the view turns round): two latticed windows and the
  // staff door on the back with a lamp over it, a vent, a downpipe from the eave; a small latticed window high on the west end
  f.add(mc('s4-st2-back', ({ add }) => {
    const zb = -zf;
    for (const x of [-1.05, .2]) {
      add(G.box(.62, .56, .05, .02), C.post, x, y0 + 1.3, zb - .01); add(G.box(.52, .46, .02, .01), C.glass, x, y0 + 1.3, zb - .03);
      for (const u of [-.13, 0, .13]) add(G.box(.02, .46, .02, .005), C.white, x + u, y0 + 1.3, zb - .045);
      add(G.box(.52, .02, .02, .005), C.white, x, y0 + 1.3, zb - .045);
      add(G.box(.72, .05, .13, .015), C.wood, x, y0 + .99, zb - .065); add(G.box(.68, .05, .06, .015), C.post, x, y0 + 1.6, zb - .04);
    }
    add(G.box(.64, 1.18, .05, .02), C.post, 1.18, y0 + .59, zb - .01); add(G.box(.52, 1.08, .03, .01), C.wood, 1.18, y0 + .56, zb - .03);
    for (const v of [.3, .62]) add(G.box(.44, .02, .015, .004), C.post, 1.18, y0 + v, zb - .048);
    add(G.box(.3, .22, .015, .005), C.glass2, 1.18, y0 + .88, zb - .046); add(G.cyl(.022, .022, .03, 8), C.steel2, 1.38, y0 + .58, zb - .055, HP, 0, 0);
    add(G.box(.7, .05, .26, .02), C.plinth, 1.18, .025, zb - .14);
    add(G.box(.06, .1, .1, .015), C.post, 1.18, y0 + 1.36, zb - .07); add(G.sph(.055, 10, 8), '#fff3c4', 1.18, y0 + 1.29, zb - .1);
    add(G.box(.24, .15, .03, .01), '#c9cdd6', -.42, y0 + 1.5, zb - .02); for (let k = 0; k < 3; k++) add(G.box(.2, .015, .02, .004), '#8f95a3', -.42, y0 + 1.45 + k * .045, zb - .04);
    add(G.cyl(.035, .035, H + .05, 8), C.steel2, -W / 2 + .2, y0 + (H + .05) / 2, zb - .06); add(G.box(.1, .05, .1, .01), C.steel2, -W / 2 + .2, .04, zb - .1);
    for (const v of [.5, 1.2, 1.75]) add(G.box(.06, .02, .08, .005), C.post, -W / 2 + .2, y0 + v, zb - .03);
    const xw = -W / 2;
    add(G.box(.05, .5, .56, .02), C.post, xw - .01, y0 + 1.35, -.15); add(G.box(.02, .4, .46, .01), C.glass, xw - .03, y0 + 1.35, -.15);
    for (const u of [-.12, .12]) add(G.box(.02, .4, .02, .005), C.white, xw - .045, y0 + 1.35, -.15 + u);
    add(G.box(.13, .05, .66, .015), C.wood, xw - .065, y0 + 1.07, -.15);
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
  // (no second eave place at wx + .2, zf + .3: the window's plant pot stands right there now — a thing put there sat inside the pot
  // and no view saw it, the bot circled it to the end of the clock, 봇 회귀 10/24)
  f.spot('beside', null, wx + .2, PY, zf + .62, { maxH: .3, label: '창 밑 화분', scale: .6 });
  f.walkSolids = [[-W / 2 - .08, 0, -D / 2 - .08, W / 2 + .08, 2.9, D / 2 + .08]];
  // (doors next to it swing by its walls, not by the box round its eaves and name board — room.js fitParts)
  f.collideBox = [-W / 2 - .08, 0, -D / 2 - .08, W / 2 + .08, y0 + H, D / 2 + .08];
};

// ── the ticket window (type ticketoffice — HAT_KEY 27 'code'; 사용자 메모 '창구 퀄'): a booth window in a thick frame — glass with a
// round speaking grille and a coin tray at its foot, a '매표소' board over it; a counter ledge; under it a panelled wooden cupboard
// whose door has a brass hasp where the code lock hangs (the timetable's ★ time opens it)
B.ticketoffice = f => {
  const CW = .82, CH = .6, CD = .34, y0 = .14;
  f.add(mc('s4-ticket2', ({ add }) => {
    add(G.box(.94, .7, .07, .03), C.post, 0, 1.16, .01);
    // the backing of the '매표소' board above the window (the board is a painted face 1 cm in front of it)
    add(G.box(.8, .22, .04, .015), C.post, 0, 1.6, .02);
    add(G.box(.8, .54, .02, .01), C.glass2, 0, 1.17, .045);
    add(G.box(.8, .02, .025, .005), C.white, 0, 1.3, .05);
    // the speaking grille: a silver ring with three bars; the coin tray: a dark dish set into the sill
    add(G.tor(.075, .014, Math.PI * 2, 6, 18), '#c9cdd6', 0, 1.06, .06); for (const k of [-1, 0, 1]) add(G.box(.12, .008, .01, .003), '#8f97ab', 0, 1.06 + k * .03, .058);
    add(G.box(.96, .06, .2, .02), C.wood, 0, .84, .1); add(G.box(.3, .03, .14, .01), '#4a4256', 0, .87, .09); add(G.box(.26, .015, .1, .006), '#c9cdd6', 0, .88, .095);
    add(G.box(.98, .03, .22, .01), C.woodD, 0, .805, .1);
    // the cupboard: back, sides, floor (open at the front for its door), a plinth, the ledge over it
    add(G.pbox(CW, CH, .03), C.woodD, 0, y0 + CH / 2, .015);
    for (const s2 of [-1, 1]) add(G.box(.04, CH, CD, .01), C.wood, s2 * (CW / 2 - .02), y0 + CH / 2, CD / 2);
    add(G.pbox(CW, .03, CD), C.woodD, 0, y0 + .015, CD / 2); add(G.box(CW + .06, y0, CD + .05, .02), C.plinth, 0, y0 / 2, CD / 2);
    add(G.box(CW + .08, .05, CD + .08, .015), C.wood, 0, y0 + CH + .025, CD / 2);
    // a call bell on the ledge
    add(G.cyl(.05, .055, .02, 14), C.dark, .32, .885, .12); add(G.sph(.045, 12, 6), '#e8eaf0', .32, .895, .12, 0, 0, 0, [1, .7, 1]); add(G.cyl(.008, .008, .03, 6), C.dark, .32, .94, .12);
  }));
  board(f, .74, .16, 360, (c, w, h) => {
    c.fillStyle = '#3a5f8a'; c.fillRect(0, 0, w, h);
    fitText(c, '매표소', w * .36, h * .52, w * .5, h * .7, '#ffffff');
    const other = tr('매표소') === '매표소' ? 'Tickets' : '매표소';
    c.font = FONT(Math.round(h * .36)); c.fillStyle = '#cfe2f5'; c.textAlign = 'center'; c.fillText(other, w * .8, h * .56, w * .34);
  }, 0, 1.6, .052, 0);
  const dv = grp(); put(dv, -CW / 2 + .04, y0 + CH / 2, CD + .005); f.add(dv);
  dv.add(mc('s4-ticket2-door', ({ add }) => {
    add(G.box(CW - .08, CH - .04, .03, .02), C.wood, CW / 2 - .04, 0, 0);
    add(G.box(CW - .22, CH - .2, .012, .01), '#c98f58', CW / 2 - .04, 0, .02);
    add(G.box(CW - .3, CH - .28, .01, .01), '#e0a76a', CW / 2 - .04, 0, .028);
    // the brass hasp plate the lock hangs from, and the knob
    add(G.box(.12, .16, .012, .01), '#e8b84a', CW - .2, .02, .03); add(G.tor(.03, .008, Math.PI * 2, 5, 12), '#c99a2e', CW - .2, .06, .04);
    add(G.sph(.025, 10, 8), '#e8b84a', CW - .12, -.12, .035);
  }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.6 * t; }, { label: '창구 서랍', sfx: 'open', dur: .3 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: CW - .2, y: -.02, z: .05, parent: dv };
  f.spot('inside', null, 0, y0 + .03, CD / 2, { part: p, maxH: CH - .1, label: '창구 서랍 안', scale: .8 });
  f.spot('on', null, -.18, .87, .14, { maxH: .28, label: '창구 선반', scale: .7 });
  f.walkSolids = [[-.47, 0, -.05, .47, 1.55, CD + .06]];
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
    // the station clock: a bracket from the beam, a thick dark rim round a white face, twelve hour marks (four bold), hands at
    // ten past ten with a red second hand and a centre cap — both faces; the name sign beside it
    { const cx = -.45, cy = 1.56, cz = .42;
      add(G.box(.04, .2, .04, .01), C.dark, cx, 1.76, cz); add(G.box(.12, .03, .05, .01), C.dark, cx, 1.85, cz);
      add(G.cyl(.2, .2, .08, 22), C.dark, cx, cy, cz, HP, 0, 0); add(G.tor(.19, .022, Math.PI * 2, 6, 24), '#4a4256', cx, cy, cz + .03); add(G.tor(.19, .022, Math.PI * 2, 6, 24), '#4a4256', cx, cy, cz - .03);
      for (const sd of [1, -1]) {
        const fz = cz + sd * .042;
        add(G.cyl(.17, .17, .006, 22), C.white, cx, cy, fz, HP, 0, 0);
        for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, big = k % 3 === 0; add(G.box(big ? .022 : .012, big ? .05 : .03, .006, .002), C.dark, cx + Math.sin(a) * .135, cy + Math.cos(a) * .135, fz + sd * .004, 0, 0, -a); }
        const hand = (a, L, wd, c) => add(G.box(wd, L, .006, .003), c, cx + Math.sin(a) * L / 2, cy + Math.cos(a) * L / 2, fz + sd * .008, 0, 0, -a);
        hand(-1.0 * sd, .085, .02, C.dark); hand(1.05 * sd, .12, .014, C.dark); hand(2.6 * sd, .13, .006, '#e8473f');
        add(G.cyl(.016, .016, .012, 10), C.dark, cx, cy, fz + sd * .012, HP, 0, 0);
      } }
    for (const x of [.15, .75]) add(G.cyl(.008, .008, .22, 4), C.dark, x, 1.8, .42);
    add(G.box(.75, .22, .04, .02), C.white, .45, 1.62, .42); add(G.box(.75, .045, .045, .01), C.mintD, .45, 1.53, .42);
  }));
  f.add(mt('s4-shelter2-roof', kawara(), ({ add }) => { add(G.box(L + .24, .1, D, .03), C.roof, 0, 1.96, 0, -.14, 0, 0, 1, { w: .55 }); }));
  f.add(mc('s4-shelter2-trim', ({ add }) => { add(G.box(L + .26, .05, .06, .01), C.roofD, 0, 1.9, D / 2 + .02); }));
  f.spot('under', null, .25, 0, -.12, { maxH: .3, label: '승강장 의자 밑', scale: .65 });
  f.spot('on', null, -.05, .48, -.12, { maxH: .3, label: '승강장 의자 위', scale: .65 });
  // (no place on the roof: its east half lies under the big cherry crown — a thing there sat inside the blossom where no view saw it
  // and the bot circled it to the end of the clock, 봇 회귀 1.0.209; the west half is where the straw hat lies — staging roofHat)
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
  // (in front, not beside: the gap between the bins and the vending machine at the back wall showed from no view — 봇 회귀 10/24)
  f.spot('beside', null, -.12, 0, .34, { maxH: .35, label: '쓰레기통 앞', scale: .6 });
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
  // (27판 실폰 10/30 "기차모델링 다시해줘", "그 기차 제발 문 열리면 안에 뚫어주고": the body was solid boxes — behind the opened door
  // a wall) the body as a shell: the far wall, both ends, the floor and the roof whole; the near side in pieces round the two
  // doorways, so an opened door shows the inside — a wood floor, long mint seats along both sides, grab poles by the doors, straps on
  // two rails, the ceiling and its lights, ad cards over the windows, the far side's doors and windows. Outside: the mint skirt,
  // a pink stripe and the cream upper on every piece, framed windows, door frames with steps, the ends' windscreens with wipers,
  // head- and tail-lights, the destination board, air-con and pantograph on the roof, bogies with springs and axle boxes
  const T = .06, ZN = D / 2 - T / 2, DX = [-.95, 1.15], DW = .54, DY0 = y0 + .03, DY1 = y0 + 1.03, IN = '#f6efe2';
  const band = (add, cx, sx, cz, sz, ya, yb) => {
    for (const [b0, b1, c] of [[y0, y0 + .46, C.mint], [y0 + .46, y0 + .52, C.pink2], [y0 + .52, y0 + Hb, C.cream]]) { const a = Math.max(ya, b0), b = Math.min(yb, b1); if (b - a > .001 && sx > .001) add(G.box(sx, b - a, sz, .004), c, cx, (a + b) / 2, cz); }
  };
  const WX = [-1.55, -.3, .45, 1.78];
  car.add(mc('s4-train2', ({ add, tube }) => {
    band(add, 0, L, -ZN, T, y0, y0 + Hb);
    for (const s of [-1, 1]) band(add, s * (L / 2 - T / 2), T, 0, D - 2 * T, y0, y0 + Hb);
    const xs = [-L / 2, DX[0] - DW / 2, DX[0] + DW / 2, DX[1] - DW / 2, DX[1] + DW / 2, L / 2];
    for (let k = 0; k < 6; k += 2) band(add, (xs[k] + xs[k + 1]) / 2, xs[k + 1] - xs[k], ZN, T, y0, y0 + Hb);
    for (const x of DX) { band(add, x, DW, ZN, T, DY1, y0 + Hb); band(add, x, DW, ZN, T, y0, DY0); }
    add(G.box(L - .02, .1, D - .02, .03), C.steel, 0, y0 + Hb + .05, 0); add(G.box(L - .2, .05, D - .2, .02), shade(C.steel, -.06), 0, y0 + Hb + .12, 0);
    add(G.box(L * .34, .14, .42, .03), C.steel2, -.25, y0 + Hb + .2, 0); for (let k = 0; k < 4; k++) add(G.box(.2, .015, .36, .004), shade(C.steel2, -.15), -.75 + k * .33, y0 + Hb + .28, 0);
    for (const x of [1.3, 1.75]) add(G.box(.26, .06, .26, .02), C.steel2, x, y0 + Hb + .15, 0);
    for (const s of [-1, 1]) add(G.box(.04, .32, .04, .01), C.dark, -1.55, y0 + Hb + .36, 0, 0, 0, s * .5);
    add(G.box(.62, .03, .05, .01), C.dark, -1.55, y0 + Hb + .46, 0); add(G.box(.3, .05, .3, .01), C.dark, -1.55, y0 + Hb + .17, 0);
    // windows outside on both sides, each with a steel frame; door frames and steps on the near side
    for (const z of [D / 2, -D / 2]) for (const x of WX) { const sz = Math.sign(z); add(G.box(.56, .46, .012, .02), C.steel, x, y0 + .88, z + sz * .004); add(G.box(.5, .4, .02, .05), C.glass, x, y0 + .88, z + sz * .01); add(G.box(.48, .03, .022, .01), C.glass2, x, y0 + 1.03, z + sz * .012); }
    for (const x of DX) { for (const s of [-1, 1]) add(G.box(.025, DY1 - DY0, .014, .004), C.steel2, x + s * (DW / 2 + .012), (DY0 + DY1) / 2, D / 2 + .004); add(G.box(DW + .05, .025, .014, .004), C.steel2, x, DY1 + .012, D / 2 + .004); add(G.box(DW, .03, .1, .01), C.steel, x, y0 - .02, D / 2 + .04); }
    // the far side's doors (shut) — seen from inside too
    for (const x of DX) { add(G.box(DW - .04, .98, T + .012, .02), C.mintD, x, y0 + .52, -ZN); for (const s of [-1, 1]) add(G.box(.16, .32, T + .02, .03), C.glass, x + s * .11, y0 + .74, -ZN); }
    // the cab ends: windscreen with wipers, the destination board, head- and tail-lights, a coupler
    for (const s of [-1, 1]) {
      const ex = s * (L / 2 + .015);
      add(G.box(.04, .56, D - .16, .08), C.steel, ex, y0 + .92, 0); add(G.box(.06, .5, D - .22, .08), C.glass, ex + s * .005, y0 + .92, 0);
      for (const z of [-.18, .18]) add(G.box(.012, .3, .02, .004), C.dark, ex + s * .04, y0 + .82, z, .5 * s * Math.sign(z), 0, 0);
      add(G.box(.05, .11, .44, .02), C.dark, ex + s * .01, y0 + 1.24, 0); add(G.box(.052, .07, .34, .02), '#ffe7a6', ex + s * .015, y0 + 1.24, 0);
      for (const z of [-.3, .3]) { add(G.cyl(.065, .065, .04, 12), C.steel, ex + s * .01, y0 + .3, z, 0, 0, HP); add(G.sph(.05, 10, 8), s > 0 ? '#fff3b0' : '#ff6b6b', ex + s * .03, y0 + .3, z); }
      add(G.box(.06, .1, D - .1, .03), C.dark, ex + s * .015, y0 + .08, 0); add(G.box(.14, .08, .12, .02), C.dark, ex + s * .07, y0 - .02, 0);
    }
    // under the floor: the frame, equipment boxes; the bogies (frame, axle boxes, springs, wheels)
    add(G.box(L - .2, .1, D - .14, .02), C.dark, 0, y0 - .05, 0); for (const x of [-.5, .3]) add(G.box(.5, .16, D - .3, .02), '#4a4256', x, y0 - .14, 0);
    for (const bx of [-1.45, 1.45]) {
      add(G.box(.95, .12, D - .1, .03), C.dark, bx, y0 - .08, 0);
      for (const z of [-.42, .42]) { add(G.box(.9, .1, .05, .02), '#4a4256', bx, .22, z); for (const wx of [-.28, .28]) { add(G.cyl(.12, .12, .06, 16), '#4a4256', bx + wx, .2, z * .8, HP, 0, 0); add(G.cyl(.05, .05, .07, 10), C.steel, bx + wx, .2, z * .8, HP, 0, 0); add(G.box(.09, .08, .06, .02), C.steel2, bx + wx, .22, z); } add(G.tor(.035, .012, Math.PI * 2, 4, 10), C.steel2, bx, .3, z, HP, 0, 0); }
    }
  }));
  // the inside (seen through an opened door): a wood floor, the walls' inner faces, the ceiling with its lights, the seats, poles,
  // straps and ad cards
  car.add(mc('s4-train2-in', ({ add, tube }) => {
    const IL = L - 2 * T, ID = D - 2 * T;
    add(G.box(IL, .04, ID, .01), '#d9b98a', 0, y0 + .01, 0); for (let k = 1; k < 9; k++) add(G.box(.008, .002, ID, .002), '#c4a172', -IL / 2 + k * IL / 9, y0 + .031, 0);
    add(G.box(IL, Hb - .06, .01, .004), IN, 0, y0 + .03 + (Hb - .06) / 2, -ZN + T / 2 + .006);
    add(G.box(IL, .02, ID, .005), IN, 0, y0 + Hb - .02, 0);
    for (const z of [-.16, .16]) { add(G.box(IL - .3, .025, .07, .01), '#fff6d6', 0, y0 + Hb - .04, z); }
    for (const x of WX) add(G.box(.5, .4, .012, .04), C.glass2, x, y0 + .88, -ZN + T / 2 + .012);
    for (const x of DX) { add(G.box(DW - .04, .98, .012, .02), C.mintD, x, y0 + .52, -ZN + T / 2 + .012); }
    for (const x of [-1.95, -.9, .2, 1.3]) add(G.box(.42, .14, .012, .01), ['#ffd9e6', '#cfe8ff', '#fff1b3', '#d8f2df'][(x * 10 | 0) & 3], x + .15, y0 + 1.2, -ZN + T / 2 + .014);
    for (const s of [-1, 1]) { const ex = s * (L / 2 - T - .006); add(G.box(.01, Hb - .06, ID, .004), IN, ex, y0 + .03 + (Hb - .06) / 2, 0); add(G.box(.012, .9, .44, .02), C.steel2, ex, y0 + .48, 0); add(G.box(.014, .3, .26, .02), C.glass2, ex, y0 + .74, 0); }
    // long seats: along the far wall the whole way, along the near wall between and beside the doors
    const seat = (x0, x1, zs) => { const w = x1 - x0, xc = (x0 + x1) / 2, z = zs * (ID / 2 - .16);
      add(G.box(w, .22, .26, .02), C.mintD, xc, y0 + .14, z); add(G.box(w, .08, .3, .04), C.mint, xc, y0 + .28, z + zs * .01);
      add(G.box(w, .32, .06, .03), C.mint, xc, y0 + .5, zs * (ID / 2 - .03), zs * .1, 0, 0); };
    seat(-IL / 2 + .1, IL / 2 - .1, -1);
    seat(-IL / 2 + .1, DX[0] - DW / 2 - .08, 1); seat(DX[0] + DW / 2 + .08, DX[1] - DW / 2 - .08, 1); seat(DX[1] + DW / 2 + .08, IL / 2 - .1, 1);
    // grab poles by the doors, the strap rails and their straps
    for (const x of DX) for (const s of [-1, 1]) tube([x + s * (DW / 2 + .06), y0 + .03, ZN - .14], [x + s * (DW / 2 + .06), y0 + Hb - .02, ZN - .14], .016, C.steel, 6);
    for (const z of [-.2, .2]) { tube([-IL / 2 + .1, y0 + Hb - .14, z], [IL / 2 - .1, y0 + Hb - .14, z], .012, C.steel, 5); for (let x = -1.8; x <= 1.85; x += .4) { add(G.box(.02, .14, .012, .004), '#f2eadf', x, y0 + Hb - .22, z); add(G.tor(.035, .009, Math.PI * 2, 4, 12), '#ffffff', x, y0 + Hb - .32, z); } }
  }));
  f.doors = [-.95, 1.15].map(x => { const d = grp(); put(d, x, y0 + .52, D / 2 + .008); car.add(d); f.live.push(d); d.add(mc('s4-train-door2', ({ add }) => { add(G.box(.5, .98, .02, .03), C.mintD, 0, 0, 0); add(G.box(.5, .06, .022, .01), C.pink2, 0, -.06, 0); for (const s of [-1, 1]) add(G.box(.16, .32, .01, .03), C.glass, s * .11, .22, .012); add(G.box(.02, .98, .024, .006), '#3f4a5a', -.24, 0, 0); add(G.box(.03, .16, .03, .01), C.steel, .19, -.02, .015); })); return d; });
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

// ── 개굴이's fishing bag (type tripbag; 사용자 메모 '낚시가방 퀄'): a soft canvas bag (woven, rounded), a front pocket with a flap and
// a brass buckle, a mesh side pocket, a zip round the lid, two leather straps over it, the shoulder strap arching behind; the rod in a
// tube holder at its side, its reel, the line and a red-white float clipped to the strap. The lid lifts (the bag bursts at the start).
B.s4_tripbag = f => {
  // (27판 실폰 10/30 "기차역 이거 다시모델링": a block with a flap, the rod stuck up through the opened flap) 개굴이's fishing bag
  // as a soft tackle bag: a rounded canvas body on a dark rubber base, piping along its edges, a zipped front pocket with a fish
  // patch, a mesh side pocket with a lure tin in it, two carry handles and the shoulder strap; the rod now lies in its own case
  // strapped along the back (the reel showing at its end), the float clipped to the strap
  const W = .64, H = .32, D = .38, CANV = '#7cc47a', CANV2 = '#5fae5a', LEA = '#a8733f', PIPE = '#3f8a4a';
  f.add(mt('s4-tripbag3', TX.cloth(), ({ add }) => {
    add(G.box(W, H - .04, D, .09), CANV, 0, .04 + (H - .04) / 2, 0, 0, 0, 0, 1, { w: .12 });
    add(G.box(.4, .17, .06, .04), CANV2, -.04, .15, D / 2 + .02, 0, 0, 0, 1, { w: .12 });
    add(G.box(.07, .2, .22, .03), '#9fd4a0', -W / 2 - .03, .14, 0, 0, 0, 0, 1, { w: .08 });
  }));
  f.add(mc('s4-tripbag3-bits', ({ add, tube }) => {
    add(G.box(W + .02, .05, D + .02, .02), '#3f4a3a', 0, .025, 0);
    for (const [y, z] of [[H - .005, D / 2 - .01], [H - .005, -D / 2 + .01], [.06, D / 2], [.06, -D / 2]]) tube([-W / 2 + .03, y, z], [W / 2 - .03, y, z], .012, PIPE, 5);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tube([sx * (W / 2 - .005), .06, sz * (D / 2 - .01)], [sx * (W / 2 - .005), H - .01, sz * (D / 2 - .01)], .011, PIPE, 5);
    // the front pocket: its zip with a pull, the fish patch
    add(G.box(.38, .01, .012, .003), C.dark, -.04, .225, D / 2 + .052); add(G.box(.02, .045, .014, .004), '#e8b84a', .13, .205, D / 2 + .056);
    add(G.box(.13, .07, .008, .004), '#fff6e0', -.08, .14, D / 2 + .052); add(G.sph(.026, 8, 6), '#5aa0d8', -.09, .14, D / 2 + .058, 0, 0, 0, [1.4, .7, .3]); add(G.cone(.018, .03, 3), '#5aa0d8', -.04, .14, D / 2 + .058, 0, 0, HP, [1, 1, .3]);
    // the mesh side pocket (net lines) with a red lure tin in it
    for (let k = 0; k < 4; k++) add(G.box(.075, .006, .23, .002), '#6aa86a', -W / 2 - .03, .07 + k * .045, 0);
    add(G.box(.05, .05, .1, .01), C.red, -W / 2 - .045, .25, .03);
    // the carry handles over the top, front and back straps they hang from
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.05, .1, .012, .005), LEA, sx * .15, H - .03, sz * (D / 2 + .005));
    for (const sz of [-1, 1]) for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI, b = (k + 1) / 4 * Math.PI; tube([-.15 * Math.cos(a), H + .1 * Math.sin(a), sz * (D / 2 - .04)], [-.15 * Math.cos(b), H + .1 * Math.sin(b), sz * (D / 2 - .04)], .013, LEA, 5); }
    // the shoulder strap, slack on the platform at the right end, with the float clipped on it
    const pts = [[W / 2 - .01, .22, -.12], [W / 2 + .13, .015, -.06], [W / 2 + .15, .015, .1], [W / 2 - .01, .22, .15]];
    for (let k = 0; k < 3; k++) tube(pts[k], pts[k + 1], .016, LEA, 5);
    add(G.sph(.033, 10, 8), C.red, W / 2 + .16, .045, .02, 0, 0, 0, [1, 1.2, 1]); add(G.sph(.031, 10, 6), C.white, W / 2 + .16, .085, .02, 0, 0, 0, [1, .7, 1]); add(G.cyl(.004, .004, .05, 4), C.dark, W / 2 + .16, .13, .02);
    // the rod case lying along the back, two buckled straps holding it, the reel and the rod's butt at its end
    const RZ = -D / 2 - .09, RY = .07;
    add(G.cyl(.05, .05, .92, 14), '#4f7a4a', .04, RY, RZ, 0, 0, HP); for (const s of [-1, 1]) add(G.cyl(.054, .054, .05, 14), C.dark, .04 + s * .46, RY, RZ, 0, 0, HP);
    for (const x of [-.18, .26]) { add(G.tor(.056, .01, Math.PI * 2, 4, 14), LEA, x, RY, RZ, 0, HP, 0); add(G.box(.03, .025, .015, .004), '#e8b84a', x, RY + .055, RZ); }
    add(G.cyl(.016, .02, .14, 8), '#6b4a33', .57, RY, RZ, 0, 0, HP); add(G.cyl(.045, .045, .035, 14), C.steel2, .6, RY + .06, RZ, HP, 0, 0); add(G.cyl(.01, .01, .05, 6), C.dark, .6, RY + .06, RZ + .04, HP, 0, 0);
  }));
  const lid = grp(); put(lid, 0, H, -D / 2); f.add(lid);
  lid.add(mt('s4-tripbag3-flap', TX.cloth(), ({ add }) => { add(G.box(W + .02, .06, D + .02, .03), CANV, 0, .02, D / 2, 0, 0, 0, 1, { w: .12 }); }));
  lid.add(mc('s4-tripbag3-flapbits', ({ add, tube }) => {
    for (const z of [.01, D]) tube([-W / 2 + .03, .05, z], [W / 2 - .03, .05, z], .012, PIPE, 5);
    for (const sx of [-1, 1]) tube([sx * (W / 2 - .005), .05, .01], [sx * (W / 2 - .005), .05, D], .012, PIPE, 5);
    add(G.box(W - .12, .006, .012, .003), C.dark, 0, .054, D - .03); add(G.box(.02, .012, .045, .004), '#e8b84a', .2, .056, D - .01);
    add(G.box(.16, .008, .1, .004), CANV2, -.05, .055, D / 2);
  }));
  const p = f.part('lift', lid, t => { lid.rotation.x = -1.9 * t; }, { label: '낚시 가방', sfx: 'lift', dur: .32 });
  // (the bag's body is one solid block: what was put inside sat buried in it — as the flap lifts, a lining tray rises to the rim
  // with the thing on it, 봇 회귀 10/24)
  f.pullOut(p, f.spot('inside', null, 0, .03, 0, { part: p, maxH: .22, label: '낚시 가방 안', scale: .7 }), 0, { w: W - .14, d: D - .1, color: '#e9dcb8', up: H - .02 });
  f.spot('beside', null, -.5, 0, .14, { maxH: .3, label: '낚시 가방 옆', scale: .6 });
  f.walkSolids = [[-.38, 0, -.34, .66, .36, .24]];
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
// two vending machines (red, blue), facing +z (사용자 메모 '그 앞 자판기 퀄'): a lit header band, a deep display window of three
// shelves of cans and bottles with price strips and push buttons, the coin slot, note slot, a little green display and the change
// lever, a poster panel, the take-out pocket with its flap, a dark kick plate; the white cap and side trim
B.s4_vend = f => {
  const W = .66, Hh = 1.72, D = .6, zf = D / 2, DR = ['#ffd23f', '#7fd6c0', '#ff8f6b', '#ffffff', '#9fc4ff', '#c9a6ff', '#8fdc7a'];
  f.add(mc('s4-vend2', ({ add, tube }) => {
    [[-.35, C.red, '#c93a33'], [.35, C.blue, '#3a74b8']].forEach(([x, c, cd], n) => {
      add(G.box(W, Hh, D, .05), c, x, Hh / 2, 0);
      add(G.box(W + .02, .05, D + .02, .02), '#ffffff', x, Hh + .01, 0);
      for (const sd of [-1, 1]) add(G.box(.015, Hh - .1, D - .1, .005), cd, x + sd * (W / 2 + .003), Hh / 2, 0);
      // the header: a white lit band with the brand stripe
      add(G.box(W - .06, .13, .03, .02), '#f4f7fb', x, Hh - .12, zf + .005); add(G.box(W - .1, .04, .032, .01), cd, x, Hh - .12, zf + .008);
      // the display window: a pale lit back, three shelves; cans and bottles; a price strip and a button under each
      add(G.box(W - .08, .72, .02, .02), '#ffffff', x, 1.17, zf + .002); add(G.box(W - .12, .66, .02, .01), '#eef6ff', x, 1.17, zf + .006);
      for (let r = 0; r < 3; r++) {
        const y = .9 + r * .21;
        add(G.box(W - .12, .012, .05, .004), '#c9cdd6', x, y, zf - .005);
        for (let k = 0; k < 5; k++) {
          const ix = x - .2 + k * .1, col = DR[(r * 5 + k + n * 2) % DR.length];
          if ((k + r) % 2) { add(G.cyl(.028, .028, .1, 10), col, ix, y + .06, zf - .01); add(G.cyl(.022, .022, .006, 10), '#c9cdd6', ix, y + .113, zf - .01); }
          else { add(G.cyl(.026, .026, .08, 10), col, ix, y + .05, zf - .01); add(G.cone(.026, .035, 10), col, ix, y + .107, zf - .01); add(G.cyl(.011, .011, .02, 8), '#ffffff', ix, y + .13, zf - .01); }
          add(G.box(.07, .018, .01, .004), '#ffffff', ix, y - .025, zf + .022); add(G.cyl(.009, .009, .012, 8), '#4a8fd8', ix + .02, y - .025, zf + .032, HP, 0, 0);
        }
      }
      // controls (right) and a poster panel (left) under the window
      add(G.box(.2, .3, .03, .02), '#f4f7fb', x + .17, .66, zf + .006);
      add(G.box(.05, .012, .01, .003), C.dark, x + .2, .76, zf + .024); add(G.box(.09, .016, .01, .003), C.dark, x + .17, .71, zf + .024);
      add(G.box(.1, .05, .01, .005), '#5fbf7a', x + .17, .63, zf + .024); add(G.cyl(.016, .016, .02, 8), '#c9cdd6', x + .21, .56, zf + .028, HP, 0, 0);
      add(G.box(.32, .3, .02, .02), '#ffffff', x - .12, .66, zf + .004); add(G.box(.28, .12, .022, .01), n ? '#ffd23f' : '#7fd6c0', x - .12, .7, zf + .006); add(G.cyl(.04, .04, .024, 12), n ? '#ff8f6b' : '#ffffff', x - .16, .6, zf + .006, HP, 0, 0);
      // the take-out pocket and its flap, the kick plate
      add(G.box(.46, .2, .03, .02), '#2f2a3a', x, .3, zf + .004); add(G.box(.42, .12, .02, .01), '#5b5672', x, .33, zf + .02, -.25, 0, 0);
      add(G.box(W, .08, .03, .01), '#3a3048', x, .04, zf + .004);
      // the back, seen from the far side of the platform (19판~ 다듬기 10/29: it was the whole red / blue body): a grey sheet-metal back
      // in a coloured rim, two banks of vent louvres, a rating plate, the power cord down to its plug
      add(G.box(W - .08, Hh - .16, .02, .02), '#c9cdd6', x, Hh / 2 + .02, -zf - .006);
      for (const y0 of [1.15, .3]) for (let k = 0; k < 5; k++) add(G.box(W - .26, .026, .014, .005), '#8f95a3', x, y0 + k * .06, -zf - .018);
      add(G.box(.15, .1, .01, .004), '#ffffff', x + .14, .86, -zf - .018); add(G.box(.11, .016, .006, .002), cd, x + .14, .89, -zf - .024);
      tube([x - .2, .55, -zf - .02], [x - .21, .05, -zf - .06], .014, '#2f2a3a', 6); add(G.box(.06, .035, .06, .01), '#2f2a3a', x - .21, .02, -zf - .07);
    });
  }));
  f.spot('beside', null, .82, 0, .1, { maxH: .45, label: '자판기 옆', scale: .7 });
  f.spot('on', null, .3, Hh + .04, 0, { maxH: .3, label: '자판기 위', scale: .6 });
  f.walkSolids = [[-.69, 0, -.31, .69, Hh, .31]];
};
// the round red postbox
B.s4_post = f => {
  f.add(mc('s4-post', ({ add }) => {
    add(G.cyl(.21, .21, .84, 18), C.red, 0, .52, 0); add(G.sph(.21, 18, 8), C.red, 0, .94, 0, 0, 0, 0, [1, .55, 1]);
    add(G.cyl(.23, .23, .05, 18), '#c93a33', 0, .96, 0);
    add(G.cyl(.13, .15, .1, 12), '#4a4256', 0, .05, 0);
    // (19판~ 다듬기 10/29: one slot and a white square) two letter slots with their lips, the white plate with the red 〒 mark, a band
    // round the foot, the collection door below with its brass keyhole, a little sign on top
    for (const sx of [-.07, .07]) { add(G.box(.1, .028, .05, .01), C.dark, sx, .78, .19); add(G.box(.12, .02, .05, .008), '#e04a40', sx, .805, .2, -.35, 0, 0); }
    add(G.box(.17, .13, .02, .01), C.white, 0, .6, .205); add(G.box(.1, .016, .01, .004), C.red, 0, .635, .217); add(G.box(.1, .016, .01, .004), C.red, 0, .605, .217); add(G.box(.016, .07, .01, .004), C.red, 0, .575, .217);
    add(G.cyl(.215, .215, .04, 18), '#c93a33', 0, .14, 0);
    add(G.box(.2, .2, .02, .01), '#d8423a', 0, .34, .205); add(G.cyl(.013, .013, .016, 8), '#e8c66a', .07, .34, .218, HP, 0, 0);
    add(G.box(.16, .06, .03, .01), '#fbf7f0', 0, 1.06, 0); add(G.cyl(.012, .012, .06, 6), '#c93a33', 0, 1.0, 0);
  }));
  f.spot('behind', null, -.1, 0, -.38, { maxH: .35, label: '우체통 뒤', scale: .6 });
  f.walkSolids = [[-.22, 0, -.22, .22, 1.05, .22]];
};
// the cherry tree — the stage's face (opts.s: its size; 사용자 메모 '벚꽃나무 퀄'): a thick leaning trunk with a root flare, limbs that
// fork up into the crown and show between the clumps, and a crown of cauliflower clumps — each a core and seven lobes, lighter on
// top, deeper pink underneath — printed with small five-petal flowers; a few loose sprays hang below the crown's edge
const CROWN = [[0, 2.2, 0, 1.0], [.8, 2.0, .25, .72], [-.75, 2.05, -.1, .75], [.15, 2.55, -.55, .72], [-.25, 1.9, .65, .62], [.45, 2.7, .35, .6], [-.6, 2.6, .25, .55], [.9, 2.45, -.4, .5], [-.9, 2.2, .55, .5], [.6, 2.0, .8, .5]];
B.s4_sakura = (f, T, o = {}) => {
  const k = o.s || 1, LIMB = [[.75, 2.05, .2], [-.7, 2.1, -.05], [.12, 2.45, -.5], [-.25, 1.95, .55], [.55, 1.95, .7]];
  f.add(mt('s4-sakura2-wood|' + k, TX.bark(), ({ add, tube }) => {
    add(G.cyl(.17 * k, .27 * k, 1.5 * k, 12), C.bark, 0, .75 * k, 0, 0, 0, .05, 1, { w: .4 });
    for (const a of [0, 1.6, 3.2, 4.7]) add(G.cyl(.05 * k, .13 * k, .5 * k, 6), C.bark, Math.cos(a) * .25 * k, .1 * k, Math.sin(a) * .25 * k, Math.sin(a) * .95, 0, -Math.cos(a) * .95, 1, { w: .4 });
    for (const [x, y, z] of LIMB) {
      const m = [x * .45 * k, (1.35 + (y - 1.35) * .5) * k, z * .45 * k];
      tube([0, 1.3 * k, 0], m, .1 * k, C.bark, 7, .07 * k, { w: .4 }); tube(m, [x * k, y * k, z * k], .07 * k, C.bark, 6, .04 * k, { w: .4 });
      tube(m, [x * .8 * k + .2 * k, (y + .2) * k, z * .8 * k - .15 * k], .04 * k, C.bark, 5, .02 * k, { w: .4 });
    }
  }));
  f.add(mt('s4-sakura2-crown|' + k, blossomTex(), ({ add }) => {
    CROWN.forEach(([dx, dy, dz, r], ci) => {
      const cx = dx * k, cy = dy * k, cz = dz * k, R = r * k;
      add(G.sph(R * .78, 14, 10), C.pink, cx, cy, cz, 0, 0, 0, [1, .82, 1], { w: .45 });
      for (let j = 0; j < 7; j++) {
        const a = j * .9 + ci * 1.3, e = ((j % 3) - 1) * .5, ox = Math.cos(a) * Math.cos(e), oy = Math.sin(e) * .7 + .12, oz = Math.sin(a) * Math.cos(e);
        const col = oy > .3 ? C.pink3 : oy < -.1 ? '#f7aecb' : (j % 2 ? C.pink : C.pink2);
        add(G.sph(R * (.42 + .08 * (j % 2)), 12, 9), col, cx + ox * R * .58, cy + oy * R * .5, cz + oz * R * .58, 0, a, 0, [1, .84, 1], { w: .45 });
      }
    });
    for (const [x, y, z] of [[1.15, 1.75, .45], [-1.05, 1.8, .2], [.35, 1.7, 1.05], [-.4, 1.7, -.9], [1.0, 1.85, -.6]]) for (let j = 0; j < 4; j++) add(G.sph(.11 * k, 8, 6), j % 2 ? C.pink2 : C.pink, (x + (j - 1.5) * .07) * k, (y - j * .05) * k, (z + (j % 2) * .06) * k, 0, 0, 0, [1, .85, 1], { w: .3 });
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
    add(G.box(1.52, .05, .09, .02), C.steel2, 0, 1.335, -.03); add(G.box(1.5, .025, .07, .01), C.steel2, 0, .675, -.03);
  }));
  // (19판~ 다듬기 10/29: its back was a bare grey slab) printed on both faces, as a real station-name board is
  const nameFace = (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    fitText(c, '벚꽃마을', w / 2, h * .3, w * .6, h * .3, '#3a3048');
    const other = tr('벚꽃마을') === '벚꽃마을' ? 'Sakura Town' : '벚꽃마을';
    c.font = FONT(Math.round(h * .12)); c.fillStyle = '#6b6478'; c.textAlign = 'center'; c.fillText(other, w / 2, h * .54, w * .6);
    c.fillStyle = '#5fae8a'; c.fillRect(0, h * .66, w, h * .12);
    fitText(c, '◀ 몽글동', w * .2, h * .87, w * .36, h * .13, '#3a3048'); fitText(c, '바닷가 ▶', w * .8, h * .87, w * .36, h * .13, '#3a3048');
  };
  board(f, 1.38, .54, 700, nameFace, 0, 1.0, .0, 0);
  board(f, 1.38, .54, 700, nameFace, 0, 1.0, -.06, Math.PI);
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
// the IC card-reader stand (사용자 메모 '왼쪽 기둥 퀄·뚫리지 않게'): a rounded base plate, a slim white body with a blue stripe, an
// angled reader head whose pad glows blue with the card mark, a green arrow lamp facing the platform
B.s4_icgate = f => {
  f.add(mc('s4-icgate2', ({ add }) => {
    add(G.box(.34, .04, .34, .02), '#8f97ab', 0, .02, 0);
    add(G.box(.22, .86, .24, .06), '#f1f3f7', 0, .47, 0);
    for (const s2 of [-1, 1]) add(G.box(.012, .7, .26, .005), '#4a8fd8', s2 * .11, .45, 0);
    add(G.box(.26, .12, .3, .04), '#dfe3ea', 0, .95, .01, -.35, 0, 0);
    add(G.box(.18, .02, .2, .02), '#7fbff0', 0, 1.01, .02, -.35, 0, 0); add(G.tor(.04, .008, Math.PI * 2, 5, 14), '#ffffff', 0, 1.022, .025, HP - .35, 0, 0);
    add(G.box(.14, .1, .012, .02), '#2f3a4a', 0, .72, .122); add(G.cone(.03, .05, 3), '#7fe08a', .01, .72, .13, 0, 0, -HP);
    add(G.box(.12, .04, .01, .005), '#4a8fd8', 0, .58, .121);
  }));
  f.spot('beside', null, .26, 0, .1, { maxH: .3, label: '개찰기 옆', scale: .55 });
  f.walkSolids = [[-.17, 0, -.17, .17, 1.05, .17]];
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

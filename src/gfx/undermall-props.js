// 40판 「지하상가」 (undermall, 4장 보스 — 10/23 상가 장 새 맵 ⑨): 마감 시간의 지하상가 단면. 가운데 통로를 두고 뒤 벽(북)과 왼쪽
// 벽(서)에 작은 가게 칸이 줄지어 있고, 통로 끝(동)에 관리실(금고), 왼쪽 뒤 구석에 지상으로 오르는 에스컬레이터 입구, 앞 왼쪽에
// 지하철로 이어지는 회전문. 천장은 잘라 내고 뒤 벽 위로 천장 판 단면 → 흙 → 지상 보도(가로수·가로등·출구 1 지붕)가 보여 '지하'를 말한다.
// 앞(남)·오른쪽(동) 가장자리는 단면: 낮은 턱 위에 잘린 면(짙은 색), 받침은 둥근 층(콘크리트 → 흙 → 깊은 흙, 수도관 단면).
// 모델은 1~10판처럼 덩어리 큰 것을 hmc 한 덩어리로(외곽선이 잘 나옴), 큰 면은 순한 색, 쨍한 색은 작은 것에만. 글자는 게임 폰트.
// 부품 이름(② 레벨과 맞춤): um_hall · um_shopstall(variant: clothes·snack·keys·flower — part0 = 셔터 레버) · um_office(part0 열쇠 걸이함) ·
//   um_safe(금고, 마지막 자물쇠 — 안에 간식) · um_escalator(컨베이어 변형) · um_revolvingdoor(회전문) · um_lockers(물품 보관함) ·
//   um_kiosk(분식 매대) · um_mapboard(안내 지도판 — 뒤집기). 장치는 모두 '터치하면 저절로 끝까지'(설계서 원칙 8).
import * as THREE from 'three';
import { grp, put, mat, mesh, geo, texCache, roundRect } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { fitText, textTex, paperFill } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';

const PI = Math.PI, HP = PI / 2;
const stage = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
const sm = x => x * x * (3 - 2 * x);
const dome = (r, ws = 14, hs = 5) => new THREE.SphereGeometry(r, ws, hs, 0, PI * 2, 0, HP);
// 색: 큰 면은 순하게(크림·옅은 청록·연회색), 포인트는 작은 것에만
const C = {
  ink: '#4a3b52', cut: '#6d6577', cut2: '#585164', cream: '#f8f9f7', wall: '#f2f5f4', wall2: '#e3e9e8', tile: '#d7e6e2', grout: '#f6f8f7',
  soffit: '#f3f6f5', soffit2: '#dfe6e6', tube: '#fbfdff', steel: '#c9cfd8', steel2: '#a9b1bd', dark: '#3d3a52', rubber: '#3b3550',
  conc: '#d5d9d8', conc2: '#c3c9c9', earth: '#b98f68', earth2: '#a27c5a', deep: '#8a6648', stone: '#cfd1cd', stone2: '#b7bab6',
  walk: '#e2e4e0', walk2: '#cdd1cc', base: '#a9a49a', grass: '#9fd27a', leaf: '#7cc46a', leaf2: '#5fae5a', trunk: '#9a6b45',
  coral: '#ef8a7e', mustard: '#f2b544', mint: '#8fd1bf', sky: '#8cc6e6', navy: '#5d74a8', lilac: '#b9a6e8', pink: '#f5a6bd', red: '#e8604c',
  yellow: '#f7d354', wood: '#e3b37c', woodD: '#b8834f', glassC: '#cfe8ef', brass: '#e6b94e', white: '#fdfefc',
};
const B = {};
const tex = texCache();

// ── 글자 (게임 폰트, 한·영 같이)
const WORDS = {
  '몽글 옷방': 'Mongle Closet', '하나둘 분식': 'Hana-Dul Snacks', '열쇠 · 도장': 'Keys & Stamps', '꽃 한 송이': 'One Flower',
  '관리실': 'Office', '물품 보관함': 'Lockers', '지하철 연결': 'To Subway', '출구 1': 'Exit 1', '안내': 'Info', '분실물': 'Lost & Found',
  '오늘은 일찍 닫아요': 'Closing early today', '떡볶이': 'Tteokbokki', '어묵': 'Fish cake', '순대': 'Sundae', '튀김': 'Fritters',
  '오늘의 메뉴': "Today's Menu", '세일': 'SALE', '지하상가 안내도': 'Mall Map', '현위치': 'You are here', '옷': 'Clothes', '분식': 'Snacks',
  '열쇠': 'Keys', '꽃': 'Flowers', '보관함': 'Lockers', '까꿍!': 'Peekaboo!', '미끄럼 주의': 'Wet Floor', '금고': 'Safe', '근무 일지': 'Duty Log',
  '마감 10시': 'Closes 10 pm', '버스 정류장': 'Bus Stop', '마을버스 7': 'Village Bus 7', '지하 1층': 'B1', '오늘의 꽃': "Today's Flowers", '사용 중': 'In use', '비어 있음': 'Free',
};
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

// a label on a plane: draw(c, W, H) at 1x units into a canvas sized to the plane's own aspect (glyphs never stretched)
function label(parent, key, w, h, draw, x, y, z, rx = 0, ry = 0, rz = 0) {
  const cw = 512, ch = Math.max(64, Math.round(cw * h / w / 2) * 2);
  const t = tex.get('um-' + key, () => textTex(cw, ch, draw));
  const m = mesh(geo(`um-pl|${w}|${h}`, () => new THREE.PlaneGeometry(w, h)), mat('#ffffff', { map: t, rim: 0 }), { cast: false });
  put(m, x, y, z, rx, ry, rz); parent.add(m); return m;
}
// a shop sign: rounded board in bg, the name in fg
const signDraw = (word, bg, fg, o = {}) => (c, W, H) => {
  c.fillStyle = bg; roundRect(c, 0, 0, W, H, Math.min(W, H) * .18); c.fill();
  if (o.edge) { c.strokeStyle = o.edge; c.lineWidth = Math.max(2, H * .07); roundRect(c, H * .06, H * .06, W - H * .12, H - H * .12, Math.min(W, H) * .14); c.stroke(); }
  fitText(c, word, W / 2, H / 2 + H * .03, W * .84, H * (o.size || .6), fg, { weight: 'bold', lines: o.lines || 1 });
};

// ── small builders shared by the pieces (all into one hmc mesh)
function flowerBunch(add, tube, x, y, z, kind, s = 1) {
  const stems = kind === 'sun' ? 3 : 6;
  for (let k = 0; k < stems; k++) {
    const a = k * 2.4, r = .045 * s, sx = x + Math.cos(a) * r, sz = z + Math.sin(a) * r, top = y + (.34 + (k % 3) * .05) * s;
    tube([x, y, z], [sx, top, sz], .008 * s, C.leaf2, 5);
    if (kind === 'tulip') { add(G.sph(.042 * s, 8, 6), [C.red, C.yellow, C.pink][k % 3], sx, top + .02 * s, sz, 0, 0, 0, [1, 1.35, 1]); }
    else if (kind === 'rose') { add(G.sph(.046 * s, 8, 6), k % 2 ? C.pink : '#f27f9c', sx, top + .02 * s, sz); add(G.tor(.032 * s, .012 * s, PI * 2, 4, 10), '#fbd0dc', sx, top + .045 * s, sz, HP, 0, 0); }
    else if (kind === 'sun') { add(G.cyl(.075 * s, .075 * s, .02 * s, 12), C.yellow, sx, top + .03 * s, sz + .02, HP - .3, 0, 0); add(G.cyl(.04 * s, .04 * s, .026 * s, 10), '#8a5a35', sx, top + .03 * s, sz + .03, HP - .3, 0, 0); }
    else { for (let q = 0; q < 3; q++) add(G.sph(.02 * s, 6, 4), C.white, sx + (q - 1) * .02 * s, top + (q % 2) * .02 * s, sz); }
    if (k % 2 === 0) add(G.sph(.03 * s, 6, 4), C.leaf, sx + .02, top - .12 * s, sz, 0, 0, 0, [1.4, .6, 1]);
  }
}
function bucket(add, x, y, z, s = 1) {
  add(G.cyl(.13 * s, .1 * s, .26 * s, 14), C.steel, x, y + .13 * s, z);
  add(G.tor(.128 * s, .012 * s, PI * 2, 4, 16), C.steel2, x, y + .26 * s, z, HP, 0, 0);
  add(G.cyl(.12 * s, .12 * s, .01, 14), '#a8c8d8', x, y + .22 * s, z);
}
function shirt(add, x, y, z, c, s = 1) {
  add(G.box(.24 * s, .3 * s, .05 * s, .03), c, x, y - .16 * s, z);
  for (const sx of [-1, 1]) add(G.box(.08 * s, .12 * s, .045 * s, .02), c, x + sx * .14 * s, y - .06 * s, z, 0, 0, sx * .5);
  add(G.box(.08 * s, .02 * s, .055 * s, .008), '#ffffff', x, y - .02 * s, z);
  add(G.tor(.035 * s, .006 * s, PI, 3, 8), C.steel2, x, y + .02 * s, z, 0, 0, 0);
}
function stool(add, x, y, z, seat = C.red) {
  for (const [dx, dz] of [[-.1, -.1], [.1, -.1], [-.1, .1], [.1, .1]]) add(G.cyl(.014, .018, .42, 6), C.steel2, x + dx, y + .21, z + dz);
  add(G.cyl(.16, .16, .06, 16), seat, x, y + .45, z);
  add(G.tor(.15, .012, PI * 2, 4, 16), C.steel, x, y + .15, z, HP, 0, 0);
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// um_hall — 통로·천장 단면 건물 (8 × 6, 맵 원점). 받침(둥근 층) · 뒤 벽 둘(북·서) + 그 위 천장 단면·흙·지상 보도 · 가게 위 천장 처마
// (형광등) · 기둥 · 앞 단면 턱 · 통로 소품(벤치와 놓고 간 장바구니, 대걸레 카트, 미끄럼 주의, 분실물 상자, 분리수거함, 소화기, 점자 블록)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const X0 = -4, X1 = 4, Z0 = -3, Z1 = 3, CEIL = 2.7, SOF = 2.42, WT = .22, BACK = .95, NX1 = 2.4, WZ1 = 1.0;
B.um_hall = f => {
  f.noSolid = true;
  // (doors and drawers test what they open into by each piece's box: the hall's is only its floor slab, or nothing could open)
  f.collideBox = [X0, -1, Z0, X1, -.06, Z1];
  f.walkBoxes = [
    // (corner pillar)
    [-2.86, 0, -1.72, -2.5, 2.7, -1.36],
    // (bench)
    [-.98, 0, 2.18, .18, .9, 2.66],
    // (mop cart + wet-floor sign)
    [1.7, 0, .38, 2.4, 1.0, .9],
    // (lost-and-found box)
    [3.25, 0, .3, 3.86, .6, .82],
    // (recycling bins)
    [-2.62, 0, 2.53, -2.18, .9, 2.97],
    // (the cut rim)
    [X0 - .05, 0, Z1 - .02, X1 + .05, .4, Z1 + .2], [X1 - .02, 0, Z0, X1 + .2, .4, Z1 + .05],
  ];
  f.add(mc('um-hall-base', ({ add, tube }) => {
    // ── the island: round-cornered tiers, each a little inset (concrete floor slab → earth with stones → deep earth)
    const bx0 = X0 - WT - .1, bx1 = X1 + .15, bz0 = Z0 - WT - .1, bz1 = Z1 + .15, cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2, bw = bx1 - bx0, bd = bz1 - bz0;
    add(G.box(bw, .2, bd, .06, 2), C.conc, cx, -.1, cz);
    add(G.box(bw + .02, .035, bd + .02, .015), C.cut, cx, -.2, cz);
    add(G.box(bw - .08, .52, bd - .08, .16, 2), C.earth, cx, -.47, cz);
    add(G.box(bw - .26, .34, bd - .26, .24, 2), C.deep, cx, -.88, cz);
    // stones and roots on the two near faces (south, east) of the earth layer
    for (let k = 0; k < 22; k++) {
      const u = (k * 37 % 100) / 100, v = ((k * 53) % 100) / 100, r = .06 + (k % 3) * .025;
      add(G.sph(r, 8, 6), k % 2 ? C.stone : C.stone2, bx0 + .3 + u * (bw - .6), -.3 - v * .36, bz1 - .04, 0, 0, 0, [1.3, .8, .5]);
      if (k < 14) add(G.sph(r, 8, 6), k % 2 ? C.stone2 : C.stone, bx1 - .04, -.3 - v * .36, bz0 + .4 + u * (bd - .8), 0, 0, 0, [.5, .8, 1.3]);
    }
    // utility pipes running through the earth (a water main and a cable duct), cut at the east face
    tube([bx0 + .2, -.5, bz1 - .1], [bx1 + .02, -.5, bz1 - .1], .09, C.sky, 14);
    tube([bx1 - .9, -.62, bz0 + .6], [bx1 + .02, -.62, bz0 + .6], .07, C.stone2, 12);
    add(G.cyl(.06, .06, .03, 12), C.dark, bx1 + .03, -.62, bz0 + .6, 0, 0, HP);
    add(G.cyl(.075, .075, .03, 14), '#4f86b0', bx1 + .03, -.5, bz1 - .1, 0, 0, HP);
    // ── the cut rim along the near edges (S, E): a low kerb, its top the section's dark cut
    add(G.box(X1 - X0 + .14, .32, .12, .02), C.wall2, (X0 + X1) / 2 + .07, .16, Z1 + .06);
    add(G.box(X1 - X0 + .16, .04, .14, .01), C.cut, (X0 + X1) / 2 + .07, .33, Z1 + .06);
    add(G.box(.12, .32, Z1 - Z0 + .12, .02), C.wall2, X1 + .06, .16, (Z0 + Z1) / 2 + .06);
    add(G.box(.14, .04, Z1 - Z0 + .14, .01), C.cut, X1 + .06, .33, (Z0 + Z1) / 2 + .06);
    // ── back walls (N along x, W along z), interior face cream with a tiled wainscot
    add(G.box(X1 - X0 + WT, CEIL, WT, .02), C.wall, (X0 + X1) / 2 - WT / 2, CEIL / 2, Z0 - WT / 2);
    add(G.box(WT, CEIL, Z1 - Z0, .02), C.wall, X0 - WT / 2, CEIL / 2, (Z0 + Z1) / 2);
    add(G.pbox(X1 - X0, 1.0, .012), C.tile, (X0 + X1) / 2, .5, Z0 + .006);
    add(G.pbox(.012, 1.0, Z1 - Z0), C.tile, X0 + .006, .5, (Z0 + Z1) / 2);
    for (let x = X0 + .2; x < X1; x += .2) add(G.pbox(.014, 1.0, .014), C.grout, x, .5, Z0 + .012);
    for (let z = Z0 + .2; z < Z1; z += .2) add(G.pbox(.014, 1.0, .014), C.grout, X0 + .012, .5, z);
    for (const y of [.2, .4, .6, .8, 1.0]) { add(G.pbox(X1 - X0, .014, .014), C.grout, (X0 + X1) / 2, y, Z0 + .012); add(G.pbox(.014, .014, Z1 - Z0), C.grout, X0 + .012, y, (Z0 + Z1) / 2); }
    add(G.pbox(X1 - X0, .05, .03), C.wall2, (X0 + X1) / 2, 1.02, Z0 + .015); add(G.pbox(.03, .05, Z1 - Z0), C.wall2, X0 + .015, 1.02, (Z0 + Z1) / 2);
    // the escalator's way up (back-left, a lit opening) and the subway passage (front-left, a dark arch)
    add(G.box(1.12, 1.0, .03, .02), '#fff1c4', -3.45, 2.0, Z0 + .01);
    add(G.box(1.2, .06, .05, .01), C.steel2, -3.45, 2.52, Z0 + .02); for (const sx of [-1, 1]) add(G.box(.06, 1.02, .05, .01), C.steel2, -3.45 + sx * .58, 2.0, Z0 + .02);
    add(G.box(.03, 2.05, 1.18, .02), C.dark, X0 + .012, 1.03, 1.15);
    add(G.box(.035, .1, 1.3, .01), C.steel2, X0 + .02, 2.1, 1.15); for (const sz of [-1, 1]) add(G.box(.035, 2.1, .08, .01), C.steel2, X0 + .02, 1.05, 1.15 + sz * .63);
    add(G.box(.02, .05, .9, .01), '#7fb8e8', X0 + .03, .35, 1.15);
    // ── the ground the mall is dug into, behind the back corner only (a wider one would widen the frame): earth columns from the
    // island's foot up to the street, their faces cut — the ceiling slab (dark band), earth with stones, a water main, the
    // sidewalk on top with a street tree, a lamp and the 출구 1 canopy. Past them the walls just end in a cut cap.
    const topY = CEIL + .24, earthY = topY + .5, nx0 = X0 - WT - BACK, nz0 = Z0 - WT - BACK, nz1 = Z0 - WT, wx1 = X0 - WT;
    const column = (x0, x1, z0, z1) => {
      add(G.box(x1 - x0, earthY + .73, z1 - z0, .05, 2), C.earth, (x0 + x1) / 2, (earthY - .73) / 2, (z0 + z1) / 2);
      add(G.box(x1 - x0 - .16, .34, z1 - z0 - .16, .12, 2), C.deep, (x0 + x1) / 2, -.88, (z0 + z1) / 2);
      add(G.box(x1 - x0 + .03, .05, z1 - z0 + .03, .015), C.base, (x0 + x1) / 2, earthY - .07, (z0 + z1) / 2);
      add(G.box(x1 - x0 + .02, .12, z1 - z0 + .02, .02), C.walk, (x0 + x1) / 2, earthY + .01, (z0 + z1) / 2);
    };
    column(nx0, NX1, nz0, nz1); column(nx0, wx1, nz1, WZ1);
    // the cut faces that show: the column fronts above the walls (+z, +x) and the two column ends (x = NX1, z = WZ1)
    add(G.box(NX1 - nx0, topY - CEIL, .03, .01), C.cut, (nx0 + NX1) / 2, (CEIL + topY) / 2, nz1 + .012);
    add(G.box(.03, topY - CEIL, WZ1 - nz1, .01), C.cut, wx1 + .012, (CEIL + topY) / 2, (nz1 + WZ1) / 2);
    add(G.box(.03, .24, nz1 - nz0, .01), C.cut, NX1 + .012, CEIL + .12, (nz0 + nz1) / 2);
    add(G.box(wx1 - nx0, .24, .03, .01), C.cut, (nx0 + wx1) / 2, CEIL + .12, WZ1 + .012);
    add(G.box(X1 - NX1, .06, WT + .02, .01), C.cut, (NX1 + X1) / 2, CEIL + .03, Z0 - WT / 2);
    add(G.box(WT + .02, .06, Z1 - WZ1, .01), C.cut, X0 - WT / 2, CEIL + .03, (WZ1 + Z1) / 2);
    for (let k = 0; k < 30; k++) {
      const u = (k * 41 % 100) / 100, v = (k * 29 % 100) / 100, r = .05 + (k % 3) * .02, sc = [1.3, .8, .4], sx = [.4, .8, 1.3];
      if (k < 12) add(G.sph(r, 7, 5), k % 2 ? C.stone : C.stone2, nx0 + .2 + u * (NX1 - nx0 - .4), topY + .08 + v * .34, nz1 + .02, 0, 0, 0, sc);
      else if (k < 16) add(G.sph(r, 7, 5), k % 2 ? C.stone2 : C.stone, wx1 + .02, topY + .08 + v * .34, nz1 + .3 + u * (WZ1 - nz1 - .5), 0, 0, 0, sx);
      else if (k < 23) add(G.sph(r * 1.2, 7, 5), k % 2 ? C.stone : C.stone2, NX1 + .02, -.5 + v * 3.6, nz0 + .15 + u * (BACK - .1), 0, 0, 0, sx);
      else add(G.sph(r * 1.2, 7, 5), k % 2 ? C.stone2 : C.stone, nx0 + .15 + u * (BACK - .1), -.5 + v * 3.6, WZ1 + .02, 0, 0, 0, sc);
    }
    // a root, a mole's tunnel and a cut water main in the column ends
    tube([-.6, earthY - .02, nz1 + .02], [-.45, earthY - .22, nz1 + .03], .02, C.trunk, 5); tube([-.45, earthY - .22, nz1 + .03], [-.2, earthY - .32, nz1 + .03], .015, C.trunk, 5);
    add(G.cyl(.11, .11, .03, 14), C.sky, NX1 + .02, 1.3, nz0 + .45, 0, 0, HP); add(G.cyl(.075, .075, .035, 12), '#4f86b0', NX1 + .025, 1.3, nz0 + .45, 0, 0, HP);
    add(G.cyl(.08, .08, .03, 12), C.stone2, nx0 + .5, .6, WZ1 + .02, HP, 0, 0); add(G.cyl(.05, .05, .035, 10), C.dark, nx0 + .5, .6, WZ1 + .025, HP, 0, 0);
    add(G.sph(.16, 10, 8), C.deep, NX1 + .02, .3, nz0 + .55, 0, 0, 0, [.2, .8, 1]);
    // the street on top: joints, the road kerb, a street tree, a lamp, the 출구 1 canopy over the escalator's way up
    add(G.box(NX1 - nx0, .1, .14, .02), C.stone, (nx0 + NX1) / 2, earthY + .08, nz0 + .07);
    add(G.box(.14, .1, WZ1 - nz0, .02), C.stone, nx0 + .07, earthY + .08, (nz0 + WZ1) / 2);
    { const x = .9, z = nz0 + .5;
      add(G.box(.5, .05, .5, .02), C.grass, x, earthY + .09, z);
      tube([x, earthY + .1, z], [x, earthY + .75, z], .045, C.trunk, 6);
      add(G.sph(.36, 10, 8), C.leaf, x, earthY + 1.0, z); add(G.sph(.26, 10, 8), C.leaf2, x + .2, earthY + .86, z + .1); add(G.sph(.22, 10, 8), C.leaf, x - .18, earthY + .9, z - .05); }
    tube([-1.6, earthY + .07, nz0 + .4], [-1.6, earthY + 1.35, nz0 + .4], .03, C.dark, 8);
    tube([-1.6, earthY + 1.35, nz0 + .4], [-1.35, earthY + 1.45, nz0 + .4], .025, C.dark, 6);
    add(G.box(.24, .1, .16, .03), C.dark, -1.27, earthY + 1.42, nz0 + .4); add(G.box(.18, .03, .12, .01), C.tube, -1.27, earthY + 1.36, nz0 + .4);
    for (const [x, z] of [[-3.95, nz1 - .05], [-2.95, nz1 - .05], [-3.95, nz0 + .1], [-2.95, nz0 + .1]]) tube([x, earthY + .07, z], [x, earthY + .95, z], .025, C.steel2, 6);
    add(G.box(1.15, .06, BACK + .1, .02), C.navy, -3.45, earthY + .98, (nz0 + nz1) / 2);
    add(G.box(1.1, .02, BACK + .05, .01), '#b6cfe8', -3.45, earthY + 1.02, (nz0 + nz1) / 2);
    add(G.box(.9, .05, BACK - .1, .01), C.dark, -3.45, earthY + .075, (nz0 + nz1) / 2);
    // (10/24 아트 점검 40: the street read as one thin empty plate — a bus stop sign, a waiting bench, a planter and a bike rack, a few lumps
    // along the kerb and the corner; the middle of the pavement stays open)
    const sty = earthY + .07, srz = nz0 + .3;
    { const x = 1.95;
      tube([x, sty, srz], [x, sty + 1.2, srz], .028, C.steel2, 8);
      add(G.cyl(.15, .15, .035, 22), C.white, x, sty + 1.2, srz + .01, HP, 0, 0);
      add(G.box(.2, .26, .025, .01), C.white, x, sty + .82, srz + .02);
      add(G.cyl(.06, .07, .05, 12), C.conc2, x, sty + .025, srz); }
    { const x = .05, z = nz0 + .42;
      for (const sx of [-1, 1]) add(G.box(.05, .26, .3, .015), C.steel2, x + sx * .38, sty + .13, z);
      add(G.box(.9, .05, .34, .02), C.wood, x, sty + .28, z);
      for (let k = 0; k < 3; k++) add(G.pbox(.86, .008, .01), C.woodD, x, sty + .307, z - .1 + k * .1);
      add(G.box(.9, .2, .04, .02), C.wood, x, sty + .45, z + .16); }
    { const x = -2.35, z = nz0 + .5, w = .78, d = .42;
      add(G.box(w, .22, d, .04), C.conc2, x, sty + .11, z);
      add(G.box(w - .08, .02, d - .08, .01), C.deep, x, sty + .215, z);
      for (const [dx, dz, r, c] of [[-.24, -.05, .13, C.leaf], [0, .04, .15, C.leaf2], [.24, -.03, .12, C.leaf]]) add(G.sph(r, 10, 8), c, x + dx, sty + .25, z + dz, 0, 0, 0, [1, .8, 1]);
      for (const [dx, dz, c] of [[-.13, .1, C.pink], [.12, .11, C.mustard], [-.3, .1, C.white], [.3, .09, C.pink], [.05, -.1, C.mustard]]) add(G.sph(.035, 8, 6), c, x + dx, sty + .33, z + dz); }
    { const x = nx0 + .55;
      for (const z of [-2.2, -1.55, -.9]) { tube([x, sty, z - .2], [x, sty + .42, z - .2], .02, C.steel2, 6); tube([x, sty + .42, z - .2], [x, sty + .42, z + .2], .02, C.steel2, 6); tube([x, sty + .42, z + .2], [x, sty, z + .2], .02, C.steel2, 6); }
      const bz = -1.55, bx = x + .12, wr = .2, wy = sty + wr;
      for (const dz of [-.3, .3]) { add(G.tor(wr, .022, PI * 2, 5, 22), C.rubber, bx, wy, bz + dz, 0, HP, 0); add(G.cyl(.03, .03, .05, 8), C.steel2, bx, wy, bz + dz, HP, 0, 0); }
      tube([bx, wy, bz - .3], [bx, wy + .24, bz - .02], .022, C.mint, 6); tube([bx, wy + .24, bz - .02], [bx, wy, bz + .02], .022, C.mint, 6);
      tube([bx, wy, bz + .02], [bx, wy, bz + .3], .02, C.mint, 6); tube([bx, wy + .24, bz - .02], [bx, wy + .3, bz - .1], .02, C.mint, 6);
      tube([bx, wy + .24, bz - .02], [bx, wy + .36, bz + .24], .02, C.mint, 6); tube([bx, wy + .36, bz + .24], [bx, wy, bz + .3], .02, C.mint, 6);
      add(G.box(.08, .03, .14, .015), C.dark, bx, wy + .32, bz - .12);
      tube([bx - .16, wy + .4, bz + .24], [bx + .16, wy + .4, bz + .24], .016, C.dark, 6);
      add(G.box(.2, .1, .14, .02), C.wood, bx, wy + .46, bz + .32); }
    // ── a slim bulkhead along the back walls (a deeper soffit hid the shops' back walls from the start view): fluorescent tubes
    // under it, its front edge cut
    const sd = .34;
    add(G.box(X1 - X0, CEIL - SOF, sd, .02), C.soffit, (X0 + X1) / 2, (SOF + CEIL) / 2, Z0 + sd / 2);
    add(G.box(sd, CEIL - SOF, Z1 - Z0 - sd, .02), C.soffit, X0 + sd / 2, (SOF + CEIL) / 2, Z0 + sd + (Z1 - Z0 - sd) / 2);
    add(G.pbox(X1 - X0, .03, .03), C.cut, (X0 + X1) / 2, CEIL - .015, Z0 + sd); add(G.pbox(.03, .03, Z1 - Z0 - sd), C.cut, X0 + sd, CEIL - .015, Z0 + sd + (Z1 - Z0 - sd) / 2);
    for (let x = X0 + .9; x < X1 - .2; x += 1.4) { add(G.box(.9, .04, .12, .02), C.soffit2, x, SOF - .02, Z0 + sd - .12); add(G.cyl(.02, .02, .82, 8), C.tube, x, SOF - .05, Z0 + sd - .12, 0, 0, HP); }
    for (let z = Z0 + 1.2; z < Z1 - .3; z += 1.4) { add(G.box(.12, .04, .9, .02), C.soffit2, X0 + sd - .12, SOF - .02, z); add(G.cyl(.02, .02, .82, 8), C.tube, X0 + sd - .12, SOF - .05, z, HP, 0, 0); }
    // ── the corner pillar (W strip × N row): small square tiles, a fire extinguisher at its foot
    const px = -2.68, pz = -1.54;
    add(G.box(.34, CEIL, .34, .03), C.wall2, px, CEIL / 2, pz);
    for (let y = .12; y < 2.2; y += .2) for (const [dx, dz, w, d] of [[0, .172, .34, .01], [.172, 0, .01, .34]]) add(G.pbox(w + .004, .012, d + .004), C.grout, px + dx, y, pz + dz);
    add(G.box(.36, .12, .36, .02), C.cut2, px, .06, pz);
    add(G.cap(.07, .2, 3, 8), C.red, px + .26, .22, pz + .12); add(G.cyl(.03, .03, .05, 8), C.dark, px + .26, .42, pz + .12);
    tube([px + .26, .44, pz + .12], [px + .36, .38, pz + .16], .012, C.dark, 5);
    // ── tactile paving down the middle of the corridor and a turn toward the escalator
    for (let x = -2.3; x < 1.5; x += .3) { add(G.box(.28, .012, .28, .004), C.yellow, x, .007, -.45); for (let q = -1; q <= 1; q++) add(G.pbox(.24, .01, .03), '#e9bf3a', x, .016, -.45 + q * .08); }
    for (let z = -.75; z > -1.0; z -= .3) add(G.box(.28, .012, .28, .004), C.yellow, -2.3, .007, z);
    // ── bench (faces the shops) with the shopping basket someone left on it
    const bxx = -.4, bzz = 2.42;
    for (const sx of [-1, 1]) { add(G.box(.06, .42, .36, .015), C.steel2, bxx + sx * .5, .21, bzz); }
    add(G.box(1.12, .06, .4, .03), C.wood, bxx, .44, bzz);
    for (let k = 0; k < 4; k++) add(G.pbox(1.08, .01, .012), C.woodD, bxx, .472, bzz - .14 + k * .095);
    add(G.box(1.12, .3, .05, .025), C.wood, bxx, .72, bzz - .2);
    for (const sx of [-1, 1]) add(G.box(.05, .34, .05, .01), C.steel2, bxx + sx * .5, .6, bzz - .2);
    // the basket: red plastic with slots, two handles folded up
    const kx = bxx - .2, ky = .47, kz = bzz + .03;
    add(G.box(.42, .2, .3, .03), '#e9665a', kx, ky + .1, kz);
    add(G.box(.37, .02, .25, .01), '#c94d43', kx, ky + .19, kz);
    for (let q = 0; q < 4; q++) add(G.pbox(.04, .07, .005), '#c94d43', kx - .12 + q * .08, ky + .11, kz + .152);
    for (const sz of [-1, 1]) tube([kx - .14, ky + .2, kz + sz * .12], [kx, ky + .35, kz + sz * .02], .012, '#c94d43', 5), tube([kx, ky + .35, kz + sz * .02], [kx + .14, ky + .2, kz + sz * .12], .012, '#c94d43', 5);
    // (a milk carton poking out)
    add(G.box(.12, .14, .07, .02), C.white, kx - .06, ky + .27, kz - .04);
    // (a leek)
    add(G.cyl(.035, .035, .2, 8), C.leaf2, kx + .1, ky + .3, kz + .03, .3, 0, -.3);
    // ── mop cart and the yellow wet-floor sign by the office
    const mx = 2.05, mz = .62;
    add(G.box(.5, .08, .36, .02), C.dark, mx, .12, mz); for (const [dx, dz] of [[-.2, -.14], [.2, -.14], [-.2, .14], [.2, .14]]) add(G.sph(.04, 6, 4), C.rubber, mx + dx, .04, mz + dz);
    add(G.cyl(.15, .13, .26, 14), C.yellow, mx - .08, .29, mz); add(G.cyl(.14, .14, .01, 14), '#a8c8d8', mx - .08, .4, mz);
    add(G.box(.14, .22, .2, .02), C.dark, mx + .15, .3, mz);
    tube([mx + .1, .2, mz - .05], [mx + .2, 1.1, mz - .12], .016, C.steel2, 6);
    add(G.cyl(.06, .08, .14, 8), '#e8e2d2', mx + .1, .22, mz - .05);
    // the wet-floor sign: an A-frame
    const sx0 = 1.8, sz0 = .8;
    add(G.box(.3, .5, .03, .02), C.yellow, sx0, .27, sz0 - .07, -.14, .5, 0); add(G.box(.3, .5, .03, .02), C.yellow, sx0 + .03, .27, sz0 + .05, .14, .5, 0);
    add(G.box(.1, .03, .1, .01), C.dark, sx0 + .01, .53, sz0 - .01, 0, .5, 0);
    // ── the lost-and-found box (an open crate: an umbrella and a cap sticking out)
    const lx = 3.55, lz = .55;
    add(G.box(.56, .34, .44, .03), '#e6c28c', lx, .17, lz);
    add(G.box(.5, .02, .38, .01), '#c99e64', lx, .33, lz);
    tube([lx - .12, .25, lz - .05], [lx - .2, .74, lz - .14], .018, C.navy, 6); add(G.sph(.03, 6, 4), C.navy, lx - .2, .76, lz - .14);
    add(G.cone(.1, .26, 8), C.navy, lx - .11, .34, lz - .04, .2, 0, .15);
    add(G.sph(.09, 10, 6), C.mint, lx + .12, .36, lz + .02, 0, 0, 0, [1, .55, 1]); add(G.box(.12, .02, .07, .01), C.mint, lx + .2, .34, lz + .1);
    // ── recycling bins (paper · cans · general) by the lockers
    const rx = -2.4, rz = 2.75;
    for (let q = 0; q < 3; q++) {
      const x = rx, z = rz - .14 + q * .14;
      add(G.box(.36, .62, .13, .02), [C.sky, C.mustard, '#9aa3ad'][q], x, .31, z);
      add(G.box(.38, .04, .15, .01), C.cream, x, .63, z); add(G.pbox(.04, .012, .1), C.dark, x + .1, .655, z);
    }
  }));
  // B1 sign on the corner pillar, the hanging direction sign under the soffit, posters on the walls
  label(f.group, 'b1', .26, .26, signDraw('B1', C.navy, C.white, { size: .62 }), -2.68, 1.75, -1.54 + .176, 0, 0, 0);
  label(f.group, 'b1side', .26, .26, signDraw('B1', C.navy, C.white, { size: .62 }), -2.68 + .176, 1.75, -1.54, 0, HP, 0);
  label(f.group, 'pillarway', .28, .5, (c, W, H) => {
    c.fillStyle = C.navy; roundRect(c, 0, 0, W, H, 10); c.fill();
    fitText(c, '↑ 출구 1', W / 2, H * .3, W * .86, H * .2, C.white, { weight: 'bold' }); fitText(c, '관리실 →', W / 2, H * .7, W * .86, H * .2, '#ffe7a3', { weight: 'bold' });
  }, -2.68 + .176, 1.32, -1.54, 0, HP, 0);
  label(f.group, 'exit1', .5, .18, signDraw('출구 1', '#3f8f5a', C.white, { size: .6 }), -3.45, 2.42, Z0 + .03);
  label(f.group, 'subway', .9, .16, signDraw('지하철 연결', '#3f8f5a', C.white, { size: .6 }), X0 + .045, 2.26, 1.15, 0, HP, 0);
  label(f.group, 'lostbox', .34, .12, signDraw('분실물', C.cream, C.ink, { size: .62, edge: '#c99e64' }), 3.55, .2, .55 + .225);
  label(f.group, 'wetfloor', .22, .2, signDraw('미끄럼 주의', C.yellow, C.dark, { size: .38, lines: 2 }), 1.8 + .01, .3, .8 + .075, .14, .5, 0);
  // the street on top: pavers drawn on the pavement, the bus stop's round sign and its timetable
  { const topY = CEIL + .24, earthY = topY + .5, nx0 = X0 - WT - BACK, nz0 = Z0 - WT - BACK, nz1 = Z0 - WT, wx1 = X0 - WT, y = earthY + .073;
    const pave = tex.get('um-pave', () => { const t = new THREE.CanvasTexture((() => {
      const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
      x.fillStyle = '#b9bdb6'; x.fillRect(0, 0, 256, 256);
      const cols = ['#e4e1d9', '#dcd9d0', '#e9e6de', '#d5d3cb', '#e0ddd4'];
      for (let j = 0; j < 8; j++) for (let i = -1; i < 5; i++) { const px = i * 64 + (j % 2) * 32; x.fillStyle = cols[(i * 7 + j * 3 + 20) % 5]; roundRect(x, px + 2, j * 32 + 2, 60, 28, 4); x.fill(); }
      return c; })()); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; });
    const slab = (x0, x1, z0, z1) => {
      const w = x1 - x0, d = z1 - z0, g = geo(`um-pave|${w.toFixed(2)}|${d.toFixed(2)}`, () => { const q = new THREE.PlaneGeometry(w, d); const uv = q.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / .8, uv.getY(k) * d / .8); return q; });
      const m = mesh(g, mat('#ffffff', { map: pave, rim: 0 }), { cast: false }); put(m, (x0 + x1) / 2, y, (z0 + z1) / 2, -HP, 0, 0); m.renderOrder = 1; f.group.add(m);
    };
    slab(nx0 + .01, NX1, nz0 + .14, nz1); slab(nx0 + .14, wx1, nz1, WZ1);
    label(f.group, 'busstop', .26, .26, (c, W, H) => {
      c.fillStyle = '#3f8f5a'; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 2, 0, PI * 2); c.fill();
      c.fillStyle = C.white; roundRect(c, W * .26, H * .2, W * .48, H * .34, 10); c.fill();
      c.fillStyle = '#3f8f5a'; roundRect(c, W * .32, H * .25, W * .36, H * .12, 4); c.fill();
      fitText(c, '버스 정류장', W / 2, H * .7, W * .7, H * .16, C.white, { weight: 'bold' });
    }, 1.95, earthY + .07 + 1.2, nz0 + .3 + .03);
    label(f.group, 'bustimes', .17, .22, (c, W, H) => {
      c.fillStyle = '#fbfcf8'; roundRect(c, 0, 0, W, H, 8); c.fill();
      fitText(c, '마을버스 7', W / 2, H * .16, W * .84, H * .14, '#3f8f5a', { weight: 'bold' });
      c.fillStyle = '#c9cfc6'; for (let k = 0; k < 5; k++) c.fillRect(W * .14, H * (.34 + k * .12), W * (.72 - (k % 2) * .2), H * .045);
    }, 1.95, earthY + .07 + .82, nz0 + .3 + .035); }
  // spots in the corridor: the basket, under the bench, behind the bins, beside the pillar, in the lost box, the mop bucket
  f.spot('on', null, -.6, .67, 2.45, { label: '벤치 위 장바구니 안', maxH: 0.5, scale: 1.25 });
  f.spot('on', null, .05, .475, 2.38, { label: '벤치 오른쪽 끝', maxH: 0.75, scale: 1.7 });
  f.spot('under', null, -.15, .01, 2.4, { label: '벤치 밑', maxH: 0.42, scale: 1.3 });
  f.spot('behind', null, -2.42, .01, 2.42, { label: '분리수거함 옆', maxH: 0.75, scale: 1.6 });
  f.spot('behind', null, -2.42, .01, -1.2, { label: '기둥 옆 소화기 뒤', maxH: 0.75, scale: 1.6 });
  f.spot('on', null, 3.62, .35, .58, { label: '분실물 상자 안', maxH: 0.6, scale: 1.4 });
  f.spot('behind', null, 2.32, .17, .72, { label: '대걸레 카트 옆', maxH: 0.6, scale: 1.4 });
  f.spot('on', null, 1.05, .012, 2.55, { label: '통로 앞 바닥', maxH: 0.9, scale: 1.9 });
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// um_shopstall — 가게 칸 (opts.variant: clothes · snack · keys · flower; opts.W · opts.D). 앞이 +z, 칸막이·뒤 벽·간판·셔터 상자.
// part0 = 셔터 레버(15): 터치하면 레버가 철컥 → 셔터가 저절로 끝까지. 닫힌 칸(keys)은 셔터가 내려와 있다가 올라가고, 열린 칸은 셔터가
// 간판 밑까지만 반쯤 내려옴(물건은 가리지 않음). part1 = 칸마다 서랍·냉장고 문.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const STALL = {
  clothes: { name: '몽글 옷방', acc: C.coral, back: '#fbe6df', floor: '#ecd2ae', floor2: '#dcbb92', unit: 'B1-03' },
  snack: { name: '하나둘 분식', acc: '#f0a040', back: '#fff1db', floor: '#f1e4d0', floor2: '#e3cfb2', unit: 'B1-04' },
  keys: { name: '열쇠 · 도장', acc: '#5f8fd0', back: '#e4ecf6', floor: '#dfe2e7', floor2: '#cbd0d8', unit: 'B1-05', shut: true },
  flower: { name: '꽃 한 송이', acc: '#6fbf8e', back: '#e7f3e5', floor: '#ece4d4', floor2: '#ddd2bd', unit: 'B1-01' },
};
B.um_shopstall = (f, T, o = {}) => {
  const v = STALL[o.variant] ? o.variant : 'clothes', S = STALL[v], W = o.W || 1.4, D = o.D || 1.45, H = SOF, zf = D / 2, PT = .06, PH = .62;
  const shut = !!S.shut;
  // body: partitions, back panel, floor inset, the sign band and the shutter housing
  f.add(mc('um-stall-body|' + v + '|' + W + '|' + D, ({ add }) => {
    // waist-high partitions (the shop next door shows over them), a rail on top; the front posts go up to the sign band
    for (const sx of [-1, 1]) {
      add(G.box(PT, PH, D - .08, .015), C.wall, sx * (W / 2 - PT / 2), PH / 2, -.04);
      add(G.box(PT + .02, .04, D - .08, .01), C.wall2, sx * (W / 2 - PT / 2), PH + .02, -.04);
      add(G.box(PT + .02, H, .08, .015), S.acc, sx * (W / 2 - PT / 2), H / 2, zf - .04);
    }
    add(G.box(W - PT * 2, H, .04, .01), S.back, 0, H / 2, -zf + .02);
    add(G.box(W - PT * 2, .5, .045, .01), shade2(S.back), 0, .25, -zf + .025);
    add(G.box(W - PT * 2, .012, D - .04, .004), S.floor, 0, .006, 0);
    for (let x = -W / 2 + PT + .2; x < W / 2 - PT; x += .2) add(G.pbox(.008, .004, D - .06), S.floor2, x, .013, 0);
    add(G.box(W, .3, .1, .02), S.acc, 0, H - .15, zf - .05);
    add(G.box(W - .04, .14, .18, .03), C.steel, 0, H - .37, zf - .1);
    for (let k = 0; k < 3; k++) add(G.pbox(W - .06, .008, .005), C.steel2, 0, H - .42 + k * .045, zf - .007);
    // the unit number plate on the right post
    add(G.box(.2, .08, .02, .01), C.cream, W / 2 - .13, H - .56, zf + .005);
  }));
  label(f.group, 'stall-' + v, W - .1, .22, signDraw(S.name, S.acc, C.white, { size: .62 }), 0, H - .15, zf + .002);
  label(f.group, 'unit-' + v, .17, .06, (c, Wd, Hd) => { c.fillStyle = C.cream; c.fillRect(0, 0, Wd, Hd); fitText(c, S.unit, Wd / 2, Hd / 2, Wd * .86, Hd * .8, C.ink, { weight: 'bold' }); }, W / 2 - .13, H - .56, zf + .016);
  // ── the shutter and its lever (part0)
  const SH = H - .46;
  const shutter = grp(); put(shutter, 0, H - .44, zf - .1); f.add(shutter);
  shutter.add(mc('um-stall-shutter|' + W, ({ add }) => {
    add(G.box(W - .08, SH, .03, .008), '#dde2e8', 0, -SH / 2, 0);
    for (let y = .08; y < SH; y += .09) add(G.pbox(W - .1, .016, .01), '#bcc4ce', 0, -y, .018);
    add(G.box(W - .06, .06, .05, .015), '#a9b1bd', 0, -SH + .03, 0);
    add(G.box(.16, .03, .05, .01), C.dark, 0, -SH + .09, .03);
  }));
  if (shut) label(shutter, 'shutnote', .5, .32, (c, Wd, Hd) => { paperFill(c, Wd, Hd, '#fbf3e0', 7); fitText(c, '오늘은 일찍 닫아요', Wd / 2, Hd * .42, Wd * .84, Hd * .26, C.ink, { lines: 2 }); fitText(c, ':)', Wd / 2, Hd * .8, Wd * .4, Hd * .2, S.acc); }, -.15, -SH * .45, .03, 0, 0, .04);
  const LX = W / 2 - .06, lever = grp(); put(lever, LX, 1.05, zf + .04); f.add(lever);
  f.add(mc('um-stall-leverbox|' + v + '|' + W + '|' + D, ({ add }) => { add(G.box(.07, .26, .07, .02), C.dark, LX, 1.05, zf + .005); add(G.box(.06, .05, .02, .006), S.acc, LX, 1.21, zf + .04); }));
  lever.add(mc('um-stall-lever', ({ add }) => { add(G.box(.035, .2, .035, .01), C.steel, 0, .1, .02); add(G.sph(.048, 10, 8), C.red, 0, .21, .03); }));
  const s0 = shut ? 1 : .05, s1 = shut ? .04 : .3;
  const p0 = f.part('lever', [lever, shutter], (t, bl, bs) => {
    const a = stage(t, 0, .22), b = sm(stage(t, .15, 1));
    lever.rotation.x = -1.1 * a;
    shutter.scale.y = s0 + (s1 - s0) * b;
  }, { label: shut ? '열쇠 가게 셔터 레버' : '가게 셔터 레버', sfx: 'latch', dur: shut ? 2.2 : 1.4 });
  p0.setOpen(0);
  // ── what's in each shop
  if (v === 'clothes') clothesStall(f, W, D);
  else if (v === 'snack') snackStall(f, W, D);
  else if (v === 'keys') keysStall(f, W, D, p0);
  else flowerStall(f, W, D);
  if (v !== 'snack' && !shut) f.spot('on', null, v === 'flower' ? -.12 : -W / 2 + .3, .015, zf - (v === 'flower' ? .12 : .2), { label: S.name + ' 앞 바닥', maxH: .8, scale: 1.5 });
};
const shade2 = hex => { const c = new THREE.Color(hex); const h = {}; c.getHSL(h); c.setHSL(h.h, h.s, Math.max(0, h.l - .06)); return '#' + c.getHexString(); };

function clothesStall(f, W, D) {
  const zb = -D / 2;
  f.add(mc('um-clothes', ({ add, tube }) => {
    // face-out rail on the back wall with six shirts
    tube([-.58, 1.55, zb + .14], [.08, 1.55, zb + .14], .015, C.steel, 6);
    for (const x of [-.58, .08]) tube([x, 1.55, zb + .14], [x, 1.55, zb + .04], .012, C.steel, 5);
    [C.mint, C.mustard, C.coral, C.navy, C.cream, C.lilac].forEach((c, k) => shirt(add, -.52 + k * .115, 1.55, zb + .16 + k * .012, c, .9));
    // hat shelf above the rail
    add(G.box(.62, .03, .2, .01), C.wood, -.25, 1.95, zb + .12);
    for (const [x, c] of [[-.45, C.pink], [-.22, C.mustard], [.0, C.sky]]) { add(dome(.08, 12, 5), c, x, 1.965, zb + .13); add(G.cyl(.12, .12, .01, 14), c, x, 1.97, zb + .13); }
    // half mannequin bust on a stand, a striped tee and a scarf
    const mx = -.05, mz = .12;
    add(G.cyl(.12, .14, .04, 14), C.dark, mx, .02, mz); tube([mx, .04, mz], [mx, .82, mz], .018, C.steel2, 6);
    add(G.cap(.15, .2, 4, 10), '#f7efe6', mx, 1.0, mz, 0, 0, 0, [1.05, 1, .75]);
    for (let k = 0; k < 4; k++) add(G.cyl(.158, .158, .045, 14), k % 2 ? C.white : C.coral, mx, .86 + k * .06, mz, 0, 0, 0, [1.05, 1, .76]);
    add(G.cyl(.035, .045, .07, 10), '#f7efe6', mx, 1.22, mz); add(G.sph(.04, 8, 6), '#f7efe6', mx, 1.27, mz);
    add(G.tor(.1, .035, PI * 2, 6, 16), C.mustard, mx, 1.15, mz, HP - .15, 0, 0); add(G.box(.06, .2, .03, .015), C.mustard, mx + .05, 1.02, mz + .1, .1, 0, .2);
    // the accessory spinner (hair clips, sunglasses), a price tag on top
    const ax = -.45, az = .38;
    add(G.cyl(.1, .12, .04, 12), C.dark, ax, .02, az); tube([ax, .04, az], [ax, 1.05, az], .014, C.steel, 6);
    for (const [y, r] of [[.5, .13], [.75, .11], [.98, .09]]) {
      add(G.cyl(r, r, .015, 12), C.steel2, ax, y, az);
      for (let k = 0; k < 6; k++) { const a = k * PI / 3, x = ax + Math.cos(a) * r, z = az + Math.sin(a) * r; add(G.sph(.022, 6, 4), [C.pink, C.mint, C.yellow, C.lilac, C.coral, C.sky][k], x, y - .04, z); }
    }
    add(G.box(.12, .07, .015, .01), C.yellow, ax, 1.1, az);
    // a tall mirror on the left partition
    add(G.box(.025, 1.0, .34, .03), C.wood, -W / 2 + .075, .95, -.1); add(G.box(.012, .92, .28, .03), '#d5ebf2', -W / 2 + .09, .95, -.1);
    // the little cash counter (its drawer is part1) on the right
    add(G.box(.44, .78, .38, .025), C.wood, .38, .39, -.12); add(G.box(.48, .04, .42, .015), C.cream, .38, .8, -.12);
    add(G.box(.16, .1, .12, .02), C.dark, .44, .87, -.18); add(G.box(.08, .02, .06, .01), C.mint, .44, .93, -.16);
    add(G.box(.12, .1, .02, .01), C.white, .28, .86, -.05, -.4, 0, 0);
  }));
  label(f.group, 'sale', .36, .26, (c, Wd, Hd) => { c.fillStyle = C.yellow; c.fillRect(0, 0, Wd, Hd); fitText(c, '세일', Wd / 2, Hd * .36, Wd * .8, Hd * .38, C.red, { weight: 'bold' }); fitText(c, '50%', Wd / 2, Hd * .74, Wd * .8, Hd * .34, C.ink, { weight: 'bold' }); }, .38, 1.55, -D / 2 + .045);
  // the counter's drawer (part1)
  const dr = grp(); put(dr, .38, .62, -.12 + .19); f.add(dr);
  dr.add(mc('um-clothes-drawer', ({ add }) => { add(G.box(.38, .14, .03, .01), shade2(C.wood), 0, 0, 0); add(G.box(.1, .025, .025, .008), C.brass, 0, 0, .025); add(G.box(.34, .02, .3, .006), C.wood, 0, -.06, -.15); }));
  const p1 = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .26 * t; }, { label: '옷 가게 계산대 서랍', sfx: 'drawer', dur: .35 });
  p1.lockable = true; p1.lockKind = 'pad'; p1.lockAt = { parent: dr, x: .12, y: 0, z: .04 };
  f.spot('inside', dr, 0, -.05, -.15, { part: p1, maxH: 0.3, label: '옷 가게 서랍 안', scale: 1.1 });
  f.spot('on', null, .3, .82, -.08, { label: '옷 가게 계산대 위', maxH: 0.6, scale: 1.5 });
  f.spot('on', null, -.12, 1.985, -D / 2 + .13, { label: '모자 선반 위', maxH: 0.4, scale: 1.1 });
  f.spot('behind', null, .12, .01, .0, { label: '마네킹 뒤', maxH: 0.8, scale: 1.5 });
}

function snackStall(f, W, D) {
  const zb = -D / 2;
  f.add(mc('um-snack', ({ add }) => {
    // the drink fridge (door = part1) on the left: a glowing inside with bottles
    const fx = -.36, fz = zb + .28;
    add(G.box(.5, 1.6, .05, .02), '#e6eef2', fx, .8, fz - .2); for (const sx of [-1, 1]) add(G.box(.05, 1.6, .44, .02), '#e6eef2', fx + sx * .225, .8, fz);
    add(G.box(.5, .1, .44, .02), '#e6eef2', fx, .05, fz); add(G.box(.5, .14, .44, .02), C.red, fx, 1.53, fz);
    add(G.box(.4, 1.3, .02, .01), '#fff8e0', fx, .82, fz - .17);
    for (const y of [.42, .82, 1.2]) {
      add(G.pbox(.4, .015, .38), C.steel, fx, y - .02, fz);
      if (y < .5) continue;
      for (let k = 0; k < 4; k++) add(G.cyl(.032, .032, .2, 8), [C.sky, C.leaf, C.coral, C.yellow][(k + y * 10 | 0) % 4], fx - .15 + k * .1, y + .1, fz - .05);
    }
    // shelf on the right: green melamine plates, sauce bottles, a big pot, ramen packs
    add(G.box(.48, .03, .3, .01), C.wood, .32, 1.2, zb + .18); add(G.box(.48, .03, .3, .01), C.wood, .32, .8, zb + .18);
    for (let k = 0; k < 6; k++) add(G.cyl(.11, .1, .018, 14), '#7cc49a', .2, .83 + k * .022, zb + .18);
    add(G.cyl(.04, .04, .16, 8), C.red, .4, .9, zb + .14); add(G.cyl(.04, .04, .16, 8), C.yellow, .48, .9, zb + .14);
    add(G.cyl(.14, .13, .2, 14), C.steel, .3, 1.32, zb + .18); add(G.tor(.14, .015, PI * 2, 4, 16), C.steel2, .3, 1.42, zb + .18, HP, 0, 0);
    for (let k = 0; k < 3; k++) add(G.box(.12, .16, .05, .02), [C.red, C.mustard, C.red][k], .2 + k * .13, 1.66, zb + .1, 0, 0, (k - 1) * .08);
    add(G.box(.48, .03, .3, .01), C.wood, .32, 1.58, zb + .18);
    // a rice cooker on the low shelf
    add(G.box(.48, .03, .3, .01), C.wood, .32, .45, zb + .18);
    add(G.cyl(.13, .13, .2, 14), C.cream, .25, .57, zb + .2); add(dome(.13, 14, 5), C.cream, .25, .67, zb + .2); add(G.box(.06, .03, .02, .008), C.red, .25, .55, zb + .33);
  }));
  label(f.group, 'menu', .62, .5, (c, Wd, Hd) => {
    c.fillStyle = '#3d4a3f'; roundRect(c, 0, 0, Wd, Hd, 10); c.fill();
    c.strokeStyle = C.wood; c.lineWidth = 6; roundRect(c, 3, 3, Wd - 6, Hd - 6, 8); c.stroke();
    fitText(c, '오늘의 메뉴', Wd / 2, Hd * .15, Wd * .8, Hd * .14, C.yellow, { weight: 'bold' });
    [['떡볶이', '3,000'], ['어묵', '1,000'], ['순대', '3,500'], ['튀김', '2,000']].forEach(([a, b], k) => {
      const y = Hd * (.34 + k * .17);
      fitText(c, a, Wd * .32, y, Wd * .44, Hd * .13, '#fbf4e8', { align: 'center' }); fitText(c, b, Wd * .76, y, Wd * .34, Hd * .13, '#ffd9a8');
    });
  }, .05, 2.02, zb + .045);
  // the fridge door (part1): swings open on its left hinge
  const fx = -.36, fz = -D / 2 + .28;
  const door = grp(); put(door, fx - .25, .1, fz + .23); f.add(door);
  door.add(mc('um-snack-fridgedoor', ({ add }) => {
    add(G.box(.5, 1.36, .035, .02), C.white, .25, .68, 0);
    add(G.box(.4, 1.12, .012, .01), '#cfe8ef', .25, .7, .02);
    add(G.box(.03, .4, .05, .01), C.steel2, .45, .78, .04);
  }));
  const p1 = f.part('door', door, t => { door.rotation.y = -1.7 * t; }, { label: '분식집 음료 냉장고', sfx: 'open', dur: .35 });
  f.spot('on', null, fx, 1.6, fz - .02, { label: '음료 냉장고 위', maxH: .45, scale: 1.3 });
  f.spot('on', null, .4, .83, -D / 2 + .2, { label: '분식집 접시 옆 선반', maxH: 0.38, scale: 1.1 });
  f.spot('behind', null, .42, .47, -D / 2 + .22, { label: '밥솥 옆', maxH: 0.32, scale: 1.0 });
}

function keysStall(f, W, D, p0) {
  const zb = -D / 2;
  f.add(mc('um-keys', ({ add, tube }) => {
    // pegboard back wall with blank keys hanging on hooks
    add(G.box(W - .2, .9, .03, .01), '#f2e3c4', 0, 1.6, zb + .06);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) {
      const x = -.45 + k * .15, y = 1.95 - r * .2;
      tube([x, y, zb + .075], [x, y, zb + .12], .005, C.steel2, 4);
      add(G.box(.035, .085, .01, .006), k % 3 ? C.brass : C.steel, x, y - .055, zb + .11);
      add(G.cyl(.022, .022, .01, 10), k % 3 ? C.brass : C.steel, x, y - .01, zb + .11, HP, 0, 0);
    }
    // the counter with the key-cutting machine and a magnifier lamp
    add(G.box(W - .16, .82, .42, .02), '#c7d4e6', 0, .41, -.05); add(G.box(W - .12, .04, .46, .015), C.cream, 0, .84, -.05);
    const kx = -.25;
    add(G.box(.32, .16, .24, .03), C.steel2, kx, .94, -.1); add(G.cyl(.07, .07, .03, 14), C.dark, kx - .05, 1.06, -.04, HP, 0, 0);
    add(G.box(.12, .06, .08, .015), C.dark, kx + .08, 1.04, -.05); add(G.box(.04, .07, .03, .01), C.brass, kx + .08, 1.1, -.05);
    tube([.3, .86, -.2], [.3, 1.25, -.12], .014, C.steel2, 6); tube([.3, 1.25, -.12], [.18, 1.35, -.02], .012, C.steel2, 6);
    add(G.cyl(.07, .07, .03, 12), C.sky, .18, 1.32, -.02, .4, 0, 0);
    // the stamp drawer chest (the drawer is part1) on the counter's right
    add(G.box(.3, .22, .2, .02), C.woodD, .35, .97, -.12);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) { add(G.pbox(.085, .08, .01), C.wood, .26 + k * .095, .93 + r * .1, -.015); add(G.sph(.008, 5, 4), C.brass, .26 + k * .095, .93 + r * .1, -.006); }
    // stamps lined up
    for (let k = 0; k < 4; k++) { add(G.cyl(.022, .025, .08, 8), [C.red, C.wood, C.navy, C.wood][k], -.05 + k * .06, .9, .08); add(G.sph(.026, 8, 6), C.woodD, -.05 + k * .06, .96, .08); }
  }));
  f.spot('inside', null, -.05, .86, .1, { part: p0, maxH: 0.6, label: '열쇠 가게 계산대 위', scale: 1.5 });
  f.spot('inside', null, .1, .015, .4, { part: p0, maxH: 0.7, label: '열쇠 가게 계산대 앞', scale: 1.5 });
  f.spot('inside', null, .35, 1.085, -.12, { part: p0, maxH: .35, label: '도장 서랍장 위', scale: 1.1 });
}

function flowerStall(f, W, D) {
  const zb = -D / 2;
  f.add(mc('um-flower', ({ add, tube }) => {
    // the stepped bucket stand along the back with bunches of flowers
    add(G.box(W - .2, .3, .3, .02), C.wood, 0, .15, zb + .2); add(G.box(W - .2, .55, .25, .02), C.wood, 0, .275, zb + .08);
    const kinds = ['tulip', 'rose', 'sun', 'baby', 'tulip'];
    for (let k = 0; k < 4; k++) { const x = -.42 + k * .28; bucket(add, x, .55, zb + .1, .85); flowerBunch(add, tube, x, .72, zb + .1, kinds[k], .9); }
    for (let k = 0; k < 3; k++) { const x = -.3 + k * .3; bucket(add, x, .3, zb + .33, .9); flowerBunch(add, tube, x, .48, zb + .33, kinds[k + 2], .9); }
    // the wrapping table up front (its drawer is part1): paper roll, ribbon spools, scissors, a vase
    add(G.box(.62, .74, .4, .025), '#e9dcc6', .25, .37, .25); add(G.box(.66, .04, .44, .015), C.wood, .25, .76, .25);
    add(G.cyl(.05, .05, .5, 12), C.pink, .22, .83, .14, 0, 0, HP); add(G.box(.32, .01, .2, .004), '#fbd7e1', .22, .785, .25);
    add(G.cyl(.04, .04, .04, 12), C.yellow, .46, .8, .34); add(G.cyl(.04, .04, .04, 12), C.mint, .5, .8, .22);
    add(G.cyl(.05, .07, .18, 12), '#cfe8ef', .03, .87, .33); flowerBunch(add, tube, .03, .9, .33, 'rose', .6);
    // little succulents on a wall shelf, a watering can
    add(G.box(.5, .03, .16, .01), C.wood, -.3, 1.62, zb + .1);
    for (let k = 0; k < 3; k++) { add(G.cyl(.05, .04, .07, 10), [C.coral, C.cream, C.sky][k], -.46 + k * .16, 1.67, zb + .1); add(G.sph(.045, 8, 6), C.leaf, -.46 + k * .16, 1.73, zb + .1, 0, 0, 0, [1, .7, 1]); }
    add(G.cyl(.09, .1, .18, 12), C.mint, -.45, .09, .45); tube([-.37, .12, .45], [-.24, .25, .45], .015, C.mint, 6); add(G.cyl(.03, .02, .03, 8), C.mint, -.23, .26, .45, 0, 0, -HP);
  }));
  label(f.group, 'todayflower', .34, .28, (c, Wd, Hd) => { c.fillStyle = '#3d4a3f'; roundRect(c, 0, 0, Wd, Hd, 8); c.fill(); fitText(c, '오늘의 꽃', Wd / 2, Hd * .32, Wd * .82, Hd * .26, C.yellow, { weight: 'bold' }); fitText(c, '튤립', Wd / 2, Hd * .68, Wd * .7, Hd * .26, '#ffd0dc'); }, .38, 1.55, zb + .045);
  const dr = grp(); put(dr, .25, .58, .45); f.add(dr);
  dr.add(mc('um-flower-drawer', ({ add }) => { add(G.box(.54, .16, .03, .01), shade2('#e9dcc6'), 0, 0, 0); add(G.box(.12, .025, .025, .008), C.brass, 0, 0, .025); add(G.box(.5, .02, .34, .006), '#e9dcc6', 0, -.07, -.17); }));
  const p1 = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .3 * t; }, { label: '꽃집 포장대 서랍', sfx: 'drawer', dur: .35 });
  f.spot('inside', dr, 0, -.06, -.17, { part: p1, maxH: 0.3, label: '꽃집 서랍 안', scale: 1.1 });
  f.spot('on', null, .4, .79, .22, { label: '포장대 위', maxH: 0.6, scale: 1.5 });
  f.spot('behind', null, -.15, .58, -D / 2 + .3, { label: '꽃 양동이 사이', maxH: 0.4, scale: 1.15 });
  f.spot('on', null, -.15, 1.64, -D / 2 + .1, { label: '다육이 선반 위', maxH: 0.32, scale: 1.0 });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// um_kiosk — 분식 매대 (1.4 × .6): 떡볶이 철판, 어묵 국물 통과 꼬치, 순대 찜통(뚜껑 = part0), 돈통 서랍(part1), 둥근 의자 둘
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
B.um_kiosk = f => {
  const W = 1.36, D = .56, H = .86;
  f.walkBoxes = [[-W / 2, 0, -D / 2, W / 2, 1.1, D / 2], [-.5, 0, D / 2, .5, .5, D / 2 + .42]];
  f.noSolid = true;
  f.add(mc('um-kiosk', ({ add, tube }) => {
    add(G.box(W, H, D, .04), '#f0a040', 0, H / 2, 0);
    for (let k = 0; k < 7; k++) add(G.pbox(.09, H - .2, .01), k % 2 ? '#ffd28a' : '#f0a040', -W / 2 + .14 + k * .18, H / 2, D / 2 + .004);
    add(G.box(W + .04, .05, D + .04, .02), C.steel, 0, H + .02, 0);
    // tteokbokki pan: a wide steel tray, red sauce, rice cakes, fish-cake triangles, green onion
    const tx = -.33;
    add(G.box(.58, .06, .4, .02), C.steel2, tx, H + .07, -.02); add(G.box(.52, .02, .34, .01), '#d9442f', tx, H + .095, -.02);
    for (let k = 0; k < 16; k++) { const a = k * 2.4; add(G.cap(.022, .07, 2, 6), '#fff0e0', tx + Math.cos(a) * (.05 + (k % 4) * .05), H + .115, -.02 + Math.sin(a) * .12, HP, a, 0); }
    for (let k = 0; k < 4; k++) add(G.box(.07, .015, .05, .006), '#f3c78a', tx - .15 + k * .1, H + .12, .08 - (k % 2) * .16, 0, k, 0);
    for (let k = 0; k < 8; k++) add(G.pbox(.02, .008, .01), C.leaf, tx - .2 + k * .055, H + .127, (k % 3 - 1) * .07);
    // fish-cake broth trough with skewers
    const ox = .22;
    add(G.box(.3, .12, .3, .02), C.steel2, ox, H + .08, -.04); add(G.box(.26, .02, .26, .01), '#c89a5a', ox, H + .13, -.04);
    for (let k = 0; k < 6; k++) { const x = ox - .1 + (k % 3) * .1, z = -.12 + Math.floor(k / 3) * .14; tube([x, H + .12, z], [x + .02, H + .42, z - .02], .006, '#e6cfa2', 4); add(G.box(.05, .1, .03, .012), '#f3c78a', x + .01, H + .2, z - .01, 0, 0, .3); }
    // paper cups, napkins
    for (let k = 0; k < 4; k++) add(G.cyl(.035, .03, .05, 10), C.white, .52, H + .06 + k * .035, .14);
    add(G.box(.08, .1, .06, .01), C.steel, .52, H + .1, -.12);
    // two round stools out front
    stool(add, -.3, 0, D / 2 + .22, C.red); stool(add, .3, 0, D / 2 + .22, '#e9a03c');
  }));
  label(f.group, 'kiosk', .5, .16, signDraw('분식', C.cream, '#d9442f', { size: .66 }), 0, H - .14, D / 2 + .012);
  // 순대 찜통 (part0): round steamer, its lid lifts and turns
  const sx = .52, sz = .02;
  f.add(mc('um-kiosk-steamer', ({ add }) => { add(G.cyl(.11, .11, .16, 16), C.steel, sx, H + .12, sz); add(G.tor(.11, .012, PI * 2, 4, 16), C.steel2, sx, H + .2, sz, HP, 0, 0); }));
  const lid = grp(); put(lid, sx - .11, H + .2, sz); f.add(lid);
  lid.add(mc('um-kiosk-lid', ({ add }) => { add(dome(.115, 16, 5), C.steel, .11, 0, 0, 0, 0, 0, [1, .45, 1]); add(G.sph(.025, 8, 6), C.dark, .11, .055, 0); }));
  const p0 = f.part('lid', lid, t => { lid.rotation.z = 1.4 * t; }, { label: '순대 찜통 뚜껑', sfx: 'open', dur: .35 });
  // cash drawer (part1) under the counter top, on the shop side (-z)... on the front for the player: a slim money drawer
  const dr = grp(); put(dr, .35, H - .12, D / 2 + .01); f.add(dr);
  dr.add(mc('um-kiosk-drawer', ({ add }) => { add(G.box(.42, .12, .03, .01), '#ffd28a', 0, 0, 0); add(G.box(.1, .025, .025, .008), C.dark, 0, 0, .025); add(G.box(.38, .02, .32, .006), C.steel, 0, -.05, -.16); }));
  const p1 = f.part('drawer', dr, (t, b) => { dr.position.z = b.p.z + .26 * t; }, { label: '분식 매대 돈통 서랍', sfx: 'drawer', dur: .3 });
  f.spot('on', null, -.3, .48, D / 2 + .22, { label: '빨간 의자 위', maxH: 0.7, scale: 1.6 });
  f.spot('on', null, .3, .48, D / 2 + .22, { label: '주황 의자 위', maxH: 0.7, scale: 1.6 });
  f.spot('under', null, 0, .01, D / 2 + .25, { label: '분식 매대 앞 의자 사이', maxH: 0.42, scale: 1.3 });
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// um_office — 관리실 (2.4 × 3.0, 앞 +z): 복도 쪽 벽(서, 창 + 문틀), 앞은 낮은 창구 턱, 동쪽은 단면 턱. 안: CCTV 책상(서랍 = part1),
// 벽의 열쇠 걸이함(part0, 잠글 수 있음 — 색), 서류장(가운데 서랍 = part2), 커피 탁자(컵라면·보온병), 옷걸이(경비복·모자), 시계·달력·일지
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
B.um_office = f => {
  const W = 2.4, D = 3.0, x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2, H = SOF, door0 = .45, door1 = 1.42, dx = x0 + .41;
  f.noSolid = true;
  f.collideBox = [x0, -.1, z0, x1, -.02, z1];
  f.walkBoxes = [
    [x0 - .02, 0, z0, x0 + .14, .64, door0], [x0 - .02, 0, z1 - .08, x1, 1.0, z1 + .06], [x1 - .08, 0, z0, x1 + .04, .5, z1],
    [x0 + .1, 0, -1.05, x0 + .72, .85, .32], [-.42, 0, z0, .12, 1.2, z0 + .52], [.6, 0, .12, 1.12, .8, .62], [.8, 0, .85, 1.2, 1.8, 1.25],
  ];
  f.add(mc('um-office', ({ add, tube }) => {
    // floor: pale blue-grey linoleum with a border
    add(G.box(W - .14, .012, D - .1, .004), '#dfe5ea', 0, .006, -.02);
    for (let z = z0 + .3; z < z1; z += .3) add(G.pbox(W - .16, .004, .008), '#cfd7de', 0, .014, z);
    // corridor wall (W): a low wall up to the doorway (a tall one hid the key shop from the start view), then the doorway with
    // its frame and the 관리실 plate
    add(G.box(.12, .62, door0 - z0, .02), C.wall, x0 + .06, .31, (z0 + door0) / 2); add(G.box(.14, .04, door0 - z0, .01), C.wall2, x0 + .06, .64, (z0 + door0) / 2);
    add(G.box(.14, .2, door1 - door0 + .1, .02), C.wall, x0 + .06, H - .1, (door0 + door1) / 2);
    for (const z of [door0, door1]) add(G.box(.16, H - .2, .06, .015), '#8aa0c8', x0 + .06, (H - .2) / 2, z);
    add(G.box(.16, .05, door1 - door0 + .06, .015), '#8aa0c8', x0 + .06, H - .22, (door0 + door1) / 2);
    // the front: a low counter wall, window posts and a top rail (open service window)
    add(G.box(W, .96, .12, .02), C.wall, 0, .48, z1);
    add(G.box(W + .04, .05, .32, .015), C.wood, 0, .985, z1);
    for (const x of [x0 + .03, -.4, .4, x1 - .03]) add(G.box(.06, H - 1.0, .08, .015), '#8aa0c8', x, (1.0 + H) / 2, z1);
    add(G.box(W, .1, .1, .02), '#8aa0c8', 0, H - .05, z1);
    for (const x of [x0 + .4, x1 - .4]) add(G.box(.66, .02, .02, .006), '#b9cde0', x, 1.6, z1);
    // a bell on the counter and a little stand of pens
    add(G.cyl(.05, .06, .02, 12), C.dark, .1, 1.02, z1 + .05); add(dome(.045, 12, 5), C.brass, .1, 1.03, z1 + .05);
    add(G.cyl(.035, .035, .08, 10), C.sky, -.12, 1.05, z1 + .05); for (let k = 0; k < 3; k++) tube([-.12 + (k - 1) * .012, 1.06, z1 + .05], [-.12 + (k - 1) * .03, 1.16, z1 + .05], .006, [C.red, C.navy, C.leaf2][k], 4);
    // the east side: a low cut wall (section), its top dark
    add(G.box(.12, .42, D, .02), C.wall2, x1 - .02, .21, 0); add(G.box(.14, .04, D + .02, .01), C.cut, x1 - .02, .43, 0);
    // back wall finish inside the office (the hall wall is behind): a pale blue band, a clock, a calendar, the duty board
    add(G.box(W - .2, 1.0, .02, .01), '#e6ecf3', 0, .5, z0 + .012);
    add(G.cyl(.15, .15, .04, 20), C.white, .3, 2.12, z0 + .03, HP, 0, 0); add(G.tor(.15, .02, PI * 2, 4, 20), C.navy, .3, 2.12, z0 + .05);
    add(G.pbox(.02, .1, .01), C.dark, .3, 2.16, z0 + .056); add(G.pbox(.08, .018, .01), C.dark, .33, 2.12, z0 + .056);
    // CCTV desk along the corridor wall (inside), three monitors facing in, keyboard, a mug, a walkie-talkie
    add(G.box(.6, .04, 1.36, .015), C.wood, dx, .76, -.37);
    add(G.box(.56, .72, .04, .01), shade2(C.wood), dx, .38, -1.03); add(G.box(.04, .72, 1.3, .01), shade2(C.wood), x0 + .14, .38, -.37);
    add(G.box(.5, .7, .4, .015), C.wood, dx, .37, .1);
    for (const [z, y] of [[-.62, 1.0], [-.18, 1.0], [-.4, 1.36]]) { add(G.box(.08, .34, .44, .02), C.dark, x0 + .25, y, z); add(G.pbox(.012, .3, .4), '#bfe0d0', x0 + .3, y, z); }
    add(G.box(.1, .26, .08, .01), C.dark, x0 + .25, .84, -.4);
    add(G.box(.18, .02, .42, .006), C.steel2, x0 + .52, .79, -.42);
    add(G.cyl(.04, .035, .09, 10), C.coral, x0 + .58, .82, -.1); add(G.tor(.025, .009, PI * 2, 4, 8), C.coral, x0 + .58, .82, -.055);
    add(G.box(.05, .14, .03, .01), C.dark, x0 + .5, .85, -1.0); tube([x0 + .5, .92, -1.0], [x0 + .5, 1.0, -1.0], .006, C.dark, 4);
    // the office chair
    const chx = x0 + .95, chz = -.45;
    add(G.cyl(.18, .18, .03, 10), C.dark, chx, .05, chz); tube([chx, .06, chz], [chx, .42, chz], .025, C.steel2, 6);
    add(G.box(.42, .08, .42, .04), C.navy, chx, .46, chz); add(G.box(.08, .48, .4, .04), C.navy, chx + .2, .74, chz);
    // filing cabinet against the back wall, a plant and binders on top
    const cx = -.15;
    add(G.box(.5, 1.12, .5, .02), '#b8c4d4', cx, .56, z0 + .27);
    for (const y of [.25, .6, .95]) { add(G.box(.44, .3, .02, .01), '#c9d3e0', cx, y, z0 + .53); add(G.box(.14, .03, .025, .008), C.steel2, cx, y + .06, z0 + .545); }
    for (let k = 0; k < 3; k++) add(G.box(.06, .26, .2, .01), [C.red, C.navy, C.mustard][k], cx - .15 + k * .065, 1.25, z0 + .25);
    // coffee table on the east side: kettle, two cup noodles, a thermos
    const tx = .86, tz = .37;
    add(G.box(.5, .04, .48, .015), C.wood, tx, .7, tz); for (const [ax, az] of [[-.2, -.19], [.2, -.19], [-.2, .19], [.2, .19]]) add(G.box(.04, .7, .04, .01), C.woodD, tx + ax, .35, tz + az);
    add(G.cyl(.08, .09, .18, 12), C.white, tx - .12, .81, tz - .1); add(G.box(.03, .1, .04, .01), C.dark, tx - .03, .82, tz - .1); add(G.cyl(.02, .03, .04, 8), C.white, tx - .2, .86, tz - .1, 0, 0, .8);
    add(G.cyl(.06, .05, .1, 12), C.red, tx + .1, .77, tz + .05); add(G.cyl(.061, .061, .012, 12), C.cream, tx + .1, .826, tz + .05);
    add(G.cyl(.06, .05, .1, 12), C.mustard, tx + .14, .77, tz - .12); add(G.cyl(.061, .061, .012, 12), C.cream, tx + .14, .826, tz - .12);
    // coat stand: the guard's jacket and cap, a flashlight
    const kx = 1.0, kz = 1.05;
    add(G.cyl(.14, .16, .03, 10), C.dark, kx, .015, kz); tube([kx, .03, kz], [kx, 1.68, kz], .02, C.woodD, 6);
    for (const a of [0, 2.1, 4.2]) tube([kx, 1.6, kz], [kx + Math.cos(a) * .13, 1.66, kz + Math.sin(a) * .13], .01, C.woodD, 4);
    add(G.box(.36, .6, .16, .05), '#5d74a8', kx - .02, 1.28, kz + .06); add(G.box(.08, .06, .01, .01), C.yellow, kx - .08, 1.42, kz + .145);
    add(G.cyl(.11, .12, .07, 12), '#3e4f7a', kx + .06, 1.72, kz); add(G.box(.14, .02, .1, .01), C.dark, kx + .13, 1.69, kz + .04);
    tube([kx + .12, 1.5, kz - .05], [kx + .12, 1.3, kz - .05], .025, C.yellow, 8);
    // a CCTV camera in the back corner
    add(G.box(.08, .06, .16, .02), C.white, x1 - .2, 2.2, z0 + .14, .3, -.6, 0); add(G.cyl(.025, .025, .02, 8), C.dark, x1 - .26, 2.17, z0 + .2, HP, -.6, 0);
  }));
  label(f.group, 'office-front', .7, .16, signDraw('관리실', '#8aa0c8', C.white, { size: .66 }), 0, H - .05, z1 + .052);
  label(f.group, 'office-side', .7, .16, signDraw('관리실', '#8aa0c8', C.white, { size: .66 }), x0 - .005, H - .1, (door0 + door1) / 2, 0, -HP, 0);
  label(f.group, 'calendar', .3, .36, (c, Wd, Hd) => { paperFill(c, Wd, Hd, C.white, 3); c.fillStyle = C.red; c.fillRect(0, 0, Wd, Hd * .2); fitText(c, '10', Wd / 2, Hd * .1, Wd * .5, Hd * .16, C.white, { weight: 'bold' });
    c.fillStyle = '#c9c0b4'; for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) c.fillRect(Wd * (.08 + k * .125), Hd * (.28 + r * .14), Wd * .09, Hd * .09); }, .95, 1.9, z0 + .025);
  label(f.group, 'dutylog', .42, .3, (c, Wd, Hd) => { paperFill(c, Wd, Hd, '#fbf3e0', 5); fitText(c, '근무 일지', Wd / 2, Hd * .18, Wd * .8, Hd * .2, C.ink, { weight: 'bold' }); c.fillStyle = 'rgba(74,59,82,.35)'; for (let k = 0; k < 4; k++) c.fillRect(Wd * .1, Hd * (.38 + k * .14), Wd * (.5 + (k % 2) * .25), 2); fitText(c, '마감 10시', Wd * .7, Hd * .9, Wd * .5, Hd * .14, C.red); }, -.15, 1.75, z0 + .025);
  // CCTV pictures on the three monitors (a little view of the mall: shops, the corridor)
  const cam = (c, Wd, Hd) => { c.fillStyle = '#2f4a44'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#9fd7c0'; for (let k = 0; k < 4; k++) c.fillRect(Wd * (.08 + k * .22), Hd * .25, Wd * .16, Hd * .35); c.fillStyle = '#cfe8dc'; c.fillRect(0, Hd * .7, Wd, Hd * .06); fitText(c, 'CAM', Wd * .2, Hd * .12, Wd * .3, Hd * .14, '#d9fbe9'); };
  for (const [z, y] of [[-.62, 1.0], [-.18, 1.0], [-.4, 1.36]]) label(f.group, 'cctv', .38, .27, cam, x0 + .307, y, z, 0, HP, 0);
  // part0: the key cabinet on the corridor wall inside (glass-front door; hooks with tagged keys; a shelf at the bottom)
  const KX = x0 + .14, KW = .62, KH = .85, KY = 1.2, KD = .3, kz = z0 + .03;
  f.add(mc('um-office-keycab', ({ add, tube }) => {
    add(G.box(KW, KH, .03, .01), '#e9dcc6', KX + KW / 2, KY + KH / 2, kz + .015);
    for (const xx of [KX + .015, KX + KW - .015]) add(G.box(.03, KH, KD, .01), '#e9dcc6', xx, KY + KH / 2, kz + KD / 2);
    for (const yy of [KY + .015, KY + KH - .015]) add(G.box(KW, .03, KD, .01), '#e9dcc6', KX + KW / 2, yy, kz + KD / 2);
    add(G.box(KW - .06, KH - .06, .02, .01), '#c8b48f', KX + KW / 2, KY + KH / 2, kz + .035);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) {
      const x = KX + .09 + k * .11, y = KY + KH - .1 - r * .14;
      tube([x, y, kz + .045], [x, y, kz + .095], .005, C.steel2, 4);
      add(G.box(.03, .07, .008, .004), k % 2 ? C.brass : C.steel, x, y - .05, kz + .09);
      add(G.box(.035, .04, .006, .004), [C.red, C.yellow, C.sky, C.leaf, C.pink][(k + r) % 5], x, y - .1, kz + .095);
    }
    add(G.box(KW - .06, .025, KD - .02, .006), C.woodD, KX + KW / 2, KY + .12, kz + KD / 2);
  }));
  const cab = grp(); put(cab, KX, KY, kz + KD + .005); f.add(cab);
  cab.add(mc('um-office-keycab-door', ({ add }) => {
    add(G.box(KW, KH, .03, .015), '#c9a37a', KW / 2, KH / 2, 0);
    add(G.box(KW - .12, KH - .12, .012, .01), '#cfe8ef', KW / 2, KH / 2, .012);
    add(G.box(.03, .1, .03, .008), C.brass, KW - .06, KH / 2, .02);
  }));
  const p0 = f.part('door', cab, t => { cab.rotation.y = -1.7 * t; }, { label: '관리실 열쇠 걸이함', sfx: 'open', dur: .35 });
  p0.lockable = true; p0.lockKind = 'color'; p0.lockAt = { parent: cab, x: KW - .1, y: KH / 2 - .14, z: .04 };
  f.spot('inside', null, KX + KW / 2, KY + .135, kz + KD / 2 + .02, { part: p0, maxH: .36, label: '열쇠 걸이함 아래 칸', scale: 1 });
  // part1: the desk drawer (in the pedestal by the door end)
  const dr = grp(); put(dr, dx + .25, .58, .1); f.add(dr);
  dr.add(mc('um-office-drawer', ({ add }) => { add(G.box(.03, .2, .36, .01), shade2(C.wood), 0, 0, 0); add(G.box(.025, .03, .12, .008), C.steel2, .02, 0, 0); add(G.box(.4, .02, .32, .006), C.wood, -.2, -.08, 0); }));
  const p1 = f.part('drawer', dr, (t, b) => { dr.position.x = b.p.x + .28 * t; }, { label: 'CCTV 책상 서랍', sfx: 'drawer', dur: .3 });
  f.spot('inside', dr, -.2, -.07, 0, { part: p1, maxH: 0.3, label: '책상 서랍 안', scale: 1.1 });
  // part2: the filing cabinet's middle drawer
  // open places in the office
  f.spot('on', null, dx + .08, .78, .08, { label: 'CCTV 책상 위', maxH: 0.6, scale: 1.5 });
  f.spot('under', null, dx, .01, -.6, { label: 'CCTV 책상 밑', maxH: 0.7, scale: 1.5 });
  f.spot('on', null, x0 + .95, .5, -.45, { label: '관리실 의자 위', maxH: 0.6, scale: 1.5 });
  f.spot('on', null, -.05, 1.13, z0 + .27, { label: '서류장 위', maxH: 0.45, scale: 1.2 });
  f.spot('on', null, .74, .72, .52, { label: '커피 탁자 위', maxH: 0.45, scale: 1.3 });
  f.spot('behind', null, .74, .01, .88, { label: '옷걸이 밑', maxH: 0.75, scale: 1.5 });
  f.spot('on', null, .55, .998, z1 + .04, { label: '관리실 창구 위', maxH: 0.6, scale: 1.5 });
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// um_safe — 관리실 금고 (마지막 자물쇠: 비밀번호). 짙은 청록 몸통, 놋쇠 다이얼과 손잡이, '금고' 판; 안은 두 칸 — 위 칸에 다 같이 먹을
// 간식(초코파이 상자·과자 봉지·주스 팩·사탕 병)이 꽉, 아래 칸이 숨김 자리. 위에 작은 스탠드 불빛.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
B.um_safe = f => {
  const W = .86, H = 1.0, D = .66, y0 = .08, z0 = -.05, fz = z0 + D / 2, body = '#4f7d8c', body2 = '#65939f', inner = '#2f4d58';
  f.walkBoxes = [[-W / 2 - .02, 0, z0 - D / 2, W / 2 + .02, y0 + H + .2, fz + .06]];
  f.noSolid = true;
  f.add(mc('um-safe', ({ add }) => {
    add(G.box(W + .08, y0, D + .08, .02), C.dark, 0, y0 / 2, z0);
    add(G.box(W, .06, D, .03), body, 0, y0 + .03, z0); add(G.box(W, .06, D, .03), body, 0, y0 + H - .03, z0);
    for (const sx of [-1, 1]) add(G.box(.07, H, D, .03), body, sx * (W / 2 - .035), y0 + H / 2, z0);
    add(G.box(W, H, .06, .03), body, 0, y0 + H / 2, z0 - D / 2 + .03);
    add(G.pbox(W - .14, H - .12, .01), inner, 0, y0 + H / 2, z0 - D / 2 + .065);
    add(G.pbox(W - .14, .025, D - .1), '#8aa9b2', 0, y0 + H * .5, z0 + .02);
    add(G.pbox(W - .14, .01, D - .1), inner, 0, y0 + .065, z0 + .02);
    // the snacks on the upper shelf (seen when the door is open)
    const sy = y0 + H * .5 + .013, sz = z0 - .08;
    add(G.box(.26, .1, .18, .015), C.red, -.2, sy + .05, sz); add(G.box(.2, .03, .14, .01), '#f6d7a8', -.2, sy + .1, sz);
    add(G.box(.18, .22, .07, .03), C.yellow, .02, sy + .11, sz - .02, 0, .2, 0); add(G.box(.18, .03, .07, .01), C.coral, .02, sy + .2, sz - .02, 0, .2, 0);
    for (let k = 0; k < 3; k++) { add(G.box(.06, .12, .045, .01), [C.mint, C.pink, C.sky][k], .18 + k * .065, sy + .06, sz + .06); add(G.cyl(.004, .004, .05, 4), C.white, .19 + k * .065, sy + .14, sz + .06, 0, 0, .3); }
    add(G.cyl(.06, .06, .14, 12), '#e6f1f3', .2, sy + .07, sz - .12); for (let k = 0; k < 5; k++) add(G.sph(.022, 6, 4), [C.red, C.yellow, C.leaf, C.pink, C.sky][k], .17 + (k % 3) * .03, sy + .04 + Math.floor(k / 3) * .04, sz - .1);
    add(G.cyl(.065, .065, .03, 12), C.white, .2, sy + .155, sz - .12);
    // a gold plate and a small lamp on top
    add(G.cyl(.08, .1, .03, 12), C.dark, .24, y0 + H + .015, z0 - .1); add(G.cyl(.012, .012, .26, 6), C.steel2, .24, y0 + H + .16, z0 - .1);
    add(G.cone(.1, .12, 14), C.mustard, .24, y0 + H + .32, z0 - .05, .5, 0, 0); add(G.sph(.035, 8, 6), C.tube, .24, y0 + H + .28, z0);
  }));
  const pv = grp(); put(pv, -W / 2 + .03, y0 + H / 2, fz + .02); f.add(pv);
  const cx = W / 2 - .03;
  pv.add(mc('um-safe-door', ({ add, tube }) => {
    add(G.box(W - .04, H - .04, .08, .04), body2, cx, 0, 0);
    add(G.box(W - .2, H - .2, .012, .03), '#78a5b0', cx, 0, .042);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(G.sph(.02, 8, 6), C.steel, cx + sx * (W / 2 - .09), sy * (H / 2 - .09), .046, 0, 0, 0, [1, 1, .5]);
    add(G.cyl(.12, .12, .04, 28), C.brass, cx - .08, .12, .06, HP, 0, 0); add(G.cyl(.05, .055, .04, 16), '#c99a36', cx - .08, .12, .1, HP, 0, 0);
    for (let k = 0; k < 12; k++) { const a = k * PI / 6; add(G.pbox(.01, .03, .006), C.dark, cx - .08 + Math.sin(a) * .1, .12 + Math.cos(a) * .1, .083, 0, 0, -a); }
    const hx = cx + .2, hy = -.15;
    add(G.cyl(.035, .035, .05, 14), C.steel2, hx, hy, .065, HP, 0, 0);
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + HP; tube([hx, hy, .085], [hx + Math.cos(a) * .1, hy + Math.sin(a) * .1, .085], .013, C.steel, 6); add(G.sph(.024, 8, 6), C.brass, hx + Math.cos(a) * .105, hy + Math.sin(a) * .105, .085); }
    for (const dy of [-.3, .3]) add(G.cyl(.028, .028, .14, 12), C.steel2, .0, dy, .02);
  }));
  label(pv, 'safeplate', .3, .1, signDraw('금고', C.brass, C.dark, { size: .7 }), cx, H / 2 - .12, .05);
  const p = f.part('door', pv, t => { pv.rotation.y = -1.85 * t; }, { label: '관리실 금고', sfx: 'open', dur: .5 });
  p.lockable = true; p.lockKind = 'code'; p.lockAt = { parent: pv, x: cx + .2, y: .1, z: .07 };
  f.spot('inside', null, -.05, y0 + .07, z0 + .02, { part: p, maxH: H * .5 - .12, label: '금고 아래 칸', scale: 1.25 });
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// um_escalator — 에스컬레이터 미니 (1.0 × 2.2, 앞 +z = 아래 끝, 뒤로 올라감). 컨베이어(27) 변형: 터치하면 계단이 저절로 내려오며
// 맨 위 계단에 놓여 있던 쇼핑백이 아래 승강장까지 실려 내려옴(쇼핑백 안이 숨김 자리). 옆 판은 유리 + 검은 손잡이.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const ESC = { zb: .78, zt: -.98, H: 1.72, N: 9, w: .78 };
B.um_escalator = f => {
  const { zb, zt, H, N, w } = ESC, Lz = zb - zt, ang = Math.atan2(H, Lz), L = Math.hypot(Lz, H);
  f.noSolid = true;
  f.walkBoxes = [[-.52, 0, -1.12, .52, H + 1, zb - .05]];
  f.add(mc('um-escalator', ({ add, tube, addM }) => {
    // the side skirts: a wedge in profile (truss under the steps), cream with a steel stripe
    const prof = new THREE.Shape();
    prof.moveTo(zb + .32, 0); prof.lineTo(zb + .32, .1); prof.lineTo(zb, .1); prof.lineTo(zt, H + .1); prof.lineTo(zt - .14, H + .1); prof.lineTo(zt - .14, 0); prof.closePath();
    for (const sx of [-1, 1]) {
      const g = G.ext(prof, .1, .012, 2);
      add(g, '#ece6dc', sx > 0 ? w / 2 + .1 : -w / 2, 0, 0, 0, -HP, 0);
    }
    // landings with comb plates
    add(G.box(w + .2, .1, .34, .02), C.steel, 0, .05, zb + .16); for (let k = 0; k < 6; k++) add(G.pbox(w - .1, .006, .012), C.steel2, 0, .102, zb + .04 + k * .05);
    add(G.box(w + .2, .1, .16, .02), C.steel, 0, H + .05, zt - .06);
    // the glass balustrades and the black handrails, looping round at the ends
    for (const sx of [-1, 1]) {
      const x = sx * (w / 2 + .05);
      add(G.box(.025, .55, L, .01), C.glassC, x, (H + .1) / 2 + .32, (zb + zt) / 2, ang, 0, 0);
      tube([x, .72, zb + .22], [x, H + .72, zt], .035, C.rubber, 8);
      tube([x, .72, zb + .22], [x, .4, zb + .3], .035, C.rubber, 8);
      tube([x, H + .72, zt], [x, H + .6, zt - .2], .035, C.rubber, 8);
      add(G.sph(.05, 8, 6), C.steel, x, .72, zb + .22);
    }
    // the step bed: a dark slope under the moving steps
    add(G.box(w, .04, L, .01), C.dark, 0, H / 2 + .04, (zb + zt) / 2, ang, 0, 0);
  }));
  // the moving steps: each its own pivot so it can run round (bake keeps pivots apart)
  const steps = [];
  for (let k = 0; k < N; k++) {
    const s = grp(); f.add(s);
    s.add(mc('um-esc-step', ({ add }) => { add(G.box(w - .04, .05, .2, .01), '#8e95a3', 0, .025, 0); add(G.box(w - .04, .1, .03, .006), '#7a8190', 0, -.03, -.09); add(G.pbox(w - .06, .01, .02), C.yellow, 0, .052, .085); }));
    steps.push(s);
  }
  const at = (u, o) => { o.position.set(0, .1 + u * H, zb - u * Lz); };
  // the shopping bag riding down from the top
  const bag = grp(); f.add(bag);
  bag.add(mc('um-esc-bag', ({ add, tube }) => {
    add(G.box(.3, .32, .16, .02), '#f5e3c3', 0, .16, 0); add(G.box(.3, .06, .162, .01), C.coral, 0, .26, 0);
    for (const sx of [-1, 1]) tube([sx * .08, .32, 0], [0, .42, 0], .01, C.woodD, 4), tube([0, .42, 0], [-sx * .08 + sx * .16, .32, 0], .01, C.woodD, 4);
    add(G.cyl(.05, .05, .12, 10), C.leaf, -.07, .36, .02);
  }));
  const place = (t) => {
    for (let k = 0; k < N; k++) {
      let u = ((k + .5) / N - t * 2) % 1; if (u < 0) u += 1;
      at(u, steps[k]);
      const e = Math.min(1, u / .05, (1 - u) / .05); steps[k].scale.set(1, Math.max(.05, e), Math.max(.05, e));
    }
    const ub = .92 - 1.1 * sm(t);
    if (ub >= 0) { at(ub, bag); bag.position.y += .03; } else { bag.position.set(0, .1, zb - ub / .18 * .14); }
  };
  const p = f.part('slide', [...steps, bag], t => place(t), { label: '에스컬레이터', sfx: 'ratchet', dur: 2.6 });
  p.setOpen(0);
  f.spot('inside', bag, 0, .33, 0, { part: p, maxH: .3, label: '에스컬레이터 위 쇼핑백 안', scale: .9 });
  label(f.group, 'esc-b1', .22, .14, signDraw('B1', C.navy, C.white, { size: .62 }), w / 2 + .1, .62, zb + .27, 0, HP, 0);
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// um_revolvingdoor — 회전문 (1.3 × 1.3): 유리 반원 벽 둘(±z), 가운데 기둥과 날개 넷, 위 둥근 지붕 판('지하철 연결'). 회전(19): 터치하면
// 날개가 반 바퀴 저절로 돌아 뒤쪽(지하철 쪽) 칸에 있던 우산 꽂이 칸이 앞으로 옴(그 안이 숨김 자리).
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
B.um_revolvingdoor = f => {
  const R = .6, H = 2.1;
  f.noSolid = true;
  f.walkBoxes = [[-R - .05, 0, -R - .05, R + .05, H + .2, R + .05]];
  f.add(mc('um-revolve', ({ add }) => {
    add(G.cyl(R + .06, R + .06, .05, 28), C.steel2, 0, .025, 0);
    // (10/24 아트 점검 2차: the roof was a plain white drum — now a navy fascia with a brass rim and little lamps, a low steel dome
    // with eight ribs and a finial on top, like a real subway revolving door's canopy)
    add(G.cyl(R + .08, R + .08, .14, 28), C.navy, 0, H + .07, 0);
    add(G.tor(R + .085, .016, PI * 2, 4, 32), C.brass, 0, H + .005, 0, HP, 0, 0); add(G.tor(R + .085, .016, PI * 2, 4, 32), C.brass, 0, H + .14, 0, HP, 0, 0);
    for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2; add(G.sph(.018, 6, 4), '#fff3c4', Math.cos(a) * (R + .09), H + .07, Math.sin(a) * (R + .09)); }
    add(G.cyl(R * .5, R + .1, .12, 28), C.steel, 0, H + .2, 0); add(G.cyl(R * .5, R * .5, .02, 20), C.steel2, 0, H + .27, 0);
    for (let k = 0; k < 8; k++) { const a = k / 8 * PI * 2, rr = R * .78; add(G.box(.025, .03, R * .55, .008), C.steel2, Math.cos(a) * rr, H + .215, Math.sin(a) * rr, -.4, -a + HP, 0); }
    add(G.cyl(.012, .02, .14, 6), C.brass, 0, H + .34, 0); add(G.sph(.035, 8, 6), C.brass, 0, H + .42, 0);
    // the curved side frames (±z): top and bottom rails and three posts each
    for (const sz of [-1, 1]) for (let k = 0; k < 3; k++) { const a = (k - 1) * .55, x = Math.sin(a) * R, z = sz * Math.cos(a) * R; add(G.cyl(.025, .025, H, 8), C.steel2, x, H / 2, z); }
  }));
  for (const sz of [-1, 1]) {
    const gm = mesh(geo('um-revolve-glass|' + sz, () => new THREE.CylinderGeometry(R, R, H - .1, 20, 1, true, sz > 0 ? -PI / 4 : PI * .75, PI / 2)), mat(C.glassC, { opacity: .32, side: THREE.DoubleSide }), { cast: false });
    put(gm, 0, H / 2, 0); f.add(gm);
  }
  f.add(mc('um-revolve-rings', ({ add }) => { for (const y of [.08, H - .05]) add(G.tor(R, .022, PI * 2, 4, 28), C.steel2, 0, y, 0, HP, 0, 0); }));
  label(f.group, 'subwaydoor', .7, .13, signDraw('지하철 연결', '#3f8f5a', C.white, { size: .62 }), R * .72, H + .07, R * .72 + .01, 0, PI / 4, 0);
  label(f.group, 'subwaydoor2', .7, .13, signDraw('지하철 연결', '#3f8f5a', C.white, { size: .62 }), -R * .72, H + .07, R * .72 + .01, 0, -PI / 4, 0);
  // the wings (part0): a centre post and four glass wings; an umbrella pocket on the back wing holds something
  const wing = grp(); put(wing, 0, 0, 0); f.add(wing);
  wing.add(mc('um-revolve-wings', ({ add }) => {
    add(G.cyl(.06, .06, H, 12), C.steel, 0, H / 2, 0);
    for (let k = 0; k < 4; k++) {
      const a = k * HP + PI / 4, cx = Math.cos(a) * R / 2, cz = -Math.sin(a) * R / 2;
      add(G.box(R - .08, .05, .04, .01), C.steel2, cx, .12, cz, 0, a, 0); add(G.box(R - .08, .05, .04, .01), C.steel2, cx, H - .1, cz, 0, a, 0);
      add(G.box(.04, H - .2, .04, .01), C.steel2, Math.cos(a) * (R - .06), H / 2, -Math.sin(a) * (R - .06));
      add(G.box(R - .1, .04, .045, .01), '#e9665a', cx, 1.05, cz, 0, a, 0);
    }
    // the umbrella pocket on the back (-x) quarter: a little steel basket on the floor
    add(G.box(.26, .2, .2, .02), C.steel, -.3, .12, 0); add(G.box(.22, .02, .16, .01), C.steel2, -.3, .23, 0);
    add(G.cyl(.02, .02, .5, 6), C.navy, -.36, .4, -.04, .2, 0, .1);
  }));
  for (let k = 0; k < 4; k++) {
    const a = k * HP + PI / 4;
    const gp = mesh(geo('um-revolve-pane', () => new THREE.PlaneGeometry(R - .12, H - .3)), mat(C.glassC, { opacity: .3, side: THREE.DoubleSide }), { cast: false });
    put(gp, Math.cos(a) * R / 2, H / 2, -Math.sin(a) * R / 2, 0, a, 0); wing.add(gp);
  }
  const p = f.part('spin', wing, t => { wing.rotation.y = PI * sm(t); }, { label: '회전문', sfx: 'door', dur: 1.6 });
  p.setOpen(0);
  f.spot('inside', wing, -.3, .24, 0, { part: p, maxH: .35, label: '회전문 뒤 우산 바구니', scale: .9 });
  f.spot('behind', null, .1, .01, R + .2, { label: '회전문 옆 유리벽 앞', maxH: 0.7, scale: 1.6 }).anchor.position.set(.66, .01, .3);
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// um_lockers — 물품 보관함 (1.1 × .5, 2칸 × 3줄): 칸마다 번호, 초록 '비어 있음' / 빨강 '사용 중' 불; 위에 '물품 보관함' 판과 동전 넣는 곳.
// 문 셋이 부품(하나는 열쇠 자물쇠 자리), 나머지 셋은 닫힌 칸.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
B.um_lockers = f => {
  const W = 1.1, H = 1.82, D = .5, zb = -D / 2, zf = D / 2, DW = .5, DH = .48, Y0 = .12, body = '#8ec5d2', body2 = '#a8d6e0';
  f.add(mc('um-lockers', ({ add }) => {
    add(G.box(W, H, .04, .02), body, 0, H / 2, zb + .02);
    for (const sx of [-1, 1]) add(G.box(.04, H, D, .02), body, sx * (W / 2 - .02), H / 2, 0);
    add(G.box(.03, 3 * DH, D - .04, .01), body, 0, Y0 + 1.5 * DH, 0);
    for (let r = 0; r <= 3; r++) add(G.box(W - .04, .03, D - .02, .01), body, 0, Y0 + r * DH, 0);
    add(G.box(W, Y0, D, .02), C.dark, 0, Y0 / 2, 0);
    add(G.box(W + .02, H - Y0 - 3 * DH, D + .02, .02), body2, 0, (H + Y0 + 3 * DH) / 2, 0);
    for (let r = 0; r < 3; r++) for (const sx of [-1, 1]) add(G.box(DW - .06, DH - .06, .01, .006), '#2f4a57', sx * W / 4, Y0 + (r + .5) * DH, zb + .045);
    add(G.box(.18, .1, .03, .01), C.dark, .32, H - .08, zf + .01); add(G.pbox(.06, .012, .01), C.brass, .32, H - .08, zf + .028);
  }));
  label(f.group, 'lockers', .62, .12, signDraw('물품 보관함', C.white, '#2f6f86', { size: .66 }), -.14, H - .08, zf + .012);
  // the doors: [row, col, part?, lockable?]
  const DOORS = [[0, -1, false], [0, 1, true, false], [1, -1, false], [1, 1, true, true], [2, -1, false], [2, 1, true, false]];
  DOORS.forEach(([r, sx, isPart, lock], i) => {
    const used = !isPart || lock;
    const hx = sx < 0 ? -.015 : W / 2 - .03, y = Y0 + r * DH + .02, ox = -(DW - .03) / 2;
    const dv = grp(); put(dv, hx, y, zf - .005); f.add(dv);
    dv.add(mc('um-lockers-door|' + used, ({ add }) => {
      add(G.box(DW - .03, DH - .04, .03, .012), body2, ox, (DH - .04) / 2, 0);
      for (let k = 0; k < 3; k++) add(G.pbox(.2, .012, .006), '#6aa6b6', ox, DH - .12 - k * .03, .017);
      add(G.box(.04, .1, .03, .008), C.steel2, -DW + .1, (DH - .04) / 2, .02);
      add(G.sph(.016, 6, 4), used ? C.red : C.leaf, -DW + .1, (DH - .04) / 2 + .1, .02);
    }));
    label(dv, 'lockno' + i, .08, .06, (c, Wd, Hd) => { c.fillStyle = C.white; roundRect(c, 0, 0, Wd, Hd, 6); c.fill(); fitText(c, String(11 + i), Wd / 2, Hd / 2, Wd * .8, Hd * .7, C.ink, { weight: 'bold' }); }, -.1, DH - .1, .017);
    if (!isPart) return;
    const p = f.part('door', dv, t => { dv.rotation.y = 1.6 * t; }, { label: (11 + i) + '번 보관함', sfx: 'open', dur: .3 });
    if (lock) { p.lockable = true; p.lockKind = 'pad'; p.lockAt = { parent: dv, x: -DW + .1, y: (DH - .04) / 2 - .1, z: .04 }; }
    f.spot('inside', null, sx * W / 4, Y0 + r * DH + .035, -.02, { part: p, maxH: DH - .06, label: (11 + i) + '번 보관함 안', scale: 1.2 });
  });
  f.spot('on', null, -.25, H + .005, 0, { label: '보관함 위', maxH: 0.5, scale: 1.5 });
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// um_mapboard — 안내 지도판 (1 × .5): 두 다리 위 판, 앞면은 지하상가 안내도(가게 칸·관리실·출구·현위치), 뒤집기(17): 터치하면 판이 저절로
// 반 바퀴 돌아 뒷면의 크레파스 낙서 '까꿍!'과 판 뒤에 끼워 둔 봉투(숨김 자리)가 앞으로.
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
B.um_mapboard = f => {
  const BW = .96, BH = 1.1, BY = 1.08;
  f.walkBoxes = [[-.55, 0, -.16, .55, 1.7, .16]];
  f.noSolid = true;
  f.add(mc('um-mapboard', ({ add }) => {
    for (const sx of [-1, 1]) { add(G.box(.06, BY + .1, .06, .015), C.steel2, sx * (BW / 2 + .04), (BY + .1) / 2, 0); add(G.box(.2, .04, .3, .015), C.dark, sx * (BW / 2 + .04), .02, 0); }
    add(G.box(BW + .16, .08, .08, .02), C.navy, 0, BY + BH / 2 + .04, 0);
  }));
  const board = grp(); put(board, 0, BY, 0); f.add(board);
  board.add(mc('um-mapboard-board', ({ add }) => { add(G.box(BW, BH, .05, .02), C.navy, 0, 0, 0); add(G.cyl(.025, .025, .06, 8), C.steel, BW / 2 + .02, 0, 0, 0, 0, HP); add(G.cyl(.025, .025, .06, 8), C.steel, -BW / 2 - .02, 0, 0, 0, 0, HP); add(G.box(.32, .025, .12, .008), C.steel2, .22, -.46, -.085); add(G.box(.32, .06, .012, .004), C.steel2, .22, -.43, -.145); }));
  label(board, 'mapfront', BW - .08, BH - .08, (c, Wd, Hd) => {
    c.fillStyle = '#f6f1e6'; roundRect(c, 0, 0, Wd, Hd, 8); c.fill();
    fitText(c, '지하상가 안내도', Wd / 2, Hd * .08, Wd * .8, Hd * .09, C.navy, { weight: 'bold' });
    const cells = [['옷', C.coral, .2, .2], ['분식', '#f0a040', .4, .2], ['열쇠', '#5f8fd0', .6, .2], ['관리실', '#8aa0c8', .82, .3], ['꽃', '#6fbf8e', .08, .45], ['보관함', '#8ec5d2', .08, .65], ['출구 1', '#3f8f5a', .08, .2]];
    c.fillStyle = '#e6ddd0'; c.fillRect(Wd * .2, Hd * .32, Wd * .6, Hd * .5);
    for (const [n, col, x, y] of cells) { const w = n === '관리실' ? .18 : .17, h = n === '관리실' ? .32 : .12; c.fillStyle = col; roundRect(c, Wd * (x - (n === '관리실' ? 0 : w / 2)) , Hd * y, Wd * w, Hd * h, 5); c.fill(); fitText(c, n, Wd * (x + (n === '관리실' ? w / 2 : 0)), Hd * (y + h / 2), Wd * w * .9, Hd * .07, C.white, { weight: 'bold' }); }
    c.fillStyle = C.red; c.beginPath(); c.arc(Wd * .5, Hd * .62, Wd * .03, 0, 7); c.fill();
    fitText(c, '현위치', Wd * .5, Hd * .7, Wd * .3, Hd * .07, C.red, { weight: 'bold' });
    fitText(c, '지하 1층', Wd * .8, Hd * .92, Wd * .3, Hd * .07, C.ink);
  }, 0, 0, .027);
  label(board, 'mapback', BW - .08, BH - .08, (c, Wd, Hd) => {
    c.fillStyle = '#f6f1e6'; roundRect(c, 0, 0, Wd, Hd, 8); c.fill();
    c.lineCap = 'round'; c.lineJoin = 'round';
    // a crayon doodle: a round little blob with dot eyes waving, a star, and the word
    c.strokeStyle = '#3b3550'; c.lineWidth = 6; c.fillStyle = '#4a4458';
    c.beginPath(); c.ellipse(Wd * .38, Hd * .55, Wd * .14, Hd * .13, 0, 0, 7); c.fill();
    c.fillStyle = '#ffffff'; for (const dx of [-.04, .04]) { c.beginPath(); c.arc(Wd * (.38 + dx), Hd * .53, Wd * .018, 0, 7); c.fill(); }
    c.beginPath(); c.moveTo(Wd * .5, Hd * .5); c.lineTo(Wd * .6, Hd * .4); c.stroke();
    c.strokeStyle = '#f2b544'; c.lineWidth = 5; c.beginPath(); for (let i = 0; i < 11; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? Wd * .03 : Wd * .07; c.lineTo(Wd * .74 + Math.cos(a) * r, Hd * .3 + Math.sin(a) * r); } c.stroke();
    fitText(c, '까꿍!', Wd * .5, Hd * .85, Wd * .6, Hd * .14, '#e8604c', { weight: 'bold' });
  }, 0, 0, -.027, 0, PI, 0);
  const p = f.part('flip', board, t => { board.rotation.y = PI * sm(t); }, { label: '안내 지도판', sfx: 'flip', dur: .9 });
  p.setOpen(0);
  f.spot('inside', board, .22, -.447, -.085, { part: p, maxH: .3, label: '지도판 뒤 작은 선반', scale: .8 }).anchor.rotation.y = PI;
  f.spot('under', null, .1, .01, .05, { label: '지도판 밑', maxH: 0.5, scale: 1.5 });
};

export const UM_BUILDERS = B;
export const UM_INFO = {
  um_hall: { w: 8, d: 6, name: '지하상가 통로', price: 0, hidden: true, floor: true },
  um_shopstall: { w: 1, d: 1, name: '가게 칸', price: 0, hidden: true },
  um_office: { w: 2, d: 3, name: '관리실', price: 0, hidden: true },
  um_safe: { w: 1, d: 1, name: '관리실 금고', price: 0, hidden: true },
  um_escalator: { w: 1, d: 2, name: '에스컬레이터', price: 0, hidden: true },
  um_revolvingdoor: { w: 1, d: 1, name: '회전문', price: 0, hidden: true },
  um_lockers: { w: 1, d: 1, name: '물품 보관함', price: 0, hidden: true },
  um_kiosk: { w: 1, d: 1, name: '분식 매대', price: 0, hidden: true },
  um_mapboard: { w: 1, d: 1, name: '안내 지도판', price: 0, hidden: true },
};

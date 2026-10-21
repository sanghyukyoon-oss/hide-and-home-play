// 동네 공공장소 (2026-10-18, user: "아파트쪽이 좀 맵이 지겹다… 계속 사는곳만 나오고… 경찰서도 있고 소방서도 있어서.. 학교도
// 있을거고"): the pieces for 몽글 파출소, 토순이네 교실 and 곰돌이 소방서, in the same toy-set style as the rest
// (chunky shapes, flat colours merged into one mesh per piece, moving parts their own groups, lettering on canvases).
//   jailcell (2×1)  유치장 — a barred cell against the wall, a barred door (padlock) and a bench inside
//   wantedboard (wall, span 2) 수배 게시판 — a cork board under a '몽글 파출소' sign: Inky's WANTED poster, lost & found notes
//   schooldesk (1×1) 학생 책상 — desk and chair, a cubby under the top where things get stuffed
//   chalkboard (wall, span 2) 칠판 — green board with the day's doodles, a chalk tray
//   lockers (1×1)   사물함 — two tall steel lockers, the left one takes a padlock
//   firetruck (3×2) 소방차 — the red engine with a ladder, light bar and two roll-up side lockers (one padlocked)
//   firepole (1×1)  소방봉 — a brass pole through the ceiling onto a round mat
//   gearrack (2×1)  장비 걸이 — coats on hooks (the middle one lifts), helmets on the shelf, boots below
//   hosereel (1×1)  호스 릴 — a red reel of flat hose on a stand with its nozzle
//   firebell (wall, span 1) 출동 벨 — a big red bell with a pull handle
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, texCache, roundRect } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { tr } from '../i18n.js';   // (canvas signs don't pass through the page's translator — 10/19)

const PI = Math.PI, HP = PI / 2;
const INK = '#2a1d33', WHITE = '#ffffff', STEEL = '#c9cfe0', STEEL2 = '#a9b2c8', DARK = '#5b5672', RED = '#e8433d', RED2 = '#b8322e',
  NAVY = '#2f3f7a', BLUE = '#3f6fd8', WOOD = '#e9b77c', WOODD = '#b97a45', BRASS = '#e2b448', CORK = '#d9a066', GREEN = '#3f7a5a', YEL = '#ffd23f';
const B = {};
const TEX = texCache();   // cached per scene generation (kit.js purgeGeo)
const tex = (key, w, h, draw) => TEX.get(key, () => canvasTex(w, h, draw));
const decal = (w, h, t) => { const m = mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: t }), { cast: false }); return m; };
const font = (px, bold = true) => `${bold ? '700 ' : ''}${px}px "Ssurround", "BagelFat", system-ui, sans-serif`;

// ── 유치장 (2×1)
B.jailcell = (f, T) => {
  const H = 2.15, zf = .42, xL = -.96, xR = .96, z0 = -.48;
  f.add(mc('jailcell', ({ add }) => {
    // bars: the front left of the door, both sides; bands top, middle, bottom
    for (let x = xL; x < .08; x += .14) add(G.cyl(.022, .022, H, 8), STEEL, x, H / 2, zf);
    for (const sx of [xL, xR]) for (let z = z0 + .06; z < zf; z += .14) add(G.cyl(.022, .022, H, 8), STEEL, sx, H / 2, z);
    for (const y of [.06, 1.1, H - .03]) {
      add(G.box(xR - xL + .06, .06, .06, .01), STEEL2, 0, y, zf);
      for (const sx of [xL, xR]) add(G.box(.06, .06, zf - z0, .01), STEEL2, sx, y, (zf + z0) / 2);
    }
    // the bench and a little pillow inside, a plate on the wall
    add(G.box(1.0, .1, .34, .03), WOOD, -.35, .44, z0 + .2); for (const sx of [-1, 1]) add(G.box(.06, .4, .3, .01), WOODD, -.35 + sx * .42, .22, z0 + .2);
    add(G.box(.26, .1, .18, .04), '#cfdcf3', -.68, .55, z0 + .2);
    add(G.box(.5, .16, .02, .01), NAVY, .35, 1.75, z0 + .01);
  }));
  // the barred door, hinged on the middle post, swinging out
  const DW = .84, dv = grp(); put(dv, .08, 0, zf); f.add(dv);
  dv.add(mc('jailcell-door', ({ add }) => {
    for (let x = .07; x < DW; x += .14) add(G.cyl(.022, .022, H - .1, 8), STEEL, x, (H - .1) / 2 + .05, 0);
    for (const y of [.12, 1.1, H - .1]) add(G.box(DW, .05, .05, .01), STEEL2, DW / 2, y, 0);
    add(G.box(.12, .2, .07, .02), DARK, DW - .1, 1.0, .02);
  }));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.7 * t; }, { label: '유치장 문', sfx: 'door', dur: .45 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: DW - .1, y: .82, z: .07, parent: dv };
  f.spot('inside', null, -.3, .5, z0 + .2, { part: p, maxH: .4, label: '유치장 의자 위', scale: .85 });
  f.spot('inside', null, .45, .02, -.1, { part: p, maxH: .5, label: '유치장 바닥', scale: .85 });
};

// ── 수배 게시판 (wall, span 2)
const WANTED = () => tex('wanted', 256, 320, (c, w, h) => {
  c.fillStyle = '#fff3d6'; c.fillRect(0, 0, w, h);
  c.fillStyle = RED2; c.font = font(44); c.textAlign = 'center'; c.fillText('WANTED', w / 2, 52);
  c.fillStyle = '#3a3048'; c.beginPath(); c.ellipse(w / 2, 168, 70, 64, 0, 0, 7); c.fill();   // 잉키: a round ink blob
  c.fillStyle = '#ffffff'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(w / 2 + sx * 24, 160, 13, 16, 0, 0, 7); c.fill(); }
  c.fillStyle = '#2a1d33'; for (const sx of [-1, 1]) { c.beginPath(); c.arc(w / 2 + sx * 24, 163, 6, 0, 7); c.fill(); }
  c.fillStyle = '#2a1d33'; c.font = font(30); c.fillText(tr('색깔 도둑 먹물이'), w / 2, 270, w - 24);
  c.font = font(20, false); c.fillText(tr('보면 파출소로!'), w / 2, 302, w - 24);
});
const NOTICE = () => tex('notice', 220, 260, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  c.fillStyle = BLUE; c.fillRect(0, 0, w, 50); c.fillStyle = '#fff'; c.font = font(28); c.textAlign = 'center'; c.fillText(tr('분실물 안내'), w / 2, 36, w - 16);
  c.fillStyle = '#3a3048'; c.font = font(20, false); c.textAlign = 'left';
  ['· 노란 우산', '· 곰돌이 열쇠고리', '· 빨간 장갑 한 짝', '· 몽글이 양말(?)'].forEach((t, i) => c.fillText(tr(t), 18, 92 + i * 40, w - 26));
});
const SIGN = () => tex('policesign', 512, 96, (c, w, h) => {
  c.fillStyle = NAVY; roundRect(c, 4, 4, w - 8, h - 8, 22); c.fill();
  c.fillStyle = '#ffffff'; c.font = font(54); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tr('몽글 파출소'), w / 2 + 24, h / 2 + 3, w - 80);
  c.fillStyle = YEL; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -HP + k * PI / 5, r = k % 2 ? 14 : 30; c.lineTo(70 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } c.fill();
});
B.wantedboard = f => {
  const yc = 1.45, W = 1.5, H = .86;
  f.add(mc('wantedboard', ({ add }) => {
    add(G.box(W + .08, H + .08, .04, .02), WOODD, 0, yc, .02); add(G.pbox(W, H, .01), CORK, 0, yc, .042);
    for (const [x, y, c] of [[-.5, yc + .32, RED], [.12, yc + .3, YEL], [.52, yc + .26, BLUE]]) add(G.sph(.022, 8, 6), c, x, y, .07);
  }));
  f.add(put(decal(.4, .5, WANTED()), -.5, yc + .02, .05, 0, 0, .04));
  f.add(put(decal(.34, .4, NOTICE()), .12, yc + .02, .05, 0, 0, -.05));
  f.add(put(decal(.26, .3, WANTED()), .54, yc - .04, .051, 0, 0, .1));
  f.add(put(decal(1.1, .2, SIGN()), 0, yc + .62, .03));
};

// ── 학생 책상 (1×1): faces the board (-z); the pupil sits on the +z side, the cubby under the top opens to them
B.schooldesk = (f, T) => {
  const top = .66, DW = .62, DD = .44, dz = -.1, cz = .3;
  f.add(mc('schooldesk', ({ add }) => {
    add(G.box(DW, .035, DD, .012), '#e9c28a', 0, top, dz);
    // the cubby under the top, open toward the chair: a floor, a dark back and two sides (레벨 세션 10/18: it was one solid box,
    // so whatever sat in '책상 서랍 속' was inside the box — no view could see it)
    const CW = DW - .04, CD = DD - .06, cy0 = top - .15, cz0 = dz - .02;
    add(G.pbox(CW, .012, CD), '#7d93bd', 0, cy0 + .006, cz0);
    add(G.pbox(CW, .12, .012), '#9fb4d8', 0, cy0 + .06, cz0 - CD / 2 + .006);           // back, the same blue outside
    add(G.pbox(CW - .03, .1, .004), '#2f3f7a', 0, cy0 + .06, cz0 - CD / 2 + .014);       // its dark inside
    for (const sx of [-1, 1]) add(G.pbox(.012, .12, CD), '#9fb4d8', sx * (CW / 2 - .006), cy0 + .06, cz0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.016, .016, top - .03, 8), STEEL2, sx * (DW / 2 - .05), (top - .03) / 2, dz + sz * (DD / 2 - .05));
    // the chair
    add(G.box(.38, .03, .36, .01), '#e9c28a', 0, .42, cz);
    add(G.box(.38, .24, .025, .01), '#e9c28a', 0, .62, cz + .17);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.014, .014, .41, 8), STEEL2, sx * .16, .205, cz + sz * .15);
    add(G.cyl(.012, .012, .3, 8), STEEL2, 0, .56, cz + .17, 0, 0, HP);
    // a notebook and a pencil case on top
    add(G.box(.18, .012, .24, .004), '#ffffff', -.12, top + .024, dz + .02, 0, .2, 0); add(G.box(.17, .004, .23, .002), '#8fd3f4', -.12, top + .031, dz + .02, 0, .2, 0);
    add(G.cap(.03, .14, 2, 8), '#ff9fb5', .17, top + .045, dz - .08, 0, 0, HP);
  }));
  f.spot('on', null, .14, top + .02, dz + .06, { maxH: .3, label: '책상 위', scale: .8 });
  f.spot('under', null, 0, top - .138, dz + .15, { maxH: .1, label: '책상 서랍 속', scale: .7 });   // at the mouth of the open cubby: a peek of it shows
  f.spot('on', null, 0, .44, cz - .02, { maxH: .3, label: '의자 위', scale: .8 });
};

// ── 칠판 (wall, span 2)
const BOARD = () => tex('chalk', 512, 270, (c, w, h) => {
  c.fillStyle = '#2f6a50'; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,.06)'; for (let k = 0; k < 40; k++) c.fillRect(Math.random() * w, Math.random() * h, 60, 3);
  c.strokeStyle = '#f4f4ec'; c.fillStyle = '#f4f4ec'; c.lineWidth = 3; c.lineCap = 'round';
  c.font = font(30); c.textAlign = 'left'; c.fillText(tr('10월 18일 토요일'), 20, 44, 250);
  c.font = font(24, false); c.fillText(tr('오늘의 당번: 몽글이'), 20, 86, 250);
  c.font = font(34); c.fillText(tr('숨바꼭질 규칙'), 280, 50, w - 290);
  c.font = font(22, false); ['1. 꼭꼭 숨어라', '2. 머리카락 보일라', '3. 찾으면 꼭 안아 주기'].forEach((t, i) => c.fillText(tr(t), 280, 92 + i * 34, w - 290));
  // a mochi doodle and a sun
  c.beginPath(); c.ellipse(110, 190, 52, 44, 0, 0, 7); c.stroke();
  for (const sx of [-1, 1]) { c.beginPath(); c.arc(110 + sx * 18, 184, 4, 0, 7); c.fill(); }
  c.beginPath(); c.arc(110, 196, 9, .2, PI - .2); c.stroke();
  c.strokeStyle = '#ffe08a'; c.beginPath(); c.arc(220, 180, 20, 0, 7); c.stroke();
  for (let k = 0; k < 8; k++) { const a = k * PI / 4; c.beginPath(); c.moveTo(220 + Math.cos(a) * 26, 180 + Math.sin(a) * 26); c.lineTo(220 + Math.cos(a) * 36, 180 + Math.sin(a) * 36); c.stroke(); }
});
B.chalkboard = f => {
  const W = 1.8, H = .95, yc = 1.5, ty = yc - H / 2 - .02;
  f.add(mc('chalkboard', ({ add }) => {
    add(G.box(W + .1, H + .1, .05, .02), WOODD, 0, yc, .025);
    add(G.box(W * .96, .03, .12, .01), WOOD, 0, ty, .07);
    for (const [x, c] of [[-.5, '#ffffff'], [-.44, '#ffd23f'], [-.38, '#ff9fb5']]) add(G.cap(.011, .07, 2, 6), c, x, ty + .025, .09, 0, 0, HP);
    add(G.box(.16, .05, .07, .012), '#3a3048', .45, ty + .035, .09); add(G.box(.16, .02, .07, .01), '#fff3d6', .45, ty + .068, .09);
  }));
  f.add(put(decal(W, H, BOARD()), 0, yc, .052));
  f.spot('on', null, .1, ty + .015, .09, { maxH: .12, label: '칠판 분필 받침', scale: .6 });
};

// ── 사물함 (1×1)
B.lockers = (f, T) => {
  const W = .86, H = 1.82, D = .46, z0 = -.25, fz = z0 + D / 2, DW = W / 2 - .02;
  const body = (T && T.locker) || '#7fa8e8';
  f.add(mc('lockers|' + body, ({ add }) => {
    // a hollow shell: back, sides, top, bottom and the middle divider (things inside must show when a door opens)
    add(G.pbox(W, H, .03), body, 0, H / 2, z0 - D / 2 + .015);
    for (const sx of [-1, 0, 1]) add(G.pbox(sx ? .03 : .02, H, D), body, sx * (W / 2 - .015), H / 2, z0);
    add(G.pbox(W, .1, D), body, 0, .05, z0); add(G.pbox(W, .03, D), body, 0, H - .015, z0);
    add(G.pbox(W - .06, H - .1, .02), '#3a4a7a', 0, H / 2, z0 - D / 2 + .03);   // the dark back wall inside, seen through an open door
    for (const sy of [.95, 1.45]) add(G.box(W - .08, .02, D - .06, .006), STEEL2, 0, sy, z0);
    add(G.box(W + .02, .04, D + .02, .01), STEEL2, 0, H + .02, z0);
  }));
  for (const [k, sx] of [[0, -1], [1, 1]]) {
    const dv = grp(); put(dv, sx < 0 ? -W / 2 + .01 : W / 2 - .01, 0, fz + .01); f.add(dv);
    const dx = sx < 0 ? DW / 2 : -DW / 2;
    dv.add(mc('lockers-door' + k + '|' + body, ({ add }) => {
      add(G.box(DW, H - .06, .025, .01), body, dx, H / 2, 0);
      for (let i = 0; i < 4; i++) add(G.pbox(DW * .55, .014, .006), '#3a4a7a', dx, H - .2 - i * .035, .014);
      add(G.box(.12, .07, .008, .003), '#ffffff', dx, H - .42, .015);
      add(G.box(.03, .14, .03, .008), STEEL2, dx + (sx < 0 ? DW / 2 - .07 : -DW / 2 + .07), 1.0, .02);
    }));
    const p = f.part('door', dv, t => { dv.rotation.y = sx * -1.75 * t * -1; }, { label: k ? '오른쪽 사물함' : '왼쪽 사물함', sfx: 'open', dur: .3 });
    if (!k) { p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: DW - .07, y: .86, z: .05, parent: dv }; }
    f.spot('inside', null, sx * W / 4, 1.0, z0 + .02, { part: p, maxH: .4, label: (k ? '오른쪽' : '왼쪽') + ' 사물함 안', scale: .8 });
  }
};

// ── 소방차 (3×2): along x, the cab at +x; two roll-up lockers on the +z side
// (19판 4차 10/21, user: "경찰차 소방차 다시" — GPT 컨셉 시트 concept-firetruck-1021, 세 안의 공통 결): a toy SD fire engine — a big
// rounded cab-over cab with a wide windscreen and a red beacon dome, a short body behind it with a white stripe, two big axles,
// a thick grey bumper with round headlights, a cream hose on a red reel behind the cab, a silver ladder on top; the two
// roll-up lockers (one padlocked) and the hiding spots stay
const FRED = '#ef4a3f', FRED2 = '#c93a31', FGLASS = '#4d5f93', FBUMP = '#8a8fa3';
B.firetruck = (f, T) => {
  // SD proportions (the sheet): 2.4 long in its 3×2 slot, tall — the cab roof at 1.7, wheels .72 across, the lockers up over them
  const L = 2.4, Wd = 1.3, zc = 0, zf = Wd / 2, BY0 = .32, LF = .8, LT = 1.3, BT = 1.45, CX0 = .45, CX1 = 1.2, CY1 = 1.7, WR = .36;
  const CC = (CX0 + CX1) / 2, CL = CX1 - CX0, CW = Wd - .06, BX0 = -1.2, LOCK = [-.85, -.2];
  f.add(mc('firetruck5', ({ add, tube }) => {
    // the body: solid at the back, two open lockers on the near side above the wheels (their shutters roll up); a light grey inside
    add(G.box(CX0 - BX0, BT - BY0, .76, .08), FRED, (BX0 + CX0) / 2, (BY0 + BT) / 2, -.27);
    add(G.box(CX0 - BX0, LF - BY0, .56, .06), FRED, (BX0 + CX0) / 2, (BY0 + LF) / 2, .37); add(G.box(CX0 - BX0, BT - LT, .56, .05), FRED, (BX0 + CX0) / 2, (LT + BT) / 2, .37);
    const gaps = [BX0, LOCK[0] - .31, LOCK[0] + .31, LOCK[1] - .31, LOCK[1] + .31, CX0];
    for (let k = 0; k < gaps.length; k += 2) add(G.box(gaps[k + 1] - gaps[k], LT - LF, .56, .01), FRED, (gaps[k] + gaps[k + 1]) / 2, (LF + LT) / 2, .37);
    for (const x of LOCK) { add(G.pbox(.62, LT - LF, .02), '#8e8aa3', x, (LF + LT) / 2, .11); add(G.pbox(.62, .02, .54), '#a9a6bb', x, LF + .01, .37); add(G.pbox(.6, .02, .3), '#b9b6c8', x, LT - .08, .27); }
    add(new THREE.SphereGeometry(.075, 14, 8, 0, PI * 2, 0, HP), '#ffcf3a', LOCK[1] - .18, LT - .07, .24); add(G.cyl(.1, .1, .015, 16), '#ffcf3a', LOCK[1] - .18, LT - .065, .25);
    // the cab: one big rounded block — a red lower half, a deep band of dark glass, a red roof; the windscreen wide across the front
    add(G.box(CL, 1.0 - BY0, CW, .18, 3), FRED, CC, (BY0 + 1.0) / 2, 0);
    add(G.box(CL - .08, .42, CW - .1, .14), FGLASS, CC + .01, 1.18, 0);
    add(G.box(CL - .06, .32, CW - .06, .14), FRED, CC - .01, CY1 - .16, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.1, .42, .1, .045), FRED, CC + sx * (CL / 2 - .08), 1.18, sz * (CW / 2 - .09));
    for (const sz of [-1, 1]) add(G.box(.07, .42, .05, .02), FRED, CC - .12, 1.18, sz * (CW / 2 - .055));
    // the white stripe round body and cab, the beacon dome, the mirrors
    add(G.box(L - .04, .09, Wd + .02, .02), WHITE, 0, .62, zc);
    add(G.cyl(.13, .15, .05, 18), FBUMP, CC + .1, CY1 + .02, 0); add(new THREE.SphereGeometry(.13, 16, 8, 0, PI * 2, 0, HP), '#ff5a4a', CC + .1, CY1 + .04, 0);
    for (const sz of [-1, 1]) { tube([CX1 - .05, 1.05, sz * (CW / 2)], [CX1 + .02, 1.08, sz * (CW / 2 + .1)], .016, DARK, 5); add(G.box(.05, .15, .09, .025), DARK, CX1 + .04, 1.05, sz * (CW / 2 + .13)); }
    // the front: a grey grille, big round headlights in rings, a thick grey bumper with orange lights
    add(G.box(.04, .22, .5, .03), FBUMP, CX1 + .01, .66, 0); for (let k = 0; k < 3; k++) add(G.box(.02, .02, .44, .005), '#6b6f82', CX1 + .03, .59 + k * .065, 0);
    for (const sz of [-1, 1]) { add(G.cyl(.12, .12, .04, 20), '#fff3c4', CX1 + .01, .74, sz * .43, 0, 0, HP); add(G.tor(.12, .022, PI * 2, 5, 20), STEEL2, CX1 + .03, .74, sz * .43, 0, HP, 0); }
    add(G.box(.2, .2, Wd + .04, .08), FBUMP, CX1 + .06, .34, 0);
    for (const sz of [-1, 1]) add(G.sph(.04, 8, 6), '#ff9a3c', CX1 + .16, .4, sz * .55);
    add(G.box(.14, .18, Wd, .06), FBUMP, BX0 - .02, .36, 0); for (const sz of [-1, 1]) add(G.box(.03, .11, .17, .02), '#e2403a', BX0 - .005, .7, sz * .45);
    // wheels: two big axles, dark tyres with grey hubs
    for (const x of [-.72, .82]) for (const sz of [-1, 1]) { add(G.cyl(WR, WR, .26, 22), TYRE, x, WR, sz * (zf - .11), HP, 0, 0); add(G.cyl(.16, .16, .265, 14), HUBG, x, WR, sz * (zf - .11), HP, 0, 0); add(G.cyl(.055, .055, .27, 10), '#8a8fa3', x, WR, sz * (zf - .11), HP, 0, 0); }
    // the ladder on top: two silver rails with rungs on two grey supports
    for (const sz of [-.24, .24]) add(G.box(1.5, .06, .06, .02), STEEL, -.42, BT + .15, sz);
    for (let k = 0; k < 8; k++) add(G.cyl(.018, .018, .48, 6), STEEL2, -1.1 + k * .195, BT + .15, 0, HP, 0, 0);
    for (const sx of [-1.0, .2]) add(G.box(.1, .14, .56, .03), FBUMP, sx, BT + .05, 0);
    // the hose reel behind the cab: a red drum, cream hose wound on it, a grey hub; the hose's brass nozzle hanging down
    const RX = .29, RY = 1.02;
    add(G.cyl(.19, .19, .05, 20), FRED2, RX, RY, zf + .05, HP, 0, 0); add(G.cyl(.19, .19, .05, 20), FRED2, RX, RY, zf - .09, HP, 0, 0);
    for (let k = 0; k < 3; k++) add(G.tor(.14 - k * .014, .033, PI * 2, 6, 20), k % 2 ? '#efdcb4' : '#f6e8c8', RX, RY, zf - .02 + (k - 1) * .042);
    add(G.cyl(.05, .05, .2, 12), FBUMP, RX, RY, zf - .02, HP, 0, 0);
    tube([RX, RY - .15, zf + .02], [RX + .03, RY - .36, zf + .04], .03, '#f6e8c8', 6); add(G.cyl(.03, .02, .08, 10), BRASS, RX + .03, RY - .41, zf + .04);
  }));
  // two roll-up lockers on the near side
  const shutters = [];
  for (const [k, x] of [[0, LOCK[0]], [1, LOCK[1]]]) {
    const sv = grp(); put(sv, x, LT, zf + .012); f.add(sv);
    sv.add(mc('firetruck5-shutter', ({ add }) => { add(G.box(.62, LT - LF, .02, .01), '#d9dee8', 0, -(LT - LF) / 2, 0); for (let i = 0; i < 6; i++) add(G.pbox(.6, .01, .006), STEEL2, 0, -.05 - i * .08, .012); add(G.box(.2, .03, .03, .01), DARK, 0, -(LT - LF) + .03, .02); }));
    const p = f.part('curtain', sv, t => { sv.scale.y = 1 - .85 * t; }, { label: k ? '소방차 뒤 칸' : '소방차 앞 칸', sfx: 'swish', dur: .35 });
    if (!k) { p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: -(LT - LF) + .05, z: .05, parent: sv }; }
    f.spot('inside', null, x, LF + .02, .42, { part: p, maxH: .36, label: '소방차 장비 칸', scale: .8 });
    shutters.push(sv);
  }
  f.spot('on', null, CC - .18, CY1 + .005, zc, { maxH: .3, label: '소방차 지붕 위', scale: .7 });
  f.spot('under', null, .05, .02, zc + .2, { maxH: .22, label: '소방차 밑', scale: .8 });
};

// ── 소방봉 (1×1)
B.firepole = f => {
  f.add(mc('firepole', ({ add }) => {
    add(G.cyl(.045, .045, 3.0, 16), BRASS, 0, 1.5, -.1);
    add(G.cyl(.4, .42, .1, 28), RED, 0, .05, -.1); add(G.cyl(.3, .3, .02, 24), '#ff8f7a', 0, .11, -.1);
    add(G.tor(.2, .04, PI * 2, 8, 24), STEEL2, 0, 2.85, -.1, HP, 0, 0);
  }));
  f.spot('on', null, .22, .11, .05, { maxH: .35, label: '소방봉 매트 위', scale: .8 });
};

// ── 장비 걸이 (2×1): against the wall
B.gearrack = f => {
  const z0 = -.36;
  f.add(mc('gearrack', ({ add }) => {
    add(G.box(1.8, 1.9, .06, .02), WOOD, 0, .95, z0 - .1);
    add(G.box(1.8, .04, .34, .01), WOODD, 0, 1.75, z0 + .06);   // the helmet shelf
    for (const [x, c] of [[-.6, RED], [0, YEL], [.6, RED]]) { add(G.sph(.16, 14, 10), c, x, 1.84, z0 + .06, 0, 0, 0, [1, .75, 1.1]); add(G.box(.36, .03, .4, .01), c, x, 1.79, z0 + .08); }
    for (const x of [-.6, .6]) {   // the side coats
      add(G.box(.46, .9, .14, .05), '#d9a441', x, 1.12, z0 + .02); for (const y of [.86, 1.06]) add(G.pbox(.47, .05, .145), '#f4f4ec', x, y, z0 + .02);
    }
    for (const x of [-.75, -.45, -.15, .15, .45, .75]) add(G.box(.18, .3, .26, .05), '#2a2a36', x, .15, z0 + .12);   // boots
  }));
  const cv = grp(); put(cv, 0, 1.58, z0 + .04); f.add(cv);
  cv.add(mc('gearrack-coat', ({ add }) => { add(G.box(.46, .9, .14, .05), '#d9a441', 0, -.46, 0); for (const y of [-.72, -.52]) add(G.pbox(.47, .05, .145), '#f4f4ec', 0, y, 0); add(G.cyl(.02, .02, .1, 6), STEEL2, 0, .02, -.05, HP, 0, 0); }));
  const p = f.part('lift', cv, t => { cv.rotation.x = -1.2 * t; }, { label: '방화복', sfx: 'swish', dur: .3 });
  f.spot('inside', null, 0, .5, z0 + .04, { part: p, maxH: .4, label: '방화복 뒤', scale: .8 });
  // (② 레벨 10/21, 19판 "인터렉션과 방탈출적인 요소"): the coat's pocket — a stage's key hangs here (clueHang) and drops behind it when
  // the coat lifts (stage.js dropHung)
  f.spot('on', cv, .12, -.62, .09, { maxH: .24, label: '방화복 주머니', scale: .8 }).hang = p;
  f.spot('on', null, .3, 1.77, z0 + .12, { maxH: .25, label: '헬멧 선반 위', scale: .6 });
  f.spot('behind', null, -.3, 0, z0 + .3, { maxH: .3, label: '장화 사이', scale: .7 });
};

// ── 호스 릴 (1×1)
B.hosereel = f => {
  f.add(mc('hosereel', ({ add }) => {
    for (const sx of [-1, 1]) { add(G.box(.06, .7, .3, .02), RED2, sx * .3, .35, -.1); add(G.cyl(.32, .32, .04, 24), RED, sx * .24, .62, -.1, 0, 0, HP); }
    add(G.cyl(.24, .24, .44, 20), '#f4e6c8', 0, .62, -.1, 0, 0, HP);
    for (let k = 0; k < 4; k++) add(G.tor(.25 + k * .005, .02, PI * 2, 4, 24), '#e8d6b0', -.15 + k * .1, .62, -.1, 0, HP, 0);
    add(G.cyl(.04, .03, .22, 10), BRASS, .22, .12, .2, HP, 0, 0); add(G.box(.08, .08, .3, .02), '#f4e6c8', .22, .05, .05);
  }));
  f.spot('behind', null, 0, 0, -.38, { maxH: .35, label: '호스 릴 뒤', scale: .75 });
  f.spot('on', null, 0, .9, -.1, { maxH: .2, label: '호스 릴 위', scale: .6 });
};

// ── 출동 벨 (wall, span 1)
B.firebell = f => {
  f.add(mc('firebell', ({ add }) => {
    add(G.box(.5, .5, .04, .02), '#f4f4ec', 0, 1.9, .02);
    add(G.sph(.2, 18, 12), RED, 0, 1.9, .14, 0, 0, 0, [1, 1, .55]); add(G.sph(.05, 10, 8), BRASS, 0, 1.9, .26);
    add(G.cyl(.012, .012, .5, 6), STEEL2, .18, 1.45, .06); add(G.box(.1, .06, .06, .02), RED2, .18, 1.18, .06);
  }));
};

// ── 소방서 차고 (wall, span 2): the bay door rolled two-thirds up over a dark garage, the '몽글 119 안전센터' sign, lamps
const FIRESIGN = () => tex('firesign', 512, 96, (c, w, h) => {
  c.fillStyle = '#ffffff'; roundRect(c, 4, 4, w - 8, h - 8, 20); c.fill(); c.strokeStyle = RED; c.lineWidth = 8; roundRect(c, 8, 8, w - 16, h - 16, 16); c.stroke();
  c.fillStyle = RED; c.font = font(50); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tr('몽글 119 안전센터'), w / 2, h / 2 + 3, w - 24);
});
B.firegarage = f => {
  const W = 1.8, H = 2.3;
  f.add(mc('firegarage', ({ add }) => {
    add(G.box(W + .2, .16, .12, .02), '#f4f4ec', 0, H + .08, .06);
    for (const sx of [-1, 1]) add(G.box(.1, H, .1, .02), '#f4f4ec', sx * (W / 2 + .05), H / 2, .05);
    // the bay (19판 3차 10/21, "어둡고 우울"): not a black hole any more — a lit garage, pale walls, a yellow line along the
    // floor edge, two lamps hanging under the rolled-up door
    add(G.pbox(W, H, .02), '#b4aec4', 0, H / 2, .01);
    add(G.pbox(W, .5, .022), '#9b95ad', 0, H - .25, .012);
    add(G.pbox(W, .06, .024), '#ffd23f', 0, .1, .013); add(G.pbox(W, .02, .025), '#3b3556', 0, .14, .013);
    for (const x of [-.45, .45]) { add(G.cyl(.006, .006, .2, 4), '#3b3556', x, H - .85, .1); add(G.cone(.09, .08, 10), '#f4f4ec', x, H - .97, .1); add(G.sph(.045, 8, 6), '#fff3b0', x, H - 1.02, .1); }
    add(G.box(W, .75, .05, .01), RED, 0, H - .375, .04);                                  // the door, rolled most of the way up
    for (let i = 0; i < 6; i++) add(G.pbox(W, .012, .055), RED2, 0, H - .08 - i * .12, .045);
    for (const sx of [-1, 1]) { add(G.cyl(.06, .08, .1, 10), '#3a3048', sx * .75, H + .32, .12); add(G.sph(.06, 10, 8), '#fff3b0', sx * .75, H + .26, .14); }
  }));
  f.add(put(decal(1.3, .24, FIRESIGN()), 0, H + .4, .06));
};
// ── 파출소 정면 (wall, span 2): a navy door with a window, the blue police lamp, the '몽글 파출소' sign, a step
B.policefront = f => {
  const W = 1.1, H = 2.1;
  f.add(mc('policefront', ({ add }) => {
    add(G.box(W + .16, H + .1, .1, .02), '#f4f7fd', 0, (H + .1) / 2, .05);
    add(G.box(W - .1, H - .1, .05, .02), NAVY, 0, H / 2, .08);
    add(G.box(W - .4, .7, .02, .01), '#cdeefc', 0, H - .55, .11);
    add(G.cyl(.03, .03, .2, 10), STEEL, .38, 1.0, .14, 0, 0, 0);
    add(G.box(1.6, .1, .5, .03), '#c9cfe0', 0, .05, .25);                                 // the step
    add(G.cyl(.12, .14, .16, 16), '#e8eef8', -.8, 2.45, .14); add(G.sph(.13, 14, 10), BLUE, -.8, 2.58, .14, 0, 0, 0, [1, 1.1, 1]);
  }));
  f.add(put(decal(1.25, .24, SIGN()), .2, H + .32, .07));
};
// ── 순찰차 (2×1): a small round police car along x, light bar on the roof, a door that opens (something left on the seat)
// (21판 4차 10/21, user: "경찰차 소방차 다시" — 검토 세션 GPT 컨셉 시트 concept-policecar-1021, 세 안의 공통 결): a toy SD patrol car —
// a big round cabin over most of the length, a short nose and a short tail, big wheels with grey hubs, a thick dark bumper with
// a POLICE plate, big round headlights, a navy band with a yellow line along the sides and over the nose, a blue-white-red
// light bar, round white mirrors; the tailgate lifts on a little boot (a cone in the corner). The door, its lock and the old
// hiding spots stay where they were.
const PNAVY = '#2b3a7c', PYEL = '#ffcf3a', PGLASS = '#4d5f93', PBUMP = '#4a4658', TYRE = '#2a2a36', HUBG = '#c9ccd8';
const policePlate = () => tex('police-plate', 256, 64, (c, w, h) => {
  c.fillStyle = '#ffffff'; roundRect(c, 3, 3, w - 6, h - 6, 12); c.fill(); c.strokeStyle = PNAVY; c.lineWidth = 5; roundRect(c, 6, 6, w - 12, h - 12, 10); c.stroke();
  c.fillStyle = PNAVY; c.font = font(40); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('POLICE', w / 2, h / 2 + 2);
});
B.patrolcar = f => {
  // SD proportions (the sheet): 1.5 long in its 2×1 slot, tall — the roof at 1.12, wheels as tall as the belt is high
  const L = 1.5, Wd = .9, zf = Wd / 2, BY0 = .2, BY1 = .62, CX0 = -.5, CX1 = .3, CY1 = 1.12, CW = Wd - .06, TX = -.75, TB = -.5, WR = .25;
  const CL = CX1 - CX0, CC = (CX0 + CX1) / 2;
  f.add(mc('patrolcar6', ({ add, tube }) => {
    // the body: a chunky rounded block from the boot to the nose; the boot at the back a shell round a hollow (its lid lifts)
    add(G.box(L / 2 - TB, BY1 - BY0, Wd, .16, 3), WHITE, (TB + L / 2) / 2, (BY0 + BY1) / 2, 0);
    add(G.box(TB - TX + .04, .08, Wd, .04), WHITE, (TX + TB) / 2, BY0 + .04, 0);
    for (const sz of [-1, 1]) add(G.box(TB - TX + .04, BY1 - BY0, .06, .03), WHITE, (TX + TB) / 2, (BY0 + BY1) / 2, sz * (zf - .03));
    add(G.box(.06, BY1 - BY0, Wd, .03), WHITE, TX + .03, (BY0 + BY1) / 2, 0);
    add(G.box(TB - TX - .06, .01, Wd - .12, .004), '#3a3346', (TX + TB) / 2, BY0 + .081, 0);
    add(G.box(.01, BY1 - BY0 - .1, Wd - .12, .004), '#3a3346', TB - .004, (BY0 + BY1) / 2 + .03, 0);
    // the cabin, toy-car style and tall: a white belt, a deep band of dark glass all round, a rounded white roof a little
    // smaller than the belt; pillars at the corners and between the doors (the near front window is the door's)
    add(G.box(CL + .04, .1, CW + .04, .05), WHITE, CC, BY1 + .03, 0);
    add(G.box(CL - .06, .32, CW - .08, .13), PGLASS, CC - .01, .84, 0);
    add(G.box(CL - .1, .2, CW - .1, .09), WHITE, CC - .02, CY1 - .1, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.08, .32, .08, .035), WHITE, CC - .01 + sx * (CL / 2 - .07), .84, sz * (CW / 2 - .08));
    for (const sz of [-1, 1]) add(G.box(.06, .32, .04, .02), WHITE, -.17, .84, sz * (CW / 2 - .05));
    // the navy band and the yellow line, along both sides and the boot, and two stripes over the nose
    for (const sz of [-1, 1]) {
      add(G.pbox(L - .14, .13, .012), PNAVY, 0, .44, sz * (zf + .004)); add(G.pbox(L - .14, .03, .012), PYEL, 0, .53, sz * (zf + .004));
      add(G.box(.32, .012, .17, .006), PNAVY, CX1 + .22, BY1 + .004, sz * .24); add(G.box(.32, .012, .03, .004), PYEL, CX1 + .22, BY1 + .008, sz * .13);
    }
    // wheels: big tyres with grey hubs, near the corners
    for (const x of [.46, -.47]) for (const sz of [-1, 1]) {
      add(G.cyl(WR, WR, .22, 22), TYRE, x, WR - .01, sz * (zf - .1), HP, 0, 0);
      add(G.cyl(.11, .11, .225, 14), HUBG, x, WR - .01, sz * (zf - .1), HP, 0, 0);
      add(G.cyl(.04, .04, .23, 10), '#8a8fa3', x, WR - .01, sz * (zf - .1), HP, 0, 0);
    }
    // the bumpers: thick, dark, round-edged; orange corner lights; red tail lights
    add(G.box(.15, .15, Wd + .02, .065), PBUMP, L / 2 - .02, .26, 0); add(G.box(.15, .15, Wd + .02, .065), PBUMP, TX - .03, .26, 0);
    for (const sz of [-1, 1]) { add(G.sph(.03, 8, 6), '#ff9a3c', L / 2 + .055, .3, sz * .38); add(G.box(.03, .09, .13, .015), '#e2403a', TX - .002, .5, sz * .33); }
    // big round headlights in grey rings, a little grille between
    for (const sz of [-1, 1]) { add(G.cyl(.09, .09, .03, 18), '#fff3c4', L / 2 + .005, .46, sz * .25, 0, 0, HP); add(G.tor(.09, .016, PI * 2, 5, 18), STEEL2, L / 2 + .015, .46, sz * .25, 0, HP, 0); }
    add(G.box(.02, .05, .2, .01), PBUMP, L / 2 + .002, .46, 0);
    // round white mirrors on short stalks; the light bar across the roof (blue · white · red)
    for (const sz of [-1, 1]) { tube([CX1 - .04, .72, sz * (CW / 2)], [CX1 - .02, .75, sz * (CW / 2 + .08)], .012, WHITE, 5); add(G.sph(.06, 10, 8), WHITE, CX1 - .02, .77, sz * (CW / 2 + .1), 0, 0, 0, [.6, 1, 1]); }
    add(G.box(.16, .05, .66, .025), PBUMP, .14, CY1 + .02, 0);
    add(G.box(.14, .09, .22, .04), '#3f6fe8', .14, CY1 + .085, -.2); add(G.box(.14, .08, .16, .03), '#ffffff', .14, CY1 + .08, 0); add(G.box(.14, .09, .22, .04), '#e8433d', .14, CY1 + .085, .2);
    // in the boot: a little traffic cone lying in the far corner
    add(G.cone(.05, .14, 10), '#ff7a33', TX + .13, BY0 + .14, -.26, 0, 0, HP * .9); add(G.box(.11, .02, .11, .005), '#ff7a33', TX + .2, BY0 + .14, -.26, 0, 0, HP * .9);
  }));
  f.add(put(decal(.3, .075, policePlate()), L / 2 + .057, .26, 0, 0, HP, 0));
  // the boot lid: hinged at the cabin's back, it lifts up toward the front
  const tg = grp(); put(tg, TB + .01, BY1, 0); f.add(tg);
  tg.add(mc('patrolcar6-lid', ({ add }) => {
    add(G.box(TB - TX + .02, .05, Wd, .025), WHITE, -(TB - TX + .02) / 2, .02, 0);
    add(G.box(.04, .02, .12, .008), PBUMP, -(TB - TX) + .03, .05, 0);
  }));
  const tp = f.part('lift', tg, t => { tg.rotation.z = -1.5 * t; }, { label: '순찰차 트렁크', sfx: 'open', dur: .35 });
  f.spot('inside', null, TX + .14, BY0 + .085, .1, { part: tp, maxH: .3, label: '순찰차 트렁크 안', scale: .65 });
  // the door (front, +z side): the lower panel on the body's face with the band, the window frame set back on the glass
  const dv = grp(); put(dv, .25, .3, zf + .005); f.add(dv);
  dv.add(mc('patrolcar6-door', ({ add }) => {
    add(G.box(.42, .4, .03, .02), WHITE, -.21, .16, 0);
    add(G.pbox(.42, .13, .034), PNAVY, -.21, .14, 0); add(G.pbox(.42, .03, .034), PYEL, -.21, .23, 0);
    add(G.box(.4, .3, .02, .03), WHITE, -.21, .54, -.062); add(G.box(.32, .22, .024, .05), PGLASS, -.22, .55, -.056);
    add(G.box(.08, .03, .03, .01), STEEL2, -.34, .3, .02);
  }));
  const p = f.part('door', dv, t => { dv.rotation.y = 1.1 * t; }, { label: '순찰차 문', sfx: 'door', dur: .35 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: -.32, y: .26, z: .04, parent: dv };
  f.spot('inside', null, .05, .3, zf + .07, { part: p, maxH: .3, label: '순찰차 문턱', scale: .8 });   // at the open door (the body is solid: a seat inside it could never be seen)
  f.spot('on', null, -.12, CY1, -.2, { maxH: .2, label: '순찰차 지붕 위', scale: .6 });
  f.spot('under', null, 0, 0, 0, { maxH: .16, label: '순찰차 밑', scale: .7 });
};

export const TOWN_BUILDERS = B;
export const TOWN_INFO = {
  jailcell: { w: 2, d: 1, name: '유치장', price: 0, hidden: true },
  wantedboard: { wall: true, span: 2, name: '수배 게시판', price: 0, hidden: true },
  schooldesk: { w: 1, d: 1, name: '학생 책상', price: 160, region: 'apt' },
  chalkboard: { wall: true, span: 2, name: '칠판', price: 220, region: 'apt' },
  lockers: { w: 1, d: 1, name: '사물함', price: 240, region: 'apt' },
  firetruck: { w: 3, d: 2, name: '소방차', price: 0, hidden: true },
  firepole: { w: 1, d: 1, name: '소방봉', price: 0, hidden: true },
  gearrack: { w: 2, d: 1, name: '장비 걸이', price: 0, hidden: true },
  hosereel: { w: 1, d: 1, name: '호스 릴', price: 0, hidden: true },
  firebell: { wall: true, span: 1, name: '출동 벨', price: 0, hidden: true },
  firegarage: { wall: true, span: 2, name: '소방서 차고', price: 0, hidden: true },
  policefront: { wall: true, span: 2, name: '파출소 입구', price: 0, hidden: true },
  patrolcar: { w: 2, d: 1, name: '순찰차', price: 0, hidden: true },
};

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
import { put, grp, mat, mesh, canvasTex, texCache, roundRect, shade } from './kit.js';
import { HG as G, hmc as mc, hxf as xf } from './house-props.js';
import { clothWave, clothSlab, clothBend } from './clothbend.js';
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
// (⑥ 10/24 사용자 16판 "교실 책상 디테일 다시" — a blue-topped box): a real 교실 책상 — a honey top with a darker edge band and a
// pencil groove, a name sticker, steel legs with foot caps and a crossbar, the open cubby with two textbooks in it, a bag on the
// side hook; on top an open notebook with ruled lines, a zip pencil case, a pencil and an eraser. The chair: a moulded seat
// and a curved back on a steel frame with a bar between the back legs.
B.schooldesk = (f, T) => {
  const top = .66, DW = .62, DD = .44, dz = -.1, cz = .3, TOPC = '#e9c28a', EDGE = '#c9975a', FR = '#8f9bb8';
  f.add(mc('schooldesk3', ({ add, tube }) => {
    add(G.box(DW, .03, DD, .01), TOPC, 0, top + .003, dz);
    add(G.box(DW + .01, .022, DD + .01, .008), EDGE, 0, top - .015, dz);
    add(G.pbox(.3, .004, .02), shade(TOPC, -.12), -.05, top + .019, dz - DD / 2 + .04);
    add(G.pbox(.1, .035, .004), WHITE, 0, top - .016, dz + DD / 2 + .006); add(G.pbox(.08, .006, .002), '#8fd3f4', 0, top - .01, dz + DD / 2 + .009);
    // the cubby, open toward the chair (레벨 세션 10/18: never one solid box), two textbooks inside
    const CW = DW - .04, CD = DD - .06, cy0 = top - .15, cz0 = dz - .02;
    add(G.pbox(CW, .012, CD), '#7d93bd', 0, cy0 + .006, cz0);
    add(G.pbox(CW, .12, .012), '#9fb4d8', 0, cy0 + .06, cz0 - CD / 2 + .006);
    add(G.pbox(CW - .03, .1, .004), '#2f3f7a', 0, cy0 + .06, cz0 - CD / 2 + .014);
    for (const sx of [-1, 1]) add(G.pbox(.012, .12, CD), '#9fb4d8', sx * (CW / 2 - .006), cy0 + .06, cz0);
    for (const [x, c, h] of [[-.2, '#ff8a7a', .1], [-.17, '#7fc6e8', .09]]) add(G.box(.025, h, .2, .004), c, x, cy0 + .012 + h / 2, cz0 - .04);
    // legs: steel with grey foot caps, a crossbar low between the side pairs, the bag hook
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) { add(G.cyl(.016, .016, top - .05, 8), FR, sx * (DW / 2 - .05), (top - .05) / 2 + .02, dz + sz * (DD / 2 - .05)); add(G.cyl(.02, .02, .02, 8), DARK, sx * (DW / 2 - .05), .01, dz + sz * (DD / 2 - .05)); }
      add(G.cyl(.011, .011, DD - .1, 6), FR, sx * (DW / 2 - .05), .12, dz, HP, 0, 0);
    }
    add(G.box(.012, .05, .012, .004), FR, DW / 2 + .006, top - .06, dz + .1); add(G.tor(.016, .004, PI, 3, 8), FR, DW / 2 + .02, top - .085, dz + .1, 0, HP, PI);
    add(G.box(.06, .2, .16, .03), '#ff9a6a', DW / 2 + .045, top - .2, dz + .1); add(G.box(.064, .07, .1, .02), shade('#ff9a6a', -.12), DW / 2 + .05, top - .23, dz + .1);
    tube([DW / 2 + .02, top - .095, dz + .07], [DW / 2 + .02, top - .095, dz + .13], .006, DARK, 4);
    // on top: an open notebook (ruled), a zip pencil case, a pencil, an eraser
    for (const s of [-1, 1]) { add(G.box(.12, .008, .17, .003), WHITE, -.12 + s * .062, top + .022, dz + .03, 0, .15, s * -.03); }
    for (let k = 0; k < 5; k++) add(G.pbox(.2, .002, .004), '#a8c8e8', -.12, top + .0275, dz - .03 + k * .03, 0, .15, 0);
    add(G.cap(.03, .14, 2, 8), '#ff9fb5', .17, top + .045, dz - .08, 0, 0, HP); add(G.pbox(.15, .004, .006), '#e8e0d0', .17, top + .075, dz - .08); add(G.sph(.009, 6, 5), '#c9cfe0', .25, top + .07, dz - .08);
    add(G.cyl(.006, .006, .15, 6), YEL, -.13, top + .034, dz + .13, 0, .15, HP); add(G.cone(.006, .015, 6), '#f0d3a8', -.13 + Math.cos(.15) * .082, top + .034, dz + .13 - Math.sin(.15) * .082, 0, .15, -HP);
    add(G.box(.04, .015, .022, .004), WHITE, .04, top + .025, dz - .15, 0, .3, 0); add(G.box(.042, .006, .024, .002), '#7fc6e8', .04, top + .031, dz - .15, 0, .3, 0);
    // the chair: a moulded seat, one back panel leaning back a little between the two back posts, a steel frame
    // (10/27 사용자 실폰 16판 "의자 모양이 이상함": the back was five slats fanned out and tipped toward the desk — a loose fence)
    add(G.box(.38, .025, .36, .012), TOPC, 0, .43, cz); add(G.box(.39, .014, .37, .006), EDGE, 0, .412, cz);
    add(G.box(.37, .15, .024, .02), TOPC, 0, .665, cz + .182, .11, 0, 0); add(G.box(.375, .012, .028, .005), EDGE, 0, .588, cz + .174, .11, 0, 0);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) { add(G.cyl(.014, .014, .41, 8), FR, sx * .16, .205, cz + sz * .15); add(G.cyl(.018, .018, .016, 8), DARK, sx * .16, .008, cz + sz * .15); }
      tube([sx * .16, .4, cz + .15], [sx * .17, .76, cz + .19], .013, FR, 6);
    }
    add(G.cyl(.012, .012, .32, 8), FR, 0, .54, cz + .17, 0, 0, HP);
    add(G.cyl(.01, .01, .3, 6), FR, 0, .1, cz, 0, 0, HP);
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
// (19판 10/22, user: "소방차 경찰차 컨셉대로" — concept-firetruck-1021 1번): a toy SD fire engine — a big round cab-over cab with a
// wide windscreen you can see into (seats, the wheel, two wipers), a red beacon dome and black mirrors; a grey bumper with a
// slotted grille, round headlights in rings and orange lights; a short body with a white stripe, the hose reel in its own
// framed bay behind the cab, two roll-up lockers (one padlocked) with a yellow helmet on a shelf and a fire extinguisher inside,
// a silver ladder on black posts; fat tyres with cream hub caps. Its size, parts and hiding spots are the ones ②·③ use.
const FRED = '#ef4a3f', FRED2 = '#c93a31', FGLASS = '#4f6aa8', FBUMP = '#8a8fa3', FINK = '#3a3346', FCAP = '#f2e6c8';
// (19판 10/24 사용자 메모 "자동차 바퀴 이상함" — opts.wheels 'v2', 19판 새 맵만): the dark well disc (R + .08) was a whole circle
// out in front of the tyre's middle, so its lower half hung under the body and through the ground as a dark crescent; the
// cream hub cap stood .05 proud of the tyre like a plate. v2: the well is only the arch over the tyre (on the body's face),
// the tyre has tread blocks and a sidewall line, the rim sits inside the tyre (a dished steel wheel with six nuts and a low hub)
// (19판 10/29 밤 대수선, 사용자 실폰 "소방차 부품 자체가 안 예쁨·바닥에 파묻혀 안 보임·옆면 문이 벽에 가려짐" — opts.fs3, 19판 새 맵만):
// 처음부터 다시 만든 장난감 소방차. 둥근 캡오버 운전석(흰 지붕·경광등 막대·큰 앞유리·문에 119 동그라미 표시·손잡이·발판),
// 회색 범퍼·격자 그릴·둥근 전조등·번호판, 뒤 칸은 은색 말림 셔터 두 칸(열면 헬멧 선반·소화기·감긴 호스)과 호스 릴 칸,
// 셔터 아래 철판 발판, 지붕엔 회전대 위 사다리, 뒤엔 계단 범퍼·꼬리등, 바퀴는 v2 타이어와 흙받기.
// 열리는 칸은 차의 -z 쪽(19판에선 카메라 쪽 +x)으로 — 부품 둘(0 앞 칸 자물쇠, 1 뒤 칸)·숨김 자리 넷은 옛 소방차와 같음.
const T3 = { red: '#ec5446', redD: '#c2423a', white: '#fbf7ef', steel: '#d3d8e2', steelD: '#a2a9b8', dark: '#4a4858', glass: '#7fa7d6', bump: '#9a9fb0', cream: '#f4ead2' };
const truckDoorTex = () => tex('fs3truck-door', 128, 128, (c, w, h) => {
  c.fillStyle = '#fbf7ef'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 4, 0, 7); c.fill();
  c.strokeStyle = '#ec5446'; c.lineWidth = 7; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 12, 0, 7); c.stroke();
  c.fillStyle = '#ec5446'; c.font = font(44); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('119', w / 2, h / 2 + 3, w - 30);
});
const truckPlateTex = () => tex('fs3truck-plate', 160, 56, (c, w, h) => {
  c.fillStyle = '#fbf7ef'; roundRect(c, 3, 3, w - 6, h - 6, 10); c.fill(); c.strokeStyle = '#4a4858'; c.lineWidth = 4; roundRect(c, 6, 6, w - 12, h - 12, 8); c.stroke();
  c.fillStyle = '#4a4858'; c.font = font(34); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('119', w / 2, h / 2 + 2, w - 20);
});
function fs3Truck(f) {
  const C = T3, S = -1, Wd = 1.3, zf = Wd / 2, BY0 = .3, LF = .8, LT = 1.36, BT = 1.48, BX0 = -1.3, BX1 = .42, CX0 = .46, CX1 = 1.28, CY1 = 1.56, WR = .34;
  const LOCK = [-.9, -.27], LW = .56, GY0 = 1.04, GY1 = CY1 - .16, CW = Wd - .04, RX = .25;
  const AX = [-.78, .86];
  const cabSide = outline([[CX0 + .05, BY0 + .05], [CX0 + .05, CY1 - .22], [CX0 + .05, CY1 - .05, CX0 + .22, CY1 - .05], [CX1 - .3, CY1 - .05], [CX1 - .05, CY1 - .05, CX1 - .05, CY1 - .3], [CX1 - .05, BY0 + .16], [CX1 - .05, BY0 + .05, CX1 - .16, BY0 + .05], [CX0 + .05, BY0 + .05]]);
  const SWIN = [[CX0 + .16, GY0], [CX1 - .14, GY0], [CX1 - .14, GY1 - .12], [CX1 - .14, GY1, CX1 - .26, GY1], [CX0 + .16, GY1], [CX0 + .16, GY0]];
  cabSide.holes.push(outline(SWIN, THREE.Path));
  f.add(mc('fs3truck-body', ({ add, addM, tube }) => {
    // ── the back body: solid on the wall side, the near side open into two lockers (their shutters roll up) and the hose bay
    const zin = S * (zf - .5);
    add(G.box(BX1 - BX0, BT - BY0, Wd - .5, .07, 3), C.red, (BX0 + BX1) / 2, (BY0 + BT) / 2, -S * .25);
    add(G.box(BX1 - BX0, LF - BY0, .5, .06, 3), C.red, (BX0 + BX1) / 2, (BY0 + LF) / 2, S * (zf - .25));
    add(G.box(BX1 - BX0, BT - LT, .5, .05, 3), C.red, (BX0 + BX1) / 2, (LT + BT) / 2, S * (zf - .25));
    const posts = [[BX0, LOCK[0] - LW / 2], [LOCK[0] + LW / 2, LOCK[1] - LW / 2], [LOCK[1] + LW / 2, RX - .19], [RX + .19, BX1]];
    for (const [a, b] of posts) if (b - a > .01) add(G.box(b - a, LT - LF + .02, .5, .02), C.red, (a + b) / 2, (LF + LT) / 2, S * (zf - .25));
    // a thin white frame round each opening, the roll box over it
    for (const x of LOCK) {
      for (const [w, h, xx, y] of [[LW + .06, .035, x, LT + .005], [LW + .06, .035, x, LF - .005], [.035, LT - LF, x - LW / 2 - .015, (LF + LT) / 2], [.035, LT - LF, x + LW / 2 + .015, (LF + LT) / 2]]) add(G.box(w, h, .03, .01), C.white, xx, y, S * (zf + .005));
      add(G.cyl(.055, .055, LW + .02, 16), C.steel, x, LT + .05, S * (zf - .02), 0, 0, HP);
      for (const s of [-1, 1]) add(G.cyl(.062, .062, .03, 16), C.steelD, x + s * (LW / 2 + .01), LT + .05, S * (zf - .02), 0, 0, HP);
      // inside: a grey lining, a floor, a shelf with a helmet, an extinguisher, a coil of hose on the floor
      add(G.pbox(LW, LT - LF, .02), '#8f8aa3', x, (LF + LT) / 2, zin);
      add(G.pbox(LW, .02, .48), '#b3aec4', x, LF + .01, S * (zf - .26));
      for (const s of [-1, 1]) add(G.pbox(.02, LT - LF, .48), '#a29db5', x + s * (LW / 2 - .01), (LF + LT) / 2, S * (zf - .26));
      const k = x === LOCK[0], hx = x + (k ? -.13 : .13), SHY = LF + .3;
      add(G.box(LW - .04, .025, .2, .008), '#d1ccdc', x, SHY, zin + S * .11);
      add(G.sph(.1, 16, 10), k ? '#ffcf3a' : C.red, hx, SHY + .015, zin + S * .12, 0, 0, 0, [1.05, .8, 1.15]);
      add(G.tor(.11, .022, PI * 2, 6, 20), k ? '#e8b22e' : C.redD, hx, SHY + .02, zin + S * .12, HP, 0, 0, [1, 1.25, 1]);
      add(G.box(.04, .05, .02, .008), '#f7e6a8', hx, SHY + .07, zin + S * .23);
      const ex = x + (k ? .17 : -.17);
      add(G.cyl(.05, .05, .2, 14), '#e2403a', ex, LF + .12, zin + S * .12); add(G.sph(.05, 12, 6), '#e2403a', ex, LF + .22, zin + S * .12, 0, 0, 0, [1, .5, 1]);
      add(G.box(.035, .05, .03, .008), C.dark, ex, LF + .26, zin + S * .12); add(G.pbox(.065, .07, .004), '#ffffff', ex, LF + .12, zin + S * .172);
      tube([ex + .01, LF + .27, zin + S * .12], [ex + (k ? .07 : -.07), LF + .18, zin + S * .16], .009, C.dark, 5);
      add(G.tor(.085, .03, PI * 2, 6, 18), C.cream, hx, LF + .05, zin + S * .14, HP, 0, 0);
    }
    // the hose bay behind the cab: a dark back, a red drum with cream hose wound on it, the brass nozzle hanging in a clip
    add(G.pbox(.36, .5, .02), '#6f6a86', RX, (LF + LT) / 2, S * (zf - .3));
    add(G.box(.4, .03, .32, .01), C.white, RX, LF - .005, S * (zf - .15)); add(G.box(.4, .03, .32, .01), C.white, RX, LT + .005, S * (zf - .15));
    add(G.cyl(.21, .21, .04, 22), C.redD, RX, (LF + LT) / 2, S * (zf - .27), HP, 0, 0); add(G.cyl(.21, .21, .04, 22), C.redD, RX, (LF + LT) / 2, S * (zf - .02), HP, 0, 0);
    for (let k = 0; k < 3; k++) add(G.tor(.15 - k * .012, .035, PI * 2, 6, 20), k % 2 ? '#efdcb4' : C.cream, RX, (LF + LT) / 2, S * (zf - .07 - k * .065));
    add(G.cyl(.05, .05, .27, 12), C.steelD, RX, (LF + LT) / 2, S * (zf - .15), HP, 0, 0);
    tube([RX + .14, (LF + LT) / 2 - .05, S * (zf - .02)], [RX + .1, LF + .06, S * (zf + .04)], .03, C.cream, 6);
    add(G.cyl(.032, .022, .1, 10), BRASS, RX + .1, LF + .02, S * (zf + .05));
    // the white stripe along body and cab, stopped at the wheel arches; a thin red-white checker band under the roof edge
    const ARCH = AX.map(x => ({ x, y: WR, r: WR + .08 }));
    for (const sz of [-1, 1]) stripeAround(add, C.white, BX0 + .04, CX1 - .05, .66, .1, sz * (zf + .004), ARCH);
    for (let k = 0; k < 12; k++) add(G.pbox(.13, .04, .012), k % 2 ? C.white : C.redD, BX0 + .1 + k * .135, BT - .07, -S * (zf + .004));
    // the top: a steel deck rail round the body, the turntable at the back with the ladder resting forward on a cradle
    for (const sz of [-1, 1]) { add(G.box(BX1 - BX0 - .1, .03, .03, .01), C.steel, (BX0 + BX1) / 2, BT + .16, sz * (zf - .08)); for (let k = 0; k < 6; k++) add(G.cyl(.012, .012, .16, 6), C.steelD, BX0 + .1 + k * .3, BT + .08, sz * (zf - .08)); }
    add(G.cyl(.3, .32, .1, 22), C.steelD, BX0 + .38, BT + .05, 0); add(G.cyl(.24, .24, .06, 22), C.steel, BX0 + .38, BT + .12, 0);
    for (const sz of [-1, 1]) add(G.box(.18, .22, .05, .02), C.redD, BX0 + .38, BT + .24, sz * .2);
    add(G.cyl(.04, .04, .46, 10), C.steelD, BX0 + .38, BT + .3, 0, HP, 0, 0);
    add(G.box(.08, .24, .5, .02), C.dark, CX0 - .06, BT + .12, 0);
    const LA = Math.atan2(.08, 1.6);
    for (const sz of [-.2, .2]) add(G.box(1.95, .06, .06, .025), C.steel, -.25, BT + .33, sz, 0, 0, -LA);
    for (let k = 0; k < 10; k++) { const x = -1.12 + k * .2; add(G.cyl(.018, .018, .4, 8), C.steelD, x, BT + .33 - (x + .25) * Math.tan(LA), 0, HP, 0, 0); }
    // the rear: a grey step bumper with a tread line, round tail lights, a ladder of grab steps, two little hooks
    add(G.box(.2, .16, Wd + .04, .06, 3), C.bump, BX0 - .06, BY0 + .06, 0); add(G.pbox(.16, .01, Wd - .1), '#7d8194', BX0 - .06, BY0 + .145, 0);
    for (const sz of [-1, 1]) { add(G.cyl(.06, .06, .03, 16), '#ff6f5e', BX0 - .005, .76, sz * .48, 0, 0, HP); add(G.tor(.06, .012, PI * 2, 4, 16), C.steelD, BX0 - .01, .76, sz * .48, 0, HP, 0); add(G.cyl(.04, .04, .03, 12), '#ffb347', BX0 - .005, .9, sz * .48, 0, 0, HP); }
    for (let k = 0; k < 3; k++) add(G.box(.04, .03, .3, .012), C.steelD, BX0 - .02, .6 + k * .22, 0);
    for (const sz of [-1, 1]) tube([BX0 - .02, .55, sz * .19], [BX0 - .02, 1.15, sz * .19], .014, C.steelD, 6);
    // the running board under the lockers (chequered steel) on its two brackets
    add(G.box(1.45, .04, .16, .015), C.steel, -.55, BY0 + .02, S * (zf + .02));
    for (let k = 0; k < 9; k++) add(G.pbox(.1, .006, .1), C.steelD, -1.15 + k * .16, BY0 + .043, S * (zf + .02), 0, .8, 0);
    // ── the cab: a round red block below the glass, two side frames with windows, a white roof, the front
    add(G.box(CX1 - CX0, GY0 - BY0 + .04, CW - .04, .16, 4), C.red, (CX0 + CX1) / 2, (BY0 + GY0 + .04) / 2, 0);
    for (const sz of [-1, 1]) addM(roundSlab(cabSide, .12, .04), xf(0, 0, sz * (CW / 2 - .06)), C.red);
    add(G.box(CX1 - CX0 - .02, .12, CW - .02, .05, 3), C.white, (CX0 + CX1) / 2 - .01, CY1 - .03, 0);
    add(G.pbox(.04, GY1 - GY0, CW - .14), C.redD, CX0 + .03, (GY0 + GY1) / 2, 0);
    add(G.box(.16, .12, CW - .2, .05), C.dark, CX1 - .16, GY0 + .05, 0);
    for (const sz of [-1, 1]) { add(G.box(.22, .08, .3, .03), '#5a5668', (CX0 + CX1) / 2 - .06, GY0 + .03, sz * .25); add(G.box(.08, .32, .3, .035), '#5a5668', (CX0 + CX1) / 2 - .18, GY0 + .17, sz * .25, 0, 0, .1); }
    add(G.tor(.09, .016, PI * 2, 6, 18), C.dark, CX1 - .26, GY0 + .2, -.25, 0, HP, .55);
    // the cab door on the near side: its seam, a handle, a step under it
    const dz = S * (CW / 2 + .005);
    for (const [w, h, x, y] of [[.012, GY0 - BY0 - .1, CX0 + .1, (BY0 + GY0) / 2 + .02], [.012, GY0 - BY0 - .1, CX1 - .12, (BY0 + GY0) / 2 + .02]]) add(G.pbox(w, h, .012), C.redD, x, y, dz);
    add(G.box(.12, .035, .03, .012), C.steelD, CX1 - .22, GY0 - .1, dz + S * .01);
    add(G.box(.3, .035, .12, .012), C.steel, (CX0 + CX1) / 2, BY0 + .02, S * (zf + .02));
    // the light bar: a dark base, two red domes and a white middle, and a small horn
    add(G.box(.2, .05, .9, .03), C.dark, CX0 + .3, CY1 + .045, 0);
    for (const sz of [-.3, .3]) add(new THREE.SphereGeometry(.1, 16, 8, 0, PI * 2, 0, HP), '#ff4a3a', CX0 + .3, CY1 + .07, sz, 0, 0, 0, [1, .9, 1.3]);
    add(G.box(.12, .07, .22, .03), C.white, CX0 + .3, CY1 + .1, 0);
    // wipers, black mirrors on bent arms
    for (const sz of [-.28, .18]) add(G.box(.025, .022, .34, .008), C.dark, CX1 - .05, GY0 + .07, sz, .5, 0, 0);
    for (const sz of [-1, 1]) { tube([CX1 - .08, 1.14, sz * (CW / 2)], [CX1 + .04, 1.2, sz * (CW / 2 + .12)], .018, C.dark, 5); add(G.box(.06, .2, .11, .03), C.dark, CX1 + .06, 1.14, sz * (CW / 2 + .15)); }
    add(G.pbox(.012, .1, CW - .3), C.white, CX1 + .004, .66, 0);
    // the front: a grille with dark slots, round headlights in rings, orange corner lights, a thick bumper, the plate, tow hooks
    add(G.box(.05, .28, .54, .04), C.bump, CX1 + .01, .72, 0); for (let k = 0; k < 4; k++) add(G.box(.02, .025, .44, .008), '#6b6f82', CX1 + .035, .62 + k * .065, 0);
    for (const sz of [-1, 1]) { add(G.sph(.12, 18, 12), '#fff0b0', CX1 - .01, .78, sz * .44, 0, 0, 0, [.5, 1, 1]); add(G.tor(.12, .024, PI * 2, 5, 20), C.steelD, CX1 + .01, .78, sz * .44, 0, HP, 0); add(G.box(.04, .06, .1, .02), '#ff9a3c', CX1 + .02, .58, sz * .5); }
    add(G.box(.22, .2, Wd + .06, .08, 3), C.bump, CX1 + .06, .4, 0);
    for (const sz of [-1, 1]) add(G.tor(.035, .012, PI, 4, 10), C.dark, CX1 + .18, .33, sz * .4, 0, HP, PI);
    // the chassis under it all: a dark frame between the axles, a step box, mud flaps behind the wheels
    add(G.box(BX1 - BX0 + .7, .12, .6, .03), C.dark, (BX0 + CX1) / 2, BY0 - .02, 0);
    for (const sz of [-1, 1]) add(G.box(.04, .2, .2, .01), C.dark, AX[0] - WR - .08, .26, sz * (zf - .12));
    // wheels
    for (const x of AX) for (const sz of [-1, 1]) { toyWheel2(add, x, WR, sz * (zf - .1), WR, .3, sz, C.cream); wheelArch2(add, x, WR, sz * (zf + .006), WR + .07, C.red, C.redD, '#4a2a2a', BY0); }
  }));
  f.add(put(decal(.26, .26, truckDoorTex()), (CX0 + CX1) / 2 + .02, (BY0 + GY0) / 2 + .06, S * (CW / 2 + .012), 0, S < 0 ? PI : 0, 0));
  f.add(put(decal(.2, .07, truckPlateTex()), CX1 + .175, .42, 0, 0, HP, 0));
  // the cab's glass
  f.add(glassOf('fs3truck-glass', C.glass, ({ add, addM }) => {
    add(G.pbox(.016, CY1 - .28 - GY0, CW - .16), '#ffffff', CX1 - .06, (GY0 + CY1 - .28) / 2, 0);
    const pg = new THREE.ExtrudeGeometry(outline(SWIN), { depth: .012, bevelEnabled: true, bevelThickness: .001, bevelSize: .015, bevelSegments: 1, curveSegments: 6 }); pg.translate(0, 0, -.006);
    for (const sz of [-1, 1]) addM(pg, xf(0, 0, sz * (CW / 2 - .06)), '#ffffff');
  }));
  // two roll-up lockers on the near side: silver ribbed slats, a red bottom rail with a bar handle
  for (const [k, x] of [[0, LOCK[0]], [1, LOCK[1]]]) {
    const sv = grp(); put(sv, x, LT, S * (zf + .012)); sv.rotation.y = S < 0 ? PI : 0; f.add(sv);
    sv.add(mc('fs3truck-shutter', ({ add }) => {
      const H = LT - LF;
      add(G.box(LW - .02, H, .02, .008), C.steel, 0, -H / 2, 0);
      for (let i = 0; i < 9; i++) add(G.cyl(.011, .011, LW - .04, 6), i % 2 ? '#e3e7ee' : C.steelD, 0, -.04 - i * .055, .012, 0, 0, HP);
      add(G.box(LW - .02, .06, .035, .012), C.redD, 0, -H + .03, .008);
      add(G.tor(.07, .012, PI, 4, 12), C.dark, 0, -H + .06, .03, PI, 0, 0);
    }));
    const p = f.part('curtain', sv, t => { sv.scale.y = 1 - .88 * t; }, { label: k ? '소방차 뒤 칸' : '소방차 앞 칸', sfx: 'swish', dur: .35 });
    if (!k) { p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: -(LT - LF) + .06, z: .06, parent: sv }; }
    f.spot('inside', null, x + (k ? -.02 : .02), LF + .025, S * (zf - .13), { part: p, maxH: .26, label: '소방차 장비 칸', scale: .8 });
  }
  f.spot('on', null, -.45, BT + .005, S * .4, { maxH: .26, label: '소방차 지붕 위', scale: .7 });
  f.spot('under', null, .05, .02, 0, { maxH: .2, label: '소방차 밑', scale: .8 });
}
B.firetruck = (f, T, opts = {}) => {
  if (opts?.fs3) return fs3Truck(f);
  const W2 = opts?.wheels === 'v2';
  // SD proportions (the sheet): 2.4 long in its 3×2 slot, tall — the cab roof at 1.7, wheels .72 across, the lockers up over them
  const L = 2.4, Wd = 1.3, zc = 0, zf = Wd / 2, BY0 = .32, LF = .8, LT = 1.3, BT = 1.45, CX0 = .45, CX1 = 1.2, CY1 = 1.7, WR = .36;
  const CC = (CX0 + CX1) / 2, CL = CX1 - CX0, CW = Wd - .06, BX0 = -1.2, LOCK = [-.85, -.2], GY0 = 1.0, GY1 = CY1 - .2, GM = (GY0 + GY1) / 2;
  // the cab's side frames and roof, drawn as side views (inset by the bevel that rounds them back out)
  const cabSide = outline([[CX0 + .04, BY0 + .04], [CX0 + .04, CY1 - .24], [CX0 + .04, CY1 - .04, CX0 + .2, CY1 - .04], [CX1 - .3, CY1 - .04], [CX1 - .04, CY1 - .04, CX1 - .04, CY1 - .3], [CX1 - .04, BY0 + .16], [CX1 - .04, BY0 + .04, CX1 - .16, BY0 + .04], [CX0 + .04, BY0 + .04]]);
  const SWIN = [[CX0 + .16, GY0], [CX1 - .16, GY0], [CX1 - .16, GY1 - .14], [CX1 - .16, GY1 - .02, CX1 - .28, GY1 - .02], [CX0 + .16, GY1 - .02], [CX0 + .16, GY0]];
  cabSide.holes.push(outline(SWIN, THREE.Path));
  const cabRoof = outline([[CX0 + .04, CY1 - .2], [CX0 + .04, CY1 - .04, CX0 + .2, CY1 - .04], [CX1 - .3, CY1 - .04], [CX1 - .04, CY1 - .04, CX1 - .04, CY1 - .3], [CX1 - .12, CY1 - .3], [CX1 - .12, CY1 - .14, CX1 - .3, CY1 - .14], [CX0 + .2, CY1 - .14], [CX0 + .14, CY1 - .14, CX0 + .14, CY1 - .2], [CX0 + .04, CY1 - .2]]);
  f.add(mc('firetruck7' + (W2 ? '-w2' : ''), ({ add, addM, tube }) => {
    // the body: solid at the back, two open lockers on the near side above the wheels (their shutters roll up)
    add(G.box(CX0 - BX0 + .02, BT - BY0, .76, .1, 3), FRED, (BX0 + CX0) / 2, (BY0 + BT) / 2, -.27);
    add(G.box(CX0 - BX0 + .02, LF - BY0, .56, .06, 2), FRED, (BX0 + CX0) / 2, (BY0 + LF) / 2, .37); add(G.box(CX0 - BX0 + .02, BT - LT, .56, .06, 2), FRED, (BX0 + CX0) / 2, (LT + BT) / 2, .37);
    const gaps = [BX0, LOCK[0] - .31, LOCK[0] + .31, LOCK[1] - .31, LOCK[1] + .31, CX0];
    for (let k = 0; k < gaps.length; k += 2) add(G.box(gaps[k + 1] - gaps[k], LT - LF, .56, .01), FRED, (gaps[k] + gaps[k + 1]) / 2, (LF + LT) / 2, .37);
    // inside each locker: a grey back and floor, a shelf across the back with a fire helmet on it, an extinguisher on the floor
    for (const [k, x] of [[0, LOCK[0]], [1, LOCK[1]]]) {
      add(G.pbox(.62, LT - LF, .02), '#9a96ae', x, (LF + LT) / 2, .11); add(G.pbox(.62, .02, .54), '#b4b0c4', x, LF + .01, .37);
      const hx = x + (k ? .15 : -.15), ex = x + (k ? -.22 : .22), hc = k ? '#ef4a3f' : '#ffcf3a', SH = LF + .19;
      add(G.pbox(.28, .02, .16), '#c4c0d2', hx, SH, .19); add(G.pbox(.02, SH - LF, .16), '#c4c0d2', hx + (k ? .14 : -.14), (LF + SH) / 2, .19);
      add(G.sph(.085, 16, 10), hc, hx, SH + .01, .18, 0, 0, 0, [1.05, .78, 1.1]); add(G.tor(.095, .02, PI * 2, 6, 18), hc, hx, SH + .015, .18, HP, 0, 0, [1, 1.2, 1]);
      add(G.box(.035, .055, .04, .01), FINK, hx, SH + .06, .265);
      add(G.cyl(.048, .048, .2, 14), '#e2403a', ex, LF + .12, .17); add(G.sph(.048, 12, 6), '#e2403a', ex, LF + .22, .17, 0, 0, 0, [1, .5, 1]);
      add(G.box(.03, .05, .03, .008), FINK, ex, LF + .26, .17); add(G.pbox(.06, .07, .005), '#ffffff', ex, LF + .12, .219);
      tube([ex + .01, LF + .27, .17], [ex + (k ? -.06 : .06), LF + .17, .19], .009, FINK, 5);
    }
    // the roll-up boxes over the two lockers
    for (const x of LOCK) add(G.cyl(.05, .05, .64, 14), '#d9dee8', x, LT + .03, zf - .02, 0, 0, HP);
    // the cab: a round block below the glass, two side frames round at the roof's front (side windows in them), a round roof
    // between them; inside, a dark dashboard, two seats, the wheel
    add(G.box(CL, GY0 - BY0 + .04, CW - .04, .17, 4), FRED, CC, (BY0 + GY0 + .04) / 2, 0);
    for (const sz of [-1, 1]) addM(roundSlab(cabSide, .12, .04), xf(0, 0, sz * (CW / 2 - .06)), FRED);
    addM(roundSlab(cabRoof, CW - .16, .04), xf(), FRED);
    add(G.pbox(.04, GY1 - GY0, CW - .14), FRED2, CX0 + .03, GM, 0);
    add(G.box(.16, .12, CW - .2, .05), FINK, CX1 - .16, GY0 + .05, 0);
    for (const sz of [-1, 1]) { add(G.box(.22, .08, .3, .03), '#5a5668', CC - .08, GY0 + .03, sz * .25); add(G.box(.08, .32, .3, .035), '#5a5668', CC - .2, GY0 + .17, sz * .25, 0, 0, .1); }
    add(G.tor(.09, .016, PI * 2, 6, 18), FINK, CX1 - .26, GY0 + .2, -.25, 0, HP, .55);
    tube([CX1 - .18, GY0 + .1, -.25], [CX1 - .25, GY0 + .18, -.25], .014, FINK, 5);
    // two wipers resting on the windscreen's foot; the beacon dome on a dark base; black mirrors on bent arms
    for (const sz of [-.28, .18]) add(G.box(.025, .022, .34, .008), FINK, CX1 - .04, GY0 + .07, sz, .5, 0, 0);
    add(G.cyl(.13, .15, .06, 18), FINK, CC + .12, CY1 + .03, 0); add(new THREE.SphereGeometry(.14, 18, 10, 0, PI * 2, 0, HP), '#ff4a3a', CC + .12, CY1 + .06, 0);
    for (const sz of [-1, 1]) { tube([CX1 - .06, 1.12, sz * (CW / 2)], [CX1 + .05, 1.18, sz * (CW / 2 + .12)], .018, FINK, 5); add(G.box(.06, .2, .11, .03), FINK, CX1 + .07, 1.12, sz * (CW / 2 + .15)); }
    // the white stripe along body and cab
    const ARCH = [{ x: -.72, y: WR, r: WR + .08 }, { x: .82, y: WR, r: WR + .08 }];
    for (const sz of [-1, 1]) stripeAround(add, WHITE, -L / 2 + .05, L / 2 - .05, .63, .1, sz * (zf + .004), ARCH);
    add(G.pbox(.012, .1, CW - .3), WHITE, CX1 + .004, .63, 0);
    // the front: a grey grille with dark slots, big round headlights in rings, a thick grey bumper with orange lights
    add(G.box(.05, .26, .5, .04), FBUMP, CX1 + .01, .68, 0); for (let k = 0; k < 4; k++) add(G.box(.02, .025, .4, .008), '#6b6f82', CX1 + .035, .59 + k * .06, 0);
    for (const sz of [-1, 1]) { add(G.sph(.12, 18, 12), '#fff0b0', CX1 - .01, .74, sz * .43, 0, 0, 0, [.5, 1, 1]); add(G.tor(.12, .024, PI * 2, 5, 20), STEEL2, CX1 + .01, .74, sz * .43, 0, HP, 0); }
    add(G.box(.22, .22, Wd + .06, .09, 3), FBUMP, CX1 + .06, .34, 0);
    for (const sz of [-1, 1]) add(G.box(.04, .06, .12, .02), '#ff9a3c', CX1 + .17, .37, sz * .5);
    add(G.box(.16, .2, Wd, .07, 3), FBUMP, BX0 - .02, .36, 0); for (const sz of [-1, 1]) add(G.cyl(.06, .06, .03, 16), '#e2403a', BX0 - .005, .72, sz * .45, 0, 0, HP);
    // wheels: two big axles, fat tyres with cream hub caps, dark wells behind them
    for (const x of [-.72, .82]) for (const sz of [-1, 1]) {
      if (W2) { toyWheel2(add, x, WR, sz * (zf - .1), WR, .3, sz, FCAP); wheelArch2(add, x, WR, sz * (zf + .006), WR + .07, FRED, '#8e2a26', FINK, BY0); continue; }
      toyWheel(add, x, WR, sz * (zf - .1), WR, .3, sz, FCAP);
      wheelArch(add, x, WR, sz * (zf + .024), WR + .08, FRED, '#8e2a26', FINK);
    }
    // the ladder on top: two round silver rails with rungs on two black posts
    for (const sz of [-.24, .24]) add(G.box(1.5, .07, .07, .03), STEEL, -.42, BT + .17, sz);
    for (let k = 0; k < 8; k++) add(G.cyl(.02, .02, .48, 8), STEEL2, -1.1 + k * .195, BT + .17, 0, HP, 0, 0);
    for (const sx of [-1.0, .2]) add(G.box(.1, .16, .62, .04), FINK, sx, BT + .06, 0);
    // the hose reel in its own bay behind the cab: a grey frame and back, a red drum, cream hose wound on it, the brass nozzle
    const RX = .29, RY = 1.02;
    add(G.pbox(.4, .46, .01), '#7f7b95', RX, RY, zf + .006);
    for (const [w, h, x, y] of [[.44, .04, RX, RY + .25], [.44, .04, RX, RY - .25], [.04, .54, RX - .22, RY], [.04, .54, RX + .22, RY]]) add(G.box(w, h, .04, .015), '#d9dee8', x, y, zf + .02);
    add(G.cyl(.19, .19, .05, 20), FRED2, RX, RY, zf + .08, HP, 0, 0); add(G.cyl(.19, .19, .05, 20), FRED2, RX, RY, zf - .06, HP, 0, 0);
    for (let k = 0; k < 3; k++) add(G.tor(.14 - k * .014, .033, PI * 2, 6, 20), k % 2 ? '#efdcb4' : '#f6e8c8', RX, RY, zf + .01 + (k - 1) * .042);
    add(G.cyl(.05, .05, .2, 12), FBUMP, RX, RY, zf + .01, HP, 0, 0); add(G.box(.04, .12, .05, .015), '#ffcf3a', RX + .17, RY - .02, zf + .1);
    tube([RX, RY - .15, zf + .05], [RX + .04, RY - .36, zf + .07], .03, '#f6e8c8', 6); add(G.cyl(.03, .02, .08, 10), BRASS, RX + .04, RY - .41, zf + .07);
  }));
  // the cab's glass: the wide windscreen and a window each side (you see the seats and the wheel through it)
  f.add(glassOf('firetruck7-glass', FGLASS, ({ add, addM }) => {
    add(G.pbox(.016, CY1 - .28 - GY0, CW - .16), '#ffffff', CX1 - .06, (GY0 + CY1 - .28) / 2, 0);
    const pg = new THREE.ExtrudeGeometry(outline(SWIN), { depth: .012, bevelEnabled: true, bevelThickness: .001, bevelSize: .015, bevelSegments: 1, curveSegments: 6 }); pg.translate(0, 0, -.006);
    for (const sz of [-1, 1]) addM(pg, xf(0, 0, sz * (CW / 2 - .06)), '#ffffff');
  }));
  // two roll-up lockers on the near side
  const shutters = [];
  for (const [k, x] of [[0, LOCK[0]], [1, LOCK[1]]]) {
    const sv = grp(); put(sv, x, LT, zf + .012); f.add(sv);
    sv.add(mc('firetruck7-shutter', ({ add }) => { add(G.box(.62, LT - LF, .02, .01), '#d9dee8', 0, -(LT - LF) / 2, 0); for (let i = 0; i < 6; i++) add(G.pbox(.6, .012, .008), STEEL2, 0, -.06 - i * .075, .012); add(G.box(.24, .035, .035, .012), FINK, 0, -(LT - LF) + .04, .02); }));
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
// (10/22 밤 사용자 "판자 같은 천·뭔지 모를 덩어리": the coats were yellow slabs, the helmets had square board brims, the boots were
// black blocks — now the coats hang as cloth from the hooks (folds, sleeves, a turned-up collar, reflective bands on the folds,
// a zip and a pocket flap), the helmets have a round brim and a badge, the boots a shaft, a toe and a band — all inside the old
// footprints, so the shelf gap and the spot between the boots stay as open as before
// (1.0.185 19판 봇 느려짐, 허브 10/22: the key hung at the pocket covered the middle of the coat, so the bot's look-for-a-point
// kept landing on the key — a tap there only swings it — and it turned round instead of lifting the coat. The pocket and its key
// now sit low on the coat under the waist band (the key's ring hangs .276 over its spot, stage.js swingHung), close to the
// cloth, and the middle of the coat is clear to tap)
const COAT = '#d9a441';
const coat = (add, x, y, z) => {
  const zc = clothWave(.42, .86, 2, .022);
  add(clothSlab(.42, .86, .07, zc), COAT, x, y, z);
  for (const s of [-1, 1]) add(G.cap(.065, .5, 3, 8), COAT, x + s * .245, y - .36, z + .01, 0, 0, s * .06);
  add(G.box(.3, .1, .09, .03), shade(COAT, -.25), x, y - .02, z + .01);
  for (const yy of [-.26, -.45]) add(clothSlab(.43, .045, .074, zc, yy), '#f4f4ec', x, y, z + .002);
  add(G.box(.015, .7, .012, .004), '#6b5530', x, y - .45, z + .04 + zc(0, -.45));
  add(G.box(.12, .03, .02, .008), shade(COAT, -.15), x + .15, y - .54, z + .042 + zc(.15, -.54));
};
B.gearrack = (f, T, opts = {}) => {
  const z0 = -.36;
  f.add(mc('gearrack2', ({ add }) => {
    add(G.box(1.8, 1.9, .06, .02), WOOD, 0, .95, z0 - .1);
    add(G.box(1.8, .04, .34, .01), WOODD, 0, 1.75, z0 + .06);   // the helmet shelf
    for (const [x, c] of [[-.6, RED], [0, YEL], [.6, RED]]) {
      add(G.sph(.15, 14, 10), c, x, 1.8, z0 + .06, 0, 0, 0, [1, .8, 1.1]); add(G.cyl(.18, .185, .025, 18), c, x, 1.79, z0 + .05, 0, 0, 0, [1, 1, 1.1]);
      add(G.box(.07, .08, .02, .01), '#f2d36b', x, 1.86, z0 + .2, -.3, 0, 0);
    }
    for (const x of [-.6, .6]) coat(add, x, 1.57, z0 + .02);   // the side coats on their hooks
    for (const x of [-.75, -.45, -.15, .15, .45, .75]) {   // boots
      add(G.cyl(.075, .08, .26, 12), '#2a2a36', x, .17, z0 + .08); add(G.box(.16, .07, .22, .03), '#2a2a36', x, .035, z0 + .11);
      add(G.sph(.07, 10, 7), '#2a2a36', x, .045, z0 + .17, 0, 0, 0, [1, .55, 1]); add(G.cyl(.079, .081, .035, 12), '#f2d36b', x, .22, z0 + .08);
    }
  }));
  const cv = grp(); put(cv, 0, 1.58, z0 + .04); f.add(cv);
  cv.add(mc('gearrack-coat2', ({ add }) => { coat(add, 0, -.01, 0); add(G.cyl(.02, .02, .1, 6), STEEL2, 0, .02, -.05, HP, 0, 0); }));
  // (19판 10/29 사용자 "방화복 들출 때 벤딩 좀 줘라, 다른 천들처럼" — opts.bend, 19판 새 맵만): 판자처럼 통째로 돌지 않고 아랫단부터 말려 올라감
  const p = f.part('lift', cv, opts?.bend ? clothBend(f, cv, { hinge: [0, -.02, 0], along: [0, -1, 0], toward: [0, 0, 1], len: .9, turn: 2.6, bias: 2.4, tip: .3, lag: .35, rise: .02, segs: 30 }) : t => { cv.rotation.x = -1.2 * t; }, { label: '방화복', sfx: 'swish', dur: opts?.bend ? .55 : .3 });
  f.spot('inside', null, 0, .5, z0 + .04, { part: p, maxH: .4, label: '방화복 뒤', scale: .8 });
  // (② 레벨 10/21, 19판 "인터렉션과 방탈출적인 요소"): the coat's pocket — a stage's key hangs here (clueHang) and drops behind it when
  // the coat lifts (stage.js dropHung)
  f.spot('on', cv, .15, -.84, .05, { maxH: .24, label: '방화복 주머니', scale: .8 }).hang = p;
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
// (21판 10/22, user: "소방차 경찰차 컨셉대로" — concept-policecar-1021 1번, the chubbiest): a toy SD patrol car — a white body
// rounded like a bar of soap, a tall cabin you can see into (dark seats, a dashboard, the steering wheel behind a clear
// windscreen), a navy band with a yellow line along the sides and a navy patch over the nose, fat tyres with domed grey hub
// caps under dark arches, a thick dark bumper with the POLICE plate, round headlights and orange corner lights, a blue-white-red
// light bar, round white mirrors; the boot lid lifts on a dark-lined boot with a traffic cone and a police cap in it. The
// door, its lock and the hiding spots stay where they were (21판 ②·③).
const PNAVY = '#2b3a7c', PYEL = '#ffcf3a', PGLASS = '#4f6aa8', PBUMP = '#4a4658', TYRE = '#2a2a36', HUBG = '#c9ccd8', SEAT = '#5a5668', LINE = '#3a3346', BOOT = '#6a6582';
const policePlate = () => tex('police-plate', 256, 64, (c, w, h) => {
  c.fillStyle = '#ffffff'; roundRect(c, 3, 3, w - 6, h - 6, 12); c.fill(); c.strokeStyle = PNAVY; c.lineWidth = 5; roundRect(c, 6, 6, w - 12, h - 12, 10); c.stroke();
  c.fillStyle = PNAVY; c.font = font(40); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('POLICE', w / 2, h / 2 + 2);
});
// clear glass you can see through: one merged mesh, one see-through tint (no shine stripes — #74)
const glassOf = (key, color, fn) => { const m = mc(key, fn); m.material = mat(color, { opacity: .55, rough: .1, rim: .05 }); m.castShadow = false; return m; };
// a side stripe broken where it meets a wheel arch (each arch: its middle x, its middle y and radius) — the stripe stops at
// the arch instead of running over the wheel (19판 10/22, user: "소방차는 바퀴 뚫는 것만 좀 처리해 줘. 휀다를 넣던가")
const stripeAround = (add, color, x0, x1, y, h, z, arches) => {
  const cuts = arches.map(a => { const dy = Math.max(0, y - h / 2 - a.y); const hw = dy < a.r ? Math.sqrt(a.r * a.r - dy * dy) : 0; return [a.x - hw, a.x + hw]; }).filter(c => c[1] > c[0]).sort((p, q) => p[0] - q[0]);
  let at = x0;
  for (const [c0, c1] of cuts) { if (c0 > at + .02) add(G.pbox(c0 - at, h, .012), color, (at + c0) / 2, y, z); at = Math.max(at, c1); }
  if (x1 > at + .02) add(G.pbox(x1 - at, h, .012), color, (at + x1) / 2, y, z);
};
// a wheel arch: the dark well over the wheel (in front of the body's face and its stripes) and a fender lip round its top in
// the body's colour with a darker edge inside
const wheelArch = (add, x, y, z, R, body, edge, well) => {
  add(G.cyl(R, R, .006, 26), well, x, y, z, HP, 0, 0);
  add(G.tor(R + .012, .036, PI, 6, 22), body, x, y, z + Math.sign(z) * .004, 0, 0, 0, [1, 1, .9]);
  add(G.tor(R - .012, .014, PI, 4, 22), edge, x, y, z + Math.sign(z) * .028);
};
// a fat toy wheel facing ±z: a round tyre, a grey disc, a domed hub cap and its dark middle
const toyWheel = (add, x, y, z, R, W, sz, cap = HUBG) => {
  add(G.tor(R - W * .45, W * .45, PI * 2, 10, 26), TYRE, x, y, z, 0, 0, 0, [1, 1, 1.25]);
  add(G.cyl(R - W * .45, R - W * .45, W * .9, 22), '#55536a', x, y, z, HP, 0, 0);
  add(G.sph(R * .58, 18, 10), cap, x, y, z + sz * W * .42, 0, 0, 0, [1, 1, .45]);
  add(G.sph(R * .2, 10, 8), shade(cap, -.3), x, y, z + sz * (W * .42 + R * .24), 0, 0, 0, [1, 1, .5]);
};
// v2 (19판 10/24): the well only over the tyre — a half disc from the axle up on the body's face, never under the body — and
// the fender lip round it
const wheelArch2 = (add, x, y, z, R, body, edge, well, yb) => {
  const half = new THREE.Shape(); half.moveTo(R, Math.max(0, yb - y)); half.absarc(0, 0, R, Math.asin(Math.min(1, Math.max(0, yb - y) / R)), PI - Math.asin(Math.min(1, Math.max(0, yb - y) / R)), false); half.lineTo(-R, Math.max(0, yb - y));
  add(new THREE.ShapeGeometry(half, 20), well, x, y, z, 0, z < 0 ? PI : 0, 0);
  add(G.tor(R + .012, .036, PI, 6, 22), body, x, y, z + Math.sign(z) * .02, 0, 0, 0, [1, 1, .9]);
  add(G.tor(R - .012, .014, PI, 4, 22), edge, x, y, z + Math.sign(z) * .044);
};
// v2 tyre: a fat round tyre with tread blocks on its face, a line round each sidewall; inside it a dished steel wheel (a
// cream disc set in, a darker ring, six nuts) and a low domed hub that stays inside the tyre's own width
const toyWheel2 = (add, x, y, z, R, W, sz, cap = HUBG) => {
  const r0 = R - W * .45, t = W * .45;
  add(G.tor(r0, t, PI * 2, 12, 30), TYRE, x, y, z, 0, 0, 0, [1, 1, 1.18]);
  for (let k = 0; k < 18; k++) { const a = k * PI * 2 / 18; add(G.pbox(.07, .05, W * .78), '#3a3846', x + Math.cos(a) * (R - .012), y + Math.sin(a) * (R - .012), z, 0, 0, a + HP); }
  add(G.tor(r0 + t * .45, .008, PI * 2, 4, 30), '#4a4858', x, y, z + sz * t * 1.02);
  add(G.cyl(r0 - .005, r0 - .005, W * .7, 26), '#4a4858', x, y, z, HP, 0, 0);
  add(G.cyl(r0 * .9, r0 * .82, .03, 26), cap, x, y, z + sz * W * .3, HP, 0, 0);
  add(G.tor(r0 * .88, .018, PI * 2, 5, 26), shade(cap, -.18), x, y, z + sz * W * .33);
  for (let k = 0; k < 6; k++) { const a = k * PI / 3 + .3; add(G.cyl(.016, .016, .03, 6), shade(cap, -.35), x + Math.cos(a) * r0 * .45, y + Math.sin(a) * r0 * .45, z + sz * W * .34, HP, 0, 0); }
  add(G.sph(r0 * .3, 14, 8), shade(cap, -.08), x, y, z + sz * W * .33, 0, 0, 0, [1, 1, .55]);
  add(G.cyl(.022, .022, .02, 8), shade(cap, -.4), x, y, z + sz * (W * .33 + r0 * .17), HP, 0, 0);
};
// a side profile (x along the car, y up) pushed out along z into a soft, round-edged solid of the given width, centred on z = 0
const roundSlab = (shape, width, b) => { const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(.002, width - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 10 }); g.translate(0, 0, -(width - 2 * b) / 2); return g; };
const outline = (pts, Sh = THREE.Shape) => { const sh = new Sh(); sh.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) p.length === 2 ? sh.lineTo(p[0], p[1]) : sh.quadraticCurveTo(p[0], p[1], p[2], p[3]); return sh; };
B.patrolcar = f => {
  // SD proportions (the sheet): 1.5 long in its 2×1 slot, tall — the roof at 1.12, wheels as tall as the belt is high
  const L = 1.5, Wd = .9, zf = Wd / 2, BY0 = .2, BY1 = .62, CX0 = -.5, CX1 = .3, CY1 = 1.12, CW = Wd - .06, TX = -.8, TB = -.5, WR = .23;
  const CL = CX1 - CX0, CC = (CX0 + CX1) / 2, GY0 = BY1 + .05, GY1 = CY1 - .13, GM = (GY0 + GY1) / 2, GH = GY1 - GY0, WZ = zf - .085, b = .09;
  // the body from the boot's front to the nose (drawn inset by the bevel b, which rounds it back out): a flat belt, the hood
  // easing down and over the round nose
  const body = outline([[TB + b, BY0 + b], [TB + b, BY1 - b], [CX1, BY1 - b], [CX1 + .16, BY1 - b - .01, L / 2 - .2, BY1 - b - .06], [L / 2 - b, BY1 - b - .08, L / 2 - b, BY1 - b - .2], [L / 2 - b, BY0 + b + .02], [L / 2 - b, BY0 + b, L / 2 - b - .04, BY0 + b], [TB + b, BY0 + b]]);
  // the cabin's side frames: up the back, a round roof corner, along the roof, down the leaning windscreen — two window holes
  // (the windscreen leans back ~30°, the back a little; the roof short and round at both ends — the sheet's bubble cabin)
  const WB = [CX1 + .06, BY1 - .02], WT = [CX1 - .2, CY1 - .07], SL = (WB[0] - WT[0]) / (WT[1] - WB[1]), WA = Math.atan(SL), wx = y => WB[0] - SL * (y - WB[1]);
  const side = outline([[CX0, BY1 - .02], [CX0 + .03, CY1 - .16], [CX0 + .06, CY1, CX0 + .2, CY1], [CX1 - .3, CY1], [CX1 - .23, CY1, WT[0], WT[1]], WB, [CX0, BY1 - .02]]);
  const hy0 = BY1 + .1, hy1 = CY1 - .11, hole = pts => outline(pts, THREE.Path), FX = wx(hy0) - .08, FT = wx(hy1) - .08;
  const HR = [[CX0 + .1, hy0], [-.27, hy0], [-.27, hy1], [CX0 + .1 + .1, hy1], [CX0 + .12, hy1, CX0 + .11, hy1 - .07], [CX0 + .1, hy0]];
  const HF = [[-.19, hy0], [FX, hy0], [FT + .03, hy1 - .04], [FT, hy1, FT - .06, hy1], [-.19, hy1], [-.19, hy0]];
  side.holes.push(hole(HR)); side.holes.push(hole(HF));
  // a window's glass: its hole's own outline, a hair bigger, thin (so no corner of a pane pokes out past the frame)
  const pane = pts => { const g = new THREE.ExtrudeGeometry(outline(pts), { depth: .012, bevelEnabled: true, bevelThickness: .001, bevelSize: .015, bevelSegments: 1, curveSegments: 6 }); g.translate(0, 0, -.006); return g; };
  const roof = outline([[CX0 + .04, CY1 - .16], [CX0 + .07, CY1, CX0 + .2, CY1], [CX1 - .3, CY1], [CX1 - .23, CY1, WT[0], WT[1]], [WT[0] - .06, CY1 - .1], [CX0 + .2, CY1 - .1], [CX0 + .12, CY1 - .1, CX0 + .1, CY1 - .17], [CX0 + .04, CY1 - .16]]);
  // the side frames lean in a little toward the roof (a round cabin, not a box): turned about x, pushed back out at the belt
  const TH = .08, sideM = sz => new THREE.Matrix4().makeTranslation(0, 0, sz * (CW / 2 - .03 + BY1 * Math.sin(TH))).multiply(new THREE.Matrix4().makeRotationX(-sz * TH));
  f.add(mc('patrolcar8', ({ add, addM, tube }) => {
    addM(roundSlab(body, Wd, b), xf(), WHITE);
    for (const sz of [-1, 1]) addM(roundSlab(side, .07, .025), sideM(sz), WHITE);
    addM(roundSlab(roof, CW - .14, .02), xf(), WHITE);
    // the boot behind it: a shell round a hollow (its lid lifts), rounded to match
    add(G.box(TB - TX + .06, .09, Wd, .045, 2), WHITE, (TX + TB) / 2, BY0 + .045, 0);
    for (const sz of [-1, 1]) add(G.box(TB - TX + .06, BY1 - BY0, .06, .03, 2), WHITE, (TX + TB) / 2, (BY0 + BY1) / 2, sz * (zf - .03));
    add(G.box(.08, BY1 - BY0, Wd, .04, 3), WHITE, TX + .04, (BY0 + BY1) / 2, 0);
    // the boot's dark lining (floor, sides, back, the cabin's back)
    add(G.pbox(TB - TX - .08, .008, Wd - .13), BOOT, (TX + TB) / 2 + .02, BY0 + .093, 0);
    for (const sz of [-1, 1]) add(G.pbox(TB - TX - .08, BY1 - BY0 - .1, .006), BOOT, (TX + TB) / 2 + .02, (BY0 + BY1) / 2 + .045, sz * (zf - .063));
    add(G.pbox(.006, BY1 - BY0 - .1, Wd - .13), BOOT, TX + .083, (BY0 + BY1) / 2 + .045, 0);
    add(G.pbox(.006, BY1 - BY0 - .1, Wd - .17), BOOT, TB - .004, (BY0 + BY1) / 2 + .045, 0);
    // in the boot: a traffic cone standing in the far corner, a police cap beside it
    add(G.box(.16, .02, .16, .006), '#ff6a2a', TX + .16, BY0 + .105, -.25);
    add(G.cone(.075, .25, 16), '#ff7a33', TX + .16, BY0 + .24, -.25);
    add(G.cyl(.046, .058, .045, 16), '#ffffff', TX + .16, BY0 + .23, -.25);
    add(G.cyl(.08, .064, .05, 16), PNAVY, TX + .2, BY0 + .15, -.08);
    add(G.cyl(.066, .066, .02, 16), LINE, TX + .2, BY0 + .11, -.08);
    add(G.box(.06, .008, .12, .004), LINE, TX + .27, BY0 + .106, -.08, 0, 0, -.25);
    add(G.sph(.018, 8, 6), PYEL, TX + .267, BY0 + .155, -.08, 0, 0, 0, [.5, 1, 1]);
    // inside, seen through the glass: a dashboard, two front seats with headrests, the back seat, the steering wheel
    add(G.box(.14, .11, CW - .16, .045), PBUMP, CX1 - .2, BY1 + .08, 0);
    for (const sz of [-1, 1]) {
      add(G.box(.2, .07, .24, .03), SEAT, -.03, BY1 + .06, sz * .19);
      add(G.box(.07, .25, .23, .03), SEAT, -.14, BY1 + .17, sz * .19, 0, 0, .12);
      add(G.box(.06, .07, .13, .025), SEAT, -.16, BY1 + .33, sz * .19);
    }
    add(G.box(.17, .07, CW - .18, .03), SEAT, -.36, BY1 + .06, 0);
    add(G.box(.07, .17, CW - .18, .03), SEAT, -.44, BY1 + .13, 0, 0, 0, .1);
    add(G.tor(.07, .013, PI * 2, 6, 18), LINE, CX1 - .22, BY1 + .19, -.19, 0, HP, .45);
    tube([CX1 - .16, BY1 + .12, -.19], [CX1 - .21, BY1 + .18, -.19], .012, LINE, 5);
    // the navy band and the yellow line along both sides; a navy patch over the nose edged in yellow
    for (const sz of [-1, 1]) {
      add(G.pbox(L / 2 - TX - .24, .12, .012), PNAVY, (L / 2 + TX) / 2 - .04, .5, sz * (zf + .004)); add(G.pbox(L / 2 - TX - .3, .026, .012), PYEL, (L / 2 + TX) / 2 - .07, .58, sz * (zf + .006));
    }
    add(G.box(.15, .016, Wd - .26, .006), PNAVY, CX1 + .2, BY1 - .022, 0, 0, 0, -.22);
    for (const dx of [-.085, .085]) add(G.box(.026, .018, Wd - .26, .006), PYEL, CX1 + .2 + dx, BY1 - .022 - dx * .22, 0, 0, 0, -.22);
    // fat wheels near the corners, dark arches over them
    for (const x of [.47, -.47]) for (const sz of [-1, 1]) {
      toyWheel(add, x, WR - .02, sz * WZ, WR, .22, sz);
      wheelArch(add, x, WR - .02, sz * (zf + .014), WR + .04, WHITE, '#9a9cb0', LINE);
    }
    // the bumpers: thick, dark, round-edged; orange corner lights; round red tail lights
    add(G.box(.17, .17, Wd + .04, .075, 3), PBUMP, L / 2 + .005, .27, 0); add(G.box(.17, .17, Wd + .04, .075, 3), PBUMP, TX - .03, .27, 0);
    for (const sz of [-1, 1]) {
      add(G.sph(.036, 10, 8), '#ff9a3c', L / 2 + .085, .31, sz * .38);
      add(G.cyl(.055, .055, .03, 16), '#e2403a', TX - .002, .5, sz * .31, 0, 0, HP); add(G.tor(.055, .01, PI * 2, 4, 16), PBUMP, TX - .012, .5, sz * .31, 0, HP, 0);
    }
    // big round headlights in grey rings high on the nose, a dark grille slot between
    for (const sz of [-1, 1]) { add(G.sph(.095, 16, 12), '#fff0b0', L / 2 - .01, .41, sz * .24, 0, 0, 0, [.55, 1, 1]); add(G.tor(.095, .016, PI * 2, 5, 20), STEEL2, L / 2 - .005, .41, sz * .24, 0, HP, 0); }
    add(G.box(.04, .07, .22, .03), LINE, L / 2 + .002, .34, 0);
    // round white mirrors on short stalks; the light bar across the roof (blue · white · red) on a dark base
    for (const sz of [-1, 1]) { tube([CX1 - .02, .72, sz * (CW / 2 + .01)], [CX1, .75, sz * (CW / 2 + .08)], .013, WHITE, 5); add(G.sph(.065, 12, 8), WHITE, CX1, .77, sz * (CW / 2 + .11), 0, 0, 0, [.6, 1, 1]); }
    add(G.box(.17, .05, .7, .025), PBUMP, -.06, CY1 + .02, 0);
    add(G.box(.15, .1, .23, .045), '#3f6fe8', -.06, CY1 + .09, -.22); add(G.box(.15, .09, .17, .04), '#ffffff', -.06, CY1 + .085, 0); add(G.box(.15, .1, .23, .045), '#e8433d', -.06, CY1 + .09, .22);
  }));
  // the glass: windscreen (leaning with the frame), back window, the far side's two windows and the near side's back one (the
  // near front one is the door's)
  f.add(glassOf('patrolcar8-glass', PGLASS, ({ add, addM }) => {
    add(G.pbox(.016, (hy1 - hy0) / Math.cos(WA) + .06, CW - .14), '#ffffff', (wx(hy0) + wx(hy1)) / 2 - .035, (hy0 + hy1) / 2, 0, 0, 0, WA);
    add(G.pbox(.016, .95 - hy0 + .015, CW - .14), '#ffffff', CX0 + .05, (hy0 - .015 + .95) / 2, 0);
    for (const sz of [-1, 1]) addM(pane(HR), sideM(sz), '#ffffff');
    addM(pane(HF), sideM(-1), '#ffffff');
  }));
  f.add(put(decal(.3, .075, policePlate()), L / 2 + .092, .27, 0, 0, HP, 0));
  // the boot lid: hinged at the cabin's back, it lifts up toward the front
  const tg = grp(); put(tg, TB + .01, BY1, 0); f.add(tg);
  tg.add(mc('patrolcar8-lid', ({ add }) => {
    add(G.box(TB - TX + .03, .055, Wd + .01, .027, 2), WHITE, -(TB - TX + .03) / 2, .022, 0);
    add(G.box(.05, .022, .14, .01), PBUMP, -(TB - TX) + .03, .055, 0);
  }));
  const tp = f.part('lift', tg, t => { tg.rotation.z = -1.5 * t; }, { label: '순찰차 트렁크', sfx: 'open', dur: .35 });
  f.spot('inside', null, TX + .16, BY0 + .085, .18, { part: tp, maxH: .3, label: '순찰차 트렁크 안', scale: .65 });
  // the door (front, +z side): the lower panel on the body's face with the band, its window set back in line with the glass
  const dv = grp(); put(dv, .25, .3, zf + .005); f.add(dv);
  dv.add(mc('patrolcar8-door', ({ add }) => {
    add(G.box(.35, .4, .035, .02), WHITE, -.245, .16, 0);
    add(G.pbox(.35, .12, .039), PNAVY, -.245, .2, 0); add(G.pbox(.35, .026, .043), PYEL, -.245, .28, 0);
    add(G.box(.09, .03, .03, .012), STEEL2, -.34, .3, .025);
  }));
  dv.add(glassOf('patrolcar8-doorglass', PGLASS, ({ addM }) => addM(pane(HF), new THREE.Matrix4().makeTranslation(-.25, -.3, -(zf + .005)).multiply(sideM(1)), '#ffffff')));
  const p = f.part('door', dv, t => { dv.rotation.y = 1.1 * t; }, { label: '순찰차 문', sfx: 'door', dur: .35 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: -.32, y: .26, z: .04, parent: dv };
  f.spot('inside', null, .05, .3, zf + .07, { part: p, maxH: .3, label: '순찰차 문턱', scale: .8 });   // at the open door (the body is solid: a seat inside it could never be seen)
  // (behind the light bar, on the flat of the roof)
  f.spot('on', null, -.3, CY1 + .02, -.12, { maxH: .2, label: '순찰차 지붕 위', scale: .6 });
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

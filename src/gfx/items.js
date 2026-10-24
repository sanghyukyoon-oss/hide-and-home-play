// Cute props: hide-and-seek targets, treasures, chain items (key / code note) and decoys.
// Every build() returns a Group with its origin at the bottom centre, roughly 0.3–0.45 wide.
import * as THREE from 'three';
import { createNote, noteKeyFor } from './gpt-notes.js';
import { bakeItem } from './bake.js';
import { bookPile, piecesGroup } from './bookbits.js';
import { rbox, sph, hemi, cyl, tor, cone, cap, put, grp, mat, mesh, geo, extrude, starShape, heartShape, canvasTex, disc, plane, shade } from './kit.js';
import { tr } from '../i18n.js';

const GOLD = { metal: .55, rough: .28 };
const GLOSS = { rough: .38 };

function eyesOn(g, y, z, sep = .045, r = .016) {
  g.add(put(sph(r, '#2a1d33', GLOSS, 10, 8), -sep, y, z));
  g.add(put(sph(r, '#2a1d33', GLOSS, 10, 8), sep, y, z));
}

function noteTex(code) {
  return canvasTex(256, 200, (c, w, h) => {
    c.fillStyle = '#fff7d6'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#f2c9a0'; c.lineWidth = 3;
    for (let y = 60; y < h; y += 34) { c.beginPath(); c.moveTo(14, y); c.lineTo(w - 14, y); c.stroke(); }
    c.fillStyle = '#ff6f91'; c.font = 'bold 30px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.fillText(tr('비밀번호!'), w / 2, 44);
    c.fillStyle = '#3b2a55'; c.font = 'bold 92px Ssurround, Jua, sans-serif'; c.fillText(code, w / 2, 150);
  });
}
export const LOCK_COLORS = [['#ff4f66', '빨강'], ['#ffc93c', '노랑'], ['#3fb6ff', '파랑'], ['#6fd04a', '초록'], ['#b07cff', '보라']];
function colorTex(code) {
  return canvasTex(256, 200, (c, w, h) => {
    c.fillStyle = '#eef6ff'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#5b6bb5'; c.font = 'bold 30px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.fillText(tr('색깔 순서!'), w / 2, 44);
    String(code).split('').slice(0, 3).forEach((d, i) => { c.fillStyle = LOCK_COLORS[(parseInt(d, 10) || i) % 5][0]; c.beginPath(); c.arc(w / 2 + (i - 1) * 70, 125, 28, 0, 7); c.fill(); c.strokeStyle = '#3b2a55'; c.lineWidth = 5; c.stroke(); c.fillStyle = '#3b2a55'; c.font = 'bold 24px Ssurround, Jua, sans-serif'; c.fillText(String(i + 1), w / 2 + (i - 1) * 70, 186); });
  });
}
function reportTex() {
  return canvasTex(200, 256, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#7aa7ff'; c.fillRect(0, 0, w, 46);
    c.fillStyle = '#fff'; c.font = 'bold 30px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.fillText(tr('성적표'), w / 2, 34);
    c.fillStyle = '#c9c3d9';
    for (let i = 0; i < 4; i++) { c.fillRect(20, 70 + i * 34, 90, 12); c.fillRect(130, 70 + i * 34, 44, 12); }
    c.strokeStyle = '#ff4d5e'; c.lineWidth = 9; c.beginPath(); c.arc(140, 200, 38, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#ff4d5e'; c.font = 'bold 54px Ssurround, Jua, sans-serif'; c.fillText('32', 140, 220);
  });
}
function snackTex() {
  return canvasTex(160, 200, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffb03a'); g.addColorStop(1, '#ff7a2a');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(w / 2, h / 2, 52, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8462f'; c.font = 'bold 38px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.fillText(tr('바삭'), w / 2, h / 2 + 13);
    c.fillStyle = '#fff'; c.font = 'bold 20px Ssurround, Jua, sans-serif'; c.fillText(tr('감자칩'), w / 2, 34);
  });
}

const MILK_MAT = {};
// a sock lying flat: the sock silhouette (the same outline as the shop's sock pair, which reads at a glance) with a ribbed
// cuff, two stripes, a coloured heel and toe — seen from above it is unmistakably a sock
const SOCK = (() => { const s = new THREE.Shape(); s.moveTo(-.045, .2); s.lineTo(.045, .2); s.lineTo(.045, .06); s.lineTo(.12, .06); s.quadraticCurveTo(.17, .055, .17, .005);
  s.quadraticCurveTo(.168, -.045, .12, -.045); s.lineTo(0, -.045); s.quadraticCurveTo(-.045, -.045, -.045, 0); s.lineTo(-.045, .2); return s; })();
function sockL(body, rib, tip, patch = null) {
  const S = 1.3, g = grp(), b = grp(); g.add(b); b.scale.setScalar(S); b.position.set(-.0625 * S, 0, .0775 * S);
  const sg = geo('sockL', () => new THREE.ExtrudeGeometry(SOCK, { depth: .028, bevelEnabled: true, bevelThickness: .01, bevelSize: .01, bevelSegments: 2, curveSegments: 8 }));
  b.add(put(mesh(sg, mat(body)), 0, .01, 0, -Math.PI / 2, 0, 0));
  const top = .05;
  b.add(put(rbox(.1, .006, .034, rib, .003), 0, top, -.185));
  for (const y of [.125, .155]) b.add(put(rbox(.098, .005, .014, tip, .002), 0, top, -y));
  b.add(put(sph(.036, tip, null, 12, 8), .132, top - .004, -.006, 0, 0, 0, [1, .2, 1]));   // toe
  b.add(put(sph(.032, tip, null, 12, 8), -.01, top - .004, .01, 0, 0, 0, [1, .2, 1]));    // heel
  if (patch) b.add(put(sph(.034, patch, null, 12, 8), 0, top - .002, -.075, 0, 0, 0, [1, .18, 1]));
  return g;
}
export const ITEMS = {
  donut: { name: '도넛', h: .17, build() {
    const g = grp();
    g.add(put(tor(.13, .07, '#e9b36e'), 0, .07, 0, Math.PI / 2));
    g.add(put(tor(.13, .066, '#ff7eb6', GLOSS), 0, .1, 0, Math.PI / 2, 0, 0, [1, 1, .6]));
    const cols = ['#fff', '#59d0ff', '#ffe14d', '#8b6cff', '#7be04f'];
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + .3, r = .13 + (i % 2 ? .03 : -.03); g.add(put(cap(.009, .03, cols[i % 5]), Math.cos(a) * r, .145, Math.sin(a) * r, Math.PI / 2, 0, a * 2)); }
    return g;
  } },
  candy: { name: '사탕', h: .2, build() {
    // (⑥ 10/23 밤 사용자 "사탕도 디테일 올려서": a red ball and two yellow cones) — a round sweet with a red-and-white swirl,
    // a clear wrapper over it with a shine, the wrapper twisted at both ends into pleated fans
    const g = grp(), wrap = '#ffd23f';
    const swirl = canvasTex(128, 64, (c, w, h) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#ff4f6e';
      for (let x = -h; x < w + h; x += 32) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 14, h); c.lineTo(x + 14 + h, 0); c.lineTo(x + h, 0); c.fill(); }
    });
    g.add(put(sph(.082, '#ffffff', { ...GLOSS, map: swirl }, 22, 16), 0, .1, 0, 0, 0, 0, [1.2, 1, 1]));
    g.add(put(sph(.092, '#fff6fb', { opacity: .28, rough: .1 }, 20, 14), 0, .1, 0, 0, 0, 0, [1.2, 1, 1]));
    g.add(put(sph(.02, '#ffffff', { opacity: .85 }, 8, 6), -.035, .16, .045, 0, 0, .6, [1.6, .7, .5]));
    const fan = geo('it-candy-fan', () => {
      const c = new THREE.ConeGeometry(.06, .08, 16, 1, true), p = c.attributes.position;
      for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) { const k = Math.round((Math.atan2(p.getX(i), p.getZ(i)) + Math.PI) / (Math.PI / 8)) % 2 ? .72 : 1; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
      c.computeVertexNormals(); return c;
    });
    for (const s of [-1, 1]) {
      g.add(put(cyl(.016, .022, .03, wrap, GLOSS, 12), s * .112, .1, 0, 0, 0, Math.PI / 2));
      g.add(put(tor(.018, .005, wrap, GLOSS, Math.PI * 2, 4, 12), s * .118, .1, 0, 0, Math.PI / 2, 0));
      g.add(put(mesh(fan, mat(wrap, { ...GLOSS, side: THREE.DoubleSide })), s * .162, .1, 0, 0, 0, s * Math.PI / 2));
    }
    return g;
  } },
  cookie: { name: '쿠키', h: .07, flat: true, build() {
    // two chocolate-chip cookies, the top one leaning off the bottom one: golden dough, a darker baked rim, big chips
    // (10/20 "야매한 것들": one flat orange disc)
    const g = grp(), dough = '#ecb86e', edge = '#cf8f4a', chip = '#5a3420';
    const CH = [[.3, .2], [-.38, .32], [.05, -.42], [-.22, -.15], [.48, -.18], [.12, .52], [-.52, -.22]];
    const one = (x, y, z, r, rz, rx, n) => {
      const c = grp();
      c.add(put(cyl(r, r * .97, .03, dough, null, 18), 0, .015, 0));
      c.add(put(tor(r * .97, .012, edge, null, Math.PI * 2, 5, 18), 0, .015, 0, Math.PI / 2));
      CH.slice(0, n).forEach(([fx, fz]) => c.add(put(sph(.017, chip, null, 6, 4), fx * r, .03, fz * r, 0, 0, 0, [1, .55, 1])));
      c.position.set(x, y, z); c.rotation.set(rx, 0, rz); return c;
    };
    g.add(one(-.035, 0, .025, .13, 0, 0, 7));
    g.add(one(.05, .031, -.04, .1, -.09, .05, 5));
    return g;
  } },
  console: { name: '게임기', h: .08, flat: true, build() {
    const g = grp();
    g.add(put(rbox(.3, .045, .18, '#f4f3fb', .02), 0, .023, 0));
    g.add(put(rbox(.2, .01, .13, '#2c2f4a', .004, { emissive: '#4a6cff', ei: .35, rough: .3 }), 0, .047, 0));
    g.add(put(rbox(.08, .05, .18, '#ff4f5e', .025, GLOSS), -.185, .025, 0));
    g.add(put(rbox(.08, .05, .18, '#3fb6ff', .025, GLOSS), .185, .025, 0));
    g.add(put(sph(.016, '#2a1d33', null, 8, 6), -.19, .05, -.03));
    [[.17, .03], [.2, .0], [.17, -.03], [.14, 0]].forEach(([x, z]) => g.add(put(sph(.011, '#ffffff', null, 8, 6), x, .05, z)));
    return g;
  } },
  teddy: { name: '곰인형', h: .38, build() {
    const g = grp(), c = '#c98a52', l = '#f4d7b0';
    g.add(put(sph(.12, c), 0, .12, 0, 0, 0, 0, [1, .95, .9]));
    g.add(put(sph(.07, l), 0, .12, .07, 0, 0, 0, [1, 1, .5]));
    g.add(put(sph(.1, c), 0, .29, 0));
    g.add(put(sph(.04, c), -.075, .37, 0)); g.add(put(sph(.04, c), .075, .37, 0));
    g.add(put(sph(.02, '#f09aa8'), -.075, .37, .025)); g.add(put(sph(.02, '#f09aa8'), .075, .37, .025));
    g.add(put(sph(.04, l), 0, .27, .08, 0, 0, 0, [1.1, .8, .8]));
    g.add(put(sph(.014, '#2a1d33', GLOSS), 0, .285, .115));
    eyesOn(g, .31, .085, .04, .013);
    g.add(put(sph(.045, c), -.12, .15, .02)); g.add(put(sph(.045, c), .12, .15, .02));
    g.add(put(sph(.05, c), -.06, .03, .06)); g.add(put(sph(.05, c), .06, .03, .06));
    g.add(put(tor(.035, .012, '#ff5d8a'), 0, .21, .07, Math.PI / 2.4));
    return g;
  } },
  duck: { name: '오리', h: .3, build() {
    const g = grp(), y = '#ffd84a';
    g.add(put(sph(.12, y, GLOSS), 0, .1, 0, 0, 0, 0, [1.25, .85, 1]));
    g.add(put(sph(.08, y, GLOSS), 0, .22, .05));
    g.add(put(cone(.035, .07, '#ff8a2a', GLOSS), 0, .21, .13, Math.PI / 2));
    g.add(put(cone(.05, .09, y, GLOSS), 0, .14, -.15, -Math.PI / 2.6));
    eyesOn(g, .24, .115, .035, .012);
    return g;
  } },
  // 양말: an L lying on the floor — ribbed cuff, stripes up the leg, a coloured heel and toe — so it reads as a sock from
  // above (user, 10/17: "양말인지 몰랐음"; it used to be a tube with a cap on the end)
  // 숨은 친구 (사건 판, 10/17): not a thing — the marker of where the room's owner is hiding; never drawn, never collected
  friendtoken: { name: '숨은 친구', h: .04, flat: true, noThumb: true, noCollect: true, build() { const g = grp(), m = sph(.02, '#ffffff'); m.visible = false; g.add(put(m, 0, .02, 0)); return g; } },
  // 로봇청소기 리모컨 / 빨래건조대 손잡이 (아파트 장치판): tools for the chain, never collected
  vacremote: { name: '청소기 리모컨', h: .05, flat: true, noCollect: true, build() {
    const g = grp();
    g.add(put(rbox(.09, .025, .17, '#ffffff', .012), 0, .0125, 0));
    g.add(put(cyl(.026, .026, .012, '#7fd6c0', null, 18), 0, .03, -.035));
    g.add(put(cyl(.012, .012, .01, '#ff6b6b', null, 12), -.022, .03, .035)); g.add(put(cyl(.012, .012, .01, '#ffc23d', null, 12), .022, .03, .035));
    g.add(put(rbox(.03, .006, .01, '#5b5672', .002), 0, .028, -.07));
    return g;
  } },
  // (39판 카페 지하 냉동 창고 ② 10/23: the freezer door's missing handle — a chrome bar on two posts)
  fzhandle: { name: '냉동 창고 핸들', h: .06, flat: true, noCollect: true, build() {
    const g = grp();
    g.add(put(mesh(geo('fzhandlebar', () => new THREE.CylinderGeometry(.018, .018, .24, 12)), mat('#d8e2ec', GLOSS)), 0, .045, 0, 0, 0, Math.PI / 2));
    for (const sx of [-1, 1]) g.add(put(mesh(geo('fzhandlepost', () => new THREE.CylinderGeometry(.014, .016, .05, 10)), mat('#9aa6b4', GLOSS)), sx * .1, .02, 0));
    g.add(put(mesh(geo('fzhandlegrip', () => new THREE.CylinderGeometry(.022, .022, .1, 12)), mat('#4f86c6', { rough: .5 })), 0, .045, 0, 0, 0, Math.PI / 2));
    return g;
  } },
  // (9판 ② 10/23: the wall light switch is on the list — its thumbnail; the switch itself is the wall decor, furniture.js B.lightswitch)
  lightswitch: { name: '전등 스위치', h: .3, noCollect: true, build() {   // (upright, so its icon reads as a switch, not a note)
    const g = grp();
    g.add(put(rbox(.2, .28, .03, '#fbf7ef', .02), 0, .14, 0));
    g.add(put(rbox(.11, .17, .035, '#ffffff', .014), 0, .14, .03, -.22, 0, 0));
    g.add(put(rbox(.08, .07, .01, '#ff8fa8', .008), 0, .1, .052, -.22, 0, 0));
    for (const sy of [-1, 1]) g.add(put(sph(.012, '#9aa3b2'), 0, .14 + sy * .11, .02));
    return g;
  } },
  // (24판 스케이트 파크 ② 10/23: the drinking fountain's hose — a green coil and a brass nozzle; 25판 next door has a crank handle)
  skbhose: { name: '호스', h: .07, flat: true, noCollect: true, build() {
    const g = grp();
    for (const [y, r] of [[.012, .085], [.03, .078], [.048, .07]]) g.add(put(tor(r, .014, '#4fae6a', GLOSS, Math.PI * 2, 8, 22), 0, y, 0, Math.PI / 2, 0, 0));
    g.add(put(cyl(.016, .016, .09, '#4fae6a', GLOSS, 10), .1, .02, .03, 0, 0, Math.PI / 2));
    g.add(put(cyl(.012, .02, .05, '#e0b45c', GOLD, 10), .16, .02, .03, 0, 0, Math.PI / 2));
    return g;
  } },
  crank: { name: '건조대 손잡이', h: .06, flat: true, noCollect: true, build() {
    const g = grp();
    g.add(put(cyl(.012, .012, .16, '#a9b2c8', null, 10), 0, .015, 0, Math.PI / 2, 0, 0));
    g.add(put(rbox(.14, .024, .024, '#a9b2c8', .008), .06, .015, .08));
    g.add(put(cyl(.022, .022, .07, '#ff6b6b', null, 12), .12, .045, .08));
    return g;
  } },
  // 빠진 그림책 (비밀 서재): the missing book of the rainbow shelf — a fat red cloth book, its spine a rainbow slice
  spinebook: { name: '빠진 그림책', h: .1, noCollect: true, build() {
    const g = grp(), W = .2, T = .07, D = .15;
    g.add(put(rbox(W, T, D, '#c0504d', .012), 0, T / 2, 0));
    g.add(put(rbox(W - .016, T - .016, D - .004, '#fff6e2', .004), .01, T / 2, 0));   // pages
    ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'].forEach((c, k) => g.add(put(rbox(.012, T - .012, .028, c, .003), -W / 2 - .002, T / 2, -.06 + k * .024)));
    g.add(put(rbox(.012, .012, D - .01, '#ffd43b', .003), -W / 2 - .003, T - .008, 0));
    return g;
  } },
  // (12판 비밀 서재 ② 10/23, user: "파란 구슬도 찾게 해서 무지개 풀고 찾은 구슬 쓰게 해서 열리게"): the marble the run above the cupboard
  // is missing — the same glossy blue as the one that rolls (gfx/showcase-props.js)
  bluemarble: { name: '파란 구슬', h: .12, noCollect: true, build() {
    const g = grp();
    g.add(put(mesh(geo('bluemarble', () => new THREE.SphereGeometry(.06, 18, 14)), mat('#3d8bff', { rough: .2, emissive: '#3d8bff', ei: .25 })), 0, .06, 0));
    g.add(put(mesh(geo('bluemarbleswirl', () => new THREE.TorusGeometry(.0605, .007, 6, 24)), mat('#cfe6ff', GLOSS)), 0, .06, 0, .7, .3, 0));
    g.add(put(sph(.014, '#ffffff'), -.022, .088, .03));
    return g;
  } },
  sock: { name: '양말', h: .06, flat: true, build() { return sockL('#7fd3ff', '#ffffff', '#ff7eb6'); } },
  // 짝 양말 (the laundromat's pair puzzle): the same sock in four clearly different looks, picked by opts.code 0–3
  sockp: { name: '짝 양말', h: .06, flat: true, build(o = {}) {
    const P = [['#ff9ec2', '#ffffff', '#ff5a7a'], ['#8fd3f4', '#ffd23f', '#3f86e0'], ['#9be38f', '#ffffff', '#45b86b'], ['#c9a7ff', '#ffb37a', '#8a5fd6']][(+o.code || 0) % 4];
    return sockL(P[0], P[1], P[2], P[2]);   // the patch on the leg is the pattern you match
  } },
  star: { name: '별', h: .3, build() {
    const g = grp();
    g.add(put(extrude('star', starShape(.15, .07), .04, '#ffd23f', { emissive: '#ffb300', ei: .25, rough: .35 }), 0, .15, 0));
    eyesOn(g, .16, .045, .04, .014);
    return g;
  } },
  // 우유: a gable-top carton that can't be mistaken for a box (user, 10/17: "우유도") — cow spots on the side, a blue
  // "우유/MILK" label with a milk drop on the front, the sealed fin on top and a striped straw
  milk: { name: '우유', h: .32, build() {
    const g = grp(), W = .15, H = .19;
    g.add(put(rbox(W, H, W, '#ffffff', .012), 0, H / 2, 0));
    for (const sz of [-1, 1]) g.add(put(rbox(W, .012, .108, '#f4f8ff', .004), 0, H + .036, sz * .036, sz * .78, 0, 0));   // the two roof slopes
    g.add(put(rbox(W + .006, .04, .014, '#ffffff', .004), 0, H + .085, 0));   // the sealed fin
    g.add(put(rbox(W + .004, .022, W + .004, '#3f8ff0', .006), 0, H - .011, 0));   // blue band under the roof
    const lab = mesh(geo('milk-label', () => new THREE.PlaneGeometry(.12, .13)), MILK_MAT.m || (MILK_MAT.m = new THREE.MeshBasicMaterial({ map: canvasTex(128, 140, (c, w, h) => {
      c.fillStyle = '#3f8ff0'; c.beginPath(); c.roundRect(4, 4, w - 8, h - 8, 18); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(64, 18); c.quadraticCurveTo(92, 58, 64, 70); c.quadraticCurveTo(36, 58, 64, 18); c.fill();
      c.font = 'bold 34px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const t = tr('우유'); c.font = `bold ${t.length > 2 ? 30 : 38}px Ssurround, Jua, sans-serif`; c.fillText(t, 64, 104);
    }) })));   // one label texture for every carton
    g.add(put(lab, 0, .085, W / 2 + .002));
    for (const [x, y, r, sx] of [[-.03, .13, .028, 1.2], [.035, .06, .022, 1], [-.04, .04, .018, .9]]) g.add(put(sph(r, '#2a2433', null, 12, 8), W / 2 + .002, y, x, 0, 0, 0, [.18, 1, sx]));   // cow spots
    for (const [x, y, r] of [[.04, .14, .022], [-.035, .06, .02]]) g.add(put(sph(r, '#2a2433', null, 12, 8), x, y, -W / 2 - .002, 0, 0, 0, [1, 1, .18]));
    g.add(put(cyl(.007, .007, .14, '#ff6f91', null, 8), .04, H + .1, .03, 0, 0, -.15));   // the straw
    g.add(put(cyl(.0075, .0075, .02, '#ffffff', null, 8), .046, H + .13, .03, 0, 0, -.15));
    return g;
  } },
  apple: { name: '사과', h: .26, build() {
    const g = grp();
    g.add(put(sph(.11, '#ff4d5e', GLOSS), 0, .1, 0, 0, 0, 0, [1, .9, 1]));
    g.add(put(cyl(.01, .012, .06, '#6b4226'), 0, .22, 0, 0, 0, .2));
    g.add(put(sph(.04, '#6fd04a'), .04, .23, 0, 0, 0, .6, [1.4, .4, .8]));
    g.add(put(sph(.025, '#ffffff', { opacity: .5 }), -.05, .15, .07));
    return g;
  } },
  crown: { name: '왕관', h: .2, build() {
    // a gold band with five flat points (each with a ball on top), red velvet inside, a ruby in front and two side gems
    // (10/20 "야매한 것들": the round cones read as party hats)
    const g = grp(), m = '#ffc93c', R = .115, dk = shade(m, -.14);
    g.add(put(cyl(R + .005, R, .075, m, GOLD, 24), 0, .0375, 0));
    g.add(put(sph(.105, '#e8455a', null, 16, 8), 0, .07, 0, 0, 0, 0, [1, .55, 1]));
    g.add(put(tor(R + .006, .009, dk, GOLD, Math.PI * 2, 4, 28), 0, .009, 0, Math.PI / 2));
    g.add(put(tor(R + .006, .007, dk, GOLD, Math.PI * 2, 4, 28), 0, .072, 0, Math.PI / 2));
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a);
      g.add(put(cone(.05, .1, m, GOLD, 4), dx * (R - .002), .124, dz * (R - .002), 0, a, 0, [1, 1, .35]));
      g.add(put(sph(.017, m, GOLD, 10, 8), dx * (R - .002), .18, dz * (R - .002)));
    }
    [['#ff4d6d', 0, .026], ['#3fb6ff', 1.26, .018], ['#4fd08a', -1.26, .018]].forEach(([c, a, r]) => g.add(put(sph(r, c, GLOSS, 12, 8), Math.sin(a) * (R + .006), .04, Math.cos(a) * (R + .006), 0, a, 0, [1, 1, .5])));
    return g;
  } },
  gift: { name: '선물', h: .3, build() {
    const g = grp();
    g.add(put(rbox(.22, .2, .22, '#ff9ec7', .03), 0, .1, 0));
    g.add(put(rbox(.05, .205, .226, '#ffe14d', .01), 0, .1, 0));
    g.add(put(rbox(.226, .205, .05, '#ffe14d', .01), 0, .1, 0));
    g.add(put(tor(.045, .018, '#ffe14d', GLOSS), -.04, .225, 0, 0, 0, .6));
    g.add(put(tor(.045, .018, '#ffe14d', GLOSS), .04, .225, 0, 0, 0, -.6));
    return g;
  } },
  icecream: { name: '아이스크림', h: .38, build() {
    const g = grp();
    g.add(put(cone(.07, .2, '#e8b06a'), 0, .1, 0, Math.PI));
    g.add(put(sph(.08, '#ff9ec7', GLOSS), 0, .22, 0));
    g.add(put(sph(.072, '#8ff0c8', GLOSS), 0, .32, 0));
    g.add(put(sph(.02, '#ff4d5e', GLOSS), 0, .4, 0));
    return g;
  } },
  cupcake: { name: '컵케이크', h: .3, build() {
    const g = grp();
    g.add(put(cyl(.1, .075, .1, '#8fd6ff', null, 14), 0, .05, 0));
    g.add(put(sph(.1, '#fff1f6'), 0, .12, 0, 0, 0, 0, [1, .55, 1]));
    g.add(put(sph(.075, '#ffb3d1'), 0, .17, 0, 0, 0, 0, [1, .6, 1]));
    g.add(put(sph(.05, '#ff8fbd'), 0, .21, 0, 0, 0, 0, [1, .7, 1]));
    g.add(put(sph(.028, '#ff3d5a', GLOSS), 0, .25, 0));
    return g;
  } },
  glasses: { name: '안경', h: .12, build() {
    // round glasses with sky-blue lenses you can see (and a shine on each), a thicker frame and an arched bridge
    // (10/20 "야매한 것들": the pale lenses vanished, leaving two thin rings)
    const g = grp(), c = '#3b2a55', y = .069;
    for (const s of [-1, 1]) {
      g.add(put(tor(.052, .014, c, GLOSS, Math.PI * 2, 6, 22), s * .07, y, 0));
      g.add(put(cyl(.05, .05, .006, '#8fd0ff', { opacity: .5, rough: .1 }, 20), s * .07, y, 0, Math.PI / 2, 0, 0));
      g.add(put(sph(.012, '#ffffff', null, 6, 4), s * .07 - .02, y + .022, .006, 0, 0, .6, [1, 1.8, .4]));
      g.add(put(rbox(.012, .014, .17, c, .005), s * .124, y + .01, -.085));
      g.add(put(rbox(.012, .03, .014, c, .005), s * .124, y - .002, -.168));
    }
    g.add(put(tor(.02, .009, c, GLOSS, Math.PI, 4, 10), 0, y + .01, 0));
    return g;
  } },
  ball: { name: '공', h: .24, build() {
    const g = grp(), cols = ['#ff4d5e', '#ffffff', '#3fb6ff', '#ffffff', '#ffd84a', '#ffffff'];
    for (let i = 0; i < 6; i++) g.add(put(mesh(geo('ballseg' + i, () => new THREE.SphereGeometry(.12, 8, 14, i / 6 * Math.PI * 2, Math.PI / 3)), mat(cols[i], GLOSS)), 0, .12, 0));
    return g;
  } },
  pencil: { name: '연필', h: .07, flat: true, build() {
    const g = grp();
    g.add(put(cyl(.03, .03, .26, '#ffd23f', null, 6), 0, .03, 0, 0, 0, Math.PI / 2));
    g.add(put(cone(.03, .07, '#f4c48c', null, 6), .165, .03, 0, 0, 0, -Math.PI / 2));
    g.add(put(cone(.011, .025, '#3b2a55', null, 6), .19, .03, 0, 0, 0, -Math.PI / 2));
    g.add(put(cyl(.032, .032, .03, '#c9c9d9', GOLD, 12), -.145, .03, 0, 0, 0, Math.PI / 2));
    g.add(put(cyl(.03, .03, .04, '#ff8fb8', null, 12), -.18, .03, 0, 0, 0, Math.PI / 2));
    return g;
  } },
  heart: { name: '하트', h: .26, build() {
    // a plump glossy heart with a face like the star's — eyes, a smile, pink cheeks — and a shine (10/20 "야매한 것들": a bare
    // extrusion; its fine bevel was also 1.9k corners)
    const g = grp(), c = '#ff5d8a', ink = '#2a1d33';
    const hg = geo('heart-item2', () => new THREE.ExtrudeGeometry(heartShape(.13), { depth: .05, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2, curveSegments: 7 }).center());
    g.add(put(mesh(hg, mat(c, { rough: .35 })), 0, .13, 0));
    eyesOn(g, .15, .047, .045, .015);
    g.add(put(tor(.018, .005, ink, null, Math.PI, 4, 10), 0, .128, .047, 0, 0, Math.PI));
    for (const s of [-1, 1]) g.add(put(sph(.022, '#ffb3c8', null, 10, 6), s * .078, .12, .044, 0, 0, 0, [1, .6, .35]));
    g.add(put(sph(.022, '#ffffff', null, 8, 6), -.07, .19, .042, 0, 0, .5, [1.4, .8, .4]));
    return g;
  } },
  // ── 새 찾을 것 10종 (10/20, 1~20판 물건 반복 줄이기 — 레벨 세션 목록): each a few big pieces, one accent colour, held to
  // its shape (height ÷ longest side) so it fits where it is hidden; the ink line comes from toonpost
  // 토끼 귀 머리띠 (1·2판, 베개·이불 밑): the band lies flat, open toward you, two floppy ears at its crown
  bunnyband: { name: '토끼 귀 머리띠', h: .04, flat: true, build() {
    const g = grp(), pk = '#ff8fb8', R = .12, z0 = .04;
    g.add(put(tor(R, .015, pk, GLOSS, Math.PI * 1.2, 8, 26), 0, .015, z0, -Math.PI / 2, 0, -Math.PI * .1));
    for (const s of [-1, 1]) {
      const a = Math.PI / 2 + s * .3, dx = Math.cos(a), dz = -Math.sin(a), ry = Math.atan2(dx, dz);
      g.add(put(sph(.05, '#ffffff', null, 14, 8), dx * (R + .07), .018, z0 + dz * (R + .07), 0, ry, 0, [.62, .36, 1.6]));
      g.add(put(sph(.05, '#ffc2d8', null, 12, 6), dx * (R + .075), .026, z0 + dz * (R + .075), 0, ry, 0, [.34, .26, 1.2]));
    }
    return g;
  } },
  // 스노우볼 (4·7판, 선반·책장 칸): a glass ball with a little winter scene in it (user, 10/20 실폰: "생김새가 별로" — it read as a
  // flat white dome with a green horn on a red puck). The ball's inside is painted sky blue (its back faces), so the whole ball
  // reads and gets its ink line; a clear front with one glint; snow on the floor, a snowman in a red scarf, a fir tree and a few
  // flakes; a two-step wooden stand with one red band (kept wide: the shape stays ≤ .7 for the shelves)
  snowglobe: { name: '스노우볼', h: .26, build() {
    const g = grp(), wood = '#b77a45', R = .122, cy = .128, ink = '#2a2433';
    g.add(put(cyl(.185, .185, .032, shade(wood, -.08), null, 24), 0, .016, 0));
    g.add(put(cyl(.13, .15, .04, wood, null, 22), 0, .052, 0));
    g.add(put(cyl(.141, .146, .016, '#ff4f5e', null, 22), 0, .058, 0));
    g.add(put(sph(R, '#a8dcff', { side: THREE.BackSide }, 18, 12), 0, cy, 0));
    g.add(put(sph(.11, '#ffffff', null, 16, 6), 0, .076, 0, 0, 0, 0, [1, .28, 1]));
    g.add(put(sph(.03, '#ffffff', null, 10, 8), .035, .11, .035)); g.add(put(sph(.022, '#ffffff', null, 10, 8), .035, .15, .035));
    g.add(put(cyl(.016, .016, .02, ink, null, 10), .035, .177, .035)); g.add(put(cyl(.026, .026, .005, ink, null, 12), .035, .167, .035));
    g.add(put(tor(.021, .007, '#ff4f5e', null, Math.PI * 2, 4, 12), .035, .13, .035, Math.PI / 2));
    g.add(put(cone(.008, .026, '#ff9a2a', null, 6), .035, .15, .066, Math.PI / 2));
    g.add(put(cone(.042, .11, '#2f9e5f', null, 10), -.045, .14, -.02));
    for (const [x, y, z] of [[-.06, .2, .04], [.05, .21, -.03], [-.005, .222, .05], [.075, .17, -.05], [-.075, .13, .05]]) g.add(put(sph(.008, '#ffffff', null, 6, 4), x, y, z));
    // the glass: sky blue and half see-through, so it reads as a glass ball and the scene still shows (user 10/20 "투명도를 줄여 줘 봐": .2 → .3, A of .3/.45/.6)
    g.add(put(sph(R + .005, '#8fd0ff', { opacity: .3, rough: .1 }, 18, 12), 0, cy, 0));   // (clear of the blue inside by more than deFlush's 1.5 mm, or it reads them as one flush face)
    g.add(put(sph(.026, '#ffffff', { opacity: .9 }, 8, 6), -.058, .2, .068, 0, 0, .7, [1, 1.7, .45]));
    return g;
  } },
  // 꿀단지 (5·6판, 찬장·조리대): a squat brown pot, golden honey running over the lip, a dipper resting on the rim
  honeypot: { name: '꿀단지', h: .26, build() {
    const g = grp(), pot = '#d4864a', honey = '#ffbf1f';
    g.add(put(sph(.15, pot, null, 18, 12), 0, .093, 0, 0, 0, 0, [1, .62, 1]));
    g.add(put(cyl(.085, .1, .05, pot, null, 18), 0, .18, 0));
    g.add(put(tor(.088, .016, shade(pot, -.12), null, Math.PI * 2, 6, 20), 0, .205, 0, Math.PI / 2));
    g.add(put(cyl(.08, .08, .012, honey, GLOSS, 18), 0, .204, 0));
    for (const a of [.5, 1.9, 3.3, 4.6]) g.add(put(sph(.017, honey, GLOSS, 8, 6), Math.cos(a) * .099, .18, Math.sin(a) * .099, 0, 0, 0, [1, 2.1, 1]));
    g.add(put(cyl(.011, .011, .22, '#c99a5a', null, 8), .075, .205, 0, 0, 0, -1.27));
    g.add(put(sph(.02, '#c99a5a', null, 10, 8), .182, .238, 0));
    return g;
  } },
  // 비누 (9판, 욕조 가장자리·세면대): a lavender bar with a heart pressed in, three bubbles at its corner. Modelled near a real
  // soap's size: every thing is drawn up to ~34 cm on its longest side but at most 2.4× its own size, so this one stops short
  // of the others the way a soap is smaller (user 10/21 실폰 9판: "비누 왜 이렇게 크냐?" — it was 30 cm, drawn 38–41 cm)
  soap: { name: '비누', h: .04, flat: true, build() {
    const g = grp(), c = '#c3a6ff', S = 1.36;   // (S 1.36: 12.5 cm here, ~30 cm drawn)
    g.add(put(rbox(.092 * S, .024 * S, .058 * S, c, .009 * S), 0, .012 * S, 0));
    const hg = geo('soapheart|' + S, () => new THREE.ExtrudeGeometry(heartShape(.016 * S), { depth: .004 * S, bevelEnabled: false, curveSegments: 5 }).center());   // (2 mm proud of the bar or more: closer, deFlush lifts it 6 mm)
    g.add(put(mesh(hg, mat(shade(c, .14))), -.009 * S, .024 * S, .003 * S, -Math.PI / 2, 0, 0));
    for (const [x, z, r] of [[.03, -.015, .008], [.039, -.004, .006], [.022, -.025, .005]]) g.add(put(sph(r * S, '#ffffff', GLOSS, 10, 8), x * S, .022 * S, z * S));
    return g;
  } },
  // 메달 (10판, 진열장·서랍): a gold medal lying flat, a star on its face, a red-and-white ribbon in a V
  medal: { name: '메달', h: .04, flat: true, build() {
    const g = grp(), gold = '#ffc93c', zc = .07;
    g.add(put(cyl(.09, .09, .022, gold, GOLD, 24), 0, .011, zc));
    g.add(put(cyl(.07, .07, .006, shade(gold, -.1), GOLD, 24), 0, .023, zc));
    g.add(put(extrude('medalstar', starShape(.05, .022), .008, '#fff0a0', GOLD), 0, .03, zc, -Math.PI / 2, 0, 0));
    for (const s of [-1, 1]) {
      const ry = -s * .28, cx = s * Math.sin(.28) * .1, cz = -.1;
      g.add(put(rbox(.056, .008, .2, '#ff4f5e', .003), cx, .005 + (s > 0 ? .002 : 0), cz, 0, ry, 0));
      g.add(put(rbox(.016, .009, .2, '#ffffff', .002), cx, .006 + (s > 0 ? .002 : 0), cz, 0, ry, 0));
    }
    g.add(put(tor(.016, .006, gold, GOLD, Math.PI * 2, 6, 14), 0, .012, -.022, Math.PI / 2));
    return g;
  } },
  // 방울 공 (11판, 캣타워·바구니): a see-through cat toy — three pink rings round a gold bell — and its pompom tail
  bellball: { name: '방울 공', h: .2, build() {
    // a cat's jingle ball: a pink ball with white stripes, and a big gold bell (slit, loop) tied to it with a red bow
    // (10/20 "야매한 것들": the ring cage read as a pink flower)
    const g = grp(), pk = '#ff6fae', gold = '#ffc93c', red = '#ff4f5e', R = .09, bx = -.06, ex = .13;
    g.add(put(sph(R, pk, GLOSS, 18, 12), bx, R, 0));
    for (const t of [.6, -.6]) g.add(put(tor(R * .99, .009, '#ffffff', null, Math.PI * 2, 4, 26), bx, R, 0, Math.PI / 2 + t));   // (two stripes crossing at the sides; tilted, so neither dips under the floor)
    g.add(put(sph(.048, gold, GOLD, 14, 10), ex, .048, .02));
    g.add(put(rbox(.056, .008, .02, '#5a3a1a', .003), ex, .03, .061, -.5, 0, 0));
    g.add(put(tor(.014, .005, gold, GOLD, Math.PI * 2, 4, 12), ex, .1, .02));
    g.add(put(cyl(.006, .006, .09, red, null, 6), .075, .1, .02, 0, 0, Math.PI / 2));
    for (const s of [-1, 1]) g.add(put(sph(.02, red, null, 8, 6), ex + s * .024, .112, .02, 0, 0, -s * .5, [1.3, .75, .5]));
    return g;
  } },
  // 경찰 모자 (14·21판, 책상·사물함): a navy peaked cap — dark band, gold cord and star badge, a shiny black visor
  policecap: { name: '경찰 모자', h: .145, build() {
    const g = grp(), navy = '#2f4fa0', dk = '#1f2a44', gold = '#ffc93c';
    g.add(put(cyl(.115, .112, .065, dk, null, 22), 0, .0325, 0));
    g.add(put(cyl(.16, .12, .05, navy, null, 22), 0, .088, -.01, -.12, 0, 0));
    g.add(put(cyl(.115, .115, .012, '#1a1a24', GLOSS, 22), 0, .026, .072, .22, 0, 0, [1, 1, .75]));
    g.add(put(tor(.118, .006, gold, GOLD, Math.PI * .6, 4, 12), 0, .05, 0, Math.PI / 2, 0, Math.PI * .2));
    g.add(put(extrude('copstar', starShape(.036, .016), .01, gold, GOLD), 0, .082, .135, -.12, 0, 0));
    return g;
  } },
  // 크레파스 상자 (16판, 책상 서랍·사물함): an open sky-blue box, a row of rainbow crayons lying inside
  crayons: { name: '크레파스 상자', h: .08, flat: true, build() {
    const g = grp(), box = '#3fb6ff';
    g.add(put(rbox(.32, .05, .2, box, .012), 0, .025, 0));
    g.add(put(rbox(.3, .012, .18, '#fff6dc', .004), 0, .046, 0));
    g.add(put(rbox(.2, .026, .006, '#ffffff', .003), 0, .026, .1));
    ['#ff4d5e', '#ff9a2a', '#ffd84a', '#6fd04a', '#2f7fe0', '#8b6cff', '#ff7eb6'].forEach((c, i) => {
      const z = -.075 + i * .025;
      g.add(put(cyl(.0115, .0115, .24, c, null, 8), -.012, .064, z, 0, 0, Math.PI / 2));
      g.add(put(cone(.0115, .03, c, null, 8), .123, .064, z, 0, 0, -Math.PI / 2));
    });
    return g;
  } },
  // 소방관 헬멧 (19판, 선반·차 옆): a red dome on a brim that runs long at the back, a crest over the top, a gold shield
  firehelmet: { name: '소방관 헬멧', h: .15, build() {
    // a red dome on a brim that runs long at the back (dark rubber edge), a yellow reflective band, a tall crest over the top
    // and a big gold shield with a white star (10/20 "야매한 것들": it read as a red blob)
    const g = grp(), red = '#ff4b4b', gold = '#ffc93c';
    g.add(put(cyl(.15, .15, .016, red, GLOSS, 26), 0, .008, -.035, 0, 0, 0, [1, 1, 1.25]));
    g.add(put(tor(.15, .009, '#2a2433', null, Math.PI * 2, 4, 32), 0, .009, -.035, Math.PI / 2, 0, 0, [1, 1.25, 1]));
    g.add(put(hemi(.11, red, GLOSS), 0, .012, -.01, 0, 0, 0, [1, 1.08, 1.15]));
    g.add(put(tor(.111, .01, '#ffd23f', null, Math.PI * 2, 4, 28), 0, .032, -.01, Math.PI / 2, 0, 0, [1, 1.15, 1]));
    g.add(put(tor(.113, .014, shade(red, -.16), GLOSS, Math.PI, 6, 16), 0, .012, -.01, 0, Math.PI / 2, 0, [1, 1.08, 1.15]));
    g.add(put(rbox(.09, .1, .016, gold, .015, GOLD), 0, .088, .118, -.38, 0, 0));
    g.add(put(extrude('helmstar', starShape(.024, .011), .006, '#ffffff'), 0, .09, .128, -.38, 0, 0));
    return g;
  } },
  // 낚시 찌 (3판, 그물망·덤불): a bright float lying on its side — red over white (never the reel's junk), a yellow antenna, a dark keel stem
  bobber: { name: '낚시 찌', h: .11, build() {
    const g = grp(), y = .055;
    g.add(put(sph(.055, '#ff3b46', GLOSS, 16, 10), .045, y, 0, 0, 0, 0, [1.6, 1, 1]));
    g.add(put(sph(.055, '#ffffff', GLOSS, 16, 10), -.045, y, 0, 0, 0, 0, [1.6, 1, 1]));
    g.add(put(tor(.048, .006, '#2a1d33', null, Math.PI * 2, 6, 20), 0, y, 0, 0, Math.PI / 2, 0));
    // (① 모델 품질 10/22: the antenna and tail were half its length and the float a speck — both shorter, thicker)
    g.add(put(cyl(.011, .011, .06, '#ffe14d', null, 8), .158, y, 0, 0, 0, Math.PI / 2));
    g.add(put(sph(.016, '#ff4f5e', GLOSS, 8, 6), .19, y, 0));
    g.add(put(cyl(.009, .009, .04, '#2a1d33', null, 6), -.148, y, 0, 0, 0, Math.PI / 2));
    return g;
  } },
  // 밀짚모자 (3판 기차역, 벤치·짐 가방 — 레벨 세션 추가 부탁): a wide straw brim, a round crown, a red ribbon round it
  strawhat: { name: '밀짚모자', h: .13, build() {
    const g = grp(), straw = '#f2cf7a';
    g.add(put(cyl(.17, .17, .014, straw, null, 28), 0, .018, 0, .06, 0, 0));
    g.add(put(cyl(.09, .1, .07, straw, null, 22), 0, .045, 0));
    g.add(put(sph(.09, straw, null, 18, 8), 0, .08, 0, 0, 0, 0, [1, .32, 1]));
    g.add(put(cyl(.102, .102, .026, '#ff4f5e', null, 22), 0, .028, 0));
    g.add(put(sph(.022, '#ff4f5e', null, 10, 8), .085, .03, .055, 0, 0, 0, [1, .8, .5]));
    return g;
  } },
  // ── treasures (my room)
  snack: { name: '과자', h: .27, build() {
    const g = grp();
    const t = snackTex();
    g.add(put(rbox(.2, .25, .07, '#ff8f2e', .035), 0, .125, 0));
    g.add(put(plane(.17, .21, mat('#ffffff', { map: t, rough: .6 })), 0, .125, .037));
    g.add(put(rbox(.21, .02, .05, '#ffd23f', .008), 0, .245, 0));
    return g;
  } },
  report: { name: '성적표', h: .03, flat: true, build() {
    const g = grp();
    g.add(put(rbox(.2, .012, .26, '#ffffff', .004), 0, .006, 0));
    g.add(put(plane(.19, .25, mat('#ffffff', { map: reportTex(), rough: .7 })), 0, .0125, 0, -Math.PI / 2));
    return g;
  } },
  // ── chain items
  // (31판 사용자 10/24 "열쇠는 왜이럼": 노란 도넛 + 분홍 공으로만 읽힘 → 진짜 열쇠 — 하트 구멍 뚫린 도톰한 머리, 목 고리 둘, 몸통, 톱니 난 날.
  // 크기·자리는 그대로: 머리 가운데 x -.1(걸린 열쇠가 매달리는 점, stage.js swingHung), 날 끝 x .11, 톱니는 +z, 두께 y .006~.034)
  key: { name: '열쇠', h: .06, flat: true, special: 'key', build() {
    const g = grp(), m = '#ffc93c', dk = '#e3a52c';
    g.add(put(mesh(geo('key2-bow', () => {
      const s = new THREE.Shape(); s.absarc(-.1, 0, .058, 0, Math.PI * 2, false);
      const h = new THREE.Path(), pts = heartShape(.03).getPoints(10);
      pts.forEach(({ x, y }, i) => { const u = -.1 - (y - .006), v = x; i ? h.lineTo(u, v) : h.moveTo(u, v); }); s.holes.push(h);
      const e = new THREE.ExtrudeGeometry(s, { depth: .018, bevelEnabled: true, bevelThickness: .005, bevelSize: .006, bevelSegments: 2, curveSegments: 16 });
      e.rotateX(Math.PI / 2); e.translate(0, .029, 0); return e;
    }), mat(m, GOLD)), 0, 0, 0));
    for (const x of [-.046, -.03]) g.add(put(cyl(.021, .021, .01, dk, GOLD, 14), x, .02, 0, 0, 0, Math.PI / 2));
    g.add(put(cyl(.014, .014, .15, m, GOLD, 12), .025, .02, 0, 0, 0, Math.PI / 2));
    g.add(put(sph(.0145, m, GOLD, 12, 8), .1, .02, 0));
    g.add(put(mesh(geo('key2-bit', () => {
      const s = new THREE.Shape(), P = [[.044, .004], [.044, .056], [.058, .056], [.058, .04], [.07, .04], [.07, .052], [.082, .052], [.082, .034], [.094, .034], [.094, .047], [.11, .047], [.11, .004]];
      P.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
      const e = new THREE.ExtrudeGeometry(s, { depth: .01, bevelEnabled: true, bevelThickness: .003, bevelSize: .002, bevelSegments: 1 });
      e.rotateX(Math.PI / 2); e.translate(0, .025, 0); return e;
    }), mat(m, GOLD)), 0, 0, 0));
    return g;
  } },
  // (③ 10/22, GPT 3-n notes, user: "쪽지 … 접혀 있는 게 나을 것 같은데", "삼각은 좀 이상하고 3가지 다양하게"): one of GPT's
  // folded notes (letter · memo · card, picked by the code — the same paper opens in noteview3d.js), lying folded, about a hand
  // across; nothing written shows
  note: { name: '쪽지', h: .03, flat: true, special: 'code', build(opts = {}) {
    const n = createNote(noteKeyFor(opts.code || '000')), g = grp(); n.unfold(0);
    const b = new THREE.Box3().setFromObject(n.group), sz = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) || 1, k = .2 / sz;
    n.group.scale.setScalar(k); n.group.position.y = .004; g.add(n.group);
    return g;
  } },
  notepiece: { name: '쪽지 조각', h: .02, flat: true, special: 'code', build(opts = {}) {
    const g = grp(), code = opts.code || '000', k = opts.piece ?? 0;
    const shown = code.split('').map((d, i) => i === k ? d : '?').join('');
    // a ragged scrap: a smaller sheet with a torn (zig-zag) right edge
    g.add(put(rbox(.17, .01, .17, '#fff7d6', .003), -.02, .005, 0));
    for (let i = 0; i < 4; i++) g.add(put(rbox(.03, .01, .035, '#fff7d6', .002), .075, .005, -.06 + i * .04, 0, .5, 0));
    g.add(put(plane(.16, .16, mat('#ffffff', { map: noteTex(shown), rough: .7 })), -.02, .0105, 0, -Math.PI / 2));
    return g;
  } },
  colornote: { name: '색깔 단서', h: .02, flat: true, special: 'color', build(opts = {}) {
    const g = grp();
    g.add(put(rbox(.24, .01, .19, '#eef6ff', .003), 0, .005, 0));
    g.add(put(plane(.23, .18, mat('#ffffff', { map: colorTex(opts.code || '012'), rough: .7 })), 0, .0105, 0, -Math.PI / 2));
    g.add(put(sph(.016, '#3fb6ff', GLOSS), .09, .02, -.07));
    return g;
  } },
  // ── decoys / clutter (never targets)
  mug: { name: '머그컵', h: .14, decoy: true, build(o = {}) {
    // (사용자 메모 10/24 28판 "컵이랑 선그란스? 이것도 디테일 잡아줘"): a rounded rim with the cream inside and the coffee in it, a little
    // foot ring, a thick round handle on two joints, a band and a heart on the side
    const g = grp(), c = o.color || '#9be7c4', cD = shade(c, -.14);
    g.add(put(cyl(.06, .054, .118, c, null, 22), 0, .061, 0));
    g.add(put(cyl(.052, .052, .008, cD, null, 20), 0, .004, 0));
    g.add(put(tor(.057, .007, shade(c, .1), null, Math.PI * 2, 8, 26), 0, .12, 0, Math.PI / 2, 0, 0));
    g.add(put(cyl(.052, .052, .006, '#fffaf1', null, 20), 0, .116, 0));
    g.add(put(cyl(.046, .046, .006, '#8a5a3c', null, 20), 0, .109, 0));
    g.add(put(cyl(.0605, .057, .018, '#fffaf1', null, 22, true), 0, .05, 0));
    g.add(put(tor(.034, .013, c, null, Math.PI * 1.25, 8, 18), .066, .064, 0, 0, 0, -Math.PI * .62));
    for (const y of [.096, .036]) g.add(put(sph(.012, cD, null, 10, 8), .061, y, 0));
    const h = put(sph(.016, '#ff7f9e', null, 12, 10), 0, .078, .057); h.scale.set(1, .85, .35); g.add(h);
    return g;
  } },
  // 책: a little stack with cream page edges and a ribbon bookmark, so it reads as books, not erasers
  books: { name: '책', h: .12, decoy: true, build(o = {}) {
    // (⑥ 10/23 사용자 메모 6·9판 "텍스쳐 좀 써서 재밌고 흥미롭게": spines with a title band, page lines, a sticker or a star on the
    // cover, a ribbon — gfx/bookbits.js, shared with the desk's books)
    const cols = ['#8b6cff', '#ff8fb8', '#59d0ff', '#ffb340'], v = o.v || 0;
    const g = grp(); g.add(piecesGroup(bookPile(3, cols, v, { w: .24, d: .17, t: .04 }), (geom, c) => mesh(geom, mat(c))));
    return g;
  } },
  // 블록: a toy brick with four studs on top
  block: { name: '블록', h: .15, decoy: true, build(o = {}) {
    const cols = ['#ff6f7d', '#59c3ff', '#7be04f', '#ffd23f'], c = cols[(o.v || 0) % 4];
    const g = grp(), b = grp(); g.add(b); b.rotation.y = (o.v || 0) * .4;
    b.add(put(rbox(.16, .1, .16, c, .018), 0, .05, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(put(cyl(.026, .026, .03, c, null, 14), sx * .04, .115, sz * .04));
    return g;
  } },
  pot: { name: '화분', h: .22, decoy: true, build() {
    const g = grp();
    g.add(put(cyl(.07, .055, .1, '#ff9b73', null, 14), 0, .05, 0));
    g.add(put(sph(.07, '#7cd67a'), 0, .14, 0)); g.add(put(sph(.05, '#5fbf62'), .04, .18, .02)); g.add(put(sph(.045, '#8fe08a'), -.04, .17, -.02));
    return g;
  } },
  // 털실: wound strands all round, a loose end trailing, two knitting needles stuck in
  yarn: { name: '털실', h: .2, decoy: true, build(o = {}) {
    const g = grp(), c = ['#c9a7ff', '#ffb3c7', '#a7e3ff'][(o.v || 0) % 3], d = shade(c, -.14);
    g.add(put(sph(.08, c), 0, .08, 0));
    [[.5, .3], [-.6, 1.2], [1.3, -.4], [.1, 2.0], [-1.1, .7]].forEach(([a, b]) => g.add(put(tor(.081, .007, d), 0, .08, 0, a, b)));
    g.add(put(tor(.05, .008, c, null, Math.PI * .9), .07, .012, .07, Math.PI / 2, 0, .6));   // the loose end on the floor
    for (const [x, z, r] of [[-.03, .02, .5], [.02, -.03, -.4]]) { g.add(put(cyl(.007, .007, .2, '#e8c48e', null, 6), x, .15, z, r, 0, r * .6)); }
    return g;
  } },
};

export const TARGET_POOL = ['donut', 'candy', 'cookie', 'console', 'teddy', 'duck', 'star', 'milk', 'apple', 'crown', 'gift', 'icecream', 'cupcake', 'glasses', 'ball', 'pencil', 'heart'];   // (no sock: laundromat only, 10/18)
export const DECOY_POOL = ['mug', 'books', 'block', 'pot', 'yarn'];
export const TREASURES = ['console', 'snack', 'report'];

export function buildItem(type, opts = {}) {
  const def = ITEMS[type];
  const g = bakeItem(def.build(opts), type + '|' + JSON.stringify(opts));
  g.userData.itemType = type;
  const s = opts.scale ?? 1;
  g.scale.setScalar(s);
  return g;
}

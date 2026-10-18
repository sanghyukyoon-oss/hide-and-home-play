// Cute props: hide-and-seek targets, treasures, chain items (key / code note) and decoys.
// Every build() returns a Group with its origin at the bottom centre, roughly 0.3–0.45 wide.
import * as THREE from 'three';
import { bakeItem } from './bake.js';
import { rbox, sph, cyl, tor, cone, cap, put, grp, mat, mesh, geo, extrude, starShape, heartShape, canvasTex, disc, plane, shade } from './kit.js';
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
    const g = grp();
    g.add(put(sph(.1, '#ff5d8a', GLOSS), 0, .1, 0));
    g.add(put(tor(.1, .02, '#ffffff', GLOSS), 0, .1, 0, 0, Math.PI / 2, 0));
    g.add(put(cone(.07, .1, '#ffd84a', GLOSS), .15, .1, 0, 0, 0, Math.PI / 2));
    g.add(put(cone(.07, .1, '#ffd84a', GLOSS), -.15, .1, 0, 0, 0, -Math.PI / 2));
    return g;
  } },
  cookie: { name: '쿠키', h: .07, flat: true, build() {
    const g = grp();
    g.add(put(cyl(.15, .15, .06, '#e3a35f'), 0, .03, 0));
    [[.05, .03], [-.06, .05], [.02, -.07], [-.04, -.04], [.08, -.02]].forEach(([x, z]) => g.add(put(sph(.022, '#5a3420', null, 8, 6), x, .062, z, 0, 0, 0, [1, .6, 1])));
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
    const g = grp(), m = '#ffc93c';
    g.add(put(cyl(.12, .11, .08, m, { ...GOLD, side: THREE.DoubleSide }, 24, true), 0, .04, 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(put(cone(.035, .09, m, GOLD, 10), Math.cos(a) * .115, .12, Math.sin(a) * .115)); g.add(put(sph(.018, m, GOLD, 10, 8), Math.cos(a) * .115, .17, Math.sin(a) * .115)); }
    [['#ff4d5e', 0], ['#3fb6ff', 2.1], ['#7be04f', 4.2]].forEach(([c, a]) => g.add(put(sph(.022, c, GLOSS, 10, 8), Math.cos(a) * .12, .045, Math.sin(a) * .12)));
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
    const g = grp(), c = '#3b2a55';
    g.add(put(tor(.055, .012, c, GLOSS), -.07, .06, 0));
    g.add(put(tor(.055, .012, c, GLOSS), .07, .06, 0));
    g.add(put(disc(.05, '#bfe8ff', { opacity: .45 }), -.07, .06, .001));
    g.add(put(disc(.05, '#bfe8ff', { opacity: .45 }), .07, .06, .001));
    g.add(put(cyl(.008, .008, .04, c), 0, .07, 0, 0, 0, Math.PI / 2));
    g.add(put(rbox(.01, .012, .17, c, .004), -.125, .07, -.085));
    g.add(put(rbox(.01, .012, .17, c, .004), .125, .07, -.085));
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
    const g = grp();
    g.add(put(extrude('heart', heartShape(.13), .05, '#ff5d8a', { rough: .35 }), 0, .13, 0, 0, 0, 0));
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
  key: { name: '열쇠', h: .06, flat: true, special: 'key', build() {
    const g = grp(), m = '#ffc93c';
    g.add(put(tor(.05, .018, m, GOLD), -.1, .02, 0, Math.PI / 2));
    g.add(put(cyl(.016, .016, .17, m, GOLD, 10), .02, .02, 0, 0, 0, Math.PI / 2));
    g.add(put(rbox(.025, .02, .05, m, .005, GOLD), .07, .02, .03));
    g.add(put(rbox(.025, .02, .04, m, .005, GOLD), .1, .02, .025));
    g.add(put(sph(.02, '#ff5d8a', GLOSS), -.1, .02, 0));
    return g;
  } },
  note: { name: '쪽지', h: .02, flat: true, special: 'code', build(opts = {}) {
    const g = grp();
    g.add(put(rbox(.24, .01, .19, '#fff7d6', .003), 0, .005, 0));
    g.add(put(plane(.23, .18, mat('#ffffff', { map: noteTex(opts.code || '000'), rough: .7 })), 0, .0105, 0, -Math.PI / 2));
    g.add(put(sph(.016, '#ff5d8a', GLOSS), .09, .02, -.07));
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
    const g = grp(), c = o.color || '#9be7c4';
    g.add(put(cyl(.06, .055, .12, c, null, 16), 0, .06, 0));
    g.add(put(tor(.035, .012, c), .065, .065, 0));
    return g;
  } },
  // 책: a little stack with cream page edges and a ribbon bookmark, so it reads as books, not erasers
  books: { name: '책', h: .12, decoy: true, build(o = {}) {
    const g = grp(), cols = ['#8b6cff', '#ff8fb8', '#59d0ff', '#ffb340'], v = o.v || 0;
    [[.24, .045, .17, 0, .1], [.21, .04, .155, .045, -.15], [.19, .036, .14, .085, .25]].forEach(([w, t, d, y, r], k) => {
      const c = cols[(v + k) % 4];
      g.add(put(rbox(w, t, d, c, .008), 0, y + t / 2, 0, 0, r));
      g.add(put(rbox(w - .02, t - .012, d - .006, '#fff6e2', .004), .012 * Math.cos(r), y + t / 2, -.012 * Math.sin(r), 0, r));   // pages
      if (k === 2) g.add(put(rbox(.012, .004, .05, '#ff5a7a', .002), -.04, y + t + .002, d / 2 + .01, 0, r));   // bookmark
    });
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

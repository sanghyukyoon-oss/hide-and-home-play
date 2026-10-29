// 곰돌이의 몽글 미술관 (2026-10-17, user: "가끔 앨범커버? 유명한 오마주해서 넣어도 괜찮을거같기도… 대놓고 베끼면 안되겠지만").
// Homage, not copies: four public-domain masterpieces redrawn here from scratch as their composition only, with this town's
// own characters in them — a great wave with mochi rowers (Hokusai, 1831), a swirling starry night over 몽글 마을 (van Gogh,
// 1889), 몽나리자 (Leonardo, c.1503) and 토순이 with a pearl earring (Vermeer, c.1665). All drawn on canvases in code.
// A painting swings out from the wall (something may be tucked behind it); a draped piece can be unveiled; a crate with a
// lid; an easel; the guide desk's drawer; a bench; velvet ropes; the Thinker as a bronze 몽글이.
import * as THREE from 'three';
import { put, grp, mat, mesh, geo, canvasTex, texCache, holeFace, liner } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
const GOLD = '#d9a94a', GOLD2 = '#a8782e', INK = '#2a1d33', BRONZE = '#7a6a52', BRONZE2 = '#9a8664', MARBLE = '#f3efe8';
const B = {};
// (②b 10/29 사용자 "1~18판은 완벽하니 건들지 말고 19부터" — ⑩ outdoor.js와 같은 문): the reworked models below only from 19판
// (scenes/stage.js puts the stage number in globalThis.__sbkStage); 1~18판 and scenes outside a stage keep the old ones
const late19 = () => (globalThis.__sbkStage ?? -1) >= 18;

// ── the paintings (drawn once, cached) ──────────────────────────────────────────────────────────────────────────────
const TEX = texCache();   // cached per scene generation (kit.js purgeGeo)
const tex = (key, w, h, draw) => TEX.get(key, () => canvasTex(w, h, draw));
const mochi = (c, x, y, r, body = '#fff6ee', ear = '#ffcfae', look = 0) => {   // a little round 몽글이 face
  c.fillStyle = ear; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * r * .78, y - r * .35, r * .32, r * .42, s * .5, 0, 7); c.fill(); }
  c.fillStyle = body; c.beginPath(); c.ellipse(x, y, r, r * .9, 0, 0, 7); c.fill();
  c.fillStyle = INK; for (const s of [-1, 1]) { c.beginPath(); c.arc(x + s * r * .32 + look * r * .15, y - r * .05, r * .1, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(255,140,160,.55)'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * r * .55, y + r * .22, r * .16, r * .1, 0, 0, 7); c.fill(); }
};
// (10/26 사용자 "스테이지10에서 그림이 보이면 좋겠음 안에 숨은그림찾기 그림이"): the wall's 별밤 shows the very picture the
// hidden-picture game opens (arthunt.js, GPT's bg.jpg) — the drawn one stays until it loads; 1024 wide is plenty on a wall
const gptStars = t => {
  if (t.userData.gpt) return t; t.userData.gpt = true;
  const im = new Image();
  im.onload = () => { const c = document.createElement('canvas'); c.width = 1024; c.height = 640; c.getContext('2d').drawImage(im, 0, 0, 1024, 640); t.image = c; t.dispose(); t.needsUpdate = true; };   // (dispose: a new size can't reuse the old GPU storage)
  im.src = 'art/museum/arthunt/bg.jpg';
  return t;
};
const PAINT = {
  // 몽글 파도: a great clawed wave over three boats of mochi rowers, a small snowy mountain far off
  wave: () => tex('wave', 640, 400, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#efe0bf'); g.addColorStop(1, '#e6d3ad'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(160,140,110,.25)'; for (let k = 0; k < 18; k++) { c.beginPath(); c.ellipse(80 + k * 33, 40 + (k % 4) * 9, 30, 6, 0, 0, 7); c.fill(); }   // clouds
    // the mountain
    c.fillStyle = '#566a98'; c.beginPath(); c.moveTo(360, 318); c.lineTo(420, 252); c.lineTo(484, 318); c.fill();
    c.fillStyle = '#fbf7ee'; c.beginPath(); c.moveTo(402, 272); c.lineTo(420, 252); c.lineTo(440, 274); c.lineTo(430, 270); c.lineTo(421, 278); c.lineTo(411, 269); c.fill();
    // the sea and a small wave
    c.fillStyle = '#284c86'; c.fillRect(0, 318, w, h - 318);
    const crest = (x0, y0, s, deep, light) => {
      c.fillStyle = deep; c.beginPath(); c.moveTo(x0, h); c.bezierCurveTo(x0 + 10 * s, y0 + 120 * s, x0 + 40 * s, y0 + 10 * s, x0 + 150 * s, y0);
      c.bezierCurveTo(x0 + 230 * s, y0 - 6 * s, x0 + 270 * s, y0 + 40 * s, x0 + 250 * s, y0 + 70 * s); c.bezierCurveTo(x0 + 220 * s, y0 + 40 * s, x0 + 180 * s, y0 + 60 * s, x0 + 170 * s, y0 + 110 * s);
      c.bezierCurveTo(x0 + 160 * s, y0 + 180 * s, x0 + 230 * s, h - 40, x0 + 300 * s, h); c.fill();
      c.strokeStyle = light; c.lineWidth = 7 * s; c.lineCap = 'round';
      for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(x0 + 20 * s + k * 18 * s, h); c.bezierCurveTo(x0 + 30 * s + k * 16 * s, y0 + 110 * s, x0 + 60 * s + k * 12 * s, y0 + 30 * s + k * 10 * s, x0 + 150 * s, y0 + k * 14 * s); c.stroke(); }
      // the foam claws along the crest
      c.fillStyle = '#fbf7ee';
      for (let k = 0; k < 12; k++) { const t = k / 11, x = x0 + (150 + 100 * t) * s, y = y0 + (-4 + 70 * t * t) * s; c.beginPath(); c.arc(x, y, (7 - t * 3) * s, 0, 7); c.fill();
        c.beginPath(); c.moveTo(x - 4 * s, y + 2 * s); c.lineTo(x + 2 * s, y + 14 * s); c.lineTo(x + 6 * s, y + 3 * s); c.fill(); }
      for (let k = 0; k < 26; k++) { c.beginPath(); c.arc(x0 + (120 + Math.random() * 170) * s, y0 - (10 + Math.random() * 40) * s, (1.5 + Math.random() * 3) * s, 0, 7); c.fill(); }   // spray
    };
    crest(-30, 110, 1.15, '#1f3f7a', '#4f7fc0');
    crest(330, 300, .38, '#2a5290', '#6f9bd4');
    // boats with mochi rowers
    for (const [x, y, n] of [[150, 352, 4], [330, 372, 3], [470, 340, 3]]) {
      c.fillStyle = '#f2e6c8'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 70, y); c.quadraticCurveTo(x, y + 26, x + 70, y - 6); c.lineTo(x + 66, y + 4); c.quadraticCurveTo(x, y + 30, x - 66, y + 8); c.closePath(); c.fill(); c.stroke();
      for (let k = 0; k < n; k++) mochi(c, x - 40 + k * 26, y - 2, 9);
    }
    c.fillStyle = '#f6eedc'; c.fillRect(22, 22, 70, 30); c.strokeStyle = '#9a8a6a'; c.lineWidth = 2; c.strokeRect(22, 22, 70, 30);   // the cartouche
    c.fillStyle = '#c4473a'; c.fillRect(100, 26, 16, 16);
  }),
  // 별이 빛나는 몽글 마을: swirling sky, eleven stars, a crescent moon, a dark cypress, a sleeping village with a pink roof
  stars: () => gptStars(tex('stars', 640, 400, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b2f7a'); g.addColorStop(.7, '#2c4ea6'); g.addColorStop(1, '#22397e'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.lineCap = 'round';
    const swirl = (cx, cy, r0, turns, col, lw) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (let a = 0; a < turns * PI * 2; a += .08) { const r = r0 * (1 - a / (turns * PI * 2 + 1)); const x = cx + Math.cos(a) * r * 1.6, y = cy + Math.sin(a) * r * .7; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
    swirl(300, 150, 90, 1.6, '#8fb3ee', 7); swirl(300, 150, 70, 1.4, '#cfe0ff', 4); swirl(190, 120, 50, 1.2, '#6f9be0', 6);
    for (let k = 0; k < 60; k++) { const x = (k * 97) % w, y = 20 + (k * 53) % 230, a = (k * 1.7) % PI; c.strokeStyle = ['#4f78c8', '#6f9be0', '#9fc0f2'][k % 3]; c.lineWidth = 5; c.beginPath(); c.arc(x, y, 14, a, a + 1.4); c.stroke(); }
    for (const [x, y, r] of [[70, 60, 11], [150, 40, 9], [240, 70, 10], [400, 50, 12], [470, 120, 10], [110, 160, 9], [380, 200, 8], [230, 210, 9], [520, 190, 8], [30, 130, 8], [300, 30, 7]]) {
      c.strokeStyle = 'rgba(255,240,160,.55)'; c.lineWidth = 4; for (const rr of [r * 1.8, r * 2.5]) { c.beginPath(); c.arc(x, y, rr, 0, 7); c.stroke(); }
      c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(x - r * .3, y - r * .3, r * .4, 0, 7); c.fill();
    }
    c.fillStyle = '#ffb238'; c.beginPath(); c.arc(570, 60, 30, 0, 7); c.fill(); c.fillStyle = '#20357f'; c.beginPath(); c.arc(582, 52, 27, 0, 7); c.fill();   // crescent
    c.strokeStyle = 'rgba(255,200,90,.6)'; c.lineWidth = 5; c.beginPath(); c.arc(570, 60, 42, 0, 7); c.stroke();
    // hills and the village
    c.fillStyle = '#2b3f7a'; c.beginPath(); c.moveTo(0, 300); c.bezierCurveTo(160, 250, 360, 290, 640, 260); c.lineTo(640, 400); c.lineTo(0, 400); c.fill();
    c.fillStyle = '#1f2f5e'; c.beginPath(); c.moveTo(0, 340); c.bezierCurveTo(200, 310, 420, 345, 640, 320); c.lineTo(640, 400); c.lineTo(0, 400); c.fill();
    for (let k = 0; k < 9; k++) {
      const x = 170 + k * 46, y = 330 + (k % 3) * 10, pink = k === 4;
      c.fillStyle = pink ? '#ffe8f0' : '#3a4f86'; c.fillRect(x, y - 18, 30, 22);
      c.fillStyle = pink ? '#ff6f9a' : '#283a6e'; c.beginPath(); c.moveTo(x - 4, y - 18); c.lineTo(x + 15, y - 34); c.lineTo(x + 34, y - 18); c.fill();
      c.fillStyle = '#ffd84a'; c.fillRect(x + 6, y - 12, 6, 6); if (k % 2) c.fillRect(x + 18, y - 12, 6, 6);
    }
    // the cypress
    c.fillStyle = '#16301f'; c.beginPath(); c.moveTo(70, 400); for (let k = 0; k <= 14; k++) { const t = k / 14; c.lineTo(70 + Math.sin(k * 1.7) * 14 - t * 10 - 26 * (1 - t), 400 - t * 320); } for (let k = 14; k >= 0; k--) { const t = k / 14; c.lineTo(70 + Math.cos(k * 1.3) * 14 + t * 6 + 26 * (1 - t), 400 - t * 320); } c.fill();
    c.strokeStyle = '#2d5a3a'; c.lineWidth = 4; for (let k = 0; k < 12; k++) { c.beginPath(); c.arc(70 + (k % 2 ? 8 : -8), 380 - k * 25, 12, 3.6, 5.4); c.stroke(); }
  })),
  // 몽나리자: a mochi in a dark dress, paws folded, a veil, the faint smile, a hazy road and hills behind
  lisa: () => tex('lisa', 360, 480, (c, w, h) => {
    let g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#6f7c58'); g.addColorStop(.55, '#a59a6c'); g.addColorStop(1, '#5d4c32'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(120,150,140,.6)'; c.beginPath(); c.moveTo(0, 200); c.bezierCurveTo(60, 150, 120, 190, 180, 170); c.bezierCurveTo(240, 150, 300, 190, 360, 160); c.lineTo(360, 260); c.lineTo(0, 260); c.fill();
    c.strokeStyle = '#c8b07a'; c.lineWidth = 6; c.beginPath(); c.moveTo(20, 300); c.bezierCurveTo(60, 260, 30, 230, 70, 210); c.stroke();
    c.beginPath(); c.moveTo(340, 280); c.bezierCurveTo(300, 250, 330, 230, 300, 205); c.stroke();
    // the dress and folded paws
    c.fillStyle = '#2c2a24'; c.beginPath(); c.moveTo(70, 480); c.bezierCurveTo(80, 330, 120, 300, 180, 296); c.bezierCurveTo(240, 300, 280, 330, 290, 480); c.fill();
    c.fillStyle = '#5a4630'; c.beginPath(); c.ellipse(180, 316, 42, 16, 0, 0, PI); c.fill();   // neckline
    c.fillStyle = '#f4e4cc'; c.beginPath(); c.ellipse(150, 430, 34, 20, -.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(198, 422, 34, 20, -.1, 0, 7); c.fill();
    // head, veil, the smile
    c.fillStyle = 'rgba(30,25,20,.75)'; c.beginPath(); c.ellipse(180, 210, 96, 104, 0, PI, 0); c.fill();
    c.fillStyle = '#ffcfae'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(180 + s * 70, 196, 20, 30, s * .4, 0, 7); c.fill(); }
    c.fillStyle = '#fbeedd'; c.beginPath(); c.ellipse(180, 222, 78, 72, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(40,30,20,.45)'; c.beginPath(); c.ellipse(180, 170, 86, 40, 0, PI, 0); c.fill();   // veil edge over the brow
    c.fillStyle = INK; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(180 + s * 26 + 6, 218, 6, 7, 0, 0, 7); c.fill(); }
    c.strokeStyle = '#7a4a3a'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(166, 252); c.quadraticCurveTo(182, 258, 198, 249); c.stroke();
    c.fillStyle = 'rgba(255,150,150,.3)'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(180 + s * 44, 244, 13, 8, 0, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(140,110,40,.16)'; c.fillRect(0, 0, w, h);   // old varnish
  }),
  // 진주 귀걸이를 한 토순이: a bunny looking over her shoulder, blue turban (her ears poke out of it), yellow cloth, the pearl
  pearl: () => tex('pearl', 360, 480, (c, w, h) => {
    const g = c.createRadialGradient(150, 200, 40, 180, 240, 300); g.addColorStop(0, '#2a2620'); g.addColorStop(1, '#0f0d0b'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#b8893a'; c.beginPath(); c.moveTo(60, 480); c.bezierCurveTo(80, 380, 150, 350, 220, 360); c.bezierCurveTo(290, 370, 320, 420, 330, 480); c.fill();
    c.fillStyle = '#f2efe6'; c.beginPath(); c.moveTo(130, 370); c.quadraticCurveTo(180, 400, 230, 368); c.lineTo(222, 392); c.quadraticCurveTo(180, 418, 138, 392); c.fill();
    c.fillStyle = '#e8c25a'; c.beginPath(); c.moveTo(225, 150); c.bezierCurveTo(275, 190, 270, 280, 250, 330); c.lineTo(220, 320); c.bezierCurveTo(240, 260, 230, 200, 205, 170); c.fill();   // cloth
    c.fillStyle = '#ffb3cd'; c.strokeStyle = '#f6e3ea'; c.lineWidth = 8;   // ears out of the turban
    for (const [x, a] of [[150, -.35], [200, .25]]) { c.save(); c.translate(x, 110); c.rotate(a); c.beginPath(); c.ellipse(0, -46, 18, 50, 0, 0, 7); c.fillStyle = '#ffe6f0'; c.fill(); c.fillStyle = '#ffb3cd'; c.beginPath(); c.ellipse(0, -44, 9, 36, 0, 0, 7); c.fill(); c.restore(); }
    c.fillStyle = '#ffe6f0'; c.beginPath(); c.ellipse(175, 240, 82, 86, -.1, 0, 7); c.fill();
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(222, 250, 40, 80, -.1, -HP, HP); c.fill();   // light from the left
    c.fillStyle = '#2f5aa8'; c.beginPath(); c.ellipse(170, 168, 86, 50, -.12, PI * .95, PI * 2.05); c.fill(); c.fillRect(90, 160, 160, 26);
    c.strokeStyle = '#4f7ac8'; c.lineWidth = 6; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(170, 200 + k * 2, 60 + k * 12, 3.6, 5.6); c.stroke(); }
    c.fillStyle = INK; c.beginPath(); c.ellipse(145, 240, 13, 15, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(198, 238, 11, 14, 0, 0, 7); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(140, 234, 4.5, 0, 7); c.fill(); c.beginPath(); c.arc(194, 233, 4, 0, 7); c.fill();
    c.fillStyle = '#e8708a'; c.beginPath(); c.ellipse(166, 284, 9, 6, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,140,160,.4)'; c.beginPath(); c.ellipse(118, 270, 16, 10, 0, 0, 7); c.fill();
    const pg = c.createRadialGradient(240, 300, 2, 244, 304, 16); pg.addColorStop(0, '#ffffff'); pg.addColorStop(.4, '#dfe3ea'); pg.addColorStop(1, '#7d8494');   // the pearl
    c.fillStyle = pg; c.beginPath(); c.arc(244, 304, 15, 0, 7); c.fill();
  }),
};
const ART_MAT = {};
const artMat = key => ART_MAT[key] || (ART_MAT[key] = new THREE.MeshBasicMaterial({ map: PAINT[key](), color: '#f1ebe1' }));

// a gilt frame (W×H outer) with the painting in it and a brass plaque; the whole thing hinges at its top and swings out
function painting(f, key, W, H, Y, label, spotLabel) {
  f.add(mc('artnail', ({ add }) => add(G.cyl(.015, .015, .02, 8), '#8f97b2', 0, Y + H / 2 + .02, .01, HP, 0, 0)));
  // hinged on its left edge: it swings out like a cabinet door and the niche behind is in plain view
  const hinge = grp(); put(hinge, -W / 2, 0, .03); f.add(hinge);
  const pv = grp(); put(pv, W / 2, Y + H / 2, 0); hinge.add(pv);
  const T = .09;
  pv.add(mc('artframe|' + W + 'x' + H, ({ add }) => {
    const s = new THREE.Shape(); s.moveTo(-W / 2, -H); s.lineTo(W / 2, -H); s.lineTo(W / 2, 0); s.lineTo(-W / 2, 0); s.lineTo(-W / 2, -H);
    const hole = new THREE.Path(); hole.moveTo(-W / 2 + T, -H + T); hole.lineTo(-W / 2 + T, -T); hole.lineTo(W / 2 - T, -T); hole.lineTo(W / 2 - T, -H + T); hole.lineTo(-W / 2 + T, -H + T); s.holes.push(hole);
    add(G.ext(s, .05, .012, 2), GOLD, 0, 0, -.02);
    add(G.box(W - T * 2 + .02, H - T * 2 + .02, .01, .002), GOLD2, 0, -H / 2, .01);
    for (const [x, y] of [[-W / 2 + .04, -.04], [W / 2 - .04, -.04], [-W / 2 + .04, -H + .04], [W / 2 - .04, -H + .04]]) add(G.sph(.035, 8, 6), '#f0c76a', x, y, .05);
  }));
  const art = new THREE.Mesh(new THREE.PlaneGeometry(W - T * 2, H - T * 2), artMat(key)); art.position.set(0, -H / 2, .022); pv.add(art);
  const plaque = grp(); put(plaque, 0, -H - .08, .006); pv.add(plaque);
  plaque.add(mc('artplaque', ({ add }) => add(G.box(.22, .06, .012, .004), '#c9a24a', 0, 0, 0)));
  // a dark little niche in the wall behind it (10/27: the big ones a little bigger — 10판's 게임기 sits in the 별밤 one and stuck out)
  f.add(mc('artniche|' + W, ({ add }) => add(G.box(Math.min(.5, W * .4), W > 1 ? .28 : .22, .006, .002), '#4a3a52', 0, Y - .02, .004)));
  const p = f.part('flip', hinge, t => { hinge.rotation.y = -1.45 * t; }, { label, sfx: 'open', dur: .4 });
  f.spot('inside', null, 0, Y - .1, .012, { part: p, maxH: .09, label: spotLabel, wallFace: true });
}
B.artwave = f => painting(f, 'wave', 1.62, 1.06, 1.42, '몽글 파도 그림', '파도 그림 뒤');
B.artstars = f => painting(f, 'stars', 1.62, 1.06, 1.42, '별밤 그림', '별밤 그림 뒤');
B.artlisa = f => painting(f, 'lisa', .7, .92, 1.42, '몽나리자 그림', '몽나리자 뒤');
B.artpearl = f => painting(f, 'pearl', .7, .92, 1.42, '진주 귀걸이 토순이 그림', '진주 귀걸이 그림 뒤');

// ── a gallery plinth (10/23 user, 10판: plain white boxes "퀄 업") ──────────────────────────────────────────────────────
// a dark skirting at the floor, a bead, a white shaft with a raised frame on each face, a neck bead and a wider cap slab, a
// brass plaque on the front. Three values (dark skirt, white shaft, mid-grey frames) so it still reads as a plinth in 흑백.
// The top surface is at H.
const PL_SKIRT = '#5f566e', PL_BEAD = '#d8d0c2', PL_CAP = '#ece6da', PL_FRAME = '#d6cfc2', PL_PANEL = '#ebe5da';
function plinth(add, W, H, D, { plaque = true } = {}) {
  add(G.box(W + .07, .08, D + .07, .02), PL_SKIRT, 0, .04, 0);
  add(G.box(W + .035, .03, D + .035, .01), PL_BEAD, 0, .095, 0);
  const y0 = .11, y1 = H - .085, sh = y1 - y0;
  add(G.box(W, sh, D, .015), MARBLE, 0, y0 + sh / 2, 0);
  add(G.box(W + .035, .03, D + .035, .01), PL_BEAD, 0, H - .07, 0);
  add(G.box(W + .08, .055, D + .08, .018), PL_CAP, 0, H - .0275, 0);
  // the raised frame on each face (four slim mouldings round a slightly darker panel)
  const fh = sh - .12, fy = y0 + sh / 2;
  if (fh > .1) for (let k = 0; k < 4; k++) {
    const a = k * HP, fw = (k % 2 ? D : W) - .12, out = (k % 2 ? W : D) / 2 + .003, c = Math.cos(a), s = Math.sin(a);
    const at = (u, v, w, h) => add(G.pbox(w, h, .008), PL_FRAME, s * out + c * u, v, c * out - s * u, 0, a, 0);
    at(0, fy + fh / 2, fw, .022); at(0, fy - fh / 2, fw, .022); at(-fw / 2, fy, .022, fh); at(fw / 2, fy, .022, fh);
    add(G.pbox(fw - .03, fh - .03, .004), PL_PANEL, s * (out - .002), fy, c * (out - .002), 0, a, 0);
  }
  if (plaque) {
    const py = y0 + sh * .62;
    add(G.box(.2, .075, .014, .004), '#c9a24a', 0, py, D / 2 + .012);
    for (const dy of [.013, -.01]) add(G.pbox(dy > 0 ? .13 : .09, .01, .004), '#6e5426', 0, py + dy, D / 2 + .02);
  }
}

// 생각하는 몽글이: a bronze mochi on a rock, elbow on knee, chin on paw, eyes shut in thought — on a gallery plinth
B.thinker = f => {
  const PH = .78, T0 = PH + .05, BZ = '#6b5a42', BZ2 = '#8c7654', BZ3 = '#ad9670', BZD = '#3e3226';
  // (②b 10/29 63판 "허접한 오브젝트": up close it read as a brown lump — small dark spheres run together) — a lighter cast
  // bronze with clear parts: a squared rock, a pear body, round ears, thighs forward and shins down, the right elbow on the
  // knee with the paw under the chin, the left paw on the other knee, the tail round the rock; worn gold on the nose, knees
  // and paw, a little green patina in the rock's corners. Kept off the plinth's front-right corner (a thing may sit there)
  const cx = -.04, cz = -.04, B1 = '#8a7350', B2 = '#a88b5e', B3 = '#c4a674', BD = '#4a3a2a', WORN = '#dcc08a', PAT = '#86a893';
  if (late19()) f.add(mc('thinker3', ({ add, tube }) => {
    plinth(add, .52, T0, .52);
    add(G.box(.34, .16, .28, .06), B1, cx - .02, T0 + .08, cz - .04);
    add(G.box(.2, .1, .16, .04), B1, cx + .1, T0 + .05, cz - .1, 0, .3, 0);
    for (const [x, y, z] of [[-.17, .04, .08], [.12, .03, -.17], [-.18, .12, -.16]]) add(G.sph(.026, 8, 6), PAT, cx + x, T0 + y, cz + z, 0, 0, 0, [1.3, .5, 1]);
    add(G.sph(.15, 18, 14), B2, cx, T0 + .3, cz, 0, 0, 0, [1, 1.05, .95]);
    add(G.sph(.1, 14, 10), B3, cx, T0 + .27, cz + .1, 0, 0, 0, [1, 1, .5]);
    for (const s of [-1, 1]) {
      const kx = cx + s * .08;
      tube([cx + s * .07, T0 + .2, cz + .02], [kx, T0 + .21, cz + .17], .055, B2, 10); add(G.sph(.056, 12, 10), B2, kx, T0 + .21, cz + .17);
      tube([kx, T0 + .21, cz + .17], [kx, T0 + .07, cz + .19], .045, B1, 10);
      add(G.sph(.05, 12, 10), B2, kx, T0 + .045, cz + .22, 0, 0, 0, [1, .6, 1.3]);
      for (const k of [-1, 0, 1]) add(G.sph(.011, 6, 5), B3, kx + k * .02, T0 + .04, cz + .285, 0, 0, 0, [1, 1, .5]);
      add(G.sph(.022, 8, 6), WORN, kx, T0 + .25, cz + .2, 0, 0, 0, [1, .6, .6]);
    }
    add(G.sph(.15, 18, 14), B2, cx + .01, T0 + .52, cz + .06);
    for (const s of [-1, 1]) { add(G.sph(.055, 12, 10), B2, cx + .01 + s * .11, T0 + .63, cz + .03); add(G.sph(.03, 10, 8), BD, cx + .01 + s * .11, T0 + .63, cz + .07, 0, 0, 0, [1, 1, .4]); }
    for (const s of [-1, 1]) add(G.tor(.024, .007, PI, 4, 10), BD, cx + .01 + s * .055, T0 + .54, cz + .2, .3, 0, PI);
    add(G.sph(.045, 12, 10), B3, cx + .01, T0 + .48, cz + .19, 0, 0, 0, [1.2, .8, .8]);
    add(G.sph(.016, 8, 6), WORN, cx + .01, T0 + .5, cz + .225);
    tube([cx + .12, T0 + .38, cz + .03], [cx + .09, T0 + .26, cz + .16], .04, B2, 10); add(G.sph(.042, 10, 8), B2, cx + .09, T0 + .26, cz + .16);
    tube([cx + .09, T0 + .26, cz + .16], [cx + .04, T0 + .42, cz + .2], .036, B2, 10);
    add(G.sph(.046, 12, 10), WORN, cx + .04, T0 + .43, cz + .2);
    tube([cx - .12, T0 + .37, cz + .03], [cx - .1, T0 + .24, cz + .15], .038, B2, 10);
    add(G.sph(.043, 12, 10), B3, cx - .09, T0 + .23, cz + .18, 0, 0, 0, [1, .8, 1]);
    add(G.tor(.1, .028, PI * 1.2, 8, 18), B2, cx - .13, T0 + .17, cz - .1, HP, 0, .6); add(G.sph(.034, 10, 8), B3, cx - .2, T0 + .17, cz + .02);
  }));
  else f.add(mc('thinker2', ({ add, tube }) => {
    plinth(add, .52, T0, .52);
    // the rock: two flattened lumps
    add(G.sph(.17, 12, 8), BZ, -.02, T0 + .05, -.02, 0, .4, 0, [1.15, .45, .95]);
    add(G.sph(.1, 10, 6), BZ, .1, T0 + .04, .07, 0, 0, 0, [1, .5, 1]);
    // body, a lighter belly, the bowed head
    add(G.sph(.16, 16, 12), BZ2, 0, T0 + .22, 0, 0, 0, 0, [1, .95, .92]);
    add(G.sph(.1, 12, 8), BZ3, .01, T0 + .19, .1, 0, 0, 0, [1, 1, .55]);
    add(G.sph(.13, 16, 12), BZ2, .02, T0 + .42, .05, .35, 0, 0);
    for (const s of [-1, 1]) { add(G.sph(.045, 10, 8), BZ, .02 + s * .1, T0 + .52, .02); add(G.sph(.022, 8, 6), BZD, .02 + s * .1, T0 + .52, .06, 0, 0, 0, [1, 1, .4]); }
    // eyes shut (two little dark arcs) and a muzzle
    for (const s of [-1, 1]) add(G.tor(.022, .006, PI, 4, 10), BZD, .02 + s * .045, T0 + .43, .179, .35, 0, PI);
    add(G.sph(.035, 10, 8), BZ3, .02, T0 + .38, .165, 0, 0, 0, [1.2, .8, .8]);
    // legs: knees forward, feet on the rock
    for (const s of [-1, 1]) { add(G.sph(.06, 10, 8), BZ2, s * .08, T0 + .13, .13); add(G.sph(.05, 10, 8), BZ, s * .08, T0 + .07, .17, 0, 0, 0, [1, .7, 1.2]); }
    // the right arm: elbow on the knee, paw up under the chin; the left paw on the other knee
    tube([.12, T0 + .26, .06], [.08, T0 + .16, .14], .035, BZ2, 8);
    tube([.08, T0 + .16, .14], [.04, T0 + .32, .16], .032, BZ2, 8);
    add(G.sph(.042, 10, 8), BZ3, .04, T0 + .335, .16);
    tube([-.13, T0 + .26, .05], [-.09, T0 + .17, .14], .033, BZ2, 8);
    add(G.sph(.038, 10, 8), BZ3, -.08, T0 + .17, .16);
    // (⑥ 10/24 사용자 10판 "조각상 디테일"): worn bright spots where hands rub a bronze (the nose, the knees, the paw), toe beans,
    // the tail curled round the rock, moss-green patina on the rock
    add(G.sph(.016, 8, 6), '#d9c08a', .02, T0 + .39, .195); for (const s of [-1, 1]) add(G.sph(.022, 8, 6), '#c9ad78', s * .08, T0 + .17, .175, 0, 0, 0, [1, .6, .6]);
    add(G.sph(.02, 8, 6), '#c9ad78', .045, T0 + .35, .19, 0, 0, 0, [1, .6, .6]);
    for (const s of [-1, 1]) for (const k of [-1, 0, 1]) add(G.sph(.01, 6, 5), BZ3, s * .08 + k * .018, T0 + .055, .22, 0, 0, 0, [1, 1, .5]);
    tube([-.12, T0 + .1, -.1], [-.2, T0 + .1, .02], .028, BZ2, 8); tube([-.2, T0 + .1, .02], [-.17, T0 + .13, .12], .024, BZ2, 8); add(G.sph(.03, 8, 6), BZ3, -.16, T0 + .14, .13);
    for (const [x, z, r] of [[-.15, .1, .03], [.12, -.1, .025], [-.05, -.15, .028], [.16, .05, .022]]) add(G.sph(r, 8, 6), '#6f8a6a', x, T0 + .06, z, 0, x * 9, 0, [1.3, .4, 1]);
  }));
  f.spot('behind', null, 0, 0, -.38, { maxH: .35, label: '조각상 뒤', scale: .7 });
  f.spot('on', null, .19, T0, .17, { maxH: .14, label: '조각상 받침 위', scale: .5 });
};

// 천 덮인 작품: a draped piece on a plinth — lift the cloth and it's a golden mochi bust.
// (10/23 user, 10판 "안에 이상한 거 있음": the old cloth was a cone with eight sticks stuck round it and the bust's ears
// poked out through it. Now one bell of cloth with soft folds and a wavy hem, the whole bust well inside it.)
const clothGeo = () => {
  const pts = [[.285, 0], [.282, .03], [.262, .1], [.232, .18], [.21, .25], [.19, .31], [.16, .37], [.11, .42], [.05, .445], [0, .45]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 48), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), a = Math.atan2(z, x), t = Math.max(0, 1 - y / .4);
    const k = 1 + .1 * t * t * Math.sin(a * 7) + .03 * t * Math.sin(a * 3 + 1);
    P.setXYZ(i, x * k, y + (y < .005 ? .012 * Math.sin(a * 7 + 1.4) + .012 : 0), z * k);
  }
  g.computeVertexNormals();
  return g;
};
B.veiled = f => {
  const PH = .62, T0 = PH + .05, AU = '#e6b94a', AU2 = '#c9973a', AU3 = '#f6d77a';
  f.add(mc('veiledbase2', ({ add }) => {
    plinth(add, .5, T0, .5);
    // the bust: a round foot, a neck, the head with ears, shut eyes and a smile — all inside the cloth's bell
    add(G.cyl(.1, .12, .04, 18), AU2, 0, T0 + .02, 0);
    add(G.cyl(.06, .08, .07, 16), AU, 0, T0 + .075, 0);
    add(G.sph(.125, 16, 12), AU, 0, T0 + .2, 0, 0, 0, 0, [1, .92, .95]);
    for (const s of [-1, 1]) { add(G.sph(.04, 10, 8), AU, s * .085, T0 + .3, -.01); add(G.sph(.02, 8, 6), AU2, s * .085, T0 + .3, .028, 0, 0, 0, [1, 1, .4]); }
    for (const s of [-1, 1]) add(G.tor(.018, .005, PI, 4, 10), AU2, s * .04, T0 + .21, .115, 0, 0, PI);
    add(G.sph(.03, 10, 8), AU3, 0, T0 + .17, .115, 0, 0, 0, [1.2, .8, .7]);
  }));
  const cloth = grp(); put(cloth, 0, T0, 0); f.add(cloth);
  cloth.add(mc('veilcloth2', ({ add }) => {
    add(clothGeo(), '#f4f1fb', 0, 0, 0);
    add(G.cyl(.27, .27, .01, 24), '#d9d3e8', 0, .006, 0);
    add(G.sph(.035, 10, 8), '#e6e0f4', 0, .45, 0, 0, 0, 0, [1, .7, 1]);
    // a gold cord tied round its waist
    add(G.tor(.22, .009, PI * 2, 6, 36), '#d9a94a', 0, .25, 0, HP, 0, 0);
    add(G.sph(.022, 8, 6), '#d9a94a', .02, .245, .222);
    for (const s of [-1, 1]) add(G.cyl(.006, .006, .09, 6), '#d9a94a', .02 + s * .02, .2, .226, 0, 0, s * .2);
  }));
  const p = f.part('lift', cloth, (t, b) => { cloth.position.y = b.p.y + .55 * t; cloth.position.x = b.p.x + .35 * t; cloth.rotation.z = -.9 * t; cloth.scale.setScalar(1 - .35 * t); }, { label: '작품 덮개 천', sfx: 'swish', dur: .45 });
  f.spot('inside', null, .13, T0, .13, { part: p, maxH: .14, label: '덮개 천 속', scale: .55 });
};

// 이젤: a wooden easel with a canvas in progress (a sketched mochi) and a palette on its tray
B.easel = f => {
  f.add(mc('easel', ({ add, tube }) => {
    tube([-.25, 0, .12], [0, 1.5, -.02], .022, '#b9834e', 6); tube([.25, 0, .12], [0, 1.5, -.02], .022, '#b9834e', 6); tube([0, 0, -.3], [0, 1.4, -.04], .02, '#a8733f', 6);
    add(G.box(.62, .04, .09, .01), '#b9834e', 0, .66, .1);
    add(G.cyl(.11, .11, .015, 16), '#e9d3a8', .16, .7, .1, 0, 0, 0, [1.3, 1, 1]);
    for (const [x, c] of [[.08, '#ff7fb0'], [.15, '#8fd3f4'], [.22, '#ffe14d'], [.13, '#7fd6c0']]) add(G.sph(.018, 6, 4), c, x, .715, .08 + (x * 50 % 3) * .02);
  }));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(.56, .68), new THREE.MeshBasicMaterial({ map: tex('sketch', 256, 312, (c, w, h) => {
    c.fillStyle = '#fbf8f1'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a7a6a'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.ellipse(128, 170, 70, 62, 0, 0, 7); c.stroke(); for (const s of [-1, 1]) { c.beginPath(); c.ellipse(128 + s * 56, 130, 20, 28, s * .5, 0, 7); c.stroke(); }
    c.fillStyle = '#5a4a5a'; for (const s of [-1, 1]) { c.beginPath(); c.arc(128 + s * 22, 165, 5, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(255,150,170,.5)'; c.beginPath(); c.ellipse(90, 190, 12, 7, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(166, 190, 12, 7, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,207,174,.6)'; c.fillRect(40, 240, 70, 26);
  }), color: '#f4eee4' }));
  board.position.set(0, 1.06, .1); board.rotation.x = -.1; f.add(board);
  f.add(mc('easelboard', ({ add }) => add(G.box(.6, .72, .02, .006), '#efe6d6', 0, 1.06, .085, -.1, 0, 0)));
  f.spot('on', null, -.15, .69, .11, { maxH: .14, label: '이젤 받침 위', scale: .5 });
  f.spot('behind', null, 0, 0, -.34, { maxH: .35, label: '이젤 뒤', scale: .7 });
};

// 작품 운반 상자: a crate with a lid (lockable), stencilled "handle with care"
// (10/23 user, 10판 "진열 상자도" 퀄 업: it was a smooth block with two bands. Now plank boards with dark seams, corner
// battens, a Z brace on each side, iron corner caps, rope handles, a plank lid with two cleats and a stencilled glass and
// arrows on the front — light boards, dark battens and seams, so it reads as a crate in 흑백 too.)
const stencil = () => tex('cratestencil', 256, 128, (c, w, h) => {
  c.clearRect(0, 0, w, h); c.fillStyle = '#c8324a'; c.strokeStyle = '#c8324a'; c.lineCap = 'round'; c.lineJoin = 'round';
  // a wine glass
  c.lineWidth = 7; c.beginPath(); c.moveTo(34, 22); c.quadraticCurveTo(30, 62, 54, 66); c.quadraticCurveTo(78, 62, 74, 22); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(54, 66); c.lineTo(54, 98); c.moveTo(38, 104); c.lineTo(70, 104); c.stroke();
  // two up arrows
  for (const x of [118, 156]) { c.beginPath(); c.moveTo(x, 104); c.lineTo(x, 34); c.stroke(); c.beginPath(); c.moveTo(x - 16, 50); c.lineTo(x, 26); c.lineTo(x + 16, 50); c.closePath(); c.fill(); }
  // a stamped box round a mochi face
  c.lineWidth = 6; c.strokeRect(186, 30, 56, 70);
  c.beginPath(); c.arc(214, 70, 16, 0, 7); c.stroke(); for (const s of [-1, 1]) { c.beginPath(); c.arc(214 + s * 13, 52, 6, 0, 7); c.fill(); }
});
const stencilMat = () => new THREE.MeshBasicMaterial({ map: stencil(), color: '#e9e2dc', alphaTest: .5 });
B.artcrate = f => {
  // a real open crate: four plank walls round a well (it was a solid block with straw on its top, so the lid came up on a
  // flat lid-sized face and a post-it lay on it like a sticker — user, 10판 on a phone: "상자 안쪽이 안 뚫려 있어")
  const H = .52, W = .76, D = .62, T = .045, S = H - .22, wood = '#dcb680', wood2 = '#cfa66e', seam = '#7a5532', batten = '#9a6a3c', inner = '#a8773f', iron = '#4a4458';
  f.add(mc('artcrate3', ({ add }) => {
    add(G.box(W, .06, D, .02), wood2, 0, .03, 0);
    for (const sz of [-1, 1]) add(G.box(W, H - .06, T, .008), wood, 0, .06 + (H - .06) / 2, sz * (D / 2 - T / 2));
    for (const sx of [-1, 1]) add(G.box(T, H - .06, D - 2 * T, .008), wood, sx * (W / 2 - T / 2), .06 + (H - .06) / 2, 0);
    for (const sz of [-1, 1]) add(G.pbox(W - 2 * T - .004, H - S - .02, .006), inner, 0, S + (H - S) / 2 - .01, sz * (D / 2 - T - .003));
    for (const sx of [-1, 1]) add(G.pbox(.006, H - S - .02, D - 2 * T - .004), inner, sx * (W / 2 - T - .003), S + (H - S) / 2 - .01, 0);
    // plank seams: three boards a side
    for (const y of [.2, .34]) {
      for (const sz of [-1, 1]) add(G.pbox(W - .1, .01, .006), seam, 0, y, sz * (D / 2 + .002));
      for (const sx of [-1, 1]) add(G.pbox(.006, .01, D - .1), seam, sx * (W / 2 + .002), y, 0);
    }
    // corner battens up the four edges, and a top and bottom rail round the outside
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.06, H + .005, .06, .012), batten, sx * (W / 2 - .01), H / 2, sz * (D / 2 - .01));
    for (const y of [.045, H - .035]) {
      for (const sz of [-1, 1]) add(G.box(W - .06, .055, .022, .008), batten, 0, y, sz * (D / 2 + .008));
      for (const sx of [-1, 1]) add(G.box(.022, .055, D - .06, .008), batten, sx * (W / 2 + .008), y, 0);
    }
    // a Z brace on each side face (not the front: the stencil and the lock are there)
    const L = Math.hypot(D - .12, H - .17), ang = Math.atan2(H - .17, D - .12);
    for (const sx of [-1, 1]) add(G.box(.022, .05, L, .008), batten, sx * (W / 2 + .012), H / 2, 0, -ang, 0, 0);
    // iron caps on the corners, rope handles on the sides
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [.03, H - .02]) add(G.box(.075, .06, .075, .01), iron, sx * (W / 2 - .01), y, sz * (D / 2 - .01));
    for (const sx of [-1, 1]) add(G.tor(.06, .012, PI, 6, 12), '#e8d4a6', sx * (W / 2 + .03), H * .62, 0, 0, HP, PI);
  }));
  const st = new THREE.Mesh(new THREE.PlaneGeometry(.5, .25), stencilMat()); st.position.set(0, H * .55 - .02, D / 2 + .021); f.add(st);
  const lid = grp(); put(lid, 0, H, -.31); f.add(lid);
  lid.add(mc('artcratelid2', ({ add }) => {
    for (let k = 0; k < 4; k++) add(G.box(.8, .045, .162, .008), k % 2 ? wood2 : wood, 0, .0225, .31 - .243 + k * .162);
    for (let k = 1; k < 4; k++) add(G.pbox(.78, .006, .008), seam, 0, .046, .31 - .324 + k * .162);
    for (const sx of [-1, 1]) add(G.box(.07, .03, .64, .008), batten, sx * .28, .06, .31);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.07, .05, .07, .008), iron, sx * .375, .025, .31 + sz * .3);
    add(G.box(.18, .012, .1, .004), '#f4ecd8', -.05, .052, .37, 0, .08, 0);
  }));
  const p = f.part('lift', lid, t => { lid.rotation.x = -1.7 * t; }, { label: '작품 상자 뚜껑', sfx: 'open', dur: .35 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: -.05, z: .66, parent: lid };
  // packing straw down in the well (a hand's depth under the rim), what's tucked in lies on it
  f.add(mc('artcratestraw2', ({ add }) => {
    add(G.box(W - 2 * T - .01, .05, D - 2 * T - .01, .02), '#f2d58a', 0, S - .025, 0);
    for (let k = 0; k < 9; k++) add(G.box(.2, .015, .02, .006), '#e8c46a', -.22 + (k % 3) * .22, S + .005, -.16 + Math.floor(k / 3) * .16, 0, k * .7, 0);
  }));
  f.spot('inside', null, 0, S, .02, { part: p, maxH: .2, label: '작품 상자 안', scale: .75 });
  f.spot('on', null, .2, H + .05, .05, { maxH: .3, label: '작품 상자 위', scale: .65 });
};

// 관람 벤치 (2×1): a long padded bench
B.museumbench = f => {
  // (②b 10/29 63판 "허접한 오브젝트": three blocks) — a gallery ottoman: a buttoned velvet cushion with piping, a wooden
  // frame with turned legs, a rail between each pair and brass caps, and a visitor's folded guide map left at one end
  const VEL = '#8a4b5a', VEL2 = '#9c5a69', PIPE = '#6a3a46', WD = '#b98a56', WD2 = '#94683c', BRS = '#d9b45a';
  if (late19()) f.add(mc('museumbench2', ({ add, tube }) => {
    add(G.box(1.56, .12, .44, .06), VEL, 0, .38, 0);
    add(G.box(1.5, .03, .4, .015), VEL2, 0, .435, 0);
    for (const sz of [-1, 1]) add(G.cyl(.012, .012, 1.52, 6), PIPE, 0, .44, sz * .205, 0, 0, HP);
    for (const sx of [-1, 1]) add(G.cyl(.012, .012, .4, 6), PIPE, sx * .76, .44, 0, HP, 0, 0);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const x = -.6 + i * .3 + (j ? .15 : 0), z = j ? .08 : -.08; if (Math.abs(x) > .7) continue; add(G.sph(.018, 8, 6), PIPE, x, .447, z, 0, 0, 0, [1, .5, 1]); }
    add(G.box(1.6, .07, .46, .02), WD, 0, .295, 0);
    add(G.pbox(1.56, .012, .006), WD2, 0, .28, .232);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * .7, z = sz * .17;
      add(G.cyl(.032, .022, .24, 12), WD, x, .16, z); add(G.sph(.034, 10, 8), WD2, x, .2, z, 0, 0, 0, [1, .6, 1]);
      add(G.cyl(.026, .026, .03, 10), BRS, x, .025, z);
    }
    for (const sx of [-1, 1]) tube([sx * .7, .1, -.17], [sx * .7, .1, .17], .014, WD2, 6);
    add(G.box(.16, .008, .11, .003), '#fbf5e8', -.58, .453, .04, 0, -.25, 0); add(G.box(.07, .009, .11, .003), '#8fc8e8', -.61, .454, .035, 0, -.25, 0);
  }));
  else f.add(mc('museumbench', ({ add }) => {
    add(G.box(1.6, .14, .46, .06), '#8a4b5a', 0, .38, 0); add(G.box(1.5, .06, .4, .02), '#6a3a46', 0, .29, 0);
    for (const sx of [-1, 1]) add(G.box(.1, .28, .38, .02), '#c9a46a', sx * .68, .14, 0);
  }));
  f.spot('under', null, -.3, 0, 0, { maxH: .22, label: '관람 벤치 밑', scale: .7 });
  f.spot('on', null, .4, .45, 0, { maxH: .3, label: '관람 벤치 위', scale: .7 });
};

// 관람선 (2×1): two brass posts with a red velvet rope sagging between them
B.stanchion = f => {
  f.add(mc('stanchion', ({ add, tube }) => {
    for (const sx of [-1, 1]) { add(G.cyl(.12, .14, .04, 16), '#c9a24a', sx * .7, .02, 0); tube([sx * .7, 0, 0], [sx * .7, .82, 0], .025, '#d9b45a', 8); add(G.sph(.05, 10, 8), '#e6c46a', sx * .7, .86, 0); }
    let prev = null; for (let k = 0; k <= 10; k++) { const x = -.68 + k * .136, y = .78 - Math.sin(k / 10 * PI) * .16, pt = [x, y, 0]; if (prev) tube(prev, pt, .028, '#c8324a', 6); prev = pt; }
  }));
  f.spot('behind', null, 0, 0, -.32, { maxH: .35, label: '관람선 뒤', scale: .7 });
};

// 안내 데스크 (2×1): a panelled counter with a glass vitrine on one end, brochures and a bell on the other, a drawer
// (lockable with a code). (10/23 user, 10판 테이블/진열대 "퀄 업, ㅈㄴ 싫음": it was a plain white block with a stripe.)
// Values for 흑백: a dark skirting, a cream body with raised mid-grey panels, a darker wooden top, the glass case lit inside.
B.guidedesk = f => {
  const TH = .8, W = 1.6, D = .56, FR = '#d3c8b4', PAN = '#ece4d6', TOP = '#a8764a', TOP2 = '#8a5e38', BR = '#c9a24a';
  f.add(mc('guidedesk2', ({ add, tube }) => {
    add(G.box(W + .05, .08, D + .05, .02), PL_SKIRT, 0, .04, 0);
    // (10/29 사용자 "책상 서랍 열리는 데 구멍 좀 뚫어라": the drawer ran into the solid body — a hole behind it, lined; the drawer front covers it shut)
    add(holeFace(G.box(W, TH - .08, D, .02), [[.115, .585, -.135, .05]]), '#f6f1e8', 0, .08 + (TH - .08) / 2, 0); add(liner(.47, .185, .42, 'z'), '#d6cbb8', .35, .3975, .07);
    add(G.box(W + .08, .05, D + .08, .018), TOP, 0, TH + .025, 0);
    add(G.box(W + .03, .02, D + .03, .006), TOP2, 0, TH - .01, 0);
    add(G.pbox(W - .04, .022, .006), BR, 0, TH - .06, D / 2 + .003);
    // raised panels: the left of the front, both ends
    const frame = (cx, cy, w, h, place) => {
      for (const [u, v, ww, hh] of [[0, h / 2, w, .024], [0, -h / 2, w, .024], [-w / 2, 0, .024, h], [w / 2, 0, .024, h]]) place(G.pbox(ww, hh, .01), FR, cx + u, cy + v);
      place(G.pbox(w - .03, h - .03, .005), PAN, cx, cy);
    };
    frame(-.4, .42, .62, .5, (g, c, u, v) => add(g, c, u, v, D / 2 + .004));
    // the back faces the room in 10판 (the drawer side is turned to the wall's end), so it gets two panels and the gold line too
    for (const cx of [-.4, .4]) frame(cx, .42, .66, .5, (g, c, u, v) => add(g, c, u, v, -D / 2 - .004, 0, PI, 0));
    add(G.pbox(W - .04, .022, .006), BR, 0, TH - .06, -D / 2 - .003);
    for (const sx of [-1, 1]) frame(0, .42, D - .14, .5, (g, c, u, v) => add(g, c, sx * (W / 2 + .004), v, u, 0, HP, 0));
    // a little "i" sign above the drawer
    add(G.cyl(.065, .065, .012, 20), '#3f3a5a', .35, .63, D / 2 + .008, HP, 0, 0);
    add(G.pbox(.018, .055, .006), '#fff6e6', .35, .615, D / 2 + .016); add(G.sph(.012, 8, 6), '#fff6e6', .35, .665, D / 2 + .016, 0, 0, 0, [1, 1, .4]);
    // the vitrine on the left: a wooden base, a velvet cushion, a little vase and a scroll, brass posts and rails, a light strip
    const VX = -.4, VW = .68, VD = .42, VH = .26, Y0 = TH + .05;
    add(G.box(VW + .04, .05, VD + .04, .01), TOP2, VX, Y0 + .025, 0);
    add(G.box(VW - .08, .03, VD - .12, .012), '#7a2c48', VX, Y0 + .065, 0);
    const vase = [[.0, 0], [.035, .005], [.045, .04], [.04, .08], [.022, .11], [.02, .13], [.03, .14]].map(([r, y]) => new THREE.Vector2(r, y));
    add(new THREE.LatheGeometry(vase, 14), '#f2ece2', VX - .12, Y0 + .08, 0);
    add(G.cyl(.046, .046, .02, 14, true), '#3f5a9a', VX - .12, Y0 + .13, 0);
    add(G.cyl(.022, .022, .16, 10), '#efe2c4', VX + .1, Y0 + .1, .02, 0, .3, HP);
    for (const sx of [-1, 1]) add(G.cyl(.028, .028, .03, 10), '#c9a46a', VX + .1 + sx * .08 * Math.cos(.3), Y0 + .1, .02 - sx * .08 * Math.sin(.3), 0, .3, HP);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tube([VX + sx * VW / 2, Y0 + .05, sz * VD / 2], [VX + sx * VW / 2, Y0 + .05 + VH, sz * VD / 2], .009, BR, 6);
    for (const sz of [-1, 1]) add(G.pbox(VW + .02, .02, .02), BR, VX, Y0 + .05 + VH, sz * VD / 2);
    for (const sx of [-1, 1]) add(G.pbox(.02, .02, VD + .02), BR, VX + sx * VW / 2, Y0 + .05 + VH, 0);
    add(G.pbox(VW - .04, .012, .02), '#fff3c4', VX, Y0 + .05 + VH - .02, VD / 2 - .02);
    // a slanted brochure rack and the bell on the right
    add(G.box(.26, .03, .16, .006), TOP2, .1, TH + .065, .06);
    for (let k = 0; k < 3; k++) add(G.box(.075, .15, .012, .003), ['#ff9ec2', '#8fd3f4', '#ffe27a'][k], .02 + k * .08, TH + .14, .06 - k * .004, -.35, 0, 0);
    add(G.box(.26, .1, .012, .004), TOP2, .1, TH + .11, .01, -.35, 0, 0);
    add(G.cyl(.065, .075, .02, 16), TOP2, .62, TH + .06, .1);
    add(G.sph(.055, 14, 8), '#d9b45a', .62, TH + .07, .1, 0, 0, 0, [1, .85, 1]);
    add(G.cyl(.008, .008, .03, 6), '#d9b45a', .62, TH + .13, .1); add(G.sph(.015, 8, 6), '#d9b45a', .62, TH + .15, .1);
  }));
  f.add(mesh(new THREE.BoxGeometry(.66, .25, .4), mat('#dff2fa', { opacity: .26 }), { cast: false, recv: false })).position.set(-.4, TH + .05 + .05 + .125, 0);
  // the drawer is a real tray: it slides out with whatever is in it
  const dr = grp(); put(dr, .35, TH * .5, .28); f.add(dr);
  dr.add(mc('guidedrawer2', ({ add }) => {
    add(G.box(.5, .2, .04, .01), '#efe7da', 0, 0, 0);
    for (const [u, v, w, h] of [[0, .075, .44, .018], [0, -.075, .44, .018], [-.22, 0, .018, .168], [.22, 0, .018, .168]]) add(G.pbox(w, h, .008), FR, u, v, .022);
    add(G.box(.16, .04, .008, .004), '#a8823e', 0, 0, .024); add(G.box(.12, .025, .03, .008), BR, 0, 0, .035);
    add(G.box(.44, .02, .4, .006), '#e2d6c2', 0, -.08, -.2); for (const sx of [-1, 1]) add(G.box(.02, .12, .4, .006), '#e2d6c2', sx * .21, -.03, -.2); add(G.box(.44, .12, .02, .006), '#e2d6c2', 0, -.03, -.39);
  }));
  const p = f.part('door', dr, (t, b) => { dr.position.z = b.p.z + .36 * t; }, { label: '안내 데스크 서랍', sfx: 'open', dur: .3 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: .14, y: 0, z: .03, parent: dr };
  f.spot('inside', dr, 0, -.07, -.18, { part: p, maxH: .12, label: '데스크 서랍 안', scale: .6 });
  f.spot('on', null, .38, TH + .05, .02, { maxH: .3, label: '안내 데스크 위', scale: .65 });
};

// 그리스 항아리: a black-figure amphora on a low plinth
// (⑥ 10/24 사용자 10판 "조각상 디테일": an orange egg with a black belt) — a real amphora: a narrow black foot, an egg body
// widest high up, a slim neck and a rolled black lip, two black loop handles from neck to shoulder; painted all round —
// a meander key at the neck, a black-figure panel of 몽글이 runners on the belly, a band of rays at the foot
const amphoraTex = () => tex('amphora-paint', 512, 256, (c, w, h) => {
  const CL = '#e0874a', BK = '#2a1d22';
  c.fillStyle = CL; c.fillRect(0, 0, w, h);
  c.fillStyle = BK; c.fillRect(0, 0, w, h * .07); c.fillRect(0, h * .93, w, h * .07);
  // the neck: a meander key between two lines
  const ny = h * .14; c.fillRect(0, ny - 14, w, 3); c.fillRect(0, ny + 14, w, 3);
  c.strokeStyle = BK; c.lineWidth = 3;
  for (let x = 0; x < w; x += 24) { c.beginPath(); c.moveTo(x, ny + 10); c.lineTo(x, ny - 9); c.lineTo(x + 16, ny - 9); c.lineTo(x + 16, ny + 3); c.lineTo(x + 8, ny + 3); c.lineTo(x + 8, ny - 3); c.stroke(); }
  // the belly panel: running mochi in black, between two bands
  const by = h * .5; c.fillRect(0, by - 46, w, 5); c.fillRect(0, by + 42, w, 5);
  for (let k = 0; k < 4; k++) {
    const x = 64 + k * 128, y = by + 6, lean = k % 2 ? -1 : 1;
    c.fillStyle = BK; c.beginPath(); c.ellipse(x, y, 26, 22, lean * .15, 0, 7); c.fill();
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * 18, y - 18, 7, 10, s * .5, 0, 7); c.fill(); }
    c.lineWidth = 6; c.lineCap = 'round'; c.strokeStyle = BK;
    c.beginPath(); c.moveTo(x - 12, y + 18); c.lineTo(x - 26 * lean, y + 34); c.stroke(); c.beginPath(); c.moveTo(x + 10, y + 18); c.lineTo(x + 22 * lean, y + 36); c.stroke();
    c.beginPath(); c.moveTo(x + 20 * lean, y - 2); c.lineTo(x + 38 * lean, y - 16); c.stroke();
    c.fillStyle = CL; for (const s of [-1, 1]) { c.beginPath(); c.arc(x + s * 8 + lean * 4, y - 4, 3, 0, 7); c.fill(); }
    c.strokeStyle = CL; c.lineWidth = 2; c.beginPath(); c.arc(x + lean * 4, y + 3, 5, .2, Math.PI - .2); c.stroke();
  }
  // the foot: a band of black rays
  c.fillStyle = BK; for (let x = 0; x < w; x += 22) { c.beginPath(); c.moveTo(x, h * .9); c.lineTo(x + 11, h * .76); c.lineTo(x + 22, h * .9); c.fill(); }
  c.fillRect(0, h * .74, w, 3);
});
B.amphora = f => {
  const PH = .34, Y0 = PH + .04, H = .66;
  f.add(mc('amphora3', ({ add, tube }) => {
    plinth(add, .46, Y0, .46);
    add(G.cyl(.075, .09, .04, 18), '#2a1d22', 0, Y0 + .02, 0);
    add(G.tor(.095, .014, PI * 2, 6, 24), '#2a1d22', 0, Y0 + .04 + H - .002, 0, HP, 0, 0);
    for (const sx of [-1, 1]) { tube([sx * .07, Y0 + .64, 0], [sx * .17, Y0 + .66, 0], .016, '#2a1d22', 6); tube([sx * .17, Y0 + .66, 0], [sx * .2, Y0 + .49, 0], .016, '#2a1d22', 6); }
  }));
  const pts = [[.06, 0], [.075, .04], [.13, .1], [.19, .24], [.215, .36], [.2, .44], [.15, .51], [.085, .55], [.07, .6], [.075, .64], [.1, .66], [.085, .668], [.06, .66], [0, .66]];
  f.add(put(mesh(geo('amphora3-body', () => { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 28), p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, Math.min(1, p.getY(i) / H)); return g; }), mat('#ffffff', { map: amphoraTex(), rough: .5 })), 0, Y0 + .04, 0));
  f.spot('behind', null, 0, 0, -.36, { maxH: .35, label: '항아리 뒤', scale: .7 });
};
// 도넛 조각상: a giant pink-glazed donut standing on its edge on a plinth — pop art
B.donutart = f => {
  const PH = .4;
  f.add(mc('donutart2', ({ add }) => {
    plinth(add, .5, PH + .04, .4);
    add(G.tor(.2, .1, Math.PI * 2, 12, 28), '#e9b47a', 0, PH + .04 + .3, 0);
    add(G.tor(.2, .085, Math.PI * 2, 12, 28), '#ff8fb8', 0, PH + .04 + .3, .03, 0, 0, 0, [1, 1, .9]);   // the glaze
    [['#ffe14d', .12, .14], ['#8fd3f4', -.16, .05], ['#7fd6c0', .05, -.18], ['#ffffff', -.08, .2], ['#ffe14d', .2, -.06]].forEach(([c, x, y]) => add(G.box(.05, .016, .016, .006), c, x, PH + .04 + .3 + y, .1, 0, 0, x * 5));
  }));
  f.spot('behind', null, 0, 0, -.32, { maxH: .35, label: '도넛 조각상 뒤', scale: .7 });
  f.spot('on', null, .17, .44, .12, { maxH: .14, label: '조각상 받침 위', scale: .5 });
};
export const MUSEUM_BUILDERS = B;
// a painting's own canvas (arthunt.js: 10판's 그림 속 숨은그림 draws on a copy of it)
export const paintCanvas = key => PAINT[key]?.()?.image || null;
export const MUSEUM_INFO = {
  artwave: { wall: true, span: 2, name: '몽글 파도 그림', price: 520, region: 'building' },
  artstars: { wall: true, span: 2, name: '별밤 그림', price: 520, region: 'building' },
  artlisa: { wall: true, span: 1, name: '몽나리자', price: 480, region: 'building' },
  artpearl: { wall: true, span: 1, name: '진주 귀걸이 토순이', price: 480, region: 'building' },
  thinker: { w: 1, d: 1, name: '생각하는 몽글이', price: 420, region: 'building' },
  veiled: { w: 1, d: 1, name: '천 덮인 작품', price: 380, region: 'building' },
  easel: { w: 1, d: 1, name: '이젤', price: 180, region: 'building' },
  artcrate: { w: 1, d: 1, name: '작품 운반 상자', price: 160, region: 'building' },
  museumbench: { w: 2, d: 1, name: '관람 벤치', price: 220, region: 'building' },
  stanchion: { w: 2, d: 1, name: '관람선', price: 140, region: 'building' },
  guidedesk: { w: 2, d: 1, name: '안내 데스크', price: 300, region: 'building' },
  amphora: { w: 1, d: 1, name: '그리스 항아리', price: 320, region: 'building' },
  donutart: { w: 1, d: 1, name: '도넛 조각상', price: 360, region: 'building' },
};

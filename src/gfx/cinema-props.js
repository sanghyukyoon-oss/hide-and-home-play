// 31판 새 보스 맵 「별빛극장의 비밀 영사실」 cinema (⑧ 10/23 — 스토리 룸 안 A, 허브 "건물 자체가 거대 소품": 레퍼 정비소 단면·버거 가게).
// 문 닫은 지 오래된 동네 단관 극장을 자른 실루엣 단면 디오라마. 모티프 넷(매표소·팝콘·좌석·영사기)에 거대 소품 셋이 건물이 된다 —
//   ① 왼쪽 벽 = 세워 둔 거대 필름 릴(구멍 셋으로 감긴 필름이 보임), 그 안쪽 면에 무대·스크린·커튼; 릴에서 풀린 필름 띠가 뒷벽 위를 감아 돎
//   ② 2층 영사실 = 거대 영사기 모양 방(지붕 위 릴 둘, 서쪽 끝 렌즈 통이 영사 창), 사다리로 올라감(엔진 다락 lofts)
//   ③ 매표소 = 거대 팝콘 통(빨강·크림 줄무늬, 위로 넘치는 팝콘), 지붕 위 거대 전구 간판 '별빛극장'
// 1층은 빨간 접이식 좌석 줄·커플석, 팝콘 매점(유리 뚜껑 기계·메뉴판), 상영관 문, 오늘의 상영 판, 둥근 섬(보도·연석·가로등) 위에 저녁 빛.
// 생활 디테일: 테이프 자국만 남은 포스터 자리, 떨어진 팝콘, 표 반쪽, 빗자루·쓰레받기, 대걸레 통, 손전등, 기대 둔 필름 릴, 매점 메뉴판,
// 비상구 초록 표지, 매표 창구 동전 접시, 상영 안내판 글자.
// 부품 이름(스토리 룸·② 레벨·③ 연출이 그대로 씀): cin_marquee · cin_ticketbooth · cin_showtimes · cin_popcorn(위 선반 포함 — ② 10/23: 열쇠 hang은
// 팝콘 빌더 안) · cin_hall_door · cin_seatrow · cin_twinseat · cin_screen · cin_curtain · cin_projroom_door · cin_filmcans · cin_projector
// (+ 바탕 cin_shell, 포스터 받침 cin_posterstand).
// 자물쇠는 '설 수 있다'만(p.lockable·lockKind·lockAt): 매표소 서랍 code · 상영관 문 pad · 영사실 문 color (+ 매점 아래 칸 pad 하나 여분) — 셋 다
// 문·서랍 뒤 얕은 칸에 숨김 자리, 카메라 쪽을 봄. 시간표·필름 통은 숫자·색 없는 빈 장식(단서 소품은 ②가 obslock으로 놓음).
// ③이 쓰는 손잡이: cin_marquee f.bulbs(켜질 순서)·f.letters(글자 넷, 덩어리마다 재질 따로) · cin_projector 손잡이 부품·f.lensAt·f.beam(꺼짐)·f.reels ·
// cin_screen 이름이 '-screen'으로 끝나는 화면 면(f.screen)·f.film(숨김, art/cinema/film.png) · cin_popcorn 유리 뚜껑 부품·f.popcornPile·f.spill·f.keySpot ·
// cin_curtain 부품 하나(천 두 폭이 가운데서 갈라져 양옆으로 주름이 모이며 걷힘, 줄도 같은 부품 — f.cord) · cin_seatrow 좌석마다 접히는 부품 + 좌석 밑 자리.
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, shade, fadeDisc, starShape, STYLE } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { clothBend } from './clothbend.js';
import { FONT, paperSheet, paperFill } from './gpt-paper.js';
import { tr, LANG, addI18n } from '../i18n.js';
import { LOCK_COLORS } from './items.js';

addI18n({
  '상영 판 앞': 'In front of the showtimes board',
  '별빛극장': 'Starlight Cinema', '매표소': 'Tickets', '상영관': 'Screen 1', '영사실': 'Projection', '비상구': 'EXIT', '오늘의 상영': 'Now Showing',
  '매점': 'Snack Bar', '팝콘': 'Popcorn', '콜라': 'Cola', '오징어': 'Dried squid', '쥐포': 'Fish jerky', '달려라 몽글이': 'Run, Mongle!', '우주 고양이': 'Space Cat',
  '숨바꼭질 대작전': 'Hide & Seek Mission', '관계자 외 출입금지': 'Staff only', '개봉 박두': 'Coming soon', '조조 할인': 'Early bird', '한 장': 'One ticket',
  '상영 중': 'Now on', '휴관': 'Closed', '다시 열어요': 'Reopening', '입장권': 'Admit one',
});

const PI = Math.PI, HP = PI / 2;
const ss = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const B = {};
const rnd = s => { let a = s * 9301 + 49297; return () => ((a = (a * 9301 + 49297) % 233280) / 233280); };
const once = f => { let v = null; return () => v || (v = f()); };
// a texture made once, used at a size of its own (the image is shared, the repeat is per use)
const repTex = (t, rx, ry) => { const c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rx, ry); return c; };
const basic = (tex, tint = '#ffffff', o = {}) => { const m = new THREE.MeshBasicMaterial({ map: tex, color: tint, ...o }); m.toneMapped = false; return m; };
const texMat = (tex, o = {}) => mat('#ffffff', { map: tex, rough: .85, rim: .08, ...o });
const quad = (w, h, m, { cast = false } = {}) => mesh(new THREE.PlaneGeometry(w, h), m, { cast });
// colour only (no outline, never picked): light beams, glows, sign lettering
const colourOnly = o => { o.traverse(m => { if (m.isMesh || m.isSprite) { m.layers.set(2); m.userData.noOcclude = true; m.castShadow = false; } }); return o; };
const keep = o => { o.traverse(m => { if (m.isMesh) m.userData.noMerge = true; }); return o; };
const own = (c, o) => mat(c, o).clone();   // a material of its own (③ changes its glow one at a time)
const ext = (shape, depth, curve = 12) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: curve });
const rrect = (P, x0, y0, x1, y1, r) => {
  const [a, b, c, d] = Array.isArray(r) ? r : [r, r, r, r];
  P.moveTo(x0 + a, y0); P.lineTo(x1 - b, y0); if (b) P.absarc(x1 - b, y0 + b, b, -HP, 0, false);
  P.lineTo(x1, y1 - c); if (c) P.absarc(x1 - c, y1 - c, c, 0, HP, false);
  P.lineTo(x0 + d, y1); if (d) P.absarc(x0 + d, y1 - d, d, HP, PI, false);
  P.lineTo(x0, y0 + a); if (a) P.absarc(x0 + a, y0 + a, a, PI, PI * 1.5, false);
  return P;
};
const circle = (P, cx, cy, r) => { P.moveTo(cx + r, cy); P.absarc(cx, cy, r, 0, PI * 2, false); return P; };
let GLOW = null;
const glowTex = () => GLOW || (GLOW = fadeDisc(64, '#ffffff', r => Math.pow(Math.max(0, 1 - r), 1.6)));
const pool = (x, y, z, r, c, op = .4) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ color: c, map: glowTex(), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); put(p, x, y, z, -HP); p.renderOrder = 3; return colourOnly(keep(p)); };
const halo = (x, y, z, s, c, op = .6) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: c, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false })); sp.position.set(x, y, z); sp.scale.setScalar(s); sp.renderOrder = 4; return colourOnly(sp); };
const toonMat = o => STYLE.mode !== 'std' ? new THREE.MeshToonMaterial({ gradientMap: STYLE.grad, ...o }) : new THREE.MeshStandardMaterial({ roughness: .8, ...o });
// one line of lettering that fits its box, in the game font (no tr — the caller picks the words)
const say = (c, s, x, y, maxW, px, color, o = {}) => {
  let size = px; c.font = FONT(size, o.weight || ''); while (c.measureText(s).width > maxW && size > 8) { size--; c.font = FONT(size, o.weight || ''); }
  c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
  if (o.stroke) { c.lineJoin = 'round'; c.strokeStyle = o.stroke; c.lineWidth = o.sw || Math.max(2, size * .2); c.strokeText(s, x, y); }
  c.fillStyle = color; c.fillText(s, x, y);
};
const T = s => tr(s);

// ── 색 (큰 면은 순하게, 쨍한 색은 작은 것에만) ──────────────────────────────────────────────────────────────────
const WALLB = '#efdccd', WAIN = '#a8705a', WAIND = '#86533f', GOLD = '#d9b25e', GOLDD = '#b48c40', CREAM = '#fff4e2', INK = '#3a2c34',
  VELVET = '#c9505c', VELVETD = '#a2404c', SEATBK = '#a8645a', IRON = '#5e5670', CURTAIN = '#b8505a', CURTAIND = '#94404a',
  REEL = '#c8c3d8', REELD = '#9993b5', FILM = '#4e3a35', BOOTH = '#7aa3a4', BOOTHD = '#55807f', CHROME = '#dde0e8', MQ = '#4b3f6e',
  KRED = '#e0545c', PAVE = '#b9afa4', PAVED = '#9a9086', CURB = '#ddd5ca', SOIL = '#8a6a52', SOILD = '#6c5242', LEAF = '#7cbf68', LEAF2 = '#5ea75a',
  STONE = '#d8cdbf', WOOD = '#c98f5a', WOODD = '#94603a', POP = '#fff1cf', BUTTER = '#f6d27a', BULB = '#fff1c2', GLOWC = '#ffcf6a';

// ── 그림 ────────────────────────────────────────────────────────────────────────────────────────────────────
// 벽지: 옅은 장밋빛 크림에 아르데코 부채 무늬 (1 m 한 장)
const wallTex = once(() => canvasTex(256, 256, (c, W, H) => {
  c.fillStyle = WALLB; c.fillRect(0, 0, W, H);
  for (let row = 0; row < 5; row++) for (let col = -1; col < 4; col++) {
    const cx = col * 80 + (row % 2) * 40 + 40, cy = row * 56 + 40;
    c.fillStyle = '#e8cdbd'; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, 26, PI, 0); c.closePath(); c.fill();
    c.strokeStyle = '#dcbb86'; c.lineWidth = 2;
    for (let k = 1; k < 6; k++) { const a = PI + k * PI / 6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26); c.stroke(); }
    c.beginPath(); c.arc(cx, cy, 26, PI, 0); c.stroke(); c.beginPath(); c.arc(cx, cy, 14, PI, 0); c.stroke();
  }
  const r = rnd(7); c.fillStyle = 'rgba(120,80,60,.05)'; for (let i = 0; i < 40; i++) c.fillRect(r() * W, r() * H, 3 + r() * 9, 2);
}));
// 판벽: 따뜻한 나무 세로 판자 (0.8 m 한 장)
const wainTex = once(() => canvasTex(256, 128, (c, W, H) => {
  c.fillStyle = WAIN; c.fillRect(0, 0, W, H); const r = rnd(3);
  for (let x = 0; x < W; x += 32) { c.fillStyle = shade(WAIN, -.04 + r() * .06); c.fillRect(x + 1, 0, 30, H); c.fillStyle = WAIND; c.fillRect(x, 0, 2, H);
    c.strokeStyle = 'rgba(70,40,30,.18)'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { const gx = x + 6 + r() * 20; c.beginPath(); c.moveTo(gx, 0); c.bezierCurveTo(gx + 4, H * .3, gx - 4, H * .6, gx + 2, H); c.stroke(); } }
  c.fillStyle = shade(WAIN, .12); c.fillRect(0, 0, W, 6);
}));
// 객석 카펫: 순한 와인색에 마름모 격자, 이음마다 금빛 점 (1 m 한 장)
const carpetTex = once(() => canvasTex(256, 256, (c, W, H) => {
  c.fillStyle = '#92474f'; c.fillRect(0, 0, W, H); const r = rnd(5);
  for (let i = 0; i < 900; i++) { c.fillStyle = r() < .5 ? 'rgba(255,220,200,.05)' : 'rgba(40,10,20,.07)'; c.fillRect(r() * W, r() * H, 2, 2); }
  c.strokeStyle = '#a3585d'; c.lineWidth = 3;
  for (let k = -4; k < 8; k++) { c.beginPath(); c.moveTo(k * 64, 0); c.lineTo(k * 64 + H, H); c.stroke(); c.beginPath(); c.moveTo(k * 64 + H, 0); c.lineTo(k * 64, H); c.stroke(); }
  c.fillStyle = '#cfa45e'; for (let y = 0; y <= H; y += 32) for (let x = (y / 32 % 2) * 32; x <= W; x += 64) { c.beginPath(); c.arc(x, y, 3.5, 0, PI * 2); c.fill(); }
}));
// 로비 바닥: 크림·테라코타 바둑판 타일 (0.5 m 타일, 1 m 한 장), 줄눈과 작은 점
const lobbyTex = once(() => canvasTex(256, 256, (c, W, H) => {
  const r = rnd(9);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { c.fillStyle = (i + j) % 2 ? '#d59a83' : '#efe1ca'; c.fillRect(i * 128, j * 128, 128, 128); }
  for (let i = 0; i < 500; i++) { c.fillStyle = r() < .5 ? 'rgba(120,70,50,.12)' : 'rgba(255,255,255,.2)'; c.fillRect(r() * W, r() * H, 2, 2); }
  c.strokeStyle = '#c4ab90'; c.lineWidth = 3; for (let k = 0; k <= 256; k += 128) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k, H); c.stroke(); c.beginPath(); c.moveTo(0, k); c.lineTo(W, k); c.stroke(); }
}));
// 빨간 카펫 길: 진홍에 금빛 테두리 두 줄, 가운데 작은 마름모 (폭 한 장, 1 m 길이)
const runnerTex = once(() => canvasTex(128, 256, (c, W, H) => {
  c.fillStyle = '#c2414b'; c.fillRect(0, 0, W, H); c.fillStyle = '#e0b864'; c.fillRect(6, 0, 6, H); c.fillRect(W - 12, 0, 6, H);
  c.fillStyle = '#a9343f'; c.fillRect(16, 0, 3, H); c.fillRect(W - 19, 0, 3, H);
  c.fillStyle = '#d99a5a'; for (let y = 32; y < H; y += 64) { c.beginPath(); c.moveTo(W / 2, y - 14); c.lineTo(W / 2 + 12, y); c.lineTo(W / 2, y + 14); c.lineTo(W / 2 - 12, y); c.closePath(); c.fill(); }
  const r = rnd(4); for (let i = 0; i < 160; i++) { c.fillStyle = 'rgba(60,10,20,.08)'; c.fillRect(r() * W, r() * H, 2, 2); }
}));
// 보도블록: 따뜻한 회색 벽돌 (1.5 m 한 장)
const paveTex = once(() => canvasTex(256, 256, (c, W, H) => {
  c.fillStyle = PAVE; c.fillRect(0, 0, W, H); const r = rnd(11);
  for (let y = 0; y < H; y += 32) for (let x = 0; x < W; x += 64) { c.fillStyle = shade(PAVE, -.05 + r() * .08); c.fillRect(x + ((y / 32) % 2) * 32 + 2, y + 2, 60, 28); }
  c.strokeStyle = PAVED; c.lineWidth = 2; for (let y = 0; y <= H; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); for (let x = ((y / 32) % 2) * 32; x <= W; x += 64) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 32); c.stroke(); } }
}));
// 무대 마루 (1 m 한 장)
const stageTex = once(() => canvasTex(256, 128, (c, W, H) => {
  const r = rnd(2); for (let y = 0; y < H; y += 21) { c.fillStyle = shade('#d6a066', -.05 + r() * .07); c.fillRect(0, y, W, 20); c.fillStyle = '#8f5f3a'; c.fillRect(0, y + 20, W, 1.5); for (let k = 0; k < 2; k++) c.fillRect(r() * W, y, 1.5, 20); }
}));
// 필름 띠: 짙은 바탕, 위아래 톱니 구멍, 호박빛 칸마다 작은 그림자 (2 m 한 장)
const filmTex = once(() => canvasTex(512, 64, (c, W, H) => {
  c.fillStyle = '#3b2c2b'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#efe2c8'; for (let x = 6; x < W; x += 24) { c.fillRect(x, 4, 12, 8); c.fillRect(x, H - 12, 12, 8); }
  const r = rnd(13);
  for (let k = 0; k < 6; k++) {
    const x = 6 + k * 84; c.fillStyle = '#e7b45e'; c.fillRect(x, 16, 76, 32); c.fillStyle = 'rgba(80,50,30,.55)';
    if (k % 3 === 0) { c.beginPath(); c.arc(x + 38, 36, 10, 0, PI * 2); c.fill(); c.fillRect(x + 10, 42, 56, 6); }
    else if (k % 3 === 1) { c.fillRect(x + 12, 26, 18, 22); c.fillRect(x + 40, 20, 24, 28); }
    else { c.beginPath(); c.moveTo(x + 10, 46); c.lineTo(x + 38, 20); c.lineTo(x + 66, 46); c.fill(); }
    c.fillStyle = 'rgba(255,240,210,.18)'; c.fillRect(x + r() * 70, 16, 1, 32);
  }
}));
// 비상구: 초록 상자에 흰 달리는 사람과 글자
const exitTex = once(() => canvasTex(192, 80, (c, W, H) => {
  c.fillStyle = '#2fa36a'; c.fillRect(0, 0, W, H); c.fillStyle = '#e9fff1';
  c.beginPath(); c.arc(30, 20, 7, 0, PI * 2); c.fill();
  c.lineWidth = 7; c.lineCap = 'round'; c.strokeStyle = '#e9fff1';
  c.beginPath(); c.moveTo(28, 30); c.lineTo(22, 50); c.lineTo(34, 64); c.moveTo(22, 50); c.lineTo(10, 62); c.moveTo(27, 36); c.lineTo(42, 44); c.moveTo(27, 36); c.lineTo(14, 40); c.stroke();
  c.fillRect(48, 12, 4, 56);
  say(c, T('비상구'), 122, H / 2 + 2, 120, 38, '#e9fff1', { weight: 'bold' });
}));
// 옛 영화 포스터 셋 (빛바랜 색)
const POSTERS = [
  { t: '달려라 몽글이', sub: '개봉 박두', bg: ['#f2c98a', '#e88a62'], ink: '#5a2c22', draw: (c, w, h) => {
    c.fillStyle = '#fff4e2'; c.beginPath(); c.ellipse(w / 2, h * .52, w * .26, w * .22, 0, 0, PI * 2); c.fill(); c.strokeStyle = '#5a2c22'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#5a2c22'; c.beginPath(); c.arc(w * .44, h * .5, 4, 0, PI * 2); c.arc(w * .58, h * .5, 4, 0, PI * 2); c.fill();
    c.lineWidth = 4; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(w * .1, h * (.42 + k * .05)); c.lineTo(w * .22, h * (.42 + k * .05)); c.stroke(); } } },
  { t: '우주 고양이', sub: '조조 할인', bg: ['#2e3f6e', '#7a6aa8'], ink: '#ffe9b0', draw: (c, w, h) => {
    const r = rnd(8); c.fillStyle = '#ffe9b0'; for (let i = 0; i < 26; i++) c.fillRect(r() * w, r() * h * .7, 2, 2);
    c.fillStyle = '#e8e2f2'; c.beginPath(); c.ellipse(w / 2, h * .52, w * .14, w * .28, -.4, 0, PI * 2); c.fill();
    c.fillStyle = '#e0545c'; c.beginPath(); c.moveTo(w * .6, h * .62); c.lineTo(w * .72, h * .72); c.lineTo(w * .58, h * .7); c.fill();
    c.fillStyle = '#f7c35c'; c.beginPath(); c.arc(w * .47, h * .44, 9, 0, PI * 2); c.fill(); c.beginPath(); c.moveTo(w * .41, h * .4); c.lineTo(w * .43, h * .35); c.lineTo(w * .46, h * .39); c.fill(); } },
  { t: '숨바꼭질 대작전', sub: '상영 중', bg: ['#b9d8c4', '#5f9e86'], ink: '#24453a', draw: (c, w, h) => {
    c.fillStyle = '#8a6a52'; c.fillRect(w * .12, h * .44, w * .76, h * .2);
    c.strokeStyle = '#5a4434'; c.lineWidth = 2; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(w * .12 + k * w * .15, h * .44); c.lineTo(w * .12 + k * w * .15, h * .64); c.stroke(); }
    for (const x of [.32, .62]) { c.fillStyle = '#fff4e2'; c.beginPath(); c.arc(w * x, h * .44, 16, PI, 0); c.fill(); c.fillStyle = '#24453a'; c.beginPath(); c.arc(w * x - 5, h * .41, 3, 0, PI * 2); c.arc(w * x + 5, h * .41, 3, 0, PI * 2); c.fill(); } } },
];
const POST = [];
const posterTex = k => POST[k] || (POST[k] = canvasTex(192, 256, (c, w, h) => {
  const P = POSTERS[k], g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, P.bg[0]); g.addColorStop(1, P.bg[1]); c.fillStyle = g; c.fillRect(0, 0, w, h);
  P.draw(c, w, h);
  say(c, T(P.t), w / 2, h * .16, w * .86, 26, P.ink, { weight: 'bold' }); say(c, T(P.sub), w / 2, h * .86, w * .7, 16, P.ink);
  c.fillStyle = 'rgba(255,245,225,.28)'; c.fillRect(0, 0, w, h);   // 빛바램
  const r = rnd(k + 3); c.fillStyle = 'rgba(90,60,40,.18)'; for (let i = 0; i < 30; i++) c.fillRect(r() * w, r() * h, 2 + r() * 3, 1 + r() * 2);
}));
// 매점 메뉴판: 짙은 초록 칠판에 분필 글씨
const menuTex = once(() => canvasTex(256, 136, (c, W, H) => {
  c.fillStyle = '#35503f'; c.fillRect(0, 0, W, H); c.strokeStyle = '#c9a46a'; c.lineWidth = 8; c.strokeRect(4, 4, W - 8, H - 8);
  say(c, T('매점'), W / 2, 26, W * .6, 24, '#ffe28a', { weight: 'bold' });
  const rows = [['팝콘', '3,000'], ['콜라', '1,500'], ['오징어', '2,000'], ['쥐포', '1,000']];
  rows.forEach(([a, b], i) => { const y = 54 + i * 21; say(c, T(a), 24, y, 130, 17, '#f3efe2', { align: 'left' }); say(c, b, W - 24, y, 70, 16, '#f3efe2', { align: 'right' }); c.fillStyle = 'rgba(243,239,226,.3)'; for (let x = 120; x < W - 80; x += 8) c.fillRect(x, y + 2, 3, 2); });
  c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(30, 40, 170, 6);
}));
// 매표소 글자판
const kioskSignTex = once(() => canvasTex(256, 80, (c, W, H) => {
  c.fillStyle = CREAM; c.fillRect(0, 0, W, H); c.strokeStyle = KRED; c.lineWidth = 6; c.strokeRect(5, 5, W - 10, H - 10);
  say(c, T('매표소'), W / 2, H / 2 + 2, W * .8, 40, '#b8383f', { weight: 'bold' });
}));
// 매표소 통 줄무늬 (원통 둘레로 빨강·크림 12줄)
const stripeTex = once(() => canvasTex(512, 32, (c, W, H) => { for (let k = 0; k < 12; k++) { c.fillStyle = k % 2 ? CREAM : KRED; c.fillRect(k * W / 12, 0, W / 12 + 1, H); } c.fillStyle = 'rgba(255,255,255,.12)'; for (let k = 0; k < 12; k++) c.fillRect(k * W / 12 + 4, 0, 3, H); }));
// 상영관 문 위 글자 상자
const hallSignTex = once(() => canvasTex(256, 64, (c, W, H) => { c.fillStyle = '#6a2a36'; c.fillRect(0, 0, W, H); say(c, T('상영관'), W / 2, H / 2 + 1, W * .8, 34, '#ffe0a0', { weight: 'bold' }); }));
// 영사실 문패
const boothPlateTex = once(() => canvasTex(160, 56, (c, W, H) => { c.fillStyle = '#2e4f63'; c.fillRect(0, 0, W, H); c.strokeStyle = GOLD; c.lineWidth = 4; c.strokeRect(3, 3, W - 6, H - 6); say(c, T('영사실'), W / 2, H / 2 + 1, W * .8, 28, '#fff3d6', { weight: 'bold' }); }));
// 관계자 외 출입금지
const staffTex = once(() => canvasTex(160, 48, (c, W, H) => { c.fillStyle = '#f6efe2'; c.fillRect(0, 0, W, H); c.fillStyle = '#c43d3d'; c.fillRect(0, 0, 12, H); say(c, T('관계자 외 출입금지'), W / 2 + 6, H / 2 + 1, W * .82, 18, '#4a3a3a', { weight: 'bold' }); }));
// 휴관 안내 쪽지 (문 닫은 극장)
const closedTex = once(() => canvasTex(128, 96, (c, W, H) => { paperFill(c, W, H, '#fbf3e0', 5); say(c, T('휴관'), W / 2, 30, W * .8, 30, '#b8383f', { weight: 'bold' }); say(c, T('다시 열어요'), W / 2, 66, W * .84, 16, '#4a3528'); }));

// 거대 릴 안쪽 판: 은빛 라일락 금속에 가는 동심원 결과 바퀴살 자국 (판 전체 한 장)
const reelFaceTex = once(() => canvasTex(512, 512, (c, W, H) => {
  c.fillStyle = REEL; c.fillRect(0, 0, W, H); const cx = W / 2, cy = H / 2, r = rnd(19);
  for (let k = 8; k < 256; k += 3 + r() * 4) { c.strokeStyle = r() < .5 ? 'rgba(255,255,255,.16)' : 'rgba(90,80,120,.1)'; c.lineWidth = 1 + r() * 1.5; c.beginPath(); c.arc(cx, cy, k, 0, PI * 2); c.stroke(); }
  c.strokeStyle = 'rgba(110,100,140,.18)'; c.lineWidth = 10; for (let k = 0; k < 6; k++) { const a = k * PI / 3 + PI / 6; c.beginPath(); c.moveTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 70); c.lineTo(cx + Math.cos(a) * 225, cy + Math.sin(a) * 225); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, 236, PI * 1.1, PI * 1.45); c.stroke();
}));
// ── 크기 (방 9 × 6 m, 바닥 y 0, 가운데가 원점; 카메라는 +x +z 쪽) ────────────────────────────────────────────────────
export const CIN = {
  RW: 9, RD: 6, NH: 3.5, NT: .3,
  REEL: { y: 2.3, z: -.35, R: 3.25 },   // 왼쪽 벽 거대 릴 (x -4.5 안쪽 면)
  STAGE: { x1: -3.85, z0: -2.25, z1: 1.55, h: .38 },
  LOFT: { x0: .3, x1: 2.6, z0: -3, z1: -1.2, y: 2.2 },   // 2층 영사실 다락 (엔진 lofts)
  PART: { x: .3, z0: -1.25, z1: .9, h: 1.1 },            // 객석과 로비 사이 낮은 칸막이
};
const ISL = { x0: -5.6, x1: 5.5, z0: -3.9, z1: 4.4, rb: 1.3, rf: 1.9 }, ISY = -.12;
const islandShape = (inset = 0) => { const s = new THREE.Shape(), { x0, x1, z0, z1, rb, rf } = ISL, i = inset; return rrect(s, x0 + i, -z1 + i, x1 - i, -z0 - i, [rf - i, rf - i, rb - i, rb - i]); };

// 접히는 벽 (카메라 쪽으로 온 벽은 무릎 높이로 — 18판 otakuloft3·21판 파출소 방식)
const foldWall = (f, n, H) => {
  const g = grp(), deco = grp(), knee = grp(); f.add(g); f.add(deco); f.add(knee); knee.visible = false;
  (f.live || (f.live = [])).push(g, deco, knee);
  const q = { g, deco, knee, n: new THREE.Vector3(...n), k: 1, stub: .42 / H };
  (f.cinWalls || (f.cinWalls = [])).push(q);
  return q;
};
const tagWall = (o, k) => o.traverse(m => { if (m.isMesh) { m.userData.noMerge = true; m.userData.gptWall = k; m.castShadow = true; m.receiveShadow = true; } });
const viewDir = new THREE.Vector3(), nW = new THREE.Vector3();
const facingAway = (f, n, Wd) => { f.group.updateWorldMatrix(true, false); viewDir.set(Math.sin(Wd.yaw), 0, Math.cos(Wd.yaw)); nW.copy(n).transformDirection(f.group.matrixWorld); return nW.dot(viewDir) < -.18; };

// ── 바탕: 섬 + 바닥 + 뒷벽 + 거대 릴 벽 + 무대 + 칸막이 + 다락 밑 + 바깥 소품 ─────────────────────────────────────────
B.cin_shell = (f, T0) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.3, 0, .001, -.29, .001];
  const { RW, RD, NH, NT, REEL, STAGE, LOFT, PART } = CIN, X0 = -RW / 2, X1 = RW / 2, Z0 = -RD / 2, Z1 = RD / 2;
  // 걷기 막이 (바탕은 통째로 막지 않음): 무대, 칸막이, 다락 밑 덩어리, 사다리 뒤 구석
  f.walkBoxes = [[X0, -.1, STAGE.z0, STAGE.x1, STAGE.h, STAGE.z1], [PART.x - .07, 0, PART.z0, PART.x + .07, PART.h, PART.z1],
    [LOFT.x0, 0, Z0, LOFT.x1, 1.9, LOFT.z1 - .05], [LOFT.x1, 0, Z0, 3.3, 1, -1.75]];
  // 섬 (보도 + 흙 단 + 돌 띠 + 짙은 발, 가장자리 연석)
  f.add(mc('cin-island', ({ add }) => {
    add(ext(islandShape(), .3, 18), PAVED, 0, ISY - .3, 0, -HP, 0, 0);
    add(ext(islandShape(.14), .34, 18), SOIL, 0, ISY - .64, 0, -HP, 0, 0);
    add(ext(islandShape(.2), .12, 18), '#b8a48c', 0, ISY - .76, 0, -HP, 0, 0);
    add(ext(islandShape(.34), .16, 18), SOILD, 0, ISY - .92, 0, -HP, 0, 0);
    const ring = islandShape(); ring.holes.push(islandShape(.16)); add(ext(ring, .07, 18), CURB, 0, ISY - .002, 0, -HP, 0, 0);
    // 건물 받침 (바닥 0, 보도 -.12): 앞·오른쪽 턱에 돌 테
    add(G.box(RW, .12, RD, .01), STONE, 0, -.06, 0);
    add(G.box(RW + .06, .04, .1, .01), shade(STONE, .06), 0, -.002, Z1 - .03); add(G.box(.1, .04, RD, .01), shade(STONE, .06), X1 - .03, -.002, 0);
    // 잔디 몇 줌 (연석 안쪽, 뒤·옆)
    for (const [x, z, n] of [[-5.2, -2.9, 5], [-5.3, 3.0, 4], [5.15, -2.6, 5], [5.2, -.4, 4], [-2.2, -3.6, 4], [1.6, -3.6, 5], [4.6, 3.9, 4], [-3.6, 4.05, 3]])
      for (let k = 0; k < n; k++) { const a = k * 2.3; add(G.sph(.09 + (k % 3) * .02, 8, 6), k % 2 ? LEAF : LEAF2, x + Math.cos(a) * .09, ISY + .04 + (k % 2) * .03, z + Math.sin(a) * .07, 0, 0, 0, [1.1, .8, 1]); }
    // 앞 화단 둘 (건물 앞 턱 아래): 나무 상자에 꽃
    for (const [x, z] of [[-3.5, 3.42], [3.75, 3.42]]) {
      add(G.box(.9, .26, .34, .03), WOOD, x, ISY + .13, z); add(G.box(.94, .04, .38, .015), WOODD, x, ISY + .27, z);
      for (let k = 0; k < 7; k++) { const px = x - .36 + k * .12; add(G.sph(.08, 8, 6), k % 2 ? LEAF : LEAF2, px, ISY + .32, z + (k % 2 ? .04 : -.04)); add(G.sph(.035, 6, 5), ['#ff9fb5', '#ffe07a', '#ffffff'][k % 3], px + .02, ISY + .4, z + .06); }
    }
    // 맨홀
    add(G.cyl(.3, .3, .02, 22), '#7d7672', 1.7, ISY + .01, 3.95); add(G.tor(.3, .022, PI * 2, 4, 22), '#66605c', 1.7, ISY + .02, 3.95, HP, 0, 0);
  }));
  { const g = new THREE.ShapeGeometry(islandShape(.16), 18); const m = mesh(g, texMat(repTex(paveTex(), 1, 1), { rough: .6 }), { cast: false });
    // (보도 무늬는 월드 1.5 m — 모양 uv가 미터라 반복을 1/1.5로)
    m.material.map.repeat.set(1 / 1.5, 1 / 1.5); put(m, 0, ISY + .003, 0, -HP, 0, 0); m.userData.floor = true; f.add(m); }
  // 바닥 (방 바닥 위에 얇게): 객석 카펫, 로비 타일, 상영관 문까지 빨간 카펫 길
  const floor = (tex, x0, x1, z0, z1, y, sx, sz) => { const m = quad(x1 - x0, z1 - z0, texMat(repTex(tex, sx, sz), { rough: .9 })); put(m, (x0 + x1) / 2, y, (z0 + z1) / 2, -HP); m.receiveShadow = true; m.userData.floor = true; f.add(m); return m; };
  floor(carpetTex(), X0, PART.x, Z0, Z1, .004, (PART.x - X0) / 1, RD / 1);
  floor(lobbyTex(), PART.x, X1, Z0, Z1, .004, (X1 - PART.x) / 1, RD / 1);
  floor(runnerTex(), .52, 1.38, LOFT.z1, Z1, .008, 1, (Z1 - LOFT.z1) / 1);
  // 떨어진 팝콘·표 반쪽·손전등 (로비와 객석 바닥)
  f.add(mc('cin-floorbits', ({ add }) => {
    const r = rnd(21);
    for (const [cx, cz, n] of [[2.3, -.35, 7], [-1.2, 1.25, 5], [-2.55, -1.75, 4], [3.2, .9, 3]]) for (let k = 0; k < n; k++) add(G.sph(.028 + r() * .012, 6, 5), r() < .7 ? POP : BUTTER, cx + (r() - .5) * .5, .025, cz + (r() - .5) * .35);
    // 표 반쪽 둘 (찢긴 끝)
    for (const [x, z, a, c] of [[1.75, .55, .5, '#f3d8a0'], [1.95, .7, -.3, '#f6c2c2']]) { add(G.box(.13, .006, .07, .002), c, x, .012, z, 0, a, 0); add(G.box(.02, .007, .07, .002), shade(c, -.15), x + Math.cos(a) * .055, .013, z - Math.sin(a) * .055, 0, a, 0); }
    // 안내원 손전등 (뒷줄 통로 바닥에 굴러다님)
    add(G.cyl(.035, .035, .22, 10), '#3d5a8a', -3.2, .04, -2.35, 0, .4, HP); add(G.cyl(.05, .04, .06, 12), '#c9cfe0', -3.31, .045, -2.3, 0, .4, HP);
  }));

  // ── 뒷벽 (N): 판벽·벽지·필름 띠 프리즈·금빛 몰딩, 벽 촛대 둘, 비상구 문과 초록 표지, 테이프 자국만 남은 포스터 자리, 옛 포스터 ─────────
  const N = foldWall(f, [0, 0, 1], NH);
  {
    N.g.add(mc('cin-nwall', ({ add }) => {
      add(G.box(RW + .1, NH, NT, .03), '#e3cdbd', -.05 + 0, NH / 2, Z0 - NT / 2);
      add(G.box(RW, .14, .05, .01), WAIND, 0, .07, Z0 + .025);                 // 걸레받이
      add(G.box(RW, .06, .06, .02), GOLD, 0, .95, Z0 + .03);                   // 허리 몰딩
      add(G.box(RW + .1, .1, .12, .03), GOLD, -.05, NH - .05, Z0 + .02);       // 위 몰딩
      add(G.box(RW + .1, .05, .1, .02), GOLDD, -.05, 2.98, Z0 + .03);          // 필름 띠 아래 테
      // 오른쪽 끝 기둥 (보이는 끝면)
      add(G.box(.22, NH + .1, .42, .04), '#e8d6c6', X1 + .02, (NH + .1) / 2, Z0 - NT / 2 + .03); add(G.box(.26, .1, .46, .03), GOLD, X1 + .02, NH + .1, Z0 - NT / 2 + .03);
    }));
    const wp = quad(RW, 2.0, texMat(repTex(wallTex(), RW, 2.0), { rough: .9 })); put(wp, 0, .97 + 1.0, Z0 + .003); N.g.add(wp);
    const wn = quad(RW, .82, texMat(repTex(wainTex(), RW / .8, 1), { rough: .8 })); put(wn, 0, .14 + .41, Z0 + .004); N.g.add(wn);
    const fr = quad(RW, .42, texMat(repTex(filmTex(), RW / 2, 1), { rough: .6 })); put(fr, 0, 3.0 + .21, Z0 + .006); N.g.add(fr);
    // 무릎 벽
    N.knee.add(mc('cin-nwall-knee', ({ add }) => { add(G.box(RW, .42, NT, .04), '#e3cdbd', 0, .21, Z0 - NT / 2); add(G.box(RW, .05, NT + .04, .02), GOLD, 0, .42, Z0 - NT / 2); }));
    // 장식: 벽 촛대, 비상구, 포스터, 테이프 자국
    N.deco.add(mc('cin-nwall-deco', ({ add }) => {
      for (const x of [-3.75, -.6]) {   // 부채 모양 벽 촛대
        add(G.box(.08, .3, .05, .02), GOLDD, x, 2.12, Z0 + .03);
        const fan = new THREE.Shape(); fan.moveTo(-.2, 0); fan.absarc(0, 0, .2, PI, 0, true); fan.closePath(); add(ext(fan, .1, 10), '#fff1d0', x, 2.2, Z0 + .02);
        add(G.box(.44, .03, .12, .01), GOLD, x, 2.2, Z0 + .07);
      }
      // 비상구 문 (짙은 회녹색, 밀대 손잡이), 문틀
      add(G.box(1.0, 2.1, .06, .02), '#5d5a63', -2.35, 1.05, Z0 + .03); add(G.box(.86, 1.98, .05, .02), '#6f8a80', -2.35, .99, Z0 + .06);
      add(G.box(.62, .05, .05, .02), '#d9dde6', -2.35, 1.0, Z0 + .11); for (const sx of [-1, 1]) add(G.box(.04, .08, .06, .01), '#9aa0ad', -2.35 + sx * .3, 1.0, Z0 + .09);
      add(G.box(.3, .4, .03, .01), '#f6efe2', -2.35, 1.5, Z0 + .09);   // 휴관 쪽지 자리 (그림은 아래)
      // 테이프 자국만 남은 포스터 자리: 벽지보다 밝은 네모 + 테이프 네 조각 + 찢겨 남은 귀퉁이
      add(G.box(.56, .78, .004, .001), '#f6e9dd', -3.25, 1.45, Z0 + .008);
      for (const [dx, dy, a] of [[-.25, .36, .6], [.25, .36, -.6], [-.25, -.36, -.6], [.25, -.36, .6]]) add(G.box(.13, .04, .006, .002), '#ead7a6', -3.25 + dx, 1.45 + dy, Z0 + .012, 0, 0, a);
      const tri = new THREE.Shape(); tri.moveTo(0, 0); tri.lineTo(.14, 0); tri.lineTo(0, -.12); tri.closePath(); add(ext(tri, .004, 2), '#e8a67e', -3.51, 1.82, Z0 + .012);
      // 관계자 외 출입금지 판 (구석)
      add(G.box(.46, .16, .02, .01), '#c9bfae', 3.0, 1.6, Z0 + .012);
    }));
    { const m = quad(.56, .2, basic(exitTex(), '#d8ffe6')); put(m, -2.35, 2.32, Z0 + .07); N.deco.add(m); N.deco.add(put(mc('cin-exitbox', ({ add }) => add(G.box(.62, .26, .1, .02), '#e9efe9', 0, 0, 0)), -2.35, 2.32, Z0 + .02)); }
    { const m = quad(.27, .2, texMat(closedTex(), { rim: 0 })); put(m, -2.35, 1.5, Z0 + .107); N.deco.add(m); }
    { const m = quad(.44, .14, texMat(staffTex(), { rim: 0 })); put(m, 3.0, 1.6, Z0 + .024); N.deco.add(m); }
    { const p = paperSheet(.62, .86, posterTex(0), { hold: 'tape' }); put(p, -1.45, 1.5, Z0 + .006); N.deco.add(p); }
    // 촛대 불빛 (색만: 벽에 번지는 빛, 바닥 웅덩이)
    for (const x of [-3.75, -.6]) { const b = mesh(new THREE.SphereGeometry(.06, 10, 8), mat('#fff3d0', { emissive: GLOWC, ei: 1.2 }), { cast: false }); put(b, x, 2.26, Z0 + .09); N.deco.add(b); N.deco.add(halo(x, 2.3, Z0 + .25, 1.1, '#ffcf8a', .45)); f.add(pool(x, .02, Z0 + .9, .9, '#ffb86a', .32)); }
    tagWall(N.g, 'N'); tagWall(N.deco, 'N'); tagWall(N.knee, 'N');
  }

  // ── 왼쪽 벽 (W) = 세워 둔 거대 필름 릴: 안쪽 판(구멍 셋)·감긴 필름·바깥 판, 테·리벳, 발치 받침 돌, 위로 풀려 나가는 필름 띠 ─────────────
  const W = foldWall(f, [1, 0, 0], REEL.y + REEL.R);
  {
    const R = REEL.R, holes = [[90, .55], [18, .5], [162, .5]].map(([a, r]) => [REEL.z + Math.cos(a * PI / 180) * 2.15, REEL.y + Math.sin(a * PI / 180) * 2.15, r]);
    const flange = (withHoles) => { const s = new THREE.Shape(); circle(s, REEL.z, REEL.y, R); if (withHoles) for (const [u, v, r] of holes) s.holes.push(circle(new THREE.Path(), u, v, r)); return s; };
    W.g.add(mc('cin-reel', ({ add }) => {
      // (모양은 (u = z, v = y)로 그려 y축 -90°로 돌림: 두께가 -x로 나감)
      add(ext(flange(false), .1, 40), REELD, X0 - .5, 0, 0, 0, -HP, 0);
      add(G.cyl(R - .45, R - .45, .42, 44), FILM, X0 - .3, REEL.y, REEL.z, 0, 0, HP);
      add(G.cyl(.62, .62, .52, 24), REELD, X0 - .3, REEL.y, REEL.z, 0, 0, HP);   // 가운데 심
      // 안쪽 판 테두리 (두꺼운 테)와 구멍 테
      add(G.tor(R - .04, .06, PI * 2, 6, 64), REELD, X0 + .02, REEL.y, REEL.z, 0, HP, 0);
      for (const [u, v, r] of holes) add(G.tor(r + .02, .035, PI * 2, 6, 28), REELD, X0 + .02, v, u, 0, HP, 0);
    }));
    // 안쪽 판은 결 그림이 있는 따로 된 덩어리 (모양 uv가 미터 → 판 지름 한 장)
    { const t = repTex(reelFaceTex(), 1 / (2 * R), 1 / (2 * R)); t.offset.set(-(REEL.z - R) / (2 * R), -(REEL.y - R) / (2 * R));
      const m = mesh(ext(flange(true), .1, 40), texMat(t, { rough: .6, rim: .12 })); put(m, X0, 0, 0, 0, -HP, 0); W.g.add(m); }
    // 무릎 높이 (접혔을 때): 낮은 릴 받침 띠
    W.knee.add(mc('cin-reel-knee', ({ add }) => { add(G.box(.6, .42, 4.0, .05), REEL, X0 - .3, .21, REEL.z); add(G.box(.64, .05, 4.04, .02), REELD, X0 - .3, .42, REEL.z); }));
    W.deco.add(mc('cin-reel-deco', ({ add, tube }) => {
      // 리벳 (테 안쪽 둘레)
      for (let k = 0; k < 20; k++) { const a = k / 20 * PI * 2, u = REEL.z + Math.cos(a) * (R - .22), v = REEL.y + Math.sin(a) * (R - .22); if (v > .5) add(G.sph(.04, 8, 6), CHROME, X0 + .04, v, u, 0, 0, 0, [.6, 1, 1]); }
      // 감긴 필름 위로 보이는 결 (구멍 안쪽)
      for (const [u, v, r] of holes) for (let k = 0; k < 3; k++) add(G.tor(r * (.5 + k * .18), .008, PI * 2, 3, 20), '#6e544c', X0 - .08, v, u, 0, HP, 0);
      // 발치 받침 돌 (릴이 서 있는 요람) 앞·뒤
      add(G.box(.8, .62, .7, .06), STONE, X0 - .3, .19, -2.86); add(G.box(.86, .08, .76, .03), shade(STONE, -.08), X0 - .3, .52, -2.86);
      add(G.box(.8, .56, .7, .06), STONE, X0 - .3, .16, 2.05); add(G.box(.86, .08, .76, .03), shade(STONE, -.08), X0 - .3, .46, 2.05);
    }));
    // 릴에서 풀린 필름 띠 (납작한 띠 — 톱니 구멍·칸 그림): 감긴 필름 꼭대기에서 뒤로 풀려 나와 뒷벽 위에 내려앉고, 벽 안쪽의 필름 띠 장식으로 이어짐
    { const P = [[-4.8, 5.13, -.35], [-4.8, 5.08, -1.0], [-4.79, 4.92, -1.6], [-4.75, 4.55, -2.2], [-4.66, 4.05, -2.7], [-4.5, 3.62, -3.05], [-4.2, 3.535, -3.12], [-3.95, 3.535, -3.08]];
      const pos = [], uv = [], idx = [], HW = .16; let L = 0;
      P.forEach((c, i) => {
        if (i) L += Math.hypot(c[0] - P[i - 1][0], c[1] - P[i - 1][1], c[2] - P[i - 1][2]);
        const k = ss(Math.max(0, Math.min(1, (i - 2) / 4))), wx = 1 - k, wz = k, n = Math.hypot(wx, wz);
        pos.push(c[0] - wx / n * HW, c[1], c[2] - wz / n * HW, c[0] + wx / n * HW, c[1], c[2] + wz / n * HW); uv.push(L / 2, 0, L / 2, 1);
        if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      W.deco.add(mesh(g, texMat(repTex(filmTex(), 1, 1), { rough: .6, side: THREE.DoubleSide }), { cast: true })); }
    tagWall(W.g, 'W'); tagWall(W.deco, 'W'); tagWall(W.knee, 'W');
  }

  // ── 무대 (릴 앞): 마루 위판, 앞면 짙은 나무에 금빛 띠, 작은 계단 ────────────────────────────────────────────────
  f.add(mc('cin-stage', ({ add }) => {
    const w = STAGE.x1 - X0, d = STAGE.z1 - STAGE.z0, cx = (X0 + STAGE.x1) / 2, cz = (STAGE.z0 + STAGE.z1) / 2, h = STAGE.h;
    add(G.box(w, h, d, .03), '#7c3f3a', cx, h / 2, cz); add(G.box(w + .04, .05, d + .04, .02), '#c48a55', cx, h - .025, cz);
    add(G.box(.03, .05, d - .1, .01), GOLD, STAGE.x1 + .005, h * .55, cz);
    for (let k = 0; k < 6; k++) add(G.box(.02, h - .12, .02, .005), '#6a3430', STAGE.x1 + .004, h / 2 - .02, STAGE.z0 + .3 + k * (d - .6) / 5);
    // 앞 끝 작은 계단 둘
    add(G.box(.36, .13, .5, .02), '#8a4a42', STAGE.x1 + .18, .065, STAGE.z1 - .35); add(G.box(.36, .025, .52, .01), '#c48a55', STAGE.x1 + .18, .14, STAGE.z1 - .35);
  }));
  { const m = quad(STAGE.x1 - X0 - .04, STAGE.z1 - STAGE.z0 - .04, texMat(repTex(stageTex(), STAGE.x1 - X0, STAGE.z1 - STAGE.z0), { rough: .7 })); put(m, (X0 + STAGE.x1) / 2, STAGE.h + .003, (STAGE.z0 + STAGE.z1) / 2, -HP); m.userData.floor = true; f.add(m); }

  // ── 칸막이 (객석 | 로비): 크림 판에 짙은 나무 갓, 황동 난간, 로비 쪽엔 작은 액자 둘; 앞 끝엔 황동 기둥과 벨벳 줄 ────────────────
  f.add(mc('cin-partition', ({ add }) => {
    const len = PART.z1 - PART.z0, cz = (PART.z0 + PART.z1) / 2;
    add(G.box(.12, PART.h, len, .02), '#ead8c6', PART.x, PART.h / 2, cz); add(G.box(.18, .06, len + .04, .02), WAIND, PART.x, PART.h + .03, cz);
    add(G.box(.13, .32, len, .01), WAIN, PART.x, .16, cz);
    for (const s of [-1, 1]) add(G.box(.02, .02, len, .005), GOLD, PART.x + s * .07, .34, cz);
    // 앞 끝 황동 기둥 둘과 처진 벨벳 줄
    for (const z of [PART.z1 + .05, PART.z1 + .95]) { add(G.cyl(.09, .11, .04, 14), GOLDD, PART.x, .02, z); add(G.cyl(.022, .022, .82, 8), GOLD, PART.x, .43, z); add(G.sph(.045, 10, 8), GOLD, PART.x, .86, z); }
  }));
  f.add(mc('cin-rope', ({ tube }) => { const p = []; for (let k = 0; k <= 8; k++) { const t = k / 8; p.push([CIN.PART.x, .8 - Math.sin(t * PI) * .18, CIN.PART.z1 + .05 + t * .9]); } for (let k = 0; k < 8; k++) tube(p[k], p[k + 1], .025, '#b8334a', 6); }));
  for (const [z, k] of [[-.75, 1], [.25, 2]]) { const p = paperSheet(.34, .46, posterTex(k), { hold: 'pin', curl: k === 2 }); put(p, PART.x + .065, .66, z, 0, HP, 0); f.add(p); }

  // ── 다락 밑 (상영관 문 둘레): 앞·옆 판, 사다리 뒤 구석의 빗자루·쓰레받기·대걸레 통·기대 둔 필름 릴 ──────────────────────────
  f.add(mc('cin-underloft', ({ add }) => {
    const top = LOFT.y - .24;
    add(G.box(LOFT.x1 - 1.6, top, .08, .02), '#ead8c6', (1.6 + LOFT.x1) / 2, top / 2, LOFT.z1 - .09);
    add(G.box(LOFT.x1 - 1.6, .8, .09, .01), WAIN, (1.6 + LOFT.x1) / 2, .4, LOFT.z1 - .085);
    add(G.box(.08, top, LOFT.z1 - Z0, .02), '#ead8c6', LOFT.x1 - .04, top / 2, (Z0 + LOFT.z1) / 2);
    add(G.box(.09, .8, LOFT.z1 - Z0, .01), WAIN, LOFT.x1 - .035, .4, (Z0 + LOFT.z1) / 2);
    add(G.box(.08, top, LOFT.z1 - Z0, .02), '#ead8c6', LOFT.x0 + .04, top / 2, (Z0 + LOFT.z1) / 2);
    // 구석 살림: 대걸레 통(파랑)·대걸레, 빗자루·쓰레받기, 세워 둔 필름 릴
    add(G.cyl(.2, .17, .3, 14), '#4f86b8', 2.95, .15, -2.6); add(G.tor(.19, .02, PI * 2, 4, 16), '#3d6f9c', 2.95, .3, -2.6, HP, 0, 0);
    add(G.cyl(.018, .018, 1.25, 6), WOODD, 2.95, .72, -2.62, .12, 0, .08); add(G.box(.18, .1, .12, .03), '#e8e2d2', 2.95, .32, -2.64);
    add(G.cyl(.016, .016, 1.15, 6), '#c98f5a', 3.18, .62, -2.85, -.25, 0, -.18); add(G.box(.26, .2, .05, .02), '#d9a441', 3.31, .1, -2.83, -.25, 0, -.18);
    add(G.box(.26, .04, .2, .01), '#5f6e7e', 2.7, .02, -2.3); add(G.box(.26, .1, .02, .005), '#5f6e7e', 2.7, .06, -2.39);
    add(G.cyl(.36, .36, .06, 20), REEL, 2.82, .38, -2.08, .2, 0, HP); add(G.cyl(.1, .1, .08, 12), REELD, 2.82, .38, -2.08, .2, 0, HP);
    add(G.cyl(.27, .27, .065, 20), FILM, 2.82, .38, -2.08, .2, 0, HP);
  }));

  // ── 바깥: 가로등 하나 (앞 왼쪽), 따뜻한 등 ───────────────────────────────────────────────────────────────────
  f.add(mc('cin-lamp', ({ add, tube }) => {
    const x = -5.0, z = 3.75;
    add(G.cyl(.15, .19, .12, 12), '#3f4a5a', x, ISY + .06, z); add(G.cyl(.05, .065, 2.3, 10), '#3f4a5a', x, ISY + 1.22, z);
    tube([x, ISY + 2.35, z], [x + .2, ISY + 2.55, z - .05], .042, '#3f4a5a', 8);
    add(G.cone(.2, .16, 12), '#3f4a5a', x + .3, ISY + 2.6, z - .08); add(G.box(.22, .3, .03, .02), '#c4413f', x + .02, ISY + 1.7, z + .06);
  }));
  { const b = mesh(new THREE.SphereGeometry(.09, 10, 8), mat('#fff3d0', { emissive: GLOWC, ei: 1.3 }), { cast: false }); put(b, -4.7, ISY + 2.47, 3.67); f.add(b); f.add(halo(-4.7, ISY + 2.45, 3.67, 1.2, '#ffcf8a', .5)); f.add(pool(-4.75, ISY + .02, 3.7, 1.1, '#ffb86a', .35)); }

  // 바탕의 숨김 자리 (늘 보이는 곳): 무대 앞 끝 둘, 사다리 뒤 구석, 비상구 문턱, 오른쪽 화단 뒤
  f.spot('on', null, STAGE.x1 - .22, STAGE.h, STAGE.z1 - .25, { maxH: 0.55, label: '무대 앞 끝', scale: 1 });
  f.spot('on', null, STAGE.x1 - .25, STAGE.h, STAGE.z0 + .25, { maxH: 0.55, label: '무대 안쪽 끝', scale: 1 });
  f.spot('behind', null, 2.8, 0, -1.9, { maxH: 0.5, label: '대걸레 통 옆', scale: 1 });
  f.spot('on', null, PART.x + .02, PART.h + .06, .45, { maxH: 0.4, label: '칸막이 위', scale: 1 });
  f.spot('behind', null, 3.75, ISY, 3.72, { maxH: 0.5, label: '극장 앞 화단 뒤', scale: 1 });

  // 방 벽처럼 접기 + 섬은 그대로
  f.updateView = (Wd, dt = 1 / 60) => {
    if (!Wd || !Number.isFinite(Wd.yaw)) return;
    const sm = 1 - Math.exp(-Math.max(0, dt) * 12);
    for (const q of f.cinWalls) {
      const want = facingAway(f, q.n, Wd) ? 0 : 1, prev = q.k;
      q.k += (want - q.k) * sm; if (Math.abs(q.k - want) < .002) q.k = want;
      if (q.k === prev) continue;
      q.g.scale.y = q.stub + (1 - q.stub) * q.k;
      q.deco.visible = q.k > .65; q.g.visible = q.k > .3; q.knee.visible = q.k <= .3;
      Wd.shadowDirty = true; Wd.idsDirty = true;
    }
  };
};

// ── 거대 전구 간판 '별빛극장' (뒷벽 위에 높이 선 옛 극장식 세로 간판 — 판의 얼굴, 허브 10/24 "거대 소품 건물이 판의 얼굴·화면 꽉"):
// 글자 넷을 위에서 아래로(별·빛·극·장 — 영어는 STAR·LIGHT·CINE·MA), 둘레 전구, 꼭대기 부채꼴 왕관과 별, 뒤 철골 받침.
// f.bulbs: 켜질 순서(왼쪽 기둥 아래→위, 위 줄 왼→오, 오른쪽 기둥 위→아래, 아래 줄 오→왼), f.letters: 글자 넷(위→아래, 덩어리마다 재질 따로,
// 색만 그림) — 둘 다 f.live 안. 간판을 누르면 넷째 글자가 꺼지며 비뚤어져 '별빛극 장'(부품 하나, 한 번이면 그대로).
const MQW = 1.36, MQH = 3.9, MQD = .24, MQY0 = .3, MQYC = MQY0 + MQH / 2, MQLY = [0, 1, 2, 3].map(i => MQY0 + MQH - .52 - i * .95);
const MQBULBS = (() => {
  const out = [], top = MQY0 + MQH - .1, bot = MQY0 + .1, xl = -MQW / 2 + .1, xr = MQW / 2 - .1, n = 12;
  for (let k = 0; k < n; k++) out.push([xl, bot + .2 + (top - bot - .4) * k / (n - 1)]);
  for (let k = 0; k < 4; k++) out.push([xl + (xr - xl) * k / 3, top]);
  for (let k = n - 1; k >= 0; k--) out.push([xr, bot + .2 + (top - bot - .4) * k / (n - 1)]);
  for (let k = 3; k >= 0; k--) out.push([xl + (xr - xl) * k / 3, bot]);
  return out;
})();
const GLYPHS = {};
const glyphTex = s => GLYPHS[s] || (GLYPHS[s] = canvasTex(160, 160, (c, W, H) => {
  c.clearRect(0, 0, W, H);
  say(c, s, W / 2, H / 2 + 4, W * .9, s.length > 1 ? 64 : 132, '#fff6dc', { weight: 'bold', stroke: '#b8383d', sw: s.length > 1 ? 10 : 16 });
}));
B.cin_marquee = (f, T0) => {
  const sign = grp(); f.add(sign);
  sign.add(mc('cin-marquee', ({ add }) => {
    // 뒤 철골 받침: 다리 둘, 사선 버팀대, 가로대
    for (const sx of [-1, 1]) { add(G.box(.12, MQY0 + .2, .12, .02), IRON, sx * .44, (MQY0 + .2) / 2, -.04); add(G.box(.07, 1.3, .07, .01), IRON, sx * .44, .9, -.42, -.55, 0, 0); }
    for (const y of [1.2, 2.4, 3.6]) add(G.box(MQW - .2, .06, .06, .01), IRON, 0, y, -MQD / 2 - .05);
    add(G.box(MQW, MQH, MQD, .08), MQ, 0, MQYC, 0);
    add(G.box(MQW + .08, .1, MQD + .05, .02), GOLD, 0, MQY0 + MQH, 0); add(G.box(MQW + .08, .1, MQD + .05, .02), GOLD, 0, MQY0, 0);
    for (const sx of [-1, 1]) add(G.box(.1, MQH + .08, MQD + .05, .02), GOLD, sx * MQW / 2, MQYC, 0);
    // 왕관: 부채꼴(반원) 층 둘과 별
    const fan = (r) => { const sh = new THREE.Shape(); sh.moveTo(-r, 0); sh.absarc(0, 0, r, PI, 0, true); sh.closePath(); return sh; };
    add(ext(fan(.62), MQD, 16), MQ, 0, MQY0 + MQH + .04, -MQD / 2); add(ext(fan(.4), MQD + .04, 16), GOLD, 0, MQY0 + MQH + .04, -MQD / 2 - .02);
    for (let k = 1; k < 6; k++) { const a = PI - k * PI / 6; add(G.box(.025, .5, .03, .006), GOLDD, Math.cos(a) * .3, MQY0 + MQH + .06 + Math.sin(a) * .3, MQD / 2 + .01, 0, 0, a - HP); }
    add(G.ext(starShape(.22, .1), .06, 0, 4), GOLD, 0, MQY0 + MQH + .86, -.03);
    for (const [x, y] of MQBULBS) add(G.cyl(.038, .038, .04, 8), '#2c2440', x, y, MQD / 2 + .02, HP, 0, 0);
    for (const y of MQLY) add(G.box(.98, .86, .05, .04), '#3a2f55', 0, y, MQD / 2 + .01);
  }));
  // 전구 (하나하나 따로)
  const bg = new THREE.SphereGeometry(.058, 10, 8);
  f.bulbs = MQBULBS.map(([x, y]) => { const b = mesh(bg, own(BULB, { emissive: GLOWC, ei: 1.5 }), { cast: false }); put(b, x, y, MQD / 2 + .065); b.name = 'cin-bulb'; b.userData.noMerge = true; sign.add(b); return b; });
  // 글자 넷 (색만 그리는 판: 테두리선 없이, 발광 색을 ③이 바꿈)
  const words = LANG === 'en' ? ['STAR', 'LIGHT', 'CINE', 'MA'] : ['별', '빛', '극', '장'];
  f.letters = words.map((s, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.86, .8), toonMat({ color: '#fff3d6', map: glyphTex(s), transparent: true, alphaTest: .35, emissive: new THREE.Color(GLOWC), emissiveIntensity: .55 }));
    put(m, 0, MQLY[i], MQD / 2 + .045); m.name = 'cin-letter'; colourOnly(keep(m)); sign.add(m); return m;
  });
  (f.live || (f.live = [])).push(...f.bulbs, ...f.letters);
  f.dimLetter = 3;
  f.collideBox = [-MQW / 2 - .1, 0, -.6, MQW / 2 + .1, MQY0 + MQH + 1.1, .2];
  f.halo = halo(0, MQYC, -.25, 4.6, '#ffd9a0', .26); sign.add(f.halo);
  const L = f.letters[3], y0 = L.position.y, x0 = L.position.x, e0 = L.material.emissiveIntensity;
  const p = f.part('flick', sign, t => { const k = ss(t); L.rotation.z = -.42 * k; L.position.y = y0 - .1 * k; L.position.x = x0 + .06 * k; L.material.emissiveIntensity = e0 * (1 - .92 * k); }, { label: '간판 전구', sfx: 'click', dur: .8 });
  p.steps = [[0, 'click'], [.35, 'tick'], [.7, 'click']]; p.gpt2Reach = true;
  // (뒷벽이 접히면 간판도 숨음 — 카메라가 뒤로 돌았을 때; 간판은 카메라 쪽으로 조금 돌려 놓으므로 뒷벽 방향으로 잼)
  f.updateView = Wd => { if (Wd && Number.isFinite(Wd.yaw)) { const v = Math.cos(Wd.yaw) >= -.18; if (sign.visible !== v) { sign.visible = v; Wd.shadowDirty = true; Wd.idsDirty = true; } } };
};

// ── 매표소 = 거대 팝콘 통: 빨강·크림 줄무늬 통, 위로 넘치는 팝콘, 앞에 창구(유리·말구멍), 동전 접시 받침, 그 밑 서랍(code), 옆에 테이프 포스터 ──
B.cin_ticketbooth = (f, T0) => {
  const RB = .66, RT = .82, H = 2.6, rAt = y => RB + (RT - RB) * y / H;
  const body = mesh(new THREE.CylinderGeometry(RT, RB, H, 40), texMat(stripeTex(), { rough: .7 })); put(body, 0, H / 2, 0); f.add(body);
  f.add(mc('cin-kiosk', ({ add }) => {
    add(G.tor(RT + .01, .075, PI * 2, 8, 44), CREAM, 0, H, 0, HP, 0, 0); add(G.cyl(RB + .04, RB + .06, .1, 40), '#b8383f', 0, .05, 0);
    const r = rnd(17);
    for (let k = 0; k < 74; k++) { const a = r() * PI * 2, rr = RT * Math.sqrt(r()) * .95, y = H + .04 + (1 - (rr / RT) ** 2) * .46 + r() * .07, s = .09 + r() * .07; add(G.sph(s, 8, 6), [POP, POP, BUTTER, '#fff8e8'][k % 4], Math.cos(a) * rr, y, Math.sin(a) * rr, r(), r(), 0, [1, .85, 1]); }
    for (let k = 0; k < 9; k++) { const a = -.9 + k * .45 + r() * .2; add(G.sph(.08 + r() * .03, 8, 6), k % 3 ? POP : BUTTER, Math.sin(a) * (RT + .03), H - .05 - r() * .12, Math.cos(a) * (RT + .03)); }
    // 창구: 앞으로 튀어나온 상자, 금빛 테, 안쪽 어두움, 반쯤 친 크림 커튼
    const zf = rAt(1.38) + .04;
    add(G.box(.7, .56, .2, .03), CREAM, 0, 1.38, zf - .08); add(G.box(.58, .44, .04, .01), '#3b2c3a', 0, 1.38, zf - .02);
    for (const [w, h, x, y] of [[.66, .05, 0, 1.63], [.66, .05, 0, 1.13], [.05, .52, -.33, 1.38], [.05, .52, .33, 1.38]]) add(G.box(w, h, .05, .015), GOLD, x, y, zf + .02);
    add(G.box(.56, .12, .02, .01), '#f2e3c4', 0, 1.53, zf - .005);
    add(G.cyl(.05, .05, .012, 14), CHROME, 0, 1.27, zf + .035, HP, 0, 0);
    // 받침 (동전 접시·표 뭉치)
    add(G.box(.8, .05, .26, .015), WOOD, 0, 1.085, zf + .1); add(G.box(.8, .02, .02, .005), GOLDD, 0, 1.06, zf + .23);
    add(G.cyl(.09, .07, .024, 16), '#c9a446', -.2, 1.122, zf + .13); for (const [dx, dz] of [[-.03, .01], [.03, -.02], [.0, .035]]) add(G.cyl(.024, .024, .007, 10), '#e8d07a', -.2 + dx, 1.138, zf + .13 + dz);
    add(G.cyl(.045, .045, .09, 12), '#e8b0a0', .02, 1.155, zf + .1, 0, 0, HP); add(G.box(.06, .004, .1, .002), '#f6efe2', .1, 1.113, zf + .14, 0, .3, 0);
    // 서랍 집 (받침 밑)
    add(G.box(.62, .26, .2, .02), CREAM, 0, .9, zf - .08);
    // 간판 받침판과 작은 등
    add(G.box(.64, .24, .05, .02), CREAM, 0, 1.86, rAt(1.86) + .02); add(G.box(.04, .2, .04, .01), IRON, 0, 2.06, rAt(2.0) + .02); add(G.cone(.08, .07, 10), IRON, 0, 2.12, rAt(2.0) + .1);
  }));
  { const m = quad(.58, .19, texMat(kioskSignTex(), { rim: 0 })); put(m, 0, 1.86, rAt(1.86) + .047); f.add(m); }
  { const b = mesh(new THREE.SphereGeometry(.04, 8, 6), mat('#fff3d0', { emissive: GLOWC, ei: 1.3 }), { cast: false }); put(b, 0, 2.08, rAt(2.0) + .12); f.add(b); f.add(halo(0, 2.0, rAt(2.0) + .2, .8, '#ffcf8a', .4)); }
  { const zf = rAt(1.38) + .04; const g = mesh(new THREE.PlaneGeometry(.56, .42), mat('#cfe8f2', { opacity: .3, rim: 0 }), { cast: false }); put(g, 0, 1.38, zf + .005); f.add(keep(g)); }
  { const a = .95, r = rAt(1.2) + .015; const p = paperSheet(.4, .56, posterTex(2), { hold: 'tape' }); put(p, Math.sin(a) * r, 1.2, Math.cos(a) * r, 0, a, 0); f.add(p); }
  // 서랍 (code 자물쇠가 설 수 있음): 앞으로 빠짐, 안에 자리
  const zf = rAt(1.38) + .04, dv = grp(); put(dv, 0, .9, zf - .1); f.add(dv);
  f.collideBox = [-RT - .05, 0, -RT - .05, RT + .05, H + .5, zf + .25];
  dv.add(mc('cin-kiosk-drawer', ({ add }) => {
    add(G.box(.54, .22, .03, .015), '#c94a50', 0, 0, .12); add(G.box(.16, .03, .03, .01), GOLD, 0, .02, .145);
    add(G.box(.5, .02, .26, .005), '#e8d6c0', 0, -.09, 0); for (const sx of [-1, 1]) add(G.box(.02, .16, .26, .005), '#e8d6c0', sx * .24, -.02, 0); add(G.box(.5, .16, .02, .005), '#e8d6c0', 0, -.02, -.12);
  }));
  const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .25 * t; }, { label: '매표소 서랍', sfx: 'drawer', dur: .28 });
  p.lockable = true; p.lockKind = 'code'; p.lockAt = { x: .18, y: -.01, z: .15, parent: dv };
  f.spot('inside', dv, 0, -.08, -.01, { part: p, maxH: .17, label: '매표소 서랍 안', scale: .8 });
  f.spot('on', null, .26, 1.11, zf + .12, { maxH: .3, label: '매표 창구 받침', scale: .85 });
  f.spot('on', null, .05, H + .44, .12, { maxH: 0.45, label: '팝콘 통 꼭대기', scale: 1 });
};

// ── 오늘의 상영 판 (빈 틀): A자 받침에 검은 펠트 글자판 — 머리 띠만, 시각·제목 칸은 비어 있음(단서 소품은 ②) ───────────────
const showTex = once(() => canvasTex(256, 300, (c, W, H) => {
  c.fillStyle = '#2a2530'; c.fillRect(0, 0, W, H); c.fillStyle = '#c4413f'; c.fillRect(0, 0, W, 54);
  say(c, T('오늘의 상영'), W / 2, 28, W * .84, 30, '#ffe6a6', { weight: 'bold' });
  c.fillStyle = '#3a3440'; for (let y = 66; y < H - 6; y += 12) c.fillRect(8, y, W - 16, 2);
  c.fillStyle = '#f2ece2'; for (const [x, y, w] of [[30, 248, 9], [44, 252, 7]]) c.fillRect(x, y, w, 14);   // 떨어져 남은 흰 글자 조각 둘
}));
B.cin_showtimes = (f, T0) => {
  const W = .72, H = 1.0, tilt = .16;
  f.add(mc('cin-showtimes', ({ add }) => {
    for (const s of [1, -1]) { add(G.box(W + .08, H + .08, .05, .02), WOODD, 0, H / 2 + .02, s * .14, -s * tilt, 0, 0); }
    add(G.box(W + .14, .05, .08, .02), WOODD, 0, H + .07, 0); add(G.box(.05, .1, .34, .01), IRON, W / 2 + .06, H * .55, 0); add(G.box(.05, .1, .34, .01), IRON, -W / 2 - .06, H * .55, 0);
  }));
  const m = quad(W, H * .92, texMat(showTex(), { rim: .05 })); put(m, 0, H / 2 + .02, .14 + .03, -tilt); f.add(m);
  f.board = m;
  // (in front of the board, not under it: between the A-frame's legs a thing stayed about 24 px whatever it was — the board
  // above held it down, ② 10/24; on the open floor at the front it can be as big as the rest)
  f.spot('beside', null, 0, 0, .4, { maxH: .6, label: '상영 판 앞', scale: 1 });
};

// ── 팝콘 매점: 줄무늬 카운터(아래 칸 문 — pad 여분), 위에 유리 뚜껑 팝콘 기계, 그 위 벽 선반(열쇠가 걸림 → 팝콘이 넘치면 툭),
// 다락 앞면엔 메뉴판. 기계를 누르면 퐁퐁: 팝콘 더미가 부풀고 넘쳐 카운터·바닥으로 (f.popcornPile, f.spill), 걸린 열쇠는 카운터로 떨어짐(엔진 dropHung) ──
const menuStripTex = once(() => canvasTex(384, 72, (c, W, H) => {
  c.fillStyle = '#35503f'; c.fillRect(0, 0, W, H); c.strokeStyle = '#c9a46a'; c.lineWidth = 6; c.strokeRect(3, 3, W - 6, H - 6);
  say(c, T('매점'), 44, H / 2 + 1, 66, 26, '#ffe28a', { weight: 'bold' });
  [['팝콘', '3,000'], ['콜라', '1,500'], ['오징어', '2,000']].forEach(([a, b], i) => { const x = 98 + i * 96; say(c, T(a), x + 30, H / 2 - 10, 88, 17, '#f3efe2'); say(c, b, x + 30, H / 2 + 14, 80, 15, '#f6d98a'); });
}));
const popSignTex = once(() => canvasTex(160, 40, (c, W, H) => { c.fillStyle = '#c94a50'; c.fillRect(0, 0, W, H); say(c, LANG === 'en' ? 'POPCORN' : '팝콘', W / 2, H / 2 + 1, W * .86, 28, '#fff3d6', { weight: 'bold' }); }));
B.cin_popcorn = (f, T0) => {
  const CW = 1.0, CD = .56, CH = .88, MX = -.12, BACK = -.36, MENUZ = -.3;
  f.add(mc('cin-popcorn-counter', ({ add }) => {
    add(G.box(.04, CH, CD, .01), '#f3e2c8', -CW / 2 + .02, CH / 2, 0); add(G.box(.04, CH, CD, .01), '#f3e2c8', CW / 2 - .02, CH / 2, 0);
    add(G.box(CW, CH, .04, .01), '#f3e2c8', 0, CH / 2, -CD / 2 + .02); add(G.box(CW, .06, CD, .01), '#6a4a3e', 0, .03, 0);
    add(G.box(CW - .08, .02, CD - .08, .005), '#6a4a3e', 0, .42, -.02); add(G.box(CW - .08, CH - .1, .01, .005), '#5c4036', 0, CH / 2, -CD / 2 + .045);
    add(G.box(CW + .06, .05, CD + .06, .02), WOOD, 0, CH + .025, 0); add(G.box(CW + .06, .015, .02, .005), GOLDD, 0, CH, CD / 2 + .03);
    // 기계: 빨간 받침, 금빛 기둥 넷, 지붕, 위 글자판; 안쪽 주전자
    add(G.box(.52, .13, .4, .02), KRED, MX, CH + .115, 0); add(G.box(.54, .02, .42, .01), GOLD, MX, CH + .18, 0);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(G.box(.03, .42, .03, .008), GOLD, MX + sx * .245, CH + .4, sz * .185);
    add(G.box(.56, .07, .44, .02), KRED, MX, CH + .645, 0); add(G.box(.58, .02, .46, .01), GOLD, MX, CH + .61, 0);
    add(G.box(.36, .13, .03, .02), KRED, MX, CH + .745, 0);
    add(G.cyl(.085, .07, .1, 14), '#cfd3dc', MX + .03, CH + .5, -.02, .3, 0, .2); add(G.cyl(.01, .01, .1, 6), '#9aa0ad', MX + .03, CH + .58, -.02);
    // 카운터 위 살림: 컵에 꽂힌 빨대, 냅킨 통, 손전등
    add(G.cyl(.04, .035, .1, 10), '#f6efe2', .36, CH + .05, -.18); for (const dx of [-.01, .012]) add(G.cyl(.006, .006, .12, 5), ['#e0545c', '#4f86b8'][dx > 0 ? 1 : 0], .36 + dx, CH + .13, -.18, 0, 0, dx * 6);
    add(G.box(.12, .08, .06, .01), '#d9dde6', .2, CH + .04, -.2);
    // 위 선반 (다락 앞 밑, 쇠 받침 둘): 옛 필름 통 하나, 깡통 컵
    add(G.box(.74, .035, .2, .01), WOOD, MX, 1.82, BACK + .12); for (const sx of [-1, 1]) { add(G.box(.025, .16, .025, .005), IRON, MX + sx * .3, 1.89, BACK + .03); add(G.box(.025, .025, .16, .005), IRON, MX + sx * .3, 1.8, BACK + .1); }
    add(G.cyl(.12, .12, .035, 18), '#9aa0ad', MX - .2, 1.856, BACK + .12); add(G.cyl(.05, .05, .036, 12), '#6f7680', MX - .2, 1.857, BACK + .12);
    add(G.cyl(.035, .035, .08, 10), '#c9cfe0', MX + .27, 1.88, BACK + .1);
    // 메뉴판 받침 (다락 앞면)
    add(G.box(1.02, .24, .03, .02), '#2a3a30', 0, 2.08, MENUZ);
  }));
  { const m = quad(.98, .2, texMat(menuStripTex(), { rim: 0 })); put(m, 0, 2.08, MENUZ + .017); f.add(m); }
  { const m = quad(.34, .1, texMat(popSignTex(), { rim: 0 })); put(m, MX, CH + .745, .017); f.add(m); }
  // 아래 칸 문 (줄무늬 판): 왼쪽 경첩, 여분 pad 자물쇠 자리
  const dv = grp(); put(dv, -CW / 2 + .05, .08, CD / 2 + .01); f.add(dv);
  dv.add(mc('cin-popcorn-door', ({ add }) => { add(G.box(CW - .1, .74, .03, .01), '#f3e2c8', (CW - .1) / 2, .37, 0); add(G.sph(.025, 8, 6), GOLD, CW - .2, .4, .03); }));
  { const m = quad(CW - .16, .66, texMat(repTex(stripeTex(), 1, 1), { rim: .05 })); m.material.map.repeat.set(.6, 1); put(m, (CW - .1) / 2, .37, .017); dv.add(m); }
  const pd = f.part('door', dv, (t, b) => { dv.rotation.y = b.r.y - 1.55 * t; }, { label: '매점 카운터 아래 칸', sfx: 'open', dur: .32 });
  pd.lockable = true; pd.lockKind = 'pad'; pd.lockAt = { x: CW - .2, y: .52, z: .04, parent: dv };
  f.spot('inside', null, .05, .45, -.04, { part: pd, maxH: .36, label: '매점 카운터 아래 칸', scale: 1 });
  // 기계 몸 (누르는 곳)과 유리 뚜껑 (앞 유리, 위 경첩)
  const machine = grp(); put(machine, MX, CH + .18, 0); f.add(machine);
  // (유리는 뒤·옆 세 장뿐 — 앞은 뚜껑: 닫힌 상자면 뚜껑을 열어도 안이 막혀 '팝콘 기계 안' 자리가 어느 쪽에서도 안 보였음)
  { const gm = mat('#dff3ff', { opacity: .28, rim: 0, side: THREE.DoubleSide });
    machine.add(keep(put(mesh(new THREE.PlaneGeometry(.48, .42), gm, { cast: false }), 0, .22, -.19)));
    for (const sx of [-1, 1]) machine.add(keep(put(mesh(new THREE.PlaneGeometry(.36, .42), gm, { cast: false }), sx * .24, .22, -.01, 0, HP, 0))); }
  const pile = grp(); put(pile, 0, .02, 0); machine.add(pile);
  pile.add(mc('cin-popcorn-pile', ({ add }) => { const r = rnd(5); for (let k = 0; k < 34; k++) add(G.sph(.045 + r() * .02, 7, 5), [POP, POP, BUTTER][k % 3], (r() - .5) * .38, .03 + r() * .07, (r() - .5) * .28); }));
  const spill = grp(); f.add(spill);
  const SP = []; { const r = rnd(9); for (let k = 0; k < 18; k++) { const floor = k > 12, x = floor ? (r() - .4) * .7 : MX + (r() - .5) * .8, z = floor ? CD / 2 + .12 + r() * .35 : (r() - .2) * .4, y = floor ? .03 : CH + .07; if (!floor && Math.abs(x - MX) < .27 && Math.abs(z) < .2) continue; SP.push([x, y, z]); } }
  SP.forEach(([x, y, z], k) => { const m = mesh(new THREE.SphereGeometry(.05, 7, 5), mat(k % 3 ? POP : BUTTER), { cast: false }); m.scale.set(0, 0, 0); put(m, x, y, z); m.userData.y0 = y; m.userData.noMerge = true; spill.add(m); });
  f.popcornPile = pile; f.spill = spill; (f.live || (f.live = [])).push(pile, spill);
  const lid = grp(); put(lid, MX, CH + .6, .2); f.add(lid);
  lid.add(keep(put(mesh(new THREE.PlaneGeometry(.46, .38), mat('#dff3ff', { opacity: .35, rim: 0, side: THREE.DoubleSide }), { cast: false }), 0, -.2, 0)));
  lid.add(mc('cin-popcorn-lid', ({ add }) => { add(G.box(.48, .025, .02, .006), GOLD, 0, -.39, 0); add(G.box(.48, .02, .02, .006), GOLD, 0, -.01, 0); for (const sx of [-1, 1]) add(G.box(.02, .4, .02, .006), GOLD, sx * .235, -.2, 0); add(G.sph(.025, 8, 6), '#ffffff', 0, -.36, .03); }));
  const n = SP.length;
  const p = f.part('lid', [lid, machine], t => {
    lid.rotation.x = -2.6 * ss(Math.min(1, t * 2.2));
    const k = ss(t); pile.scale.set(1 + .15 * k, 1 + 1.7 * k, 1 + .15 * k);
    spill.children.forEach((m, i) => { const s = ss((t - .22 - .6 * i / n) / .16); m.scale.setScalar(s); m.position.y = m.userData.y0 + (1 - s) * .3; });
  }, { label: '팝콘 기계', sfx: 'pop', dur: 1.5 });
  p.steps = [[0, 'pop'], [.18, 'pop'], [.34, 'pop'], [.5, 'pop'], [.66, 'pop'], [.84, 'pop']]; p.gpt2Reach = true;
  f.spot('inside', machine, 0, .15, .03, { part: p, maxH: .24, label: '팝콘 기계 안', scale: .75 });
  // 걸린 열쇠가 떨어질 자리 (판짜기는 안 씀 — reserved), 위 선반의 열쇠 고리 자리(hang)
  f.spot('inside', null, MX + .38, CH + .055, .16, { part: p, maxH: .2, label: '넘친 팝콘 사이', scale: .8 }).reserved = true;
  f.keySpot = f.spot('on', null, MX + .1, 1.84, BACK + .12, { maxH: .24, label: '팝콘 위 선반', scale: .8 });
  f.keySpot.hang = p;
  f.spot('on', null, .34, CH + .05, .1, { maxH: 0.45, label: '매점 카운터 위', scale: 1 });
};

// ── 상영관 문: 다락 밑 앞면의 쌍여닫이 (빨간 가죽 누빔·황동 징·둥근 창), 뒤에 얕은 칸(소화기·우산), 다락 앞면엔 '상영관' 글자 ─────────
B.cin_hall_door = (f, T0) => {
  const DW = .52, DH = 1.68, Z = .06;
  f.add(mc('cin-halldoor', ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.09, 1.9, .16, .02), WAIND, sx * .56, .95, 0);
    add(G.box(1.21, .1, .16, .02), WAIND, 0, 1.85, 0); add(G.box(1.25, .03, .18, .01), GOLD, 0, 1.9, 0);
    // 문 뒤 얕은 칸
    add(G.box(1.04, 1.8, .04, .01), '#5a2f33', 0, .9, -.42); for (const sx of [-1, 1]) add(G.box(.04, 1.8, .44, .01), '#6a3a3c', sx * .5, .9, -.2);
    add(G.box(1.04, .02, .44, .005), '#8a3f46', 0, .01, -.2);
    add(G.cyl(.07, .07, .34, 12), '#d9453f', -.38, .17, -.32); add(G.cyl(.03, .03, .06, 8), '#3a3540', -.38, .37, -.32);
    add(G.box(.86, .04, .02, .005), GOLDD, 0, 1.3, -.39);
    // 다락 앞면 글자 받침
    add(G.box(.86, .24, .03, .02), '#6a2a36', 0, 2.08, .15);
  }));
  { const m = quad(.82, .2, texMat(hallSignTex(), { rim: 0 })); put(m, 0, 2.08, .167); f.add(m); }
  // (문짝 둘: 경첩이 바깥, 만나는 쪽이 가운데 — s = -1 왼쪽, 1 오른쪽)
  const leaf = (s) => {
    const pv = grp(); put(pv, s * (DW + .02), .06, Z); f.add(pv);
    pv.add(mc('cin-halldoor-leaf|' + s, ({ add }) => {
      add(G.box(DW, DH, .06, .03), '#a8434c', -s * DW / 2, DH / 2, 0);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) add(G.sph(.014, 6, 5), GOLD, -s * DW / 2 - .18 + i * .12, .2 + j * .2, .034);
      add(G.cyl(.1, .1, .02, 18), '#3b3446', -s * DW / 2, 1.32, .03, HP, 0, 0); add(G.tor(.1, .02, PI * 2, 6, 20), GOLD, -s * DW / 2, 1.32, .04);
      add(G.box(.08, .26, .02, .006), GOLD, -s * (DW - .07), .95, .04);
    }));
    return pv;
  };
  const L = leaf(-1), R = leaf(1);
  const p = f.part('door', [L, R], (t, a, b) => { L.rotation.y = a.r.y - 1.45 * t; R.rotation.y = b.r.y + 1.45 * t; }, { label: '상영관 문', sfx: 'door', dur: .45 });
  p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: -DW + .05, y: .95, z: .06, parent: R };
  f.spot('inside', null, -.2, .02, -.24, { part: p, maxH: .55, label: '상영관 문 안', scale: 1 });
  f.spot('inside', null, .24, .02, -.24, { part: p, maxH: .55, label: '상영관 문 안 오른쪽', scale: 1 });
};

// ── 접이식 좌석 줄 (빨간 벨벳, 나무 등판, 쇠 팔걸이 다리): 좌석마다 접히는 부품, 좌석 밑 숨김 자리 (opts.n 좌석 수, opts.under 자리 둘 좌석) ──
const seatParts = (f, xs, wide = false) => xs.map(x => {
  const pv = grp(); put(pv, x, .44, -.12); f.add(pv);
  const w = wide ? 1.04 : .48;
  pv.add(mc('cin-seat-cushion|' + w, ({ add }) => { add(G.box(w, .11, .42, .05), VELVET, 0, 0, .21); add(G.box(w - .02, .03, .4, .01), VELVETD, 0, -.065, .21); add(G.box(w * .4, .015, .012, .004), shade(VELVET, .15), 0, .056, .4); }));
  return { pv, x };
});
B.cin_seatrow = (f, T0, o = {}) => {
  const n = o.n || 4, SPC = .6, x0 = -(n - 1) / 2 * SPC, xs = Array.from({ length: n }, (_, i) => x0 + i * SPC);
  f.add(mc('cin-seatrow|' + n, ({ add }) => {
    for (const x of xs) {
      add(G.box(.5, .56, .1, .05), VELVET, x, .74, -.2, -.1, 0, 0); add(G.box(.52, .58, .04, .03), SEATBK, x, .75, -.27, -.1, 0, 0);
      for (const [bx, by] of [[-.12, .84], [.12, .84], [-.12, .64], [.12, .64]]) add(G.sph(.018, 6, 5), VELVETD, x + bx, by, -.146 + (by - .74) * .1);
      add(G.box(.1, .03, .012, .004), GOLD, x, 1.0, -.31, -.1, 0, 0);
      add(G.box(.42, .04, .06, .01), IRON, x, .34, -.12);
    }
    for (let i = 0; i <= n; i++) { const x = x0 - SPC / 2 + i * SPC, end = i === 0 || i === n;
      add(G.box(end ? .07 : .05, .6, .46, .02), end ? IRON : '#5a5468', x, .3, -.04); add(G.box(.08, .05, .48, .02), WOODD, x, .63, -.02);
      if (end) { const ox = x + (i ? .04 : -.04); add(G.tor(.1, .02, PI * 2, 6, 16), GOLD, ox, .34, -.04, 0, HP, 0); add(G.sph(.04, 8, 6), GOLD, ox, .34, -.04); } }
    add(G.box(n * SPC + .1, .04, .08, .01), IRON, 0, .03, -.22);
  }));
  const under = new Set(o.under || xs.map((_, i) => i).filter(i => i % 2 === 1));
  f.seats = seatParts(f, xs).map(({ pv, x }, i) => {
    const p = f.part('lift', pv, (t, b) => { pv.rotation.x = b.r.x - 1.45 * t; }, { label: '접이식 좌석', sfx: 'lift', dur: .28 });
    if (under.has(i)) f.spot('inside', null, x, .02, .1, { part: p, maxH: .3, label: '좌석 밑', scale: .85 });
    return p;
  });
};
// ── 붙어 있는 의자 두 개 (커플석): 가운데 팔걸이 없이 한 방석, 두 등판 사이 황동 사슬과 하트 판 ───────────────────────────
B.cin_twinseat = (f, T0) => {
  const xs = [-.28, .28];
  f.add(mc('cin-twinseat', ({ add, tube }) => {
    for (const x of xs) { add(G.box(.5, .58, .1, .05), VELVET, x, .75, -.2, -.1, 0, 0); add(G.box(.52, .6, .04, .03), SEATBK, x, .76, -.27, -.1, 0, 0);
      for (const [bx, by] of [[-.12, .86], [.12, .86], [-.12, .66], [.12, .66]]) add(G.sph(.018, 6, 5), VELVETD, x + bx, by, -.146 + (by - .75) * .1); }
    for (const x of [-.6, .6]) { add(G.box(.07, .6, .46, .02), IRON, x, .3, -.04); add(G.box(.08, .05, .48, .02), WOODD, x, .63, -.02); }
    add(G.box(1.16, .04, .06, .01), IRON, 0, .34, -.12); add(G.box(1.26, .04, .08, .01), IRON, 0, .03, -.22);
    // 사슬 (등판 꼭대기 사이로 처짐)과 하트 판
    for (let k = 0; k < 5; k++) { const t = (k + .5) / 5, x = -.18 + t * .36, y = 1.02 - Math.sin(t * PI) * .07; add(G.tor(.022, .006, PI * 2, 4, 10), GOLD, x, y, -.28, 0, k % 2 ? HP : 0, 0); }
    const hs = new THREE.Shape(); hs.moveTo(0, -.05); hs.bezierCurveTo(-.01, -.04, -.06, -.01, -.06, .02); hs.bezierCurveTo(-.06, .05, -.02, .06, 0, .03); hs.bezierCurveTo(.02, .06, .06, .05, .06, .02); hs.bezierCurveTo(.06, -.01, .01, -.04, 0, -.05);
    add(G.ext(hs, .015, 0, 6), GOLD, 0, .94, -.3);
  }));
  const [{ pv }] = seatParts(f, [0], true);
  const p = f.part('lift', pv, (t, b) => { pv.rotation.x = b.r.x - 1.45 * t; }, { label: '커플석 방석', sfx: 'lift', dur: .3 });
  f.seats = [p];
  f.spot('inside', null, 0, .02, .1, { part: p, maxH: .3, label: '커플석 밑', scale: .9 });
  f.spot('behind', null, 0, 0, -.48, { maxH: 0.5, label: '커플석 뒤', scale: 1 });
};

// ── 스크린: 검은 테 안의 흰 면(이름 'cin-screen' — '-screen'으로 끝남, TV와 같은 규칙) + 필름 판 f.film(숨김, art/cinema/film.png) ─────────
export const FILM_PATH = 'art/cinema/film.png';
let FILMT = null;
const filmImage = () => {
  if (FILMT || typeof Image === 'undefined') return FILMT;
  FILMT = new THREE.Texture(); FILMT.colorSpace = THREE.SRGBColorSpace;
  const im = new Image(); im.decoding = 'async'; im.onload = () => { FILMT.image = im; FILMT.needsUpdate = true; }; im.src = FILM_PATH;
  return FILMT;
};
B.cin_screen = (f, T0) => {
  const SW = 3.0, SH = 1.7, YC = 1.42;
  f.add(mc('cin-screen-frame', ({ add }) => {
    add(G.box(SW + .3, SH + .3, .08, .03), '#26222c', 0, YC, -.05);
    for (const sx of [-1, 1]) add(G.box(.1, YC - SH / 2 - .12, .1, .02), '#3a3540', sx * (SW / 2 - .25), (YC - SH / 2 - .12) / 2, -.08);
    add(G.box(SW + .4, .06, .14, .02), GOLDD, 0, YC + SH / 2 + .18, -.03);
  }));
  const g = new THREE.PlaneGeometry(SW, SH); g.name = 'cin-screen';
  const scr = mesh(g, mat('#f2ede4', { rough: .95, rim: .04 }), { cast: false }); scr.name = 'cin-screen'; scr.userData.noMerge = true; put(scr, 0, YC, .006); f.add(scr);
  const film = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), basic(filmImage(), '#ffffff', { transparent: true })); film.name = 'cin-film'; film.userData.noMerge = true; film.visible = false; put(film, 0, YC, .014); f.add(film);
  f.screen = scr; f.film = film; f.filmPath = FILM_PATH; f.screenSize = [SW, SH];
};

// ── 무대 커튼: 주름진 진홍 벨벳 두 폭(부품 하나 — 누르면 가운데서 갈라져 양옆으로 주름이 모이며 걷힘), 위 휘장(스왁·금술·별 메달), 양옆 묶은 커튼,
// 오른쪽 끝(카메라 쪽) 굵은 줄과 큰 금술 — 줄도 같은 부품이라 줄을 눌러도 열림 ──
const pleat = (w, h, A = .05, lam = .22, th = .02) => {
  const n = Math.max(8, Math.round(w / .02)), k = PI * 2 / lam, sh = new THREE.Shape();
  sh.moveTo(-w / 2, th / 2); for (let i = 1; i <= n; i++) { const u = -w / 2 + w * i / n; sh.lineTo(u, A * Math.sin(k * (u + w / 2)) + th / 2); }
  for (let i = n; i >= 0; i--) { const u = -w / 2 + w * i / n; sh.lineTo(u, A * Math.sin(k * (u + w / 2)) - th / 2); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 4 }); g.rotateX(-HP); return g;
};
B.cin_curtain = (f, T0) => {
  const CW = 3.3, CH = 2.38, TOP = 2.44, CX = -(CW / 2 + .5);
  f.add(mc('cin-curtain-frame', ({ add }) => {
    add(G.box(CW + .7, .46, .14, .04), CURTAIND, 0, TOP + .16, .02);
    for (let k = 0; k < 4; k++) add(G.tor(.42, .07, PI, 6, 18), CURTAIN, -CW / 2 + .42 + k * .82, TOP + .02, .1, 0, 0, PI);
    add(G.box(CW + .7, .04, .16, .01), GOLD, 0, TOP + .39, .03); for (let k = 0; k < 22; k++) add(G.cyl(.012, .006, .09, 5), GOLD, -CW / 2 - .3 + k * .18, TOP - .08 + (k % 4 === 1 || k % 4 === 2 ? -.06 : 0), .16);
    add(G.ext(starShape(.13, .06), .04, 0, 4), GOLD, 0, TOP + .17, .1);
    for (const s of [-1, 1]) { add(pleat(.5, 2.52, .045, .17), CURTAIND, s * (CW / 2 + .12), .0, .08); add(G.tor(.13, .03, PI * 2, 6, 16), GOLD, s * (CW / 2 + .12), 1.05, .1, HP, 0, 0); add(G.sph(.05, 8, 6), GOLD, s * (CW / 2 + .2), .95, .18); }
    add(G.box(.5, .05, .05, .02), GOLDD, CX + .2, TOP + .3, .1);
  }));
  // 가운데서 갈라지는 두 폭: 바깥 끝(축)으로 주름이 모이며 걷힘 — 진짜 무대 막처럼 (위로 걷으면 차양처럼 화면 윗부분을, 관객 쪽으로 말면
  // 화면 앞을 가렸음); 주름 물결은 그대로라 모일수록 주름이 깊어 보임
  const half = s => {
    const pv = grp(); put(pv, s * CW / 2, 0, s > 0 ? .015 : 0); f.add(pv);
    pv.add(put(mesh(pleat(CW / 2 + .04, CH), mat(CURTAIN, { rough: .92, side: THREE.DoubleSide })), -s * CW / 4, .05, 0));
    pv.add(put(mesh(pleat(CW / 2 + .04, .07, .05, .22, .03), mat(GOLD, { side: THREE.DoubleSide })), -s * CW / 4, .02, 0));
    return pv;
  };
  const pl = half(-1), pr = half(1);
  const draw = (pv, b, t) => { const k = ss(t); pv.scale.x = b.s.x * (1 - .8 * k); pv.position.z = b.p.z + .05 * Math.sin(k * PI); };
  const cord = grp(); f.add(cord);
  cord.add(mc('cin-curtain-cord', ({ add, tube }) => {
    tube([CX, TOP + .3, .1], [CX, 1.0, .1], .028, '#e0b864', 6);
    add(G.sph(.1, 12, 10), GOLD, CX, .95, .1); add(G.cone(.13, .22, 14), '#e8c25a', CX, .78, .1, PI, 0, 0);
    for (let k = 0; k < 10; k++) { const a = k / 10 * PI * 2; add(G.cyl(.008, .006, .14, 4), GOLDD, CX + Math.cos(a) * .09, .62, .1 + Math.sin(a) * .09); }
    add(G.tor(.07, .022, PI * 2, 6, 16), '#b8334a', CX, 1.06, .1, HP, 0, 0);
  }));
  // (줄을 한 번 아래로 당겼다 놓는 동작 + 두 폭이 말려 젖혀짐)
  const p = f.part('lift', [pl, pr, cord], (t, a, b, c) => { draw(pl, a, t); draw(pr, b, t); cord.position.y = c.p.y - .2 * Math.sin(Math.min(1, t * 2.6) * PI); }, { label: '무대 커튼', sfx: 'swish', dur: 1.1 });
  p.gpt2Reach = true; f.cord = cord;
  f.spot('inside', null, .7, .02, -.13, { part: p, maxH: 0.45, label: '커튼 뒤 무대', scale: 1 });
};

// ── 2층 영사실 = 거대 영사기 모양 방: 청록 철판 몸, 지붕 위 릴 둘(f.reels — ③이 돌릴 수 있음), 서쪽 끝 렌즈 통(영사 창),
// 앞면 둥근 문(위 경첩으로 들림 — color 자물쇠가 설 수 있음), 안쪽은 얕은 방(불 켜진 전구, 필름 상자 위·바닥 자리) ──
const BOOTHG = { W: 2.1, D: 1.14, H: 1.45, HX: .1, HY: .68, HR: .52, LENS: [-2.1 / 2 - .62, .78, 0] };
export const CIN_BOOTH = BOOTHG;
const reelGroup = (r, key) => {
  const g = grp(), s = new THREE.Shape(); circle(s, 0, 0, r); for (let k = 0; k < 5; k++) { const a = HP + k * PI * 2 / 5; s.holes.push(circle(new THREE.Path(), Math.cos(a) * r * .55, Math.sin(a) * r * .55, r * .22)); }
  g.add(mc('cin-reel|' + key, ({ add }) => { for (const z of [.06, -.1]) add(ext(s, .035, 20), REEL, 0, 0, z); add(G.cyl(r * .78, r * .78, .12, 24), FILM, 0, 0, -.02, HP, 0, 0); add(G.cyl(r * .2, r * .2, .2, 14), REELD, 0, 0, -.02, HP, 0, 0); add(G.tor(r, .02, PI * 2, 4, 32), REELD, 0, 0, .08); }));
  return g;
};
B.cin_projroom_door = (f, T0) => {
  const { W: BW, D: BD, H: BH, HX, HY, HR } = BOOTHG, FZ = BD / 2;
  f.add(mc('cin-booth', ({ add }) => {
    add(G.box(BW, .06, BD, .02), BOOTHD, 0, .03, 0);
    add(G.box(BW, BH, .08, .03), BOOTH, 0, BH / 2, -FZ + .04);
    for (const sx of [-1, 1]) add(G.box(.08, BH, BD, .03), BOOTH, sx * (BW / 2 - .04), BH / 2, 0);
    add(G.box(BW + .14, .14, BD + .14, .06), BOOTHD, 0, BH + .07, 0); add(G.box(BW + .18, .04, BD + .18, .02), CHROME, 0, BH + .005, 0);
    const fs = new THREE.Shape(); rrect(fs, -BW / 2, 0, BW / 2, BH, .06); fs.holes.push(circle(new THREE.Path(), HX, HY, HR));
    add(ext(fs, .08, 28), BOOTH, 0, 0, FZ - .08);
    add(G.tor(HR + .03, .045, PI * 2, 6, 40), CHROME, HX, HY, FZ + .01);
    add(G.box(BW - .06, .16, .03, .02), BOOTHD, 0, .1, FZ + .01);
    for (let k = 0; k < 5; k++) add(G.box(.26, .035, .03, .01), BOOTHD, .84, .5 + k * .09, FZ + .01);
    for (const [x, y] of [[-.98, .24], [-.98, 1.3], [.98, .24], [.98, 1.3], [-.5, 1.36], [.5, 1.36]]) add(G.sph(.024, 6, 5), CHROME, x, y, FZ + .01);
    // 렌즈 통 (서쪽 끝 = 영사 창)
    add(G.cyl(.34, .32, .16, 28), BOOTHD, -BW / 2 - .08, .78, 0, 0, 0, HP); add(G.cyl(.27, .31, .42, 28), '#4a5560', -BW / 2 - .37, .78, 0, 0, 0, HP);
    add(G.tor(.28, .04, PI * 2, 6, 30), CHROME, -BW / 2 - .58, .78, 0, 0, HP, 0); add(G.cyl(.06, .06, .12, 10), CHROME, -BW / 2 - .3, 1.13, 0);
    // 지붕 릴 받침 팔
    for (const [x, r] of [[-.42, .6], [.62, .5]]) add(G.box(.06, r + .12, .06, .01), CHROME, x, BH + .14 + (r + .12) / 2, -.16);
    // 안쪽: 짙은 판, 필름 상자 (위 자리), 천장 등 받침
    add(G.box(BW - .2, BH - .2, .02, .01), '#3d4a52', 0, BH / 2, -FZ + .09);
    add(G.box(.42, .28, .32, .03), '#8a6a52', .2, .2, .1); add(G.box(.44, .03, .34, .01), '#6c5242', .2, .35, .1);
    add(G.cyl(.04, .05, .06, 10), IRON, -.1, BH - .05, -.05);
  }));
  { const m = quad(.44, .15, texMat(boothPlateTex(), { rim: 0 })); put(m, -.66, 1.08, FZ + .015); f.add(m); }
  { const b = mesh(new THREE.SphereGeometry(.06, 10, 8), mat('#fff3d0', { emissive: GLOWC, ei: 1.2 }), { cast: false }); put(b, -.1, BH - .12, -.05); f.add(b); }
  { const b = mesh(new THREE.SphereGeometry(.04, 8, 6), mat('#ff7a6a', { emissive: '#ff5a4a', ei: 1.0 }), { cast: false }); put(b, -.66, 1.24, FZ + .04); f.add(b); }
  { const g = mesh(new THREE.CircleGeometry(.24, 24), mat('#cfe8ff', { emissive: '#9fd0ff', ei: .5, rim: 0 }), { cast: false }); put(g, -BW / 2 - .585, .78, 0, 0, -HP, 0); f.add(g); }
  // 지붕 위 릴 둘 (f.reels, f.live)
  f.reels = [[-.42, .6], [.62, .5]].map(([x, r], i) => { const g = reelGroup(r, 'b' + i); put(g, x, BH + .14 + r + .03, -.06); f.add(g); return g; });
  (f.live || (f.live = [])).push(...f.reels);
  // 둥근 문 (위 경첩, 들려 올라감)
  const pv = grp(); put(pv, HX, HY + HR, FZ + .03); f.add(pv);
  pv.add(mc('cin-booth-hatch', ({ add }) => {
    add(G.cyl(HR + .02, HR + .02, .06, 36), '#8db5b5', 0, -HR, .02, HP, 0, 0); add(G.tor(HR - .04, .025, PI * 2, 4, 36), CHROME, 0, -HR, .055);
    add(G.cyl(.13, .13, .03, 20), '#2c3a44', 0, -HR + .06, .05, HP, 0, 0); add(G.tor(.13, .025, PI * 2, 6, 20), CHROME, 0, -HR + .06, .065);
    add(G.box(.28, .05, .05, .02), CHROME, 0, -HR * 1.78, .08);
  }));
  const p = f.part('lid', pv, (t, b) => { pv.rotation.x = b.r.x - 1.72 * t; }, { label: '영사실 문', sfx: 'open_metal', dur: .5 });
  p.lockable = true; p.lockKind = 'color'; p.lockAt = { x: .26, y: -HR * 1.7, z: .08, parent: pv };
  f.spot('inside', null, -.22, .07, .2, { part: p, maxH: .45, label: '영사실 안 바닥', scale: 1 });
  f.spot('inside', null, .2, .37, .12, { part: p, maxH: .3, label: '영사실 필름 상자 위', scale: 1 });
  f.spot('on', null, .1, BH + .14, .28, { maxH: 0.45, label: '영사실 지붕 위', scale: 1 });
};

// ── 영사기 (영사실 안): 쇠 받침대 위 청록 몸, 앞뒤 릴(f.reels), 렌즈 통, 옆의 크고 또렷한 손잡이(빨간 손잡이 바퀴) — 누르면 저절로 드르륵
// 감김(부품 하나, 한 번이면 그대로). f.lensAt: 영사 창(영사실 렌즈 통 끝) 앵커, f.beam: 거기서 스크린까지 빛줄기(기본 꺼짐, 색만 그림) ──
const beamGeo = (w0, h0, w1, h1, L) => {
  const v = [[-w0, -h0, 0], [w0, -h0, 0], [w0, h0, 0], [-w0, h0, 0], [-w1, -h1, L], [w1, -h1, L], [w1, h1, L], [-w1, h1, L]].map(([x, y, z]) => [x / 2, y / 2, z]);
  const pos = [], quadAt = (a, b, c, d) => pos.push(...v[a], ...v[b], ...v[c], ...v[a], ...v[c], ...v[d]);
  quadAt(0, 1, 5, 4); quadAt(1, 2, 6, 5); quadAt(2, 3, 7, 6); quadAt(3, 0, 4, 7);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
};
B.cin_projector = (f, T0, o = {}) => {
  const body = grp(); f.add(body);
  body.add(mc('cin-projector', ({ add }) => {
    add(G.box(.42, .04, .32, .02), IRON, 0, .02, 0); add(G.cyl(.05, .07, .4, 10), IRON, 0, .24, 0); add(G.box(.32, .04, .5, .02), IRON, 0, .45, 0);
    add(G.box(.26, .3, .5, .07), '#3e5a5f', 0, .62, 0); add(G.box(.27, .04, .51, .02), CHROME, 0, .78, 0);
    add(G.cyl(.1, .1, .22, 16), '#4a6a70', 0, .86, -.15); add(G.cyl(.05, .05, .1, 10), '#2e3e44', 0, 1.0, -.15);
    add(G.cyl(.065, .07, .2, 16), '#2e3e44', 0, .64, .34, HP, 0, 0); add(G.tor(.066, .015, PI * 2, 4, 18), CHROME, 0, .64, .44);
    add(G.box(.04, .3, .04, .01), CHROME, 0, .92, .14, .3, 0, 0); add(G.box(.04, .3, .04, .01), CHROME, 0, .9, -.24, -.3, 0, 0);
    add(G.cyl(.12, .12, .03, 20), '#c9a446', .145, .62, .02, 0, 0, HP);
  }));
  { const g = mesh(new THREE.CircleGeometry(.05, 16), mat('#e8f4ff', { emissive: '#bfe0ff', ei: .6, rim: 0 }), { cast: false }); put(g, 0, .64, .445); body.add(g); }
  // 릴 둘 (옆으로 봄: 면이 ±x)
  f.reels = [[.14, 1.08, .2], [-.24, 1.04, .2]].map(([z, y, r], i) => { const g = reelGroup(r, 'p' + i); put(g, 0, y, z, 0, HP, 0); body.add(g); return g; });
  (f.live || (f.live = [])).push(...f.reels);
  // 손잡이 (옆, 카메라 쪽): 황동 바퀴 + 굵은 팔 + 큰 빨간 손잡이
  const crank = grp(); put(crank, .17, .62, .02); f.add(crank);
  crank.add(mc('cin-projector-crank', ({ add }) => {
    add(G.cyl(.06, .06, .05, 14), GOLD, .02, 0, 0, 0, 0, HP); add(G.box(.04, .26, .05, .015), CHROME, .05, -.12, 0);
    add(G.cyl(.022, .022, .12, 10), CHROME, .1, -.24, 0, 0, 0, HP); add(G.sph(.075, 14, 10), '#e0453f', .17, -.24, 0); add(G.sph(.025, 8, 6), '#ffd0c8', .19, -.21, .04);
  }));
  const reels = f.reels;
  const p = f.part('crank', [crank, body], (t, b) => { crank.rotation.x = b.r.x - t * PI * 4; reels[0].rotation.z = -t * PI * 3; reels[1].rotation.z = -t * PI * 4; }, { label: '영사기 손잡이', sfx: 'ratchet', dur: 1.1 });
  p.steps = [[0, 'ratchet'], [.2, 'ratchet'], [.4, 'ratchet'], [.6, 'ratchet'], [.8, 'ratchet'], [.97, 'click']]; p.gpt2Reach = true;
  f.crank = crank;
  // 영사 창 앵커와 빛줄기 (opts.lens: 영사기 기준 영사 창 자리, opts.aim: 거기서 스크린 가운데까지, opts.beamSize: 스크린에 닿는 크기)
  const [lx, ly, lz] = o.lens || [0, .64, .45], aim = new THREE.Vector3(...(o.aim || [0, -.2, 4])), [bw, bh] = o.beamSize || [2.6, 1.5];
  const lensAt = new THREE.Object3D(); lensAt.name = 'cin-lens'; put(lensAt, lx, ly, lz); f.add(lensAt); f.lensAt = lensAt;
  const beam = grp(); beam.name = 'cin-beam'; beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), aim.clone().normalize()); lensAt.add(beam);
  const bm = o2 => new THREE.MeshBasicMaterial({ color: '#fff1d0', transparent: true, opacity: o2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  beam.add(new THREE.Mesh(beamGeo(.34, .26, bw, bh, aim.length()), bm(.16)), new THREE.Mesh(beamGeo(.2, .15, bw * .7, bh * .7, aim.length()), bm(.14)));
  beam.children.forEach(m => { m.renderOrder = 5; });
  colourOnly(keep(beam)); beam.visible = false; f.beam = beam; (f.live || (f.live = [])).push(beam);
  // (부딪힘은 영사기 몸만 — 꺼진 빛줄기가 객석 위 상자로 잡혀 상영관 문이 덜 열렸음)
  f.collideBox = [-.24, 0, -.36, .4, 1.3, .48];
};

// ── 필름 통 셋 (빈 장식: 무늬·색 없는 은색 통, 크기만 다름)이 선 작은 나무 받침 ─────────────────────────────────────
B.cin_filmcans = (f, T0) => {
  f.add(mc('cin-filmcans', ({ add }) => {
    add(G.box(.9, .06, .3, .02), WOOD, 0, .03, 0); for (const x of [-.44, -.13, .14, .32]) add(G.box(.02, .14, .28, .005), WOODD, x, .1, 0);
    for (const [x, r] of [[-.29, .14], [0, .17], [.23, .1]]) {
      add(G.cyl(r, r, .07, 24), '#c9ccd6', x, r + .06, 0, HP, 0, 0); add(G.tor(r, .012, PI * 2, 4, 24), '#9aa0ad', x, r + .06, .036);
      add(G.cyl(r * .22, r * .22, .074, 12), '#6f7680', x, r + .06, 0, HP, 0, 0);
      for (let k = 0; k < 4; k++) { const a = k * HP + .4; add(G.cyl(r * .14, r * .14, .074, 10), '#8a909c', x + Math.cos(a) * r * .55, r + .06 + Math.sin(a) * r * .55, 0, HP, 0, 0); }
    }
  }));
  f.spot('on', null, .4, .06, 0, { maxH: 0.45, label: '필름 통 받침 끝', scale: 1 });
};

// ── 포스터 받침 (황동 이젤에 액자 포스터) ────────────────────────────────────────────────────────────────────
B.cin_posterstand = (f, T0, o = {}) => {
  f.add(mc('cin-posterstand', ({ add, tube }) => {
    tube([-.28, 0, .12], [-.2, 1.5, 0], .018, GOLDD, 6); tube([.28, 0, .12], [.2, 1.5, 0], .018, GOLDD, 6); tube([0, 0, -.32], [0, 1.4, -.02], .018, GOLDD, 6);
    add(G.box(.6, .03, .05, .01), GOLD, 0, .48, .08); add(G.box(.62, .84, .05, .02), '#3a2c34', 0, .92, .05, -.08, 0, 0);
  }));
  { const m = quad(.54, .76, texMat(posterTex(o.k ?? 1), { rim: .05 })); put(m, 0, .92, .08, -.08); f.add(m); }
  f.spot('behind', null, 0, 0, -.42, { maxH: 0.5, label: '포스터 받침 뒤', scale: 1 });
};

export const CIN_BUILDERS = B;
export const CIN_INFO = {
  cin_shell: { w: 1, d: 1, name: '별빛극장', hidden: true, price: 0 },
  cin_marquee: { w: 3, d: 1, name: '별빛극장 전구 간판', hidden: true, price: 0 },
  cin_ticketbooth: { w: 2, d: 2, name: '팝콘 통 매표소', hidden: true, price: 0 },
  cin_showtimes: { w: 1, d: 1, name: '오늘의 상영 판', hidden: true, price: 0 },
  cin_popcorn: { w: 1, d: 1, name: '팝콘 매점', hidden: true, price: 0 },
  cin_hall_door: { w: 1, d: 1, name: '상영관 문', hidden: true, price: 0 },
  cin_seatrow: { w: 3, d: 1, name: '접이식 좌석 줄', hidden: true, price: 0 },
  cin_twinseat: { w: 1, d: 1, name: '붙어 있는 의자 두 개', hidden: true, price: 0 },
  cin_screen: { w: 3, d: 1, name: '스크린', hidden: true, price: 0 },
  cin_curtain: { w: 3, d: 1, name: '무대 커튼', hidden: true, price: 0 },
  cin_projroom_door: { w: 2, d: 1, name: '영사실', hidden: true, price: 0 },
  cin_filmcans: { w: 1, d: 1, name: '필름 통', hidden: true, price: 0 },
  cin_projector: { w: 1, d: 1, name: '영사기', hidden: true, price: 0 },
  cin_posterstand: { w: 1, d: 1, name: '포스터 받침', hidden: true, price: 0 },
};

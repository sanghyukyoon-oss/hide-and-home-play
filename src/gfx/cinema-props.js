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
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mat, mesh, canvasTex, shade, fadeDisc, starShape, heartShape, roundRect, STYLE, holeFace, liner } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { clothBend } from './clothbend.js';
import { FONT, paperSheet, paperFill } from './gpt-paper.js';
import { tr, LANG, addI18n } from '../i18n.js';
import { LOCK_COLORS } from './items.js';

addI18n({
  '상영 판 앞': 'In front of the showtimes board',
  '무대 계단 위': 'On the stage step', '무대 앞 바닥 구석': 'Floor corner by the stage',
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
// (디테일 1차 10/24 — 사용자 31판 "전체적으로 디테일이 안잡혀있어 … 모든 오브젝트를 다 디테일 잡았으면": 아래 도우미로 팝콘 알·두꺼운 필름 띠·전구 줄)
// 팝콘 한 알: 크기 다른 혹 셋(흰·크림·가끔 버터)이 뭉친 꽃 모양, 반쯤은 작은 갈색 껍질 — 매끈한 공 하나(흰 구름 덩어리) X
const KS = once(() => G.sph(1, 6, 3));
const kernel = (add, x, y, z, s, r, hull = true) => {
  const a = r() * PI * 2, c2 = r() < .3 ? BUTTER : '#fbe8c0';
  add(KS(), POP, x, y, z, 0, a, 0, s * .6);
  add(KS(), '#fffaf0', x + Math.cos(a) * s * .46, y + s * .18, z + Math.sin(a) * s * .46, 0, 0, 0, s * .48);
  add(KS(), c2, x + Math.cos(a + 2.4) * s * .42, y - s * .08, z + Math.sin(a + 2.4) * s * .42, 0, 0, 0, s * .42);
  if (hull && r() < .45) add(KS(), '#c98a4a', x + Math.cos(a - 2.2) * s * .5, y - s * .2, z + Math.sin(a - 2.2) * s * .5, 0, 0, 0, s * .17);
};
// 반복 소품의 작은 상자는 둥근 모서리 없이 (꼭짓점 아끼기)
const PB = (w, h, d) => G.pbox(w, h, d);
// 작은 전구 여럿을 한 덩어리로 (색만 빛남, 그림자 없음)
const bulbRow = (pts, r, c = BULB) => mesh(mergeGeometries(pts.map(([x, y, z]) => new THREE.SphereGeometry(r, 8, 6).translate(x, y, z)), false), mat(c, { emissive: '#ffe2a0', ei: 1.0 }), { cast: false });
// 두께 있는 필름 띠: 점 P를 따라 폭 2·HW, 두께 TH — 윗면에 필름 그림(2 m 한 장), 아랫면·옆은 짙은 필름 바탕; side(i)는 i번째 점의 폭 방향
const filmRibbon = (P, HW, TH, side, tex = filmTex()) => {
  const V = a => new THREE.Vector3(...a), pts = P.map(V), n = pts.length, sd = pts.map((_, i) => V(side(i)).normalize());
  const up = pts.map((_, i) => { const t = pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize(), u = new THREE.Vector3().crossVectors(sd[i], t).normalize(); return u.y < 0 ? u.negate() : u; });
  let L = 0; const len = pts.map((p, i) => (i && (L += p.distanceTo(pts[i - 1])), L));
  const pos = [], uv = [], idx = [];
  const at = (i, k, d) => pts[i].clone().addScaledVector(sd[i], k * HW).addScaledVector(up[i], -d * TH);
  const strip = (k0, d0, k1, d1, va, vb) => { const b = pos.length / 3; for (let i = 0; i < n; i++) { const A = at(i, k0, d0), Bp = at(i, k1, d1); pos.push(A.x, A.y, A.z, Bp.x, Bp.y, Bp.z); uv.push(len[i] / 2, va, len[i] / 2, vb); if (i) { const a = b + (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } } };
  strip(-1, 0, 1, 0, 0, 1); strip(-1, 1, 1, 1, .03, .03); strip(-1, 0, -1, 1, .03, .03); strip(1, 0, 1, 1, .03, .03);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return mesh(g, texMat(repTex(tex, 1, 1), { rough: .6, side: THREE.DoubleSide }), { cast: true });
};
// 기울어진 판 위의 점 (판 가운데 c, x축으로 rx 기울임) — 액자·글자판 위 장식을 판에 붙일 때
const onTilt = (c, rx, dx, dy, dz = 0) => [c[0] + dx, c[1] + dy * Math.cos(rx) - dz * Math.sin(rx), c[2] + dy * Math.sin(rx) + dz * Math.cos(rx)];

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
// 객석 카펫: 순한 와인색에 두 줄 마름모 격자, 마름모마다 아르데코 부채, 이음마다 금빛 점, 결 (1 m 한 장)
const carpetTex = once(() => canvasTex(512, 512, (c, W, H) => {
  c.fillStyle = '#92474f'; c.fillRect(0, 0, W, H); const r = rnd(5);
  for (let i = 0; i < 3200; i++) { c.fillStyle = r() < .5 ? 'rgba(255,220,200,.05)' : 'rgba(40,10,20,.07)'; c.fillRect(r() * W, r() * H, 2, 2); }
  for (const [col, lw, off] of [['#a3585d', 6, 0], ['#7f3c44', 2, 9], ['#7f3c44', 2, -9]]) {
    c.strokeStyle = col; c.lineWidth = lw;
    for (let k = -8; k < 9; k++) { c.beginPath(); c.moveTo(k * 128 + off, 0); c.lineTo(k * 128 + H + off, H); c.stroke(); c.beginPath(); c.moveTo(k * 128 + H - off, 0); c.lineTo(k * 128 - off, H); c.stroke(); }
  }
  // 마름모 가운데 부채 (위로 펼친 반원, 살 다섯)
  for (let j = 0; j <= 8; j++) for (let i = 0; i <= 8; i++) {
    if ((i + j) % 2 === 0) continue;
    const x = i * 64, y = j * 64;
    c.fillStyle = '#a9545c'; c.beginPath(); c.moveTo(x, y + 10); c.arc(x, y + 10, 22, PI, 0); c.closePath(); c.fill();
    c.strokeStyle = '#c99a5c'; c.lineWidth = 2; c.beginPath(); c.arc(x, y + 10, 22, PI, 0); c.stroke();
    for (let k = 1; k < 5; k++) { const a = PI + k * PI / 5; c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x + Math.cos(a) * 20, y + 10 + Math.sin(a) * 20); c.stroke(); }
    c.fillStyle = '#d9b06a'; c.beginPath(); c.arc(x, y + 10, 4, 0, PI * 2); c.fill();
  }
  c.fillStyle = '#cfa45e'; for (let j = 0; j <= 8; j++) for (let i = 0; i <= 8; i++) if ((i + j) % 2 === 0) { c.beginPath(); c.arc(i * 64, j * 64, 5, 0, PI * 2); c.fill(); }
}));
// 로비 바닥: 크림·테라코타 바둑판 타일 (0.5 m 타일, 1 m 한 장), 줄눈과 작은 점
const lobbyTex = once(() => canvasTex(256, 256, (c, W, H) => {
  const r = rnd(9);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { c.fillStyle = (i + j) % 2 ? '#d59a83' : '#efe1ca'; c.fillRect(i * 128, j * 128, 128, 128); }
  for (let i = 0; i < 500; i++) { c.fillStyle = r() < .5 ? 'rgba(120,70,50,.12)' : 'rgba(255,255,255,.2)'; c.fillRect(r() * W, r() * H, 2, 2); }
  c.strokeStyle = '#c4ab90'; c.lineWidth = 3; for (let k = 0; k <= 256; k += 128) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k, H); c.stroke(); c.beginPath(); c.moveTo(0, k); c.lineTo(W, k); c.stroke(); }
  // (디테일 10/24) 타일 귀마다 작은 금빛 마름모 박이
  for (let y = 0; y <= H; y += 128) for (let x = 0; x <= W; x += 128) { c.fillStyle = '#c9a46a'; c.beginPath(); c.moveTo(x, y - 11); c.lineTo(x + 11, y); c.lineTo(x, y + 11); c.lineTo(x - 11, y); c.closePath(); c.fill(); c.fillStyle = '#efe1ca'; c.beginPath(); c.arc(x, y, 3, 0, PI * 2); c.fill(); }
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
// 필름 띠: 짙은 바탕(위아래 가는 테), 둥근 네모 톱니 구멍, 호박빛 칸 여섯 — 칸마다 작은 그림(몽글이·별·집·팝콘·고양이·하트), 칸 사이 눈금 (2 m 한 장)
const FILM_PIC = [
  (c, x, y, h) => { c.beginPath(); c.ellipse(x, y + h * .08, h * .3, h * .24, 0, 0, PI * 2); c.fill(); c.fillStyle = '#f2c46e'; c.beginPath(); c.arc(x - h * .1, y + h * .02, h * .045, 0, PI * 2); c.arc(x + h * .1, y + h * .02, h * .045, 0, PI * 2); c.fill(); },
  (c, x, y, h) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -HP + i * PI / 5, rr = i % 2 ? h * .14 : h * .34; i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); },
  (c, x, y, h) => { c.fillRect(x - h * .26, y - h * .02, h * .52, h * .34); c.beginPath(); c.moveTo(x - h * .36, y); c.lineTo(x, y - h * .32); c.lineTo(x + h * .36, y); c.closePath(); c.fill(); c.fillStyle = '#f2c46e'; c.fillRect(x - h * .06, y + h * .12, h * .12, h * .2); },
  (c, x, y, h) => { c.beginPath(); c.moveTo(x - h * .24, y - h * .02); c.lineTo(x + h * .24, y - h * .02); c.lineTo(x + h * .18, y + h * .36); c.lineTo(x - h * .18, y + h * .36); c.closePath(); c.fill(); for (const [dx, dy, rr] of [[-.14, -.1, .11], [0, -.16, .13], [.14, -.1, .11]]) { c.beginPath(); c.arc(x + dx * h, y + dy * h, rr * h, 0, PI * 2); c.fill(); } },
  (c, x, y, h) => { c.beginPath(); c.arc(x, y + h * .06, h * .26, 0, PI * 2); c.fill(); c.beginPath(); c.moveTo(x - h * .25, y - h * .02); c.lineTo(x - h * .2, y - h * .34); c.lineTo(x - h * .04, y - h * .16); c.moveTo(x + h * .25, y - h * .02); c.lineTo(x + h * .2, y - h * .34); c.lineTo(x + h * .04, y - h * .16); c.fill(); },
  (c, x, y, h) => { c.beginPath(); c.moveTo(x, y + h * .32); c.bezierCurveTo(x - h * .08, y + h * .22, x - h * .36, y + h * .06, x - h * .3, y - h * .14); c.bezierCurveTo(x - h * .24, y - h * .32, x - h * .04, y - h * .28, x, y - h * .12); c.bezierCurveTo(x + h * .04, y - h * .28, x + h * .24, y - h * .32, x + h * .3, y - h * .14); c.bezierCurveTo(x + h * .36, y + h * .06, x + h * .08, y + h * .22, x, y + h * .32); c.fill(); },
];
const filmTex = once(() => canvasTex(1024, 128, (c, W, H) => {
  c.fillStyle = '#3b2c2b'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#4c3a37'; c.fillRect(0, 6, W, 2); c.fillRect(0, H - 8, W, 2);
  c.fillStyle = '#efe2c8'; for (let x = 8; x < W; x += 32) for (const y of [11, H - 27]) { roundRect(c, x, y, 16, 16, 4); c.fill(); }
  const r = rnd(13), fw = W / 6;
  for (let k = 0; k < 6; k++) {
    const x = k * fw + 7, w = fw - 14, y = 33, h = H - 66;
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#f2c46e'); g.addColorStop(1, '#d99a52'); c.fillStyle = g; roundRect(c, x, y, w, h, 5); c.fill();
    c.fillStyle = 'rgba(86,52,32,.62)'; FILM_PIC[k](c, x + w / 2, y + h / 2, h);
    c.strokeStyle = 'rgba(60,35,25,.45)'; c.lineWidth = 2; roundRect(c, x + 1, y + 1, w - 2, h - 2, 5); c.stroke();
    c.fillStyle = 'rgba(255,240,210,.22)'; c.fillRect(x + 8 + r() * (w - 16), y + 2, 1.5, h - 4); c.fillRect(x + 8, y + 5, w * .35, 3);
    c.fillStyle = '#8a6a52'; c.fillRect(k * fw - 1, H / 2 - 7, 2, 14);
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
// (디테일 10/24: 종이 질감 — 안쪽 테두리, 출연·제작 글줄, 동그란 관람 딱지, 접힌 자국 십자, 바랜 가장자리와 잔 얼룩)
const posterTex = k => POST[k] || (POST[k] = canvasTex(288, 384, (c, w, h) => {
  const P = POSTERS[k], g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, P.bg[0]); g.addColorStop(1, P.bg[1]); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.save(); c.scale(1.5, 1.5); P.draw(c, w / 1.5, h / 1.5); c.restore();
  c.strokeStyle = P.ink; c.globalAlpha = .55; c.lineWidth = 3; c.strokeRect(12, 12, w - 24, h - 24); c.lineWidth = 1; c.strokeRect(18, 18, w - 36, h - 36); c.globalAlpha = 1;
  say(c, T(P.t), w / 2, h * .15, w * .8, 40, P.ink, { weight: 'bold' }); say(c, T(P.sub), w / 2, h * .82, w * .66, 24, P.ink);
  c.fillStyle = P.ink; c.globalAlpha = .4; for (let i = 0; i < 3; i++) { const lw = w * (.56 - i * .1); c.fillRect((w - lw) / 2, h * .88 + i * 9, lw, 3); } c.globalAlpha = 1;
  c.fillStyle = '#e0545c'; c.beginPath(); c.arc(w - 40, 44, 15, 0, PI * 2); c.fill(); c.strokeStyle = '#fff4e2'; c.lineWidth = 2.5; c.stroke(); say(c, '★', w - 40, 45, 22, 16, '#fff4e2');
  c.fillStyle = 'rgba(255,245,225,.26)'; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(255,250,235,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  c.strokeStyle = 'rgba(90,60,40,.12)'; c.lineWidth = 1; c.beginPath(); c.moveTo(w / 2 + 2, 0); c.lineTo(w / 2 + 2, h); c.moveTo(0, h / 2 + 2); c.lineTo(w, h / 2 + 2); c.stroke();
  const r = rnd(k + 3); c.fillStyle = 'rgba(90,60,40,.16)'; for (let i = 0; i < 70; i++) c.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2);
  c.fillStyle = 'rgba(255,250,235,.5)'; for (let i = 0; i < 26; i++) { const t = r(); c.fillRect(t < .5 ? r() * w : (t < .75 ? 0 : w - 3), t < .25 ? 0 : t < .5 ? h - 3 : r() * h, 3 + r() * 6, 3); }
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
    for (const [cx, cz, n] of [[2.3, -.35, 7], [-1.2, 1.25, 5], [-2.55, -1.75, 4], [3.2, .9, 3]]) for (let k = 0; k < n; k++) kernel(add, cx + (r() - .5) * .5, .03, cz + (r() - .5) * .35, .05 + r() * .018, r, k % 2 === 0);
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
      // 필름 띠를 받친 짙은 판, 위아래 금빛 테와 테마다 박힌 징
      add(PB(RW, .46, .025), '#3b2c2b', 0, 3.21, Z0 + .0125);
      for (const y of [2.99, 3.43]) { add(PB(RW, .025, .04), GOLD, 0, y, Z0 + .02); for (let x = -RW / 2 + .15; x < RW / 2; x += .3) add(PB(.025, .025, .012), GOLDD, x, y, Z0 + .044); }
      // 오른쪽 끝 기둥 (보이는 끝면)
      add(G.box(.22, NH + .1, .42, .04), '#e8d6c6', X1 + .02, (NH + .1) / 2, Z0 - NT / 2 + .03); add(G.box(.26, .1, .46, .03), GOLD, X1 + .02, NH + .1, Z0 - NT / 2 + .03);
    }));
    const wp = quad(RW, 2.0, texMat(repTex(wallTex(), RW, 2.0), { rough: .9 })); put(wp, 0, .97 + 1.0, Z0 + .003); N.g.add(wp);
    const wn = quad(RW, .82, texMat(repTex(wainTex(), RW / .8, 1), { rough: .8 })); put(wn, 0, .14 + .41, Z0 + .004); N.g.add(wn);
    const fr = quad(RW, .42, texMat(repTex(filmTex(), RW / 2, 1), { rough: .6 })); put(fr, 0, 3.0 + .21, Z0 + .027); N.g.add(fr);
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
      // 판벽 테 (판자마다 짙은 나무 네모 테, 비상구 문 자리는 비움)
      for (let x = -RW / 2 + .5; x < RW / 2 - .2; x += .9) {
        if (Math.abs(x + 2.35) < .78) continue;
        for (const y of [.27, .83]) add(PB(.66, .028, .02), WAIND, x, y, Z0 + .012);
        for (const sx of [-1, 1]) add(PB(.028, .58, .02), WAIND, x + sx * .33, .55, Z0 + .012);
        add(PB(.5, .012, .012), GOLDD, x, .72, Z0 + .02);
      }
      // 옛 포스터 액자 (금빛 테·짙은 받침판) + 위 작은 갓 등
      add(PB(.7, .94, .012), '#5a2f33', -1.45, 1.5, Z0 + .008);
      for (const [w, h, dx, dy] of [[.76, .05, 0, .48], [.76, .05, 0, -.48], [.05, 1.0, -.38, 0], [.05, 1.0, .38, 0]]) add(G.box(w, h, .04, .012), GOLD, -1.45 + dx, 1.5 + dy, Z0 + .022);
      for (const [dx, dy] of [[-.38, .48], [.38, .48], [-.38, -.48], [.38, -.48]]) add(G.sph(.03, 8, 6), GOLDD, -1.45 + dx, 1.5 + dy, Z0 + .045);
      add(PB(.03, .03, .16), GOLDD, -1.45, 2.1, Z0 + .08); add(G.cone(.075, .08, 12), '#3d5048', -1.45, 2.07, Z0 + .17, PI, 0, 0);
    }));
    { const m = quad(.56, .2, basic(exitTex(), '#d8ffe6')); put(m, -2.35, 2.32, Z0 + .07); N.deco.add(m); N.deco.add(put(mc('cin-exitbox', ({ add }) => add(G.box(.62, .26, .1, .02), '#e9efe9', 0, 0, 0)), -2.35, 2.32, Z0 + .02)); }
    { const m = quad(.27, .2, texMat(closedTex(), { rim: 0 })); put(m, -2.35, 1.5, Z0 + .107); N.deco.add(m); }
    { const m = quad(.44, .14, texMat(staffTex(), { rim: 0 })); put(m, 3.0, 1.6, Z0 + .024); N.deco.add(m); }
    { const p = paperSheet(.62, .86, posterTex(0), { hold: 'none', curl: false }); put(p, -1.45, 1.5, Z0 + .012); N.deco.add(p); }
    { const b = mesh(new THREE.SphereGeometry(.03, 8, 6), mat('#fff3d0', { emissive: '#ffe2a0', ei: 1.0 }), { cast: false }); put(b, -1.45, 2.03, Z0 + .17); N.deco.add(b); }
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
      // (19판~ 다듬기 10/29: 뒤로 돌리면 바깥 판이 검은 원판 하나 — 그 면은 그려지지 않고 감긴 필름 끝이 비쳤음) 바깥 면을 얇은 판으로 덧대고
      // 안쪽처럼 구멍 셋(감긴 필름이 보이는 자리)·두꺼운 테·구멍 테·가운데 심
      add(G.cyl(R - .03, R - .03, .04, 64), REEL, X0 - .62, REEL.y, REEL.z, 0, 0, HP);
      for (const [u, v, r] of holes) add(G.cyl(r, r, .02, 28), FILM, X0 - .65, v, u, 0, 0, HP);
      add(G.tor(R - .04, .06, PI * 2, 6, 64), REELD, X0 - .655, REEL.y, REEL.z, 0, HP, 0);
      for (const [u, v, r] of holes) add(G.tor(r + .02, .035, PI * 2, 6, 28), REELD, X0 - .66, v, u, 0, HP, 0);
      add(G.cyl(.5, .5, .03, 24), REELD, X0 - .655, REEL.y, REEL.z, 0, 0, HP); add(G.cyl(.2, .2, .03, 18), CHROME, X0 - .67, REEL.y, REEL.z, 0, 0, HP);
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
      // 바깥 판 쪽도 같은 리벳·필름 결
      for (let k = 0; k < 20; k++) { const a = k / 20 * PI * 2, u = REEL.z + Math.cos(a) * (R - .22), v = REEL.y + Math.sin(a) * (R - .22); if (v > .5) add(G.sph(.04, 8, 6), CHROME, X0 - .645, v, u, 0, 0, 0, [.6, 1, 1]); }
      for (const [u, v, r] of holes) for (let k = 0; k < 3; k++) add(G.tor(r * (.5 + k * .18), .008, PI * 2, 3, 20), '#6e544c', X0 - .662, v, u, 0, HP, 0);
      // 발치 받침 돌 (릴이 서 있는 요람) 앞·뒤
      add(G.box(.8, .62, .7, .06), STONE, X0 - .3, .19, -2.86); add(G.box(.86, .08, .76, .03), shade(STONE, -.08), X0 - .3, .52, -2.86);
      add(G.box(.8, .56, .7, .06), STONE, X0 - .3, .16, 2.05); add(G.box(.86, .08, .76, .03), shade(STONE, -.08), X0 - .3, .46, 2.05);
    }));
    // (10/24 사용자 '필름롤쪽에 지저분한거 지워': 릴 꼭대기에서 뒷벽 프리즈로 내려앉던 풀린 필름 띠는 뺌 — 프리즈 위에 대각선 조각만 떠 보였음)
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
  // (19판~ 다듬기 10/29: the under-loft's west side was one bare cream board when the view turns round) the same wood wainscot and
  // gold rail as the hall, two pinned coming-soon posters and a red fire-hose box with its white label
  f.add(mc('cin-underloft-w', ({ add }) => {
    add(G.box(.09, .8, LOFT.z1 - Z0, .01), WAIN, LOFT.x0 + .035, .4, (Z0 + LOFT.z1) / 2);
    add(G.box(.02, .02, LOFT.z1 - Z0, .005), GOLD, LOFT.x0 - .015, .82, (Z0 + LOFT.z1) / 2);
    add(G.box(.06, .42, .32, .02), '#c4413f', LOFT.x0 - .02, 1.05, -1.5); add(G.box(.01, .1, .2, .004), '#ffffff', LOFT.x0 - .055, 1.18, -1.5);
    add(G.tor(.08, .02, PI * 2, 5, 14), '#e8e2d2', LOFT.x0 - .06, .98, -1.5, 0, HP, 0);
  }));
  for (const [z, k] of [[-2.55, 1], [-2.0, 2]]) { const p = paperSheet(.34, .46, posterTex(k), { hold: 'pin', curl: k === 2 }); put(p, LOFT.x0 - .005, 1.38, z, 0, -HP, 0); f.add(p); }

  // ── 바깥: 가로등 하나 (앞 왼쪽), 따뜻한 등 ───────────────────────────────────────────────────────────────────
  f.add(mc('cin-lamp', ({ add, tube }) => {
    const x = -5.0, z = 3.75;
    add(G.cyl(.15, .19, .12, 12), '#3f4a5a', x, ISY + .06, z); add(G.cyl(.05, .065, 2.3, 10), '#3f4a5a', x, ISY + 1.22, z);
    tube([x, ISY + 2.35, z], [x + .2, ISY + 2.55, z - .05], .042, '#3f4a5a', 8);
    add(G.cone(.2, .16, 12), '#3f4a5a', x + .3, ISY + 2.6, z - .08); add(G.box(.22, .3, .03, .02), '#c4413f', x + .02, ISY + 1.7, z + .06);
  }));
  { const b = mesh(new THREE.SphereGeometry(.09, 10, 8), mat('#fff3d0', { emissive: GLOWC, ei: 1.3 }), { cast: false }); put(b, -4.7, ISY + 2.47, 3.67); f.add(b); f.add(halo(-4.7, ISY + 2.45, 3.67, 1.2, '#ffcf8a', .5)); f.add(pool(-4.75, ISY + .02, 3.7, 1.1, '#ffb86a', .35)); }

  // 바탕의 숨김 자리 (늘 보이는 곳): 무대 앞 끝 둘, 사다리 뒤 구석, 비상구 문턱, 오른쪽 화단 뒤
  // (10/24 사용자 '곰 뚫림': 무대 양 끝 자리가 묶은 양옆 커튼 다발 속이었음 — 무대 앞 계단 위와 무대 앞 바닥 구석으로 옮김)
  f.spot('on', null, STAGE.x1 + .18, .155, STAGE.z1 - .35, { maxH: 0.45, label: '무대 계단 위', scale: 1 });
  f.spot('on', null, STAGE.x1 + .3, 0, STAGE.z0 + .4, { maxH: 0.5, label: '무대 앞 바닥 구석', scale: 1 });
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

// ── 거대 세로 간판 '별빛극장' (뒷벽 위에 높이 선 옛 극장식 아르데코 세로 간판 — 판의 얼굴; 사용자 10/24 "꼭 제발 멋지게"):
// 두께 있는 깊은 남색 몸통(잔 결 판 넷·금속 테·옆 금빛 지느러미·뒤 철판), 위는 계단식 부채꼴 왕관(햇살 살·첨탑·별), 아래는 계단 꼭지,
// 글자 넷은 판에서 튀어나온 네온관(관 굵기·뒤로 꺾여 들어가는 끝·짙은 전극 마개·관 받침 집게, 뒤 판에 은은한 분홍 번짐 — 영어 STAR·LIGHT·CINE·MA도 같은 관),
// 둘레 전구는 황동 소켓에 꽂힌 진짜 전구 — 다 켜져 있을 때만 셋에 하나씩 반짝임이 돌아감(체이서; ③ marqueeFlicker가 끄고 켜는 동안엔 멈춤),
// 받침은 바닥판·I형 기둥 둘·사선 버팀대·삼각 덧판·볼트·당김줄로 지붕에 고정. 발광은 간판 것만(장면 빛은 그대로).
// f.bulbs: 켜질 순서(왼쪽 기둥 아래→위, 위 줄 왼→오, 오른쪽 기둥 위→아래, 아래 줄 오→왼) — 전구 유리 하나하나(재질 따로), f.letters: 글자 넷(위→아래,
// 네온관 한 덩어리씩, 재질 따로) — 둘 다 f.live 안. 간판을 누르면 넷째 글자가 꺼지며 비뚤어져 '별빛극 장'(부품 하나, 한 번이면 그대로).
const MQW = 1.36, MQH = 3.9, MQD = .3, MQY0 = .34, MQYC = MQY0 + MQH / 2, MQLY = [0, 1, 2, 3].map(i => MQY0 + MQH - .55 - i * .93), MQPH = .78;
const MQBULBS = (() => {
  const out = [], top = MQY0 + MQH - .1, bot = MQY0 + .1, xl = -MQW / 2 + .1, xr = MQW / 2 - .1, n = 12;
  for (let k = 0; k < n; k++) out.push([xl, bot + .2 + (top - bot - .4) * k / (n - 1)]);
  for (let k = 0; k < 4; k++) out.push([xl + (xr - xl) * k / 3, top]);
  for (let k = n - 1; k >= 0; k--) out.push([xr, bot + .2 + (top - bot - .4) * k / (n - 1)]);
  for (let k = 3; k >= 0; k--) out.push([xl + (xr - xl) * k / 3, bot]);
  return out;
})();
const NAVY = '#2b2c5e', NAVYD = '#1f2049', NEON = '#ff6d8f';
// 네온 글씨체: 글자마다 획(단위 칸 0~1, y 위로) — 's'로 시작하면 부드러운 곡선, 'c'면 닫힌 고리, 나머지는 꺾인 곳만 살짝 둥근 직선 관
const NEON_GLYPH = {
  '별': [[.1, .95, .1, .56, .42, .56, .42, .95], [.1, .76, .42, .76], [.76, .97, .76, .5], [.54, .83, .76, .83], [.54, .67, .76, .67], [.2, .42, .8, .42, .8, .24, .2, .24, .2, .05, .82, .05]],
  '빛': [[.12, .95, .12, .54, .46, .54, .46, .95], [.12, .75, .46, .75], [.76, .97, .76, .5], [.5, .45, .5, .37], [.22, .34, .78, .34], ['s', .5, .33, .4, .2, .2, .04], ['s', .5, .3, .62, .18, .82, .04]],
  '극': [[.14, .93, .84, .93, .84, .64], [.05, .51, .95, .51], [.14, .38, .84, .38, .84, .04]],
  '장': [[.06, .93, .52, .93], ['s', .29, .93, .2, .74, .06, .56], ['s', .29, .82, .4, .68, .54, .56], [.76, .97, .76, .5], [.76, .74, .95, .74], ['c', .5, .21, .19]],
  S: [['s', .86, .82, .62, .97, .32, .95, .13, .79, .2, .6, .5, .51, .8, .41, .88, .22, .7, .04, .38, .03, .12, .18]],
  T: [[.04, .96, .96, .96], [.5, .96, .5, .03]],
  A: [[.05, .03, .5, .97, .95, .03], [.25, .37, .75, .37]],
  R: [[.13, .03, .13, .96, .52, .96], ['s', .52, .96, .78, .91, .87, .74, .77, .55, .5, .5, .13, .5], [.5, .5, .9, .03]],
  L: [[.16, .97, .16, .04, .9, .04]],
  I: [[.5, .96, .5, .04], [.24, .96, .76, .96], [.24, .04, .76, .04]],
  G: [['s', .88, .8, .66, .97, .35, .96, .11, .74, .09, .36, .27, .07, .56, .02, .84, .14, .88, .44], [.88, .44, .55, .44]],
  H: [[.13, .97, .13, .03], [.87, .97, .87, .03], [.13, .5, .87, .5]],
  C: [['s', .88, .8, .66, .97, .35, .96, .11, .74, .09, .3, .3, .04, .64, .03, .88, .2]],
  N: [[.13, .03, .13, .97, .87, .03, .87, .97]],
  E: [[.87, .96, .14, .96, .14, .04, .87, .04], [.14, .5, .7, .5]],
  M: [[.08, .03, .08, .97, .5, .38, .92, .97, .92, .03]],
};
// 한 칸(글자 하나 또는 단어)을 판 위 점들로: 획마다 { pts(Vector3), closed, open } — 꺾인 획은 모서리마다 점 둘을 넣어 살짝 둥글게
const neonStrokes = (word, W, H) => {
  const ch = [...word], n = ch.length, ko = /[가-힣]/.test(word);
  const cw = W / n, gh = ko ? H * .9 : Math.min(H * .62, cw * 1.45), gw = ko ? W * .9 : Math.min(cw * .84, gh * .78), out = [];
  ch.forEach((c, i) => {
    const cx = -W / 2 + cw * (i + .5), map = (u, v) => new THREE.Vector3(cx + (u - .5) * gw, (v - .5) * gh, 0);
    for (const s0 of NEON_GLYPH[c] || []) {
      const flag = typeof s0[0] === 'string' ? s0[0] : '', a = flag ? s0.slice(1) : s0;
      if (flag === 'c') { const [u, v, r] = a, pts = []; for (let k = 0; k < 18; k++) { const t = k / 18 * PI * 2; pts.push(map(u + Math.cos(t) * r * gh / gw, v + Math.sin(t) * r)); } out.push({ pts, closed: true }); continue; }
      let pts = []; for (let k = 0; k < a.length; k += 2) pts.push(map(a[k], a[k + 1]));
      if (!flag) {
        const R = Math.min(gw, gh) * .06, P = [pts[0]];
        for (let k = 1; k < pts.length - 1; k++) { const A = pts[k - 1], Bp = pts[k], C = pts[k + 1], d1 = A.distanceTo(Bp), d2 = C.distanceTo(Bp), r = Math.min(R, d1 * .4, d2 * .4); P.push(Bp.clone().lerp(A, r / d1), Bp.clone(), Bp.clone().lerp(C, r / d2)); }
        P.push(pts[pts.length - 1]);
        const D = []; for (let k = 0; k < P.length; k++) { if (k) { const d = P[k - 1].distanceTo(P[k]); if (d > .12) for (let j = 1; j < Math.ceil(d / .12); j++) D.push(P[k - 1].clone().lerp(P[k], j / Math.ceil(d / .12))); } D.push(P[k]); }
        pts = D;
      }
      out.push({ pts, closed: false });
    }
  });
  return out;
};
// 네온관 한 글자 칸: 관(뒤로 꺾여 판으로 들어가는 끝 포함) 한 덩어리 + 전극 마개·받침 집게 덩어리
const neonGeo = (word, W, H, r, back) => {
  const tubes = [], bits = [];
  for (const s of neonStrokes(word, W, H)) {
    let pts = s.pts;
    if (!s.closed) { const a = pts[0], b = pts[pts.length - 1]; pts = [a.clone().setZ(-back), a.clone().setZ(-back * .35), ...pts, b.clone().setZ(-back * .35), b.clone().setZ(-back)]; bits.push({ p: a.clone().setZ(-back + r), cap: true }, { p: b.clone().setZ(-back + r), cap: true }); }
    const cv = new THREE.CatmullRomCurve3(pts, s.closed, 'centripetal'), L = cv.getLength();
    tubes.push(new THREE.TubeGeometry(cv, Math.min(72, Math.max(10, Math.round(L / .03))), r, 6, s.closed));
    const m = s.pts[Math.floor(s.pts.length / 2)]; bits.push({ p: m.clone().setZ(-back * .5), cap: false });
  }
  return { tube: mergeGeometries(tubes, false), bits };
};
// 네온 번짐 그림 (판에 비치는 분홍 빛: 획을 두껍게 흐리게)
const NEONGLOW = {};
const neonGlowTex = (word, W, H) => NEONGLOW[word] || (NEONGLOW[word] = canvasTex(256, 256, (c, w, h) => {
  c.clearRect(0, 0, w, h); const S = w / (W + .2), X = u => w / 2 + u * S, Y = v => h / 2 - v * S;
  c.lineCap = c.lineJoin = 'round';
  for (const [lw, a, bl] of [[44, .26, 30], [22, .45, 14]]) {
    c.strokeStyle = `rgba(255,96,140,${a})`; c.lineWidth = lw; c.shadowColor = 'rgba(255,80,130,.8)'; c.shadowBlur = bl;
    for (const s of neonStrokes(word, W, H)) { c.beginPath(); s.pts.forEach((p, i) => i ? c.lineTo(X(p.x), Y(p.y)) : c.moveTo(X(p.x), Y(p.y))); if (s.closed) c.closePath(); c.stroke(); }
  }
}));
// 판의 잔 결: 깊은 남색에 가는 세로 결, 아래로 살짝 어두워짐, 가장자리 안쪽 가는 금줄
const mqPanelTex = once(() => canvasTex(128, 128, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#26285a'); g.addColorStop(1, '#1b1c44'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = rnd(29); for (let x = 0; x < W; x += 2) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.06)'; c.fillRect(x, 0, 1, H); }
  for (let i = 0; i < 90; i++) { c.fillStyle = 'rgba(160,170,255,.05)'; c.fillRect(r() * W, r() * H, 1, 3 + r() * 8); }
  c.strokeStyle = 'rgba(217,178,94,.55)'; c.lineWidth = 2; c.strokeRect(6, 6, W - 12, H - 12);
  c.fillStyle = 'rgba(217,178,94,.6)'; for (const [x, y] of [[6, 6], [W - 6, 6], [6, H - 6], [W - 6, H - 6]]) { c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 6, y); c.lineTo(x, y + 6); c.lineTo(x - 6, y); c.closePath(); c.fill(); }
}));
B.cin_marquee = (f, T0) => {
  const sign = grp(); f.add(sign);
  const FZ = MQD / 2;
  sign.add(mc('cin-marquee2', ({ add, tube }) => {
    // 받침: 지붕 위 바닥판(볼트), I형 기둥 둘(앞뒤 날개), 사선 버팀대와 삼각 덧판, 가로 보 셋, 뒤로 당긴 줄
    add(G.box(MQW + .3, .06, .5, .015), IRON, 0, .03, -.08);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.022, .022, .03, 8), CHROME, sx * (MQW / 2 + .08), .07, -.08 + sz * .19);
    for (const sx of [-1, 1]) {
      const x = sx * .44;
      add(PB(.04, MQY0 + .1, .12), IRON, x, (MQY0 + .1) / 2, -.04); for (const dz of [-.06, .06]) add(PB(.12, MQY0 + .1, .018), '#4c4560', x, (MQY0 + .1) / 2, -.04 + dz);
      add(G.box(.07, 1.3, .07, .01), IRON, x, .9, -.47, -.55, 0, 0);
      const gs = new THREE.Shape(); gs.moveTo(0, 0); gs.lineTo(.22, 0); gs.lineTo(0, .22); gs.closePath(); add(ext(gs, .02, 2), '#4c4560', x - .01, .06, -.1, 0, HP, 0);
      add(G.sph(.02, 6, 4), CHROME, x, .25, -FZ - .02); add(G.sph(.02, 6, 4), CHROME, x, MQY0 + .06, -FZ - .02);
      tube([sx * (MQW / 2 - .05), MQY0 + MQH - .1, -FZ - .02], [sx * (MQW / 2 + .2), .07, -.62], .009, '#8a8698', 4);
    }
    for (const y of [1.25, 2.45, 3.65]) add(PB(MQW - .2, .07, .05), IRON, 0, y, -FZ - .045);
    // 몸통: 깊은 남색 상자, 앞 가장자리 금빛 테(위아래·양옆), 옆면 금빛 지느러미 셋, 뒤 철판과 점검 문·리벳
    add(G.box(MQW, MQH, MQD, .06), NAVY, 0, MQYC, 0);
    add(G.box(MQW + .1, .1, MQD + .06, .02), GOLD, 0, MQY0 + MQH, 0); add(G.box(MQW + .1, .1, MQD + .06, .02), GOLD, 0, MQY0, 0);
    for (const sx of [-1, 1]) {
      add(G.box(.1, MQH + .08, MQD + .06, .02), GOLD, sx * MQW / 2, MQYC, 0);
      for (const [dz, w] of [[-.08, .05], [0, .07], [.08, .05]]) add(G.box(w, MQH - .3, .03, .01), dz ? GOLDD : GOLD, sx * (MQW / 2 + .05 + w / 2), MQYC, dz);
      for (let k = 0; k < 5; k++) add(PB(.012, .012, MQD), NAVYD, sx * (MQW / 2 + .055), MQY0 + .5 + k * .75, 0);
    }
    add(PB(MQW - .24, MQH - .3, .012), '#3a3a52', 0, MQYC, -FZ - .006); add(PB(.4, .6, .014), '#4c4560', .2, 1.4, -FZ - .012);
    for (let k = 0; k < 9; k++) for (const sx of [-1, 1]) add(G.sph(.016, 5, 4), '#8a8698', sx * (MQW / 2 - .16), MQY0 + .25 + k * .43, -FZ - .012);
    // 판 넷: 한 칸씩 움푹한 테(금줄 + 짙은 턱), 칸 사이 금빛 마름모
    for (const y of MQLY) {
      add(G.box(1.02, MQPH, .03, .015), NAVYD, 0, y, FZ + .002);
      for (const [w, h, dx, dy] of [[1.04, .025, 0, MQPH / 2], [1.04, .025, 0, -MQPH / 2], [.025, MQPH, -.51, 0], [.025, MQPH, .51, 0]]) add(PB(w, h, .03), GOLD, dx, y + dy, FZ + .012);
    }
    for (let i = 0; i < 3; i++) { const y = (MQLY[i] + MQLY[i + 1]) / 2; add(G.box(.09, .09, .03, .006), GOLD, 0, y, FZ + .012, 0, 0, PI / 4); for (const sx of [-1, 1]) add(PB(.3, .012, .02), GOLDD, sx * .26, y, FZ + .01); }
    // 위 왕관: 계단식 부채 셋(남색·금·남색), 햇살 살 일곱, 첨탑(층층 원판)과 별, 양 어깨 계단 턱
    const fan = r => { const sh = new THREE.Shape(); sh.moveTo(-r, 0); sh.absarc(0, 0, r, PI, 0, true); sh.closePath(); return sh; };
    const TOP = MQY0 + MQH + .05;
    add(ext(fan(.68), MQD - .04, 20), NAVY, 0, TOP, -FZ + .02); add(ext(fan(.71), .03, 20), GOLD, 0, TOP - .005, FZ - .03);
    add(ext(fan(.5), .04, 18), GOLD, 0, TOP, FZ - .01); add(ext(fan(.42), .05, 16), NAVYD, 0, TOP, FZ);
    for (let k = 1; k < 8; k++) { const a = PI - k * PI / 8; add(PB(.03, .3, .02), GOLD, Math.cos(a) * .27, TOP + Math.sin(a) * .27, FZ + .05, 0, 0, a - HP); }
    add(ext(fan(.12), .06, 12), GOLD, 0, TOP, FZ + .01);
    for (const sx of [-1, 1]) { add(G.box(.22, .12, MQD, .02), NAVY, sx * (MQW / 2 - .11), TOP + .06, 0); add(G.box(.24, .03, MQD + .03, .01), GOLD, sx * (MQW / 2 - .11), TOP + .135, 0); add(G.box(.12, .1, MQD - .04, .02), NAVY, sx * (MQW / 2 - .1), TOP + .2, 0); add(G.sph(.04, 8, 6), GOLD, sx * (MQW / 2 - .1), TOP + .28, 0); }
    for (const [y, r] of [[.72, .08], [.8, .06], [.88, .045]]) add(G.cyl(r, r * 1.15, .08, 12), y > .85 ? GOLD : NAVY, 0, TOP + y, 0);
    add(G.cone(.03, .2, 8), GOLD, 0, TOP + 1.02, 0);
    add(G.ext(starShape(.2, .09), .06, .01, 4), GOLD, 0, TOP + 1.2, -.03);
    // 아래 꼭지: 계단 셋과 구슬
    for (const [y, w] of [[MQY0 - .06, .7], [MQY0 - .14, .46], [MQY0 - .21, .26]]) add(G.box(w, .08, MQD - .06, .02), y < MQY0 - .1 ? GOLD : NAVY, 0, y, 0);
    add(G.sph(.06, 10, 8), GOLD, 0, MQY0 - .3, 0);
    // 전구 소켓: 황동 테 받침 + 짙은 목
    for (const [x, y] of MQBULBS) { add(G.cyl(.05, .05, .02, 10), GOLDD, x, y, FZ + .012, HP, 0, 0); add(G.cyl(.032, .036, .045, 8), '#3a3046', x, y, FZ + .04, HP, 0, 0); }
  }));
  // 판 넷의 결 그림
  for (const y of MQLY) { const q = quad(.96, MQPH - .06, texMat(mqPanelTex(), { rough: .7, rim: .04 })); put(q, 0, y, FZ + .018); sign.add(q); }
  // 전구 (하나하나 따로 — 유리, 살짝 길쭉)
  const bg = new THREE.SphereGeometry(.05, 12, 9); bg.scale(1, 1, 1.15);
  f.bulbs = MQBULBS.map(([x, y]) => { const b = mesh(bg, own('#fff6dc', { emissive: '#ffd890', ei: 1.3 }), { cast: false }); put(b, x, y, FZ + .085); b.name = 'cin-bulb'; b.userData.noMerge = true; sign.add(b); return b; });
  // 반짝임 (체이서: 켜진 전구 위에 겹쳐 셋에 하나씩 도는 밝은 빛 — f.bulbs와 따로)
  const chase = f.bulbs.map(b => { const s = halo(b.position.x, b.position.y, b.position.z + .03, .42, '#fff4dc', 1); s.visible = false; sign.add(s); return s; });
  // 글자 넷: 네온관 (영어도 같은 관 — 단어가 길면 관이 가늘어짐)
  const words = LANG === 'en' ? ['STAR', 'LIGHT', 'CINE', 'MA'] : ['별', '빛', '극', '장'], LW = .82, LH = .68, BACK = .07;
  f.letterGlow = [];
  f.letters = words.map((s, i) => {
    const n = [...s].length, r = n === 1 ? .04 : n <= 2 ? .03 : n <= 4 ? .024 : .02, { tube: tg, bits } = neonGeo(s, LW, LH, r, BACK);
    const m = mesh(tg, toonMat({ color: '#ffc4d4', emissive: new THREE.Color(NEON), emissiveIntensity: .85 }), { cast: false });
    put(m, 0, MQLY[i], FZ + .02 + BACK); m.name = 'cin-letter'; keep(m);
    // (전극 마개·집게는 글자마다 제 재질 — ③의 끄고 켜기가 글자 하나씩 돌아도 서로 안 엉킴)
    // (10/24 사진: 짙고 큰 마개가 관 끝마다 검은 덩어리로 보여 — 작게, 회색 금속빛으로)
    const cg = mergeGeometries(bits.map(({ p, cap }) => (cap ? new THREE.CylinderGeometry(r * 1.12, r * 1.12, r * 1.6, 8) : new THREE.CylinderGeometry(r * .45, r * .45, BACK * .9, 6)).rotateX(HP).translate(p.x, p.y, p.z)), false);
    if (cg) m.add(keep(mesh(cg, own('#6e6880', { rough: .45 }), { cast: false })));
    sign.add(m);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(LW + .2, LW + .2), new THREE.MeshBasicMaterial({ map: neonGlowTex(s, LW, LH), transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false }));
    gl.material.toneMapped = false; put(gl, 0, MQLY[i], FZ + .032); gl.renderOrder = 3; colourOnly(keep(gl)); sign.add(gl); f.letterGlow.push(gl);
    return m;
  });
  (f.live || (f.live = [])).push(...f.bulbs, ...f.letters, ...chase, ...f.letterGlow);
  f.dimLetter = 3;
  f.collideBox = [-MQW / 2 - .1, 0, -.6, MQW / 2 + .1, MQY0 + MQH + 1.5, .2];
  f.halo = halo(0, MQYC, -.25, 4.6, '#ffdce6', .22); sign.add(f.halo);
  const L = f.letters[3], y0 = L.position.y, x0 = L.position.x, e0 = L.material.emissiveIntensity;
  const p = f.part('flick', sign, t => { const k = ss(t); L.rotation.z = -.42 * k; L.position.y = y0 - .1 * k; L.position.x = x0 + .06 * k; L.material.emissiveIntensity = e0 * (1 - .92 * k); }, { label: '간판 전구', sfx: 'click', dur: .8 });
  p.steps = [[0, 'click'], [.35, 'tick'], [.7, 'click']]; p.gpt2Reach = true;
  // (뒷벽이 접히면 간판도 숨음 — 카메라가 뒤로 돌았을 때; 간판은 카메라 쪽으로 조금 돌려 놓으므로 뒷벽 방향으로 잼)
  // 체이서·네온 번짐: 전구가 다 켜져 있을 때만 돌고(③ 연출이 하나씩 켜는 동안·꺼 둔 동안은 멈춤), 번짐은 글자 밝기를 따라감 — 바뀔 때만 손댐
  const ei0 = f.bulbs[0].material.emissiveIntensity, gl0 = f.letterGlow.map(g => g.material.opacity);
  let tt = 0, step = -1;
  f.updateView = (Wd, dt = 1 / 60) => {
    if (Wd && Number.isFinite(Wd.yaw)) { const v = Math.cos(Wd.yaw) >= -.18; if (sign.visible !== v) { sign.visible = v; Wd.shadowDirty = true; Wd.idsDirty = true; } }
    if (!sign.visible) return;
    f.letters.forEach((l, i) => { const g = f.letterGlow[i], k = Math.max(0, Math.min(1, (l.material.emissiveIntensity / e0 - .3) / .7)), op = +(gl0[i] * k).toFixed(3); if (g.material.opacity !== op) g.material.opacity = op; const on = op > .01; if (g.visible !== on) g.visible = on; });
    const all = f.bulbs.every(b => b.material.emissiveIntensity > ei0 * .5);
    tt += Math.min(.1, Math.max(0, dt)); const s = all ? Math.floor(tt * 6) : -1;
    if (s === step) return; step = s;
    chase.forEach((c, i) => { const on = s >= 0 && (i + s) % 3 === 0; if (c.visible !== on) c.visible = on; });
  };
};

// 팝콘 통 위 띠: 크림 바탕에 빨간 글자 '★ 별빛극장 · 팝콘 ★'을 둘레로 셋
const bucketBandTex = once(() => canvasTex(1024, 64, (c, W, H) => {
  c.fillStyle = CREAM; c.fillRect(0, 0, W, H); c.fillStyle = '#d9b25e'; c.fillRect(0, 0, W, 5); c.fillRect(0, H - 5, W, 5);
  for (let k = 0; k < 3; k++) { const x = (k + .5) * W / 3; say(c, T('별빛극장') + ' · ' + T('팝콘'), x, H / 2 + 2, W / 3 - 90, 34, '#c4413f', { weight: 'bold' }); say(c, '★', x - W / 6 + 22, H / 2 + 2, 30, 30, '#d9b25e'); }
}));
// ── 매표소 = 거대 팝콘 통: 빨강·크림 줄무늬 통, 위로 넘치는 팝콘, 앞에 창구(유리·말구멍), 동전 접시 받침, 그 밑 서랍(code), 옆에 테이프 포스터 ──
B.cin_ticketbooth = (f, T0) => {
  const RB = .66, RT = .82, H = 2.6, rAt = y => RB + (RT - RB) * y / H;
  const body = mesh(new THREE.CylinderGeometry(RT, RB, H, 40), texMat(stripeTex(), { rough: .7 })); put(body, 0, H / 2, 0); f.add(body);
  f.add(mc('cin-kiosk', ({ add }) => {
    add(G.tor(RT + .01, .075, PI * 2, 8, 44), CREAM, 0, H, 0, HP, 0, 0); add(G.cyl(RB + .04, RB + .06, .1, 40), '#b8383f', 0, .05, 0);
    // (디테일 10/24) 통 테 밑 물결 주름 띠(크림 반달 24), 바닥 굽의 금줄, 띠 글자판 위아래 금테
    for (let k = 0; k < 24; k++) { const a = k / 24 * PI * 2, rr = RT + .012; add(G.sph(.05, 6, 4), CREAM, Math.sin(a) * rr, H - .085, Math.cos(a) * rr, 0, a, 0, [1.1, .7, .45]); }
    add(G.tor(RB + .055, .014, PI * 2, 4, 40), GOLD, 0, .1, 0, HP, 0, 0);
    for (const y of [2.235, 2.365]) add(G.tor(rAt(y) + .008, .012, PI * 2, 4, 44), GOLD, 0, y, 0, HP, 0, 0);
    // 넘치는 팝콘: 알갱이 모양(혹 셋 + 껍질)으로, 가운데가 봉긋, 통 테 밖으로 흘러내린 몇 알
    const r = rnd(17);
    add(G.sph(RT - .06, 18, 8), '#f8e8c4', 0, H + .04, 0, 0, 0, 0, [1, .36, 1]);
    for (let k = 0; k < 64; k++) { const a = r() * PI * 2, rr = RT * Math.sqrt(r()) * .93, y = H + .05 + (1 - (rr / RT) ** 2) * .44 + r() * .06, s = .15 + r() * .08; kernel(add, Math.cos(a) * rr, y, Math.sin(a) * rr, s, r); }
    for (let k = 0; k < 9; k++) { const a = -.9 + k * .45 + r() * .2; kernel(add, Math.sin(a) * (RT + .05), H - .04 - r() * .12, Math.cos(a) * (RT + .05), .13 + r() * .04, r, false); }
    // 창구: 앞으로 튀어나온 상자, 금빛 테, 안쪽 어두움, 반쯤 친 크림 커튼
    const zf = rAt(1.38) + .04;
    add(G.box(.7, .56, .2, .03), CREAM, 0, 1.38, zf - .08); add(G.box(.58, .44, .04, .01), '#3b2c3a', 0, 1.38, zf - .02);
    for (const [w, h, x, y] of [[.66, .05, 0, 1.63], [.66, .05, 0, 1.13], [.05, .52, -.33, 1.38], [.05, .52, .33, 1.38]]) add(G.box(w, h, .05, .015), GOLD, x, y, zf + .02);
    add(G.box(.56, .12, .02, .01), '#f2e3c4', 0, 1.53, zf - .005);
    // 말구멍: 크롬 둥근 판에 구멍 일곱(가운데 + 둘레 여섯), 테
    add(G.cyl(.06, .06, .012, 18), CHROME, 0, 1.3, zf + .035, HP, 0, 0); add(G.tor(.06, .008, PI * 2, 4, 20), '#aab0bd', 0, 1.3, zf + .042);
    for (let k = 0; k < 7; k++) { const a = k * PI / 3, rr = k ? .032 : 0; add(G.cyl(.008, .008, .006, 6), '#3b3446', Math.cos(a) * rr, 1.3 + Math.sin(a) * rr, zf + .043, HP, 0, 0); }
    // 유리 가운데 세로 살, 창 아래 돈 내미는 홈 (짙은 반달 구멍 + 금테)
    add(PB(.018, .42, .02), GOLDD, 0, 1.44, zf + .02);
    add(PB(.22, .026, .01), '#2a2230', 0, 1.13, zf + .048);
    // 받침 (동전 접시·표 뭉치·종)
    add(G.box(.8, .05, .26, .015), WOOD, 0, 1.085, zf + .1); add(G.box(.8, .02, .02, .005), GOLDD, 0, 1.06, zf + .23);
    for (const sx of [-1, 1]) { add(PB(.03, .1, .03), WOODD, sx * .34, 1.01, zf + .2); }
    add(G.cyl(.09, .07, .024, 16), '#c9a446', -.2, 1.122, zf + .13); add(G.tor(.088, .01, PI * 2, 4, 20), '#b48c40', -.2, 1.134, zf + .13, HP, 0, 0);
    for (const [dx, dz] of [[-.03, .01], [.03, -.02], [.0, .035], [.025, .03]]) add(G.cyl(.024, .024, .007, 10), '#e8d07a', -.2 + dx, 1.138, zf + .13 + dz);
    // 표 두루마리: 작은 받침 둘 사이 분홍 표 롤, 앞으로 풀려 나온 표 두 장(절취선)
    for (const sx of [-1, 1]) add(PB(.012, .1, .07), '#9aa0ad', .02 + sx * .055, 1.16, zf + .08);
    add(G.cyl(.045, .045, .095, 14), '#e8b0a0', .02, 1.165, zf + .08, 0, 0, HP); add(G.cyl(.016, .016, .12, 8), '#6f7680', .02, 1.165, zf + .08, 0, 0, HP);
    for (let k = 0; k < 2; k++) { add(PB(.07, .004, .075), k ? '#f6c2c2' : '#f3d8a0', .02, 1.115 + k * .002, zf + .145 + k * .074, .05, 0, 0); add(PB(.07, .005, .004), '#c48a6a', .02, 1.118 + k * .002, zf + .183 + k * .074); }
    // 손님 부르는 종 (은빛)
    add(G.cyl(.04, .045, .01, 14), '#7d7672', -.345, 1.115, zf + .18); add(G.sph(.033, 12, 6), '#dde0e8', -.345, 1.12, zf + .18, 0, 0, 0, [1, .9, 1]); add(G.sph(.008, 6, 4), '#9aa0ad', -.345, 1.155, zf + .18);
    // 서랍 집 (받침 밑)
    // (10/29 사용자 "책상 서랍 열리는 데 구멍 좀 뚫어라": the drawer ran into the solid body — a hole behind it, lined; the drawer front covers it shut)
    add(holeFace(G.box(.62, .26, .2, .02), [[-.255, .255, -.105, .1]]), CREAM, 0, .9, zf - .08); add(liner(.51, .205, .085, 'z'), shade(CREAM, -.3), 0, .8975, zf - .0225);
    // 간판 받침판과 작은 등
    add(G.box(.64, .24, .05, .02), CREAM, 0, 1.86, rAt(1.86) + .02); add(G.box(.04, .2, .04, .01), IRON, 0, 2.06, rAt(2.0) + .02); add(G.cone(.08, .07, 10), IRON, 0, 2.12, rAt(2.0) + .1);
  }));
  { const m = quad(.58, .19, texMat(kioskSignTex(), { rim: 0 })); put(m, 0, 1.86, rAt(1.86) + .047); f.add(m); }
  { const b = mesh(new THREE.SphereGeometry(.04, 8, 6), mat('#fff3d0', { emissive: GLOWC, ei: 1.3 }), { cast: false }); put(b, 0, 2.08, rAt(2.0) + .12); f.add(b); f.add(halo(0, 2.0, rAt(2.0) + .2, .8, '#ffcf8a', .4)); }
  { const zf = rAt(1.38) + .04; const g = mesh(new THREE.PlaneGeometry(.56, .42), mat('#cfe8f2', { opacity: .3, rim: 0 }), { cast: false }); put(g, 0, 1.38, zf + .005); f.add(keep(g));
    // 유리 반짝임 사선 둘 (색만)
    for (const [x, w] of [[-.16, .05], [-.08, .02]]) { const sh = mesh(new THREE.PlaneGeometry(w, .36), mat('#ffffff', { opacity: .35, rim: 0 }), { cast: false }); put(sh, x, 1.4, zf + .008, 0, 0, -.5); f.add(colourOnly(keep(sh))); } }
  // 통 위 띠 글자판 (둘레 한 바퀴)
  { const m = mesh(new THREE.CylinderGeometry(rAt(2.36) + .006, rAt(2.24) + .006, .12, 48, 1, true), texMat(bucketBandTex(), { rough: .7 })); put(m, 0, 2.3, 0); f.add(m); }
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
    // (디테일 10/24) 앞판 금빛 귀 장식 넷, 위 손잡이 고리, 다리 끝 고무 발
    const C = [0, H / 2 + .02, .14];
    for (const [dx, dy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const p = onTilt(C, -tilt, dx * (W / 2 - .01), dy * (H / 2 - .01), .03); add(PB(.07, .07, .012), GOLD, ...p, -tilt, 0, dx * dy * .0); }
    add(G.tor(.06, .014, PI, 4, 12), GOLDD, 0, H + .1, 0); 
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.08, .03, .07, .01), '#4a3a3a', sx * (W / 2 - .02), .015, sz * (.14 + H * Math.sin(tilt) * .5));
  }));
  const m = quad(W, H * .92, texMat(showTex(), { rim: .05 })); put(m, 0, H / 2 + .02, .14 + .03, -tilt); f.add(m);
  f.board = m;
  // (in front of the board, not under it: between the A-frame's legs a thing stayed about 24 px whatever it was — the board
  // above held it down, ② 10/24; on the open floor at the front it can be as big as the rest)
  f.spot('beside', null, 0, 0, .4, { maxH: .6, label: '상영 판 앞', scale: 1 });
};

// ── 팝콘 매점: 줄무늬 카운터(아래 칸 문 — pad 여분), 위에 유리 뚜껑 팝콘 기계, 그 위 벽 선반(열쇠가 걸림 → 팝콘이 넘치면 툭),
// 다락 앞면엔 메뉴판. 기계를 누르면 퐁퐁: 팝콘 더미가 부풀고 넘쳐 카운터·바닥으로 (f.popcornPile, f.spill), 걸린 열쇠는 카운터로 떨어짐(엔진 dropHung) ──
// (디테일 10/24: 칠판 결·분필 자국, 메뉴마다 작은 그림(팝콘 통·콜라 컵·오징어)과 값, 가운데는 열쇠가 걸리는 황동 고리판 — 열쇠가 글자를 안 가림)
const MENU_ICON = {
  '팝콘': (c, x, y) => { c.fillStyle = '#e0545c'; c.beginPath(); c.moveTo(x - 15, y - 6); c.lineTo(x + 15, y - 6); c.lineTo(x + 11, y + 22); c.lineTo(x - 11, y + 22); c.closePath(); c.fill(); c.fillStyle = '#fff4e2'; for (const dx of [-7, 3]) c.fillRect(x + dx, y - 6, 4, 28); for (const [dx, dy, rr] of [[-9, -10, 7], [0, -14, 8], [9, -10, 7], [-3, -6, 6], [5, -5, 6]]) { c.beginPath(); c.arc(x + dx, y + dy, rr, 0, PI * 2); c.fill(); } },
  '콜라': (c, x, y) => { c.fillStyle = '#c94a50'; c.beginPath(); c.moveTo(x - 12, y - 10); c.lineTo(x + 12, y - 10); c.lineTo(x + 9, y + 22); c.lineTo(x - 9, y + 22); c.closePath(); c.fill(); c.fillStyle = '#fff4e2'; c.fillRect(x - 13, y - 14, 26, 5); c.fillRect(x - 8, y + 2, 16, 5); c.strokeStyle = '#f3efe2'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 3, y - 14); c.lineTo(x + 8, y - 28); c.stroke(); },
  '오징어': (c, x, y) => { c.fillStyle = '#f3dcae'; c.beginPath(); c.moveTo(x, y - 22); c.lineTo(x + 11, y - 4); c.lineTo(x + 9, y + 8); c.lineTo(x - 9, y + 8); c.lineTo(x - 11, y - 4); c.closePath(); c.fill(); c.strokeStyle = '#f3dcae'; c.lineWidth = 3; c.lineCap = 'round'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 4, y + 8); c.quadraticCurveTo(x + k * 6, y + 16, x + k * 5, y + 24); c.stroke(); } c.fillStyle = '#35503f'; c.beginPath(); c.arc(x - 4, y + 1, 2, 0, PI * 2); c.arc(x + 4, y + 1, 2, 0, PI * 2); c.fill(); },
};
const menuStripTex = once(() => canvasTex(784, 160, (c, W, H) => {
  c.fillStyle = '#35503f'; c.fillRect(0, 0, W, H); const r = rnd(23);
  for (let i = 0; i < 260; i++) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; c.fillRect(r() * W, r() * H, 2 + r() * 14, 1.5); }
  c.strokeStyle = 'rgba(243,239,226,.09)'; c.lineWidth = 9; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(40 + i * 260, 30 + r() * 90); c.quadraticCurveTo(140 + i * 260, 10 + r() * 140, 220 + i * 260, 40 + r() * 80); c.stroke(); }
  c.strokeStyle = '#c9a46a'; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10); c.strokeStyle = 'rgba(255,240,200,.35)'; c.lineWidth = 2; c.strokeRect(14, 14, W - 28, H - 28);
  say(c, T('매점'), 72, H / 2 + 2, 110, 50, '#ffe28a', { weight: 'bold', stroke: '#24382c', sw: 6 });
  c.fillStyle = 'rgba(243,239,226,.4)'; c.fillRect(134, 26, 3, H - 52); c.fillRect(W - 336, 26, 3, H - 52);
  // 가운데 고리판 (열쇠 자리 x -.02 m → 376 px)
  const hx = 376; c.fillStyle = '#b48c40'; c.beginPath(); c.ellipse(hx, H / 2, 70, 56, 0, 0, PI * 2); c.fill();
  c.fillStyle = '#d9b25e'; c.beginPath(); c.ellipse(hx, H / 2, 62, 48, 0, 0, PI * 2); c.fill();
  c.strokeStyle = '#b48c40'; c.lineWidth = 2; c.beginPath(); c.ellipse(hx, H / 2, 52, 38, 0, 0, PI * 2); c.stroke();
  c.fillStyle = '#8a6a32'; for (const dx of [-44, 44]) { c.beginPath(); c.arc(hx + dx, H / 2, 4, 0, PI * 2); c.fill(); }
  const item = (name, price, x) => { MENU_ICON[name](c, x, H / 2 - 4); say(c, T(name), x + 80, H / 2 - 18, 104, 30, '#f3efe2', { weight: 'bold' }); say(c, price, x + 80, H / 2 + 22, 100, 27, '#f6d98a'); };
  item('팝콘', '3,000', 168); item('콜라', '1,500', W - 302); item('오징어', '2,000', W - 156);
}));
const popSignTex = once(() => canvasTex(160, 40, (c, W, H) => { c.fillStyle = '#c94a50'; c.fillRect(0, 0, W, H); say(c, LANG === 'en' ? 'POPCORN' : '팝콘', W / 2, H / 2 + 1, W * .86, 28, '#fff3d6', { weight: 'bold' }); }));
B.cin_popcorn = (f, T0) => {
  const CW = 1.0, CD = .56, CH = .88, MX = -.12, BACK = -.36, MENUZ = -.3;
  f.add(mc('cin-popcorn-counter', ({ add, tube }) => {
    add(G.box(.04, CH, CD, .01), '#f3e2c8', -CW / 2 + .02, CH / 2, 0); add(G.box(.04, CH, CD, .01), '#f3e2c8', CW / 2 - .02, CH / 2, 0);
    add(G.box(CW, CH, .04, .01), '#f3e2c8', 0, CH / 2, -CD / 2 + .02); add(G.box(CW, .06, CD, .01), '#6a4a3e', 0, .03, 0);
    add(G.box(CW - .08, .02, CD - .08, .005), '#6a4a3e', 0, .42, -.02); add(G.box(CW - .08, CH - .1, .01, .005), '#5c4036', 0, CH / 2, -CD / 2 + .045);
    add(G.box(CW + .06, .05, CD + .06, .02), WOOD, 0, CH + .025, 0); add(G.box(CW + .06, .015, .02, .005), GOLDD, 0, CH, CD / 2 + .03);
    add(PB(CW - .02, .05, .012), GOLDD, 0, .035, CD / 2 + .006);
    // 기계 (디테일 10/24 — 사용자 사진 '팝콘 기계'): 빨간 받침(앞 금판·바람구멍·손잡이 둘), 금빛 둥근 기둥 넷과 공 장식, 지붕 밑 물결 차양,
    // 지붕 네 귀 공, 위 글자판; 안쪽엔 매달린 은빛 주전자(뚜껑·젓는 손잡이·줄 둘)
    add(G.box(.52, .13, .4, .02), KRED, MX, CH + .115, 0); add(G.box(.54, .02, .42, .01), GOLD, MX, CH + .18, 0);
    add(PB(.3, .07, .01), GOLD, MX, CH + .115, .205); for (let k = -1; k <= 1; k++) add(PB(.06, .012, .006), '#8a3a3e', MX + k * .08, CH + .115, .212);
    for (const sx of [-1, 1]) { add(G.cyl(.022, .022, .02, 12), CREAM, MX + sx * .2, CH + .115, .21, HP, 0, 0); add(G.sph(.012, 8, 6), IRON, MX + sx * .2, CH + .115, .222); }
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { add(G.cyl(.016, .016, .42, 10), GOLD, MX + sx * .245, CH + .4, sz * .185); for (const y of [CH + .2, CH + .6]) add(G.sph(.024, 8, 6), GOLDD, MX + sx * .245, y, sz * .185); }
    add(G.box(.56, .07, .44, .02), KRED, MX, CH + .645, 0); add(G.box(.58, .02, .46, .01), GOLD, MX, CH + .61, 0);
    { const hs = new THREE.Shape(); hs.moveTo(-.04, 0); hs.absarc(0, 0, .04, PI, 0, false); hs.closePath(); const hd = ext(hs, .012, 8);
      for (let k = 0; k < 7; k++) add(hd, k % 2 ? CREAM : KRED, MX - .24 + k * .08, CH + .6, .222);
      for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) add(hd, k % 2 ? CREAM : KRED, MX + sx * .292, CH + .6, -.16 + k * .08, 0, sx * HP, 0); }
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(G.sph(.026, 8, 6), GOLD, MX + sx * .27, CH + .7, sz * .2);
    add(G.box(.36, .13, .03, .02), KRED, MX, CH + .745, 0); add(G.box(.38, .02, .04, .01), GOLD, MX, CH + .815, 0);
    add(G.cyl(.08, .068, .1, 16), '#cfd3dc', MX + .03, CH + .49, -.02, 0, 0, .25); add(G.tor(.08, .01, PI * 2, 4, 18), '#aab0bd', MX + .043, CH + .54, -.02, HP, 0, .25);
    add(G.cone(.075, .035, 14), '#dde0e8', MX + .045, CH + .56, -.02, 0, 0, .25); add(G.cyl(.008, .008, .06, 6), '#9aa0ad', MX + .05, CH + .6, -.02); add(G.sph(.016, 8, 6), KRED, MX + .05, CH + .6, -.02);
    for (const dz of [-.075, .075]) { add(G.sph(.012, 6, 4), '#9aa0ad', MX + .03, CH + .5, -.02 + dz); tube([MX + .03, CH + .5, -.02 + dz], [MX + .01, CH + .61, -.02 + dz * 1.2], .006, '#9aa0ad', 5); }
    { const r = rnd(41); for (let k = 0; k < 3; k++) kernel(add, MX - .045 - k * .02, CH + .5 - k * .03, -.02 + (k - 1) * .03, .05, r, false); }
    // 카운터 위 살림: 줄무늬 종이컵에 꽂힌 빨대, 냅킨 통(한 장 빼꼼)
    add(G.cyl(.04, .035, .1, 12), '#f6efe2', .36, CH + .05, -.18); for (const y of [.02, .065]) add(G.cyl(.0405, .038, .012, 12), KRED, .36, CH + y, -.18);
    for (const dx of [-.01, .012]) add(G.cyl(.006, .006, .12, 5), ['#e0545c', '#4f86b8'][dx > 0 ? 1 : 0], .36 + dx, CH + .13, -.18, 0, 0, dx * 6);
    add(G.box(.12, .08, .06, .01), '#d9dde6', .2, CH + .04, -.2); add(PB(.07, .03, .004), '#fffdf6', .2, CH + .09, -.2, 0, 0, .1); add(PB(.08, .02, .002), GOLD, .2, CH + .045, -.169);
    // 위 선반 둘 (다락 앞 밑, 쇠 받침): 가운데를 비워 열쇠가 메뉴판 고리에 매달려 내려옴 — 왼쪽엔 옛 필름 통, 오른쪽엔 깡통 컵과 작은 팝콘 상자
    add(G.box(.34, .035, .2, .01), WOOD, MX - .2, 1.82, BACK + .12); add(G.box(.2, .035, .2, .01), WOOD, .15, 1.82, BACK + .12);
    for (const x of [MX - .3, .2]) { add(G.box(.025, .16, .025, .005), IRON, x, 1.89, BACK + .03); add(G.box(.025, .025, .16, .005), IRON, x, 1.8, BACK + .1); }
    add(PB(.34, .012, .012), GOLDD, MX - .2, 1.8, BACK + .22); add(PB(.2, .012, .012), GOLDD, .15, 1.8, BACK + .22);
    add(G.cyl(.12, .12, .035, 18), '#9aa0ad', MX - .2, 1.856, BACK + .12); add(G.cyl(.05, .05, .036, 12), '#6f7680', MX - .2, 1.857, BACK + .12);
    for (let k = 0; k < 4; k++) { const a = k * HP + .4; add(G.cyl(.022, .022, .037, 8), '#7d8490', MX - .2 + Math.cos(a) * .08, 1.857, BACK + .12 + Math.sin(a) * .08); }
    add(G.cyl(.035, .035, .08, 10), '#c9cfe0', MX + .27, 1.88, BACK + .1); add(G.tor(.035, .006, PI * 2, 4, 12), '#9aa0ad', MX + .27, 1.92, BACK + .1, HP, 0, 0);
    add(PB(.05, .07, .05), KRED, .225, 1.873, BACK + .14); add(PB(.012, .07, .052), CREAM, .225, 1.873, BACK + .14);
    { const r = rnd(43); for (let k = 0; k < 3; k++) kernel(add, .215 + k * .012, 1.92 + (k % 2) * .01, BACK + .13 + (k - 1) * .015, .028, r, false); }
    // 메뉴판 받침 (다락 앞면)과 금테, 가운데 열쇠 고리(받침 장식 + 앞으로 나온 황동 못, 끝 공) — 걸린 열쇠의 하트 구멍에 끼움
    add(G.box(1.02, .24, .03, .02), '#2a3a30', 0, 2.08, MENUZ);
    for (const [w, h, x, y] of [[1.06, .03, 0, 2.205], [1.06, .03, 0, 1.955], [.03, .28, -.525, 2.08], [.03, .28, .525, 2.08]]) add(G.box(w, h, .04, .008), GOLD, x, y, MENUZ + .01);
    add(G.cyl(.026, .03, .012, 14), GOLDD, -.02, 2.02, MENUZ + .022, HP, 0, 0);
    add(G.cyl(.009, .009, .1, 8), GOLD, -.02, 2.02, MENUZ + .067, HP, 0, 0); add(G.sph(.017, 10, 8), GOLD, -.02, 2.02, MENUZ + .118);
  }));
  // 기계 안 따뜻한 작은 등, 글자판 양 끝 전구, 메뉴판 위 전구 줄 (색만 빛남)
  f.add(bulbRow([[MX - .12, CH + .575, -.12], [MX - .2, CH + .745, .028], [MX + .2, CH + .745, .028], ...Array.from({ length: 11 }, (_, i) => [-.45 + i * .09, 2.232, MENUZ + .03])], .019));
  { const m = quad(.98, .2, texMat(menuStripTex(), { rim: 0 })); put(m, 0, 2.08, MENUZ + .0165); f.add(m); }
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
  // (알이 한 알 한 알 보이게: 버터 바닥 한 겹 위에 듬성듬성 격자로 — 빽빽하면 테두리선이 합쳐져 흰 구름 덩어리로 읽힘)
  pile.add(mc('cin-popcorn-pile', ({ add }) => {
    const r = rnd(5); add(G.box(.4, .03, .3, .012), '#f3dca8', 0, .015, 0);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) kernel(add, -.15 + i * .1 + (r() - .5) * .03, .05 + r() * .02, -.1 + j * .1 + (r() - .5) * .03, .085 + r() * .02, r);
    for (let k = 0; k < 4; k++) kernel(add, -.1 + k * .07, .11 + r() * .02, (r() - .5) * .1, .08, r);
  }));
  // 팝콘 국자 (뒤 왼쪽 구석에 기대 둠): 은빛 구멍 국자 + 빨간 손잡이
  machine.add(mc('cin-popcorn-scoop', ({ add, tube }) => {
    add(G.cyl(.05, .036, .045, 14, true), '#dde0e8', -.17, .07, -.1, .5, 0, .2); add(G.cyl(.036, .036, .004, 14), '#aab0bd', -.168, .05, -.105, .5, 0, .2);
    tube([-.15, .09, -.08], [-.08, .33, -.03], .009, '#c9cfe0', 6); tube([-.1, .26, -.045], [-.07, .37, -.02], .015, KRED, 8);
  }));
  const spill = grp(); f.add(spill);
  const SP = []; { const r = rnd(9); for (let k = 0; k < 18; k++) { const floor = k > 12, x = floor ? (r() - .4) * .7 : MX + (r() - .5) * .8, z = floor ? CD / 2 + .12 + r() * .35 : (r() - .2) * .4, y = floor ? .03 : CH + .07; if (!floor && Math.abs(x - MX) < .27 && Math.abs(z) < .2) continue; SP.push([x, y, z]); } }
  SP.forEach(([x, y, z], k) => { const m = mc('cin-kernel|' + (k % 3), ({ add }) => kernel(add, 0, 0, 0, .085, rnd(31 + k % 3), k % 3 === 0)); m.castShadow = false; m.scale.set(0, 0, 0); put(m, x, y, z); m.userData.y0 = y; m.userData.noMerge = true; spill.add(m); });
  f.popcornPile = pile; f.spill = spill; (f.live || (f.live = [])).push(pile, spill);
  const lid = grp(); put(lid, MX, CH + .6, .2); f.add(lid);
  lid.add(keep(put(mesh(new THREE.PlaneGeometry(.46, .38), mat('#dff3ff', { opacity: .35, rim: 0, side: THREE.DoubleSide }), { cast: false }), 0, -.2, 0)));
  lid.add(mc('cin-popcorn-lid', ({ add }) => { add(G.box(.48, .025, .02, .006), GOLD, 0, -.39, 0); add(G.box(.48, .02, .02, .006), GOLD, 0, -.01, 0); for (const sx of [-1, 1]) add(G.box(.02, .4, .02, .006), GOLD, sx * .235, -.2, 0); add(G.sph(.025, 8, 6), '#ffffff', 0, -.36, .03); add(G.box(.08, .016, .02, .006), GOLDD, 0, -.36, .02); }));
  const n = SP.length;
  const p = f.part('lid', [lid, machine], t => {
    lid.rotation.x = -2.6 * ss(Math.min(1, t * 2.2));
    const k = ss(t); pile.scale.set(1 + .15 * k, 1 + 1.7 * k, 1 + .15 * k);
    spill.children.forEach((m, i) => { const s = ss((t - .22 - .6 * i / n) / .16); m.scale.setScalar(s); m.position.y = m.userData.y0 + (1 - s) * .3; });
  }, { label: '팝콘 기계', sfx: 'pop', dur: 1.5 });
  p.steps = [[0, 'pop'], [.18, 'pop'], [.34, 'pop'], [.5, 'pop'], [.66, 'pop'], [.84, 'pop']]; p.gpt2Reach = true;
  // 걸린 열쇠가 떨어질 자리 (판짜기는 안 씀 — reserved), 위 선반의 열쇠 고리 자리(hang)
  // (31판 QA 10/29: 이 자리가 '팝콘 기계 안'보다 뒤에 있어서 dropHung이 첫 빈 안쪽 자리인 기계 안으로 떨어뜨림 → 부푼 팝콘 더미에 묻혀
  // 열쇠가 안 보이고 눌리지도 않음, 봇·도움 봇이 거기서 멈춤 — 떨어질 자리를 먼저 둠)
  f.spot('inside', null, MX + .38, CH + .055, .16, { part: p, maxH: .2, label: '넘친 팝콘 사이', scale: .8 }).reserved = true;
  f.spot('inside', machine, 0, .15, .03, { part: p, maxH: .24, label: '팝콘 기계 안', scale: .75 });
  // (디테일 10/24: 걸린 열쇠는 벽에 선 채(wallFace — 7판 도르래 고리와 같은 방식) 메뉴판 못에 하트 구멍으로 매달림 — 누워 있던 열쇠가 고리 쪽으로
  // 비틀려 '도넛 + 분홍 공'으로만 보였음, 사용자 10/24 "열쇠는 왜이럼"; 크기 ×0.7 = 약 47 cm, 두 선반 사이로 내려와 기계 지붕엔 안 닿음)
  f.keySpot = f.spot('on', null, MX + .1, 1.84, BACK + .12, { maxH: .24, label: '팝콘 위 선반', scale: .7, wallFace: true });
  f.keySpot.hang = p;
  f.spot('on', null, .34, CH + .05, .1, { maxH: 0.45, label: '매점 카운터 위', scale: 1 });
};

// ── 상영관 문: 다락 밑 앞면의 쌍여닫이 (빨간 가죽 누빔·황동 징·둥근 창), 뒤에 얕은 칸(소화기·우산), 다락 앞면엔 '상영관' 글자 ─────────
B.cin_hall_door = (f, T0) => {
  const DW = .52, DH = 1.68, Z = .06;
  f.add(mc('cin-halldoor', ({ add, tube }) => {
    for (const sx of [-1, 1]) add(G.box(.09, 1.9, .16, .02), WAIND, sx * .56, .95, 0);
    add(G.box(1.21, .1, .16, .02), WAIND, 0, 1.85, 0); add(G.box(1.25, .03, .18, .01), GOLD, 0, 1.9, 0);
    // 문 뒤 얕은 칸
    add(G.box(1.04, 1.8, .04, .01), '#5a2f33', 0, .9, -.42); for (const sx of [-1, 1]) add(G.box(.04, 1.8, .44, .01), '#6a3a3c', sx * .5, .9, -.2);
    add(G.box(1.04, .02, .44, .005), '#8a3f46', 0, .01, -.2);
    add(G.cyl(.07, .07, .34, 12), '#d9453f', -.38, .17, -.32); add(G.cyl(.03, .03, .06, 8), '#3a3540', -.38, .37, -.32);
    add(G.box(.86, .04, .02, .005), GOLDD, 0, 1.3, -.39);
    // (19판~ 다듬기 10/29: 이 칸의 등이 다락 밑에서 뒤로 돌리면 민 고동색 판 하나) 판자 줄과 가로대, 못에 건 안내원 조끼, 기대 세운 빗자루
    for (let k = 1; k < 6; k++) add(G.box(.012, 1.76, .01, .003), '#4a262a', -.52 + k * .173, .9, -.445);
    for (const y of [.35, 1.45]) add(G.box(1.0, .06, .025, .008), '#6a3a3c', 0, y, -.455);
    add(G.cyl(.012, .012, .06, 6), GOLDD, -.2, 1.6, -.48, HP, 0, 0); add(G.box(.28, .42, .04, .03), '#a8434c', -.2, 1.36, -.49); add(G.box(.12, .2, .045, .02), '#7d2f38', -.2, 1.47, -.49);
    for (const y of [1.3, 1.2]) add(G.sph(.014, 6, 5), GOLD, -.2, y, -.513);
    tube([.3, .02, -.62], [.36, 1.15, -.47], .016, '#c9a46a', 5); add(G.cone(.09, .26, 8), '#d8b56c', .3, .1, -.63, .1, 0, 0);
    // 다락 앞면 글자 받침
    add(G.box(.86, .24, .03, .02), '#6a2a36', 0, 2.08, .15);
  }));
  { const m = quad(.82, .2, texMat(hallSignTex(), { rim: 0 })); put(m, 0, 2.08, .167); f.add(m); }
  f.add(bulbRow([-.39, -.13, .13, .39].map(x => [x, 2.215, .16]), .018));
  // (문짝 둘: 경첩이 바깥, 만나는 쪽이 가운데 — s = -1 왼쪽, 1 오른쪽)
  const leaf = (s) => {
    const pv = grp(); put(pv, s * (DW + .02), .06, Z); f.add(pv);
    pv.add(mc('cin-halldoor-leaf|' + s, ({ add }) => {
      add(G.box(DW, DH, .06, .03), '#a8434c', -s * DW / 2, DH / 2, 0);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) add(G.sph(.014, 6, 5), GOLD, -s * DW / 2 - .18 + i * .12, .2 + j * .2, .034);
      add(G.cyl(.1, .1, .02, 18), '#3b3446', -s * DW / 2, 1.32, .03, HP, 0, 0); add(G.tor(.1, .02, PI * 2, 6, 20), GOLD, -s * DW / 2, 1.32, .04);
      add(G.box(.08, .26, .02, .006), GOLD, -s * (DW - .07), .95, .04);
      // (디테일 10/24) 누빔 테두리 줄, 아래 황동 발판, 둥근 창 안 반짝임 줄
      for (const [w, h, dx, dy] of [[DW - .06, .018, 0, DH - .05], [DW - .06, .018, 0, .1], [.018, DH - .15, -(DW / 2 - .03), DH / 2 + .02], [.018, DH - .15, DW / 2 - .03, DH / 2 + .02]]) add(PB(w, h, .008), '#7d2f38', -s * DW / 2 + dx, dy, .033);
      add(PB(DW - .04, .1, .012), GOLDD, -s * DW / 2, .05, .036);
      add(PB(.1, .016, .005), '#9fb0c8', -s * DW / 2 - .02, 1.35, .042, 0, 0, .6);
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
// (디테일 10/24 — 사용자 사진 '좌석 줄'): 방석은 앞 둥근 말이·누빔 줄, 등받이는 세로 골 셋 누빔 + 위 말이, 뒤 나무 껍데기엔 짙은 판·징·번호판,
// 팔걸이마다 컵홀더, 줄 끝 옆판엔 줄 글자 원판 (opts.row 'A'…, opts.first 첫 번호)
const seatParts = (f, xs, wide = false) => xs.map(x => {
  const pv = grp(); put(pv, x, .44, -.12); f.add(pv);
  const w = wide ? 1.04 : .48;
  pv.add(mc('cin-seat-cushion2|' + w, ({ add }) => {
    add(G.box(w, .11, .42, .05), VELVET, 0, 0, .21); add(G.box(w - .02, .03, .4, .01), VELVETD, 0, -.065, .21);
    add(G.cyl(.058, .058, w - .02, 14), shade(VELVET, .05), 0, -.002, .385, 0, 0, HP);
    for (let k = 1; k < (wide ? 6 : 3); k++) add(PB(.012, .006, .32), VELVETD, -w / 2 + k * w / (wide ? 6 : 3), .056, .19);
  }));
  return { pv, x };
});
const SEATNO = {}, ROWT = {};
const seatNoTex = s => SEATNO[s] || (SEATNO[s] = canvasTex(96, 44, (c, W, H) => { c.fillStyle = '#e8c46a'; c.fillRect(0, 0, W, H); c.strokeStyle = '#a8803c'; c.lineWidth = 4; c.strokeRect(2, 2, W - 4, H - 4); say(c, s, W / 2, H / 2 + 2, W * .8, 30, '#5a3a22', { weight: 'bold' }); }));
const rowTex = s => ROWT[s] || (ROWT[s] = canvasTex(96, 96, (c, W, H) => { c.fillStyle = '#d9b25e'; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 2, 0, PI * 2); c.fill(); c.fillStyle = '#6a2a36'; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 10, 0, PI * 2); c.fill(); say(c, s, W / 2, H / 2 + 3, W * .6, 50, '#ffe6a6', { weight: 'bold' }); }));
const BACK_TILT = -.1;
const seatBack = (add, x, yc) => {
  const C = [x, yc, -.2], at = (dx, dy, dz) => onTilt(C, BACK_TILT, dx, dy, dz);
  for (const k of [-1, 0, 1]) add(G.box(.155, .5, .1, .045), k ? VELVET : shade(VELVET, .06), ...at(k * .163, -.02, 0), BACK_TILT, 0, 0);
  for (const k of [-.5, .5]) add(PB(.012, .46, .09), VELVETD, ...at(k * .163, -.02, .006), BACK_TILT, 0, 0);
  add(G.cyl(.055, .055, .5, 14), shade(VELVET, -.03), ...at(0, .25, -.01), 0, 0, HP);
  add(G.box(.52, .6, .04, .03), SEATBK, ...at(0, .01, -.07), BACK_TILT, 0, 0);
  add(PB(.4, .38, .01), shade(SEATBK, -.12), ...at(0, -.04, -.093), BACK_TILT, 0, 0);
  for (const [dx, dy] of [[-.2, .2], [.2, .2], [-.2, -.25], [.2, -.25]]) add(G.sph(.014, 5, 4), GOLDD, ...at(dx, dy, -.094));
  add(PB(.13, .055, .012), GOLDD, ...at(0, .2, -.094), BACK_TILT, 0, 0);
};
// 팔걸이 위 컵홀더 (둥근 받침 + 금테 + 짙은 구멍)
const cupHolder = (add, x) => { add(G.cyl(.052, .052, .05, 10), WOODD, x, .63, .16); add(G.tor(.042, .011, PI * 2, 3, 12), GOLDD, x, .657, .16, HP, 0, 0); add(G.cyl(.034, .034, .012, 8), '#2a2230', x, .652, .16); };
// 등받이 뒤 번호판 글자 (좌석마다 따로 — 줄 글자 + 번호)
const seatNumbers = (f, xs, row, first, yc) => { if (!row) return; xs.forEach((x, i) => { const m = quad(.11, .045, texMat(seatNoTex(row + (first + i)), { rim: 0 })); put(m, ...onTilt([x, yc, -.2], BACK_TILT, 0, .2, -.104), BACK_TILT, PI, 0); f.add(m); }); };
const rowDisc = (f, row, x, s) => { if (!row) return; const m = mesh(new THREE.CircleGeometry(.085, 24), texMat(rowTex(row), { rim: 0 }), { cast: false }); put(m, x + s * .047, .34, -.04, 0, s * HP, 0); f.add(m); };
B.cin_seatrow = (f, T0, o = {}) => {
  const n = o.n || 4, SPC = .6, x0 = -(n - 1) / 2 * SPC, xs = Array.from({ length: n }, (_, i) => x0 + i * SPC);
  f.add(mc('cin-seatrow|' + n, ({ add }) => {
    for (const x of xs) { seatBack(add, x, .74); add(G.box(.42, .04, .06, .01), IRON, x, .34, -.12); }
    for (let i = 0; i <= n; i++) { const x = x0 - SPC / 2 + i * SPC, end = i === 0 || i === n;
      add(G.box(end ? .07 : .05, .6, .46, .02), end ? IRON : '#5a5468', x, .3, -.04); add(G.box(.08, .05, .48, .02), WOODD, x, .63, -.02); cupHolder(add, x);
      if (end) { const ox = x + (i ? .04 : -.04); add(G.tor(.1, .016, PI * 2, 6, 20), GOLD, ox, .34, -.04, 0, HP, 0); add(G.cyl(.09, .09, .01, 20), '#6a2a36', ox - (i ? .002 : -.002), .34, -.04, 0, 0, HP); } }
    add(G.box(n * SPC + .1, .04, .08, .01), IRON, 0, .03, -.22);
  }));
  seatNumbers(f, xs, o.row, o.first || 1, .74);
  rowDisc(f, o.row, x0 - SPC / 2, -1); rowDisc(f, o.row, x0 - SPC / 2 + n * SPC, 1);
  const under = new Set(o.under || xs.map((_, i) => i).filter(i => i % 2 === 1));
  f.seats = seatParts(f, xs).map(({ pv, x }, i) => {
    const p = f.part('lift', pv, (t, b) => { pv.rotation.x = b.r.x - 1.45 * t; }, { label: '접이식 좌석', sfx: 'lift', dur: .28 });
    if (under.has(i)) f.spot('inside', null, x, .02, .1, { part: p, maxH: .3, label: '좌석 밑', scale: .85 });
    return p;
  });
};
// ── 붙어 있는 의자 두 개 (커플석): 가운데 팔걸이 없이 한 방석, 두 등판 사이 황동 사슬과 하트 판 ───────────────────────────
B.cin_twinseat = (f, T0, o = {}) => {
  const xs = [-.28, .28];
  f.add(mc('cin-twinseat', ({ add, tube }) => {
    for (const x of xs) seatBack(add, x, .75);
    for (const x of [-.6, .6]) { add(G.box(.07, .6, .46, .02), IRON, x, .3, -.04); add(G.box(.08, .05, .48, .02), WOODD, x, .63, -.02); cupHolder(add, x); }
    add(G.box(1.16, .04, .06, .01), IRON, 0, .34, -.12); add(G.box(1.26, .04, .08, .01), IRON, 0, .03, -.22);
    // 사슬 (등판 꼭대기 사이로 처짐)과 하트 판
    for (let k = 0; k < 5; k++) { const t = (k + .5) / 5, x = -.18 + t * .36, y = 1.02 - Math.sin(t * PI) * .07; add(G.tor(.022, .006, PI * 2, 4, 10), GOLD, x, y, -.28, 0, k % 2 ? HP : 0, 0); }
    const hs = new THREE.Shape(); hs.moveTo(0, -.05); hs.bezierCurveTo(-.01, -.04, -.06, -.01, -.06, .02); hs.bezierCurveTo(-.06, .05, -.02, .06, 0, .03); hs.bezierCurveTo(.02, .06, .06, .05, .06, .02); hs.bezierCurveTo(.06, -.01, .01, -.04, 0, -.05);
    add(G.ext(hs, .015, 0, 6), GOLD, 0, .94, -.3);
  }));
  seatNumbers(f, xs, o.row, o.first || 1, .75);
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
    // the back, seen when the view turns round and the reel wall folds away (19판~ 다듬기 10/29: one flat black board): warm plank
    // backing with its battens and bolt heads, a stencilled frame number — thin, the reel wall stands right behind
    add(G.box(SW + .24, SH + .24, .03, .015), '#8a6448', 0, YC, -.105);
    for (let k = 0; k < 7; k++) add(G.box(.014, SH + .18, .01, .003), '#6e4d36', -SW / 2 + .05 + k * .48, YC, -.124);
    for (const dy of [-.55, .55]) { add(G.box(SW + .3, .07, .03, .015), '#6e4d36', 0, YC + dy, -.135); for (let k = 0; k < 6; k++) add(G.sph(.018, 6, 4), '#c9b28a', -SW / 2 + .2 + k * .52, YC + dy, -.152); }
    add(G.box(.36, .14, .01, .004), '#f2ede4', SW / 2 - .45, YC + .2, -.122); add(G.box(.26, .03, .006, .002), '#6e4d36', SW / 2 - .45, YC + .2, -.128);
    for (const sx of [-1, 1]) add(G.box(.1, YC - SH / 2 - .12, .1, .02), '#3a3540', sx * (SW / 2 - .25), (YC - SH / 2 - .12) / 2, -.08);
    add(G.box(SW + .4, .06, .14, .02), GOLDD, 0, YC + SH / 2 + .18, -.03);
    // (디테일 10/24) 화면 둘레 가는 금테와 아래 스피커 둘(천 망·금테)
    for (const [w, h, x, y] of [[SW + .06, .03, 0, YC + SH / 2 + .015], [SW + .06, .03, 0, YC - SH / 2 - .015], [.03, SH, -SW / 2 - .015, YC], [.03, SH, SW / 2 + .015, YC]]) add(PB(w, h, .02), GOLDD, x, y, .0);
    for (const sx of [-1, 1]) { add(G.box(.42, .34, .1, .03), '#3a3540', sx * .95, .2, -.06); add(PB(.36, .28, .01), '#5e5670', sx * .95, .2, -.005); add(G.tor(.1, .012, PI * 2, 4, 18), GOLDD, sx * .95, .2, .0); }
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
    // (디테일 10/24 — 사용자 사진 '커튼'): 휘장 이음마다 늘어진 금술 다섯(공 + 갓 + 술), 휘장 위 금빛 장대와 끝 공, 묶은 양옆 커튼엔 꼰 금줄 고리와 큰 술
    for (let k = 0; k <= 4; k++) { const x = -CW / 2 + .01 + k * .82; add(G.sph(.04, 8, 6), GOLD, x, TOP - .02, .19); add(G.cone(.05, .12, 10), '#e8c25a', x, TOP - .12, .19, PI, 0, 0); for (let j = 0; j < 6; j++) { const a = j / 6 * PI * 2; add(G.cyl(.006, .004, .1, 3, true), GOLDD, x + Math.cos(a) * .035, TOP - .22, .19 + Math.sin(a) * .035); } }
    add(G.cyl(.03, .03, CW + .58, 10), GOLDD, 0, TOP + .43, .06, 0, 0, HP); for (const s of [-1, 1]) { add(G.sph(.055, 10, 8), GOLD, s * (CW / 2 + .29), TOP + .43, .06); add(G.cone(.035, .08, 8), GOLD, s * (CW / 2 + .29), TOP + .52, .06); }
    for (const s of [-1, 1]) {
      add(pleat(.5, 2.52, .045, .17), CURTAIND, s * (CW / 2 + .12), .0, .08); add(pleat(.52, .06, .045, .17, .03), GOLD, s * (CW / 2 + .12), .02, .08);
      const tx = s * (CW / 2 + .12), ty = 1.05;
      for (let k = 0; k < 10; k++) { const a = k / 10 * PI * 2; add(G.sph(.026, 5, 3), k % 2 ? GOLD : GOLDD, tx + Math.cos(a) * .13, ty + Math.sin(a) * .13 * .35, .1 + Math.sin(a) * .13 * .9); }
      const hx = s * (CW / 2 + .22); add(G.sph(.06, 10, 8), GOLD, hx, .93, .2); add(G.cone(.08, .2, 12), '#e8c25a', hx, .78, .2, PI, 0, 0);
      add(G.tor(.06, .014, PI * 2, 4, 14), GOLDD, hx, .86, .2, HP, 0, 0);
      for (let j = 0; j < 8; j++) { const a = j / 8 * PI * 2; add(G.cyl(.007, .005, .14, 3, true), GOLDD, hx + Math.cos(a) * .06, .62, .2 + Math.sin(a) * .06); }
    }
    add(G.box(.5, .05, .05, .02), GOLDD, CX + .2, TOP + .3, .1);
  }));
  // 가운데서 갈라지는 두 폭: 바깥 끝(축)으로 주름이 모이며 걷힘 — 진짜 무대 막처럼 (위로 걷으면 차양처럼 화면 윗부분을, 관객 쪽으로 말면
  // 화면 앞을 가렸음); 주름 물결은 그대로라 모일수록 주름이 깊어 보임
  const half = s => {
    const pv = grp(); put(pv, s * CW / 2, 0, s > 0 ? .015 : 0); f.add(pv);
    pv.add(put(mesh(pleat(CW / 2 + .04, CH), mat(CURTAIN, { rough: .92, side: THREE.DoubleSide })), -s * CW / 4, .05, 0));
    pv.add(put(mesh(pleat(CW / 2 + .04, .07, .05, .22, .03), mat(GOLD, { side: THREE.DoubleSide })), -s * CW / 4, .02, 0));
    // 단 끝 금빛 술 (주름 물결을 따라 — 부품과 같이 모이며 걷힘)
    pv.add(put(mc('cin-curtain-fringe|' + s, ({ add }) => {
      const w = CW / 2 + .04, kk = PI * 2 / .22;
      for (let u = -w / 2 + .02; u < w / 2; u += .04) { const z = -.05 * Math.sin(kk * (u + w / 2)) + .022; add(G.cyl(.008, .005, .07, 3, true), GOLDD, u, .065, z); }
    }), -s * CW / 4, .02, 0));
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
  // (디테일 10/24: 구멍 사이로 감긴 필름 결 셋, 앞뒤 테, 가운데 육각 너트와 볼트 셋)
  g.add(mc('cin-reel|' + key, ({ add }) => {
    for (const z of [.06, -.1]) add(ext(s, .035, 20), REEL, 0, 0, z); add(G.cyl(r * .78, r * .78, .12, 24), FILM, 0, 0, -.02, HP, 0, 0); add(G.cyl(r * .2, r * .2, .2, 14), REELD, 0, 0, -.02, HP, 0, 0);
    add(G.tor(r, .02, PI * 2, 4, 32), REELD, 0, 0, .08); add(G.tor(r, .02, PI * 2, 4, 32), REELD, 0, 0, -.1);
    for (const k of [.42, .58, .72]) add(G.tor(r * k, .004, PI * 2, 3, 28), '#6e544c', 0, 0, .042);
    add(G.cyl(r * .13, r * .13, .03, 6), CHROME, 0, 0, .105, HP, 0, 0); for (let k = 0; k < 3; k++) { const a = k * PI * 2 / 3 + .5; add(G.sph(r * .03, 6, 4), '#9aa0ad', Math.cos(a) * r * .17, Math.sin(a) * r * .17, .098); }
  }));
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
    // (디테일 10/24 — 사용자 사진 '영사기'): 앞 모서리 크롬 띠, 계기판(바늘·눈금, 숫자 없음), 통풍구 테, 동쪽 옆 바람살, 지붕 테 리벳, 렌즈 통 크롬 고리,
    // 지붕 필름 홈 — 두 릴 사이 필름이 실제로 홈으로 감겨 들어감
    for (const sx of [-1, 1]) add(PB(.035, BH - .04, .035), CHROME, sx * (BW / 2 - .005), BH / 2, FZ - .01);
    add(G.cyl(.11, .11, .03, 20), CHROME, -.66, .62, FZ + .01, HP, 0, 0); add(G.cyl(.09, .09, .032, 20), CREAM, -.66, .62, FZ + .014, HP, 0, 0);
    for (let k = 0; k < 7; k++) { const a = PI * .15 + k * PI * .7 / 6; add(PB(.006, .022, .006), INK, -.66 + Math.cos(a) * .07, .62 + Math.sin(a) * .07, FZ + .031, 0, 0, a - HP); }
    add(PB(.008, .07, .005), KRED, -.66 + .02, .62 + .027, FZ + .033, 0, 0, -.65); add(G.sph(.012, 8, 6), INK, -.66, .62, FZ + .033);
    add(PB(.3, .02, .03), CHROME, .84, .43, FZ + .015); add(PB(.3, .02, .03), CHROME, .84, .93, FZ + .015);
    for (let k = 0; k < 6; k++) add(PB(.02, .035, .48), BOOTHD, BW / 2 + .01, .38 + k * .09, 0);
    for (const [y, z] of [[.24, -.4], [.24, .4], [1.2, -.4], [1.2, .4]]) add(G.sph(.022, 6, 5), CHROME, BW / 2 + .012, y, z);
    for (let k = 0; k < 9; k++) add(G.sph(.02, 6, 5), CHROME, -BW / 2 + .1 + k * (BW - .2) / 8, BH + .07, FZ + .075);
    for (const x of [-BW / 2 - .22, -BW / 2 - .46]) add(G.tor(.31, .02, PI * 2, 4, 28), CHROME, x, .78, 0, 0, HP, 0);
    add(PB(.32, .025, .15), '#1e2428', .12, BH + .142, -.08); for (const dz of [-.08, .08]) add(PB(.34, .02, .02), CHROME, .12, BH + .15, -.08 + dz);
  }));
  f.add(filmRibbon([[-.186, BH + .365, -.08], [-.1, BH + .25, -.08], [0, BH + .185, -.08], [.12, BH + .155, -.08], [.24, BH + .185, -.08], [.34, BH + .25, -.08], [.425, BH + .332, -.08]], .05, .008, () => [0, 0, 1]));
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
    // (디테일 10/24) 렌즈 통 크롬 고리 둘·초점 손잡이, 램프 집 갈비 셋·옆 바람구멍, 몸 위 바람살, 옆판 톱니바퀴 둘·필름 문, 받침 발 셋
    for (const z of [.3, .38]) add(G.tor(.07, .012, PI * 2, 4, 18), CHROME, 0, .64, z); add(G.cyl(.022, .022, .04, 10), CHROME, .08, .64, .34, 0, 0, HP);
    for (const y of [.79, .86, .93]) add(G.tor(.102, .01, PI * 2, 4, 18), CHROME, 0, y, -.15, HP, 0, 0);
    for (let k = -1; k <= 1; k++) add(PB(.012, .1, .022), '#2e3e44', .1, .86, -.15 + k * .045);
    for (let k = 0; k < 4; k++) add(PB(.16, .006, .018), '#2e3e44', 0, .801, .0 + k * .035);
    for (const [y, z] of [[.52, .14], [.56, -.13]]) { add(G.cyl(.035, .035, .05, 12), CHROME, .16, y, z, 0, 0, HP); add(G.cyl(.012, .012, .054, 6), IRON, .16, y, z, 0, 0, HP); }
    add(PB(.05, .1, .04), '#2e3e44', .155, .65, .275);
    for (let k = 0; k < 3; k++) { const a = k * PI * 2 / 3; add(PB(.05, .02, .14), IRON, Math.cos(a) * .12, .01, Math.sin(a) * .12, 0, -a, 0); }
  }));
  // 필름 길: 앞 릴에서 몸 위로 내려와, 옆판(카메라 쪽)에서 톱니바퀴·필름 문을 돌아 뒤로 감김
  body.add(filmRibbon([[-.02, .96, .24], [-.02, .88, .225], [-.02, .8, .21]], .03, .006, () => [1, 0, 0]));
  body.add(filmRibbon([[.155, .79, .21], [.155, .72, .225], [.155, .66, .245], [.155, .58, .23], [.155, .52, .18], [.155, .49, .1], [.155, .49, -.04], [.155, .52, -.14], [.155, .6, -.19], [.155, .7, -.2], [.155, .79, -.19]], .025, .006, () => [1, 0, 0]));
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
      // (디테일 10/24) 뚜껑 둘레 눌린 골 둘, 옆 걸쇠, 글자 없는 크림 종이 띠
      for (const k of [.72, .88]) add(G.tor(r * k, .005, PI * 2, 3, 22), '#b4b8c4', x, r + .06, .037);
      add(PB(.03, .05, .08), '#8a909c', x + r + .005, r + .06, 0); add(PB(.012, .02, .084), '#6f7680', x + r + .02, r + .06, 0);
      add(PB(r * .9, .028, .002), '#efe2c8', x, r + .06 - r * .62, .038);
    }
  }));
  // 가운데 통에서 받침 위로 흘러내린 필름 한 가닥
  f.add(filmRibbon([[.06, .3, .04], [.12, .24, .07], [.15, .14, .09], [.13, .085, .11], [.06, .065, .12]], .022, .004, () => [0, 0, 1]));
  f.spot('on', null, .4, .06, 0, { maxH: 0.45, label: '필름 통 받침 끝', scale: 1 });
};

// ── 포스터 받침 (황동 이젤에 액자 포스터) ────────────────────────────────────────────────────────────────────
B.cin_posterstand = (f, T0, o = {}) => {
  f.add(mc('cin-posterstand', ({ add, tube }) => {
    tube([-.28, 0, .12], [-.2, 1.5, 0], .018, GOLDD, 6); tube([.28, 0, .12], [.2, 1.5, 0], .018, GOLDD, 6); tube([0, 0, -.32], [0, 1.4, -.02], .018, GOLDD, 6);
    add(G.box(.6, .03, .05, .01), GOLD, 0, .48, .08); add(G.box(.62, .84, .05, .02), '#3a2c34', 0, .92, .05, -.08, 0, 0);
    // (디테일 10/24) 포스터 둘레 금빛 액자 테·귀 장식, 위 반원 왕관, 다리 끝 공, 받침 사이 가로대
    const C = [0, .92, .05];
    for (const [w, h, dx, dy] of [[.6, .035, 0, .39], [.6, .035, 0, -.39], [.035, .8, -.29, 0], [.035, .8, .29, 0]]) add(G.box(w, h, .02, .008), GOLD, ...onTilt(C, -.08, dx, dy, .033), -.08, 0, 0);
    for (const [dx, dy] of [[-.29, .39], [.29, .39], [-.29, -.39], [.29, -.39]]) add(G.sph(.022, 8, 6), GOLDD, ...onTilt(C, -.08, dx, dy, .045));
    { const fan = new THREE.Shape(); fan.moveTo(-.16, 0); fan.absarc(0, 0, .16, PI, 0, true); fan.closePath(); add(ext(fan, .03, 10), GOLD, ...onTilt(C, -.08, 0, .41, -.01), -.08, 0, 0); }
    add(G.ext(starShape(.05, .022), .02, 0, 4), GOLDD, ...onTilt(C, -.08, 0, .49, .02), -.08, 0, 0);
    for (const p of [[-.28, 0, .12], [.28, 0, .12], [0, 0, -.32]]) add(G.sph(.03, 8, 6), GOLDD, p[0], .02, p[2]);
    tube([-.25, .25, .1], [0, .25, -.2], .012, GOLDD, 5); tube([.25, .25, .1], [0, .25, -.2], .012, GOLDD, 5);
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

// 24판 보드킹의 스케이트 파크 새 컨셉 skatebowl (⑦ 10/23 — 사용자 1~70 검토 시트 "더 스케이트보드 파크답게(보울 등) 새 컨셉, 장치 더,
// 디테일"; 허브: 컨테이너 매점·그래피티 벽, 흑백판에서 색이 돌아올 때 그래피티가 칠해짐, 장치는 전부 터치하면 저절로): 진짜 동네 스케이트
// 파크 한 토막을 둥근 콘크리트 섬으로 자른 디오라마.
//   콘크리트 보울(북서) — 둥근 안쪽 곡면, 코핑 쇠테, 코핑 밑 파란 수영장 타일 띠, 바닥 배수구 뚜껑, 옆 음수대(물 레버, 호스가 빠짐)
//   그래피티 벽(뒤 가운데, 흑백판에서 찾으면 벽화가 칠해짐) · 컨테이너 매점(북동, 창구 덮개·보드 보관함 문) · 미니 하프파이프(동쪽)
//   보울 앞 3단 계단 + 핸드레일, 가운데 펀박스, 서쪽 울타리 따라 보드 진열대·벤치·정비 거치대, 앞에 점수판, 매점 앞 캡슐 뽑기
// 부품(② 레벨 연쇄 표 skatebowl과 맞춤): skb_fountain 0 '물 레버'(도구 호스) → skb_bowl 0 '배수구 뚜껑'(그 안에 색 조각) · skb_kiosk 0 '매점 창구'·
// 1 '보드 보관함 문'(lockAt) · skb_miniramp 0 '램프 보드'·1 '램프 밑 천막' · skb_scoreboard '점수판' ·
// skb_gacha '캡슐 손잡이' · skb_spinrack '보드 진열대'. 좌표는 방 좌표(가구 원점 = 발자국 가운데, 앞 = +z). 방 8 × 6, 섬은 방보다 조금 크게.
import * as THREE from 'three';
import { put, mat, mesh, canvasTex, texCache, roundRect, shade, starShape } from './kit.js';
import { HG as G, hmc as rawMc } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';

const WORDS = { '보드킹 파크': 'Board King Park', '오늘의 묘기': "Today's Tricks", '헬멧 꼭!': 'Helmet on!', '보드 보관함': 'Board Lockers',
  '캡슐 뽑기': 'Capsule Toys', '한 판 더!': 'One more!', '마시는 물': 'Drinking water', '점수': 'Score' };
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

const PI = Math.PI, HP = PI / 2;
const mc = (key, fn) => rawMc('skb|' + key, fn);
const TEX = texCache();
const C = {
  conc: '#cdc6cf', conc2: '#b8b0bc', conc3: '#a59cab', deck: '#e2dde4', steel: '#cdd3e2', steelD: '#8f97b2', ink: '#2a1d33',
  wood: '#e9bb82', woodD: '#b98551', ply: '#f0cf9c', earth: '#b48f6c', earth2: '#977459', grass: '#93cc6a', grass2: '#74b453',
  pink: '#ff7eb0', mint: '#7fd8c4', yel: '#ffd250', sky: '#7cc4ef', red: '#f0564a', violet: '#a98ce8', orange: '#ff9a4a',
  tile: '#4f8fd8', tile2: '#eef6ff',
};
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ── 섬 윤곽: 둥근 네모, 모서리마다 반지름 (뒤 왼쪽·뒤 오른쪽·앞 오른쪽·앞 왼쪽) ─────────────────────────────────────────
export const ISLE = { x0: -4.32, x1: 4.42, z0: -3.32, z1: 3.48, r: [.45, .45, 1.5, .6] };
function isleOutline(grow = 0) {
  const { x0, x1, z0, z1, r } = ISLE, A = x0 - grow, Bx = x1 + grow, Z0 = z0 - grow, Z1 = z1 + grow, out = [];
  const arc = (cx, cz, rr, a0) => { for (let k = 0; k <= 10; k++) { const a = a0 + HP * k / 10; out.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]); } };
  const R = r.map(q => Math.max(.05, q + grow));
  arc(Bx - R[1], Z0 + R[1], R[1], -HP); arc(Bx - R[2], Z1 - R[2], R[2], 0); arc(A + R[3], Z1 - R[3], R[3], HP); arc(A + R[0], Z0 + R[0], R[0], PI);
  return out;
}
const shapeOf = (pts, holes = []) => { const s = new THREE.Shape(); s.moveTo(pts[0][0], -pts[0][1]); for (const p of pts.slice(1)) s.lineTo(p[0], -p[1]);
  for (const h of holes) { const q = new THREE.Path(); q.moveTo(h[0][0], -h[0][1]); for (const p of h.slice(1)) q.lineTo(p[0], -p[1]); s.holes.push(q); } return s; };
// a flat shape lying on the ground at height y, its uv the ground's x, -z in metres
const flat = (pts, m, y) => { const o = mesh(new THREE.ShapeGeometry(shapeOf(pts)), m, { cast: false }); o.rotation.x = -HP; o.position.y = y; o.receiveShadow = true; return o; };

// ── 텍스처 ─────────────────────────────────────────────────────────────────────────────────────────────────────
// 광장 콘크리트: 1.5 m 줄눈, 흙손 자국, 잔 알갱이, 바퀴 자국, 실금 — 한 장이 3 m
const plazaTex = () => TEX.get('plaza', () => canvasTex(1024, 1024, (c, w, h) => {
  c.fillStyle = '#c9c2c8'; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 40; k++) { const x = hash(k + 1) * w, y = hash(k + 2) * h, r = 40 + hash(k + 3) * 120; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, hash(k + 4) < .5 ? 'rgba(255,255,255,.10)' : 'rgba(120,110,130,.07)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  // 흙손 자국: 옅은 호
  c.lineWidth = 2; for (let k = 0; k < 60; k++) { c.strokeStyle = `rgba(255,255,255,${.07 + hash(k + 9) * .07})`; const x = hash(k + 10) * w, y = hash(k + 11) * h, r = 50 + hash(k + 12) * 90, a = hash(k + 13) * 6; c.beginPath(); c.arc(x, y, r, a, a + .8); c.stroke(); }
  for (let k = 0; k < 4200; k++) { const n = hash(k + 20); c.fillStyle = n < .5 ? 'rgba(90,82,105,.13)' : n < .85 ? 'rgba(255,255,255,.18)' : 'rgba(60,55,75,.2)'; c.fillRect(hash(k + 21) * w, hash(k + 22) * h, 1.5 + hash(k + 23) * 2, 1.5 + hash(k + 24) * 2); }
  // 줄눈 (1.5 m = 512 px)
  c.strokeStyle = 'rgba(120,112,132,.55)'; c.lineWidth = 5; for (const p of [0, 512]) { c.beginPath(); c.moveTo(p + 2, 0); c.lineTo(p + 2, h); c.stroke(); c.beginPath(); c.moveTo(0, p + 2); c.lineTo(w, p + 2); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2; for (const p of [0, 512]) { c.beginPath(); c.moveTo(p + 6, 0); c.lineTo(p + 6, h); c.stroke(); c.beginPath(); c.moveTo(0, p + 6); c.lineTo(w, p + 6); c.stroke(); }
  // 바퀴 자국: 검은 긴 줄 몇 가닥
  c.lineCap = 'round'; for (let k = 0; k < 9; k++) { const x = hash(k + 40) * w, y = hash(k + 41) * h, a = hash(k + 42) * PI, L = 80 + hash(k + 43) * 160; c.strokeStyle = `rgba(40,34,52,${.09 + hash(k + 44) * .08})`; c.lineWidth = 3 + hash(k + 45) * 3;
    for (const o of [-9, 9]) { c.beginPath(); c.moveTo(x + Math.sin(a) * o, y - Math.cos(a) * o); c.quadraticCurveTo(x + Math.cos(a) * L / 2 + 20, y + Math.sin(a) * L / 2, x + Math.cos(a) * L + Math.sin(a) * o, y + Math.sin(a) * L - Math.cos(a) * o); c.stroke(); } }
  // 실금
  c.strokeStyle = 'rgba(80,72,95,.4)'; c.lineWidth = 2; for (const [x, y, s] of [[300, 700, 1], [760, 240, -1]]) { c.beginPath(); c.moveTo(x, y); for (let k = 1; k < 8; k++) c.lineTo(x + k * 16 * s + (k % 2 ? 7 : -5), y + k * 11); c.stroke(); }
}, { repeat: [1 / 3, 1 / 3] }));
// 보울 안 (보울 전체가 한 장): 시원한 회색 매끈한 콘크리트, 바닥 가운데는 조금 어둡게 닳음, 둘레를 도는 바퀴 자국, 곡면이 시작되는 곳의 분홍 페인트 선
const bowlTex = () => TEX.get('bowl2', () => canvasTex(1024, 1024, (c, w, h) => {
  c.fillStyle = '#b7bdca'; c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * .42); g.addColorStop(0, 'rgba(120,118,140,.18)'); g.addColorStop(.7, 'rgba(120,118,140,.06)'); g.addColorStop(1, 'rgba(255,255,255,.12)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 2600; k++) { const n = hash(k + 300); c.fillStyle = n < .55 ? 'rgba(90,92,118,.1)' : 'rgba(255,255,255,.22)'; c.fillRect(hash(k + 301) * w, hash(k + 302) * h, 2, 2); }
  c.lineCap = 'round'; for (let k = 0; k < 18; k++) { c.strokeStyle = `rgba(46,42,62,${.1 + hash(k + 320) * .12})`; c.lineWidth = 3 + hash(k + 321) * 4; const r = .22 + hash(k + 322) * .24, a = hash(k + 323) * 6;
    for (const o of [0, .018]) { c.beginPath(); c.ellipse(w / 2, h / 2, (r + o) * w, (r + o) * h, 0, a, a + 1 + hash(k + 324) * 1.6); c.stroke(); } }
  c.strokeStyle = 'rgba(255,126,176,.7)'; c.lineWidth = 7; c.setLineDash([60, 26]); c.beginPath(); c.ellipse(w / 2, h / 2, w * .36, h * .33, 0, 0, PI * 2); c.stroke(); c.setLineDash([]);
  c.fillStyle = 'rgba(255,255,255,.3)'; for (let k = 0; k < 24; k++) { c.beginPath(); c.ellipse(hash(k + 340) * w, hash(k + 341) * h, 16 + hash(k + 342) * 30, 6, hash(k + 343) * 3, 0, PI * 2); c.fill(); }
}));
// 코핑 밑 수영장 타일 띠: 파랑·흰 15 cm 타일 두 줄, 가끔 한 장 빠짐 — 가로 한 장이 1.2 m
const tileTex = () => TEX.get('tile', () => canvasTex(512, 128, (c, w, h) => {
  c.fillStyle = '#f4f7fb'; c.fillRect(0, 0, w, h);
  const s = w / 8;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { const n = hash(i * 7 + j * 3 + 400); c.fillStyle = n < .06 ? '#b9c0cf' : j ? '#3d74c6' : (i % 2 ? '#2f63b4' : '#5a8fdc'); c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(i * s + 6, j * s + 6, s - 12, 5); }
}));
// 램프 판: 스케이트라이트 비슷한 진한 갈색 판과 나사 점, 판 이음 — 한 장이 2 m
const rampTex = () => TEX.get('ramp', () => canvasTex(512, 512, (c, w, h) => {
  c.fillStyle = '#d9a774'; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 120; k++) { c.strokeStyle = `rgba(150,96,52,${.08 + hash(k + 500) * .1})`; c.lineWidth = 1 + hash(k + 501) * 2; const y = hash(k + 502) * h; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(w * .3, y + 6, w * .6, y - 6, w, y + (hash(k + 503) - .5) * 10); c.stroke(); }
  c.strokeStyle = 'rgba(110,70,40,.55)'; c.lineWidth = 4; for (const x of [0, 256]) { c.beginPath(); c.moveTo(x + 2, 0); c.lineTo(x + 2, h); c.stroke(); }
  c.fillStyle = 'rgba(90,60,40,.6)'; for (const x of [18, 238, 274, 494]) for (let y = 20; y < h; y += 62) { c.beginPath(); c.arc(x, y, 3.5, 0, PI * 2); c.fill(); }
  c.lineCap = 'round'; for (let k = 0; k < 6; k++) { c.strokeStyle = 'rgba(50,40,50,.12)'; c.lineWidth = 5; const y = hash(k + 520) * h; c.beginPath(); c.moveTo(20, y); c.lineTo(w - 20, y + (hash(k + 521) - .5) * 60); c.stroke(); }
}, { repeat: [.5, .5] }));

// 그래피티 (아무의 태그도 베끼지 않은 동그란 글자·별·웃는 바퀴): 넓은 띠 한 장. kind로 몇 가지
function bubbleWord(c, s, x, y, px, fill, edge = C.ink) {
  c.font = `900 ${px}px Jua, Ssurround, "Arial Rounded MT Bold", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.strokeStyle = edge; c.lineWidth = px * .34; c.strokeText(s, x + px * .06, y + px * .08);
  c.fillStyle = edge; c.fillText(s, x + px * .06, y + px * .08);
  c.strokeStyle = '#ffffff'; c.lineWidth = px * .2; c.strokeText(s, x, y);
  c.fillStyle = fill; c.fillText(s, x, y);
  c.save(); c.globalAlpha = .45; c.fillStyle = '#ffffff'; c.beginPath(); c.rect(x - px * 4, y - px * .55, px * 8, px * .28); c.clip(); c.fillText(s, x, y); c.restore();
}
function drips(c, x0, x1, y, col, seed) {
  c.fillStyle = col; for (let k = 0; k < 7; k++) { const x = x0 + hash(seed + k) * (x1 - x0), L = 12 + hash(seed + k + 9) * 40; roundRect(c, x - 3, y, 6, L, 3); c.fill(); c.beginPath(); c.arc(x, y + L, 5, 0, PI * 2); c.fill(); }
}
function star(c, x, y, R, col, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); for (let k = 0; k < 10; k++) { const a = -HP + k * PI / 5, r = k % 2 ? R * .45 : R; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
  c.lineJoin = 'round'; c.strokeStyle = C.ink; c.lineWidth = R * .22; c.stroke(); c.fillStyle = col; c.fill(); c.restore();
}
function smileWheel(c, x, y, R) {
  c.lineWidth = R * .16; c.strokeStyle = C.ink; c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(x, y, R, 0, PI * 2); c.fill(); c.stroke();
  c.fillStyle = C.yel; c.beginPath(); c.arc(x, y, R * .42, 0, PI * 2); c.fill(); c.stroke();
  c.fillStyle = C.ink; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * R * .38, y - R * .55, R * .08, R * .12, 0, 0, PI * 2); c.fill(); }
  c.lineWidth = R * .1; c.beginPath(); c.arc(x, y + R * .55, R * .28, .2, PI - .2); c.stroke();
  for (const s of [-1, 1]) { c.fillStyle = 'rgba(255,126,176,.6)'; c.beginPath(); c.ellipse(x + s * R * .65, y + R * .45, R * .14, R * .08, 0, 0, PI * 2); c.fill(); }
}
const graffitiTex = (kind) => TEX.get('graf|' + kind, () => canvasTex(2048, 384, (c, w, h) => {
  // 바탕: 회색 콘크리트에 페인트 얼룩
  c.fillStyle = kind === 'mural' ? '#e9e4e0' : '#d3ced8'; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 2200; k++) { c.fillStyle = hash(k + 600) < .5 ? 'rgba(100,90,115,.1)' : 'rgba(255,255,255,.18)'; c.fillRect(hash(k + 601) * w, hash(k + 602) * h, 2, 2); }
  const blob = (x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); for (let k = 0; k <= 24; k++) { const a = k / 24 * PI * 2, rr = 1 + .12 * Math.sin(a * 3 + x); c.lineTo(x + Math.cos(a) * rx * rr, y + Math.sin(a) * ry * rr); } c.fill(); };
  if (kind === 'mural') {
    blob(330, 200, 300, 150, '#bfe8f4'); blob(1050, 190, 380, 160, '#ffd7e6'); blob(1720, 200, 300, 150, '#fff0b8');
    bubbleWord(c, 'SKATE', 360, 200, 150, C.mint); drips(c, 160, 560, 270, C.mint, 3);
    bubbleWord(c, 'BOARD KING', 1060, 190, 128, C.pink); drips(c, 760, 1360, 250, C.pink, 7);
    smileWheel(c, 1690, 190, 110);
    star(c, 640, 90, 46, C.yel, .2); star(c, 1430, 300, 36, C.sky, -.3); star(c, 1900, 90, 30, C.pink, .5); star(c, 90, 80, 30, C.yel, -.2);
    c.strokeStyle = C.violet; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(1460, 80); c.bezierCurveTo(1520, 30, 1560, 140, 1620, 70); c.stroke();
    c.fillStyle = C.orange; for (let k = 0; k < 7; k++) { c.beginPath(); c.arc(1950 - k * 22, 320 - (k % 2) * 16, 9, 0, PI * 2); c.fill(); }
  } else {
    // 보울 바깥 벽 / 펀박스 옆: 작은 글자·스티커 모음
    blob(260, 190, 220, 120, '#ffe1ec'); bubbleWord(c, 'BOWL', 260, 190, 120, C.sky); drips(c, 100, 420, 250, C.sky, 11);
    star(c, 560, 120, 50, C.yel, .3); smileWheel(c, 760, 210, 80);
    blob(1140, 190, 260, 120, '#d9f3e8'); bubbleWord(c, 'SK8', 1140, 190, 140, C.orange); drips(c, 980, 1300, 260, C.orange, 17);
    star(c, 1460, 250, 40, C.pink, -.2);
    blob(1760, 190, 230, 110, '#efe6ff'); bubbleWord(c, 'ROLL', 1760, 190, 112, C.violet);
    // 스티커 몇 장
    for (const [x, y, col, r] of [[470, 300, '#ffffff', .2], [1560, 110, C.yel, -.15], [1980, 300, C.mint, .1]]) { c.save(); c.translate(x, y); c.rotate(r); c.fillStyle = col; roundRect(c, -40, -22, 80, 44, 10); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 4; c.stroke(); c.fillStyle = C.red; c.beginPath(); c.arc(-14, 0, 9, 0, PI * 2); c.fill(); c.fillStyle = C.ink; c.fillRect(2, -6, 28, 5); c.fillRect(2, 4, 20, 5); c.restore(); }
  }
}, { repeat: [1, 1] }));
// 바닥 그림: 큰 동그라미 안 별 (스프레이 분필)
const groundArtTex = () => TEX.get('groundart', () => canvasTex(512, 512, (c, w, h) => {
  c.clearRect(0, 0, w, h);
  c.lineWidth = 16; c.strokeStyle = 'rgba(255,126,176,.85)'; c.beginPath(); c.arc(w / 2, h / 2, 200, 0, PI * 2); c.stroke();
  c.setLineDash([22, 18]); c.lineWidth = 8; c.strokeStyle = 'rgba(127,216,196,.9)'; c.beginPath(); c.arc(w / 2, h / 2, 165, 0, PI * 2); c.stroke(); c.setLineDash([]);
  star(c, w / 2, h / 2 + 6, 110, 'rgba(255,210,80,.95)', 0);
}));
const signTex = () => TEX.get('sign', () => textTex(512, 256, (c, w, h) => {
  c.fillStyle = '#2f2a48'; roundRect(c, 3, 3, w - 6, h - 6, 18); c.fill();
  c.strokeStyle = C.yel; c.lineWidth = 5; roundRect(c, 11, 11, w - 22, h - 22, 13); c.stroke();
  fitText(c, '보드킹 파크', w / 2, h * .38, w * .8, 46, '#ffffff', { weight: '800' });
  fitText(c, '헬멧 꼭!', w / 2, h * .72, w * .6, 30, C.yel, { weight: '800' });
}));
const scoreFront = () => TEX.get('scoreF', () => textTex(512, 320, (c, w, h) => {
  c.fillStyle = '#fbf6ea'; roundRect(c, 3, 3, w - 6, h - 6, 20); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 6; roundRect(c, 6, 6, w - 12, h - 12, 17); c.stroke();
  c.fillStyle = C.pink; roundRect(c, 20, 20, w - 40, 70, 12); c.fill();
  fitText(c, '오늘의 묘기', w / 2, 56, w * .78, 38, '#ffffff', { weight: '800' });
  for (let k = 0; k < 3; k++) star(c, w / 2 + (k - 1) * 110, 190, 42, [C.yel, C.mint, C.sky][k], (k - 1) * .2);
  fitText(c, '보드킹 파크', w / 2, 278, w * .6, 24, '#8a7d9a', { weight: '800' });
}));
// 뒷면: 점수 세 칸 (관찰 자물쇠 단서로 쓸 수 있게 큰 숫자 — 값은 ②가 다시 칠할 수 있게 SCORE에 둠)
export const SCORE = [7, 2, 5];
const scoreBack = () => TEX.get('scoreB|' + SCORE.join(''), () => textTex(512, 320, (c, w, h) => {
  c.fillStyle = '#2f2a48'; roundRect(c, 3, 3, w - 6, h - 6, 20); c.fill();
  fitText(c, '점수', w / 2, 46, w * .5, 30, C.yel, { weight: '800' });
  SCORE.forEach((n, k) => { const x = 95 + k * 160; c.fillStyle = '#fbf6ea'; roundRect(c, x - 62, 92, 124, 170, 16); c.fill(); c.fillStyle = [C.pink, C.mint, C.sky][k]; c.font = '900 130px Jua, Ssurround, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), x, 184); });
}));
const lockerTex = () => TEX.get('locker', () => textTex(256, 512, (c, w, h) => {
  c.fillStyle = '#7fb8e8'; c.fillRect(0, 0, w, h);
  for (let y = 40; y < 120; y += 14) { c.fillStyle = 'rgba(40,60,100,.45)'; roundRect(c, 40, y, w - 80, 7, 3); c.fill(); }
  c.fillStyle = '#ffffff'; roundRect(c, 40, 150, w - 80, 46, 8); c.fill(); fitText(c, '보드 보관함', w / 2, 173, w - 100, 22, '#2f2a48', { weight: '800' });
  for (const [x, y, col, r] of [[80, 290, C.yel, .2], [170, 340, C.pink, -.3], [100, 420, '#ffffff', .1], [180, 450, C.mint, .4]]) { c.save(); c.translate(x, y); c.rotate(r); c.fillStyle = col; roundRect(c, -34, -20, 68, 40, 10); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 3; c.stroke(); c.restore(); }
  star(c, 170, 250, 22, C.orange, .1);
}));
const gachaTex = () => TEX.get('gacha', () => textTex(256, 128, (c, w, h) => {
  c.fillStyle = '#ffffff'; roundRect(c, 4, 4, w - 8, h - 8, 14); c.fill(); c.strokeStyle = C.red; c.lineWidth = 6; roundRect(c, 8, 8, w - 16, h - 16, 11); c.stroke();
  fitText(c, '캡슐 뽑기', w / 2, h * .4, w * .8, 30, C.red, { weight: '800' }); fitText(c, '한 판 더!', w / 2, h * .74, w * .6, 18, '#2f2a48', { weight: '800' });
}));
const decal = (w, h, t, o) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: t, rim: .08, ...o }), { cast: false });

// 수직 벽면 띠: 윤곽 점들을 따라 높이 y0~y1, 원점에서 바깥으로 off만큼(음수면 안으로), uv = (길이/span, 높이 비)
function wallStrip(pts, y0, y1, off, spanU) {
  const n = pts.length, pos = [], uv = [], idx = []; let L = 0;
  // (round shapes about the origin: outward = away from it)
  const nrm = i => { const l = Math.hypot(pts[i][0], pts[i][1]) || 1; return [pts[i][0] / l, pts[i][1] / l]; };
  for (let i = 0; i < n; i++) {
    if (i) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const [nx, nz] = nrm(i), x = pts[i][0] + nx * off, z = pts[i][1] + nz * off;
    pos.push(x, y0, z, x, y1, z); uv.push(L / spanU, 0, L / spanU, 1);
    if (i < n - 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// 슈퍼타원 윤곽 (반폭 a, 반깊이 b, 지수 e) — 보울의 바깥·안쪽 테두리
const superPts = (a, b, e = 3.2, N = 96, cx = 0, cz = 0) => { const out = []; for (let i = 0; i < N; i++) { const t = i / N * PI * 2, c = Math.cos(t), s = Math.sin(t); out.push([cx + a * Math.sign(c) * Math.abs(c) ** (2 / e), cz + b * Math.sign(s) * Math.abs(s) ** (2 / e)]); } return out; };

const B = {};

// ── 바탕: 둥근 콘크리트 섬 — 광장 바닥(줄눈·흙손·바퀴 자국), 앞쪽 낮은 콘크리트 턱(앉는 턱·레지) 둘레, 가장자리 잔디 띠, 받침 두 켜 ─────────────
B.skb_base = f => {
  const O = isleOutline(), O2 = isleOutline(-.34);
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.8, 0, .01, -.75, .01];
  f.add(mc('base', ({ add }) => {
    // 받침: 콘크리트 판(얇은 밝은 테 + 두께) · 흙 켜
    add(G.ext(shapeOf(isleOutline(.03)), .08, 0, 8), C.deck, 0, -.075, 0, -HP, 0, 0);
    add(G.ext(shapeOf(O), .26, 0, 8), C.conc2, 0, -.33, 0, -HP, 0, 0);
    add(G.ext(shapeOf(isleOutline(-.05)), .3, .03, 8), C.earth, 0, -.62, 0, -HP, 0, 0);
    // 콘크리트 켜 줄눈 (카메라 쪽 앞·오른쪽 면)
    for (let x = -3.6; x <= 2.9; x += .75) add(G.pbox(.022, .24, .02), C.conc3, x, -.2, ISLE.z1 + .004);
    for (let z = -2.8; z <= 1.9; z += .75) add(G.pbox(.02, .24, .022), C.conc3, ISLE.x1 + .004, -.2, z);
    for (const [x, z] of [[-2.9, ISLE.z1 - .02], [.4, ISLE.z1 - .02], [ISLE.x1 - .02, -1.5], [ISLE.x1 - .02, .9]]) add(G.sph(.08, 8, 6), C.earth2, x, -.48, z, 0, 0, 0, [1.4, .8, 1]);
    // 가장자리 잔디 띠 사이로 고개 내민 풀·꽃 몇 줌 (모서리 쪽만 — 한적하게)
    for (const [x, z, s] of [[-4.12, 3.0, 1], [-1.2, 3.33, .8], [2.55, 3.32, .9], [4.25, 1.55, .9], [4.26, -1.9, .8], [3.9, 2.7, 1.1]]) {
      add(G.sph(.17 * s, 10, 8), C.grass, x, .07 * s, z, 0, 0, 0, [1.3, .75, 1.1]);
      add(G.sph(.12 * s, 10, 8), C.grass2, x + .13 * s, .06 * s, z + .06, 0, 0, 0, [1.2, .8, 1]);
      add(G.sph(.035, 8, 6), hash(x * 7) < .5 ? '#fff6a8' : '#ffb3d0', x - .05, .15 * s, z + .05);
    }
    // 낮은 콘크리트 턱(앉는 턱·레지, 위 쇠 모서리): 앞(남) 가장자리 둘, 오른쪽(동) 가장자리 하나 — 들어오는 자리(가운데·앞 오른쪽 모서리)는 비움
    const ledge = pts => { for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), a = Math.atan2(-(bz - az), bx - ax);
      add(G.box(L + .03, .16, .22, .03), C.conc, (ax + bx) / 2, .08, (az + bz) / 2, 0, a, 0); add(G.box(L + .03, .025, .04, .01), C.steelD, (ax + bx) / 2, .165, (az + bz) / 2 - .09 * Math.cos(a), 0, a, 0); } };
    const ZF = ISLE.z1 - .3, XE = ISLE.x1 - .3;
    ledge([[-3.0, ZF], [-.7, ZF]]); ledge([[1.5, ZF], [2.35, ZF]]); ledge([[XE, 1.05], [XE, -.95]]);
    for (const [x, z] of [[-3.0, ZF], [-.7, ZF], [1.5, ZF], [2.35, ZF]]) add(G.box(.06, .17, .23, .02), '#efecf1', x, .085, z);
    // 배수 그레이팅 (광장 앞 오른쪽)
    add(G.box(.7, .012, .22, .006), '#7a748c', .4, .012, 3.0); for (let k = 0; k < 8; k++) add(G.pbox(.03, .016, .16), '#4d475f', .4 - .3 + k * .086, .014, 3.0);
    // 바닥에 뒤집혀 놓인 보드 하나 · 입구 옆 작은 고깔 둘 · 왁스 덩어리
    { const bx = 1.95, bz = 1.3, ry = .5, cs = Math.cos(ry), sn = Math.sin(ry), P = (u, v) => [bx + u * cs + v * sn, bz - u * sn + v * cs];
      add(G.box(.64, .025, .2, .012), C.yel, bx, .075, bz, 0, ry, PI); add(G.box(.5, .004, .15, .002), '#3a3346', bx, .089, bz, 0, ry, 0);
      for (const u of [-.2, .2]) { const [x, z] = P(u, 0); add(G.box(.05, .03, .16, .008), C.steelD, x, .05, z, 0, ry, 0); for (const v of [-.085, .085]) { const [x2, z2] = P(u, v); add(G.cyl(.03, .03, .03, 10), '#fff4e2', x2, .03, z2, HP, ry, 0); } } }
    for (const [x, z] of [[1.22, 3.02], [1.4, 3.16]]) { add(G.cone(.07, .2, 10), C.orange, x, .11, z); add(G.box(.16, .015, .16, .005), C.orange, x, .008, z); add(G.cyl(.045, .052, .03, 10), '#ffffff', x, .12, z); }
    add(G.box(.09, .04, .06, .015), '#f2e6c0', -.15, .024, 1.25, 0, .4, 0);
    // 입간판 (앞 오른쪽 입구) — 다리 둘
    add(G.box(.05, .5, .05, .01), C.steelD, 3.38, .25, 2.86); add(G.box(.05, .5, .05, .01), C.steelD, 3.92, .25, 2.46);
  }));
  // 겉면: 광장 콘크리트 (섬 전체), 바닥 그림, 섬 옆면 잔디 띠
  f.add(flat(O, mat('#ffffff', { map: plazaTex(), rough: .85, rim: .08 }), .008));
  const ring = []; const grassM = mat(C.grass, { rough: .9, rim: .1 });
  { const g = new THREE.ShapeGeometry(shapeOf(isleOutline(), [isleOutline(-.2).slice().reverse()])); const o = mesh(g, grassM, { cast: false }); o.rotation.x = -HP; o.position.y = .011; o.receiveShadow = true; f.add(o); ring.push(o); }
  f.add(put(decal(1.7, 1.7, groundArtTex(), { opacity: .95 }), .9, .013, 2.15, -HP, 0, .3));
  // 입간판 판
  { const s = decal(.62, .31, signTex()); put(s, 3.65, .47, 2.68, 0, PI * .75 - PI, 0); s.rotation.set(0, PI / 4, 0); s.position.set(3.67, .46, 2.69); f.add(s); }
  f.group.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  f.spot('behind', null, 3.95, .01, 2.9, { maxH: .25, label: '입간판 밑', scale: 1 });
  f.spot('behind', null, -.1, .015, 3.0, { maxH: .2, label: '배수구 옆', scale: 1 });
};

// ── 콘크리트 보울 (3.5 × 2.6, 높이 .6): 둥근 안쪽 곡면 + 코핑 + 타일 띠 + 배수구 뚜껑, 바깥 벽 그래피티 ───────────────────────────
export const BOWL = { a: 1.6, b: 1.2, e: 2.7, deck: .2, H: .6, R: .42, y0: .05 };
function bowlInner() {
  // rings from the rim (vertical wall under the coping) down the round transition to the flat floor
  const { a, b, e, deck, H, R, y0 } = BOWL, N = 112, a1 = a - deck, b1 = b - deck, rings = [];
  rings.push([0, H]);
  if (H - y0 > R) rings.push([0, y0 + R]);
  for (let k = 1; k <= 12; k++) { const ph = HP * (1 - k / 12); rings.push([R - R * Math.sin(ph), y0 + R - R * Math.cos(ph)]); }
  const pos = [], idx = [];
  for (const [ins, y] of rings) for (const [x, z] of superPts(a1 - ins, b1 - ins, e, N)) pos.push(x, y, z);
  const M = rings.length;
  for (let r = 0; r < M - 1; r++) for (let i = 0; i < N; i++) { const i2 = (i + 1) % N, p = r * N + i, q = r * N + i2, p2 = p + N, q2 = q + N; idx.push(p, p2, q, q, p2, q2); }
  // the flat floor: a fan to the middle
  const c0 = pos.length / 3; pos.push(0, y0, 0); const last = (M - 1) * N; for (let i = 0; i < N; i++) idx.push(c0, last + (i + 1) % N, last + i);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  // planar uv (x, z in metres)
  const uv = []; for (let i = 0; i < pos.length; i += 3) uv.push(pos[i] / (2 * a) + .5, -pos[i + 2] / (2 * b) + .5); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  // facing up into the bowl: flip the winding if the floor's normal came out downward
  if (g.attributes.normal.getY(c0) < 0) { const I = g.index.array; for (let k = 0; k < I.length; k += 3) { const t = I[k + 1]; I[k + 1] = I[k + 2]; I[k + 2] = t; } g.computeVertexNormals(); }
  return g;
}
B.skb_bowl = f => {
  const { a, b, e, deck, H, y0 } = BOWL, outer = superPts(a, b, e, 112), rim = superPts(a - deck, b - deck, e, 112);
  // (겹치는 판끼리 같은 평면에 닿지 않게 — bake.js deFlush가 닿은 면을 밀어 내다 덱 테두리가 바깥으로 벌어졌음: 몸통은 덱 밑까지, 덱은
  // 몸통 위를 덮어 겹치고, 안쪽 구멍도 서로 다르게(덱 1.2 cm, 몸통 3 cm 넓게) — 그 틈은 코핑이 덮음)
  const hole = superPts(a - deck + .012, b - deck + .012, e, 112).reverse();
  f.add(mc('bowl-body', ({ add }) => {
    add(G.ext(shapeOf(outer, [superPts(a - deck + .03, b - deck + .03, e, 112).reverse()]), H - .03, 0, 4), '#c3c7d1', 0, 0, 0, -HP, 0, 0);
    add(G.ext(shapeOf(superPts(a + .03, b + .03, e, 112), [superPts(a - .06, b - .06, e, 112).reverse()]), .09, 0, 4), C.conc3, 0, -.02, 0, -HP, 0, 0);
    add(G.ext(shapeOf(superPts(a + .025, b + .025, e, 112), [hole]), .055, 0, 4), C.deck, 0, H - .055, 0, -HP, 0, 0);
  }));
  // 보울 안: 매끈한 콘크리트 곡면
  const inner = mesh(bowlInner(), mat('#ffffff', { map: bowlTex(), rough: .7, rim: .1 }), { cast: false }); inner.receiveShadow = true; f.add(inner);
  // 코핑: 테두리를 따라 도는 쇠 파이프
  { const pts = rim.map(([x, z]) => new THREE.Vector3(x, H + .012, z)); const curve = new THREE.CatmullRomCurve3(pts, true);
    f.add(mc('bowl-coping', ({ add }) => add(new THREE.TubeGeometry(curve, 160, .038, 8, true), C.steel, 0, 0, 0))); }
  // 코핑 밑 타일 띠 (안쪽 벽, 바깥쪽을 향해 .004 안으로)
  { const g = wallStrip([...rim, rim[0]], H - .17, H - .025, -.008, 1.2); f.add(mesh(g, mat('#ffffff', { map: tileTex(), rough: .5, rim: .1, side: THREE.DoubleSide }), { cast: false })); }
  // 바깥 벽 그래피티: 카메라 쪽(앞·오른쪽) 반 바퀴
  { const N = outer.length;
    // order: start at the right-back, round the right side to the front
    const start = outer.findIndex(p => p[0] > .2 * a && p[1] < 0); const seq = []; for (let k = 0; k < N; k++) { const p = outer[(start + k) % N]; if (p[1] > -.25 * b || p[0] > .2 * a) seq.push(p); else if (seq.length) break; }
    const g = wallStrip(seq.slice().reverse(), .07, H - .03, .008, 2.8);
    f.add(mesh(g, mat('#ffffff', { map: graffitiTex('bowl'), rough: .8, rim: .1, side: THREE.DoubleSide }), { cast: false })); }
  // 배수구: 바닥 가운데 어두운 구멍 + 쇠 뚜껑(뒤쪽 경첩으로 들림)
  f.add(mc('bowl-drain', ({ add }) => { add(G.cyl(.27, .27, .012, 28), '#8d879c', 0, y0 + .004, 0); add(G.cyl(.22, .22, .014, 28), '#3a3548', 0, y0 + .006, 0); for (let k = -4; k <= 4; k++) add(G.pbox(.02, .016, Math.sqrt(Math.max(0, .2 * .2 - (k * .045) ** 2)) * 2), '#5d6378', k * .045, y0 + .008, 0); }));
  const lid = new THREE.Group(); put(lid, 0, y0 + .016, -.22); f.add(lid);
  lid.add(mc('bowl-drainlid', ({ add }) => {
    add(G.cyl(.235, .235, .022, 28), '#a7aec4', 0, 0, .22);
    for (let k = -4; k <= 4; k++) add(G.pbox(.022, .026, Math.sqrt(Math.max(0, .19 * .19 - (k * .042) ** 2)) * 2), '#5d6378', k * .042, .003, .22);
    add(G.tor(.235, .014, PI * 2, 6, 28), '#8a91a8', 0, .01, .22, HP, 0, 0);
  }));
  // (물이 차오르면 뚜껑이 둥실 떠올랐다가 뒤로 젖혀짐 — 그 밑 배수구 쇠살 위에 숨은 것이 보임)
  const p = f.part('lift', lid, t => { lid.position.y = y0 + .016 + .07 * Math.sin(Math.min(1, t * 1.6) * PI); lid.rotation.x = -1.35 * Math.max(0, (t - .35) / .65); }, { label: '배수구 뚜껑', sfx: 'pop', dur: .5 });
  f.spot('inside', null, 0, y0 + .02, .03, { part: p, maxH: .42, label: '배수구 안', scale: 1 });
  f.spot('on', null, .5, y0, .18, { maxH: .4, label: '보울 바닥', scale: 1 });
  f.spot('on', null, 0, H + .01, -b + .1, { maxH: .3, label: '보울 데크 위', scale: 1 });
  f.spot('behind', null, a + .2, 0, .45, { maxH: .3, label: '보울 옆', scale: 1 });
  // 걷기: 보울 몸통 전체 (안에 들어가지 않음)
};

// ── 보울 앞 3단 계단 + 가운데 핸드레일 (덱 높이 .6에서 앞으로 내려옴) ─────────────────────────────────────────────────────────
B.skb_stairs = f => {
  const W = 1.2, T = .3, rises = [.45, .3, .15], z0 = -.45;
  f.add(mc('stairs', ({ add }) => {
    rises.forEach((h, k) => { const zc = z0 + T * k + T / 2; add(G.box(W, h, T + .01, .02), C.conc, 0, h / 2, zc); add(G.box(W + .01, .025, .05, .008), C.steelD, 0, h - .006, zc + T / 2 - .02); });
    // 옆 벽(낮은 날개벽) — 그래피티 대신 페인트 줄
    // 옆 날개벽: 계단 기울기를 따라 낮아지는 콘크리트 (옆에서 보면 사다리꼴), 위 흰 테 · 노란 페인트 띠
    const wing = new THREE.Shape(); wing.moveTo(-.45, 0); wing.lineTo(-.45, .66); wing.lineTo(.45, .2); wing.lineTo(.45, 0); wing.lineTo(-.45, 0);
    for (const sx of [-1, 1]) add(G.ext(wing, .12, .015, 2), C.conc2, sx * (W / 2 + .06) + .06, 0, 0, 0, -HP, 0);
    for (const sx of [-1, 1]) add(G.box(.03, .1, .7, .004), C.yel, sx * (W / 2 + .135), .17, .05);
    // 핸드레일: 위 평평 · 꺾여 내려옴 · 아래 평평 (가운데)
    const y1 = .6 + .5, y2 = .15 + .5;
    for (const [z, y] of [[-.42, y1], [.0, (y1 + y2) / 2 - .02], [.42, y2]]) add(G.cyl(.022, .022, y - .02, 10), C.steelD, 0, (y) / 2, z);
    const rail = new THREE.CatmullRomCurve3([new THREE.Vector3(0, y1, -.55), new THREE.Vector3(0, y1, -.4), new THREE.Vector3(0, y2, .4), new THREE.Vector3(0, y2, .58)], false, 'catmullrom', .05);
    add(new THREE.TubeGeometry(rail, 24, .03, 8, false), C.steel, 0, 0, 0);
    for (const z of [-.55, .58]) add(G.sph(.034, 10, 8), C.yel, 0, z < 0 ? y1 : y2, z);
  }));
  f.spot('on', null, .35, .45, -.32, { maxH: .35, label: '계단 맨 위', scale: 1 });
  f.spot('under', null, -.4, .15, .36, { maxH: .3, label: '계단 아래 칸', scale: 1 });
  f.spot('behind', null, W / 2 + .3, 0, .32, { maxH: .3, label: '계단 옆', scale: 1 });
};

// ── 펀박스 (2.4 × 1.1): 가운데 평평한 턱(.4), 양쪽 경사, 위에 플랫 레일, 뒤 모서리 쇠 레지, 옆면 그래피티 ───────────────────────────
B.skb_funbox = f => {
  // 평평한 윗면은 x ±top
  const L = 2.4, Wd = 1.1, Hb = .4, top = .55;
  f.add(mc('funbox', ({ add, addM }) => {
    // side profile in x–y, extruded across z
    const s = new THREE.Shape(); s.moveTo(-L / 2, 0); s.lineTo(-top, Hb); s.lineTo(top, Hb); s.lineTo(L / 2, 0); s.lineTo(-L / 2, 0);
    add(G.ext(s, Wd, .02, 2), C.conc, 0, 0, -Wd / 2);
    // 경사면 끝 쇠판 (바닥과 만나는 곳) · 뒤 모서리 레지(앵글)
    for (const sx of [-1, 1]) add(G.box(.08, .012, Wd, .004), C.steelD, sx * (L / 2 - .02), .008, 0);
    add(G.box(top * 2 + .02, .04, .05, .01), C.steelD, 0, Hb + .02, -Wd / 2 + .02);
    // 위 페인트 띠
    add(G.box(top * 2 - .06, .006, Wd - .3, .003), C.mint, 0, Hb + .022, .05);
    for (const [x, c] of [[-.32, C.pink], [0, C.yel], [.32, C.sky]]) add(G.ext(starShape(.07, .032), .006, 0), c, x, Hb + .028, .05, -HP, 0, 0);
    // 플랫 레일: 앞쪽 가장자리를 따라 받침 둘
    for (const sx of [-1, 1]) { add(G.box(.06, .16, .06, .01), C.steelD, sx * .45, Hb + .08, Wd / 2 - .14); add(G.box(.16, .02, .12, .006), C.steelD, sx * .45, Hb + .02, Wd / 2 - .14); }
    add(G.box(1.25, .05, .05, .012), C.steel, 0, Hb + .17, Wd / 2 - .14);
  }));
  // 옆면 그래피티 (앞면 +z, 사다리꼴 모양)
  { const s = new THREE.Shape(); s.moveTo(-L / 2 + .05, .02); s.lineTo(-top, Hb - .03); s.lineTo(top, Hb - .03); s.lineTo(L / 2 - .05, .02); s.lineTo(-L / 2 + .05, .02);
    const g = new THREE.ShapeGeometry(s), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + L / 2) / L * .5 + .5, uv.getY(i) / Hb);
    f.add(put(mesh(g, mat('#ffffff', { map: graffitiTex('bowl'), rough: .8, rim: .1 }), { cast: false }), 0, 0, Wd / 2 + .032)); }
  f.spot('on', null, .15, Hb + .03, -.2, { maxH: .35, label: '펀박스 위', scale: 1 });
  f.spot('under', null, -.15, Hb + .03, Wd / 2 - .14, { maxH: .14, label: '플랫 레일 밑', scale: 1 });
  f.spot('behind', null, -L / 2 + .2, 0, -Wd / 2 - .14, { maxH: .3, label: '펀박스 뒤', scale: 1 });
};

// ── 미니 하프파이프 (3.0 × 1.35, 높이 .75): 나무 판 램프, 덱 둘과 난간, 오른쪽 덱 위 보드(굴러 내려감), 왼쪽 덱 밑 창고 천막 ─────────
export const RAMP = { L: 3.0, Wd: 1.35, H: .75, R: .75, deckW: .4 };
B.skb_miniramp = f => {
  // transition from x = xa (deck edge) down to xf (flat)
  const { L, Wd, H, R, deckW } = RAMP, xa = L / 2 - deckW, xf = xa - R;
  // the curve as points: the ramp's riding surface from deck edge to deck edge
  const curve = []; for (let k = 0; k <= 48; k++) { const x = -xa + 2 * xa * k / 48; curve.push([x, (() => { const u = Math.abs(x); if (u <= xf) return 0; const d = u - xf; return R - Math.sqrt(Math.max(0, R * R - d * d)); })()]); }
  f.add(mc('ramp-frame', ({ add }) => {
    // 옆 판 (앞뒤): 프로필 모양 판 — 램프 아래를 막는 합판
    const s = new THREE.Shape(); s.moveTo(-L / 2, 0); s.lineTo(-L / 2, H); s.lineTo(-xa, H); for (const [x, y] of curve) s.lineTo(x, y); s.lineTo(xa, H); s.lineTo(L / 2, H); s.lineTo(L / 2, 0); s.lineTo(-L / 2, 0);
    for (const z of [-Wd / 2, Wd / 2 - .04]) add(G.ext(s, .04, 0, 2), C.ply, 0, 0, z);
    // 덱 판 · 덱 앞 코핑 · 덱 밑 기둥
    for (const sx of [-1, 1]) {
      add(G.box(deckW + .02, .05, Wd, .01), C.woodD, sx * (L / 2 - deckW / 2), H + .02, 0);
      add(G.cyl(.035, .035, Wd, 10), C.steel, sx * xa, H + .03, 0, HP, 0, 0);
      for (const z of [-Wd / 2 + .05, Wd / 2 - .05]) add(G.box(.06, H, .06, .01), C.woodD, sx * (L / 2 - .04), H / 2, z);
      // 난간: 뒤와 바깥 끝
      // 난간: 뒤 덱에만 (앞 덱은 카메라 바로 앞이라 비움)
      if (sx > 0) {
        for (const [x, z] of [[sx * (L / 2 - .03), -Wd / 2 + .03], [sx * (L / 2 - deckW + .03), -Wd / 2 + .03], [sx * (L / 2 - .03), Wd / 2 - .03]]) add(G.cyl(.022, .022, .7, 8), C.steelD, x, H + .35, z);
        add(G.cyl(.026, .026, deckW, 8), C.steelD, sx * (L / 2 - deckW / 2), H + .7, -Wd / 2 + .03, 0, 0, HP); add(G.cyl(.026, .026, Wd - .06, 8), C.steelD, sx * (L / 2 - .03), H + .7, 0, HP, 0, 0); add(G.cyl(.02, .02, Wd - .06, 8), C.steelD, sx * (L / 2 - .03), H + .38, 0, HP, 0, 0); }
    }
    // 바닥에 닿는 쇠판(평지 가운데)
    add(G.box(.1, .01, Wd - .1, .003), C.steelD, -xf, .006, 0); add(G.box(.1, .01, Wd - .1, .003), C.steelD, xf, .006, 0);
    // 덱 위 소품: 물병 · 수건 (오른쪽 난간) · 왼쪽 덱 위 스피커 상자
    add(G.cyl(.04, .04, .18, 12), C.sky, L / 2 - .12, H + .14, -Wd / 2 + .16); add(G.cyl(.025, .03, .04, 10), '#ffffff', L / 2 - .12, H + .25, -Wd / 2 + .16);
    add(G.box(.04, .18, .3, .02), C.pink, L / 2 - .03, H + .58, .25, 0, 0, .08);
    add(G.box(.32, .26, .22, .04), '#3a3450', -L / 2 + .2, H + .175, -Wd / 2 + .2); add(G.cyl(.07, .07, .012, 16), '#8f97b2', -L / 2 + .2, H + .19, -Wd / 2 + .313, HP, 0, 0); add(G.cyl(.035, .035, .014, 12), '#cfd5e6', -L / 2 + .2, H + .19, -Wd / 2 + .315, HP, 0, 0);
  }));
  // 타는 면: 나무 판 텍스처 띠 (곡선을 따라, 폭 Wd)
  { const pos = [], uv = [], idx = []; let s = 0;
    curve.forEach(([x, y], k) => { if (k) s += Math.hypot(x - curve[k - 1][0], y - curve[k - 1][1]); pos.push(x, y + .005, -Wd / 2 + .04, x, y + .005, Wd / 2 - .04); uv.push(s / 1, 0, s / 1, (Wd - .08) / 1); if (k < curve.length - 1) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    if (g.attributes.normal.getY(48) < 0) { const I = g.index.array; for (let k = 0; k < I.length; k += 3) { const t = I[k + 1]; I[k + 1] = I[k + 2]; I[k + 2] = t; } g.computeVertexNormals(); }
    f.add(mesh(g, mat('#ffffff', { map: rampTex(), rough: .75, rim: .1 }), { cast: false })); }
  // 앞 옆판 그래피티 (+z 면): 옆판 모양 그대로
  { const s = new THREE.Shape(); s.moveTo(-L / 2 + .02, .02); s.lineTo(-L / 2 + .02, H - .02); s.lineTo(-xa, H - .02); for (const [x, y] of curve) s.lineTo(x, Math.max(.02, y - .02)); s.lineTo(xa, H - .02); s.lineTo(L / 2 - .02, H - .02); s.lineTo(L / 2 - .02, .02); s.lineTo(-L / 2 + .02, .02);
    const g = new THREE.ShapeGeometry(s), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + L / 2) / L * .62, uv.getY(i) / H);
    f.add(put(mesh(g, mat('#ffffff', { map: graffitiTex('bowl'), rough: .8, rim: .1 }), { cast: false }), 0, 0, Wd / 2 + .004)); }
  // 오른쪽 덱 위 보드 (부품): 코핑으로 미끄러져 램프를 타고 내려가 가운데에서 멈춤
  const board = new THREE.Group(); put(board, L / 2 - .2, H + .07, .2); f.add(board);
  board.add(mc('ramp-board', ({ add }) => {
    add(G.box(.62, .03, .2, .015), C.pink, 0, .04, 0); add(G.box(.5, .005, .16, .002), C.yel, 0, .058, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.03, .03, .025, 10), '#fff4dc', sx * .2, .015, sz * .08, HP, 0, 0);
  }));
  const pb = f.part('lift', board, (t, b) => {
    // 덱 → 코핑 → 오른쪽 곡면을 타고 내려와 → 가운데 평지에서 멈춤 (곡면: 중심 (xf, R) 반지름 R)
    if (t < .15) { const u = t / .15; board.position.set(b.p.x + (xa - b.p.x) * u, H + .07, b.p.z); board.rotation.set(0, 0, 0); return; }
    if (t < .75) { const ph = HP * (1 - (t - .15) / .6); board.position.set(xf + R * Math.sin(ph) - .04 * Math.sin(ph), R - R * Math.cos(ph) + .04 * Math.cos(ph), b.p.z); board.rotation.set(0, 0, ph); return; }
    const u = (t - .75) / .25; board.position.set(xf * (1 - u), .04, b.p.z); board.rotation.set(0, .3 * u, 0);
  }, { label: '램프 보드', sfx: 'swish', dur: .9 });
  f.spot('inside', null, L / 2 - .2, H + .055, .2, { part: pb, maxH: .24, label: '보드 밑', scale: .8 });
  // 왼쪽 덱 밑 창고: 줄무늬 천막이 덮고 있다가 말려 올라감
  const cur = new THREE.Group(); put(cur, -L / 2 + .2, H - .04, Wd / 2 + .03); f.add(cur);
  cur.add(mc('ramp-curtain', ({ add }) => {
    for (let k = 0; k < 5; k++) add(G.box(deckW / 5 - .004, H - .1, .02, .006), k % 2 ? '#ffffff' : C.orange, -deckW / 2 + deckW / 10 + k * deckW / 5, -(H - .1) / 2, 0);
    add(G.cyl(.035, .035, deckW + .04, 10), '#e07a34', 0, .0, 0, 0, 0, HP);
  }));
  const pc = f.part('lift', cur, t => { cur.scale.y = Math.max(.08, 1 - .92 * t); }, { label: '램프 밑 천막', sfx: 'rustle', dur: .35 });
  f.spot('inside', null, -L / 2 + .2, .01, Wd / 2 - .25, { part: pc, maxH: .45, label: '램프 밑 창고', scale: .85 });
  f.spot('on', null, 0, .01, .1, { maxH: .45, label: '램프 가운데', scale: 1 });
  f.spot('on', null, -L / 2 + .2, H + .045, .15, { maxH: .3, label: '왼쪽 덱 위', scale: 1 });
  f.spot('behind', null, L / 2 + .14, 0, .5, { maxH: .3, label: '램프 끝 옆', scale: 1 });
};

// ── 음수대 + 물 레버 (② 24판 연쇄의 장치 skb_fountain 0 — 설계서 24 '레버 → 물줄기가 씻어 색 조각'): 보울 옆 콘크리트 음수대, 옆 수도꼭지에
// 노란 물 레버. 호스(연쇄 도구)는 빠져 있다가 — 장치가 돌면 호스가 꼭지에서 코핑 너머 보울 안으로 걸쳐지고, 레버가 내려가며 물줄기가
// 보울 바닥으로 쏟아져 물웅덩이가 배수구까지 번짐(그다음 배수구 뚜껑이 둥실, ② 표의 links). 보울까지의 거리는 FOUNTAIN_TO_BOWL(방 배치에서).
export const FOUNTAIN_AT = [-.5, -1.0], BOWL_AT = [-2.25, -1.75];
B.skb_fountain = f => {
  const bx = BOWL_AT[0] - FOUNTAIN_AT[0], bz = BOWL_AT[1] - FOUNTAIN_AT[1], { H, y0 } = BOWL;
  f.add(mc('fountain', ({ add }) => {
    add(G.box(.3, .78, .3, .05), C.conc, 0, .39, 0); add(G.box(.34, .04, .34, .02), '#efecf1', 0, .8, 0);
    add(G.cyl(.15, .1, .07, 18), C.steel, 0, .85, .02); add(G.cyl(.11, .11, .012, 18), '#9fd6f2', 0, .885, .02);
    add(G.cyl(.018, .018, .06, 8), C.steelD, 0, .9, -.06); add(G.cyl(.03, .03, .03, 12), '#5c8fd0', 0, .78, .165, HP, 0, 0);
    add(G.box(.2, .05, .01, .005), '#4f8fd8', 0, .62, .156);
    // 옆 수도꼭지 (보울 쪽) · 레버 받침 · 발밑 물받이 쇠살
    add(G.cyl(.028, .028, .12, 10), C.steelD, -.2, .45, 0, 0, 0, HP); add(G.cyl(.042, .036, .05, 12), '#c9a34c', -.27, .45, 0, 0, 0, HP);
    add(G.box(.08, .1, .08, .02), '#e2403a', -.2, .55, 0);
    add(G.box(.5, .012, .5, .006), '#8d879c', 0, .007, .05); for (let k = 0; k < 6; k++) add(G.pbox(.02, .016, .42), '#5d6378', -.2 + k * .08, .01, .05);
  }));
  // 부품: 물 레버 + (돌 때 나타나는) 호스 · 물줄기 · 물웅덩이
  const lv = new THREE.Group(); put(lv, -.2, .6, 0); f.add(lv);
  lv.add(mc('fountain-lever', ({ add }) => { add(G.box(.04, .22, .04, .015), C.yel, 0, .11, 0); add(G.sph(.048, 12, 8), C.red, 0, .23, 0); }));
  // 보울 테두리에서 음수대 쪽으로 가장 가까운 곳 (코핑 위)
  const dl = Math.hypot(bx, bz), ux = -bx / dl, uz = -bz / dl, rr = (BOWL.a - BOWL.deck) * .9;
  const cp = [bx + ux * rr * 1.02, bz + uz * rr * .78];
  const hose = new THREE.Group(); f.add(hose);
  { const crv = new THREE.CatmullRomCurve3([new THREE.Vector3(-.3, .45, 0), new THREE.Vector3(-.42, .7, -.04), new THREE.Vector3(cp[0] + ux * .12, H + .1, cp[1] + uz * .12), new THREE.Vector3(cp[0], H + .06, cp[1]), new THREE.Vector3(cp[0] - ux * .12, H - .1, cp[1] - uz * .12)]);
    hose.add(mesh(new THREE.TubeGeometry(crv, 30, .026, 8, false), mat('#4fae6a', { rough: .5, rim: .25 }), { cast: false }));
    hose.add(put(mesh(new THREE.CylinderGeometry(.03, .02, .06, 10), mat('#e0b45c', { rough: .4, rim: .2 }), { cast: false }), cp[0] - ux * .14, H - .14, cp[1] - uz * .14)); }
  const jet = new THREE.Group(); f.add(jet);
  { const s0 = new THREE.Vector3(cp[0] - ux * .15, H - .17, cp[1] - uz * .15), s2 = new THREE.Vector3(bx + ux * .25, y0 + .02, bz + uz * .2);
    const crv = new THREE.QuadraticBezierCurve3(s0, new THREE.Vector3((s0.x + s2.x) / 2, H - .1, (s0.z + s2.z) / 2), s2);
    jet.add(mesh(new THREE.TubeGeometry(crv, 20, .035, 8, false), mat('#9fdcf5', { rough: .3, rim: .3 }), { cast: false })); }
  const pool = mesh(new THREE.CircleGeometry(1, 40), mat('#a8def6', { rough: .15, rim: .35 }), { cast: false });
  put(pool, bx + .05, y0 + .01, bz + .03, -HP, 0, 0); pool.scale.set(.01, .01, 1); f.add(pool);
  hose.visible = jet.visible = pool.visible = false;
  const p = f.part('lift', [lv, hose, jet, pool], t => {
    hose.visible = t > .01; lv.rotation.x = 1.25 * Math.min(1, Math.max(0, (t - .05) / .12));
    jet.visible = t > .17 && t < .9;
    const w = Math.min(1, Math.max(0, (t - .22) / .45)); pool.visible = w > .01; pool.scale.set(.12 + .86 * w, .1 + .5 * w, 1);
  }, { label: '물 레버', sfx: 'whoosh', dur: 1.2 });
  p.waterJet = jet;
  // (걷기·문 열림 계산은 음수대 몸통만 — 호스·물줄기·물웅덩이는 보울 위에 걸치는 장식)
  f.walkSolids = [[-.26, 0, -.22, .32, .95, .3]]; f.collideBox = [-.26, 0, -.22, .32, .95, .3];
  f.spot('on', null, .1, .82, -.08, { maxH: .2, label: '음수대 위', scale: 1 });
  f.spot('behind', null, .3, 0, -.1, { maxH: .3, label: '음수대 옆', scale: 1 });
};

// ── 점수판 (설계서 17 뒤집기): 두 기둥 사이 판이 세로축으로 빙글 — 앞 '오늘의 묘기 ★★★', 뒤 점수 숫자 셋 ───────────────────────────
B.skb_scoreboard = f => {
  const BW = .86, BH = .54, Y = .95;
  f.add(mc('score-posts', ({ add }) => {
    for (const sx of [-1, 1]) { add(G.cyl(.035, .035, Y + BH / 2 + .1, 10), C.steelD, sx * (BW / 2 + .07), (Y + BH / 2 + .1) / 2, 0); add(G.cyl(.08, .09, .05, 14), '#6d7590', sx * (BW / 2 + .07), .025, 0); add(G.sph(.045, 10, 8), C.yel, sx * (BW / 2 + .07), Y + BH / 2 + .12, 0); }
    for (const sx of [-1, 1]) add(G.cyl(.02, .02, .08, 8), C.steel, sx * (BW / 2 + .03), Y, 0, 0, 0, HP);
  }));
  const bd = new THREE.Group(); put(bd, 0, Y, 0); f.add(bd);
  bd.add(mc('score-board', ({ add }) => { add(G.box(BW, BH, .04, .02), '#ffffff', 0, 0, 0); add(G.box(BW + .03, BH + .03, .03, .02), '#3a3450', 0, 0, 0); }));
  bd.add(put(decal(BW - .04, BH - .04, scoreFront()), 0, 0, .022));
  bd.add(put(decal(BW - .04, BH - .04, scoreBack()), 0, 0, -.022, 0, PI, 0));
  // (뒤로 돌린 판의 뒷면에 붙은 봉투 자리: 판을 뒤집으면 앞으로 옴)
  const back = new THREE.Group(); put(back, -.22, -.12, -.045); bd.add(back);
  const p = f.part('lift', bd, t => { bd.rotation.y = PI * t; }, { label: '점수판', sfx: 'flip', dur: .45 });
  p.flipSign = true; p.score = SCORE.join('');
  f.spot('inside', back, 0, 0, 0, { part: p, maxH: .16, label: '점수판 뒷면', scale: .5, wallFace: true });
  f.spot('under', null, .1, 0, .1, { maxH: .35, label: '점수판 밑', scale: 1 });
};

// ── 캡슐 뽑기 두 대 (설계서 8 변형): 빨강·민트 받침 위 투명 돔에 캡슐, 오른쪽 기계의 손잡이를 돌리면 캡슐 나오는 곳 뚜껑이 열림 ─────────
B.skb_gacha = f => {
  const M = [[-.24, C.red], [.24, '#4cbfa8']];
  const caps = ['#ff7eb0', '#ffd250', '#7cc4ef', '#a98ce8', '#ff9a4a', '#7fd8c4'];
  f.add(mc('gacha', ({ add }) => {
    add(G.box(1.0, .1, .5, .03), '#3a3450', 0, .05, 0);
    M.forEach(([x, c], m) => {
      add(G.box(.42, .55, .42, .05), c, x, .38, 0); add(G.box(.44, .04, .44, .015), '#ffffff', x, .67, 0);
      add(G.cyl(.18, .2, .05, 18), shade(c, -.1), x, .71, 0);
      // 캡슐 (돔 안)
      for (let k = 0; k < 9; k++) { const a = k * 2.3 + m, r = .06 + (k % 3) * .04; add(G.sph(.052, 12, 8), caps[(k + m) % 6], x + Math.cos(a) * r, .78 + (k % 3) * .06, Math.sin(a) * r); }
      add(G.cyl(.09, .09, .03, 16), shade(c, -.15), x, 1.06, 0);
      // 동전 넣는 곳 · 나오는 곳 틀
      add(G.box(.12, .08, .02, .01), '#e8eef8', x, .5, .215); add(G.box(.025, .05, .022, .005), '#3a3450', x, .5, .222);
      add(G.box(.18, .14, .03, .02), shade(c, -.25), x, .22, .2);
    });
  }));
  // 돔 (반투명)
  for (const [x] of M) f.add(put(mesh(new THREE.SphereGeometry(.2, 20, 14, 0, PI * 2, 0, PI * .62), mat('#e9f6ff', { opacity: .42, rough: .1, rim: .45 }), { cast: false }), x, .87, 0));
  f.add(put(decal(.42, .21, gachaTex()), 0, .97, .03));
  { const sg = put(new THREE.Group(), 0, .98, 0); sg.add(mc('gacha-signpost', ({ add }) => { add(G.box(.46, .25, .03, .02), '#ffffff', 0, 0, 0); add(G.box(.03, .2, .03, .01), '#3a3450', 0, -.2, 0); })); f.add(sg); }
  // 손잡이 + 나오는 곳 뚜껑 (부품, 오른쪽 기계)
  const xr = M[1][0];
  const crank = new THREE.Group(); put(crank, xr, .37, .215); f.add(crank);
  crank.add(mc('gacha-crank', ({ add }) => { add(G.cyl(.075, .075, .03, 16), '#e8eef8', 0, 0, .015, HP, 0, 0); add(G.box(.13, .035, .035, .012), '#ffffff', 0, 0, .04); add(G.sph(.026, 10, 8), C.yel, .06, 0, .055); }));
  const flap = new THREE.Group(); put(flap, xr, .29, .218); f.add(flap);
  flap.add(mc('gacha-flap', ({ add }) => add(G.box(.15, .11, .015, .01), '#ffffff', 0, -.055, 0)));
  const cap = new THREE.Group(); put(cap, xr, .2, .22); f.add(cap);
  cap.add(mc('gacha-cap', ({ add }) => { add(new THREE.SphereGeometry(.05, 12, 8, 0, PI * 2, 0, HP), '#ffd250', 0, 0, 0); add(new THREE.SphereGeometry(.05, 12, 8, 0, PI * 2, HP, HP), '#ffffff', 0, 0, 0); }));
  cap.scale.setScalar(.01);
  const p = f.part('lift', [crank, flap, cap], t => { crank.rotation.z = -PI * 2 * Math.min(1, t * 1.4); flap.rotation.x = -1.2 * Math.max(0, (t - .55) / .45); cap.scale.setScalar(Math.max(.01, (t - .6) / .4)); }, { label: '캡슐 손잡이', sfx: 'ratchet', dur: .7 });
  f.spot('inside', null, xr - .03, .17, .18, { part: p, maxH: .12, label: '캡슐 나오는 곳', scale: .45 });
  f.spot('on', null, M[0][0], .69, .12, { maxH: .2, label: '뽑기 기계 위', scale: .8 });
  f.spot('behind', null, -.55, 0, -.1, { maxH: .3, label: '뽑기 기계 옆', scale: 1 });
};

// ── 보드 진열대 (설계서 19 회전): 동그란 받침 위 기둥에 보드 넷이 둘러 꽂힘, 돌리면 뒤쪽이 앞으로 ─────────────────────────────────
const DECKS = [[C.pink, C.yel], ['#3b3556', C.orange], [C.mint, '#ffffff'], [C.sky, C.pink]];
B.skb_spinrack = f => {
  f.add(mc('spin-base', ({ add }) => { add(G.cyl(.36, .4, .08, 24), '#3a3450', 0, .04, 0); add(G.cyl(.3, .3, .02, 24), '#6d7590', 0, .09, 0); }));
  const top = new THREE.Group(); put(top, 0, .1, 0); f.add(top);
  top.add(mc('spin-top', ({ add }) => {
    add(G.cyl(.04, .04, 1.1, 12), C.steel, 0, .55, 0); add(G.cyl(.26, .26, .04, 20), '#ffffff', 0, .2, 0); add(G.cyl(.18, .18, .03, 20), '#ffffff', 0, .99, 0);
    add(G.box(.36, .2, .03, .02), C.yel, 0, 1.18, 0); add(G.ext(starShape(.06, .028), .01, 0), C.pink, 0, 1.18, .02);
    DECKS.forEach(([c1, c2], k) => { const a = k * HP + PI / 4, x = Math.sin(a) * .2, z = Math.cos(a) * .2;
      add(G.box(.2, .8, .03, .014), c1, x, .62, z, 0, a, 0); add(G.ext(starShape(.07, .032), .008, 0), c2, x + Math.sin(a) * .02, .66, z + Math.cos(a) * .02, 0, a, 0); add(G.box(.2, .06, .008, .004), c2, x + Math.sin(a) * .018, .38, z + Math.cos(a) * .018, 0, a, 0);
      for (const y of [.36, .84]) for (const s of [-1, 1]) add(G.cyl(.025, .025, .03, 10), '#fff4e2', x + Math.cos(a) * s * .06 - Math.sin(a) * .03, y, z - Math.sin(a) * s * .06 - Math.cos(a) * .03, 0, a, HP); });
  }));
  const back = new THREE.Group(); put(back, 0, .22, -.3); top.add(back);
  const p = f.part('lift', top, t => { top.rotation.y = PI * t; }, { label: '보드 진열대', sfx: 'gearUp', dur: .5 });
  f.spot('inside', back, 0, 0, 0, { part: p, maxH: .22, label: '진열대 뒤', scale: .55 });
  f.spot('on', null, .22, .1, .22, { maxH: .25, label: '진열대 받침 위', scale: .8 });
};

// ── 벤치: 콘크리트 다리·나무 앉는 판, 위에 가방·물병·수건 ─────────────────────────────────────────────────
B.skb_bench = f => {
  const L = 1.5;
  f.add(mc('bench', ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.12, .38, .4, .03), C.conc2, sx * (L / 2 - .12), .19, 0);
    for (let k = 0; k < 3; k++) add(G.box(L, .045, .12, .015), k % 2 ? C.wood : shade(C.wood, -.06), 0, .41, -.13 + k * .13);
    add(G.box(L, .2, .05, .02), C.woodD, 0, .62, -.2, -.12, 0, 0); for (const sx of [-1, 1]) add(G.box(.05, .24, .05, .01), C.steelD, sx * (L / 2 - .12), .52, -.21);
    // 가방 · 물병 · 수건
    add(G.box(.32, .3, .18, .07), '#5aa0e0', -.35, .58, -.02); add(G.box(.26, .12, .03, .03), '#3f7fc0', -.35, .52, .08); add(G.box(.04, .2, .05, .015), '#ffd250', -.47, .62, .09);
    add(G.cyl(.04, .04, .2, 12), '#ff9ab8', .1, .53, .05); add(G.cyl(.026, .03, .04, 10), '#ffffff', .1, .65, .05);
    add(G.box(.32, .02, .2, .02), '#ffffff', .45, .44, .0, 0, .2, 0); add(G.box(.3, .022, .03, .006), C.mint, .45, .45, .06, 0, .2, 0);
  }));
  f.spot('under', null, .1, 0, .02, { maxH: .3, label: '벤치 밑', scale: 1 });
  f.spot('on', null, .7, .44, -.05, { maxH: .3, label: '벤치 끝', scale: 1 });
  f.spot('behind', null, L / 2 + .2, 0, .05, { maxH: .3, label: '벤치 옆', scale: 1 });
};

// ── 그래피티 벽 (2.4 × .22, 높이 1.55, 흑백판에서 색이 돌아오는 가구): 콘크리트 블록 벽 앞면 큰 벽화. 흑백판에선 분필 밑그림만 —
// 찾아서 색이 돌아오는 순간 왼쪽부터 스프레이가 칠해지듯 벽화가 차오른다(furniture group의 userData.grayStop·colored를 보고, 1.4초)
const MW = 1024, MH = 640;
let muralSeq = 0;
function drawMural(c, k) {
  const w = MW, h = MH;
  c.fillStyle = '#e8e3df'; c.fillRect(0, 0, w, h);
  for (let n = 0; n < 1500; n++) { c.fillStyle = hash(n + 900) < .5 ? 'rgba(100,90,115,.09)' : 'rgba(255,255,255,.2)'; c.fillRect(hash(n + 901) * w, hash(n + 902) * h, 2, 2); }
  // 블록 줄눈
  c.strokeStyle = 'rgba(150,140,160,.35)'; c.lineWidth = 2; for (let y = 0; y < h; y += 80) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); for (let x = (y / 80) % 2 ? 0 : 80; x < w; x += 160) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 80); c.stroke(); } }
  const paint = () => {
    const blob = (x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); for (let q = 0; q <= 28; q++) { const a = q / 28 * PI * 2, rr = 1 + .1 * Math.sin(a * 3 + x); c.lineTo(x + Math.cos(a) * rx * rr, y + Math.sin(a) * ry * rr); } c.fill(); };
    blob(512, 210, 470, 170, '#ffd7e6'); blob(250, 470, 220, 140, '#c9eef6'); blob(760, 480, 250, 130, '#fff0b8');
    bubbleWord(c, 'SKATE', 512, 215, 210, C.mint); drips(c, 200, 820, 300, C.mint, 31);
    smileWheel(c, 250, 470, 105);
    bubbleWord(c, 'BOARD', 760, 440, 92, C.pink); bubbleWord(c, 'KING', 760, 540, 92, C.orange);
    star(c, 90, 90, 48, C.yel, .2); star(c, 950, 110, 40, C.sky, -.3); star(c, 470, 560, 30, C.violet, .4); star(c, 960, 590, 26, C.yel, .1);
    c.strokeStyle = C.violet; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(40, 330); c.bezierCurveTo(90, 280, 120, 380, 170, 320); c.stroke();
    c.fillStyle = C.orange; for (let q = 0; q < 6; q++) { c.beginPath(); c.arc(980 - q * 20, 380 - (q % 2) * 14, 8, 0, PI * 2); c.fill(); }
  };
  const sketch = () => {
    // 분필 밑그림: 글자·바퀴·별 윤곽만 흰 선으로
    c.save(); c.globalAlpha = .75; c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.lineJoin = 'round'; c.setLineDash([16, 7]);
    c.font = '900 210px Jua, Ssurround, "Arial Rounded MT Bold", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.strokeText('SKATE', 512, 215);
    c.font = '900 92px Jua, Ssurround, sans-serif'; c.strokeText('BOARD', 760, 440); c.strokeText('KING', 760, 540);
    c.beginPath(); c.arc(250, 470, 105, 0, PI * 2); c.stroke(); c.beginPath(); c.arc(250, 470, 44, 0, PI * 2); c.stroke();
    for (const [x, y, R] of [[90, 90, 48], [950, 110, 40]]) { c.beginPath(); for (let q = 0; q <= 10; q++) { const a = -HP + q * PI / 5, r = q % 2 ? R * .45 : R; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.stroke(); }
    c.restore();
  };
  sketch();
  if (k > 0) {
    // 왼쪽부터 물결 모양 경계로 칠이 차오름 (경계 앞에 스프레이 안개)
    const X = k * w * 1.18;
    c.save(); c.beginPath(); c.moveTo(0, 0); for (let y = 0; y <= h; y += 16) c.lineTo(X - 60 + Math.sin(y * .05 + k * 9) * 40, y); c.lineTo(0, h); c.closePath(); c.clip(); paint(); c.restore();
    if (k < 1) for (let n = 0; n < 90; n++) { const y = hash(n + k * 77) * h, x = X - 60 + Math.sin(y * .05 + k * 9) * 40 + (hash(n + 5 + k * 31) - .3) * 70; c.fillStyle = [C.pink, C.mint, C.yel, C.sky][n % 4]; c.globalAlpha = .55; c.beginPath(); c.arc(x, y, 2 + hash(n + 9) * 5, 0, PI * 2); c.fill(); }
    c.globalAlpha = 1;
  }
}
B.skb_graffiti = f => {
  const L = 2.4, T = .22, H = 1.55;
  f.add(mc('graffiti-wall', ({ add }) => {
    add(G.box(L, H, T, .03), C.conc2, 0, H / 2, 0);
    add(G.box(L + .06, .07, T + .06, .02), '#efecf1', 0, H + .03, 0);
    for (const sx of [-1, 1]) add(G.box(.26, H + .04, T + .08, .03), C.conc, sx * (L / 2 - .1), (H + .04) / 2, 0);
    add(G.box(L + .04, .08, T + .04, .02), C.conc3, 0, .04, 0);
    // 발밑: 스프레이 통 셋, 페인트 묻은 깔개
    add(G.box(.7, .01, .4, .005), '#efe6d8', .55, .006, T / 2 + .26, 0, .1, 0);
    for (const [x, z, c] of [[.32, .3, C.pink], [.48, .42, C.mint], [.66, .27, C.yel]]) { add(G.cyl(.04, .04, .19, 12), c, x, .1, T / 2 + z); add(G.cyl(.028, .03, .03, 10), '#ffffff', x, .21, T / 2 + z); add(G.cyl(.012, .012, .02, 8), C.ink, x, .235, T / 2 + z); }
    for (const [x, z, r, c] of [[.25, .16, .05, C.pink], [.75, .44, .04, C.mint], [.58, .14, .035, C.yel], [.9, .3, .03, C.sky]]) add(G.cyl(r, r, .004, 12), c, x, .013, T / 2 + z);
  }));
  // 벽화: 이 벽만의 살아 있는 캔버스 (아이콘을 그리는 사본과 나눠 쓰지 않게 하나씩 — 안 쓰이면 texCache가 두 판 뒤에 버림)
  const tex = TEX.get('muralLive|' + (++muralSeq), () => canvasTex(MW, MH, c => drawMural(c, 1)));
  const m = mesh(new THREE.PlaneGeometry(L - .5, H - .16), mat('#ffffff', { map: tex, rough: .85, rim: .08 }), { cast: false });
  put(m, 0, H / 2 + .04, T / 2 + .006); m.userData.noMerge = true; f.add(m); f.live = [...(f.live || []), m];
  // 흑백판이 시작될 때(grayStop이 붙을 때)는 바로 밑그림으로, 찾아서 색이 돌아올 때(colored)는 1.4초 동안 왼쪽부터 칠해짐
  let gs = false, col = false, shown = 1, anim = null;
  const draw = k => { drawMural(tex.image.getContext('2d'), k); tex.needsUpdate = true; };
  let last = 0;
  const tick = () => {
    const now0 = performance.now(); if (now0 - last < 6) return; last = now0;
    const ud = f.group.userData, g = !!ud.grayStop, c = !!ud.colored, want = g && !c ? 0 : 1;
    if (g !== gs) { gs = g; col = c; anim = null; if (shown !== want) { shown = want; draw(want); } return; }
    if (c !== col) { col = c; anim = { from: shown, to: want, t0: performance.now() }; }
    if (anim) { const k = Math.min(1, (performance.now() - anim.t0) / 1400), e = 1 - (1 - k) * (1 - k); draw(anim.to ? e : 1 - e); if (k >= 1) { shown = anim.to; anim = null; } }
  };
  // (toonpost.js assignIds puts its own onBeforeRender on every mesh: keep theirs and run this one first — once a frame, the passes share it)
  let theirs = null;
  Object.defineProperty(m, 'onBeforeRender', { configurable: true, get() { return function (...a) { tick(); return theirs?.apply(this, a); }; }, set(v) { theirs = v; } });

  f.spot('on', null, -.75, H + .07, 0, { maxH: .3, label: '그래피티 벽 위', scale: .8 });
  f.spot('behind', null, L / 2 + .12, 0, .1, { maxH: .35, label: '그래피티 벽 끝', scale: 1 });
  f.spot('under', null, .95, 0, T / 2 + .35, { maxH: .25, label: '스프레이 통 옆', scale: 1 });
};

// ── 컨테이너 매점 (2.2 × 1.1, 높이 1.35): 민트 골함석 컨테이너를 고친 매점 — 앞 창구 덮개를 톡 하면 위로 들려 차양이 되고 안 계산대가
// 보임('매점 창구'), 카메라 쪽 끝은 보드 보관함 문(잠금 자리 lockAt, '보드 보관함 문'). 지붕에 간판·꼬마전구, 앞에 빨간 의자 둘
const corrTex = (col) => TEX.get('corr|' + col, () => canvasTex(512, 256, (c, w, h) => {
  c.fillStyle = col; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { const g = c.createLinearGradient(x, 0, x + 32, 0); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(.55, 'rgba(40,60,70,.12)'); g.addColorStop(1, 'rgba(40,60,70,.2)'); c.fillStyle = g; c.fillRect(x, 0, 32, h); }
  for (let n = 0; n < 500; n++) { c.fillStyle = 'rgba(60,80,90,.06)'; c.fillRect(hash(n + 950) * w, hash(n + 951) * h, 3, 2); }
  c.fillStyle = 'rgba(150,100,70,.18)'; for (let n = 0; n < 6; n++) { c.beginPath(); c.ellipse(hash(n + 960) * w, h - 10 - hash(n + 961) * 30, 14, 26, 0, 0, PI * 2); c.fill(); }
}, { repeat: [1 / 1.4, 1 / .7] }));
const kioskSign = () => TEX.get('kioskSign', () => textTex(512, 128, (c, w, h) => {
  c.fillStyle = '#fff6e8'; roundRect(c, 3, 3, w - 6, h - 6, 16); c.fill(); c.strokeStyle = C.orange; c.lineWidth = 5; roundRect(c, 9, 9, w - 18, h - 18, 12); c.stroke();
  fitText(c, '보드킹 매점', w / 2, h / 2 + 2, w * .7, 44, '#3a3450', { weight: '800' });
  star(c, 46, h / 2, 20, C.yel, .2); star(c, w - 46, h / 2, 20, C.pink, -.2);
}));
const menuTex = () => TEX.get('kioskMenu', () => textTex(256, 320, (c, w, h) => {
  c.fillStyle = '#3a3450'; roundRect(c, 2, 2, w - 4, h - 4, 14); c.fill();
  fitText(c, '오늘의 메뉴', w / 2, 34, w * .8, 26, C.yel, { weight: '800' });
  const rows = [['핫도그', '2,000'], ['떡꼬치', '1,500'], ['슬러시', '1,000'], ['컵라면', '1,800']];
  rows.forEach(([a, b], k) => { fitText(c, a, 74, 92 + k * 54, 110, 24, '#ffffff', { weight: '800' }); fitText(c, b, 190, 92 + k * 54, 80, 22, C.mint, { weight: '800' }); });
}));
for (const [k, e] of [['보드킹 매점', 'Board King Snacks'], ['오늘의 메뉴', "Today's Menu"], ['핫도그', 'Hot dog'], ['떡꼬치', 'Rice cake'], ['슬러시', 'Slushie'], ['컵라면', 'Cup noodles']]) if (EN[k] == null) EN[k] = e;
export const KIOSK = { L: 2.2, D: 1.1, H: 1.32, y0: .1 };
B.skb_kiosk = f => {
  // 창구 구멍 x HX0~HX1 · y HY0~HY1, 보관함 칸막이 x PX
  const { L, D, H, y0 } = KIOSK, T = .05, HX0 = -.95, HX1 = .3, HY0 = .62, HY1 = 1.08, PX = .55;
  const MINT = '#8fd4c4', MINT2 = '#6fbcaa', inside = '#4c5a6a';
  f.add(mc('kiosk', ({ add }) => {
    // 받침 블록 넷 · 바닥 · 지붕 · 뒷벽 · 왼쪽 끝 · 칸막이(보관함)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.22, y0, .2, .02), C.conc2, sx * (L / 2 - .15), y0 / 2, sz * (D / 2 - .14));
    add(G.box(L, .06, D, .01), '#5d6a7a', 0, y0 + .03, 0);
    add(G.box(L + .06, .07, D + .06, .02), MINT2, 0, y0 + H + .035, 0);
    add(G.box(L, H, T, .01), MINT, 0, y0 + H / 2, -D / 2 + T / 2);
    add(G.box(T, H, D, .01), MINT, -L / 2 + T / 2, y0 + H / 2, 0);
    add(G.box(.04, H, D - T * 2, .005), inside, PX, y0 + H / 2, 0);
    // 앞벽: 창구 구멍 둘레 네 조각 (겉면 무늬는 따로 붙임)
    add(G.box(HX0 + L / 2, H, T, .01), MINT, (-L / 2 + HX0) / 2, y0 + H / 2, D / 2 - T / 2);
    add(G.box(L / 2 - HX1, H, T, .01), MINT, (HX1 + L / 2) / 2, y0 + H / 2, D / 2 - T / 2);
    add(G.box(HX1 - HX0, HY0, T, .01), MINT, (HX0 + HX1) / 2, y0 + HY0 / 2, D / 2 - T / 2);
    add(G.box(HX1 - HX0, H - HY1, T, .01), MINT, (HX0 + HX1) / 2, y0 + (HY1 + H) / 2, D / 2 - T / 2);
    // 오른쪽 끝(보관함 쪽): 문 구멍 둘레
    const DZ = .36, DY = 1.12;
    add(G.box(T, H, D / 2 - DZ, .01), MINT, L / 2 - T / 2, y0 + H / 2, -(D / 2 + DZ) / 2);
    add(G.box(T, H, D / 2 - DZ, .01), MINT, L / 2 - T / 2, y0 + H / 2, (D / 2 + DZ) / 2);
    add(G.box(T, H - DY, DZ * 2, .01), MINT, L / 2 - T / 2, y0 + (DY + H) / 2, 0);
    // 안: 계산대 · 뒤 선반 음료 · 냉장고 · 핫도그 기계
    add(G.box(HX1 - HX0 + .1, .05, .3, .01), C.wood, (HX0 + HX1) / 2, y0 + HY0 + .025, D / 2 - .17);
    add(G.box(1.2, .03, .2, .005), C.wood, -.25, y0 + 1.0, -D / 2 + .15); add(G.box(1.2, .03, .2, .005), C.wood, -.25, y0 + .72, -D / 2 + .15);
    for (let k = 0; k < 7; k++) { add(G.cyl(.035, .035, .13, 10), [C.red, C.yel, C.sky, C.mint, C.pink, C.orange, '#ffffff'][k], -.75 + k * .16, y0 + 1.08, -D / 2 + .15); add(G.box(.09, .12, .07, .01), [C.yel, C.pink, C.mint][k % 3], -.75 + k * .16, y0 + .79, -D / 2 + .15); }
    add(G.box(.42, .7, .4, .03), '#e8eef8', .2, y0 + .35, -D / 2 + .25); add(G.box(.3, .5, .01, .005), '#b8e0f2', .2, y0 + .4, -D / 2 + .455);
    add(G.box(.3, .14, .2, .02), '#d9dde8', -.15, y0 + HY0 + .12, D / 2 - .2); for (let k = 0; k < 3; k++) add(G.cap(.025, .16, 2, 8), '#e98a4a', -.24 + k * .09, y0 + HY0 + .21, D / 2 - .2, 0, 0, HP);
    // 계산대 위: 컵라면 셋, 종
    for (let k = 0; k < 3; k++) { add(G.cyl(.05, .04, .1, 12), '#ffffff', -.55 + k * .12, y0 + HY0 + .1, D / 2 - .1); add(G.cyl(.051, .051, .012, 12), C.red, -.55 + k * .12, y0 + HY0 + .15, D / 2 - .1); }
    add(new THREE.SphereGeometry(.05, 12, 8, 0, PI * 2, 0, HP), '#f2c94c', .3, y0 + HY0 + .05, D / 2 - .1);
    // 보관함 칸: 선반 하나, 헬멧, 기대 세운 보드
    add(G.box(.48, .03, D - .14, .005), '#9aa3ba', (PX + L / 2) / 2, y0 + .66, 0);
    add(new THREE.SphereGeometry(.12, 16, 8, 0, PI * 2, 0, HP), C.pink, (PX + L / 2) / 2, y0 + .68, -.18, 0, 0, 0, [1, .9, 1.1]);
    add(G.box(.18, .62, .03, .012), C.violet, (PX + L / 2) / 2 + .08, y0 + .37, -.35, -.2, 0, 0); for (const y of [.15, .58]) add(G.cyl(.026, .026, .14, 10), '#fff4e2', (PX + L / 2) / 2 + .08, y0 + y, -.33, 0, 0, HP);
    // 지붕: 간판 받침 · 꼬마전구 줄 · 실외기
    for (const sx of [-1, 1]) add(G.box(.05, .26, .05, .01), C.steelD, sx * .55, y0 + H + .17, D / 2 - .12);
    for (let k = 0; k < 12; k++) { const x = -L / 2 + .12 + k * (L - .24) / 11; add(G.sph(.028, 8, 6), [C.yel, C.pink, C.mint, C.sky][k % 4], x, y0 + H - .04 - Math.sin(k / 11 * PI) * .05, D / 2 + .04); }
    add(G.box(.36, .26, .24, .03), '#e8eef8', -.7, y0 + H + .2, -.2); add(G.cyl(.09, .09, .02, 16), '#9aa3ba', -.7, y0 + H + .2, -.075, HP, 0, 0);
    // 앞: 빨간 의자 둘 (나란히)
    for (const x of [-.55, -.05]) { add(G.cyl(.14, .14, .04, 16), C.red, x, .4, D / 2 + .32); for (const [dx, dz] of [[-.09, -.09], [.09, -.09], [-.09, .09], [.09, .09]]) add(G.cyl(.015, .02, .38, 6), '#d8433a', x + dx, .19, D / 2 + .32 + dz); }
  }));
  // 겉면 골함석 무늬: 앞(창구 구멍 뺀 판), 오른쪽 끝(문 구멍 뺀 판) — 카메라 쪽 두 면
  { const s = new THREE.Shape(); s.moveTo(-L / 2, 0); s.lineTo(L / 2, 0); s.lineTo(L / 2, H); s.lineTo(-L / 2, H); s.lineTo(-L / 2, 0);
    const hole = new THREE.Path(); hole.moveTo(HX0, HY0); hole.lineTo(HX0, HY1); hole.lineTo(HX1, HY1); hole.lineTo(HX1, HY0); hole.lineTo(HX0, HY0); s.holes.push(hole);
    f.add(put(mesh(new THREE.ShapeGeometry(s), mat('#ffffff', { map: corrTex(MINT), rough: .7, rim: .12 }), { cast: false }), 0, y0, D / 2 + .004)); }
  { const DZ = .36, DY = 1.12, s = new THREE.Shape(); s.moveTo(-D / 2, 0); s.lineTo(D / 2, 0); s.lineTo(D / 2, H); s.lineTo(-D / 2, H); s.lineTo(-D / 2, 0);
    const hole = new THREE.Path(); hole.moveTo(-DZ, 0); hole.lineTo(-DZ, DY); hole.lineTo(DZ, DY); hole.lineTo(DZ, 0); hole.lineTo(-DZ, 0); s.holes.push(hole);
    f.add(put(mesh(new THREE.ShapeGeometry(s), mat('#ffffff', { map: corrTex(MINT), rough: .7, rim: .12 }), { cast: false }), L / 2 + .004, y0, 0, 0, HP, 0)); }
  // 간판 · 메뉴판
  f.add(put(decal(1.05, .27, kioskSign()), 0, y0 + H + .25, D / 2 - .1));
  f.add(put(decal(.3, .38, menuTex()), HX1 + .3, y0 + .85, D / 2 + .008));
  // 창구 덮개 (부품): 위 경첩으로 들려 차양이 됨 — 톡 하면 저절로
  const hatch = new THREE.Group(); put(hatch, (HX0 + HX1) / 2, y0 + HY1 + .02, D / 2 + .01); f.add(hatch);
  hatch.add(mc('kiosk-hatch', ({ add }) => {
    add(G.box(HX1 - HX0 + .08, HY1 - HY0 + .06, .035, .01), '#f7f3ea', 0, -(HY1 - HY0 + .06) / 2, 0);
    for (let k = 0; k < 5; k++) add(G.box((HX1 - HX0 + .08) / 5 - .01, .1, .04, .006), k % 2 ? '#ffffff' : C.orange, -(HX1 - HX0 + .08) / 2 + (HX1 - HX0 + .08) / 10 + k * (HX1 - HX0 + .08) / 5, -.06, .004);
    add(G.box(.12, .03, .05, .01), C.steelD, 0, -(HY1 - HY0) + .02, .03);
  }));
  const ph = f.part('lift', hatch, t => { hatch.rotation.x = -1.35 * t; }, { label: '매점 창구', sfx: 'creak', dur: .5 });
  f.spot('inside', null, .08, y0 + HY0 + .05, D / 2 - .17, { part: ph, maxH: .35, label: '매점 계산대 위', scale: .75 });
  f.spot('inside', null, -.45, y0 + .735, -D / 2 + .17, { part: ph, maxH: .25, label: '매점 선반', scale: .6 });
  // 보드 보관함 문 (부품, 잠금 자리): 오른쪽 끝, 앞쪽 경첩
  const DZ = .36, DY = 1.12, door = new THREE.Group(); put(door, L / 2 + .01, y0, DZ); f.add(door);
  door.add(mc('kiosk-door', ({ add }) => {
    add(G.box(.035, DY - .02, DZ * 2 - .02, .01), '#f2c94c', 0, (DY - .02) / 2, -DZ);
    for (let k = 0; k < 4; k++) add(G.box(.04, .025, DZ * 2 - .14, .006), '#d9ac34', .006, .25 + k * .2, -DZ);
    add(G.box(.05, .16, .04, .012), '#e8eef8', .02, .58, -DZ * 2 + .1);
  }));
  { const lab = put(decal(.4, .2, lockerLabel()), .025, .95, -DZ, 0, HP, 0); door.add(lab); }
  const pd = f.part('door', door, t => { door.rotation.y = 1.6 * t; }, { label: '보드 보관함 문', sfx: 'door', dur: .35 });
  pd.lockable = true; pd.lockAt = { x: .045, y: .56, z: -DZ * 2 + .16, parent: door };
  f.spot('inside', null, (PX + L / 2) / 2 - .04, y0 + .06, .18, { part: pd, maxH: .55, label: '보관함 안', scale: 1 });
  f.spot('inside', null, (PX + L / 2) / 2, y0 + .675, .16, { part: pd, maxH: .4, label: '보관함 선반', scale: .7 });
  f.spot('on', null, .6, y0 + H + .07, .12, { maxH: .3, label: '매점 지붕 위', scale: 1 });
  f.spot('under', null, -.3, 0, D / 2 + .32, { maxH: .3, label: '의자 밑', scale: 1 });
  f.spot('behind', null, -L / 2 - .12, 0, .2, { maxH: .35, label: '매점 옆', scale: 1 });
};
const lockerLabel = () => TEX.get('lockerLabel', () => textTex(256, 128, (c, w, h) => {
  c.fillStyle = '#ffffff'; roundRect(c, 3, 3, w - 6, h - 6, 14); c.fill(); c.strokeStyle = '#3a3450'; c.lineWidth = 5; roundRect(c, 8, 8, w - 16, h - 16, 10); c.stroke();
  fitText(c, '보드 보관함', w / 2, h / 2 + 2, w * .78, 30, '#3a3450', { weight: '800' });
}));

export const SKB_BUILDERS = B;
export const SKB_INFO = {
  skb_base: { w: 8, d: 6, name: '스케이트 파크 바닥', price: 0, hidden: true },
  skb_bowl: { w: 4, d: 3, name: '콘크리트 보울', price: 0, hidden: true },
  skb_miniramp: { w: 3, d: 2, name: '미니 하프파이프', price: 0, hidden: true },
  skb_kiosk: { w: 2, d: 1, name: '컨테이너 매점', price: 0, hidden: true },
  skb_stairs: { w: 1, d: 1, name: '3단 계단과 핸드레일', price: 0, hidden: true },
  skb_fountain: { w: 1, d: 1, name: '음수대', price: 0, hidden: true },
  skb_scoreboard: { w: 1, d: 1, name: '점수판', price: 0, hidden: true },
  // 흑백판에서 색이 돌아오는 가구 셋(안 열리는 것 — stage.js setupGray가 이 셋을 먼저 고름): 그래피티 벽 · 펀박스 · 벤치
  skb_graffiti: { w: 2, d: 1, name: '그래피티 벽', price: 0 },
  skb_funbox: { w: 3, d: 1, name: '펀박스', price: 0 },
  skb_bench: { w: 2, d: 1, name: '파크 벤치', price: 0 },
  skb_gacha: { w: 1, d: 1, name: '캡슐 뽑기', price: 0 },
  skb_spinrack: { w: 1, d: 1, name: '보드 진열대', price: 0 },
};

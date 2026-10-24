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
import { put, mat, mesh, canvasTex, texCache, roundRect, shade } from './kit.js';
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
  conc: '#cfccc6', conc2: '#b9b5ae', conc3: '#a29d96', deck: '#e3e0da', steel: '#cdd3e2', steelD: '#8f97b2', ink: '#2a1d33',
  wood: '#e9bb82', woodD: '#b98551', ply: '#f0cf9c', earth: '#b48f6c', earth2: '#977459', grass: '#a7c58c', grass2: '#8fb276',
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
  c.fillStyle = '#cbc8c2'; c.fillRect(0, 0, w, h);
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
  c.fillStyle = '#b3b4b6'; c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * .42); g.addColorStop(0, 'rgba(120,118,140,.18)'); g.addColorStop(.7, 'rgba(120,118,140,.06)'); g.addColorStop(1, 'rgba(255,255,255,.12)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 2600; k++) { const n = hash(k + 300); c.fillStyle = n < .55 ? 'rgba(90,92,118,.1)' : 'rgba(255,255,255,.22)'; c.fillRect(hash(k + 301) * w, hash(k + 302) * h, 2, 2); }
  c.lineCap = 'round'; for (let k = 0; k < 18; k++) { c.strokeStyle = `rgba(46,42,62,${.1 + hash(k + 320) * .12})`; c.lineWidth = 3 + hash(k + 321) * 4; const r = .22 + hash(k + 322) * .24, a = hash(k + 323) * 6;
    for (const o of [0, .018]) { c.beginPath(); c.ellipse(w / 2, h / 2, (r + o) * w, (r + o) * h, 0, a, a + 1 + hash(k + 324) * 1.6); c.stroke(); } }
  // (10/24 "질감으로 — 사용 흔적"): 코핑 밑 둘레의 짙은 왁스 자국, 배수구 둘레 젖은 고리, 바닥의 실금 하나
  for (let k = 0; k < 9; k++) { const an = hash(k + 860) * PI * 2; c.fillStyle = 'rgba(70,66,84,.16)'; c.beginPath(); c.ellipse(w / 2 + Math.cos(an) * w * .44, h / 2 + Math.sin(an) * h * .43, 60, 14, an + HP, 0, PI * 2); c.fill(); }
  const dg = c.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, 150); dg.addColorStop(0, 'rgba(80,90,110,.22)'); dg.addColorStop(1, 'rgba(80,90,110,0)'); c.fillStyle = dg; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(60,56,70,.45)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(w * .62, h * .6); for (let k = 1; k < 9; k++) c.lineTo(w * .62 + k * 18 + (k % 2 ? 6 : -4), h * .6 + k * 10); c.stroke();
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
// ── 재질 (10/24 사용자 "그래피티는 그냥 빼고 질감으로 하자. 다양한 질감이고 사용 흔적이 좀 있는 느낌으로"): 면마다 다른 재질 한 장씩 —
// 같은 그림을 여러 면에 돌려 쓰지 않음. 광장(줄눈 콘크리트) · 보울 안(흙손 마감) · 보울 바깥(거푸집 결 노출 콘크리트) · 레일뱅크 옆(자갈 박힌
// 워시 콘크리트) · 램프 옆(페인트 벗겨진 합판) · 뒤 벽(시멘트 블록) · 매점(녹물 흐른 골함석)
const speck = (c, w, h, n, seed, dark = 'rgba(70,64,76,.12)', light = 'rgba(255,255,255,.14)') => { for (let k = 0; k < n; k++) { const q = hash(seed + k); c.fillStyle = q < .5 ? dark : light; c.fillRect(hash(seed + k + 1) * w, hash(seed + k + 2) * h, 1.5 + hash(seed + k + 3) * 2, 1.5 + hash(seed + k + 4) * 2); } };
const streaks = (c, w, h, n, seed, col, top = 0) => { for (let k = 0; k < n; k++) { const x = hash(seed + k) * w, L = h * (.2 + hash(seed + k + 1) * .5), ww = 6 + hash(seed + k + 2) * 18;
  const g = c.createLinearGradient(0, top, 0, top + L); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x, top, ww, L); } };
// 보울 바깥: 거푸집 판자 자국(가로 띠마다 결과 이음), 폼타이 구멍 줄, 위에서 흘러내린 빗물 얼룩, 바닥 쪽 흙 튄 자국
const formTex = () => TEX.get('form', () => canvasTex(1024, 256, (c, w, h) => {
  c.fillStyle = '#c3c0ba'; c.fillRect(0, 0, w, h);
  const bh = h / 4;
  for (let r = 0; r < 4; r++) { c.fillStyle = `rgba(${r % 2 ? '255,255,255,.05' : '60,55,60,.05'})`; c.fillRect(0, r * bh, w, bh);
    c.strokeStyle = 'rgba(80,74,82,.16)'; c.lineWidth = 1.2; for (let k = 0; k < 7; k++) { const y = r * bh + 6 + k * (bh - 12) / 6 + (hash(r * 9 + k) - .5) * 4; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 32) c.lineTo(x, y + Math.sin(x * .02 + r + k) * 1.6); c.stroke(); }
    c.fillStyle = 'rgba(90,84,92,.35)'; c.fillRect(0, r * bh - 1, w, 2);
    for (let x = 90 + r * 37; x < w; x += 240) c.fillRect(x, r * bh, 2, bh); }
  for (let k = 0; k < 2; k++) for (let x = 60; x < w; x += 160) { const y = bh * (k * 2 + 1); c.fillStyle = '#9c978f'; c.beginPath(); c.arc(x + (k ? 80 : 0), y, 6, 0, PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x + (k ? 80 : 0) - 1.5, y - 1.5, 2.2, 0, PI * 2); c.fill(); }
  speck(c, w, h, 2200, 1200);
  streaks(c, w, h, 16, 1300, 'rgba(70,66,74,.14)');
  const g = c.createLinearGradient(0, h * .75, 0, h); g.addColorStop(0, 'rgba(120,98,80,0)'); g.addColorStop(1, 'rgba(120,98,80,.28)'); c.fillStyle = g; c.fillRect(0, h * .75, w, h * .25);
}, { repeat: [1, 1] }));
// 레일뱅크 옆: 워시 콘크리트 — 박힌 자갈(옅은 회·황토·검정), 위 모서리 깨진 자국, 아래 바퀴 때
const aggTex = () => TEX.get('agg', () => canvasTex(1024, 256, (c, w, h) => {
  c.fillStyle = '#b4b0aa'; c.fillRect(0, 0, w, h);
  const cols = ['#d9d4cb', '#c8bba8', '#9d968e', '#e9e4dc', '#867f78', '#c4ad8f'];
  for (let k = 0; k < 1500; k++) { const x = hash(k + 1400) * w, y = hash(k + 1401) * h, r = 2 + hash(k + 1402) * 5; c.fillStyle = cols[k % 6]; c.beginPath(); c.ellipse(x, y, r * 1.2, r, hash(k + 1403) * 3, 0, PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - r * .5, y - r * .6, r * .6, 1.2); }
  speck(c, w, h, 1200, 1500, 'rgba(50,46,52,.18)');
  // 위 모서리 깨진 자국 · 쓸린 자국
  for (let k = 0; k < 9; k++) { const x = hash(k + 1600) * w, ww = 12 + hash(k + 1601) * 40; c.fillStyle = '#8f8a84'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + ww, 0); c.lineTo(x + ww * .6, 6 + hash(k + 1602) * 10); c.closePath(); c.fill(); }
  c.fillStyle = 'rgba(40,36,44,.18)'; for (let k = 0; k < 12; k++) c.fillRect(hash(k + 1700) * w, h - 22 - hash(k + 1701) * 20, 40 + hash(k + 1702) * 90, 3);
}, { repeat: [1, 1] }));
// 램프 옆판: 합판 결 위에 옅은 세이지 페인트, 아래쪽·모서리부터 벗겨져 나무가 보임, 나사 줄, 보드 쓸린 자국
const plySideTex = () => TEX.get('plyside', () => canvasTex(1024, 256, (c, w, h) => {
  c.fillStyle = '#d8b088'; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(150,100,60,.25)'; c.lineWidth = 1.4; for (let k = 0; k < 40; k++) { const y = hash(k + 1800) * h; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(w * .3, y + 8, w * .6, y - 8, w, y + (hash(k + 1801) - .5) * 14); c.stroke(); }
  // 페인트: 위에서부터 칠, 아래는 물결 모양으로 벗겨짐 + 군데군데 조각
  c.save(); c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); for (let x = w; x >= 0; x -= 16) c.lineTo(x, h * .7 + Math.sin(x * .03) * 14 + (hash(x + 1900) - .5) * 18); c.closePath(); c.clip();
  c.fillStyle = '#a9c3b4'; c.fillRect(0, 0, w, h); speck(c, w, h, 700, 1950, 'rgba(60,80,70,.12)');
  c.restore();
  c.fillStyle = '#d8b088'; for (let k = 0; k < 22; k++) { const x = hash(k + 2000) * w, y = hash(k + 2001) * h * .65, r = 4 + hash(k + 2002) * 14; c.beginPath(); for (let q = 0; q <= 10; q++) { const a = q / 10 * PI * 2, rr = r * (.6 + hash(k * 13 + q) * .5); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .7); } c.fill(); }
  c.fillStyle = 'rgba(90,60,40,.55)'; for (let x = 24; x < w; x += 72) for (const y of [16, h - 18]) { c.beginPath(); c.arc(x, y, 3.2, 0, PI * 2); c.fill(); }
  c.strokeStyle = 'rgba(40,30,30,.18)'; c.lineCap = 'round'; c.lineWidth = 4; for (let k = 0; k < 8; k++) { const x = hash(k + 2100) * w, y = h * (.4 + hash(k + 2101) * .5); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 60 + hash(k + 2102) * 80, y + (hash(k + 2103) - .5) * 20); c.stroke(); }
}, { repeat: [1, 1] }));
// 뒤 벽: 시멘트 블록(40 × 20, 엇갈림), 블록마다 옅은 차이, 줄눈, 위에서 흐른 물 자국과 하얀 백화, 아래 물 튄 띠, 모서리 이끼
const blockTex = () => TEX.get('cmu', () => canvasTex(1024, 640, (c, w, h) => {
  c.fillStyle = '#a7a39c'; c.fillRect(0, 0, w, h);
  const bw = 128, bh = 64;
  for (let r = 0; r * bh < h; r++) for (let k = -1; k * bw < w; k++) { const x = k * bw + (r % 2) * bw / 2, y = r * bh, n = hash(r * 31 + k + 2200);
    c.fillStyle = n < .2 ? '#c9c5bd' : n < .6 ? '#c2beb6' : '#bbb7ae'; c.fillRect(x + 3, y + 3, bw - 6, bh - 6);
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x + 3, y + 3, bw - 6, 3); }
  speck(c, w, h, 3000, 2300);
  streaks(c, w, h, 10, 2400, 'rgba(70,66,74,.16)');
  for (let k = 0; k < 6; k++) { const x = hash(k + 2500) * w, y = bh * (1 + Math.floor(hash(k + 2501) * 6)); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(x, y + 10, 26 + hash(k + 2502) * 30, 8, 0, 0, PI * 2); c.fill(); }
  const g = c.createLinearGradient(0, h * .82, 0, h); g.addColorStop(0, 'rgba(90,80,70,0)'); g.addColorStop(1, 'rgba(90,80,70,.3)'); c.fillStyle = g; c.fillRect(0, h * .82, w, h * .18);
  c.fillStyle = 'rgba(110,140,80,.45)'; for (let k = 0; k < 40; k++) { c.beginPath(); c.arc(hash(k + 2600) * 90, h - hash(k + 2601) * 70, 3 + hash(k + 2602) * 5, 0, PI * 2); c.fill(); }
}, { repeat: [1, 1] }));
// (10/24 사용자 "넘 촌스러워 … 매점 간판·현수막 큰 한글도 작게, 영어도 섞어 세련되게"): 차분한 남색 판에 작은 글자, 별·원색 띠 없음
const signTex = () => TEX.get('sign', () => textTex(512, 256, (c, w, h) => {
  c.fillStyle = '#2f3440'; roundRect(c, 3, 3, w - 6, h - 6, 14); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; roundRect(c, 12, 12, w - 24, h - 24, 9); c.stroke();
  fitText(c, 'BOARD KING PARK', w / 2, h * .4, w * .72, 34, '#f2efe8', { weight: '800' });
  fitText(c, '헬멧 꼭 · HELMET ON', w / 2, h * .68, w * .56, 20, '#c9d4cf', { weight: '800' });
}));
const scoreFront = () => TEX.get('scoreF', () => textTex(512, 320, (c, w, h) => {
  c.fillStyle = '#f1eee6'; roundRect(c, 3, 3, w - 6, h - 6, 16); c.fill(); c.strokeStyle = '#4a4f5c'; c.lineWidth = 4; roundRect(c, 7, 7, w - 14, h - 14, 12); c.stroke();
  fitText(c, 'TRICKS · 오늘의 기술', w / 2, 52, w * .7, 26, '#3a3f4c', { weight: '800' });
  for (let k = 0; k < 3; k++) { c.fillStyle = '#dcd8cf'; roundRect(c, w / 2 + (k - 1) * 140 - 52, 100, 104, 150, 12); c.fill(); c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(w / 2 + (k - 1) * 140 - 40, 175, 80, 3); }
  c.fillStyle = 'rgba(90,80,70,.12)'; for (let k = 0; k < 30; k++) c.fillRect(hash(k + 2700) * w, hash(k + 2701) * h, 3, 2);
}));
// 뒷면: 점수 세 칸 (관찰 자물쇠 단서로 쓸 수 있게 큰 숫자 — 값은 ②가 다시 칠할 수 있게 SCORE에 둠)
export const SCORE = [7, 2, 5];
const scoreBack = () => TEX.get('scoreB|' + SCORE.join(''), () => textTex(512, 320, (c, w, h) => {
  c.fillStyle = '#2f2a48'; roundRect(c, 3, 3, w - 6, h - 6, 20); c.fill();
  fitText(c, '점수', w / 2, 46, w * .5, 30, C.yel, { weight: '800' });
  SCORE.forEach((n, k) => { const x = 95 + k * 160; c.fillStyle = '#fbf6ea'; roundRect(c, x - 62, 92, 124, 170, 16); c.fill(); c.fillStyle = [C.pink, C.mint, C.sky][k]; c.font = '900 130px Jua, Ssurround, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), x, 184); });
}));
const lockerTex = () => TEX.get('locker', () => textTex(256, 512, (c, w, h) => {
  // 칠한 쇠문: 바랜 하늘색, 환기 구멍, 작은 이름표, 손때·긁힘, 아래 녹
  c.fillStyle = '#8fb6d4'; c.fillRect(0, 0, w, h);
  for (let y = 40; y < 120; y += 14) { c.fillStyle = 'rgba(40,60,90,.4)'; roundRect(c, 40, y, w - 80, 7, 3); c.fill(); }
  c.fillStyle = '#eef0ee'; roundRect(c, 70, 150, w - 140, 34, 6); c.fill(); fitText(c, 'LOCKER', w / 2, 167, w - 160, 18, '#3a3f4c', { weight: '800' });
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; for (let k = 0; k < 10; k++) { const x = hash(k + 2800) * w, y = 220 + hash(k + 2801) * 240; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20 + hash(k + 2802) * 30, y + 4); c.stroke(); }
  const g = c.createLinearGradient(0, h * .85, 0, h); g.addColorStop(0, 'rgba(150,100,60,0)'); g.addColorStop(1, 'rgba(150,100,60,.35)'); c.fillStyle = g; c.fillRect(0, h * .85, w, h * .15);
}));
const gachaTex = () => TEX.get('gacha', () => textTex(256, 128, (c, w, h) => {
  c.fillStyle = '#ffffff'; roundRect(c, 4, 4, w - 8, h - 8, 14); c.fill(); c.strokeStyle = C.red; c.lineWidth = 6; roundRect(c, 8, 8, w - 16, h - 16, 11); c.stroke();
  fitText(c, 'CAPSULE', w / 2, h * .42, w * .7, 26, C.red, { weight: '800' }); fitText(c, '캡슐 뽑기', w / 2, h * .74, w * .5, 16, '#2f2a48', { weight: '800' });
}));
const decal = (w, h, t, o) => { const m = mat('#ffffff', { map: t, rim: .08, ...o }).clone(); m.alphaTest = .5; return mesh(new THREE.PlaneGeometry(w, h), m, { cast: false }); };

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
    add(G.ext(shapeOf(outer, [superPts(a - deck + .03, b - deck + .03, e, 112).reverse()]), H - .03, 0, 4), '#c4c2bd', 0, 0, 0, -HP, 0, 0);
    add(G.ext(shapeOf(superPts(a + .03, b + .03, e, 112), [superPts(a - .06, b - .06, e, 112).reverse()]), .09, 0, 4), C.conc3, 0, -.02, 0, -HP, 0, 0);
    add(G.ext(shapeOf(superPts(a + .025, b + .025, e, 112), [hole]), .055, 0, 4), C.deck, 0, H - .055, 0, -HP, 0, 0);
  }));
  // 보울 안: 매끈한 콘크리트 곡면
  const inner = mesh(bowlInner(), mat('#ffffff', { map: bowlTex(), rough: .7, rim: .1 }), { cast: false }); inner.receiveShadow = true; f.add(inner);
  // 코핑: 테두리를 따라 도는 쇠 파이프
  // (10/24 사용자 "보울 허접": 쇠 파이프 대신 수영장식 둥근 콘크리트 코핑 블록 — 블록마다 옅게 다른 색, 이음, 긁힌 자국)
  { const pts = rim.map(([x, z]) => new THREE.Vector3(x, H + .012, z)); const curve = new THREE.CatmullRomCurve3(pts, true), Lc = curve.getLength(), nB = Math.round(Lc / .3);
    f.add(mc('bowl-coping2', ({ add }) => {
      for (let k = 0; k < nB; k++) { const u = (k + .5) / nB, p = curve.getPointAt(u), tg = curve.getTangentAt(u), a = Math.atan2(-tg.z, tg.x);
        add(G.box(Lc / nB - .018, .075, .17, .03), k % 3 === 1 ? '#e1ddd5' : k % 3 ? '#ebe8e1' : '#e5e1da', p.x, H + .03, p.z, 0, a, 0);
        if (hash(k + 800) < .35) add(G.box(.06 + hash(k + 801) * .08, .004, .012, .002), '#6e6878', p.x, H + .069, p.z, 0, a + .2, 0); }
    })); }
  // 코핑 밑 타일 띠 (안쪽 벽, 바깥쪽을 향해 .004 안으로)
  { const g = wallStrip([...rim, rim[0]], H - .17, H - .025, -.008, 1.2); f.add(mesh(g, mat('#ffffff', { map: tileTex(), rough: .5, rim: .1, side: THREE.DoubleSide }), { cast: false })); }
  // 바깥 벽 그래피티: 카메라 쪽(앞·오른쪽) 반 바퀴
  { const N = outer.length;
    // order: start at the right-back, round the right side to the front
    const start = outer.findIndex(p => p[0] > .2 * a && p[1] < 0); const seq = []; for (let k = 0; k < N; k++) { const p = outer[(start + k) % N]; if (p[1] > -.25 * b || p[0] > .2 * a) seq.push(p); else if (seq.length) break; }
    const g = wallStrip(seq.slice().reverse(), .07, H - .03, .008, 2.8);
    f.add(mesh(g, mat('#ffffff', { map: formTex(), rough: .85, rim: .08, side: THREE.DoubleSide }), { cast: false })); }
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

// ── 레일뱅크 펀박스 (2.4 × 1.1, 키 그대로 skb_funbox): 가운데 평평한 덱(.42) 양쪽 경사, 모서리마다 쇠 앵글, 위에서 오른쪽 경사를 따라
// 꺾여 내려가는 빨간 둥근 레일(긁혀 벗겨진 은색 자국, 노랑·검정 줄무늬 기둥), 덱의 왁스 자국과 바퀴 자국, 옆면 가득 그래피티
// (10/24 사용자 "레일뱅크 왤케 허접하냐. 디테일 올려줘")
B.skb_funbox = f => {
  const L = 2.4, Wd = 1.1, Hb = .42, top = .5, sl = Math.atan2(Hb, L / 2 - top), sL = Math.hypot(Hb, L / 2 - top);
  const RZ = Wd / 2 - .16, RH = .24;   // 레일: 앞 가장자리에서 .16 안쪽, 덱 위 높이
  f.add(mc('railbank', ({ add }) => {
    const s = new THREE.Shape(); s.moveTo(-L / 2, 0); s.lineTo(-top, Hb); s.lineTo(top, Hb); s.lineTo(L / 2, 0); s.lineTo(-L / 2, 0);
    add(G.ext(s, Wd, .015, 2), '#cbc8c2', 0, 0, -Wd / 2);
    // 쇠 앵글: 덱 앞뒤 모서리, 경사 앞뒤 모서리, 덱과 경사가 꺾이는 곳 · 경사 끝 쇠판
    for (const z of [-Wd / 2 + .02, Wd / 2 - .02]) {
      add(G.box(top * 2, .03, .05, .008), '#7d8396', 0, Hb + .005, z);
      for (const sx of [-1, 1]) add(G.box(sL, .03, .05, .008), '#7d8396', sx * (top + (L / 2 - top) / 2), Hb / 2 + .005, z, 0, 0, -sx * sl);
    }
    for (const sx of [-1, 1]) { add(G.box(.05, .02, Wd - .02, .006), '#9aa0b2', sx * top, Hb + .006, 0); add(G.box(.16, .012, Wd - .02, .004), '#8a90a3', sx * (L / 2 - .07), .006, 0); for (let k = 0; k < 4; k++) add(G.cyl(.012, .012, .006, 8), '#c9cedb', sx * (L / 2 - .07), .014, -Wd / 2 + .16 + k * .26); }
    // 덱의 왁스 자국(조금 짙은 반들 얼룩) · 바퀴 자국
    for (const [x, z, sx, sz] of [[-.15, .32, .34, .1], [.22, .3, .22, .08], [-.05, -.2, .2, .07]]) add(G.cyl(1, 1, .004, 18), '#a9a6b0', x, Hb + .004, z, 0, 0, 0, [sx, 1, sz]);
    for (const z of [-.12, .05]) add(G.box(top * 2 - .1, .003, .02, .002), '#7c7884', 0, Hb + .005, z, 0, .04, 0);
    // 빨간 레일: 덱 위 평평 → 오른쪽 경사 따라 꺾여 내려감
    const pA = new THREE.Vector3(-top + .06, Hb + RH, RZ), pB = new THREE.Vector3(top, Hb + RH, RZ), pC = new THREE.Vector3(L / 2 - .1, .02 + RH * .9, RZ);
    const rail = new THREE.CurvePath(); rail.add(new THREE.LineCurve3(pA, pB)); rail.add(new THREE.LineCurve3(pB, pC));
    add(new THREE.TubeGeometry(rail, 40, .032, 10, false), '#8b91a0', 0, 0, 0);
    for (const p of [pA, pC]) add(G.sph(.034, 10, 8), '#8b91a0', p.x, p.y, p.z);
    // 벗겨진 은색 자국 (윗면)
    for (let k = 0; k < 9; k++) { const u = k / 8, p = u < .55 ? pA.clone().lerp(pB, u / .55) : pB.clone().lerp(pC, (u - .55) / .45); add(G.box(.05 + hash(k + 880) * .05, .012, .022, .006), '#d9dde6', p.x, p.y + .026, p.z); }
    // 기둥 셋: 노랑·검정 줄무늬
    for (const x of [-top + .12, top - .05, L / 2 - .22]) {
      const y0 = x > top ? Hb * (L / 2 - x) / (L / 2 - top) : Hb, yTop = x > top ? pB.y + (x - top) / (pC.x - top) * (pC.y - pB.y) : Hb + RH, hh = yTop - y0;
      add(G.box(.05, hh, .05, .006), '#a3a8b4', x, y0 + hh / 2, RZ);
      for (let k = 0; k < 3; k++) add(G.box(.052, .02 + hash(x * 7 + k) * .03, .052, .004), '#a0704a', x, y0 + .04 + k * hh * .3, RZ);
      add(G.box(.12, .015, .1, .005), '#7d8396', x, y0 + .008, RZ);
    }
    // 쇠 앵글 녹물·긁힘 (경사 끝 쪽)
    for (const [x, z] of [[-1.0, Wd / 2 - .02], [.95, Wd / 2 - .02], [-.2, -Wd / 2 + .02]]) { add(G.box(.06, .006, .052, .002), '#a0704a', x, Hb * .3 + .02, z); add(G.box(.12, .003, .054, .001), '#d5d9e2', x + .1, Hb * .3 + .02, z); }
  }));
  // 옆면 그래피티 (앞 +z · 뒤 -z, 사다리꼴 모양 그대로)
  const side = (z, ry) => { const s = new THREE.Shape(); s.moveTo(-L / 2 + .04, .02); s.lineTo(-top + .02, Hb - .025); s.lineTo(top - .02, Hb - .025); s.lineTo(L / 2 - .04, .02); s.lineTo(-L / 2 + .04, .02);
    const g = new THREE.ShapeGeometry(s), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + L / 2) / L, uv.getY(i) / Hb);
    f.add(put(mesh(g, mat('#ffffff', { map: aggTex(), rough: .9, rim: .08 }), { cast: false }), 0, 0, z, 0, ry, 0)); };
  side(Wd / 2 + .017, 0); side(-Wd / 2 - .017, PI);
  f.spot('on', null, .15, Hb + .03, -.2, { maxH: .35, label: '펀박스 위', scale: 1 });
  f.spot('under', null, -.15, Hb + .03, RZ - .02, { maxH: .2, label: '플랫 레일 밑', scale: 1 });
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
    f.add(put(mesh(g, mat('#ffffff', { map: plySideTex(), rough: .8, rim: .08 }), { cast: false }), 0, 0, Wd / 2 + .004)); }
  // 오른쪽 덱 위 보드 (부품): 코핑으로 미끄러져 램프를 타고 내려가 가운데에서 멈춤
  const board = new THREE.Group(); put(board, L / 2 - .2, H + .07, .2); f.add(board);
  board.add(mc('ramp-board', ({ add }) => {
    add(G.box(.62, .03, .2, .015), '#3f4350', 0, .04, 0); add(G.box(.5, .005, .16, .002), '#d8b48c', 0, .058, 0);
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
    for (let k = 0; k < 5; k++) add(G.box(deckW / 5 - .004, H - .1, .02, .006), k % 2 ? '#e8e4da' : '#8a9aa6', -deckW / 2 + deckW / 10 + k * deckW / 5, -(H - .1) / 2, 0);
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
  const M = [[-.24, '#c9746a'], [.24, '#8fb7aa']];
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
const DECKS = [['#d9b48a', '#4a4f5c'], ['#3b3f4c', '#e8e4da'], ['#a9c3b4', '#3b3f4c'], ['#c7b8d8', '#4a4f5c']];
B.skb_spinrack = f => {
  f.add(mc('spin-base', ({ add }) => { add(G.cyl(.36, .4, .08, 24), '#3a3450', 0, .04, 0); add(G.cyl(.3, .3, .02, 24), '#6d7590', 0, .09, 0); }));
  const top = new THREE.Group(); put(top, 0, .1, 0); f.add(top);
  top.add(mc('spin-top', ({ add }) => {
    add(G.cyl(.04, .04, 1.1, 12), C.steel, 0, .55, 0); add(G.cyl(.26, .26, .04, 20), '#ffffff', 0, .2, 0); add(G.cyl(.18, .18, .03, 20), '#ffffff', 0, .99, 0);
    add(G.box(.36, .2, .03, .02), '#e8e4da', 0, 1.18, 0); add(G.box(.28, .03, .032, .006), '#4a4f5c', 0, 1.18, .002);
    DECKS.forEach(([c1, c2], k) => { const a = k * HP + PI / 4, x = Math.sin(a) * .2, z = Math.cos(a) * .2;
      add(G.box(.2, .8, .03, .014), c1, x, .62, z, 0, a, 0); add(G.box(.2, .05, .008, .004), c2, x + Math.sin(a) * .02, .7, z + Math.cos(a) * .02, 0, a, 0); add(G.box(.2, .06, .008, .004), c2, x + Math.sin(a) * .018, .38, z + Math.cos(a) * .018, 0, a, 0);
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

// ── 블록 벽 (2.4 × .22, 높이 1.55, 키 그대로 skb_graffiti — 흑백판에서 색이 돌아오는 가구): 시멘트 블록 벽, 위 콘크리트 갓돌, 양 끝 기둥.
// (10/24 사용자 "그래피티는 그냥 빼고 질감으로": 벽화·글자 없이 블록 결·물 자국·백화·이끼) 발밑엔 기대 둔 보드와 헬멧, 물병
B.skb_graffiti = f => {
  const L = 2.4, T = .22, H = 1.55;
  f.add(mc('blockwall', ({ add }) => {
    add(G.box(L, H, T, .02), '#b9b5ae', 0, H / 2, 0);
    add(G.box(L + .08, .08, T + .08, .02), '#d4d0c8', 0, H + .035, 0);
    for (const sx of [-1, 1]) add(G.box(.28, H + .05, T + .08, .02), '#c8c4bc', sx * (L / 2 - .1), (H + .05) / 2, 0);
    add(G.box(L + .04, .08, T + .04, .02), '#9e9a93', 0, .04, 0);
    // 갓돌 깨진 귀퉁이 · 쓸린 모서리
    add(G.box(.12, .04, .1, .01), '#a8a49c', -.62, H + .07, T / 2 + .02); add(G.box(.3, .02, .02, .005), '#8e8a84', .4, H + .005, T / 2 + .045);
    // 발밑: 벽에 기대 둔 보드 · 헬멧 · 물병
    add(G.box(.2, .66, .03, .015), '#3d3a48', .78, .34, T / 2 + .08, -.18, 0, 0); add(G.box(.16, .5, .006, .003), '#e8e3d8', .78, .36, T / 2 + .1, -.18, 0, 0);
    for (const y of [.12, .58]) for (const s2 of [-1, 1]) add(G.cyl(.026, .026, .03, 10), '#f2ede2', .78 + s2 * .06, y, T / 2 + .14 - (y - .12) * .18, 0, 0, HP);
    add(new THREE.SphereGeometry(.13, 16, 8, 0, PI * 2, 0, HP), '#7fa89a', .32, .02, T / 2 + .22, 0, 0, 0, [1, .9, 1.15]);
    add(G.cyl(.035, .035, .17, 12), '#d9e4ec', .52, .085, T / 2 + .3); add(G.cyl(.022, .026, .03, 10), '#5a6070', .52, .185, T / 2 + .3);
  }));
  const m = mesh(new THREE.PlaneGeometry(L - .5, H - .14), mat('#ffffff', { map: blockTex(), rough: .9, rim: .06 }), { cast: false });
  put(m, 0, H / 2 + .04, T / 2 + .006); f.add(m);
  f.spot('on', null, -.75, H + .08, 0, { maxH: .3, label: '그래피티 벽 위', scale: .8 });
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
  // 리벳 줄과 거기서 흘러내린 녹물, 찌그러진 자국
  for (let x = 16; x < w; x += 64) { c.fillStyle = 'rgba(70,80,80,.4)'; c.beginPath(); c.arc(x, 12, 3, 0, PI * 2); c.fill();
    if (hash(x + 970) < .55) { const g = c.createLinearGradient(0, 14, 0, 14 + 60 + hash(x + 971) * 80); g.addColorStop(0, 'rgba(160,96,58,.5)'); g.addColorStop(1, 'rgba(160,96,58,0)'); c.fillStyle = g; c.fillRect(x - 3, 14, 6, 140); } }
  for (let n = 0; n < 2; n++) { const x = hash(n + 980) * w, y = 60 + hash(n + 981) * 120, g = c.createRadialGradient(x, y, 2, x, y, 26); g.addColorStop(0, 'rgba(30,40,40,.2)'); g.addColorStop(1, 'rgba(30,40,40,0)'); c.fillStyle = g; c.fillRect(x - 30, y - 30, 60, 60); }
}, { repeat: [1 / 1.4, 1 / .7] }));
const kioskSign = () => TEX.get('kioskSign', () => textTex(512, 128, (c, w, h) => {
  c.fillStyle = '#f2efe6'; roundRect(c, 3, 3, w - 6, h - 6, 10); c.fill(); c.strokeStyle = '#4a4f5c'; c.lineWidth = 3; roundRect(c, 9, 9, w - 18, h - 18, 7); c.stroke();
  fitText(c, 'SNACK BAR · 매점', w / 2, h / 2 + 2, w * .66, 32, '#3a3f4c', { weight: '800' });
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
  const MINT = '#9fc2b5', MINT2 = '#82a99b', inside = '#4c5a6a';
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
    for (let k = 0; k < 5; k++) add(G.box((HX1 - HX0 + .08) / 5 - .01, .1, .04, .006), k % 2 ? '#efebe2' : '#c98f6a', -(HX1 - HX0 + .08) / 2 + (HX1 - HX0 + .08) / 10 + k * (HX1 - HX0 + .08) / 5, -.06, .004);
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

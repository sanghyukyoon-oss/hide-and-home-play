// 36판 새 안 '밤의 문구점' stationery (⑨ 10/23 — 상가 장 새 맵, _handoff/redo-34to70-order-1023.md; 판 36 · 숨은그림 · 밤 · 삐딱이).
// 동네 문구점 한 채를 앞면만 잘라 낸 실루엣 단면 + 가게 앞 보도(연석 턱) + 아래 찻길 조금 + 두꺼운 층진 둥근 섬 받침.
// 모티프 다섯이 판을 이끌고, 작은 생활 디테일은 벽·바닥·가장자리에:
//   ① 가게 앞 뽑기 기계 줄(st_gacha)  ② 불량식품 회전 진열대(st_snackrack)  ③ 가게 앞 옛날 오락기 한 대(st_arcade)
//   ④ 노트·스티커 벽(st_stickerwall)과 크레파스 진열대(st_crayonrack — 끝 장면이 그 앞에서)  ⑤ 반쯤 내린 창고 셔터(st_shutter)
// 거대 소품이 건물의 일부: 가게 앞 모서리 기둥은 거대 연필, 지붕 간판 옆엔 거대 크레파스.
// 장치 연쇄(설계서 36, gpt-chains.js CHAINS.stationery): 가로등 스위치(st_streetlamp 0) → 셔터에 숫자 그림자 = 계산대 밑 금고(st_safe) 비밀번호
//   → 금고 속 레버 손잡이 → 셔터 레버(st_shutterlever 0): 톱니가 돌고 셔터가 말려 올라가며(st_shutter 0) → 창고 안 열쇠 트레이가 쑥.
// 판 안 장치는 모두 '터치하면 저절로 끝까지'(설계서 원칙 8). 글자는 게임 폰트(gpt-paper fitText, 한·영).
// 좌표: 방 7 × 5.5 m(가운데 원점, 바닥 y 0), 카메라는 +x +z 쪽에서. 가게 x -3.5..0.95 · z -2.75..0.45, 창고 칸 x 0.95..2.8 · z -2.93..-1.0,
// 보도 z 0.45..2.75, 연석 z 2.75..2.93(턱 .15), 찻길 z 2.93..3.9.
import * as THREE from 'three';
import { put, grp, mat, mesh, geo, canvasTex, texCache, shade, roundRect, fadeDisc } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { fitText, textTex, paperFill, paperSheet } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';

const PI = Math.PI, HP = PI / 2;
const B = {};
// 큰 면은 순하게(크림 벽지·세이지 판벽·장밋빛 회색 보도블록·회청 찻길), 쨍한 색은 작은 물건에만
const C = {
  wall: '#f6ecd9', wall2: '#ecdcc0', wain: '#9fc3ae', wainD: '#7ea591', trim: '#fff8ea', cut: '#efe2cb', ext: '#e7d9c2',
  roof: '#7d93a3', roofD: '#5f7584', tile: '#d9d4bf', tile2: '#c3ccb5', pave: '#d5c4b8', paveD: '#b9a598', curb: '#d9d6cf', curbD: '#b8b3aa',
  asph: '#5b6070', asphD: '#4a4e5c', stone: '#c3b6a5', stoneD: '#a49582', earth: '#9a7556', earthD: '#7a5a43', brick: '#c98d6f', brickD: '#a86f55',
  wood: '#d9a66b', woodD: '#9c6a42', woodL: '#ecc998', ink: '#4a3528', metal: '#c7ccd4', metalD: '#9ea6b1', pole: '#4c606b', poleD: '#3a4b55',
  red: '#e8604c', blue: '#4f86c6', yel: '#ffcf48', grn: '#6cbf6a', pink: '#f39ab4', purp: '#9b7fd0', orng: '#f39a3d', navy: '#3d4a7a', mint: '#8fd3c4',
  cream: '#fff6e4', paper: '#fbf3e0', leaf: '#6cb86a', leaf2: '#4f9c5a', warm: '#ffe6a0', cat: '#8f9aab', catD: '#6f798a',
};
const TC = texCache();
const rnd = s => { let a = s * 9301 + 49297; return () => ((a = (a * 9301 + 49297) % 233280) / 233280); };
// 새 글자는 한·영을 같이 (영어 화면에선 fitText가 tr로)
const WORDS = {
  '몽글문구': 'Mongle Stationery', '학용품 · 완구 · 팬시': 'School · Toys · Fancy', '크레파스': 'Crayons', '24색': '24 colors', '12색': '12 colors',
  '불량식품': 'Penny Candy', '100원': '100 won', '뽑기': 'Capsules', '500원': '500 won', '오락': 'Arcade', '까꿍': 'Peekaboo',
  '쫀드기': 'Chewy Strip', '아폴로': 'Apollo', '밭두렁': 'Rice Puffs', '꾀돌이': 'Smarty', '쥐포': 'Fish Jerky', '별사탕': 'Star Candy',
  '공책': 'Notebook', '종이인형': 'Paper Dolls', '딱지': 'Ddakji', '스티커': 'Stickers', '신학기 준비물': 'Back to School', '학용품 도매': 'School Supplies',
  '공책 100권': '100 Notebooks', '태권도': 'Taekwondo', '피아노': 'Piano', '원생 모집': 'Join us', '외상 사절': 'No credit', '1등': '1st',
  '오늘 일찍 닫아요': 'Closing early', '고장': 'Broken', '연필': 'Pencils', '지우개': 'Erasers',
};
for (const k in WORDS) if (EN[k] == null) EN[k] = WORDS[k];

// ── 그림 (캔버스) ───────────────────────────────────────────────────────────────────────────────────────────
// (같은 그림을 면마다 다른 반복으로: 복제본에 — 원본 하나를 고치면 마지막 면의 반복이 모든 면에 걸림)
const rep = (t0, sx, sy) => { const t = t0.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(sx, sy); return t; };
const T = (key, w, h, draw) => TC.get('st-' + key, () => canvasTex(w, h, draw));
const TT = (key, w, h, draw) => TC.get('st-' + key, () => textTex(w, h, draw));
// 보도블록: 장밋빛·회색 두 톤, 엇갈린 줄 (1.2 m 한 장)
const paveTex = () => T('pave', 256, 256, (c, W, H) => {
  c.fillStyle = C.paveD; c.fillRect(0, 0, W, H); const r = rnd(3);
  for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) { const ox = (y % 2) * 32; c.fillStyle = r() < .3 ? '#c9b8b0' : r() < .5 ? '#d9c9bd' : C.pave; c.fillRect(x * 64 + ox + 2, y * 32 + 2, 60, 28); }
  c.fillStyle = 'rgba(80,60,50,.07)'; for (let i = 0; i < 260; i++) c.fillRect(r() * W, r() * H, 2, 2);
  c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 40; i++) c.fillRect(r() * W, r() * H, 10, 2);
});
// 가게 바닥: 작은 정사각 타일 두 색 바둑, 닳은 얼룩 (1 m 한 장)
const tileTex = () => T('tile', 256, 256, (c, W, H) => {
  const r = rnd(5);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? C.tile2 : C.tile; c.fillRect(x * 32, y * 32, 32, 32); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x * 32 + 4, y * 32 + 4, 10, 2); }
  c.fillStyle = '#a9ab98'; for (let i = 0; i <= 8; i++) { c.fillRect(i * 32 - 1, 0, 2, H); c.fillRect(0, i * 32 - 1, W, 2); }
  for (let i = 0; i < 7; i++) { const x = r() * W, y = r() * H, g = c.createRadialGradient(x, y, 0, x, y, 30); g.addColorStop(0, 'rgba(90,80,60,.10)'); g.addColorStop(1, 'rgba(90,80,60,0)'); c.fillStyle = g; c.fillRect(x - 30, y - 30, 60, 60); }
});
// 찻길: 회청 아스팔트에 잔 점·금 (2 m 한 장)
const asphTex = () => T('asph', 256, 256, (c, W, H) => {
  c.fillStyle = C.asph; c.fillRect(0, 0, W, H); const r = rnd(7);
  for (let i = 0; i < 2400; i++) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.12)'; c.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
  c.strokeStyle = 'rgba(30,30,40,.4)'; c.lineWidth = 1.2; for (let i = 0; i < 4; i++) { let x = r() * W, y = r() * H; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - .5) * 30; y += (r() - .5) * 30; c.lineTo(x, y); } c.stroke(); }
});
// 벽지: 크림에 빛바랜 작은 꽃점과 가는 세로 줄 (1 m 한 장)
const paperTex = () => T('wallp', 256, 256, (c, W, H) => {
  c.fillStyle = C.wall; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(200,170,130,.16)'; for (let x = 0; x < W; x += 32) c.fillRect(x + 14, 0, 4, H);
  for (let y = 16; y < H; y += 32) for (let x = 0; x < W; x += 32) { const ox = (y / 32 % 2) * 16; c.fillStyle = 'rgba(214,140,120,.30)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x + ox + Math.cos(k * HP) * 3, y + Math.sin(k * HP) * 3, 2.2, 0, 7); c.fill(); } }
  c.fillStyle = 'rgba(120,90,60,.06)'; c.fillRect(0, H - 20, W, 20);
});
// 판벽: 세이지 세로 판, 홈과 결 (1 m 한 장)
const wainTex = () => T('wain', 256, 256, (c, W, H) => {
  const r = rnd(9);
  for (let i = 0; i < 8; i++) { c.fillStyle = shade(C.wain, (r() - .5) * .06); c.fillRect(i * 32, 0, 32, H); c.fillStyle = C.wainD; c.fillRect(i * 32, 0, 3, H); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(i * 32 + 4, 0, 2, H); }
  c.strokeStyle = 'rgba(60,80,70,.12)'; for (let i = 0; i < 20; i++) { const x = r() * W; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 4, H * .3, x - 4, H * .7, x + 2, H); c.stroke(); }
});
// 붉은 벽돌 (1 m 한 장)
const brickTex = () => T('brick', 256, 256, (c, W, H) => {
  c.fillStyle = '#e4d3c0'; c.fillRect(0, 0, W, H); const r = rnd(13);
  for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) { const ox = (y % 2) * 32; c.fillStyle = shade(C.brick, (r() - .5) * .14); c.fillRect(x * 64 + ox + 3, y * 32 + 3, 58, 26); }
  c.fillStyle = 'rgba(60,30,20,.08)'; for (let i = 0; i < 300; i++) c.fillRect(r() * W, r() * H, 2, 2);
});
// 철제 셔터: 가로 골, 위 테 밝게, 녹 몇 줄 (1 m 한 장)
const shutterTex = () => T('shutter', 256, 256, (c, W, H) => {
  const r = rnd(17);
  for (let y = 0; y < H; y += 16) { const g = c.createLinearGradient(0, y, 0, y + 16); g.addColorStop(0, '#e3e7ec'); g.addColorStop(.5, C.metal); g.addColorStop(1, C.metalD); c.fillStyle = g; c.fillRect(0, y, W, 16); }
  for (let i = 0; i < 5; i++) { const x = r() * W; c.fillStyle = 'rgba(170,110,70,.18)'; c.fillRect(x, r() * H * .5, 3, 40 + r() * 80); }
});
// 구멍판(타공판) (0.8 m 한 장)
const pegTex = () => T('peg', 256, 256, (c, W, H) => {
  c.fillStyle = '#ead9bb'; c.fillRect(0, 0, W, H); c.fillStyle = '#b89c74';
  for (let y = 8; y < H; y += 21) for (let x = 8; x < W; x += 21) { c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill(); }
});
// 밤 창 유리: 남색, 건너편 지붕 실루엣과 별
const nightGlass = () => T('nglass', 128, 128, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b3770'); g.addColorStop(1, '#5a5aa0'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#fff3b8'; c.beginPath(); c.arc(92, 30, 12, 0, 7); c.fill(); c.fillStyle = '#2b3770'; c.beginPath(); c.arc(99, 25, 11, 0, 7); c.fill();
  c.fillStyle = '#ffffff'; for (const [x, y] of [[20, 20], [44, 34], [70, 14], [30, 52], [110, 58]]) c.fillRect(x, y, 2, 2);
  c.fillStyle = '#20284f'; c.fillRect(0, 90, 50, 38); c.fillRect(46, 80, 40, 48); c.fillRect(84, 96, 44, 32);
  c.fillStyle = '#ffd98a'; c.fillRect(10, 100, 8, 8); c.fillRect(60, 92, 8, 8); c.fillRect(96, 106, 8, 8);
});
// 지붕 간판: 몽글문구
const signTex = () => TT('sign', 1024, 288, (c, W, H) => {
  c.fillStyle = C.cream; c.fillRect(0, 0, W, H); c.fillStyle = C.red; c.fillRect(0, 0, W, 14); c.fillRect(0, H - 14, W, 14);
  c.fillStyle = C.blue; for (let i = 0; i < 6; i++) c.fillRect(24 + i * 14, 30, 8, 8);
  fitText(c, '몽글문구', W / 2, H * .43, W * .8, 96, C.red, { weight: 'bold', stroke: '#ffffff', sw: 8 });
  fitText(c, '학용품 · 완구 · 팬시', W / 2, H * .8, W * .7, 30, C.navy);
});
// 크레파스 상자 앞면 (색 띠 + 글자), 색마다 한 장
const crayonBoxTex = (k, col, n) => TT('cbox' + k, 128, 176, (c, W, H) => {
  c.fillStyle = col; c.fillRect(0, 0, W, H); c.fillStyle = C.cream; roundRect(c, 6, 6, W - 12, 40, 8); c.fill();
  fitText(c, '크레파스', W / 2, 26, W - 24, 18, C.ink, { weight: 'bold' });
  const cs = ['#e8604c', '#f39a3d', '#ffcf48', '#6cbf6a', '#4f86c6', '#9b7fd0', '#f39ab4', '#7a5a43'];
  for (let i = 0; i < 8; i++) { c.fillStyle = cs[i]; c.fillRect(12 + i * 13, 62, 10, 70); c.beginPath(); c.moveTo(12 + i * 13, 62); c.lineTo(17 + i * 13, 50); c.lineTo(22 + i * 13, 62); c.fill(); }
  c.fillStyle = C.cream; roundRect(c, 30, 142, W - 60, 26, 6); c.fill(); fitText(c, n, W / 2, 155, W - 70, 16, C.ink);
});
// 불량식품 봉지 (이름·색)
const SNACKS = [['쫀드기', '#f39a3d'], ['아폴로', '#4f86c6'], ['밭두렁', '#ffcf48'], ['꾀돌이', '#e8604c'], ['쥐포', '#c79a6a'], ['별사탕', '#f39ab4']];
const snackTex = i => TT('snack' + i, 128, 160, (c, W, H) => {
  const [n, col] = SNACKS[i % SNACKS.length];
  c.fillStyle = col; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x < W; x += 10) c.fillRect(x, 0, 4, 10);
  c.fillStyle = C.cream; c.beginPath(); c.ellipse(W / 2, H * .5, W * .42, H * .24, 0, 0, 7); c.fill();
  fitText(c, n, W / 2, H * .5, W * .72, 30, C.ink, { weight: 'bold' });
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(W * .78, H * .82, 13, 0, 7); c.fill(); fitText(c, '100원', W * .78, H * .82, 22, 9, C.red);
});
// 공책 표지·스티커 판·딱지·종이인형
const coverTex = i => TT('cover' + i, 128, 168, (c, W, H) => {
  const cols = ['#9fd3e0', '#f7c6d0', '#cfe6b8', '#ffe2a0', '#d5c8f0'], col = cols[i % 5];
  c.fillStyle = col; c.fillRect(0, 0, W, H); c.fillStyle = C.cream; c.fillRect(10, 112, W - 20, 40);
  c.strokeStyle = '#b8a688'; c.lineWidth = 1.5; for (let y = 124; y < 152; y += 9) { c.beginPath(); c.moveTo(16, y); c.lineTo(W - 16, y); c.stroke(); }
  fitText(c, '공책', W / 2, 98, W - 30, 20, C.ink, { weight: 'bold' });
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(W / 2, 48, 30, 0, 7); c.fill(); c.fillStyle = col;
  if (i % 3 === 0) { c.fillStyle = C.yel; c.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 11 : 24, a = -HP + k * PI / 5; c.lineTo(W / 2 + Math.cos(a) * rr, 48 + Math.sin(a) * rr); } c.fill(); }
  else if (i % 3 === 1) { c.fillStyle = '#8f9aab'; c.beginPath(); c.arc(W / 2, 52, 18, 0, 7); c.fill(); c.beginPath(); c.moveTo(W / 2 - 16, 44); c.lineTo(W / 2 - 12, 26); c.lineTo(W / 2 - 3, 38); c.fill(); c.beginPath(); c.moveTo(W / 2 + 16, 44); c.lineTo(W / 2 + 12, 26); c.lineTo(W / 2 + 3, 38); c.fill(); c.fillStyle = C.ink; c.fillRect(W / 2 - 8, 50, 4, 4); c.fillRect(W / 2 + 4, 50, 4, 4); }
  else { c.fillStyle = C.red; c.beginPath(); c.arc(W / 2 - 8, 44, 10, 0, 7); c.arc(W / 2 + 8, 44, 10, 0, 7); c.fill(); c.beginPath(); c.moveTo(W / 2 - 18, 48); c.lineTo(W / 2, 68); c.lineTo(W / 2 + 18, 48); c.fill(); }
});
const stickerTex = i => TT('stk' + i, 128, 168, (c, W, H) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(160,200,230,.25)'; c.fillRect(0, 0, W, H);
  const cs = [C.red, C.yel, C.blue, C.grn, C.pink, C.purp, C.orng]; const r = rnd(20 + i);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 3; x++) { const cx = 24 + x * 40, cy = 34 + y * 36; c.fillStyle = cs[Math.floor(r() * cs.length)];
    if ((x + y + i) % 3 === 0) { c.beginPath(); c.arc(cx, cy, 13, 0, 7); c.fill(); c.fillStyle = C.ink; c.fillRect(cx - 6, cy - 3, 3, 3); c.fillRect(cx + 3, cy - 3, 3, 3); }
    else if ((x + y + i) % 3 === 1) { c.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 6 : 14, a = -HP + k * PI / 5; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.fill(); }
    else { c.beginPath(); c.arc(cx - 6, cy - 3, 8, 0, 7); c.arc(cx + 6, cy - 3, 8, 0, 7); c.fill(); c.beginPath(); c.moveTo(cx - 13, cy); c.lineTo(cx, cy + 13); c.lineTo(cx + 13, cy); c.fill(); } }
  c.fillStyle = C.ink; c.font = 'bold 12px sans-serif'; fitText(c, '스티커', W / 2, H - 12, W - 20, 13, C.ink);
});
const dollTex = () => TT('doll', 128, 168, (c, W, H) => {
  paperFill(c, W, H, '#fff4f7', 4); c.strokeStyle = '#d7a0b4'; c.setLineDash([4, 3]); c.lineWidth = 1.5;
  for (const [x, dress] of [[36, C.pink], [92, C.mint]]) { c.fillStyle = '#ffe4d0'; c.beginPath(); c.arc(x, 42, 13, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#6b4b3a'; c.beginPath(); c.arc(x, 36, 13, PI, 0); c.fill();
    c.fillStyle = dress; c.beginPath(); c.moveTo(x - 8, 56); c.lineTo(x + 8, 56); c.lineTo(x + 20, 112); c.lineTo(x - 20, 112); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#ffe4d0'; c.fillRect(x - 8, 112, 5, 18); c.fillRect(x + 3, 112, 5, 18); }
  c.setLineDash([]); fitText(c, '종이인형', W / 2, H - 16, W - 20, 16, '#c0587a', { weight: 'bold' });
});
const ddakjiTex = () => T('ddakji', 128, 128, (c, W, H) => {
  c.fillStyle = C.blue; c.fillRect(0, 0, W, H); c.fillStyle = C.red; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, H); c.lineTo(W, 0); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, H); c.moveTo(W, 0); c.lineTo(0, H); c.stroke(); c.strokeRect(10, 10, W - 20, H - 20);
});
// 뽑기 창: 알록달록 캡슐이 가득
const gachaTex = k => T('gacha' + k, 128, 128, (c, W, H) => {
  c.fillStyle = ['#dff1f7', '#fdeef3', '#f2f7dc'][k]; c.fillRect(0, 0, W, H); const r = rnd(30 + k);
  const cs = [C.red, C.yel, C.blue, C.grn, C.pink, C.purp, C.orng];
  for (let i = 0; i < 22; i++) { const x = 14 + r() * 100, y = 30 + r() * 92, rr = 12 + r() * 3, col = cs[Math.floor(r() * cs.length)];
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x, y, rr, PI * (r() < .5 ? 0 : 1), PI * (r() < .5 ? 1 : 2)); c.fill();
    c.strokeStyle = 'rgba(70,50,40,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, rr, 0, 7); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(10, 6, 14, H - 12);
});
const plateTex = (key, word, bg, fg, sub) => TT('plate' + key, 256, 112, (c, W, H) => {
  c.fillStyle = bg; roundRect(c, 0, 0, W, H, 18); c.fill(); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(10, 8, W - 20, 6);
  fitText(c, word, W / 2, sub ? H * .4 : H / 2, W * .82, sub ? 54 : 64, fg, { weight: 'bold' });
  if (sub) fitText(c, sub, W / 2, H * .8, W * .7, 26, fg);
});
// 오락기 화면: 픽셀 우주선 게임 · 반짝 화면
const screenTex = flash => T('scr' + (flash ? 1 : 0), 128, 96, (c, W, H) => {
  c.fillStyle = flash ? '#fff2a8' : '#14204a'; c.fillRect(0, 0, W, H);
  if (flash) { fitText(c, '1등', W / 2, H * .42, W * .6, 34, C.red, { weight: 'bold' }); c.fillStyle = C.orng; for (let i = 0; i < 12; i++) { const a = i * PI / 6; c.fillRect(W / 2 + Math.cos(a) * 46 - 2, H * .42 + Math.sin(a) * 34 - 2, 4, 4); } return; }
  c.fillStyle = '#ffffff'; const r = rnd(41); for (let i = 0; i < 30; i++) c.fillRect(r() * W, r() * H, 1.5, 1.5);
  const px = (x, y, rows, col) => { c.fillStyle = col; rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') c.fillRect(x + i * 3, y + j * 3, 3, 3); })); };
  const inv = ['..#...#..', '...###...', '..#####..', '.##.#.##.', '#########', '#.#...#.#'];
  for (let i = 0; i < 4; i++) px(10 + i * 28, 12, inv, ['#7cf0ff', '#ff8fc8', '#b4f07c', '#ffd27a'][i]);
  px(52, 72, ['....#....', '...###...', '.#######.', '#########'], '#ffe14d');
  c.fillStyle = '#ffffff'; c.fillRect(64, 56, 2, 8);
});
const marqueeTex = () => TT('marq', 256, 80, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#ff8fc8'); g.addColorStop(1, '#ffb36b'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#fff6c8'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(10 + i * 18, 8, 3, 0, 7); c.arc(10 + i * 18, H - 8, 3, 0, 7); c.fill(); }
  fitText(c, '오락', W / 2, H / 2, W * .6, 44, '#ffffff', { weight: 'bold', stroke: '#c0457a', sw: 7 });
});
const flipTex = back => TT('flip' + (back ? 1 : 0), 256, 160, (c, W, H) => {
  if (!back) { c.fillStyle = C.cream; roundRect(c, 0, 0, W, H, 20); c.fill(); c.strokeStyle = C.grn; c.lineWidth = 10; roundRect(c, 8, 8, W - 16, H - 16, 14); c.stroke();
    fitText(c, '영업 중', W / 2, H / 2, W * .72, 62, '#2e7a4a', { weight: 'bold' }); return; }
  paperFill(c, W, H, '#f3ead6', 8); c.strokeStyle = '#7a8a9a'; c.lineWidth = 4; c.strokeRect(10, 10, W - 20, H - 20);
  fitText(c, '까꿍', W / 2, H * .45, W * .6, 58, '#e8604c', { weight: 'bold' });
  c.strokeStyle = C.blue; c.lineWidth = 3; c.beginPath(); c.arc(W * .82, H * .72, 14, 0, 7); c.stroke(); c.fillStyle = C.blue; c.fillRect(W * .78, H * .68, 3, 3); c.fillRect(W * .84, H * .68, 3, 3);
  c.beginPath(); c.arc(W * .82, H * .74, 6, .2, PI - .2); c.stroke();
});
const posterTex = (k, title, lines, col) => TT('post' + k, 192, 256, (c, W, H) => {
  paperFill(c, W, H, C.paper, 11 + k); c.fillStyle = col; c.fillRect(10, 10, W - 20, 54);
  fitText(c, title, W / 2, 37, W - 36, 30, '#ffffff', { weight: 'bold' });
  lines.forEach((t, i) => fitText(c, t, W / 2, 96 + i * 34, W - 40, 22, C.ink));
});
const glassCaseTex = () => T('gcase', 256, 112, (c, W, H) => {
  c.fillStyle = '#e8f3f2'; c.fillRect(0, 0, W, H); const r = rnd(51);
  for (let i = 0; i < 18; i++) { c.fillStyle = [C.red, C.blue, C.grn, C.yel, C.pink][i % 5]; c.beginPath(); c.arc(16 + r() * 100, 30 + r() * 70, 6, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(14 + r() * 100, 28 + r() * 70, 3, 3); }
  for (let i = 0; i < 6; i++) { c.fillStyle = ['#ffffff', '#ffd6e2', '#d6ecff'][i % 3]; c.fillRect(132 + (i % 3) * 38, 34 + Math.floor(i / 3) * 34, 30, 20); c.fillStyle = C.blue; c.fillRect(132 + (i % 3) * 38, 40 + Math.floor(i / 3) * 34, 30, 6); }
  c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(0, 6, W, 6);
});
const boxTex = (k, word) => TT('box' + k, 192, 128, (c, W, H) => {
  c.fillStyle = '#d7b07c'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(120,80,40,.15)'; for (let x = 0; x < W; x += 6) c.fillRect(x, 0, 2, H);
  c.fillStyle = '#c69c64'; c.fillRect(0, H / 2 - 9, W, 18);
  fitText(c, word, W / 2, H * .28, W * .8, 28, '#7a4a28', { weight: 'bold' });
});
const radioTex = () => T('radio', 128, 64, (c, W, H) => {
  c.fillStyle = '#e9e0c8'; c.fillRect(0, 0, W, H); c.fillStyle = '#5a4a3a'; for (let y = 8; y < H - 8; y += 6) for (let x = 8; x < 60; x += 6) c.fillRect(x, y, 3, 3);
  c.fillStyle = '#fff6d8'; c.fillRect(70, 14, 50, 22); c.fillStyle = C.red; c.fillRect(88, 14, 2, 22); c.fillStyle = '#5a4a3a'; for (let x = 74; x < 118; x += 6) c.fillRect(x, 30, 1, 6);
});
// 셔터 위 숫자 그림자: 가로등 빛 웅덩이 속 진한 숫자 (판 비밀번호 — 시각처럼 9:35)
function drawShadow(c, code) {
  c.clearRect(0, 0, 512, 256);
  const g = c.createRadialGradient(256, 128, 20, 256, 128, 250); g.addColorStop(0, 'rgba(255,236,170,.95)'); g.addColorStop(.6, 'rgba(255,226,150,.6)'); g.addColorStop(1, 'rgba(255,220,140,0)');
  c.fillStyle = g; c.fillRect(0, 0, 512, 256);
  const txt = code.length === 3 ? code[0] + ':' + code.slice(1) : code;
  c.save(); c.translate(256, 132); c.transform(1, 0, -.12, 1, 0, 0); c.font = 'bold 128px Ssurround, Jua, "Apple SD Gothic Neo", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(70,52,40,.86)'; c.fillText(txt, 0, 0); c.restore();
  c.fillStyle = 'rgba(70,52,40,.55)'; c.fillRect(120, 40, 272, 7); c.fillRect(120, 214, 272, 7);
}

// ── 2D 모양 · 섬 ───────────────────────────────────────────────────────────────────────────────────────────
const rrect = (P, x0, y0, x1, y1, r) => {
  const [a, b, c, d] = Array.isArray(r) ? r : [r, r, r, r];
  P.moveTo(x0 + a, y0); P.lineTo(x1 - b, y0); if (b) P.absarc(x1 - b, y0 + b, b, -HP, 0, false);
  P.lineTo(x1, y1 - c); if (c) P.absarc(x1 - c, y1 - c, c, 0, HP, false);
  P.lineTo(x0 + d, y1); if (d) P.absarc(x0 + d, y1 - d, d, HP, PI, false);
  P.lineTo(x0, y0 + a); if (a) P.absarc(x0 + a, y0 + a, a, PI, PI * 1.5, false);
  return P;
};
const ext = (shape, depth, curve = 12) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: curve });
// 섬: 둥근 네모, (x, -z)로 그려 눕힘 — 앞(+z)이 아래쪽 y
const IS = { x0: -3.95, x1: 3.95, z0: -3.3, z1: 3.9, r: .9 }, CURB_Z = 2.93;
const island = (i = 0, zA = IS.z0, zB = IS.z1, rb = IS.r, rf = IS.r) => rrect(new THREE.Shape(), IS.x0 + i, -zB + i, IS.x1 - i, -zA - i, [Math.max(0, rf - i), Math.max(0, rf - i), Math.max(0, rb - i), Math.max(0, rb - i)]);
// 둘레 따라 점 (돌 쌓기): [x, z, 바깥 방향 각]
function perim(x0, z0, x1, z1, r, step) {
  const pts = [];
  const seg = (ax, az, bx, bz, a) => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / step)); for (let i = 0; i < n; i++) { const t = (i + .5) / n; pts.push([ax + (bx - ax) * t, az + (bz - az) * t, a]); } };
  const arc = (cx, cz, a0) => { const n = Math.max(1, Math.round(r * HP / step)); for (let i = 0; i < n; i++) { const a = a0 + (i + .5) / n * HP; pts.push([cx + Math.sin(a) * r, cz + Math.cos(a) * r, a]); } };
  seg(x0 + r, z1, x1 - r, z1, 0); arc(x1 - r, z1 - r, 0); seg(x1, z1 - r, x1, z0 + r, HP); arc(x1 - r, z0 + r, HP);
  seg(x1 - r, z0, x0 + r, z0, PI); arc(x0 + r, z0 + r, PI); seg(x0, z0 + r, x0, z1 - r, -HP); arc(x0 + r, z1 - r, PI * 1.5);
  return pts;
}
// 평면 한 장 (글자·그림), 바닥 면은 -HP로 눕힘
const PL = (w, h) => geo(`st-pl-${w}-${h}`, () => new THREE.PlaneGeometry(w, h));
const flat = (w, h, map, o = {}) => mesh(PL(w, h), mat(o.color || '#ffffff', { map, rough: o.rough ?? .85, rim: o.rim ?? .06, emissive: o.em, ei: o.ei }), { cast: false });
const decal = (parent, w, h, map, x, y, z, ry = 0, o) => { const p = flat(w, h, map, o); put(p, x, y, z, 0, ry, 0); parent.add(p); return p; };
const floorPlane = (parent, w, d, map, x, y, z, rpt) => { const t = map; rep(t, rpt[0], rpt[1]); const p = mesh(geo(`st-fl-${w}-${d}-${rpt}`, () => new THREE.PlaneGeometry(w, d)), mat('#ffffff', { map: t, rough: .75, rim: .08 }), { cast: false }); put(p, x, y, z, -HP); p.userData.floor = true; parent.add(p); return p; };
function gear(add, x, y, z, r, color) {
  add(G.cyl(r * .8, r * .8, .06, 12), color, x, y, z, HP, 0, 0);
  for (let k = 0; k < 10; k++) { const a = k * PI / 5; add(G.box(r * .31, r * .3, .065, .01), color, x + Math.sin(a) * r * .88, y + Math.cos(a) * r * .88, z, 0, 0, -a); }
  add(G.cyl(r * .28, r * .28, .075, 10), C.cream, x, y, z + .01, HP, 0, 0);
}
function pot(add, x, y, z, s = 1, bloom = null) {
  add(G.cyl(.14 * s, .1 * s, .22 * s, 10), '#d98b5f', x, y + .11 * s, z); add(G.cyl(.15 * s, .15 * s, .04 * s, 10), '#e9a67a', x, y + .22 * s, z);
  for (let k = 0; k < 6; k++) { const a = k * 2.4; add(G.sph(.09 * s, 8, 6), k % 2 ? C.leaf : C.leaf2, x + Math.cos(a) * .08 * s, y + (.32 + (k % 2) * .06) * s, z + Math.sin(a) * .08 * s, 0, 0, 0, [1.2, .7, 1]);
    if (bloom && k % 2) add(G.sph(.045 * s, 7, 5), bloom, x + Math.cos(a) * .12 * s, y + .43 * s, z + Math.sin(a) * .12 * s); }
}
// 접히는 벽 (방 벽처럼 카메라 쪽으로 오면 무릎 높이로 — 21판 파출소·18판 새 안과 같은 규칙)
const foldWall = (f, n, H) => {
  const g = grp(), deco = grp(), knee = grp(); f.add(g); f.add(deco); f.add(knee); knee.visible = false;
  (f.live || (f.live = [])).push(g, deco, knee);
  const q = { g, deco, knee, n: new THREE.Vector3(...n), k: 1, stub: .42 / H };
  (f.stWalls || (f.stWalls = [])).push(q);
  return q;
};
const tagWall = o => o.traverse(m => { if (m.isMesh) { m.userData.noMerge = true; m.castShadow = true; m.receiveShadow = true; } });

// ── 바탕: 섬 · 보도 · 찻길 · 가게 벽 · 창고 칸 · 거대 연필 기둥 · 지붕 간판 ───────────────────────────────────────────
const WT = .18, WH = 2.4, SX0 = -3.5, SX1 = .95, SZ0 = -2.75, SZF = .45, BX1 = 2.8, BZF = -1.0, BH = 2.15;
B.st_shop = f => {
  f.noOccupied = true; f.collideBox = [0, -.3, 0, .001, -.29, .001];
  // (걷기를 막는 몸: 벽 둘·창고 칸·거대 연필·분리수거함·우산꽂이 — 나머지 바탕은 지나다님)
  const walk = [[SX0 - WT, 0, SZ0 - WT, SX1, WH, SZ0], [SX0 - WT, 0, SZ0, SX0, WH, SZF], [SX1, 0, SZ0 - WT, BX1, BH, BZF],
    [-3.83, 0, .3, -3.35, 2.6, .78], [2.95, 0, .05, 3.45, .8, .62], [.64, 0, .14, .96, .6, .46], [-3.45, 0, -.1, -3.1, .4, .26], [2.95, 0, -2.75, 3.6, .5, -1.5]];
  f.walkBoxes = walk; f.walkSolids = walk;
  // 섬 받침: 흙 두 단 + 돌 띠 + 보도 단(연석 턱) + 찻길
  f.add(mc('st-island', ({ add }) => {
    add(ext(island(.48), .14, 16), C.earthD, 0, -1.14, 0, -HP, 0, 0);
    add(ext(island(.26), .5, 16), C.earth, 0, -1.0, 0, -HP, 0, 0);
    add(ext(island(.04), .36, 16), C.stone, 0, -.5, 0, -HP, 0, 0);
    // 보도 단: 연석 바깥(z 2.93)까지, 앞 모서리는 각지게 (찻길이 섬 앞을 감쌈)
    add(ext(island(0, IS.z0, CURB_Z, IS.r, 0), .15, 16), '#d6cabd', 0, -.15, 0, -HP, 0, 0);
    // 돌 띠: 엇갈린 두 줄 (둘레 따라)
    for (const [row, y] of [[0, -.24], [1, -.4]]) perim(IS.x0 + .02, IS.z0 + .02, IS.x1 - .02, IS.z1 - .02, IS.r - .02, .31).forEach(([x, z, a], i) => {
      if (row === 0 && z > CURB_Z - .05 && Math.abs(a) < 1e-6) return;
      const o = row ? .155 : 0, cc = (i + row) % 3 ? C.stone : (i % 2 ? C.stoneD : '#d2c6b6');
      add(G.box(.27, .14, .07, .025), cc, x + Math.sin(a) * .015 + Math.cos(a) * o * .3, y, z + Math.cos(a) * .015 - Math.sin(a) * o * .3, 0, a, 0);
    });
    // 흙 단의 자갈 몇 개와 풀뿌리
    const r = rnd(61); perim(IS.x0 + .26, IS.z0 + .26, IS.x1 - .26, IS.z1 - .26, IS.r - .26, .9).forEach(([x, z, a]) => { add(G.sph(.06 + r() * .04, 7, 5), r() < .5 ? C.stoneD : '#b8a48e', x + Math.sin(a) * .02, -.62 - r() * .3, z + Math.cos(a) * .02, 0, 0, 0, [1.3, .8, 1]); });
    // 연석: 화강암 토막, 보도보다 살짝 높게
    for (let k = 0; k < 10; k++) { const x0 = -3.95 + k * .79; add(G.box(.77, .2, .19, .03), k % 2 ? C.curb : '#e2dfd8', x0 + .395, -.065, 2.835); }
    // 찻길: 흰 점선, 빗물받이, 맨홀
    for (let k = 0; k < 9; k++) add(G.box(.42, .012, .08, .004), '#f4f1e8', -3.4 + k * .86, -.14, 3.45);
    add(G.box(.62, .02, .26, .01), C.asphD, -.6, -.142, 3.08); for (let k = 0; k < 6; k++) add(G.pbox(.04, .012, .2), '#30333d', -.82 + k * .088, -.13, 3.08);
    add(G.cyl(.3, .3, .02, 22), '#6b7080', 2.2, -.142, 3.55); add(G.tor(.3, .022, PI * 2, 4, 22), '#535868', 2.2, -.132, 3.55, HP, 0, 0);
    for (let k = -2; k <= 2; k++) add(G.box(.46 - Math.abs(k) * .09, .01, .03, .004), '#535868', 2.2, -.128, 3.55 + k * .09);
    // 가게 뒤 좁은 땅: 풀 몇 줌, 배수 홈
    for (const [x, z, n] of [[-3.3, -3.05, 4], [-1.2, -3.1, 5], [.6, -3.08, 3], [2.3, -3.1, 4], [3.7, -3.0, 4]]) for (let k = 0; k < n; k++) { const a = k * 2.3; add(G.sph(.08 + (k % 3) * .02, 8, 6), k % 2 ? C.leaf : C.leaf2, x + Math.cos(a) * .09, .05 + (k % 2) * .03, z + Math.sin(a) * .07, 0, 0, 0, [1.1, .8, 1]); }
  }));
  // 바닥 그림: 보도블록(섬 윗면 전체), 찻길, 가게 타일, 창고 콘크리트
  { const g = new THREE.ShapeGeometry(island(0, IS.z0, CURB_Z - .19, IS.r, 0), 12); const t = rep(paveTex(), 1 / 1.2, 1 / 1.2); const m = mesh(g, mat('#ffffff', { map: t, rough: .75, rim: .08 }), { cast: false }); put(m, 0, .003, 0, -HP); m.userData.floor = true; f.add(m); }
  { const g = new THREE.ShapeGeometry(island(0, CURB_Z, IS.z1, 0, IS.r), 12); const t = rep(asphTex(), .5, .5); const m = mesh(g, mat('#ffffff', { map: t, rough: .9, rim: .04 }), { cast: false }); put(m, 0, -.145, 0, -HP); m.userData.floor = true; f.add(m); }
  floorPlane(f, SX1 - SX0, SZF - SZ0, tileTex(), (SX0 + SX1) / 2, .006, (SZ0 + SZF) / 2, [SX1 - SX0, SZF - SZ0]);
  f.add(mc('st-floortrim', ({ add }) => {
    // 문턱(알루미늄 띠), 창고 바닥, 보도 하수 덮개
    add(G.box(SX1 - SX0, .022, .07, .006), C.metal, (SX0 + SX1) / 2, .011, SZF);
    add(G.box(BX1 - SX1 - 2 * WT, .01, BZF - SZ0, .004), '#b9b6ad', (SX1 + BX1) / 2, .007, (SZ0 + BZF) / 2);
    add(G.box(.5, .016, .3, .006), '#8d8f96', -3.05, .008, 2.3); for (let k = 0; k < 5; k++) add(G.pbox(.42, .01, .025), '#5f626b', -3.05, .018, 2.18 + k * .06);
  }));

  // ── 가게 뒷벽(N) · 옆벽(W): 벽지 위 · 판벽 아래, 단면 테, 지붕 끝 ────────────────────────────────────────────
  const N = foldWall(f, [0, 0, 1], WH), Wl = foldWall(f, [1, 0, 0], WH);
  const NL = SX1 - (SX0 - WT), NX = (SX1 + SX0 - WT) / 2, WL = SZF - (SZ0 - WT), WZ = (SZF + SZ0 - WT) / 2;
  N.g.add(mc('st-wallN', ({ add }) => {
    add(G.box(NL, WH, WT, .01), C.ext, NX, WH / 2, SZ0 - WT / 2);
    add(G.box(NL, .1, .04, .01), C.trim, NX, .05, SZ0 + .02); add(G.box(NL, .05, .05, .01), C.wainD, NX, .86, SZ0 + .025);
    // 창 (오른쪽 위): 나무 틀
    add(G.box(.72, .08, .1, .02), C.woodD, .5, 1.42, SZ0 + .05); add(G.box(.72, .06, .08, .02), C.woodD, .5, 2.12, SZ0 + .04);
    for (const x of [.17, .83]) add(G.box(.06, .7, .08, .02), C.woodD, x, 1.77, SZ0 + .04); add(G.pbox(.03, .64, .05), C.woodD, .5, 1.77, SZ0 + .03);
  }));
  decal(N.g, NL, .84, rep(wainTex(), NL, .84), NX, .42, SZ0 + .003);
  decal(N.g, NL, WH - .86, rep(paperTex(), NL, WH - .86), NX, (WH + .86) / 2, SZ0 + .003);
  decal(N.g, .6, .64, nightGlass(), .5, 1.77, SZ0 + .006);
  Wl.g.add(mc('st-wallW', ({ add }) => {
    add(G.box(WT, WH, WL, .01), C.ext, SX0 - WT / 2, WH / 2, WZ);
    add(G.box(.04, .1, WL - WT, .01), C.trim, SX0 + .02, .05, (SZF + SZ0) / 2); add(G.box(.05, .05, WL - WT, .01), C.wainD, SX0 + .025, .86, (SZF + SZ0) / 2);
  }));
  decal(Wl.g, SZF - SZ0, .84, rep(wainTex(), SZF - SZ0, .84), SX0 + .003, .42, (SZF + SZ0) / 2, HP);
  decal(Wl.g, SZF - SZ0, WH - .86, rep(paperTex(), SZF - SZ0, WH - .86), SX0 + .003, (WH + .86) / 2, (SZF + SZ0) / 2, HP);
  // 벽에 붙은 것: 신학기 준비물 전단·달력·벽시계 (W 벽 앞쪽, 계산대 위), 뽑기 신상 포스터 (N 벽)
  { const p = paperSheet(.42, .56, posterTex(0, '신학기 준비물', ['공책', '크레파스', '실내화'], C.blue), { hold: 'tape' }); put(p, SX0 + .012, 1.55, -.05, 0, HP, 0); Wl.deco.add(p); }
  { const p = paperSheet(.34, .46, posterTex(1, '오늘 일찍 닫아요', ['외상 사절'], C.red), { hold: 'pin' }); put(p, -.15, 1.95, SZ0 + .012); N.deco.add(p); }
  Wl.deco.add(mc('st-clock', ({ add }) => {
    add(G.cyl(.17, .17, .05, 20), C.woodD, SX0 + .03, 1.98, -.75, 0, 0, HP); add(G.cyl(.145, .145, .02, 20), C.cream, SX0 + .06, 1.98, -.75, 0, 0, HP);
    add(G.box(.012, .1, .015, .004), C.ink, SX0 + .075, 2.02, -.75); add(G.box(.012, .015, .075, .004), C.ink, SX0 + .075, 1.98, -.72);
  }));
  // 단면 테(잘린 벽 윗면), 지붕 끝(슬레이트 띠) — 벽과 같이 접힘
  N.deco.add(mc('st-roofN', ({ add }) => {
    add(G.box(NL + .02, .05, WT + .02, .01), C.cut, NX, WH + .025, SZ0 - WT / 2);
    add(G.box(NL + .3, .1, .55, .02), C.roof, NX - .15, WH + .1, SZ0 - WT - .1, -.32, 0, 0);
    for (let k = 0; k < 4; k++) add(G.box(NL + .31, .02, .03, .004), C.roofD, NX - .15, WH + .09 + k * .045, SZ0 - WT + .15 - k * .13, -.32, 0, 0);
    add(G.box(NL + .32, .05, .05, .01), C.roofD, NX - .15, WH + .02, SZ0 - WT - .36);
    // 지붕 간판 (기둥 둘) + 거대 크레파스
    for (const x of [-2.75, -.55]) add(G.box(.08, .5, .08, .02), C.poleD, x, WH + .25, SZ0 - .12);
    add(G.box(2.86, .82, .1, .03), C.red, -1.65, WH + .8, SZ0 - .13);
    add(G.cyl(.17, .17, 1.25, 16), C.red, .52, WH + .65, SZ0 - .1); add(G.cone(.17, .32, 16), '#f07a66', .52, WH + 1.43, SZ0 - .1);
    add(G.cyl(.175, .175, .5, 16), C.cream, .52, WH + .55, SZ0 - .1);
    add(G.cyl(.178, .178, .04, 16), C.ink, .52, WH + .32, SZ0 - .1); add(G.cyl(.178, .178, .04, 16), C.ink, .52, WH + .78, SZ0 - .1);
  }));
  decal(N.deco, 2.74, .7, signTex(), -1.65, WH + .8, SZ0 - .074);
  Wl.deco.add(mc('st-roofW', ({ add }) => {
    add(G.box(WT + .02, .05, WL + .02, .01), C.cut, SX0 - WT / 2, WH + .025, WZ);
    add(G.box(.55, .1, WL + .3, .02), C.roof, SX0 - WT - .1, WH + .1, WZ - .15, 0, 0, .32);
    for (let k = 0; k < 4; k++) add(G.box(.03, .02, WL + .31, .004), C.roofD, SX0 - WT + .15 - k * .13, WH + .09 + k * .045, WZ - .15, 0, 0, .32);
  }));
  // 접혔을 때: 무릎 높이 벽 (판벽색 띠)
  N.knee.add(mc('st-kneeN', ({ add }) => { add(G.box(NL, .42, WT, .03), C.ext, NX, .21, SZ0 - WT / 2); add(G.box(NL + .02, .04, WT + .02, .01), C.cut, NX, .43, SZ0 - WT / 2); }));
  Wl.knee.add(mc('st-kneeW', ({ add }) => { add(G.box(WT, .42, WL, .03), C.ext, SX0 - WT / 2, .21, WZ); add(G.box(WT + .02, .04, WL + .02, .01), C.cut, SX0 - WT / 2, .43, WZ); }));
  for (const q of [N, Wl]) { tagWall(q.g); tagWall(q.deco); tagWall(q.knee); }

  // ── 창고 칸 (가게 오른쪽 뒤, 늘 서 있음): 벽돌 벽, 평지붕(스티로폼 텃밭·실외기), 셔터 위 줄무늬 차양 ───────────────────
  f.add(mc('st-bay', ({ add }) => {
    add(G.box(WT, BH, BZF - SZ0 + WT, .01), C.ext, SX1 + WT / 2, BH / 2, (BZF + SZ0 - WT) / 2);
    add(G.box(WT, BH, BZF - SZ0 + WT, .01), C.brick, BX1 - WT / 2, BH / 2, (BZF + SZ0 - WT) / 2);
    add(G.box(BX1 - SX1, BH, WT, .01), C.brick, (SX1 + BX1) / 2, BH / 2, SZ0 - WT / 2);
    add(G.box(BX1 - SX1, .25, WT, .01), C.brick, (SX1 + BX1) / 2, BH - .125, BZF - WT / 2);
    // 평지붕과 낮은 난간, 단면 테
    add(G.box(BX1 - SX1 + .12, .14, BZF - SZ0 + WT + .12, .03), '#c3c8cc', (SX1 + BX1) / 2, BH + .07, (BZF + SZ0 - WT) / 2);
    add(G.box(BX1 - SX1 + .14, .04, BZF - SZ0 + WT + .14, .01), C.cut, (SX1 + BX1) / 2, BH + .16, (BZF + SZ0 - WT) / 2);
    // 실외기 (팬 망) · 스티로폼 텃밭 (파 · 상추)
    add(G.box(.62, .44, .3, .03), '#e9ece8', 2.25, BH + .4, SZ0 + .05); add(G.cyl(.15, .15, .02, 16), '#9aa2a8', 2.15, BH + .41, SZ0 + .21, HP, 0, 0);
    for (let k = 0; k < 4; k++) add(G.tor(.04 + k * .035, .006, PI * 2, 3, 16), '#7d858c', 2.15, BH + .41, SZ0 + .225);
    add(G.box(.62, .22, .36, .02), '#f4f4f0', 1.45, BH + .29, -1.55);
    for (let k = 0; k < 7; k++) add(G.cyl(.012, .016, .22, 6), k % 2 ? '#7cc06a' : '#5ea85a', 1.22 + k * .075, BH + .5, -1.55 + (k % 2 ? .06 : -.06));
    for (let k = 0; k < 3; k++) add(G.sph(.09, 8, 6), C.leaf, 1.6 + (k % 2) * .08, BH + .44, -1.62 + k * .07, 0, 0, 0, [1.2, .6, 1]);
    // 셔터 위 차양 (빨강·크림 줄, 물결 끝)
    const n = 10, x0 = SX1 + .05, w = BX1 - SX1 - .1;
    for (let k = 0; k < n; k++) { const cx = x0 + (k + .5) * w / n, col = k % 2 ? C.cream : '#e46f5e';
      add(G.box(w / n, .035, .62, .006), col, cx, BH - .02, BZF + .25, .42, 0, 0); add(G.cyl(w / n * .5, w / n * .5, .035, 10, false), col, cx, BH - .16, BZF + .54, HP, 0, 0, [1, 1, 1]); }
    add(G.box(w, .16, .03, .01), '#e46f5e', x0 + w / 2, BH - .14, BZF + .56);
    // 창고 안 (셔터 열면): 선반·상자·빗자루
    add(G.box(1.2, .04, .4, .01), C.woodL, (SX1 + BX1) / 2, .9, SZ0 + .22); add(G.box(1.2, .04, .4, .01), C.woodL, (SX1 + BX1) / 2, 1.45, SZ0 + .22);
    for (const [x, y, c] of [[1.3, .92, '#d7b07c'], [1.62, .92, '#c99a64'], [2.15, 1.47, '#d7b07c'], [1.45, 1.47, '#e4c08e']]) add(G.box(.28, .26, .3, .02), c, x, y + .13, SZ0 + .22);
    add(G.cyl(.015, .015, 1.2, 6), C.woodD, 2.5, .62, -2.5, .1, 0, -.12); add(G.box(.22, .14, .05, .02), '#e8c35a', 2.57, .08, -2.48);
    // 창고 옆벽 바깥: 가스 계량기, 빗물 홈통
    add(G.box(.22, .28, .14, .03), '#d9d6c8', BX1 + .08, 1.25, -1.7); add(G.cyl(.03, .03, .4, 8), '#b8b29e', BX1 + .1, .95, -1.65);
    add(G.cyl(.045, .045, BH + .05, 8), '#9aa2a8', BX1 + .05, (BH + .05) / 2, -2.85); add(G.box(.12, .06, .12, .02), '#9aa2a8', BX1 + .05, .03, -2.78);
  }));
  // 창고 앞 차양 끝 글자 · 벽돌 결 · 옆벽 전단 둘
  { const t = TT('valance', 512, 64, (c, W, H) => { c.fillStyle = '#e46f5e'; c.fillRect(0, 0, W, H); fitText(c, '학용품 도매', W / 2, H / 2, W * .6, 40, '#ffffff', { weight: 'bold' }); }); decal(f, BX1 - SX1 - .1, .15, t, (SX1 + BX1) / 2, BH - .14, BZF + .577); }
  decal(f, BZF - SZ0 + WT - .02, BH - .02, rep(brickTex(), BZF - SZ0 + WT, BH), BX1 + .002, BH / 2, (BZF + SZ0 - WT) / 2, HP);
  decal(f, .15, .21, rep(brickTex(), .15, .2), BX1 - .09, 1.0, BZF + .003);
  { const p = paperSheet(.34, .46, posterTex(2, '태권도', ['원생 모집'], C.navy), { hold: 'tape' }); put(p, BX1 + .012, 1.35, -1.28, 0, HP, 0); f.add(p); }
  { const p = paperSheet(.3, .4, posterTex(3, '피아노', ['원생 모집'], C.purp), { hold: 'pin' }); put(p, BX1 + .012, 1.0, -2.35, 0, HP, .05); f.add(p); }
  // 창고 서쪽 벽 안쪽(가게 쪽): 벽지 이어서
  decal(f, BZF - SZ0, WH - .9, rep(paperTex(), BZF - SZ0, BH), SX1 - .003, (BH + .86) / 2 - .02, (BZF + SZ0) / 2, -HP);
  decal(f, BZF - SZ0, .84, rep(wainTex(), BZF - SZ0, .84), SX1 - .003, .42, (BZF + SZ0) / 2, -HP);

  // ── 거대 연필 기둥 (가게 앞 왼쪽 모서리): 노란 육각 몸, 은색 띠, 분홍 지우개는 아래, 깎은 끝은 위 ─────────────────
  f.add(mc('st-pencil', ({ add }) => {
    const x = -3.59, z = .54;
    add(G.cyl(.23, .23, .14, 6), C.pink, x, .07, z); add(G.cyl(.235, .235, .16, 6), C.metal, x, .22, z);
    for (const y of [.17, .27]) add(G.cyl(.24, .24, .02, 6), C.metalD, x, y, z);
    add(G.cyl(.22, .22, 2.16, 6), '#ffd25a', x, 1.38, z); for (let k = 0; k < 6; k++) { const a = k * PI / 3 + PI / 6; add(G.pbox(.012, 2.14, .012), '#e8b83e', x + Math.cos(a) * .2, 1.38, z + Math.sin(a) * .2); }
    add(G.cone(.22, .5, 6), C.woodL, x, 2.71, z); add(G.cone(.075, .17, 6), '#565a66', x, 2.875, z);
    // 발치 화분 둘
    pot(add, -3.85, 0, 1.0, 1.0, C.pink); pot(add, -3.8, 0, 1.42, .85, C.yel);
  }));
  { const t = TT('hb', 128, 64, (c, W, H) => { c.fillStyle = '#ffd25a'; c.fillRect(0, 0, W, H); fitText(c, 'HB', W / 2, H / 2, W * .7, 40, '#7a5a28', { weight: 'bold' }); }); decal(f, .2, .1, t, -3.59 + .13, 1.7, .54 + .155, PI / 3); }

  // ── 보도 위 생활 디테일: 우산꽂이(놓고 간 분홍 우산), 분리수거함·납작 상자 묶음, 스티로폼 화분 둘 ─────────────────
  f.add(mc('st-street', ({ add, tube }) => {
    add(G.cyl(.15, .13, .5, 14), '#7d9ab0', .8, .25, .3); add(G.cyl(.155, .155, .03, 14), '#5f7a90', .8, .5, .3);
    tube([0.76, .3, 0.29], [0.70, 1.0, 0.23], .022, C.ink); add(G.cone(.09, .35, 8), '#3d4a7a', .72, .82, .25, PI + .1, 0, -.1);
    tube([0.85, .3, 0.32], [0.93, 1.05, 0.39], .022, '#c0587a'); add(G.cone(.1, .4, 8), C.pink, .91, .85, .37, PI - .1, 0, .12); add(G.tor(.05, .015, PI, 4, 10), '#c0587a', .95, 1.07, .4, 0, .3, 0);
    // 가게 안 문 옆 휴지통 (구겨진 종이)
    add(G.cyl(.14, .12, .36, 14), '#9fc3ae', -3.27, .18, .08); add(G.tor(.14, .015, PI * 2, 4, 14), '#7ea591', -3.27, .36, .08, HP, 0, 0);
    for (const [dx, dz] of [[-.03, .02], [.04, -.03]]) add(G.sph(.05, 7, 5), C.paper, -3.27 + dx, .37, .08 + dz);
    // 분리수거함: 파랑 재활용 · 회색 일반, 묶은 납작 상자
    add(G.box(.42, .62, .42, .05), '#4f86c6', 3.08, .31, .33); add(G.box(.44, .05, .44, .02), '#3f72aa', 3.08, .64, .33);
    add(G.box(.36, .56, .36, .05), '#8c949c', 3.33, .28, .38, 0, .3, 0); add(G.box(.38, .04, .38, .02), '#737b84', 3.33, .58, .38, 0, .3, 0);
    add(G.box(.06, .5, .6, .01), '#c99a64', 3.42, .28, -.1, 0, 0, -.18); add(G.box(.06, .46, .56, .01), '#d7b07c', 3.36, .26, -.08, 0, 0, -.22);
    add(G.box(.03, .52, .025, .008), '#f4f1e8', 3.4, .28, -.1, 0, 0, -.2);
    // 스티로폼 상자 텃밭 (창고 옆): 상추·고추
    for (const [x, z] of [[3.15, -2.45], [3.2, -1.95]]) { add(G.box(.5, .26, .36, .02), '#f4f4f0', x, .13, z); for (let k = 0; k < 4; k++) add(G.sph(.1, 8, 6), k % 2 ? '#8fcf6a' : '#6cb85a', x - .15 + k * .1, .3, z + (k % 2 ? .05 : -.05), 0, 0, 0, [1.2, .6, 1]); }
    add(G.sph(.03, 6, 5), C.red, 3.12, .38, -1.95); add(G.sph(.03, 6, 5), C.red, 3.26, .36, -1.9);
  }));
  // 숨김 자리 (보도·바닥)
  f.spot('on', null, 1.85, .012, -.05, { label: '셔터 앞 보도', maxH: .5, scale: 1.4 });
  f.spot('behind', null, 3.5, .012, .0, { label: '분리수거함 뒤', maxH: .4, scale: 1 });
  f.spot('on', null, -.4, .012, 2.25, { label: '가게 앞 보도', maxH: .5, scale: 1.5 });
  f.spot('on', null, -3.05, .03, 2.3, { label: '하수 덮개 옆', maxH: .45, scale: 1.2 });
  f.spot('on', null, 3.18, .26, -2.45, { label: '스티로폼 텃밭 속', maxH: .3, scale: .9 });
  f.spot('on', null, .8, .5, .3, { label: '우산꽂이 위', maxH: .3, scale: .85 });

  // 방 벽처럼: 카메라 쪽으로 온 벽은 무릎 높이로 (room.js와 같은 규칙: 안쪽 법선 · 카메라 방향 < -.18)
  const cam = new THREE.Vector3(), nrm = new THREE.Vector3();
  f.updateView = (Wd, dt = 1 / 60) => {
    if (!Wd || !Number.isFinite(Wd.yaw)) return;
    f.group.updateWorldMatrix(true, false);
    cam.set(Math.sin(Wd.yaw), 0, Math.cos(Wd.yaw));
    const sm = 1 - Math.exp(-Math.max(0, dt) * 12);
    for (const q of f.stWalls) {
      nrm.copy(q.n).transformDirection(f.group.matrixWorld);
      const want = nrm.dot(cam) < -.18 ? 0 : 1, prev = q.k;
      q.k += (want - q.k) * sm; if (Math.abs(q.k - want) < .002) q.k = want;
      if (q.k === prev) continue;
      q.g.scale.y = q.stub + (1 - q.stub) * q.k;
      q.deco.visible = q.k > .65; q.g.visible = q.k > .3; q.knee.visible = q.k <= .3;
      Wd.shadowDirty = true; Wd.idsDirty = true;
    }
  };
};

// ── 창고 셔터 (반쯤 내림): 말아 올리면 안쪽 열쇠 트레이가 쑥 — 셔터 앞면에 가로등 숫자 그림자가 비침 ────────────────
// 원점 = 창고 앞 가운데 바닥 (월드 x 1.875, z -1.0)
B.st_shutter = f => {
  const W = BX1 - SX1 - 2 * WT, TOP = 1.92, BOT0 = .62;
  f.add(mc('st-shutter-frame', ({ add }) => {
    add(G.box(W + .3, .22, .24, .04), C.metal, 0, TOP + .11, .1); add(G.box(W + .32, .04, .26, .01), C.metalD, 0, TOP + .005, .1);
    for (const s of [-1, 1]) add(G.box(.05, TOP, .07, .01), C.metalD, s * (W / 2 + .005), TOP / 2, .02);
    // 바닥 자물쇠 고리 · 손잡이 홈
    add(G.box(.18, .05, .06, .015), C.metalD, .5, .03, .05);
  }));
  // 말리는 셔터 몸: 위(y TOP)에 붙어 아래로 — scale.y로 말려 올라감
  const cur = grp(); put(cur, 0, TOP, .04); f.add(cur);
  const H0 = TOP - BOT0;
  cur.add(put(mesh(geo('st-shut-body', () => new THREE.BoxGeometry(W, H0, .03)), mat('#ffffff', { map: rep(shutterTex(), W, H0) })), 0, -H0 / 2, 0));
  cur.add(put(mesh(geo('st-shut-bar', () => new THREE.BoxGeometry(W + .02, .07, .06)), mat(C.metalD)), 0, -H0 + .035, .01));
  cur.add(put(mesh(geo('st-shut-handle', () => new THREE.BoxGeometry(.3, .05, .05)), mat(C.ink)), 0, -H0 + .1, .04));
  // 숫자 그림자 (가로등을 켜면 보임)
  const shadow = grp(); put(shadow, 0, -.62, .021); cur.add(shadow);
  let code = '935';
  const tex = canvasTex(512, 256, c => drawShadow(c, code));
  const sm = mesh(geo('st-shadow-pl', () => new THREE.PlaneGeometry(1.36, .68)), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }), { cast: false });
  sm.userData.noMerge = true; sm.renderOrder = 2; shadow.add(sm); shadow.visible = false;
  f.live = [shadow];
  f.gptShadow = { g: shadow, setCode(cd) { code = String(cd); drawShadow(tex.image.getContext('2d'), code); tex.needsUpdate = true; }, setVisible(on) { shadow.visible = !!on; } };
  // 안쪽 열쇠 트레이 (창고 선반 위 → 셔터가 다 올라가면 앞으로 쑥)
  const tray = grp(); put(tray, -.1, .58, -.95); f.add(tray);
  tray.add(mc('st-keytray', ({ add }) => {
    add(G.box(.62, .05, .44, .015), C.wood, 0, 0, 0); for (const s of [-1, 1]) add(G.box(.62, .09, .03, .01), C.woodD, 0, .045, s * .205); add(G.box(.03, .09, .44, .01), C.woodD, -.3, .045, 0);
    add(G.box(.14, .03, .1, .01), C.cream, .2, .04, -.12); add(G.pbox(.1, .005, .06), C.red, .2, .057, -.12);
  }));
  f.add(mc('st-traystand', ({ add }) => { add(G.box(.7, .56, .5, .02), '#b8a48e', -.1, .28, -.95); add(G.box(.72, .03, .52, .01), C.woodD, -.1, .55, -.95); }));
  const stage = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  const p = f.part('lift', [cur, tray], (t, bc, bt) => {
    const a = stage(t, 0, .72), c = stage(t, .72, 1);
    cur.scale.y = 1 - .93 * a; tray.position.z = bt.p.z + 1.12 * c; tray.position.y = bt.p.y + .02 * Math.sin(c * PI);
  }, { label: '반쯤 내린 셔터', sfx: 'lift_metal', dur: 2.2 });
  p.gptRole = 'shopShutter';
  const key = f.spot('inside', tray, 0, .03, .04, { part: p, maxH: .5, scale: 1.5, label: '셔터 뒤 가게 열쇠 트레이' }); key.reserved = true; key.gptRole = 'shopkey';
  f.walkBoxes = () => [[-W / 2 - .2, 0, -.1, W / 2 + .2, 2.2, .25], ...(p.t > .7 ? [[-.45, .3, -.7 + 1.12 * stage(p.t, .72, 1), .25, .7, -.5 + 1.12 * stage(p.t, .72, 1)]] : [])];
};

// ── 가로등 (보도 끝 연석 가까이): 기둥 스위치를 켜면 등이 밝아지고 셔터에 숫자 그림자 — 등 전체가 손잡이 ────────────
// 원점 = 기둥 밑 (월드 x 3.05, z 2.35)
B.st_streetlamp = f => {
  const all = grp(); f.add(all);
  all.add(mc('st-lamp', ({ add, tube }) => {
    add(G.cyl(.17, .21, .14, 12), C.poleD, 0, .07, 0); add(G.cyl(.055, .07, 2.75, 10), C.pole, 0, 1.5, 0);
    tube([0, 2.86, 0], [-.18, 3.08, -.12], .045, C.pole, 8); tube([-.18, 3.08, -.12], [-.62, 3.12, -.42], .045, C.pole, 8);
    add(G.cone(.22, .18, 12), C.poleD, -.68, 3.04, -.46); add(G.cyl(.06, .06, .05, 8), C.poleD, -.68, 3.16, -.46);
    // 스위치 함 (기둥 가운데, 앞을 봄)
    add(G.box(.34, .46, .14, .04), '#e9e2cc', 0, 1.05, .1); add(G.box(.26, .38, .02, .02), '#d4ccb2', 0, 1.05, .175);
    add(G.box(.08, .16, .03, .01), C.ink, 0, 1.07, .19);
    // 기둥 전단 띠, 반사 띠
    add(G.box(.16, .5, .02, .01), '#fff3d6', .0, 1.75, .07); for (const y of [.35, .45]) add(G.cyl(.075, .075, .05, 10), '#ffe14d', 0, y, 0);
  }));
  { const t = TT('lampflyer', 64, 192, (c, W, H) => { paperFill(c, W, H, '#fff3d6', 3); fitText(c, '딱지', W / 2, 40, W - 10, 18, C.red, { weight: 'bold' }); fitText(c, '1등', W / 2, 100, W - 10, 16, C.ink); fitText(c, '500원', W / 2, 150, W - 10, 14, C.ink); }); decal(all, .15, .46, t, 0, 1.75, .082); }
  const sw = grp(); put(sw, 0, 1.07, .21); f.add(sw);
  sw.add(mc('st-lampsw', ({ add }) => { add(G.box(.07, .2, .07, .02), C.red, 0, .06, 0); add(G.sph(.06, 9, 6), C.yel, 0, .17, .02); }));
  const OFF = mat('#bdb8a0'), ON = mat('#ffeeb0', { emissive: '#ffd27a', ei: 1.6 });
  const bulb = mesh(new THREE.SphereGeometry(.13, 12, 8), OFF); put(bulb, -.68, 2.93, -.46); bulb.scale.set(1, .7, 1); f.add(bulb);
  // 켜면 바닥 빛 웅덩이
  const poolT = TC.get('st-pool', () => fadeDisc(64, '#ffe2a0', r => (1 - r) * .55));
  const pool = mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: poolT, transparent: true, depthWrite: false }), { cast: false, recv: false });
  put(pool, -.9, .02, -.7, -HP); pool.visible = false; pool.userData.noMerge = true; pool.userData.noPaint = true; f.add(pool);
  f.live = [pool];
  // 셔터는 다른 가구: 장면에서 한 번 찾아 둠
  let shut = null, code = null, vis = false;
  const findShutter = () => {
    if (shut) return shut;
    let r = f.group; while (r.parent) r = r.parent;
    r.traverse(o => { if (!shut && o.userData?.furn?.type === 'st_shutter' && o === o.userData.furn.group) shut = o.userData.furn; });
    if (shut) { if (code) shut.gptShadow.setCode(code); shut.gptShadow.setVisible(vis); }
    return shut;
  };
  f.gptShadow = { setCode(c) { code = String(c); findShutter()?.gptShadow.setCode(code); }, setVisible(on) { vis = !!on; findShutter()?.gptShadow.setVisible(vis); } };
  const p = f.part('lever', [all, sw, bulb], t => {
    sw.rotation.x = -1.0 * t; const on = t > .25;
    bulb.material = on ? ON : OFF; pool.visible = on; f.gptShadow.setVisible(on);
  }, { label: '가로등 스위치', sfx: 'click', dur: .5 });
  p.gptShadowSwitch = true; p.gptEndSfx = 'pop';
  f.walkBoxes = [[-.2, 0, -.2, .2, 2.9, .25]]; f.walkSolids = f.walkBoxes;
};

// ── 셔터 레버 (창고 오른쪽 앞 기둥): 손잡이가 빠진 레버 · 톱니 — 손잡이를 끼우면 철컥 내려가며 톱니가 돎 ───────────
// 원점 = 기둥 밑 (월드 x 3.12, z -.72), 앞(+z)을 봄
B.st_shutterlever = f => {
  const all = grp(); f.add(all);
  all.add(mc('st-lever', ({ add }) => {
    add(G.box(.34, .08, .3, .03), '#8f9399', 0, .04, 0); add(G.box(.12, .95, .12, .03), '#6f8a96', 0, .5, 0);
    for (const y of [.2, .34]) add(G.box(.13, .06, .13, .01), '#ffe14d', 0, y, 0);
    add(G.box(.46, .56, .2, .05), '#7fa0ae', 0, 1.08, .04); add(G.box(.38, .46, .02, .03), '#94b4c0', 0, 1.08, .145);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(G.sph(.016, 8, 6), C.metalD, sx * .19, 1.08 + sy * .24, .15, 0, 0, 0, [1, 1, .5]);
    // 레버 홈과 빈 소켓 (손잡이 자리)
    add(G.box(.06, .3, .02, .01), '#3e4b55', -.1, 1.06, .16); add(G.box(.48, .07, .22, .02), '#e46f5e', 0, 1.39, .04);
    // 셔터까지 이어진 줄 (기둥 → 창고 벽)
  }));
  { const t = TT('levertag', 192, 64, (c, W, H) => { c.fillStyle = '#ffe14d'; c.fillRect(0, 0, W, H); c.fillStyle = C.ink; for (let x = -40; x < W; x += 28) { c.beginPath(); c.moveTo(x, H); c.lineTo(x + 14, H); c.lineTo(x + 34, 0); c.lineTo(x + 20, 0); c.fill(); } }); decal(all, .44, .06, t, 0, 1.39, .152); }
  const gearPv = grp(); put(gearPv, .1, 1.1, .17); f.add(gearPv); gearPv.add(mc('st-levergear', ({ add }) => gear(add, 0, 0, 0, .1, C.yel)));
  const arm = grp(); put(arm, -.1, 1.2, .2); f.add(arm);
  arm.add(mc('st-leverarm', ({ add }) => { add(G.cyl(.045, .045, .06, 10), C.metalD, 0, 0, 0, HP, 0, 0); add(G.box(.05, .1, .05, .01), C.metalD, 0, -.05, .03); }));
  const knob = grp(); arm.add(knob); knob.add(mc('st-leverknob', ({ add }) => { add(G.cyl(.018, .018, .26, 8), '#9aa3ad', 0, .1, .05); add(G.sph(.06, 12, 8), C.red, 0, .25, .05); }));
  knob.visible = false;
  const p = f.part('lever', [all, arm, gearPv], t => {
    knob.visible = t > .001; arm.rotation.x = 1.25 * Math.min(1, t * 2.5); gearPv.rotation.z = -PI * 4 * t;
  }, { label: '셔터 레버', sfx: 'latch', dur: .6 });
  p.gptRole = 'shutterLever';
  f.walkBoxes = [[-.25, 0, -.18, .25, 1.4, .25]]; f.walkSolids = f.walkBoxes;
};

// ── 계산대 밑 금고 (비밀번호 자물쇠 자리) — 계산대 오른쪽 빈 칸에 쏙 ────────────────────────────────────────────
B.st_safe = f => {
  const W = .86, H = .74, D = .5;
  f.add(mc('st-safe', ({ add }) => {
    add(G.box(W, .06, D, .02), '#5d6a72', 0, .03, 0);
    add(G.box(.06, H, D, .02), '#6f8590', -W / 2 + .03, H / 2 + .03, 0); add(G.box(.06, H, D, .02), '#6f8590', W / 2 - .03, H / 2 + .03, 0);
    add(G.box(W, .06, D, .02), '#6f8590', 0, H, 0); add(G.box(W, H, .05, .02), '#5d6a72', 0, H / 2 + .03, -D / 2 + .025);
    add(G.box(W - .14, .03, D - .1, .01), '#c9b38c', 0, .26, -.02);
    for (const sx of [-1, 1]) add(G.box(.1, .05, .1, .02), C.ink, sx * (W / 2 - .1), -.0, D / 2 - .1);
  }));
  const door = grp(); put(door, -W / 2 + .02, .06, D / 2 + .01); f.add(door);
  door.add(mc('st-safedoor', ({ add }) => {
    add(G.box(W - .04, H - .06, .07, .03), '#7d97a2', (W - .04) / 2, (H - .06) / 2, 0);
    add(G.box(W - .18, H - .2, .02, .02), '#8fa9b4', (W - .04) / 2, (H - .06) / 2, .04);
    add(G.cyl(.13, .13, .05, 20), '#e9e2cc', .32, .38, .06, HP, 0, 0);
    for (let k = 0; k < 8; k++) { const a = k * PI / 4; add(G.box(.014, .04, .015, .004), C.ink, .32 + Math.sin(a) * .095, .38 + Math.cos(a) * .095, .09, 0, 0, -a); }
    add(G.box(.05, .22, .06, .02), C.yel, .68, .36, .06);
    for (const y of [.08, H - .14]) add(G.cyl(.022, .022, .1, 8), C.metalD, -.0, y, .0);
  }));
  const p = f.part('door', door, t => { door.rotation.y = -1.7 * t; }, { label: '계산대 밑 금고', sfx: 'door_metal', dur: .55 });
  p.lockable = true; p.lockKind = 'code'; p.lockAt = { parent: door, x: .56, y: .52, z: .08 };
  const tool = f.spot('inside', null, -.12, .06, .02, { part: p, maxH: .2, scale: 1.4, label: '금고 안 바닥' }); tool.reserved = true; tool.gptRole = 'shutterTool';
  f.spot('inside', null, .12, .29, .0, { part: p, maxH: .32, scale: 1.1, label: '금고 안 선반' });
};

// ── 계산대 (+z가 손님 쪽): 왼쪽 서랍장 + 진열 유리, 오른쪽은 금고가 드는 빈 칸; 위엔 동전 접시·영수증·계산기·라디오·돋보기,
// 뒤엔 할머니 의자(뜨개 숄)와 보온병 — 문방구 할머니가 일찍 들어가신 자리 ───────────────────────────────────────────
B.st_counter = f => {
  const L = 1.9, D = .62, H = 1.0, x0 = -L / 2;
  f.add(mc('st-counter', ({ add }) => {
    add(G.box(.92, H - .06, D, .02), C.wood, x0 + .46, (H - .06) / 2, 0);
    add(G.box(L + .06, .06, D + .06, .02), C.woodL, 0, H - .03, 0);
    add(G.box(.06, H - .06, D, .01), C.wood, L / 2 - .03, (H - .06) / 2, 0);
    add(G.box(L - .9, .06, .04, .01), C.woodD, .43, .05, -D / 2 + .02);
    add(G.box(.88, .32, .02, .01), '#ffffff', x0 + .46, .42, D / 2 + .005);
    for (const y of [.25, .59]) add(G.box(.9, .03, .03, .01), C.woodD, x0 + .46, y, D / 2 + .01);
    // 위: 동전 접시·동전, 영수증 꽂이, 계산기, 돋보기·안경집, 연필꽂이, 돼지 저금통
    add(G.cyl(.11, .08, .03, 16), '#e9e2cc', -.55, H + .015, .12); for (const [dx, dz] of [[-.03, .02], [.03, -.01], [.0, -.04]]) add(G.cyl(.028, .028, .008, 12), '#d9b54a', -.55 + dx, H + .035, .12 + dz);
    add(G.cyl(.05, .06, .02, 10), C.ink, -.25, H + .01, -.16); add(G.cyl(.006, .006, .2, 6), C.metalD, -.25, H + .11, -.16);
    for (let k = 0; k < 4; k++) add(G.box(.08, .002, .1, .001), '#fbf8f0', -.25, H + .03 + k * .03, -.16, 0, k * .4, 0);
    add(G.box(.18, .03, .24, .015), '#6c7480', .1, H + .015, .05, -.1, 0, 0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) add(G.box(.03, .012, .03, .004), j === 3 ? C.orng : '#e9ece8', .05 + i * .037, H + .035 + j * .005, .1 - j * .04);
    add(G.box(.13, .01, .06, .005), '#cfe6b8', .1, H + .04, -.05, -.1, 0, 0);
    add(G.tor(.07, .014, PI * 2, 6, 18), C.ink, .4, H + .02, .12, HP, 0, 0); add(G.cyl(.066, .066, .006, 16), '#d6ecff', .4, H + .02, .12); add(G.box(.025, .02, .16, .008), C.woodD, .4, H + .015, .26);
    add(G.cap(.03, .1, 3, 8), '#8f3a3a', .55, H + .03, -.1, 0, .4, HP);
    add(G.cyl(.05, .045, .14, 10), C.blue, .7, H + .07, -.16); for (let k = 0; k < 4; k++) add(G.cyl(.008, .008, .2, 6), [C.red, C.yel, C.grn, '#ffd25a'][k], .7 + (k - 1.5) * .015, H + .2, -.16 + (k % 2) * .015, (k - 1.5) * .08, 0, 0);
    add(G.sph(.1, 12, 8), C.pink, -.82, H + .1, -.12, 0, 0, 0, [1.25, 1, 1]); add(G.cyl(.035, .035, .04, 8), '#f7b4c8', -.94, H + .1, -.12, 0, 0, HP);
    for (const [dx, dz] of [[-.06, -.06], [.06, -.06], [-.06, .06], [.06, .06]]) add(G.cyl(.022, .022, .05, 6), C.pink, -.82 + dx, H + .025, -.12 + dz);
    // 뒤: 할머니 의자(방석·뜨개 숄), 둥근 의자 위 라디오·보온병
    const cx = -.2, cz = -.78;
    add(G.box(.46, .06, .44, .02), C.woodD, cx, .46, cz); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(G.box(.05, .46, .05, .01), C.woodD, cx + sx * .19, .23, cz + sz * .18);
    add(G.box(.46, .5, .05, .02), C.woodD, cx, .78, cz - .2); add(G.box(.4, .07, .38, .04), '#c0587a', cx, .52, cz);
    add(G.box(.42, .4, .04, .03), '#f2c7a6', cx, .78, cz - .17, -.08, 0, 0); for (let k = 0; k < 4; k++) add(G.box(.43, .03, .045, .01), k % 2 ? '#e8a07c' : '#f6d7bc', cx, .64 + k * .09, cz - .165, -.08, 0, 0);
    add(G.cyl(.18, .18, .04, 14), C.woodL, .5, .48, -.8); add(G.cyl(.03, .03, .46, 8), C.woodD, .5, .23, -.8);
    add(G.cyl(.06, .06, .24, 12), '#e46f5e', .58, .62, -.86); add(G.cyl(.045, .045, .03, 12), '#f4f1e8', .58, .755, -.86);
  }));
  // 라디오 (스피커 망·주파수 창) · 진열 유리 속 구슬·지우개
  f.add(mc('st-radio', ({ add }) => { add(G.box(.28, .17, .12, .03), '#cfa978', .4, .585, -.76); add(G.cyl(.005, .005, .3, 6), C.metal, .52, .78, -.78, .3, 0, -.3); }));
  decal(f, .25, .13, radioTex(), .4, .585, -.698);
  decal(f, .86, .3, glassCaseTex(), x0 + .46, .42, D / 2 + .017);
  // 손님 쪽 서랍 (계산대 서랍)
  const dv = grp(); put(dv, x0 + .46, .82, D / 2 - .02); f.add(dv);
  dv.add(mc('st-cdrawer', ({ add }) => {
    add(G.box(.82, .02, .5, .01), C.woodL, 0, -.06, -.24); add(G.box(.82, .1, .02, .01), C.woodL, 0, 0, -.48); for (const s of [-1, 1]) add(G.box(.02, .1, .5, .01), C.woodL, s * .4, 0, -.24);
    add(G.box(.86, .14, .04, .02), C.woodD, 0, 0, .0); add(G.box(.16, .035, .04, .015), C.yel, 0, 0, .035);
  }));
  const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .36 * t; }, { label: '계산대 서랍', sfx: 'drawer', dur: .3 });
  f.spot('inside', dv, .05, -.045, -.22, { part: p, maxH: .12, scale: .9, label: '계산대 서랍' });
  f.spot('on', null, -.3, H, .13, { label: '계산대 위 동전 접시 옆', maxH: .45, scale: 1.2 });
  f.spot('on', null, .28, H, -.12, { label: '계산대 위 돋보기 옆', maxH: .45, scale: 1.1 });
  f.spot('on', null, -.2, .555, -.78, { label: '할머니 의자 방석 위', maxH: .4, scale: 1.1 });
  f.spot('under', null, -.2, .01, -.72, { label: '할머니 의자 밑', maxH: .4, scale: 1 });
  f.collideBox = [x0, 0, -D / 2, x0 + .8, H, D / 2];
};

// ── 크레파스 진열대 (뒷벽 가운데, +z 앞): 층층 비탈 칸에 크레파스 상자, 양옆 거대 크레파스, 위 이름판, 아래 서랍 ─────────────
B.st_crayonrack = f => {
  const W = 1.5, H = 1.8;
  f.add(mc('st-crayonrack', ({ add }) => {
    add(G.box(W, H, .08, .02), C.woodL, 0, H / 2, -.22); for (const s of [-1, 1]) add(G.box(.06, H, .5, .02), C.wood, s * (W / 2 - .03), H / 2, -.01);
    add(G.box(W, .42, .5, .02), C.wood, 0, .21, -.01);
    for (let k = 0; k < 4; k++) { const y = .5 + k * .32, z = .12 - k * .07; add(G.box(W - .12, .03, .3, .01), C.woodD, 0, y, z - .05, -.25, 0, 0); add(G.box(W - .12, .05, .02, .01), C.woodD, 0, y + .04, z + .1); }
    add(G.box(W + .06, .06, .54, .02), C.woodD, 0, H + .03, -.01);
    // 이름판 기둥 · 판
    for (const s of [-1, 1]) add(G.box(.05, .34, .05, .01), C.woodD, s * .55, H + .2, -.18);
    add(G.box(1.3, .36, .05, .03), C.yel, 0, H + .38, -.18);
    // 양옆 거대 크레파스 (빨강·파랑), 종이 띠
    for (const [s, col, col2] of [[-1, C.red, '#f07a66'], [1, C.blue, '#6fa0d8']]) {
      const x = s * (W / 2 + .17);
      add(G.cyl(.13, .13, 1.15, 14), col, x, .6, .05); add(G.cone(.13, .3, 14), col2, x, 1.32, .05);
      add(G.cyl(.133, .133, .5, 14), C.cream, x, .55, .05); add(G.cyl(.136, .136, .035, 14), C.ink, x, .32, .05); add(G.cyl(.136, .136, .035, 14), C.ink, x, .78, .05);
    }
    // 낱개 크레파스 몇 자루 (맨 아래 칸에 굴러다님)
    for (let k = 0; k < 5; k++) add(G.cyl(.022, .022, .16, 8), [C.red, C.yel, C.grn, C.purp, C.orng][k], -.5 + k * .09, .45, .2, 0, k * .7, HP);
  }));
  // 상자들: 칸마다 서 있는 크레파스 상자 앞면 (색마다)
  const cols = ['#4f86c6', '#e8604c', '#6cbf6a', '#9b7fd0', '#f39a3d', '#3d4a7a'];
  for (let k = 0; k < 4; k++) for (let i = 0; i < 5; i++) {
    if ((k === 1 && i === 3) || (k === 2 && i === 1)) continue;
    const y = .5 + k * .32, z = .12 - k * .07, x = -.56 + i * .28, ci = (i + k * 2) % cols.length;
    const b = grp(); put(b, x, y + .15, z, -.18, 0, 0); f.add(b);
    b.add(put(mesh(geo('st-cbox', () => new THREE.BoxGeometry(.22, .28, .05)), mat(cols[ci])), 0, 0, 0));
    b.add(put(flat(.22, .28, crayonBoxTex(ci, cols[ci], k % 2 ? '24색' : '12색')), 0, 0, .026));
  }
  { const t = TT('crayonsign', 512, 144, (c, W, H) => { c.fillStyle = C.yel; c.fillRect(0, 0, W, H); const cs = [C.red, C.orng, C.grn, C.blue, C.purp];
    for (let i = 0; i < 5; i++) { c.fillStyle = cs[i]; c.fillRect(18 + i * 14, 30, 10, 84); c.fillRect(W - 88 + i * 14, 30, 10, 84); }
    fitText(c, '크레파스', W / 2, H / 2, W * .6, 80, C.ink, { weight: 'bold' }); }); decal(f, 1.26, .34, t, 0, H + .38, -.152); }
  // 아래 서랍 (넓은 서랍)
  const dv = grp(); put(dv, 0, .21, .24); f.add(dv);
  dv.add(mc('st-crdrawer', ({ add }) => {
    add(G.box(1.2, .02, .4, .01), C.woodL, 0, -.12, -.2); add(G.box(1.2, .2, .02, .01), C.woodL, 0, -.03, -.4); for (const s of [-1, 1]) add(G.box(.02, .2, .42, .01), C.woodL, s * .59, -.03, -.2);
    add(G.box(1.28, .3, .04, .02), C.woodD, 0, 0, 0); add(G.box(.3, .05, .04, .02), C.yel, 0, .02, .035);
  }));
  const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .38 * t; }, { label: '크레파스 진열대 서랍', sfx: 'drawer', dur: .32 });
  f.spot('inside', dv, -.2, -.11, -.2, { part: p, maxH: .2, scale: 1.1, label: '크레파스 서랍 속' });
  f.spot('on', null, .28, .87, .12, { label: '크레파스 칸 빈자리', maxH: .3, scale: 1 });
  f.spot('on', null, -.28, 1.19, .05, { label: '크레파스 윗칸 빈자리', maxH: .3, scale: .95 });
  f.spot('behind', null, -.95, .01, .18, { label: '거대 크레파스 뒤', maxH: .35, scale: .9 });
};

// ── 노트·스티커 벽 (옆벽에 붙은 타공판, +z가 가게 쪽): 공책·스티커 판·딱지·종이인형·실내화 주머니, 선반 턱, 아래 상자 둘 ───────
// 스티커 앨범 판(part 0)을 들추면 뒤 벽감
B.st_stickerwall = f => {
  const W = 1.8, Y0 = .5, Y1 = 2.3;
  f.add(mc('st-stickerwall', ({ add }) => {
    add(G.box(W + .08, Y1 - Y0 + .08, .04, .02), C.woodD, 0, (Y0 + Y1) / 2, -.08);
    add(G.box(W, .04, .26, .01), C.woodL, 0, .98, .03); add(G.box(W, .05, .02, .01), C.woodD, 0, 1.0, .16);
    for (let k = 0; k < 14; k++) add(G.cyl(.008, .008, .1, 6), C.metalD, -.8 + k * .123, 1.9, -.03, HP, 0, 0);
    // 선반 턱 위: 구슬 병 · 지우개 상자 · 딱지 묶음
    add(G.cyl(.08, .08, .2, 14), '#d6ecf2', -.6, 1.1, .05); for (let k = 0; k < 7; k++) add(G.sph(.025, 8, 6), [C.red, C.blue, C.grn, C.yel][k % 4], -.6 + Math.cos(k) * .04, 1.04 + (k % 3) * .04, .05 + Math.sin(k) * .04);
    add(G.cyl(.085, .085, .03, 14), C.red, -.6, 1.215, .05);
    add(G.box(.26, .1, .18, .02), '#ffffff', -.25, 1.05, .05); for (let k = 0; k < 5; k++) add(G.box(.04, .03, .07, .01), [C.pink, C.blue, C.yel, C.grn, '#ffffff'][k], -.35 + k * .05, 1.115, .05);
    // 실내화 주머니 둘 (끈·고리)
    for (const [x, col] of [[.62, '#4f86c6'], [.82, '#e46f5e']]) { add(G.box(.18, .26, .05, .03), col, x, 1.6, .0); add(G.tor(.05, .01, PI, 4, 10), C.cream, x, 1.75, .0); add(G.box(.12, .08, .06, .02), C.cream, x, 1.55, .025); }
    // 아래: 딱지 상자 · 구슬 바구니 (바닥)
    add(G.box(.5, .3, .36, .03), '#c99a64', -.45, .15, .1); add(G.box(.52, .03, .38, .01), '#b4864e', -.45, .3, .1);
    add(G.cyl(.2, .17, .24, 16), '#e8c35a', .35, .12, .12); add(G.tor(.2, .02, PI * 2, 4, 16), '#c9a640', .35, .24, .12, HP, 0, 0);
    for (let k = 0; k < 9; k++) add(G.sph(.04, 8, 6), [C.red, C.blue, C.grn, C.yel, C.purp][k % 5], .35 + Math.cos(k * 1.7) * .1, .24, .12 + Math.sin(k * 1.7) * .1);
  }));
  // 타공판 · 걸린 것들 (그림 평면)
  decal(f, W, Y1 - Y0, rep(pegTex(), W / .8, (Y1 - Y0) / .8), 0, (Y0 + Y1) / 2, -.055);
  const hang = (map, w, h, x, y, rz = 0) => { const g = grp(); put(g, x, y, -.03, 0, 0, rz); g.add(put(mesh(geo(`st-card-${w}-${h}`, () => new THREE.BoxGeometry(w, h, .015)), mat('#f4efe4')), 0, 0, 0)); g.add(put(flat(w, h, map), 0, 0, .009)); f.add(g); return g; };
  [-.78, -.56, -.34].forEach((x, i) => hang(coverTex(i), .2, .27, x, 1.95 - (i % 2) * .03, (i - 1) * .05));
  [-.78, -.56].forEach((x, i) => hang(coverTex(i + 3), .2, .27, x + .1, 1.6, (i ? .04 : -.03)));
  [-.06, .18].forEach((x, i) => hang(stickerTex(i), .2, .27, x, 1.95, i ? -.04 : .03));
  hang(dollTex(), .24, .32, .62, 2.06, .02);
  for (let k = 0; k < 3; k++) hang(ddakjiTex(), .12, .12, -.06 + k * .14, 1.58, k * .4);
  hang(stickerTex(2), .18, .24, .32, 1.6, -.05);
  // 스티커 앨범 판 (들추면 벽감)
  const nook = grp(); f.add(nook);
  nook.add(mc('st-nook', ({ add }) => { add(G.box(.42, .04, .2, .01), C.woodD, .1, 2.07, .02); add(G.box(.42, .04, .2, .01), C.woodD, .1, 2.33, .02); for (const s of [-1, 1]) add(G.box(.03, .28, .2, .01), C.woodD, .1 + s * .2, 2.2, .02); }));
  const flap = grp(); put(flap, .1, 2.34, .13); f.add(flap);
  flap.add(put(mesh(geo('st-flap', () => new THREE.BoxGeometry(.44, .3, .02)), mat('#f7c6d0')), 0, -.15, 0));
  flap.add(put(flat(.4, .27, stickerTex(3)), 0, -.15, .011));
  const p = f.part('lift', flap, t => { flap.rotation.x = -1.6 * t; }, { label: '스티커 앨범 판', sfx: 'flip', dur: .45 });
  f.spot('inside', null, .1, 2.09, .02, { part: p, maxH: .22, scale: .9, label: '스티커 판 뒤 벽감' });
  f.spot('on', null, .45, 1.0, .05, { label: '스티커 벽 선반 턱', maxH: .35, scale: 1 });
  f.spot('on', null, -.45, .3, .1, { label: '딱지 상자 위', maxH: .35, scale: 1.1 });
  f.spot('on', null, .35, .2, .12, { label: '구슬 바구니 속', maxH: .3, scale: .95 });
};

// ── 불량식품 회전 진열대 (+z 앞): 네 면에 봉지가 줄줄이, 위에 '불량식품 100원' — 터치하면 반 바퀴 돌아 뒷면이 앞으로 ─────────
B.st_snackrack = f => {
  f.add(mc('st-snackbase', ({ add }) => { add(G.cyl(.36, .4, .08, 20), '#7d858c', 0, .04, 0); add(G.cyl(.03, .03, 1.6, 8), C.metalD, 0, .85, 0); }));
  const rack = grp(); f.add(rack);
  rack.add(mc('st-snackrack', ({ add }) => {
    for (let k = 0; k < 4; k++) { const a = k * HP; for (let j = 0; j < 3; j++) add(G.box(.5, .02, .03, .005), C.metal, Math.sin(a) * .27, .42 + j * .38, Math.cos(a) * .27, 0, a, 0); for (const s of [-1, 1]) add(G.box(.02, 1.2, .02, .005), C.metal, Math.sin(a) * .27 + Math.cos(a) * s * .25, 1.0, Math.cos(a) * .27 - Math.sin(a) * s * .25); }
    add(G.box(.56, .03, .56, .01), C.metalD, 0, .38, 0); add(G.box(.56, .03, .56, .01), C.metalD, 0, 1.62, 0);
    add(G.box(.5, .2, .03, .02), C.red, 0, 1.77, .0); add(G.box(.03, .2, .5, .02), C.red, 0, 1.77, .0);
  }));
  // 봉지: 면마다 두 줄, 이름 그림
  let n = 0;
  for (let k = 0; k < 4; k++) { const a = k * HP; for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) {
    if (k === 2 && j === 0) continue;
    const g = grp(), x = (i - .5) * .22; put(g, Math.sin(a) * .29 + Math.cos(a) * x, .58 + j * .38, Math.cos(a) * .29 - Math.sin(a) * x, 0, a, 0); rack.add(g);
    g.add(put(mesh(geo('st-snackbag', () => new THREE.BoxGeometry(.18, .24, .04)), mat(SNACKS[n % 6][1])), 0, 0, 0)); g.add(put(flat(.18, .24, snackTex(n % 6)), 0, 0, .021)); n++;
  } }
  { const t = TT('snacksign', 256, 96, (c, W, H) => { c.fillStyle = C.red; c.fillRect(0, 0, W, H); fitText(c, '불량식품', W / 2, H * .36, W * .82, 40, '#ffffff', { weight: 'bold' }); fitText(c, '100원', W / 2, H * .78, W * .5, 24, '#ffe14d', { weight: 'bold' }); });
    for (const [x, z, ry] of [[0, .017, 0], [.017, 0, HP], [0, -.017, PI], [-.017, 0, -HP]]) { const m = flat(.48, .18, t); put(m, x, 1.77, z, 0, ry, 0); rack.add(m); } }
  // 뒷면 아래 칸: 봉지 빠진 자리 (숨김)
  rack.add(mc('st-snackshelf', ({ add }) => add(G.box(.46, .025, .2, .005), C.metal, 0, .52, -.22)));
  const p = f.part('spin', rack, t => { rack.rotation.y = PI * t; }, { label: '불량식품 회전 진열대', sfx: 'gearUp', dur: .9 });
  f.spot('inside', rack, 0, .535, -.24, { part: p, maxH: .3, scale: 1.1, label: '회전 진열대 뒷면 칸' });
  f.spot('on', null, .0, .09, .32, { label: '회전 진열대 받침 앞', maxH: .35, scale: 1.1 });
  f.walkBoxes = [[-.4, 0, -.4, .4, 1.8, .4]]; f.walkSolids = f.walkBoxes;
};

// ── 뽑기 기계 줄 (가게 앞, +z 앞): 셋 중 가운데가 크고, 손잡이를 터치하면 드르륵 돌아 캡슐이 톡 ──────────────────────
const machine = (add, x, w, h, col, base) => {
  add(G.box(w + .04, base, .5, .03), '#d9d6cf', x, base / 2, 0);
  add(G.box(w, h, .44, .05), col, x, base + h / 2, 0); add(G.box(w + .04, .06, .48, .02), shade(col, -.15), x, base + h + .03, 0);
  add(G.box(w - .1, .05, .1, .02), '#ffffff', x, base + h * .3, .2); add(G.box(w - .16, .14, .14, .03), '#3e3b55', x, base + .1, .2);
  add(G.box(.08, .12, .03, .01), '#ffe14d', x + w * .3, base + h * .36, .225);
};
B.st_gacha = f => {
  const XS = [-.62, 0, .62], WS = [.5, .58, .5], HS = [.62, .74, .62], COL = ['#7fb3e0', '#f08aa8', '#9fd27c'], BASE = [.34, .34, .34];
  const mid = grp(); f.add(mid);
  f.add(mc('st-gacha-sides', ({ add }) => { for (const i of [0, 2]) machine(add, XS[i], WS[i], HS[i], COL[i], BASE[i]); for (const i of [0, 2]) add(G.cyl(.06, .06, .05, 14), '#ffffff', XS[i], BASE[i] + HS[i] * .36, .245, HP, 0, 0); }));
  mid.add(mc('st-gacha-mid', ({ add }) => machine(add, XS[1], WS[1], HS[1], COL[1], BASE[1])));
  for (const i of [0, 1, 2]) { decal(i === 1 ? mid : f, WS[i] - .1, HS[i] * .5, gachaTex(i), XS[i], BASE[i] + HS[i] * .66, .222); }
  for (const [i, w, s] of [[0, '뽑기', '500원'], [1, '뽑기', '500원'], [2, '뽑기', '500원']]) { const g = i === 1 ? mid : f; decal(g, WS[i] - .04, .2, plateTex('g' + i, w, ['#3d4a7a', '#c0457a', '#2e7a4a'][i], '#ffffff', s), XS[i], BASE[i] + HS[i] + .2, .1); g.add(mc('st-gplate' + i, ({ add }) => add(G.box(WS[i], .22, .03, .02), ['#3d4a7a', '#c0457a', '#2e7a4a'][i], XS[i], BASE[i] + HS[i] + .2, .08))); }
  // 가운데 손잡이 (크게) · 나오는 캡슐
  const knob = grp(); put(knob, 0, BASE[1] + HS[1] * .36, .25); f.add(knob);
  knob.add(mc('st-gknob', ({ add }) => { add(G.cyl(.09, .09, .06, 18), '#ffffff', 0, 0, 0, HP, 0, 0); add(G.box(.2, .05, .05, .02), C.yel, 0, 0, .04); }));
  const cap = grp(); put(cap, 0, BASE[1] + .25, .05); f.add(cap); cap.visible = false;
  cap.add(mc('st-gcapsule', ({ add }) => { add(G.sph(.075, 12, 8), '#ffffff', 0, 0, 0, 0, 0, 0, [1, .55, 1]); add(G.sph(.076, 12, 8), C.purp, 0, .015, 0, 0, 0, 0, [1, .5, 1]); }));
  const st = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  const p = f.part('lift', [mid, knob, cap], t => {
    knob.rotation.z = -PI * 2 * st(t, 0, .55); const c = st(t, .55, 1);
    cap.visible = t > .55; cap.position.z = .05 + .32 * c; cap.position.y = BASE[1] + .25 - .12 * Math.min(1, c * 1.3) + .06 * Math.sin(c * PI);
  }, { label: '뽑기 기계 손잡이', sfx: 'ratchet', dur: 1.2 });
  p.gptEndSfx = 'pop';
  f.spot('inside', null, 0, BASE[1] + .04, .2, { part: p, maxH: .12, scale: .9, label: '뽑기 캡슐 나오는 곳' });
  f.spot('on', null, -.62, BASE[0] + HS[0] + .06, -.05, { label: '파란 뽑기 기계 위', maxH: .35, scale: 1.1 });
  f.spot('on', null, .62, BASE[2] + HS[2] + .06, -.05, { label: '초록 뽑기 기계 위', maxH: .35, scale: 1.1 });
  f.spot('under', null, -.31, .01, .3, { label: '뽑기 기계 사이 바닥', maxH: .3, scale: .9 });
};

// ── 가게 앞 옛날 오락기 (+z 앞): 버튼을 터치하면 화면이 반짝 '1등' — 동전이 반환구로 톡 ───────────────────────────────
B.st_arcade = f => {
  const all = grp(); f.add(all);
  all.add(mc('st-arcade', ({ add }) => {
    add(G.box(.66, .76, .56, .04), C.navy, 0, .38, 0); add(G.box(.66, .5, .36, .04), C.navy, 0, 1.0, -.1);
    add(G.box(.68, .12, .62, .03), '#2c3660', 0, .02 + .06, 0);
    add(G.box(.66, .1, .3, .03), '#5b6aa6', 0, .8, .14, -.35, 0, 0);
    add(G.box(.7, .2, .44, .04), '#c0457a', 0, 1.38, -.08);
    for (const s of [-1, 1]) add(G.box(.04, .9, .4, .02), '#ff8fc8', s * .345, .9, -.12);
    add(G.cyl(.012, .012, .1, 8), C.ink, -.15, .89, .2); add(G.sph(.04, 10, 8), C.red, -.15, .95, .2);
    add(G.cyl(.035, .035, .03, 12), C.yel, .14, .86, .22, -.35, 0, 0);
    // 동전 투입구 · 반환구 컵
    add(G.box(.2, .3, .02, .02), '#2c3660', 0, .44, .29); add(G.box(.05, .08, .02, .01), C.yel, -.04, .5, .3); add(G.box(.11, .06, .06, .02), '#7d858c', .0, .3, .3);
    // 꼬마 의자
    add(G.cyl(.15, .15, .05, 14), C.red, .0, .36, .52); for (let k = 0; k < 3; k++) { const a = k * PI * 2 / 3; add(G.cyl(.015, .015, .36, 6), C.metalD, Math.cos(a) * .1, .18, .52 + Math.sin(a) * .1); }
  }));
  decal(all, .6, .14, marqueeTex(), 0, 1.38, .143, 0, { em: '#ff8fc8', ei: .5 });
  const scr = flat(.5, .36, screenTex(false), { em: '#2a3a7a', ei: .5 }); put(scr, 0, 1.03, .083, -.22, 0, 0); f.add(scr);
  const SCR0 = scr.material, SCR1 = mat('#ffffff', { map: screenTex(true), emissive: '#ffe08a', ei: .6, rim: .06 });
  const btn = grp(); put(btn, .14, .88, .2); f.add(btn);
  btn.add(mc('st-abtn', ({ add }) => add(G.cyl(.05, .05, .04, 12), C.orng, 0, 0, 0, -.35, 0, 0)));
  const coin = grp(); put(coin, 0, .4, .26); f.add(coin); coin.visible = false;
  coin.add(mc('st-acoin', ({ add }) => add(G.cyl(.04, .04, .01, 14), '#d9b54a', 0, 0, 0, HP, 0, 0)));
  const st = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  const p = f.part('lift', [all, btn, scr, coin], t => {
    btn.position.y = .88 - .02 * Math.sin(st(t, 0, .2) * PI);
    scr.material = t > .15 && t < .9 && Math.floor(t * 10) % 2 === 0 ? SCR1 : t >= .9 ? SCR1 : SCR0;
    const c = st(t, .6, 1); coin.visible = t > .6; coin.position.y = .4 - .08 * c; coin.position.z = .26 + .08 * c; coin.rotation.x = c * PI * 3;
  }, { label: '오락기 버튼', sfx: 'click', dur: 1.3 });
  p.gptEndSfx = 'coin';
  f.spot('inside', null, .0, .3, .3, { part: p, maxH: .1, scale: .8, label: '오락기 동전 반환구' });
  f.spot('on', null, .0, 1.48, -.08, { label: '오락기 꼭대기', maxH: .35, scale: 1.1 });
  f.spot('behind', null, .0, .01, -.4, { label: '오락기 뒤', maxH: .4, scale: .95 });
};

// ── '영업 중' 팻말 (받침대 위, 터치하면 빙글 — 뒷면에 낙서 '까꿍') ──────────────────────────────────────────────
B.st_flipsign = f => {
  f.add(mc('st-flipstand', ({ add }) => {
    add(G.cyl(.18, .22, .06, 14), C.poleD, 0, .03, 0); add(G.cyl(.03, .03, .78, 8), C.pole, 0, .43, 0);
    for (const s of [-1, 1]) add(G.box(.04, .58, .04, .01), C.pole, s * .47, 1.0, 0); add(G.box(.98, .04, .04, .01), C.pole, 0, .72, 0);
    add(G.cyl(.02, .02, .98, 8), C.metalD, 0, 1.28, 0, 0, 0, HP);
  }));
  const sg = grp(); put(sg, 0, 1.28, 0); f.add(sg);
  sg.add(put(mesh(geo('st-signboard', () => new THREE.BoxGeometry(.86, .52, .04)), mat('#e9e0c8')), 0, -.27, 0));
  sg.add(put(flat(.84, .5, flipTex(false)), 0, -.27, .021)); sg.add(put(flat(.84, .5, flipTex(true)), 0, -.27, -.021, 0, PI, 0));
  const p = f.part('flip', sg, t => { sg.rotation.x = -PI * t; }, { label: '영업 중 팻말', sfx: 'flip', dur: .6 });
  p.gptEndSfx = 'pop';
  f.spot('behind', null, .1, .01, -.25, { label: '팻말 받침 뒤', maxH: .35, scale: 1 });
};

// ── 평상 (가게 앞 낮은 나무 평상): 자는 고양이, 부채, 장기판 ───────────────────────────────────────────────
B.st_bench = f => {
  f.add(mc('st-bench', ({ add }) => {
    add(G.box(1.24, .07, .66, .02), C.woodL, 0, .38, 0); for (let k = 0; k < 7; k++) add(G.pbox(.012, .072, .64), C.woodD, -.54 + k * .18, .381, 0);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(G.box(.07, .35, .07, .02), C.woodD, sx * .55, .175, sz * .27);
    add(G.box(1.1, .04, .04, .01), C.woodD, 0, .12, .27); add(G.box(1.1, .04, .04, .01), C.woodD, 0, .12, -.27);
    // 고양이 (식빵 자세, 회청 줄무늬, 하얀 발)
    const cx = .3, cz = -.05, cy = .42;
    add(G.sph(.2, 14, 10), C.cat, cx, cy + .1, cz, 0, .3, 0, [1.3, .75, .95]); add(G.sph(.12, 12, 9), C.cat, cx + .22, cy + .16, cz + .04, 0, .3, 0);
    for (const s of [-1, 1]) add(G.cone(.045, .08, 6), C.catD, cx + .24 + s * -.02, cy + .27, cz + .04 + s * .06, 0, .3, 0);
    for (let k = 0; k < 3; k++) add(G.box(.025, .1, .3, .01), C.catD, cx - .1 + k * .1, cy + .2, cz, 0, .3, 0);
    add(G.sph(.04, 8, 6), '#ffffff', cx + .26, cy + .03, cz + .14); add(G.sph(.04, 8, 6), '#ffffff', cx + .18, cy + .03, cz + .16);
    add(G.cap(.03, .25, 3, 8), C.catD, cx - .18, cy + .04, cz + .14, 0, .3, HP);
    // 부채 · 장기판
    add(G.cyl(.14, .14, .01, 12, false), '#f4f1e8', -.38, .43, .12, 0, 0, 0, [1, 1, .9]); add(G.box(.025, .012, .16, .006), C.woodD, -.38, .43, .25);
    add(G.box(.32, .03, .3, .01), '#e7c27f', -.1, .43, -.15); for (const [dx, dz, c] of [[-.08, -.06, C.red], [.06, .04, '#2e7a4a'], [.0, -.1, C.red]]) add(G.cyl(.025, .025, .015, 8), c, -.1 + dx, .45, -.15 + dz);
  }));
  f.spot('on', null, -.45, .415, -.12, { label: '평상 위 부채 옆', maxH: .45, scale: 1.3 });
  f.spot('under', null, -.15, .01, .0, { label: '평상 밑', maxH: .3, scale: 1 });
};

// ── 학용품 박스 더미 (가게 뒤 오른쪽 구석): 위 상자는 날개가 열림 ─────────────────────────────────────────────
B.st_boxes = f => {
  f.add(mc('st-boxes', ({ add }) => {
    add(G.box(.56, .4, .44, .02), '#d7b07c', 0, .2, 0); add(G.box(.5, .34, .4, .02), '#c99a64', .02, .57, .0, 0, .08, 0);
    add(G.box(.44, .05, .36, .01), '#b4864e', .02, .74, .0, 0, .08, 0);
  }));
  decal(f, .54, .36, boxTex(0, '공책 100권'), 0, .2, .221); decal(f, .48, .3, boxTex(1, '연필'), .04, .57, .2 + .016, .08);
  const fl = grp(); put(fl, .02, .75, -.18); f.add(fl);
  fl.add(mc('st-boxflap', ({ add }) => add(G.box(.46, .015, .2, .005), '#d7b07c', 0, 0, .1)));
  const fr = grp(); put(fr, .02, .75, .2); f.add(fr);
  fr.add(mc('st-boxflap2', ({ add }) => add(G.box(.46, .015, .2, .005), '#d7b07c', 0, 0, -.1)));
  const p = f.part('lid', [fl, fr], t => { fl.rotation.x = -1.9 * t; fr.rotation.x = 1.9 * t; }, { label: '연필 상자 날개', sfx: 'rustle', dur: .4 });
  f.spot('inside', null, .02, .58, .0, { part: p, maxH: .2, scale: 1, label: '연필 상자 속' });
};

// ── 학용품 선반 (뒷벽 왼쪽, +z 앞): 공책 더미·필통·지구본·리코더·탬버린·줄넘기·스케치북·물감, 아래 서랍 둘 ───────────────
B.st_shelf = f => {
  const W = 1.55, H = 2.0, D = .4;
  f.add(mc('st-shelf', ({ add, tube }) => {
    for (const s of [-1, 1]) add(G.box(.05, H, D, .02), C.wood, s * (W / 2 - .025), H / 2, 0); add(G.box(W, H, .03, .01), C.woodL, 0, H / 2, -D / 2 + .015);
    for (const y of [.42, .9, 1.38, 1.86]) add(G.box(W - .06, .04, D - .02, .01), C.wood, 0, y, 0); add(G.box(W, .05, D, .01), C.woodD, 0, H, 0);
    // 1단: 공책 더미 셋 · 필통 둘
    for (let k = 0; k < 3; k++) for (let j = 0; j < 4 + k; j++) add(G.box(.2, .022, .27, .004), ['#9fd3e0', '#f7c6d0', '#cfe6b8', '#ffe2a0'][(j + k) % 4], -.55 + k * .24, .45 + j * .024, .02, 0, (j % 2 - .5) * .06, 0);
    add(G.box(.22, .07, .08, .03), C.blue, .2, .475, .05); add(G.box(.22, .07, .08, .03), C.pink, .45, .475, .05);
    // 2단: 지구본 · 스케치북 · 물감 상자
    add(G.cyl(.08, .1, .03, 12), C.woodD, -.5, .935, 0); add(G.cyl(.01, .01, .1, 6), C.woodD, -.5, .98, 0); add(G.sph(.15, 16, 12), '#7cc0e8', -.5, 1.13, 0);
    for (const [dx, dy, s] of [[-.06, .05, .07], [.05, -.04, .06], [.02, .1, .04]]) add(G.sph(s, 8, 6), '#7cc06a', -.5 + dx, 1.13 + dy, .1, 0, 0, 0, [1, 1, .6]);
    add(G.tor(.16, .01, PI, 4, 16), C.metalD, -.5, 1.13, 0, 0, HP, 0);
    for (let k = 0; k < 5; k++) add(G.box(.03, .34, .26, .005), k % 2 ? '#fbf8f0' : '#e4d8c0', -.1 + k * .035, 1.09, 0);
    add(G.box(.32, .08, .22, .02), '#ffffff', .35, .96, .03); for (let k = 0; k < 6; k++) add(G.box(.035, .02, .05, .006), [C.red, C.orng, C.yel, C.grn, C.blue, C.purp][k], .23 + k * .045, 1.0, .07);
    // 3단: 리코더 둘 · 탬버린 · 캐스터네츠
    for (const x of [-.6, -.52]) { add(G.cyl(.02, .025, .38, 10), '#f4efe4', x, 1.6, .05, 0, 0, .1); add(G.cyl(.026, .026, .04, 10), '#8a6040', x - .02, 1.78, .05, 0, 0, .1); }
    add(G.cyl(.14, .14, .05, 18, true), '#e9c48a', -.15, 1.55, .0, HP - .25, 0, 0); add(G.cyl(.13, .13, .005, 18), '#fbf3e0', -.15, 1.55, .0, HP - .25, 0, 0);
    for (let k = 0; k < 4; k++) { const a = k * HP; add(G.cyl(.025, .025, .01, 8), '#d9b54a', -.15 + Math.cos(a) * .14, 1.55 + Math.sin(a) * .135, .0 + Math.sin(a) * .03, HP, 0, 0); }
    add(G.sph(.05, 8, 6), C.red, .25, 1.44, .05, 0, 0, 0, [1, .5, 1]); add(G.sph(.05, 8, 6), C.blue, .37, 1.44, .05, 0, 0, 0, [1, .5, 1]);
    // 4단: 줄넘기 둘(손잡이) · 색종이 묶음
    for (const [x, c] of [[-.45, C.red], [-.2, C.grn]]) { add(G.cyl(.025, .025, .14, 8), c, x, 1.95, .02, 0, 0, HP); add(G.cyl(.025, .025, .14, 8), c, x + .12, 1.95, .02, 0, 0, HP); tube([x + .07, 1.95, .02], [x + .05, 1.9, .09], .008, '#f4f1e8'); }
    for (let k = 0; k < 6; k++) add(G.box(.2, .008, .2, .002), [C.red, C.orng, C.yel, C.grn, C.blue, C.purp][k], .3, 1.89 + k * .009, .02, 0, k * .05, 0);
  }));
  // 아래 서랍 둘 (나란히)
  const parts = [];
  for (const [i, x] of [[0, -.37], [1, .37]]) {
    const dv = grp(); put(dv, x, .2, D / 2 - .02); f.add(dv);
    dv.add(mc('st-shdrawer', ({ add }) => {
      add(G.box(.62, .02, .32, .01), C.woodL, 0, -.13, -.16); add(G.box(.62, .22, .02, .01), C.woodL, 0, -.04, -.32); for (const s of [-1, 1]) add(G.box(.02, .22, .34, .01), C.woodL, s * .3, -.04, -.16);
      add(G.box(.7, .36, .04, .02), C.woodD, 0, 0, 0); add(G.box(.18, .04, .04, .015), C.yel, 0, .04, .035);
    }));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .3 * t; }, { label: `학용품 선반 서랍 ${i + 1}`, sfx: 'drawer', dur: .3 });
    f.spot('inside', dv, 0, -.12, -.15, { part: p, maxH: .18, scale: 1, label: `학용품 서랍 ${i + 1}칸` }); parts.push(p);
  }
  f.spot('on', null, .52, .44, .05, { label: '선반 아래칸 필통 옆', maxH: .4, scale: 1 });
  f.spot('on', null, .6, 1.4, .05, { label: '선반 셋째 칸', maxH: .4, scale: 1 });
};

export const ST_BUILDERS = B;
export const ST_INFO = {
  st_shop: { w: 7, d: 5.5, name: '밤의 문구점 단면', price: 0, hidden: true, floor: true },
  st_shutter: { w: 2, d: 1, name: '반쯤 내린 창고 셔터', price: 0, hidden: true },
  st_streetlamp: { w: 1, d: 1, name: '문구점 앞 가로등', price: 0, hidden: true },
  st_shutterlever: { w: 1, d: 1, name: '셔터 레버', price: 0, hidden: true },
  st_safe: { w: 1, d: 1, name: '계산대 밑 금고', price: 0, hidden: true },
  st_counter: { w: 2, d: 1, name: '문방구 계산대', price: 0, hidden: true },
  st_crayonrack: { w: 2, d: 1, name: '크레파스 진열대', price: 0, hidden: true },
  st_stickerwall: { w: 2, d: 1, name: '노트·스티커 벽', price: 0, hidden: true },
  st_snackrack: { w: 1, d: 1, name: '불량식품 회전 진열대', price: 0, hidden: true },
  st_gacha: { w: 2, d: 1, name: '뽑기 기계 줄', price: 0, hidden: true },
  st_arcade: { w: 1, d: 1, name: '옛날 오락기', price: 0, hidden: true },
  st_flipsign: { w: 1, d: 1, name: '영업 중 팻말', price: 0, hidden: true },
  st_bench: { w: 1, d: 1, name: '가게 앞 평상', price: 0, hidden: true },
  st_boxes: { w: 1, d: 1, name: '학용품 박스 더미', price: 0, hidden: true },
  st_shelf: { w: 2, d: 1, name: '학용품 선반', price: 0, hidden: true },
};

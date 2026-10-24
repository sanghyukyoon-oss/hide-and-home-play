// 36판 새 안 '밤의 문구점' stationery (⑨ 10/23 — 상가 장 새 맵, _handoff/redo-34to70-order-1023.md; 판 36 · 숨은그림 · 밤 · 삐딱이).
// 동네 문구점 한 채를 앞면만 잘라 낸 실루엣 단면 + 가게 앞 보도(연석 턱) + 아래 찻길 조금 + 두꺼운 층진 둥근 섬 받침.
// 모티프 다섯이 판을 이끌고, 작은 생활 디테일은 벽·바닥·가장자리에:
//   ① 가게 앞 뽑기 기계 줄(st_gacha)  ② 불량식품 회전 진열대(st_snackrack)  ③ 가게 앞 옛날 오락기 한 대(st_arcade)
//   ④ 노트·스티커 벽(st_stickerwall)과 크레파스 진열대(st_crayonrack — 끝 장면이 그 앞에서)  ⑤ 반쯤 내린 창고 셔터(st_shutter)
// 거대 소품이 건물의 일부: 가게 앞 모서리 기둥은 거대 연필, 지붕 간판 옆엔 거대 크레파스.
// 장치 연쇄(설계서 36, gpt-chains.js CHAINS.stationery): 가로등 스위치(st_streetlamp 0) → 셔터에 숫자 그림자 = 계산대 밑 금고(st_safe) 비밀번호
//   → 금고 속 레버 손잡이 → 셔터 레버(st_shutterlever 0): 톱니가 돌고 셔터가 말려 올라가며(st_shutter 0) → 창고 안 열쇠 트레이가 쑥.
// 판 안 장치는 모두 '터치하면 저절로 끝까지'(설계서 원칙 8). 글자는 게임 폰트(gpt-paper fitText, 한·영).
// (10/24 디테일 다시 — 사용자 36 '디테일이 제일 실망': 뽑기 셋은 투명 돔·캡슐 알알이·다이얼·나오는 곳 뚜껑·광고 스티커, 오락기는 옛 업소용 옆모습·베젤 화면·조이스틱·동전 문,
//  평상은 판자 결·이음·방석에 웅크려 자는 고양이, 가로등 딱지 판은 진짜 딱지 여섯, 회전 진열대 간판 한 장, 바퀴 달린 분리수거함, 진짜 화분·텃밭, 빛은 전구 바로 밑)
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
  // 숨김 자리 이름 (영어 모드)
  '셔터 앞 보도': 'Sidewalk by the shutter',
  '가게 앞 보도': 'Sidewalk by the shop',
  '하수 덮개 옆': 'By the drain cover',
  '텃밭 상자 속': 'In the planter box',
  '우산꽂이 위': 'On the umbrella stand',
  '반쯤 내린 셔터': 'Half-down shutter',
  '셔터 뒤 가게 열쇠 트레이': 'Shop key tray behind the shutter',
  '가로등 스위치': 'Streetlamp switch',
  '셔터 레버': 'Shutter lever',
  '계산대 밑 금고': 'Safe under the counter',
  '금고 안 바닥': 'Safe floor',
  '금고 안 선반': 'Safe shelf',
  '계산대 서랍': 'Counter drawer',
  '계산대 위 동전 접시 옆': 'By the coin tray on the counter',
  '계산대 위 돋보기 옆': 'By the magnifier on the counter',
  '할머니 의자 방석 위': "On Grandma's chair cushion",
  '할머니 의자 밑': "Under Grandma's chair",
  '크레파스 진열대 서랍': 'Crayon stand drawer',
  '크레파스 서랍 속': 'In the crayon drawer',
  '크레파스 칸 빈자리': 'Gap in the crayon rack',
  '크레파스 윗칸 빈자리': 'Gap on the top crayon shelf',
  '거대 크레파스 뒤': 'Behind the giant crayon',
  '스티커 앨범 판': 'Sticker album board',
  '스티커 판 뒤 벽감': 'Nook behind the sticker board',
  '스티커 벽 선반 턱': 'Sticker wall ledge',
  '딱지 상자 위': 'On the ddakji box',
  '구슬 바구니 속': 'In the marble basket',
  '불량식품 회전 진열대': 'Penny candy spinner',
  '회전 진열대 뒷면 칸': 'Back of the spinner',
  '회전 진열대 받침 앞': 'By the spinner base',
  '뽑기 기계 손잡이': 'Capsule machine dial',
  '뽑기 캡슐 나오는 곳': 'Capsule chute',
  '파란 뽑기 기계 위': 'On the blue capsule machine',
  '초록 뽑기 기계 위': 'On the green capsule machine',
  '뽑기 기계 사이 바닥': 'Between the capsule machines',
  '오락기 버튼': 'Arcade buttons',
  '오락기 동전 반환구': 'Arcade coin return',
  '오락기 꼭대기': 'On top of the arcade',
  '오락기 뒤': 'Behind the arcade',
  '영업 중 팻말': 'Open sign',
  '팻말 받침 뒤': 'Behind the sign stand',
  '평상 위 부채 옆': 'By the fan on the bench',
  '연필 상자 날개': 'Pencil box flap',
  '연필 상자 속': 'In the pencil box',
  '선반 아래칸 필통 옆': 'By the pencil case, low shelf',
  '평상 밑': 'Under the bench',
  '분리수거함 뒤': 'Behind the recycling bins',
  '선반 셋째 칸': 'Third shelf',
  '몽글문구': 'Mongle Stationery', '학용품 · 완구 · 팬시': 'School · Toys · Fancy', '크레파스': 'Crayons', '24색': '24 colors', '12색': '12 colors',
  '불량식품': 'Penny Candy', '100원': '100 won', '뽑기': 'Capsules', '500원': '500 won', '오락': 'Arcade', '까꿍': 'Peekaboo',
  '쫀드기': 'Chewy Strip', '아폴로': 'Apollo', '밭두렁': 'Rice Puffs', '꾀돌이': 'Smarty', '쥐포': 'Fish Jerky', '별사탕': 'Star Candy',
  '공책': 'Notebook', '종이인형': 'Paper Dolls', '딱지': 'Ddakji', '스티커': 'Stickers', '신학기 준비물': 'Back to School', '학용품 도매': 'School Supplies',
  '공책 100권': '100 Notebooks', '태권도': 'Taekwondo', '피아노': 'Piano', '원생 모집': 'Join us', '외상 사절': 'No credit', '1등': '1st',
  '오늘 일찍 닫아요': 'Closing early', '준비 중': 'Closed', '고장': 'Broken', '연필': 'Pencils', '지우개': 'Erasers',
  '신상!': 'New!', '1장 100원': '100 won each', '재활용': 'Recycling', '일반쓰레기': 'Trash', '스케치북': 'Sketchbook', '물감': 'Paints',
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
// 크레파스 상자 앞면: 색 상자에 크림 이름 띠, 창으로 보이는 크레파스(종이 띠·뾰족 끝), 아래 '24색' 동그란 표
const crayonBoxTex = (k, col, n) => TT('cbox2' + k + n, 128, 176, (c, W, H) => {
  c.fillStyle = col; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, 0, 8, H);
  c.fillStyle = C.cream; roundRect(c, 8, 8, W - 16, 38, 10); c.fill(); fitText(c, '크레파스', W / 2, 27, W - 28, 20, C.ink, { weight: 'bold' });
  c.fillStyle = '#fbf8f0'; roundRect(c, 12, 54, W - 24, 78, 8); c.fill();
  const cs = ['#e8604c', '#f39a3d', '#ffcf48', '#6cbf6a', '#4f86c6', '#9b7fd0', '#f39ab4', '#7a5a43'];
  for (let i = 0; i < 8; i++) { const x = 17 + i * 12.4, cc = cs[(i + k) % 8];
    c.fillStyle = cc; c.fillRect(x, 70, 10, 58); c.beginPath(); c.moveTo(x, 70); c.lineTo(x + 5, 58); c.lineTo(x + 10, 70); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(x, 92, 10, 22); c.fillStyle = cc; c.fillRect(x + 2, 100, 6, 2); c.fillRect(x + 2, 105, 6, 2); }
  c.strokeStyle = 'rgba(60,40,30,.35)'; c.lineWidth = 2; roundRect(c, 12, 54, W - 24, 78, 8); c.stroke();
  c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(W / 2, 154, 17, 0, 7); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 2; c.stroke(); fitText(c, n, W / 2, 154, 30, 14, C.ink, { weight: 'bold' });
});
// 불량식품 봉지: 위아래 톱니 이음, 사선 반짝이, 이름(흰 테 굵은 글씨), 아래 과자 그림, 오른쪽 위 '100원' 동그라미
const SNACKS = [['쫀드기', '#f39a3d'], ['아폴로', '#4f86c6'], ['밭두렁', '#ffcf48'], ['꾀돌이', '#e8604c'], ['쥐포', '#c79a6a'], ['별사탕', '#f39ab4']];
const snackTex = i => TT('snack2' + i, 128, 176, (c, W, H) => {
  const [n, col] = SNACKS[i % SNACKS.length], k = i % SNACKS.length;
  c.fillStyle = col; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(0, 60); c.lineTo(W, 20); c.lineTo(W, 44); c.lineTo(0, 84); c.fill();
  for (const y of [0, H - 16]) { c.fillStyle = shade(col, .18); c.fillRect(0, y, W, 16); c.fillStyle = shade(col, -.12); for (let x = 0; x < W; x += 8) { c.beginPath(); c.moveTo(x, y + (y ? 16 : 0)); c.lineTo(x + 4, y + 8); c.lineTo(x + 8, y + (y ? 16 : 0)); c.fill(); } }
  fitText(c, n, W / 2, 62, W - 18, 34, '#ffffff', { weight: 'bold', stroke: shade(col, -.3), sw: 6 });
  const cx = W / 2, cy = 116;
  c.fillStyle = '#fff6e4'; c.beginPath(); c.ellipse(cx, cy, 40, 26, 0, 0, 7); c.fill();
  if (k === 0) { for (let j = 0; j < 3; j++) { c.fillStyle = ['#e8604c', '#ffcf48', '#6cbf6a'][j]; c.fillRect(cx - 30, cy - 14 + j * 10, 60, 7); } }
  else if (k === 1) { for (let j = 0; j < 5; j++) { c.fillStyle = ['#ff8fc8', '#ffe14d', '#7cf0ff', '#b4f07c', '#ffb36b'][j]; c.fillRect(cx - 28 + j * 12, cy - 16, 8, 32); c.fillStyle = '#ffffff'; c.fillRect(cx - 28 + j * 12, cy - 16, 8, 5); } }
  else if (k === 2) { c.fillStyle = '#e6b45a'; for (let j = 0; j < 7; j++) { c.beginPath(); c.ellipse(cx - 24 + (j % 4) * 16, cy - 8 + Math.floor(j / 4) * 16, 9, 6, j, 0, 7); c.fill(); } }
  else if (k === 3) { for (let j = 0; j < 9; j++) { c.fillStyle = ['#c98a3a', '#e8604c', '#ffcf48'][j % 3]; c.beginPath(); c.arc(cx - 24 + (j % 5) * 12, cy - 6 + Math.floor(j / 5) * 14, 5, 0, 7); c.fill(); } }
  else if (k === 4) { c.fillStyle = '#b07a4a'; c.beginPath(); c.ellipse(cx - 4, cy, 28, 14, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(cx + 20, cy); c.lineTo(cx + 36, cy - 12); c.lineTo(cx + 36, cy + 12); c.fill(); c.fillStyle = C.ink; c.beginPath(); c.arc(cx - 20, cy - 3, 3, 0, 7); c.fill(); }
  else { for (let j = 0; j < 6; j++) { const x = cx - 24 + (j % 3) * 24, y = cy - 8 + Math.floor(j / 3) * 16; c.fillStyle = ['#ffffff', '#ffe14d', '#ff8fc8'][j % 3]; c.beginPath(); for (let q = 0; q < 10; q++) { const rr = q % 2 ? 3 : 8, t = -HP + q * PI / 5; c.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr); } c.fill(); } }
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(W - 22, 28, 15, 0, 7); c.fill(); c.strokeStyle = C.red; c.lineWidth = 2; c.stroke(); fitText(c, '100원', W - 22, 28, 24, 10, C.red, { weight: 'bold' });
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
// 딱지: 두 장을 엇갈려 접은 바람개비 앞면 — 날개 넷(두 색 번갈아)이 가운데 작은 네모를 감싸고, 날개 사이로 아래 장이 비침, 접힌 금, 옛 달력 종이 무늬
const DDAK = [['#4f86c6', '#e8604c'], ['#2e7a4a', '#ffcf48'], ['#9b7fd0', '#f39ab4'], ['#3d4a7a', '#f39a3d'], ['#e8604c', '#fff6e4'], ['#6cbf6a', '#4f86c6']];
const ddakjiTex = (k = 0) => T('ddakji' + k, 128, 128, (c, W, H) => {
  const [a, b] = DDAK[k % DDAK.length], m = W / 2, q = 15;
  const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); };
  c.fillStyle = shade(b, -.12); c.fillRect(0, 0, W, H);
  const fl = [[[0, 0], [W, 0], [m + q, m - q]], [[W, 0], [W, H], [m + q, m + q]], [[W, H], [0, H], [m - q, m + q]], [[0, H], [0, 0], [m - q, m - q]]];
  fl.forEach((p, i) => poly(p, i % 2 ? b : a));
  c.save(); c.globalAlpha = .22; c.strokeStyle = '#ffffff'; c.lineWidth = 3;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(14 + i * 9, 10); c.lineTo(60 + i * 4, 10 + i * 4); c.stroke(); } c.restore();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.font = 'bold 16px sans-serif'; c.textAlign = 'center'; c.fillText(String(12 + k * 7), W * .78, H * .3);
  poly([[m - q, m - q], [m + q, m - q], [m + q, m + q], [m - q, m + q]], b === '#fff6e4' ? a : '#fff6e4');
  c.fillStyle = k % 2 ? C.red : C.blue; c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 4 : 10, t = -HP + i * PI / 5; c.lineTo(m + Math.cos(t) * rr, m + Math.sin(t) * rr); } c.fill();
  c.strokeStyle = 'rgba(40,30,30,.55)'; c.lineWidth = 2.2; fl.forEach(p => { c.beginPath(); c.moveTo(...p[0]); c.lineTo(...p[2]); c.lineTo(...p[1]); c.stroke(); });
  c.strokeRect(m - q, m - q, q * 2, q * 2); c.lineWidth = 5; c.strokeStyle = 'rgba(40,30,30,.6)'; c.strokeRect(2, 2, W - 4, H - 4);
});
// 딱지 판 바탕: 크림 판, 위 빨간 머리띠 '딱지', 아래 가격 띠 '1장 100원', 가운데 꽂힌 자리 연필 금
const ddakjiBoardTex = () => TT('ddakboard', 192, 256, (c, W, H) => {
  paperFill(c, W, H, '#f6ecd4', 9); c.fillStyle = C.red; roundRect(c, 8, 8, W - 16, 52, 12); c.fill();
  fitText(c, '딱지', W / 2, 35, W - 40, 40, '#ffffff', { weight: 'bold', stroke: '#a83a2c', sw: 5 });
  c.fillStyle = '#ffe14d'; roundRect(c, 20, H - 50, W - 40, 38, 10); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 2; roundRect(c, 20, H - 50, W - 40, 38, 10); c.stroke();
  fitText(c, '1장 100원', W / 2, H - 31, W - 56, 24, C.ink, { weight: 'bold' });
  c.strokeStyle = 'rgba(120,90,60,.25)'; c.setLineDash([4, 4]); for (const y of [70, 132]) { c.beginPath(); c.moveTo(14, y); c.lineTo(W - 14, y); c.stroke(); } c.setLineDash([]);
});
// 뽑기 기계 앞판: 몸 색 바탕, 위 흰 둥근 이름판 '뽑기', 손잡이 자리 밝은 원, 동전 넣는 곳 위 노란 별 가격 '500원', 아래 캡슐 그림 띠
const GCOL = ['#6fa8dc', '#ef7fa4', '#8fcb6c'];
const gachaFaceTex = k => TT('gface' + k, 256, 256, (c, W, H) => {
  const col = GCOL[k], g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, shade(col, .07)); g.addColorStop(1, shade(col, -.05)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(10, 0, 10, H);
  c.fillStyle = '#ffffff'; roundRect(c, 16, 10, W - 32, 62, 24); c.fill(); c.strokeStyle = shade(col, -.22); c.lineWidth = 5; roundRect(c, 16, 10, W - 32, 62, 24); c.stroke();
  fitText(c, '뽑기', W / 2, 42, W - 90, 46, C.red, { weight: 'bold', stroke: '#ffffff', sw: 4 });
  for (const [x, cc] of [[34, C.yel], [W - 34, C.blue]]) { c.fillStyle = cc; c.beginPath(); c.arc(x, 41, 9, PI, 0); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, 41, 9, 0, PI); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.beginPath(); c.arc(x, 41, 9, 0, 7); c.stroke(); }
  c.fillStyle = shade(col, .16); c.beginPath(); c.arc(W * .42, H * .5, 50, 0, 7); c.fill(); c.strokeStyle = shade(col, -.14); c.lineWidth = 4; c.stroke();
  const sx = W * .8, sy = H * .3; c.fillStyle = '#ffe14d'; c.beginPath(); for (let i = 0; i < 16; i++) { const rr = i % 2 ? 22 : 31, t = -HP + i * PI / 8; c.lineTo(sx + Math.cos(t) * rr, sy + Math.sin(t) * rr); } c.closePath(); c.fill();
  c.strokeStyle = '#c99a20'; c.lineWidth = 2; c.stroke(); fitText(c, '500원', sx, sy, 40, 17, C.red, { weight: 'bold' });
  c.fillStyle = 'rgba(40,30,50,.18)'; c.fillRect(0, H - 30, W, 30);
  const cs = [C.red, C.yel, C.purp, C.grn, C.orng]; for (let i = 0; i < 5; i++) { const x = 30 + i * 49; c.fillStyle = cs[i]; c.beginPath(); c.arc(x, H - 15, 9, PI, 0); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, H - 15, 9, 0, PI); c.fill(); }
});
// 뽑기 기계 옆 광고 스티커: 열린 캡슐에서 몽글이 장난감이 퐁 — '신상!' 별, 반짝이
const gachaSideTex = k => TT('gside' + k, 256, 256, (c, W, H) => {
  const bg = ['#fff3c4', '#e2f4ff', '#ffe4ee'][k], cap = [C.red, C.purp, C.blue][k];
  c.fillStyle = '#ffffff'; roundRect(c, 4, 4, W - 8, H - 8, 30); c.fill(); c.fillStyle = bg; roundRect(c, 14, 14, W - 28, H - 28, 24); c.fill();
  c.save(); c.translate(W * .5, H * .66); c.rotate(-.2);
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, 62, 0, PI); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 4; c.stroke();
  c.fillStyle = cap; c.beginPath(); c.arc(-30, -70, 58, PI, 0); c.fill(); c.stroke(); c.restore();
  const mx = W * .52, my = H * .5; c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(mx, my, 42, 36, 0, 0, 7); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 4; c.stroke();
  c.fillStyle = '#ffffff'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(mx + s * 26, my - 30, 11, 15, s * .4, 0, 7); c.fill(); c.stroke(); }
  c.fillStyle = C.ink; for (const s of [-1, 1]) { c.beginPath(); c.arc(mx + s * 14, my - 4, 4.5, 0, 7); c.fill(); }
  c.fillStyle = '#ffb3c4'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(mx + s * 24, my + 8, 7, 4, 0, 0, 7); c.fill(); }
  c.strokeStyle = C.ink; c.lineWidth = 3; c.beginPath(); c.arc(mx, my + 6, 6, .2, PI - .2); c.stroke();
  c.fillStyle = '#ffe14d'; for (const [x, y, r] of [[40, 120, 10], [214, 96, 8], [200, 190, 7]]) { c.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .4 : r, t = i * PI / 4; c.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr); } c.fill(); }
  c.save(); c.translate(70, 54); c.rotate(-.18); c.fillStyle = C.red; c.beginPath(); for (let i = 0; i < 20; i++) { const rr = i % 2 ? 30 : 42, t = i * PI / 10; c.lineTo(Math.cos(t) * rr * 1.25, Math.sin(t) * rr); } c.closePath(); c.fill();
  fitText(c, '신상!', 0, 0, 74, 30, '#ffffff', { weight: 'bold' }); c.restore();
});
// 오락기 화면: 남보라 우주, 위 점수 줄, 외계인 두 줄·방패·몽글이 우주선과 총알 — 반짝일 땐 '1등' 꽃가루
const screenTex = flash => T('scr2' + (flash ? 1 : 0), 192, 144, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, flash ? '#fff6c0' : '#10183f'); g.addColorStop(1, flash ? '#ffd9e8' : '#2a2160'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (flash) { fitText(c, '1등', W / 2, H * .46, W * .5, 54, C.red, { weight: 'bold', stroke: '#ffffff', sw: 6 }); const r = rnd(44);
    for (let i = 0; i < 40; i++) { c.fillStyle = [C.red, C.blue, C.grn, C.orng, C.purp][i % 5]; c.fillRect(r() * W, r() * H, 5, 3); } fitText(c, 'HIGH SCORE!', W / 2, H * .82, W * .7, 16, C.navy, { weight: 'bold' }); return; }
  const r = rnd(41); c.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) c.fillRect(r() * W, 16 + r() * (H - 16), 1.5, 1.5);
  c.font = 'bold 11px monospace'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#ffffff'; c.fillText('SCORE 01200', 6, 8); c.fillStyle = '#ffe14d'; c.textAlign = 'right'; c.fillText('HI 50000', W - 6, 8);
  const px = (x, y, rows, col, s = 3) => { c.fillStyle = col; rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') c.fillRect(x + i * s, y + j * s, s, s); })); };
  const inv = ['..#...#..', '...###...', '..#####..', '.##.#.##.', '#########', '#.#...#.#'], inv2 = ['...##...', '..####..', '.##..##.', '########', '.#.##.#.', '#......#'];
  for (let i = 0; i < 5; i++) px(14 + i * 34, 24, inv, ['#7cf0ff', '#ff8fc8', '#b4f07c', '#ffd27a', '#c9a6ff'][i]);
  for (let i = 0; i < 5; i++) px(18 + i * 34, 48, inv2, '#ff9a6a');
  for (let i = 0; i < 3; i++) px(22 + i * 60, 100, ['.######.', '########', '##....##'], '#6cdf7a', 3);
  px(84, 120, ['....#....', '...###...', '.#######.', '#########', '##.#.#.##'], '#ffe14d');
  c.fillStyle = '#ffffff'; c.fillRect(96, 92, 2, 10); c.fillStyle = '#ff6a6a'; c.fillRect(60, 70, 2, 8);
  c.fillStyle = '#6cdf7a'; c.fillRect(0, H - 3, W, 3);
});
const marqueeTex = () => TT('marq2', 256, 72, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#ff8fc8'); g.addColorStop(.5, '#ffd0e6'); g.addColorStop(1, '#ffb36b'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#fff6c8'; for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(8 + i * 16, 6, 3, 0, 7); c.arc(8 + i * 16, H - 6, 3, 0, 7); c.fill(); }
  fitText(c, '오락', W / 2, H / 2, W * .5, 44, '#ffffff', { weight: 'bold', stroke: '#c0457a', sw: 7 });
  for (const s of [-1, 1]) { const x = W / 2 + s * 84, y = H / 2; c.fillStyle = '#ffe14d'; c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 6 : 15, t = -HP + i * PI / 5; c.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr); } c.fill(); }
});
// 오락기 조작판 그림: 짙은 남색에 노란 번개 띠, '1P'·'START' 글씨
const panelTex = () => TT('apanel', 256, 112, (c, W, H) => {
  c.fillStyle = '#28305e'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffcf48'; c.beginPath(); c.moveTo(0, H * .78); c.lineTo(W * .4, H * .62); c.lineTo(W * .5, H * .74); c.lineTo(W, H * .55); c.lineTo(W, H * .66); c.lineTo(W * .52, H * .86); c.lineTo(W * .42, H * .74); c.lineTo(0, H * .9); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; c.beginPath(); c.arc(W * .3, H * .42, 26, 0, 7); c.stroke();
  c.font = 'bold 16px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffffff'; c.fillText('1P', W * .3, H * .1 + 4); c.fillText('START', W * .78, H * .14);
});
// 오락기 옆판 그림: 분홍 바탕에 사선 띠, 별, 몽글이 우주선
const arcSideTex = () => TT('aside', 256, 320, (c, W, H) => {
  c.fillStyle = '#e2589a'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) { c.fillStyle = ['#ffcf48', '#7cf0ff', '#ffffff', '#9b7fd0'][i]; c.beginPath(); c.moveTo(0, H * .55 + i * 22); c.lineTo(W, H * .3 + i * 22); c.lineTo(W, H * .3 + i * 22 + 12); c.lineTo(0, H * .55 + i * 22 + 12); c.fill(); }
  const mx = W * .55, my = H * .25; c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(mx, my, 50, 38, 0, 0, 7); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 4; c.stroke();
  c.fillStyle = '#7cf0ff'; c.beginPath(); c.ellipse(mx, my - 6, 30, 18, 0, PI, 0); c.fill(); c.stroke();
  c.fillStyle = C.ink; for (const s of [-1, 1]) { c.beginPath(); c.arc(mx + s * 12, my + 10, 4, 0, 7); c.fill(); }
  c.fillStyle = '#ff8a3d'; c.beginPath(); c.moveTo(mx - 50, my + 6); c.lineTo(mx - 82, my - 4); c.lineTo(mx - 76, my + 14); c.lineTo(mx - 86, my + 26); c.lineTo(mx - 48, my + 18); c.fill();
  c.fillStyle = '#ffe14d'; for (const [x, y, rr] of [[40, 40, 12], [210, 120, 9], [60, 250, 14], [190, 280, 10]]) { c.beginPath(); for (let i = 0; i < 10; i++) { const q = i % 2 ? rr * .45 : rr, t = -HP + i * PI / 5; c.lineTo(x + Math.cos(t) * q, y + Math.sin(t) * q); } c.fill(); }
});
// 오락기 동전 문: 은빛 판, 노란 투입구 창 둘 '100', 빨간 반환 단추, 열쇠 구멍
const coinDoorTex = () => TT('acoin', 128, 160, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#eef1f5'); g.addColorStop(1, '#a9b1bc'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (const x of [32, 96]) { c.fillStyle = '#ffcf48'; roundRect(c, x - 22, 18, 44, 60, 8); c.fill(); c.strokeStyle = '#a07a10'; c.lineWidth = 2; roundRect(c, x - 22, 18, 44, 60, 8); c.stroke();
    c.fillStyle = '#2c2a3a'; c.fillRect(x - 3, 26, 6, 26); fitText(c, '100', x, 66, 38, 15, C.ink, { weight: 'bold' }); }
  c.fillStyle = C.red; c.beginPath(); c.arc(W / 2, 104, 10, 0, 7); c.fill(); c.fillStyle = '#2c2a3a'; c.beginPath(); c.arc(W / 2, 134, 6, 0, 7); c.fill(); c.fillRect(W / 2 - 2, 134, 4, 10);
});
// 분리수거 표시: 재활용(돌아가는 화살표 셋) · 일반 쓰레기(휴지통 그림)
const binTex = k => TT('bin' + k, 160, 176, (c, W, H) => {
  c.fillStyle = '#ffffff'; roundRect(c, 4, 4, W - 8, H - 8, 18); c.fill(); const col = k ? '#5f6870' : '#2e8a4e';
  if (!k) { c.save(); c.translate(W / 2, 74); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 11; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) { c.rotate(PI * 2 / 3); c.beginPath(); c.arc(0, 0, 38, -1.35, -.15); c.stroke(); const ax = Math.cos(-.05) * 38, ay = Math.sin(-.05) * 38; c.beginPath(); c.moveTo(ax + 12, ay - 10); c.lineTo(ax - 4, ay + 14); c.lineTo(ax - 14, ay - 10); c.closePath(); c.fill(); } c.restore(); }
  else { c.fillStyle = col; c.fillRect(W / 2 - 34, 46, 68, 8); c.fillRect(W / 2 - 12, 38, 24, 8); c.beginPath(); c.moveTo(W / 2 - 30, 58); c.lineTo(W / 2 + 30, 58); c.lineTo(W / 2 + 24, 116); c.lineTo(W / 2 - 24, 116); c.fill();
    c.fillStyle = '#ffffff'; for (const dx of [-12, 0, 12]) c.fillRect(W / 2 + dx - 2, 66, 4, 40); }
  fitText(c, k ? '일반쓰레기' : '재활용', W / 2, 146, W - 24, 26, col, { weight: 'bold' });
});
// 장기판: 나무 바탕 9 × 10 줄, 궁 X자
const janggiTex = () => T('janggi', 128, 128, (c, W, H) => {
  c.fillStyle = '#ecc98e'; c.fillRect(0, 0, W, H); c.strokeStyle = '#7a4a28'; c.lineWidth = 1.6; const x0 = 10, y0 = 8, dx = (W - 20) / 8, dy = (H - 16) / 9;
  for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(x0 + i * dx, y0); c.lineTo(x0 + i * dx, H - y0); c.stroke(); }
  for (let j = 0; j < 10; j++) { c.beginPath(); c.moveTo(x0, y0 + j * dy); c.lineTo(W - x0, y0 + j * dy); c.stroke(); }
  for (const j of [0, 7]) { c.beginPath(); c.moveTo(x0 + 3 * dx, y0 + j * dy); c.lineTo(x0 + 5 * dx, y0 + (j + 2) * dy); c.moveTo(x0 + 5 * dx, y0 + j * dy); c.lineTo(x0 + 3 * dx, y0 + (j + 2) * dy); c.stroke(); }
  c.lineWidth = 3; c.strokeRect(2, 2, W - 4, H - 4);
});
// 둥근 부채: 태극 무늬 둘레 삼색 띠
const fanTex = () => T('fan', 128, 128, (c, W, H) => {
  const m = W / 2; c.fillStyle = '#fbf3e0'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 3; i++) { c.strokeStyle = [C.red, C.yel, C.blue][i]; c.lineWidth = 6; c.beginPath(); c.arc(m, m, 58 - i * 6, 0, 7); c.stroke(); }
  c.fillStyle = '#d8453a'; c.beginPath(); c.arc(m, m, 32, PI, 0); c.arc(m + 16, m, 16, 0, PI, true); c.arc(m - 16, m, 16, 0, PI); c.fill();
  c.fillStyle = '#2f5fa8'; c.beginPath(); c.arc(m, m, 32, 0, PI); c.arc(m - 16, m, 16, PI, 0, true); c.arc(m + 16, m, 16, PI, 0); c.fill();
});
// 학용품 선반 표지: 스케치북 · 물감 상자 · 필통 둘
const sketchTex = () => TT('sketch', 128, 160, (c, W, H) => {
  c.fillStyle = '#3f7f6a'; c.fillRect(0, 0, W, H); c.fillStyle = '#fbf3e0'; roundRect(c, 14, 40, W - 28, 78, 8); c.fill();
  c.strokeStyle = '#e8604c'; c.lineWidth = 4; c.beginPath(); c.moveTo(26, 100); c.quadraticCurveTo(50, 60, 70, 92); c.quadraticCurveTo(88, 116, 104, 70); c.stroke();
  c.fillStyle = '#ffcf48'; c.beginPath(); c.arc(92, 58, 9, 0, 7); c.fill();
  fitText(c, '스케치북', W / 2, 138, W - 24, 20, '#ffffff', { weight: 'bold' });
  c.fillStyle = '#c7ccd4'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(12 + i * 13, 10, 4, 0, 7); c.fill(); }
});
const paintTex = () => TT('paint', 192, 64, (c, W, H) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.fillStyle = C.blue; c.fillRect(0, 0, W, 12);
  const cs = [C.red, C.orng, C.yel, C.grn, C.blue, C.purp]; for (let i = 0; i < 6; i++) { const x = 70 + i * 19; c.fillStyle = '#e6e6e6'; roundRect(c, x, 22, 14, 34, 4); c.fill(); c.fillStyle = cs[i]; c.fillRect(x, 32, 14, 16); }
  fitText(c, '물감', 34, 32, 56, 22, C.ink, { weight: 'bold' }); fitText(c, '12색', 34, 52, 50, 13, C.red);
});
const penCaseTex = k => TT('pcase' + k, 128, 48, (c, W, H) => {
  c.fillStyle = k ? '#f39ab4' : '#4f86c6'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.3)'; for (let x = -20; x < W; x += 18) { c.beginPath(); c.moveTo(x, H); c.lineTo(x + 10, H); c.lineTo(x + 30, 0); c.lineTo(x + 20, 0); c.fill(); }
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(W * .72, H / 2, 15, 0, 7); c.fill(); c.fillStyle = k ? '#8f9aab' : C.yel; c.beginPath(); c.arc(W * .72, H / 2 + 2, 10, 0, 7); c.fill();
  c.fillStyle = C.ink; c.fillRect(W * .72 - 5, H / 2, 3, 3); c.fillRect(W * .72 + 2, H / 2, 3, 3); c.fillStyle = '#c7ccd4'; c.fillRect(0, 3, W, 3);
});
const flipTex = back => TT('flip' + (back ? 1 : 0), 256, 160, (c, W, H) => {
  if (!back) { c.fillStyle = C.cream; roundRect(c, 0, 0, W, H, 20); c.fill(); c.strokeStyle = C.grn; c.lineWidth = 10; roundRect(c, 8, 8, W - 16, H - 16, 14); c.stroke();
    fitText(c, '영업 중', W / 2, H / 2, W * .72, 62, '#2e7a4a', { weight: 'bold' }); return; }
  c.fillStyle = C.cream; roundRect(c, 0, 0, W, H, 20); c.fill(); c.strokeStyle = C.red; c.lineWidth = 10; roundRect(c, 8, 8, W - 16, H - 16, 14); c.stroke();
  fitText(c, '준비 중', W / 2, H * .42, W * .7, 56, '#b8473a', { weight: 'bold' });
  c.save(); c.translate(W * .3, H * .78); c.rotate(-.12); fitText(c, '까꿍', 0, 0, W * .3, 26, C.blue, { weight: 'bold' }); c.restore();
  c.strokeStyle = C.blue; c.lineWidth = 3; c.beginPath(); c.arc(W * .82, H * .72, 14, 0, 7); c.stroke(); c.fillStyle = C.blue; c.fillRect(W * .78, H * .68, 3, 3); c.fillRect(W * .84, H * .68, 3, 3);
  c.beginPath(); c.arc(W * .82, H * .74, 6, .2, PI - .2); c.stroke();
});
const posterTex = (k, title, lines, col) => TT('post' + k, 192, 256, (c, W, H) => {
  paperFill(c, W, H, C.paper, 11 + k); c.fillStyle = col; c.fillRect(10, 10, W - 20, 54);
  fitText(c, title, W / 2, 37, W - 36, 30, '#ffffff', { weight: 'bold' });
  lines.forEach((t, i) => fitText(c, t, W / 2, 96 + i * 34, W - 40, 22, C.ink));
});
// 계산대 진열 유리 속: 윗단 동물 지우개·자 줄, 아랫단 흰 접시에 구슬·장난감 자동차·열쇠고리, 가격표, 유리 반사
const glassCaseTex = () => TT('gcase2', 256, 112, (c, W, H) => {
  c.fillStyle = '#e6f0ee'; c.fillRect(0, 0, W, H); c.fillStyle = '#d4c3a0'; c.fillRect(0, 52, W, 5); c.fillRect(0, H - 6, W, 6);
  const er = [['#f7c6d0', 'cat'], ['#cfe6b8', 'frog'], ['#ffe2a0', 'bear'], ['#d5c8f0', 'cat'], ['#9fd3e0', 'frog'], ['#ffd2b0', 'bear']];
  er.forEach(([col, kind], i) => { const x = 18 + i * 26, y = 36; c.fillStyle = col; roundRect(c, x - 10, y - 12, 20, 16, 5); c.fill();
    c.fillStyle = col; if (kind !== 'frog') { c.beginPath(); c.arc(x - 6, y - 12, 4, 0, 7); c.arc(x + 6, y - 12, 4, 0, 7); c.fill(); } else { c.beginPath(); c.arc(x - 5, y - 13, 4, 0, 7); c.arc(x + 5, y - 13, 4, 0, 7); c.fill(); }
    c.fillStyle = C.ink; c.fillRect(x - 5, y - 6, 2, 2); c.fillRect(x + 3, y - 6, 2, 2); });
  for (let i = 0; i < 3; i++) { c.fillStyle = ['#ffcf48', '#8fd3c4', '#f39ab4'][i]; c.fillRect(176, 18 + i * 10, 70, 6); c.fillStyle = C.ink; for (let x = 180; x < 244; x += 6) c.fillRect(x, 18 + i * 10, 1, 3); }
  c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(40, 84, 32, 12, 0, 0, 7); c.fill(); c.strokeStyle = '#b8c4c6'; c.lineWidth = 1.5; c.stroke(); const r = rnd(51);
  for (let i = 0; i < 9; i++) { const x = 18 + r() * 44, y = 80 + r() * 6; c.fillStyle = [C.red, C.blue, C.grn, C.yel, C.purp][i % 5]; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(x - 2, y - 3, 2, 2); }
  for (const [x, col] of [[100, C.red], [146, C.blue]]) { c.fillStyle = col; roundRect(c, x - 18, 76, 36, 14, 5); c.fill(); c.fillRect(x - 10, 70, 18, 8); c.fillStyle = '#cfe8ff'; c.fillRect(x - 7, 72, 12, 5); c.fillStyle = C.ink; c.beginPath(); c.arc(x - 10, 92, 4, 0, 7); c.arc(x + 10, 92, 4, 0, 7); c.fill(); }
  for (let i = 0; i < 3; i++) { const x = 190 + i * 22; c.strokeStyle = '#9ea6b1'; c.lineWidth = 2; c.beginPath(); c.arc(x, 70, 5, 0, 7); c.stroke(); c.fillStyle = [C.pink, C.yel, C.mint][i]; c.beginPath(); c.arc(x, 86, 9, 0, 7); c.fill(); c.fillStyle = C.ink; c.fillRect(x - 4, 84, 2, 2); c.fillRect(x + 2, 84, 2, 2); }
  for (const [x, y] of [[60, 46], [150, 46], [75, 100], [215, 100]]) { c.fillStyle = '#ffffff'; c.fillRect(x - 11, y - 5, 22, 10); c.fillStyle = C.red; c.font = 'bold 8px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('100', x, y + 1); }
  c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(30, 0); c.lineTo(52, 0); c.lineTo(22, H); c.lineTo(0, H); c.fill(); c.beginPath(); c.moveTo(150, 0); c.lineTo(160, 0); c.lineTo(130, H); c.lineTo(120, H); c.fill();
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
  // 토분: 받침 접시·테 두른 주둥이·흙, 잎은 한 장씩 밖으로 퍼지고, 꽃은 꽃잎 다섯 (줄기 위)
  add(G.cyl(.16 * s, .15 * s, .02 * s, 14), '#c47a52', x, y + .01 * s, z);
  add(G.cyl(.135 * s, .1 * s, .21 * s, 14), '#d98b5f', x, y + .125 * s, z); add(G.cyl(.155 * s, .15 * s, .05 * s, 14), '#e9a67a', x, y + .245 * s, z);
  add(G.cyl(.128 * s, .128 * s, .01 * s, 14), '#6b4a36', x, y + .262 * s, z);
  for (let k = 0; k < 10; k++) { const a = k * 2.4, up = .45 + (k % 3) * .3, L = (.1 + (k % 2) * .035) * s;
    add(G.sph(1, 8, 6), k % 2 ? C.leaf : C.leaf2, x + Math.cos(a) * L * .55, y + (.29 + (k % 3) * .035) * s, z + Math.sin(a) * L * .55, 0, -a, up, [L * .62, .011 * s, L * .28]); }
  if (bloom) for (let j = 0; j < 3; j++) { const a = j * 2.1 + .5, fx = x + Math.cos(a) * .05 * s, fz = z + Math.sin(a) * .05 * s, fy = y + (.42 + j * .035) * s;
    add(G.cyl(.006 * s, .006 * s, .14 * s, 5), C.leaf2, fx, fy - .07 * s, fz);
    for (let q = 0; q < 5; q++) { const b = q * PI * 2 / 5; add(G.sph(.026 * s, 7, 5), bloom, fx + Math.cos(b) * .027 * s, fy, fz + Math.sin(b) * .027 * s, 0, 0, 0, [1, .45, 1]); }
    add(G.sph(.016 * s, 7, 5), '#ffe14d', fx, fy + .008 * s, fz); }
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
const BINS = [[3.08, .33, 0, '#4f86c6', .42, .64, .14], [3.5, .38, .3, '#8c949c', .34, .56, 0]];
const WT = .18, WH = 2.4, SX0 = -3.5, SX1 = .95, SZ0 = -2.75, SZF = .45, BX1 = 2.8, BZF = -1.0, BH = 2.15;
B.st_shop = f => {
  f.noOccupied = true; f.collideBox = [0, -.3, 0, .001, -.29, .001];
  // (걷기를 막는 몸: 벽 둘·창고 칸·거대 연필·분리수거함·우산꽂이 — 나머지 바탕은 지나다님)
  const walk = [[SX0 - WT, 0, SZ0 - WT, SX1, WH, SZ0], [SX0 - WT, 0, SZ0, SX0, WH, SZF], [SX1, 0, SZ0 - WT, BX1, BH, BZF],
    [-3.83, 0, .3, -3.35, 2.6, .78], [2.85, 0, .05, 3.74, .8, .62], [.64, 0, .14, .96, .6, .46], [-3.45, 0, -.1, -3.1, .4, .26], [2.95, 0, -2.75, 3.6, .5, -1.5]];
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
    for (const [x, z, n] of [[-3.3, -3.05, 9], [-1.2, -3.1, 11], [.6, -3.08, 8], [2.3, -3.1, 9], [3.7, -3.0, 10]]) { for (let k = 0; k < n; k++) { const a = k * 2.4, h = .1 + (k % 3) * .045, r0 = .02 + (k % 4) * .018;
      add(G.cone(.016, h, 4), k % 3 ? C.leaf : C.leaf2, x + Math.cos(a) * r0, h / 2 - .005, z + Math.sin(a) * r0 * .7, Math.sin(a) * .4, 0, -Math.cos(a) * .4); }
      add(G.sph(.016, 6, 5), n % 2 ? '#fff3b0' : '#ffffff', x + .03, .13, z + .02); add(G.sph(.008, 5, 4), '#ffd25a', x + .03, .142, z + .02); }
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
    // 실외기 (팬 망) · 나무 텃밭 상자 (파 · 상추)
    add(G.box(.62, .44, .3, .03), '#e9ece8', 2.25, BH + .4, SZ0 + .05); add(G.cyl(.15, .15, .02, 16), '#9aa2a8', 2.15, BH + .41, SZ0 + .21, HP, 0, 0);
    for (let k = 0; k < 4; k++) add(G.tor(.04 + k * .035, .006, PI * 2, 3, 16), '#7d858c', 2.15, BH + .41, SZ0 + .225);
    add(G.box(.62, .22, .36, .02), '#b98a5a', 1.45, BH + .29, -1.55); for (const y of [.22, .29, .36]) add(G.box(.63, .008, .37, .002), '#8f6440', 1.45, BH + y, -1.55);
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

  // ── 보도 위 생활 디테일: 우산꽂이(놓고 간 분홍 우산), 분리수거함·납작 상자 묶음, 나무 텃밭 상자 둘 ─────────────────
  f.add(mc('st-street', ({ add, tube }) => {
    add(G.cyl(.15, .13, .5, 14), '#7d9ab0', .8, .25, .3); add(G.cyl(.155, .155, .03, 14), '#5f7a90', .8, .5, .3);
    // 접은 우산 둘 (가늘게 말린 천 + 손잡이): 남색, 놓고 간 분홍
    tube([.76, .3, .27], [.73, .78, .24], .045, '#3d4a7a', 8, .03); tube([.73, .78, .24], [.725, .96, .235], .012, C.ink); add(G.tor(.035, .012, PI, 4, 10), C.ink, .705, .96, .235, 0, 0, PI);
    tube([.85, .3, .34], [.9, .8, .38], .05, C.pink, 8, .032); for (const t of [.45, .62]) add(G.cyl(.042, .042, .02, 8), '#c0587a', .85 + .05 * (t - .3) / .5 * 1, t, .34 + .04 * (t - .3) / .5); tube([.9, .8, .38], [.905, .98, .385], .012, '#c0587a'); add(G.tor(.035, .012, PI, 4, 10), '#c0587a', .925, .98, .385, 0, 0, PI);
    // 가게 안 문 옆 휴지통 (구겨진 종이)
    add(G.cyl(.14, .12, .36, 14), '#9fc3ae', -3.27, .18, .08); add(G.tor(.14, .015, PI * 2, 4, 14), '#7ea591', -3.27, .36, .08, HP, 0, 0);
    for (const [dx, dz] of [[-.03, .02], [.04, -.03]]) add(G.sph(.05, 7, 5), C.paper, -3.27 + dx, .37, .08 + dz);
    // 분리수거함 둘 (바퀴 달린 통): 파란 재활용 통(뚜껑이 살짝 들림)·회색 일반 쓰레기통 — 몸 아래로 좁아짐, 테 띠, 뚜껑 손잡이, 뒤 바퀴 둘, 앞에 표시 그림
    for (const [x, z, ry, col, w, h, lift] of BINS) {
      const cs = Math.cos(ry), sn = Math.sin(ry), Q = (lx, ly, lz) => [x + lx * cs + lz * sn, ly, z - lx * sn + lz * cs], dk = shade(col, -.12);
      add(G.box(w * .92, h - .1, w * .9, .04), col, ...Q(0, .05 + (h - .1) / 2, 0), 0, ry, 0); add(G.box(w, .12, w * .98, .04), col, ...Q(0, h - .1, .0), 0, ry, 0);
      add(G.box(w + .012, .03, w * .98 + .012, .01), dk, ...Q(0, h - .165, 0), 0, ry, 0);
      add(G.box(w + .03, .045, w + .02, .015), dk, ...Q(0, h - .02 + lift * .5, .0), -lift, ry, 0); add(G.box(.14, .03, .035, .01), shade(col, -.25), ...Q(0, h - .005 + lift, w / 2 + .02), -lift, ry, 0);
      for (const s of [-1, 1]) { add(G.cyl(.055, .055, .035, 14), '#2c2f38', ...Q(s * (w / 2 - .04), .055, -w / 2 + .02), 0, ry, HP); add(G.cyl(.02, .02, .04, 8), C.metalD, ...Q(s * (w / 2 - .04), .055, -w / 2 + .02), 0, ry, HP); }
      add(G.box(w * .1, .05, w * .1, .01), dk, ...Q(-w * .3, .025, w * .3), 0, ry, 0); add(G.box(w * .1, .05, w * .1, .01), dk, ...Q(w * .3, .025, w * .3), 0, ry, 0);
    }
    add(G.box(.06, .5, .6, .01), '#c99a64', 3.42, .28, -.18, 0, 0, -.18); add(G.box(.06, .46, .56, .01), '#d7b07c', 3.36, .26, -.16, 0, 0, -.22);
    for (const y of [.12, .42]) add(G.box(.11, .012, .62, .004), '#f4f1e8', 3.39, y, -.17, 0, 0, -.2);
    // (10/24 사용자 '스티로폼 상자 못생김' → 나무 텃밭 상자: 판자 줄·모서리 기둥·이름표)
    // 나무 텃밭 상자 둘 (창고 옆): 판자 상자에 흙 — 상추 포기(잎 한 장씩)·대파 줄, 옆 상자엔 고추 포기(줄기·잎·빨간 고추)와 지지대
    for (const [x, z] of [[3.15, -2.45], [3.2, -1.95]]) {
      add(G.box(.5, .22, .36, .02), '#c4945f', x, .11, z); add(G.box(.44, .02, .3, .004), '#6b4a36', x, .238, z);
      for (const y of [.075, .15]) { add(G.box(.505, .008, .365, .002), '#946845', x, y, z); }
      for (const s of [-1, 1]) { add(G.box(.53, .035, .035, .01), '#a87a4c', x, .232, z + s * .18); add(G.box(.035, .035, .36, .01), '#a87a4c', x + s * .25, .232, z); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.045, .24, .045, .01), '#8a5f3c', x + sx * .245, .12, z + sz * .175);
      add(G.box(.2, .07, .006, .002), '#f3ead6', x - .08, .13, z + .184);
    }
    for (const [cx, cz] of [[2.98, -2.42], [3.32, -2.36]]) for (let k = 0; k < 9; k++) { const a = k * 2.4, up = k < 5 ? .55 : 1.0, L = k < 5 ? .085 : .06;
      add(G.sph(1, 8, 6), k < 5 ? '#7cc45a' : '#a8dc78', cx + Math.cos(a) * L * .5, .27 + (k < 5 ? 0 : .02), cz + Math.sin(a) * L * .5, 0, -a, up, [L * .62, .012, L * .42]); }
    for (let k = 0; k < 6; k++) { const x = 3.02 + k * .055; add(G.cyl(.009, .011, .2, 6), '#f2f4ea', x, .33, -2.58); add(G.cyl(.008, .009, .16, 6), k % 2 ? '#5ea85a' : '#7cc06a', x + (k % 2 ? .01 : -.01), .51, -2.58, (k % 2 ? .12 : -.1), 0, 0); }
    { const x = 3.2, z = -1.95; add(G.cyl(.008, .008, .4, 5), '#b8946a', x + .1, .44, z - .05); tube([x, .24, z], [x + .02, .5, z - .02], .012, '#5e9a50');
      for (const [bx, by, bz, a] of [[-.05, .42, .04, .4], [.06, .45, -.03, 2.2], [.0, .52, .05, 4.1], [.05, .36, .06, 1.2], [-.06, .34, -.05, 3.3]]) { tube([x + .01, by - .05, z], [x + bx, by, z + bz], .006, '#5e9a50'); add(G.sph(1, 8, 6), C.leaf2, x + bx, by + .01, z + bz, 0, -a, .3, [.05, .01, .025]); }
      for (const [bx, by, bz] of [[-.04, .38, .06], [.07, .4, .02], [.02, .33, -.06]]) add(G.cap(.011, .05, 3, 6), C.red, x + bx, by, z + bz, .25, 0, .3);
      add(G.cap(.011, .045, 3, 6), '#4f9c3a', x - .07, .43, z - .02, -.2, 0, -.3); }
  }));
  BINS.forEach(([x, z, ry, , w, h], k) => { const d = w * .45 + .004; decal(f, w * .62, w * .68, binTex(k), x + d * Math.sin(ry), h * .42, z + d * Math.cos(ry), ry); });
  // 숨김 자리 (보도·바닥)
  f.spot('on', null, 1.85, .012, -.05, { label: '셔터 앞 보도', maxH: .5, scale: 1.4 });
  f.spot('behind', null, 3.5, .012, .0, { label: '분리수거함 뒤', maxH: .4, scale: 1 });
  f.spot('on', null, -.4, .012, 2.25, { label: '가게 앞 보도', maxH: .5, scale: 1.5 });
  f.spot('on', null, -3.05, .03, 2.3, { label: '하수 덮개 옆', maxH: .45, scale: 1.2 });
  f.spot('on', null, 3.18, .26, -2.45, { label: '텃밭 상자 속', maxH: .3, scale: .9 });
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
  const shadow = grp(); put(shadow, 0, -.92, .021); cur.add(shadow);
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
    // 반사 띠
    for (const y of [.35, .45]) add(G.cyl(.075, .075, .05, 10), '#ffe14d', 0, y, 0);
  }));
  // 딱지 판 (기둥 앞 아래쪽, 스위치 함 밑 — 위에 달면 평상의 고양이를 가림; 쇠띠 둘로 묶음): 나무 테 액자 속 크림 판, 빨간 머리띠 '딱지', 진짜 딱지 여섯이 색 압정에 꽂힘, 아래 노란 가격 띠 '1장 100원'
  const db = grp(); put(db, 0, .6, .092); all.add(db);
  db.add(mc('st-ddakjiboard', ({ add }) => {
    add(G.box(.34, .4, .026, .01), C.woodD, 0, 0, 0); add(G.box(.3, .36, .01, .004), '#e9dcc0', 0, 0, .01);
    for (const y of [-.12, .13]) { add(G.tor(.076, .009, PI * 2, 4, 18), '#5f6b75', 0, y, -.092, HP, 0, 0); add(G.box(.02, .03, .02, .004), '#5f6b75', 0, y, -.016); }
    for (let k = 0; k < 6; k++) add(G.cyl(.009, .009, .012, 8), [C.red, C.yel, C.blue][k % 3], (k % 3 - 1) * .088, .065 - Math.floor(k / 3) * .115 + .032, .04, HP, 0, 0);
  }));
  decal(db, .3, .36, ddakjiBoardTex(), 0, 0, .0156);
  { const dg = geo('st-ddak2', () => G.box(.072, .072, .012, .003));
    for (let k = 0; k < 6; k++) { const g = grp(); put(g, (k % 3 - 1) * .088, .065 - Math.floor(k / 3) * .115, .026, 0, 0, (k * .37) % .5 - .25); db.add(g);
      g.add(mesh(dg, mat(shade(DDAK[k][0], -.1)))); g.add(put(flat(.07, .07, ddakjiTex(k)), 0, 0, .0065)); } }
  const sw = grp(); put(sw, 0, 1.07, .21); f.add(sw);
  sw.add(mc('st-lampsw', ({ add }) => { add(G.box(.07, .2, .07, .02), C.red, 0, .06, 0); add(G.sph(.06, 9, 6), C.yel, 0, .17, .02); }));
  const OFF = mat('#c9c6b8'), ON = mat('#fffaf0', { emissive: '#fff1d0', ei: 1.5 });
  const bulb = mesh(new THREE.SphereGeometry(.13, 12, 8), OFF); put(bulb, -.68, 2.93, -.46); bulb.scale.set(1, .7, 1); f.add(bulb);
  // 켜면 바닥 빛 웅덩이
  const poolT = TC.get('st-pool2', () => fadeDisc(64, '#fff2d6', r => (1 - r) * .5));
  const pool = mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: poolT, transparent: true, depthWrite: false }), { cast: false, recv: false });
  put(pool, -.68, .02, -.46, -HP); pool.visible = false; pool.userData.noMerge = true; pool.userData.noPaint = true; f.add(pool);
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
    // 계산대 스탠드 (초록 갓, 따뜻한 흰 전구)
    add(G.cyl(.07, .08, .03, 12), '#3f6b55', .8, H + .015, .12); add(G.cyl(.012, .012, .3, 6), C.metalD, .8, H + .17, .12); add(G.cone(.1, .12, 12), '#3f6b55', .8, H + .36, .14, .3, 0, 0);
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
  { const b = mesh(geo('st-bulb', () => new THREE.SphereGeometry(.042, 12, 8)), mat('#fffaf0', { emissive: '#fff1d8', ei: 1.3 }), { cast: false }); put(b, .8, H + .315, .165); f.add(b); }
  // 라디오 (스피커 망·주파수 창) · 진열 유리 속 지우개·구슬·장난감
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
  }));
  // 이름판 가운데 위 거위목 스탠드 (갓이 앞으로 숙여 상자 칸을 비춤), 갓 밑 빛나는 전구
  f.add(mc('st-crayonlamp', ({ add, tube }) => {
    add(G.box(.12, .03, .07, .01), C.metalD, 0, H + .575, -.18); tube([0, H + .58, -.18], [0, H + .7, -.1], .012, C.metalD, 6); tube([0, H + .7, -.1], [0, H + .69, .11], .012, C.metalD, 6);
    add(G.cone(.09, .11, 14), '#3f6b55', 0, H + .64, .1, .55, 0, 0); add(G.tor(.088, .008, PI * 2, 4, 14), '#2f5444', 0, H + .593, .071, .55 + HP, 0, 0);
  }));
  { const b = mesh(geo('st-bulb', () => new THREE.SphereGeometry(.042, 12, 8)), mat('#fffaf0', { emissive: '#fff1d8', ei: 1.3 }), { cast: false }); put(b, 0, H + .588, .078); f.add(b); }
  f.add(mc('st-crayonloose', ({ add }) => {
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
  for (let k = 0; k < 3; k++) hang(ddakjiTex(k + 3), .12, .12, -.06 + k * .14, 1.58, k * .4);
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

// ── 불량식품 회전 진열대 (+z 앞): 은빛 철망 탑 네 면에 갈고리마다 봉지가 대롱대롱(톱니 이음·과자 그림), 꼭대기엔 동그란 테 위 간판 한 장 '불량식품 100원'
// — 터치하면 반 바퀴 돌아 뒷면이 앞으로 ──────────────────────────────────────────────────────────────────
B.st_snackrack = f => {
  f.add(mc('st-snackbase', ({ add }) => { add(G.cyl(.36, .4, .07, 24), '#7d858c', 0, .035, 0); add(G.tor(.38, .012, PI * 2, 4, 24), C.metalD, 0, .07, 0, HP, 0, 0); add(G.cyl(.03, .03, 1.62, 8), C.metalD, 0, .86, 0); }));
  const rack = grp(); f.add(rack);
  rack.add(mc('st-snackrack', ({ add }) => {
    for (let k = 0; k < 4; k++) { const a = k * HP, nx = Math.sin(a), nz = Math.cos(a);
      for (let j = 0; j < 4; j++) add(G.box(.5, .016, .016, .004), C.metal, nx * .27, .42 + j * .38, nz * .27, 0, a, 0);
      for (const s of [-1, 1]) add(G.box(.016, 1.2, .016, .004), C.metal, nx * .27 + nz * s * .25, 1.0, nz * .27 - nx * s * .25);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) { if (k === 2 && j === 0) continue; const x = (i - .5) * .22, hy = .8 + j * .38;
        add(G.box(.008, .008, .07, .002), C.metalD, nx * (.27 + .035) + nz * x, hy, nz * (.27 + .035) - nx * x, 0, a, 0); add(G.sph(.008, 6, 4), C.metalD, nx * .305 + nz * x, hy + .006, nz * .305 - nx * x); }
    }
    add(G.box(.56, .025, .56, .008), C.metalD, 0, .38, 0);
    add(G.tor(.2, .012, PI * 2, 4, 24), C.metal, 0, 1.64, 0, HP, 0, 0); for (let k = 0; k < 4; k++) add(G.box(.016, .016, .22, .004), C.metal, Math.sin(k * HP) * .1, 1.64, Math.cos(k * HP) * .1, 0, k * HP, 0);
    add(G.cyl(.014, .014, .16, 8), C.metalD, 0, 1.72, 0);
    add(G.box(.54, .24, .03, .02), '#c8392c', 0, 1.9, 0); add(G.box(.56, .02, .034, .006), C.metal, 0, 2.02, 0); add(G.box(.56, .02, .034, .006), C.metal, 0, 1.78, 0);
  }));
  let n = 0;
  const bagG = geo('st-snackbag2', () => G.box(.18, .25, .035, .012));
  for (let k = 0; k < 4; k++) { const a = k * HP; for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) {
    if (k === 2 && j === 0) continue;
    const g = grp(), x = (i - .5) * .22; put(g, Math.sin(a) * .3 + Math.cos(a) * x, .66 + j * .38, Math.cos(a) * .3 - Math.sin(a) * x, -.06, a, (i - .5) * .06); rack.add(g);
    g.add(put(mesh(bagG, mat(SNACKS[n % 6][1])), 0, 0, 0)); g.add(put(flat(.17, .24, snackTex(n % 6)), 0, 0, .0185)); n++;
  } }
  { const t = TT('snacksign2', 256, 112, (c, W, H) => { c.fillStyle = '#c8392c'; roundRect(c, 0, 0, W, H, 16); c.fill(); c.strokeStyle = '#ffe14d'; c.lineWidth = 5; roundRect(c, 7, 7, W - 14, H - 14, 12); c.stroke();
      fitText(c, '불량식품', W / 2, H * .4, W * .78, 44, '#ffffff', { weight: 'bold' }); fitText(c, '100원', W / 2, H * .78, W * .4, 24, '#ffe14d', { weight: 'bold' }); });
    for (const [z, ry] of [[.0165, 0], [-.0165, PI]]) { const m = flat(.52, .22, t); put(m, 0, 1.9, z, 0, ry, 0); rack.add(m); } }
  rack.add(mc('st-snackshelf', ({ add }) => add(G.box(.46, .025, .2, .005), C.metal, 0, .52, -.22)));
  const p = f.part('spin', rack, t => { rack.rotation.y = PI * t; }, { label: '불량식품 회전 진열대', sfx: 'gearUp', dur: .9 });
  f.spot('inside', rack, 0, .535, -.24, { part: p, maxH: .3, scale: 1.1, label: '회전 진열대 뒷면 칸' });
  f.spot('on', null, .0, .09, .32, { label: '회전 진열대 받침 앞', maxH: .35, scale: 1.1 });
  f.walkBoxes = [[-.4, 0, -.4, .4, 2.05, .4]]; f.walkSolids = f.walkBoxes;
};

// ── 뽑기 기계 줄 (가게 앞, +z 앞): 셋 다 진짜 캡슐 뽑기 — 은빛 다리 넷 받침 위 몸통(앞판 그림·노란 별 가격 '500원'·동전 넣는 곳·은빛 다이얼·나오는 곳과 뚜껑),
// 몸통 위 은빛 테에 투명 돔, 돔 속 캡슐 알알이(색 반구 + 옅은 반구, 제각각 기울어짐), 돔 꼭지 뚜껑, 옆엔 '신상!' 광고 스티커
// 가운데 것 다이얼을 터치하면 드르륵 한 바퀴 → 나오는 곳 뚜껑이 들리며 캡슐이 퐁 ──────────────────────────────────────────
const GM = [{ x: -.62, w: .48, bh: .44, r: .19 }, { x: 0, w: .56, bh: .5, r: .225 }, { x: .62, w: .48, bh: .44, r: .19 }], GST = .3, GD = .42;
const CAPC = [C.red, C.yel, C.blue, C.grn, C.pink, C.purp, C.orng, C.mint];
const CAPT = r => geo('st-capt-' + r, () => new THREE.SphereGeometry(r, 7, 3, 0, PI * 2, 0, HP)), CAPB = r => geo('st-capb-' + r, () => new THREE.SphereGeometry(r * .985, 7, 3, 0, PI * 2, HP, HP));
const gDomeC = m => GST + m.bh + .07 + m.r * .8;
const gLidTop = m => gDomeC(m) + m.r + .018;
function gachaBody(add, m, k, withKnob) {
  const { x, w, bh, r } = m, col = GCOL[k], dk = shade(col, -.2), FZ = GD / 2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const lx = x + sx * (w / 2 - .05), lz = sz * (GD / 2 - .05); add(G.cyl(.018, .018, GST, 8), C.metalD, lx, GST / 2, lz); add(G.cyl(.027, .03, .025, 10), '#4a4e5c', lx, .0125, lz); }
  add(G.pbox(w - .06, .02, GD - .06), C.metalD, x, .1, 0);
  add(G.box(w, bh, GD, .03), col, x, GST + bh / 2, 0);
  add(G.box(w + .012, .05, GD + .012, .014), dk, x, GST + .025, 0);
  add(G.box(w + .02, .035, GD + .02, .012), dk, x, GST + bh + .0175, 0);
  add(G.cyl(r * .64, r * .7, .035, 24), C.metal, x, GST + bh + .0525, 0); add(G.tor(r * .6, .008, PI * 2, 4, 24), '#ffffff', x, GST + bh + .07, 0, HP, 0, 0);
  add(G.pbox(w * .46, .12, .02), '#2c2a3a', x, .405, FZ + .001);
  add(G.pbox(w * .5, .02, .08), C.metal, x, .335, FZ + .04);
  for (const s of [-1, 1]) add(G.pbox(.014, .07, .08), C.metal, x + s * w * .25, .36, FZ + .04);
  if (!withKnob) add(G.pbox(w * .44, .11, .008), '#dfeaf0', x, .4, FZ + .082, -.08, 0, 0);
  const cy = GST + bh * .5, cx = x + w * .3;
  add(G.pbox(.08, .13, .016), C.metal, cx, cy, FZ + .008); add(G.pbox(.012, .055, .006), '#2c2a3a', cx, cy + .02, FZ + .017);
  add(G.cyl(.013, .013, .012, 8), C.red, cx, cy - .04, FZ + .018, HP, 0, 0);
  if (!withKnob) { const kx = x - w * .08; add(G.cyl(.07, .072, .03, 22), C.metal, kx, cy, FZ + .015, HP, 0, 0); add(G.pbox(.15, .034, .03), '#f4f6f8', kx, cy, FZ + .04, 0, 0, .5); add(G.sph(.022, 10, 8), C.yel, kx + Math.cos(.5) * .065, cy + Math.sin(.5) * .065, FZ + .055); }
  const dc = gDomeC(m);
  add(G.cyl(r * .44, r * .52, .04, 20), dk, x, dc + r - .002, 0); add(G.tor(r * .44, .008, PI * 2, 4, 20), C.metal, x, dc + r + .018, 0, HP, 0, 0);
  const rr0 = rnd(70 + k), cr = r * .21, R = r - cr * 1.1;
  for (const [fy, rings] of [[-.6, [1]], [-.25, [1]], [.1, [.72]]]) {
    const y = dc + fy * r, ring = Math.sqrt(Math.max(0, R * R - (fy * r) ** 2));
    for (const f of rings) { const rr = ring * f, n = rr < .01 ? 1 : Math.max(3, Math.floor(PI * 2 * rr / (cr * 2.15)));
      for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + fy * 3 + rr0() * .3, px = x + Math.cos(a) * rr, pz = Math.sin(a) * rr, cc = CAPC[Math.floor(rr0() * CAPC.length)], ax = rr0() * 3, az = rr0() * 3;
        add(CAPT(cr), cc, px, y, pz, ax, 0, az); add(CAPB(cr), shade(cc, .28), px, y, pz, ax, 0, az); } }
  }
}
B.st_gacha = f => {
  const mid = grp(); f.add(mid);
  f.add(mc('st-gacha-sides', ({ add }) => { gachaBody(add, GM[0], 0, false); gachaBody(add, GM[2], 2, false); }));
  mid.add(mc('st-gacha-mid', ({ add }) => gachaBody(add, GM[1], 1, true)));
  const domeMat = mat('#eef8ff', { opacity: .3, rough: .1, rim: .5 });
  GM.forEach((m, k) => {
    const g = k === 1 ? mid : f;
    const d = mesh(geo('st-gdome-' + m.r, () => new THREE.SphereGeometry(m.r, 24, 14, 0, PI * 2, 0, PI * .8)), domeMat, { cast: false }); put(d, m.x, gDomeC(m), 0); d.userData.noMerge = true; d.renderOrder = 2; g.add(d);
    decal(g, m.w - .02, m.bh - .02, gachaFaceTex(k), m.x, GST + m.bh / 2, GD / 2 + .003);
    decal(g, GD - .08, m.bh - .1, gachaSideTex(k), m.x + m.w / 2 + .003, GST + m.bh / 2 + .01, 0, HP);
  });
  const M = GM[1], cy = GST + M.bh * .5, FZ = GD / 2;
  const knob = grp(); put(knob, M.x - M.w * .08, cy, FZ + .015); f.add(knob);
  knob.add(mc('st-gknob', ({ add }) => { add(G.cyl(.08, .082, .03, 24), C.metal, 0, 0, 0, HP, 0, 0); add(G.cyl(.05, .05, .034, 18), '#ffffff', 0, 0, .002, HP, 0, 0); add(G.box(.17, .036, .034, .012), '#f4f6f8', 0, 0, .028); for (const s of [-1, 1]) add(G.sph(.024, 10, 8), C.yel, s * .075, 0, .045); }));
  const flap = grp(); put(flap, M.x, .46, FZ + .082); f.add(flap);
  flap.add(mc('st-gflap', ({ add }) => { add(G.box(M.w * .44, .11, .008, .003), '#dfeaf0', 0, -.055, 0); add(G.box(M.w * .2, .02, .012, .004), C.metalD, 0, -.1, .006); }));
  const cap = grp(); put(cap, M.x, .4, FZ - .03); f.add(cap); cap.visible = false;
  cap.add(mc('st-gcapsule', ({ add }) => { add(new THREE.SphereGeometry(.045, 12, 5, 0, PI * 2, 0, HP), C.purp, 0, 0, 0, .3, 0, .2); add(new THREE.SphereGeometry(.044, 12, 5, 0, PI * 2, HP, HP), '#e8e0f8', 0, 0, 0, .3, 0, .2); }));
  const st = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  const p = f.part('lift', [mid, knob, flap, cap], t => {
    knob.rotation.z = -PI * 2 * st(t, 0, .5); const c = st(t, .5, 1);
    flap.rotation.x = -1.15 * st(t, .45, .62); cap.visible = t > .5;
    cap.position.x = M.x + .09 * c; cap.position.z = FZ - .03 + .075 * c; cap.position.y = .4 - .02 * c + .05 * Math.sin(c * PI);
  }, { label: '뽑기 기계 손잡이', sfx: 'ratchet', dur: 1.2 });
  p.gptEndSfx = 'pop';
  f.spot('inside', null, M.x, .345, FZ + .04, { part: p, maxH: .12, scale: .9, label: '뽑기 캡슐 나오는 곳' });
  f.spot('on', null, -.62, gLidTop(GM[0]), 0, { label: '파란 뽑기 기계 위', maxH: .35, scale: 1.1 });
  f.spot('on', null, .62, gLidTop(GM[2]), 0, { label: '초록 뽑기 기계 위', maxH: .35, scale: 1.1 });
  f.spot('under', null, -.31, .01, .3, { label: '뽑기 기계 사이 바닥', maxH: .3, scale: .9 });
};

// ── 가게 앞 업소용 미니 오락기 (+z 앞): 분홍 옆판(옛 오락기 옆모습 그대로 — 아래 동전 문, 튀어나온 조작판, 뒤로 누운 화면, 위 간판 처마)에
// 옆판 그림, 남색 몸, 검은 베젤 속 화면(외계인·점수 줄), 빛나는 '오락' 간판, 조이스틱 공·버튼 둘, 은빛 동전 문(투입구 둘·반환구), 앞에 빨간 꼬마 의자
// 파란 버튼을 터치하면 화면이 반짝 '1등' — 동전이 반환구로 짤랑 ──────────────────────────────────────────────────────────
B.st_arcade = f => {
  const all = grp(); f.add(all);
  const SW = .3, PINK = '#e2589a', NAVY = C.navy;
  const prof = new THREE.Shape(); [[-.28, 0], [.3, 0], [.3, .7], [.38, .76], [.38, .83], [.16, .9], [.09, 1.3], [.21, 1.32], [.21, 1.5], [-.28, 1.5]].forEach(([u, v], i) => i ? prof.lineTo(u, v) : prof.moveTo(u, v));
  const sideG = geo('st-arc-side', () => ext(prof, .04, 4));
  all.add(mc('st-arcade', ({ add }) => {
    for (const s of [-1, 1]) add(sideG, PINK, s > 0 ? SW + .04 : -SW, 0, 0, 0, -HP, 0);
    add(G.box(SW * 2, 1.5, .03, .01), NAVY, 0, .75, -.265);
    add(G.box(SW * 2, .72, .03, .01), NAVY, 0, .36, .285);
    add(G.box(SW * 2, .1, .1, .01), NAVY, 0, .75, .33);
    add(G.box(SW * 2, .03, .48, .01), shade(NAVY, -.05), 0, 1.485, -.04);
    add(G.box(SW * 2 + .12, .07, .64, .02), '#262d52', 0, .035, .02);
    for (let k = 0; k < 5; k++) add(G.pbox(.42, .012, .006), '#1d2346', 0, .1 + k * .025, .301);
    add(G.box(SW * 2, .06, .25, .015), '#4f5d9c', 0, .825, .27, .32, 0, 0);
    add(G.box(SW * 2 + .01, .075, .02, .008), C.metal, 0, .795, .385);
    add(G.box(SW * 2, .19, .13, .02), NAVY, 0, 1.41, .145);
    for (let k = 0; k < 4; k++) add(G.box(.3, .008, .01, .003), '#1d2346', 0, 1.305 + k * .016, .11);
    add(G.box(.24, .29, .015, .006), C.metal, 0, .47, .302);
    add(G.box(.11, .065, .02, .006), '#1d1f30', 0, .31, .303); add(G.box(.13, .016, .055, .005), C.metal, 0, .2925, .32);
    for (const x of [-.055, .055]) add(G.pbox(.006, .045, .004), '#2c2a3a', x, .535, .312);
    for (const s of [-1, 1]) add(G.box(.035, .02, .035, .006), '#1d1f30', s * .27, .01, .26);
  }));
  decal(all, .5, .58, arcSideTex(), SW + .042, .45, .0, HP);
  decal(all, .22, .275, coinDoorTex(), 0, .47, .3105);
  decal(all, .56, .15, marqueeTex(), 0, 1.41, .2115, 0, { em: '#ff8fc8', ei: .45 });
  const scrG = grp(); put(scrG, 0, 1.1, .125, -.175, 0, 0); f.add(scrG);
  scrG.add(mc('st-arc-bezel', ({ add }) => { add(G.box(SW * 2, .42, .03, .01), '#20243a', 0, 0, -.015); add(G.box(.48, .34, .006, .004), '#11142a', 0, .0, .001); }));
  const scr = flat(.44, .3, screenTex(false), { em: '#3a4aa0', ei: .5 }); put(scr, 0, 0, .006); scrG.add(scr);
  const SCR0 = scr.material, SCR1 = mat('#ffffff', { map: screenTex(true), emissive: '#ffe8b0', ei: .55, rim: .06 });
  const cp = grp(); put(cp, 0, .825 + .03 * Math.cos(.32), .27 + .03 * Math.sin(.32), .32, 0, 0); f.add(cp);
  cp.add(put(flat(.56, .22, panelTex()), 0, .002, 0, -HP, 0, 0));
  cp.add(mc('st-arc-ctrl', ({ add }) => {
    add(G.cyl(.04, .04, .008, 16), C.metal, -.12, .004, .01); add(G.cone(.022, .03, 10), '#1d1f30', -.12, .02, .01);
    add(G.cyl(.008, .008, .08, 8), '#2c2a3a', -.12, .05, .01); add(G.sph(.034, 14, 10), '#e8443a', -.12, .095, .01); add(G.sph(.012, 8, 6), '#ffffff', -.132, .108, .022);
    add(G.tor(.03, .006, PI * 2, 4, 16), C.metal, .07, .006, .0, HP, 0, 0); add(G.cyl(.026, .028, .022, 14), '#ffcf48', .07, .014, .0);
    add(G.tor(.03, .006, PI * 2, 4, 16), C.metal, .17, .006, .0, HP, 0, 0);
    add(G.cyl(.016, .016, .01, 12), '#ffffff', .17, .005, -.075);
  }));
  const btn = grp(); put(btn, .17, .014, 0); cp.add(btn);
  btn.add(mc('st-abtn', ({ add }) => { add(G.cyl(.026, .028, .022, 14), '#4f86c6', 0, 0, 0); add(G.sph(.026, 12, 6), '#6fa0e0', 0, .008, 0, 0, 0, 0, [1, .35, 1]); }));
  f.add(mc('st-arc-stool', ({ add, tube }) => {
    const z = .64, y = .42;
    add(G.cyl(.14, .13, .05, 18), '#d94a4a', 0, y, z); add(G.sph(.14, 16, 6), '#e8604c', 0, y + .02, z, 0, 0, 0, [1, .22, 1]); add(G.tor(.135, .01, PI * 2, 4, 20), C.metal, 0, y - .02, z, HP, 0, 0);
    for (let k = 0; k < 4; k++) { const a = k * HP + PI / 4; tube([Math.cos(a) * .08, y - .03, z + Math.sin(a) * .08], [Math.cos(a) * .13, 0, z + Math.sin(a) * .13], .012, C.metalD, 6); add(G.sph(.016, 6, 5), '#2c2a3a', Math.cos(a) * .13, .008, z + Math.sin(a) * .13); }
    add(G.tor(.1, .008, PI * 2, 4, 18), C.metal, 0, .15, z, HP, 0, 0);
  }));
  const coin = grp(); put(coin, 0, .38, .3); f.add(coin); coin.visible = false;
  coin.add(mc('st-acoin', ({ add }) => { add(G.cyl(.026, .026, .007, 14), '#d9b54a', 0, 0, 0, HP, 0, 0); add(G.cyl(.018, .018, .008, 12), '#efcf6a', 0, 0, 0, HP, 0, 0); }));
  const st = (t, a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1);
  const p = f.part('lift', [all, btn, scr, coin], t => {
    btn.position.y = .014 - .01 * Math.sin(st(t, 0, .2) * PI);
    scr.material = t > .15 && t < .9 && Math.floor(t * 10) % 2 === 0 ? SCR1 : t >= .9 ? SCR1 : SCR0;
    const c = st(t, .6, 1); coin.visible = t > .6; coin.position.y = .38 - .07 * c; coin.position.z = .3 + .025 * c; coin.rotation.x = c * PI * 2.5;
  }, { label: '오락기 버튼', sfx: 'click', dur: 1.3 });
  p.gptEndSfx = 'coin';
  f.spot('inside', null, .0, .3, .32, { part: p, maxH: .1, scale: .8, label: '오락기 동전 반환구' });
  f.spot('on', null, .0, 1.5, -.08, { label: '오락기 꼭대기', maxH: .35, scale: 1.1 });
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

// 자는 고양이 (추로 결: 회청 바탕·진한 줄무늬, 이마·볼 살구 무늬, 흰 주둥이·앞발) — 방석 위에 식빵처럼 웅크리고, 턱은 앞발 위, 꼬리는 몸 앞을 감음
// 원점 = 방석 윗면 가운데, 머리 쪽 = +x
const CAT = { fur: '#8f9aab', furD: '#6c778a', apr: '#efb287', wht: '#fbf6ee', pink: '#f2a0ad', ink: '#3a2e33' };
function sleepCat(add, tube) {
  const K = CAT, bx = -.03, by = .11, rx = .23, ry = .12, rz = .17;
  add(G.sph(1, 18, 12), K.fur, bx, by, 0, 0, 0, 0, [rx, ry, rz]);
  add(G.sph(1, 12, 9), K.fur, bx - .1, by + .02, -.07, 0, 0, 0, [.12, .1, .1]);
  for (const dx of [-.16, -.08, 0]) { const q = Math.sqrt(1 - (dx / rx) ** 2); add(G.sph(1, 14, 8), K.furD, bx + dx, by + .003, 0, 0, 0, 0, [.017, ry * q * 1.04, rz * q * 1.04]); }
  add(G.sph(1, 10, 8), K.apr, bx + .07, by + ry * .9, .04, 0, 0, 0, [.065, .03, .055]);
  const hx = .2, hy = .1, hz = .03;
  add(G.sph(1, 16, 12), K.fur, hx, hy, hz, 0, 0, 0, [.12, .102, .118]);
  add(G.sph(1, 10, 8), K.apr, hx + .02, hy + .088, hz, 0, 0, -.2, [.06, .022, .055]);
  add(G.sph(1, 10, 8), K.apr, hx + .035, hy + .01, hz + .09, 0, 0, 0, [.05, .045, .03]);
  for (const s of [-1, 1]) add(G.sph(1, 10, 8), K.wht, hx + .1, hy - .03, hz + s * .027, 0, 0, 0, [.034, .03, .035]);
  add(G.sph(1, 8, 6), K.pink, hx + .123, hy - .006, hz, 0, 0, 0, [.012, .01, .016]);
  for (const s of [-1, 1]) add(G.tor(.021, .0055, PI * .9, 4, 9), K.ink, hx + .107, hy + .03, hz + s * .05, 0, HP, PI + .15);
  for (const s of [-1, 1]) { add(G.cone(.046, .08, 10), K.fur, hx - .02, hy + .112, hz + s * .066, s * .45, 0, .2); add(G.cone(.027, .052, 8), K.pink, hx - .008, hy + .106, hz + s * .066, s * .45, 0, .2); }
  for (const s of [-1, 1]) add(G.cap(.03, .07, 3, 8), K.wht, hx + .1, .028, hz + s * .05 - .01, 0, 0, HP);
  const tp = []; for (let i = 0; i <= 8; i++) { const a = PI * 1.02 - i / 8 * PI * .8; tp.push([bx + Math.cos(a) * (rx + .03), .034 + Math.sin(i / 8 * PI) * .012, Math.sin(a) * (rz + .035)]); }
  for (let i = 0; i < 8; i++) { const r0 = .031 - i * .0016, col = i % 2 ? K.furD : K.fur; tube(tp[i], tp[i + 1], r0, col, 8, r0 - .0016); add(G.sph(r0 - .0016, 8, 6), col, ...tp[i + 1]); }
}

// ── 평상 (가게 앞 낮은 나무 평상): 판자 다섯(틈·결·옹이), 둘레 테·다리 이음 나무못·버팀, 발 걸이 — 위엔 남색 방석에 자는 고양이, 태극 부채, 장기판과 알, 보리차 컵 ─────
B.st_bench = f => {
  const L = 1.24, D = .66, TY = .415;
  f.add(mc('st-bench', ({ add }) => {
    add(G.box(L - .08, .012, D - .08, .004), '#5e4030', 0, TY - .042, 0);
    const pw = (D - .02) / 5;
    for (let k = 0; k < 5; k++) { const z = -D / 2 + .01 + pw * (k + .5), col = [C.woodL, '#e3bd86', '#efcf9f', C.woodL, '#e3bd86'][k];
      add(G.box(L, .036, pw - .014, .008), col, 0, TY - .018, z);
      for (let j = 0; j < 2; j++) add(G.pbox(L * (.28 + j * .2), .002, .004), shade(col, -.13), -.22 + j * .38 - k * .04, TY + .0006, z + (j - .5) * pw * .38);
      add(G.cyl(.013, .013, .002, 8), shade(col, -.22), .38 - k * .19, TY + .0006, z + .012);
      for (const s of [-1, 1]) add(G.cyl(.006, .006, .002, 6), '#6b5040', s * (L / 2 - .05), TY + .0006, z);
    }
    for (const s of [-1, 1]) { add(G.box(L - .06, .08, .045, .01), C.woodD, 0, TY - .076, s * (D / 2 - .045)); add(G.box(.045, .08, D - .1, .01), C.woodD, s * (L / 2 - .045), TY - .076, 0); }
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const lx = sx * (L / 2 - .075), lz = sz * (D / 2 - .075);
      add(G.box(.075, TY - .036, .075, .015), C.woodD, lx, (TY - .036) / 2, lz); add(G.box(.085, .02, .085, .006), '#5e4030', lx, .01, lz);
      add(G.box(.032, .15, .03, .006), C.woodD, lx - sx * .075, TY - .15, lz + sz * .02, 0, 0, sx * .75);
      for (const dy of [-.02, .02]) add(G.cyl(.01, .01, .008, 8), '#5e4030', lx, TY - .076 + dy, sz * (D / 2 - .02), HP, 0, 0);
    }
    for (const s of [-1, 1]) add(G.box(.035, .035, D - .16, .008), C.woodD, s * (L / 2 - .075), .12, 0);
    add(G.box(L - .16, .035, .035, .008), C.woodD, 0, .12, -(D / 2 - .075));
    add(G.box(.48, .055, .4, .025), '#55689e', .28, TY + .0275, -.02); add(G.box(.5, .016, .42, .008), C.cream, .28, TY + .03, -.02);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { add(G.sph(.016, 8, 6), C.red, .28 + sx * .245, TY + .03, -.02 + sz * .205); add(G.cone(.012, .04, 6), C.red, .28 + sx * .26, TY + .012, -.02 + sz * .22, PI, 0, 0); }
    add(G.box(.3, .036, .27, .008), '#d9a66b', -.08, TY + .018, -.15);
    for (const [px, pz, col] of [[-.18, -.24, '#c0392b'], [-.08, -.25, '#c0392b'], [.02, -.24, '#c0392b'], [-.14, -.12, '#c0392b'], [-.1, -.04, '#2e7a4a'], [.0, -.06, '#2e7a4a'], [-.2, -.05, '#2e7a4a'], [-.04, -.15, '#2e7a4a']]) {
      add(G.cyl(.022, .024, .016, 8), '#fbf3e0', px, TY + .044, pz); add(G.tor(.016, .004, PI * 2, 3, 8), col, px, TY + .053, pz, HP, 0, 0); add(G.box(.014, .002, .004, .001), col, px, TY + .053, pz); add(G.box(.004, .002, .014, .001), col, px, TY + .053, pz); }
    add(G.cyl(.022, .024, .016, 8), '#fbf3e0', .1, TY + .012, -.05, .3, 0, .9); add(G.tor(.016, .004, PI * 2, 3, 8), '#c0392b', .105, TY + .02, -.045, .3 + HP, 0, .9);
    add(G.cyl(.13, .13, .006, 22), '#c9a640', -.38, TY + .003, .13); add(G.box(.024, .014, .17, .006), C.woodD, -.38, TY + .008, .3, 0, .0, 0);
    add(G.cyl(.036, .03, .075, 12), '#8fd3c4', -.13, TY + .0375, .21); add(G.cyl(.031, .031, .004, 12), '#b07a4a', -.13, TY + .068, .21); add(G.tor(.022, .006, PI, 4, 8), '#8fd3c4', -.092, TY + .04, .21, 0, 0, -HP);
  }));
  decal(f, .27, .25, janggiTex(), -.08, TY + .0365, -.15, 0, {}).rotation.set(-HP, 0, 0);
  { const m = mesh(geo('st-fan', () => new THREE.CircleGeometry(.12, 22)), mat('#ffffff', { map: fanTex(), rough: .85, rim: .06 }), { cast: false }); put(m, -.38, TY + .0075, .13, -HP, 0, .3); f.add(m); }
  const cat = grp(); put(cat, .28, TY + .055, -.02, 0, -.5, 0); f.add(cat);
  cat.add(mc('st-sleepcat', ({ add, tube }) => sleepCat(add, tube)));
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
    // 스케치북 둘 (앞을 보고 벽에 기댐, 위 스프링)
    for (const [dz, dx] of [[-.1, .02], [-.04, -.04]]) { add(G.box(.24, .32, .018, .004), '#fbf8f0', dx, 1.08, dz, -.1, 0, 0); for (let k = 0; k < 8; k++) add(G.tor(.01, .003, PI * 2, 3, 8), C.metalD, dx - .1 + k * .028, 1.239, dz - .016, 0, HP, 0); }
    add(G.box(.32, .08, .22, .02), '#ffffff', .35, .96, .03); for (let k = 0; k < 6; k++) add(G.box(.035, .02, .05, .006), [C.red, C.orng, C.yel, C.grn, C.blue, C.purp][k], .23 + k * .045, 1.0, .07);
    // 3단: 리코더 둘 · 탬버린 · 캐스터네츠
    for (const x of [-.62, -.53]) { add(G.cyl(.019, .024, .36, 10), '#f4efe4', x, 1.58, .05); add(G.cyl(.027, .022, .07, 10), '#8a6040', x, 1.79, .05); add(G.cyl(.03, .024, .05, 10), '#8a6040', x, 1.425, .05);
      for (let k = 0; k < 6; k++) add(G.cyl(.006, .006, .006, 6), C.ink, x, 1.5 + k * .042, .071, HP, 0, 0); }
    add(G.cyl(.14, .14, .05, 18, true), '#e9c48a', -.15, 1.55, .0, HP - .25, 0, 0); add(G.cyl(.13, .13, .005, 18), '#fbf3e0', -.15, 1.55, .0, HP - .25, 0, 0);
    for (let k = 0; k < 4; k++) { const a = k * HP; add(G.cyl(.025, .025, .01, 8), '#d9b54a', -.15 + Math.cos(a) * .14, 1.55 + Math.sin(a) * .135, .0 + Math.sin(a) * .03, HP, 0, 0); }
    add(G.sph(.05, 8, 6), C.red, .25, 1.44, .05, 0, 0, 0, [1, .5, 1]); add(G.sph(.05, 8, 6), C.blue, .37, 1.44, .05, 0, 0, 0, [1, .5, 1]);
    // 칸 앞 가격표 (노란 쪽지)
    for (const [x, y] of [[-.55, .44], [.32, .44], [-.5, .92], [.35, .92], [-.15, 1.4], [.3, 1.4]]) add(G.box(.07, .035, .004, .002), C.yel, x, y - .012, D / 2 + .002);
    // 4단: 줄넘기 둘(손잡이) · 색종이 묶음
    for (const [x, c] of [[-.45, C.red], [-.2, C.grn]]) { add(G.cyl(.025, .025, .14, 8), c, x, 1.95, .02, 0, 0, HP); add(G.cyl(.025, .025, .14, 8), c, x + .12, 1.95, .02, 0, 0, HP); tube([x + .07, 1.95, .02], [x + .05, 1.9, .09], .008, '#f4f1e8'); }
    for (let k = 0; k < 6; k++) add(G.box(.2, .008, .2, .002), [C.red, C.orng, C.yel, C.grn, C.blue, C.purp][k], .3, 1.89 + k * .009, .02, 0, k * .05, 0);
  }));
  decal(f, .22, .29, sketchTex(), -.04, 1.081, -.04 + .0115, 0).rotation.x = -.1;
  decal(f, .3, .075, paintTex(), .35, .96, .141);
  decal(f, .21, .065, penCaseTex(0), .2, .475, .091); decal(f, .21, .065, penCaseTex(1), .45, .475, .091);
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

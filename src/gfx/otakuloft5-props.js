// 18판 새 안 '너굴이네 오락실 2층집' otakuloft5 (① 10/23 — 사용자 "완전히 새롭게 다시. 지금 예전 계단 같은 거 너무 별로야", 방향은 B안).
// 옛 18판 구조(방 안 다락 + 서랍 계단)를 버리고 진짜 두 층으로:
//   1층 = 문 닫은 동네 오락실 — 2층 바닥(두꺼운 판, 밑에 형광등)이 뒤 절반을 덮고, 앞은 탁 트인 두 층 높이; 2층 밑엔 오락기 둘·캡슐 뽑기·동전 교환기·
//         경품 진열장, 앞엔 빨강 경품 오락기·인형 뽑기 둘(분홍 곰·민트 토끼), 2층 끝에 매달린 둥근 시계(시간 놀이)
//   2층 = 너굴이 방 — 유리 난간, 옛 18판 우리 가구(이불·만화책장·컴퓨터 책상·브라운관·다락 둥지·빈백)와 긴 서랍장(비밀번호 칸)
//   오르내리기 — 오른쪽 앞 철제 나선 계단(오르기), 왼쪽 2층 끝에서 1층 앞까지 노란 미끄럼틀(내려오기), 가운데 집게 크레인 바구니(물건 오르내림)
//   건물 — 오락기 캐비닛 옆모습 단면(조작판 단추, 불 켜진 간판, 지붕 위 거대 조이스틱), 둥근 섬, 뒤 멀리 19판 소방서
// 장치는 전부 터치하면 저절로(크레인: 손잡이 터치 → 바구니가 올라감, 서랍장: 서랍 넷을 다 열면 숨은 칸이 저절로 — 잠겼으면 비밀번호,
// 캡슐 뽑기: 손잡이 터치 → 손잡이가 돌고 큰 캡슐이 굴러 나와 뚜껑이 열림).
// (10/24 사용자 메모 "GPT 스타일이 남아 있어서 짜증나 · 벽 옆면 텍스처 이상 · 간판 다시 · 게임머신·책상·오브젝트 그림체·톤 안 맞음 ·
// 2층 가구는 우리 어셋으로 · 오락기는 디테일업이나 새로"): 색을 우리 식으로 — 큰 면은 순하게(건물은 크림 캔디 캐비닛, 1층 벽은 라벤더 벽지와
// 페리윙클 판벽, 바닥은 순한 우주 카펫), 쨍한 색은 작은 것(단추·조이스틱·T몰딩·전구)에만. 옆벽의 늘어난 벽화(비스듬한 줄·큰 별)는 빼고
// 벽지·판벽에 점수판·포스터·요금표를 붙임. 간판은 아크릴 라이트 박스 + 너굴이 마스코트(한·영 글자). 오락기·인형 뽑기·캡슐 뽑기·동전 교환기·
// 경품 진열장은 이 파일에서 새로 지음(GPT 캡슐 뽑기 gpt_gacha는 폐기).
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, shade, roundRect, cutFace, liner, windowFace } from './kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HG as G, hmc as mc, hxf as xf } from './house-props.js';
import { rrect, circle, ext, islandShape, ISY, rainTex, tileTex, foldWall, tagWall, basic, rnd, CURB, EARTH, EARTHD, PAVED, LEAF, LEAF2, POLE, WARM, CREAM, CORAL, INKY } from './otakuloft3-props.js';
import { warmPaper, seg } from './otakuloft4-props.js';
import { FONT, fitText, textTex, paperFill, paperSheet } from './gpt-paper.js';
import { LANG, addI18n } from '../i18n.js';
import { rainFall } from './s3-kit.js';

addI18n({
  '너굴이네 오락실 2층집': "Rocky's Arcade House", '너굴 오락실': "ROCKY'S ARCADE", '게임 · 인형 뽑기 · 경품': 'GAMES · CLAW · PRIZES',
  '오늘 영업 끝!': 'Closed for today!', '내일 오전 10시에 만나요': 'See you tomorrow at 10 AM', '영업 시간': 'Open hours', '인형 뽑기 1판': 'Claw, 1 play',
  '500원': '500 won', '오늘의 최고 점수': "TODAY'S HIGH SCORES", '요금표': 'Prices', '오락기': 'Arcade', '인형 뽑기': 'CLAW', '캡슐 뽑기': 'Capsules',
  '1판 500원': '500 a play', '1개 300원': '300 each', '300원': '300 won', '캡슐 토이': 'CAPSULE TOYS', '동전 교환': 'CHANGE', '1000원 → 500원 × 2': '1000 → 500 × 2',
  '★ 경품 ★': '★ PRIZES ★', '몽글 점프': 'MONGLE JUMP', '별똥 슈팅': 'STAR SHOOTER', '너굴 레이서': 'ROCKY RACER',
  // 자리·부품 이름
  '나선 계단 밑': 'Under the spiral stairs', '나선 계단 가운데 칸': 'On a spiral stair step', '미끄럼틀 끝 매트': "On the mat at the slide's end",
  '경품 진열장 가운데 칸': 'Prize case, middle shelf', '경품 진열장 아래 칸': 'Prize case, bottom shelf', '경품 진열장 옆 틈': 'Beside the prize case',
  '서랍장 1번 서랍': 'Chest drawer 1', '서랍장 2번 서랍': 'Chest drawer 2', '서랍장 3번 서랍': 'Chest drawer 3', '서랍장 4번 서랍': 'Chest drawer 4',
  '서랍장 1번 서랍 속': 'In chest drawer 1', '서랍장 2번 서랍 속': 'In chest drawer 2', '서랍장 3번 서랍 속': 'In chest drawer 3', '서랍장 4번 서랍 속': 'In chest drawer 4',
  '서랍장 끝 숨은 칸': 'Secret cubby in the chest', '서랍장 옆 틈': 'Beside the chest', '서랍장 위 어항 옆': 'By the fish tank on the chest',
  '크레인 바구니': 'Crane basket', '크레인 바구니 안': 'In the crane basket', '크레인 집게 밑 고리': 'Hook under the crane claw', '크레인 기둥 옆': 'Beside the crane post',
  '오락기 아래 문': "Arcade cabinet's coin door", '오락기 아래 칸': "Arcade cabinet's coin box", '오락기 옆 틈': 'Beside the arcade cabinet', '오락기 의자 밑': 'Under the arcade stool',
  '오락기 위': 'On top of the arcade cabinet', '인형 나오는 곳': 'Prize door', '인형 뽑기 기계 위': 'On top of the claw machine', '인형 뽑기 기계 뒤': 'Behind the claw machine',
  '캡슐 손잡이': 'Capsule knob', '캡슐 속': 'Inside the capsule', '캡슐 통 서랍': 'Capsule stock drawer', '캡슐 통 서랍 안': 'In the capsule stock drawer',
  '캡슐 뽑기 위': 'On top of the capsule machines', '캡슐 뽑기 옆 틈': 'Beside the capsule machines', '동전 받는 컵': 'Coin cup', '동전 교환기 위': 'On the change machine',
  '동전 교환기 옆 틈': 'Beside the change machine',
  // 이 판의 우리 가구(옛 18판) 자리 이름 — 사전에 없을 때만
  'TV장 서랍': 'TV stand drawer', 'TV장 서랍 안': 'In the TV stand drawer', 'TV 뒤': 'Behind the TV', 'TV장 위 게임 사이': 'Among the games on the TV stand',
  '만화책장 위': 'On the comic shelf', '만화책장 앞 쌓인 책 뒤': 'Behind the comic pile', '빨간 만화책': 'The red comic', '책장 뒤 비밀 칸': 'Secret niche behind the shelf',
  '베개': 'Pillow', '베개 밑': 'Under the pillow', '이불': 'Quilt', '너굴이 인형 뒤': 'Behind the Rocky plush', '만화책 더미 뒤': 'Behind the comic stack',
  '방석': 'Cushion', '방석 밑': 'Under the cushion', '후드티': 'Hoodie', '벗어 둔 후드티 밑': 'Under the hoodie', '만화책 탑 뒤': 'Behind the comic tower',
  '과자 봉지 밑': 'Under the snack bag', '컴퓨터 책상 위': 'On the computer desk', '컴퓨터 책상 밑': 'Under the computer desk',
  // 가구 이름
  '철제 나선 계단': 'Spiral stairs', '노란 미끄럼틀': 'Yellow slide', '경품 진열장': 'Prize case', '긴 서랍장': 'Long chest of drawers', '집게 크레인 바구니': 'Claw crane basket',
  '인형 뽑기 기계': 'Claw machine', '동전 교환기': 'Change machine', '너굴 오락실 오락기': "Rocky's arcade cabinet",
});

const PI = Math.PI, HP = PI / 2;
export const OL5_Y = 2.5;   // 2층 바닥 윗면
const RWID = 7, Y2 = OL5_Y, SLAB_B = 2.2, TOP = 5.2, NX0 = -3.84, NX1 = 3.7, NT = .34, NZ = -3, WX = -3.5, WT = .3, EX = 3.5, SZ = 0;
// 옆모습 (z, y): 간판은 2층 바닥 앞 끝이 가리지 않게 뒤로 당기고 높게 (카메라 35°)
const PROFILE = [[-3.0, 0], [3.12, 0], [3.12, 1.0], [3.6, 1.08], [3.6, 1.32], [2.95, 1.42], [1.5, 4.25], [2.0, 4.3], [2.0, 5.0], [1.8, TOP], [-2.65, TOP], [-3.0, TOP - .35]];
// ── 색: 큰 면은 순하게(크림 캔디 캐비닛·라벤더 벽지·페리윙클 판벽), 쨍한 색은 작은 것에만 ─────────────────────────────
const CAB = '#f4e9da', CABD = '#e2d3be', MOLD = '#ee8a78', ROOF5 = '#bdb5d2', INK5 = '#4a4560', PLUM = '#6a6688', PLUMD = '#5a5676',
  PAPER5 = '#efe8f4', WAIN5 = '#9298c8', WAIN5D = '#777db2', RAIL = '#fbf4ea', STEEL5 = '#d3d8e4', STEEL5D = '#9aa1b8',
  BUTTER = '#ffd36b', TOMATO5 = '#ef6a5e', SKY5 = '#8fd3f4', MINT5 = '#7fd6c0', PINK5 = '#ffa8c5', LILAC5 = '#b9a6ff',
  WOOD5 = '#d9a46a', WOOD5D = '#a8754a', GLASS = '#d6eef8', COON = '#b8b2c6', COOND = '#4a4458', COONW = '#f6f3fa', CHEEK = '#ff9fb5';
const PLUSH = ['#ffb3cd', '#9fd8ff', '#ffe08a', '#b9f0a0', '#d9c2ff', '#ffc89a', '#f6f1ea'];
const B = {};
let PLANK = null;
// 2층 마루: 따뜻한 꿀색 널, 이음매·나뭇결 (2 m 한 장)
const plankTex = () => PLANK || (PLANK = (() => {
  const t = canvasTex(256, 256, (c, W, H) => {
    c.fillStyle = '#e2b47c'; c.fillRect(0, 0, W, H); const r = rnd(31);
    for (let y = 0; y < H; y += 32) { c.fillStyle = shade('#e2b47c', -.06 + r() * .1); c.fillRect(0, y + 1, W, 30); c.fillStyle = '#b98a5c'; c.fillRect(0, y, W, 2); const o = Math.floor(r() * W); c.fillRect(o, y, 2, 32); c.fillRect((o + 128) % W, y, 2, 32);
      c.strokeStyle = 'rgba(140,90,50,.18)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, y + 12 + r() * 8); c.bezierCurveTo(80, y + 8, 170, y + 22, W, y + 14); c.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 2, 1 / 2); return t;
})());
const profileShape = () => { const s = new THREE.Shape(); PROFILE.forEach(([z, y], i) => i ? s.lineTo(-z, y) : s.moveTo(-z, y)); s.closePath(); return s; };
const bulb = (f, c, x, y, z, r = .035) => { const b = mesh(new THREE.SphereGeometry(r, 8, 6), mat(c, { emissive: c, ei: 1.1 }), { cast: false }); put(b, x, y, z); f.add(b); return b; };

// ── 그림 도우미 ─────────────────────────────────────────────────────────────────────────────────────────────
const once = fn => { let v = null; return () => v || (v = fn()); };
// 무늬 한 장 = m 미터 (판의 uv를 미터로 두면 늘어나지 않음)
const tile = (t, m) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / m, 1 / m); return t; };
const meterPlane = (w, h) => { const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getY(i)); return g; };
const star4 = (c, x, y, s) => { c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y + s); c.quadraticCurveTo(x, y, x - s, y); c.quadraticCurveTo(x, y, x, y - s); c.fill(); };
const star5 = (c, x, y, R, r) => { c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? r : R, a = -HP + i * PI / 5; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); };
const heart = (c, x, y, s) => { c.beginPath(); c.moveTo(x, y + s * .9); c.bezierCurveTo(x - s * 1.4, y - s * .1, x - s * .7, y - s * 1.05, x, y - s * .35); c.bezierCurveTo(x + s * .7, y - s * 1.05, x + s * 1.4, y - s * .1, x, y + s * .9); c.fill(); };
const dot = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); };
const cloud = (c, x, y, s) => { for (const [dx, dy, r] of [[0, 0, 12], [13, -5, 14], [27, 0, 11], [13, 4, 12]]) dot(c, x + dx * s, y + dy * s, r * s); };
// 빛나는 덩어리 (모양은 mc로, 재질은 빛 — 몸과 따로 두어 빛이 남음)
const lamp = (key, c, fn, ei = 1.1) => { const m = mc('ol5-glow|' + key, fn); m.material = mat(c, { emissive: c, ei }); m.castShadow = false; return m; };

// 1층 벽지: 라벤더 크림에 넓은 띠·핀 줄, 띠 사이 작은 네 갈래 별과 분홍 점 (1 m 한 장)
const paper1Tex = once(() => tile(canvasTex(256, 256, (c, W, H) => {
  c.fillStyle = PAPER5; c.fillRect(0, 0, W, H);
  c.fillStyle = '#e7dff1'; for (let x = 0; x < W; x += 128) c.fillRect(x + 10, 0, 44, H);
  c.fillStyle = '#dcd1ea'; for (let x = 0; x < W; x += 128) { c.fillRect(x + 4, 0, 2, H); c.fillRect(x + 60, 0, 2, H); }
  c.fillStyle = '#d2c4e6'; for (const [x, y] of [[96, 36], [96, 164], [224, 100], [224, 228]]) star4(c, x, y, 9);
  c.fillStyle = '#efc9da'; for (const [x, y] of [[96, 100], [96, 228], [224, 36], [224, 164]]) dot(c, x, y, 3.5);
}), 1));
// 1층 아래 판벽: 순한 페리윙클 널빤지(12.5 cm 홈), 칠 결 (1 m 한 장)
const wainTex = once(() => tile(canvasTex(256, 256, (c, W, H) => {
  c.fillStyle = WAIN5; c.fillRect(0, 0, W, H); const r = rnd(17);
  for (let i = 0; i < 500; i++) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(30,30,80,.05)'; c.fillRect(r() * W, r() * H, 2, 3); }
  for (let x = 0; x < W; x += 32) { c.fillStyle = WAIN5D; c.fillRect(x, 0, 3, H); c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x + 3, 0, 2, H); }
}), 1));
// 1층 오락실 카펫: 순한 남보라에 고리 행성·네 갈래 별·분홍 점 — 대비는 낮게 (1.5 m 한 장)
const carpetTex = once(() => tile(canvasTex(384, 384, (c, W, H) => {
  c.fillStyle = '#686da6'; c.fillRect(0, 0, W, H); const r = rnd(13);
  for (let i = 0; i < 1400; i++) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.045)' : 'rgba(20,20,70,.06)'; c.fillRect(r() * W, r() * H, 2, 2); }
  c.lineWidth = 5; c.strokeStyle = '#8b90c9';
  for (const [x, y, rr] of [[70, 80, 22], [262, 232, 18], [150, 330, 14]]) { c.beginPath(); c.arc(x, y, rr, 0, PI * 2); c.stroke(); }
  c.fillStyle = '#9fd3e6'; for (const [x, y, rr] of [[70, 80, 9], [262, 232, 7], [150, 330, 6]]) dot(c, x, y, rr);
  c.fillStyle = '#f0d58e'; for (const [x, y, s] of [[200, 60, 13], [320, 120, 9], [40, 230, 11], [300, 340, 12], [130, 190, 8]]) star4(c, x, y, s);
  c.fillStyle = '#f2abc9'; for (const [x, y] of [[120, 40], [350, 30], [230, 150], [30, 330], [90, 290], [340, 260], [190, 262], [20, 150]]) dot(c, x, y, 4);
}), 1.5));
// 간판: 아크릴 라이트 박스 — 크림 바탕, 코랄 테 두 줄, 왼쪽 조이스틱·오른쪽 단추 셋 그림, 굵은 잉크 테두리 글자 '너굴 오락실'(영어 화면은 ROCKY'S ARCADE)
const signTex = once(() => textTex(1280, 288, (c, W, H) => {
  c.fillStyle = '#fff6e8'; c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(W / 2, H * .42, 8, W / 2, H * .5, W * .5); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,226,206,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.lineWidth = 5; c.strokeStyle = '#f19c8a'; roundRect(c, 9, 9, W - 18, H - 18, 30); c.stroke();
  c.lineWidth = 2; c.strokeStyle = '#f6c3b5'; roundRect(c, 17, 17, W - 34, H - 34, 24); c.stroke();
  const jx = 74, jy = 78;
  c.fillStyle = PLUM; c.beginPath(); c.ellipse(jx, jy + 22, 30, 10, 0, 0, PI * 2); c.fill();
  c.fillStyle = INK5; c.fillRect(jx - 3, jy - 12, 6, 34);
  c.fillStyle = TOMATO5; dot(c, jx, jy - 18, 15); c.fillStyle = 'rgba(255,255,255,.8)'; dot(c, jx - 5, jy - 23, 4.5);
  for (const [i, col] of [[0, BUTTER], [1, MINT5], [2, PINK5]]) { const bx = W - 102 + i * 28, by = jy + (i === 1 ? -8 : 2); c.fillStyle = shade(col, -.18); c.beginPath(); c.ellipse(bx, by + 4, 12, 6, 0, 0, PI * 2); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(bx, by, 12, 7, 0, 0, PI * 2); c.fill(); }
  fitText(c, '너굴 오락실', W / 2 + 3, 62 + 4, W - 240, 66, '#f2b5a6', { stroke: '#f2b5a6', sw: 12 });
  fitText(c, '너굴 오락실', W / 2, 62, W - 240, 66, TOMATO5, { stroke: '#4a3a52', sw: 9 });
  fitText(c, '게임 · 인형 뽑기 · 경품', W / 2, 117, W * .56, 19, '#3f8797', { weight: 'bold' });
}));
// 간판 밑에 매단 판: 오늘 영업 끝 (시간 놀이) — 종이에 초승달
const closedTex = once(() => textTex(512, 192, (c, W, H) => {
  paperFill(c, W, H, '#fff4e0', 3);
  c.strokeStyle = MOLD; c.lineWidth = 4; roundRect(c, 7, 7, W - 14, H - 14, 10); c.stroke();
  c.fillStyle = BUTTER; dot(c, 30, 34, 13); c.fillStyle = '#fff4e0'; dot(c, 36, 30, 12);
  fitText(c, '오늘 영업 끝!', W / 2 + 10, 36, W - 84, 30, '#4a3a52');
  fitText(c, '내일 오전 10시에 만나요', W / 2, 70, W - 40, 19, '#e2675a');
}));
// 가게 앞 영업 시간 칠판
const boardTex = once(() => textTex(256, 320, (c, W, H) => {
  c.fillStyle = '#3d4a46'; c.fillRect(0, 0, W, H); const r = rnd(8); for (let i = 0; i < 120; i++) { c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(r() * W, r() * H, 3, 2); }
  fitText(c, '영업 시간', W / 2, 22, W - 22, 17, '#fffaf0');
  c.fillStyle = BUTTER; c.font = FONT(19); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('10:00', W / 2, 50); c.fillText('~ 22:00', W / 2, 72);
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(16, 90); c.lineTo(W - 16, 90); c.stroke();
  fitText(c, '인형 뽑기 1판', W / 2, 108, W - 22, 14, '#ffb3cd');
  fitText(c, '500원', W / 2, 130, W - 22, 17, '#ffb3cd');
  c.fillStyle = '#ffb3cd'; heart(c, 20, 146, 5); heart(c, W - 20, 146, 5);
}));
// 1층 옆벽 오늘의 최고 점수판
const scoreTex = once(() => textTex(480, 336, (c, W, H) => {
  c.fillStyle = '#3e4670'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#4a5382'; for (let y = 43; y < H - 8; y += 25) c.fillRect(10, y, W - 20, 13);
  fitText(c, '오늘의 최고 점수', W / 2, 21, W - 30, 19, BUTTER, { stroke: '#2c3154', sw: 4 });
  const names = LANG === 'en' ? ['ROCKY', 'MONGLE', 'BUNNY', 'BEAR', 'KITTY'] : ['너굴', '몽글', '토순', '곰돌', '냥냥'];
  const pts = ['999,900', '512,300', '408,050', '233,700', '120,400'], cols = [BUTTER, '#d9dcef', '#f2b48a', '#bfe4f2', '#bfe4f2'];
  names.forEach((n, i) => { const y = 50 + i * 25; c.textBaseline = 'middle'; c.font = FONT(14); c.textAlign = 'left'; c.fillStyle = cols[i]; c.fillText(String(i + 1), 20, y); c.fillText(n, 42, y); c.textAlign = 'right'; c.fillStyle = '#ffffff'; c.fillText(pts[i], W - 20, y); });
  c.fillStyle = BUTTER; c.beginPath(); c.moveTo(108, 54); c.lineTo(111, 44); c.lineTo(115, 50); c.lineTo(119, 42); c.lineTo(123, 50); c.lineTo(127, 44); c.lineTo(130, 54); c.closePath(); c.fill();
}));
// 1층 옆벽 게임 포스터: 몽글 점프 (구름 위로 뛰는 몽글이)
const posterTex = once(() => textTex(256, 352, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7fcdf3'); g.addColorStop(1, '#e6f6ff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#ffffff'; cloud(c, 10, 120, 1); cloud(c, 78, 100, 1.1); cloud(c, 60, 140, .8);
  c.fillStyle = '#ffe14d'; star5(c, 22, 26, 8, 3.5); star5(c, 108, 40, 6, 2.6); star5(c, 100, 14, 5, 2.2);
  c.fillStyle = '#ffcfae'; c.beginPath(); c.ellipse(42, 60, 9, 16, .5, 0, PI * 2); c.fill(); c.beginPath(); c.ellipse(86, 60, 9, 16, -.5, 0, PI * 2); c.fill();
  c.fillStyle = '#fff6ee'; c.beginPath(); c.ellipse(64, 72, 30, 25, -.12, 0, PI * 2); c.fill(); c.strokeStyle = '#4a3a52'; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = '#2a1d33'; dot(c, 55, 70, 3); dot(c, 72, 68, 3); c.fillStyle = CHEEK; dot(c, 48, 78, 4); dot(c, 80, 76, 4);
  c.strokeStyle = '#2a1d33'; c.lineWidth = 1.6; c.beginPath(); c.arc(63.5, 74, 3.5, .2, PI - .2); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.7)'; for (const [x, y] of [[36, 100], [46, 106], [86, 104]]) dot(c, x, y, 2);
  c.fillStyle = TOMATO5; roundRect(c, 8, H - 40, W - 16, 30, 8); c.fill();
  fitText(c, '몽글 점프', W / 2, H - 25, W - 30, 18, '#fffaf0', { stroke: '#4a3a52', sw: 3 });
}));
// 1층 옆벽 요금표 (종이)
const priceTex = once(() => textTex(288, 208, (c, W, H) => {
  paperFill(c, W, H, '#fff7e6', 5);
  fitText(c, '요금표', W / 2, 16, W - 20, 15, '#e2675a');
  c.strokeStyle = 'rgba(74,58,82,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(14, 28); c.lineTo(W - 14, 28); c.stroke();
  [['오락기', '1판 500원'], ['인형 뽑기', '1판 500원'], ['캡슐 뽑기', '1개 300원']].forEach(([a, b], i) => { const y = 44 + i * 20; fitText(c, a, W * .28, y, W * .46, 12, '#4a3a52'); fitText(c, b, W * .72, y, W * .46, 12, '#4a3a52'); });
}));

// ── 섬·건물 ───────────────────────────────────────────────────────────────────────────────────────────────
B.ol5_shell = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.3, 0, .001, -.29, .001];
  // 섬 (둥근 섬·연석·잔디·맨홀·웅덩이·가로등)
  f.add(mc('ol5-island', ({ add }) => {
    add(ext(islandShape(), .3, 16), PAVED, 0, ISY - .3, 0, -HP, 0, 0);
    add(ext(islandShape(.22), .42, 16), EARTH, 0, ISY - .72, 0, -HP, 0, 0);
    add(ext(islandShape(.42), .14, 16), EARTHD, 0, ISY - .86, 0, -HP, 0, 0);
    const ring = islandShape(); ring.holes.push(islandShape(.16)); add(ext(ring, .07, 16), CURB, 0, ISY - .002, 0, -HP, 0, 0);
    add(G.box(NX1 - NX0 + .14, .16, 3.12 - NZ + NT, .04), PLUM, (NX0 + NX1 + .14) / 2, -.082, (NZ - NT + 3.12) / 2);
    for (const [x, z, n] of [[-4.0, -.6, 5], [-3.95, 1.4, 4], [4.6, -1.7, 5], [4.75, .2, 4], [-2.6, -3.5, 4], [2.2, -3.55, 5], [4.3, 2.9, 4]])
      for (let k = 0; k < n; k++) { const a = k * 2.3; add(G.sph(.09 + (k % 3) * .02, 8, 6), k % 2 ? LEAF : LEAF2, x + Math.cos(a) * .09, ISY + .04 + (k % 2) * .03, z + Math.sin(a) * .07, 0, 0, 0, [1.1, .8, 1]); }
    add(G.cyl(.32, .32, .02, 24), '#6d7286', 4.2, ISY + .01, 2.6); add(G.tor(.32, .025, PI * 2, 4, 24), '#5b6074', 4.2, ISY + .02, 2.6, HP, 0, 0);
    for (let k = -2; k <= 2; k++) add(G.box(.5 - Math.abs(k) * .1, .012, .03, .004), '#5b6074', 4.2, ISY + .025, 2.6 + k * .1);
    for (const [x, z, rx, rz, a] of [[4.3, .6, .5, .3, .3], [.9, 4.0, .62, .34, -.1], [3.1, 3.95, .4, .24, .2]]) {
      add(G.cyl(1, 1, .01, 28), '#4b5680', x, ISY + .008, z, 0, a, 0, [rx, 1, rz]); add(G.cyl(1, 1, .006, 28), '#6c78a6', x, ISY + .006, z, 0, a, 0, [rx + .05, 1, rz + .04]);
      for (const [dx, dz, r] of [[-.12, .02, .08], [.14, -.05, .05]]) add(G.tor(r, .006, PI * 2, 3, 18), '#a9b6e0', x + dx, ISY + .016, z + dz, HP, 0, 0);
      add(G.box(rx * .9, .004, .035, .002), '#ffd8c8', x, ISY + .016, z + rz * .2, 0, a + .05, 0);
    }
    const lx = -1.5, lz = 4.05;
    add(G.cyl(.16, .2, .14, 12), POLE, lx, ISY + .07, lz); add(G.cyl(.05, .065, 2.5, 10), POLE, lx, ISY + 1.32, lz);
    add(G.box(.06, .06, .5, .02), POLE, lx, ISY + 2.6, lz - .22); add(G.cone(.2, .16, 12), POLE, lx, ISY + 2.56, lz - .45);
    // 가게 앞 A자 칠판 (나무 틀 둘, 위 손잡이, 경첩)
    for (const s of [-1, 1]) { add(G.box(.5, .72, .035, .012), WOOD5, 2.2, ISY + .36, 3.75 + s * .1, s * .2, 0, 0); }
    add(G.box(.18, .04, .05, .015), WOOD5D, 2.2, ISY + .73, 3.75); add(G.cyl(.012, .012, .52, 6), STEEL5D, 2.2, ISY + .7, 3.75, 0, 0, HP);
  }));
  bulb(f, WARM, -1.5, ISY + 2.44, 3.6, .085);
  { const g = new THREE.ShapeGeometry(islandShape(.16), 16); const m = mesh(g, mat('#ffffff', { map: tileTex(), rough: .5, rim: .1 }), { cast: false }); put(m, 0, ISY + .002, 0, -HP, 0, 0); m.userData.floor = true; f.add(m); }
  { const b = mesh(new THREE.PlaneGeometry(.42, .58), mat('#ffffff', { map: boardTex(), rough: .8, rim: .1 }), { cast: false }); put(b, 2.2, ISY + .37, 3.875 + .019, .2, 0, 0); f.add(b); }
  // 1층 오락실 카펫 (방 바닥 위 한 겹)
  { const m = mesh(meterPlane(EX - WX, 3.0 - NZ), mat('#ffffff', { map: carpetTex(), rough: .95, rim: .05 }), { cast: false }); put(m, (WX + EX) / 2, .004, (NZ + 3.0) / 2, -HP, 0, 0); m.userData.floor = true; f.add(m); }

  // ── 2층 바닥판: 두꺼운 판(밑은 오락실 천장 — 형광등 셋, 하나만 켜 둠), 앞 얼굴은 크림 띠에 코랄 줄·꼬마 전구, 위는 꿀색 마루
  f.add(mc('ol5-slab', ({ add }) => {
    add(G.box(RWID, Y2 - SLAB_B, -NZ + SZ, .03), '#e9e3ef', 0, (SLAB_B + Y2) / 2, (NZ + SZ) / 2);
    add(G.box(RWID + .04, Y2 - SLAB_B + .04, .08, .02), CAB, 0, (SLAB_B + Y2) / 2, SZ + .02); add(G.box(RWID + .06, .045, .1, .015), MOLD, 0, Y2 - .02, SZ + .03);
    add(G.box(RWID + .06, .03, .1, .01), CABD, 0, SLAB_B + .015, SZ + .03);
    for (const x of [-2.2, 0, 2.2]) { add(G.box(1.3, .05, .16, .02), '#d9d3e6', x, SLAB_B - .03, -1.6); }
    // 매달린 둥근 시계 (양면) — 2층 끝 밑, 가운데 왼쪽
    for (const x of [-1.95, -1.65]) add(G.cyl(.012, .012, .2, 6), STEEL5D, x, SLAB_B - .1, SZ - .1);
    add(G.cyl(.3, .3, .1, 26), CREAM, -1.8, 1.86, SZ - .1, HP, 0, 0); add(G.tor(.3, .04, PI * 2, 6, 26), CORAL, -1.8, 1.86, SZ - .1);
    for (const sz of [-1, 1]) { const z = SZ - .1 + sz * .055; add(G.box(.025, .2, .01, .005), INKY, -1.8, 1.93, z); add(G.box(.15, .025, .01, .005), INKY, -1.74, 1.86, z, 0, 0, .5);
      for (let k = 0; k < 12; k++) { const a = k * PI / 6; add(G.box(.02, .045, .01, .003), INKY, -1.8 + Math.sin(a) * .24, 1.86 + Math.cos(a) * .24, z, 0, 0, -a); } }
    // 유리 난간 기둥·윗대 (미끄럼틀 입구와 나선 계단 도착 자리는 비움)
    for (const x of [-2.45, -1.2, 0, 1.2, 2.45]) add(G.box(.05, .92, .05, .01), STEEL5, x, Y2 + .46, SZ - .05);
    add(G.cyl(.028, .028, 4.9, 8), MOLD, 0, Y2 + .93, SZ - .05, 0, 0, HP);
  }));
  { const top = mesh(new THREE.PlaneGeometry(RWID, -NZ + SZ), mat('#ffffff', { map: plankTex(), rough: .7, rim: .1 }), { cast: false }); put(top, 0, Y2 + .002, (NZ + SZ) / 2, -HP, 0, 0); top.userData.floor = true; f.add(top); }
  { const g = mesh(new THREE.PlaneGeometry(4.9, .86), mat(GLASS, { opacity: .3, rough: .2 }), { cast: false }); put(g, 0, Y2 + .47, SZ - .05); f.add(g); }
  // (10/24 사용자 "위(2층)가 좀 어색하고 썰렁 … 어둡지만 컬러풀하고 화사하게"): a string of fairy lights draped post to post along the
  // railing's top rail — little glowing bulbs in pink, mint, butter and lilac — and a second one along the back wall's top
  // (⑤ 성능 10/26: the 41 bulbs were a mesh each — 82 draw calls a frame for colour + IDs; now one mesh a colour, the same
  // spheres in the same places)
  { const cols = ['#ff3fa8', '#1fe4ff', '#ffd23a', '#9b5cff'], mats = cols.map(c => mat(c, { emissive: c, ei: 1.4 })), wire = [], bulb = new THREE.SphereGeometry(.048, 10, 8), per = cols.map(() => []);
    const drape = (x0, x1, y, z, n, sag, k0) => { for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, yy = y - sag * 4 * t * (1 - t); wire.push([x, yy, z]);
      if (i > 0 && i < n) { const g = bulb.clone(); g.scale(1, 1.25, 1); g.translate(x, yy - .045, z); per[(k0 + i) % 4].push(g); } } };
    const posts = [-2.45, -1.2, 0, 1.2, 2.45];
    for (let k = 0; k < posts.length - 1; k++) drape(posts[k], posts[k + 1], Y2 + .93, SZ - .02, 6, .16, k);
    for (let k = 0; k < 3; k++) drape(-3.2 + k * 2.2, -1.0 + k * 2.2, Y2 + 2.25, NZ + .06, 8, .22, k + 1);
    per.forEach((gs, c) => { if (!gs.length) return; const m = new THREE.Mesh(mergeGeometries(gs), mats[c]); m.userData.noMerge = true; f.add(m); gs.forEach(g => g.dispose()); });
    f.add(mc('ol5-fairywire', ({ tube }) => { for (let i = 1; i < wire.length; i++) if (Math.abs(wire[i][0] - wire[i - 1][0]) < .5) tube(wire[i - 1], wire[i], .006, '#3d3a52', 4); }));
  }
  { const b = mesh(new THREE.BoxGeometry(1.2, .04, .12), mat('#f4f8ff', { emissive: '#f4f8ff', ei: 1.0 }), { cast: false }); put(b, 0, SLAB_B - .06, -1.6); f.add(b); }
  for (let k = 0; k < 16; k++) bulb(f, k % 2 ? '#fff1b8' : '#ffd0c4', -3.3 + k * 6.6 / 15, (SLAB_B + Y2) / 2, SZ + .07, .03);

  // ── 뒷벽: 1층 오락실 벽(라벤더 벽지·페리윙클 판벽) · 2층 너굴이 방(비 오는 창·꼬마전구), 지붕 반쯤 + 거대 조이스틱 간판 ─────────────
  const N = foldWall(f, [0, 0, 1], TOP); N.th = -.18;
  {
    const WIN = [-.15, 3.95, 1.45, 4.8];
    const body = new THREE.Shape(); rrect(body, NX0, 0, NX1, TOP, [0, 0, .35, .35]); body.holes.push(rrect(new THREE.Path(), ...WIN, .08));
    N.g.add(mc('ol5-back', ({ add }) => {
      add(ext(body, NT, 8), CAB, 0, 0, NZ - NT);
      add(G.box(NX1 - NX0, .14, .06, .02), MOLD, (NX0 + NX1) / 2, TOP - .07, NZ + .02);
      add(G.box(NX1 - WX, .1, .04, .015), PLUM, (WX + NX1) / 2, .05, NZ + .02);
      add(G.box(NX1 - WX, .055, .045, .015), RAIL, (WX + NX1) / 2, 1.02, NZ + .022);
      add(G.box(RWID, .1, .05, .02), '#b98a5c', 0, Y2 + .05, NZ + .025);
    }));
    const low = mesh(meterPlane(NX1 - .02 - WX, SLAB_B), mat('#ffffff', { map: paper1Tex(), rough: .9, rim: .1 }), { cast: false }); put(low, (WX + NX1) / 2, SLAB_B / 2, NZ + .003); N.g.add(low);
    const wn = mesh(meterPlane(NX1 - .02 - WX, 1.0), mat('#ffffff', { map: wainTex(), rough: .9, rim: .1 }), { cast: false }); put(wn, (WX + NX1) / 2, .5, NZ + .006); N.g.add(wn);
    const up = new THREE.Shape(); rrect(up, WX, Y2, NX1 - .02, TOP - .14, 0); up.holes.push(rrect(new THREE.Path(), ...WIN, .08));
    const um = mesh(new THREE.ShapeGeometry(up, 6), mat('#ffffff', { map: warmPaper(), rough: .9, rim: .1 }), { cast: false }); put(um, 0, 0, NZ + .003); N.g.add(um);
    N.knee.add(mc('ol5-back-knee', ({ add }) => { add(G.box(NX1 - NX0, .42, NT, .05), CAB, (NX0 + NX1) / 2, .21, NZ - NT / 2); add(G.box(NX1 - NX0, .05, NT + .04, .02), MOLD, (NX0 + NX1) / 2, .42, NZ - NT / 2); }));
    { const gl = new THREE.Mesh(new THREE.ShapeGeometry(rrect(new THREE.Shape(), ...WIN, .08), 6), basic(rainTex(), '#d8def5')); gl.position.z = NZ - NT * .55; N.deco.add(gl); }
    N.deco.add(mc('ol5-window', ({ add }) => {
      const [x0, y0, x1, y1] = WIN, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      for (const y of [y0, y1]) add(G.box(x1 - x0 + .16, .08, .1, .02), '#b98a5c', cx, y, NZ + .02); for (const x of [x0, x1]) add(G.box(.08, y1 - y0 + .08, .1, .02), '#b98a5c', x, cy, NZ + .02);
      add(G.box(.05, y1 - y0, .05, .01), '#b98a5c', cx, cy, NZ - .1); add(G.box(x1 - x0 + .3, .06, .2, .02), '#b98a5c', cx, y0 - .06, NZ + .08);
      // 창턱: 선인장 화분·작은 로봇
      add(G.cyl(.05, .04, .08, 10), '#d98b5f', cx - .5, y0 + .01, NZ + .1); add(G.cap(.03, .07, 2, 6), LEAF2, cx - .5, y0 + .1, NZ + .1);
      add(G.box(.08, .09, .06, .015), '#c9cfd8', cx + .45, y0 + .015, NZ + .1); add(G.box(.06, .06, .05, .015), '#c9cfd8', cx + .45, y0 + .09, NZ + .1); add(G.box(.04, .01, .01, .004), '#7cf0ff', cx + .45, y0 + .1, NZ + .126);
      // 2층 벽: 작은 액자 셋, 게임 포스터
      for (const [x, y, c] of [[-.9, 4.2, '#ffb3cd'], [-.55, 4.45, '#9fd8ff'], [-.55, 4.0, '#ffe08a']]) { add(G.box(.26, .22, .03, .01), '#ffffff', x, y, NZ + .02); add(G.box(.2, .16, .01, .005), c, x, y, NZ + .04); }
      add(G.box(.5, .7, .02, .01), '#ffffff', 2.4, 4.15, NZ + .015); add(G.box(.44, .64, .01, .005), '#3a4a8a', 2.4, 4.15, NZ + .03); add(G.sph(.12, 10, 8), TOMATO5, 2.4, 4.25, NZ + .04, 0, 0, 0, [1, 1, .2]);
    }));
    { const pts = []; for (let k = 0; k <= 18; k++) { const t = k / 18; pts.push([-3.3 + t * 6.6, 4.95 - Math.sin(t * PI * 4) ** 2 * .12]); }
      N.deco.add(mc('ol5-fairy', ({ tube }) => { for (let k = 0; k < pts.length - 1; k++) tube([pts[k][0], pts[k][1], NZ + .06], [pts[k + 1][0], pts[k + 1][1], NZ + .06], .008, '#5a5470', 4); }));
      const cols = ['#ffd98a', '#ff9fb8', '#9fd8ff', '#b9f0a0']; for (let k = 0; k < 17; k++) { const t = (k + .5) / 17; N.deco.add(bulb({ add: o => o }, cols[k % 4], -3.3 + t * 6.6, 4.9 - Math.sin(t * PI * 4) ** 2 * .12, NZ + .07)); } }
    N.deco.add(mc('ol5-roof', ({ add }) => {
      add(G.box(NX1 - NX0 + .2, .22, 1.95, .06), ROOF5, (NX0 + NX1) / 2, TOP + .11, NZ - NT + .95);
      add(G.box(NX1 - NX0 + .24, .08, .1, .02), MOLD, (NX0 + NX1) / 2, TOP + .2, NZ - NT + 1.92);
      const jx = 1.7, jz = -2.25, jy = TOP + .22;
      add(G.box(1.3, .3, 1.1, .1), PLUM, jx, jy + .15, jz); add(G.cyl(.32, .4, .2, 18), PLUMD, jx, jy + .4, jz);
      add(G.cyl(.09, .09, 1.25, 12), STEEL5, jx + .12, jy + 1.0, jz + .08, .14, 0, -.18);
      add(G.sph(.55, 22, 16), '#e9776b', jx + .25, jy + 1.75, jz + .17); add(G.sph(.16, 12, 8), '#ffc0b6', jx + .08, jy + 1.95, jz + .4);
      for (const [x, z, c] of [[-.4, -2.3, BUTTER], [-1.3, -2.1, SKY5]]) { add(G.cyl(.34, .38, .12, 20), PLUM, x, jy + .06, z); add(G.cyl(.3, .3, .14, 20), c, x, jy + .18, z); add(G.cyl(.2, .2, .01, 20), shade(c, .12), x, jy + .255, z); }
    }));
    tagWall(N.g, 'N'); tagWall(N.deco, 'N'); tagWall(N.knee, 'N');
  }

  // ── 옆벽: 캐비닛 옆모습 (안쪽 면은 1층 벽지·판벽, 2층은 크림 벽지·둥근 창), 앞에 튀어나온 조작판 ─────────────────────────
  const W = foldWall(f, [1, 0, 0], TOP); W.th = -.18;
  {
    const PORT = [1.5, 3.75, .3];
    const wall = grp(); wall.rotation.y = HP; wall.position.x = WX - WT; W.g.add(wall);
    const prof = profileShape(); prof.holes.push(circle(new THREE.Path(), ...PORT));
    wall.add(mc('ol5-side', ({ add }) => { add(ext(prof, WT, 6), CAB, 0, 0, 0); }));
    // 안쪽 면 (모양 그대로 자른 판): 무늬는 미터 단위 — 옛 벽화처럼 늘어나지 않게
    const inner = profileShape(); inner.holes.push(circle(new THREE.Path(), ...PORT));
    const im = mesh(new THREE.ShapeGeometry(inner, 6), mat('#ffffff', { map: paper1Tex(), rough: .9, rim: .1 }), { cast: false });
    put(im, 0, 0, WT + .003); wall.add(im);
    const wn = mesh(meterPlane(6.1, 1.0), mat('#ffffff', { map: wainTex(), rough: .9, rim: .1 }), { cast: false }); put(wn, -.05, .5, WT + .006); wall.add(wn);
    wall.add(mc('ol5-side-wain', ({ add }) => { add(G.box(6.1, .055, .045, .015), RAIL, -.05, 1.02, WT + .022); add(G.box(6.1, .1, .03, .01), PLUM, -.05, .05, WT + .016); }));
    const room2 = new THREE.Shape(); rrect(room2, .05, Y2, 3.0, TOP - .2, [0, 0, .25, 0]); room2.holes.push(circle(new THREE.Path(), ...PORT));
    const rm = mesh(new THREE.ShapeGeometry(room2, 8), mat('#ffffff', { map: warmPaper(), rough: .9, rim: .1 }), { cast: false }); put(rm, 0, 0, WT + .009); wall.add(rm);
    W.knee.add(mc('ol5-side-knee', ({ add }) => { add(G.box(WT, .42, 6.12, .05), CAB, WX - WT / 2, .21, .06); add(G.box(WT + .04, .05, 6.12, .02), MOLD, WX - WT / 2, .42, .06); }));
    W.deco.add(mc('ol5-side-trim', ({ add }) => {
      for (let k = 1; k < PROFILE.length; k++) seg(add, WX - WT / 2, WT + .06, PROFILE[k - 1], PROFILE[k], .09, MOLD);
      add(G.tor(.3, .05, PI * 2, 8, 24), '#b98a5c', WX + .03, PORT[1], -PORT[0], 0, HP, 0);
      add(G.box(1.24, .3, .48, .05), CAB, WX - .34 + .62, 1.18, 3.36); add(G.box(1.28, .05, .52, .02), MOLD, WX - .34 + .62, 1.33, 3.36);
      for (const [dx, c] of [[.2, TOMATO5], [.42, BUTTER], [.64, SKY5], [.86, MINT5]]) { add(G.cyl(.08, .08, .07, 16), c, WX - .34 + dx, 1.38, 3.4); add(G.cyl(.055, .055, .01, 16), shade(c, .12), WX - .34 + dx, 1.42, 3.4); }
      add(G.cyl(.02, .02, .2, 8), INKY, WX - .34 + 1.08, 1.45, 3.36); add(G.sph(.065, 10, 8), TOMATO5, WX - .34 + 1.08, 1.56, 3.36);
      add(G.box(.06, .1, 3.0, .02), '#b98a5c', WX + .03, Y2 + .05, -1.5);
    }));
    { const gl = mesh(new THREE.CircleGeometry(.3, 20), basic(rainTex(), '#d8def5'), { cast: false }); gl.rotation.y = HP; gl.position.set(WX - WT * .5, PORT[1], -PORT[0]); W.deco.add(gl); }
    // 벽에 붙은 것 (안쪽 면 x = WX, 얼굴이 +x): 오늘의 최고 점수판 · 몽글 점프 포스터 · 요금표 · 2층 이불 위 만화 벽 선반
    const wput = (o, z, y) => { put(o, WX + .02, y, z, 0, HP, 0); W.deco.add(o); return o; };
    { const bd = grp();
      bd.add(mc('ol5-scoreframe', ({ add }) => {
        add(G.box(.92, .66, .05, .025), PLUM, 0, 0, 0); add(G.box(.32, .06, .04, .015), BUTTER, 0, .345, .01);
        for (const [x, y] of [[-.41, .28], [.41, .28], [-.41, -.28], [.41, -.28]]) add(G.sph(.017, 8, 6), BUTTER, x, y, .03);
      }));
      bd.add(put(mesh(new THREE.PlaneGeometry(.84, .58), basic(scoreTex(), '#f4f0fa'), { cast: false }), 0, 0, .027));
      wput(bd, 1.15, 3.05); }
    wput(paperSheet(.46, .64, posterTex(), { hold: 'tape' }), 2.3, 1.95);
    wput(paperSheet(.44, .32, priceTex(), { hold: 'pin' }), 2.74, 1.38);
    { const sh = grp(); sh.add(mc('ol5-wshelf', ({ add }) => {
        add(G.box(.82, .035, .2, .01), WOOD5, 0, 0, .1); for (const sx of [-1, 1]) add(G.box(.025, .12, .15, .006), WOOD5D, sx * .32, -.07, .07);
        const cs = ['#e8414e', '#3a7bd5', '#ffc23d', '#4caf7a', '#f2f2f2', '#8a5ad8', '#ff8fb8', '#2f2b3d', '#5ec6d6'];
        for (let k = 0; k < 9; k++) add(G.box(.036, .17 - (k % 3) * .015, .13, .004), cs[k], -.33 + k * .039, .1 - (k % 3) * .008, .1);
        add(G.box(.08, .1, .06, .015), '#c9cfd8', .12, .068, .11); add(G.box(.06, .06, .055, .015), '#c9cfd8', .12, .148, .11); add(G.box(.04, .01, .01, .004), '#7cf0ff', .12, .158, .14);
        add(G.cyl(.045, .035, .07, 10), '#d98b5f', .29, .05, .1); add(G.sph(.04, 8, 6), LEAF2, .29, .11, .1, 0, 0, 0, [1, 1.3, 1]);
      })); wput(sh, -2.3, 3.72); }
    tagWall(W.g, 'W'); tagWall(W.deco, 'W'); tagWall(W.knee, 'W');
  }
  // ── 오른쪽: 옆모습 테두리 띠 (오른쪽에서 볼 때만 숨김) ───────────────────────────────────────────────────────
  // (10/24 사용자 "저 옆에 벽은 줌인 들어가거나 회전해도 유지해도 될 듯, 얇아서"): the right side's thin frame never folds
  const E = foldWall(f, [-1, 0, 0], TOP); E.th = -2; E.stub = .02;
  E.g.add(mc('ol5-eframe', ({ add }) => {
    for (let k = 2; k < PROFILE.length; k++) seg(add, EX + .1, .2, PROFILE[k - 1], PROFILE[k], .16, CAB);
    seg(add, EX + .1, .2, PROFILE[PROFILE.length - 1], [-3.0, 0], .16, CAB);
    for (let k = 2; k < PROFILE.length; k++) seg(add, EX + .1, .24, PROFILE[k - 1], PROFILE[k], .05, MOLD);
    add(G.box(.34, .3, .48, .05), CAB, EX + .1, 1.18, 3.36); add(G.cyl(.08, .08, .07, 16), TOMATO5, EX + .1, 1.36, 3.4);
    add(G.box(.2, Y2 - SLAB_B, 3.0, .02), CAB, EX + .1, (SLAB_B + Y2) / 2, -1.5);
  }));
  tagWall(E.g, 'E');

  // ── 간판: 크림 띠(위아래 코랄 줄·전구) 가운데 아크릴 라이트 박스, 박스 왼쪽 위에 너굴이 마스코트, 밑에 매단 '오늘 영업 끝' 판 ─────────
  const MZ = 1.75, MY = 4.68, PW = 3.7, PH = .82, PX = -.05;
  f.add(mc('ol5-marquee', ({ add }) => {
    add(G.box(NX1 - NX0 + .2, .74, .5, .06), CAB, (NX0 + NX1) / 2 + .1, MY, MZ);
    add(G.box(NX1 - NX0 + .24, .07, .54, .02), MOLD, (NX0 + NX1) / 2 + .1, MY + .38, MZ); add(G.box(NX1 - NX0 + .24, .07, .54, .02), MOLD, (NX0 + NX1) / 2 + .1, MY - .38, MZ);
    // 라이트 박스: 둥근 판(두께) + 코랄 테
    const plate = new THREE.Shape(); rrect(plate, -PW / 2, -PH / 2, PW / 2, PH / 2, .18);
    add(ext(plate, .14, 10), CAB, PX, MY, MZ + .2);
    const ring = new THREE.Shape(); rrect(ring, -PW / 2 - .04, -PH / 2 - .04, PW / 2 + .04, PH / 2 + .04, .22); ring.holes.push(rrect(new THREE.Path(), -PW / 2 + .05, -PH / 2 + .05, PW / 2 - .05, PH / 2 - .05, .14));
    add(ext(ring, .05, 10), MOLD, PX, MY, MZ + .32);
    for (const x of [-.45, .45]) add(G.cyl(.006, .006, .48, 4), '#5a5470', x, MY - .62, MZ + .1);
    // 너굴이 마스코트 (판 왼쪽 위에 매달려 고개를 내민 모습): 둥근 머리, 동그란 검은 귀, 눈 둘레 검은 무늬, 흰 얼굴, 코·볼, 판을 잡은 두 손
    const hx = PX - PW / 2 + .42, hy = MY + PH / 2 + .19, hz = MZ + .46;
    add(G.sph(.27, 18, 14), COON, hx, hy, hz, 0, 0, 0, [1.08, .95, .9]);
    for (const sx of [-1, 1]) { add(G.sph(.1, 12, 10), COOND, hx + sx * .2, hy + .21, hz - .02, 0, 0, 0, [1, 1, .7]); add(G.sph(.055, 10, 8), '#8a8298', hx + sx * .2, hy + .21, hz + .03, 0, 0, 0, [1, 1, .5]); }
    add(G.sph(.2, 16, 12), COONW, hx, hy - .05, hz + .1, 0, 0, 0, [1.15, .82, .7]);
    for (const sx of [-1, 1]) {
      add(G.sph(.08, 12, 10), COOND, hx + sx * .1, hy + .02, hz + .19, 0, 0, sx * -.35, [1.2, .8, .45]);
      add(G.sph(.032, 10, 8), '#ffffff', hx + sx * .1, hy + .03, hz + .225); add(G.sph(.018, 8, 6), '#2a1d33', hx + sx * .095, hy + .025, hz + .245);
      add(G.sph(.04, 10, 8), CHEEK, hx + sx * .17, hy - .08, hz + .2, 0, 0, 0, [1.2, .7, .4]);
      add(G.sph(.065, 12, 10), COON, hx + sx * .17, MY + PH / 2 + .02, MZ + .42, 0, 0, 0, [1.1, .8, 1]);
      for (let i = -1; i <= 1; i++) add(G.sph(.016, 6, 4), COOND, hx + sx * .17 + i * .03, MY + PH / 2 + .02, MZ + .48);
    }
    add(G.sph(.035, 10, 8), '#2f2a36', hx, hy - .045, hz + .255);
    add(G.tor(.02, .006, PI, 4, 10), '#2f2a36', hx - .02, hy - .085, hz + .245, 0, 0, PI); add(G.tor(.02, .006, PI, 4, 10), '#2f2a36', hx + .02, hy - .085, hz + .245, 0, 0, PI);
  }));
  { const s = mesh(new THREE.PlaneGeometry(PW - .12, PH - .12), basic(signTex(), '#ebe2e2'), { cast: false }); put(s, PX, MY, MZ + .345); f.add(s); }
  // '오늘 영업 끝' 판: 나무 판에 종이, 줄 둘로 매달림
  f.add(mc('ol5-closed', ({ add }) => { add(G.box(1.08, .46, .04, .02), WOOD5, 0, 3.7, MZ + .08); add(G.box(1.12, .04, .05, .012), WOOD5D, 0, 3.94, MZ + .08); }));
  { const s = mesh(new THREE.PlaneGeometry(1.0, .38), mat('#ffffff', { map: closedTex(), rough: .8, rim: .1 }), { cast: false }); put(s, 0, 3.7, MZ + .102); f.add(s); }
  // 전구: 띠 위아래(라이트 박스 양옆만) + 라이트 박스 테 위아래(마스코트 자리는 비움)
  for (let k = 0; k < 24; k++) { const x = NX0 + .3 + k * (NX1 - NX0 - .6) / 23; if (Math.abs(x - PX) < PW / 2 + .1) continue; bulb(f, k % 2 ? '#fff1b8' : '#ffd0c4', x, MY + .42, MZ + .28, .04); bulb(f, k % 2 ? '#ffd0c4' : '#fff1b8', x, MY - .42, MZ + .28, .035); }
  for (let k = 0; k < 15; k++) { const x = PX - PW / 2 + .2 + k * (PW - .4) / 14; bulb(f, k % 2 ? '#ffd0c4' : '#fff1b8', x, MY - PH / 2 + .005, MZ + .375, .032); if (Math.abs(x - (PX - PW / 2 + .42)) > .38) bulb(f, k % 2 ? '#fff1b8' : '#ffd0c4', x, MY + PH / 2 - .005, MZ + .375, .032); }

  // ── 뒤 멀리 이어지는 동네 (19판 소방서·하얀 집, 카메라 반대쪽일 때만) ─────────────────────────────────────────────
  const town = [];
  const isle = (x, z, r, build) => { const g = grp(); g.position.set(x, -1.4, z); g.scale.setScalar(.6); f.add(g); g.add(mc('ol4-town-isle|' + r, ({ add }) => { add(G.cyl(r, r * .9, .3, 24), '#ece8f2', 0, -.15, 0); add(G.cyl(r * .9, r * .6, .35, 24), '#bdb6cf', 0, -.47, 0); })); build(g); town.push(g); };
  isle(-10.9, -9.3, 1.6, g => g.add(mc('ol4-town-fire', ({ add }) => {
    add(G.box(1.7, 1.1, 1.1, .05), '#f6f3f8', 0, .55, 0); add(G.box(1.8, .12, 1.2, .03), '#e0605a', 0, 1.15, 0);
    add(G.box(.7, .7, .03, .02), '#e8705f', -.35, .36, .56); for (let k = 0; k < 4; k++) add(G.box(.66, .02, .02, .005), '#c9524c', -.35, .14 + k * .16, .58);
    add(G.box(.42, .2, .03, .02), '#e0605a', .45, .9, .56); add(G.box(.28, .26, .03, .01), '#ffe2a6', .45, .45, .56);
    add(G.box(.4, 1.9, .4, .03), '#f6f3f8', -.95, .95, -.2); add(G.box(.48, .1, .48, .02), '#e0605a', -.95, 1.92, -.2); add(G.box(.18, .18, .03, .01), '#ffe2a6', -.95, 1.5, 0);
    add(G.sph(.07, 8, 6), '#ff5a4a', .8, 1.28, .4);
  })));
  isle(-5.5, -14.5, 1.3, g => g.add(mc('ol4-town-house', ({ add }) => {
    add(G.box(1.0, .8, .9, .04), '#f7f5f9', 0, .4, 0);
    const tri = new THREE.Shape(); tri.moveTo(-.62, 0); tri.lineTo(.62, 0); tri.lineTo(0, .5); tri.closePath(); add(ext(tri, 1.0, 2), '#c9c4d8', 0, .8, -.5);
    add(G.box(.22, .22, .03, .01), '#ffe2a6', -.22, .48, .46); add(G.box(.2, .4, .03, .01), '#b9b2cc', .22, .2, .46);
  })));
  isle(-9.5, -14.1, 1.1, g => g.add(mc('ol4-town-house2', ({ add }) => {
    add(G.box(.8, 1.2, .8, .04), '#f7f5f9', 0, .6, 0); add(G.box(.86, .08, .86, .02), '#c9c4d8', 0, 1.22, 0);
    for (const y of [.4, .85]) add(G.box(.2, .2, .03, .01), y > .5 ? '#ffe2a6' : '#d9d4e6', .15, y, .41);
  })));
  for (const g of town) g.traverse(m => { if (m.isMesh) { m.userData.noMerge = true; m.castShadow = false; } });
  (f.live || (f.live = [])).push(...town);

  const cam = new THREE.Vector3(), nrm = new THREE.Vector3(), p = new THREE.Vector3(), o = new THREE.Vector3();
  f.updateView = (Wd, dt = 1 / 60) => {
    if (!Wd || !Number.isFinite(Wd.yaw)) return;
    f.group.updateWorldMatrix(true, false);
    cam.set(Math.sin(Wd.yaw), 0, Math.cos(Wd.yaw));
    const sm = 1 - Math.exp(-Math.max(0, dt) * 12);
    let dirty = false;
    for (const q of f.ol3Walls) {
      nrm.copy(q.n).transformDirection(f.group.matrixWorld);
      const want = nrm.dot(cam) < (q.th ?? -.18) ? 0 : 1, prev = q.k;
      q.k += (want - q.k) * sm; if (Math.abs(q.k - want) < .002) q.k = want;
      if (q.k === prev) continue;
      q.g.scale.y = q.stub + (1 - q.stub) * q.k;
      q.deco.visible = q.k > .65; q.g.visible = q.k > .3; q.knee.visible = q.k <= .3 && q.knee.children.length > 0;
      dirty = true;
    }
    f.group.getWorldPosition(o);
    for (const g of town) { g.getWorldPosition(p); p.sub(o); p.y = 0; const on = p.normalize().dot(cam) < -.35; if (g.visible !== on) { g.visible = on; dirty = true; } }
    if (dirty) { Wd.shadowDirty = true; Wd.idsDirty = true; }
  };
};

// ── 철제 나선 계단 (1×1, 1층 바닥 → 2층 바닥 앞 끝): 가운데 기둥, 앞(+z)에서 올라 한 바퀴 반 돌아 뒤(-z)로 2층에 내림 — 연한 철 디딤판에
// 버터색 끝선, 코랄 손잡이 나선, 기둥 꼭대기 버터색 공
B.ol5_spiral = (f, T, o = {}) => {
  const Y = o.y || Y2, N = 16, R = .56, D = 3 * PI / (N - 1);
  f.add(mc('ol5-spiral2|' + Y, ({ add, tube }) => {
    add(G.cyl(.32, .36, .04, 20), PLUM, 0, .02, 0);
    add(G.cyl(.05, .05, Y + .95, 10), STEEL5, 0, (Y + .95) / 2, 0); add(G.sph(.08, 12, 8), BUTTER, 0, Y + .98, 0);
    const rail = [];
    for (let k = 0; k < N; k++) {
      const a = k * D, y = (k + 1) * Y / N, sx = Math.sin(a), cz = Math.cos(a);
      add(G.box(.3, .045, .5, .012), '#7d7a9c', sx * .3, y, cz * .3, 0, a, 0);
      add(G.box(.3, .02, .05, .006), BUTTER, sx * .54, y + .03, cz * .54, 0, a, 0);
      if (k % 2 === 0) add(G.cyl(.012, .012, .82, 5), STEEL5, sx * R, y + .41, cz * R);
      rail.push([sx * R, y + .84, cz * R]);
    }
    for (let k = 0; k < rail.length - 1; k++) tube(rail[k], rail[k + 1], .025, MOLD, 6);
  }));
  f.spot('under', null, -.22, 0, .18, { maxH: .4, label: '나선 계단 밑', scale: .7 });
  { const k = 7, a = k * D; f.spot('on', null, Math.sin(a) * .36, (k + 1) * Y / N + .03, Math.cos(a) * .36, { maxH: .22, label: '나선 계단 가운데 칸', scale: .6 }); }
  f.collideBox = [-.6, 0, -.6, .6, Y + 1, .6];
};

// ── 노란 미끄럼틀 (1×3, 뒤 끝이 2층 바닥 앞 끝): 2층에서 미끄러져 1층 앞 매트까지 — 내려오는 길. 위에 잡는 손잡이, 밑에 받침 기둥 둘
B.ol5_slide = (f, T, o = {}) => {
  const Y = o.y || Y2;
  const curve = new THREE.CatmullRomCurve3([[0, Y + .04, -1.78], [0, Y - .06, -1.4], [0, Y * .55, -.25], [0, .5, .75], [0, .3, 1.15]].map(p => new THREE.Vector3(...p)));
  f.add(mc('ol5-slide2|' + Y, ({ add }) => {
    const n = 16, pts = curve.getSpacedPoints(n);
    for (let k = 0; k < n; k++) {
      const a = pts[k], b = pts[k + 1], dy = b.y - a.y, dz = b.z - a.z, L = Math.hypot(dy, dz) + .02, rx = -Math.atan2(dy, dz), y = (a.y + b.y) / 2, z = (a.z + b.z) / 2;
      add(G.box(.5, .045, L, .008), '#f7d47a', 0, y, z, rx, 0, 0);
      for (const sx of [-1, 1]) add(G.box(.05, .17, L, .01), '#efb85a', sx * .25, y + .07, z, rx, 0, 0);
    }
    add(G.box(.6, .05, .4, .02), '#efb85a', 0, Y + .02, -1.7);
    for (const sx of [-1, 1]) add(G.cyl(.02, .02, .55, 6), MOLD, sx * .27, Y + .3, -1.62);
    add(G.cyl(.022, .022, .56, 8), MOLD, 0, Y + .58, -1.62, 0, 0, HP);
    for (const [z, h] of [[-.2, 1.3], [.75, .5]]) for (const sx of [-1, 1]) add(G.cyl(.03, .03, h, 8), STEEL5, sx * .2, h / 2, z);
    add(G.box(.7, .09, .5, .04), '#9fb8e8', 0, .045, 1.32); add(G.box(.62, .02, .42, .01), '#c9d8f5', 0, .095, 1.32);
  }));
  f.spot('under', null, .05, 0, -.55, { maxH: .7, label: '미끄럼틀 밑', scale: .8 });
  f.spot('on', null, .1, .1, 1.32, { maxH: .22, label: '미끄럼틀 끝 매트', scale: .7 });
  f.collideBox = [-.5, 0, -1.5, .5, Y + .7, 1.5];
};

// 모찌 인형 한 개 (몸·귀 — face면 눈·볼까지): ear 'bear'|'cat'|'bunny', ry 몸 돌림 (앞 +z)
const plush = (add, x, y, z, s, c, ear, ry = 0, face = true) => {
  const R = (lx, lz) => [x + Math.cos(ry) * lx + Math.sin(ry) * lz, z - Math.sin(ry) * lx + Math.cos(ry) * lz];
  add(G.sph(s, 10, 8), c, x, y + s * .85, z, 0, ry, 0, [1, .88, .95]);
  const ec = shade(c, -.07);
  for (const sx of [-1, 1]) {
    const [ex, ez] = R(sx * s * .55, -s * .05);
    if (ear === 'bunny') add(G.cap(s * .22, s * .7, 2, 6), ec, ex, y + s * 1.85, ez, 0, ry, -sx * .2);
    else if (ear === 'cat') add(G.cone(s * .3, s * .45, 6), ec, ex, y + s * 1.62, ez, 0, ry, -sx * .3);
    else add(G.sph(s * .3, 7, 5), ec, ex, y + s * 1.55, ez, 0, ry, 0, [1, 1, .6]);
  }
  if (!face) return;
  for (const sx of [-1, 1]) {
    const [ex, ez] = R(sx * s * .32, s * .84); add(G.sph(s * .11, 6, 4), INK5, ex, y + s * .98, ez);
    const [bx, bz] = R(sx * s * .55, s * .77); add(G.sph(s * .14, 6, 4), CHEEK, bx, y + s * .8, bz, 0, ry, 0, [1, .6, .4]);
  }
};

const prizeSign = once(() => textTex(320, 72, (c, W, H) => { c.fillStyle = TOMATO5; c.fillRect(0, 0, W, H); fitText(c, '★ 경품 ★', W / 2, H / 2 + 1, W - 16, 24, '#fffaf0', { stroke: '#4a3a52', sw: 4 }); }));
// ── 경품 진열장 (2×1, 2층 밑): 크림 틀에 코랄 테, 유리 선반 세 칸 — 모찌 인형(곰·고양이·토끼 귀), 장난감 상자, 작은 로봇, 가격표; 위 '경품' 띠
B.ol5_prizewall = (f, T) => {
  const z0 = -.25, W = 1.86, H = 1.72, D = .42;
  f.add(mc('ol5-prizewall2', ({ add }) => {
    add(G.box(W, .12, D, .02), PLUM, 0, .06, z0); add(G.box(W + .04, .06, D, .02), CAB, 0, H - .03, z0); add(G.box(W + .06, .03, D + .01, .01), MOLD, 0, H + .01, z0 - .004);
    for (const sx of [-1, 1]) add(G.box(.06, H, D, .02), CAB, sx * (W / 2 - .03), H / 2, z0); add(G.box(W, H, .03, .01), '#f6e9ee', 0, H / 2, z0 - D / 2 + .015);
    for (const y of [.62, 1.12]) { add(G.box(W - .1, .025, D - .04, .008), '#dff0f6', 0, y, z0); add(G.box(W - .1, .03, .02, .006), MOLD, 0, y, z0 + D / 2 - .03); }
    // 미닫이 유리문 틀 (가운데 세로대·손잡이)
    add(G.box(.03, H - .2, .03, .008), CAB, 0, H / 2 + .02, z0 + D / 2 - .02); for (const sx of [-1, 1]) add(G.box(.012, .1, .016, .004), STEEL5D, sx * .04, .9, z0 + D / 2 - .016);
    const r = rnd(41), ears = ['bear', 'cat', 'bunny'];
    // 아래 두 칸: 인형 다섯씩, 맨 위 칸: 상자 셋·로봇·인형 둘
    for (const [yi, y] of [[0, .12], [1, .645]]) for (let k = 0; k < 5; k++) {
      const x = -.68 + k * .34 + (r() - .5) * .04, s = .09 + r() * .02, c = PLUSH[(k + yi * 2) % 7], zz = z0 + (k % 2 ? .03 : -.04);
      plush(add, x, y, zz, s, c, ears[(k + yi) % 3], (r() - .5) * .5, true);
      add(G.box(.08, .05, .005, .003), '#ffffff', x + .06, y + .03, z0 + D / 2 - .04); add(G.box(.05, .012, .004, .002), MOLD, x + .06, y + .04, z0 + D / 2 - .036);
    }
    const y3 = 1.145;
    for (const [x, w, h, c, c2] of [[-.66, .26, .3, '#8fd3f4', '#ffffff'], [-.36, .22, .24, '#ffd36b', TOMATO5], [.5, .3, .26, '#b9a6ff', '#fff1b8']]) {
      add(G.box(w, h, .2, .015), c, x, y3 + h / 2, z0 - .02); add(G.box(w - .06, h * .45, .004, .003), c2, x, y3 + h * .55, z0 + .082); add(G.box(w * .7, .025, .004, .002), shade(c, -.2), x, y3 + h * .2, z0 + .082);
    }
    add(G.box(.1, .14, .08, .02), '#c9cfd8', -.06, y3 + .07, z0); add(G.box(.09, .09, .08, .02), '#c9cfd8', -.06, y3 + .19, z0); add(G.box(.06, .015, .01, .004), '#7cf0ff', -.06, y3 + .2, z0 + .045); add(G.cyl(.006, .006, .06, 5), STEEL5D, -.03, y3 + .27, z0); add(G.sph(.014, 6, 4), TOMATO5, -.03, y3 + .3, z0);
    plush(add, .16, y3, z0 + .02, .085, PLUSH[1], 'bunny', -.2, true); plush(add, .78, y3, z0 - .03, .075, PLUSH[3], 'bear', .3, true);
    add(G.box(.86, .22, .05, .04), CAB, 0, H + .14, z0 + D / 2 - .05); add(G.box(.9, .03, .06, .01), MOLD, 0, H + .25, z0 + D / 2 - .05);
  }));
  { const s = mesh(new THREE.PlaneGeometry(.76, .17), basic(prizeSign(), '#f4eef4'), { cast: false }); put(s, 0, H + .14, z0 + D / 2 - .02); f.add(s); }
  { const g = mesh(new THREE.PlaneGeometry(W - .12, H - .2), mat(GLASS, { opacity: .25, rough: .2 }), { cast: false }); put(g, 0, H / 2 + .04, z0 + D / 2 - .008); f.add(g); }
  f.spot('inside', null, -.5, .65, z0 + .1, { maxH: .25, label: '경품 진열장 가운데 칸', scale: .6 });
  f.spot('inside', null, .5, .12, z0 + .1, { maxH: .25, label: '경품 진열장 아래 칸', scale: .6 });
  f.spot('behind', null, W / 2 + .12, 0, z0, { maxH: .5, label: '경품 진열장 옆 틈', scale: .7 });
};

// ── 2층 긴 서랍장 (drawerstairs 자리 그대로 — 자물쇠 code 부품 이름 유지, 계단 아님; 1×2를 눕혀 2 m): 크림 몸에 꿀색 윗판·받침, 크림 서랍 넷
// (옛 서랍 계단과 같은 색 동그란 손잡이), 오른쪽 끝 코랄 숨은 칸 문(비밀번호 자물쇠) — 서랍 넷을 다 열면 숨은 칸이 저절로(잠겼으면 안 열림);
// 위엔 어항(자갈·수초·물고기·거품)·버섯 스탠드·액자·작은 다육이
B.ol5_chest = (f, T, o = {}) => {
  const g = grp(); g.rotation.y = -HP; f.add(g);   // (자연 좌표: 앞 +z, 길이 x — 방에선 rot 1로 놓여 앞이 방 쪽)
  const L = 1.9, H = .78, D = .45, z0 = -.27, DW = .64, DH = .3;
  g.add(mc('ol5-chest2', ({ add }) => {
    add(cutFace(G.box(L, H - .06, D, .03), 'z'), '#f5ede1', 0, .06 + (H - .06) / 2, z0);
    add(windowFace(L - .06, H - .12, [.44, .84, -.27, .27]), '#f5ede1', 0, .06 + (H - .06) / 2, z0 + D / 2);
    add(liner(.4, .54, .4, 'z'), shade('#f5ede1', -.18), .64, .42, z0 + D / 2 - .22);
    add(G.box(L + .05, .045, D + .05, .015), WOOD5, 0, H + .045, z0); add(G.box(L + .01, .06, D - .02, .015), WOOD5D, 0, .04, z0);
    for (const sx of [-1, 1]) add(G.box(.07, .05, .07, .02), WOOD5D, sx * (L / 2 - .08), .025, z0 + .1);
    add(G.box(.035, H - .14, D + .01, .01), '#ebe1d3', L / 2 - .6, .06 + (H - .06) / 2, z0);
    // 어항: 유리(옅은 하늘)·물·자갈·수초·물고기·거품
    add(G.box(.38, .26, .22, .02), '#d7eef8', -.6, H + .2, z0); add(G.box(.36, .17, .2, .01), '#8fd0ea', -.6, H + .17, z0);
    add(G.box(.35, .03, .19, .01), '#e8d6b8', -.6, H + .085, z0); for (const [dx, h] of [[-.1, .1], [-.06, .14], [.09, .09]]) add(G.cap(.012, h, 2, 5), LEAF2, -.6 + dx, H + .1 + h / 2, z0 - .04);
    add(G.sph(.03, 8, 6), '#ff8f3a', -.62, H + .2, z0 + .05, 0, 0, 0, [1.4, 1, .6]); add(G.cone(.022, .03, 6), '#ff8f3a', -.57, H + .2, z0 + .05, 0, 0, -HP);
    for (const [dx, dy] of [[-.66, .26], [-.67, .3]]) add(G.sph(.008, 5, 4), '#ffffff', dx, H + dy, z0 + .06);
    add(G.box(.4, .025, .24, .01), '#b9d9e8', -.6, H + .34, z0);
    // 버섯 스탠드, 액자, 다육이 화분
    add(G.cyl(.04, .06, .2, 10), '#f2f2f2', .1, H + .17, z0); add(G.sph(.14, 14, 8), '#ff9fb8', .1, H + .32, z0, 0, 0, 0, [1, .7, 1]); for (const [dx, dz] of [[-.06, .05], [.05, .07], [.0, -.07]]) add(G.sph(.022, 6, 4), '#ffffff', .1 + dx, H + .38, z0 + dz);
    add(G.box(.22, .28, .03, .01), '#ffffff', .45, H + .2, z0 - .08, -.15, 0, 0); add(G.box(.17, .22, .01, .005), '#ffd98a', .45, H + .2, z0 - .065, -.15, 0, 0); add(G.sph(.04, 8, 6), COON, .45, H + .2, z0 - .055, 0, 0, 0, [1, 1, .3]);
    add(G.cyl(.05, .04, .07, 10), '#e8705f', .78, H + .1, z0 + .06); for (let k = 0; k < 5; k++) { const a = k * 1.26; add(G.sph(.026, 6, 5), k % 2 ? LEAF : LEAF2, .78 + Math.cos(a) * .025, H + .155, z0 + .06 + Math.sin(a) * .025, 0, 0, 0, [1, 1.3, 1]); }
  }));
  const drawers = [], cols = ['#ffc23d', '#7fd6c0', '#ff9fb8', '#8fd3f4'];
  for (let i = 0; i < 4; i++) {
    const x = -L / 2 + .06 + DW / 2 + (i % 2) * (DW + .03), y = .1 + DH / 2 + Math.floor(i / 2) * (DH + .04);
    const dv = grp(); put(dv, x, y, z0 + D / 2 + .005); g.add(dv);
    dv.add(mc('ol5-chest-drawer2|' + i, ({ add }) => {
      add(G.box(DW, DH, .03, .015), '#fbf6ee', 0, 0, .015); add(G.box(DW - .08, DH - .08, .006, .004), '#f1e8da', 0, 0, .033);
      add(G.cyl(.034, .034, .035, 14), cols[i], 0, .02, .045, HP, 0, 0); add(G.cyl(.02, .02, .006, 12), shade(cols[i], .15), 0, .02, .064, HP, 0, 0);
      add(G.box(.1, .045, .004, .003), '#ffffff', 0, -.08, .037);
      add(G.box(DW - .06, .02, D - .1, .005), '#e8d8c0', 0, -DH / 2 + .04, -(D - .1) / 2); for (const sx of [-1, 1]) add(G.box(.015, DH - .1, D - .1, .004), '#e8d8c0', sx * (DW / 2 - .04), -.02, -(D - .1) / 2);
    }));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .3 * t; }, { label: `서랍장 ${i + 1}번 서랍`, sfx: 'drawer', dur: .24 });
    f.spot('inside', dv, 0, -DH / 2 + .05, -(D - .1) / 2, { part: p, maxH: .2, label: `서랍장 ${i + 1}번 서랍 속`, scale: .7 });
    drawers.push(p);
  }
  const sv = grp(); put(sv, L / 2 - .06, .1, z0 + D / 2 + .012); g.add(sv);
  sv.add(mc('ol5-chest-door2', ({ add }) => {
    add(G.box(.5, .64, .03, .015), '#e8705f', -.25, .32, 0); add(G.box(.42, .56, .006, .004), '#f08a78', -.25, .32, .017);
    add(G.box(.04, .14, .03, .01), '#ffe14d', -.44, .34, .025); for (const y of [.08, .56]) add(G.box(.02, .06, .02, .005), STEEL5D, -.01, y, .0);
  }));
  const ps = f.part('door', sv, t => { sv.rotation.y = 1.4 * t; }, { label: '서랍장 끝 숨은 칸', sfx: 'creak', dur: .4 });
  ps.lockable = true; ps.lockKind = 'code'; ps.lockAt = { x: -.4, y: .34, z: .04, parent: sv };
  f.spot('inside', g, L / 2 - .3, .15, z0, { part: ps, maxH: .4, label: '서랍장 끝 숨은 칸', scale: .8 });
  const check = S => { if (ps.t > .5 || ps.lock || drawers.some(d => d.t < .5)) return; S.G.audio.sfx('special'); setTimeout(() => !S.dead && S.togglePart(ps, true), 400); };
  drawers.forEach(d => { d.afterOpen = check; });
  f.secretPart = ps;
  f.spot('behind', g, -L / 2 - .12, 0, z0, { maxH: .35, label: '서랍장 옆 틈', scale: .7 });
};

// ── 집게 크레인 바구니 (loftpulley 자리 그대로 — 단서 걸이 부품 이름 유지): 인형 뽑기 집게를 크게 — 코랄 기둥·팔(버터색 띠), 버터색 집게 머리,
// 분홍 바구니가 1층 바닥에서 2층 난간 높이까지 오르내림; 기둥 손잡이를 터치하면 저절로 감김; 집게 밑 고리에 걸린 건 바구니가 올라오면 떨어져 들어감
B.ol5_crane = (f, T, o = {}) => {
  const Y = o.y || Y2, TOPC = Y + 1.0, bx = 0, bz = .1, yB = .02, yT = Y + .06;
  f.add(mc('ol5-crane2|' + Y, ({ add, tube }) => {
    add(G.box(.22, .04, .1, .015), PLUM, .38, .02, -.42);
    add(G.box(.1, TOPC, .1, .02), MOLD, .38, TOPC / 2, -.42);
    for (let k = 0; k < 6; k++) add(G.box(.11, .08, .11, .01), BUTTER, .38, .5 + k * .55, -.42);
    add(G.box(.5, .08, .08, .02), MOLD, .16, TOPC - .05, -.42); add(G.box(.08, .08, .6, .02), MOLD, bx, TOPC - .05, -.15);
    add(G.cyl(.09, .07, .1, 14), BUTTER, bx, TOPC - .14, bz); add(G.sph(.05, 10, 8), MOLD, bx, TOPC - .2, bz);
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2; tube([bx, TOPC - .2, bz], [bx + Math.cos(a) * .1, TOPC - .32, bz + Math.sin(a) * .1], .012, STEEL5D, 4); }
    add(G.cyl(.07, .07, .05, 14), STEEL5, .38, 1.0, -.36, HP, 0, 0);
    // (10/29 사용자 "열쇠 달린 장치도 별로": the hook the key hangs on reads as a crane hook — a little pulley block on its rope, a thick J hook with a latch)
    tube([.17, TOPC - .1, bz], [.17, TOPC - .15, bz], .006, '#e8d6a8', 5);
    add(G.box(.075, .07, .05, .012), BUTTER, .17, TOPC - .18, bz); add(G.cyl(.026, .026, .056, 14), STEEL5, .17, TOPC - .17, bz, HP, 0, 0); add(G.cyl(.008, .008, .062, 8), STEEL5D, .17, TOPC - .17, bz, HP, 0, 0);
    for (const y of [-.205, -.195]) add(G.box(.077, .006, .052, .002), y < -.2 ? INK5 : BUTTER, .17, TOPC + y, bz);
    add(G.cyl(.011, .011, .04, 8), STEEL5D, .17, TOPC - .235, bz);
    add(G.tor(.032, .011, PI * 1.35, 6, 16), '#e0b04a', .17, TOPC - .278, bz, 0, 0, PI * .82); add(G.sph(.014, 8, 6), '#e0b04a', .2, TOPC - .262, bz);
    add(G.box(.006, .04, .01, .002), STEEL5, .19, TOPC - .26, bz, 0, 0, -.5);
  }));
  const crank = grp(); put(crank, .38, 1.0, -.33); f.add(crank);
  crank.add(mc('ol5-crane-crank', ({ add }) => { add(G.box(.15, .03, .03, .008), STEEL5D, .06, 0, .02); add(G.sph(.04, 10, 8), TOMATO5, .14, 0, .05); }));
  const bk = grp(); put(bk, bx, yB, bz); f.add(bk);
  bk.add(mc('ol5-crane-basket', ({ add }) => {
    // (10/29 사용자 "바구니도 별로": a plastic prize basket — ribbed walls, two bands, a rolled rim, moulded grips, a round sticker)
    add(G.cyl(.205, .165, .26, 24), '#ff9fc8', 0, .13, 0); add(G.cyl(.17, .17, .02, 20), '#e8709f', 0, .01, 0);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2, r = .19; add(G.box(.022, .25, .02, .006), '#ffb8d6', Math.cos(a) * r, .135, Math.sin(a) * r, 0, -a, 0); }
    for (const [y, r] of [[.07, .178], [.17, .195]]) add(G.tor(r, .012, PI * 2, 5, 28), '#e8709f', 0, y, 0, HP, 0, 0);
    add(G.tor(.208, .026, PI * 2, 6, 28), '#e05f92', 0, .262, 0, HP, 0, 0); add(G.tor(.208, .008, PI * 2, 4, 28), '#ffd6e8', 0, .284, 0, HP, 0, 0);
    for (const sx of [-1, 1]) { add(G.tor(.075, .016, PI, 5, 12), '#e05f92', sx * .16, .3, 0); add(G.cap(.014, .1, 3, 8), '#fff0f6', sx * .16, .375, 0, 0, 0, HP); }
    add(G.cyl(.032, .032, .006, 16), BUTTER, 0, .16, .2, HP, 0, 0); add(G.cyl(.018, .018, .008, 12), '#ff7aa8', 0, .16, .202, HP, 0, 0);
    add(G.cyl(.185, .185, .06, 16), '#f2dc9a', 0, .215, 0);
  }));
  const rope = mesh(new THREE.CylinderGeometry(.006, .006, 1, 5), mat('#e8d6a8')); f.add(rope);
  const setRope = () => { const y0 = TOPC - .22, y1 = bk.position.y + .3, L = Math.max(.02, y0 - y1); rope.scale.y = L; rope.position.set(bx, y1 + L / 2, bz); };
  setRope();
  const p = f.part('slide', [bk, crank], (t, b) => { bk.position.y = b.p.y + (yT - yB) * t; bk.rotation.z = Math.sin(t * PI * 3) * .04 * (1 - t); crank.rotation.z = -t * PI * 6; setRope(); }, { label: '크레인 바구니', sfx: 'swish', dur: 1.2 });
  p.handle = crank;
  // (10/29: a flat key in the basket lay below the rim and the bot — and a player — could not see it: the straw bed sits up near the rim)
  f.spot('inside', bk, 0, .25, 0, { part: p, maxH: .26, label: '크레인 바구니 안', scale: .85 });
  f.spot('on', null, .17, TOPC - .56, bz, { maxH: .24, label: '크레인 집게 밑 고리', scale: .8, wallFace: true }).hang = p;
  f.spot('behind', null, .3, 0, -.25, { maxH: .3, label: '크레인 기둥 옆', scale: .7 });
};

// ── 너굴 오락실 오락기 (arcade3 자리의 그림 — opts.gptHero 'ol5_cab'; 부품·자리 약속은 arcade3 그대로) ────────────────────────────
// 크림 몸의 캔디 캐비닛: 둥근 옆판(종류 색 — 0 빨강 경품 오락기, 1 하늘, 2 라일락)에 T몰딩과 스티커, 뒤로 누운 화면(게임 그림), 불 켜진 마키(게임 이름),
// 2인용 조작판(스틱 둘·단추 여섯·시작 단추), 볼처럼 둥근 스피커 둘, 동전 넣는 판(빨간 불), 아래 동전 문(pad 자물쇠 — 안에 칸이 밀려 나옴),
// 경품 오락기는 왼쪽 아래 경품 나오는 곳(노란 덮개 — 장치 arcadeprize), 앞에 둥근 의자; 생활감: 위에 견본 인형·캔 음료·동전 탑
const CABS = [
  { side: '#ec7064', acc: '#ffd36b', mold: '#ffe6a6', title: '몽글 점프' },
  { side: '#7ec2d8', acc: '#ffb3c7', mold: '#fff0f4', title: '별똥 슈팅' },
  { side: '#b4a4e6', acc: '#ffe08a', mold: '#fff6d6', title: '너굴 레이서' },
];
const CABF = '#f8f1e7';
const SCR = {};
const screenTex = k => SCR[k] || (SCR[k] = canvasTex(192, 144, (c, W, H) => {
  if (k === 0) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5ec2f2'); g.addColorStop(1, '#bfe9ff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#ffffff'; for (const [x, y, w] of [[12, 112, 52], [84, 86, 46], [140, 58, 42]]) { roundRect(c, x, y, w, 12, 6); c.fill(); }
    c.fillStyle = '#ffe14d'; for (const [x, y] of [[38, 96], [106, 70], [160, 42], [62, 34]]) star5(c, x, y, 6, 2.6);
    c.fillStyle = '#fff6ee'; c.beginPath(); c.ellipse(104, 72, 12, 10, 0, 0, PI * 2); c.fill(); c.fillStyle = '#2a1d33'; c.fillRect(99, 69, 3, 4); c.fillRect(107, 69, 3, 4);
    c.fillStyle = CHEEK; c.fillRect(96, 74, 3, 2); c.fillRect(110, 74, 3, 2);
  } else if (k === 1) {
    c.fillStyle = '#211d52'; c.fillRect(0, 0, W, H); const r = rnd(4); c.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) c.fillRect(r() * W, r() * H, 2, 2);
    c.fillStyle = '#ffe14d'; for (const [x, y] of [[50, 34], [100, 26], [150, 38], [76, 56], [126, 54]]) star5(c, x, y, 8, 3.5);
    c.fillStyle = '#ff9fd0'; for (const [x, y] of [[96, 92], [96, 76]]) c.fillRect(x - 2, y, 4, 9);
    c.fillStyle = '#7cf0ff'; c.beginPath(); c.moveTo(96, 106); c.lineTo(112, 132); c.lineTo(80, 132); c.closePath(); c.fill(); c.fillStyle = '#ffffff'; dot(c, 96, 122, 4);
  } else {
    c.fillStyle = '#86d36f'; c.fillRect(0, 0, W, H); c.fillStyle = '#6a6f86'; c.beginPath(); c.moveTo(72, 0); c.lineTo(120, 0); c.lineTo(172, H); c.lineTo(20, H); c.closePath(); c.fill();
    c.fillStyle = '#ffffff'; for (let y = 4; y < H; y += 26) c.fillRect(94, y, 4, 12);
    c.fillStyle = '#5fa84e'; for (const [x, y] of [[20, 30], [170, 60], [30, 100]]) dot(c, x, y, 9);
    c.fillStyle = TOMATO5; roundRect(c, 84, 98, 24, 30, 6); c.fill(); c.fillStyle = '#2a1d33'; for (const [x, y] of [[81, 102], [107, 102], [81, 116], [107, 116]]) c.fillRect(x, y, 4, 8);
    c.fillStyle = COON; dot(c, 96, 108, 6); c.fillStyle = COOND; c.fillRect(92, 106, 8, 3);
  }
  c.fillStyle = 'rgba(255,255,255,.95)'; c.font = 'bold 12px monospace'; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillText('1P 004200', 6, 14); c.textAlign = 'right'; c.fillText('HI 999900', W - 6, 14);
  c.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H; y += 3) c.fillRect(0, y, W, 1);
}));
const MARQ = {};
const marqTex = k => MARQ[k] || (MARQ[k] = textTex(384, 112, (c, W, H) => {
  const C = CABS[k];
  c.fillStyle = shade(C.side, .14); c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,255,255,.2)'; for (let i = -3; i < 8; i++) { c.beginPath(); c.moveTo(i * 34, H); c.lineTo(i * 34 + 14, H); c.lineTo(i * 34 + 44, 0); c.lineTo(i * 34 + 30, 0); c.closePath(); c.fill(); }
  c.fillStyle = '#fff4c8'; star5(c, 15, H / 2, 9, 4); star5(c, W - 15, H / 2, 9, 4);
  fitText(c, C.title, W / 2, H / 2 + 1, W * .74, 24, '#fffaf0', { stroke: '#4a3a52', sw: 5 });
}));
const SIDEART = {};
const sideArtTex = k => SIDEART[k] || (SIDEART[k] = canvasTex(176, 224, (c, W, H) => {
  const C = CABS[k];
  c.fillStyle = '#fffaf2'; c.fillRect(0, 0, W, H);
  c.fillStyle = shade(C.side, .2); roundRect(c, 10, 10, W - 20, H - 20, 18); c.fill();
  c.save(); roundRect(c, 10, 10, W - 20, H - 20, 18); c.clip();
  [['#fffaf2', 0], [C.acc, 1], [shade(C.side, -.04), 2]].forEach(([col, i]) => { c.save(); c.translate(W / 2, H * .72); c.rotate(-.5); c.fillStyle = col; c.fillRect(-W, -30 + i * 26, W * 2, 14); c.restore(); });
  c.restore();
  c.fillStyle = C.acc; star5(c, W * .38, H * .3, 34, 15); c.fillStyle = '#fffaf2'; dot(c, W * .38, H * .3, 8);
  c.fillStyle = '#ffffff'; star4(c, W * .72, H * .18, 9); star4(c, W * .78, H * .42, 6);
}));
const priceTag = once(() => textTex(160, 64, (c, W, H) => { c.fillStyle = '#fffaf0'; c.fillRect(0, 0, W, H); c.fillStyle = TOMATO5; c.fillRect(0, 0, 10, H); fitText(c, '1판 500원', W / 2 + 5, H / 2 + 1, W - 22, 15, '#4a3a52'); }));
const stickerShape = (w, h, r) => { const g = new THREE.ShapeGeometry(rrect(new THREE.Shape(), -w / 2, -h / 2, w / 2, h / 2, r), 6), uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h); return g; };
B.ol5_cab = (f, T, o = {}) => {
  const k = (o.kind || 0) % 3, C = CABS[k], W = .72, D = .68, z0 = -.12, ST = .045, PA = .4636, MA = -.1974, FZ = z0 + .3;
  const side = new THREE.Shape();
  side.moveTo(-.34, 0); side.lineTo(.3, 0); side.lineTo(.3, .78); side.quadraticCurveTo(.3, .84, .37, .84); side.lineTo(.42, .85); side.lineTo(.42, .95);
  side.lineTo(.2, 1.06); side.lineTo(.12, 1.1); side.lineTo(.04, 1.5); side.lineTo(.22, 1.55); side.lineTo(.25, 1.6); side.lineTo(.25, 1.8);
  side.quadraticCurveTo(.25, 1.9, .15, 1.9); side.lineTo(-.28, 1.9); side.quadraticCurveTo(-.34, 1.9, -.34, 1.84); side.closePath();
  const edge = [[.3, 0], [.3, .8], [.42, .85], [.42, .95], [.2, 1.06], [.12, 1.1], [.04, 1.5], [.22, 1.55], [.25, 1.6], [.25, 1.86], [.18, 1.92]];
  const pM = xf(0, 1.005, z0 + .31, PA, 0, 0), sx0 = o.prize ? .16 : 0, sz = z0 + D / 2 + .44;
  f.add(mc('ol5-cab|' + k + (o.prize ? 'p' : ''), ({ add, addM, tube }) => {
    const P = (g, c, x, y, z, rx = 0, ry = 0, rz = 0, s) => addM(g, pM.clone().multiply(xf(x, y, z, rx, ry, rz, s)), c);
    // 옆판 둘 (둥근 모서리) + 옆판 앞 가장자리 T몰딩
    for (const sx of [-1, 1]) add(G.ext(side, ST, .012, 4), C.side, sx < 0 ? -W / 2 : W / 2 + ST, 0, z0, 0, -HP, 0);
    for (const sx of [-1, 1]) for (let i = 1; i < edge.length; i++) seg(add, sx * (W / 2 + ST / 2), ST + .034, [z0 + edge[i - 1][0] + .006, edge[i - 1][1]], [z0 + edge[i][0] + .006, edge[i][1]], .03, C.mold);
    // 앞몸·걸레받이·위판·뒤판(환기 구멍)·마키 갓
    const hx = o.prize ? -.02 : -.15;
    add(cutFace(G.box(W, .8, .62, .02), 'z'), CABF, 0, .4, z0 - .02);
    add(windowFace(W - .04, .76, [hx + .02, hx + .28, -.24, .06]), CABF, 0, .4, z0 + .29);
    add(liner(.26, .3, .4, 'z'), shade(CABF, -.25), hx + .15, .31, z0 + .07);
    add(G.box(W + .1, .08, .05, .02), INK5, 0, .04, FZ);
    add(G.box(W, .26, .24, .03), CABF, 0, 1.68, z0 + .12); add(G.box(W, .05, .58, .015), CABF, 0, 1.885, z0 - .05);
    add(G.box(W, 1.84, .03, .01), shade(CABF, -.08), 0, .93, z0 - .325);
    for (let i = 0; i < 3; i++) add(G.pbox(.3, .02, .01), '#bdb5a5', 0, 1.2 + i * .06, z0 - .343);
    add(G.pbox(W - .04, .02, .1), INK5, 0, 1.545, z0 + .16);
    tube([.2, .14, z0 - .335], [.23, .015, z0 - .335], .012, INK5, 5);
    // 볼처럼 둥근 스피커 둘, 동전 넣는 판(구멍 둘)
    for (const sx of [-1, 1]) { add(G.cyl(.068, .068, .016, 18), PLUM, sx * .22, .66, FZ - .005, HP, 0, 0); for (const r of [.045, .025]) add(G.tor(r, .006, PI * 2, 4, 18), '#8f8ab0', sx * .22, .66, FZ + .004); }
    add(G.box(.22, .14, .02, .015), STEEL5, 0, .645, FZ); for (const sx of [-1, 1]) add(G.pbox(.014, .05, .01), INK5, sx * .055 - .02, .655, FZ + .012);
    // 조작판: 짙은 판·옅은 판면, 1P(빨강 공)·2P(하늘 공) 스틱, 단추 셋씩, 시작 단추 둘
    P(G.box(W + .02, .1, .26, .02), INK5, 0, -.05, 0); P(G.box(W - .06, .008, .2, .003), '#6b6588', 0, .002, 0);
    for (const [px, ball] of [[-.18, TOMATO5], [.18, SKY5]]) {
      P(G.cyl(.032, .032, .01, 14), '#2f2b3d', px - .07, .008, .02); P(G.cyl(.009, .009, .07, 8), '#2f2b3d', px - .07, .04, .02);
      P(G.sph(.034, 12, 10), ball, px - .07, .085, .02); P(G.sph(.011, 6, 5), '#ffffff', px - .08, .1, .032);
      for (let i = 0; i < 3; i++) P(G.cyl(.019, .019, .022, 12), [BUTTER, MINT5, PINK5][i], px + i * .05, .012, i === 1 ? -.012 : .01);
    }
    for (const sx of [-1, 1]) P(G.box(.04, .014, .025, .006), '#ffffff', sx * .05, .008, -.085);
    // 화면 테 (뒤로 누움)
    add(G.box(W, .43, .06, .02), INK5, 0, 1.294, z0 + .051, MA, 0, 0);
    // 의자: 종류 색 방석, 테, 크롬 기둥·발 고리·받침
    add(G.cyl(.18, .17, .08, 20), C.side, sx0, .56, sz); add(G.tor(.175, .022, PI * 2, 6, 22), shade(C.side, -.12), sx0, .535, sz, HP, 0, 0);
    add(G.cyl(.15, .15, .01, 20), shade(C.side, .1), sx0, .601, sz);
    add(G.cyl(.024, .03, .5, 10), STEEL5, sx0, .27, sz); add(G.tor(.12, .012, PI * 2, 5, 18), STEEL5, sx0, .22, sz, HP, 0, 0); add(G.cyl(.15, .19, .035, 18), STEEL5D, sx0, .018, sz);
    // 생활감: 위에 견본 인형(경품) · 캔 음료 · 동전 탑
    if (k === 0) plush(add, .16, 1.91, z0 - .06, .07, PLUSH[0], 'bear', -.25, true);
    else if (k === 1) { add(G.cyl(.033, .033, .12, 12), MINT5, -.2, 1.97, z0 - .06); add(G.cyl(.028, .028, .008, 12), STEEL5, -.2, 2.034, z0 - .06); add(G.box(.03, .05, .004, .002), '#ffffff', -.2, 1.97, z0 - .026); }
    else for (let i = 0; i < 2; i++) for (let j = 0; j < 5 - i * 2; j++) add(G.cyl(.022, .022, .008, 12), '#e2b54e', .18 + i * .06, 1.914 + j * .009, z0 - .05 + i * .02);
    // 경품 나오는 곳 (왼쪽 아래): 짙은 틀·버터색 받침·안쪽 어둠
    if (o.prize) { const pz = z0 + .36; add(G.box(.22, .03, .14, .01), INK5, -.2, .44, pz); for (const sx of [-1, 1]) add(G.box(.02, .2, .14, .006), INK5, -.2 + sx * .1, .34, pz); add(G.box(.2, .025, .14, .01), BUTTER, -.2, .25, pz); add(G.pbox(.18, .18, .01), '#1c1828', -.2, .34, pz - .065); }
  }));
  // 빛: 동전 구멍 옆 빨간 불, 마키 밑 띠등
  f.add(lamp('cab-coin', '#ff8a5c', ({ add }) => { for (const sx of [-1, 1]) add(G.pbox(.022, .03, .008), '#ff8a5c', sx * .055 + .012, .655, FZ + .012); }, 1.2));
  f.add(lamp('cab-strip', '#fff1d0', ({ add }) => add(G.pbox(W - .08, .012, .05), '#fff1d0', 0, 1.535, z0 + .19)));
  // 화면·마키·옆 스티커·가격표
  const scr = mesh(new THREE.PlaneGeometry(W - .17, .3), basic(screenTex(k)), { cast: false }); put(scr, 0, 1.301, z0 + .085, MA, 0, 0); f.add(scr);
  f.screen = scr;
  { const gl = mesh(new THREE.PlaneGeometry(.12, .035), mat('#ffffff', { opacity: .35, rim: 0 }), { cast: false }); put(gl, -.17, 1.42, z0 + .07, MA, 0, -.15); f.add(gl); }
  { const m = mesh(new THREE.PlaneGeometry(W - .06, .2), basic(marqTex(k), '#f6f0f4'), { cast: false }); put(m, 0, 1.68, z0 + .243); f.add(m); }
  for (const sx of [-1, 1]) { const m = mesh(stickerShape(.44, .56, .06), mat('#ffffff', { map: sideArtTex(k), rim: .05 }), { cast: false }); put(m, sx * (W / 2 + ST + .017), .46, z0 - .02, 0, sx * HP, 0); f.add(m); }
  { const m = mesh(new THREE.PlaneGeometry(.1, .04), mat('#ffffff', { map: priceTag(), rim: 0 }), { cast: false }); put(m, 0, .59, FZ + .012); f.add(m); }
  // 동전 문 (pad 자물쇠): 경첩 왼쪽, 안에서 칸이 밀려 나옴
  const hx = o.prize ? -.02 : -.15, hv = grp(); put(hv, hx, .14, FZ + .004); f.add(hv);
  hv.add(mc('ol5-cab-door|' + k, ({ add }) => {
    add(G.box(.3, .34, .022, .012), '#e6e1ec', .15, .17, .011); add(G.box(.25, .29, .006, .004), '#f4f0f7', .15, .17, .024);
    add(G.box(.12, .035, .006, .003), C.side, .15, .28, .028);
    add(G.cyl(.018, .018, .012, 12), STEEL5D, .26, .17, .03, HP, 0, 0); add(G.pbox(.006, .018, .004), INK5, .26, .17, .037);
    for (const [x, y] of [[.03, .31], [.27, .31], [.03, .03], [.27, .03]]) add(G.sph(.008, 6, 4), STEEL5D, x, y, .026);
  }));
  const ph = f.part('door', hv, t => { hv.rotation.y = -1.5 * t; }, { label: '오락기 아래 문', sfx: 'open', dur: .28 });
  ph.lockable = true; ph.lockKind = 'pad'; ph.lockAt = { x: .27, y: .12, z: .04, parent: hv };
  f.pullOut(ph, f.spot('inside', null, hx + .15, .17, z0 + .06, { part: ph, maxH: .24, label: '오락기 아래 칸', scale: .7 }), FZ, { w: .24, d: .2, color: '#efe3c8' });
  if (o.prize) {
    const pz = z0 + .36, fl = grp(); put(fl, -.2, .44, pz + .075); f.add(fl);
    fl.add(mc('ol5-cab-flap', ({ add }) => { add(G.box(.17, .14, .02, .01), BUTTER, 0, -.07, 0); add(G.box(.08, .02, .02, .006), INK5, 0, -.12, .012); add(G.box(.11, .028, .004, .003), '#ffffff', 0, -.04, .012); }));
    // (안으로 들어가는 덮개: 위로 들리면 위에서 받침이 가려짐)
    const pf = f.part('lift', fl, t => { fl.rotation.x = 1.35 * t; }, { label: '경품 나오는 곳', sfx: 'lift', dur: .26 });
    pf.device = 'arcadeprize';
    pf.lockable = true; pf.lockKind = 'pad'; pf.lockAt = { x: 0, y: -.13, z: .04, parent: fl };
    f.spot('inside', null, -.2, .265, pz + .01, { part: pf, maxH: .15, label: '경품 나오는 곳', scale: .55 });
    f.prizeAt = new THREE.Vector3(-.2, .32, FZ);
  }
  // 옆 틈 (o.gap: 1 오른쪽, -1 왼쪽, 0 없음 — 줄 끝·벽 쪽은 틈이 없음), 의자 밑, 위
  if (o.gap) f.spot('behind', null, o.gap * (W / 2 + .14), 0, z0 - .06, { maxH: .5, label: '오락기 옆 틈', scale: .75 });
  f.spot('under', null, sx0, 0, sz, { maxH: .4, label: '오락기 의자 밑', scale: .7 });
  f.spot('on', null, k === 1 ? .12 : -.13, 1.91, z0 - .08, { maxH: .26, label: '오락기 위', scale: .7 });
};

// ── 인형 뽑기 기계 (1×1, 새로 — 옛 스페셜 sp2_claw 대신): 동물 모양 기계 — 0 분홍 곰(둥근 귀), 1 민트 토끼(긴 귀); 받침 앞에 얼굴(눈·볼·ω 입),
// 앞으로 나온 조작 턱(빨강 공 스틱·버터색 돔 단추), 동전 판(빨간 불·거스름 컵), 유리 상자 안엔 모찌 인형 더미와 꺼내는 칸(투명 테),
// 레일·이동대·줄·발톱 셋 집게, 뒤판 그림(구름·별), 머리엔 불 켜진 간판과 전구; 생활감: 꺼내는 칸 끝에 걸린 인형 하나, 유리에 붙은 '오늘의 경품' 쪽지
const CLAWS = [{ body: '#f7b3c6', deep: '#ec93ad', sign: '#ef7f9f', ear: 'bear', back: '#ffe3ec' }, { body: '#9fdacb', deep: '#78c4b3', sign: '#5fb3a3', ear: 'bunny', back: '#e3f6ef' }];
const CLAWSIGN = {}, CLAWBACK = {};
const clawSignTex = k => CLAWSIGN[k] || (CLAWSIGN[k] = textTex(320, 96, (c, W, H) => {
  const C = CLAWS[k];
  c.fillStyle = '#fff7f2'; c.fillRect(0, 0, W, H); c.fillStyle = C.sign; roundRect(c, 3, 3, W - 6, H - 6, 9); c.fill();
  c.fillStyle = 'rgba(255,255,255,.22)'; for (let x = 10; x < W; x += 16) dot(c, x, 8, 2);
  c.fillStyle = '#fff1f5'; heart(c, 15, H / 2 + 1, 6); heart(c, W - 15, H / 2 + 1, 6);
  fitText(c, '인형 뽑기', W / 2, H / 2 + 1, W - 52, 22, '#ffffff', { stroke: '#4a3a52', sw: 4 });
}));
const clawBackTex = k => CLAWBACK[k] || (CLAWBACK[k] = canvasTex(128, 128, (c, W, H) => {
  const C = CLAWS[k]; c.fillStyle = C.back; c.fillRect(0, 0, W, H);
  c.fillStyle = '#ffffff'; cloud(c, 10, 30, .9); cloud(c, 70, 60, .8); cloud(c, 20, 96, .7);
  c.fillStyle = BUTTER; star5(c, 100, 22, 7, 3); star5(c, 56, 100, 5, 2.2); c.fillStyle = shade(C.sign, .2); heart(c, 104, 100, 6); heart(c, 40, 16, 4);
}));
const prizeNote = once(() => textTex(160, 112, (c, W, H) => { paperFill(c, W, H, '#fffaf0', 7); fitText(c, '★ 경품 ★', W / 2, 16, W - 14, 13, '#e2675a'); c.fillStyle = '#ffb3cd'; dot(c, W / 2 - 16, 38, 9); c.fillStyle = '#9fd8ff'; dot(c, W / 2 + 14, 40, 9); c.fillStyle = '#4a3a52'; for (const x of [W / 2 - 19, W / 2 - 13, W / 2 + 11, W / 2 + 17]) dot(c, x, 39, 1.3); }));
B.ol5_claw = (f, T, o = {}) => {
  const k = (o.kind || 0) % 2, C = CLAWS[k], W = .76, D = .7, z0 = -.04, BY = .72, GY = 1.56, HY = 1.82, FZ = z0 + D / 2;
  const cx = -.2, cz = FZ - .15;
  f.add(mc('ol5-claw|' + k, ({ add, tube }) => {
    // 받침: 둥근 몸·걸레받이·크림 턱
    // (10/29 사용자 "크레인 기계 아래 서랍 구멍 안 뚫었고": the body was one solid block behind the prize flap — now the flap opens on a hollow bin)
    { const x0 = cx - .13, x1 = cx + .09, y0 = .15, y1 = .41, zb = FZ - .27, H0 = .07, H1 = BY;
      add(G.box(x0 + W / 2, H1 - H0, D, .05), C.body, (-W / 2 + x0) / 2, (H0 + H1) / 2, z0);
      add(G.box(W / 2 - x1, H1 - H0, D, .05), C.body, (x1 + W / 2) / 2, (H0 + H1) / 2, z0);
      add(G.box(x1 - x0 + .02, y0 - H0, D, .02), C.body, (x0 + x1) / 2, (H0 + y0) / 2, z0);
      add(G.box(x1 - x0 + .02, H1 - y1, D, .02), C.body, (x0 + x1) / 2, (y1 + H1) / 2, z0);
      add(G.box(x1 - x0 + .02, y1 - y0, zb - (z0 - D / 2), .02), C.body, (x0 + x1) / 2, (y0 + y1) / 2, (zb + z0 - D / 2) / 2);
      add(G.box(x1 - x0, .012, FZ - zb, .004), '#4a4466', (x0 + x1) / 2, y0 + .006, (zb + FZ) / 2);
      add(G.box(x1 - x0, y1 - y0, .012, .004), '#3a3550', (x0 + x1) / 2, (y0 + y1) / 2, zb + .006);
      for (const x of [x0 + .006, x1 - .006]) add(G.box(.012, y1 - y0, FZ - zb, .004), '#433d5c', x, (y0 + y1) / 2, (zb + FZ) / 2);
      add(G.box(x1 - x0 + .03, .02, .02, .006), RAIL, (x0 + x1) / 2, y0, FZ - .005); add(G.box(x1 - x0 + .03, .02, .02, .006), RAIL, (x0 + x1) / 2, y1, FZ - .005); }
    add(G.box(W + .03, .07, D + .03, .025), PLUM, 0, .035, z0);
    add(G.box(W + .05, .05, D + .05, .02), RAIL, 0, BY + .005, z0);
    // 얼굴 (받침 앞 가운데 위): 눈·볼·ω 입
    for (const sx of [-1, 1]) { add(G.sph(.024, 10, 8), INK5, .03 + sx * .07, .57, FZ + .004, 0, 0, 0, [1, 1.25, .4]); add(G.sph(.034, 10, 8), CHEEK, .03 + sx * .125, .52, FZ + .002, 0, 0, 0, [1.3, .8, .3]); }
    for (const sx of [-1, 1]) add(G.tor(.02, .006, PI, 4, 10), INK5, .03 + sx * .02, .515, FZ + .007, 0, 0, PI);
    // 동전 판 (오른쪽 아래): 은색 판·동전 구멍·거스름 컵·가격 스티커 자리
    add(G.box(.15, .2, .02, .01), STEEL5, .23, .3, FZ + .006); add(G.pbox(.012, .06, .008), INK5, .23, .34, FZ + .018); add(G.box(.08, .04, .04, .01), INK5, .23, .23, FZ + .02);
    // 조작 턱: 앞으로 나온 크림 판, 판면 띠, 스틱(빨강 공), 돔 단추(버터색)
    add(G.box(W - .04, .06, .16, .02), RAIL, 0, BY - .045, FZ + .06); add(G.box(W - .1, .012, .12, .004), C.deep, 0, BY - .012, FZ + .06);
    add(G.cyl(.032, .036, .015, 14), INK5, -.15, BY - .003, FZ + .07); tube([-.15, BY, FZ + .07], [-.15, BY + .07, FZ + .07], .009, INK5, 6); add(G.sph(.036, 12, 10), TOMATO5, -.15, BY + .09, FZ + .07);
    add(G.cyl(.05, .05, .02, 16), PLUM, .14, BY - .002, FZ + .07); add(G.sph(.042, 14, 10), BUTTER, .14, BY + .008, FZ + .07, 0, 0, 0, [1, .55, 1]);
    // 유리 상자: 네 기둥, 바닥, 꺼내는 칸(투명 테·구멍)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.04, GY - BY, .04, .012), RAIL, sx * (W / 2 - .02), (BY + GY) / 2, z0 + sz * (D / 2 - .02));
    add(G.pbox(W - .06, .02, D - .06), '#fff3ea', 0, BY + .03, z0);
    for (const [w, d, x, z] of [[.22, .016, cx, cz - .1], [.22, .016, cx, cz + .1], [.016, .2, cx - .11, cz], [.016, .2, cx + .11, cz]]) add(G.box(w, .022, d, .006), RAIL, x, BY + .25, z);
    for (const [x, z] of [[cx - .11, cz - .1], [cx + .11, cz - .1]]) add(G.box(.016, .22, .016, .004), RAIL, x, BY + .14, z);
    add(G.pbox(.2, .006, .2), '#3a3550', cx, BY + .042, cz);
    // 모찌 인형 더미 (앞쪽 것만 얼굴) + 꺼내는 칸 끝에 걸린 하나
    const ears = ['bear', 'cat', 'bunny'];
    [[.2, 0, .14, .085, 1], [.04, 0, .13, .08, 1], [.24, 0, -.08, .08, 0], [.05, 0, -.06, .085, 0], [-.14, 0, -.08, .08, 0], [-.24, 0, -.24, .08, 0], [.0, 0, -.25, .08, 0], [.22, 0, -.26, .075, 0],
      [.12, .12, .04, .075, 1], [-.06, .12, -.16, .075, 0], [.16, .12, -.18, .07, 0], [.06, .21, -.08, .07, 1]].forEach(([x, y, z, s, fc], i) => plush(add, x, BY + .04 + y, z0 + z, s, PLUSH[(i + k * 3) % 7], ears[(i + k) % 3], (i % 3 - 1) * .3, !!fc));
    plush(add, cx + .08, BY + .2, cz + .02, .06, PLUSH[(4 + k) % 7], ears[k], -.6, true);
    // 집게: 레일 둘·가로대·이동대·줄·머리·발톱 셋
    for (const sx of [-1, 1]) add(G.pbox(.022, .022, D - .08), STEEL5, sx * (W / 2 - .06), GY - .035, z0);
    add(G.pbox(W - .12, .026, .026), STEEL5, 0, GY - .035, z0 + .04); add(G.box(.08, .05, .08, .015), PLUM, .06, GY - .065, z0 + .04);
    tube([.06, GY - .09, z0 + .04], [.06, GY - .3, z0 + .04], .004, '#e9e4ef', 4);
    add(G.cyl(.032, .042, .05, 12), BUTTER, .06, GY - .32, z0 + .04);
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + .5, ca = Math.cos(a), sa = Math.sin(a), h = [.06, GY - .345, z0 + .04], m = [.06 + ca * .07, GY - .4, z0 + .04 + sa * .07], t = [.06 + ca * .04, GY - .46, z0 + .04 + sa * .04]; tube(h, m, .008, STEEL5D, 5); tube(m, t, .008, STEEL5D, 5); add(G.sph(.012, 6, 4), STEEL5D, ...t); }
    // 머리: 둥근 상자·아래 크림 띠·귀 둘
    add(G.box(W + .04, HY - GY, D + .04, .06), C.body, 0, (GY + HY) / 2, z0); add(G.box(W + .06, .04, D + .06, .015), RAIL, 0, GY + .01, z0);
    if (C.ear === 'bear') for (const sx of [-1, 1]) { add(G.sph(.11, 14, 10), C.body, sx * .25, HY + .02, z0 + .04, 0, 0, 0, [1, 1, .6]); add(G.sph(.065, 12, 8), '#fff0f4', sx * .25, HY + .02, z0 + .09, 0, 0, 0, [1, 1, .3]); }
    else for (const sx of [-1, 1]) { add(G.cap(.055, .2, 4, 10), C.body, sx * .13, HY + .16, z0 + .04, 0, 0, -sx * .18); add(G.cap(.028, .15, 4, 8), '#fff0f4', sx * .13 - sx * .005, HY + .16, z0 + .085, 0, 0, -sx * .18, [1, 1, .5]); }
  }));
  // 빛: 머리 아래 전구 줄, 동전 판 빨간 불
  f.add(lamp('claw-bulbs', '#fff1c2', ({ add }) => { for (let i = 0; i < 9; i++) add(G.sph(.016, 6, 4), '#fff1c2', -W / 2 + .06 + i * (W - .12) / 8, GY + .045, z0 + D / 2 + .035); }, 1.3));
  f.add(lamp('claw-coin', '#ff8a5c', ({ add }) => add(G.pbox(.03, .02, .008), '#ff8a5c', .23, .4, FZ + .02), 1.2));
  // 간판, 유리 셋, 뒤판 그림, 유리에 붙은 쪽지
  { const m = mesh(new THREE.PlaneGeometry(W - .06, .19), basic(clawSignTex(k), '#f6eef4'), { cast: false }); put(m, 0, (GY + HY) / 2 + .015, z0 + D / 2 + .024); f.add(m); }
  const glassM = mat(GLASS, { opacity: .22, rough: .1, rim: 0 });
  { const g = mesh(new THREE.PlaneGeometry(W - .06, GY - BY - .03), glassM, { cast: false }); put(g, 0, (BY + GY) / 2, FZ - .02); f.add(g); }
  for (const sx of [-1, 1]) { const g = mesh(new THREE.PlaneGeometry(D - .06, GY - BY - .03), glassM, { cast: false }); put(g, sx * (W / 2 - .02), (BY + GY) / 2, z0, 0, sx * HP, 0); f.add(g); }
  { const m = mesh(new THREE.PlaneGeometry(W - .06, GY - BY - .03), mat('#ffffff', { map: clawBackTex(k), rim: 0 }), { cast: false }); put(m, 0, (BY + GY) / 2, z0 - D / 2 + .03); f.add(m); }
  { const n = paperSheet(.12, .085, prizeNote(), { hold: 'tape', curl: false }); put(n, .2, GY - .14, FZ - .016); f.add(n); }
  // 인형 나오는 곳 (문: 위 경첩, 안으로 들어감)
  const fl = grp(); put(fl, cx - .02, .4, FZ + .006); f.add(fl);
  fl.add(mc('ol5-claw-flap|' + k, ({ add }) => { add(G.box(.2, .24, .018, .01), '#e9e4ef', 0, -.12, 0); add(G.box(.15, .15, .004, .004), PLUM, 0, -.1, .011); add(G.box(.1, .022, .02, .006), TOMATO5, 0, -.2, .014); }));
  const p = f.part('door', fl, t => { fl.rotation.x = 1.3 * t; }, { label: '인형 나오는 곳', sfx: 'open', dur: .24 });
  f.spot('inside', null, cx - .02, .162, FZ - .12, { part: p, maxH: .2, label: '인형 나오는 곳', scale: .55 });
  f.spot('on', null, 0, HY + .005, z0 - .05, { maxH: .26, label: '인형 뽑기 기계 위', scale: .7 });
  f.spot('behind', null, .12, 0, z0 - D / 2 - .14, { maxH: .45, label: '인형 뽑기 기계 뒤', scale: .7 });
};

// ── 캡슐 뽑기 (1×1, 새로 — GPT 캡슐 뽑기 gpt_gacha 대신): 크림 받침장(나무 윗판·'캡슐 토이' 띠·캡슐 통 서랍) 위에 작은 기계 넷(2단 2열, 분홍·하늘·
// 버터·민트 틀) — 투명 창 안 반반 캡슐, 창 아래 장난감 그림 카드, 은색 동전판과 돌리는 손잡이, 나오는 구멍; 오른쪽 아래 기계 손잡이를 터치하면
// 손잡이가 한 바퀴 돌고 큰 캡슐이 굴러 나와 앞 받침에서 뚜껑이 열림
const GCOL = ['#ffb3c7', '#8fd3f4', '#ffd36b', '#9fdcc8'], CAPS = ['#ff8fb8', '#7cc4f0', '#ffd36b', '#7fd6c0', '#b9a6ff', '#ffa86b'];
const CARD = {};
const cardTex = i => CARD[i] || (CARD[i] = textTex(256, 80, (c, W, H) => {
  c.fillStyle = '#fffaf2'; c.fillRect(0, 0, W, H); c.fillStyle = GCOL[i]; c.fillRect(0, 0, W, 6); c.fillRect(0, H - 6, W, 6);
  const ic = [[PLUSH[i], 'bear'], [PLUSH[(i + 2) % 7], 'cat'], [PLUSH[(i + 4) % 7], 'bunny']];
  ic.forEach(([col, e], j) => { const x = 18 + j * 22, y = 23; c.fillStyle = shade(col, -.06);
    if (e === 'bunny') { c.beginPath(); c.ellipse(x - 4, y - 9, 2.5, 6, -.2, 0, PI * 2); c.fill(); c.beginPath(); c.ellipse(x + 4, y - 9, 2.5, 6, .2, 0, PI * 2); c.fill(); }
    else if (e === 'cat') { for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * 7, y - 2); c.lineTo(x + s * 6, y - 11); c.lineTo(x + s * 1, y - 6); c.closePath(); c.fill(); } }
    else { dot(c, x - 6, y - 6, 3.5); dot(c, x + 6, y - 6, 3.5); }
    c.fillStyle = col; dot(c, x, y, 8); c.fillStyle = '#4a3a52'; dot(c, x - 3, y - 1, 1.2); dot(c, x + 3, y - 1, 1.2); });
  fitText(c, '300원', W - 26, H / 2 + 1, 40, 13, '#e2675a');
}));
const gachaBand = once(() => textTex(320, 56, (c, W, H) => { c.fillStyle = MOLD; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.25)'; for (let x = 6; x < W; x += 14) dot(c, x, H / 2, 2); fitText(c, '캡슐 토이', W / 2, H / 2 + 1, W - 40, 19, '#fffaf0', { stroke: '#4a3a52', sw: 3 }); }));
B.ol5_gacha = (f, T) => {
  const z0 = -.16, UW = .4, UD = .4, UH = .52, BY = .3, FZ = z0 + UD / 2, SD = .56;
  const units = [0, 1, 2, 3].map(i => ({ i, x: (i % 2 ? 1 : -1) * .215, y: BY + Math.floor(i / 2) * UH, c: GCOL[i] }));
  f.add(mc('ol5-gacha', ({ add }) => {
    // 받침장: 크림 상자, 걸레받이, 나무 윗판, 앞 캡슐 받침(작은 쟁반)
    add(G.box(.86, BY - .04, SD, .03), '#efe6d8', 0, .04 + (BY - .04) / 2, z0 + .04); add(G.box(.88, .04, SD + .02, .015), PLUM, 0, .02, z0 + .04);
    add(G.box(.9, .03, SD + .02, .012), WOOD5, 0, BY - .005, z0 + .04);
    add(G.box(.22, .02, .1, .006), '#fbf4ea', .3, BY + .012, z0 + .26); for (const sx of [-1, 1]) add(G.box(.012, .03, .1, .004), '#fbf4ea', .3 + sx * .105, BY + .025, z0 + .26); add(G.box(.22, .03, .012, .004), '#fbf4ea', .3, BY + .025, z0 + .305);
    for (const u of units) {
      const { x, y, c } = u;
      add(G.box(UW, UH * .46, UD, .03), c, x, y + UH * .23, z0); add(G.box(UW + .01, .04, UD + .01, .015), c, x, y + UH - .02, z0);
      for (const sx of [-1, 1]) add(G.box(.03, UH * .5, UD, .01), c, x + sx * (UW / 2 - .015), y + UH * .71, z0);
      add(G.pbox(UW - .05, UH * .5, .01), '#fdf8f2', x, y + UH * .71, z0 - UD / 2 + .01); add(G.pbox(UW - .05, .01, UD - .04), shade(c, .12), x, y + UH * .465, z0);
      // 캡슐 (아래 반은 색, 위 반은 흰빛)
      for (let j = 0; j < 7; j++) { const px = x - .12 + (j % 4) * .08, py = y + UH * .47 + .05 + Math.floor(j / 4) * .082 + (j % 2) * .01, pz = z0 + ((j * 37) % 3 - 1) * .07;
        add(new THREE.SphereGeometry(.042, 8, 3, 0, PI * 2, HP, HP), CAPS[(u.i + j) % 6], px, py, pz); add(new THREE.SphereGeometry(.042, 8, 3, 0, PI * 2, 0, HP), '#f4f8fb', px, py, pz); }
      // 동전판·동전 구멍·나오는 구멍(덮개)
      add(G.box(.2, .15, .015, .01), '#dfe3ec', x - .03, y + UH * .27, FZ + .006); add(G.pbox(.012, .035, .008), INK5, x + .03, y + UH * .27 + .045, FZ + .016);
      add(G.box(.1, .065, .02, .015), INK5, x + .12, y + .047, FZ + .006); add(G.box(.085, .03, .006, .004), shade(c, -.1), x + .12, y + .06, FZ + .018);
      if (u.i !== 1) { add(G.cyl(.05, .05, .025, 16), '#c9cfdc', x - .03, y + UH * .25, FZ + .022, HP, 0, 0); add(G.box(.09, .022, .02, .008), '#f6f6fa', x - .03, y + UH * .25, FZ + .042); }
    }
    // 옆: 캡슐 껍데기 통(작은 원통)
    add(G.cyl(.07, .06, .16, 14), '#dfe3ec', -.36, BY + .08, z0 + .28); add(G.tor(.07, .008, PI * 2, 4, 16), '#c9cfdc', -.36, BY + .16, z0 + .28, HP, 0, 0);
    add(new THREE.SphereGeometry(.03, 8, 3, 0, PI * 2, HP, HP), CAPS[0], -.37, BY + .17, z0 + .28); add(new THREE.SphereGeometry(.03, 8, 3, 0, PI * 2, 0, HP), '#f4f8fb', -.34, BY + .165, z0 + .27, .5, 0, 0);
  }));
  // 창 유리·그림 카드·받침 띠
  const glassM = mat(GLASS, { opacity: .22, rough: .1, rim: 0 });
  for (const u of units) {
    const g = mesh(new THREE.PlaneGeometry(UW - .06, UH * .5 - .02), glassM, { cast: false }); put(g, u.x, u.y + UH * .71, FZ + .004); f.add(g);
    const cd = mesh(new THREE.PlaneGeometry(.3, .09), mat('#ffffff', { map: cardTex(u.i), rim: 0 }), { cast: false }); put(cd, u.x, u.y + UH * .5 + .02, FZ + .008); f.add(cd);
  }
  { const m = mesh(new THREE.PlaneGeometry(.56, .09), basic(gachaBand(), '#f6eef4'), { cast: false }); put(m, 0, BY - .07, z0 + .04 + SD / 2 + .004); f.add(m); }
  // 캡슐 통 서랍 (받침장 앞 아래)
  const dv = grp(); put(dv, 0, .1, z0 + .04 + SD / 2 + .004); f.add(dv);
  dv.add(mc('ol5-gacha-drawer', ({ add }) => {
    add(G.box(.62, .1, .02, .01), '#e6dccd', 0, 0, .01); add(G.box(.16, .022, .02, .008), PLUM, 0, 0, .028);
    add(G.pbox(.56, .01, .4), '#efe3c8', 0, -.04, -.21); for (const sx of [-1, 1]) add(G.pbox(.01, .07, .4), '#efe3c8', sx * .28, -.01, -.21);
    for (const [px, pz, ci] of [[-.15, -.12, 0], [-.06, -.25, 2], [.12, -.18, 4]]) { add(new THREE.SphereGeometry(.035, 8, 3, 0, PI * 2, HP, HP), CAPS[ci], px, -.0, pz); add(new THREE.SphereGeometry(.035, 8, 3, 0, PI * 2, 0, HP), '#f4f8fb', px, -.0, pz); }
  }));
  const pd = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .3 * t; }, { label: '캡슐 통 서랍', sfx: 'drawer', dur: .26 });
  f.spot('inside', dv, .02, -.035, -.2, { part: pd, maxH: .08, label: '캡슐 통 서랍 안', scale: .6 });
  // 돌리는 손잡이 + 큰 캡슐 (오른쪽 아래 기계): 손잡이 한 바퀴 → 캡슐이 구멍에서 굴러 나와 받침에 서고 뚜껑이 열림
  const u1 = units[1], kn = grp(); put(kn, u1.x - .03, u1.y + UH * .25, FZ + .022); f.add(kn);
  kn.add(mc('ol5-gacha-knob', ({ add }) => { add(G.cyl(.05, .05, .025, 16), '#c9cfdc', 0, 0, 0, HP, 0, 0); add(G.box(.1, .024, .022, .008), '#f6f6fa', 0, 0, .022); add(G.sph(.014, 6, 4), TOMATO5, .045, 0, .03); }));
  const cap = grp(); put(cap, u1.x + .12, u1.y + .05, FZ - .1); f.add(cap);
  cap.add(mc('ol5-gacha-cap', ({ add }) => { add(new THREE.SphereGeometry(.075, 14, 6, 0, PI * 2, HP, HP), CAPS[0], 0, .075, 0); add(G.tor(.075, .008, PI * 2, 4, 20), shade(CAPS[0], -.12), 0, .075, 0, HP, 0, 0); }));
  const lid = grp(); put(lid, 0, .075, -.075); cap.add(lid);
  lid.add(mc('ol5-gacha-lid', ({ add }) => { add(new THREE.SphereGeometry(.076, 14, 6, 0, PI * 2, 0, HP), '#f4f8fb', 0, 0, .075); add(G.sph(.012, 6, 4), '#ffffff', -.03, .05, .1); }));
  const ss = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const pk = f.part('lift', [kn, cap, lid], (t, bk, bc) => {
    const a = ss(Math.min(1, t / .45)), m = ss((t - .35) / .4), l = ss((t - .75) / .25);
    kn.rotation.z = -PI * 2 * a;
    cap.position.set(bc.p.x + (.3 - bc.p.x) * m, bc.p.y + (BY + .022 - bc.p.y) * m + Math.sin(m * PI) * .06, bc.p.z + (z0 + .26 - bc.p.z) * m);
    cap.rotation.x = (1 - m) * PI * 2;
    lid.rotation.x = -1.6 * l;
  }, { label: '캡슐 손잡이', sfx: 'lift', dur: 1.3 });
  f.spot('inside', cap, 0, .07, 0, { part: pk, maxH: .1, label: '캡슐 속', scale: .4 });
  f.spot('on', null, -.1, BY + UH * 2 + .01, z0, { maxH: .24, label: '캡슐 뽑기 위', scale: .7 });
  f.spot('behind', null, .52, 0, z0 - .02, { maxH: .45, label: '캡슐 뽑기 옆 틈', scale: .7 });
  f.collideBox = [-.45, 0, z0 - .22, .45, BY + UH * 2, z0 + .04 + SD / 2];
};

// ── 동전 교환기 (1×1, 새로): 크림 몸에 하늘색 머리 띠(불 켜진 '동전 교환' 글자), 옅은 하늘 앞판, 지폐 넣는 곳(초록 불), 단추 셋, 작은 안내 화면,
// 앞으로 튀어나온 은색 동전 컵(안에 동전 몇 개), 열쇠 구멍, '1000원 → 500원 × 2' 종이
const changerSign = once(() => textTex(256, 72, (c, W, H) => { c.fillStyle = '#5fa9bf'; c.fillRect(0, 0, W, H); fitText(c, '동전 교환', W / 2, H / 2 + 1, W - 24, 22, '#ffffff', { stroke: '#2f4a5a', sw: 3 }); }));
const changerNote = once(() => textTex(224, 96, (c, W, H) => { paperFill(c, W, H, '#fffaf0', 9); fitText(c, '1000원 → 500원 × 2', W / 2, H / 2, W - 16, 15, '#4a3a52'); }));
B.ol5_changer = (f, T) => {
  const z0 = -.18, W = .58, H = 1.5, D = .44, FZ = z0 + D / 2;
  f.add(mc('ol5-changer', ({ add }) => {
    add(G.box(W, H - .06, D, .05), '#f6efe4', 0, .06 + (H - .06) / 2, z0); add(G.box(W + .02, .06, D + .02, .02), PLUM, 0, .03, z0);
    add(G.box(W + .03, .22, D + .03, .05), '#7cc3d6', 0, H - .11, z0); add(G.box(W + .05, .03, D + .05, .01), RAIL, 0, H + .005, z0);
    add(G.box(W - .1, .8, .02, .02), '#d6ecf1', 0, .86, FZ + .006);
    add(G.box(.26, .07, .03, .015), INK5, 0, 1.12, FZ + .02); add(G.pbox(.2, .012, .01), '#1c1828', 0, 1.12, FZ + .036);
    for (const [x, c] of [[-.1, MINT5], [0, BUTTER], [.1, PINK5]]) { add(G.cyl(.03, .03, .025, 14), c, x, .97, FZ + .02, HP, 0, 0); add(G.cyl(.022, .022, .006, 14), shade(c, .15), x, .97, FZ + .034, HP, 0, 0); }
    add(G.box(.2, .09, .02, .01), INK5, 0, .82, FZ + .018);
    add(G.box(.3, .05, .18, .015), STEEL5, 0, .36, FZ + .08); add(G.box(.3, .16, .02, .01), STEEL5, 0, .43, FZ + .17); for (const sx of [-1, 1]) add(G.box(.02, .14, .18, .006), STEEL5, sx * .14, .43, FZ + .08);
    add(G.box(.26, .1, .02, .008), '#2f2b3d', 0, .45, FZ + .005);
    for (const [dx, dz] of [[-.05, .06], [.04, .1], [0, .04], [.08, .05]]) add(G.cyl(.022, .022, .008, 12), '#e2b54e', dx, .392, FZ + dz, .2, 0, .1);
    add(G.cyl(.018, .018, .012, 12), STEEL5D, .2, .7, FZ + .014, HP, 0, 0); add(G.pbox(.005, .016, .004), INK5, .2, .7, FZ + .021);
  }));
  f.add(lamp('changer-bill', '#7cf09a', ({ add }) => { add(G.pbox(.03, .02, .008), '#7cf09a', .1, 1.12, FZ + .037); }, 1.3));
  f.add(lamp('changer-lcd', '#bff2ff', ({ add }) => { add(G.pbox(.16, .055, .006), '#bff2ff', 0, .82, FZ + .03); }, .9));
  { const m = mesh(new THREE.PlaneGeometry(W - .06, .16), basic(changerSign(), '#f4f0f6'), { cast: false }); put(m, 0, H - .11, FZ + .018); f.add(m); }
  { const n = paperSheet(.22, .095, changerNote(), { hold: 'tape', curl: false }); put(n, 0, .63, FZ + .017); f.add(n); }
  f.spot('inside', null, 0, .37, FZ + .08, { maxH: .1, label: '동전 받는 컵', scale: .55 });
  f.spot('on', null, 0, H + .02, z0, { maxH: .3, label: '동전 교환기 위', scale: .7 });
  f.spot('behind', null, .38, 0, z0, { maxH: .4, label: '동전 교환기 옆 틈', scale: .7 });
};

// 비 (10/24 사용자 "비 오는 거 개굴이에 썼던 걸로 해 줄래? … 배경의 비는 퀄이 너무 안 좋으니 지워 주고"): the shared rain of 3판·29판
// (s3-kit.js rainFall — the one that never stops), thin and quiet for the night: fewer, fainter drops, none under the building's
// roof, a ring where one lands in a puddle or on the street out front
B.ol5_rain = f => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.7, 0, .01, -.65, .01];
  const inHouse = (x, z) => x > NX0 - .08 && x < NX1 + .08 && z > NZ - NT - .08 && z < 3.2;
  rainFall(f, { n: 110, w: 10.5, d: 9.6, cx: .35, cz: .4, top: 5.6, opacity: .34, seed: 18, ringY: ISY + .02, out: inHouse,
    wet: (x, z) => !inHouse(x, z) && x > -4.2 && x < 4.9 && z > -3.7 && z < 4.5 });
};
// ── 오락기 디테일 더하기 (⑥ 10/25 memo-check "18판 오락기 전부 디테일업"): 부품·자리 약속은 그대로 두고 겉에만 덧붙임 ──────────────────
// 오락기: 마키 위아래 꼬마 전구 줄, 화면 둘레 종류 색 테와 모서리 별, 조작판 앞 턱의 그림 안내 카드(스틱·단추 그림), 옆 컵걸이(캔 음료),
// 앞 몸의 몽글이 스티커, 의자 옆에 떨어진 동전. 인형 뽑기: 간판 아래 전구 줄, 유리 반사 두 줄, 안쪽 천장 등, 옆 경품 티켓이 말려 나옴,
// 받침의 환기 구멍. 캡슐 뽑기: 받침 쟁반에 빈 캡슐 반쪽들, 옆에 빈 캡슐 통. 동전 교환기: 간판 위 전구, 금빛 500 동전 그림, 위에 동전 주머니
const plus = (k, fn) => { const b = B[k]; B[k] = (f, T, o = {}) => { b(f, T, o); fn(f, T, o); }; };
const cardIcons = once(() => canvasTex(256, 32, (c, W, H) => {
  c.fillStyle = '#fffaf0'; c.fillRect(0, 0, W, H); c.fillStyle = '#4a3a52';
  for (const x0 of [8, 136]) {
    dot(c, x0 + 14, 16, 9); c.fillStyle = '#fffaf0'; dot(c, x0 + 14, 16, 5); c.fillStyle = '#4a3a52';
    for (const [dx, dy, a] of [[0, -13, 0], [13, 0, HP], [0, 13, PI], [-13, 0, -HP]]) { c.save(); c.translate(x0 + 14 + dx * .9, 16 + dy * .9); c.rotate(a); c.beginPath(); c.moveTo(0, -3); c.lineTo(3, 1); c.lineTo(-3, 1); c.closePath(); c.fill(); c.restore(); }
    [BUTTER, MINT5, PINK5].forEach((col, i) => { c.fillStyle = col; dot(c, x0 + 46 + i * 22, 16, 7); c.fillStyle = '#4a3a52'; c.beginPath(); c.arc(x0 + 46 + i * 22, 16, 7, 0, PI * 2); c.lineWidth = 2; c.strokeStyle = '#4a3a52'; c.stroke(); });
    c.fillRect(x0 + 112, 6, 2, 20);
  }
}));
const BULB = '#fff1c4';
plus('ol5_cab', (f, T, o) => {
  const k = (o.kind || 0) % 3, C = CABS[k], W = .72, z0 = -.12, ST = .045, PA = .4636, MA = -.1974, FZ = z0 + .3, sx0 = o.prize ? .16 : 0, sz = z0 + .34 + .44;
  f.add(lamp('cab-bulbs', BULB, ({ add }) => { for (const y of [1.792, 1.568]) for (let i = 0; i < 9; i++) add(G.sph(.013, 8, 6), BULB, -.3 + i * .075, y, z0 + .252); }, 1.4));
  const bz = grp(); put(bz, 0, 1.301, z0 + .088, MA, 0, 0); f.add(bz);
  bz.add(mc('ol5-cab-bezel|' + k, ({ add }) => {
    for (const sy of [-1, 1]) add(G.box(.6, .022, .008, .004), C.acc, 0, sy * .166, 0); for (const sx of [-1, 1]) add(G.box(.022, .35, .008, .004), C.acc, sx * .296, 0, 0);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(G.cyl(.018, .018, .01, 5), '#fffaf0', sx * .296, sy * .166, .004, HP, 0, 0);
  }));
  const cp = grp(); cp.position.set(0, 1.005, z0 + .31); cp.rotation.x = PA; f.add(cp);
  { const m = mesh(new THREE.PlaneGeometry(.5, .03), mat('#ffffff', { map: cardIcons(), rim: 0 }), { cast: false }); put(m, 0, .011, .108, -HP, 0, 0); cp.add(m); }
  f.add(mc('ol5-cab-plus|' + k, ({ add, tube }) => {
    const cx = W / 2 + ST + .05;
    add(G.tor(.04, .008, PI * 2, 5, 16), STEEL5D, cx, .99, z0 + .3, HP, 0, 0); add(G.cyl(.04, .04, .006, 14), STEEL5D, cx, .96, z0 + .3); tube([cx - .04, .99, z0 + .3], [cx - .045 - .01, .99, z0 + .3], .008, STEEL5D, 5);
    if (k !== 1) { add(G.cyl(.03, .03, .1, 12), k ? PINK5 : SKY5, cx, 1.012, z0 + .3); add(G.cyl(.026, .026, .006, 12), STEEL5, cx, 1.065, z0 + .3); add(G.box(.026, .04, .004, .002), '#ffffff', cx, 1.01, z0 + .331); }
    const mx = .22, my = .53, mz = FZ + .004;
    add(G.cyl(.042, .042, .006, 18), '#ffffff', mx, my, mz, HP, 0, 0); add(G.cyl(.034, .034, .008, 18), '#fff6ee', mx, my, mz + .001, HP, 0, 0);
    for (const s of [-1, 1]) { add(G.sph(.006, 6, 5), INK5, mx + s * .012, my + .004, mz + .006); add(G.sph(.008, 6, 5), CHEEK, mx + s * .022, my - .008, mz + .005, 0, 0, 0, [1, .6, .4]); add(G.sph(.012, 6, 5), '#fff6ee', mx + s * .027, my + .03, mz + .002); }
    add(G.cyl(.016, .016, .004, 12), '#e2b54e', sx0 + .22, .004, sz + .1); add(G.box(.004, .001, .012, .001), '#c99a36', sx0 + .22, .007, sz + .1);
  }));
});
plus('ol5_claw', (f, T, o) => {
  const k = (o.kind || 0) % 2, W = .76, D = .7, z0 = -.04, BY = .72, GY = 1.56, FZ = z0 + D / 2;
  f.add(lamp('claw-bulbs', BULB, ({ add }) => { for (let i = 0; i < 9; i++) add(G.sph(.013, 8, 6), BULB, -.33 + i * .0825, GY + .015, FZ + .012); }, 1.4));
  f.add(lamp('claw-inner', '#fffaf0', ({ add }) => add(G.pbox(W - .14, .012, .05), '#fffaf0', 0, GY - .03, z0), 1.0));
  for (const [x, w] of [[-.18, .05], [-.1, .02]]) { const g = mesh(new THREE.PlaneGeometry(w, GY - BY - .14), mat('#ffffff', { opacity: .28, rim: 0 }), { cast: false }); put(g, x, (BY + GY) / 2 + .02, FZ - .012, 0, 0, -.12); f.add(g); }
  f.add(mc('ol5-claw-plus|' + k, ({ add }) => {
    add(G.box(.012, .06, .1, .004), STEEL5D, W / 2 + .006, .5, z0 + .1); add(G.pbox(.004, .012, .07), INK5, W / 2 + .013, .5, z0 + .1);
    for (let i = 0; i < 5; i++) add(G.box(.004, .05, .06, .002), i % 2 ? '#ffc2d6' : '#ffd9e5', W / 2 + .012 + i * .004, .46 - i * .045, z0 + .1, 0, 0, -.25 * i);
    for (let i = 0; i < 4; i++) add(G.box(.12, .008, .004, .002), PLUM, -.22, .2 + i * .03, FZ + .004);
  }));
});
plus('ol5_gacha', (f, T) => {
  const z0 = -.16, BY = .3;
  f.add(mc('ol5-gacha-plus', ({ add }) => {
    for (const [x, z, c, r] of [[.26, .24, PINK5, 0], [.33, .27, '#ffffff', 1.2], [.3, .29, SKY5, 2.4]]) add(new THREE.SphereGeometry(.035, 12, 6, 0, PI * 2, 0, HP), c, x, BY + .014, z0 + z, PI, r, 0);
    add(G.cyl(.09, .08, .26, 16, true), '#c9d7e8', .58, .13, z0 + .12); add(G.cyl(.085, .075, .255, 16, true), '#b0c0d6', .58, .132, z0 + .12, 0, 0, 0, [-1, 1, 1]); add(G.cyl(.075, .075, .01, 16), '#b0c0d6', .58, .005, z0 + .12); add(G.tor(.09, .008, PI * 2, 4, 18), '#ffffff', .58, .26, z0 + .12, HP, 0, 0);
    for (const [x, z, c] of [[.56, .1, BUTTER], [.6, .14, MINT5], [.57, .15, '#ffffff']]) add(new THREE.SphereGeometry(.032, 12, 6, 0, PI * 2, 0, HP), c, x, .2, z0 + z, PI, x * 9, 0);
  }));
});
plus('ol5_changer', (f, T) => {
  const z0 = -.18, W = .58, H = 1.5, D = .44, FZ = z0 + D / 2;
  f.add(lamp('changer-bulbs', BULB, ({ add }) => { for (let i = 0; i < 7; i++) add(G.sph(.012, 8, 6), BULB, -.24 + i * .08, H - .005, FZ + .022); }, 1.4));
  f.add(mc('ol5-changer-plus', ({ add }) => {
    add(G.cyl(.07, .07, .012, 24), '#e2b54e', 0, .2, FZ + .004, HP, 0, 0); add(G.cyl(.056, .056, .014, 24), '#f2cf6a', 0, .2, FZ + .006, HP, 0, 0); add(G.tor(.045, .004, PI * 2, 4, 20), '#c99a36', 0, .2, FZ + .014);
    add(G.sph(.08, 12, 10), '#c98a52', .12, H + .06, z0, 0, 0, 0, [1, .8, 1]); add(G.tor(.03, .008, PI * 2, 4, 12), '#e8d9b8', .12, H + .12, z0, HP, 0, 0);
    for (let i = 0; i < 3; i++) add(G.cyl(.02, .02, .006, 12), '#e2b54e', -.12 + i * .012, H + .015 + i * .007, z0 + .05);
  }));
});

export const OL5_BUILDERS = B;
export const OL5_INFO = {
  ol5_shell: { w: 1, d: 1, name: '너굴이네 오락실 2층집', hidden: true, price: 0 },
  ol5_rain: { w: 1, d: 1, name: '비', hidden: true, price: 0 },
  ol5_spiral: { w: 1, d: 1, name: '철제 나선 계단', hidden: true, price: 0 },
  ol5_slide: { w: 1, d: 3, name: '노란 미끄럼틀', hidden: true, price: 0 },
  ol5_prizewall: { w: 2, d: 1, name: '경품 진열장', hidden: true, price: 0 },
  ol5_chest: { w: 1, d: 2, name: '긴 서랍장', hidden: true, price: 0 },
  ol5_crane: { w: 1, d: 1, name: '집게 크레인 바구니', hidden: true, price: 0 },
  ol5_cab: { w: 1, d: 1, name: '너굴 오락실 오락기', hidden: true, price: 0 },
  ol5_claw: { w: 1, d: 1, name: '인형 뽑기 기계', hidden: true, price: 0 },
  ol5_gacha: { w: 1, d: 1, name: '캡슐 뽑기', hidden: true, price: 0 },
  ol5_changer: { w: 1, d: 1, name: '동전 교환기', hidden: true, price: 0 },
};

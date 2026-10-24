// 28판 시골 전차 두 량 — traincar5 (⑧ 10/24, 사용자 "전차 완전 새롭게 다시… 완전 디테일하고 좋아 보이게", "배경을 저렇게 만들면 배경도 계속
// 움직여야 할 텐데.. 어쩌려고 저래 만든겨"; 허브가 블록아웃 A — 일렬 청록 로컬 전차 — 를 고름). 원칙: 기차 바깥은 하늘색 그라데이션 한 장
// (땅·선로·마을 3D 없음), 움직이는 건 창 안 풍경만(그림 띠 세 겹을 텍스처 offset으로 — 메시 이동 X, 초당 30번), 기차는 공중에 뜬 단면
// 디오라마(바퀴 아래 짧은 선로 한 토막), 터널은 창 띠만 어두워짐. 미리보기 블록아웃 traincar5a·5b도 같은 빌더(o.v 'a' | 'b').
// 옛 키(traincar·traincar2·traincar3·gpttraincar2·traincar4)와 그 빌더는 그대로 — 여기는 새 type만.
//   tc5shell   한 량의 차체 아래: 차체 띠(글자 판·차 번호), 대차·바퀴(돎), 앞코 전조등 / 꼬리 등·헤드마크, 짧은 선로 한 토막
//   tc5wall    창 쪽 벽(먼 쪽) + 처마: 판벽·광고 띠(한·영)·창 사이 액자 광고·벽 선풍기(돎); o.half(B) 허리 벽, o.cap(B) 끝 지붕 한 토막
//   twindow5   기차 창: 하늘 + 먼 산·구름(느리게) / 논·집·나무(중간) / 전봇대·덤불(빠르게), 가끔 터널(창 띠만 어두워짐);
//              o.blind 롤 블라인드(label '롤 블라인드' — 판 연출 터널이 내린 창은 건너뜀), o.curtain 카페 커튼, o.cup 창턱 컵, o.bell 하차 벨
//   tc5door    창 쪽 출입문 한 쌍(문 창에도 풍경이 흐름) + 정리권 발권기(누르면 표가 나옴) + 하차 벨
//   tc5long    롱시트(모켓 천) — o.drawer 좌석 서랍(자물쇠), o.stuff 놓고 간 것(신문·컵라면 / 귤 망·차 / 우산)
//   tc5box     박스석 한 칸(마주보는 두 의자 + 창가 탁자) — o.drawer 의자 밑 서랍(자물쇠), o.stuff 탁자 위(도시락 / 카드·과자)
//   tc5rack    짐 선반(여행 가방 = 너굴이 숨는 곳 '…선반 위는 반칙', 자물쇠) · 배낭(들림) · 더플백 · o.straps 손잡이 봉과 걸린 광고
//   tc5pole    세로 손잡이 봉 + 하차 벨(누르면 딩동)
//   tc5end     칸 끝벽: 'door' 연결 통로 미닫이 문(비밀번호) · 'arch' 문틀 · 'cab' 운전실 칸막이(노선도·행선 표시·운임함·문, 안에 계기판·운전석)
//              · 'deck' 꼬리 전망 난간 · 'rear'
//   tc5gang    연결 통로: 무늬 발판·고무 주름막(가까운 쪽 = 숨는 자리, 누르면 출렁)·놓고 간 우산 — o.dx 엇갈린 만큼 비스듬히(B)
//   tc5view    꼬리 전망석 소파 · tc5cab 앞코 운전실(B) · tc5cargo 짐칸(B) · tc5bags 바닥 짐
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, texCache, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';
import { addI18n } from '../i18n.js';

const PI = Math.PI, HP = PI / 2;
const K = (ko, en) => { if (EN[ko] == null) EN[ko] = en; return ko; };
for (const [ko, en] of [['롱시트', 'Long seat'], ['박스석', 'Box seat'], ['좌석 서랍', 'Seat drawer'], ['좌석 서랍 안', 'In the seat drawer'], ['좌석 위', 'On the seat'],
  ['좌석 밑', 'Under the seat'], ['창가 탁자 위', 'On the window table'], ['창턱', 'Window sill'], ['롤 블라인드', 'Roller blind'], ['블라인드 뒤 창턱', 'Behind the blind'], ['커튼', 'Curtain'],
  ['짐 선반', 'Luggage rack'], ['짐 선반 여행 가방', 'Suitcase on the rack'], ['여행 가방 뒤', 'Behind the suitcase'], ['짐 선반 위', 'On the rack'], ['배낭', 'Backpack'], ['배낭 뒤', 'Behind the backpack'],
  ['연결 통로 문', 'Gangway door'], ['연결 통로 안', 'In the gangway'], ['고무 주름막', 'Rubber bellows'], ['주름막 사이', 'In the bellows'], ['연결 통로', 'Gangway'],
  ['운전실 문', 'Cab door'], ['운전실 안', 'In the cab'], ['운전석', 'Driver seat'], ['운전석 위', "On the driver's seat"], ['운전대 위', 'On the console'],
  ['전망석', 'View seat'], ['전망석 위', 'On the view seat'], ['전망석 밑', 'Under the view seat'], ['꼬리 난간', 'Tail rail'],
  ['짐칸', 'Luggage bay'], ['짐칸 문', 'Luggage cage'], ['짐칸 안', 'In the luggage cage'], ['상자 위', 'On the crates'], ['자전거 옆', 'By the bicycle'],
  ['바닥 짐', 'Floor luggage'], ['짐 위', 'On the luggage'], ['차체', 'Car body'], ['칸 벽', 'Car wall'], ['칸 끝벽', 'Car end'], ['기차 창', 'Train window'], ['운전실', 'Cab'],
  ['출입문', 'Train doors'], ['출입문 발판', 'On the door step'], ['정리권 발권기', 'Ticket machine'], ['발권기 위', 'On the ticket machine'], ['정리권', 'Ticket'],
  ['하차 벨', 'Stop bell'], ['손잡이 봉', 'Grab pole'], ['운임함', 'Fare box'], ['운임함 위', 'On the fare box'],
  ['봄빛 로컬', 'Spring Local'], ['봄빛 로컬선', 'Spring Local Line'], ['봄빛', 'Spring'], ['1호차', 'Car 1'], ['2호차', 'Car 2'], ['호수 섬 행', 'For Lake Island'], ['다음 역', 'Next'],
  ['벚꽃역', 'Sakura Stn.'], ['들판', 'Fields'], ['온천', 'Hot Spring'], ['호수 섬', 'Lake Island'], ['바다', 'Sea'],
  ['딸기 축제', 'Strawberry Fest'], ['온천 마을', 'Hot Spring Town'], ['벚꽃 도시락', 'Sakura Bento'], ['바다 보러 가요', 'To the Sea!'], ['호수 섬 캠핑', 'Lake Camping'],
  ['기차 여행', 'Train Trip'], ['역 도시락', 'Station Bento'], ['내리실 때 누르세요', 'Press to stop'], ['손잡이를 잡아 주세요', 'Hold the strap'], ['운행표', 'Timetable']]) K(ko, en);

// ── 두 안의 색: 큰 면은 순하게, 쨍한 색은 작은 것에만
// a 청록 로컬 전차 (사용자가 좋아한 GPT 객차 그림: 청록 차체·크림 벽·주황 테두리·꿀빛 마루) — traincar5의 색
// b 레트로 노면 전차 (버터 크림 + 순한 하늘파랑 차체, 나무 판벽, 산호 의자) — 미리보기 traincar5b
export const PAL = {
  a: { body: '#2f9c88', bodyD: '#227a6b', line: '#fbf2df', trim: '#f2963a', up: '#fbf2df', up2: '#f3e6cc', low: '#cde7dc', low2: '#bfdccf', seat: '#37a48e', seatD: '#2a8775',
    moq: '#bfe8dc', roof: '#2f9c88', ceil: '#fbf2df', wood: '#c98f55', door: '#a8d8c6', glassF: '#f2963a' },
  b: { body: '#7ea7d8', bodyD: '#5e86bd', line: '#fdf3dc', trim: '#f0bf4f', up: '#fdf3dc', up2: '#f3e3c4', low: '#d6a670', low2: '#c99760', seat: '#e27d6b', seatD: '#c9634f',
    moq: '#f8cfc4', roof: '#e6e1d6', ceil: '#fff8e8', wood: '#b9824e', door: '#f3d9a6', glassF: '#5e86bd' },
};
const S = { steel: '#c3c9d2', steel2: '#8f98a6', dark: '#3b3647', ink: '#2a2233', rail: '#9aa3ae', sleeper: '#8a6446', gravel: '#b8b2aa', rubber: '#857f94', rubber2: '#958fa4',
  coral: '#ec8a78', coral2: '#d76f5f', yellow: '#f6cf5a', red: '#e5554b', white: '#fffaf1', blue: '#5f86c4', mint: '#a7d9c4', orange: '#f59a2e', paper: '#f4f1ea' };
const P = o => PAL[o.v === 'b' ? 'b' : 'a'];
const TX = texCache();
const WH = 2.9;
const flat = (w, h, tex, o = {}) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: tex, rim: 0, ...o }), { cast: false });

// a wall-side piece goes away while the camera is round on the wall's far side (as a room's wall pieces do)
const foldWall = f => {
  const prev = f.updateView; let shown = true;
  f.updateView = (W, dt) => {
    prev?.(W, dt); if (!W || !Number.isFinite(W.yaw)) return;
    const want = Math.sin(W.yaw) >= -.18; if (want === shown) return;
    shown = want; f.group.visible = want; W.shadowDirty = true; W.idsDirty = true;
  };
};

// ═════════════════════════ 그림 (painted once each, cached) ═════════════════════════
// seat moquette: the seat colour with fine stripes and a little diamond pattern
const moquette = (base, dot) => TX.get('tc5-moq|' + base + dot, () => canvasTex(128, 128, (c, W, H) => {
  c.fillStyle = base; c.fillRect(0, 0, W, H);
  c.fillStyle = shade(base, -.07); for (let y = 0; y < H; y += 8) c.fillRect(0, y, W, 2);
  c.fillStyle = dot; for (let y = 8; y < H; y += 32) for (let x = (y / 32 % 2) * 16 + 8; x < W; x += 32) { c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 5, y); c.lineTo(x, y + 5); c.lineTo(x - 5, y); c.fill(); }
}, { repeat: [1, 1] }));
// the upper wall: soft vertical panelling
const panelTex = (a, b) => TX.get('tc5-panel|' + a + b, () => canvasTex(256, 256, (c, W, H) => { c.fillStyle = a; c.fillRect(0, 0, W, H); c.fillStyle = b; for (let x = 0; x < W; x += 64) c.fillRect(x, 0, 4, H); }, { repeat: [1, 1] }));
const ADS = [['딸기 축제', '#ffd8df', '#e8414e'], ['온천 마을', '#dff0ff', '#3f7cc4'], ['벚꽃 도시락', '#ffe9f0', '#d9547c'], ['바다 보러 가요', '#d9f3ef', '#1f8a78'], ['호수 섬 캠핑', '#fff1cf', '#c9852a']];
// one ad card's little picture (k picks it) in a box centred at cx, cy of size s
function adPic(c, k, cx, cy, s, fg) {
  c.fillStyle = fg;
  if (k === 0) { for (const [dx, r] of [[-.3, .15], [0, .18], [.3, .14]]) { const x = cx + dx * s, rr = r * s; c.beginPath(); c.moveTo(x, cy + rr * 1.4); c.bezierCurveTo(x - rr * 1.4, cy, x - rr, cy - rr, x, cy - rr); c.bezierCurveTo(x + rr, cy - rr, x + rr * 1.4, cy, x, cy + rr * 1.4); c.fill(); c.fillStyle = '#5fb35a'; c.fillRect(x - rr * .3, cy - rr * 1.2, rr * .6, rr * .3); c.fillStyle = fg; } }
  else if (k === 1) { c.beginPath(); c.arc(cx, cy + s * .12, s * .26, 0, PI); c.fill(); c.strokeStyle = fg; c.lineWidth = s * .05; for (const dx of [-.14, 0, .14]) { c.beginPath(); c.moveTo(cx + dx * s, cy); c.quadraticCurveTo(cx + dx * s + s * .08, cy - s * .12, cx + dx * s, cy - s * .26); c.stroke(); } }
  else if (k === 2) { c.fillRect(cx - s * .34, cy - s * .2, s * .68, s * .4); c.fillStyle = '#fff'; c.fillRect(cx - s * .3, cy - s * .16, s * .28, s * .32); c.fillStyle = '#ff9fb8'; for (const [dx, dy] of [[.1, -.06], [.22, .06], [.14, .1]]) { c.beginPath(); c.arc(cx + dx * s, cy + dy * s, s * .06, 0, 7); c.fill(); } }
  else if (k === 3) { c.fillStyle = '#ffd23c'; c.beginPath(); c.arc(cx + s * .22, cy - s * .14, s * .12, 0, 7); c.fill(); c.fillStyle = fg; c.fillRect(cx - s * .38, cy + s * .08, s * .76, s * .18); c.fillStyle = '#fff'; c.fillRect(cx - s * .3, cy + s * .1, s * .3, s * .03); }
  else { c.beginPath(); c.moveTo(cx - s * .3, cy + s * .22); c.lineTo(cx, cy - s * .26); c.lineTo(cx + s * .3, cy + s * .22); c.fill(); c.fillStyle = '#3f9e6a'; c.fillRect(cx - s * .38, cy + s * .22, s * .76, s * .06); }
}
// the long strip of ads under the eave (our lettering, Korean and English through fitText)
const adsTex = () => TX.get('tc5-ads', () => textTex(1536, 160, (c, W, H) => {
  c.fillStyle = '#e8e1d2'; c.fillRect(0, 0, W, H);
  const w = W / ADS.length;
  ADS.forEach(([t, bg, fg], k) => {
    const x = k * w + 4, cx = x + (w - 8) / 2;
    c.fillStyle = '#c4baa6'; c.fillRect(x - 2, 3, w - 6, H - 6); c.fillStyle = bg; c.fillRect(x + 2, 6, w - 12, H - 12);
    adPic(c, k, x + 30, H / 2, 46, fg);
    fitText(c, t, cx + 18, H / 2, w - 80, 24, '#3a2f3f', { weight: '700' });
  });
}));
// a framed poster between windows / a hanging poster (k: which ad)
const posterTex = k => TX.get('tc5-poster|' + k, () => textTex(256, 320, (c, W, H) => {
  const [t, bg, fg] = ADS[k % ADS.length];
  c.fillStyle = bg; c.fillRect(0, 0, W, H); c.fillStyle = fg; c.fillRect(0, H - 34, W, 34);
  adPic(c, k % ADS.length, W / 2, H * .4, 90, fg);
  fitText(c, t, W / 2, H - 17, W - 16, 18, '#ffffff', { weight: '700' });
}));
// the route map over the cab door: the line, its stops (호수 섬 next, in red), the line's name
const routeTex = () => TX.get('tc5-route', () => textTex(1024, 220, (c, W, H) => {
  c.fillStyle = S.white; c.fillRect(0, 0, W, H); c.fillStyle = PAL.a.body; c.fillRect(0, 0, W, 40);
  fitText(c, '봄빛 로컬선', W / 2, 20, W * .7, 26, '#ffffff', { weight: '700' });
  const st = ['벚꽃역', '들판', '온천', '호수 섬', '바다'], x0 = W * .1, dx = W * .8 / (st.length - 1), y = 70;
  c.fillStyle = PAL.a.trim; c.fillRect(x0, y - 5, dx * (st.length - 1), 10);
  st.forEach((s, i) => { const x = x0 + dx * i; c.fillStyle = i === 3 ? S.red : '#ffffff'; c.beginPath(); c.arc(x, y, 12, 0, 7); c.fill(); c.lineWidth = 4; c.strokeStyle = PAL.a.bodyD; c.stroke();
    fitText(c, s, x, 96, dx * .9, 18, i === 3 ? S.red : '#3a2f3f', { weight: '700' }); });
}));
// the destination board: dark glass, orange letters
const ledTex = () => TX.get('tc5-led', () => textTex(512, 96, (c, W, H) => {
  c.fillStyle = '#26232c'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,170,60,.1)'; for (let x = 0; x < W; x += 6) c.fillRect(x, 0, 2, H);
  fitText(c, '다음 역', W * .2, H / 2, W * .3, 22, '#ffd37a', { weight: '700' });
  fitText(c, '호수 섬 행', W * .64, H / 2, W * .58, 26, '#ffad4a', { weight: '700' });
}));
// the car's name on the body band, and its number in a disc
const bodyTex = n => TX.get('tc5-body|' + n, () => textTex(512, 80, (c, W, H) => {
  c.fillStyle = PAL.a.line; c.fillRect(0, 0, W, H); c.fillStyle = PAL.a.trim; c.fillRect(0, H - 6, W, 3);
  fitText(c, '봄빛 로컬', W * .36, H / 2 - 2, W * .62, 24, PAL.a.bodyD, { weight: '700' });
  c.fillStyle = PAL.a.bodyD; c.beginPath(); c.arc(W * .84, H / 2 - 2, 16, 0, 7); c.fill();
  fitText(c, String(n), W * .84, H / 2 - 2, 24, 22, '#ffffff', { weight: '700' });
}));
const markTex = () => TX.get('tc5-mark', () => textTex(256, 256, (c, W, H) => {
  c.fillStyle = PAL.a.bodyD; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 1, 0, 7); c.fill();
  c.fillStyle = PAL.a.line; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 8, 0, 7); c.fill();
  c.fillStyle = '#f6b6c8'; for (let k = 0; k < 5; k++) { const a = k * PI * 2 / 5 - HP; c.beginPath(); c.arc(W / 2 + Math.cos(a) * 15, H * .38 + Math.sin(a) * 15, 9, 0, 7); c.fill(); }
  c.fillStyle = PAL.a.trim; c.beginPath(); c.arc(W / 2, H * .38, 5, 0, 7); c.fill();
  fitText(c, '봄빛', W / 2, H * .72, W * .6, 24, PAL.a.bodyD, { weight: '700' });
}));
// a gauge face for the cab
const dialTex = k => TX.get('tc5-dial|' + k, () => canvasTex(128, 128, (c, W, H) => {
  c.fillStyle = '#fffaf1'; c.beginPath(); c.arc(64, 64, 60, 0, 7); c.fill(); c.strokeStyle = '#3b3647'; c.lineWidth = 6; c.stroke();
  c.lineWidth = 3; for (let i = 0; i <= 8; i++) { const a = PI * .75 + i * PI * 1.5 / 8; c.beginPath(); c.moveTo(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44); c.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54); c.stroke(); }
  c.strokeStyle = k ? '#e5554b' : '#2f9c88'; c.lineWidth = 9; c.beginPath(); c.arc(64, 64, 49, PI * 1.85, PI * 2.25); c.stroke();
  const a = PI * (k ? 1.35 : 1.0); c.strokeStyle = '#e5554b'; c.lineWidth = 5; c.beginPath(); c.moveTo(64, 64); c.lineTo(64 + Math.cos(a) * 42, 64 + Math.sin(a) * 42); c.stroke();
  c.fillStyle = '#3b3647'; c.beginPath(); c.arc(64, 64, 7, 0, 7); c.fill();
}));
// small labels: the ticket machine's '정리권', the stop bell's '내리실 때 누르세요'
const labelTex = (key, s, bg, fg, w = 256, h = 96) => TX.get('tc5-lab|' + key, () => textTex(w, h, (c, W, H) => { c.fillStyle = bg; c.fillRect(0, 0, W, H); fitText(c, s, W / 2, H / 2, W - 10, Math.round(H * .42), fg, { weight: '700' }); }));
// the gangway's steel tread plate
const tread = () => TX.get('tc5-tread', () => canvasTex(128, 128, (c, W, H) => {
  c.fillStyle = '#b7bec8'; c.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) { c.save(); c.translate(x + 8, y + 8); c.rotate(((x + y) / 16) % 2 ? .6 : -.6); c.fillStyle = '#d5dae1'; c.fillRect(-5, -1.5, 10, 3); c.fillStyle = '#9aa2ad'; c.fillRect(-5, 1.5, 10, 1); c.restore(); }
}, { repeat: [2, 2] }));

// ── 사용자 메모 10/24 (28판 traincar5 손보기): 신문·컵라면 인쇄, 연결 통로 안내판, 통로 매트, 흐르는 선로(침목만 흐르고 양 끝은 옅어짐)
addI18n({
  '봄빛 신문': 'Spring Daily', '호수 섬 축제 개막': 'Lake Island Fest opens', '벚꽃 기차 만석': 'Sakura trains sold out', '오늘의 날씨 맑음': 'Today: sunny',
  '컵라면': 'Cup noodles', '매운맛': 'Spicy', '1호차': 'Car 1', '2호차': 'Car 2', '운전실 안': 'In the cab', '기관사 모자 옆': "Beside the driver's cap",
  '흐르는 선로': 'Rolling track', '통로 매트': 'Aisle mat', '연결 통로 구석': 'Gangway corner', '운임함': 'Fare box', '정리권': 'Ticket',
  '앞창': 'Front window', '계기판': 'Instrument panel', '서랍 이름표': 'Drawer label',
  '봄빛 로컬 전차': 'Spring Local Train', '청록 로컬 전차': 'Teal local train', '레트로 노면 전차': 'Retro streetcar',
});
// the folded newspaper's front page: masthead, headline, a photo, columns (our lettering, Korean and English)
const newsTex = () => TX.get('tc5-news', () => textTex(512, 384, (c, W, H) => {
  c.fillStyle = '#f6f2ea'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#2d2a33'; c.fillRect(10, 8, W - 20, 4); fitText(c, '봄빛 신문', W / 2, 30, W * .6, 26, '#2d2a33', { weight: '700' }); c.fillRect(10, 50, W - 20, 2);
  fitText(c, '호수 섬 축제 개막', W / 2, 76, W - 30, 24, '#c2453c', { weight: '700' });
  c.fillStyle = '#a9c7e6'; c.fillRect(14, 96, W * .46, 74); c.fillStyle = '#9fd07a'; c.fillRect(14, 140, W * .46, 30); c.fillStyle = '#f5b3c6'; c.beginPath(); c.arc(70, 132, 16, 0, 7); c.fill();
  c.fillStyle = '#8b8790'; for (let k = 0; k < 7; k++) c.fillRect(W * .52, 98 + k * 11, W * .44, 5);
  fitText(c, '벚꽃 기차 만석', W * .27, 184, W * .48, 14, '#2d2a33', { weight: '700' }); fitText(c, '오늘의 날씨 맑음', W * .74, 184, W * .44, 14, '#2d2a33', { weight: '700' });
}));
// the cup noodle's band: red, a little bowl and steam, 컵라면 · 매운맛
const noodleTex = () => TX.get('tc5-noodle', () => textTex(256, 96, (c, W, H) => {
  c.fillStyle = '#e8574a'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffd23c'; c.fillRect(0, H - 14, W, 8);
  fitText(c, '컵라면', W * .5, H * .38, W * .7, 22, '#ffffff', { weight: '700' }); fitText(c, '매운맛', W * .5, H * .7, W * .5, 13, '#fff3c8');
}));
// small signs in the gangway: ← 1호차 · 2호차 →
const gangSignTex = (k) => TX.get('tc5-gsign|' + k, () => textTex(256, 80, (c, W, H) => {
  c.fillStyle = PAL.a.bodyD; c.fillRect(0, 0, W, H); c.fillStyle = '#ffffff';
  c.beginPath(); if (k) { c.moveTo(W - 20, H / 2); c.lineTo(W - 42, H / 2 - 14); c.lineTo(W - 42, H / 2 + 14); } else { c.moveTo(20, H / 2); c.lineTo(42, H / 2 - 14); c.lineTo(42, H / 2 + 14); } c.fill();
  fitText(c, k ? '2호차' : '1호차', W / 2 + (k ? -10 : 10), H / 2, W * .6, 22, '#ffffff', { weight: '700' });
}));
// the aisle runner: soft teal with cream edges and a little diamond row
const matTex = () => TX.get('tc5-mat', () => canvasTex(128, 256, (c, W, H) => {
  c.fillStyle = '#7fb8a8'; c.fillRect(0, 0, W, H); c.fillStyle = '#f2e6cc'; c.fillRect(0, 0, 12, H); c.fillRect(W - 12, 0, 12, H);
  c.fillStyle = '#6aa695'; c.fillRect(18, 0, 4, H); c.fillRect(W - 22, 0, 4, H);
  c.fillStyle = '#e9f4ef'; for (let y = 16; y < H; y += 32) { c.beginPath(); c.moveTo(W / 2, y - 7); c.lineTo(W / 2 + 7, y); c.lineTo(W / 2, y + 7); c.lineTo(W / 2 - 7, y); c.fill(); }
}, { repeat: [1, 1] }));
// the rolling track: gravel speckles, wooden sleepers (they move), two steel rails along it (they look still while it scrolls)
const trackTex = () => TX.get('tc5-track', () => { const t = canvasTex(256, 128, (c, W, H) => {
  c.fillStyle = '#c6c0b7'; c.fillRect(0, 0, W, H);
  const r = RNG(7); for (let k = 0; k < 420; k++) { c.fillStyle = ['#b3ada4', '#d6d1c9', '#a8a29a'][k % 3]; c.fillRect(r() * W, r() * H, 3, 3); }
  c.fillStyle = '#8a6446'; c.fillRect(22, 30, W - 44, 40); c.fillStyle = '#9b7354'; c.fillRect(22, 30, W - 44, 8); c.fillStyle = '#6e4f37'; c.fillRect(22, 64, W - 44, 6);
  for (const x of [W * .5 - 1.1 / 3 * W, W * .5 + 1.1 / 3 * W]) { c.fillStyle = '#7d8590'; c.fillRect(x - 9, 0, 18, H); c.fillStyle = '#c9d0d8'; c.fillRect(x - 5, 0, 10, H); c.fillStyle = '#eef2f5'; c.fillRect(x - 2, 0, 3, H); }
}); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; });
const RNG = seed => { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
// its fade: clear at both ends, solid in the middle (the alpha map keeps still while the sleepers scroll)
const trackFade = () => TX.get('tc5-trackfade', () => canvasTex(4, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#000'); g.addColorStop(.12, '#fff'); g.addColorStop(.88, '#fff'); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(0, 0, W, H); }));

// ═════════════════════════ 창 안 풍경 (three painted strips over a still sky; offsets only) ═════════════════════════
const tile = (w, h, draw) => { const t = canvasTex(w, h, draw); t.wrapS = THREE.RepeatWrapping; return t; };
const viewTex = () => ({
  sky: TX.get('tc5-sky', () => canvasTex(128, 256, (c, W, H) => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#79c1ee'); g.addColorStop(.65, '#c9eafb'); g.addColorStop(1, '#eef9ff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  })),
  // far: white clouds, two soft ridges of hills (slow)
  far: TX.get('tc5-far', () => tile(512, 256, (c, W, H) => {
    c.fillStyle = 'rgba(255,255,255,.96)';
    for (const [x, y, r] of [[40, 46, 16], [62, 38, 22], [88, 48, 15], [250, 34, 13], [272, 28, 19], [296, 36, 12], [420, 52, 15], [444, 44, 20], [466, 52, 12]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    const ridge = (base, amp, col, ph) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) { const a = x / W * PI * 2; c.lineTo(x, base - amp * (.6 * Math.sin(a * 2 + ph) + .4 * Math.sin(a * 3 + ph * 2))); }
      c.lineTo(W, H); c.fill(); };
    ridge(H * .5, H * .14, '#a7c9df', 0); ridge(H * .6, H * .11, '#93c3a3', 1.7);
  })),
  // mid: rice paddies holding the sky, white farmhouses with blue-grey roofs, pink cherry and green trees (medium)
  mid: TX.get('tc5-mid', () => tile(512, 256, (c, W, H) => {
    const g0 = H * .7; c.fillStyle = '#9fd07a'; c.fillRect(0, g0, W, H - g0);
    c.fillStyle = '#b9e2ee'; for (let x = 6; x < W; x += 64) c.fillRect(x, g0 + 12, 50, 12);
    c.fillStyle = '#86c05c'; for (let x = 6; x < W; x += 64) for (let k = 0; k < 5; k++) c.fillRect(x + 4 + k * 10, g0 + 12, 3, 12);
    const house = (x, w, h, roof) => { c.fillStyle = '#fffaf1'; c.fillRect(x, g0 - h, w, h); c.fillStyle = roof; c.beginPath(); c.moveTo(x - 6, g0 - h); c.lineTo(x + w / 2, g0 - h - h * .55); c.lineTo(x + w + 6, g0 - h); c.fill(); c.fillStyle = '#7f6a58'; c.fillRect(x + w * .38, g0 - h * .55, w * .22, h * .55); };
    const tree = (x, r, a, b) => { c.fillStyle = '#8a6044'; c.fillRect(x - 2, g0 - r, 4, r); c.fillStyle = a; c.beginPath(); c.arc(x, g0 - r * 1.4, r, 0, 7); c.fill(); c.fillStyle = b; c.beginPath(); c.arc(x - r * .35, g0 - r * 1.65, r * .5, 0, 7); c.fill(); };
    house(30, 40, 26, '#5f7c99'); tree(98, 14, '#f5b3c6', '#fde0e8'); house(150, 30, 20, '#c4654f'); tree(212, 16, '#6fb85e', '#8fd07a'); tree(232, 11, '#f5b3c6', '#fde0e8');
    house(300, 44, 28, '#5f7c99'); tree(372, 15, '#6fb85e', '#8fd07a'); house(410, 28, 20, '#3f8f7c'); tree(468, 13, '#f5b3c6', '#fde0e8');
  })),
  // near: telegraph poles whipping past with their wires, round bushes and flowers on the bank (fast)
  near: TX.get('tc5-near', () => tile(512, 256, (c, W, H) => {
    const g0 = H * .9, poles = [W * .22, W * .72];
    c.strokeStyle = '#3a3346'; c.lineWidth = 2.5;
    for (const dy of [30, 42]) for (let i = 0; i < poles.length; i++) {
      const a = poles[i], b = i + 1 < poles.length ? poles[i + 1] : poles[0] + W;
      for (const sh of [0, -W]) { c.beginPath(); c.moveTo(a + sh, dy); c.quadraticCurveTo((a + b) / 2 + sh, dy + 18, b + sh, dy); c.stroke(); }
    }
    for (const x of poles) { c.fillStyle = '#7a5a44'; c.fillRect(x - 6, 18, 12, H); c.fillStyle = '#3a3346'; c.fillRect(x - 26, 26, 52, 6); c.fillStyle = '#e8e2d8'; for (const dx of [-20, 14]) c.fillRect(x + dx, 20, 6, 6); }
    c.fillStyle = '#79c05a'; c.fillRect(0, g0, W, H - g0);
    for (const [x, r, col] of [[60, 26, '#5fb35a'], [150, 20, '#6fc06a'], [300, 30, '#58aa55'], [430, 22, '#6fc06a']]) { c.fillStyle = col; c.beginPath(); c.arc(x, g0, r, PI, 0); c.fill(); }
    for (let k = 0; k < 12; k++) { c.fillStyle = ['#ffffff', '#ffd23c', '#ff9fb8'][k % 3]; c.beginPath(); c.arc((k * 43 + 9) % W, g0 + 6 + (k % 2) * 6, 3, 0, 7); c.fill(); }
  })),
});
// a flowing view in a w×h opening: the still sky, then the three strips at their own speeds; every 26 s a 2.6 s tunnel darkens the
// strips and the sky only (the room's light stays). All windows run on one clock, each at its own place along the line.
const SPEED = { far: [9, .5], mid: [4.4, 2.0], near: [3.0, 6.0] };
const TUN = { every: 26, at: 17, len: 2.6 };
function flowView(f, w, h, cy, z0, parent = null) {
  const F = viewTex(), host = parent || f.group, skyM = new THREE.MeshBasicMaterial({ map: F.sky }); skyM.toneMapped = false;
  const sky = mesh(new THREE.PlaneGeometry(w, h), skyM, { cast: false }); put(sky, 0, cy, z0); host.add(sky);
  const lays = ['far', 'mid', 'near'].map((k, i) => {
    const [Lm, v] = SPEED[k], tex = F[k].clone(); tex.repeat.set(w / Lm, 1); tex.needsUpdate = true;
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }); m.toneMapped = false;
    const pl = mesh(new THREE.PlaneGeometry(w, h), m, { cast: false }); put(pl, 0, cy, z0 + .003 + i * .003); pl.layers.set(2); pl.renderOrder = 1 + i; pl.userData.noOcclude = true; host.add(pl);
    return { tex, m, Lm, v };
  });
  const mats = [skyM, ...lays.map(L => L.m)];
  let base = null, last = -1, dark = 0;
  const v3 = new THREE.Vector3();
  return t => {
    const fr = Math.floor(t * 30); if (fr === last) return; last = fr;
    if (base == null) { host.updateWorldMatrix(true, false); host.localToWorld(v3.set(-w / 2, 0, 0)); base = v3.z; }
    for (const L of lays) { const x = (base + t * L.v) / L.Lm; L.tex.offset.x = x - Math.floor(x); }
    const ph = t % TUN.every - TUN.at, k = ph < 0 || ph > TUN.len ? 0 : Math.min(1, ph / .35, (TUN.len - ph) / .35);
    if (Math.abs(k - dark) > .01 || (k === 0 && dark !== 0)) { dark = k; for (const m of mats) m.color.setScalar(1 - .84 * k); }
  };
}

// ═════════════════════════ 차체 아래 + 선로 한 토막 ═════════════════════════
// (one car, at its middle; o.w × o.len): the body under the floor with its cream and orange lines, the car's name plate on the near
// side, bogies and turning wheels, the nose (o.nose, -z: headlights, skirt) or the tail (o.tail, +z: tail lamps, round head mark),
// and a short length of track with sleepers and a gravel bed under it — the train floats in the sky.
// o.half (B): the near side is a waist-high wall instead of a low sill.
const B = {};
B.tc5shell = (f, T, o = {}) => {
  const C = P(o), W = o.w || 4, L = o.len || 6;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  f.add(mc('tc5-shell3|' + [o.v, W, L, o.nose ? 1 : 0, o.tail ? 1 : 0, o.half ? 1 : 0, o.noTrack ? 1 : 0].join(','), ({ add, tube }) => {
    add(G.box(W + .3, .56, L, .05), C.body, 0, -.33, 0);
    add(G.box(W + .34, .09, L + .02, .02), C.line, 0, -.06, 0);
    add(G.box(W + .36, .05, L + .03, .012), C.trim, 0, -.2, 0);
    add(G.box(W - .1, .14, L - .3, .03), '#36404a', 0, -.66, 0);
    if (o.half) {
      add(G.box(.16, .95, L, .03), C.body, W / 2 + .08, .47, 0); add(G.box(.04, .9, L - .04, .01), C.up, W / 2 - .02, .46, 0);
      add(G.box(.24, .06, L + .02, .02), C.line, W / 2 + .07, .97, 0); add(G.box(.18, .04, L, .01), C.trim, W / 2 + .17, .7, 0);
    } else {
      add(G.box(.14, .34, L, .03), C.line, W / 2 + .07, .17, 0); add(G.box(.2, .05, L + .02, .02), C.trim, W / 2 + .07, .36, 0);
      add(G.box(.02, .07, L - .1, .01), C.body, W / 2 + .145, .13, 0);
    }
    // the step under each door-side of the body, rivets along the band
    for (let z = -L / 2 + .4; z < L / 2 - .2; z += .6) add(G.sph(.025, 6, 4), C.bodyD, W / 2 + .155, -.42, z);
    for (const bz of [-L / 2 + 1.2, L / 2 - 1.2]) {
      add(G.box(2.6, .18, 1.3, .05), '#45414f', 0, -.82, bz);
      for (const sx of [-1, 1]) { add(G.box(.16, .24, 1.5, .05), '#4d4958', sx * 1.25, -.98, bz); for (const dz of [-.22, .22]) add(G.cyl(.06, .06, .16, 8), S.yellow, sx * 1.25, -.79, bz + dz); add(G.box(.12, .1, .2, .02), '#6c6878', sx * 1.25, -1.06, bz); }
    }
    add(G.box(1.3, .32, 1.0, .05), '#4f5b63', .4, -.84, 0); for (let k = 0; k < 5; k++) add(G.box(.02, .22, .8, .005), '#3d474e', 1.06, -.84, -.4 + k * .2);
    add(G.cyl(.22, .22, 1.0, 12), '#5e6a72', -.8, -.86, 0, HP, 0, 0);
    // the track: two rails, sleepers, a gravel bed — just under this car, a little longer than it (o.noTrack: a rolling track runs
    // under the whole train instead — tc5track)
    if (!o.noTrack) {
      const TL = L + .7;
      add(G.box(2.6, .18, TL, .07), S.gravel, 0, -1.56, 0); add(G.box(2.3, .06, TL - .1, .03), shade(S.gravel, .06), 0, -1.47, 0);
      for (let z = -TL / 2 + .25; z < TL / 2; z += .55) add(G.box(2.2, .08, .22, .02), S.sleeper, 0, -1.43, z);
      for (const sx of [-1, 1]) { add(G.box(.09, .1, TL, .01), S.rail, sx * 1.1, -1.35, 0); add(G.box(.14, .03, TL, .005), '#7d8590', sx * 1.1, -1.4, 0); }
    }
    if (o.nose) {
      add(G.box(W - .2, .34, .2, .06), '#3c4a52', 0, -.78, -L / 2 - .18); add(G.box(W - .8, .12, .24, .04), C.trim, 0, -.58, -L / 2 - .2);
      for (const x of [-1.3, 1.3]) { add(G.cyl(.14, .14, .1, 14), '#f4f1e6', x, -.33, -L / 2 - .16, HP, 0, 0); add(G.cyl(.09, .09, .02, 12), '#fff3b8', x, -.33, -L / 2 - .21, HP, 0, 0); }
      add(G.box(.3, .2, .4, .05), S.steel2, 0, -.5, -L / 2 - .32);
    }
    if (o.tail) {
      for (const x of [-1.3, 1.3]) { add(G.cyl(.12, .12, .1, 14), '#f7f0e4', x, -.33, L / 2 + .16, HP, 0, 0); add(G.cyl(.08, .08, .02, 12), S.red, x, -.33, L / 2 + .21, HP, 0, 0); }
      add(G.box(.3, .2, .4, .05), S.steel2, 0, -.5, L / 2 + .32); tube([.4, -.48, L / 2 + .1], [.5, -.7, L / 2 + .3], .035, '#2f2b38');
    }
  }));
  // the car's name on the near side of the band (it faces the camera), the tail's round head mark
  if (o.v !== 'b') {
    const bt = flat(1.5, .24, bodyTex(o.carNo || 1)); put(bt, W / 2 + .155, -.36, o.tail ? 1.4 : -1.4, 0, HP); f.add(bt);
    if (o.tail) { const hm = mesh(new THREE.CircleGeometry(.3, 28), mat('#ffffff', { map: markTex(), rim: 0 }), { cast: false }); put(hm, 0, -.3, L / 2 + .23); f.add(hm); }
  }
  const axles = [];
  for (const bz of [-L / 2 + 1.2, L / 2 - 1.2]) for (const dz of [-.42, .42]) {
    const ax = grp(); put(ax, 0, -1.05, bz + dz); f.add(ax); axles.push(ax);
    ax.add(mc('tc5-axle2', ({ add }) => {
      for (const sx of [-1, 1]) { add(G.cyl(.3, .3, .12, 16), '#3d3946', sx * 1.1, 0, 0, 0, 0, HP); add(G.cyl(.17, .17, .14, 10), S.steel, sx * 1.1, 0, 0, 0, 0, HP); add(G.box(.12, .3, .05, .01), '#55515f', sx * 1.1, 0, 0); add(G.cyl(.05, .05, .16, 8), S.orange, sx * 1.1, 0, 0, 0, 0, HP); }
      add(G.cyl(.05, .05, 2.2, 8), '#2f2b38', 0, 0, 0, 0, 0, HP);
    }));
  }
  f.live = axles;
  let last = -1;
  f.tick = t => { const fr = Math.floor(t * 30); if (fr === last) return; last = fr; for (const a of axles) a.rotation.x = -t * 15; };
};

// ═════════════════════════ 창 쪽 벽 + 처마 ═════════════════════════
// (the far wall of one car, at the car's middle): the outside skin, a soft lower panel with its rail, cream panelling above; the strip
// of ads under the eave (o.ads), framed posters between the windows (o.posters: their z), a wall fan near the top (o.fan: its z —
// it turns); the roof's round edge over the wall (the rest of the roof is lifted off) and the cut section of the body at both ends.
// o.cap (B): -1 / 1 — at that end a short piece of the whole roof stays on.
const ring = (X0, roof) => {
  const s = new THREE.Shape(), R = .5;
  s.moveTo(X0 - .28, -.04); s.lineTo(X0 - .28, WH - .05); s.quadraticCurveTo(X0 - .28, WH + .45, X0 + .2, WH + .45); s.lineTo(X0 + R, WH + .45);
  s.lineTo(X0 + R, WH + .3); s.lineTo(X0 + .2, WH + .3); s.quadraticCurveTo(X0 + .04, WH + .3, X0 + .04, WH - .05); s.lineTo(X0 + .04, -.04); s.lineTo(X0 - .28, -.04);
  return s;
};
// the roof's own edge over the wall: only the top of the ring
const eaveShape = X0 => {
  const s = new THREE.Shape(), R = .5;
  s.moveTo(X0 - .28, WH - .05); s.quadraticCurveTo(X0 - .28, WH + .45, X0 + .2, WH + .45); s.lineTo(X0 + R, WH + .45); s.lineTo(X0 + R, WH + .3);
  s.lineTo(X0 + .2, WH + .3); s.quadraticCurveTo(X0 + .04, WH + .3, X0 + .04, WH - .05); s.lineTo(X0 - .28, WH - .05);
  return s;
};
B.tc5wall = (f, T, o = {}) => {
  const C = P(o), W = o.w || 4, L = o.len || 6, X0 = -W / 2;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  const wall = grp(), top = grp(); f.add(wall); f.add(top); f.live = [wall, top];
  wall.add(mc('tc5-wall2|' + [o.v, W, L].join(','), ({ add }) => {
    add(G.box(.1, WH, L, .02), C.up, X0 - .05, WH / 2, 0);
    add(G.box(.07, WH + .02, L + .02, .02), C.body, X0 - .135, WH / 2, 0);
    add(G.box(.075, .26, L + .03, .01), C.line, X0 - .14, 1.0, 0); add(G.box(.078, .045, L + .04, .005), C.trim, X0 - .142, .84, 0);
    add(G.box(.04, .86, L, .02), C.low, X0 + .015, .45, 0); add(G.box(.06, .06, L, .02), C.trim, X0 + .025, .88, 0);
    for (let z = -L / 2 + .5; z < L / 2 - .3; z += .5) add(G.box(.045, .8, .02, .004), C.low2, X0 + .02, .45, z);
    add(G.box(.08, .06, L, .02), C.up2, X0 - .01, WH - .02, 0);
  }));
  const pt = panelTex(C.up, C.up2).clone(); pt.wrapS = pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(L / 1.2, (WH - .92) / 1.2); pt.needsUpdate = true;
  const pu = flat(L - .02, WH - .95, pt); put(pu, X0 + .004, (WH + .9) / 2, 0, 0, HP); wall.add(pu);
  if (o.ads) { const at = adsTex().clone(); at.wrapS = THREE.RepeatWrapping; at.repeat.set(Math.max(1, (L - .6) / 5.4), 1); at.needsUpdate = true;
    const ad = flat(L - .6, .24, at); put(ad, X0 + .012, 2.73, 0, 0, HP); wall.add(ad); }
  for (const [k, z] of (o.posters || []).entries()) {
    const fr = mc('tc5-pframe2', ({ add }) => { add(G.box(.03, .52, .4, .01), S.steel2, 0, 0, 0); });
    put(fr, X0 + .02, 1.66, z); wall.add(fr);
    const pp = flat(.34, .44, posterTex(k + (o.pk || 0))); put(pp, X0 + .04, 1.66, z, 0, HP); wall.add(pp);
  }
  top.add(mc('tc5-roof2|' + [o.v, W, L, o.cap || 0].join(','), ({ add }) => {
    const r = G.ext(eaveShape(X0), L - .3, 0, 10); r.translate(0, 0, -(L - .3) / 2); add(r, C.roof, 0, 0, 0);
    add(G.box(.06, .05, L - .3, .02), C.line, X0 + .08, WH + .02, 0);
    for (const z of [-L / 2 + 1.3, L / 2 - 1.5]) { add(G.box(.42, .2, .9, .07), '#dfe4ea', X0 - .12, WH + .5, z); for (let k = 0; k < 4; k++) add(G.box(.3, .02, .03, .005), S.steel2, X0 - .12, WH + .61, z - .32 + k * .21); }
    const rg = G.ext(ring(X0), .16, .02, 10);
    for (const z of [-L / 2, L / 2 - .16]) add(rg, C.bodyD, 0, 0, z);
    if (o.cap) {
      const cl = o.capL || .9, zc = o.cap * (L / 2 - cl / 2);
      add(G.box(W + .56, .24, cl, .1), C.roof, 0, WH + .36, zc); add(G.box(W + .5, .08, cl + .04, .03), C.line, 0, WH + .2, zc);
      add(G.box(W + .6, .1, .14, .04), C.bodyD, 0, WH + .5, zc - o.cap * (cl / 2 - .07));
      add(G.box(.14, WH + .2, .14, .03), C.body, W / 2 + .06, (WH + .2) / 2, o.cap * (L / 2 - .07));
      add(G.box(.9, .24, .06, .03), '#26232c', -.2, WH + .36, o.cap * (L / 2 + .01)); add(G.box(.7, .1, .065, .02), '#ffad4a', -.2, WH + .36, o.cap * (L / 2 + .02));
    }
  }));
  // the wall fan: a cage and three blades that turn (only the blades move)
  let blades = null;
  if (o.fan != null) {
    const fz = o.fan;
    wall.add(put(mc('tc5-fanbase', ({ add }) => { add(G.box(.06, .16, .16, .03), S.steel2, 0, 0, 0); add(G.cyl(.03, .03, .16, 8), S.steel2, .1, -.04, 0, 0, 0, HP); add(G.cyl(.09, .1, .12, 14), S.white, .2, -.06, 0, 0, 0, HP); }), X0 + .03, 2.55, fz));
    const cage = mc('tc5-fancage', ({ add }) => { add(G.tor(.2, .012, PI * 2, 6, 24), S.steel, 0, 0, 0, 0, HP, 0); for (let k = 0; k < 6; k++) add(G.box(.008, .4, .008, .002), S.steel, 0, 0, 0, k * PI / 6, 0, 0); add(G.cyl(.04, .04, .06, 10), PAL.a.trim, 0, 0, 0, 0, 0, HP); });
    put(cage, X0 + .38, 2.49, fz); wall.add(cage);
    blades = grp(); put(blades, X0 + .35, 2.49, fz); wall.add(blades);
    blades.add(mc('tc5-fanblades', ({ add }) => { for (let k = 0; k < 3; k++) add(G.box(.012, .17, .08, .02), '#cfe9f5', 0, Math.cos(k * 2.094) * .1, Math.sin(k * 2.094) * .1, k * 2.094, 0, 0); }));
    f.live.push(blades);
    let last = -1;
    f.tick = t => { const fr = Math.floor(t * 30); if (fr === last) return; last = fr; blades.rotation.x = t * 9; };
  }
  let k = 1;
  f.updateView = (Wd, dt = 1 / 60) => {
    if (!Wd || !Number.isFinite(Wd.yaw)) return;
    const want = Math.sin(Wd.yaw) < -.18 ? 0 : 1, k0 = k;
    k += (want - k) * (1 - Math.exp(-Math.max(0, dt) * 12)); if (Math.abs(k - want) < .002) k = want;
    if (k === k0) return;
    wall.scale.y = .14 + .86 * k; top.visible = k > .65; Wd.shadowDirty = true;
  };
};

// ═════════════════════════ 기차 창 ═════════════════════════
// (wall piece: placed at the far wall, local +z into the car): a rounded frame with a half-height sash bar, the flowing view, a sill;
// o.hh / o.cy the opening's height and middle; o.sill 'full' (old) · 'short' (a thin ledge just the window's width — over a seat back) ·
// 'none' (a box seat's table is the ledge); o.blind a roller blind (label '롤 블라인드' — the stage's tunnel zoom skips a window with its
// blind down), o.curtain café curtains (a part), o.cup a cup on the sill, o.bell a stop bell on the frame
// (사용자 메모 10/24 "창가쪽 선반이 좀 길어. 의자에 닿는 선반이 어딨어", "선반이 의자 뚫고 나왔다": the old sill ran wider than the window into
// the box seats' backs and, low under the long seats' windows, through their backs)
B.twindow5 = (f, T, o = {}) => {
  const C = P(o), W = o.ww || 1.6, H = o.hh || 1.42, cy = o.cy ?? 1.68, sill = o.sill || 'full';
  foldWall(f); f.noSolid = true;
  f.add(mc('twindow5c|' + [o.v, W, H, cy, sill].join(','), ({ add }) => {
    add(G.box(W + .22, .11, .12, .04), C.glassF, 0, cy + H / 2 + .05, .04); add(G.box(W + .22, .11, .12, .04), C.glassF, 0, cy - H / 2 - .05, .04);
    for (const s of [-1, 1]) add(G.box(.11, H + .22, .12, .04), C.glassF, s * (W / 2 + .05), cy, .04);
    add(G.box(W, .06, .06, .02), C.glassF, 0, cy + H * .14, .05);
    for (const s of [-1, 1]) add(G.box(.05, .1, .04, .01), S.steel, s * W / 4, cy + H * .14 + .06, .08);
    if (sill === 'full') { add(G.box(W + .34, .05, .24, .02), C.up2, 0, cy - H / 2 - .11, .11); add(G.box(W + .34, .02, .02, .005), C.trim, 0, cy - H / 2 - .1, .23); }
    else if (sill === 'short') { add(G.box(W + .06, .04, .13, .015), C.up2, 0, cy - H / 2 - .12, .07); add(G.box(W + .06, .015, .015, .004), C.trim, 0, cy - H / 2 - .11, .135); }
  }));
  f.tick = flowView(f, W, H, cy, .02);
  f.add(mc('twindow5-glint2|' + W, ({ add }) => { add(G.box(.05, H * .36, .004, .002), '#ffffff', -W * .3, cy + .1, .05, 0, 0, .5); add(G.box(.025, H * .24, .004, .002), '#ffffff', -W * .22, cy + .16, .05, 0, 0, .5); }));
  const sy = cy - H / 2 - (sill === 'short' ? .1 : .07);
  if (o.cup && sill !== 'none') f.add(mc('twindow5-cup2', ({ add, tube }) => { add(G.cyl(.045, .038, .09, 12), '#ffffff', 0, .045, 0); add(G.cyl(.041, .041, .01, 12), '#c98a52', 0, .085, 0); tube([.045, .07, 0], [.06, .03, 0], .011, '#ffffff', 5); }).translateX(.5).translateY(sy).translateZ(.09));
  if (o.bell) {
    f.add(mc('twindow5-bell', ({ add }) => { add(G.box(.12, .16, .05, .03), S.white, W / 2 + .05, cy - .25, .12); add(G.cyl(.035, .035, .03, 12), S.yellow, W / 2 + .05, cy - .25, .15, HP, 0, 0); }));
    const lb = flat(.16, .06, labelTex('bell', '내리실 때 누르세요', '#fff3c8', '#3a2f3f')); put(lb, W / 2 + .05, cy - .1, .126); f.add(lb);
  }
  if (o.blind) {
    const BW = W + .1, bl = grp(); put(bl, 0, cy + H / 2 + .1, .15); f.add(bl);
    f.add(mc('twindow5-roll2|' + W, ({ add }) => { add(G.cyl(.065, .065, BW + .08, 14), '#e3b247', 0, cy + H / 2 + .12, .15, 0, 0, HP); for (const s of [-1, 1]) add(G.box(.04, .15, .14, .01), S.steel, s * (BW / 2 + .06), cy + H / 2 + .12, .1); }));
    bl.add(mc('twindow5-blind2|' + W, ({ add, tube }) => {
      add(G.box(BW, 1, .012, .004), '#f6d27a', 0, -.5, 0); for (let k = 1; k < 5; k++) add(G.box(BW, .01, .014, .003), '#e9c060', 0, -k * .2, 0);
      add(G.box(BW + .02, .04, .03, .01), '#e3b247', 0, -1, 0); tube([0, -1, .01], [0, -1.08, .02], .006, '#e0d6c0', 4); add(G.tor(.04, .011, PI * 2, 6, 14), '#ffffff', 0, -1.12, .02);
    }));
    bl.scale.y = H * .6;
    const p = f.part('lift', bl, t => { bl.scale.y = Math.max(.05, H * .6 * (1 - .92 * t)); }, { label: '롤 블라인드', sfx: 'swish', dur: .4 });
    if (sill !== 'none') f.spot('inside', null, -.4, sy + .01, sill === 'short' ? .08 : .16, { part: p, maxH: .25, label: '블라인드 뒤 창턱', scale: .75 });
  } else if (!o.noSill && sill !== 'none') f.spot('on', null, o.cup ? -.3 : .25, sy + .01, sill === 'short' ? .08 : .16, { maxH: .25, label: '창턱', scale: .78 });
  if (o.curtain) {
    f.add(mc('twindow5-rod|' + W, ({ add }) => { add(G.cyl(.022, .022, W + .4, 8), C.wood, 0, cy + H / 2 + .16, .2, 0, 0, HP); for (const s of [-1, 1]) add(G.sph(.04, 8, 6), C.wood, s * (W / 2 + .2), cy + H / 2 + .16, .2); }));
    const cs = [-1, 1].map(s => {
      const g = grp(); put(g, s * (W / 2 + .08), cy + H / 2 + .14, .2); f.add(g);
      g.add(mc('twindow5-curtain3|' + s + H, ({ add }) => {
        for (let k = 0; k < 4; k++) add(G.box(.11, H * .78, .05, .03), k % 2 ? S.coral : shade(S.coral, .08), -s * k * .085, -H * .39, (k % 2) * .02);
        add(G.box(.42, .05, .07, .02), PAL.a.line, -s * .13, -H * .5, .03);
        for (let k = 0; k < 4; k++) add(G.sph(.018, 6, 4), '#ffffff', -s * k * .085, -.22 - (k % 2) * .44, .05);
      }));
      return g;
    });
    f.part('curtain', cs, t => { for (const g of cs) g.scale.x = 1 + 1.15 * t; }, { label: '커튼', sfx: 'swish', dur: .35 });
  }
};

// ═════════════════════════ 창 쪽 출입문 + 정리권 발권기 ═════════════════════════
// (wall piece at the far wall, o.dw wide (1.2), local +z into the car): two sliding leaves with their own little windows (the view flows in
// them too — it goes with the leaves), a yellow step line, a grab bar; beside it (o.ticket: +1 / -1 side) the numbered-ticket
// machine on its post (a tap and a ticket slides out) and a stop bell
B.tc5door = (f, T, o = {}) => {
  const C = P(o), DWd = o.dw || 1.2, DH = 2.15, side = o.ticket || 1;
  foldWall(f); f.noSolid = true;
  f.add(mc('tc5-doorframe2|' + o.v + DWd, ({ add, tube }) => {
    add(G.box(DWd + .24, .14, .14, .04), C.glassF, 0, DH + .07, .05);
    for (const s of [-1, 1]) add(G.box(.12, DH, .14, .04), C.glassF, s * (DWd / 2 + .06), DH / 2, .05);
    add(G.box(DWd + .2, .025, .4, .01), S.steel, 0, .013, .2); add(G.box(DWd + .2, .012, .07, .005), S.yellow, 0, .028, .38);
    for (let k = 0; k < 6; k++) add(G.box(DWd + .1, .006, .02, .002), '#9aa3ae', 0, .027, .06 + k * .055);
    for (const s of [-1, 1]) tube([s * (DWd / 2 + .16), .9, .16], [s * (DWd / 2 + .16), 1.7, .16], .022, S.steel, 8);
  }));
  const LW = DWd / 2;
  const leaves = [-1, 1].map(s => {
    const g = grp(); put(g, s * DWd / 4, 0, .04); f.add(g);
    g.add(mc('tc5-leaf2|' + o.v + DWd, ({ add }) => {
      add(G.box(LW - .02, DH - .02, .05, .02), C.door, 0, (DH - .02) / 2, 0);
      add(G.box(LW - .1, .66, .02, .04), PAL.a.line, 0, 1.62, .026); add(G.box(.03, DH - .1, .06, .01), '#4d4958', s * (-LW / 2 + .01), DH / 2, .01);
      add(G.box(LW - .16, .06, .06, .01), C.trim, 0, .95, .01); add(G.box(.04, .3, .04, .01), S.steel, -s * (LW / 2 - .07), 1.0, .04);
      add(G.box(LW - .06, .22, .02, .01), S.steel, 0, .13, .026);
    }));
    return g;
  });
  const ticks = leaves.map(g => flowView(f, LW - .2, .58, 1.62, .04, g));
  f.tick = t => { for (const k of ticks) k(t); };
  f.part('door', leaves, (t, a, b) => { leaves[0].position.x = a.p.x - LW * .75 * t; leaves[1].position.x = b.p.x + LW * .75 * t; }, { label: '출입문', sfx: 'slide', dur: .45 });
  f.spot('on', null, .25, .03, .26, { maxH: .3, label: '출입문 발판', scale: .85 });
  if (o.ticket) {
    const tx = side * (DWd / 2 + .42);
    f.add(mc('tc5-ticketm|' + side, ({ add, tube }) => {
      tube([tx, 0, .2], [tx, 1.0, .2], .03, S.steel2, 8); add(G.box(.3, .34, .22, .05), '#e2e5ea', tx, 1.15, .2); add(G.box(.32, .06, .24, .02), C.trim, tx, 1.34, .2);
      add(G.box(.18, .05, .03, .01), S.dark, tx, 1.06, .32); add(G.cyl(.04, .04, .03, 12), S.red, tx + .08, 1.2, .32, HP, 0, 0);
      add(G.box(.12, .16, .05, .03), S.white, tx, .82, .2); add(G.cyl(.035, .035, .03, 12), S.yellow, tx, .82, .235, HP, 0, 0);
    }));
    const lb = flat(.24, .08, labelTex('ticket', '정리권', PAL.a.body, '#ffffff')); put(lb, tx, 1.24, .312); f.add(lb);
    const tk = grp(); put(tk, tx, 1.06, .31); f.add(tk);
    tk.add(mc('tc5-ticket', ({ add }) => { add(G.box(.1, .006, .06, .002), S.paper, 0, 0, .03); add(G.box(.04, .007, .02, .002), S.red, .02, .001, .04); }));
    f.part('button', tk, (t, b) => { tk.position.z = b.p.z + .07 * t; tk.rotation.x = .3 * t; }, { label: '정리권 발권기', sfx: 'click', dur: .3 });
    f.spot('on', null, tx, 1.375, .2, { maxH: .22, label: '발권기 위', scale: .65 });
  }
};
// a real drawer (사용자 메모 "의자밑 서랍 디테일. 다른 서랍도 있는데 열쇠잠긴거 이것도"): the front with rounded edges, a label card in a brass
// holder, a recessed pull; behind it the box — sides, back, bottom — so an opened drawer is a drawer, not a floating plate
function drawerBox(C, w, h, d, key) {
  return mc('tc5-drawerbox|' + key + [w, h, d].join(','), ({ add }) => {
    add(G.box(w, h, .06, .025), C.up, 0, 0, 0); add(G.box(w - .06, h - .06, .012, .02), shade(C.up, -.04), 0, 0, .03);
    add(G.box(.2, .07, .012, .01), C.trim, 0, h * .18, .038); add(G.box(.15, .04, .008, .006), '#fffaf1', 0, h * .18, .044); add(G.box(.09, .006, .004, .002), '#8b8790', 0, h * .18, .049);
    add(G.box(.22, .035, .04, .012), S.steel, 0, -h * .2, .045); add(G.box(.18, .012, .02, .004), S.steel2, 0, -h * .2 - .02, .03);
    for (const s of [-1, 1]) add(G.box(.025, h - .05, d, .008), C.up2, s * (w / 2 - .02), -.01, -d / 2 - .02);
    add(G.box(w - .02, .02, d, .006), C.up2, 0, -h / 2 + .03, -d / 2 - .02); add(G.box(w - .02, h - .07, .025, .008), C.up2, 0, -.02, -d - .02);
  });
}

// ═════════════════════════ 롱시트 ═════════════════════════
// (len × .62, back at local -z): one long cushion with the moquette, a soft back, the heater grille under it, steel armrests with clear
// panels; o.drawer: a real drawer in the base (padlock); o.stuff: 'paper' (a printed newspaper folded on the seat + cup noodles with
// chopsticks — 사용자 메모 "신문인가.. 디테일") · 'mikan' (net of tangerines + tea) · 'umbrella'; o.noUnder: no spot under it
B.tc5long = (f, T, o = {}) => {
  const C = P(o), L = o.len || 3.2, D = .62, SH = .46;
  f.add(mc('tc5-long3|' + o.v + L, ({ add, tube }) => {
    add(G.box(L - .04, SH - .16, D - .12, .03), C.up2, 0, (SH - .16) / 2, -.04);
    add(G.box(L - .3, .12, .02, .01), '#d9c49c', 0, .15, D / 2 - .09); for (let k = 0; k < 5; k++) add(G.box(L - .36, .01, .012, .003), '#b49b72', 0, .1 + k * .025, D / 2 - .08);
    add(G.box(L, .18, D, .08), C.seat, 0, SH - .06, 0); add(G.box(L, .56, .2, .09), C.seatD, 0, SH + .3, -D / 2 + .1, -.08, 0, 0);
    for (let k = 1; k < Math.round(L / .66); k++) add(G.box(.02, .5, .04, .01), shade(C.seatD, -.08), -L / 2 + k * L / Math.round(L / .66), SH + .3, -D / 2 + .21, -.08, 0, 0);
    add(G.box(L + .02, .03, .03, .01), C.trim, 0, SH + .03, D / 2 - .01);
    for (const s of [-1, 1]) { tube([s * (L / 2 + .02), .02, D / 2 - .06], [s * (L / 2 + .02), SH + .3, D / 2 - .06], .022, S.steel, 8); tube([s * (L / 2 + .02), SH + .3, D / 2 - .06], [s * (L / 2 + .02), SH + .44, -D / 2 + .2], .022, S.steel, 8); add(G.box(.014, .3, D - .3, .006), '#e3eef2', s * (L / 2 + .02), SH + .17, .02); }
  }));
  const mq = moquette(C.seat, C.moq), n = Math.max(2, Math.round(L / .66));
  for (let k = 0; k < n; k++) { const p = flat(L / n - .06, D - .14, mq); put(p, -L / 2 + (k + .5) * L / n, SH + .034, .02, -HP); f.add(p); }
  const st = o.stuff;
  if (st === 'paper') {
    // a newspaper folded in half, its front page up (the print on top), the fold's thickness; the cup noodles beside it, the lid
    // peeled half back, chopsticks across the top
    const np = grp(); put(np, L / 4 - .22, SH + .045, 0, 0, .3, 0); f.add(np);
    np.add(mc('tc5-newsfold', ({ add }) => { add(G.box(.5, .028, .36, .008), '#ece7dc', 0, 0, 0); add(G.cyl(.016, .016, .36, 8), '#e2dccf', -.25, 0, 0, HP, 0, 0); add(G.box(.46, .004, .32, .002), '#d8d2c6', .01, -.012, .01); }));
    const nt = flat(.48, .34, newsTex()); put(nt, 0, .016, 0, -HP); np.add(nt);
    const cn = grp(); put(cn, L / 4 + .28, SH + .035, .06); f.add(cn);
    cn.add(mc('tc5-noodlecup', ({ add, tube }) => {
      add(G.cyl(.09, .07, .15, 18, false), '#ffffff', 0, .075, 0); add(G.cyl(.093, .093, .02, 18), '#f2ede4', 0, .15, 0);
      add(G.box(.13, .006, .13, .004), '#f6d27a', .03, .2, -.04, -1.0, 0, .1); add(G.cyl(.08, .08, .006, 16), '#f3c15a', -.01, .158, .02);
      for (const dz of [-.012, .012]) tube([-.12, .17, dz - .03], [.14, .19, dz + .02], .006, '#d9a86c', 5);
    }));
    const band = mesh(new THREE.CylinderGeometry(.087, .077, .07, 18, 1, true), mat('#ffffff', { map: noodleTex(), rim: 0 }), { cast: false }); band.position.y = .085; cn.add(band);
  } else if (st) f.add(mc('tc5-stuff|' + st, ({ add, tube }) => {
    if (st === 'mikan') {
      for (let k = 0; k < 5; k++) add(G.sph(.065, 10, 8), S.orange, -L / 4 - .1 + (k % 3) * .11, SH + .1 + Math.floor(k / 3) * .09, (k % 2) * .06);
      for (let k = 0; k < 3; k++) add(G.box(.012, .2, .012, .004), S.red, -L / 4 - .1 + k * .1, SH + .14, .1, 0, 0, (k - 1) * .3);
      add(G.cyl(.045, .045, .2, 10), '#bfe6c4', -L / 4 + .3, SH + .13, .08); add(G.cyl(.03, .03, .04, 8), '#3f9e6a', -L / 4 + .3, SH + .25, .08);
    } else if (st === 'umbrella') {
      tube([L / 2 + .02, .05, D / 2 + .04], [L / 2 - .02, .78, D / 2 - .02], .035, '#5f86c4', 8); add(G.tor(.05, .014, PI, 6, 10), '#8a5a34', L / 2 - .05, .82, D / 2 - .02, 0, HP, 0);
    }
  }));
  if (st !== 'paper') f.spot('on', null, L / 4, SH + .04, .05, { maxH: .36, label: '좌석 위', scale: .95 });
  else f.spot('on', null, -L / 4, SH + .04, .05, { maxH: .36, label: '좌석 위', scale: .95 });
  if (!o.noUnder) f.spot('under', null, -L / 3, .01, D / 2 + .06, { maxH: .2, label: '좌석 밑', scale: .85 });
  if (o.drawer) {
    const dv = grp(); put(dv, L / 4, .17, D / 2 - .07); f.add(dv);
    dv.add(drawerBox(C, .78, .2, .42, 'long' + o.v));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .42 * t; }, { label: '좌석 서랍', sfx: 'drawer', dur: .26 });
    p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: .22, y: -.02, z: .07, parent: dv };
    f.spot('inside', dv, 0, -.07, -.2, { part: p, maxH: .16, label: '좌석 서랍 안', scale: .85 });
  }
};

// ═════════════════════════ 박스석 ═════════════════════════
// (one bay by the window, 1.9 along the wall × 1.0 in; local x along the wall, the window at local -z): two benches facing each other
// with tall backs (moquette), a little table under the window; o.drawer: a real drawer under the left bench (padlock);
// o.stuff 'bento' (a station bento, tea, tangerines) · 'cards' (cards and a bag of snacks)
B.tc5box = (f, T, o = {}) => {
  const C = P(o), SH = .46, BW = .95, z0 = -.02;
  f.add(mc('tc5-box3|' + o.v, ({ add }) => {
    for (const s of [-1, 1]) {
      const x = s * .62;
      add(G.box(.5, SH - .14, BW - .1, .03), C.up2, x, (SH - .14) / 2, z0);
      add(G.box(.52, .18, BW, .08), C.seat, x, SH - .06, z0);
      add(G.box(.18, .78, BW, .08), C.seatD, s * .9, SH + .4, z0);
      add(G.box(.04, .6, BW - .2, .02), shade(C.seatD, -.07), s * .81, SH + .4, z0);
      add(G.box(.2, .06, BW + .04, .02), C.wood, s * .9, SH + .82, z0);
      add(G.box(.06, .2, .06, .02), S.steel, s * .9, SH + .9, z0 + BW / 2 - .1);
      add(G.box(.13, .12, .05, .03), '#ffffff', s * .82, SH + .7, z0 + .25);
    }
    add(G.box(.44, .04, .34, .015), C.wood, 0, .74, -BW / 2 + .2); add(G.box(.46, .015, .36, .006), C.woodD, 0, .725, -BW / 2 + .2); add(G.box(.04, .2, .2, .01), S.steel2, 0, .62, -BW / 2 + .1);
  }));
  const mq = moquette(C.seat, C.moq);
  for (const s of [-1, 1]) { const p = flat(.44, BW - .12, mq); put(p, s * .62, SH + .034, z0, -HP); f.add(p); }
  const st = o.stuff;
  if (st) f.add(mc('tc5-boxstuff|' + st, ({ add }) => {
    if (st === 'bento') {
      add(G.box(.2, .06, .14, .02), '#d9b382', -.1, .79, -BW / 2 + .2); add(G.box(.21, .015, .15, .005), S.red, -.1, .82, -BW / 2 + .2);
      add(G.cyl(.032, .032, .12, 10), '#bfe6c4', .15, .82, -BW / 2 + .1);
    } else {
      for (let k = 0; k < 3; k++) add(G.box(.08, .004, .11, .002), ['#ffffff', '#ffd8df', '#dff0ff'][k], -.1 + k * .05, .765 + k * .002, -BW / 2 + .2, 0, k * .4, 0);
      add(G.box(.14, .18, .05, .03), '#ffd23c', .12, .85, -BW / 2 + .16, -.2, 0, 0);
    }
  }));
  f.spot('on', null, st === 'bento' ? .1 : -.1, .76, -BW / 2 + .28, { maxH: .26, label: '창가 탁자 위', scale: .8 });
  f.spot('under', null, 0, .01, z0 + .25, { maxH: .3, label: '좌석 밑', scale: .85 });
  if (o.drawer) {
    const dv = grp(); put(dv, -.62, .17, z0 + BW / 2 - .02); f.add(dv);
    dv.add(drawerBox(C, .44, .2, .5, 'box' + o.v));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .4 * t; }, { label: '좌석 서랍', sfx: 'drawer', dur: .26 });
    p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: .13, y: -.02, z: .07, parent: dv };
    f.spot('inside', dv, 0, -.07, -.22, { part: p, maxH: .16, label: '좌석 서랍 안', scale: .8 });
  }
  f.spot('on', null, .6, SH + .04, z0 + .05, { maxH: .36, label: '좌석 위', scale: .95 });
};

// ═════════════════════════ 짐 선반 ═════════════════════════
// (wall piece along the far wall, local x along it): short brackets just over the windows (o.ry, 2.44), a front bar and slats; the big
// suitcase (o.case: its x — corner guards, wheels, a pull handle, a tag, stickers) comes forward off the rack (lockable — 너굴이 hides
// behind it, "…선반 위는 반칙"), a backpack (o.pack: its x — pockets, a bottle, a charm) lifts, a duffel bag (o.duffel: its x);
// o.straps: the grab rail with leather straps and rings, and hanging posters (o.hang: their x, printed on both faces);
// o.noCase: no suitcase (a second rack). (사용자 메모 10/24 "가방, 모자 오브젝트 디테일", "손잡이와 광고 디테일")
B.tc5rack = (f, T, o = {}) => {
  const C = P(o), L = o.len || 3.6, RY = o.ry ?? 2.44, cx = o.case ?? -L / 4, BR = o.brackets || [-L / 2 + .1, 0, L / 2 - .1];
  f.noSolid = true; f.collideBox = [-L / 2, RY - .05, 0, L / 2, RY + .6, .62]; foldWall(f);
  f.add(mc('tc5-rack3|' + [o.v, L, RY, o.straps ? 1 : 0, o.duffel ?? 'n', BR.join(':'), (o.hang || []).join(':')].join(','), ({ add, tube }) => {
    for (const x of BR) { add(G.box(.05, .05, .58, .012), S.steel, x, RY, .3); tube([x, RY - .1, .02], [x, RY, .4], .018, S.steel, 6); add(G.box(.08, .14, .03, .01), S.steel2, x, RY - .06, .015); }
    add(G.box(L, .035, .035, .01), S.steel, 0, RY, .58); add(G.box(L, .03, .03, .01), S.steel, 0, RY + .1, .6);
    for (let k = 0; k < 6; k++) add(G.box(L - .05, .018, .04, .004), S.steel2, 0, RY - .01, .1 + k * .09);
    if (o.duffel != null) {
      const d = o.duffel;
      add(G.cyl(.17, .17, .62, 16), C.low, d, RY + .18, .3, 0, 0, HP); for (const dx of [-.22, .22]) add(G.cyl(.175, .175, .05, 16), C.bodyD, d + dx, RY + .18, .3, 0, 0, HP);
      add(G.box(.5, .02, .02, .005), S.steel2, d, RY + .345, .3); add(G.box(.04, .03, .02, .005), S.yellow, d + .2, RY + .35, .31);
      for (const z of [.22, .38]) { tube([d - .1, RY + .3, z], [d - .07, RY + .42, z], .015, C.bodyD, 6); tube([d - .07, RY + .42, z], [d + .07, RY + .42, z], .015, C.bodyD, 6); tube([d + .07, RY + .42, z], [d + .1, RY + .3, z], .015, C.bodyD, 6); }
      tube([d - .3, RY + .2, .45], [d, RY + .02, .55], .012, '#4d4958', 5); tube([d, RY + .02, .55], [d + .3, RY + .2, .45], .012, '#4d4958', 5);
    }
    if (o.straps) {
      tube([-L / 2, RY + .16, .95], [L / 2, RY + .16, .95], .03, S.steel, 10); for (const x of [-L / 2 + .2, L / 2 - .2]) tube([x, RY + .16, .95], [x, RY + .16, .5], .02, S.steel2, 6);
      for (let x = -L / 2 + .3; x < L / 2 - .2; x += .45) {
        if ((o.hang || []).some(h => Math.abs(h - x) < .32)) continue;
        // a leather strap looped over the rail (its loop, two rivets), a soft white ring with a grip band
        add(G.tor(.04, .012, PI * 2, 5, 12), '#6b4a3a', x, RY + .16, .95, 0, HP, 0); add(G.box(.036, .26, .014, .006), '#7a5442', x, RY - .02, .95);
        for (const dy of [.05, -.09]) add(G.sph(.008, 5, 4), '#d9b382', x, RY + dy, .958);
        add(G.box(.05, .05, .03, .01), '#5c3f31', x, RY - .16, .95); add(G.tor(.068, .02, PI * 2, 8, 18), S.white, x, RY - .25, .95); add(G.tor(.069, .023, PI * .5, 8, 8), '#f2963a', x, RY - .25, .95, 0, 0, -PI * .75);
      }
    }
  }));
  // hanging posters from the grab rail: a clip bar, two hooks, the print on both faces (each face its own plane, so neither reads backwards)
  for (const [k, hx] of (o.hang || []).entries()) {
    f.add(put(mc('tc5-hangclip2', ({ add, tube }) => { add(G.box(.5, .035, .03, .01), S.steel2, 0, 0, 0); for (const s of [-1, 1]) tube([s * .2, .02, 0], [s * .18, .17, 0], .008, S.steel2, 4); add(G.box(.5, .035, .03, .01), S.steel2, 0, -.36, 0); }), hx, RY - .02, .95));
    for (const face of [0, 1]) { const pp = flat(.46, .34, posterTex(k + 2 + face)); put(pp, hx, RY - .2, .95 + (face ? -.006 : .006), 0, face ? PI : 0); f.add(pp); }
  }
  if (o.noCase) { f.spot('on', null, o.duffel != null ? o.duffel + .7 : 0, RY + .02, .3, { maxH: .3, label: '짐 선반 위', scale: .85 }); return; }
  const sc = grp(); put(sc, cx, RY + .02, .32); f.add(sc);
  sc.add(mc('tc5-suitcase3', ({ add, tube }) => {
    add(G.box(.64, .44, .36, .07), S.coral, 0, .22, 0); for (const x of [-.18, .18]) add(G.box(.04, .44, .38, .01), S.coral2, x, .22, 0);
    for (const sx of [-1, 1]) for (const sy of [0, 1]) add(G.box(.08, .08, .38, .03), '#9e4f45', sx * .29, .04 + sy * .36, 0);
    for (const sx of [-1, 1]) add(G.cyl(.035, .035, .03, 10), S.dark, sx * .24, -.005, .13, HP, 0, 0);
    tube([-.1, .45, 0], [-.08, .53, 0], .016, S.dark, 6); tube([-.08, .53, 0], [.08, .53, 0], .018, S.dark, 6); tube([.08, .53, 0], [.1, .45, 0], .016, S.dark, 6);
    for (const sx of [-1, 1]) add(G.box(.02, .1, .02, .005), S.steel2, sx * .1, .48, -.12);
    add(G.box(.14, .1, .01, .03), S.yellow, -.12, .3, .185); add(G.cyl(.05, .05, .01, 12), '#8fd3f4', .14, .14, .186, HP, 0, 0); add(G.box(.1, .06, .01, .02), '#ffffff', .08, .32, .186);
    add(G.sph(.04, 8, 6), '#ff9fb8', .2, .3, .185, 0, 0, 0, [1, 1, .2]);
    tube([-.26, .44, .1], [-.3, .3, .2], .006, '#e0d6c0', 4); add(G.box(.08, .05, .008, .01), '#fff3c8', -.3, .27, .21, 0, 0, .3);
  }));
  const p = f.part('lift', sc, (t, b) => { sc.position.z = b.p.z + .34 * t; sc.position.y = b.p.y + .05 * Math.sin(t * PI); sc.rotation.x = .3 * t; }, { label: '짐 선반 여행 가방', sfx: 'lift_fabric', dur: .45 });
  p.lockable = true; p.lockAt = { x: 0, y: .22, z: .2, parent: sc };
  f.spot('on', null, cx, RY + .02, .24, { part: p, maxH: .45, label: '여행 가방 뒤', scale: .95 });
  if (o.pack != null) {
    const bp = grp(); put(bp, o.pack, RY + .01, .3); f.add(bp);
    bp.add(mc('tc5-backpack2', ({ add, tube }) => {
      add(G.box(.38, .42, .26, .12), S.blue, 0, .21, 0); add(G.box(.3, .18, .09, .05), S.yellow, 0, .14, .14); add(G.box(.22, .012, .01, .004), PAL.a.line, 0, .21, .186);
      add(G.box(.2, .1, .06, .03), '#4a6fb0', 0, .36, .12); for (const sx of [-1, 1]) { add(G.box(.06, .16, .1, .03), '#4a6fb0', sx * .2, .14, .02); }
      add(G.cyl(.03, .03, .14, 8), '#bfe6c4', .21, .22, .03); add(G.cyl(.02, .02, .03, 8), '#3f9e6a', .21, .3, .03);
      tube([-.08, .42, -.02], [0, .5, -.02], .014, S.dark, 5); tube([0, .5, -.02], [.08, .42, -.02], .014, S.dark, 5);
      tube([.05, .3, .15], [.08, .22, .19], .005, S.steel2, 4); add(G.sph(.03, 8, 6), '#ff9fb8', .08, .2, .2);
    }));
    const q = f.part('lift', bp, (t, b) => { bp.position.z = b.p.z + .3 * t; bp.rotation.z = .25 * t; }, { label: '배낭', sfx: 'lift_fabric', dur: .35 });
    f.spot('on', null, o.pack, RY + .02, .18, { part: q, maxH: .32, label: '배낭 뒤', scale: .85 });
  } else f.spot('on', null, cx + .9, RY + .02, .3, { maxH: .3, label: '짐 선반 위', scale: .85 });
};

// ═════════════════════════ 세로 손잡이 봉 + 하차 벨 ═════════════════════════
B.tc5pole = (f, T, o = {}) => {
  f.add(mc('tc5-pole', ({ add, tube }) => {
    tube([0, 0, 0], [0, 2.46, 0], .028, S.steel, 10); add(G.cyl(.06, .07, .03, 12), S.steel2, 0, .015, 0);
    add(G.box(.1, .14, .07, .03), S.white, 0, 1.25, .04);
  }));
  const bt = grp(); put(bt, 0, 1.25, .085); f.add(bt);
  bt.add(mc('tc5-bellbtn', ({ add }) => { add(G.cyl(.032, .032, .03, 12), S.yellow, 0, 0, 0, HP, 0, 0); }));
  f.part('button', bt, (t, b) => { bt.position.z = b.p.z - .015 * Math.sin(t * PI); }, { label: '하차 벨', sfx: 'stationChime', dur: .3 });
};

// ═════════════════════════ 칸 끝벽 ═════════════════════════
// (across one car's end, local x across the car, o.dir = which way the car's inside is along local z): o.kind
//   'door'  a tall column by the window wall (the car's sign, a fire box), low wall on the near side, the gangway doorway; its sliding
//           door (rubber edges, a big rounded window, a kick plate, '2호차') stands parked open in the pocket wall on the far side
//           (사용자 메모 10/24 "몽글이 문 뚫린다. 문도 퀄 높혀줘": a closed door across the walk was walked through) — o.closed keeps the old
//           closing door (lockable, code) for the preview maps
//   'arch'  the same without the door; o.ticket: the numbered-ticket machine on the column, by the side door
//   'rear'  a low end
//   'cab'   the driver's cab, o.depth deep (사용자 메모 "기관실 좁아. 앞쪽 왤케 그리다 말았어"): the partition (glazed over the far half, low
//           on the near half with the fare box), the route map and destination board over its door (a part); behind it a rubber floor,
//           the console with three gauges, a screen, button rows, the controller and the brake, a microphone, the timetable and the
//           driver's cap, a padded seat on its post, an extinguisher; the nose — a lower panel, the big front windows on thick posts,
//           a header, sun visors and wipers
//   'deck'  the tail's open view deck: a low rail, a lamp and a little flag
const DW = .6;
B.tc5end = (f, T, o = {}) => {
  const C = P(o), W = o.w || 4, X0 = -W / 2, kind = o.kind || 'arch', inC = o.dir === -1 ? -1 : 1, out = -inC;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  if (kind === 'deck') {
    f.add(mc('tc5-deck2|' + o.v + W, ({ add, tube }) => {
      tube([X0 + .1, .95, 0], [W / 2 - .1, .95, 0], .035, C.trim, 10); tube([X0 + .1, .5, 0], [W / 2 - .1, .5, 0], .025, C.trim, 8);
      for (let x = X0 + .1; x <= W / 2; x += .45) tube([x, 0, 0], [x, .95, 0], .025, C.bodyD, 6);
      add(G.box(W + .2, .08, .5, .02), C.body, 0, -.02, out * .2);
      tube([X0 + .3, .95, 0], [X0 + .3, 1.35, 0], .025, S.steel2, 6); add(G.box(.16, .2, .16, .04), S.dark, X0 + .3, 1.45, 0); add(G.cyl(.05, .05, .02, 12), S.red, X0 + .3, 1.45, out * .085, HP, 0, 0);
      tube([W / 2 - .4, .95, 0], [W / 2 - .4, 1.5, 0], .015, C.wood, 6); add(G.box(.01, .16, .26, .004), S.yellow, W / 2 - .4, 1.42, out * .13);
    }));
    if (o.spot !== false) f.spot('on', null, X0 + .7, .02, inC * .25, { maxH: .3, label: '꼬리 난간', scale: .8 });
    return;
  }
  const cab = kind === 'cab', parked = kind === 'door' && !o.closed, D = o.depth || .97;
  const tall = cab ? 1.15 : kind === 'rear' ? 1.0 : parked ? 2.2 : .62;
  f.walkBoxes = cab ? [[X0, 0, -.07, W / 2, 2.6, .07]] : [[X0, 0, Math.min(-.07, inC * .15), -DW - .05, 2.6, Math.max(.07, inC * .15)], [DW + .05, 0, -.07, W / 2, .6, .07]];
  if (cab) f.walkBoxes.push([DW + .17, 0, Math.min(inC * .09, inC * .39), DW + .53, 1.5, Math.max(inC * .09, inC * .39)]);
  f.add(mc('tc5-end3|' + [o.v, W, kind, D, parked ? 1 : 0].join(','), ({ add, tube }) => {
    add(G.box(-DW - X0, tall, .14, .03), C.up, (X0 - DW) / 2, tall / 2, 0); add(G.box(-DW - X0 + .04, .05, .18, .02), C.trim, (X0 - DW) / 2, tall + .02, 0);
    const nh = cab ? 1.15 : Math.min(tall, .62);
    add(G.box(W / 2 - DW, nh, .14, .03), C.up, (W / 2 + DW) / 2, nh / 2, 0); add(G.box(W / 2 - DW + .04, .05, .18, .02), C.trim, (W / 2 + DW) / 2, nh + .02, 0);
    add(G.box(.7, WH - .1, .16, .03), C.up, X0 + .35, (WH - .1) / 2, 0); add(G.box(.74, .06, .2, .02), C.trim, X0 + .37, WH - .08, 0);
    if (kind !== 'rear') { for (const s of [-1, 1]) add(G.box(.08, 2.05, .2, .02), S.steel, s * (DW + .02), 1.02, 0); add(G.box(DW * 2 + .2, .08, .2, .02), S.steel, 0, 2.07, 0); add(G.box(DW * 2, .015, .22, .005), S.yellow, 0, .008, 0); }
    else add(G.box(DW * 2, .62, .14, .03), C.up, 0, .31, 0);
    if (kind === 'door' || kind === 'arch') { add(G.box(.42, .5, .1, .03), S.red, X0 + .35, .55, inC * .1); add(G.box(.3, .36, .01, .02), '#ffffff', X0 + .35, .58, inC * .155); add(G.cyl(.06, .06, .3, 10), S.red, X0 + .35, .5, inC * .2); }
    if (kind === 'arch' && o.ticket) {
      // the numbered-ticket machine on the column, facing into the car
      add(G.box(.3, .34, .2, .05), '#e2e5ea', X0 + .4, 1.2, inC * .17); add(G.box(.32, .06, .22, .02), C.trim, X0 + .4, 1.39, inC * .17);
      add(G.box(.18, .05, .03, .01), S.dark, X0 + .4, 1.1, inC * .28); add(G.cyl(.04, .04, .03, 12), S.red, X0 + .48, 1.24, inC * .28, HP, 0, 0);
      add(G.box(.1, .006, .06, .002), S.paper, X0 + .4, 1.085, inC * .3); add(G.box(.12, .16, .05, .03), S.white, X0 + .4, .82, inC * .1); add(G.cyl(.035, .035, .03, 12), S.yellow, X0 + .4, .82, inC * .135, HP, 0, 0);
    }
    if (cab) {
      const zc = out * D;
      // the partition: waist high all across (so the cab shows over it), a frame of two posts and a top beam that carries the boards,
      // the fare box by the gate
      add(G.box(W, .1, .18, .03), C.glassF, 0, 2.7, 0); for (const x of [X0 + .78, W / 2 - .06]) add(G.box(.1, 1.6, .14, .03), C.glassF, x, 1.9, 0);
      add(G.box(.36, .5, .3, .05), S.dark, DW + .35, 1.25, inC * .24); add(G.box(.3, .06, .24, .02), '#8fd3f4', DW + .35, 1.52, inC * .24); add(G.box(.12, .02, .04, .005), '#ffd37a', DW + .35, 1.4, inC * .4);
      // the cab floor (the tiles under it are cut away: nobody walks in) — a ribbed rubber plate
      add(G.box(W - .1, .05, D - .1, .02), '#5b5868', 0, -.02, out * D / 2); for (let k = 0; k < 8; k++) add(G.box(W - .2, .01, .03, .004), '#6c6878', 0, .01, out * (.15 + k * (D - .3) / 7));
      // the nose: lower panel, the window band on thick posts, a header, sun visors, wipers
      add(G.box(W, 1.0, .14, .03), C.up, 0, .5, zc - out * .07); add(G.box(W + .04, .06, .18, .02), C.trim, 0, 1.0, zc - out * .07);
      add(G.box(W, .5, .05, .02), C.low, 0, .45, zc - out * .16);
      for (const x of [X0 + .1, 0, W / 2 - .1]) add(G.box(x === 0 ? .14 : .2, WH - 1.0, .16, .04), C.glassF, x, (WH + 1.0) / 2, zc - out * .07);
      add(G.box(W, .18, .18, .04), C.glassF, 0, WH - .06, zc - out * .07); add(G.box(W - .3, .07, .2, .02), C.bodyD, 0, WH - .2, zc - out * .1);
      for (const x of [-1.0, 1.0]) { add(G.box(.7, .05, .32, .02), '#4d6b5f', x, 2.48, zc - out * .25, out * .5, 0, 0); }
      for (const x of [-.95, .95]) { tube([x, 1.08, zc - out * .17], [x + (x < 0 ? .5 : -.5), 1.6, zc - out * .17], .014, S.dark, 5); add(G.sph(.03, 6, 4), S.dark, x, 1.08, zc - out * .17); }
      // the console across the front: a sloped desk, its lighter top
      const cz = zc - out * .45;
      add(G.box(W - .3, .82, .56, .06), C.bodyD, 0, .41, cz); add(G.box(W - .34, .06, .6, .03), '#5a5f6e', 0, .85, cz + out * .02, out * .28, 0, 0);
      add(G.box(W - .5, .3, .06, .03), '#4b5160', 0, 1.04, cz - out * .22);
      // buttons, the screen frame, the controller (left) and the brake (right), a microphone, the timetable board, the driver's cap
      for (let k = 0; k < 6; k++) add(G.cyl(.028, .028, .025, 10), ['#e5554b', '#6cc46a', '#f6cf5a', '#5f86c4', '#ffffff', '#e5554b'][k], .5 + (k % 3) * .1, .9, cz + out * (k < 3 ? .05 : -.07), out * .28 - HP, 0, 0);
      add(G.box(.42, .26, .04, .02), S.dark, -.15, 1.06, cz - out * .19);
      add(G.box(.12, .08, .2, .03), S.dark, -1.15, .92, cz + out * .1); add(G.box(.05, .3, .05, .01), '#2d2a33', -1.15, 1.05, cz + out * .1, out * .3, 0, 0); add(G.sph(.055, 10, 8), S.dark, -1.15, 1.2, cz + out * .05);
      add(G.box(.12, .08, .2, .03), S.dark, 1.15, .92, cz + out * .1); add(G.box(.05, .26, .05, .01), '#2d2a33', 1.15, 1.03, cz + out * .1, -out * .3, 0, 0); add(G.sph(.05, 10, 8), S.red, 1.15, 1.16, cz + out * .15);
      tube([.95, .9, cz + out * .1], [.85, 1.15, cz + out * .05], .01, S.dark, 5); add(G.cyl(.025, .03, .06, 8), S.dark, .83, 1.18, cz + out * .05);
      add(G.box(.26, .34, .02, .01), '#d9b382', 1.55, 1.1, zc - out * .15); add(G.box(.22, .26, .006, .004), S.paper, 1.55, 1.08, zc - out * .165); add(G.box(.08, .03, .02, .005), S.steel, 1.55, 1.26, zc - out * .17);
      add(G.cyl(.11, .12, .08, 16), '#34466b', .35, .92, cz + out * .12); add(G.cyl(.13, .13, .012, 16), '#26354f', .35, .885, cz + out * .18); add(G.box(.06, .04, .01, .01), C.trim, .35, .93, cz + out * .23);
      // the driver's seat on its post, an extinguisher in the corner
      // (a shallow cab — the preview maps' — has no room for the seat: only the console)
      const sz = zc - out * 1.05;
      if (D >= 1.4) {
        add(G.cyl(.05, .07, .42, 10), S.steel2, -.3, .21, sz); add(G.cyl(.22, .22, .03, 14), S.steel2, -.3, .02, sz);
        add(G.box(.55, .12, .52, .06), '#34466b', -.3, .5, sz); add(G.box(.55, .6, .12, .06), '#34466b', -.3, .84, sz + inC * .25); add(G.box(.32, .18, .1, .05), '#3f5580', -.3, 1.22, sz + inC * .26);
        for (const s of [-1, 1]) add(G.box(.06, .06, .36, .02), '#26354f', -.3 + s * .3, .66, sz);
      }
      add(G.cyl(.08, .08, .34, 12), S.red, 1.65, .2, out * .3); add(G.box(.1, .06, .06, .02), S.dark, 1.65, .4, out * .3);
    }
    if (parked) {
      // the pocket wall's face and its edge strip, where the door slides away
      add(G.box(.06, 2.2, .18, .02), S.steel, -DW - .1, 1.1, 0);
    }
  }));
  if (cab) {
    const zc = out * D;
    // the big front windows: a still view of hills and sky (the land comes at them, not past)
    const F = viewTex();
    for (const s of [-1, 1]) {
      const cw = W / 2 - .2, sky = mesh(new THREE.PlaneGeometry(cw, WH - 1.25), new THREE.MeshBasicMaterial({ map: F.sky }), { cast: false }); sky.material.toneMapped = false;
      put(sky, s * (W / 4 + .02), (WH + 1.0) / 2 - .06, zc - out * .02, 0, inC < 0 ? PI : 0); f.add(sky);
      const far = F.far.clone(); far.repeat.set(cw / 9, 1); far.offset.x = s * .3; far.needsUpdate = true;
      const fm = new THREE.MeshBasicMaterial({ map: far, transparent: true, depthWrite: false }); fm.toneMapped = false;
      const fp = mesh(new THREE.PlaneGeometry(cw, WH - 1.25), fm, { cast: false }); put(fp, s * (W / 4 + .02), (WH + 1.0) / 2 - .06, zc - out * .025, 0, inC < 0 ? PI : 0); fp.layers.set(2); fp.userData.noOcclude = true; f.add(fp);
    }
    const cz = zc - out * .45;
    for (const [k, x, r] of [[0, -.75, .09], [1, -.5, .09], [0, .05, .12]]) { const d = mesh(new THREE.CircleGeometry(r, 22), mat('#ffffff', { map: dialTex(k), rim: 0 }), { cast: false }); d.position.set(x, 1.04 + (r > .1 ? .02 : 0), cz - out * .185); d.rotation.y = inC < 0 ? PI : 0; f.add(d); }
    const scr = mesh(new THREE.PlaneGeometry(.36, .2), new THREE.MeshBasicMaterial({ map: TX.get('tc5-screen', () => canvasTex(128, 72, (c, Wd, H) => { c.fillStyle = '#1d3b5a'; c.fillRect(0, 0, Wd, H); c.strokeStyle = '#5fd3ff'; c.lineWidth = 2; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(8, 12 + k * 12); c.lineTo(8 + 20 + (k * 37) % 90, 12 + k * 12); c.stroke(); } c.fillStyle = '#ffd37a'; c.fillRect(Wd - 30, 10, 20, 20); })) }), { cast: false });
    scr.material.toneMapped = false; put(scr, -.15, 1.06, cz - out * .215, 0, inC < 0 ? PI : 0); f.add(scr);
    const rm = flat(1.7, .36, routeTex()); put(rm, .55, 2.36, inC * .08, 0, inC < 0 ? PI : 0); f.add(rm);
    const ld = flat(1.0, .19, ledTex()); put(ld, -.9, 2.84, inC * .1, 0, inC < 0 ? PI : 0); f.add(ld);
    f.spot('on', null, DW + .35, 1.55, inC * .24, { maxH: .22, label: '운임함 위', scale: .65 });
  }
  if (cab || (kind === 'door' && o.closed)) {
    const dv = grp(); put(dv, 0, 0, inC * .09); f.add(dv);
    dv.add(doorLeaf(C, inC, cab));
    const p = f.part('door', dv, (t, b) => { dv.position.x = b.p.x - 1.06 * t; }, { label: cab ? '운전실 문' : '연결 통로 문', sfx: 'slide', dur: .4 });
    if (!cab) { p.lockable = true; p.lockKind = 'code'; p.lockAt = { x: .34, y: 1.0, z: inC * .05, parent: dv }; }
    const zc = out * D;
    const seatOK = D >= 1.4;
    f.spot('inside', null, cab ? -.3 : .05, cab ? (seatOK ? .56 : .9) : .02, cab ? (seatOK ? zc - out * 1.05 : zc - out * .45) : out * .5, { part: p, maxH: cab ? .3 : .62, label: cab ? '운전석 위' : '연결 통로 안', scale: cab ? .8 : 1 });
    if (cab) { f.spot('on', null, .7, .92, zc - out * .45 + out * .05, { maxH: .22, label: '운전대 위', scale: .7 }); f.spot('on', null, .12, .92, zc - out * .45 + out * .12, { maxH: .22, label: '기관사 모자 옆', scale: .65 }); }
  } else if (parked) {
    const dv = grp(); put(dv, -1.25, 0, inC * .1); f.add(dv); dv.add(doorLeaf(C, inC, false));
    f.spot('on', null, .4, .02, out * .42, { maxH: .5, label: '연결 통로 구석', scale: .9 });
  }
  if (o.sign) { const sg = flat(.56, .18, labelTex('car' + o.sign, o.sign === 2 ? '2호차' : '1호차', PAL.a.bodyD, '#ffffff', 256, 80)); put(sg, X0 + .35, 2.3, inC * .085, 0, inC < 0 ? PI : 0); f.add(sg); }
};
// a sliding door leaf: rubber edges, a big window with rounded corners and a cream rim, a recessed pull, a steel kick plate,
// a '2호차' sticker (cab doors: a smaller window)
function doorLeaf(C, inC, cab) {
  // (the cab's is a waist-high gate: a padded top rail, a little 운전실 plate)
  if (cab) return mc('tc5-cabgate|' + [inC, C.door].join(','), ({ add }) => {
    add(G.box(1.16, 1.0, .06, .03), C.door, 0, .55, 0); add(G.box(1.2, .07, .09, .03), S.steel, 0, 1.08, 0);
    for (const s of [-1, 1]) add(G.box(.04, 1.0, .07, .012), '#4d4958', s * .58, .55, 0);
    add(G.box(.5, .3, .02, .04), PAL.a.line, 0, .72, inC * .032); add(G.box(.44, .24, .02, .03), '#cfe9f5', 0, .72, inC * .04);
    add(G.box(.035, .2, .02, .01), S.steel, .46, .7, inC * .04); add(G.box(1.1, .16, .02, .01), S.steel, 0, .1, inC * .032);
  });
  return mc('tc5-doorleaf|' + [inC, cab ? 1 : 0, C.door].join(','), ({ add }) => {
    add(G.box(1.18, 2.0, .06, .03), C.door, 0, 1.0, 0);
    for (const s of [-1, 1]) add(G.box(.04, 2.0, .07, .012), '#4d4958', s * .6, 1.0, 0);
    const wh = cab ? .5 : .72, wy = cab ? 1.5 : 1.42;
    add(G.box(.62, wh + .1, .02, .05), PAL.a.line, 0, wy, inC * .032); add(G.box(.54, wh, .02, .05), '#cfe9f5', 0, wy, inC * .04); add(G.box(.06, wh * .8, .004, .003), '#ffffff', -.16, wy + .04, inC * .052, 0, 0, .4);
    add(G.box(.06, .3, .03, .015), '#3f3b49', .46, 1.0, inC * .03); add(G.box(.035, .24, .02, .01), S.steel, .46, 1.0, inC * .04);
    add(G.box(1.1, .2, .02, .01), S.steel, 0, .12, inC * .032); add(G.box(.28, .08, .012, .02), C.trim, 0, .66, inC * .034);
  });
}

// ═════════════════════════ 연결 통로 ═════════════════════════
// (the walk between the cars, its middle at the gap's middle; o.len along z, o.dx: how far the second car sits over to +x): steel
// threshold plates with yellow edges at both ends, a ribbed tread plate with its hinge line, rubber bellows in rounded folds — the far
// side tall with a top cover and a handrail, the near side low; little signs (← 1호차 · 2호차 →); the near bellows "출렁": a tap and its
// halves bulge apart, something hides between them; o.umbrella a red umbrella left in the corner (사용자 메모 "복도 디테일 잡아줘!!!!")
B.tc5gang = (f, T, o = {}) => {
  const L = o.len || 1, dx = o.dx || 0, HW = o.hw || .9, xc = z => dx * z / L, sk = Math.atan2(dx, L);
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  if (!dx) f.walkBoxes = [[-HW - .2, 0, -L / 2, -HW - .02, 2.4, L / 2]];
  const sh = new THREE.Shape(); sh.moveTo(xc(-L / 2) - HW, L / 2); sh.lineTo(xc(-L / 2) + HW, L / 2); sh.lineTo(xc(L / 2) + HW, -L / 2); sh.lineTo(xc(L / 2) - HW, -L / 2); sh.lineTo(xc(-L / 2) - HW, L / 2);
  const pg = new THREE.ShapeGeometry(sh); pg.rotateX(-HP);
  const tx = tread().clone(); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(HW, L / 2); tx.needsUpdate = true;
  const pm = mesh(pg, mat('#ffffff', { map: tx, rim: 0 }), { cast: false }); pm.position.y = .014; f.add(pm);
  const RB = '#8d8a9c', RB2 = '#a6a3b5', RBd = '#6f6b80';
  f.add(mc('tc5-gang3|' + [L, dx, HW, o.umbrella ? 1 : 0].join(','), ({ add, tube }) => {
    add(G.box(2 * HW + Math.abs(dx) + .2, .5, L + .1, .05), '#3c3a46', 0, -.32, 0);
    for (const z of [-L / 2 + .06, L / 2 - .06]) { add(G.box(2 * HW, .03, .14, .01), S.steel, xc(z), .016, z); add(G.box(2 * HW, .012, .04, .004), S.yellow, xc(z), .034, z + (z < 0 ? -.05 : .05)); }
    add(G.box(2 * HW - .1, .008, .02, .004), '#8f98a6', xc(0), .02, 0);
    // the far bellows: round folds (a cylinder each, side by side), a dark top cover, a handrail on brackets
    const n = Math.max(5, Math.round(L / .12));
    for (let k = 0; k < n; k++) { const z = -L / 2 + (k + .5) * L / n, x = xc(z) - HW - .08; add(G.box(.1, 2.28, L / n * .7, .03), k % 2 ? RB : RB2, x - (k % 2 ? .02 : 0), 1.14, z, 0, sk, 0); add(G.cyl(L / n * .32, L / n * .32, 2.28, 8), k % 2 ? RBd : RB, x + .04, 1.14, z); }
    add(G.box(.3, .12, L / Math.cos(sk) + .08, .04), S.dark, xc(0) - HW - .08, 2.34, 0, 0, sk, 0); add(G.box(.32, .03, L / Math.cos(sk) + .1, .01), S.steel2, xc(0) - HW - .08, 2.4, 0, 0, sk, 0);
    tube([xc(-L / 2 + .1) - HW + .05, .95, -L / 2 + .1], [xc(L / 2 - .1) - HW + .05, .95, L / 2 - .1], .026, S.steel, 8);
    for (const z of [-L / 2 + .12, L / 2 - .12]) tube([xc(z) - HW + .05, .95, z], [xc(z) - HW - .04, .95, z], .02, S.steel2, 6);
    if (o.umbrella) { tube([xc(0) - HW + .24, .02, -L / 2 + .22], [xc(0) - HW + .12, .9, -L / 2 + .16], .03, '#e8574a', 8); add(G.tor(.05, .014, PI, 6, 10), '#8a5a34', xc(0) - HW + .14, .94, -L / 2 + .16, 0, HP, 0); add(G.cone(.07, .3, 8), '#d9473c', xc(0) - HW + .22, .2, -L / 2 + .21, .14, 0, 0); }
  }));
  for (const [k, z] of [[0, -L / 2 + .3], [1, L / 2 - .3]]) { const sg = flat(.42, .13, gangSignTex(k)); put(sg, xc(z) - HW + .02, 1.55, z, 0, HP); f.add(sg); }
  const halves = [-1, 1].map(sd => {
    const g = grp(); put(g, xc(sd * L / 4) + HW + .07, 0, sd * L / 4); g.rotation.y = sk; f.add(g);
    g.add(mc('tc5-bellow3|' + L, ({ add }) => {
      const m = Math.max(3, Math.round(L / 2 / .11));
      for (let k = 0; k < m; k++) { const z = -L / 4 + (k + .5) * L / 2 / m; add(G.box(.12, 1.18, L / 2 / m * .7, .03), k % 2 ? RB : RB2, (k % 2 ? .02 : 0), .59, z); add(G.cyl(L / 2 / m * .32, L / 2 / m * .32, 1.18, 8), k % 2 ? RBd : RB, -.04, .59, z); }
      add(G.box(.26, .1, L / 2, .04), S.dark, 0, 1.24, 0);
    }));
    return g;
  });
  const bp = f.part('lift', halves, (t, a, b) => {
    const w = Math.sin(t * PI) * .06;
    halves[0].position.z = a.p.z - .22 * t; halves[1].position.z = b.p.z + .22 * t;
    for (const g of halves) { g.scale.x = 1 + .5 * t + w * 4; g.rotation.z = -.12 * t - w; }
  }, { label: '고무 주름막', sfx: 'rustle', dur: .45 });
  f.spot('inside', null, xc(0) + HW + .02, .02, 0, { part: bp, maxH: .5, label: '주름막 사이', scale: .9 });
};

// ═════════════════════════ 꼬리 전망석 ═════════════════════════
// (o.w × .8, facing +z — out over the tail rail): a wide low sofa (moquette), arm rests, a cushion
B.tc5view = (f, T, o = {}) => {
  const C = P(o), W = o.w || 2.6, SH = .44;
  f.add(mc('tc5-view2|' + o.v + W, ({ add }) => {
    add(G.box(W, SH - .12, .7, .06), C.up2, 0, (SH - .12) / 2, 0); add(G.box(W, .18, .74, .09), C.seat, 0, SH - .04, 0);
    add(G.box(W, .5, .2, .09), C.seatD, 0, SH + .3, -.3, -.12, 0, 0);
    for (const s of [-1, 1]) add(G.box(.18, .32, .74, .08), C.seatD, s * (W / 2 - .09), SH + .1, 0);
    add(G.box(.36, .3, .12, .1), S.yellow, W / 2 - .45, SH + .22, -.18, -.25, 0, 0);
  }));
  const p = flat(W - .4, .6, moquette(C.seat, C.moq)); put(p, 0, SH + .056, .02, -HP); f.add(p);
  f.spot('on', null, -.3, SH + .06, .05, { maxH: .34, label: '전망석 위', scale: .95 });
  f.spot('under', null, .4, .01, .42, { maxH: .2, label: '전망석 밑', scale: .8 });
};

// ═════════════════════════ 앞코 운전실 (B) ═════════════════════════
B.tc5cab = (f, T, o = {}) => {
  const C = P(o), W = o.w || 4, X0 = -W / 2;
  f.noSolid = true; f.walkBoxes = [[X0, 0, -.5, W / 2, 1, .1]];
  f.add(mc('tc5-cab|' + o.v + W, ({ add }) => {
    add(G.box(W, 1.0, .16, .03), C.up, 0, .5, -.42); add(G.box(.7, WH - .1, .16, .03), C.up, X0 + .35, (WH - .1) / 2, -.42);
    add(G.box(W - .7, .1, .16, .03), C.glassF, .35, 1.05, -.42); add(G.box(W - .7, .1, .16, .03), C.glassF, .35, WH - .15, -.42);
    for (const x of [.35 - (W - .7) / 2, .35, .35 + (W - .7) / 2]) add(G.box(.1, WH - 1.1, .16, .03), C.glassF, x, (WH + 1.0) / 2, -.42);
    add(G.box(W - .8, .7, .45, .06), C.bodyD, .2, .35, -.15); add(G.box(W - .9, .06, .5, .02), '#45414f', .2, .74, -.15, -.25, 0, 0);
    for (const x of [-.5, -.1, .3]) add(G.cyl(.08, .08, .03, 14), S.white, x, .79, -.12, HP - .25, 0, 0);
    add(G.box(.06, .3, .06, .01), S.dark, .9, .92, -.1); add(G.sph(.06, 10, 8), S.red, .9, 1.08, -.1);
  }));
  const gl = mesh(new THREE.PlaneGeometry(W - .8, WH - 1.2), new THREE.MeshBasicMaterial({ color: '#bfe5f8' }), { cast: false }); put(gl, .35, (WH + 1.0) / 2, -.45); f.add(gl);
  const seat = grp(); put(seat, .3, 0, .25); f.add(seat);
  seat.add(mc('tc5-cabseat|' + o.v, ({ add }) => { add(G.cyl(.04, .04, .42, 8), S.steel2, 0, .21, 0); add(G.box(.5, .1, .5, .05), C.seatD, 0, .46, 0); add(G.box(.5, .5, .1, .05), C.seatD, 0, .72, .22); }));
  f.spot('on', null, .3, .52, .22, { maxH: .3, label: '운전석 위', scale: .85 });
  f.spot('on', null, -.4, .8, -.12, { maxH: .22, label: '운전대 위', scale: .7 });
};

// ═════════════════════════ 짐칸 (B) ═════════════════════════
const meshTex = () => TX.get('tc5-mesh', () => canvasTex(64, 64, (c, W, H) => { c.clearRect(0, 0, W, H); c.strokeStyle = '#8f98a6'; c.lineWidth = 3; for (let k = 0; k <= W; k += 16) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k, H); c.stroke(); c.beginPath(); c.moveTo(0, k); c.lineTo(W, k); c.stroke(); } }, { repeat: [4, 4] }));
B.tc5cargo = (f, T, o = {}) => {
  const C = P(o), L = 1.6, D = .7, H = 1.5;
  f.add(mc('tc5-cargo|' + o.v, ({ add, tube }) => {
    add(G.box(L, .08, D, .02), S.steel2, -.5, .04, 0); add(G.box(L, .06, D, .02), S.steel2, -.5, H, 0);
    for (const x of [-.5 - L / 2, -.5 + L / 2]) for (const z of [-D / 2, D / 2]) add(G.box(.05, H, .05, .01), S.steel2, x, H / 2, z);
    add(G.box(L - .1, .04, D - .1, .01), S.steel, -.5, .78, 0);
    for (const [x, y, w, h, c] of [[-1.0, .08, .5, .4, '#d9b382'], [-.45, .08, .4, .3, '#e8c99a'], [-.05, .08, .3, .5, '#c99b68'], [-.9, .82, .5, .36, '#e8c99a'], [-.3, .82, .4, .28, S.blue]]) add(G.box(w, h, .5, .03), c, x, y + h / 2, 0);
    for (const dxx of [-.42, .42]) add(G.tor(.27, .03, PI * 2, 6, 20), S.dark, .75 + dxx, .3, .2);
    tube([.33, .3, .2], [.6, .62, .2], .025, S.coral); tube([.6, .62, .2], [1.0, .62, .2], .025, S.coral); tube([1.0, .62, .2], [1.17, .3, .2], .025, S.coral); tube([.6, .62, .2], [.75, .3, .2], .025, S.coral);
    add(G.box(.2, .05, .1, .02), S.dark, .6, .7, .2); add(G.box(.06, .06, .4, .01), S.steel, 1.02, .75, .2);
    for (const [y, c] of [[.15, '#d9a86c'], [.45, '#e4bb82']]) { add(G.box(.55, .28, .4, .02), c, .8, y, -.18); for (let k = 0; k < 3; k++) add(G.sph(.07, 8, 6), S.orange, .65 + k * .15, y + .16, -.18); }
  }));
  const dv = grp(); put(dv, -.5 - L / 2, 0, D / 2 + .01); f.add(dv);
  const mp = mesh(new THREE.PlaneGeometry(L, H - .1), new THREE.MeshBasicMaterial({ map: meshTex(), transparent: true, alphaTest: .3, side: THREE.DoubleSide }), { cast: false }); put(mp, L / 2, H / 2 + .03, 0); dv.add(mp);
  dv.add(mc('tc5-cargodoor', ({ add }) => { add(G.box(L, .05, .04, .01), S.steel2, L / 2, .1, 0); add(G.box(L, .05, .04, .01), S.steel2, L / 2, H - .05, 0); add(G.box(.05, H - .1, .04, .01), S.steel2, L - .03, H / 2, 0); }));
  const p = f.part('door', dv, (t, b) => { dv.rotation.y = -1.3 * t; }, { label: '짐칸 문', sfx: 'open', dur: .35 });
  p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: L - .08, y: .8, z: .04, parent: dv };
  f.spot('inside', null, -.9, .82, .05, { part: p, maxH: .5, label: '짐칸 안', scale: .9 });
  f.spot('on', null, .8, .62, -.18, { maxH: .3, label: '상자 위', scale: .85 });
  f.spot('on', null, .75, .01, .5, { maxH: .3, label: '자전거 옆', scale: .85 });
};

// ═════════════════════════ 바닥 짐 ═════════════════════════
// (사용자 메모 "가방 … 오브젝트 디테일"): a hard-shell suitcase (ribs, four wheels, a pull handle up, a luggage tag, a sticker) and a teal
// travel bag (handles, a zip, a striped band) beside it
B.tc5bags = (f, T, o = {}) => {
  f.add(mc('tc5-bags3', ({ add, tube }) => {
    add(G.box(.42, .6, .26, .07), S.blue, 0, .34, 0); for (const x of [-.12, 0, .12]) add(G.box(.035, .54, .27, .01), '#527bbd', x, .34, 0);
    add(G.box(.43, .03, .27, .01), '#3f5f9c', 0, .5, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(G.cyl(.035, .035, .03, 10), S.dark, sx * .16, .035, sz * .09, 0, 0, HP); add(G.box(.04, .04, .04, .01), '#3f5f9c', sx * .16, .07, sz * .09); }
    for (const sx of [-1, 1]) tube([sx * .08, .64, -.08], [sx * .08, .9, -.08], .012, S.steel2, 6); add(G.box(.22, .045, .05, .02), S.dark, 0, .91, -.08);
    add(G.box(.3, .18, .02, .02), S.yellow, 0, .3, .14); add(G.sph(.045, 8, 6), '#ff9fb8', -.12, .45, .135, 0, 0, 0, [1, 1, .2]);
    tube([.15, .6, .1], [.2, .5, .16], .005, '#e0d6c0', 4); add(G.box(.06, .08, .008, .01), '#fff3c8', .21, .46, .17, 0, 0, -.2);
    add(G.box(.48, .3, .3, .12), '#a2c8bb', .5, .15, .1, 0, .3, 0); add(G.box(.46, .03, .02, .005), S.steel2, .5, .3, .18, 0, .3, 0); add(G.box(.48, .06, .31, .02), '#7fb3a4', .5, .1, .1, 0, .3, 0);
    for (const sz of [-.06, .06]) { tube([.38, .29, .1 + sz], [.44, .42, .12 + sz], .014, '#5f8f80', 5); tube([.44, .42, .12 + sz], [.58, .42, .06 + sz], .014, '#5f8f80', 5); tube([.58, .42, .06 + sz], [.63, .29, .04 + sz], .014, '#5f8f80', 5); }
  }));
  if (o.spot !== false) f.spot('on', null, .5, .33, .1, { maxH: .26, label: '짐 위', scale: .8 });
};

// ═════════════════════════ 흐르는 선로 + 흔들림 ═════════════════════════
// (under the whole train, o.len long): one plane of track — gravel, the wooden sleepers, two steel rails — whose picture slides back
// under the wheels as the train goes; its ends fade into the sky (the fade keeps still, only the sleepers move — 사용자 메모 "레일은
// 앞으로 가는것처럼 계속 뒤로 가면서… 사라지게… 가로 나무만 움직이면"). Offsets only, 30 times a second, nothing rebuilt.
// It also rocks the car (사용자 메모 "기차니까 약간 흔들리게"): the room leans a little side to side with a slow jolt now and then; the
// track leans back the same, so the rails stay level under the wheels. (Only when nothing else moves the room — the stage's tunnel
// staging sways it its own way.)
B.tc5track = (f, T, o = {}) => {
  const L = o.len || 18, Wd = 3.0, Y = o.y ?? -1.36, SP = .55;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  const tex = trackTex().clone(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, L / SP); tex.needsUpdate = true;
  const m = new THREE.MeshBasicMaterial({ map: tex, alphaMap: trackFade(), transparent: true, depthWrite: false }); m.toneMapped = false;
  const tg = grp(); f.add(tg);
  const pl = mesh(new THREE.PlaneGeometry(Wd, L), m, { cast: false }); put(pl, 0, Y, 0, -HP); pl.layers.set(2); pl.renderOrder = 0; pl.userData.noOcclude = true; tg.add(pl);
  f.live = [tg];
  const amp = o.rock ?? .009, spd = o.speed ?? 3.2;
  let last = -1, mine = null, pause = 0;
  f.tick = t => {
    const fr = Math.floor(t * 30); if (fr === last) return; last = fr;
    const y = (t * spd / SP) % 1; tex.offset.y = y;
    const room = f.group.parent; if (!room || t < pause) return;
    if (mine != null && Math.abs(room.rotation.z - mine) > 1e-6) { mine = null; pause = t + 3; return; }
    const jolt = Math.max(0, Math.sin(t * .9) - .985) * 40;
    const a = amp * (Math.sin(t * 3.6) * .7 + Math.sin(t * 1.7 + 1.3) * .3) + amp * .6 * Math.sin(t * 22) * jolt;
    room.rotation.z = a; mine = a; tg.rotation.z = -a;
  };
};
// the aisle runner (flat, walked over): o.len × o.w
B.tc5mat = (f, T, o = {}) => {
  const L = o.len || 3, W = o.w || 1.1;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  const t = matTex().clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, L / 1.6); t.needsUpdate = true;
  const p = mesh(new THREE.PlaneGeometry(W, L), mat('#ffffff', { map: t, rim: 0 }), { cast: false }); put(p, 0, .008, 0, -HP); p.receiveShadow = true; f.add(p);
  f.add(mc('tc5-matedge|' + L + W, ({ add }) => { for (const s of [-1, 1]) add(G.box(W + .02, .012, .03, .004), '#5f8f80', 0, .006, s * L / 2); }));
};

export const TRAINCAR5_BUILDERS = B;
export const TRAINCAR5_INFO = {
  tc5shell: { w: 4, d: 6, name: '차체', hidden: true },
  tc5wall: { w: 1, d: 6, name: '칸 벽', hidden: true },
  twindow5: { w: 1.6, d: .3, name: '기차 창', hidden: true },
  tc5door: { w: 1.4, d: .4, name: '출입문', hidden: true },
  tc5long: { w: 3.2, d: .62, name: '롱시트', hidden: true },
  tc5box: { w: 1.9, d: 1, name: '박스석', hidden: true },
  tc5rack: { w: 3.6, d: .6, name: '짐 선반', hidden: true },
  tc5pole: { w: .2, d: .2, name: '손잡이 봉', hidden: true },
  tc5end: { w: 4, d: .2, name: '칸 끝벽', hidden: true },
  tc5gang: { w: 2, d: 1, name: '연결 통로', hidden: true },
  tc5view: { w: 2.6, d: .8, name: '전망석', hidden: true },
  tc5cab: { w: 4, d: 1, name: '운전실', hidden: true },
  tc5cargo: { w: 2.4, d: .8, name: '짐칸', hidden: true },
  tc5bags: { w: 1, d: .5, name: '바닥 짐', hidden: true },
  tc5track: { w: 3, d: 18, name: '흐르는 선로', hidden: true },
  tc5mat: { w: 1.1, d: 3, name: '통로 매트', hidden: true },
};

// 28판 봄빛 로컬 열차 두 량 (traincar4, ⑧ 10/23 — 사용자 "2량으로, GPT 대안 참고해 완전히 새 디자인. 창밖 배경은 패럴랙스로 계속
// 옆으로 지나가게, 배경 하늘색"; 좋아한 그림 _handoff/fb-1021/gpt-traincar-loved-1022.webp: 청록 좌석·크림 벽·주황 테두리·짐 선반·
// 손잡이·노선도·미닫이 문·아래 선로). 옛 키 traincar·traincar2·traincar3·gpttraincar2와 그 빌더는 그대로 둔다 — 여기는 새 type만.
//   tc4shell     한 량의 차체: 두꺼운 청록 차체 띠(크림·주황 줄), 잘린 끝의 단면 테(벽·둥근 지붕), 창 쪽 지붕 처마, 대차·바퀴(돎),
//                앞 칸은 전조등·스커트, 뒤 칸은 꼬리등·헤드마크, 차 번호 판
//   tc4bench     청록 긴 좌석(모켓 천 무늬, 팔걸이, 히터 그릴), o.drawer = 자물쇠 서랍, o.stuff = 놓고 간 것들
//   twindow4     큰 기차 창 — 창마다 같은 풍경(하늘·산·마을·전봇대)이 세 겹으로 다른 빠르기로 흐름; o.blind 롤 블라인드, o.curtain 커튼
//   tc4rack      손잡이 봉·가죽 손잡이·짐 선반(가방들 — 여행 가방은 자물쇠 칸, 너굴이 숨는 곳)·광고 띠·선풍기(돎)
//   tc4front     앞 칸 끝벽: 노선도·행선 표시·운전실 미닫이 문(그 너머 작은 운전실)·소화기함·하차 벨
//   tc4sidedoor  창 쪽 출입문 한 쌍(누르면 열려 바깥 풍경이 보임)
//   tc4endwall   칸 사이 낮은 끝벽(문틀, 창 쪽만 좁게 높음)
//   tc4gangway   두 칸 사이 연결 통로: 고무 주름막(먼 쪽 높게, 가까운 쪽 낮게 — 누르면 출렁 벌어져 사이에 숨김 자리), 통로 미닫이 문
//   tc4cart      간식 카트(비밀번호 뚜껑), tc4booth 식당칸 마주보기 자리(방석 밑 칸), tc4counter 역 도시락 매대(서랍·진열장),
//   tc4sofa      꼬리 칸 전망 소파, tc4tail 꼬리 끝 낮은 난간, tc4luggage 바닥의 여행 짐
//   tc4scenery   패럴랙스 바깥: 두꺼운 층진 받침 위 긴 풍경 띠 — 선로(침목·자갈 빠르게), 전봇대·전선·덤불(빠르게), 논·마을·벚꽃
//                (중간), 언덕·숲(느리게), 산(아주 느리게), 구름; 앞쪽은 풀둑·꽃·울타리(빠르게), 수로(물결), 산책길(느리게).
//                층마다 몇 개의 큰 덩어리를 옮기기만 함(매 프레임 새 도형 X, 초당 30번), 판이 처음 그려질 때 한 번 지음.
//                가끔 터널: 화면이 잠깐 어두워졌다 밝아짐(DOM 그늘 한 장, 판 연출 터널과 겹치지 않음).
import * as THREE from 'three';
import { put, grp, shade, mat, mesh, canvasTex, texCache, cutFace, liner, holeFace } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';
import { EN } from '../i18n-en-dict.js';

const PI = Math.PI, HP = PI / 2;
const K = (ko, en) => { if (EN[ko] == null) EN[ko] = en; return ko; };
for (const [ko, en] of [['봄빛 로컬', 'Spring Local'], ['봄빛 로컬선', 'Spring Local Line'], ['1호차', 'Car 1'], ['2호차', 'Car 2'], ['식당칸', 'Dining Car'],
  ['호수 섬 행', 'For Lake Island'], ['다음 역', 'Next'], ['벚꽃역', 'Sakura Stn.'], ['들판', 'Fields'], ['온천', 'Hot Spring'], ['호수 섬', 'Lake Island'], ['바다', 'Sea'],
  ['역 도시락', 'Station Bento'], ['도시락 · 귤 · 차', 'Bento · Mandarins · Tea'], ['딸기 축제', 'Strawberry Fest'], ['온천 마을', 'Hot Spring Town'], ['벚꽃 도시락', 'Sakura Bento'],
  ['바다 보러 가요', 'To the Sea!'], ['호수 섬 캠핑', 'Lake Camping'], ['봄빛', 'Spring'], ['운전실', 'Cab'], ['노약자석', 'Priority'], ['문 열림 주의', 'Mind the doors'],
  ['짐 선반 여행 가방', 'Suitcase on the rack'], ['여행 가방 뒤', 'Behind the suitcase'], ['배낭', 'Backpack'], ['배낭 뒤', 'Behind the backpack'],
  ['연결 통로 문', 'Gangway door'], ['연결 통로 안', 'In the gangway'], ['고무 주름막', 'Rubber bellows'], ['주름막 사이', 'In the bellows'],
  ['운전실 문', 'Cab door'], ['운전실 안', 'In the cab'], ['소화기함', 'Fire box'], ['소화기함 위', 'On the fire box'], ['하차 벨', 'Stop bell'],
  ['출입문', 'Train doors'], ['출입문 발판', 'On the door step'], ['커튼', 'Curtain'], ['창문', 'Window'],
  ['식당칸 자리', 'Dining booth'], ['식당칸 테이블 위', 'On the dining table'], ['테이블 밑', 'Under the table'], ['방석', 'Seat cushion'], ['방석 밑', 'Under the cushion'],
  ['도시락 매대', 'Bento counter'], ['매대 서랍', 'Counter drawer'], ['매대 서랍 안', 'In the counter drawer'], ['매대 위', 'On the counter'],
  ['빵 진열장', 'Bread case'], ['빵 진열장 안', 'In the bread case'], ['전망 소파', 'View sofa'], ['소파 위', 'On the sofa'], ['소파 밑', 'Under the sofa'],
  ['여행 짐', 'Luggage'], ['여행 짐 위', 'On the luggage'], ['가방 옆', 'By the bags'], ['끝 난간', 'Tail rail'], ['칸 끝벽', 'Car end wall'],
  ['차체', 'Car body'], ['바깥 풍경', 'Scenery'], ['큰 기차 창', 'Train window'], ['청록 긴 좌석', 'Long teal seat'], ['손잡이와 짐 선반', 'Straps and racks'],
  ['앞 칸 끝벽', 'Front end wall'], ['칸 벽', 'Car wall'], ['연결 통로', 'Gangway'], ['탁자 위', 'On the side table']]) K(ko, en);

// ── palette: cream walls and teal seats like the picture the user loved, orange only on trims and little things
const C = { teal: '#2f9c88', tealD: '#227a6b', tealL: '#8fd0bf', cream: '#fbf2df', cream2: '#efe0c0', orange: '#f2963a', orange2: '#d97b26',
  honey: '#e4ba7c', wood: '#c98f55', woodD: '#8c5d36', steel: '#c3c9d2', steel2: '#8f98a6', dark: '#3b3647', ink: '#2a2233',
  coral: '#ec8a78', coral2: '#d76f5f', rose: '#f6cdc2', mint: '#a7d9c4', yellow: '#f6cf5a', red: '#e5554b', white: '#fffaf1', navy: '#34466b',
  rubber: '#58546a', rubber2: '#6b677c' };
const B = {};
const TX = texCache();
const noRay = o => { o.traverse(c => { c.raycast = () => {}; }); return o; };
const flat = (w, h, tex, o = {}) => { const m = mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: tex, rim: 0, ...o }), { cast: false }); return m; };
const basic = tex => { const m = new THREE.MeshBasicMaterial({ map: tex }); m.toneMapped = false; return m; };
const RNG = seed => { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// ── textures (painted once, kept the way the props' other pictures are: texCache)
// seat moquette: teal with a little cream diamond pattern (the seats of a local train)
const moquette = (base, dot) => TX.get('tc4-moq|' + base + dot, () => canvasTex(128, 128, (c, W, H) => {
  c.fillStyle = base; c.fillRect(0, 0, W, H);
  c.fillStyle = shade(base, -.08); for (let y = 0; y < H; y += 8) c.fillRect(0, y, W, 2);
  c.fillStyle = dot; for (let y = 8; y < H; y += 32) for (let x = (y / 32 % 2) * 16 + 8; x < W; x += 32) { c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 5, y); c.lineTo(x, y + 5); c.lineTo(x - 5, y); c.fill(); }
}, { repeat: [1, 1] }));
// the gangway's steel tread plate
const treadTex = () => TX.get('tc4-tread', () => canvasTex(128, 128, (c, W, H) => {
  c.fillStyle = '#b7bec8'; c.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) { const a = ((x + y) / 16) % 2 ? .6 : -.6; c.save(); c.translate(x + 8, y + 8); c.rotate(a); c.fillStyle = '#d5dae1'; c.fillRect(-5, -1.5, 10, 3); c.fillStyle = '#9aa2ad'; c.fillRect(-5, 1.5, 10, 1); c.restore(); }
}, { repeat: [2, 2] }));
// the picture ads in the strip over the windows (our lettering, Korean and English)
const adsTex = () => TX.get('tc4-ads', () => textTex(1536, 160, (c, W, H) => {
  c.fillStyle = '#e8e1d2'; c.fillRect(0, 0, W, H);
  const ads = [['딸기 축제', '#ffd8df', '#e8414e'], ['온천 마을', '#dff0ff', '#3f7cc4'], ['벚꽃 도시락', '#ffe9f0', '#d9547c'], ['바다 보러 가요', '#d9f3ef', '#1f8a78'], ['호수 섬 캠핑', '#fff1cf', '#c9852a']];
  const w = W / ads.length;
  ads.forEach(([t, bg, fg], k) => {
    const x = k * w + 6, cx = x + (w - 12) / 2;
    c.fillStyle = '#c4baa6'; c.fillRect(x - 2, 4, w - 8, H - 8); c.fillStyle = bg; c.fillRect(x + 2, 8, w - 16, H - 16);
    c.fillStyle = fg;
    if (k === 0) { for (const [dx, r] of [[-30, 15], [0, 18], [30, 14]]) { c.beginPath(); c.moveTo(cx + dx, 36 + r * 2.2); c.bezierCurveTo(cx + dx - r * 1.4, 36 + r, cx + dx - r, 30, cx + dx, 30); c.bezierCurveTo(cx + dx + r, 30, cx + dx + r * 1.4, 36 + r, cx + dx, 36 + r * 2.2); c.fill(); } }
    else if (k === 1) { c.beginPath(); c.arc(cx, 62, 26, 0, PI); c.fill(); c.strokeStyle = fg; c.lineWidth = 4; for (const dx of [-14, 0, 14]) { c.beginPath(); c.moveTo(cx + dx, 50); c.quadraticCurveTo(cx + dx + 8, 38, cx + dx, 26); c.stroke(); } }
    else if (k === 2) { c.fillRect(cx - 34, 34, 68, 40); c.fillStyle = '#fff'; c.fillRect(cx - 30, 38, 28, 32); c.fillStyle = '#ff9fb8'; for (const [dx, dy] of [[10, 46], [22, 58], [14, 64]]) { c.beginPath(); c.arc(cx + dx, dy, 6, 0, 7); c.fill(); } }
    else if (k === 3) { c.fillStyle = '#ffd23c'; c.beginPath(); c.arc(cx + 22, 38, 12, 0, 7); c.fill(); c.fillStyle = fg; c.fillRect(x + 8, 64, w - 28, 18); c.fillStyle = '#fff'; c.fillRect(x + 14, 66, 30, 3); }
    else { c.beginPath(); c.moveTo(cx - 30, 78); c.lineTo(cx, 30); c.lineTo(cx + 30, 78); c.fill(); c.fillStyle = '#3f9e6a'; c.fillRect(x + 8, 78, w - 28, 6); }
    fitText(c, t, cx, H - 34, w - 34, 26, '#3a2f3f', { weight: '700' });
  });
}));
// the route map over the front door: the line, its stops (호수 섬 next, in red), the line's name
const routeTex = () => TX.get('tc4-route', () => textTex(1024, 220, (c, W, H) => {
  c.fillStyle = C.white; c.fillRect(0, 0, W, H); c.fillStyle = C.teal; c.fillRect(0, 0, W, 46);
  fitText(c, '봄빛 로컬선', W / 2, 23, W * .7, 30, '#ffffff', { weight: '700' });
  const st = ['벚꽃역', '들판', '온천', '호수 섬', '바다'], x0 = W * .1, dx = W * .8 / (st.length - 1), y = 112;
  c.fillStyle = C.orange; c.fillRect(x0, y - 7, dx * (st.length - 1), 14);
  st.forEach((s, i) => { const x = x0 + dx * i; c.fillStyle = i === 3 ? C.red : '#ffffff'; c.beginPath(); c.arc(x, y, 17, 0, 7); c.fill(); c.lineWidth = 6; c.strokeStyle = C.tealD; c.stroke();
    fitText(c, s, x, 170, dx * .9, 30, i === 3 ? C.red : '#3a2f3f', { weight: '700' }); });
  c.fillStyle = C.red; c.beginPath(); c.moveTo(x0 + dx * 2.5, 72); c.lineTo(x0 + dx * 2.5 + 22, 84); c.lineTo(x0 + dx * 2.5, 96); c.fill();
}));
// the destination board: dark glass, orange letters
const ledTex = () => TX.get('tc4-led', () => textTex(512, 96, (c, W, H) => {
  c.fillStyle = '#26232c'; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,170,60,.12)'; for (let x = 0; x < W; x += 6) c.fillRect(x, 0, 2, H);
  fitText(c, '다음 역', W * .2, H / 2, W * .3, 34, '#ffd37a', { weight: '700' });
  fitText(c, '호수 섬 행', W * .64, H / 2, W * .58, 40, '#ffad4a', { weight: '700' });
}));
// the car's number and the line's name on the body, the round head mark at the tail
const bodyTex = n => TX.get('tc4-body|' + n, () => textTex(512, 80, (c, W, H) => {
  c.fillStyle = C.cream; c.fillRect(0, 0, W, H); c.fillStyle = C.orange; c.fillRect(0, H - 10, W, 6);
  fitText(c, '봄빛 로컬', W * .36, H / 2 - 3, W * .62, 40, C.tealD, { weight: '700' });
  c.fillStyle = C.tealD; c.beginPath(); c.arc(W * .84, H / 2 - 3, 28, 0, 7); c.fill();
  fitText(c, String(n), W * .84, H / 2 - 3, 40, 40, '#ffffff', { weight: '700' });
}));
const markTex = () => TX.get('tc4-mark', () => textTex(256, 256, (c, W, H) => {
  c.fillStyle = C.tealD; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 2, 0, 7); c.fill();
  c.fillStyle = C.cream; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 14, 0, 7); c.fill();
  c.fillStyle = '#f6b6c8'; for (let k = 0; k < 5; k++) { const a = k * PI * 2 / 5 - HP; c.beginPath(); c.arc(W / 2 + Math.cos(a) * 30, H * .36 + Math.sin(a) * 30, 18, 0, 7); c.fill(); }
  c.fillStyle = '#f2963a'; c.beginPath(); c.arc(W / 2, H * .36, 10, 0, 7); c.fill();
  fitText(c, '봄빛', W / 2, H * .72, W * .6, 46, C.tealD, { weight: '700' });
}));
// the bento counter's price board
const menuTex = () => TX.get('tc4-menu', () => textTex(512, 128, (c, W, H) => {
  c.fillStyle = '#3e5a4f'; c.fillRect(0, 0, W, H); c.strokeStyle = '#d9b77c'; c.lineWidth = 8; c.strokeRect(4, 4, W - 8, H - 8);
  fitText(c, '역 도시락', W / 2, H * .36, W * .8, 40, '#ffffff', { weight: '700' });
  fitText(c, '도시락 · 귤 · 차', W / 2, H * .72, W * .82, 26, '#ffd37a');
}));

// ═════════════════════════ 창밖 (windows): one landscape, three strips at three speeds over a still sky ═════════════════════════
const tile = (w, h, draw) => { const t = canvasTex(w, h, draw); t.wrapS = THREE.RepeatWrapping; return t; };
// (each picture its own cache entry: the cache frees what it holds with .dispose())
const flowTex = () => ({
  sky: TX.get('tc4-flow-sky', () => canvasTex(256, 256, (c, W, H) => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#83c8f0'); g.addColorStop(.6, '#cdebfb'); g.addColorStop(1, '#eef9ff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.92)'; for (const [x, y, r] of [[40, 50, 16], [60, 44, 22], [84, 52, 15], [170, 34, 12], [188, 30, 17], [206, 36, 11]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  })),
  // far: two soft ridges of hills (they repeat exactly across the width — no seam)
  far: TX.get('tc4-flow-far', () => tile(512, 256, (c, W, H) => {
    const ridge = (base, amp, col, ph) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 4) { const a = x / W * PI * 2; c.lineTo(x, base - amp * (.55 * Math.sin(a * 2 + ph) + .3 * Math.sin(a * 5 + ph * 2) + .15 * Math.sin(a * 9 + ph))); }
      c.lineTo(W, H); c.fill(); };
    ridge(H * .52, H * .15, '#a9c9d8', 0); ridge(H * .6, H * .12, '#8fbfa4', 1.7);
    c.clearRect(0, H * .8, W, H);
  })),
  // mid: rice paddies holding the sky, white farmhouses with blue-grey roofs, pink cherry trees, green trees
  mid: TX.get('tc4-flow-mid', () => tile(512, 256, (c, W, H) => {
    const g0 = H * .72; c.fillStyle = '#9fd07a'; c.fillRect(0, g0, W, H - g0);
    c.fillStyle = '#b9e2ee'; for (let x = 6; x < W; x += 64) c.fillRect(x, g0 + 10, 50, 12);
    c.fillStyle = '#86c05c'; for (let x = 6; x < W; x += 64) for (let k = 0; k < 5; k++) c.fillRect(x + 4 + k * 10, g0 + 10, 3, 12);
    const house = (x, w, h, roof) => { c.fillStyle = '#fffaf1'; c.fillRect(x, g0 - h, w, h); c.fillStyle = roof; c.beginPath(); c.moveTo(x - 6, g0 - h); c.lineTo(x + w / 2, g0 - h - h * .55); c.lineTo(x + w + 6, g0 - h); c.fill(); c.fillStyle = '#7f6a58'; c.fillRect(x + w * .38, g0 - h * .55, w * .22, h * .55); };
    const tree = (x, r, a, b) => { c.fillStyle = '#8a6044'; c.fillRect(x - 2, g0 - r, 4, r); c.fillStyle = a; c.beginPath(); c.arc(x, g0 - r * 1.4, r, 0, 7); c.fill(); c.fillStyle = b; c.beginPath(); c.arc(x - r * .35, g0 - r * 1.65, r * .5, 0, 7); c.fill(); };
    house(30, 40, 26, '#5f7c99'); tree(98, 14, '#f5b3c6', '#fde0e8'); house(150, 30, 20, '#c4654f'); tree(212, 16, '#6fb85e', '#8fd07a'); tree(232, 11, '#f5b3c6', '#fde0e8');
    house(300, 44, 28, '#5f7c99'); tree(372, 15, '#6fb85e', '#8fd07a'); house(410, 28, 20, '#3f8f7c'); tree(468, 13, '#f5b3c6', '#fde0e8');
  })),
  // near: telegraph poles smeared as they whip past, their wires, the grass bank
  near: TX.get('tc4-flow-near', () => tile(512, 256, (c, W, H) => {
    const poles = [W * .2, W * .7];
    c.strokeStyle = '#3a3346'; c.lineWidth = 2.5;
    for (const dy of [28, 40]) for (let i = 0; i < poles.length; i++) {
      const a = poles[i], b = i + 1 < poles.length ? poles[i + 1] : poles[0] + W;
      for (const sh of [0, -W]) { c.beginPath(); c.moveTo(a + sh, dy); c.quadraticCurveTo((a + b) / 2 + sh, dy + 20, b + sh, dy); c.stroke(); }
    }
    for (const x of poles) {
      const g = c.createLinearGradient(x - 24, 0, x + 24, 0); g.addColorStop(0, 'rgba(140,110,80,0)'); g.addColorStop(.5, 'rgba(140,110,80,1)'); g.addColorStop(1, 'rgba(140,110,80,0)');
      c.fillStyle = g; c.fillRect(x - 24, 16, 48, H);
      const g2 = c.createLinearGradient(x - 40, 0, x + 40, 0); g2.addColorStop(0, 'rgba(58,51,70,0)'); g2.addColorStop(.5, 'rgba(58,51,70,.9)'); g2.addColorStop(1, 'rgba(58,51,70,0)'); c.fillStyle = g2; c.fillRect(x - 40, 24, 80, 7);
    }
    c.fillStyle = 'rgba(112,184,84,.96)'; c.fillRect(0, H - 24, W, 24); c.fillStyle = 'rgba(140,204,104,.9)'; for (let k = 0; k < 10; k++) c.fillRect((k * 53) % W, H - 30 + (k % 3) * 4, 40, 3);
    for (let k = 0; k < 14; k++) { c.fillStyle = ['#ffffff', '#ffd23c', '#ff9fb8'][k % 3]; c.beginPath(); c.arc((k * 37 + 9) % W, H - 14 + (k % 2) * 6, 3, 0, 7); c.fill(); }
  })),
});
// a flowing view in a w×h opening (its middle at y = cy, z = z0 in the piece): the still sky, then far / mid / near, each its own copy
// of the shared picture so every window sits at its own place along the landscape (colour only, layer 2: no ink round the clear parts)
const SPEEDS = { far: [9, .55], mid: [4.6, 2.2], near: [3.2, 6.5] };
function flowView(f, w, h, cy, z0) {
  const F = flowTex(), gl = mesh(new THREE.PlaneGeometry(w, h), basic(F.sky), { cast: false }); put(gl, 0, cy, z0); f.add(gl);
  const lays = ['far', 'mid', 'near'].map((k, i) => {
    const [Lm, v] = SPEEDS[k], tex = F[k].clone(); tex.repeat.set(w / Lm, 1); tex.needsUpdate = true;
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }); m.toneMapped = false;
    const pl = mesh(new THREE.PlaneGeometry(w, h), m, { cast: false }); put(pl, 0, cy, z0 + .002 + i * .002); pl.layers.set(2); pl.renderOrder = 1 + i; pl.userData.noOcclude = true; f.add(pl);
    return { tex, Lm, v };
  });
  // (all the windows slide on the same clock, 30 times a second; each one's place along the train decides its stretch of land)
  let base = null, last = -1;
  const v3 = new THREE.Vector3();
  return t => {
    const fr = Math.floor(t * 30); if (fr === last) return; last = fr;
    if (base == null) { f.group.updateWorldMatrix(true, false); f.group.localToWorld(v3.set(-w / 2, 0, 0)); base = -v3.z; }
    for (const L of lays) { const x = (base + t * L.v) / L.Lm; L.tex.offset.x = x - Math.floor(x); }
  };
}

// ═════════════════════════ 차체 ═════════════════════════
// one car's body under and round its floor (5 × 6, placed at the car's middle): o.car 0 = the front car (its -z end the train's nose),
// 1 = the back car (its +z end the tail). The window wall with the eave is tc4wall (it folds away like a room's wall).
const CW = 5.0, CL = 6.0, WH = 3.0, X0 = -CW / 2;
// a wall-hung piece (a window, the racks, the doors on the window wall — local +z into the car) is put away while the camera is on the
// wall's far side, the way a room's wall pieces are (room.js: the wall's inward normal · the camera's heading < -.18)
const foldWall = f => {
  const prev = f.updateView; let shown = true;
  f.updateView = (W, dt) => {
    prev?.(W, dt); if (!W || !Number.isFinite(W.yaw)) return;
    const want = Math.sin(W.yaw) >= -.18; if (want === shown) return;
    shown = want; f.group.visible = want; W.shadowDirty = true; W.idsDirty = true;
  };
};
B.tc4shell = (f, T, o = {}) => {
  const car = o.car ? 1 : 0, L = CL;
  // (round the car and under its floor: never in anyone's way)
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  f.add(mc('tc4-shell2|' + car, ({ add, tube }) => {
    // the body under the floor: a cream lip, the teal band with its cream and orange lines, the dark skirt
    add(G.box(CW + .3, .54, L - .04, .05), C.teal, -.03, -.33, 0);
    add(G.box(CW + .34, .08, L, .02), C.cream, -.03, -.05, 0);
    add(G.box(CW + .36, .05, L + .02, .015), C.cream, -.03, -.2, 0);
    add(G.box(CW + .36, .035, L + .02, .012), C.orange, -.03, -.27, 0);
    add(G.box(CW + .1, .12, L - .2, .03), '#2e3a40', -.03, -.62, 0);
    // the low sill along the open side (seen over: the car's edge), cream with an orange cap and a teal line
    add(G.box(.14, .34, L, .03), C.cream, CW / 2 + .07, .17, 0); add(G.box(.2, .05, L + .02, .02), C.orange, CW / 2 + .07, .36, 0);
    add(G.box(.02, .06, L - .1, .01), C.teal, CW / 2 + .145, .14, 0);
    // bogies: a dark frame, side frames with yellow springs, brake boxes; equipment and a fuel tank between them
    for (const bz of [-L / 2 + 1.25, L / 2 - 1.25]) {
      add(G.box(3.1, .18, 1.3, .05), '#45414f', 0, -.8, bz);
      for (const sx of [-1, 1]) {
        add(G.box(.16, .24, 1.5, .05), '#4d4958', sx * 1.42, -.98, bz);
        for (const dz of [-.22, .22]) add(G.cyl(.06, .06, .16, 8), C.yellow, sx * 1.42, -.78, bz + dz);
        add(G.box(.12, .1, .2, .02), '#6c6878', sx * 1.42, -1.06, bz);
      }
    }
    add(G.box(1.5, .34, 1.0, .05), '#4f5b63', .5, -.84, 0); for (let k = 0; k < 5; k++) add(G.box(.02, .22, .8, .005), '#3d474e', 1.26, -.84, -.4 + k * .2);
    add(G.cyl(.24, .24, 1.1, 12), '#5e6a72', -.95, -.86, 0, HP, 0, 0);
    if (!car) {
      // the nose (-z end): a skirt with an orange plough, two headlights, the coupler
      add(G.box(CW - .2, .34, .2, .06), '#3c4a52', -.03, -.78, -L / 2 - .2); add(G.box(CW - .8, .12, .24, .04), C.orange, -.03, -.58, -L / 2 - .2);
      for (const x of [-1.6, 1.5]) { add(G.cyl(.15, .15, .1, 14), '#f4f1e6', x, -.33, -L / 2 - .16, HP, 0, 0); add(G.cyl(.1, .1, .02, 12), '#fff3b8', x, -.33, -L / 2 - .21, HP, 0, 0); }
      add(G.box(.3, .2, .4, .05), C.steel2, -.03, -.5, -L / 2 - .32);
    } else {
      // the tail (+z end): two tail lamps, the coupler, a hose
      for (const x of [-1.6, 1.5]) { add(G.cyl(.12, .12, .1, 14), '#f7f0e4', x, -.33, L / 2 + .16, HP, 0, 0); add(G.cyl(.08, .08, .02, 12), C.red, x, -.33, L / 2 + .21, HP, 0, 0); }
      add(G.box(.3, .2, .4, .05), C.steel2, -.03, -.5, L / 2 + .32);
      tube([.4, -.48, L / 2 + .1], [.5, -.7, L / 2 + .3], .035, '#2f2b38');
    }
    // the inner end: the coupler bar under the gangway
    add(G.box(.32, .18, .5, .05), C.steel2, -.03, -.5, car ? -L / 2 - .25 : L / 2 + .25);
  }));
  // the car's name on the open side's band, and the tail's round head mark
  const bt = flat(1.6, .25, bodyTex(car + 1)); put(bt, CW / 2 + .155, -.36, car ? 1.3 : -1.3, 0, HP); f.add(bt);
  if (car) { const hm = mesh(new THREE.CircleGeometry(.36, 28), mat('#ffffff', { map: markTex(), rim: 0 }), { cast: false }); put(hm, -.03, -.25, L / 2 + .23); f.add(hm); }
  // the wheels: one axle (two wheels) a piece, turning as the train goes
  const axles = [];
  for (const bz of [-L / 2 + 1.25, L / 2 - 1.25]) for (const dz of [-.45, .45]) {
    const ax = grp(); put(ax, 0, -1.05, bz + dz); f.add(ax); axles.push(ax);
    ax.add(mc('tc4-axle', ({ add }) => {
      for (const sx of [-1, 1]) { add(G.cyl(.3, .3, .12, 14), '#3d3946', sx * 1.55, 0, 0, 0, 0, HP); add(G.cyl(.18, .18, .14, 10), C.steel, sx * 1.55, 0, 0, 0, 0, HP);
        add(G.box(.13, .32, .05, .01), '#55515f', sx * 1.55, 0, 0); add(G.cyl(.05, .05, .16, 8), C.orange, sx * 1.55, 0, 0, 0, 0, HP); }
      add(G.cyl(.06, .06, 3.0, 8), '#2f2b38', 0, 0, 0, 0, 0, HP);
    }));
  }
  f.live = axles;
  let last = -1;
  f.tick = t => { const fr = Math.floor(t * 30); if (fr === last) return; last = fr; for (const a of axles) a.rotation.x = -t * 17; };
};

// 창 쪽 벽 (one car's window wall, at the car's middle): cream above a soft lower panel (teal-mint in the seat car, rose in the dining car),
// the orange rail, the teal outside skin; on top the round eave of the roof with its boxes, at both ends the cut section of the body.
// Like a room's wall it folds to knee height while the camera is on its far side (its eave and frames go away with it).
const wallTex4 = (a, b) => TX.get('tc4-wall|' + a + b, () => canvasTex(256, 256, (c, W, H) => { c.fillStyle = a; c.fillRect(0, 0, W, H); c.fillStyle = b; for (let x = 0; x < W; x += 32) c.fillRect(x, 0, 10, H); }, { repeat: [1, 1] }));
const ringShape = () => {
  const s = new THREE.Shape();
  s.moveTo(X0 - .28, -.04); s.lineTo(X0 - .28, WH - .05); s.quadraticCurveTo(X0 - .28, WH + .42, X0 + .08, WH + .42); s.lineTo(X0 + .16, WH + .42); s.lineTo(X0 + .16, WH + .28);
  s.lineTo(X0 + .08, WH + .28); s.quadraticCurveTo(X0 + .04, WH + .28, X0 + .04, WH - .05); s.lineTo(X0 + .04, -.04); s.lineTo(X0 - .28, -.04);
  return s;
};
B.tc4wall = (f, T, o = {}) => {
  const car = o.car ? 1 : 0, L = CL, up = car ? '#fcefe7' : C.cream, up2 = car ? '#f9e5dc' : '#f7ead2', low = car ? '#f3cfc3' : '#cde7dc';
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  // (both move on their own — the fold — so the static merge leaves them be: f.live)
  const wall = grp(), top = grp(); f.add(wall); f.add(top); f.live = [wall, top];
  wall.add(mc('tc4-wall|' + car, ({ add }) => {
    add(G.box(.1, WH, L, .02), up, X0 - .05, WH / 2, 0);
    add(G.box(.07, WH + .02, L + .02, .02), C.teal, X0 - .135, WH / 2, 0);
    add(G.box(.075, .3, L + .03, .01), C.cream, X0 - .14, 1.0, 0); add(G.box(.078, .045, L + .04, .005), C.orange, X0 - .142, .82, 0);
    add(G.box(.05, .06, L, .02), C.orange, X0 + .02, .86, 0); add(G.box(.04, .1, L, .02), C.cream2, X0 + .015, .05, 0); add(G.box(.08, .06, L, .02), C.cream2, X0 - .01, WH - .02, 0);
  }));
  const tx = wallTex4(up, up2).clone(); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(L / 1.6, (WH - .86) / 1.6); tx.needsUpdate = true;
  const pu = flat(L, WH - .89, tx); put(pu, X0 + .003, (WH + .89) / 2, 0, 0, HP); wall.add(pu);
  const pl = mesh(new THREE.PlaneGeometry(L, .8), mat(low, { rim: .1 }), { cast: false }); put(pl, X0 + .003, .46, 0, 0, HP); wall.add(pl);
  top.add(mc('tc4-eave|' + car, ({ add }) => {
    // (the roof's round only over the wall's own thickness and a hand inside: anything wider hid the ads and the racks from the camera)
    const eave = new THREE.Shape(); eave.moveTo(X0 - .27, WH - .05); eave.quadraticCurveTo(X0 - .27, WH + .4, X0 + .08, WH + .4);
    eave.lineTo(X0 + .14, WH + .4); eave.lineTo(X0 + .14, WH + .28); eave.lineTo(X0 + .08, WH + .28); eave.quadraticCurveTo(X0 + .03, WH + .28, X0 + .03, WH - .05); eave.lineTo(X0 - .27, WH - .05);
    const eg = G.ext(eave, L - .3, 0, 8); eg.translate(0, 0, -(L - .3) / 2); add(eg, C.teal, 0, 0, 0);
    add(G.box(.06, .06, L - .3, .02), C.cream, X0 + .06, WH + .02, 0);
    for (const z of [-L / 2 + 1.3, L / 2 - 1.5]) { add(G.box(.42, .2, .9, .07), '#dfe4ea', X0 - .12, WH + .48, z); for (let k = 0; k < 4; k++) add(G.box(.3, .02, .03, .005), C.steel2, X0 - .12, WH + .59, z - .32 + k * .21); }
    const ring = G.ext(ringShape(), .15, .02, 8);
    for (const z of [-L / 2, L / 2 - .15]) add(ring, C.tealD, 0, 0, z);
  }));
  let k = 1;
  f.updateView = (W, dt = 1 / 60) => {
    if (!W || !Number.isFinite(W.yaw)) return;
    const want = Math.sin(W.yaw) < -.18 ? 0 : 1, k0 = k;
    k += (want - k) * (1 - Math.exp(-Math.max(0, dt) * 12)); if (Math.abs(k - want) < .002) k = want;
    if (k === k0) return;
    wall.scale.y = .14 + .86 * k; top.visible = k > .65; W.shadowDirty = true;
  };
};

// ═════════════════════════ 청록 긴 좌석 ═════════════════════════
// (2×1, its back to the wall at local -z): plump teal cushions in three seats (moquette on top), a tall padded back, a cream base with
// the heater grille, steel armrests at the ends; o.drawer: the right half of the base is a drawer (padlock); o.stuff: left-behind things
B.tc4bench = (f, T, o = {}) => {
  const W = 1.92, D = .72, z0 = -.02, SH = .48, pri = !!o.priority, S1 = pri ? '#ee9fb5' : C.teal, S2 = pri ? '#d9839c' : C.tealD;
  f.add(mc('tc4-bench' + (pri ? '|p' : ''), ({ add, tube }) => {
    add(G.box(W - .04, SH - .17, D - .14, .03), C.cream2, 0, (SH - .17) / 2, z0 - .04);
    for (const x of [-.48, .48]) { add(G.box(.78, .16, .02, .006), '#d9c49c', x, .19, z0 + D / 2 - .1); for (let k = 0; k < 6; k++) add(G.box(.7, .012, .012, .003), '#b49b72', x, .13 + k * .022, z0 + D / 2 - .09); }
    for (let k = 0; k < 3; k++) { const x = -W / 3 + k * W / 3; add(G.box(W / 3 - .03, .2, D, .09), S1, x, SH - .07, z0); add(G.box(W / 3 - .1, .58, .2, .09), S2, x, SH + .33, z0 - D / 2 + .1, -.1, 0, 0); }
    add(G.box(W + .04, .07, .24, .03), C.cream, 0, SH + .64, z0 - D / 2 + .07);
    add(G.box(W + .02, .03, .03, .01), C.orange, 0, SH + .03, z0 + D / 2 - .01);
    for (const sx of [-1, 1]) {
      const x = sx * (W / 2 + .03), zf = z0 + D / 2 - .08, zb = z0 - D / 2 + .22;
      tube([x, .02, zf], [x, SH + .28, zf], .022, C.steel, 8); tube([x, SH + .28, zf], [x, SH + .42, zb], .022, C.steel, 8); tube([x, SH + .42, zb], [x, SH + .06, zb], .022, C.steel, 8);
      add(G.box(.014, .3, zf - zb - .06, .006), '#e3eef2', x, SH + .17, (zf + zb) / 2);
    }
    if (pri) { add(G.box(.22, .22, .012, .03), '#ffffff', 0, SH + .44, z0 - D / 2 + .215, -.1, 0, 0); add(G.sph(.05, 10, 8), '#e86a92', 0, SH + .46, z0 - D / 2 + .225, 0, 0, 0, [1, 1, .2]); }
  }));
  // the seat fabric: moquette on each cushion's top
  const mq = moquette(S1, pri ? '#fde6ee' : '#bfe8dc');
  for (let k = 0; k < 3; k++) { const p = flat(W / 3 - .14, D - .16, mq); put(p, -W / 3 + k * W / 3, SH + .033, z0 + .02, -HP); f.add(p); }
  const st = o.stuff;
  if (st) f.add(mc('tc4-bench-stuff|' + st, ({ add, tube }) => {
    if (st === 'paper') {   // a folded newspaper and a cup of noodles, the lid up
      add(G.box(.46, .025, .34, .006), '#f4f1ea', .42, SH + .05, z0, 0, .25, 0); for (let k = 0; k < 4; k++) add(G.box(.32, .006, .016, .002), '#9aa0aa', .42, SH + .064, z0 - .08 + k * .05, 0, .25, 0);
      add(G.cyl(.085, .068, .14, 14), '#ffffff', .8, SH + .1, z0 + .05); add(G.cyl(.087, .087, .035, 14), '#e8574a', .8, SH + .12, z0 + .05); add(G.box(.16, .006, .1, .01), '#f2c46a', .82, SH + .2, z0 - .01, -.9, 0, 0);
    } else if (st === 'mikan') {   // a net of tangerines and a bottle of tea
      for (let k = 0; k < 5; k++) add(G.sph(.065, 10, 8), '#f59a2e', -.55 + (k % 3) * .11, SH + .1 + Math.floor(k / 3) * .09, z0 + (k % 2) * .06);
      for (let k = 0; k < 3; k++) add(G.box(.012, .2, .012, .004), '#e8574a', -.55 + k * .1, SH + .14, z0 + .1, 0, 0, (k - 1) * .3);
      add(G.cyl(.045, .045, .2, 10), '#bfe6c4', .35, SH + .13, z0 + .08); add(G.cyl(.03, .03, .04, 8), '#3f9e6a', .35, SH + .25, z0 + .08);
    } else if (st === 'bag') {   // a tote with handles and a folded umbrella
      add(G.box(.32, .3, .14, .03), '#f6d7e2', -.5, SH + .19, z0 - .05, 0, .2, 0); tube([-.6, SH + .34, z0 - .05], [-.5, SH + .45, z0 - .05], .011, '#e8a2b8', 4); tube([-.5, SH + .45, z0 - .05], [-.4, SH + .34, z0 - .05], .011, '#e8a2b8', 4);
      add(G.cyl(.04, .04, .52, 10), '#3a7bd5', .48, SH + .06, z0 + .06, 0, 0, HP); add(G.tor(.05, .012, PI, 5, 10), '#2a1d33', .22, SH + .06, z0 + .06, 0, HP, 0);
    } else if (st === 'hat') {   // a straw hat and a little camera
      add(G.cyl(.2, .2, .02, 18), '#ecd08a', -.35, SH + .045, z0 + .02); add(G.cyl(.11, .12, .1, 16), '#f0d896', -.35, SH + .1, z0 + .02); add(G.cyl(.122, .122, .03, 16), C.coral, -.35, SH + .07, z0 + .02);
      add(G.box(.16, .1, .07, .02), C.dark, .5, SH + .1, z0 + .08); add(G.cyl(.035, .035, .05, 12), '#9aa3ad', .5, SH + .1, z0 + .13, HP, 0, 0);
    } else {   // 'bento': a lunch box wrapped in a cloth, chopsticks on top
      add(G.box(.3, .12, .22, .03), '#e6739a', -.4, SH + .1, z0 + .02); add(G.box(.08, .06, .08, .02), '#e6739a', -.4, SH + .19, z0 + .02); add(G.box(.26, .012, .02, .004), '#c98f55', -.4, SH + .17, z0 + .09);
      add(G.cyl(.05, .05, .1, 10), '#ffffff', .25, SH + .1, z0 + .1); add(G.cyl(.052, .052, .02, 10), '#3f9e6a', .25, SH + .16, z0 + .1);
    }
  }));
  f.spot('under', null, -.5, .01, z0 + D / 2 + .07, { maxH: .22, label: '벤치 밑', scale: .85 });
  f.spot('on', null, st === 'bag' || st === 'mikan' || st === 'bento' ? .05 : -.3, SH + .055, z0 + .08, { maxH: .36, label: '벤치 위', scale: .95 });
  if (!st) f.spot('on', null, .58, SH + .055, z0 + .08, { maxH: .36, label: '벤치 위', scale: .95 });
  if (o.drawer) {
    const dv = grp(); put(dv, .48, .2, z0 + D / 2 - .03); f.add(dv);
    dv.add(mc('tc4-bench-drawer', ({ add }) => {
      add(G.box(.82, .27, .04, .012), C.cream, 0, 0, .02); add(G.box(.76, .02, .46, .005), C.cream2, 0, -.11, -.22); for (const sx of [-1, 1]) add(G.box(.02, .2, .46, .005), C.cream2, sx * .37, -.01, -.22);
      add(G.box(.2, .05, .04, .02), C.orange, 0, .05, .05);
    }));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .44 * t; }, { label: '벤치 서랍', sfx: 'drawer', dur: .26 });
    p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: .24, y: -.02, z: .06, parent: dv };
    f.spot('inside', dv, 0, -.1, -.2, { part: p, maxH: .18, label: '벤치 서랍 안', scale: .85 });
  }
};

// ═════════════════════════ 큰 기차 창 ═════════════════════════
// (wall, span 2): a big window with round corners, a wide sill; the landscape flows in it. o.blind: the yellow roll blind (a part,
// rolled half down); o.curtain: the dining car's coral curtains tied back (a part — they close); o.cup: a cup on the sill
B.twindow4 = (f, T, o = {}) => {
  // (the glass starts over the seat backs: the sill's things never stand in a back's top rail)
  const W = 1.74, H = 1.1, cy = 1.82;
  f.noSolid = true; if (o.hung !== false) foldWall(f);
  f.add(mc('twindow4', ({ add }) => {
    for (const sy of [-1, 1]) add(G.box(W + .2, .1, .13, .04), C.cream2, 0, cy + sy * (H / 2 + .05), .06);
    for (const sx of [-1, 1]) add(G.box(.1, H + .2, .13, .04), C.cream2, sx * (W / 2 + .05), cy, .06);
    for (const sy of [-1, 1]) add(G.box(W + .02, .03, .02, .006), '#3a3f4c', 0, cy + sy * (H / 2 - .005), .045);
    for (const sx of [-1, 1]) add(G.box(.03, H - .02, .02, .006), '#3a3f4c', sx * (W / 2 - .005), cy, .045);
    add(G.box(.05, H, .06, .012), C.steel, .12, cy, .05); add(G.box(W - .06, .045, .06, .012), C.steel, 0, cy + H * .2, .05);
    add(G.box(W + .36, .07, .27, .02), C.honey, 0, cy - H / 2 - .1, .13); add(G.box(W + .36, .02, .27, .006), shade(C.honey, -.15), 0, cy - H / 2 - .14, .13);
    for (const sx of [-1, 1]) { add(G.box(.09, .03, .04, .01), C.steel2, sx * .5, cy - H / 2 - .015, .1); add(G.box(.035, .05, .03, .008), C.steel, sx * .5 + .03, cy - H / 2 + .01, .12); }
    add(G.cyl(.05, .05, .006, 14), '#ffd23c', -.66, cy - .42, .047, HP, 0, 0); add(G.box(.09, .06, .006, .012), '#ff9fb8', .62, cy + .46, .047);
  }));
  const tick = flowView(f, W, H, cy, .022);
  // a couple of soft glints on the glass
  f.add(mc('twindow4-glint', ({ add }) => { add(G.box(.05, .5, .004, .002), '#ffffff', -.45, cy + .1, .05, 0, 0, .5); add(G.box(.025, .34, .004, .002), '#ffffff', -.33, cy + .16, .05, 0, 0, .5); }));
  f.tick = tick;
  if (o.cup) f.add(mc('twindow4-cup', ({ add, tube }) => { add(G.cyl(.05, .042, .1, 12), '#ffffff', .55, cy - H / 2 - .015, .16); add(G.cyl(.046, .046, .01, 12), '#c98a52', .55, cy - H / 2 + .032, .16); tube([.6, cy - H / 2 + .0, .16], [.62, cy - H / 2 - .04, .16], .012, '#ffffff', 5); }));
  if (o.blind) {
    const BZ = .3, BW = W + .16;
    f.add(mc('twindow4-roll', ({ add }) => { add(G.cyl(.07, .07, BW + .06, 14), '#e3b247', 0, cy + H / 2 + .11, BZ - .01, 0, 0, HP); for (const s of [-1, 1]) add(G.box(.04, .16, BZ - .02, .01), C.steel, s * (BW / 2 + .05), cy + H / 2 + .11, (BZ - .02) / 2 + .02); }));
    const bl = grp(); put(bl, 0, cy + H / 2 + .11, BZ); f.add(bl);
    bl.add(mc('twindow4-blind', ({ add, tube }) => {
      add(G.box(BW, 1, .012, .004), '#f6d27a', 0, -.5, 0); for (let k = 1; k < 5; k++) add(G.box(BW, .01, .014, .003), '#e9c060', 0, -k * .2, 0);
      add(G.box(BW + .02, .04, .03, .01), '#e3b247', 0, -1, 0); tube([0, -1, .01], [0, -1.08, .02], .006, '#e0d6c0', 4); add(G.tor(.04, .011, PI * 2, 6, 14), '#ffffff', 0, -1.12, .02);
    }));
    bl.scale.y = H * .55;
    const p = f.part('lift', bl, (t, b) => { bl.scale.y = Math.max(.05, H * .55 * (1 - .92 * t)); }, { label: '롤 블라인드', sfx: 'swish', dur: .4 });
    f.spot('inside', null, -.42, cy - H / 2 - .065, .17, { part: p, maxH: .25, label: '블라인드 뒤 창턱', scale: .75 });
  } else f.spot('on', null, o.cup ? -.3 : .2, cy - H / 2 - .065, .17, { maxH: .25, label: '창턱', scale: .78 });
  if (o.curtain) {
    // coral café curtains on a rod, tied back at both sides; the part draws them across (ambient flutter: '커튼')
    f.add(mc('twindow4-rod', ({ add }) => { add(G.cyl(.022, .022, W + .4, 8), C.woodD, 0, cy + H / 2 + .16, .2, 0, 0, HP); for (const s of [-1, 1]) add(G.sph(.04, 8, 6), C.woodD, s * (W / 2 + .2), cy + H / 2 + .16, .2); }));
    const cs = [-1, 1].map(s => {
      const g = grp(); put(g, s * (W / 2 + .08), cy + H / 2 + .14, .2); f.add(g);
      g.add(mc('twindow4-curtain|' + s, ({ add }) => {
        for (let k = 0; k < 4; k++) add(G.box(.11, 1.0, .05, .03), k % 2 ? C.coral : shade(C.coral, .08), -s * k * .085, -.5, (k % 2) * .02);
        add(G.box(.42, .05, .07, .02), C.cream, -s * .13, -.62, .03);
        for (let k = 0; k < 4; k++) add(G.sph(.018, 6, 4), '#ffffff', -s * k * .085, -.2 - (k % 2) * .4, .05);
      }));
      return g;
    });
    // closed = t 1: each side widens over its half of the window
    f.part('curtain', cs, t => { for (const g of cs) g.scale.x = 1 + 1.15 * t; }, { label: '커튼', sfx: 'swish', dur: .35 });
  }
};

// ═════════════════════════ 손잡이 봉·짐 선반·광고 띠 ═════════════════════════
// (wall, along the car): the grab rail on its posts with leather straps and round rings (none over the door), the luggage racks
// over the seats with bags on them — o.cases: the racks' x along the wall; the first one's big coral suitcase comes forward off the
// rack (a part, lockable: 너굴이 hides behind it — "…선반 위는 반칙 아니거든?!"), the second one's backpack lifts; the ads in a row on
// the eave's round, a fan near the end (it turns)
const RAIL = '#aab4c4', RAIL2 = '#8590a3', STRAP = '#6b4a3a', RING = '#f5f1e8';
B.tc4rack = (f, T, o = {}) => {
  const L = o.len || 6.2, RY = 2.18, RZ = .64, racks = o.racks || [-1.2, 1.4], door = o.door || null, FX = o.fan ?? L / 2 - .9;
  f.noSolid = true; f.collideBox = [-L / 2, RY - .05, .45, L / 2, RY + .6, .78]; foldWall(f);
  f.add(mc('tc4-rack|' + L + '|' + racks.join(',') + '|' + (door || []).join(','), ({ add, tube }) => {
    tube([-L / 2, RY, RZ], [L / 2, RY, RZ], .034, RAIL, 12);
    for (const x of [-L / 2, L / 2]) add(G.sph(.038, 10, 8), RAIL2, x, RY, RZ);
    for (const x of [-L / 2 + .25, ...racks.flatMap(r => [r - 1.0, r + 1.0]), L / 2 - .25]) {
      add(G.tor(.038, .011, PI * 2, 6, 14), RAIL2, x, RY, RZ, 0, HP, 0);
      tube([x, RY + .01, RZ - .02], [x, RY + .22, .14], .018, RAIL2, 6); tube([x, RY + .22, .14], [x, RY + .28, .04], .018, RAIL2, 6);
      add(G.cyl(.055, .055, .025, 12), RAIL2, x, RY + .29, .02, HP, 0, 0);
    }
    for (let x = -L / 2 + .45; x < L / 2 - .3; x += .52) {
      if (door && x > door[0] - .1 && x < door[1] + .1) continue;
      add(G.tor(.034, .011, PI * 2, 5, 12), STRAP, x, RY, RZ, 0, HP, 0); add(G.box(.034, .27, .01, .004), STRAP, x, RY - .17, RZ + .036);
      add(G.box(.04, .034, .016, .004), RAIL, x, RY - .1, RZ + .038); add(G.tor(.062, .016, PI * 2, 6, 14), RING, x, RY - .37, RZ + .036);
    }
    // the racks: brackets from the wall, a front rail, slats
    for (const cx of racks) {
      for (const x of [cx - .95, cx + .95]) { add(G.box(.05, .05, .58, .012), C.steel, x, RY + .38, .32); tube([x, RY + .38, .06], [x, RY + .14, .06], .022, C.steel, 6); }
      add(G.box(2.0, .035, .035, .01), C.steel, cx, RY + .38, .6);
      for (let k = 0; k < 7; k++) add(G.box(1.95, .018, .04, .004), shade(C.steel, -.08), cx, RY + .37, .1 + k * .08);
    }
    // the fan's rod up to the eave
    add(G.cyl(.022, .022, .5, 8), C.steel, FX, 3.06, .36); add(G.cyl(.09, .09, .06, 14), C.steel, FX, 2.82, .36); add(G.box(.2, .03, .12, .01), C.steel, FX, 3.3, .3);
  }));
  // the ads on the eave's round (and the light under them)
  const at = adsTex().clone(); at.wrapS = THREE.RepeatWrapping; at.repeat.set(Math.max(1, (L - .4) / 5.6), 1); at.needsUpdate = true;
  const ad = mesh(new THREE.PlaneGeometry(L - .4, .26), basic(at), { cast: false }); put(ad, 0, 2.76, .02); f.add(ad);
  // the bags
  f.add(mc('tc4-rack-bags|' + racks.join(','), ({ add, tube }) => {
    const [a, b] = racks;
    add(G.cyl(.17, .17, .62, 14), '#a2c8bb', a + .55, RY + .56, .34, 0, 0, HP); for (const dx of [-.2, .2]) add(G.cyl(.174, .174, .04, 14), C.tealD, a + .55 + dx, RY + .56, .34, 0, 0, HP);
    for (const z of [.28, .4]) { tube([a + .45, RY + .7, z], [a + .48, RY + .8, z], .014, C.tealD, 6); tube([a + .48, RY + .8, z], [a + .62, RY + .8, z], .014, C.tealD, 6); tube([a + .62, RY + .8, z], [a + .65, RY + .7, z], .014, C.tealD, 6); }
    if (b != null) {
      add(G.cyl(.2, .2, .03, 18), '#ecd08a', b + .55, RY + .41, .32); add(G.cyl(.11, .12, .1, 14), '#f0d896', b + .55, RY + .47, .32); add(G.cyl(.122, .122, .03, 14), C.coral, b + .55, RY + .44, .32);
      add(G.box(.28, .24, .2, .04), '#f3e2c4', b - .7, RY + .52, .3); for (let k = 0; k < 3; k++) add(G.sph(.06, 8, 6), '#f59a2e', b - .76 + k * .07, RY + .67, .3);
    }
  }));
  // the big suitcase on the first rack: it comes forward and tips down (lockable)
  const sc = grp(); put(sc, racks[0] - .35, RY + .39, .34); f.add(sc);
  sc.add(mc('tc4-suitcase', ({ add, tube }) => {
    add(G.box(.62, .44, .34, .07), C.coral, 0, .22, 0); add(G.box(.64, .04, .36, .02), C.coral2, 0, .22, 0);
    for (const x of [-.18, .18]) add(G.box(.04, .44, .36, .01), C.coral2, x, .22, 0);
    tube([-.1, .45, 0], [-.08, .52, 0], .016, C.dark, 6); tube([-.08, .52, 0], [.08, .52, 0], .016, C.dark, 6); tube([.08, .52, 0], [.1, .45, 0], .016, C.dark, 6);
    add(G.box(.14, .1, .01, .03), '#ffd23c', -.12, .3, .175); add(G.cyl(.05, .05, .01, 12), '#8fd3f4', .14, .14, .176, HP, 0, 0); add(G.box(.1, .06, .01, .02), '#ffffff', .08, .32, .176);
  }));
  const p = f.part('lift', sc, (t, b) => { sc.position.z = b.p.z + .36 * t; sc.position.y = b.p.y + .05 * Math.sin(t * PI); sc.rotation.x = .3 * t; }, { label: '짐 선반 여행 가방', sfx: 'lift_fabric', dur: .45 });
  p.lockable = true; p.lockAt = { x: 0, y: .22, z: .18, parent: sc };
  f.spot('on', null, racks[0] - .35, RY + .4, .26, { part: p, maxH: .45, label: '여행 가방 뒤', scale: .95 });
  f.spot('on', null, racks[0] + .5, RY + .4, .3, { maxH: .3, label: '짐 선반 위', scale: .85 });
  if (racks[1] != null) {
    const bp = grp(); put(bp, racks[1] - .05, RY + .39, .3); f.add(bp);
    bp.add(mc('tc4-backpack', ({ add, tube }) => {
      add(G.box(.38, .4, .26, .1), '#5f86c4', 0, .2, 0); add(G.box(.28, .16, .08, .04), '#ffd23c', 0, .14, .14); add(G.box(.2, .02, .01, .004), C.cream, 0, .18, .18);
      tube([-.08, .4, -.02], [0, .47, -.02], .014, C.dark, 5); tube([0, .47, -.02], [.08, .4, -.02], .014, C.dark, 5);
    }));
    const q = f.part('lift', bp, (t, b) => { bp.position.z = b.p.z + .3 * t; bp.rotation.z = .25 * t; }, { label: '배낭', sfx: 'lift_fabric', dur: .35 });
    f.spot('on', null, racks[1] - .05, RY + .4, .18, { part: q, maxH: .32, label: '배낭 뒤', scale: .85 });
  }
  // the fan: three blades on a hub, turning
  const fan = grp(); put(fan, FX, 2.76, .36); f.add(fan);
  fan.add(mc('tc4-fan', ({ add }) => { for (let k = 0; k < 3; k++) { const a = k * PI * 2 / 3; add(G.box(.26, .016, .12, .04), C.tealL, Math.cos(a) * .19, 0, Math.sin(a) * .19, 0, -a, 0); } add(G.sph(.07, 12, 8), C.steel, 0, 0, 0, 0, 0, 0, [1, .6, 1]); }));
  f.live = [fan];
  // a forgotten umbrella hooked on the rail
  f.add(mc('tc4-umb', ({ add, tube }) => {
    const x = L / 2 - 1.75;
    add(G.tor(.044, .013, PI, 6, 10), '#8a5a34', x, RY, RZ, 0, HP, 0); tube([x, RY, RZ + .044], [x, RY - .12, RZ + .044], .011, '#8a5a34', 6);
    const P = [[.006, -.6], [.018, -.56], [.036, -.45], [.05, -.3], [.052, -.15], [.032, -.05], [.012, 0]].map(([r, y]) => new THREE.Vector2(r, y));
    add(new THREE.LatheGeometry(P, 8), '#7cc4a8', x, RY - .16, RZ + .044); add(G.tor(.05, .008, PI * 2, 4, 12), C.tealD, x, RY - .4, RZ + .044, HP, 0, 0);
  }));
  let last = -1;
  f.tick = t => { const fr = Math.floor(t * 30); if (fr === last) return; last = fr; fan.rotation.y = t * 1.8; };
};

// ═════════════════════════ 앞 칸 끝벽 ═════════════════════════
// (wall N of the front car): the route map, the destination board, the cab's sliding door (part; a little cab behind it: the driver's
// seat back, a cap on a hook, the speed lever), the clock, the fire box (part), the stop bell (part)
B.tc4front = (f, T) => {
  const DW = .9, DH = 2.02, DX = -.3, DZ = .2;
  f.noSolid = true;
  f.add(mc('tc4-front2', ({ add, tube }) => {
    add(G.box(DW + .26, DH + .12, .07, .02), C.orange, DX, DH / 2, .035);
    add(G.box(1.0, .24, .07, .03), '#2f2c36', DX, DH + .34, .05);
    // the grab bar, the intercom, the fire box, the clock — right of the door
    add(G.cyl(.024, .024, .7, 8), C.orange, .58, 1.5, .12); for (const y of [1.18, 1.82]) add(G.box(.05, .035, .08, .01), C.steel, .58, y, .08);
    add(G.box(.18, .26, .05, .03), C.cream2, .58, .98, .04);
    add(G.box(.22, .3, .06, .03), '#d9dde6', 1.0, 1.42, .04); add(G.box(.14, .08, .02, .02), C.ink, 1.0, 1.5, .075); for (let k = 0; k < 3; k++) add(G.sph(.012, 6, 4), C.ink, .95 + k * .05, 1.36, .075);
    add(G.box(.46, .58, .12, .03), C.red, 1.2, .55, .06);
    add(G.cyl(.17, .17, .05, 20), C.white, 1.55, 2.32, .03, HP, 0, 0); add(G.tor(.17, .022, PI * 2, 6, 24), C.tealD, 1.55, 2.32, .05);
    add(G.box(.015, .1, .01, .004), C.ink, 1.55, 2.36, .06); add(G.box(.08, .015, .01, .004), C.ink, 1.58, 2.32, .06, 0, 0, .4);
    add(G.box(.26, .26, .012, .03), '#ffffff', -1.65, 1.35, .01); add(G.sph(.05, 10, 8), '#e86a92', -1.65, 1.36, .02, 0, 0, 0, [1, 1, .2]);
    // the yellow line on the floor in front of the door
    add(G.box(DW + .5, .006, .05, .003), '#ffd23c', DX, .006, .55);
  }));
  // the little cab through the doorway: its front window with the track running ahead, the desk, the speed lever, a cap on a hook
  const cab = flat(DW, DH, TX.get('tc4-cab', () => canvasTex(180, 400, (c, W, H) => {
    c.fillStyle = '#3d4250'; c.fillRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 40, 0, 200); g.addColorStop(0, '#8fcdf3'); g.addColorStop(1, '#e6f6fd'); c.fillStyle = g; c.fillRect(14, 40, W - 28, 170);
    c.fillStyle = '#9ccf6e'; c.fillRect(14, 150, W - 28, 60); c.fillStyle = '#b9b3a8'; c.beginPath(); c.moveTo(W / 2 - 6, 150); c.lineTo(W / 2 + 6, 150); c.lineTo(W - 20, 210); c.lineTo(20, 210); c.fill();
    c.strokeStyle = '#7f7a74'; c.lineWidth = 3; c.beginPath(); c.moveTo(W / 2 - 3, 150); c.lineTo(48, 210); c.moveTo(W / 2 + 3, 150); c.lineTo(W - 48, 210); c.stroke();
    c.fillStyle = '#f6b4c7'; for (const [x, y, r] of [[32, 140, 16], [150, 136, 18], [44, 128, 10]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    c.fillStyle = '#2f2c36'; c.fillRect(0, 210, W, 70); c.fillStyle = '#ffd23c'; c.fillRect(30, 228, 18, 10); c.fillStyle = '#7fd6c0'; c.fillRect(60, 228, 30, 14); c.fillStyle = '#ff9f8a'; c.fillRect(104, 226, 14, 14);
    c.fillStyle = '#5b6b7a'; c.fillRect(46, 280, 90, 120);
  })));
  put(cab, DX, DH / 2, .075); f.add(cab);
  f.add(mc('tc4-cab-bits', ({ add }) => { add(G.cyl(.02, .02, .26, 6), C.steel2, DX + .25, 1.0, .1, .5, 0, 0); add(G.sph(.04, 8, 6), C.red, DX + .25, 1.11, .16); add(G.cyl(.08, .09, .05, 14), C.navy, DX - .28, 1.55, .1); add(G.cyl(.11, .11, .012, 14), '#1d2333', DX - .28, 1.53, .13); add(G.box(.035, .035, .03, .008), '#ffd23c', DX - .28, 1.58, .16); }));
  const rt = flat(1.36, .3, routeTex()); put(rt, -1.55, 2.3, .04); f.add(rt);
  const led = flat(.84, .17, ledTex()); put(led, DX, DH + .34, .088); f.add(led);
  const dv = grp(); put(dv, DX, 0, DZ); f.add(dv);
  dv.add(mc('tc4-front-door', ({ add }) => {
    add(G.box(DW - .04, DH - .04, .06, .025), C.mint, 0, DH / 2, 0); add(G.box(.46, .62, .02, .05), C.cream, 0, 1.42, .03); add(G.box(.38, .52, .02, .04), '#bfe3f2', 0, 1.42, .042);
    add(G.box(.04, .36, .05, .01), C.steel, -DW / 2 + .14, 1.0, .045); add(G.box(.2, .06, .01, .02), C.orange, 0, .9, .035);
  }));
  const p = f.part('door', dv, (t, b) => { dv.position.x = b.p.x - .84 * t; }, { label: '운전실 문', sfx: 'slide', dur: .4 });
  f.spot('inside', null, DX + .05, .02, .12, { part: p, maxH: .45, label: '운전실 안', scale: .75 });
  // the fire box's lid (a part with a place on top)
  const lid = grp(); put(lid, 1.2, .84, .125); f.add(lid);
  lid.add(mc('tc4-firebox-lid', ({ add }) => { add(G.box(.4, .5, .03, .02), '#f07a70', 0, -.27, 0); add(G.box(.3, .34, .01, .02), '#ffffff', 0, -.27, .02); add(G.cyl(.05, .05, .02, 12), C.red, 0, -.27, .03, HP, 0, 0); }));
  f.part('door', lid, (t, b) => { lid.rotation.x = -1.2 * t; }, { label: '소화기함', sfx: 'open', dur: .3 });
  f.spot('on', null, 1.2, .88, .08, { maxH: .2, label: '소화기함 위', scale: .6 });
  // the stop bell under the grab bar: a red button that sinks and rings
  const bell = grp(); put(bell, .58, 1.0, .07); f.add(bell);
  bell.add(mc('tc4-bell', ({ add }) => { add(G.cyl(.05, .05, .04, 14), C.red, 0, 0, 0, HP, 0, 0); }));
  f.part('button', bell, (t, b) => { bell.position.z = b.p.z - .02 * Math.sin(t * PI); }, { label: '하차 벨', sfx: 'stationChime', dur: .3 });
};

// ═════════════════════════ 창 쪽 출입문 ═════════════════════════
// (wall, span 1.2): a pair of sliding doors with windows, the yellow step plate in front; open, they show the land going by
B.tc4sidedoor = (f, T) => {
  const DW = 1.0, DH = 2.0;
  f.noSolid = true; foldWall(f);
  f.add(mc('tc4-sidedoor', ({ add, tube }) => {
    add(G.box(DW + .2, DH + .1, .06, .02), C.steel, 0, DH / 2, .03); add(G.box(DW + .26, .1, .08, .02), C.cream2, 0, DH + .1, .05);
    add(G.box(DW + .1, .02, .5, .006), '#ffd23c', 0, .012, .27); for (let k = 0; k < 6; k++) add(G.box(DW, .006, .02, .002), '#d9ac2a', 0, .024, .08 + k * .07);
    for (const s of [-1, 1]) { tube([s * (DW / 2 + .14), .9, .1], [s * (DW / 2 + .14), 1.6, .1], .022, RAIL, 8); for (const y of [.9, 1.6]) tube([s * (DW / 2 + .14), y, .1], [s * (DW / 2 + .14), y, .02], .018, RAIL2, 6); }
  }));
  // the land outside the doorway (seen when the doors slide open)
  const tick = flowView(f, DW, DH - .1, (DH - .1) / 2 + .02, .012);
  const leaves = [-1, 1].map(s => {
    const g = grp(); put(g, s * DW / 4, 0, .07); f.add(g);
    g.add(mc('tc4-sideleaf|' + s, ({ add }) => {
      add(G.box(DW / 2 - .01, DH - .02, .045, .02), C.cream, 0, DH / 2, 0); add(G.box(DW / 2 - .16, .7, .02, .04), '#cfe9f5', 0, 1.35, .025);
      add(G.box(DW / 2 - .1, .78, .01, .04), C.steel2, 0, 1.35, .018); add(G.box(.18, .1, .01, .02), '#ffd23c', s * .05, .95, .025);
      add(G.box(.025, DH - .1, .03, .01), '#3a3f4c', -s * (DW / 4 - .01), DH / 2, .02);
    }));
    return g;
  });
  f.part('door', leaves, (t, a, b) => { leaves[0].position.x = a.p.x - .4 * t; leaves[1].position.x = b.p.x + .4 * t; }, { label: '출입문', sfx: 'slide', dur: .45 });
  f.spot('on', null, .3, .025, .3, { maxH: .3, label: '출입문 발판', scale: .85 });
  f.tick = tick;
};

// ═════════════════════════ 칸 사이 낮은 끝벽 ═════════════════════════
// (at a car's inner end, across the car; o.end 1 = the front car's back end (the gangway at local +z), -1 = the back car's front end
// (the gangway at local -z)): low on the open side so the next car stays in view, a narrow tall column by the window wall with the
// car's sign and a fire box (it folds with the window wall), the doorway's steel frame. o.door: the gangway door in this doorway — a
// mint sliding leaf (lockable) that hides the gangway; behind it, a place big enough for 너굴이
B.tc4endwall = (f, T, o = {}) => {
  const s = o.end === -1 ? -1 : 1, DWH = .62, inC = -s;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  f.walkBoxes = [[X0, 0, -.07, -DWH - .05, 2.8, .07], [DWH + .05, 0, -.07, CW / 2, .6, .07]];
  f.add(mc('tc4-endwall2|' + s, ({ add }) => {
    add(G.box(-DWH - X0 - .8, .58, .14, .03), C.cream, (X0 + .8 - DWH) / 2, .29, 0); add(G.box(-DWH - X0 - .76, .05, .18, .02), C.orange, (X0 + .8 - DWH) / 2, .6, 0);
    add(G.box(CW / 2 - DWH, .58, .14, .03), C.cream, (CW / 2 + DWH) / 2, .29, 0); add(G.box(CW / 2 - DWH + .04, .05, .18, .02), C.orange, (CW / 2 + DWH) / 2, .6, 0);
    for (const sx of [-1, 1]) add(G.box(.08, 2.1, .2, .02), C.steel, sx * (DWH + .02), 1.05, 0);
    add(G.box(DWH * 2 + .2, .08, .2, .02), C.steel, 0, 2.12, 0);
    add(G.box(DWH * 2, .012, .2, .004), '#ffd23c', 0, .006, inC * .16);
  }));
  const col = grp(); f.add(col); f.live = [col];
  col.add(mc('tc4-endcol|' + s, ({ add }) => {
    add(G.box(.8, 2.8, .14, .03), C.cream, X0 + .4, 1.4, 0); add(G.box(.84, .07, .18, .02), C.orange, X0 + .42, 2.82, 0);
    add(G.box(.42, .5, .1, .03), C.red, X0 + .4, .55, inC * .1); add(G.box(.3, .36, .01, .02), '#ffffff', X0 + .4, .58, inC * .155);
  }));
  const sg = flat(.6, .2, TX.get('tc4-carsign|' + s, () => textTex(384, 128, (c, W, H) => { c.fillStyle = C.tealD; c.fillRect(0, 0, W, H); fitText(c, s === 1 ? '식당칸' : '1호차', W / 2, H / 2, W * .8, 30, '#ffffff', { weight: '700' }); })));
  put(sg, X0 + .4, 2.35, inC * .075, 0, s === 1 ? PI : 0); col.add(sg);
  let k = 1;
  f.updateView = (W, dt = 1 / 60) => {
    if (!W || !Number.isFinite(W.yaw)) return;
    const want = Math.sin(W.yaw) < -.18 ? 0 : 1, k0 = k;
    k += (want - k) * (1 - Math.exp(-Math.max(0, dt) * 12)); if (Math.abs(k - want) < .002) k = want;
    if (k !== k0) { col.scale.y = .2 + .8 * k; W.shadowDirty = true; }
  };
  f.spot('on', null, (CW / 2 + DWH) / 2 + .3, .63, 0, { maxH: .25, label: '칸 끝벽', scale: .7 });
  if (o.door) {
    const dv = grp(); put(dv, 0, 0, inC * .1); f.add(dv);
    dv.add(mc('tc4-gangdoor', ({ add }) => {
      add(G.box(1.2, 2.04, .05, .025), C.mint, 0, 1.02, 0); add(G.box(.52, .62, .02, .05), C.cream, 0, 1.44, inC * .026); add(G.box(.44, .52, .02, .04), '#cfe9f5', 0, 1.44, inC * .036);
      add(G.box(.035, .34, .04, .01), C.steel, .46, 1.0, inC * .03); add(G.box(.26, .08, .01, .02), C.orange, 0, .64, inC * .03);
    }));
    const p = f.part('door', dv, (t, b) => { dv.position.x = b.p.x - 1.08 * t; }, { label: '연결 통로 문', sfx: 'slide', dur: .4 });
    p.lockable = true; p.lockKind = 'code'; p.lockAt = { x: .34, y: 1.02, z: inC * .05, parent: dv };
    f.spot('inside', null, .05, .02, -inC * .55, { part: p, maxH: .62, label: '연결 통로 안', scale: 1 });
  }
};

// ═════════════════════════ 연결 통로 ═════════════════════════
// (the 1 m between the cars, the floor between them cut away but for the 1 m walk across): a tread-plate floor, rubber bellows — the
// far side tall, the near side low; the near bellows "출렁" — a tap and its two halves bulge apart, something hides between them
B.tc4gangway = (f, T) => {
  const HW = .53, HL = .48;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  f.walkBoxes = [[-HW - .14, 0, -HL, -HW, 2.4, HL], [HW, 0, -HL, HW + .14, 1.3, HL]];
  f.add(mc('tc4-gangway2', ({ add, tube }) => {
    add(G.box(1.4, .5, 1.0, .05), '#3c3a46', 0, -.32, 0);
    for (const z of [-HL + .03, HL - .03]) add(G.box(1.04, .012, .05, .004), '#ffd23c', 0, .014, z);
    // the far bellows: tall rubber folds, its top cap, a handrail inside
    for (let k = 0; k < 7; k++) { const z = -HL + .06 + k * .14; add(G.box(.13, 2.3, .09, .03), k % 2 ? C.rubber : C.rubber2, -HW - .07 - (k % 2 ? .02 : -.02), 1.15, z); }
    add(G.box(.28, .1, 1.0, .03), C.dark, -HW - .07, 2.33, 0);
    tube([-HW + .04, .95, -HL + .1], [-HW + .04, .95, HL - .1], .025, C.steel, 8);
    for (const z of [-HL + .1, HL - .1]) tube([-HW + .04, .95, z], [-HW - .04, .95, z], .02, C.steel2, 6);
    // a forgotten red umbrella leaning in the corner
    tube([-.36, .02, -.32], [-.46, .9, -.38], .03, '#e8574a', 8); add(G.tor(.05, .014, PI, 6, 10), '#8a5a34', -.44, .94, -.38, 0, HP, 0);
  }));
  const tf = flat(1.04, .96, treadTex()); put(tf, 0, .006, 0, -HP); f.add(tf);
  const halves = [-1, 1].map(sd => {
    const g = grp(); put(g, HW + .07, 0, sd * HL / 2); f.add(g);
    g.add(mc('tc4-bellow2|' + sd, ({ add }) => {
      for (let k = 0; k < 4; k++) { const z = -HL / 2 + .06 + k * .12; add(G.box(.14, 1.2, .08, .03), k % 2 ? C.rubber : C.rubber2, (k % 2 ? .02 : -.02), .6, z); }
      add(G.box(.24, .08, HL, .03), C.dark, 0, 1.24, 0);
    }));
    return g;
  });
  const bp = f.part('lift', halves, (t, a, b) => {
    const w = Math.sin(t * PI) * .06;
    halves[0].position.z = a.p.z - .24 * t; halves[1].position.z = b.p.z + .24 * t;
    for (const g of halves) { g.scale.x = 1 + .5 * t + w * 4; g.rotation.z = -.12 * t - w; }
  }, { label: '고무 주름막', sfx: 'rustle', dur: .45 });
  f.spot('inside', null, HW + .06, .02, 0, { part: bp, maxH: .5, label: '주름막 사이', scale: .9 });
};

// ═════════════════════════ 간식 카트 ═════════════════════════
// (1×1): a steel trolley, a teal box with a cream lid (a combination lock), rice balls and drinks on top, snack bags hung on the side
B.tc4cart = (f, T) => {
  const W = .78, D = .5, TY = .78;
  f.add(mc('tc4-cart', ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(G.cyl(.02, .02, TY - .05, 8), C.steel, sx * W / 2, (TY - .05) / 2 + .07, sz * D / 2); add(G.sph(.045, 8, 6), C.dark, sx * W / 2, .045, sz * D / 2); }
    add(G.box(W, .025, D, .01), C.steel, 0, .3, 0); add(G.box(.36, .12, .3, .02), '#e9dcc2', -.12, .37, 0); for (let k = 0; k < 3; k++) add(G.cyl(.04, .045, .16, 10), ['#bfe6c4', '#ffd8a8', '#cde8ff'][k], .18 + k * .09, .39, .04);
    add(cutFace(G.box(W + .04, .26, D + .04, .04)), C.teal, 0, TY + .02, 0); add(liner(W - .04, .14, D - .04), C.tealD, 0, TY + .08, 0); add(G.box(W + .06, .04, D + .06, .015), C.orange, 0, TY - .1, 0);
    tube([-W / 2 - .02, TY + .1, D / 2], [-W / 2 - .16, TY + .22, D / 2], .016, C.steel, 6); tube([-W / 2 - .02, TY + .1, -D / 2], [-W / 2 - .16, TY + .22, -D / 2], .016, C.steel, 6); tube([-W / 2 - .16, TY + .22, -D / 2], [-W / 2 - .16, TY + .22, D / 2], .016, C.steel, 6);
    // the snack bags clipped along the side
    for (let k = 0; k < 4; k++) { add(G.box(.13, .17, .03, .02), ['#ff9f8a', '#ffd23c', '#9be38f', '#8fd3f4'][k], -.27 + k * .18, TY - .02, D / 2 + .04); add(G.box(.13, .02, .035, .005), C.steel2, -.27 + k * .18, TY + .07, D / 2 + .04); }
  }));
  const lid = grp(); put(lid, 0, TY + .15, -D / 2 - .02); f.add(lid);
  lid.add(mc('tc4-cart-lid', ({ add }) => {
    add(G.box(W + .08, .05, D + .08, .025), C.cream, 0, .025, D / 2 + .02); add(G.box(.14, .03, .03, .01), C.orange, 0, .04, D + .07);
    for (let k = 0; k < 3; k++) { add(G.box(.12, .1, .02, .03), '#ffffff', -.22 + k * .2, .1, D / 2, -.5, 0, 0); add(G.box(.12, .04, .025, .015), C.ink, -.22 + k * .2, .07, D / 2 + .01, -.5, 0, 0); }
    add(G.cyl(.05, .05, .2, 12), '#e9e2d4', .32, .13, D / 2 + .08); add(G.cyl(.052, .052, .04, 12), C.red, .32, .25, D / 2 + .08);
  }));
  const p = f.part('lid', lid, (t, b) => { lid.rotation.x = -1.5 * t; }, { label: '간식 카트 뚜껑', sfx: 'open', dur: .3 });
  p.lockable = true; p.lockKind = 'code'; f.lockAt = { x: 0, y: TY + .02, z: D / 2 + .04 };
  f.pullOut(p, f.spot('inside', null, 0, TY + .02, 0, { part: p, maxH: .2, label: '간식 카트 안', scale: .85 }), 0, { w: .26, d: .2, up: .16, color: '#fff3c8' });
  f.spot('on', null, .05, .315, -.12, { maxH: .26, label: '카트 아래 칸', scale: .8 });
};

// ═════════════════════════ 식당칸 마주보기 자리 ═════════════════════════
// (2.2 along the wall × 1.4 out, its back to the wall at local -z): two coral benches facing each other across a wooden table with a
// cream runner — a little lamp, a teapot and cups, a bento, a vase; the near seat's cushion lifts (a box under it)
B.tc4booth = (f, T, o = {}) => {
  const SY = .46, TX0 = 0, TZ = -.05, TW = .74, TD = 1.0;
  f.add(mc('tc4-booth', ({ add, tube }) => {
    for (const s of [-1, 1]) {
      const x = s * .78;
      add(G.box(.5, SY - .14, 1.1, .03), C.wood, x, (SY - .14) / 2, -.1);
      add(G.box(.5, .16, 1.12, .07), C.coral, x, SY - .05, -.1);
      add(G.box(.18, .64, 1.12, .08), C.coral2, x + s * .24, SY + .34, -.1);
      add(G.box(.24, .06, 1.16, .02), C.wood, x + s * .25, SY + .69, -.1);
      for (const z of [-.45, -.1, .25]) add(G.sph(.022, 6, 5), C.cream, x + s * .145, SY + .38, z);
    }
    add(G.cyl(.06, .08, .66, 10), C.woodD, TX0, .33, TZ); add(G.cyl(.24, .28, .04, 16), C.woodD, TX0, .02, TZ);
    add(G.box(TW, .06, TD, .03), C.wood, TX0, .69, TZ); add(G.box(TW - .3, .012, TD - .1, .004), C.cream, TX0, .727, TZ);
    for (let k = 0; k < 5; k++) add(G.box(TW - .3, .013, .015, .002), C.coral, TX0, .728, TZ - .4 + k * .2);
    // the lamp at the window end, a teapot and two cups, a bento in its box, a little vase of flowers
    add(G.cyl(.05, .07, .04, 12), C.woodD, 0, .74, -.52); add(G.cyl(.012, .012, .22, 6), C.woodD, 0, .86, -.52); add(G.cyl(.06, .12, .12, 14), C.yellow, 0, 1.0, -.52);
    add(G.sph(.08, 12, 8), C.white, -.15, .79, -.05, 0, 0, 0, [1, .85, 1]); add(G.cyl(.02, .025, .05, 6), C.white, -.15, .87, -.05); tube([-.08, .78, -.05], [-.02, .83, -.05], .012, C.white, 5);
    for (const [x, z] of [[.17, .22], [-.2, .28]]) { add(G.cyl(.04, .032, .07, 10), '#e7f2ec', x, .765, z); add(G.cyl(.041, .041, .006, 10), '#9cc77a', x, .8, z); }
    add(G.box(.22, .06, .16, .02), '#2f2a35', .15, .76, -.12); add(G.box(.2, .02, .14, .01), C.red, .15, .795, -.12);
    add(G.cyl(.035, .045, .1, 10), '#bfe3f2', -.2, .78, -.4); for (let k = 0; k < 3; k++) add(G.sph(.03, 6, 5), ['#ff9fb8', '#ffd23c', '#ffffff'][k], -.2 + (k - 1) * .03, .86 + (k % 2) * .02, -.4);
  }));
  // the coral fabric on both seats
  const cf = moquette(C.coral, '#ffe1d6');
  for (const s of [-1, 1]) { const p = flat(.4, 1.0, cf); put(p, s * .78, SY + .035, -.1, -HP); f.add(p); }
  // the near seat's cushion lifts: a box under it
  const cu = grp(); put(cu, .78, SY - .05, -.1); f.add(cu);
  cu.add(mc('tc4-booth-cushion', ({ add }) => { add(G.box(.46, .03, 1.04, .01), C.coral2, 0, .06, 0); }));
  const p = f.part('lift', cu, (t, b) => { cu.position.y = b.p.y + .18 * t; cu.rotation.z = .5 * t; }, { label: '방석', sfx: 'lift_fabric', dur: .3 });
  p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: -.2, y: .06, z: .52, parent: cu };
  f.spot('inside', null, .78, SY - .17, -.1, { part: p, maxH: .14, label: '방석 밑', scale: .8 });
  f.spot('on', null, .05, .735, .05, { maxH: .3, label: '식당칸 테이블 위', scale: .9 });
  f.spot('on', null, -.78, SY + .05, .15, { maxH: .32, label: '식당칸 자리', scale: .9 });
  f.spot('under', null, .1, .01, .45, { maxH: .3, label: '테이블 밑', scale: .85 });
};

// ═════════════════════════ 역 도시락 매대 ═════════════════════════
// (1.8 × .7, its counter to local -z, its drawers to local +z): wooden top, stacks of bento boxes, a basket of mandarins, the hot
// water urn and cups, a glass case of bread (its lid lifts), the price board; the drawer (padlock)
B.tc4counter = (f, T) => {
  const W = 1.8, D = .66, TY = .9;
  f.add(mc('tc4-counter', ({ add, tube }) => {
    // (10/29 사용자 "책상 서랍 열리는 데 구멍 좀 뚫어라": the drawer ran into the solid body — a hole behind it, lined; the drawer front covers it shut)
    add(holeFace(G.box(W, TY - .06, D, .04), [[-.735, .035, -.015, .27]]), C.cream, 0, (TY - .06) / 2, 0); add(liner(.77, .285, .54, 'z'), shade(C.cream, -.25), -.35, .5475, .06);
    add(G.box(W + .02, .1, D + .02, .03), C.teal, 0, .08, 0);
    add(G.box(W + .1, .06, D + .12, .03), C.wood, 0, TY - .02, 0); add(G.box(W + .12, .02, D + .14, .01), C.woodD, 0, TY - .055, 0);
    for (const x of [-.6, .6]) add(G.box(.02, TY - .2, .02, .005), C.cream2, x, TY / 2, D / 2 + .005);
    // bento stacks wrapped in paper with a band
    for (const [x, z, n, c] of [[-.7, -.05, 3, '#fbe3c4'], [-.42, -.08, 2, '#e6f2dc'], [-.55, .18, 2, '#ffe1e8']]) for (let k = 0; k < n; k++) { add(G.box(.24, .07, .18, .015), c, x, TY + .04 + k * .075, z); add(G.box(.04, .072, .182, .004), C.red, x, TY + .04 + k * .075, z); }
    // mandarins in a basket
    add(G.cyl(.16, .13, .1, 14), '#c99a5e', -.12, TY + .06, .12); for (let k = 0; k < 7; k++) add(G.sph(.055, 10, 8), '#f59a2e', -.12 + Math.cos(k * 2.4) * .08 * (k ? 1 : 0), TY + .13 + (k ? 0 : .04), .12 + Math.sin(k * 2.4) * .07 * (k ? 1 : 0));
    // the hot water urn and three cups
    add(G.cyl(.13, .14, .34, 16), C.steel, .45, TY + .19, -.1); add(G.cyl(.14, .14, .04, 16), C.tealD, .45, TY + .38, -.1); add(G.cyl(.03, .03, .05, 8), C.dark, .45, TY + .42, -.1); tube([.45, TY + .1, .04], [.45, TY + .1, .12], .02, C.dark, 6);
    for (let k = 0; k < 3; k++) add(G.cyl(.04, .032, .07, 10), '#ffffff', .72, TY + .04 + k * .06, .12, 0, 0, 0);
    // under the top on the counter's front: crates of bottles
    for (const x of [-.45, .35]) { add(G.box(.5, .2, .2, .02), '#d9b27c', x, .2, -D / 2 - .02); for (let k = 0; k < 4; k++) add(G.cyl(.03, .03, .18, 8), ['#9be38f', '#ffd8a8', '#cde8ff', '#ff9f8a'][k], x - .17 + k * .11, .36, -D / 2 - .02); }
  }));
  // the price board on a little stand
  for (const [dz, ry] of [[-.004, PI], [.004, 0]]) { const mb = flat(.6, .15, menuTex()); put(mb, -.05, TY + .55, -D / 2 + .06 + dz, 0, ry); f.add(mb); }
  f.add(mc('tc4-counter-board', ({ add }) => { for (const x of [-.32, .22]) add(G.cyl(.012, .012, .5, 6), C.woodD, x, TY + .27, -D / 2 + .06); }));
  // the bread case: glass box whose lid lifts
  f.add(mc('tc4-breadcase', ({ add }) => {
    add(G.box(.5, .03, .32, .01), C.wood, .55, TY + .015, .16 - .25);
    for (const [x, c] of [[.42, '#e6b066'], [.55, '#d99a4e'], [.68, '#f0c27a']]) add(G.sph(.06, 10, 8), c, x, TY + .07, -.09, 0, 0, 0, [1.3, .8, 1]);
  }));
  const cs = grp(); put(cs, .55, TY + .03, -.25); f.add(cs);
  cs.add(mc('tc4-breadcase-lid', ({ add }) => {
    for (const sx of [-1, 1]) add(G.box(.015, .18, .3, .004), '#dff1f6', sx * .24, .09, .16); add(G.box(.5, .18, .015, .004), '#dff1f6', 0, .09, .31); add(G.box(.5, .18, .015, .004), '#dff1f6', 0, .09, .01);
    add(G.box(.5, .02, .32, .006), '#e8f5f8', 0, .18, .16); add(G.box(.08, .03, .03, .01), C.orange, 0, .2, .32);
  }));
  for (const m of cs.children) if (m.material) { m.material = mat('#e8f6fa', { opacity: .55 }); m.castShadow = false; }
  const q = f.part('lift', cs, (t, b) => { cs.rotation.x = -1.2 * t; }, { label: '빵 진열장', sfx: 'open', dur: .3 });
  f.spot('inside', null, .55, TY + .035, -.06, { part: q, maxH: .14, label: '빵 진열장 안', scale: .7 });
  f.spot('on', null, .1, TY + .01, -.12, { maxH: .3, label: '매대 위', scale: .9 });
  // the drawer on the drawers' side (+z)
  const dv = grp(); put(dv, -.35, .55, D / 2 - .01); f.add(dv);
  dv.add(mc('tc4-counter-drawer', ({ add }) => {
    add(G.box(.8, .3, .04, .015), C.teal, 0, 0, .02); add(G.box(.74, .02, .52, .006), C.cream2, 0, -.13, -.25); for (const sx of [-1, 1]) add(G.box(.02, .22, .52, .006), C.cream2, sx * .36, -.03, -.25);
    add(G.box(.22, .05, .04, .02), C.orange, 0, .05, .05);
  }));
  const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .42 * t; }, { label: '매대 서랍', sfx: 'drawer', dur: .26 });
  p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: .24, y: -.02, z: .06, parent: dv };
  f.spot('inside', dv, 0, -.12, -.24, { part: p, maxH: .2, label: '매대 서랍 안', scale: .85 });
};

// ═════════════════════════ 꼬리 칸 전망 소파·끝 난간·바닥 짐 ═════════════════════════
// a two-seat sofa at the tail, looking out at the track running away (its back to local -z), a round side table and a potted plant
B.tc4sofa = (f, T) => {
  f.add(mc('tc4-sofa', ({ add, tube }) => {
    add(G.box(1.5, .26, .7, .05), C.woodD, 0, .17, 0); add(G.box(1.42, .17, .66, .08), C.cream, 0, .38, .02);
    add(G.box(1.5, .5, .2, .09), C.teal, 0, .62, -.27, -.12, 0, 0); for (const s of [-1, 1]) add(G.box(.16, .36, .7, .07), C.teal, s * .72, .45, 0);
    for (const x of [-.35, .35]) add(G.box(.42, .3, .1, .06), [C.coral, C.yellow][x > 0 ? 1 : 0], x, .58, -.12, -.2, 0, 0);
    add(G.cyl(.2, .2, .03, 18), C.wood, 1.08, .52, .1); add(G.cyl(.025, .025, .5, 8), C.woodD, 1.08, .26, .1); add(G.cyl(.14, .16, .02, 14), C.woodD, 1.08, .01, .1);
    add(G.cyl(.04, .032, .07, 10), '#ffffff', 1.03, .57, .14); add(G.cyl(.08, .07, .12, 12), '#d9805a', 1.5, .06, -.15);
    for (let k = 0; k < 5; k++) add(G.sph(.08, 8, 6), k % 2 ? '#5fae58' : '#7cc46a', 1.5 + Math.cos(k * 1.3) * .06, .2 + k * .05, -.15 + Math.sin(k * 1.3) * .05);
  }));
  f.spot('on', null, -.3, .47, .05, { maxH: .34, label: '소파 위', scale: .9 });
  f.spot('under', null, .3, .01, .4, { maxH: .2, label: '소파 밑', scale: .8 });
  f.spot('on', null, 1.08, .54, .08, { maxH: .24, label: '탁자 위', scale: .7 });
};
// the tail's low end: a rail at knee height across the cut end with a gap for nobody (the car ends here), a little flag
B.tc4tail = (f, T) => {
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0]; f.walkBoxes = [[-CW / 2, 0, -.08, CW / 2, .6, .08]];
  f.add(mc('tc4-tail', ({ add, tube }) => {
    add(G.box(CW, .32, .12, .03), C.cream, 0, .16, 0); add(G.box(CW + .04, .05, .16, .02), C.orange, 0, .34, 0);
    tube([-CW / 2 + .05, .62, 0], [CW / 2 - .05, .62, 0], .028, C.steel, 10); for (let x = -CW / 2 + .1; x < CW / 2; x += .5) tube([x, .36, 0], [x, .62, 0], .02, C.steel, 6);
    tube([CW / 2 - .25, .36, 0], [CW / 2 - .25, 1.5, 0], .018, C.woodD, 6); add(G.box(.32, .2, .01, .01), C.coral, CW / 2 - .09, 1.38, 0);
    add(G.box(.14, .08, .012, .005), C.cream, CW / 2 - .1, 1.39, .008);
  }));
};
// a pile of travel luggage on the floor: an upright suitcase, a duffel, a paper bag with a leek and a baguette sticking out
B.tc4luggage = (f, T) => {
  f.add(mc('tc4-luggage', ({ add, tube }) => {
    add(G.box(.42, .62, .26, .06), '#5f86c4', -.15, .35, -.05); for (const x of [-.27, -.03]) add(G.box(.03, .62, .27, .01), '#4a6ea8', x, .35, -.05);
    tube([-.22, .66, -.05], [-.22, .86, -.05], .014, C.steel2, 6); tube([-.08, .66, -.05], [-.08, .86, -.05], .014, C.steel2, 6); tube([-.22, .86, -.05], [-.08, .86, -.05], .016, C.dark, 6);
    for (const x of [-.3, 0]) add(G.cyl(.03, .03, .04, 8), C.dark, x, .03, .05, 0, 0, HP);
    add(G.cyl(.15, .15, .5, 14), C.coral, .26, .15, .1, 0, .3, HP); for (const d of [-.16, .16]) add(G.cyl(.155, .155, .03, 14), C.coral2, .26 + Math.cos(.3) * d, .15, .1 - Math.sin(.3) * d, 0, .3, HP);
    add(G.box(.22, .28, .14, .02), '#d9b27c', .18, .14, -.18); add(G.cyl(.02, .02, .3, 6), '#7cc46a', .14, .38, -.18, .1, 0, .1); add(G.cyl(.035, .03, .3, 8), '#e6b066', .23, .36, -.2, -.15, 0, -.2);
  }));
  f.spot('on', null, -.15, .66, -.05, { maxH: .26, label: '여행 짐 위', scale: .8 });
  f.spot('on', null, .3, .01, -.18, { maxH: .3, label: '가방 옆', scale: .85 });
};

// ═════════════════════════ 패럴랙스 바깥 (the land going by) ═════════════════════════
// The train runs toward -z; the land slides toward +z, each band at its own speed — near fast, far slow. No island under it (허브 10/23:
// a cut earth block read as a still island): the track's ballast and sleepers run on past the screen, the land on either side is a strip
// that thins into the sky-blue haze. Only the near things are crisp (poles and their bushes, the fence, the verge's flowers — ink lines);
// the village and the far round mountains are pale, mixed toward the sky and drawn without ink, so the eye stays on the train.
//   behind (−x): poles, bushes, a crossing post (4.6 m/s) · pale farmhouses, cherry trees, paddies (1.6) · far mountains (0.35) · clouds
//   under the train: sleepers and ballast (5.4) · in front (+x): the verge — flowers and a fence (4.8) — then a grass band streaming by
// A band is either one periodic mesh moved within its period (sleepers, poles, fence — nothing ever jumps) or a few chunks of varied land
// that wrap round the loop; all of it is built the first time the stage is drawn.
const SLAB = { y: -1.72, z: 30 };
const LOOP = 60, NCH = 5, CH = LOOP / NCH;
const SCN = { track: 5.4, poles: 4.6, verge: 4.8, village: 1.6, mountains: .35, clouds: .15, grass: 4.8, meadow: 2.2 };
const SKYC = new THREE.Color('#cfe9f7');
// a colour as seen through the haze: k of the way to the sky's colour, a little greyer
const haze = (hex, k) => { if (!k) return hex; const c = new THREE.Color(hex), hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s * (1 - .45 * k), hsl.l); c.lerp(SKYC, k); return '#' + c.getHexString(); };
const groundTex = (key, a, b, n = 140, r0 = 3, r1 = 9, extra = null) => TX.get('tc4-g|' + key, () => canvasTex(256, 256, (c, W, H) => {
  c.fillStyle = a; c.fillRect(0, 0, W, H);
  const R = RNG(key.length * 97 + n); c.fillStyle = b;
  for (let i = 0; i < n; i++) { c.globalAlpha = .25 + R() * .4; c.beginPath(); c.ellipse(R() * W, R() * H, r0 + R() * (r1 - r0), (r0 + R() * (r1 - r0)) * .6, R() * 3, 0, 7); c.fill(); }
  c.globalAlpha = 1; if (extra) extra(c, W, H, R);
}, { repeat: [1, 1] }));
// a strip of land thinning into the haze across its width (u 0 = by the track, 1 = gone): grass, streaks of flowers along the run
const fadeTex = (key, a, b, dots) => TX.get('tc4-fade|' + key, () => canvasTex(256, 256, (c, W, H) => {
  const R = RNG(key.length * 31 + 7);
  c.fillStyle = a; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { c.fillStyle = R() < .7 ? b : dots[Math.floor(R() * dots.length)]; c.globalAlpha = .35 + R() * .45; c.fillRect(R() * W, R() * H, 3 + R() * 10, 2 + R() * 3); }
  c.globalAlpha = 1;
  // the fade: the picture's alpha falls away across u (destination-in keeps what is under a gradient)
  c.globalCompositeOperation = 'destination-in';
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.35, 'rgba(0,0,0,.92)'); g.addColorStop(.75, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
}));
const ballastTex = () => TX.get('tc4-ballast', () => canvasTex(256, 256, (c, W, H) => {
  c.fillStyle = '#b9b3a8'; c.fillRect(0, 0, W, H);
  const R = RNG(5); for (let i = 0; i < 700; i++) { c.fillStyle = ['#a39d93', '#cfc9be', '#9a9389', '#d9d4ca'][i % 4]; c.beginPath(); c.ellipse(R() * W, R() * H, 2 + R() * 4, 1.5 + R() * 3, R() * 3, 0, 7); c.fill(); }
}, { repeat: [1, 1] }));
const lp = { tree(add, x, y, z, s = 1, a = '#6fb85e', b = '#8fd07a') { add(G.cyl(.07 * s, .09 * s, .55 * s, 6), '#8a6044', x, y + .27 * s, z); add(G.sph(.44 * s, 7, 4), a, x, y + .8 * s, z, 0, 0, 0, [1, .9, 1]); add(G.sph(.3 * s, 6, 4), b, x - .18 * s, y + 1.0 * s, z + .12 * s); add(G.sph(.28 * s, 6, 4), a, x + .24 * s, y + .66 * s, z - .1 * s); },
  cherry(add, x, y, z, s = 1) { add(G.cyl(.07 * s, .1 * s, .6 * s, 6), '#7a5340', x, y + .3 * s, z); for (const [dx, dy, dz, r, c] of [[0, .9, 0, .46, '#f6b4c7'], [-.3, .78, .16, .3, '#f9c9d6'], [.3, .8, -.1, .32, '#f29ab3'], [.05, 1.15, .05, .3, '#fde2ea']]) add(G.sph(r * s, 7, 4), c, x + dx * s, y + dy * s, z + dz * s); },
  bush(add, x, y, z, s = 1, c = '#5fae58') { add(G.sph(.3 * s, 6, 4), c, x, y + .14 * s, z, 0, 0, 0, [1.2, .75, 1]); add(G.sph(.2 * s, 6, 5), shade(c, .12), x + .18 * s, y + .2 * s, z + .05 * s); },
  flowers(add, x, y, z, R, n = 5) { for (let k = 0; k < n; k++) add(G.pbox(.09, .07, .09), ['#ffffff', '#ffd23c', '#ff9fb8', '#c9a7ff'][Math.floor(R() * 4)], x + (R() - .5) * .7, y + .05, z + (R() - .5) * .7); },
  house(add, x, y, z, s, wall, roof, along) {
    const w = (along ? 1.5 : 2.0) * s, d = (along ? 2.0 : 1.5) * s, h = 1.0 * s, a = .52, rw = (along ? w : d) / 2 + .2 * s, rl = (along ? d : w) + .3 * s, rise = (along ? w : d) / 2 * Math.tan(a);
    add(G.pbox(w, h, d), wall, x, y + h / 2, z);
    const sh = new THREE.Shape(), hw = (along ? w : d) / 2; sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(0, rise); sh.lineTo(-hw, 0);
    const gg = G.ext(sh, along ? d : w, 0, 1); gg.translate(0, 0, -(along ? d : w) / 2); if (!along) gg.rotateY(HP); add(gg, wall, x, y + h, z);
    for (const sd of [-1, 1]) { if (along) add(G.pbox(rw / Math.cos(a), .09 * s, rl), roof, x + sd * rw / 2 * .98, y + h + rise / 2 + .05 * s, z, 0, 0, -sd * a); else add(G.pbox(rl, .09 * s, rw / Math.cos(a)), roof, x, y + h + rise / 2 + .05 * s, z + sd * rw / 2 * .98, sd * a, 0, 0); }
    add(G.pbox(along ? .1 * s : rl * .98, .1 * s, along ? rl * .98 : .1 * s), shade(roof, -.15), x, y + h + rise + .04 * s, z);
    // a door and two windows on the side that faces the track (+x)
    if (along) { add(G.pbox(.04, .5 * s, .34 * s), '#8a6044', x + w / 2 + .01, y + .25 * s, z - .4 * s); for (const dz of [.15, .6]) add(G.pbox(.04, .26 * s, .3 * s), '#9fd3ec', x + w / 2 + .01, y + .6 * s, z + dz * s); }
    else { add(G.pbox(.04, .5 * s, .34 * s), '#8a6044', x + w / 2 + .01, y + .25 * s, z); add(G.pbox(.04, .26 * s, .3 * s), '#9fd3ec', x + w / 2 + .01, y + .6 * s, z + .5 * s); }
  },
  paddy(add, x, y, z, w, d, R) {
    add(G.pbox(w, .05, d), '#a9dbe9', x, y + .025, z);
    for (const sx of [-1, 1]) add(G.pbox(.1, .09, d + .1), '#c9b78c', x + sx * w / 2, y + .045, z);
    for (const sz of [-1, 1]) add(G.pbox(w, .09, .1), '#c9b78c', x, y + .045, z + sz * d / 2);
    const n = Math.max(2, Math.round(w / .32));
    for (let k = 0; k < n; k++) add(G.pbox(.06, .08, d - .2), R() < .5 ? '#86c45a' : '#78b950', x - w / 2 + .2 + k * (w - .4) / Math.max(1, n - 1), y + .07, z);
  },
  pole(add, tube, x, y, z, h) {
    add(G.cyl(.075, .1, h, 7), '#9c7b5a', x, y + h / 2, z); add(G.pbox(1.0, .1, .14), '#7b5d42', x, y + h - .35, z);
    for (const dx of [-.4, 0, .4]) add(G.cyl(.04, .04, .1, 6), '#f4efe6', x + dx, y + h - .25, z);
    add(G.cyl(.13, .13, .32, 10), '#9aa3ad', x, y + h - .9, z + .18);
  },
};
// one band chunk's land: the chunk spans z in [-CH/2, CH/2); everything here is in the scenery's own space
// (part 'flat': what lies on the ground — the near band's flowers; 'tall': what stands up — that half is put away while the camera looks
// from the far side; the same land built twice from the same seed, each keeping its half). k: the haze its colours go through.
function chunkLand(kind, i, part, k = 0) {
  const R = RNG(1000 + i * 131 + kind.length * 7), y = SLAB.y, bb = new THREE.Box3();
  return mc('tc4-scn3|' + kind + '|' + i + '|' + part, ({ add: add0 }) => {
    const add = (src, color, x, yy, z, rx = 0, ry = 0, rz = 0, sc = 1) => {
      src.computeBoundingBox(); bb.copy(src.boundingBox);
      const top = yy + bb.max.y * (Array.isArray(sc) ? sc[1] : sc) - y, flatOne = top < .2;
      if ((part === 'flat') === flatOne) add0(src, haze(color, k), x, yy, z, rx, ry, rz, sc);
    };
    // (never an empty half: the merge needs one piece)
    add0(G.pbox(.01, .01, .01), '#8fc66a', 0, y - .5, 0);
    if (kind === 'rail') {   // behind, along the track: bushes, wildflowers, a sign, sometimes a level crossing post
      for (let k2 = 0; k2 < 5; k2++) lp.bush(add, -3.9 - R() * .5, y, -CH / 2 + R() * CH, .7 + R() * .5, R() < .3 ? '#4f9e52' : '#5fae58');
      for (let k2 = 0; k2 < 5; k2++) lp.flowers(add, -3.1 - R() * 1.2, y, -CH / 2 + R() * CH, R);
      if (i % 2 === 0) { const z = -2; add(G.cyl(.05, .05, 1.6, 6), '#ffffff', -3.25, y + .8, z); add(G.pbox(.04, .12, .7), '#ffd23c', -3.25, y + 1.45, z, .8, 0, 0); add(G.pbox(.04, .12, .7), '#ffd23c', -3.25, y + 1.45, z, -.8, 0, 0); for (const dz of [-.18, .18]) add(G.cyl(.08, .08, .06, 10), C.red, -3.2, y + 1.15, z + dz, 0, 0, HP); }
      else { add(G.pbox(.06, 1.0, .06), '#f4efe6', -3.1, y + .5, 3); add(G.pbox(.04, .3, .5), '#ffffff', -3.1, y + 1.05, 3); add(G.pbox(.042, .08, .3), C.teal, -3.1, y + 1.08, 3); }
    } else if (kind === 'village') {   // pale, past the near band: a farmhouse or two, cherry trees, a paddy holding the sky
      lp.paddy(add, -5.5, y, -CH / 2 + 3 + R() * 2, 1.6, 2.4, R);
      lp.house(add, -6.2, y, CH / 2 - 3 - R() * 1.5, .9, '#fbf6ee', ['#5f7c99', '#c4654f', '#3f8f7c'][i % 3], i % 2 === 0);
      lp.cherry(add, -5.6, y, -CH / 2 + .8, 1.1 + R() * .3); lp.cherry(add, -6.5, y, R() * 3 - 2, .95);
      lp.tree(add, -6.4, y, CH / 2 - .6, .95, '#6fb85e', '#8fd07a');
    } else if (kind === 'mountains') {   // the far range: soft round mountains on the haze line (no points — a spring in the hills)
      for (let k2 = 0; k2 < 3; k2++) { const z = -CH / 2 + 2 + k2 * 4 + R() * 1.2, r = 1.3 + R() * .5; add(G.sph(r, 12, 7), k2 % 2 ? '#86b8a2' : '#97c3b2', -7.9, y - r * .3, z, 0, 0, 0, [1, .85, 1.5]);
        add(G.sph(r * .45, 8, 5), '#aed3c5', -7.8, y + r * .42, z + r * .15, 0, 0, 0, [1, .55, 1.2]); }
    } else if (kind === 'clouds') {
      for (let k2 = 0; k2 < 2; k2++) { const z = -CH / 2 + 3 + k2 * 6 + R() * 2, x = -8.0 - R() * 2.5, yy = y + 6.2 + R() * 1.6; for (const [dx, dy, dz, r] of [[0, 0, 0, .9], [.1, .3, .8, .7], [0, .1, -.8, .65], [.2, .55, .2, .6]]) add(G.sph(r, 7, 5), '#ffffff', x + dx, yy + dy, z + dz, 0, 0, 0, [.8, .8, 1.1]); }
    } else if (kind === 'verge') {   // in front, along the track: flowers, a km post, small rocks
      for (let k2 = 0; k2 < 6; k2++) lp.flowers(add, 3.0 + R() * .7, y, -CH / 2 + R() * CH, R, 4);
      for (let k2 = 0; k2 < 3; k2++) add(G.sph(.12 + R() * .1, 6, 4), '#b9b3a8', 2.9 + R() * .3, y + .05, -CH / 2 + R() * CH, 0, 0, 0, [1.2, .6, 1]);
      add(G.pbox(.08, .5, .08), '#ffffff', 3.0, y + .25, 0); add(G.pbox(.02, .14, .14), C.ink, 3.03, y + .42, 0);
    }
  });
}
B.tc4scenery = (f, T) => {
  f.noSolid = true; f.collideBox = [0, -3, 0, 0, -2.9, 0]; f.noOccupied = true;
  let built = null, foldK = 1;
  const camDir = new THREE.Vector3();
  const build = (W) => {
    const root = grp(), tall = grp(), sky = grp(); root.add(tall, sky);
    // (hung on the room, not inside the piece: the land is no piece of furniture — nothing measures it as one)
    const host = f.group.parent || f.group; root.position.copy(f.group.position); host.add(root);
    const keep = m => { m.castShadow = false; m.receiveShadow = false; return m; };
    const soft = m => { m.layers.set(2); m.userData.noOcclude = true; return keep(m); };
    const L2 = SLAB.z * 2;
    // the ground either side of the track: colour only (no ink line where it thins away); the outer strips fade into the haze and their
    // streaks run by
    const band = (x0, x1, tex, opts = {}) => {
      const m = new THREE.MeshBasicMaterial({ map: tex, transparent: !!opts.fade, depthWrite: !opts.fade }); m.toneMapped = false;
      const p = soft(mesh(new THREE.PlaneGeometry(Math.abs(x1 - x0), L2), m)); put(p, (x0 + x1) / 2, SLAB.y + (opts.y || 0), 0, -HP, 0, x1 < x0 ? PI : 0); if (x1 < x0) p.rotation.set(-HP, 0, PI);
      p.renderOrder = opts.fade ? -2 : -3; root.add(p); return p;
    };
    const gtex = (k, a, b, rx, rz, n) => { const t = groundTex(k, a, b, n).clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); t.needsUpdate = true; return t; };
    const ftex = (k, a, b, dots, rz) => { const t = fadeTex(k, a, b, dots).clone(); t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, rz); t.needsUpdate = true; return t; };
    band(-2.7, -4.6, gtex('rail2', '#a3d276', '#8fc465', 1, 20, 160));
    band(2.7, 3.9, gtex('verge2', '#a3d276', '#8fc465', 1, 20, 160));
    const backFade = band(-4.6, -7.6, ftex('back', '#b5dc95', '#a2cf86', ['#f5cfdc', '#fff1b8', '#ffffff'], L2 / 8), { fade: true, y: -.004 });
    const frontFade = band(3.9, 6.8, ftex('front', '#a8d47f', '#94c86f', ['#ffffff', '#ffe27a', '#ffb9cc'], L2 / 6), { fade: true, y: -.004 });
    // the track bed: a ballast bank, two steel rails (still), the sleepers (one mesh sliding within one sleeper's step)
    const bt = ballastTex().clone(); bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.set(2, L2 / 3); bt.needsUpdate = true;
    const bank = keep(mesh(new THREE.BoxGeometry(5.4, .24, L2), mat('#ffffff', { map: bt, rim: 0 }))); put(bank, 0, -1.62, 0); root.add(bank);
    root.add(keep(mc('tc4-rails', ({ add }) => { for (const x of [-1.55, 1.55]) { add(G.box(.12, .12, L2, .01), '#9aa3ad', x, -1.41, 0); add(G.box(.07, .02, L2, .004), '#dfe4ea', x, -1.355, 0); } })));
    const SL = .62, sleepers = keep(mc('tc4-sleepers', ({ add }) => { for (let z = -SLAB.z; z <= SLAB.z + SL; z += SL) add(G.pbox(3.9, .1, .24), '#8a6448', 0, -1.52, z); }));
    root.add(sleepers);
    // poles (behind, periodic) and their two wires — the wires colour only (an ink line round a wire drew a thick black cut across the land)
    const PP = 7.2, PX = -3.75, PH = 6.6;
    const poles = keep(mc('tc4-poles2', ({ add, tube }) => { for (let z = -SLAB.z; z <= SLAB.z + PP; z += PP) lp.pole(add, tube, PX, SLAB.y, z, PH); }));
    const wires = soft(mc('tc4-wires', ({ tube }) => {
      for (let z = -SLAB.z; z <= SLAB.z + PP; z += PP) for (const dx of [-.4, .4]) { const y0 = SLAB.y + PH - .2, n = 4; for (let k = 0; k < n; k++) { const a = k / n, b = (k + 1) / n, sag = q => -.45 * 4 * q * (1 - q); tube([PX + dx, y0 + sag(a), z + a * PP], [PX + dx, y0 + sag(b), z + b * PP], .02, '#6a6478', 4); } }
    }));
    tall.add(poles, wires);
    const FP = 1.6, fence = keep(mc('tc4-fence3', ({ add }) => { for (let z = -SLAB.z; z <= SLAB.z + FP; z += FP) add(G.pbox(.07, .55, .07), '#c49a64', 3.75, SLAB.y + .27, z); add(G.box(.04, .05, L2 + FP, .01), '#c49a64', 3.75, SLAB.y + .42, FP / 2); add(G.box(.04, .05, L2 + FP, .01), '#c49a64', 3.75, SLAB.y + .22, FP / 2); }));
    root.add(fence);
    // the varied land in chunks: near (crisp), the pale village and the far mountains (colour only), clouds
    const chunks = [];
    const put1 = (kind, v, g, i, part, k = 0, pale = false) => { const w = grp(), m = (pale ? soft : keep)(chunkLand(kind, i, part, k)); w.position.y = SLAB.y; m.position.y = -SLAB.y; w.add(m); g.add(w); chunks.push({ m: w, z0: -LOOP / 2 + (i + .5) * CH, v }); };
    for (let i = 0; i < NCH; i++) {
      put1('rail', SCN.poles, tall, i, 'tall'); put1('rail', SCN.poles, root, i, 'flat');
      put1('village', SCN.village, tall, i, 'tall', .42, true); put1('village', SCN.village, root, i, 'flat', .42, true);
      put1('mountains', SCN.mountains, tall, i, 'tall', .62, true);
      put1('clouds', SCN.clouds, sky, i, 'tall', 0, true);
      put1('verge', SCN.verge, root, i, 'tall'); put1('verge', SCN.verge, root, i, 'flat');
    }
    noRay(root);
    W && (W.idsDirty = true, W.shadowDirty = true);
    return { root, tall, sky, sleepers, poles, wires, fence, chunks, bt, SL, PP, FP, backFade, frontFade };
  };
  // the land goes by: 30 times a second, each band at its speed (a chunk leaving the far end comes in again at the near end, sinking
  // into / rising out of the ground in the last 3 m so nothing pops in the air)
  let last = -1;
  f.tick = t => {
    if (!built) return;
    const fr = Math.floor(t * 30); if (fr === last) return; last = fr;
    const S = built, wrap = (z, p) => ((z % p) + p) % p;
    S.sleepers.position.z = wrap(t * SCN.track, S.SL); S.poles.position.z = S.wires.position.z = wrap(t * SCN.poles, S.PP); S.fence.position.z = wrap(t * SCN.verge, S.FP);
    // (a texture's v runs toward -z on these flat faces: a growing offset slides the stones and the grass toward +z, with the land)
    S.bt.offset.y = wrap(t * SCN.track / (SLAB.z * 2 / S.bt.repeat.y), 1);
    S.backFade.material.map.offset.y = wrap(t * SCN.meadow / 8, 1); S.frontFade.material.map.offset.y = wrap(t * SCN.grass / 6, 1);
    for (const c of S.chunks) {
      const z = wrap(c.z0 + LOOP / 2 + t * c.v, LOOP) - LOOP / 2, e = Math.min(1, Math.max(0, (SLAB.z - Math.abs(z) - CH / 2 + 3) / 3));
      c.m.position.z = z; c.m.scale.y = Math.max(.001, e); c.m.visible = e > .002;
    }
    tunnelTick(f, t);
  };
  // the far side's standing land goes away while the camera is on that side (the way the room's walls fold), so it never stands in
  // front of the train; the flat land stays
  f.updateView = (W, dt = 1 / 60) => {
    if (!W || !Number.isFinite(W.yaw)) return;
    if (!built) built = build(W);
    camDir.set(Math.sin(W.yaw), 0, Math.cos(W.yaw));
    const want = camDir.x < -.22 ? 0 : 1;
    if (want === foldK) return;
    foldK = want; built.tall.visible = built.sky.visible = !!want; W.shadowDirty = true; W.idsDirty = true;
  };
  f.tunnel = () => startTunnel(f, true);
};
// ── 가끔 터널 (허브 10/23 사용자 승인 아이디어 ②): every 30–45 s the train runs through a short tunnel — the whole picture dims for
// about two seconds and brightens again. One dark sheet over the canvas (under the HUD), faded by the browser itself and removed when
// done, so nothing is left behind if the stage ends in the middle; never while the stage's own tunnel scene plays.
function tunnelTick(f, t) {
  if (f._tnNext == null) f._tnNext = t + 24;
  if (t < f._tnNext) return;
  f._tnNext = t + 30 + Math.random() * 15;
  startTunnel(f, false);
}
function startTunnel(f, force) {
  if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
  const app = document.getElementById('app'), gl = document.getElementById('gl');
  if (!app || !gl || document.hidden) return;
  if (!force && (document.querySelector('.stg-skip, .r1-eyes, #app.cine') || globalThis.G?.bot)) return;
  if (f._tnEl?.isConnected) return;
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0;background:radial-gradient(120% 90% at 50% 46%, rgba(34,26,52,.55) 0%, rgba(22,16,36,.82) 70%, rgba(14,10,24,.92) 100%)';
  gl.after(el); f._tnEl = el;
  const a = el.animate([{ opacity: 0 }, { opacity: 1, offset: .16 }, { opacity: .93, offset: .74 }, { opacity: 0 }], { duration: 2600, easing: 'ease-in-out', fill: 'forwards' });
  a.onfinish = a.oncancel = () => el.remove();
  setTimeout(() => el.remove(), 3200);
}

export const TRAINCAR4_BUILDERS = B;
export const TRAINCAR4_INFO = {
  tc4shell: { w: 5, d: 6, name: '차체', hidden: true },
  tc4wall: { w: 1, d: 6, name: '칸 벽', hidden: true },
  tc4bench: { w: 2, d: 1, name: '청록 긴 좌석', hidden: true },
  twindow4: { wall: true, span: 2, name: '큰 기차 창', hidden: true },
  tc4rack: { wall: true, span: 6, name: '손잡이와 짐 선반', hidden: true },
  tc4front: { wall: true, span: 4, name: '앞 칸 끝벽', hidden: true },
  tc4sidedoor: { wall: true, span: 1, name: '출입문', hidden: true },
  tc4endwall: { w: 5, d: .3, name: '칸 끝벽', hidden: true },
  tc4gangway: { w: 1, d: 1, name: '연결 통로', hidden: true },
  tc4cart: { w: 1, d: 1, name: '간식 카트', hidden: true },
  tc4booth: { w: 2.2, d: 1.4, name: '식당칸 자리', hidden: true },
  tc4counter: { w: 1.8, d: .7, name: '도시락 매대', hidden: true },
  tc4sofa: { w: 2.4, d: .8, name: '전망 소파', hidden: true },
  tc4tail: { w: 5, d: .3, name: '끝 난간', hidden: true },
  tc4luggage: { w: 1, d: 1, name: '여행 짐', hidden: true },
  tc4scenery: { w: 1, d: 1, name: '바깥 풍경', hidden: true },
};

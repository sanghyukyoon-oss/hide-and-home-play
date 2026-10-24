// 28판 B안 — 2층 식당·침대 열차 한 량 인형집 단면 traincar6 (⑧ 10/24; 사용자 "기차 안은 다른 디자인으로 B안 또 만들어 줘. 반복적으로 잘 안
// 되고 있다." → 러프에 "지금은 이층집 방처럼 읽힘" → 디테일: 둥근 모서리 기차 창·잘린 끝의 둥근 지붕 단면·차체 띠·대차 바퀴·선로·옆 출입문·
// 짐 그물 선반·손잡이, 화면 아래까지 차게 차체 아래를 크게, 생활감). 원칙: 바깥은 하늘색 한 장(땅·마을 3D 없음), 움직이는 건 창 안 풍경만
// (그림 띠 세 겹을 텍스처 offset으로 — 메시 이동 X), 터널은 창 띠만 어두워짐, 공중에 뜬 단면 + 바퀴 아래 선로 한 토막.
// 옛 키·traincar5의 빌더는 그대로 — 여기는 새 type만(tc6…, twindow6).
//   tc6shell   차체 아래: 파랑 띠·크림 줄·금빛 테, 차 이름 판, 물탱크·기기 상자, 대차 둘(스프링·제동 장치)·바퀴(돎), 두꺼운 자갈 선로 토막
//   tc6wall    창 쪽 벽(먼 쪽, 두 층): 나무 징두리·크림 벽·층 띠, 창 사이 메뉴판·포스터, 둥근 지붕 띠, 잘린 끝(+x)의 둥근 단면 테
//   tc6end     먼 끝벽(둥근 지붕 모양): 연결 통로 미닫이 문(비밀번호, 문 뒤 = 통로 주름막 안), 노선도·행선 판(한·영), 소화기함, 라디오 선반, 시계, 포스터
//   twindow6   둥근 모서리 기차 창: 하늘 + 먼 산·구름 / 논·집 / 전봇대·덤불 세 띠, 가끔 터널; o.blind 롤 블라인드, o.curtain 커튼
//   tc6door    창 쪽 옆 출입문 한 쌍(문 창에도 풍경), 노란 발판
//   tc6booth   식탁 칸(모켓 의자, 식탁보, 탁상 등, 도시락·찻잔·메뉴 카드) — o.drawer 의자 밑 서랍(자물쇠)
//   tc6net     창 위 짐 그물 선반(모자·장바구니) · tc6pole 세로 손잡이 봉 + 하차 벨 · tc6straps 손잡이 고리 줄
//   tc6rack    2층 다락 밑 짐칸 선반(상자·바구니, 위 칸 여행 가방 = 너굴이 자리 '…선반 위는 반칙', 자물쇠) · tc6corner 우산꽂이·귤 바구니
//   tc6berth   2층 침대 칸(베개·이불·펼친 책·안경·독서등, 커튼) · tc6loftbits 다락 슬리퍼·작은 가방·랜턴 · tc6cart 찻잔 수레 · tc6bag 바닥 짐
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, texCache, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';
import { addI18n } from '../i18n.js';

const PI = Math.PI, HP = PI / 2;
// (every Korean name, label and painted word here, with its English — 숨김 자리·부품 이름·글자 판)
addI18n({
  '식당·침대 열차': 'Dining & Sleeper Car', '식당칸 · 침대칸': 'Dining · Sleeper', '차체': 'Car body', '칸 벽': 'Car wall', '칸 끝벽': 'Car end wall', '기차 창': 'Train window',
  '옆 출입문': 'Side door', '출입문': 'Train door', '출입문 발판': 'Door step', '식탁 칸': 'Dining booth', '식탁 위': 'On the dining table', '왼쪽 좌석 위': 'On the left seat',
  '오른쪽 좌석 위': 'On the right seat', '좌석 밑': 'Under the seat', '좌석 서랍': 'Seat drawer', '좌석 서랍 안': 'In the seat drawer', '짐 그물 선반': 'Luggage net', '그물 선반 위': 'On the luggage net',
  '손잡이 봉': 'Grab pole', '하차 벨': 'Stop button', '손잡이 고리': 'Hand straps', '짐칸 선반': 'Luggage shelf', '짐 선반 여행 가방': 'Suitcase on the rack', '여행 가방 뒤': 'Behind the suitcase',
  '짐칸 아래 칸': 'Bottom shelf', '바구니 옆': 'Beside the basket', '우산꽂이': 'Umbrella stand', '우산꽂이 옆': 'Beside the umbrella stand', '귤 바구니 위': 'On the tangerine basket',
  '침대 칸': 'Sleeper berth', '커튼': 'Curtain', '침대 위': 'On the berth', '베개 옆': 'Beside the pillow', '다락 짐': 'Loft things', '슬리퍼 옆': 'Beside the slippers', '작은 가방 위': 'On the small bag',
  '찻잔 수레': 'Tea cart', '수레 위': 'On the tea cart', '수레 아래 칸': 'Tea cart bottom shelf', '바닥 짐': 'Bags on the floor', '짐 위': 'On the bags',
  '연결 통로 문': 'Gangway door', '연결 통로 안': 'In the gangway', '라디오 선반 위': 'On the radio shelf', '창턱': 'Window sill', '롤 블라인드': 'Roller blind', '블라인드 뒤 창턱': 'Behind the blind',
  '봄빛 로컬선': 'Spring Local Line', '벚꽃역': 'Sakura Stn.', '들판': 'Fields', '온천': 'Hot Spring', '호수 섬': 'Lake Island', '바다': 'Sea', '다음 역': 'Next', '호수 섬 행': 'For Lake Island',
  '오늘의 도시락': "Today's bento", '벚꽃 도시락': 'Sakura bento', '연어 주먹밥': 'Salmon onigiri', '따뜻한 보리차': 'Hot barley tea', '귤 주스': 'Tangerine juice',
  '기차 여행': 'Train Trip', '호수 섬 캠핑': 'Lake Camping', '메뉴': 'Menu', '식당칸': 'Dining Car', '2호차': 'Car 2',
});

// ── 색: 큰 면은 순하게(크림 벽·옅은 청보라 카펫·파랑 차체), 쨍한 색은 작은 것(탁상 등·소화기·도시락 끈·컵)에만
export const C6 = { body: '#5579b8', bodyD: '#3f5f9c', line: '#fbf2df', trim: '#e8b44a', up: '#fbf3e4', up2: '#f2e6cf', wood: '#cf9a68', woodD: '#a8764a',
  seat: '#eba496', seatD: '#dc9182', moq: '#f8d9cf', lamp: '#f6cf5a', blanket: '#a7d9c4', curtain: '#86bdb4', curtain2: '#74ada4', steel: '#c3c9d2', steel2: '#8f98a6',
  dark: '#3b3647', rubber: '#857f94', rubber2: '#958fa4', red: '#e5554b', white: '#fffaf1', gravel: '#b8b2aa', gravel2: '#a59f97', earth: '#8f7f70', sleeper: '#8a6446',
  rail: '#9aa3ae', coral: '#ec8a78', blue: '#5f86c4', orange: '#f59a2e', paper: '#f4f1ea', mint: '#a7d9c4', glassF: '#e9eef3' };
const TX = texCache();
const WH = 4.6, ROOF = 5.3, DECK = 2.5;
const flat = (w, h, tex, o = {}) => mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: tex, rim: 0, ...o }), { cast: false });

// a piece that stands against a far wall goes away while the camera is round behind that wall (n: the wall's inward normal, x / z)
const foldBy = (f, nx, nz) => {
  let shown = true;
  f.updateView = W => {
    if (!W || !Number.isFinite(W.yaw)) return;
    const want = Math.sin(W.yaw) * nx + Math.cos(W.yaw) * nz >= -.18; if (want === shown) return;
    shown = want; f.group.visible = want; W.shadowDirty = true; W.idsDirty = true;
  };
};
// a rounded rectangle path (centre cx, cy) into a shape or a hole
const rrect = (p, cx, cy, w, h, r) => { const x0 = cx - w / 2, y0 = cy - h / 2; p.moveTo(x0 + r, y0); p.lineTo(x0 + w - r, y0); p.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); p.lineTo(x0 + w, y0 + h - r); p.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h); p.lineTo(x0 + r, y0 + h); p.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r); p.lineTo(x0, y0 + r); p.quadraticCurveTo(x0, y0, x0 + r, y0); return p; };
// the car's cross-section (across z, from the floor up to the round roof): the end wall's outline and the cut end's ring
const profile = (p, W, top, inset = 0, notch = null) => {
  const a = -W / 2 + inset, b = W / 2 - inset, h = WH - inset * .5, t = top - inset, c = 1.0;
  p.moveTo(a, inset * .3);
  if (notch) { p.lineTo(notch[0], inset * .3); p.lineTo(notch[0], notch[2]); p.lineTo(notch[1], notch[2]); p.lineTo(notch[1], inset * .3); }
  p.lineTo(b, inset * .3); p.lineTo(b, h); p.quadraticCurveTo(b, t, b - c, t); p.lineTo(a + c, t); p.quadraticCurveTo(a, t, a, h); p.lineTo(a, inset * .3);
  return p;
};

// ═════════════════════════ 그림 (painted once each, cached) ═════════════════════════
const moquette = (base, dot) => TX.get('tc6-moq|' + base + dot, () => canvasTex(128, 128, (c, W, H) => {
  c.fillStyle = base; c.fillRect(0, 0, W, H); c.fillStyle = shade(base, -.06); for (let y = 0; y < H; y += 8) c.fillRect(0, y, W, 2);
  c.fillStyle = dot; for (let y = 8; y < H; y += 32) for (let x = (y / 32 % 2) * 16 + 8; x < W; x += 32) { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }
}, { repeat: [1, 1] }));
const routeTex = () => TX.get('tc6-route', () => textTex(1024, 220, (c, W, H) => {
  c.fillStyle = C6.white; c.fillRect(0, 0, W, H); c.fillStyle = C6.body; c.fillRect(0, 0, W, 40);
  fitText(c, '봄빛 로컬선', W / 2, 20, W * .7, 24, '#ffffff', { weight: '700' });
  const st = ['벚꽃역', '들판', '온천', '호수 섬', '바다'], x0 = W * .1, dx = W * .8 / (st.length - 1), y = 70;
  c.fillStyle = C6.trim; c.fillRect(x0, y - 5, dx * (st.length - 1), 10);
  st.forEach((s, i) => { const x = x0 + dx * i; c.fillStyle = i === 3 ? C6.red : '#ffffff'; c.beginPath(); c.arc(x, y, 12, 0, 7); c.fill(); c.lineWidth = 4; c.strokeStyle = C6.bodyD; c.stroke();
    fitText(c, s, x, 96, dx * .9, 17, i === 3 ? C6.red : '#3a2f3f', { weight: '700' }); });
}));
const ledTex = () => TX.get('tc6-led', () => textTex(512, 96, (c, W, H) => {
  c.fillStyle = '#26232c'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,170,60,.1)'; for (let x = 0; x < W; x += 6) c.fillRect(x, 0, 2, H);
  fitText(c, '다음 역', W * .2, H / 2, W * .3, 20, '#ffd37a', { weight: '700' }); fitText(c, '호수 섬 행', W * .64, H / 2, W * .58, 24, '#ffad4a', { weight: '700' });
}));
const signTex = (key, s, bg, fg) => TX.get('tc6-sign|' + key, () => textTex(512, 128, (c, W, H) => { c.fillStyle = bg; c.fillRect(0, 0, W, H); fitText(c, s, W / 2, H / 2, W - 16, 28, fg, { weight: '700' }); }));
const menuTex = () => TX.get('tc6-menu', () => textTex(256, 340, (c, W, H) => {
  c.fillStyle = '#3e5a4f'; c.fillRect(0, 0, W, H); c.strokeStyle = '#d9b77c'; c.lineWidth = 6; c.strokeRect(4, 4, W - 8, H - 8);
  fitText(c, '오늘의 도시락', W / 2, 32, W - 30, 20, '#ffffff', { weight: '700' });
  ['벚꽃 도시락', '연어 주먹밥', '따뜻한 보리차', '귤 주스'].forEach((s, i) => { c.fillStyle = ['#f6b6c8', '#ffd37a', '#bfe6c4', '#ffb27a'][i]; c.beginPath(); c.arc(28, 82 + i * 56, 8, 0, 7); c.fill(); fitText(c, s, W / 2 + 12, 82 + i * 56, W - 70, 16, '#fffaf1'); });
}));
const posterTex = (k) => TX.get('tc6-poster|' + k, () => textTex(256, 344, (c, W, H) => {
  c.fillStyle = k ? '#fff1cf' : '#dff0fb'; c.fillRect(0, 0, W, H); c.fillStyle = '#9fd07a'; c.fillRect(0, H * .62, W, H * .38);
  if (k) { c.fillStyle = '#c9852a'; c.beginPath(); c.moveTo(W * .25, H * .62); c.lineTo(W / 2, H * .3); c.lineTo(W * .75, H * .62); c.fill(); c.fillStyle = '#3f9e6a'; c.fillRect(0, H * .6, W, 10); }
  else { c.fillStyle = '#5f7c99'; c.beginPath(); c.moveTo(10, H * .62); c.lineTo(W * .35, H * .3); c.lineTo(W * .7, H * .62); c.fill(); c.fillStyle = C6.body; c.fillRect(W * .18, H * .55, W * .64, 16); c.fillStyle = '#fff3c8'; for (let j = 0; j < 4; j++) c.fillRect(W * .22 + j * 26, H * .555 + 3, 14, 8); }
  fitText(c, k ? '호수 섬 캠핑' : '기차 여행', W / 2, H * .86, W - 20, 22, k ? '#8a5a22' : C6.bodyD, { weight: '700' });
}));
const clockTex = () => TX.get('tc6-clock', () => canvasTex(128, 128, (c, W, H) => {
  c.fillStyle = C6.white; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill(); c.fillStyle = C6.dark; for (let i = 0; i < 12; i++) { const a = i * PI / 6; c.fillRect(64 + Math.cos(a) * 50 - 3, 64 + Math.sin(a) * 50 - 3, 6, 6); }
  c.strokeStyle = C6.dark; c.lineWidth = 6; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 26); c.stroke(); c.lineWidth = 5; c.beginPath(); c.moveTo(64, 64); c.lineTo(92, 74); c.stroke();
}));
const netTex = () => TX.get('tc6-net', () => canvasTex(64, 64, (c, W, H) => { c.clearRect(0, 0, W, H); c.strokeStyle = '#7a6a5a'; c.lineWidth = 3; for (let k = -W; k <= W; k += 12) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + W, H); c.stroke(); c.beginPath(); c.moveTo(k + W, 0); c.lineTo(k, H); c.stroke(); } }, { repeat: [4, 1] }));

// ═════════════════════════ 창 안 풍경 (three painted strips over a still sky; offsets only) ═════════════════════════
const tile = (w, h, draw) => { const t = canvasTex(w, h, draw); t.wrapS = THREE.RepeatWrapping; return t; };
const viewTex = () => ({
  sky: TX.get('tc6-sky', () => canvasTex(128, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#79c1ee'); g.addColorStop(.65, '#c9eafb'); g.addColorStop(1, '#eef9ff'); c.fillStyle = g; c.fillRect(0, 0, W, H); })),
  far: TX.get('tc6-far', () => tile(512, 256, (c, W, H) => {
    c.fillStyle = 'rgba(255,255,255,.96)';
    for (const [x, y, r] of [[40, 46, 16], [62, 38, 22], [88, 48, 15], [250, 34, 13], [272, 28, 19], [296, 36, 12], [420, 52, 15], [444, 44, 20], [466, 52, 12]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    const ridge = (base, amp, col, ph) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 4) { const a = x / W * PI * 2; c.lineTo(x, base - amp * (.6 * Math.sin(a * 2 + ph) + .4 * Math.sin(a * 3 + ph * 2))); } c.lineTo(W, H); c.fill(); };
    ridge(H * .55, H * .14, '#a7c9df', 0); ridge(H * .66, H * .11, '#93c3a3', 1.7);
  })),
  mid: TX.get('tc6-mid', () => tile(512, 256, (c, W, H) => {
    const g0 = H * .74; c.fillStyle = '#9fd07a'; c.fillRect(0, g0, W, H - g0); c.fillStyle = '#b9e2ee'; for (let x = 6; x < W; x += 64) c.fillRect(x, g0 + 12, 50, 12);
    const house = (x, w, h, roof) => { c.fillStyle = '#fffaf1'; c.fillRect(x, g0 - h, w, h); c.fillStyle = roof; c.beginPath(); c.moveTo(x - 6, g0 - h); c.lineTo(x + w / 2, g0 - h - h * .55); c.lineTo(x + w + 6, g0 - h); c.fill(); c.fillStyle = '#7f6a58'; c.fillRect(x + w * .38, g0 - h * .55, w * .22, h * .55); };
    const tree = (x, r, a) => { c.fillStyle = '#8a6044'; c.fillRect(x - 2, g0 - r, 4, r); c.fillStyle = a; c.beginPath(); c.arc(x, g0 - r * 1.4, r, 0, 7); c.fill(); };
    house(30, 40, 26, '#5f7c99'); tree(98, 14, '#f5b3c6'); house(150, 30, 20, '#c4654f'); tree(212, 16, '#6fb85e'); house(300, 44, 28, '#5f7c99'); tree(372, 15, '#6fb85e'); house(410, 28, 20, '#3f8f7c'); tree(468, 13, '#f5b3c6');
  })),
  near: TX.get('tc6-near', () => tile(512, 256, (c, W, H) => {
    const g0 = H * .92, poles = [W * .22, W * .72]; c.strokeStyle = '#3a3346'; c.lineWidth = 2.5;
    for (const dy of [30, 42]) for (let i = 0; i < poles.length; i++) { const a = poles[i], b = i + 1 < poles.length ? poles[i + 1] : poles[0] + W; for (const sh of [0, -W]) { c.beginPath(); c.moveTo(a + sh, dy); c.quadraticCurveTo((a + b) / 2 + sh, dy + 18, b + sh, dy); c.stroke(); } }
    for (const x of poles) { c.fillStyle = '#7a5a44'; c.fillRect(x - 6, 18, 12, H); c.fillStyle = '#3a3346'; c.fillRect(x - 26, 26, 52, 6); }
    c.fillStyle = '#79c05a'; c.fillRect(0, g0, W, H - g0);
    for (const [x, r, col] of [[60, 26, '#5fb35a'], [150, 20, '#6fc06a'], [300, 30, '#58aa55'], [430, 22, '#6fc06a']]) { c.fillStyle = col; c.beginPath(); c.arc(x, g0, r, PI, 0); c.fill(); }
    for (let k = 0; k < 10; k++) { c.fillStyle = ['#ffffff', '#ffd23c', '#ff9fb8'][k % 3]; c.beginPath(); c.arc((k * 53 + 9) % W, g0 + 6 + (k % 2) * 6, 3, 0, 7); c.fill(); }
  })),
});
const SPEED = { far: [9, .5], mid: [4.4, 2.0], near: [3.0, 6.0] };
const TUN = { every: 26, at: 17, len: 2.6 };
// a flowing view in a w×h opening (middle at y = cy, z = z0 of `host`); every window on one clock, each at its own place along the
// car; the tunnel darkens the strips and the sky only
function flowView(host, w, h, cy, z0) {
  const F = viewTex(), skyM = new THREE.MeshBasicMaterial({ map: F.sky }); skyM.toneMapped = false;
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
    if (base == null) { host.updateWorldMatrix(true, false); host.localToWorld(v3.set(-w / 2, 0, 0)); base = -v3.x; }
    for (const L of lays) { const x = (base + t * L.v) / L.Lm; L.tex.offset.x = x - Math.floor(x); }
    const ph = t % TUN.every - TUN.at, k = ph < 0 || ph > TUN.len ? 0 : Math.min(1, ph / .35, (TUN.len - ph) / .35);
    if (Math.abs(k - dark) > .01 || (k === 0 && dark !== 0)) { dark = k; for (const m of mats) m.color.setScalar(1 - .84 * k); }
  };
}
// a rounded-corner window frame (a plate with a rounded hole) in the piece's x-y plane, its front at z
const roundFrame = (w, h, cy, t, z, col, key) => mc('tc6-rf|' + [w, h, cy, t, col].join(','), ({ add }) => {
  const s = rrect(new THREE.Shape(), 0, cy, w + 2 * t, h + 2 * t, .26); s.holes.push(rrect(new THREE.Path(), 0, cy, w, h, .2));
  const g = G.ext(s, .07, .015, 6); g.translate(0, 0, z - .07); add(g, col, 0, 0, 0);
});

const B = {};
// ═════════════════════════ 차체 아래 + 선로 토막 ═════════════════════════
// (the car at its middle; along x o.len, across z o.w): the blue body band with cream and gold lines and the car's plate on the near
// side, the low sill along the open near side, a water tank and equipment boxes, two bogies (frames, yellow springs, brake blocks)
// with turning wheels, a thick block of gravel track under it (sleepers, rails) — big enough to fill the lower screen
B.tc6shell = (f, T, o = {}) => {
  const L = o.len || 5, W = o.w || 4, GA = 1.55, WY = -1.2, WR = .36, RT = WY - WR;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  f.add(mc('tc6-shell3|' + L + W, ({ add, tube }) => {
    // the body band (shallow, so the bogies show under it), its cream and gold lines, a dark skirt line, rivets
    add(G.box(L + .3, .46, W + .3, .06), C6.body, 0, -.27, 0);
    add(G.box(L + .34, .1, W + .34, .02), C6.line, 0, -.07, 0); add(G.box(L + .36, .06, W + .36, .012), C6.trim, 0, -.22, 0);
    add(G.box(L - .2, .1, W - .1, .03), '#36404a', 0, -.54, 0);
    add(G.box(L, .34, .14, .03), C6.line, 0, .17, W / 2 + .07); add(G.box(L + .02, .05, .2, .02), C6.trim, 0, .36, W / 2 + .07);
    for (let x = -L / 2 + .4; x < L / 2 - .2; x += .6) add(G.sph(.026, 6, 4), C6.bodyD, x, -.4, W / 2 + .16);
    // under the floor between the bogies: the water tank and a pair of equipment boxes with louvres
    add(G.cyl(.28, .28, 1.2, 14), '#6f7c86', -.3, -.86, -.4, 0, 0, HP); add(G.box(.8, .36, .8, .05), '#4f5b63', .7, -.8, .3); for (let k = 0; k < 4; k++) add(G.box(.6, .02, .02, .005), '#3d474e', .7, -.7 - k * .07, .71);
    for (const bx of [-L / 2 + 1.0, L / 2 - 1.0]) {
      add(G.box(1.4, .16, 3.0, .05), '#45414f', bx, -.7, 0); add(G.box(.5, .14, 2.6, .04), '#55515f', bx, -.62, 0);
      for (const sz of [-1, 1]) {
        // the side frame outside the wheels: a dark beam, yellow coil springs over each axle box, brake blocks
        add(G.box(1.75, .26, .14, .06), '#4d4958', bx, WY, sz * (GA + .2)); add(G.box(.5, .16, .16, .04), '#5b5766', bx, WY + .2, sz * (GA + .2));
        for (const dx of [-.44, .44]) { add(G.cyl(.08, .08, .22, 10), C6.trim, bx + dx, WY + .26, sz * (GA + .2)); add(G.box(.18, .14, .18, .03), '#3f3b49', bx + dx, WY, sz * (GA + .2)); }
        for (const dx of [-.72, .72]) add(G.box(.08, .22, .12, .02), '#6c6878', bx + dx, WY - .02, sz * (GA - .08));
      }
    }
    // the track: a thick gravel bed (narrower at the top, a cut end of earth under it), long sleepers, two rails with their feet
    const TL = L + 1.3;
    add(G.box(TL, .24, 4.0, .08), C6.gravel, 0, RT - .2, 0); add(G.box(TL + .1, .5, 4.4, .1), C6.gravel2, 0, RT - .56, 0); add(G.box(TL + .16, .24, 4.5, .08), C6.earth, 0, RT - .92, 0);
    for (let x = -TL / 2 + .25; x < TL / 2; x += .48) add(G.box(.2, .09, 3.6, .02), C6.sleeper, x, RT - .1, 0);
    for (const sz of [-1, 1]) { add(G.box(TL, .1, .1, .01), C6.rail, 0, RT - .05, sz * GA); add(G.box(TL, .03, .17, .005), '#7d8590', 0, RT - .095, sz * GA); }
    for (let k = 0; k < 26; k++) add(G.sph(.055 + (k % 3) * .02, 6, 4), k % 2 ? C6.gravel2 : '#c9c3bb', -TL / 2 + .2 + (k * .61) % TL, RT - .1, (k % 2 ? 1 : -1) * (1.85 + (k % 3) * .04));
    for (const sz of [-1, 1]) { add(G.cyl(.12, .12, .1, 14), '#f7f0e4', L / 2 + .16, -.3, sz * 1.3, 0, 0, HP); add(G.cyl(.08, .08, .02, 12), C6.red, L / 2 + .21, -.3, sz * 1.3, 0, 0, HP); }
    add(G.box(.4, .22, .4, .05), C6.steel2, -L / 2 - .3, -.5, 0); tube([L / 2 + .1, -.45, .4], [L / 2 + .3, -.7, .5], .035, '#2f2b38');
  }));
  const pl = flat(1.6, .26, signTex('body', '식당칸 · 침대칸', C6.line, C6.bodyD)); put(pl, -.6, -.33, W / 2 + .162); f.add(pl);
  const axles = [];
  for (const bx of [-L / 2 + 1.0, L / 2 - 1.0]) for (const dx of [-.44, .44]) {
    const ax = grp(); put(ax, bx + dx, WY, 0); f.add(ax); axles.push(ax);
    ax.add(mc('tc6-axle3', ({ add }) => {
      for (const sz of [-1, 1]) { add(G.cyl(WR, WR, .13, 18), '#3d3946', 0, 0, sz * GA, HP, 0, 0); add(G.cyl(.21, .21, .15, 12), C6.steel, 0, 0, sz * GA, HP, 0, 0); add(G.cyl(.065, .065, .17, 8), C6.orange, 0, 0, sz * GA, HP, 0, 0); add(G.box(WR * 1.9, .1, .05, .01), '#55515f', 0, 0, sz * (GA + .05)); }
      add(G.cyl(.05, .05, GA * 2, 8), '#2f2b38', 0, 0, 0, HP, 0, 0);
    }));
  }
  f.live = axles;
  let last = -1;
  f.tick = t => { const fr = Math.floor(t * 30); if (fr === last) return; last = fr; for (const a of axles) a.rotation.z = t * 14; };
};

// ═════════════════════════ 창 쪽 벽 (먼 쪽, 두 층) + 둥근 지붕 띠 + 잘린 끝 단면 ═════════════════════════
// (along x at the far side z = -w/2): wood wainscot, cream wall, the band between the decks, the roof curving up and over from the
// wall top (the near half of the roof lifted off), two roof vents; at the cut end (+x) the ring of the car's round cross-section;
// o.menu: a framed menu between windows (its x), o.poster: a poster on the upper wall (its x)
B.tc6wall = (f, T, o = {}) => {
  const L = o.len || 5, W = o.w || 4, Z0 = -W / 2;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  foldBy(f, 0, 1);
  f.add(mc('tc6-wall2|' + L + W, ({ add }) => {
    add(G.box(L, WH, .1, .02), C6.up, 0, WH / 2, Z0 - .05);
    add(G.box(L + .02, WH + .02, .07, .02), C6.body, 0, WH / 2, Z0 - .135);
    add(G.box(L, .9, .04, .02), C6.wood, 0, .45, Z0 + .015); add(G.box(L, .06, .06, .02), C6.woodD, 0, .9, Z0 + .025);
    for (let x = -L / 2 + .4; x < L / 2 - .2; x += .5) add(G.box(.02, .8, .045, .004), C6.woodD, x, .45, Z0 + .02);
    add(G.box(L, .14, .06, .02), C6.woodD, 0, DECK + .3, Z0 + .02); add(G.box(L, .05, .07, .02), C6.trim, 0, WH - .15, Z0 + .03);
    // the roof: from the wall top it curves up and over toward the near side, then stops (cut) — its underside a cream ceiling
    const s = new THREE.Shape(); s.moveTo(Z0 - .17, WH - .1); s.quadraticCurveTo(Z0 - .17, ROOF + .14, Z0 + 1.0, ROOF + .14); s.lineTo(Z0 + 1.55, ROOF + .14); s.lineTo(Z0 + 1.55, ROOF - .02);
    s.lineTo(Z0 + 1.0, ROOF - .02); s.quadraticCurveTo(Z0 + .02, ROOF - .02, Z0 + .02, WH - .1); s.lineTo(Z0 - .17, WH - .1);
    const rg = G.ext(s, L, 0, 10); rg.rotateY(-HP); rg.translate(L / 2, 0, 0); add(rg, C6.bodyD, 0, 0, 0);
    const cs = new THREE.Shape(); cs.moveTo(Z0 + .02, WH - .1); cs.quadraticCurveTo(Z0 + .02, ROOF - .02, Z0 + 1.0, ROOF - .02); cs.lineTo(Z0 + 1.55, ROOF - .02); cs.lineTo(Z0 + 1.55, ROOF - .06);
    cs.lineTo(Z0 + 1.0, ROOF - .06); cs.quadraticCurveTo(Z0 + .06, ROOF - .06, Z0 + .06, WH - .1); cs.lineTo(Z0 + .02, WH - .1);
    const cg = G.ext(cs, L - .04, 0, 10); cg.rotateY(-HP); cg.translate(L / 2 - .02, 0, 0); add(cg, C6.up2, 0, 0, 0);
    for (const x of [-L / 4, L / 4]) { add(G.box(.9, .22, .45, .07), '#dfe4ea', x, ROOF + .24, Z0 + 1.0); for (let k = 0; k < 4; k++) add(G.box(.03, .02, .36, .005), C6.steel2, x - .3 + k * .2, ROOF + .36, Z0 + 1.0); }
    // the cut end's ring: the car's whole round cross-section in the body colour, a cream line inside it
    const ring = profile(new THREE.Shape(), W + .34, ROOF + .14); ring.holes.push(profile(new THREE.Path(), W + .34, ROOF + .14, .12));
    const rr = G.ext(ring, .1, .012, 10); rr.rotateY(-HP); rr.translate(L / 2 + .1, 0, 0); add(rr, C6.body, 0, 0, 0);
    const ri = profile(new THREE.Shape(), W + .34, ROOF + .14, .12); ri.holes.push(profile(new THREE.Path(), W + .34, ROOF + .14, .16));
    const rj = G.ext(ri, .11, 0, 10); rj.rotateY(-HP); rj.translate(L / 2 + .105, 0, 0); add(rj, C6.line, 0, 0, 0);
  }));
  if (o.menu != null) { f.add(put(mc('tc6-menuframe2', ({ add }) => add(G.box(.34, .46, .03, .01), C6.woodD, 0, 0, 0)), o.menu, 1.62, Z0 + .02)); const m = flat(.29, .39, menuTex()); put(m, o.menu, 1.62, Z0 + .04); f.add(m); }
  if (o.poster != null) { f.add(put(mc('tc6-posterframe', ({ add }) => add(G.box(.44, .58, .03, .01), C6.woodD, 0, 0, 0)), o.poster, 3.65, Z0 + .02)); const m = flat(.38, .51, posterTex(1)); put(m, o.poster, 3.65, Z0 + .04); f.add(m); }
};

// ═════════════════════════ 먼 끝벽 + 연결 통로 문 ═════════════════════════
// (across the far end x = -len/2, local +z into the car — placed with a = π/2): the car's round cross-section with the doorway cut in
// at o.door (local x); the sliding door (code lock), the car sign over it, the route map and the destination board, a fire box, a
// little shelf with a radio, the clock and a poster up by the loft; outside, a short piece of the gangway bellows
B.tc6end = (f, T, o = {}) => {
  const W = o.w || 4, dx = o.door ?? -1, DWd = 1.1, DH = 2.2;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  f.walkBoxes = [[-W / 2, 0, -.08, dx - DWd / 2, 2.6, .08], [dx + DWd / 2, 0, -.08, W / 2, 2.6, .08]];
  foldBy(f, 1, 0);
  f.add(mc('tc6-end2|' + W + dx, ({ add }) => {
    const s = profile(new THREE.Shape(), W + .34, ROOF + .14, 0, [dx - DWd / 2 - .04, dx + DWd / 2 + .04, DH + .04]);
    const g = G.ext(s, .14, .015, 10); g.translate(0, 0, -.07); add(g, C6.up, 0, 0, 0);
    const sk = profile(new THREE.Shape(), W + .34, ROOF + .14); sk.holes.push(profile(new THREE.Path(), W + .34, ROOF + .14, .16));
    const gk = G.ext(sk, .06, 0, 10); gk.translate(0, 0, .07); add(gk, C6.bodyD, 0, 0, 0);
    add(G.box(W, .9, .04, .02), C6.wood, 0, .45, .09); add(G.box(W, .14, .06, .02), C6.woodD, 0, DECK + .3, .09);
    for (const sd of [-1, 1]) add(G.box(.08, DH, .2, .02), C6.steel, dx + sd * (DWd / 2 + .02), DH / 2, 0); add(G.box(DWd + .2, .08, .2, .02), C6.steel, dx, DH, 0);
    add(G.box(.42, .5, .1, .03), C6.red, dx + 1.15, 1.0, .1); add(G.box(.3, .36, .01, .02), '#ffffff', dx + 1.15, 1.03, .155);
    // the radio shelf under the loft, the clock's rim
    add(G.box(.6, .04, .24, .01), C6.woodD, 1.25, 1.55, .19); for (const sx of [-.25, .25]) add(G.box(.03, .14, .2, .005), C6.woodD, 1.25 + sx, 1.48, .18);
    add(G.box(.34, .2, .14, .04), C6.coral, 1.18, 1.67, .2); add(G.cyl(.05, .05, .02, 12), C6.dark, 1.1, 1.67, .275, HP, 0, 0); add(G.box(.12, .08, .01, .01), C6.white, 1.26, 1.69, .275);
    add(G.tor(.2, .028, PI * 2, 6, 24), C6.woodD, -.7, 3.95, .1);
    for (let k = 0; k < 3; k++) { const z = -.12 - k * .1; add(G.box(DWd + .36, 2.36, .08, .03), k % 2 ? C6.rubber : C6.rubber2, dx, 1.18, z); }
    add(G.box(DWd + .2, .04, .4, .01), '#b7bec8', dx, .02, -.25);
  }));
  const ck = mesh(new THREE.CircleGeometry(.19, 24), mat('#ffffff', { map: clockTex(), rim: 0 }), { cast: false }); put(ck, -.7, 3.95, .115); f.add(ck);
  const ps = flat(.5, .67, posterTex(0)); put(ps, 1.0, 3.6, .1); f.add(ps); f.add(put(mc('tc6-endposter', ({ add }) => add(G.box(.56, .73, .02, .01), C6.woodD, 0, 0, 0)), 1.0, 3.6, .085));
  const rm = flat(1.5, .32, routeTex()); put(rm, dx + .2, 2.62, .1); f.add(rm);
  const ld = flat(.8, .15, ledTex()); put(ld, dx, 2.3, .1); f.add(ld);
  const dv = grp(); put(dv, dx, 0, .1); f.add(dv);
  dv.add(mc('tc6-door2', ({ add }) => {
    add(G.box(DWd - .02, DH - .08, .05, .025), '#a9c7e6', 0, (DH - .08) / 2, 0); add(G.box(.46, .62, .02, .04), C6.line, 0, 1.45, .03); add(G.box(.38, .54, .02, .03), '#dff0fb', 0, 1.45, .04);
    add(G.box(.035, .32, .04, .01), C6.steel, .42, 1.0, .03); add(G.box(.24, .08, .01, .02), C6.trim, 0, .62, .03);
  }));
  const sg = flat(.42, .1, signTex('car2', '2호차', C6.bodyD, '#ffffff')); put(sg, 0, 1.9, .036); dv.add(sg);
  const p = f.part('door', dv, (t, b) => { dv.position.x = b.p.x + 1.0 * t; }, { label: '연결 통로 문', sfx: 'slide', dur: .4 });
  p.lockable = true; p.lockKind = 'code'; p.lockAt = { x: -.32, y: 1.0, z: .05, parent: dv };
  f.spot('inside', null, dx, .03, -.4, { part: p, maxH: .62, label: '연결 통로 안', scale: 1 });
  f.spot('on', null, 1.4, 1.58, .2, { maxH: .22, label: '라디오 선반 위', scale: .65 });
};

// ═════════════════════════ 둥근 모서리 기차 창 ═════════════════════════
// (against the far wall, local +z into the car): a rounded frame plate, the flowing view behind it, a sill; o.ww × o.hh at height
// o.cy; o.blind a roller blind (label '롤 블라인드' — the stage's tunnel zoom skips a window with it down); o.curtain café curtains
B.twindow6 = (f, T, o = {}) => {
  const Wd = o.ww || 1.2, H = o.hh || 1.2, cy = o.cy ?? 1.6;
  f.noSolid = true; foldBy(f, 0, 1);
  f.add(roundFrame(Wd, H, cy, .12, .1, o.up ? C6.woodD : C6.wood));
  f.tick = flowView(f.group, Wd, H, cy, .025);
  f.add(mc('twindow6-sill|' + Wd, ({ add }) => { add(G.box(Wd + .34, .05, .2, .02), C6.up2, 0, cy - H / 2 - .14, .12); add(G.box(.05, .5, .004, .002), '#ffffff', -Wd * .28, cy + .08, .05, 0, 0, .5); }));
  if (o.blind) {
    const bl = grp(); put(bl, 0, cy + H / 2 + .1, .16); f.add(bl);
    f.add(mc('twindow6-roll|' + Wd, ({ add }) => add(G.cyl(.06, .06, Wd + .12, 12), C6.woodD, 0, cy + H / 2 + .12, .16, 0, 0, HP)));
    bl.add(mc('twindow6-blind2|' + Wd, ({ add }) => { add(G.box(Wd + .06, 1, .012, .004), '#f3dcae', 0, -.5, 0); for (let k = 1; k < 5; k++) add(G.box(Wd + .06, .01, .014, .003), '#e6c995', 0, -k * .2, 0); add(G.box(Wd + .1, .04, .03, .01), C6.woodD, 0, -1, 0); }));
    bl.scale.y = H * .55;
    const p = f.part('lift', bl, t => { bl.scale.y = Math.max(.05, H * .55 * (1 - .92 * t)); }, { label: '롤 블라인드', sfx: 'swish', dur: .4 });
    f.spot('inside', null, -.3, cy - H / 2 - .11, .14, { part: p, maxH: .25, label: '블라인드 뒤 창턱', scale: .75 });
  } else if (!o.noSill) f.spot('on', null, .28, cy - H / 2 - .11, .14, { maxH: .25, label: '창턱', scale: .78 });
  if (o.curtain) f.add(mc('twindow6-curtain|' + Wd, ({ add }) => {
    add(G.cyl(.02, .02, Wd + .5, 8), C6.woodD, 0, cy + H / 2 + .2, .2, 0, 0, HP);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) add(G.box(.1, H + .1, .05, .03), k % 2 ? C6.curtain : C6.curtain2, s * (Wd / 2 + .12 - k * .07), cy + .1, .2 + (k % 2) * .02);
  }));
};

// ═════════════════════════ 옆 출입문 ═════════════════════════
// (against the far wall, .9 wide, local +z into the car): a frame, two sliding leaves with their own little windows (the view flows in
// them too, going with the leaves), a yellow step line, grab bars
B.tc6door = (f, T, o = {}) => {
  const DWd = .9, DH = 2.15;
  f.noSolid = true; foldBy(f, 0, 1);
  f.add(mc('tc6-doorframe', ({ add, tube }) => {
    add(G.box(DWd + .22, .12, .14, .04), C6.woodD, 0, DH + .06, .05); for (const s of [-1, 1]) add(G.box(.11, DH, .14, .04), C6.woodD, s * (DWd / 2 + .055), DH / 2, .05);
    add(G.box(DWd + .2, .025, .4, .01), C6.steel, 0, .013, .2); add(G.box(DWd + .2, .012, .07, .005), C6.lamp, 0, .028, .38);
    for (const s of [-1, 1]) tube([s * (DWd / 2 + .15), .9, .14], [s * (DWd / 2 + .15), 1.6, .14], .02, C6.steel, 8);
  }));
  const leaves = [-1, 1].map(s => {
    const g = grp(); put(g, s * DWd / 4, 0, .04); f.add(g);
    g.add(mc('tc6-leaf', ({ add }) => { add(G.box(DWd / 2 - .02, DH - .02, .05, .02), '#a9c7e6', 0, (DH - .02) / 2, 0); add(G.box(DWd / 2 - .14, .05, .06, .01), C6.trim, 0, .95, .01); }));
    return g;
  });
  const ticks = leaves.map(g => flowView(g, DWd / 2 - .16, .6, 1.55, .03));
  f.tick = t => { for (const k of ticks) k(t); };
  f.part('door', leaves, (t, a, b) => { leaves[0].position.x = a.p.x - .4 * t; leaves[1].position.x = b.p.x + .4 * t; }, { label: '출입문', sfx: 'slide', dur: .45 });
  f.spot('on', null, .2, .03, .26, { maxH: .3, label: '출입문 발판', scale: .85 });
};

// ═════════════════════════ 식탁 칸 ═════════════════════════
// (one booth against the window, 1.9 along the wall × 1.05 in, local -z at the wall): two benches facing over a table with a cloth
// (moquette seats), a table lamp, a station bento with its red band, two teacups on saucers, a tented menu card; o.drawer: the left
// bench's base is a drawer (padlock)
B.tc6booth = (f, T, o = {}) => {
  const SH = .46, D = 1.05, z0 = -.02;
  f.add(mc('tc6-booth2', ({ add, tube }) => {
    for (const s of [-1, 1]) {
      add(G.box(.46, SH - .14, D - .1, .03), C6.up2, s * .6, (SH - .14) / 2, z0);
      add(G.box(.48, .18, D, .08), C6.seat, s * .6, SH - .06, z0);
      add(G.box(.18, .8, D, .08), C6.seatD, s * .86, SH + .4, z0);
      add(G.box(.22, .06, D + .04, .02), C6.wood, s * .86, SH + .83, z0); add(G.box(.12, .16, .06, .03), '#ffffff', s * .84, SH + .72, z0 + .3);
    }
    add(G.box(.56, .05, .6, .02), C6.wood, 0, .74, -D / 2 + .32); add(G.box(.6, .02, .64, .01), '#fffaf1', 0, .77, -D / 2 + .32); add(G.box(.62, .1, .02, .005), '#fffaf1', 0, .73, -D / 2 + .64);
    add(G.cyl(.04, .05, .7, 10), C6.woodD, 0, .38, -D / 2 + .32);
    add(G.cyl(.05, .06, .03, 12), C6.trim, -.16, .79, -D / 2 + .12); tube([-.16, .79, -D / 2 + .12], [-.16, 1.0, -D / 2 + .12], .012, C6.trim, 6); add(G.cyl(.07, .12, .12, 14), C6.lamp, -.16, 1.04, -D / 2 + .12);
    add(G.box(.18, .05, .13, .02), '#d9b382', .1, .81, -D / 2 + .28); add(G.box(.19, .012, .14, .005), C6.red, .1, .835, -D / 2 + .28); add(G.box(.02, .052, .14, .004), C6.red, .1, .812, -D / 2 + .28);
    for (const x of [-.12, .16]) { add(G.cyl(.035, .03, .06, 10), '#ffffff', x, .81, -D / 2 + .5); add(G.cyl(.05, .05, .006, 12), '#ffffff', x, .785, -D / 2 + .5); add(G.cyl(.026, .026, .004, 10), '#c98a52', x, .842, -D / 2 + .5); }
    add(G.box(.12, .1, .005, .004), C6.paper, .02, .83, -D / 2 + .16, -.3, 0, 0); add(G.box(.12, .1, .005, .004), C6.paper, .02, .83, -D / 2 + .2, .3, 0, 0);
  }));
  const mq = moquette(C6.seat, C6.moq);
  for (const s of [-1, 1]) { const p = flat(.42, D - .12, mq); put(p, s * .6, SH + .034, z0, -HP); f.add(p); }
  f.spot('on', null, .14, .78, -D / 2 + .42, { maxH: .26, label: '식탁 위', scale: .8 });
  f.spot('on', null, .6, SH + .04, z0 + .12, { maxH: .36, label: '오른쪽 좌석 위', scale: .95 });
  f.spot('on', null, -.6, SH + .04, z0 + .12, { maxH: .36, label: '왼쪽 좌석 위', scale: .95 });
  f.spot('under', null, 0, .01, z0 + .38, { maxH: .3, label: '좌석 밑', scale: .85 });
  if (o.drawer) {
    const dv = grp(); put(dv, -.6, .17, z0 + D / 2 - .02); f.add(dv);
    dv.add(mc('tc6-drawer2', ({ add }) => { add(G.box(.42, .2, .06, .02), C6.up, 0, 0, 0); add(G.box(.18, .04, .03, .01), C6.trim, 0, .02, .04); }));
    const p = f.part('drawer', dv, (t, b) => { dv.position.z = b.p.z + .4 * t; }, { label: '좌석 서랍', sfx: 'drawer', dur: .26 });
    p.lockable = true; p.lockKind = 'pad'; p.lockAt = { x: .12, y: -.02, z: .05, parent: dv };
    f.spot('inside', dv, 0, -.08, -.2, { part: p, maxH: .16, label: '좌석 서랍 안', scale: .8 });
  }
};

// ═════════════════════════ 짐 그물 선반 · 손잡이 ═════════════════════════
// (over a window, local x along the wall): brackets, a front bar, a net slung between; a straw hat and a tote bag on it
B.tc6net = (f, T, o = {}) => {
  const L = o.len || 1.6, Y = 2.38;
  f.noSolid = true; foldBy(f, 0, 1);
  f.add(mc('tc6-net|' + L, ({ add, tube }) => {
    for (const x of [-L / 2, L / 2]) { add(G.box(.05, .05, .46, .012), C6.woodD, x, Y, .23); tube([x, Y, .02], [x, Y - .24, .02], .02, C6.woodD, 6); tube([x, Y - .24, .02], [x, Y, .4], .016, C6.woodD, 6); }
    tube([-L / 2, Y, .45], [L / 2, Y, .45], .022, C6.steel, 8);
    add(G.cyl(.2, .2, .03, 18), '#ecd08a', -.35, Y + .05, .24); add(G.cyl(.11, .12, .1, 14), '#f0d896', -.35, Y + .11, .24); add(G.cyl(.122, .122, .03, 14), C6.coral, -.35, Y + .08, .24);
    add(G.box(.36, .28, .14, .05), C6.mint, .35, Y + .16, .22); tube([.25, Y + .3, .22], [.45, Y + .3, .22], .012, C6.dark, 5);
  }));
  const net = mesh(new THREE.PlaneGeometry(L, .44), new THREE.MeshBasicMaterial({ map: netTex(), transparent: true, alphaTest: .3, side: THREE.DoubleSide }), { cast: false });
  put(net, 0, Y - .03, .23, -HP + .08); f.add(net);
  f.spot('on', null, .0, Y + .02, .24, { maxH: .3, label: '그물 선반 위', scale: .8 });
};
B.tc6pole = (f, T, o = {}) => {
  f.add(mc('tc6-pole', ({ add, tube }) => { tube([0, 0, 0], [0, 2.4, 0], .028, C6.steel, 10); add(G.cyl(.06, .07, .03, 12), C6.steel2, 0, .015, 0); add(G.box(.1, .14, .07, .03), C6.white, 0, 1.25, .04); }));
  const bt = grp(); put(bt, 0, 1.25, .085); f.add(bt);
  bt.add(mc('tc6-bellbtn', ({ add }) => add(G.cyl(.032, .032, .03, 12), C6.lamp, 0, 0, 0, HP, 0, 0)));
  f.part('button', bt, (t, b) => { bt.position.z = b.p.z - .015 * Math.sin(t * PI); }, { label: '하차 벨', sfx: 'stationChime', dur: .3 });
};
// (along x, o.len): a ceiling-height rail on two drop rods with hanging rings
B.tc6straps = (f, T, o = {}) => {
  const L = o.len || 2.4, Y = 2.42;
  f.noSolid = true; f.collideBox = [0, 0, 0, 0, 0, 0];
  f.add(mc('tc6-straps|' + L, ({ add, tube }) => {
    tube([-L / 2, Y, 0], [L / 2, Y, 0], .025, C6.steel, 8);
    for (const x of [-L / 2 + .1, L / 2 - .1]) tube([x, Y, 0], [x, Y + .3, -.4], .016, C6.steel2, 6);
    for (let x = -L / 2 + .3; x < L / 2 - .2; x += .42) { add(G.box(.028, .22, .01, .004), '#6b4a3a', x, Y - .12, 0); add(G.tor(.055, .014, PI * 2, 6, 12), C6.white, x, Y - .28, 0); }
  }));
};

// ═════════════════════════ 짐칸 선반 (2층 다락 밑) · 우산꽂이 구석 ═════════════════════════
// (against the window wall, local x along it, 1.8 × .55, three shelves): labelled boxes and a basket; on the top shelf the big suitcase
// comes forward (lockable — 너굴이 hides behind it, "…선반 위는 반칙") beside a duffel bag
B.tc6rack = (f, T, o = {}) => {
  const L = 1.8, D = .55, Y1 = .85, Y2 = 1.62;
  f.add(mc('tc6-rack2', ({ add, tube }) => {
    for (const x of [-L / 2, L / 2]) for (const z of [-D / 2 + .03, D / 2 - .03]) add(G.box(.05, 2.2, .05, .01), C6.steel2, x, 1.1, z);
    for (const y of [.08, Y1, Y2]) add(G.box(L + .06, .05, D, .01), C6.steel, 0, y, 0);
    for (const [x, w, h, c] of [[-.6, .5, .45, '#d9b382'], [-.05, .45, .35, '#e8c99a'], [.5, .5, .5, '#c99b68']]) { add(G.box(w, h, .45, .03), c, x, .1 + h / 2, 0); add(G.box(w * .5, .08, .005, .004), C6.white, x, .1 + h * .6, .228); }
    add(G.cyl(.18, .15, .26, 14), '#d6a670', -.45, Y1 + .16, 0); for (let k = 0; k < 4; k++) add(G.sph(.06, 8, 6), C6.orange, -.52 + (k % 2) * .12, Y1 + .3 + Math.floor(k / 2) * .04, (k % 2) * .05);
    add(G.box(.42, .3, .38, .05), C6.blue, .35, Y1 + .18, 0); add(G.box(.2, .03, .01, .004), C6.line, .35, Y1 + .25, .195);
    add(G.cyl(.15, .15, .5, 14), C6.curtain2, .55, Y2 + .18, 0, 0, 0, HP); for (const dx of [-.16, .16]) add(G.cyl(.155, .155, .03, 14), C6.bodyD, .55 + dx, Y2 + .18, 0, 0, 0, HP);
  }));
  const sc = grp(); put(sc, -.35, Y2 + .03, 0); f.add(sc);
  sc.add(mc('tc6-suitcase2', ({ add, tube }) => {
    add(G.box(.62, .44, .38, .07), C6.coral, 0, .22, 0); for (const x of [-.18, .18]) add(G.box(.04, .44, .4, .01), '#d76f5f', x, .22, 0);
    tube([-.1, .45, 0], [-.08, .52, 0], .016, C6.dark, 6); tube([-.08, .52, 0], [.08, .52, 0], .016, C6.dark, 6); tube([.08, .52, 0], [.1, .45, 0], .016, C6.dark, 6);
    add(G.box(.14, .1, .01, .03), C6.lamp, -.12, .3, .195); add(G.cyl(.05, .05, .01, 12), '#8fd3f4', .14, .14, .196, HP, 0, 0);
  }));
  const p = f.part('lift', sc, (t, b) => { sc.position.z = b.p.z + .32 * t; sc.position.y = b.p.y + .05 * Math.sin(t * PI); sc.rotation.x = .3 * t; }, { label: '짐 선반 여행 가방', sfx: 'lift_fabric', dur: .45 });
  p.lockable = true; p.lockAt = { x: 0, y: .22, z: .2, parent: sc };
  f.spot('on', null, -.35, Y2 + .03, -.12, { part: p, maxH: .45, label: '여행 가방 뒤', scale: .95 });
  f.spot('on', null, .1, .12, .05, { maxH: .3, label: '짐칸 아래 칸', scale: .85 });
  f.spot('on', null, -.05, Y1 + .03, .08, { maxH: .3, label: '바구니 옆', scale: .8 });
};
// (a corner under the loft): an umbrella stand with two umbrellas, a woven basket of tangerines
B.tc6corner = (f, T, o = {}) => {
  f.add(mc('tc6-corner', ({ add, tube }) => {
    add(G.cyl(.14, .12, .42, 14), C6.steel2, 0, .21, 0); add(G.cyl(.145, .145, .03, 14), C6.trim, 0, .4, 0);
    tube([-.03, .1, .02], [-.08, .95, -.05], .035, C6.blue, 8); add(G.tor(.05, .014, PI, 6, 10), '#8a5a34', -.1, .98, -.05, 0, HP, 0);
    tube([.04, .1, -.02], [.1, .85, .03], .03, C6.coral, 8); add(G.tor(.045, .013, PI, 6, 10), '#8a5a34', .12, .88, .03, 0, HP, 0);
    add(G.cyl(.22, .18, .2, 16), '#d6a670', .45, .1, .1); for (let k = 0; k < 5; k++) add(G.sph(.065, 8, 6), C6.orange, .38 + (k % 3) * .07, .22 + Math.floor(k / 3) * .05, .06 + (k % 2) * .08);
  }));
  f.spot('on', null, .45, .3, .1, { maxH: .26, label: '귤 바구니 위', scale: .8 });
  f.spot('on', null, -.1, .01, .3, { maxH: .3, label: '우산꽂이 옆', scale: .85 });
};

// ═════════════════════════ 2층 침대 칸 · 다락 짐 ═════════════════════════
// (on the upper deck along the window wall, o.len × .85, local -z at the wall): a mattress with a mint quilt and a pillow, an open book
// and glasses on the quilt, a reading lamp on the wall, a curtain on its rod along the open side (a part: drawn closed)
B.tc6berth = (f, T, o = {}) => {
  const L = o.len || 1.8, D = .85;
  f.add(mc('tc6-berth2|' + L, ({ add, tube }) => {
    add(G.box(L, .3, D, .05), C6.woodD, 0, .15, 0); add(G.box(L - .08, .16, D - .08, .07), '#fffaf1', 0, .38, 0);
    add(G.box(L * .62, .1, D - .06, .06), C6.blanket, .28, .48, 0); add(G.box(L * .62, .02, .1, .01), '#ffffff', .28, .53, -D / 2 + .1);
    add(G.box(.42, .13, .5, .07), '#ffffff', -L / 2 + .3, .5, -.05); add(G.box(.4, .02, .06, .01), '#c9e4f6', -L / 2 + .3, .57, -.05);
    add(G.box(.26, .02, .2, .005), C6.paper, .1, .545, .12, 0, .2, .08); add(G.box(.26, .025, .2, .005), C6.coral, .1, .535, .12, 0, .2, 0);
    for (const s of [-1, 1]) add(G.tor(.035, .006, PI * 2, 4, 12), C6.dark, -.28 + s * .05, .54, .2, HP, 0, 0); add(G.box(.03, .006, .006, .002), C6.dark, -.28, .54, .2);
    add(G.box(.08, .5, D, .03), C6.wood, -L / 2 - .02, .4, 0); add(G.box(.08, .5, D, .03), C6.wood, L / 2 + .02, .4, 0);
    tube([-L / 2, 1.5, D / 2 + .06], [L / 2, 1.5, D / 2 + .06], .018, C6.trim, 8);
    add(G.box(.08, .1, .06, .02), C6.trim, -L / 2 + .45, 1.0, -D / 2 + .03); add(G.cyl(.04, .07, .09, 12), C6.lamp, -L / 2 + .45, .92, -D / 2 + .1);
  }));
  const cur = grp(); put(cur, -L / 2 + .05, 1.48, D / 2 + .06); f.add(cur);
  cur.add(mc('tc6-berthcurtain2', ({ add }) => { for (let k = 0; k < 4; k++) add(G.box(.12, 1.05, .05, .03), k % 2 ? C6.curtain : C6.curtain2, k * .1, -.52, (k % 2) * .02); }));
  f.part('curtain', cur, t => { cur.scale.x = 1 + (L / .42 - 1) * t; }, { label: '커튼', sfx: 'swish', dur: .35 });
  f.spot('on', null, .55, .56, .05, { maxH: .34, label: '침대 위', scale: .95 });
  f.spot('on', null, -L / 2 + .3, .57, .28, { maxH: .26, label: '베개 옆', scale: .8 });
};
// (on the loft floor): a pair of slippers by the ladder, a small bag, a lantern
B.tc6loftbits = (f, T, o = {}) => {
  f.add(mc('tc6-loftbits', ({ add, tube }) => {
    for (const s of [-1, 1]) { add(G.box(.11, .04, .24, .03), '#f6b6c8', s * .08, .02, 0); add(G.box(.11, .05, .08, .03), '#ffffff', s * .08, .045, -.06); }
    add(G.box(.42, .3, .24, .06), C6.curtain2, -.6, .15, -.05); tube([-.68, .3, -.05], [-.52, .3, -.05], .014, C6.dark, 5);
    add(G.cyl(.06, .07, .16, 10), C6.dark, -.95, .08, .1); add(G.cyl(.05, .05, .1, 10), '#fff3b8', -.95, .2, .1); add(G.tor(.04, .008, PI, 4, 10), C6.dark, -.95, .3, .1);
  }));
  f.spot('on', null, .3, .01, .05, { maxH: .26, label: '슬리퍼 옆', scale: .8 });
  f.spot('on', null, -.6, .31, -.05, { maxH: .24, label: '작은 가방 위', scale: .75 });
};

// ═════════════════════════ 찻잔 수레 · 바닥 짐 ═════════════════════════
// (a little wheeled cart): a teapot and cups on top, a basket of bread rolls below
B.tc6cart = (f, T, o = {}) => {
  const W = .7, D = .45, TY = .74;
  f.add(mc('tc6-cart', ({ add, tube }) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { tube([sx * W / 2, .07, sz * D / 2], [sx * W / 2, TY, sz * D / 2], .018, C6.woodD, 6); add(G.sph(.045, 8, 6), C6.dark, sx * W / 2, .045, sz * D / 2); }
    add(G.box(W + .04, .04, D + .04, .01), C6.wood, 0, TY, 0); add(G.box(W, .03, D, .01), C6.wood, 0, .3, 0);
    tube([-W / 2 - .02, TY + .08, D / 2], [-W / 2 - .14, TY + .18, D / 2], .014, C6.steel, 6); tube([-W / 2 - .02, TY + .08, -D / 2], [-W / 2 - .14, TY + .18, -D / 2], .014, C6.steel, 6); tube([-W / 2 - .14, TY + .18, -D / 2], [-W / 2 - .14, TY + .18, D / 2], .014, C6.steel, 6);
    add(G.sph(.11, 12, 10), '#ffffff', -.15, TY + .11, 0, 0, 0, 0, [1, .8, 1]); tube([-.05, TY + .1, 0], [.04, TY + .15, 0], .02, '#ffffff', 6); add(G.cyl(.03, .03, .04, 8), C6.coral, -.15, TY + .21, 0);
    for (const [x, z] of [[.14, -.1], [.24, .06], [.1, .12]]) { add(G.cyl(.035, .03, .065, 10), '#ffffff', x, TY + .055, z); add(G.cyl(.05, .05, .006, 12), '#ffffff', x, TY + .025, z); }
    add(G.cyl(.15, .12, .1, 14), '#d9a86c', 0, .37, 0); for (let k = 0; k < 4; k++) add(G.sph(.06, 8, 6), '#e4bb82', -.06 + (k % 2) * .12, .43, -.04 + Math.floor(k / 2) * .08);
  }));
  f.spot('on', null, .2, TY + .02, -.12, { maxH: .26, label: '수레 위', scale: .8 });
  f.spot('on', null, .24, .32, .1, { maxH: .26, label: '수레 아래 칸', scale: .75 });
};
B.tc6bag = (f, T, o = {}) => {
  f.add(mc('tc6-bag', ({ add, tube }) => {
    add(G.cyl(.18, .18, .6, 14), '#a2c8bb', 0, .18, 0, 0, 0, HP); for (const dx of [-.2, .2]) add(G.cyl(.185, .185, .04, 14), C6.bodyD, dx, .18, 0, 0, 0, HP);
    tube([-.1, .34, -.06], [0, .44, -.06], .014, C6.dark, 5); tube([0, .44, -.06], [.1, .34, -.06], .014, C6.dark, 5);
    add(G.box(.26, .3, .16, .02), '#d9b382', .45, .15, .08, 0, .3, 0); add(G.box(.14, .06, .1, .02), '#5fb35a', .45, .33, .08, 0, .3, 0);
  }));
  f.spot('on', null, 0, .37, 0, { maxH: .26, label: '짐 위', scale: .8 });
};

export const TRAINCAR6_BUILDERS = B;
export const TRAINCAR6_INFO = {
  tc6shell: { w: 5, d: 4, name: '차체', hidden: true },
  tc6wall: { w: 5, d: .2, name: '칸 벽', hidden: true },
  tc6end: { w: 4, d: .2, name: '칸 끝벽', hidden: true },
  twindow6: { w: 1.3, d: .3, name: '기차 창', hidden: true },
  tc6door: { w: 1.1, d: .4, name: '옆 출입문', hidden: true },
  tc6booth: { w: 1.9, d: 1.1, name: '식탁 칸', hidden: true },
  tc6net: { w: 1.6, d: .5, name: '짐 그물 선반', hidden: true },
  tc6pole: { w: .2, d: .2, name: '손잡이 봉', hidden: true },
  tc6straps: { w: 2.4, d: .2, name: '손잡이 고리', hidden: true },
  tc6rack: { w: 1.8, d: .55, name: '짐칸 선반', hidden: true },
  tc6corner: { w: .8, d: .5, name: '우산꽂이', hidden: true },
  tc6berth: { w: 1.8, d: .9, name: '침대 칸', hidden: true },
  tc6loftbits: { w: 1.2, d: .4, name: '다락 짐', hidden: true },
  tc6cart: { w: .8, d: .5, name: '찻잔 수레', hidden: true },
  tc6bag: { w: .8, d: .4, name: '바닥 짐', hidden: true },
};

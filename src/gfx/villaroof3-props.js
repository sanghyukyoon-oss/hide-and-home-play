// 20판 새 안 '햇살빌라 옥상 집들이' villaroof3 (① 10/23 — 사용자 "얘도 다시 처음부터.. 빌라 아래를 GPT처럼 대략 만들어 주고 배경도 대략
// 잡아 준 것 자체는 좋지만.. 좀 더 현실적이고 디테일하게 모델링 다시 해 줘"; 앞서 "옥상 수조 좀 더 크게, 문·벽돌색·나무·장독대가 오리지널처럼,
// 건물에 그리다 만 벽돌 텍스처 같은 건 버리자").
//   vr3_villa    — 옥상 아래로 이어지는 3층 적벽돌 빌라 몸통(벽돌 결 텍스처 한 장으로 고르게), 층마다 크림 띠, 알루미늄 창(커튼·블라인드·
//                  간유리)·방범창·화분대·실외기·도시가스 세로관(벽 따라 곧게, 층마다 밸브·계량기)·우수관·계단실 유리블록, 1층 필로티(빈 주차 칸·
//                  스쿠터·분리수거함·우편함·현관), 3층 계단실 단면(내려온 끝에 복도 바닥·뉴얼 기둥 난간), E 면 햇살빌라 간판(한·영 글자),
//                  옥상 난간(바깥은 벽돌, 안은 크림 + 초록 방수 턱)과 초록 우레탄 방수 바닥(롤러 결·덧칠·실금·배수구)
//   vr3_town     — 둘레(외곽선 없음): T자 길·인도·연석·노면 표시, 동네 텃밭·비닐하우스·쌈지 공원(정자·벤치)·생울타리·가로수·먼 나무, 멀리 21판 파출소
//   vr3_potrow   — 데크 앞줄 2단 화분 선반 · vr3_tap — 앞 오른쪽 수돗가(대야 수박·양동이·호스 수레)
//   vr3_stairhut — 계단실(옛 옥탑방의 벽돌·초록 철문·번호키 그대로, 문은 code 자물쇠 자리) 위에 크게 올린 노란 물탱크(사다리·배관·맨홀 뚜껑)
// 계약은 house-props.js와 같음: 원점 = 자리 가운데 바닥, 앞은 +z. 정적인 것은 꼭짓점 색 한 덩어리(hmc), 결이 있는 면은 평면 매핑 텍스처 한 덩어리.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mat, mesh, geo, canvasTex, texCache, STYLE } from './kit.js';
import { HG as G, hxf as xf, hmc as mc } from './house-props.js';
import { LANG, addI18n } from '../i18n.js';
import { addPigeon } from './birds.js';

addI18n({
  '햇살빌라 몸통과 옥상': 'Sunny Villa and its roof', '햇살빌라 동네': 'Sunny Villa neighbourhood', '계단실과 물탱크': 'Stair hut and water tank',
  '난간 구석': 'Parapet corner', '계단실 문': 'Stair hut door', '계단실 문 안': 'Inside the stair hut door', '문턱 위': 'On the doorstep', '사다리 옆': 'By the ladder',
  '옥상 화분 선반': 'Rooftop plant shelf', '옥상 수돗가': 'Rooftop tap', '화분 줄 앞': 'In front of the pots', '파란 양동이 안': 'In the blue bucket', '수도 옆': 'By the tap',
});

const PI = Math.PI, HP = PI / 2;
// 건물 크기: 바깥 면 x ±BX, z ±BZ, 옥상 바닥 y 0, 땅 y -DROP. 층 높이 FH (3층 -1.85..0, 2층 -3.7..-1.85), 1층 필로티 -5.1..-3.7
export const BX = 3.52, BZ = 3.02, DROP = 5.1, FH = 1.85, PH = .62;
const IN = .2, PX = BX - IN, PZ = BZ - IN;
// 3층 계단실 단면 (E 면을 잘라 안이 보임 — 사용자 승인 방향 10/23 '아래층 계단실 단면을 살짝'): x NX..BX, z -NZ0..-NZ1, y -FH..-.14
const NX = 1.75, NZ0 = 2.82, NZ1 = 1.45;
const CREAM = '#efe4d2', CREAM2 = '#e3d6c0', BAND = '#eadfcb', INNER = '#f1e9dc', GREEN = '#8fc29d', GREEN2 = '#7fb48e',
  WHITE = '#f7f6f2', ALU = '#c9ccd1', ALU2 = '#a9aeb6', DARK = '#3d3a44', GAS = '#f0c13a', PIPE = '#d9d6cf', STEEL = '#8a93a3',
  LEAF = '#6cbf5a', LEAF2 = '#4fa64f', POT = '#d98b5f', TANKY = '#f4c23e', TANKY2 = '#dfa92c';
const B = {};

// ── 텍스처 (같은 그림은 한 번만 — texCache) ─────────────────────────────────────────────────────────────────────────────
const TEX = texCache();
const rng = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const rep = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
// 적벽돌 (1 m 한 장, 8켜, 벽돌 .25 m): 벽돌마다 조금씩 다른 색, 윗면 빛·아랫면 그늘, 잔 점
function brickTex() {
  return TEX.get('vr3brick', () => rep(canvasTex(512, 512, (c, W) => {
    const R = rng(7), P = ['#c47a62', '#bd715a', '#ca836b', '#b86e58', '#c27e66', '#cf8b72', '#b3684f'];
    c.fillStyle = '#e4d2c1'; c.fillRect(0, 0, W, W);
    for (let r = 0; r < 8; r++) for (let k = -1; k < 5; k++) {
      const x = k * 128 + (r % 2) * 64, y = r * 64, kk = ((k % 4) + 4) % 4;
      c.fillStyle = P[(r * 5 + kk * 3 + (r * kk) % 3) % P.length]; c.fillRect(x + 4, y + 5, 120, 54);
      c.globalAlpha = .28; c.fillStyle = '#ffe7d6'; c.fillRect(x + 4, y + 5, 120, 6);
      c.globalAlpha = .22; c.fillStyle = '#6e3a2c'; c.fillRect(x + 4, y + 52, 120, 7); c.globalAlpha = 1;
    }
    for (let k = 0; k < 900; k++) { c.globalAlpha = .12 + R() * .14; c.fillStyle = R() < .5 ? '#7a3f30' : '#f3d9c6'; c.fillRect(R() * W, R() * W, 2 + R() * 3, 2 + R() * 2); }
    c.globalAlpha = 1;
  })));
}
// 유리블록 (.5 m 한 장에 4×4): 하늘빛 네모마다 안쪽 빛, 회색 줄눈
function gblockTex() {
  return TEX.get('vr3gblock', () => rep(canvasTex(256, 256, (c, W) => {
    c.fillStyle = '#b9b7b2'; c.fillRect(0, 0, W, W);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = i * 64 + 4, y = j * 64 + 4;
      c.fillStyle = '#cfe4ec'; c.fillRect(x, y, 56, 56); c.fillStyle = '#e8f4f7'; c.fillRect(x + 8, y + 8, 40, 40);
      c.fillStyle = '#b7d3df'; c.fillRect(x + 16, y + 16, 24, 24); c.globalAlpha = .7; c.fillStyle = '#ffffff'; c.fillRect(x + 10, y + 10, 10, 4); c.globalAlpha = 1;
    }
  })));
}
// 창 유리: 하늘 반사(대각 빛줄 둘) + 안쪽 — 0 분홍 커튼, 1 레이스, 2 노란 블라인드, 3 빈 방(어두운 안), 4 간유리(욕실)
const GLASS_V = 5;
function glassTex(v) {
  return TEX.get('vr3glass' + v, () => canvasTex(128, 128, (c, W, H) => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#a9cbd9'); g.addColorStop(1, '#d6eaf0'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (v === 3) { c.fillStyle = '#6f7f8c'; c.fillRect(0, 40, W, H - 40); c.fillStyle = '#8d9aa4'; c.fillRect(70, 56, 40, 30); }
    if (v === 0 || v === 1) { const col = v ? '#f6f3ec' : '#f2b6bf', col2 = v ? '#ddd8cc' : '#dc95a1';
      for (const [x0, w] of [[0, 46], [W - 38, 38]]) { c.fillStyle = col; c.fillRect(x0, 0, w, H); c.fillStyle = col2; for (let x = x0 + 6; x < x0 + w; x += 10) c.fillRect(x, 0, 3, H); }
      if (v === 1) { c.globalAlpha = .5; c.fillStyle = '#ffffff'; for (let y = 6; y < H; y += 14) for (let x = 4; x < W; x += 14) c.fillRect(x, y, 4, 4); c.globalAlpha = 1; } }
    if (v === 2) { c.fillStyle = '#f3dc95'; c.fillRect(0, 0, W, 86); c.fillStyle = '#d9bd6c'; for (let y = 4; y < 86; y += 7) c.fillRect(0, y, W, 2); c.fillStyle = '#ffffff'; c.fillRect(60, 86, 3, 18); }
    if (v === 4) { c.fillStyle = '#dfe9ec'; c.fillRect(0, 0, W, H); c.fillStyle = '#cbd9de'; for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 * 4; x < W; x += 8) c.fillRect(x, y, 4, 4); }
    c.globalAlpha = .55; c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(20, H); c.lineTo(52, H); c.lineTo(112, 0); c.lineTo(80, 0); c.fill();
    c.beginPath(); c.moveTo(62, H); c.lineTo(70, H); c.lineTo(128, 12); c.lineTo(128, 0); c.lineTo(124, 0); c.fill(); c.globalAlpha = 1;
  }));
}
// 옥상 초록 우레탄 방수 (난간 안 한 장, 6.64 × 5.64 m): 롤러 결, 덧칠한 자리, 메운 실금, 가장자리 먼지, 배수구 둘레 물때
function roofTex() {
  return TEX.get('vr3roof', () => canvasTex(1024, 870, (c, W, H) => {
    const R = rng(11);
    c.fillStyle = GREEN; c.fillRect(0, 0, W, H);
    for (let k = 0; k < 140; k++) { const y = R() * H, h = 4 + R() * 14; c.globalAlpha = .05 + R() * .06; c.fillStyle = R() < .5 ? '#a9d6b4' : '#76a985'; c.fillRect(0, y, W, h); }
    for (let k = 0; k < 5; k++) { c.globalAlpha = .28; c.fillStyle = k % 2 ? '#86bb95' : '#9acda7'; const x = R() * (W - 260), y = R() * (H - 200), w = 120 + R() * 160, h = 90 + R() * 120;
      c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, R() * PI, 0, PI * 2); c.fill(); }
    c.globalAlpha = .55; c.strokeStyle = '#6a9c79'; c.lineWidth = 3; c.lineCap = 'round';
    for (let k = 0; k < 4; k++) { let x = R() * W, y = R() * H; c.beginPath(); c.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (R() - .5) * 70; y += (R() - .3) * 50; c.lineTo(x, y); } c.stroke(); }
    c.globalAlpha = .35; c.strokeStyle = '#6f9f7d'; c.lineWidth = 5; c.beginPath(); c.moveTo(W * .5, 0); c.lineTo(W * .5, H); c.stroke();
    for (let k = 0; k < 700; k++) { const e = R(), x = e < .5 ? (R() < .5 ? R() * 40 : W - R() * 40) : R() * W, y = e < .5 ? R() * H : (R() < .5 ? R() * 40 : H - R() * 40);
      c.globalAlpha = .1 + R() * .12; c.fillStyle = R() < .6 ? '#8a7f6a' : '#5e7f66'; c.fillRect(x, y, 2 + R() * 4, 2 + R() * 3); }
    for (const [x, y] of [[W * .97, H * .96], [W * .03, H * .04]]) { c.globalAlpha = .25; c.fillStyle = '#6d8f78'; c.beginPath(); c.arc(x, y, 70, 0, PI * 2); c.fill(); }
    c.globalAlpha = 1;
  }));
}
// 보도블럭 (1 m): 연회색·연분홍 직사각 블록 반장 엇갈림
function paveTex() {
  return TEX.get('vr3pave', () => rep(canvasTex(256, 256, (c, W) => {
    const R = rng(3), P = ['#dcd6cd', '#e3cfc6', '#d4cec6', '#e6dbd0'];
    c.fillStyle = '#b8b0a6'; c.fillRect(0, 0, W, W);
    for (let r = 0; r < 4; r++) for (let k = -1; k < 3; k++) { c.fillStyle = P[(r * 3 + ((k + 2) % 2) * 2 + r % 2) % 4]; c.fillRect(k * 128 + (r % 2) * 64 + 3, r * 64 + 3, 122, 58); }
    for (let k = 0; k < 300; k++) { c.globalAlpha = .12; c.fillStyle = R() < .5 ? '#8f877d' : '#ffffff'; c.fillRect(R() * W, R() * W, 2, 2); }
    c.globalAlpha = 1;
  })));
}
// 아스팔트 (2 m): 회보라 바탕에 잔 돌, 메운 자국
function asphaltTex() {
  return TEX.get('vr3asph', () => rep(canvasTex(256, 256, (c, W) => {
    const R = rng(5); c.fillStyle = '#9a97a0'; c.fillRect(0, 0, W, W);
    for (let k = 0; k < 2200; k++) { c.globalAlpha = .18; c.fillStyle = R() < .5 ? '#7d7a84' : '#b9b6bd'; c.fillRect(R() * W, R() * W, 1 + R() * 2, 1 + R() * 2); }
    c.globalAlpha = .18; c.fillStyle = '#82808a'; c.fillRect(30, 140, 90, 50); c.globalAlpha = 1;
  })));
}
// 콘크리트 바닥 (2 m): 골목·필로티
function concTex() {
  return TEX.get('vr3conc', () => rep(canvasTex(256, 256, (c, W) => {
    const R = rng(9); c.fillStyle = '#d6d0c6'; c.fillRect(0, 0, W, W);
    for (let k = 0; k < 40; k++) { c.globalAlpha = .06; c.fillStyle = '#ffffff'; c.fillRect(0, R() * W, W, 2); }
    for (let k = 0; k < 900; k++) { c.globalAlpha = .14; c.fillStyle = R() < .5 ? '#a9a296' : '#ece7de'; c.fillRect(R() * W, R() * W, 2, 2); }
    c.globalAlpha = .4; c.fillStyle = '#b9b2a6'; c.fillRect(0, 0, W, 2); c.fillRect(0, 0, 2, W); c.globalAlpha = 1;
  })));
}
// 간판: 햇살빌라 (크림 판에 밤색 글씨)
// (영어 모드: 큰 글씨 SUNNY VILLA, 작은 한글 — 사용자 규칙 '간판 글자는 영어 모드에서 맞는 글자')
function signTex() {
  const en = LANG === 'en';
  return TEX.get('vr3sign2' + (en ? 'en' : 'ko'), () => canvasTex(512, 144, (c, W, H) => {
    c.fillStyle = '#f6efe2'; c.fillRect(0, 0, W, H); c.strokeStyle = '#8a5a3c'; c.lineWidth = 8; c.strokeRect(6, 6, W - 12, H - 12);
    c.fillStyle = '#ffd25c'; c.beginPath(); c.arc(64, 70, 26, 0, PI * 2); c.fill(); c.strokeStyle = '#ffd25c'; c.lineWidth = 6; c.lineCap = 'round';
    for (let k = 0; k < 8; k++) { const a = k * PI / 4; c.beginPath(); c.moveTo(64 + Math.cos(a) * 34, 70 + Math.sin(a) * 34); c.lineTo(64 + Math.cos(a) * 44, 70 + Math.sin(a) * 44); c.stroke(); }
    c.fillStyle = '#7a4a30'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const fit = (t, size, y, col) => { c.fillStyle = col; let f = size; do { c.font = `bold ${f}px sans-serif`; f -= 2; } while (c.measureText(t).width > W - 150 && f > 12); c.fillText(t, W / 2 + 36, y); };
    if (en) { fit('SUNNY VILLA', 60, 62, '#7a4a30'); fit('햇살빌라', 26, 114, '#b07a52'); } else { fit('햇살빌라', 74, 64, '#7a4a30'); fit('SUNNY VILLA', 26, 116, '#b07a52'); }
  }));
}
// 옥상문 안내판
function noteTex() {
  const en = LANG === 'en';
  return TEX.get('vr3note' + (en ? 'en' : 'ko'), () => canvasTex(256, 128, (c, W, H) => {
    c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, W, H); c.fillStyle = '#d8473b'; c.fillRect(0, 0, W, 30);
    c.fillStyle = '#ffffff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(en ? 'ROOF DOOR' : '옥상 출입문', W / 2, 16);
    c.fillStyle = '#3a3048'; c.font = 'bold 22px sans-serif'; c.fillText(en ? 'Please keep' : '문을 꼭', W / 2, 62); c.fillText(en ? 'the door shut' : '닫아 주세요', W / 2, 96);
  }));
}

// ── 메시 모으기 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// 결 있는 면: 조각들을 세계 평면 UV(s m 한 장)로 한 덩어리 — fn({ add(geo, x, y, z, rx, ry, rz, s) })
function wuv(g, su, sv = su, ou = 0, ov = 0) {
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v; if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = (u - ou) / su; uv[i * 2 + 1] = (v - ov) / sv;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}
function clean(src, M, keepUV) {
  const c = src.index ? src.toNonIndexed() : src.clone();
  for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && !(keepUV && k === 'uv')) c.deleteAttribute(k);
  c.applyMatrix4(M); return c;
}
function tm(key, map, fn, color = '#ffffff', o = {}) {
  const g = geo('vr3tm|' + key, () => {
    const list = [];
    fn({ add: (src, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, uvf = null) => { const c = clean(src, xf(x, y, z, rx, ry, rz, s), !!o.ownUV); list.push(uvf ? uvf(c) : c); } });
    const out = mergeGeometries(list, false);
    if (!o.ownUV && !o.custom) wuv(out, o.s || 1, o.sv || o.s || 1, o.ou || 0, o.ov || 0);
    return out;
  });
  return mesh(g, mat(color, { map, rim: .15 }));
}
// 건물 네 면: S(+z 앞) E(+x 옆) N(-z 뒤) W(-x 옆). a = 면을 바라볼 때 왼→오, b = 바깥으로
const FACE = {
  S: { ry: 0, at: (a, y, b) => [a, y, BZ + b] },
  E: { ry: HP, at: (a, y, b) => [BX + b, y, -a] },
  N: { ry: PI, at: (a, y, b) => [-a, y, -BZ - b] },
  W: { ry: -HP, at: (a, y, b) => [-BX - b, y, a] },
};
const onFace = (add, face) => (g, color, a, y, b, rz = 0, s = 1) => { const F = FACE[face], [x, yy, z] = F.at(a, y, b); add(g, color, x, yy, z, 0, F.ry, rz, s); };
const cylOut = (r, h, seg = 12) => G.cyl(r, r, h, seg).rotateX(HP);

// ── 창 하나 (면 위 a, 가운데 높이 y, 너비 w, 높이 h) ─────────────────────────────────────────────────────────────────────
// o: glass 0~4, bars(방범창), rail(난간), box(화분대), ac('below'|'side'), sill(기본 있음)
function windowOn(A, glass, face, a, y, w, h, o = {}) {
  const fr = .045, D = .07;
  A(G.pbox(w + .1, h + .1, .03), ALU2, a, y, .015);
  A(G.pbox(w + .1, fr, D), WHITE, a, y + h / 2 + .03, D / 2); A(G.pbox(w + .1, fr, D), WHITE, a, y - h / 2 - .03, D / 2);
  for (const s of [-1, 1]) A(G.pbox(fr, h + .1, D), WHITE, a + s * (w / 2 + .03), y, D / 2);
  if (w > .7) A(G.pbox(.035, h, .05), ALU, a + (o.mull || 0), y, .04);
  if (o.sill !== false) A(G.box(w + .22, .06, .16, .01), CREAM, a, y - h / 2 - .08, .07);
  const F = FACE[face], [gx, gy, gz] = F.at(a, y, .032);
  glass[o.glass ?? 0].push([w, h, gx, gy, gz, F.ry]);
  if (o.bars) {
    const n = Math.max(3, Math.round(w / .14));
    for (let k = 0; k <= n; k++) A(G.cyl(.011, .011, h + .08, 5), o.bars === 'dark' ? '#55606e' : WHITE, a - w / 2 + k * w / n, y, .13);
    for (const yy of [y - h / 2 - .02, y + h / 2 + .02, y]) A(G.pbox(w + .06, .022, .022), o.bars === 'dark' ? '#55606e' : WHITE, a, yy, .13);
    for (const s of [-1, 1]) A(G.pbox(.03, .03, .13), o.bars === 'dark' ? '#55606e' : WHITE, a + s * (w / 2 + .02), y + h / 2, .065);
  }
  if (o.rail) {
    const ry = y - h / 2 + .18;
    A(G.pbox(w + .1, .035, .035), DARK, a, ry + .2, .2); A(G.pbox(w + .1, .025, .025), DARK, a, ry - .1, .2);
    for (let k = 0; k <= Math.round(w / .1); k++) A(G.pbox(.014, .3, .014), DARK, a - w / 2 - .02 + k * (w + .04) / Math.round(w / .1), ry + .05, .2);
    for (const s of [-1, 1]) A(G.pbox(.03, .03, .2), DARK, a + s * (w / 2 + .05), ry + .2, .1);
  }
  if (o.box) {
    const by = y - h / 2 - .12;
    A(G.pbox(w + .1, .02, .3), '#55606e', a, by - .02, .18); A(G.pbox(w + .1, .1, .015), '#55606e', a, by + .03, .33);
    for (let k = 0; k < Math.max(2, Math.round(w / .32)); k++) {
      const px = a - w / 2 + .14 + k * (w - .2) / Math.max(1, Math.round(w / .32) - 1), pc = k % 3 === 1 ? '#e9e2d4' : POT;
      A(G.cyl(.075, .055, .13, 10), pc, px, by + .06, .18);
      for (let m = 0; m < 4; m++) A(G.sph(.06, 7, 5), m % 2 ? LEAF : LEAF2, px + Math.cos(m * 1.7) * .04, by + .17 + (m % 2) * .04, .18 + Math.sin(m * 1.7) * .04);
      if (k % 2 === 0) A(G.sph(.03, 6, 5), k % 4 ? '#ff8fa8' : '#ffd25c', px + .03, by + .23, .22);
    }
  }
  if (o.ac) acUnit(A, o.ac === 'below' ? a + (o.acDx || 0) : a + w / 2 + .5, o.ac === 'below' ? y - h / 2 - .48 : y - .25);
}
// 실외기: 흰 상자, 둥근 팬 창살, 받침 쇠, 배관 덮개가 벽으로
function acUnit(A, a, y) {
  A(G.box(.62, .42, .24, .02), '#f1f2ee', a, y, .17); A(G.cyl(.15, .15, .012, 18).rotateX(HP), '#c9ccd2', a - .1, y, .295);
  for (let k = 0; k < 4; k++) A(G.tor(.03 + k * .03, .006, PI * 2, 3, 16), '#9aa0aa', a - .1, y, .3);
  for (let k = 0; k < 5; k++) A(G.pbox(.1, .012, .01), '#b9bcc2', a + .2, y + .14 - k * .06, .295);
  for (const s of [-1, 1]) { A(G.pbox(.03, .03, .32), STEEL, a + s * .25, y - .23, .16); A(G.pbox(.03, .3, .03), STEEL, a + s * .25, y - .36, .015); }
  A(G.box(.07, .4, .06, .015), '#ece9e2', a + .38, y + .02, .05); A(G.box(.18, .07, .06, .015), '#ece9e2', a + .31, y - .17, .08);
}

// 3층 계단실 단면 안: 인조석 바닥, 크림 벽, 301호 현관(밤색 철문·번호키·문패·우산), 북쪽 벽 따라 오르는 계단 일곱 단(검은 논슬립)과
// 스테인리스 손잡이, 층계참 화분, 벽등, 소화기; 잘린 자리는 크림 테두리로 마감
function stairCut(add, tube) {
  const y0 = -FH, zc = -(NZ0 + NZ1) / 2, cw = BX - NX, cd = NZ0 - NZ1;
  add(G.pbox(BX - NX, .13, NZ0 - NZ1), '#e6dccb', (NX + BX) / 2, -.075, zc);
  add(G.pbox(cw - .01, .012, cd), '#d6cfc3', (NX + BX) / 2, y0 + .006, zc);
  for (let k = 0; k < 6; k++) add(G.pbox(.012, .013, cd), '#c4bcb0', NX + .3 * k + .15, y0 + .007, zc);
  add(G.pbox(.012, FH - .15, cd), '#f3ece0', NX + .006, y0 + (FH - .15) / 2, zc);
  add(G.pbox(cw, FH - .15, .012), '#efe7da', (NX + BX) / 2, y0 + (FH - .15) / 2, -NZ0 + .006);
  add(G.pbox(cw, FH - .15, .012), '#efe7da', (NX + BX) / 2, y0 + (FH - .15) / 2, -NZ1 - .006);
  add(G.pbox(.014, .12, cd), '#b9ad9c', NX + .01, y0 + .06, zc);
  // 301호 현관
  const dz = -1.82, DW = .6, DH = 1.22;
  add(G.pbox(.05, DH + .06, DW + .08), '#d9d2c4', NX + .03, y0 + (DH + .06) / 2, dz);
  add(G.box(.045, DH, DW, .01), '#7a5444', NX + .05, y0 + DH / 2, dz); add(G.box(.012, DH * .8, DW - .14, .005), '#8a6250', NX + .075, y0 + DH * .5, dz);
  add(G.box(.03, .16, .07, .008), '#2c2f36', NX + .08, y0 + .62, dz + .2); add(G.pbox(.006, .04, .04), '#8fd3f4', NX + .096, y0 + .66, dz + .2);
  add(G.box(.04, .025, .1, .008), '#c9cfd8', NX + .09, y0 + .55, dz + .19);
  add(G.pbox(.01, .07, .16), '#f7f6f2', NX + .08, y0 + DH - .12, dz); add(G.pbox(.012, .03, .1), '#4a4f58', NX + .086, y0 + DH - .12, dz);
  add(G.sph(.07, 10, 8), '#fff4c8', NX + .03, y0 + DH + .3, dz, 0, 0, 0, [.5, 1, 1]);
  tube([NX + .2, y0 + .02, -1.56], [NX + .12, y0 + .78, -1.54], .012, '#3f6fb5', 5); add(G.cone(.07, .3, 8), '#3f6fb5', NX + .19, y0 + .18, -1.56);
  for (const [z, a] of [[dz + .12, .1], [dz + .26, -.15]]) add(G.box(.2, .05, .09, .025), '#f2f1ec', NX + .3, y0 + .03, z, 0, a, 0);
  // 계단 (① 10/24 사용자 "계단 내려오고 난간이랑 공간이 있어야 돌아가지 저기서 점프하라는 얘기야?"): 북쪽 벽 따라 뒤로 오르는 여섯 단이
  // 잘린 면에서 .64 m 물러나 시작 — 내려온 끝 앞에 3층 복도 바닥이 넓게 남아 301호 쪽으로 돌아 나감. 계단 열린 쪽은 난간 기둥·살·손잡이가
  // 끝 기둥(뉴얼)에서 꺾여 내려오고, 맨 아랫단은 앞으로 조금 넓은 첫 단; 위는 뒤 벽 앞 층계참(반 층)
  const SW = .66, sz = -NZ0 + SW / 2, n = 6, R = FH / 2 / (n + 1), TR = .13, X0S = BX - .64;
  for (let k = 0; k < n; k++) {
    const x = X0S - TR / 2 - k * TR, h = R * (k + 1), w = k ? TR : TR + .04;
    add(G.pbox(w, h, SW), '#ddd6ca', x + (k ? 0 : .02), y0 + h / 2, sz); add(G.pbox(.035, .014, SW - .06), '#4f4c55', x + TR / 2 - .022 + (k ? 0 : .04), y0 + h + .007, sz);
    add(G.pbox(.006, h - .02, SW - .02), '#cfc6b8', x + TR / 2 + .001 + (k ? 0 : .04), y0 + h / 2, sz);
  }
  const ly = y0 + R * (n + 1), lx0 = NX, lx1 = X0S - n * TR;
  add(G.pbox(lx1 - lx0, R * (n + 1), SW), '#ddd6ca', (lx0 + lx1) / 2, y0 + R * (n + 1) / 2, sz);
  add(G.pbox(.035, .014, SW - .06), '#4f4c55', lx1 - .022, ly + .007, sz);
  add(G.pbox(lx1 - lx0 - .04, .006, SW - .06), '#e6dfd3', (lx0 + lx1) / 2, ly + .003, sz);
  // 난간 (계단 열린 쪽): 끝 기둥 둘(아래·층계참), 살, 위 손잡이 — 아래 끝은 뉴얼 기둥에서 둥글게 마감
  const hz = sz + SW / 2 - .035, RH = .52, rail = (x, y) => [x, y + RH, hz];
  const bx = X0S - .03, by = y0 + R, tx = lx1 + .03, tyy = ly;
  add(G.box(.06, RH + R + .06, .06, .012), '#b9bfc8', bx, y0 + (RH + R + .06) / 2, hz); add(G.sph(.04, 10, 8), '#d9dde3', bx, y0 + RH + R + .08, hz);
  add(G.box(.06, RH + .06, .06, .012), '#b9bfc8', tx, tyy + (RH + .06) / 2, hz);
  tube(rail(bx, by), rail(tx, tyy), .02, '#d9dde3', 8); tube(rail(tx, tyy), [lx0 + .05, tyy + RH, hz], .02, '#d9dde3', 8);
  const railY = x => by + RH + (x - bx) * (tyy - by) / (tx - bx);
  for (let k = 1; k < n; k++) { const x = X0S - TR / 2 - k * TR, h = R * (k + 1); tube([x, y0 + h, hz], [x, railY(x), hz], .009, '#c9ced6', 5); }
  for (let k = 1; k <= 2; k++) { const x = tx - k * (tx - lx0 - .05) / 3; tube([x, tyy, hz], [x, tyy + RH, hz], .009, '#c9ced6', 5); }
  // 벽 손잡이 (북쪽 벽, 계단 따라) — 벽 받침 셋
  const wz = -NZ0 + .045; tube([X0S, y0 + R + .78, wz], [lx1, ly + .78, wz], .014, '#c9a46a', 6);
  for (let k = 0; k < 3; k++) { const t = k / 2, x = X0S + (lx1 - X0S) * t, y = y0 + R + .78 + (ly - y0 - R) * t; add(G.pbox(.02, .02, .04), '#9aa0aa', x, y - .02, wz - .02); }
  // 첫 단 앞 복도: 발매트, 벽 스위치
  add(G.box(.42, .012, .3, .006), '#7aa6c9', BX - .3, y0 + .006, -1.9); add(G.pbox(.36, .013, .015), '#e9eef3', BX - .3, y0 + .007, -1.78);
  // 층계참 화분, 소화기
  add(G.cyl(.09, .07, .16, 10), POT, NX + .15, ly + .08, sz - .12); for (let m = 0; m < 6; m++) add(G.sph(.07, 7, 5), m % 2 ? LEAF : LEAF2, NX + .15 + Math.cos(m * 1.1) * .06, ly + .24 + (m % 3) * .04, sz - .12 + Math.sin(m * 1.1) * .06);
  add(G.cyl(.06, .06, .3, 10), '#d8473b', BX - .25, y0 + .15, -NZ1 - .14); add(G.sph(.04, 8, 6), '#2c2f36', BX - .25, y0 + .33, -NZ1 - .14);
  // 잘린 자리 마감: 크림 테두리
  add(G.pbox(.05, FH - .14, .05), CREAM, BX + .01, y0 + (FH - .14) / 2, -NZ0 + .025); add(G.pbox(.05, FH - .14, .05), CREAM, BX + .01, y0 + (FH - .14) / 2, -NZ1 - .025);
}

// ── 빌라 몸통 + 옥상 난간 + 방수 바닥 ─────────────────────────────────────────────────────────────────────────────────────
B.vr3_villa = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [100, 100, 100, 100.01, 100.01, 100.01];
  // 난간만 걸음을 막음 (계단실이 서는 뒤 오른쪽 모서리는 계단실 몸이 막음)
  f.walkBoxes = [[-BX, 0, PZ, BX, .8, BZ], [-BX, 0, -BZ, 1.75, .8, -PZ], [-BX, 0, -BZ, -PX, .8, BZ], [PX, 0, -1.45, BX, .8, BZ]];
  const glass = Array.from({ length: GLASS_V }, () => []);
  // 벽돌 면: 위 두 층 몸통, 1층 닫힌 뒤쪽 반, 난간 바깥(계단실 자리 빼고)
  f.add(tm('villa-brick', brickTex(), ({ add }) => {
    add(G.pbox(BX * 2, FH, BZ * 2), 0, -1.5 * FH, 0);
    add(G.pbox(NX + BX, FH - .01, BZ * 2), (NX - BX) / 2, -FH / 2 - .005, 0);
    add(G.pbox(BX - NX, FH - .01, BZ + NZ1), (NX + BX) / 2, -FH / 2 - .005, (BZ - NZ1) / 2);
    add(G.pbox(BX - NX, FH - .01, BZ - NZ0), (NX + BX) / 2, -FH / 2 - .005, -(BZ + NZ0) / 2);
    add(G.pbox(BX * 2, DROP - 2 * FH, BZ), 0, -2 * FH - (DROP - 2 * FH) / 2, -BZ / 2);
    add(G.pbox(BX * 2, PH, IN), 0, PH / 2, BZ - IN / 2);
    add(G.pbox(1.75 + BX, PH, IN), (-BX + 1.75) / 2, PH / 2, -BZ + IN / 2);
    add(G.pbox(IN, PH, BZ * 2 - 2 * IN), -BX + IN / 2, PH / 2, 0);
    add(G.pbox(IN, PH, BZ - IN + 1.45), BX - IN / 2, PH / 2, (BZ - IN - 1.45) / 2);
  }));
  // 계단실 유리블록 기둥 (E 면, 계단실 바로 아래) — 2·3층 층계참 창
  f.add(tm('villa-gblock', gblockTex(), ({ add }) => {
    add(G.pbox(.04, 1.25, .66), BX + .02, -FH * 1.5 - .1, -2.15);
  }, '#ffffff', { s: .5 }));
  f.add(mc('vr3-villa', ({ add, tube }) => {
    // 난간 안쪽 크림 칠 + 초록 방수 턱, 갓돌
    add(G.pbox(BX * 2 - 2 * IN, PH, .012), INNER, 0, PH / 2, PZ - .006);
    add(G.pbox(1.75 + PX, PH, .012), INNER, (-PX + 1.75) / 2, PH / 2, -PZ + .006);
    add(G.pbox(.012, PH, PZ * 2), INNER, -PX + .006, PH / 2, 0);
    add(G.pbox(.012, PH, PZ + 1.45), INNER, PX - .006, PH / 2, (PZ - 1.45) / 2);
    add(G.pbox(BX * 2 - 2 * IN, .15, .016), GREEN2, 0, .075, PZ - .012);
    add(G.pbox(1.75 + PX, .15, .016), GREEN2, (-PX + 1.75) / 2, .075, -PZ + .012);
    add(G.pbox(.016, .15, PZ * 2), GREEN2, -PX + .012, .075, 0);
    add(G.pbox(.016, .15, PZ + 1.45), GREEN2, PX - .012, .075, (PZ - 1.45) / 2);
    add(G.box(BX * 2 + .08, .07, IN + .1, .015), CREAM, 0, PH + .035, BZ - IN / 2);
    add(G.box(1.75 + BX + .04, .07, IN + .1, .015), CREAM, (-BX + 1.75) / 2 - .02, PH + .035, -BZ + IN / 2);
    add(G.box(IN + .1, .07, BZ * 2 + .04, .015), CREAM, -BX + IN / 2, PH + .035, 0);
    add(G.box(IN + .1, .07, BZ + 1.45 + .04, .015), CREAM, BX - IN / 2, PH + .035, (BZ - 1.45) / 2);
    // 처마 띠(옥상 슬래브)와 층 띠
    for (const y of [-.08, -FH, -2 * FH]) {
      add(G.pbox(BX * 2 + .06, .14, .03), BAND, 0, y, BZ + .015); add(G.pbox(BX * 2 + .06, .14, .03), BAND, 0, y, -BZ - .015);
      add(G.pbox(.03, .14, BZ * 2 + .06), BAND, BX + .015, y, 0); add(G.pbox(.03, .14, BZ * 2 + .06), BAND, -BX - .015, y, 0);
    }
    // 1층 필로티: 기둥, 닫힌 뒷벽(크림 칠), 주차 바닥 선, 현관
    const Y0 = -DROP;
    for (const [x, z] of [[-BX + .18, BZ - .18], [-.2, BZ - .18], [BX - .18, BZ - .18], [-BX + .18, .02], [BX - .18, .02]]) {
      add(G.box(.36, DROP - 2 * FH, .36, .02), CREAM2, x, Y0 + (DROP - 2 * FH) / 2, z); add(G.pbox(.4, .08, .4), BAND, x, Y0 + .04, z);
    }
    add(G.pbox(BX * 2 - .02, DROP - 2 * FH - .01, .02), '#efe6d8', 0, Y0 + (DROP - 2 * FH) / 2, .01);
    add(G.pbox(BX * 2 - .02, .22, .025), '#c9bfae', 0, Y0 + .11, .025);
    for (const x of [-2.9, -.95]) add(G.pbox(.05, .005, 2.5), '#f7f6f2', x, Y0 + .006, 1.6);
    add(G.pbox(1.6, .005, .05), '#f7f6f2', -1.92, Y0 + .006, 2.82);
    // 현관: 알루미늄 유리문, 차양, 등, 우편함, 동 표지
    const DX = 2.35;
    add(G.pbox(.9, 1.2, .05), '#5c6370', DX, Y0 + .6, .045); add(G.pbox(.04, 1.12, .03), '#5c6370', DX, Y0 + .58, .08);
    for (const s of [-1, 1]) add(G.pbox(.04, .3, .04), '#d9dde3', DX + s * .08, Y0 + .6, .1);
    add(G.box(1.2, .05, .5, .01), '#cfe4ee', DX, Y0 + 1.27, .27, -.12, 0, 0);
    for (const s of [-1, 1]) tube([DX + s * .55, Y0 + 1.3, .02], [DX + s * .55, Y0 + 1.24, .5], .012, STEEL, 4);
    add(G.sph(.06, 10, 8), '#fff4c8', DX - .62, Y0 + 1.05, .06, 0, 0, 0, [1, 1, .6]);
    add(G.box(.62, .5, .1, .01), '#c9ccd1', 1.25, Y0 + .85, .06);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) { add(G.pbox(.17, .2, .012), '#b3b8c0', 1.06 + k * .19, Y0 + .73 + r * .23, .115); add(G.pbox(.06, .012, .012), '#4a4f58', 1.06 + k * .19, Y0 + .78 + r * .23, .124); }
    add(G.box(.26, .14, .02, .01), '#3f6fb5', DX + .62, Y0 + 1.0, .03);
    // 분리수거함 셋(파랑·초록·노랑)과 묶은 상자
    [['#4f86c6', -.3], ['#5aa86a', .12], ['#f0c24a', .54]].forEach(([c, x]) => {
      add(G.box(.38, .5, .36, .03), c, x, Y0 + .25, .3); add(G.box(.4, .05, .38, .02), c, x, Y0 + .52, .3);
      add(G.pbox(.2, .03, .01), '#ffffff', x, Y0 + .38, .485);
    });
    for (let k = 0; k < 4; k++) add(G.box(.6, .03, .44, .005), k % 2 ? '#d7b07a' : '#c99f68', .9, Y0 + .02 + k * .032, .55, 0, k * .05, 0);
    tube([.62, Y0 + .1, .55], [1.18, Y0 + .1, .55], .006, '#f4f0e0', 4);
    // 빈 주차 칸 (① 10/24 사용자 "자동차 안되면 지워줘 그냥" — 상자 차를 빼고): 뒤쪽 노란 바퀴 멈춤 턱 둘, 기둥 곁 주황 고깔, 벽에 '주차' 표지
    for (const x of [-2.35, -1.5]) { add(G.box(.5, .1, .14, .03), '#f2cf62', x, Y0 + .05, .45); for (const d of [-.12, .12]) add(G.pbox(.08, .102, .142), '#3d3a44', x + d, Y0 + .05, .45); }
    add(G.cyl(.03, .14, .36, 12), '#f08a3c', -BX + .5, Y0 + .2, BZ - .5); for (const y of [.15, .25]) add(G.cyl(.06 - y * .1, .1 - y * .2, .045, 12), '#ffffff', -BX + .5, Y0 + y, BZ - .5);
    add(G.box(.26, .03, .26, .01), '#3d3a44', -BX + .5, Y0 + .015, BZ - .5);
    add(G.box(.42, .3, .03, .01), '#3f6fb5', -1.92, Y0 + 1.15, .04); add(G.pbox(.16, .18, .01), '#ffffff', -1.92, Y0 + 1.15, .058);
    // 스쿠터(민트)
    const SX = .55, SZ = 2.1;
    add(G.box(.16, .06, .62, .03), '#9ad3c0', SX, Y0 + .2, SZ); add(G.box(.18, .22, .3, .06), '#9ad3c0', SX, Y0 + .35, SZ - .2);
    add(G.box(.17, .07, .28, .03), '#4a4458', SX, Y0 + .5, SZ - .2); add(G.box(.12, .42, .1, .04), '#9ad3c0', SX, Y0 + .4, SZ + .28, -.2, 0, 0);
    add(G.cyl(.012, .012, .36, 5), '#4a4458', SX, Y0 + .64, SZ + .32, 0, 0, HP); add(G.sph(.04, 8, 6), '#fff6d8', SX, Y0 + .55, SZ + .35);
    for (const z of [-.24, .3]) add(G.cyl(.09, .09, .06, 12), '#33303a', SX, Y0 + .09, SZ + z, 0, 0, HP);
    // 우수관: 앞 왼쪽 모서리·뒤 오른쪽, 위 물받이와 벽 고정쇠
    for (const [x, z] of [[-BX - .06, BZ - .25], [BX - .25, -BZ - .06], [-BX + .25, -BZ - .06]]) {
      tube([x, .25, z], [x, Y0 + .12, z], .04, PIPE, 8); add(G.box(.14, .12, .14, .02), PIPE, x, .22, z);
      for (let y = -.6; y > Y0; y -= 1.2) add(G.pbox(.11, .03, .11), STEEL, x, y, z);
      add(G.cyl(.04, .055, .1, 8), PIPE, x, Y0 + .08, z);
    }
    // 도시가스 (① 10/24 사용자 "바닥으로 가스관이 흐르네? 지저분하지 않게 정리"): 땅에서 올라오는 세로관 하나가 E 면 막힌 벽(필로티 뒤 벽돌·
    // 2층 유리블록 앞·3층 간판과 계단실 단면 사이)을 곧게 타고 오르고, 층마다 짧은 가지 → 밸브 → 계량기 상자로 벽에 들어감. 바닥을 기는 관 없음
    const gz = -1.22, gx = BX + .075;
    add(G.box(.2, .08, .2, .02), '#d6d0c6', gx, Y0 + .14, gz); add(G.cyl(.05, .05, .1, 10), GAS, gx, Y0 + .2, gz);
    tube([gx, Y0 + .18, gz], [gx, -FH + .62, gz], .028, GAS, 8); add(G.cyl(.034, .034, .05, 10), GAS, gx, -FH + .64, gz);
    add(G.cyl(.04, .04, .09, 10), '#e0b12e', gx, Y0 + .62, gz); add(G.box(.1, .022, .03, .008), '#e2403a', gx + .02, Y0 + .69, gz + .03, 0, 0, .3);
    for (const fy of [-2 * FH, -FH]) {
      const by = fy + .56, mz = gz + .34;
      tube([gx, by, gz], [gx, by, mz - .12], .02, GAS, 6); add(G.sph(.026, 8, 6), GAS, gx, by, gz);
      add(G.cyl(.032, .032, .06, 8), '#e0b12e', gx, by, gz + .1, HP, 0, 0); add(G.box(.07, .018, .025, .006), '#e2403a', gx + .015, by + .035, gz + .1);
      add(G.box(.13, .24, .22, .025), '#e4e6ea', BX + .07, by - .02, mz); add(G.pbox(.012, .08, .13), '#3d4652', BX + .136, by + .02, mz);
      add(G.pbox(.012, .025, .08), '#f2f3f5', BX + .137, by + .03, mz); add(G.pbox(.01, .03, .05), '#f0c13a', BX + .136, by - .1, mz);
      tube([gx, by - .1, mz + .02], [BX + .01, by - .1, mz + .02], .016, GAS, 6);
    }
    for (let y = Y0 + .9; y < -FH + .5; y += .85) { add(G.pbox(.05, .035, .1), STEEL, BX + .03, y, gz); add(G.sph(.012, 5, 4), '#d6dae0', BX + .062, y, gz + .035); }
    // 바깥 덩굴: 앞 난간 두 곳, 옆 한 곳 (갓돌 바깥으로 늘어짐)
    for (const [x, z, face] of [[-2.2, BZ + .02, 'S'], [.9, BZ + .02, 'S'], [BX + .02, 1.9, 'E']]) {
      for (let t = 0; t < 2; t++) { const len = 6 + t * 3;
        for (let k = 0; k < len; k++) { const yy = PH - .04 - k * .1, dx = (k % 2 ? .05 : -.05) + t * .14;
          const px = face === 'S' ? x + dx : x + .02, pz = face === 'S' ? z + .02 : z + dx;
          add(G.sph(.065 - k * .002, 7, 5), (k + t) % 2 ? LEAF : LEAF2, px, yy, pz, 0, face === 'S' ? 0 : HP, (k % 2 ? -.5 : .5), [1.1, .85, .35]); } }
      for (let k = 0; k < 6; k++) add(G.sph(.08, 8, 6), k % 2 ? LEAF : LEAF2, (face === 'S' ? x + (k - 2) * .07 : x - .08), PH + .1 + (k % 2) * .03, face === 'S' ? z - .08 : z + (k - 2) * .07, 0, 0, 0, [1.2, .5, 1]);
    }
    // 갓돌 위 작은 화분 둘, 앞 난간 물받이 구멍 둘
    for (const [x, z] of [[-.55, BZ - IN / 2], [2.7, BZ - IN / 2]]) { add(G.cyl(.09, .07, .14, 12), POT, x, PH + .14, z); for (let m = 0; m < 5; m++) add(G.sph(.065, 7, 5), m % 2 ? LEAF : '#8fd46a', x + Math.cos(m * 1.3) * .05, PH + .26 + (m % 2) * .04, z + Math.sin(m * 1.3) * .05); }
    for (const x of [-3.1, 3.0]) { add(G.pbox(.14, .1, .05), '#5a5f68', x, .06, PZ - .02); add(G.box(.18, .06, .26, .01), STEEL, x, -.02, BZ + .1); }
    // 방수 바닥 배수구 둘(쇠 덮개)
    for (const [x, z] of [[PX - .3, PZ - .3], [-PX + .3, -PZ + .3]]) { add(G.cyl(.13, .13, .012, 16), '#6f7a72', x, .008, z); for (let k = -2; k <= 2; k++) add(G.pbox(.18, .006, .012), '#4d5751', x, .016, z + k * .045); }
    // ── 창들: 면마다 층마다 ──
    for (const face of ['S', 'E', 'N', 'W']) {
      const A = onFace(add, face);
      for (const fl of [0, 1]) {
        const y0 = -FH * (fl + 1), wy = y0 + 1.0;
        if (face === 'S') {
          windowOn(A, glass, face, -1.75, wy, 1.6, 1.0, { glass: fl ? 1 : 0, rail: true, mull: .2 });
          windowOn(A, glass, face, .95, wy, 1.0, .95, { glass: fl ? 3 : 2, bars: fl ? 'dark' : true, box: !fl, ac: fl ? 'below' : null, acDx: .1 });
          windowOn(A, glass, face, 2.75, wy + .35, .5, .42, { glass: 4, sill: false });
          if (!fl) acUnit(A, -.5, wy - .3);
        } else if (face === 'E') {
          windowOn(A, glass, face, -1.7, wy, 1.0, .95, { glass: fl ? 0 : 1, bars: true, box: fl === 1 });
          // (① 10/24 사용자 "간판이 뚫림": 3층은 이 자리에 햇살빌라 간판만 — 작은 창·계량기가 간판 뒤로 뚫고 나왔다; 계량기는 가스관 곁으로)
          if (fl) windowOn(A, glass, face, .4, wy - .05, .62, .5, { glass: 2, sill: true });
        } else if (face === 'N') {
          windowOn(A, glass, face, -2.0, wy, 1.0, .9, { glass: fl ? 3 : 1, bars: 'dark', ac: 'below' });
          windowOn(A, glass, face, .3, wy, 1.4, 1.0, { glass: fl ? 2 : 0, rail: true });
          windowOn(A, glass, face, 2.3, wy + .35, .5, .42, { glass: 4, sill: false });
        } else {
          windowOn(A, glass, face, -1.3, wy, 1.2, .95, { glass: fl ? 0 : 2, bars: true, box: !fl });
          windowOn(A, glass, face, 1.5, wy + .1, .7, .6, { glass: fl ? 3 : 1 });
          if (fl) acUnit(A, .3, wy - .45);
        }
      }
      // 1층 닫힌 쪽 창(뒤·옆): 작은 창 하나씩
      if (face === 'N') windowOn(A, glass, face, -1.2, -DROP + .85, .9, .55, { glass: 3, bars: 'dark' });
      if (face === 'E' || face === 'W') windowOn(A, glass, face, face === 'E' ? 1.8 : -1.8, -DROP + .85, .7, .5, { glass: 4, bars: 'dark' });
    }
    stairCut(add, tube);
    // 간판: 밤색 테 판(벽에서 띄운 받침 쇠 넷), 위 갓등 둘
    add(G.box(1.46, .46, .05, .015), '#8a5a3c', BX + .045, -.48, -.35, 0, HP, 0);
    for (const dz of [-.55, .55]) for (const dy of [-.15, .15]) add(G.pbox(.04, .03, .03), STEEL, BX + .015, -.48 + dy, -.35 + dz);
    for (const dz of [-.4, .4]) { tube([BX + .01, -.2, -.35 + dz], [BX + .2, -.2, -.35 + dz], .01, DARK, 5); add(G.cone(.06, .07, 10), DARK, BX + .2, -.24, -.35 + dz); add(G.sph(.025, 8, 6), '#fff4c8', BX + .2, -.275, -.35 + dz); }
  }));
  // 창 유리 (안쪽 커튼·블라인드가 비치는 그림, 종류마다 한 덩어리)
  glass.forEach((list, v) => {
    if (!list.length) return;
    f.add(tm('villa-glass' + v + '|' + list.length, glassTex(v), ({ add }) => { for (const [w, h, x, y, z, ry] of list) add(new THREE.PlaneGeometry(w, h), x, y, z, 0, ry, 0); }, '#ffffff', { ownUV: true }));
  });
  // 햇살빌라 간판 (E 면 3층 위)
  f.add(put(mesh(geo('vr3sign', () => new THREE.PlaneGeometry(1.38, .39)), mat('#ffffff', { map: signTex(), rim: 0 })), BX + .073, -.48, -.35, 0, HP, 0));
  // 방수 바닥 한 장
  f.add(put(mesh(geo('vr3roof', () => new THREE.PlaneGeometry(PX * 2, PZ * 2)), mat('#ffffff', { map: roofTex(), rim: 0 }), { cast: false }), 0, .003, 0, -HP, 0, 0));
  f.spot('behind', null, -PX + .35, 0, PZ - .25, { maxH: .35, label: '난간 구석', scale: .75 });
};

// ── 동네 둘레 (① 10/24 다시 — 아트 점검 "배경의 흰 상자 집이 목업처럼 보인다", 사용자 "도로도 정리해 주고 자동차 안되면 지워줘 그냥") ──
// 흰 상자 집·세워 둔 차를 빼고 옥상 텃밭 판다운 둘레: 땅의 동네 텃밭(나무 테 두른 밭·고랑·지지대·비닐하우스)과 쌈지 공원(정자·벤치·잔디),
// 길 건너 산책길 생울타리와 가로수, 멀리 나무 무리, 다음 판(21판) 파출소는 작게 그대로.
// 길은 T자 하나로 정리: 앞 큰길 + 옆길이 앞길에 닿고, 인도는 길을 건너지 않으며 모서리에서 만남; 가운데 노란 점선은 교차로에서 끊기고,
// 옆길 정지선 + 횡단보도 둘(옆길·앞길). 놀이 구역 밖 전부라 잉크 외곽선 없이 색만(userData.scenery), 멀수록 하늘빛으로 흐려짐
const SKYF = new THREE.Color('#e4f0f4'), _fc = new THREE.Color();
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const fade = (c, x, z) => '#' + _fc.set(c).lerp(SKYF, smooth(9, 30, Math.hypot(x, z)) * .62).getHexString();
const GVM = new Map();
function groundMat() {
  if (!GVM.has(STYLE.mode)) { const m = mat('#ffffff', { rim: 0 }).clone(); m.vertexColors = true; m.name = 'vr3ground'; GVM.set(STYLE.mode, m); }
  return GVM.get(STYLE.mode);
}
const tintC = c => new THREE.Color(STYLE.mode !== 'std' && STYLE.remap ? STYLE.remap(c) : c);
// 땅: 가까이는 연한 풀빛, 멀리는 하늘빛으로 (꼭짓점 색)
function groundMesh(Y) {
  const g = geo('vr3ground2|' + STYLE.mode, () => {
    const pg = new THREE.PlaneGeometry(90, 90, 30, 30); pg.rotateX(-HP);
    const p = pg.attributes.position, col = new Float32Array(p.count * 3), near = tintC('#e0e9dc'), far = tintC('#e4f0f4'), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { c.copy(near).lerp(far, smooth(10, 38, Math.hypot(p.getX(i), p.getZ(i)))); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    pg.setAttribute('color', new THREE.BufferAttribute(col, 3)); return pg;
  });
  return put(mesh(g, groundMat(), { cast: false }), 0, Y - .02, 0);
}
B.vr3_town = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [100, 100, 100, 100.01, 100.01, 100.01];
  f.group.name = 'vr3town'; f.group.userData.scenery = true;
  const Y0 = -DROP, SW = 1.4, RD = 4, CURB = .1, L = 26;
  const ZR0 = BZ + SW, ZR1 = ZR0 + RD, XR0 = BX + SW, XR1 = XR0 + RD;   // 앞길 z ZR0..ZR1, 옆길 x XR0..XR1
  f.add(groundMesh(Y0));
  // 아스팔트: 앞 큰길(끝까지), 옆길(앞길에 닿는 T자)
  f.add(tm('town2-asph', asphaltTex(), ({ add }) => {
    add(G.pbox(L * 2, .02, RD), 0, Y0, (ZR0 + ZR1) / 2); add(G.pbox(RD, .02, ZR0 + L), (XR0 + XR1) / 2, Y0, (ZR0 - L) / 2);
  }, '#ffffff', { s: 2 }));
  // 보도블럭 인도 (턱 .1): 길을 건너지 않고 모서리에서 만남
  const walks = [[-L, XR0, BZ, ZR0], [BX, XR0, -L, BZ], [XR1, L, BZ, ZR0], [XR1, XR1 + SW, -L, BZ], [-L, L, ZR1, ZR1 + SW]];
  f.add(tm('town2-pave', paveTex(), ({ add }) => {
    for (const [x0, x1, z0, z1] of walks) add(G.pbox(x1 - x0, CURB, z1 - z0), (x0 + x1) / 2, Y0 + CURB / 2, (z0 + z1) / 2);
  }, '#ffffff', { s: 1 }));
  // 골목·필로티 콘크리트: 우리 집 뒤·왼쪽 골목(길에 닿기 전까지), 필로티 바닥
  f.add(tm('town2-conc', concTex(), ({ add }) => {
    add(G.pbox(L + BX, .012, 1.58), (BX - L) / 2, Y0 + .006, -BZ - .79); add(G.pbox(1.48, .012, L + BZ), -BX - .74, Y0 + .006, (BZ - L) / 2);
    add(G.pbox(BX * 2, .012, BZ), 0, Y0 + .006, BZ / 2);
  }, '#ffffff', { s: 2 }));
  f.add(mc('vr3-town2', ({ add, tube }) => {
    const A = (g, c, x, y, z, rx, ry, rz, sc) => add(g, fade(c, x, z), x, y, z, rx, ry, rz, sc);
    // 연석 (밝은 화강석 턱)
    const KERB = '#d9d4cb';
    A(G.pbox(L + XR0, CURB + .03, .12), KERB, (XR0 - L) / 2, Y0 + CURB / 2, ZR0); A(G.pbox(L - XR1, CURB + .03, .12), KERB, (XR1 + L) / 2, Y0 + CURB / 2, ZR0);
    A(G.pbox(.12, CURB + .03, ZR0 + L), KERB, XR0, Y0 + CURB / 2, (ZR0 - L) / 2); A(G.pbox(.12, CURB + .03, ZR0 + L), KERB, XR1, Y0 + CURB / 2, (ZR0 - L) / 2);
    A(G.pbox(L * 2, CURB + .03, .12), KERB, 0, Y0 + CURB / 2, ZR1);
    // 노면: 가운데 노란 점선(교차로에서 끊김), 옆길 정지선, 횡단보도 둘
    const YL = '#f3df8e', WL = '#f7f7f4', ym = Y0 + .012;
    for (let x = -L + .6; x < L; x += 1.6) if (x < XR0 - .8 || x > XR1 + .8) A(G.pbox(.9, .006, .1), YL, x, ym, (ZR0 + ZR1) / 2);
    for (let z = -L + .6; z < BZ - 1.4; z += 1.6) A(G.pbox(.1, .006, .9), YL, (XR0 + XR1) / 2, ym, z);
    A(G.pbox(RD / 2 - .15, .006, .22), WL, XR0 + RD / 4, ym, BZ - 1.15);
    for (let k = 0; k < 5; k++) A(G.pbox(.42, .006, 1.2), WL, XR0 + .4 + k * .8, ym, BZ - .3);
    for (let k = 0; k < 5; k++) A(G.pbox(1.2, .006, .42), WL, -1.1, ym, ZR0 + .4 + k * .8);
    // 맨홀 뚜껑 둘, 빗물받이
    for (const [x, z] of [[-6, ZR0 + 1.1], [XR0 + 2.9, -5]]) { A(G.cyl(.32, .32, .012, 18), '#8f8c95', x, ym, z); A(G.tor(.3, .018, PI * 2, 4, 18), '#7d7a84', x, ym + .004, z, HP, 0, 0); }
    for (const x of [-4.2, 1.6, 12]) A(G.pbox(.5, .008, .2), '#77747d', x, ym, ZR0 + .16);
    // ── 가로수: 인도 나무 받침 + 둥근 수관 ──
    const tree = (x, z, s = 1, grate = true, k0 = 0) => {
      if (grate) { A(G.box(.5, .05, .5, .01), '#b4ada2', x, Y0 + CURB + .025, z); A(G.pbox(.36, .052, .36), '#8f7a62', x, Y0 + CURB + .026, z); }
      const y0 = grate ? Y0 + CURB : Y0;
      tube([x, y0, z], [x, y0 + 1.3 * s, z], .08 * s, fade('#9a7a5c', x, z), 6);
      for (let k = 0; k < 5; k++) { const a = k * 1.3 + k0; A(G.sph(.5 * s, 9, 7), (k + k0) % 2 ? '#a9d394' : '#93c486', x + Math.cos(a) * .32 * s, y0 + (1.7 + (k % 3) * .28) * s, z + Math.sin(a) * .32 * s); }
      A(G.sph(.42 * s, 9, 7), '#b8dca2', x, y0 + 2.35 * s, z);
    };
    // (우리 집 앞·옆 인도 나무는 빌라 필로티·창을 가리지 않게 멀리만)
    tree(-9, BZ + .7, 1, true, 1); tree(BX + .7, -9.5, 1, true, 2);
    for (const x of [-12, -6.5, 2.4, 7, 12.5, 18]) tree(x, ZR1 + .7, 1.05, true, x);
    for (const z of [-2, -8.5, -15]) tree(XR1 + .7, z, 1.05, true, z);
    // ── 생울타리: 인도 바깥(길 건너 산책길·옆길 건너) 낮고 둥근 초록 줄 ──
    const hedge = (x0, x1, z0, z1) => { const w = x1 - x0, d = z1 - z0; A(G.box(w, .5, d, .2), '#9fcb8c', (x0 + x1) / 2, Y0 + .25, (z0 + z1) / 2);
      for (let t = .5; t < Math.max(w, d); t += .9) { const x = w > d ? x0 + t : (x0 + x1) / 2, z = w > d ? (z0 + z1) / 2 : z0 + t; A(G.sph(.3, 8, 6), '#b2d79c', x, Y0 + .5, z, 0, 0, 0, [1.2, .55, 1.2]); } };
    hedge(-L + 1, -1.9, ZR1 + SW + .1, ZR1 + SW + .7); hedge(-.2, L - 1, ZR1 + SW + .1, ZR1 + SW + .7);
    hedge(XR1 + SW + .1, XR1 + SW + .7, -L + 1, BZ - .2);
    // ── 동네 텃밭 (뒤 골목 너머, 한적하게 한 줄): 나무 테 두른 밭 넷, 고랑마다 상추·배추·고추 지지대, 앞 흙길, 빨간 물조리개 ──
    const PLOT = (x, z, kind) => {
      const w = 2.3, d = 1.5;
      A(G.box(w, .16, d, .02), '#c99c6a', x, Y0 + .08, z); A(G.pbox(w - .12, .03, d - .12), '#9c7a5c', x, Y0 + .15, z);
      for (let r = 0; r < 3; r++) {
        const rz = z - d / 2 + .3 + r * .45; A(G.pbox(w - .25, .05, .2), '#a9866a', x, Y0 + .18, rz);
        for (let c = 0; c < 6; c++) {
          const px = x - w / 2 + .3 + c * .34;
          if (kind === 0) A(G.sph(.1, 7, 5), c % 2 ? '#9fd27e' : '#86c46e', px, Y0 + .24, rz, 0, 0, 0, [1.2, .7, 1.2]);
          else if (kind === 1) { A(G.sph(.12, 7, 5), '#c8e2a6', px, Y0 + .26, rz); A(G.sph(.09, 6, 5), '#e6f2cf', px, Y0 + .33, rz); }
          else { tube([px, Y0 + .18, rz], [px, Y0 + .52, rz], .01, fade('#c9a46a', px, rz), 4); A(G.sph(.09, 6, 5), '#7fbf6a', px, Y0 + .38, rz, 0, 0, 0, [1, 1.2, 1]); if (c % 2) A(G.cap(.018, .05, 2, 5), '#e2513f', px + .05, Y0 + .36, rz); }
        }
      }
      A(G.pbox(.04, .4, .04), '#b18a5c', x - w / 2 + .1, Y0 + .3, z + d / 2 - .05); A(G.box(.3, .18, .02, .01), '#f4efe4', x - w / 2 + .1, Y0 + .52, z + d / 2 - .03);
    };
    [[-11.7, 0], [-8.9, 1], [-6.1, 2], [-3.3, 0]].forEach(([x, k]) => PLOT(x, -7.9, k));
    A(G.pbox(11.6, .01, .6), '#d8c8ae', -7.5, Y0 + .005, -6.75);
    A(G.box(.3, .2, .16, .04), '#e2513f', -7.5, Y0 + .1, -6.75); tube([-7.35, Y0 + .16, -6.75], [-7.15, Y0 + .26, -6.75], .015, fade('#e2513f', -7, -7), 4);
    // 비닐하우스 두 동 (흰 반원 지붕 + 갈비살 + 끝 문)
    const house = (x, z, len) => {
      const R = 1.05; A(G.cyl(R, R, len, 16, true), '#eef4f0', x, Y0, z, HP, 0, 0, [1, 1, 1]);
      for (let t = -len / 2; t <= len / 2 + .01; t += len / 5) A(G.tor(R + .01, .025, PI, 3, 16), '#cfd8d4', x, Y0, z + t, 0, 0, 0);
      for (const s of [-1, 1]) { A(G.cyl(R - .01, R - .01, .02, 16, false), '#f6f9f7', x, Y0, z + s * len / 2, HP, 0, 0, [1, 1, 1]); }
      A(G.pbox(.5, .9, .03), '#cfe0d8', x, Y0 + .45, z + len / 2 + .02);
    };
    house(-6.6, -11.2, 3.4);
    // ── 쌈지 공원 (왼쪽 골목 너머): 잔디, 정자(초록 기와 지붕), 벤치 둘, 둥근 나무 ──
    A(G.box(6.5, .04, 7.5, .02), '#cfe4bb', -9.6, Y0 + .02, -.6);
    { const px = -9.2, pz = -1.2, H = 1.5;
      A(G.box(2.1, .25, 2.1, .03), '#c99c6a', px, Y0 + .125, pz);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) A(G.box(.14, H, .14, .02), '#b0784c', px + sx * .9, Y0 + .25 + H / 2, pz + sz * .9);
      A(G.box(2.2, .12, 2.2, .02), '#b0784c', px, Y0 + .25 + H, pz);
      A(G.cone(1.75, .85, 4), '#7fae86', px, Y0 + .25 + H + .45, pz, 0, PI / 4, 0); A(G.sph(.1, 8, 6), '#e2bd6a', px, Y0 + .25 + H + .9, pz); }
    const bench = (x, z, ry) => { A(G.box(1.1, .06, .36, .02), '#d9a466', x, Y0 + .42, z, 0, ry, 0); A(G.box(1.1, .3, .05, .02), '#d9a466', x - Math.sin(ry) * .17, Y0 + .62, z - Math.cos(ry) * .17, 0, ry, 0);
      for (const s of [-1, 1]) A(G.pbox(.06, .42, .32), '#6f7480', x + Math.cos(ry) * s * .45, Y0 + .21, z - Math.sin(ry) * s * .45, 0, ry, 0); };
    bench(-7.4, 2.0, PI); bench(-11.4, 1.8, PI);
    tree(-12.2, -3.6, 1.15, false, 1); tree(-7, -3.9, .95, false, 2); tree(-12.4, 2.4, 1.0, false, 3);
    // ── 옆길 건너: 텃밭 셋과 나무 ──
    for (const [z, k] of [[-3.2, 1], [-6.4, 0]]) PLOT(XR1 + SW + 2.2, z, k);
    tree(XR1 + SW + 4.6, -4, 1.1, false, 4); tree(XR1 + SW + 4.4, 1.2, 1.0, false, 5);
    // ── 길 건너 앞: 산책길 화단(꽃 점) ──
    for (let x = -L + 2; x < L - 2; x += 2.6) for (let k = 0; k < 3; k++) A(G.sph(.06, 6, 5), ['#ffb3c4', '#ffd86b', '#ffffff'][k], x + k * .22, Y0 + .56, ZR1 + SW + .4 + (k % 2) * .12);
    // ── 멀리 나무 무리 (지평선 쪽, 하늘빛으로 흐려짐) ──
    const R0 = (() => { let a = 77; return () => ((a = (a * 16807) % 2147483647) - 1) / 2147483646; })();
    for (let k = 0; k < 34; k++) {
      const ang = k / 34 * PI * 2 + R0() * .15, d = 21 + R0() * 7, x = Math.cos(ang) * d, z = Math.sin(ang) * d;
      if (x < -9 && x > -15 && z < -12 && z > -18) continue;
      const s = 1.3 + R0() * .7; A(G.sph(1.1 * s, 8, 6), k % 2 ? '#a9d394' : '#9cc98a', x, Y0 + 1.3 * s, z, 0, 0, 0, [1, .9, 1]);
      A(G.sph(.8 * s, 8, 6), '#b8dca2', x + .6 * s, Y0 + 1.0 * s, z + .3 * s);
    }
    // 멀리 다음 판(21판) 동네 파출소, 작게: 흰 타일 단층, 파란 띠, 둥근 모서리 탑 위 빨강·파랑 경광등, 지붕 위 파란 간판, 앞 유리문
    { const qx = -11.8, qz = -14.8, qw = 3.6, qd = 2.8, qh = 1.7, tx = qx + qw / 2 - .25, tz = qz + qd / 2 - .25;
      A(G.box(qw, qh, qd, .05), '#fbfbf8', qx, Y0 + qh / 2, qz); A(G.pbox(qw + .02, .18, qd + .02), '#4f7fc4', qx, Y0 + qh - .38, qz);
      A(G.pbox(qw + .12, .09, qd + .12), '#e6ebf2', qx, Y0 + qh + .045, qz);
      A(G.cyl(.6, .6, 2.5, 22), '#fbfbf8', tx, Y0 + 1.25, tz); A(G.cyl(.615, .615, .18, 22), '#4f7fc4', tx, Y0 + qh - .38, tz);
      A(G.cyl(.66, .66, .08, 22), '#e6ebf2', tx, Y0 + 2.54, tz); A(G.cyl(.22, .26, .14, 14), '#d9dde3', tx, Y0 + 2.65, tz);
      A(G.sph(.17, 12, 8), '#ff5a5a', tx - .14, Y0 + 2.8, tz, 0, 0, 0, [1, 1.2, 1]); A(G.sph(.17, 12, 8), '#4f86ff', tx + .14, Y0 + 2.8, tz, 0, 0, 0, [1, 1.2, 1]);
      A(G.box(1.7, .42, .1, .03), '#3f6fb5', qx - .5, Y0 + qh + .32, qz + qd / 2 - .3); A(G.pbox(1.3, .1, .012), '#ffffff', qx - .5, Y0 + qh + .34, qz + qd / 2 - .244);
      A(G.pbox(.9, 1.1, .03), '#bcd6e6', qx - .6, Y0 + .55, qz + qd / 2 + .01); A(G.pbox(.06, 1.1, .04), '#4f7fc4', qx - .6, Y0 + .55, qz + qd / 2 + .02);
      for (const x of [qx + .5, qx - 1.4]) A(G.pbox(.6, .5, .03), '#c9dbe6', x, Y0 + 1.0, qz + qd / 2 + .01);
      A(G.box(.36, .16, .05, .02), '#4f7fc4', qx - .6, Y0 + 1.22, qz + qd / 2 + .04); }
    // (전봇대·전선은 뺌 — 빌라 앞면을 가로지르던 줄이 지저분, 사용자 "도로도 정리")
  }));
};

// ── 계단실과 큰 물탱크 (2×2, 뒤 오른쪽 모서리: 동쪽·북쪽 벽이 건물 면과 한 면) ─────────────────────────────────────────────
// 옛 옥탑방의 벽돌·초록 철문·번호키·삼선 슬리퍼는 그대로; 문 = code 자물쇠 자리 (lockable)
B.vr3_stairhut = (f, T) => {
  const X0 = -.75, X1 = 1.02, Z0 = -1.02, Z1 = .55, H = 1.95, TW = .1, DX = -.28, DW = .62, DH = 1.36;
  const dl = DX - DW / 2, dr = DX + DW / 2;
  f.add(tm('hut-brick', brickTex(), ({ add }) => {
    add(G.pbox(X1 - X0, H, TW), (X0 + X1) / 2, H / 2, Z0 + TW / 2);
    add(G.pbox(TW, H, Z1 - Z0), X0 + TW / 2, H / 2, (Z0 + Z1) / 2); add(G.pbox(TW, H, Z1 - Z0), X1 - TW / 2, H / 2, (Z0 + Z1) / 2);
    add(G.pbox(dl - X0, H, TW), (X0 + dl) / 2, H / 2, Z1 - TW / 2); add(G.pbox(X1 - dr, H, TW), (dr + X1) / 2, H / 2, Z1 - TW / 2);
    add(G.pbox(DW, H - DH, TW), DX, DH + (H - DH) / 2, Z1 - TW / 2);
  }, '#ffffff', { s: 1, ou: .5, ov: 0 }));
  // 동쪽 면 유리블록(아래 계단실 기둥이 이어져 올라옴)
  f.add(tm('hut-gblock', gblockTex(), ({ add }) => { add(G.pbox(.04, 1.0, .66), X1 + .02, 1.0, -.2); }, '#ffffff', { s: .5 }));
  f.add(mc('vr3-hut', ({ add, tube }) => {
    add(G.pbox(X1 - X0 - TW * 2, .02, Z1 - Z0 - TW * 2), '#cfc3b0', (X0 + X1) / 2, .01, (Z0 + Z1) / 2);
    add(G.pbox(X1 - X0 - TW * 2, H - .02, .02), '#8a7d72', (X0 + X1) / 2, H / 2, Z0 + TW + .01);
    for (let k = 0; k < 5; k++) add(G.pbox(.7, .1, .24), '#bdb3a4', DX + .05, .05 + k * .1, Z0 + .2 + k * .2);
    // 지붕 슬래브(크림, 처마 띠), 위 초록 방수
    add(G.box(X1 - X0 + .14, .14, Z1 - Z0 + .14, .015), CREAM, (X0 + X1) / 2, H + .07, (Z0 + Z1) / 2);
    add(G.pbox(X1 - X0 + .06, .012, Z1 - Z0 + .06), GREEN, (X0 + X1) / 2, H + .146, (Z0 + Z1) / 2);
    // 문틀·문턱(방수 턱)·투명 차양·외등
    for (const x of [dl - .025, dr + .025]) add(G.pbox(.05, DH + .05, .06), '#e9e2d6', x, (DH + .05) / 2, Z1 + .01);
    add(G.pbox(DW + .1, .05, .06), '#e9e2d6', DX, DH + .025, Z1 + .01);
    add(G.box(DW + .22, .14, .3, .015), '#d8d0c2', DX, .07, Z1 + .15);
    add(G.box(DW + .4, .03, .42, .01), '#cfe4ee', DX, DH + .26, Z1 + .2, -.22, 0, 0);
    for (const x of [DX - DW / 2 - .16, DX + DW / 2 + .16]) tube([x, DH + .3, Z1 + .01], [x, DH + .18, Z1 + .38], .009, STEEL, 4);
    add(G.cyl(.08, .08, .05, 14).rotateX(HP), '#e9e2d6', dr + .2, DH + .05, Z1 + .03); add(G.sph(.065, 10, 8), '#fff4c8', dr + .2, DH + .05, Z1 + .06, 0, 0, 0, [1, 1, .55]);
    // 삼선 슬리퍼 (문턱 위)
    for (const [sx, a] of [[-.1, -.15], [.08, .2]]) { add(G.box(.1, .025, .21, .02), '#3b6fd6', DX + sx, .155, Z1 + .16, 0, a, 0);
      for (let k = 0; k < 3; k++) add(G.pbox(.105, .006, .018), '#ffffff', DX + sx - Math.sin(a) * (k - 1) * .03, .17, Z1 + .12 + (k - 1) * .03); }
    // 전기 분전함, 빗자루·쓰레받기 (문 오른쪽)
    add(G.box(.3, .38, .1, .015), '#d9dbe0', .55, 1.15, Z1 + .05); add(G.pbox(.26, .01, .02), '#9aa0aa', .55, 1.1, Z1 + .1);
    tube([.48, .02, Z1 + .12], [.4, 1.0, Z1 + .03], .014, '#c9a46a', 5);
    for (let k = 0; k < 7; k++) add(G.box(.03, .2, .03, .01), '#d9b56a', .48 + (k - 3) * .02, .1, Z1 + .14, 0, 0, (k - 3) * .08);
    add(G.box(.22, .02, .18, .01), '#5aa86a', .78, .01, Z1 + .2); add(G.box(.22, .1, .02, .01), '#5aa86a', .78, .06, Z1 + .11);
    // 서쪽 면 작은 창(방범창)
    add(G.pbox(.02, .4, .5), '#bfe0ec', X0 - .005, 1.25, -.3); for (let k = 0; k < 5; k++) add(G.cyl(.008, .008, .46, 5), '#55606e', X0 - .06, 1.25, -.5 + k * .1);
    add(G.pbox(.1, .04, .58), '#e9e2d6', X0 - .04, 1.03, -.3);
    // ── 큰 노란 물탱크: 쇠 받침 위, 사다리·관·맨홀 뚜껑 ──
    const TY = H + .15, TR = .74, TH = 1.3, TX = .14, TZ = -.24;
    for (const sx of [-1, 1]) add(G.pbox(1.6, .12, .12), STEEL, TX, TY + .06, TZ + sx * .5);
    for (const sx of [-1, 1]) add(G.pbox(.12, .1, 1.2), STEEL, TX + sx * .6, TY + .17, TZ);
    add(G.cyl(TR, TR * .97, TH, 28), TANKY, TX, TY + .22 + TH / 2, TZ);
    for (const y of [.22, .52, .82, 1.12]) add(G.tor(TR + .006, .026, PI * 2, 5, 32), TANKY2, TX, TY + .22 + y, TZ, HP, 0, 0);
    for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; add(G.pbox(.03, TH - .1, .02), TANKY2, TX + Math.cos(a) * (TR + .004), TY + .22 + TH / 2, TZ + Math.sin(a) * (TR + .004), 0, -a + HP, 0); }
    add(G.sph(TR, 28, 10), TANKY, TX, TY + .22 + TH, TZ, 0, 0, 0, [1, .28, 1]);
    add(G.cyl(.24, .24, .1, 18), '#ffd768', TX, TY + .22 + TH + .17, TZ); add(G.cyl(.25, .25, .03, 18), '#4f86c6', TX, TY + .22 + TH + .23, TZ);
    tube([TX + .3, TY + .22 + TH + .1, TZ - .2], [TX + .3, TY + .22 + TH + .38, TZ - .2], .025, '#cfd3da', 6); add(G.cyl(.04, .04, .05, 8), '#cfd3da', TX + .3, TY + .22 + TH + .4, TZ - .2);
    add(G.box(.46, .2, .02, .01), '#ffffff', TX, TY + .82, TZ + TR - .005); add(G.pbox(.36, .04, .012), '#4f86c6', TX, TY + .85, TZ + TR + .008); add(G.pbox(.26, .025, .012), '#4f86c6', TX, TY + .78, TZ + TR + .008);
    tube([TX - .3, TY + .35, TZ + .45], [TX - .3, TY + .02, TZ + .45], .03, '#cfd3da', 6);
    tube([TX - .3, TY + .02, TZ + .45], [X0 + .25, TY + .02, TZ + .45], .03, '#cfd3da', 6); tube([X0 + .25, TY + .02, TZ + .45], [X0 + .25, TY - .05, TZ + .45], .03, '#cfd3da', 6);
    add(G.box(.12, .1, .12, .02), '#4f86c6', TX - .3, TY + .2, TZ + .45);
    // 사다리: 앞(+z) 오른쪽 벽 → 지붕 → 탱크 위
    for (const x of [.62, .9]) tube([x, .02, Z1 + .06], [x, H + .5, Z1 + .06], .016, STEEL, 6);
    for (let y = .25; y < H + .45; y += .24) tube([.62, y, Z1 + .06], [.9, y, Z1 + .06], .011, STEEL, 5);
    for (const x of [.62, .9]) tube([x, H + .5, Z1 + .06], [x, H + .5, Z1 - .12], .016, STEEL, 5);
    const lp = (th, r, y) => [TX + Math.sin(th) * r, y, TZ + Math.cos(th) * r];
    for (const th of [.86, 1.12]) tube(lp(th, TR + .07, TY + .2), lp(th, TR + .07, TY + .22 + TH + .12), .014, STEEL, 5);
    for (let y = TY + .42; y < TY + TH + .3; y += .22) tube(lp(.86, TR + .07, y), lp(1.12, TR + .07, y), .01, STEEL, 4);
    // 피뢰침·TV 안테나(지붕 앞 왼쪽 모서리)
    tube([X0 + .12, H + .15, Z1 - .1], [X0 + .12, H + 1.2, Z1 - .1], .014, STEEL, 5);
    for (let k = 0; k < 5; k++) tube([X0 + .12 - .22 + k * .02, H + .7 + k * .1, Z1 - .1], [X0 + .12 + .22 - k * .02, H + .7 + k * .1, Z1 - .1], .007, STEEL, 4);
  }));
  // 문: 초록 철문(옛 옥탑방 그대로), 번호키·레버 손잡이, 안내판 — 밖으로 열림
  const dv = grp(); put(dv, dl, 0, Z1 + .005); f.add(dv);
  dv.add(mc('vr3-hut-door', ({ add }) => {
    add(G.box(DW - .02, DH - .02, .045, .01), '#4f8f6a', DW / 2, DH / 2, 0);
    add(G.box(DW - .16, DH * .36, .012, .005), '#5ea079', DW / 2, DH * .72, .025); add(G.box(DW - .16, DH * .36, .012, .005), '#5ea079', DW / 2, DH * .27, .025);
    add(G.box(.08, .17, .028, .008), '#2c2f36', DW - .1, DH * .55, .03); add(G.pbox(.05, .05, .006), '#8fd3f4', DW - .1, DH * .58, .046);
    add(G.box(.11, .026, .026, .01), '#c9cfd8', DW - .12, DH * .45, .042);
    add(G.pbox(DW - .04, .03, .02), '#3f7a58', DW / 2, .03, .02);
  }));
  dv.add(put(mesh(geo('vr3note', () => new THREE.PlaneGeometry(.3, .15)), mat('#ffffff', { map: noteTex(), rim: 0 })), DW / 2 - .05, DH * .83, .033));
  const p = f.part('door', dv, (t, b) => { dv.rotation.y = -1.5 * t; }, { label: '계단실 문', sfx: 'door', dur: .34 });
  p.lockable = true; p.lockKind = 'code'; p.lockAt = { x: DW - .1, y: DH * .52, z: .06, parent: dv };
  f.spot('inside', null, DX, .02, Z1 - .32, { part: p, maxH: .32, label: '계단실 문 안', scale: .85 });
  f.spot('on', null, DX + .02, .15, Z1 + .18, { maxH: .16, label: '문턱 위', scale: .6 });
  f.spot('beside', null, .78, 0, Z1 + .28, { maxH: .25, label: '사다리 옆', scale: .7 });
};


// ── 옥상 화분 선반 (2×1, 데크 앞줄 — ① 10/24 사용자 "오브젝트들 디테일 상당히 떨어짐": 옛 공용 화분 줄 대신 이 판 것) ──────────────────────
// 나무 2단 계단식 선반: 위 칸 토분 셋(고추 — 빨강·초록 고추, 방울토마토 — 지지대에 묶은 줄기·송이, 흰 화분 대파), 아래 칸 초록 긴 화분에
// 상추 포기 넷과 깻잎 화분·다육 그릇, 바닥엔 초록 물조리개·모종삽·상토 포대. 덩어리는 크게, 포인트 색은 열매·물조리개만
const TERRA = '#d98b5f', TERRA2 = '#c4774d', SOIL = '#7a5a44', WOODL = '#ddb07a', WOODM = '#c29060', LET = '#9fd27e', LET2 = '#7fc06a';
function pot(add, x, y, z, r, h, c = TERRA, c2 = TERRA2) {
  add(G.cyl(r, r * .78, h, 16), c, x, y + h / 2, z); add(G.tor(r * .98, r * .13, PI * 2, 6, 20), c2, x, y + h - r * .05, z, HP, 0, 0);
  add(G.cyl(r * .9, r * .9, .012, 16), SOIL, x, y + h - .02, z);
}
function lettuce(add, x, y, z, s = 1) {
  for (let k = 0; k < 7; k++) { const a = k * 2.4; add(G.sph(.075 * s, 8, 6), k % 2 ? LET : LET2, x + Math.cos(a) * .055 * s, y + .03 * s, z + Math.sin(a) * .055 * s, 0, -a, .55, [1.35, .32, 1]); }
  add(G.sph(.05 * s, 8, 6), '#c4e6a2', x, y + .05 * s, z, 0, 0, 0, [1, .8, 1]);
}
B.vr3_potrow = (f, T) => {
  f.add(mc('vr3-potrow', ({ add, tube }) => {
    // 선반: 옆판 둘(계단 모양), 아래 칸 판, 위 칸 판, 뒤 다리
    for (const x of [-.82, .82]) { add(G.box(.05, .2, .62, .012), WOODM, x, .1, -.02); add(G.box(.05, .26, .3, .012), WOODM, x, .33, -.18); }
    add(G.box(1.7, .045, .32, .012), WOODL, 0, .2, .12); for (const z of [.02, .12, .22]) add(G.pbox(1.62, .002, .006), '#c99a62', 0, .224, z);
    add(G.box(1.7, .045, .3, .012), WOODL, 0, .46, -.17); for (const z of [-.25, -.15, -.07]) add(G.pbox(1.62, .002, .006), '#c99a62', 0, .484, z);
    add(G.pbox(1.6, .05, .02), WOODM, 0, .06, .26); add(G.pbox(1.6, .05, .02), WOODM, 0, .3, -.31);
    // 위 칸: 고추 화분
    pot(add, -.55, .48, -.17, .1, .17);
    tube([-.55, .63, -.17], [-.55, .9, -.17], .008, '#6fa65a', 4);
    for (let k = 0; k < 7; k++) { const a = k * 1.9, y = .7 + k * .03; add(G.sph(.045, 7, 5), k % 2 ? '#6fb85a' : '#5aa64f', -.55 + Math.cos(a) * .07, y, -.17 + Math.sin(a) * .06, 0, -a, .3, [1.5, .45, .9]); }
    for (const [dx, dz, c, ry] of [[.05, .05, '#e2513f', .2], [-.06, .03, '#e2513f', -.3], [.02, -.06, '#5fa84a', .5], [-.03, .07, '#e2513f', 1]]) {
      add(G.cap(.017, .07, 3, 6), c, -.55 + dx, .72, -.17 + dz, 0, ry, .2); add(G.sph(.012, 5, 4), '#4f8f3a', -.55 + dx, .77, -.17 + dz); }
    // 위 칸: 방울토마토 (지지대·묶은 끈·송이)
    pot(add, -.08, .48, -.17, .12, .19);
    tube([-.08, .64, -.17], [-.08, 1.12, -.17], .009, '#c99a62', 4); tube([.0, .64, -.13], [-.02, 1.0, -.15], .007, '#c99a62', 4);
    for (let k = 0; k < 8; k++) { const a = k * 2.3, y = .72 + k * .05; add(G.sph(.055, 7, 5), k % 2 ? '#6fb85a' : '#5aa64f', -.08 + Math.cos(a) * .08, y, -.17 + Math.sin(a) * .07, 0, -a, .35, [1.5, .45, .9]);
      if (k % 2) add(G.tor(.014, .004, PI * 2, 3, 8), '#f4efe4', -.08, y - .02, -.17, HP, 0, 0); }
    for (const [x, y, z] of [[-.02, .8, -.1], [-.01, .76, -.08], [.0, .82, -.07], [-.15, .92, -.11], [-.14, .88, -.09], [-.04, 1.0, -.12], [-.03, .96, -.1]]) add(G.sph(.026, 8, 6), '#e8414e', x, y, z);
    // 위 칸: 흰 화분 대파
    pot(add, .4, .48, -.17, .1, .16, '#f2eee6', '#e2ddd2');
    for (let k = 0; k < 6; k++) { const a = k * 1.05, x = .4 + Math.cos(a) * .04, z = -.17 + Math.sin(a) * .04, tl = (k % 2 ? .1 : -.08);
      tube([x, .62, z], [x, .72, z], .016, '#f4f2e8', 5); tube([x, .72, z], [x + tl * .3, 1.0 - (k % 3) * .06, z + tl * .2], .014, k % 2 ? '#7fc06a' : '#6fb85a', 5); }
    // 아래 칸: 초록 긴 화분에 상추 넷, 깻잎 화분, 다육 그릇
    add(G.box(.8, .16, .24, .03), '#6faa7c', -.28, .3, .12); add(G.pbox(.84, .03, .27), '#5f9a6c', -.28, .37, .12); add(G.pbox(.74, .01, .2), SOIL, -.28, .38, .12);
    for (let k = 0; k < 4; k++) lettuce(add, -.58 + k * .2, .38, .12, 1);
    pot(add, .33, .225, .12, .1, .15);
    for (let k = 0; k < 9; k++) { const a = k * 2.2, y = .4 + (k % 3) * .04; add(G.sph(.06, 8, 5), k % 2 ? '#4f9a4f' : '#5aa85a', .33 + Math.cos(a) * .06, y, .12 + Math.sin(a) * .06, 0, -a, .25, [1.25, .25, 1.1]); }
    add(G.cyl(.11, .08, .07, 14), '#e9e2d4', .65, .26, .12); for (let k = 0; k < 5; k++) { const a = k * 1.25; add(G.cone(.03, .07, 6), '#8ccab0', .65 + Math.cos(a) * .05, .32, .12 + Math.sin(a) * .05, Math.sin(a) * .4, 0, -Math.cos(a) * .4); }
    add(G.cone(.035, .09, 6), '#9fd6c0', .65, .34, .12);
    // 바닥: 물조리개(초록, 꽃 노즐), 모종삽, 상토 포대
    const WX = .62, WZ = .4;
    add(G.cyl(.09, .1, .2, 14), '#5cb07a', WX, .1, WZ); add(G.cyl(.06, .06, .02, 12), '#4f9a6a', WX - .02, .21, WZ);
    add(G.tor(.07, .014, PI, 4, 12), '#4f9a6a', WX, .2, WZ, 0, HP, 0);
    tube([WX + .07, .06, WZ], [WX + .24, .22, WZ], .016, '#5cb07a', 6); add(G.cyl(.035, .022, .04, 10), '#4f9a6a', WX + .25, .235, WZ, 0, 0, -.8);
    add(G.box(.32, .4, .16, .06), '#e9dcc4', -.55, .18, .42, -.1, .2, 0); add(G.box(.2, .12, .01, .005), '#6faa7c', -.53, .22, .5, -.1, .2, 0);
    add(G.box(.12, .04, .08, .015), '#8a5a3c', -.62, .38, .4, -.1, .2, 0);
    add(G.box(.05, .012, .1, .006), '#c9ccd2', -.15, .012, .45, 0, .5, 0); tube([-.13, .012, .39], [-.09, .02, .3], .012, '#e2513f', 5);
  }));
  f.spot('beside', null, .2, 0, .4, { maxH: .2, label: '화분 줄 앞', scale: .6 });
};

// ── 옥상 수돗가 (1×1, 앞 오른쪽 구석 — 옛 공용 옥상 수도 대신): 세운 수도관(놋쇠 꼭지·빨강 손잡이·걸어 둔 고무장갑), 빨간 고무 대야에 물과
// 띄워 둔 수박(집들이!)·바가지, 파란 양동이(숨김 자리), 초록 호스 감개 수레, 솔·빗자루 ──────────────────────────────────────────────
B.vr3_tap = (f, T) => {
  const PX = -.3, PZ = -.3;
  f.add(mc('vr3-tap', ({ add, tube }) => {
    add(G.box(.22, .07, .22, .02), '#d9d2c4', PX, .035, PZ);
    tube([PX, .06, PZ], [PX, .74, PZ], .032, '#9aa3b2', 10); for (const y of [.3, .55]) add(G.pbox(.08, .03, .08), '#7f8898', PX, y, PZ);
    tube([PX, .7, PZ], [PX + .13, .7, PZ], .026, '#d9b15a', 10); add(G.cyl(.032, .026, .08, 10), '#d9b15a', PX + .15, .66, PZ);
    add(G.cyl(.012, .012, .06, 6), '#d9b15a', PX + .07, .75, PZ); add(G.box(.11, .02, .03, .008), '#e2403a', PX + .07, .785, PZ);
    add(G.box(.08, .16, .03, .03), '#ffd86b', PX - .04, .58, PZ + .04, 0, 0, .15); add(G.box(.07, .13, .03, .03), '#ffd86b', PX + .01, .55, PZ + .05, 0, 0, -.1);
    // 빨간 고무 대야: 물, 수박, 바가지
    const BX2 = PX + .22, BZ2 = PZ + .26;
    add(G.cyl(.27, .22, .2, 20, true), '#e2513f', BX2, .1, BZ2); add(G.cyl(.22, .22, .01, 20), '#c8433a', BX2, .006, BZ2);
    add(G.tor(.27, .022, PI * 2, 5, 24), '#c8433a', BX2, .2, BZ2, HP, 0, 0);
    add(G.cyl(.255, .255, .012, 20), '#9fd3e6', BX2, .155, BZ2);
    add(G.sph(.12, 14, 10), '#4f9a4f', BX2 - .05, .19, BZ2 - .02, 0, .3, 0, [1, .9, 1.15]);
    for (let k = 0; k < 6; k++) add(G.sph(.121, 14, 10), '#2f7a3f', BX2 - .05, .19, BZ2 - .02, 0, .3 + k * PI / 6, 0, [.18, .9, 1.16]);
    add(G.sph(.08, 10, 8), '#e9cf8a', BX2 + .12, .17, BZ2 + .1, 0, 0, 0, [1, .4, 1]); tube([BX2 + .18, .18, BZ2 + .12], [BX2 + .27, .2, BZ2 + .17], .015, '#c9a46a', 5);
    // 파란 양동이 (숨김 자리) — 솔 하나 걸침
    // (10/29 사용자 "저 바구니 좀 어케 해 봐": the bucket stood half in the basin — it sits on the floor beside it now)
    const QX = PX + .62, QZ = PZ + .5;
    add(G.cyl(.14, .11, .25, 16, true), '#4a8fe0', QX, .125, QZ); add(G.cyl(.11, .11, .01, 16), '#3a78c8', QX, .006, QZ);
    add(G.tor(.14, .012, PI * 2, 4, 18), '#3a78c8', QX, .25, QZ, HP, 0, 0); add(G.tor(.13, .006, PI, 3, 12), '#9aa3b2', QX, .25, QZ, 0, .6, 0);
    add(G.box(.12, .04, .06, .015), '#ffd86b', QX + .1, .27, QZ + .05, .2, .4, 0); for (let k = 0; k < 4; k++) add(G.pbox(.01, .03, .05), '#e9a23a', QX + .06 + k * .025, .24, QZ + .05);
    // 호스 감개 수레: 바퀴 둘, 감긴 초록 호스, 손잡이 — 호스 끝이 수도꼭지로
    const RX = PX + .02, RZ = PZ + .58;
    for (const s of [-1, 1]) { add(G.cyl(.11, .11, .02, 16), '#3d3a44', RX + s * .14, .11, RZ, 0, 0, HP); add(G.pbox(.02, .28, .04), '#9aa3b2', RX + s * .12, .17, RZ - .02); }
    add(G.cyl(.09, .09, .22, 14), '#5cc278', RX, .2, RZ, 0, 0, HP); for (let k = 0; k < 5; k++) add(G.tor(.095, .012, PI * 2, 4, 16), k % 2 ? '#4fb06a' : '#5cc278', RX - .09 + k * .045, .2, RZ, 0, HP, 0);
    tube([RX - .12, .3, RZ - .02], [RX - .12, .42, RZ - .08], .012, '#9aa3b2', 5); tube([RX + .12, .3, RZ - .02], [RX + .12, .42, RZ - .08], .012, '#9aa3b2', 5); tube([RX - .13, .42, RZ - .08], [RX + .13, .42, RZ - .08], .014, '#3d3a44', 5);
    // (the hose ran under the basin and up through it: round its west side on the floor, up the pipe, over to the tap)
    tube([RX - .1, .12, RZ - .08], [PX - .2, .025, PZ + .45], .016, '#5cc278', 6); tube([PX - .2, .025, PZ + .45], [PX - .14, .025, PZ + .06], .016, '#5cc278', 6);
    tube([PX - .14, .025, PZ + .06], [PX - .05, .5, PZ + .05], .016, '#5cc278', 6); tube([PX - .05, .5, PZ + .05], [PX + .15, .62, PZ], .016, '#5cc278', 6);
    add(G.cyl(.025, .025, .015, 10), '#2e2b33', BX2 + .1, .162, BZ2 - .14); add(G.tor(.2, .006, PI * 1.3, 3, 20), '#cfeaf2', BX2, .163, BZ2, HP, 0, .4);
    // 빗자루 (수도관에 기댐)
    tube([PX - .12, .02, PZ + .1], [PX - .03, .95, PZ + .01], .014, '#c99a62', 5);
    add(G.cone(.08, .22, 8), '#e9c47a', PX - .13, .1, PZ + .11, -.09, 0, .09, [1, 1, .45]);
  }));
  f.spot('inside', null, PX + .62, .02, PZ + .5, { maxH: .2, label: '파란 양동이 안', scale: .5 });
  f.spot('beside', null, .28, 0, -.3, { maxH: .26, label: '수도 옆', scale: .6 });
};

// ── 20판 디테일 더하기 (⑥ 10/25 memo-check "20판 전체 디테일") — 자리·부품은 그대로, 큰 것부터 ──────────────────────────────
// 물탱크: 띠 밑으로 흘러내린 물때 자국, 옆에 붙은 수위계(투명 관에 파란 물), 받침 둘레 볼트, 뚜껑 비탈에 앉은 비둘기 둘.
// 난간 갓돌: 뒤(북) 갓돌에 고추 모종 화분 넷(빨간 고추)·물뿌리개, 서쪽 갓돌에 고추 말리는 채반과 빨래집게 통
const plus = (k, fn) => { const b = B[k]; B[k] = (f, T, o = {}) => { b(f, T, o); fn(f, T, o); }; };
plus('vr3_stairhut', f => {
  const H = 1.95, TY = H + .15, TR = .74, TH = 1.3, TX = .14, TZ = -.24;
  f.add(mc('vr3-tank-plus', ({ add, tube }) => {
    for (const [a, y, l] of [[.35, .5, .16], [.62, .8, .12], [.9, .5, .2], [1.18, 1.1, .1], [1.45, .8, .14], [.15, 1.1, .12]]) add(G.pbox(.022, l, .006), '#d29a2a', TX + Math.cos(a) * (TR + .012), TY + .22 + y - l / 2 - .03, TZ + Math.sin(a) * (TR + .012), 0, -a + HP, 0);
    const ga = .2, gx = TX + Math.cos(ga) * (TR + .05), gz = TZ + Math.sin(ga) * (TR + .05);
    tube([gx, TY + .3, gz], [gx, TY + 1.36, gz], .022, '#e8f6ff', 8); tube([gx, TY + .31, gz], [gx, TY + 1.0, gz], .016, '#5aa3e0', 8);
    for (const y of [TY + .3, TY + 1.36]) { add(G.box(.06, .03, .06, .01), STEEL, gx, y, gz); tube([gx, y, gz], [TX + Math.cos(ga) * TR, y, TZ + Math.sin(ga) * TR], .012, STEEL, 5); }
    for (let i = 0; i < 4; i++) add(G.pbox(.03, .004, .004), DARK, gx + .02, TY + .5 + i * .22, gz + .02);
    for (let i = 0; i < 20; i++) { const a = i / 20 * PI * 2; add(G.sph(.016, 6, 4), STEEL, TX + Math.cos(a) * (TR + .01), TY + .245, TZ + Math.sin(a) * (TR + .01)); }
  }));
  const top = TY + .22 + TH, dome = r => top + TR * .28 * Math.sqrt(Math.max(0, 1 - (r / TR) ** 2));
  addPigeon(f, TX + .44, dome(.46) + .005, TZ + .1, 1.9, { seed: 7 });
  addPigeon(f, TX + .26, dome(.42) + .005, TZ + .36, 2.6, { seed: 3, s: .9 });
});
plus('vr3_villa', f => {
  const zN = -BZ + IN / 2, xW = -BX + IN / 2, cap = PH + .07;
  f.add(mc('vr3-parapet-plus', ({ add, tube }) => {
    for (const [i, x] of [-3.0, -2.62, -2.24, -1.86].entries()) {
      add(G.cyl(.075, .058, .13, 12), i % 2 ? '#e8b089' : POT, x, cap + .065, zN); add(G.cyl(.068, .068, .01, 12), '#6a4a34', x, cap + .126, zN);
      for (let k = 0; k < 5; k++) { const a = k * 1.3 + i; add(G.sph(.034, 7, 5), k % 2 ? LEAF : LEAF2, x + Math.cos(a) * .04, cap + .17 + (k % 3) * .03, zN + Math.sin(a) * .04, 0, a, .4, [1, .6, 1]); }
      for (let k = 0; k < 3; k++) { const a = k * 2.1 + i * .7; add(G.cap(.01, .04, 2, 5), k === 2 ? LEAF : '#e8343a', x + Math.cos(a) * .045, cap + .16, zN + Math.sin(a) * .045, .2, 0, .3); }
      tube([x, cap + .13, zN], [x + .01, cap + .26, zN - .01], .005, '#a8733f', 3);
    }
    add(G.cyl(.06, .07, .13, 12), '#5aa86a', -1.45, cap + .065, zN); tube([-1.4, cap + .09, zN], [-1.28, cap + .16, zN], .012, '#5aa86a', 5); add(G.tor(.045, .01, PI, 4, 10), '#5aa86a', -1.49, cap + .13, zN, 0, 0, HP);
    const tz = -1.1;
    add(G.cyl(.14, .13, .03, 20), '#d9b885', xW, cap + .015, tz); add(G.tor(.14, .012, PI * 2, 4, 22), '#c4a06a', xW, cap + .03, tz, HP, 0, 0);
    for (let k = 0; k < 14; k++) { const a = k * 2.4, r = .03 + (k % 5) * .022; add(G.cap(.011, .07, 2, 5), k % 4 ? '#e8343a' : '#c92a30', xW + Math.cos(a) * r, cap + .04, tz + Math.sin(a) * r, HP, a, 0); }
    add(G.cyl(.045, .045, .08, 12), '#7fb5ff', xW, cap + .04, -.5); for (let k = 0; k < 4; k++) add(G.box(.008, .04, .016, .003), ['#ffcf5c', '#ff8fb3', '#7fd6c0', '#ffffff'][k], xW - .015 + (k % 2) * .03, cap + .09, -.5 - .012 + (k >> 1) * .024);
  }));
});

export const VR3_BUILDERS = B;
export const VR3_INFO = {
  vr3_villa: { w: 7, d: 6, name: '햇살빌라 몸통과 옥상', hidden: true, floor: true },
  vr3_town: { w: 7, d: 6, name: '햇살빌라 동네', hidden: true, floor: true },
  vr3_stairhut: { w: 2, d: 2, name: '계단실과 물탱크', hidden: true },
  vr3_potrow: { w: 2, d: 1, name: '옥상 화분 선반', hidden: true },
  vr3_tap: { w: 1, d: 1, name: '옥상 수돗가', hidden: true },
};

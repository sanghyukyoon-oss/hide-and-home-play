// 20판 새 안 '햇살빌라 옥상 집들이' villaroof3 (① 10/23 — 사용자 "얘도 다시 처음부터.. 빌라 아래를 GPT처럼 대략 만들어 주고 배경도 대략
// 잡아 준 것 자체는 좋지만.. 좀 더 현실적이고 디테일하게 모델링 다시 해 줘"; 앞서 "옥상 수조 좀 더 크게, 문·벽돌색·나무·장독대가 오리지널처럼,
// 건물에 그리다 만 벽돌 텍스처 같은 건 버리자").
//   vr3_villa    — 옥상 아래로 이어지는 3층 적벽돌 빌라 몸통(벽돌 결 텍스처 한 장으로 고르게), 층마다 크림 띠, 알루미늄 창(커튼·블라인드·
//                  간유리)·방범창·화분대·실외기·도시가스 배관과 계량기·우수관·계단실 유리블록, 1층 필로티(작은 차·스쿠터·분리수거함·우편함·
//                  현관), 옥상 난간(바깥은 벽돌, 안은 크림 + 초록 방수 턱)과 초록 우레탄 방수 바닥(롤러 결·덧칠·실금·배수구)
//   vr3_town     — 대략의 동네: 옥상들이 내려다보이는 낮은 빌라들(초록 옥상·노란 물탱크·옥탑·안테나·빨래), 보도블럭 인도와 연석 턱,
//                  아스팔트 길(가장자리 선·횡단보도), 골목, 전봇대와 전선, 가로수, 세워 둔 차 — 큰 면은 옅게
//   vr3_stairhut — 계단실(옛 옥탑방의 벽돌·초록 철문·번호키 그대로, 문은 code 자물쇠 자리) 위에 크게 올린 노란 물탱크(사다리·배관·맨홀 뚜껑)
// 계약은 house-props.js와 같음: 원점 = 자리 가운데 바닥, 앞은 +z. 정적인 것은 꼭짓점 색 한 덩어리(hmc), 결이 있는 면은 평면 매핑 텍스처 한 덩어리.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, mat, mesh, geo, canvasTex, texCache } from './kit.js';
import { HG as G, hxf as xf, hmc as mc } from './house-props.js';

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
// 이웃 빌라 벽 (한 칸 2 m × 한 층 1.85 m): 벽색, 옅은 줄눈, 가운데 창(흰 틀·하늘빛 유리·창턱), 아래 층 띠
function nbTex(wall, glass) {
  return TEX.get('vr3nb' + wall + glass, () => rep(canvasTex(256, 256, (c, W, H) => {
    c.fillStyle = wall; c.fillRect(0, 0, W, H);
    c.globalAlpha = .07; c.fillStyle = '#000000'; for (let y = 8; y < H; y += 16) c.fillRect(0, y, W, 2); c.globalAlpha = 1;
    c.fillStyle = '#f4f2ee'; c.fillRect(58, 38, 140, 104); c.fillStyle = glass; c.fillRect(66, 46, 124, 88);
    c.fillStyle = '#f4f2ee'; c.fillRect(126, 46, 5, 88); c.globalAlpha = .45; c.fillStyle = '#ffffff'; c.fillRect(76, 50, 14, 80); c.globalAlpha = 1;
    c.fillStyle = '#e9e4da'; c.fillRect(50, 142, 156, 9); c.fillStyle = '#efe9df'; c.fillRect(0, 244, W, 12);
  })));
}
// 간판: 햇살빌라 (크림 판에 밤색 글씨)
function signTex() {
  return TEX.get('vr3sign', () => canvasTex(512, 144, (c, W, H) => {
    c.fillStyle = '#f6efe2'; c.fillRect(0, 0, W, H); c.strokeStyle = '#8a5a3c'; c.lineWidth = 8; c.strokeRect(6, 6, W - 12, H - 12);
    c.fillStyle = '#7a4a30'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 74px sans-serif'; c.fillText('햇살빌라', W / 2, 64);
    c.font = 'bold 26px sans-serif'; c.fillStyle = '#b07a52'; c.fillText('SUNNY VILLA', W / 2, 116);
  }));
}
// 옥상문 안내판
function noteTex() {
  return TEX.get('vr3note', () => canvasTex(256, 128, (c, W, H) => {
    c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, W, H); c.fillStyle = '#d8473b'; c.fillRect(0, 0, W, 30);
    c.fillStyle = '#ffffff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('옥상 출입문', W / 2, 16);
    c.fillStyle = '#3a3048'; c.font = 'bold 22px sans-serif'; c.fillText('문을 꼭', W / 2, 62); c.fillText('닫아 주세요', W / 2, 96);
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
  // 계단: 북쪽 벽 따라, 앞(BX)에서 시작해 뒤로 오름 — 꽉 찬 단, 논슬립 줄
  const SW = .66, sz = -NZ0 + SW / 2, n = 7, R = .135, TR = .15;
  for (let k = 0; k < n; k++) {
    const x = BX - .15 - TR / 2 - k * TR, h = R * (k + 1);
    add(G.pbox(TR, h, SW), '#ddd6ca', x, y0 + h / 2, sz); add(G.pbox(.03, .012, SW - .04), '#4f4c55', x + TR / 2 - .02, y0 + h + .006, sz);
  }
  const ly = y0 + R * n, lx0 = NX, lx1 = BX - .15 - n * TR;
  add(G.pbox(lx1 - lx0, R * n, SW), '#ddd6ca', (lx0 + lx1) / 2, y0 + R * n / 2, sz);
  add(G.pbox(.02, R * n + .02, SW + .02), '#cfc6b8', (lx0 + lx1) / 2 - (lx1 - lx0) / 2 + .01, y0 + R * n / 2, sz);
  // 손잡이 (계단 열린 쪽)
  const hz = sz + SW / 2 + .02, hb = [BX - .2, y0 + R + .55, hz], ht = [lx1 + .02, ly + .55, hz];
  tube(hb, ht, .016, '#d9dde3', 6); tube([lx1 + .02, ly + .55, hz], [lx0 + .1, ly + .55, hz], .016, '#d9dde3', 6);
  for (let k = 0; k < 4; k++) { const t = k / 3, x = hb[0] + (ht[0] - hb[0]) * t, y = hb[1] + (ht[1] - hb[1]) * t; tube([x, y - .55 + R * .5, hz], [x, y, hz], .01, '#c9ced6', 5); }
  // 층계참 화분, 소화기
  add(G.cyl(.09, .07, .16, 10), POT, NX + .25, ly + .08, sz); for (let m = 0; m < 6; m++) add(G.sph(.07, 7, 5), m % 2 ? LEAF : LEAF2, NX + .25 + Math.cos(m * 1.1) * .06, ly + .24 + (m % 3) * .04, sz + Math.sin(m * 1.1) * .06);
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
    // 작은 차(하늘색) — 필로티에 앞을 길로
    const CX = -1.92, CZ = 1.55;
    add(G.box(1.08, .4, 2.15, .12), '#a9cfe2', CX, Y0 + .38, CZ); add(G.box(.94, .34, 1.15, .12), '#56697b', CX, Y0 + .72, CZ - .12);
    add(G.box(.96, .06, 1.02, .03), '#a9cfe2', CX, Y0 + .9, CZ - .14);
    for (const s of [-1, 1]) { add(G.box(.02, .26, .5, .01), '#a9cfe2', CX + s * .47, Y0 + .72, CZ - .1); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { add(G.cyl(.17, .17, .14, 16), '#33303a', CX + sx * .5, Y0 + .17, CZ + sz * .66, 0, 0, HP); add(G.cyl(.08, .08, .15, 10), '#c9ccd1', CX + sx * .5, Y0 + .17, CZ + sz * .66, 0, 0, HP); }
    for (const s of [-1, 1]) add(G.sph(.07, 10, 8), '#fff6d8', CX + s * .36, Y0 + .42, CZ + 1.07, 0, 0, 0, [1, .8, .5]);
    add(G.box(1.1, .1, .08, .03), '#e8e6e2', CX, Y0 + .24, CZ + 1.08); add(G.pbox(.3, .08, .01), '#ffffff', CX, Y0 + .34, CZ + 1.1);
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
    // 도시가스: E 면 앞쪽 세로관(노랑) + 층마다 가지와 계량기, 1층 아래 굵은 관
    const gz = 1.0;
    tube([BX + .08, Y0 + .25, gz], [BX + .08, -FH + .5, gz], .03, GAS, 8);
    for (const fy of [-2 * FH, -FH]) {
      tube([BX + .08, fy + .5, gz], [BX + .08, fy + .5, gz - .55], .022, GAS, 6); tube([BX + .08, fy + .5, gz - .55], [BX + .02, fy + .5, gz - .55], .022, GAS, 6);
      add(G.box(.12, .2, .2, .02), '#d9dbe0', BX + .1, fy + .32, gz - .3); add(G.pbox(.01, .07, .1), '#9aa0aa', BX + .165, fy + .34, gz - .3);
    }
    tube([BX + .08, Y0 + .25, gz], [BX + .08, Y0 + .25, gz + .9], .03, GAS, 8);
    for (let y = Y0 + .6; y < -FH; y += .9) add(G.pbox(.06, .03, .1), STEEL, BX + .05, y, gz);
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
          windowOn(A, glass, face, .4, wy - .05, .62, .5, { glass: fl ? 2 : 3, sill: true });
          A(G.box(.24, .24, .08, .02), '#d9dbe0', .95, wy + .25, .04); A(G.box(.2, .04, .14, .01), '#d9dbe0', .95, wy + .13, .09);
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
    // 간판 받침 쇠
    add(G.box(1.46, .46, .04, .01), '#8a5a3c', BX + .02, -.48, -.35, 0, HP, 0);
  }));
  // 창 유리 (안쪽 커튼·블라인드가 비치는 그림, 종류마다 한 덩어리)
  glass.forEach((list, v) => {
    if (!list.length) return;
    f.add(tm('villa-glass' + v + '|' + list.length, glassTex(v), ({ add }) => { for (const [w, h, x, y, z, ry] of list) add(new THREE.PlaneGeometry(w, h), x, y, z, 0, ry, 0); }, '#ffffff', { ownUV: true }));
  });
  // 햇살빌라 간판 (E 면 3층 위)
  f.add(put(mesh(geo('vr3sign', () => new THREE.PlaneGeometry(1.38, .39)), mat('#ffffff', { map: signTex(), rim: 0 })), BX + .046, -.48, -.35, 0, HP, 0));
  // 방수 바닥 한 장
  f.add(put(mesh(geo('vr3roof', () => new THREE.PlaneGeometry(PX * 2, PZ * 2)), mat('#ffffff', { map: roofTex(), rim: 0 }), { cast: false }), 0, .003, 0, -HP, 0, 0));
  f.spot('behind', null, -PX + .35, 0, PZ - .25, { maxH: .35, label: '난간 구석', scale: .75 });
};

// ── 동네 (대략): 낮은 이웃 빌라 옥상들, 길·인도·골목, 전봇대·가로수·세워 둔 차 ───────────────────────────────────────────────
// [x0, x1, z0, z1, 층 수, 벽 색 번호, 옥상 소품 seed]
// 이웃 집 터: 4.6 m 네모 집들이 .8 m 골목을 두고 격자로 — 우리 집·길·인도·멀리 파출소 자리는 비움. 가까운 집은 1층(세 카메라 어느 쪽에서도
// 우리 빌라 앞을 가리지 않게), 먼 집은 1~2층: 우리 옥상(3층)에서 옥상들이 내려다보이는 동네
const NB = (() => {
  const out = [], hit = (a, b) => a[0] < b[1] && a[1] > b[0] && a[2] < b[3] && a[3] > b[2];
  const keep = [[-5.0, 4.92, -4.6, 4.42], [3.52, 10.4, -40, 40], [-40, 40, 3.02, 9.9], [-14.2, -9.4, -17.4, -12.2]];
  let sd = 1;
  const XS = [], ZS = [];
  for (let k = -4; k <= 3; k++) { const a = -9.8 + k * 5.4, c = 10.4 + k * 5.4; if (a + 4.6 <= 3.52) XS.push(a); if (c >= 10.4) XS.push(c); }
  for (let k = -4; k <= 3; k++) { const a = -9.3 + k * 5.4, c = 9.9 + k * 5.4; if (a + 4.6 <= 3.02) ZS.push(a); if (c >= 9.9) ZS.push(c); }
  for (const x0 of XS) for (const z0 of ZS) {
    if (Math.max(Math.abs(x0 + 2.3), Math.abs(z0 + 2.3)) > 27) continue;
    const L = [x0, x0 + 4.6, z0, z0 + 4.6]; if (keep.some(k => hit(L, k))) continue;
    const cx = x0 + 2.3, cz = z0 + 2.3, dist = Math.max(Math.abs(cx), Math.abs(cz)), h = (sd * 7 + 3) % 5;
    const fl = dist < 12 ? 1 : dist < 16 && (cx > 8 || cz > 8) ? 1 : 1 + (h > 1 ? 1 : 0);
    out.push([...L, fl, sd % 3, sd]); sd++;
  }
  return out;
})();
// (사용자 승인 방향 10/23: 배경은 하얀 단순한 동네 — ⑦이 공용으로 만드는 중이라 지금은 단순하게; 멀리 다음 판 21판 파출소가 작게)
const NBWALL = ['#f8f8f7', '#f3f4f3', '#fbfbfa'], NBGLASS = '#d3dde2', NBROOF = '#e9ecea', NBCAP = '#fcfcfb';
B.vr3_town = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [100, 100, 100, 100.01, 100.01, 100.01];
  const Y0 = -DROP, SW = 1.4, RD = 4, CURB = .1;
  // 땅 (옅은 베이지 바탕)
  f.add(put(mesh(geo('vr3ground', () => new THREE.PlaneGeometry(70, 70)), mat('#eff0ef', { rim: 0 }), { cast: false }), 0, Y0 - .02, 0, -HP, 0, 0));
  // 아스팔트: 앞(+z) 길, 옆(+x) 길, 교차로
  f.add(tm('town-asph', asphaltTex(), ({ add }) => {
    add(G.pbox(40, .02, RD), -2, Y0, BZ + SW + RD / 2); add(G.pbox(RD, .02, 40), BX + SW + RD / 2, Y0, -2);
  }, '#ffffff', { s: 2 }));
  // 보도블럭 인도 (턱 .1): 우리 집 앞·옆, 길 건너편
  f.add(tm('town-pave', paveTex(), ({ add }) => {
    add(G.pbox(40, CURB, SW), -2, Y0 + CURB / 2, BZ + SW / 2 + .001);
    add(G.pbox(SW, CURB, 40), BX + SW / 2 + .001, Y0 + CURB / 2, -2 - .0);
    add(G.pbox(40, CURB, SW), -2, Y0 + CURB / 2, BZ + SW + RD + SW / 2);
    add(G.pbox(SW, CURB, 40), BX + SW * 1.5 + RD, Y0 + CURB / 2, -2);
  }, '#ffffff', { s: 1 }));
  // 골목 콘크리트 (뒤·왼쪽) — 우리 집과 이웃 사이
  f.add(tm('town-conc', concTex(), ({ add }) => {
    add(G.pbox(30, .01, 1.58), -5, Y0 + .005, -BZ - .79); add(G.pbox(1.48, .01, 30), -BX - .74, Y0 + .005, 0);
    add(G.pbox(BX * 2, .012, BZ), 0, Y0 + .006, BZ / 2);
  }, '#ffffff', { s: 2 }));
  // 이웃 벽 (층 칸 맞춘 창 그림), 색마다 한 덩어리
  for (let v = 0; v < 3; v++) {
    const list = NB.filter(n => n[5] === v);
    f.add(tm('town-nb' + v, nbTex(NBWALL[v], NBGLASS), ({ add }) => {
      for (const [x0, x1, z0, z1, fl] of list) add(G.pbox(x1 - x0, fl * FH, z1 - z0), (x0 + x1) / 2, Y0 + fl * FH / 2, (z0 + z1) / 2, 0, 0, 0, 1, g => {
        const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
        for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), az = Math.abs(n.getZ(i));
          uv[i * 2] = (ax > az ? p.getZ(i) - z0 : p.getX(i) - x0) / 2.3; uv[i * 2 + 1] = (p.getY(i) - Y0) / FH; }
        g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
      });
    }, '#ffffff', { custom: true }));
  }
  f.add(mc('vr3-town', ({ add, tube }) => {
    // 연석 (인도 가장자리, 회색 턱)
    add(G.pbox(40, CURB + .02, .12), '#c8c3bb', -2, Y0 + CURB / 2, BZ + SW); add(G.pbox(.12, CURB + .02, 40), '#c8c3bb', BX + SW, Y0 + CURB / 2, -2);
    add(G.pbox(40, CURB + .02, .12), '#c8c3bb', -2, Y0 + CURB / 2, BZ + SW + RD); add(G.pbox(.12, CURB + .02, 40), '#c8c3bb', BX + SW + RD, Y0 + CURB / 2, -2);
    // 길 가장자리 흰 선, 가운데 노란 선(점선), 횡단보도
    for (let x = -20; x < 18; x += 1.4) add(G.pbox(.8, .005, .08), '#f6e7a0', x, Y0 + .012, BZ + SW + RD / 2);
    for (let z = -20; z < 18; z += 1.4) add(G.pbox(.08, .005, .8), '#f6e7a0', BX + SW + RD / 2, Y0 + .012, z);
    for (let k = 0; k < 7; k++) add(G.pbox(.3, .005, 1.6), '#f7f6f2', BX + SW + .45 + k * .52, Y0 + .012, BZ + SW + RD + .1 - 1.0 + 1.2);
    // 이웃 옥상: 초록 방수 바닥, 낮은 난간 갓돌, 물탱크·옥탑·안테나·빨래 건조대·화분
    for (const [x0, x1, z0, z1, fl, , sd] of NB) {
      const top = Y0 + fl * FH, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0, R = rng(sd * 31 + 7);
      add(G.pbox(w - .3, .02, d - .3), NBROOF, cx, top + .01, cz);
      add(G.pbox(w, .3, .16), NBCAP, cx, top + .15, z0 + .08); add(G.pbox(w, .3, .16), NBCAP, cx, top + .15, z1 - .08);
      add(G.pbox(.16, .3, d), NBCAP, x0 + .08, top + .15, cz); add(G.pbox(.16, .3, d), NBCAP, x1 - .08, top + .15, cz);
      add(G.pbox(w + .04, .1, d + .04), '#eeebe5', cx, top - .05, cz);
      if (sd % 3 === 0) { const tx = x0 + 1 + R() * (w - 2), tz = z0 + .9 + R() * 1.0;
        add(G.cyl(.42, .42, .75, 16), '#f3dc9a', tx, top + .5, tz); add(G.sph(.42, 16, 6), '#f3dc9a', tx, top + .88, tz, 0, 0, 0, [1, .3, 1]); add(G.pbox(.9, .12, .9), '#e3e3df', tx, top + .08, tz); }
      if (sd % 4 === 2) { const hx = x1 - 1.3, hz = z0 + 1.1; add(G.pbox(1.8, 1.5, 1.5), '#f4f1ec', hx, top + .75, hz); add(G.pbox(2.0, .1, 1.7), '#e9e6e0', hx, top + 1.55, hz); }
    }
    // 멀리 다음 판(21판) 동네 파출소, 작게: 흰 타일 단층, 파란 띠, 둥근 모서리 탑 위 빨강·파랑 경광등, 지붕 위 파란 간판, 앞 유리문
    { const qx = -11.8, qz = -14.8, qw = 3.6, qd = 2.8, qh = 1.7, tx = qx + qw / 2 - .25, tz = qz + qd / 2 - .25;
      add(G.box(qw, qh, qd, .05), '#fbfbf8', qx, Y0 + qh / 2, qz); add(G.pbox(qw + .02, .18, qd + .02), '#4f7fc4', qx, Y0 + qh - .38, qz);
      add(G.pbox(qw + .12, .09, qd + .12), '#e6ebf2', qx, Y0 + qh + .045, qz);
      add(G.cyl(.6, .6, 2.5, 22), '#fbfbf8', tx, Y0 + 1.25, tz); add(G.cyl(.615, .615, .18, 22), '#4f7fc4', tx, Y0 + qh - .38, tz);
      add(G.cyl(.66, .66, .08, 22), '#e6ebf2', tx, Y0 + 2.54, tz); add(G.cyl(.22, .26, .14, 14), '#d9dde3', tx, Y0 + 2.65, tz);
      add(G.sph(.17, 12, 8), '#ff5a5a', tx - .14, Y0 + 2.8, tz, 0, 0, 0, [1, 1.2, 1]); add(G.sph(.17, 12, 8), '#4f86ff', tx + .14, Y0 + 2.8, tz, 0, 0, 0, [1, 1.2, 1]);
      add(G.box(1.7, .42, .1, .03), '#3f6fb5', qx - .5, Y0 + qh + .32, qz + qd / 2 - .3); add(G.pbox(1.3, .1, .012), '#ffffff', qx - .5, Y0 + qh + .34, qz + qd / 2 - .244);
      add(G.pbox(.9, 1.1, .03), '#bcd6e6', qx - .6, Y0 + .55, qz + qd / 2 + .01); add(G.pbox(.06, 1.1, .04), '#4f7fc4', qx - .6, Y0 + .55, qz + qd / 2 + .02);
      for (const x of [qx + .5, qx - 1.4]) add(G.pbox(.6, .5, .03), '#c9dbe6', x, Y0 + 1.0, qz + qd / 2 + .01);
      add(G.box(.36, .16, .05, .02), '#4f7fc4', qx - .6, Y0 + 1.22, qz + qd / 2 + .04); }
    // 가로수 둘 (인도), 전봇대 넷과 전선
    for (const [x, z, s] of [[-2.6, BZ + .7, 1], [-7.5, BZ + SW + RD + .7, 1.1]]) {
      add(G.box(.42, .06, .42, .01), '#a69f94', x, Y0 + CURB + .03, z); tube([x, Y0 + CURB, z], [x, Y0 + 1.6 * s, z], .07 * s, '#8a6a4f', 6);
      for (let k = 0; k < 6; k++) { const a = k * 1.1; add(G.sph(.55 * s, 10, 8), k % 2 ? '#a9d69a' : '#93c98a', x + Math.cos(a) * .35 * s, Y0 + (2.0 + (k % 3) * .3) * s, z + Math.sin(a) * .35 * s); }
    }
    const poles = [[BX + .45, BZ + SW - .25], [-3.3, BZ + SW - .25], [BX + SW - .25, -4.0], [BX + SW + RD + .3, BZ + SW + RD + .3]];
    for (const [x, z] of poles) { tube([x, Y0 + CURB, z], [x, Y0 + 4.6, z], .09, '#c9c4ba', 8); add(G.pbox(.9, .08, .08), '#8c939e', x, Y0 + 4.3, z, 0, PI / 4, 0); add(G.cyl(.14, .14, .4, 12), '#a3adb8', x + .18, Y0 + 3.8, z); }
    for (const [i, j] of [[0, 1], [0, 2], [0, 3]]) for (const dy of [4.3, 4.05]) {
      const [ax, az] = poles[i], [bx, bz] = poles[j]; let prev = null;
      for (let k = 0; k <= 8; k++) { const t = k / 8, p = [ax + (bx - ax) * t, Y0 + dy - Math.sin(t * PI) * .35, az + (bz - az) * t]; if (prev) tube(prev, p, .012, '#4a4458', 3); prev = p; }
    }
    // 길에 세워 둔 차 하나(흰색)
    const cx = -5.2, cz = BZ + SW + .7;
    add(G.box(2.15, .4, 1.08, .12), '#f2f1ec', cx, Y0 + .38, cz); add(G.box(1.15, .34, .94, .12), '#56697b', cx + .12, Y0 + .72, cz); add(G.box(1.02, .06, .96, .03), '#f2f1ec', cx + .14, Y0 + .9, cz);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.cyl(.17, .17, .14, 14), '#33303a', cx + sx * .66, Y0 + .17, cz + sz * .5, HP, 0, 0);
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

export const VR3_BUILDERS = B;
export const VR3_INFO = {
  vr3_villa: { w: 7, d: 6, name: '햇살빌라 몸통과 옥상', hidden: true, floor: true },
  vr3_town: { w: 7, d: 6, name: '햇살빌라 동네', hidden: true, floor: true },
  vr3_stairhut: { w: 2, d: 2, name: '계단실과 물탱크', hidden: true },
};

// 18판 새 안 '너굴이네 게임기 집' otakuloft3 (① 10/23 — 사용자 "다시 맵 디자인 해 줄래? … 새로 디테일 있게"; 레퍼 캠핑카·정비소 단면·버거 가게):
// 너굴이 오타쿠 집을 거대 레트로 게임기 모양으로 자른 2층 단면. 모티프 다섯만 —
//   ① 뒷벽 = 거대 휴대용 게임기 앞면(둥근 위 모서리·두꺼운 테): 화면 = 큰 비 오는 창, 십자 버튼 = 십자 창, A·B = 둥근 창, 꼭대기에 꽂힌 카트리지
//   ② 옆벽 = 세워 둔 거대 카트리지(비스듬히 깎인 앞 모서리·손잡이 홈·커다란 라벨), 그 안쪽에 현관문
//   ③ 컨트롤러 모양 소파(ol3_padsofa)와 카트리지 모양 책장(ol3_cartshelf) — 방 안의 거대 소품
//   ④ 둥근 작은 섬 바닥: 젖은 보도, 웅덩이 셋(빗물 동그라미), 가로등 하나, 뒤집어 둔 노란 우산
//   ⑤ 옛 18판의 빨강 오락기·만화책장·다락 이불·빨래 건조대·러그·빈백(이건 stages 쪽 배치, 우리 모델 그대로)
// 벽은 방의 벽이 아니라 이 바탕 조각(ol3_shell)이 짓고, 카메라 쪽으로 온 벽은 방 벽처럼 무릎 높이로 접힌다(updateView — 21판 파출소 방식).
// 바탕은 걷기·자리 차지가 없다(noSolid·noOccupied, 26판 바탕처럼).
import * as THREE from 'three';
import { put, grp, mat, mesh, canvasTex, shade } from './kit.js';
import { HG as G, hmc as mc } from './house-props.js';

const PI = Math.PI, HP = PI / 2;
// 큰 면은 순하게(옅은 라일락 회색·따뜻한 회색), 작은 것만 포인트 색
const SHELL = '#cdc6e4', RIM = '#e6e0f4', SHELLD = '#a99fc8', BEZEL = '#55536e', INKY = '#3e3b55', BERRY = '#d65d74',
  CART = '#d9d3c9', CARTD = '#bfb7ab', CARTRIM = '#ece7de', CORAL = '#e8705f', CREAM = '#fff4e2', WAIN = '#bdb4d8',
  PAVE = '#9aa0b5', PAVED = '#7d8399', CURB = '#c9ccd6', EARTH = '#6f6680', EARTHD = '#5a5269', LEAF = '#6cb86a', LEAF2 = '#4f9c5a',
  POLE = '#3f5a5a', WARM = '#ffd98a', WOODD = '#9c6a42';
const B = {};
const basic = (tex, tint = '#ffffff') => { const m = new THREE.MeshBasicMaterial({ map: tex, color: tint }); m.toneMapped = false; return m; };
const rnd = s => { let a = s * 9301 + 49297; return () => ((a = (a * 9301 + 49297) % 233280) / 233280); };

// ── 2D 모양 도우미 ─────────────────────────────────────────────────────────────────────────────────────────
// 둥근 네모 (모서리마다 반지름 [아래왼, 아래오, 위오, 위왼]); holes용 Path도 같은 길로
const rrect = (P, x0, y0, x1, y1, r) => {
  const [a, b, c, d] = Array.isArray(r) ? r : [r, r, r, r];
  P.moveTo(x0 + a, y0); P.lineTo(x1 - b, y0); if (b) P.absarc(x1 - b, y0 + b, b, -HP, 0, false);
  P.lineTo(x1, y1 - c); if (c) P.absarc(x1 - c, y1 - c, c, 0, HP, false);
  P.lineTo(x0 + d, y1); if (d) P.absarc(x0 + d, y1 - d, d, HP, PI, false);
  P.lineTo(x0, y0 + a); if (a) P.absarc(x0 + a, y0 + a, a, PI, PI * 1.5, false);
  return P;
};
const cross = (P, cx, cy, L, w) => {
  const h = L / 2, t = w / 2;
  [[-t, h], [t, h], [t, t], [h, t], [h, -t], [t, -t], [t, -h], [-t, -h], [-t, -t], [-h, -t], [-h, t], [-t, t]].forEach(([x, y], i) => i ? P.lineTo(cx + x, cy + y) : P.moveTo(cx + x, cy + y));
  P.closePath(); return P;
};
const circle = (P, cx, cy, r) => { P.moveTo(cx + r, cy); P.absarc(cx, cy, r, 0, PI * 2, false); return P; };
// 위가 둥근 벽 테두리(ㄷ자를 뒤집은 띠): 바깥 둥근 모서리 r, 띠 두께 t — 바닥 쪽은 열림
const archBand = (x0, x1, H, r, t) => {
  const s = new THREE.Shape();
  s.moveTo(x0, 0); s.lineTo(x0, H - r); s.absarc(x0 + r, H - r, r, PI, HP, true); s.lineTo(x1 - r, H); s.absarc(x1 - r, H - r, r, HP, 0, true); s.lineTo(x1, 0);
  s.lineTo(x1 - t, 0); s.lineTo(x1 - t, H - r); s.absarc(x1 - r, H - r, r - t, 0, HP, false); s.lineTo(x0 + r, H - t); s.absarc(x0 + r, H - r, r - t, HP, PI, false); s.lineTo(x0 + t, 0);
  s.closePath(); return s;
};
const ext = (shape, depth, curve = 12) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: curve });

// ── 그림 ────────────────────────────────────────────────────────────────────────────────────────────────
let PAPER = null, RAIN = null, LABEL = null, TOPLABEL = null, LOGO = null, TILES = null;
// 벽지: 옅은 라일락 크림에 가는 세로 줄과 작은 픽셀 십자 (1.2 m 한 장)
const paperTex = () => PAPER || (PAPER = (() => {
  const t = canvasTex(256, 256, (c, W, H) => {
    c.fillStyle = '#f1eaf2'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#e8deeb'; for (let x = 0; x < W; x += 64) c.fillRect(x + 28, 0, 8, H);
    c.fillStyle = '#d9cbe4'; for (let y = 16; y < H; y += 64) for (let x = 0; x < W; x += 64) { const ox = (y / 64 % 2) * 32 + 8; c.fillRect(x + ox + 3, y, 3, 9); c.fillRect(x + ox, y + 3, 9, 3); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 1.2, 1 / 1.2); return t;
})());
// 비 오는 밤 유리: 남색 하늘, 먼 동네 불빛, 빗줄기와 물방울 (2 m 한 장)
const rainTex = () => RAIN || (RAIN = (() => {
  const t = canvasTex(256, 256, (c, W, H) => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#26305a'); g.addColorStop(1, '#3c4a7c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const r = rnd(5);
    for (let i = 0; i < 10; i++) { const x = i * 27 - 4, h = 40 + r() * 70; c.fillStyle = '#1b2244'; c.fillRect(x, H - h, 23, h); for (let k = 0; k < 8; k++) if (r() < .45) { c.fillStyle = r() < .6 ? '#ffd98a' : '#9fd8ff'; c.fillRect(x + 4 + (k % 3) * 6, H - h + 8 + Math.floor(k / 3) * 12, 4, 5); } }
    c.globalAlpha = .3; c.fillStyle = '#ffffff'; for (let i = 0; i < 80; i++) c.fillRect(r() * W, r() * H, 1, 10 + r() * 14); c.globalAlpha = 1;
    for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, s = 2 + r() * 3; c.fillStyle = 'rgba(220,235,255,.5)'; c.beginPath(); c.arc(x, y, s, 0, PI * 2); c.fill(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 2, 1 / 2); return t;
})());
// 옆벽 카트리지 라벨: 게임 표지 — 밤하늘·별·빌딩 위로 뛰는 너구리 실루엣, 제목 띠
const labelTex = () => LABEL || (LABEL = canvasTex(384, 256, (c, W, H) => {
  c.fillStyle = CREAM; c.fillRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a4a8a'); g.addColorStop(1, '#7a6fb8'); c.fillStyle = g; c.fillRect(14, 14, W - 28, H - 70);
  c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(300, 60, 26, 0, PI * 2); c.fill(); c.fillStyle = '#3a4a8a'; c.beginPath(); c.arc(312, 52, 22, 0, PI * 2); c.fill();
  const r = rnd(3); c.fillStyle = '#ffffff'; for (let i = 0; i < 24; i++) c.fillRect(20 + r() * (W - 40), 20 + r() * 90, 3, 3);
  c.fillStyle = '#2a2f5c'; [[14, 120, 60], [70, 100, 50], [118, 130, 70], [190, 110, 60], [252, 140, 50], [300, 120, 70]].forEach(([x, y, w]) => c.fillRect(x, y, w, H - 56 - y));
  c.fillStyle = '#ffd98a'; for (let i = 0; i < 18; i++) c.fillRect(24 + (i * 19) % 330, 150 + (i * 7) % 40, 6, 7);
  // 뛰는 너구리 (덩어리만): 몸·머리·귀·줄무늬 꼬리
  c.fillStyle = '#8a7f9a'; c.beginPath(); c.ellipse(170, 96, 30, 20, -.2, 0, PI * 2); c.fill(); c.beginPath(); c.arc(206, 78, 17, 0, PI * 2); c.fill();
  c.beginPath(); c.moveTo(196, 64); c.lineTo(200, 50); c.lineTo(208, 62); c.fill(); c.beginPath(); c.moveTo(210, 62); c.lineTo(218, 50); c.lineTo(220, 66); c.fill();
  c.fillStyle = '#3b3550'; c.beginPath(); c.ellipse(210, 80, 11, 6, 0, 0, PI * 2); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(205, 77, 3, 3); c.fillRect(213, 77, 3, 3);
  for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? '#3b3550' : '#8a7f9a'; c.beginPath(); c.ellipse(134 - k * 11, 104 + k * 6, 9, 7, .5, 0, PI * 2); c.fill(); }
  c.fillStyle = CORAL; c.fillRect(14, H - 50, W - 28, 36);
  c.fillStyle = '#ffffff'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('너굴 퀘스트 2', W / 2, H - 32);
}));
// 꼭대기 카트리지 라벨
const topLabelTex = () => TOPLABEL || (TOPLABEL = canvasTex(192, 128, (c, W, H) => {
  c.fillStyle = CREAM; c.fillRect(0, 0, W, H); c.fillStyle = '#7fc6d9'; c.fillRect(10, 10, W - 20, H - 44);
  c.fillStyle = '#ffe14d'; c.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 11 : 26, a = -HP + i * PI / 5; c.lineTo(W / 2 + Math.cos(a) * rr, 46 + Math.sin(a) * rr); } c.fill();
  c.fillStyle = '#3e3b55'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('너굴 랜드', W / 2, H - 18);
}));
// 화면 아래 이름표
const logoTex = () => LOGO || (LOGO = canvasTex(256, 64, (c, W, H) => {
  c.fillStyle = BEZEL; c.fillRect(0, 0, W, H);
  c.fillStyle = '#e6e0f4'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('너굴 BOY', W / 2 - 8, H / 2 + 2);
  c.fillStyle = BERRY; c.beginPath(); c.arc(W - 22, H / 2, 7, 0, PI * 2); c.fill();
}));
// 젖은 보도블록 (1.5 m 한 장)
const tileTex = () => TILES || (TILES = (() => {
  const t = canvasTex(256, 256, (c, W, H) => {
    c.fillStyle = PAVE; c.fillRect(0, 0, W, H);
    const r = rnd(11);
    for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64) { c.fillStyle = shade(PAVE, -.05 + r() * .08); c.fillRect(x + ((y / 64) % 2) * 32 + 2, y + 2, 60, 60); }
    c.strokeStyle = PAVED; c.lineWidth = 3; for (let y = 0; y <= H; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); for (let x = ((y / 64) % 2) * 32; x <= W; x += 64) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 64); c.stroke(); } }
    c.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 30; i++) c.fillRect(r() * W, r() * H, 18, 2);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 1.5, 1 / 1.5); return t;
})());

// ── 크기 (방 7 × 6 m, 바닥 y 0, 가운데가 원점) ─────────────────────────────────────────────────────────────
const RW = 7, RD = 6;
const NX0 = -3.84, NX1 = 3.72, NH = 4.5, NR = 1.15, NT = .34, NZ = -RD / 2;           // 뒷벽 게임기
const WX = -RW / 2, WT = .3, WH = 3.3, WZ0 = -RD / 2, WZ1 = RD / 2 + .12;               // 옆벽 카트리지 (z 범위)
const SCREEN = [-1.2, 2.75, 1.9, 4.0], DPAD = [-2.9, 3.35], BTN = [[2.5, 2.85, .27], [3.12, 3.22, .27]];
const DOOR = { z: 2.47, w: .86, h: 2.02 };
// 섬: 둥근 네모(뒤 모서리 1.5, 앞 모서리 2.2), 윗면 y ISY
const IS = { x0: -4.3, x1: 5.0, z0: -3.8, z1: 4.6, rb: 1.5, rf: 2.2 }, ISY = -.14;
const islandShape = (inset = 0) => {
  // (x, -z)로 그린 뒤 눕힘: 앞(+z)은 아래쪽 y
  const s = new THREE.Shape(), { x0, x1, z0, z1, rb, rf } = IS, i = inset;
  return rrect(s, x0 + i, -z1 + i, x1 - i, -z0 - i, [rf - i, rf - i, rb - i, rb - i]);
};

// 접히는 벽 한 장: 몸(줄어듦)·장식(숨김)·무릎 벽(접혔을 때만)
const foldWall = (f, n, H) => {
  const g = grp(), deco = grp(), knee = grp(); f.add(g); f.add(deco); f.add(knee); knee.visible = false;
  (f.live || (f.live = [])).push(g, deco, knee);
  const q = { g, deco, knee, n: new THREE.Vector3(...n), k: 1, stub: .42 / H };
  (f.ol3Walls || (f.ol3Walls = [])).push(q);
  return q;
};
const tagWall = (o, k) => o.traverse(m => { if (m.isMesh) { m.userData.noMerge = true; m.userData.gptWall = k; m.castShadow = true; m.receiveShadow = true; } });

// ── 바탕: 섬 + 게임기 뒷벽 + 카트리지 옆벽 + 섬 위 소품 ─────────────────────────────────────────────────────────
B.ol3_shell = (f, T) => {
  f.noSolid = true; f.noOccupied = true; f.collideBox = [0, -.3, 0, .001, -.29, .001];
  // 섬 (두 단: 젖은 보도 + 아래 흙 단, 가장자리 연석)
  f.add(mc('ol3-island', ({ add }) => {
    const top = ext(islandShape(), .3, 16); add(top, PAVED, 0, ISY - .3, 0, -HP, 0, 0);
    const low = ext(islandShape(.22), .42, 16); add(low, EARTH, 0, ISY - .72, 0, -HP, 0, 0);
    const foot = ext(islandShape(.42), .14, 16); add(foot, EARTHD, 0, ISY - .86, 0, -HP, 0, 0);
    // 연석 (테두리 띠 — 바깥 모양에서 안쪽을 뺀 고리)
    const ring = islandShape(); ring.holes.push(islandShape(.16)); add(ext(ring, .07, 16), CURB, 0, ISY - .002, 0, -HP, 0, 0);
    // 집 받침: 게임기 아래 테 (바닥 둘레에 얇게 보이는 몸 색)
    add(G.box(NX1 - NX0, .16, WZ1 - NZ + NT, .04), SHELLD, (NX0 + NX1) / 2, -.08 - .002, (NZ - NT + WZ1) / 2);
    // 잔디 몇 줌 (연석 안쪽, 뒤·옆)
    for (const [x, z, n] of [[-4.0, -.6, 5], [-3.95, 1.4, 4], [4.6, -1.7, 5], [4.75, .2, 4], [-2.6, -3.5, 4], [2.2, -3.55, 5], [4.3, 2.9, 4]]) {
      for (let k = 0; k < n; k++) { const a = k * 2.3; add(G.sph(.09 + (k % 3) * .02, 8, 6), k % 2 ? LEAF : LEAF2, x + Math.cos(a) * .09, ISY + .04 + (k % 2) * .03, z + Math.sin(a) * .07, 0, 0, 0, [1.1, .8, 1]); }
    }
    // 맨홀 뚜껑
    add(G.cyl(.32, .32, .02, 24), '#6d7286', 4.2, ISY + .01, 2.6); add(G.tor(.32, .025, PI * 2, 4, 24), '#5b6074', 4.2, ISY + .02, 2.6, HP, 0, 0);
    for (let k = -2; k <= 2; k++) add(G.box(.5 - Math.abs(k) * .1, .012, .03, .004), '#5b6074', 4.2, ISY + .025, 2.6 + k * .1);
  }));
  // 보도블록 무늬 (윗면에 얇게)
  { const g = new THREE.ShapeGeometry(islandShape(.16), 16); const m = mesh(g, mat('#ffffff', { map: tileTex(), rough: .5, rim: .1 }), { cast: false }); put(m, 0, ISY + .002, 0, -HP, 0, 0); m.userData.floor = true; f.add(m); }
  // 웅덩이 셋: 짙은 물, 밝은 테, 빗물 동그라미, 가로등 빛 반사 한 줄
  f.add(mc('ol3-puddles', ({ add }) => {
    for (const [x, z, rx, rz, a] of [[4.3, .6, .5, .3, .3], [1.3, 3.95, .62, .34, -.1], [-.55, 4.15, .42, .26, .2]]) {
      add(G.cyl(1, 1, .01, 28), '#4b5680', x, ISY + .008, z, 0, a, 0, [rx, 1, rz]);
      add(G.cyl(1, 1, .006, 28), '#6c78a6', x, ISY + .006, z, 0, a, 0, [rx + .05, 1, rz + .04]);
      for (const [dx, dz, r] of [[-.12, .02, .08], [.14, -.05, .05]]) add(G.tor(r, .006, PI * 2, 3, 18), '#a9b6e0', x + dx, ISY + .016, z + dz, HP, 0, 0);
      add(G.box(rx * .9, .004, .035, .002), '#ffe2a6', x, ISY + .016, z + rz * .2, 0, a + .05, 0);
    }
  }));
  // 가로등 (앞 왼쪽 모퉁이): 짙은 청록 기둥, 굽은 팔, 따뜻한 등
  f.add(mc('ol3-lamp', ({ add, tube }) => {
    const x = -2.4, z = 4.0;
    add(G.cyl(.16, .2, .14, 12), POLE, x, ISY + .07, z); add(G.cyl(.05, .065, 2.5, 10), POLE, x, ISY + 1.32, z);
    tube([x, ISY + 2.55, z], [x + .18, ISY + 2.78, z - .06], .045, POLE, 8); tube([x + .18, ISY + 2.78, z - .06], [x + .5, ISY + 2.8, z - .16], .045, POLE, 8);
    add(G.cone(.2, .16, 12), POLE, x + .55, ISY + 2.74, z - .18); add(G.sph(.1, 10, 8), WARM, x + .55, ISY + 2.62, z - .18);
    add(G.box(.22, .3, .03, .02), '#4f8fb0', x + .02, ISY + 1.85, z + .06); add(G.box(.16, .04, .035, .01), CREAM, x + .02, ISY + 1.92, z + .07); add(G.box(.12, .04, .035, .01), CREAM, x + .02, ISY + 1.82, z + .07);
  }));
  { const b = mesh(new THREE.SphereGeometry(.085, 10, 8), mat(WARM, { emissive: WARM, ei: 1.2 }), { cast: false }); put(b, -1.85, ISY + 2.61, 3.82); f.add(b); }
  // 뒤집어 둔 노란 우산 (빗물 받는 중)
  f.add(mc('ol3-umbrella', ({ add, tube }) => {
    const x = 2.6, z = 3.95;
    // (뒤집힌 갓: 속이 빈 반구는 안쪽 면이 안 그려져 바구니처럼 보였다 — 꽉 찬 깔때기 + 짙은 속 + 살 끝)
    add(G.cyl(.42, .07, .3, 16), '#f5c84c', x, ISY + .17, z, 0, 0, .12); add(G.cyl(.37, .37, .012, 16), '#d9a83a', x + .02, ISY + .32, z, 0, 0, .12);
    for (let k = 0; k < 8; k++) { const a = k * PI / 4; add(G.sph(.025, 6, 4), '#8a5f42', x + Math.cos(a) * .42, ISY + .32 + Math.cos(a) * .05, z + Math.sin(a) * .42); }
    tube([x + .02, ISY + .3, z], [x + .32, ISY + .78, z - .16], .015, '#8a5f42', 6); add(G.tor(.06, .014, PI, 4, 10), '#8a5f42', x + .38, ISY + .78, z - .19, 0, .4, 0);
  }));
  // 다락 뒤쪽 기둥 둘 (벽이 접혀도 다락이 떠 보이지 않게 — 늘 서 있음)
  f.add(mc('ol3-loftposts', ({ add }) => { for (const [x, z] of [[-3.43, -1.07], [-3.43, -2.93], [.43, -2.93]]) add(G.box(.12, 1.42, .12, .03), WOODD, x, .71, z); }));

  // ── 뒷벽: 거대 휴대용 게임기 ───────────────────────────────────────────────────────────────────────────
  const N = foldWall(f, [0, 0, 1], NH);
  {
    const body = new THREE.Shape(); body.moveTo(NX0, 0); body.lineTo(NX1, 0); body.lineTo(NX1, NH - NR); body.absarc(NX1 - NR, NH - NR, NR, 0, HP, false); body.lineTo(NX0 + NR, NH); body.absarc(NX0 + NR, NH - NR, NR, HP, PI, false); body.closePath();
    const holes = () => [rrect(new THREE.Path(), ...SCREEN, .14), cross(new THREE.Path(), DPAD[0], DPAD[1], 1.0, .34), ...BTN.map(([x, y, r]) => circle(new THREE.Path(), x, y, r))];
    body.holes.push(...holes());
    N.g.add(mc('ol3-console', ({ add }) => {
      add(ext(body, NT, 14), SHELL, 0, 0, NZ - NT);
      add(ext(archBand(NX0, NX1, NH, NR, .16), .08, 14), RIM, 0, 0, NZ - .005);
      // 아래 판벽(몸 색 짙게)과 띠
      add(G.box(NX1 - NX0 - .32, .86, .03, .01), WAIN, (NX0 + NX1) / 2, .43, NZ + .015); add(G.box(NX1 - NX0 - .32, .06, .05, .02), RIM, (NX0 + NX1) / 2, .86, NZ + .025);
      add(G.box(NX1 - NX0 - .32, .1, .05, .02), SHELLD, (NX0 + NX1) / 2, .05, NZ + .025);
    }));
    const paper = new THREE.Shape(); rrect(paper, NX0 + .16, .86, NX1 - .16, NH - .16, [0, 0, NR - .16, NR - .16]); paper.holes.push(...holes());
    const pm = mesh(new THREE.ShapeGeometry(paper, 14), mat('#ffffff', { map: paperTex(), rough: .9, rim: .1 }), { cast: false }); put(pm, 0, 0, NZ + .003); N.g.add(pm);
    // 무릎 벽 (접혔을 때)
    N.knee.add(mc('ol3-console-knee', ({ add }) => { add(G.box(NX1 - NX0, .42, NT, .05), SHELL, (NX0 + NX1) / 2, .21, NZ - NT / 2); add(G.box(NX1 - NX0, .05, NT + .04, .02), RIM, (NX0 + NX1) / 2, .42, NZ - NT / 2); }));
    // 장식: 유리(비), 화면 테·이름표·전원 불, 십자·A·B 테, 시작·선택 단추, 어깨 단추, 꽂힌 카트리지
    const gl = (shape, z = NZ - NT * .55) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, 14), basic(rainTex(), '#d8def5')); m.position.z = z; N.deco.add(m); return m; };
    gl(rrect(new THREE.Shape(), ...SCREEN, .14)); gl(cross(new THREE.Shape(), DPAD[0], DPAD[1], 1.0, .34)); for (const [x, y, r] of BTN) gl(circle(new THREE.Shape(), x, y, r));
    N.deco.add(mc('ol3-console-face', ({ add }) => {
      // 화면 테 (짙은 판 — 안쪽은 창)
      const bz = new THREE.Shape(); rrect(bz, SCREEN[0] - .34, SCREEN[1] - .42, SCREEN[2] + .34, SCREEN[3] + .2, .22); bz.holes.push(rrect(new THREE.Path(), ...SCREEN, .14));
      add(ext(bz, .06, 12), BEZEL, 0, 0, NZ + .005);
      add(G.cyl(.045, .045, .03, 12), BERRY, SCREEN[0] - .18, SCREEN[3] - .25, NZ + .07, HP, 0, 0);
      // 창 안쪽 턱(유리 둘레 두께)
      add(G.box(SCREEN[2] - SCREEN[0] - .1, .04, .2, .01), RIM, (SCREEN[0] + SCREEN[2]) / 2, SCREEN[1] + .02, NZ - .08);
      // 십자 버튼 테
      const dp = cross(new THREE.Shape(), DPAD[0], DPAD[1], 1.2, .52); dp.holes.push(cross(new THREE.Path(), DPAD[0], DPAD[1], 1.0, .34)); add(ext(dp, .07, 4), INKY, 0, 0, NZ + .005);
      // A·B 테
      for (const [x, y, r] of BTN) add(G.tor(r + .05, .055, PI * 2, 8, 26), BERRY, x, y, NZ + .04);
      // 시작·선택 (비스듬한 알약)
      for (const x of [.55, 1.15]) add(G.cap(.055, .22, 4, 8), '#8c88a6', x, 2.12, NZ + .04, 0, 0, HP + .35);
      // 스피커 구멍 (오른쪽 아래, 비스듬한 줄)
      for (let k = 0; k < 5; k++) add(G.cap(.03, .26, 3, 6), SHELLD, 2.55 + k * .14, 2.18 - k * .03, NZ + .02, 0, 0, .5);
      // 어깨 단추 L·R (위 모서리를 따라)
      for (const [cx, a0] of [[NX0 + NR, HP + .25], [NX1 - NR, .12]]) add(G.tor(NR + .04, .1, .95, 8, 14), INKY, cx, NH - NR, NZ - NT / 2, 0, 0, a0);
      // 꽂힌 카트리지 (꼭대기 왼쪽): 몸·손잡이 홈·깎인 모서리
      const cs = new THREE.Shape(); cs.moveTo(-.8, 0); cs.lineTo(.8, 0); cs.lineTo(.8, .78); cs.lineTo(.6, .98); cs.lineTo(-.8, .98); cs.closePath();
      add(ext(cs, .26, 4), CORAL, -1.35, NH - .32, NZ - NT / 2 - .13);
      for (let k = 0; k < 3; k++) add(G.box(1.2, .03, .03, .01), shade(CORAL, -.15), -1.45, NH + .48 + k * .055, NZ - NT / 2 + .14);
      add(G.box(1.8, .1, NT + .1, .03), INKY, -1.35, NH - .02, NZ - NT / 2);
    }));
    // 생활 디테일 (사용자 10/23 '현실적인 생활 디테일'): 오락기 옆 벽시계, 계단과 오락기 사이 달력
    N.deco.add(mc('ol3-console-life', ({ add }) => {
      add(G.cyl(.17, .17, .04, 20), CREAM, 3.3, 1.62, NZ + .03, HP, 0, 0); add(G.tor(.17, .025, PI * 2, 6, 22), INKY, 3.3, 1.62, NZ + .05);
      add(G.box(.02, .11, .01, .005), INKY, 3.3, 1.66, NZ + .055); add(G.box(.08, .02, .01, .005), INKY, 3.33, 1.62, NZ + .055, 0, 0, .3);
      add(G.box(.32, .44, .015, .005), '#ffffff', .76, 1.42, NZ + .01); add(G.box(.32, .1, .02, .005), BERRY, .76, 1.6, NZ + .015);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) add(G.box(.05, .045, .006, .002), (r * 4 + c) === 9 ? BERRY : '#d9d3e6', .655 + c * .07, 1.47 - r * .07, NZ + .02);
      add(G.cyl(.012, .012, .02, 6), INKY, .76, 1.66, NZ + .02, HP, 0, 0);
    }));
    { const l = mesh(new THREE.PlaneGeometry(1.14, .4), basic(topLabelTex(), '#e4e0e8'), { cast: false }); put(l, -1.4, NH + .2, NZ - NT / 2 + .135); N.deco.add(l); }
    { const l = mesh(new THREE.PlaneGeometry(1.0, .25), basic(logoTex(), '#dcd8e4'), { cast: false }); put(l, (SCREEN[0] + SCREEN[2]) / 2, SCREEN[1] - .22, NZ + .068); N.deco.add(l); }
    tagWall(N.g, 'N'); tagWall(N.deco, 'N'); tagWall(N.knee, 'N');
  }

  // ── 옆벽: 세워 둔 거대 카트리지 (안쪽 면이 방 쪽) ─────────────────────────────────────────────────────────
  // 모양은 (u = -z, y)로 그려 y축으로 +90° 돌림: u축 → -z, 두께(+z) → +x
  const W = foldWall(f, [1, 0, 0], WH);
  {
    const U0 = -WZ1, U1 = -WZ0, CH = .62;   // u 범위(앞 끝 → 뒤 끝), 깎인 모서리
    const shape = () => { const s = new THREE.Shape(); s.moveTo(U0, 0); s.lineTo(U1, 0); s.lineTo(U1, WH); s.lineTo(U0 + CH, WH); s.lineTo(U0, WH - CH); s.closePath(); return s; };
    const LBL = [-1.55, 1.3, 2.25, 2.95];   // 라벨 [u0, y0, u1, y1]
    const wall = grp(); wall.rotation.y = HP; wall.position.x = WX - WT; W.g.add(wall);
    wall.add(mc('ol3-cart', ({ add }) => {
      add(ext(shape(), WT, 4), CART, 0, 0, 0);
      // 테 (위·앞 깎인 모서리를 따라 밝은 띠)
      const band = new THREE.Shape(); band.moveTo(U0, 0); band.lineTo(U0, WH - CH); band.lineTo(U0 + CH, WH); band.lineTo(U1, WH); band.lineTo(U1, WH - .14); band.lineTo(U0 + CH + .06, WH - .14); band.lineTo(U0 + .14, WH - CH - .06); band.lineTo(U0 + .14, 0); band.closePath();
      add(ext(band, .07, 4), CARTRIM, 0, 0, WT - .005);
      // 손잡이 홈 (위쪽 가로줄)
      for (let k = 0; k < 4; k++) add(G.box(U1 - U0 - CH - .5, .035, .04, .01), CARTD, (U0 + CH + U1) / 2 + .05, WH - .32 - k * .12, WT + .015);
      // 아래 판벽
      add(G.box(U1 - U0 - .2, .86, .03, .01), CARTD, (U0 + U1) / 2 + .03, .43, WT + .015); add(G.box(U1 - U0 - .2, .06, .05, .02), CARTRIM, (U0 + U1) / 2 + .03, .86, WT + .025);
      // 라벨 둘레 오목한 판, 꽂는 방향 세모
      const rec = new THREE.Shape(); rrect(rec, LBL[0] - .12, LBL[1] - .12, LBL[2] + .12, LBL[3] + .12, .1); rec.holes.push(rrect(new THREE.Path(), ...LBL, .06)); add(ext(rec, .04, 6), CARTD, 0, 0, WT);
      const tri = new THREE.Shape(); tri.moveTo(-.14, .12); tri.lineTo(.14, .12); tri.lineTo(0, -.1); tri.closePath(); add(ext(tri, .03, 2), CARTD, -2.35, 2.35, WT + .005);
    }));
    // 벽지 (판벽 위, 라벨·문 둘레)
    const paper = new THREE.Shape(); paper.moveTo(U0 + .14, .86); paper.lineTo(U1, .86); paper.lineTo(U1, WH - .14); paper.lineTo(U0 + CH + .06, WH - .14); paper.lineTo(U0 + .14, WH - CH - .06); paper.closePath();
    paper.holes.push(rrect(new THREE.Path(), LBL[0] - .12, LBL[1] - .12, LBL[2] + .12, LBL[3] + .12, .1));
    const pm = mesh(new THREE.ShapeGeometry(paper, 6), mat('#ffffff', { map: paperTex(), rough: .9, rim: .1 }), { cast: false }); put(pm, 0, 0, WT + .003); wall.add(pm);
    { const l = mesh(new THREE.PlaneGeometry(LBL[2] - LBL[0], LBL[3] - LBL[1]), mat('#ffffff', { map: labelTex(), rough: .8, rim: .1 }), { cast: false }); put(l, (LBL[0] + LBL[2]) / 2, (LBL[1] + LBL[3]) / 2, WT + .012); wall.add(l); }
    // 현관문 (안쪽에서 본 문: 판·둥근 창·손잡이·문틀) + 발판
    const dr = grp(); dr.rotation.y = HP; dr.position.set(WX + .005, 0, DOOR.z); W.deco.add(dr);
    dr.add(mc('ol3-door', ({ add }) => {
      add(G.box(DOOR.w + .16, DOOR.h + .1, .05, .02), CARTRIM, 0, (DOOR.h + .1) / 2, .02);
      add(G.box(DOOR.w, DOOR.h, .05, .02), '#7d93b8', 0, DOOR.h / 2, .05);
      add(G.box(DOOR.w - .2, .6, .02, .02), shade('#7d93b8', .1), 0, .55, .08);
      add(G.tor(.13, .03, PI * 2, 6, 18), CARTRIM, 0, 1.55, .08); add(G.sph(.04, 10, 8), '#ffd84a', -DOOR.w / 2 + .12, 1.0, .1);
    }));
    { const w = mesh(new THREE.CircleGeometry(.13, 16), basic(rainTex(), '#d8def5'), { cast: false }); put(w, 0, 1.55, .081); dr.add(w); }
    f.add(mc('ol3-doormat', ({ add }) => { add(G.box(.48, .02, .78, .01), '#c9805a', WX + .34, .01, DOOR.z); add(G.box(.4, .022, .7, .008), '#e0a06e', WX + .34, .012, DOOR.z); }));
    // 꼬마전구 (라벨 위를 따라 처지는 줄, 따뜻한 알)
    W.deco.add(mc('ol3-fairy', ({ tube }) => {
      const pts = []; for (let k = 0; k <= 20; k++) { const t = k / 20, z = 1.75 - t * 4.45, y = 3.0 - Math.sin(t * PI * 3) ** 2 * .14; pts.push([WX + .06, y, z]); }
      for (let k = 0; k < pts.length - 1; k++) tube(pts[k], pts[k + 1], .008, '#5a5470', 4);
    }));
    { const cols = ['#ffd98a', '#ff9fb8', '#9fd8ff', '#b9f0a0']; for (let k = 0; k < 19; k++) { const t = (k + .5) / 19, z = 1.75 - t * 4.45, y = 3.0 - Math.sin(t * PI * 3) ** 2 * .14 - .05, c = cols[k % 4]; const b = mesh(new THREE.SphereGeometry(.035, 8, 6), mat(c, { emissive: c, ei: 1.1 }), { cast: false }); put(b, WX + .07, y, z); W.deco.add(b); } }
    // 현관 옆 옷걸이: 노란 우비(후드)·에코백·모자 (신발장 위)
    W.deco.add(mc('ol3-hooks', ({ add }) => {
      add(G.box(.04, .07, .78, .02), WOODD, WX + .02, 1.9, 1.5); for (const z of [1.22, 1.5, 1.78]) add(G.cyl(.015, .015, .1, 6), '#e0b04a', WX + .07, 1.88, z, 0, 0, HP);
      add(G.cyl(.08, .19, .62, 12), '#f5c84c', WX + .12, 1.5, 1.22, 0, 0, 0, [.55, 1, 1]); add(G.sph(.11, 10, 8), '#f5c84c', WX + .12, 1.8, 1.22, 0, 0, 0, [.7, 1, 1]);
      add(G.box(.02, .5, .03, .01), '#e0a83a', WX + .2, 1.5, 1.22);
      add(G.box(.06, .34, .3, .03), CREAM, WX + .1, 1.6, 1.52); add(G.box(.065, .07, .3, .01), CORAL, WX + .1, 1.62, 1.52); add(G.tor(.1, .012, PI, 4, 10), CREAM, WX + .08, 1.8, 1.52, 0, HP, 0);
      add(G.sph(.12, 10, 6), '#5d6aa6', WX + .1, 1.83, 1.8, 0, 0, 0, [.8, .6, 1]); add(G.box(.02, .03, .2, .01), '#5d6aa6', WX + .16, 1.77, 1.8);
    }));
    W.knee.add(mc('ol3-cart-knee', ({ add }) => { add(G.box(WT, .42, WZ1 - WZ0, .05), CART, WX - WT / 2, .21, (WZ0 + WZ1) / 2); add(G.box(WT + .04, .05, WZ1 - WZ0, .02), CARTRIM, WX - WT / 2, .42, (WZ0 + WZ1) / 2); }));
    tagWall(W.g, 'W'); tagWall(W.deco, 'W'); tagWall(W.knee, 'W');
  }

  // 방 벽처럼: 카메라 쪽으로 온 벽은 무릎 높이로 (room.js update와 같은 규칙: 안쪽 법선 · 카메라 방향 < -.18)
  const cam = new THREE.Vector3(), nrm = new THREE.Vector3();
  f.updateView = (Wd, dt = 1 / 60) => {
    if (!Wd || !Number.isFinite(Wd.yaw)) return;
    f.group.updateWorldMatrix(true, false);
    cam.set(Math.sin(Wd.yaw), 0, Math.cos(Wd.yaw));
    const sm = 1 - Math.exp(-Math.max(0, dt) * 12);
    for (const q of f.ol3Walls) {
      nrm.copy(q.n).transformDirection(f.group.matrixWorld);
      const want = nrm.dot(cam) < -.18 ? 0 : 1, prev = q.k;
      q.k += (want - q.k) * sm; if (Math.abs(q.k - want) < .002) q.k = want;
      if (q.k === prev) continue;
      q.g.scale.y = q.stub + (1 - q.stub) * q.k;
      const up = q.k > .65; q.deco.visible = up; q.g.visible = q.k > .3; q.knee.visible = q.k <= .3;
      Wd.shadowDirty = true; Wd.idsDirty = true;
    }
  };
};

// ── 컨트롤러 소파 (2×1, +z가 앞): 패드 몸통과 둥근 손잡이 둘이 앉는 자리, 등받이 양 끝은 어깨 단추, 왼쪽 손잡이 위 십자 쿠션은
// 뚜껑(들면 과자 숨긴 칸), 오른쪽은 네 색 단추 쿠션; 선이 바닥을 따라 앞으로 꼬불
B.ol3_padsofa = (f, T) => {
  const BODY = '#8f9bc9', BODYD = '#7a86b6', SEAT = '#b7c0e2', BUMP = '#5c6188';
  f.add(mc('ol3-padsofa', ({ add, tube }) => {
    add(G.box(1.36, .34, .62, .16), BODY, 0, .19, -.16);
    for (const sx of [-1, 1]) { add(G.cyl(.36, .36, .34, 22), BODY, sx * .6, .19, .12); add(G.cyl(.37, .37, .04, 22), BODYD, sx * .6, .02, .12); }
    add(G.box(1.36, .04, .6, .02), BODYD, 0, .02, -.16);
    // 등받이와 어깨 단추
    add(G.box(1.86, .5, .2, .1), BODYD, 0, .58, -.42); for (const sx of [-1, 1]) add(G.cap(.11, .42, 4, 10), BUMP, sx * .66, .86, -.42, 0, 0, HP);
    // 앉는 쿠션 (가운데), 시작·선택 알약, 오른쪽 네 단추
    add(G.box(1.0, .12, .46, .06), SEAT, 0, .42, -.1);
    for (const x of [-.12, .12]) add(G.cap(.03, .08, 3, 6), BUMP, x, .37, .2, 0, 0, HP + .4);
    // 먹다 둔 컵라면(뚜껑 반쯤, 젓가락)과 과자 봉지
    add(G.cyl(.075, .06, .11, 14), '#ffffff', -.34, .535, -.18); add(G.cyl(.077, .077, .03, 14), '#e8414e', -.34, .56, -.18); add(G.cyl(.068, .068, .01, 14), '#e8b45c', -.34, .59, -.18);
    add(G.box(.13, .005, .1, .002), '#f2f2f2', -.38, .6, -.24, -.7, 0, 0);
    for (const dz of [-.015, .015]) add(G.box(.008, .008, .26, .003), '#d9a46a', -.3, .62, -.12 + dz, .35, .2, 0);
    add(G.box(.18, .05, .24, .025), '#ffc23d', .3, .5, -.05, 0, .5, .1); add(G.box(.12, .052, .08, .02), '#e8414e', .3, .505, -.05, 0, .5, .1);
    for (const [dx, dz, c] of [[0, -.13, '#e8414e'], [.13, 0, '#ffc23d'], [0, .13, '#4caf7a'], [-.13, 0, '#3a7bd5']]) add(G.cyl(.08, .08, .07, 16), c, .6 + dx, .39, .12 + dz);
    // 선: 왼쪽 손잡이 옆에서 바닥으로 내려와 꼬불 (자리 안에서)
    const P = [[-.92, .2, .2], [-.98, .03, .3], [-.86, .02, .44], [-.62, .02, .47], [-.45, .02, .4]];
    for (let k = 0; k < P.length - 1; k++) tube(P[k], P[k + 1], .022, '#3e3b55', 6);
  }));
  const lid = grp(); put(lid, -.6, .36, .12); f.add(lid);
  lid.add(mc('ol3-padsofa-lid', ({ add }) => { add(G.cyl(.3, .3, .04, 22), '#a3add5', 0, 0, 0); add(G.box(.36, .06, .12, .02), '#3e3b55', 0, .045, 0); add(G.box(.12, .06, .36, .02), '#3e3b55', 0, .045, 0); }));
  const p = f.part('lift', lid, t => { lid.position.y = lid.userData.base.p.y + .16 * t; lid.rotation.x = -.55 * t; }, { label: '십자 쿠션 뚜껑', sfx: 'open', dur: .3 });
  f.spot('inside', null, -.6, .22, .12, { part: p, maxH: .14, label: '십자 쿠션 속', scale: .7 });
  f.spot('on', null, .1, .48, -.12, { maxH: .3, label: '컨트롤러 소파 위', scale: .8 });
  f.spot('behind', null, 0, 0, -.62, { maxH: .35, label: '컨트롤러 소파 뒤', scale: .8 });
  f.collideBox = [-.98, 0, -.55, .98, 1.0, .5];
};

// ── 카트리지 책장 (1×1, 다락 밑): 세워 둔 작은 카트리지 — 위 손잡이 홈, 깎인 모서리, 라벨 자리가 뚫린 세 칸 만화 선반
let SPINE = null;
const spineTex = () => SPINE || (SPINE = canvasTex(256, 64, (c, W, H) => {
  const r = rnd(9), cols = ['#e8414e', '#3a7bd5', '#ffc23d', '#4caf7a', '#ff8fb8', '#8a5ad8', '#f2f2f2', '#ff8f3a', '#5ec6d6'];
  c.fillStyle = '#3a3048'; c.fillRect(0, 0, W, H); let x = 0;
  while (x < W) { const col = cols[Math.floor(r() * cols.length)]; for (let k = 0; k < 2 + Math.floor(r() * 5) && x < W; k++) { const w = 9 + Math.floor(r() * 3), h = H - 4 - Math.floor(r() * 12); c.fillStyle = col; c.fillRect(x, H - h, w - 1, h); c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(x + 1, H - h + 5, w - 3, 4); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + w - 2, H - h, 1, h); x += w; } }
}));
B.ol3_cartshelf = (f, T) => {
  const Wd = .84, Hh = 1.26, D = .4, z0 = -.27;
  f.add(mc('ol3-cartshelf', ({ add }) => {
    const s = new THREE.Shape(); s.moveTo(-Wd / 2, 0); s.lineTo(Wd / 2, 0); s.lineTo(Wd / 2, Hh - .16); s.lineTo(Wd / 2 - .16, Hh); s.lineTo(-Wd / 2, Hh); s.closePath();
    s.holes.push(rrect(new THREE.Path(), -Wd / 2 + .09, .1, Wd / 2 - .09, Hh - .3, .04));
    add(ext(s, .06, 4), CART, 0, 0, z0 + D / 2 - .06);
    add(G.box(Wd - .04, Hh - .2, .04, .01), CARTD, 0, (Hh - .2) / 2, z0 - D / 2 + .02);
    for (const sx of [-1, 1]) add(G.box(.06, Hh - .2, D - .04, .01), CART, sx * (Wd / 2 - .03), (Hh - .2) / 2, z0);
    add(G.box(Wd, .06, D, .01), CART, 0, .03, z0); add(G.box(Wd - .2, .05, D, .01), CART, -.1, Hh - .025, z0);
    for (const y of [.42, .72]) add(G.box(Wd - .16, .03, D - .06, .008), CARTD, 0, y, z0);
    for (let k = 0; k < 3; k++) add(G.box(Wd - .32, .025, .03, .008), CARTD, -.06, Hh - .09 - k * .06, z0 + D / 2 + .005);
    add(G.box(.28, .05, .03, .01), CORAL, .18, .2, z0 + D / 2 + .002);
  }));
  const sp = spineTex();
  for (const y of [.13, .45]) { const m = mesh(new THREE.PlaneGeometry(Wd - .2, .26), mat('#ffffff', { map: sp, rough: .8, rim: .1 }), { cast: false }); put(m, 0, y + .13, z0 - .1); f.add(m); }
  f.spot('inside', null, -.16, .45, z0 + .06, { maxH: .22, label: '카트리지 책장 가운데 칸', scale: .7 });
  f.spot('inside', null, .18, .75, z0 + .06, { maxH: .2, label: '카트리지 책장 위 칸', scale: .7 });
  f.spot('behind', null, Wd / 2 + .1, 0, z0, { maxH: .4, label: '카트리지 책장 옆 틈', scale: .7 });
};

// (18판 비교안 otakuloft4 — 오락실 2층집 — 가 같은 도우미를 씀: gfx/otakuloft4-props.js)
export { rrect, circle, ext, islandShape, ISY, IS, rainTex, tileTex, foldWall, tagWall, basic, rnd, SHELLD, CURB, EARTH, EARTHD, PAVED, LEAF, LEAF2, POLE, WARM, WOODD, CREAM, CORAL, INKY, BERRY };
export const OL3_BUILDERS = B;
export const OL3_INFO = {
  ol3_shell: { w: 1, d: 1, name: '너굴이네 게임기 집', hidden: true, price: 0 },
  ol3_padsofa: { w: 2, d: 1, name: '컨트롤러 소파', hidden: true, price: 0 },
  ol3_cartshelf: { w: 1, d: 1, name: '카트리지 책장', hidden: true, price: 0 },
};

// 26판 멍뭉이네 마당 2층집 새 안 doghouse3 (⑦ 10/23 — 사용자 메모 "새로. 2층집 외 배경은 하얀 느낌의 단순한 동네(자리만 잡혀 있게)"):
// 집과 마당 조각. 집 둘레의 하얀 동네는 공용 키트 gfx/whitetown-kit.js.
//   d3_kennel    멍뭉이 개집 + 밥그릇 매트 (2×1): 지붕이 뒤로 들려 열림(색깔 자물쇠 자리), 안에 방석과 뼈다귀
//   d3_frontfence 마당 앞 낮은 나무 울타리와 대문 (4×1, 대문 자리는 걸어 지나감 — walkSolids)
//   d3_yardpath  대문에서 집 문까지 디딤돌 (바닥 조각)
//   d3_doorstep  집 마당 문 앞 댓돌·슬리퍼·우산꽂이 (1×1, 숨김 자리 하나)
//   d3_farstation 멀리 작게 보이는 동네 역(27판으로 가는 길) — 하얀 동네 키트(gfx/whitetown-kit.js)의 랜드마크로 세움
// 좌표: 가구는 자기 바닥 가운데가 원점, +z가 앞.
import * as THREE from 'three';
import { put, mat, mesh, canvasTex, texCache, roundRect, shade } from './kit.js';
import { HG as G, hmc as rawMc } from './house-props.js';
import { addI18n } from '../i18n.js';

addI18n({
  '멍뭉이 개집': "Mongmong's doghouse", '개집 지붕': 'Doghouse roof', '개집 안': 'In the doghouse', '밥그릇 옆': 'By the food bowls', '개집 옆': 'Beside the doghouse',
  '마당 울타리와 대문': 'Yard fence and gate', '대문 기둥 위': 'On the gate post', '울타리 앞 화분 옆': 'By the pot at the fence',
  '마당 디딤돌': 'Stepping stones', '마당 문 댓돌': 'Back door step', '우산꽂이 옆': 'By the umbrella stand', '댓돌 위 슬리퍼 옆': 'By the slippers on the step',
  '멍뭉이네 마당 2층집': "Mongmong's House with a Yard", '멍뭉이': 'Mongmong',
});

const PI = Math.PI, HP = PI / 2;
const mc = (key, fn) => rawMc('d3|' + key, fn);
const TEX = texCache();
const INK = '#2a1d33';
const C = {
  plank: '#e8b47c', plank2: '#d99d63', plankD: '#b77a45', roof: '#ee8a6a', roof2: '#d9715a', ridge: '#c95f4a',
  cushion: '#7fb6e8', cushion2: '#5d97d0', bone: '#fff4e2', mat: '#9fd0e8', steel: '#d6dbe6', steel2: '#aab3c6', kibble: '#b9774a',
  ball: '#ff6b57', fence: '#f4ece0', fence2: '#e3d6c4', post: '#efe4d3', stone: '#e2dbd0', stone2: '#cfc6b8', gold: '#ffc93c',
};

// 개집 이름표: 크림 판에 '멍뭉이'와 작은 발자국
const nameTex = () => TEX.get('d3|name', () => canvasTex(256, 96, (c, w, h) => {
  c.fillStyle = '#fff3dc'; roundRect(c, 3, 3, w - 6, h - 6, 18); c.fill();
  c.strokeStyle = '#b77a45'; c.lineWidth = 5; roundRect(c, 6, 6, w - 12, h - 12, 14); c.stroke();
  c.fillStyle = '#6b4226'; c.font = '700 46px Ssurround, Jua, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('멍뭉이', w / 2 + 16, h / 2 + 3);
  c.fillStyle = '#e8735a';
  const paw = (x, y, s) => { c.beginPath(); c.ellipse(x, y + 5 * s, 9 * s, 7 * s, 0, 0, 7); c.fill(); for (const [dx, dy] of [[-9, -5], [-3, -10], [4, -10], [10, -5]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, 3.4 * s, 0, 7); c.fill(); } };
  paw(40, 50, 1.1);
}));
// 판자 결: 가로 판자에 나뭇결 줄과 옹이 (개집·울타리)
const woodTex = (key, base) => TEX.get('d3|wood|' + key, () => canvasTex(256, 256, (c, w, h) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  const r = (n => () => (n = (n * 16807) % 2147483647) / 2147483647)(7);
  for (let k = 0; k < 46; k++) { c.strokeStyle = `rgba(120,70,30,${.06 + r() * .08})`; c.lineWidth = 1 + r() * 2; const y = r() * h; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 32) c.lineTo(x, y + Math.sin(x / 40 + k) * 3); c.stroke(); }
  for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(110,62,28,.25)'; c.beginPath(); c.ellipse(r() * w, r() * h, 7, 4, 0, 0, 7); c.fill(); }
}, { repeat: [1, 1] }));

const B = {}, INFO = {};
const flatQuad = (w, h, m) => mesh(new THREE.PlaneGeometry(w, h), m, { cast: false });

// ── 멍뭉이 개집 + 밥그릇 매트 (2×1) ───────────────────────────────────────────────────────────────────────────────
// 개집은 x -.42: 판자 몸통(가로 판자 다섯 줄), 앞벽에 둥근 문, 박공 지붕(주홍 기와 줄) — 지붕이 위로 번쩍 들려요.
// 오른쪽(x .45)은 하늘색 매트에 밥그릇·물그릇·뼈다귀·빨간 공.
INFO.d3_kennel = { w: 2, d: 1, name: '멍뭉이 개집', price: 0, hidden: true };
B.d3_kennel = (f) => {
  // KX: the kennel's x; W·D·H: body width, depth, wall height; gH: gable height
  const KX = -.42, W = .8, D = .64, H = .5, Z = -.06, y0 = .07, gH = .3;
  const front = Z + D / 2, back = Z - D / 2;
  f.add(mc('kennel-body', ({ add, addM }) => {
    // 받침: 두꺼운 판 + 짧은 다리
    add(G.box(W + .1, .05, D + .1, .015), C.plankD, KX, y0 - .02, Z);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.08, y0 - .04, .08, .01), C.plankD, KX + sx * (W / 2 - .02), (y0 - .04) / 2, Z + sz * (D / 2 - .02));
    // 옆벽·뒷벽: 가로 판자 다섯 줄, 줄마다 살짝 다른 색과 깊이
    const rows = 5, ph = H / rows;
    for (let k = 0; k < rows; k++) {
      const y = y0 + ph * (k + .5), cc = k % 2 ? C.plank : C.plank2, o = k % 2 ? .006 : 0;
      for (const sx of [-1, 1]) add(G.box(.045, ph - .008, D, .01), cc, KX + sx * (W / 2 - .0225 + o * sx), y, Z);
      add(G.box(W, ph - .008, .045, .01), cc, KX, y, back + .0225 - o);
    }
    // 앞벽: 판자 모양 오각형에 둥근 문 구멍
    const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(0, H + gH); s.lineTo(-W / 2, H); s.lineTo(-W / 2, 0);
    const hole = new THREE.Path(); const hw = .17, hh = .27; hole.moveTo(-hw, .02); hole.lineTo(hw, .02); hole.lineTo(hw, hh); hole.absarc(0, hh, hw, 0, PI, false); hole.lineTo(-hw, .02); s.holes.push(hole);
    add(G.ext(s, .045, .008, 12), C.plank, KX, y0, front - .045);
    // 뒷 박공
    const t = new THREE.Shape(); t.moveTo(-W / 2, 0); t.lineTo(W / 2, 0); t.lineTo(0, gH); t.lineTo(-W / 2, 0);
    add(G.ext(t, .045, .006, 2), C.plank2, KX, y0 + H, back);
    // 문틀: 둥근 테두리 (진한 나무)
    const fr = new THREE.Shape(); fr.moveTo(-hw - .04, 0); fr.lineTo(hw + .04, 0); fr.lineTo(hw + .04, hh); fr.absarc(0, hh, hw + .04, 0, PI, false); fr.lineTo(-hw - .04, 0);
    const fh = new THREE.Path(); fh.moveTo(-hw, 0); fh.lineTo(hw, 0); fh.lineTo(hw, hh); fh.absarc(0, hh, hw, 0, PI, false); fh.lineTo(-hw, 0); fr.holes.push(fh);
    add(G.ext(fr, .02, .006, 12), C.plankD, KX, y0 + .02, front);
    // 안: 어두운 속 + 방석(파란 체크는 따로) + 뼈다귀 장난감
    add(G.box(W - .1, .01, D - .1, .004), '#7a5236', KX, y0 + .006, Z);
    // 모서리 기둥 (진한 나무)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.06, H + .02, .06, .012), C.plankD, KX + sx * (W / 2 - .01), y0 + H / 2, Z + sz * (D / 2 - .01));
    // 이름표 걸이 못 두 개
    for (const sx of [-1, 1]) add(G.sph(.012, 8, 6), C.gold, KX + sx * .1, y0 + H + .13, front + .012);
    // 오른쪽 매트: 둥근 매트
    add(G.cyl(.36, .36, .016, 32), C.mat, .46, .008, .06, 0, 0, 0, [1, 1, .72]);
    add(G.tor(.33, .012, PI * 2, 6, 40), '#ffffff', .46, .017, .06, HP, 0, 0, [1, .72, 1]);
    // 밥그릇(사료) · 물그릇
    for (const [x, inner] of [[.33, C.kibble], [.6, '#8fd6f4']]) {
      add(G.cyl(.105, .085, .065, 22), C.steel, x, .049, .02);
      add(G.tor(.1, .012, PI * 2, 6, 26), C.steel2, x, .082, .02, HP, 0, 0);
      add(G.cyl(.088, .088, .006, 22), inner, x, .07, .02);
    }
    for (let k = 0; k < 9; k++) add(G.sph(.016, 6, 5), shade(C.kibble, (k % 3 - 1) * .06), .33 + Math.cos(k * 2.3) * .05, .077, .02 + Math.sin(k * 2.3) * .045);
    // 뼈다귀 (매트 앞)
    const bone = (x, z, ry, s = 1) => { const m = new THREE.Matrix4().compose(new THREE.Vector3(x, .03 * s, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(s, s, s));
      const parts = [[G.cap(.022, .12, 2, 8), 0, 0, 0, 0, 0, HP]];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push([G.sph(.026, 10, 8), sx * .085, 0, sz * .022]);
      for (const [g, x0, y0_, z0, rx = 0, ry0 = 0, rz = 0] of parts) addM(g, m.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(x0, y0_, z0), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry0, rz)), new THREE.Vector3(1, 1, 1))), C.bone); };
    bone(.5, .33, .5);
    // 빨간 공 (흰 줄)
    add(G.sph(.06, 16, 12), C.ball, .82, .06, .36);
    add(G.tor(.06, .008, PI * 2, 6, 22), '#ffffff', .82, .06, .36, .4, 0, .3);
    // 목줄: 개집 옆 고리에서 매트 쪽으로 늘어진 빨간 줄
    add(G.tor(.03, .008, PI * 2, 6, 14), C.steel2, KX + W / 2 + .01, y0 + .3, Z + .18, 0, HP, 0);
  }));
  // 방석 (파란 체크 천) + 뼈 인형 — 개집 안
  f.add(mc('kennel-cushion', ({ add }) => {
    add(G.box(W - .16, .06, D - .16, .03), C.cushion, KX, y0 + .04, Z);
    for (let k = -2; k <= 2; k++) add(G.box(.02, .002, D - .18, .001), C.cushion2, KX + k * .12, y0 + .071, Z);
    for (let k = -2; k <= 2; k++) add(G.box(W - .18, .002, .02, .001), C.cushion2, KX, y0 + .072, Z + k * .1);
  }));
  // 이름표
  f.add(put(flatQuad(.24, .09, mat('#ffffff', { map: nameTex(), rough: .8 })), KX, y0 + H + .095, front + .006));
  // 지붕: 뒤 처마에서 들림 — 두 장의 기와판, 기와 줄, 용마루
  const pv = new THREE.Group(); put(pv, KX, y0 + H, back - .06); f.add(pv);
  const slope = Math.atan2(gH, W / 2), L = Math.hypot(W / 2, gH) + .12, ov = .1;
  pv.add(mc('kennel-roof', ({ add }) => {
    for (const sx of [-1, 1]) {
      const cx = sx * (W / 4 + .02), cy = gH / 2 + .02, rz = -sx * slope;
      add(G.box(L, .045, D + ov * 2 + .06, .015), C.roof, cx, cy, (D + .12) / 2, 0, 0, rz);
      // 기와 줄 세 줄
      for (let k = 0; k < 3; k++) { const u = -L / 2 + .1 + k * (L - .16) / 2.4; add(G.box(.035, .02, D + ov * 2 + .07, .008), C.roof2, cx + Math.cos(rz) * u, cy + .03 + Math.sin(rz) * u, (D + .12) / 2, 0, 0, rz); }
    }
    add(G.cyl(.035, .035, D + ov * 2 + .1, 12), C.ridge, 0, gH + .06, (D + .12) / 2, HP, 0, 0);
  }));
  // (뒤로 젖히면 용마루 끝이 뒤 울타리 밖으로 나가 반쯤만 열렸음: 지붕을 위로 번쩍 들고 앞으로 살짝 기울여요 — 안이 보이게)
  const p = f.part('lid', pv, (t, b) => { pv.position.y = b.p.y + .42 * t; pv.position.z = b.p.z + .08 * t; pv.rotation.x = .12 * t; }, { label: '개집 지붕', sfx: 'open', dur: .36 });
  p.lockable = true;
  f.lockAt = { x: 0, y: gH * .5 - .02, z: D + .2, parent: pv };
  f.spot('inside', null, KX, y0 + .075, Z + .02, { part: p, maxH: .38, label: '개집 안' });
  f.spot('on', null, .46, .02, .18, { maxH: .4, label: '밥그릇 옆' });
  f.spot('on', null, .02, 0, .32, { maxH: .4, label: '개집 옆' });
};

// ── 마당 앞 울타리와 대문 (4×1): 낮은 크림 나무 울타리, 오른쪽 끝 가까이 두 기둥 사이 여닫이 대문(살짝 열림) ──────────────
// 울타리는 조각 바닥 맨 앞(z .38)에 서고, 대문 자리는 걸어서 지나가요(walkSolids는 울타리 판만).
INFO.d3_frontfence = { w: 4, d: 1, name: '마당 울타리와 대문', price: 0, hidden: true };
B.d3_frontfence = (f) => {
  // G0 ~ G1: the gate opening's x range
  const Z = .4, H = .62, G0 = .55, G1 = 1.45;
  const runs = [[-2, G0], [G1, 2]];
  f.add(mc('ffence', ({ add }) => {
    for (const [a, b] of runs) {
      const n = Math.max(2, Math.round((b - a) / .16));
      for (let i = 0; i <= n; i++) { const x = a + i * (b - a) / n; add(G.box(.085, H - .06, .03, .012), i % 2 ? C.fence : shade(C.fence, -.025), x, (H - .06) / 2, Z); add(G.box(.06, .06, .03, .01), C.fence, x, H - .06, Z, 0, 0, PI / 4); }
      for (const y of [.18, .44]) add(G.box(b - a, .05, .03, .012), C.fence2, (a + b) / 2, y, Z - .03);
    }
    // 기둥: 네 귀퉁이와 대문 양쪽 (둥근 머리)
    for (const x of [-2, G0 - .03, G1 + .03, 2]) { const big = x === G0 - .03 || x === G1 + .03, hh = big ? H + .22 : H + .04;
      add(G.box(big ? .14 : .09, hh, big ? .14 : .09, .02), C.post, x, hh / 2, Z - .01);
      add(G.sph(big ? .08 : .05, 12, 8), C.post, x, hh + .02, Z - .01, 0, 0, 0, [1, .7, 1]); }
    // 문패와 초인종 (오른쪽 대문 기둥)
    add(G.box(.11, .16, .012, .004), '#fff3dc', G1 + .03, H + .05, Z + .07);
    add(G.cyl(.022, .022, .014, 12), '#ffd45c', G1 + .03, H - .12, Z + .075, HP, 0, 0);
    // 우편함 (왼쪽 대문 기둥) — 빨간 둥근 통
    add(G.box(.18, .14, .1, .04), '#ff6b57', G0 - .03, H + .02, Z + .1);
    add(G.box(.12, .012, .012, .003), INK, G0 - .03, H + .05, Z + .156);
    // 담 밑 작은 화분 둘 (울타리 안쪽)
    for (const [x, c] of [[-1.55, '#ff9b73'], [-1.25, '#7fd6c0']]) { add(G.cyl(.08, .06, .13, 14), c, x, .065, Z - .2); for (let k = 0; k < 5; k++) add(G.sph(.055, 8, 6), k % 2 ? '#6cc46a' : '#4ea85a', x + Math.cos(k * 1.3) * .04, .17 + (k % 2) * .03, Z - .2 + Math.sin(k * 1.3) * .04); }
  }));
  // 대문: 두 짝, 안쪽으로 살짝 열림 (판자 대문 + 아치 윗살)
  for (const [hx, dir] of [[G0, 1], [G1, -1]]) {
    const pv = new THREE.Group(); put(pv, hx, 0, Z, 0, dir * -.55, 0); f.add(pv);
    const w = (G1 - G0) / 2 - .02;
    pv.add(mc('fgate|' + dir, ({ add }) => {
      const n = 4; for (let i = 0; i < n; i++) { const x = dir * (.06 + i * (w - .08) / (n - 1)); const hh = H - .02 + Math.sin((i / (n - 1)) * PI * (dir > 0 ? .5 : .5) + (dir > 0 ? 0 : HP)) * .06; add(G.box(.085, hh - .06, .028, .012), C.fence, x, .04 + (hh - .06) / 2, 0); }
      for (const y of [.18, .46]) add(G.box(w, .05, .03, .012), C.fence2, dir * w / 2, y, -.025);
      add(G.box(.03, .05, .03, .01), '#c9a24e', dir * (w - .05), .34, .025);
    }));
  }
  f.walkSolids = runs.map(([a, b]) => [a - .08, 0, Z - .1, b + .08, H, Z + .1]);
  f.walkBoxes = f.walkSolids;
  f.spot('on', null, G1 + .03, H + .1, Z - .01, { maxH: .3, label: '대문 기둥 위' });
  f.spot('on', null, -1.4, 0, Z - .42, { maxH: .4, label: '울타리 앞 화분 옆' });
};

// ── 디딤돌 (바닥 조각, 숨김 자리 없음) ─────────────────────────────────────────────────────────────────────────────
INFO.d3_yardpath = { w: 1, d: 1, name: '마당 디딤돌', price: 0, hidden: true };
B.d3_yardpath = (f, T, o = {}) => {
  const pts = o.pts || [[0, 0]];
  f.add(mc('ypath|' + JSON.stringify(pts), ({ add }) => {
    pts.forEach(([x, z], k) => { add(G.cyl(.2 + (k % 2) * .03, .21 + (k % 2) * .03, .035, 18), k % 3 ? C.stone : C.stone2, x, .017, z, 0, k * .7, 0, [1, 1, .78]); });
  }));
  f.noSolid = true;
};

// ── 마당 문 앞 댓돌 (1×1): 돌계단 한 단, 슬리퍼 한 켤레, 우산꽂이(노란 우산), 작은 발판 ───────────────────────────────
INFO.d3_doorstep = { w: 1, d: 1, name: '마당 문 댓돌', price: 0, hidden: true };
B.d3_doorstep = (f) => {
  f.add(mc('dstep', ({ add }) => {
    add(G.box(.86, .12, .5, .03), C.stone, -.02, .06, -.2);
    add(G.box(.86, .01, .5, .004), shade(C.stone, .03), -.02, .124, -.2);
    // 슬리퍼 (멍뭉이 주황) 한 켤레
    for (const sx of [-1, 1]) { add(G.box(.11, .025, .24, .05), '#ffab4c', -.12 + sx * .08, .14, -.18); add(G.box(.11, .045, .08, .03), '#fff4e2', -.12 + sx * .08, .155, -.25); }
    // 우산꽂이 + 노란 우산 하나, 파란 우산 하나
    add(G.cyl(.09, .08, .32, 16), '#9fb7d8', .3, .16, .22);
    add(G.tor(.09, .012, PI * 2, 6, 20), '#7f9cc4', .3, .32, .22, HP, 0, 0);
    add(G.cyl(.012, .012, .6, 8), '#c98a52', .26, .5, .2, .1, 0, .08); add(G.cone(.06, .36, 8), '#ffd45c', .25, .62, .2, .1, 0, .08 + PI);
    add(G.cyl(.012, .012, .58, 8), '#5f6d9e', .34, .5, .25, -.1, 0, -.06); add(G.cone(.055, .34, 8), '#7fb6e8', .345, .6, .255, -.1, 0, -.06 + PI);
    // 발판
    add(G.box(.42, .012, .26, .01), '#c9a07a', -.1, .006, .2);
    for (let k = 0; k < 6; k++) add(G.box(.38, .004, .015, .002), '#a8805a', -.1, .014, .1 + k * .04);
  }));
  f.spot('on', null, .14, .125, -.2, { maxH: .35, label: '댓돌 위 슬리퍼 옆' });
  f.spot('on', null, .3, 0, -.08, { maxH: .35, label: '우산꽂이 옆' });
};

// ── 멀리 보이는 다음 판: 작은 동네 역 (하얀 동네 키트의 랜드마크) — 크림 역사·청록 지붕·시계, 둑 위 선로에 초록 두 칸 기차 ─────────
// 27판 기차역으로 이어지는 '저기 역이 보이네' 한 점. 멀리 작게만 보이니 덩어리와 색만.
INFO.d3_farstation = { w: 1, d: 1, name: '멀리 보이는 동네 역', price: 0, hidden: true };
B.d3_farstation = f => f.add(mc('farstation', ({ add }) => {
  // 둑과 선로
  add(G.box(14, .5, 1.6, .1), '#e5e1da', 0, .25, -1.4);
  add(G.box(14, .06, .9, .02), '#cfc8bd', 0, .53, -1.4);
  for (const z of [-1.65, -1.15]) add(G.box(14, .05, .06, .01), '#a9a3b2', 0, .58, z);
  // 기차: 초록 두 칸, 크림 띠, 창 줄
  for (const [x, c] of [[-1.6, '#7cc49a'], [1.7, '#7cc49a']]) {
    add(G.box(3.1, 1.15, 1.1, .2), c, x, 1.2, -1.4);
    add(G.box(3.12, .14, 1.12, .03), '#fff3dc', x, 1.05, -1.4);
    for (let k = -1; k <= 1; k++) add(G.box(.6, .36, .02, .04), '#e8f2f6', x + k * .9, 1.42, -.84);
    add(G.box(2.9, .1, .9, .05), shade(c, -.15), x, 1.82, -1.4);
  }
  // 역사: 크림 벽, 청록 박공 지붕, 둥근 시계, 문
  add(G.box(3.4, 1.9, 2.2, .06), '#fbf3e4', .4, .95, 1.2);
  const slope = Math.atan2(.9, 1.7), L = Math.hypot(1.7, .9) + .3;
  for (const sx of [-1, 1]) add(G.box(L, .16, 2.6, .04), '#5fb3a6', .4 + sx * .85, 2.35, 1.2, 0, 0, -sx * slope);
  add(G.cyl(.3, .3, .08, 20), '#ffffff', .4, 2.25, 2.36, HP, 0, 0);
  add(G.tor(.3, .04, PI * 2, 6, 24), '#e8735a', .4, 2.25, 2.4, 0, 0, 0);
  add(G.box(.7, 1.1, .06, .03), '#c98a52', .4, .6, 2.31);
  for (const sx of [-1, 1]) add(G.box(.6, .55, .05, .03), '#e8f2f6', .4 + sx * 1.1, 1.1, 2.31);
  // 분홍 벚나무 하나
  add(G.cyl(.1, .14, 1.1, 8), '#b88a6a', 3.1, .55, 1.5);
  for (const [dx, dy, r] of [[0, 1.5, .7], [.4, 1.8, .5], [-.35, 1.75, .5]]) add(G.sph(r, 12, 9), '#f7c6d4', 3.1 + dx, dy, 1.5);
}));

export const D3_BUILDERS = B, D3_INFO = INFO;

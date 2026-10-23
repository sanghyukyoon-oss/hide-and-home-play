// 바닷가 가게 2 (seaside2 — ⑧ 10/23, 사용자 "예쁘지만 군데군데 디테일이 너무 떨어짐" → 같은 맵·같은 자리·같은 색, 디테일만 올림).
// 30판 바닷가 가게(gfx/seaside-props.js)의 조각을 같은 크기·같은 부품·같은 숨김 자리 순서로 다시 지었다(옛 키 seaside는 그대로):
//   seashop2      (seashop의 gptHero)   판자가 겹친 흰 벽, 슬레이트 비늘 지붕과 흰 박공 테, 물받이·선홈통, 창틀·덧문·커튼, 안이 보이는
//                                        진열창(선반·통조림·복고양이), 발코니 아래 '냥냥 수산' 간판, 물고기 돌출 간판, 영업중 팻말, 문 옆 생선 상자
//   seadeck2 / flagdeck2 (새 type)       나뭇결·못 박힌 판자, 젖은 말뚝에 밧줄·따개비·가새, 계류 말뚝 위 갈매기, 타이어 방현재, 계산대
//                                        판벽·물고기 명패·금전등록기, 얼음 위 생선 진열, 레몬 통(통판·테), 바질 화분, 통발·밧줄 더미;
//                                        flagdeck2는 옛 깃발 데크와 같은 자리·같은 부품(장치 'flagboat')에 보트 띠·방현재만 더함
//   fishstall2    (fishstall의 gptHero) 나무 받침다리, 흰 생선 상자(파란 띠·손잡이), 도미·고등어·새우·조개, 레몬·파슬리, 가격 깃발, 매달린 저울
//   barrels2      (barrels의 gptHero)   통판 무늬 배불뚝이 통, 쇠테, 뚜껑, 밧줄 사리 (앞 통 뚜껑 = 옛 자물쇠 부품 그대로)
//   cafeumbrella2 (cafeumbrella의 gptHero) 나뭇결 상판, 물결 끝단 파라솔, 다리 셋 의자, 커피잔·붕어빵 / 찻주전자, 메뉴 카드
//   chalksign2    (chalksign의 gptHero) 제대로 선 A자 틀, 분필 받침, '오늘의 메뉴' 손글씨 칠판(한·영)
//   ringpost2     (ringpost의 gptHero)  숫자 있는 시계, 밧줄 감은 밑동, 등, 꼭대기 갈매기
//   sandcastle2   (새 1×1)              모래성·양동이·삽 (숨김 자리 하나 더)
//   sea2scene     (새, 바닥 풍경 — 막지도 차지하지도 않음) 물가 거품·잔물결·반짝임·물고기 그림자·부표, 모래의 조개·불가사리·자갈·해초·
//                                        게·고양이 발자국, 부두 서쪽 면 돌 블록, 맨홀·분필 낙서·젖은 자국, 받침 옆면의 바다 단면
// 큰 면은 순한 원래 색, 쨍한 색은 작은 것에만. 글자는 게임 폰트로(gpt-paper fitText — 영어 화면은 tr).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { put, grp, shade, mat, mesh, geo, canvasTex, texCache, roundRect, starShape } from './kit.js';
import { HG as G, hmc as mc, hxf as xf } from './house-props.js';
import { fitText, textTex } from './gpt-paper.js';

const PI = Math.PI, HP = PI / 2;
const WHITE = '#fbf8f2', BLUE = '#3f6fae', BLUE2 = '#5b8fcf', SKY = '#8fd0f0', WOOD = '#d9a466', WOODD = '#a8733f',
  RED = '#ff5d5d', DARK = '#3a3048', GREEN = '#6cbf5a', GREEN2 = '#8fd47a', YEL = '#ffd23f', GOLD = '#ffc93c', IRON = '#5a5468',
  ROPE = '#e9d9b8', TERRA = '#d98b5f', STONE = '#c9c2b6';
const B = {};
// moves on its own (not a part): kept out of the room's static merge
const live = m => { m.userData.noMerge = true; return m; };
// a piece's own frame: add(...) in the frame M (a tilted tray, a leaning board, a gull)
const under = (addM, M) => (g, c, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => addM(g, M.clone().multiply(xf(x, y, z, rx, ry, rz, s)), c);

// ── textured pieces: one mesh from many, uvs planar in each piece's own frame (metres; su/sv a repeat, ou/ov an offset) or
// the shape's own uvs scaled (native) ─────────────────────────────────────────────────────────────────────────────────────
function tm(key, m, fn) {
  const g = geo('s2tm|' + key, () => {
    const list = [];
    const add = (src, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, u = {}) => {
      const c = src.index ? src.toNonIndexed() : src.clone();
      if (u.native && c.attributes.uv) {
        const uv = c.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (u.ru || 1) + (u.ou || 0), uv.getY(i) * (u.rv || 1) + (u.ov || 0));
      } else {
        const p = c.attributes.position, n = c.attributes.normal, su = u.su || 1, sv = u.sv || su, ou = u.ou || 0, ov = u.ov || 0, uv = new Float32Array(p.count * 2);
        for (let i = 0; i < p.count; i++) {
          const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
          let a, b;
          if (ay >= ax && ay >= az) { a = p.getX(i); b = p.getZ(i); } else if (ax >= az) { a = p.getZ(i); b = p.getY(i); } else { a = p.getX(i); b = p.getY(i); }
          uv[i * 2] = (a + ou) / su; uv[i * 2 + 1] = (b + ov) / sv;
        }
        c.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      }
      for (const k of Object.keys(c.attributes)) if (!['position', 'normal', 'uv'].includes(k)) c.deleteAttribute(k);
      c.applyMatrix4(xf(x, y, z, rx, ry, rz, s));
      list.push(c);
    };
    fn({ add });
    const out = mergeGeometries(list, false); out.name = key;
    return out;
  });
  return mesh(g, m);
}
// a flat strip along a polyline [[x, z], …] at height y (foam, ripples, chalk lines)
function ribbon(pts, w, y) {
  const pos = [], idx = [];
  pts.forEach(([x, z], i) => {
    const [xa, za] = pts[Math.max(0, i - 1)], [xb, zb] = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(xb - xa, zb - za) || 1;
    const nx = -(zb - za) / l * w / 2, nz = (xb - xa) / l * w / 2;
    pos.push(x + nx, y, z + nz, x - nx, y, z - nz);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g.toNonIndexed();
}
const flatMerge = list => { const out = mergeGeometries(list.map(g => { const c = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal') c.deleteAttribute(k); return c; }), false); return out; };
// a scallop: the lower half of a disc, flat edge on top, in the x-y plane, .012 thick toward +z
const scal = r => { const s = new THREE.Shape(); s.moveTo(-r, 0); s.absarc(0, 0, r, PI, 2 * PI, false); s.lineTo(-r, 0); return G.ext(s, .012, 0, 8); };
// a fish outline, head toward -x
const fishShape = (L = .3, H = .16) => { const s = new THREE.Shape(); s.moveTo(-L * .5, 0); s.quadraticCurveTo(-L * .2, H * .62, L * .22, H * .2); s.lineTo(L * .5, H * .5); s.lineTo(L * .42, 0);
  s.lineTo(L * .5, -H * .5); s.lineTo(L * .22, -H * .2); s.quadraticCurveTo(-L * .2, -H * .62, -L * .5, 0); return s; };
const barrelGeo = (r, h) => geo(`s2barrel|${r}|${h}`, () => new THREE.LatheGeometry([[r * .88, 0], [r * .96, h * .14], [r * 1.02, h * .5], [r * .96, h * .86], [r * .88, h]].map(([a, b]) => new THREE.Vector2(a, b)), 18));

// ── 그림 (canvas, cached per generation) ───────────────────────────────────────────────────────────────────────────────
const TX = texCache();
const rep = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
const tmat = (t, o) => mat('#ffffff', { map: t, rough: .85, rim: .12, ...o });
const fishFill = (c, x, y, s, col, dir = 1) => { c.save(); c.translate(x, y); c.scale(dir * s, s); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 12, 6, 0, 0, 7); c.fill();
  c.beginPath(); c.moveTo(9, 0); c.lineTo(18, -6); c.lineTo(18, 6); c.closePath(); c.fill(); c.fillStyle = 'rgba(30,20,40,.5)'; c.beginPath(); c.arc(-6, -1.5, 1.4, 0, 7); c.fill(); c.restore(); };
// clapboard: four laps a repeat (16 cm boards), a bright edge under each lap, its shadow line, a faint grain
const clapTex = () => TX.get('s2clap', () => rep(canvasTex(128, 128, (c, w) => {
  c.fillStyle = WHITE; c.fillRect(0, 0, w, w);
  for (let r = 0; r < 4; r++) {
    const y = r * 32;
    c.fillStyle = '#fffefb'; c.fillRect(0, y + 1, w, 5);
    c.strokeStyle = 'rgba(170,150,120,.12)'; c.lineWidth = 1;
    for (let k = 0; k < 3; k++) { const yy = y + 10 + k * 5 + (r % 2) * 2; c.beginPath(); c.moveTo(0, yy); c.bezierCurveTo(40, yy - 2, 86, yy + 3, w, yy); c.stroke(); }
    c.fillStyle = '#e9e2d6'; c.fillRect(0, y + 25, w, 4);
    c.fillStyle = '#d3c9b8'; c.fillRect(0, y + 29, w, 3);
  }
})));
// slate shingles: staggered courses with round ends pointing down the slope (v up = down the roof)
const shingleTex = () => TX.get('s2shingle', () => rep(canvasTex(256, 256, (c, w) => {
  c.fillStyle = '#2f5a92'; c.fillRect(0, 0, w, w);
  const tones = ['#3f6fae', '#4878b5', '#3a69a6', '#4473b1', '#3d6cab', '#4a7cb8'];
  const sh = (x, y, wd, ht, r) => { c.beginPath(); c.moveTo(x, y + ht); c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.lineTo(x + wd - r, y); c.arcTo(x + wd, y, x + wd, y + r, r); c.lineTo(x + wd, y + ht); c.closePath(); };
  for (let r = 0; r <= 8; r++) for (let k = -1; k <= 8; k++) {
    const x = k * 32 + (r % 2) * 16 + 1, y = r * 32 - 10;
    c.fillStyle = tones[(((r % 8) * 5 + k * 7) % 6 + 6) % 6]; sh(x, y, 30, 44, 11); c.fill();
    c.strokeStyle = '#2b4f85'; c.lineWidth = 2; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x + 6, y + 4, 18, 3);
  }
})));
// deck planks: two boards a repeat (27 cm each), each its own tone, grain along the board, a knot, nail pairs, the gap
const woodTex = () => TX.get('s2wood', () => rep(canvasTex(256, 256, (c, w) => {
  const tones = ['#dcaa6c', '#d09a5c'];
  for (let b = 0; b < 2; b++) {
    const x0 = b * 128;
    c.fillStyle = tones[b]; c.fillRect(x0, 0, 128, w);
    c.strokeStyle = 'rgba(130,78,36,.22)'; c.lineWidth = 1.6;
    for (let k = 0; k < 6; k++) { const gx = x0 + 12 + k * 19 + b * 5; c.beginPath(); c.moveTo(gx, 0); c.bezierCurveTo(gx + 7, 80, gx - 7, 170, gx, w); c.stroke(); }
    const kx = x0 + 52 + b * 26, ky = 84 + b * 96;
    c.fillStyle = 'rgba(120,70,30,.35)'; c.beginPath(); c.ellipse(kx, ky, 6, 10, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(120,70,30,.28)'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(kx, ky, 11, 17, 0, 0, 7); c.stroke();
    c.fillStyle = '#6e4e34'; for (const ny of [28 + b * 110]) for (const nx of [x0 + 26, x0 + 102]) { c.beginPath(); c.arc(nx, ny, 3, 0, 7); c.fill(); }
    c.fillStyle = '#7a4c26'; c.fillRect(x0, 0, 3, w);
  }
})));
// barrel staves: eight a repeat, a dark seam between, grain
const barrelTex = () => TX.get('s2barrel', () => rep(canvasTex(128, 128, (c, w) => {
  const tones = ['#a8733f', '#b47e48', '#9d6a39', '#ad7843'];
  for (let k = 0; k < 8; k++) {
    c.fillStyle = tones[k % 4]; c.fillRect(k * 16, 0, 16, w);
    c.strokeStyle = 'rgba(80,45,20,.2)'; c.lineWidth = 1;
    for (let g = 0; g < 2; g++) { const gx = k * 16 + 5 + g * 6; c.beginPath(); c.moveTo(gx, 0); c.quadraticCurveTo(gx + 2, 64, gx, w); c.stroke(); }
    c.fillStyle = 'rgba(60,32,14,.6)'; c.fillRect(k * 16, 0, 2, w);
  }
})));
// a window pane: sky glass, a dim room behind, white curtains tied back with pink, a bright streak
const winTex = () => TX.get('s2win', () => canvasTex(128, 128, (c, w) => {
  c.fillStyle = '#a9dcf2'; c.fillRect(0, 0, w, w); c.fillStyle = '#c9ecfa'; c.fillRect(0, 0, w, 44);
  c.fillStyle = 'rgba(70,80,120,.18)'; c.fillRect(0, 80, w, 48);
  for (const s of [-1, 1]) {
    c.save(); if (s > 0) { c.translate(w, 0); c.scale(-1, 1); }
    c.fillStyle = '#fffaf2'; c.beginPath(); c.moveTo(0, 0); c.lineTo(44, 0); c.quadraticCurveTo(26, 50, 22, 70); c.quadraticCurveTo(14, 100, 18, 128); c.lineTo(0, 128); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(200,180,170,.6)'; c.lineWidth = 1.5; for (const x of [10, 20]) { c.beginPath(); c.moveTo(x, 4); c.quadraticCurveTo(x - 2, 60, x - 4, 124); c.stroke(); }
    c.fillStyle = '#ff9fb5'; c.fillRect(8, 66, 20, 6);
    c.restore();
  }
  c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(74, 0); c.lineTo(94, 0); c.lineTo(52, 128); c.lineTo(32, 128); c.closePath(); c.fill();
}));
// the shop window: the shelves inside — jars, tins with fish on them, bottles — a warm lamp, the counter with a lucky cat
const interiorTex = () => TX.get('s2inside', () => canvasTex(256, 192, (c, w, h) => {
  c.fillStyle = '#f5e9d4'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#d9b48a'; c.fillRect(0, 118, w, 74);
  c.fillStyle = 'rgba(120,80,40,.22)'; for (let x = 0; x < w; x += 22) c.fillRect(x, 118, 2, 74);
  c.fillStyle = 'rgba(255,214,120,.35)'; c.beginPath(); c.arc(128, 18, 44, 0, 7); c.fill();
  c.fillStyle = '#6a5a4a'; c.fillRect(127, 0, 2, 10); c.fillStyle = '#ffd86b'; c.beginPath(); c.arc(128, 18, 10, PI, 0); c.fill();
  const cols = ['#ff8f7a', '#7fb8e8', '#ffd86b', '#9be38f', '#ffb3cf'];
  for (const [sy, seed] of [[62, 1], [104, 2]]) {
    c.fillStyle = '#b07a4a'; c.fillRect(10, sy, 236, 6);
    for (let k = 0; k < 9; k++) {
      const x = 18 + k * 25, kind = (k + seed) % 3, col = cols[(k * 2 + seed) % 5];
      if (kind === 0) { c.fillStyle = '#eef8fb'; roundRect(c, x, sy - 26, 18, 26, 4); c.fill(); c.fillStyle = col; c.fillRect(x + 3, sy - 16, 12, 12); c.fillStyle = '#8a6a4a'; c.fillRect(x + 2, sy - 30, 14, 5); }
      else if (kind === 1) { c.fillStyle = col; c.fillRect(x, sy - 18, 18, 18); c.fillStyle = '#ffffff'; c.fillRect(x, sy - 13, 18, 8); fishFill(c, x + 8, sy - 9, .45, '#3f6fae'); }
      else { c.fillStyle = col; roundRect(c, x + 4, sy - 26, 11, 26, 3); c.fill(); c.fillRect(x + 7, sy - 33, 5, 8); c.fillStyle = '#ffffff'; c.fillRect(x + 4, sy - 16, 11, 6); }
    }
  }
  c.fillStyle = '#c98f58'; c.fillRect(0, 150, w, 42); c.fillStyle = '#e2ad74'; c.fillRect(0, 146, w, 8);
  // 복고양이 (maneki-neko): the shop is 냥냥이's
  const mx = 200, my = 146;
  c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(mx, my - 14, 13, 15, 0, 0, 7); c.fill(); c.beginPath(); c.arc(mx, my - 34, 11, 0, 7); c.fill();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(mx + s * 10, my - 40); c.lineTo(mx + s * 8, my - 50); c.lineTo(mx + s * 2, my - 44); c.fill(); }
  c.beginPath(); c.ellipse(mx + 13, my - 36, 4, 8, -.3, 0, 7); c.fill();
  c.fillStyle = '#e8414e'; c.fillRect(mx - 9, my - 25, 18, 3); c.fillStyle = '#ffc93c'; c.beginPath(); c.arc(mx, my - 21, 3, 0, 7); c.fill();
  c.strokeStyle = '#3a3048'; c.lineWidth = 1.4; for (const s of [-1, 1]) { c.beginPath(); c.arc(mx + s * 4, my - 34, 2, PI, 0); c.stroke(); }
  c.strokeStyle = 'rgba(60,40,50,.22)'; c.lineWidth = 14; c.strokeRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,.38)'; c.beginPath(); c.moveTo(150, 0); c.lineTo(178, 0); c.lineTo(110, h); c.lineTo(82, h); c.closePath(); c.fill();
}));
const signTex = () => TX.get('s2sign', () => textTex(512, 70, (c, w, h) => {
  c.fillStyle = BLUE; roundRect(c, 0, 0, w, h, 5); c.fill();
  c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; roundRect(c, 3, 3, w - 6, h - 6, 4); c.stroke();
  for (const s of [-1, 1]) fishFill(c, w / 2 + s * w * .38, h / 2, .9, '#ffd86b', -s);
  fitText(c, '냥냥 수산', w / 2, h / 2 + 1, w * .6, h * .72, '#ffffff', { weight: 'bold' });
}));
const openTex = () => TX.get('s2open', () => textTex(128, 64, (c, w, h) => {
  c.fillStyle = '#fffaf0'; roundRect(c, 1, 1, w - 2, h - 2, 4); c.fill(); c.strokeStyle = '#e8414e'; c.lineWidth = 2; c.stroke();
  fitText(c, '영업중', w / 2, h / 2 + 1, w * .8, h * .62, '#e8414e', { weight: 'bold' });
}));
const priceTex = (s, fish = false) => TX.get('s2price' + s + fish, () => textTex(fish ? 192 : 96, fish ? 144 : 60, (c, w, h) => {
  c.fillStyle = '#fffaf0'; roundRect(c, 1, 1, w - 2, h - 2, 4); c.fill(); c.strokeStyle = '#e8414e'; c.lineWidth = fish ? 2.4 : 1.5; c.stroke();
  if (fish) { fishFill(c, w * .4, h * .32, 1.5, '#3a7bd5'); c.fillStyle = '#ffc23d'; c.beginPath(); c.arc(w * .78, h * .3, 7, 0, 7); c.fill(); }
  fitText(c, s, w / 2, fish ? h * .7 : h / 2 + 1, w * .82, fish ? h * .4 : h * .64, '#e8414e', { weight: 'bold' });
}));
const menuTex = () => TX.get('s2menu', () => textTex(128, 96, (c, w, h) => {
  c.fillStyle = '#fffaf0'; c.fillRect(0, 0, w, h); c.strokeStyle = BLUE2; c.lineWidth = 2; c.strokeRect(2, 2, w - 4, h - 4);
  fishFill(c, w / 2, h * .3, .8, BLUE2);
  fitText(c, '메뉴', w / 2, h * .7, w * .8, h * .34, BLUE, { weight: 'bold' });
}));
// the chalk menu: today's menu with a fish, a cup, a lemon, their prices; stars
const chalkTex2 = () => TX.get('s2chalk', () => textTex(256, 352, (c, w, h) => {
  c.fillStyle = '#2f3a36'; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,.05)'; for (const [x, y, r] of [[30, 120, 26], [96, 60, 30], [70, 150, 22]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.setLineDash([4, 3]); c.lineWidth = 1.4; c.strokeRect(6, 6, w - 12, h - 12); c.setLineDash([]);
  fitText(c, '오늘의 메뉴', w / 2, 22, w * .82, 16, '#ffd86b');
  c.strokeStyle = '#ffd86b'; c.lineWidth = 1.6; c.beginPath(); for (let x = 22; x <= w - 22; x += 3) c.lineTo(x, 34 + Math.sin(x / 4) * 1.6); c.stroke();
  const rows = [[62, '생선구이', '5,000', '#ffffff'], [100, '아이스커피', '1,500', '#ffb3c4'], [138, '레몬에이드', '2,000', '#ffe28a']];
  rows.forEach(([y, name, price, col], i) => {
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1.4;
    if (i === 0) { c.beginPath(); c.ellipse(17, y, 7, 4, 0, 0, 7); c.moveTo(23, y); c.lineTo(28, y - 4); c.lineTo(28, y + 4); c.closePath(); c.stroke(); }
    else if (i === 1) { c.strokeRect(11, y - 5, 10, 11); c.beginPath(); c.arc(21, y, 3.5, -1.4, 1.4); c.stroke(); c.beginPath(); c.moveTo(16, y - 6); c.lineTo(19, y - 12); c.stroke(); }
    else { c.beginPath(); c.ellipse(18, y, 8, 6, 0, 0, 7); c.stroke(); c.beginPath(); c.moveTo(18, y - 6); c.lineTo(18, y + 6); c.moveTo(10, y); c.lineTo(26, y); c.stroke(); }
    fitText(c, name, 34, y, 54, 11, col, { align: 'left' });
    fitText(c, price, w - 10, y + 12, 50, 12, col, { align: 'right' });
  });
  c.fillStyle = '#ffd86b';
  for (const [x, y] of [[24, 160], [64, 168], [104, 158]]) { c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 2.6 : 6, a = k * PI / 5 - HP; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); }
}));
// the post clock: numbers, ticks, hands at twenty to five (the late afternoon this map is lit for)
const clockTex = () => TX.get('s2clock', () => canvasTex(128, 128, (c, w) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, w);
  c.strokeStyle = '#3a3048';
  for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2, r0 = k % 3 ? 48 : 44; c.lineWidth = k % 3 ? 2 : 4; c.beginPath(); c.moveTo(64 + Math.sin(a) * r0, 64 - Math.cos(a) * r0); c.lineTo(64 + Math.sin(a) * 54, 64 - Math.cos(a) * 54); c.stroke(); }
  c.fillStyle = '#3a3048'; c.font = 'bold 17px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const [t, x, y] of [['12', 64, 25], ['3', 103, 64], ['6', 64, 103], ['9', 25, 64]]) c.fillText(t, x, y);
  const hand = (a, L, wd, col) => { c.strokeStyle = col; c.lineWidth = wd; c.lineCap = 'round'; c.beginPath(); c.moveTo(64, 64); c.lineTo(64 + Math.sin(a) * L, 64 - Math.cos(a) * L); c.stroke(); };
  hand((4 + 40 / 60) / 12 * PI * 2, 26, 5, '#3a3048'); hand(40 / 60 * PI * 2, 40, 3, '#3a3048');
  c.fillStyle = '#e8414e'; c.beginPath(); c.arc(64, 64, 5, 0, 7); c.fill();
}));
const dialTex = () => TX.get('s2dial', () => canvasTex(64, 64, (c, w) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, w); c.strokeStyle = '#3a3048';
  for (let k = 0; k < 10; k++) { const a = -2.4 + k / 9 * 4.8; c.lineWidth = k % 3 ? 1.2 : 2.4; c.beginPath(); c.moveTo(32 + Math.sin(a) * 22, 32 - Math.cos(a) * 22); c.lineTo(32 + Math.sin(a) * 27, 32 - Math.cos(a) * 27); c.stroke(); }
  c.strokeStyle = '#e8414e'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(32, 32); c.lineTo(32 + Math.sin(.9) * 22, 32 - Math.cos(.9) * 22); c.stroke();
}));
// the sea seen through the diorama's side: clear water darkening down, foam on top, weed and a few fish, the sand bed
const seaSideTex = () => TX.get('s2seaside', () => rep(canvasTex(512, 128, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8fd8ee'); g.addColorStop(.7, '#5aa8cc'); g.addColorStop(1, '#4b95bd');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,.08)'; for (const x of [40, 170, 300, 420]) { c.beginPath(); c.moveTo(x, 8); c.lineTo(x + 24, 8); c.lineTo(x + 60, 110); c.lineTo(x + 40, 110); c.closePath(); c.fill(); }
  c.lineCap = 'round';
  for (const x0 of [60, 196, 332, 452]) for (const [dx, col, top] of [[0, '#3f9e6a', 60], [9, '#5cbf7f', 76]]) {
    c.strokeStyle = col; c.lineWidth = 5; c.beginPath(); c.moveTo(x0 + dx, 114); for (let y = 114; y > top; y -= 5) c.lineTo(x0 + dx + Math.sin(y / 7 + dx) * 4, y); c.stroke();
  }
  fishFill(c, 130, 54, 1.0, 'rgba(255,255,255,.6)', 1); fishFill(c, 268, 82, .8, '#ffb07a', -1); fishFill(c, 392, 44, .7, 'rgba(255,255,255,.5)', 1);
  c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 1.5; for (const [x, y, r] of [[150, 40, 3], [156, 30, 2], [286, 66, 2.5], [410, 30, 2]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); }
  c.fillStyle = '#e6cd98'; c.beginPath(); c.moveTo(0, 112); for (let x = 0; x <= w; x += 8) c.lineTo(x, 110 + Math.sin(x / w * PI * 6) * 3); c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();
  c.fillStyle = '#b9b2c4'; for (const [x, y] of [[90, 120], [230, 118], [250, 122], [380, 121], [470, 119]]) { c.beginPath(); c.ellipse(x, y, 5, 3, 0, 0, 7); c.fill(); }
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, 3);
  c.fillStyle = 'rgba(255,255,255,.75)'; for (let x = 0; x < w; x += 16) { c.beginPath(); c.arc(x + 8, 3, 6, 0, PI); c.fill(); }
})));
const manholeTex = () => TX.get('s2manhole', () => canvasTex(128, 128, (c, w) => {
  c.fillStyle = '#9a96a6'; c.fillRect(0, 0, w, w);
  c.strokeStyle = '#7d7a8a'; c.lineWidth = 6; c.beginPath(); c.arc(64, 64, 58, 0, 7); c.stroke();
  c.lineWidth = 2; c.beginPath(); c.arc(64, 64, 46, 0, 7); c.stroke();
  c.fillStyle = '#8a8696'; for (let a = 0; a < 24; a++) { const t = a / 24 * PI * 2; c.beginPath(); c.arc(64 + Math.cos(t) * 52, 64 + Math.sin(t) * 52, 2.2, 0, 7); c.fill(); }
  fishFill(c, 60, 64, 2.4, '#b9b5c4', 1);
}));

// ── small life (vertex-coloured, into an mc) ───────────────────────────────────────────────────────────────────────────
// a gull standing (head toward +x before turning)
function gull(addM, x, y, z, ry = 0, s = 1) {
  const A = under(addM, xf(x, y, z, 0, ry, 0, s));
  A(G.sph(.07, 12, 9), '#ffffff', 0, .1, 0, 0, 0, 0, [1.45, .95, 1]);
  for (const sd of [-1, 1]) {
    A(G.sph(.06, 10, 7), '#c9ced8', -.015, .115, sd * .052, 0, 0, -.15, [1.5, .55, .45]);
    A(G.box(.05, .02, .03, .008), '#4a4f5c', -.1, .125, sd * .045, 0, 0, .3);
    A(G.cyl(.006, .006, .07, 5), '#ffb43c', 0, .03, sd * .025);
    A(G.sph(.008, 6, 4), '#2a2230', .112, .19, sd * .03);
  }
  A(G.box(.06, .015, .05, .006), '#c9ced8', -.12, .115, 0, 0, 0, .35);
  A(G.sph(.046, 10, 8), '#ffffff', .085, .175, 0);
  A(G.cone(.016, .065, 6), '#ffb43c', .15, .17, 0, 0, 0, -HP);
}
// a fish lying on its side on ice (head toward -x before turning): body, darker back, pale belly, fan tail, fin, eye
function fishOn(A, x, y, z, ry, L, body, back, stripes = false) {
  const r = L * .27, B2 = (g, c, px, py, pz, rx = 0, r2 = 0, rz = 0, sc = 1) => {
    const cs = Math.cos(ry), sn = Math.sin(ry);
    A(g, c, x + px * cs + pz * sn, y + py, z - px * sn + pz * cs, rx, ry + r2, rz, sc);
  };
  B2(G.sph(r, 12, 8), body, 0, r * .32, 0, 0, 0, 0, [1.75, .45, .85]);
  B2(G.sph(r, 10, 6), back, 0, r * .38, -r * .34, 0, 0, 0, [1.55, .4, .45]);
  B2(G.sph(r * .8, 10, 6), '#f6f3ee', 0, r * .32, r * .32, 0, 0, 0, [1.4, .38, .4]);
  B2(G.cone(r * .9, L * .26, 3), back, L * .52, r * .32, 0, 0, 0, HP, [.3, 1, 1]);
  B2(G.cone(r * .5, L * .2, 3), back, -L * .02, r * .4, -r * .82, 0, PI, HP, [.3, 1, 1]);
  B2(G.sph(r * .22, 8, 6), '#ffffff', -L * .33, r * .6, r * .08);
  B2(G.sph(r * .12, 6, 4), '#2a2230', -L * .345, r * .7, r * .1);
  if (stripes) for (let k = 0; k < 4; k++) B2(G.box(r * .2, r * .08, r * .5, .002), '#2f4f6a', -L * .12 + k * L * .1, r * .55, -r * .2, 0, .5 - (k % 2), 0);
}
function shrimpOn(A, x, y, z, ry = 0) {
  A(G.tor(.045, .022, PI * 1.35, 6, 10), '#ff9b6b', x, y + .012, z, HP - .15, ry, .4);
  A(G.cone(.03, .05, 8), shade('#ff9b6b', -.12), x + .05, y + .014, z - .03, 0, ry, -HP, [.3, 1, 1]);
  A(G.sph(.008, 5, 4), '#3b2a2a', x - .03, y + .032, z + .03);
}
function clamOn(A, x, y, z, ry = 0) {
  A(G.sph(.04, 10, 6), '#efe4d2', x, y + .006, z, 0, ry, 0, [1, .42, .85]);
  for (let k = -1; k <= 1; k++) A(G.box(.006, .006, .055, .002), '#c9b79a', x + k * .014, y + .02, z, 0, ry + k * .3, 0);
}
function parsley(A, x, y, z) { for (let k = 0; k < 4; k++) A(G.sph(.016, 6, 4), k % 2 ? '#5cb45a' : '#7fcf6a', x + Math.cos(k * 1.7) * .014, y + .012 + (k % 2) * .006, z + Math.sin(k * 1.7) * .014); }
function lemonSlice(A, x, y, z) { A(G.cyl(.026, .026, .01, 12), '#fff3a0', x, y + .006, z, .3, 0, 0); A(G.tor(.026, .005, PI * 2, 4, 12), YEL, x, y + .006, z, HP + .3, 0, 0); }

// ── 바닷가 가게 (3×2, gptHero of seashop): the same white two-storey clapboard shop, its doors and spots in the same places ──
B.seashop2 = (f, T) => {
  const W = 2.5, D = 1.5, H1 = 1.25, H2 = 1.05, x0 = 0, z0 = -.2, zf = z0 + D / 2, zb = z0 - D / 2, Ht = H1 + H2, y0 = .1, y1 = y0 + Ht, yc = y0 + Ht / 2;
  const rh = 1.0, half = D / 2 + .2, slope = Math.atan2(rh, half), len = Math.hypot(rh, half);
  // the walls: the clapboard laps on one textured body, the two gables on top (their laps line up), the dormer
  const gable = new THREE.Shape(); gable.moveTo(-D / 2, 0); gable.lineTo(D / 2, 0); gable.lineTo(D / 2, .15); gable.lineTo(0, rh - .06); gable.lineTo(-D / 2, .15); gable.closePath();
  f.add(tm('seashop2-walls', tmat(clapTex()), ({ add }) => {
    add(G.pbox(W, Ht, D), x0, yc, z0, 0, 0, 0, 1, { su: .64 });
    for (const s of [-1, 1]) add(G.ext(gable, .05, 0, 4), x0 + (s < 0 ? -W / 2 : W / 2 - .05), y1, z0, 0, HP, 0, 1, { su: .64, ov: y1 - yc });
    add(G.pbox(.55, .5, .5), x0 - .45, y1 + .38, z0 + .35, 0, 0, 0, 1, { su: .64 });
  }));
  // the roof: slate shingles in courses (the back slope turned round so its courses run down it too)
  f.add(tm('seashop2-roof', tmat(shingleTex()), ({ add }) => {
    for (const s of [-1, 1]) add(G.box(W + .3, .08, len + .05, .02), x0, y1 + rh / 2, z0 + s * half / 2, s * slope, s < 0 ? PI : 0, 0, 1, { su: 1.0, sv: .8 });
  }));
  // the balcony floor boards
  f.add(tm('seashop2-balcony', tmat(woodTex()), ({ add }) => add(G.box(1.5, .05, .42, .01), x0 - .2, 1.55, zf + .21, 0, 0, 0, 1, { su: .54, ou: .1 })));
  f.add(mc('seashop2', ({ add, addM, tube }) => {
    // the stone footing with its joints
    add(G.box(W + .14, .1, D + .14, .02), '#d6d0c8', x0, .05, z0);
    for (let x = -W / 2; x < W / 2 - .1; x += .36) add(G.pbox(.012, .08, .01), '#b9b2a6', x0 + x + .18, .05, zf + .071);
    // corner boards, the band between the floors
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box(.09, Ht + .02, .09, .01), '#ffffff', x0 + sx * W / 2, yc, z0 + sz * D / 2);
    for (const sz of [-1, 1]) add(G.box(W + .06, .07, .04, .01), '#ffffff', x0, y0 + H1 + .04, z0 + sz * (D / 2 + .02));
    for (const sx of [-1, 1]) add(G.box(.04, .07, D + .06, .01), '#ffffff', x0 + sx * (W / 2 + .02), y0 + H1 + .04, z0);
    // the roof trim: a ridge roll, white barge boards on the gable edges, gutters along both eaves, a down pipe at the east front corner
    add(G.cyl(.06, .06, W + .36, 10), shade(BLUE, -.25), x0, y1 + rh + .03, z0, 0, 0, HP);
    for (const sx of [-1, 1]) for (const s of [-1, 1]) add(G.box(.05, .11, len + .07, .015), '#ffffff', x0 + sx * (W / 2 + .175), y1 + rh / 2 - .025, z0 + s * half / 2, s * slope, 0, 0);
    for (const s of [-1, 1]) add(G.cyl(.04, .04, W + .3, 10), '#e6e9ef', x0, y1 - .07, z0 + s * 1.0, 0, 0, HP);
    tube([x0 + 1.33, y1 - .08, z0 + 1.0], [x0 + 1.33, y1 - .32, zf + .06], .03, '#e6e9ef', 8);
    tube([x0 + 1.33, y1 - .32, zf + .06], [x0 + 1.33, .22, zf + .06], .03, '#e6e9ef', 8);
    tube([x0 + 1.33, .22, zf + .06], [x0 + 1.33, .13, zf + .15], .03, '#e6e9ef', 8);
    for (const y of [.6, 1.5]) add(G.box(.08, .03, .06, .01), '#c9ced8', x0 + 1.33, y, zf + .035);
    // a chimney: plaster with bricks showing through, a stone cap, two clay pots
    add(G.box(.24, .55, .24, .02), '#efe8de', x0 + .85, y1 + .85, z0 - .2);
    for (const [bx, by, sz] of [[-.05, -.1, 1], [.06, .08, 1], [-.03, .16, -1], [.04, -.04, -1]]) add(G.box(.08, .045, .01, .005), '#d9886a', x0 + .85 + bx, y1 + .85 + by, z0 - .2 + sz * .121);
    add(G.box(.3, .06, .3, .02), STONE, x0 + .85, y1 + 1.13, z0 - .2);
    for (const dx of [-.05, .06]) add(G.cyl(.04, .035, .1, 10), TERRA, x0 + .85 + dx, y1 + 1.21, z0 - .2);
    // the dormer: its window frame and its little roof
    const dz = z0 + .6;
    add(G.box(.32, .26, .03, .01), '#ffffff', x0 - .45, y1 + .52, dz + .005);
    add(G.box(.3, .02, .02, .005), '#ffffff', x0 - .45, y1 + .52, dz + .03); add(G.box(.02, .22, .02, .005), '#ffffff', x0 - .45, y1 + .52, dz + .03);
    for (const s of [-1, 1]) add(G.box(.36, .05, .45, .01), BLUE2, x0 - .45 + s * .15, y1 + .72, z0 + .35, 0, 0, -s * .7);
    // the shop window: a deep white frame, a transom bar and a mullion, a wide sill (the ledge spot) with a succulent at each end
    const wx = x0 - .6, wy = .62, ww = 1.0, wh = .75;
    add(G.box(ww + .14, .07, .07, .015), '#ffffff', wx, wy + wh / 2 + .035, zf + .035);
    for (const s of [-1, 1]) add(G.box(.07, wh + .07, .07, .015), '#ffffff', wx + s * (ww / 2 + .035), wy, zf + .035);
    add(G.box(ww, .035, .04, .008), '#ffffff', wx, wy + wh * .24, zf + .03);
    add(G.box(.035, wh * .74, .04, .008), '#ffffff', wx, wy - wh * .13, zf + .03);
    add(G.box(ww + .2, .06, .15, .015), '#ffffff', wx, .25, zf + .07);
    for (const s of [-1, 1]) {
      add(G.cyl(.045, .035, .07, 10), TERRA, wx + s * .52, .315, zf + .08);
      for (let k = 0; k < 4; k++) add(G.sph(.028, 7, 5), k % 2 ? '#7fc28a' : '#9bd39a', wx + s * .52 + Math.cos(k * 1.6) * .02, .36 + (k % 2) * .015, zf + .08 + Math.sin(k * 1.6) * .02, 0, 0, 0, [1, 1.3, 1]);
    }
    // the doorway: a warm dark inside, a white casing
    add(G.box(.5, .9, .02, .02), '#4e4048', x0 + .65, .55, zf + .005);
    add(G.box(.64, .07, .06, .015), '#ffffff', x0 + .65, 1.035, zf + .03);
    for (const s of [-1, 1]) add(G.box(.06, .94, .06, .015), '#ffffff', x0 + .65 + s * .29, .56, zf + .03);
    // a lantern on an iron arm between the window and the door
    tube([x0 + .16, 1.3, zf], [x0 + .16, 1.3, zf + .14], .012, DARK, 6);
    add(G.cone(.06, .05, 4), DARK, x0 + .16, 1.27, zf + .14, 0, PI / 4, 0);
    add(G.box(.07, .1, .07, .01), YEL, x0 + .16, 1.19, zf + .14);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.pbox(.012, .1, .012), DARK, x0 + .16 + sx * .035, 1.19, zf + .14 + sz * .035);
    add(G.box(.08, .02, .08, .006), DARK, x0 + .16, 1.135, zf + .14);
    // the awnings: blue-and-white stripes sloping out, a scalloped valance, two iron braces
    const awn = (cx, w) => {
      const n = Math.round(w / .16), sw = w / n;
      for (let k = 0; k < n; k++) {
        const c = k % 2 ? '#ffffff' : BLUE2, x = cx - w / 2 + (k + .5) * sw;
        add(G.box(sw, .035, .56, .006), c, x, 1.3, zf + .27, .45, 0, 0);
        add(G.box(sw, .07, .012, .004), c, x, 1.143, zf + .522);
        add(scal(sw / 2 - .002), c, x, 1.108, zf + .516);
      }
      for (const s of [-1, 1]) tube([cx + s * (w / 2 - .02), 1.0, zf + .01], [cx + s * (w / 2 - .02), 1.16, zf + .5], .01, DARK, 5);
    };
    awn(x0 - .6, 1.15); awn(x0 + .65, .7);
    // the name board under the balcony, the balcony's knee braces
    add(G.box(1.52, .22, .03, .01), shade(BLUE, -.2), x0 - .2, 1.42, zf + .41);
    for (const bx of [-.9, .5]) add(G.box(.05, .05, .4, .01), WOODD, x0 + bx, 1.43, zf + .17, -.56, 0, 0);
    // the balcony rail, front and sides
    add(G.box(1.54, .04, .05, .01), '#ffffff', x0 - .2, 1.86, zf + .41);
    add(G.box(1.52, .03, .03, .006), '#ffffff', x0 - .2, 1.6, zf + .41);
    for (const sx of [-.95, .55]) add(G.box(.05, .04, .44, .01), '#ffffff', x0 + sx, 1.86, zf + .21);
    for (let k = 0; k <= 10; k++) add(G.pbox(.025, .28, .025), '#ffffff', x0 - .95 + k * .15, 1.72, zf + .41);
    for (const sx of [-.95, .55]) for (let k = 0; k < 3; k++) add(G.pbox(.025, .28, .025), '#ffffff', x0 + sx, 1.72, zf + .05 + k * .12);
    // pots on the balcony (as before: the spot is between the pink and the last green)
    for (const [x, c] of [[-.75, RED], [-.35, GREEN], [.1, '#ffb3cf'], [.4, GREEN]]) {
      add(G.cyl(.07, .055, .11, 12), TERRA, x0 + x, 1.63, zf + .25); add(G.tor(.07, .012, PI * 2, 5, 14), shade(TERRA, .1), x0 + x, 1.685, zf + .25, HP, 0, 0);
      for (let k = 0; k < 5; k++) add(G.sph(.045, 8, 6), k % 2 ? GREEN : GREEN2, x0 + x + Math.cos(k * 1.3) * .035, 1.72 + (k % 3) * .015, zf + .25 + Math.sin(k * 1.3) * .035);
      if (c !== GREEN) for (let k = 0; k < 3; k++) add(G.sph(.026, 7, 5), c, x0 + x + Math.cos(k * 2.1 + .5) * .04, 1.775, zf + .25 + Math.sin(k * 2.1 + .5) * .04);
    }
    // the upstairs windows: white frames, glazing bars, sills, louvred blue shutters
    for (const x of [-.6, .65]) {
      add(G.box(.5, .58, .03, .01), '#ffffff', x0 + x, 1.95, zf + .012);
      add(G.box(.46, .025, .025, .006), '#ffffff', x0 + x, 1.95, zf + .034); add(G.box(.025, .54, .025, .006), '#ffffff', x0 + x, 1.95, zf + .034);
      add(G.box(.56, .04, .09, .01), '#ffffff', x0 + x, 1.65, zf + .04);
      for (const s of [-1, 1]) {
        add(G.box(.18, .54, .025, .008), BLUE2, x0 + x + s * .36, 1.95, zf + .02);
        for (let k = 0; k < 6; k++) add(G.box(.15, .012, .01, .003), shade(BLUE2, -.18), x0 + x + s * .36, 1.75 + k * .08, zf + .034);
      }
    }
    // the back: two windows upstairs
    for (const x of [-.6, .65]) { add(G.box(.5, .58, .03, .01), '#ffffff', x0 + x, 1.95, zb - .012); add(G.box(.025, .54, .025, .006), '#ffffff', x0 + x, 1.95, zb - .034); add(G.box(.56, .04, .09, .01), '#ffffff', x0 + x, 1.65, zb - .04); }
    // the gable ends: a shuttered window downstairs, a round window high up
    for (const sx of [-1, 1]) {
      const wxs = x0 + sx * (W / 2 + .012);
      add(G.box(.03, .56, .5, .01), '#ffffff', wxs, .75, z0);
      add(G.box(.025, .52, .025, .006), '#ffffff', wxs + sx * .022, .75, z0); add(G.box(.025, .025, .46, .006), '#ffffff', wxs + sx * .022, .75, z0);
      add(G.box(.09, .04, .56, .01), '#ffffff', wxs + sx * .03, .46, z0);
      for (const s of [-1, 1]) add(G.box(.025, .52, .18, .008), BLUE2, wxs + sx * .005, .75, z0 + s * .35);
      add(G.cyl(.15, .15, .03, 20), '#ffffff', x0 + sx * (W / 2 + .01), y1 + .42, z0, 0, 0, HP);
      add(G.tor(.13, .02, PI * 2, 6, 20), '#ffffff', x0 + sx * (W / 2 + .03), y1 + .42, z0, 0, HP, 0);
    }
    // the east wall: a blue letterbox; the west wall: two floats hung on a peg
    add(G.box(.06, .2, .14, .02), BLUE2, x0 + W / 2 + .04, .95, zf - .12); add(G.box(.01, .02, .09, .004), DARK, x0 + W / 2 + .072, 1.0, zf - .12);
    add(G.box(.04, .06, .02, .006), RED, x0 + W / 2 + .05, 1.08, zf - .2);
    tube([x0 - W / 2 - .01, 1.45, zf - .25], [x0 - W / 2 - .07, 1.45, zf - .25], .012, WOODD, 4);
    for (const [dz2, c] of [[-.05, RED], [.05, YEL]]) { tube([x0 - W / 2 - .06, 1.45, zf - .25], [x0 - W / 2 - .07, 1.27, zf - .25 + dz2], .005, ROPE, 3); add(G.sph(.05, 10, 8), c, x0 - W / 2 - .07, 1.22, zf - .25 + dz2); add(G.cyl(.051, .051, .025, 10), '#ffffff', x0 - W / 2 - .07, 1.22, zf - .25 + dz2); }
    // the fish blade sign at the west front corner: an iron arm, a blue fish hung on two chains
    tube([x0 - 1.21, 2.02, zf], [x0 - 1.21, 2.02, zf + .46], .014, DARK, 6);
    add(G.box(.04, .1, .04, .01), DARK, x0 - 1.21, 2.0, zf + .02);
    for (const z of [.14, .38]) tube([x0 - 1.21, 2.02, zf + z], [x0 - 1.21, 1.93, zf + z], .006, DARK, 4);
    add(G.ext(fishShape(.4, .2), .03, .008, 6), BLUE2, x0 - 1.21 + .015, 1.84, zf + .26, 0, -HP, 0);
    for (const s of [-1, 1]) { add(G.sph(.022, 8, 6), '#ffffff', x0 - 1.21 + s * .026, 1.86, zf + .14); add(G.sph(.011, 6, 4), DARK, x0 - 1.21 + s * .036, 1.862, zf + .135); }
    add(G.cone(.04, .07, 3), YEL, x0 - 1.21, 1.935, zf + .27, 0, 0, 0, [.35, 1, 1]);
    // a fish crate by the door (its lid the spot)
    const cx = x0 + 1.05, cz = .8;
    add(G.box(.34, .03, .26, .006), WOODD, cx, .015, cz);
    for (const s of [-1, 1]) { add(G.box(.34, .16, .025, .006), WOOD, cx, .1, cz + s * .118); add(G.box(.025, .16, .24, .006), WOOD, cx + s * .158, .1, cz); }
    for (let k = 0; k < 3; k++) add(G.box(.11, .02, .25, .005), shade(WOOD, k % 2 ? -.06 : .04), cx - .11 + k * .11, .19, cz);
    add(G.sph(.03, 8, 6), BLUE, cx - .02, .1, cz + .132, 0, 0, 0, [1.6, .8, .3]); add(G.cone(.025, .04, 3), BLUE, cx + .045, .1, cz + .132, 0, 0, HP, [1, 1, .3]);
    for (const s of [-1, 1]) add(G.box(.015, .03, .08, .006), '#7a4c26', cx + s * .172, .13, cz);
  }));
  // the pictures: the shop's inside behind the glass, the name board, the window panes
  f.add(put(mesh(geo('s2-inside', () => new THREE.PlaneGeometry(1.0, .75)), tmat(interiorTex(), { rim: 0 })), x0 - .6, .62, zf + .004));
  for (const [gx, gw] of [[-.82, .07], [-.7, .035]]) f.add(put(mesh(geo('s2-glint|' + gw, () => new THREE.PlaneGeometry(gw, .62)), mat('#ffffff', { opacity: .32, rim: 0 }), { cast: false, recv: false }), x0 + gx, .62, zf + .052, 0, 0, -.5));
  f.add(put(mesh(geo('s2-sign', () => new THREE.PlaneGeometry(1.5, .2)), tmat(signTex(), { rim: 0 })), x0 - .2, 1.42, zf + .4265));
  f.add(tm('seashop2-glass', tmat(winTex(), { rim: .05 }), ({ add }) => {
    for (const x of [-.6, .65]) { add(new THREE.PlaneGeometry(.44, .52), x0 + x, 1.95, zf + .0285, 0, 0, 0, 1, { native: true }); add(new THREE.PlaneGeometry(.44, .52), x0 + x, 1.95, zb - .0285, 0, PI, 0, 1, { native: true }); }
    for (const sx of [-1, 1]) { add(new THREE.PlaneGeometry(.44, .5), x0 + sx * (W / 2 + .0285), .75, z0, 0, sx * HP, 0, 1, { native: true }); add(new THREE.CircleGeometry(.12, 20), x0 + sx * (W / 2 + .0255), y1 + .42, z0, 0, sx * HP, 0, 1, { native: true }); }
    add(new THREE.PlaneGeometry(.26, .2), x0 - .45, y1 + .52, z0 + .6 + .021, 0, 0, 0, 1, { native: true });
  }));
  // the door: four panels, a porthole, a brass knob, the 영업중 card on a string; it opens out
  const dv = grp(); put(dv, x0 + .4, .1, zf + .02); f.add(dv);
  dv.add(mc('seashop2-door', ({ add, tube }) => {
    add(G.box(.48, .88, .04, .02), BLUE2, .24, .44, 0);
    for (const s of [-1, 1]) add(G.box(.16, .24, .012, .006), shade(BLUE2, -.1), .24 + s * .1, .18, .022);
    add(G.cyl(.1, .1, .02, 20), SKY, .24, .66, .016, HP, 0, 0);
    add(G.tor(.1, .018, PI * 2, 6, 20), '#ffffff', .24, .66, .028);
    add(G.sph(.026, 8, 6), GOLD, .42, .44, .035);
    tube([.16, .4, .026], [.24, .5, .026], .004, DARK, 3); tube([.32, .4, .026], [.24, .5, .026], .004, DARK, 3); add(G.sph(.01, 6, 4), GOLD, .24, .5, .03);
  }));
  dv.add(put(mesh(geo('s2-open', () => new THREE.PlaneGeometry(.2, .1)), tmat(openTex(), { rim: 0 })), .24, .355, .027));
  const p = f.part('door', dv, t => { dv.rotation.y = -1.6 * t; }, { label: '가게 문', sfx: 'open', dur: .3 });
  f.pullOut(p, f.spot('inside', null, x0 + .65, .12, z0 + .2, { part: p, maxH: .4, label: '가게 안', scale: .85 }), zf);
  f.spot('on', null, x0 - .6, .3, zf + .06, { maxH: .2, label: '진열창 앞 턱', scale: .55 });
  f.spot('on', null, x0 + .2, 1.58, zf + .25, { maxH: .25, label: '발코니 화분 사이', scale: .6 });
  f.spot('on', null, x0 + 1.05, .205, .8, { maxH: .25, label: '생선 상자 위', scale: .6 });
};

// ── 물 위 데크 (3×2, new type seadeck2 · flagdeck2 on 30판 ★): the same deck on stilts, the same counter, case, barrel and steps ─
B.seadeck2 = (f, T, o = {}) => {
  const y = .4, dev = !!o.device;
  const TX0 = 1.08, TZ = -.6, TR = .15;
  f.add(tm('seadeck2-wood', tmat(woodTex()), ({ add }) => {
    for (let k = 0; k < 11; k++) add(G.box(.27, .05, 2.0, .01), -1.35 + k * .27, y, 0, 0, 0, 0, 1, { su: .54, ou: k * .27 + .135, ov: k * .37 });
    for (let k = 0; k < 3; k++) add(G.box(.62, .05, .24, .01), 1.2, y - .1 - k * .13, 1.1 + k * .22, 0, 0, 0, 1, { su: .54, ou: .2, ov: k * .3 });
  }));
  f.add(tm('seadeck2-barrel', tmat(barrelTex()), ({ add }) => add(barrelGeo(.17, .4), .55, y, .3, 0, 0, 0, 1, { native: true, ru: 2 })));
  f.add(mc('seadeck2' + (dev ? 'd' : ''), ({ add, addM, tube }) => {
    // fascia boards round the open edges
    add(G.box(3.04, .1, .035, .01), WOODD, 0, y - .055, 1.017);
    add(G.box(3.04, .1, .035, .01), WOODD, 0, y - .055, -1.017);
    add(G.box(.035, .1, 2.0, .01), WOODD, -1.517, y - .055, 0);
    // stilts: darker and wet at the water, a rope lashing near the top, barnacles; a brace in each bay, front and back
    const SX = [-1.4, -.3, .8];
    for (const x of SX) for (const z of [-.95, .95]) {
      add(G.cyl(.06, .06, y + .2, 10), WOODD, x, (y - .2) / 2, z);
      add(G.cyl(.064, .064, .14, 10), shade(WOODD, -.28), x, .05, z);
      for (const yy of [.26, .3]) add(G.tor(.064, .013, PI * 2, 5, 14), ROPE, x, yy, z, HP, 0, 0);
      for (let k = 0; k < 3; k++) add(G.sph(.016, 6, 4), '#f4efe6', x + Math.cos(k * 2.1 + z) * .06, .13 + k * .02, z + Math.sin(k * 2.1 + z) * .06);
    }
    for (const z of [-.97, .97]) for (let k = 0; k < 2; k++) tube([SX[k] + .06, .04, z], [SX[k + 1] - .06, .3, z], .022, shade(WOODD, -.1), 6);
    // a tall mooring piling at the front with a rope round it and a gull on top; a cleat; two white fenders on ropes (dark tyres read as
    // the deck's wheels from the start view)
    add(G.cyl(.07, .075, y + .5, 12), WOODD, -.85, (y + .5) / 2 - .05, 1.06);
    add(G.cyl(.075, .075, .03, 12), shade(WOODD, .15), -.85, y + .46, 1.06);
    add(G.cyl(.077, .077, .12, 12), shade(WOODD, -.28), -.85, .03, 1.06);
    for (const yy of [y + .2, y + .24]) add(G.tor(.074, .016, PI * 2, 5, 14), ROPE, -.85, yy, 1.06, HP, 0, 0);
    gull(addM, -.85, y + .475, 1.06, -.6, 1);
    add(G.box(.14, .025, .04, .01), IRON, -.3, y + .04, .9); for (const s of [-1, 1]) add(G.box(.03, .04, .03, .008), IRON, -.3 + s * .04, y + .025, .9);
    for (const x of [.45, -1.15]) { add(G.cap(.045, .1, 4, 10), '#ffffff', x, .25, 1.07); for (const yy of [.185, .315]) add(G.cyl(.03, .03, .03, 10), BLUE2, x, yy, 1.07); tube([x, .33, 1.07], [x, y - .02, 1.04], .008, ROPE, 4); }
    // the counter: white boards with a fish plate on the front, the blue top; a little cabinet under the till; the till
    add(G.box(1.1, .55, .45, .02), WHITE, -.6, y + .3, -.35);
    for (let k = 1; k < 7; k++) add(G.pbox(.008, .5, .006), '#e2dbd0', -1.15 + k * .157, y + .3, -.124);
    add(G.box(1.14, .05, .5, .01), BLUE2, -.6, y + .58, -.35);
    add(G.cyl(.1, .1, .012, 18), '#ffffff', -.6, y + .33, -.118, HP, 0, 0, [1.4, 1, 1]);
    add(G.sph(.035, 10, 6), BLUE, -.62, y + .33, -.108, 0, 0, 0, [1.7, .9, .35]); add(G.cone(.03, .05, 3), BLUE, -.53, y + .33, -.108, 0, 0, HP, [1, 1, .3]);
    add(G.sph(.008, 5, 4), '#ffffff', -.66, y + .34, -.095);
    add(G.box(.34, .55, .42, .02), WHITE, .13, y + .28, -.36);
    add(G.box(.3, .012, .01, .004), '#e2dbd0', .13, y + .4, -.148); add(G.sph(.016, 6, 4), GOLD, .13, y + .45, -.148);
    add(G.box(.36, .04, .44, .01), BLUE2, .13, y + .575, -.36);
    add(G.box(.24, .12, .2, .03), '#f4efe4', .13, y + .655, -.38);
    add(G.box(.2, .07, .02, .01), DARK, .13, y + .74, -.43, -.3, 0, 0); add(G.box(.13, .03, .006, .004), '#9be38f', .13, y + .745, -.418, -.3, 0, 0);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) add(G.box(.03, .015, .03, .006), [RED, YEL, BLUE2, '#ffffff'][(r + k) % 4], .06 + k * .045, y + .72, -.34 + r * .045);
    add(G.cyl(.03, .03, .08, 10), '#ffffff', .22, y + .745, -.46, 0, 0, HP);
    // the lemon barrel: iron hoops, a heap of lemons with leaves, a price card on a stick
    for (const yy of [.07, .33]) add(G.tor(.165, .012, PI * 2, 4, 18), '#6e5a4e', .55, y + yy, .3, HP, 0, 0);
    for (let k = 0; k < 9; k++) { const a = k * 2.4, r = k < 6 ? .1 : .04; add(G.sph(.055, 9, 7), k % 4 ? YEL : '#ffe066', .55 + Math.cos(a) * r, y + .42 + (k >= 6 ? .045 : 0), .3 + Math.sin(a) * r, 0, a, 0, [1.2, 1, 1]); }
    for (const a of [.5, 2.6]) add(G.sph(.03, 6, 4), GREEN, .55 + Math.cos(a) * .07, y + .49, .3 + Math.sin(a) * .07, 0, a, 0, [1.8, .4, .9]);
    tube([.7, y + .3, .45], [.7, y + .57, .45], .006, WOODD, 4);
    // a pot of basil
    add(G.cyl(.12, .095, .2, 14), TERRA, -1.2, y + .1, .6); add(G.tor(.12, .018, PI * 2, 5, 16), shade(TERRA, .1), -1.2, y + .2, .6, HP, 0, 0); add(G.cyl(.105, .105, .01, 14), '#7a5238', -1.2, y + .195, .6);
    for (let k = 0; k < 8; k++) { const a = k * 2.4, r = k ? .07 : 0; add(G.sph(.06, 8, 6), k % 2 ? GREEN : GREEN2, -1.2 + Math.cos(a) * r, y + .27 + (k % 3) * .03, .6 + Math.sin(a) * r, 0, a, 0, [1.2, .8, 1]); }
    // a crab trap lying in the back corner on a board (rings, slats, a float), a coil of rope beside it
    add(G.box(.48, .025, .3, .006), shade(WOODD, .1), TX0, y + .04, TZ);
    for (const dx of [-.2, 0, .2]) add(G.tor(TR, .012, PI * 2, 4, 18), '#3f6f6a', TX0 + dx, y + .05 + TR, TZ, 0, HP, 0);
    for (let k = 0; k < 9; k++) { const a = k / 9 * PI * 2; add(G.cyl(.007, .007, .42, 4), '#4f8a82', TX0, y + .05 + TR + Math.sin(a) * TR, TZ + Math.cos(a) * TR, 0, 0, HP); }
    add(G.sph(.05, 8, 6), '#ff9f43', TX0 + .12, y + .05 + TR * 2 + .045, TZ - .05); tube([TX0 + .12, y + .05 + TR * 2, TZ - .05], [TX0 + .05, y + .05 + TR * 2 + .01, TZ], .005, ROPE, 3);
    for (let k = 0; k < 3; k++) add(G.tor(.09 - k * .012, .02, PI * 2, 5, 16), shade(ROPE, k % 2 ? -.05 : 0), .72, y + .045 + k * .032, -.78, HP, 0, 0);
    tube([.81, y + .05, -.78], [.95, y + .04, -.88], .018, ROPE, 5);
    // the steps down at the front right: stringers, posts with a rope rail (the treads are the boards above)
    for (let k = 0; k < 3; k++) add(G.box(.6, .1, .03, .01), WOODD, 1.2, y - .15 - k * .13, 1.22 + k * .22);
    for (const sx of [-1, 1]) {
      add(G.box(.05, .1, .78, .01), WOODD, 1.2 + sx * .32, y - .2, 1.31, -.52, 0, 0);
      for (const t of [0, 1]) add(G.cyl(.03, .03, .5, 8), WOODD, 1.2 + sx * .32, y + .15 - t * .38, 1.05 + t * .62);
      tube([1.2 + sx * .32, y + .4, 1.05], [1.2 + sx * .32, y + .02, 1.67], .012, ROPE, 4);
    }
    // the bunting pole at the back left (30판 ★'s flag deck brings its own flagpole)
    if (!dev) {
      add(G.cyl(.03, .03, 1.6, 8), '#ffffff', -1.4, y + .8, -.9); add(G.sph(.04, 8, 6), GOLD, -1.4, y + 1.62, -.9);
      for (let k = 0; k < 6; k++) { const t = (k + .5) / 6; add(G.cone(.06, .12, 3), [RED, YEL, BLUE2, '#ffffff'][k % 4], -1.4 + t * 1.4, y + 1.42 - Math.sin(t * PI) * .15, -.9, PI, 0, 0, [1, 1, .2]); }
      tube([-1.4, y + 1.55, -.9], [-.7, y + 1.4, -.9], .006, DARK, 4); tube([-.7, y + 1.4, -.9], [0, y + 1.5, -.9], .006, DARK, 4);
    }
  }));
  // the display case: ice, two red fish, two shrimps, lemon slices and parsley, little price flags (the middle left free: the spot)
  f.add(mc('seadeck2-case', ({ add, addM, tube }) => {
    add(G.box(.9, .06, .38, .01), '#e9f4fa', -.6, y + .63, -.35);
    for (let k = 0; k < 14; k++) add(G.box(.04, .03, .04, .01), k % 3 ? '#f5fbff' : '#dff0f8', -1.0 + (k * .067) % .8, y + .67, -.47 + ((k * 37) % 9) * .028, .3, k, 0);
    const A = under(addM, new THREE.Matrix4());
    fishOn(A, -.93, y + .66, -.36, .2, .16, '#ff7b6b', '#e8504a');
    fishOn(A, -.26, y + .66, -.34, -.2, .16, '#ff7b6b', '#e8504a');
    shrimpOn(A, -.8, y + .66, -.27); shrimpOn(A, -.4, y + .66, -.45, 1);
    lemonSlice(A, -.98, y + .66, -.24); lemonSlice(A, -.21, y + .66, -.46); parsley(A, -.8, y + .66, -.46); parsley(A, -.4, y + .66, -.24);
    for (const x of [-.93, -.26]) tube([x, y + .66, -.5], [x, y + .76, -.5], .004, '#ffffff', 3);
  }));
  for (const [x, s] of [[-.93, '3,000'], [-.26, '4,000']]) f.add(put(mesh(geo('s2-ptag', () => new THREE.PlaneGeometry(.09, .056)), tmat(priceTex(s), { rim: 0 })), x + .045, y + .74, -.498));
  f.add(put(mesh(geo('s2-ptag', () => new THREE.PlaneGeometry(.09, .056)), tmat(priceTex('2,000'), { rim: 0 })), .7, y + .6, .455));
  const lid = grp(); put(lid, -.6, y + .66, -.54); f.add(lid);
  lid.add(mc('seadeck2-case-lid', ({ add }) => {
    add(G.box(.92, .2, .02, .01), '#cfe9f5', 0, .1, 0); add(G.box(.92, .02, .4, .01), '#cfe9f5', 0, .2, .2);
    for (const yy of [.005, .2]) add(G.box(.94, .025, .025, .006), '#ffffff', 0, yy, 0);
    for (const s of [-1, 1]) { add(G.box(.025, .2, .025, .006), '#ffffff', s * .46, .1, 0); add(G.box(.025, .025, .4, .006), '#ffffff', s * .46, .2, .2); }
    add(G.box(.94, .025, .025, .006), '#ffffff', 0, .2, .39);
    add(G.box(.05, .005, .3, .002), '#ffffff', -.25, .212, .2, 0, .5, 0);
  }));
  const p = f.part('lift', lid, t => { lid.rotation.x = -1.1 * t; }, { label: '진열 쇼케이스', sfx: 'lift', dur: .3 });
  f.spot('inside', null, -.6, y + .66, -.35, { part: p, maxH: .12, label: '쇼케이스 안', scale: .55 });
  f.spot('under', null, -.3, y - .38, .4, { maxH: .3, label: '데크 밑', scale: .8 });
  f.spot('beside', null, .82, y + .03, .3, { maxH: .3, label: '레몬 통 옆', scale: .7 });
  f.spot('inside', null, TX0, y + .065, TZ, { maxH: .2, label: '통발 안', scale: .6 });
  if (dev) return;
  // the rowboat tied alongside in the shallows: a painted band, seats, oars across, the outboard, a crate of fish in the bow
  f.add(mc('seadeck2-boat', ({ add, addM, tube }) => {
    const bx = -.55, bz = 1.75, by = 0, HULL = '#c9844e';
    const bowl = r => new THREE.SphereGeometry(r, 20, 8, 0, PI * 2, HP, HP);
    add(bowl(.5), HULL, bx, by + .24, bz, 0, 0, 0, [1.7, .7, .6]);
    add(G.cyl(.46, .46, .03, 24), shade(HULL, .3), bx, by + .12, bz, 0, 0, 0, [1.6, 1, .53]);
    add(G.cyl(.47, .47, .08, 24, true), shade(HULL, .15), bx, by + .2, bz, 0, 0, 0, [1.66, 1, .57]);
    add(G.tor(.5, .03, PI * 2, 6, 28), shade(HULL, -.15), bx, by + .24, bz, HP, 0, 0, [1.7, .6, 1]);
    add(G.tor(.49, .016, PI * 2, 4, 28), BLUE2, bx, by + .17, bz, HP, 0, 0, [1.7, .6, 1]);
    add(G.box(.08, .04, .5, .01), WOOD, bx - .2, by + .19, bz); add(G.box(.08, .04, .5, .01), WOOD, bx + .35, by + .19, bz);
    add(G.box(.26, .2, .26, .03), '#4a4256', bx - .62, by + .3, bz); add(G.box(.28, .05, .28, .02), '#f4efe4', bx - .62, by + .42, bz);
    add(G.cyl(.05, .05, .2, 8), '#4a4256', bx - .62, by + .34, bz + .15, HP, 0, 0); add(G.cyl(.025, .025, .3, 8), '#4a4256', bx - .74, by + .12, bz);
    for (const sd of [-1, 1]) { tube([bx - .45, by + .25, bz + sd * .12], [bx + .45, by + .27, bz + sd * .2], .014, WOOD, 5); add(G.box(.18, .01, .07, .004), WOOD, bx + .52, by + .275, bz + sd * .21, 0, sd * -.08, 0); }
    add(G.box(.2, .1, .16, .01), WOOD, bx + .58, by + .22, bz); for (const dz2 of [-.03, .04]) add(G.cone(.03, .05, 3), '#c9d6e0', bx + .58 + dz2, by + .29, bz + dz2, 0, 0, 0, [1, 1, .3]);
    tube([-.3, y + .05, .9], [bx + .8, by + .26, bz - .12], .012, ROPE, 4);
  }));
  f.spot('inside', null, -.5, .14, 1.75, { maxH: .2, label: '보트 안', scale: .75 });
};

// 깃발 데크 2 (3×2, 30판 ★ — devices.js SWAP.seaside2): the deck above with the flagpole, flag, pinwheel socket, the boat under its
// striped cover and the cat's tail — every piece where the old flag deck has it (p.device 'flagboat', the same f.pin · flag · boat ·
// tail · poleTop · boatIn · flagUp), the boat now with a painted band, oars lashed along its sides and a fender
B.flagdeck2 = (f, T) => {
  B.seadeck2(f, T, { device: true });
  const y = .4, PX = -1.32, PZ = .82, PH = 2.3, BX = -.5, BZ0 = 3.0, BZ1 = 1.72, HULL = '#c9844e';
  const pole = grp(); f.add(pole);
  pole.add(mc('flagdeck2-pole', ({ add, tube }) => {
    add(G.cyl(.035, .045, PH, 10), '#ffffff', PX, y + PH / 2, PZ); add(G.cyl(.09, .1, .08, 12), '#d8d3cc', PX, y + .04, PZ);
    for (let k = 0; k < 4; k++) { const a = k * HP + .4; add(G.sph(.014, 6, 4), IRON, PX + Math.cos(a) * .075, y + .085, PZ + Math.sin(a) * .075); }
    add(G.sph(.05, 10, 8), GOLD, PX, y + PH + .03, PZ); add(G.cyl(.03, .03, .1, 8), '#c9cfe0', PX, y + PH - .06, PZ + .05, HP, 0, 0);
    tube([PX + .05, y + PH - .1, PZ], [PX + .05, y + .3, PZ], .005, ROPE, 3); add(G.box(.04, .08, .03, .01), '#c9cfe0', PX + .06, y + .5, PZ);
    for (let k = 0; k < 3; k++) add(G.tor(.03, .008, PI * 2, 4, 10), ROPE, PX + .06, y + .44 - k * .02, PZ, HP, 0, 0);
  }));
  const flag = grp(); put(flag, PX + .06, y + .3, PZ); pole.add(flag);
  flag.add(live(mc('flagdeck2-flag', ({ add }) => {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) add(G.box(.14, .14, .012, .004), (r + c) % 2 ? '#e8414e' : '#ffffff', .1 + c * .14, .21 - r * .14, 0);
  })));
  flag.scale.set(.25, .7, 1);
  const pin = grp(); put(pin, PX, y + PH - .06, PZ + .12); pin.visible = false; pole.add(pin);
  pin.add(live(mc('flagdeck2-pin', ({ add }) => { for (let k = 0; k < 4; k++) { const a = k * HP; add(G.box(.12, .12, .01, .01), ['#ff8fb8', '#ffd86b', '#8fd3f4', '#9be38f'][k], Math.cos(a) * .07, Math.sin(a) * .07, 0, 0, 0, a + PI / 4, [1, .6, 1]); } add(G.sph(.025, 8, 6), '#ffffff', 0, 0, .01); })));
  const boat = grp(); put(boat, BX, 0, BZ0); f.add(boat);
  boat.add(live(mc('flagdeck2-boat', ({ add, tube }) => {
    const bowl = r => new THREE.SphereGeometry(r, 20, 8, 0, PI * 2, HP, HP);
    add(bowl(.5), HULL, 0, .24, 0, 0, 0, 0, [1.7, .7, .6]); add(G.cyl(.46, .46, .03, 24), '#e8c49a', 0, .12, 0, 0, 0, 0, [1.6, 1, .53]);
    add(G.tor(.5, .03, PI * 2, 6, 28), '#a86a3a', 0, .24, 0, HP, 0, 0, [1.7, .6, 1]); add(G.box(.08, .04, .5, .01), WOOD, .35, .19, 0);
    add(G.tor(.49, .016, PI * 2, 4, 28), BLUE2, 0, .17, 0, HP, 0, 0, [1.7, .6, 1]);
    for (let k = 0; k < 4; k++) add(G.sph(.04, 8, 6), '#ffffff', -.6 + k * .4, .26, .3, 0, 0, 0, [1, .5, .5]);
    for (const sd of [-1, 1]) { tube([-.62, .27, sd * .33], [.55, .27, sd * .33], .013, WOOD, 5); add(G.box(.16, .012, .06, .004), WOOD, .62, .27, sd * .33); }
    add(G.cyl(.04, .04, .16, 10), '#ffffff', .45, .14, .31, 0, 0, HP); tube([.38, .24, .3], [.38, .16, .32], .004, ROPE, 3);
    tube([.82, .26, 0], [.98, .3, -.1], .012, ROPE, 4);
  })));
  const cover = grp(); put(cover, 0, .26, -.28); boat.add(cover);
  cover.add(mc('flagdeck2-cover', ({ add, tube }) => {
    for (let k = 0; k < 6; k++) add(G.box(.22, .05, .56, .02), k % 2 ? '#ffffff' : '#3f8fd0', -.55 + k * .22, .08 + Math.sin((k + .5) / 6 * PI) * .1, .28);
    for (const s of [-1, 1]) add(G.box(1.32, .14, .02, .01), '#3f8fd0', 0, .02, .28 + s * .28);
    for (const x of [-.35, .3]) tube([x, .18, 0], [x, .19, .56], .008, ROPE, 4);
  }));
  const p = f.part('lift', cover, (t, b) => { cover.rotation.x = -1.25 * t; cover.position.y = b.p.y + .08 * t; }, { label: '보트 덮개', sfx: 'lift', dur: .34 });
  f.spot('inside', boat, -.1, .14, 0, { part: p, maxH: .36, label: '보트 덮개 밑', scale: .85 });
  const tail = grp(); put(tail, .5, .3, .2); tail.visible = false; boat.add(tail);
  tail.add(live(mc('flagdeck2-tail', ({ add }) => { add(G.tor(.09, .035, PI * 1.3, 6, 14), '#f2d2a8', 0, .08, 0, 0, 0, -.5); add(G.sph(.04, 8, 6), '#ffffff', .07, .15, 0); })));
  p.pivots.push(pole);
  p.device = 'flagboat';
  Object.assign(f, { pin, flag, boat, tail, poleTop: new THREE.Vector3(PX, y + PH - .3, PZ), boatIn: BZ1, boatOut: BZ0, flagUp: y + PH - .42 });
};

// ── 해산물 좌판 (2×1, gptHero of fishstall): two fish boxes on wooden trestles, the price card between, a scale hung behind ──
B.fishstall2 = (f, T) => {
  const tags = [];
  f.add(mc('fishstall2', ({ add, addM, tube }) => {
    for (const [x, kind] of [[-.48, 0], [.48, 1]]) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) add(G.box(.045, .55, .045, .01), WOOD, x + sx * .36, .26, sz * .2, sz * .2, 0, 0);
        add(G.box(.045, .04, .42, .01), WOODD, x + sx * .36, .2, 0);
      }
      // the box leans to the front; everything on it is in its own frame (its top at .07, the ice at .11)
      const M = xf(x, .55, 0, -.15, 0, 0), A = under(addM, M);
      A(G.box(.86, .14, .62, .02), '#ffffff');
      A(G.box(.86, .035, .006, .002), BLUE2, 0, -.02, .312);
      for (const s of [-1, 1]) A(G.box(.006, .035, .12, .004), '#c9d3dd', s * .431, .02, 0);
      A(G.box(.8, .04, .56, .01), '#e9f4fa', 0, .07, 0);
      for (const [ix, iz] of [[-.36, .22], [.33, .22], [.05, -.24], [-.14, .24], [.36, -.2], [-.34, -.23], [.15, .0], [-.05, .02]]) A(G.box(.045, .04, .045, .012), '#f5fbff', ix, .1, iz, .3, ix * 4, 0);
      if (kind === 0) {
        for (const fx of [-.25, 0, .25]) fishOn(A, fx, .09, -.12, fx * .6, .22, '#ff7b6b', '#e8504a');
        for (const fx of [-.27, -.09, .09, .27]) shrimpOn(A, fx, .09, .13, fx);
      } else {
        for (const fx of [-.25, 0, .25]) fishOn(A, fx, .09, -.12, -fx * .6, .22, '#a9c7d8', '#3f6f8f', true);
        for (const fx of [-.3, -.15, 0, .15, .3]) clamOn(A, fx, .09, .14, fx * 3);
      }
      lemonSlice(A, -.36, .09, -.02); lemonSlice(A, .37, .09, .03); parsley(A, -.37, .09, .2); parsley(A, .37, .09, -.22);
      for (const [tx, tz] of [[.33, -.25], [-.33, .26]]) { A(G.cyl(.004, .004, .1, 4), '#ffffff', tx, .15, tz); tags.push([M.clone().multiply(xf(tx, .21, tz)), kind ? (tz < 0 ? '2,000' : '5,000') : (tz < 0 ? '3,000' : '4,000')]); }
    }
    // the scale hung behind the middle: a pole, an arm, the dial, the pan with a fish in it
    add(G.cyl(.022, .026, 1.3, 8), WOODD, 0, .65, -.36);
    add(G.box(.03, .03, .3, .008), WOODD, 0, 1.28, -.22);
    tube([0, 1.265, -.1], [0, 1.16, -.1], .006, IRON, 4);
    add(G.cyl(.075, .075, .045, 18), '#ffffff', 0, 1.09, -.1, HP, 0, 0); add(G.tor(.075, .012, PI * 2, 5, 18), RED, 0, 1.09, -.077);
    for (const a of [0, 2.1, 4.2]) tube([0, 1.015, -.1], [Math.cos(a) * .08, .925, -.1 + Math.sin(a) * .08], .004, IRON, 3);
    add(G.cyl(.1, .085, .025, 16), '#d9dee8', 0, .915, -.1);
    fishOn(under(addM, new THREE.Matrix4()), 0, .925, -.1, .4, .15, '#c9d6e0', '#6f8fa8');
    // the price card's holder between the boxes (as before)
    add(G.box(.26, .2, .02, .01), DARK, 0, .85, .22, -.3, 0, 0);
  }));
  for (const [M, s] of tags) { const m = mesh(geo('s2-ptag', () => new THREE.PlaneGeometry(.09, .056)), tmat(priceTex(s), { rim: 0 })); m.applyMatrix4(M); f.add(m); }
  f.add(put(mesh(geo('s2-dial', () => new THREE.CircleGeometry(.064, 20)), tmat(dialTex(), { rim: 0 })), 0, 1.09, -.0765));
  f.add(put(mesh(geo('s2-bigprice', () => new THREE.PlaneGeometry(.24, .18)), tmat(priceTex('3,000', true), { rim: 0 })), 0, .853, .232, -.3, 0, 0));
  f.spot('under', null, -.48, 0, 0, { maxH: .36, label: '좌판 밑', scale: .8 });
  f.spot('under', null, .48, 0, 0, { maxH: .36, label: '좌판 밑', scale: .8 });
};

// ── 나무 통 (1×1, gptHero of barrels): three bellied barrels of staves with iron hoops; the front one's lid lifts (the padlock) ─
B.barrels2 = (f, T) => {
  const BAR = [[-.2, -.15, .5, .175], [.22, -.12, .42, .17], [0, .24, .38, .155]];
  f.add(tm('barrels2-staves', tmat(barrelTex()), ({ add }) => { for (const [x, z, h, r] of BAR) add(barrelGeo(r, h), x, 0, z, 0, 0, 0, 1, { native: true, ru: 2 }); }));
  f.add(mc('barrels2', ({ add, tube }) => {
    BAR.forEach(([x, z, h, r], i) => {
      for (const yy of [.07, h - .07]) add(G.tor(r * .95, .013, PI * 2, 4, 18), '#6e5a4e', x, yy, z, HP, 0, 0);
      if (i < 2) {
        add(G.tor(r * 1.02, .011, PI * 2, 4, 18), '#6e5a4e', x, h * .5, z, HP, 0, 0);
        add(G.cyl(r * .9, r * .9, .02, 16), WOOD, x, h - .005, z);
        for (const d of [-.05, .05]) add(G.box(r * 1.6, .004, .006, .002), shade(WOOD, -.2), x, h + .006, z + d);
      }
    });
    for (let k = 0; k < 3; k++) add(G.tor(.1 - k * .014, .022, PI * 2, 5, 16), shade(ROPE, k % 2 ? -.05 : 0), -.2, .52 + k * .035, -.15, HP, 0, 0);
  }));
  const lid = grp(); put(lid, 0, .38, .1); f.add(lid);
  lid.add(mc('barrels2-lid', ({ add }) => { add(G.cyl(.15, .15, .03, 16), WOOD, 0, .015, .14); for (const d of [-.05, .05]) add(G.box(.25, .004, .006, .002), shade(WOOD, -.2), 0, .031, .14 + d); add(G.box(.05, .02, .03, .006), '#6e5a4e', 0, .04, .14); }));
  const up = grp(); put(up, 0, .2, .24); f.add(up);
  up.add(mc('barrels2-straw', ({ add }) => { add(G.cyl(.13, .12, .03, 12), '#e8c97a', 0, .015, 0); for (let k = 0; k < 5; k++) add(G.sph(.05, 7, 5), k % 2 ? '#f0d58c' : '#dcb766', Math.cos(k * 1.3) * .07, .03, Math.sin(k * 1.3) * .07, 0, 0, 0, [1, .4, 1]); }));
  const p = f.part('lift', [lid, up], (t, bl, bu) => { lid.rotation.x = -1.3 * t; up.position.y = bu.p.y + .3 * t; }, { label: '나무 통 뚜껑', sfx: 'lift', dur: .28 });
  p.lockable = true; p.lockKind = 'pad'; f.lockAt = { x: 0, y: .27, z: .4 };
  f.spot('inside', up, 0, .04, 0, { part: p, maxH: .14, label: '나무 통 안', scale: .55 });
  f.spot('on', null, .22, .44, -.12, { maxH: .2, label: '나무 통 위', scale: .6 });
};

// ── 파라솔 테이블 (1×1, gptHero of cafeumbrella): a plank top, a scalloped parasol, two stools; o.k = which table setting ────
B.cafeumbrella2 = (f, T, o = {}) => {
  const k2 = o.k || 0;
  f.add(tm('cafe2-top', tmat(woodTex()), ({ add }) => add(G.cyl(.3, .3, .04, 22), 0, .58, 0, 0, 0, 0, 1, { su: .54, ou: .135 })));
  f.add(mc('cafeumbrella2-' + k2, ({ add, addM, tube }) => {
    add(G.tor(.3, .012, PI * 2, 4, 26), WOODD, 0, .58, 0, HP, 0, 0);
    add(G.cyl(.03, .04, .56, 8), WOODD, 0, .29, 0);
    for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + .3; add(G.box(.24, .03, .05, .01), WOODD, Math.cos(a) * .1, .015, Math.sin(a) * .1, 0, -a, 0); }
    add(G.cyl(.02, .02, 1.5, 8), '#ffffff', 0, 1.1, 0);
    for (let k = 0; k < 8; k++) add(new THREE.ConeGeometry(.62, .32, 3, 1, false, k * PI / 4, PI / 4), k % 2 ? '#ffffff' : SKY, 0, 1.78, 0);
    for (let i = 0; i < 16; i++) {
      const a = (i + .5) * PI / 8, th = ((HP - a) % (2 * PI) + 2 * PI) % (2 * PI), c = Math.floor(th / (PI / 4)) % 2 ? '#ffffff' : SKY;
      add(scal(.11), c, Math.cos(a) * .61, 1.625, Math.sin(a) * .61, 0, HP - a, 0);
    }
    for (let k = 0; k < 8; k++) { const th = k * PI / 4; add(G.sph(.022, 6, 4), '#ffffff', Math.sin(th) * .62, 1.62, Math.cos(th) * .62); }
    add(G.sph(.045, 8, 6), '#ffffff', 0, 1.97, 0);
    for (const a of k2 ? [4.0, 5.6] : [.6, 3.6]) {
      const x = Math.cos(a) * .42, z = Math.sin(a) * .42;
      add(G.cyl(.13, .12, .05, 14), RED, x, .38, z); add(G.tor(.125, .012, PI * 2, 4, 16), '#ffffff', x, .405, z, HP, 0, 0);
      for (let k = 0; k < 3; k++) { const b = k / 3 * PI * 2; tube([x + Math.cos(b) * .07, .36, z + Math.sin(b) * .07], [x + Math.cos(b) * .1, 0, z + Math.sin(b) * .1], .012, WOODD, 5); }
      add(G.tor(.085, .008, PI * 2, 4, 14), WOODD, x, .14, z, HP, 0, 0);
    }
    // the menu card on its little stand
    const AM = under(addM, xf(-.17, .655, -.08, 0, .5, 0));
    AM(G.box(.13, .1, .008, .003), '#ffffff', 0, 0, 0, -.15, 0, 0); AM(G.box(.08, .012, .05, .004), WOODD, 0, -.049, 0);
    if (k2 === 0) {
      // a coffee cup on its saucer; a plate with a fish-shaped bun (붕어빵)
      add(G.cyl(.06, .05, .012, 16), '#ffffff', .12, .606, .1); add(G.cyl(.04, .034, .06, 14), '#ffffff', .12, .642, .1); add(G.cyl(.035, .035, .004, 14), '#8a5a3a', .12, .671, .1);
      add(G.tor(.02, .006, PI * 2, 4, 10), '#ffffff', .165, .645, .1);
      add(G.cyl(.08, .07, .012, 18), '#ffffff', .04, .606, -.16);
      add(G.ext(fishShape(.13, .075), .025, .008, 6), '#e0a050', .04, .615, -.16, -HP, .4, 0);
      add(G.sph(.008, 5, 4), '#6e4a2a', -.005, .655, -.145);
    } else {
      // a little teapot and a cup
      add(G.sph(.06, 12, 9), '#ffffff', .08, .66, -.1, 0, 0, 0, [1, .85, 1]); add(G.cyl(.03, .035, .02, 10), '#ffffff', .08, .71, -.1); add(G.sph(.012, 6, 4), SKY, .08, .725, -.1);
      add(G.cone(.018, .07, 8), '#ffffff', .15, .67, -.1, 0, 0, -1.0); add(G.tor(.03, .007, PI * 2, 4, 10), '#ffffff', .015, .665, -.1);
      add(G.tor(.06, .006, PI * 2, 4, 18), SKY, .08, .66, -.1, HP, 0, 0);
      add(G.cyl(.05, .045, .01, 14), '#ffffff', .15, .605, .12); add(G.cyl(.032, .028, .045, 12), '#ffffff', .15, .632, .12); add(G.cyl(.028, .028, .004, 12), '#e8b06a', .15, .653, .12);
    }
  }));
  const card = mesh(geo('s2-menu', () => new THREE.PlaneGeometry(.12, .09)), tmat(menuTex(), { rim: 0 }));
  card.applyMatrix4(xf(-.17, .655, -.08, 0, .5, 0).multiply(xf(0, 0, 0, -.15, 0, 0)).multiply(xf(0, 0, .0045))); f.add(card);
  // what stops a walker: the table and the two stools, not the box round the parasol overhead (30판's corner past the two tables
  // was a one-cell island for the boss runner — walk.mjs raised)
  const bodies = [[-.31, 0, -.31, .31, .62, .31], ...(k2 ? [4.0, 5.6] : [.6, 3.6]).map(a => { const x = Math.cos(a) * .42, z = Math.sin(a) * .42; return [x - .14, 0, z - .14, x + .14, .42, z + .14]; })];
  f.walkSolids = bodies; f.walkBoxes = bodies;
  f.spot('under', null, 0, 0, 0, { maxH: .5, label: '파라솔 테이블 밑', scale: .8 });
  f.spot('on', null, -.12, .6, .14, { maxH: .18, label: '파라솔 테이블 위', scale: .55 });
};

// ── 칠판 메뉴판 (1×1, gptHero of chalksign): an A-frame (its two leaves meeting at a hinge on top), a chalk tray, the menu ────
B.chalksign2 = (f, T) => {
  const leafM = s => xf(0, .34, s * .085, -s * .18, 0, 0);
  f.add(mc('chalksign2', ({ add, addM, tube }) => {
    for (const s of [-1, 1]) {
      const A = under(addM, leafM(s));
      A(G.box(.42, .58, .02, .005), '#2f3a36', 0, .02, 0);
      A(G.box(.5, .05, .045, .012), WOOD, 0, .335, 0); A(G.box(.5, .05, .045, .012), WOOD, 0, -.295, 0);
      for (const sx of [-1, 1]) A(G.box(.045, .7, .045, .012), WOOD, sx * .228, 0, 0);
      for (const yy of [.335, -.295]) A(G.box(.42, .004, .004, .001), shade(WOOD, -.18), 0, yy + .01, s * .0235);
      if (s > 0) { A(G.box(.4, .025, .06, .006), WOODD, 0, -.255, .03); for (const [cx, c] of [[-.1, '#ffffff'], [-.02, '#ffb3c4'], [.08, '#ffe28a']]) A(G.cyl(.008, .008, .06, 6), c, cx, -.235, .035, 0, 0, HP); }
    }
    add(G.cyl(.015, .015, .5, 8), IRON, 0, .68, 0, 0, 0, HP);
    for (const sx of [-1, 1]) tube([sx * .2, .25, -.08], [sx * .2, .25, .08], .004, IRON, 3);
  }));
  const face = mesh(geo('s2-chalk', () => new THREE.PlaneGeometry(.4, .55)), tmat(chalkTex2(), { rim: 0 }));
  face.applyMatrix4(leafM(1).multiply(xf(0, .02, .0115))); f.add(face);
  f.spot('behind', null, 0, 0, -.32, { maxH: .3, label: '칠판 뒤', scale: .7 });
};

// ── 구명 튜브 시계 기둥 (1×1, gptHero of ringpost): the white post, its clock with numbers, the ring, the lantern, a gull on top ─
B.ringpost2 = (f, T) => {
  f.add(mc('ringpost2', ({ add, addM, tube }) => {
    add(G.cyl(.06, .07, 2.4, 12), '#ffffff', 0, 1.2, -.1);
    add(G.cyl(.15, .17, .1, 14), '#d6d0c8', 0, .05, -.1);
    for (let k = 0; k < 4; k++) { const a = k * HP + .4; add(G.sph(.018, 6, 4), IRON, Math.cos(a) * .12, .1, -.1 + Math.sin(a) * .12); }
    for (let k = 0; k < 5; k++) add(G.tor(.073, .016, PI * 2, 5, 14), shade(ROPE, k % 2 ? -.06 : 0), 0, .18 + k * .03, -.1, HP, 0, 0);
    add(G.cyl(.075, .065, .06, 12), '#d6d0c8', 0, 2.42, -.1);
    tube([0, 2.2, -.1], [.45, 2.2, -.1], .02, DARK, 6); tube([.4, 2.2, -.1], [.4, 2.17, -.1], .012, DARK, 4);
    add(G.cyl(.18, .18, .07, 20), '#ffffff', .4, 2.0, -.1, HP, 0, 0);
    for (const dz of [.04, -.04]) add(G.tor(.18, .022, PI * 2, 6, 20), DARK, .4, 2.0, -.1 + dz);
    for (let k = 0; k < 8; k++) add(G.tor(.2, .065, PI / 4, 6, 4), k % 2 ? '#ffffff' : RED, 0, 1.45, 0, 0, 0, k * PI / 4);
    tube([0, 1.66, -.06], [0, 1.72, -.1], .008, ROPE, 3);
    tube([0, 1.12, -.1], [-.3, 1.12, -.1], .012, DARK, 4);
    add(G.cone(.07, .06, 4), DARK, -.3, 1.085, -.1, 0, PI / 4, 0); add(G.box(.08, .12, .08, .02), YEL, -.3, .99, -.1);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.pbox(.012, .12, .012), DARK, -.3 + sx * .04, .99, -.1 + sz * .04);
    add(G.box(.09, .02, .09, .006), DARK, -.3, .925, -.1);
    gull(addM, 0, 2.45, -.1, .7, 1);
  }));
  f.add(put(mesh(geo('s2-clock', () => new THREE.CircleGeometry(.16, 24)), tmat(clockTex(), { rim: 0 })), .4, 2.0, -.1 + .0365));
  f.spot('behind', null, 0, 0, -.38, { maxH: .35, label: '기둥 뒤', scale: .75 });
};

// ── 모래성 (1×1, new): a little sandcastle on the beach, a bucket on its side, a spade stuck in the sand ───────────────────
B.sandcastle2 = (f, T) => {
  const SA = '#e6c78e', SA2 = '#dcbb80';
  f.add(mc('sandcastle2', ({ add, tube }) => {
    add(G.sph(.36, 16, 8), SA2, 0, -.02, 0, 0, 0, 0, [1, .22, .8]);
    add(G.cyl(.1, .115, .24, 14), SA, 0, .13, -.06);
    for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; add(G.box(.04, .04, .04, .01), SA, Math.cos(a) * .09, .27, -.06 + Math.sin(a) * .09, 0, -a, 0); }
    for (const s of [-1, 1]) {
      add(G.cyl(.065, .075, .16, 12), SA, s * .17, .09, .04);
      for (let k = 0; k < 5; k++) { const a = k / 5 * PI * 2; add(G.box(.03, .03, .03, .008), SA, s * .17 + Math.cos(a) * .055, .185, .04 + Math.sin(a) * .055); }
      add(G.box(.12, .1, .05, .01), SA, s * .09, .06, .07, 0, s * .4, 0);
    }
    add(G.box(.06, .08, .02, .02), '#a0825a', 0, .06, .052);
    tube([0, .25, -.06], [0, .42, -.06], .006, '#ffffff', 4); add(G.box(.08, .05, .008, .004), RED, .04, .4, -.06);
    for (const [x, y, z, c] of [[-.05, .18, .05, '#ffd9e6'], [.16, .12, .11, '#ffffff'], [-.18, .1, .11, '#ffd9e6']]) add(G.sph(.016, 6, 4), c, x, y, z, 0, 0, 0, [1, .6, .5]);
    add(G.cyl(.075, .058, .13, 14), BLUE2, .27, .065, .24, 0, .5, HP); add(G.cyl(.06, .06, .005, 14), shade(BLUE2, -.3), .21, .065, .273, 0, .5, HP);
    add(G.tor(.07, .006, PI, 4, 10), '#ffffff', .27, .1, .24, 0, .5, 0);
    add(G.cyl(.012, .012, .26, 6), YEL, .3, .13, -.18, .35, 0, .25); add(G.box(.07, .09, .012, .01), YEL, .34, .02, -.22, .35, 0, .25);
  }));
  f.spot('beside', null, -.32, 0, -.12, { maxH: .3, label: '모래성 옆', scale: .7 });
};

// ── 바닷가 풍경 (new, placed at the room's middle; takes no tiles and stops nobody): the water's edge, the beach's small things,
// the quay's stone face and paving, the sea seen through the diorama's sides. Room-local metres: the shallows x -4..-1, z -3.5..1.5
// (the deck over their back two metres), the beach x -4..-1, z 1.5..3.5 and the strip x -1..0, z -1.5..3.5, the quay x 0..4 (.26 up) ─
B.sea2scene = (f, T) => {
  f.noSolid = true; f.noOccupied = true;
  const yw = .011;
  // foam where the shallows meet the sand (a bright line and a fainter broken one further out), ripples round the stilts and the
  // piling, glints, a shoal's shadow
  const bright = [], faint = [], glint = [];
  const line = (a, b, n, fn) => { const pts = []; for (let i = 0; i <= n; i++) pts.push(fn(a + (b - a) * i / n)); return pts; };
  bright.push(ribbon(line(-4, -1.02, 40, x => [x, 1.46 + Math.sin(x * 6.3) * .025]), .07, yw));
  bright.push(ribbon(line(-1.5, 1.46, 40, z => [-1.05 + Math.sin(z * 6.1 + 1) * .022, z]), .065, yw));
  for (const [a, b] of [[-3.9, -3.3], [-3.0, -2.2], [-1.9, -1.3]]) faint.push(ribbon(line(a, b, 10, x => [x, 1.28 + Math.sin(x * 5 + 1) * .035]), .03, yw));
  for (const [a, b] of [[-1.3, -.5], [-.1, .7], [1.0, 1.3]]) faint.push(ribbon(line(a, b, 10, z => [-1.24 + Math.sin(z * 5) * .03, z]), .03, yw));
  const ring = (x, z, r) => ribbon(line(0, PI * 2, 24, t => [x + Math.cos(t) * r, z + Math.sin(t) * r * .85]), .016, yw);
  for (const x of [-3.9, -2.8, -1.7]) { faint.push(ring(x, -1.55, .12)); faint.push(ring(x, -1.55, .2)); }
  faint.push(ring(-3.35, 1.06 - 2.5, .12)); faint.push(ring(-3.35, -1.44, .2));
  for (const [x, z, a] of [[-3.6, -.9, .2], [-2.4, -.3, -.3], [-1.6, .2, .1], [-3.1, .9, -.2], [-2.0, 1.0, .3], [-1.4, -1.1, 0], [-3.7, .3, .4], [-2.7, .4, -.1]])
    glint.push(ribbon(line(-1, 1, 6, t => [x + t * .12 * Math.cos(a), z + t * .12 * Math.sin(a) + (1 - t * t) * .03]), .02, yw + .001));
  f.add(mesh(geo('s2scene-foam', () => flatMerge(bright)), mat('#ffffff', { opacity: .85, side: THREE.DoubleSide, rim: 0 }), { cast: false, recv: false }));
  f.add(mesh(geo('s2scene-foam2', () => flatMerge(faint)), mat('#ffffff', { opacity: .5, side: THREE.DoubleSide, rim: 0 }), { cast: false, recv: false }));
  f.add(mesh(geo('s2scene-glint', () => flatMerge(glint)), mat('#ffffff', { opacity: .75, side: THREE.DoubleSide, rim: 0 }), { cast: false, recv: false }));
  f.add(mesh(geo('s2scene-shoal', () => flatMerge([[-2.05, .85, .1], [-1.8, 1.05, -.1], [-2.25, 1.08, .05], [-1.95, 1.22, .2]].map(([x, z, a]) => new THREE.ShapeGeometry(fishShape(.2, .09)).rotateX(-HP).rotateY(a + PI).translate(x, yw - .002, z)))),
    mat('#2f7fa0', { opacity: .28, side: THREE.DoubleSide, rim: 0 }), { cast: false, recv: false }));
  // 냥냥이's paw prints across the sand, wet patches by the fish stall, a chalk cat on the quay
  const paws = [], wet = [], chalk = [];
  [[-3.75, 1.95, .5], [-3.45, 2.2, .7], [-3.15, 2.35, .6], [-2.85, 2.55, .8], [-1.95, 2.95, .9], [-1.65, 3.2, .8]].forEach(([x, z, a], i) => {
    const s = i % 2 ? 1 : -1, px = x + Math.sin(a) * .04 * s, pz = z - Math.cos(a) * .04 * s;
    paws.push(new THREE.CircleGeometry(.035, 12).rotateX(-HP).scale(1, 1, .8).translate(px, .008, pz));
    for (let k = -1; k <= 1; k++) paws.push(new THREE.CircleGeometry(.014, 8).rotateX(-HP).translate(px + Math.cos(a) * .05 + Math.sin(a) * k * .025, .008, pz + Math.sin(a) * .05 - Math.cos(a) * k * .025));
  });
  for (const [x, z, w, d] of [[.45, 1.6, .26, .12], [1.5, 1.62, .3, .1], [.95, 1.75, .12, .06]]) wet.push(new THREE.CircleGeometry(.5, 16).rotateX(-HP).scale(w, 1, d).translate(x, .267, z));
  const cx = .5, cz = 2.05, Y = .268;
  chalk.push(ribbon(line(0, PI * 2, 28, t => [cx + Math.cos(t) * .2, cz + Math.sin(t) * .17]), .018, Y));
  for (const s of [-1, 1]) {
    chalk.push(ribbon([[cx + s * .1, cz - .13], [cx + s * .17, cz - .27], [cx + s * .19, cz - .1]], .018, Y));
    chalk.push(ribbon([[cx + s * .21, cz + .03], [cx + s * .33, cz]], .012, Y)); chalk.push(ribbon([[cx + s * .21, cz + .07], [cx + s * .33, cz + .09]], .012, Y));
    chalk.push(new THREE.CircleGeometry(.018, 8).rotateX(-HP).translate(cx + s * .07, Y, cz - .02));
  }
  chalk.push(ribbon(line(-1, 1, 8, t => [cx + t * .05, cz + .07 + Math.abs(t) * .025]), .014, Y));
  f.add(mesh(geo('s2scene-paws', () => flatMerge(paws)), mat('#b4925e', { opacity: .4, side: THREE.DoubleSide, rim: 0 }), { cast: false, recv: false }));
  f.add(mesh(geo('s2scene-wet', () => flatMerge(wet)), mat('#8fa6bd', { opacity: .28, side: THREE.DoubleSide, rim: 0 }), { cast: false, recv: false }));
  f.add(mesh(geo('s2scene-chalk', () => flatMerge(chalk)), mat('#ffffff', { opacity: .72, side: THREE.DoubleSide, rim: 0 }), { cast: false, recv: false }));
  // the manhole on the quay (a fish cast in its lid)
  f.add(put(mesh(geo('s2-manhole', () => new THREE.CircleGeometry(.2, 24)), tmat(manholeTex(), { rim: 0 }), { cast: false }), 1.55, .267, 2.15, -HP, 0, 0));
  // the sea through the diorama's west and north sides
  f.add(tm('s2scene-seaside', tmat(seaSideTex(), { rim: 0 }), ({ add }) => {
    add(new THREE.PlaneGeometry(5.04, .38), -4.045, -.184, -1.0175, 0, -HP, 0, 1, { native: true, ru: 2.52 });
    add(new THREE.PlaneGeometry(3.045, .38), -2.5225, -.184, -3.545, 0, PI, 0, 1, { native: true, ru: 1.52, ou: .3 });
  }));
  f.add(mc('sea2scene', ({ add, addM, tube }) => {
    // the quay's west face: two courses of stone blocks, a little weed at its foot
    for (let r = 0; r < 2; r++) for (let u = -1.5 + (r ? .18 : 0); u < 3.45; u += .36) {
      const bw = Math.min(.32, 3.48 - u); if (bw < .08) continue;
      add(G.box(.025, .11, bw, .012), shade(STONE, ((r * 7 + Math.round(u * 10)) % 3 - 1) * .045), -.012, .065 + r * .13, u + bw / 2);
    }
    for (const z of [-.6, .9, 2.3]) for (let k = 0; k < 3; k++) add(G.sph(.03, 6, 4), k % 2 ? '#6aa86a' : '#5a965e', -.03, .02 + k * .015, z + k * .04, 0, 0, 0, [.6, 1, 1.3]);
    // a red-and-white float bobbing in the shallows, on its line
    add(G.sph(.075, 12, 8), '#ffffff', -1.6, .035, .95, 0, 0, 0, [1, .8, 1]);
    add(new THREE.SphereGeometry(.076, 12, 6, 0, PI * 2, 0, HP), RED, -1.6, .045, .95, 0, 0, 0, [1, .8, 1]);
    add(G.cyl(.008, .008, .12, 5), DARK, -1.6, .15, .95); add(G.box(.05, .035, .006, .003), YEL, -1.575, .19, .95);
    // the beach: shells, two starfish, pebbles, weed at the waterline, a crab, sea glass
    for (const [x, z, a, c] of [[-3.6, 2.2, .3, '#ffe2ea'], [-1.4, 2.85, 1.2, '#fff6e6'], [-3.1, 3.3, 2.2, '#ffd9e6'], [-.7, .6, .6, '#fff6e6'], [-.35, 2.9, 1.9, '#ffe2ea'], [-2.2, 2.35, 2.8, '#fff6e6']]) {
      add(new THREE.CylinderGeometry(.04, .04, .012, 10, 1, false, 0, PI), c, x, .006, z, 0, a, 0);
      for (let k = -1; k <= 1; k++) { const d = a + k * .5; add(G.box(.004, .006, .036, .001), shade(c, -.12), x + Math.cos(d) * .018, .013, z - Math.sin(d) * .018, 0, d + HP, 0); }
    }
    for (const [x, z, a] of [[-3.3, 2.65, .3], [-1.25, 3.25, 1.1]]) {
      add(G.ext(starShape(.055, .022), .01, .005, 4), '#ff8f7a', x, .004, z, -HP, 0, a);
      for (let k = 0; k < 5; k++) { const d = HP + a - k * 1.2566; add(G.sph(.006, 4, 3), '#ffd2c4', x + Math.cos(d) * .03, .02, z - Math.sin(d) * .03); }
    }
    for (const [x, z, n] of [[-1.8, 2.2, 4], [-3.8, 3.2, 3], [-.3, 2.4, 3], [-.6, -.4, 2], [-2.6, 1.85, 3]]) for (let k = 0; k < n; k++) add(G.sph(.03 + (k % 2) * .012, 7, 5), ['#b9b2c4', '#a59eb2', '#cfc9d8'][k % 3], x + Math.cos(k * 2.3) * .06, .008, z + Math.sin(k * 2.3) * .05, 0, k, 0, [1, .45, .8]);
    for (const [x, z, a] of [[-3.55, 1.62, .1], [-2.35, 1.6, -.2], [-1.2, 1.66, .4], [-.92, .2, 1.4], [-.9, -1.1, 1.6]]) for (let k = 0; k < 3; k++) add(G.sph(.045, 6, 4), k % 2 ? '#4f8f5a' : '#3f7f4f', x + Math.cos(a) * k * .05, .006, z + Math.sin(a) * k * .05, 0, a, 0, [1.4, .18, .5]);
    for (const [x, z, c] of [[-2.9, 2.0, '#8fe0d0'], [-.5, 1.7, '#a8d8f0'], [-3.9, 2.8, '#9be3b0']]) add(G.box(.025, .01, .018, .004), c, x, .006, z, 0, x, 0);
    const C = under(addM, xf(-.75, 0, 1.25, 0, .5, 0));
    C(G.sph(.05, 10, 7), '#ff6b57', 0, .03, 0, 0, 0, 0, [1.3, .55, 1]);
    for (const s of [-1, 1]) {
      C(G.sph(.022, 7, 5), '#ff6b57', s * .065, .035, .045, 0, 0, 0, [1, .7, 1.2]);
      for (let k = 0; k < 3; k++) C(G.box(.05, .008, .008, .002), '#e8504a', s * .065, .015, -.02 - k * .018, 0, s * .4, s * -.3);
      C(G.cyl(.004, .004, .025, 4), '#e8504a', s * .018, .06, .03); C(G.sph(.01, 6, 4), '#ffffff', s * .018, .075, .03); C(G.sph(.005, 4, 3), '#2a2230', s * .018, .078, .038);
    }
  }));
};

export const SEASIDE2_BUILDERS = B;
export const SEASIDE2_INFO = {
  seashop2: { w: 3, d: 2, name: '바닷가 가게', price: 0, hidden: true },
  seadeck2: { w: 3, d: 2, name: '물 위 데크', price: 0, hidden: true },
  flagdeck2: { w: 3, d: 2, name: '깃발 데크', price: 0, hidden: true },
  fishstall2: { w: 2, d: 1, name: '해산물 좌판', price: 0, hidden: true },
  barrels2: { w: 1, d: 1, name: '나무 통', price: 0, hidden: true },
  cafeumbrella2: { w: 1, d: 1, name: '파라솔 테이블', price: 0, hidden: true },
  chalksign2: { w: 1, d: 1, name: '칠판 메뉴판', price: 0, hidden: true },
  ringpost2: { w: 1, d: 1, name: '구명 튜브 시계', price: 0, hidden: true },
  sandcastle2: { w: 1, d: 1, name: '모래성', price: 0, hidden: true },
  sea2scene: { w: 1, d: 1, name: '바닷가 풍경', price: 0, hidden: true },
};

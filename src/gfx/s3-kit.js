// 3판 세 안 공용 키트 (10/24 — 사용자 "스테이지3 맵 3개 다 다시: A 정본 레벨업 · B 새 낚시터 · C 여우비 연잎 연못 집, 셋 다 싱그럽고 깨끗한 느낌").
// 기준: 7판 수준의 공들인 디테일, 맑은 낮빛, 초록은 생생하되 형광 X(여러 톤의 풀·클로버·작은 꽃), 물은 맑게(깊이 그러데이션·잔물결 고리·
// 반짝임·물고기 그림자 — 거친 줄무늬 X), 흰·크림 포인트, 덩어리 크고 귀여운 모델, 잔소품은 적고 의미 있게.
//   meadow 땅 무늬(outdoor.js GROUND_MORE): 판 바닥과 그 둘레 풀밭이 한 장으로 이어짐(look 레시피 ground.kind 'meadow')
//   pondTex(R) 연못 물(둥근 판 하나): 가운데 깊은 물빛 → 가장자리 얕은 물, 잔물결 고리, 반짝임, 물고기 그림자, 작은 비단잉어
//   lakeWater(f, o) 섬 둘레 호수: 섬 가까이 얕은 옥빛 → 멀리 하늘빛으로 스며듦(꼭짓점 색), 그 위에 잔물결 무늬 한 겹
//   조각: stone · lily · lotus · cattails · daisy · clover · tuft · roundTree · butterfly
import * as THREE from 'three';
import { mesh, canvasTex, texCache, shade, mat } from './kit.js';
import { rng } from '../util.js';
import { GROUND_MORE } from './outdoor.js';
import { G, mc, mt, TX, PI, HP } from './pc-kit.js';
export { G, mc, mt, TX, PI, HP };

const TEXC = texCache();
export const mix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const dot = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); };
const wrap = (S, x, y, m, fn) => { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { const X = x + dx, Y = y + dy; if (X > -m && X < S + m && Y > -m && Y < S + m) fn(X, Y); } };

// ── 풀밭 (5 m 한 장, 512 단위 ≈ 1 m에 100) ─────────────────────────────────────────────────────────────────────
// 큰 면은 순한 세 톤(따뜻한 연두·서늘한 초록·민트)으로 아주 옅게 얼룩, 클로버 무더기, 짧은 풀결 두 톤, 작은 꽃은 드문드문
GROUND_MORE.meadow = (c, S, T) => {
  const base = T.grass || '#8ec873', r = rng(T.meadowSeed || 31);
  c.fillStyle = base; c.fillRect(0, 0, S, S);
  const tones = [mix(base, '#c4e48a', .22), mix(base, '#6ab46e', .16), mix(base, '#a6e2b8', .24), mix(base, '#b6dc7a', .16)];
  c.globalAlpha = .4;
  for (let i = 0; i < 52; i++) { const x = r() * S, y = r() * S, rad = 26 + r() * 64, col = tones[i % 4]; wrap(S, x, y, rad * 1.4, (X, Y) => { c.fillStyle = col; c.beginPath(); c.ellipse(X, Y, rad * 1.35, rad, r() * 3, 0, PI * 2); c.fill(); }); }
  c.globalAlpha = 1;
  // clover patches: little trefoils in a darker, bluer green with a pale heart
  const cl = mix(base, '#5aa862', .32), clh = mix(base, '#e8f6d0', .4);
  for (let i = 0; i < (T.clover ?? 15); i++) {
    const cx = r() * S, cy = r() * S, n = 5 + Math.floor(r() * 7);
    for (let k = 0; k < n; k++) {
      const x = cx + (r() - .5) * 26, y = cy + (r() - .5) * 18, s = 1.7 + r() * .9, a0 = r() * 6;
      wrap(S, x, y, 8, (X, Y) => { c.fillStyle = cl; for (let q = 0; q < 3; q++) { const a = a0 + q * 2.094; dot(c, X + Math.cos(a) * s, Y + Math.sin(a) * s * .8, s * 1.05); } c.fillStyle = clh; dot(c, X, Y, s * .45); });
    }
  }
  // grass ticks: a dark 'v' and a light stroke
  c.lineCap = 'round';
  c.strokeStyle = shade(base, -.11); c.lineWidth = 1.3;
  for (let i = 0; i < 620; i++) { const x = r() * S, y = r() * S; c.beginPath(); c.moveTo(x - 2.2, y - 3.6); c.lineTo(x, y); c.lineTo(x + 2.4, y - 4); c.stroke(); }
  c.strokeStyle = 'rgba(250,255,225,.42)'; c.lineWidth = 1.1;
  for (let i = 0; i < 300; i++) { const x = r() * S, y = r() * S; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1.2, y - 4.2); c.stroke(); }
  // flowers: white daisies, a few buttercups, pale pink and forget-me-not blue — sparse
  const fl = (x, y, petal, mid, s) => wrap(S, x, y, 8, (X, Y) => { c.fillStyle = petal; for (let k = 0; k < 5; k++) { const a = k * 1.2566 + x; dot(c, X + Math.cos(a) * s, Y + Math.sin(a) * s * .8, s * .72); } c.fillStyle = mid; dot(c, X, Y, s * .55); });
  for (let i = 0; i < (T.daisies ?? 16); i++) fl(r() * S, r() * S, '#ffffff', '#ffcf3a', 2.3);
  for (let i = 0; i < 7; i++) fl(r() * S, r() * S, '#ffe14d', '#ffb300', 1.6);
  for (let i = 0; i < 5; i++) fl(r() * S, r() * S, '#ffc6dc', '#ffffff', 1.7);
  for (let i = 0; i < 5; i++) fl(r() * S, r() * S, '#a9c8ff', '#fff6c0', 1.4);
};

// ── 연못 물 (둥근 판 하나, uv 0..1 = 지름) ──────────────────────────────────────────────────────────────────────
export const pondTex = (key = 'pond', o = {}) => TEXC.get('s3pond|' + key, () => {
  const t = canvasTex(1024, 1024, (c, W) => {
    const S = W, m = S / 2, r = rng(o.seed || 7);
    const g = c.createRadialGradient(m, m * .96, S * .04, m, m, S * .5);
    g.addColorStop(0, o.deep || '#4fbdd8'); g.addColorStop(.55, o.mid || '#6ccfe2'); g.addColorStop(.86, o.shallow || '#9fe0e8'); g.addColorStop(1, o.edge || '#c7ecdc');
    c.fillStyle = g; c.fillRect(0, 0, S, S);
    // the sky's reflection: a soft pale band across the upper-left
    c.save(); c.translate(m, m); c.rotate(-.6); const b = c.createLinearGradient(0, -S * .32, 0, S * .05);
    b.addColorStop(0, 'rgba(255,255,255,0)'); b.addColorStop(.5, 'rgba(255,255,255,.16)'); b.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = b; c.fillRect(-S * .6, -S * .32, S * 1.2, S * .37); c.restore();
    // soft sunlit patches on the shallow bottom near the rim
    for (let i = 0; i < 26; i++) { const a = r() * PI * 2, rr = S * (.36 + r() * .1); c.fillStyle = 'rgba(255,255,235,.09)'; c.beginPath(); c.ellipse(m + Math.cos(a) * rr, m + Math.sin(a) * rr, 16 + r() * 22, 8 + r() * 10, a, 0, PI * 2); c.fill(); }
    // fish shadows under the surface, and one little orange-and-white koi just under it
    const fish = (x, y, a, s, col, al) => { c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = al; c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 20 * s, 7.5 * s, 0, 0, PI * 2); c.fill();
      c.beginPath(); c.moveTo(-16 * s, 0); c.lineTo(-30 * s, -9 * s); c.quadraticCurveTo(-26 * s, 0, -30 * s, 9 * s); c.closePath(); c.fill(); c.restore(); c.globalAlpha = 1; };
    for (const [x, y, a, s] of o.fish || [[.36, .6, .5, 1.5], [.64, .38, 2.6, 1.2], [.55, .7, -1.1, 1.0]]) fish(x * S, y * S, a, s, '#2f7f99', .26);
    if (o.koi !== false) { const [kx, ky, ka] = o.koi || [.4, .36, -.4]; fish(kx * S, ky * S, ka, 1.25, '#ff8a4c', .92);
      c.save(); c.translate(kx * S, ky * S); c.rotate(ka); c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(6, -1, 7, 4, .3, 0, PI * 2); c.fill(); c.beginPath(); c.ellipse(-8, 2, 4, 3, 0, 0, PI * 2); c.fill(); c.restore(); }
    // ripple rings (round, never streaks): little pairs where something touched the water
    c.lineCap = 'round';
    for (const [x, y, w] of o.rings || [[.3, .42, 30], [.7, .62, 24], [.52, .26, 18]]) for (const [k, al] of [[1, .55], [1.7, .32], [2.4, .16]]) { c.strokeStyle = `rgba(255,255,255,${al})`; c.lineWidth = 3; c.beginPath(); c.ellipse(x * S, y * S, w * k, w * k * .82, 0, 0, PI * 2); c.stroke(); }
    // glints: short soft white dashes, more toward the light
    for (let i = 0; i < 34; i++) { const a = r() * PI * 2, rr = Math.sqrt(r()) * S * .42, x = m + Math.cos(a) * rr, y = m + Math.sin(a) * rr, up = (m - x + m - y) / S; if (r() > .45 + up * .6) continue;
      c.fillStyle = `rgba(255,255,255,${.55 + r() * .35})`; c.beginPath(); c.ellipse(x, y, 7 + r() * 9, 2.2, -.15, 0, PI * 2); c.fill(); }
  });
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
});

// ── 호수 (섬 둘레): 꼭짓점 색으로 얕은 옥빛 → 하늘빛, 그 위에 잔물결·반짝임 무늬 한 겹 ───────────────────────────────
// o: { pts (섬 물가 [[x,z]…]), R (멀리 끝 반지름), y, near, mid, far, sky, glint }
export function lakeWater(f, o) {
  const pts = o.pts, n = pts.length, R = o.R || 24, y = o.y ?? -.06, rings = o.rings || [0, .25, .7, 1.4, 2.6, 4.5, 7.5, 12, 18, R];
  const near = new THREE.Color(o.near || '#9fe3e6'), mid = new THREE.Color(o.mid || '#6fd0e0'), far = new THREE.Color(o.far || '#7fcfe6'), sky = new THREE.Color(o.sky || '#d9f0f4');
  const pos = [], col = [], uv = [], col2 = [], idx = [];
  for (let k = 0; k < rings.length; k++) {
    const d = rings[k];
    for (let i = 0; i < n; i++) {
      const [x, z] = pts[i], L = Math.hypot(x, z) || 1, px = x + x / L * d, pz = z + z / L * d;
      pos.push(px, y, pz); uv.push(px / 3.2, pz / 3.2);
      const t1 = Math.min(1, d / 1.6), t2 = Math.min(1, Math.max(0, (d - 1.6) / 6)), t3 = Math.min(1, Math.max(0, (d - 7) / (R - 9)));
      const c = near.clone().lerp(mid, t1).lerp(far, t2).lerp(sky, t3);
      col.push(c.r, c.g, c.b); col2.push(1, 1, 1, Math.max(0, 1 - Math.min(1, d / 9)) * (d < .12 ? 0 : 1));
    }
  }
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < n; i++) { const a = k * n + i, b = k * n + (i + 1) % n, c2 = a + n, d2 = b + n; idx.push(a, c2, b, b, c2, d2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  for (let i = 0; i < g.attributes.normal.count; i++) g.attributes.normal.setXYZ(i, 0, 1, 0);
  const base = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  scenery(base); base.renderOrder = -2; f.add(base);
  const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(pos.map((v, i) => i % 3 === 1 ? v + .004 : v), 3)); g2.setAttribute('color', new THREE.Float32BufferAttribute(col2, 4)); g2.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g2.setIndex(idx);
  const t = rippleTex(o.glint, o.rainy); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const top = new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ map: t, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  scenery(top); top.renderOrder = -1; f.add(top);
  return { base, top };
}
// the lake's surface detail (white on clear): soft ripple rings, a few long gentle swells, glints — no stripes
const rippleTex = (seed = 5, rainy = false) => TEXC.get('s3ripple|' + seed + '|' + rainy, () => {
  const t = canvasTex(512, 512, (c, S) => {
    c.clearRect(0, 0, S, S); const r = rng(seed); c.lineCap = 'round';
    // (rainy: many small fresh rings where the drops land)
    if (rainy) for (let i = 0; i < 26; i++) { const x = r() * S, y = r() * S, w = 4 + r() * 6; wrap(S, x, y, w * 3, (X, Y) => { for (const [k, al] of [[1, .5], [1.9, .22]]) { c.strokeStyle = `rgba(255,255,255,${al})`; c.lineWidth = 1.8; c.beginPath(); c.ellipse(X, Y, w * k, w * k * .8, 0, 0, PI * 2); c.stroke(); } }); }
    for (let i = 0; i < 4; i++) { const x = r() * S, y = r() * S, w = 10 + r() * 16; wrap(S, x, y, w * 3, (X, Y) => { for (const [k, al] of [[1, .34], [1.8, .18], [2.6, .08]]) { c.strokeStyle = `rgba(255,255,255,${al})`; c.lineWidth = 2.2; c.beginPath(); c.ellipse(X, Y, w * k, w * k * .8, 0, 0, PI * 2); c.stroke(); } }); }
    for (let i = 0; i < 10; i++) { const x = r() * S, y = r() * S, L = 18 + r() * 26; wrap(S, x, y, L, (X, Y) => { c.strokeStyle = 'rgba(255,255,255,.24)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(X - L / 2, Y); c.quadraticCurveTo(X, Y - 4, X + L / 2, Y); c.stroke(); }); }
    for (let i = 0; i < 22; i++) { const x = r() * S, y = r() * S; wrap(S, x, y, 12, (X, Y) => { c.fillStyle = `rgba(255,255,255,${.5 + r() * .4})`; c.beginPath(); c.ellipse(X, Y, 5 + r() * 6, 1.7, 0, 0, PI * 2); c.fill(); }); }
  });
  t.colorSpace = THREE.SRGBColorSpace; return t;
});

// scenery: drawn, never picked, no outline of its own (layer 2), no shadow
const NO_PICK = () => {};
export function scenery(m) { m.layers.set(2); m.castShadow = false; m.receiveShadow = false; m.raycast = NO_PICK; m.userData.scenery = true; m.userData.noOcclude = true; m.userData.noMerge = true; return m; }

// ── 작은 조각들 (mc의 add로) ──────────────────────────────────────────────────────────────────────────────────
// a smooth river stone (seeded lump), warm pale grey
export const STONES = ['#e3ddd5', '#cdc6bd', '#ece8e1', '#bdb6ae'];
export function stone(add, x, z, s, seed, col = STONES[seed % 4], y = 0, flat = .55, rot = seed) {
  add(G.rock(seed % 9 + 1, .14, 14, 10), col, x, y + s * flat * .55, z, 0, rot, 0, [s * 1.25, s * flat, s]);
}
// a lily pad with its notch and a pale vein, lying at height y
export function lily(add, x, z, r, rot = 0, y = .03, c1 = '#5fb45e', c2 = '#7fca6a') {
  const s = new THREE.Shape(); s.absarc(0, 0, r, .28, PI * 2 - .02, false); s.lineTo(0, 0);
  const g = G.ext(s, .018, 0, 20); g.rotateX(-HP); g.rotateY(rot); add(g, c1, x, y, z);
  const s2 = new THREE.Shape(); s2.absarc(0, 0, r * .72, .4, PI * 2 - .1, false); s2.lineTo(0, 0);
  const g2 = G.ext(s2, .004, 0, 16); g2.rotateX(-HP); g2.rotateY(rot); add(g2, c2, x, y + .019, z);
  for (let k = 0; k < 4; k++) { const a = rot + .9 + k * 1.3; add(G.box(r * .62, .003, .008, 0), mix(c2, '#ffffff', .35), x + Math.cos(a) * r * .32, y + .024, z - Math.sin(a) * r * .32, 0, a, 0); }
}
// a water lily / lotus flower: two rings of pointed petals, a yellow heart
export function lotus(add, x, z, s = 1, y = .05, col = '#ffb6cc', col2 = '#ffe0ea') {
  for (let k = 0; k < 8; k++) { const a = k * PI / 4; add(G.sph(.05 * s, 10, 7), col, x + Math.cos(a) * .05 * s, y + .02 * s, z + Math.sin(a) * .05 * s, 0, -a, .55, [1.5, .5, .7]); }
  for (let k = 0; k < 6; k++) { const a = k * PI / 3 + .3; add(G.sph(.042 * s, 10, 7), col2, x + Math.cos(a) * .03 * s, y + .05 * s, z + Math.sin(a) * .03 * s, 0, -a, 1.0, [1.4, .5, .7]); }
  add(G.sph(.026 * s, 10, 7), '#ffd84a', x, y + .07 * s, z);
}
// cattails and reed leaves (flat blades that bend), a clump round (x, z)
export function cattails(add, tube, x, z, s = 1, seed = 1, n = 9) {
  const r = rng(seed * 11 + 2);
  for (let k = 0; k < n; k++) {
    const a = k * 2.4 + r(), rr = (.04 + r() * .14) * s, px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr, h = (.5 + r() * .38) * s, lean = (r() - .5) * .2;
    if (k % 3 === 0) { tube([px, 0, pz], [px + lean * .6, h, pz + lean * .3], .008 * s, '#6aa84f', 5); add(G.cap(.024 * s, .1 * s, 2, 8), '#9a6440', px + lean * .62, h + .02 * s, pz + lean * .31); add(G.cyl(.004, .004, .06 * s, 4), '#6aa84f', px + lean * .64, h + .1 * s, pz + lean * .32); }
    else { const b = G.box(.034 * s, h, .006, 0); b.translate(0, h / 2, 0); add(b, k % 2 ? '#7cc062' : '#5fae5a', px, 0, pz, lean * 1.6, a, (r() - .5) * .35); }
  }
}
export function daisy(add, x, z, s = 1, petal = '#ffffff', mid = '#ffcf3a', y = 0, h = .16) {
  add(G.cyl(.006 * s, .007 * s, h * s, 4), '#5fa45a', x, y + h * s / 2, z);
  for (let k = 0; k < 6; k++) { const a = k * 1.047; add(G.sph(.022 * s, 8, 5), petal, x + Math.cos(a) * .026 * s, y + h * s + .004, z + Math.sin(a) * .026 * s, 0, -a, 0, [1.25, .42, .75]); }
  add(G.sph(.016 * s, 8, 6), mid, x, y + h * s + .01, z);
  add(G.sph(.02 * s, 6, 4), '#6cb85a', x + .02 * s, y + .05 * s, z, 0, .4, .6, [1.4, .4, .7]);
}
export function tuft(add, x, z, s = 1, c1 = '#6fb85a', c2 = '#8fcf6a', y = 0) {
  for (let k = 0; k < 6; k++) { const a = k * 1.1; add(G.cone(.026 * s, (.13 + (k % 3) * .04) * s, 4), k % 2 ? c1 : c2, x + Math.cos(a) * .035 * s, y + (.065 + (k % 3) * .02) * s, z + Math.sin(a) * .028 * s, Math.sin(a) * .28, 0, Math.cos(a) * .28); }
}
// a fluffy round tree crown: big soft balls, a lighter cap on the sunny side, a few blossoms
export function crown(add, cx, cy, cz, R, c1 = '#6cc068', c2 = '#53a95a', c3 = '#9ad87a', seed = 3, bloom = null) {
  const r = rng(seed);
  const balls = [[0, 0, 0, 1], [-.55, -.18, .1, .7], [.55, -.12, -.05, .72], [.05, .45, -.05, .68], [.1, -.15, .55, .62], [-.15, -.05, -.55, .66], [.4, .28, .35, .5], [-.42, .3, .3, .48], [.35, .25, -.42, .5]];
  for (const [x, y, z, s] of balls) add(G.sph(R * s, 20, 14), s > .65 ? c1 : c2, cx + x * R, cy + y * R, cz + z * R);
  for (const [x, y, z, s] of [[-.2, .62, .2, .36], [.3, .5, .3, .3], [-.5, .28, .42, .28], [.55, .2, .3, .26], [.1, .2, .78, .26], [-.62, .02, .35, .24]]) add(G.sph(R * s, 14, 10), c3, cx + x * R, cy + y * R, cz + z * R);
  if (bloom) for (let k = 0; k < bloom.n; k++) { const a = r() * PI * 2, b = r() * 1.2 - .1, rr = R * (1.02 + r() * .1); add(G.sph(.035 + r() * .015, 8, 6), bloom.c[k % bloom.c.length], cx + Math.cos(a) * Math.cos(b) * rr * .95, cy + Math.sin(b) * rr * .9, cz + Math.sin(a) * Math.cos(b) * rr * .95); }
}
// a small butterfly at rest in the air (two pairs of round wings)
export function butterfly(add, x, y, z, c = '#ffd3e4', rot = 0, s = 1) {
  for (const sx of [-1, 1]) { add(G.sph(.05 * s, 10, 6), c, x + Math.cos(rot) * sx * .045 * s, y + .02 * s, z - Math.sin(rot) * sx * .045 * s, 0, rot, sx * .5, [1, .25, 1.15]); add(G.sph(.035 * s, 10, 6), mix(c, '#ffffff', .4), x + Math.cos(rot) * sx * .04 * s, y - .015 * s, z - Math.sin(rot) * sx * .04 * s + .02, 0, rot, sx * .6, [1, .25, 1]); }
  add(G.cap(.008 * s, .05 * s, 2, 5), '#5a4a5e', x, y, z, HP, rot, 0);
}
// a dragonfly hovering (thin body, four clear wings)
export function dragonfly(add, x, y, z, rot = 0, body = '#4fa9d8') {
  add(G.cap(.01, .13, 2, 6), body, x, y, z, 0, rot, HP);
  add(G.sph(.017, 8, 6), shade(body, -.2), x + Math.cos(rot) * .075, y, z - Math.sin(rot) * .075);
  for (const off of [.02, -.02]) for (const sx of [-1, 1]) add(G.sph(.055, 8, 5), '#e8f6ff', x + Math.cos(rot) * off - Math.sin(rot) * sx * .055, y + .01, z - Math.sin(rot) * off - Math.cos(rot) * sx * .055, 0, rot, 0, [.45, .08, 1]);
}

// a colour canvas texture on a material that takes the toon light (labels, cloth, painted boards)
export const paintTex = (key, w, h, draw) => TEXC.get('s3paint|' + key, () => { const t = canvasTex(w, h, draw); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; });
export const texMat = t => mat('#ffffff', { map: t });
export const textured = (geom, t) => mesh(geom, texMat(t));

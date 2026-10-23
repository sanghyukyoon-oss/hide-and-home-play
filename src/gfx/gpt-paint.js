// 물건마다 색 다시 칠하기 (① 10/22 — 사용자 "gpt 모델링은 꼭 니가 색칠 좀 다시 해 줘. 전반적으로.", "색이 왜 이렇게 누래?"):
// GPT가 만든 가구·소품은 거의 크림·꿀색 한 가지라, 키마다 우리가 본색 하나를 골라(PAINT 표) 다시 칠한다.
//   크림·연노랑 몸통  → 그 본색의 옅은 색 (밝기는 그대로)
//   다른 포인트 색    → 가장 많이 쓰인 포인트 색이 본색이 되게 색상만 함께 돌림 (조각끼리의 색 차이는 남음)
//   나무·중성색·그림 텍스처·유리 → 그대로 (나무는 'wood: true'인 본색만 칠함)
//   'neutral'        → 크림을 노랗지 않은 오프화이트로만 (건물 벽·바닥 같은 큰 면)
// 모양·재질을 다른 가구(정본 포함)와 같이 쓰는 경우가 있어서, 칠한 것은 복사본으로 만들어 그 키에만 쓴다.
// 맵 전체 색 분포는 _handoff/colorstat.py로 390×844 시작 사진을 잰다 (엔트로피 ≥ 1.9 · 채도 높은 칸 ≥ 25% · 주황·노랑 ≤ 60%).
import * as THREE from 'three';
import { geo } from './kit.js';

export const SCHEMES = {
  // (쨍하게 — 사용자 "클로드가 한 거는 쨍하고 이쁜데 지피티는 뭔가 RGB가 아닌 듯": 포인트는 HSL 채도 .65 이상이 나오게)
  mint: { h: 165, c: .14 }, teal: { h: 192, c: .12 }, sky: { h: 238, c: .13 }, cobalt: { h: 262, c: .17 },
  lilac: { h: 305, c: .15 }, pink: { h: 2, c: .16 }, coral: { h: 33, c: .17 }, red: { h: 27, c: .2 },
  green: { h: 145, c: .17 }, lemon: { h: 102, c: .16 }, neutral: { neutral: true }, keep: null,
};

// ── OKLab / OKLCH (sRGB hex in and out)
const lin = c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
const unlin = c => c <= .0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - .055;
function lch(hex) {
  const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
  const L = .2104542553 * l + .7936177850 * m - .0040720468 * s, A = 1.9779984951 * l - 2.4285922050 * m + .4505937099 * s, B = .0259040371 * l + .7827717662 * m - .8086757660 * s;
  return { L, C: Math.hypot(A, B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 };
}
function hexOf({ L, C, h }) {
  const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
  const l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, s = (L - .0894841775 * a - 1.2914855480 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.7076147010 * s];
  return '#' + rgb.map(c => Math.round(Math.min(1, Math.max(0, unlin(Math.min(1, Math.max(0, c))))) * 255).toString(16).padStart(2, '0')).join('');
}
const hueIn = (h, a, b) => a <= b ? h >= a && h <= b : h >= a || h <= b;
const kindOf = ({ L, C, h }) => C < .03 ? 'neutral' : (L > .84 && C < .1 && hueIn(h, 40, 115)) ? 'cream' : (hueIn(h, 40, 85) && C < .17 && L > .35 && L < .84) ? 'wood' : 'accent';

// the colour a piece's colour becomes under scheme S (turn: the hue turn its accents take)
function paintHex(hex, S, turn) {
  const q = lch(hex), k = kindOf(q);
  if (S.neutral) return k === 'cream' ? hexOf({ L: Math.min(q.L, .965), C: .012, h: 75 }) : hex;
  if (k === 'neutral' || (k === 'wood' && !S.wood)) return hex;
  if (k === 'wood') return hexOf({ L: Math.min(Math.max(q.L, .55), .8), C: Math.max(S.c, .1), h: S.h });
  if (k === 'cream') return hexOf({ L: Math.min(q.L, .9), C: Math.min(.09, S.c * .6), h: S.h });
  return hexOf({ L: Math.min(Math.max(q.L, .5), .78), C: Math.min(.22, Math.max(q.C, S.c)), h: (q.h + turn + 360) % 360 });
}

const MAT = new Map(), tmp = new THREE.Color();   // (painted shapes live in kit's geo cache, emptied scene by scene like the rest)
const hexOfLinear = (r, g, b) => '#' + tmp.setRGB(r, g, b).getHexString();
// paint one built piece or thing (call after its builder ran)
export const paintFurn = (f, name) => { paintGroup(f.group, name); return f; };
export function paintGroup(root, name) {
  // ('cobalt!' paints the wood too — a piece whose body GPT made of honey wood: lockers, cabinets)
  const S0 = SCHEMES[name.replace('!', '')]; if (!S0) return root;
  const S = name.endsWith('!') ? { ...S0, wood: true } : S0;
  // the piece's own accent colours, weighted by how much of it they cover, to find the hue to turn from
  const w = new Map();
  root.traverse(o => {
    if (!o.isMesh || o.userData.noPaint) return;
    const m = o.material; if (!m || Array.isArray(m) || m.map) return;
    const col = m.vertexColors && o.geometry.attributes.color;
    if (col) { for (let i = 0; i < col.count; i += 3) { const hx = hexOfLinear(col.getX(i), col.getY(i), col.getZ(i)); w.set(hx, (w.get(hx) || 0) + 1); } }
    else if (m.color) { const hx = '#' + m.color.getHexString(); w.set(hx, (w.get(hx) || 0) + (o.geometry.attributes.position?.count || 1) / 3); }
  });
  let main = null, best = 0;
  for (const [hx, n] of w) { const q = lch(hx); if (kindOf(q) === 'accent' && n > best) { best = n; main = q; } }
  const turn = S.neutral || !main ? 0 : S.h - main.h;
  return recolorGroup(root, name, hx => paintHex(hx, S, turn));
}
// change every plain colour of a built piece by fn(hex) → hex (painted shapes are copies kept under key; textures and see-through glass stay)
function recolorGroup(root, key, fn) {
  const memo = new Map(), to = hx => { if (!memo.has(hx)) memo.set(hx, fn(hx)); return memo.get(hx); };
  root.traverse(o => {
    if (!o.isMesh || o.userData.noPaint) return;
    const m = o.material; if (!m || Array.isArray(m) || m.map || (m.transparent && m.opacity < .9)) return;
    const col = m.vertexColors && o.geometry.attributes.color;
    if (col) {
      const src = o.geometry;
      o.geometry = geo('gpt-paint|' + src.uuid + '|' + key, () => {
        const g = src.clone(), c = g.attributes.color;
        for (let i = 0; i < c.count; i++) { const hx = to(hexOfLinear(c.getX(i), c.getY(i), c.getZ(i))); tmp.set(hx); c.setXYZ(i, tmp.r, tmp.g, tmp.b); }
        return g;
      });
    } else if (m.color) {
      const k = m.uuid + '|' + key;
      if (!MAT.has(k)) { const mm = m.clone(); mm.color.set(to('#' + m.color.getHexString())); MAT.set(k, mm); }
      o.material = MAT.get(k);
    }
  });
  return root;
}
// the things to find (ITEMS entries with build(opts)): painted the same way
export function paintItems(ITEMS_, table) {
  for (const k in ITEMS_) { const name = table[k]; if (!name || !SCHEMES[name.replace('!', '')]) continue; const d = ITEMS_[k], b = d.build; d.build = (...a) => paintGroup(b(...a), name); }
  return ITEMS_;
}
// wrap a set of builders so each key is painted with its scheme (keys not in the table are left as they are)
export function paintBuilders(B, table) {
  for (const k in B) { const name = table[k]; if (!name || !SCHEMES[name.replace('!', '')]) continue; const b = B[k]; B[k] = (f, ...a) => { const r = b(f, ...a); paintFurn(f, name); return r; }; }
  return B;
}

// 맵마다 정한 3~4색 배색으로 모으기 (사용자 10/22 "채도만 높여 놓고 조화롭지도 이쁘지도 않음" → 채도 올리기 금지, 큰 면은 부드럽게, GPT 원색의 명암 구조는 살림):
// 포인트 색은 색상(h)만 배색표에서 가장 가까운 색으로 옮기고 채도는 그 색의 상한까지만 (더 올리지 않음), 밝기(L)는 그대로; 크림 몸통은 노랑만 덜어냄; 중성·나무는 그대로
//   pal: [{ h, c }, …] (OKLCH 색상·채도 상한), cream: 크림 노랑을 남길 몫, keep: 그대로 둘 색(작은 소품의 포인트 색),
//   lift: 흐린 포인트 색을 그 배색 색의 몇 할까지 올릴지(0 = 안 올림; 사용자 10/22 '채색을 지금 정본과 비슷하게' 판만 .6~.8)
export function harmonizeGroup(root, pal, { cream = .5, keep = [], lift = 0 } = {}) {
  const key = 'pal' + pal.map(p => p.h + ':' + p.c).join(',') + '|' + cream + '|' + lift + '|' + keep.join(','), KEEP = new Set(keep.map(h => h.toLowerCase()));
  const dist = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
  // (a pale wood or cream in the scheme is the map's ground and wood, not a colour to paint a GPT accent with — a teal roof went olive in 19판)
  const woody = p => p.h >= 50 && p.h <= 110 && p.c < .12;
  const acc = pal.filter(p => !woody(p)), wood = pal.filter(woody); if (!acc.length) acc.push(...pal);
  return recolorGroup(root, key, hx => {
    if (KEEP.has(hx)) return hx;
    const q = lch(hx), k = kindOf(q);
    if (k === 'cream') return hexOf({ ...q, C: q.C * cream });
    // (GPT's honey wood takes the map's own wood colour where the scheme has one — 21판 분실물 사물함이 꿀색 주황으로 튀던 것)
    if (k === 'wood' && wood.length) { let w = wood[0]; for (const p of wood) if (dist(q.h, p.h) < dist(q.h, w.h)) w = p; return hexOf({ L: q.L, C: Math.min(q.C, w.c * 1.1), h: w.h }); }
    if (k !== 'accent') return hx;
    let best = acc[0]; for (const p of acc) if (dist(q.h, p.h) < dist(q.h, best.h)) best = p;
    return hexOf({ L: q.L, C: Math.min(Math.max(q.C, best.c * lift), best.c), h: best.h });
  });
}
export function harmonizeBuilders(B, pal, o) {
  for (const k in B) { const b = B[k]; B[k] = (f, ...a) => { const r = b(f, ...a); harmonizeGroup(f.group, pal, o); return r; }; }
  return B;
}

// 테마의 큰 면(벽·바닥·포장·배경)은 맑고 부드럽게 (사용자 10/22 "누런 크림 X, 칙칙 X"): 밝은 크림·누런 회색의 노랑만 덜어냄(밝기·색상은 그대로)
export const softHex = (hx, keep = .4) => { const q = lch(hx); return q.L > .6 && q.C < .1 && hueIn(q.h, 40, 115) ? hexOf({ ...q, C: q.C * keep }) : hx; };
export function softTheme(T, keep = .4) {
  const out = { ...T }, HEX = /^#[0-9a-f]{6}$/i;
  for (const k in out) {
    const v = out[k];
    if (typeof v === 'string' && HEX.test(v)) out[k] = softHex(v, keep);
    else if (Array.isArray(v) && v.every(x => typeof x === 'string' && HEX.test(x))) out[k] = v.map(x => softHex(x, keep));
  }
  return out;
}

// 채도만 눌러 부드럽게 (색상·밝기는 그대로) — 공통 동네 배경(26판): 사용자가 "배경이 참 맘에 드네" 한 건 채도가 눌린 하늘·청록이었다
export function softenGroup(root, cap = .075) { return recolorGroup(root, 'soft' + cap, hx => { const q = lch(hx); return q.C > cap ? hexOf({ ...q, C: cap }) : hx; }); }
export function softenBuilders(B, cap) {
  for (const k in B) { const b = B[k]; B[k] = (f, ...a) => { const r = b(f, ...a); softenGroup(f.group, cap); return r; }; }
  return B;
}

// 역할별로 원본 색 입히기 (사용자 10/23 "왜 이렇게 다 초록초록 … 우리 각 원본 스테이지 만든 색깔로 색 조합 다시"): GPT 작업장은 판마다 같은
// 색 묶음(세이지·민트 초록, 하늘·청록, 꿀색 나무, 크림, 코랄·빨강)을 썼다 — 색상만 끌면 그 초록이 판마다 그대로 남는다. 그래서 GPT 색을
// 묶음으로 나눠 묶음마다 그 판 orig의 역할 색(벽·지붕·차양·문·나무·포인트)을 입힌다. 밝은 면(벽·차양 천)과 어두운 면(지붕·문·틀)은 따로:
//   R = { green, sky, blue, red, coral, wood, cream }: 값은 '#hex' 하나 또는 [밝은 면, 어두운 면]; 빠진 묶음은 그대로
// 밝기·채도는 역할 색 그대로; 거의 흰 중성색(GPT의 흰 판·띠)도 크림 역할로
const FAM = q => q.C < .03 ? (q.L > .9 ? 'cream' : null) : q.L > .84 && q.C < .1 && hueIn(q.h, 40, 115) ? 'cream'
  : hueIn(q.h, 55, 100) ? 'wood' : hueIn(q.h, 100, 185) ? 'green' : hueIn(q.h, 185, 250) ? 'sky' : hueIn(q.h, 250, 320) ? 'blue' : hueIn(q.h, 320, 30) ? 'red' : 'coral';
export function remapGroup(root, R, key = 'remap') {
  return recolorGroup(root, key, hx => {
    const q = lch(hx), f = FAM(q), t = f && R[f]; if (!t) return hx;
    const tt = lch(Array.isArray(t) ? (q.L > .74 ? t[0] : t[1]) : t);
    // (10/23 허브 "탁하고 안 이쁨", "옅고 뿌옇게 바래 보여요 … GPT 명암 2할도 빼고": 역할 색의 밝기·채도를 그대로 — 면의 명암은 밝은 면/어두운 면 두 값과 빛이 준다)
    return hexOf({ L: tt.L, C: tt.C, h: tt.h });
  });
}
export function remapBuilders(B, R, key) {
  for (const k in B) { const b = B[k]; B[k] = (f, ...a) => { const r = b(f, ...a); remapGroup(f.group, R, key); return r; }; }
  return B;
}


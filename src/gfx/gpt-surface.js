// 큰 면에 우리 질감 v2 (① 10/23 — 사용자 "텍스처를 좀 많이 써야 됨.. 채색만 할 게 아니라", "텍스처를 많이 만들어서 디테일 올려 줘",
// 허브 "질감이 주인공 … 시작 화면에서 보이는 세기로, 1~15판 질감 밀도가 기준"): GPT 조각은 꼭짓점 색 한 가지로 칠한 면이라 단색이다.
// 그 위에 면마다 결을 곱한다 — 면의 방향(위·세움·비탈)과 그 면의 색(나무색·밝은 벽·회색·포인트 색)을 보고 결을 고른다:
//   나무색 → 세운 면은 세로 판자(결·옹이·이음), 위 면은 마루 널 / 밝은 면 → 세운 면은 그 판의 벽 결(벽돌·회벽·타일·판벽·철판),
//   위 면은 그 판의 바닥 결(보도블록·타일·체크·마루) / 어두운 회색 → 아스팔트·시멘트(결·금·얼룩) / 포인트 색 → 천 결(올·줄) /
//   비탈진 면 → 그 판의 지붕 결(기와·슬레이트·철판).
// 결은 회색 한 장(256 칸, 이어 붙음)을 월드 좌표로 깔고(UV 없이), 색은 그대로 두고 밝기만 흔든다. 작은 소품(가장 긴 변 1.3 m 아래)은 안 건드림.
// (v3 10/23 허브: 결 크기 반·대비 .92 — 시작 화면에서 1~15판처럼 촘촘하게)
import * as THREE from 'three';

const S = 256;
let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const g = v => { const k = Math.max(0, Math.min(255, Math.round(v * 255))); return `rgb(${k},${k},${k})`; };
function tex(draw) {
  const c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, S, S); seed = 7 + draw.length * 31; draw(x);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
// speckles, stains and fine cracks shared by the masonry patterns
const speck = (x, n, lo, hi) => { for (let i = 0; i < n; i++) { x.fillStyle = g(lo + R() * (hi - lo)); x.fillRect(R() * S, R() * S, 1 + R() * 2, 1 + R() * 2); } };
const stain = (x, n, a) => { for (let i = 0; i < n; i++) { const cx = R() * S, cy = R() * S, r = 10 + R() * 26, gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) x.fillRect(cx - r + ox, cy - r + oy, r * 2, r * 2); } };
const crack = (x, n, v) => { x.strokeStyle = g(v); x.lineWidth = 1; for (let i = 0; i < n; i++) { let px = R() * S, py = R() * S; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (R() - .5) * 22; py += (R() - .5) * 22; x.lineTo(px, py); } x.stroke(); } };
const grain = (x, X, Y, W, H, vertical) => { x.strokeStyle = 'rgba(60,40,20,.16)'; x.lineWidth = 1; for (let k = 0; k < 5; k++) { const o = 3 + k * (vertical ? W : H) / 5 + R() * 3; x.beginPath(); if (vertical) { x.moveTo(X + o, Y); x.bezierCurveTo(X + o + 3, Y + H * .3, X + o - 3, Y + H * .7, X + o + 1, Y + H); } else { x.moveTo(X, Y + o); x.bezierCurveTo(X + W * .3, Y + o + 3, X + W * .7, Y + o - 3, X + W, Y + o + 1); } x.stroke(); }
  if (R() < .45) { x.fillStyle = 'rgba(70,40,20,.35)'; x.beginPath(); x.ellipse(X + W * (.2 + R() * .6), Y + H * (.2 + R() * .6), vertical ? 3 : 5, vertical ? 5 : 3, 0, 0, 7); x.fill(); } };
const PAT = {
  // 세로 판자 (나무 벽·문·가구 옆면): 32 px 판, 결·옹이, 이음 그림자
  woodV: x => { for (let i = 0; i < 8; i++) { x.fillStyle = g(.86 + R() * .14); x.fillRect(i * 32, 0, 32, S); grain(x, i * 32, 0, 32, S, true); x.fillStyle = g(.55); x.fillRect(i * 32, 0, 2, S); const cut = R() * S; x.fillRect(i * 32, cut, 32, 2); } },
  // 마루 널 (나무 바닥·상판): 엇갈린 이음, 널마다 다른 톤
  plank: x => { for (let r = 0; r < 8; r++) { const off = R() * S; for (const [bx, L] of [[off, 140], [(off + 140) % S, 116]]) for (const ox of [0, -S]) { x.fillStyle = g(.84 + R() * .16); x.fillRect(bx + ox, r * 32, L, 32); grain(x, bx + ox, r * 32, L, 32, false); x.fillStyle = g(.55); x.fillRect(bx + ox, r * 32, 2, 32); } }
    x.fillStyle = g(.58); for (let r = 0; r <= 8; r++) x.fillRect(0, r * 32 - 1, S, 2); },
  brick: x => { for (let r = 0; r < 8; r++) for (let i = -1; i < 4; i++) { const ox = (r % 2) * 32; x.fillStyle = g(.8 + R() * .2); x.fillRect(i * 64 + ox + 2, r * 32 + 2, 60, 28); }
    stain(x, 6, .12); speck(x, 400, .6, .8); x.fillStyle = g(.6); for (let r = 0; r <= 8; r++) x.fillRect(0, r * 32 - 2, S, 4); for (let r = 0; r < 8; r++) for (let i = 0; i <= 4; i++) x.fillRect(i * 64 + (r % 2) * 32 - 2, r * 32, 4, 32); },
  plaster: x => { speck(x, 2200, .82, 1); stain(x, 9, .14); crack(x, 3, .62); x.fillStyle = g(.72); x.fillRect(0, S - 6, S, 6); },
  tile: x => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = g(.9 + R() * .1); x.fillRect(i * 64, j * 64, 64, 64); x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(i * 64 + 6, j * 64 + 6, 26, 3); }
    x.fillStyle = g(.62); for (let i = 0; i <= 4; i++) { x.fillRect(i * 64 - 1.5, 0, 3, S); x.fillRect(0, i * 64 - 1.5, S, 3); } },
  checker: x => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = g((i + j) % 2 ? .78 : .98); x.fillRect(i * 64, j * 64, 64, 64); } speck(x, 300, .7, .9);
    x.fillStyle = g(.64); for (let i = 0; i <= 4; i++) { x.fillRect(i * 64 - 1, 0, 2, S); x.fillRect(0, i * 64 - 1, S, 2); } },
  siding: x => { for (let r = 0; r < 8; r++) { x.fillStyle = g(.9 + R() * .1); x.fillRect(0, r * 32, S, 32); grain(x, 0, r * 32, S, 32, false); x.fillStyle = g(.6); x.fillRect(0, r * 32 + 27, S, 5); x.fillStyle = 'rgba(255,255,255,.45)'; x.fillRect(0, r * 32, S, 3); } },
  metal: x => { x.fillStyle = g(.95); x.fillRect(0, 0, S, S); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = g(.88 + R() * .1); x.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); x.fillStyle = g(.55); for (const [a, b] of [[8, 8], [116, 8], [8, 116], [116, 116], [62, 8], [62, 116]]) { x.beginPath(); x.arc(i * 128 + a + 2, j * 128 + b + 2, 2.6, 0, 7); x.fill(); } }
    x.fillStyle = g(.6); for (let i = 0; i <= 2; i++) { x.fillRect(i * 128 - 1.5, 0, 3, S); x.fillRect(0, i * 128 - 1.5, S, 3); } stain(x, 3, .1); },
  paving: x => { for (let r = 0; r < 8; r++) for (let i = -1; i < 6; i++) { const ox = (r % 2) * 24; x.fillStyle = g(.8 + R() * .2); x.fillRect(i * 48 + ox + 2, r * 32 + 2, 44, 28); }
    speck(x, 500, .65, .9); x.fillStyle = g(.58); for (let r = 0; r <= 8; r++) x.fillRect(0, r * 32 - 2, S, 4); for (let r = 0; r < 8; r++) for (let i = 0; i <= 6; i++) x.fillRect(i * 48 + (r % 2) * 24 - 2, r * 32, 4, 32); },
  asphalt: x => { speck(x, 4200, .7, 1); stain(x, 7, .16); crack(x, 5, .5); },
  rooftile: x => { for (let r = 0; r < 8; r++) for (let i = -1; i < 9; i++) { const cx = i * 32 + (r % 2) * 16; x.fillStyle = g(.84 + R() * .16); x.beginPath(); x.arc(cx + 16, r * 32 + 4, 17, 0, Math.PI); x.fill();
      x.strokeStyle = g(.55); x.lineWidth = 3; x.beginPath(); x.arc(cx + 16, r * 32 + 4, 17, 0, Math.PI); x.stroke(); } speck(x, 200, .6, .8); },
  slate: x => { for (let r = 0; r < 8; r++) for (let i = -1; i < 6; i++) { const ox = (r % 2) * 24; x.fillStyle = g(.82 + R() * .18); x.fillRect(i * 48 + ox + 1, r * 32 + 1, 46, 30); x.fillStyle = g(.55); x.fillRect(i * 48 + ox, r * 32 + 28, 48, 4); } },
  fabric: x => { for (let i = 0; i < S; i += 4) { x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(i, 0, 2, S); x.fillRect(0, i, S, 2); } x.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 4; i++) x.fillRect(i * 64 + 30, 0, 4, S); },
};
const TEX = new Map();
const texOf = k => { if (!TEX.has(k)) TEX.set(k, tex(PAT[k])); return TEX.get(k); };

// per stage: the grain its orig map used for a light wall, a light floor and a roof (k: how strong)
export const SURF = {
  fire: { wall: 'brick', floor: 'paving', roof: 'rooftile' },
  roof: { wall: 'brick', floor: 'plank', roof: 'rooftile' },
  police: { wall: 'tile', floor: 'checker', roof: 'slate' },
  alley: { wall: 'plaster', floor: 'paving', roof: 'rooftile' },
  corner: { wall: 'siding', floor: 'paving', roof: 'slate' },
  dog: { wall: 'siding', floor: 'plank', roof: 'rooftile' },
  station: { wall: 'siding', floor: 'paving', roof: 'rooftile' },
  car: { wall: 'metal', floor: 'plank', roof: 'metal' },
};
const MAT = new Map();
function surfMat(m, cfg, key) {
  const k = m.uuid + '|' + key;
  if (MAT.has(k)) return MAT.get(k);
  const mm = m.clone(), u = {
    tWall: { value: texOf(cfg.wall) }, tFloor: { value: texOf(cfg.floor) }, tRoof: { value: texOf(cfg.roof) }, tWoodV: { value: texOf('woodV') },
    tPlank: { value: texOf('plank') }, tDark: { value: texOf('asphalt') }, tFab: { value: texOf('fabric') }, kTex: { value: cfg.k ?? .92 },
  };
  mm.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSurfP; varying vec3 vSurfN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurfP = (modelMatrix * vec4(transformed, 1.0)).xyz; vSurfN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tWall, tFloor, tRoof, tWoodV, tPlank, tDark, tFab; uniform float kTex; varying vec3 vSurfP; varying vec3 vSurfN;')
      .replace('#include <color_fragment>', `#include <color_fragment>
      {
        vec3 c = diffuseColor.rgb, n = normalize(vSurfN);
        float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = mx > .001 ? (mx - mn) / mx : 0.0, lum = dot(c, vec3(.299, .587, .114));
        float hue = 0.0;
        if (mx - mn > .001) { if (mx == c.r) hue = mod((c.g - c.b) / (mx - mn), 6.0); else if (mx == c.g) hue = (c.b - c.r) / (mx - mn) + 2.0; else hue = (c.r - c.g) / (mx - mn) + 4.0; }
        hue *= 60.0;
        bool wood = hue > 14.0 && hue < 50.0 && sat > .3 && lum < .62;
        bool dark = sat < .16 && lum < .3;
        bool accent = sat > .38 && !wood;
        vec2 wv = abs(n.x) > abs(n.z) ? vec2(vSurfP.z, vSurfP.y) : vec2(vSurfP.x, vSurfP.y);
        float t = 1.0;
        if (n.y > .8) t = wood ? texture2D(tPlank, vSurfP.xz * 1.25).r : dark ? texture2D(tDark, vSurfP.xz * 1.0).r : accent ? texture2D(tFab, vSurfP.xz * 2.4).r : texture2D(tFloor, vSurfP.xz * 1.25).r;
        else if (n.y > .2) t = texture2D(tRoof, vec2(vSurfP.x + vSurfP.z, vSurfP.y * 1.6) * 1.5).r;
        else if (n.y > -.2) t = wood ? texture2D(tWoodV, wv * 1.25).r : dark ? texture2D(tDark, wv * 1.0).r : accent ? texture2D(tFab, wv * 2.4).r : texture2D(tWall, wv * 1.8).r;
        diffuseColor.rgb *= mix(1.0, t, kTex * smoothstep(.02, .12, lum));
      }`);
  };
  mm.customProgramCacheKey = () => 'gpt-surf3|' + key + '|' + (m.customProgramCacheKey?.() || '');
  MAT.set(k, mm);
  return mm;
}
export function surfaceGroup(root, cfg, key) {
  const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3());
  if (box.isEmpty() || Math.max(size.x, size.y, size.z) < 1.3) return root;
  root.traverse(o => {
    if (!o.isMesh || o.userData.noPaint || o.userData.scenery) return;
    const m = o.material; if (!m || Array.isArray(m) || m.map || !m.vertexColors || (m.transparent && m.opacity < .9)) return;
    o.material = surfMat(m, cfg, key);
  });
  return root;
}
// (10/23 사용자 "채색할수록 이상해진다" → 기본은 꺼짐, ?gpttex=1일 때만 — 비교용)
const TEX_ON = (() => { try { return new URLSearchParams(location.search).get('gpttex') === '1'; } catch (e) { return false; } })();
export function surfaceBuilders(B, name) {
  const cfg = SURF[name]; if (!cfg || !TEX_ON) return B;
  for (const k in B) { const b = B[k]; B[k] = (f, ...a) => { const r = b(f, ...a); surfaceGroup(f.group, cfg, name); return r; }; }
  return B;
}

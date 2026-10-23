// The locked art direction (tuned by the user in the art test, 2026-10-14).
// Cartoon render: matte cel shading, one unified near-black ink line around every object, no crease lines.
// 2026-10-18 the user turned AO on in 세팅 and fixed it ("ao키니까 확실히 좋긴하다"): ao .69, aoR .15, shadowStr .63.
// AO is the first thing a slow phone gives up (World._aoWatch / setLevel). Change values here, not in scenes.
import * as THREE from 'three';
import { setStyle, STYLE } from './kit.js';

export const ART = {
  lineW: 1.5, overlap: .25, innerStr: 0, innerRatio: .7, innerSens: .3, lineAlpha: 1,
  ink: '#1f1a22', tint: 0, tintDark: .9,
  ao: .69, aoR: .15, shadowStr: .63, sharpen: 1.12, shadeTint: 0,
  sun: 2.45, amb: 1.55, ambColor: '#fff0e2', sunColor: '#fff3e0', shade: .6, mid: .84,
};
// live multipliers set from the 세팅 panel (src/tune.js); 1 = as above
export const TUNE = { bright: 1, sunMul: 1, ambMul: 1 };

// pastel → paint: push saturation a little, pull very light tints down so colours read as paint, not chalk
export function vivid(hex) {
  const c = new THREE.Color(hex), h = {}; c.getHSL(h);
  if (h.s < .05) return '#' + c.getHexString();
  h.s = Math.min(1, h.s * 1.1 + .05);
  if (h.l > .82) h.l -= .05;
  c.setHSL(h.h, h.s, h.l);
  return '#' + c.getHexString();
}

// 셰이딩 더하기 (10/22 사용자): live values the 후보정 panel can move (fxpanel.js) — SHADE.set({ ... })
//  · 빛면 하이라이트 hl ("밝은 곳 하이라이트 — 빛 받는 곳 포인트 — 하얗게"): a fourth band on the faces turned most to the sun (the
//    top hlw of 12 slices, about N·L > .67), hl times brighter; the three bands below keep their places. 1 = off (default)
//  · 만화 반짝 점 shine/shineT ("빛 받는 면에 동그랗게 페이크 하이라이트, 만화처럼"; then "약간 더 키워 주고 .35 약하게"): a hard-edged
//    white dot where a round surface faces between the sun and the camera (Blinn half-vector, cut at shineT) — balls, pots,
//    lamps, the friends' heads; flat faces (the camera is orthographic) get none
//  · 림라이트 rim/rimW ("스트로크 유지하고 림라이트 어두운 쪽에" — a reference with cartoon heroes): a thin bright edge on the
//    silhouette of the side turned away from the sun, inside the ink line. 0 = off (default until the user picks a value)
// Patched into every toon material (also the baked furniture) through the prototype, with shared uniforms, so a slider move
// shows at once with no rebuild. ?hl= ?hlw= ?shine= ?shinet= ?rim= ?rimw= still set the start values.
const HLQ = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const qn = (k, d) => HLQ.has(k) && HLQ.get(k) !== '' && !isNaN(+HLQ.get(k)) ? +HLQ.get(k) : d;
export const SHADE = {
  hl: qn('hl', 1), hlw: Math.max(1, Math.min(5, qn('hlw', 2))),
  u: { shineA: { value: qn('shine', .7) }, shineT: { value: Math.min(.999, Math.max(.9, qn('shinet', .992))) },   // (10/23 사용자 값: 반짝 점 세기 .70·크기 .05)
    rimA: { value: qn('rim', .35) }, rimW: { value: Math.min(.6, Math.max(.05, qn('rimw', .31))) }, rimC: { value: new THREE.Color('#fffbcc') },   // (10/23 사용자 값 A: 림 .35·두께 .31·더하기·#fffbcc; B안은 .20·.35·오버레이·#000000)
    shineC: { value: new THREE.Color('#ffffff') }, shineM: { value: 0 }, rimM: { value: 1 } },   // (색·합성: 0 보통 · 1 더하기 · 2 스크린 · 3 오버레이 — user 10/22 "색깔도 변경 가능? 합성 모드도")
  set(o) {
    for (const k of ['shineA', 'shineT', 'rimA', 'rimW', 'shineM', 'rimM']) if (o[k] != null) this.u[k].value = o[k];
    for (const k of ['shineC', 'rimC']) if (o[k]) this.u[k].value.set(o[k]);
    if (o.hl != null || o.hlw != null) { if (o.hl != null) this.hl = o.hl; if (o.hlw != null) this.hlw = o.hlw; const g = STYLE.grad; if (g) { g.image.data.set(toonSteps()); g.needsUpdate = true; } }
  },
};
function toonSteps() {
  const base = [ART.shade, ART.mid, 1];
  return Array.from({ length: 12 }, (_, i) => i >= 12 - SHADE.hlw && SHADE.hl > 1 ? SHADE.hl : base[Math.floor(i / 4)]);
}
function shadePatch() {
  if (THREE.MeshToonMaterial.prototype.__shade) return;
  THREE.MeshToonMaterial.prototype.__shade = true;
  THREE.MeshToonMaterial.prototype.onBeforeCompile = function (sh) {
    Object.assign(sh.uniforms, { uShineA: SHADE.u.shineA, uShineT: SHADE.u.shineT, uRimA: SHADE.u.rimA, uRimW: SHADE.u.rimW, uRimC: SHADE.u.rimC, uShineC: SHADE.u.shineC, uShineM: SHADE.u.shineM, uRimM: SHADE.u.rimM });
    sh.fragmentShader = `uniform float uShineA, uShineT, uRimA, uRimW, uShineM, uRimM; uniform vec3 uRimC, uShineC;
  vec3 sbBlend( vec3 b, vec3 c, float a, float m ) {
    vec3 r = m < 0.5 ? c : m < 1.5 ? b + c : m < 2.5 ? 1.0 - ( 1.0 - b ) * ( 1.0 - c ) : mix( 2.0 * b * c, 1.0 - 2.0 * ( 1.0 - b ) * ( 1.0 - c ), step( 0.5, b ) );
    return mix( b, r, a );
  }
` + sh.fragmentShader.replace('#include <opaque_fragment>', `
  #if NUM_DIR_LIGHTS > 0
  { vec3 sd = directionalLights[ 0 ].direction, hv = normalize( sd + geometryViewDir );
    float ndl = dot( normal, sd );
    // only on curved surfaces: a flat face (one normal across it) facing the half-vector lit up whole — floors went white
    // on some maps (user 10/22: "타는 듯한 느낌이 드는 맵도") — so the dot needs the normal to bend across the pixel
    float curv = smoothstep( 0.002, 0.012, length( fwidth( normal ) ) );
    float k = smoothstep( uShineT, uShineT + 0.004, dot( normal, hv ) ) * step( 0.0, ndl ) * curv;
    outgoingLight = sbBlend( outgoingLight, uShineC, k * uShineA, uShineM );
    float fr = 1.0 - max( dot( normal, geometryViewDir ), 0.0 );
    float r = smoothstep( 1.0 - uRimW, 1.0 - uRimW + 0.03, fr ) * ( 1.0 - smoothstep( -0.05, 0.3, ndl ) ) * curv;
    outgoingLight = sbBlend( outgoingLight, uRimC, r * uRimA, uRimM ); }
  #endif
  #include <opaque_fragment>`);
  };
}
export function useCartoonStyle() { shadePatch(); setStyle('toon', { remap: vivid, steps: toonSteps() }); }

export function applyArt(post) {
  const u = post.u;
  u.innerRatio.value = ART.innerRatio; u.innerStr.value = ART.innerStr; u.lineAlpha.value = ART.lineAlpha; u.overlap.value = ART.overlap;
  u.nLo.value = ART.innerSens; u.nHi.value = ART.innerSens + .18;
  u.ink.value.set(ART.ink); u.tint.value = ART.tint; u.tintDark.value = ART.tintDark;
  u.aoStr.value = post.aoOff ? 0 : ART.ao; post.au.radius.value = ART.aoR;   // (aoOff: given up on a slow phone)
  if (post.du?.sharpen) post.du.sharpen.value = ART.sharpen ?? .45;
}

// Proxies are pick-only (layer 1); transparent bits (blush, glass, blob shadows) draw without ink (layer 2).
export function sortLayers(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    if (o.userData.proxy) o.layers.set(1);
    else if (o.material?.transparent && !o.userData.inkLayer) o.layers.set(2);   // (inkLayer: see-through but outlined as what it is — look.js's meadow running on from a map's floor)
  });
}

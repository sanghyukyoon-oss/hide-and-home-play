// The locked art direction (tuned by the user in the art test, 2026-10-14).
// Cartoon render: matte cel shading, one unified near-black ink line around every object, no crease lines.
// 2026-10-18 the user turned AO on in 세팅 and fixed it ("ao키니까 확실히 좋긴하다"): ao .69, aoR .15, shadowStr .63.
// AO is the first thing a slow phone gives up (World._aoWatch / setLevel). Change values here, not in scenes.
import * as THREE from 'three';
import { setStyle } from './kit.js';

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

// 빛 받는 곳 하이라이트 시험 (10/22 사용자: "밝은 곳 하이라이트 — 리플렉션 말고 빛 받는 곳 포인트 — 하얗게 밝게"): ?hl=1.25[&hlw=2]
// adds a fourth band on the faces turned most to the sun (the top hlw of 12 slices, about N·L > .67), hl times brighter;
// the three bands below keep their places. Off unless asked.
const HLQ = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const HL = +HLQ.get('hl') || 0, HLW = Math.max(1, Math.min(5, +HLQ.get('hlw') || 2));
function toonSteps() {
  const base = [ART.shade, ART.mid, 1];
  if (!(HL > 1)) return base;
  return Array.from({ length: 12 }, (_, i) => i >= 12 - HLW ? HL : base[Math.floor(i / 4)]);
}
// 만화 반짝 점 (10/22 사용자: "빛 받는 면에 동그랗게 페이크 하이라이트? 만화처럼"): ?shine=.6[&shinet=.985]
// a hard-edged white dot where a round surface faces between the sun and the camera (Blinn half-vector, cut at shinet) —
// on balls, pots, lamps and the friends' heads it reads as a cartoon shine; flat faces (the camera is orthographic) get none.
// Patched into every toon material at start-up (also the baked furniture), so it must run before any of them compiles.
const SHINE = HLQ.has('shine') ? +HLQ.get('shine') || 0 : .35, SHINE_T = Math.min(.999, Math.max(.9, +HLQ.get('shinet') || .97));   // (기본 켬 10/22 사용자: "약간 더 키워 주고 .35 약하게"; ?shine=0 끔)
function shinePatch() {
  if (!(SHINE > 0) || THREE.ShaderLib.toon.fragmentShader.includes('cartoon shine')) return;
  THREE.ShaderLib.toon.fragmentShader = THREE.ShaderLib.toon.fragmentShader.replace('#include <opaque_fragment>', `
  // cartoon shine
  #if NUM_DIR_LIGHTS > 0
  { vec3 sd = directionalLights[ 0 ].direction, hv = normalize( sd + geometryViewDir );
    float k = smoothstep( ${SHINE_T.toFixed(4)}, ${(SHINE_T + .004).toFixed(4)}, dot( normal, hv ) ) * step( 0.0, dot( normal, sd ) );
    outgoingLight = mix( outgoingLight, vec3( 1.0 ), k * ${SHINE.toFixed(3)} ); }
  #endif
  #include <opaque_fragment>`);
}
export function useCartoonStyle() { shinePatch(); setStyle('toon', { remap: vivid, steps: toonSteps() }); }

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

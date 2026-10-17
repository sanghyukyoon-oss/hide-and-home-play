// The locked art direction (tuned by the user in the art test, 2026-10-14).
// Cartoon render: matte cel shading, one unified near-black ink line around every object, no crease lines,
// no AO, cast shadows at 30%. Change values here, not in scenes.
import * as THREE from 'three';
import { setStyle } from './kit.js';

export const ART = {
  lineW: 1.5, overlap: .25, innerStr: 0, innerRatio: .7, innerSens: .3, lineAlpha: 1,
  ink: '#1f1a22', tint: 0, tintDark: .9,
  ao: 0, aoR: .1, shadowStr: .9, sharpen: .45, shadeTint: 0,
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

export function useCartoonStyle() { setStyle('toon', { remap: vivid, steps: [ART.shade, ART.mid, 1] }); }

export function applyArt(post) {
  const u = post.u;
  u.innerRatio.value = ART.innerRatio; u.innerStr.value = ART.innerStr; u.lineAlpha.value = ART.lineAlpha; u.overlap.value = ART.overlap;
  u.nLo.value = ART.innerSens; u.nHi.value = ART.innerSens + .18;
  u.ink.value.set(ART.ink); u.tint.value = ART.tint; u.tintDark.value = ART.tintDark;
  u.aoStr.value = ART.ao; post.au.radius.value = ART.aoR;
  if (post.du?.sharpen) post.du.sharpen.value = ART.sharpen ?? .45;
}

// Proxies are pick-only (layer 1); transparent bits (blush, glass, blob shadows) draw without ink (layer 2).
export function sortLayers(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    if (o.userData.proxy) o.layers.set(1);
    else if (o.material?.transparent) o.layers.set(2);
  });
}

// 옮겨 붙인 GPT 장치 가구의 색을 원본 맵에 맞게 차분하게 (②b 10/22 밤 — 허브: "큰 면 부드럽게, 쨍한 색은 작은 포인트만").
// 채도를 조금 빼고 밝기를 흰쪽으로 조금 올림; 진한 색(먹선·어두운 나무, 밝기 .35 밑)은 그대로.
import * as THREE from 'three';
const hsl = {};
export function calm(hex, k = .35) {
  if (typeof hex !== 'string' || hex[0] !== '#') return hex;
  const c = new THREE.Color(hex); c.getHSL(hsl, THREE.SRGBColorSpace);
  if (hsl.l < .35) return hex;
  c.setHSL(hsl.h, hsl.s * (1 - .6 * k), hsl.l + (1 - hsl.l) * .45 * k, THREE.SRGBColorSpace);
  return '#' + c.getHexString(THREE.SRGBColorSpace);
}
export const calmAll = (o, k) => { for (const key in o) o[key] = calm(o[key], k); return o; };

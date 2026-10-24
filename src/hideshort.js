// 숨기 '쉿!' 화면 (10/24 사용자 "뒤쪽에는 캐릭 숨을 때 '쉿!' 이거 없어도 될 거 같아. 한 번 전체 덮는 거 짜증나는 듯"): the
// screen-wide eyes-shut card (하나·둘·셋, then '쉿…') stays for the first two 사건 판 — where hiding is learned — and for a stage
// whose opening draws on it (28판 tunnel). Everywhere else the friend just hops, puffs and is gone; the hiding sounds stay, they
// are the clue, and where it went is not shown (it vanishes where it stood).
import * as THREE from 'three';
import { stageSpec } from './stages.js';
import { stagingHasHide } from './staging.js';

const incBefore = idx => { let n = 0; for (let j = 0; j < idx; j++) if (stageSpec(j)?.incident) n++; return n; };
export const hideCard = S => !S.G.save.r1Counted || incBefore(S.idx) < 2 || stagingHasHide(S);
export async function quickHide(S, f) {
  const G = S.G, W = G.world, tw = S.tw, p0 = f.root.position.clone();
  f.setFace?.('happy'); G.audio.sfx('whoosh');
  await tw.run(.28, k => { f.root.position.y = p0.y + .35 * 4 * k * (1 - k); f.root.rotation.y += .25; }, k => k);
  const s = W.toScreen(new THREE.Vector3(p0.x, p0.y + (f.headTop?.() || .5) * .5, p0.z));
  W.fx.burst(s.x, s.y, { n: 18, colors: ['#ffffff', '#f2f2f6', '#dfe6ee'], shape: 'dot', speed: 160, size: 9, gravity: 60, up: 40, life: .45 });
  f.root.position.copy(p0); f.root.visible = false; G.audio.sfx('pop', 8);
}

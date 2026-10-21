// 열쇠 따기 (③ 10/21, user: "열쇠따는 연출 약간 더 새롭게 더 재밌게 해줄수있어?" → 시안 A·B 중 "a"): 꽂고 돌려 철컥, on its own in ~1.1 s — a
// real little key slides into the keyhole, turns a quarter with three clicks, the shackle springs up and swings open (a beat
// of hitstop), the lock drops off the furniture spinning as the door opens. No camera move, no card, no words.
// Cheap: one small key (four meshes, the stage's own kit helpers), gone with the lock.
import * as THREE from 'three';
import { put, rbox, tor } from './gfx/kit.js';
import { ease } from './util.js';
import { hapticLight } from './feel.js';

function keyMesh() {
  const g = new THREE.Group(), gold = '#ffd23f', o = { metal: .5, rough: .35 };
  g.add(put(rbox(.012, .012, .062, gold, .004, o), 0, 0, .031));         // the shaft, into the hole (−z)
  g.add(put(rbox(.006, .018, .012, gold, .002, o), 0, -.013, .012));     // a bit to turn the lock
  g.add(put(tor(.024, .008, gold, o, Math.PI * 2, 8, 20), 0, 0, .085, 0, Math.PI / 2, 0));   // the bow, edge on to you
  g.add(put(rbox(.022, .01, .01, gold, .003, o), 0, 0, .064));            // the collar
  return g;
}
// the key into the hole: from a hand's width out, in .12 s, with a tock
async function insert(S, m) {
  const k = keyMesh(); k.position.set(0, -.005, .09); m.add(k);
  k.traverse(o => { if (o.isMesh) o.userData.part = m.children[0]?.userData.part; });
  S.G.world.idsDirty = true;
  await S.tw.run(.12, t => { k.position.z = .09 - .062 * t; S.G.world.shadowDirty = true; }, ease.outCubic);
  S.G.audio.sfx('tock'); hapticLight();
  return k;
}

export async function keyOpen(S, part, lp) {
  const G = S.G, W = G.world, m = part.lockMesh; if (!m) return;
  const shackle = m.children[0];
  const k = await insert(S, m); if (S.dead) return;
  // the turn, three clicks
  for (let i = 0; i < 3; i++) setTimeout(() => !S.dead && G.audio.sfx('ratchet'), i * 70);
  await S.tw.run(.21, t => { k.rotation.z = -Math.PI / 2 * t; }, ease.inOutCubic); if (S.dead) return;
  hapticLight();
  // the shackle springs up and swings open
  G.audio.sfx('unlock'); G.hitstop(.05);
  W.fx.burst(lp.x, lp.y - 8, { n: 12, colors: ['#ffe14d', '#ffffff'], speed: 200, shape: 'star', size: 7 });
  W.fx.ring(lp.x, lp.y, { r: 54, color: '#ffe14d', width: 5, life: .3 });
  const sy = shackle.position.y;
  await S.tw.run(.15, t => { shackle.position.y = sy + .035 * t; shackle.rotation.y = 1.0 * t; }, ease.outBack); if (S.dead) return;
  // the lock drops off, spinning (not waited for: the door opens meanwhile)
  const p0 = m.position.clone(), r0 = m.rotation.z;
  S.tw.run(.45, t => { m.position.y = p0.y - .5 * t * t + .06 * t; m.position.z = p0.z + .08 * t; m.rotation.z = r0 + 2.2 * t; m.scale.setScalar(1 - .6 * Math.max(0, t - .5) * 2); W.shadowDirty = true; }, ease.linear)
    .then(() => { m.parent?.remove(m); });
  await S.tw.wait(.08);
}

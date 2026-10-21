// 흑백판 끝: 색이 하나씩 샤샥 (10/21, user on the phone: "색 돌아오는 효과 약간 더 멋지게도 가능? 최적화는 고려해서. 물건 가구마다
// 샤샥 돌아오는 게 일단 좋겠고 효과 이펙트가 좀 들어가면 좋겠음"). Instead of one circle washing over the whole room, each piece of
// furniture, each thing and each friend gets its colour back on its own, one after another in a wave out of the last thing
// found (about 1.2 s for the lot): a little bounce (bigger things bounce less), a pinch of sparkles from the 2D fx layer and a
// rising 퐁. Then the room's shell — walls, floor — floods in with the old circle, quickly, to finish.
// Cheap on purpose (iPhone memory · heat rules): no new materials, textures, canvases or meshes — a piece's colour is the
// post pass's own `colored` flag (its IDs move to 40000+, toonpost.js); the sparkles are the one fx canvas's particles, a few
// per piece, skipped while many are still flying; every scale goes back to exactly where it was.
import * as THREE from 'three';

const ease = k => 1 - (1 - k) * (1 - k);
export async function popColors(S, from) {
  const G = S.G, W = G.world, tw = S.tw, u = W.post.u;
  // what is still grey: the furniture, the things in the room, everyone standing in it
  const RS = S.room.rooms || [S.room], grey = o => o && o.visible !== false && !o.userData.colored;
  // (a thing shut in a drawer or behind a door gets its colour without a show — nobody sees it)
  const shut = new Set((S.items || []).filter(it => it.spot?.part && it.spot.part.t < .5).map(it => it.g));
  const groups = [...RS.flatMap(R => R.furns.map(e => e.f.group)), ...(S.items || []).map(it => it.g),
    S.friend?.root, S.hero?.ch?.root, S.hero?.buddy?.root, ...(S.npcs || []).map(n => n.ch?.root)].filter(grey);
  for (const g of shut) g.userData.colored = true;
  const box = new THREE.Box3(), c = new THREE.Vector3(), sz = new THREE.Vector3();
  const list = [];
  for (const g of new Set(groups)) {
    if (shut.has(g)) continue;
    box.setFromObject(g); if (box.isEmpty()) continue;
    box.getCenter(c); box.getSize(sz);
    list.push({ g, at: new THREE.Vector3(c.x, box.max.y - sz.y * .2, c.z), big: Math.max(sz.x, sz.y, sz.z) > .9, d: Math.hypot(c.x - from.x, c.z - from.z) });
  }
  list.sort((a, b) => a.d - b.d);
  const n = list.length, gap = Math.min(.1, Math.max(.035, 1.15 / Math.max(1, n)));
  const cols = ['#ffe14d', '#ff8fb8', '#8fd3f4', '#9be38f', '#ffffff'];
  const pop = (p, i) => {
    const { g } = p, s0 = g.scale.clone(), amp = p.big ? .05 : .16;
    g.userData.colored = true; W.idsDirty = true;
    tw.run(.24, k => { g.scale.copy(s0).multiplyScalar(1 + amp * Math.sin(Math.PI * k)); W.shadowDirty = true; }, k => k).then(() => g.scale.copy(s0));
    const s = W.toScreen(p.at);
    if (W.fx.ps.length < 60) W.fx.burst(s.x, s.y, { n: p.big ? 7 : 4, colors: cols, shape: 'star', speed: p.big ? 190 : 140, size: p.big ? 9 : 7, life: .5, gravity: 220, up: 60 });
    if (p.big) W.fx.ring(s.x, s.y, { r: 46, color: '#ffffff', width: 5, life: .35 });
    if (i % 2 === 0 || n < 12) G.audio.sfx('pop', Math.min(12, Math.round(i / Math.max(1, n) * 12)));
  };
  G.audio.sfx('bloom');
  for (let i = 0; i < n; i++) {
    if (S.dead) return;
    pop(list[i], i);
    await tw.wait(gap);
  }
  // the shell: walls, floor and whatever is left, out of the same spot — quickly
  const s = W.toScreen(from), C = u.grayC.value.set(s.x / W.W, 1 - s.y / W.H);
  const asp = W.W / W.H, far = Math.max(...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => Math.hypot((x - C.x) * asp, y - C.y))) + .08;
  u.grayR.value = 0;
  await tw.run(.5, k => { u.grayR.value = far * ease(k); W.dirty?.invalidate(); }, k => k);
}

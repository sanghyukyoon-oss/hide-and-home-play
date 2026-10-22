// 지키기 도구 (② 레벨 10/22, 사용자 "방어 도구 같은 거 아이템 기획해 놔 봐" → 기획 _handoff/defense-items-plan-1022.md, 첫 4개):
// a raider at my home who finds something can still be stopped, or fooled — the four bought with coins (no IAP):
//   미끼 상자 (decoybox, 40, one use): a parcel with 몽글이 on a spring inside, placed like furniture. A raider who picks it takes
//     the box instead of a real thing — nothing lost, +10. It goes with them.
//   바나나 껍질 (bananapeel, 30, one use): on the floor. After a find, 60 %: they slip and leave empty-handed. Used up when it trips.
//   경보 벨 (120, two at most, for good): hung on a drawer or a door the way a padlock is (숨기기). A find in that drawer: 50 % they flee.
//   순찰 로봇청소기 (robovac, 240, for good): in the room. After a find, 40 %: it chases them out.
// The stops roll with the friends at home (25 % each, raid.js) as one: at most 85 % together.
import * as THREE from 'three';
import { DEFENSE_BUILDERS, DEFENSE_INFO, attachSpringFace, attachBell, bananaPeel } from './gfx/defense-props.js';
import { APT_BUILDERS } from './gfx/apt-props.js';
import { makeFurniture } from './gfx/furniture.js';

export const TOOLS = {
  decoy: { furn: 'decoybox', price: 40, from: 3 },
  banana: { furn: 'bananapeel', price: 30, from: 6 },
  bell: { price: 120, max: 2, from: 6 },
  robovac: { furn: 'robovac', from: 12 },
};
export const TOOL_ODDS = { bell: .5, banana: .6, robovac: .4, cap: .85, decoyPay: 10, decoyWeight: 4 };
const ROBOVACS = new Set(['robovac', 'robovacgo']);

// what my hiding room has: its furniture, the bells on its drawers
const zoneOf = H => H?.zones?.[H.hide?.zoneId] || null;
export const toolsAt = H => {
  const fs = zoneOf(H)?.furniture || [];
  return { decoys: fs.filter(f => f.type === 'decoybox'), peels: fs.filter(f => f.type === 'bananapeel'), robovac: fs.some(f => ROBOVACS.has(f.type)), bells: H?.hide?.bells || {} };
};
// a one-use piece leaves the room (it went with the raider, or it tripped someone)
export function useUp(H, piece) { const z = zoneOf(H); if (z) z.furniture = z.furniture.filter(f => f !== piece); }
export const bellsOwned = save => save.raid?.bellsOwned || 0;
export const bellsUsed = save => Object.keys(save.home?.hide?.bells || {}).length;

// the furniture: the peel (①) and the decoy — the 택배상자 with the spring face folded in it
export const DEF_BUILDERS = { ...DEFENSE_BUILDERS, decoybox: (f, T) => { APT_BUILDERS.parcel(f, T); f.springFace = attachSpringFace(f); } };
export const DEF_INFO = {
  bananapeel: { ...DEFENSE_INFO.bananapeel, hidden: false },   // (a picture for 꾸미기's inventory: hidden would skip it)
  decoybox: { w: 1, d: 1, name: '미끼 상자', small: true },
};

// ── 남의 집을 털 때 (타이머 털기, raidrun.js): the neighbours guard theirs too — the way you first meet each tool, before it is
// in the shop (사용자 기획 OK 10/22: "털다가 당해 보고 사고 싶어지게"). By the house's tier: 2 a peel or a decoy, 3 + a bell on a drawer
// with something in it, 4 all three. Each catches you once: a peel −3 s and a spin, a decoy −3 s and 몽글이 springs out ("메롱!"),
// a bell −5 s as the drawer opens (it still opens). The first time you meet one, the end card says it can go in your home too.
export const TOOL_NAME = { decoy: '미끼 상자', banana: '바나나 껍질', bell: '경보 벨', robovac: '로봇청소기' };
const LOSE = { banana: 3, decoy: 3, bell: 5 };
function seed(str) { let x = 2166136261; for (let i = 0; i < str.length; i++) x = Math.imul(x ^ str.charCodeAt(i), 16777619) >>> 0; return () => ((x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0) % 1e6) / 1e6; }
export function raidTools(S) {
  const C = S.custom, tier = C?.tier || 1; if (tier < 2 || !S.raidRun) return;
  const G = S.G, W = G.world, R = S.room, rnd = seed(String(C.id || C.owner || 'h') + 'tools');
  const want = tier >= 4 ? ['banana', 'decoy', 'bell'] : tier >= 3 ? [rnd() < .5 ? 'banana' : 'decoy', 'bell'] : [rnd() < .5 ? 'banana' : 'decoy'];
  S.raidTools = { met: new Set(), on: [] };
  // a spot on the floor in front of a piece of furniture, clear of the others
  const furns = (R.rooms || [R]).flatMap(r => r.furns || []).filter(e => e.f?.group && !e.f.wall);
  const centers = furns.map(e => e.f.group.getWorldPosition(new THREE.Vector3()));
  const floorSpot = () => {
    for (let k = 0; k < 30; k++) {
      const i = Math.floor(rnd() * furns.length), e = furns[i]; if (!e) break;
      const q = new THREE.Quaternion(); e.f.group.getWorldQuaternion(q);
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q); fwd.y = 0; fwd.normalize();
      const p = centers[i].clone().addScaledVector(fwd, (e.f.d || 1) * .5 + .45); p.y = 0;
      if (centers.every((c, j) => j === i || Math.hypot(c.x - p.x, c.z - p.z) > .6) && !S.raidTools.on.some(o => o.g.position.distanceTo(p) < .8)) return p;
    }
    return null;
  };
  for (const k of want) {
    if (k === 'bell') {
      const parts = R.parts.filter(p => p.lockable && !p.lock && p.spots?.some(s => s.item?.role === 'target'));
      const p = parts[Math.floor(rnd() * parts.length)]; if (!p) continue;
      const b = attachBell(p.furn, p); if (!b) continue;
      p.raidBell = b; S.raidTools.on.push({ k, g: b.g, part: p });
      continue;
    }
    const at = floorSpot(); if (!at) continue;
    const g = new THREE.Group(); g.position.copy(at); g.rotation.y = rnd() * Math.PI * 2;
    let face = null;
    if (k === 'banana') g.add(bananaPeel());
    else { const f = makeFurniture('decoybox', S.th || {}); face = f.springFace; g.add(f.group); }   // (the 택배상자 with 몽글이 folded in it)
    g.traverse(o => { if (o.isMesh) { o.userData.raidTool = k; o.castShadow = true; } });
    R.group.add(g); S.raidTools.on.push({ k, g, face });
  }
  // a tap that lands on a peel or a decoy first: it catches you (once each)
  const tap0 = S.tap.bind(S);
  S.tap = (x, y) => {
    if (S.running && !S.paused && !S.result && !G.world.flying) {
      const hit = W.pick(x, y, S.pickRoots())[0];
      let o = hit?.object; while (o && !o.userData.raidTool) o = o.parent;
      const T = o && S.raidTools.on.find(t => t.k === o.userData.raidTool && !t.used && (t.g === o || t.g.getObjectById(o.id)));
      if (T) return caught(S, T, x, y);
    }
    return tap0(x, y);
  };
  // a belled drawer: it rings as it opens (the drawer still opens)
  const part0 = S.onPart.bind(S);
  S.onPart = (part, x, y) => {
    const T = part.raidBell && S.raidTools.on.find(t => t.part === part && !t.used);
    if (T && part.t < .5) caught(S, T, x, y);
    return part0(part, x, y);
  };
}
function caught(S, T, x, y) {
  const G = S.G, W = G.world; T.used = true; S.raidTools.met.add(T.k);
  const s = Math.max(0, LOSE[T.k] || 3);
  if (S.timerOn) S.time = Math.max(1, S.time - s);
  if (T.k === 'banana') {
    G.audio.sfx('slide'); G.ui.floatText(x, y - 60, `미끄덩! -${s}초`, 'red big');
    const y0 = W.yaw; S.tw.run(.6, k => { W.yaw = y0 + Math.sin(k * Math.PI) * .9; });
    S.tw.run(.5, k => { T.g.rotation.y += .4; T.g.position.y = Math.sin(k * Math.PI) * .25; });
  } else if (T.k === 'decoy') {
    G.audio.sfx('giggle'); G.ui.floatText(x, y - 60, `메롱! 미끼였다 -${s}초`, 'red big');
    S.tw.run(.7, k => T.face?.pop(k));
  } else {
    G.audio.sfx('doorBell'); G.ui.floatText(x, y - 60, `따르르릉! -${s}초`, 'red big');
    const b = T.part.raidBell; S.tw.run(1.4, k => b.ring(k * 1.4));
  }
  W.shadowDirty = true;
}
// the end card's line: a tool met for the first time can go in my home now (상점 아이템)
export function newToolsMet(S) {
  const R = S.G.save.raid || (S.G.save.raid = {}), seen = R.toolSeen || (R.toolSeen = {}), out = [];
  for (const k of S.raidTools?.met || []) if (!seen[k]) { seen[k] = 1; out.push(k); }
  return out;
}

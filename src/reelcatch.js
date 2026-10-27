// 낚싯대 릴 뽑기 (user 10/19, 3판: "낚시 도르래 내렸다 올리면 사물 바뀌게도 가능? ㅋㅋ 없게도 나오고. 아무것도 당첨 안 되는 게
// 뻔하지 않아서 좋다"): each time the reel winds the keep-net up, what's in it changes — an old boot, a clump of weed, an
// empty can, or nothing at all. If something to find really is in the net, the first cast never shows it, the second
// shows it six times in ten, the third always (정본 세션: pure chance could hide a thing for good). Winding the reel is
// opening a part, so it never costs a tap. A bot gets the real catch at once. ?reel=0 turns it off.
import * as THREE from 'three';
import { mat } from './gfx/kit.js';
import { moveItem } from './hunt.js';
import { ITEMS } from './gfx/items.js';
import { spotFits } from './fitspot.js';
import { affOk, isCold } from './affinity.js';
import { EN } from './i18n-en-dict.js';
import { tr } from './i18n.js';

const K = (ko, en) => { EN[ko] = en; return ko; };

const ON = typeof location === 'undefined' || !/[?&]reel=0(&|$)/.test(location.search);
const JUNK = {
  boot: { line: K('장화가 낚였다… 개굴.', 'Caught a boot… ribbit.'), make: () => { const g = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.045, .05, .14, 12), mat('#7a5a3a')); leg.position.set(0, .1, 0); g.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.1, .05, .16), mat('#6a4a2e')); foot.position.set(0, .03, .04); g.add(foot);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(.11, .015, .17), mat('#3b2c22')); sole.position.set(0, .005, .04); g.add(sole);
    return g; } },
  weed: { line: K('수초만 주렁주렁!', 'Nothing but weeds!'), make: () => { const g = new THREE.Group();
    for (let k = 0; k < 7; k++) { const h = .12 + (k % 3) * .04, b = new THREE.Mesh(new THREE.CylinderGeometry(.008, .014, h, 5), mat(k % 2 ? '#5aa84a' : '#3f8f5a'));
      const a = k / 7 * Math.PI * 2; b.position.set(Math.cos(a) * .05, h / 2, Math.sin(a) * .05); b.rotation.set(Math.sin(a) * .5, 0, Math.cos(a) * .5); g.add(b); }
    return g; } },
  can: { line: K('빈 깡통이네. 쩝.', 'Empty can. Meh.'), make: () => { const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .1, 14), mat('#b9c2cf')); c.position.set(0, .04, 0); c.rotation.z = 1.3; g.add(c);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.041, .041, .04, 14), mat('#ff6a5a')); band.position.copy(c.position); band.rotation.z = 1.3; g.add(band);
    return g; } },
  none: { line: K('꽝! 물고기도 없네.', 'Nothing! Not even a fish.'), make: null },
};
// (문구: 스토리 룸 10/19 — 진짜가 남았다는 신호를 개굴이 목소리로: 힌트가 아니라 놀이로 읽히게)
const AGAIN = K(' 한 번 더 감아 봐, 개굴!', ' Reel it again, ribbit!');

export function reelSetup(S) {
  if (!ON || S.custom || S.preview) return;
  for (const p of S.room.parts || []) if (p.furn?.type === 'fishdock' && p.spots?.length) p.reel = { casts: 0, junk: null, kind: null };
  // 3판 (the fishing ground): one thing on the list always waits in the keep-net, so everyone meets the reel's surprise
  const reel = S.room.parts.find(p => p.reel), spot = reel?.spots[0];
  // (29판 연못 집 10/24, 사용자 "물레방아에서 건질 수 있는 뭔가도 넣어 줘": the waterwheel's bucket always brings one thing up too —
  // the tadpole jar when it is on the list)
  const pond = S.spec.room === 'frogpond';
  if ((S.idx === 2 || pond) && spot && !(spot.item && spot.item.role === 'target')) {
    // (a drink, kept cool in the water — 스토리 룸 10/19: a ball or a donut in the net made no sense; and only what fits in it)
    const ok = t => !t.found && !t.friend && !t.spot.part && ITEMS[t.type] && ITEMS[t.type].h * (spot.scale || 1) <= spot.maxH + .001 && spotFits(t.type, spot) && affOk(t.type, spot);
    // (10/27 사용자 실폰 29판: the 오리발 came up the waterwheel "ㅈㄴ 크고 너무 어색함" — at the pond only a small thing from the water
    // comes up: the tadpole jar, else the rubber duck, else the conch; none of them on the list, nothing moves)
    const POND_UP = ['tadpolejar', 'rubberduck2', 'gpt_conch'];
    const pondIt = pond && POND_UP.map(k => S.targets.find(t => !t.found && !t.friend && !t.spot.part && t.type === k)).find(Boolean);
    const it = pond ? pondIt : S.targets.find(t => ok(t) && isCold(t.type) && t.spot.kind !== 'on') || S.targets.find(t => ok(t) && isCold(t.type)) || S.targets.find(t => ok(t) && t.spot.kind !== 'on') || S.targets.find(ok);
    if (it && !spot.item) moveItem(it, spot);
  }
}

const realIn = part => part.spots.filter(s => s.item && !s.item.found && s.item.role !== 'decoy');

// called as the net starts up: decide this cast; true = a junk catch (the real thing, if any, stays hidden)
export function reelCast(S, part) {
  const R = part.reel; if (!R) return false;
  R.casts++;
  if (S.botOn?.()) return false;
  const real = realIn(part);
  let junk;
  if (real.length) junk = R.casts === 1 || (R.casts === 2 && Math.random() < .4);
  else junk = true;
  if (!junk) return false;
  const keys = Object.keys(JUNK).filter(k => k !== R.kind);   // never the same thing twice in a row
  const k = keys[Math.floor(Math.random() * keys.length)];
  R.kind = k;
  for (const s of part.spots) if (s.itemGroup) s.itemGroup.visible = false;
  const spot = part.spots[0], make = JUNK[k].make;
  if (make && spot?.anchor) { const g = make(); g.scale.setScalar(spot.scale || .75); spot.anchor.add(g); R.junk = g; }
  S.G.world.idsDirty = true;
  return true;
}

// after the net is up: say what came up
export function reelSay(S, part) {
  const R = part.reel; if (!R?.kind) return;
  const W = S.G.world, at = new THREE.Vector3(); (part.spots[0]?.anchor || part.pivots[0]).getWorldPosition(at);
  const p = W.toScreen(at);
  S.G.ui.floatText(p.x, p.y - 40, tr(JUNK[R.kind].line) + (realIn(part).length ? tr(AGAIN) : ''), R.kind === 'none' ? 'red' : '');
  S.G.audio.sfx(R.kind === 'none' ? 'wobble' : 'pop');
}

// as the net goes down: take the junk away (the next cast decides again)
export function reelClear(S, part) {
  const R = part.reel; if (!R) return;
  if (R.junk) { R.junk.parent?.remove(R.junk); R.junk.traverse(o => o.geometry?.dispose?.()); R.junk = null; }
  R.kind = null; S.G.world.idsDirty = true;
}
export const isJunkUp = part => !!part.reel?.kind;

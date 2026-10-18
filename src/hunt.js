// 숨은그림 판 다듬기 (10/18, user: "물건 진득하게 찾는거를… 다시 레벨디자인과 스토리 짜봐… 다되면 정본에 던져"). Which stage
// is a hidden-object stage, its count and its lines are the canonical stage mix's (stages.js FRIEND_HIDE, script.js
// hidden scenes). This adds what those leave open:
//   · about half the things go where the host would put them (곰돌이 by food, 개굴이 by water…) — knowing them helps
//   · places nobody can see into, even opened, are never used (measured per room: hunt-blind.js); anything still out of
//     sight moves somewhere visible as the stage loads, and a lock on such a place comes off
//   · a key or a note out in the open sits where the starting view can see it
//   · the friend you meet next peeks out from behind something — an optional find (a hello and 20 coins), never on the list
// ?hunt=0 turns all of it off, ?peek=0 only the peeking friend.
import * as THREE from 'three';
import { EN } from './i18n-en-dict.js';
import { Char, CHAR_DEFS } from './gfx/chars.js';
import { ITEMS } from './gfx/items.js';
import { attachItem } from './room.js';
import { THEMES, stageSpec, STAGE_COUNT } from './stages.js';
import { hostAt } from './script.js';
import { blindFor } from './hunt-blind.js';

const K = (ko, en) => { if (en) EN[ko] = en; return ko; };
export const HUNT = !/[?&]hunt=0(&|$)/.test(location.search);
const NO_PEEK = /[?&]peek=0(&|$)/.test(location.search);
// an ordinary stage that isn't a friend-hiding one (the canonical mix decides which those are)
export const isHunt = spec => HUNT && !spec.custom && !spec.endless && !spec.boss && !spec.timed && !spec.gray && !spec.incident && !(spec.tut <= 2) && spec.idx >= 3;

// where each friend puts things (matched against furniture type names)
const HABIT = {
  bear: ['kotatsu', 'table', 'fridge', 'kitchen', 'counter', 'dish', 'snack', 'cab', 'rice'],
  frog: ['pond', 'fish', 'cool', 'reed', 'bait', 'tackle', 'bath', 'sink', 'wash', 'fountain', 'pool', 'water', 'well', 'stream'],
  bunny: ['bed', 'sofa', 'bean', 'zabuton', 'pillow', 'laundry', 'cushion', 'duvet', 'futon'],
  peng: ['fridge', 'freez', 'kimchi', 'ice', 'shelf', 'loft', 'wardrobe', 'attic'],
  cat: ['shelf', 'wardrobe', 'tower', 'box', 'crate', 'dresser', 'top'],
  shiba: ['bin', 'trash', 'fridge', 'counter', 'shop', 'food', 'dog', 'mart', 'cart', 'snack'],
  grumpy: ['chair', 'bench', 'stool', 'aircon', 'pot', 'jar', 'crate'],
  squirrel: ['tree', 'bush', 'planter', 'flower', 'stump', 'log', 'bench', 'basket'],
  hamster: ['basket', 'picnic', 'box', 'seed', 'mat', 'bush', 'cart'],
  sundae: ['fridge', 'freez', 'cool', 'ice', 'wash', 'dry', 'case', 'cafe'],
  panda: ['bamboo', 'tent', 'log', 'tree', 'stump', 'wood', 'chair', 'hammock'],
  sleepy: ['bed', 'tent', 'sleep', 'mat', 'pillow', 'hammock', 'chair'],
  nerd: ['book', 'shelf', 'desk', 'cabinet', 'file', 'safe', 'drawer'],
  dj: ['speaker', 'stage', 'kpop', 'amp', 'light', 'stand'],
  robot: ['drawer', 'cabinet', 'locker', 'file', 'box', 'shelf'],
};
// the planner gets the host's habit places and the room's blind places (stages.js planStage: spec.prefer / spec.avoid)
export const huntExtras = (spec, host) => ({ ...spec, prefer: HABIT[host] || null, avoid: blindFor(spec.room) });

// ── things where they can be seen
export function moveItem(it, spot) {
  const g = it.g, old = it.spot, k = g.scale.x / (old.scale || 1);
  for (const ch of [...g.children]) if (ch.userData.proxy) g.remove(ch);
  g.parent?.remove(g);
  if (old.item === it) old.item = null;
  attachItem(spot, g, { rotY: g.rotation.y, scale: k });
  it.spot = spot; spot.item = it;
}
const CHAIN = new Set(['key', 'note', 'color', 'treat', 'tool', 'sock', 'book', 'gadget']);
const fitsSpot = (type, s) => { const I = ITEMS[type]; return !!I && I.h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || I.flat); };
// a key or a note out in the open that the start view can't see moves to the nearest free open place it can see
export function chainToView(S) {
  const W = S.G.world, R = S.room; let moved = null;
  for (const it of S.items) {
    if (!CHAIN.has(it.role) || it.found || it.vacHidden || it.spot.part) continue;
    if (!W.occluded(it.g, S.worldCenter(it), [R.group])) continue;
    const o = S.worldCenter(it);
    const spots = R.spots.filter(s => !s.item && !s.part && s.kind === 'on' && !s.wallFace && s.anchor && fitsSpot(it.type, s)).map(s => ({ s, d: s.anchor.getWorldPosition(new THREE.Vector3()).distanceTo(o) })).sort((a, b) => a.d - b.d).slice(0, 8);
    for (const { s } of spots) {
      const old = it.spot; moveItem(it, s);
      if (!W.occluded(it.g, S.worldCenter(it), [R.group])) { moved = `${it.type}: ${old.label} → ${s.label}`; break; }
      moveItem(it, old);
    }
  }
  W.idsDirty = true; W.shadowDirty = true;
  return moved;
}
// the safety net behind hunt-blind.js: a thing (or a key, a note) that can't be seen from 2 of 12 views even opened moves
// to the nearest free place that can be; a thing behind a lock only moves inside that piece, and if that piece can't be
// seen into at all, the lock and its clue come off. Out on top of things is skipped (seen, and this runs while loading).
export function fixBlindSpots(S) {
  const W = S.G.world, R = S.room, keep = { y: W.yaw, p: W.pitch, z: W.zoom, t: W.target.clone() }, moved = [], t0 = performance.now();
  const views = it => {
    const part = it.spot.part, wasT = part?.t ?? 0;
    if (part) { part.setOpen(1); it.g.visible = true; }
    W.zoom = 1; W.target.copy(S.worldCenter(it));
    let v = 0;
    for (const p of [.62, .95]) for (let k = 0; k < 6; k++) { W.yaw = k * Math.PI / 3 + Math.PI / 6; W.pitch = p; W.updateCam(); R.update(1); R.group.updateMatrixWorld(true); if (!W.occluded(it.g, S.worldCenter(it), [R.group])) { v++; if (v >= 2) break; } }
    if (part) { part.setOpen(wasT); it.g.visible = wasT > .05; }
    return v;
  };
  const near = (o, ok, n) => R.spots.filter(s => !s.item && !s.reserved && !s.wallFace && s.anchor && ok(s)).map(s => ({ s, d: s.anchor.getWorldPosition(new THREE.Vector3()).distanceTo(o) })).sort((a, b) => a.d - b.d).slice(0, n).map(x => x.s);
  for (const it of [...S.items]) {
    if (performance.now() - t0 > 450) break;   // a time budget, not a hitch
    if (it.found || it.vacHidden || !(it.role === 'target' || CHAIN.has(it.role))) continue;
    if (it.spot.kind === 'on' && !it.spot.part) continue;
    if (views(it) >= 2) continue;
    const o = S.worldCenter(it), lockedIn = it.spot.part?.lock ? it.spot.part : null;
    const open = s => fitsSpot(it.type, s) && (!s.part || ((s.part.reach ?? 1) >= .55 && !s.part.lock));
    let ok = false;
    for (const s of near(o, s => fitsSpot(it.type, s) && (lockedIn ? s.part === lockedIn : open(s)), 5)) {
      const old = it.spot; moveItem(it, s);
      if (views(it) >= 2) { moved.push(`${it.type}: ${old.label} → ${s.label}`); ok = true; break; }
      moveItem(it, old);
    }
    if (!ok && lockedIn) {
      const L = S.plan.locks.find(l => l.part === lockedIn); if (L) S.plan.locks.splice(S.plan.locks.indexOf(L), 1);
      lockedIn.lock = null; if (lockedIn.lockMesh) { lockedIn.lockMesh.parent?.remove(lockedIn.lockMesh); lockedIn.lockMesh = null; }
      for (const c of S.items.filter(c => c.forPart === lockedIn && !c.found)) { c.g.parent?.remove(c.g); if (c.spot.item === c) c.spot.item = null; c.gone = true; }
      S.items = S.items.filter(c => !c.gone);
      for (const s of near(o, open, 6)) {
        const old = it.spot; moveItem(it, s);
        if (views(it) >= 2) { moved.push(`${it.type}: ${old.label} → ${s.label} (자물쇠 뗌)`); break; }
        moveItem(it, old);
      }
    }
  }
  W.yaw = keep.y; W.pitch = keep.p; W.zoom = keep.z; W.target.copy(keep.t); W.updateCam(); R.update(1);
  W.idsDirty = true; W.shadowDirty = true;
  return moved;
}

// ── the friend you meet next, peeking: the next hidden-object / friend stage's host who isn't this one and wasn't the
// last peeker. 먹물이 peeks only at three turns of its story (13, 41, 63판).
const INKY_AT = new Set([12, 40, 62]);
let PEEK = null;
function peekers() {
  if (PEEK) return PEEK;
  PEEK = {}; let last = null;
  for (let i = 3; i < STAGE_COUNT; i++) {
    const s = stageSpec(i); if (!isHunt(s)) continue;
    const host = hostAt(i) || THEMES[s.room]?.friend;
    let k = INKY_AT.has(i) ? 'inky' : null, first = null;
    for (let j = i + 1; !k && j < Math.min(STAGE_COUNT, i + 9); j++) {
      const t = stageSpec(j); if (t.timed || t.gray) continue;
      const c = hostAt(j) || THEMES[t.room]?.friend;
      if (!c || c === host || c === 'inky' || !CHAR_DEFS[c]) continue;
      first ||= c; if (c !== last) k = c;
    }
    PEEK[i] = k || first; last = PEEK[i];
  }
  return PEEK;
}
export const cameoKind = idx => peekers()[idx] || null;
const CAMEO = {
  bunny: K('킥, 들켰다! 다음엔 우리 집에서도 찾아 줘!', "Hee, busted! Come find things at my place next!"),
  bear: K('으헤헤, 몰래 보고 있었어. 다음엔 우리 집!', 'Ehehe, I was watching. My place next!'),
  frog: K('개굴! 들켰다~ 내 낚시터에도 와!', 'Ribbit! Busted~ Come to my fishing spot!'),
  nerd: K('흠. 관찰력이 좋군. 내 서재로 와 보게.', 'Hm. Sharp eyes. Come to my study.'),
  peng: K('펭! 몰래 구경 중이었어. 다음은 우리 집이야!', "Peng! Just watching. My house is next!"),
  cat: K('흥. 그냥 지나가던 거다냥.', 'Hmph. Just passing by.'),
  inky: K('…킥. 나도 숨는 거 잘해.', "…Heh. I'm good at hiding too."),
  shiba: K('킁! 잠복 중이었는데… 순찰 같이 가자!', 'Sniff! I was on stakeout… Come on patrol!'),
  grumpy: K('…뭘 봐. 우리 골목 오든가.', "…What? Come to my alley, then."),
  hamster: K('웁! 볼 때문에 들켰어!', 'Mmf! My cheeks gave me away!'),
  sundae: K('앗, 녹기 전에 들켰다! 우리 가게도 와!', 'Oh, busted before I melted! Come to my shop!'),
  squirrel: K('헉, 도토리 줍다 들켰어!', 'Eek, caught picking up acorns!'),
  panda: K('천천히 와. 산에서 기다릴게.', "Take your time. I'll wait on the mountain."),
  sleepy: K('음냐… 여기서 자다 들켰네…', 'Mmh… caught napping here…'),
  robot: K('삐빅. 관찰 결과: 들킴.', 'BEEP. Observation: spotted.'),
  dj: K('둠칫! 비트 맞추다 들켰다!', 'Boom-tss! Caught mid-beat!'),
  skater: K('요! 다음엔 파크로 와!', 'Yo! Hit the park next!'),
};
const CAMEO_ANY = K('들켰다! 다음에 또 보자!', 'Busted! See you next time!');
// a real character, crouched behind a big piece of furniture with only part of it showing (not on the list)
export function placeCameo(S) {
  const kind = !NO_PEEK && cameoKind(S.idx); if (!kind) return null;
  const W = S.G.world, furns = (S.room.rooms || [S.room]).flatMap(R => R.furns);
  const boxes = furns.map(e => ({ e, b: new THREE.Box3().setFromObject(e.f.group) })).filter(o => o.b.max.y - o.b.min.y > .06);
  const R = S.room, cz = R.center?.z || 0, all = boxes.reduce((u, o) => u.union(o.b), new THREE.Box3());
  const inside = R.w && R.d ? (x, z) => Math.abs(x) < R.w / 2 - .25 && Math.abs(z - cz) < R.d / 2 - .25 : (x, z) => x > all.min.x + .1 && x < all.max.x - .1 && z > all.min.z + .1 && z < all.max.z - .1;
  const free = (x, z, pad = .05) => inside(x, z) && !boxes.some(o => x > o.b.min.x - pad && x < o.b.max.x + pad && z > o.b.min.z - pad && z < o.b.max.z + pad);
  const ch = new Char(kind); ch.root.scale.multiplyScalar(.8); ch.pose = 'idle'; ch.setFace?.('happy');
  W.root.add(ch.root);
  const hostAtPos = S.friend.root.position, y0 = W.yaw, p0 = W.pitch, t0 = performance.now();
  const roots = [S.room.group, ch.root];
  let best = null;
  const tall = boxes.filter(o => o.b.max.y - o.b.min.y > .45 && o.b.max.y < 2.4).sort(() => Math.random() - .5);
  for (const o of tall.slice(0, 8)) {
    if (best?.score >= 14 || performance.now() - t0 > 350) break;   // good enough, or out of time (it runs while the stage loads)
    const c = o.b.getCenter(new THREE.Vector3()), sz = o.b.getSize(new THREE.Vector3());
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const half = Math.abs(nx) * sz.x / 2 + Math.abs(nz) * sz.z / 2, tHalf = Math.abs(nz) * sz.x / 2 + Math.abs(nx) * sz.z / 2;
      for (const tk of [.75, -.75]) {
        const x = c.x + nx * (half + .22) + nz * tHalf * tk, z = c.z + nz * (half + .22) - nx * tHalf * tk;
        if (!free(x, z) || Math.hypot(x - hostAtPos.x, z - hostAtPos.z) < 1.2) continue;
        ch.root.position.set(x, o.b.min.y, z); ch.root.rotation.y = Math.atan2(W.cam.position.x - x, W.cam.position.z - z); ch.root.updateMatrixWorld(true);
        const head = new THREE.Vector3(x, o.b.min.y + .45, z);
        const atStart = !!W.visibleAt(ch.root, head, roots);
        let views = 0;
        for (let k = 0; k < 4; k++) { W.yaw = y0 + k * Math.PI / 2; W.pitch = p0; W.updateCam(); S.room.update(1); if (W.visibleAt(ch.root, head, roots)) views++; }
        W.yaw = y0; W.pitch = p0; W.updateCam(); S.room.update(1);
        if (!views) continue;
        const covered = coveredFrac(S, ch);
        const score = (atStart ? 6 : 2) + (covered > .3 && covered < .85 ? 6 : 0) + Math.min(views, 3);
        if (!best || score > best.score) best = { x, z, y: o.b.min.y, score, atStart, views, covered, near: o.e.type };
      }
    }
  }
  if (!best) { W.root.remove(ch.root); return null; }
  ch.root.position.set(best.x, best.y, best.z); ch.root.rotation.y = Math.atan2(W.cam.position.x - best.x, W.cam.position.z - best.z);
  const it = { type: 'cameo', role: 'cameo', cameo: true, kind, ch, g: ch.root, spot: { kind: 'behind', label: '몰래 엿보는 친구', part: null }, found: false };
  ch.root.userData.item = it; ch._cameo = it;
  S.cameoInfo = { kind, near: best.near, atStart: best.atStart, views: best.views, covered: +best.covered.toFixed(2) };
  return it;
}
function coveredFrac(S, ch) {
  const W = S.G.world, b = new THREE.Box3().setFromObject(ch.root), pts = [];
  for (const fx of [.2, .5, .8]) for (const fy of [.25, .55, .85]) pts.push(new THREE.Vector3(b.min.x + (b.max.x - b.min.x) * fx, b.min.y + (b.max.y - b.min.y) * fy, (b.min.z + b.max.z) / 2));
  let hidden = 0;
  for (const p of pts) { const s = W.toScreen(p); const hit = W.pick(s.x, s.y, [S.room.group, ch.root]).find(hh => !hh.object.userData.proxy); let mine = false; for (let o = hit?.object; o; o = o.parent) if (o === ch.root) { mine = true; break; } if (!mine) hidden++; }
  return hidden / pts.length;
}
// found: it hops out in front of what it hid behind, says hello and stays — 20 coins, the list doesn't change
export async function cameoFound(S, it) {
  if (it.found) return;
  const G = S.G, W = G.world, ch = it.ch;
  it.found = true; S.idle = 0;
  const p = ch.root.position.clone(), s = W.toScreen(p.clone().setY(p.y + .5));
  W.fx.burst(s.x, s.y, { n: 22, colors: ['#ffe14d', '#ff8fb8', '#8fd3f4', '#ffffff'], speed: 320 });
  G.audio.sfx('special'); G.hitstop(.06);
  if (!S.preview) { G.addCoins(20); G.ui.floatText(s.x, s.y - 40, '+20', 'gold'); }
  const to = p.clone().add(new THREE.Vector3(W.cam.position.x - p.x, 0, W.cam.position.z - p.z).normalize().multiplyScalar(.45));
  ch.pose = 'cheer'; ch.setFace?.('wow');
  await S.tw.run(.45, k => { ch.root.position.lerpVectors(p, to, k); ch.root.position.y = p.y + Math.sin(k * Math.PI) * .5; });
  if (S.dead) return;
  ch.faceTo?.(W.cam.position.x, W.cam.position.z);
  S.say(ch, CAMEO[it.kind] || CAMEO_ANY, 2000);
  setTimeout(() => { if (!S.dead) { ch.pose = 'idle'; ch.setFace?.('happy'); } }, 1600);
}

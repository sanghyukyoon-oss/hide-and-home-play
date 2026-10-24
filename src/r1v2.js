// 몰래 숨기 v2 '단서의 문법' (prototype, 10/18 review — only with ?hide=2, on stages 4·5; ?hide=2&v2=all tries every
// single-floor 사건 판). R1 told the answer three ways (a bubble over the real hideout, only the real one locked, the real
// one wobbling after the first wrong guess). Here the player has to work it out from the friend's own traces:
//   1. no word from a place: after hiding, the voice is a subtitle at the bottom, with no position
//   2. one key, three locks: the three candidates carry the same lock and the key comes back after each use (a guess)
//   3. always three candidates (lids, doors and drawers first, then lifts)
//   4. the trail is the friend's own (곰돌이 honey drops, 개굴이 wet footprints) — flat marks, not things you can pick up
//   5. the friend's tell peeks out (a tail, a foot) on a side you only see after turning the room
//   6. a sound has a direction (left/right in the speakers + an arrow in the subtitle), and each hideout has its own sound
//      (heard with your eyes shut: …탁! / …딸깍! / …드르륵!) that you hear again when you open that kind
//   7. a wrong pick says close or far, never points at the real one; two wrong picks and the friend moves (eyes shut again)
//   8. ★ found · ★ at most one wrong pick · ★ no hint; finding the friend doesn't end the stage while things are still
//      hidden — the friend comes out and looks with you (user, 10/18)
// Help goes action → area → target (the trail, then the sound and the tell, then the hideout).
import * as THREE from 'three';
import { h } from './ui.js';
import { sph, hemi, put } from './gfx/kit.js';
import { EN } from './i18n-en-dict.js';
import { CHAR_DEFS } from './gfx/chars.js';
import { R1, r1Line, hidePool } from './script.js';
import { moveItem, chainToView } from './hunt.js';
import { ease } from './util.js';
import { hideCard, quickHide } from './hideshort.js';

const K = (ko, en) => { if (en) EN[ko] = en; return ko; };
export const SHH = K('쉿… 숨는 중', 'Shh… hiding');
export const HIDE_V2 = /[?&]hide=2(&|$)/.test(location.search);
const ALL = /[?&]v2=all(&|$)/.test(location.search);
export const v2Wanted = S => HIDE_V2 && S.incident && !S.custom && !S.preview && S.spec.tut !== 1 && !S.spec.showcase && !S.layout.rooms && (ALL || S.idx === 3 || S.idx === 4);

const T = {
  keyGot: K('열쇠 획득! 자물쇠 셋 중 어디일까?', 'Got the key! Which of the three locks?'),
  close: K('…근데 가까워!', '…but close!'), far: K('…여긴 멀어~', '…far from here~'),
  move: K('눈 감아! 자리 옮긴다~', 'Eyes shut! Switching spots~'), moved: K('…발소리가 바뀌었어.', '…The footsteps changed.'),
  peekMong: K('…저기 있다.', '…There.'), peekFriend: K('흡…!', 'Mmph…!'),
  h1: K('흔적을 따라가 봐!', 'Follow the trail!'), h2: K('소리 나는 쪽으로 돌려 봐. 뭔가 삐죽 나와 있어!', 'Turn toward the sound. Something is poking out!'), h3: K('여기 같아!', 'Here, I think!'),
  stamp: K('명탐정!', 'Master detective!'),
};
// 몽글이 on the trail: the friend's own trace
const TRAIL_LINE = { bear: K('…꿀 방울. 곰돌이는 숨으면서도 먹는구나.', '…Honey drops. Bearie snacks even while hiding.') };
// the hideout's own sound (eyes shut, and again whenever you open that kind) — a word you can read with the sound off
const SND = {
  chest: { s: 'thump', w: K('…탁!', '…Thunk!') }, trunk: { s: 'thump', w: '…탁!' }, toybox: { s: 'thump', w: '…탁!' },
  cooler: { s: 'latch', w: K('…딸깍!', '…Click!') }, minifridge: { s: 'latch', w: '…딸깍!' },
  picnic: { s: 'rustle', w: K('…바스락!', '…Rustle!') }, laundrybasket: { s: 'rustle', w: '…바스락!' }, bush: { s: 'rustle', w: '…바스락!' },
  tacklebox: { s: 'clink', w: K('…찰칵!', '…Clack!') }, lockers: { s: 'clink', w: '…찰칵!' }, safe: { s: 'clink', w: '…찰칵!' },
  recordcab: { s: 'slide', w: K('…스르륵!', '…Shhk!') },
  tvlow: { s: 'drawer', w: K('…드르륵!', '…Rrrk!') }, drawers: { s: 'drawer', w: '…드르륵!' }, dresser: { s: 'drawer', w: '…드르륵!' },
  wardrobe: { s: 'creak', w: K('…끼익!', '…Creak!') }, closet: { s: 'creak', w: '…끼익!' }, dishcab: { s: 'creak', w: '…끼익!' },
  fridge: { s: 'thunk', w: K('…덜컹!', '…Thud!') }, bigfridge: { s: 'thunk', w: '…덜컹!' },
};
const sndOf = part => SND[part.furn.type] || (part.kind === 'drawer' ? SND.tvlow : part.kind === 'door' ? SND.wardrobe : SND.chest);
// what the friend's tell sounds like from inside
const TELL_SND = { bear: 'snore', frog: 'blub', bunny: 'giggleBunny' };
// where a friend could curl up, best first (a lid, door or drawer before a lift: a padlock on a blanket looks odd)
const PREF = ['wardrobe', 'bigfridge', 'fridge', 'chest', 'trunk', 'closet', 'lockers', 'recordcab', 'dishcab', 'cooler', 'picnic', 'tacklebox', 'toybox', 'laundrybasket', 'minifridge', 'washer3', 'tvlow', 'drawers', 'dresser', 'shoerack', 'kotatsu', 'bush', 'campchair', 'tentsmall', 'tent'];
const CHAIN = new Set(['key', 'note', 'color', 'treat', 'tool', 'sock', 'book', 'gadget']);

let styled = false;
function style() {
  if (styled) return; styled = true;
  const s = document.createElement('style');
  s.textContent = `.v2sub{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(178px + var(--safeB, 0px));z-index:14;display:flex;gap:8px;align-items:center;max-width:calc(100% - 32px);padding:7px 14px;border-radius:16px;background:rgba(42,26,61,.82);color:#fff;font-size:17px;pointer-events:none;opacity:0;transition:opacity .25s;word-break:keep-all}
.v2sub.on{opacity:1}.v2sub .who{color:#ffe16b}.v2sub .dir{font-size:15px;color:#8fe3ff}
.r1-eyes .v2w{font-size:40px;color:#8fe3ff;-webkit-text-stroke-width:5px;min-height:1.2em}
.v2stamp{align-self:center;transform:rotate(-8deg);border:4px solid #ff5f86;color:#ff5f86;border-radius:12px;padding:2px 14px;font-size:24px;letter-spacing:.04em}`;
  document.head.append(s);
}

const name = k => CHAR_DEFS[k]?.name || '친구';
// the friend's voice with no place: a line at the bottom (dir: ◀ ▶ • when the sound has a direction)
function sub(S, kind, line, dir = '') {
  style();
  if (!S._v2sub) { S._v2sub = h('div', { class: 'v2sub' }); S.col.append(S._v2sub); }
  const el = S._v2sub; el.innerHTML = '';
  if (dir) el.append(h('span', { class: 'dir' }, dir));
  el.append(h('span', { class: 'who' }, name(kind)), h('span', {}, line));
  el.classList.add('on'); clearTimeout(S._v2subT); S._v2subT = setTimeout(() => el.classList.remove('on'), 2400);
}

// free floor at (x, z): inside the room and clear of every piece of furniture's real box (room.clearAt is per 1 m tile —
// it called the whole tile around a chest blocked, so the tell never found a side to peek from)
// (QA3-prints9 10/19, user: "장애물 밑에도 발자국 생긴다") the trail goes round the decor too (boxes, pots, cushions), not only furniture
function boxes(S) { return (S.room.rooms || [S.room]).flatMap(R => [...R.furns, ...(R.decors || []).filter(q => q.type !== 'rug' && !(q.y > 1) && !q.hidden)]).map(e => ({ f: e.f, b: new THREE.Box3().setFromObject(e.f.group) })).filter(o => o.b.max.y - o.b.min.y > .06); }
function freeAt(S, bx, x, z, pad = .03) {
  const R = S.room, cz = R.center?.z || 0;
  if (Math.abs(x) > R.w / 2 - .06 || Math.abs(z - cz) > R.d / 2 - .06) return false;
  for (const o of bx) if (x > o.b.min.x - pad && x < o.b.max.x + pad && z > o.b.min.z - pad && z < o.b.max.z + pad) return false;
  return true;
}

// ── setup (after the room, plan and locks): three candidates with the same lock
export function v2Setup(S) {
  const real = S.plan.incident.part, L0 = real.lock || { kind: 'pad' };
  const furns = (S.room.rooms || [S.room]).flatMap(R => R.furns);
  const pool = [];
  for (const e of furns) {
    if (e.f === real.furn) continue;
    const parts = (e.f.parts || []).filter(q => !q.lock && !q.isLever && !q.isGadget && !q.dig && !q.secret && !q.secretShelf && !q.isLight
      && ['lid', 'door', 'drawer', 'lift'].includes(q.kind) && (q.spots || []).some(x => x.kind === 'inside'));
    if (!parts.length) continue;
    // never lock away the way forward (a key or a note planned inside — the items aren't built yet, so ask the plan)
    if (S.plan.placements.some(pl => CHAIN.has(pl.role) && pl.spot.part && pl.spot.part.furn === e.f)) continue;
    const sz = new THREE.Box3().setFromObject(e.f.group).getSize(new THREE.Vector3());
    if (sz.y < .3 || sz.x * sz.z < .2) continue;
    const pr = PREF.indexOf(e.type); if (pr < 0) continue;
    const p = parts.find(q => q.kind !== 'lift') || parts[0];
    pool.push({ p, score: pr + (p.kind === 'lift' ? 20 : 0) });
  }
  pool.sort((a, b) => a.score - b.score);
  const others = pool.slice(0, 2).map(o => o.p);
  const cands = [real, ...others];
  for (const p of others) lockIt(p, L0.kind, L0.code);
  S.v2 = { real, cands, kind: L0.kind, code: L0.code, miss: 0, round: 0, moves: 0, hint: 0, marks: [], peek: null, more: false, trailEnd: null, peeked: false, tellT: 0 };
  return S.v2;
}
function lockIt(p, kind, code) {
  const f = p.furn;
  if (!f.lockAt || f._v2Anchor) f.lockAt = f._v2Anchor || (f._v2Anchor = anchorFor(f));   // furniture with no lock place of its own gets one on its front
  if (p.lockMesh) { p.lockMesh.parent?.remove(p.lockMesh); p.lockMesh = null; }
  f.setLock(p, kind, code); p._hadLock = true;
}
function anchorFor(f) {
  const g = f.group; g.updateMatrixWorld(true);
  const wb = new THREE.Box3().setFromObject(g), inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), lb = new THREE.Box3();
  for (const x of [wb.min.x, wb.max.x]) for (const y of [wb.min.y, wb.max.y]) for (const z of [wb.min.z, wb.max.z]) lb.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(inv));
  return { x: (lb.min.x + lb.max.x) / 2, y: lb.min.y + (lb.max.y - lb.min.y) * .62, z: lb.max.z + .015 };
}

// ── after the camera is set: the friend starts away from every candidate (so the trail says something), and the key
// sits where the starting view can see it (5판's was under the fishing table)
export function v2Prep(S) {
  const W = S.G.world, V = S.v2, R = S.room, bx = boxes(S);
  const cs = V.cands.map(p => S.partCenter(p));
  let best = null;
  const hw = R.w / 2 - .5, hd = R.d / 2 - .5, cz = R.center?.z || 0;
  for (let x = -hw; x <= hw; x += .25) for (let z = cz - hd; z <= cz + hd; z += .25) {
    if (!freeAt(S, bx, x, z, .32)) continue;
    const sp = W.toScreen(new THREE.Vector3(x, 0, z)); if (!(sp.x > 50 && sp.x < W.W - 50 && sp.y > 170 && sp.y < W.H - 230)) continue;
    const d = Math.min(...cs.map(c => Math.hypot(c.x - x, c.z - z))), o = S.friend.root.position, keep = Math.hypot(o.x - x, o.z - z);
    const sc = Math.min(d, 2.6) - keep * .08;
    if (!best || sc > best.sc) best = { x, z, sc };
  }
  if (best) { const f = S.friend.root; f.position.set(best.x, f.position.y, best.z); f.rotation.y = Math.atan2(W.cam.position.x - best.x, W.cam.position.z - best.z); }
  V.keyMoved = chainToView(S);
}

// ── eyes shut while the friend hides
export async function v2Hide(S) {
  const G = S.G, f = S.friend, tw = S.tw, V = S.v2, kind = S.th.friend;
  S.friendHome = f.root.position.clone();
  S.r1 = { real: V.real, cands: V.cands, miss: 0, told: new Set(), objs: [] };   // (the 15 s rule in update() keys on this)
  await tw.wait(.5);
  style();
  const sd = sndOf(V.real);
  if (hideCard(S)) {
  const w = h('span', { class: 'v2w ol' }, '');
  const ov = h('div', { class: 'r1-eyes' }, h('b', { class: 'ol' }, R1.close), S.r1N = h('span', { class: 'ol' }, ''), w);
  document.getElementById('overlay').append(ov);
  f.root.visible = false;
  // 하나·둘·셋 only the first time; after that a one-second "쉿…" (user, 10/18: "하나둘셋도 계속 나오니까 좀 짜증나는거같아")
  if (!G.save.r1Counted) { for (const n of R1.nums) { if (S.dead) return; S.r1N.textContent = n; G.audio.sfx('tock'); await tw.wait(.6); } G.save.r1Counted = true; G.persist?.(); }   // (the same once-only flag as stage.js r1Hide)
  else { ov.querySelector('b').textContent = SHH; }
  for (let i = 0; i < 4; i++) { G.audio.sfx('tap', 10 + i); await tw.wait(.11); }
  w.textContent = sd.w; G.audio.sfx(sd.s); await tw.wait(.7);
  ov.classList.add('out'); setTimeout(() => ov.remove(), 300);
  } else {
    // (after the first two 사건 판 — hideshort.js: no screen-wide card, a hop and a puff, then the hiding sound)
    await quickHide(S, f); if (S.dead) return;
    for (let i = 0; i < 2; i++) { G.audio.sfx('tap', 10 + i); await tw.wait(.1); }
    G.audio.sfx(sd.s); await tw.wait(.3);
  }
  S.friendHidden = true;
  trail(S, S.friendHome, V.real);
  peek(S);
  setTimeout(() => !S.dead && S.friendHidden && sub(S, kind, r1Line(kind, 'hidden')), 500);
  if (S.hero?.ch) setTimeout(() => !S.dead && S.friendHidden && S.say(S.hero.ch, TRAIL_LINE[kind] || r1Line(kind, 'trail'), 1700), 2300);
}

// ── the trail: from where the friend stood to the front of the hideout, around furniture where it can
function floorY(S, x, z) {
  const rc = new THREE.Raycaster(new THREE.Vector3(x, 4, z), new THREE.Vector3(0, -1, 0), 0, 8);
  const hit = rc.intersectObject(S.room.group, true).find(hh => hh.point.y < 1.2 && hh.object.visible);
  return hit ? hit.point.y : 0;
}
function pathPoints(S, a, b) {
  const bx = boxes(S), clear = (x, z) => freeAt(S, bx, x, z, .05);
  const seg = (p, q) => { const out = [], n = Math.max(1, Math.round(p.distanceTo(q) / .36)); for (let i = 1; i <= n; i++) out.push(p.clone().lerp(q, i / n)); return out; };
  const tryVia = via => { const pts = via ? [...seg(a, via), ...seg(via, b)] : seg(a, b); return { pts, bad: pts.filter(p => !clear(p.x, p.z)).length }; };
  let best = tryVia(null);
  if (best.bad) {
    const m = a.clone().lerp(b, .5), d = b.clone().sub(a), nrm = new THREE.Vector3(-d.z, 0, d.x).normalize();
    for (const k of [.6, -.6, 1.1, -1.1, 1.6, -1.6]) { const t = tryVia(m.clone().addScaledVector(nrm, k)); if (t.bad < best.bad) best = t; if (!t.bad) break; }
  }
  return best.pts.filter(p => clear(p.x, p.z));
}
function frontOf(S, part, from) {
  const b = new THREE.Box3().setFromObject(part.furn.group), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3());
  const dir = new THREE.Vector3(from.x - c.x, 0, from.z - c.z); if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1); dir.normalize();
  const r = Math.abs(dir.x) * sz.x / 2 + Math.abs(dir.z) * sz.z / 2 + .2;
  return new THREE.Vector3(c.x + dir.x * r, 0, c.z + dir.z * r);
}
function makeMark(kind, i) {
  const g = new THREE.Group();
  if (kind === 'bear') {   // honey drops
    const d = put(sph(.05, '#ffb319', { rough: .2 }), 0, .01, 0); d.scale.set(1, .26, 1.2); g.add(d);
    g.add(put(sph(.016, '#fff1b8'), -.016, .02, -.018));
    g.scale.setScalar(1.15 + (i % 3) * .18);
  } else {   // a footprint: wet and blue for 개굴이, the friend's colour for anyone else
    const c = kind === 'frog' ? '#3d8fd0' : (CHAR_DEFS[kind]?.earC || CHAR_DEFS[kind]?.body || '#8a6a5a');
    const palm = put(sph(.03, c), 0, .005, -.012); palm.scale.set(1, .18, 1.25); g.add(palm);
    for (const [x, z] of [[-.028, .03], [0, .042], [.028, .03]]) { const t = put(sph(.012, c), x, .005, z); t.scale.set(1, .25, 1.1); g.add(t); }
    g.scale.setScalar(1.75);   // (a phone at the whole view: smaller read as specks of dirt)
  }
  g.traverse(o => { if (o.isMesh) { o.raycast = () => {}; o.castShadow = false; o.receiveShadow = false; } });
  g.userData.v2mark = true;
  return g;
}
function trail(S, from, part) {
  const V = S.v2, kind = S.th.friend;
  for (const m of V.marks) m.parent?.remove(m);
  V.marks = [];
  const a = new THREE.Vector3(from.x, 0, from.z), b = frontOf(S, part, from);
  const pts = pathPoints(S, a, b).filter(p => p.distanceTo(a) > .3);
  pts.forEach((p, i) => {
    const nx = pts[i + 1] || b, dir = Math.atan2(nx.x - p.x, nx.z - p.z) || Math.atan2(b.x - a.x, b.z - a.z);
    const side = kind === 'bear' ? (Math.random() - .5) * .12 : (i % 2 ? .055 : -.055);
    const m = makeMark(kind, i);
    m.position.set(p.x + Math.cos(dir) * side, floorY(S, p.x, p.z) + .004, p.z - Math.sin(dir) * side);
    m.rotation.y = dir + (kind === 'bear' ? Math.random() * 6 : 0);
    S.room.group.attach(m); V.marks.push(m);
  });
  V.trailEnd = (pts[pts.length - 1] || b).clone();
  S.G.world.idsDirty = true; S.G.world.shadowDirty = true;
}

// ── the tell that peeks out: low on a side the starting view can't see, seen from one or two of the four diagonal views
function makePeek(kind) {
  const g = new THREE.Group();
  if (kind === 'frog') {   // a webbed foot
    const c = CHAR_DEFS.frog.body;
    const p = put(sph(.045, c), 0, 0, .02); p.scale.set(1, .5, 1.3); g.add(p);
    for (const x of [-.04, 0, .04]) { const t = put(sph(.022, c), x, 0, .075); t.scale.set(1, .6, 1); g.add(t); }
  } else {   // a round tail (곰돌이 and anyone else)
    const c = CHAR_DEFS[kind]?.earC || CHAR_DEFS[kind]?.body || '#c98a52';
    g.add(put(sph(.07, c), 0, 0, .04));
    g.add(put(hemi(.035, '#ffffff'), 0, .03, .07, -.6, 0, 0));
  }
  g.traverse(o => { if (o.isMesh) { o.userData.peek = true; o.castShadow = false; } });
  g.userData.peek = true;
  return g;
}
function peek(S) {
  const W = S.G.world, V = S.v2, kind = S.th.friend, part = V.real;
  if (V.peek) { V.peek.parent?.remove(V.peek); V.peek = null; }
  const b = new THREE.Box3().setFromObject(part.furn.group), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3());
  const camDir = new THREE.Vector3(W.cam.position.x - c.x, 0, W.cam.position.z - c.z).normalize();
  const faces = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const y0 = W.yaw, p0 = W.pitch, yaws = [0, 1, 2, 3].map(k => y0 + k * Math.PI / 2);
  let best = null; const bxs = boxes(S);
  const others = bxs.filter(o => o.f !== part.furn);
  for (const n of faces) {
    const half = Math.abs(n.x) * sz.x / 2 + Math.abs(n.z) * sz.z / 2, tan = new THREE.Vector3(-n.z, 0, n.x), tHalf = Math.abs(tan.x) * sz.x / 2 + Math.abs(tan.z) * sz.z / 2;
    for (const tk of [0, -.55, .55]) {
      const out = c.clone().addScaledVector(n, half + .05).addScaledVector(tan, tHalf * tk);
      // room in front of it to be seen from (a tail squeezed between a chest and the wall was hidden from every side)
      if (!freeAt(S, others, out.x, out.z, .02) || !freeAt(S, others, out.x + n.x * .3, out.z + n.z * .3, .02)) continue;
      for (const fy of [.25, .55, .8]) {
        const g = makePeek(kind), pos = new THREE.Vector3(out.x, b.min.y + sz.y * fy, out.z);
        g.position.copy(pos); g.rotation.y = Math.atan2(n.x, n.z); S.room.group.attach(g);
        let seen = 0;
        for (const y of yaws) { W.yaw = y; W.pitch = p0; W.updateCam(); S.room.update(1); if (!W.occluded(g, pos, [S.room.group])) seen++; }
        W.yaw = y0; W.pitch = p0; W.updateCam(); S.room.update(1);
        const hiddenAtStart = W.occluded(g, pos, [S.room.group]);
        g.parent.remove(g);
        if (!seen) continue;   // must be findable from somewhere
        const score = (seen <= 2 ? 10 : 3) + (hiddenAtStart ? 6 : 0) + (seen === 2 ? 1 : 0) + (n.dot(camDir) < .3 ? 1 : 0);
        if (!best || score > best.score) best = { n, pos, fy, seen, hiddenAtStart, score };
      }
    }
  }
  if (!best) return;
  const g = makePeek(kind); g.position.copy(best.pos); g.rotation.y = Math.atan2(best.n.x, best.n.z);
  S.room.group.attach(g); V.peek = g; V.peekViews = best.seen; V.peekHiddenAtStart = best.hiddenAtStart; V.peekT = 2;
  W.idsDirty = true; W.shadowDirty = true;
}
export function v2PeekTap(S) {
  const V = S.v2, g = V.peek, kind = S.th.friend; if (!g || !S.friendHidden || g.userData.ducking) return;
  g.userData.ducking = true; V.peeked = true; S.idle = 0;
  S.G.audio.sfxAt?.('giggle', 0, .8);
  const s0 = g.scale.x;
  S.tw.run(.25, k => g.scale.setScalar(s0 * (1 - k)), ease.inBack).then(() => { g.visible = false; setTimeout(() => { if (S.dead || !V.peek || V.peek !== g) return; g.visible = true; g.scale.setScalar(s0); g.userData.ducking = false; }, 7000); });
  sub(S, kind, hidePool(S.idx, kind, 'clue')?.[0] || T.peekFriend);
  if (S.hero?.ch) setTimeout(() => !S.dead && S.say(S.hero.ch, T.peekMong, 1400), 700);
}

// ── the friend's tell from inside: periodic ones (stuck for a while) have a direction; ones that answer what you did
// (a clue found, a bonus found) are only a voice
export function v2Tell(S, line = null) {
  const G = S.G, W = G.world, V = S.v2, kind = S.th.friend;
  const dirOn = line == null;
  if (dirOn) { if (S.t - V.tellT < 8) return; V.tellT = S.t; }
  const txt = line || hidePool(S.idx, kind, 'stuck')?.[(V._tn = (V._tn || 0) + 1) % (hidePool(S.idx, kind, 'stuck')?.length || 1)] || r1Line(kind, 'real');
  if (dirOn) {
    const sp = W.toScreen(S.partCenter(V.real)), pan = Math.max(-1, Math.min(1, (sp.x - W.W / 2) / (W.W / 2)));
    const on = sp.x > 0 && sp.x < W.W && sp.y > 0 && sp.y < W.H;
    (G.audio.sfxAt || G.audio.sfx)(TELL_SND[kind] || 'giggle', pan, on ? 1 : .55);
    sub(S, kind, txt, pan < -.25 ? '◀' : pan > .25 ? '▶' : '•');
  } else { (G.audio.sfxAt || G.audio.sfx)(TELL_SND[kind] || 'giggle', 0, .5); sub(S, kind, txt); }
}

// ── the key: every candidate lock hops (no camera flying to the real one)
export async function v2PointAll(S) {
  const W = S.G.world, tw = S.tw;
  for (const p of S.v2.cands) {
    const lm = p.lockMesh; if (!lm) continue;
    const s0 = lm.scale.clone(), y0 = lm.position.y;
    await tw.run(.32, k => { const b = Math.sin(k * Math.PI); lm.position.y = y0 + b * .07; lm.scale.copy(s0).multiplyScalar(1 + b * .45); }, ease.linear);
    lm.position.y = y0; lm.scale.copy(s0);
    const s = W.toScreen(lm.getWorldPosition(new THREE.Vector3())); W.fx.burst(s.x, s.y, { n: 8, colors: ['#ffe14d', '#ffffff'] });
    if (S.dead) return;
  }
}
export const v2KeyToast = () => T.keyGot;

// opening a candidate: its own sound and word (so 탁 = 상자 is learned)
export function v2OpenSound(S, part) {
  const sd = sndOf(part), W = S.G.world, s = W.toScreen(S.partCenter(part));
  S.G.audio.sfx(sd.s); S.G.ui.floatText(s.x, s.y - 70, sd.w, '');
}

// ── a wrong pick
export function v2Wrong(S, part) {
  const V = S.v2, kind = S.th.friend, W = S.G.world;
  S.r1.told.add(part); V.miss++; V.round++;
  const pc = S.partCenter(part), near = pc.distanceTo(S.partCenter(V.real)) < 1.8;
  S.say({ root: { position: pc }, headTop: () => .25 }, r1Line(kind, 'wrong', V.miss - 1), 1300); S.G.audio.sfx('miss');
  setTimeout(() => { if (S.dead || !S.friendHidden) return; const s = W.toScreen(pc); S.G.ui.floatText(s.x, s.y - 110, near ? T.close : T.far, near ? 'gold' : ''); }, 900);
  if (V.round >= 2) setTimeout(() => !S.dead && S.friendHidden && !S.result && v2Relocate(S), 2000);
}

// ── two wrong picks: eyes shut, the friend tiptoes to another candidate, the trail starts over
export async function v2Relocate(S) {
  const G = S.G, V = S.v2, tw = S.tw, kind = S.th.friend;
  V.round = 0; V.moves++; S.cine = true;
  style();
  const ov = h('div', { class: 'r1-eyes' }, h('b', { class: 'ol' }, T.move), h('span', { class: 'v2w ol' }, ''));
  document.getElementById('overlay').append(ov);
  for (let i = 0; i < 5; i++) { G.audio.sfx('tap', 8 + i); await tw.wait(.14); }
  const old = V.real, next = V.cands.filter(p => p !== old)[Math.floor(Math.random() * (V.cands.length - 1))];
  // the opened ones shut and lock again
  for (const p of V.cands) { if (p.t > .5) { p.setOpen(0); p.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; }); } if (!p.lock) lockIt(p, V.kind, V.code); }
  S.r1.told.clear();
  // the friend (its marker) moves; whatever sat in that spot takes the old place
  const it = S.friendItem, ns = next.spots.find(x => x.kind === 'inside') || next.spots[0], os = it.spot, other = ns.item && ns.item !== it ? ns.item : null;
  if (other) moveItem(other, os);
  moveItem(it, ns);
  S.plan.incident.part = next; V.real = next; S.r1.real = next;
  ov.querySelector('.v2w').textContent = sndOf(next).w; G.audio.sfx(sndOf(next).s);
  await tw.wait(.8);
  trail(S, S.partCenter(old), next); peek(S);
  G.world.idsDirty = true; G.world.shadowDirty = true;
  ov.classList.add('out'); setTimeout(() => ov.remove(), 300);
  S.cine = false;
  if (S.hero?.ch) setTimeout(() => !S.dead && S.say(S.hero.ch, T.moved, 1500), 400);
}

// ── help, in steps: what to do (the trail) → where (turn toward the sound and the tell) → which one
export async function v2Hint(S) {
  const V = S.v2, W = S.G.world, G = S.G;
  if (!(V && S.friendHidden && S.keys > 0)) return false;   // before the key: the usual chain hints
  V.hint++;
  if (V.hint === 1) {
    G.ui.toast(T.h1, 'green');
    for (let r = 0; r < 3; r++) {
      for (const m of V.marks) { const s0 = m.scale.x; S.tw.run(.35, k => m.scale.setScalar(s0 * (1 + Math.sin(k * Math.PI) * .9)), ease.linear).then(() => m.scale.setScalar(s0)); const s = W.toScreen(m.position.clone().applyMatrix4(S.room.group.matrixWorld)); W.fx.burst(s.x, s.y, { n: 4, shape: 'star', speed: 50, gravity: 0, life: .5, size: 7 }); }
      await S.tw.wait(.45);
    }
  } else if (V.hint === 2 && V.peek) {
    G.ui.toast(T.h2, 'green');
    // turn to a diagonal view where the tell can be seen
    const pos = V.peek.getWorldPosition(new THREE.Vector3()), y0 = W.yaw, p0 = W.pitch;
    let yaw = null;
    for (let k = 1; k <= 3 && yaw == null; k++) for (const sg of [1, -1]) { const y = y0 + sg * k * Math.PI / 2; W.yaw = y; W.updateCam(); S.room.update(1); if (!W.occluded(V.peek, pos, [S.room.group])) { yaw = y; break; } }
    W.yaw = y0; W.pitch = p0; W.updateCam(); S.room.update(1);
    if (yaw != null) await W.flyTo(S.tw, { yaw, dur: .7 });
    V.tellT = -99; v2Tell(S);
  } else {
    const pc = S.partCenter(V.real);
    for (let i = 0; i < 3; i++) { const s = W.toScreen(pc); W.fx.ring(s.x, s.y, { r: 70, color: '#8ad6ff', width: 8, life: .6 }); if (!i) G.ui.floatText(s.x, s.y - 60, T.h3, 'gold'); await S.tw.wait(.45); }
  }
  return true;
}

// ── found: the stage doesn't end with things still hidden (user, 10/18: "물건을 다 찾지도 않았는데 친구를 찾았다고 스테이지
// 넘어가는게 어색한거같아"). The friend comes out and looks with you; when you're stuck they point the way.
export function v2AfterFound(S) {
  const V = S.v2, left = S.targets.filter(t => !t.found).length;
  V.hintsAtFound = S.hintsUsed || 0;
  if (!left) return S.win();
  V.after = true; V.helpT = 10; S.idle = 0;
  if (S.keyPill) S.keyPill.style.display = 'none';   // (the key that comes back has nothing left to open)
  S.friend.pose = 'idle';
  S.say(S.friend, K(`이제 같이 찾자! 남은 거 ${left}개`, `Let's look together! ${left} left`), 1900);
}
// ★ found them · ★ at most one wrong pick · ★ no hint before they were found (help for the leftovers is free)
export const v2Stars = S => 1 + (S.v2.miss <= 1 ? 1 : 0) + ((S.v2.hintsAtFound ?? S.hintsUsed ?? 0) === 0 ? 1 : 0);
export const v2StarWhy = S => [[K('★ 친구 찾기', '★ Found them'), true], [K(`★ 헛짚기 ${S.v2.miss}번`, `★ Wrong picks: ${S.v2.miss}`), S.v2.miss <= 1], [K('★ 힌트 없이', '★ No hints'), (S.v2.hintsAtFound ?? S.hintsUsed ?? 0) === 0]];
export const v2Title = S => S.v2.miss === 0 ? T.stamp : v2Stars(S) === 3 ? K('최고야!', 'Brilliant!') : K('찾았다!', 'Found you!');
export const v2Stamp = S => S.v2.miss === 0 ? h('div', { class: 'v2stamp ol' }, T.stamp) : null;

// the friend helps with what's left: after a while with nothing found, they turn to one and say so (a sparkle if it shows)
const HELP = [K('저쪽에 뭔가 있는 것 같아!', 'I think something is over there!'), K('아까 거기서 반짝했어!', 'Something sparkled over there!'), K('그 뒤쪽은 봤어?', 'Did you check behind that?')];
function friendHelps(S) {
  const W = S.G.world, f = S.friend, left = S.targets.filter(t => !t.found); if (!left.length) return;
  const c = f.root.position, it = left.map(t => ({ t, p: S.worldCenter(t) })).sort((a, b) => a.p.distanceTo(c) - b.p.distanceTo(c))[0];
  f.faceTo?.(it.p.x, it.p.z); f.bump?.(.3);
  const hidden = W.occluded(it.t.g, it.p, [S.room.group]) || (it.t.spot.part && it.t.spot.part.t < .5);
  S.say(f, HELP[hidden ? 2 : (S.v2._hn = ((S.v2._hn || 0) + 1) % 2)], 1700);
  if (!hidden) { const s = W.toScreen(it.p); W.fx.burst(s.x, s.y, { n: 7, shape: 'star', speed: 70, gravity: -30, life: .9, size: 9, colors: ['#ffffff', '#fff3a0'] }); }
}

// ── per frame: the tell wiggles now and then (more often when you're stuck); after the find, the friend helps
export function v2Update(S, dt) {
  const V = S.v2;
  if (V?.after && S.running && !S.result) { if (S.idle > 9 && (V.helpT -= dt) <= 0) { V.helpT = 8; friendHelps(S); } return; }
  const g = V?.peek; if (!g || !S.friendHidden || !S.running || g.userData.ducking) return;
  V.peekT -= dt; if (V.peekT > 0) return;
  V.peekT = (S.idle > 12 ? 2 : 3.5) + Math.random() * 1.5;
  const r0 = g.rotation.z;
  S.tw.run(.45, k => { g.rotation.z = r0 + Math.sin(k * Math.PI * 4) * (1 - k) * .45; }, ease.linear).then(() => { g.rotation.z = r0; });
  S.G.world.dirty?.invalidate?.();
}

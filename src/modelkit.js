// 프라모델 조립판 (정식판 10/19; 시제품 10/18) — a hidden-object stage whose things to find are the pieces of a plastic
// model kit. The hunt is the hunt as always (same controls, same rules); what is new sits either side of it:
//   · the box (kitIntro): the lid pops off, the runner rises out of it, its pieces snap off and scatter into the room —
//     ~2.5 s the first time, ~1 s after that, gone at a tap; no talk card
//   · the runner card (kitRunner, in place of the list): a horizontal plastic runner, one numbered cell per piece, the
//     piece's shape empty until you find it, then it clicks back in
//   · the build (kitBuild, after the last find): the model stands as a see-through ghost; tap the pieces on the runner in
//     its numbered order and each flies to its place — 딸깍 (user 10/19: "추천하는 방식으로" = 톡 하면 딸깍, 순서 맞추기).
//     Out of turn it hops back; nothing is lost. Then the model comes alive, and goes home with you (the first time, as
//     a piece of furniture).
// user 10/19: "처음에 프라모델 박스 열리는 연출넣고 … 조립전 모습을 저렇게 보여주는게 좋겠어 그리고 조립할때는 따로 퍼즐처럼"
// Played from 놀이 모음 (gallery.js, ?play=model&lv=1: S.model, outside the campaign) and on a campaign stage whose spec
// names a kit (stages.js STAGES: kit) — S.kit is set in both.
import * as THREE from 'three';
import { KITS, kitItem, buildKitPart, buildKitModel, buildKitGlow, buildMoveBox, buildParfait } from './gfx/modelkit-props.js';
import { ITEMS } from './gfx/items.js';
import { bakeItem } from './gfx/bake.js';
import { blobShadow } from './gfx/kit.js';
import { renderThumbs } from './thumbs.js';
import { planStage } from './stages.js';
import { blindFor } from './hunt-blind.js';
import { haptic } from './feel.js';
import { rng, ease } from './util.js';
import { h, ICON } from './ui.js';

// one entry per playable kit stage in 놀이 모음 (listed there as levels)
export const MODEL_STAGES = {
  robot: { kit: 'robot', room: 'study', friend: 'nerd', title: '박사님의 프라모델', goal: '로봇 부품 6개를 모아 조립하자!',
    hello: '흠. 로봇 부품이 다 흩어졌어.', go: '다 모았다! 조립 시작!', wrong: '흠, 거기가 아니군.', cheer: '흠! 완벽한 조립이군!' },
};
// the line said when the last piece is found, before the build (campaign: 스토리 룸's script.js KIT_TALK when it has one)
export const KIT_GO = { robot: '다 모았다! 이번엔 끝까지 맞추자.' };
const RS = 1.15;   // the finished model's size in the room

// ── the plan: the kit's pieces are the things to find, placed by the hidden-object rules (planStage with them forced in:
// the first in plain sight, at most two inside a drawer or door, never a place nobody can see into), plus one piece per
// piece of furniture — the pieces are spread round the room
export function modelSpec(kind) {
  const M = MODEL_STAGES[kind], K = KITS[M.kit];
  return { idx: -1, seed: 1 + Math.floor(Math.random() * 1e6), room: M.room, region: 'home', n: K.order.length, force: kitForce(M.kit),
    lock: [], inside: 2, behind: 0, time: 120, clutter: .4, ho: true, model: kind, avoid: blindFor(M.room) };
}
// the pieces as the things to find; the one a padlock should guard first (planStage: the first lock guards the first
// target — 8판: the head, out of the locked wardrobe; 5·7판 already lock the toy chest, so 6판 the dish cabinet and 8판 the
// wardrobe — 검토 세션 10/19 "자물쇠는 장난감 상자로 외우게 돼요")
export const kitForce = kit => { const K = KITS[kit], o = K.order.slice(); if (K.locked) o.unshift(...o.splice(o.indexOf(K.locked), 1)); return o.map(k => kitItem(kit, k)); };
const fits = (type, s) => ITEMS[type].h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || ITEMS[type].flat);
export function planModel(room, spec, story = null) {
  const plan = planStage(room, spec, story), r = rng(spec.seed + 11);
  const furnOf = s => s.furn || s.part?.furn;
  const taken = new Map(plan.placements.map(p => [p.spot, p]));
  const usedF = new Set();
  const forced = new Set(spec.force || []), isPiece = p => p.role === 'target' && forced.has(p.type);
  const chained = new Set(plan.placements.filter(p => p.role === 'target' && plan.locks.some(l => l.part === p.spot.part)).map(p => p.spot));
  for (const p of plan.placements.filter(isPiece)) {
    if (chained.has(p.spot)) { usedF.add(furnOf(p.spot)); continue; }   // (the piece behind the padlock stays in its box)
    if (!usedF.has(furnOf(p.spot))) { usedF.add(furnOf(p.spot)); continue; }
    // a second piece on the same furniture: out on some other piece of furniture instead (an empty place first, else one
    // with clutter on it — the clutter goes)
    const ok = s => s.kind === 'on' && !s.part && !s.reserved && !s.wallFace && !spec.avoid?.(s) && !usedF.has(furnOf(s)) && fits(p.type, s) && taken.get(s)?.role !== 'target';
    const c = r.shuffle(room.spots.filter(ok)).sort((a, b) => (taken.has(a) ? 1 : 0) - (taken.has(b) ? 1 : 0))[0];
    if (!c) { usedF.add(furnOf(p.spot)); continue; }
    const d = taken.get(c); if (d) plan.placements.splice(plan.placements.indexOf(d), 1);
    taken.delete(p.spot); p.spot = c; taken.set(c, p); usedF.add(furnOf(c));
  }
  return plan;
}

// ── pictures: a model kit's pieces each on its own (the runner's cells, the pieces flying off it) and the finished model
// (the box lid, until GPT's box art comes in), drawn once while the stage is set up; any other kit's things are ITEMS
// with their own icons
function ensurePics(G, kit) {
  const K = KITS[kit];
  if (K.type !== 'model') return p => p === 'box' ? null : 'item_' + p;
  const key = p => `kitpc_${kit}_${p}`;
  if (G.thumbStore[key('box')]) return key;
  const jobs = [{ key: key('box'), build: () => buildKitModel(kit), dir: [.35, .2, 1] },
    ...K.order.map(p => ({ key: key(p), build: () => buildKitPart(kit, p), dir: [.32, .3, 1] }))];
  Object.assign(G.thumbStore, renderThumbs(jobs, 160));
  return key;
}

// ── the card (in place of the list): one cell per thing, its shape empty until it's found (stage.js onFound flies the
// picture into it and marks it .found → it clicks in). Skins: a plastic runner with numbered cells (a model kit), a row
// of moving boxes that fold as they're emptied (이삿짐), little dishes of toppings (파르페).
export function kitRunner(S) {
  const G = S.G, kit = S.kit.kit, K = KITS[kit], key = ensurePics(G, kit);
  const cells = {};
  const row = h('div', { class: 'kitrun-row', style: `--n:${K.order.length}` });
  K.order.forEach((p, i) => {
    const src = G.thumbs[key(p)];
    const c = h('div', { class: 'kitrun-cell' },
      h('i', { class: 'kitrun-gate l' }), h('i', { class: 'kitrun-gate r' }), h('i', { class: 'kitrun-box' }),
      h('img', { class: 'kitrun-ghost', src, alt: '' }), h('img', { class: 'kitrun-pc', src, alt: '' }),
      h('span', { class: 'kitrun-no' }, String(i + 1)), h('span', { class: 'kitrun-nm' }, K.short?.[p] || ''));
    c.dataset.p = p; row.append(c); cells[p] = c;
  });
  const byType = Object.fromEntries(K.order.map(p => [kitItem(kit, p), p]));
  const tag = h('div', { class: 'kitrun-tag ol', style: `background:${K.color}` }, K.name);
  for (const it of S.targets) if (byType[it.type]) { it.kitPart = byType[it.type]; it.slot = cells[it.kitPart]; } else it.slot = tag;   // (anything else flies to the tag)
  S.kitCells = cells; S.kitPic = key;
  if (K.boxArt) { const im = new Image(); im.decoding = 'async'; im.src = K.boxArt; S.kitArt = im; }   // (the box's lid picture, ready before the box drops)
  return h('div', { class: `kitrun skin-${K.skin || 'runner'}${K.numbers === false ? ' nonum' : ''}`, style: `--run:${K.runner}` }, tag, row);
}

// ── the stage set up for the kit (stage.js, once the room and the things are in): 이삿짐's boxes about the room, the
// big parfait beside its owner
export function kitSetup(S) {
  const K = KITS[S.kit.kit], W = S.G.world, rnd = rng((S.spec.seed || 1) + 23);
  const tiles = (S.freeTiles || []).filter(t => !t.R?.clearAt || t.R.clearAt(t.x, t.z, .3));
  const at = (t, o) => { const P = new THREE.Vector3(t.x, t.y || 0, t.z); o.position.copy(S.room.group.worldToLocal(P)); S.room.group.add(o); };
  if (K.type === 'place') {
    // a box for every thing, on free floor (the ones nearest the walls first: the middle stays clear to walk)
    const far = tiles.slice().sort((a, b) => Math.hypot(b.x - (S.room.center?.x || 0), b.z - (S.room.center?.z || 0)) - Math.hypot(a.x - (S.room.center?.x || 0), a.z - (S.room.center?.z || 0)));
    S.kitBoxes = [];
    for (let i = 0; i < K.order.length && far.length; i++) {
      const t = far.splice(Math.floor(rnd() * Math.min(4, far.length)), 1)[0];
      const b = buildMoveBox(i); b.scale.setScalar(1.3); b.rotation.y = (rnd() - .5) * .9; at(t, b);
      const tw = Math.random() < .5 && i > 0 && S.kitBoxes.length ? S.kitBoxes[S.kitBoxes.length - 1] : null;   // (some stacked two high)
      if (tw && rnd() < .4) { b.position.copy(tw.position); b.position.y += (.26 + (i % 2) * .05) * 1.3; b.rotation.y += .4; }
      S.kitBoxes.push(b);
    }
    W.idsDirty = true; W.shadowDirty = true;
  } else if (K.type === 'stack') {
    // the big parfait: on a clear tile near its owner, facing the view
    const f = S.friend.root.position, t = tiles.slice().sort((a, b) => Math.hypot(a.x - f.x, a.z - f.z) - Math.hypot(b.x - f.x, b.z - f.z)).find(q => Math.hypot(q.x - f.x, q.z - f.z) > .5) || tiles[0];
    if (t) {
      const p = buildParfait(); p.g.scale.setScalar(1.45); at(t, p.g);
      p.g.rotation.y = Math.atan2(W.cam.position.x - t.x, W.cam.position.z - t.z);
      S.kitParfait = p; W.idsDirty = true; W.shadowDirty = true;
    }
  }
}

// ── a thing found (stage.js, once its picture has landed in its cell): a model kit's click; 이삿짐: the box nearest the
// find folds flat and goes; 파르페: that topping onto the big parfait, its layer popping in (the cherry waits for last)
export function kitFound(S, it) {
  const G = S.G, W = G.world, K = KITS[S.kit.kit];
  G.audio.sfx('latch');
  if (K.type === 'place' && S.kitBoxes?.length) {
    const c = it?.g ? it.g.getWorldPosition(new THREE.Vector3()) : null;
    const wp = b => b.getWorldPosition(new THREE.Vector3());
    const b = c ? S.kitBoxes.slice().sort((u, v) => wp(u).distanceTo(c) - wp(v).distanceTo(c))[0] : S.kitBoxes[0];
    S.kitBoxes.splice(S.kitBoxes.indexOf(b), 1);
    foldBox(S, b);
  }
  if (K.type === 'stack' && S.kitParfait && it?.kitPart && it.kitPart !== K.last) popLayer(S, it.kitPart);
}
function foldBox(S, b) {
  const G = S.G, W = G.world, s0 = b.scale.clone(), y0 = b.position.y;
  const p = W.toScreen(b.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .15, 0)));
  G.audio.sfx('rustle'); W.fx.burst(p.x, p.y, { n: 8, shape: 'circle', colors: ['#f3dfb4', '#e2b77c', '#ffffff'], speed: 140, up: 50, size: 7, life: .4 });
  S.tw.run(.42, k => {   // squashes flat (the flaps fold in), then slips away
    const f = k < .6 ? ease.outBack(k / .6) : 1, out = k < .6 ? 1 : 1 - (k - .6) / .4;
    b.scale.set(s0.x * (1 + .15 * f) * out, s0.y * Math.max(.06, 1 - .94 * f) * out, s0.z * (1 + .15 * f) * out);
    b.position.y = y0;
  }, ease.linear).then(() => { b.parent?.remove(b); W.idsDirty = true; W.shadowDirty = true; });
}
function popLayer(S, key) {
  const G = S.G, W = G.world, l = S.kitParfait.layers[key];
  if (!l || l.visible) return;
  l.visible = true; W.idsDirty = true;
  l.updateMatrixWorld(true); const s = W.toScreen(new THREE.Box3().setFromObject(l).getCenter(new THREE.Vector3()));
  W.fx.burst(s.x, s.y, { n: 12, shape: 'star', colors: ['#ffffff', '#ffd0de', '#ffe14d'], speed: 200, life: .45, size: 9 });
  G.audio.sfx('pop', 5);
  S.tw.run(.3, k => l.scale.setScalar(.6 + .4 * ease.outBack(k)), ease.linear).then(() => l.scale.setScalar(1));
}

// ── the box (before the hunt). The runner card is the one in the HUD: it starts inside the box and ends in its place.
export async function kitIntro(S) {
  const G = S.G, K = KITS[S.kit.kit], card = S.tray, col = S.col;
  if (!card || !col) return;
  if (K.intro !== 'box') return kitPop(S);
  const seen = G.save.kitIntro || 0, quick = seen > 0 || S.kitRetry;   // the second kit on (레벨 세션): about a second
  if (!G.playMode) { G.save.kitIntro = seen + 1; G.persist?.(); }
  const anims = new Set(), outs = [];
  const A = (el, kf, o) => { const a = el.animate(kf, { fill: 'both', ...o }); anims.add(a); return a.finished.catch(() => {}); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let skipped = false;
  const box = h('div', { class: 'kitbox' + (K.boxArt ? ' art' : '') },
    h('div', { class: 'kitbox-in' }),
    h('div', { class: 'kitbox-front', style: `background:${K.color}` }),
    h('div', { class: 'kitbox-lid' + (K.boxArt ? ' art' : ''), style: `--box:${K.color}` },   // (GPT's box art: the whole lid; else the model's own picture on a sunburst)
      h('div', { class: 'kitbox-art' }, h('img', { src: K.boxArt || G.thumbStore[S.kitPic('box')], alt: '' })),
      h('div', { class: 'kitbox-label' }, h('b', {}, K.name), h('span', {}, `부품 ${K.order.length}개`))));
  const lay = h('div', { class: 'kitintro' }, box);
  col.append(lay);
  const lid = box.querySelector('.kitbox-lid');
  const skip = () => { skipped = true; };
  lay.addEventListener('pointerdown', skip); card.addEventListener('pointerdown', skip);
  // where things are: the card's own place (it ends there), the box's middle
  const cr = card.getBoundingClientRect(), br = box.getBoundingClientRect(), cc = col.getBoundingClientRect();
  const dy = (br.top + br.height * .42) - (cr.top + cr.height / 2);
  const cells = Object.values(S.kitCells);
  cells.forEach(c => c.classList.add('full'));   // the runner comes out of the box whole
  card.style.zIndex = 31; card.style.visibility = 'hidden';
  try {
    G.audio.sfx('whoosh');
    if (!quick) {
      // in it drops, bounces, wiggles
      await A(box, [{ transform: 'translateY(-70vh) rotate(-8deg)' }, { transform: 'translateY(0) rotate(0)', offset: .75 }, { transform: 'translateY(0) scale(1.06, .92)', offset: .88 }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.3,.6,.3,1)' });
      if (skipped) throw 0;
      G.audio.sfx('land'); haptic('tick');
      await A(box, [{ transform: 'rotate(0)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }], { duration: 380, easing: 'ease-in-out' });
      if (skipped) throw 0;
    } else {
      await A(box, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 200, easing: 'cubic-bezier(.2,1.6,.4,1)' });
      if (skipped) throw 0;
    }
    // the lid pops off and away
    G.audio.sfx('pop', 6); haptic('tick');
    const mouth = { x: br.left + br.width / 2, y: br.top + br.height * .4 };
    G.world.fx.burst(mouth.x, mouth.y, { n: 18, shape: 'star', colors: ['#ffe14d', '#ffffff', '#8fd3f4'], speed: 260, life: .5, size: 10 });
    A(lid, [{ transform: 'none' }, { transform: 'translate(10px,-90px) rotate(-10deg) scale(1.04)', offset: .35 }, { transform: 'translate(70vw,-60vh) rotate(40deg) scale(.8)', opacity: 0 }], { duration: quick ? 320 : 520, easing: 'cubic-bezier(.3,.1,.6,1)' });
    await wait(quick ? 120 : 220);
    if (skipped) throw 0;
    // the runner rises out of it; the box goes
    card.style.visibility = '';
    G.audio.sfx('swish');
    A(box, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(40px) scale(.9)', opacity: 0 }], { duration: 380, easing: 'ease-in' });
    // (the card is full width: it rises no bigger than its own size, or it runs off the screen)
    await A(card, [{ transform: `translateX(-50%) translateY(${dy + 20}px) scale(.55)`, opacity: 0 }, { transform: `translateX(-50%) translateY(${dy - 30}px) scale(1.03)`, opacity: 1, offset: .7 }, { transform: `translateX(-50%) translateY(${dy - 20}px) scale(1)`, opacity: 1 }], { duration: quick ? 280 : 420, easing: 'cubic-bezier(.2,.9,.3,1)' });
    if (skipped) throw 0;
    // the pieces snap off the runner one by one and scatter into the room (not to where they hide: anywhere over it)
    const W = G.world, rnd = rng(S.spec.seed + 5);
    const order = cells.slice();
    for (let i = 0; i < order.length; i++) {
      const c = order[i], r = c.getBoundingClientRect(), x0 = r.left + r.width / 2 - cc.left, y0 = r.top + r.height / 2 - cc.top;
      const img = h('img', { class: 'kitfly', src: c.querySelector('.kitrun-pc').src, style: `left:${x0 - 30}px;top:${y0 - 30}px` });
      col.append(img); outs.push(img);
      c.classList.remove('full'); c.classList.add('pop');
      G.audio.sfx('pop', 4 + i);
      const tx = (rnd() * .7 + .15) * cc.width - x0, ty = (rnd() * .32 + .2) * cc.height - y0, up = 120 + rnd() * 80;
      const land = A(img, [{ transform: 'translate(0,0) scale(.9) rotate(0)' }, { transform: `translate(${tx * .45}px,${ty * .45 - up}px) scale(1.25) rotate(${(rnd() - .5) * 200}deg)`, offset: .45 },
        { transform: `translate(${tx}px,${ty}px) scale(.45) rotate(${(rnd() - .5) * 500}deg)`, opacity: .2 }], { duration: quick ? 380 : 560, easing: 'cubic-bezier(.3,.2,.5,1)' });
      land.then(() => { img.remove(); if (!skipped) { W.fx.burst(cc.left + x0 + tx, cc.top + y0 + ty, { n: 10, shape: 'circle', colors: ['#ffffff', '#f3ecff', '#ffe9c9'], speed: 140, up: 30, size: 8, life: .4 }); G.audio.sfx('tock', 2 + i); } });
      await wait(quick ? 45 : 95);
      if (skipped) throw 0;
    }
    await wait(quick ? 260 : 480);
    if (skipped) throw 0;
    // the runner, empty now, down into its place
    await A(card, [{ transform: `translateX(-50%) translateY(${dy - 20}px) scale(1)` }, { transform: 'translateX(-50%)' }], { duration: quick ? 260 : 380, easing: 'cubic-bezier(.16,1,.3,1)' });
  } catch {}
  for (const a of anims) { try { a.cancel(); } catch {} }
  outs.forEach(o => o.remove());
  cells.forEach(c => c.classList.remove('full', 'pop'));
  card.style.visibility = ''; card.style.zIndex = '';
  lay.removeEventListener('pointerdown', skip); card.removeEventListener('pointerdown', skip);
  lay.classList.add('out'); setTimeout(() => lay.remove(), 260);
}

// ── where it's built: an open tile the view sees whole (feet, middle, head and both sides), with room either side for the
// friend and 몽글이 to stand and watch; front tiles and tiles near the friend win ties. The view may turn up to 90° for
// one (an orthographic view: whether something is in the way depends on the angle only, not on where the camera looks).
const SIDE = .66;
function buildSpot(S) {
  const t0 = performance.now(), W = S.G.world, f = S.friend.root.position, rc = S.room.center || new THREE.Vector3();
  const tiles = (S.freeTiles || []).filter(t => (t.R?.clearAt ? t.R.clearAt(t.x, t.z, .45) : true));
  const y0 = W.yaw, p0 = W.pitch, roots = [S.room.group];
  const seen = q => { const s = W.toScreen(q); const hit = W.pick(s.x, s.y, roots).find(x => !x.object.userData.proxy); return !hit || hit.distance > W.raycaster.ray.origin.distanceTo(q) - .12; };
  // what else would be in the picture (레벨 세션 10/19: a big pot behind the model, a tree over the lower half, a chair
  // through the ghost): every piece of furniture's box (rugs and other flat things don't count), and rays through a grid
  // over the model's frame — from a little below its feet to above its head, either side — counting the ones that meet
  // furniture within 1.6 m in front of or behind the model
  const boxes = [];
  S.room.group.traverse(o => { if (o.userData.furn && o.userData.furn.group === o) { const b = new THREE.Box3().setFromObject(o); if (!b.isEmpty() && b.max.y - b.min.y > .1) boxes.push(b); } });
  const ray = new THREE.Ray(), hitP = new THREE.Vector3();
  const clutter = (P, side, up, toCam) => {
    let n = 0;
    for (const k of [-.55, -.28, 0, .28, .55]) for (const h of [-.35, -.1, .2, .5, .8, 1.1]) {
      ray.origin.copy(P).addScaledVector(side, k).addScaledVector(up, h).addScaledVector(toCam, 20); ray.direction.copy(toCam).negate();
      for (const b of boxes) if (ray.intersectBox(b, hitP) && Math.abs(hitP.distanceTo(ray.origin) - 20) < 1.6) { n++; break; }
    }
    return n;
  };
  let best = null;
  W.pitch = p0 > .38 && p0 < .9 ? p0 : .55;
  const cp = Math.cos(W.pitch), sp = Math.sin(W.pitch);
  [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2].forEach((d, di) => {
    const yaw = y0 + d; W.yaw = yaw; W.updateCam();
    const side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), toCam = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const view = new THREE.Vector3(cp * Math.sin(yaw), sp, cp * Math.cos(yaw)), up = new THREE.Vector3(-sp * Math.sin(yaw), cp, -sp * Math.cos(yaw));   // towards the camera, the screen's up
    for (const t of tiles) {
      const y = t.y || 0, at = (k, h) => new THREE.Vector3(t.x + side.x * k, y + h, t.z + side.z * k);
      if (![[0, .08], [0, .45], [0, .88], [.2, .4], [-.2, .4]].every(([k, h]) => seen(at(k, h)))) continue;
      const room = k => { const q = at(k * SIDE, 0); return (!t.R?.clearAt || t.R.clearAt(q.x, q.z, .28)) && seen(at(k * SIDE, .35)); };
      const c = clutter(new THREE.Vector3(t.x, y + .4, t.z), side, up, view);
      const score = (room(1) ? 2 : 0) + (room(-1) ? 2 : 0) + (t.R?.clearAt?.(t.x, t.z, .7) ? 1 : 0) - c * 1.1
        + .25 * ((t.x - rc.x) * toCam.x + (t.z - rc.z) * toCam.z) - .15 * Math.hypot(t.x - f.x, t.z - f.z) - di * .6;
      if (!best || score > best.score) best = { t, yaw, score, clutter: c };
    }
  });
  const pitch = W.pitch; W.yaw = y0; W.pitch = p0; W.updateCam();
  if (!best) best = { t: tiles[0] || { x: f.x + 1, z: f.z + 1, y: 0 }, yaw: y0, clutter: -1 };
  S.kitSpot = { x: +best.t.x.toFixed(2), z: +best.t.z.toFixed(2), clutter: best.clutter, yaw: +best.yaw.toFixed(2), ms: Math.round(performance.now() - t0) };   // (QA)
  return { p: new THREE.Vector3(best.t.x, best.t.y || 0, best.t.z), yaw: best.yaw, pitch, tile: best.t };
}
// the friend (to the right) and 몽글이 (to the left) come over to watch: a poof where they are, a poof beside the spot —
// no hopping through the furniture
async function poofTo(S, ch, to, yaw) {
  const W = S.G.world, tw = S.tw, from = ch.root.position.clone();
  if (Math.hypot(from.x - to.x, from.z - to.z) < .3) return;
  const puff = q => { const s = W.toScreen(q.clone().setY(q.y + .25)); W.fx.burst(s.x, s.y, { n: 14, shape: 'circle', colors: ['#ffffff', '#f3ecff', '#ffe9c9'], speed: 160, up: 40, size: 9, life: .45 }); };
  const s0 = ch.root.scale.x;
  S.G.audio.sfx('pop', 4); puff(from);
  await tw.run(.14, k => ch.root.scale.setScalar(Math.max(.01, s0 * (1 - k))), ease.inQuad);
  ch.root.position.set(to.x, to.y, to.z); ch.faceTo?.(to.x + Math.sin(yaw), to.z + Math.cos(yaw));
  puff(to); S.G.audio.sfx('pop', 7);
  await tw.run(.26, k => ch.root.scale.setScalar(Math.max(.01, s0 * k)), ease.outBack);
  ch.root.scale.setScalar(s0);
}
async function gather(S, P, R, yaw) {
  const side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), toCam = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));   // screen-right, towards the camera
  const clear = q => !R?.clearAt || R.clearAt(q.x, q.z, .28);
  const near = k => [SIDE, SIDE + .15, SIDE - .12].map(d => P.clone().addScaledVector(side, k * d).addScaledVector(toCam, -.1)).find(clear);
  // in the way: close to the spot, or anywhere between it and the camera (an orthographic view)
  const inWay = q => { const dx = q.x - P.x, dz = q.z - P.z, along = dx * toCam.x + dz * toCam.z, lat = dx * side.x + dz * side.z; return Math.hypot(dx, dz) < 1.1 || (along > -.25 && Math.abs(lat) < .6); };
  const taken = [];
  const free = from => (S.freeTiles || []).map(t => new THREE.Vector3(t.x, t.y || 0, t.z))
    .filter(q => !inWay(q) && Math.hypot(q.x - P.x, q.z - P.z) > 1.2 && !taken.some(o => o.distanceTo(q) < .7))
    .sort((u, v) => u.distanceTo(from) - v.distanceTo(from))[0] || null;
  const jobs = [];
  const fTo = near(1) || near(-1); if (fTo) { taken.push(fTo); jobs.push(poofTo(S, S.friend, fTo, yaw)); }
  // 몽글이 beside the spot on the other side, the locals off to a free tile — whoever would stand in the shot. (Wait for a
  // walk under way to end first: 몽글이 walks towards the middle of the view, and the last find may have set it off right
  // into the spot; after the clear nobody starts a new one.)
  const hero = S.hero;
  for (let i = 0; i < 20 && hero?.busy; i++) await S.tw.wait(.1);
  if (hero?.ch && inWay(hero.ch.root.position)) {
    const to = [near(-1), near(1)].find(q => q && !taken.some(o => o.distanceTo(q) < .4)) || free(hero.ch.root.position);
    if (to) { taken.push(to); hero.t = hero.nearest(to.x, to.z) || hero.t; jobs.push(poofTo(S, hero.ch, to, yaw)); }
  }
  for (const n of S.npcs || []) {
    if (!n.ch?.root || n === S.villain || !inWay(n.ch.root.position)) continue;
    const to = free(n.ch.root.position);
    if (to) { taken.push(to); n.t = (S.freeTiles || []).find(t => Math.hypot(t.x - to.x, t.z - to.z) < .01) || n.t; jobs.push(poofTo(S, n.ch, to, yaw)); }
  }
  await Promise.all(jobs);
}

// ── the build (on the last piece, before the result panel; stage.js win): the model as a see-through ghost on a clear
// spot, the runner full again at the bottom. Drag a piece off the runner onto its place (it pulls in once it's close) or
// just tap it; a piece let go anywhere else floats back to its cell and its place on the ghost blinks. No order, no clock.
const GHOST = '#8fd0ff';
export async function kitBuild(S) {
  const G = S.G, W = G.world, tw = S.tw, K = KITS[S.kit.kit], B = K.build || {}, f = S.friend, card = S.tray, cells = S.kitCells;
  const st = S.kitState = { phase: 'build', placed: 0, total: K.order.length, drops: 0, taps: 0, drags: 0 };
  W.camLock = true;
  const off = [];   // listeners to take off at the end
  try {
    card?.classList.add('done');
    await tw.wait(.3); if (S.dead) return;
    const { p: P, yaw, pitch, tile } = buildSpot(S);
    f.setFace('wow'); f.bump?.(.4);
    const goBub = S.say(f, S.kit.go || KIT_GO[K.id] || '다 모았다!', 1600); G.audio.sfx('special');
    // in close on the spot: the model about half the screen's height, the two watching either side still in the picture
    // in close: the model about a third of the screen's height, its middle 40 % down (the runner below it). The view
    // zooms about its frustum's middle, not about its target (world.js applyFrustum: cy), so the further in, the
    // further the target slides off the middle — the target is set where the model's middle lands at 40 %.
    // (The two either side may be cut by the screen's edges: the model wins.)
    const vh = W.viewH || 11, zoom = Math.max(1.5, Math.min(8, vh / 2.7)), cy = W.fit?.cy ?? .46;   // (a step back: 레벨 세션 10/19 — so close it was mostly floor)
    const atT = .5 + (cy - .5) * zoom, mid = P.y + .35 * RS * S.room.group.getWorldScale(new THREE.Vector3()).y;
    const tY = mid - (atT - .5) * (vh / zoom) / Math.max(.3, Math.cos(pitch));   // (the middle: less floor in front of it — 레벨 세션 10/19)
    await Promise.all([W.flyTo(tw, { target: new THREE.Vector3(P.x, tY, P.z), yaw, pitch, zoom, dur: .7, e: ease.inOutCubic }), gather(S, P, tile?.R, yaw)]);
    if (S.dead) return;
    card?.classList.remove('done');
    f.faceTo?.(P.x, P.z); S.hero?.ch?.faceTo?.(P.x, P.z);
    // the model: a group at the spot, facing the camera; one pivot per piece, at the piece's joint
    const R = new THREE.Group(); R.position.copy(S.room.group.worldToLocal(P.clone()));
    R.rotation.y = Math.atan2(W.cam.position.x - P.x, W.cam.position.z - P.z); R.scale.setScalar(RS);
    const sh = blobShadow(.2, .3); sh.scale.set(.42, .42, 1); R.add(sh);
    S.room.group.add(R); R.updateMatrixWorld(true);
    S.kitModel = R;
    const glow = buildKitGlow(K.id); glow.g.visible = false;
    // each piece: its joint, its middle (model frame), its see-through ghost in place
    const pcs = {};
    for (const key of K.order) {
      const J = new THREE.Vector3(...K.parts[key].joint);
      const box = new THREE.Box3().setFromObject(buildKitPart(K.id, key)), C = box.getCenter(new THREE.Vector3());
      const ghost = buildKitPart(K.id, key), mat = new THREE.MeshBasicMaterial({ color: GHOST, transparent: true, opacity: .32, depthWrite: false });
      ghost.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = false; o.renderOrder = 2; } });
      R.add(ghost);
      pcs[key] = { key, J, C, ghost, mat, pv: null, done: false, busy: false };
    }
    W.idsDirty = true;
    // the ghost comes in with a shimmer
    G.audio.sfx('swish');
    const mats = Object.values(pcs).map(c => c.mat);
    if (B.ghost === false) Object.values(pcs).forEach(c => { c.ghost.visible = false; });   // (a harder kit: no see-through model)
    tw.run(.45, k => mats.forEach(m => { m.opacity = .32 * k; }), ease.outQuad);
    const sp0 = W.toScreen(R.localToWorld(new THREE.Vector3(0, .35, 0)));
    W.fx.burst(sp0.x, sp0.y, { n: 16, shape: 'star', colors: ['#bfe8ff', '#ffffff'], speed: 200, life: .5, size: 8 });
    // the runner: full again, a little up and bigger, every piece ready to be picked
    Object.values(cells).forEach(c => c.classList.add('ready'));
    card?.classList.add('build');
    // a fresh piece group (its pivot at the joint)
    const makePiece = key => {
      const c = pcs[key], part = bakeItem(buildKitPart(K.id, key), 'kitp|' + K.id + '|' + key);
      part.position.copy(c.J).negate();
      const pv = new THREE.Group(); pv.add(part); pv.userData.og = {};   // each piece its own ink outline: the seams show
      if (key === glow.part) { glow.g.position.copy(c.J).negate(); pv.add(glow.g); }
      pv.traverse(o => { if (o.isMesh) o.castShadow = false; });
      R.add(pv); W.idsDirty = true;
      return pv;
    };
    // screen ↔ the model: a plane through the model's middle, facing the camera
    const plane = new THREE.Plane(), camDir = new THREE.Vector3();
    W.cam.getWorldDirection(camDir);
    plane.setFromNormalAndCoplanarPoint(camDir.clone().negate(), R.localToWorld(new THREE.Vector3(0, .35, 0)));
    const toLocal = (x, y) => { W.raycaster.setFromCamera(W.ndc(x, y), W.cam); const v = new THREE.Vector3(); return W.raycaster.ray.intersectPlane(plane, v) ? R.worldToLocal(v) : null; };
    const scrOf = v => W.toScreen(R.localToWorld(v.clone()));
    const hpx = Math.abs(scrOf(new THREE.Vector3(0, 0, 0)).y - scrOf(new THREE.Vector3(0, .7, 0)).y);
    const snapR = Math.max(64, hpx * .26);   // a dragged piece this near its place glows it and is pulled in
    const cellAt = key => { const r = cells[key].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    const LIFT = 58;   // a dragged piece rides this far above the fingertip, so the finger doesn't hide it
    let squash = 0, lastAct = performance.now(), hand = null;
    const hideHand = () => { hand?.remove(); hand = null; };
    // 순서 맞추기 (user 10/19): the runner's numbers are the order, like a kit's instructions — the next number glows,
    // any other piece hops back (nothing lost, no tap spent). The kit's build knobs (modelkit-props KITS: ordered / glow /
    // ghost) make later kits harder; ?kitorder=0 tries any order.
    const qOrd = /[?&]kitorder=([01])(&|$)/.exec(location.search);
    const ordered = qOrd ? qOrd[1] === '1' : B.ordered !== false;
    st.ordered = ordered;
    const nextKey = () => K.order.find(k => !pcs[k].done);
    const okNow = c => !ordered || (c.key === nextKey() && !Object.values(pcs).some(q => q.busy && q !== c && !q.done));
    const markNext = () => { if (!ordered || B.glow === false) return; const n = nextKey(); for (const k in cells) cells[k].classList.toggle('next', k === n); };
    const blink = c => { let n = 0; const b = () => { if (S.dead || c.done) return; c.mat.color.set(n % 2 ? GHOST : '#ffe14d'); c.mat.opacity = n % 2 ? .32 : .7; if (++n < 6) setTimeout(b, 130); }; b(); };
    const wrongOnce = () => { st.drops++; G.audio.sfx('wobble'); if (st.drops === 1 && S.kit.wrong) { goBub?.kill?.(); S.say(f, S.kit.wrong, 1600); } };   // (one bubble at a time)
    markNext();
    // click! into place
    const snap = c => {
      c.done = true; c.busy = false; st.placed++;
      c.pv.position.copy(c.J); c.pv.quaternion.identity(); c.pv.rotation.set(0, 0, 0); c.pv.scale.setScalar(1);
      c.ghost.visible = false; squash = 1;
      cells[c.key].classList.remove('taken', 'ready'); cells[c.key].classList.add('used');
      G.audio.sfx('latch'); G.audio.sfx('pop', 3 + st.placed); haptic('ok');
      const s = scrOf(c.C); W.fx.burst(s.x, s.y, { n: 14, shape: 'star', colors: ['#ffe14d', '#ffffff', '#8fd3f4'], speed: 240, gravity: 0, life: .45, size: 10 });
      W.fx.ring(s.x, s.y, { r: 52, color: '#ffffff', width: 6, life: .3 });
      if (st.placed === st.total) G.hitstop(.07);
      markNext();
    };
    // a piece flies by itself from where it is to its place (a tap; or let go close enough)
    const flyIn = async (c, from, s0) => {
      c.busy = true;
      const to = c.J.clone(), q0 = c.pv.quaternion.clone(), Q1 = new THREE.Quaternion();
      await tw.run(.34, k => {
        c.pv.position.lerpVectors(from, to, k); c.pv.position.y += Math.sin(k * Math.PI) * .12;
        c.pv.quaternion.slerpQuaternions(q0, Q1, k); c.pv.scale.setScalar(s0 + (1 - s0) * k);
      }, ease.inOutCubic);
      if (!S.dead) snap(c);
    };
    const autoPlace = c => {
      if (c.done || c.busy) return;
      st.taps++; lastAct = performance.now(); hideHand();
      if (!okNow(c)) {   // 순서 맞추기: not this one yet — it hops in its cell, the next one's place blinks
        const el = cells[c.key]; el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope');
        wrongOnce(); const n = pcs[nextKey()]; if (n) blink(n);
        return;
      }
      cells[c.key].classList.add('taken');
      G.audio.sfx('tap'); haptic('tick');
      const a = cellAt(c.key), L = toLocal(a.x, a.y - 30) || c.J.clone().add(new THREE.Vector3(0, -.4, .3));
      c.pv = makePiece(c.key); const from = L.sub(c.C.clone().sub(c.J)); c.pv.position.copy(from); c.pv.scale.setScalar(.7);
      c.pv.quaternion.setFromEuler(new THREE.Euler(.3, .6, -.4));
      return flyIn(c, from, .7);
    };
    // dragging
    let drag = null;
    const down = e => {
      const cell = e.currentTarget, c = pcs[cell.dataset.p];
      if (!c || c.done || c.busy || drag) return;
      e.preventDefault(); e.stopPropagation();
      try { cell.setPointerCapture(e.pointerId); } catch {}
      drag = { c, id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: false, vx: 0, lx: e.clientX, near: false };
      lastAct = performance.now(); hideHand();
    };
    const move = e => {
      const d = drag; if (!d || d.id !== e.pointerId) return;
      d.x = e.clientX; d.y = e.clientY; lastAct = performance.now();
      if (!d.moved && Math.hypot(d.x - d.x0, d.y - d.y0) > 9) {
        d.moved = true; st.drags++;
        const c = d.c; c.busy = true; cells[c.key].classList.add('taken');
        G.audio.sfx('tap'); haptic('tick');   // 톡: off the runner
        const r = cells[c.key].getBoundingClientRect(); W.fx.burst(r.left + r.width / 2, r.top - 4, { n: 8, shape: 'circle', colors: ['#ffffff', GHOST], speed: 120, up: 60, size: 6, life: .3 });
        c.pv = makePiece(c.key); c.pv.scale.setScalar(1.12);
        const L = toLocal(d.x, d.y - LIFT); if (L) c.pv.position.copy(L.sub(c.C.clone().sub(c.J)));
      }
    };
    const up = e => {
      const d = drag; if (!d || d.id !== e.pointerId) return;
      drag = null; lastAct = performance.now();
      const c = d.c;
      if (!d.moved) { autoPlace(c); return; }   // a tap: it goes by itself
      // let go: anywhere at all, it goes in by itself if it's its turn (no aiming — user 10/19: no new move to learn; a
      // finger that drags anyway is never wrong for it); out of turn → back to its cell, the next one's place blinks
      if (okNow(c)) { flyIn(c, c.pv.position.clone(), c.pv.scale.x); return; }
      wrongOnce();   // (the line the first time only — 스토리 룸: every time would be nagging)
      const a = cellAt(c.key), L = toLocal(a.x, a.y) || c.pv.position.clone(), from = c.pv.position.clone(), back = L.sub(c.C.clone().sub(c.J)), s0 = c.pv.scale.x, pv = c.pv;
      tw.run(.26, k => { pv.position.lerpVectors(from, back, k); pv.scale.setScalar(s0 * (1 - .6 * k)); }, ease.inQuad).then(() => {
        R.remove(pv); W.idsDirty = true; if (c.pv === pv) c.pv = null; c.busy = false; cells[c.key].classList.remove('taken');
      });
      blink(ordered ? pcs[nextKey()] || c : c);
    };
    for (const cell of Object.values(cells)) {
      cell.addEventListener('pointerdown', down); cell.addEventListener('pointermove', move);
      cell.addEventListener('pointerup', up); cell.addEventListener('pointercancel', up);
      off.push(() => { cell.removeEventListener('pointerdown', down); cell.removeEventListener('pointermove', move); cell.removeEventListener('pointerup', up); cell.removeEventListener('pointercancel', up); });
    }
    S.kitAuto = async () => { for (const k of K.order) { const c = pcs[k]; if (!c.done && !c.busy) { autoPlace(c); if (ordered) await tw.wait(.4); } } };   // (QA)
    // the frame loop: the dragged piece follows the finger (a little lag, a lean into the motion, pulled in when close),
    // the ghost place under it glows, the model squashes on each click, a hint hand after a while with nothing done
    let last = performance.now(), botT = 0;
    while (!S.dead && st.placed < st.total) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
      W.lastActive = now;   // full frame rate on phones while it plays
      const d = drag;
      for (const c of Object.values(pcs)) if (!c.done && c !== d?.c) { c.mat.opacity += ((c.busy ? .5 : .32) - c.mat.opacity) * .2; }
      if (d?.moved && d.c.pv) {
        const c = d.c, off = c.C.clone().sub(c.J);
        let goal = toLocal(d.x, d.y - LIFT); goal = goal ? goal.sub(off) : c.pv.position.clone();
        const gs = scrOf(goal.clone().add(off)), ts = scrOf(c.C), dist = Math.hypot(gs.x - ts.x, gs.y - ts.y);
        const near = dist < snapR && okNow(c);
        if (near) goal.lerp(c.J, .45);   // the pull: it wants to go in
        if (near !== d.near) { d.near = near; if (near) { G.audio.sfx('tick'); haptic('tick'); } }
        c.mat.color.set(near ? '#ffe14d' : GHOST); c.mat.opacity = near ? .75 : .55;
        c.pv.position.lerp(goal, 1 - Math.exp(-dt * 22));
        d.vx += ((d.x - d.lx) / Math.max(dt, .001) - d.vx) * .25; d.lx = d.x;
        c.pv.rotation.z += (Math.max(-.45, Math.min(.45, -d.vx * .0009)) - c.pv.rotation.z) * .2;
        c.pv.rotation.x += ((near ? 0 : .25) - c.pv.rotation.x) * .15;
        c.pv.scale.setScalar(c.pv.scale.x + ((near ? 1.02 : 1.12) - c.pv.scale.x) * .2);
      }
      squash = Math.max(0, squash - dt / .16);
      const sq = Math.sin(squash * Math.PI) * .08;
      R.scale.set(RS * (1 + sq * .5), RS * (1 - sq), RS * (1 + sq * .5));
      // nothing done for a while: a hand shows the way (first piece left → its place), no words
      if (!hand && !drag && now - lastAct > 2600 && !S.botOn()) {
        const c = ordered ? pcs[nextKey()] : Object.values(pcs).find(q => !q.done && !q.busy);
        if (c && !c.busy) {
          const a = cellAt(c.key);
          hand = h('div', { class: 'hand tap', html: ICON.hand, style: `left:${a.x}px;top:${a.y - 6}px` });
          G.ui.tut.append(hand);
        }
      }
      if (S.botOn() && !drag && (botT += dt) > .35) { botT = 0; const c = ordered ? pcs[nextKey()] : Object.values(pcs).find(q => !q.done && !q.busy); if (c && okNow(c) && !c.busy) autoPlace(c); }
    }
    hideHand();
    if (S.dead) return;
    off.forEach(f => f()); off.length = 0;
    card?.classList.remove('build'); card?.classList.add('gone');
    await tw.wait(.25); if (S.dead) return;
    st.phase = 'alive';
    await comeAlive(S, R, pcs, glow, P);
  } finally { off.forEach(f => f()); W.camLock = false; }
}
// it comes alive: eyes on, a hop, a wave with the fist, a spin — then it stays and idles (while the result panel is up)
async function comeAlive(S, R, pcs, glow, P) {
  const G = S.G, W = G.world, tw = S.tw, f = S.friend;
  const fist = pcs.fist?.pv, claw = pcs.claw?.pv, head = pcs.head?.pv;
  const y0 = S.room.group.worldToLocal(P.clone()).y, r0 = R.rotation.y;
  glow.g.visible = true; W.idsDirty = true;
  G.audio.sfx('unlock'); haptic('big');
  const s = W.toScreen(R.localToWorld(new THREE.Vector3(0, .5, .1)));
  W.fx.burst(s.x, s.y, { n: 30, colors: ['#ffe14d', '#ff8fb8', '#8fd3f4', '#ffffff'], speed: 340 }); W.fx.ring(s.x, s.y, { r: 120, color: '#ffe14d', width: 9 });
  f.pose = 'cheer'; f.setFace('happy'); f.bump?.(.5);
  let puffed = false;
  await tw.run(1.7, k => {
    const u = k * 1.7; W.lastActive = performance.now();
    let hop = u < .35 ? Math.sin(u / .35 * Math.PI) * .16 : 0, spin = 0;
    if (fist) { const w = u < .25 ? ease.outBack(u / .25) : u < 1.0 ? 1 : Math.max(0, 1 - (u - 1.0) / .2); fist.rotation.set(0, 0, w * (2.3 + (u > .25 && u < 1.0 ? Math.sin((u - .25) * 16) * .35 : 0))); }
    if (claw) claw.rotation.set(0, 0, u > .35 && u < 1.0 ? -Math.sin((u - .35) / .65 * Math.PI) * .6 : 0);
    if (head) head.rotation.set(0, 0, u > .3 && u < 1.0 ? Math.sin((u - .3) * 9) * .14 : 0);
    if (u > 1.05 && u < 1.65) { const q = (u - 1.05) / .6; spin = ease.inOutCubic(q) * Math.PI * 2; hop = Math.sin(q * Math.PI) * .22; if (!puffed) { puffed = true; G.audio.sfx('whoosh'); } }
    if (u > 1.05 && u < 1.6 && Math.random() < .5) { const p = W.toScreen(R.localToWorld(new THREE.Vector3(0, .17, -.12))); W.fx.burst(p.x, p.y, { n: 2, shape: 'circle', colors: ['#ffe14d', '#ffb340', '#ffffff'], speed: 70, up: -40, size: 7, life: .35 }); }
    R.position.y = y0 + hop; R.rotation.y = r0 + spin;
  }, ease.linear);
  if (S.dead) return;
  R.position.y = y0; R.rotation.y = r0; G.audio.sfx('land');
  (async () => { let k = 0; while (!S.dead && R.parent) { await tw.run(1.1, e => { R.position.y = y0 + Math.abs(Math.sin(e * Math.PI)) * .03; if (head) head.rotation.z = Math.sin(e * Math.PI) * (k % 2 ? .1 : -.1); }, ease.linear); k++; } })();
}

// ── the quick start for a kit without a box (이삿짐, 파르페): the card pops up empty and the things jump out of the moving
// boxes / off the parfait ("토핑을 몽땅 엎질렀어") into the room — about a second, a tap skips
async function kitPop(S) {
  const G = S.G, W = G.world, K = KITS[S.kit.kit], card = S.tray, col = S.col, cc = col.getBoundingClientRect();
  const anims = [], outs = [], wait = ms => new Promise(r => setTimeout(r, ms));
  let skipped = false; const skip = () => { skipped = true; };
  document.addEventListener('pointerdown', skip, true);
  const A = (el, kf, o) => { const a = el.animate(kf, { fill: 'both', ...o }); anims.push(a); return a.finished.catch(() => {}); };
  try {
    G.audio.sfx('swish');
    await A(card, [{ transform: 'translateX(-50%) translateY(150%)' }, { transform: 'translateX(-50%)' }], { duration: 300, easing: 'cubic-bezier(.2,1.3,.4,1)' });
    if (skipped) throw 0;
    const rnd = rng((S.spec.seed || 1) + 5), from = i => {
      const o = K.type === 'place' ? S.kitBoxes?.[i % (S.kitBoxes.length || 1)] : S.kitParfait?.g;
      if (!o) return { x: cc.width / 2, y: cc.height * .45 };
      const p = W.toScreen(o.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, K.type === 'stack' ? 1 : .3, 0)));
      return { x: p.x - cc.left, y: p.y - cc.top };
    };
    K.order.forEach((p, i) => {
      const o = from(i), img = h('img', { class: 'kitfly', src: S.kitCells[p].querySelector('.kitrun-pc').src, style: `left:${o.x - 30}px;top:${o.y - 30}px` });
      col.append(img); outs.push(img);
      const tx = (rnd() * .7 + .15) * cc.width - o.x, ty = (rnd() * .3 + .22) * cc.height - o.y, up = 90 + rnd() * 70;
      setTimeout(() => !skipped && G.audio.sfx('pop', 3 + i), i * 55);
      A(img, [{ transform: 'translate(0,0) scale(.3)', opacity: 0 }, { transform: `translate(${tx * .4}px,${ty * .4 - up}px) scale(1.1) rotate(${(rnd() - .5) * 200}deg)`, opacity: 1, offset: .4 },
        { transform: `translate(${tx}px,${ty}px) scale(.4) rotate(${(rnd() - .5) * 400}deg)`, opacity: 0 }], { duration: 520, delay: i * 55, easing: 'cubic-bezier(.3,.2,.5,1)' });
    });
    if (K.type === 'place') G.audio.sfx('rustle');
    await wait(520 + K.order.length * 55);
  } catch {}
  for (const a of anims) { try { a.cancel(); } catch {} }
  outs.forEach(o => o.remove());
  document.removeEventListener('pointerdown', skip, true);
}

// ── the end of the hunt (stage.js win): a model kit is built; 이삿짐's room becomes home; the parfait gets its cherry
export async function kitFinish(S) {
  const K = KITS[S.kit.kit];
  if (K.type === 'place') return kitHome(S);
  if (K.type === 'stack') return kitTop(S);
  return kitBuild(S);
}
// 이삿짐: the last boxes fold, the room warms up, hearts — "다 풀었다! 이제 진짜 우리 집이야." (the result panel says it)
async function kitHome(S) {
  const G = S.G, W = G.world, tw = S.tw;
  S.tray?.classList.add('done');
  for (const b of (S.kitBoxes || []).splice(0)) { foldBox(S, b); await tw.wait(.08); }
  G.audio.sfx('unlock'); haptic('ok');
  const a0 = W.hemi.intensity, s0 = W.sun.intensity;
  tw.run(.9, k => { const w = Math.sin(Math.min(1, k * 1.4) * Math.PI / 2); W.hemi.intensity = a0 * (1 + .18 * w); W.sun.intensity = s0 * (1 + .12 * w); }, ease.outQuad);   // (stays a little warmer: it's home now)
  for (let i = 0; i < 5; i++) { W.fx.burst(W.W * (.2 + .15 * i), W.H * (.32 + (i % 2) * .12), { n: 10, shape: 'heart', colors: ['#ff8fb8', '#ffb3cc', '#ffffff'], speed: 160, up: 120, size: 12, life: .9 }); await tw.wait(.07); }
  S.friend.pose = 'cheer'; S.friend.setFace?.('happy'); S.friend.bump?.(.5);
  await tw.wait(.6);
}
// 파르페: in close on the glass, the cherry flies off the card onto the top — 딸깍, sparkles, its owner cheers
async function kitTop(S) {
  const G = S.G, W = G.world, tw = S.tw, K = KITS[S.kit.kit], P = S.kitParfait;
  S.tray?.classList.add('done');
  if (!P) { await tw.wait(.3); return; }
  W.camLock = true;
  try {
    const top = P.g.localToWorld(new THREE.Vector3(0, .62, 0));
    const vh = W.viewH || 11, zoom = Math.max(1.5, Math.min(9, vh / 3)), cy = W.fit?.cy ?? .46, pitch = W.pitch;
    const atT = .5 + (cy - .5) * zoom, tY = top.y - (atT - .42) * (vh / zoom) / Math.max(.3, Math.cos(pitch));
    await W.flyTo(tw, { target: new THREE.Vector3(top.x, tY, top.z), zoom, dur: .6, e: ease.inOutCubic });
    if (S.dead) return;
    // every layer that waited (nothing should, but a stage reloaded mid-way) and then the cherry
    for (const k of K.order) if (k !== K.last && !P.layers[k].visible) { popLayer(S, k); await tw.wait(.12); }
    const cell = S.kitCells[K.last], r = cell?.getBoundingClientRect(), cherryAt = W.toScreen(P.g.localToWorld(new THREE.Vector3(0, .92, 0)));
    if (r) { cell.classList.add('used'); await G.ui.flyImg(cell.querySelector('.kitrun-pc').src, r.left + r.width / 2, r.top + r.height / 2, { getBoundingClientRect: () => ({ left: cherryAt.x - 1, top: cherryAt.y - 1, width: 2, height: 2 }) }, { size: 56, dur: 520 }); }
    if (S.dead) return;
    popLayer(S, K.last); G.audio.sfx('latch'); haptic('ok'); G.hitstop(.06);
    W.fx.ring(cherryAt.x, cherryAt.y, { r: 70, color: '#ffffff', width: 7, life: .35 });
    W.fx.burst(cherryAt.x, cherryAt.y, { n: 26, shape: 'heart', colors: ['#ff8fb8', '#ffe14d', '#ffffff'], speed: 300, life: .7, size: 11 });
    S.friend.pose = 'cheer'; S.friend.setFace?.('happy'); S.friend.bump?.(.5);
    await tw.wait(.7);
  } finally { W.camLock = false; }
}

// ── the reward: the first time a kit is finished, the model goes into my home's storage as a piece of furniture.
// Returns the furniture type when it was given now, else null (already had it, or a practice run that keeps nothing)
export function kitReward(S) {
  const G = S.G, K = KITS[S.kit.kit];
  if (G.playMode) return null;
  const done = G.save.kitsDone || (G.save.kitsDone = {});
  if (done[K.id]) return null;
  done[K.id] = true;
  G.save.home.inventory.push(K.furn);
  G.persist();
  return K.furn;
}

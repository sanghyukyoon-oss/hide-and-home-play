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
import { KITS, kitItem, buildKitPart, buildKitModel, buildKitGlow, buildMoveBox, buildParfait, buildMat } from './gfx/modelkit-props.js';
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

// a piece's picture cut to its own bounds (+2 px), kept beside it in the store
function trimPic(G, k) {
  const tk = k + '_trim';
  if (G.thumbStore[tk]) return Promise.resolve(G.thumbStore[tk]);
  const src = G.thumbs[k];
  if (!src) return Promise.resolve(null);
  return new Promise(res => {
    const im = new Image();
    im.onerror = () => res(null);
    im.onload = () => {
      const w = im.naturalWidth, hh = im.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = hh;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, w, hh).data; let x0 = w, y0 = hh, x1 = -1, y1 = -1;
      for (let y = 0; y < hh; y++) for (let i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 12) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { c.width = 0; return res(null); }
      const P = 2, cw = x1 - x0 + 1 + P * 2, ch = y1 - y0 + 1 + P * 2, o = document.createElement('canvas'); o.width = cw; o.height = ch;
      o.getContext('2d').drawImage(c, x0 - P, y0 - P, cw, ch, 0, 0, cw, ch);
      const url = o.toDataURL('image/png'); c.width = o.width = 0;   // (the canvases go now)
      G.thumbStore[tk] = url; res(url);
    };
    im.src = src;
  });
}

// ── the card (in place of the list): one cell per thing, its shape empty until it's found (stage.js onFound flies the
// picture into it and marks it .found → it clicks in). Skins: a plastic runner with numbered cells (a model kit), a row
// of moving boxes that fold as they're emptied (이삿짐), little dishes of toppings (파르페).
export function kitRunner(S) {
  const G = S.G, kit = S.kit.kit, K = KITS[kit], key = ensurePics(G, kit);
  const cells = {};
  const row = h('div', { class: 'kitrun-row', style: `--n:${K.order.length}` });
  // a runner's windows aren't all one size (user 10/19: "너무 다 균등해서… 이런느낌으로", sprue-frame references): the big piece
  // in a big window, the arms in tall thin ones — KITS[kit].frame gives the grid's areas and its columns
  if (K.frame) {
    row.classList.add('framed');
    row.style.gridTemplateAreas = K.frame.areas.map(a => `"${a}"`).join(' ');
    row.style.setProperty('--cols', K.frame.cols.map(c => c + 'fr').join(' '));
  }
  K.order.forEach((p, i) => {
    const src = G.thumbs[key(p)];
    const c = h('div', { class: 'kitrun-cell' },
      h('i', { class: 'kitrun-gate l' }), h('i', { class: 'kitrun-gate r' }), h('i', { class: 'kitrun-box' }),
      h('img', { class: 'kitrun-ghost', src, alt: '' }), h('img', { class: 'kitrun-pc', src, alt: '' }),
      h('span', { class: 'kitrun-no' }, String(i + 1)), h('span', { class: 'kitrun-nm' }, K.short?.[p] || ''));
    c.dataset.p = p; if (K.frame) c.style.gridArea = p; row.append(c); cells[p] = c;
  });
  // (a frame's windows aren't square: each picture is trimmed to its piece, so a thin arm fills its thin window)
  if (K.frame) for (const p of K.order) trimPic(G, key(p)).then(src => { if (src) cells[p].querySelectorAll('img').forEach(im => { im.src = src; }); });
  const byType = Object.fromEntries(K.order.map(p => [kitItem(kit, p), p]));
  const tag = h('div', { class: 'kitrun-tag ol', style: `background:${K.color}` }, K.name);
  for (const it of S.targets) if (byType[it.type]) { it.kitPart = byType[it.type]; it.slot = cells[it.kitPart]; } else it.slot = tag;   // (anything else flies to the tag)
  S.kitCells = cells; S.kitPic = key;
  if (K.boxArt) { const im = new Image(); im.decoding = 'async'; im.src = K.boxArt; S.kitArt = im; }   // (the box's lid picture, ready before the box drops)
  return h('div', { class: `kitrun skin-${K.skin || 'runner'}${K.numbers === false ? ' nonum' : ''}`, style: `--run:${K.runner};--runsh:${K.color}` }, tag, row);
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

// the box seen from above its front-right corner; the lid sits on the body's top (its transform moves it from there)
const KB3_VIEW = 'rotateX(-28deg) rotateY(-34deg)', KB3_LID = 'translate3d(0,0,0)', KB3_PEEK = 'translate3d(0,-46px,0) rotateX(10deg)';
// the comic panel's zigzag bolts round the edges, pointing in (like the user's green zoom-burst reference)
const BOLTS_SVG = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="rgba(24,110,32,.42)"><path d="M0 14 L30 30 L22 31 L44 44 L19 37 L26 35 L0 24 Z"/><path d="M100 10 L72 28 L80 29 L56 43 L82 35 L75 33 L100 20 Z"/><path d="M0 70 L28 62 L24 67 L44 56 L20 74 L24 70 L0 80 Z"/><path d="M100 66 L74 60 L78 65 L56 56 L80 72 L76 69 L100 77 Z"/><path d="M38 100 L44 78 L40 80 L49 62 L46 82 L50 80 L46 100 Z"/><path d="M58 0 L54 20 L58 18 L50 36 L52 16 L48 18 L50 0 Z"/></g></svg>';
// ── the box (before the hunt), user 10/19 on the phone: "처음에 박스 여는 오프닝 후 착착 숨어지는 애니메이션을 한 다음에 이게 나와야
// 하는데" — and with the story room: two bubbles, no card. The view eases in on the friend ("말할 때 카메라를 잘 잡아 달라,
// 약간 클로즈업, 이즈아웃 스무스하게"), the box drops in front of them and opens, the runner rises out of it; the view eases back
// to the whole room and the pieces snap off and fly, one after another, to where they really hide — 쏙, 쏙 — then the
// runner goes down into its place and the friend says they've all hidden. ~5 s the first time this kit is played, ~1 s
// on a retry; a tap skips to the end.
export async function kitIntro(S) {
  const G = S.G, W = G.world, K = KITS[S.kit.kit], card = S.tray, col = S.col, f = S.friend;
  if (!card || !col) return;
  if (K.intro !== 'box') return kitPop(S);
  let seen = G.save.kitIntro; if (!seen || typeof seen !== 'object') seen = G.save.kitIntro = {};   // (was a count of any kit's box)
  const quick = !!seen[K.id] || S.kitRetry;
  if (!G.playMode) { seen[K.id] = (seen[K.id] || 0) + 1; G.persist?.(); }
  const anims = new Set(), outs = [];
  const A = (el, kf, o) => { const a = el.animate(kf, { fill: 'both', ...o }); anims.add(a); return a.finished.catch(() => {}); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let skipped = false;
  // the box, a real box (user 10/19: "상자도 상자처럼 느껴지고 기대감 들게", then "상자가 상자같아야되지않을까"): a CSS 3D box seen
  // from above its front-right corner — a body with every side (and its inside, dark, for when it's open) and a lid that is a
  // shallow box itself: GPT's box art on its top, the kit's name on its front rim — in front of a comic panel's backdrop
  // (speed lines from the box, halftone dots at the edges: "오프닝도 뒤에 배경이나 좀 만화같이")
  const art = K.boxArt || G.thumbStore[S.kitPic('box')];
  const F = (c, ...k) => h('div', { class: 'kb3-face kb3-' + c }, ...k);
  const box = h('div', { class: 'kb3' + (quick ? '' : ' big'), style: `--box:${K.color}` },
    h('div', { class: 'kb3-glow' }),
    h('div', { class: 'kb3-cube' },
      h('div', { class: 'kb3-floor' }),
      F('ifloor'), F('iback'), F('ileft'), F('back'), F('left'), F('bottom'), F('right'),
      F('front', h('span', { class: 'kb3-count' }, `부품 ${K.order.length}개`)),
      h('div', { class: 'kb3-lid' }, F('lback'), F('lleft'), F('lright'), F('lfront', h('b', { class: 'kb3-name' }, K.name)), F('ltop', h('img', { src: art, alt: '' })))));
  // the comic panel covers the room (user 10/19, a green zoom-burst reference: "배경은 이런느낌으로 아예 뒤를 가려도 상관없으니
  // 새롭게") — so the friend comes in as a comic cut-in: their face in a round frame, the line in a bubble beside it
  const who = S.kit.who || S.th?.friend || 'bear', face = G.thumbs['face_' + who];
  const cut = !quick && S.kit.open ? h('div', { class: 'kitcut', style: 'transform:translateX(-115%)' }, h('div', { class: 'kitcut-face' }, h('img', { src: face || '', alt: '' })), h('div', { class: 'kitcut-say' }, S.kit.open)) : null;
  const lay = h('div', { class: 'kitintro' + (quick ? '' : ' comic') },
    h('div', { class: 'kitintro-bg' }), h('div', { class: 'kitintro-rays' }), h('div', { class: 'kitintro-dots' }), h('div', { class: 'kitintro-bolts', html: BOLTS_SVG }), box, ...(cut ? [cut] : []));
  col.append(lay);
  const lid = box.querySelector('.kb3-lid'), glowEl = box.querySelector('.kb3-glow'), cube = box.querySelector('.kb3-cube'), front = box.querySelector('.kb3-front');
  cube.style.transform = KB3_VIEW; lid.style.transform = KB3_LID;
  const skip = () => { skipped = true; };
  lay.addEventListener('pointerdown', skip); card.addEventListener('pointerdown', skip);
  const cells = Object.values(S.kitCells);
  cells.forEach(c => c.classList.add('full'));   // the runner comes out of the box whole
  card.style.zIndex = 31; card.style.visibility = 'hidden';
  // the pieces aren't in the room yet: each shows the moment it lands where it hides
  const its = S.targets.filter(t => t.kitPart && t.g);
  const s0 = new Map(its.map(t => [t, t.g.scale.clone()])), vis0 = new Map(its.map(t => [t, t.g.visible]));   // (a thing inside a shut drawer is hidden till it opens: it stays so)
  its.forEach(t => { t.g.visible = false; }); W.idsDirty = true;
  const v0 = { yaw: W.yaw, pitch: W.pitch, zoom: W.zoom, target: W.target.clone() };
  W.camLock = true;
  let bub = null;
  try {
    if (!quick) {
      // the comic panel slams in over the room
      G.audio.sfx('swish');
      await A(lay, [{ opacity: 0, transform: 'scale(1.18)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.9,.3,1)' });
      if (skipped) throw 0;
    }
    const br = () => box.getBoundingClientRect();
    G.audio.sfx('whoosh');
    if (!quick) {
      // it drops in — 쿵 — and settles (a puff of dust)
      await A(box, [{ transform: 'translateY(-80vh) rotate(-6deg)' }, { transform: 'translateY(0) rotate(0)', offset: .7 }, { transform: 'translateY(0) scale(1.1, .84)', offset: .82 }, { transform: 'translateY(-6px) scale(.97, 1.04)', offset: .92 }, { transform: 'none' }], { duration: 560, easing: 'cubic-bezier(.45,.05,.7,1)' });
      if (skipped) throw 0;
      G.audio.sfx('land'); G.audio.sfx('thunk'); haptic('tick');
      { const r = front.getBoundingClientRect(); W.fx.burst(r.left + r.width / 2, r.bottom - 6, { n: 16, shape: 'circle', colors: ['#ffffff', '#f3e6d6', '#e9d6c0'], speed: 220, up: 20, gravity: 300, size: 10, life: .5 }); }
      // the friend's line now, while the box sits still (스토리 룸: a bubble during the shaking goes unread) — in from the side
      if (cut) {
        await A(cut, [{ transform: 'translateX(-115%) rotate(-6deg)' }, { transform: 'translateX(4%) rotate(1deg)', offset: .75 }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.9,.3,1)' });
        if (skipped) throw 0;
        await wait(1800); if (skipped) throw 0;
        A(cut, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-115%)', opacity: 0 }], { duration: 260, easing: 'ease-in' });
      } else await wait(300);
      if (skipped) throw 0;
      // 덜컹… 덜컹덜컹… something's moving in there, each shake a bit bigger (no sound words on screen — 스토리 룸)
      for (const [amp, n, gap, peek] of [[3, 2, 320, 0], [5, 3, 260, 0], [8, 4, 0, 1]]) {
        const kf = [{ transform: 'none' }]; for (let i = 0; i < n; i++) kf.push({ transform: `translateY(${-amp}px) rotate(${(i % 2 ? 1 : -1) * amp * .7}deg)` }, { transform: 'none' });
        G.audio.sfx('thunk'); haptic('tick');
        await A(box, kf, { duration: 80 * n * 2, easing: 'ease-in-out' }); if (skipped) throw 0;
        if (peek) {
          // …the lid lifts a crack, two little robot eyes blink in the dark — and duck back in (스토리 룸's idea: the parts are
          // alive, and up to mischief — so "다 숨어 버렸네" needs no more words)
          // (inside the box, just behind its front wall: they show only in the gap under the lifted lid)
          const eyes = h('div', { class: 'kiteyes' }, h('i'), h('i')), at = h('div', { class: 'kb3-eyes' }, eyes);
          cube.append(at); outs.push(at);
          A(lid, [{ transform: KB3_LID }, { transform: KB3_PEEK, offset: .2 }, { transform: KB3_PEEK, offset: .8 }, { transform: KB3_LID }], { duration: 900, easing: 'ease-in-out' });
          A(eyes, [{ opacity: 0, transform: 'translate(-50%,-30%) scale(.3)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .25 }, { opacity: 1, transform: 'translate(-50%,-50%) scaleY(.15)', offset: .45 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .55 }, { opacity: 1, transform: 'translate(-30%,-50%) scale(1)', offset: .7 }, { opacity: 0, transform: 'translate(-30%,-10%) scale(.4)' }], { duration: 900, easing: 'ease-in-out' });
          G.audio.sfx('giggle'); await wait(950); at.remove(); if (skipped) throw 0;
          G.audio.sfx('thunk'); await A(box, [{ transform: 'none' }, { transform: 'translateY(-10px) rotate(-5deg)' }, { transform: 'none' }], { duration: 200, easing: 'ease-out' }); if (skipped) throw 0;
        }
        await wait(gap); if (skipped) throw 0;
      }
      // light leaks round the lid, and the box swells like a heartbeat (두근, 두근)
      A(glowEl, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: .95, transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
      for (let i = 0; i < 2; i++) {
        G.audio.sfx('heart'); haptic('tick');
        await A(cube, [{ transform: KB3_VIEW }, { transform: KB3_VIEW + ' scale3d(1.08,1.08,1.08)', offset: .35 }, { transform: KB3_VIEW }], { duration: 260, easing: 'ease-out' });
        if (skipped) throw 0;
        await wait(70);
      }
    } else {
      await A(box, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 200, easing: 'cubic-bezier(.2,1.6,.4,1)' });
      if (skipped) throw 0;
    }
    // 펑! the lid bursts off (a white flash, a comic burst), light pours out
    G.audio.sfx('special'); G.audio.sfx('pop', 6); haptic('ok');
    const b0 = br(), lt = box.querySelector('.kb3-ltop').getBoundingClientRect(), mouth = { x: lt.left + lt.width / 2, y: lt.top + lt.height / 2 };
    if (!quick) {
      const fl = h('div', { class: 'kitflash' }); col.append(fl); outs.push(fl); A(fl, [{ opacity: .85 }, { opacity: 0 }], { duration: 260, easing: 'ease-out' });
      const bang = h('div', { class: 'kitbang', style: `left:${mouth.x - col.getBoundingClientRect().left}px;top:${mouth.y - col.getBoundingClientRect().top}px` }); col.append(bang); outs.push(bang);
      A(bang, [{ transform: 'translate(-50%,-50%) scale(.2) rotate(0)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.15) rotate(12deg)', opacity: 1, offset: .5 }, { transform: 'translate(-50%,-50%) scale(1.3) rotate(16deg)', opacity: 0 }], { duration: 520, easing: 'ease-out' });
    }
    W.fx.burst(mouth.x, mouth.y, { n: 26, shape: 'star', colors: ['#ffe14d', '#ffffff', '#8fd3f4', '#ff8fb8'], speed: 340, life: .6, size: 11 });
    // (the lid flies up and off the screen — no fading: a 3D group fading flattens into a plane)
    A(lid, [{ transform: KB3_LID }, { transform: 'translate3d(0,-120px,0) rotateX(16deg) rotateZ(-8deg)', offset: .35 }, { transform: 'translate3d(240px,-760px,0) rotateX(40deg) rotateZ(-44deg)' }], { duration: quick ? 320 : 560, easing: 'cubic-bezier(.3,.1,.6,1)' });
    box.classList.add('open');   // (light inside)
    A(glowEl, [{ opacity: .95, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1.5)' }], { duration: 300, easing: 'ease-out' });
    await wait(quick ? 120 : 240);
    if (skipped) throw 0;
    // the runner rises out of it into the middle of the screen; the box goes; the view eases back out to the whole room
    const cr = card.getBoundingClientRect(), cc = col.getBoundingClientRect(), dy = (innerHeight * .42) - (cr.top + cr.height / 2), dyB = (b0.top + b0.height * .42) - (cr.top + cr.height / 2);
    card.style.visibility = '';
    G.audio.sfx('swish');
    A(box, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(40px) scale(.9)', opacity: 0 }], { duration: 380, easing: 'ease-in' });
    // (the card is full width: it rises no bigger than its own size, or it runs off the screen)
    await A(card, [{ transform: `translateX(-50%) translateY(${dyB + 20}px) scale(.55)`, opacity: 0 }, { transform: `translateX(-50%) translateY(${dy - 10}px) scale(1.03)`, opacity: 1, offset: .7 }, { transform: `translateX(-50%) translateY(${dy}px) scale(1)`, opacity: 1 }], { duration: quick ? 280 : 480, easing: 'cubic-bezier(.2,.9,.3,1)' });
    if (skipped) throw 0;
    if (!quick) { lay.classList.add('calm'); await wait(450); if (skipped) throw 0; }   // (the comic panel fades: the room shows again for the hiding)
    // the pieces snap off the runner one by one and fly to where they hide — the piece shows there as it lands (쏙)
    const order = cells.slice(), byKey = new Map(its.map(t => [t.kitPart, t]));
    const lands = [];
    for (let i = 0; i < order.length; i++) {
      const c = order[i], it = byKey.get(c.dataset.p), r = c.getBoundingClientRect(), x0 = r.left + r.width / 2 - cc.left, y0 = r.top + r.height / 2 - cc.top;
      const img = h('img', { class: 'kitfly', src: c.querySelector('.kitrun-pc').src, style: `left:${x0 - 30}px;top:${y0 - 30}px` });
      col.append(img); outs.push(img);
      c.classList.remove('full'); c.classList.add('pop');
      G.audio.sfx('pop', 4 + i);
      let wp = it ? new THREE.Box3().setFromObject(it.g).getCenter(new THREE.Vector3()) : null;
      const sp = wp ? W.toScreen(wp) : { x: cc.left + cc.width * (.2 + .6 * Math.random()), y: cc.top + cc.height * .35 };
      const tx = sp.x - cc.left - x0, ty = sp.y - cc.top - y0, up = 110 + Math.min(120, Math.abs(tx) * .3);
      const dur = quick ? 360 : 520;
      lands.push(A(img, [{ transform: 'translate(0,0) scale(1) rotate(0)' }, { transform: `translate(${tx * .5}px,${ty * .5 - up}px) scale(1.15) rotate(${i % 2 ? 160 : -160}deg)`, offset: .5 },
        { transform: `translate(${tx}px,${ty}px) scale(.35) rotate(${i % 2 ? 320 : -320}deg)`, opacity: .9 }], { duration: dur, easing: 'cubic-bezier(.35,.2,.45,1)' }).then(() => {
        img.remove();
        if (it && !skipped) {
          it.g.visible = vis0.get(it); W.idsDirty = true;
          const g = it.g, s1 = s0.get(it);
          S.tw.run(.28, k => g.scale.copy(s1).multiplyScalar(.3 + .7 * ease.outBack(k)), ease.linear).then(() => g.scale.copy(s1));
          W.fx.burst(sp.x, sp.y, { n: 9, shape: 'circle', colors: ['#ffffff', '#f3ecff', '#ffe9c9'], speed: 130, up: 30, size: 7, life: .35 });
          G.audio.sfx('tock', 2 + i); haptic('tick');
        }
      }));
      await wait(quick ? 50 : 140);   // 착, 착, 착
      if (skipped) throw 0;
    }
    await Promise.all(lands);
    if (skipped) throw 0;
    await wait(quick ? 120 : 260);
    // the runner, empty now, down into its place
    await A(card, [{ transform: `translateX(-50%) translateY(${dy}px) scale(1)` }, { transform: 'translateX(-50%)' }], { duration: quick ? 260 : 380, easing: 'cubic-bezier(.16,1,.3,1)' });
  } catch {}
  box.style.visibility = 'hidden';   // (before the cancels: cancelling its fade-out would flash it back)
  for (const a of anims) { try { a.cancel(); } catch {} }
  outs.forEach(o => o.remove());
  its.forEach(t => { t.g.visible = vis0.get(t); t.g.scale.copy(s0.get(t)); }); W.idsDirty = true;
  if (skipped) { bub?.kill?.(); W.flyTo(S.tw, { ...v0, cut: true }); }
  W.camLock = false;
  cells.forEach(c => c.classList.remove('full', 'pop'));
  card.style.visibility = ''; card.style.zIndex = '';
  lay.removeEventListener('pointerdown', skip); card.removeEventListener('pointerdown', skip);
  lay.classList.add('out'); setTimeout(() => lay.remove(), 260);
  if (S.kit.hid && !S.dead) S.say(f, S.kit.hid, 2600);   // "어? 부품이 다 숨어 버렸네. 설계도 보고 같이 찾자!"
}

// ── where it's built: an open tile the view sees whole (feet, middle, head and both sides), with room either side for the
// friend and 몽글이 to stand and watch; front tiles and tiles near the friend win ties. The view may turn up to 90° for
// one (an orthographic view: whether something is in the way depends on the angle only, not on where the camera looks).
const SIDE = .86;   // (the build's close view: whoever watches stands clear of the robot)
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
      for (const b of boxes) if (ray.intersectBox(b, hitP) && Math.abs(hitP.distanceTo(ray.origin) - 20) < 1.6) { n += h < 0 ? 2 : 1; break; }   // (in front: on screen between the robot and the board)
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
      const front = !t.R?.clearAt || t.R.clearAt(t.x + toCam.x * .6, t.z + toCam.z * .6, .34);
      const score = (room(1) ? 2 : 0) + (room(-1) ? 2 : 0) + (t.R?.clearAt?.(t.x, t.z, .7) ? 1 : 0) - c * 1.1 - (front ? 0 : 6)
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

// ── the build (on the last piece, before the result panel; stage.js win) — user 10/19 on the phone: "그림자로 하지 말고
// 레퍼런스처럼 해 줘. 프라모델 느낌으로", then "ui 디자인을 저렇게 연결된 프라모델 모양으로... ui에서 클릭하면 맞춰지게 하는게 낫지않나"
// (and "근데 로봇 조립은 괜찮네" — the build itself stays): no see-through ghost; the runner card unfolds into a big board at
// the bottom, every found piece in its window on its gates. Tap the next number: the nippers snip it off (톡), it flies up
// to the robot standing on its little work mat and clicks on (딸깍). Out of turn it hops in its window and the friend says
// so once; nothing is lost, no tap spent. A small manual card (top right) shows the step.
const GHOST = '#8fd0ff';
export async function kitBuild(S) {
  const G = S.G, W = G.world, tw = S.tw, K = KITS[S.kit.kit], B = K.build || {}, f = S.friend, card = S.tray, cells = S.kitCells;
  const st = S.kitState = { phase: 'build', placed: 0, total: K.order.length, drops: 0, taps: 0 };
  W.camLock = true;
  const off = [], flying = [];
  let manual = null, hand = null;
  try {
    card?.classList.add('done');
    await tw.wait(.3); if (S.dead) return;
    const { p: P, yaw, pitch, tile } = buildSpot(S);
    f.setFace('wow'); f.bump?.(.4);
    const goBub = S.say(f, S.kit.go || KIT_GO[K.id] || '다 모았다!', 1600); G.audio.sfx('special');
    // the view: the robot's middle a third of the way down (the runner board takes the lower part of the screen). (The view
    // zooms about its frustum's middle, not its target — world.js applyFrustum cy — so the target is set where it lands.)
    const gs = S.room.group.getWorldScale(new THREE.Vector3()).y;
    const vh = W.viewH || 11, zoom = Math.max(1.5, Math.min(8, vh / 1.85)), cy = W.fit?.cy ?? .46, atT = .5 + (cy - .5) * zoom;
    const tY = P.y + .36 * RS * gs - (atT - .3) * (vh / zoom) / Math.max(.3, Math.cos(pitch));   // (closer: the robot big above the board)
    card?.classList.remove('done');
    const side = S.col?.querySelector('.side'); if (side) { side.style.visibility = 'hidden'; off.push(() => { side.style.visibility = ''; }); }   // (the hint button: nothing to look for now, and the board is wide)
    if (card) { card.classList.add('build'); card.animate([{ transform: 'translateX(-50%) translateY(30px) scale(.92)', opacity: .6 }, { transform: 'translateX(-50%)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,1.4,.4,1)' }); }
    Object.values(cells).forEach(c => c.classList.add('ready'));
    await Promise.all([W.flyTo(tw, { target: new THREE.Vector3(P.x, tY, P.z), yaw, pitch, zoom, dur: .7, e: ease.inOutCubic }), gather(S, P, tile?.R, yaw)]);
    if (S.dead) return;
    f.faceTo?.(P.x, P.z); S.hero?.ch?.faceTo?.(P.x, P.z);
    const face = Math.atan2(W.cam.position.x - P.x, W.cam.position.z - P.z), local = v => S.room.group.worldToLocal(v.clone());
    // a little green work mat under the robot
    const mat = buildMat(.82, .62); mat.position.copy(local(P)); mat.rotation.y = face; S.room.group.add(mat);
    // the model: a group at the spot, facing the camera; one pivot per piece, at the piece's joint
    const R = new THREE.Group(); R.position.copy(local(P)); R.position.y += .013; R.rotation.y = face; R.scale.setScalar(RS);
    const sh = blobShadow(.2, .3); sh.scale.set(.42, .42, 1); R.add(sh);
    S.room.group.add(R); R.updateMatrixWorld(true);
    S.kitModel = R;
    const glow = buildKitGlow(K.id); glow.g.visible = false;
    const pcs = {};
    for (const key of K.order) {
      const J = new THREE.Vector3(...K.parts[key].joint), C = new THREE.Box3().setFromObject(buildKitPart(K.id, key)).getCenter(new THREE.Vector3());
      let ghost = null, gm = null;
      if (B.ghost) {   // (a kit may still want the see-through model — off for the robot: the user didn't like it)
        ghost = buildKitPart(K.id, key); gm = new THREE.MeshBasicMaterial({ color: GHOST, transparent: true, opacity: .32, depthWrite: false });
        ghost.traverse(o => { if (o.isMesh) { o.material = gm; o.castShadow = false; o.renderOrder = 2; } }); R.add(ghost);
      }
      pcs[key] = { key, J, C, ghost, mat: gm, pv: null, done: false, busy: false };
    }
    W.idsDirty = true; W.shadowDirty = true;
    G.audio.sfx('swish');
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
    const scrOf = v => W.toScreen(R.localToWorld(v.clone()));
    const hpx = Math.abs(scrOf(new THREE.Vector3(0, 0, 0)).y - scrOf(new THREE.Vector3(0, .7, 0)).y);   // the model's height on screen
    let squash = 0, lastAct = performance.now();
    const hideHand = () => { hand?.remove(); hand = null; };
    // 순서 맞추기 (user 10/19): the runner's numbers are the order, like a kit's instructions; ?kitorder=0 tries any order
    const qOrd = /[?&]kitorder=([01])(&|$)/.exec(location.search);
    const ordered = qOrd ? qOrd[1] === '1' : B.ordered !== false;
    st.ordered = ordered;
    const nextKey = () => K.order.find(k => !pcs[k].done && !pcs[k].busy) || null;
    const okNow = c => !ordered || (c.key === K.order.find(k => !pcs[k].done) && !Object.values(pcs).some(q => q.busy && q !== c && !q.done));
    const pic = k => cells[k]?.querySelector('.kitrun-pc')?.src || '';
    if (ordered) {
      manual = h('div', { class: 'kitmanual' }, h('div', { class: 'kitmanual-n ol' }, '1'), h('img', { src: pic(K.order[0]), alt: '' }), h('i', { class: 'kitmanual-arrow' }));
      S.col.append(manual);
    }
    const markNext = () => {
      const n = nextKey();
      if (ordered && B.glow !== false) for (const k in cells) cells[k].classList.toggle('next', k === n);
      if (manual && n) { manual.querySelector('.kitmanual-n').textContent = String(K.order.indexOf(n) + 1); manual.querySelector('img').src = pic(n); manual.classList.remove('flip'); void manual.offsetWidth; manual.classList.add('flip'); }
    };
    const wrongOnce = () => { st.drops++; G.audio.sfx('wobble'); if (st.drops === 1 && S.kit.wrong) { goBub?.kill?.(); S.say(f, S.kit.wrong, 1600); } };   // (one bubble at a time)
    // the nippers: a little pair closing on a gate, a white snip
    const nip = (x, y) => {
      const el = h('div', { class: 'kitnip', style: `left:${x}px;top:${y}px`, html: NIP_SVG });
      document.getElementById('app').append(el); setTimeout(() => el.remove(), 420);
      W.fx.burst(x, y, { n: 10, shape: 'star', colors: ['#ffffff', '#fff3a0'], speed: 170, life: .3, size: 7 });
    };
    // click! into place: the 3D piece appears where it goes, a little big, and settles in
    const snap = c => {
      c.pv = makePiece(c.key); c.pv.position.copy(c.J);
      tw.run(.22, k => c.pv.scale.setScalar(1.3 - .3 * ease.outBack(k)), ease.linear).then(() => c.pv && c.pv.scale.setScalar(1));
      c.done = true; c.busy = false; st.placed++;
      if (c.ghost) c.ghost.visible = false; squash = 1;
      G.audio.sfx('latch'); G.audio.sfx('pop', 3 + st.placed); haptic('ok');
      const s = scrOf(c.C); W.fx.burst(s.x, s.y, { n: 16, shape: 'star', colors: ['#ffe14d', '#ffffff', '#8fd3f4'], speed: 260, gravity: 0, life: .45, size: 11 });
      W.fx.ring(s.x, s.y, { r: 60, color: '#ffffff', width: 7, life: .3 });
      if (st.placed === st.total) G.hitstop(.07);
      markNext();
    };
    // a tap on a piece in the board (or the bot, or QA): snip, it flies up to the robot, click
    const place = c => {
      if (!c || c.done || c.busy) return;
      st.taps++; lastAct = performance.now(); hideHand();
      const el = cells[c.key];
      if (!okNow(c)) { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); wrongOnce(); return; }
      c.busy = true;
      const r = el.getBoundingClientRect(), x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
      nip(r.left + r.width * .1, y0); G.audio.sfx('tap'); haptic('tick');
      el.classList.remove('ready', 'next'); el.classList.add('used');   // (the window empty, two cut stubs)
      const t = scrOf(c.C), size = Math.max(56, Math.min(120, hpx * .42)), img = h('img', { class: 'kitfly', src: pic(c.key), style: `left:${x0 - size / 2}px;top:${y0 - size / 2}px;width:${size}px;height:${size}px` });
      document.getElementById('app').append(img); flying.push(img);
      const dx = t.x - x0, dy = t.y - y0;
      img.animate([{ transform: 'translate(0,0) scale(.8) rotate(0)' }, { transform: `translate(${dx * .4}px,${dy * .55 - 60}px) scale(1.25) rotate(-12deg)`, offset: .45 }, { transform: `translate(${dx}px,${dy}px) scale(1) rotate(0)` }],
        { duration: 430, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'forwards' }).finished.catch(() => {}).then(() => { img.remove(); if (!S.dead) snap(c); });
    };
    for (const k of K.order) {
      const el = cells[k], up = e => { e.stopPropagation(); place(pcs[k]); };
      el.addEventListener('click', up); off.push(() => el.removeEventListener('click', up));
    }
    markNext();
    S.kitAuto = async () => { for (const k of K.order) { if (!pcs[k].done) { place(pcs[k]); await tw.wait(.55); } } };   // (QA)
    S.kitTapCell = k => { cells[k]?.click(); return k; };   // (QA: a tap on that piece in the board)
    // the frame loop: the model squashes on each click, a hint hand after a while with nothing done
    let last = performance.now(), botT = 0;
    while (!S.dead && st.placed < st.total) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
      W.lastActive = now;   // full frame rate on phones while it plays
      squash = Math.max(0, squash - dt / .16);
      const sq = Math.sin(squash * Math.PI) * .08;
      R.scale.set(RS * (1 + sq * .5), RS * (1 - sq), RS * (1 + sq * .5));
      // nothing done for a while: a hand taps the next piece on the board, no words
      if (!hand && now - lastAct > 2600 && !S.botOn()) {
        const k = (ordered ? nextKey() : null) || K.order.find(q => !pcs[q].done && !pcs[q].busy);
        if (k) { const r = cells[k].getBoundingClientRect(); hand = h('div', { class: 'hand tap', html: ICON.hand, style: `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px` }); G.ui.tut.append(hand); }
      }
      if (S.botOn() && (botT += dt) > .45) { botT = 0; const k = ordered ? nextKey() : K.order.find(q => !pcs[q].done && !pcs[q].busy); if (k && okNow(pcs[k])) place(pcs[k]); }
    }
    hideHand(); manual?.remove(); manual = null;
    off.forEach(fn => fn()); off.length = 0;
    if (S.dead) return;
    card?.classList.remove('build'); card?.classList.add('gone');
    await tw.wait(.25); if (S.dead) return;
    st.phase = 'alive';
    await comeAlive(S, R, pcs, glow, P);
    // back out to the room's first view (as '처음 시점'), so the win's close-up on the friend starts from the room: from the
    // build's angle — picked for the robot — it landed behind a pot plant (8판, QA 10/19)
    if (!S.dead) { const v = S.view0 || { yaw: Math.PI / 4, pitch: .62 }; await W.flyTo(tw, { zoom: v.zoom || 1, target: W.home, yaw: v.yaw, pitch: v.pitch, dur: .5, e: ease.inOutCubic }); }
  } finally { off.forEach(fn => fn()); flying.forEach(i => i.remove()); hand?.remove(); manual?.remove(); W.camLock = false; }
}
const NIP_SVG = '<svg viewBox="0 0 64 64"><path d="M30 34 L12 58 Q8 62 13 62 L33 38 Z" fill="#ff8fb8" stroke="#3a2453" stroke-width="4" stroke-linejoin="round"/><path d="M34 34 L52 58 Q56 62 51 62 L31 38 Z" fill="#ff8fb8" stroke="#3a2453" stroke-width="4" stroke-linejoin="round"/><g class="jaw"><path d="M29 36 L26 8 Q32 4 33 12 L33 36 Z" fill="#cfd6e6" stroke="#3a2453" stroke-width="4" stroke-linejoin="round"/></g><g class="jaw2"><path d="M35 36 L38 8 Q32 4 31 12 L31 36 Z" fill="#e6ebf5" stroke="#3a2453" stroke-width="4" stroke-linejoin="round"/></g><circle cx="32" cy="36" r="4" fill="#ffe14d" stroke="#3a2453" stroke-width="3"/></svg>';
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

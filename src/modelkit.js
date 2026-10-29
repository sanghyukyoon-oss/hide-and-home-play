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
import { playDialog } from './story.js';
import { keepsake, FREE_KITS } from './econ.js';   // 선물은 아주 가끔: only the robot comes home free (10/20)

// one entry per playable kit stage in 놀이 모음 (listed there as levels)
export const MODEL_STAGES = {
  robot: { kit: 'robot', room: 'study', friend: 'nerd', title: '박사님의 프라모델', goal: '로봇 부품 6개를 모아 조립하자!',
    hello: '흠. 로봇 부품이 다 흩어졌어.', go: '다 모았다! 조립 시작!', wrong: '흠, 거기가 아니군.', cheer: '흠! 완벽한 조립이군!' },
};
// the line said when the last piece is found, before the build (campaign: 스토리 룸's script.js KIT_TALK when it has one)
export const KIT_GO = { robot: '다 모았다! 이번엔 끝까지 맞추자.', cattower: '다 모았다! 이제 쌓아 보자!', firetruck: '다 모았다! 출동 준비!' };
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
    const ok = s => s.kind === 'on' && !s.part && !s.reserved && !s.wallFace && !spec.avoid?.(s) && !usedF.has(furnOf(s)) && fits(p.type, s) && (!taken.get(s) || taken.get(s).role === 'decoy');   // (only an empty place or a decoy's: a password note moved off for a piece left 19판's code lock with no way to open it — QA 10/20)
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
  // the card's look: the kit's own — or ?kitskin= to compare (10/20: 13판's moving things got the robot's plastic runner, user:
  // "이삿짐 풀기 UI는 왜 또 프라모델로 한 거야? 의미가 있어?" — 'list' a kraft checklist, 'labels' little labelled boxes)
  const skin = /[?&]kitskin=(runner|list|labels|tray)(&|$)/.exec(location.search)?.[1] || K.skin || 'runner', framed = !!K.frame && skin === 'runner';
  const cells = {};
  // one rule for every card of things to find (level session 10/20; user: "8개인데 어떤 판은 1×8, 어떤 판은 2×4"): 8 or more cells
  // make two rows, the top one the larger half — a skin with its own grid keeps it
  const nC = K.order.length >= 8 ? Math.ceil(K.order.length / 2) : K.order.length;
  const row = h('div', { class: 'kitrun-row', style: `--n:${nC}` });
  // a runner's windows aren't all one size (user 10/19: "너무 다 균등해서… 이런느낌으로", sprue-frame references): the big piece
  // in a big window, the arms in tall thin ones — KITS[kit].frame gives the grid's areas and its columns
  if (framed) {
    row.classList.add('framed');
    row.style.gridTemplateAreas = K.frame.areas.map(a => `"${a}"`).join(' ');
    row.style.setProperty('--cols', K.frame.cols.map(c => c + 'fr').join(' '));
  }
  K.order.forEach((p, i) => {
    const src = G.thumbs[key(p)];
    const c = h('div', { class: 'kitrun-cell' },
      h('i', { class: 'kitrun-gate l' }), h('i', { class: 'kitrun-gate r' }), h('i', { class: 'kitrun-box' }),
      h('img', { class: 'kitrun-ghost', src, alt: '' }), h('img', { class: 'kitrun-pc', src, alt: '' }),
      h('span', { class: 'kitrun-no' }, String(i + 1)), h('span', { class: 'kitrun-nm' }, K.short?.[p] || (skin === 'list' ? ITEMS[kitItem(kit, p)]?.name || '' : '')),
      h('i', { class: 'kitrun-chk' }), h('b', { class: 'kitrun-stamp' }, '완료'), h('i', { class: 'kitrun-q' }, '?'));   // (a checklist's tick box, a label's stamp, the '?' of the one under the pile)
    if (K.pile?.item === p) c.classList.add('mystery');   // ("다 찾으면 하나 더" — 레벨 세션)
    c.dataset.p = p; if (framed) c.style.gridArea = p; cells[p] = c;
  });
  // (K.show: the tray's cells in another order than the build's — 11판 캣타워 10/29, user "1234567 순서대로라 너무 뻔함": the numbers stay
  // the build steps, the boxes just aren't lined up in them)
  for (const p of K.show || K.order) row.append(cells[p]);
  // (a frame's windows aren't square: each picture is trimmed to its piece, so a thin arm fills its thin window; a list's or a
  // label's small picture too, so the thing is as big as it can be)
  if (framed || skin === 'list' || skin === 'labels' || skin === 'tray') for (const p of K.order) trimPic(G, key(p)).then(src => { if (src) cells[p].querySelectorAll('img').forEach(im => { im.src = src; }); });
  const byType = Object.fromEntries(K.order.map(p => [kitItem(kit, p), p]));
  const tag = h('div', { class: 'kitrun-tag ol', style: `background:${K.color}` }, K.name);
  for (const it of S.targets) if (byType[it.type]) { it.kitPart = byType[it.type]; it.slot = cells[it.kitPart]; } else it.slot = tag;   // (anything else flies to the tag)
  S.kitCells = cells; S.kitPic = key;
  if (K.boxArt) { const im = new Image(); im.decoding = 'async'; im.src = K.boxArt; S.kitArt = im; }   // (the box's lid picture, ready before the box drops)
  return h('div', { class: `kitrun skin-${skin}${K.numbers === false ? ' nonum' : ''}`, style: `--run:${K.runner};--runsh:${K.color}` }, tag, row);
}

// ── the stage set up for the kit (stage.js, once the room and the things are in): 이삿짐's boxes about the room, the
// big parfait beside its owner
export function kitSetup(S) {
  const K = KITS[S.kit.kit], W = S.G.world, rnd = rng((S.spec.seed || 1) + 23);
  // (not where anyone stands: a box set down on a walker's tile had 식빵 inside it all stage — 겹침 QA 10/20; and each tile used
  // goes out of the walkers' list, S.blockTile)
  const near = S.bodies ? S.bodies() : [];
  // (and not on the look's own fill — a plant, a sign: 34판's big parfait stood inside the café's monstera, ⑥ 10/24)
  const fills = (S.look?.filled || []).filter(g => g.parent).map(g => g.getWorldPosition(new THREE.Vector3()));
  const tiles = (S.freeTiles || []).filter(t => (!t.R?.clearAt || t.R.clearAt(t.x, t.z, .3)) && !near.some(p => Math.hypot(p.x - t.x, p.z - t.z) < .7) && !fills.some(p => Math.hypot(p.x - t.x, p.z - t.z) < .6));
  const at = (t, o) => { const P = new THREE.Vector3(t.x, t.y || 0, t.z); o.position.copy(S.room.group.worldToLocal(P)); S.room.group.add(o); };
  if (K.type === 'place' && K.pile) { buildPile(S, K, tiles, near); return; }
  if (K.type === 'place') {
    // a box for every thing, on free floor (the ones nearest the walls first: the middle stays clear to walk)
    const far = tiles.slice().sort((a, b) => Math.hypot(b.x - (S.room.center?.x || 0), b.z - (S.room.center?.z || 0)) - Math.hypot(a.x - (S.room.center?.x || 0), a.z - (S.room.center?.z || 0)));
    S.kitBoxes = [];
    for (let i = 0; i < K.order.length && far.length; i++) {
      const t = far.splice(Math.floor(rnd() * Math.min(4, far.length)), 1)[0];
      const b = buildMoveBox(i); b.scale.setScalar(1.3); b.rotation.y = (rnd() - .5) * .9; at(t, b);
      const tw = Math.random() < .5 && i > 0 && S.kitBoxes.length ? S.kitBoxes[S.kitBoxes.length - 1] : null;   // (some stacked two high)
      if (tw && rnd() < .4) { b.position.copy(tw.position); b.position.y += (.26 + (i % 2) * .05) * 1.3; b.rotation.y += .4; }
      else S.blockTile?.(t);
      S.kitBoxes.push(b);
    }
    W.idsDirty = true; W.shadowDirty = true;
  } else if (K.type === 'stack') {
    // the big parfait: on a clear tile near its owner, facing the view
    const f = S.friend.root.position, t = tiles.slice().sort((a, b) => Math.hypot(a.x - f.x, a.z - f.z) - Math.hypot(b.x - f.x, b.z - f.z)).find(q => Math.hypot(q.x - f.x, q.z - f.z) > .5) || tiles[0];
    if (t) {
      const p = buildParfait(); p.g.scale.setScalar(1.45); at(t, p.g); S.blockTile?.(t);
      p.g.rotation.y = Math.atan2(W.cam.position.x - t.x, W.cam.position.z - t.z);
      S.kitParfait = p; W.idsDirty = true; W.shadowDirty = true;
    }
  }
}

// ── 13판 이삿짐 (10/20, user: "박스를 어디 눈에 보이는 곳에 적재하듯 몇 층으로 쌓아 놓고 하나 찾을 때마다 없어지게 하고, 다 없어지면
// 숨겨진 거 찾을 수 있게"; 레벨 세션: 6 boxes = the 6 to find first, the 7th under the pile): one tidy pile of moving boxes, 3
// across and 2 high, on two free floor tiles the start view sees — away from anything that opens (0.8 m), off where anyone
// stands, no decoy on it or beside it. The 7th thing waits under it, out of sight (and out of the hints and the bot) till
// the last box goes. The truck's opening drops the boxes onto it one by one.
function buildPile(S, K, tiles, near) {
  const G = S.G, W = G.world, R = S.room, P0 = K.pile;
  const side = new THREE.Vector3(Math.cos(W.yaw), 0, -Math.sin(W.yaw)), toCam = new THREE.Vector3(Math.sin(W.yaw), 0, Math.cos(W.yaw));
  const opens = (R.parts || []).map(p => { try { return S.partCenter(p); } catch { return null; } }).filter(Boolean);
  const free = new Set(tiles), key = t => `${Math.round(t.x * 2)},${Math.round(t.z * 2)}`, byKey = new Map(tiles.map(t => [key(t), t]));
  const seen = q => { const sc = W.toScreen(q); const hit = W.pick(sc.x, sc.y, [R.group]).find(x => !x.object.userData.proxy); return !hit || hit.distance > W.raycaster.ray.origin.distanceTo(q) - .15; };
  const rc = R.center || new THREE.Vector3(), look = W.cam.getWorldDirection(new THREE.Vector3());   // (an orthographic view: every sight line runs this way)
  // (13판 2차 10/21, user: "상자 쌓인게 지금보다 훨씬 높게 많이 쌓여서 티가 확 나게 … 넓고 많게"): a big pile now — on 2×2 free
  // tiles if there are (4 across, 3 deep), else 3 in a row (6 across, 2 deep), else 2 (4 across, 2 deep); stacks up to 5 high at the back, lower to the front
  // (it steps down towards you, so its own front never hides its back), every stack its own height. Where it goes: the start
  // view sees it, and it hides none of the things to find from the start view (a ray to each one past the pile's box)
  const others = (S.targets || []).filter(t => t.g && !(P0 && t.type === kitItem(K.id, P0.item)));
  const blocks = (c, ax, fw, fd, hgt) => {
    const hx = fw / 2, hz = fd / 2, ex = Math.abs(ax[0]) * hx + Math.abs(ax[1]) * hz, ez = Math.abs(ax[1]) * hx + Math.abs(ax[0]) * hz;
    const box = new THREE.Box3(new THREE.Vector3(c.x - ex, c.y, c.z - ez), new THREE.Vector3(c.x + ex, c.y + hgt, c.z + ez));
    let n = 0; const ray = new THREE.Ray(), hit = new THREE.Vector3();
    const hides = q => { const o = q.clone().addScaledVector(look, -40); ray.set(o, look); return ray.intersectBox(box, hit) && hit.distanceTo(o) < 39.95; };
    for (const t of others) { const q = t.g.getWorldPosition(new THREE.Vector3()); if (box.containsPoint(q) || hides(q)) n++; }
    if (S.friend?.root && hides(S.friend.root.getWorldPosition(new THREE.Vector3()).setY(c.y + .4))) n += .5;
    return n;
  };
  let best = null;
  // (user 10/21 "이삿짐박스는 ㅈㄴ 높게 넓게"): the widest place wins — 3×2, 2×2, then a row of 6 down to 2 along the edge —
  // as long as it hides next to nothing from the start view; out by the room's edge rather than in the middle
  for (const [fw, fd] of [[3, 2], [2, 2], [6, 1], [5, 1], [4, 1], [3, 1], [2, 1]]) {
    const big = fw * fd > 2;
    for (const t of tiles) for (const ax of [[1, 0], [0, 1]]) {
      const pr = [ax[1], ax[0]], at = (u, v) => byKey.get(key({ x: t.x + ax[0] * u + pr[0] * v, z: t.z + ax[1] * u + pr[1] * v }));
      const set = []; for (let u = 0; u < fw; u++) for (let v = 0; v < fd; v++) set.push(at(u, v));
      if (set.some(q => !q || !free.has(q))) continue;
      const c = new THREE.Vector3(set.reduce((s, q) => s + q.x, 0) / set.length, t.y || 0, set.reduce((s, q) => s + q.z, 0) / set.length);
      if (near.some(p => set.some(q => Math.hypot(p.x - q.x, p.z - q.z) < .75))) continue;
      if (opens.some(o => set.some(q => Math.hypot(o.x - q.x, o.z - q.z) < .8))) continue;
      if (![[0, .2], [0, .7], [-.5, .4], [.5, .4]].every(([k, y]) => seen(c.clone().add(new THREE.Vector3(ax[0] * k, y, ax[1] * k))))) continue;
      const hid = blocks(c, ax, fw, fd, 2.3);
      if (hid > 1) continue;
      const frontal = Math.abs(ax[0] * side.x + ax[1] * side.z);   // (the long side to the view)
      const score = fw * fd * 1.4 + Math.hypot(c.x - rc.x, c.z - rc.z) * .5 + frontal * 1.2 - hid * 4;
      if (!best || score > best.score) best = { c, ax, set, big, fw, fd, score, hid };
    }
  }
  if (!best) { const t = tiles[0]; if (!t) return; best = { c: new THREE.Vector3(t.x, t.y || 0, t.z), ax: [1, 0], set: [t], big: false, fw: 1, fd: 1 }; }
  best.set.forEach(q => S.blockTile?.(q));
  // the pile: its boxes' fronts to the view, the long way along the tiles
  const g = new THREE.Group(); g.position.copy(R.group.worldToLocal(best.c.clone()));
  const along = Math.atan2(-best.ax[1], best.ax[0]); g.rotation.y = along;
  const fwd = new THREE.Vector3(Math.sin(along), 0, Math.cos(along)); if (fwd.dot(toCam) < 0) g.rotation.y += Math.PI;
  R.group.add(g);
  // big boxes at the bottom, smaller going up; the back rows tallest (it steps down to you); the top one of a stack often
  // askew; every stack its own height
  const r = rng(K.id.length * 977 + 13), boxes = [], cols = Math.max(2, Math.round(best.fw * 2)), deep = best.fd > 1 ? 4 : 2, px = best.fw / cols, pz = best.fd > 1 ? .48 : .48;
  for (let d = 0; d < deep; d++) for (let c = 0; c < cols; c++) {
    const back = deep - 1 - d, n = Math.max(2, Math.min(7, 3 + back * (best.fd > 1 ? 1 : 2) + (r() < .55 ? 1 : 0) - (r() < .3 ? 1 : 0) - (c === 0 || c === cols - 1 ? (r() < .6 ? 1 : 0) : 0)));
    let y = .002;
    for (let k = 0; k < n; k++) {
      const seed = Math.floor(r() * 8), b = buildMoveBox(seed), top = k === n - 1 && k > 0;
      b.scale.setScalar(Math.max(.92, 1.42 - k * .1 - r() * .06));
      b.position.set((c - (cols - 1) / 2) * px + (r() - .5) * .07 * k, y + (top ? .03 : 0), ((deep - 1) / 2 - d) * -pz + (r() - .5) * .05);
      b.rotation.y = (r() - .5) * (.2 + k * .08);
      if (top && r() < .6) { b.rotation.z = (r() - .5) * .34; b.rotation.x = (r() - .5) * .2; }   // (삐죽)
      b.userData.home = b.position.clone();
      y += (.24 + (seed % 2) * .05) * b.scale.y; g.add(b); boxes.push(b);
    }
  }
  boxes.sort((u, v) => u.position.y - v.position.y);   // (the top ones go first as things are found)
  S.kitPile = { g, boxes, at: best.c.clone(), hidden: null, said: false };
  if (K.intro === 'truck') boxes.forEach(b => { b.visible = false; });   // (they come off the truck — kitIntro drops them)
  // the thing that waits under it: out of sight, out of the hints, the bot and the start-view tidying (vacHidden does all that)
  const it = S.targets.find(t => t.type === kitItem(K.id, P0.item) && t.g);   // (by its type: the card, which marks kitPart, comes later)
  if (it) {
    const g0 = it.g; R.group.attach(g0); g0.position.copy(R.group.worldToLocal(best.c.clone())); g0.position.y = R.group.worldToLocal(best.c.clone()).y + .01;
    g0.visible = false; it.vacHidden = true; it.pileHidden = true;
    if (it.spot?.item === it) it.spot.item = null;
    it.spot = { kind: 'on', label: '상자 더미 밑', part: null, furn: null, item: it, maxH: 1 };
    S.kitPile.hidden = it;
  }
  // no decoy on the pile or right by it (레벨 세션)
  for (const d of S.items || []) if (d.role === 'decoy' && d.g && !d.found) { const q = d.g.getWorldPosition(new THREE.Vector3()); if (Math.hypot(q.x - best.c.x, q.z - best.c.z) < 1.3) { d.g.parent?.remove(d.g); d.gone = true; } }
  // a tap on the pile: free, a wobble, and the friend once — "there's still stuff left" (레벨 세션)
  S.kitPileTap = (x, y) => {
    const Pl = S.kitPile; if (!Pl?.boxes.length) return false;
    const hit = W.pick(x, y, [Pl.g])[0]; if (!hit) return false;
    let b = hit.object; while (b && b.parent !== Pl.g) b = b.parent;
    if (b) S.wobble?.(b);
    G.audio.sfx('thump'); haptic('tick');
    if (!Pl.said) { Pl.said = true; S.say?.(S.friend, S.kit.pile || '아직 짐이 남았어! 하나씩 찾아서 풀자.', 1800); }
    return true;
  };
  W.idsDirty = true; W.shadowDirty = true;
}
// a thing found → the top box of the pile goes (퐁); the last one gone → the thing under it shows
function popPile(S) {
  const G = S.G, W = G.world, Pl = S.kitPile; if (!Pl?.boxes.length) return;
  // (a big pile, 13판 2차): as many off the top as keep pace with the things left to find — the last find takes the rest
  const left = (S.targets || []).filter(t => !t.found && !t.pileHidden && t.role !== 'decoy').length;
  const n = left ? Math.ceil(Pl.boxes.length / (left + 1)) : Pl.boxes.length;
  for (let i = 0; i < n && Pl.boxes.length; i++) {
    const b = Pl.boxes.pop(), s0 = b.scale.clone();
    setTimeout(() => {
      if (S.dead) return;
      const p = W.toScreen(b.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .15, 0)));
      G.audio.sfx('pop', 3 + (i % 6)); W.fx.burst(p.x, p.y, { n: 10, shape: 'circle', colors: ['#f3dfb4', '#e2b77c', '#ffffff'], speed: 160, up: 60, size: 8, life: .45 });
      S.tw.run(.3, k => b.scale.copy(s0).multiplyScalar(k < .35 ? 1 + .25 * (k / .35) : Math.max(.001, 1.25 * (1 - (k - .35) / .65))), ease.linear).then(() => { b.parent?.remove(b); W.idsDirty = true; W.shadowDirty = true; });
    }, i * 90);
  }
  if (Pl.boxes.length) return;
  // …and under the last box: the one that waited there
  const it = Pl.hidden; if (!it || it.found) return;
  setTimeout(() => {
    if (S.dead) return;
    it.g.visible = true; it.vacHidden = false; W.idsDirty = true;
    const q = W.toScreen(Pl.at.clone().setY(Pl.at.y + .12));
    W.fx.burst(q.x, q.y, { n: 24, shape: 'star', colors: ['#ffe14d', '#ffffff', '#ffb3cc'], speed: 240, life: .6, size: 10 }); W.fx.ring(q.x, q.y, { r: 80, color: '#ffffff', width: 7 });
    G.audio.sfx('special');
    S.kitCells?.[it.kitPart]?.classList.remove('mystery');
    S.say?.(S.friend, S.kit.under || '어? 상자 밑에 하나 더 있었네!', 1800);
  }, 320 + n * 90);
}

// ── a thing found (stage.js, once its picture has landed in its cell): a model kit's click; 이삿짐: the box nearest the
// find folds flat and goes; 파르페: that topping onto the big parfait, its layer popping in (the cherry waits for last)
export function kitFound(S, it) {
  const G = S.G, W = G.world, K = KITS[S.kit.kit];
  G.audio.sfx('latch');
  if (K.type === 'place' && S.kitPile) { if (!it?.pileHidden) popPile(S); }
  else if (K.type === 'place' && S.kitBoxes?.length) {
    const c = it?.g ? it.g.getWorldPosition(new THREE.Vector3()) : null;
    const wp = b => b.getWorldPosition(new THREE.Vector3());
    const b = c ? S.kitBoxes.slice().sort((u, v) => wp(u).distanceTo(c) - wp(v).distanceTo(c))[0] : S.kitBoxes[0];
    S.kitBoxes.splice(S.kitBoxes.indexOf(b), 1);
    foldBox(S, b);
  }
  if (K.type === 'stack' && !K.build && S.kitParfait && it?.kitPart && it.kitPart !== K.last) popLayer(S, it.kitPart);   // (a kit put together at the end: nothing goes on yet)
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

// a lid showing the finished thing (a kit with no box art: 파르페 — the full glass), drawn once
const LID_MODELS = { parfait: () => { const p = buildParfait(); for (const k in p.layers) p.layers[k].visible = true; return p.g; } };
function lidPic(G, K) {
  const key = 'kitlid_' + K.id;
  if (!G.thumbStore[key]) Object.assign(G.thumbStore, renderThumbs([{ key, build: LID_MODELS[K.id], dir: [.3, .22, 1] }], 200));
  return G.thumbStore[key];
}
// the comic panel's colours, each kit its own (user 10/20: "바꿔가면서 써… 돌려쓰지말고"): middle → edge, the light and dark
// speed lines, the dots, the bolts. (The robot keeps the green the user first chose.)
const BURST = {
  robot: null,
  cattower: ['#fff3c9', '#ffd27a', '#ffae4d', '#f08a3a', '#d96d2a', 'rgba(255,248,205,.5)', 'rgba(150,60,10,.2)', 'rgba(150,60,10,.26)', 'rgba(150,60,10,.36)'],
  firetruck: ['#ecffff', '#a3e8ff', '#56c6f7', '#2b97e2', '#1d74c6', 'rgba(235,255,255,.5)', 'rgba(10,55,130,.2)', 'rgba(10,55,130,.26)', 'rgba(10,55,130,.36)'],
  moving: ['#fcf0ff', '#e2c8ff', '#bf96ff', '#9767ea', '#7448cb', 'rgba(255,240,255,.5)', 'rgba(60,20,120,.2)', 'rgba(60,20,120,.26)', 'rgba(60,20,120,.36)'],
  parfait: ['#fff1f7', '#ffc8dd', '#ff99bf', '#f36c9f', '#d54b83', 'rgba(255,240,248,.5)', 'rgba(130,20,70,.2)', 'rgba(130,20,70,.26)', 'rgba(130,20,70,.36)'],
};
const burstVars = id => (BURST[id] || []).map((c, i) => `--${['k1', 'k2', 'k3', 'k4', 'k5', 'kl', 'kd', 'kdot', 'kbolt'][i]}:${c}`).join(';');
// a moving box's picture (the truck's boxes flying out), drawn once
function boxPic(G) {
  if (!G.thumbStore.kitmovebox_pic) Object.assign(G.thumbStore, renderThumbs([{ key: 'kitmovebox_pic', build: () => buildMoveBox(0), dir: [.35, .3, 1] }], 120));
  return G.thumbStore.kitmovebox_pic;
}
// the pile going up in the room: each box drops from above onto its place, bottom row first — 쿵 쿵 쿵, a puff each
async function dropPile(S) {
  const G = S.G, W = G.world, Pl = S.kitPile, jobs = [];
  Pl.boxes.forEach((b, i) => {
    jobs.push(new Promise(res => setTimeout(() => {
      if (S.dead) return res();
      const home = b.userData.home; b.visible = true; W.idsDirty = true;
      S.tw.run(.26, k => { b.position.set(home.x, home.y + 1.4 * (1 - k * k), home.z); }, ease.linear).then(() => {
        b.position.copy(home); W.shadowDirty = true;
        const q = W.toScreen(b.getWorldPosition(new THREE.Vector3()));
        W.fx.burst(q.x, q.y, { n: 8, shape: 'circle', colors: ['#ffffff', '#f3e6d6'], speed: 130, up: 20, size: 7, life: .35 });
        if (i % 3 === 0) { G.audio.sfx('thunk'); G.audio.sfx('land'); haptic('tick'); } res();
      });
    }, i * (Pl.boxes.length > 10 ? Math.min(55, 1500 / Pl.boxes.length) : 140))));   // (a big pile in ~2 s — 검토 10/21)
  });
  await Promise.all(jobs);
  await new Promise(r => setTimeout(r, 200));
}
// the pile, the first time it is seen (③ 10/21, user: "상자보고 이삿짐이 좀 많네? 놀라는 이런거"): the view looks up to its top and
// comes back, 몽글이 and the host wide-eyed (then a bead of sweat), a word each — 스토리 룸's PILE_WOW (script.js); a tap goes on
async function pileWow(S) {
  const G = S.G, W = G.world, tw = S.tw, bx = S.kitPile?.boxes; if (!bx?.length) return;
  const top = new THREE.Vector3(), q = new THREE.Vector3(); let ty = -1e9;
  for (const b of bx) { b.getWorldPosition(q); if (q.y > ty) { ty = q.y; top.copy(q); } }
  const SC = await import('./script.js').catch(() => ({}));
  const lines = SC.PILE_WOW || [{ who: 'mong', text: '…이삿짐 좀 많은데?' }, { who: S.th?.friend || 'bunny', text: '헤헤… 다 내 거야!' }];
  const chs = [...new Set(lines.map(L => S.charFor?.(L.who) || null).filter(Boolean))];
  const v0 = { target: W.target.clone(), zoom: W.zoom, yaw: W.yaw, pitch: W.pitch };
  // (검토 10/21: about 3 s in all) — a quick look up and back, then the two of them close up together, each line ~1.2 s
  let look = top;   // (where they look: up at the pile, then at you — held every frame: the host wanders, and turned her back)
  const hold = () => { if (S.dead || !look) return; for (const c of chs) c.faceTo?.(look.x, look.z); requestAnimationFrame(hold); };
  for (const c of chs) { c.setFace('wow'); c._fx(tw, 'excl', { y: 1 }); }
  hold();
  G.audio.sfx('gasp'); haptic('tick');
  await W.flyTo(tw, { target: top.clone().setY(top.y + .3), zoom: v0.zoom * 1.3, dur: .45 }); if (S.dead) return;   // (up to the top of it)
  await tw.wait(.12); if (S.dead) return;
  const CU = await import('./closeup.js').catch(() => ({})), lock = W.camLock; W.camLock = false;
  look = W.cam.position;
  for (const c of chs) c.setFace('sweat');
  if (!S._closeBack) S._closeBack = { ...v0, target: v0.target.clone() };   // (back from the close-up to the view before the look up)
  CU.closeUp?.(S, chs, { portrait: true });
  for (const L of lines) {
    const ch = S.charFor?.(L.who); if (!ch) continue;
    const ms = 1250, b = S.say(ch, L.text, ms);
    await new Promise(res => { const go = () => { clearTimeout(t); removeEventListener('pointerdown', go, true); res(); }, t = setTimeout(go, ms); addEventListener('pointerdown', go, true); });
    b?.kill?.(); if (S.dead) { look = null; return; }
  }
  for (const c of chs) c.setFace('happy');
  look = null;
  const wasUp = Math.abs(W.zoom - v0.zoom * 1.3) < 1e-3;   // (no close-up was taken: still up at the pile)
  await CU.closeBack?.(S); W.camLock = lock;
  if (wasUp) { S._closeBack = null; await W.flyTo(tw, { target: v0.target, zoom: v0.zoom, dur: .35 }); }
}
// the box seen from above its front-right corner; the lid sits on the body's top (its transform moves it from there)
const KB3_VIEW = 'rotateX(-28deg) rotateY(-34deg)', KB3_LID = 'translate3d(0,0,0)', KB3_PEEK = 'translate3d(0,-46px,0) rotateX(10deg)';
// 13판's truck turned a little more to its nose (10/23, user: "13판 트럭 앞부분이 어색함"), so its face reads as a face
// (10/25 memo-check "트럭 디자인 다시, 색 유지": a bonneted toy truck now — style.css .kb3-hood — the view stays)
const TRUCK_VIEW = 'rotateX(-28deg) rotateY(-40deg)';
// the comic panel's zigzag bolts round the edges, pointing in (like the user's green zoom-burst reference)
const BOLTS_SVG = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g fill="currentColor"><path d="M0 14 L30 30 L22 31 L44 44 L19 37 L26 35 L0 24 Z"/><path d="M100 10 L72 28 L80 29 L56 43 L82 35 L75 33 L100 20 Z"/><path d="M0 70 L28 62 L24 67 L44 56 L20 74 L24 70 L0 80 Z"/><path d="M100 66 L74 60 L78 65 L56 56 L80 72 L76 69 L100 77 Z"/><path d="M38 100 L44 78 L40 80 L49 62 L46 82 L50 80 L46 100 Z"/><path d="M58 0 L54 20 L58 18 L50 36 L52 16 L48 18 L50 0 Z"/></g></svg>';
// ── the box (before the hunt), every kit stage. 10/20, the user on the phone (8판, "모든 조립판에 같게"): "상자 등장 → '콕
// 하세요' 같은 확실한 행동 유도 → 콕 하면 부품이 팍 흩어지는 애니메이션 → 집 장면". A comic panel covers the room; the box
// drops in — 쿵 — (the first time: the friend's cut-in line, a rattle, two little eyes in the gap); then it waits, beating,
// light round its lid, a big hand tapping it and 콕! (스토리 룸's word). The tap bursts it — 펑 — and the pieces fly out all
// at once, each to where it hides, as the panel clears; the card comes up empty, its shapes waiting. A tap before the box
// waits only hurries on to it. (The box is made off-screen, where its drop starts: it never shows at rest first — the user
// saw it "다른 위치에서 탁 튐".)
// the box before the stage (10/21, user: "상자 나오는 것들 스테이지 먼저 나오고 상자 나오던데, 상자 먼저 나오고 스테이지로 진입하게
// 해 줘"): a kit stage opens on the comic panel itself — put up while the stage is set up, before the iris opens, so the room
// is never seen first; the banner shows over it, then kitIntro's box drops onto it, and the room comes only after the shine
export function kitCover(S) {
  const K = KITS[S.kit?.kit];
  if (!K || (K.intro !== 'box' && K.intro !== 'truck')) return null;
  const el = h('div', { class: 'kitintro comic kitcover', style: burstVars(K.id) },
    h('div', { class: 'kitintro-bg' }), h('div', { class: 'kitintro-rays' }), h('div', { class: 'kitintro-dots' }), h('div', { class: 'kitintro-bolts', html: BOLTS_SVG }));
  (document.getElementById('hud') || S.col)?.append(el);
  S.G.world.camLock = true;   // (no turning the hidden room meanwhile; the zoom gauge and the dial stay away — kitIntro lets go)
  return S.kitCover = el;
}
// 13판's moving truck: its opening comes before the chapter card (stage.js)
export const kitTruck = S => KITS[S.kit?.kit]?.intro === 'truck';
export async function kitIntro(S) {
  const G = S.G, W = G.world, K = KITS[S.kit.kit], card = S.tray, col = S.col, f = S.friend;
  if (!card || !col) { if (S.kitCover) { S.kitCover.remove(); S.kitCover = null; W.camLock = false; } return; }
  if (K.intro === 'truck') return truckIntro(S);
  if (K.intro !== 'box') return kitPop(S);
  let seen = G.save.kitIntro; if (!seen || typeof seen !== 'object') seen = G.save.kitIntro = {};   // (was a count of any kit's box)
  const quick = !!seen[K.id] || S.kitRetry;
  if (!G.playMode) { seen[K.id] = (seen[K.id] || 0) + 1; G.persist?.(); }
  const anims = new Set(), outs = [];
  const A = (el, kf, o) => { const a = el.animate(kf, { fill: 'both', ...o }); anims.add(a); return a.finished.catch(() => {}); };
  let wake = null;
  const wait = ms => new Promise(r => { const t = setTimeout(r, ms); wake = () => { clearTimeout(t); r(); }; });   // (a hurry cuts a wait short)
  let skipped = false, hurry = false, phase = 'pre', open = null;
  // the box, a real box: a body with every side (and its inside, dark, for when it's open) and a lid that is a shallow box
  // itself — the kit's picture on its top (GPT's box art; or the finished thing; or plain kraft and tape for the moving box),
  // the kit's name on its rim
  const art = K.boxArt || (LID_MODELS[K.id] ? lidPic(G, K) : null) || (K.type === 'model' ? G.thumbStore[S.kitPic('box')] : null);   // (a model kit before its GPT box art: the finished model)
  const F = (c, ...k) => h('div', { class: 'kb3-face kb3-' + c }, ...k);
  const DROP0 = 'translateY(-80vh) rotate(-6deg)';
  const box = h('div', { class: 'kb3 big' + (K.lid ? ' lid-' + K.lid : ''), style: `--box:${K.color};transform:${DROP0}` },
    h('div', { class: 'kb3-glow' }),
    h('div', { class: 'kb3-cube' },
      h('div', { class: 'kb3-floor' }),
      F('ifloor'), F('iback'), F('ileft'), F('back'), F('left'), F('bottom'), F('right'),
      F('front', h('span', { class: 'kb3-count' }, `${K.countWord || '부품'} ${K.order.length}개`)),
      h('div', { class: 'kb3-lid' }, F('lback'), F('lleft'), F('lright'), F('lfront', h('b', { class: 'kb3-name' }, K.name)),
        F('ltop', art ? h('img', { src: art, alt: '' }) : h('i', { class: 'kb3-ltape' })))));
  if (LID_MODELS[K.id]) trimPic(G, 'kitlid_' + K.id).then(src => { const im = src && box.querySelector('.kb3-ltop img'); if (im) im.src = src; });   // (cut to the thing: it fills the lid)
  // the friend comes in as a comic cut-in (the panel covers the room): their face in a round frame, the line beside it
  const who = S.kit.who || S.th?.friend || 'bear', face = G.thumbs['face_' + who];
  const cut = !quick && S.kit.open ? h('div', { class: 'kitcut', style: 'transform:translateX(-115%)' }, h('div', { class: 'kitcut-face' }, h('img', { src: face || '', alt: '' })), h('div', { class: 'kitcut-say' }, S.kit.open)) : null;
  // (the panel every time, the short one too — user 10/19: "뒤에 배경 완전히 가려야 하는데 지금 노란색만 살짝 보임")
  const lay = h('div', { class: 'kitintro comic', style: 'opacity:0;' + burstVars(K.id) },
    h('div', { class: 'kitintro-bg' }), h('div', { class: 'kitintro-rays' }), h('div', { class: 'kitintro-dots' }), h('div', { class: 'kitintro-bolts', html: BOLTS_SVG }), box, ...(cut ? [cut] : []));
  // (over the whole screen — the HUD, not its middle column, which stops at 560 px: on a wide screen or a PC window the room
  // showed either side, user 10/20 "기종에 따라서 배경이 이럴 수도 있겠어")
  (document.getElementById('hud') || col).append(lay);
  const covered = !!S.kitCover;   // (the panel already up since the stage was set up: no slam, it's simply there)
  if (covered) {   // (no fade-in for it; the cover goes once it has drawn, two frames on — or the room flickered through)
    lay.style.opacity = '1'; lay.style.animation = 'none';
    const cv = S.kitCover; S.kitCover = null; requestAnimationFrame(() => requestAnimationFrame(() => cv.remove()));
  }
  const lid = box.querySelector('.kb3-lid'), glowEl = box.querySelector('.kb3-glow'), cube = box.querySelector('.kb3-cube'), front = box.querySelector('.kb3-front');
  cube.style.transform = KB3_VIEW; lid.style.transform = KB3_LID;
  // a tap: before the box waits, hurry on to it; while it waits, open it; once it's open, skip to the end
  const tapped = () => {
    if (phase === 'pre') { hurry = true; wake?.(); for (const a of anims) { try { a.finish(); } catch {} } }
    else if (phase === 'prompt') open?.(); else skipped = true;
  };
  lay.addEventListener('pointerdown', tapped); card.addEventListener('pointerdown', tapped);
  const H = () => { if (skipped) throw 0; if (hurry) throw 1; };
  const cells = Object.values(S.kitCells);
  card.style.zIndex = 31; card.style.visibility = 'hidden';
  // the pieces aren't in the room yet: each shows the moment it lands where it hides
  const its = S.targets.filter(t => t.kitPart && t.g);
  const s0 = new Map(its.map(t => [t, t.g.scale.clone()])), vis0 = new Map(its.map(t => [t, t.g.visible]));   // (a thing inside a shut drawer is hidden till it opens: it stays so)
  its.forEach(t => { t.g.visible = false; }); W.idsDirty = true;
  const v0 = { yaw: W.yaw, pitch: W.pitch, zoom: W.zoom, target: W.target.clone() };
  W.camLock = true;
  let hb = 0, hb0 = 0;
  try {
    try {
      // the comic panel slams in over the room
      if (!covered) {
        G.audio.sfx('swish');
        await A(lay, [{ opacity: 0, transform: 'scale(1.18)' }, { opacity: 1, transform: 'none' }], { duration: quick ? 200 : 300, easing: 'cubic-bezier(.2,.9,.3,1)' });
        H();
      }
      // it drops in — 쿵 — and settles (a puff of dust)
      G.audio.sfx('whoosh');
      await A(box, [{ transform: DROP0 }, { transform: 'translateY(0) rotate(0)', offset: .7 }, { transform: 'translateY(0) scale(1.1, .84)', offset: .82 }, { transform: 'translateY(-6px) scale(.97, 1.04)', offset: .92 }, { transform: 'none' }], { duration: quick ? 420 : 560, easing: 'cubic-bezier(.45,.05,.7,1)' });
      G.audio.sfx('land'); G.audio.sfx('thunk'); haptic('tick');
      { const r = front.getBoundingClientRect(); W.fx.burst(r.left + r.width / 2, r.bottom - 6, { n: 16, shape: 'circle', colors: ['#ffffff', '#f3e6d6', '#e9d6c0'], speed: 220, up: 20, gravity: 300, size: 10, life: .5 }); }
      H();
      if (!quick) {
        // the friend's line now, while the box sits still (스토리 룸: a bubble during the shaking goes unread) — in from the side
        if (cut) {
          await A(cut, [{ transform: 'translateX(-115%) rotate(-6deg)' }, { transform: 'translateX(4%) rotate(1deg)', offset: .75 }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.9,.3,1)' });
          H(); await wait(1700); H();
          A(cut, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-115%)', opacity: 0 }], { duration: 260, easing: 'ease-in' });
        }
        // 덜컹… 덜컹덜컹 — and the lid lifts a crack: two little eyes blink in the dark, and duck back in (스토리 룸's idea:
        // the parts are alive, and up to mischief)
        for (const [amp, n, peek] of [[4, 2, 0], [7, 3, 1]]) {
          const kf = [{ transform: 'none' }]; for (let i = 0; i < n; i++) kf.push({ transform: `translateY(${-amp}px) rotate(${(i % 2 ? 1 : -1) * amp * .7}deg)` }, { transform: 'none' });
          G.audio.sfx('thunk'); haptic('tick');
          await A(box, kf, { duration: 80 * n * 2, easing: 'ease-in-out' }); H();
          if (peek) {
            // (inside the box, just behind its front wall: they show only in the gap under the lifted lid)
            const eyes = h('div', { class: 'kiteyes' }, h('i'), h('i')), at = h('div', { class: 'kb3-eyes' }, eyes);
            cube.append(at); outs.push(at);
            A(lid, [{ transform: KB3_LID }, { transform: KB3_PEEK, offset: .2 }, { transform: KB3_PEEK, offset: .8 }, { transform: KB3_LID }], { duration: 900, easing: 'ease-in-out' });
            A(eyes, [{ opacity: 0, transform: 'translate(-50%,-30%) scale(.3)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .25 }, { opacity: 1, transform: 'translate(-50%,-50%) scaleY(.15)', offset: .45 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .55 }, { opacity: 1, transform: 'translate(-30%,-50%) scale(1)', offset: .7 }, { opacity: 0, transform: 'translate(-30%,-10%) scale(.4)' }], { duration: 900, easing: 'ease-in-out' });
            G.audio.sfx('giggle'); await wait(950); at.remove(); H();
          }
          await wait(220); H();
        }
      }
    } catch (e) { if (e !== 1) throw e; }
    if (hurry) {   // (hurried: whatever was moving jumps to its end — the panel up, the box landed — and the cut-in and the eyes go)
      for (const a of anims) { try { a.finish(); } catch {} }
      cut?.remove(); cube.querySelectorAll('.kb3-eyes').forEach(e => e.remove());
    }
    // 콕: it waits, beating, light round its lid, a big hand tapping it
    phase = 'prompt';
    const beat = cube.animate([{ transform: KB3_VIEW }, { transform: KB3_VIEW + ' scale3d(1.07,1.07,1.07)', offset: .16 }, { transform: KB3_VIEW, offset: .32 }, { transform: KB3_VIEW + ' scale3d(1.04,1.04,1.04)', offset: .46 }, { transform: KB3_VIEW, offset: .62 }], { duration: 950, iterations: Infinity });
    const shine = glowEl.animate([{ opacity: .35, transform: 'scale(.85)' }, { opacity: .9, transform: 'scale(1)', offset: .2 }, { opacity: .35, transform: 'scale(.85)' }], { duration: 950, iterations: Infinity });
    const lt0 = box.querySelector('.kb3-ltop').getBoundingClientRect(), cc0 = lay.getBoundingClientRect();
    const hx = lt0.left + lt0.width * .74 - cc0.left, hy = lt0.top + lt0.height * .55 - cc0.top;   // (beside the lid's picture, not over it)
    const hand = h('div', { class: 'hand tap kithand', html: ICON.hand, style: `left:${hx}px;top:${hy}px` });
    const kok = h('div', { class: 'kitkok ol', style: `left:${hx}px;top:${lt0.top - cc0.top - 30}px` }, '터치!');
    lay.append(hand, kok);
    // (③ 10/21, user: "날아갈때 연출 좀더 멋지고 재밌게") every 1.6 s it twitches — 덜컹덜컹, something wants out
    const wig = box.animate([{ transform: 'none' }, { transform: 'none', offset: .3 }, { transform: 'translateY(-12px) rotate(-7deg)', offset: .36 }, { transform: 'translateY(0) rotate(6deg) scale(1.04, .96)', offset: .42 },
      { transform: 'translateY(-6px) rotate(-4deg)', offset: .48 }, { transform: 'rotate(2deg)', offset: .54 }, { transform: 'none', offset: .6 }, { transform: 'none' }], { duration: 1600, iterations: Infinity });
    G.audio.sfx('heart'); hb0 = setTimeout(() => { G.audio.sfx('thunk'); hb = setInterval(() => G.audio.sfx('thunk'), 1600); }, 480);
    await new Promise(res => { open = res; if (G.bot || S.botOn?.()) setTimeout(res, 700); setTimeout(res, 15000); });   // (a bot opens it; nobody for 15 s: it opens itself)
    open = null; clearInterval(hb); hb = 0; clearTimeout(hb0); wig.cancel();
    phase = 'burst';
    hand.remove(); kok.remove(); beat.cancel(); shine.cancel(); glowEl.style.opacity = '.9';
    if (S.dead) throw 0;
    // (③ 10/21, user: "상자 … 누르고 흩어질 때 효과, 애니메이션 수정" → "날아갈때 연출 좀더 멋지고 재밌게 퀄업") the box gives under
    // the finger, squashed flat, and springs up — then 펑
    G.audio.sfx('pop', 2); haptic('tick');
    await A(box, [{ transform: 'none' }, { transform: 'scale(1.2, .74)', offset: .5 }, { transform: 'scale(.9, 1.16) translateY(-6px)', offset: .82 }, { transform: 'none' }], { duration: 200, easing: 'ease-out' });
    if (skipped) throw 0;
    // 펑! the lid bursts off spinning (a white flash, a comic burst), light pours out; the screen jolts and punches in, smoke
    // puffs, stars, confetti and packing peanuts fly — and for a beat everything hangs in slow motion, the pieces
    // floating over the box, before they shoot away
    G.audio.sfx('thump'); G.audio.sfx('special'); G.audio.sfx('pop', 6); G.audio.sfx('rustle'); haptic('ok');
    const lr = lay.getBoundingClientRect(), lt = box.querySelector('.kb3-ltop').getBoundingClientRect(), mouth = { x: lt.left + lt.width / 2 - lr.left, y: lt.top + lt.height / 2 - lr.top };
    const OUT = 200, HANG = 130, slow = [];   // (the leap out, the hang; what slows down for the hang)
    // (user 10/21: "상자 먼저 열리고 그다음 빤짝하고 가운데에서 상자에서 약간 위에서 저렇게 퍼지면 될듯"): the box opens first; a beat on,
    // a twinkle in the middle of the screen a little over the box, and the orbs come out of that one point
    // (user 10/21, again: "그 상자에서 나오게 수정해줄래?") — the twinkle is in the open box's mouth and the orbs well up out of
    // it, glowing, to their ring over it; then off every way
    const BEAT = 230, cen = { x: lr.width / 2, y: lt.top - lr.top - 14 }, inX = mouth.x - cen.x, inY = mouth.y - cen.y + 12;   // (the mouth, a little inside)
    const S2 = (el, kf, o) => { const a = el.animate(kf, { fill: 'both', ...o }); anims.add(a); slow.push(a); return a; };
    {
      const fl = h('div', { class: 'kitflash' }); lay.append(fl); outs.push(fl); A(fl, [{ opacity: .9 }, { opacity: 0 }], { duration: 240, easing: 'ease-out' });
      const bang = h('div', { class: 'kitbang', style: `left:${mouth.x}px;top:${mouth.y}px` }); lay.append(bang); outs.push(bang);
      A(bang, [{ transform: 'translate(-50%,-50%) scale(.2) rotate(0)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(1.15) rotate(12deg)', opacity: 1, offset: .5 }, { transform: 'translate(-50%,-50%) scale(1.3) rotate(16deg)', opacity: 0 }], { duration: 460, easing: 'ease-out' });
      A(lay, [{ translate: '0 0', scale: '1' }, { translate: '-10px 6px', scale: '1.05' }, { translate: '8px -7px', scale: '1.035' }, { translate: '-6px 4px', scale: '1.02' }, { translate: '3px -2px', scale: '1.01' }, { translate: '0 0', scale: '1' }], { duration: 320, easing: 'linear' });
      for (let i = 0; i < 10; i++) {   // the smoke: soft white balls rolling out of the mouth and thinning away
        const a = (i / 10) * Math.PI * 2 + .3, d = 80 + (i % 3) * 26, pf = h('i', { class: 'kitpuff', style: `left:${mouth.x}px;top:${mouth.y}px` }); lay.append(pf); outs.push(pf);
        S2(pf, [{ transform: 'translate(-50%,-50%) scale(.3)', opacity: .95 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d * .6}px), calc(-50% + ${Math.sin(a) * d * .42 - 14}px)) scale(1.25)`, opacity: .9, offset: .3 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d * .7 - 22}px)) scale(1.6)`, opacity: 0 }], { duration: 640, easing: 'cubic-bezier(.2,.8,.4,1)' });
      }
      // stars, confetti and packing peanuts (cream, the box's stuffing) up and over, falling with a flutter
      const cols = ['#ffe14d', '#ff8fb8', '#8fd3f4', '#9be38f', '#ffffff', '#ffb23a'];
      for (let i = 0; i < 26; i++) {
        const kind = i % 4 === 0 ? 'star' : i % 4 === 2 ? 'peanut' : '', el = h('i', { class: 'kitbit ' + kind, style: `left:${mouth.x}px;top:${mouth.y}px` + (kind === 'peanut' ? '' : `;background:${cols[i % cols.length]}`) }); lay.append(el); outs.push(el);
        const dx = (Math.random() - .5) * lr.width * (kind === 'peanut' ? .7 : 1), up = 130 + Math.random() * 170, fall = 180 + Math.random() * 180, rot = (Math.random() - .5) * 1000;
        S2(el, [{ transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx * .55}px), calc(-50% - ${up}px)) rotate(${rot * .5}deg)`, opacity: 1, offset: .38, easing: 'ease-in' },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${fall - up}px)) rotate(${rot}deg)`, opacity: 0 }], { duration: 950 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.4,1)' });
      }
    }
    // (the lid flies up spinning and off the screen — no fading: a 3D group fading flattens into a plane)
    S2(lid, [{ transform: KB3_LID }, { transform: 'translate3d(-10px,-150px,0) rotateX(30deg) rotateZ(-70deg)', offset: .3 }, { transform: 'translate3d(300px,-900px,0) rotateX(250deg) rotateZ(-560deg)' }], { duration: 640, easing: 'cubic-bezier(.25,.1,.6,1)' });
    box.classList.add('open');   // (light inside)
    A(glowEl, [{ opacity: .9, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1.7)' }], { duration: 360, easing: 'ease-out' });
    // the slow-motion beat: everything above slows to a crawl for HANG ms, then runs on (the pieces' own float is in their keyframes)
    setTimeout(() => { for (const a of slow) a.updatePlaybackRate(.22); }, BEAT + OUT);
    setTimeout(() => { if (skipped) return; for (const a of slow) a.updatePlaybackRate(1); G.audio.sfx('whoosh'); }, BEAT + OUT + HANG);
    // 촤차작 (user 10/21: "물건들은 실루엣 처리 … 바닥에 떨어지는게 아니라 … 드래곤볼 촤차작 퍼지는 느낌"): the pieces come out as
    // glowing orbs, each with only its shadow inside (what it is, the room tells), in a ring over the box — a beat — then
    // they shoot off every way, up, sideways, slantwise, long light tails behind them, and off the screen; the tails hang in
    // the sky a moment, a twinkle where each went over the edge. Then a bright band wipes across and behind it is the room,
    // each piece already where it hides (user 10/20: "흩어질 때는 그 배경 위에서 부품이 흩어지고 → 반짝 트랜지션 → 그 뒤에 집 장면")
    const n = K.order.length, gap = 34, FLY = 340, FADE = 320, far = Math.hypot(lr.width, lr.height);
    const launch = K.order.map((_, i) => i).sort((a, b) => (a * .618) % 1 - (b * .618) % 1);   // (not round the ring in turn: here, there)
    {   // 반짝: the point they come out of
      const tw = h('i', { class: 'kitspark big', style: `left:${mouth.x}px;top:${mouth.y + 6}px;z-index:35` }); lay.append(tw); outs.push(tw);
      A(tw, [{ transform: 'translate(-50%,-50%) scale(0) rotate(0)' }, { transform: 'translate(-50%,-50%) scale(2.3) rotate(45deg)', offset: .4 }, { transform: 'translate(-50%,-50%) scale(0) rotate(100deg)' }], { duration: 420, delay: BEAT - 60, easing: 'ease-out' });
      setTimeout(() => !skipped && G.audio.sfx('star', 2), BEAT - 60);
    }
    K.order.forEach((p, i) => {
      const orb = h('div', { class: 'kitorb', style: `left:${cen.x}px;top:${cen.y}px` }, h('img', { src: S.kitCells[p]?.querySelector('.kitrun-pc')?.src || '', alt: '' }));
      lay.append(orb); outs.push(orb);
      const a = (-215 + 250 * (n > 1 ? i / (n - 1) : .5) + (i % 2 ? 7 : -7)) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      const hx = ca * 112, hy = sa * 62 - 20, ex = hx + ca * far, ey = hy + sa * far;   // (the ring over the box; and out past the edge)
      const t0 = OUT + HANG + launch.indexOf(i) * gap, D = t0 + FLY, at = (x, y, sc) => `translate(-50%,-50%) translate(${x}px,${y}px) scale(${sc})`;
      A(orb, [{ transform: at(inX, inY, .25), opacity: 0, easing: 'cubic-bezier(.2,.75,.3,1)' }, { transform: at(inX + hx * .15, inY - 30, .6), opacity: 1, offset: OUT * .35 / D, easing: 'cubic-bezier(.2,.7,.4,1)' }, { transform: at(hx, hy, 1), opacity: 1, offset: OUT / D, easing: 'ease-in-out' },
        { transform: at(hx * 1.04, hy - 5, 1.12), offset: t0 / D, easing: 'cubic-bezier(.35,0,.75,.55)' }, { transform: at(ex, ey, .8), opacity: 1 }], { duration: D, delay: BEAT });
      // the tail: from the ring to the orb, growing with it (same curve), then fading thin where it hung
      const tail = h('i', { class: 'kittrail', style: `left:${cen.x + hx * 1.04}px;top:${cen.y + hy - 5}px;width:${far}px` }); lay.append(tail); outs.push(tail);
      A(tail, [{ transform: `rotate(${a}rad) scaleX(0)`, opacity: 1, easing: 'cubic-bezier(.35,0,.75,.55)' }, { transform: `rotate(${a}rad) scaleX(1)`, opacity: 1, offset: FLY / (FLY + FADE), easing: 'ease-out' },
        { transform: `rotate(${a}rad) scale(1, .3)`, opacity: 0 }], { duration: FLY + FADE, delay: BEAT + t0 });
      // a twinkle where it went over the edge (just inside it)
      const k = Math.min(...[ca > 0 ? (lr.width - 16 - cen.x - hx) / ca : ca < 0 ? (16 - cen.x - hx) / ca : 1e9, sa > 0 ? (lr.height - 16 - cen.y - hy) / sa : sa < 0 ? (16 - cen.y - hy) / sa : 1e9]);
      const sp = h('i', { class: 'kitspark', style: `left:${cen.x + hx + ca * k}px;top:${cen.y + hy + sa * k}px;z-index:34` }); lay.append(sp); outs.push(sp);
      A(sp, [{ transform: 'translate(-50%,-50%) scale(0) rotate(0)' }, { transform: 'translate(-50%,-50%) scale(1.2) rotate(45deg)', offset: .35 }, { transform: 'translate(-50%,-50%) scale(0) rotate(90deg)' }], { duration: 420, delay: BEAT + t0 + FLY * .8, easing: 'ease-out' });
      setTimeout(() => !skipped && G.audio.sfx('pop', 4 + i), BEAT + i * 16);
      setTimeout(() => !skipped && G.audio.sfx('swish'), BEAT + t0);   // (슈슈슉)
    });
    setTimeout(() => {   // the launch: a jolt and a buzz; the sky dims so the tails shine
      if (skipped) return; haptic('tick');
      const dim = h('div', { class: 'kitdim' }); lay.append(dim); outs.push(dim); A(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'ease-out' });
      A(lay, [{ translate: '0 0' }, { translate: '0 -7px' }, { translate: '0 4px' }, { translate: '0 0' }], { duration: 200, easing: 'ease-out' });
    }, BEAT + OUT + HANG);
    await wait(BEAT + OUT + HANG + (n - 1) * gap + FLY * .9); if (skipped) throw 0;
    // 반짝: a bright slanted band sweeps across; behind it the panel is gone and the room is there (the pieces in their places)
    its.forEach(t => { t.g.visible = vis0.get(t); }); W.idsDirty = true;
    card.style.transform = 'translateX(-50%) translateY(140%)'; card.style.visibility = '';   // (below the screen till it rises: never seen in place first)
    G.audio.sfx('star');
    const band = h('div', { class: 'kitwipe' }); (lay.parentElement || lay).append(band); outs.push(band);
    const WIPE = 440, poly = p => `polygon(${p}% 0, 130% 0, 130% 100%, ${p - 30}% 100%)`;
    A(band, [{ left: '-30%' }, { left: '130%' }], { duration: WIPE, easing: 'cubic-bezier(.45,.05,.55,.95)' });
    await A(lay, [{ clipPath: poly(-10) }, { clipPath: poly(160) }], { duration: WIPE, easing: 'cubic-bezier(.45,.05,.55,.95)' }); if (skipped) throw 0;
    lay.classList.add('clear');
    for (let i = 0; i < 6; i++) {
      const sp = h('i', { class: 'kitspark', style: `left:${10 + ((i * 37) % 80)}%;top:${16 + ((i * 53) % 64)}%;z-index:41` }); (lay.parentElement || lay).append(sp); outs.push(sp);
      A(sp, [{ transform: 'translate(-50%,-50%) scale(0) rotate(0)' }, { transform: 'translate(-50%,-50%) scale(1.1) rotate(45deg)', offset: .4 }, { transform: 'translate(-50%,-50%) scale(0) rotate(90deg)' }], { duration: 520, delay: i * 40, easing: 'ease-out' });
    }
    // the card comes up into its place, empty: its shapes waiting
    G.audio.sfx('swish');
    await A(card, [{ transform: 'translateX(-50%) translateY(140%)' }, { transform: 'translateX(-50%) translateY(-6px)', offset: .75 }, { transform: 'translateX(-50%)' }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1)' });
  } catch {}
  if (hb) clearInterval(hb); clearTimeout(hb0);
  box.style.visibility = 'hidden';   // (before the cancels: cancelling its fade-out would flash it back)
  for (const a of anims) { try { a.cancel(); } catch {} }
  outs.forEach(o => o.remove());
  its.forEach(t => { t.g.visible = vis0.get(t); t.g.scale.copy(s0.get(t)); }); W.idsDirty = true;
  if (skipped) W.flyTo(S.tw, { ...v0, cut: true });
  W.camLock = false;
  cells.forEach(c => c.classList.remove('full', 'pop'));
  card.style.visibility = ''; card.style.zIndex = ''; card.style.transform = '';
  lay.removeEventListener('pointerdown', tapped); card.removeEventListener('pointerdown', tapped);
  lay.classList.add('out'); setTimeout(() => lay.remove(), 260);
  if (S.kit.hid && !S.dead) S.say(f, S.kit.hid, 2600);   // "어? 부품이 다 숨어 버렸네. 설계도 보고 같이 찾자!"
}

// ── 13판 이삿짐 트럭 (10/21, user: "트럭 터치하세요 cta하고 한번터치할때마다 상자 하나씩 날라게 가능? 다 날리면 트랜지션 후 아파트
// 나오면 됨"): on the comic panel the truck rolls in and stops with a bounce; '트럭을 터치!' and a hand. Every tap: the truck
// gives under the finger and a box pops out of its back and shoots off the screen on a light tail (the 펑 of ui49), the
// count on its side goes down; the first tap blows its roof off. Nobody tapping for a while: the hand comes back; nobody at
// all for 15 s (or a bot): the rest go by themselves. The last one out — the truck drives off, a bright band wipes, and it
// is the room, the boxes coming down onto their pile 쿵쿵쿵. The chapter card comes after (stage.js), over the room.
// (③ 10/21, user: "한번 트럭 누르면 계속 박스 나오는걸로 사방팔방으로 바꿔줘. 지금 클릭 유도하는데 클릭하는것도 귀찮다 … 상자보고 이삿짐이
// 좀 많네? 놀라는 이런거"): one tap now — the roof blows off and boxes pour out, dozens of them for ~1.5 s, every way (up, either
// side, slantwise), spinning on light tails, 퐁퐁 in a rhythm; no more '터치' after the first. In the room, the first time, the
// pile gets a beat of its own: the view looks up it and back, 몽글이 and the host wide-eyed, a word each (pileWow)
async function truckIntro(S) {
  const G = S.G, W = G.world, K = KITS[S.kit.kit], card = S.tray, col = S.col;
  let seen = G.save.kitIntro; if (!seen || typeof seen !== 'object') seen = G.save.kitIntro = {};
  const quick = !!seen[K.id] || S.kitRetry;
  if (!G.playMode) { seen[K.id] = (seen[K.id] || 0) + 1; G.persist?.(); }
  const anims = new Set(), outs = [];
  const A = (el, kf, o) => { const a = el.animate(kf, { fill: 'both', ...o }); anims.add(a); return a.finished.catch(() => {}); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // (13판 user 10/23: "오프닝이 아쉽고 지저분" → 트럭 나옴 → 애들 대화 → 줌아웃 → 2장 타이틀): with S._truckTalk the truck pulls up in
  // front of the apartment (no comic burst), the two talk, a dozen boxes pour out by themselves, and the room shows close up
  // and pulls back while the pile goes up; the chapter card comes after (stage.js)
  const talk = S._truckTalk?.length ? S._truckTalk : null;
  const NB = talk ? 12 : 30, GAP = talk ? 90 : 50;   // (boxes pouring out, one every 50 ms)
  const F = (c, ...k) => h('div', { class: 'kb3-face kb3-' + c }, ...k);
  const count = h('span', { class: 'kb3-count' }, `이삿짐 ${NB}`);
  const box = h('div', { class: 'kb3 big truck', style: `--box:${K.color};transform:translateX(-120vw)` },
    h('div', { class: 'kb3-glow' }),
    h('div', { class: 'kb3-cube' },
      h('div', { class: 'kb3-floor' }),
      F('ifloor'), F('iback'), F('ileft'), F('back'), F('left'), F('bottom'), F('right'),
      F('front', h('i', { class: 'kb3-post' }), h('i', { class: 'kb3-tail' }), h('i', { class: 'kb3-wave' }), h('i', { class: 'kb3-mong' }), count, h('i', { class: 'kb3-marks' }), h('i', { class: 'kb3-arch ab' }), h('i', { class: 'kb3-flap' }), h('i', { class: 'kb3-wheel a' }), h('i', { class: 'kb3-wheel b' })),
      h('div', { class: 'kb3-cab' },
        F('cfront', h('i', { class: 'kb3-door' }), h('i', { class: 'kb3-cwin' }), h('i', { class: 'kb3-handle' }), h('i', { class: 'kb3-step' })),
        F('cright', h('i', { class: 'kb3-shield' })),
        F('ctop', h('i', { class: 'kb3-rack' }, h('i', { class: 'kb3-rbox' }))), F('cbev a'), F('cbev b'), F('cbev c')),
      h('div', { class: 'kb3-hood' },
        F('hfront', h('i', { class: 'kb3-vent' }), h('i', { class: 'kb3-mirror' }), h('i', { class: 'kb3-arch c' }), h('i', { class: 'kb3-wheel c' }), h('i', { class: 'kb3-bwrap' })),
        F('hright', h('i', { class: 'kb3-grille' }), h('i', { class: 'kb3-lamp l' }), h('i', { class: 'kb3-lamp r' }), h('i', { class: 'kb3-bumper' }, h('i', { class: 'kb3-plate' }))),
        F('htop')),
      h('div', { class: 'kb3-lid' }, F('lback'), F('lleft'), F('lright'), F('lfront', h('b', { class: 'kb3-name' }, K.name)), F('ltop', h('i', { class: 'kb3-ltape' })))));
  const lay = talk ? h('div', { class: 'kitintro street', style: 'opacity:0' }, h('div', { class: 'street-apt' }), h('div', { class: 'street-road' }), box)
    : h('div', { class: 'kitintro comic', style: 'opacity:0;' + burstVars(K.id) },
      h('div', { class: 'kitintro-bg' }), h('div', { class: 'kitintro-rays' }), h('div', { class: 'kitintro-dots' }), h('div', { class: 'kitintro-bolts', html: BOLTS_SVG }), box);
  (document.getElementById('hud') || col).append(lay);
  // the whole truck in the middle of the screen (user 10/23 "트럭 화면 가운데 정렬"): the box and its cab measured together
  if (talk) {
    const t0 = box.style.transform; box.style.transform = 'none';
    let x0 = Infinity, x1 = -Infinity; for (const e of box.querySelectorAll('.kb3-face')) { const r = e.getBoundingClientRect(); if (r.width) { x0 = Math.min(x0, r.left); x1 = Math.max(x1, r.right); } }
    const lr = lay.getBoundingClientRect(); if (isFinite(x0)) box.style.translate = `${Math.round(lr.left + lr.width / 2 - (x0 + x1) / 2)}px 0`;
    box.style.transform = t0;
  }
  const covered = !!S.kitCover;
  if (covered) { lay.style.opacity = '1'; lay.style.animation = 'none'; const cv = S.kitCover; S.kitCover = null; requestAnimationFrame(() => requestAnimationFrame(() => cv.remove())); }
  const lid = box.querySelector('.kb3-lid'), glowEl = box.querySelector('.kb3-glow'), cube = box.querySelector('.kb3-cube'), front = box.querySelector('.kb3-front');
  cube.style.transform = TRUCK_VIEW; lid.style.transform = KB3_LID;
  // (10/23, user: "트럭 화면 가운데 정렬"): the cab hangs off the cargo's end, so the truck as drawn is centred, not its cargo —
  // measured once the panel is up (its rects are nothing while the HUD is still hidden), before it rolls in
  const centre = () => { const bb = box.getBoundingClientRect(); let l = 1e9, r = -1e9;
    for (const e of cube.querySelectorAll('.kb3-face, .kb3-wheel, .kb3-bumper, .kb3-rbox')) { const q = e.getBoundingClientRect(); if (q.width) { l = Math.min(l, q.left); r = Math.max(r, q.right); } }
    // (the HUD is zoomed: the screen's px back into the box's own)
    const cs = getComputedStyle(box);
    if (r > l && bb.width) box.style.marginLeft = `${parseFloat(cs.marginLeft) - ((l + r) / 2 - (bb.left + bb.width / 2)) * parseFloat(cs.width) / bb.width}px`; };
  card.style.zIndex = 31; card.style.visibility = 'hidden';
  const cells = Object.values(S.kitCells);
  W.camLock = true;
  let phase = 'pre', autoT = 0, hand = null, kok = null, beat = null, done = null;
  const allOut = new Promise(r => { done = r; });
  const showHand = () => {
    if (hand || phase !== 'prompt') return;
    const lr = lay.getBoundingClientRect(), fr = front.getBoundingClientRect();
    hand = h('div', { class: 'hand tap kithand', html: ICON.hand, style: `left:${fr.left + fr.width * .55 - lr.left}px;top:${fr.top + fr.height * .35 - lr.top}px` }); lay.append(hand);
  };
  let mouth = null;   // (measured once, before the roof flies: the lid's face is how it's found)
  const launch = i => {
    const lr = lay.getBoundingClientRect();
    if (!mouth) { const lt = box.querySelector('.kb3-ltop').getBoundingClientRect(); mouth = { x: lt.left + lt.width / 2 - lr.left, y: lt.top + lt.height / 2 - lr.top }; }
    G.audio.sfx('pop', [2, 4, 3, 5, 4, 6][i % 6]); if (i % 4 === 0) haptic('tick');   // (퐁퐁 in a little tune)
    if (i % 3 === 0) A(box, [{ transform: 'none' }, { transform: 'scale(1.08, .88)', offset: .4 }, { transform: 'scale(.96, 1.06) translateY(-4px)', offset: .75 }, { transform: 'none' }], { duration: 150, easing: 'ease-out' });
    if (i === 0) {   // the first one blows the roof off
      G.audio.sfx('thump'); G.audio.sfx('special');
      A(lid, [{ transform: KB3_LID }, { transform: 'translate3d(-10px,-150px,0) rotateX(30deg) rotateZ(-70deg)', offset: .3 }, { transform: 'translate3d(300px,-900px,0) rotateX(250deg) rotateZ(-560deg)' }], { duration: 640, easing: 'cubic-bezier(.25,.1,.6,1)' });
      box.classList.add('open'); A(glowEl, [{ opacity: .4, transform: 'scale(1)' }, { opacity: 1, transform: 'scale(1.6)' }], { duration: 320, easing: 'ease-out' });
      const fl = h('div', { class: 'kitflash' }); lay.append(fl); outs.push(fl); A(fl, [{ opacity: .8 }, { opacity: 0 }], { duration: 220, easing: 'ease-out' });
      A(lay, [{ translate: '0 0', scale: '1' }, { translate: '-8px 5px', scale: '1.04' }, { translate: '6px -5px', scale: '1.02' }, { translate: '0 0', scale: '1' }], { duration: 260, easing: 'linear' });
    }
    for (let k = 0; k < (i % 4 ? 0 : 3); k++) {   // a puff at the mouth, now and then
      const a = (k / 4) * Math.PI * 2 + i, pf = h('i', { class: 'kitpuff', style: `left:${mouth.x}px;top:${mouth.y}px` }); lay.append(pf); outs.push(pf);
      A(pf, [{ transform: 'translate(-50%,-50%) scale(.3)', opacity: .9 }, { transform: `translate(calc(-50% + ${Math.cos(a) * 46}px), calc(-50% + ${Math.sin(a) * 30 - 16}px)) scale(1.2)`, opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.4,1)' });
    }
    // the box: up out of the truck, a moment at the top, then off on a light tail — every way, here then there (golden steps)
    const far = Math.hypot(lr.width, lr.height), ang = (-205 + ((i * .618) % 1) * 230) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
    const hx = ca * (i < 4 ? 40 : 74), hy = (i < 4 ? -46 : -88) - (i % 3) * 16 + sa * 30, ex = hx + ca * far, ey = hy + sa * far, UP = 120, HANG = 30, FLY = 330, D = UP + HANG + FLY, sc = .85 + (i % 4) * .14;
    const img = h('img', { class: 'kitfly truckbox', src: boxPic(G), style: `left:${mouth.x}px;top:${mouth.y}px` }); lay.append(img); outs.push(img);
    const at = (x, y, sc, r) => `translate(-50%,-50%) translate(${x}px,${y}px) scale(${sc}) rotate(${r}deg)`, spin = (i % 2 ? 1 : -1) * 220;
    // (out of the open cargo bed itself: seen from the start, just inside it — user 10/21 "트럭에서 나오게")
    A(img, [{ transform: at(0, 14, .5 * sc, 0), opacity: 1, easing: 'cubic-bezier(.15,.85,.3,1)' },  { transform: at(hx, hy, 1.35 * sc, spin * .1), opacity: 1, offset: UP / D, easing: 'ease-in-out' },
      { transform: at(hx * 1.05, hy - 8, 1.42 * sc, spin * .16), opacity: 1, offset: (UP + HANG) / D, easing: 'cubic-bezier(.35,0,.75,.55)' }, { transform: at(ex, ey, sc, spin * 2), opacity: 1 }], { duration: D });
    const tail = h('i', { class: 'kittrail', style: `left:${mouth.x + hx * 1.05}px;top:${mouth.y + hy - 8}px;width:${far}px` }); lay.append(tail); outs.push(tail);
    A(tail, [{ transform: `rotate(${ang}rad) scaleX(0)`, opacity: 1, easing: 'cubic-bezier(.35,0,.75,.55)' }, { transform: `rotate(${ang}rad) scaleX(1)`, opacity: 1, offset: FLY / (FLY + 300), easing: 'ease-out' },
      { transform: `rotate(${ang}rad) scale(1, .3)`, opacity: 0 }], { duration: FLY + 300, delay: UP + HANG });
    const k = Math.min(ca > 0 ? (lr.width - 16 - mouth.x - hx) / ca : ca < 0 ? (16 - mouth.x - hx) / ca : 1e9, sa > 0 ? (lr.height - 16 - mouth.y - hy) / sa : sa < 0 ? (16 - mouth.y - hy) / sa : 1e9);
    if (i % 2) { const sp = h('i', { class: 'kitspark', style: `left:${mouth.x + hx + ca * k}px;top:${mouth.y + hy + sa * k}px;z-index:34` }); lay.append(sp); outs.push(sp);
    A(sp, [{ transform: 'translate(-50%,-50%) scale(0) rotate(0)' }, { transform: 'translate(-50%,-50%) scale(1.2) rotate(45deg)', offset: .35 }, { transform: 'translate(-50%,-50%) scale(0) rotate(90deg)' }], { duration: 420, delay: UP + HANG + FLY * .8, easing: 'ease-out' }); }
    if (i % 3 === 0) setTimeout(() => G.audio.sfx('swish'), UP + HANG);
    count.textContent = `이삿짐 ${NB - 1 - i}`;
    A(count, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: .4 }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
  };
  const tapped = () => {   // one tap: they all pour out
    if (phase !== 'prompt') return;
    phase = 'out'; clearTimeout(autoT); hand?.remove(); hand = null; kok?.classList.add('gone');
    for (let i = 0; i < NB; i++) setTimeout(() => { if (!S.dead) launch(i); }, i * GAP);
    setTimeout(done, (NB - 1) * GAP + 380);
  };
  lay.addEventListener('pointerdown', tapped);
  try {
    if (!covered) { G.audio.sfx('swish'); await A(lay, [{ opacity: 0, transform: 'scale(1.18)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.9,.3,1)' }); }
    centre();
    // 부릉: in, a little overshoot, a bounce on its wheels, dust
    G.audio.sfx('whoosh');
    // (with the talk: the empty street shows first, so the truck pulls in after the iris has opened, not behind it)
    if (talk) { await wait(900); if (S.dead) throw 0; }
    // (cab first both ways — ① 10/23: "트럭이 오른쪽에서 후진으로 들고 남"): in from the left, out to the right
    await A(box, [{ transform: 'translateX(-120vw)' }, { transform: 'translateX(14px)', offset: .78 }, { transform: 'translateX(0) scale(1.05,.92)', offset: .88 }, { transform: 'none' }], { duration: quick ? 420 : 620, easing: 'cubic-bezier(.2,.8,.3,1)' });
    G.audio.sfx('land'); haptic('tick');
    { const r = front.getBoundingClientRect(); W.fx.burst(r.left + r.width / 2, r.bottom - 6, { n: 14, shape: 'circle', colors: ['#ffffff', '#f3e6d6', '#e9d6c0'], speed: 200, up: 20, gravity: 300, size: 10, life: .5 }); }
    if (S.dead) throw 0;
    phase = 'prompt';
    if (talk) {
      await playDialog(G, talk, { parent: lay }); if (S.dead) throw 0;
      tapped();
    } else {
    beat = cube.animate([{ transform: TRUCK_VIEW }, { transform: TRUCK_VIEW + ' scale3d(1.05,1.05,1.05)', offset: .18 }, { transform: TRUCK_VIEW, offset: .36 }], { duration: 900, iterations: Infinity });
    const lr = lay.getBoundingClientRect(), fr = box.getBoundingClientRect();
    kok = h('div', { class: 'kitkok ol truckcta', style: `left:${fr.left + fr.width / 2 - lr.left}px;top:${fr.top - lr.top - 18}px` }, '트럭을 터치!'); lay.append(kok);
    showHand();
    G.audio.sfx('heart');
    autoT = setTimeout(tapped, G.bot || S.botOn?.() ? 500 : 15000);   // (a bot, or nobody for 15 s: it pours by itself)
    }
    await allOut; if (S.dead) throw 0;
    beat?.cancel(); kok?.remove(); hand?.remove();
    // (with the talk: the room under the wipe is seen close on the pile, and pulls back once it's clear)
    const v0 = { target: W.target.clone(), zoom: W.zoom };
    if (talk && S.kitPile) { W.target.copy(S.kitPile.at).setY(v0.target.y); W.zoom = v0.zoom * 1.9; W.shadowDirty = true; }
    // the last one gone: the truck drives off, a bright band wipes across, and behind it is the room
    G.audio.sfx('whoosh');
    A(box, [{ transform: 'none' }, { transform: 'translateX(140vw)' }], { duration: 520, easing: 'cubic-bezier(.5,0,.8,.4)' });
    await wait(220);
    card.style.transform = 'translateX(-50%) translateY(140%)'; card.style.visibility = '';
    G.audio.sfx('star');
    const band = h('div', { class: 'kitwipe' }); (lay.parentElement || lay).append(band); outs.push(band);
    const WIPE = 440, poly = p => `polygon(${p}% 0, 130% 0, 130% 100%, ${p - 30}% 100%)`;
    A(band, [{ left: '-30%' }, { left: '130%' }], { duration: WIPE, easing: 'cubic-bezier(.45,.05,.55,.95)' });
    await A(lay, [{ clipPath: poly(-10) }, { clipPath: poly(160) }], { duration: WIPE, easing: 'cubic-bezier(.45,.05,.55,.95)' });
    lay.classList.add('clear');
    if (talk) { const back = W.flyTo(S.tw, { target: v0.target, zoom: v0.zoom, dur: 1.4, e: ease.inOutCubic }); if (S.kitPile && !S.dead) await dropPile(S); await back; }
    else if (S.kitPile && !S.dead) { await dropPile(S); if (!quick && !G.bot && !S.dead) await pileWow(S); }   // 쿵쿵쿵: the pile goes up — and, the first time, whoa
    G.audio.sfx('swish');
    await A(card, [{ transform: 'translateX(-50%) translateY(140%)' }, { transform: 'translateX(-50%) translateY(-6px)', offset: .75 }, { transform: 'translateX(-50%)' }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1)' });
  } catch {}
  clearTimeout(autoT); beat?.cancel();
  box.style.visibility = 'hidden';
  for (const a of anims) { try { a.cancel(); } catch {} }
  outs.forEach(o => o.remove());
  for (const b of S.kitPile?.boxes || []) { b.visible = true; b.position.copy(b.userData.home); }
  W.idsDirty = true; W.shadowDirty = true; W.camLock = false;
  cells.forEach(c => c.classList.remove('full', 'pop'));
  card.style.visibility = ''; card.style.zIndex = ''; card.style.transform = '';
  lay.removeEventListener('pointerdown', tapped);
  lay.classList.add('out'); setTimeout(() => lay.remove(), 260);
}

// ── where it's built: an open tile the view sees whole (feet, middle, head and both sides), with room either side for the
// friend and 몽글이 to stand and watch; front tiles and tiles near the friend win ties. The view may turn up to 90° for
// one (an orthographic view: whether something is in the way depends on the angle only, not on where the camera looks).
const SIDE = .86;   // (the build's close view: whoever watches stands clear of the robot)
function buildSpot(S, reach = 0) {
  const t0 = performance.now(), W = S.G.world, f = S.friend.root.position, rc = S.room.center || new THREE.Vector3();
  let tiles = (S.freeTiles || []).filter(t => (t.R?.clearAt ? t.R.clearAt(t.x, t.z, .45) : true));
  // (a map may name where its kit is built — 19판 소방서: the search kept picking the island's back corner, the friends pressed against the
  // truck, 사용자 10/29 "막 겹치는 것 같기도 하고, 안정적으로… 제발"): only the open tiles near that point are tried
  const KA = S.room.L?.kitAt; if (KA) { const near = tiles.filter(t => Math.hypot(t.x - KA[0], t.z - KA[1]) < 1.2); if (near.length) tiles = near; else if (!S.room.clearAt || S.room.clearAt(KA[0], KA[1], .45)) tiles = [{ x: KA[0], z: KA[1], y: 0, R: S.room }]; }
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
      const inRoom = (x, z) => !t.R?.group || (Math.abs(x - t.R.group.position.x) < t.R.w / 2 - .15 && Math.abs(z - t.R.group.position.z) < t.R.d / 2 - .15);   // (clearAt says yes past the room's edge)
      const room = k => { const q = at(k * (SIDE + (k > 0 ? reach : 0)), 0); return inRoom(q.x, q.z) && (!t.R?.clearAt || t.R.clearAt(q.x, q.z, .28)) && seen(at(k * SIDE, .35)); };
      const c = clutter(new THREE.Vector3(t.x, y + .4, t.z), side, up, view);
      const front = !t.R?.clearAt || t.R.clearAt(t.x + toCam.x * .6, t.z + toCam.z * .6, .34);
      // (room before it on the camera's side: on a small map's front edge the room's low front wall cut the friends' feet and
      // the group sat at the screen's bottom — 11판 냥냥이 부엌, QA 10/20)
      const margin = inRoom(t.x + toCam.x * 1.1, t.z + toCam.z * 1.1);
      const score = (room(1) ? 5 : 0) + (room(-1) ? 5 : 0) + (t.R?.clearAt?.(t.x, t.z, .7) ? 1 : 0) - c * 1.1 - (front ? 0 : 6)
        + .25 * ((t.x - rc.x) * toCam.x + (t.z - rc.z) * toCam.z) - .15 * Math.hypot(t.x - f.x, t.z - f.z) - di * .6 - (margin ? 0 : 16);   // (heavier than clutter: what is in front steps aside anyway, the room's edge does not)
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
async function gather(S, P, R, yaw, dF = SIDE, dH = SIDE) {
  const side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), toCam = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));   // screen-right, towards the camera
  const inRoom = q => !R?.group || (Math.abs(q.x - R.group.position.x) < R.w / 2 - .2 && Math.abs(q.z - R.group.position.z) < R.d / 2 - .2);
  const clear = q => inRoom(q) && (!R?.clearAt || R.clearAt(q.x, q.z, .28));
  // beside the model on its side; else a step back on that side; else in the room at least (never past its edge: a friend
  // stood half through 11판's wall — QA 10/20)
  const near = (k, d0 = SIDE) => {
    const qs = [d0, d0 + .1, d0 + .2, d0 + .35, d0 + .5].map(d => P.clone().addScaledVector(side, k * d).addScaledVector(toCam, -.1));
    const back = [.35, .55].map(b => P.clone().addScaledVector(side, k * d0).addScaledVector(toCam, -b));
    const tuck = [.35, .55].map(b => P.clone().addScaledVector(side, k * d0 * .6).addScaledVector(toCam, -b));
    const wide = [k, -k].flatMap(g => [0, .1, .2, .3, .4, .5, .6, .8, 1, 1.2, 1.5, 1.8].flatMap(e => [-.1, -.3, .1, -.5, .3, -.7].map(a => P.clone().addScaledVector(side, g * (d0 + e)).addScaledVector(toCam, a))));
    const open = q => clear(q) && !taken.some(o => Math.hypot(o.x - q.x, o.z - q.z) < .55);   // (a cramped spot, 19판's island corner: further along either side, never behind the model — 10/29)
    return qs.find(open) || back.find(open) || wide.find(open) || tuck.find(open) || qs.concat(back).find(inRoom) || P.clone().addScaledVector(toCam, -.45);
  };
  // in the way: close to the spot, or anywhere between it and the camera (an orthographic view)
  const inWay = q => { const dx = q.x - P.x, dz = q.z - P.z, along = dx * toCam.x + dz * toCam.z, lat = dx * side.x + dz * side.z; return Math.hypot(dx, dz) < 1.1 || (along > -.25 && Math.abs(lat) < .6); };
  const taken = [];
  const free = from => (S.freeTiles || []).map(t => new THREE.Vector3(t.x, t.y || 0, t.z))
    .filter(q => !inWay(q) && Math.hypot(q.x - P.x, q.z - P.z) > 1.2 && !taken.some(o => o.distanceTo(q) < .7))
    .sort((u, v) => u.distanceTo(from) - v.distanceTo(from))[0] || null;
  const jobs = [];
  const fTo = near(1, dF); taken.push(fTo); jobs.push(poofTo(S, S.friend, fTo, yaw));
  // 몽글이 beside the spot on the other side, the locals off to a free tile — whoever would stand in the shot. (Wait for a
  // walk under way to end first: 몽글이 walks towards the middle of the view, and the last find may have set it off right
  // into the spot; after the clear nobody starts a new one.)
  const hero = S.hero;
  for (let i = 0; i < 20 && hero?.busy; i++) await S.tw.wait(.1);
  for (const n of S.npcs || []) if (n !== S.villain) n.on = false;   // (the walkers stop for the build: none walks back into it — 10/29)
  for (let i = 0; i < 12 && (S.npcs || []).some(n => n.next); i++) await S.tw.wait(.1);
  if (hero?.ch) {   // (always, to the other side: the three of them in the picture together — user 10/20, 8판)
    const to = near(-1, dH);
    taken.push(to); hero.t = hero.nearest(to.x, to.z) || hero.t; jobs.push(poofTo(S, hero.ch, to, yaw));
  }
  for (const n of [...(S.npcs || []), ...(hero?.buddy?.root?.visible ? [{ ch: hero.buddy }] : [])]) {
    if (!n.ch?.root || n === S.villain || !inWay(n.ch.root.position)) continue;
    const to = free(n.ch.root.position);
    if (to) { taken.push(to); n.t = (S.freeTiles || []).find(t => Math.hypot(t.x - to.x, t.z - to.z) < .01) || n.t; jobs.push(poofTo(S, n.ch, to, yaw)); }
    else { const ch = n.ch, s0 = ch.root.scale.x; jobs.push(S.tw.run(.14, k => ch.root.scale.setScalar(Math.max(.01, s0 * (1 - k)))).then(() => { ch.root.visible = false; ch.root.scale.setScalar(s0); })); }   // (nowhere to go: out of the picture for now)
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
// the build's view (10/20, user on the phone: "조립할 때 구도를 잘 잡아 줘. 모델이 가운데에 크게, 잘리지 않게"): the model's
// middle half way between the top bar and the board, about a third of the screen tall and never wider than most of it.
// (The view zooms about its frustum's middle, not its target — world.js applyFrustum cy — so the target is set where it
// lands; a height h stands h·cos(pitch) tall on the screen.)
function buildView(S, P, hW, wW, midY, pitch) {
  const W = S.G.world, vh = W.viewH || 11, cy = W.fit?.cy ?? .46, cp = Math.max(.3, Math.cos(pitch));
  const H = S.col?.clientHeight || innerHeight, wide = (S.col?.clientWidth || innerWidth) / H, card = S.tray;
  const top = .15, bot = card ? Math.min(.8, Math.max(.5, card.offsetTop / H)) : .72, Y = (top + bot) / 2;
  const F = Math.min(.4, (bot - top) * .66, .84 * hW * cp * wide / Math.max(.01, wW));
  const zoom = Math.max(1.2, Math.min(16, vh * F / (hW * cp))), atT = .5 + (cy - .5) * zoom;   // (8 was too low: a room drawn small left the robot a fifth of the screen)
  return { target: new THREE.Vector3(P.x, midY - (atT - Y) * (vh / zoom) / cp, P.z), zoom, Y };
}
// the view's target nudged so the given point lands exactly where it should on the screen (the middle across, Y down):
// the camera is set there for a moment, the point measured, the target moved by the measured slope, twice; then the view
// is put back. (The worked-out target was right in big rooms; in 11판's small kitchen the group sat at the screen's
// bottom — QA 10/20)
function aimView(S, view, yaw, pitch, at) {
  const W = S.G.world, save = { yaw: W.yaw, pitch: W.pitch, zoom: W.zoom, target: W.target.clone() };
  const up = new THREE.Vector3(-Math.sin(pitch) * Math.sin(yaw), Math.cos(pitch), -Math.sin(pitch) * Math.cos(yaw)), side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const put = t => { W.yaw = yaw; W.pitch = pitch; W.zoom = view.zoom; W.target.copy(t); W.updateCam(); return W.toScreen(at); };
  const want = { x: innerWidth / 2, y: view.Y * innerHeight }, t = view.target.clone();
  for (let i = 0; i < 2; i++) {
    const s0 = put(t), sy = put(t.clone().addScaledVector(up, .05)), sx = put(t.clone().addScaledVector(side, .05));
    const jy = (sy.y - s0.y) / .05, jx = (sx.x - s0.x) / .05;
    if (Math.abs(jy) > 1e-3) t.addScaledVector(up, -(s0.y - want.y) / jy);
    if (Math.abs(jx) > 1e-3) t.addScaledVector(side, -(s0.x - want.x) / jx);
  }
  W.yaw = save.yaw; W.pitch = save.pitch; W.zoom = save.zoom; W.target.copy(save.target); W.updateCam();
  view.target.copy(t);
  return view;
}
// 파르페's angle for the build: it stands where it stands, so the angle is what's picked — of the room's views round it, the
// nearest with nothing in front of the glass and the glass seen whole (QA 10/20: from the hunt's last angle a monstera stood
// in front of it)
function standView(S, P, hW, wW, own) {
  const W = S.G.world, y0 = W.yaw, p0 = W.pitch, roots = [S.room.group], pitch = Math.min(Math.max(p0, .45), .8);
  const mine = o => { for (let q = o; q; q = q.parent) if (q === own) return true; return false; };   // (its own glass isn't in the way)
  const boxes = [];
  S.room.group.traverse(o => { if (o.userData.furn && o.userData.furn.group === o) { const b = new THREE.Box3().setFromObject(o); if (!b.isEmpty() && b.max.y - b.min.y > .1) boxes.push(b); } });
  const ray = new THREE.Ray(), hit = new THREE.Vector3();
  const seen = q => { const s = W.toScreen(q); const x = W.pick(s.x, s.y, roots).find(x => !x.object.userData.proxy && !mine(x.object)); return !x || x.distance > W.raycaster.ray.origin.distanceTo(q) - .12; };
  let best = null;
  W.pitch = pitch;
  [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI * .75, -Math.PI * .75, Math.PI].forEach((d, di) => {
    const yaw = y0 + d; W.yaw = yaw; W.updateCam();
    const cp = Math.cos(pitch), sp = Math.sin(pitch), side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), view = new THREE.Vector3(cp * Math.sin(yaw), sp, cp * Math.cos(yaw));
    let n = 0;
    for (const k of [-.5, -.25, 0, .25, .5]) for (const u of [.05, .3, .55, .8, 1]) {
      const q = new THREE.Vector3(P.x, P.y + u * hW, P.z).addScaledVector(side, k * wW);
      ray.origin.copy(q).addScaledVector(view, 20); ray.direction.copy(view).negate();
      for (const b of boxes) if (!b.containsPoint(q) && ray.intersectBox(b, hit) && hit.distanceTo(ray.origin) < 19.9) { n++; break; }   // (a box round the glass itself — a counter it stands by — isn't in front)
    }
    const whole = [.1, .5, .9].every(u => seen(new THREE.Vector3(P.x, P.y + u * hW, P.z)));
    const score = n + (whole ? 0 : 30) + di * .4;
    if (!best || score < best.score) best = { yaw, score, n, whole };
  });
  W.yaw = y0; W.pitch = p0; W.updateCam();
  S.kitSpot = { yaw: +best.yaw.toFixed(2), clutter: best.n, whole: best.whole };   // (QA)
  return { yaw: best.yaw, pitch };
}
// the build's shot kept clear (10/20, user on the phone: "조립할 때도 강제 뷰… 잘 안 보일 때가 많아" — a pot plant over the
// build, 곰돌이 cut by the screen's edge): furniture in front of the model or the floor before it steps aside (shrinks
// away, a puff) — and for a see-through model (파르페's glass) whatever stands just behind it too — and anyone half in the
// picture goes wholly out of it. The furniture stays aside after: the win's close-up and the result come next, and a
// table popping back in front of the robot spoiled the close-up (QA 10/20).
function clearShot(S, P, hW, wW, midY, yaw, pitch, own) {
  const G = S.G, W = G.world, tw = S.tw, cp = Math.cos(pitch), sp = Math.sin(pitch);
  const side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), view = new THREE.Vector3(cp * Math.sin(yaw), sp, cp * Math.cos(yaw)), up = new THREE.Vector3(-sp * Math.sin(yaw), cp, -sp * Math.cos(yaw));
  const mine = o => { for (let q = o; q; q = q.parent) if (q === own) return true; return false; };
  const furn = [];
  S.room.group.traverse(o => { if (o.userData.furn && o.userData.furn.group === o && o.visible && !mine(o)) { const b = new THREE.Box3().setFromObject(o); if (!b.isEmpty() && b.max.y - b.min.y > .08) furn.push({ o, b }); } });
  const ray = new THREE.Ray(), hit = new THREE.Vector3(), c = new THREE.Vector3(), aside = new Set();
  const mid = new THREE.Vector3(P.x, midY, P.z), span = Math.max(wW, hW * .6);
  for (const k of [-.75, -.4, 0, .4, .75]) for (const u of [-.8, -.5, -.2, .1, .4, .65]) {   // (over the model, and the floor before it down to the board)
    const q = mid.clone().addScaledVector(side, k * span).addScaledVector(up, u * hW);
    ray.origin.copy(q).addScaledVector(view, 20); ray.direction.copy(view).negate();
    for (const f of furn) {
      if (aside.has(f)) continue;
      const d = f.b.containsPoint(q) ? null : ray.intersectBox(f.b, hit) ? hit.distanceTo(ray.origin) : 1e9;
      const inWay = d === null ? f.b.getCenter(c).sub(q).dot(view) > 0 || !!own : d < 19.98 || (!!own && d < 21.6);   // (behind a glass, within 1.6 m, shows through it)
      if (inWay) aside.add(f);
    }
  }
  const out = [...aside].map(({ o }) => {
    const s0 = o.scale.clone(), p = W.toScreen(new THREE.Box3().setFromObject(o).getCenter(c));
    W.fx.burst(p.x, p.y, { n: 10, shape: 'circle', colors: ['#ffffff', '#f3ecff', '#e9dcc8'], speed: 150, up: 30, size: 9, life: .4 });
    tw.run(.26, k => o.scale.copy(s0).multiplyScalar(Math.max(.001, 1 - ease.inBack(k))), ease.linear).then(() => { o.visible = false; o.scale.copy(s0); W.idsDirty = true; W.shadowDirty = true; });
    return { o, s0 };
  });
  if (out.length) G.audio.sfx('swish');
  // whoever is half in the picture: wholly out of it, on the nearest free tile that is (the win's close-up finds the friend
  // wherever they are)
  const sw = innerWidth, sh = innerHeight, ox = 0;   // (the room's canvas fills the window, past the HUD's column)
  const rectOf = o => { const b = new THREE.Box3().setFromObject(o); let l = 1e9, r = -1e9, t = 1e9, bt = -1e9;
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const s = W.toScreen(new THREE.Vector3(x, y, z)); l = Math.min(l, s.x); r = Math.max(r, s.x); t = Math.min(t, s.y); bt = Math.max(bt, s.y); }
    return { l, r, t, b: bt }; };
  const offScreen = q => q.r < ox || q.l > ox + sw || q.b < 0 || q.t > sh;
  const half = q => !offScreen(q) && (q.l < ox + 4 || q.r > ox + sw - 4 || q.t < 4);
  const taken = [];
  for (const ch of [...(S.npcs || []).filter(n => n !== S.villain).map(n => n.ch), S.hero?.buddy]) {   // (the friend and 몽글이 stand in it on purpose)
    if (!ch?.root?.visible) continue;
    const r0 = rectOf(ch.root);
    if (!half(r0)) continue;
    const at = ch.root.getWorldPosition(new THREE.Vector3()), s0 = W.toScreen(at);
    const to = (S.freeTiles || []).map(t => new THREE.Vector3(t.x, t.y || 0, t.z)).filter(q => !taken.some(o => o.distanceTo(q) < .6) && Math.hypot(q.x - P.x, q.z - P.z) > .8)
      .map(q => { const s1 = W.toScreen(q), dx = s1.x - s0.x, dy = s1.y - s0.y; return { q, r: { l: r0.l + dx, r: r0.r + dx, t: r0.t + dy, b: r0.b + dy } }; })
      .filter(x => offScreen(x.r)).sort((u, v) => u.q.distanceTo(at) - v.q.distanceTo(at))[0];
    if (to) { taken.push(to.q); poofTo(S, ch, to.q, yaw); }
  }
  return out.length;
}
export async function kitBuild(S) {
  const G = S.G, W = G.world, tw = S.tw, K = KITS[S.kit.kit], B = K.build || {}, f = S.friend, card = S.tray, cells = S.kitCells;
  const stack = K.type === 'stack';   // (파르페: no model to put up — each topping goes onto its layer of the glass)
  const RSk = RS * (K.scale || 1);   // (a kit's own size: the fire truck is found outdoors and shown bigger)
  const st = S.kitState = { phase: 'build', placed: 0, total: K.order.length, drops: 0, taps: 0 };
  W.camLock = true;
  const off = [], flying = [];
  let manual = null, hand = null;
  try {
    card?.classList.add('done');
    await tw.wait(.3); if (S.dead) return;
    const PF = stack ? S.kitParfait : null;
    let spot;
    if (stack) {
      const p = PF.g.getWorldPosition(new THREE.Vector3()), bb = new THREE.Box3().setFromObject(PF.g), sz = bb.getSize(new THREE.Vector3());
      spot = { p, tile: null, ...standView(S, new THREE.Vector3(p.x, bb.min.y, p.z), sz.y, Math.max(sz.x, sz.z), PF.g) };
    } else spot = buildSpot(S, K.id === 'firetruck' ? .3 : 0);
    const { p: P, yaw, pitch, tile } = spot;
    f.setFace('wow'); f.bump?.(.4);
    const goBub = S.say(f, S.kit.go || KIT_GO[K.id] || '다 모았다!', 1600); G.audio.sfx('special');
    card?.classList.remove('done');
    const side = S.col?.querySelector('.side'); if (side) { side.style.visibility = 'hidden'; off.push(() => { side.style.visibility = ''; }); }   // (the hint button: nothing to look for now, and the board is wide)
    if (card) { card.classList.add('build'); card.animate([{ transform: 'translateX(-50%) translateY(30px) scale(.92)', opacity: .6 }, { transform: 'translateX(-50%)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,1.4,.4,1)' }); }
    Object.values(cells).forEach(c => c.classList.add('ready'));
    // the view, the board now up: the whole model (every piece in place) or the whole glass, big in the space left
    const gs = S.room.group.getWorldScale(new THREE.Vector3()).y;
    let hW, wW, midY;
    if (stack) { const bb = new THREE.Box3().setFromObject(PF.g), sz = bb.getSize(new THREE.Vector3()); hW = sz.y; wW = Math.max(sz.x, sz.z); midY = (bb.min.y + bb.max.y) / 2; }
    else { const bb = K._bb ??= new THREE.Box3().setFromObject(buildKitModel(K.id)), sz = bb.getSize(new THREE.Vector3()), RS = RSk; hW = sz.y * RS * gs; wW = Math.max(sz.x, sz.z) * RS * gs; midY = P.y + (bb.min.y + sz.y / 2) * RS * gs; }
    // …with the friend and 몽글이 close either side of it: the three of them in the picture (10/20, user: "스테이지 8에서도 그
    // 구도를 주인공이랑 캐릭 다 좀 모이게 해서 ㅋㅋ 처음엔 그리 나왔는데 지금은 로봇밖에 안 나와" — since the build view was
    // made model-only and big, they stood off the screen's edges)
    const dims = ch => { if (!ch?.root) return { r: 0, h: 0 }; const z = new THREE.Box3().setFromObject(ch.root).getSize(new THREE.Vector3()); return { r: Math.min(Math.max(z.x, z.z) / 2, z.y * .45), h: z.y }; };
    const roll = K.id === 'firetruck' ? .3 : 0;   // (the fire truck rolls .22 m to the friend's side when done: they stand past it, no hop aside — 10/29)
    const fd = dims(f), hd = dims(S.hero?.ch), dF = wW / 2 + fd.r + .04 + roll, dH = wW / 2 + hd.r + .08;
    const right = dF + fd.r, left = S.hero?.ch ? dH + hd.r : wW / 2;
    const sideV = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), Pc = P.clone().addScaledVector(sideV, (right - left) / 2);
    const top = Math.max(midY + hW / 2, P.y + fd.h, P.y + hd.h), bottom = Math.min(midY - hW / 2, P.y);
    const gW = right + left, gH = top - bottom, gMid = (top + bottom) / 2;
    const view = aimView(S, buildView(S, Pc, gH, gW, gMid, pitch), yaw, pitch, new THREE.Vector3(Pc.x, gMid, Pc.z));
    S.kitView = { zoom: +view.zoom.toFixed(2), gH: +gH.toFixed(2), gW: +gW.toFixed(2), hW: +hW.toFixed(2), wW: +wW.toFixed(2), f: [+fd.r.toFixed(2), +fd.h.toFixed(2)], m: [+hd.r.toFixed(2), +hd.h.toFixed(2)] };   // (QA)
    W.zoomGoal = null; W.yawGoal = null; W.vYaw = 0;
    await Promise.all([W.flyTo(tw, { target: view.target, yaw, pitch, zoom: view.zoom, dur: .7, e: ease.inOutCubic }), gather(S, P, tile?.R, yaw, dF, dH)]);
    if (S.dead) return;
    const hold = () => { W.yaw = yaw; W.pitch = pitch; W.zoom = view.zoom; W.target.copy(view.target); W.zoomGoal = null; W.yawGoal = null; W.vYaw = 0; };   // (the build's view stays put to the end — 10/29 "안정적으로")
    st.aside = clearShot(S, Pc, gH, gW, gMid, yaw, pitch, stack ? PF.g : null);   // (QA: how many stepped aside)
    { const q = P.clone().addScaledVector(new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), 1.4); f.faceTo?.(q.x, q.z); S.hero?.ch?.faceTo?.(q.x, q.z); }   // (turned to the model's front, half to us: faces, not backs)
    const face = Math.atan2(W.cam.position.x - P.x, W.cam.position.z - P.z), local = v => S.room.group.worldToLocal(v.clone());
    let R = null, glow = null;
    const pcs = {};
    if (stack) for (const key of K.order) pcs[key] = { key, done: false, busy: false, L: PF.layers[key] };
    else {
    // a little green work mat under the robot
    const mat = buildMat(.82, .62); mat.position.copy(local(P)); mat.rotation.y = face; S.room.group.add(mat);
    // the model: a group at the spot, facing the camera; one pivot per piece, at the piece's joint
    R = new THREE.Group(); R.position.copy(local(P)); R.position.y += .013; R.rotation.y = face; R.scale.setScalar(RSk);
    const sh = blobShadow(.2, .3); sh.scale.set(.42, .42, 1); R.add(sh);
    S.room.group.add(R); R.updateMatrixWorld(true);
    S.kitModel = R;
    glow = buildKitGlow(K.id); glow.g.visible = false;
    for (const key of K.order) {
      const J = new THREE.Vector3(...K.parts[key].joint), C = new THREE.Box3().setFromObject(buildKitPart(K.id, key)).getCenter(new THREE.Vector3());
      let ghost = null, gm = null;
      if (B.ghost) {   // (a kit may still want the see-through model — off for the robot: the user didn't like it)
        ghost = buildKitPart(K.id, key); gm = new THREE.MeshBasicMaterial({ color: GHOST, transparent: true, opacity: .32, depthWrite: false });
        ghost.traverse(o => { if (o.isMesh) { o.material = gm; o.castShadow = false; o.renderOrder = 2; } }); R.add(ghost);
      }
      pcs[key] = { key, J, C, ghost, mat: gm, pv: null, done: false, busy: false };
    }
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
    const at0 = c => stack ? W.toScreen(new THREE.Box3().setFromObject(c.L).getCenter(new THREE.Vector3())) : scrOf(c.C);   // (where a piece goes, on the screen)
    const spotOf = {}; if (!stack) for (const k of K.order) spotOf[k] = at0(pcs[k]);
    const at = c => spotOf[c.key] || at0(c);   // (measured once, the model at rest: a piece lands on the same point however the model squashes)
    const hpx = stack ? Math.abs(W.toScreen(new THREE.Vector3(P.x, midY - hW / 2, P.z)).y - W.toScreen(new THREE.Vector3(P.x, midY + hW / 2, P.z)).y)
      : Math.abs(scrOf(new THREE.Vector3(0, 0, 0)).y - scrOf(new THREE.Vector3(0, .7, 0)).y);   // the model's height on screen
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
      if (stack) popLayer(S, c.key);
      else {
        c.pv = makePiece(c.key); c.pv.position.copy(c.J);
        tw.run(.22, k => c.pv.scale.setScalar(1.3 - .3 * ease.outBack(k)), ease.linear).then(() => c.pv && c.pv.scale.setScalar(1));
      }
      c.done = true; c.busy = false; st.placed++;
      if (c.ghost) c.ghost.visible = false; squash = 1;
      G.audio.sfx('latch'); G.audio.sfx('pop', 3 + st.placed); haptic('ok');
      const s = at(c); W.fx.burst(s.x, s.y, { n: 16, shape: 'star', colors: ['#ffe14d', '#ffffff', '#8fd3f4'], speed: 260, gravity: 0, life: .45, size: 11 });
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
      const t = at(c), size = Math.max(56, Math.min(120, hpx * .42)), img = h('img', { class: 'kitfly', src: pic(c.key), style: `left:${x0 - size / 2}px;top:${y0 - size / 2}px;width:${size}px;height:${size}px` });
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
      hold();
      squash = Math.max(0, squash - dt / .16);
      const sq = Math.sin(squash * Math.PI) * .04;
      if (R) R.scale.set(RSk * (1 + sq * .5), RSk * (1 - sq), RSk * (1 + sq * .5));
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
    if (stack) {   // 파르페: done — hearts all round, its owner cheers
      const s = W.toScreen(new THREE.Vector3(P.x, midY + hW * .4, P.z));
      G.audio.sfx('unlock'); haptic('big');
      W.fx.burst(s.x, s.y, { n: 26, shape: 'heart', colors: ['#ff8fb8', '#ffe14d', '#ffffff'], speed: 300, life: .7, size: 11 }); W.fx.ring(s.x, s.y, { r: 110, color: '#ffffff', width: 8 });
      f.pose = 'cheer'; f.setFace?.('happy'); f.bump?.(.5);
      await tw.wait(.8);
    } else await comeAlive(S, R, pcs, glow, P);
    // (no going back out to the whole room after: the win's close-up goes from here to the friend — user 10/20 "깨면 집
    // 풀샷으로 넘어가지 말고 친구 쪽으로")
  } finally { off.forEach(fn => fn()); flying.forEach(i => i.remove()); hand?.remove(); manual?.remove(); W.camLock = false; }
}
const NIP_SVG = '<svg viewBox="0 0 64 64"><path d="M30 34 L12 58 Q8 62 13 62 L33 38 Z" fill="#ff8fb8" stroke="#3a2453" stroke-width="4" stroke-linejoin="round"/><path d="M34 34 L52 58 Q56 62 51 62 L31 38 Z" fill="#ff8fb8" stroke="#3a2453" stroke-width="4" stroke-linejoin="round"/><g class="jaw"><path d="M29 36 L26 8 Q32 4 33 12 L33 36 Z" fill="#cfd6e6" stroke="#3a2453" stroke-width="4" stroke-linejoin="round"/></g><g class="jaw2"><path d="M35 36 L38 8 Q32 4 31 12 L31 36 Z" fill="#e6ebf5" stroke="#3a2453" stroke-width="4" stroke-linejoin="round"/></g><circle cx="32" cy="36" r="4" fill="#ffe14d" stroke="#3a2453" stroke-width="3"/></svg>';
// it comes alive: eyes on, a hop, a wave with the fist, a spin — then it stays and idles (while the result panel is up)
async function comeAlive(S, R, pcs, glow, P) {
  const id = S.kit.kit;
  if (id === 'cattower') return catUp(S, R, pcs, P);
  if (id === 'firetruck') return truckGo(S, R, pcs, glow);
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

// 캣타워 done: 냥냥이 jumps up into the top bed — a hop from where it stands, a squash as it lands, the pom-pom swinging —
// and stays up there, purring (the win's shot takes it there with 몽글이 beside the tower)
async function catUp(S, R, pcs, P) {
  const G = S.G, W = G.world, tw = S.tw, f = S.friend;
  G.audio.sfx('unlock'); haptic('big');
  const s = W.toScreen(R.localToWorld(new THREE.Vector3(0, .35, .1)));
  W.fx.burst(s.x, s.y, { n: 26, shape: 'heart', colors: ['#ff9fbe', '#ffe14d', '#ffffff', '#8fe3c8'], speed: 300 }); W.fx.ring(s.x, s.y, { r: 110, color: '#ffffff', width: 8 });
  const ball = pcs.ball?.pv;
  if (f?.root) {
    f.setFace?.('wow'); f.bump?.(.4); await tw.wait(.35); if (S.dead) return;
    const p0 = f.root.position.clone(), p1 = R.localToWorld(new THREE.Vector3(-.07, .475, 0)), hop = Math.max(.35, p1.y - p0.y + .3);
    f.faceTo?.(p1.x, p1.z); G.audio.sfx('hop');
    await tw.run(.6, k => { f.root.position.lerpVectors(p0, p1, k); f.root.position.y = p0.y + (p1.y - p0.y) * k + Math.sin(k * Math.PI) * hop; W.lastActive = performance.now(); }, ease.inOutQuad);
    if (S.dead) return;
    G.audio.sfx('land'); haptic('tick');
    const q = W.toScreen(p1); W.fx.burst(q.x, q.y, { n: 10, shape: 'circle', colors: ['#ffffff', '#fff1d6'], speed: 140, up: 40, size: 8, life: .4 });
    f.faceTo?.(W.cam.position.x, W.cam.position.z); f.pose = 'cheer'; f.setFace?.('happy'); f.bump?.(.5);
  }
  await tw.run(1.1, k => { R.scale.set(R.scale.x, R.scale.x * (1 - Math.sin(Math.min(1, k * 4) * Math.PI) * .05), R.scale.x); if (ball) ball.rotation.z = Math.sin(k * 14) * .5 * (1 - k); W.lastActive = performance.now(); }, ease.linear);
  if (ball) ball.rotation.z = 0;
}
// 미니 소방차 done: the light on the roof flashes red-blue, a siren's whoop, it rolls forward a little (the wheels turn) and
// back, and the cannon sprays an arc of water
async function truckGo(S, R, pcs, glow) {
  const G = S.G, W = G.world, tw = S.tw, f = S.friend;
  G.audio.sfx('unlock'); haptic('big'); G.audio.sfx('special');
  const lights = glow.g.children; glow.g.visible = true; W.idsDirty = true;
  f.pose = 'cheer'; f.setFace?.('happy'); f.bump?.(.5);
  const x0 = R.position.clone(), fwd = new THREE.Vector3(Math.cos(R.rotation.y), 0, -Math.sin(R.rotation.y)), wheels = [pcs.wheelsF?.pv, pcs.wheelsB?.pv].filter(Boolean);
  const nozzle = () => W.toScreen(R.localToWorld(new THREE.Vector3(-.19, .29, -.065)));
  // (③ 10/21, user on the phone: "소방차 조립 완료하고 움직이면 펭귄 몸 뚫음"): before it rolls, whoever stands in its way — on the
  // strip it sweeps, with 0.55 m kept body to body — hops aside (the side with room; else back), and stays there
  { const box = new THREE.Box3().setFromObject(R), side = new THREE.Vector3(-fwd.z, 0, fwd.x), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const hl = Math.abs(sz.x * fwd.x) + Math.abs(sz.z * fwd.z), hw = Math.abs(sz.x * side.x) + Math.abs(sz.z * side.z), CL = .3;   // (half a body (~.25) + a little: 0.55 between bodies)
    const who = [f, S.hero?.ch, ...(S.npcs || []).map(n => n.ch)].filter(ch => ch?.root?.visible);
    const room = (x, z) => { const Rm = S.room?.rooms?.find?.(q => { const o = q.group.position; return Math.abs(x - o.x) <= q.w / 2 && Math.abs(z - o.z) <= q.d / 2; }) || S.room; return Rm?.clearAt ? Rm.clearAt(x, z, .2) : true; };
    const hops = [];
    for (const ch of who) {
      const p = ch.root.position, rx = p.x - c.x, rz = p.z - c.z, a = rx * fwd.x + rz * fwd.z, sd = rx * side.x + rz * side.z;
      const cb = new THREE.Box3().setFromObject(ch.root).getSize(new THREE.Vector3()), CLc = Math.min(CL, Math.max(.12, Math.min(Math.max(cb.x, cb.z) / 2, cb.y * .45)) + .04);   // (its own body: whoever the build put beside it stays — 10/29)
      if (a < -hl / 2 - CLc || a > hl / 2 + .22 + CLc || Math.abs(sd) > hw / 2 + CLc) continue;
      const out = hw / 2 + CL + .1, sg = sd >= 0 ? 1 : -1;
      const cands = [[sg, out], [-sg, out]].map(([g, o]) => p.clone().addScaledVector(side, g * o - sd)).concat([p.clone().addScaledVector(fwd, -hl / 2 - CL - .1 - a)]);
      const to = cands.find(q => room(q.x, q.z)) || cands[0];
      const p0 = p.clone(); hops.push(tw.run(.35, k => { p.x = p0.x + (to.x - p0.x) * k; p.z = p0.z + (to.z - p0.z) * k; ch.lift = Math.sin(k * Math.PI) * .25; }, ease.outQuad).then(() => { ch.lift = 0; ch.faceTo?.(R.position.x, R.position.z); }));
      G.audio.sfx('hop');
    }
    if (hops.length) { await Promise.all(hops); if (S.dead) return; }
  }
  let blink = 0, spray = 0;
  await tw.run(2, k => {
    const u = k * 2; W.lastActive = performance.now();
    if ((blink += 1) % 6 === 0) lights.forEach((m, i) => { m.visible = (Math.floor(blink / 6) + i) % 2 === 0; });
    const d = u < .7 ? ease.inOutQuad(u / .7) * .22 : u < 1.3 ? .22 : .22 * (1 - ease.inOutQuad((u - 1.3) / .7));
    R.position.copy(x0).addScaledVector(fwd, d);
    for (const w of wheels) w.rotation.z = -d / .062;
    if (u > .6 && u < 1.6 && (spray += 1) % 3 === 0) { const s = nozzle(); W.fx.burst(s.x, s.y, { n: 4, shape: 'circle', colors: ['#7fd8ff', '#bff0ff', '#ffffff'], speed: 220, up: 160, gravity: 520, size: 7, life: .6 }); }
  }, ease.linear);
  if (S.dead) return;
  R.position.copy(x0); lights.forEach(m => { m.visible = true; });
  G.audio.sfx('land');
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
  if (K.type === 'stack' && !K.build) return kitTop(S);
  return kitBuild(S);   // (the robot; 파르페 too since 10/20 — topping by topping onto the glass)
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
  // 몽글이 beside the friend (the win's shot takes the two together — 10/20, the kit stages alike)
  const hero = S.hero, fp = S.friend.root.position;
  if (hero?.ch) {
    const to = (S.freeTiles || []).map(t => new THREE.Vector3(t.x, t.y || 0, t.z)).filter(q => { const d = Math.hypot(q.x - fp.x, q.z - fp.z); return d > .45 && d < 1.3; })
      .sort((u, v) => Math.abs(Math.hypot(u.x - fp.x, u.z - fp.z) - .7) - Math.abs(Math.hypot(v.x - fp.x, v.z - fp.z) - .7))[0];
    if (to && Math.hypot(hero.ch.root.position.x - fp.x, hero.ch.root.position.z - fp.z) > 1.3) { hero.t = hero.nearest(to.x, to.z) || hero.t; await poofTo(S, hero.ch, to, W.yaw); }
  }
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
  if (FREE_KITS.includes(K.id)) G.save.home.inventory.push(K.furn); else keepsake(G, K.furn);
  G.persist();
  return K.furn;
}

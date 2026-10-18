// 프라모델 조립판 (시제품 10/18) — a hidden-object stage whose things to find are the pieces of a plastic model kit. No new
// controls, no new rule: you tap things in the room as always. What changes is what they mean (the 설계도 at the bottom
// fills in piece by piece) and the end: every piece flies together, snaps on with a click, and the finished model comes
// alive — and goes home with you (the first time, as a piece of furniture for my home).
// Played from 놀이 모음 (gallery.js) or ?play=model&lv=1 — outside the 70-stage campaign: no progress, no coins, no logs.
// The stage itself is scenes/stage.js (S.model); this file is what is new: the plan, the 설계도, the assembly, the reward.
import * as THREE from 'three';
import { KITS, kitItem, buildKitPart, buildKitModel, buildKitGlow } from './gfx/modelkit-props.js';
import { ITEMS } from './gfx/items.js';
import { bakeItem } from './gfx/bake.js';
import { STYLE, blobShadow } from './gfx/kit.js';
import { renderThumbs } from './thumbs.js';
import { planStage } from './stages.js';
import { blindFor } from './hunt-blind.js';
import { rng, ease } from './util.js';
import { h } from './ui.js';

// one entry per playable kit stage (놀이 모음 lists them as levels)
export const MODEL_STAGES = {
  robot: { kit: 'robot', room: 'study', friend: 'nerd', title: '박사님의 프라모델', goal: '로봇 부품 7개를 모아 조립하자!',
    hello: '흠. 로봇 부품이 다 흩어졌어.', go: '다 모았다! 조립 시작!', cheer: '흠! 완벽한 조립이군!' },
};
const RS = 1.15;   // the finished model's size in the room (a little under the loose pieces' size, so they shrink as they snap on)

// ── the plan: the kit's pieces are the things to find, placed by the hidden-object rules (planStage with them forced in:
// the first in plain sight, at most two inside a drawer or door, never a place nobody can see into), plus one piece per
// piece of furniture — the pieces are spread round the room
export function modelSpec(kind) {
  const M = MODEL_STAGES[kind], K = KITS[M.kit];
  return { idx: -1, seed: 1 + Math.floor(Math.random() * 1e6), room: M.room, region: 'home', n: K.order.length, force: K.order.map(k => kitItem(M.kit, k)),
    lock: [], inside: 2, behind: 0, time: 120, clutter: .4, ho: true, model: kind, avoid: blindFor(M.room) };
}
const fits = (type, s) => ITEMS[type].h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || ITEMS[type].flat);
export function planModel(room, spec) {
  const plan = planStage(room, spec), r = rng(spec.seed + 11);
  const furnOf = s => s.furn || s.part?.furn;
  const taken = new Map(plan.placements.map(p => [p.spot, p]));
  const usedF = new Set();
  for (const p of plan.placements.filter(q => q.role === 'target')) {
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

// ── the 설계도 (in place of the list): the finished model drawn front-on, every piece a dark ghost until it's found, then
// that piece in colour in its own place. Pictures: one per piece, all framed the same, so they stack into the model.
const BP = {};   // kit → { at: {piece: [x%, y%]} } (the pictures themselves live in G.thumbStore)
const DIR = [0, .1, 1];
function ensureBlueprint(G, kit) {
  const K = KITS[kit], key = p => `kitbp_${kit}_${p}`;
  if (BP[kit] && G.thumbStore[key('all')]) return BP[kit];
  const all = buildKitModel(kit); all.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(all), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const radius = Math.max(sz.x, sz.y) * .5 * .9, center = c.toArray();   // (thumbs.js adds its own margin round it)
  const jobs = [{ key: key('all'), build: () => buildKitModel(kit), dir: DIR, center, radius },
    ...K.order.map(p => ({ key: key(p), build: () => buildKitPart(kit, p), dir: DIR, center, radius }))];
  Object.assign(G.thumbStore, renderThumbs(jobs, 288));
  // where each piece's middle lands in those pictures (the same orthographic framing as thumbs.js)
  const rad = radius * (STYLE.mode !== 'std' ? 1.08 : 1), half = rad * 1.18, dir = new THREE.Vector3(...DIR).normalize();
  const cam = new THREE.OrthographicCamera(-half, half, half, -half, .01, 100);
  cam.position.copy(c).addScaledVector(dir, rad * 8); cam.lookAt(c); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  const at = {};
  for (const p of all.children) {
    const v = new THREE.Box3().setFromObject(p).getCenter(new THREE.Vector3()).project(cam);
    at[p.userData.kitPart] = [(v.x + 1) / 2 * 100, (1 - v.y) / 2 * 100];
  }
  return (BP[kit] = { at, key });
}
// builds the card; each target's slot is its piece's spot on the drawing (the found picture flies there, stage.js
// onFound marks it .found and the piece shows in colour)
export function kitHud(S) {
  const G = S.G, kit = S.model.kit, K = KITS[kit], B = ensureBlueprint(G, kit), F = 116;   // F: the drawing's size (px)
  const frame = h('div', { class: 'kitbp-frame' }, h('img', { class: 'kitbp-ghost', src: G.thumbStore[B.key('all')], alt: '' }));
  const slot = {};
  for (const p of K.bp) {
    const [x, y] = B.at[p], ax = x / 100 * F, ay = y / 100 * F;
    const el = h('div', { class: 'kitbp-p', style: `left:${ax}px;top:${ay}px` },
      h('img', { src: G.thumbStore[B.key(p)], alt: '', style: `left:${-ax}px;top:${-ay}px;width:${F}px;height:${F}px;transform-origin:${ax}px ${ay}px` }));
    frame.append(el); slot[p] = el;
  }
  const byType = Object.fromEntries(K.order.map(p => [kitItem(kit, p), p]));
  for (const it of S.targets) if (byType[it.type]) { it.kitPart = byType[it.type]; it.slot = slot[it.kitPart]; }
  return h('div', { class: 'kitbp' }, h('div', { class: 'kitbp-tag ol' }, '설계도'), frame, h('div', { class: 'kitbp-name' }, K.name));
}

// ── the assembly (on the last piece, before the result panel; stage.js win). ~5 s: every piece rises from where it was
// found into a ring over a clear spot near the friend, then they snap on one by one (click, a burst, the model squashes a
// little), the eyes light up, it waves and spins, the friend cheers.
// where it's built: an open tile the view sees whole (feet, middle, head and both sides), with room either side for the
// friend and 몽글이 to stand and watch; front tiles and tiles near the friend win ties. The view may turn up to 90° for
// one (an orthographic view: whether something is in the way depends on the angle only, not on where the camera looks).
const SIDE = .55;
function buildSpot(S) {
  const W = S.G.world, f = S.friend.root.position, rc = S.room.center || new THREE.Vector3();
  const tiles = (S.freeTiles || []).filter(t => (t.R?.clearAt ? t.R.clearAt(t.x, t.z, .45) : true));
  const y0 = W.yaw, p0 = W.pitch, roots = [S.room.group];
  const seen = q => { const s = W.toScreen(q); const hit = W.pick(s.x, s.y, roots).find(x => !x.object.userData.proxy); return !hit || hit.distance > W.raycaster.ray.origin.distanceTo(q) - .12; };
  let best = null;
  W.pitch = p0 > .38 && p0 < .9 ? p0 : .55;
  [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2].forEach((d, di) => {
    const yaw = y0 + d; W.yaw = yaw; W.updateCam();
    const side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), toCam = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    for (const t of tiles) {
      const y = t.y || 0, at = (k, h) => new THREE.Vector3(t.x + side.x * k, y + h, t.z + side.z * k);
      if (![[0, .08], [0, .4], [0, .78], [.2, .4], [-.2, .4]].every(([k, h]) => seen(at(k, h)))) continue;
      const room = k => { const q = at(k * SIDE, 0); return (!t.R?.clearAt || t.R.clearAt(q.x, q.z, .28)) && seen(at(k * SIDE, .35)); };
      const score = (room(1) ? 2 : 0) + (room(-1) ? 2 : 0) + (t.R?.clearAt?.(t.x, t.z, .7) ? 1 : 0)
        + .25 * ((t.x - rc.x) * toCam.x + (t.z - rc.z) * toCam.z) - .15 * Math.hypot(t.x - f.x, t.z - f.z) - di * .6;
      if (!best || score > best.score) best = { t, yaw, score };
    }
  });
  const pitch = W.pitch; W.yaw = y0; W.pitch = p0; W.updateCam();
  if (!best) best = { t: tiles[0] || { x: f.x + 1, z: f.z + 1, y: 0 }, yaw: y0 };
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
export async function kitAssemble(S) {
  const G = S.G, W = G.world, tw = S.tw, M = S.model, K = KITS[M.kit], f = S.friend;
  W.camLock = true;
  try {
    S.tray?.classList.add('done');
    await tw.wait(.3); if (S.dead) return;
    const { p: P, yaw, pitch, tile } = buildSpot(S);
    f.setFace('wow'); f.bump?.(.4);
    S.say(f, M.go, 1500); G.audio.sfx('special');
    // in close on the spot: the model and the ring of pieces over it about half the screen's height, the two watching
    // either side still in the picture (a phone held upright: the width decides)
    const vh = W.viewH || 11, vw = vh * W.W / Math.max(1, W.H), zoom = Math.max(2.2, Math.min(5, vh / 2.7, vw / 1.75));
    await Promise.all([W.flyTo(tw, { target: new THREE.Vector3(P.x, P.y + .48, P.z), yaw, pitch, zoom, dur: .7, e: ease.inOutCubic }), gather(S, P, tile?.R, yaw)]);
    if (S.dead) return;
    f.faceTo?.(P.x, P.z); S.hero?.ch?.faceTo?.(P.x, P.z);
    // the model: a group at the spot, facing the camera; one pivot per piece, at the piece's joint
    const R = new THREE.Group(); R.position.copy(S.room.group.worldToLocal(P.clone()));
    R.rotation.y = Math.atan2(W.cam.position.x - P.x, W.cam.position.z - P.z); R.scale.setScalar(RS);
    const sh = blobShadow(.2, .3); sh.scale.set(.42, .42, 1); sh.visible = false; R.add(sh);
    S.room.group.add(R); R.updateMatrixWorld(true);
    S.kitModel = R;
    const glow = buildKitGlow(M.kit); glow.g.visible = false;
    const n = K.order.length, ringY = .82, ringR = .42, rand = rng(7);
    const pcs = K.order.map((key, i) => {
      const part = bakeItem(buildKitPart(M.kit, key), 'kitp|' + M.kit + '|' + key), J = new THREE.Vector3(...K.parts[key].joint);
      part.position.copy(J).negate();
      const pv = new THREE.Group(); pv.add(part); pv.userData.og = {};   // each piece its own ink outline: the seams show
      if (key === glow.part) { glow.g.position.copy(J).negate(); pv.add(glow.g); }
      pv.traverse(o => { if (o.isMesh) o.castShadow = false; });
      const it = S.targets.find(t => t.kitPart === key), a = it?.spot?.anchor?.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .12, 0)) || P.clone().add(new THREE.Vector3(0, 1.4, 0));
      const from = R.worldToLocal(a.clone());
      const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 6, rand() * 6, rand() * 6));
      pv.position.copy(from); pv.quaternion.copy(q0); pv.scale.setScalar(1.15); R.add(pv);
      return { key, pv, J, from, q0, i, spin: new THREE.Vector3(rand() - .5, rand() - .5, rand() - .5).normalize(), done: false };
    });
    W.idsDirty = true;
    G.audio.sfx('whoosh');
    // one clock drives it all: gather → snap one by one → come alive
    const T0 = .8, DT = .28, T1 = T0 + n * DT, T2 = T1 + .2, END = T2 + 1.7;
    const ring = (i, t) => { const a = i / n * Math.PI * 2 + t * 1.6; return new THREE.Vector3(Math.cos(a) * ringR, ringY + Math.sin(t * 3 + i) * .025, Math.sin(a) * ringR); };
    const Q1 = new THREE.Quaternion(), tmpQ = new THREE.Quaternion(), V = new THREE.Vector3();
    let squash = 0, lastT = 0, alive = false;
    const fist = pcs.find(p => p.key === 'fist'), claw = pcs.find(p => p.key === 'claw'), head = pcs.find(p => p.key === 'head');
    const scr = v => W.toScreen(R.localToWorld(v.clone()));
    const step = t => {
      const dt = Math.max(0, t - lastT); lastT = t;
      W.lastActive = performance.now();   // full frame rate on phones while it plays
      for (const c of pcs) {
        const tSnap0 = T0 + c.i * DT, tSnap1 = tSnap0 + DT * .85;
        if (t < T0) {   // rise from where it was found, into the ring
          const k = ease.outCubic(Math.min(1, Math.max(0, (t - c.i * .045) / (T0 - .3))));
          const to = ring(c.i, t); V.lerpVectors(c.from, to, k); V.y += Math.sin(k * Math.PI) * .35; c.pv.position.copy(V);
          tmpQ.setFromAxisAngle(c.spin, t * 7); c.pv.quaternion.copy(c.q0).multiply(tmpQ);
        } else if (t < tSnap0) {   // waiting its turn in the ring, turning
          c.pv.position.copy(ring(c.i, t)); tmpQ.setFromAxisAngle(c.spin, t * 7); c.pv.quaternion.copy(c.q0).multiply(tmpQ);
        } else if (t < tSnap1) {   // into its place: a swoop that speeds up
          if (!c.A) { c.A = c.pv.position.clone(); c.AQ = c.pv.quaternion.clone(); }
          const k = Math.min(1, (t - tSnap0) / (tSnap1 - tSnap0)), e = k * k * (3 - 2 * k) * .35 + k * k * .65;
          V.lerpVectors(c.A, c.J, e); V.y += Math.sin(k * Math.PI) * .12; c.pv.position.copy(V);
          c.pv.quaternion.slerpQuaternions(c.AQ, Q1, ease.outCubic(k)); c.pv.scale.setScalar(1.15 - .15 * k);
        } else if (!c.done) {   // click!
          c.done = true; c.pv.position.copy(c.J); c.pv.quaternion.identity(); c.pv.scale.setScalar(1);
          squash = 1; sh.visible = true;
          G.audio.sfx('latch'); G.audio.sfx('pop', 3 + c.i);
          const s = scr(c.J); W.fx.burst(s.x, s.y, { n: 12, shape: 'star', colors: ['#ffe14d', '#ffffff', '#8fd3f4'], speed: 220, gravity: 0, life: .45, size: 9 });
          W.fx.ring(s.x, s.y, { r: 46, color: '#ffffff', width: 6, life: .3 });
          if (c.i === n - 1) G.hitstop(.06);
        }
      }
      squash = Math.max(0, squash - dt / .16);
      const sq = Math.sin(squash * Math.PI) * .09;
      // come alive: eyes on, a hop, a wave with the fist, a spin
      let hop = 0, spin = 0;
      if (t >= T2) {
        if (!alive) {
          alive = true; glow.g.visible = true; W.idsDirty = true;
          G.audio.sfx('unlock'); const s = scr(new THREE.Vector3(0, .5, .1));
          W.fx.burst(s.x, s.y, { n: 30, colors: ['#ffe14d', '#ff8fb8', '#8fd3f4', '#ffffff'], speed: 340 }); W.fx.ring(s.x, s.y, { r: 120, color: '#ffe14d', width: 9 });
          f.pose = 'cheer'; f.setFace('happy'); f.bump?.(.5);
        }
        const u = t - T2;
        hop = u < .35 ? Math.sin(u / .35 * Math.PI) * .16 : 0;
        if (fist) { const w = u < .25 ? ease.outBack(u / .25) : u < 1.0 ? 1 : Math.max(0, 1 - (u - 1.0) / .2); fist.pv.rotation.set(0, 0, w * (2.3 + (u > .25 && u < 1.0 ? Math.sin((u - .25) * 16) * .35 : 0))); }
        if (claw && u > .35 && u < 1.0) claw.pv.rotation.set(0, 0, -Math.sin((u - .35) / .65 * Math.PI) * .6);
        if (head) head.pv.rotation.set(0, 0, u > .3 && u < 1.0 ? Math.sin((u - .3) * 9) * .14 : 0);
        if (u > 1.05 && u < 1.65) { const k = (u - 1.05) / .6; spin = ease.inOutCubic(k) * Math.PI * 2; hop = Math.sin(k * Math.PI) * .22; if (!step.puffed) { step.puffed = true; G.audio.sfx('whoosh'); } }
        if (u > 1.05 && u < 1.6 && Math.random() < .5) { const s = scr(new THREE.Vector3(0, .17, -.12)); W.fx.burst(s.x, s.y, { n: 2, shape: 'circle', colors: ['#ffe14d', '#ffb340', '#ffffff'], speed: 70, up: -40, size: 7, life: .35 }); }
      }
      R.scale.set(RS * (1 + sq * .5), RS * (1 - sq), RS * (1 + sq * .5));
      R.position.y = S.room.group.worldToLocal(P.clone()).y + hop;
      R.rotation.y = Math.atan2(W.cam.position.x - P.x, W.cam.position.z - P.z) + spin;
    };
    await tw.run(END, k => step(k * END), ease.linear);
    if (S.dead) return;
    step(END); G.audio.sfx('land');
    // it stays and idles: a little bob and a head tilt now and then (while the result panel is up)
    (async () => { let k = 0; while (!S.dead && R.parent) { await tw.run(1.1, e => { R.position.y = S.room.group.worldToLocal(P.clone()).y + Math.abs(Math.sin(e * Math.PI)) * .03; if (head) head.pv.rotation.z = Math.sin(e * Math.PI) * (k % 2 ? .1 : -.1); }, ease.linear); k++; } })();
  } finally { W.camLock = false; }
}

// ── the reward: the first time a kit is finished, the model goes into my home's storage as a piece of furniture.
// Returns the furniture type when it was given now, else null (already had it, or a practice run that keeps nothing)
export function kitReward(S) {
  const G = S.G, K = KITS[S.model.kit];
  if (G.playMode) return null;
  const done = G.save.kitsDone || (G.save.kitsDone = {});
  if (done[K.id]) return null;
  done[K.id] = true;
  G.save.home.inventory.push(K.furn);
  G.persist();
  return K.furn;
}

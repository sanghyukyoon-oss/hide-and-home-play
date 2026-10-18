// 장치판 (R6, 2026-10-18; level-design-report-20261018.md, 인수인계 세션이 나눈 몫): the region ★ stages built on the devices
// in gfx/device-props.js. Same shape as 6판 (서재) and 20판 (로봇청소기): 3–4 steps, the room changes at each one, the last
// plays by itself. Hooks:
//   deviceLayout(roomKey, layout)  stage.js, on a ★ stage only: swap the map's plain piece for its device piece
//   planDevice(room, spec, story, planStage)  stages.js planShow: the chain of the device in this room
//   runDevice(stage, part)  stage.js useGadget: the tool is in — play the device
//   deviceTell(stage, part, line)  stage.js giggle: the hiding friend gives themselves away from inside a device
import * as THREE from 'three';
import { EN } from './i18n-en-dict.js';
import { ITEMS } from './gfx/items.js';
import { rng, ease } from './util.js';
import { blindFor } from './hunt-blind.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
for (const [ko, en] of [['수문 손잡이', 'Sluice handle'], ['수문 연못', 'Sluice pond'], ['수문 바퀴', 'Sluice wheel'], ['보물상자', 'Treasure chest'], ['보물상자 안', 'In the treasure chest'],
  ['연못 바닥', 'Pond bottom'], ['연못 돌담 뒤', 'Behind the pond wall'], ['연못 돌담 위', 'On the pond wall'],
  ['천 원 지폐', '1000-won bill'], ['500원 동전', '500-won coin'], ['동전 컵', 'Coin cup']]) EN[ko] ??= en;
const fits = (type, s) => ITEMS[type].h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || ITEMS[type].flat);

// which piece of which map becomes the device (the rest of the map stays as it is)
// ('type#n': only the n-th of that type, counting from 0)
const SWAP = {
  parkwide: { pond: 'sluicepond' },                         // 48판 큰 공원
  laundry: { 'washer3#2': 'dryergo', vendcoin: 'changergo' },   // 39판 빨래방: the washer next to the coin changer
};
export function deviceLayout(key, L) {
  const m = SWAP[key]; if (!m) return L;
  const seen = {};
  const sw = lay => ({ ...lay, furniture: (lay.furniture || []).map(f => { const n = seen[f.type] = (seen[f.type] ?? -1) + 1, to = m[f.type + '#' + n] || m[f.type]; return to ? { ...f, type: to } : f; }) });
  return L.rooms ? { ...L, rooms: L.rooms.map(r => ({ ...r, layout: sw(r.layout) })) } : sw(L);
}

// the tool behind a padlock (the 20판 way): the stage's own pad chain guards it; with no padlock to be had it goes in
// any free place inside something, else anywhere free
function toolBehindPad(plan, room, spec, type, forPart) {
  const L = plan.locks.find(l => l.kind === 'pad');
  const tp = L && plan.placements.find(p => p.role === 'target' && p.spot.part === L.part);
  const used = new Set(plan.placements.map(p => p.spot)), r = rng(spec.seed + 131), blind = blindFor(spec.room) || (() => false);
  if (tp) {
    plan.targets.splice(plan.targets.indexOf(tp.type), 1);
    // the key not in the same piece as its padlock (the park bin's other flap was the key's place)
    const kp = plan.placements.find(p => p.role === 'key' && p.forPart === L.part);
    if (kp && kp.spot.furn === L.part.furn) {
      const ok = s => !s.reserved && !used.has(s) && !blind(s) && s.furn !== L.part.furn && fits('key', s) && !(s.part && plan.locks.some(l => l.part === s.part)) && (!s.part || (s.part.reach ?? 1) >= .55);
      const ns = r.pick(room.spots.filter(s => ok(s) && s.kind !== 'on')) || r.pick(room.spots.filter(ok));
      if (ns) kp.spot = ns;
    }
    return Object.assign(tp, { type, role: 'gadget', code: type, forPart });
  }
  const free = room.spots.filter(s => !s.reserved && !used.has(s) && !blind(s) && fits(type, s) && !(s.part && plan.locks.some(l => l.part === s.part)) && (s.part ? (s.part.reach ?? 1) >= .55 : true));
  const s = r.pick(free.filter(s => s.part)) || r.pick(free);
  if (!s) return null;
  const p = { type, spot: s, role: 'gadget', code: type, forPart };
  plan.placements.push(p);
  return p;
}

// one more step in front: the clue of the `outer` lock (the key) waits behind the `inner` lock (a colour lock), so the
// chain runs card → colour lock → key → padlock → tool. The bonus thing that was behind the inner lock moves out to
// where the key was (or drops out if it can't fit there).
function nest(plan, outer, inner) {
  const O = plan.locks.find(l => l.kind === outer), I = plan.locks.find(l => l.kind === inner);
  const kp = O && I && plan.placements.find(p => p.forPart === O.part && ['key', 'note', 'color'].includes(p.role));
  if (!kp) return false;
  const used = new Set(plan.placements.map(p => p.spot));
  let sp = I.part.spots.find(x => !x.reserved && !used.has(x) && fits(kp.type, x));
  if (!sp) {
    const g = plan.placements.find(p => p.role === 'target' && p.spot.part === I.part && fits(kp.type, p.spot));
    if (!g) return false;
    sp = g.spot;
    if (fits(g.type, kp.spot)) g.spot = kp.spot; else { plan.placements.splice(plan.placements.indexOf(g), 1); plan.targets.splice(plan.targets.indexOf(g.type), 1); }
  }
  kp.spot = sp;
  return true;
}
const PLANS = {
  // 48판 큰 공원 '수문 대소동': key → padlocked box → the 수문 handle → the wheel drains the pond → the colour card on the
  // bottom → the sunken chest → 개굴이
  sluice(room, spec, story, planStage, wheel) {
    const f = wheel.furn, lid = f.parts.find(p => p !== wheel);
    const plan = planStage(room, { ...spec, lock: ['pad'], n: 3, avoid: blindFor(spec.room) }, story);   // the chain is the stage: two bonus things beside it
    if (!toolBehindPad(plan, room, spec, 'sluicehandle', wheel)) return null;
    const r = rng(spec.seed + 113), code = [0, 1, 2].map(() => r.int(0, 4)).join('');
    plan.placements.push({ type: 'colornote', spot: f.floorSpot, role: 'color', code, forPart: lid });
    const wl = { part: wheel, kind: 'gadget', code: 'sluicehandle' }, cl = { part: lid, kind: 'color', code };
    plan.locks.push(wl, cl);
    wheel.needMsg = K('물속에서 뽀글뽀글… 수문으로 물을 빼 보자! 근데 바퀴 손잡이가 빠져 있어', 'Bubbles in the water… Let the pond out through the gate! But the wheel has no handle');
    wheel.needItem = 'sluicehandle';
    plan.placements.push({ type: 'friendtoken', spot: lid.spots[0], role: 'target' });
    plan.targets.unshift('friendtoken');
    plan.incident = { part: lid, lock: cl };
    plan.showcase = { kind: 'sluice', wheel, lid };
    return plan;
  },
};
// 39판 빨래방 '건조기 대소동': colour card → colour-locked washer → key → padlocked washer → the 1000원 bill → the coin changer drops a 500원 coin → the coin
// runs the dryer that locked itself '건조 중' → "딩!" → the door pops open → 순대가 빨래랑 같이 툭
PLANS.dryer = (room, spec, story, planStage, dd) => {
  const ch = room.parts.find(p => p.device === 'changer'); if (!ch) return null;
  const plan = planStage(room, { ...spec, lock: ['pad', 'color'], n: 4, sock: false, avoid: blindFor(spec.room) }, story);   // (no bonus thing where no view sees it)
  if (!toolBehindPad(plan, room, spec, 'bill1000', ch)) return null;
  nest(plan, 'pad', 'color');   // (a small room: one more step so the ★ stage isn't over in a minute)
  plan.placements.push({ type: 'coin500', spot: ch.furn.cupSpot, role: 'gadget', code: 'coin500', forPart: dd });
  const cl = { part: ch, kind: 'gadget', code: 'bill1000' }, dl = { part: dd, kind: 'gadget', code: 'coin500' };
  plan.locks.push(cl, dl);
  ch.needMsg = K('동전 교환기야. 지폐를 넣으면 동전이 나와! 천 원짜리를 찾아봐', "A coin changer. Put in a bill and coins come out! Find a 1000-won bill");
  ch.needItem = 'bill1000';
  dd.needMsg = K("건조기 문이 '건조 중'으로 잠겼어! 동전을 넣고 한 번 돌리면 끝날 때 열려", "The dryer locked itself mid-cycle! Put a coin in, let it run once, and it opens at the end");
  dd.needItem = 'coin500';
  plan.placements.push({ type: 'friendtoken', spot: dd.spots[0], role: 'target' });
  plan.targets.unshift('friendtoken');
  plan.incident = { part: dd, lock: dl };
  plan.showcase = { kind: 'dryer', dd, ch };
  return plan;
};
export function planDevice(room, spec, story, planStage) {
  const part = room.parts.find(p => p.device && PLANS[p.device]);
  return part ? PLANS[part.device](room, spec, story, planStage, part) : null;
}

// ── play
// the nearest turn of the camera (in 30° steps) from which all these can be seen — a device's show shouldn't play
// behind an ice-cream cart
function clearYaw(S, objs, target, zoom, hide = []) {
  const W = S.G.world, y0 = W.yaw, t0 = W.target.clone(), z0 = W.zoom;
  hide.forEach(o => { o.visible = false; });   // (looking through the water at what will be on the bottom)
  const pts = objs.map(o => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()));
  W.target.copy(target); W.zoom = zoom;
  let best = y0;
  for (let k = 0; k < 12; k++) {
    const y = y0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 6;
    W.yaw = y; W.updateCam(); S.room.update(1);
    if (objs.every((o, i) => W._see(o, pts[i], [S.room.group]))) { best = y; break; }   // the middle of each, not just a corner
  }
  W.yaw = y0; W.target.copy(t0); W.zoom = z0; W.updateCam(); S.room.update(1);
  hide.forEach(o => { o.visible = true; });
  return best;
}
const RUN = {
  async sluice(S, part) {
    const G = S.G, W = G.world, tw = S.tw, f = part.furn;
    part.stuck = true; S.cine = true;
    const c = f.group.getWorldPosition(new THREE.Vector3()), at = new THREE.Vector3(c.x, .45, c.z), zoom = Math.max(W.zoom, 1.6);
    await W.flyTo(tw, { yaw: clearYaw(S, [f.chest, f.wheel], at, zoom, [f.water, f.surf]), target: at, zoom, dur: .7 });
    if (S.dead) return;
    f.handle.visible = true; G.audio.sfx('pop', 2);
    await tw.wait(.3);
    if (S.friendHidden) S.hideSay([K('개, 개굴?! 물이… 빠진다?!', 'R-ribbit?! The water… is going?!')]);
    // the stream out of the gate and its splashes while the water runs out
    let on = true;
    const spray = (async () => {
      await tw.wait(.7); if (S.dead) return;
      f.stream.visible = true; G.audio.sfx('whoosh');
      const v = new THREE.Vector3();
      for (let i = 0; on && !S.dead; i++) {
        f.stream.getWorldPosition(v); v.y = .04; const s = W.toScreen(v);
        W.fx.burst(s.x, s.y, { n: 5, shape: 'circle', colors: ['#a9e4f6', '#ffffff', '#7fd2ef'], speed: 150, up: 130, size: 6, life: .45 });
        if (i % 3 === 0) G.audio.sfx('blub');
        await tw.wait(.2);
      }
      f.stream.visible = false; W.shadowDirty = true;
    })();
    await S.togglePart(part, true);
    on = false; await spray;
    if (S.dead) return;
    // two fish left on the dry bottom flop about
    G.ui.toast(K('물이 다 빠졌다! 바닥에 뭐가 있어…', 'The pond is dry! Something is on the bottom…'), 'green');
    const y0 = f.fish.map(g => g.position.y);
    for (let i = 0; i < 3 && !S.dead; i++) {
      G.audio.sfx('hop', i);
      await tw.run(.24, k => f.fish.forEach((g, j) => { g.position.y = y0[j] + Math.sin(k * Math.PI) * (j ? .1 : .13); g.rotation.z = Math.sin(k * Math.PI * 2) * .7; }), ease.linear);
    }
    f.fish.forEach((g, j) => { g.position.y = y0[j]; g.rotation.z = 0; });
    W.shadowDirty = true; S.cine = false; S.idle = 0;
  },
};
// 39판: the bill slides into the changer, two coins clink into the cup
RUN.changer = async (S, part) => {
  const G = S.G, W = G.world, tw = S.tw, f = part.furn;
  part.stuck = true; S.cine = true;
  const at = f.group.localToWorld(new THREE.Vector3(0, .8, .3)), zoom = Math.max(W.zoom, 2.0);
  await W.flyTo(tw, { yaw: clearYaw(S, [f.slotParent], at, zoom), target: at, zoom, dur: .55 });
  if (S.dead) return;
  f.bill.visible = true; G.audio.sfx('slide');
  await tw.run(.55, k => { f.bill.position.z = .12 - .1 * k; }, ease.inOutSine);
  f.bill.visible = false;
  for (let i = 0; i < 3; i++) { G.audio.sfx('tick'); await tw.wait(.12); }
  await S.togglePart(part, true);
  const s = W.toScreen(f.slotParent.localToWorld(new THREE.Vector3(.285, -.58, .08)));
  W.fx.burst(s.x, s.y, { n: 12, colors: ['#ffc93c', '#fff3c4', '#ffffff'], speed: 160, up: 90 }); G.audio.sfx('coin', 2);
  G.ui.toast(K('짤랑! 500원 동전이 나왔어! 톡 집어 봐', 'Clink! A 500-won coin! Tap to take it'), 'green');
  S.cine = false; S.idle = 0;
};
// 39판: the coin runs the dryer — it shakes and tumbles, steam puffs, "딩!", the door pops open on whoever is inside
RUN.dryer = async (S, part) => {
  const G = S.G, W = G.world, tw = S.tw, f = part.furn;
  S.cine = true;
  const at = f.group.localToWorld(f.dryerAt.clone()), zoom = Math.max(W.zoom, 2.0);
  await W.flyTo(tw, { yaw: clearYaw(S, [part.pivots[0]], at, zoom), target: at, zoom, dur: .55 });
  if (S.dead) return;
  const sl = W.toScreen(f.group.localToWorld(f.slotAt.clone()));
  W.fx.burst(sl.x, sl.y, { n: 8, colors: ['#ffc93c', '#ffffff'] }); G.audio.sfx('coin', 1);
  await tw.wait(.3);
  f.tumble.visible = true; G.audio.sfx('whoosh');
  if (S.friendHidden) S.hideSay([K('으아아~ 돌아간다~!', 'Waaah~ it\'s spinning~!')]);
  const p0 = f.group.position.clone(), top = f.group.localToWorld(new THREE.Vector3(0, 1.95, 0));
  let last = 0;
  await tw.run(3.0, k => {
    const sp = Math.sin(k * Math.PI);   // speeds up, then slows down
    f.tumble.rotation.z = -(k - Math.sin(k * Math.PI * 2) / (Math.PI * 2)) * Math.PI * 9;
    f.group.position.set(p0.x + Math.sin(k * 140) * .012 * sp, p0.y, p0.z + Math.cos(k * 110) * .008 * sp);
    W.shadowDirty = true;
    if (k - last > .09) {
      last = k; const s = W.toScreen(top);
      W.fx.burst(s.x, s.y, { n: 3, shape: 'circle', colors: ['#ffffff', '#ffe9f0'], speed: 40, up: 70, gravity: -40, size: 9, life: .7 });
      G.audio.sfx(Math.random() < .5 ? 'thunk' : 'whoosh');
    }
  }, ease.linear);
  f.group.position.copy(p0); f.tumble.visible = false; W.shadowDirty = true;
  G.audio.sfx('unlock');
  const sd = W.toScreen(at); G.ui.floatText(sd.x, sd.y - 70, K('딩!', 'Ding!'), 'gold');
  await tw.wait(.35);
  S.cine = false;
  if (S.dead) return;
  // the laundry tumbles out with them
  W.fx.burst(sd.x, sd.y, { n: 16, shape: 'rect', colors: ['#9fd3b0', '#ffc23d', '#8fd3f4', '#ffffff', '#ffb3cf'], speed: 240, up: 140, size: 14, life: .8 });
  await S.togglePart(part, true);
};
export async function runDevice(S, part) {
  const R = RUN[part.device];
  return R ? R(S, part) : S.togglePart(part, true);
}

// the hiding friend's tell from inside a device (else the plain wobble):
//   the pond — bubbles and rings while it's full;  the dryer — melting pink drips under its door, the door jiggles
const TELL = {
  dryer(S, dev, line) {
    const f = dev.furn, W = S.G.world, p = f.group.localToWorld(new THREE.Vector3(0, .05 + .9 + .16, .3)), pv = dev.pivots[0], r0 = pv.rotation.y;
    S.tw.run(.4, k => { pv.rotation.y = r0 - Math.sin(k * Math.PI * 4) * .04 * (1 - k); }, ease.linear).then(() => { pv.rotation.y = r0; });
    for (let i = 0; i < 3; i++) setTimeout(() => {
      if (S.dead) return;
      const s = W.toScreen(p);
      W.fx.burst(s.x + (i - 1) * 9, s.y, { n: 2, shape: 'circle', colors: ['#ffb3cf', '#fff4e2'], speed: 10, up: 0, gravity: 260, size: 9, life: .6 });
      S.G.audio.sfx('tick');
    }, i * 260);
    S.say({ root: { position: p }, headTop: () => .25 }, line, 1300);
    return true;
  },
};
export function deviceTell(S, part, line) {
  const f = part.furn, dev = f.parts.find(p => p.device);
  if (dev && TELL[dev.device]) return dev.t < .5 && TELL[dev.device](S, dev, line);
  if (!dev || dev.device !== 'sluice' || dev.t > .5) return false;
  const W = S.G.world, p = f.group.localToWorld(f.waterTop());
  for (let i = 0; i < 4; i++) setTimeout(() => {
    if (S.dead) return;
    const s = W.toScreen(p), dx = (i % 2 ? 1 : -1) * (6 + i * 5);
    W.fx.ring(s.x + dx, s.y, { r: 26 + i * 6, color: '#ffffff', width: 4, life: .55 });
    W.fx.burst(s.x + dx, s.y - 4, { n: 6, shape: 'circle', colors: ['#ffffff', '#d6f3ff', '#ffffff'], speed: 50, up: 150, gravity: -80, size: 11, life: .8 });
    S.G.audio.sfx('blub');
  }, i * 230);
  S.say({ root: { position: p }, headTop: () => .2 }, line, 1300);
  return true;
}

// what the tools say when found (stage.js onFound)
export const DEVICE_FOUND = {
  sluicehandle: K('수문 손잡이다! 연못 수문 바퀴에 끼워 보자', 'The sluice handle! Fit it on the pond gate wheel'),
  bill1000: K('천 원짜리 지폐다! 동전 교환기에 넣어 보자', 'A 1000-won bill! Try the coin changer'),
  coin500: K('500원 동전! 건조기에 넣어 보자', 'A 500-won coin! Put it in the dryer'),
};

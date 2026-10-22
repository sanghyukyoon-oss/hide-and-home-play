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
import { asRoom } from './roomalias.js';
import { runChain } from './gpt-chains.js';

const K = (ko, en) => { EN[ko] = en; return ko; };
for (const [ko, en] of [['수문 손잡이', 'Sluice handle'], ['수문 연못', 'Sluice pond'], ['수문 바퀴', 'Sluice wheel'], ['보물상자', 'Treasure chest'], ['보물상자 안', 'In the treasure chest'],
  ['연못 바닥', 'Pond bottom'], ['연못 돌담 뒤', 'Behind the pond wall'], ['연못 돌담 위', 'On the pond wall'],
  ['천 원 지폐', '1000-won bill'], ['500원 동전', '500-won coin'], ['동전 컵', 'Coin cup'], ['도르래 손잡이', 'Pulley handle'], ['도르래 장독대', 'Pulley jar stand'],
  ['응원봉', 'Light-stick'], ['무대 리프트', 'Stage lift'], ['리프트 무대', 'Lift stage'],
  ['성냥', 'Matches'], ['다락 문', 'Attic hatch'], ['다락 안', 'In the attic'], ['다락 사다리', 'Attic ladder'], ['사다리 옆', 'By the ladder']]) EN[ko] ??= en;
const fits = (type, s) => ITEMS[type].h * (s.scale || 1) <= s.maxH + .001 && (s.maxH >= .1 || ITEMS[type].flat);

// which piece of which map becomes the device (the rest of the map stays as it is)
// ('type#n': only the n-th of that type, counting from 0)
const SWAP = {
  parkwide: { pond: 'sluicepond' },                         // 48판 큰 공원
  laundry: { 'washer3#2': 'dryergo', vendcoin: 'changergo' },   // 39판 빨래방: the washer next to the coin changer
  alleyhouse: { jangdok: 'pulleyjang' },                      // 30판 마당 2층집
  villaroof2: { jangdok: 'pulleyjang' },                      // 20판 빌라 옥상 집들이 (기차 여행 편 10/21: 30판이 바닷가 가게가 되며 도르래가 옥상 장독대로)
  kpop: { kpopstage: 'liftstage' },                           // 68판 K-pop 무대
  cabin: { 'drawers#1': 'starloft' },                         // 59판 통나무 오두막: the attic's chest of drawers
};
export function deviceLayout(key, L) {
  const m = SWAP[key] ?? SWAP[asRoom(key)]; if (!m) return L;   // (a GPT map rebuilt under a new key: its old map's swap — roomalias.js)
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
// 30판 마당 2층집 '장독대 도르래': colour card → colour lock (the gate's milk box, say) → key → padlock (mailbox 102…) →
// the 도르래 handle → the pulley hoists the 누름돌 off the big jar → the lid pops → 시바
PLANS.pulley = (room, spec, story, planStage, big) => {
  const plan = planStage(room, { ...spec, lock: ['pad', 'color'], n: 4, avoid: blindFor(spec.room) }, story);
  if (!toolBehindPad(plan, room, spec, 'pulleyhandle', big)) return null;
  if (!spec.clueHang?.pad) nest(plan, 'pad', 'color');   // (20판 옥상: the key's step is the quilt instead — it hangs in it until it lifts)
  const bl = { part: big, kind: 'gadget', code: 'pulleyhandle' };
  plan.locks.push(bl);
  big.needMsg = K('누름돌이 너무 무거워서 뚜껑이 안 열려! 도르래로 들면 될 텐데… 손잡이가 빠졌네', "The pressing stone is too heavy to lift! The pulley could hoist it… but its handle is missing");
  big.needItem = 'pulleyhandle';
  plan.placements.push({ type: 'friendtoken', spot: big.spots[0], role: 'target' });
  plan.targets.unshift('friendtoken');
  plan.incident = { part: big, lock: bl };
  plan.showcase = { kind: 'pulley', big };
  return plan;
};
// 68판 K-pop 무대 '센터 리프트': colour card → the stage curtain (colour lock) → key → padlock → the 응원봉 → the
// lighting console: lights sweep, smoke, the lift rises → 둠칫이 at centre stage
PLANS.stagelift = (room, spec, story, planStage, lift) => {
  const plan = planStage(room, { ...spec, lock: ['color', 'pad'], n: 4, avoid: blindFor(spec.room) }, story);
  if (!toolBehindPad(plan, room, spec, 'lightstick', lift)) return null;
  nest(plan, 'pad', 'color');
  const ll = { part: lift, kind: 'gadget', code: 'lightstick' };
  plan.locks.push(ll);
  lift.needMsg = K('무대 리프트 조종판이야. 응원봉을 꽂는 자리가 비어 있어!', "The stage lift's console. The light-stick holder is empty!");
  lift.needItem = 'lightstick';
  plan.placements.push({ type: 'friendtoken', spot: lift.spots[0], role: 'target' });
  plan.targets.unshift('friendtoken');
  plan.incident = { part: lift, lock: ll };
  plan.showcase = { kind: 'stagelift', lift };
  return plan;
};
// 59판 통나무 오두막 '별자리 다락': password note → code lock → key → padlock → the matches → the star lantern throws a
// constellation on the wall, it runs into the hatch's star latch → the hatch opens, the ladder comes down → 판다
PLANS.starloft = (room, spec, story, planStage, hatch) => {
  const plan = planStage(room, { ...spec, lock: ['code', 'pad'], n: 4, torn: false, avoid: blindFor(spec.room) }, story);
  if (!toolBehindPad(plan, room, spec, 'matches', hatch)) return null;
  nest(plan, 'pad', 'code');
  const hl = { part: hatch, kind: 'gadget', code: 'matches' };
  plan.locks.push(hl);
  hatch.needMsg = K('다락 문이 꽉 닫혀 있어. 별 모양 걸쇠네… 아래 별 랜턴에 불을 켜 볼까? 성냥이 필요해', "The attic hatch is shut tight. A star-shaped latch… Light the star lantern below? You'll need matches");
  hatch.needItem = 'matches';
  plan.placements.push({ type: 'friendtoken', spot: hatch.spots[0], role: 'target' });
  plan.targets.unshift('friendtoken');
  plan.incident = { part: hatch, lock: hl };
  plan.showcase = { kind: 'starloft', hatch };
  return plan;
};
export function planDevice(room, spec, story, planStage) {
  const part = room.parts.find(p => p.device && PLANS[p.device]);
  if (!part) return null;
  // (② 레벨 10/21: the device's own place is the friend's — kept out of the planner's reach, or a 수건 went under 30판's boat
  // cover with 냥냥이 and could not be taken once the boat came in)
  const keep = part.spots.map(x => [x, x.reserved]); for (const x of part.spots) x.reserved = true;
  try { return PLANS[part.device](room, spec, story, planStage, part); } finally { for (const [x, r] of keep) x.reserved = r; }
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
  G.ui.toast(K('짤랑! 500원 동전이 나왔어! 터치해서 집어 봐', 'Clink! A 500-won coin! Tap to take it'), 'green');
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
// 30판: the handle on the crank, the pulley hoists the 누름돌, the lid jiggles and pops
RUN.pulley = async (S, part) => {
  const G = S.G, W = G.world, tw = S.tw, f = part.furn;
  S.cine = true;
  const at = f.group.localToWorld(f.jarAt.clone()), zoom = Math.max(W.zoom, 1.9);
  await W.flyTo(tw, { yaw: clearYaw(S, [f.stone, part.pivots[0]], at, zoom), target: at, zoom, dur: .6 });
  if (S.dead) return;
  f.crank.visible = true; G.audio.sfx('pop', 2);
  await tw.wait(.25);
  if (S.friendHidden) S.hideSay([K('킁…? 돌이 움직인다?!', 'Sniff…? The stone is moving?!')]);
  G.audio.sfx('creak');
  const y0 = f.stone.position.y; let last = 0;
  await tw.run(1.7, k => {
    f.crank.rotation.z = -k * Math.PI * 8;
    f.stone.position.y = y0 + .55 * k; f.stone.rotation.y = Math.sin(k * 7) * .2; f.setRope(); W.shadowDirty = true;
    if (k - last > .12) { last = k; G.audio.sfx('tick'); }
  }, ease.inOutSine);
  // the lid, free at last: three jiggles, then it pops
  const lid = part.pivots[0], ly = lid.position.y;
  for (let i = 0; i < 3 && !S.dead; i++) { G.audio.sfx('tock', 3 + i); await tw.run(.16, k => { lid.position.y = ly + Math.sin(k * Math.PI) * .05; lid.rotation.z = Math.sin(k * Math.PI) * .12 * (i % 2 ? 1 : -1); }, ease.linear); }
  lid.position.y = ly; lid.rotation.z = 0;
  S.cine = false;
  if (S.dead) return;
  await S.togglePart(part, true);
};
// 68판: the stick in the console, a light show, smoke, the lift comes up
RUN.stagelift = async (S, part) => {
  const G = S.G, W = G.world, tw = S.tw, f = part.furn;
  S.cine = true;
  const at = f.group.localToWorld(f.centerAt.clone()), zoom = Math.max(W.zoom, 1.6);
  await W.flyTo(tw, { yaw: clearYaw(S, [f.lift], at, zoom), target: at, zoom, dur: .6 });
  if (S.dead) return;
  f.stick.visible = true; G.audio.sfx('pop', 4);
  await tw.wait(.3);
  if (S.friendHidden) S.hideSay([K('둠칫…! 조명 켜졌다?!', 'Boom-chk…! The lights are on?!')]);
  // the light show: beams sweep, notes go up, sparkles over the stage
  f.beams.forEach(b => { b.visible = true; });
  const notes = [0, 2, 4, 7, 9, 12]; let n = 0, last = 0;
  await tw.run(2.0, k => {
    f.beams.forEach((b, i) => { b.rotation.z = Math.sin(k * Math.PI * 3 + i * 2.1) * .55; b.rotation.x = -(.45 + Math.cos(k * Math.PI * 2 + i) * .2); });   // (tilted forward, over the stage)
    if (k - last > .16 && n < notes.length) { last = k; G.audio.sfx('star', notes[n++] % 5); const s = W.toScreen(at); W.fx.burst(s.x + (Math.random() - .5) * 220, s.y - 80 + (Math.random() - .5) * 60, { n: 6, shape: 'star', colors: ['#ff7fb0', '#ffe27a', '#7fe0c8', '#8fc8ff'], speed: 120, gravity: 60, size: 9 }); }
  }, ease.linear);
  // smoke round the lift, and up it comes
  const s0 = W.toScreen(f.group.localToWorld(f.centerAt.clone().setY(.4)));
  for (let i = 0; i < 3; i++) W.fx.burst(s0.x + (i - 1) * 60, s0.y + 10, { n: 8, shape: 'circle', colors: ['#ffffff', '#f2eefc', '#e8e2f6'], speed: 90, up: 60, gravity: -30, size: 16, life: 1.0 });
  G.audio.sfx('whoosh');
  S.cine = false;
  if (S.dead) return;
  await S.togglePart(part, true);
  f.beams.forEach(b => { b.visible = false; });
};
// 59판: strike a match, the lantern glows, its stars land on the wall one by one, run into the latch, the hatch opens
RUN.starloft = async (S, part) => {
  const G = S.G, W = G.world, tw = S.tw, f = part.furn, V = THREE.Vector3;
  S.cine = true;
  const at = f.group.localToWorld(f.unitAt.clone()), zoom = Math.max(W.zoom, 1.8);
  await W.flyTo(tw, { yaw: clearYaw(S, [part.pivots[0], part.pivots[2]], at, zoom), target: at, zoom, dur: .6 });
  if (S.dead) return;
  const lp = W.toScreen(f.glow.getWorldPosition(new V()));
  G.audio.sfx('swish'); W.fx.burst(lp.x, lp.y, { n: 10, colors: ['#ffb347', '#ffe27a', '#ffffff'], speed: 120, up: 60, size: 7, life: .5 });
  f.glow.visible = true; G.audio.sfx('pop', 1);
  await tw.run(.45, k => f.glow.scale.setScalar(.3 + .7 * k), ease.outBack);
  if (S.friendHidden) S.hideSay([K('…어? 별이 떴다…', '…Huh? Stars came out…')]);
  // the stars come out on the wall one by one, then the lines between them
  f.sky.visible = true; f.sky.children.forEach(c => { c.visible = false; });
  const s0 = f.stars.map(m => m.scale.x);
  for (let i = 0; i < f.stars.length && !S.dead; i++) {
    const m = f.stars[i]; m.visible = true; G.audio.sfx('star', i % 5);
    tw.run(.25, k => m.scale.setScalar(s0[i] * (k < .7 ? k / .7 * 1.3 : 1.3 - .3 * (k - .7) / .3)), ease.linear);
    await tw.wait(.13);
  }
  f.sky.children[f.sky.children.length - 1].visible = true;   // the lines
  await tw.run(.9, k => f.stars.forEach((m, i) => m.scale.setScalar(s0[i] * (1 + .25 * Math.sin(k * Math.PI * 6 + i)))), ease.linear);
  // they run into the star latch on the hatch
  f.sky.children[f.sky.children.length - 1].visible = false;
  const to = f.group.worldToLocal(f.latch.getWorldPosition(new V())), from = f.stars.map(m => m.position.clone());
  G.audio.sfx('whoosh');
  await tw.run(.6, k => f.stars.forEach((m, i) => { m.position.lerpVectors(from[i], to, k); m.scale.setScalar(s0[i] * (1 - .6 * k)); }), ease.inCubic);
  f.sky.visible = false;
  const ls = W.toScreen(f.latch.getWorldPosition(new V()));
  W.fx.burst(ls.x, ls.y, { n: 18, shape: 'star', colors: ['#ffe27a', '#fff3a8', '#ffffff'], speed: 220 }); W.fx.ring(ls.x, ls.y, { r: 70, color: '#ffe27a', width: 6 });
  G.audio.sfx('unlock');
  await tw.run(.45, k => { f.latch.rotation.z = k * Math.PI * 2; }, ease.outCubic);
  S.cine = false;
  if (S.dead) return;
  await S.togglePart(part, true);
};
export async function runDevice(S, part) {
  const R = RUN[part.device];
  return R ? R(S, part) : S.togglePart(part, true);
}

// the hiding friend's tell from inside a device (else the plain wobble):
//   the pond — bubbles and rings while it's full;  the dryer — melting pink drips under its door, the door jiggles
const TELL = {
  // the attic hatch: it rattles in its frame and a little dust drifts down from the crack
  starloft(S, dev, line) {
    const f = dev.furn, W = S.G.world, door = dev.pivots[0], r0 = door.rotation.x, p = f.group.localToWorld(f.hatchAt.clone());
    S.tw.run(.5, k => { door.rotation.x = r0 + Math.abs(Math.sin(k * Math.PI * 5)) * .05 * (1 - k); }, ease.linear).then(() => { door.rotation.x = r0; });
    S.G.audio.sfx('thunk');
    const s = W.toScreen(p.clone().setY(p.y - .3));
    W.fx.burst(s.x, s.y, { n: 6, shape: 'circle', colors: ['#e8dcc8', '#d6c6ad'], speed: 30, up: 0, gravity: 90, size: 6, life: .9 });
    S.say({ root: { position: p }, headTop: () => .3 }, line, 1300);
    return true;
  },
  // the lift stage: the lift thumps to a beat from below ("둠칫")
  stagelift(S, dev, line) {
    const f = dev.furn, lf = f.lift, y0 = lf.position.y;
    S.tw.run(.9, k => { const b = Math.max(0, Math.sin(k * Math.PI * 4)); lf.position.y = y0 + b * b * .05; }, ease.linear).then(() => { lf.position.y = y0; });
    for (let i = 0; i < 2; i++) setTimeout(() => !S.dead && S.G.audio.sfx('heart'), i * 450);
    S.say({ root: { position: f.group.localToWorld(f.centerAt.clone()) }, headTop: () => .1 }, line, 1300);
    return true;
  },
  // the pulley 장독대: a curly tail pokes out from under the big lid and wags, the lid jiggles
  pulley(S, dev, line) {
    const f = dev.furn, W = S.G.world, tl = f.tail, lid = dev.pivots[0], r0 = lid.rotation.z;
    tl.visible = true; W.shadowDirty = true;
    S.tw.run(1.3, k => { tl.rotation.z = Math.sin(k * Math.PI * 8) * .45; tl.scale.setScalar(Math.min(1, k * 6, (1 - k) * 6)); lid.rotation.z = r0 + Math.sin(k * Math.PI * 6) * .03 * (1 - k); }, ease.linear)
      .then(() => { tl.visible = false; tl.scale.setScalar(1); lid.rotation.z = r0; });
    S.G.audio.sfx('wobble');
    S.say({ root: { position: f.group.localToWorld(f.jarAt.clone()) }, headTop: () => .1 }, line, 1300);
    return true;
  },
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
  pulleyhandle: K('도르래 손잡이다! 장독대 도르래에 끼워 보자', 'The pulley handle! Fit it on the pulley over the jars'),
  lightstick: K('응원봉이다! 무대 조종판에 꽂아 보자', 'A light-stick! Put it in the stage console'),
  matches: K('성냥이다! 다락 밑 별 랜턴에 불을 켜 보자', 'Matches! Light the star lantern under the attic hatch'),
};

// ── 30판 냥냥이네 바닷가 가게 '깃발 신호' (10/21, 스토리 룸 기차 여행 편) ─────────────────────────────────────────────
// colour card → colour lock → key → padlock → the 바람개비 → into its socket on the deck's flagpole: the wind spins it, the
// signal flag runs up, the boat out on the water sees it and comes in to the deck, the cover jiggles and lifts → 냥냥이
SWAP.seaside = { seadeck: 'flagdeck' };
EN['바람개비'] ??= 'Pinwheel'; EN['보트 덮개'] ??= 'Boat cover'; EN['보트 덮개 밑'] ??= 'Under the boat cover'; EN['깃발 데크'] ??= 'Flag deck';
PLANS.flagboat = (room, spec, story, planStage, cover) => {
  const plan = planStage(room, { ...spec, lock: ['pad', 'color'], n: 4, avoid: blindFor(spec.room) }, story);
  if (!toolBehindPad(plan, room, spec, 'pinwheel', cover)) return null;
  nest(plan, 'pad', 'color');
  const bl = { part: cover, kind: 'gadget', code: 'pinwheel' };
  plan.locks.push(bl);
  cover.needMsg = K('저 보트가 데크로 와야 덮개를 열 수 있는데… 깃대 꼭대기에 바람개비 꽂는 자리가 비어 있어!', "That boat has to come in to the deck before we can lift its cover… and the pinwheel socket on top of the flagpole is empty!");
  cover.needItem = 'pinwheel';
  plan.placements.push({ type: 'friendtoken', spot: cover.spots[0], role: 'target' });
  plan.targets.unshift('friendtoken');
  plan.incident = { part: cover, lock: bl };
  plan.showcase = { kind: 'flagboat', cover };
  return plan;
};
// the pinwheel in its socket: it spins in the wind, the flag runs up the pole and flies, the boat comes in, the cover pops
RUN.flagboat = async (S, part) => {
  const G = S.G, W = G.world, tw = S.tw, f = part.furn;
  S.cine = true;
  const top = f.group.localToWorld(f.poleTop.clone()), boat = f.boat, at = f.group.localToWorld(new THREE.Vector3(-.9, .8, 1.6)), zoom = Math.max(W.zoom, 1.5);
  await W.flyTo(tw, { yaw: clearYaw(S, [f.pin.parent, boat], at, zoom), target: at, zoom, dur: .6 });
  if (S.dead) return;
  f.pin.visible = true; G.audio.sfx('pop', 3);
  await tw.wait(.2);
  G.audio.sfx('whoosh');
  await tw.run(1.0, k => { f.pin.rotation.z = -k * k * Math.PI * 10; }, ease.linear);
  if (S.dead) return;
  // the flag runs up and flies
  const fy0 = f.flag.position.y; let last = 0;
  await tw.run(1.1, k => {
    f.pin.rotation.z -= .5;
    f.flag.position.y = fy0 + (f.flagUp - fy0) * k; f.flag.scale.set(.25 + .75 * k, .7 + .3 * k, 1); f.flag.rotation.y = Math.sin(k * 14) * .15 * k;
    if (k - last > .14) { last = k; G.audio.sfx('tick'); }
    W.shadowDirty = true;
  }, ease.inOutSine);
  const s = W.toScreen(top); W.fx.burst(s.x, s.y, { n: 10, shape: 'star', colors: ['#ffe14d', '#ffffff', '#e8414e'], speed: 140, life: .5, size: 9 });
  G.audio.sfx('star');
  if (S.friendHidden) S.hideSay([K('냥? 저 깃발… 데크로 오라는 신호다냥!', 'Mew? That flag… the signal to come in to the deck!')]);
  // the boat comes in, bobbing
  const z0 = boat.position.z;
  await tw.run(1.5, k => { f.pin.rotation.z -= .35; f.flag.rotation.y = Math.sin(k * 20) * .15; boat.position.z = z0 + (f.boatIn - z0) * k; boat.position.y = Math.sin(k * Math.PI * 3) * .03; boat.rotation.z = Math.sin(k * Math.PI * 2) * .04; W.shadowDirty = true; }, ease.inOutSine);
  boat.position.y = 0; boat.rotation.z = 0;
  G.audio.sfx('thunk');
  // the cover, three jiggles, then it lifts
  const cv = part.pivots[0], cy = cv.position.y;
  for (let i = 0; i < 3 && !S.dead; i++) { G.audio.sfx('tock', 3 + i); await tw.run(.16, k => { cv.position.y = cy + Math.sin(k * Math.PI) * .05; cv.rotation.z = Math.sin(k * Math.PI) * .08 * (i % 2 ? 1 : -1); }, ease.linear); }
  cv.position.y = cy; cv.rotation.z = 0;
  S.cine = false;
  if (S.dead) return;
  await S.togglePart(part, true);
};
// the boat's cover: a cat's tail pokes out and swishes, the cover shivers
TELL.flagboat = (S, dev, line) => {
  const f = dev.furn, W = S.G.world, tl = f.tail, cv = dev.pivots[0], r0 = cv.rotation.z;
  tl.visible = true; W.shadowDirty = true;
  S.tw.run(1.3, k => { tl.rotation.z = Math.sin(k * Math.PI * 6) * .5; tl.scale.setScalar(Math.min(1, k * 6, (1 - k) * 6)); cv.rotation.z = r0 + Math.sin(k * Math.PI * 6) * .03 * (1 - k); }, ease.linear)
    .then(() => { tl.visible = false; tl.scale.setScalar(1); cv.rotation.z = r0; });
  S.G.audio.sfx('wobble');
  S.say({ root: { position: f.boat.getWorldPosition(new THREE.Vector3()) }, headTop: () => .5 }, line, 1300);
  return true;
};
DEVICE_FOUND.pinwheel = K('바람개비다! 데크 깃대 꼭대기에 꽂아 보자', 'A pinwheel! Put it on top of the flagpole on the deck');

// ── 18판 너굴이네 복층 '경품 오락기' (10/21): the password note → the code lock → the arcade token → into the red arcade: its
// screen flashes, a jingle, the prize chute's flap pops — the key for the padlock → 너굴이 behind it. (The drawer stairs'
// cubby and the comic shelf's niche open by themselves — gfx/otaku-props.js afterOpen; their places stay out of plans.)
SWAP.otakuloft = {};
EN['경품 나오는 곳'] ??= 'Prize chute';
PLANS.arcadeprize = (room, spec, story, planStage, flap) => {
  const plan = planStage(room, { ...spec, lock: ['pad', 'code'], n: 4, avoid: blindFor(spec.room) }, story);
  const P = plan.locks.find(l => l.kind === 'pad'), C = plan.locks.find(l => l.kind === 'code');
  if (!P || !C) return null;
  const used = new Set(plan.placements.map(p => p.spot));
  // the coin waits behind the code lock (in place of the thing that was there)
  const ct = plan.placements.find(p => p.role === 'target' && p.spot.part === C.part);
  if (ct) { plan.targets.splice(plan.targets.indexOf(ct.type), 1); Object.assign(ct, { type: 'gametoken', role: 'gadget', code: 'gametoken', forPart: flap }); }
  else { const s = C.part.spots.find(x => !x.reserved && !used.has(x)); if (!s) return null; plan.placements.push({ type: 'gametoken', spot: s, role: 'gadget', code: 'gametoken', forPart: flap }); }
  // the padlock's key comes out of the prize chute
  const kp = plan.placements.find(p => p.role === 'key' && p.forPart === P.part);
  const ps = flap.spots[0];
  if (kp && ps) { ps.reserved = false; kp.spot = ps; }
  // 너굴이 behind the padlock
  const tp = plan.placements.find(p => p.role === 'target' && p.spot.part === P.part);
  if (tp) { plan.targets.splice(plan.targets.indexOf(tp.type), 1); Object.assign(tp, { type: 'friendtoken' }); plan.targets.unshift('friendtoken'); }
  else { const s = P.part.spots.find(x => !x.reserved && !used.has(x)); if (!s) return null; plan.placements.push({ type: 'friendtoken', spot: s, role: 'target' }); plan.targets.unshift('friendtoken'); }
  const gl = { part: flap, kind: 'gadget', code: 'gametoken' };
  plan.locks.push(gl);
  flap.needMsg = K('경품 오락기야! 동전을 넣으면 뭔가 나올지도… 오락실 코인이 필요해', 'A prize arcade! Put a token in and something might come out… you need an arcade token');
  flap.needItem = 'gametoken';
  plan.incident = { part: P.part, lock: P };
  plan.showcase = { kind: 'arcadeprize', flap };
  return plan;
};
RUN.arcadeprize = async (S, part) => {
  const G = S.G, W = G.world, tw = S.tw, f = part.furn;
  S.cine = true;
  const at = f.group.localToWorld(f.prizeAt.clone().setY(.9)), zoom = Math.max(W.zoom, 1.9);
  await W.flyTo(tw, { yaw: clearYaw(S, [part.pivots[0]], at, zoom), target: at, zoom, dur: .6 });
  if (S.dead) return;
  G.audio.sfx('pop', 4); await tw.wait(.25);
  // the screen flashes, a little jingle
  const scr = f.screen, notes = [0, 2, 4, 7];
  for (let i = 0; i < 8 && !S.dead; i++) { if (scr) scr.visible = i % 2 === 0; if (i < notes.length) G.audio.sfx('star', notes[i]); await tw.wait(.12); }
  if (scr) scr.visible = true;
  const s = W.toScreen(f.group.localToWorld(f.prizeAt.clone()));
  W.fx.burst(s.x, s.y, { n: 14, shape: 'star', colors: ['#ffe14d', '#ffffff', '#ff6fb8'], speed: 160, life: .6, size: 10 });
  G.audio.sfx('special');
  if (S.friendHidden) S.hideSay([K('띠링! 경품 나왔다~ …앗 그거 열쇠잖아?!', 'Ding! A prize~ …wait, that\'s the key?!')]);
  S.cine = false;
  if (S.dead) return;
  await S.togglePart(part, true);
};
DEVICE_FOUND.gametoken = K('오락실 코인이다! 빨간 경품 오락기에 넣어 보자', 'An arcade token! Try it in the red prize arcade');

// ── 36·43~70판 GPT 맵 연쇄 장치 (②b 10/22, gpt-chains.js): the tool in, the machine runs, the next one goes by itself
RUN.chain = (S, part) => runChain(S, part, clearYaw);

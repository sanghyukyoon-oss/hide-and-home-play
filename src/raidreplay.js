// ① 털림 다시 보기 + 복수하러 가기 (내 집 지키기·털기 메타, 10/19 — Clash's defence replay; user: "클래시옵클랜처럼 숨기고
// 공격하는걸… 딱 아 이거구나 싶게"). Back home, the news says who came; [다시 보기] plays it in my own room: the resident
// sneaks in, sniffs where I hid things, opens drawers, rattles a padlock that holds ("자물쇠가 막았다!"), walks right past
// things it never noticed ("안 들킴!"), and runs off with the one it took. Then the tally and [복수하러 가기] straight to
// that resident's house (② 정찰). The raid is still raid.js raidOnce's dice; this only plays back its record (ev.rp).
import * as THREE from 'three';
import { Char } from './gfx/chars.js';
import { buildItem, ITEMS } from './gfx/items.js';
import { attachItem } from './room.js';
import { resolveHost, makeFreeSpot, dropFreeSpot } from './freehide.js';
import { h, ICON } from './ui.js';
import { practiceRooms } from './net.js';
import { stolenBy, residentId, shieldLeft, locksOwned, locksUsed, LOCK_PRICE, LOCK_MAX } from './raid.js';
import { setScoutList } from './raidrun.js';
import { makePractice } from './scenes/visit.js';
import { housePool } from './presets.js';

const V = new THREE.Vector3();
const ga = n => { const c = n.charCodeAt(n.length - 1); return n + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이' : '가'); };
const pick = a => a[Math.floor(Math.random() * a.length)];
const ago = t => { const m = Math.round((Date.now() - t) / 60e3); return m < 2 ? '방금' : m < 60 ? `${m}분 전` : `${Math.round(m / 60)}시간 전`; };

// 문단속 (Clash's shield): robbed once, the door stays locked for eight hours — a chip on the 내 방 lobby counts it down
export const shieldTxt = ms => { const m = Math.ceil(ms / 60e3); return m >= 60 ? `${Math.floor(m / 60)}시간` + (m % 60 ? ` ${m % 60}분` : '') : `${m}분`; };
export function shieldChip(G, top) {
  if (!shieldLeft(G.save)) return null;
  const v = h('span', { class: 'v' }), el = h('div', { class: 'shieldchip', role: 'button', tabindex: '0', style: `top:calc(${top}px + var(--safeT))`, html: ICON.lock });
  el.append(v);
  const tick = () => { const ms = shieldLeft(G.save); if (!el.isConnected && el._on) return clearInterval(el._t); el._on = true; if (!ms) { el.remove(); clearInterval(el._t); return; } const m = Math.ceil(ms / 60e3); v.textContent = `문단속 ${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
  tick(); el._t = setInterval(tick, 20e3);
  el.addEventListener('click', () => G.ui.toast(`털린 뒤라 문을 꽁꽁 잠갔어 · ${shieldTxt(shieldLeft(G.save))} 동안 아무도 못 와`, 'green'));
  return el;
}

// can this scene play it: my room (내 집 or the 내 방 lobby) with the record
export const canReplay = (S, ev) => !!(ev?.rp?.items?.length && S?.room && S.spotByKey && S.partByKey && S.openPart);

// 복수하러 가기: that resident's house, scouted first (the list for 다음 집 is the neighbourhood, robbers first)
export function goRevenge(G, who) {
  // (털 집 찾기 10/20: their house — a ready-made one or a resident's — scouted with the search's own buttons)
  const list = housePool(G, { practiceRooms, makePractice, stolenBy, residentId });
  setScoutList([]);
  const room = list.find(r => r.id === who);
  if (room) G.go('stage', { custom: { ...room, found: true }, scout: true }); else G.go('visit');
}

// how it went, from the record: things never found, the ones a lock kept, the one taken
function tally(S, ev) {
  const rp = ev.rp, partOf = e => e.free ? e.free.part || (e.free.host?.startsWith?.('p:') ? e.free.host.slice(2) : null) : S.spotByKey[e.spot]?.part?.key;
  const kept = rp.items.filter(e => !e.found), byLock = kept.filter(e => { const k = partOf(e); return k && rp.locks[k]; });
  const left = rp.items.filter(e => e.found && !e.by && e.item !== ev.item).length;   // found, but a raid takes one thing
  const byFriend = rp.items.filter(e => e.by).length;   // 친구 지킴이 (10/20)
  return { kept: kept.length, byLock: byLock.length, byFriend, left, total: rp.items.length };
}

// 친구 지킴이 (10/20): the friend sitting at home hops over to the thief, "안 돼! 몽글이 거야!", the thief backs off; back to the seat
async function friendBlock(S, k, thief, g, tw, live, floatAt) {
  const G = S.G, fr = (S.seated || []).find(s => s.k === k), tp = thief.root.position;
  floatAt(g, '친구가 막았다!', 'pink big');
  if (!fr) { S.say(thief, '앗! 친구가 지키고 있었어?', 1200); await tw.wait(1.2); return; }
  const c = fr.ch, p = c.root.position, home = p.clone(), a = Math.atan2(p.x - tp.x, p.z - tp.z);
  const to = { x: tp.x + Math.sin(a) * .62, z: tp.z + Math.cos(a) * .62 };
  G.audio.sfx('pop', 4);
  await tw.run(.4, k2 => { p.x = home.x + (to.x - home.x) * k2; p.z = home.z + (to.z - home.z) * k2; p.y = home.y + Math.sin(k2 * Math.PI) * .5; });
  if (!live()) { p.copy(home); return; }
  c.faceTo(tp.x, tp.z); c.setFace?.('angry'); c.bump?.(.4); S.say(c, '안 돼! 몽글이 거야!', 1200);
  thief.setFace('sad'); thief.bump?.(.35);
  const t0 = tp.clone(), back = { x: tp.x - Math.sin(a) * .35, z: tp.z - Math.cos(a) * .35 };
  await tw.run(.3, k2 => { tp.x = t0.x + (back.x - t0.x) * k2; tp.z = t0.z + (back.z - t0.z) * k2; });
  S.say(thief, '앗!', 700);
  await tw.wait(.9);
  c.setFace?.('happy');
  await tw.run(.4, k2 => { p.x = to.x + (home.x - to.x) * k2; p.z = to.z + (home.z - to.z) * k2; p.y = home.y + Math.sin(k2 * Math.PI) * .4; });
  p.copy(home);
}

export async function playRaidReplay(S, ev) {
  const G = S.G, W = G.world, tw = S.tw, rp = ev.rp;
  if (S.replaying || !canReplay(S, ev)) return;
  S.replaying = true;
  if (rp.zone && rp.zone !== S.zoneId && G.zoneOpen(rp.zone)) S.switchZone(rp.zone);
  // the stage: no buttons, no 몽글이 (you were out), the whole room in view
  if (S.col) S.col.style.visibility = 'hidden';
  const away = [S.mong].filter(Boolean); for (const c of away) c.root.visible = false;   // (몽글이만 외출 — 친구들은 집을 지켜요, 10/20)
  S.busyTut = true; S.visitors?.drop();
  const messed = new Set(messHere(S)); for (const p of messed) { p.setOpen(0); p.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; }); }   // (털린 흔적: shut until the resident opens them)
  const joy0 = W.joyHidden; W.joyHidden = true;
  const look = W.home.clone(); look.y += .7;   // (a raised look-at point sits the room lower on the screen, under the bar)
  W.flyTo(tw, { target: look, zoom: 1.1, dur: .6 });
  let skip = false;
  const bar = h('div', { class: 'rpbar' }, h('img', { src: G.thumbs['face_' + ev.face] || G.thumbs.face_mong }),
    h('div', { class: 'rpt' }, h('b', {}, '다시 보기'), h('span', {}, `${ago(ev.at)} · ${ga(ev.nick)} ${ev.revenge ? '복수하러 왔어' : '몰래 왔어'}`)),
    G.ui.btn('건너뛰기', { color: 'gray', cls: 'sm', onClick: () => { skip = true; } }));
  G.ui.hud.append(bar);
  // the things as they were: what's still hidden is in place; the taken one (gone since) goes back just for the replay
  const temps = [], visits = [], shut = new Set(), hiddenReal = [];
  for (const e of rp.items) {
    let it = S.items[e.item];
    if (!it) {
      let spot = null;
      if (e.free) { const host = resolveHost(S.room, e.free.host, S.partByKey, e.free.part); if (host && Array.isArray(e.free.p)) spot = makeFreeSpot(host, new THREE.Vector3(...e.free.p), e.free.ry || 0); }
      else spot = S.spotByKey[e.spot];
      if (!spot || spot.item) continue;
      const g = buildItem(e.item, { code: S.H.hide.code || '000' });
      attachItem(spot, g, { rotY: .3 });
      if (spot.part && spot.part.t < .5) g.visible = false;
      it = { type: e.item, spot, g }; spot.item = it; temps.push(it);
    }
    const part = it.spot.part || null;
    visits.push({ e, it, part, locked: !!(part && rp.locks[part.key]) });
  }
  const taken = ev.kind === 'steal' ? visits.find(v => v.e.item === ev.item) : null;
  const misses = visits.filter(v => !v.e.found).sort(() => Math.random() - .5);
  const guarded = visits.filter(v => v.e.by).slice(0, 4);   // 친구 지킴이: found, and a friend stepped in
  const seq = [...misses.filter(v => v.locked).slice(0, 1), ...misses.filter(v => !v.locked)].slice(0, Math.max(1, (taken ? 3 : 4) - guarded.length));
  seq.push(...guarded.sort(() => Math.random() - .5));
  if (taken) seq.push(taken);
  // the resident
  const ch = new Char(ev.face), room = S.room;
  const door = room.doorDecor ? room.frontOf(room.doorDecor.f) : null, [ex, ez] = door ? [door.x, door.z] : [-1.9, 2.1];
  ch.root.position.set(ex, 0, ez); ch.root.scale.setScalar(.01); ch.pose = 'search'; ch.setFace('sus');
  room.group.add(ch.root); W.idsDirty = true;
  S.update = dt => { Object.getPrototypeOf(S).update.call(S, dt); ch.update(dt); };   // (this scene's own update, plus the resident)
  const live = () => !S.dead && !skip;
  const local = g => room.group.worldToLocal(g.getWorldPosition(V.set(0, 0, 0)).clone());
  const stand = v => {
    const f = v.it.spot.furn;
    if (f?.rec && f.group) { const p = room.frontOf(f); return [p.x, p.z]; }
    const p = local(v.it.g), k = .55 / Math.max(.01, Math.hypot(p.x, p.z));
    return [p.x - p.x * k, p.z - p.z * k];
  };
  const walk = async (x, z, fast = false) => {
    const c = ch.root.position, route = S.visitors?.route(c.x, c.z, x, z) || [[x, z]];
    let ax = c.x, az = c.z;
    for (const [bx, bz] of route) {
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / .42));
      for (let i = 1; i <= n && live(); i++) await ch.hopTo(tw, ax + (bx - ax) * i / n, az + (bz - az) * i / n, { height: .18, dur: fast ? .16 : .25 });
      ax = bx; az = bz;
    }
  };
  const floatAt = (g, text, cls) => { const s = W.toScreen(g.getWorldPosition(new THREE.Vector3())), m = Math.min(120, innerWidth / 3); G.ui.floatText(Math.max(m, Math.min(innerWidth - m, s.x)), s.y - 40, text, cls); };   // (kept on screen: a thing by the edge)
  G.audio.sfx('pop', 6);
  await tw.run(.3, k => ch.root.scale.setScalar(Math.max(.01, k)));
  if (S.dead) return;
  S.say(ch, ev.revenge ? '복수하러 왔지롱!' : '쉿… 아무도 없지?', 1400);
  await tw.wait(1.2);
  let carry = null;
  for (const v of seq) {
    if (!live()) break;
    const [sx, sz] = stand(v);
    await walk(sx, sz);
    if (!live()) break;
    const p = local(v.it.g); ch.faceTo(p.x, p.z); ch.pose = 'search'; ch.setFace('sus');
    S.say(ch, pick(['킁킁…', '여기 수상한데?', '어디 보자…']), 1000);
    await tw.wait(.95); if (!live()) break;
    if (v.locked && v === taken) {   // a padlock that didn't hold (the dice: rare, never zero) — picked, then opened
      G.audio.sfx('locked'); ch.setFace('sus'); S.say(ch, '어디 보자… 딸깍!', 1200);
      await tw.wait(1.2); if (!live()) break;
      G.audio.sfx('unlock'); floatAt(v.it.g, '자물쇠를 땄어!', 'red big');
      await tw.wait(.5); if (!live()) break;
    } else if (v.locked) {   // a padlock that holds
      G.audio.sfx('locked'); const fg = v.part.furn.group, x0 = fg.position.x;
      await tw.run(.45, k => { fg.position.x = x0 + Math.sin(k * Math.PI * 8) * .03 * (1 - k); }); fg.position.x = x0;
      ch.setFace('angry'); S.say(ch, '잠겼잖아!', 1200); floatAt(v.it.g, '자물쇠가 막았다!', 'green big');
      await tw.wait(1.2); continue;
    }
    if (v.part && v.part.t < .5) { await S.openPart(v.part, true); shut.add(v.part); v.it.g.visible = true; }
    if (!live()) break;
    if (v === taken) {   // found: up it comes, and off they go with it
      ch.setFace('wow'); ch.pose = 'cheer'; S.say(ch, '찾았다!', 1000); G.audio.sfx('found', 3);
      const g = v.it.g, s0 = g.scale.x;
      await tw.run(.35, k => g.scale.setScalar(s0 * (1 + Math.sin(k * Math.PI) * .5)));
      g.visible = false; if (!temps.includes(v.it)) hiddenReal.push(g);
      carry = buildItem(v.e.item, { code: S.H.hide.code || '000' }); carry.position.set(0, ch.headTop() * .5, .3); carry.scale.setScalar(1.3); ch.root.add(carry);   // (held out in front: a bubble over the head would hide it)
      ch.setFace('happy'); S.say(ch, '헤헤, 이건 내 거~', 1200);
      await tw.wait(1.1);
      if (v.part && shut.has(v.part) && !messed.has(v.part)) { await S.openPart(v.part, false); shut.delete(v.part); }
    } else if (v.e.by) {   // found — and a friend at home jumps in (친구 지킴이)
      ch.setFace('wow'); S.say(ch, '찾았다!', 800); G.audio.sfx('found', 2);
      await tw.wait(.6); if (!live()) break;
      await friendBlock(S, v.e.by, ch, v.it.g, tw, live, floatAt);
      if (v.part && shut.has(v.part) && !messed.has(v.part)) { await S.openPart(v.part, false); shut.delete(v.part); }
    } else {   // right there, and never noticed
      ch.setFace('sad'); S.say(ch, v.part ? '없네?' : '여긴 없네~', 1000); floatAt(v.it.g, '안 들킴!', 'green');
      await tw.wait(1.0);
      if (v.part && shut.has(v.part) && !messed.has(v.part)) { await S.openPart(v.part, false); shut.delete(v.part); }   // (털린 흔적: left open)
    }
  }
  if (live()) {
    if (!taken) { ch.setFace('angry'); ch.pose = 'flail'; S.say(ch, '하나도 없잖아! 흥!', 1400); await tw.wait(1.4); }
    ch.pose = 'idle';
    if (live()) await walk(ex, ez, !!taken);
    if (live()) await tw.run(.25, k => ch.root.scale.setScalar(Math.max(.01, 1 - k)));
  }
  if (S.dead) return;
  // everything back as it is now
  for (const part of shut) if (!messed.has(part)) { part.setOpen(0); part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = false; }); }
  for (const part of messed) { part.setOpen(1); part.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = true; }); }   // (as the resident left them)
  for (const it of temps) { it.g.parent?.remove(it.g); it.spot.item = null; it.spot.itemGroup = null; if (it.spot.free) dropFreeSpot(it.spot); }
  for (const g of hiddenReal) g.visible = true;
  ch.root.parent?.remove(ch.root);
  delete S.update;
  for (const c of away) c.root.visible = true;
  S.busyTut = false; W.joyHidden = joy0; W.shadowDirty = true; W.idsDirty = true;
  bar.remove();
  if (S.col) S.col.style.visibility = '';
  if (S.lobby && S.mode === 'lobby' && !messHere(S).length) S.frameLobby?.();   // (털린 흔적 left: stay on the whole room, so the open drawers are there to shut)
  S.replaying = false;
  replayCard(S, ev);
}

// the tally: kept · a lock held · taken, the coins it paid, and what to do about it
function replayCard(S, ev) {
  const G = S.G, t = tally(S, ev), stole = ev.kind === 'steal';
  const row = (k, v, cls = '') => h('div', { class: 'lrow ' + cls }, h('span', { class: 'k' }, k), h('b', {}, v));
  const rows = [row('안 들킴', `${t.kept}개`, 'good')];
  if (t.byLock) rows.push(row('자물쇠가 막음', `${t.byLock}개`, 'good'));
  if (t.byFriend) rows.push(row('친구가 막음', `${t.byFriend}개`, 'good'));
  if (t.left) rows.push(row('들켰지만 두고 감', `${t.left}개`));
  if (stole) rows.push(row('털림', ITEMS[ev.item]?.name || '물건', 'bad'));
  G.ui.panel({
    title: stole ? '털렸다…' : '지켜 냈다!', color: stole ? 'red' : 'green', cls: 'rpend',
    body: [h('div', { class: 'rpface' }, h('img', { src: G.thumbs['face_' + ev.face] || G.thumbs.face_mong }), ...(stole ? [h('img', { class: 'ri', src: G.thumbs['item_' + ev.item] })] : [])),
      h('div', { class: 'loottab' }, ...rows),
      ...(ev.coins ? [h('div', { class: 'txt' }, `못 찾은 물건 덕에 코인 +${ev.coins} (이미 받았어)`)] : []),
      ...(stole && shieldLeft(G.save) ? [h('div', { class: 'shieldline', html: ICON.lock }, h('span', {}, `문단속! ${shieldTxt(shieldLeft(G.save))} 동안 아무도 못 와`))] : []),
      h('div', { class: 'txt' }, stole ? `${ga(ev.nick)} 집에 가서 찾으면 되찾을 수 있어!` : '잘 숨겨 둔 덕분이야!'),
      ...(messHere(S).length ? [h('div', { class: 'txt sm' }, `열어 놓고 간 서랍 ${messHere(S).length}개 · 터치하면 닫혀`)] : [])],
    buttons: stole
      ? [G.ui.btn('더 꽁꽁 숨기기', { color: 'orange', cls: 'sm', onClick: () => { G.ui.closePanel(); S.setMode('hide'); } }),   // (UI ②: 주황 = 내 집, 초록 하나 = 제일 할 일)
        G.ui.btn('복수하러 가기', { color: 'green', cls: 'big', onClick: () => { G.ui.closePanel(); goRevenge(G, ev.who); } })]
      : [G.ui.btn('더 꽁꽁 숨기기', { color: 'orange', cls: 'sm', onClick: () => { G.ui.closePanel(); S.setMode('hide'); } }),
        G.ui.btn('좋아!', { color: 'green', cls: 'big', onClick: () => G.ui.closePanel() })],
  });
}

// ── 털린 흔적 (10/19, user via 인수인계: "내 방 털고 가면 문·서랍 같은 걸 다 열고 가서, 닫는 거 정리해 줘야 되는 거 어때?").
// The drawers, lids and doors a resident went through stay open when you come home — you see at once that someone was
// here. A tap shuts each one (탁!); shutting the last pays a little. Leaving them open costs nothing: Clash gave up
// making you re-arm traps by hand because it was a chore. A lock that held stays shut; the replay opens them in order.
const MESS_PAY = 10;
const partOfEntry = (S, e) => e.free ? (e.free.part ? S.partByKey[e.free.part] : (e.free.host?.startsWith?.('p:') ? S.partByKey[e.free.host.slice(2)] : null)) : S.spotByKey[e.spot]?.part;
// after build: the raids on this zone not looked at yet leave their parts open (once per raid); then open them all
export function messOpen(S) {
  const G = S.G, H = S.H, R = G.save.raid;
  if (!S.partByKey) return;
  const mess = new Set(H.mess || []);
  let changed = false;
  for (const ev of R?.log || []) {
    if (!ev.rp || ev.messed || ev.rp.zone !== S.zoneId) continue;
    ev.messed = true; changed = true;
    for (const e of ev.rp.items) { const p = partOfEntry(S, e); if (p && !ev.rp.locks[p.key] && !H.hide.locks?.[p.key]) mess.add(p.key); }
  }
  // (only this zone's parts that still exist and aren't locked now)
  const here = [...mess].filter(k => S.partByKey[k] && !H.hide.locks?.[k]);
  const other = (H.mess || []).filter(k => !S.partByKey[k]);
  H.mess = [...new Set([...other, ...here])];
  for (const k of here) { const p = S.partByKey[k]; p.setOpen(1); p.spots.forEach(s => { if (s.itemGroup) s.itemGroup.visible = true; }); }
  if (changed) G.persist();
}
export const messHere = S => (S.H.mess || []).map(k => S.partByKey?.[k]).filter(Boolean);
// a part shut by hand (MyHomeScene.openPart): 탁! — the last one pays
export function messShut(S, part) {
  const G = S.G, H = S.H;
  if (S.replaying || !H.mess?.includes(part.key)) return;
  H.mess = H.mess.filter(k => k !== part.key);
  const W = G.world, s = W.toScreen((part.pivots?.[0] || part.furn.group).getWorldPosition(new THREE.Vector3()));
  G.ui.floatText(s.x, s.y - 30, '탁!', 'gold'); W.fx.burst(s.x, s.y, { n: 8, shape: 'star', colors: ['#ffffff', '#fff3a0'], speed: 140, gravity: 40 });
  if (!messHere(S).length) { G.addCoins(MESS_PAY); G.audio.sfx('coin'); G.ui.toast(`정리 끝! 털린 흔적이 싹 사라졌어 +${MESS_PAY}`, 'green'); if (S.lobby && S.mode === 'lobby') setTimeout(() => !S.dead && S.frameLobby?.(), 900); }
  G.persist();
}

// ── 자물쇠가 모자랄 때: one more, right here (or the shop's 물건 tab)
export function askBuyLock(G, onBought) {
  const owned = locksOwned(G.save);
  if (owned >= LOCK_MAX) { G.ui.toast(`자물쇠는 ${LOCK_MAX}개까지야 · 다른 데 걸린 걸 풀어서 옮겨 봐`, 'red'); G.audio.sfx('miss'); return; }
  const buy = () => {
    if (G.save.coins < LOCK_PRICE) { G.ui.toast('코인이 모자라!', 'red'); G.audio.sfx('miss'); return; }
    G.addCoins(-LOCK_PRICE); G.audio.sfx('buy'); G.save.raid.locksOwned = owned + 1; G.persist();
    G.ui.closePanel(); G.ui.toast(`자물쇠 ${owned + 1}개째!`, 'green'); onBought?.();
  };
  G.ui.panel({ title: '자물쇠가 다 쓰였어', color: 'orange', cls: 'lockbuy',
    body: [h('div', { class: 'lockicon', html: ICON.lock }), h('div', { class: 'txt' }, `지금 ${locksUsed(G.save)}개를 다 걸었어. 하나 더 살까?`), h('div', { class: 'txt sm' }, '잠근 서랍 속 물건은 동네 주민이 거의 못 털어 가')],
    buttons: [G.ui.btn('나중에', { color: 'gray', cls: 'sm', onClick: () => G.ui.closePanel() }),
      G.ui.btn(`사기 ${LOCK_PRICE}`, { color: 'green', icon: 'coin', cls: 'big', onClick: buy })] });
}
